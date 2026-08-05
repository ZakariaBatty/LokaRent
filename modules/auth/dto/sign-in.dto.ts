import type { z } from "zod";
import type { signInSchema } from "../validators/sign-in.schema";

export type SignInDto = z.infer<typeof signInSchema>;
