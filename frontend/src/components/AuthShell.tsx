import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

import { Navbar } from './Navbar'

const LOGO_SRC = '/logo-mundial-2026.svg'

interface AuthShellProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground">
      <Navbar variant="auth" position="absolute" />

      {/* Background decorations with subtle motion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute right-0 top-0 h-36 w-44 rounded-bl-[7rem] bg-gradient-to-br from-[#001AAC] to-[#000a5e] sm:h-52 sm:w-64 sm:rounded-bl-[12rem]"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="pointer-events-none absolute bottom-0 left-0 h-32 w-40 rounded-tr-[7rem] bg-gradient-to-tr from-[#033F2D] to-[#021f1c] sm:h-48 sm:w-60 sm:rounded-tr-[11rem]"
        aria-hidden
      />
      <motion.div
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 1, delay: 0.4 }}
        className="pointer-events-none fixed bottom-0 right-0 h-24 w-32 rounded-tl-[5rem] bg-gradient-to-br from-[#D50204] to-[#8a0103] sm:h-36 sm:w-48 sm:rounded-tl-[8rem]"
        aria-hidden
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-3xl flex-col gap-8 rounded-[20px] border border-white/10 bg-black/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur sm:flex-row sm:p-7 lg:gap-12"
      >
        <div className="hidden shrink-0 flex-col items-center justify-center gap-3 sm:flex lg:gap-4">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative block h-24 w-28 sm:h-28 sm:w-32 lg:h-36 lg:w-40"
          >
            <img src={LOGO_SRC} alt="" className="h-full w-full object-contain object-center" />
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center justify-center leading-none lg:gap-2"
          >
            <span className="font-display text-2xl font-bold uppercase tracking-[-0.06em] lg:text-3xl select-none">Prodeazo</span>
            <span className="mt-1 font-display text-sm font-bold uppercase tracking-[-0.06em] text-green-normal sm:mt-2 sm:text-base lg:text-xl select-none">FIFA 2026</span>
          </motion.span>
        </div>

        <div className="flex flex-1 flex-col">
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6 text-center sm:text-left"
          >
            <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-foreground/75">{description}</p>
          </motion.div>

          {children}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-6 text-center text-[15px] text-foreground/85"
          >
            {footer}
          </motion.div>
        </div>
      </motion.div>
    </main>
  )
}
