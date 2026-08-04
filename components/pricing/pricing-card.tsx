'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AnimatedPrice } from './animated-price'
import {
  type BillingCycle,
  type Plan,
  getDiscountedMonthlyPrice,
  getCycleSavings,
} from '@/lib/pricing-data'

type Props = {
  plan: Plan
  cycle: BillingCycle
  index: number
}

export function PricingCard({ plan, cycle, index }: Props) {
  const displayPrice = getDiscountedMonthlyPrice(plan.monthlyPrice, cycle)
  const savings = getCycleSavings(plan.monthlyPrice, cycle)
  const hasDiscount = cycle !== 'monthly'
  const isPopular = plan.popular

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 * index }}
      className={cn(
        'relative flex',
        isPopular && 'lg:-mt-4 lg:mb-[-1rem]',
      )}
    >
      {/* Gradient border glow for Pro */}
      {isPopular && (
        <div
          aria-hidden
          className="absolute -inset-px rounded-[calc(var(--radius)+4px)] bg-gradient-to-b from-primary via-chart-3 to-accent opacity-70 blur-[2px]"
        />
      )}

      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden rounded-2xl border transition-all duration-500',
          'glass-strong',
          isPopular
            ? 'border-transparent shadow-[0_20px_60px_-20px_oklch(0.68_0.2_252/0.5)] hover:shadow-[0_30px_80px_-20px_oklch(0.68_0.2_252/0.7)]'
            : 'border-border/60 hover:border-border hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]',
          'hover:-translate-y-1',
        )}
      >
        {/* Subtle inner gradient highlight */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-px',
            isPopular
              ? 'bg-gradient-to-r from-transparent via-primary/80 to-transparent'
              : 'bg-gradient-to-r from-transparent via-border to-transparent',
          )}
        />

        {isPopular && (
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-gradient-to-b from-primary/25 via-primary/5 to-transparent blur-2xl"
          />
        )}

        <div className="relative flex flex-1 flex-col p-7 sm:p-8">
          {/* Badge row */}
          <div className="mb-6 flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide uppercase',
                isPopular
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border/60 bg-secondary/40 text-muted-foreground',
              )}
            >
              {isPopular && <Sparkles className="size-3" />}
              {plan.badge}
            </span>
            {isPopular && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary to-chart-3 px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_oklch(0.68_0.2_252/0.7)]">
                Recommandé
              </span>
            )}
          </div>

          {/* Plan name */}
          <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {plan.tagline}
          </p>

          {/* Price */}
          <div className="mt-7 mb-1 flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
              <AnimatedPrice value={displayPrice} />
            </span>
            <span className="text-sm font-medium text-muted-foreground">DH</span>
            <span className="text-sm text-muted-foreground">/ mois</span>
          </div>

          {/* Old price + savings */}
          <div className="flex min-h-[28px] flex-wrap items-center gap-2 text-xs">
            {hasDiscount ? (
              <>
                <span className="text-muted-foreground line-through">
                  {plan.monthlyPrice} DH
                </span>
                <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent">
                  Économie {savings} DH
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Facturation mensuelle</span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-7">
            <Button
              asChild
              size="lg"
              className={cn(
                'group relative w-full overflow-hidden font-medium transition-all duration-300',
                isPopular
                  ? 'bg-gradient-to-r from-primary to-chart-3 text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.68_0.2_252/0.8)]'
                  : 'bg-secondary text-foreground hover:bg-secondary/80',
              )}
            >
              <Link href={`/register?plan=${plan.id}`}>
                <span className="relative z-10">Commencer</span>
                <ArrowRight className="relative z-10 ml-1 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                {isPopular && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                )}
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="mt-8 flex-1">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inclus dans {plan.name}
            </div>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature.text}
                  className={cn(
                    'flex items-start gap-3 text-sm',
                    feature.included ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                      feature.included
                        ? isPopular
                          ? 'bg-primary/15 text-primary'
                          : 'bg-accent/15 text-accent'
                        : 'bg-muted text-muted-foreground/60',
                    )}
                  >
                    {feature.included ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : (
                      <X className="size-3" strokeWidth={3} />
                    )}
                  </span>
                  <span className="leading-relaxed">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
