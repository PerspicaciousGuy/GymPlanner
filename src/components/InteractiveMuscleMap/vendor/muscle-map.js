/* Dependency-free SVG interaction controller. Use inline SVG, not an <img>. */
(function (scope) {
  'use strict';
  const instances = new WeakMap();
  const boxes = { both: '0 0 1254 1254', front: '0 0 627 1254', rear: '627 0 627 1254' };
  function readRegion(element) {
    const d = element.dataset;
    return {
      regionId: d.regionId, regionKey: d.regionKey, muscleId: d.muscleId,
      muscleName: d.muscleName, muscleGroup: d.muscleGroup,
      side: d.side, view: d.view, sex: d.sex, subregion: d.subregion || null,
      kind: d.kind, mappingPrecision: d.mappingPrecision,
      selectable: d.selectable === 'true', selectionKey: d.selectionKey
    };
  }
  // Blend low -> high by t in [0,1]; relies on CSS color-mix (all current browsers).
  function heatColor(t, low = '#3b82f6', high = '#ef4444') {
    if (!Number.isFinite(t)) throw new TypeError('Heat values must be finite numbers.');
    return 'color-mix(in srgb, ' + high + ' ' + Math.round(Math.min(1, Math.max(0, t)) * 100) + '%, ' + low + ')';
  }
  function createMuscleMap(svg, options = {}) {
    if (!svg || svg.localName !== 'svg') throw new TypeError('Pass the inline SVG element.');
    if (instances.has(svg)) throw new Error('This SVG already has a controller; call destroy() before rebinding.');
    const { multiple = false, bilateral = false, onSelect, onChange, bridge = false } = options;
    const elements = Array.from(svg.querySelectorAll('[data-region-id][data-selectable="true"]'));
    const selected = new Set();
    let destroyed = false;
    const keyFor = element => (bilateral ? 'both:' + element.dataset.muscleId : element.dataset.selectionKey);
    const allowed = new Set(elements.map(keyFor));
    const validSide = side => side === 'left' || side === 'right' || side === 'both';
    function normalize(key) {
      if (typeof key !== 'string') return '';
      const [side, muscleId, extra] = key.split(':');
      if (extra || !validSide(side) || !muscleId) return '';
      return (bilateral ? 'both' : side) + ':' + muscleId;
    }
    function draw() {
      for (const e of elements) {
        const active = selected.has(keyFor(e));
        e.dataset.selected = String(active);
        e.setAttribute('aria-pressed', String(active));
      }
    }
    function state() {
      return Array.from(selected).map(key => {
        const e = elements.find(e => keyFor(e) === key), region = readRegion(e);
        return { selectionKey: key, muscleId: region.muscleId, muscleName: region.muscleName,
          muscleGroup: region.muscleGroup, side: bilateral ? 'both' : region.side };
      });
    }
    function dispatch(name, detail) {
      const EventType = svg.ownerDocument.defaultView.CustomEvent;
      svg.dispatchEvent(new EventType(name, { detail, bubbles: true }));
    }
    function changed() {
      const value = state();
      dispatch('musclemap:change', value);
      if (onChange) onChange(value);
    }
    function activate(element) {
      if (destroyed) return;
      const key = keyFor(element), wasSelected = selected.has(key);
      if (!multiple) selected.clear();
      if (wasSelected) selected.delete(key); else selected.add(key);
      draw();
      const detail = { ...readRegion(element), selectionKey: key, selected: !wasSelected };
      dispatch('musclemap:select', detail);
      if (onSelect) onSelect(detail);
      if (bridge) {
        const win = svg.ownerDocument.defaultView;
        const message = { type: 'musclemap:select', payload: detail };
        if (win.ReactNativeWebView?.postMessage) win.ReactNativeWebView.postMessage(JSON.stringify(message));
        else win.webkit?.messageHandlers?.muscleMap?.postMessage(message);
      }
      changed();
    }
    function target(event) {
      const e = event.target?.closest?.('[data-region-id][data-selectable="true"]');
      return e && svg.contains(e) ? e : null;
    }
    const click = event => { const e = target(event); if (e) activate(e); };
    const keydown = event => {
      if (event.key === 'Escape') { api.clear(); return; }
      const e = target(event);
      if (e && !event.repeat && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault(); activate(e);
      }
    };
    const api = {
      svg,
      getSelected: state,
      getSelectedKeys: () => Array.from(selected),
      setSelected(keys) {
        if (destroyed) return;
        const cleaned = Array.from(new Set(keys.map(normalize))).filter(k => allowed.has(k));
        selected.clear();
        for (const k of multiple ? cleaned : cleaned.slice(0, 1)) selected.add(k);
        draw(); changed();
      },
      clear() { if (!destroyed) { selected.clear(); draw(); changed(); } },
      // values: { muscleId: number 0..1 | CSS colour string }; replaces any earlier colours.
      setColors(values, opts = {}) {
        if (destroyed) return;
        const ids = new Set(elements.map(e => e.dataset.muscleId));
        const next = new Map();
        for (const [id, v] of Object.entries(values)) {
          if (!ids.has(id)) throw new RangeError('Unknown muscleId: ' + id);
          next.set(id, typeof v === 'string' ? v : heatColor(v, opts.low, opts.high));
        }
        api.clearColors();
        if (!svg.querySelector('style[data-heat-style]')) {
          const style = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
          style.setAttribute('data-heat-style', '');
          style.textContent = '[data-heat] path { fill: var(--heat); }';
          svg.prepend(style);
        }
        for (const e of elements) {
          const c = next.get(e.dataset.muscleId);
          if (c) { e.dataset.heat = ''; e.style.setProperty('--heat', c); }
        }
      },
      clearColors() {
        for (const e of elements) { delete e.dataset.heat; e.style.removeProperty('--heat'); }
      },
      setView(view) {
        if (!Object.prototype.hasOwnProperty.call(boxes, view)) throw new RangeError('View must be both, front, or rear.');
        svg.setAttribute('viewBox', boxes[view]);
        svg.setAttribute('width', view === 'both' ? '1254' : '627');
        svg.setAttribute('height', '1254');
        for (const g of svg.querySelectorAll(':scope > g')) {
          const groupView = g.id.endsWith('-front') ? 'front' : 'rear';
          g.style.display = view === 'both' || view === groupView ? '' : 'none';
        }
      },
      destroy() {
        if (destroyed) return;
        selected.clear(); draw(); api.clearColors();
        svg.removeEventListener('click', click); svg.removeEventListener('keydown', keydown);
        instances.delete(svg); destroyed = true;
      }
    };
    svg.addEventListener('click', click); svg.addEventListener('keydown', keydown);
    instances.set(svg, api);
    if (options.selectedKeys) api.setSelected(options.selectedKeys);
    if (options.view) api.setView(options.view);
    return api;
  }
  const api = { createMuscleMap, readRegion, heatColor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (scope) scope.MuscleMap = api;
})(typeof window !== 'undefined' ? window : globalThis);
