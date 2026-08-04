"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Mail,
  MoreHorizontal,
  Pencil,
  PowerOff,
  RefreshCw,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import {
  formatExpirationCountdown,
  formatLastConnection,
  type TeamUser,
} from "@/lib/users-data"
import { UserAvatar } from "./user-avatar"
import { RoleBadge } from "./role-badge"
import { StatusBadge } from "./status-badge"

export function TeamTable({
  users,
  onRoleChange,
  onDeactivate,
  onDelete,
  onResend,
  onCancelInvite,
}: {
  users: TeamUser[]
  onRoleChange: (id: string) => void
  onDeactivate: (id: string) => void
  onDelete: (id: string) => void
  onResend: (id: string) => void
  onCancelInvite: (id: string) => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TeamUser | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    if (openMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openMenu])

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Membres de l&apos;équipe</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {users.length} {users.length > 1 ? "utilisateurs" : "utilisateur"}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <CheckCircle2 className="h-3 w-3" />
              {users.filter((u) => u.status === "Actif").length} actifs
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {users.map((user, idx) => {
                  const isPending = user.status === "Invitation en attente"
                  const expiry = user.expiresAt
                    ? formatExpirationCountdown(user.expiresAt)
                    : null
                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="group border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={user.status} />
                          {expiry && (
                            <span
                              className={`text-[10px] font-medium ${
                                expiry.urgent ? "text-rose-600" : "text-slate-500"
                              }`}
                            >
                              {expiry.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-700">
                          {formatLastConnection(user.lastConnection)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {openMenu === user.id && (
                              <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.18 }}
                                className="absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-200/70 bg-white p-1 text-left shadow-xl shadow-slate-900/10"
                              >
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onResend(user.id)
                                        setOpenMenu(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      Renvoyer l&apos;invitation
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onCancelInvite(user.id)
                                        setOpenMenu(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                                    >
                                      <X className="h-4 w-4" />
                                      Annuler l&apos;invitation
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onRoleChange(user.id)
                                        setOpenMenu(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Modifier le rôle
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeactivate(user.id)
                                        setOpenMenu(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"
                                    >
                                      <PowerOff className="h-4 w-4" />
                                      {user.status === "Actif" ? "Désactiver" : "Réactiver"}
                                    </button>
                                    <div className="my-1 h-px bg-slate-100" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDelete(user)
                                        setOpenMenu(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Supprimer
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl">
                <div className="flex items-start gap-4 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                      Supprimer cet utilisateur ?
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {confirmDelete.firstName} {confirmDelete.lastName}
                      </span>{" "}
                      perdra définitivement l&apos;accès à LokaRent. Cette action est irréversible.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(confirmDelete.id)
                      toast.success(
                        `${confirmDelete.firstName} ${confirmDelete.lastName} a été supprimé`
                      )
                      setConfirmDelete(null)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
