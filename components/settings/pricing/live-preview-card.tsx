"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { Calculator, Calendar, Car, Sparkles, Tag, Zap } from "lucide-react"
import {
  type CategoryRow,
  type PricingOption,
  type Season,
  accentClasses,
  activeSeasonOn,
  formatMAD,
} from "@/lib/pricing-grid-data"

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 110, damping: 18, mass: 0.7 })
  const display = useTransform(spring, (v) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v)),
  )
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    mv.set(value)
  }, [value, mv])
  useEffect(() => {
    return display.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v)
    })
  }, [display])
  return <span ref={ref}>{display.get()}</span>
}

export function LivePreviewCard({
  categories,
  seasons,
  options,
  selectedCategoryId,
  onSelectCategory,
  seasonsEnabled,
}: {
  categories: CategoryRow[]
  seasons: Season[]
  options: PricingOption[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
  seasonsEnabled: boolean
}) {
  const [days, setDays] = useState(5)
  const [optionIds, setOptionIds] = useState<string[]>(["gps"])
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })

  const cat = categories.find((c) => c.id === selectedCategoryId) ?? categories[0]
  const carExample = useMemo(() => {
    const map: Record<string, string> = {
      citadine: "Dacia Logan",
      berline: "Peugeot 301",
      suv: "Hyundai Tucson",
      "4x4": "Toyota RAV4",
      utilitaire: "Renault Kangoo",
      luxe: "Mercedes Classe E",
    }
    return map[cat?.id] ?? "Véhicule"
  }, [cat?.id])

  // Pricing tiers: day, week (6+), month (25+)
  const computeBase = (d: number, perDay: number, perWeek: number, perMonth: number) => {
    if (d >= 25) return perMonth + Math.max(0, d - 25) * perDay
    if (d >= 6) {
      const weeks = Math.floor(d / 6)
      const rem = d - weeks * 6
      return weeks * perWeek + rem * perDay
    }
    return d * perDay
  }

  const base = cat ? computeBase(days, cat.perDay, cat.perWeek, cat.perMonth) : 0

  // Active season for this category
  const season = useMemo(() => {
    if (!seasonsEnabled || !cat) return null
    return activeSeasonOn(new Date(startDate), seasons, cat.id) ?? null
  }, [seasonsEnabled, seasons, startDate, cat])

  const seasonAdjustment = season ? Math.round((base * season.surcharge) / 100) : 0

  const optionsTotal = useMemo(() => {
    return options
      .filter((o) => optionIds.includes(o.id) && !o.included)
      .reduce((sum, o) => sum + o.perDay * days, 0)
  }, [options, optionIds, days])

  const total = Math.max(0, base + seasonAdjustment + optionsTotal)

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-indigo-50/30 shadow-[0_18px_50px_-22px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_6px_18px_-6px_rgba(79,70,229,0.7)]">
          <Calculator className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-900">Aperçu en direct</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Simulation calculée en temps réel
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Car className="h-3 w-3" />
            Véhicule
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="field-input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — exemple : {
                  ({
                    citadine: "Dacia Logan",
                    berline: "Peugeot 301",
                    suv: "Hyundai Tucson",
                    "4x4": "Toyota RAV4",
                    utilitaire: "Renault Kangoo",
                    luxe: "Mercedes Classe E",
                  } as Record<string, string>)[c.id] ?? c.name
                }
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <Calendar className="h-3 w-3" />
              Durée
            </label>
            <span className="text-xs font-semibold text-slate-700">
              {days} jour{days > 1 ? "s" : ""}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>1 j</span>
            <span>7 j</span>
            <span>15 j</span>
            <span>30 j</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="field-input"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Options
          </label>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => {
              const on = optionIds.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() =>
                    setOptionIds((cur) =>
                      cur.includes(o.id) ? cur.filter((x) => x !== o.id) : [...cur, o.id],
                    )
                  }
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                    on
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4 text-sm">
        <Row label={`${cat?.name ?? "—"} · ${days} j`} value={formatMAD(base)} />
        {season && seasonAdjustment !== 0 && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accentClasses[season.accent].chip}`}
              >
                <Tag className="h-2.5 w-2.5" />
                {season.name}
              </span>
              <span className="text-slate-500">
                ({season.surcharge >= 0 ? "+" : ""}
                {season.surcharge}%)
              </span>
            </span>
            <span
              className={`font-semibold tabular-nums ${
                seasonAdjustment >= 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {seasonAdjustment >= 0 ? "+" : ""}
              {formatMAD(seasonAdjustment)}
            </span>
          </div>
        )}
        {optionsTotal > 0 && (
          <Row
            label={`Options (${optionIds.filter((id) => !options.find((o) => o.id === id)?.included).length})`}
            value={`+ ${formatMAD(optionsTotal)}`}
            valueClass="text-indigo-700"
          />
        )}
      </div>

      <div className="relative overflow-hidden border-t border-slate-100 px-5 py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/40" />
        <div className="relative">
          <div className="flex items-baseline justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Total client
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              TTC
            </span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 0.96, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="mt-1 flex items-baseline gap-2"
          >
            <span className="text-3xl font-bold tabular-nums text-slate-900">
              <AnimatedNumber value={total} />
            </span>
            <span className="text-base font-semibold text-slate-500">DH</span>
          </motion.div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Caution : {formatMAD(cat?.caution ?? 0)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Zap className="h-3 w-3" />
              {carExample}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-slate-600">{label}</span>
      <span className={`font-semibold tabular-nums ${valueClass ?? "text-slate-900"}`}>
        {value}
      </span>
    </div>
  )
}
