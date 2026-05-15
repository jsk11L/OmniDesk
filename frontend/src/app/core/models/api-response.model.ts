export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string | string[];
  statusCode: number;
  path: string;
  timestamp: string;
  details?: unknown;
}
