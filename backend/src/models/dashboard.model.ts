import { db } from '../db/client'
import { users, predictions, miniLeagueMembers, fixtures } from '../db/schema'
import { eq, and, isNotNull, count, sum, sql } from 'drizzle-orm'
import * as leaderboardModel from './leaderboard.model'

export async function countRegisteredUsers(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(users)
  return Number(row?.value ?? 0)
}

export async function countUserLeagues(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(miniLeagueMembers)
    .where(eq(miniLeagueMembers.userId, userId))
  return Number(row?.value ?? 0)
}

export async function getUserScoredPredictionStats(userId: string, tournamentId?: string) {
  const conditions = [eq(predictions.userId, userId), isNotNull(predictions.points)]
  if (tournamentId) {
    conditions.push(eq(fixtures.tournamentId, tournamentId))
  }

  const [row] = await db
    .select({
      totalPoints: sum(predictions.points).mapWith(Number),
      scoredPredictions: count(),
      correctPredictions: sql<number>`count(*) filter (where ${predictions.points} > 0)`.mapWith(Number),
      exactPredictions: sql<number>`count(*) filter (where ${predictions.points} = 5)`.mapWith(Number),
      partialPredictions: sql<number>`count(*) filter (where ${predictions.points} > 0 and ${predictions.points} < 5)`.mapWith(Number),
    })
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .where(and(...conditions))

  const totalPoints = row?.totalPoints ?? 0
  const scoredPredictions = Number(row?.scoredPredictions ?? 0)
  const correctPredictions = Number(row?.correctPredictions ?? 0)
  const exactPredictions = Number(row?.exactPredictions ?? 0)
  const partialPredictions = Number(row?.partialPredictions ?? 0)
  const precision =
    scoredPredictions > 0 ? Math.round((correctPredictions / scoredPredictions) * 100) : 0

  return {
    totalPoints,
    scoredPredictions,
    correctPredictions,
    exactPredictions,
    partialPredictions,
    precision,
  }
}

export async function getUserBestStreak(userId: string, tournamentId?: string): Promise<number> {
  const conditions = [eq(predictions.userId, userId), isNotNull(predictions.points)]
  if (tournamentId) {
    conditions.push(eq(fixtures.tournamentId, tournamentId))
  }

  const rows = await db
    .select({ points: predictions.points, date: fixtures.date })
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .where(and(...conditions))
    .orderBy(fixtures.date)

  let best = 0
  let current = 0
  for (const row of rows) {
    if ((row.points ?? 0) > 0) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

/** 1-based global rank by total scored points (ties share the same rank). */
export async function getUserGlobalRank(userId: string): Promise<number> {
  const rows = await leaderboardModel.findLeaderboardAggregates()
  const sorted = rows
    .map((r) => ({ id: r.id, totalPoints: r.totalPoints ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  if (sorted.length === 0) return 1

  let rank = 1
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalPoints < sorted[i - 1].totalPoints) {
      rank = i + 1
    }
    if (sorted[i].id === userId) return rank
  }

  // User has no scored predictions yet — treat as last place + 1, minimum 1
  const userInBoard = sorted.some((r) => r.id === userId)
  if (!userInBoard) {
    return sorted.length + 1 >= 1 ? Math.max(1, sorted.length + 1) : 1
  }
  return 1
}
