'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { BILLING_OPTIONS, type BillingCycle } from '@/lib/pricing-data'

type Props = {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
}

export function BillingToggle({ value, onChange }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="tablist"
        aria-label="Cycle de facturation"
        className="glass-strong relative inline-flex items-center gap-1 rounded-full border border-border/60 p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]"
      >
        {BILLING_OPTIONS.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={cn(
                'relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 sm:px-5',
                active
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="billing-pill"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-chart-3 shadow-[0_0_24px_-4px_oklch(0.68_0.2_252/0.6)]"
                />
              )}
              <span className="relative">{opt.label}</span>
              {opt.badge && (
                <span
                  className={cn(
                    'relative rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-colors',
                    active
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : opt.id === 'annual'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-primary/15 text-primary',
                  )}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Économisez jusqu&apos;à 35 % avec la facturation annuelle
      </p>
    </div>
  )
}
