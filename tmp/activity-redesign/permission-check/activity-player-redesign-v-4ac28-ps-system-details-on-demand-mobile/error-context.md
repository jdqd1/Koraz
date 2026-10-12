# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activity-player-redesign.spec.ts >> v2 image_target stays focused, responds and keeps system details on demand
- Location: tests\e2e\activity-player-redesign.spec.ts:90:7

# Error details

```
Error: route.fetch: connect ECONNREFUSED 127.0.0.1:3100
Call log:
  - → GET http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=player&estado=image_target
    - user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1
    - accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
    - accept-encoding: gzip,deflate,br
    - accept-language: en-US
    - upgrade-insecure-requests: 1
    - sec-ch-ua: "HeadlessChrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"
    - sec-ch-ua-mobile: ?1
    - sec-ch-ua-platform: "iOS"

```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3100/visual-fixtures/aprendizaje-v2?surface=player&estado=image_target", waiting until "load"

```