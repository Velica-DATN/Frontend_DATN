# Velica Frontend — UI Design System

> **Status:** Planning phase — design tokens and component specifications only.
> **Visual Direction:** Modern Academic SaaS
> **Primary Color:** #12536B
> **Interface:** Bright, white-based, clean, professional

---

## 1. Design Principles

1. **Clarity over decoration** — information density and readability come first
2. **Consistent whitespace** — systematic spacing, not ad-hoc margins
3. **Semantic color** — color communicates meaning, not aesthetics alone
4. **Accessible by default** — WCAG AA contrast minimums, keyboard navigation
5. **Professional restraint** — subtle shadows, moderate radius, no neon or glass effects

**Avoid:** dark dashboards, excessive gradients, glassmorphism, oversized decorative graphics, neon colors, distracting animations.

---

## 2. Color Palette

### 2.1 Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--velica-primary` | `#12536B` | Primary buttons, active nav, selected states, focus rings |
| `--velica-primary-hover` | `#0E3F52` | Button hover, link hover |
| `--velica-primary-active` | `#0B2F3D` | Button pressed/active |
| `--velica-primary-light` | `#E8F4F8` | Primary tint backgrounds (selected rows, highlight areas) |
| `--velica-primary-light-hover` | `#D4EBF2` | Hover on primary-tint surface |

### 2.2 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--velica-success` | `#16A34A` | Graded, submitted, passed status |
| `--velica-success-bg` | `#F0FDF4` | Success notification background |
| `--velica-success-border` | `#BBF7D0` | Success status border |
| `--velica-warning` | `#D97706` | Scheduled, pending, late warning |
| `--velica-warning-bg` | `#FFFBEB` | Warning notification background |
| `--velica-warning-border` | `#FDE68A` | Warning status border |
| `--velica-error` | `#DC2626` | Error, failed, rejected, overdue |
| `--velica-error-bg` | `#FEF2F2` | Error notification background |
| `--velica-error-border` | `#FECACA` | Error status border |
| `--velica-info` | `#2563EB` | Informational, in-progress states |
| `--velica-info-bg` | `#EFF6FF` | Info notification background |
| `--velica-info-border` | `#BFDBFE` | Info status border |

### 2.3 Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| `--velica-bg-page` | `#F8FAFC` | Page/canvas background |
| `--velica-bg-surface` | `#FFFFFF` | Cards, panels, modals |
| `--velica-bg-elevated` | `#FFFFFF` | Elevated cards (box-shadow distinguishes) |
| `--velica-bg-subtle` | `#F1F5F9` | Table striping, section backgrounds |
| `--velica-bg-muted` | `#E2E8F0` | Disabled inputs, skeleton backgrounds |
| `--velica-border` | `#E2E8F0` | Default border (inputs, cards, dividers) |
| `--velica-border-strong` | `#CBD5E1` | Emphasized borders (table headers) |
| `--velica-border-focus` | `#12536B` | Focus ring border (same as primary) |

### 2.4 Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--velica-text-primary` | `#0F172A` | Main body text, headings |
| `--velica-text-secondary` | `#475569` | Secondary labels, descriptions |
| `--velica-text-muted` | `#94A3B8` | Placeholders, meta text, timestamps |
| `--velica-text-disabled` | `#CBD5E1` | Disabled form elements |
| `--velica-text-inverse` | `#FFFFFF` | Text on primary/dark backgrounds |
| `--velica-text-link` | `#12536B` | Hyperlinks (same as primary) |
| `--velica-text-link-hover` | `#0E3F52` | Link hover state |

### 2.5 Assessment-specific Colors

| Token | Hex | Usage |
|---|---|---|
| `--velica-answered` | `#16A34A` | Question answered indicator |
| `--velica-unanswered` | `#94A3B8` | Question not yet answered |
| `--velica-current` | `#12536B` | Currently active question |
| `--velica-flagged` | `#D97706` | Flagged/marked for review |
| `--velica-timer-normal` | `#0F172A` | Timer text when time is ample |
| `--velica-timer-warning` | `#D97706` | Timer text when < 10 minutes |
| `--velica-timer-critical` | `#DC2626` | Timer text when < 2 minutes |

### 2.6 Shadows & Elevation

| Level | Value |
|---|---|
| `--velica-shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--velica-shadow-sm` | `0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` |
| `--velica-shadow-md` | `0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` |
| `--velica-shadow-lg` | `0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)` |

---

## 3. Typography

### 3.1 Font Family

**Primary font:** Inter (Google Fonts)
**Fallback stack:** `'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif`

> Current boilerplate uses Montserrat. Replace with Inter for academic readability.

### 3.2 Type Scale

| Role | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Page Title | 24px / 1.5rem | 700 | 1.3 | Main page `<h1>` |
| Section Title | 18px / 1.125rem | 600 | 1.4 | Card headers, section labels |
| Card Title | 16px / 1rem | 600 | 1.4 | Card/panel headings |
| Body | 14px / 0.875rem | 400 | 1.6 | Default body text |
| Body Strong | 14px / 0.875rem | 500 | 1.6 | Emphasized body content |
| Supporting | 13px / 0.8125rem | 400 | 1.5 | Meta text, descriptions |
| Table Text | 13px / 0.8125rem | 400 | 1.4 | Table cell content |
| Form Label | 13px / 0.8125rem | 500 | 1.4 | Input labels |
| Button Label | 14px / 0.875rem | 500 | 1 | Button text |
| Caption | 12px / 0.75rem | 400 | 1.4 | Timestamps, footnotes |
| Code | 13px / 0.8125rem | 400 | 1.5 | Inline code, audit log values |

> Font: `'JetBrains Mono'` or `'Fira Code'` for code/monospace cells in audit logs.

---

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Icon gaps, tight padding |
| `--space-2` | 8px | Compact element padding |
| `--space-3` | 12px | Form field internal padding |
| `--space-4` | 16px | Standard component padding |
| `--space-5` | 20px | Card content padding |
| `--space-6` | 24px | Section spacing, large gap |
| `--space-8` | 32px | Page section dividers |
| `--space-10` | 40px | Large layout gaps |
| `--space-12` | 48px | Page vertical padding |
| `--space-16` | 64px | Major layout sections |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, tags, chips |
| `--radius-md` | 6px | Inputs, buttons |
| `--radius-lg` | 8px | Cards, panels, modals |
| `--radius-xl` | 12px | Large cards, drawers |
| `--radius-full` | 9999px | Avatars, pill badges |

---

## 6. Ant Design Theme Override

The following Less/AntD v4 variables must be overridden in `_override_variables.less`:

```less
@primary-color: #12536B;
@link-color: #12536B;
@success-color: #16A34A;
@warning-color: #D97706;
@error-color: #DC2626;
@font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
@font-size-base: 14px;
@border-radius-base: 6px;
@border-color-base: #E2E8F0;
@body-background: #F8FAFC;
@component-background: #FFFFFF;
@heading-color: #0F172A;
@text-color: #0F172A;
@text-color-secondary: #475569;
@disabled-color: #CBD5E1;
@item-hover-bg: #E8F4F8;
@layout-body-background: #F8FAFC;
@layout-sider-background: #12536B;
@menu-dark-bg: #12536B;
@menu-dark-item-active-bg: #0E3F52;
@table-header-bg: #F8FAFC;
@table-border-color: #E2E8F0;
```

---

## 7. Component Specifications

### 7.1 Button

| Variant | Use | Colors |
|---|---|---|
| Primary | Main CTA (Create, Save, Publish, Submit) | bg: #12536B, text: white |
| Default/Secondary | Secondary actions (Edit, Filter) | bg: white, border: #E2E8F0, text: #0F172A |
| Danger | Destructive (Delete, Revoke) | bg: #DC2626, text: white |
| Ghost | Subtle (Cancel, Back) | bg: transparent, border: #E2E8F0, text: #475569 |
| Link | Inline navigation | no bg, text: #12536B |

Sizes: sm (28px height), md (34px), lg (40px)
Border radius: 6px
Focus ring: 2px solid #12536B with 2px offset

### 7.2 Input / Textarea

- Border: 1px solid #E2E8F0
- Border-radius: 6px
- Focus border: #12536B, shadow: 0 0 0 3px rgba(18,83,107,0.1)
- Placeholder: #94A3B8
- Disabled: bg #F1F5F9, text #CBD5E1

### 7.3 StatusBadge (Velica-specific)

Pill-shaped badge with dot indicator.

| Status | Dot Color | Text | Background |
|---|---|---|---|
| Draft | #94A3B8 | Draft | #F1F5F9 |
| Scheduled | #D97706 | Scheduled | #FFFBEB |
| Published | #16A34A | Published | #F0FDF4 |
| In Progress | #2563EB | In Progress | #EFF6FF |
| Completed | #12536B | Completed | #E8F4F8 |
| Graded | #16A34A | Graded | #F0FDF4 |
| Pending | #D97706 | Pending | #FFFBEB |
| Rejected | #DC2626 | Rejected | #FEF2F2 |
| Closed | #94A3B8 | Closed | #F1F5F9 |

### 7.4 StatCard (Dashboard)

- White card, 8px radius, subtle shadow-sm
- Icon area: primary-light bg (#E8F4F8) with primary-colored icon
- Title: 13px, text-secondary
- Value: 28px, 700 weight, text-primary
- Optional trend indicator (up/down arrow with delta text)

### 7.5 DataTable

- Header: bg #F8FAFC, text 13px 500 weight text-secondary, border-bottom strong
- Row: 48px height on desktop
- Hover row: bg #F8FAFC
- Selected row: bg #E8F4F8
- Cell text: 13px, text-primary
- Zebra striping: optional, subtle (#FAFAFA on alternate rows)
- Pagination: centered below table
- Empty state: centered illustration + message

### 7.6 Card

- bg: white
- border: 1px solid #E2E8F0
- border-radius: 8px
- padding: 20px (body), 16px (header/footer)
- shadow: shadow-xs by default, shadow-sm on hover
- header divider: 1px solid #E2E8F0

### 7.7 Dialog / Modal

- Backdrop: rgba(0,0,0,0.45)
- Modal bg: white
- Border-radius: 12px
- Header: 16px 600 weight
- Max-width: 480px (standard), 640px (form), 800px (large)
- ConfirmationDialog: red header for destructive, primary for informational

### 7.8 Toast / Notification

- Use AntD message/notification, themed with Velica tokens
- Success: #F0FDF4 bg, #16A34A icon
- Warning: #FFFBEB bg, #D97706 icon
- Error: #FEF2F2 bg, #DC2626 icon
- Info: #EFF6FF bg, #12536B icon

### 7.9 Assessment Timer (TimerDisplay)

- Monospace font (JetBrains Mono)
- Large 28px display
- Color transitions: normal → warning (< 10min) → critical (< 2min, pulsing)
- Screen reader: aria-live="polite" with periodic announcements

### 7.10 Skeleton

- Use AntD Skeleton with Velica bg-muted (#E2E8F0)
- Animate: shimmer gradient (left-to-right)
- Never show empty tables — always show skeleton rows while loading

---

## 8. Sidebar Design (MainSider adaptation)

The existing MainSider uses `layoutSiderBg: 'linear-gradient(261.31deg, #006ccf -29.57%, #00509a 121.11%)'`.

**Velica override:**

- Background: `#12536B` (solid, no gradient)
- Logo area: white Velica logotype + teal-tinted icon
- Menu item text: rgba(255,255,255,0.8) at rest
- Menu item hover: rgba(255,255,255,0.1) background, white text
- Active menu item: #0E3F52 background (slightly darker), white text, left accent bar
- Icons: white, 16px
- Collapsed width: 64px (icon-only)
- Expanded width: 240px
- Role badge: shown below avatar in expanded state

---

## 9. Assessment Taking Layout Design

This layout eliminates sidebar and standard header.

**Structure (top to bottom):**

```
┌─────────────────────────────────────────────┐
│ [Assessment Title]          [Timer] [Submit]  │  ← Slim header bar (56px)
├────────────────────┬────────────────────────┤
│                    │                        │
│  Question          │  Navigator Panel       │
│  Panel             │  (question grid)       │
│  (scrollable)      │  + Save status         │
│                    │  + Connection status   │
└────────────────────┴────────────────────────┘
```

- Header: white bg, border-bottom, 56px height
- Timer prominently placed top-right, color-coded
- Question panel: 65% width, white card, padded
- Navigator: 35% width, sticky, scrollable grid of question buttons
- Mobile: navigator collapses to a bottom drawer
- No breadcrumbs, no sidebar, no secondary nav

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 768px | Sidebar becomes drawer, tables scroll horizontally, forms full-width |
| Tablet | 768px–1024px | Sidebar collapses to icon-only (64px), assessment navigator bottom drawer |
| Desktop | > 1024px | Full sidebar (240px), side-by-side layouts, multi-column tables |
| Wide | > 1440px | Max content width 1280px with centered layout |

---

## 11. Accessibility Requirements

- **Color contrast:** All text-on-background combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Focus indicators:** 2px solid #12536B focus ring on all interactive elements. Never remove outline without providing alternative.
- **Keyboard navigation:** All actions accessible via keyboard. Tab order follows visual order.
- **Screen reader:** Use semantic HTML (nav, main, aside, header, section). aria-label on icon-only buttons. aria-live on timer, save status, and connection status.
- **Form errors:** Errors appear below inputs, associated via aria-describedby. Not conveyed by color alone.
- **Status changes:** Assessment save status and timer announced via aria-live polite.
- **Reduced motion:** Respect prefers-reduced-motion for all transitions and the timer pulse animation.
- **ARIA patterns:** Use AntD's built-in ARIA for modal, dropdown, and table. Supplement where missing.

---

## 12. Micro-animations (restrained)

| Element | Animation | Duration |
|---|---|---|
| Page transitions | Fade-in (opacity 0→1) | 150ms |
| Modal open | Scale + fade (0.95 → 1, opacity 0→1) | 200ms |
| Sidebar collapse | Width slide | 200ms ease |
| Toast appear | Slide-in from right | 200ms |
| Skeleton shimmer | Shimmer gradient sweep | 1.5s infinite |
| Timer pulse (critical) | opacity 1→0.6 pulsing | 500ms infinite |
| Button hover | bg color transition | 150ms |

All animations disabled if `prefers-reduced-motion: reduce`.
