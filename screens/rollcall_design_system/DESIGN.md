---
name: RollCall Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#001815'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f2a'
  on-tertiary-container: '#28a094'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  gutter: 16px
---

## Brand & Style
The design system is built to convey a sense of administrative precision fused with modern approachability. Targeting school administrators, teachers, and parents, the aesthetic moves away from traditional "academic" clutters toward a high-end, SaaS-inspired interface.

The design style is **Modern Professional with Glassmorphic accents**. It utilizes a "Layered Clarity" approach: deep, trustworthy foundations paired with translucent foreground elements to create a sense of depth and hierarchy. The interface prioritizes focus, reducing cognitive load through generous whitespace and a strict adherence to a "Mobile-First" utility mindset. The emotional response should be one of reliability, calm, and efficiency.

## Colors
The palette is anchored by a sophisticated **Deep Slate (#1E293B)**, providing a stable, authoritative foundation for typography and structural elements. 

- **Primary (Slate):** Used for text, iconography, and deep-background surfaces to establish trust.
- **Secondary (Indigo #6366F1):** The "Action" color. High-energy and modern, used for primary buttons, active states, and brand highlights.
- **Tertiary (Teal #0D9488):** A secondary accent used for "Success" states and specific "Present" status indicators to maintain a professional rather than neon appearance.
- **Status Colors:**
    - **Present:** Teal (#0D9488)
    - **Absent:** Rose (#E11D48)
    - **Late:** Amber (#D97706)
- **Backgrounds:** The interface relies on a clean, off-white neutral (#F8FAFC) to ensure the glassmorphic cards and shadows have the necessary contrast to "pop."

## Typography
The typography strategy pairs **Hanken Grotesk** for headings and labels with **Inter** for body text. This combination balances a sharp, contemporary "tech" feel with world-class legibility for data-heavy attendance lists.

- **Headings:** Should be set with tight letter-spacing (-0.01em to -0.02em) and heavy weights to create a strong visual anchor on the page.
- **Body:** Inter is used for all long-form content and data entries. Maintain standard tracking to ensure readability at small sizes on mobile devices.
- **Labels:** Small caps are utilized for metadata and table headers to distinguish them clearly from interactive text.

## Layout & Spacing
This design system employs a **Fluid Grid** model optimized for mobile-first delivery. 

- **Grid:** On mobile, use a 4-column layout with 20px side margins. On tablet and desktop, scale to a 12-column centered layout with a max-width of 1140px.
- **Spacing Rhythm:** Based on a 4px baseline. Most components should utilize 16px (md) or 24px (lg) padding to maintain an "elevated" feel with breathing room.
- **Reflow Rules:** Lists on mobile should span the full width of the container. On larger screens, content cards should be grouped into functional zones (e.g., Sidebar Navigation, Main Attendance Feed, Statistics Panel).

## Elevation & Depth
Elevation is achieved through a combination of **Ambient Shadows** and **Glassmorphism**.

1.  **Base Layer:** Solid Neutral (#F8FAFC).
2.  **Card Layer:** White surfaces with a very soft, diffused shadow (Blur: 20px, Y: 10px, Color: Slate at 5% opacity). No hard borders; use a subtle 1px stroke in a lighter neutral for definition if needed.
3.  **Floating Layer (Glass):** For navigation bars, modals, or sticky headers, use a semi-transparent white (Alpha: 70-80%) with a 12px backdrop-blur filter. This creates the "premium" feel requested, allowing background colors to bleed through subtly.
4.  **Interaction:** Upon hover or tap, cards should subtly lift (shadow opacity increases to 10%) to provide tactile feedback.

## Shapes
The shape language is **Rounded**, using an 8px (0.5rem) base radius to strike a balance between friendly and professional.

- **Small Components:** Checkboxes and small buttons use `rounded` (8px).
- **Cards & Modals:** Large containers should use `rounded-lg` (16px) to emphasize the soft, modern aesthetic.
- **Status Chips:** Use `rounded-xl` (24px) or full-pill shapes to distinguish them from structural card elements.

## Components
- **Status Chips:** These are high-visibility elements. They should feature a low-saturation background tint of the status color with high-saturation text (e.g., Present = Light Teal bg, Dark Teal text). Large, bold typography within the chip.
- **Buttons:** 
    - *Primary:* Indigo background, white text, 8px radius, subtle shadow.
    - *Secondary:* Ghost style with Indigo border and text.
- **Attendance Lists:** Clean rows with 16px vertical padding. Use an avatar (circle) on the left, student name in `title-md`, and status chip on the far right.
- **Input Fields:** Minimalist design with a 1px Slate-200 border that transforms to a 2px Indigo border on focus. Use `body-sm` for placeholder text.
- **Cards:** White background, `rounded-lg`, soft ambient shadow. Include a "Glass" header for cards that contain high-priority summaries.
- **Navigation:** A bottom-tab bar for mobile with glassmorphic background blur and 24px iconography. Active states should be indicated by a small Indigo dot below the icon.