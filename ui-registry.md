# UI Registry & Design System Baseline

Established: 2026-08-17  
Source: Sheba University College & Sheba Academy (SUC/SA) Institutional Landing Page  
Purpose: Single source of truth for UI consistency across all LMS components and portals.

---

## 1. Design Tokens & Baseline Variables

| Property | Light Mode Token | Dark Mode Token | Value (Light / Dark) |
| :--- | :--- | :--- | :--- |
| **Brand Primary (Navy)** | `--navy-primary` | `--navy-primary` | `#0B3861` / `#60A5FA` |
| **Brand Deep (Navy Deep)** | `--navy-deep` | `--navy-deep` | `#071C33` / `#050C1A` |
| **Brand Light (Navy Light)**| `--navy-light` | `--navy-light` | `#184B7A` / `#93C5FD` |
| **Accent (Sheba Red)** | `--red-accent` | `--red-accent` | `#E63946` / `#FF5252` |
| **Accent Light** | `--red-accent-light`| `--red-accent-light`| `#FF8A8A` / `#FF8A8A` |
| **App Canvas / Page BG** | `--bg-canvas` | `--bg-canvas` | `#F2F4F6` / `#080F1E` |
| **Card / Surface BG** | `--bg-surface` | `--bg-surface` | `#FFFFFF` / `#0D172A` |
| **Muted Surface / Sub-bar** | `--bg-surface-muted`| `--bg-surface-muted`| `#F0F4F8` / `#132038` |
| **Primary Text** | `--text-primary` | `--text-primary` | `#0F172A` / `#F8FAFC` |
| **Secondary Text** | `--text-secondary` | `--text-secondary` | `#475569` / `#CBD5E1` |
| **Muted Text** | `--text-muted` | `--text-muted` | `#64748B` / `#94A3B8` |
| **Heading Text** | `--text-heading` | `--text-heading` | `#0B3861` / `#F8FAFC` |
| **Border Normal** | `--border-color` | `--border-color` | `#E2E8F0` / `#1E293B` |
| **Border Subtle** | `--border-light` | `--border-light` | `#F1F5F9` / `#162032` |

---

## 2. Geometry & Scale

| Element | Radius Token / Value | Shadow Token |
| :--- | :--- | :--- |
| **Main Containers / Hero Sections** | `--radius-container` (16px) | `0 4px 20px rgba(11, 56, 97, 0.05)` |
| **Cards & Data Modules** | `--radius-card` (8px - 10px) | `0 6px 24px rgba(11, 56, 97, 0.08)` |
| **Buttons & Action Triggers** | `--radius-btn` (6px - 8px) | `0 2px 4px rgba(11, 56, 97, 0.1)` |
| **Status Badges & Pills** | `--radius-tag` (4px - 6px) | None / Subtle inset border |
| **Modal / Floating Panels** | `12px` | `0 20px 48px rgba(7, 28, 51, 0.25)` |

---

## 3. Typography Baseline

- **Font Family (Display / Headings)**: `'Outfit', system-ui, sans-serif`
- **Font Family (Body / UI / Tables)**: `'Inter', system-ui, sans-serif`
- **Weights in Use**:
  - `700 / 800`: Display & Hero titles, KPI numbers
  - `600`: Section headings, card headers, button text, table header labels
  - `500`: Navigation items, active tab labels, badge text
  - `400`: Body text, descriptions, table cell text, input fields

---

## 4. Component Patterns

### 4.1 Buttons
- **Primary Action**: `background: #0B3861; color: #FFFFFF; border-radius: 6px; font-weight: 600; padding: 10px 18px;`
  - *Hover*: `background: #184B7A; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11, 56, 97, 0.2);`
- **Accent Action**: `background: #E63946; color: #FFFFFF; border-radius: 6px; font-weight: 600;`
  - *Hover*: `background: #D62839; transform: translateY(-1px);`
- **Secondary / Outline Action**: `background: transparent; color: #0B3861; border: 1.5px solid #0B3861; border-radius: 6px;`
- **Ghost Action**: `background: transparent; color: #475569; hover: background: #F1F5F9;`

### 4.2 Status Badges & Pills
- **Present / Passed**: `background: #D1FAE5; color: #059669; border: 1px solid #A7F3D0;` (Dark: `bg: #064E3B; text: #34D399;`)
- **Absent / Critical**: `background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA;` (Dark: `bg: #7F1D1D; text: #F87171;`)
- **Late / Pending**: `background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A;` (Dark: `bg: #78350F; text: #FBBF24;`)
- **Info / Timetable**: `background: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE;` (Dark: `bg: #1E3A8A; text: #93C5FD;`)

### 4.3 Cards & Data Containers
- `background: var(--bg-surface);`
- `border: 1px solid var(--border-color);`
- `border-radius: var(--radius-card);`
- `box-shadow: var(--shadow-subtle);`
- `transition: var(--transition-smooth);`
- *Hover*: `transform: translateY(-2px); box-shadow: var(--shadow-hover); border-color: rgba(11, 56, 97, 0.2);`

### 4.4 TopBar & Navigation
- Glassmorphism backdrop: `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color);` (Dark: `rgba(13, 23, 42, 0.85)`)
- Clear branding: Sheba crest logo + Institutional Wordmark
- Quick controls: Profile avatar, notifications trigger, theme switcher toggle.

---

## 5. Next Steps for Implementation
Whenever any LMS portal component is touched, apply the patterns recorded in this registry and spec `docs/specs/0005-lms-design-system-transfer.md`.
