# Biarritz Issue Tracker — Stress Test Project Design

## Context

The goal is to stress test the agent-optimized development pipeline (Linear → decompose → agent implement → auto-review → revision → merge) by building a non-trivial product: a **Linear-style issue tracker** within the existing Biarritz monorepo. This exercises complex business logic, multi-table queries, real UI with forms/state, and cross-domain coordination — all areas where agents are most likely to struggle.

The project builds on existing infrastructure: `domain-users`, `domain-projects`, orphan DB tables (comments, tags, categories), the full shadcn/ui component library, and Linear's design system as the visual reference.

---

## Domain Architecture

### New Domain Packages (6)

| Package | Purpose | Routes |
|---|---|---|
| `domain-issues` | Core issue CRUD, list with filters, detail with inline edit | `/projects/[id]/issues`, `/projects/[id]/issues/new`, `/projects/[id]/issues/[issueId]` |
| `domain-workflows` | Project-scoped status definitions (Backlog → Todo → In Progress → Done → Canceled) | `/projects/[id]/settings/workflows` |
| `domain-labels` | Project-scoped labels with colors, M:N with issues | `/projects/[id]/settings/labels` |
| `domain-comments` | Threaded comments on issues | No standalone routes — embedded in issue detail |
| `domain-activity` | Activity feed (automatic change tracking) | No standalone routes — embedded in issue detail |
| `domain-views` | Saved filtered/sorted/grouped issue lists with JSONB config | `/projects/[id]/views`, `/projects/[id]/views/[viewId]` |

### Extended Existing Packages (2)

- **`domain-users`** — Add `avatarUrl` field for assignee display
- **`domain-projects`** — Add `identifier` (short code, e.g. "PROJ"), `issueCounter` (auto-increment), project member management, default workflow seeding on project creation, project settings/nav

---

## Database Schema

### New Tables

**`workflow_statuses`**
```
id          uuid PK
projectId   uuid FK→projects
name        text NOT NULL
color       text NOT NULL
position    integer NOT NULL (display order)
type        text NOT NULL ('backlog' | 'unstarted' | 'started' | 'completed' | 'canceled')
createdAt   timestamp
```

**`issues`**
```
id          uuid PK
identifier  text UNIQUE NOT NULL (e.g. "PROJ-42", auto-generated)
title       text NOT NULL
description text (nullable, markdown)
projectId   uuid FK→projects
statusId    uuid FK→workflow_statuses
priority    integer NOT NULL DEFAULT 0 (0=none, 1=urgent, 2=high, 3=medium, 4=low)
assigneeId  uuid FK→users (nullable)
creatorId   uuid FK→users
estimate    integer (nullable, story points)
dueDate     timestamp (nullable)
sortOrder   real NOT NULL (for manual ordering within status groups)
createdAt   timestamp
updatedAt   timestamp
```

**`labels`** (replaces orphan `tags` table)
```
id          uuid PK
projectId   uuid FK→projects
name        text NOT NULL
color       text NOT NULL
createdAt   timestamp
```

**`issue_labels`** (join table)
```
issueId     uuid FK→issues
labelId     uuid FK→labels
PK: (issueId, labelId)
```

**`project_members`**
```
projectId   uuid FK→projects
userId      uuid FK→users
role        text NOT NULL ('owner' | 'member')
joinedAt    timestamp
PK: (projectId, userId)
```

**`activity_events`**
```
id          uuid PK
issueId     uuid FK→issues
actorId     uuid FK→users
type        text NOT NULL ('created' | 'updated' | 'commented' | 'label_added' | 'label_removed' | 'assigned' | 'unassigned' | 'status_changed' | 'priority_changed')
field       text (nullable)
oldValue    text (nullable)
newValue    text (nullable)
createdAt   timestamp
```

**`views`**
```
id          uuid PK
name        text NOT NULL
projectId   uuid FK→projects
creatorId   uuid FK→users
filters     jsonb NOT NULL DEFAULT '{}' — { status: uuid[], priority: number[], assignee: uuid[], label: uuid[] }
sort        jsonb NOT NULL DEFAULT '{}' — { field: string, direction: 'asc' | 'desc' }
groupBy     text (nullable) — 'status' | 'priority' | 'assignee' | 'label'
createdAt   timestamp
updatedAt   timestamp
```

### Modified Tables

**`users`** — add `avatarUrl text` (nullable)

**`projects`** — add:
- `identifier text UNIQUE NOT NULL` (short code like "PROJ")
- `issueCounter integer NOT NULL DEFAULT 0` (auto-increments for issue identifiers)

### Tables to Drop/Replace

- `tags` — replaced by `labels` (project-scoped)
- `categories` — drop (unused, workflow_statuses serves this purpose)
- `comments` — extend with `issueId uuid FK→issues` and `parentId uuid FK→comments` (nullable, for threading), add `updatedAt timestamp`

---

## Key Business Logic

### Issue Identifier Generation
When creating an issue: atomically increment `projects.issueCounter` and construct identifier as `{project.identifier}-{counter}`. Must be done in a transaction to prevent duplicates.

### Default Workflow Seeding
When a project is created, auto-create 5 default statuses:
1. Backlog (type: backlog, color: gray)
2. Todo (type: unstarted, color: gray)
3. In Progress (type: started, color: yellow)
4. Done (type: completed, color: green)
5. Canceled (type: canceled, color: red)

### Activity Logging
Issue service mutations (update, status change, assignment, label add/remove) should create `activity_events` records. This is done in the issue service, not via DB triggers. The activity service is read-only.

### Filtered Issue List Queries
The issue list service must support:
- Filter by: status (multi), priority (multi), assignee (multi), label (multi)
- Sort by: createdAt, updatedAt, priority, dueDate, title
- Group by: status, priority, assignee
- Pagination with cursor or offset

This requires a dynamic query builder using Drizzle's `where()` with conditional `and()`/`or()` clauses and joins through `issue_labels`.

---

## UI Components (Key Complex Ones)

### `domain-issues`
- **`issue-list.tsx`** — Grouped list with section headers (like Linear's default view). Each group collapsible.
- **`issue-row.tsx`** — Single row: identifier, title, status dot, priority icon, assignee avatar, labels as badges, due date.
- **`filter-bar.tsx`** — Horizontal bar with dropdown filters for status, priority, assignee, label. Active filters shown as removable badges.
- **`issue-form.tsx`** — Create/edit form with: title input, markdown description textarea, status select, priority select, assignee select (searches users), label multi-select, estimate input, due date picker.
- **`issue-detail.tsx`** — Split layout: main content (title, description, comments) + right sidebar (status, priority, assignee, labels, estimate, due date — all inline-editable).
- **`priority-icon.tsx`** — SVG icons matching Linear's priority indicators.
- **`status-indicator.tsx`** — Colored dot/circle matching status type.

### `domain-comments`
- **`comment-thread.tsx`** — Flat or threaded display, newest-last.
- **`comment-form.tsx`** — Textarea with submit, shown at bottom of thread.

### `domain-activity`
- **`activity-feed.tsx`** — Chronological timeline showing field changes, interleaved with comments.

### Navigation
- **Project sidebar** — Links to Issues, Views, Settings (members, workflows, labels). Lives in `domain-projects`.
- **Global nav** — Project switcher in sidebar. Lives in `apps/web` layout.

---

## Ticket Breakdown (~43 tickets across 9 phases)

### Phase 1: Schema & Foundation (8 tickets)
These are all independent — agents can run in parallel.

1. **Add `identifier` and `issueCounter` fields to projects table** — Schema change + migration. Extend project types.
2. **Add `avatarUrl` field to users table** — Schema change + migration. Extend user types.
3. **Create `workflow_statuses` table** — New schema file, export from index, generate migration.
4. **Create `issues` table** — New schema with all FKs, generate migration.
5. **Create `project_members` table** — Join table schema, generate migration.
6. **Create `labels` table** (replacing tags) — New schema with projectId, generate migration. Drop old tags references.
7. **Create `issue_labels` join table** — Schema, generate migration.
8. **Create `activity_events` table** — Schema, generate migration.

> **Stress dimension**: 8 agents touching `packages/db/src/schema/` simultaneously. Migration reconciliation workflow gets tested heavily.

### Phase 2: Workflows Domain (4 tickets)

9. **Create `domain-workflows` package** — Scaffold package (package.json, tsconfig, vitest config, eslint config). Implement workflow service (CRUD statuses, reorder). Types + Zod validations.
10. **Seed default workflows on project creation** — Extend `domain-projects` project service to auto-create 5 default statuses in a transaction after project creation.
11. **Build workflow settings page** — UI to list, reorder, add, edit, delete statuses. Color picker for status color. Route: `/projects/[id]/settings/workflows`.
12. **Tests for workflow service** — Unit tests (mocked DB) + integration tests.

### Phase 3: Labels Domain (3 tickets)

13. **Create `domain-labels` package** — Scaffold + label service (CRUD, project-scoped). Types + validations.
14. **Build label settings page** — UI to manage labels with color swatches. Route: `/projects/[id]/settings/labels`.
15. **Tests for label service** — Unit + integration tests.

### Phase 4: Core Issues (8 tickets)
The heart of the stress test.

16. **Create `domain-issues` package scaffold** — Package structure, types, Zod validations (createIssueSchema, updateIssueSchema, issueFilterSchema).
17. **Implement issue CRUD service** — create (with identifier generation + transaction), update, delete, getById (with joins to status, assignee, project, labels).
18. **Implement issue list service** — Filterable, sortable, paginated queries. Dynamic WHERE builder. Grouped results. This is the hardest service ticket.
19. **Build issue creation form** — Full form with status/priority/assignee/label selects, estimate input, due date. Server action.
20. **Build issue list page with filter bar** — The main UI: grouped list + filter dropdowns + sort control. Route: `/projects/[id]/issues`.
21. **Build issue detail page** — Split layout with inline-editable sidebar fields. Route: `/projects/[id]/issues/[issueId]`.
22. **Implement issue identifier auto-generation** — Transaction-safe counter increment + identifier construction in issue create service.
23. **Tests for issue services** — Unit + integration tests for CRUD and list services.

> **Stress dimension**: Ticket 18 (filtered list) requires building a dynamic query with conditional joins — the most complex single service the agent will write. Ticket 21 (detail page) requires pulling data from 4+ tables and rendering inline-editable fields.

### Phase 5: Comments (4 tickets)

24. **Extend comments table schema** — Add `issueId`, `parentId`, `updatedAt` columns. Generate migration.
25. **Create `domain-comments` package** — Service (create, list by issue, delete), types, validations.
26. **Build comment thread UI** — Comment list + reply capability + form. Embedded component for issue detail page.
27. **Tests for comment service** — Unit + integration tests.

### Phase 6: Activity Tracking (4 tickets)

28. **Create `domain-activity` package** — Activity service (create event, list by issue), types.
29. **Add activity logging to issue service** — On update/status change/assignment/label change, create activity_events records. Cross-domain import.
30. **Build activity feed component** — Timeline UI showing changes with human-readable descriptions (e.g., "Alice changed status from Todo to In Progress").
31. **Tests for activity service** — Unit + integration tests.

> **Stress dimension**: Ticket 29 requires modifying an existing domain (`domain-issues`) to import from another domain (`domain-activity`). Cross-domain coordination.

### Phase 7: Project Extensions (4 tickets)

32. **Implement project member service** — Add/remove members, list members, role management. Extend `domain-projects`.
33. **Build project settings page with member management** — Settings layout with sub-navigation (General, Members, Workflows, Labels). Route: `/projects/[id]/settings`.
34. **Build project sidebar navigation** — Sidebar component with links to Issues, Views, Settings. Used in project layout.
35. **Tests for member service** — Unit + integration tests.

### Phase 8: Views (5 tickets)

36. **Create `views` table schema** — JSONB columns for filters/sort, generate migration.
37. **Create `domain-views` package** — Service (CRUD views, apply view filters to issue query), types, validations.
38. **Build view creation/editing form** — UI to configure filters, sort, groupBy and save as named view.
39. **Build view list + view detail pages** — List saved views, apply a view (renders issue list with saved config). Routes: `/projects/[id]/views`, `/projects/[id]/views/[viewId]`.
40. **Tests for view service** — Unit + integration tests.

> **Stress dimension**: Views service must construct dynamic Drizzle queries from JSONB config. The view detail page reuses `domain-issues` list component but with externally-provided filter state.

### Phase 9: Polish & Integration (4 tickets)

41. **Build project dashboard page** — Issue counts by status (bar or donut), recent activity feed, open issues assigned to you. Route: `/projects/[id]`.
42. **Add empty states for all list views** — Empty state illustrations/messages for: no issues, no labels, no members, no views, no comments, no activity.
43. **Build global navigation** — Sidebar with project list, project switcher. Update `apps/web` root layout.
44. **Extend projects list and detail pages** — Update existing `domain-projects` pages to show member count, issue count, link to new project sub-pages.

---

## What This Stress Tests

| Dimension | How It's Exercised |
|---|---|
| **Schema complexity** | 8+ new tables, multiple FKs, join tables, JSONB columns, migration reconciliation |
| **Multi-table queries** | Issue list joins issues + statuses + users + labels (through join table) |
| **Business logic** | Transaction-safe identifier generation, default workflow seeding, activity logging |
| **Complex forms** | Issue form: 7+ fields, selects querying other tables, date picker |
| **UI state** | Filter bar with active filters, inline editing, collapsible groups |
| **Cross-domain coordination** | Issue detail pulls from issues + comments + activity + labels domains |
| **Decomposition** | Parent tickets like "Build issue detail page" should naturally decompose |
| **Parallel execution** | Phase 1 (8 schema tickets) can all run simultaneously |
| **Migration reconciliation** | Multiple agents modifying `packages/db/src/schema/` in parallel |
| **Review quality** | Design system compliance, import conventions, test coverage enforcement |
| **Revision loop** | Complex UI tickets likely trigger reviewer feedback |
| **Dynamic query building** | Filtered issue list + saved views require conditional Drizzle query construction |

---

## Ticket Creation Strategy

Create **9 parent tickets** in Linear (one per phase). Move each to "Decompose" status to let the decomposition agent break them into sub-tickets. The decomposer should produce tickets close to the breakdown above.

**Ordering**: Phases must be sequential (schema before services before UI), but tickets within each phase can run in parallel.

**Expected agent success rate by phase**:
- Phase 1 (Schema): ~95% — straightforward schema + migration
- Phase 2-3 (Workflows/Labels): ~90% — standard CRUD domain packages
- Phase 4 (Issues): ~70-80% — complex queries and forms will likely need revision loops
- Phase 5-6 (Comments/Activity): ~85% — moderate complexity
- Phase 7-8 (Project/Views): ~75% — cross-domain coordination + JSONB query building
- Phase 9 (Polish): ~80% — integration work, less isolated

---

## Verification

After each phase, run:
```bash
pnpm agent:verify  # typecheck → lint → test → build
```

After full build-out:
1. Create a project → verify default statuses appear
2. Create labels → verify they show in issue form
3. Create issue → verify identifier auto-generated, appears in list
4. Filter/sort issue list → verify dynamic queries work
5. Edit issue inline → verify activity logged
6. Add comments → verify threading works
7. Save a view → verify it applies filters when loaded
8. Check all empty states render correctly
