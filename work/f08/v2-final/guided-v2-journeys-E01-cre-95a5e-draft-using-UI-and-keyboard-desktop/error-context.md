# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E01 creates a new persisted v2 draft using UI and keyboard
- Location: tests\e2e\guided-v2-journeys.spec.ts:58:5

# Error details

```
Error: locator.focus: Error: strict mode violation: getByLabel('Objetivo de aprendizaje') resolved to 2 elements:
    1) <button type="button" data-state="closed" class="_sd3xq_helpButton" aria-label="Ayuda sobre objetivo de aprendizaje">…</button> aka getByRole('button', { name: 'Ayuda sobre objetivo de' })
    2) <input value="" id="_r_g_" required="" maxlength="240" aria-invalid="false" aria-describedby="_r_g_-help" data-field-path="package.objectives.0.title" placeholder="Ej. Identificar las ramas de la aorta abdominal"/> aka getByRole('textbox', { name: 'Objetivo de aprendizaje' })

Call log:
  - waiting for getByLabel('Objetivo de aprendizaje')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary "Navegación principal" [ref=e3]:
      - navigation [ref=e4]:
        - generic [ref=e5]:
          - link "Inicio" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
          - button "Administrar" [ref=e22] [cursor=pointer]:
            - generic [aria-hidden]: Administrar
    - generic [ref=e25]:
      - banner [ref=e26]:
        - button "Expandir menú principal" [ref=e28] [cursor=pointer]
        - search "Buscar guías" [ref=e32]:
          - combobox "Buscar guías" [ref=e35]
        - heading "Koras" [level=1] [ref=e37]
        - generic [ref=e38]:
          - button "Notificaciones" [ref=e40] [cursor=pointer]
          - button "Abrir menú de perfil de t035-1@example.test" [ref=e44] [cursor=pointer]:
            - generic [ref=e45]: T0
      - region "Editor de ruta" [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]:
            - link "Volver a rutas de aprendizaje" [ref=e49] [cursor=pointer]:
              - /url: /panel/rutas
            - heading "Nueva ruta" [level=1] [ref=e52]
          - button "Importar archivo de ruta" [ref=e54] [cursor=pointer]
        - generic [ref=e58]:
          - tablist "Secciones del editor de rutas" [ref=e59]:
            - tab "Datos y fuentes" [ref=e60] [cursor=pointer]:
              - strong [ref=e61]: Datos y fuentes
            - tab "Objetivos" [selected] [ref=e62] [cursor=pointer]:
              - strong [ref=e63]: Objetivos
              - generic [ref=e64]: "1"
            - tab "Recorrido" [ref=e65] [cursor=pointer]:
              - strong [ref=e66]: Actividades
              - generic [ref=e67]: "0"
            - tab "Evaluación y repaso" [ref=e68] [cursor=pointer]:
              - strong [ref=e69]: Evaluación
              - generic [ref=e70]: "0"
            - tab "Revisión" [ref=e71] [cursor=pointer]:
              - strong [ref=e72]: Revisión
          - tabpanel "Objetivos" [ref=e74]:
            - generic [ref=e75]:
              - complementary "Unidades de la ruta" [ref=e76]:
                - generic [ref=e77]:
                  - heading "Unidades" [level=2] [ref=e78]
                  - generic [ref=e79]: "1"
                - navigation "Ver objetivos por unidad" [ref=e80]:
                  - list [ref=e81]:
                    - listitem [ref=e82]:
                      - button "Ver objetivos de Unidad desde cero" [ref=e83] [cursor=pointer]:
                        - generic [ref=e86]:
                          - strong [ref=e87]: Unidad desde cero
                          - generic [ref=e88]: 1 objetivo
                - group "Crear una unidad" [ref=e91]:
                  - generic [ref=e93]:
                    - generic [ref=e94]: Nombre de nueva unidad
                    - textbox "Nombre de nueva unidad" [ref=e96]:
                      - /placeholder: Ej. Arterias del abdomen
                  - button "Añadir unidad" [disabled] [ref=e97]
                - group [ref=e100]:
                  - generic [ref=e101] [cursor=pointer]:
                    - text: +
                    - strong [ref=e103]: Orden de aprendizaje
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - heading "Objetivos 1" [level=2] [ref=e106]:
                    - text: Objetivos
                    - generic [ref=e107]: "1"
                  - button "Añadir objetivo" [ref=e108] [cursor=pointer]
                - status [ref=e111]: Unidad añadida. Ya puedes asignar objetivos.
                - region "Objetivo 1" [ref=e112]:
                  - group [ref=e113]:
                    - generic "− Objetivo 1 Unidad desde cero Esencial" [ref=e114] [cursor=pointer]:
                      - text: −
                      - generic [ref=e115]:
                        - strong [ref=e116]: Objetivo 1
                        - generic [ref=e117]: Unidad desde cero
                      - generic [ref=e118]: Esencial
                    - generic [ref=e119]:
                      - group "Editar objetivo 1" [ref=e120]:
                        - generic [ref=e122]:
                          - generic [ref=e123]:
                            - generic [ref=e124]:
                              - generic [ref=e125]: Objetivo de aprendizaje
                              - button "Ayuda sobre objetivo de aprendizaje" [ref=e126]
                            - textbox "Objetivo de aprendizaje" [active] [ref=e129]:
                              - /placeholder: Ej. Identificar las ramas de la aorta abdominal
                            - generic [ref=e130]: "Por ejemplo: identificar las relaciones de una estructura."
                          - generic [ref=e131]:
                            - generic [ref=e132]: Unidad
                            - combobox "Unidad" [ref=e134]:
                              - option "Unidad desde cero" [selected]
                          - generic [ref=e135]:
                            - generic [ref=e136]: Acción del estudiante
                            - combobox "Acción del estudiante" [ref=e138]:
                              - option "Identificar" [selected]
                              - option "Recordar"
                              - option "Relacionar"
                              - option "Diferenciar"
                              - option "Explicar"
                              - option "Predecir"
                              - option "Ordenar"
                              - option "Aplicar"
                              - option "Integrar"
                          - generic [ref=e139]:
                            - generic [ref=e140]: Prioridad
                            - combobox "Prioridad" [ref=e142]:
                              - option "Esencial" [selected]
                              - option "Prioritario"
                              - option "Complementario"
                              - option "Detalle"
                          - generic [ref=e143]:
                            - checkbox "Obligatorio (objetivo esencial)" [checked] [disabled] [ref=e144]
                            - text: Obligatorio (objetivo esencial)
                        - group [ref=e145]:
                          - generic [ref=e146] [cursor=pointer]:
                            - text: −
                            - strong [ref=e148]: Fuentes del objetivo
                          - generic [ref=e149]:
                            - paragraph [ref=e150]: Indica dónde se enseña esta capacidad. Las actividades nuevas heredarán estas fuentes para que no tengas que elegirlas cada vez.
                            - group "Fuentes del objetivo" [ref=e151]:
                              - generic [ref=e153]:
                                - checkbox "Guía T035 · Fixture" [ref=e154]
                                - generic [ref=e155]: Guía T035 · Fixture
                        - group [ref=e156]:
                          - generic [ref=e157] [cursor=pointer]:
                            - text: +
                            - strong [ref=e159]: Requisitos previos
                          - option "Selecciona un objetivo" [selected]
                      - button "Eliminar objetivo" [ref=e161] [cursor=pointer]
        - generic [ref=e164]:
          - generic "Cambios sin guardar" [ref=e165]:
            - strong [ref=e166]: Cambios sin guardar
          - generic [ref=e167]:
            - button "Atrás" [ref=e168] [cursor=pointer]
            - button "Guardar borrador" [ref=e172] [cursor=pointer]
            - button "Continuar" [ref=e174] [cursor=pointer]
  - alert [ref=e177]
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
  44  | async function finish(page:Page|Locator){const completed=page.getByRole("heading",{name:"Sesión completada",exact:true}),close=page.getByRole("button",{name:"Finalizar sesión",exact:true}).and(page.locator("button:enabled"));await expect(completed.or(close).first()).toBeVisible();if(!await completed.isVisible())await close.click();await expect(completed).toBeVisible();}
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
> 62  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
      |                                                      ^ Error: locator.focus: Error: strict mode violation: getByLabel('Objetivo de aprendizaje') resolved to 2 elements:
  63  |   await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  64  |   const topic = page.getByLabel("Tema del catálogo", { exact: true });
  65  |   await topic.selectOption({ label: "Tema T035" });
  66  |   await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  67  |   await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  68  |   const guide = page.getByLabel("Guía del catálogo", { exact: true });
  69  |   await guide.selectOption({ label: "Guía T035 · versión 1" });
  70  |   await press(page.getByRole("button", { name: "Elegir sección de la guía", exact: true }));
  71  |   const sections = page.getByRole("dialog", { name: "Secciones de la guía", exact: true });
  72  |   await press(sections.getByRole("button", { name: "Fixture", exact: true }));
  73  |   await expect(sections.getByLabel("Vista previa de la sección")).toHaveValue("Contenido sintético para comprobar el software.");
  74  |   await press(sections.getByRole("button", { name: "Usar esta sección", exact: true }));
  75  |   await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Objetivo de aprendizaje"),"Aplicar una relación sintética");
  76  |   await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  77  |   await press(page.getByRole("tab",{name:"Recorrido",exact:true}));await press(page.getByRole("button",{name:"Añadir actividad",exact:true}));
  78  |   await press(page.getByRole("button", { name: "Estudio", exact: true }));
  79  |   await press(page.getByRole("button", { name: "Crear actividad", exact: true }));
  80  |   await type(page.getByLabel("Consigna",{exact:true}),"Lee el ejemplo sintético.");await type(page.getByLabel("Contenido de estudio"),"Contenido sintético para comprobar el software.");
  81  |   await type(page.getByLabel("Explicación de la respuesta"),"La lectura está registrada; el dominio se comprobará con práctica.");
  82  |   const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  83  |   await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  84  |   const response=await saved;expect(response.status(),await response.text()).toBe(200);
  85  |   const body=await response.json();expect(body.status).toBe("draft");
  86  |   const persisted=await server(page,`/v2/editor/learning-paths/${body.pathId}`);expect(persisted.route.definition.objectives).toHaveLength(1);expect(persisted.route.definition.activities).toHaveLength(1);
  87  |   const { sources, activities } = persisted.route.definition;
  88  |   expect(sources).toHaveLength(1);
  89  |   expect(sources[0]).toMatchObject({
  90  |     locator: { heading: "Fixture" },
  91  |     excerpt: "Contenido sintético para comprobar el software.",
  92  |   });
  93  |   expect(activities[0].sourceKeys).toEqual([sources[0].key]);
  94  |   expect(activities[0].feedback.sourceKeys).toEqual([sources[0].key]);
  95  |   await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
  96  | });
  97  | 
  98  | test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  99  |   await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  100 |   await page.goto(`/panel/rutas/${f.pathId}`);
  101 |   await page.getByLabel("Título",{exact:true}).fill(`Ruta corregida T042 ${info.project.name}`);
  102 |   await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();
  103 |   await expect.poll(async()=>(await server(page,`/v2/editor/learning-paths/${f.pathId}`)).route.definition.route.title).toBe(`Ruta corregida T042 ${info.project.name}`);
  104 |   await page.reload();await expect(page.getByLabel("Título",{exact:true})).toHaveValue(`Ruta corregida T042 ${info.project.name}`);
  105 |   await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  106 |   const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  107 |   page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  108 |   await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  109 |   const preview=page.locator("[data-editor-preview]");
  110 |   async function explore(target:string,kinds:string[]){
  111 |     await preview.getByLabel("Explorar un punto de la ruta").selectOption(target);
  112 |     await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();
  113 |     for(const kind of kinds)await answer(preview,kind);
  114 |     await finish(preview);
  115 |   }
  116 |   await explore("assessment:diagnostic",["single_choice"]);
  117 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"],["remediate","study"]]){
  118 |     await explore(`activity:${key}-1`,[kind!]);
  119 |   }
  120 |   await explore("assessment:gate",["single_choice","short_answer","single_choice","match","sequence"]);
  121 |   await explore("assessment:final",["single_choice"]);
  122 |   await preview.getByRole("button",{name:"Avanzar 7 días",exact:true}).click();
  123 |   await explore("assessment:retention7",["single_choice"]);
  124 |   await preview.getByRole("button",{name:"Avanzar 30 días",exact:true}).click();
  125 |   await explore("assessment:retention30",["single_choice"]);
  126 |   await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  127 |   expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  128 |   await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  129 |   await expect(page.getByRole("button", { name: "Crear nueva versión", exact: true })).toBeEnabled();
  130 |   const published = await server(page, `/v2/guided-learning/paths/${f.slug}`);
  131 |   expect(published.path.pathVersionId).toBe(f.versionId);
  132 | });
  133 | 
  134 | test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  135 |   await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  136 |   for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  137 |   const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  138 |   await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  139 |   expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  140 |   const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);
  141 |   await page.getByRole("heading", { name: "Repaso y comprobaciones", exact: true }).click();
  142 |   const reinforcement = page.getByRole("group", { name: "Refuerzo dirigido", exact: true });
  143 |   await expect(reinforcement.getByText("Confusión CORE sintética", { exact: true })).toBeVisible();
  144 | });
  145 | 
  146 | test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
  147 |   test.setTimeout(240000);await actor(page,student(3,info.project.name==="mobile"));await enroll(page);
  148 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"]]){
  149 |     const attemptId=await launch(page,`${key}-1`);
  150 |     if(info.project.name==="mobile" && kind==="match"){await page.getByRole("button",{name:"Comprobar relaciones"}).evaluate(element=>element.scrollIntoView({block:"center"}));await page.screenshot({path:info.outputPath("match-mobile.png")});}
  151 |     await answer(page,kind!);await finish(page);
  152 |     const rows=(await server(page,`/__test/responses/${attemptId}`)).rows;expect(rows).toHaveLength(kind==="case"?2:1);
  153 |     const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client+1);
  154 |   }
  155 |   const large=await fixture(page,"large");expect(large.objectives).toBe(200);await page.goto("/aprendizaje/rutas/t035-large");await expect(page.getByRole("region",{name:"Objetivo: Aplicar el ejemplo 200",exact:true})).toBeVisible();
  156 | });
  157 | 
  158 | test("E05 disconnect before/after commit, reload and two tabs preserve one answer",async({page,context},info)=>{
  159 |   test.setTimeout(240000);
  160 |   for(const [index,afterCommit] of [[0,false],[1,true]] as const){
  161 |     await actor(page,student(4+index,info.project.name==="mobile"));await enroll(page);const attemptId=await launch(page);
  162 |     const pattern="**/api/v2/guided-learning/attempts/*/responses";let resolve!:()=>void;const intercepted=new Promise<void>(r=>resolve=r);
```