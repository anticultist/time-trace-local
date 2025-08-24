// Global type declarations for VS Code webview API

export interface VsCodeApi {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VsCodeApi;
  }
}

// Also declare it globally for backward compatibility
declare global {
  interface VsCodeApi {
    postMessage(message: any): void;
    setState(state: any): void;
    getState(): any;
  }
}
