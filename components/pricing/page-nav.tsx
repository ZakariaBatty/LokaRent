import Link from 'next/link'
import { Car } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass-strong flex items-center justify-between rounded-full border border-border/60 px-4 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]">
          <Link href="/" className="flex items-center gap-2 px-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-3">
              <Car className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight">LokaRent</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link
              href="/#features"
              className="transition-colors hover:text-foreground"
            >
              Fonctionnalités
            </Link>
            <Link
              href="/pricing"
              className="font-medium text-foreground transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/#contact"
              className="transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-primary to-chart-3 text-primary-foreground"
            >
              <Link href="/register">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
