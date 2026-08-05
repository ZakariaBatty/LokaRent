import { z } from "zod";

export const registerSchema = z
  .object({
    agencyName: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(80),
    vehicleCount: z.coerce.number().int().min(1).max(10000).optional(),
    managerName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(30),
    email: z.string().email().transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    acceptTerms: z.boolean().refine(Boolean),
    planName: z.string().trim().min(1).max(40).optional(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
