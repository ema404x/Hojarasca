// 4.0.3: navegar las pantallas con el mando (G1, G2, G3, G4 de la zona G). Lo puro (elegir el botón vecino, mover una barra) se prueba andando;
// el recorrido de verdad (portada → creación de Bruno → prólogo → pausa → cuaderno, el taller K y los planos O del Desafío, el fin de la corrida)
// lo hace `pruebas/humo-4-0-3-mando.cjs` con un mando simulado en Electron.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { elegirVecino, pasoDeBarra, direccionDeCruceta, AYUDA_MANDO_MENU } from '../src/mando-menu.js';
import { mapearMando, estadoVacio, BOTONES_MANDO } from '../src/mando.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const R = (x, y, w = 100, h = 30) => ({ x, y, w, h });

// una columna de botones (la portada): abajo y arriba, y se da la vuelta
{
  const col = [R(0, 0), R(0, 40), R(0, 80), R(0, 120)];
  eq(elegirVecino(col, 0, 'abajo'), 1, 'columna: abajo'); eq(elegirVecino(col, 2, 'arriba'), 1, 'columna: arriba');
  eq(elegirVecino(col, 3, 'abajo'), 0, 'columna: pasando el final da la vuelta al primero');
  eq(elegirVecino(col, 0, 'arriba'), 3, 'columna: pasando el principio da la vuelta al último');
  eq(elegirVecino(col, 1, 'izq'), 1, 'columna: a los costados no hay nadie, se queda');
  eq(elegirVecino(col, -1, 'abajo'), 0, 'sin nada marcado: el primero');
  eq(elegirVecino([], 0, 'abajo'), -1, 'sin botones: -1');
}
// dos columnas (la portada: los botones de a dos): se mueve por fila y por columna
{
  const g = [R(0, 0), R(110, 0), R(0, 40), R(110, 40), R(0, 80), R(110, 80)];
  eq(elegirVecino(g, 0, 'der'), 1, 'grilla: derecha'); eq(elegirVecino(g, 1, 'izq'), 0, 'grilla: izquierda');
  eq(elegirVecino(g, 0, 'abajo'), 2, 'grilla: abajo, misma columna'); eq(elegirVecino(g, 3, 'abajo'), 5, 'grilla: abajo, columna derecha');
  eq(elegirVecino(g, 5, 'abajo'), 1, 'grilla: pasando el final vuelve arriba, en la columna más cercana');
  eq(elegirVecino(g, 1, 'der'), 1, 'grilla: más allá de la última columna se queda');
}
// una fila de opciones de ancho distinto bajo un botón ancho (la portada: «Entrar al bosque» arriba, la tira de opciones abajo)
{
  const l = [R(0, 0, 400, 50), R(0, 70, 150, 30), R(160, 70, 150, 30), R(320, 70, 80, 30)];
  eq(elegirVecino(l, 0, 'abajo'), 2, 'de un botón ancho baja al más cercano al centro');
  eq(elegirVecino(l, 3, 'arriba'), 0, 'y sube');
  eq(elegirVecino(l, 1, 'der'), 2, 'por la fila');
}
// el panel de creación: filas de opciones de distinta cantidad, ordenadas por posición
{
  const p = [R(0, 0, 60), R(70, 0, 60), R(140, 0, 60), R(0, 40, 60), R(70, 40, 60), R(0, 80, 300, 40)];
  eq(elegirVecino(p, 2, 'abajo'), 4, 'filas desparejas: baja a la opción más cercana en horizontal');
  eq(elegirVecino(p, 4, 'abajo'), 5, 'y de ahí al botón de abajo');
  eq(elegirVecino(p, 5, 'arriba'), 4, 'y vuelve a la más alineada con el centro del botón ancho');
}
// las barras
{
  eq(pasoDeBarra(50, 0, 100, 1, 1), 55, 'barra 0-100: un veinteavo'); eq(pasoDeBarra(50, 0, 100, 1, -1), 45, 'barra: hacia abajo');
  eq(pasoDeBarra(98, 0, 100, 1, 1), 100, 'barra: no pasa del máximo'); eq(pasoDeBarra(2, 0, 100, 1, -1), 0, 'barra: ni del mínimo');
  eq(pasoDeBarra(4, 1, 8, 1, 1), 5, 'barra chica (1 a 8): de a un paso'); eq(pasoDeBarra(1, 1, 8, 1, -1), 1, 'barra chica: tope');
  eq(pasoDeBarra(0.5, 0, 1, 0.05, 1), 0.55, 'barra de decimales: el paso del campo');
  eq(pasoDeBarra(NaN, 0, 10, 1, 1), 1, 'valor roto: arranca del mínimo');
}
// la cruceta del mando real: los nombres de los botones de la cruceta coinciden con los de mando.js
{
  const pad = (i) => ({ axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, (_, k) => ({ pressed: k === i, value: k === i ? 1 : 0 })) });
  const dirDe = (i) => direccionDeCruceta(mapearMando(pad(i), estadoVacio()).recien);
  eq(dirDe(12), 'arriba', 'botón 12: arriba'); eq(dirDe(13), 'abajo', 'botón 13: abajo');
  eq(dirDe(14), 'izq', 'botón 14: izquierda'); eq(dirDe(15), 'der', 'botón 15: derecha'); eq(dirDe(0), null, 'A no es de la cruceta');
  ok(BOTONES_MANDO.mochila === 12 && BOTONES_MANDO.taller === 13 && BOTONES_MANDO.planos === 14 && BOTONES_MANDO.mapa === 15, 'la numeración de la cruceta no cambió');
  ok(AYUDA_MANDO_MENU.includes('Cruceta'), 'hay un texto de ayuda');
}
// el enchufe en main.js (el recorrido real está en el humo con mando simulado)
{
  const m = leer('src/main.js');
  for (const t of ['function navegarMando(', 'function capaDeMando(', 'function mandoEnCapa(', 'function mandoEnObra(', 'function moverPlanoObra(',
    "id: 'taller-desafio'", "$('corrida')?.classList.contains('oculto') ? $('victoria') : $('corrida')", 'if (capaCreador) { mandoEnCapa(m, capaCreador); return; }']) ok(m.includes(t), `main.js: ${t}`);
  ok(leer('src/creador-pantalla.js').includes("'data-atras'") && leer('src/creador-prologo.js').includes("'data-atras'"), 'el creador y el prólogo marcan su botón de volver');
  ok(leer('src/plantilla.html').includes('.foco-mando'), 'hay un marco para el botón marcado con el mando');
  ok(!leer('src/creador-prologo.js').includes('No hay mando todavía'), 'el prólogo ya no dice que no hay mando');
}
console.log(`OK 4.0.3 mando en los menús · ${n} verificaciones · cruceta por posición con vuelta, barras, la cruceta real de mando.js y el enchufe`);
