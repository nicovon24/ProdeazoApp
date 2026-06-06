"use client"
import { Skeleton } from "../ui/Skeleton"

/**
 * Skeleton for a single ranking table row.
 * Layout mirrors the real row: position | avatar + name | points.
 */
export function RankingRowSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr 80px",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Position */}
      <Skeleton className="h-5 w-8 mx-auto" />

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Skeleton className="w-9 h-9 shrink-0" rounded />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Points */}
      <Skeleton className="h-5 w-14 ml-auto" />
    </div>
  )
}
