# UI/UX Improvements 2026

**Status:** draft  
**Date:** 2026-05-27  
**Author:** nicovon24

## Objetivo

Mejorar la experiencia de usuario del frontend: estados de carga, animaciones, navegación responsive, layout de viewport, migración CSS → Tailwind y traducción de países al español en la capa de datos.

## Contexto

El frontend funciona pero tiene UX incompleta. Las mejoras son incrementales y se pueden ejecutar en paralelo en varios ejes. El backend usa Bzzoiro BSD como data provider, que no soporta parámetro de idioma — los nombres de países llegan siempre en inglés.

**Estado actual relevante:**
- Framer Motion v12 instalado y en uso parcial (`predictions/page.tsx`)
- HeroUI instalado pero subutilizado
- Layout con `marginLeft: 220` hardcodeado, sin responsive
- Sidebar sin hamburguesa ni breakpoints
- Sin Zustand store de UI
- Sin skeletons — solo strings "Cargando…"
- Campo `country` en `ProviderTeam` / `ProviderLeague` en inglés

---

## Tareas

### T1 — Skeleton Screens con Framer Motion

**Prioridad:** alta  
**Dependencias:** ninguna

Reemplazar todos los "Cargando…" / "—" con skeletons animados usando Framer Motion (no NextUI Skeleton).

**Archivos a crear:**
- `frontend/src/components/ui/Skeleton.tsx` — componente base con `motion.div`, `animate={{ opacity: [0.4, 0.8, 0.4] }}`
- `frontend/src/components/skeletons/StatsCardSkeleton.tsx`
- `frontend/src/components/skeletons/FixtureRowSkeleton.tsx`
- `frontend/src/components/skeletons/RankingRowSkeleton.tsx`
- `frontend/src/components/skeletons/MatchPanelSkeleton.tsx`

**Archivos a modificar:**
- `frontend/src/app/(main)/home/page.tsx` — reemplazar `loadingStats` ternario
- `frontend/src/app/(main)/fixture/page.tsx` — 8 `<FixtureRowSkeleton />`
- `frontend/src/app/(main)/rankings/page.tsx` — 10 `<RankingRowSkeleton />`

**Criterios de aceptación:**
- [ ] Sin "Cargando…" visible durante carga inicial
- [ ] Skeleton respeta dimensiones reales del layout
- [ ] Animación suave (sin parpadeo brusco)

---

### T2 — Animaciones con Framer Motion

**Prioridad:** media  
**Dependencias:** T1

Añadir micro-animaciones de entrada y transiciones de página.

**Archivos a crear:**
- `frontend/src/lib/animations.ts` — variantes `fadeInUp`, `staggerContainer`, `scaleIn`
- `frontend/src/components/ui/PageTransition.tsx` — wrapper con `motion.div`

**Archivos a modificar:**
- `frontend/src/app/(main)/layout.tsx` — agregar `AnimatePresence` wrapping `{children}`
- `frontend/src/app/globals.css` — agregar `prefers-reduced-motion` rule

**Aplicar en:**
- Cards de stats → `scaleIn` con stagger
- Rows de fixture/ranking → `fadeInUp` con stagger
- Modales de predicción → `scaleIn`

**Criterios de aceptación:**
- [ ] Cards de home animan en cascada
- [ ] Transición de página ≤ 300ms
- [ ] `prefers-reduced-motion` desactiva animaciones
- [ ] Sin layout shift

---

### T3 — Sidebar Hamburguesa en Mobile

**Prioridad:** alta  
**Dependencias:** ninguna

Tres breakpoints: mobile drawer, tablet collapsed (solo íconos), desktop full.

**Archivos a crear:**
- `frontend/src/store/useUIStore.ts` — Zustand store con `sidebarOpen`, `toggleSidebar`, `closeSidebar`

**Archivos a modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — leer `useUIStore`, lógica de 3 breakpoints
- `frontend/src/components/layout/Header.tsx` — botón hamburger visible en `< 1024px`
- `frontend/src/app/(main)/layout.tsx` — remover `marginLeft: 220`, usar `--sidebar-width` CSS var

**Comportamiento:**
- Mobile `< 768px`: drawer fijo con overlay, cierra al hacer click fuera y al navegar
- Tablet `768px–1023px`: sidebar de 64px solo con íconos
- Desktop `≥ 1024px`: sidebar completo de 220px (comportamiento actual)

**Criterios de aceptación:**
- [ ] Drawer mobile funciona con overlay
- [ ] Tablet muestra solo íconos
- [ ] Desktop sin cambios
- [ ] Sin flash de layout al cambiar breakpoint
- [ ] Estado se resetea al navegar

---

### T4 — Layout Full Viewport

**Prioridad:** media  
**Dependencias:** T3

En desktop: body sin scroll, solo el área de contenido hace scroll.

**Archivos a modificar:**
- `frontend/src/app/globals.css` — `html, body { height: 100%; overflow: hidden; }` (solo desktop)
- `frontend/src/app/(main)/layout.tsx` — `height: 100vh; overflow: hidden` + div contenido con `flex: 1; overflow-y: auto`

**Aplicar overflow-y: auto en:** `home/page.tsx`, `fixture/page.tsx`, `rankings/page.tsx`  
**NO aplicar en:** `predictions/page.tsx`, `leagues/[id]/page.tsx`, `rules/page.tsx`

**Criterios de aceptación:**
- [ ] Desktop: sidebar y header fijos, solo contenido hace scroll
- [ ] Mobile: body sigue haciendo scroll normalmente
- [ ] Sin doble scrollbar

---

### T5 — Migración CSS Modules → Tailwind v4

**Prioridad:** alta  
**Dependencias:** T3

Eliminar todos los `.module.css` y reescribir en Tailwind. Los tokens ya están en `globals.css` como CSS vars y Tailwind v4 los expone como clases (`text-primary`, `bg-secondary`).

**Archivos a migrar:**

| CSS Module | Componente |
|-----------|-----------|
| `Sidebar.module.css` | `Sidebar.tsx` |
| `Header.module.css` | `Header.tsx` |
| `home.module.css` | `home/page.tsx` |
| `predictions.module.css` | `predictions/page.tsx` |
| `leagues.module.css` | `leagues/page.tsx` |
| `leagues/[id]/league.module.css` | `leagues/[id]/page.tsx` |
| `rankings.module.css` | `rankings/page.tsx` |

Estilos sin equivalente Tailwind (animaciones custom, pseudo-selectores): mover a `globals.css` con `@layer utilities`.  
Usar `clsx` (ya instalado) para clases condicionales.

**Criterios de aceptación:**
- [ ] Cero archivos `.module.css`
- [ ] Diseño visual idéntico
- [ ] Sin imports de `*.module.css`

---

### T6 — Responsiveness Mobile Completo

**Prioridad:** alta  
**Dependencias:** T3, T5

**Por vista:**
- **Home**: grid 4 col → 2 tablet → 1 mobile; tournament bar scroll horizontal
- **Fixture**: layout vertical en mobile, filtros como dropdown
- **Rankings**: sticky primera columna; mobile solo rank + nombre + puntos
- **Leagues**: cards 1 col mobile, 2 tablet; tabla igual que rankings
- **Predictions**: cards full width; filtros dropdown
- **Header**: solo avatar + hamburger en mobile, sin título

**Criterios de aceptación:**
- [ ] Sin scroll horizontal involuntario a 375px
- [ ] Textos ≥ 14px en mobile
- [ ] Área táctil ≥ 44x44px en botones
- [ ] Tablas con scroll horizontal controlado
- [ ] Probado a 375px, 768px, 1024px, 1440px

---

### T7 — Internacionalización de Países (Backend)

**Prioridad:** alta  
**Dependencias:** ninguna

El campo `country` en `ProviderTeam` y `ProviderLeague` llega en inglés desde Bzzoiro. El mapeo vive en la capa de normalización del provider. **Los nombres de equipos no se traducen.**

**Archivos a crear:**

`backend/src/providers/i18n/countries.ts`:
```ts
export const COUNTRY_NAMES_ES: Record<string, string> = {
  // ~195 países del mundo
}
export function translateCountryName(name: string | null | undefined): string | null {
  if (!name) return null
  return COUNTRY_NAMES_ES[name.trim()] ?? name
}
```

**Archivos a modificar:**

`backend/src/providers/bzzoiro.ts` — tres puntos de aplicación:
- `normalizeTeam()` (~línea 168): campo `country`
- `normalizeLeague()` (~línea 154): campo `country`
- `normalizeEventSideParticipant()` (~línea 206): `countryFromObj` al armar el resolved team

**Criterios de aceptación:**
- [ ] `GET /api/fixtures` → `homeTeam.country` en español
- [ ] Fallback al original si no está mapeado (`?? name`)
- [ ] Mapeo cubre ~195 países
- [ ] Sin cambios en el frontend

---

## Orden de Ejecución

```
T1 (Skeletons)    ──┐
T3 (Sidebar)      ──┤─→ T5 (CSS→Tailwind) ──→ T6 (Responsive) ──→ T4 (Viewport) ──→ T2 (Animaciones)
T7 (i18n países)  ──┘
```

T1, T3 y T7 son paralelas. T5 después de T3. T6 después de T5. T4 después de T3. T2 al final.

---

## Git Workflow

**No commitear ni pushear hasta que el usuario confirme que testeó los cambios.** Al terminar cada tarea, reportar qué se modificó y esperar aprobación explícita antes de cualquier `git commit` o `git push`.

---

## Verificación Final

- [ ] `pnpm --filter frontend build` sin errores TypeScript
- [ ] `pnpm --filter backend build` sin errores TypeScript
- [ ] Probar en 375px, 768px, 1024px, 1440px
- [ ] Skeletons aparecen y desaparecen con carga real de API
- [ ] `prefers-reduced-motion` desactiva animaciones
- [ ] `GET /api/fixtures` → `homeTeam.country` en español
- [ ] Sin scroll doble en desktop en home, fixture y rankings
