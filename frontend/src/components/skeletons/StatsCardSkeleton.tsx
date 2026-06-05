"use client"
import { Skeleton } from "../ui/Skeleton"

/**
 * Skeleton for the 3-card stats row on the home page.
 * Matches the approximate layout of each stat card:
 * header (icon + label), main value, sub-label, footer button.
 */
export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Header: icon + label */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Skeleton className="w-5 h-5 shrink-0" rounded />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Main value */}
          <Skeleton className="h-9 w-24 mt-1" />

          {/* Sub label */}
          <Skeleton className="h-3 w-40" />

          {/* Footer button */}
          <Skeleton className="h-8 w-28 mt-2" />
        </div>
      ))}
    </div>
  )
}
