"use client";

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from './Logo'
import { useAuth } from '../hooks/useAuth'

interface NavbarProps {
  variant?: 'landing' | 'auth'
  position?: 'relative' | 'absolute'
}

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/fixture', label: 'Mi Prode' },
]

export function Navbar({ variant = 'landing', position = 'relative' }: NavbarProps) {
  const router = useRouter()
  const user = useAuth((state) => state.user)

  const isAuth = variant === 'auth'

  return (
    <header className={`${position} ${position === 'absolute' ? 'top-0 left-0 right-0' : ''} z-50 w-full shrink-0 border-b border-white/10 bg-transparent`}>
      <div className={`mx-auto flex h-16 w-full items-center ${isAuth ? '' : 'justify-between'} gap-2 px-3 sm:h-[4.5rem] sm:gap-4 sm:px-6`}>
        <Logo simplified={variant === 'landing'} />

        {!isAuth && (
          <>
            <nav
              className="hidden items-center gap-5 text-sm font-bold text-foreground/70 sm:flex sm:gap-6 md:gap-8"
              aria-label="Principal"
            >
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground select-none">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              {user ? (
                <button
                  onClick={() => router.push('/home')}
                  className="rounded-full bg-primary px-2.5 py-2 font-display text-[11px] font-bold tracking-tight text-black transition-all duration-200 hover:brightness-95 hover:scale-105 active:scale-95 active:translate-y-0.5 sm:px-4 sm:text-sm select-none cursor-pointer"
                >
                  Mi prode
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/30 bg-black px-2.5 py-2 font-display text-[11px] font-bold tracking-tight text-foreground transition-all duration-200 hover:border-primary hover:brightness-110 active:scale-95 active:translate-y-0.5 sm:px-4 sm:text-sm select-none"
                  >
                    <span className="hidden min-[381px]:inline">Iniciar sesión</span>
                    <span className="inline min-[381px]:hidden">Entrar</span>
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-primary px-2.5 py-2 font-display text-[11px] font-bold tracking-tight text-black transition-all duration-200 hover:brightness-95 hover:scale-105 active:scale-95 active:translate-y-0.5 sm:px-4 sm:text-sm select-none"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
