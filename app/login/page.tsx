import type { Metadata } from "next"
import { LoginForm } from "@/components/login/login-form"
import { DashboardShowcase } from "@/components/login/dashboard-showcase"

export const metadata: Metadata = {
  title: "Connexion — LokaRent",
  description:
    "Connectez-vous à votre espace LokaRent et gérez votre flotte, vos réservations et vos clients depuis une seule plateforme.",
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Global ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,109,255,0.10),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.08),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left: form (45%) */}
        <section className="relative flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-[45%] lg:py-16">
          <LoginForm />
        </section>

        {/* Right: showcase (55%) */}
        <section className="relative w-full border-t border-border/40 bg-gradient-to-br from-card/40 via-background to-background lg:w-[55%] lg:border-l lg:border-t-0">
          <DashboardShowcase />
        </section>
      </div>
    </main>
  )
}
