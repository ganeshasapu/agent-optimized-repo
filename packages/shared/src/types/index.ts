/** Standard API response wrapper */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Pagination params */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
