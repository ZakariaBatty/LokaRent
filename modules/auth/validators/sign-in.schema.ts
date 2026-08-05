import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().default(true),
});

export type SignInInput = z.infer<typeof signInSchema>;
