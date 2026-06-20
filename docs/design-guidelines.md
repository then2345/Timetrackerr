# Design Guidelines - Time Tracker

> Student graduation project. Clean, professional, mobile-first.

## Color Palette

| Token                | Hex       | Usage                                  |
|----------------------|-----------|----------------------------------------|
| `--color-primary`    | `#4361EE` | Buttons, links, active states          |
| `--color-primary-hover` | `#3A56D4` | Button hover                           |
| `--color-success`    | `#06D6A0` | Positive actions, completed states     |
| `--color-danger`     | `#EF476F` | Delete, error, destructive actions     |
| `--color-danger-hover` | `#D93D60` | Danger hover                           |
| `--color-warning`    | `#FFD166` | Warnings, pending states               |
| `--color-bg`         | `#FFFFFF` | Page background                        |
| `--color-surface`    | `#F8F9FA` | Cards, panels, elevated surfaces       |
| `--color-text`       | `#1A1A2E` | Primary text                           |
| `--color-text-secondary` | `#6C757D` | Secondary text, captions, placeholders |
| `--color-border`     | `#DEE2E6` | Borders, dividers                      |

### Color Usage Rules

- Primary color for all CTAs and interactive elements
- Danger only for destructive actions (delete, remove)
- Success for positive feedback (task done, timer running)
- Warning for attention-needed states (deadline approaching)
- Never use primary + danger together in same component
- Text on colored backgrounds: white (`#FFF`) on primary/danger, dark (`#1A1A2E`) on success/warning/surface

## Typography

### Fonts

| Font            | Usage                            | Fallback                |
|-----------------|----------------------------------|-------------------------|
| Inter           | All UI text, body, labels        | system-ui, sans-serif   |
| JetBrains Mono  | Timer digits, numbers, durations | ui-monospace, monospace |

### Type Scale

| Token           | Size   | Weight | Line-height | Usage                |
|-----------------|--------|--------|-------------|----------------------|
| `--text-xs`     | 12px   | 400    | 1.5         | Captions, hints      |
| `--text-sm`     | 14px   | 400    | 1.5         | Body small, labels   |
| `--text-base`   | 16px   | 400    | 1.5         | Body text            |
| `--text-lg`     | 18px   | 500    | 1.4         | Card titles          |
| `--text-xl`     | 20px   | 600    | 1.3         | Section headings     |
| `--text-2xl`    | 24px   | 700    | 1.2         | Page titles          |
| `--text-timer`  | 56px   | 700    | 1           | Timer display (mono) |

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

## Spacing System

Base unit: **4px**. Use multiples.

| Token      | Value | Usage                          |
|------------|-------|--------------------------------|
| `--space-1`  | 4px   | Tight gaps, icon padding       |
| `--space-2`  | 8px   | Inner component spacing        |
| `--space-3`  | 12px  | Form field gaps                |
| `--space-4`  | 16px  | Standard padding, card gaps    |
| `--space-5`  | 20px  | Section inner padding          |
| `--space-6`  | 24px  | Section gaps, card padding     |
| `--space-8`  | 32px  | Page margins, major sections   |
| `--space-10` | 40px  | Large vertical rhythm          |
| `--space-12` | 48px  | Hero spacing, page header      |

## Border Radius

| Token          | Value | Usage                  |
|----------------|-------|------------------------|
| `--radius-sm`  | 4px   | Small elements, badges |
| `--radius-md`  | 8px   | Buttons, inputs        |
| `--radius-lg`  | 12px  | Cards, modals          |
| `--radius-full` | 9999px | Avatar, pills         |

## Shadows

| Token          | Value                                | Usage           |
|----------------|--------------------------------------|-----------------|
| `--shadow-sm`  | `0 1px 2px rgba(0,0,0,0.06)`        | Subtle lift     |
| `--shadow-md`  | `0 2px 8px rgba(0,0,0,0.1)`         | Cards, dropdown |
| `--shadow-lg`  | `0 4px 16px rgba(0,0,0,0.12)`       | Modals, overlay |

## Components

### Buttons

Three variants: **primary**, **secondary**, **danger**.

```
Primary:   bg(--color-primary) color(#FFF)  hover(--color-primary-hover)
Secondary: bg(--color-surface) color(--color-text) border(--color-border) hover(bg #E9ECEF)
Danger:    bg(--color-danger)  color(#FFF)  hover(--color-danger-hover)
```

- Height: 40px (default), 36px (small), 48px (large)
- Padding: 0 16px (default), 0 12px (small)
- Border-radius: `--radius-md`
- Font: Inter 500, `--text-sm`
- Disabled: opacity 0.5, cursor not-allowed
- Icon buttons: square, same height as width

### Cards

- Background: `--color-bg`
- Border: 1px solid `--color-border`
- Border-radius: `--radius-lg`
- Padding: `--space-6`
- Shadow: `--shadow-sm`
- Hover (if interactive): `--shadow-md`, slight translateY(-1px)

### Forms / Inputs

- Height: 40px
- Border: 1px solid `--color-border`
- Border-radius: `--radius-md`
- Padding: 0 `--space-3`
- Font: Inter, `--text-sm`
- Focus: border-color `--color-primary`, box-shadow `0 0 0 3px rgba(67,97,238,0.15)`
- Error state: border-color `--color-danger`
- Label: `--text-sm`, font-weight 500, margin-bottom `--space-1`
- Error message: `--text-xs`, color `--color-danger`

### Toast Notifications

- Position: fixed bottom-right, 16px from edges
- Background: `--color-bg`
- Border-radius: `--radius-md`
- Shadow: `--shadow-lg`
- Padding: `--space-4`
- Min-width: 280px
- Types: success (left border `--color-success`), error (left border `--color-danger`), info (left border `--color-primary`)
- Auto-dismiss: 3 seconds

### Modals

- Overlay: rgba(0,0,0,0.4)
- Container: max-width 480px, centered, `--color-bg`, `--radius-lg`, `--shadow-lg`
- Header: border-bottom 1px `--color-border`, padding `--space-6`
- Body: padding `--space-6`
- Footer: border-top 1px `--color-border`, padding `--space-4` `--space-6`, flex-end alignment
- Close button: top-right corner, 32px square

### Task Badge / Color Dot

- 8px circle, inline-flex
- Used to visually identify tasks by color
- Each task has a user-chosen color from a preset palette

## Navigation

### Desktop (>= 768px)

- **Sidebar**: fixed left, 240px wide
- Contains: app logo/name, nav links (icons + text), user info at bottom
- Active link: `--color-primary` background at 10% opacity, text `--color-primary`
- Inactive link: `--color-text-secondary`, hover bg `--color-surface`
- Main content area: margin-left 240px

### Mobile (< 768px)

- **Hamburger menu**: top-left, 44px touch target
- **Drawer overlay**: slides from left, same as sidebar content
- **Bottom bar**: optional, 56px height, icon + label for main sections
- Nav links: Timer, Thong ke, Lich, Cong viec

### Nav Items

| Icon  | Label       | Route       |
|-------|-------------|-------------|
| Timer | "Ban gio"  | `/timer`    |
| Bar   | "Thong ke" | `/dashboard`|
| Cal   | "Lich"     | `/calendar` |
| List  | "Cong viec"| `/tasks`    |
| Logout| "Dang xuat"| (action)    |

## Breakpoints

Single breakpoint, mobile-first:

| Name     | Min-width | Layout             |
|----------|-----------|--------------------|
| mobile   | 0         | Single column, drawer nav |
| desktop  | 768px     | Sidebar + content  |

```css
/* Mobile: default styles, no media query needed */

/* Desktop */
@media (min-width: 768px) {
  /* sidebar visible, multi-column layouts */
}
```

## CSS Variable Conventions

### Naming Pattern

```css
:root {
  /* Colors */
  --color-primary: #4361EE;
  --color-primary-hover: #3A56D4;
  --color-success: #06D6A0;
  --color-danger: #EF476F;
  --color-warning: #FFD166;
  --color-bg: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-text: #1A1A2E;
  --color-text-secondary: #6C757D;
  --color-border: #DEE2E6;

  /* Typography */
  --font-ui: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-timer: 3.5rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.12);

  /* Layout */
  --sidebar-width: 240px;
}
```

### CSS Module Convention

Each component gets its own `.module.css` file. Class names use camelCase:

```
Button.module.css   -> .primary, .secondary, .danger, .disabled
Card.module.css     -> .card, .title, .body
Timer.module.css    -> .display, .controls, .startBtn, .stopBtn
```

## Accessibility

- Minimum touch target: 44x44px on mobile
- Focus ring: 2px solid `--color-primary`, 2px offset
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
- Icons paired with visible text labels
- `prefers-reduced-motion`: disable animations and transitions

## Animation

Keep subtle. Duration: 150-200ms. Easing: ease-out.

- Button hover: background transition 150ms
- Card hover: shadow + transform 200ms
- Modal: fade in overlay 200ms, slide up container 200ms
- Sidebar drawer: slide left-to-right 200ms
- Timer digits: no animation (static update for clarity)
