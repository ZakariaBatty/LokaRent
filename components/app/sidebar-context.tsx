"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type SidebarState = "expanded" | "collapsed" | "hidden"

type SidebarContextValue = {
  state: SidebarState
  setState: (s: SidebarState) => void
  toggleCollapse: () => void
  toggleHide: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  width: number
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

const STORAGE_KEY = "lokarent.sidebar.state"

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<SidebarState>("expanded")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SidebarState | null
      if (stored === "expanded" || stored === "collapsed" || stored === "hidden") {
        setStateInternal(stored)
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  const setState = (s: SidebarState) => {
    setStateInternal(s)
    try {
      localStorage.setItem(STORAGE_KEY, s)
    } catch {
      // ignore
    }
  }

  const toggleCollapse = () => {
    setState(state === "collapsed" ? "expanded" : "collapsed")
  }

  const toggleHide = () => {
    setState(state === "hidden" ? "expanded" : "hidden")
  }

  const width = !hydrated ? 260 : state === "expanded" ? 260 : state === "collapsed" ? 76 : 0

  return (
    <SidebarContext.Provider
      value={{ state, setState, toggleCollapse, toggleHide, mobileOpen, setMobileOpen, width }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
  return ctx
}
