"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus, StickyNote, Send } from "lucide-react"
import { type Client, type ClientNote, formatRelative } from "@/lib/clients-data"
import { toast } from "sonner"

export function NotesTab({ client }: { client: Client }) {
  const [notes, setNotes] = useState<ClientNote[]>(client.notes)
  const [body, setBody] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const submit = () => {
    if (!body.trim()) return
    const note: ClientNote = {
      id: `n${Date.now()}`,
      date: new Date().toISOString(),
      author: "Vous",
      body: body.trim(),
    }
    setNotes([note, ...notes])
    setBody("")
    setShowAdd(false)
    toast.success("Note ajoutée", {
      description: "La note a été enregistrée au dossier du client.",
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Notes internes
            <span className="ml-1.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 tabular-nums">
              {notes.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500">Visibles uniquement par votre équipe</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="h-3 w-3" />
            Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-white p-3">
              <textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Décrivez votre note (ex: client fiable, paiement comptant…)"
                rows={3}
                className="block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAdd(false)
                    setBody("")
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  onClick={submit}
                  disabled={!body.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  Publier
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <StickyNote className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Aucune note</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Ajoutez des notes internes pour garder une trace des particularités du client.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative rounded-2xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 text-[10px] font-bold text-white">
                      {note.author[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{note.author}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatRelative(note.date)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{note.body}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
