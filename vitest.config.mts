import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        // Business rules, server and API: plain Node.
        extends: true,
        test: { name: "node", include: ["tests/**/*.test.ts"], environment: "node" },
      },
      {
        // React components and views: a simulated browser.
        extends: true,
        test: {
          name: "dom",
          include: ["tests/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["tests/support/setup-dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Next.js page shells only wire a view into Suspense; the views themselves are tested.
      exclude: ["src/app/**/page.tsx", "src/app/layout.tsx", "src/contracts/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
