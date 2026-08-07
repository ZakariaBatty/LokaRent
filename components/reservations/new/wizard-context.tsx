"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { Reservation } from "@/lib/reservations-data"

export type WizardStepId = "client" | "vehicle" | "pricing" | "options" | "summary"

export const STEP_ORDER: WizardStepId[] = [
  "client",
  "vehicle",
  "pricing",
  "options",
  "summary",
]

export const STEP_LABELS: Record<WizardStepId, string> = {
  client: "Client",
  vehicle: "Véhicule & Dates",
  pricing: "Tarification",
  options: "Options",
  summary: "Récapitulatif",
}

export type SelectedClient = {
  id: string
  name: string
  phone: string
  email?: string
  status: "actif" | "blacklist" | "inactif"
  idType: "CIN" | "Passeport"
  idNumber: string
  licenseExpiry?: string // ISO
}

export type ReservationClientOption = {
  id: string
  fullName: string
  phone: string
  email?: string
  status: "actif" | "blacklist" | "inactif"
  idType: "CIN" | "Passeport"
  idNumber: string
  licenseExpiry?: string
  blacklistReason?: string
}

export type ReservationCarOption = {
  id: string
  brand: string
  model: string
  year: number
  plate: string
  category: string
  status: "disponible" | "louee" | "maintenance" | "hors_service"
  priceDay: number
  priceWeek: number
  priceMonth: number
  depositAmount?: number
  mileageLimit?: number
  extraMileageRate?: number
  currency: string
}

export type ReservationSourceOption = {
  id: string
  key: string
  label: string
}

export type NewClientDraft = {
  firstName: string
  lastName: string
  phone: string
  email: string
  idType: "CIN" | "Passeport"
  idNumber: string
  licenseNumber: string
  licenseExpiry: string
}

export type Location =
  | "Agence"
  | "Aéroport CMN"
  | "Aéroport RAK"
  | "Livraison adresse"

export type PaymentMethod = "Cash" | "Chèque" | "Carte" | "Virement"

export type ReservationOptions = {
  extraDriver: boolean
  extraDriverName: string
  extraDriverPermit: string
  gps: boolean
  babySeat: boolean
  extraInsurance: boolean
}

export type EtatDesLieux = {
  carrosserieAvant: boolean
  carrosserieArriere: boolean
  carrosserieCotes: boolean
  interieur: boolean
  equipements: boolean
  fuelLevel: number // 0..8 (eighths)
  kmDepart: string
}

export type WizardState = {
  // Step 1
  clientMode: "existing" | "new"
  selectedClient: SelectedClient | null
  newClient: NewClientDraft
  // Step 2
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  selectedCarId: string | null
  pickupLocation: Location
  pickupAddress: string
  returnLocation: Location
  returnAddress: string
  // Step 3
  pricePerDayOverride: number | null
  discountPct: number
  discountReason: string
  cautionAmount: number
  cautionMethod: PaymentMethod
  avanceAmount: number
  avanceMethod: PaymentMethod
  // Step 4
  options: ReservationOptions
  // Step 5
  etatDesLieux: EtatDesLieux
  signatureName: string
  signatureAccepted: boolean
  remarks: string
}

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const initialState: WizardState = {
  clientMode: "existing",
  selectedClient: null,
  newClient: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    idType: "CIN",
    idNumber: "",
    licenseNumber: "",
    licenseExpiry: "",
  },
  startDate: today(),
  startTime: "10:00",
  endDate: inDays(3),
  endTime: "18:00",
  selectedCarId: null,
  pickupLocation: "Agence",
  pickupAddress: "",
  returnLocation: "Agence",
  returnAddress: "",
  pricePerDayOverride: null,
  discountPct: 0,
  discountReason: "",
  cautionAmount: 2000,
  cautionMethod: "Cash",
  avanceAmount: 0,
  avanceMethod: "Cash",
  options: {
    extraDriver: false,
    extraDriverName: "",
    extraDriverPermit: "",
    gps: false,
    babySeat: false,
    extraInsurance: false,
  },
  etatDesLieux: {
    carrosserieAvant: true,
    carrosserieArriere: true,
    carrosserieCotes: true,
    interieur: true,
    equipements: true,
    fuelLevel: 8,
    kmDepart: "",
  },
  signatureName: "",
  signatureAccepted: false,
  remarks: "",
}

type Ctx = {
  state: WizardState
  mode: "create" | "edit"
  reservationId?: string
  clients: ReservationClientOption[]
  cars: ReservationCarOption[]
  sources: ReservationSourceOption[]
  setState: (patch: Partial<WizardState>) => void
  setOptions: (patch: Partial<ReservationOptions>) => void
  setEtat: (patch: Partial<EtatDesLieux>) => void
  setNewClient: (patch: Partial<NewClientDraft>) => void
  step: WizardStepId
  stepIndex: number
  next: () => void
  prev: () => void
  goTo: (s: WizardStepId) => void
  canProceed: boolean
  availability: "idle" | "checking" | "available" | "unavailable"
  setAvailability: (value: Ctx["availability"]) => void
  totals: {
    days: number
    pricePerDay: number
    subtotal: number
    discountAmount: number
    afterDiscount: number
    optionsPerDay: number
    optionsTotal: number
    grandTotal: number
    reste: number
  }
}

const WizardCtx = createContext<Ctx | null>(null)

function splitDateTime(iso: string) {
  const date = new Date(iso)
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  }
}

function toLocation(value: string): Location {
  if (value === "Aéroport CMN" || value === "Aéroport RAK" || value === "Livraison adresse") return value
  return "Agence"
}

function reservationToInitialState(reservation?: Reservation): WizardState {
  if (!reservation) return initialState
  const start = splitDateTime(reservation.startDate)
  const end = splitDateTime(reservation.endDate)
  const baseSubtotal = reservation.pricePerDay * reservation.days
  const discountPct =
    baseSubtotal > 0 && reservation.total < baseSubtotal
      ? Math.round(((baseSubtotal - reservation.total) / baseSubtotal) * 100)
      : 0

  return {
    ...initialState,
    selectedClient: {
      id: reservation.client.id,
      name: reservation.client.name,
      phone: reservation.client.phone,
      status: "actif",
      idType: "CIN",
      idNumber: "",
    },
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    selectedCarId: reservation.car.id,
    pickupLocation: toLocation(reservation.pickupLocation),
    returnLocation: toLocation(reservation.returnLocation),
    pricePerDayOverride: reservation.pricePerDay,
    discountPct: Math.max(0, Math.min(50, Number.isFinite(discountPct) ? discountPct : 0)),
    cautionAmount: reservation.caution,
    avanceAmount: reservation.advance,
    options: {
      extraDriver: Boolean(reservation.extras.additionalDriver),
      extraDriverName: reservation.extras.additionalDriver ?? "",
      extraDriverPermit: "",
      gps: reservation.extras.gps,
      babySeat: reservation.extras.babySeat,
      extraInsurance: reservation.extras.insuranceUpgrade,
    },
    remarks: "",
    signatureAccepted: true,
    signatureName: reservation.client.name,
  }
}

export function WizardProvider({
  children,
  cars,
  clients,
  sources,
  initialReservation,
  mode = "create",
}: {
  children: ReactNode
  cars: ReservationCarOption[]
  clients: ReservationClientOption[]
  sources: ReservationSourceOption[]
  initialReservation?: Reservation
  mode?: "create" | "edit"
}) {
  const [state, _setState] = useState<WizardState>(() => reservationToInitialState(initialReservation))
  const [step, setStep] = useState<WizardStepId>("client")
  const [availability, setAvailability] = useState<Ctx["availability"]>("idle")

  const setState = (patch: Partial<WizardState>) =>
    _setState((s) => ({ ...s, ...patch }))
  const setOptions = (patch: Partial<ReservationOptions>) =>
    _setState((s) => ({ ...s, options: { ...s.options, ...patch } }))
  const setEtat = (patch: Partial<EtatDesLieux>) =>
    _setState((s) => ({ ...s, etatDesLieux: { ...s.etatDesLieux, ...patch } }))
  const setNewClient = (patch: Partial<NewClientDraft>) =>
    _setState((s) => ({ ...s, newClient: { ...s.newClient, ...patch } }))

  const stepIndex = STEP_ORDER.indexOf(step)

  const next = () => {
    const i = STEP_ORDER.indexOf(step)
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1])
  }
  const prev = () => {
    const i = STEP_ORDER.indexOf(step)
    if (i > 0) setStep(STEP_ORDER[i - 1])
  }
  const goTo = (s: WizardStepId) => setStep(s)

  const totals = useMemo(() => {
    const start = new Date(`${state.startDate}T${state.startTime}:00`)
    const end = new Date(`${state.endDate}T${state.endTime}:00`)
    const diffMs = Math.max(0, end.getTime() - start.getTime())
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    const car = cars.find((c) => c.id === state.selectedCarId)
    const pricePerDay = state.pricePerDayOverride ?? car?.priceDay ?? 0

    const subtotal = pricePerDay * days
    const discountAmount = Math.round((subtotal * state.discountPct) / 100)
    const afterDiscount = subtotal - discountAmount

    const optionsPerDay =
      (state.options.extraDriver ? 50 : 0) +
      (state.options.gps ? 30 : 0) +
      (state.options.babySeat ? 20 : 0) +
      (state.options.extraInsurance ? 80 : 0)
    const optionsTotal = optionsPerDay * days

    const grandTotal = afterDiscount + optionsTotal
    const reste = Math.max(0, grandTotal - state.avanceAmount)

    return {
      days,
      pricePerDay,
      subtotal,
      discountAmount,
      afterDiscount,
      optionsPerDay,
      optionsTotal,
      grandTotal,
      reste,
    }
  }, [state, cars])

  const canProceed = useMemo(() => {
    if (step === "client") {
      if (state.clientMode === "existing") {
        return (
          !!state.selectedClient && state.selectedClient.status !== "blacklist"
        )
      }
      const c = state.newClient
      return (
        c.firstName.trim().length > 1 &&
        c.lastName.trim().length > 1 &&
        c.phone.replace(/\s/g, "").length >= 9 &&
        c.idNumber.trim().length > 3
      )
    }
    if (step === "vehicle") {
      return (
        !!state.selectedCarId &&
        availability !== "unavailable" &&
        !!state.startDate &&
        !!state.endDate &&
        new Date(`${state.endDate}T${state.endTime}`) >
          new Date(`${state.startDate}T${state.startTime}`)
      )
    }
    if (step === "pricing") {
      if (state.discountPct > 0 && state.discountReason.trim().length < 3)
        return false
      return totals.pricePerDay > 0
    }
    if (step === "options") {
      if (state.options.extraDriver) {
        return (
          state.options.extraDriverName.trim().length > 1 &&
          state.options.extraDriverPermit.trim().length > 1
        )
      }
      return true
    }
    if (step === "summary") {
      return state.signatureAccepted && state.signatureName.trim().length > 2
    }
    return true
  }, [step, state, totals])

  return (
    <WizardCtx.Provider
      value={{
        state,
        mode,
        reservationId: initialReservation?.id,
        clients,
        cars,
        sources,
        setState,
        setOptions,
        setEtat,
        setNewClient,
        step,
        stepIndex,
        next,
        prev,
        goTo,
        canProceed,
        availability,
        setAvailability,
        totals,
      }}
    >
      {children}
    </WizardCtx.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardCtx)
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider")
  return ctx
}
