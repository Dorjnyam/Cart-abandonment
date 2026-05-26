# Design System Strategy: The Digital Vault

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Vault."** We are moving away from the "template-heavy" look of standard e-commerce to create a high-precision, technical, and exclusive environment. This system balances the raw, industrial energy of luxury streetwear with the polished, high-fidelity execution of a tier-one tech startup.

To achieve this, we prioritize **intentional asymmetry** and **tonal depth** over traditional structural lines. Layouts should feel curated rather than generated—using white space (8px grid-driven) as a structural element to frame high-voltage product photography.

## 2. Color & Surface Architecture
This is a dark-mode-first ecosystem. We use a sophisticated palette of deep neutrals to allow our `primary` Electric Lime to act as a high-visibility signal.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or layout containment. Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large section backgrounds sitting on a `surface` base. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tokens to create "nested" depth:
*   **Base Layer:** `surface` (#0e0e0e) - The foundation of the page.
*   **Section Layer:** `surface-container-low` (#131313) - Large content areas.
*   **Interactive Layer:** `surface-container-highest` (#262626) - For cards or elevated modules.

### The "Glass & Glow" Rule
To elevate the "tech" aesthetic, use Glassmorphism for floating elements (like persistent navigation or "Quick Add" bars).
*   **Formula:** `surface-variant` at 60% opacity + `backdrop-blur: 20px`.
*   **Signature Glow:** For hover states on interactive cards, use a subtle `primary` (#d4fe42) outer glow (`box-shadow: 0 0 20px rgba(212, 254, 66, 0.15)`).

## 3. Typography: Technical Precision
Use a high-contrast pairing to distinguish between "Brand Voice" and "Metadata."

*   **Brand Voice (Headings):** `Space Grotesk` (Bold). Use the `display-lg` scale for hero titles and `headline-md` for product names. This typeface brings a technical, geometric edge.
*   **Metadata (Technical Details):** `Inter` (or `DM Mono` for prices/SKUs). Use `label-md` for technical specs, sizing, and pricing. 
*   **Hierarchy:** Always pair a large `display` heading with a significantly smaller `label-md` sub-header to create an editorial, high-fashion contrast.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are prohibited. Depth is achieved through **Tonal Layering** and **Ambient Diffusion.**

*   **The Layering Principle:** Place a `surface-container-lowest` card inside a `surface-container-low` section. The slight shift in value creates a natural "lift" without visual noise.
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, use a large blur (32px-64px) at 8% opacity using the `on-surface` color.
*   **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., input fields), use the `outline-variant` token at 20% opacity. 100% opaque borders are forbidden.

## 5. Components & UI Elements

### Buttons
*   **Primary:** `primary` (#d4fe42) background with `on-primary` (#4c5f00) text. Bold, all-caps. 
*   **Secondary:** `surface-container-highest` background with `on-surface` text.
*   **Shape:** 8px (`DEFAULT`) radius for standard buttons; Pill-shaped (`full`) for status badges and tags.

### Product Cards
*   **Container:** No border. Use `surface-container` background.
*   **Imagery:** Use bleeding layouts where the sneaker image overflows the "grid" slightly to create an organic, high-end feel.
*   **Separation:** Forbid the use of divider lines. Use `spacing-6` (1.5rem) or `spacing-8` (2rem) to separate content blocks.

### Input Fields
*   **State:** Default state should be `surface-container-highest` with a `Ghost Border`. 
*   **Focus State:** Border transitions to `primary` with a 2px stroke and a subtle lime outer glow.

### Status Badges (The Scarcity Layer)
*   **Exclusive:** `secondary` (#a08eff) - Use for "Drop" alerts and limited editions.
*   **Sold Out:** `tertiary` (#ffd16f) - High visibility warning.
*   **Sale:** `error` (#ff7351) - Aggressive, high-contrast signal.

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Align text to the left while keeping imagery off-center to mimic a magazine layout.
*   **Use the Grid:** All spacing must strictly follow the 8px scale (2, 4, 8, 16, 24...).
*   **Prioritize Legibility:** Ensure `primary` text on dark backgrounds maintains a high contrast ratio.

### Don’t:
*   **No Dividers:** Never use a line to separate list items. Use a `surface` shift or vertical space.
*   **No "Pure" Grey Shadows:** Avoid muddying the dark mode with standard grey shadows; keep them tinted or stick to tonal shifts.
*   **No Default Radii:** Never use the browser default. Stick to the `DEFAULT` (8px) for containers and `full` for interactive pills.

---
**Director's Note:** This system is about the tension between the dark, industrial void and the electric energy of the product. When in doubt, add more space and remove more lines.
