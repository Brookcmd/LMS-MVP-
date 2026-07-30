---
name: RollCall Admin
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
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#3130c0'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b4dd8'
  on-tertiary-container: '#d9d8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h1:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-page: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system focuses on high-utility information management for administrative professionals. The brand personality is authoritative, precise, and systematic, favoring functional clarity over decorative flair. 

The design style is **Corporate / Modern**, characterized by a rigorous grid, subtle tonal layering, and an emphasis on data density. It prioritizes "quiet" interfaces that allow complex datasets to remain legible during extended periods of use. The emotional response is one of reliability and control, achieved through a controlled palette and predictable interactive patterns.

## Colors
The palette is rooted in a professional range of Slates and Navies, using Indigo as the primary functional driver for actions and highlights.

- **Primary (Indigo-600):** Used for primary buttons, active states, and focus indicators.
- **Secondary (Slate-900):** Reserved for high-level navigation backgrounds and primary headings.
- **Neutral (Slate-500):** Used for secondary text, icons, and borders.
- **Background (Slate-50):** A cool-toned off-white to reduce eye strain in high-density dashboard environments.
- **Validation States:** Standardized Green (Success), Amber (Warning), and Red (Error) tones are adjusted for high contrast against the slate background.

## Typography
This design system utilizes **Hanken Grotesk** for all functional and editorial roles to maintain a sharp, contemporary, and highly legible appearance. 

The type scale is optimized for information density. `body-md` (14px) is the standard for most interface text, while `body-sm` (13px) is used for data tables and secondary metadata. Captions and labels use a semi-bold weight with slight tracking to ensure readability at small scales. Numerical data in tables should utilize tabular lining figures to ensure column alignment.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid grid** optimized for desktop. 
- **Side Navigation:** A fixed left-hand sidebar (260px) persists across all views.
- **Main Content:** A fluid area with a maximum width constraint of 1440px to prevent excessive line lengths on ultra-wide monitors.
- **Rhythm:** An 8px base unit governs all spatial relationships. 
- **Density:** For data-intensive views, the vertical rhythm may be compressed to a 4px increment to maximize "above the fold" visibility.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and crisp, low-opacity shadows. 
- **Level 0 (Background):** Slate-50, flat.
- **Level 1 (Cards/Tables):** White surface with a 1px border (Slate-200). No shadow.
- **Level 2 (Dropdowns/Modals):** White surface with a soft, multi-layered shadow (0px 4px 6px -1px rgba(15, 23, 42, 0.1)).
- **Interactive States:** Lifted elements use a primary-tinted shadow to signify focus or "active" status. 
This approach avoids visual clutter, ensuring the user's focus remains on the data.

## Shapes
The shape language is **Soft**, utilizing a 4px (0.25rem) base radius. This provides a professional look that is approachable but remains structured and serious. 
- Small components (Buttons, Inputs, Checkboxes) use the 4px radius.
- Larger containers (Stats Cards, Data Tables, Modals) use an 8px (0.5rem) radius.
- Interactive status indicators (Tags/Chips) use a fully rounded (Pill) shape to differentiate them from actionable buttons.

## Components

### Data Tables
- **Header:** Slate-50 background, `label-md` typography, Slate-900 text.
- **Rows:** 48px height for standard density, 40px for high density. Subtle 1px border-bottom (Slate-100).
- **Cells:** `body-sm` for content. Primary actions (Edit/View) use ghost buttons with Indigo text.

### Side Navigation
- **Background:** Slate-900.
- **Links:** Slate-300 text. Active state uses Indigo-500 left-accent border (4px) and white text with a subtle background highlight.
- **Hierarchy:** Grouped by category headers in `label-md` (Slate-500).

### Stats Cards
- **Structure:** `h2` for the metric, `body-sm` for the label.
- **Trends:** Small pill-shaped indicators for percentage change (Green for up, Red for down).
- **Style:** Level 1 elevation (Bordered White surface).

### Form Inputs & Validation
- **Default:** White background, 1px Slate-300 border.
- **Focus:** 1px Primary-600 border with a 3px Indigo-100 outer glow.
- **Error:** 1px Red-500 border. Helper text in Red-600 `body-sm`.
- **Validation Icons:** Placed inside the input suffix for immediate feedback.

### Buttons
- **Primary:** Solid Indigo-600, White text.
- **Secondary:** White background, Slate-200 border, Slate-700 text.
- **Tertiary/Ghost:** No background/border, Indigo-600 text. Used for repetitive table actions.