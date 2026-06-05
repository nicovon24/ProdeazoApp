# CURRENT.md

> Live project state. First document any new session should read.
> Structure is mandated by `CLAUDE.md` → Context Management Protocol. Do not deviate.
> Older entries live in `docs/changelog.md`. Architectural decisions live in `ARCHITECTURE.md`.

---

## Now (last updated: 2026-06-05)

- Branch: `feat/functionality-3`
- Working on: Fix `leaveLeague()` endpoint mismatch — frontend calls `/members/me` but backend exposes `DELETE /:id/leave`.

---

## Next (top 3, ordered by priority)

1. Fix `leaveLeague()` endpoint mismatch — frontend calls `/members/me` but backend exposes `DELETE /:id/leave`.
2. Wire fixture page to real tournament data end-to-end (group standings from API, not client-only).
3. Verify password reset email delivery (SMTP Gmail credentials).

Then: merge `feat/functionality-3` → `master` once confirmed stable.

---

## Blocked / Known issues

- `leaveLeague()` endpoint mismatch (see Next #1) — currently breaks "leave league" UX.
- SMTP Gmail delivery not yet verified end-to-end in production.

---

## Recently shipped (last ~7 days)

- 2026-06-05 — StatsCardSkeleton responsive fix: changed from inline `grid-template-columns: repeat(3, 1fr)` to Tailwind `grid-cols-1 sm:grid-cols-3` so cards stack vertically on mobile.
- 2026-06-05 — Bracket placeholder handling: added `isBracketPlaceholder` / `fixtureHasBracketSlot` utility to detect knockout matches with undetermined teams (1C, 2F, W74, etc.). Home page filters them from pending panels and count. Predictions page shows them darkened with "A confirmar" label, locked to prevent predictions, and excluded from pending/saved counts. Fixture page unaffected.
- 2026-06-04 — Rankings page: error handling (`.catch()` guards), 2-col layout (top 30 sidebar + chart + "Los mejores del mes" placeholder), removed pre-tournament empty state.
