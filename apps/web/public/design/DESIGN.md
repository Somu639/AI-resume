---
name: Lumina Resume
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#7f4025'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c573a'
  on-tertiary-container: '#ffe5db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#72361b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  base: 0.5rem
  container-max: 1200px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
---

## Brand & Style
The design system is rooted in the "High-Utility Minimalism" movement, drawing inspiration from industry leaders like Linear and Vercel. It prioritizes clarity, speed, and focus, reducing cognitive load for users navigating the high-stakes process of career building. 

The aesthetic is characterized by a "High-Definition" feel: razor-sharp borders, purposeful whitespace, and a sophisticated monochromatic base punctuated by a deep teal accent. The goal is to evoke a sense of calm authority and technical precision, making the platform feel like a high-end productivity tool rather than a generic web form.

## Colors
The palette utilizes a Slate/Zinc foundation for a neutral, professional environment. Color is used sparingly and intentionally to drive action and highlight success.

- **Primary Accent:** #0F766E (Teal 800) is used for primary actions, focus states, and progress indicators.
- **Surface Strategy:** Surfaces are layered using subtle shifts in HSL lightness. Backgrounds use `zinc-50` in light mode and `zinc-950` in dark mode.
- **Interactive States:** Use semi-transparent overlays (e.g., `primary/10%`) for hover states on subtle buttons and ghost elements.
- **Dynamic Variables:** All colors must be defined as HSL variables to allow for seamless transition between light and dark modes while maintaining consistent contrast ratios.

## Typography
The typography system pairs the technical precision of **Geist** for headings and UI labels with the readability of **Inter** for body content. 

- **Tight Tracking:** Headings use negative letter-spacing to achieve that signature "modern SaaS" punchy look.
- **Hierarchy:** Use font weight rather than size to differentiate hierarchy where possible. Bold headings (600+) should feel dense and authoritative.
- **Data Display:** For numeric data or status labels, Geist’s mono-spaced DNA ensures clear alignment and a developer-centric aesthetic.

## Layout & Spacing
This design system adheres to a strict **8pt rhythm**. Every margin, padding, and height increment is a multiple of 8 (or 4 for micro-adjustments).

- **Grid:** A 12-column fluid grid is used for main layouts. On desktop, content is typically centered within a `1200px` container.
- **Sectioning:** Use large vertical gaps (64px - 96px) between major sections to emphasize the minimalist aesthetic.
- **Mobile Adaptation:** On mobile, margins shrink to 16px. Complex layouts (like the resume editor) reflow into a single-column stacked view with sticky navigation controls.

## Elevation & Depth
The system uses "Flat Elevation" where depth is primarily communicated through borders and subtle tonal shifts rather than heavy shadows.

- **Borders:** All containers utilize a 1px border (`zinc-200` in light, `zinc-800` in dark). 
- **Shadows:** 
  - `shadow-sm`: Used for static cards and input fields.
  - `shadow-md`: Used for hover states and dropdown menus to suggest lift.
  - Shadow color should be a low-opacity neutral (e.g., `rgba(0,0,0,0.05)`) to remain nearly imperceptible.
- **Tonal Layers:** Backgrounds for "wells" (inactive areas) use a slightly darker/lighter tint than the main background to create a sunken effect without using shadows.

## Shapes
The shape language is "Soft Geometric." It balances the harshness of the grid with friendly, approachable corners.

- **Cards:** Use `rounded-xl` (12px) for all primary containers and resume previews.
- **Interactive Controls:** Buttons, Inputs, and Badges use `rounded-lg` (8px). 
- **Status Indicators:** Pills and progress bars use full rounding (9999px).

## Components
Consistent implementation of these core components ensures a unified product experience.

- **Buttons:** Primary buttons are solid Teal (#0F766E) with white text. Secondary buttons use a subtle border and background hover. All transitions should be 200ms.
- **Inputs & Textareas:** 1px border with a `ring-offset` focus state in the primary teal. Use Geist for input text for a crisp, monospaced feel.
- **Steppers:** Minimalist line-and-dot approach. Completed steps use the teal accent; active steps use a thick border.
- **Empty States:** Centered icons (Lucide) in a light neutral tint with a muted `body-md` description and a clear CTA button.
- **Toasts:** Positioned at bottom-right, using `shadow-md` and a thin colored border matching the intent (Success = Teal, Error = Red).
- **Motion:** All entrance animations use Framer Motion: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` with a `duration: 0.2, ease: "easeOut"`.
- **Iconography:** Use Lucide-react with a 1.5px stroke width for a refined, airy appearance.