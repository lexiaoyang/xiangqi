import "@testing-library/jest-dom/vitest";

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
}

Object.defineProperty(globalThis, "Worker", {
  value: MockWorker,
  writable: true
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  })
});
