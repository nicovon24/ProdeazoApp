# CURRENT.md

> Live project state. First document any new session should read.
> Structure is mandated by `CLAUDE.md` → Context Management Protocol. Do not deviate.
> Older entries live in `docs/changelog.md`. Architectural decisions live in `ARCHITECTURE.md`.

---

## Now (last updated: 2026-06-04)

- Branch: `feat/functionality-3`
- Working on: Rankings page polish — error handling, 2-column layout with top 30 sidebar.

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

- 2026-06-04 — Rankings page: error handling (`.catch()` guards), 2-col layout (top 30 sidebar + chart + "Los mejores del mes" placeholder), removed pre-tournament empty state.
- 2026-06-02 — Context management protocol: mandatory ritual added to `CLAUDE.md`, `docs/changelog.md` created, `CURRENT.md` compacted.
- 2026-06-02 — Fixture page polish sprint shipped on `feat/functionality-3` (see `docs/changelog.md` for full breakdown).
