/**
 * WhatsApp Message Templates
 * Generate professional WhatsApp messages for various business documents
 */

import { formatMAD, formatDate } from "@/lib/reservations-data"

export type WhatsAppTemplate = 
  | "reservation_summary"
  | "invoice"
  | "contract"
  | "payment_receipt"
  | "deposit_receipt"
  | "driver_info"

export interface WhatsAppMessage {
  template: WhatsAppTemplate
  phoneNumber: string
  message: string
  title: string
}

/**
 * Generate a reservation summary message
 */
export function generateReservationMessage(data: {
  code: string
  clientName: string
  carBrand: string
  carModel: string
  carPlate: string
  startDate: string
  endDate: string
  days: number
  total: number
  pickupLocation: string
  returnLocation: string
}): string {
  return `Bonjour ${data.clientName},

Confirmation de votre réservation #${data.code}

*Véhicule:* ${data.carBrand} ${data.carModel} (${data.carPlate})
*Dates:* ${formatDate(data.startDate)} → ${formatDate(data.endDate)} (${data.days} jours)
*Montant total:* ${formatMAD(data.total)}

*Lieu de prise en charge:* ${data.pickupLocation}
*Lieu de restitution:* ${data.returnLocation}

Merci de votre confiance! 🚗

Pour toute question, n'hésitez pas à nous contacter.`
}

/**
 * Generate an invoice message
 */
export function generateInvoiceMessage(data: {
  invoiceCode: string
  clientName: string
  amount: number
  reservationCode?: string
  dueDate?: string
}): string {
  const dueDateLine = data.dueDate ? `\n*Date d'échéance:* ${formatDate(data.dueDate)}` : ""
  const reservationLine = data.reservationCode ? `\n*Réservation:* #${data.reservationCode}` : ""
  
  return `Bonjour ${data.clientName},

Votre facture #${data.invoiceCode} est prête.

*Montant à payer:* ${formatMAD(data.amount)}${reservationLine}${dueDateLine}

Veuillez effectuer le paiement selon les conditions convenus.

Merci! 💳`
}

/**
 * Generate a contract message
 */
export function generateContractMessage(data: {
  contractCode: string
  clientName: string
  carDescription: string
  startDate: string
  endDate: string
}): string {
  return `Bonjour ${data.clientName},

Votre contrat de location #${data.contractCode} est prêt à la signature.

*Véhicule:* ${data.carDescription}
*Période:* ${formatDate(data.startDate)} → ${formatDate(data.endDate)}

Veuillez consulter le contrat en pièce jointe et nous confirmer votre accord.

À bientôt! 📋`
}

/**
 * Generate a payment receipt message
 */
export function generatePaymentReceiptMessage(data: {
  receiptCode: string
  clientName: string
  amount: number
  paymentMethod: string
  date: string
  reservationCode?: string
}): string {
  const reservationLine = data.reservationCode ? `\n*Réservation:* #${data.reservationCode}` : ""
  
  return `Bonjour ${data.clientName},

Votre paiement a été reçu! ✅

*Reçu:* #${data.receiptCode}
*Montant:* ${formatMAD(data.amount)}
*Méthode:* ${data.paymentMethod}
*Date:* ${formatDate(data.date)}${reservationLine}

Merci de votre paiement!`
}

/**
 * Generate a deposit receipt message
 */
export function generateDepositReceiptMessage(data: {
  depositCode: string
  clientName: string
  amount: number
  carDescription: string
  date: string
}): string {
  return `Bonjour ${data.clientName},

Confirmation de la caution reçue ✅

*Caution:* #${data.depositCode}
*Montant:* ${formatMAD(data.amount)}
*Véhicule:* ${data.carDescription}
*Date:* ${formatDate(data.date)}

La caution sera restituée après inspection du véhicule.`
}

/**
 * Generate a driver information message
 */
export function generateDriverInfoMessage(data: {
  driverName: string
  clientName: string
  phoneNumber: string
  vehicleBrand: string
  vehicleModel: string
}): string {
  return `Bonjour ${data.clientName},

Voici les coordonnées de votre chauffeur pour la location.

*Nom:* ${data.driverName}
*Téléphone:* ${data.phoneNumber}
*Véhicule:* ${data.vehicleBrand} ${data.vehicleModel}

N'hésitez pas à le contacter pour toute question. 🚗`
}

/**
 * Generate message from template
 */
export function generateMessage(
  template: WhatsAppTemplate,
  data: Record<string, any>,
): string {
  switch (template) {
    case "reservation_summary":
      return generateReservationMessage(data)
    case "invoice":
      return generateInvoiceMessage(data)
    case "contract":
      return generateContractMessage(data)
    case "payment_receipt":
      return generatePaymentReceiptMessage(data)
    case "deposit_receipt":
      return generateDepositReceiptMessage(data)
    case "driver_info":
      return generateDriverInfoMessage(data)
    default:
      return ""
  }
}

/**
 * Build WhatsApp URL for sending a message
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  // Remove all non-numeric characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "")
  // Ensure it has country code (Morocco = 212)
  const fullPhone = cleanPhone.startsWith("212") ? cleanPhone : `212${cleanPhone.replace(/^0/, "")}`
  
  // Encode message for URL
  const encoded = encodeURIComponent(message)
  
  // Return WhatsApp Web URL
  return `https://wa.me/${fullPhone}?text=${encoded}`
}

/**
 * Check if a phone number is valid for WhatsApp
 */
export function isValidPhoneNumber(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false
  const cleanPhone = phoneNumber.replace(/\D/g, "")
  // Valid if it has at least 9 digits (Moroccan format)
  return cleanPhone.length >= 9
}
