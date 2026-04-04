# Biarritz Design System — Linear-Inspired

This document is the visual source of truth. Every UI change must follow it exactly.
Read this file before any UI work. If you deviate, the PR will be rejected.

## Source of Truth

All design tokens are defined in **`packages/config-tailwind/preset.ts`** — a TypeScript Tailwind preset.
Read that file to see exact color values, border radius, font family, and custom component classes.
The `apps/web/app/global.css` is a thin shell that references the preset via `@config`.

## Visual Identity

Biarritz replicates Linear's application UI — clean, dense, monochrome with an indigo accent.
Study https://linear.app for reference. When in doubt, match Linear exactly.

### Core Principles
1. **Dense, not cramped** — compact layouts with consistent 4px-grid spacing
2. **Monochrome + one accent** — grayscale UI with `bg-primary` / `text-primary` (indigo) for interactive elements
3. **Minimal decoration** — no gradients on surfaces, no heavy shadows, no rounded cards
4. **Typography does the work** — hierarchy through size and weight, not color variety
5. **Flat surfaces** — no elevation/shadow system; use subtle 1px borders to separate regions

## Color Tokens

All colors are defined in `packages/config-tailwind/preset.ts`. Use ONLY the semantic Tailwind classes below.

### Backgrounds

| Tailwind class    | Purpose                              |
|-------------------|--------------------------------------|
| `bg-background`   | App background                       |
| `bg-card`         | Cards, elevated surfaces             |
| `bg-popover`      | Dropdowns, dialogs                   |
| `bg-muted`        | Subtle fills, sidebar                |
| `bg-accent`       | Hover states, selected rows          |
| `bg-primary`      | Primary buttons, active indicators   |
| `bg-secondary`    | Secondary backgrounds                |
| `bg-destructive`  | Danger buttons                       |

### Text

| Tailwind class              | Purpose                              |
|-----------------------------|--------------------------------------|
| `text-foreground`           | Primary text (headings, content)     |
| `text-muted-foreground`     | Secondary labels, placeholders       |
| `text-primary`              | Links, interactive text              |
| `text-primary-foreground`   | Text on primary backgrounds          |
| `text-destructive`          | Error text                           |

### Status Colors (defined as tokens in the preset)

| Purpose  | Background       | Text            |
|----------|------------------|-----------------|
| Success  | `bg-success`     | `text-success`  |
| Warning  | `bg-warning`     | `text-warning`  |
| Error    | `bg-destructive` | `text-destructive` |
| Info     | `bg-info`        | `text-info`     |

### Borders & Focus

| Class           | Purpose                    |
|-----------------|----------------------------|
| `border-border` | Default borders            |
| `border-input`  | Input borders              |
| `ring-ring`     | Focus rings (indigo)       |

### Rules
- **Never create new CSS custom properties** (no `--color-sidebar-*`, `--color-violet-*`, etc.)
- **Never use arbitrary Tailwind values** for colors (no `bg-[#5E6AD2]`)
- **Use semantic token names**: `bg-primary`, `text-muted-foreground`, `border-border`
- If you need a color that doesn't exist above, simplify your design.

## Utility Classes

These classes are defined in `packages/config-tailwind/preset.ts` via `addComponents`. Use them directly.

| Class              | Purpose                                      |
|--------------------|----------------------------------------------|
| `.page-header`     | Standard 44px header bar with bottom border  |
| `.nav-item`        | Sidebar navigation link (has hover/active)   |
| `.list-row`        | Issue-list-style data row (has hover)        |
| `.section-heading` | Uppercase muted section label                |

### Active state for nav-item
Add `data-active="true"` or the `active` class: `<a className="nav-item active">`.

## Typography

**Font**: Inter — loaded via `next/font/google` in `apps/web/app/layout.tsx`.
The `--font-sans` token in the preset sets Inter as the primary font.

### Base font size
The `@layer base` rule in `global.css` sets `font-size: 13px` and `line-height: 20px` on `<body>`.
You do NOT need to add `text-[13px]` to every element — it inherits from body.
Only add explicit font-size classes when deviating from 13px.

### Type Scale (Linear's actual scale)

| Role              | Size   | Weight | Tailwind classes                        |
|-------------------|--------|--------|-----------------------------------------|
| Page title        | 14px   | 500    | `text-sm font-medium`                   |
| Section heading   | —      | —      | `.section-heading` (utility class)      |
| Body              | 13px   | 400    | (inherited from body, no class needed)  |
| Small / label     | 12px   | 500    | `text-xs font-medium`                   |
| Mini / caption    | 11px   | 400    | `text-[11px] text-muted-foreground`     |

### Rules
- Most text is `text-muted-foreground`. Only headings and primary content use `text-foreground`.
- **Never use text-lg, text-xl, text-2xl** in the application UI. Those are for marketing pages only.

## Spacing

Linear uses a strict 4px grid. Common spacing values:

| Tailwind | Pixels | Usage                                    |
|----------|--------|------------------------------------------|
| `p-0.5`  | 2px    | Tight inner padding (icon buttons)       |
| `p-1`    | 4px    | Minimum padding                          |
| `p-1.5`  | 6px    | List item vertical padding               |
| `p-2`    | 8px    | Standard small padding                   |
| `p-3`    | 12px   | Content section padding                  |
| `p-4`    | 16px   | Page-level horizontal padding            |
| `p-6`    | 24px   | Major section padding                    |
| `gap-1`  | 4px    | Between icon and label                   |
| `gap-2`  | 8px    | Between form fields, list items          |
| `gap-3`  | 12px   | Between sections                         |

### Rules
- Use `px-4` or `px-6` for horizontal page padding — never more.
- Vertical spacing between sections: `gap-3` or `gap-4`.
- List items: use the `.list-row` utility class.

## Border Radius

Default radius is **6px** (`rounded-md`), defined in the preset. All shadcn `rounded-*` classes are scaled around this.

- **Never use `rounded-xl` or `rounded-2xl`** — Linear uses tight radii.
- Card component uses `rounded-md` (already configured).

## Layout Patterns

### Page Structure (Linear's standard layout)

```
+-------------------------------------------+
| Sidebar (w-[220px]) | Content Area         |
| +------------------+| +------------------+ |
| | Workspace name   || | .page-header     | |
| | ────────────────  || +------------------+ |
| | .nav-item        || |                  | |
| | .nav-item        || | Content           | |
| | .nav-item        || | (overflow-y-auto) | |
| +------------------+| +------------------+ |
+-------------------------------------------+
```

### Sidebar
- **Width**: `w-[220px]` fixed
- **Background**: `bg-muted` — NOT a dark sidebar
- **Border**: `border-r border-border`
- **Nav items**: use the `.nav-item` utility class
- **Workspace name**: `text-sm font-semibold px-3 py-2`
- Icons are 16x16 (`h-4 w-4`), use `lucide-react`

### Page Header
Use the `.page-header` utility class. Add title and actions inside:
```tsx
<header className="page-header">
  <h1 className="text-sm font-medium">Page Title</h1>
  <Button size="sm">Action</Button>
</header>
```

### Content Area
- **Padding**: `p-4` or `p-6`
- **Max width**: None (Linear uses full width)
- **Overflow**: `overflow-y-auto` on the content area, NOT the whole page

### List Pages (like Linear's issue list)

```tsx
{/* Header row */}
<div className="section-heading px-4 py-1.5 border-b">
  <span>Name</span>
</div>

{/* Data rows */}
<div className="divide-y">
  {items.map(item => (
    <Link key={item.id} href={`/items/${item.id}`} className="list-row">
      <span className="font-medium text-foreground truncate">{item.name}</span>
      <span className="text-muted-foreground ml-auto text-xs">{item.meta}</span>
    </Link>
  ))}
</div>
```

### Detail Pages (like Linear's issue detail)

```tsx
<div className="flex flex-col h-full">
  <header className="page-header">
    <div className="flex items-center gap-1.5">
      <Link href="/items" className="text-xs text-muted-foreground hover:text-foreground">Items</Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs font-medium">{item.name}</span>
    </div>
  </header>

  <div className="flex-1 overflow-y-auto p-6">
    <div className="max-w-2xl">
      <h1 className="text-sm font-medium mb-4">{item.name}</h1>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0">Status</span>
          <span className="text-foreground">{item.status}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Form Pages

```tsx
<div className="max-w-md">
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="name" className="text-xs font-medium">Name</Label>
      <Input id="name" className="h-8" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email" className="text-xs font-medium">Email</Label>
      <Input id="email" type="email" className="h-8" />
    </div>
    <Button size="sm">Save</Button>
  </div>
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <p className="text-sm font-medium text-foreground">No items yet</p>
  <p className="text-xs text-muted-foreground mt-1">Create your first item to get started.</p>
</div>
```

## Component Usage

### Available Components (`@biarritz/ui`)

Use these. Do NOT build custom versions of these components.

| Component      | When to use                                    | Key props                               |
|----------------|------------------------------------------------|-----------------------------------------|
| `Button`       | All clickable actions                          | `variant`, `size="sm"` (prefer sm)      |
| `Input`        | Text inputs                                    | Add `h-8` for Linear feel               |
| `Label`        | Form field labels                              | `text-xs font-medium`                   |
| `Textarea`     | Multi-line text                                | —                                       |
| `Badge`        | Status indicators, tags                        | `variant`                               |
| `Card`         | Grouped content sections (use sparingly)        | Prefer borderless flat sections         |
| `Separator`    | Visual dividers                                | Use `border-b` on containers instead    |
| `Select`       | Dropdowns                                      | Full Radix-based, accessible            |
| `Dialog`       | Modals, confirmations                          | Full Radix-based, accessible            |
| `DropdownMenu` | Context menus, action menus                    | Full Radix-based, accessible            |

### Icons — `lucide-react`

`lucide-react` is already installed in `@biarritz/ui`. Use it for ALL icons.

```tsx
import { Home, Users, Settings, ChevronRight, Plus, Search } from "lucide-react";

// Standard icon size in Linear
<Home className="h-4 w-4" />

// In navigation items
<Users className="h-4 w-4 text-muted-foreground" />
```

Common icons for Linear-style UIs:
- Navigation: `Home`, `Users`, `Settings`, `FolderKanban`, `Inbox`, `Search`
- Actions: `Plus`, `MoreHorizontal`, `Pencil`, `Trash2`, `ExternalLink`
- Status: `Circle`, `CheckCircle2`, `AlertCircle`, `Clock`
- Arrows: `ChevronRight`, `ChevronDown`, `ArrowLeft`

### Anti-Patterns — NEVER do these

| Don't                                          | Do instead                                    |
|------------------------------------------------|-----------------------------------------------|
| Hand-write SVG icons                           | Use `lucide-react` icons                      |
| Create `--color-sidebar-*` custom properties   | Use existing tokens: `bg-muted`, `border-border` |
| Use `bg-violet-*`, `text-violet-*`             | Use `bg-primary`, `text-primary`              |
| Use `text-3xl font-bold` for page titles       | Use `text-sm font-medium`                     |
| Build card grids with heavy shadows            | Build flat lists with `divide-y`              |
| Add gradient backgrounds to surfaces           | Keep surfaces flat: `bg-background` or `bg-card` |
| Use `rounded-xl` or `rounded-2xl`              | Use `rounded-md` (6px) max                   |
| Create a dark sidebar with light content       | Keep sidebar `bg-muted` matching content      |
| Use `container mx-auto` centered layout        | Use full-width flex layout with fixed sidebar |
| Build custom toggle/switch components          | Use a `Button` group or the existing components |
| Use `text-emerald-600` for success             | Use `text-success` (defined token)            |
| Use `text-sky-500` for info                    | Use `text-info` (defined token)               |

## Responsive Behavior

Linear is a desktop application. Biarritz follows the same philosophy:

- **Minimum viewport**: 1024px. Do not add mobile breakpoints.
- **Sidebar**: Always visible, fixed width. No hamburger menu.
- **Content**: Fills remaining space. No max-width container on list pages.
- **Detail views**: Use `max-w-2xl` for readability on wide screens.
