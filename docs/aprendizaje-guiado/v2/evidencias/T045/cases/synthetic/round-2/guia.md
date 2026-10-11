# Circuito de señales Neral

Versión 1, fixture sintético de software creado para T045 el 10 de octubre de 2026. Fuente y autoría: fixture local Koraz T045. El sistema descrito es ficticio, autocontenido y no representa contenido médico ni recomendaciones sobre dispositivos reales.

## 1. Normalización del contador

La entrada es un entero no negativo n. La compuerta N divide n entre cuatro y conserva el residuo r, que pertenece a {0,1,2,3}. El cociente se descarta. Se escribe r = n mod 4. Sumar cuatro a n conserva el residuo; sumar uno hace avanzar al residuo siguiente, y después de tres vuelve a cero. La salida de N es exclusivamente r, nunca el cociente ni n completo.

Ejemplos: n=0 da r=0; n=5 da r=1; n=10 da r=2; n=15 da r=3; n=16 da r=0. Por ello n=2,6,10,14 producen el mismo r=2 aunque sus cocientes difieran. La compuerta recibe también un interruptor e, cuyo valor no interviene en la normalización. El orden correcto es leer n, dividir entre cuatro, conservar el residuo y descartar el cociente.

## 2. Codificación del residuo

La compuerta C recibe r de N y lo convierte en un color con esta tabla completa:

| Residuo r | Color c |
|---|---|
| 0 | azul |
| 1 | verde |
| 2 | ámbar |
| 3 | rojo |

C no vuelve a dividir n ni modifica r. El color identifica un solo residuo: si c es verde, r es 1; si c es rojo, r es 3. No puede recuperarse n completo a partir del color, porque distintas entradas tienen el mismo residuo. El interruptor e tampoco cambia el color. Recibir r=4 sería un error de interfaz: ningún entero no negativo correctamente normalizado por N produce ese residuo.

## 3. Enrutamiento de la salida

La compuerta E recibe c e interruptor e. El interruptor admite únicamente 0 o 1. Si e=0, la salida es archivo, cualquiera que sea c. Si e=1 y c es azul o verde, la salida es pantalla. Si e=1 y c es ámbar o rojo, la salida es alarma. Ninguna otra regla existe en Neral. El recorrido es N → C → E; E no altera n, r ni c.

| Interruptor | azul | verde | ámbar | rojo |
|---|---|---|---|---|
| e=0 | archivo | archivo | archivo | archivo |
| e=1 | pantalla | pantalla | alarma | alarma |

Ejemplos completos: (n=8,e=1) produce (r=0,c=azul,salida=pantalla); (n=11,e=1) produce (r=3,c=rojo,salida=alarma); (n=6,e=0) produce (r=2,c=ámbar,salida=archivo). Conocer r sin conocer e no basta para decidir la salida. Con e=1, aumentar n en cuatro conserva también color y salida; cambiar e de 1 a 0 siempre conduce a archivo. Para distinguir pantalla de alarma con e=1 basta comprobar si r es 0/1 o 2/3, respectivamente.

## Bibliografía y figuras

Fuente única: Circuito de señales Neral, versión 1. Fixture local Koraz T045, 2026. Todas las reglas y tablas están contenidas en este documento. No hay figuras ni bibliografía externa. Las tablas son texto revisable del fixture; no se requiere reconocimiento espacial en una imagen.
