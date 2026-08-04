"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Users } from "lucide-react"
import {
  type Client,
  type ClientStatus,
  type Nationality,
  type ClientType,
} from "@/lib/clients-data"
import { useAgency } from "@/contexts/agency-context"
import { ClientsFilters, type SortKey } from "@/components/clients/clients-filters"
import { ClientRow } from "@/components/clients/client-row"
import { ClientCompactRow } from "@/components/clients/client-compact-row"
import { ClientDetailPanel } from "@/components/clients/client-detail-panel"
import {
  ClientFormDialog,
  type ClientFormValues,
} from "@/components/clients/client-form-dialog"
import { ClientDeleteDialog } from "@/components/clients/client-delete-dialog"
import { toast } from "sonner"

export default function ClientsPage() {
  const { agencyData } = useAgency()
  const initialClients = agencyData.clients
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [nationalityFilter, setNationalityFilter] = useState<Nationality | "all" | "etranger">(
    "all",
  )
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all")
  const [sort, setSort] = useState<SortKey>("lastRental")

  // CRUD modals
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  // Reset when agency changes
  useEffect(() => {
    setClients(agencyData.clients)
    setSelectedId(null)
  }, [agencyData])

  const selectedClient = clients.find((c) => c.id === selectedId) || null

  const filtered = useMemo(() => {
    let result = clients.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          (c.fullName?.toLowerCase().includes(q)) ||
          (c.companyName?.toLowerCase().includes(q)) ||
          c.phone.toLowerCase().includes(q) ||
          (c.idNumber?.toLowerCase().includes(q)) ||
          c.email.toLowerCase().includes(q)
        if (!match) return false
      }
      if (nationalityFilter === "Marocain" && c.nationality !== "Marocain") return false
      if (nationalityFilter === "etranger" && c.nationality === "Marocain") return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      return true
    })

    result = [...result].sort((a, b) => {
      if (sort === "totalSpent") return b.totalSpent - a.totalSpent
      if (sort === "mostActive") return b.totalRentals - a.totalRentals
      // lastRental (default)
      return new Date(b.lastRentalDate).getTime() - new Date(a.lastRentalDate).getTime()
    })

    return result
  }, [clients, search, nationalityFilter, statusFilter, sort])

  const openCreate = () => {
    setFormMode("create")
    setEditingClient(null)
    setFormOpen(true)
  }

  const openEdit = (client: Client) => {
    setFormMode("edit")
    setEditingClient(client)
    setFormOpen(true)
  }

  const openDelete = (client: Client) => {
    setDeletingClient(client)
    setDeleteOpen(true)
  }

  const submitForm = (values: ClientFormValues) => {
    if (formMode === "create") {
      const newClient: Client = {
        id: `c${Date.now()}`,
        type: values.type,
        fullName: values.type === "individual" ? values.fullName : values.companyName,
        phone: values.phone,
        email: values.email,
        city: values.city || "—",
        nationality: values.type === "individual" ? values.nationality : undefined,
        status: "actif",
        tier: "new",
        idType: values.type === "individual" ? values.idType : undefined,
        idNumber: values.type === "individual" ? values.idNumber : undefined,
        idExpiry: values.type === "individual" ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5).toISOString() : undefined,
        idScanned: false,
        licenseNumber: values.type === "individual" ? values.licenseNumber : undefined,
        licenseExpiry: values.type === "individual" ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString() : undefined,
        licenseCategory: "B",
        licenseScanned: false,
        companyName: values.type === "company" ? values.companyName : undefined,
        registrationNumber: values.type === "company" ? values.registrationNumber : undefined,
        taxId: values.type === "company" ? values.taxId : undefined,
        companyEmail: values.type === "company" ? values.companyEmail : undefined,
        companyPhone: values.type === "company" ? values.companyPhone : undefined,
        contactPersonName: values.type === "company" ? values.contactPersonName : undefined,
        contactPersonPhone: values.type === "company" ? values.contactPersonPhone : undefined,
        contactPersonEmail: values.type === "company" ? values.contactPersonEmail : undefined,
        totalRentals: 0,
        totalSpent: 0,
        lastRentalDate: new Date().toISOString(),
        monthly: [0, 0, 0, 0, 0, 0],
        createdAt: new Date().toISOString(),
        reservations: [],
        notes: [],
      }
      setClients((curr) => [newClient, ...curr])
    } else if (editingClient) {
      setClients((curr) =>
        curr.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                type: values.type,
                fullName: values.type === "individual" ? values.fullName : values.companyName,
                phone: values.phone,
                email: values.email,
                city: values.city,
                nationality: values.type === "individual" ? values.nationality : undefined,
                idType: values.type === "individual" ? values.idType : undefined,
                idNumber: values.type === "individual" ? values.idNumber : undefined,
                licenseNumber: values.type === "individual" ? values.licenseNumber : undefined,
                companyName: values.type === "company" ? values.companyName : undefined,
                registrationNumber: values.type === "company" ? values.registrationNumber : undefined,
                taxId: values.type === "company" ? values.taxId : undefined,
                companyEmail: values.type === "company" ? values.companyEmail : undefined,
                companyPhone: values.type === "company" ? values.companyPhone : undefined,
                contactPersonName: values.type === "company" ? values.contactPersonName : undefined,
                contactPersonPhone: values.type === "company" ? values.contactPersonPhone : undefined,
                contactPersonEmail: values.type === "company" ? values.contactPersonEmail : undefined,
              }
            : c,
        ),
      )
    }
  }

  const confirmDelete = () => {
    if (!deletingClient) return
    setClients((curr) => curr.filter((c) => c.id !== deletingClient.id))
    if (selectedId === deletingClient.id) setSelectedId(null)
  }

  const exportData = () => {
    toast.success("Export en cours", {
      description: `${filtered.length} clients seront téléchargés dans quelques instants.`,
    })
  }

  const hasSelection = !!selectedClient

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-slate-900 lg:text-4xl">Clients</h1>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm"
            >
              <Users className="h-3 w-3 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 tabular-nums">
                {clients.length}
              </span>
              <span className="text-[10px] font-medium text-slate-500">au total</span>
            </motion.div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            CRM centralisé · identité, historique, dépenses et notes internes par client.
          </p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-5">
        {/* LEFT — list */}
        <motion.div
          layout
          animate={{ width: hasSelection ? "20%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          {/* Filters */}
          <AnimatePresence mode="wait">
            {!hasSelection ? (
              <motion.div
                key="full-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <ClientsFilters
                  search={search}
                  onSearch={setSearch}
                  nationalityFilter={nationalityFilter}
                  onNationality={setNationalityFilter}
                  statusFilter={statusFilter}
                  onStatus={setStatusFilter}
                  sort={sort}
                  onSort={setSort}
                  onAdd={openCreate}
                  onExport={exportData}
                  resultCount={filtered.length}
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
                <ClientsFilters
                  search={search}
                  onSearch={setSearch}
                  nationalityFilter={nationalityFilter}
                  onNationality={setNationalityFilter}
                  statusFilter={statusFilter}
                  onStatus={setStatusFilter}
                  sort={sort}
                  onSort={setSort}
                  onAdd={openCreate}
                  onExport={exportData}
                  resultCount={filtered.length}
                  compact
                />
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {filtered.length} client{filtered.length > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Aucun client trouvé</p>
              <p className="mt-1 text-xs text-slate-500">
                Modifiez vos filtres ou ajoutez un nouveau client à votre CRM.
              </p>
              <button
                onClick={openCreate}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Ajouter un client
              </button>
            </div>
          ) : hasSelection ? (
            <div className="space-y-2">
              {filtered.map((c) => (
                <ClientCompactRow
                  key={c.id}
                  client={c}
                  selected={c.id === selectedId}
                  onSelect={() => setSelectedId(c.id)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white">
                    <th className="py-3 pl-5 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Client
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Téléphone
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Identité
                    </th>
                    <th className="py-3 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Locations
                    </th>
                    <th className="py-3 px-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total dépensé
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Dernière
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Statut
                    </th>
                    <th className="py-3 pl-3 pr-5"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((c) => (
                      <ClientRow
                        key={c.id}
                        client={c}
                        selected={c.id === selectedId}
                        onSelect={() => setSelectedId(c.id)}
                        onEdit={() => openEdit(c)}
                        onDelete={() => openDelete(c)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* RIGHT — detail panel */}
        <AnimatePresence>
          {selectedClient && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "80%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="sticky top-4 h-[calc(100vh-7rem)] min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <ClientDetailPanel
                client={selectedClient}
                onClose={() => setSelectedId(null)}
                onEdit={() => openEdit(selectedClient)}
                onDelete={() => openDelete(selectedClient)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CRUD modals */}
      <ClientFormDialog
        open={formOpen}
        mode={formMode}
        client={editingClient}
        onClose={() => setFormOpen(false)}
        onSubmit={submitForm}
      />
      <ClientDeleteDialog
        open={deleteOpen}
        client={deletingClient}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
