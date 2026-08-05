"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/modules/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await resetPasswordAction({ token, password, confirmPassword });
    setLoading(false);
    if (!result.success) {
      setMessage(result.message ?? "Réinitialisation impossible.");
      return;
    }
    router.push(result.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">Choisissez un mot de passe sécurisé pour votre compte.</p>
      </div>
      <input
        type="password"
        required
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Nouveau mot de passe"
        className="rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
      />
      <input
        type="password"
        required
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirmer le mot de passe"
        className="rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
      />
      {message && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}
      <Button type="submit" disabled={loading} className="h-11">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Réinitialiser le mot de passe
      </Button>
    </form>
  );
}
