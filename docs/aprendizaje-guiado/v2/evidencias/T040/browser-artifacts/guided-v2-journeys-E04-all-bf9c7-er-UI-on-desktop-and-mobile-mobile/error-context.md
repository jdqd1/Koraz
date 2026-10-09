# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E04 all eight kinds persist through the learner UI on desktop and mobile
- Location: tests\e2e\guided-v2-journeys.spec.ts:131:5

# Error details

```
Error: locator.click: Error: strict mode violation: getByText('Refuerzo, repaso y mantenimiento', { exact: true }) resolved to 2 elements:
    1) <summary>Refuerzo, repaso y mantenimiento</summary> aka getByRole('main').getByText('Refuerzo, repaso y')
    2) <summary>Refuerzo, repaso y mantenimiento</summary> aka getByText('Refuerzo, repaso y').nth(1)

Call log:
  - waiting for getByText('Refuerzo, repaso y mantenimiento', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e3]:
    - banner [ref=f3e4]:
      - search "Buscar guías" [ref=f3e6]:
        - combobox "Buscar guías" [ref=f3e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f3e11]
      - generic [ref=f3e12]:
        - button "Notificaciones" [ref=f3e14] [cursor=pointer]
        - link "Acceder" [ref=f3e18] [cursor=pointer]:
          - /url: /acceder
    - main [ref=f3e22]:
      - link "Todas las rutas" [ref=f3e23] [cursor=pointer]:
        - /url: /aprendizaje?tab=rutas
      - generic [ref=f3e27]:
        - generic [ref=f3e28]: Tema T035
        - heading "Ruta T035 pequeña" [level=1] [ref=f3e29]
        - paragraph [ref=f3e30]: Fixture de software sin contenido clínico real.
        - generic [ref=f3e31]: 1 unidades
        - generic "Estado confirmado de la ruta" [ref=f3e33]:
          - generic [ref=f3e34]: Recorrido en curso
          - generic [ref=f3e35]: Dominio por comprobar
          - generic [ref=f3e36]: Consolidación pendiente
          - generic [ref=f3e37]: 0 repasos pendientes
          - generic [ref=f3e38]: 2 actividades completadas de 9
        - generic [ref=f3e39]:
          - paragraph [ref=f3e40]: Siguiente actividad de la rama disponible
          - button "Continuar" [ref=f3e41] [cursor=pointer]
      - region [ref=f3e43]:
        - generic [ref=f3e44]:
          - generic [ref=f3e45]:
            - text: Mapa de la ruta
            - heading "Qué aprenderás" [level=2] [ref=f3e46]
          - paragraph [ref=f3e47]: La práctica disponible depende de la evidencia confirmada de tus objetivos.
        - group [ref=f3e49]:
          - generic "1 Unidad 1 Unidad T035 1 objetivo" [ref=f3e50] [cursor=pointer]:
            - generic [ref=f3e51]: "1"
            - generic [ref=f3e52]:
              - generic [ref=f3e53]: Unidad 1
              - strong [ref=f3e54]: Unidad T035
              - emphasis [ref=f3e55]: 1 objetivo
          - generic [ref=f3e58]:
            - strong [ref=f3e59]: Al terminar podrás
            - list [ref=f3e60]:
              - listitem [ref=f3e61]:
                - strong [ref=f3e62]: Aplicar el ejemplo 1
                - generic [ref=f3e63]: En práctica · objetivo esencial
      - complementary "Actualización de la ruta" [ref=f3e64]:
        - generic [ref=f3e65]:
          - heading "Versiones de esta ruta" [level=2] [ref=f3e66]
          - paragraph [ref=f3e67]: Puedes revisar otra versión antes de adoptarla. Tu historial permanece disponible.
          - button "Revisar actualización o recuperar solicitud" [ref=f3e68] [cursor=pointer]
      - region "Historial de versiones" [ref=f3e69]:
        - generic [ref=f3e70]:
          - heading "Tu historial" [level=2] [ref=f3e71]
          - list [ref=f3e72]:
            - listitem [ref=f3e73]: Versión 1
      - generic [ref=f3e74]:
        - region "Diagnóstico inicial" [ref=f3e75]:
          - heading "Un punto de partida opcional" [level=2] [ref=f3e76]
          - paragraph [ref=f3e77]: El diagnóstico orienta tu recorrido y no reduce tu progreso. Puedes continuar aprendiendo sin hacerlo.
          - paragraph [ref=f3e78]: Continuaste sin diagnóstico. Tu progreso se conserva.
        - group [ref=f3e79]:
          - generic "Refuerzo, repaso y mantenimiento" [ref=f3e80]
    - navigation "Navegación móvil" [ref=f3e81]:
      - link "Inicio" [ref=f3e82] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f3e86] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f3e91] [cursor=pointer]
      - link [ref=f3e95] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f3e98]: Rutas deaprendizaje
  - alert [ref=f3e99]
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
> 31  |     await page.getByText("Refuerzo, repaso y mantenimiento",{exact:true}).click();
      |                                                                           ^ Error: locator.click: Error: strict mode violation: getByText('Refuerzo, repaso y mantenimiento', { exact: true }) resolved to 2 elements:
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
  47  |   if(kind==="study"){await page.getByRole("button",{name:"Continuar a la práctica"}).click();return;}
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
  60  |   test.skip(info.project.name==="mobile","E01 validates keyboard creation on desktop; E04 owns the required mobile matrix.");
  61  |   await actor(page,"editor");await page.goto("/panel/rutas/nueva?mode=v2");
  62  |   await expect(page.locator('[data-engine-version="guided-v2"]')).toBeVisible();
  63  |   const press=async(l:Locator)=>{await l.focus();await l.press("Enter");};
  64  |   const type=async(l:Locator,value:string)=>{await l.focus();await l.pressSequentially(value);};
  65  |   await type(page.getByLabel("Título",{exact:true}),`Creación UI T035 ${info.project.name}`);
  66  |   await expect(page.getByLabel("Tema del catálogo").locator("option")).toHaveCount(2);
  67  |   await page.getByLabel("Tema del catálogo").focus();await page.getByLabel("Tema del catálogo").press("End");await page.getByLabel("Tema del catálogo").press("Tab");
  68  |   await expect(page.getByLabel("Tema del catálogo")).not.toHaveValue("");
  69  |   await type(page.getByLabel("Descripción",{exact:true}),"Borrador creado desde cero con fuentes sintéticas.");
  70  |   await press(page.getByRole("button",{name:"Añadir fuente",exact:true}));
  71  |   await expect(page.getByLabel("Guía y revisión").locator("option")).toHaveCount(2);
  72  |   await page.getByLabel("Guía y revisión").focus();await page.getByLabel("Guía y revisión").press("End");await page.getByLabel("Guía y revisión").press("Tab");
  73  |   await expect(page.getByLabel("Guía y revisión")).not.toHaveValue("");
  74  |   await type(page.getByLabel("Cita bibliográfica"),"Fuente sintética T035 (2026)");
  75  |   await type(page.getByLabel("Sección o encabezado"),"Fixture");await type(page.getByLabel("Fragmento de la fuente"),"Contenido sintético para comprobar el software.");
  76  |   await press(page.getByRole("tab",{name:"Objetivos",exact:true}));await type(page.getByLabel("Nombre de nueva unidad"),"Unidad desde cero");await press(page.getByRole("button",{name:"Añadir unidad",exact:true}));await press(page.getByRole("button",{name:"Añadir objetivo",exact:true}));await type(page.getByLabel("Capacidad observable"),"Aplicar una relación sintética");
  77  |   await page.getByRole("group",{name:"Fuentes del objetivo"}).getByRole("checkbox").focus();await page.keyboard.press("Space");
  78  |   await press(page.getByRole("tab",{name:"Recorrido",exact:true}));await press(page.getByRole("button",{name:"Añadir actividad",exact:true}));
  79  |   await type(page.getByLabel("Consigna",{exact:true}),"Lee el ejemplo sintético.");await type(page.getByLabel("Contenido de estudio"),"Contenido sintético para comprobar el software.");
  80  |   await expect(page.getByRole("group",{name:"Fuentes de la actividad",exact:true}).getByRole("checkbox")).toBeChecked();
  81  |   await press(page.getByText("Solución y feedback · solo edición",{exact:true}));await type(page.getByLabel("Explicación del feedback"),"La lectura está registrada; el dominio se comprobará con práctica.");
  82  |   await expect(page.getByRole("group",{name:"Fuentes del feedback y de los distractores",exact:true}).getByRole("checkbox")).toBeChecked();
  83  |   const saved=page.waitForResponse(r=>r.request().method()==="POST" && r.url().endsWith("/api/v2/editor/learning-paths"));
  84  |   await press(page.getByRole("button",{name:"Guardar borrador",exact:true}));
  85  |   const response=await saved;expect(response.status(),await response.text()).toBe(200);
  86  |   const body=await response.json();expect(body.status).toBe("draft");
  87  |   const persisted=await server(page,`/v2/editor/learning-paths/${body.pathId}`);expect(persisted.route.definition.objectives).toHaveLength(1);expect(persisted.route.definition.activities).toHaveLength(1);
  88  |   await expect(page).toHaveURL(new RegExp(`/panel/rutas/${body.pathId}`));await page.reload();await expect(page.getByRole("heading",{name:`Creación UI T035 ${info.project.name}`,exact:true})).toBeVisible();
  89  | });
  90  | 
  91  | test("E02 editorial preview has no learner effects, then publishes with current approval",async({page},info)=>{
  92  |   test.skip(info.project.name==="mobile","The editorial workflow is covered once; E04 owns the required mobile matrix.");
  93  |   await actor(page,"editor");const f=await fixture(page,info.project.name==="mobile"?"editorial-mobile":"editorial");
  94  |   await page.goto(`/panel/rutas/${f.pathId}`);await page.getByRole("tab",{name:"Revisión",exact:true}).click();
  95  |   const before=await server(page,"/__test/counts");const learnerRequests:string[]=[];
  96  |   page.on("request",r=>{if(r.url().includes("/api/v2/guided-learning/"))learnerRequests.push(r.url());});
  97  |   await page.getByRole("button",{name:"Abrir vista previa",exact:true}).click();
  98  |   const preview=page.locator("[data-editor-preview]");
  99  |   async function explore(target:string,kinds:string[]){
  100 |     await preview.getByLabel("Explorar un punto de la ruta").selectOption(target);
  101 |     await preview.getByRole("button",{name:"Abrir punto seleccionado"}).click();
  102 |     for(const kind of kinds)await answer(preview,kind);
  103 |     await finish(preview);
  104 |   }
  105 |   await explore("assessment:diagnostic",["single_choice"]);
  106 |   for(const [key,kind] of [["study","study"],["constructed","constructed_response"],["choice","single_choice"],["short","short_answer"],["apply","single_choice"],["match","match"],["sequence","sequence"],["image","image_target"],["case","case"],["remediate","study"]]){
  107 |     await explore(`activity:${key}-1`,[kind!]);
  108 |   }
  109 |   await explore("assessment:gate",["single_choice","short_answer","single_choice","match","sequence"]);
  110 |   await explore("assessment:final",["single_choice"]);
  111 |   await preview.getByRole("button",{name:"Avanzar 7 días",exact:true}).click();
  112 |   await explore("assessment:retention7",["single_choice"]);
  113 |   await preview.getByRole("button",{name:"Avanzar 30 días",exact:true}).click();
  114 |   await explore("assessment:retention30",["single_choice"]);
  115 |   await preview.getByRole("button",{name:"Cerrar vista previa",exact:true}).first().click();
  116 |   expect(await server(page,"/__test/counts")).toEqual(before);expect(learnerRequests).toEqual([]);
  117 |   await page.getByRole("button",{name:"Enviar a revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Aprobar revisión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Aprobar revisión",exact:true}).click();await expect(page.getByRole("button",{name:"Publicar ruta",exact:true})).toBeVisible();await page.getByRole("button",{name:"Publicar ruta",exact:true}).click();await page.getByRole("button",{name:"Confirmar publicación",exact:true}).click();
  118 |   await expect(page.getByText("Publicada",{exact:true})).toBeVisible();const published=await server(page,`/v2/guided-learning/paths/${f.slug}`);expect(published.path.pathVersionId).toBe(f.versionId);
  119 | });
  120 | 
  121 | test("E03 beginner help and CORE error are confirmed by the server",async({page},info)=>{
  122 |   test.skip(info.project.name==="mobile","The server-confirmed remediation flow is covered once; E04 owns the required mobile matrix.");
  123 |   await actor(page,student(2,info.project.name==="mobile"));await enroll(page);
  124 |   for(const kind of ["study","constructed_response"]){await launch(page);await answer(page,kind);await finish(page);}
  125 |   const attemptId=await launch(page);await expect(page.getByText("Explicación sintética confirmada.",{exact:true})).toHaveCount(0);
  126 |   await page.getByRole("button",{name:"Necesito ayuda",exact:true}).click();await expect(page.getByRole("heading",{name:"Pista",exact:true})).toBeVisible();await answer(page,"single_choice",true);await finish(page);
  127 |   expect((await server(page,`/__test/responses/${attemptId}`)).rows).toEqual([{activity_key:"choice-1",assisted:true}]);
  128 |   const confirmed=await state(page);expect(confirmed.objectives[0].criticalErrorOpen).toBe(true);expect(confirmed.nextAction.kind).toBe("remediate");await page.goto(route);await expect(page.getByRole("region",{name:"Refuerzo dirigido"}).getByText("Confusión CORE sintética",{exact:true})).toBeVisible();
  129 | });
  130 | 
  131 | test("E04 all eight kinds persist through the learner UI on desktop and mobile",async({page},info)=>{
```