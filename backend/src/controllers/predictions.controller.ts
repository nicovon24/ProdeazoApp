import type { Request, Response } from 'express'
import { z } from 'zod'
import { predictionsOpen } from '../constants/fixture-status'
import * as predictionModel from '../models/prediction.model'
import * as fixtureModel from '../models/fixture.model'
import { isLikelyBracketPlaceholder } from '../providers/participant-names'
import { paginate } from '../utils/paginate'
import { err } from '../utils/apiError'
import { resolveTournament } from '../utils/resolveTournament'

const predictionSchema = z.object({
  fixtureId: z.number().int().positive(),
  homeGoals: z.number().int().min(0).max(20),
  awayGoals: z.number().int().min(0).max(20),
})

export async function list(req: Request, res: Response) {
  const userId = (req.user as any).id
  const tournamentId = req.query.tournamentId as string | undefined

  if (tournamentId) {
    const tournament = await resolveTournament(tournamentId)
    if (!tournament) {
      return res.status(404).json(err('NOT_FOUND', 'Tournament not found'))
    }
    const userPredictions = await predictionModel.findPredictionsByUserIdAndTournament(userId, tournament.id)
    return res.json(paginate(userPredictions, req))
  }

  const userPredictions = await predictionModel.findPredictionsByUserId(userId)
  res.json(paginate(userPredictions, req))
}

export async function createOrUpdate(req: Request, res: Response) {
  const parsed = predictionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', 'Invalid request body'))
  }

  const userId = (req.user as any).id
  const { fixtureId, homeGoals, awayGoals } = parsed.data

  const [fixture] = await fixtureModel.findFixtureStatusById(fixtureId)

  if (!fixture) {
    return res.status(404).json(err('NOT_FOUND', 'Fixture not found'))
  }
  if (!predictionsOpen(fixture.status)) {
    return res.status(409).json(err('CONFLICT', 'Predictions are locked once the match has started'))
  }

  const [teamNames] = await fixtureModel.findFixtureTeamNames(fixtureId)
  if (teamNames && (isLikelyBracketPlaceholder(teamNames.homeName) || isLikelyBracketPlaceholder(teamNames.awayName))) {
    return res.status(409).json(err('CONFLICT', 'Teams not yet confirmed for this fixture'))
  }

  const [result] = await predictionModel.upsertPrediction(userId, fixtureId, homeGoals, awayGoals)
  res.status(201).json(result)
}
