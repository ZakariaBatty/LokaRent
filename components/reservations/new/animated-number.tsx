"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedNumber({
  value,
  duration = 350,
  suffix = "",
}: {
  value: number
  duration?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    startRef.current = null

    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const v = from + (to - from) * eased
      setDisplay(v)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = Math.round(display).toLocaleString("fr-FR")
  return (
    <span>
      {formatted}
      {suffix}
    </span>
  )
}
