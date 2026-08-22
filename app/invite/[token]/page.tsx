import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { InviteAcceptanceClient, type InviteViewModel } from "./invite-acceptance-client";
import fr from "@/translations/fr";
import { getCurrentSession } from "@/shared/auth";
import { getPublicInvitationService } from "@/modules";
import { InviteInfoPanel } from "@/components/invite/invite-info-panel";

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

  if (!invitation) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-xl shadow-black/5">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <ShieldCheck className="h-5.5 w-5.5" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{labels.states.invalidTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{labels.states.invalidDescription}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            {labels.actions.goToLogin}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[45fr_55fr]">
      <div className="order-2 lg:order-1">
        <InviteInfoPanel />
      </div>

      <div className="order-1 flex items-center justify-center px-4 py-10 sm:px-8 lg:order-2 lg:px-16 lg:py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
              <ShieldCheck className="h-4.5 w-4.5 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Loka<span className="text-muted-foreground">Rent</span>
            </span>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl shadow-black/5 sm:p-10">
            <InviteAcceptanceClient token={token} invitation={invitation} labels={labels} />
          </div>
        </div>
      </div>
    </main>
  );
}
