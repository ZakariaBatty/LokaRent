"use client"

import { useEffect } from "react"
import { useMotionValue, useTransform, animate, motion } from "motion/react"

export function CountUp({
  value,
  duration = 1.2,
  format = (n: number) => Math.round(n).toLocaleString("fr-FR"),
}: {
  value: number
  duration?: number
  format?: (n: number) => string
}) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (latest) => format(latest))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" })
    return () => controls.stop()
  }, [value, duration, mv])

  return <motion.span>{rounded}</motion.span>
}
