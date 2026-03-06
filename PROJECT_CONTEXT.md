# GymPlanner — Project Context

> **For GitHub Copilot:** Read this file at the start of every session instead of re-reading all source files from scratch. Update it whenever significant changes are made.

---

## Custom Instructions

<!-- Add your personal instructions here. Copilot will follow these every session. -->

- Never use `window.confirm` — always use inline styled prompts / modals
- Don't Push to GitHub after every completed feature unless told otherwise because I want to test the feature locally first then push it to prod
- Keep all API calls as GET requests (no POST) to avoid Apps Script CORS issues
- Prefer editing existing files over creating new ones
- Keep solutions simple — no over-engineering or extra abstractions
- Always ask before starting coding, because first i want to have a proper discussion about the feature that is being implemented.
- Confirm everything before doing it yourself

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Google Sheets + Google Apps Script |
| Persistence | localStorage (instant cache) + Sheets (persistent sync) |
| Hosting | GitHub Pages / local dev on `localhost:5173` |
| Repo | https://github.com/PerspicaciousGuy/GymPlanner (`main` branch) |

---

## Google Sheets Setup

- **Spreadsheet tabs:** Schedule, Workouts, Completion, ExerciseDatabase
- **Apps Script URL:** stored in `.env` as `VITE_APPS_SCRIPT_URL` — never committed to git
- **All requests use GET** — objects are JSON-encoded into query params via `callApi()` in `src/utils/api.js`
- **Supported actions** (pass as `?action=...`):
  - `getSchedule` / `saveSchedule`
  - `getWorkouts` / `saveWorkout`
  - `getCompletion` / `markComplete`
  - `getExerciseDatabase` / `saveExercise` / `deleteExercise`

---

## Project Structure

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Router
├── pages/
│   ├── WorkoutSchedulerPage.jsx      # Main page — accordion with today/yesterday/tomorrow
│   ├── SchedulerPage.jsx             # Schedule config page (sets muscle groups per day)
│   └── ExercisePlannerPage.jsx       # (unused / future)
├── components/
│   ├── WorkoutSection.jsx            # Day card — AM/PM tabs, groups, save/complete
│   ├── ExerciseGroup.jsx             # Group card — table header + rows + add row button
│   ├── ExerciseRow.jsx               # One exercise row (9 columns)
│   ├── Navbar.jsx                    # Top nav bar
│   └── SchedulerTable.jsx            # Schedule grid (used on SchedulerPage)
├── utils/
│   ├── api.js                        # All Sheets API calls (GET only)
│   └── storage.js                    # localStorage helpers + Sheets sync wrappers
└── data/
    ├── ampmTitles.js                 # Static AM/PM workout titles per weekday
    ├── exerciseDatabase.js           # Static fallback exercise list (used if Sheets cache missing)
    └── exercises.js                  # (legacy/unused)
```

---

## Key Files — What Each Does

### `src/utils/api.js`
- `callApi({action, ...params})` — builds GET URL, fetches with `redirect:'follow'`
- Exports: `apiGetSchedule`, `apiSaveSchedule`, `apiGetWorkouts`, `apiSaveWorkout`, `apiGetCompletion`, `apiMarkComplete`, `apiGetExerciseDatabase`, `apiSaveExercise`, `apiDeleteExercise`, `apiFetchAll`
- `apiFetchAll()` — fetches schedule + completion + exerciseDb in parallel; exerciseDb has graceful fallback if endpoint fails

### `src/utils/storage.js`
**localStorage keys:**
| Key | Purpose |
|---|---|
| `gymplanner_schedule` | Map of `{Monday: 'Chest', ...}` |
| `gymplanner_workouts` | Map of `{Monday: {am: {groups:[...]}, pm: {groups:[...]}}}` |
| `gymplanner_completion` | Map of `{Monday_am: true, Monday_pm: true, ...}` |
| `gymplanner_exercise_db` | Cached exercise DB from Sheets `{Muscle: {SubMuscle: [names]}}` |

**Key exports:**
- `defaultRow()` → `{muscle, subMuscle, exercise, sets, reps, weight, dropSets, dropWeight}` (all `''`)
- `defaultGroup()` → `{rows: [3 defaultRows]}`
- `defaultSession()` → `{groups: [2 defaultGroups]}`
- `defaultDayWorkout()` → `{am: defaultSession(), pm: defaultSession()}`
- `ensureAmPm(data)` — migrates old single-session format to am/pm
- `getMuscleGroupKeys()` / `getSubMusclesForMuscle(m)` / `getExercisesForSubMuscle(m, sm)` — read from Sheets cache (with `isValidDb()` guard), fall back to static DB
- `addExerciseToCache(m, sm, name)` / `removeExerciseFromCache(m, sm, name)`
- `isDayComplete(day, session)` — checks `{day}_{session}` key
- `markDayComplete(day, session)` — sets `{day}_{session}: true`
- `syncFromSheets()` — fetches all from Sheets, updates localStorage; guards against bad/empty data

### `src/components/WorkoutSection.jsx`
- Props: `{day, muscleGroup, isMissed, isTomorrow, initialData, hideBadge}`
- State: `dayData`, `activeSession` ('am'|'pm'), `saveFlash`, `amDone`, `pmDone`
- **AM / PM tab switcher** — clicking tab switches active session; completed tab shows ✓ badge
- Each session has its own exercise groups, Add Group button, and "Mark AM/PM Complete" button
- `handleComplete` — saves workout, marks active session complete in localStorage+Sheets, clears that session's groups only
- `handleSave` — saves both sessions to localStorage+Sheets

### `src/components/ExerciseGroup.jsx`
- Props: `{groupIndex, group, onChange}`
- Table with 9 column headers (last is empty — for delete row button)
- `handleDeleteRow(idx)` — removes row from group
- `handleAddRow()` — appends `defaultRow()` to group
- Renders `ExerciseRow` for each row, passing `onDelete`
- `+ Add Row` button below table

### `src/components/ExerciseRow.jsx`
- Props: `{row, onChange, onDelete}`
- 9 columns: Muscle Group (140px) | Sub Muscle (140px) | Exercise (220px) | Sets (90px) | Reps (90px) | Weight (120px) | Drop Set (100px) | Drop Weight (140px) | × delete
- All numeric fields are `type="text"` (free text accepted)
- Exercise column: dropdown + inline "Add new exercise" flow (Enter to confirm, Escape to cancel)
- 🗑 button next to selected exercise → shows **inline red confirm card** (Delete / Cancel) — no `window.confirm`
- `onDelete` (×) removes the row from its group

### `src/pages/WorkoutSchedulerPage.jsx`
- Shows accordion for yesterday (if missed), today, tomorrow
- `syncFromSheets()` called on mount → `syncState` ('loading'|'ok'|'offline') controls banner
- "Missed" = yesterday has a muscle group scheduled, not Rest, and neither AM nor PM is complete
- `useMemo` re-derives sections when `syncState` changes

### `src/data/ampmTitles.js`
- Static `AM_TITLES` and `PM_TITLES` maps per weekday — locked by training plan

---

## Data Flow

```
User interaction
  → React state update (instant)
  → localStorage write (instant)
  → Sheets API call in background (fire-and-forget, failures logged to console)

On page load:
  syncFromSheets() → localStorage updated → React re-renders from fresh data
```

---

## Completed Features

- [x] Google Sheets sync (all-GET, CORS-safe)
- [x] Schedule sync guarded against empty Sheets overwriting local data
- [x] AM / PM independent session tabs — complete each separately
- [x] Exercise table: free-text inputs for Sets, Reps, Weight, Drop Set, Drop Weight
- [x] Add new exercise inline → saves to Sheets ExerciseDatabase tab
- [x] Delete exercise from DB → inline confirm card (no window.confirm)
- [x] Delete row (× button per row)
- [x] Add Row per group
- [x] Dynamic groups — starts at 2, `+ Add Group` button adds more
- [x] Mark session Complete → clears that session's groups, other session untouched
- [x] ExerciseDatabase tab in Sheets as source of truth (synced on load, validates response)
- [x] Bad Sheets response guard (`isValidDb`) — prevents `{error: ...}` from polluting dropdown
- [x] Strip empty rows before Sheets sync — blank PM sessions are never written to Sheets
- [x] PWA support — installable on phone, offline caching via service worker
- [x] Apps Script URL moved to `.env` (`VITE_APPS_SCRIPT_URL`) — no longer hardcoded in repo

---

## Known Decisions / Constraints

- **No POST requests** — Apps Script redirects POSTs causing CORS failures; everything goes through GET
- **localStorage first** — UI never waits for Sheets; Sheets is background sync only
- **Static `exerciseDatabase.js`** — kept as fallback when Sheets cache is absent or invalid
- **AM titles are display-only** — `ampmTitles.js` is hardcoded; not editable from UI yet
- **Single set of groups per session** — no separate AM/PM exercise split within one session
- **Apps Script URL in `.env`** — never commit `.env`; add `VITE_APPS_SCRIPT_URL` in Vercel dashboard for production
- **Firebase project exists but not yet integrated** — project `gymplanner-97ad0` created, Firestore ready; migration deferred

---

## Latest Git Commits (most recent first)

| Commit | Description |
|---|---|
| `2151a89` | Move Apps Script URL to env variable — remove hardcoded key from repo |
| `6b18cfc` | Add vite-plugin-pwa to lockfile |
| `db9ce96` | Add PWA support — manifest, service worker, icons, offline caching |
| `7c2d040` | Independent AM/PM tabs, strip empty Sheets rows, updated README |
| `4ed096e` | Add PROJECT_CONTEXT.md with full project context and custom instructions |
| `957d0cb` | Replace window.confirm with inline styled delete confirmation prompt |
| `7c24bdb` | Fix: validate exerciseDb response before caching to prevent {error} in dropdown |
| `bd30b77` | ExerciseDB from Sheets, delete row, add row, dynamic groups, clear on complete |

---

## How to Run

```bash
cd D:\Projects\GymPlanner
npm run dev       # starts Vite dev server on localhost:5173
npm run build     # production build → dist/
```

**Environment setup:** Copy `.env.example` to `.env` and fill in your Apps Script URL:
```
VITE_APPS_SCRIPT_URL=your_apps_script_url_here
```
Also add this variable in Vercel dashboard under Settings → Environment Variables.

---

## Pending / Future Ideas

- [ ] Schedule configurator UI (currently only editable in localStorage)
- [ ] Workout history page (browse past days from Sheets Workouts tab)
- [ ] Progressive overload tracking (highlight weight vs. last session)
- [ ] Weekly summary badges (Mon–Sun completion status at top)
- [ ] Notes field per group (free-text area below each group's table)
- [ ] Firebase/Firestore migration (project `gymplanner-97ad0` already created — replace `api.js` only)
