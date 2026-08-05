export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export function getPagination(input: PaginationInput = {}) {
  const page = Math.max(1, Math.floor(input.page ?? DEFAULT_PAGE));
  const requestedPageSize = Math.floor(input.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
  };
}

export function createPaginationMeta(
  input: ReturnType<typeof getPagination>,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));

  return {
    page: input.page,
    pageSize: input.pageSize,
    skip: input.skip,
    take: input.take,
    total,
    totalPages,
    hasNextPage: input.page < totalPages,
    hasPreviousPage: input.page > 1,
  };
}
