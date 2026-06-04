"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Target,
  Star,
  ArrowRight,
  CalendarClock,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { Header } from "../../../components/layout/Header";
import { useAuth } from "../../../hooks/useAuth";
import {
  fetchLeaderboard,
  fetchMyLeaderboardStats,
  fetchMyPointsHistory,
  type LeaderboardEntry,
  type MyLeaderboardStats,
  type PointsHistoryEntry,
} from "../../../api/leaderboard";
import { RankingRowSkeleton } from "@/components/skeletons/RankingRowSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/animations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from "recharts";

function labelForDay(iso: string, tab: string): string {
  const d = new Date(iso)
  if (tab === 'Semanal') {
    return d.toLocaleDateString('es-AR', { weekday: 'short' })
  }
  if (tab === 'Mensual') {
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const TAB_DAYS: Record<string, number> = {
  Semanal: 7,
  Mensual: 30,
  'Todo el Torneo': Infinity,
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [activeChartTab, setActiveChartTab] = useState("Mensual");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyLeaderboardStats | null>(null);
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchLeaderboard(1, 100).catch(e => { console.warn("leaderboard error", e); return { count: 0, results: [], next: null, previous: null }; }), 
      fetchMyLeaderboardStats().catch(e => { console.warn("stats error", e); return null; }), 
      fetchMyPointsHistory().catch(e => { console.warn("history error", e); return { results: [] }; })
    ])
      .then(([lb, stats, hist]) => {
        if (!cancelled) {
          setLeaderboard(lb.results);
          setTotalParticipants(lb.count);
          setMyStats(stats);
          setHistory(hist.results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeaderboard([]);
          setMyStats(null);
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = (() => {
    const cutoffDays = TAB_DAYS[activeChartTab] ?? Infinity;
    const cutoff = cutoffDays === Infinity ? null : new Date(Date.now() - cutoffDays * 86400_000);
    const filtered = history.filter((e) => !cutoff || new Date(e.day) >= cutoff);
    const points = filtered.map((e) => ({ name: labelForDay(e.day, activeChartTab), puntos: e.cumulative }));
    return points.length > 0 ? [{ name: 'Inicio', puntos: 0 }, ...points] : [];
  })();

  const totalPoints = myStats?.totalPoints ?? null;
  const globalRank = myStats?.globalRank ?? null;
  const precision = myStats?.precision ?? null;

  const sorted = [...leaderboard];
  sorted.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  const top10 = sorted.slice(0, 10);
  const userInTop10 = globalRank !== null && globalRank <= 10;

  return (
    <>
      <Header
        title="Rankings"
        subtitle="Medite contra todos los jugadores de Prodeazo."
      />
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6 flex flex-col gap-4">
        {/* Top 3 Stat Cards */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={staggerContainer} initial="hidden" animate="visible">
          {[
            { icon: <Star className="w-6 h-6" />, label: "Tus Puntos Totales", value: totalPoints !== null ? totalPoints.toLocaleString('es-AR') : '—' },
            { icon: <Trophy className="w-6 h-6" />, label: "Posición Global", value: globalRank !== null ? globalRank.toLocaleString('es-AR') : '—' },
            { icon: <Target className="w-6 h-6" />, label: "Precisión Promedio", value: precision !== null ? `${precision}%` : '—' },
          ].map(({ icon, label, value }) => (
            <motion.div key={label} variants={scaleIn} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-primary">
                {icon}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-bold uppercase text-white/60 tracking-[0.02em]">{label}</span>
                <div className="flex items-baseline gap-2">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <span className="font-display text-[1.8rem] font-extrabold text-white leading-none">{value}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Leaderboard Column (Left - 1/3) */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col min-h-0 lg:col-span-1">
            <div className="flex items-center gap-2 px-4 py-4 border-b border-white/[0.05] flex-none">
              <Trophy className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-[0.95rem] font-bold text-white whitespace-nowrap">Top Global</h3>
              <div className="ml-auto flex items-center gap-2">
                {totalParticipants > 0 && (
                  <span className="text-[0.7rem] text-white/40">
                    {totalParticipants.toLocaleString('es-AR')} participantes
                  </span>
                )}
                <select
                  disabled
                  className="hidden w-fit bg-black/40 border border-white/10 text-white/40 text-[0.7rem] font-semibold py-1 pl-2 pr-6 rounded-md outline-none appearance-none cursor-not-allowed"
                >
                  <option>Histórico</option>
                  <option>Mes actual</option>
                  <option>Último mes</option>
                </select>
              </div>
            </div>

            {/* No users at all */}
            {!loading && leaderboard.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 gap-3 min-h-0">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <Users className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <p className="text-[0.9rem] font-bold text-white mb-1">Sin usuarios en el Top</p>
                  <p className="text-[0.75rem] text-white/50 max-w-[200px] mx-auto leading-[1.5]">
                    Todavía no hay jugadores registrados en Prodeazo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-none grid [grid-template-columns:48px_1fr_60px] px-4 py-2.5 text-[0.65rem] font-bold text-white/35 uppercase border-b border-white/[0.05]">
                  <div>POS</div>
                  <div>PARTICIPANTE</div>
                  <div className="text-right">PUNTOS</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <>
                      {Array.from({ length: 15 }).map((_, i) => (
                        <RankingRowSkeleton key={i} />
                      ))}
                    </>
                  ) : (
                    <>
                      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                        {sorted.slice(0, 30).map((entry: LeaderboardEntry, i: number) => {
                          const rank = i + 1;
                          const posColor =
                            rank === 1 ? 'text-[#FFCC00]' :
                            rank === 2 ? 'text-[#C0C0C0]' :
                            rank === 3 ? 'text-[#CD7F32]' :
                                         'text-white/50';
                          const posDisplay =
                            rank === 1 ? '🥇' :
                            rank === 2 ? '🥈' :
                            rank === 3 ? '🥉' :
                                         `${rank}°`;
                          const initials = getInitials(entry.name);
                          const isCurrentUser = user && entry.id === user.id;

                          return (
                            <motion.div
                              key={entry.id}
                              variants={fadeInUp}
                              className={clsx(
                                "grid [grid-template-columns:48px_1fr_60px] px-4 py-3 items-center border-b transition-colors duration-150",
                                isCurrentUser
                                  ? "bg-primary/[0.06] border-primary/[0.15] hover:bg-primary/[0.08]"
                                  : "border-white/[0.03] hover:bg-white/[0.03]"
                              )}
                            >
                              <div className={clsx("font-display text-[1rem] font-extrabold", posColor)}>
                                {posDisplay}
                              </div>
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <div
                                  className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-semibold overflow-hidden shrink-0",
                                    isCurrentUser ? "text-black" : "bg-white/10 text-white/50"
                                  )}
                                  style={isCurrentUser ? { backgroundColor: 'var(--color-primary)' } : undefined}
                                >
                                  {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                  ) : (
                                    initials
                                  )}
                                </div>
                                <span className={clsx("text-[0.85rem] font-semibold truncate", isCurrentUser ? "text-white" : "text-white/90")}>
                                  {entry.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="bg-primary text-black text-[0.55rem] font-extrabold px-1.5 py-[2px] rounded uppercase shrink-0">
                                    TÚ
                                  </span>
                                )}
                              </div>
                              <div className="font-display text-[0.95rem] font-bold text-white text-right">
                                {entry.totalPoints.toLocaleString('es-AR')}
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      {/* User row if they are not in the top 30 */}
                      {globalRank !== null && globalRank > 30 && leaderboard.length > 0 && (
                        <>
                          <div className="grid [grid-template-columns:48px_1fr_60px] px-4 py-1 items-center opacity-40 select-none">
                            <div className="text-white/60 font-bold text-[0.9rem] tracking-widest text-center">···</div>
                            <div />
                            <div />
                          </div>
                          <div className="grid [grid-template-columns:48px_1fr_60px] px-4 py-3 items-center bg-primary/[0.06] border-t border-primary/[0.15]">
                            <div className="font-display text-[1rem] font-extrabold text-white/70">
                              {globalRank.toLocaleString('es-AR')}°
                            </div>
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-black text-[0.65rem] font-semibold overflow-hidden shrink-0"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                              >
                                {user?.name ? getInitials(user.name) : 'TÚ'}
                              </div>
                              <span className="text-[0.85rem] font-semibold text-white truncate">
                                {user?.name ?? 'tu_usuario'}
                              </span>
                              <span className="bg-primary text-black text-[0.55rem] font-extrabold px-1.5 py-[2px] rounded uppercase shrink-0">
                                TÚ
                              </span>
                            </div>
                            <div className="font-display text-[0.95rem] font-bold text-white text-right">
                              {totalPoints !== null ? totalPoints.toLocaleString('es-AR') : '—'}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (2/3) */}
          <div className="flex flex-col gap-4 min-h-0 lg:col-span-2">
            {/* Chart Section */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 md:p-6 flex flex-col gap-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-[1.05rem] font-bold text-white">Evolución de puntos</h3>
                <div className="flex gap-2 flex-wrap">
                  {['Semanal', 'Mensual', 'Todo el Torneo'].map(tab => (
                    <button
                      key={tab}
                      className={clsx(
                        "px-3 py-1.5 min-h-[34px] bg-white/[0.05] border border-transparent rounded-lg text-[0.75rem] font-semibold cursor-pointer transition-all duration-200",
                        activeChartTab === tab
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => setActiveChartTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-[220px]">
                {!loading && chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/35 text-[0.85rem]">
                    Todavía no tenés predicciones puntuadas en este período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPuntos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#AFE805" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#AFE805" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#AFE805', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="puntos" stroke="none" fillOpacity={1} fill="url(#colorPuntos)" />
                      <Line type="monotone" dataKey="puntos" stroke="#AFE805" strokeWidth={3} dot={{ r: 4, fill: '#AFE805', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#AFE805', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Hall of Fame / Mejores del mes */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden min-h-[140px] opacity-70 transition-opacity hover:opacity-100">
              <div className="absolute inset-0 bg-black/20 z-0"></div>
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center z-10 mb-1">
                <Star className="w-5 h-5 text-white/40" />
              </div>
              <h3 className="text-[1.05rem] font-bold text-white z-10 leading-none">Los mejores del mes</h3>
              <p className="text-[0.8rem] text-white/50 max-w-[340px] z-10 leading-relaxed font-medium">
                Próximamente. Al finalizar cada mes, destacaremos a los mejores jugadores de Prodeazo.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
