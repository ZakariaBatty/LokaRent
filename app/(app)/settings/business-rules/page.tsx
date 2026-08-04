"use client"

import { SlidersHorizontal } from "lucide-react"

export default function BusinessRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Règles métier</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configurez les automatisations et les limites opérationnelles
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-slate-100 p-3">
            <SlidersHorizontal className="h-6 w-6 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Règles métier en cours de développement
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cette page sera disponible très bientôt. Nous travaillons actuellement sur la
            configuration des automatisations et des limites.
          </p>
        </div>
      </div>
    </div>
  )
}
