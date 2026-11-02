import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever a test rendered, so the next test starts with an empty document.
afterEach(cleanup);

// jsdom has no layout engine; charts only need the observer to exist.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
