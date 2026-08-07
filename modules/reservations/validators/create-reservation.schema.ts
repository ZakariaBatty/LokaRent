import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);
const optionalAmount = z.coerce.number().nonnegative().optional();
const requiredAmount = z.coerce.number().nonnegative();

export const reservationStatusSchema = z.enum(["enquiry", "confirmed", "active", "completed", "cancelled", "no_show"]);

export const reservationExtraInputSchema = z.object({
  label: requiredText,
  unitPrice: requiredAmount,
  quantity: z.coerce.number().int().positive(),
});

export const createReservationSchema = z
  .object({
    customerId: z.string().uuid(),
    vehicleId: z.string().uuid(),
    sourceId: z.string().uuid(),
    assignedAgentId: z.string().uuid().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    pickupLocation: optionalText,
    returnLocation: optionalText,
    pricePerDay: requiredAmount,
    extrasTotal: optionalAmount,
    discountAmount: optionalAmount,
    discountReason: optionalText,
    currency: z.string().trim().length(3).default("MAD"),
    depositAmount: optionalAmount,
    advanceAmount: optionalAmount,
    internalNotes: optionalText,
    extras: z.array(reservationExtraInputSchema).max(20).optional(),
  })
  .refine((data) => data.startsAt < data.endsAt, { path: ["endsAt"] });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
