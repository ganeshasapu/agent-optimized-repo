# packages/ui

Shared UI component library built on shadcn/ui.

## Included Components
Button, Input, Label, Textarea, Card, Badge, Separator, Select, Dialog, DropdownMenu

## Key Rules
- Add components via shadcn CLI: `npx shadcn@latest add <component> --path=src/components`
- All components re-exported from `src/index.ts`
- Use `cn()` from `src/lib/utils.ts` for className merging
- Components must be server-component compatible (no hooks unless marked "use client")
- Follow shadcn/ui patterns: CVA for variants, forwardRef for polymorphism
- Radix UI primitives provide accessibility — do not remove aria attributes
