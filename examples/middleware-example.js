import { create } from '../src/v3/index.js';

// 创建实例
const client = create({
  timeout: 5000,
  retries: 2
});

// 添加请求拦截器 - 自动添加认证头
const authInterceptor = client.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'Authorization': 'Bearer your-token-here'
  };
  return config;
});

// 添加请求拦截器 - 请求日志
client.addRequestInterceptor((config) => {
  console.log(`🚀 Request: ${config.method} ${config.url}`);
  return config;
});

// 添加响应拦截器 - 响应日志
client.addResponseInterceptor((response) => {
  console.log(`✅ Response: ${response.status} ${response.statusText}`);
  return response;
});

// 添加响应拦截器 - 错误处理
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    console.error('❌ Request failed:', error.message);
    throw error;
  }
);

// 使用示例
async function example() {
  try {
    // 单个请求
    const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Single request:', response.data);

    // 批量请求
    const batchResponses = await client.all([
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/posts/2',
      { url: 'https://jsonplaceholder.typicode.com/posts/3', options: { cache: true } }
    ]);
    console.log('Batch requests:', batchResponses.map(r => r.data));

    // 竞速请求
    const raceResponse = await client.race([
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://httpbin.org/delay/2'
    ]);
    console.log('Race request:', raceResponse.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();