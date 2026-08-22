import Link from "next/link";
import { Building2, KeyRound, Mail, ShieldCheck, ShieldAlert, UserRoundPlus } from "lucide-react";

const steps = [
    {
        icon: Mail,
        title: "Invitation reçue",
        description: "Un administrateur de votre entreprise vous a envoyé un accès dédié.",
    },
    {
        icon: UserRoundPlus,
        title: "Créez votre compte",
        description: "Activez votre accès personnel en quelques secondes.",
    },
    {
        icon: Building2,
        title: "Rejoignez l'espace de travail",
        description: "Accédez immédiatement aux outils de votre entreprise.",
    },
];

const trustPoints = [
    { icon: ShieldCheck, label: "Activation de compte sécurisée" },
    { icon: KeyRound, label: "Accès contrôlé par l'entreprise" },
    { icon: Building2, label: "Espace de travail basé sur les permissions" },
];

export function InviteInfoPanel() {
    return (
        <div className="relative flex min-h-full flex-col overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
            </div>

            <div className="relative flex flex-1 flex-col">
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
                        <ShieldCheck className="h-4.5 w-4.5 text-primary-foreground" />
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-foreground">
                        Loka<span className="text-muted-foreground">Rent</span>
                    </span>
                </Link>

                <div className="mt-14 max-w-md">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        Accès privé par invitation
                    </span>
                    <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-foreground text-balance sm:text-4xl">
                        Vous avez été invité(e) à un espace de travail privé
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        Cette page n&apos;est accessible que via une invitation valide envoyée par un administrateur LokaRent.
                    </p>
                </div>

                {/* Steps timeline */}
                <div className="mt-12 max-w-md">
                    <ol className="relative space-y-8">
                        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <li key={step.title} className="relative flex gap-4">
                                    <span className="relative z-10 grid h-10 w-10 flex-none place-items-center rounded-full border border-border bg-card shadow-sm">
                                        <Icon className="h-4.5 w-4.5 text-primary" />
                                    </span>
                                    <div className="pt-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            {index + 1}. {step.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* Security section */}
                <div className="mt-12 max-w-md rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Invitation sécurisée</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Chaque invitation est unique et associée à une entreprise spécifique. Votre accès héritera automatiquement
                        des permissions définies par votre administrateur.
                    </p>
                    <ul className="mt-4 space-y-2.5">
                        {trustPoints.map((point) => {
                            const Icon = point.icon;
                            return (
                                <li key={point.label} className="flex items-center gap-2.5 text-sm text-foreground/80">
                                    <Icon className="h-4 w-4 flex-none text-primary" />
                                    {point.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Warning card */}
                <div className="mt-8 max-w-md rounded-2xl border border-border/70 bg-secondary/40 p-5">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4.5 w-4.5 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">Vous n&apos;attendiez pas cette invitation ?</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Si vous n&apos;avez pas reçu d&apos;invitation d&apos;un administrateur d&apos;entreprise, il est
                        préférable de ne pas continuer sur cette page.
                    </p>
                    <Link
                        href="/login"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}
