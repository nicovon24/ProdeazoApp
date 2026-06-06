import type { Request, Response } from 'express'
import * as dashboardModel from '../models/dashboard.model'
import * as dashboardPanelsService from '../services/dashboard-panels.service'

function parseTournamentId(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0].trim()
  return undefined
}

export async function me(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  const tournamentId = parseTournamentId(req.query.tournamentId)

  const [participantCount, leagueCount, stats, bestStreak] = await Promise.all([
    dashboardModel.countRegisteredUsers(),
    dashboardModel.countUserLeagues(userId),
    dashboardModel.getUserScoredPredictionStats(userId, tournamentId),
    dashboardModel.getUserBestStreak(userId, tournamentId),
  ])

  const globalRank =
    stats.scoredPredictions > 0
      ? await dashboardModel.getUserGlobalRank(userId)
      : 1

  res.json({
    participantCount,
    leagueCount,
    globalRank,
    rankChangeWeek: 0,
    totalPoints: stats.totalPoints,
    scoredPredictions: stats.scoredPredictions,
    correctPredictions: stats.correctPredictions,
    exactPredictions: stats.exactPredictions,
    partialPredictions: stats.partialPredictions,
    precision: stats.precision,
    bestStreak,
  })
}

export async function panels(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  const data = await dashboardPanelsService.getHomePanels(userId)
  res.json(data)
}
