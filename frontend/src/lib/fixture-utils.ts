import type { Fixture } from '@/api/fixtures'
import type { Prediction } from '@/api/predictions'

export type FixtureSortMode = 'recommended' | 'kickoff_asc' | 'kickoff_desc'

const STATUS_SORT_ORDER: Record<string, number> = {
  in_progress: 0,
  inprogress: 0,
  not_started: 1,
  ns: 1,
  postponed: 2,
  cancelled: 3,
  finished: 10,
  ft: 10,
}

export function formatFixturePhase(f: Fixture): string {
  let label = f.groupLabel?.trim() || f.round?.trim() || '—'
  const translations: Record<string, string> = {
    'Group Stage': 'Fase de grupos',
    'Round of 32': 'Dieciseisavos de final',
    'Round of 16': 'Octavos de final',
    Quarterfinals: 'Cuartos de final',
    'Quarter-finals': 'Cuartos de final',
    Semifinals: 'Semifinales',
    'Semi-finals': 'Semifinales',
    Final: 'Final',
    'Match for 3rd place': 'Partido por el tercer puesto',
    '3rd Place Final': 'Partido por el tercer puesto',
    'Third Place Play-off': 'Partido por el tercer puesto',
  }

  if (label.startsWith('Group ')) label = label.replace('Group ', 'Grupo ')
  return translations[label] ?? label
}

export function sortFixtures(fixtures: Fixture[], mode: FixtureSortMode): Fixture[] {
  const list = [...fixtures]
  if (mode === 'kickoff_asc') {
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  if (mode === 'kickoff_desc') {
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  return list.sort((a, b) => {
    const oa = STATUS_SORT_ORDER[a.status] ?? 9
    const ob = STATUS_SORT_ORDER[b.status] ?? 9
    if (oa !== ob) return oa - ob
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export type PredictionBadgeTone = 'none' | 'neutral' | 'exact' | 'partial' | 'miss'

function outcomeSign(home: number, away: number): -1 | 0 | 1 {
  if (home === away) return 0
  return home > away ? 1 : -1
}

export function getPredictionBadgeTone(
  fixture: Fixture,
  prediction?: Prediction
): PredictionBadgeTone {
  if (!prediction) return 'none'

  const homeRes = fixture.homeScore
  const awayRes = fixture.awayScore
  const isFinished = fixture.status === 'finished' || fixture.status === 'ft'
  const isLive = fixture.status === 'in_progress' || fixture.status === 'inprogress'

  if (!isFinished && !isLive) return 'neutral'

  if (homeRes === null || awayRes === null) return 'neutral'

  const { homeGoals, awayGoals } = prediction
  if (homeGoals === homeRes && awayGoals === awayRes) return 'exact'

  if (outcomeSign(homeRes, awayRes) === outcomeSign(homeGoals, awayGoals)) {
    return homeRes === awayRes ? 'partial' : 'partial'
  }
  return 'miss'
}

export function formatPredictionScore(prediction?: Prediction): string {
  if (!prediction) return '-'
  return `${prediction.homeGoals} - ${prediction.awayGoals}`
}

function getPhaseSortOrder(round: string): number {
  if (round.startsWith('Group ')) {
    const letter = round.slice(6).trim()
    if (letter.length === 1) return letter.charCodeAt(0) - 64
  }
  if (round === 'Group Stage') return 0
  const order: Record<string, number> = {
    'Round of 32': 75,
    'Round of 16': 100,
    'Quarter-finals': 200,
    Quarterfinals: 200,
    Semifinals: 300,
    'Semi-finals': 300,
    'Match for 3rd place': 400,
    '3rd Place Final': 400,
    'Third Place Play-off': 400,
    Final: 500,
  }
  return order[round] ?? 999
}

export function sortRoundsPhases(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => getPhaseSortOrder(a) - getPhaseSortOrder(b))
}

/**
 * Detecta si un nombre de equipo es un placeholder de bracket
 * (ej: "1C", "2F", "W74", "3A/3B/3C/3D") — no es un equipo real
 * hasta que el torneo avance y se definan los cruces.
 */
export function isBracketPlaceholder(name: string | null | undefined): boolean {
  if (!name) return false
  const n = name.trim()
  if (n.length < 2) return false
  if (/\d[A-Z]\/\d[A-Z]/i.test(n)) return true
  if (/^W\d+$/i.test(n)) return true
  if (/^L\d+$/i.test(n)) return true
  if (/^[12][A-L]$/i.test(n)) return true
  if (/^[A-L][12]$/i.test(n)) return true
  if (/^[A-L]\d$/i.test(n)) return true
  return false
}

export function fixtureHasBracketSlot(fixture: { homeTeam?: { name?: string | null } | null; awayTeam?: { name?: string | null } | null }): boolean {
  return isBracketPlaceholder(fixture.homeTeam?.name) || isBracketPlaceholder(fixture.awayTeam?.name)
}

export function formatRoundName(round: string): string {
  const translations: Record<string, string> = {
    'Group Stage': 'Fase de grupos',
    'Round of 32': 'Dieciseisavos de final',
    'Round of 16': 'Octavos de final',
    Quarterfinals: 'Cuartos de final',
    'Quarter-finals': 'Cuartos de final',
    Semifinals: 'Semifinales',
    'Semi-finals': 'Semifinales',
    Final: 'Final',
    'Match for 3rd place': 'Partido por el tercer puesto',
    '3rd Place Final': 'Partido por el tercer puesto',
    'Third Place Play-off': 'Partido por el tercer puesto',
  }
  const translated = translations[round]
  if (translated) return translated
  if (round.startsWith('Group ')) return round.replace('Group ', 'Grupo ')
  return round
}
