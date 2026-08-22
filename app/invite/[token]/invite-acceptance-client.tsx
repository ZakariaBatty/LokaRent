"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Building2, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import fr from "@/translations/fr";
import {
  acceptInvitationForCurrentSessionAction,
  createInvitedAccountAction,
  signInAndAcceptInvitationAction,
} from "@/modules/workspace/invitations/actions/accept-invitation.action";



type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
type Labels = typeof fr.invite;

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
    return <StatePanel title={stateCopy.title} description={stateCopy.description} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Mail className="h-3.5 w-3.5" />
          {labels.context.email}: {invitation.email}
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          {labels.title}
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">{labels.description}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-5 sm:grid-cols-2">
        <ContextRow icon={Building2} label={labels.context.company} value={invitation.companyName} />
        {invitation.agencyName && <ContextRow icon={Building2} label={labels.context.agency} value={invitation.agencyName} />}
        <ContextRow icon={UserRound} label={labels.context.role} value={invitation.roleName} />
        <ContextRow icon={Lock} label={labels.context.expires} value={invitation.expiresAt} />
      </div>

      {isWrongSession ? (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-destructive">
          {labels.messages.emailMismatch}
        </div>
      ) : invitation.authenticatedEmail ? (
        <div className="mt-8 space-y-6">
          <p className="rounded-2xl border border-border/70 bg-secondary/30 px-5 py-4 text-sm leading-relaxed text-foreground/80">
            {labels.existing.signedIn}
          </p>
          <SubmitButton pending={pending} label={labels.actions.accept} pendingLabel={labels.actions.accepting} onClick={acceptCurrent} />
        </div>
      ) : invitation.userExists ? (
        <div className="mt-8 space-y-5">
          <p className="text-sm font-semibold text-foreground">{labels.existing.title}</p>
          <Field label={labels.fields.email} htmlFor="invite-email">
            <Input id="invite-email" readOnly value={invitation.email} className="h-12 rounded-xl bg-muted/40 text-muted-foreground" />
          </Field>
          <Field label={labels.fields.password} htmlFor="invite-password">
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl"
            />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
            {labels.fields.rememberMe}
          </label>
          <SubmitButton
            pending={pending}
            label={labels.actions.signInAccept}
            pendingLabel={labels.actions.accepting}
            onClick={signIn}
            disabled={!password}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-sm font-semibold text-foreground">{labels.newUser.title}</p>
          <Field label={labels.fields.fullName} htmlFor="invite-fullname">
            <Input
              id="invite-fullname"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-12 rounded-xl"
            />
          </Field>
          <Field label={labels.fields.email} htmlFor="invite-email-2">
            <Input id="invite-email-2" readOnly value={invitation.email} className="h-12 rounded-xl bg-muted/40 text-muted-foreground" />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={labels.fields.password} htmlFor="invite-password-2">
              <Input
                id="invite-password-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl"
              />
            </Field>
            <Field label={labels.fields.confirmPassword} htmlFor="invite-confirm-password">
              <Input
                id="invite-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 rounded-xl"
              />
            </Field>
          </div>
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
        <p className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">{error}</p>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 flex-none text-primary" />
        Votre compte et les informations de votre invitation sont protégés de manière sécurisée.
      </p>
    </motion.div>
  );
}

function ContextRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-card text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      {children}
    </div>
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
      className="h-13 w-full rounded-xl bg-gradient-to-r from-primary to-accent text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
          {pendingLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {label}
          <ArrowRight className="h-4.5 w-4.5" />
        </span>
      )}
    </Button>
  );
}

function StatePanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <CheckCircle2 className="h-5.5 w-5.5" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
