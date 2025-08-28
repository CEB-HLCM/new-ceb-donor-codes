// Global type definitions for build compatibility

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
  }
  
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

// Jest globals for tests
declare global {
  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void): void;
  function expect<T>(actual: T): any;
}

export {};
