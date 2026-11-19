# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-availability.spec.ts >> F07 measures cold and warm catalog navigation with request and payload budgets
- Location: tests\e2e\guided-learning-availability.spec.ts:203:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('#leccion-unit')
Expected: ""
Error: strict mode violation: locator('#leccion-unit') resolved to 2 elements:
    1) <details open="" id="leccion-unit" class="PslgnG_unit" data-unit-key="unit">…</details> aka getByRole('tabpanel', { name: 'Actividades' }).getByText('1Unidad T03510 actividadesPor aprender0 de 9 actividades completadasObjetivo:')
    2) <details open="" id="leccion-unit" class="PslgnG_unit" data-unit-key="unit">…</details> aka getByText('1Unidad T03510 actividadesPor aprender0 de 9 actividades completadasObjetivo:').nth(1)

Call log:
  - Expect "toHaveAttribute" locator('#leccion-unit') with timeout 12000ms
  - waiting for locator('#leccion-unit')

```

# Page snapshot

```yaml
- generic [active] [ref=f45e1]:
  - generic [ref=f45e3]:
    - banner [ref=f45e4]:
      - search "Buscar guías" [ref=f45e6]:
        - combobox "Buscar guías" [ref=f45e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f45e11]
      - generic [ref=f45e12]:
        - button "Notificaciones" [ref=f45e14] [cursor=pointer]
        - button "Abrir menú de perfil de t035-38@example.test" [ref=f45e18] [cursor=pointer]:
          - generic [ref=f45e19]: T0
    - article [ref=f45e20]:
      - link "Todas las rutas" [ref=f45e21] [cursor=pointer]:
        - /url: /aprendizaje?tab=rutas
      - generic [ref=f45e25]:
        - heading "Ruta T035 pequeña" [level=1] [ref=f45e26]
        - generic [ref=f45e27]:
          - generic [ref=f45e28]: Tema T035
          - generic [ref=f45e29]: 1 unidades
        - group [ref=f45e30]:
          - generic "Acerca de esta ruta" [ref=f45e31] [cursor=pointer]
      - generic [ref=f45e35]:
        - region "Acción recomendada" [ref=f45e36]:
          - heading "Leer y comprender · Aplicar el ejemplo 1 (1/2)" [level=2] [ref=f45e41]
          - paragraph [ref=f45e42]: Unidad T035
          - button "Continuar" [ref=f45e44] [cursor=pointer]
          - group [ref=f45e45]:
            - generic "Ver recomendación" [ref=f45e46] [cursor=pointer]
        - region "Tu progreso" [ref=f45e49]:
          - heading "Tu progreso" [level=2] [ref=f45e50]
          - generic "Estado confirmado de la ruta" [ref=f45e51]:
            - generic [ref=f45e52]:
              - generic [ref=f45e53]: 0 de 9 actividades obligatorias completadas
              - progressbar "Actividades completadas" [ref=f45e54]
            - list [ref=f45e55]:
              - listitem "Actividades en curso" [ref=f45e56]:
                - strong [ref=f45e60]: Actividades
                - generic [ref=f45e61]: En curso
              - listitem "Aprendizaje por comprobar" [ref=f45e64]:
                - strong [ref=f45e68]: Lo aprendido
                - generic [ref=f45e69]: Por comprobar
              - listitem "Repaso a largo plazo pendiente" [ref=f45e72]:
                - strong [ref=f45e76]: Repaso con el tiempo
                - generic [ref=f45e77]: Pendiente
            - group [ref=f45e80]:
              - generic "Qué significa mi progreso" [ref=f45e81] [cursor=pointer]
          - region "Puntos de aprendizaje" [ref=f45e82]:
            - generic [ref=f45e83]:
              - strong [ref=f45e86]: 0 XP
              - generic [ref=f45e87]: 0 en esta ruta
            - group [ref=f45e88]:
              - generic "Cómo ganar más XP" [ref=f45e89] [cursor=pointer]
      - group "Diagnóstico inicial" [ref=f45e90]:
        - generic "Diagnóstico inicial Opcional" [ref=f45e91] [cursor=pointer]:
          - heading "Diagnóstico inicial" [level=2] [ref=f45e94]
          - generic [ref=f45e95]: Opcional
        - generic [ref=f45e98]:
          - paragraph [ref=f45e99]: El diagnóstico orienta tu recorrido y no reduce tu progreso. Puedes continuar aprendiendo sin hacerlo.
          - generic [ref=f45e100]:
            - button "Comenzar diagnóstico" [ref=f45e102] [cursor=pointer]
            - button "Aprender sin diagnóstico" [ref=f45e104] [cursor=pointer]
      - region [ref=f45e105]:
        - generic [ref=f45e106]:
          - heading "Unidades de la ruta" [level=2] [ref=f45e107]
          - generic [ref=f45e108]: "1"
        - generic [ref=f45e109]:
          - tablist "Contenido de la ruta" [ref=f45e110]:
            - tab "Actividades" [selected] [ref=f45e111] [cursor=pointer]
            - tab "Recursos" [ref=f45e112] [cursor=pointer]
          - tabpanel "Actividades" [ref=f45e113]:
            - group [ref=f45e115]:
              - generic "1 Unidad T035 10 actividades Por aprender" [ref=f45e116] [cursor=pointer]:
                - generic [ref=f45e117]: "1"
                - generic [ref=f45e118]:
                  - strong [ref=f45e119]: Unidad T035
                  - generic [ref=f45e120]:
                    - generic [ref=f45e121]: 10 actividades
                    - generic [ref=f45e122]: Por aprender
              - generic [ref=f45e125]:
                - generic [ref=f45e126]:
                  - generic [ref=f45e127]: 0 de 9 actividades completadas
                  - progressbar "Actividades completadas de Unidad T035" [ref=f45e128]
                - generic [ref=f45e129]:
                  - 'region "Objetivo: Aplicar el ejemplo 1" [ref=f45e130]':
                    - generic [ref=f45e131]:
                      - 'heading "Objetivo: Aplicar el ejemplo 1" [level=3] [ref=f45e132]'
                      - generic [ref=f45e133]: Por aprender
                    - list "Actividades de Aplicar el ejemplo 1" [ref=f45e134]:
                      - listitem [ref=f45e135]:
                        - generic [ref=f45e139]:
                          - generic [ref=f45e140]:
                            - img "Lectura" [ref=f45e141]
                            - strong [ref=f45e144]: Leer y comprender · Aplicar el ejemplo 1 (1/2)
                          - button "Abrir actividad" [ref=f45e146] [cursor=pointer]
                      - listitem [ref=f45e147]:
                        - generic [aria-hidden] [ref=f45e148]: "2"
                        - generic [ref=f45e150]:
                          - img "Explicación escrita" [ref=f45e151]
                          - strong [ref=f45e154]: Explicar con tus palabras · Aplicar el ejemplo 1
                      - listitem [ref=f45e155]:
                        - generic [aria-hidden] [ref=f45e156]: "3"
                        - generic [ref=f45e158]:
                          - img "Pregunta de opción múltiple" [ref=f45e159]
                          - strong [ref=f45e162]: Elegir la respuesta correcta · Aplicar el ejemplo 1 (1/2)
                      - listitem [ref=f45e163]:
                        - generic [aria-hidden] [ref=f45e164]: "4"
                        - generic [ref=f45e166]:
                          - img "Respuesta breve" [ref=f45e167]
                          - strong [ref=f45e170]: Recordar sin mirar · Aplicar el ejemplo 1
                      - listitem [ref=f45e171]:
                        - generic [aria-hidden] [ref=f45e172]: "5"
                        - generic [ref=f45e174]:
                          - img "Pregunta de opción múltiple" [ref=f45e175]
                          - strong [ref=f45e178]: Elegir la respuesta correcta · Aplicar el ejemplo 1 (2/2)
                      - listitem [ref=f45e179]:
                        - generic [aria-hidden] [ref=f45e180]: "6"
                        - generic [ref=f45e182]:
                          - img "Relaciones" [ref=f45e183]
                          - strong [ref=f45e186]: Relacionar conceptos · Aplicar el ejemplo 1
                      - listitem [ref=f45e187]:
                        - generic [aria-hidden] [ref=f45e188]: "7"
                        - generic [ref=f45e190]:
                          - img "Ordenar elementos" [ref=f45e191]
                          - strong [ref=f45e194]: Ordenar la secuencia · Aplicar el ejemplo 1
                      - listitem [ref=f45e195]:
                        - generic [aria-hidden] [ref=f45e196]: "8"
                        - generic [ref=f45e198]:
                          - img "Práctica visual" [ref=f45e199]
                          - strong [ref=f45e202]: Identificar en la imagen · Aplicar el ejemplo 1
                      - listitem [ref=f45e203]:
                        - generic [aria-hidden] [ref=f45e204]: "9"
                        - generic [ref=f45e206]:
                          - img "Caso práctico" [ref=f45e207]
                          - strong [ref=f45e210]: Resolver un caso · Aplicar el ejemplo 1
                      - listitem [ref=f45e211]:
                        - generic [aria-hidden] [ref=f45e212]: "10"
                        - generic [ref=f45e214]:
                          - img "Lectura" [ref=f45e215]
                          - strong [ref=f45e218]: Leer y comprender · Aplicar el ejemplo 1 (2/2)
                          - generic [ref=f45e219]: Opcional
                  - generic [ref=f45e223]:
                    - strong [ref=f45e224]: Pon a prueba lo que aprendiste
                    - generic [ref=f45e225]: Al terminar las actividades, responde unas preguntas para ver qué recuerdas y qué conviene repasar.
      - group [ref=f45e226]:
        - heading "Repaso y comprobaciones" [level=2] [ref=f45e228] [cursor=pointer]
      - group [ref=f45e231]:
        - heading "Versiones e historial" [level=2] [ref=f45e233] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f45e236]:
      - link "Inicio" [ref=f45e237] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f45e241] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f45e246] [cursor=pointer]
      - link [ref=f45e250] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f45e253]: Rutas deaprendizaje
  - alert [ref=f45e254]
```