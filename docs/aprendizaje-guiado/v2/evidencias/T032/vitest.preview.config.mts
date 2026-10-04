import { fileURLToPath } from "node:url";
export default {
  resolve: { alias: {
    "next/navigation": fileURLToPath(new URL("../../../../../apps/web/node_modules/next/navigation.js", import.meta.url)),
    "react-dom/server": fileURLToPath(new URL("../../../../../apps/web/node_modules/react-dom/server.node.js", import.meta.url)),
    "react/jsx-runtime": fileURLToPath(new URL("../../../../../apps/web/node_modules/react/jsx-runtime.js", import.meta.url)),
    "react/jsx-dev-runtime": fileURLToPath(new URL("../../../../../apps/web/node_modules/react/jsx-dev-runtime.js", import.meta.url)),
  } },
  test: { include: ["docs/aprendizaje-guiado/v2/evidencias/T032/preview.test.tsx"], maxWorkers: 1 },
};
