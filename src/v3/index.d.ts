// TypeScript 定义文件 for LiteFetch v3 (增强版)

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
  signal?: AbortSignal;
  deduplicate?: boolean; // 新增：请求去重
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

export interface InterceptorHandler {
  fulfilled?: RequestInterceptor | ResponseInterceptor;
  rejected?: (error: any) => any;
}

export declare class InterceptorManager {
  use(fulfilled?: Function, rejected?: Function): number;
  eject(id: number): void;
  forEach(fn: (handler: InterceptorHandler) => void): Promise<void>;
}

export interface BatchRequest {
  url: string;
  options?: LiteFetchConfig;
}

export declare class LiteFetchV3 {
  config: LiteFetchConfig;
  interceptors: {
    request: InterceptorManager;
    response: InterceptorManager;
  };
  
  constructor(config?: LiteFetchConfig);
  
  // 拦截器方法
  addRequestInterceptor(interceptor: RequestInterceptor): number;
  addResponseInterceptor(interceptor: ResponseInterceptor): number;
  removeRequestInterceptor(id: number): void;
  removeResponseInterceptor(id: number): void;
  
  // 请求方法
  request<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  get<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  post<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  put<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  delete<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
  
  // 批量请求方法
  all<T = any>(requests: (string | BatchRequest)[]): Promise<LiteFetchResponse<T>[]>;
  race<T = any>(requests: (string | BatchRequest)[]): Promise<LiteFetchResponse<T>>;
}

export declare const litefetch: LiteFetchV3;

export declare function get<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function post<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function put<T = any>(url: string, data?: any, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function del<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function request<T = any>(url: string, options?: LiteFetchConfig): Promise<LiteFetchResponse<T>>;
export declare function create(config?: LiteFetchConfig): LiteFetchV3;

export { LiteFetchV3 as LiteFetch };
export default litefetch;