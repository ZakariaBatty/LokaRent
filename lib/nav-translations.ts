// Maps dashboard-data labels to translation keys
export const navLabelToKey: Record<string, string> = {
  'Tableau de bord': 'navigation.dashboard',
  'Flotte': 'navigation.fleet',
  'Réservations': 'navigation.reservations',
  'Calendrier': 'navigation.calendar',
  'Clients': 'navigation.clients',
  'Chauffeurs': 'navigation.drivers',
  'Contrats': 'navigation.contracts',
  'Finances': 'navigation.finances',
  'Factures': 'navigation.invoices',
  'Communication': 'navigation.communication',
  'Alertes': 'navigation.alerts',
  'Rapports': 'navigation.reports',
  'Workspace': 'navigation.settings',
  'Paramètres': 'navigation.settings',
  'Aide & support': 'navigation.help',
}

export function getNavTranslationKey(label: string): string {
  return navLabelToKey[label] || `navigation.${label.toLowerCase()}`
}
