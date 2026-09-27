import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { routePackageJsonSchema } from "../dist/learning-route-validation.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await writeFile(resolve(root, "schemas/koraz-route-2.0.schema.json"), `${JSON.stringify(routePackageJsonSchema(), null, 2)}\n`);
