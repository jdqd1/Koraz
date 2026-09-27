import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Reuse the repository's locked esbuild installation; no new dependency or lock change.
const store = resolve(root, "../../node_modules/.pnpm");
const entry = readdirSync(store).find((name) => /^esbuild@[^/\\]+$/.test(name));
if (!entry) throw new Error("esbuild no está instalado en el workspace");
const require = createRequire(resolve(store, entry, "node_modules/esbuild/package.json"));
const { build } = require("esbuild");
await build({
  entryPoints: [resolve(root, "bin/validate-learning-route.mjs")],
  outfile: resolve(root, "bin/validate-learning-route.bundle.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  packages: "bundle",
});
