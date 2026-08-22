"use client"

import { motion } from "motion/react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import {
  ArrowDownRight,
  ArrowUpRight,
  Fuel,
  ShieldCheck,
  Stamp,
  TrendingUp,
  Wallet,
  Wrench,
  X,
} from "lucide-react"
import { getExpenseBreakdown, type CarFinance } from "@/lib/finances-data"
import { categoryAccent, formatDate, type CarCategory } from "@/lib/cars-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/i18n-context"

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]

const expenseIcon: Record<string, React.ElementType> = {
  Maintenance: Wrench,
  Réparation: Wrench,
  Assurance: ShieldCheck,
  Vignette: Stamp,
  Carburant: Fuel,
}

function TooltipDot({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-xs font-medium text-slate-700">{item.payload.type}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.value.toLocaleString("fr-FR")}</p>
    </div>
  )
}

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString("fr-FR")} ${currency}`
}

function carCategoryAccent(category: string) {
  return categoryAccent[category as CarCategory] ?? "bg-slate-100 text-slate-700 ring-slate-200"
}

export function CarFinanceDetailPanel({
  car,
  onClose,
  currency,
}: {
  car: CarFinance
  onClose: () => void
  currency: string
}) {
  const { t } = useI18n()
  const profitable = car.profit >= 0
  const margin = car.revenue > 0 ? Math.round((car.profit / car.revenue) * 100) : 0
  const breakdown = getExpenseBreakdown(car)
  const totalExpenses = breakdown.reduce((a, b) => a + b.amount, 0)

  // Monthly breakdown derived from monthlyRevenue, with expenses spread evenly
  const monthlyExpense = car.expenses / car.monthlyRevenue.length
  const monthly = car.monthlyRevenue.map((rev, i) => ({
    month: MONTH_LABELS[i] ?? `M${i + 1}`,
    revenue: rev,
    expenses: Math.round(monthlyExpense),
    profit: Math.round(rev - monthlyExpense),
  }))

  const maxMonthly = Math.max(...monthly.map((m) => Math.max(m.revenue, m.expenses)))

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold",
              carCategoryAccent(car.category),
            )}
          >
            {car.brand.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {car.brand} {car.model}
            </h2>
            <p className="text-xs text-slate-500">
              {car.plate} · {car.category}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Top KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            label={t("finances.chart.revenue")}
            value={formatMoney(car.revenue, currency)}
            icon={Wallet}
            accent="bg-blue-50 text-blue-600 ring-blue-100"
          />
          <KpiTile
            label={t("finances.chart.expenses")}
            value={formatMoney(car.expenses, currency)}
            icon={Wrench}
            accent="bg-amber-50 text-amber-600 ring-amber-100"
          />
          <KpiTile
            label={profitable ? t("finances.chart.profit") : t("finances.detail.loss")}
            value={formatMoney(Math.abs(car.profit), currency)}
            icon={profitable ? ArrowUpRight : ArrowDownRight}
            accent={
              profitable
                ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                : "bg-rose-50 text-rose-600 ring-rose-100"
            }
            highlight={profitable ? "emerald" : "rose"}
          />
        </div>

        {/* Performance row */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("finances.detail.occupancyRate")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {car.occupancyRate}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${car.occupancyRate}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("finances.detail.netMargin")}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums",
                profitable ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {margin}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  profitable ? "from-indigo-500 to-blue-500" : "from-rose-500 to-red-500",
                )}
              />
            </div>
          </div>
        </div>

        {/* Monthly breakdown */}
        <Section title={t("finances.detail.monthlyEvolution")} subtitle={t("finances.detail.monthlyEvolutionSubtitle")}>
          <div className="space-y-1.5">
            {monthly.map((m, i) => {
              const revPct = (m.revenue / maxMonthly) * 100
              const expPct = (m.expenses / maxMonthly) * 100
              return (
                <motion.div
                  key={m.month}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.3 }}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50/60"
                >
                  <span className="text-[11px] font-medium text-slate-400">{m.month}</span>
                  <div className="relative h-5">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${revPct}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 opacity-90"
                      style={{ width: `${expPct}%` }}
                    />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        m.profit >= 0 ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {m.profit >= 0 ? "+" : ""}
                      {(m.profit / 1000).toFixed(1)}k
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> {t("finances.chart.revenue")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> {t("finances.chart.expenses")}
            </span>
          </div>
        </Section>

        {/* Expenses donut + list */}
        <Section title={t("finances.detail.expenseBreakdown")} subtitle={t("finances.detail.expenseBreakdownSubtitle")}>
          {breakdown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              {t("finances.detail.noExpenses")}
            </p>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-[160px] w-[160px] shrink-0 self-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="amount"
                      nameKey="type"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                      animationDuration={900}
                    >
                      {breakdown.map((b) => (
                        <Cell key={b.type} fill={b.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<TooltipDot />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-semibold tabular-nums text-slate-900">
                    {formatMoney(totalExpenses, currency)}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {t("finances.detail.total")}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {breakdown.map((b) => {
                  const pct = Math.round((b.amount / totalExpenses) * 100)
                  return (
                    <div key={b.type}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                          {b.type}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatMoney(b.amount, currency)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: b.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Section>

        {/* Detailed expenses list */}
        <Section title={t("finances.detail.latestExpenses")} subtitle={`${car.recentExpenses.length} ${t("finances.detail.movements")}`}>
          <div className="space-y-2">
            {car.recentExpenses.map((exp, i) => {
              const Icon = expenseIcon[exp.type] ?? Wrench
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/40 p-3 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{exp.type}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatDate(exp.date)}
                      {exp.note ? ` · ${exp.note}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-rose-700">
                    -{formatMoney(exp.amount, currency)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <TrendingUp className="h-4 w-4 text-slate-300" />
      </div>
      {children}
    </div>
  )
}

function KpiTile({
  label,
  value,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
  highlight?: "emerald" | "rose"
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight === "emerald" && "border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white",
        highlight === "rose" && "border-rose-200 bg-gradient-to-br from-rose-50/70 to-white",
        !highlight && "border-slate-200/70 bg-white",
      )}
    >
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset", accent)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </div>
      <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          highlight === "emerald" && "text-emerald-700",
          highlight === "rose" && "text-rose-700",
          !highlight && "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  )
}
