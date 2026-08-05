import { createValidationError } from "@/shared";
import {
  listCalendarAvailabilityBlocks,
  listCalendarReservations,
} from "../repositories/calendar.repository";

export async function listCalendarReservationsService(input: {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
}) {
  if (input.from >= input.to) throw createValidationError("Calendar date range is invalid");
  return listCalendarReservations(input);
}

export async function listCalendarAvailabilityBlocksService(input: {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
}) {
  if (input.from >= input.to) throw createValidationError("Calendar date range is invalid");
  return listCalendarAvailabilityBlocks(input);
}

export async function getCalendarService(input: {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
}) {
  if (input.from >= input.to) throw createValidationError("Calendar date range is invalid");
  const [reservations, availabilityBlocks] = await Promise.all([
    listCalendarReservations(input),
    listCalendarAvailabilityBlocks(input),
  ]);
  return { reservations, availabilityBlocks };
}

export const calendarService = {
  listCalendarReservationsService,
  listCalendarAvailabilityBlocksService,
  getCalendarService,
};
