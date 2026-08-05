import { prisma } from "./client";
import type { DatabaseClient } from "./repository.types";

export function runInTransaction<T>(fn: (db: DatabaseClient) => Promise<T>) {
  return prisma.$transaction((tx) => fn(tx), { timeout: 15000 });
}
