import fetch from 'node-fetch';
import { URL } from 'url';
// 移除: import dns from 'dns';
import net from 'net';

// 默认配置
const defaultConfig = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cache: false,
  cacheTime: 300000,
  validateStatus: (status) => status >= 200 && status < 300
};

// 缓存存储
const cache = new Map();

// 增强的拦截器系统
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(fulfilled, rejected) {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  async forEach(fn) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i] !== null) {
        await fn(this.handlers[i]);
      }
    }
  }
}

// 拦截器实例
const interceptors = {
  request: new InterceptorManager(),
  response: new InterceptorManager()
};

// checkPort 函数定义
async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host,
      port
    });
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

// 请求去重管理器
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  getKey(url, options) {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  }

  async deduplicate(url, options, requestFn) {
    const key = this.getKey(url, options);
    
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const requestDeduplicator = new RequestDeduplicator();

class LiteFetchV3 {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }

  // 添加请求拦截器（兼容旧版本）
  addRequestInterceptor(interceptor) {
    return this.interceptors.request.use(interceptor);
  }

  // 添加响应拦截器（兼容旧版本）
  addResponseInterceptor(interceptor) {
    return this.interceptors.response.use(interceptor);
  }

  // 移除拦截器
  removeRequestInterceptor(id) {
    this.interceptors.request.eject(id);
  }

  removeResponseInterceptor(id) {
    this.interceptors.response.eject(id);
  }

  // 核心请求方法 (支持 AbortController 和请求去重)
  async request(url, options = {}) {
    const config = { ...this.config, ...options };
    
    // 请求去重
    if (config.deduplicate !== false) {
      return requestDeduplicator.deduplicate(url, config, () => this._makeRequest(url, config));
    }
    
    return this._makeRequest(url, config);
  }

  async _makeRequest(url, config) {
    const parsedUrl = new URL(url);
    const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80);
    
    // 检查端口
    const portOpen = await checkPort(parsedUrl.hostname, port);
    if (!portOpen) {
      throw new Error(`Port ${port} on ${parsedUrl.hostname} is not open`);
    }
    
    const cacheKey = `${config.method || 'GET'}:${url}`;
    
    // 检查缓存
    if (config.cache) {
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < config.cacheTime)) {
        return cached.data;
      }
    }
    
    let lastError;
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        let fetchOptions = {
          method: config.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...config.headers },
          signal: controller.signal,
          ...config
        };
        
        // 执行请求拦截器
        await this.interceptors.request.forEach(async (handler) => {
          if (handler.fulfilled) {
            try {
              fetchOptions = await handler.fulfilled(fetchOptions) || fetchOptions;
            } catch (error) {
              if (handler.rejected) {
                fetchOptions = await handler.rejected(error) || fetchOptions;
              } else {
                throw error;
              }
            }
          }
        });

        if (config.body) {
          if (config.body instanceof FormData) {
            fetchOptions.body = config.body;
            delete fetchOptions.headers['Content-Type'];
          } else if (typeof config.body === 'object') {
            fetchOptions.body = JSON.stringify(config.body);
          } else {
            fetchOptions.body = config.body;
          }
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        if (!config.validateStatus(response.status)) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType && contentType.includes('text/')) {
          data = await response.text();
        } else {
          data = await response.buffer();
        }

        let result = { data, status: response.status, statusText: response.statusText, headers: response.headers };

        // 执行响应拦截器
        await this.interceptors.response.forEach(async (handler) => {
          if (handler.fulfilled) {
            try {
              result = await handler.fulfilled(result) || result;
            } catch (error) {
              if (handler.rejected) {
                result = await handler.rejected(error) || result;
              } else {
                throw error;
              }
            }
          }
        });

        // 缓存响应
        if (config.cache) {
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }

        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retries) {
          await new Promise(resolve => 
            setTimeout(resolve, config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw new Error(`Request failed after ${config.retries + 1} attempts: ${lastError.message}`);
  }

  // HTTP 方法快捷方式
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: data });
  }

  async put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body: data });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // 批量请求
  async all(requests) {
    return Promise.all(requests.map(req => 
      typeof req === 'string' ? this.get(req) : this.request(req.url, req.options)
    ));
  }

  // 竞速请求
  async race(requests) {
    return Promise.race(requests.map(req => 
      typeof req === 'string' ? this.get(req) : this.request(req.url, req.options)
    ));
  }
}

// 创建默认实例
const litefetch = new LiteFetchV3();

// 导出
export default litefetch;
export const get = litefetch.get.bind(litefetch);
export const post = litefetch.post.bind(litefetch);
export const put = litefetch.put.bind(litefetch);
export const del = litefetch.delete.bind(litefetch);
export const request = litefetch.request.bind(litefetch);
export const LiteFetch = LiteFetchV3;
export const create = (config) => new LiteFetchV3(config);