import { db } from '../db/client'
import { fixtures, teams } from '../db/schema'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const homeTeam = alias(teams, 'home_team')
const awayTeam = alias(teams, 'away_team')

export function findFixturesWithTeams(tournamentId: string) {
  return db
    .select({
      id: fixtures.id,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      date: fixtures.date,
      round: fixtures.round,
      roundNumber: fixtures.roundNumber,
      groupLabel: fixtures.groupLabel,
      leagueId: fixtures.leagueId,
      seasonId: fixtures.seasonId,
      status: fixtures.status,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamShortName: homeTeam.shortName,
      awayTeamShortName: awayTeam.shortName,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamLogoUrl: awayTeam.logoUrl,
    })
    .from(fixtures)
    .leftJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(eq(fixtures.tournamentId, tournamentId))
}

export function findFixtureStatusById(fixtureId: number) {
  return db
    .select({ status: fixtures.status })
    .from(fixtures)
    .where(eq(fixtures.id, fixtureId))
    .limit(1)
}

export function findFixtureTeamNames(fixtureId: number) {
  return db
    .select({ homeName: homeTeam.name, awayName: awayTeam.name })
    .from(fixtures)
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(eq(fixtures.id, fixtureId))
    .limit(1)
}
