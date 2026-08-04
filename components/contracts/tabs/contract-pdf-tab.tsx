"use client"

import { motion } from "motion/react"
import { Download, Printer, FileText } from "lucide-react"
import { toast } from "sonner"
import { type Contract, formatMAD, formatDate, formatDateLong, remainingBalance, totalPaid } from "@/lib/contracts-data"

export function ContractPdfTab({ contract }: { contract: Contract }) {
  const optionsTotal = contract.pricing.options.reduce((acc, o) => acc + o.amount, 0)
  const paid = totalPaid(contract)
  const remaining = remainingBalance(contract)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText className="h-4 w-4" />
          Aperçu du contrat – format A4
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("Impression lancée")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </button>
          <button
            onClick={() => toast.success("Téléchargement PDF lancé")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-slate-100/60 p-6 shadow-sm">
        <div
          className="mx-auto max-w-[720px] rounded-md bg-white p-10 text-[12px] leading-relaxed text-slate-700 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
          style={{ aspectRatio: "1 / 1.414" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-[18px] font-bold tracking-tight text-slate-900">LokaRent</div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                Agence de location · Casablanca, Maroc
              </div>
              <div className="text-[10px] text-slate-500">
                contact@lokarent.ma · +212 522 00 00 00
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Contrat de location
              </div>
              <div className="mt-1 font-mono text-[13px] font-bold text-slate-900">
                {contract.code}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                Émis le {formatDateLong(contract.createdAt)}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="mt-5 grid grid-cols-2 gap-6">
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Le loueur
              </div>
              <div className="font-semibold text-slate-900">LokaRent SARL</div>
              <div className="text-[11px] text-slate-600">
                Boulevard Mohamed V, Casablanca
                <br />
                ICE: 002387645000056
                <br />
                RC: 458921
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Le locataire
              </div>
              <div className="font-semibold text-slate-900">{contract.client.fullName}</div>
              <div className="text-[11px] text-slate-600">
                CIN: {contract.client.cinMasked}
                <br />
                Permis: {contract.client.permis}
                <br />
                Tél: {contract.client.phone}
              </div>
            </div>
          </div>

          {/* Véhicule */}
          <div className="mt-5">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Véhicule loué
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <div className="text-slate-400">Marque & modèle</div>
                  <div className="font-semibold text-slate-900">
                    {contract.car.brand} {contract.car.model}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Immatriculation</div>
                  <div className="font-mono font-semibold text-slate-900">{contract.car.plate}</div>
                </div>
                <div>
                  <div className="text-slate-400">Catégorie</div>
                  <div className="font-semibold text-slate-900">{contract.car.category}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Période */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Départ
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-slate-900">
                {formatDate(contract.period.start)}
              </div>
              <div className="text-[10px] text-slate-500">{contract.locations.pickup}</div>
            </div>
            <div className="rounded-md border border-rose-200/60 bg-rose-50/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Retour
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-slate-900">
                {formatDate(contract.period.end)}
              </div>
              <div className="text-[10px] text-slate-500">{contract.locations.dropoff}</div>
            </div>
          </div>

          {/* Tarification */}
          <div className="mt-5">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tarification
            </div>
            <table className="w-full text-[11px]">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 text-slate-500">
                    {contract.period.days} jour(s) × {formatMAD(contract.pricing.pricePerDay)}
                  </td>
                  <td className="py-1.5 text-right font-medium text-slate-700">
                    {formatMAD(contract.pricing.pricePerDay * contract.period.days)}
                  </td>
                </tr>
                {contract.pricing.discount > 0 && (
                  <tr>
                    <td className="py-1.5 text-rose-600">Remise</td>
                    <td className="py-1.5 text-right font-medium text-rose-600">
                      -{formatMAD(contract.pricing.discount)}
                    </td>
                  </tr>
                )}
                {contract.pricing.options.map((o, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-slate-500">{o.label}</td>
                    <td className="py-1.5 text-right font-medium text-slate-700">
                      +{formatMAD(o.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-2 font-bold text-slate-900">TOTAL</td>
                  <td className="py-2 text-right font-bold text-slate-900">
                    {formatMAD(contract.pricing.total)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-500">
                    Caution ({contract.caution.type})
                  </td>
                  <td className="py-1.5 text-right font-medium text-amber-700">
                    {formatMAD(contract.caution.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-500">Montant payé</td>
                  <td className="py-1.5 text-right font-medium text-emerald-700">
                    {formatMAD(paid)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold text-slate-900">Reste à percevoir</td>
                  <td className="py-1.5 text-right font-bold text-slate-900">
                    {formatMAD(remaining)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conditions */}
          <div className="mt-5">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Conditions principales
            </div>
            <ul className="space-y-1 text-[10.5px] text-slate-600">
              <li>1. Le locataire s&apos;engage à restituer le véhicule à la date convenue.</li>
              <li>2. Le carburant est restitué au même niveau qu&apos;au départ.</li>
              <li>3. Tout dépassement de kilométrage sera facturé selon le tarif en vigueur.</li>
              <li>4. En cas de sinistre, le locataire doit en informer LokaRent sous 24h.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Signature du loueur
              </div>
              <div
                className={`mt-2 h-16 rounded-md border border-dashed ${contract.signedByAgency
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200"
                  }`}
              >
                {contract.signedByAgency && (
                  <div className="grid h-full place-items-center text-[10px] font-medium text-emerald-700">
                    Signé électroniquement
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Signature du locataire
              </div>
              <div
                className={`mt-2 h-16 rounded-md border border-dashed ${contract.signedByClient
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200"
                  }`}
              >
                {contract.signedByClient && (
                  <div className="grid h-full place-items-center text-[10px] font-medium text-emerald-700">
                    Signé électroniquement
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}