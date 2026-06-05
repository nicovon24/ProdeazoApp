"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  UserCircle,
  LogOut,
  Menu,
  X,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useUIStore } from "../../store/useUIStore";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
}

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="ig-icon-stroke" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#833ab4" />
        <stop offset="50%" stopColor="#fd1d1d" />
        <stop offset="100%" stopColor="#fcb045" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-icon-stroke)" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#ig-icon-stroke)" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#ig-icon-stroke)" />
  </svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function Header({ title, subtitle, onBack, backLabel }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleSidebar, sidebarOpen } = useUIStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-end gap-2 px-4 md:px-8 py-4 min-h-16 bg-[#0a0a0a]/90 backdrop-blur-md">
      {/* Hamburger — visible on mobile and tablet (< 1024px) */}
      <button
        className="max-lg:flex hidden relative items-center justify-center px-3 py-2 rounded-[10px] border-none bg-transparent text-white/70 cursor-pointer transition-all duration-200 hover:bg-white/[0.06] hover:text-white mr-1"
        type="button"
        aria-label="Abrir menú de navegación"
        title="Menú"
        onClick={toggleSidebar}
      >
        <div className="relative w-5 h-5">
           {/* MOBILE: Menu / X */}
           <Menu className={clsx("absolute inset-0 transition-transform duration-300 md:hidden", sidebarOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
           <X className={clsx("absolute inset-0 transition-transform duration-300 md:hidden text-black", sidebarOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
           
           {/* TABLET: ArrowRight / ArrowLeft */}
           <ArrowRight className={clsx("absolute inset-0 transition-transform duration-300 hidden md:max-lg:block", sidebarOpen ? "rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
           <ArrowLeft className={clsx("absolute inset-0 transition-transform duration-300 hidden md:max-lg:block", sidebarOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0")} />
        </div>
      </button>

      {/* Back button */}
      {onBack && (
        <button
          className="flex items-center gap-2 self-stretch bg-transparent border-none text-white/50 hover:text-white cursor-pointer text-[1rem] font-extrabold tracking-wide transition-all duration-200 px-3 -ml-2 mr-1 shrink-0 rounded-xl hover:bg-white/[0.07]"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
          {backLabel ?? 'VOLVER'}
        </button>
      )}

      {/* Page title */}
      <div className="mr-auto flex flex-col gap-0.5 min-w-0">
        <h1 className="font-display text-[1.25rem] md:text-[1.75rem] font-bold text-white leading-[1.2] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[0.8rem] md:text-[0.875rem] text-white/55 hidden sm:block truncate">{subtitle}</p>
        )}
      </div>

      {/* Help button — hidden on < 768px */}
      <div
        className="relative hidden md:flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-white/30 text-[0.85rem] font-medium cursor-default select-none"
        title="Ayuda — Próximamente"
      >
        <HelpCircle className="w-5 h-5" />
        <span>Ayuda</span>
      </div>

      {/* Social links */}
      <div className="hidden sm:flex items-center gap-2 mr-2">
         <a href="https://instagram.com/prodeazo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[0.8rem] font-bold no-underline border border-white/30 hover:bg-white/[0.08] hover:border-white/50 transition-all duration-200 active:scale-95">
            <Instagram className="w-4 h-4 shrink-0" />
            <span className="max-lg:hidden">¡Seguinos!</span>
          </a>
          <a href="https://x.com/prodeazo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[0.8rem] font-bold no-underline border border-white/30 hover:bg-white/[0.08] hover:border-white/50 transition-all duration-200 active:scale-95">
            <Twitter className="w-4 h-4 shrink-0 fill-current" />
            <span className="max-lg:hidden">¡Seguinos!</span>
          </a>
      </div>

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-2 md:gap-2.5 py-1.5 pl-1.5 pr-2 md:pr-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-white cursor-pointer transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]"
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-[34px] h-[34px] rounded-full object-cover bg-white/10"
            />
          ) : (
            <span className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[0.85rem] font-bold text-black">
              {initials}
            </span>
          )}
          {/* First name only on mobile (< 768px); full name on larger */}
          <span className="hidden sm:block md:hidden text-[0.875rem] font-semibold max-w-[120px] truncate">
            {user?.name?.split(" ")[0] ?? "Usuario"}
          </span>
          <span className="hidden md:block text-[0.875rem] font-semibold max-w-[120px] truncate">
            {user?.name ?? "Usuario"}
          </span>
          <ChevronDown
            className={clsx(
              "w-4 h-4 text-white/50 transition-transform duration-200",
              menuOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] max-w-[calc(100vw-32px)] bg-[#141414] border border-white/10 rounded-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50"
            >
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-none bg-transparent text-white/75 text-[0.85rem] font-medium cursor-pointer transition-all duration-[150ms] w-full text-left no-underline hover:bg-white/[0.06] hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle className="w-[18px] h-[18px]" />
                Ajustes de cuenta
              </Link>
              <button
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-none bg-transparent text-[#D50204] text-[0.85rem] font-medium cursor-pointer transition-all duration-[150ms] w-full text-left hover:bg-[rgba(213,2,4,0.1)] hover:text-[#ff3b3b]"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Cerrar sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
