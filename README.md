# GymPlanner

GymPlanner is a high-performance, daily workout scheduler with AM/PM planning, local-first persistence, and Firebase cloud sync. It features a modern "Liquid Glass" design language inspired by premium mobile interfaces.

## 🚀 Key Features

- **Workout Shifting**: Redistribute training sessions across the week. Move a missed workout to a future rest day with a single click.
- **Daily Metadata Overrides**: Customize session titles for specific dates (e.g., "Max Effort Monday") without affecting the global weekly template.
- **Liquid Glass UI**: Ultra-refined aesthetics with heavy backdrop blurs (`40px`), vibrant refraction, and floating specular elements.
- **Detailed Training History**: Transparent "Shifted From/To" badges in the Training Hub provide clear chronological audit trails for adjusted schedules.
- **AM/PM Precision**: Independent session planning with auto-advancing flows and locked completion states.
- **Data Console**: Spreadsheet-style management for routines, exercises, and completion records with full `.xlsx` export.
- **Local-First & Cloud-Synced**: Instant UI responsiveness with optional Firebase Auth + Firestore synchronization.
- **PWA Support**: Fully installable on iOS, Android, and Desktop with offline resilience.

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Cloud** | Firebase Auth + Firestore |
| **Persistence** | LocalStorage + Synced Cloud Layer |
| **PWA** | Vite PWA + Service Workers |

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your Firebase credentials.
   ```bash
   cp .env.example .env
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Access at: `http://localhost:5173`

## ☁️ Firebase Integration

1. Create a Firebase project and a Web app.
2. Enable **Email/Password** authentication.
3. Deploy Firestore rules from `firestore.rules`.
4. Use the **Migrate to Cloud** feature in the profile to seed your cloud database from local cache.

## 📜 License

This project is licensed under the **MIT License**.

Copyright (c) 2026 GymPlanner Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, provided that the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
