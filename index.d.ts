// 主入口 TypeScript 定义文件

export * from './src/v3/index';
export { default } from './src/v3/index';

// 同时导出 v2 版本供需要的用户使用
export * as v2 from './src/v2/index';
export * as v3 from './src/v3/index';