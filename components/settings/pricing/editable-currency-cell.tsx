"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Check, X } from "lucide-react"

export function EditableCurrencyCell({
  value,
  onChange,
  suggestion,
  highlight,
}: {
  value: number
  onChange: (next: number) => void
  suggestion?: number
  highlight?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const parsed = Number(draft.replace(/[^0-9.-]/g, ""))
    if (!Number.isNaN(parsed) && parsed !== value) onChange(Math.max(0, Math.round(parsed)))
    setEditing(false)
  }

  function cancel() {
    setDraft(String(value))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") cancel()
            }}
            className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 pr-9 text-sm font-semibold text-slate-900 outline-none ring-4 ring-indigo-100 transition"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            DH
          </span>
        </div>
        <button
          type="button"
          onClick={commit}
          className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500 text-white transition hover:bg-emerald-600"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  const showSuggestion = suggestion !== undefined && suggestion !== value
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group relative flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40 ${
        highlight ? "bg-amber-50/40" : ""
      }`}
    >
      <motion.span
        key={value}
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="font-semibold tabular-nums text-slate-900"
      >
        {new Intl.NumberFormat("fr-FR").format(value)}{" "}
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">DH</span>
      </motion.span>
      {showSuggestion && (
        <span className="hidden text-[10px] font-medium text-slate-400 group-hover:inline">
          ≈ {new Intl.NumberFormat("fr-FR").format(suggestion!)}
        </span>
      )}
    </button>
  )
}
