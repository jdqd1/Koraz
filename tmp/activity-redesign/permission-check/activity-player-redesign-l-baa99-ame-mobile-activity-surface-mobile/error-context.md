# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> legacy review-card uses the same mobile activity surface
- Location: tests\e2e\activity-player-redesign.spec.ts:163:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=review-card
Call log:
  - navigating to "http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=legacy-player&estado=review-card", waiting until "load"

```