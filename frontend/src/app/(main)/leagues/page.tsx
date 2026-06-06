"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Star,
  Target,
  Plus,
  ArrowRight,
  ShieldHalf,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Header } from "../../../components/layout/Header";
import { FixtureRowSkeleton } from "../../../components/skeletons/FixtureRowSkeleton";
import { useAuth } from "../../../hooks/useAuth";
import {
  getMyLeagues,
  createLeague,
  joinByCode,
  joinByToken,
  getLeagueLeaderboard,
  type MyLeagueRow,
} from "../../../api/mini-leagues";
import { ApiError } from "../../../api/client";
import { staggerContainer, fadeInUp } from "../../../lib/animations";

type ToastTone = "success" | "error";
interface ToastState { tone: ToastTone; title: string; message: string }

const MODAL_MOTION = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

function LeagueRowSkeleton() {
  return (
    <div className="flex items-center gap-5 px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl animate-pulse">
      <div className="w-[52px] h-[52px] bg-white/10 rounded-lg flex-shrink-0" />
      <div className="flex-[2] flex flex-col gap-2">
        <div className="h-4 w-44 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="h-5 w-12 bg-white/10 rounded" />
        <div className="h-9 w-[72px] bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

export default function LeaguesPage() {
  const router = useRouter();
  const currentUser = useAuth(s => s.user);
  const [activeTab, setActiveTab] = useState("Mis Ligas");
  const [myLeagues, setMyLeagues] = useState<MyLeagueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaguePositions, setLeaguePositions] = useState<Record<string, { rank: number; totalMembers: number; totalPoints: number } | null>>({});

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(tone: ToastTone, title: string, message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tone, title, message });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  const loadLeagues = useCallback(() => {
    let cancelled = false;
    const startTime = Date.now();
    setLoading(true);

    function finishLoading() {
      const elapsed = Date.now() - startTime;
      const remaining = 750 - elapsed;
      if (remaining > 0) {
        setTimeout(() => { if (!cancelled) setLoading(false); }, remaining);
      } else {
        if (!cancelled) setLoading(false);
      }
    }

    getMyLeagues()
      .then(async (data) => {
        if (cancelled) return;
        const rows = data.results;
        setMyLeagues(rows);

        // Fetch leaderboard for each league to find user's position
        const posMap: Record<string, { rank: number; totalMembers: number; totalPoints: number } | null> = {};
        const leaderboardPromises = rows.map(async ({ league }) => {
          try {
            const lb = await getLeagueLeaderboard(league.id);
            const entry = lb.results.find(e => e.id === currentUser?.id);
            if (entry) {
              posMap[league.id] = { rank: entry.rank, totalMembers: lb.count, totalPoints: entry.totalPoints };
            } else {
              posMap[league.id] = null;
            }
          } catch {
            posMap[league.id] = null;
          }
        });
        await Promise.all(leaderboardPromises);
        if (!cancelled) setLeaguePositions(posMap);
      })
      .catch(() => { if (!cancelled) setMyLeagues([]); })
      .finally(finishLoading);
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    const cancel = loadLeagues();
    return cancel;
  }, [loadLeagues]);

  // Close modals on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowJoinModal(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Stats derived from leaderboard data
  const avgPosition = (() => {
    const positions = Object.values(leaguePositions).filter(Boolean) as { rank: number; totalMembers: number; totalPoints: number }[];
    if (positions.length === 0) return null;
    const avg = positions.reduce((s, p) => s + p.rank, 0) / positions.length;
    return Math.round(avg * 10) / 10;
  })();

  const totalLeaguePoints = (() => {
    // Not available from leaderboard entries alone — keep as "—"
    return null;
  })();

  async function handleCreate() {
    if (!createName.trim() || createName.trim().length > 50) {
      setCreateError("El nombre debe tener entre 1 y 50 caracteres.");
      return;
    }
    setCreateError("");
    setCreateLoading(true);
    try {
      await createLeague(createName.trim());
      setShowCreateModal(false);
      setCreateName("");
      loadLeagues();
      showToast("success", "Liga creada", "Tu liga fue creada exitosamente.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo crear la liga.";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  }

  function extractToken(input: string): { token: string } | { error: string } | null {
    try {
      const url = new URL(input)
      const t = url.searchParams.get("token")
      if (t) return { token: t }
      return { error: "El link no contiene un token de invitación válido." }
    } catch {
      return null
    }
  }

  async function handleJoin() {
    const raw = joinCode.trim();
    if (!raw) {
      setJoinError("Ingresá el código o el link de invitación.");
      return;
    }
    setJoinError("");
    setJoinLoading(true);
    try {
      const extracted = extractToken(raw);
      if (extracted && "error" in extracted) {
        setJoinError(extracted.error);
        setJoinLoading(false);
        return;
      }

      const token = extracted?.token ?? null;
      if (token) {
        await joinByToken(token);
      } else if (raw.length > 8) {
        await joinByToken(raw);
      } else {
        await joinByCode(raw);
      }
      setShowJoinModal(false);
      setJoinCode("");
      loadLeagues();
      showToast("success", "Te uniste a la liga", "Ahora sos parte de la liga.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setJoinError("Ya sos miembro de esta liga.");
      } else if (err instanceof ApiError && err.status === 410) {
        setJoinError("Este link de invitación venció. Pedile uno nuevo al dueño de la liga.");
      } else if (err instanceof ApiError && err.status === 404) {
        setJoinError("Código o link inválido.");
      } else {
        const msg = err instanceof ApiError ? err.message : "No se pudo unir a la liga.";
        setJoinError(msg);
      }
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Ligas"
        subtitle="Competí contra tus amigos y otros participantes."
      />
      <main className="flex-1 px-4 md:px-8 pt-4 md:pt-6 pb-6 md:pb-8 flex flex-col">
        {/* Top Stat Cards — moved below CTAs on mobile via order-last */}
        <div className="order-last lg:order-none mt-6 lg:mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {[
              { icon: <Users className="w-5 h-5 md:w-6 md:h-6" />, label: "Ligas Activas", value: loading ? '—' : String(myLeagues.length), sub: null },
              { icon: <Trophy className="w-5 h-5 md:w-6 md:h-6" />, label: "Posición Promedio", value: loading ? '—' : avgPosition !== null ? `#${avgPosition}` : '—', sub: null },
              { icon: <Star className="w-5 h-5 md:w-6 md:h-6" />, label: "Puntos en Ligas", value: "—", sub: null },
              { icon: <Target className="w-5 h-5 md:w-6 md:h-6" />, label: "Precisión Promedio", value: "—", sub: null },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 md:p-5 flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-primary shrink-0">
                  {icon}
                </div>
                <div className="flex flex-row md:flex-col justify-between md:justify-start items-baseline md:items-start gap-x-2 md:gap-1 min-w-0 flex-1 break-words">
                  <span className="text-[0.65rem] md:text-[0.7rem] font-bold uppercase text-white/60 tracking-[0.02em]">{label}</span>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="font-display text-[1.15rem] md:text-[1.8rem] font-extrabold text-white leading-none">{value}</span>
                    {sub && <span className="text-[0.75rem] text-white/50">{sub}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-white/10 mb-6">
          {['Mis Ligas', 'Explorar Ligas'].map(tab => (
            <button
              key={tab}
              type="button"
              className={clsx(
                "bg-transparent border-none text-[0.95rem] font-semibold py-3 cursor-pointer relative transition-colors duration-200 whitespace-nowrap",
                "flex-1 md:flex-none text-center md:text-left",
                activeTab === tab
                  ? "text-primary tab-btn-active-line"
                  : "text-white/50 hover:text-white/80"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Mis Ligas' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1">
            {/* Left Col - My Leagues */}
            <div className="flex-[2] flex flex-col gap-6 w-full flex-1">
              <h2 className="text-[1.1rem] font-bold text-white hidden md:block">Ligas en las que participo</h2>

              <div className="flex flex-col gap-2 flex-1">
                {loading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => <LeagueRowSkeleton key={i} />)}
                  </div>
                ) : myLeagues.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 px-6 bg-white/[0.02] border border-dashed border-white/10 rounded-xl text-center">
                    <Users className="w-10 h-10 text-white/20" />
                    <p className="text-[1rem] font-semibold text-white/70">No tenés ligas todavía.</p>
                    <p className="text-[0.85rem] text-white/40">Creá una liga o unite a una con un código.</p>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-2">
                  {myLeagues.map(({ league, role }) => {
                    const pos = leaguePositions[league.id];
                    return (
                      <motion.div key={league.id} variants={fadeInUp} className="relative flex items-start gap-4 md:items-center md:gap-5 px-4 md:px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl transition-[border-color] duration-200 hover:border-white/20 cursor-pointer" onClick={() => router.push('/leagues/' + league.id)}>
                        {/* Mobile arrow top-right */}
                        <ArrowRight className="absolute top-3 right-3 w-4 h-4 text-white/30 md:hidden" />

                        <div
                          className="w-[44px] md:w-[52px] h-[44px] md:h-[52px] shrink-0 bg-white/[0.05] rounded-lg flex items-center justify-center text-primary"
                          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        >
                          <Users className="w-5 h-5 md:w-6 md:h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.95rem] md:text-[1.05rem] font-bold text-white truncate">{league.name}</span>
                            {role === 'owner' && <Trophy className="text-[#FFCC00] w-4 h-4 shrink-0" />}
                          </div>

                          {/* Mobile info row */}
                          <div className="flex md:hidden flex-wrap items-center gap-x-1.5 mt-0.5 text-[0.7rem] text-white/50">
                            <span>{role === 'owner' ? 'Propietario' : 'Miembro'}</span>
                            {pos && (
                              <>
                                <span>·</span>
                                <span>{pos.totalMembers} {pos.totalMembers === 1 ? 'participante' : 'participantes'}</span>
                                <span>·</span>
                                <span className="font-bold text-white/70">{pos.totalPoints} pts</span>
                              </>
                            )}
                          </div>

                          {/* Desktop role */}
                          <span className="hidden md:block text-[0.75rem] text-white/50 mt-0.5">
                            {role === 'owner' ? 'Propietario' : 'Miembro'}
                          </span>
                        </div>

                        {pos && (
                          <div className="hidden md:flex flex-col items-center mr-3 gap-1">
                            <span className="font-display text-[1.2rem] font-extrabold text-primary">#{pos.rank}</span>
                            <span className="text-[0.6rem] text-white/45 uppercase font-bold">{pos.totalMembers} {pos.totalMembers === 1 ? 'PARTICIPANTE' : 'PARTICIPANTES'}</span>
                            <span className="text-[0.75rem] font-bold text-white/70">{pos.totalPoints} pts</span>
                          </div>
                        )}

                        <button
                          className="hidden md:flex px-4 py-2 rounded-lg bg-transparent border border-primary/30 text-primary text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary/10"
                          onClick={(e) => { e.stopPropagation(); router.push('/leagues/' + league.id); }}
                        >
                          Ver liga
                        </button>
                      </motion.div>
                    );
                  })}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Col - CTAs */}
            <div className="flex-1 flex flex-col gap-4 w-full lg:w-auto lg:sticky lg:top-24">
              <button
                className="rounded-2xl p-6 flex items-start justify-between relative overflow-hidden cursor-pointer text-left w-full border-none bg-gradient-to-br from-[#AFE805] to-[#85b300] text-black transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => { setCreateName(""); setCreateError(""); setShowCreateModal(true); }}
              >
                <div className="flex flex-col gap-2 z-[2] max-w-[80%]">
                  <h3 className="font-display text-[1.15rem] font-extrabold">Crear nueva liga</h3>
                  <p className="text-[0.8rem] font-medium opacity-90">Creá tu propia liga y desafiá a tus amigos.</p>
                </div>
                <div className="w-9 h-9 bg-black text-[#AFE805] rounded-lg flex items-center justify-center z-[2] shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <Users className="absolute right-[-20px] bottom-[-20px] w-[140px] h-[140px] opacity-15 z-[1]" />
              </button>

              <button
                className="rounded-2xl p-6 flex items-start justify-between relative overflow-hidden cursor-pointer text-left w-full border-none bg-gradient-to-br from-[#0052FF] to-[#001AAC] text-white transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => { setJoinCode(""); setJoinError(""); setShowJoinModal(true); }}
              >
                <div className="flex flex-col gap-2 z-[2] max-w-[80%]">
                  <h3 className="font-display text-[1.15rem] font-extrabold">Unirse a una liga</h3>
                  <p className="text-[0.8rem] font-medium opacity-90">¿Tenés un código de liga? Unite y empezá a competir.</p>
                </div>
                <div className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center z-[2] shrink-0">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <Users className="absolute right-[-20px] bottom-[-20px] w-[140px] h-[140px] opacity-15 z-[1]" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Explorar Ligas' && (
          <div className="flex flex-col items-center gap-4 py-16 px-6 text-center flex-1 justify-center">
            <ShieldHalf className="w-12 h-12 text-white/20" />
            <h3 className="text-[1.15rem] font-bold text-white">Explorar ligas</h3>
            <p className="text-[0.9rem] text-white/50 max-w-[480px] leading-relaxed">
               Las ligas en Prodeazo, por ahora, son privadas. Solo podés unirte si tenés un código o un link de invitación de un miembro existente.
            </p>
            <button
              className="px-6 py-2.5 bg-transparent border border-primary/30 rounded-lg text-primary text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 hover:bg-primary/10"
              onClick={() => { setJoinCode(""); setJoinError(""); setShowJoinModal(true); }}
            >
              Unirse con código
            </button>
          </div>
        )}

        {/* Modal — Crear liga */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              key="create-modal"
              className="fixed inset-0 bg-black/75 flex items-center justify-center z-[200] p-6"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
              {...MODAL_MOTION}
            >
              <div
                className="bg-[#111217] border border-white/10 rounded-2xl p-8 w-full max-w-[420px] flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-[1.25rem] font-extrabold text-white m-0">Crear liga</h2>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.03em]">Nombre de la liga</label>
                  <input
                    className="bg-white/[0.05] border border-white/[0.12] rounded-[10px] px-4 py-3 text-white text-[0.95rem] outline-none transition-[border-color] duration-200 focus:border-primary/40"
                    type="text"
                    placeholder="Ej: Amigos del trabajo"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    maxLength={50}
                    autoFocus
                  />
                  {createError && (
                    <span className="text-[0.8rem] text-[#ff6b6b] font-medium">{createError}</span>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-5 py-2.5 bg-transparent border border-white/[0.15] rounded-lg text-white/70 text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-white/[0.08]"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-6 py-2.5 bg-primary border-none rounded-lg text-black text-[0.9rem] font-bold cursor-pointer transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:opacity-90"
                    onClick={handleCreate}
                    disabled={createLoading}
                  >
                    {createLoading ? 'Creando…' : 'Crear'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal — Unirse */}
        <AnimatePresence>
          {showJoinModal && (
            <motion.div
              key="join-modal"
              className="fixed inset-0 bg-black/75 flex items-center justify-center z-[200] p-6"
              onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}
              {...MODAL_MOTION}
            >
              <div
                className="bg-[#111217] border border-white/10 rounded-2xl p-8 w-full max-w-[420px] flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-[1.25rem] font-extrabold text-white m-0">Unirse a una liga</h2>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.03em]">Código o link de invitación</label>
                  <input
                    className="bg-white/[0.05] border border-white/[0.12] rounded-[10px] px-4 py-3 text-white text-[0.95rem] outline-none transition-[border-color] duration-200 focus:border-primary/40"
                    type="text"
                    placeholder="Código (ABC12345) o link de invitación"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    autoFocus
                  />
                  {joinError && (
                    <span className="text-[0.8rem] text-[#ff6b6b] font-medium">{joinError}</span>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-5 py-2.5 bg-transparent border border-white/[0.15] rounded-lg text-white/70 text-[0.9rem] font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:bg-white/[0.08]"
                    onClick={() => setShowJoinModal(false)}
                    disabled={joinLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-6 py-2.5 bg-primary border-none rounded-lg text-black text-[0.9rem] font-bold cursor-pointer transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:opacity-90"
                    onClick={handleJoin}
                    disabled={joinLoading}
                  >
                    {joinLoading ? 'Uniéndose…' : 'Unirse'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              className={clsx(
                "fixed z-[120] flex items-start gap-3.5 p-4 rounded-[10px] shadow-[0_22px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden",
                "md:top-7 md:right-7 md:w-[min(420px,calc(100vw-56px))]",
                "max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:w-auto",
                toast.tone === 'success'
                  ? "bg-[#111a12] border border-[rgba(0,206,23,0.32)] text-[#f1fff5] toast-bar-success"
                  : "bg-[#1e1112] border border-[rgba(213,2,4,0.36)] text-[#fff0f0] toast-bar-error"
              )}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <span className="shrink-0 mt-0.5">
                {toast.tone === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[0.9rem] font-bold">{toast.title}</span>
                <span className="text-[0.8rem] opacity-85">{toast.message}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
