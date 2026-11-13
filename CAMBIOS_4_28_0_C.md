# 4.28.0 (C): Ultra en personajes, casas y materiales

Zona C del nivel Ultra: los materiales de las casas (madera, piedra, chapa, revoque y tejas), la gente de cerca y, del agregado del usuario, lo mojado, la nieve, el musgo y el vapor. **Todo está detrás de `esUltra(ajustes)`** y no suma texturas, geometría ni llamadas de dibujo: es código de shader que se agrega a los materiales que ya existen, sólo con Ultra.

## Cómo está armado

- **`src/ultra-materiales.js` (nuevo):** guarda el estado de Ultra de los materiales y los agregados de shader (GLSL). No importa three.
  - `sincronizarUltraC(ajustes)`: mira `esUltra(ajustes)`. Si cambió, marca `needsUpdate` en cada material registrado y avisa a los oyentes. `main.js` la llama al abrir (antes de armar ningún material) y en cada cuadro (es una comparación). Así sigue al menú y a la calidad, sea la elegida a mano o la automática. Si la calidad baja de Alta, Ultra se apaga **en vivo, sin reiniciar**.
  - `conUltraC(mat, tipo, inyectar)`: **sólo con Ultra**, la clave del programa del material suma `|ultra-c-<tipo>` y el `onBeforeCompile` agrega el código. Apagado, la clave y el shader son los de la 4.27.0 (la prueba los compara contra un material sin tocar).
  - `tren.js` guardaba la clave de la aldea una sola vez. Ahora la pide en cada compilación; si no, con Ultra compartiría la clave de Alta teniendo otro código.
- **Lo que se prende con Ultra:**
  1. **Aldea, tren, almacén y casa de té** (`prepararMaterialAldea`):
     - Relieve según el tipo de superficie: la normal se inclina con una altura procedural. Hay tablas con el canto redondeado y la veta, tablas solapadas, tejuelas, piedra que abomba entre juntas hundidas, revoque con grano, madera tosca, piso y laja.
     - Lo hundido se oscurece, así el relieve se lee también a la sombra.
     - Brillo de metal en la chapa (menos donde hay óxido) y brillo de mojado con lluvia.
     - Gotitas de barro y una franja húmeda al pie de las paredes, chorreado que baja y pintura gastada en los cantos.
  2. **Estructuras del valle y obras del jugador** (`est.mat` y el material de `construccion.js`): veta en la madera, grano y abombado en la piedra, salpicado y chorreado al pie. La veta va acostada en los troncos y parada en las tablas, según la curvatura.
  3. **Gente de cerca** (`materialAtlas`):
     - Relieve de la tela, sacado del mismo tejido del atlas.
     - Poros y un brillo suave en la piel (más en la frente, la nariz y los pómulos).
     - Labios húmedos, hebras del pelo y cuero con brillo.
     - La cara con gestos se dibuja hasta **10 m** (7 m sin Ultra).
  4. **Del agregado del usuario:**
     - Charcos que reflejan el cielo y el paisaje, con los anillos de las gotas, en el ripio de las calles y la plaza de la aldea (con lluvia hay más charcos) y en la laja y la piedra de afuera.
     - Madera y piedra mojadas más oscuras y con brillo.
     - Nieve pegada por el viento en paredes, postes y cercos, y el brillo de los cristales de nieve al sol.
     - Musgo y líquenes del lado húmedo, con relieve: al sur, abajo y arriba de lo que junta agua, en piedra, laja, tejuelas y madera vieja.
     - El humo de las chimeneas y las fogatas y el vapor de la olla, en hebras que se deshacen (antes eran discos lisos).

## Medido

Notebook Ryzen 7 7730U, ventana visible, `-SinFreno`, auditoría con `gl.finish`. La PC estaba compartida con las corridas de A y B.

| Toma | Ultra (C): ronda 1 / 2 / 3 | Alta, mismo armado |
|---|---|---|
| 05 plaza de día | 32,1 (38 cuadros) / 27,5 / 31,5 ms → **mediana 31,5 ms** | 24,5 ms (52 cuadros); otra ronda dio 51,8 ms (PC cargada) |
| 02 bosque denso de día | 18,0 (60 cuadros) / 972 (descartada: ventana frenada) / 19,8 ms → **~19 ms** | 14,8 ms (76 cuadros) |

Entra en los 33 ms, pero con reparos:
- Sólo la primera ronda de Ultra llegó a 30 cuadros o más. Las otras dos midieron 3 o 4 cuadros: la ventana quedó frenada a pesar de `-SinFreno`, con A y B midiendo al mismo tiempo.
- En esta máquina, Ultra cuesta unos 3 a 7 ms más en la plaza (con mucho ruido).
- No se midió en la 4600G.

**Ultra apagado = 4.27.0:**
- Con la misma carga y las mismas tomas (banco de día, cantina de noche, refugio de día), la lista de programas de shader de la partida (cada clave, una por una) es **idéntica** a la de la base `b50a29b`: 105, 107 y 107 programas, 0 claves distintas, 0 de Ultra.
- En las capturas de noche cambia el 1,2 % de los píxeles (la gente y las partículas). De día cambian más por las sombras de las nubes: el reloj del cielo corre distinto entre corridas, pero la geometría y los colores son los mismos.
- Prender Ultra en vivo suma 7 programas (aldea, estructura, gente, ripio, humo y sus variantes). Apagarlo vuelve a los de Alta sin recargar.

## Capturas (Alta y Ultra en la misma toma, cambiado en vivo)

`herramientas/auditoria-visual-4-20-0.cjs` suma dos variables:
- `AUD_ULTRA=1`: carga con Ultra.
- `AUD_PAR_ULTRA=1`: después de cada captura, saca la misma toma con Ultra cambiado en vivo (`<id>-ultra.png`), con el mismo cielo y las mismas nubes. Sirve también para probar que prender Ultra en vivo anda.

Las tomas propias están en `herramientas/auditoria-visual-4-28-0-c.json`: el banco de piedra y cal, la casa de la familia, la cantina, los vidrios de la biblioteca, la gente y el refugio, de día, al ocaso, de noche, con nieve y con lluvia.

Los pares (arriba Alta, abajo Ultra) están en `C:\Users\Andres\AppData\Local\Temp\hx\c4280\entrega\`:
- `z7`: el piso de la galería y la piedra del banco.
- `z6` y `x-c6-refugio-dia`: la veta de los troncos.
- `z8`: Fermín entre 7 y 10 m. Con Ultra se ve la cara con gestos (ojos y boca) y la tela de la camisa.
- `x-ll1`, `x-ll2` y `lluvia-casa-familia`: con lluvia, la madera mojada más oscura y la chapa con brillo.
- `x-nieve6`: la nieve.

Lo que mejor se ve: el relieve y la veta de la madera, la piedra con juntas hundidas, lo mojado y la gente entre 7 y 10 m.

## Quedó afuera / anotado

- **Vidrios que reflejan el cielo:** está hecho (`vidrioUltra` en `ultra-materiales.js`), pero en la partida las ventanas de la biblioteca y del refugio salieron **iguales** con y sin Ultra, incluso después de corregir la cuenta de noche. No encontré a tiempo por qué. Por el criterio 3 no entra; el código queda sin enganchar.
- **Charcos del terreno** (fuera del pueblo): el suelo es de B. Sólo hice los del ripio de la aldea y los de la laja y la piedra de afuera. En las capturas de lluvia, los charcos del ripio se ven poco porque dependen de los baches de la máscara.
- **Nieve pegada en paredes y cercos, y el brillo de la nieve:** están, pero en las capturas casi no se notan (son manchones chicos). El musgo y los líquenes tampoco se notan a 8 m.
- **Vapor de la pava y la olla:** las hebras del humo de la cocina (`cocina-mundo.js`) no se vieron en ninguna captura, porque no hubo una toma cocinando.
- **Nieve en los bordes de las ventanas:** no se hizo aparte; los alféizares horizontales ya juntan nieve por la normal.
- **La gente:** el relieve de la tela y el brillo de la piel son sutiles. Lo que se nota es la cara con gestos hasta 10 m.

## Pruebas

- `pruebas/verificar-4-28-0-c.mjs` (en `verify:pasos`): 68 comprobaciones con los materiales de verdad (el three local y los trozos de shader de three) y **17 mutaciones**, todas atrapadas. Prueban, entre otras cosas, que con Ultra apagado no cambia la clave ni se mete el shader, que Ultra mira la calidad, que se recompila al cambiar y que no se pierde la clave de antes. También cubren el relieve, la aldea y la gente, la cara a 10 m sólo con Ultra, la sincronización por cuadro, la clave del tren, los charcos y su cielo, la nieve pegada, el ripio y el humo.
- También en verde: todas las `verificar-*` que leen los archivos que toqué (aldea-arquitectura, gente-cuerpo, tren, clima, cocina-mundo, estructuras, construccion, aldea-mundo, materiales), corridas una por una.
- Partida real (auditoría, con el candado): verano de día, al ocaso y de noche, invierno y lluvia, en Alta y con Ultra cambiado en vivo. **Sin errores de consola.**
- No hay claves de guardado nuevas: `ultra` ya venía en la base.
