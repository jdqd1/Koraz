import { defineConfig } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { fileURLToPath } from 'node:url';
if(process.env.KORAZ_TEST_DATABASE!=='true')throw new Error('Disposable database marker required');
const root=fileURLToPath(new URL('../../../',import.meta.url)),web=fileURLToPath(new URL('../../../apps/web/',import.meta.url));
export default defineConfig({testDir:fileURLToPath(new URL('./',import.meta.url)),testMatch:'auth.spec.ts',workers:1,timeout:60000,
  expect:{timeout:10000},use:{trace:'off',screenshot:'off'},
  reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T042/auth-bff.json',import.meta.url))}]],
  globalTeardown:'./teardown.mts',
  webServer:[
    {command:'pnpm --filter @cediah/api exec tsx ../../work/test/t042/real-auth-server.mts',cwd:root,url:'http://127.0.0.1:41043/__test/ready',reuseExistingServer:false,timeout:120000,env:{NODE_ENV:'test',KORAZ_GUIDED_V2_TEST_SERVER:'true',T042_AUTH_RUN:'true'}},
    {command:'pnpm exec next start --hostname 127.0.0.1 --port 31043',cwd:web,url:'http://127.0.0.1:31043/acceder',reuseExistingServer:false,timeout:120000,env:{API_BASE_URL:'http://127.0.0.1:41043'}},
  ],
});
