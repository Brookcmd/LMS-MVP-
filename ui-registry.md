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

### Attendance Date Rail

File: `frontend/react/src/pages/ParentAttendance.jsx`
Last updated: 2026-07-18

| Property         | Class/value |
| ---------------- | ----------- |
| Background       | `linear-gradient(180deg, #ffffff 0%, #f7f9fb 100%)` for `.date-squircle`; `#f7f9fb` for rail arrow buttons |
| Border           | `1px solid #e9ebee`; active tiles use `var(--text-secondary)` |
| Border radius    | `26px` for date tiles, `16px` for rail arrow buttons |
| Text - primary   | `var(--text-primary)` and `#fff` when active |
| Text - secondary | `var(--text-muted)` for weekday/month, translucent white when active |
| Spacing          | `.attendance-calendar` uses `gap: 14px`; rail uses `gap: 10px`; tiles use `padding: 10px 8px` |
| Hover state      | `.date-squircle:hover` translates up and softens border to `rgba(70, 72, 212, 0.28)` |
| Shadow           | active tile uses `0 14px 26px rgba(70, 72, 212, 0.22)` |
| Accent usage     | selected date uses `var(--text-secondary)` |

**Pattern notes:**
Use squircle-style fixed-size date controls for horizontally scrollable calendar strips. Keep active date state visually strong, with muted weekday/month labels on inactive tiles and white labels on active tiles. Rail arrows should stay compact icon buttons rather than text commands.

### Homepage Monthly Calendar

File: `frontend/react/src/pages/ParentDashboard.jsx`
Last updated: 2026-07-18

| Property         | Class/value |
| ---------------- | ----------- |
| Background       | `var(--surface)` card; transparent day cells; `#f7f9fb` for alert rows |
| Border           | card uses `1px solid #e9ebee`; selected day uses `rgba(70, 72, 212, 0.28)` |
| Border radius    | card uses `var(--radius)`; day cells use `18px`; alert rows use `18px` |
| Text - primary   | `var(--text-primary)` for dates and summary headings; `#fff` for today |
| Text - secondary | `var(--text-muted)` for weekday labels and summary subtitle |
| Spacing          | calendar card uses `padding: 20px`; grid uses `gap: 10px`; summary uses `margin-top: 18px`, `padding-top: 16px` |
| Hover state      | `.calendar-day:hover` translates up and uses `#f4f6fb` |
| Shadow           | selected day uses inset highlight only; card keeps standard `var(--shadow)` |
| Accent usage     | alert dots use `var(--accent)`, `var(--text-error)`, or `var(--text-secondary)` by event type |

**Pattern notes:**
Use the monthly calendar for compact overviews, not detailed attendance browsing. Day cells should remain square via `aspect-ratio: 1`, support selected/today states, and surface event dots from real data. Month navigation should use the same compact icon button pattern as other calendar controls.

### Parent Quick Actions

File: `frontend/react/src/pages/ParentDashboard.jsx`
Last updated: 2026-07-18

| Property         | Class/value |
| ---------------- | ----------- |
| Background       | `var(--surface)` for modal; `#f7f9fb` for request cards; `var(--success-bg)` for success message |
| Border           | modal and request cards use `1px solid #e9ebee` |
| Border radius    | modal uses `var(--radius)`; request cards and success message use `18px` |
| Text - primary   | `var(--text-primary)` for form labels and request titles |
| Text - secondary | `#475569` for helper copy and request details |
| Spacing          | modal uses `padding: 20px`; request list uses `gap: 10px`; form labels use `gap: 8px`, `margin-bottom: 14px` |
| Hover state      | primary/secondary buttons inherit the existing button pattern |
| Shadow           | modal uses `var(--shadow)` |
| Accent usage     | success confirmation uses `var(--success)`; status badges reuse `.event-status` |

**Pattern notes:**
Quick actions should open focused modal forms rather than navigate away from the dashboard. Keep submitted request summaries compact and local to the quick-action card until a backend-backed request inbox exists.
