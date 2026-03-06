# 💪 GymPlanner

A personal daily workout scheduler with Google Sheets as a backend. Log AM and PM sessions independently, track exercises per muscle group, and sync everything to a spreadsheet — all from a clean React UI.

---

## Features

- **AM / PM session tabs** — log morning and evening workouts independently; complete each separately
- **Exercise table** — per-group rows with Muscle Group, Sub Muscle, Exercise, Sets, Reps, Weight, Drop Set, Drop Weight
- **Exercise database** — sourced from a Google Sheets tab; add or delete exercises directly from the UI
- **Dynamic groups & rows** — start with 2 groups, add more with a button; add/remove rows per group
- **Google Sheets sync** — all data persists to Sheets in the background; localStorage used as instant cache
- **Missed workout detection** — yesterday shows a "Missed Workout" badge if neither AM nor PM was completed
- **Clean Sheets output** — only rows with actual data are written; blank sessions are never saved

---

## Tech Stack

| | |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Google Sheets + Apps Script |
| Storage | localStorage (cache) + Sheets (persistent) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

Dev server runs at `http://localhost:5173`.

---

## Google Sheets Setup

The app expects a Google Spreadsheet with these four tabs:

| Tab | Purpose |
|---|---|
| `Schedule` | Maps each weekday to a muscle group |
| `Workouts` | Stores logged exercise rows per day/session |
| `Completion` | Tracks which day/session has been marked complete |
| `ExerciseDatabase` | Source of truth for the exercise dropdown |

Set your Apps Script deployment URL in `src/utils/api.js`:

```js
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

All API calls use **GET requests** — no POST — to avoid Apps Script CORS redirect issues.

---

## Project Structure

```
src/
├── pages/
│   ├── WorkoutSchedulerPage.jsx   # Main page — today / yesterday / tomorrow accordion
│   └── SchedulerPage.jsx          # Muscle group schedule config
├── components/
│   ├── WorkoutSection.jsx         # Day card with AM/PM tabs
│   ├── ExerciseGroup.jsx          # Group card — table + add/delete rows
│   ├── ExerciseRow.jsx            # Single exercise row
│   └── Navbar.jsx
├── utils/
│   ├── api.js                     # All Sheets API calls
│   └── storage.js                 # localStorage helpers + sync wrappers
└── data/
    ├── ampmTitles.js              # Static AM/PM titles per weekday
    └── exerciseDatabase.js        # Fallback exercise list (used if Sheets cache missing)
```

---

> For full developer context, architecture decisions, and Copilot instructions see [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
