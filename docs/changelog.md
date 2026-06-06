# Changelog

> Append-only historical record of shipped work. Newest entries on top.
> Entries are moved here from `CURRENT.md` during the session-close ritual (see `CLAUDE.md` → Context Management Protocol).
> Architectural decisions do NOT go here — they live in `ARCHITECTURE.md` as ADRs.

---

## 2026-06-02 — feat/functionality-3 — UI & Fixture Polish Sprint

**Fixture page (`frontend/src/app/(main)/fixture/page.tsx`)**
- Full rewrite: sorting by date/phase/group, phase i18n (`formatFixturePhase`), group standings panel (`buildGroupStandings` from `frontend/src/lib/group-standings.ts`).
- Search bar with mobile-specific shorter placeholder (`<768px`).
- Back-to-top button: green by default with black arrow, darkens on hover.
- Fixture cards: gradient background, subtle border, hover border effect.

**Home page (`frontend/src/app/(main)/home/page.tsx`)**
- "Pendientes" tasks panel integrated into match panels.
- Dashboard API call updated in `frontend/src/api/dashboard.ts`.
- Backend model fixes: `dashboard-panels.model.ts` and `dashboard.model.ts`.

**Header & Layout**
- Header now has an X.com social link.
- Instagram + X buttons: unified style, `active:scale-95` on both.
- Sidebar: drawer adjusted below navbar.
- Rankings page title fixed to "Rankings".

**Lib / Utilities**
- `frontend/src/lib/fixture-utils.ts`: added `sortFixtures`, `sortRoundsPhases`, `formatRoundName`, `formatFixturePhase`, `getPredictionBadgeTone`, `formatPredictionScore`.
- `frontend/src/lib/group-standings.ts`: new file — builds group standings from fixture data.

**Cleanup**
- Deleted `.planning/pages-concepts/` image assets (7 PNG files, ~8 MB freed).

---

## feat/functionality-2 — Auth, Mini-Leagues & Rankings

- JWT auth migration (replaced cookie-session).
- Mini-leagues invite link (`/join?token=`) — fixed query param bug.
- Forgot password full flow (token table, SMTP Gmail, `/forgot-password` + `/reset-password`).
- Rankings with real data: cumulative chart from `GET /api/leaderboard/me/history`, tie-aware rank.
- Docker fix: port 5433, non-interactive migrations.
- DB cleanup: removed PL 2025/26 + Brasileirão 2026 (784 fixtures). Remaining: FIFA WC 2026 (104) + UCL 2025/26 (281).
- CSS Modules deleted → all styles in Tailwind.
- Spanish country names via `getCountryName()`.
