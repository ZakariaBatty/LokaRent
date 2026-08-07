import type { Car } from "@/lib/cars-data";

export type CarListDto = {
  data: Car[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
