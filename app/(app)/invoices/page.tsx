import { InvoicesPageClient } from "@/components/invoices/invoices-page-client";
import { listInvoiceableReservationsAction, listInvoicesAction } from "@/modules/finances/actions/invoice.actions";

export default async function InvoicesPage() {
  const [invoiceResult, reservationResult] = await Promise.all([
    listInvoicesAction({ page: 1, pageSize: 100, sort: "recent" }),
    listInvoiceableReservationsAction({ take: 100 }),
  ]);

  return (
    <InvoicesPageClient
      initialInvoices={invoiceResult.success ? invoiceResult.invoices : []}
      invoiceableReservations={reservationResult.success ? reservationResult.reservations : []}
    />
  );
}
