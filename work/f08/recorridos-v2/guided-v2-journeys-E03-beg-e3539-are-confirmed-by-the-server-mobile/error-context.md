# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E03 beginner help and CORE error are confirmed by the server
- Location: tests\e2e\guided-v2-journeys.spec.ts:123:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('details[aria-label="Refuerzo dirigido"]').getByText('Confusión CORE sintética', { exact: true })
Expected: visible
Error: strict mode violation: locator('details[aria-label="Refuerzo dirigido"]').getByText('Confusión CORE sintética', { exact: true }) resolved to 2 elements:
    1) <p>Confusión CORE sintética</p> aka getByRole('article').getByText('Confusión CORE sintética')
    2) <p>Confusión CORE sintética</p> aka getByText('Confusión CORE sintética').nth(1)

Call log:
  - Expect "toBeVisible" locator('details[aria-label="Refuerzo dirigido"]').getByText('Confusión CORE sintética', { exact: true }) with timeout 60000ms
  - waiting for locator('details[aria-label="Refuerzo dirigido"]').getByText('Confusión CORE sintética', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f4e1]:
  - generic [ref=f4e3]:
    - banner [ref=f4e4]:
      - search "Buscar guías" [ref=f4e6]:
        - combobox "Buscar guías" [ref=f4e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f4e11]
      - generic [ref=f4e12]:
        - button "Notificaciones" [ref=f4e14] [cursor=pointer]
        - button "Abrir menú de perfil de t035-12@example.test" [ref=f4e18] [cursor=pointer]:
          - generic [ref=f4e19]: T0
    - article [ref=f4e20]:
      - link "Todas las rutas" [ref=f4e21] [cursor=pointer]:
        - /url: /aprendizaje?tab=rutas
      - generic [ref=f4e25]:
        - heading "Ruta T035 pequeña" [level=1] [ref=f4e26]
        - generic [ref=f4e27]:
          - generic [ref=f4e28]: Tema T035
          - generic [ref=f4e29]: 1 unidades
        - group [ref=f4e30]:
          - generic "Acerca de esta ruta" [ref=f4e31] [cursor=pointer]
      - generic [ref=f4e35]:
        - region "Acción recomendada" [ref=f4e36]:
          - heading "Refuerza lo aprendido" [level=2] [ref=f4e41]
          - paragraph [ref=f4e42]: Unidad T035
          - button "Reforzar" [ref=f4e44] [cursor=pointer]
          - group [ref=f4e45]:
            - generic "Ver recomendación" [ref=f4e46] [cursor=pointer]
        - region "Tu progreso" [ref=f4e49]:
          - heading "Tu progreso" [level=2] [ref=f4e50]
          - generic "Estado confirmado de la ruta" [ref=f4e51]:
            - generic [ref=f4e52]:
              - generic [ref=f4e53]: 3 de 9 actividades obligatorias completadas
              - progressbar "Actividades completadas" [ref=f4e54]
            - list [ref=f4e55]:
              - listitem "Actividades en curso" [ref=f4e56]:
                - strong [ref=f4e60]: Actividades
                - generic [ref=f4e61]: En curso
              - listitem "Aprendizaje por comprobar" [ref=f4e64]:
                - strong [ref=f4e68]: Lo aprendido
                - generic [ref=f4e69]: Por comprobar
              - listitem "Repaso a largo plazo pendiente" [ref=f4e72]:
                - strong [ref=f4e76]: Repaso con el tiempo
                - generic [ref=f4e77]: Pendiente
            - generic [ref=f4e80]: 1 objetivo por reforzar
            - group [ref=f4e82]:
              - generic "Qué significa mi progreso" [ref=f4e83] [cursor=pointer]
          - region "Puntos de aprendizaje" [ref=f4e84]:
            - generic [ref=f4e85]:
              - strong [ref=f4e88]: 0 XP
              - generic [ref=f4e89]: 0 en esta ruta
            - group [ref=f4e90]:
              - generic "Cómo ganar más XP" [ref=f4e91] [cursor=pointer]
      - group "Diagnóstico inicial" [ref=f4e92]:
        - generic "Diagnóstico inicial Opcional" [ref=f4e93] [cursor=pointer]:
          - heading "Diagnóstico inicial" [level=2] [ref=f4e96]
          - generic [ref=f4e97]: Opcional
      - region [ref=f4e100]:
        - generic [ref=f4e101]:
          - heading "Unidades de la ruta" [level=2] [ref=f4e102]
          - generic [ref=f4e103]: "1"
        - generic [ref=f4e104]:
          - tablist "Contenido de la ruta" [ref=f4e105]:
            - tab "Actividades" [selected] [ref=f4e106] [cursor=pointer]
            - tab "Recursos" [ref=f4e107] [cursor=pointer]
          - tabpanel "Actividades" [ref=f4e108]:
            - group [ref=f4e110]:
              - generic "1 Unidad T035 10 actividades Por reforzar" [ref=f4e111] [cursor=pointer]:
                - generic [ref=f4e112]: "1"
                - generic [ref=f4e113]:
                  - strong [ref=f4e114]: Unidad T035
                  - generic [ref=f4e115]:
                    - generic [ref=f4e116]: 10 actividades
                    - generic [ref=f4e117]: Por reforzar
              - generic [ref=f4e120]:
                - generic [ref=f4e121]:
                  - generic [ref=f4e122]: 3 de 9 actividades completadas
                  - progressbar "Actividades completadas de Unidad T035" [ref=f4e123]
                - generic [ref=f4e124]:
                  - 'region "Objetivo: Aplicar el ejemplo 1" [ref=f4e125]':
                    - generic [ref=f4e126]:
                      - 'heading "Objetivo: Aplicar el ejemplo 1" [level=3] [ref=f4e127]'
                      - generic [ref=f4e128]: Por reforzar
                    - paragraph [ref=f4e129]: Hay un concepto esencial por reforzar antes de continuar con las actividades que dependen de él.
                    - paragraph [ref=f4e130]:
                      - generic [ref=f4e133]: 3 actividades completadas
                    - list "Actividades de Aplicar el ejemplo 1" [ref=f4e134]:
                      - listitem [ref=f4e135]:
                        - generic [ref=f4e139]:
                          - generic [ref=f4e140]:
                            - img "Lectura" [ref=f4e141]
                            - strong [ref=f4e144]: Leer y comprender · Aplicar el ejemplo 1 (1/2)
                            - generic [ref=f4e145]: Completada
                          - paragraph [ref=f4e146]: Puedes consultar las lecturas en Recursos. Practicar de nuevo requiere una actividad disponible.
                      - listitem [ref=f4e147]:
                        - generic [ref=f4e151]:
                          - generic [ref=f4e152]:
                            - img "Explicación escrita" [ref=f4e153]
                            - strong [ref=f4e156]: Explicar con tus palabras · Aplicar el ejemplo 1
                            - generic [ref=f4e157]: Completada
                          - paragraph [ref=f4e158]: Puedes consultar las lecturas en Recursos. Practicar de nuevo requiere una actividad disponible.
                      - listitem [ref=f4e159]:
                        - generic [ref=f4e163]:
                          - generic [ref=f4e164]:
                            - img "Pregunta de opción múltiple" [ref=f4e165]
                            - strong [ref=f4e168]: Elegir la respuesta correcta · Aplicar el ejemplo 1 (1/2)
                            - generic [ref=f4e169]: Completada
                          - paragraph [ref=f4e170]: Puedes consultar las lecturas en Recursos. Practicar de nuevo requiere una actividad disponible.
                      - listitem [ref=f4e171]:
                        - generic [aria-hidden] [ref=f4e172]: "4"
                        - generic [ref=f4e174]:
                          - img "Respuesta breve" [ref=f4e175]
                          - strong [ref=f4e178]: Recordar sin mirar · Aplicar el ejemplo 1
                      - listitem [ref=f4e179]:
                        - generic [aria-hidden] [ref=f4e180]: "5"
                        - generic [ref=f4e182]:
                          - img "Pregunta de opción múltiple" [ref=f4e183]
                          - strong [ref=f4e186]: Elegir la respuesta correcta · Aplicar el ejemplo 1 (2/2)
                      - listitem [ref=f4e187]:
                        - generic [aria-hidden] [ref=f4e188]: "6"
                        - generic [ref=f4e190]:
                          - img "Relaciones" [ref=f4e191]
                          - strong [ref=f4e194]: Relacionar conceptos · Aplicar el ejemplo 1
                      - listitem [ref=f4e195]:
                        - generic [aria-hidden] [ref=f4e196]: "7"
                        - generic [ref=f4e198]:
                          - img "Ordenar elementos" [ref=f4e199]
                          - strong [ref=f4e202]: Ordenar la secuencia · Aplicar el ejemplo 1
                      - listitem [ref=f4e203]:
                        - generic [aria-hidden] [ref=f4e204]: "8"
                        - generic [ref=f4e206]:
                          - img "Práctica visual" [ref=f4e207]
                          - strong [ref=f4e210]: Identificar en la imagen · Aplicar el ejemplo 1
                      - listitem [ref=f4e211]:
                        - generic [aria-hidden] [ref=f4e212]: "9"
                        - generic [ref=f4e214]:
                          - img "Caso práctico" [ref=f4e215]
                          - strong [ref=f4e218]: Resolver un caso · Aplicar el ejemplo 1
                      - listitem [ref=f4e219]:
                        - generic [ref=f4e223]:
                          - generic [ref=f4e224]:
                            - img "Lectura" [ref=f4e225]
                            - strong [ref=f4e228]: Leer y comprender · Aplicar el ejemplo 1 (2/2)
                            - generic [ref=f4e229]: Opcional
                          - button "Abrir actividad" [ref=f4e231] [cursor=pointer]
                    - paragraph [ref=f4e232]:
                      - text: Vuelve a repasar
                      - time [ref=f4e235]: mañana a las 8:00 a. m.
                      - text: para recordar lo aprendido.
                  - generic [ref=f4e239]:
                    - strong [ref=f4e240]: Pon a prueba lo que aprendiste
                    - generic [ref=f4e241]: Al terminar las actividades, responde unas preguntas para ver qué recuerdas y qué conviene repasar.
      - group [ref=f4e242]:
        - heading "Repaso y comprobaciones" [level=2] [ref=f4e244] [cursor=pointer]
      - group [ref=f4e247]:
        - heading "Versiones e historial" [level=2] [ref=f4e249] [cursor=pointer]
    - navigation "Navegación móvil" [ref=f4e252]:
      - link "Inicio" [ref=f4e253] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f4e257] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f4e262] [cursor=pointer]
      - link [ref=f4e266] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f4e269]: Rutas deaprendizaje
  - alert [ref=f4e270]
```