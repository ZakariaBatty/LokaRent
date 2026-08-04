import Link from 'next/link'
import { ArrowRight, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-20%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-accent/20 blur-[140px]"
      />

      <div className="relative flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-3 shadow-[0_10px_40px_-10px_oklch(0.68_0.2_252/0.7)]">
          <Car className="size-7 text-primary-foreground" strokeWidth={2.5} />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient-brand">LokaRent</span>
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            La plateforme SaaS moderne pour gérer votre agence de location de voitures
            au Maroc. Flotte, réservations, clients et finances réunis dans un seul
            tableau de bord.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="group bg-gradient-to-r from-primary to-chart-3 text-primary-foreground transition-shadow duration-300 hover:shadow-[0_0_30px_-4px_oklch(0.68_0.2_252/0.8)]"
          >
            <Link href="/pricing">
              Voir les tarifs
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border/80">
            <Link href="/register">Démarrer un essai gratuit</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
