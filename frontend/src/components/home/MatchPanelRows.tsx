"use client"
import Link from 'next/link'
import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardPanelMatch, DashboardPanelTeam, DashboardRecentResult } from '@/api/dashboard'
import { getCountryName } from '@/lib/i18n/countries'

function formatKickoff(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return { label: 'Hoy', time: format(d, 'HH:mm') }
  if (isTomorrow(d)) return { label: 'Mañana', time: format(d, 'HH:mm') }
  return { label: format(d, 'd MMM', { locale: es }), time: format(d, 'HH:mm') }
}

function teamLabel(team: DashboardPanelTeam | null) {
  if (!team) return '—'
  return getCountryName(team.name)
}

function TeamLogo({ team }: { team: DashboardPanelTeam | null }) {
  if (!team?.logoUrl) {
    return (
      <span className="w-6 h-6 rounded-[3px] bg-white/[0.08] flex items-center justify-center text-[0.6rem] font-bold text-white/50 flex-shrink-0">
        {teamLabel(team).slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain rounded-[3px] flex-shrink-0" />
}

function TeamsRow({ match }: { match: DashboardPanelMatch }) {
  return (
    <div className="flex items-center gap-1.5 w-full min-w-0">
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 text-[0.8rem] font-semibold text-white">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{teamLabel(match.homeTeam)}</span>
        <TeamLogo team={match.homeTeam} />
      </div>
      <span className="text-[0.68rem] font-bold text-white/30 flex-shrink-0">VS</span>
      <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 text-[0.8rem] font-semibold text-white">
        <TeamLogo team={match.awayTeam} />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{teamLabel(match.awayTeam)}</span>
      </div>
    </div>
  )
}

export function UpcomingMatchRow({
  match,
  prediction,
}: {
  match: DashboardPanelMatch
  prediction?: { homeGoals: number; awayGoals: number } | null
}) {
  const kickoff = formatKickoff(match.date)
  const isLive = match.status === 'in_progress' || match.status === 'inprogress'

  return (
    <div className="flex items-center gap-2.5 p-2 px-2.5 bg-white/[0.02] rounded-lg border border-white/[0.05]">
      <div className="flex flex-col gap-0.5 flex-shrink-0 w-12">
        <span className="text-[0.67rem] font-bold text-white/50 uppercase">{kickoff.label}</span>
        <span className="text-[0.85rem] font-bold text-white">{kickoff.time}</span>
        {isLive ? (
          <span className="text-[0.62rem] font-bold text-primary uppercase">En vivo</span>
        ) : (
          <span className="text-[0.62rem] font-semibold text-white/40">Kickoff</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <TeamsRow match={match} />
      </div>
      {prediction != null && (
        <div className="flex-shrink-0 flex items-center justify-center min-w-[46px] h-[28px] px-1.5 rounded-md bg-primary/[0.1] border border-primary/[0.3] text-primary text-[0.75rem] font-extrabold font-display">
          {prediction.homeGoals}-{prediction.awayGoals}
        </div>
      )}
    </div>
  )
}


export function PendingMatchRow({ match }: { match: DashboardPanelMatch }) {
  const kickoff = formatKickoff(match.date)

  return (
    <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/[0.05]">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[0.62rem] font-semibold text-white/45 uppercase">
          {kickoff.label} · {kickoff.time}
        </span>
        <TeamsRow match={match} />
      </div>
      <Link
        href="/predictions"
        className="bg-primary text-black border-none rounded-md text-[0.7rem] font-bold px-3 py-1.5 min-h-[32px] flex items-center cursor-pointer transition-all duration-150 no-underline shrink-0 hover:opacity-90 active:scale-95"
      >
        Predecir
      </Link>
    </div>
  )
}

const toneClass: Record<DashboardRecentResult['prediction']['resultTone'], string> = {
  exact: 'border-l-[#00CE17] bg-[rgba(0,206,23,0.04)]',
  partial: 'border-l-[#FFCC00] bg-[rgba(255,204,0,0.04)]',
  miss: 'border-l-[#D50204] bg-[rgba(213,2,4,0.04)]',
}

export function RecentResultRow({ match }: { match: DashboardRecentResult }) {
  const kickoff = formatKickoff(match.date)
  const tone = match.prediction.resultTone

  return (
    <div className={`flex items-start gap-2 p-1.5 px-2 bg-white/[0.02] rounded-lg border border-white/[0.05] border-l-[3px] ${toneClass[tone]}`}>
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <span className="text-[0.67rem] font-bold text-white/50 uppercase">{kickoff.label}</span>
        <span className="text-[0.8rem] font-bold text-white">{kickoff.time}</span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <TeamsRow match={match} />
        <div className="grid grid-cols-2 gap-x-2 mt-0.5 items-center">
          <span className="text-[0.6rem] font-semibold text-white/40 uppercase whitespace-nowrap">Resultado</span>
          <span className="text-[0.78rem] font-bold text-white">{match.homeScore ?? 0} - {match.awayScore ?? 0}</span>
          <span className="text-[0.6rem] font-semibold text-white/40 uppercase whitespace-nowrap">Tu predicción</span>
          <span className="text-[0.78rem] font-bold text-white">{match.prediction.homeGoals} - {match.prediction.awayGoals}</span>
        </div>
      </div>
    </div>
  )
}
