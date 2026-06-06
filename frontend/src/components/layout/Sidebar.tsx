"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Home,
  CalendarDays,
  CheckCircle,
  BarChart3,
  Users,
  BookOpen,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useUIStore } from "@/store/useUIStore";

const NAV_ITEMS = [
  { label: "Inicio", href: "/home", icon: Home },
  { label: "Fixture", href: "/fixture", icon: CalendarDays },
  { label: "Predicciones", href: "/predictions", icon: CheckCircle },
  { label: "Rankings", href: "/rankings", icon: BarChart3 },
  { label: "Ligas", href: "/leagues", icon: Users },
  { label: "Reglas", href: "/rules", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();

  // Close drawer when navigating (mobile)
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  return (
    <>
      {/* Mobile+Tablet overlay — full screen */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[49] md:block lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      {/* Mobile-only overlay when closed: just show nothing */}
      {sidebarOpen && (
        <div
          className="fixed top-16 inset-x-0 bottom-0 bg-black/50 z-[39] block md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          // Base (desktop ≥ 1024px): full height from top
          "fixed top-0 left-0 w-[220px] h-screen flex flex-col bg-[#0a0a0a] border-r border-white/[0.06] z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out",
          // Tablet 768–1023px: starts at top-0 (above header), icon-only 64px if collapsed
          !sidebarOpen && "md:max-lg:w-16",
          sidebarOpen && "md:max-lg:w-[220px]",
          // Mobile <768px: drawer below navbar (top-16 = 64px header height)
          "max-md:top-16 max-md:h-[calc(100vh-4rem)]",
          "max-md:-translate-x-full",
          sidebarOpen && "max-md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={clsx(
          "flex flex-col items-center gap-1 px-4 pt-6 pb-5 overflow-hidden",
          !sidebarOpen && "md:max-lg:px-2 md:max-lg:pt-5 md:max-lg:pb-4"
        )}>
          <img
            src="/logo-mundial-2026.svg"
            alt="Prodeazo"
            className={clsx(
              "w-[90px] h-[100px] object-contain shrink-0",
              !sidebarOpen && "md:max-lg:w-10 md:max-lg:h-11"
            )}
          />
          <span className={clsx(
            "flex flex-col items-center leading-none select-none whitespace-nowrap",
            !sidebarOpen && "md:max-lg:hidden"
          )}>
            <span className="font-display text-xl font-bold tracking-[-0.04em] uppercase text-white">
              Prodeazo
            </span>
            <span className="font-display text-[0.7rem] font-bold tracking-[-0.02em] uppercase text-[#00CE17] mt-0.5">
              FIFA 2026™
            </span>
          </span>
        </div>

        {/* Main navigation */}
        <nav className={clsx(
          "flex flex-col gap-0.5 px-3 py-2 flex-1",
          !sidebarOpen && "md:max-lg:px-2 md:max-lg:items-center"
        )}>
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-[14px] py-[10px] rounded-[10px] text-[0.9rem] font-medium text-white/60 no-underline transition-all duration-200 ease-in-out relative whitespace-nowrap overflow-hidden",
                  "hover:text-white/90 hover:bg-white/[0.04]",
                  // Tablet: icon-only square
                  !sidebarOpen && "md:max-lg:justify-center md:max-lg:p-3 md:max-lg:gap-0 md:max-lg:w-10 md:max-lg:h-10",
                  isActive && [
                    "text-primary bg-primary/[0.08] font-semibold nav-link-active-indicator",
                    // Hide left bar indicator on tablet
                    !sidebarOpen && "md:max-lg:before:hidden",
                  ]
                )}
                title={label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={clsx("transition-opacity duration-200", !sidebarOpen && "md:max-lg:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={clsx(
          "px-3 pt-3 pb-5 flex flex-col gap-0.5 overflow-hidden",
          !sidebarOpen && "md:max-lg:px-2 md:max-lg:pb-4 md:max-lg:items-center"
        )}>
          <Link
            href="/settings"
            className={clsx(
              "flex items-center gap-3 px-[14px] py-[10px] rounded-[10px] text-[0.9rem] font-medium text-white/60 no-underline transition-all duration-200 ease-in-out relative whitespace-nowrap overflow-hidden",
              "hover:text-white/90 hover:bg-white/[0.04]",
              !sidebarOpen && "md:max-lg:justify-center md:max-lg:p-3 md:max-lg:gap-0 md:max-lg:w-10 md:max-lg:h-10",
              pathname === "/settings" && [
                "text-primary bg-primary/[0.08] font-semibold nav-link-active-indicator",
                !sidebarOpen && "md:max-lg:before:hidden",
              ]
            )}
            title="Configuración"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className={clsx("transition-opacity duration-200", !sidebarOpen && "md:max-lg:hidden")}>Configuración</span>
          </Link>

          <div className={clsx("px-[14px] pt-3 flex flex-col gap-1 transition-opacity duration-200", !sidebarOpen && "md:max-lg:hidden")}>
            <span className="text-[0.72rem] text-white/20 whitespace-nowrap cursor-default select-none">
              Términos y Condiciones
            </span>
            <span className="text-[0.72rem] text-white/20 whitespace-nowrap cursor-default select-none">
              Política de Privacidad
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
