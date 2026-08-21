import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Car, ShieldCheck } from "lucide-react";
import { getCurrentSession } from "@/shared/auth";
import { getPublicInvitationService } from "@/modules/workspace/invitations/services/invitations.service";
import fr from "@/translations/fr";
import { InviteAcceptanceClient, type InviteViewModel } from "./invite-acceptance-client";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Invitation — LokaRent",
  description: "Acceptez votre invitation LokaRent.",
};

function roleName(name: string) {
  return fr.workspace.invitations.roles[name as keyof typeof fr.workspace.invitations.roles] ?? name;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const labels = fr.invite;
  const current = await getCurrentSession().catch(() => null);

  let invitation: InviteViewModel | null = null;
  try {
    const context = await getPublicInvitationService(token);
    invitation = {
      email: context.email,
      companyName: context.companyName,
      agencyName: context.agencyName,
      roleName: roleName(context.roleName),
      expiresAt: formatDate(context.expiresAt),
      status: context.status,
      userExists: context.userExists,
      authenticatedEmail: current?.authUser.email ?? null,
    };
  } catch {
    invitation = null;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(79,109,255,0.12),transparent_44%),radial-gradient(circle_at_76%_72%,rgba(56,189,248,0.10),transparent_48%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <section className="relative w-full max-w-md">
        <div className="mb-7 flex items-center justify-center">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Car className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              Loka<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Rent</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-7">
          {invitation ? (
            <InviteAcceptanceClient token={token} invitation={invitation} labels={labels} />
          ) : (
            <StatePanel
              icon={<ShieldCheck className="h-5 w-5" />}
              title={labels.states.invalidTitle}
              description={labels.states.invalidDescription}
              actionLabel={labels.actions.goToLogin}
              actionHref="/login"
            />
          )}
        </div>
      </section>
    </main>
  );
}

function StatePanel({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
        {icon}
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
