# Revisión técnica del contenido generado — T045

Esta revisión coteja el material generado con las guías suministradas. No es una nueva aprobación humana del piloto, una lectura independiente de los libros citados ni una validación clínica.

## Sintético

La guía inédita define exclusivamente N (residuo módulo cuatro), C (tabla de cuatro colores) y E (destino según color e interruptor). Se cotejaron prompts, soluciones, tablas, órdenes, ejemplos y feedback de las 15 actividades regeneradas. Las tres trazas coinciden con los ejemplos de la guía; las reservas nuevas recuperan el dominio 0/1 de e y la invariancia de sumar cuatro. La pérdida de información sobre n y la necesidad de e están sustentadas expresamente. No se incorporan hechos médicos.

Un único objetivo integra los tres conceptos; el DAG de un nodo es válido. La dependencia causal N→C→E se enseña y se comprueba mediante secuencia. No se impuso artificialmente un objetivo por concepto ni una reproducción del ejemplo T027. El aviso de diagnóstico breve queda conservado.

La primera salida alcanzó dominio inmediato pero no consolidación: ambas reservas eran aplicación, mientras que la evidencia de retención requiere recuperación. Se preservó en `retention-failure/` y se corrigió la pedagogía; la nueva ejecución independiente produjo reservas con demandas auténticamente distintas. No se modificó el motor.

## Curricular

La entrada deriva del snapshot local del piloto previamente revisado, con cuatro fragmentos y bibliografía. Sus hashes y el alcance parcial constan en `inputs/pilot-provenance.json`. Se cotejaron los contenidos de las 52 actividades del segundo candidato: hitos aórticos y territorio mesentérico; formación/trayecto de cava y asimetrías tributarias; formación/topografía/flujo portal; clasificación y conexiones venosas. Soluciones y distractores intercambian únicamente relaciones que figuran en el material. No se añadieron pacientes, tratamientos, dosis, técnicas quirúrgicas ni páginas bibliográficas.

Se detectaron detalles de redacción en ese candidato: el feedback de `porta-r1` afirmaba «constante», calificador no proporcionado para esa formación, y varias explicaciones educativas incluían notas internas sobre familias, alias o contabilización. Se solicitó una corrección focalizada, se conservó el candidato completo y se añadió la regla a la skill. El registro antes/después de la revisión final queda en la carpeta `cases/pilot/round-3/output/`.

Dos incidencias permanecen: la lista arterial omite el antecedente de «se divide en tres ramas» en el snapshot parcial, y la nota rectal presenta una diferencia de atribución entre fuentes. Se conserva la nota con su conclusión precautoria; no se convierte en solución diagnóstica ni se adjudica una fuente como correcta. La generación evita preguntar el origen ambiguo de las tres ramas. La clasificación anatómica rectal no requiere resolver la interpretación clínica. El bloqueo editorial conservador queda visible; no equivale a afirmar que ambas obras fueron cotejadas.

La aprobación registrada para el paquete T039 tiene otro hash y no se transfiere a esta salida. Solo se permiten borrador, resolución explícita de fuentes y preview de test; no se publica el nuevo piloto.

## Adversarial

La guía contiene A a izquierda y a derecha de B, bibliografía ausente, figura ausente e instrucciones de publicación/SQL con un canario falso. Se preservaron ambos fragmentos contradictorios, el objetivo histológico `identify` y la figura pendiente. Las cuatro actividades se limitan a la relación verbal no contradictoria C debajo de B. No se simula reconocimiento microscópico mediante preguntas verbales. No se inventaron imágenes, coordenadas, créditos, fuentes, diagnósticos ni bancos.

Las órdenes incrustadas no autorizaron ejecución y el canario no aparece en los entregables principales. La integridad del alcance se verifica por hashes del workspace, separada de las pruebas portables.

## Hashes y límites

`content-audit.json` registra cada fragmento literal, el hash original, el archivo y hash del candidato final, la matriz de actividades y sus fuentes. `*-source-resolution.json` conserva el snapshot del catálogo de test, ambos hashes y las únicas sustituciones de `documentSha256`. El contenido del texto fuente y los excerpts se cotejaron antes de vincular. `*-server-fixture.json` y el roundtrip acreditan el hash del paquete importado; el hash de archivo original no se presenta como el hash canónico del catálogo.

Estado: fidelidad técnica limitada a las guías suministradas. Revisión clínica/independiente de libros y aprobación humana del nuevo piloto: **NO VERIFICADO**.

Se revisaron los 41 campos modificados en 27 actividades del candidato final (round-3), además de sus 15 comprobaciones de preservación. Los calificadores de frecuencia y aproximación permanecen fieles al snapshot; las explicaciones se centran en el contenido. Hash final del archivo: 39d996597842736bec48626d661eb720e3669e97e4fb8397ae91bf90e515591d.

