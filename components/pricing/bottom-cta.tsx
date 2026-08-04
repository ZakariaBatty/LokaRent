'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BottomCta() {
  return (
    <section className="relative px-6 pb-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/40 px-8 py-14 text-center sm:px-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[80%] -translate-x-1/2 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
          />

          <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Prêt à moderniser votre agence ?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            Démarrez gratuitement avec une démonstration personnalisée. Notre équipe
            vous accompagne pas à pas dans la mise en place.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="group bg-gradient-to-r from-primary to-chart-3 text-primary-foreground transition-shadow duration-300 hover:shadow-[0_0_30px_-4px_oklch(0.68_0.2_252/0.8)]"
            >
              <Link href="/register">
                Démarrer maintenant
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/80">
              <Link href="/contact">
                <MessageCircle className="size-4" />
                Parler à un conseiller
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
