"use client"

import { motion } from "motion/react"
import { statusStyles, type UserStatus } from "@/lib/users-data"

export function StatusBadge({ status }: { status: UserStatus }) {
  const style = statusStyles[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style.badge}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {style.pulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${style.dot}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={`relative h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {status}
    </span>
  )
}
