# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content-authoring.spec.ts >> repairs, saves, reopens and publishes a legacy quiz with stable option identities
- Location: tests\e2e\content-authoring.spec.ts:12:5

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 180000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - search "Buscar guías" [ref=e6]:
        - combobox "Buscar guías" [ref=e9]
      - heading "Koras" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button "Notificaciones" [ref=e14] [cursor=pointer]
        - button "Abrir menú de perfil de editor@example.test" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: ED
    - main [ref=e20]:
      - generic [ref=e21]:
        - heading "Publicar contenido" [level=2] [ref=e23]
        - generic "Crear contenido" [ref=e24]:
          - button "Crear guía" [ref=e25] [cursor=pointer]
          - button "Crear cuestionario" [ref=e28] [cursor=pointer]
          - button "Crear flashcards" [ref=e31] [cursor=pointer]
          - button "Crear tema" [ref=e34] [cursor=pointer]
      - search [ref=e37]:
        - searchbox "Buscar contenido" [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e43]: Filtrar por tipo
          - combobox "Filtrar por tipo" [ref=e44]:
            - option "Todos los tipos" [selected]
            - option "Guías"
            - option "Cuestionarios"
            - option "Flashcards"
            - option "Temas"
        - combobox "Filtrar por estado" [ref=e48] [cursor=pointer]:
          - option "Todos los estados" [selected]
          - option "Borrador"
          - option "En revisión"
          - option "Cambios solicitados"
          - option "Aprobado"
          - option "Publicado"
          - option "Archivado"
      - generic [ref=e49]:
        - complementary "Publicaciones" [ref=e50]:
          - generic [ref=e51]:
            - strong [ref=e53]: Publicaciones
            - button "Expandir publicaciones" [ref=e54] [cursor=pointer]
        - region "Editor de contenido" [ref=e57]:
          - heading "Elige o crea una publicación" [level=3] [ref=e61]
    - navigation "Navegación móvil" [ref=e62]:
      - link "Inicio" [ref=e63] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=e67] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=e72] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e81] [cursor=pointer]
  - alert [ref=e85]
```