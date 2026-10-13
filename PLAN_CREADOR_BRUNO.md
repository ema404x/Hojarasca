# Hojarasca — El creador de Bruno Castellanos (plan del 13-10-2026)

Decisión del usuario (13-10): el juego tiene un **protagonista fijo**, Bruno Castellanos, y antes de empezar el jugador elige **diez
personalizaciones**: cinco de aspecto y cinco de carácter. Este documento es sólo el plan: **todavía no se ejecutó nada del juego**.

## 1. El protagonista (fijo)

- **Bruno Castellanos, 27 años, varón.** Llega al valle buscando paz, lejos del ruido de la ciudad. El nombre y el sexo no se eligen.
- **Lo que deja atrás:** un trabajo que lo agotó (el ritmo, el ruido). Nada de ruptura ni duelo: no choca con el romance del juego.
- **Tono del prólogo:** calmo y esperanzado. El viaje en la trochita, el alivio de dejar el ruido.
- **Voz:** el juego habla en voseo ("Sos Bruno Castellanos", no "Eres"). Los textos del protagonista van en masculino.

## 2. Las diez personalizaciones

Aspecto (se puede **rehacer después**, en un espejo o en el modo foto):
1. **Rostro:** forma de la cara (cuatro bases bien distintas) y color de ojos.
2. **Piel:** seis tonos.
3. **Pelo:** color, peinado y barba (afeitado, bigote o barba).
4. **Físico:** contextura y estatura.
5. **Ropa:** color de la campera y un accesorio (nada, gorro de lana, bufanda o anteojos).

Carácter (**quedan fijos** una vez elegidos):
6. **Personalidad.**
7. **Oficio de antes.**
8. **Gustos** (se eligen dos).
9. **Hobby.**
10. **Virtud y defecto** (el jugador elige una de cada una).

## 3. Pros y contras

- Cada opción de 6, 7, 8 y 9 trae **su propio pro y su propio contra**, visibles al elegir. La 10 agrega una virtud y un defecto elegidos.
- La pantalla muestra al final un **resumen de Bruno** con la suma de pros y contras.
- **Efectos sólo en el Relax.** El Desafío queda parejo para todos.
- **Topes:** ningún sistema sube ni baja más de un 20 % por la suma de rasgos. Ninguna opción es mejor que otra: cada una pesa lo mismo
  de pro que de contra. Los efectos sólo aceleran o frenan; nunca traban contenido.

## 4. El catálogo (para revisar: se tacha y se suma antes de ejecutar)

- **Personalidad (5):** tranquilo, curioso, sociable, metódico, reservado.
- **Oficio de antes (6):** programador, cocinero, contador, técnico de sonido, mensajero en bicicleta, docente de plástica.
- **Gustos (6, se eligen 2):** mate, folklore, lluvia, trenes, asado, libros.
- **Hobby (5):** fotografía, pesca, guitarra, carpintería, observar aves.
- **Virtud (5):** resistente, paciente, simpático, ahorrativo, madrugador.
- **Defecto (5):** friolero, impaciente, distraído, gruñón, dormilón.

Ejemplos de pro y contra (a completar para todas las opciones en la fase 1):
- Técnico de sonido: graba los cantos de las aves más rápido; los ruidos fuertes lo cansan.
- Cocinero: la cocina rinde más; le cuesta madrugar.
- Reservado: los vecinos le cuentan más historias; el afecto sube más lento.
- Hobby fotografía: las fotos del álbum valen más; pierde horas mirando.

## 5. Dónde pegan los efectos (sistemas que el juego ya tiene)

Abrigo y frío (`abrigo.js`), cuaderno (`cuaderno.js`), pesca (`pesca.js`), huerta (`huerta.js`), cocina (`cocina.js`), telar (`telar.js`),
construcción (`construccion.js`), feria (`feria.js`), álbum de fotos (`album.js`), aves y grabador (`aves.js`, `grabador.js`), afecto con los
vecinos y romance (`amor.js`, `vecindad.js`), clima (`clima.js`). Cada rasgo se escribe como **dato declarativo** (sistema y porcentaje), y
cada sistema lo lee por una sola función. Así se prueba el tope sin tocar el juego.

## 6. Orden de trabajo

1. **Datos y reglas (se empieza por acá).** Catálogo completo con pros, contras y efectos como datos; el genoma de Bruno con saneo y
   versión; pruebas que verifican las diez personalizaciones, el tope del 20 %, que ninguna opción domina y que una partida vieja o rota
   siempre sane a un Bruno válido.
2. **Pantalla de creación:** vista previa 3D que gira con la luz del valle, las diez pantallas, el resumen de Bruno, el espejo para
   rehacer el aspecto. Calidad pensada para la Ryzen 5 4600G (armado por pasos, sin tirones).
3. **Efectos en los sistemas**, uno por vez y con su prueba, empezando por tres o cuatro (abrigo, afecto, pesca, cuaderno).
4. **Prólogo y reacciones:** la historia de Bruno en el tren y frases de Ramón, Josefina, Ercilia y Nicanor según el oficio y el hobby.
5. **Inglés y balance final** (los textos van en español y en inglés).

## 7. Riesgos

- Balance entre rasgos (por eso los topes y las pruebas de la fase 1).
- Volumen de textos: cada variante se escribe dos veces. Por eso las reacciones se limitan a oficio y hobby, y a cuatro vecinos.
- Partidas viejas: arrancan con un Bruno por defecto, sin obligar a crear nada. El creador se ofrece una vez desde el menú.
- Cada cara base es un molde de cráneo en memoria: pocas y bien distintas, y los valores siempre en pasos (nada continuo).
- La vista previa tiene que andar en la placa integrada.

## 8. Lo que ya existe (borrador, sin enchufar al juego)

- `trabajo/t392c/src/creador-personaje.js`: genoma y traductor al motor de cuerpos, **sólo del aspecto**, con diez elecciones de aspecto.
  Hay que **reagruparlo** en las cinco de aspecto de arriba más las cinco de carácter.
- `trabajo/t392c/pruebas/verificar-3-9-2-creador.mjs`: sus pruebas (121 verificaciones, en verde).
- El estudio de personajes acepta genomas (`genomas=<archivo>` y claves `gen-<nombre>`); sirve para ver las variantes sin abrir el valle.
- Nota técnica: el lanzador de Electron se traga en silencio los argumentos con dos puntos. En las pruebas, usar rutas relativas y claves con guion.
- El motor de cuerpos ya soporta barba, bigote, anteojos, siete peinados masculinos y las cuatro caras base. Falta separar más las caras entre sí.
