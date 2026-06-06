"use client"
import { Skeleton } from "../ui/Skeleton"

/**
 * Skeleton for a single match panel (one of the three panels on the home page).
 * Layout: panel header + 3 match rows, each with team names and a score/status column.
 */
function MatchRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Home team name */}
      <Skeleton className="h-4 w-24" />

      {/* Score / time badge */}
      <Skeleton className="h-6 w-16 shrink-0" />

      {/* Away team name */}
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

export function MatchPanelSkeleton() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "1rem",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {/* Panel header: icon + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Skeleton className="w-5 h-5 shrink-0" rounded />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* 3 match rows */}
      <MatchRowSkeleton />
      <MatchRowSkeleton />
      <MatchRowSkeleton />
    </div>
  )
}
