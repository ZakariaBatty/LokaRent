"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence } from "motion/react"
import { Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { type Driver, driverFullName } from "@/lib/drivers-data"
import type { DriverListDto } from "@/modules/drivers/dto/driver-response.dto"
import {
  createDriverAction,
  deleteDriverAction,
  updateDriverAction,
} from "@/modules/drivers/actions/create-driver.action"
import { DriversKpiBar } from "@/components/drivers/drivers-kpi-bar"
import { DriversFilters, type DriversFiltersState } from "@/components/drivers/drivers-filters"
import { DriversTable } from "@/components/drivers/drivers-table"
import { DriverDetailPanel } from "@/components/drivers/driver-detail-panel"
import { DriverFormPanel, type DriverFormValues } from "@/components/drivers/driver-form-panel"
import fr from "@/translations/fr"

type Props = {
  initialResult: DriverListDto
  initialFilters: DriversFiltersState
  canDelete: boolean
}

const MESSAGES: Record<string, string> = {
  "drivers.errors.validation": fr.drivers.errors.validation,
  "drivers.errors.forbidden": fr.drivers.errors.forbidden,
  "drivers.errors.notFound": fr.drivers.errors.notFound,
  "drivers.errors.invalidStatusTransition": fr.drivers.errors.invalidStatusTransition,
  "drivers.errors.pricingAmountRequired": fr.drivers.errors.pricingAmountRequired,
  "drivers.errors.invalidDocumentDates": fr.drivers.errors.invalidDocumentDates,
  "drivers.errors.deleteBlocked": fr.drivers.errors.deleteBlocked,
  "drivers.errors.generic": fr.drivers.errors.generic,
}

function actionMessage(messageKey: string) {
  return MESSAGES[messageKey] ?? MESSAGES["drivers.errors.generic"]
}

function buildQueryString(input: { currentQueryString: string; filters: DriversFiltersState }) {
  const params = new URLSearchParams(input.currentQueryString)
  const search = input.filters.search.trim()
  if (search) params.set("search", search)
  else params.delete("search")
  if (input.filters.status !== "all") params.set("status", input.filters.status)
  else params.delete("status")
  if (input.filters.pricingType !== "all") params.set("pricingType", input.filters.pricingType)
  else params.delete("pricingType")
  if (input.filters.sort !== "recent") params.set("sort", input.filters.sort)
  else params.delete("sort")
  params.delete("page")
  return params.toString()
}

function toActionInput(values: DriverFormValues, driverId?: string) {
  return {
    ...(driverId ? { driverId } : {}),
    reference: values.reference || undefined,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone || undefined,
    email: values.email || undefined,
    status: values.status,
    notes: values.notes || undefined,
    pricingType: values.paymentType,
    monthlyRate: values.paymentType === "monthly" && values.monthlySalary ? Number(values.monthlySalary) : undefined,
    hourlyRate: values.paymentType === "hourly" && values.pricePerHour ? Number(values.pricePerHour) : undefined,
    missionRate: values.paymentType === "mission" && values.pricePerMission ? Number(values.pricePerMission) : undefined,
    pricingCurrency: "MAD",
    pricingValidFrom: new Date().toISOString(),
    documents: [
      {
        type: "national_id",
        documentNumber: values.cinNumber || undefined,
        expiresAt: values.cinExpiry || undefined,
        documentUrl: values.cinDocumentUrl || undefined,
      },
      {
        type: "driving_license",
        documentNumber: values.licenseNumber || undefined,
        expiresAt: values.licenseExpiry || undefined,
        documentUrl: values.licenseDocumentUrl || undefined,
      },
    ],
  }
}

export function DriversPageClient({ initialResult, initialFilters, canDelete }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQueryString = searchParams.toString()
  const lastRequestedQueryRef = useRef<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [drivers, setDrivers] = useState<Driver[]>(initialResult.data)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<DriversFiltersState>(initialFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [loadingRows, setLoadingRows] = useState(false)

  useEffect(() => {
    if (lastRequestedQueryRef.current === currentQueryString) {
      lastRequestedQueryRef.current = null
      setLoadingRows(false)
    }
  }, [currentQueryString])

  useEffect(() => {
    setDrivers(initialResult.data)
    setLoadingRows(false)
    setSelectedId((current) =>
      current && initialResult.data.some((driver) => driver.id === current) ? current : null,
    )
  }, [initialResult])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQueryString = buildQueryString({ currentQueryString, filters })
      if (nextQueryString === currentQueryString || nextQueryString === lastRequestedQueryRef.current) return
      lastRequestedQueryRef.current = nextQueryString
      setLoadingRows(true)
      startTransition(() => {
        router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false })
      })
    }, 250)

    return () => window.clearTimeout(handle)
  }, [currentQueryString, filters, pathname, router])

  const selected = useMemo(() => drivers.find((driver) => driver.id === selectedId) ?? null, [drivers, selectedId])
  const isLoading = loadingRows || isPending

  const openCreate = () => {
    setEditingDriver(null)
    setFormMode("create")
    setFormOpen(true)
  }

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setFormMode("edit")
    setFormOpen(true)
  }

  const handleDelete = async (driver: Driver) => {
    const confirmed = window.confirm(fr.drivers.deleteDialog.description)
    if (!confirmed) return
    const result = await deleteDriverAction({ driverId: driver.id })
    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return
    }
    toast.success(fr.drivers.driverDeleted, { description: driverFullName(driver) })
    setSelectedId((current) => (current === driver.id ? null : current))
    router.refresh()
  }

  const handleSubmit = async (values: DriverFormValues) => {
    const result =
      formMode === "create"
        ? await createDriverAction(toActionInput(values))
        : await updateDriverAction(toActionInput(values, editingDriver?.id))
    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }
    toast.success(formMode === "create" ? fr.drivers.driverAdded : fr.drivers.driverUpdated)
    setFormOpen(false)
    setEditingDriver(null)
    router.refresh()
    return true
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-slate-900">{fr.drivers.title}</h1>
            <p className="text-xs text-slate-500">
              {initialResult.pagination.total} {fr.drivers.registeredDrivers}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          {fr.drivers.addDriver}
        </button>
      </div>

      <DriversKpiBar drivers={drivers} />
      <DriversFilters filters={filters} onChange={setFilters} total={initialResult.pagination.total} />

      <div className={`flex min-h-0 flex-1 gap-4 ${selected ? "grid grid-cols-[1fr_minmax(440px,520px)]" : ""}`}>
        <div className="min-h-0 overflow-y-auto">
          <DriversTable
            drivers={drivers}
            selectedId={selectedId}
            onSelect={(driver) => setSelectedId(driver.id)}
            onEdit={openEdit}
            onDelete={handleDelete}
            loading={isLoading}
            canDelete={canDelete}
          />
        </div>

        <AnimatePresence>
          {selected && (
            <div className="min-h-0 overflow-y-auto max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:bg-white">
              <DriverDetailPanel
                driver={selected}
                onClose={() => setSelectedId(null)}
                onEdit={() => openEdit(selected)}
                onDelete={() => handleDelete(selected)}
                canDelete={canDelete}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <DriverFormPanel
        open={formOpen}
        mode={formMode}
        driver={editingDriver}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
