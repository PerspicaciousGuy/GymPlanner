---
page: insights
---
# Progress Insights (Insights)

A sophisticated historical view of nutrition trends with interactive-style line charts.

**DESIGN SYSTEM (REQUIRED):**
- **BackgroundColor:** `#131313`
- **SurfaceColor:** `#1c1b1b` (low elevation) / `#2a2a2a` (high elevation)
- **PrimaryColor:** `#afc6ff` (gradient to `#2E7DFF`)
- **Font:** `Lexend` for headers, `Manrope` for body.
- **Corners:** `ROUND_FOUR` for most elements, `PILL` for buttons.
- **Borders:** NONE. Use tonal depth for containment.
- **Contrast:** Pair massive display fonts (Lexend) with small, uppercase functional labels.
- **Icons:** Use `primary_fixed_dim` blues for icon markers.

**Page Structure:**
1. **Header**: "Insights" in massive Lexend display font.
2. **Weekly Calorie Trend Chart**:
   - A large line chart showing daily intake vs a dashed line for "Target".
   - Current day's data point highlighted with a `primary` blue kinetic glow.
3. **Surplus/Deficit Tracker**:
   - A technical card showing "Weekly Average: -500 kcal (Deficit)".
   - Use high typographic contrast for the deficit number.
4. **Body Recomposition Module**:
   - Small cards for Weight (85.4 kg), Body Fat (15.2%), shown with trend indicators (up/down arrows).
5. **AI Insights Feed**:
   - "Consistent calorie deficit for 3 weeks. Muscle mass maintained."
   - Surface Level 3 (`#262626`) cards for these messages.
6. **Bottom Nav**: Minimalist glassmorphic navbar.
