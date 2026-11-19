# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E01 creates a new persisted v2 draft using UI and keyboard
- Location: tests\e2e\guided-v2-journeys.spec.ts:58:5

# Error details

```
TimeoutError: locator.focus: Timeout 60000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Secciones de la guía', exact: true }).getByRole('button', { name: 'Fixture', exact: true })

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - banner [aria-hidden]:
        - generic:
          - search:
            - combobox
        - generic:
          - heading [level=1]: Koras
        - generic:
          - generic:
            - button
          - generic:
            - button:
              - generic: T0
      - region "Editor de ruta":
        - generic [aria-hidden]:
          - generic:
            - link:
              - /url: /panel/rutas
            - heading [level=1]: Nueva ruta
          - generic:
            - button:
              - generic: Importar
        - generic [aria-hidden]:
          - tablist:
            - tab [selected]:
              - strong: Datos
            - tab:
              - strong: Objetivos
            - tab:
              - strong: Práctica
            - tab:
              - strong: Evaluar
            - tab:
              - strong: Revisar
          - generic:
            - tabpanel:
              - generic:
                - generic:
                  - generic:
                    - heading [level=2]: Datos de la ruta
                  - group:
                    - generic: Datos de la ruta
                    - generic:
                      - generic:
                        - generic: Título
                        - textbox:
                          - /placeholder: Ej. Vascularización del abdomen
                          - text: Creación UI T035 mobile
                      - generic:
                        - generic: Tema del catálogo
                        - combobox
                      - generic:
                        - generic: Descripción
                        - textbox:
                          - /placeholder: ¿Qué aprenderá el estudiante en esta ruta?
                          - text: Borrador creado desde cero con fuentes sintéticas.
                      - generic:
                        - generic: Disciplina
                        - combobox
                  - region:
                    - generic:
                      - strong: Creación UI T035 mobile
                      - paragraph: Borrador creado desde cero con fuentes sintéticas.
                      - text: General
                - generic:
                  - generic:
                    - generic:
                      - heading [level=2]:
                        - text: Fuentes de estudio
                        - generic: "1"
                      - button: Añadir fuente
                    - generic:
                      - group:
                        - generic:
                          - text: +
                          - generic:
                            - strong: Buscar una guía
                    - generic:
                      - region:
                        - group:
                          - generic:
                            - text: −
                            - generic:
                              - strong: Guía T035
                            - generic:
                              - generic: Guía
                              - generic: Vinculada
                          - generic:
                            - group:
                              - generic: Editar Guía T035
                              - generic:
                                - generic:
                                  - generic: Nombre de la fuente
                                  - textbox: Guía T035
                                - generic:
                                  - generic: Tipo de fuente
                                  - combobox
                                - generic:
                                  - generic:
                                    - generic: Guía del catálogo
                                    - button
                                  - combobox
                                  - generic: Al elegir otra versión tendrás que volver a indicar el fragmento y su ubicación.
                              - region:
                                - generic:
                                  - heading [level=3]: Contenido utilizado
                                  - button [expanded]: Elegir sección de la guía
                                - paragraph: Elige la sección que respalda este contenido.
                                - group:
                                  - generic:
                                    - text: +
                                    - generic:
                                      - strong: Ajustar fragmento y ubicación
                              - paragraph: La referencia y la versión se conservan con la guía seleccionada.
                            - generic:
                              - button: Eliminar fuente
        - generic:
          - generic "Cambios sin guardar":
            - strong: Cambios sin guardar
          - generic [aria-hidden]:
            - button
            - button: Continuar
      - navigation [aria-hidden]:
        - link:
          - /url: /dashboard
          - generic: Inicio
        - link:
          - /url: /guias
          - generic: Guías
        - generic:
          - button:
            - generic: Materiales
        - link:
          - /url: /aprendizaje
          - generic: Rutas de aprendizaje
  - alert
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "Secciones de la guía" [level=2] [ref=e4]
      - button "Cerrar secciones" [active] [ref=e5] [cursor=pointer]
    - paragraph [ref=e8]: Guía T035
    - alert [ref=e9]:
      - text: No se pudieron cargar las secciones de esta versión. El fragmento guardado se conserva.
      - button "Reintentar secciones" [ref=e10] [cursor=pointer]
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
> 61  |   const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
      |                                          ^ TimeoutError: locator.focus: Timeout 60000ms exceeded.
  62  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
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
  141 |   const reinforcement = page.locator('details[aria-label="Refuerzo dirigido"]:visible');
  142 |   if (await reinforcement.getAttribute("open") === null) await reinforcement.locator(":scope > summary").click();
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
```