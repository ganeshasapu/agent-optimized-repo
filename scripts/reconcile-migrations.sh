#!/usr/bin/env bash
# reconcile-migrations.sh — Auto-resolve Drizzle migration conflicts with main
#
# When multiple agents generate migrations from the same base state, they produce
# conflicting 0002_*.sql files. This script detects the conflict and regenerates
# the migration from the PR's schema changes against main's migration state.
#
# Usage: ./scripts/reconcile-migrations.sh [--dry-run]
# Exit codes: 0 = success/no-op, 1 = semantic conflict (needs human), 2 = error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=true; fi

MIGRATION_DIR="packages/db/src/migrations"
SCHEMA_DIR="packages/db/src/schema"
META_DIR="${MIGRATION_DIR}/meta"
JOURNAL="${META_DIR}/_journal.json"

# ---------------------------------------------------------------------------
# 1. Fetch latest main for comparison
# ---------------------------------------------------------------------------
git fetch origin main --quiet

MERGE_BASE=$(git merge-base HEAD origin/main)

# ---------------------------------------------------------------------------
# 2. Get main's max migration index
# ---------------------------------------------------------------------------
MAIN_MAX_IDX=$(git show origin/main:"${JOURNAL}" 2>/dev/null | python3 -c "
import sys, json
try:
    entries = json.load(sys.stdin)['entries']
    print(max(e['idx'] for e in entries) if entries else -1)
except:
    print(-1)
")

log_info "Main's latest migration index: ${MAIN_MAX_IDX}"

# ---------------------------------------------------------------------------
# 3. Find migration SQL files added by this PR (not on main)
# ---------------------------------------------------------------------------
PR_NEW_SQLS=$(git diff --name-only "${MERGE_BASE}"..HEAD -- "${MIGRATION_DIR}/"'*.sql' 2>/dev/null || true)

if [[ -z "$PR_NEW_SQLS" ]]; then
  log_info "No new migration files on this branch. Nothing to reconcile."
  exit 0
fi

log_info "PR added migrations: $(echo "$PR_NEW_SQLS" | tr '\n' ' ')"

# ---------------------------------------------------------------------------
# 4. Extract PR's lowest migration index
# ---------------------------------------------------------------------------
PR_MIN_IDX=$(echo "$PR_NEW_SQLS" | sed 's|.*/\([0-9]*\)_.*|\1|' | sort -n | head -1)

log_info "PR's lowest migration index: ${PR_MIN_IDX}"

# ---------------------------------------------------------------------------
# 5. Check for conflict: PR's index <= main's max index
# ---------------------------------------------------------------------------
if [[ "$((10#${PR_MIN_IDX}))" -gt "$((MAIN_MAX_IDX))" ]]; then
  log_success "No conflict. PR migrations start at ${PR_MIN_IDX}, main ends at ${MAIN_MAX_IDX}."
  exit 0
fi

log_warn "Migration conflict detected: PR starts at ${PR_MIN_IDX} but main is at ${MAIN_MAX_IDX}."

# ---------------------------------------------------------------------------
# 6. Semantic conflict check — same schema file modified in both branches
# ---------------------------------------------------------------------------
MAIN_SCHEMA_CHANGES=$(git diff --name-only "${MERGE_BASE}"..origin/main -- "${SCHEMA_DIR}/"'*.ts' 2>/dev/null | grep -v 'index\.ts$' || true)
PR_SCHEMA_CHANGES=$(git diff --name-only "${MERGE_BASE}"..HEAD -- "${SCHEMA_DIR}/"'*.ts' 2>/dev/null | grep -v 'index\.ts$' || true)

if [[ -n "$MAIN_SCHEMA_CHANGES" ]] && [[ -n "$PR_SCHEMA_CHANGES" ]]; then
  CONFLICTS=$(comm -12 <(echo "$MAIN_SCHEMA_CHANGES" | sort) <(echo "$PR_SCHEMA_CHANGES" | sort) || true)
  if [[ -n "$CONFLICTS" ]]; then
    log_error "SEMANTIC CONFLICT: Same schema files modified on both main and this PR:"
    echo "$CONFLICTS"
    log_error "This requires manual resolution."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Dry run stops here
# ---------------------------------------------------------------------------
if $DRY_RUN; then
  log_info "[DRY RUN] Would reconcile migrations from index ${PR_MIN_IDX} to $((MAIN_MAX_IDX + 1)). Exiting."
  exit 0
fi

# ---------------------------------------------------------------------------
# 7. Merge main into this branch (creates proper merge relationship for GitHub)
# ---------------------------------------------------------------------------
log_info "Merging origin/main into branch..."

# Save the PR's schema files before merge (these are the source of truth)
PR_SCHEMA_FILES=""
for f in ${PR_SCHEMA_CHANGES}; do
  if [[ -f "$f" ]]; then
    cp "$f" "/tmp/pr_schema_$(basename "$f")"
    PR_SCHEMA_FILES="$PR_SCHEMA_FILES $f"
  fi
done

# Merge main, accepting main's version for conflicts (we'll fix migration files next)
if ! git merge origin/main --no-edit -X theirs 2>/dev/null; then
  # If merge still has conflicts, resolve them by accepting main's version
  # for migration artifacts and keeping PR's schema files
  git checkout --theirs -- "${MIGRATION_DIR}/" "${META_DIR}/" 2>/dev/null || true
  git checkout --theirs -- "${SCHEMA_DIR}/index.ts" 2>/dev/null || true
  git add "${MIGRATION_DIR}/" "${META_DIR}/" "${SCHEMA_DIR}/index.ts" 2>/dev/null || true

  # Restore PR's schema .ts files (source of truth)
  for f in ${PR_SCHEMA_FILES}; do
    BACKUP="/tmp/pr_schema_$(basename "$f")"
    if [[ -f "$BACKUP" ]]; then
      cp "$BACKUP" "$f"
      git add "$f"
    fi
  done

  git commit --no-edit -m "ci: merge main for migration reconciliation" 2>/dev/null || true
fi

log_info "Merged main successfully."

# ---------------------------------------------------------------------------
# 8. Delete this PR's conflicting migration files (now on top of main's state)
# ---------------------------------------------------------------------------
NEXT_IDX=$((MAIN_MAX_IDX + 1))
log_info "Removing PR's conflicting migration files (index >= ${NEXT_IDX})..."

# After merging main, the PR's old migration files may still exist
for f in $PR_NEW_SQLS; do
  if [[ -f "$f" ]]; then
    rm -f "$f"
    log_info "  Deleted: $f"
  fi
done

# Delete snapshots beyond main's state
for f in "${META_DIR}/"*_snapshot.json; do
  [[ -f "$f" ]] || continue
  IDX=$(basename "$f" | sed 's/\([0-9]*\)_.*/\1/')
  if [[ "$((10#${IDX}))" -ge "$NEXT_IDX" ]]; then
    rm -f "$f"
    log_info "  Deleted snapshot: $f"
  fi
done

# Reset journal to main's version (clean base for regeneration)
git checkout origin/main -- "${JOURNAL}" 2>/dev/null || true

# ---------------------------------------------------------------------------
# 9. Regenerate schema/index.ts from filesystem
# ---------------------------------------------------------------------------
log_info "Regenerating schema/index.ts..."

{
  for file in "${SCHEMA_DIR}"/*.ts; do
    [[ "$(basename "$file")" == "index.ts" ]] && continue
    [[ -f "$file" ]] || continue
    MODULE=$(basename "$file" .ts)
    # Parse the actual exported const name from the file
    EXPORT_NAME=$(grep -oP 'export const \K\w+' "$file" | head -1 || true)
    if [[ -n "$EXPORT_NAME" ]]; then
      echo "export { ${EXPORT_NAME} } from \"./${MODULE}\";"
    fi
  done
} | sort > "${SCHEMA_DIR}/index.ts"

log_info "  Exports: $(cat "${SCHEMA_DIR}/index.ts" | tr '\n' ' ')"

# ---------------------------------------------------------------------------
# 10. Regenerate migration from schema diff
# ---------------------------------------------------------------------------
log_info "Running drizzle-kit generate..."

cd packages/db
# drizzle-kit generate doesn't connect to DB, but config loads DATABASE_URL
DATABASE_URL="postgresql://reconcile:reconcile@localhost:5432/reconcile" npx drizzle-kit generate
cd ../..

# Verify a new migration was generated
NEW_SQL=$(ls "${MIGRATION_DIR}/"*.sql 2>/dev/null | sort | tail -1)
if [[ -n "$NEW_SQL" ]]; then
  NEW_IDX=$(basename "$NEW_SQL" | sed 's/\([0-9]*\)_.*/\1/')
  log_success "Regenerated migration: $(basename "$NEW_SQL") (index ${NEW_IDX})"
else
  log_warn "No new migration generated. Schema may already match main's state."
fi

# ---------------------------------------------------------------------------
# 11. Stage and commit
# ---------------------------------------------------------------------------
git add "${MIGRATION_DIR}/" "${SCHEMA_DIR}/index.ts" "${SCHEMA_DIR}/"*.ts

if git diff --cached --quiet; then
  log_info "No changes to commit after reconciliation."
else
  git commit -m "ci: reconcile migration conflicts with main

Migration index adjusted from ${PR_MIN_IDX} to ${NEXT_IDX}.
Schema barrel exports regenerated from filesystem."
  log_success "Migration reconciliation complete."
fi
