import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: [
      {
        find: /@mini-vue-calliyi\/(\w*)/,
        replacement: path.resolve(__dirname, "packages") + "/$1/src",
      },
    ],
  },
});
