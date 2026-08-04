"use client"

import { motion } from "motion/react"
import {
  Fuel,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  FileText,
  Check,
  X,
} from "lucide-react"
import type { Contract, EtatBlock, Damage } from "@/lib/contracts-data"

const fuelLabels: Record<1 | 2 | 3 | 4, { label: string; pct: number }> = {
  1: { label: "1/4", pct: 25 },
  2: { label: "1/2", pct: 50 },
  3: { label: "3/4", pct: 75 },
  4: { label: "Plein", pct: 100 },
}

function Bar({ pct, tone }: { pct: number; tone: "emerald" | "rose" }) {
  const tones = {
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-rose-600",
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`h-full rounded-full bg-gradient-to-r ${tones[tone]}`}
      />
    </div>
  )
}

function ChecklistSection({
  title,
  items,
}: {
  title: string
  items: { label: string; ok: boolean }[]
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] ${item.ok ? "bg-slate-50 text-slate-600" : "bg-rose-50 text-rose-700"
              }`}
          >
            {item.ok ? (
              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-rose-500 shrink-0" />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function StateColumn({
  title,
  etat,
  damages,
  notes,
  tone,
}: {
  title: string
  etat: EtatBlock
  damages?: Damage[]
  notes?: string
  tone: "emerald" | "rose"
}) {
  const toneText = tone === "emerald" ? "text-emerald-700" : "text-rose-700"
  const toneBg = tone === "emerald" ? "bg-emerald-50" : "bg-rose-50"
  const toneRing = tone === "emerald" ? "ring-emerald-100" : "ring-rose-100"
  const fuel = fuelLabels[etat.fuel]

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${toneBg} ${toneText} ${toneRing}`}
        >
          <FileText className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {/* Carburant */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Fuel className="h-3.5 w-3.5" />
              Carburant
            </span>
            <span className="font-semibold text-slate-900">{fuel.label}</span>
          </div>
          <Bar pct={fuel.pct} tone={tone} />
        </div>

        {/* Kilométrage */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Gauge className="h-3.5 w-3.5" />
            Kilométrage
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {etat.km.toLocaleString("fr-FR")} km
          </span>
        </div>

        {/* Checklists */}
        <ChecklistSection title="Carrosserie" items={etat.carrosserie} />
        <ChecklistSection title="Intérieur" items={etat.interieur} />
        <ChecklistSection title="Équipements" items={etat.equipements} />

        {/* Dégâts */}
        {damages !== undefined && (
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Dégâts constatés
            </div>
            {damages.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Aucun dégât
              </div>
            ) : (
              <ul className="space-y-1.5">
                {damages.map((d, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <div className="font-semibold">{d.zone}</div>
                        <div>{d.description}</div>
                        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600">
                          {d.severity}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600 italic">
            {notes}
          </div>
        )}
      </div>
    </div>
  )
}

export function ContractStateTab({ contract }: { contract: Contract }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 lg:grid-cols-2"
    >
      <StateColumn
        title="État au départ"
        etat={contract.etat.depart}
        tone="emerald"
      />
      {contract.etat.retour ? (
        <StateColumn
          title="État au retour"
          etat={contract.etat.retour}
          damages={contract.etat.retour.damages}
          notes={contract.etat.retour.notes}
          tone="rose"
        />
      ) : (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div>
            <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">État au retour non encore saisi</p>
            <p className="mt-0.5 text-xs text-slate-400">Disponible après clôture du contrat</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}