// React 19 compatibility fix for Radix UI components
declare module 'react' {
  export namespace React {
    // Make ReactNode compatible with external @types/react versions
    type ReactNode = import('@types/react').ReactNode;
  }
}

// Global type augmentation to fix React 19 incompatibilities
declare global {
  namespace React {
    interface ReactPortal {
      children?: ReactNode;
    }
  }
}

export {};
