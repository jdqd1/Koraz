# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: large-editor.spec.ts >> T040 L03 large editor mounts one form, preserves closed edits and persists through the real BFF
- Location: ..\..\docs\aprendizaje-guiado\v2\evidencias\T040\large-editor.spec.ts:4:5

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 30
Received length: 1
Received array:  [{"activityKeys": ["study-1", "constructed-1", "choice-1", "short-1", "apply-1", "match-1", "sequence-1", "image-1", "case-1", "case-choice-1", …], "estimatedMinutes": null, "key": "unit", "objectiveKeys": ["objective-1", "objective-2", "objective-3", "objective-4", "objective-5", "objective-6", "objective-7", "objective-8", "objective-9", "objective-10", …], "support": "full", "title": "Unidad T035"}]
```