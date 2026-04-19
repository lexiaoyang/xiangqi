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

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: memoryStorage,
  writable: true
});

Object.defineProperty(window, "localStorage", {
  value: memoryStorage,
  writable: true
});
