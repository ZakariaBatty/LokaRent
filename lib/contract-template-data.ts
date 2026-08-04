export type ContractLanguage = "fr" | "ar" | "bilingue"
export type TitleSize = "small" | "medium" | "large"

export type ContractClause = {
  id: string
  number: number
  title: string
  content: string
  enabled: boolean
}

export type ContractTemplate = {
  // Header
  showLogo: boolean
  showPhone: boolean
  showEmail: boolean
  showRC: boolean
  showICE: boolean
  // Title
  title: string
  titleSize: TitleSize
  // Clauses
  clauses: ContractClause[]
  // Footer
  showClientSignature: boolean
  showAgencySignature: boolean
  footerText: string
  showPageNumber: boolean
  // Language
  language: ContractLanguage
}

export const AGENCY_INFO = {
  name: "LokaRent Casablanca",
  address: "Boulevard Mohammed V, Imm. 12, Casablanca 20000, Maroc",
  phone: "+212 522 123 456",
  email: "contact@lokarent.ma",
  rc: "RC 458921",
  ice: "ICE 002584719000034",
}

export const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: "responsabilite",
    number: 1,
    title: "Responsabilité du locataire",
    enabled: true,
    content:
      "Le locataire reconnaît avoir reçu le véhicule en parfait état de marche, accompagné de tous ses accessoires et documents de bord. Il s'engage à en faire un usage normal, en bon père de famille, et à respecter le code de la route en vigueur. Toute infraction commise pendant la durée de la location reste à sa charge exclusive.",
  },
  {
    id: "territoire",
    number: 2,
    title: "Utilisation du véhicule (territoire)",
    enabled: true,
    content:
      "Le véhicule loué est strictement destiné à un usage privé ou professionnel, à l'exclusion de toute compétition, transport rémunéré de personnes ou de marchandises. La circulation est autorisée sur l'ensemble du territoire marocain. Toute sortie du territoire national est subordonnée à l'autorisation écrite préalable de l'agence.",
  },
  {
    id: "carburant",
    number: 3,
    title: "Carburant",
    enabled: true,
    content:
      "Le véhicule est livré avec un niveau de carburant indiqué sur l'état des lieux de départ. Le locataire s'engage à le restituer avec un niveau de carburant équivalent. À défaut, le coût du carburant manquant ainsi que des frais de service de 50 DH seront facturés.",
  },
  {
    id: "assurance",
    number: 4,
    title: "Assurance et franchise",
    enabled: true,
    content:
      "Le véhicule bénéficie d'une assurance tous risques couvrant les dommages matériels et corporels, conformément à la législation marocaine en vigueur. Une franchise reste à la charge du locataire en cas de sinistre responsable. Le montant de la franchise est précisé dans les conditions particulières du présent contrat.",
  },
  {
    id: "caution",
    number: 5,
    title: "Dommages et caution",
    enabled: true,
    content:
      "Une caution est demandée au moment de la prise du véhicule, sous forme d'empreinte bancaire ou de chèque de garantie. Cette caution couvre les éventuels dommages, infractions, ou frais non réglés. Elle est restituée intégralement après vérification du véhicule au retour, sous réserve de l'absence de litige.",
  },
  {
    id: "restitution",
    number: 6,
    title: "Restitution du véhicule",
    enabled: true,
    content:
      "Le véhicule doit être restitué à la date, l'heure et au lieu indiqués sur le contrat. Tout retard non justifié donnera lieu à la facturation d'une journée supplémentaire. En cas de retard supérieur à 24 heures sans avertissement, l'agence se réserve le droit de déclarer le véhicule en abus de confiance auprès des autorités compétentes.",
  },
  {
    id: "infractions",
    number: 7,
    title: "Infractions et amendes",
    enabled: true,
    content:
      "Toute infraction au code de la route, contravention, ou amende constatée pendant la durée de la location est à la charge exclusive du locataire. L'agence se réserve le droit de répercuter sur la caution les amendes reçues postérieurement à la restitution du véhicule, majorées de frais de traitement administratif.",
  },
  {
    id: "kilometrage",
    number: 8,
    title: "Kilométrage",
    enabled: false,
    content:
      "Le kilométrage est limité à 250 km par jour, soit 1 750 km par semaine. Tout kilomètre supplémentaire sera facturé au tarif de 2 DH HT. Le kilométrage de départ est relevé contradictoirement à la livraison du véhicule.",
  },
]

export const DEFAULT_TEMPLATE: ContractTemplate = {
  showLogo: true,
  showPhone: true,
  showEmail: true,
  showRC: true,
  showICE: true,
  title: "CONTRAT DE LOCATION DE VÉHICULE SANS CHAUFFEUR",
  titleSize: "medium",
  clauses: DEFAULT_CLAUSES,
  showClientSignature: true,
  showAgencySignature: true,
  footerText: "Merci de votre confiance — LokaRent",
  showPageNumber: true,
  language: "fr",
}

export const SAMPLE_CLIENT = {
  name: "Karim Benjelloun",
  cin: "BE 458921",
  permis: "M-2018-145789",
  phone: "+212 661 234 567",
  address: "Résidence Al Manar, Casablanca",
}

export const SAMPLE_VEHICLE = {
  brand: "Renault Clio V",
  plate: "12345-A-6",
  year: 2023,
  category: "Citadine",
  fuel: "Essence",
}

export const SAMPLE_RENTAL = {
  startDate: "15/01/2026",
  startTime: "10:00",
  endDate: "22/01/2026",
  endTime: "10:00",
  days: 7,
  pricePerDay: 350,
  total: 2450,
  caution: 5000,
}

export function titleSizeClass(size: TitleSize): string {
  switch (size) {
    case "small":
      return "text-base"
    case "large":
      return "text-2xl"
    default:
      return "text-xl"
  }
}

export const CLAUSE_TRANSLATIONS_AR: Record<string, { title: string; content: string }> = {
  responsabilite: {
    title: "مسؤولية المستأجر",
    content:
      "يقر المستأجر بأنه تسلم السيارة في حالة جيدة مع جميع ملحقاتها ووثائقها، ويلتزم باستعمالها استعمالا عاديا واحترام قانون السير. تبقى جميع المخالفات المرتكبة خلال فترة الكراء على عاتقه.",
  },
  territoire: {
    title: "استعمال السيارة (المجال الترابي)",
    content:
      "السيارة المؤجرة مخصصة للاستعمال الخاص أو المهني فقط، ويمنع استعمالها في أي سباق أو نقل مأجور للأشخاص أو البضائع. السير مسموح به داخل التراب المغربي، وأي خروج عنه يستوجب إذنا كتابيا مسبقا من الوكالة.",
  },
  carburant: {
    title: "الوقود",
    content:
      "تسلم السيارة بمستوى وقود محدد في محضر الاستلام، ويلتزم المستأجر بإرجاعها بنفس المستوى. وإلا، يتم احتساب ثمن الوقود الناقص بالإضافة إلى مصاريف خدمة قدرها 50 درهما.",
  },
  assurance: {
    title: "التأمين والتحمل",
    content:
      "تستفيد السيارة من تأمين شامل يغطي الأضرار المادية والجسدية وفق التشريع المغربي الجاري به العمل. يبقى مبلغ التحمل على عاتق المستأجر في حالة الحوادث التي يكون مسؤولا عنها.",
  },
  caution: {
    title: "الأضرار والضمانة",
    content:
      "تطلب ضمانة عند تسلم السيارة، إما على شكل بصمة بنكية أو شيك ضمان. تغطي هذه الضمانة الأضرار المحتملة والمخالفات والمصاريف غير المؤداة، وترد بالكامل بعد التحقق من السيارة عند الإرجاع.",
  },
  restitution: {
    title: "إرجاع السيارة",
    content:
      "يجب إرجاع السيارة في التاريخ والساعة والمكان المحددة في العقد. يؤدي أي تأخير غير مبرر إلى احتساب يوم إضافي. وفي حالة تأخر يفوق 24 ساعة دون إشعار، تحتفظ الوكالة بحق التصريح بالسيارة لدى السلطات المختصة.",
  },
  infractions: {
    title: "المخالفات والغرامات",
    content:
      "تبقى جميع مخالفات قانون السير والغرامات المعاينة خلال فترة الكراء على عاتق المستأجر. تحتفظ الوكالة بحق اقتطاع الغرامات الواردة بعد إرجاع السيارة من الضمانة، مع إضافة مصاريف المعالجة الإدارية.",
  },
  kilometrage: {
    title: "عدد الكيلومترات",
    content:
      "يحدد عدد الكيلومترات في 250 كلم في اليوم، أي 1750 كلم في الأسبوع. يفوتر كل كيلومتر إضافي بسعر 2 درهم خارج الضريبة. يتم تسجيل عدد الكيلومترات عند الانطلاق بحضور الطرفين.",
  },
}

export const TITLE_AR = "عقد كراء سيارة بدون سائق"
