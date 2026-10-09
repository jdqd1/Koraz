# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guided-v2-accessibility.spec.ts >> T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom
- Location: tests\e2e\guided-v2-accessibility.spec.ts:91:5

# Error details

```
Error: admin-empty: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_R_ail2npfivpfnb_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"\" selected=\"\">Selecciona un tema</option><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_R_ail2npfivpfnb_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_R_ail2npfivpfnb_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"\" selected=\"\">Selecciona un tema</option><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_R_ail2npfivpfnb_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_R_ail2npfivpfnb_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"\" selected=\"\">Selecciona un tema</option><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_R_ail2npfivpfnb_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: admin-0: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_7_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_r_7_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_7_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_r_7_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_7_\" data-field-path=\"bindings.topicContentId\" aria-invalid=\"false\"><option value=\"77000000-0000-4000-8000-000000000120\">Tema T035</option></select>",
+                 "target": Array [
+                   "#_r_7_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: admin-2: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_1a_\" data-field-path=\"activity.newObjective\" aria-invalid=\"false\"><option value=\"objective-1\">Aplicar el ejemplo 1</option></select>",
+                 "target": Array [
+                   "#_r_1a_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_1a_\" data-field-path=\"activity.newObjective\" aria-invalid=\"false\"><option value=\"objective-1\">Aplicar el ejemplo 1</option></select>",
+                 "target": Array [
+                   "#_r_1a_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<select id=\"_r_1a_\" data-field-path=\"activity.newObjective\" aria-invalid=\"false\"><option value=\"objective-1\">Aplicar el ejemplo 1</option></select>",
+                 "target": Array [
+                   "#_r_1a_",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: admin-4: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 187

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__secondaryButton\" type=\"button\">Validar contenido</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__card:nth-child(1) > .route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__secondaryButton",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__secondaryButton\" type=\"button\">Validar contenido</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__card:nth-child(1) > .route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__secondaryButton",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__secondaryButton\" type=\"button\">Validar contenido</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__card:nth-child(1) > .route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__secondaryButton",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__secondaryButton\" type=\"button\">Validar contenido</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__card:nth-child(1) > .route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__secondaryButton",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Rutas de<br>aprendizaje</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"aprendizaje\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-study: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-guide-activity\"><article><p><span>Contenido sintético para comprobar el software.</span></p></article><p>Leer cuenta para el recorrido. El dominio se comprueba al responder.</p><button type=\"button\" class=\"learning-primary-button\">Continuar a la práctica</button></section>",
+                 "target": Array [
+                   ".learning-guide-activity",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-guide-activity\"><article><p><span>Contenido sintético para comprobar el software.</span></p></article><p>Leer cuenta para el recorrido. El dominio se comprueba al responder.</p><button type=\"button\" class=\"learning-primary-button\">Continuar a la práctica</button></section>",
+                 "target": Array [
+                   ".learning-guide-activity",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-guide-activity\"><article><p><span>Contenido sintético para comprobar el software.</span></p></article><p>Leer cuenta para el recorrido. El dominio se comprueba al responder.</p><button type=\"button\" class=\"learning-primary-button\">Continuar a la práctica</button></section>",
+                 "target": Array [
+                   ".learning-guide-activity",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-constructed: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button[type=\"button\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-choice: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<form class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<form class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<form class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button[type=\"button\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-short: axe

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 64

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<form class=\"learning-question-card\">",
+                 "target": Array [
+                   ".learning-question-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-sequence: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button[type=\"button\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: renderer-case: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 146

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Inicio</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"dashboard\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 3.9,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<section class=\"route-editor-module__Uwf6nG__card\" aria-label=\"Vista previa editorial\" data-editor-preview=\"true\">",
+                 "target": Array [
+                   "section[aria-label=\"Vista previa editorial\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.9 (foreground color: #7380a7, background color: #ffffff, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button[type=\"button\"] > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: admin-zoom200: axe

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 105

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f7f9",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__primaryAction\" type=\"button\">Enviar a revisión</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__primaryAction",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Guías</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-primary-nav > a[href$=\"guias\"] > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f7f9",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7380a7",
+               "fontSize": "7.3pt (9.76px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<nav class=\"mobile-primary-nav\" aria-label=\"Navegación móvil\">",
+                 "target": Array [
+                   ".mobile-primary-nav",
+                 ],
+               },
+               Object {
+                 "html": "<button class=\"route-editor-module__Uwf6nG__primaryAction\" type=\"button\">Enviar a revisión</button>",
+                 "target": Array [
+                   ".route-editor-module__Uwf6nG__inlineActions > .route-editor-module__Uwf6nG__primaryAction",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #7380a7, background color: #f6f7f9, font size: 7.3pt (9.76px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>Materiales</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mobile-materials-nav > button > span",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: map: axe

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 58

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8fbff",
+               "contrastRatio": 4.44,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#6174a5",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.44 (foreground color: #6174a5, background color: #f8fbff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"learning-map-module__RbHqDa__body\"><p class=\"learning-map-module__RbHqDa__empty\">Preparando mapa…</p></div>",
+                 "target": Array [
+                   ".learning-map-module__RbHqDa__body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.44 (foreground color: #6174a5, background color: #f8fbff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"learning-map-module__RbHqDa__empty\">Preparando mapa…</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "p",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

```
Error: {"error":"conflict"}

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 409
```

# Page snapshot

```yaml
- generic [ref=f6e1]:
  - generic [ref=f6e3]:
    - banner [ref=f6e4]:
      - search "Buscar guías" [ref=f6e6]:
        - combobox "Buscar guías" [ref=f6e9]
      - heading "Aprendizaje guiado" [level=1] [ref=f6e11]
      - generic [ref=f6e12]:
        - button "Notificaciones" [ref=f6e14] [cursor=pointer]
        - link "Acceder" [ref=f6e18] [cursor=pointer]:
          - /url: /acceder
    - region "Sesión de aprendizaje" [ref=f6e22]:
      - generic [ref=f6e23]:
        - link "Volver a mi aprendizaje" [ref=f6e24] [cursor=pointer]:
          - /url: /aprendizaje?tab=hoy
        - generic [ref=f6e25]:
          - text: Aprendizaje guiado
          - heading "Tu sesión de aprendizaje" [level=1] [ref=f6e26]
        - status [ref=f6e27]: Estado del servidor
      - status [ref=f6e28]: Sesión completada y guardada.
      - generic "Estado confirmado de la ruta" [ref=f6e29]:
        - generic [ref=f6e30]: Recorrido en curso
        - generic [ref=f6e31]: Dominio por comprobar
        - generic [ref=f6e32]: Consolidación pendiente
        - generic [ref=f6e33]: 0 repasos pendientes
        - generic [ref=f6e34]: 1 actividades completadas de 9
      - generic [ref=f6e35]:
        - heading "Sesión completada" [active] [level=2] [ref=f6e36]
        - paragraph [ref=f6e37]: El recorrido y el dominio se muestran por separado en el resumen confirmado.
        - group [ref=f6e38]:
          - generic "Respuestas confirmadas" [ref=f6e39]
      - region "Próximos pasos confirmados" [ref=f6e40]:
        - heading "Cómo continuar" [level=2] [ref=f6e41]
        - paragraph [ref=f6e42]: Siguiente actividad de la rama disponible
    - navigation "Navegación móvil" [ref=f6e43]:
      - link "Inicio" [ref=f6e44] [cursor=pointer]:
        - /url: /dashboard
      - link "Guías" [ref=f6e48] [cursor=pointer]:
        - /url: /guias
      - button "Materiales" [ref=f6e53] [cursor=pointer]
      - link [ref=f6e57] [cursor=pointer]:
        - /url: /aprendizaje
        - generic [ref=f6e60]: Rutas deaprendizaje
  - alert [ref=f6e61]
```

# Test source

```ts
  1   | import { test, expect, chromium, type Page, type Locator, type TestInfo } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import { writeFile } from "node:fs/promises";
  4   | import { resolve } from "node:path";
  5   | 
  6   | const api = "http://127.0.0.1:41035";
  7   | const root = "/api/v2/guided-learning/";
  8   | const slug = "/aprendizaje/rutas/t035-small";
  9   | const tabs = ["Datos y fuentes", "Objetivos", "Recorrido", "Evaluación y repaso", "Revisión"];
  10  | const kinds = ["study", "constructed", "choice", "short", "match", "sequence", "image", "case"];
  11  | async function actor(page: Page, name: string) {
  12  |   await page.context().addCookies([{ name: "t035", value: name, domain: "127.0.0.1", path: "/" }]);
  13  |   await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  14  | }
  15  | async function post(page: Page, path: string, data: unknown) {
  16  |   const r = await page.request.post(root + path, { data, headers: { "idempotency-key": crypto.randomUUID() } });
> 17  |   expect(r.status(), await r.text()).toBe(200); return r.json();
      |                                      ^ Error: {"error":"conflict"}
  18  | }
  19  | async function state(page: Page, id: string) {
  20  |   return (await (await page.request.get(root + `enrollments/${id}/state`)).json()).state;
  21  | }
  22  | async function launch(page: Page, id: string, key: string) {
  23  |   const s = await state(page, id);
  24  |   const a = (await post(page, "attempts", { clientAttemptId: crypto.randomUUID(), enrollmentId: id,
  25  |     target: { kind: "activity", key }, expectedEnrollmentVersion: s.rowVersion })).attempt;
  26  |   await page.goto(`/aprendizaje/sesiones/${a.attemptId}`);
  27  |   await expect(page.getByRole("heading", { name: a.activeActivity.prompt, exact: true })).toBeVisible();
  28  |   return a;
  29  | }
  30  | async function keyboard(locator: Locator) { await locator.focus(); await locator.press("Enter"); }
  31  | async function hydrated(locator: Locator) {
  32  |   await expect.poll(() => locator.evaluate(element => Object.keys(element).some(k => k.startsWith("__reactProps")
  33  |     && Object.entries((element as unknown as Record<string, Record<string, unknown>>)[k] ?? {})
  34  |       .some(([name, value]) => name.startsWith("on") && typeof value === "function")))).toBe(true);
  35  | }
  36  | 
  37  | // Audit the complete page, including its shared shell: no axe exclusions.
  38  | async function capture(page: Page, info: TestInfo, name: string) {
  39  |   await page.screenshot({ path: info.outputPath(`${name}-viewport.png`) });
  40  |   await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  41  |   const axe = await new AxeBuilder({ page }).analyze();
  42  |   await writeFile(info.outputPath(`${name}-axe.json`), JSON.stringify(axe, null, 2));
  43  |   const cdp = await page.context().newCDPSession(page);
  44  |   const tree = await cdp.send("Accessibility.getFullAXTree"); await cdp.detach();
  45  |   await writeFile(info.outputPath(`${name}-ax.json`), JSON.stringify(tree, null, 2));
  46  |   const geometry = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight },
  47  |     pageWidth: document.documentElement.scrollWidth, zoom: getComputedStyle(document.documentElement).zoom, devicePixelRatio,
  48  |     focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 160) },
  49  |     controls: [...document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("main button, main input, main select")]
  50  |       .filter(e => e.getClientRects().length && !e.disabled).map(e => { const b = e.getBoundingClientRect();
  51  |         return { name: e.getAttribute("aria-label") ?? e.textContent?.slice(0, 90), width: b.width, height: b.height }; }) }));
  52  |   await writeFile(info.outputPath(`${name}-geometry.json`), JSON.stringify(geometry, null, 2));
  53  |   expect.soft(axe.violations.filter(v => ["serious", "critical"].includes(v.impact ?? "")), `${name}: axe`).toEqual([]);
  54  |   expect.soft(geometry.pageWidth, `${name}: page overflow`).toBeLessThanOrEqual(geometry.viewport.width + 1);
  55  | }
  56  | async function previewPoint(page: Page, key: string) {
  57  |   const p = page.locator("[data-editor-preview]");
  58  |   await p.getByLabel("Explorar un punto de la ruta").selectOption(`activity:${key}-1`);
  59  |   await p.getByRole("button", { name: "Abrir punto seleccionado" }).click();
  60  |   await expect(p.getByRole("region", { name: "Sesión de aprendizaje", exact: true })).toBeVisible();
  61  |   if (key === "image") await expect(p.getByLabel("Horizontal (%)")).toBeEnabled();
  62  |   return p;
  63  | }
  64  | async function answerPreview(p: Locator, key: string) {
  65  |   const choice = async () => { const radio = p.getByRole("radio", { name: "Respuesta A", exact: true });
  66  |     await radio.focus(); await radio.press("Space"); await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); };
  67  |   const feedback = async () => keyboard(p.getByRole("button", { name: /^(Continuar|Ver cierre de sesión)$/ }).last());
  68  |   if (key === "study") { await keyboard(p.getByRole("button", { name: "Continuar a la práctica", exact: true })); return; }
  69  |   if (key === "choice" || key === "apply") await choice();
  70  |   if (key === "short") { await p.getByLabel("Tu respuesta", { exact: true }).pressSequentially("respuesta");
  71  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta", exact: true })); }
  72  |   if (key === "constructed") { await p.getByLabel("Explica con tus palabras").pressSequentially("Una relación sintética.");
  73  |     await keyboard(p.getByRole("button", { name: "Guardar mi respuesta", exact: true }));
  74  |     await keyboard(p.getByRole("button", { name: "Comparar con el modelo", exact: true }));
  75  |     await keyboard(p.getByRole("button", { name: "Lo recuperé", exact: true })); }
  76  |   if (key === "match") { const select = p.getByRole("combobox", { name: "Origen", exact: true });
  77  |     await select.focus(); await select.press("End"); await select.press("Tab");
  78  |     await keyboard(p.getByRole("button", { name: "Comprobar relaciones", exact: true })); }
  79  |   if (key === "sequence") await keyboard(p.getByRole("button", { name: "Comprobar secuencia", exact: true }));
  80  |   if (key === "image") { await p.getByLabel("Horizontal (%)").fill("20"); await p.getByLabel("Vertical (%)").fill("20");
  81  |     await keyboard(p.getByRole("button", { name: "Comprobar respuesta visual", exact: true })); }
  82  |   if (key === "case") { await choice(); await feedback();
  83  |     await expect(p.getByRole("heading", { name: /Etapa 2: relación sintética.*case-short-1/ })).toBeFocused();
  84  |     await answerPreview(p, "short"); return; }
  85  |   await feedback();
  86  | }
  87  | async function finishPreview(p: Locator) {
  88  |   await keyboard(p.getByRole("button", { name: "Finalizar sesión", exact: true }));
  89  |   await expect(p.getByRole("heading", { name: "Sesión completada", exact: true })).toBeFocused();
  90  | }
  91  | 
  92  | test("T037 V01/V03/V04 admin and learner viewport gallery, 200 percent zoom", async ({ page }, info) => {
  93  |   test.setTimeout(600000);
  94  |   const ready = await (await page.request.get(api + "/__test/ready")).json();
  95  |   expect(ready.testOnly).toBe(true);
  96  |   await actor(page, "editor");
  97  |   await page.goto("/panel/rutas/nueva?mode=v2");
  98  |   await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
  99  |   await capture(page, info, "admin-empty");
  100 |   await page.goto(`/panel/rutas/${ready.fixtures.editorial.pathId}`);
  101 |   for (const name of tabs) {
  102 |     const tab = page.getByRole("tab", { name, exact: true }); await hydrated(tab); await keyboard(tab);
  103 |     await expect(tab).toHaveAttribute("aria-selected", "true");
  104 |     await capture(page, info, `admin-${tabs.indexOf(name)}`);
  105 |   }
  106 |   await keyboard(page.getByRole("button", { name: "Abrir vista previa", exact: true }));
  107 |   for (const key of kinds) {
  108 |     const p = await previewPoint(page, key);
  109 |     await capture(page, info, `renderer-${key}`);
  110 |     await answerPreview(p, key); await finishPreview(p);
  111 |   }
  112 |   await keyboard(page.locator("[data-editor-preview]").getByRole("button", { name: "Cerrar vista previa", exact: true }).first());
  113 |   await expect(page.getByRole("button", { name: "Abrir vista previa", exact: true })).toBeFocused();
  114 |   // CSS zoom exercises real 200% layout/text scaling in Chromium. It is documented
  115 |   // separately from native browser zoom and checked together with small viewports.
  116 |   await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  117 |   await capture(page, info, "admin-zoom200");
```