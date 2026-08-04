import type { Metadata } from 'next'
import { PageNav } from '@/components/pricing/page-nav'
import { HeroSection } from '@/components/pricing/hero-section'
import { PricingSection } from '@/components/pricing/pricing-section'
import { FaqSection } from '@/components/pricing/faq-section'
import { BottomCta } from '@/components/pricing/bottom-cta'

export const metadata: Metadata = {
  title: 'Tarifs — LokaRent',
  description:
    "Découvrez les tarifs LokaRent : Starter, Pro et Business. Une solution SaaS moderne pour gérer votre agence de location de voitures au Maroc.",
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <PageNav />
      <HeroSection />
      <PricingSection />
      <FaqSection />
      <BottomCta />
    </main>
  )
}
