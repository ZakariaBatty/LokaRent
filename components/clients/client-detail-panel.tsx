"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Pencil, Trash2, User, BarChart3, History, StickyNote, Phone, Mail } from "lucide-react"
import { type Client, formatMAD, statusConfig, tierConfig } from "@/lib/clients-data"
import { WhatsAppShareButton } from "@/components/communication/whatsapp-share-button"
import { ClientAvatar } from "./client-avatar"
import { ProfilTab } from "./tabs/profil-tab"
import { StatistiquesTab } from "./tabs/statistiques-tab"
import { HistoriqueTab } from "./tabs/historique-tab"
import { NotesTab } from "./tabs/notes-tab"
import { cn } from "@/lib/utils"

type TabKey = "profil" | "stats" | "historique" | "notes"

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profil", label: "Profil", icon: User },
  { key: "stats", label: "Statistiques", icon: BarChart3 },
  { key: "historique", label: "Historique", icon: History },
  { key: "notes", label: "Notes", icon: StickyNote },
]

export function ClientDetailPanel({
  client,
  onClose,
  onEdit,
  onDelete,
}: {
  client: Client
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("profil")
  const status = statusConfig[client.status]
  const tier = tierConfig[client.tier]

  return (
    <motion.div
      key={client.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <ClientAvatar
                id={client.id}
                name={client.fullName}
                nationality={client.nationality}
                showFlag
                vip={client.tier === "vip"}
                size="xl"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                      status.pillClass,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        status.textClass,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      tier.pillClass,
                      tier.textClass,
                    )}
                  >
                    {tier.label}
                  </span>
                </div>
                <h2 className="mt-1 font-serif text-2xl text-slate-900 lg:text-3xl">
                  {client.fullName}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="tabular-nums">{client.phone}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{client.email}</span>
                  </span>
                </div>
                {client.phone && (
                  <div className="mt-2">
                    <WhatsAppShareButton
                      template="client_contact"
                      phoneNumber={client.phone}
                      templateData={{
                        clientName: client.fullName,
                        phone: client.phone,
                      }}
                      title={`Contact ${client.fullName}`}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={onDelete}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="mx-1 h-6 w-px bg-slate-200" />
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Locations
              </p>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {client.totalRentals}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total dépensé
              </p>
              <p className="text-base font-bold text-emerald-700 tabular-nums">
                {formatMAD(client.totalSpent)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Panier moyen
              </p>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {client.totalRentals > 0
                  ? formatMAD(Math.round(client.totalSpent / client.totalRentals))
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Véhicule favori
              </p>
              <p className="truncate text-base font-bold text-slate-900">
                {client.favoriteCar?.split(" ").slice(0, 2).join(" ") ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-200/80 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-3 text-sm font-semibold transition",
                  active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {active && (
                  <motion.span
                    layoutId="client-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            {activeTab === "profil" && <ProfilTab client={client} />}
            {activeTab === "stats" && <StatistiquesTab client={client} />}
            {activeTab === "historique" && <HistoriqueTab client={client} />}
            {activeTab === "notes" && <NotesTab client={client} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
