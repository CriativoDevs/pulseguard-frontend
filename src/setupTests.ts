import '@testing-library/jest-dom/vitest';

// Simple EventSource mock fallback; tests can override per-suite if needed
class MockEventSource {
  url: string;
  listeners: Record<string, Array<(evt: MessageEvent) => void>> = {};
  readyState = 0;
  static last?: MockEventSource;

  constructor(url: string) {
    this.url = url;
    MockEventSource.last = this;
  }

  addEventListener(type: string, callback: (evt: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  }

  close() {
    this.readyState = 2;
  }

  emit(type: string, data: unknown) {
    const evt = { data: typeof data === 'string' ? data : JSON.stringify(data) } as MessageEvent;
    (this.listeners[type] || []).forEach((cb) => cb(evt));
  }
}

// @ts-ignore
global.EventSource = MockEventSource as any;

export { MockEventSource };
