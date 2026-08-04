"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { Clock, ImageIcon, Lock, MessageCircle, Shield, Sparkles, Upload, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useOnboarding } from "./onboarding-context"

export function StepSettings({ plan }: { plan: string }) {
  const { state, setSettings } = useOnboarding()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const isStarter = plan.toLowerCase() === "starter"

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setSettings({ ...state.settings, logo: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Paramètres de base
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Finalisez la configuration de votre agence. Tout reste modifiable depuis les paramètres.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Devise */}
        <SettingCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Devise"
          description="Devise utilisée pour les transactions"
        >
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                DH
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">MAD</span>
                <span className="text-[11px] text-muted-foreground">Dirham marocain</span>
              </div>
            </div>
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </SettingCard>

        {/* Caution */}
        <SettingCard
          icon={<Shield className="h-4 w-4" />}
          title="Caution par défaut"
          description="Montant standard demandé aux clients"
        >
          <div className="relative">
            <Input
              type="number"
              value={state.settings.caution}
              onChange={(e) => setSettings({ ...state.settings, caution: e.target.value })}
              className="h-11 border-white/10 bg-background/60 pr-12 text-base font-medium"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              DH
            </span>
          </div>
        </SettingCard>

        {/* Durée min */}
        <SettingCard
          icon={<Clock className="h-4 w-4" />}
          title="Durée minimum de location"
          description="Nombre de jours minimum par réservation"
        >
          <div className="relative">
            <Input
              type="number"
              min={1}
              value={state.settings.dureeMin}
              onChange={(e) => setSettings({ ...state.settings, dureeMin: e.target.value })}
              className="h-11 border-white/10 bg-background/60 pr-16 text-base font-medium"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              jour(s)
            </span>
          </div>
        </SettingCard>

        {/* WhatsApp */}
        <SettingCard
          icon={<MessageCircle className="h-4 w-4" />}
          title="Notifications WhatsApp"
          description="Avis automatiques aux clients"
          headerSlot={
            isStarter ? (
              <Badge
                variant="outline"
                className="border-amber-400/30 bg-amber-400/10 text-[10px] font-medium uppercase tracking-wider text-amber-300"
              >
                Plan PRO
              </Badge>
            ) : null
          }
        >
          <div
            className={`flex items-center justify-between rounded-lg border border-white/10 bg-background/60 px-3.5 py-3 ${
              isStarter ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">
                {state.settings.whatsapp && !isStarter ? "Activé" : "Désactivé"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isStarter
                  ? "Disponible avec le plan PRO"
                  : "Envoi automatique des confirmations"}
              </span>
            </div>
            <Switch
              disabled={isStarter}
              checked={state.settings.whatsapp && !isStarter}
              onCheckedChange={(v) => setSettings({ ...state.settings, whatsapp: v })}
            />
          </div>
        </SettingCard>
      </div>

      {/* Logo upload */}
      <SettingCard
        icon={<ImageIcon className="h-4 w-4" />}
        title="Logo de l&apos;agence"
        description="Optionnel · Affiché sur vos contrats et factures"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {state.settings.logo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex items-center gap-4 rounded-xl border border-white/10 bg-background/60 p-4"
          >
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.settings.logo || "/placeholder.svg"}
                alt="Logo de l'agence"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Logo téléversé</p>
              <p className="text-xs text-muted-foreground">
                Cliquez pour changer ou retirez l&apos;image actuelle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...state.settings, logo: null })}
              className="rounded-full border border-white/10 bg-background/60 p-1.5 text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
              aria-label="Retirer le logo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            className={`group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-background/40 px-6 py-10 text-center transition ${
              dragOver
                ? "border-primary/60 bg-primary/5"
                : "border-white/15 hover:border-primary/40 hover:bg-background/60"
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/60 text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Glissez-déposez votre logo ici
              </p>
              <p className="text-xs text-muted-foreground">
                ou cliquez pour parcourir · PNG, JPG, SVG · 2 Mo max
              </p>
            </div>
          </button>
        )}
      </SettingCard>
    </div>
  )
}

function SettingCard({
  icon,
  title,
  description,
  headerSlot,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  headerSlot?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur transition hover:border-white/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-background/60 text-muted-foreground">
            {icon}
          </div>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-foreground">{title}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {headerSlot}
      </div>
      {children}
    </div>
  )
}
