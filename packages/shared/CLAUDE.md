# packages/shared

Shared types, constants, and utilities used across all packages.

## Key Rules
- No React dependencies — this package is framework-agnostic
- No database dependencies — this package is infrastructure-agnostic
- Types go in `src/types/`, constants in `src/constants/`, utilities in `src/utils/`
- Everything re-exported from `src/index.ts`
- Keep this package small — domain-specific logic belongs in domain packages
