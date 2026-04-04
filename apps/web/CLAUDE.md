# apps/web

Next.js 15 application (App Router). This is the deployment target.

## Key Rules
- This app primarily re-exports routes from domain packages
- Domain routes go in `app/(domains)/` as thin re-export files
- Keep business logic in domain packages, not here
- When adding a new domain, update both `package.json` (dependency) and `next.config.ts` (transpilePackages)
- Global layout, error boundaries, and middleware live here
- Tailwind v4: styles configured via `app/global.css` with `@import "tailwindcss"`
