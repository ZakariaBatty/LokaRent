import { InspectionCondition, InspectionEvent, SignatureEvent, SignerType } from "@lokarent/db";
import { z } from "zod";

export const generateContractSchema = z.object({
  reservationId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  pickupMileage: z.coerce.number().int().min(0),
  pickupFuelLevel: z.coerce.number().int().min(0).max(8).optional().nullable(),
  pickupAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  inspectionItems: z
    .array(
      z.object({
        contractId: z.string().uuid().optional(),
        event: z.nativeEnum(InspectionEvent),
        zone: z.string().trim().min(1).max(120),
        condition: z.nativeEnum(InspectionCondition),
        notes: z.string().trim().max(1000).optional().nullable(),
        photoUrl: z.string().url().optional().nullable(),
      }),
    )
    .optional(),
});

export const contractIdSchema = z.object({
  contractId: z.string().uuid(),
});

export const contractByReservationSchema = z.object({
  reservationId: z.string().uuid(),
});

export const createContractInspectionItemSchema = z.object({
  contractId: z.string().uuid(),
  event: z.nativeEnum(InspectionEvent),
  zone: z.string().trim().min(1).max(120),
  condition: z.nativeEnum(InspectionCondition),
  notes: z.string().trim().max(1000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export const createContractSignatureSchema = z.object({
  contractId: z.string().uuid(),
  signerType: z.nativeEnum(SignerType),
  signerName: z.string().trim().min(1).max(200),
  event: z.nativeEnum(SignatureEvent),
  signedAt: z.coerce.date().optional(),
  signatureData: z.string().trim().max(200000).optional().nullable(),
  ipAddress: z.string().trim().max(80).optional().nullable(),
});
