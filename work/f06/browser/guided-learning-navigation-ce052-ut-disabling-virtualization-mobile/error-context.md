# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-learning-navigation.spec.ts >> F06 H19 records map nodes through list, reload and resizing without disabling virtualization
- Location: tests\e2e\guided-learning-navigation.spec.ts:126:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Abrir Contenido 1', exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Abrir Contenido 1', exact: true }) with timeout 60000ms
  - waiting for getByRole('button', { name: 'Abrir Contenido 1', exact: true })

```

```yaml
- alert
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
```