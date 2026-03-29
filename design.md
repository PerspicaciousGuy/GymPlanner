# GymPlanner Design System

This document outlines the design language, color palette, and typography used in the GymPlanner application.

## 🎨 Visual Identity
GymPlanner follows a **premium, Apple-inspired, minimal** aesthetic. It prioritizes clarity, bold typography, and smooth interactive elements.

### Design Principles
- **Bento Box Layout**: Information is organized into clean, rounded cards with consistent spacing.
- **Micro-interactions**: Subtle `framer-motion` animations for tab switching, carousels, and button presses.
- **High-Contrast Typography**: Heavy use of "Outfit" for headings to create a bold, modern feel.
- **Mode-Aware Aesthetics**: Distinct visual identities for Light and Dark modes.

---

## 🌗 Color Palettes

### ☀️ Light Mode (Clean & Professional)
| Element | Color / Value |
| :--- | :--- |
| **Primary** | `oklch(0.205 0.005 250)` (Black - `#1C1C1E`) |
| **Background** | `oklch(1 0 0)` (Pure White) |
| **Foreground** | `oklch(0.145 0 0)` (Deep Slate) |
| **Cards** | `oklch(1 0 0)` with `--shadow-sm` |
| **Border** | `oklch(0.922 0 0)` (Soft Gray) |

### 🌙 Dark Mode (Bold & Energetic)
| Element | Color / Value |
| :--- | :--- |
| **Primary** | `oklch(0.985 0 0)` (Pure White) |
| **Background** | `oklch(0.18 0.01 250)` (Deep Soft Charcoal) |
| **Foreground** | `oklch(0.98 0 0)` (Off-White) |
| **Cards** | `oklch(0.22 0.015 250)` (Slightly lighter surface) |
| **Border** | `oklch(1 0 0 / 8%)` (Subtle translucent border) |

### 📊 Data Visualization & Charts
The application uses a specific OKLCH palette for consistency across analytical charts.

| Element | Color / Value |
| :--- | :--- |
| **Chart 1** | `oklch(0.809 0.105 251.813)` |
| **Chart 2** | `oklch(0.623 0.214 259.815)` |
| **Chart 3** | `oklch(0.546 0.245 262.881)` |
| **Chart 4** | `oklch(0.488 0.243 264.376)` |
| **Chart 5** | `oklch(0.424 0.199 265.638)` |

### 🍏 Health Tracking Highlights
Used for categorical indicators (Macros, Micros, Vitals).

| Feature | Key Color | Tailwind Class |
| :--- | :--- | :--- |
| **Protein / Energy** | Rose | `text-rose-500` |
| **Carbs / Vitality** | Amber | `text-amber-500` |
| **Fats / Hydration** | Blue | `text-blue-500` |
| **Fiber / Health** | Emerald | `text-emerald-500` |
| **Sugar / Indulgence** | Purple | `text-purple-500` |

---

## 🔠 Typography

The application uses a modern, geometric font stack for a premium feel.

- **Primary Font**: [Outfit](https://fonts.google.com/specimen/Outfit) (Variable)
- **Secondary Font**: Geist Variable
- **Hierarchy Labels**: Bold uppercase tracking (e.g., `text-[10px] font-black uppercase tracking-widest`)
- **Large Numerics**: `text-4xl` or `text-5xl` with `font-black` and `tracking-tighter`.

---

## 🧩 Core Components

### 📦 Cards (Bento Style)
Used for dashboard stats, workout logs, and navigation items.
- **Border Radius**: `0.625rem` (Base), `2xl` (32px), or `3xl` (40px) for prominent dashboard items.
- **Shadows**: Custom soft shadows (`--shadow-md`, `--shadow-lg`) for depth.

### 📊 Progress Indicators
Circular and linear progress bars are used for macro tracking and goal completion.
- **Colors**: Black/White (Primary), Emerald (Success), Rose (Energy), Amber (Vitality).

### 🔘 Buttons & Controls
- **Floating Action Button (FAB)**: Large, circular button at the bottom right for primary actions.
- **Tabs**: Pill-shaped triggers with smooth background slide animations.

---

## 🖼️ Visual Preview

![GymPlanner Design Mockup](C:/Users/SHREE/.gemini/antigravity/brain/60e1505e-cd4a-4f41-a1dc-386771007ac4/gym_planner_design_mockup_1774602461527.png)

---

## ⚡ Motion & Interaction
Powered by `framer-motion`:
- **Smooth Transitions**: View switching with fade + slide.
- **Dynamic Scales**: Buttons scale down slightly on tap (`whileTap={{ scale: 0.95 }}`).
- **Carousels**: Draggable slides for dashboard sections with interactive dots.
