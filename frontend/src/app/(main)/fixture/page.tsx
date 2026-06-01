"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Trophy,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Search,
  ArrowUp,
} from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { fetchFixtures, type Fixture } from '../../../api/fixtures';
import { fetchPredictions, type Prediction } from '../../../api/predictions';
import { useTournamentStore } from '../../../store/useTournamentStore';
import { TeamLogo } from '@/components/TeamLogo';
import { getTournamentIconUrl } from '@/lib/tournament-icons';
import {
  formatFixturePhase,
  formatPredictionScore,
  getPredictionBadgeTone,
  sortFixtures,
  sortRoundsPhases,
  formatRoundName,
  type FixtureSortMode,
} from '@/lib/fixture-utils';
import { FixtureRowSkeleton } from '@/components/skeletons/FixtureRowSkeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { getCountryName } from '@/lib/i18n/countries';

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'finished' | 'postponed' | 'cancelled';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  in_progress: 'En vivo',
  not_started: 'Por jugar',
  finished: 'Finalizados',
  postponed: 'Postergados',
  cancelled: 'Cancelados',
};

const STATUS_OPTIONS: StatusFilter[] = [
  'all',
  'in_progress',
  'not_started',
  'finished',
  'postponed',
  'cancelled',
];

const SORT_LABELS: Record<FixtureSortMode, string> = {
  recommended: 'Recomendado',
  kickoff_asc: 'Fecha (próximos primero)',
  kickoff_desc: 'Fecha (lejanos primero)',
};

const PRED_BADGE_CLASS: Record<ReturnType<typeof getPredictionBadgeTone>, string> = {
  none:    'bg-transparent border-white/20 text-white/60',
  neutral: 'bg-transparent border-white/20 text-white/60',
  exact:   'bg-[rgba(0,206,23,0.15)] border-[rgba(0,206,23,0.5)] text-[#00CE17]',
  partial: 'bg-[rgba(255,204,0,0.15)] border-[rgba(255,204,0,0.5)] text-[#FFCC00]',
  miss:    'bg-[rgba(213,2,4,0.15)] border-[rgba(213,2,4,0.5)] text-[#ff4d4d]',
};

const ROUNDS_PER_PAGE = 5;
const WORLD_CUP_START = new Date('2026-06-11T00:00:00-03:00').getTime();
const FIXTURE_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.16, ease: 'easeOut' },
} as const;

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getWorldCupCountdown() {
  const diff = Math.max(0, WORLD_CUP_START - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, started: diff === 0 };
}

function getTournamentDisplayName(name?: string | null): string {
  if (!name) return 'Torneo';
  if (/^(wc|fifa wc)\s*2026$/i.test(name.trim())) return 'World Cup 2026';
  return name;
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fixtureTimestamp(fixture: Fixture): number {
  if (!fixture.date) return Number.MAX_SAFE_INTEGER;
  const time = new Date(fixture.date).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function fixtureDateKey(date?: string | null): string {
  if (!date) return 'Sin fecha';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FIXTURE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) return 'Sin fecha';
  return `${year}-${month}-${day}`;
}

function formatFixtureTime(date?: string | null): string {
  if (!date) return '--:--';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: FIXTURE_TIME_ZONE,
  });
}

function formatDateLabel(dateStr: string): string {
  if (dateStr === 'Sin fecha') return dateStr;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return capitalizeFirst(new Date(year, month - 1, day, 12).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    }));
  } catch {
    return dateStr;
  }
}

function statusRankWithinDate(fixture: Fixture, mode: FixtureSortMode): number {
  if (mode !== 'recommended') return 0;
  if (fixture.status === 'in_progress' || fixture.status === 'inprogress') return 0;
  if (fixture.status === 'not_started' || fixture.status === 'ns') return 1;
  if (fixture.status === 'postponed' || fixture.status === 'cancelled') return 2;
  if (fixture.status === 'finished' || fixture.status === 'ft') return 3;
  return 2;
}

function sortFixturesWithinDate(fixtures: Fixture[], mode: FixtureSortMode): Fixture[] {
  return [...fixtures].sort((a, b) => {
    const statusDiff = statusRankWithinDate(a, mode) - statusRankWithinDate(b, mode);
    if (statusDiff !== 0) return statusDiff;
    return fixtureTimestamp(a) - fixtureTimestamp(b);
  });
}

export default function FixturePage() {
  const { tournaments, activeTournamentId, setActiveTournament } = useTournamentStore();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<FixtureSortMode>('recommended');
  const [roundPage, setRoundPage] = useState(0);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackTop, setShowBackTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState(getWorldCupCountdown);
  const tournamentRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tournamentRef.current && !tournamentRef.current.contains(e.target as Node)) setTournamentOpen(false);
      if (roundRef.current && !roundRef.current.contains(e.target as Node)) setRoundOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowBackTop(window.scrollY > 260);
    }

    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleScroll();
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(getWorldCupCountdown()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeTournamentId) return;
    setSelectedRound(null);
    setStatusFilter('all');
    setSearchQuery('');
    setRoundPage(0);
    setLoading(true);

    Promise.all([
      fetchFixtures(activeTournamentId),
      fetchPredictions(activeTournamentId),
    ])
      .then(([fixtureData, predData]) => {
        setFixtures(Array.isArray(fixtureData) ? fixtureData : []);
        setPredictions(Array.isArray(predData) ? predData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTournamentId]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const tournamentIcon = getTournamentIconUrl(activeTournament?.leagueId);

  const predByFixture = useMemo(() => {
    const map = new Map<number, Prediction>();
    predictions.forEach(p => map.set(p.fixtureId, p));
    return map;
  }, [predictions]);

  const rounds = sortRoundsPhases(Array.from(new Set(fixtures.map(f => f.round).filter(Boolean))) as string[]);
  const totalRoundPages = Math.ceil(rounds.length / ROUNDS_PER_PAGE);
  const visibleRounds = rounds.slice(roundPage * ROUNDS_PER_PAGE, (roundPage + 1) * ROUNDS_PER_PAGE);

  const renderScoreStatus = (f: Fixture) => {
    if (f.status === 'in_progress' || f.status === 'inprogress') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            EN VIVO
          </span>
        </div>
      );
    }
    if (f.status === 'finished' || f.status === 'ft') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">{f.homeScore ?? 0} - {f.awayScore ?? 0}</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">FINALIZADO</span>
        </div>
      );
    }
    if (f.status === 'postponed') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">POSTERGADO</span>
        </div>
      );
    }
    if (f.status === 'cancelled') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
          <span className="text-[0.6rem] font-bold uppercase text-white/40">CANCELADO</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <span className="font-display text-[1.25rem] font-extrabold text-white">-</span>
        <span className="text-[0.6rem] font-bold uppercase text-white/40">POR JUGAR</span>
      </div>
    );
  };

  const filteredBySelects = fixtures.filter(f => {
    if (selectedRound && f.round !== selectedRound) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_progress') {
      return f.status === 'in_progress' || f.status === 'inprogress';
    }
    if (statusFilter === 'not_started') {
      return f.status === 'not_started' || f.status === 'ns';
    }
    if (statusFilter === 'finished') {
      return f.status === 'finished' || f.status === 'ft';
    }
    return f.status === statusFilter;
  });

  const normalizedSearchQuery = normalizeSearch(searchQuery);
  const filtered = filteredBySelects.filter(f => {
    if (!normalizedSearchQuery) return true;

    const dateLabel = f.date ? formatDateLabel(fixtureDateKey(f.date)) : '';
    const timeLabel = formatFixtureTime(f.date);
    const statusLabel =
      f.status === 'in_progress' || f.status === 'inprogress'
        ? STATUS_LABELS.in_progress
        : f.status === 'not_started' || f.status === 'ns'
          ? STATUS_LABELS.not_started
          : f.status === 'finished' || f.status === 'ft'
            ? STATUS_LABELS.finished
            : STATUS_LABELS[f.status as StatusFilter] ?? f.status;

    const searchable = [
      getCountryName(f.homeTeam?.name),
      getCountryName(f.awayTeam?.name),
      f.homeTeam?.name,
      f.awayTeam?.name,
      formatFixturePhase(f),
      f.groupLabel,
      f.round,
      statusLabel,
      dateLabel,
      timeLabel,
    ]
      .filter(Boolean)
      .join(' ');

    return normalizeSearch(searchable).includes(normalizedSearchQuery);
  });

  const sorted = sortFixtures(filtered, sortMode);

  const grouped = sorted.reduce<Record<string, Fixture[]>>((acc, f) => {
    const dateKey = fixtureDateKey(f.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(f);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    grouped[key] = sortFixturesWithinDate(grouped[key], sortMode);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Header
        title="Fixture"
        subtitle="Todos los partidos de tus torneos favoritos."
      />
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6 flex flex-col gap-4">
        <section className="hidden md:flex relative overflow-hidden rounded-xl border border-white/[0.1] bg-[#07140f] px-6 py-5 min-h-[150px] items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(175,232,5,0.18),transparent_28%),linear-gradient(120deg,rgba(0,26,172,0.32),transparent_42%),linear-gradient(90deg,rgba(3,63,45,0.92),rgba(10,10,10,0.96))]" />
          <img src="/logo-mundial-2026.svg" alt="" className="absolute right-[34%] bottom-[-34px] h-[185px] w-[185px] opacity-[0.12]" />

          <div className="relative z-[1] flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/35 bg-primary/[0.08] px-3 py-1 text-[0.68rem] font-black uppercase text-primary">
              <Trophy className="h-3.5 w-3.5" />
              Fixture oficial
            </span>
            <div>
              <h2 className="font-display text-[2.35rem] font-black leading-none text-white">FIFA WORLD CUP</h2>
              <p className="mt-1 max-w-[430px] text-[0.88rem] font-semibold text-white/64">
                {countdown.started
                  ? 'Disfrutá del Mundial en Prodeazo.'
                  : 'Seguí cada partido, revisá fechas y prepará tus predicciones.'}
              </p>
            </div>
          </div>

          <div className="relative z-[1]">
            {countdown.started ? (
              <div className="flex items-center justify-center min-w-[200px] rounded-lg border border-white/[0.11] bg-black/35 px-5 py-4 backdrop-blur-sm">
                <span className="font-display text-[1.1rem] font-bold text-white/90 text-center leading-snug">
                  ¡El Mundial ya comenzó!<br />Disfrutalo en Prodeazo
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['Días', countdown.days],
                  ['Horas', countdown.hours],
                  ['Min', countdown.minutes],
                  ['Seg', countdown.seconds],
                ] as const).map(([label, value]) => (
                  <div key={label} className="min-w-[74px] rounded-lg border border-white/[0.11] bg-black/35 px-3 py-2.5 text-center backdrop-blur-sm">
                    <span className="font-display text-[1.85rem] font-black leading-none text-primary">
                      {String(value).padStart(label === 'Días' ? 1 : 2, '0')}
                    </span>
                    <span className="mt-1 block text-[0.62rem] font-black uppercase text-white/46">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/[0.1] md:gap-3">
          {tournaments.length > 0 && (
            <div className="relative flex-shrink-0 max-md:w-full" ref={tournamentRef}>
              <button type="button" className="flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-[0.85rem] font-medium cursor-pointer" onClick={() => setTournamentOpen(v => !v)}>
                {tournamentIcon ? (
                  <img src={tournamentIcon} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <Trophy className="w-4 h-4 text-white/50" />
                )}
                <span className="flex-1 text-left">{getTournamentDisplayName(activeTournament?.shortName ?? activeTournament?.name)}</span>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>
              <AnimatePresence>
              {tournamentOpen && (
                <motion.div {...DROPDOWN_MOTION} className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                  {tournaments.map(t => {
                    const icon = getTournamentIconUrl(t.leagueId);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${t.id === activeTournamentId ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                        onClick={() => { setActiveTournament(t.id); setTournamentOpen(false); }}
                      >
                        {icon ? (
                          <img src={icon} alt="" className="w-[18px] h-[18px] object-contain flex-shrink-0" />
                        ) : (
                          <Trophy className="w-[18px] h-[18px] text-primary flex-shrink-0" />
                        )}
                        {getTournamentDisplayName(t.name)}
                      </button>
                    );
                  })}
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          )}

          <div className="relative flex-shrink-0 max-md:w-full" ref={sortRef}>
            <button type="button" className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.05] border rounded-lg text-white text-[0.85rem] font-medium cursor-pointer transition-colors duration-150 ${sortMode !== 'recommended' ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/[0.1]'}`} onClick={() => setSortOpen(v => !v)}>
              <ArrowUpDown className="w-4 h-4 text-white/50" />
              <span className="flex-1 text-left">{SORT_LABELS[sortMode]}</span>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            <AnimatePresence>
            {sortOpen && (
              <motion.div {...DROPDOWN_MOTION} className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                {(Object.keys(SORT_LABELS) as FixtureSortMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${mode === sortMode ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                    onClick={() => { setSortMode(mode); setSortOpen(false); }}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="relative flex-shrink-0 max-md:w-full" ref={roundRef}>
            <button type="button" className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.05] border rounded-lg text-white text-[0.85rem] font-medium cursor-pointer transition-colors duration-150 ${selectedRound ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/[0.1]'}`} onClick={() => setRoundOpen(v => !v)}>
              <Trophy className="w-4 h-4 text-white/50" />
              <span className="flex-1 text-left">{selectedRound ? formatRoundName(selectedRound) : 'Todas las fases'}</span>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            <AnimatePresence>
            {roundOpen && (
              <motion.div {...DROPDOWN_MOTION} className="absolute top-[calc(100%+6px)] left-0 min-w-[200px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${!selectedRound ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                  onClick={() => { setSelectedRound(null); setRoundOpen(false); setRoundPage(0); }}
                >
                  Todas las fases
                </button>
                {visibleRounds.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${r === selectedRound ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                    onClick={() => { setSelectedRound(r); setRoundOpen(false); }}
                  >
                    {formatRoundName(r)}
                  </button>
                ))}
                {totalRoundPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-1 py-1.5 border-t border-white/[0.08] mt-1 text-[0.78rem] text-white/50">
                    <button type="button" className="bg-transparent border-none text-white/60 cursor-pointer p-0.5 flex items-center rounded hover:text-white disabled:opacity-25 disabled:cursor-default" disabled={roundPage === 0} onClick={() => setRoundPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4 text-white/50" />
                    </button>
                    <span>{roundPage + 1} / {totalRoundPages}</span>
                    <button type="button" className="bg-transparent border-none text-white/60 cursor-pointer p-0.5 flex items-center rounded hover:text-white disabled:opacity-25 disabled:cursor-default" disabled={roundPage >= totalRoundPages - 1} onClick={() => setRoundPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="relative flex-shrink-0 max-md:w-full" ref={statusRef}>
            <button type="button" className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.05] border rounded-lg text-white text-[0.85rem] font-medium cursor-pointer transition-colors duration-150 ${statusFilter !== 'all' ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/[0.1]'}`} onClick={() => setStatusOpen(v => !v)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" className="text-white/50"><path d="M440-200q-100 0-170-70t-70-170q0-11 1-22t3-22q-5 2-12 3t-12 1q-42 0-71-29t-29-71q0-42 27.5-71t69.5-29q33 0 59.5 18.5T274-614q33-30 75.5-48t90.5-18h440v160H680v80q0 100-70 170t-170 70ZM208.5-551.5Q220-563 220-580t-11.5-28.5Q197-620 180-620t-28.5 11.5Q140-597 140-580t11.5 28.5Q163-540 180-540t28.5-11.5ZM539-341q41-41 41-99t-41-99q-41-41-99-41t-99 41q-41 41-41 99t41 99q41 41 99 41t99-41Zm-42.5-42.5Q520-407 520-440t-23.5-56.5Q473-520 440-520t-56.5 23.5Q360-473 360-440t23.5 56.5Q407-360 440-360t56.5-23.5ZM440-440Z"/></svg>
              <span className="flex-1 text-left">{STATUS_LABELS[statusFilter]}</span>
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            <AnimatePresence>
            {statusOpen && (
              <motion.div {...DROPDOWN_MOTION} className="absolute top-[calc(100%+6px)] left-0 min-w-[180px] bg-[#141414] border border-white/[0.12] rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col gap-0.5">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-[9px] border-none rounded-lg bg-transparent text-[0.85rem] font-medium cursor-pointer transition-all duration-150 ${s === statusFilter ? 'bg-primary/[0.12] text-primary' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'}`}
                    onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-white transition-colors duration-200 focus-within:border-primary/40 focus-within:bg-white/[0.06]">
          <Search className="w-4 h-4 shrink-0 text-white/45" />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder={isMobile ? 'Buscar partidos, equipos...' : 'Buscar partidos, equipos, fases... (Por ejemplo "Argentina", "Semifinales")'}
            className="min-w-0 flex-1 bg-transparent text-[0.9rem] font-semibold text-white outline-none placeholder:text-white/35"
            type="search"
          />
        </label>

        <div className="overflow-x-hidden">
          <div className="hidden sm:grid [grid-template-columns:100px_minmax(0,1fr)_92px_92px] gap-4 px-4 py-2 mb-2 text-[0.7rem] font-black text-white/40 uppercase">
            <div>FECHA</div>
            <div className="text-center">PARTIDO</div>
            <div className="text-center">MARCADOR</div>
            <div className="text-center">TU PREDICCIÓN</div>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FixtureRowSkeleton key={i} />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="py-8 text-center text-white/50">No hay partidos disponibles.</div>
          ) : sorted.length === 0 ? (
            <div className="py-8 text-center text-white/50">No hay partidos con estos filtros.</div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {Object.entries(grouped).map(([dateKey, dayFixtures]) => (
              <div key={dateKey} className="mb-6">
                <div className="flex items-center gap-2 px-4 py-3 text-[0.95rem] font-bold text-white border-b border-white/[0.1] mb-2">
                  <Calendar className="w-[18px] h-[18px] text-white/40" />
                  {formatDateLabel(dateKey)}
                </div>

                {dayFixtures.map(f => {
                  const pred = predByFixture.get(f.id);
                  const tone = getPredictionBadgeTone(f, pred);
                  return (
                    <motion.div key={f.id} variants={fadeInUp} className="flex flex-col gap-3 p-3 bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-lg mb-1 border border-white/[0.06] transition-all duration-200 hover:bg-white/[0.05] hover:border-white/[0.12] sm:grid sm:[grid-template-columns:100px_minmax(0,1fr)_92px_92px] sm:gap-4 sm:p-4">
                      <div className="flex flex-col gap-1 max-md:items-center max-md:text-center">
                        <span className="text-[1.05rem] font-bold text-white">
                          {formatFixtureTime(f.date)}
                        </span>
                        <span className="text-[0.7rem] text-white/60 leading-[1.3] font-bold">{formatFixturePhase(f)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 sm:gap-4">
                        <div className="flex-1 flex items-center justify-end gap-3 text-[0.95rem] font-semibold text-white min-w-0">
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 max-md:whitespace-normal max-md:text-center max-md:leading-tight max-md:break-words">
                            {getCountryName(f.homeTeam?.name)}
                          </span>
                          <TeamLogo name={f.homeTeam?.name} logoUrl={f.homeTeam?.logoUrl} />
                        </div>
                        <span className="text-[0.8rem] font-bold text-white/30 flex-shrink-0">VS</span>
                        <div className="flex-1 flex items-center justify-start gap-3 text-[0.95rem] font-semibold text-white min-w-0">
                          <TeamLogo name={f.awayTeam?.name} logoUrl={f.awayTeam?.logoUrl} />
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 max-md:whitespace-normal max-md:text-center max-md:leading-tight max-md:break-words">
                            {getCountryName(f.awayTeam?.name)}
                          </span>
                        </div>
                      </div>
                      {renderScoreStatus(f)}
                      <div className="flex justify-center items-center">
                        <div className={`px-4 py-2 rounded-lg font-display text-[1rem] font-bold flex items-center justify-center min-w-[64px] border ${PRED_BADGE_CLASS[tone]}`}>
                          {formatPredictionScore(pred)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showBackTop && (
            <motion.button
              type="button"
              aria-label="Volver arriba"
              onClick={scrollToTop}
              className="fixed right-5 bottom-6 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-black shadow-[0_14px_40px_rgba(0,0,0,0.45)] cursor-pointer transition-all duration-200 hover:brightness-75 active:scale-90"
              initial={{ opacity: 0, y: -8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

      </main>
    </>
  );
}
