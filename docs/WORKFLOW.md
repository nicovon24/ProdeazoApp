# WORKFLOW.md — How to work on Prodeazo

## Context

There is a single human developer (you). The L2 roles (Product, Architect, Developer, Reviewer) are executed by Claude in separate sessions. The separation is not person-to-person — it is session-to-session.

---

## Full flow

```
You have an idea or a bug
        │
        ▼
┌─────────────────────────────────────────┐
│  SESSION 1 — Role: Architect            │
│  "I want to add X"                      │
│  Claude reads CLAUDE.md + VISION.md     │
│  Output: SPEC + PLAN                    │
│  You review → does it make sense? scope?│
└─────────────────────────────────────────┘
        │  you approve the plan
        ▼
┌─────────────────────────────────────────┐
│  SESSION 2 — Role: Developer            │
│  Claude reads CLAUDE.md + the PLAN      │
│  + docs/rules/api.md (if backend)       │
│  Implements following the plan          │
│  Output: code + commit                  │
└─────────────────────────────────────────┘
        │  code written
        ▼
┌─────────────────────────────────────────┐
│  SESSION 3 — Role: Reviewer             │
│  Claude reads CLAUDE.md + PLAN + diff   │
│  Output: BLOCK / FLAG / NOTE            │
│  You decide whether to merge or iterate │
└─────────────────────────────────────────┘
        │  you approve
        ▼
       PR → master (you)
```

---

## How to open each session

State the role explicitly at the start:

**Architect:**
> "Act as Architect. I want to add X. Read CLAUDE.md and propose a SPEC + PLAN."

**Developer:**
> "Act as Developer. Implement Plan 6.1 from backend/.planning/PLAN.md. Also read docs/rules/api.md."

**Reviewer:**
> "Act as Reviewer. Review the diff of branch `feat/X` against master. Use the checklist in docs/agents/reviewer.md."

---

## When to collapse sessions

For small tasks (bugfix, query tweak, copy change) a single **Developer** session is enough.

The Architect + Reviewer overhead is justified when:

- The feature touches auth, scoring, or DB structure
- There is a new architectural decision (new endpoint, new table, flow change)
- The change is potentially breaking in production

For a typo in a frontend label: one session, Developer role, done.

---

## Session close (mandatory)

The agent runs the **Context Management Protocol** defined in `CLAUDE.md` automatically as the last step of any session that produced code changes. The user does not need to ask.

In short, every session-close updates the three context files in this order:

1. `CURRENT.md` — bump `## Now` date, refresh `## Next`, `## Blocked`, prepend today's line to `## Recently shipped`.
2. `docs/changelog.md` — append anything older than ~7 days that fell off `CURRENT.md`.
3. `ARCHITECTURE.md` — add an ADR if (and only if) an architectural decision was made.

See `CLAUDE.md` → **Context Management Protocol** for the full rules (file roles, max sizes, mandatory `CURRENT.md` structure, the 7-step ritual). That document is the single source of truth — do not re-document the ritual elsewhere.

Without this step, the next session starts blind.

---

## The step that is always yours

The final PR to `master`. Never delegated. This is where you apply business judgement the AI does not have: *"this is technically fine but not what I want to show the user yet."*

---

## References

| What | Where |
|------|-------|
| Session context (stack, invariants) | `CLAUDE.md` |
| Product vision and phases | `VISION.md` |
| Architectural decisions (ADRs) | `ARCHITECTURE.md` |
| Role definitions | `docs/agents/` |
| Domain rules | `docs/rules/` |
| Backend phase state | `backend/.planning/STATE.md` |
