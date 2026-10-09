# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02 tab order, field reachability and modal focus restoration
- Location: tests\e2e\guided-v2-accessibility.spec.ts:189:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('link', { name: 'Volver a rutas', exact: true })
Expected: focused
Received: inactive
Timeout:  60000ms

Call log:
  - Expect "toBeFocused" getByRole('link', { name: 'Volver a rutas', exact: true }) with timeout 60000ms
  - waiting for getByRole('link', { name: 'Volver a rutas', exact: true })
    120 × locator resolved to <a href="/panel/rutas" class="route-editor-module__Uwf6nG__backLink">Volver a rutas</a>
        - unexpected value "inactive"

```

```yaml
- link "Volver a rutas":
  - /url: /panel/rutas
```