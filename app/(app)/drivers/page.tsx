"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus, CarFront } from "lucide-react"
import { toast } from "sonner"
import {
  type Driver,
  type PaymentType,
  type DriverStatus,
  drivers as initialDrivers,
  driverFullName,
} from "@/lib/drivers-data"
import { DriversKpiBar } from "@/components/drivers/drivers-kpi-bar"
import { DriversFilters, type DriversFiltersState } from "@/components/drivers/drivers-filters"
import { DriversTable } from "@/components/drivers/drivers-table"
import { DriverDetailPanel } from "@/components/drivers/driver-detail-panel"
import { DriverFormPanel, type DriverFormValues } from "@/components/drivers/driver-form-panel"

type FormMode = "create" | "edit"

export default function DriversPage() {
  const [driverList, setDriverList] = useState<Driver[]>(initialDrivers)
  const [selected, setSelected] = useState<Driver | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  const [filters, setFilters] = useState<DriversFiltersState>({
    search: "",
    status: "all",
    paymentType: "all",
    sort: "recent",
  })

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    let list = driverList.filter((d) => {
      if (filters.status !== "all" && d.status !== filters.status) return false
      if (filters.paymentType !== "all" && d.paymentType !== filters.paymentType) return false
      if (q) {
        const hay = `${d.firstName} ${d.lastName} ${d.phone} ${d.email} ${d.city}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (filters.sort === "name_asc") return driverFullName(a).localeCompare(driverFullName(b))
      if (filters.sort === "assignments_desc") return b.totalAssignments - a.totalAssignments
      if (filters.sort === "earned_desc") return b.totalEarned - a.totalEarned
      // recent: hireDate desc
      return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime()
    })

    return list
  }, [driverList, filters])

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

  const handleDelete = (driver: Driver) => {
    setDriverList((curr) => curr.filter((d) => d.id !== driver.id))
    if (selected?.id === driver.id) setSelected(null)
    toast.error("Chauffeur supprimé", {
      description: `${driverFullName(driver)} a été retiré du système.`,
    })
  }

  const handleSubmit = (values: DriverFormValues) => {
    if (formMode === "create") {
      const newDriver: Driver = {
        id: `d${Date.now()}`,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        city: values.city,
        cinNumber: values.cinNumber,
        cinExpiry: values.cinExpiry,
        licenseNumber: values.licenseNumber,
        licenseExpiry: values.licenseExpiry,
        licenseCategory: values.licenseCategory,
        status: values.status,
        paymentType: values.paymentType,
        hireDate: new Date().toISOString(),
        totalAssignments: 0,
        totalEarned: 0,
        currentRate: {
          id: `rate-${Date.now()}`,
          type: values.paymentType,
          monthlySalary: values.paymentType === "monthly" ? Number(values.monthlySalary) : undefined,
          pricePerHour: values.paymentType === "mission" ? Number(values.pricePerHour) || undefined : undefined,
          pricePerMission: values.paymentType === "mission" ? Number(values.pricePerMission) : undefined,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: null,
          createdAt: new Date().toISOString(),
        },
        rateHistory: [],
        paymentHistory: [],
        assignments: [],
        documents: [
          { id: `doc-cin-${Date.now()}`, label: "Carte Nationale", type: "cin", scanned: false, expiry: values.cinExpiry },
          { id: `doc-lic-${Date.now()}`, label: "Permis de conduire", type: "license", scanned: false, expiry: values.licenseExpiry },
        ],
      }
      setDriverList((curr) => [newDriver, ...curr])
    } else if (editingDriver) {
      setDriverList((curr) =>
        curr.map((d) =>
          d.id === editingDriver.id
            ? {
                ...d,
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                email: values.email,
                address: values.address,
                city: values.city,
                cinNumber: values.cinNumber,
                cinExpiry: values.cinExpiry,
                licenseNumber: values.licenseNumber,
                licenseExpiry: values.licenseExpiry,
                licenseCategory: values.licenseCategory,
                status: values.status,
                paymentType: values.paymentType,
                currentRate: {
                  ...d.currentRate,
                  type: values.paymentType,
                  monthlySalary: values.paymentType === "monthly" ? Number(values.monthlySalary) : undefined,
                  pricePerHour: values.paymentType === "mission" ? Number(values.pricePerHour) || undefined : undefined,
                  pricePerMission: values.paymentType === "mission" ? Number(values.pricePerMission) : undefined,
                },
              }
            : d,
        ),
      )
      // Update the selected panel if it's the one being edited
      if (selected?.id === editingDriver.id) {
        setSelected((curr) =>
          curr
            ? {
                ...curr,
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                email: values.email,
                address: values.address,
                city: values.city,
                cinNumber: values.cinNumber,
                cinExpiry: values.cinExpiry,
                licenseNumber: values.licenseNumber,
                licenseExpiry: values.licenseExpiry,
                licenseCategory: values.licenseCategory,
                status: values.status as DriverStatus,
                paymentType: values.paymentType as PaymentType,
              }
            : null,
        )
      }
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/20">
            <CarFront className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-slate-900">Chauffeurs</h1>
            <p className="text-xs text-slate-500">
              {driverList.length} chauffeur{driverList.length !== 1 ? "s" : ""} enregistré{driverList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Ajouter un chauffeur
        </button>
      </div>

      {/* KPIs */}
      <DriversKpiBar drivers={driverList} />

      {/* Filters */}
      <DriversFilters filters={filters} onChange={setFilters} total={filtered.length} />

      {/* Table + Detail */}
      <div className={`flex min-h-0 flex-1 gap-4 ${selected ? "grid grid-cols-[1fr_380px]" : ""}`}>
        <div className="min-h-0 overflow-y-auto">
          <DriversTable
            drivers={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>

        <AnimatePresence>
          {selected && (
            <div className="min-h-0 overflow-y-auto">
              <DriverDetailPanel
                driver={selected}
                onClose={() => setSelected(null)}
                onEdit={() => openEdit(selected)}
                onDelete={() => handleDelete(selected)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Form panel */}
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
