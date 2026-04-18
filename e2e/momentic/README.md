# Momentic E2E Tests

This directory holds Momentic `.test.yaml` (and optional `.module.yaml`) files. They run in a real Chromium browser against a running dev server.

Tests are authored by agents during PR work, typically via the Momentic MCP server (`.mcp.json` at repo root). Humans can also author tests by hand using the schema at <https://momentic.ai/docs/editor/test-definition>.

## Running

**Full suite (local dev server on :3000):**
```bash
pnpm test:momentic
```

**Single test:**
```bash
npx momentic run e2e/momentic/create-project.test.yaml --url-override http://localhost:3000
```

**Against a staging URL:**
```bash
npx momentic run --url-override https://staging.example.com
```

## Requirements

- `MOMENTIC_API_KEY` in environment (get from Momentic Cloud → API keys; in local dev put it in `.env.local`)
- Browsers installed: `npx momentic install-browsers --all` (already handled by `pnpm agent:cloud-setup`)

## When to add/modify/skip tests

See the root `AGENTS.md` → "E2E testing with Momentic". The PR body must explain test decisions in its `## Testing` section.
