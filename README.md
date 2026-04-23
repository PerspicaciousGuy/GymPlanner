# GymPlanner

A comprehensive, high-performance fitness planning and tracking application designed for serious athletes and fitness enthusiasts. GymPlanner provides advanced workout scheduling with AM/PM planning, detailed exercise logging, nutrition tracking, health monitoring, and local-first data persistence with optional Firebase cloud synchronization.

The application features a modern, premium "Liquid Glass" design language inspired by high-end mobile interfaces, delivering exceptional visual polish with smooth animations, intelligent UI patterns, and responsive layouts across all devices.

---

## Core Concept

GymPlanner transforms the way fitness professionals and enthusiasts manage their training. Instead of rigid, traditional weekly schedules, it offers:

- Dynamic training cycles that can span any number of days (8-day rotations, 10-day periodization, etc.)
- Flexible daily planning with separate AM and PM sessions
- Intelligent workout shifting for rescheduling missed sessions
- Comprehensive exercise logging with muscle group mapping
- Nutrition tracking with meal logging and macro analysis
- Health monitoring including weight tracking, water intake, and recovery metrics
- Historical analysis with detailed charts and recovery recommendations
- Complete data export functionality for offline review

---

## Key Features

### Training & Scheduling

- **Flexible Cycle Planning**: Create training plans with custom cycle lengths (7-day, 8-day, 10-day, etc.) instead of rigid weekly schedules. Dynamically adjust cycles to match periodization strategies.
- **AM/PM Session Separation**: Plan and track distinct morning and evening training sessions independently. Auto-advance from AM to PM completion with locked session states.
- **Workout Shifting**: Intelligently move missed or rescheduled workouts to available rest days without losing training history or completion tracking.
- **Daily Title Customization**: Override session titles on specific dates (e.g., "Max Effort Monday", "Deload Day") without affecting the global weekly template.
- **Training Cycle Management**: Save and manage multiple training plans. Switch between plans seamlessly with historical tracking of which plan was active on each date.
- **Detailed Training History**: View chronological audit trails with "Shifted From/To" badges showing exactly how and when workouts were rescheduled.

### Exercise Management

- **Comprehensive Exercise Database**: Extensive pre-built database of exercises organized by muscle group and sub-muscle (Chest: Upper/Middle/Lower, Back: Lats/Mid/Upper/Traps, Legs: Quads/Hamstrings/Glutes, etc.).
- **Custom Exercise Library**: Create and save custom exercises to extend the database with specialized movements or equipment-specific variations.
- **Exercise Group Organization**: Organize exercises into logical groups within each session for organized, efficient logging.
- **Advanced Exercise Logging**: Log exercises with sets, reps, weight, RPE (rate of perceived exertion), and notes for complete session documentation.
- **Exercise Search & Filter**: Quickly find exercises by muscle group, equipment, or name across the extensive database.

### Nutrition & Health Tracking

- **Food Logging System**: Log meals and individual foods with automatic macro and calorie calculation. Track protein, carbohydrates, fats, and fiber intake.
- **Nutrition Database**: Comprehensive food database with nutritional information. Create custom food entries for specialized or local items.
- **Meal Planning**: Create and save custom meal templates for quick logging of frequently eaten combinations.
- **Daily Macro Tracking**: Visual macro summaries with progress bars showing daily totals for protein, carbs, fats, and other nutritional metrics.
- **Bookmarked Foods**: Save frequently logged foods for one-tap logging access.
- **Weight Tracking**: Log daily weight measurements with trend analysis and historical charting.
- **Water & Hydration Tracking**: Monitor daily water intake with quick-add buttons for common serving sizes.
- **Daily Vitals**: Track sleep quality, mood, and other recovery indicators.

### Analytics & Insights

- **Comprehensive Dashboard**: Multi-chart analytics dashboard with workout completion trends, muscle group distribution, and exercise volume analysis.
- **Recovery Recommendations**: AI-powered recovery logic that suggests optimal rest days based on recent training volume and intensity.
- **Training History Calendar**: Visual calendar view of all training days with color-coded completion status (completed, skipped, missed, shifted).
- **Muscle Group Distribution Charts**: Radar charts and pie charts showing muscle group training balance across different time periods.
- **Workout Completion Trends**: Area charts tracking workout completion rates over weeks and months.
- **Personal Records & Achievements**: Track milestones, PR achievements, and training streaks.
- **Interactive Muscle Map**: Visual human anatomy overlay showing which muscle groups have been trained and their training frequency.
- **Export & Reporting**: Export detailed workout and nutrition data to Excel (.xlsx) for offline analysis or sharing.

### User Interface & Experience

- **Liquid Glass Design**: Ultra-refined premium aesthetics with 40px backdrop blur effects, subtle glass-morphism, and floating specular elements.
- **Responsive Layout**: Fully responsive design that adapts beautifully from small mobile screens to large desktop displays. Dedicated sidebar navigation on desktop, bottom tab navigation on mobile.
- **Dark/Light Mode**: Complete theme support with carefully designed color palettes for both light (clean, professional) and dark (bold, energetic) modes.
- **Smooth Animations**: Framer Motion and GSAP-powered animations for page transitions, tab switches, list reordering, and micro-interactions.
- **Bento Box Layout**: Information organized into clean, rounded cards with consistent spacing and visual hierarchy.
- **Tab Locking**: Completed or skipped session tabs are visually locked and non-clickable to prevent accidental modifications.

### Data Management & Sync

- **Local-First Architecture**: Instant UI responsiveness with all writes persisting immediately to browser localStorage.
- **Cloud Synchronization**: Optional Firebase Firestore integration for seamless cross-device synchronization.
- **Offline Resilience**: Full functionality in offline mode with automatic sync when connection is restored.
- **Data Console**: Spreadsheet-style interface for bulk editing of sessions, workouts, exercises, and completion records.
- **Excel Export**: Export all training data to professional Excel workbooks with multiple sheets (Sessions, Workouts, Exercises, Completion History).
- **Bidirectional Sync**: Seamless data migration from local storage to cloud and vice versa.
- **Data Migration Tools**: Clear local cache and rehydrate from cloud without losing any historical data.

### Progressive Web App

- **Installable**: Install on iOS, Android, or Desktop as a native-feeling application.
- **Offline Support**: Service workers provide offline functionality with background sync when connectivity returns.
- **App-Like Experience**: Full-screen mode, custom splash screens, and app icons for immersive experience.
- **Background Notifications**: Optional workout reminder notifications with scheduling for tomorrow's sessions.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 19 + React Router 7 |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS 4 + shadcn/ui Components |
| **Animations** | Framer Motion + GSAP 3 |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Backend/Cloud** | Firebase Authentication + Firestore |
| **Data Export** | XLSX |
| **PWA** | Vite PWA Plugin + Workbox |
| **Code Quality** | ESLint |
| **Typography** | Outfit (Google Fonts) + Geist Variable |

---

## Project Structure

```
GymPlanner/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── health/          # Health/nutrition specific components
│   │   │   ├── QuickActionHub.jsx
│   │   │   └── QuickHealthWidgets.jsx
│   │   ├── InteractiveMuscleMap/  # Anatomy visualization
│   │   │   ├── InteractiveMuscleMap.jsx
│   │   │   └── AnatomyData.js
│   │   ├── nutrition/       # Nutrition components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── AdvancedExerciseCard.jsx
│   │   ├── ExerciseGroup.jsx
│   │   ├── ExerciseRow.jsx
│   │   ├── LoginDialog.jsx
│   │   ├── MuscleMap.jsx
│   │   ├── Navbar.jsx
│   │   ├── ShiftPicker.jsx
│   │   ├── TemplateDialog.jsx
│   │   ├── WeekPicker.jsx
│   │   ├── WorkoutLogView.jsx
│   │   ├── WorkoutSection.jsx
│   │   └── (...other components)
│   │
│   ├── pages/               # Page components (routes)
│   │   ├── AnalyticsPage.jsx
│   │   ├── DataConsolePage.jsx
│   │   ├── DayDetailPage.jsx
│   │   ├── EditRoutinePage.jsx
│   │   ├── HealthPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── RoutinesPage.jsx
│   │   ├── TrainingPlanPage.jsx
│   │   ├── WorkoutSchedulerPage.jsx
│   │   └── health/          # Health page subpages
│   │       ├── CreateMealPage.jsx
│   │       ├── FoodDetailPage.jsx
│   │       ├── LogFoodPage.jsx
│   │       └── MealDetailPage.jsx
│   │
│   ├── utils/               # Utility functions
│   │   ├── cloudSync.js     # Firebase Firestore operations
│   │   ├── dateUtils.js     # Date calculations and formatting
│   │   ├── exportWorkbook.js # Excel export functionality
│   │   ├── firebase.js      # Firebase initialization and config
│   │   ├── foodDatabase.js  # Food/nutrition data management
│   │   ├── importWorkbook.js # Excel import functionality
│   │   ├── localStorage.js  # Deprecated - use storage.js
agement
│   │   ├── recoveryLogic.js # Recovery recommendation algorithm
│   │   ├── settings.js      # User settings persistence
│   │   ├── storage.js       # Main data persistence and sync layer
│   │   ├── trainingPlan.js  # Training cycle management
│   │   └── vitalsDatabase.js # Weight, water, vitals logging
│   │
│   ├── hooks/               # React custom hooks
│   │   └── useFirebaseAuth.js # Firebase authentication state
│   │
│   ├── data/                # Static data and databases
│   │   ├── exerciseDatabase.js # Comprehensive exercise library
│   │   └── exercises.js     # Additional exercise definitions
│   │
│   ├── constants/           # App constants
│   │   └── storageKeys.js   # LocalStorage key constants
│   │
│   ├── lib/                 # Library utilities
│   │   └── utils.js         # Class name merging, helper functions
│   │
│   ├── assets/              # Static images and media
│   │
│   ├── App.jsx              # Main app component with routing
│   ├── App.css              # Global styles
│   ├── main.jsx             # React entry point
│   └── index.css            # Global CSS variables and theme
│
├── public/
│   └── icons/               # App icons for PWA
│
├── firestore.rules          # Firebase security rules
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS theme config
├── components.json          # shadcn/ui configuration
├── jsconfig.json            # JavaScript path aliases
├── eslint.config.js         # ESLint rules
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

---

## Core Pages & Features

### 1. Workout Scheduler (Training Tab)

**Path**: `WorkoutSchedulerPage.jsx`

The main training interface where users schedule, log, and track workouts.

- **Day Selection**: Navigate between dates with calendar picker. View today, tomorrow, yesterday, or jump to specific weeks.
- **Session Cards**: AM/PM separated workout cards showing planned exercises, completion status, and metadata.
- **Auto-Advance**: Completing AM session automatically switches focus to PM session.
- **Quick Actions**: Mark sessions complete, skip, or shift to another day.
- **Workout Details**: Expandable cards showing exercise list for each session.
- **Status Badges**: Visual indicators for completed, skipped, missed (for past dates), and upcoming sessions.
- **Week Navigation**: WeekPicker component for browsing different weeks with Monday-Sunday week boundaries.

**Key Functions**:
- `loadSessionTitles()` - Load daily session title customizations
- `loadWorkoutByDate()` - Fetch planned exercises for a date
- `isDayComplete()` - Check if both AM/PM are finished
- `isSessionFinished()` - Check if specific AM/PM session is done

### 2. Analytics Dashboard

**Path**: `AnalyticsPage.jsx`

Comprehensive analytics and recovery insights.

- **Completion Trends**: Area chart showing workout completion rates over time.
- **Muscle Distribution**: Radar and pie charts showing which muscle groups have been trained.
- **Recovery Metrics**: Recovery score based on training volume and intensity.
- **Training Stats**: Total sessions, average session duration, completion percentage.
- **Personal Records**: Achievement tracking and milestones.
- **Interactive Muscle Map**: Visual anatomical map showing trained muscle groups.

**Chart Types**:
- Area charts for completion trends
- Radar charts for muscle group distribution
- Pie charts for muscle group percentages
- Bar charts for exercise frequency

### 3. Health & Nutrition Tracking

**Path**: `HealthPage.jsx` with subpages in `pages/health/`

Comprehensive health and nutrition management system.

- **Daily Dashboard**: Quick overview of macro totals, water intake, weight, and vitals.
- **Food Logging**: Log individual foods or pre-created meals with automatic macro calculation.
- **Meal Creation**: Save reusable meal templates for quick logging.
- **Nutrition Analysis**: Daily macro distribution with visual progress bars.
- **Weight Tracking**: Log daily weight with trend analysis charts.
- **Water Logging**: Quick buttons for common water amounts (250ml, 500ml, 1L, etc.).
- **Vitals**: Sleep quality, mood, and other recovery indicators.
- **Bookmarked Foods**: Quick access to frequently logged foods.

**Key Functions**:
- `getDailyTotals()` - Calculate daily macro totals
- `addFoodToLog()` - Log food with date tracking
- `logWeight()` - Record daily weight
- `getWeightHistory()` - Retrieve weight trend data

### 4. History & Calendar View

**Path**: `HistoryPage.jsx`

Month-based calendar view of all training activity.

- **Calendar Grid**: Full month view with day squares showing training status.
- **Status Indicators**: Color-coded completion status (completed, skipped, missed, off-day).
- **Day Details**: Click any day to view or edit that day's workouts.
- **Navigation**: Previous/next month buttons with quick "Today" button.
- **Summary Stats**: Training days completed, rest days, skipped workouts for the month.

**Status Colors**:
- Green: Fully completed (AM & PM done)
- Yellow: Partially completed
- Red: Skipped or missed
- Gray: Rest/off days

### 5. Routines & Templates

**Path**: `RoutinesPage.jsx`

Manage reusable workout templates.

- **Template Library**: Save and manage workout templates for quick setup of new days.
- **Search & Filter**: Find templates by name quickly.
- **Template Creation**: Create new templates with exercise groups and exercises.
- **Template Editing**: Modify saved templates without affecting past workouts.
- **Delete Templates**: Remove unused templates with confirmation.
- **Template Preview**: See exercise count and structure before applying.

**Functions**:
- `loadTemplates()` - Fetch all saved templates
- `saveTemplate()` - Create new template
- `deleteTemplate()` - Remove template

### 6. Training Plan Management

**Path**: `TrainingPlanPage.jsx`

Advanced training cycle and periodization planning.

- **Saved Plans**: Create and switch between multiple training plans.
- **Cycle Types**: Fixed week (7 days) or dynamic cycles (8, 10, 12+ days).
- **Slot Definition**: Define each day in the cycle as "workout", "rest", "deload", etc.
- **Plan Activation**: Switch between plans to apply different training periodization.
- **Plan Cloning**: Duplicate existing plans as templates for new cycles.
- **Cycle Preview**: See full cycle structure before activating.
- **Historical Tracking**: View which plan was active on past dates.

**Key Concepts**:
- **Cycle Slot**: A single position in a training cycle (day 1-N)
- **Mode**: "fixed" (7-day) or "dynamic" (custom length)
- **Active Plan**: Currently applied training plan for new workouts
- **Cycle Offset**: How many days into the current cycle

### 7. Data Console

**Path**: `DataConsolePage.jsx`

Spreadsheet-style bulk editing interface.

- **Tab System**: Separate tabs for Sessions, Workouts, Exercises, and Completion records.
- **Sessions Tab**: View and edit day/AM/PM session titles.
- **Workouts Tab**: Edit exercise lists for each session.
- **Exercises Tab**: Manage individual exercise details (sets, reps, weight).
- **Completion Tab**: Bulk mark sessions complete/skipped.
- **Search & Filter**: Find records by date, exercise, or session name.
- **Excel Export**: Export current tab or all tabs to .xlsx file.
- **Batch Editing**: Select multiple rows and apply changes.
- **Column Sorting**: Sort by date, session, completion status, etc.

**Export Features**:
- Export selected tab to Excel
- Export all tabs to multi-sheet workbook
- Includes headers, formatting, and calculated columns
- Date formatting for easy sharing

### 8. Profile & Settings

**Path**: `ProfilePage.jsx`

User account, settings, and data management.

- **Authentication**: Email/password login with Firebase.
- **Cloud Migration**: Migrate local data to cloud account.
- **Theme Selection**: Toggle between light and dark modes.
- **Units**: Switch between metric (kg, cm) and imperial (lbs, inches).
- **Notifications**: Enable/disable workout reminders and tomorrow's summary.
- **Data Actions**: Clear local cache, rehydrate from cloud, force sync.
- **Account**: View logged-in email, logout option.
- **Data Console**: Quick access to bulk editing interface.
- **App Version**: Display app version and build info.

---

## Data Model

### LocalStorage Keys

The application uses a comprehensive set of localStorage keys for persistence:

```javascript
// Training Data
gymplanner_schedule          // Weekly training template structure
gymplanner_workouts          // Date-keyed workout exercises
gymplanner_completion        // Date-keyed completion status
gymplanner_session_titles    // Custom daily session title overrides
gymplanner_templates         // Saved workout templates

// Exercise Management
gymplanner_exercise_db       // Full custom exercise database
gymplanner_custom_exercises  // User-created custom exercises

// Nutrition & Health
gymplanner_food_log          // Logged foods and meals
gymplanner_custom_foods      // Custom food entries
gymplanner_saved_meals       // Saved meal templates
gymplanner_bookmarked_foods  // Frequently logged foods
gymplanner_vitals_log        // Weight, sleep, mood tracking
gymplanner_water_log         // Water intake logging

// Settings & Metadata
gymplanner_settings          // User settings (theme, units, etc.)
gymplanner_active_plan_id    // Currently active training plan
gymplanner_saved_plans       // Saved training cycles
workout_reminders_enabled    // Notification setting

// Flags & Metadata
gymplanner_migrated_to_dates // Migration flag for date-based keys
gymplanner_workouts_migrated_to_dates // Workout migration flag
```

### Completion Date Format

Completion tracking uses ISO date keys with session identifier:

```javascript
{
  "2026-03-10_am": true,        // Completed
  "2026-03-10_pm": "skipped",   // Skipped
  "2026-03-11_am": false,       // Not marked
  "2026-03-11_pm": true         // Completed
}
```

**Values**:
- `true` = Session completed
- `"skipped"` = Session skipped
- `false` or missing = Not marked

### Training Plan Structure

```javascript
{
  id: "plan_123",
  name: "Push/Pull/Legs 8-Day",
  mode: "dynamic",              // "fixed" or "dynamic"
  cycle: [
    { type: "workout", customTitle: "Push A" },
    { type: "workout", customTitle: "Pull A" },
    { type: "workout", customTitle: "Legs" },
    { type: "rest" },
    { type: "workout", customTitle: "Push B" },
    { type: "workout", customTitle: "Pull B" },
    { type: "deload" },
    { type: "rest" }
  ],
  createdAt: 1620000000,
  activatedAt: 1620086400
}
```

### Workout Structure

```javascript
{
  "2026-03-10_am": {
    groups: [
      {
        name: "Warm-up",
        rows: [
          {
            exercise: "Treadmill",
            sets: 1,
            reps: "5 min",
            weight: null,
            rpe: null,
            notes: ""
          }
        ]
      },
      {
        name: "Main",
        rows: [
          {
            exercise: "Barbell Back Squat",
            sets: 4,
            reps: 5,
            weight: 140,
            rpe: 9,
            notes: "Hit depth"
          }
        ]
      }
    ]
  }
}
```

---

## Firestore Cloud Data Model

When Firebase is configured, data syncs to Firestore under the path: `users/{uid}/planner/`

```
users/
└── {uid}/
    └── planner/
        ├── schedule       // Weekly training template
        ├── workouts       // Date-keyed workouts
        ├── completion     // Completion status map
        ├── exerciseDb     // Full exercise database
        ├── sessionTitles  // Daily title customizations
        ├── templates      // Saved templates
        ├── savedPlans     // Training cycles
        ├── activePlanId   // Active plan reference
        ├── foodLog        // Food logging data
        ├── customFoods    // Custom food items
        ├── vitalsLog      // Weight, vitals
        └── settings       // User settings
```

### Firebase Rules

Security rules in `firestore.rules` ensure:
- Users can only read/write their own data
- Authentication required for cloud access
- Sub-collections are properly scoped
- Validation of data types and structure

---

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project (optional, for cloud features)
- Modern web browser with LocalStorage support

### Installation

1. **Clone the repository** and navigate to directory:
   ```bash
   cd GymPlanner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional for cloud features):
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Development

1. **Start development server**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`

2. **Run linter**:
   ```bash
   npm run lint
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

### Firebase Setup (Optional)

To enable cloud synchronization:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable authentication methods:
   - Email/Password authentication
   - Additional methods as desired

3. Create Firestore database:
   - Start in test mode for development
   - Deploy `firestore.rules` for production security

4. Get Firebase config:
   - Navigate to Project Settings
   - Copy Web app credentials to `.env`

5. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Key Utilities Reference

### Storage Management (`src/utils/storage.js`)

Core data persistence and sync layer.

**Key Functions**:
- `loadSessionTitles()` - Get all session title customizations
- `loadWorkouts()` - Get all workouts across all dates
- `loadCompletion()` - Get completion status map
- `loadExerciseDb()` - Load full exercise database
- `loadTemplates()` - Get saved templates
- `getDailyMetadata()` - Get day-specific metadata
- `isDayComplete()` - Check if both AM/PM finished
- `isSessionFinished()` - Check if AM or PM finished
- `ensureAmPm()` - Ensure AM/PM structure exists
- `saveSessionTitlesWithSync()` - Save and sync session titles
- `saveDayWorkoutWithSync()` - Save and sync workouts
- `saveCompletionWithSync()` - Save and sync completion
- `syncPlannerData()` - Force cloud sync
- `clearLocalDataAndRehydrateFromCloud()` - Clear and restore from cloud
- `migrateCompletionToDateBased()` - Migrate old format to new
- `migrateWorkoutsToDateBased()` - Migrate old workout format

### Date Utilities (`src/utils/dateUtils.js`)

Date calculations and formatting utilities.

**Key Functions**:
- `getToday()` - Get current date as Date object
- `getTomorrow()` - Get tomorrow's date
- `getYesterday()` - Get yesterday's date
- `getDayOfWeek()` - Get weekday (0-6, Monday start)
- `formatDateKey()` - Format date to "YYYY-MM-DD" for localStorage
- `formatDateDisplay()` - Format date for UI display
- `formatDateCompact()` - Short date format
- `getWeekStart()` - Get Monday of week containing date
- `getWeekDates()` - Get all dates in week (Mon-Sun)
- `getMonthCalendarDays()` - Get calendar grid for month
- `getPreviousMonth()` - Get first day of previous month
- `getNextMonth()` - Get first day of next month
- `isSameDay()` - Check if two dates are same day

### Cloud Sync (`src/utils/cloudSync.js`)

Firebase Firestore operations.

**Key Functions**:
- `isCloudSyncReady()` - Check if Firebase is configured and user logged in
- `fetchCloudPlannerData()` - Fetch all user planner data from cloud
- `saveCloudSchedule()` - Sync schedule to cloud
- `saveCloudWorkoutsMap()` - Sync workouts to cloud
- `saveCloudCompletionMap()` - Sync completion to cloud
- `saveCloudSessionTitles()` - Sync custom session titles
- `saveCloudExerciseDb()` - Sync exercise database
- `saveCloudTemplates()` - Sync templates
- `saveCloudFoodLog()` - Sync food logs
- `saveCloudSettings()` - Sync user settings
- Various specialized cloud save functions for different data types

### Nutrition Database (`src/utils/foodDatabase.js`)

Food logging and meal management.

**Key Functions**:
- `addFoodToLog()` - Log food with macro calculation
- `getFoodLog()` - Get foods logged on date
- `removeFoodFromLog()` - Remove food from log
- `getDailyTotals()` - Calculate daily macro totals
- `createMeal()` - Save meal template
- `getSavedMeals()` - Get all saved meal templates
- `bookmarkFood()` - Add food to bookmarks
- `getBookmarkedFoods()` - Get frequently used foods

### Training Plan (`src/utils/trainingPlan.js`)

Training cycle and periodization management.

**Key Functions**:
- `loadTrainingPlan()` - Load active training plan
- `saveTrainingPlan()` - Save plan structure
- `getActivePlanId()` - Get currently active plan ID
- `setActivePlanId()` - Set active training plan
- `loadSavedPlans()` - Get all saved training plans
- `createCycleSlot()` - Add slot to cycle
- `getCycleSlotForDate()` - Get cycle position for date
- `getPlanSessionTitle()` - Get session title from plan

### Settings (`src/utils/settings.js`)

User preferences and configuration.

**Key Functions**:
- `loadSettings()` - Load all user settings
- `updateSetting()` - Update single setting
- Available settings: `theme`, `units` (metric/imperial), `language`

### Notifications (`src/utils/notificationService.js`)

Push notification management.

**Key Functions**:
- `isNotificationSupported()` - Check browser support
- `requestNotificationPermission()` - Request user permission
- `getNotificationPermission()` - Get current permission state
- `showNotification()` - Show notification
- `scheduleTomorrowSummary()` - Schedule tomorrow's workout summary
- `setNotificationEnabledWithSync()` - Enable/disable with sync

### Recovery Logic (`src/utils/recoveryLogic.js`)

Recovery recommendations and analytics.

**Key Functions**:
- `calculateRecovery()` - Calculate recovery score
- Returns rest day recommendations based on recent training volume

### Export (`src/utils/exportWorkbook.js`)

Excel export functionality.

**Key Functions**:
- `exportTabToExcel()` - Export single tab to .xlsx
- `exportAllTabsToExcel()` - Export multi-sheet workbook
- Handles Sessions, Workouts, Exercises, and Completion tabs

---

## Component Architecture

### Layout Components

- **App.jsx** - Main router and layout wrapper. Manages page state and auth context.
- **Navbar.jsx** - Top navigation bar with cloud sync and menu controls.

### Page Components

- **WorkoutSchedulerPage.jsx** - Main training interface with day/week navigation.
- **AnalyticsPage.jsx** - Charts and recovery analytics dashboard.
- **HealthPage.jsx** - Nutrition and vitals tracking.
- **HistoryPage.jsx** - Calendar view of all training activity.
- **RoutinesPage.jsx** - Template and routine management.
- **TrainingPlanPage.jsx** - Training cycle planning and management.
- **DataConsolePage.jsx** - Bulk editing and data management.
- **ProfilePage.jsx** - User settings and account management.

### Feature Components

- **WorkoutSection.jsx** - AM/PM session display and interaction.
- **ExerciseRow.jsx** - Single exercise entry with sets, reps, weight, RPE.
- **ExerciseGroup.jsx** - Group of exercises within a session.
- **AdvancedExerciseCard.jsx** - Detailed exercise card for comprehensive logging.
- **ShiftPicker.jsx** - UI for shifting workouts to other days.
- **TemplateDialog.jsx** - Dialog for creating/editing templates.
- **LoginDialog.jsx** - Email/password authentication dialog.
- **MuscleMap.jsx** - Muscle group visualization.
- **InteractiveMuscleMap.jsx** - Advanced anatomical muscle group visualization.
- **WeekPicker.jsx** - Week navigation component.
- **QuickHealthWidgets.jsx** - Summary cards for health metrics.
- **QuickActionHub.jsx** - Quick access buttons for frequent actions.

### UI Components (shadcn/ui)

Located in `src/components/ui/`:

- `button.jsx` - Button variants and styles
- `card.jsx` - Card container component
- `tabs.jsx` - Tab interface
- `dialog.jsx` - Modal dialog
- `input.jsx` - Input field
- `textarea.jsx` - Multi-line text input
- `select.jsx` - Dropdown selection
- `badge.jsx` - Label badges
- `progress.jsx` - Progress bars
- `table.jsx` - Table display
- `accordion.jsx` - Collapsible sections
- `popover.jsx` - Floating popover
- `tooltip.jsx` - Hover tooltips
- `alert-dialog.jsx` - Confirmation dialogs
- `avatar.jsx` - User avatars
- `context-menu.jsx` - Right-click menus
- `dropdown-menu.jsx` - Dropdown menus
- `command.jsx` - Command palette
- `separator.jsx` - Divider lines
- `switch.jsx` - Toggle switches
- `label.jsx` - Form labels
- `stepper.jsx` - Multi-step form stepper
- `input-group.jsx` - Grouped inputs

---

## Authentication & Security

### Firebase Authentication

- **Email/Password**: Primary authentication method.
- **State Management**: `useFirebaseAuth` hook manages auth state and user context.
- **Login/Logout**: Handled through `LoginDialog` component and profile page.
- **Persistence**: Firebase automatically persists auth state across page reloads.

### Firestore Security

- Rules template provided in `firestore.rules`
- Enforces user-scoped data isolation: `request.auth.uid == userId`
- Prevents unauthorized access to other users' data
- Validates data structure on write operations

### Local Data Protection

- Data stored in browser localStorage is accessible only to the same domain
- Consider HTTPS for production deployment
- Private browsing mode doesn't persist data between sessions

---

## Performance Considerations

### Optimization Strategies

1. **Local-First Architecture**: All writes immediately persist to localStorage before cloud sync, ensuring instant UI responsiveness.

2. **Lazy Loading**: Pages are code-split and loaded on-demand via React Router.

3. **Memoization**: Components use `useMemo` and `useCallback` to prevent unnecessary re-renders.

4. **Virtual Scrolling**: Large lists use efficient rendering patterns.

5. **Bundle Optimization**: Tree-shaking and minification via Vite build.

6. **Animation Performance**: Framer Motion uses GPU-accelerated animations with `transform` and `opacity` only.

### Data Handling

- **Batched Updates**: Multiple state updates batched within same render cycle.
- **Selective Sync**: Only modified data synced to cloud, not full dataset.
- **Offline Queuing**: Writes queued while offline, synced when connection restored.
- **Pagination**: History and analytics use pagination to limit rendered items.

---

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and structural elements.
- **Keyboard Navigation**: Full keyboard support for all interactive elements.
- **Color Contrast**: Design meets WCAG AA standards for text contrast.
- **ARIA Labels**: Proper labels and descriptions for screen readers.
- **Focus Management**: Clear visual focus indicators for keyboard users.
- **Mobile Touch Targets**: Minimum 44x44px touch targets on mobile.

---

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile: iOS Safari 14+, Chrome for Android 90+
- Requires localStorage and Service Workers support

---

## Development Guidelines

### Code Style

- **ESLint**: Enforce consistent code style via eslint.config.js
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for complex functions, inline comments for non-obvious logic
- **Imports**: Organize into groups (React, libraries, components, utils)

### Component Patterns

- **Functional Components**: All components are functional with hooks
- **Custom Hooks**: Extract logic into reusable hooks in `src/hooks/`
- **Props Drilling**: Minimize via context or prop spreading
- **State Management**: Combine useState and useEffect for component state

### File Organization

- One component per file
- Related utilities grouped in `src/utils/`
- Page-specific components stay in page files
- Shared components in `src/components/`

---

## Troubleshooting

### Firebase Not Syncing

- Verify `.env` variables are set correctly
- Check Firestore rules are deployed
- Ensure user is authenticated
- Check browser console for error messages
- Try manual sync button in Navbar

### Data Not Persisting

- Verify localStorage is not disabled in browser
- Check storage quota (usually 5-10MB per domain)
- Try exporting data and clearing cache
- Rehydrate from cloud if available

### Performance Issues

- Clear browser cache and rebuild
- Check for excessive re-renders in React DevTools
- Reduce animation complexity for older devices
- Limit chart data points for large date ranges

### Authentication Issues

- Verify Firebase project Email/Password auth is enabled
- Check Firebase security rules allow user creation
- Ensure email is valid format
- Check browser console for specific error messages

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes following code style guidelines
4. Test thoroughly across browsers and devices
5. Submit pull request with clear description

---

## Roadmap

Potential future features:

- Exercise video library integration
- Social sharing and competition
- Advanced periodization templates
- AI workout recommendations
- Integration with wearables (Apple Watch, Fitbit)
- Team/group training features
- Custom report generation
- Voice-based logging
- Machine learning recovery predictions

---

## Acknowledgments

GymPlanner combines ideas from multiple fitness applications, enhanced with custom logging features and advanced analytics. Built with React, Vite, Firebase, and cutting-edge web technologies for a premium user experience.

---

## License

MIT License - See LICENSE file for details

Copyright (c) 2026 GymPlanner Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
