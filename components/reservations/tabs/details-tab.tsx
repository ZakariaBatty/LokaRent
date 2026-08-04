"use client"

import { motion } from "motion/react"
import {
  User,
  Phone,
  Car,
  MapPin,
  Calendar,
  Gauge,
  ExternalLink,
  UserPlus,
  Navigation,
  Baby,
  Shield,
  Hash,
  CarFront,
} from "lucide-react"
import { type Reservation, formatDate } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"

function InfoCard({
  title,
  icon: Icon,
  children,
  link,
}: {
  title: string
  icon: typeof User
  children: React.ReactNode
  link?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        {link && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="h-3 w-3" />
            Ouvrir
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={cn("text-sm font-medium text-slate-900", mono && "font-mono text-[12px]")}>{value}</span>
    </div>
  )
}

function ExtraChip({
  label,
  active,
  icon: Icon,
}: {
  label: string
  active: boolean
  icon: typeof Navigation
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span
        className={cn(
          "ml-auto h-1.5 w-1.5 rounded-full",
          active ? "bg-blue-500" : "bg-slate-300",
        )}
      />
    </div>
  )
}

export function DetailsTab({ reservation }: { reservation: Reservation }) {
  const r = reservation
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <InfoCard title="Client" icon={User} link={`/clients/${r.client.id}`}>
        <Row label="Nom" value={r.client.name} />
        <Row
          label="Téléphone"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-slate-400" />
              {r.client.phone}
            </span>
          }
          mono
        />
        <Row label="ID Client" value={r.client.id} mono />
      </InfoCard>

      <InfoCard title="Véhicule" icon={Car} link={`/cars/${r.car.id}`}>
        <Row label="Modèle" value={`${r.car.brand} ${r.car.model}`} />
        <Row label="Immatriculation" value={r.car.plate} mono />
        <Row label="Catégorie" value={r.car.category} />
      </InfoCard>

      <InfoCard title="Période" icon={Calendar}>
        <Row label="Date début" value={formatDate(r.startDate)} />
        <Row label="Date fin" value={formatDate(r.endDate)} />
        <Row
          label="Durée"
          value={
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              {r.days} jours
            </span>
          }
        />
      </InfoCard>

      <InfoCard title="Lieux" icon={MapPin}>
        <Row
          label="Prise en charge"
          value={
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-emerald-500" />
              {r.pickupLocation}
            </span>
          }
        />
        <Row
          label="Restitution"
          value={
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-rose-500" />
              {r.returnLocation}
            </span>
          }
        />
      </InfoCard>

      <InfoCard title="Options & Extras" icon={Shield}>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <ExtraChip label="GPS" active={r.extras.gps} icon={Navigation} />
          <ExtraChip label="Siège bébé" active={r.extras.babySeat} icon={Baby} />
          <ExtraChip label="Assurance +" active={r.extras.insuranceUpgrade} icon={Shield} />
          <ExtraChip
            label="Conducteur add."
            active={!!r.extras.additionalDriver}
            icon={UserPlus}
          />
        </div>
        {r.extras.additionalDriver && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
            <span className="font-medium text-slate-500">Conducteur additionnel</span>
            <p className="mt-0.5 font-semibold text-slate-900">{r.extras.additionalDriver}</p>
          </div>
        )}
      </InfoCard>

      <InfoCard title="Kilométrage" icon={Gauge}>
        <Row
          label="Départ"
          value={r.startKm !== null ? `${r.startKm.toLocaleString("fr-FR")} km` : "—"}
          mono
        />
        <Row
          label="Retour"
          value={r.returnKm !== null ? `${r.returnKm.toLocaleString("fr-FR")} km` : "—"}
          mono
        />
        <Row
          label="Distance parcourue"
          value={
            r.startKm !== null && r.returnKm !== null
              ? `${(r.returnKm - r.startKm).toLocaleString("fr-FR")} km`
              : "—"
          }
          mono
        />
      </InfoCard>

      {r.driver && (
        <InfoCard title="Chauffeur assigné" icon={CarFront} link={`/drivers`}>
          <Row label="Nom" value={r.driver.name} />
          <Row
            label="Téléphone"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-slate-400" />
                {r.driver.phone}
              </span>
            }
            mono
          />
        </InfoCard>
      )}

      <div className="lg:col-span-2">
        <InfoCard title="Identifiant réservation" icon={Hash}>
          <Row label="Code" value={r.code} mono />
          <Row label="Créée le" value={formatDate(r.createdAt)} />
        </InfoCard>
      </div>
    </motion.div>
  )
}
