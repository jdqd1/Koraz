import { defineConfig } from "vitest/config";

// PGlite integration suites each own a PostgreSQL WASM instance. Run them
// serially so cold initialization cannot starve Fastify route tests.
export default defineConfig({ test: { maxWorkers: 1 } });
