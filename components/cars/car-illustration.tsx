"use client"

import type { CarCategory } from "@/lib/cars-data"
import { Car as CarIcon, Truck } from "lucide-react"

export function CarIllustration({
  category,
  size = "md",
}: {
  category: CarCategory
  size?: "sm" | "md" | "lg"
}) {
  const sizeMap = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  }
  const iconSize = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  }

  const config: Record<CarCategory, { ring: string; bg: string; text: string }> = {
    Citadine: {
      ring: "ring-sky-200/60",
      bg: "from-sky-100 to-sky-50",
      text: "text-sky-700",
    },
    Berline: {
      ring: "ring-indigo-200/60",
      bg: "from-indigo-100 to-indigo-50",
      text: "text-indigo-700",
    },
    SUV: {
      ring: "ring-emerald-200/60",
      bg: "from-emerald-100 to-emerald-50",
      text: "text-emerald-700",
    },
    Utilitaire: {
      ring: "ring-amber-200/60",
      bg: "from-amber-100 to-amber-50",
      text: "text-amber-700",
    },
  }

  const c = config[category]
  const Icon = category === "Utilitaire" ? Truck : CarIcon

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-2xl bg-gradient-to-br ${c.bg} ring-1 ${c.ring} shadow-sm`}
    >
      <Icon className={`${iconSize[size]} ${c.text}`} strokeWidth={1.6} />
    </div>
  )
}
