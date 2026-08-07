import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const optionalAmount = z.coerce.number().nonnegative().optional();

export const reservationIdSchema = z.object({
  reservationId: z.string().uuid(),
});

export const updateReservationSchema = reservationIdSchema.extend({
  customerId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  assignedAgentId: z.string().uuid().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  pickupLocation: optionalText,
  returnLocation: optionalText,
  pricePerDay: optionalAmount,
  extrasTotal: optionalAmount,
  discountAmount: optionalAmount,
  discountReason: optionalText,
  currency: z.string().trim().length(3).optional(),
  depositAmount: optionalAmount,
  advanceAmount: optionalAmount,
  internalNotes: optionalText,
});

export const cancelReservationSchema = reservationIdSchema.extend({
  reason: z.string().trim().min(1),
});

export const noShowReservationSchema = reservationIdSchema.extend({
  reason: optionalText,
});

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
