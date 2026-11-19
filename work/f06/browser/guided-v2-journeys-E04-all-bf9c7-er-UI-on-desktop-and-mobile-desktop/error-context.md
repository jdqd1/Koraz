# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E04 all eight kinds persist through the learner UI on desktop and mobile
- Location: tests\e2e\guided-v2-journeys.spec.ts:132:5

# Error details

```
TimeoutError: locator.click: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Finalizar sesión', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegación principal" [ref=f3e3]:
      - navigation [ref=f3e4]:
        - generic [ref=f3e5]:
          - link "Inicio" [ref=f3e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f3e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f3e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f3e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f3e20]:
      - banner [ref=f3e21]:
        - button "Expandir menú principal" [ref=f3e23] [cursor=pointer]
        - search "Buscar guías" [ref=f3e27]:
          - combobox "Buscar guías" [ref=f3e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f3e32]
        - generic [ref=f3e33]:
          - button "Notificaciones" [ref=f3e35] [cursor=pointer]
          - button "Abrir menú de perfil de t035-3@example.test" [ref=f3e39] [cursor=pointer]:
            - generic [ref=f3e40]: T0
      - main [ref=f3e41]:
        - region "Sesión de aprendizaje" [ref=f3e42]:
          - generic [ref=f3e43]:
            - generic [ref=f3e44]:
              - link "Volver a la unidad" [ref=f3e45] [cursor=pointer]:
                - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=choice-1#actividad-choice-1
              - generic [ref=f3e48]:
                - generic [ref=f3e49]: Práctica
                - heading "Tu sesión de aprendizaje" [level=1] [ref=f3e50]
              - group [ref=f3e51]:
                - button "Detalles de la sesión" [ref=f3e52] [cursor=pointer]
            - generic [ref=f3e55]:
              - progressbar "Avance de la ruta" [ref=f3e56]
              - generic [ref=f3e57]: 3 de 9
          - status [ref=f3e58]: Sesión completada y guardada.
          - generic [ref=f3e59]:
            - heading "Sesión completada" [active] [level=2] [ref=f3e63]
            - paragraph [ref=f3e64]: Tu progreso está guardado. Continúa a tu ritmo.
            - paragraph [ref=f3e65]: "Ganaste 0 XP · Total: 5 XP"
            - paragraph [ref=f3e66]: Esta sesión no generó un premio nuevo. Los logros ya premiados no se duplican y el repaso comparte un límite diario de 20 XP.
            - link "Ver repasos pendientes" [ref=f3e67] [cursor=pointer]:
              - /url: /aprendizaje/repaso
            - button "Siguiente actividad" [ref=f3e69] [cursor=pointer]
            - group [ref=f3e72]:
              - generic "Respuestas confirmadas +" [ref=f3e73] [cursor=pointer]
              - text: +
            - group [ref=f3e74]:
              - generic "Progreso y próximos repasos +" [ref=f3e75] [cursor=pointer]
            - link "Volver a la unidad" [ref=f3e76] [cursor=pointer]:
              - /url: /aprendizaje/rutas/t035-small?leccion=unit&objetivo=objective-1&actividad=choice-1#actividad-choice-1
  - alert [ref=f3e79]: Aprendizaje guiado
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
  24  |   await page.waitForFunction(()=>{const button=document.querySelector('[aria-label="Acción recomendada"] button');return button && Object.keys(button).some(k=>k.startsWith("__reactProps") && typeof (button as unknown as Record<string,{onClick?:unknown}>)[k]?.onClick==="function");});
  25  | }
  26  | async function launch(page:Page,key?:string){
  27  |   await page.goto(route);
  28  |   // SSR exposes the button before React attaches its event handler.
  29  |   await interactive(page);
  30  |   if(key){const current=await state(page);const branchIndex=current.maintenance.activities.findIndex((activity:{key:string})=>activity.key===key);expect(branchIndex).toBeGreaterThanOrEqual(0);
  31  |     const row = page.locator(`[id="actividad-${key}"]`);
  32  |     await row.getByRole("button", { name: "Abrir actividad", exact: true }).click();
  33  |   }else await page.getByRole("button",{name:"Continuar",exact:true}).first().click();
  34  |   await expect(page).toHaveURL(/\/aprendizaje\/sesiones\//);
  35  |   await expect(page.getByRole("heading",{name:"Tu sesión de aprendizaje",exact:true})).toBeVisible();
  36  |   return page.url().split("/sesiones/")[1]!.split("?")[0]!;
  37  | }
  38  | async function feedback(page:Page|Locator){
  39  |   const button=page.getByRole("button",{name:/^(Continuar|Ver cierre de sesión)$/}).last();
  40  |   await expect(button).toBeVisible();await button.click();
  41  | }
  42  | async function clickCentered(locator:Locator){await locator.evaluate(element=>element.scrollIntoView({block:"center",inline:"nearest"}));await locator.click();}
  43  | async function hydrated(locator:Locator){await expect.poll(async()=>locator.evaluate(element=>Object.keys(element).some(key=>key.startsWith("__reactProps") && typeof (element as unknown as Record<string,{onClick?:unknown}>)[key]?.onClick==="function"))).toBe(true);}
> 44  | async function finish(page:Page|Locator){const completed=page.getByRole("heading",{name:"Sesión completada",exact:true});if(!await completed.isVisible())await page.getByRole("button",{name:"Finalizar sesión",exact:true}).click();await expect(completed).toBeVisible();}
      |                                                                                                                                                                                                                              ^ TimeoutError: locator.click: Timeout 60000ms exceeded.
  45  | async function answer(page:Page|Locator,kind:string,wrong=false){
  46  |   if(kind==="study"){await page.getByRole("button",{name:"Guardar lectura"}).click();return;}
  47  |   if(kind==="single_choice"){await page.getByRole("radio",{name:wrong?"Respuesta B":"Respuesta A",exact:true}).check();await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  48  |   if(kind==="short_answer"){await page.getByLabel("Tu respuesta",{exact:true}).fill("respuesta");await page.getByRole("button",{name:"Comprobar respuesta",exact:true}).click();}
  49  |   if(kind==="constructed_response"){await page.getByLabel("Explica con tus palabras").fill("Una relación sintética.");await page.getByRole("button",{name:"Guardar mi respuesta"}).click();await page.getByRole("button",{name:"Comparar con el modelo"}).click();await expect(page.getByRole("heading",{name:"Respuesta modelo",exact:true})).toBeVisible();await page.getByRole("button",{name:"Lo recuperé",exact:true}).click();}
  50  |   if(kind==="match"){await page.getByRole("combobox",{name:"Origen",exact:true}).selectOption("c");await clickCentered(page.getByRole("button",{name:"Comprobar relaciones"}));}
  51  |   if(kind==="sequence"){await clickCentered(page.getByRole("button",{name:"Comprobar secuencia"}));}
  52  |   if(kind==="image_target"){await page.getByText("Ajustar el punto seleccionado",{exact:true}).first().click();await expect(page.getByLabel("Horizontal (%)")).toBeEnabled();await page.getByLabel("Horizontal (%)").fill("20");await page.getByLabel("Vertical (%)").fill("20");await clickCentered(page.getByRole("button",{name:"Comprobar respuesta visual"}));}
  53  |   if(kind==="case"){await expect(page.getByText(/Etapa 2: relación sintética/)).toHaveCount(0);await answer(page,"single_choice");await expect(page.getByText(/Etapa 2: relación sintética/)).toBeVisible();await answer(page,"short_answer");return;}
  54  |   await feedback(page);
  55  | }
  56  | const student=(base:number,mobile:boolean)=>`student-${base+(mobile?10:0)}`;
  57  | 
  58  | test("E01 creates a new persisted v2 draft using UI and keyboard",async({page},info)=>{
  59  |   await actor(page,"editor");await page.goto("/panel/rutas/nueva?mode=v2");
  60  |   await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  61  |   const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
  62  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
  63  |   await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  64  |   await expect(page.getByLabel("Tema del catálogo").locator("option")).toHaveCount(2);
  65  |   await page.getByLabel("Tema del catálogo").focus();await page.getByLabel("Tema del catálogo").press("End");await page.getByLabel("Tema del catálogo").press("Tab");
  66  |   await expect(page.getByLabel("Tema del catálogo")).not.toHaveValue("");
  67  |   await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  68  |   await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  69  |   await expect(page.getByLabel("Guía y revisión").locator("option")).toHaveCount(2);
  70  |   await page.getByLabel("Guía y revisión").focus();await page.getByLabel("Guía y revisión").press("End");await page.getByLabel("Guía y revisión").press("Tab");
  71  |   await expect(page.getByLabel("Guía y revisión")).not.toHaveValue("");
  72  |   await type(page.getByLabel("Cita bibliográfica"),"Fuente sintética T035 (2026)");
  73  |   await type(page.getByLabel("Sección o encabezado"),"Fixture");await type(page.getByLabel("Fragmento de la fuente"),"Contenido sintético para comprobar el software.");
  74  |   await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Objetivo de aprendizaje"),"Aplicar una relación sintética");
  75  |   await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  76  |   await press(page.getByRole("tab",{name:"Recorrido",exact:true}));await press(page.getByRole("button",{name:"Añadir actividad",exact:true}));
  77  |   await type(page.getByLabel("Consigna",{exact:true}),"Lee el ejemplo sintético.");await type(page.getByLabel("Contenido de estudio"),"Contenido sintético para comprobar el software.");
  78  |   await expect(page.getByRole("group",{name:"Fuentes de la actividad",exact:true}).getByRole("checkbox")).toBeChecked();
  79  |   await press(page.getByText("Respuesta y explicación",{exact:true}));await type(page.getByLabel("Explicación de la respuesta"),"La lectura está registrada; el dominio se comprobará con práctica.");
  80  |   await expect(page.getByRole("group",{name:"Fuentes de la explicación",exact:true}).getByRole("checkbox")).toBeChecked();
  81  |   const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  82  |   await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  83  |   const response=await saved;expect(response.status(),await response.text()).toBe(200);
  84  |   const body=await response.json();expect(body.status).toBe("draft");
  85  |   const persisted=await server(page,`/v2/editor/learning-paths/${body.pathId}`);expect(persisted.route.definition.objectives).toHaveLength(1);expect(persisted.route.definition.activities).toHaveLength(1);
  86  |   await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
  87  | });
  88  | 
  89  | test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  90  |   await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  91  |   await page.goto(`/panel/rutas/${f.pathId}`);
  92  |   await page.getByLabel("Título",{exact:true}).fill(`Ruta corregida T042 ${info.project.name}`);
  93  |   await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();
  94  |   await expect.poll(async()=>(await server(page,`/v2/editor/learning-paths/${f.pathId}`)).route.definition.route.title).toBe(`Ruta corregida T042 ${info.project.name}`);
  95  |   await page.reload();await expect(page.getByLabel("Título",{exact:true})).toHaveValue(`Ruta corregida T042 ${info.project.name}`);
  96  |   await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  97  |   const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  98  |   page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  99  |   await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  100 |   const preview=page.locator("[data-editor-preview]");
  101 |   async function explore(target:string,kinds:string[]){
  102 |     await preview.getByLabel("Explorar un punto de la ruta").selectOption(target);
  103 |     await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();
  104 |     for(const kind of kinds)await answer(preview,kind);
  105 |     await finish(preview);
  106 |   }
  107 |   await explore("assessment:diagnostic",["single_choice"]);
  108 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"],["remediate","study"]]){
  109 |     await explore(`activity:${key}-1`,[kind!]);
  110 |   }
  111 |   await explore("assessment:gate",["single_choice","short_answer","single_choice","match","sequence"]);
  112 |   await explore("assessment:final",["single_choice"]);
  113 |   await preview.getByRole("button",{name:"Avanzar 7 días",exact:true}).click();
  114 |   await explore("assessment:retention7",["single_choice"]);
  115 |   await preview.getByRole("button",{name:"Avanzar 30 días",exact:true}).click();
  116 |   await explore("assessment:retention30",["single_choice"]);
  117 |   await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  118 |   expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  119 |   await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  120 |   await expect(page.getByText("Publicada",{exact:true})).toBeVisible();const published=await server(page,`/v2/guided-learning/paths/${f.slug}`);expect(published.path.pathVersionId).toBe(f.versionId);
  121 | });
  122 | 
  123 | test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  124 |   await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  125 |   for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  126 |   const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  127 |   await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  128 |   expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  129 |   const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);await expect(page.locator('details[aria-label="Refuerzo dirigido"]').getByText("Confusión CORE sintética",{exact:true})).toBeVisible();
  130 | });
  131 | 
  132 | test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
  133 |   test.setTimeout(240000);await actor(page,student(3,info.project.name==="mobile"));await enroll(page);
  134 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"]]){
  135 |     const attemptId=await launch(page,`${key}-1`);
  136 |     if(info.project.name==="mobile" && kind==="match"){await page.getByRole("button",{name:"Comprobar relaciones"}).evaluate(element=>element.scrollIntoView({block:"center"}));await page.screenshot({path:info.outputPath("match-mobile.png")});}
  137 |     await answer(page,kind!);await finish(page);
  138 |     const rows=(await server(page,`/__test/responses/${attemptId}`)).rows;expect(rows).toHaveLength(kind==="case"?2:1);
  139 |     const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  140 |   }
  141 |   const large=await fixture(page,"large");expect(large.objectives).toBe(200);await page.goto("/aprendizaje/rutas/t035-large");await expect(page.getByText("Aplicar el ejemplo 200",{exact:true})).toBeVisible();
  142 | });
  143 | 
  144 | test("E05 disconnect before/after commit, reload and two tabs preserve one answer",async({page,context},info)=>{
```