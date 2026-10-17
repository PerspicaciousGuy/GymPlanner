import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const screenshotDir = new URL('../temp/open-muscle-map-verification/', import.meta.url);
const muscleDir = new URL('../src/components/InteractiveMuscleMap/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('vendor/muscles.json', muscleDir), 'utf8'));
const selectableIds = catalog.muscles.filter(muscle => muscle.selectable).map(muscle => muscle.id);
const problems = [];
const server = await createServer({ server: { host: '127.0.0.1', port: 0, hmr: false } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/`;
const browser = await chromium.launch();
await mkdir(screenshotDir, { recursive: true });

async function openPage(path = 'e2e/open-muscle-map.fixture.html', options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, ...options });
  const page = await context.newPage();
  page.on('pageerror', error => { problems.push(error.message); console.error(error.message); });
  page.on('console', message => { if (message.type() === 'error') { problems.push(message.text()); console.error(message.text()); } });
  await page.goto(new URL(path, base).href);
  return page;
}

function region(page, id, side = 'right', view = 'front') {
  return page.locator(`.open-muscle-map [data-muscle-id="${id}"][data-side="${side}"][data-view="${view}"][data-selectable="true"]`).first();
}

async function selectedCount(page) {
  return page.locator('.open-muscle-map [data-selected="true"]').count();
}

async function verifySelection(page) {
  await region(page, 'lateral_deltoid').click();
  const payload = await page.evaluate(() => window.payloads.at(-1));
  assert.equal(payload.muscleId, 'lateral_deltoid');
  assert.equal(payload.side, 'right');
  assert.equal(payload.view, 'front');
  assert.equal(payload.selectionKey, 'right:lateral_deltoid');
  assert.equal(payload.selected, true);
  assert.equal(await region(page, 'lateral_deltoid', 'right', 'rear').getAttribute('aria-pressed'), 'true');
  assert.match(await page.getByRole('region', { name: 'Interactive muscle map' }).innerText(), /Not tracked separately/);
  await region(page, 'lateral_deltoid', 'right', 'rear').click();
  assert.equal(await selectedCount(page), 0);
  await region(page, 'pectoralis_major').click();
  assert.equal(await page.evaluate(() => window.groupClicks.at(-1)), 'chest');
  assert.equal(await page.locator('.open-muscle-map [data-selectable="false"][role="button"]').count(), 0);
  console.log('PASS: payload, anatomical side, linked panels, mapping, non-muscle exclusion');
}

async function verifyKeyboard(page) {
  await page.getByRole('button', { name: 'Back', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.selectable), 'true');
  await page.keyboard.press('Enter');
  assert.ok(await selectedCount(page) > 0);
  await page.keyboard.press('Escape');
  assert.equal(await selectedCount(page), 0);
  await page.keyboard.press('Space');
  assert.ok(await selectedCount(page) > 0);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  assert.equal(await selectedCount(page), 0);
  console.log('PASS: Tab, Enter, Space, Escape, Clear');
}

async function verifyModelsAndModes(page) {
  for (const model of ['female', 'male']) {
    await page.getByRole('button', { name: model === 'female' ? 'Female' : 'Male', exact: true }).click();
    await region(page, 'pectoralis_major').click();
    assert.equal(await page.evaluate(() => window.payloads.at(-1).sex), model);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    assert.equal(await page.locator('.open-muscle-map svg').getAttribute('viewBox'), '627 0 627 1254');
    await page.getByRole('button', { name: 'Both', exact: true }).click();
  }
  await page.evaluate(() => window.renderMap({ multiple: true, bilateral: true }));
  await region(page, 'biceps_brachii').click();
  await region(page, 'pectoralis_major').click();
  assert.equal(await page.getByRole('region', { name: 'Interactive muscle map' }).locator('li').count(), 2);
  assert.equal(await region(page, 'pectoralis_major', 'left').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => window.payloads.at(-1).selectionKey), 'both:pectoralis_major');
  await page.evaluate(() => window.remount());
  await region(page, 'pectoralis_major').click();
  assert.equal(await page.getByRole('button', { name: 'Clear selection', exact: true }).count(), 1);
  console.log('PASS: both models, views, multiple/bilateral modes, StrictMode remount');
}

async function verifyRecoveryAndLayout(page) {
  await page.evaluate(() => window.renderMap({ muscleStats: { chest: { status: 'fatigued' } } }));
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await page.mouse.move(0, 0);
  const chest = region(page, 'pectoralis_major');
  assert.equal(await chest.getAttribute('data-recovery-status'), 'fatigued');
  const fill = await chest.locator('path').first().evaluate(path => getComputedStyle(path).fill);
  await page.evaluate(() => window.renderMap({ muscleStats: { chest: { status: 'recovered' } } }));
  await page.waitForFunction(() => document.querySelector('[data-muscle-id="pectoralis_major"]').dataset.recoveryStatus === 'recovered');
  assert.notEqual(await chest.locator('path').first().evaluate(path => getComputedStyle(path).fill), fill);
  const actualIds = await page.evaluate(() => Object.keys(window.mapping).sort());
  assert.deepEqual(actualIds, selectableIds.sort());
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), theme === 'dark');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL(`component-${theme}-mobile.png`, screenshotDir)) });
    }
  }
  console.log('PASS: recovery updates, complete ID coverage, responsive light/dark layouts');
}

async function verifyHostPages() {
  const page = await openPage('?capture=analytics');
  await page.getByRole('tab', { name: 'Recovery', exact: true }).last().click();
  await region(page, 'pectoralis_major').click();
  await page.getByText('Pectoralis major (chest) (right)', { exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('recovery-desktop.png', screenshotDir)) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL('recovery-mobile.png', screenshotDir)) });
  const daily = await openPage();
  await daily.evaluate(() => {
    const date = new Date(); date.setDate(date.getDate() - 1);
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    localStorage.setItem('gymplanner_workouts', JSON.stringify({ [key]: { am: {
      groups: [], standaloneExercises: [{ exercise: 'Bench Press', muscle: 'Chest', sets: [{ weight: '60', reps: '8' }] }],
    }, pm: { groups: [], standaloneExercises: [] } } }));
  });
  await daily.goto(new URL('e2e/open-muscle-map.fixture.html?daily', base).href);
  await region(daily, 'pectoralis_major').waitFor();
  assert.equal(await region(daily, 'pectoralis_major').getAttribute('data-recovery-status'), 'active');
  await daily.screenshot({ path: fileURLToPath(new URL('daily-focus-desktop.png', screenshotDir)) });
  console.log('PASS: real Recovery page and daily-detail training-focus integration');
}

async function verifyTouch() {
  const page = await openPage('e2e/open-muscle-map.fixture.html', {
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  });
  await region(page, 'pectoralis_major').tap();
  assert.equal(await page.evaluate(() => window.payloads.at(-1).side), 'right');
  await page.getByRole('button', { name: 'Female', exact: true }).tap();
  await region(page, 'lateral_deltoid', 'right', 'rear').tap();
  assert.equal(await page.evaluate(() => window.payloads.at(-1).sex), 'female');
  assert.equal(await region(page, 'lateral_deltoid').getAttribute('aria-pressed'), 'true');
  console.log('PASS: mobile touch emulation for both models');
}

try {
  const page = await openPage();
  await region(page, 'pectoralis_major').waitFor();
  await verifySelection(page);
  await verifyKeyboard(page);
  await verifyModelsAndModes(page);
  await verifyRecoveryAndLayout(page);
  await verifyHostPages();
  await verifyTouch();
  assert.deepEqual(problems, [], 'console or page errors');
  console.log('PASS: no browser console or page errors');
} finally {
  await browser.close();
  await server.close();
}
