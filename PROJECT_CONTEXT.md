# GymPlanner - Project Context

This document provides a fast orientation for contributors and coding agents.

## Current Architecture

- Frontend: React + Vite + Tailwind CSS
- Auth: Firebase Authentication (Email/Password)
- Cloud storage: Firestore (per-user planner docs)
- Local storage: localStorage (local-first writes)
- PWA: vite-plugin-pwa + Workbox

## Cloud Data Model

Firestore path:

- `users/{uid}/planner/schedule`
- `users/{uid}/planner/workouts`
- `users/{uid}/planner/completion`
- `users/{uid}/planner/exerciseDb`
- `users/{uid}/planner/sessionTitles`

## Key Local Storage Keys

- `gymplanner_schedule`
- `gymplanner_workouts`
- `gymplanner_completion`
- `gymplanner_custom_exercises`
- `gymplanner_exercise_db`
- `gymplanner_session_titles`

## Important Files

- `src/utils/firebase.js`: Firebase initialization and `isFirebaseConfigured`
- `src/hooks/useFirebaseAuth.js`: auth state, sign in/out helpers
- `src/utils/cloudSync.js`: Firestore read/write helpers
- `src/utils/storage.js`: local persistence plus cloud sync wrappers
- `src/pages/WorkoutSchedulerPage.jsx`: main workout page and sync bootstrap
- `src/pages/DataConsolePage.jsx`: spreadsheet-style editing across planner datasets
- `src/components/Navbar.jsx`: page navigation and cloud auth actions
- `firestore.rules`: security rules template for planner docs

## Sync Behavior

- UI writes to localStorage immediately.
- If signed in and Firebase is configured, writes are mirrored to Firestore.
- On page bootstrap, cloud data is merged into local state.
- If cloud sync fails, app continues using local data.

## Environment Variables

Required:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Run Commands

- `npm run dev`
- `npm run build`

## Notes

- Legacy spreadsheet backend integration has been removed.
- Keep `firestore.rules` in sync with production Firebase rules.
