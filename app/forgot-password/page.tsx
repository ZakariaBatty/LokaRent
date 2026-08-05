import { ForgotPasswordForm } from "@/components/forgot-password/forgot-password-form"
import { redirectAuthenticatedUser } from "@/shared/auth"

export default async function ForgotPasswordPage() {
  await redirectAuthenticatedUser()

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background mesh + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,theme(colors.accent/0.15),transparent_55%),radial-gradient(ellipse_at_bottom_left,theme(colors.primary/0.10),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/0.25)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/0.25)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      {/* Blurred orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl animate-[pulse_8s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-accent/20 blur-3xl animate-[pulse_10s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      {/* Top fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
      />

      <ForgotPasswordForm />
    </main>
  )
}
