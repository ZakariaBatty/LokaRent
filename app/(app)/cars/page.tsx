"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Sparkles, Car as CarIcon } from "lucide-react"
import { type CarStatus, type CarCategory } from "@/lib/cars-data"
import { useAgency } from "@/contexts/agency-context"
import { CarsFilters } from "@/components/cars/cars-filters"
import { CarCard } from "@/components/cars/car-card"
import { CarListRow } from "@/components/cars/car-list-row"
import { CarCompactRow } from "@/components/cars/car-compact-row"
import { CarDetailPanel } from "@/components/cars/car-detail-panel"
import { CarFormPanel, type CarFormDraft } from "@/components/cars/car-form-panel"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CarsPage() {
  const { agencyData } = useAgency()
  const allCars = agencyData.cars

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statuses, setStatuses] = useState<CarStatus[]>([])
  const [categories, setCategories] = useState<CarCategory[]>([])
  const [smartFilters, setSmartFilters] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null)
  const [editingCar, setEditingCar] = useState<typeof allCars[number] | null>(null)

  // Reset selection when agency changes
  useEffect(() => {
    setSelectedId(null)
  }, [agencyData])

  const selectedCar = allCars.find((c) => c.id === selectedId) || null

  const openAddForm = () => {
    setEditingCar(null)
    setFormMode("add")
  }

  const openEditForm = (car: typeof allCars[number]) => {
    setEditingCar(car)
    setFormMode("edit")
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingCar(null)
  }

  const handleFormSubmit = (draft: CarFormDraft) => {
    closeForm()
    toast.success(
      formMode === "add"
        ? `${draft.brand} ${draft.model} ajouté à la flotte`
        : `${draft.brand} ${draft.model} mis à jour`,
    )
  }

  const filteredCars = useMemo(() => {
    let result = allCars.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.plate.toLowerCase().includes(q)
        if (!match) return false
      }
      if (statuses.length > 0 && !statuses.includes(c.status)) return false
      if (categories.length > 0 && !categories.includes(c.category)) return false
      return true
    })

    if (smartFilters) {
      // Rank by profitability + availability
      result = [...result].sort((a, b) => {
        const profitA = (a.revenue - a.expenses) / Math.max(1, a.expenses)
        const profitB = (b.revenue - b.expenses) / Math.max(1, b.expenses)
        const availA = a.status === "disponible" ? 1 : 0
        const availB = b.status === "disponible" ? 1 : 0
        return profitB + availB * 0.5 - (profitA + availA * 0.5)
      })
    }

    return result
  }, [search, statuses, categories, smartFilters])

  const toggleStatus = (s: CarStatus) =>
    setStatuses((curr) => (curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s]))

  const toggleCategory = (c: CarCategory) =>
    setCategories((curr) => (curr.includes(c) ? curr.filter((x) => x !== c) : [...curr, c]))

  const clearFilters = () => {
    setSearch("")
    setStatuses([])
    setCategories([])
    setSmartFilters(false)
  }

  const hasSelection = !!selectedCar

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">Ma Flotte</h1>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm"
            >
              <CarIcon className="h-3 w-3 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 tabular-nums">{allCars.length}</span>
              <span className="text-[10px] font-medium text-slate-500">véhicules</span>
            </motion.div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gestion centralisée de votre parc · documents, finances et historique en un coup d&apos;œil.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)]">
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Ajouter un véhicule</span>
        </button>
      </div>

      {/* Split layout */}
      <div className="flex gap-5">
        {/* LEFT PANEL */}
        <motion.div
          layout
          animate={{ width: hasSelection ? "20%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          {/* Filters (only when full width) */}
          <AnimatePresence mode="wait">
            {!hasSelection ? (
              <motion.div
                key="full-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <CarsFilters
                  search={search}
                  onSearch={setSearch}
                  statuses={statuses}
                  onToggleStatus={toggleStatus}
                  categories={categories}
                  onToggleCategory={toggleCategory}
                  smartFilters={smartFilters}
                  onToggleSmartFilters={() => setSmartFilters((v) => !v)}
                  view={view}
                  onChangeView={setView}
                  onClear={clearFilters}
                  resultCount={filteredCars.length}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compact-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4"
              >
                <CarsFilters
                  search={search}
                  onSearch={setSearch}
                  statuses={statuses}
                  onToggleStatus={toggleStatus}
                  categories={categories}
                  onToggleCategory={toggleCategory}
                  smartFilters={smartFilters}
                  onToggleSmartFilters={() => setSmartFilters((v) => !v)}
                  view={view}
                  onChangeView={setView}
                  onClear={clearFilters}
                  resultCount={filteredCars.length}
                  compact
                />
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {filteredCars.length} véhicule{filteredCars.length > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List rendering */}
          {filteredCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <CarIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Aucun véhicule trouvé</p>
              <p className="mt-1 text-xs text-slate-500">
                Modifiez vos filtres ou ajoutez un nouveau véhicule.
              </p>
              <button
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Effacer les filtres
              </button>
            </div>
          ) : hasSelection ? (
            <div className="space-y-2">
              {filteredCars.map((car) => (
                <CarCompactRow
                  key={car.id}
                  car={car}
                  selected={car.id === selectedId}
                  onSelect={() => setSelectedId(car.id)}
                />
              ))}
            </div>
          ) : view === "grid" ? (
            <motion.div
              layout
              className={cn(
                "grid gap-4",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              )}
            >
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  selected={car.id === selectedId}
                  onSelect={() => setSelectedId(car.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="space-y-2">
              {filteredCars.map((car) => (
                <CarListRow
                  key={car.id}
                  car={car}
                  selected={car.id === selectedId}
                  onSelect={() => setSelectedId(car.id)}
                />
              ))}
            </motion.div>
          )}

          {smartFilters && !hasSelection && filteredCars.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700">
              <Sparkles className="h-3 w-3" />
              Tri intelligent activé · les véhicules les plus rentables sont en haut
            </div>
          )}
        </motion.div>

        {/* RIGHT PANEL */}
        <AnimatePresence>
          {selectedCar && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "80%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="sticky top-4 h-[calc(100vh-7rem)] min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <CarDetailPanel
                car={selectedCar}
                onClose={() => setSelectedId(null)}
                onEdit={() => openEditForm(selectedCar)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add / Edit form drawer */}
      <AnimatePresence>
        {formMode && (
          <>
            <motion.div
              key="form-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="form-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
            >
              <CarFormPanel
                mode={formMode}
                car={editingCar}
                onClose={closeForm}
                onSubmit={handleFormSubmit}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
