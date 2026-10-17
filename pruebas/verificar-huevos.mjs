// 4.2 (huevos de pascua): las reglas puras de los easter eggs del Relax (src/huevos.js), su guardado (src/guardado.js) y el
// enganche en main.js. Sin Electron. Se prueba que:
//  · la estrella fugaz con deseo: una por noche, separadas varias noches, probabilidad baja y determinista, tres deseos, se cumple
//    a los 2 a 4 días con un regalo chico y una nota, y no hay dos deseos a la vez;
//  · lo que se guarda se sanea (partida vieja sin el campo, datos rotos, caos) y el Desafío no lo tiene.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const H = await imp('huevos.js');

// ---------------------------------------------------------------- 0. el azar determinista
ok(H.azarDe(1, 2, 3) === H.azarDe(1, 2, 3) && H.azarDe(1, 2, 3) !== H.azarDe(3, 2, 1), 'el azar es siempre el mismo con los mismos números');
{ let min = 1, max = 0, suma = 0; for (let i = 0; i < 5000; i++) { const a = H.azarDe(99, i); min = Math.min(min, a); max = Math.max(max, a); suma += a; } ok(min >= 0 && max < 1 && Math.abs(suma / 5000 - 0.5) < 0.03, 'y reparte parejo en [0, 1)'); }

// ---------------------------------------------------------------- 1. la estrella fugaz con deseo
ok(H.DESEOS.length === 3 && new Set(H.IDS_DESEOS).size === 3 && H.DESEOS.every((d) => d.texto.length > 0 && d.texto.length <= 28), 'tres deseos, cortos');
ok(H.ESTRELLA.demoraMin === 2 && H.ESTRELLA.demoraMax === 4, 'el deseo se cumple a los 2 a 4 días');
{
  const h = H.huevosNuevos();
  // probabilidad: baja (alrededor de la declarada) y la misma cada vez
  let si = 0; const N = 4000;
  for (let n = 0; n < N; n++) if (H.trajoDeseo({ estrella: H.estrellaNueva() }, 10 + n, 1)) si++;
  ok(si / N > 0.12 && si / N < 0.3, `trae deseo una de cada ~5 fugaces vistas (${si}/${N})`);
  ok(H.trajoDeseo(h, 40, 2) === H.trajoDeseo(h, 40, 2), 'el sorteo es determinista');
  // una vez por noche
  let noche = 0, n0 = 0;
  for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) { noche = 50; n0 = n; break; }
  ok(noche === 50, 'alguna fugaz de una noche trae deseo');
  H.ofrecerEstrella(h, 50);
  let otra = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) otra = true;
  ok(!otra, 'una vez por noche: ya no hay otra esa noche');
  let seguido = false; for (let d = 51; d < 50 + H.ESTRELLA.separacion; d++) for (let n = 1; n < 120; n++) if (H.trajoDeseo(h, d, n)) seguido = true;
  ok(!seguido, `y no más de una cada ${H.ESTRELLA.separacion} noches`);
  let despues = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50 + H.ESTRELLA.separacion, n)) despues = true;
  ok(despues, 'pasadas las noches de separación, vuelve a ser posible');
  // pedir
  ok(H.pedirDeseo(h, 7, 50) === null && H.pedirDeseo(h, -1, 50) === null && h.estrella.deseo === null, 'un deseo que no existe no se pide');
  const d = H.pedirDeseo(h, 1, 50);
  ok(d && d.id === 'vecino' && d.pedido === 50 && d.cumple >= 52 && d.cumple <= 54, 'pedido el 50, se cumple entre el 52 y el 54');
  ok(H.pedirDeseo(h, 0, 50) === null, 'no hay dos deseos a la vez');
  let con = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 200, n)) con = true;
  ok(!con, 'con un deseo esperando, no viene otra estrella con deseo');
  ok(!H.deseoListo(h, d.cumple - 1, 12) && !H.deseoListo(h, d.cumple, 3) && !H.deseoListo(h, d.cumple, 21) && H.deseoListo(h, d.cumple, 9) && H.deseoListo(h, d.cumple + 5, 9), 'se cumple a la mañana o la tarde del día señalado o después, nunca de noche');
  const r = H.cumplirDeseo(h, d.cumple);
  ok(r && r.id === 'vecino' && VECINOS().includes(r.vecino) && r.amistad === 1 && r.texto.includes('__NOMBRE__') && !r.material, 'la visita: un vecino del valle y un punto de amistad');
  ok(h.estrella.deseo === null && h.estrella.cumplidos === 1 && H.cumplirDeseo(h, d.cumple) === null, 'queda cumplido una sola vez');
  // los regalos son chicos
  for (const [i, k, max] of [[0, 'tronco', 4], [2, 'calafate', 5]]) {
    const x = H.huevosNuevos(); H.pedirDeseo(x, i, 10);
    const g = H.cumplirDeseo(x, 13);
    ok(g.material.k === k && g.material.n >= 1 && g.material.n <= max && g.texto.length > 20 && g.titulo.length > 3, `el regalo del deseo ${i} es chico (${g.material.n} ${k})`);
  }
}
function VECINOS() { return H.VECINOS_DESEO; }
{
  const V = await imp('vecindad.js');
  ok(H.VECINOS_DESEO.every((k) => V.VALLE_VECINDAD.includes(k)), 'los vecinos de la visita son del valle (vecindad.js)');
}

// ---------------------------------------------------------------- 2. lo que se guarda
eq(H.sanearHuevos(undefined, 10), H.huevosNuevos(), 'una partida vieja (sin el campo) arranca de cero');
eq(H.sanearHuevos(null, 10), H.huevosNuevos(), 'null: de cero');
eq(H.sanearHuevos({ estrella: { ultimaNoche: 9999, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: -4 } }, 20).estrella, { ultimaNoche: 20, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: 0 }, 'las fechas no pasan de hoy');
for (const malo of [{ id: 'magia', pedido: 5, cumple: 7 }, { id: 'lena', pedido: 30, cumple: 32 }, { id: 'lena', pedido: 5, cumple: 5 }, { id: 'lena', pedido: 5, cumple: 90 }, 'x', 7, [], { id: 'lena' }]) {
  ok(H.sanearHuevos({ estrella: { deseo: malo } }, 20).estrella.deseo === null, `un deseo imposible se descarta: ${JSON.stringify(malo)}`);
}
{
  let rng = 11; const azar = () => ((rng = (rng * 1103515245 + 12345) >>> 0) / 4294967296);
  const valor = (d = 0) => { const r = azar(); if (d > 2 || r < 0.3) return [null, -1, 0, 1e9, NaN, 'x', true, 'lena', 'tierra'][Math.floor(azar() * 9)]; if (r < 0.65) { const o = {}; for (const k of ['estrella', 'deseo', 'id', 'pedido', 'cumple', 'cumplidos', 'ultimaNoche', 'v']) if (azar() < 0.6) o[k] = valor(d + 1); return o; } return [valor(d + 1), valor(d + 1)]; };
  let bien = 0;
  for (let i = 0; i < 500; i++) {
    const x = H.sanearHuevos(valor(), 1 + Math.floor(azar() * 60));
    const y = H.sanearHuevos(JSON.parse(JSON.stringify(x)), 100);
    if (JSON.stringify(y) === JSON.stringify(x) && Number.isFinite(x.estrella.ultimaNoche) && x.estrella.cumplidos >= 0) bien++;
  }
  eq(bien, 500, 'el caos: nunca se rompe y lo saneado queda igual');
}
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const GU = await import('../src/guardado.js?v42huevos=' + Date.now());
  eq(GU.progresoNuevo().huevos, H.huevosNuevos(), 'partida nueva del Relax: los huevos de cero');
  const vieja = GU.progresoNuevo(); delete vieja.huevos; vieja.dia = 40;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  eq(GU.cargarProgreso().huevos, H.huevosNuevos(), 'una partida vieja carga bien y arranca de cero');
  const con = GU.progresoNuevo(); con.dia = 40; con.huevos = { estrella: { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 } };
  datos.set('hojarasca-v1', JSON.stringify(con));
  eq(GU.cargarProgreso().huevos.estrella, { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 }, 'un deseo esperando se conserva al recargar');
}
{
  const g = leer('src/guardado.js');
  ok(g.includes("huevos: modoPartida === 'desafio' ? undefined : sanearHuevos(p.huevos,") && g.includes('...(desafio ? {} : { huevos: huevosNuevos() })'), 'en el Desafío, sin huevos');
  const m = leer('src/main.js');
  ok(m.includes('huevosJuego?.fugazVista(diaNoche, nocheCielo.vistas)') && m.includes("!desafio) huevosJuego?.actualizar(dt)"), 'main.js: la fugaz vista y el reloj de 2 segundos, sólo en el Relax');
  const j = leer('src/huevos-juego.js');
  ok(!/requestAnimationFrame/.test(j) && !/from 'three'/.test(j) && /acum < 2/.test(j), 'huevos-juego.js: por evento, sin cuadros ni three');
  const p = leer('src/huevos.js');
  ok(!/from 'three'/.test(p) && !/document\./.test(p) && !/Date\.now|Math\.random/.test(p.replace(/\/\/.*$/gm, '')), 'huevos.js es puro: ni three ni DOM ni reloj ni Math.random');
}

console.log(`OK 4.2 huevos de pascua · ${pasos} verificaciones · estrella con deseo, guardado saneado y enganche`);
