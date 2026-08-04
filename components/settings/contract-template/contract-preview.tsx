"use client"

import { motion, AnimatePresence } from "motion/react"
import { Car } from "lucide-react"
import {
  type ContractTemplate,
  AGENCY_INFO,
  SAMPLE_CLIENT,
  SAMPLE_VEHICLE,
  SAMPLE_RENTAL,
  CLAUSE_TRANSLATIONS_AR,
  TITLE_AR,
  titleSizeClass,
} from "@/lib/contract-template-data"

export function ContractPreview({
  template,
  scale = 1,
}: {
  template: ContractTemplate
  scale?: number
}) {
  const isAR = template.language === "ar"
  const isBilingue = template.language === "bilingue"

  return (
    <div
      className="relative mx-auto"
      style={{ width: 794 * scale, transformOrigin: "top center" }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        className="relative overflow-hidden bg-white text-slate-900 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200"
        style={{
          width: 794 * scale,
          minHeight: 1123 * scale,
          padding: 56 * scale,
          fontSize: 12 * scale,
          lineHeight: 1.55,
        }}
      >
        {/* Soft paper grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(15,23,42,0.6) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />

        {/* HEADER */}
        <header
          className="relative flex items-start justify-between border-b border-slate-300 pb-4"
          dir={isAR ? "rtl" : "ltr"}
        >
          <div className="flex items-start gap-3">
            <AnimatePresence>
              {template.showLogo && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm"
                  style={{ width: 48 * scale, height: 48 * scale }}
                >
                  <Car style={{ width: 24 * scale, height: 24 * scale }} />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <p
                className="font-bold uppercase tracking-tight text-slate-900"
                style={{ fontSize: 14 * scale }}
              >
                {AGENCY_INFO.name}
              </p>
              <p className="text-slate-600" style={{ fontSize: 10 * scale }}>
                {AGENCY_INFO.address}
              </p>
            </div>
          </div>
          <div className="text-right text-slate-700" style={{ fontSize: 10 * scale }}>
            <AnimatePresence mode="popLayout">
              {template.showPhone && (
                <motion.p
                  key="phone"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  Tél : {AGENCY_INFO.phone}
                </motion.p>
              )}
              {template.showEmail && (
                <motion.p
                  key="email"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  Email : {AGENCY_INFO.email}
                </motion.p>
              )}
              {template.showRC && (
                <motion.p
                  key="rc"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  {AGENCY_INFO.rc}
                </motion.p>
              )}
              {template.showICE && (
                <motion.p
                  key="ice"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  {AGENCY_INFO.ice}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* TITLE */}
        <motion.div
          layout
          className="relative mt-6 text-center"
          dir={isAR ? "rtl" : "ltr"}
        >
          <h1
            className={`font-bold uppercase tracking-tight text-slate-900 ${titleSizeClass(template.titleSize)}`}
          >
            {isAR ? TITLE_AR : template.title}
          </h1>
          {isBilingue && (
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-700" dir="rtl">
              {TITLE_AR}
            </h2>
          )}
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Réf. n° LR-2026-0142
          </p>
        </motion.div>

        {/* PARTIES */}
        <section
          className="mt-6 grid grid-cols-2 gap-6 text-[11px]"
          dir={isAR ? "rtl" : "ltr"}
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isAR ? "بين الطرفين / Bailleur" : "Entre les parties / Bailleur"}
            </p>
            <p className="font-semibold text-slate-900">{AGENCY_INFO.name}</p>
            <p className="text-slate-700">{AGENCY_INFO.address}</p>
            {template.showRC && <p className="text-slate-700">{AGENCY_INFO.rc}</p>}
            {template.showICE && <p className="text-slate-700">{AGENCY_INFO.ice}</p>}
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isAR ? "المستأجر / Locataire" : "Locataire"}
            </p>
            <DocRow label={isAR ? "الاسم" : "Nom"} value={SAMPLE_CLIENT.name} />
            <DocRow label="CIN" value={SAMPLE_CLIENT.cin} />
            <DocRow label={isAR ? "رخصة السياقة" : "Permis"} value={SAMPLE_CLIENT.permis} />
            <DocRow label={isAR ? "الهاتف" : "Téléphone"} value={SAMPLE_CLIENT.phone} />
          </div>
        </section>

        {/* VEHICLE */}
        <section
          className="mt-5 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3 text-[11px]"
          dir={isAR ? "rtl" : "ltr"}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAR ? "السيارة / Véhicule" : "Véhicule"}
          </p>
          <div className="grid grid-cols-4 gap-3">
            <DocRow
              label={isAR ? "الماركة" : "Marque & modèle"}
              value={SAMPLE_VEHICLE.brand}
            />
            <DocRow
              label={isAR ? "اللوحة" : "Immatriculation"}
              value={SAMPLE_VEHICLE.plate}
            />
            <DocRow label={isAR ? "السنة" : "Année"} value={String(SAMPLE_VEHICLE.year)} />
            <DocRow
              label={isAR ? "الفئة" : "Catégorie"}
              value={SAMPLE_VEHICLE.category}
            />
          </div>
        </section>

        {/* RENTAL DETAILS */}
        <section className="mt-5 text-[11px]" dir={isAR ? "rtl" : "ltr"}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAR ? "تفاصيل الكراء" : "Détails de la location"}
          </p>
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-50">
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {isAR ? "البيان" : "Désignation"}
                </th>
                <th className="px-3 py-2 font-semibold text-slate-700">
                  {isAR ? "المدة" : "Durée"}
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">
                  {isAR ? "السعر اليومي" : "PU / jour"}
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">
                  {isAR ? "المجموع" : "Montant"}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-2 text-slate-800">
                  Location {SAMPLE_VEHICLE.brand}
                  <span className="block text-[10px] text-slate-500">
                    {SAMPLE_RENTAL.startDate} {SAMPLE_RENTAL.startTime} →{" "}
                    {SAMPLE_RENTAL.endDate} {SAMPLE_RENTAL.endTime}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-800">
                  {SAMPLE_RENTAL.days} jours
                </td>
                <td className="px-3 py-2 text-right text-slate-800">
                  {SAMPLE_RENTAL.pricePerDay.toLocaleString("fr-FR")} DH
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                  {SAMPLE_RENTAL.total.toLocaleString("fr-FR")} DH
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-slate-600">
                  {isAR ? "الضمانة" : "Caution remboursable"}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">
                  {SAMPLE_RENTAL.caution.toLocaleString("fr-FR")} DH
                </td>
              </tr>
              <tr className="border-t-2 border-slate-900">
                <td colSpan={3} className="px-3 py-2 text-right font-bold text-slate-900">
                  {isAR ? "المجموع الإجمالي TTC" : "TOTAL TTC"}
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-900">
                  {SAMPLE_RENTAL.total.toLocaleString("fr-FR")} DH
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* CLAUSES */}
        <section className="mt-6 text-[11px]" dir={isAR ? "rtl" : "ltr"}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAR ? "الشروط العامة" : "Conditions générales"}
          </p>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {template.clauses
                .filter((c) => c.enabled)
                .map((clause, idx) => {
                  const ar = CLAUSE_TRANSLATIONS_AR[clause.id]
                  const renderTitle = isAR && ar ? ar.title : clause.title
                  const renderContent = isAR && ar ? ar.content : clause.content
                  return (
                    <motion.div
                      key={clause.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="font-bold text-slate-900">
                        Article {idx + 1}. {renderTitle}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-justify text-[11px] leading-relaxed text-slate-700">
                        {renderContent}
                      </p>
                      {isBilingue && ar && (
                        <p
                          dir="rtl"
                          className="mt-1 whitespace-pre-line text-justify text-[11px] leading-relaxed text-slate-600"
                        >
                          {ar.content}
                        </p>
                      )}
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </div>
        </section>

        {/* SIGNATURES */}
        {(template.showClientSignature || template.showAgencySignature) && (
          <section
            className="mt-8 grid grid-cols-2 gap-8 text-[11px]"
            dir={isAR ? "rtl" : "ltr"}
          >
            <AnimatePresence>
              {template.showClientSignature && (
                <motion.div
                  key="client-sig"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <p className="font-semibold text-slate-900">
                    {isAR ? "اطلعت ووافقت — توقيع المستأجر" : "Lu et approuvé — Locataire"}
                  </p>
                  <div className="mt-12 border-t border-slate-400" />
                  <p className="mt-1 text-[10px] text-slate-500">
                    {SAMPLE_CLIENT.name}
                  </p>
                </motion.div>
              )}
              {template.showAgencySignature && (
                <motion.div
                  key="agency-sig"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <p className="font-semibold text-slate-900">
                    {isAR ? "ختم وتوقيع الوكالة" : "Cachet et signature de l'agence"}
                  </p>
                  <div className="mt-12 border-t border-slate-400" />
                  <p className="mt-1 text-[10px] text-slate-500">{AGENCY_INFO.name}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* FOOTER */}
        <footer
          className="mt-10 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-500"
          dir={isAR ? "rtl" : "ltr"}
        >
          <p>
            {template.footerText}
          </p>
          {template.showPageNumber && <p>Page 1 / 1</p>}
        </footer>
      </motion.div>
    </div>
  )
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-[11px] font-medium text-slate-900">{value}</p>
    </div>
  )
}
