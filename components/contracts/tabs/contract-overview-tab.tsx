"use client"

import { motion } from "motion/react"
import {
  User,
  Car as CarIcon,
  Calendar,
  MapPin,
  Wallet,
  Phone,
  IdCard,
  CreditCard,
  FileSignature,
  UserPlus,
} from "lucide-react"
import { type Contract, formatMAD, formatDate, statusConfig, remainingBalance, totalPaid } from "@/lib/contracts-data"

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  tone = "indigo",
  children,
}: {
  icon: typeof User
  title: string
  tone?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "blue"
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
  }
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  )
}

export function ContractOverviewTab({ contract }: { contract: Contract }) {
  const cfg = statusConfig[contract.status]
  const optionsTotal = contract.pricing.options.reduce((acc, o) => acc + o.amount, 0)
  const paid = totalPaid(contract)
  const remaining = remainingBalance(contract)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 lg:grid-cols-2"
    >
      {/* Client */}
      <Section icon={User} title="Client" tone="indigo">
        <InfoRow icon={User} label="Nom complet" value={contract.client.fullName} />
        <InfoRow icon={Phone} label="Téléphone" value={contract.client.phone} />
        <InfoRow icon={IdCard} label="CIN (masqué)" value={contract.client.cinMasked} />
        <InfoRow icon={CreditCard} label="Permis de conduire" value={contract.client.permis} />
      </Section>

      {/* Véhicule */}
      <Section icon={CarIcon} title="Véhicule" tone="blue">
        <InfoRow
          icon={CarIcon}
          label="Marque & modèle"
          value={`${contract.car.brand} ${contract.car.model}`}
        />
        <InfoRow
          icon={IdCard}
          label="Immatriculation"
          value={
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[12px] font-bold tracking-wider text-slate-700">
              {contract.car.plate}
            </span>
          }
        />
        <InfoRow icon={CarIcon} label="Catégorie" value={contract.car.category} />
      </Section>

      {/* Période */}
      <Section icon={Calendar} title="Période de location" tone="emerald">
        <InfoRow icon={Calendar} label="Départ" value={formatDate(contract.period.start)} />
        <InfoRow icon={Calendar} label="Retour" value={formatDate(contract.period.end)} />
        <InfoRow icon={Calendar} label="Durée" value={`${contract.period.days} jour(s)`} />
        <InfoRow icon={MapPin} label="Lieu de départ" value={contract.locations.pickup} />
        <InfoRow icon={MapPin} label="Lieu de retour" value={contract.locations.dropoff} />
      </Section>

      {/* Tarification */}
      <Section icon={Wallet} title="Tarification" tone="violet">
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Prix journalier</span>
            <span className="font-medium text-slate-700">
              {formatMAD(contract.pricing.pricePerDay)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Sous-total ({contract.period.days} × {formatMAD(contract.pricing.pricePerDay)})
            </span>
            <span className="font-medium text-slate-700">
              {formatMAD(contract.pricing.pricePerDay * contract.period.days)}
            </span>
          </div>
          {contract.pricing.discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-rose-500">Remise</span>
              <span className="font-medium text-rose-600">
                -{formatMAD(contract.pricing.discount)}
              </span>
            </div>
          )}
          {optionsTotal > 0 && (
            <div className="space-y-0.5">
              {contract.pricing.options.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{o.label}</span>
                  <span className="font-medium text-slate-700">+{formatMAD(o.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {formatMAD(contract.pricing.total)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Caution ({contract.caution.type})</span>
            <span className="font-medium text-amber-700">
              {formatMAD(contract.caution.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Montant payé</span>
            <span className="font-medium text-emerald-700">{formatMAD(paid)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Reste à percevoir</span>
            <span className={`font-semibold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatMAD(remaining)}
            </span>
          </div>
        </div>
      </Section>

      {/* Conducteur additionnel */}
      {contract.additionalDriver && (
        <Section icon={UserPlus} title="Conducteur additionnel" tone="amber">
          <InfoRow icon={User} label="Nom complet" value={contract.additionalDriver.fullName} />
          <InfoRow icon={IdCard} label="CIN (masqué)" value={contract.additionalDriver.cinMasked} />
          <InfoRow icon={CreditCard} label="Permis" value={contract.additionalDriver.permis} />
        </Section>
      )}

      {/* Statut & signatures */}
      <div className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ${contract.additionalDriver ? "" : "lg:col-span-2"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200">
              <FileSignature className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Statut & signatures</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.pillBg} ${cfg.pillText}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div
            className={`rounded-xl border p-3 ${contract.signedByClient
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Signature client
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${contract.signedByClient ? "text-emerald-700" : "text-slate-400"
                }`}
            >
              {contract.signedByClient ? "Signé" : "En attente"}
            </div>
          </div>
          <div
            className={`rounded-xl border p-3 ${contract.signedByAgency
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-slate-200 bg-slate-50"
              }`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Signature agence
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${contract.signedByAgency ? "text-emerald-700" : "text-slate-400"
                }`}
            >
              {contract.signedByAgency ? "Signé" : "En attente"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Référence
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">
              {contract.code}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}