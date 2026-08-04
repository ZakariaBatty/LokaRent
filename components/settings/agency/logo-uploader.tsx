"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { Camera, Upload } from "lucide-react"

export function LogoUploader({
  initial,
  agencyName,
  onChange,
}: {
  initial?: string | null
  agencyName: string
  onChange: (next: string | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(initial ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = agencyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  function handleFile(file: File | undefined) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(url)
  }

  return (
    <div className="flex items-center gap-5">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
        className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.6)] ring-4 ring-white"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Logo de l'agence"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials || "LR"}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-slate-900/55 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
          <Camera className="h-6 w-6 text-white" />
        </span>
      </motion.button>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Logo de l&apos;agence</p>
        <p className="mt-0.5 text-xs text-slate-500">
          PNG, JPG ou SVG · max 2 Mo · ratio carré recommandé
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Téléverser
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                onChange(null)
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Supprimer
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}
