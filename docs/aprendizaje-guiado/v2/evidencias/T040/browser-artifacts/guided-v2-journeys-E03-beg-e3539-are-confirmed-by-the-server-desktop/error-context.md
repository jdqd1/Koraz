# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-journeys.spec.ts >> E03 beginner help and CORE error are confirmed by the server
- Location: tests\e2e\guided-v2-journeys.spec.ts:121:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Confusión CORE sintética', { exact: true })
Expected: visible
Error: strict mode violation: getByText('Confusión CORE sintética', { exact: true }) resolved to 2 elements:
    1) <p>Confusión CORE sintética</p> aka getByRole('region', { name: 'Refuerzo dirigido' }).getByText('Confusión CORE sintética')
    2) <p>Confusión CORE sintética</p> aka getByText('Confusión CORE sintética').nth(1)

Call log:
  - Expect "toBeVisible" getByText('Confusión CORE sintética', { exact: true }) with timeout 60000ms
  - waiting for getByText('Confusión CORE sintética', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f4e1]:
  - generic [ref=f4e2]:
    - complementary "Navegación principal" [ref=f4e3]:
      - navigation [ref=f4e4]:
        - generic [ref=f4e5]:
          - link "Inicio" [ref=f4e6] [cursor=pointer]:
            - /url: /dashboard
            - generic [aria-hidden]: Inicio
          - link "Aprendizaje guiado" [ref=f4e9] [cursor=pointer]:
            - /url: /aprendizaje
            - generic [aria-hidden]: Aprendizaje guiado
          - link "Materias" [ref=f4e12] [cursor=pointer]:
            - /url: /asignaturas
            - generic [aria-hidden]: Materias
          - button "Material de estudio" [ref=f4e17] [cursor=pointer]:
            - generic [aria-hidden]: Material de estudio
    - generic [ref=f4e20]:
      - banner [ref=f4e21]:
        - button "Expandir menú principal" [ref=f4e23] [cursor=pointer]
        - search "Buscar guías" [ref=f4e27]:
          - combobox "Buscar guías" [ref=f4e30]
        - heading "Aprendizaje guiado" [level=1] [ref=f4e32]
        - generic [ref=f4e33]:
          - button "Notificaciones" [ref=f4e35] [cursor=pointer]
          - link "Acceder" [ref=f4e39] [cursor=pointer]:
            - /url: /acceder
      - main [ref=f4e43]:
        - link "Todas las rutas" [ref=f4e44] [cursor=pointer]:
          - /url: /aprendizaje?tab=rutas
        - generic [ref=f4e48]:
          - generic [ref=f4e49]: Tema T035
          - heading "Ruta T035 pequeña" [level=1] [ref=f4e50]
          - paragraph [ref=f4e51]: Fixture de software sin contenido clínico real.
          - generic [ref=f4e52]: 1 unidades
          - generic "Estado confirmado de la ruta" [ref=f4e54]:
            - generic [ref=f4e55]: Recorrido en curso
            - generic [ref=f4e56]: Dominio por comprobar
            - generic [ref=f4e57]: Consolidación pendiente
            - generic [ref=f4e58]: 0 repasos pendientes
            - generic [ref=f4e59]: 1 objetivo por reforzar
            - generic [ref=f4e60]: 3 actividades completadas de 9
          - generic [ref=f4e61]:
            - paragraph [ref=f4e62]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
            - button "Reforzar" [ref=f4e63] [cursor=pointer]
        - region [ref=f4e65]:
          - generic [ref=f4e66]:
            - generic [ref=f4e67]:
              - text: Mapa de la ruta
              - heading "Qué aprenderás" [level=2] [ref=f4e68]
            - paragraph [ref=f4e69]: La práctica disponible depende de la evidencia confirmada de tus objetivos.
          - group [ref=f4e71]:
            - generic "1 Unidad 1 Unidad T035 1 objetivo" [ref=f4e72] [cursor=pointer]:
              - generic [ref=f4e73]: "1"
              - generic [ref=f4e74]:
                - generic [ref=f4e75]: Unidad 1
                - strong [ref=f4e76]: Unidad T035
                - emphasis [ref=f4e77]: 1 objetivo
            - generic [ref=f4e80]:
              - strong [ref=f4e81]: Al terminar podrás
              - list [ref=f4e82]:
                - listitem [ref=f4e83]:
                  - strong [ref=f4e84]: Aplicar el ejemplo 1
                  - generic [ref=f4e85]: Necesita refuerzo · objetivo esencial
                  - generic [ref=f4e86]: Un error esencial mantiene bloqueadas las actividades que dependen de este objetivo. Requiere refuerzo.
        - complementary "Actualización de la ruta" [ref=f4e87]:
          - generic [ref=f4e88]:
            - heading "Versiones de esta ruta" [level=2] [ref=f4e89]
            - paragraph [ref=f4e90]: Puedes revisar otra versión antes de adoptarla. Tu historial permanece disponible.
            - button "Revisar actualización o recuperar solicitud" [ref=f4e91] [cursor=pointer]
        - region "Historial de versiones" [ref=f4e92]:
          - generic [ref=f4e93]:
            - heading "Tu historial" [level=2] [ref=f4e94]
            - list [ref=f4e95]:
              - listitem [ref=f4e96]: Versión 1
        - generic [ref=f4e97]:
          - region "Diagnóstico inicial" [ref=f4e98]:
            - heading "Un punto de partida opcional" [level=2] [ref=f4e99]
            - paragraph [ref=f4e100]: El diagnóstico orienta tu recorrido y no reduce tu progreso. Puedes continuar aprendiendo sin hacerlo.
            - paragraph [ref=f4e101]: Continuaste sin diagnóstico. Tu progreso se conserva.
          - group [ref=f4e102]:
            - generic "Refuerzo, repaso y mantenimiento" [ref=f4e103]
            - region "Comprobaciones y requisitos" [ref=f4e104]:
              - heading "Qué falta por comprobar" [level=2] [ref=f4e105]
              - list [ref=f4e106]:
                - listitem [ref=f4e107]:
                  - strong [ref=f4e108]: "Unidad T035: Comprobación pendiente"
                  - paragraph [ref=f4e109]: "Resultado confirmado: 0 %. Umbral de esta comprobación: 80 %."
                  - paragraph [ref=f4e110]: "Objetivos esenciales por demostrar: Aplicar el ejemplo 1."
                  - paragraph [ref=f4e111]: "Errores esenciales por reforzar: Aplicar el ejemplo 1."
              - paragraph [ref=f4e112]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
            - region "Refuerzo dirigido" [ref=f4e113]:
              - heading "Reforzar un punto concreto" [level=2] [ref=f4e114]
              - paragraph [ref=f4e115]: Revisa la explicación y el ejemplo antes de una nueva variante. Un error no borra el dominio que alcanzaste antes.
              - list [ref=f4e116]:
                - listitem [ref=f4e117]:
                  - link "Aplicar el ejemplo 1" [ref=f4e118] [cursor=pointer]:
                    - /url: /aprendizaje/rutas/t035-small?leccion=unit
              - article [ref=f4e119]:
                - heading "Aplicar el ejemplo 1" [level=3] [ref=f4e120]
                - paragraph [ref=f4e121]: Confusión CORE sintética
                - paragraph [ref=f4e122]: Revisar la confusión, el fragmento fuente y el ejemplo antes de comprobar
                - button "Reforzar este objetivo" [ref=f4e124] [cursor=pointer]
              - paragraph [ref=f4e125]: Puedes pausar o consultar tus otras rutas. No necesitas repetir toda la ruta para reforzar este punto.
              - link "Consultar otras rutas" [ref=f4e126] [cursor=pointer]:
                - /url: /aprendizaje?tab=rutas
            - region "Grupo de repaso" [ref=f4e127]:
              - heading "Un grupo acotado de repaso" [level=2] [ref=f4e128]
              - paragraph [ref=f4e129]: No hay práctica de repaso disponible en este grupo. Consulta la próxima acción y las fechas confirmadas.
              - paragraph [ref=f4e130]: Cada objetivo abre su propia práctica. Puedes parar después de cualquiera o continuar en otra rama disponible; no necesitas vaciar la cola.
            - region "Mantenimiento de objetivos" [ref=f4e131]:
              - heading "Mantener lo aprendido" [level=2] [ref=f4e132]
              - paragraph [ref=f4e133]: El repaso y las evaluaciones diferidas permiten volver a comprobar lo aprendido. Las mediciones de 7 y 30 días cuentan días reales desde el dominio; no prometen memoria permanente.
              - paragraph [ref=f4e134]: Consolidación pendiente de evidencia diferida.
              - list [ref=f4e135]:
                - listitem [ref=f4e136]:
                  - strong [ref=f4e137]: Aplicar el ejemplo 1
                  - generic [ref=f4e138]: Necesita refuerzo
                  - paragraph [ref=f4e140]:
                    - text: "Próximo repaso:"
                    - time [ref=f4e141]: 5 de octubre de 2026 a las 12:00 p. m. (UTC)
              - paragraph [ref=f4e142]: Un repaso pendiente no significa que hayas fallado.
  - alert [ref=f4e143]
```