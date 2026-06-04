"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Users,
  BarChart2,
  CalendarDays,
  CheckCircle,
  Hourglass,
  ArrowRight,
  History,
  Target,
  Trophy,
  Crown,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Header } from "../../../components/layout/Header";
import {
  fetchDashboardMe,
  fetchDashboardPanels,
  type DashboardMe,
  type DashboardPanels,
} from "../../../api/dashboard";
import { fetchPredictions } from "../../../api/predictions";
import {
  getMyLeagues,
  getLeagueDetail,
  getLeagueLeaderboard,
} from "../../../api/mini-leagues";
import {
  PendingMatchRow,
  RecentResultRow,
  UpcomingMatchRow,
} from "@/components/home/MatchPanelRows";
import { StatsCardSkeleton } from "@/components/skeletons/StatsCardSkeleton";
import { MatchPanelSkeleton } from "@/components/skeletons/MatchPanelSkeleton";
import { motion } from "framer-motion";
import { staggerContainer, scaleIn } from "@/lib/animations";

interface LeaguePreview {
  id: string
  name: string
  ownerName: string
  role: 'owner' | 'member'
  rank: number
  totalMembers: number
  totalPoints: number
}

function formatCount(n: number): string {
  return n.toLocaleString("es-AR");
}

function getPanelMatchLimit(width: number, height: number): number {
  if (width < 768) {
    if (height < 760) return 2;
    return 3;
  }

  if (width < 1024) {
    if (height < 760) return 3;
    if (height < 900) return 4;
    if (height < 1060) return 5;
    return 6;
  }

  if (height < 720) return 3;
  if (height < 820) return 4;
  if (height < 940) return 5;
  if (height < 1060) return 6;
  if (height < 1200) return 8;
  return 10;
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardMe | null>(null);
  const [panels, setPanels] = useState<DashboardPanels | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(true);
  const [leaguePreview, setLeaguePreview] = useState<LeaguePreview | null>(null);
  const [leaguePreviewLoading, setLeaguePreviewLoading] = useState(false);
  const [panelMatchLimit, setPanelMatchLimit] = useState(4);

  useEffect(() => {
    function updatePanelMatchLimit() {
      setPanelMatchLimit(getPanelMatchLimit(window.innerWidth, window.innerHeight));
    }

    updatePanelMatchLimit();
    window.addEventListener("resize", updatePanelMatchLimit);
    return () => window.removeEventListener("resize", updatePanelMatchLimit);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    setLoadingPanels(true);

    Promise.all([
      fetchDashboardMe(),
      fetchDashboardPanels(),
      fetchPredictions().catch(() => []),
    ])
      .then(async ([stats, panelData, predictions]) => {
        if (cancelled) return;

        const predictionsByFixture = new Map(
          predictions.map((prediction) => [prediction.fixtureId, prediction])
        );
        const mergedPanelData: DashboardPanels = {
          ...panelData,
          upcomingWithPrediction: panelData.upcomingWithPrediction.map((match) => {
            const prediction = predictionsByFixture.get(match.fixtureId);
            return {
              ...match,
              prediction: match.prediction ?? (prediction
                ? {
                    homeGoals: prediction.homeGoals,
                    awayGoals: prediction.awayGoals,
                  }
                : null),
            };
          }),
        };

        setDashboard(stats);
        setPanels(mergedPanelData);

        // Fetch league preview if user has leagues
        if (stats.leagueCount > 0 && !cancelled) {
          setLeaguePreviewLoading(true);
          try {
            const myLeaguesRes = await getMyLeagues();
            if (!cancelled && myLeaguesRes.results.length > 0) {
              const first = myLeaguesRes.results[0];
              const [detail, lb] = await Promise.all([
                getLeagueDetail(first.league.id).catch(() => null),
                getLeagueLeaderboard(first.league.id).catch(() => null),
              ]);
              if (!cancelled) {
                const ownerName = detail?.members.find(m => m.role === 'owner')?.name ?? '';
                const userEntry = lb?.results.find(e => e.id === user?.id);
                setLeaguePreview({
                  id: first.league.id,
                  name: first.league.name,
                  ownerName,
                  role: first.role,
                  rank: userEntry?.rank ?? 0,
                  totalMembers: lb?.count ?? 0,
                  totalPoints: userEntry?.totalPoints ?? 0,
                });
              }
            }
          } catch {
            // silently fail, just show empty state
          } finally {
            if (!cancelled) setLeaguePreviewLoading(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboard(null);
          setPanels(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStats(false);
          setLoadingPanels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const participantCount = dashboard?.participantCount ?? 0;
  const globalRank = dashboard?.globalRank ?? null;
  const totalPoints = dashboard?.totalPoints ?? 0;
  const recentResults = panels?.recentResults.slice(0, panelMatchLimit) ?? [];
  const upcomingWithPrediction = panels?.upcomingWithPrediction.slice(0, panelMatchLimit) ?? [];
  const pendingPredictions = panels?.pendingPredictions.slice(0, panelMatchLimit) ?? [];

  return (
    <>
      <Header
        title="Inicio"
        subtitle={`Bienvenido de vuelta, ${user?.name ?? "Usuario"}. Este es tu resumen.`}
      />
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6 flex flex-col gap-4">
        {/* Top Stat Cards */}
        {loadingStats ? (
          <StatsCardSkeleton />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Global Pos */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <Globe className="w-4 h-4 text-primary" />
                Mi posición global
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-display text-[1.7rem] font-extrabold text-white leading-none mb-0.5">
                    {globalRank !== null ? `${globalRank}°` : "—"}
                  </div>
                  <div className="text-[0.7rem] text-white/50">
                    {globalRank !== null ? `de ${formatCount(participantCount)} participantes` : "Datos no disponibles"}
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/rankings"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-300 no-underline hover:bg-white/[0.08]"
                >
                  Ver rankings
                </Link>
              </div>
            </motion.div>

            {/* Leagues Pos */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <Users className="w-4 h-4 text-primary" />
                Mi posición en ligas
              </div>
              <div className="flex justify-between items-start">
                {leaguePreviewLoading ? (
                  <div className="flex items-center gap-3 w-full py-2">
                    <div className="w-[42px] h-[42px] bg-white/10 rounded-lg animate-pulse shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-3.5 w-32 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                ) : leaguePreview ? (
                  <Link
                    href={`/leagues/${leaguePreview.id}`}
                    className="flex items-center gap-3 no-underline w-full group"
                  >
                    <div className="w-[42px] h-[42px] bg-white/[0.05] rounded-lg flex items-center justify-center text-primary shrink-0"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.95rem] font-bold text-white truncate group-hover:text-primary transition-colors duration-200">{leaguePreview.name}</span>
                        {leaguePreview.role === 'owner' && <Trophy className="text-[#FFCC00] w-3.5 h-3.5 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[0.72rem] text-white/50">
                        <Crown className="w-3 h-3 text-[#FFCC00]" />
                        <span>{leaguePreview.ownerName}</span>
                        <span className="text-white/20">·</span>
                        <span className="font-bold text-primary">#{leaguePreview.rank}</span>
                        <span className="text-white/20">·</span>
                        <span className="font-bold text-white/70">{leaguePreview.totalPoints} pts</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors duration-200 shrink-0" />
                  </Link>
                ) : (
                  <p className="text-[0.82rem] leading-[1.45] text-white/65 max-w-[220px]">
                    Aún no te uniste a ninguna liga.{" "}
                    <Link href="/leagues" className="text-primary font-bold underline underline-offset-[3px] hover:text-white">
                      ¡Busca una liga!
                    </Link>
                  </p>
                )}
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/leagues"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-300 no-underline hover:bg-white/[0.08]"
                >
                  Ver ligas
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase text-white tracking-[0.02em]">
                <BarChart2 className="w-4 h-4 text-primary" />
                Mis estadísticas
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Puntos</span>
                  <span className="font-display text-xl font-extrabold text-primary">{formatCount(totalPoints)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Jugadas</span>
                  <span className="font-display text-xl font-extrabold text-primary">{formatCount(dashboard?.scoredPredictions ?? 0)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] uppercase text-white/50 font-semibold mb-1">Registro</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xl font-extrabold text-[#00CE17]">
                      {dashboard?.exactPredictions ?? 0}
                    </span>
                    <span className="text-white/30 font-bold text-lg">—</span>
                    <span className="font-display text-xl font-extrabold text-[#FFCC00]">
                      {dashboard?.partialPredictions ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/rankings"
                  className="w-full flex items-center justify-center p-2 min-h-[36px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-300 no-underline hover:bg-white/[0.08]"
                >
                  Ver rankings
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Paneles centrales — datos reales */}
        {loadingPanels ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MatchPanelSkeleton />
            <MatchPanelSkeleton />
            <MatchPanelSkeleton />
          </div>
        ) : (
          <motion.div
            className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <History className="w-4 h-4 text-primary" />
                Últimos resultados
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {recentResults.length ? (
                  recentResults.map((m) => (
                    <RecentResultRow key={m.fixtureId} match={m} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-2 min-h-[140px]">
                    <Target className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      ¡Aún no obtuviste ningún resultado!
                    </p>
                  </div>
                )}
              </div>
              {(panels?.recentResults.length ?? 0) > 0 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05]">
                  <Link
                    href="/predictions?tab=results"
                    className="w-full block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08] transition-all duration-300"
                  >
                    Ver mis resultados
                  </Link>
                </div>
              )}
            </motion.div>

            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <CheckCircle className="w-4 h-4 text-primary" />
                Próximos con tu predicción
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {upcomingWithPrediction.length ? (
                  upcomingWithPrediction.map((m) => (
                    <UpcomingMatchRow key={m.fixtureId} match={m} prediction={m.prediction} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-3 min-h-[140px]">
                    <CalendarDays className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      No tenés predicciones en partidos próximos o en vivo.
                    </p>
                    <Link
                      href="/predictions"
                      className="mt-1 bg-primary text-black rounded-lg text-[0.8rem] font-bold px-4 py-2.5 transition-all duration-200 hover:opacity-90 active:scale-95 no-underline"
                    >
                      ¡Hacé tu primera predicción!
                    </Link>
                  </div>
                )}
              </div>
              {(panels?.upcomingWithPrediction.length ?? 0) > 0 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05] grid grid-cols-2 gap-2">
                  <a
                    href="/predictions?tab=saved"
                    className="flex-1 block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08] transition-all duration-300"
                  >
                    Ver mis predicciones
                  </a>
                  <Link
                    href="/fixture"
                    className="flex-1 block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08] transition-all duration-300"
                  >
                    Ver fixture completo
                  </Link>
                </div>
              )}
            </motion.div>

            <motion.div variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col min-h-0 overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="flex-none px-3 pt-3 pb-2.5 flex items-center gap-2 text-[0.72rem] font-bold uppercase text-white border-b border-white/[0.05]">
                <Hourglass className="w-4 h-4 text-primary" />
                Pendientes de predicción
                {(panels?.pendingPredictionsTotal ?? 0) > 0 && (
                  <span className="bg-[#D50204] text-white text-[0.6rem] font-bold h-4.5 min-w-[18px] rounded-full flex items-center justify-center px-1.5 ml-auto">
                    {panels!.pendingPredictionsTotal}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-2 gap-1.5">
                {pendingPredictions.length ? (
                  pendingPredictions.map((m) => (
                    <PendingMatchRow key={m.fixtureId} match={m} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-6 gap-2 min-h-[140px]">
                    <Hourglass className="w-9 h-9 text-white/20" />
                    <p className="text-[0.8rem] leading-[1.4] text-white/55 max-w-[220px]">
                      ¡Ya no te quedan partidos por predecir!
                    </p>
                  </div>
                )}
              </div>
              {/* Always-visible footer button for Pendientes */}
              {(panels?.pendingPredictions.length ?? 0) > 0 && (
                <div className="flex-none p-2.5 border-t border-white/[0.05]">
                  <Link
                    href="/predictions?tab=pending"
                    className="w-full block text-center p-2 min-h-[34px] leading-[18px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[0.75rem] font-semibold no-underline hover:bg-white/[0.08] transition-all duration-300"
                  >
                    {(panels?.pendingPredictionsTotal ?? 0) > 4
                      ? `Ver todos los pendientes (${panels!.pendingPredictionsTotal})`
                      : 'Ver mis pendientes'}
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* CTA Banners */}
        <motion.div
          className="flex-none grid grid-cols-1 md:grid-cols-3 gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Link
            href="/predictions"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] bg-gradient-to-br from-[#AFE805] to-[#85b300] text-black"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Mi Prode</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Hacé tus predicciones y seguí tu progreso.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-[#AFE805] rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <img src="/logo-mundial-2026.svg" className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" alt="" />
          </Link>

          <Link
            href="/rankings"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] bg-gradient-to-br from-[#0052FF] to-[#001AAC] text-white"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Rankings</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Compará tu posición con otros participantes.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <BarChart2 className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" />
          </Link>

          <Link
            href="/leagues"
            className="rounded-xl p-4 flex flex-col min-h-[96px] relative overflow-hidden no-underline transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] bg-gradient-to-br from-[#FF3B30] to-[#D50204] text-white"
          >
            <h3 className="font-display text-[1rem] font-extrabold uppercase mb-1 z-[2]">Ligas</h3>
            <p className="text-[0.78rem] font-medium max-w-[75%] opacity-90 z-[2]">Creá o unite a ligas y competí con tus amigos.</p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center z-[2]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <Users className="absolute bottom-[-16px] right-[-16px] w-[90px] h-[90px] opacity-20 z-[1]" />
          </Link>
        </motion.div>
      </main>
    </>
  );
}
