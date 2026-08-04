"use client"

import { motion } from "motion/react"
import { MessageCircle, Send, Archive, Zap } from "lucide-react"
import Link from "next/link"

export default function CommunicationPage() {
  const channels = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Partagez des documents et des informations directement avec vos clients",
      icon: MessageCircle,
      color: "from-green-50 to-emerald-50",
      iconColor: "text-green-600",
      status: "Actif",
      users: "1 200+ messages",
      features: [
        "Partage de réservations",
        "Factures et paiements",
        "Contrats et documents",
        "Reçus et confirmations",
        "Informations chauffeur",
      ],
    },
    {
      id: "email",
      name: "Email",
      description: "Notifications par email détaillées et automatisées",
      icon: Send,
      color: "from-blue-50 to-indigo-50",
      iconColor: "text-blue-600",
      status: "Bientôt disponible",
      users: "Phase 2",
      features: [
        "Confirmations automatiques",
        "Rappels de paiement",
        "Rapports et analyses",
        "Newsletters",
      ],
    },
    {
      id: "sms",
      name: "SMS",
      description: "Messages texte rapides pour les confirmations urgentes",
      icon: Zap,
      color: "from-amber-50 to-orange-50",
      iconColor: "text-amber-600",
      status: "Bientôt disponible",
      users: "Phase 2",
      features: [
        "Rappels de prise en charge",
        "Alertes de retard",
        "Notifications urgentes",
        "Codes d'accès",
      ],
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <MessageCircle className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            Communication
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Gérez vos canaux de communication avec vos clients en un seul endroit. Partagez des documents, confirmez les réservations et maintenez une communication transparente.
        </p>
      </motion.div>

      {/* Channels grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {channels.map((channel, idx) => {
          const Icon = channel.icon
          const isAvailable = channel.status === "Actif"

          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative"
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${channel.color} p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all ${
                  isAvailable ? "hover:shadow-md hover:border-slate-300" : "opacity-60"
                }`}
              >
                {/* Decorative gradient blob */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/30 blur-2xl" />

                {/* Header */}
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white/60 backdrop-blur ${channel.iconColor}`}>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {channel.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">{channel.name}</h3>
                    <p className="mt-1 text-xs text-slate-600">{channel.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="pt-2 border-t border-white/40">
                    <p className="text-xs font-medium text-slate-700">{channel.users}</p>
                  </div>
                </div>

                {/* Features list */}
                <div className="relative mt-4 space-y-2 pt-4 border-t border-white/40">
                  {channel.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="text-xs text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                {isAvailable && (
                  <Link
                    href="/communication/whatsapp"
                    className="relative mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition-all hover:shadow-md hover:bg-slate-50 group-hover:scale-105"
                  >
                    <span>Commencer</span>
                    <span className="text-xs">→</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-5"
      >
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">💡 Comment ça marche?</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">1.</span>
              <span>Sélectionnez un document (réservation, facture, contrat, etc.) que vous souhaitez partager.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">2.</span>
              <span>Cliquez sur le bouton "WhatsApp" pour ouvrir le dialogue de partage.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">3.</span>
              <span>Un message professionnel est automatiquement généré. Vous pouvez l'éditer si besoin.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-blue-600">4.</span>
              <span>Cliquez sur "Envoyer" pour ouvrir WhatsApp et envoyer le message à votre client.</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Features summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          {
            title: "En un clic",
            description: "Ouvrez WhatsApp instantanément sans quitter l'application.",
          },
          {
            title: "Modèles professionnels",
            description: "Messages pré-générés adaptés à chaque type de document.",
          },
          {
            title: "Entièrement personnalisable",
            description: "Modifiez le message avant d'envoyer pour l'adapter à vos besoins.",
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-white/50 p-4 text-center backdrop-blur"
          >
            <h4 className="font-semibold text-slate-900">{feature.title}</h4>
            <p className="mt-1 text-xs text-slate-600">{feature.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
