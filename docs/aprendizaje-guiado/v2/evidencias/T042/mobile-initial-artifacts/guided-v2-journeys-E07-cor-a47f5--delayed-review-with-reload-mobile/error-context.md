# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E07 corrected and published route completes diagnosis, final and delayed review with reload
- Location: tests\e2e\guided-v2-journeys.spec.ts:186:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Continuar a la práctica' })
    - locator resolved to <button disabled type="button" class="learning-primary-button">Continuar a la práctica</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=f7e1]:
  - generic [ref=f7e3]:
    - banner [ref=f7e4]:
      - search "Buscar guías" [ref=f7e6]:
        - combobox "Buscar guías" [ref=f7e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f7e11]
      - generic [ref=f7e12]:
        - button "Notificaciones" [ref=f7e14] [cursor=pointer]
        - link "Acceder" [ref=f7e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f7e22]:
      - region "Sesión de aprendizaje" [ref=f7e23]:
        - generic [ref=f7e24]:
          - link "Volver a mi aprendizaje" [ref=f7e25] [cursor=pointer]:
            - /url: /aprendizaje?tab=hoy
          - generic [ref=f7e26]:
            - text: Aprendizaje guiado
            - heading "Tu sesión de aprendizaje" [level=1] [ref=f7e27]
          - status [ref=f7e28]: Estado del servidor
        - status [ref=f7e29]: Respuesta confirmada y guardada.
        - generic "Estado confirmado de la ruta" [ref=f7e30]:
          - generic [ref=f7e31]: Recorrido en curso
          - generic [ref=f7e32]: Dominio por comprobar
          - generic [ref=f7e33]: Consolidación pendiente
          - generic [ref=f7e34]: 0 repasos pendientes
          - generic [ref=f7e35]: 7 actividades completadas de 9
        - generic [ref=f7e36]:
          - heading "Respuestas guardadas" [active] [level=2] [ref=f7e37]
          - paragraph [ref=f7e38]: Confirma el cierre para consultar el resultado de la sesión.
          - button "Finalizar sesión" [ref=f7e39] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f7e40]:
      - link "Inicio" [ref=f7e41] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f7e45] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f7e50] [cursor=pointer]
      - link [ref=f7e54] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f7e57]: Rutas deaprendizaje
  - alert [ref=f7e58]: Aprendizaje guiado
```

# Test source

```ts
  1   | import { test, expect, type Page, type Locator } from "@playwright/test";
  2   | 
  3   | const api="http://127.0.0.1:41035";
  4   | const route="/aprendizaje/rutas/t035-small";
  5   | test.beforeAll(async({request})=>{
  6   |   test.setTimeout(420000);
  7   |   const ready=await (await request.get(api+"/__test/ready")).json();
  8   |   // Confirm the built application routes against the guarded local API.
  9   |   const warm=["/panel/rutas/nueva?mode=v2",`/panel/rutas/${ready.fixtures.editorial.pathId}`,"/api/v2/editor/learning-paths/source-catalog?limit=24&q=","/aprendizaje/rutas/t035-small","/api/v2/guided-learning/paths/t035-small","/aprendizaje/sesiones/77000000-0000-4000-8000-000000009999","/aprendizaje?tab=hoy","/aprendizaje/mapa","/aprendizaje/repaso?motor=guided-v2&ruta=t035-small"];
  10  |   for(const path of warm){console.log(`Preparing local route ${path}`);await request.get(path,{headers:{cookie:"t035=editor"},timeout:120000});}
  11  | });
  12  | async function actor(page:Page,name:string){
  13  |   await page.context().addCookies([{name:"t035",value:name,domain:"127.0.0.1",path:"/"}]);
  14  |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  15  | }
  16  | async function server(page:Page,path:string){const r=await page.request.get(api+path);expect(r.ok()).toBeTruthy();return r.json();}
  17  | const fixture=async(page:Page,key="small")=>(await server(page,"/__test/ready")).fixtures[key];
  18  | async function state(page:Page){const path=await server(page,"/v2/guided-learning/paths/t035-small");return (await server(page,`/v2/guided-learning/enrollments/${path.path.enrollmentId}/state`)).state;}
  19  | async function enroll(page:Page){
  20  |   await page.goto(route);await interactive(page);await page.getByRole("button",{name:"Comenzar",exact:true}).click();
  21  |   await expect(page.getByRole("button",{name:"Continuar",exact:true}).first()).toBeVisible();
  22  | }
  23  | async function interactive(page:Page){
  24  |   await page.waitForFunction(()=>{const button=document.querySelector(".learning-path-hero button");return button && Object.keys(button).some(k=>k.startsWith("__reactProps") && typeof (button as unknown as Record<string,{onClick?:unknown}>)[k]?.onClick==="function");});
  25  | }
  26  | async function launch(page:Page,key?:string){
  27  |   await page.goto(route);
  28  |   // SSR exposes the button before React attaches its event handler.
  29  |   await interactive(page);
  30  |   if(key){const current=await state(page);const branchIndex=current.maintenance.activities.findIndex((activity:{key:string})=>activity.key===key);expect(branchIndex).toBeGreaterThanOrEqual(0);
  31  |     await page.getByRole("main").getByText("Refuerzo, repaso y mantenimiento",{exact:true}).click();
  32  |     const branches=page.getByRole("region",{name:"Otras ramas disponibles"});
  33  |     await branches.getByRole("button",{name:"Practicar este objetivo",exact:true}).nth(branchIndex).click();
  34  |   }else await page.getByRole("button",{name:"Continuar",exact:true}).first().click();
  35  |   await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  36  |   await expect(page.getByRole("heading",{name:"Tu sesión de aprendizaje",exact:true})).toBeVisible();
  37  |   return page.url().split("/sesiones/")[1]!.split("?")[0]!;
  38  | }
  39  | async function feedback(page:Page|Locator){
  40  |   const button=page.getByRole("button",{name:/^(Continuar|Ver cierre de sesión)$/}).last();
  41  |   await expect(button).toBeVisible();await button.click();
  42  | }
  43  | async function clickCentered(locator:Locator){await locator.evaluate(element=>element.scrollIntoView({block:"center",inline:"nearest"}));await locator.click();}
  44  | async function hydrated(locator:Locator){await expect.poll(async()=>locator.evaluate(element=>Object.keys(element).some(key=>key.startsWith("__reactProps") && typeof (element as unknown as Record<string,{onClick?:unknown}>)[key]?.onClick==="function"))).toBe(true);}
  45  | async function finish(page:Page|Locator){await page.getByRole("button",{name:"Finalizar sesión",exact:true}).click();await expect(page.getByRole("heading",{name:"Sesión completada",exact:true})).toBeVisible();}
  46  | async function answer(page:Page|Locator,kind:string,wrong=false){
> 47  |   if(kind==="study"){await page.getByRole("button",{name:"Continuar a la práctica"}).click();return;}
      |                                                                                      ^ TimeoutError: locator.click: Timeout 60000ms exceeded.
  48  |   if(kind==="single_choice"){await page.getByRole("radio",{name:wrong?"Respuesta B":"Respuesta A",exact:true}).check();await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  49  |   if(kind==="short_answer"){await page.getByLabel("Tu respuesta",{exact:true}).fill("respuesta");await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  50  |   if(kind==="constructed_response"){await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");await page.getByRole("button",{name:"Guardar mi respuesta"}).click();await page.getByRole("button",{name:"Comparar con el modelo"}).click();await expect(page.getByRole("heading",{name:"Respuesta modelo",exact:true})).toBeVisible();await page.getByRole("button",{name:"Lo recuperé",exact:true}).click();}
  51  |   if(kind==="match"){await page.getByRole("combobox",{name:"Origen",exact:true}).selectOption("c");await clickCentered(page.getByRole("button",{name:"Comprobar relaciones"}));}
  52  |   if(kind==="sequence"){await clickCentered(page.getByRole("button",{name:"Comprobar secuencia"}));}
  53  |   if(kind==="image_target"){await expect(page.getByLabel("Horizontal (%)")).toBeEnabled();await page.getByLabel("Horizontal (%)").fill("20");await page.getByLabel("Vertical (%)").fill("20");await clickCentered(page.getByRole("button",{name:"Comprobar respuesta visual"}));}
  54  |   if(kind==="case"){await expect(page.getByRole("heading",{name:/Etapa 2: relación sintética/})).toHaveCount(0);await answer(page,"single_choice");await expect(page.getByRole("heading",{name:/Etapa 2: relación sintética/})).toBeVisible();await answer(page,"short_answer");return;}
  55  |   await feedback(page);
  56  | }
  57  | const student=(base:number,mobile:boolean)=>`student-${base+(mobile?10:0)}`;
  58  | 
  59  | test("E01 creates a new persisted v2 draft using UI and keyboard",async({page},info)=>{
  60  |   await actor(page,"editor");await page.goto("/panel/rutas/nueva?mode=v2");
  61  |   await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  62  |   const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
  63  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
  64  |   await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  65  |   await expect(page.getByLabel("Tema del catálogo").locator("option")).toHaveCount(2);
  66  |   await page.getByLabel("Tema del catálogo").focus();await page.getByLabel("Tema del catálogo").press("End");await page.getByLabel("Tema del catálogo").press("Tab");
  67  |   await expect(page.getByLabel("Tema del catálogo")).not.toHaveValue("");
  68  |   await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  69  |   await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  70  |   await expect(page.getByLabel("Guía y revisión").locator("option")).toHaveCount(2);
  71  |   await page.getByLabel("Guía y revisión").focus();await page.getByLabel("Guía y revisión").press("End");await page.getByLabel("Guía y revisión").press("Tab");
  72  |   await expect(page.getByLabel("Guía y revisión")).not.toHaveValue("");
  73  |   await type(page.getByLabel("Cita bibliográfica"),"Fuente sintética T035 (2026)");
  74  |   await type(page.getByLabel("Sección o encabezado"),"Fixture");await type(page.getByLabel("Fragmento de la fuente"),"Contenido sintético para comprobar el software.");
  75  |   await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Capacidad observable"),"Aplicar una relación sintética");
  76  |   await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  77  |   await press(page.getByRole("tab",{name:"Recorrido",exact:true}));await press(page.getByRole("button",{name:"Añadir actividad",exact:true}));
  78  |   await type(page.getByLabel("Consigna",{exact:true}),"Lee el ejemplo sintético.");await type(page.getByLabel("Contenido de estudio"),"Contenido sintético para comprobar el software.");
  79  |   await expect(page.getByRole("group",{name:"Fuentes de la actividad",exact:true}).getByRole("checkbox")).toBeChecked();
  80  |   await press(page.getByText("Solución y feedback · solo edición",{exact:true}));await type(page.getByLabel("Explicación del feedback"),"La lectura está registrada; el dominio se comprobará con práctica.");
  81  |   await expect(page.getByRole("group",{name:"Fuentes del feedback y de los distractores",exact:true}).getByRole("checkbox")).toBeChecked();
  82  |   const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  83  |   await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  84  |   const response=await saved;expect(response.status(),await response.text()).toBe(200);
  85  |   const body=await response.json();expect(body.status).toBe("draft");
  86  |   const persisted=await server(page,`/v2/editor/learning-paths/${body.pathId}`);expect(persisted.route.definition.objectives).toHaveLength(1);expect(persisted.route.definition.activities).toHaveLength(1);
  87  |   await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
  88  | });
  89  | 
  90  | test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  91  |   await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  92  |   await page.goto(`/panel/rutas/${f.pathId}`);
  93  |   await page.getByLabel("Título",{exact:true}).fill(`Ruta corregida T042 ${info.project.name}`);
  94  |   await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();
  95  |   await expect.poll(async()=>(await server(page,`/v2/editor/learning-paths/${f.pathId}`)).route.definition.route.title).toBe(`Ruta corregida T042 ${info.project.name}`);
  96  |   await page.reload();await expect(page.getByLabel("Título",{exact:true})).toHaveValue(`Ruta corregida T042 ${info.project.name}`);
  97  |   await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  98  |   const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  99  |   page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  100 |   await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  101 |   const preview=page.locator("[data-editor-preview]");
  102 |   async function explore(target:string,kinds:string[]){
  103 |     await preview.getByLabel("Explorar un punto de la ruta").selectOption(target);
  104 |     await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();
  105 |     for(const kind of kinds)await answer(preview,kind);
  106 |     await finish(preview);
  107 |   }
  108 |   await explore("assessment:diagnostic",["single_choice"]);
  109 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"],["remediate","study"]]){
  110 |     await explore(`activity:${key}-1`,[kind!]);
  111 |   }
  112 |   await explore("assessment:gate",["single_choice","short_answer","single_choice","match","sequence"]);
  113 |   await explore("assessment:final",["single_choice"]);
  114 |   await preview.getByRole("button",{name:"Avanzar 7 días",exact:true}).click();
  115 |   await explore("assessment:retention7",["single_choice"]);
  116 |   await preview.getByRole("button",{name:"Avanzar 30 días",exact:true}).click();
  117 |   await explore("assessment:retention30",["single_choice"]);
  118 |   await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  119 |   expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  120 |   await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  121 |   await expect(page.getByText("Publicada",{exact:true})).toBeVisible();const published=await server(page,`/v2/guided-learning/paths/${f.slug}`);expect(published.path.pathVersionId).toBe(f.versionId);
  122 | });
  123 | 
  124 | test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  125 |   await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  126 |   for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  127 |   const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  128 |   await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  129 |   expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  130 |   const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);await expect(page.getByRole("region",{name:"Refuerzo dirigido"}).getByText("Confusión CORE sintética",{exact:true})).toBeVisible();
  131 | });
  132 | 
  133 | test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
  134 |   test.setTimeout(240000);await actor(page,student(3,info.project.name==="mobile"));await enroll(page);
  135 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"]]){
  136 |     const attemptId=await launch(page,`${key}-1`);
  137 |     if(info.project.name==="mobile" && kind==="match"){await page.getByRole("button",{name:"Comprobar relaciones"}).evaluate(element=>element.scrollIntoView({block:"center"}));await page.screenshot({path:info.outputPath("match-mobile.png")});}
  138 |     await answer(page,kind!);await finish(page);
  139 |     const rows=(await server(page,`/__test/responses/${attemptId}`)).rows;expect(rows).toHaveLength(kind==="case"?2:1);
  140 |     const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  141 |   }
  142 |   const large=await fixture(page,"large");expect(large.objectives).toBe(200);await page.goto("/aprendizaje/rutas/t035-large");await expect(page.getByText("Aplicar el ejemplo 200",{exact:true})).toBeVisible();
  143 | });
  144 | 
  145 | test("E05 disconnect before/after commit, reload and two tabs preserve one answer",async({page,context},info)=>{
  146 |   test.setTimeout(240000);
  147 |   for(const [index,afterCommit] of [[0,false],[1,true]] as const){
```