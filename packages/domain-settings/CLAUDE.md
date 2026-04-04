# packages/domain-settings

Settings domain. Owns the `/settings` route namespace.

## Routes
- `/settings` — Settings page with theme toggle

## Key Rules
- No database interaction — settings are stored in localStorage
- Theme utilities live in `src/lib/theme.ts`
- The settings page is a client component (uses localStorage)
- Theme is applied by toggling the `dark` class on `document.documentElement`
- The `biarritz-theme` localStorage key stores `"light"` or `"dark"`
