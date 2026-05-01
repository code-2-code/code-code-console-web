import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const credentialSrc = resolve(dirname(fileURLToPath(import.meta.url)), "../credential/src");

export default defineConfig({
  resolve: {
    alias: {
      "@code-code/console-web-credential": resolve(credentialSrc, "index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["../../test/setup.ts"],
    server: {
      deps: {
        inline: ["@code-code/agent-contract"],
      },
    },
  },
});
