import { getBzzoiroImageUrl } from './images'
import { ProviderHttpClient } from './http'
import { bzzoiroAuthorizationValue } from './bzzoiro-token'
import { asNumber, asObject, asString, dedupeTeams, normalizeStatus } from './normalize'
import type {
  DataProvider,
  FixtureQuery,
  ProviderFixture,
  ProviderLeague,
  ProviderSeason,
  ProviderTeam,
} from './types'
import { applyFlatParticipantLabel, preferCountryOverBracketPlaceholder } from './participant-names'
import { translateCountryName } from './i18n/countries'

type BzzoiroProviderOptions = {
  apiKey: string
  baseUrl: string
  timezone: string
}

export function createBzzoiroProvider(options: BzzoiroProviderOptions): DataProvider {
  const client = new ProviderHttpClient({
    baseUrl: options.baseUrl,
    headers: {
      Authorization: bzzoiroAuthorizationValue(options.apiKey),
      Accept: 'application/json',
    },
  })

  return {
    name: 'bzzoiro',
    async listLeagues() {
      const rows = await client.getAllPages(
        '/v2/leagues/',
        { limit: 200 },
        { usePageQuery: false, maxPages: 25 }
      )
      return rows.map(normalizeLeague).filter(Boolean) as ProviderLeague[]
    },
    async listSeasons(params) {
      const leagueId = params?.leagueId?.trim()

      if (params?.current && leagueId) {
        const row = await client.get<unknown>(`/v2/leagues/${leagueId}/season/`)
        if (!row || typeof row !== 'object') return []
        const s = normalizeSeasonWithLeague(row, leagueId)
        return s ? [s] : []
      }

      if (leagueId) {
        const rowsRaw = await client.get<unknown>(`/v2/leagues/${leagueId}/seasons/`)
        return coerceToArray(rowsRaw)
          .map((r) => normalizeSeasonWithLeague(r, leagueId))
          .filter(Boolean) as ProviderSeason[]
      }

      if (params?.current) {
        const leagues = await client.getAllPages('/v2/leagues/', { limit: 200 }, { usePageQuery: false, maxPages: 25 })
        const out: ProviderSeason[] = []
        for (const L of leagues) {
          const lid = asString(asObject(L).id)
          if (!lid) continue
          const row = await client.get<unknown>(`/v2/leagues/${lid}/season/`)
          if (!row || typeof row !== 'object') continue
          const s = normalizeSeasonWithLeague(row, lid)
          if (s?.current) out.push(s)
        }
        return out
      }

      const leagues = await client.getAllPages('/v2/leagues/', { limit: 200 }, { usePageQuery: false, maxPages: 25 })
      const out: ProviderSeason[] = []
      for (const L of leagues) {
        const lid = asString(asObject(L).id)
        if (!lid) continue
        const rowsRaw = await client.get<unknown>(`/v2/leagues/${lid}/seasons/`)
        for (const r of coerceToArray(rowsRaw)) {
          const s = normalizeSeasonWithLeague(r, lid)
          if (s) out.push(s)
        }
      }
      return out
    },
    async listTeams(params) {
      const q: Record<string, string | number | boolean | undefined> = {
        limit: Math.min(Number(params?.v2Limit) || 200, 200),
      }
      if (params?.leagueId) {
        // v2 OpenAPI: /teams/ uses `league_id`; `in_competition` requires it (mini_league_id → 400).
        q.league_id = Number(params.leagueId)
        if (params.inCompetition === true) q.in_competition = true
      }
      if (params?.country?.trim()) {
        const c = params.country.trim()
        if (/^[A-Za-z]{2}$/.test(c)) q.country_code = c.toUpperCase()
        else q.name = c
      }
      const rows = await client.getAllPages('/v2/teams/', q, { usePageQuery: false, maxPages: 50 })
      return rows.map(normalizeTeam).filter(Boolean) as ProviderTeam[]
    },
    async listFixtures(params: FixtureQuery) {
      const q: Record<string, string | number | boolean | undefined> = { limit: 200 }
      if (params.dateFrom) q.date_from = params.dateFrom
      if (params.dateTo) q.date_to = params.dateTo
      if (params.seasonId) q.season_id = Number(params.seasonId)
      if (params.teamId) q.team_id = Number(params.teamId)
      if (params.leagueId) q.league_id = Number(params.leagueId)
      const maxPages = Math.min(Math.max(Number(process.env.BZZOIRO_EVENTS_MAX_PAGES) || 100, 1), 500)
      const rows = await client.getAllPages('/v2/events/', q, { usePageQuery: false, maxPages })
      const fixtures = rows.map(normalizeFixture).filter(Boolean) as ProviderFixture[]
      if (rows.length > 0 && fixtures.length === 0) {
        console.warn('[bzzoiro] /v2/events/ returned rows but none passed normalizeFixture')
      }
      return fixtures
    },
  }
}

function coerceToArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && Array.isArray((raw as { results?: unknown }).results)) {
    return (raw as { results: unknown[] }).results
  }
  return []
}

function normalizeSeasonWithLeague(value: unknown, leagueId: string): ProviderSeason | null {
  const row = asObject(value)
  const id = asString(row.id)
  const name = asString(row.name)
  if (!id || !name) return null
  return {
    id,
    name,
    leagueId,
    startsAt: asString(row.start_date ?? row.starts_at),
    endsAt: asString(row.end_date ?? row.ends_at),
    current: row.is_current === true || row.current === true,
    raw: value,
  }
}

function normalizeLeague(value: unknown): ProviderLeague | null {
  const row = asObject(value)
  const id = asString(row.id)
  const name = asString(row.name)
  if (!id || !name) return null
  const currentSeason = asObject(row.current_season)
  return {
    id,
    name,
    country: translateCountryName(asString(row.country)),
    logoUrl: getBzzoiroImageUrl('league', id),
    currentSeasonId: asString(currentSeason.id),
    raw: value,
  }
}

function normalizeTeam(value: unknown): ProviderTeam | null {
  const row = asObject(value)
  const id = asString(row.id)
  const name = asString(row.name ?? row.official_name ?? row.display_name ?? row.long_name)
  if (!id || !name) return null
  return {
    id,
    name,
    shortName: asString(row.short_name ?? row.shortName ?? row.code),
    country: translateCountryName(asString(row.country ?? row.country_name ?? row.nation ?? row.nationality)),
    logoUrl: asString(row.logo) ?? getBzzoiroImageUrl('team', id),
    raw: value,
  }
}

function normalizeEventSideParticipant(
  row: Record<string, unknown>,
  side: 'home' | 'away'
): ProviderTeam | null {
  const nested =
    side === 'home'
      ? (row.home_team_obj ?? row.home ?? row.localteam)
      : (row.away_team_obj ?? row.away ?? row.visitorteam)
  let team = normalizeTeam(nested)
  const flatKey = side === 'home' ? 'home_team' : 'away_team'
  const idKey = side === 'home' ? 'home_team_id' : 'away_team_id'
  if (!team && typeof row[flatKey] === 'string') {
    const id = asString(row[idKey])
    const label = String(row[flatKey]).trim()
    if (id && label) {
      team = {
        id,
        name: label,
        shortName: null,
        country: null,
        logoUrl: getBzzoiroImageUrl('team', id),
        raw: { label, source: flatKey },
      }
    }
  }
  if (!team) return null
  let resolved = applyFlatParticipantLabel(team, row[flatKey])
  const obj =
    side === 'home'
      ? asObject(row.home_team_obj)
      : asObject(row.away_team_obj)
  const countryFromObj = asString(
    obj.country ?? obj.country_name ?? obj.nation ?? obj.nationality
  )
  if (countryFromObj?.trim() && !resolved.country?.trim()) {
    resolved = { ...resolved, country: translateCountryName(countryFromObj.trim()) }
  }
  return preferCountryOverBracketPlaceholder(resolved)
}

function normalizeFixture(value: unknown): ProviderFixture | null {
  const row = asObject(value)
  const id = asString(row.id)
  const kickoffAt = asString(
    row.event_date ?? row.start_at ?? row.kickoff_at ?? row.date ?? row.datetime
  )
  const homeTeam = normalizeEventSideParticipant(row, 'home')
  const awayTeam = normalizeEventSideParticipant(row, 'away')
  if (!id || !kickoffAt || !homeTeam || !awayTeam) return null

  const leagueObj = asObject(row.league)
  const seasonObj = asObject(row.season)
  const scores = asObject(row.scores ?? row.score)
  const roundName = asString(row.round_name)?.trim()
  const groupName = asString(row.group_name)?.trim()
  const rn = asNumber(row.round_number)
  const phase =
    roundName ||
    groupName ||
    asString(row.round ?? row.stage ?? row.phase)?.trim() ||
    (rn !== null ? String(rn) : null)

  return {
    id,
    leagueId:
      asString(row.league_id) ??
      asString(row.mini_league_id) ??
      asString(leagueObj.id) ??
      asString(asObject(row.league_obj).id),
    seasonId:
      asString(row.season_id) ??
      asString(seasonObj.id) ??
      asString(asObject(row.season_obj).id),
    phase,
    groupLabel: groupName || null,
    roundNumber: rn,
    kickoffAt,
    status: normalizeStatus(row.status ?? row.status_type),
    homeTeam,
    awayTeam,
    homeScore: asNumber(row.home_score ?? scores.home ?? scores.home_score),
    awayScore: asNumber(row.away_score ?? scores.away ?? scores.away_score),
    raw: value,
  }
}

export function extractTeamsFromFixtures(fixtures: ProviderFixture[]) {
  return dedupeTeams(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))
}
