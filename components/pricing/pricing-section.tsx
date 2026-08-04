'use client'

import { useState } from 'react'
import { BillingToggle } from './billing-toggle'
import { PricingCard } from './pricing-card'
import { PLANS, type BillingCycle } from '@/lib/pricing-data'

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  return (
    <section className="relative px-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex justify-center">
          <BillingToggle value={cycle} onChange={setCycle} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-7">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} cycle={cycle} index={i} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Tous les prix sont en dirhams marocains (DH) et hors TVA. Sans engagement,
          résiliable à tout moment.
        </p>
      </div>
    </section>
  )
}
