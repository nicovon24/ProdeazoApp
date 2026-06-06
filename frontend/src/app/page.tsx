"use client";

import { useState, useEffect } from 'react'
import { BarChart3, ChevronRight, Shield, Trophy, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

import { Navbar } from '../components/Navbar'

import { FeatureCard } from '../components/FeatureCard'

const LOGO_SRC = '/logo-mundial-2026.svg'

const features = [
  { title: 'Gratis', description: 'Sin costo para participar', icon: Shield },
  { title: 'Grupos', description: 'Competí con tus amigos', icon: UsersRound },
  { title: 'Ranking', description: 'Sumá puntos y subí en el ranking', icon: BarChart3 },
  { title: 'Premios', description: 'Grandes premios para los mejores', icon: Trophy },
]

const KICKOFF = new Date('2026-06-11T00:00:00')
const DAYS_TO_KICKOFF = Math.max(0, Math.ceil((KICKOFF.getTime() - Date.now()) / 86400000))

export default function Landing() {
  const router = useRouter()
  const user = useAuth((state) => state.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  }

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] as any },
    },
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground">
      {/* Círculo azul header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.1 }}
        className="pointer-events-none absolute right-0 top-0 z-30 h-[7.5rem] w-[10rem] rounded-bl-[6rem] bg-gradient-to-br from-[#001AAC] to-[#000a5e] sm:h-[9rem] sm:w-[13rem] sm:rounded-bl-[8rem] md:h-[10rem] md:w-[15rem] md:rounded-bl-[9rem] lg:h-64 lg:w-80 lg:rounded-bl-[18rem] xl:h-72 xl:w-96 xl:rounded-bl-[22rem]"
        aria-hidden
      />

      <Navbar variant="landing" position="relative" />

      <main className="flex flex-1 flex-col lg:h-[calc(100dvh-4rem)] lg:min-h-0 lg:grid lg:grid-rows-[1fr_auto]">
        <section className="relative isolate flex flex-1 flex-col border-b border-white/10 bg-black lg:min-h-0 overflow-hidden">
          {/* Bloques decorativos desktop */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pointer-events-none absolute right-0 top-0 z-[1] hidden h-full min-h-[20rem] w-[min(50%,34rem)] lg:block xl:w-[min(50%,38rem)]"
            aria-hidden
          >
            <div className="absolute bottom-0 right-0 grid h-[min(65%,26rem)] w-[min(26rem,70%)] grid-cols-[minmax(0,1fr)_minmax(7.5rem,34%)] xl:h-[min(68%,28rem)] xl:w-[min(30rem,70%)] xl:grid-cols-[minmax(0,1fr)_minmax(9rem,34%)]">
              <div className="h-full rounded-tl-[min(16rem,14vw)] bg-gradient-to-br from-[#033F2D] to-[#021f1c]" />
              <div className="grid h-full grid-rows-[38%_1fr]">
                <div className="bg-gradient-to-tl from-[#AFE805] via-[#c4ed2b] to-[#9bd606]" />
                <div className="bg-gradient-to-br from-[#D50204] to-[#8a0103]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-6 px-3 py-5 sm:gap-8 sm:px-6 sm:py-7 md:gap-10 md:py-8 lg:h-full lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-5 lg:px-6 lg:py-5 xl:gap-7"
          >
            <div className="relative z-10 w-full sm:max-w-xl">
              <motion.p variants={itemVariants} className="text-center font-display text-xs font-bold uppercase tracking-wider text-green-normal sm:text-left sm:text-sm md:text-base">
                Faltan
              </motion.p>
              <motion.h1 
                variants={itemVariants} 
                className="mt-2 text-center font-display text-[clamp(2.25rem,9vw,4.5rem)] font-bold uppercase leading-[0.92] text-foreground sm:text-left sm:mt-3 sm:text-6xl md:text-7xl lg:text-[min(7rem,10vw)] xl:text-[min(8rem,9vw)]"
              >
                <span className="block tabular-nums tracking-[-0.06em]">
                  {mounted ? DAYS_TO_KICKOFF : "---"}
                </span>
                <span className="mt-2 block text-[clamp(1rem,3.8vw+0.35rem,2.25rem)] font-bold uppercase leading-tight tracking-normal text-foreground sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                  días para el Mundial
                </span>
              </motion.h1>
              <motion.p variants={itemVariants} className="mt-4 max-w-md text-center text-sm leading-relaxed text-foreground/70 text-pretty sm:mt-5 sm:text-left sm:text-base md:text-lg">
                Hacé tu prode, competí con tus amigos y demostrá quién sabe más de fútbol.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6 sm:justify-start">
                <Link
                  href={user ? '/home' : '/register'}
                  className="group inline-flex min-h-11 w-full cursor-pointer select-none items-center justify-center gap-2 rounded-full bg-primary px-6 font-display text-sm font-bold tracking-tight text-black transition-all duration-200 hover:brightness-95 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(175,232,5,0.4)] active:scale-[0.98] active:translate-y-0.5 sm:min-h-12 sm:w-auto sm:px-7 sm:text-base md:min-h-14 md:px-8 md:text-lg"
                >
                  {user ? 'Ir a mi prode' : 'Crear mi prode'}
                  <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 sm:h-6 sm:w-6" aria-hidden />
                </Link>
              </motion.div>
            </div>

            <div className="relative z-10 flex min-h-[10.5rem] flex-1 items-center justify-center pb-3 sm:min-h-[13rem] sm:pb-4 md:min-h-[15rem] lg:min-h-0 lg:pb-0">
              <motion.div
                variants={logoVariants}
                className="relative flex w-full max-w-[min(100%,28rem)] flex-col items-center px-1 sm:px-2"
              >
                <div className="relative aspect-square w-[min(100%,12rem)] sm:w-52 md:w-60 lg:w-[min(18rem,32vw)] xl:w-72">
                  <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl" />
                  <motion.img
                    src={LOGO_SRC}
                    alt="Prodeazo FIFA 2026"
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={{ filter: 'blur(0px)', opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full w-full object-contain drop-shadow-[0_0_30px_rgba(175,232,5,0.6)]"
                  />
                </div>
                <p className="mt-2 text-center font-display text-[clamp(1.75rem,7vw,3rem)] font-bold uppercase leading-none tracking-[-0.06em] text-foreground sm:mt-3 sm:text-5xl md:text-6xl xl:text-7xl select-none">
                  Prodeazo
                </p>
                <p className="mt-2 text-center font-display text-base font-bold uppercase leading-none tracking-[-0.06em] text-green-normal sm:mt-3 sm:text-xl md:text-2xl xl:text-3xl select-none">
                  FIFA 2026
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="shrink-0 bg-black pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto grid max-w-7xl grid-cols-1 border-x border-white/10 sm:grid-cols-2 sm:px-0 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                isLast={index === features.length - 1}
              />
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  )
}
