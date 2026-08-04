"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageCircle, ChevronRight, Calendar, FileText, Wallet, Receipt, CarFront, Users } from "lucide-react"
import Link from "next/link"
import { useAgency } from "@/contexts/agency-context"
import { WhatsAppShareButton } from "@/components/communication/whatsapp-share-button"
import { formatDate, formatMAD } from "@/lib/reservations-data"

type DocumentType = "reservation" | "invoice" | "contract" | "payment" | "deposit" | "driver" | "customer"

interface ShareableDocument {
  id: string
  type: DocumentType
  title: string
  subtitle: string
  date: string
  icon: typeof MessageCircle
  template: any
  templateData: any
  phoneNumber: string | null
}

export default function WhatsAppPage() {
  const { agencyData } = useAgency()
  const [activeFilter, setActiveFilter] = useState<DocumentType | "all">("all")

  // Generate shareable documents from agency data
  const documents = useMemo<ShareableDocument[]>(() => {
    const docs: ShareableDocument[] = []

    // Add reservations
    agencyData.reservations.slice(0, 5).forEach((res) => {
      docs.push({
        id: `res-${res.id}`,
        type: "reservation",
        title: `Réservation #${res.code}`,
        subtitle: `${res.client.name} · ${res.car.brand} ${res.car.model}`,
        date: formatDate(res.createdAt),
        icon: Calendar,
        template: "reservation_summary",
        templateData: {
          code: res.code,
          clientName: res.client.name,
          carBrand: res.car.brand,
          carModel: res.car.model,
          carPlate: res.car.plate,
          startDate: res.startDate,
          endDate: res.endDate,
          days: res.days,
          total: res.total,
          pickupLocation: "Agence centrale",
          returnLocation: "Agence centrale",
        },
        phoneNumber: res.client.phone,
      })
    })

    // Add invoices (mock)
    agencyData.reservations.slice(0, 3).forEach((res, idx) => {
      docs.push({
        id: `inv-${res.id}`,
        type: "invoice",
        title: `Facture #FAC-${String(1001 + idx).padStart(5, "0")}`,
        subtitle: `${res.client.name} · ${formatMAD(res.total)}`,
        date: formatDate(res.createdAt),
        icon: FileText,
        template: "invoice",
        templateData: {
          invoiceCode: `FAC-${String(1001 + idx).padStart(5, "0")}`,
          clientName: res.client.name,
          amount: res.total,
          reservationCode: res.code,
          dueDate: res.endDate,
        },
        phoneNumber: res.client.phone,
      })
    })

    // Add contracts (mock)
    agencyData.reservations.slice(0, 2).forEach((res, idx) => {
      docs.push({
        id: `con-${res.id}`,
        type: "contract",
        title: `Contrat #CTR-${String(5001 + idx).padStart(5, "0")}`,
        subtitle: `${res.client.name} · ${res.car.brand} ${res.car.model}`,
        date: formatDate(res.createdAt),
        icon: FileText,
        template: "contract",
        templateData: {
          contractCode: `CTR-${String(5001 + idx).padStart(5, "0")}`,
          clientName: res.client.name,
          carDescription: `${res.car.brand} ${res.car.model}`,
          startDate: res.startDate,
          endDate: res.endDate,
        },
        phoneNumber: res.client.phone,
      })
    })

    // Add payments (mock)
    agencyData.reservations.slice(0, 2).forEach((res, idx) => {
      docs.push({
        id: `pay-${res.id}`,
        type: "payment",
        title: `Reçu de paiement #REC-${String(7001 + idx).padStart(5, "0")}`,
        subtitle: `${res.client.name} · ${formatMAD(res.total)}`,
        date: formatDate(res.createdAt),
        icon: Wallet,
        template: "payment_receipt",
        templateData: {
          receiptCode: `REC-${String(7001 + idx).padStart(5, "0")}`,
          clientName: res.client.name,
          amount: res.total,
          paymentMethod: "Carte bancaire",
          date: res.createdAt,
          reservationCode: res.code,
        },
        phoneNumber: res.client.phone,
      })
    })

    // Add deposits (mock)
    agencyData.reservations.slice(0, 2).forEach((res, idx) => {
      docs.push({
        id: `dep-${res.id}`,
        type: "deposit",
        title: `Caution #DEP-${String(3001 + idx).padStart(5, "0")}`,
        subtitle: `${res.client.name} · ${formatMAD(res.total * 0.15)}`,
        date: formatDate(res.createdAt),
        icon: Receipt,
        template: "deposit_receipt",
        templateData: {
          depositCode: `DEP-${String(3001 + idx).padStart(5, "0")}`,
          clientName: res.client.name,
          amount: res.total * 0.15,
          carDescription: `${res.car.brand} ${res.car.model}`,
          date: res.createdAt,
        },
        phoneNumber: res.client.phone,
      })
    })

    return docs
  }, [agencyData])

  const filtered = useMemo(() => {
    if (activeFilter === "all") return documents
    return documents.filter((d) => d.type === activeFilter)
  }, [documents, activeFilter])

  const filters: Array<{ id: DocumentType | "all"; label: string; icon: typeof MessageCircle }> = [
    { id: "all", label: "Tous", icon: MessageCircle },
    { id: "reservation", label: "Réservations", icon: Calendar },
    { id: "invoice", label: "Factures", icon: FileText },
    { id: "contract", label: "Contrats", icon: FileText },
    { id: "payment", label: "Paiements", icon: Wallet },
    { id: "deposit", label: "Cautions", icon: Receipt },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/communication"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="text-lg">←</span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">WhatsApp</h1>
        </div>
        <p className="text-sm text-slate-600">
          Partagez rapidement vos documents avec vos clients via WhatsApp. Sélectionnez un document et cliquez sur le
          bouton WhatsApp pour commencer.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              activeFilter === filter.id
                ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <filter.icon className="h-4 w-4" strokeWidth={2} />
            <span>{filter.label}</span>
            {filter.id !== "all" && (
              <span className="ml-0.5 text-xs opacity-75">
                ({documents.filter((d) => d.type === filter.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents list */}
      <div className="space-y-3">
        <AnimatePresence mode="wait" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center"
            >
              <p className="text-sm text-slate-600">Aucun document trouvé pour ce filtre.</p>
            </motion.div>
          ) : (
            <>
              {filtered.map((doc, idx) => {
                const Icon = doc.icon
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="group relative"
                  >
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:shadow-md hover:border-slate-300 hover:bg-slate-50/50">
                      {/* Left content */}
                      <div className="flex flex-1 items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span>{doc.subtitle}</span>
                            <span className="text-slate-300">·</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right action */}
                      <div className="flex items-center gap-2">
                        <WhatsAppShareButton
                          template={doc.template}
                          phoneNumber={doc.phoneNumber}
                          templateData={doc.templateData}
                          title={doc.title}
                          size="sm"
                          variant="default"
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-lg border border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50/30 p-4"
      >
        <p className="text-xs text-slate-700">
          <span className="font-semibold text-green-700">✓ Astuce:</span> Les numéros de téléphone des clients sans données seront automatiquement désactivés. Assurez-vous que les informations de contact sont à jour dans les profils clients.
        </p>
      </motion.div>
    </div>
  )
}
