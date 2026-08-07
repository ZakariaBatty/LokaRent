import { z } from "zod";
import { createDriverSchema } from "./create-driver.schema";

export const driverIdSchema = z.object({
  driverId: z.string().uuid(),
});

export const updateDriverSchema = createDriverSchema.extend({
  driverId: z.string().uuid(),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
