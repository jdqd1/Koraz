import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
const marker = JSON.parse(readFileSync('tmp/f04-cluster.json','utf8'));
const data = marker.data, bin = marker.bin;
const native = (name,args,accepted=[0]) => {
 const fd=openSync('work/f07/cluster-log.txt','a');
 const result=spawnSync(join(bin,name+'.exe'),args,{windowsHide:true,stdio:['ignore',fd,fd],timeout:45000});
 closeSync(fd); if(result.error) throw result.error;
 if(!accepted.includes(result.status)) throw new Error(name+': '+result.status); return result.status;
};
const { Pool }=createRequire(resolve('apps/api/package.json'))('pg');
const snapshot=async()=>{const p=new Pool({connectionString:'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'});try{return (await p.query('select datname,oid from pg_database order by datname')).rows;}finally{await p.end();}};
if(process.argv[2]==='start') {
 const status=native('pg_ctl',['-D',data,'status'],[0,3]);
 if(status===3) native('pg_ctl',['-D',data,'-l',resolve('work/f07/postgres.log'),'-o','-p 55435 -h 127.0.0.1','-w','start']);
 writeFileSync('work/f07/cluster.json',JSON.stringify({data,bin,started:status===3,databases:await snapshot()},null,2));
 console.log('Disposable cluster available; baseline saved.');
} else if(process.argv[2]==='stop') {
 const saved=JSON.parse(readFileSync('work/f07/cluster.json','utf8'));
 if(JSON.stringify(await snapshot())!==JSON.stringify(saved.databases)) throw new Error('Database baseline differs');
 if(saved.started) native('pg_ctl',['-D',data,'-m','fast','-w','stop']);
 console.log('Database baseline preserved; owned cluster stopped.');
}

