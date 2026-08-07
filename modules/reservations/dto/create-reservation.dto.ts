import type { Reservation } from "@/lib/reservations-data";
import type { PaginationMeta } from "@/shared/database";

export type ReservationListDto = {
  data: Reservation[];
  pagination: PaginationMeta;
};
