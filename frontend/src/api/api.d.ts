export declare const API_BASE_URL: string;

export declare function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T>;
