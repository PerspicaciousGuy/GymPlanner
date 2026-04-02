# Design System: Kinetic Precision (Nutrition Extension)

## 1. Creative North Star
The Creative North Star is **"Kinetic Precision."** 

This design system moves away from the cluttered look and adopts a premium technical aesthetic that mirrors high-performance athletic apparel: technical, breathable, and intentional.

## 2. Colors & Surface Architecture
- **Foundation:** Deep Charcoal (`#131313`)
- **Accent:** Electric Blue (`#afc6ff` to `#00275f`)
- **No-Line Rule:** Use value shifts (background color changes) instead of 1px borders for sectioning.
- **Glass & Gradient:** Use glassmorphism for floating nav bars and subtle gradients (135 deg) for CTAs.

## 3. Typography
- **Performance Headers (Lexend):** Geometric and technical for main data points.
- **Instructional Body (Manrope):** Neutral and clear for labels and deep-stats.
- **Scale:** Use extreme typographic scale contrast for high impact.

## 4. Components
- **Buttons:** Gradient pill styles with wide horizontal padding.
- **Cards:** Background-based separation, no borders, `0.75rem` corners.
- **Progress:** Flat-cap, 4px stroke kinetic rings or progress bars.

## 5. Design System Notes for Stitch Generation (REQUIRED)
When generating screens for this project, ALWAYS follow these rules:
- **BackgroundColor:** `#131313`
- **SurfaceColor:** `#1c1b1b` (low elevation) / `#2a2a2a` (high elevation)
- **PrimaryColor:** `#afc6ff` (gradient to `#2E7DFF`)
- **Font:** `Lexend` for headers, `Manrope` for body.
- **Corners:** `ROUND_FOUR` for most elements, `PILL` for buttons.
- **Borders:** NONE. Use tonal depth for containment.
- **Contrast:** Pair massive display fonts with small, uppercase functional labels.
- **Icons:** Use `primary_fixed_dim` blues for icon markers.
