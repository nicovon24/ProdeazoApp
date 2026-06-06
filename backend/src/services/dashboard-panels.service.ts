import * as panelsModel from '../models/dashboard-panels.model'
import { classifyPredictionTone } from './prediction-result'
import { FixtureStatus } from '../constants/fixture-status'

export type PanelTeam = {
  id: number
  name: string
  shortName: string | null
  logoUrl: string | null
}

export type PanelMatchBase = {
  fixtureId: number
  date: string
  status: string
  round: string | null
  groupLabel: string | null
  homeTeam: PanelTeam | null
  awayTeam: PanelTeam | null
  homeScore: number | null
  awayScore: number | null
}

export type RecentResultMatch = PanelMatchBase & {
  prediction: {
    homeGoals: number
    awayGoals: number
    points: number | null
    resultTone: 'exact' | 'partial' | 'miss'
  }
}

function toTeam(
  id: number | null,
  name: string | null,
  shortName: string | null,
  logoUrl: string | null
): PanelTeam | null {
  if (id == null || !name) return null
  return { id, name, shortName, logoUrl }
}

function mapBase(row: {
  fixtureId: number
  date: Date
  status: string | null
  round: string | null
  groupLabel: string | null
  homeScore: number | null
  awayScore: number | null
  homeTeamId: number | null
  awayTeamId: number | null
  homeTeamName: string | null
  awayTeamName: string | null
  homeTeamShortName: string | null
  awayTeamShortName: string | null
  homeTeamLogoUrl: string | null
  awayTeamLogoUrl: string | null
}): PanelMatchBase {
  return {
    fixtureId: row.fixtureId,
    date: row.date.toISOString(),
    status: row.status ?? FixtureStatus.NotStarted,
    round: row.round,
    groupLabel: row.groupLabel,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeTeam: toTeam(
      row.homeTeamId,
      row.homeTeamName,
      row.homeTeamShortName,
      row.homeTeamLogoUrl
    ),
    awayTeam: toTeam(
      row.awayTeamId,
      row.awayTeamName,
      row.awayTeamShortName,
      row.awayTeamLogoUrl
    ),
  }
}

export async function getHomePanels(userId: string) {
  const [recentRows, upcomingRows, pendingRows, pendingCount] = await Promise.all([
    panelsModel.findUserRecentFinishedPredictions(userId, 5),
    panelsModel.findUserUpcomingPredictedFixtures(userId, 10),
    panelsModel.findUserPendingFixtures(userId, 10),
    panelsModel.countUserPendingFixtures(userId),
  ])

  const recentResults: RecentResultMatch[] = recentRows.map((row) => ({
    ...mapBase(row),
    prediction: {
      homeGoals: row.homeGoals!,
      awayGoals: row.awayGoals!,
      points: row.points,
      resultTone: classifyPredictionTone(
        row.homeGoals!,
        row.awayGoals!,
        row.homeScore,
        row.awayScore,
        row.points
      ),
    },
  }))

  const upcomingWithPrediction = upcomingRows.map((row) => mapBase(row))
  const pendingPredictions = pendingRows.map((row) => mapBase(row))

  return {
    recentResults,
    upcomingWithPrediction,
    pendingPredictions,
    pendingPredictionsTotal: pendingCount,
  }
}
