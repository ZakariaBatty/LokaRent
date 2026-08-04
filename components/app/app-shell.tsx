"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { useSidebar } from "./sidebar-context"

export function AppShell({ children, header }: { children: ReactNode; header: ReactNode }) {
  const { width } = useSidebar()

  return (
    <div
      style={
        {
          "--sidebar-w": `${width}px`,
          transition: "padding-left 380ms cubic-bezier(0.32, 0.72, 0, 1)",
        } as React.CSSProperties
      }
      className="pl-0 lg:pl-[var(--sidebar-w)]"
    >
      {header}
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-5 py-7 md:px-8 lg:px-10 lg:py-9 xl:px-12"
      >
        {children}
      </motion.main>
    </div>
  )
}
