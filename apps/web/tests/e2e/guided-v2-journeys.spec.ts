import { test, expect, type Page, type Locator } from "@playwright/test";

const api="http://127.0.0.1:41035";
const route="/aprendizaje/rutas/t035-small";
test.beforeAll(async({request})=>{
  test.setTimeout(420000);
  const ready=await (await request.get(api+"/__test/ready")).json();
  // Confirm the built application routes against the guarded local API.
  const warm=["/panel/rutas/nueva?mode=v2",`/panel/rutas/${ready.fixtures.editorial.pathId}`,"/api/v2/editor/learning-paths/source-catalog?limit=24&q=","/aprendizaje/rutas/t035-small","/api/v2/guided-learning/paths/t035-small","/aprendizaje/sesiones/77000000-0000-4000-8000-000000009999","/aprendizaje?tab=hoy","/aprendizaje/mapa","/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"];
  for(const path of warm){console.log(`Preparing local route ${path}`);await request.get(path,{headers:{cookie:"t035=editor"},timeout:120000});}
});
async function actor(page:Page,name:string){
  await page.context().addCookies([{name:"t035",value:name,domain:"127.0.0.1",path:"/"}]);
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
}
async function server(page:Page,path:string){const r=await page.request.get(api+path);expect(r.ok()).toBeTruthy();return r.json();}
const fixture=async(page:Page,key="small")=>(await server(page,"/__test/ready")).fixtures[key];
async function state(page:Page){const path=await server(page,"/v2/guided-learning/paths/t035-small");return (await server(page,`/v2/guided-learning/enrollments/${path.path.enrollmentId}/state`)).state;}
async function enroll(page:Page){
  await page.goto(route);await interactive(page);await page.getByRole("button",{name:"Comenzar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Continuar",exact:true}).first()).toBeVisible();
}
async function interactive(page:Page){
  await page.waitForFunction(()=>{const button=document.querySelector(".learning-path-hero button");return button && Object.keys(button).some(k=>k.startsWith("__reactProps") && typeof (button as unknown as Record<string,{onClick?:unknown}>)[k]?.onClick==="function");});
}
async function launch(page:Page,key?:string){
  await page.goto(route);
  // SSR exposes the button before React attaches its event handler.
  await interactive(page);
  if(key){const current=await state(page);const branchIndex=current.maintenance.activities.findIndex((activity:{key:string})=>activity.key===key);expect(branchIndex).toBeGreaterThanOrEqual(0);
    await page.getByRole("main").getByText("Refuerzo, repaso y mantenimiento",{exact:true}).click();
    const branches=page.getByRole("region",{name:"Otras ramas disponibles"});
    await branches.getByRole("button",{name:"Practicar este objetivo",exact:true}).nth(branchIndex).click();
  }else await page.getByRole("button",{name:"Continuar",exact:true}).first().click();
  await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  await expect(page.getByRole("heading",{name:"Tu sesión de aprendizaje",exact:true})).toBeVisible();
  return page.url().split("/sesiones/")[1]!.split("?")[0]!;
}
async function feedback(page:Page|Locator){
  const button=page.getByRole("button",{name:/^(Continuar|Ver cierre de sesión)$/}).last();
  await expect(button).toBeVisible();await button.click();
}
async function clickCentered(locator:Locator){await locator.evaluate(element=>element.scrollIntoView({block:"center",inline:"nearest"}));await locator.click();}
async function hydrated(locator:Locator){await expect.poll(async()=>locator.evaluate(element=>Object.keys(element).some(key=>key.startsWith("__reactProps") && typeof (element as unknown as Record<string,{onClick?:unknown}>)[key]?.onClick==="function"))).toBe(true);}
async function finish(page:Page|Locator){await page.getByRole("button",{name:"Finalizar sesión",exact:true}).click();await expect(page.getByRole("heading",{name:"Sesión completada",exact:true})).toBeVisible();}
async function answer(page:Page|Locator,kind:string,wrong=false){
  if(kind==="study"){await page.getByRole("button",{name:"Continuar a la práctica"}).click();return;}
  if(kind==="single_choice"){await page.getByRole("radio",{name:wrong?"Respuesta B":"Respuesta A",exact:true}).check();await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  if(kind==="short_answer"){await page.getByLabel("Tu respuesta",{exact:true}).fill("respuesta");await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  if(kind==="constructed_response"){await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");await page.getByRole("button",{name:"Guardar mi respuesta"}).click();await page.getByRole("button",{name:"Comparar con el modelo"}).click();await expect(page.getByRole("heading",{name:"Respuesta modelo",exact:true})).toBeVisible();await page.getByRole("button",{name:"Lo recuperé",exact:true}).click();}
  if(kind==="match"){await page.getByRole("combobox",{name:"Origen",exact:true}).selectOption("c");await clickCentered(page.getByRole("button",{name:"Comprobar relaciones"}));}
  if(kind==="sequence"){await clickCentered(page.getByRole("button",{name:"Comprobar secuencia"}));}
  if(kind==="image_target"){await expect(page.getByLabel("Horizontal (%)")).toBeEnabled();await page.getByLabel("Horizontal (%)").fill("20");await page.getByLabel("Vertical (%)").fill("20");await clickCentered(page.getByRole("button",{name:"Comprobar respuesta visual"}));}
  if(kind==="case"){await expect(page.getByRole("heading",{name:/Etapa 2: relación sintética/})).toHaveCount(0);await answer(page,"single_choice");await expect(page.getByRole("heading",{name:/Etapa 2: relación sintética/})).toBeVisible();await answer(page,"short_answer");return;}
  await feedback(page);
}
const student=(base:number,mobile:boolean)=>`student-${base+(mobile?10:0)}`;

test("E01 creates a new persisted v2 draft using UI and keyboard",async({page},info)=>{
  test.skip(info.project.name==="mobile","E01 validates keyboard creation on desktop; E04 owns the required mobile matrix.");
  await actor(page,"editor");await page.goto("/panel/rutas/nueva?mode=v2");
  await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
  const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
  await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  await expect(page.getByLabel("Tema del catálogo").locator("option")).toHaveCount(2);
  await page.getByLabel("Tema del catálogo").focus();await page.getByLabel("Tema del catálogo").press("End");await page.getByLabel("Tema del catálogo").press("Tab");
  await expect(page.getByLabel("Tema del catálogo")).not.toHaveValue("");
  await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  await expect(page.getByLabel("Guía y revisión").locator("option")).toHaveCount(2);
  await page.getByLabel("Guía y revisión").focus();await page.getByLabel("Guía y revisión").press("End");await page.getByLabel("Guía y revisión").press("Tab");
  await expect(page.getByLabel("Guía y revisión")).not.toHaveValue("");
  await type(page.getByLabel("Cita bibliográfica"),"Fuente sintética T035 (2026)");
  await type(page.getByLabel("Sección o encabezado"),"Fixture");await type(page.getByLabel("Fragmento de la fuente"),"Contenido sintético para comprobar el software.");
  await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Capacidad observable"),"Aplicar una relación sintética");
  await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  await press(page.getByRole("tab",{name:"Recorrido",exact:true}));await press(page.getByRole("button",{name:"Añadir actividad",exact:true}));
  await type(page.getByLabel("Consigna",{exact:true}),"Lee el ejemplo sintético.");await type(page.getByLabel("Contenido de estudio"),"Contenido sintético para comprobar el software.");
  await expect(page.getByRole("group",{name:"Fuentes de la actividad",exact:true}).getByRole("checkbox")).toBeChecked();
  await press(page.getByText("Solución y feedback · solo edición",{exact:true}));await type(page.getByLabel("Explicación del feedback"),"La lectura está registrada; el dominio se comprobará con práctica.");
  await expect(page.getByRole("group",{name:"Fuentes del feedback y de los distractores",exact:true}).getByRole("checkbox")).toBeChecked();
  const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  const response=await saved;expect(response.status(),await response.text()).toBe(200);
  const body=await response.json();expect(body.status).toBe("draft");
  const persisted=await server(page,`/v2/editor/learning-paths/${body.pathId}`);expect(persisted.route.definition.objectives).toHaveLength(1);expect(persisted.route.definition.activities).toHaveLength(1);
  await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
});

test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  test.skip(info.project.name==="mobile","The editorial workflow is covered once; E04 owns the required mobile matrix.");
  await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  await page.goto(`/panel/rutas/${f.pathId}`);await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  const preview=page.locator("[data-editor-preview]");
  async function explore(target:string,kinds:string[]){
    await preview.getByLabel("Explorar un punto de la ruta").selectOption(target);
    await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();
    for(const kind of kinds)await answer(preview,kind);
    await finish(preview);
  }
  await explore("assessment:diagnostic",["single_choice"]);
  for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"],["remediate","study"]]){
    await explore(`activity:${key}-1`,[kind!]);
  }
  await explore("assessment:gate",["single_choice","short_answer","single_choice","match","sequence"]);
  await explore("assessment:final",["single_choice"]);
  await preview.getByRole("button",{name:"Avanzar 7 días",exact:true}).click();
  await explore("assessment:retention7",["single_choice"]);
  await preview.getByRole("button",{name:"Avanzar 30 días",exact:true}).click();
  await explore("assessment:retention30",["single_choice"]);
  await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  await expect(page.getByText("Publicada",{exact:true})).toBeVisible();const published=await server(page,`/v2/guided-learning/paths/${f.slug}`);expect(published.path.pathVersionId).toBe(f.versionId);
});

test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  test.skip(info.project.name==="mobile","The server-confirmed remediation flow is covered once; E04 owns the required mobile matrix.");
  await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);await expect(page.getByRole("region",{name:"Refuerzo dirigido"}).getByText("Confusión CORE sintética",{exact:true})).toBeVisible();
});

test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
  test.setTimeout(240000);await actor(page,student(3,info.project.name==="mobile"));await enroll(page);
  for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"]]){
    const attemptId=await launch(page,`${key}-1`);
    if(info.project.name==="mobile" && kind==="match"){await page.getByRole("button",{name:"Comprobar relaciones"}).evaluate(element=>element.scrollIntoView({block:"center"}));await page.screenshot({path:info.outputPath("match-mobile.png")});}
    await answer(page,kind!);await finish(page);
    const rows=(await server(page,`/__test/responses/${attemptId}`)).rows;expect(rows).toHaveLength(kind==="case"?2:1);
    const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  }
  const large=await fixture(page,"large");expect(large.objectives).toBe(200);await page.goto("/aprendizaje/rutas/t035-large");await expect(page.getByText("Aplicar el ejemplo 200",{exact:true})).toBeVisible();
});

test("E05 disconnect before/after commit, reload and two tabs preserve one answer",async({page,context},info)=>{
  test.skip(info.project.name==="mobile","The network and concurrency flow is viewport-independent; E04 owns the required mobile matrix.");
  test.setTimeout(240000);
  for(const [index,afterCommit] of [[0,false],[1,true]] as const){
    await actor(page,student(4+index,info.project.name==="mobile"));await enroll(page);const attemptId=await launch(page);
    const pattern="**/api/v2/guided-learning/attempts/*/responses";let resolve!:()=>void;const intercepted=new Promise<void>(r=>resolve=r);
    let original:{body:string|null;key:string|undefined}|undefined;
    await page.route(pattern,async r=>{original={body:r.request().postData(),key:r.request().headers()["idempotency-key"]};if(afterCommit){const response=await r.fetch();expect(response.status()).toBe(200);}await r.abort("failed");resolve();});
    await page.getByRole("button",{name:"Continuar a la práctica"}).click();await intercepted;
    await expect(page.getByText("Pendiente de confirmar",{exact:true})).toBeVisible();expect((await server(page,`/__test/responses/${attemptId}`)).rows).toHaveLength(afterCommit?1:0);
    await page.unroute(pattern);await page.reload();
    const retry=page.getByRole("button",{name:"Reintentar solicitud pendiente",exact:true});await expect(retry).toBeVisible();await hydrated(retry);const confirmed=page.waitForResponse(r=>r.request().method()==="POST" && r.url().includes(`/api/v2/guided-learning/attempts/${attemptId}/responses`));await retry.click();const receipt=await confirmed;expect(receipt.status()).toBe(200);expect({body:receipt.request().postData(),key:receipt.request().headers()["idempotency-key"]}).toEqual(original);
    await expect(page.getByRole("button",{name:"Finalizar sesión",exact:true})).toBeVisible();await finish(page);expect((await server(page,`/__test/responses/${attemptId}`)).rows).toHaveLength(1);
  }
  await actor(page,student(6,info.project.name==="mobile"));await enroll(page);const attemptId=await launch(page);
  const other=await context.newPage();await other.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));await other.goto(page.url());
  await hydrated(page.getByRole("button",{name:"Continuar a la práctica"}));await hydrated(other.getByRole("button",{name:"Continuar a la práctica"}));
  const confirmations=[page,other].map(p=>p.waitForResponse(r=>r.request().method()==="POST" && r.url().includes(`/api/v2/guided-learning/attempts/${attemptId}/responses`)));
  await Promise.all([page,other].map(p=>p.getByRole("button",{name:"Continuar a la práctica"}).click()));
  for(const response of await Promise.all(confirmations))expect([200,409]).toContain(response.status());
  await expect.poll(async()=>(await server(page,`/__test/responses/${attemptId}`)).rows.length).toBe(1);
  await Promise.all([page.reload(),other.reload()]);for(const p of [page,other])await expect(p.getByRole("button",{name:"Finalizar sesión",exact:true})).toBeVisible();await other.close();
});

test("E06 home, real map, route, session and review keep the pinned server state",async({page},info)=>{
  test.skip(info.project.name==="mobile","The cross-surface flow is covered once; E04 owns the required mobile matrix.");
  await actor(page,student(7,info.project.name==="mobile"));await enroll(page);
  const ready=await page.request.post(api+`/__test/map/${student(7,info.project.name==="mobile")}`,{data:{}});expect(ready.ok()).toBeTruthy();
  await page.goto("/aprendizaje?tab=hoy");await expect(page.getByText("Ruta T035 pequeña",{exact:true}).first()).toBeVisible();
  await page.goto("/aprendizaje/mapa");await page.getByRole("button",{name:"Abrir Tema T035",exact:true}).click();await expect(page.getByText("Ruta T035 pequeña",{exact:true}).first()).toBeVisible();
  for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"]]){await launch(page,`${key}-1`);await answer(page,kind!);await finish(page);}
  const confirmed=await state(page);expect(confirmed.objectives[0].firstMasteredAt).not.toBeNull();
  await page.request.post(api+"/__test/clock",{data:{days:1}});
  await page.goto("/aprendizaje/repaso?motor=guided-v2&ruta=t035-small");await expect(page.getByRole("heading",{name:"Práctica y mantenimiento",exact:true})).toBeVisible();
  const current=await state(page);expect(current.pathVersionId).toBe(confirmed.pathVersionId);expect(current.objectives[0].reviewDue).toBe(true);
  await expect(page.getByText(`${current.completedActivities} actividades completadas de ${current.plannedRequiredActivities}`,{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Repasar objetivo 1",exact:true}).click();await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  const attemptId=page.url().split("/sesiones/")[1]!.split("?")[0]!;
  const manifest=(await server(page,`/v2/guided-learning/attempts/${attemptId}`)).attempt;expect(manifest.purpose).toBe("review");
  await answer(page,manifest.activeActivity.kind);await finish(page);expect((await server(page,`/__test/responses/${attemptId}`)).rows).toHaveLength(1);
  const reviewed=await state(page);expect(reviewed.pathVersionId).toBe(confirmed.pathVersionId);expect(reviewed.maintenance.agenda[0].dueAt).not.toBe(current.maintenance.agenda[0].dueAt);
});
