"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Users } from "lucide-react"
import { toast } from "sonner"
import {
  createClientAction,
  deleteClientAction,
  updateClientAction,
} from "@/modules/clients/actions/create-client.action"
import type { ClientListDto } from "@/modules/clients/dto/client-response.dto"
import type { Client, ClientStatus, Nationality } from "@/lib/clients-data"
import { ClientsFilters, type SortKey } from "@/components/clients/clients-filters"
import { ClientRow } from "@/components/clients/client-row"
import { ClientCompactRow } from "@/components/clients/client-compact-row"
import { ClientDetailPanel } from "@/components/clients/client-detail-panel"
import {
  ClientFormDialog,
  type ClientFormValues,
} from "@/components/clients/client-form-dialog"
import { ClientDeleteDialog } from "@/components/clients/client-delete-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import fr from "@/translations/fr"

type Props = {
  initialResult: ClientListDto
  initialFilters: {
    search: string
    nationality: Nationality | "all" | "etranger"
    status: ClientStatus | "all"
    sort: SortKey
  }
}

const MESSAGES: Record<string, string> = {
  "clients.errors.validation": "Veuillez vérifier les informations du client.",
  "clients.errors.forbidden": "Vous n'avez pas la permission d'effectuer cette action.",
  "clients.errors.planLimitExceeded": "La limite de clients de votre plan serait dépassée.",
  "clients.errors.duplicateContact": "Un client actif utilise déjà cet e-mail ou téléphone.",
  "clients.errors.typeChangeNotAllowed": "Le type de client ne peut pas être modifié.",
  "clients.errors.deleteBlockedByActiveRecords":
    "Ce client a des réservations ou contrats actifs et ne peut pas être supprimé.",
  "clients.errors.notFound": "Client introuvable.",
  "clients.errors.generic": "Impossible d'enregistrer cette opération pour le moment.",
}

function actionMessage(messageKey: string) {
  return MESSAGES[messageKey] ?? MESSAGES["clients.errors.generic"]
}

function buildClientQueryString(input: {
  currentQueryString: string
  search: string
  nationalityFilter: Nationality | "all" | "etranger"
  statusFilter: ClientStatus | "all"
  sort: SortKey
}) {
  const params = new URLSearchParams(input.currentQueryString)
  const trimmedSearch = input.search.trim()

  if (trimmedSearch) params.set("search", trimmedSearch)
  else params.delete("search")
  if (input.nationalityFilter !== "all") params.set("nationality", input.nationalityFilter)
  else params.delete("nationality")
  if (input.statusFilter !== "all") params.set("status", input.statusFilter)
  else params.delete("status")
  if (input.sort !== "lastRental") params.set("sort", input.sort)
  else params.delete("sort")
  params.delete("page")

  return params.toString()
}

export function ClientsPageClient({ initialResult, initialFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQueryString = searchParams.toString()
  const lastRequestedQueryRef = useRef<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>(initialResult.data)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.search)
  const [nationalityFilter, setNationalityFilter] = useState<Nationality | "all" | "etranger">(
    initialFilters.nationality,
  )
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">(initialFilters.status)
  const [sort, setSort] = useState<SortKey>(initialFilters.sort)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [isTableLoading, setIsTableLoading] = useState(false)

  useEffect(() => {
    if (lastRequestedQueryRef.current === currentQueryString) {
      lastRequestedQueryRef.current = null
      setIsTableLoading(false)
    }
  }, [currentQueryString])

  useEffect(() => {
    setClients(initialResult.data)
    setIsTableLoading(false)
    setSelectedId((current) =>
      current && initialResult.data.some((client) => client.id === current) ? current : null,
    )
  }, [initialResult])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQueryString = buildClientQueryString({
        currentQueryString,
        search,
        nationalityFilter,
        statusFilter,
        sort,
      })
      if (
        nextQueryString === currentQueryString ||
        nextQueryString === lastRequestedQueryRef.current
      ) {
        return
      }

      lastRequestedQueryRef.current = nextQueryString
      setIsTableLoading(true)
      startTransition(() => {
        router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, {
          scroll: false,
        })
      })
    }, 250)

    return () => window.clearTimeout(handle)
  }, [currentQueryString, nationalityFilter, pathname, router, search, sort, statusFilter])

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) ?? null,
    [clients, selectedId],
  )

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

  const submitForm = async (values: ClientFormValues) => {
    const result =
      formMode === "create"
        ? await createClientAction(values)
        : await updateClientAction({ ...values, customerId: editingClient?.id })

    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }

    toast.success(formMode === "create" ? "Client ajouté" : "Client mis à jour")
    setFormOpen(false)
    router.refresh()
    return true
  }

  const confirmDelete = async () => {
    if (!deletingClient) return false
    const result = await deleteClientAction({ customerId: deletingClient.id })
    if (!result.success) {
      toast.error(actionMessage(result.messageKey))
      return false
    }

    toast.success("Client supprimé")
    setDeleteOpen(false)
    if (selectedId === deletingClient.id) setSelectedId(null)
    router.refresh()
    return true
  }

  const exportData = () => {
    toast.info("Export non configuré", {
      description: "Les données affichées sont prêtes, mais aucun export externe n'est branché.",
    })
  }

  const hasSelection = !!selectedClient
  const total = initialResult.pagination.total
  const tableLoading = isTableLoading || isPending

  return (
    <div className="mx-auto max-w-[1600px]">
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
              <span className="text-xs font-bold text-slate-900 tabular-nums">{total}</span>
              <span className="text-[10px] font-medium text-slate-500">au total</span>
            </motion.div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            CRM centralisé · identité, historique, dépenses et notes internes par client.
          </p>
        </div>
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
                  resultCount={total}
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
                  resultCount={total}
                  compact
                />
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {clients.length} client{clients.length > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {clients.length === 0 && !tableLoading ? (
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
              {clients.map((client) => (
                <ClientCompactRow
                  key={client.id}
                  client={client}
                  selected={client.id === selectedId}
                  onSelect={() => setSelectedId(client.id)}
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
                      {fr.clients.finance.paidAmount}
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
                  {tableLoading ? (
                    <ClientTableSkeletonRows />
                  ) : (
                    <AnimatePresence initial={false}>
                      {clients.map((client) => (
                        <ClientRow
                          key={client.id}
                          client={client}
                          selected={client.id === selectedId}
                          onSelect={() => setSelectedId(client.id)}
                          onEdit={() => openEdit(client)}
                          onDelete={() => openDelete(client)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

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

function ClientTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <tr key={index} className="border-b border-slate-100 last:border-0">
          <td className="py-3 pl-5 pr-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-3.5 w-28" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-3.5 w-24" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="mx-auto h-3.5 w-10" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="ml-auto h-3.5 w-20" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-3.5 w-20" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="py-3 pl-3 pr-5">
            <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
          </td>
        </tr>
      ))}
    </>
  )
}
