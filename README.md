# GymPlanner

GymPlanner is a daily workout scheduler with AM/PM planning, local-first persistence, and Firebase cloud sync for multi-device use.

## Features

- AM/PM session planning per day with independent completion state
- AM complete/skip flow auto-advances to PM, and completed/skipped tabs are locked
- Workout logging by group and row with editable exercise fields
- Data Console with spreadsheet-style tabs for session titles, workouts, completion, and exercise DB
- Data Console export to `.xlsx` with `Export Current Tab` and `Export All Tabs`
- Local-first writes for responsive UI and offline resilience
- Firebase Auth + Firestore sync when signed in
- Cloud actions: sign in/out, migrate local data to cloud, and clear local cache then rehydrate from cloud
- PWA support for installable mobile/desktop usage

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Cloud | Firebase Authentication + Firestore |
| Local persistence | localStorage |
| PWA | vite-plugin-pwa + Workbox |

## Getting Started

```bash
npm install
copy .env.example .env
npm run dev
```

Dev server: `http://localhost:5173`

## Environment Variables

Set these values in `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase Setup

1. Create a Firebase project and Web app.
2. Copy the Web app config values into `.env`.
3. Enable `Email/Password` in Firebase Authentication.
4. Publish Firestore rules from `firestore.rules`.

## Cloud User Flow

1. Sign in using the shared account (or your own account) from the navbar.
2. Use `Migrate Local to Cloud` once to seed Firestore from local data.
3. Use `Remove Local Data` to clear local cache and reload from cloud.
4. Verify data in both `Workout` and `Data` pages.

## Build

```bash
npm run build
```

For detailed project context, see `PROJECT_CONTEXT.md`.
