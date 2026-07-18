# UI Registry

### App Shell Navigation

File: `frontend/react/src/components/BottomNav.jsx`
Last updated: 2026-07-18

| Property         | Class/value |
| ---------------- | ----------- |
| Background       | `var(--surface)` |
| Border           | `border-top: 1px solid #e6e6e6` |
| Border radius    | none |
| Text - primary   | `var(--text-secondary)` for active/hover links |
| Text - secondary | `var(--text-muted)` for inactive links |
| Spacing          | `height: 82px`, `padding: 10px 24px calc(env(safe-area-inset-bottom) + 10px)`, `gap: 6px` inside links |
| Hover state      | active and hover links use `var(--text-secondary)` |
| Shadow           | none |
| Accent usage     | active navigation state uses `var(--text-secondary)` |

**Pattern notes:**
Bottom navigation is role-aware and should only expose routes relevant to the signed-in user. Parent navigation keeps Home, Attendance, Alerts, and Profile. Teacher navigation keeps Attendance and Profile. Avoid adding inactive placeholder actions to the shell for the MVP.

### Top Bar Actions

File: `frontend/react/src/App.jsx`
Last updated: 2026-07-18

| Property         | Class/value |
| ---------------- | ----------- |
| Background       | `rgba(247, 249, 251, 0.88)` for `.topbar`, `var(--surface)` for `.icon-button` |
| Border           | `border-bottom: 1px solid #e6e6e6` |
| Border radius    | `16px` for icon buttons |
| Text - primary   | `var(--text-primary)` |
| Text - secondary | `var(--text-secondary)` for brand icon |
| Spacing          | `.topbar` uses `padding: 18px 20px`, action group uses `gap: 10px` |
| Hover state      | `.icon-button:hover` translates up and switches to `#f4f6fb` |
| Shadow           | none |
| Accent usage     | parent-only notifications action uses the standard icon button pattern |

**Pattern notes:**
Top bar actions should be real actions only. Hide role-irrelevant or unimplemented buttons instead of showing inert controls.
