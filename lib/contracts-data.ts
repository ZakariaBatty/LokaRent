export type ContractStatus = "en_cours" | "termine" | "annule";
export type CautionStatus = "restituee" | "retenue" | "en_attente";
export type PaymentBalance = "paid" | "partial" | "unpaid";
export type PaymentMethod = "Cash" | "Virement" | "Carte" | "Chèque";

export type ContractPayment = {
  id: string;
  label: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  kind: "avance" | "solde" | "caution_in" | "caution_out" | "refund";
};

export type ChecklistItem = { label: string; ok: boolean };
export type Damage = {
  zone: string;
  description: string;
  severity: "leger" | "moyen" | "grave";
};

export type EtatBlock = {
  carrosserie: ChecklistItem[];
  interieur: ChecklistItem[];
  equipements: ChecklistItem[];
  fuel: 1 | 2 | 3 | 4; // 1/4, 1/2, 3/4, plein
  km: number;
};

export type Contract = {
  id: string;
  code: string; // LR-2026-0045
  versionNumber?: number;
  isCurrent?: boolean;
  supersedesContractId?: string | null;
  pricingSnapshotId?: string;
  status: ContractStatus;
  createdAt: string;
  createdBy: string;
  reservationCode?: string;
  renderedHtml?: string;
  contentHash?: string;
  template?: {
    id?: string;
    name?: string;
    versionNumber?: number;
  };

  client: {
    fullName: string;
    cinMasked: string;
    permis: string;
    phone: string;
  };
  additionalDriver?: {
    fullName: string;
    cinMasked: string;
    permis: string;
  };
  assignedDriver?: {
    fullName: string;
    phone?: string | null;
    role?: string;
  };

  car: {
    brand: string;
    model: string;
    plate: string;
    category:
    | "economique"
    | "compacte"
    | "berline"
    | "suv"
    | "premium"
    | "utilitaire";
  };

  period: {
    start: string; // ISO
    end: string;
    days: number;
  };
  locations: {
    pickup: string;
    dropoff: string;
  };

  pricing: {
    pricePerDay: number;
    discount: number;
    discountReason?: string | null;
    options: { label: string; amount: number }[];
    total: number;
    currency?: string;
    mileageLimit?: number | null;
    extraMileageRate?: number | null;
  };

  caution: {
    amount: number;
    type: "Cash" | "Chèque" | "Empreinte CB";
    status: CautionStatus;
  };

  payments: ContractPayment[];
  balance: PaymentBalance;

  etat: {
    depart: EtatBlock;
    retour?: EtatBlock & { damages: Damage[]; notes?: string };
  };

  pickupMileage?: number;
  pickupFuelLevel?: number | null;

  signedByClient?: boolean; // ISO date
  signedByAgency?: boolean; // ISO date

  history: HistoryEvent[];
};

// Zid had les types f début du fichier
export type HistoryEventType =
  | "created"
  | "signed_client"
  | "signed_agency"
  | "sent"
  | "completed"
  | "expired"
  | "edited";

export type HistoryEvent = {
  id: string;
  type: HistoryEventType;
  label: string;
  actor?: string;
  at: string;
};

const M = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(10, 0, 0, 0);
  return dt.toISOString();
};

const defaultDepartChecklist = () => ({
  carrosserie: [
    { label: "Carrosserie avant", ok: true },
    { label: "Carrosserie arrière", ok: true },
    { label: "Côté gauche", ok: true },
    { label: "Côté droit", ok: true },
    { label: "Toit", ok: true },
    { label: "Pare-brise", ok: true },
    { label: "Rétroviseurs", ok: true },
    { label: "Jantes / Pneus", ok: true },
  ],
  interieur: [
    { label: "Sièges", ok: true },
    { label: "Tableau de bord", ok: true },
    { label: "Tapis", ok: true },
    { label: "Plafond", ok: true },
  ],
  equipements: [
    { label: "Roue de secours", ok: true },
    { label: "Cric", ok: true },
    { label: "Triangle", ok: true },
    { label: "Gilet", ok: true },
  ],
  fuel: 4 as const,
  km: 42_350,
});

const minorReturn = (
  km: number,
  damages: Damage[] = [],
  notes?: string,
): NonNullable<Contract["etat"]["retour"]> => ({
  ...defaultDepartChecklist(),
  km,
  fuel: damages.length ? 2 : 3,
  damages,
  notes,
  carrosserie: defaultDepartChecklist().carrosserie.map((c) =>
    damages.some((d) =>
      d.zone.toLowerCase().includes(c.label.toLowerCase().split(" ")[1] ?? ""),
    )
      ? { ...c, ok: false }
      : c,
  ),
});

export const contracts: Contract[] = [
  {
    id: "c-0031",
    code: "LR-2026-0031",
    status: "termine",
    createdAt: M(-32),
    createdBy: "Karim B.",
    client: {
      fullName: "Mehdi El Idrissi",
      cinMasked: "BK•••421",
      permis: "12345/MA/2018",
      phone: "+212 661 23 45 67",
    },
    car: {
      brand: "Dacia",
      model: "Logan",
      plate: "12345-A-12",
      category: "economique",
    },
    period: { start: M(-30), end: M(-25), days: 5 },
    locations: { pickup: "Agence Casablanca", dropoff: "Aéroport Mohammed V" },
    pricing: {
      pricePerDay: 220,
      discount: 0,
      options: [{ label: "GPS", amount: 50 }],
      total: 1150,
    },
    caution: { amount: 2000, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 500,
        method: "Cash",
        date: M(-30),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Solde réglé",
        amount: 650,
        method: "Cash",
        date: M(-25),
        kind: "solde",
      },
      {
        id: "p3",
        label: "Caution encaissée",
        amount: 2000,
        method: "Cash",
        date: M(-30),
        kind: "caution_in",
      },
      {
        id: "p4",
        label: "Caution restituée",
        amount: 2000,
        method: "Cash",
        date: M(-25),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(42_780),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0032",
    code: "LR-2026-0032",
    status: "termine",
    createdAt: M(-28),
    createdBy: "Karim B.",
    client: {
      fullName: "Salma Bennani",
      cinMasked: "AB•••117",
      permis: "78912/MA/2020",
      phone: "+212 662 88 90 12",
    },
    car: {
      brand: "Renault",
      model: "Clio",
      plate: "44721-B-7",
      category: "compacte",
    },
    period: { start: M(-27), end: M(-21), days: 6 },
    locations: { pickup: "Agence Rabat", dropoff: "Agence Rabat" },
    pricing: {
      pricePerDay: 260,
      discount: 60,
      options: [],
      total: 1500,
    },
    caution: { amount: 2500, type: "Empreinte CB", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 600,
        method: "Virement",
        date: M(-27),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Solde réglé",
        amount: 900,
        method: "Virement",
        date: M(-21),
        kind: "solde",
      },
      {
        id: "p3",
        label: "Caution restituée",
        amount: 2500,
        method: "Carte",
        date: M(-21),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(38_120),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0033",
    code: "LR-2026-0033",
    status: "termine",
    createdAt: M(-26),
    createdBy: "Yassine M.",
    client: {
      fullName: "Yassine Ouahbi",
      cinMasked: "DC•••907",
      permis: "55102/MA/2019",
      phone: "+212 663 12 34 56",
    },
    car: {
      brand: "Toyota",
      model: "RAV4",
      plate: "98712-D-3",
      category: "suv",
    },
    period: { start: M(-25), end: M(-18), days: 7 },
    locations: { pickup: "Aéroport Marrakech", dropoff: "Aéroport Marrakech" },
    pricing: {
      pricePerDay: 650,
      discount: 0,
      options: [
        { label: "Siège bébé", amount: 100 },
        { label: "Assurance étendue", amount: 350 },
      ],
      total: 5000,
    },
    caution: { amount: 5000, type: "Chèque", status: "retenue" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 2000,
        method: "Virement",
        date: M(-25),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Solde réglé",
        amount: 3000,
        method: "Virement",
        date: M(-18),
        kind: "solde",
      },
      {
        id: "p3",
        label: "Caution partiellement retenue (1 200 DH)",
        amount: 1200,
        method: "Chèque",
        date: M(-18),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(
        72_410,
        [
          {
            zone: "Aile avant droite",
            description: "Rayure profonde 12cm",
            severity: "moyen",
          },
          {
            zone: "Jante avant droite",
            description: "Choc de trottoir",
            severity: "leger",
          },
        ],
        "Client a reconnu les dommages — frais retenus sur caution.",
      ),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0034",
    code: "LR-2026-0034",
    status: "termine",
    createdAt: M(-22),
    createdBy: "Karim B.",
    client: {
      fullName: "Imane Tazi",
      cinMasked: "EE•••225",
      permis: "88123/MA/2021",
      phone: "+212 664 55 66 77",
    },
    car: {
      brand: "Hyundai",
      model: "Tucson",
      plate: "55410-C-1",
      category: "suv",
    },
    period: { start: M(-21), end: M(-14), days: 7 },
    locations: {
      pickup: "Agence Casablanca",
      dropoff: "Livraison hôtel — Mövenpick",
    },
    pricing: {
      pricePerDay: 590,
      discount: 100,
      options: [{ label: "GPS", amount: 50 }],
      total: 4080,
    },
    caution: { amount: 4000, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 4080,
        method: "Carte",
        date: M(-21),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution restituée",
        amount: 4000,
        method: "Cash",
        date: M(-14),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(55_980),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0035",
    code: "LR-2026-0035",
    status: "annule",
    createdAt: M(-20),
    createdBy: "Yassine M.",
    client: {
      fullName: "Omar Chraibi",
      cinMasked: "FH•••009",
      permis: "12009/MA/2017",
      phone: "+212 665 11 22 33",
    },
    car: {
      brand: "Peugeot",
      model: "208",
      plate: "21030-A-9",
      category: "compacte",
    },
    period: { start: M(-19), end: M(-15), days: 4 },
    locations: { pickup: "Agence Rabat", dropoff: "Agence Rabat" },
    pricing: { pricePerDay: 280, discount: 0, options: [], total: 1120 },
    caution: { amount: 2000, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 400,
        method: "Cash",
        date: M(-20),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Remboursement",
        amount: 400,
        method: "Virement",
        date: M(-19),
        kind: "refund",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0036",
    code: "LR-2026-0036",
    status: "termine",
    createdAt: M(-18),
    createdBy: "Karim B.",
    client: {
      fullName: "Khadija Berrada",
      cinMasked: "GG•••441",
      permis: "67821/MA/2016",
      phone: "+212 666 22 11 44",
    },
    car: {
      brand: "Kia",
      model: "Sportage",
      plate: "33019-D-6",
      category: "suv",
    },
    period: { start: M(-17), end: M(-10), days: 7 },
    locations: { pickup: "Aéroport Mohammed V", dropoff: "Agence Casablanca" },
    pricing: {
      pricePerDay: 580,
      discount: 0,
      options: [{ label: "Chauffeur supplémentaire", amount: 280 }],
      total: 4340,
    },
    additionalDriver: {
      fullName: "Mounir Berrada",
      cinMasked: "GG•••662",
      permis: "67900/MA/2018",
    },
    caution: { amount: 4000, type: "Empreinte CB", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 1300,
        method: "Virement",
        date: M(-17),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Solde réglé",
        amount: 3040,
        method: "Virement",
        date: M(-10),
        kind: "solde",
      },
      {
        id: "p3",
        label: "Caution restituée",
        amount: 4000,
        method: "Carte",
        date: M(-10),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(28_410),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0037",
    code: "LR-2026-0037",
    status: "termine",
    createdAt: M(-14),
    createdBy: "Karim B.",
    client: {
      fullName: "Hicham Lahlou",
      cinMasked: "JK•••180",
      permis: "44091/MA/2015",
      phone: "+212 667 99 88 77",
    },
    car: {
      brand: "Volkswagen",
      model: "Polo",
      plate: "77123-B-2",
      category: "compacte",
    },
    period: { start: M(-13), end: M(-9), days: 4 },
    locations: { pickup: "Agence Casablanca", dropoff: "Agence Casablanca" },
    pricing: { pricePerDay: 290, discount: 0, options: [], total: 1160 },
    caution: { amount: 2000, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 1160,
        method: "Cash",
        date: M(-13),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution restituée",
        amount: 2000,
        method: "Cash",
        date: M(-9),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist(), retour: minorReturn(31_120) },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0038",
    code: "LR-2026-0038",
    status: "en_cours",
    createdAt: M(-7),
    createdBy: "Karim B.",
    client: {
      fullName: "Sofia El Mansouri",
      cinMasked: "LL•••012",
      permis: "29871/MA/2022",
      phone: "+212 668 12 34 09",
    },
    car: {
      brand: "Dacia",
      model: "Duster",
      plate: "88321-A-4",
      category: "suv",
    },
    period: { start: M(-6), end: M(2), days: 8 },
    locations: { pickup: "Agence Rabat", dropoff: "Agence Rabat" },
    pricing: {
      pricePerDay: 380,
      discount: 0,
      options: [{ label: "GPS", amount: 50 }],
      total: 3090,
    },
    caution: { amount: 3000, type: "Cash", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 1000,
        method: "Virement",
        date: M(-6),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Caution encaissée",
        amount: 3000,
        method: "Cash",
        date: M(-6),
        kind: "caution_in",
      },
    ],
    balance: "partial",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0039",
    code: "LR-2026-0039",
    status: "en_cours",
    createdAt: M(-5),
    createdBy: "Yassine M.",
    client: {
      fullName: "Karim Bouzid",
      cinMasked: "MN•••554",
      permis: "33129/MA/2014",
      phone: "+212 669 90 12 34",
    },
    car: {
      brand: "Renault",
      model: "Clio",
      plate: "11020-C-8",
      category: "compacte",
    },
    period: { start: M(-4), end: M(3), days: 7 },
    locations: {
      pickup: "Aéroport Mohammed V",
      dropoff: "Aéroport Mohammed V",
    },
    pricing: { pricePerDay: 260, discount: 0, options: [], total: 1820 },
    caution: { amount: 2000, type: "Empreinte CB", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 1820,
        method: "Carte",
        date: M(-4),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution encaissée",
        amount: 2000,
        method: "Carte",
        date: M(-4),
        kind: "caution_in",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0040",
    code: "LR-2026-0040",
    status: "en_cours",
    createdAt: M(-3),
    createdBy: "Karim B.",
    client: {
      fullName: "Nadia Ait Ali",
      cinMasked: "OP•••330",
      permis: "60012/MA/2019",
      phone: "+212 670 12 88 99",
    },
    car: {
      brand: "Hyundai",
      model: "Tucson",
      plate: "55410-C-1",
      category: "suv",
    },
    period: { start: M(-2), end: M(5), days: 7 },
    locations: { pickup: "Agence Casablanca", dropoff: "Aéroport Mohammed V" },
    pricing: {
      pricePerDay: 590,
      discount: 0,
      options: [{ label: "Siège bébé", amount: 100 }],
      total: 4230,
    },
    caution: { amount: 4000, type: "Cash", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 1500,
        method: "Virement",
        date: M(-3),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Caution encaissée",
        amount: 4000,
        method: "Cash",
        date: M(-2),
        kind: "caution_in",
      },
    ],
    balance: "partial",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0041",
    code: "LR-2026-0041",
    status: "termine",
    createdAt: M(-12),
    createdBy: "Karim B.",
    client: {
      fullName: "Reda Slimani",
      cinMasked: "QQ•••760",
      permis: "21034/MA/2013",
      phone: "+212 671 11 09 87",
    },
    car: {
      brand: "Toyota",
      model: "RAV4",
      plate: "98712-D-3",
      category: "suv",
    },
    period: { start: M(-11), end: M(-6), days: 5 },
    locations: { pickup: "Aéroport Marrakech", dropoff: "Agence Marrakech" },
    pricing: { pricePerDay: 650, discount: 150, options: [], total: 3100 },
    caution: { amount: 5000, type: "Empreinte CB", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 1000,
        method: "Carte",
        date: M(-11),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Solde réglé",
        amount: 2100,
        method: "Carte",
        date: M(-6),
        kind: "solde",
      },
      {
        id: "p3",
        label: "Caution restituée",
        amount: 5000,
        method: "Carte",
        date: M(-6),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist(), retour: minorReturn(73_900) },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0042",
    code: "LR-2026-0042",
    status: "annule",
    createdAt: M(-10),
    createdBy: "Yassine M.",
    client: {
      fullName: "Anas El Othmani",
      cinMasked: "RR•••051",
      permis: "10923/MA/2020",
      phone: "+212 672 91 28 04",
    },
    car: {
      brand: "Peugeot",
      model: "208",
      plate: "21030-A-9",
      category: "compacte",
    },
    period: { start: M(-9), end: M(-6), days: 3 },
    locations: { pickup: "Agence Rabat", dropoff: "Agence Rabat" },
    pricing: { pricePerDay: 280, discount: 0, options: [], total: 840 },
    caution: { amount: 2000, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 300,
        method: "Cash",
        date: M(-10),
        kind: "avance",
      },
      {
        id: "p2",
        label: "Remboursement",
        amount: 300,
        method: "Cash",
        date: M(-9),
        kind: "refund",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0043",
    code: "LR-2026-0043",
    status: "en_cours",
    createdAt: M(-1),
    createdBy: "Karim B.",
    client: {
      fullName: "Leila Fassi",
      cinMasked: "SS•••870",
      permis: "60781/MA/2016",
      phone: "+212 673 80 22 14",
    },
    car: {
      brand: "Kia",
      model: "Sportage",
      plate: "33019-D-6",
      category: "suv",
    },
    period: { start: M(0), end: M(7), days: 7 },
    locations: { pickup: "Agence Casablanca", dropoff: "Agence Casablanca" },
    pricing: {
      pricePerDay: 580,
      discount: 80,
      options: [{ label: "Chauffeur supplémentaire", amount: 280 }],
      total: 4220,
    },
    additionalDriver: {
      fullName: "Karim Fassi",
      cinMasked: "SS•••871",
      permis: "60900/MA/2018",
    },
    caution: { amount: 4000, type: "Chèque", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 1500,
        method: "Virement",
        date: M(-1),
        kind: "avance",
      },
    ],
    balance: "partial",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0044",
    code: "LR-2026-0044",
    status: "en_cours",
    createdAt: M(0),
    createdBy: "Karim B.",
    client: {
      fullName: "Adam Bouzoubaa",
      cinMasked: "TT•••129",
      permis: "44012/MA/2017",
      phone: "+212 674 13 02 99",
    },
    car: {
      brand: "Volkswagen",
      model: "Polo",
      plate: "77123-B-2",
      category: "compacte",
    },
    period: { start: M(0), end: M(4), days: 4 },
    locations: { pickup: "Agence Rabat", dropoff: "Aéroport Mohammed V" },
    pricing: {
      pricePerDay: 290,
      discount: 0,
      options: [{ label: "GPS", amount: 50 }],
      total: 1210,
    },
    caution: { amount: 2000, type: "Cash", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 1210,
        method: "Cash",
        date: M(0),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution encaissée",
        amount: 2000,
        method: "Cash",
        date: M(0),
        kind: "caution_in",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0045",
    code: "LR-2026-0045",
    status: "termine",
    createdAt: M(-9),
    createdBy: "Yassine M.",
    client: {
      fullName: "Fatima Zahra Amrani",
      cinMasked: "UV•••600",
      permis: "12345/MA/2012",
      phone: "+212 675 41 02 18",
    },
    car: {
      brand: "Dacia",
      model: "Logan",
      plate: "12345-A-12",
      category: "economique",
    },
    period: { start: M(-8), end: M(-3), days: 5 },
    locations: { pickup: "Agence Casablanca", dropoff: "Agence Casablanca" },
    pricing: { pricePerDay: 220, discount: 0, options: [], total: 1100 },
    caution: { amount: 2000, type: "Cash", status: "retenue" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 1100,
        method: "Cash",
        date: M(-8),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution partiellement retenue (400 DH)",
        amount: 400,
        method: "Cash",
        date: M(-3),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: {
      depart: defaultDepartChecklist(),
      retour: minorReturn(46_010, [
        {
          zone: "Pare-chocs arrière",
          description: "Rayure superficielle 8cm",
          severity: "leger",
        },
      ]),
    },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0046",
    code: "LR-2026-0046",
    status: "termine",
    createdAt: M(-6),
    createdBy: "Karim B.",
    client: {
      fullName: "Younes Chakir",
      cinMasked: "WW•••920",
      permis: "70812/MA/2018",
      phone: "+212 676 32 41 55",
    },
    car: {
      brand: "Renault",
      model: "Clio",
      plate: "44721-B-7",
      category: "compacte",
    },
    period: { start: M(-5), end: M(-2), days: 3 },
    locations: { pickup: "Agence Rabat", dropoff: "Agence Rabat" },
    pricing: { pricePerDay: 260, discount: 0, options: [], total: 780 },
    caution: { amount: 2500, type: "Cash", status: "restituee" },
    payments: [
      {
        id: "p1",
        label: "Solde intégral",
        amount: 780,
        method: "Cash",
        date: M(-5),
        kind: "solde",
      },
      {
        id: "p2",
        label: "Caution restituée",
        amount: 2500,
        method: "Cash",
        date: M(-2),
        kind: "caution_out",
      },
    ],
    balance: "paid",
    etat: { depart: defaultDepartChecklist(), retour: minorReturn(39_220) },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0047",
    code: "LR-2026-0047",
    status: "en_cours",
    createdAt: M(0),
    createdBy: "Karim B.",
    client: {
      fullName: "Asmae Drissi",
      cinMasked: "XX•••104",
      permis: "55012/MA/2020",
      phone: "+212 677 19 25 03",
    },
    car: {
      brand: "Toyota",
      model: "RAV4",
      plate: "98712-D-3",
      category: "suv",
    },
    period: { start: M(1), end: M(8), days: 7 },
    locations: { pickup: "Aéroport Marrakech", dropoff: "Aéroport Marrakech" },
    pricing: {
      pricePerDay: 650,
      discount: 0,
      options: [{ label: "Assurance étendue", amount: 350 }],
      total: 4900,
    },
    caution: { amount: 5000, type: "Chèque", status: "en_attente" },
    payments: [
      {
        id: "p1",
        label: "Avance versée",
        amount: 2000,
        method: "Virement",
        date: M(0),
        kind: "avance",
      },
    ],
    balance: "partial",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
  {
    id: "c-0048",
    code: "LR-2026-0048",
    status: "en_cours",
    createdAt: M(0),
    createdBy: "Yassine M.",
    client: {
      fullName: "Bilal El Khattabi",
      cinMasked: "YY•••883",
      permis: "92012/MA/2019",
      phone: "+212 678 49 02 73",
    },
    car: {
      brand: "Hyundai",
      model: "Tucson",
      plate: "55410-C-1",
      category: "suv",
    },
    period: { start: M(2), end: M(9), days: 7 },
    locations: {
      pickup: "Agence Casablanca",
      dropoff: "Livraison adresse — Anfa",
    },
    pricing: { pricePerDay: 590, discount: 0, options: [], total: 4130 },
    caution: { amount: 4000, type: "Empreinte CB", status: "en_attente" },
    payments: [],
    balance: "unpaid",
    etat: { depart: defaultDepartChecklist() },
    signedByAgency: true,
    signedByClient: true,
    history: [
      {
        id: "h1",
        type: "created",
        label: "Contrat créé",
        actor: "Karim B.",
        at: M(-22),
      },
      {
        id: "h2",
        type: "signed_client",
        label: "Signé par le client",
        at: M(-21),
      },
      {
        id: "h3",
        type: "signed_agency",
        label: "Signé par l'agence",
        actor: "Karim B.",
        at: M(-21),
      },
      {
        id: "h4",
        type: "completed",
        label: "Contrat clôturé",
        actor: "Karim B.",
        at: M(-14),
      },
    ],
  },
];

// ----- Helpers -----

export const statusConfig: Record<
  ContractStatus,
  { label: string; pillBg: string; pillText: string; dot: string; ring: string }
> = {
  en_cours: {
    label: "En cours",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
  },
  termine: {
    label: "Terminé",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  annule: {
    label: "Annulé",
    pillBg: "bg-slate-100",
    pillText: "text-slate-600",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  },
};

export const cautionStatusConfig: Record<
  CautionStatus,
  { label: string; pillBg: string; pillText: string }
> = {
  restituee: {
    label: "Restituée",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
  },
  retenue: {
    label: "Retenue",
    pillBg: "bg-rose-50",
    pillText: "text-rose-700",
  },
  en_attente: {
    label: "En attente",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
  },
};

export const contractStatuses: ContractStatus[] = [
  "en_cours",
  "termine",
  "annule",
];

export function formatMAD(n: number) {
  return `${n.toLocaleString("fr-FR")} DH`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function totalPaid(c: Contract) {
  return c.payments
    .filter((p) => p.kind === "avance" || p.kind === "solde")
    .reduce((acc, p) => acc + p.amount, 0);
}

export function totalRefunded(c: Contract) {
  return c.payments
    .filter((p) => p.kind === "refund")
    .reduce((acc, p) => acc + p.amount, 0);
}

export function remainingBalance(c: Contract) {
  const due = c.pricing.total - totalPaid(c) + totalRefunded(c);
  return Math.max(0, due);
}
