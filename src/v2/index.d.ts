// TypeScript 定义文件 for LiteFetch v2

export interface LiteFetchConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
  validateStatus?: (status: number) => boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
}

export interface LiteFetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface RequestInterceptor {
  (config: LiteFetchConfig): LiteFetchConfig | Promise<LiteFetchConfig>;
}

export interface ResponseInterceptor {
  (response: LiteFetchResponse): LiteFetchResponse | Promise<LiteFetchResponse>;
}

export declare class LiteFetchV2 {
  config: LiteFetchConfig;
  
  constructor(config?: LiteFetchConfig);
  
  addRequestInterceptor(interceptor: RequestInterceptor): number;
  addResponseInterceptor(interceptor: ResponseInterceptor): number;
  
  request<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  get<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  post<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  put<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  delete<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
}

export declare const litefetch: LiteFetchV2;

export declare function get<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function post<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function put<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function del<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function request<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function create(config?: LiteFetchConfig): LiteFetchV2;

export { LiteFetchV2 as LiteFetch };
export default litefetch;