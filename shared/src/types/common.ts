export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Language = 'en' | 'ar';

export interface BilingualText {
  en: string;
  ar?: string;
}