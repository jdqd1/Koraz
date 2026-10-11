import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createGuidedV2Server } from '../../../apps/api/test/helpers/guided-v2-server.js';
import { createBetterAuthService } from '../../../apps/api/src/auth.js';
import { buildApp } from '../../../apps/api/src/app.js';
import { readEnvironment } from '../../../apps/api/src/config.js';
import { createGuidedV2HttpProvider } from '../../../apps/api/src/guided-learning/v2/routes.js';
import { createPostgresGuidedLearningV2Provider } from '../../../apps/api/src/providers/postgres-guided-learning-v2.js';

export async function createRealAuthHarness(){
  assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
  const h=await createGuidedV2Server();
  const auth=createBetterAuthService({databaseUrl:h.db.url,publicUrl:'http://127.0.0.1:41043',
    secret:randomBytes(32).toString('hex'),requireEmailVerification:false,
    trustedOrigins:['http://127.0.0.1:31043','http://127.0.0.1:41043']},{pool:h.db.pool});
  const app=await buildApp(readEnvironment({NODE_ENV:'test',DATABASE_URL:h.db.url,DATABASE_MIGRATIONS_ENABLED:'false',
    GUIDED_LEARNING_ENABLED:'true',GUIDED_LEARNING_MAP_ENABLED:'true',GUIDED_LEARNING_V2_ENABLED:'true',
    GUIDED_LEARNING_V2_NEW_ENROLLMENTS:'true',WEB_ORIGINS:'http://127.0.0.1:31043'}),{
    authService:auth,guidedLearningV2Provider:createGuidedV2HttpProvider(h.db.database),
    guidedLearningV2EditorProvider:createPostgresGuidedLearningV2Provider(h.db.database),
  });
  const createdUsers=new Set<string>();
  async function signUp(){
    const response=await app.inject({method:'POST',url:'/api/auth/sign-up/email',headers:{host:'127.0.0.1:41043',origin:'http://127.0.0.1:31043'},
      payload:{name:'Alumno de prueba T042',email:`t042-${randomUUID()}@example.test`,password:randomBytes(24).toString('hex')}});
    assert.equal(response.statusCode,200,`Real Better Auth signup returned ${response.statusCode}`);
    const userId=response.json().user.id as string;createdUsers.add(userId);
    const values=response.headers['set-cookie'];const cookies=(Array.isArray(values)?values:[values]).filter((x):x is string=>Boolean(x));
    const cookie=cookies.map(x=>x.split(';')[0]).join('; ');assert.ok(cookie.includes('cediah.session_token='));
    return {userId,cookie};
  }
  async function expire(userId:string,seconds=0){
    assert.ok(createdUsers.has(userId),'Only a session issued by this disposable harness may be expired');
    assert.ok(Number.isInteger(seconds)&&seconds>=0&&seconds<=3);
    const result=await h.db.pool.query('update auth_sessions set expires_at=now()+($2::int * interval \'1 second\') where user_id=$1 returning expires_at',[userId,seconds]);
    assert.equal(result.rowCount,1);return result.rows[0].expires_at.toISOString();
  }
  const learnerTables=['learning_enrollments','learning_v2_attempts','learning_v2_responses','learning_v2_objective_state','learning_v2_activity_state',
    'learning_v2_review_state','learning_events','learning_rewards','learning_mutation_receipts'];
  async function fingerprint(){
    const data:Record<string,unknown>={};
    for(const table of learnerTables)data[table]=(await h.db.pool.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) as rows from ${table} t`)).rows[0].rows;
    return data;
  }
  let closed=false;const close=async()=>{if(closed)return;closed=true;await app.close();await auth.close();await h.close();};
  app.get('/__test/ready',async()=>({testOnly:true,realBetterAuth:true,database:h.db.name,pathId:h.fixtures.small!.pathId}));
  app.post('/__test/signup',signUp);
  app.post('/__test/expire',async request=>expire((request.body as {userId:string}).userId,2));
  app.get('/__test/fingerprint',fingerprint);
  app.post('/__test/stop',async()=>{setTimeout(()=>void close(),100);return {stopping:true};});
  return {app,auth,h,signUp,expire,fingerprint,close};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const h=await createRealAuthHarness();await h.app.listen({host:'127.0.0.1',port:41043});
  console.log('T042 guarded real Better Auth ready; no cookies, tokens or secrets logged');
  for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>void h.close().then(()=>process.exit(0)));
}
