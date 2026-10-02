// 3.5.4: caos y errores. Sólo Node (la partida de verdad, con semilla, está en
// pruebas/humo-3-5-4-caos.cjs; el caos largo en herramientas/caos-largo.cjs).
// Cada caso es un error que encontró el caos y que no tiene que volver:
//  1. Una partida con una obra muy lejos (1e308) colgaba la carga para siempre (los
//     recorridos por celdas de las colisiones no avanzan: 1e308 + 1 === 1e308), y con todas
//     lejos tiraba "Invalid array length" y el juego no llegaba a la portada.
//     Lo mismo la carpa y los renovales; y la grilla de colisiones no se cuelga con una
//     coordenada enorme venga de donde venga.
//  2. F1 en el modo foto abría la pausa y la guía con el modo foto prendido debajo; en el modo
//     foto la rueda y los clics usaban lo que tenías en la mano. Y un clic derecho usaba la
//     ranura dos veces (jugador.js y main.js): dos panes, la linterna prendida y apagada.
//  3. Las boleadoras del Desafío escribían tres avisos de three por cada carga.
//  4. Las herramientas de caos se pueden correr (sintaxis).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// ---------------------------------------------------------------- 1. obras lejísimos
const datos = new Map();
globalThis.localStorage = {
  getItem: (k) => (datos.has(k) ? datos.get(k) : null),
  setItem: (k, v) => datos.set(k, String(v)),
  removeItem: (k) => datos.delete(k),
};
const G = await import('../src/guardado.js?v354=' + Date.now());
const { LIMITE } = await import('../src/config.js');
{
  const p = G.progresoNuevo();
  p.dia = 9;
  p.obras = [
    { plano: 'cantero', x: 10, z: 12, rot: 0, etapas: 1 },
    { plano: 'telar', x: 30, z: 1e308, rot: 0, etapas: 1 },
    { plano: 'buzon', x: -1e20, z: 4, rot: 0, etapas: 1 },
    { plano: 'alero', x: LIMITE + 20, z: -LIMITE - 20, rot: 0, etapas: 1 },   // en el borde: se queda
    { plano: 'horno', x: 5, z: 5, y: 1e308, rot: 0, etapas: 1 },
    { plano: 'tendal', x: 6, z: 6, y: 12.5, rot: 0, etapas: 1 },
  ];
  datos.set('hojarasca-v1', JSON.stringify(p));
  const c = G.cargarProgreso();
  ok(c && c.dia === 9, 'la partida carga');
  const planos = c.obras.map((o) => o.plano);
  ok(!planos.includes('telar') && !planos.includes('buzon'), `las obras con una coordenada enorme se descartan (${planos.join(',')})`);
  ok(planos.includes('cantero') && planos.includes('alero') && planos.includes('horno') && planos.includes('tendal'), 'las demás se quedan, también la del borde del valle');
  ok(c.obras.every((o) => Math.abs(o.x) <= LIMITE * 2 && Math.abs(o.z) <= LIMITE * 2), 'ninguna queda fuera del valle');
  const horno = c.obras.find((o) => o.plano === 'horno'), tendal = c.obras.find((o) => o.plano === 'tendal');
  ok(horno.y === undefined, 'una altura imposible se olvida (la obra va al suelo)');
  ok(tendal.y === 12.5, 'una altura normal (un piso de arriba) se respeta');
  // y lo mismo al importar una partida de afuera
  ok(G.escribirPartida('relax', 2, p) === true, 'importada, se escribe');
  const imp = JSON.parse(datos.get('hojarasca-p2-v1'));
  ok(imp.obras.length === 4, `importada, también sin las obras lejísimos (${imp.obras.length})`);
}

// la carpa y los renovales también (los renovales se meten en la grilla de colisiones)
{
  const p = G.progresoNuevo();
  p.carpa = { x: 1e308, z: 3, yaw: 0 };
  p.renovales = [{ x: 4, z: 5, dia: 1 }, { x: 4, z: -1e20, dia: 1 }];
  datos.set('hojarasca-v1', JSON.stringify(p));
  const c = G.cargarProgreso();
  ok(c.carpa === null && c.renovales.length === 1, `la carpa y el renoval lejísimos se descartan (${JSON.stringify({ carpa: c.carpa, renovales: c.renovales })})`);
}
// y la grilla de colisiones no se cuelga con una coordenada enorme, venga de donde venga
{
  const { crearColisiones } = await import('../src/colisiones.js');
  const col = crearColisiones();
  const t0 = Date.now();
  col.agregar({ x: 1e308, z: 0, r: 0.5 });
  col.agregar({ x: 0, z: -1e20, r: 0.5 });
  col.agregar({ seg: true, ax: -1e308, az: 0, bx: 1e308, bz: 0, r: 0.2 });
  col.agregar({ seg: true, ax: 0, az: 0, bx: 0, bz: 9000, r: 0.2 });
  col.agregarPlataforma({ x: 1e308, z: 1e308, largo: 2, ancho: 2, alto: 1 });
  const tapa = col.paredEntre(0, 0, 1e308, 0, 0, 1);
  ok(Date.now() - t0 < 1000, `agregar y consultar con coordenadas enormes termina (${Date.now() - t0} ms)`);
  ok(tapa === false, 'un tramo hasta lejísimos no choca con nada');
  col.agregar({ x: 3, z: 3, r: 0.5 });
  col.agregar({ seg: true, ax: -2, az: 5, bx: 2, bz: 5, r: 0.2 });
  ok(col.paredEntre(0, 0, 0, 10, 0, 1) === true, 'lo normal sigue chocando (una pared entre dos puntos)');
}

// ---------------------------------------------------------------- 2. F1 en el modo foto
const main = leer('src/main.js');
{
  const i = main.indexOf("if (codigo === 'F1') {");
  ok(i > 0, 'está el manejo de F1');
  const bloque = main.slice(i, i + 600);
  const corta = bloque.indexOf('if (foto.activo) return;'), abre = bloque.indexOf("abrir('pausa'); abrirGuia('pausa');");
  ok(corta > 0 && abre > corta, 'en el modo foto F1 no abre la pausa ni la guía (se corta antes)');
  // y el mouse es de la cámara: la rueda, el clic derecho (usar), el izquierdo del Desafío (atacar) y la caña
  const rueda = main.slice(main.indexOf("window.addEventListener('wheel'"), main.indexOf("window.addEventListener('wheel'") + 200);
  ok(/mochilaAbierta \|\| foto\.activo\) return;/.test(rueda), 'la rueda no cambia la ranura en el modo foto');
  ok(main.includes("if (e.button !== 2 || modo !== 'jugando' || mochilaAbierta || foto.activo) return;"), 'el clic derecho no usa nada en el modo foto');
  ok(main.includes('desafio.caido || foto.activo) return;'), 'el clic izquierdo no ataca en el modo foto');
  ok(main.includes('!jugador.bloqueado() || foto.activo) return;'), 'ni tira la línea en el modo foto');
}
// ---------------------------------------------------------------- 2b. el clic derecho, una vez
{
  const jug = leer('src/jugador.js');
  ok(!/alUsar\s*\(/.test(jug) && !main.includes('alUsar'), 'el clic derecho sobre el lienzo ya no usa la ranura desde jugador.js (main.js lo hace una vez)');
}

// ---------------------------------------------------------------- 3. boleadoras sin avisos
{
  const d = leer('src/desafio.js');
  ok(!/IcosahedronGeometry\([^)]*\)\.toNonIndexed\(\)/.test(d), 'el icosaedro (que ya viene sin índice) no pasa por toNonIndexed');
}

// ---------------------------------------------------------------- 4. las herramientas de caos
for (const f of ['herramientas/caos-largo.cjs', 'herramientas/caos-guardados.cjs', 'herramientas/caos-preload.cjs', 'herramientas/caos-ayuda.cjs', 'pruebas/humo-3-5-4-caos.cjs']) {
  if (!fs.existsSync(path.join(raiz, f))) { ok(false, `falta ${f}`); continue; }
  const t = leer(f);
  assert.doesNotThrow(() => new vm.Script(t, { filename: f }), `${f} tiene un error de sintaxis`);
  ok(!t.includes('\r\n') && t.charCodeAt(0) !== 0xfeff, `${f}: LF y sin BOM`);
}
{
  // la ayuda que corre en la página es una función que se manda como texto: también se compila
  const { AYUDA } = (await import('node:module')).createRequire(import.meta.url)(path.join(raiz, 'herramientas/caos-ayuda.cjs'));
  assert.doesNotThrow(() => new vm.Script(`(${AYUDA.toString()})`), 'la ayuda de la página compila');
  ok(true, 'la ayuda de la página compila');
}

console.log(`OK 3.5.4 caos · ${pasos} pasos (obras lejísimos, F1 en el modo foto, boleadoras, herramientas)`);
