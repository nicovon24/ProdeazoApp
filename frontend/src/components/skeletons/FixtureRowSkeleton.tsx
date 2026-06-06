"use client"
import { Skeleton } from "../ui/Skeleton"

/**
 * Skeleton for a single fixture row.
 * Layout mirrors the real row: time/phase | home team | VS | away team | score | prediction badge.
 */
export function FixtureRowSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 120px 100px",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Time + phase column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Teams column: home | VS | away */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        {/* Home team */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end", flex: 1 }}>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-7 h-7 shrink-0" rounded />
        </div>

        {/* VS */}
        <Skeleton className="h-4 w-6 shrink-0" />

        {/* Away team */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <Skeleton className="w-7 h-7 shrink-0" rounded />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Score column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Prediction badge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  )
}
