"use client"
import { motion } from "framer-motion"
import clsx from "clsx"

interface SkeletonProps {
  className?: string
  rounded?: boolean
}

export function Skeleton({ className, rounded = false }: SkeletonProps) {
  return (
    <motion.div
      className={clsx(
        "bg-white/10",
        rounded ? "rounded-full" : "rounded-lg",
        className
      )}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}
