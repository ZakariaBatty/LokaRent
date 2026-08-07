import type { PaginationMeta } from "@/shared/database";
import type { Driver } from "@/lib/drivers-data";

export type DriverListDto = {
  data: Driver[];
  pagination: PaginationMeta;
};
