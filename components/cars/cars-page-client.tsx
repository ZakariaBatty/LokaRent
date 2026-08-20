"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Car as CarIcon } from "lucide-react"
import { toast } from "sonner"
import { type Car, type CarStatus, type CarCategory } from "@/lib/cars-data"
import type { CarListDto } from "@/modules/cars/dto/car-response.dto"
import { createCarAction, deleteCarAction, updateCarAction, updateVehicleDocumentAction } from "@/modules/cars/actions/create-car.action"
import { mapUiFuel, mapUiStatus } from "@/modules/cars/mappers/car.mapper"
import { CarsFilters } from "@/components/cars/cars-filters"
import { CarCard } from "@/components/cars/car-card"
import { CarListRow } from "@/components/cars/car-list-row"
import { CarCompactRow } from "@/components/cars/car-compact-row"
import { CarDetailPanel } from "@/components/cars/car-detail-panel"
import { CarDeleteDialog } from "@/components/cars/car-delete-dialog"
import { CarFormPanel, type CarFormDraft } from "@/components/cars/car-form-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

type DocumentType = "insurance" | "registration" | "vignette" | "inspection"
type DocumentDraft = Record<string, string | number | undefined>

type Props = {
  initialResult: CarListDto
  initialFilters: {
    search: string
    status: CarStatus | "all"
    category: CarCategory | "all"
  }
  categories: { id: string; name: string }[]
  canDelete: boolean
}

const MESSAGES: Record<string, string> = {
  "fleet.errors.validation": fr.fleet.errors.validation,
  "fleet.errors.forbidden": fr.fleet.errors.forbidden,
  "fleet.errors.planLimitExceeded": fr.fleet.errors.planLimitExceeded,
  "fleet.errors.duplicatePlate": fr.fleet.errors.duplicatePlate,
  "fleet.errors.duplicateCode": fr.fleet.errors.duplicateCode,
  "fleet.errors.invalidStatusTransition": fr.fleet.errors.invalidStatusTransition,
  "fleet.errors.mileageCannotDecrease": fr.fleet.errors.mileageCannotDecrease,
  "fleet.errors.deleteBlocked": fr.fleet.errors.deleteBlocked,
  "fleet.errors.invalidPricingTarget": fr.fleet.errors.invalidPricingTarget,
  "fleet.errors.invalidPricingDates": fr.fleet.errors.invalidPricingDates,
  "fleet.errors.emptyPricingRule": fr.fleet.errors.emptyPricingRule,
  "fleet.errors.notFound": fr.fleet.errors.notFound,
  "fleet.errors.generic": fr.fleet.errors.generic,
}

function actionMessage(messageKey: string) {
  return MESSAGES[messageKey] ?? MESSAGES["fleet.errors.generic"]
}

function buildQueryString(input: {
  currentQueryString: string
  search: string
  status: CarStatus | "all"
  category: CarCategory | "all"
}) {
  const params = new URLSearchParams(input.currentQueryString)
  const trimmedSearch = input.search.trim()

  if (trimmedSearch) params.set("search", trimmedSearch)
  else params.delete("search")
  if (input.status !== "all") params.set("status", input.status)
  else params.delete("status")
  if (input.category !== "all") params.set("category", input.category)
  else params.delete("category")
  params.delete("page")

  return params.toString()
}

function categoryNameForDraft(category: CarCategory) {
  if (category === "Citadine") return "Economy"
  if (category === "Berline") return "Sedan"
  if (category === "Utilitaire") return "Van"
  return "SUV"
}

function categoryIdForDraft(categories: Props["categories"], category: CarCategory) {
  const name = categoryNameForDraft(category)
  return categories.find((item) => item.name === name || item.name === category)?.id
}

function toActionInput(draft: CarFormDraft, categories: Props["categories"], vehicleId?: string) {
  const categoryId = categoryIdForDraft(categories, draft.category)
  return {
    ...(vehicleId ? { vehicleId } : {}),
    categoryId,
    categoryName: categoryId ? undefined : categoryNameForDraft(draft.category),
    brand: draft.brand,
    model: draft.model,
    year: Number(draft.year),
    plate: draft.plate,
    color: draft.color,
    fuelType: mapUiFuel(draft.fuel),
    transmission: "manual",
    seats: draft.seats === "" ? undefined : Number(draft.seats),
    status: mapUiStatus(draft.status),
    mileage: draft.km === "" ? undefined : Number(draft.km),
    dailyRate: draft.priceDay === "" ? undefined : Number(draft.priceDay),
    weeklyRate: draft.priceWeek === "" ? undefined : Number(draft.priceWeek),
    monthlyRate: draft.priceMonth === "" ? undefined : Number(draft.priceMonth),
    depositAmount: draft.depositAmount === "" ? undefined : Number(draft.depositAmount),
    mileageLimit: draft.mileageLimit === "" ? undefined : Number(draft.mileageLimit),
    extraMileageRate: draft.extraMileageRate === "" ? undefined : Number(draft.extraMileageRate),
    photos: draft.photos,
    pricingCurrency: "MAD",
    pricingValidFrom: new Date().toISOString(),
    insuranceProvider: draft.insuranceCompany,
    insurancePolicyNumber: draft.insurancePolicyNumber || (draft.insuranceCompany ? draft.plate : undefined),
    insuranceStartsAt: draft.insuranceStart || (draft.insuranceEnd ? new Date().toISOString() : undefined),
    insuranceExpiresAt: draft.insuranceEnd || undefined,
    insurancePremiumAmount: draft.insurancePremiumAmount === "" ? undefined : Number(draft.insurancePremiumAmount),
    insuranceCurrency: "MAD",
    insuranceDocumentUrl: draft.insuranceDocumentUrl || undefined,
    registrationNumber: draft.registrationNumber || undefined,
    registrationIssuedAt: draft.registrationIssuedAt || undefined,
    registrationExpiresAt: draft.registrationExpiresAt || undefined,
    registrationIssuingAuthority: draft.registrationIssuingAuthority || undefined,
    registrationDocumentUrl: draft.registrationDocumentUrl || undefined,
    vignetteTaxYear: draft.vignetteTaxYear === "" ? (draft.vignetteEnd ? new Date(draft.vignetteEnd).getFullYear() : undefined) : Number(draft.vignetteTaxYear),
    vignettePaidAt: draft.vignettePaidAt || (draft.vignetteEnd ? new Date().toISOString() : undefined),
    vignetteExpiresAt: draft.vignetteEnd || undefined,
    vignetteAmount: draft.vignetteAmount === "" ? undefined : Number(draft.vignetteAmount),
    vignetteCurrency: "MAD",
    vignetteDocumentUrl: draft.vignetteDocumentUrl || undefined,
    inspectionInspectedAt: draft.visiteLast || (draft.visiteNext ? new Date().toISOString() : undefined),
    inspectionExpiresAt: draft.visiteNext || undefined,
    inspectionResult: draft.visiteNext ? draft.inspectionResult : undefined,
    inspectionCenter: draft.inspectionCenter || undefined,
    inspectionCost: draft.inspectionCost === "" ? undefined : Number(draft.inspectionCost),
    inspectionCurrency: "MAD",
    inspectionDocumentUrl: draft.inspectionDocumentUrl || undefined,
  }
}

export function CarsPageClient({ initialResult, initialFilters, categories: categoryRows, canDelete }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQueryString = searchParams.toString()
  const lastRequestedQueryRef = useRef<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [cars, setCars] = useState<Car[]>(initialResult.data)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.search)
  const [statuses, setStatuses] = useState<CarStatus[]>(
    initialFilters.status === "all" ? [] : [initialFilters.status],
  )
  const [categories, setCategories] = useState<CarCategory[]>(
    initialFilters.category === "all" ? [] : [initialFilters.category],
  )
  const [smartFilters, setSmartFilters] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null)
  const [formScope, setFormScope] = useState<"core" | "documents">("core")
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [deletingCar, setDeletingCar] = useState<Car | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)

  useEffect(() => {
    if (lastRequestedQueryRef.current === currentQueryString) {
      lastRequestedQueryRef.current = null
      setLoadingRows(false)
    }
  }, [currentQueryString])

  useEffect(() => {
    setCars(initialResult.data)
    setLoadingRows(false)
    setSelectedId((current) =>
      current && initialResult.data.some((car) => car.id === current) ? current : null,
    )
  }, [initialResult])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQueryString = buildQueryString({
        currentQueryString,
        search,
        status: statuses[0] ?? "all",
        category: categories[0] ?? "all",
      })
      if (nextQueryString === currentQueryString || nextQueryString === lastRequestedQueryRef.current) return

      lastRequestedQueryRef.current = nextQueryString
      setLoadingRows(true)
      startTransition(() => {
        router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, {
          scroll: false,
        })
      })
    }, 250)

    return () => window.clearTimeout(handle)
  }, [categories, currentQueryString, pathname, router, search, statuses])

  const selectedCar = useMemo(
    () => cars.find((car) => car.id === selectedId) ?? null,
    [cars, selectedId],
  )
  const visibleCars = cars
  const hasSelection = !!selectedCar
  const isLoading = loadingRows || isPending

  const toggleStatus = (status: CarStatus) => {
    setStatuses((current) => (current[0] === status ? [] : [status]))
  }
  const toggleCategory = (category: CarCategory) => {
    setCategories((current) => (current[0] === category ? [] : [category]))
  }
  const clearFilters = () => {
    setSearch("")
    setStatuses([])
    setCategories([])
    setSmartFilters(false)
  }
  const openAddForm = () => {
    setEditingCar(null)
    setFormScope("core")
    setFormMode("add")
  }
  const openEditForm = (car: Car) => {
    setEditingCar(car)
    setFormScope("core")
    setFormMode("edit")
  }
  const openDocumentsForm = (car: Car) => {
    setEditingCar(car)
    setFormScope("documents")
    setFormMode("edit")
  }
  const closeForm = () => {
    setFormMode(null)
    setFormScope("core")
    setEditingCar(null)
  }
  const openDelete = (car: Car) => {
    setDeletingCar(car)
    setDeleteOpen(true)
  }
  const handleFormSubmit = async (draft: CarFormDraft) => {
    const result =
      formMode === "add"
        ? await createCarAction(toActionInput(draft, categoryRows))
        : await updateCarAction(toActionInput(draft, categoryRows, editingCar?.id))

    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }
    toast.success(formMode === "add" ? fr.fleet.vehicleAdded : fr.fleet.vehicleUpdated)
    closeForm()
    router.refresh()
    return true
  }

  const handleDocumentSave = async (car: Car, documentType: DocumentType, draft: DocumentDraft) => {
    const result = await updateVehicleDocumentAction({
      vehicleId: car.id,
      documentType,
      ...draft,
    })
    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }
    toast.success(fr.fleet.vehicleUpdated)
    router.refresh()
    return true
  }
  const confirmDelete = async () => {
    if (!deletingCar) return false
    const result = await deleteCarAction({ vehicleId: deletingCar.id })
    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }

    toast.success(fr.fleet.vehicleDeleted)
    setDeleteOpen(false)
    setSelectedId((current) => (current === deletingCar.id ? null : current))
    router.refresh()
    return true
  }

  return (
    <div className="mx-auto max-w-[1600px]">
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
              <span className="text-xs font-bold text-slate-900 tabular-nums">
                {initialResult.pagination.total}
              </span>
              <span className="text-[10px] font-medium text-slate-500">véhicules</span>
            </motion.div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gestion centralisée de votre parc · documents, finances et historique en un coup d&apos;œil.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)]"
        >
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

      <div className="flex gap-5">
        <motion.div
          layout
          animate={{ width: hasSelection ? "20%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
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
                  onToggleSmartFilters={() => setSmartFilters((value) => !value)}
                  view={view}
                  onChangeView={setView}
                  onClear={clearFilters}
                  resultCount={initialResult.pagination.total}
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
                  onToggleSmartFilters={() => setSmartFilters((value) => !value)}
                  view={view}
                  onChangeView={setView}
                  onClear={clearFilters}
                  resultCount={initialResult.pagination.total}
                  compact
                />
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {visibleCars.length} véhicule{visibleCars.length > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {visibleCars.length === 0 && !isLoading ? (
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
          ) : isLoading ? (
            <CarCollectionSkeleton view={view} compact={hasSelection} />
          ) : hasSelection ? (
            <div className="space-y-2">
              {visibleCars.map((car) => (
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
              className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}
            >
              {visibleCars.map((car) => (
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
              {visibleCars.map((car) => (
                <CarListRow
                  key={car.id}
                  car={car}
                  selected={car.id === selectedId}
                  onSelect={() => setSelectedId(car.id)}
                />
              ))}
            </motion.div>
          )}

        </motion.div>

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
                onEditDocuments={() => openDocumentsForm(selectedCar)}
                onSaveDocument={(documentType, draft) => handleDocumentSave(selectedCar, documentType, draft)}
                onDelete={() => openDelete(selectedCar)}
                canDelete={canDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                scope={formScope}
                car={editingCar}
                onClose={closeForm}
                onSubmit={handleFormSubmit}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CarDeleteDialog
        open={deleteOpen}
        car={deletingCar}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function CarCollectionSkeleton({ view, compact }: { view: "grid" | "list"; compact: boolean }) {
  if (compact || view === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: compact ? 8 : 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            {!compact && <Skeleton className="h-6 w-24 rounded-full" />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <Skeleton className="h-14 w-20 rounded-xl" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-5 h-8 w-28" />
          <div className="mt-4 border-t border-slate-200/70 pt-4">
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
