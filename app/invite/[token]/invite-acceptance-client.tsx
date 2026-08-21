"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Building2, CheckCircle2, Loader2, Lock, Mail, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  acceptInvitationForCurrentSessionAction,
  createInvitedAccountAction,
  signInAndAcceptInvitationAction,
} from "@/modules/workspace/invitations/actions/accept-invitation.action";

type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
type Labels = typeof import("@/translations/fr").default.invite;

export type InviteViewModel = {
  email: string;
  companyName: string;
  agencyName: string | null;
  roleName: string;
  expiresAt: string;
  status: InvitationStatus;
  userExists: boolean;
  authenticatedEmail: string | null;
};

function messageForKey(key: string, labels: Labels) {
  const shortKey = key.split(".").at(-1);
  return labels.messages[shortKey as keyof typeof labels.messages] ?? labels.messages.generic;
}

export function InviteAcceptanceClient({
  token,
  invitation,
  labels,
}: {
  token: string;
  invitation: InviteViewModel;
  labels: Labels;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const authenticatedEmail = invitation.authenticatedEmail?.trim().toLowerCase() ?? null;
  const invitedEmail = invitation.email.trim().toLowerCase();
  const isWrongSession = Boolean(authenticatedEmail && authenticatedEmail !== invitedEmail);

  const finish = (result: Awaited<ReturnType<typeof createInvitedAccountAction>>) => {
    if (!result.success) {
      setError(messageForKey(result.message, labels));
      return;
    }
    router.push(result.redirectTo);
    router.refresh();
  };

  const createAccount = () => {
    setError(null);
    startTransition(async () => {
      finish(await createInvitedAccountAction({ token, fullName, password, confirmPassword }));
    });
  };

  const signIn = () => {
    setError(null);
    startTransition(async () => {
      finish(await signInAndAcceptInvitationAction({ token, email: invitation.email, password, rememberMe }));
    });
  };

  const acceptCurrent = () => {
    setError(null);
    startTransition(async () => {
      finish(await acceptInvitationForCurrentSessionAction({ token }));
    });
  };

  if (invitation.status !== "pending") {
    const stateCopy = {
      accepted: {
        title: labels.states.acceptedTitle,
        description: labels.states.acceptedDescription,
      },
      expired: {
        title: labels.states.expiredTitle,
        description: labels.states.expiredDescription,
      },
      revoked: {
        title: labels.states.revokedTitle,
        description: labels.states.revokedDescription,
      },
    }[invitation.status];
    return (
      <StatePanel
        title={stateCopy.title}
        description={stateCopy.description}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
          <Mail className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{labels.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{labels.description}</p>
      </div>

      <div className="mt-6 space-y-2 rounded-xl border border-border/70 bg-background/60 p-4">
        <ContextRow icon={Building2} label={labels.context.company} value={invitation.companyName} />
        {invitation.agencyName && <ContextRow icon={Building2} label={labels.context.agency} value={invitation.agencyName} />}
        <ContextRow icon={UserRound} label={labels.context.role} value={invitation.roleName} />
        <ContextRow icon={Mail} label={labels.context.email} value={invitation.email} />
        <ContextRow icon={Lock} label={labels.context.expires} value={invitation.expiresAt} />
      </div>

      {isWrongSession ? (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm leading-relaxed text-rose-700">
          {labels.messages.emailMismatch}
        </div>
      ) : invitation.authenticatedEmail ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-relaxed text-emerald-700">
            {labels.existing.signedIn}
          </p>
          <SubmitButton pending={pending} label={labels.actions.accept} pendingLabel={labels.actions.accepting} onClick={acceptCurrent} />
        </div>
      ) : invitation.userExists ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold text-foreground">{labels.existing.title}</p>
          <Field label={labels.fields.email}>
            <input readOnly value={invitation.email} className={inputClassName("bg-muted/40 text-muted-foreground")} />
          </Field>
          <Field label={labels.fields.password}>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClassName()} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-border" />
            {labels.fields.rememberMe}
          </label>
          <SubmitButton pending={pending} label={labels.actions.signInAccept} pendingLabel={labels.actions.accepting} onClick={signIn} disabled={!password} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold text-foreground">{labels.newUser.title}</p>
          <Field label={labels.fields.fullName}>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClassName()} />
          </Field>
          <Field label={labels.fields.email}>
            <input readOnly value={invitation.email} className={inputClassName("bg-muted/40 text-muted-foreground")} />
          </Field>
          <Field label={labels.fields.password}>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClassName()} />
          </Field>
          <Field label={labels.fields.confirmPassword}>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClassName()} />
          </Field>
          <SubmitButton
            pending={pending}
            label={labels.actions.createAccept}
            pendingLabel={labels.actions.accepting}
            onClick={createAccount}
            disabled={!fullName || !password || !confirmPassword}
          />
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function ContextRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function inputClassName(extra?: string) {
  return cn(
    "h-11 w-full rounded-xl border border-border/70 bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-background",
    extra,
  );
}

function SubmitButton({
  pending,
  label,
  pendingLabel,
  onClick,
  disabled,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      disabled={pending || disabled}
      onClick={onClick}
      className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-accent text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {label}
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Button>
  );
}

function StatePanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <span className={cn("mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600")}>
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
