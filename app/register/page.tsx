import Link from "next/link"
import { PLANS } from "@/lib/pricing-data"
import { PlanBanner } from "@/components/register/plan-banner"
import { StepIndicator } from "@/components/register/step-indicator"
import { RegisterForm } from "@/components/register/register-form"
import { FeatureShowcase } from "@/components/register/feature-showcase"

type SearchParams = Promise<{ plan?: string }>

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const planId = (params.plan ?? "pro").toLowerCase()
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1]

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-accent/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT — Form */}
        <section className="flex flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* Brand */}
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="absolute inset-0 rounded-lg bg-primary/40 blur-md" aria-hidden />
              <span className="relative text-sm font-black text-primary-foreground">L</span>
            </span>
            LakaRent
          </Link>

          <PlanBanner plan={plan} />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
              Créez votre compte agence
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Configurez votre espace LakaRent en quelques minutes et gérez votre
              flotte dès aujourd&apos;hui.
            </p>
          </div>

          <StepIndicator current={1} />

          <div className="relative">
            <div
              className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-60 blur-sm"
              aria-hidden
            />
            <div className="relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl sm:p-8">
              <RegisterForm plan={plan.id} />
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            En continuant, vos données sont protégées et hébergées au Maroc.
          </p>
        </section>

        {/* RIGHT — Showcase */}
        <aside className="relative hidden border-l border-border/60 bg-gradient-to-br from-card/20 via-background to-background lg:block">
          <FeatureShowcase plan={plan} />
        </aside>
      </div>
    </main>
  )
}
