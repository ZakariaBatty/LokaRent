'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

type Props = {
  value: number
  className?: string
}

export function AnimatedPrice({ value, className }: Props) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 120, damping: 22 })
  const rounded = useTransform(spring, (v) => Math.round(v).toString())
  const [display, setDisplay] = useState(value.toString())
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      setDisplay(value.toString())
      mv.set(value)
      return
    }
    mv.set(value)
  }, [value, mv])

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return () => unsub()
  }, [rounded])

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.6, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
    >
      {display}
    </motion.span>
  )
}
