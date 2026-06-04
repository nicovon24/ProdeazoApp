import { db } from '../db/client'
import { teams, fixtures, tournaments } from '../db/schema'
import { eq, and, notInArray, lte, gte, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { createBzzoiroProvider, extractTeamsFromFixtures } from '../providers/bzzoiro'
import { enrichFixturesTeamsFromRoster } from '../providers/participant-names'
import { dedupeTeams } from '../providers/normalize'
import { normalizeBzzoiroApiKey } from '../providers/bzzoiro-token'
import { FixtureStatus } from '../constants/fixture-status'
import { TOURNAMENTS } from '../scripts/tournaments.config'

// Mirrors isLikelyBracketPlaceholder() from providers/participant-names.ts as a Postgres regex
const PLACEHOLDER_REGEX = '^([WL]\\d+|[12][A-L]|[A-L][12]|[A-L]\\d|\\d[A-Z](/\\d[A-Z])+)$'

const TERMINAL_STATUSES = [
  FixtureStatus.Finished,
  FixtureStatus.Postponed,
  FixtureStatus.Cancelled,
]

let syncInFlight = false

export async function maybeRunFixtureMetaSync(): Promise<void> {
  if (syncInFlight) return
  syncInFlight = true
  try {
    await runIfNeeded()
  } finally {
    syncInFlight = false
  }
}

async function runIfNeeded(): Promise<void> {
  const homeTeam = alias(teams, 'home')
  const awayTeam = alias(teams, 'away')
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        notInArray(fixtures.status, TERMINAL_STATUSES),
        gte(fixtures.date, now),
        lte(fixtures.date, in7Days),
        or(
          sql`${homeTeam.name} ~* ${PLACEHOLDER_REGEX}`,
          sql`${awayTeam.name} ~* ${PLACEHOLDER_REGEX}`,
        ),
      ),
    )

  if (count === 0) {
    console.log('[fixture-meta-sync] No upcoming fixtures with placeholder teams — skipping')
    return
  }

  console.log(`[fixture-meta-sync] ${count} fixture(s) with unresolved team names — syncing from API`)

  const apiKey = normalizeBzzoiroApiKey(process.env.BZZOIRO_API_KEY ?? '')
  if (!apiKey) {
    console.error('[fixture-meta-sync] Missing BZZOIRO_API_KEY — skipping sync')
    return
  }
  const base = (process.env.BZZOIRO_BASE_URL ?? 'https://sports.bzzoiro.com/api').replace(/\/+$/, '')
  const tz = process.env.BSD_TIMEZONE ?? 'UTC'

  for (const cfg of TOURNAMENTS) {
    try {
      const provider = createBzzoiroProvider({ apiKey, baseUrl: base, timezone: tz })

      const fixturesData = await provider.listFixtures({ seasonId: cfg.seasonId })
      const rosterFull = await provider.listTeams({
        leagueId: cfg.leagueId,
        inCompetition: true,
        v2Limit: Number(process.env.BZZOIRO_V2_TEAMS_LIMIT) || 1000,
      })
      const enriched = enrichFixturesTeamsFromRoster(fixturesData, rosterFull)
      const nationsWithCountry = rosterFull.filter((t) => Boolean(t.country?.trim()))
      const teamEntities = dedupeTeams([...extractTeamsFromFixtures(enriched), ...nationsWithCountry])

      // Resolve tournament id
      const [tournamentRow] = await db
        .select({ id: tournaments.id })
        .from(tournaments)
        .where(eq(tournaments.name, cfg.name))
        .limit(1)

      if (!tournamentRow) {
        console.warn(`[fixture-meta-sync] Tournament "${cfg.name}" not found in DB — run "pnpm seed" first`)
        continue
      }

      let teamsUpserted = 0
      for (const team of teamEntities) {
        const id = Number.parseInt(team.id, 10)
        if (!Number.isFinite(id)) continue
        await db
          .insert(teams)
          .values({ id, name: team.name, shortName: team.shortName ?? null, logoUrl: team.logoUrl ?? null, groupLabel: null })
          .onConflictDoUpdate({
            target: teams.id,
            set: { name: team.name, shortName: team.shortName ?? null, logoUrl: team.logoUrl ?? null },
          })
        teamsUpserted++
      }

      let fixturesUpserted = 0
      for (const fx of enriched) {
        const fid   = Number.parseInt(fx.id, 10)
        const homeId = Number.parseInt(fx.homeTeam.id, 10)
        const awayId = Number.parseInt(fx.awayTeam.id, 10)
        if (![fid, homeId, awayId].every(Number.isFinite)) continue

        // Skip terminal fixtures — their metadata won't change
        const lid = fx.leagueId ? Number.parseInt(String(fx.leagueId), 10) : NaN
        const sid = fx.seasonId ? Number.parseInt(String(fx.seasonId), 10) : NaN

        await db
          .insert(fixtures)
          .values({
            id: fid,
            homeTeamId: homeId,
            awayTeamId: awayId,
            date: new Date(fx.kickoffAt),
            round: fx.phase ?? null,
            roundNumber: fx.roundNumber ?? null,
            groupLabel: fx.groupLabel ?? null,
            leagueId: Number.isFinite(lid) ? lid : null,
            seasonId: Number.isFinite(sid) ? sid : null,
            status: FixtureStatus.NotStarted,
            homeScore: null,
            awayScore: null,
            tournamentId: tournamentRow.id,
          })
          .onConflictDoUpdate({
            target: fixtures.id,
            set: {
              homeTeamId: homeId,
              awayTeamId: awayId,
              date: new Date(fx.kickoffAt),
              round: fx.phase ?? null,
              roundNumber: fx.roundNumber ?? null,
              groupLabel: fx.groupLabel ?? null,
            },
          })
        fixturesUpserted++
      }

      console.log(`[fixture-meta-sync] "${cfg.name}" — ${teamsUpserted} teams, ${fixturesUpserted} fixtures upserted`)
    } catch (err) {
      console.error(`[fixture-meta-sync] Error syncing "${cfg.name}":`, err instanceof Error ? err.message : err)
    }
  }
}
