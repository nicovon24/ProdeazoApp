"use client"
import { motion } from "framer-motion"
import { pageTransition } from "@/lib/animations"

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col flex-1"
    >
      {children}
    </motion.div>
  )
}
