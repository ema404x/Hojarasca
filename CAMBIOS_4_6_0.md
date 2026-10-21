# Hojarasca 4.6.0 — que todo el mapa tenga valor (paquete 1a)

Rama `v46-integra` (sobre la 4.5.1 sin carreras y la auditoría del mapa). Plan: `PLAN_MAPA_VALOR.md` («Decisiones tras
la auditoría»); datos: `AUDITORIA_MAPA_VALOR.md`. Hecho por tres equipos en paralelo y juntado acá; el detalle de cada
parte está en `CAMBIOS_4_6_PUESTOS.md`, `CAMBIOS_4_6_RECURSOS.md` y `CAMBIOS_4_6_GENTE.md`.

## Qué trae
- **Cuatro puestos de ruta abandonados que se reparan** (`puestos-ruta*.js`): Puesto de la Cantera, del Paso, de la
  Estepa y del Riel Sur, en coordenadas fijas. Tres etapas de $3.000 (10 tablas y 10 piedras en total); reparado da
  catre para dormir, fogón (F), depósito (reglas de la barraca, 40 de cada material) y mostrador con precios propios y
  caja de $5.000 que se repone $700 por día. **El Riel Sur es además la quinta parada de la trochita.**
- **Recursos de zona** (`recursos-zona*.js`) y cinco materiales nuevos (`junco`, `hierbas`, `arcilla`, `cuero`,
  `piedra-cantera`): veta de la cantera (6 piedras de cantera cada 2 días, con el pico de cantero, frente de roca nuevo),
  juncal (3 por día) y hierbas (2 por día) del mallín con la hoz, barranca de arcilla de la desembocadura (4 cada 2
  días, con la pala) y los 8 pehuenes del mirador que vuelven a dar 6 piñones cada otoño.
- **Herramientas de zona** (una sola lista, `HERRAMIENTAS_ZONA`): hoz de junco $900 (Josefina), pala de arcilla $1.100
  (Nicanor), cuchillo de cuero $1.000 (Fermín) y **pico de cantero** $4.000 con picapedrero nivel 3 (Tobías). El pico
  común pasa a llamarse **«Pico»**.
- **Tablón de encargos en la plaza** (`tablon*.js`): 3 a la vista por día, 1 entrega por día, 2 días de plazo, pagan
  ×1,5 / ×2 / ×2,5 según la distancia ($750–2.200; ~$1.650 por día simulado).
- **Gente del campo** (`gente-campo*.js`): Fermín Catrileo (pastor, galpón de esquila: lana y cuero), Belisario
  (arriero, junto al Puesto del Paso), Tobías Hughes (cantero, en la cantera), y **Nicanor y Josefina con pedidos y
  tiendita** («Pedidos y compras» en la rueda de charla).

## Decisiones de la junta
- Ids, nombres, precios y requisito de las herramientas salen de `recursos-zona.js`; la tiendita de la gente los lee de
  ahí y `darHerramientaDeZona` llama a `darHerramienta`. Fermín vende «cuchillo de cuero» (no «esquiladora»).
- Pico de cantero en **picapedrero nivel 3** (confirmado por el usuario).
- Con los valores de comercio de los materiales nuevos, el **cuero de Fermín sube a $750** y la **piedra de cantera de
  Tobías a $650**, para que no convenga comprarlos y revenderlos en un puesto; el encargo más barato del tablón queda en
  $750 (antes $700).
- Belisario y Tobías usan las posiciones de `PUESTOS_RUTA` (B y A).
- Las tres pruebas nuevas en el gate: `verificar-4-6-recursos`, `verificar-4-6-gente`, `verificar-4-6-puestos`.

## Verificación
- `npm run verify` de corrido sobre la rama juntada: **264 pasos OK** (4.5.1: 261 + 3).
- Pruebas nuevas: recursos 373 (367 + 6 del arreglo de abajo), gente 1615, puestos 451 comprobaciones OK.
- Partidas reales: ver «Partidas reales» abajo.

## Pendiente
- **Rocas flotando en las laderas de todo el valle** (`vegetacion.js`: 487 de 665 con el borde de abajo despegado, la
  peor a 3,85 m). Bug viejo, no de esta versión; arreglo de una línea propuesto en `CAMBIOS_4_6_RECURSOS.md`, sin aplicar.
- Medir fps en la Ryzen 5 4600G con todo lo nuevo (`npm run medir:caminata`).
- Sin ver: calidades baja y muy baja, noche, invierno y lluvia; un día jugado a mano con el tablón y los puestos.
- En calidad media un árbol grande detrás del Puesto de la Cantera parece salir del techo visto de frente.
- El cuaderno sigue diciendo «cuatro paradas».

## Partidas reales
Corridas de a una, ocultas, con `herramientas\lanzar-electron.ps1` (perfil `%TEMP%\hx\perfil46`), después de `node armar.mjs`.

| Partida | Resultado |
|---|---|
| `humo-4-6-recursos` (primera vez que se corre) | Antes del arreglo: **8 fallas** (abajo). Después: **OK**, todas sus comprobaciones (cantera, mallín, barranca, se repone, pehuén en otoño, guardar y recargar) |
| `humo-4-6-gente` | **OK** (tablón, Fermín, Belisario, Tobías, Nicanor, Josefina y el guardado) |
| `humo-4-6-puestos` | **OK**, 0 errores de consola (los cuatro puestos, tres etapas, catre, depósito, fogón, mostrador, la trochita en el Riel Sur, recargar) |
| `humo-4-5-1-sin-carreras` | **OK**, 0 errores de consola |
| `humo-trucos` | 113 OK y la falla conocida de la 4.5.0/4.5.1: después de «Escape devuelve a la pausa», un script que tira en la página (igual que antes, no es de la 4.6) |
| `humo-4-2-pico` | 48 OK y 2 fallas **de antes**: «forjado: pico…» y «el libro anota "Pico forjado"» (desde la 4.4.2 el herrero ofrece primero el afilado y la prueba no se actualizó). Comparado con la 4.5.1 armada aparte: las mismas 48 OK y las mismas 2 fallas. La primera corrida dio además 3 fallas que **eran de la 4.6** (ver abajo) y una de tiempo («el aviso dice "Golpe 1 de 6"», pasó en las dos corridas siguientes) |
| `humo-2-9-vela` | **OK** (42) |
| `humo-3-8-6-relax` | **TODO BIEN** (19) |

### Lo que se arregló
- **La E y el aviso en los recursos de zona** (`main.js`, `recursos-zona-mundo.js`). Causa: los recursos de zona van en la lista de
  la E y del aviso con `!objetivo`, y `objetivo` (lo que mirás: `objetos.buscar`) incluye «Anotar» la planta o el árbol que todavía
  no está en el cuaderno. En el juncal, mirando al agua, el helecho de la orilla era el objetivo («Anotar helecho») y al pie del
  pehuén, el tronco («Anotar pehuén»): E anotaba en vez de cortar o juntar. De ahí las 8 fallas: +3 juncos, que vuelva al otro día,
  que quede al ras, +3 más, los piñones, y lo guardado y lo recargado (era consecuencia: no había juncos; verificado, después del
  arreglo pasan sin tocar la prueba). Arreglo, en un solo lugar para la E y el aviso (los dos miran `objetivo`): la acción de
  `recursosZona.accion` trae `gana`, y si el objetivo es «Anotar» una planta o un árbol y el recurso gana, el objetivo se anula.
  Gana: **en un punto (veta, juncal, hierbas, arcilla), si tenés su herramienta** (fuiste a trabajarlo; si todavía no volvió, el aviso
  dice cuándo); **en un pehuén, si tiene piñones para dar**. Sin la herramienta o fuera del otoño, «Anotar» gana como siempre, y en
  el resto del valle nada cambia (sólo se mira cuando estás en el radio de un punto o al pie de un pehuén). Además, **juntar los
  piñones anota el pehuén** en el cuaderno (si no, apenas juntabas volvía «Anotar pehuén» y tapaba «ya dio sus piñones»). Seis
  comprobaciones nuevas en `verificar-4-6-recursos`.
- **Dos pruebas con un carácter de retroceso donde iba `\b`** (de la 4.6): `humo-4-2-pico.cjs` (`/Pico\b/` en la lista del almacén
  y en la mochila: fallaban aunque el texto estaba bien) y `verificar-4-6-gente.mjs` (`/\b[Dd]e el\b/`: pasaba sin probar nada; con
  `\b` de verdad sigue OK).
- Gate después de todo: **264 pasos OK**.

### Capturas (vistas a tamaño completo)
- Cantera: el frente de roca y la piedra labrada al pie se apoyan; la cámara de la prueba queda muy pegada al frente (casi toda la
  pantalla es roca). En la de Tobías se ven **rocas flotando en la ladera de atrás** (el bug viejo de `vegetacion.js`, ya anotado).
- Mallín: el juncal y las hierbas, bien; **crecido y «al ras» casi no se distinguen** a esa distancia entre el pasto alto y el helecho.
- Barranca de arcilla: la tierra y los panes en la orilla, nada flotando.
- Pehuén: la cámara queda contra el tronco (no se ve el árbol); bien la nota «Nuevo en el cuaderno: Pehuén» y «+6 piñones».
- Tablón: bien apoyado; **un farol de la plaza queda pegado detrás**, y de cerca su cabeza asoma justo encima del techito del tablón.
- Fermín, Belisario, Tobías, Nicanor y Josefina con los pies en el suelo.
- Puestos: los cuatro reparados se apoyan (B, en la ladera, sobre su zócalo de piedra); en el de la Cantera, **un árbol grande
  parece salir del techo visto de frente** (ya anotado en Pendiente).

### Otro hallazgo (de antes, no arreglado)
- `src/vecindad-social.js` (`INVITA_TEXTO.mate`) tiene un retroceso en lugar de `\b` (`/<retroceso>mate/i`): ya estaba en la 4.5.1. Esa
  expresión nunca encuentra «mate» en el texto de una invitación propia; habría que cambiarlo por `/\bmate/i` y probar las
  invitaciones.
