import {
  listExpiringCustomerDocuments,
  listExpiringDriverDocuments,
  listExpiringVehicleDocuments,
} from "../repositories/alerts.repository";

export async function listExpiringVehicleDocumentsService(input: {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
}) {
  return listExpiringVehicleDocuments(input);
}

export async function listExpiringCustomerDocumentsService(input: {
  companyId: string;
  from: Date;
  to: Date;
}) {
  return listExpiringCustomerDocuments(input);
}

export async function listExpiringDriverDocumentsService(input: {
  companyId: string;
  from: Date;
  to: Date;
}) {
  return listExpiringDriverDocuments(input);
}

export async function listAlertsService(input: {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
}) {
  const [vehicleDocuments, customerDocuments, driverDocuments] = await Promise.all([
    listExpiringVehicleDocuments(input),
    listExpiringCustomerDocuments({ companyId: input.companyId, from: input.from, to: input.to }),
    listExpiringDriverDocuments({ companyId: input.companyId, from: input.from, to: input.to }),
  ]);

  return { vehicleDocuments, customerDocuments, driverDocuments };
}

export const alertsService = {
  listExpiringVehicleDocumentsService,
  listExpiringCustomerDocumentsService,
  listExpiringDriverDocumentsService,
  listAlertsService,
};
