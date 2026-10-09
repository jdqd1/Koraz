# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E05 disconnect before/after commit, reload and two tabs preserve one answer
- Location: tests\e2e\guided-v2-journeys.spec.ts:104:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Continuar', exact: true }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Continuar', exact: true }).first() with timeout 15000ms
  - waiting for getByRole('button', { name: 'Continuar', exact: true }).first()

```

```yaml
- complementary "Navegación principal":
  - navigation:
    - link:
      - /url: /dashboard
      - img
    - link:
      - /url: /aprendizaje
      - img
    - link:
      - /url: /asignaturas
      - img
    - button:
      - img
- banner:
  - button "Expandir menú principal"
  - search "Buscar guías":
    - combobox "Buscar guías"
  - heading "Aprendizaje guiado" [level=1]
  - button "Notificaciones"
  - link:
    - /url: /acceder
- main:
  - link "Todas las rutas":
    - /url: /aprendizaje?tab=rutas
  - text: Tema T035
  - heading "Ruta T035 pequeña" [level=1]
  - paragraph: Fixture de software sin contenido clínico real.
  - text: 1 unidades
  - button "Comenzar"
  - region "Qué aprenderás":
    - text: Mapa de la ruta
    - heading "Qué aprenderás" [level=2]
    - paragraph: La práctica disponible depende de la evidencia confirmada de tus objetivos.
    - group:
      - text: 1 Unidad 1
      - strong: Unidad T035
      - emphasis: 1 objetivo
      - strong: Al terminar podrás
      - list:
        - listitem:
          - strong: Aplicar el ejemplo 1
          - text: Estado por cargar · objetivo esencial
- alert
```

# Test source

```ts
  1   | import { test, expect, type Page, type Locator } from "@playwright/test";
  2   | 
  3   | const api="http://127.0.0.1:41035";
  4   | const route="/aprendizaje/rutas/t035-small";
  5   | async function actor(page:Page,name:string){
  6   |   await page.context().addCookies([{name:"t035",value:name,domain:"127.0.0.1",path:"/"}]);
  7   |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  8   | }
  9   | async function server(page:Page,path:string){const r=await page.request.get(api+path);expect(r.ok()).toBeTruthy();return r.json();}
  10  | const fixture=async(page:Page,key="small")=>(await server(page,"/__test/ready")).fixtures[key];
  11  | async function state(page:Page){const path=await server(page,"/v2/guided-learning/paths/t035-small");return (await server(page,`/v2/guided-learning/enrollments/${path.path.enrollmentId}/state`)).state;}
  12  | async function enroll(page:Page){
  13  |   await page.goto(route);await page.getByRole("button",{name:"Comenzar",exact:true}).click();
> 14  |   await expect(page.getByRole("button",{name:"Continuar",exact:true}).first()).toBeVisible();
      |                                                                                ^ Error: expect(locator).toBeVisible() failed
  15  | }
  16  | async function launch(page:Page,key?:string){
  17  |   await page.goto(route);
  18  |   // SSR exposes the button before React attaches its event handler.
  19  |   await page.waitForFunction(()=>{const button=document.querySelector(".learning-path-hero button");return button && Object.keys(button).some(k=>k.startsWith("__reactProps"));});
  20  |   if(key){const current=await state(page);expect(current.maintenance.activities.map((a:{key:string})=>a.key)).toContain(key);
  21  |     await page.getByText("Refuerzo, repaso y mantenimiento",{exact:true}).click();
  22  |     const branches=page.getByRole("region",{name:"Otras ramas disponibles"});
  23  |     await branches.getByRole("button",{name:"Practicar este objetivo",exact:true}).first().click();
  24  |   }else await page.getByRole("button",{name:"Continuar",exact:true}).first().click();
  25  |   await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  26  |   await expect(page.getByRole("heading",{name:"Tu sesión de aprendizaje",exact:true})).toBeVisible();
  27  |   return page.url().split("/sesiones/")[1]!.split("?")[0]!;
  28  | }
  29  | async function feedback(page:Page|Locator){
  30  |   const button=page.getByRole("button",{name:/^(Continuar|Ver cierre de sesión)$/}).last();
  31  |   await expect(button).toBeVisible();await button.click();
  32  | }
  33  | async function finish(page:Page|Locator){await page.getByRole("button",{name:"Finalizar sesión",exact:true}).click();await expect(page.getByRole("heading",{name:"Sesión completada",exact:true})).toBeVisible();}
  34  | async function answer(page:Page|Locator,kind:string,wrong=false){
  35  |   if(kind==="study"){await page.getByRole("button",{name:"Continuar a la práctica"}).click();return;}
  36  |   if(kind==="single_choice"){await page.getByRole("radio",{name:wrong?"Respuesta B":"Respuesta A",exact:true}).check();await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  37  |   if(kind==="short_answer"){await page.getByLabel("Tu respuesta",{exact:true}).fill("respuesta");await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  38  |   if(kind==="constructed_response"){await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");await page.getByRole("button",{name:"Guardar mi respuesta"}).click();await page.getByRole("button",{name:"Comparar con el modelo"}).click();await expect(page.getByRole("heading",{name:"Respuesta modelo",exact:true})).toBeVisible();await page.getByRole("button",{name:"Lo recuperé",exact:true}).click();}
  39  |   if(kind==="match"){await page.getByRole("combobox",{name:"Origen",exact:true}).selectOption("c");await page.getByRole("button",{name:"Comprobar relaciones"}).click();}
  40  |   if(kind==="sequence"){await page.getByRole("button",{name:"Comprobar secuencia"}).click();}
  41  |   if(kind==="image_target"){await page.getByLabel("Horizontal (%)").fill("20");await page.getByLabel("Vertical (%)").fill("20");await page.getByRole("button",{name:"Comprobar respuesta visual"}).click();}
  42  |   if(kind==="case"){await expect(page.getByText("Etapa 2: relación sintética",{exact:true})).toHaveCount(0);await answer(page,"single_choice");await expect(page.getByText("Etapa 2: relación sintética",{exact:true})).toBeVisible();await answer(page,"short_answer");return;}
  43  |   await feedback(page);
  44  | }
  45  | const student=(base:number,mobile:boolean)=>`student-${base+(mobile?10:0)}`;
  46  | 
  47  | test("E01 creates a new persisted v2 draft using UI and keyboard",async({page},info)=>{
  48  |   await actor(page,"editor");await page.goto("/panel/rutas/nueva?mode=v2");
  49  |   await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  50  |   const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
  51  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
  52  |   await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  53  |   await expect(page.getByLabel("Tema del catálogo").locator("option")).toHaveCount(2);
  54  |   await page.getByLabel("Tema del catálogo").focus();await page.getByLabel("Tema del catálogo").press("End");await page.getByLabel("Tema del catálogo").press("Tab");
  55  |   await expect(page.getByLabel("Tema del catálogo")).not.toHaveValue("");
  56  |   await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  57  |   await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  58  |   await expect(page.getByLabel("Guía y revisión").locator("option")).toHaveCount(2);
  59  |   await page.getByLabel("Guía y revisión").focus();await page.getByLabel("Guía y revisión").press("End");await page.getByLabel("Guía y revisión").press("Tab");
  60  |   await expect(page.getByLabel("Guía y revisión")).not.toHaveValue("");
  61  |   await type(page.getByLabel("Cita bibliográfica"),"Fuente sintética T035 (2026)");
  62  |   await type(page.getByLabel("Sección o encabezado"),"Fixture");await type(page.getByLabel("Fragmento de la fuente"),"Contenido sintético para comprobar el software.");
  63  |   await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Capacidad observable"),"Aplicar una relación sintética");
  64  |   await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  65  |   const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  66  |   await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  67  |   const response=await saved;expect(response.status(),await response.text()).toBe(200);
  68  |   const body=await response.json();expect(body.route.status).toBe("draft");expect(body.route.definition.objectives).toHaveLength(1);
  69  |   await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.route.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
  70  | });
  71  | 
  72  | test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  73  |   await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  74  |   await page.goto(`/panel/rutas/${f.pathId}`);await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  75  |   const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  76  |   page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  77  |   await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  78  |   const preview=page.locator("[data-editor-preview]");await preview.getByLabel("Explorar un punto de la ruta").selectOption("activity:study-1");await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();await answer(preview,"study");await finish(preview);
  79  |   await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  80  |   expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  81  |   await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  82  |   await expect(page.getByText("Publicada",{exact:true})).toBeVisible();const published=await server(page,`/v2/guided-learning/paths/${f.slug}`);expect(published.path.pathVersionId).toBe(f.versionId);
  83  | });
  84  | 
  85  | test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  86  |   await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  87  |   for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  88  |   const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  89  |   await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  90  |   expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  91  |   const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);await expect(page.getByText("Confusión CORE sintética",{exact:true})).toBeVisible();
  92  | });
  93  | 
  94  | test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
  95  |   test.setTimeout(240000);await actor(page,student(3,info.project.name==="mobile"));await enroll(page);
  96  |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"]]){
  97  |     const attemptId=await launch(page,`${key}-1`);await answer(page,kind!);await finish(page);
  98  |     const rows=(await server(page,`/__test/responses/${attemptId}`)).rows;expect(rows).toHaveLength(kind==="case"?2:1);
  99  |     const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  100 |   }
  101 |   const large=await fixture(page,"large");expect(large.objectives).toBe(200);await page.goto("/aprendizaje/rutas/t035-large");await expect(page.getByText("Aplicar el ejemplo 200",{exact:true})).toBeVisible();
  102 | });
  103 | 
  104 | test("E05 disconnect before/after commit, reload and two tabs preserve one answer",async({page,context},info)=>{
  105 |   test.setTimeout(240000);
  106 |   for(const [index,afterCommit] of [[0,false],[1,true]] as const){
  107 |     await actor(page,student(4+index,info.project.name==="mobile"));await enroll(page);const attemptId=await launch(page);
  108 |     const pattern="**/api/v2/guided-learning/attempts/*/responses";let resolve!:()=>void;const intercepted=new Promise<void>(r=>resolve=r);
  109 |     await page.route(pattern,async r=>{if(afterCommit){const response=await r.fetch();expect(response.status()).toBe(200);}await r.abort("failed");resolve();});
  110 |     await page.getByRole("button",{name:"Continuar a la práctica"}).click();await intercepted;
  111 |     await expect(page.getByText("Pendiente de confirmar",{exact:true})).toBeVisible();expect((await server(page,`/__test/responses/${attemptId}`)).rows).toHaveLength(afterCommit?1:0);
  112 |     await page.unroute(pattern);await page.reload();
  113 |     const retry=page.getByRole("button",{name:"Reintentar solicitud pendiente",exact:true});if(await retry.count())await retry.click();
  114 |     await expect(page.getByRole("button",{name:"Finalizar sesión",exact:true})).toBeVisible();await finish(page);expect((await server(page,`/__test/responses/${attemptId}`)).rows).toHaveLength(1);
```