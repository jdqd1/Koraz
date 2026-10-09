# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V02/V05 keyboard, touch, letterbox, zoom and accessible alternative
- Location: tests\e2e\guided-v2-accessibility.spec.ts:194:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('[data-editor-preview]').getByLabel('Vertical (%)')
Expected: "20"
Received: "19.9479"
Timeout:  60000ms

Call log:
  - Expect "toHaveValue" locator('[data-editor-preview]').getByLabel('Vertical (%)') with timeout 60000ms
  - waiting for locator('[data-editor-preview]').getByLabel('Vertical (%)')
    121 × locator resolved to <input min="0" max="100" step="any" type="number" value="19.9479"/>
        - unexpected value "19.9479"

```

```yaml
- spinbutton "Vertical (%)": "19.9479"
```