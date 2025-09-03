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

// Material-UI theme augmentation for custom action colors
declare module '@mui/material/styles' {
  interface Palette {
    action: Palette['action'] & {
      update?: string;
      updateHover?: string;
      remove?: string;
      removeHover?: string;
    };
  }

  interface PaletteOptions {
    action?: PaletteOptions['action'] & {
      update?: string;
      updateHover?: string;
      remove?: string;
      removeHover?: string;
    };
  }
}

export {};
