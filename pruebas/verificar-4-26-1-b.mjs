// 4.26.1 (B): cinemáticas y la Historia. Cada arreglo tiene su mutación (la misma prueba sobre una copia de src/ con el arreglo deshecho tiene que fallar):
//   1. motor   el plano `libre` sin `posFin` deja la lente a su altura (antes bajaba al piso en la duración del plano); un `posFin` sin `dy` queda a la misma altura
//              sobre su punto; en `{ ref, dy }` el `dy` se suma una vez; los tres planos libres de las escenas dan la misma altura que antes
//   2. vista   lo que ve la cámara de una escena (`seVeDesde`) y los cortes que cuenta el director (un plano sin mezcla)
//   3. llegadas  con el director y el mundo de escenas de verdad (escenas.js + escenas-mundo.js + colisiones.js): quien arranca lejos aparece a 34 m donde la cámara
//              no mira; si la cámara lo ve, camina y llega en un parpadeo; la caminata trabada llega de golpe sólo fuera de cuadro, en un corte o en un parpadeo;
//              al saltar la escena (Esc), de golpe como siempre; el despeje de la lente no cuenta como corte
//   4. silueta la del anochecer de los capítulos 2 a 4 encuentra lugar con una segunda vuelta (el borde del bosque), nunca adentro del bosque cerrado, y reintenta
//              a los 2,5 s; la de los capítulos 5 a 8 no cambia
//   5. tocon   el tocón del coihue grande (que no rebrota) no cuenta en «tocones rebrotando»
//   6. elsa    el plano de cerca de Elsa en el andén: Elsa pasado el alero (al sol), la lente quieta a la altura de los ojos
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, ESC, imp, nuevaPartida, rng } from './ayuda-4-18-4-historia.mjs';
import { enUnaLinea, funcion } from './ayuda-codigo.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const HIJO = !!process.env.A4261B_HIJO;
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const SEC = process.env.A4261B_SECCIONES ? new Set(process.env.A4261B_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4261B_CALLADO) console.log('FALLA ' + t); } };

const ES = await imp('escenas.js'), EM = await imp('escenas-mundo.js'), PR = await imp('historia-presencia.js');
const { crearColisiones } = await imp('colisiones.js');
const { resumenBosque } = await imp('bosque.js');
const { coihueQuedaTocon } = await imp('historia-disparadores-acto2.js');

// ---------------------------------------------------------------- 1. el motor: el plano libre
if (va('motor')) {
  const suelo = (x) => 0.5 + 0.1 * x;
  const mundo = { posicion: (r) => (r === 'elsa' ? { x: 10, z: 10, y: 0.6 } : r && typeof r === 'object' && r.lugar ? { x: 2 + (r.dx || 0), z: 3 + (r.dz || 0) } : null), suelo };
  const alturas = (p) => { const f = ES.compilarPlano({ plano: 'libre', fov: 50, mira: { ref: 'elsa', dy: 1.45 }, ...p }, { mundo, base: null }); return [0, 0.5, 1].map((u) => f(u).y); };
  const cerca = (a, b) => Math.abs(a - b) < 1e-9;
  { const ys = alturas({ pos: { lugar: 'x', dy: 1.7 } });
    ok(ys.every((y) => cerca(y, suelo(2) + 1.7)), `sin posFin la lente queda a su altura de principio a fin (${ys.map((y) => y.toFixed(2)).join(', ')}; antes bajaba a ${suelo(2).toFixed(2)})`); }
  { const ys = alturas({ pos: { lugar: 'x', dy: 1.7 }, posFin: { lugar: 'x', dx: 4 } });
    ok(cerca(ys[0], suelo(2) + 1.7) && cerca(ys[2], suelo(6) + 1.7), `un posFin sin dy termina a la misma altura sobre su punto (${ys[2].toFixed(2)}; antes ${suelo(6).toFixed(2)}, en el piso)`); }
  { const ys = alturas({ pos: { lugar: 'x', dy: 1.7 }, posFin: { lugar: 'x', dx: 4, dy: 0.5 } });
    ok(cerca(ys[2], suelo(6) + 0.5), 'un posFin con su dy usa el suyo'); }
  { const ys = alturas({ pos: { ref: 'elsa', dx: 2, dy: 1.7 } });
    ok(ys.every((y) => cerca(y, 0.6 + 1.7)), `en { ref, dy } el dy se suma una vez (${ys[0].toFixed(2)}; antes ${(0.6 + 3.4).toFixed(2)})`); }
  { const ys = alturas({ pos: { ref: 'elsa', dx: 2, dy: 1.7 }, posFin: { ref: 'elsa', dx: -2 } });
    ok(cerca(ys[2], 0.6 + 1.7), 'un posFin { ref } sin dy queda a la altura de pos sobre su punto'); }
  { const ys = alturas({ pos: { lugar: 'x', dy: 1.7 }, posFin: { x: 5, z: 5, y: 3 } });
    ok(cerca(ys[2], 3), 'un posFin con su y queda en esa y'); }
  // los planos libres de las escenas: la misma altura que con la cuenta de antes (pos.dy → posFin.dy; ninguno usa { ref } de pos)
  let iguales = 0, libres = 0;
  for (const e of Object.values(ESC)) for (const p of e.pasos || []) {
    if (p?.tipo !== 'plano' || p.plano !== 'libre') continue;
    libres++;
    const m2 = { posicion: (r) => (typeof r === 'string' || (r && r.ref) ? { x: 1, z: 1, y: 0.4 } : { x: 5, z: 7 }), suelo: () => 0.3 };
    const f = ES.compilarPlano(p, { mundo: m2, base: null });
    const y0 = 0.3 + (p.pos.dy || 0), y1 = p.posFin ? 0.3 + (p.posFin.dy || 0) : null;
    const antes = (u) => (y1 === null ? y0 : y0 + (y1 - y0) * u);
    if ([0, 0.5, 1].every((u) => Math.abs(f(u).y - (p.posFin ? antes(u) : y0)) < 1e-9)) iguales++;
  }
  ok(libres >= 3 && iguales === libres, `los ${libres} planos libres de las escenas quedan a la altura de siempre (${iguales} iguales)`);
}

// ---------------------------------------------------------------- 2. lo que ve la cámara de una escena
if (va('vista')) {
  const q = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 60 };   // (yaw 0: mira hacia −z)
  ok(EM.seVeDesde(q, 0, 0, -10) === true, 'alguien adelante se ve');
  ok(EM.seVeDesde(q, 0, 0, 10) === false, 'alguien atrás no');
  ok(EM.seVeDesde(q, 0, 0, -150) === true && EM.seVeDesde(q, 0, 0, -210) === false, 'a 150 m todavía se ve; a más de 200 m es un punto: no cuenta');
  ok(EM.seVeDesde(q, 30, 0, -10) === false, 'muy al costado, afuera del cuadro');
  ok(EM.seVeDesde(q, 11, 0, -10) === true, 'cerca del borde del cuadro (16:9), adentro');
  ok(EM.seVeDesde(q, 11, 0, -10, 1) === false, 'con una pantalla cuadrada ese mismo lugar queda afuera');
  ok(EM.seVeDesde(q, 3.84, 0, -3) === true, 'un cuerpo apenas pasado el borde se ve (es una bola de un metro)');
  ok(EM.seVeDesde({ ...q, pitch: -0.8 }, 0, 0, -60) === false, 'mirando al piso de cerca, lo de lejos queda arriba del cuadro');
  ok(EM.seVeDesde(null, 0, 0, -10) === false && EM.seVeDesde(q, NaN, 0, -10) === false, 'sin pose o sin lugar, nada');
  // el director cuenta los cortes: un plano sin mezcla
  const d = ES.crearDirector({ mundo: { suelo: () => 0, posicion: () => ({ x: 0, z: 0 }), camaraJugador: () => ({ x: 0, y: 1.6, z: 5, yaw: 0, pitch: 0, fov: 60 }) } });
  d.registrar({ id: 'p-cortes', repetible: true, pasos: [
    { tipo: 'plano', plano: 'libre', pos: { x: 0, z: 9, y: 2 }, mira: { x: 0, z: 0 }, dur: 1 },
    { tipo: 'plano', plano: 'libre', pos: { x: 5, z: 9, y: 2 }, mira: { x: 0, z: 0 }, mezcla: 0.8, dur: 1 },
    { tipo: 'plano', plano: 'libre', pos: { x: -5, z: 9, y: 2 }, mira: { x: 0, z: 0 }, dur: 1 },
    { tipo: 'espera', dur: 1 } ] });
  ok(d.disparar('p-cortes') === true, 'la escena de los cortes arranca');
  const vistos = [];
  for (let i = 0; i < 120 && d.activa(); i++) { d.actualizar(1 / 30); vistos.push(d.cortes()); }
  ok(vistos[0] === 0 && Math.max(...vistos) === 1 && vistos.filter((k) => k === 1).length > 20, `el primer plano (que entra mezclado desde el jugador) y el de mezcla 0,8 no son cortes; el de mezcla 0 sí (${[...new Set(vistos)].join(' → ')})`);
}

// ---------------------------------------------------------------- 3. las llegadas, con el director y el mundo de escenas de verdad
const falso = () => new Proxy(function () {}, { get(_t, k) { if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } }; if (k === 'style' || k === 'dataset') return {}; if (k === 'children') return []; if (k === Symbol.iterator) return undefined; return () => falso(); }, set() { return true; } });
const docFalso = { head: falso(), body: falso(), createElement: () => falso(), pointerLockElement: null, getElementById: () => null, querySelector: () => null };
function llegadas(o = {}) {
  const col = crearColisiones();
  for (const t of o.troncos || []) col.agregar({ x: t.x, z: t.z, r: t.r });
  const mk = (clave, p) => ({ clave, pos: { x: p.x, y: 0, z: p.z, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, g: { rotation: { y: 0 }, visible: true }, rumbo: 0, cabeza: { rotation: { x: 0, y: 0, z: 0 }, position: { y: 1 } }, brazos: [], camino: [] });
  const ramon = mk('ramon', o.desde);
  const camara = { position: { x: 0, y: 1.6, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, z: 0, set(x, y) { this.x = x; this.y = y; } }, fov: 60, aspect: 16 / 9, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const progreso = { horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const fallos = [];
  const em = EM.crearEscenasMundo({
    doc: docFalso, gente: () => ({ gente: [ramon] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 30 }, yaw: 0, pitch: 0 }, soltar() {} }), camara,
    T: { altura: () => 0, agua: o.agua || (() => false), lugares: {} }, col, progreso: () => progreso, clima: () => null, sonido: {}, modo: () => 'jugando',
    ajustes: () => ({ fov: 60 }), alturaDePie: () => 0, nota() {}, fallo: (e) => fallos.push(e),
  });
  // (el plano entra con una mezcla cortita, como el primero de cualquier escena: no es un corte; la caminata empieza con la cámara ya puesta)
  const C = o.camara, pasos = [
    { tipo: 'plano', plano: 'libre', pos: { x: C.x, z: C.z, y: C.y ?? 1.6 }, mira: { x: C.mx, z: C.mz, y: C.my ?? 1 }, fov: 60, mezcla: 0.05, dur: 90, sinEsperar: true },
    { tipo: 'espera', dur: 0.2 },
    { tipo: 'gesto', quien: 'ramon', accion: 'caminar', a: { x: o.meta.x, z: o.meta.z }, vel: 1.4, sinEsperar: true },
    ...(o.despues || []),
    { tipo: 'espera', dur: o.espera ?? 40 } ];
  em.registrar({ id: 'p-llegada', repetible: true, pasos });
  const pose = () => ({ x: camara.position.x, y: camara.position.y, z: camara.position.z, yaw: camara.rotation.y, pitch: camara.rotation.x, fov: camara.fov });
  const t = { em, ramon, camara, col, fallos, saltos: [], f: 0, prev: { x: o.desde.x, z: o.desde.z }, camPrev: pose() };
  // un cuadro: el director y la cámara, la gente (si o.mover, el que camina avanza un poco hacia su meta) y lo de después; se anota cada salto de más de 0,6 m
  t.paso = (dt = 1 / 30) => {
    const cortesAntes = em.director.cortes ? em.director.cortes() : 0;
    em.actualizar(dt);
    if (o.mover && ramon.camino.length) { const m = ramon.camino[ramon.camino.length - 1], dx = m.x - ramon.pos.x, dz = m.z - ramon.pos.z, L = Math.hypot(dx, dz); if (L > 0.05) { const s = Math.min(L, o.mover * dt); ramon.pos.x += dx / L * s; ramon.pos.z += dz / L * s; } }
    em.despuesDeGente(dt);
    const p = { x: ramon.pos.x, z: ramon.pos.z }, q = pose();
    if (t.prev) {
      const d = Math.hypot(p.x - t.prev.x, p.z - t.prev.z);
      if (d > 0.6) {
        const antes = !!t.camPrev && EM.seVeDesde(t.camPrev, t.prev.x, 0, t.prev.z), ahora = EM.seVeDesde(q, p.x, 0, p.z);
        const corte = (em.director.cortes ? em.director.cortes() : 0) !== cortesAntes, negro = em.parpadeo() >= 0.9;
        t.saltos.push({ f: t.f, d, antes, ahora, corte, negro, aLaVista: (antes || ahora) && !corte && !negro });
      }
    }
    t.prev = p; t.camPrev = q; t.f++;
  };
  t.correr = (seg, dt = 1 / 30) => { for (let i = 0; i < seg / dt; i++) t.paso(dt); };
  t.dMeta = () => Math.hypot(ramon.pos.x - o.meta.x, ramon.pos.z - o.meta.z);
  t.empezar = () => em.disparar('p-llegada');
  return t;
}
if (va('llegadas')) {
  { // a) arranca a 300 m y la cámara mira para el otro lado: aparece a 34 m del lado de donde venía
    const t = llegadas({ desde: { x: 0, z: -300 }, meta: { x: 0, z: 0 }, camara: { x: 0, z: 20, mx: 0, mz: 40 } });
    ok(t.empezar() === true, 'la escena de la llegada arranca');
    t.correr(0.5);
    ok(Math.abs(t.dMeta() - 34) < 0.5 && t.ramon.pos.z < 0, `arranca lejos: aparece a 34 m del lado de donde venía (a ${t.dMeta().toFixed(1)} m)`);
    ok(t.saltos.length === 1 && !t.saltos[0].aLaVista, 'y el salto no se vio');
  }
  { // b) la cámara mira justo hacia ese lado: aparece a 34 m pero donde la cámara no ve
    const t = llegadas({ desde: { x: 0, z: -300 }, meta: { x: 0, z: 0 }, camara: { x: 0, z: 10, mx: 0, mz: -40 } });
    const pv = { x: 0, y: 1.6, z: 10, yaw: 0, pitch: Math.atan2(-0.6, 50), fov: 60 };
    ok(EM.seVeDesde(pv, 0, 0, -34), '(el lugar de siempre, del lado de donde venía, está a la vista)');
    t.empezar(); t.correr(0.5);
    ok(Math.abs(t.dMeta() - 34) < 0.5, `aparece a 34 m (${t.dMeta().toFixed(1)})`);
    ok(!EM.seVeDesde(pv, t.ramon.pos.x, 0, t.ramon.pos.z), `en un lugar que la cámara no ve (${t.ramon.pos.x.toFixed(1)}, ${t.ramon.pos.z.toFixed(1)})`);
    ok(t.saltos.every((s) => !s.aLaVista), 'ningún salto a la vista');
  }
  { // c) a 80 m y a la vista: sigue caminando; si a los 3 s la cámara lo sigue viendo, llega en un parpadeo
    const t = llegadas({ desde: { x: 0, z: -80 }, meta: { x: 0, z: 0 }, camara: { x: 0, z: 10, mx: 0, mz: -40 } });
    t.empezar(); t.correr(2.8);
    ok(Math.abs(t.ramon.pos.z + 80) < 1e-6 && t.saltos.length === 0, 'a la vista no salta: sigue donde estaba (la caminata sigue)');
    let maxNegro = 0;
    for (let i = 0; i < 30; i++) { t.paso(); maxNegro = Math.max(maxNegro, t.em.parpadeo()); }
    ok(maxNegro >= 0.99 && t.dMeta() < 35, `a los 3 s, un parpadeo a negro y llega (a ${t.dMeta().toFixed(1)} m de la meta)`);
    t.correr(1);
    ok(t.em.parpadeo() === 0, 'el parpadeo dura medio segundo y vuelve');
    t.correr(12);
    ok(t.saltos.length >= 1 && t.saltos.every((s) => !s.aLaVista), `todos los saltos con la pantalla tapada o fuera de cuadro (${t.saltos.map((s) => `${s.d.toFixed(1)} m${s.negro ? ' en negro' : ''}${s.corte ? ' en un corte' : ''}`).join(', ')})`);
  }
  { // d) trabado fuera de cuadro (ni él ni la meta a la vista): llega de golpe, sin parpadeo
    const t = llegadas({ desde: { x: 0, z: 10 }, meta: { x: 0, z: 20 }, camara: { x: 0, z: 0, mx: 0, mz: -40 } });
    t.empezar();
    let maxNegro = 0;
    for (let i = 0; i < 6 * 30; i++) { t.paso(); maxNegro = Math.max(maxNegro, t.em.parpadeo()); }
    ok(t.dMeta() < 0.3 && maxNegro === 0, `trabado fuera de cuadro: llega a la meta sin parpadeo (a ${t.dMeta().toFixed(2)} m)`);
  }
  { // e) trabado a la vista y después un corte (plano sin mezcla desde otro ángulo, que también lo ve a él y a la meta): llega en el corte, sin parpadeo
    const t = llegadas({ desde: { x: 0, z: -10 }, meta: { x: 0, z: -14 }, camara: { x: 0, z: 0, mx: 0, mz: -40 },
      despues: [{ tipo: 'espera', dur: 5.5 }, { tipo: 'plano', plano: 'libre', pos: { x: 8, z: -4, y: 1.6 }, mira: { x: 0, z: -12, y: 1 }, fov: 60, mezcla: 0, dur: 30, sinEsperar: true }] });
    t.empezar(); t.correr(5);
    ok(EM.seVeDesde({ x: 8, y: 1.6, z: -4, yaw: Math.atan2(8, 8), pitch: 0, fov: 60 }, 0, 0, -10) && EM.seVeDesde({ x: 8, y: 1.6, z: -4, yaw: Math.atan2(8, 8), pitch: 0, fov: 60 }, 0, 0, -14), '(el plano después del corte también lo ve a él y a la meta)');
    ok(Math.abs(t.ramon.pos.z + 10) < 1e-6, 'trabado a la vista: a los 5 s sigue donde estaba (no salta a la meta)');
    let maxNegro = 0;
    for (let i = 0; i < 30; i++) { t.paso(); maxNegro = Math.max(maxNegro, t.em.parpadeo()); }
    ok(t.dMeta() < 0.3 && maxNegro === 0 && t.saltos.length === 1 && t.saltos[0].corte, `llega en el corte, sin parpadeo (${JSON.stringify(t.saltos.map((s) => ({ d: +s.d.toFixed(1), corte: s.corte, negro: s.negro })))})`);
  }
  { // f) trabado a la vista sin corte: a los 3 s, un parpadeo
    const t = llegadas({ desde: { x: 0, z: -10 }, meta: { x: 0, z: -14 }, camara: { x: 0, z: 0, mx: 0, mz: -40 } });
    t.empezar(); t.correr(10);
    ok(t.dMeta() < 0.3 && t.saltos.length === 1 && t.saltos[0].negro && !t.saltos[0].aLaVista, `trabado a la vista sin corte: llega en un parpadeo (${JSON.stringify(t.saltos.map((s) => ({ d: +s.d.toFixed(1), negro: s.negro })))})`);
  }
  { // g) Esc: de golpe, como siempre (salta todo junto)
    const t = llegadas({ desde: { x: 0, z: -10 }, meta: { x: 0, z: -14 }, camara: { x: 0, z: 0, mx: 0, mz: -40 } });
    t.empezar(); t.correr(0.5);
    t.em.saltar(); t.paso();
    ok(t.dMeta() < 0.3, `al saltar la escena (Esc) llega de golpe (a ${t.dMeta().toFixed(2)} m)`);
  }
  { // h) el límite de tiempo del director con el que camina a la vista: no lo planta en la meta a la vista; llega en un parpadeo
    const t = llegadas({ desde: { x: 0, z: -10 }, meta: { x: 0, z: -14 }, camara: { x: 0, z: 0, mx: 0, mz: -40 }, mover: 0.14 });
    t.empezar();
    const limite = 4 / 1.4 * 1.8 + 6;   // (el del director: largo / vel × 1,8 + 6 s)
    t.correr(limite + 0.2);
    ok(t.dMeta() > 1 && t.saltos.length === 0, `al pasar el límite de la caminata (${limite.toFixed(1)} s) no salta a la vista (falta ${t.dMeta().toFixed(2)} m)`);
    t.correr(4);
    ok(t.dMeta() < 0.3 && t.saltos.length === 1 && t.saltos[0].negro, 'y llega en un parpadeo');
  }
  { // majada-fermin (Fermín, 15 m): lo que se ve en la pantalla es lo que se decide: el velo de las escenas sigue al parpadeo (sin eso, el parpadeo llega pero se ve el salto)
    ok(leer('escenas-mundo.js').includes('Math.max(d.fundido, nivelParpadeo())'), 'el velo de la pantalla toma el mayor entre el fundido y el parpadeo');
    ok(leer('historia-escenas-acto3-c9.js').includes("camina('fermin', FRENTE(22, -4), { vel: 2 })"), 'majada-fermin: Fermín camina 15 m (el que corre el parpadeo si la cámara lo sigue viendo)');
  }
  { // i) el despeje de la lente (un tronco entre la cámara y lo que mira la acerca varios metros) no es un corte: el límite del director tampoco lo planta a la vista
    const t = llegadas({ desde: { x: 1, z: -2 }, meta: { x: 1.5, z: -6 }, camara: { x: 0, z: 12, mx: 0, mz: -2 }, troncos: [{ x: 0, z: 6, r: 0.8 }], mover: 0.14 });
    t.empezar(); t.correr(0.3);
    ok(t.camara.position.z < 7, `(el tronco acerca la lente: está a z ${t.camara.position.z.toFixed(1)} en vez de 12)`);
    const limite = Math.hypot(0.5, 4) / 1.4 * 1.8 + 6;
    t.correr(limite);
    ok(t.dMeta() > 1 && t.saltos.length === 0, `con la lente acercada, el límite de la caminata no lo planta a la vista (falta ${t.dMeta().toFixed(2)} m)`);
  }
  { // j) termina la escena con alguien esperando a la vista: queda donde está (no salta a la meta delante tuyo)
    const t = llegadas({ desde: { x: 0, z: -10 }, meta: { x: 0, z: -14 }, camara: { x: 0, z: 0, mx: 0, mz: -40 }, espera: 4.5 });
    t.empezar(); t.correr(4.4);
    t.correr(2);
    ok(!t.em.activa() || t.em.director.fase() === 'saliendo', '(la escena terminó)');
    ok(Math.abs(t.ramon.pos.z + 10) < 1e-6 && t.saltos.length === 0, `al terminar la escena con la caminata trabada a la vista, queda donde estaba (z ${t.ramon.pos.z.toFixed(2)})`);
  }
  { // k) la meta de una caminata que cayó en el agua igual: los lugares a 34 m sobre el agua se saltean
    const t = llegadas({ desde: { x: 0, z: -300 }, meta: { x: 0, z: 0 }, camara: { x: 0, z: 20, mx: 0, mz: 40 }, agua: (x, z) => z < -20 });
    t.empezar(); t.correr(0.5);
    ok(t.ramon.pos.z >= -20 && Math.abs(t.dMeta() - 34) < 0.5, `a 34 m pero en seco (${t.ramon.pos.x.toFixed(1)}, ${t.ramon.pos.z.toFixed(1)})`);
  }
}

// ---------------------------------------------------------------- 3b. la lente con el foco adentro de un sólido (los tres peores planos de la 4.25.1)
if (va('lente')) {
  const lente = (solidos, pos, mira) => {
    const col = crearColisiones();
    for (const s of solidos) col.agregar(s);
    const camara = { position: { x: 0, y: 1.6, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, z: 0, set(x, y) { this.x = x; this.y = y; } }, fov: 60, aspect: 16 / 9, updateProjectionMatrix() {}, updateMatrixWorld() {} };
    const em = EM.crearEscenasMundo({ doc: docFalso, gente: () => ({ gente: [] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 30 }, yaw: 0, pitch: 0 }, soltar() {} }), camara, T: { altura: () => 0, agua: () => false, lugares: {} }, col,
      progreso: () => ({ horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } }), clima: () => null, sonido: {}, modo: () => 'jugando', ajustes: () => ({ fov: 60 }), alturaDePie: () => 0, nota() {}, fallo() {} });
    em.registrar({ id: 'p-lente', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos, mira, fov: 50, mezcla: 0, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
    em.disparar('p-lente');
    for (let i = 0; i < 60; i++) em.actualizar(1 / 30);
    return camara.position;
  };
  { // el foco adentro de una roca grande (radio 2): la lente del guion, a 7 m y libre, se queda donde está (antes iba a 1,3 m, adentro de la roca, y salía de costado pegada a ella)
    const p = lente([{ x: 0, z: 0, r: 2 }], { x: 0, z: 7, y: 1.6 }, { x: 0, z: 0, y: 1.4 });
    ok(Math.abs(p.z - 7) < 0.05 && Math.abs(p.x) < 0.05, `con el foco adentro de una roca, la lente queda donde la puso el plano (${p.x.toFixed(2)}, ${p.z.toFixed(2)}; antes, pegada a la roca)`);
  }
  { // el foco adentro de la roca y una pared entre la roca y la lente: la pared sí cuenta
    const p = lente([{ x: 0, z: 0, r: 2 }, { seg: true, ax: -4, az: 4.5, bx: 4, bz: 4.5, r: 0.16, alturaMin: 0, alturaMax: 3 }], { x: 0, z: 8, y: 1.6 }, { x: 0, z: 0, y: 1.4 });
    ok(p.z < 4.3 && p.z > 2, `y si después de la roca hay una pared en el medio, la lente se pone antes de la pared (z ${p.z.toFixed(2)})`);
  }
  { // el foco libre y una pared en el medio: como siempre, la lente se pone antes de la pared
    const p = lente([{ seg: true, ax: -4, az: 3, bx: 4, bz: 3, r: 0.16, alturaMin: 0, alturaMax: 3 }], { x: 0, z: 7, y: 1.6 }, { x: 0, z: 0, y: 1.4 });
    ok(p.z < 3 - 0.2 && p.z >= 1.29, `con el foco libre, una pared en el medio acerca la lente como siempre (z ${p.z.toFixed(2)})`);
  }
}

// ---------------------------------------------------------------- 4. la silueta del anochecer
const IDS = H.CAPITULOS.map((c) => c.id);
function presencia(capId, o = {}) {
  const { P } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(capId);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: 'jugando', empezada: 1 });
  P.horas = 19; P.dia = 5; h.base = { dia: 5 };
  const pedidos = [], intentos = [];
  const dh = { listo: () => true, aparecer: (tipo, p) => { pedidos.push({ tipo, ...p }); return { estado: 'mirando', posicion: { x: p.x, z: p.z }, huir() { this.estado = 'fuera'; }, reir() {}, saludar() {}, quitar() { this.estado = 'fuera'; } }; }, reir() {} };
  let t = 0;
  const buscas = [];   // (los instantes en que la silueta buscó lugar)
  const ctx = {
    dh, escena: { add() {}, remove() {} }, historia: () => h, jugador: () => ({ x: 0, z: 0 }), rumbo: () => { intentos.push(t); return o.rumbo ? o.rumbo() : 0.7; }, altura: () => 0, hora: () => 19, dia: () => 5, libre: () => true,
    enTierra: () => { if (buscas[buscas.length - 1] !== t) buscas.push(t); return true; }, cercaDeArbol: (x, z, r = 2.4) => (o.cerca ? o.cerca(x, z, r) : true), refugio: () => ({ x: 0, z: 0 }), galpon: () => null, cobrar() {}, nota() {}, guardar() {},
    azar: rng(o.semilla || 7), indicio() {}, despejada: o.despejada || (() => true),
  };
  const p = PR.crearPresencia(ctx);
  return { p, pedidos, intentos, buscas, correr: (seg) => { for (let i = 0; i < seg / 0.2; i++) { t += 0.2; p.actualizar(0.2); } } };
}
if (va('silueta')) {
  const S = PR.SILUETA_SUAVE, A = PR.SILUETA_AMPLIA;
  ok(A && A.dist[0] > PR.TIEMPOS.huyeSinTrato + 0.5 && A.dist[1] <= 30 && A.abanico <= 0.95 && A.cerca > 2.4 && A.cerca <= 5 && A.reintento <= 3, 'la segunda vuelta: sin entrar al umbral de huida, a la vista, con el árbol un poco más lejos (el borde del bosque) y reintentando enseguida');
  { // el árbol pegado (2,4 m) no está en ningún lado, pero sí a 4,5 m (el borde del bosque): aparece igual, por la segunda vuelta
    const t = presencia('bolsa', { cerca: (x, z, r) => r >= 4.5 });
    t.correr(60);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z), ang = q && Math.atan2(q.x, q.z);
    ok(!!q, 'sin árbol pegado pero con el borde del bosque cerca: aparece una silueta');
    if (q) ok(d >= A.dist[0] - 1e-6 && d <= A.dist[1] + 1e-6 && Math.abs(ang - 0.7) <= A.abanico + 1e-6, `a ${d.toFixed(1)} m, dentro del abanico de la vista`);
    if (q) ok(q.escala === S.escala && q.pisoNoche === S.pisoNoche, 'con la escala y los ojos de la primera hora');
  }
  { // con un árbol pegado (la regla de siempre) la primera vuelta alcanza: entre 18 y 24 m
    const t = presencia('bolsa');
    t.correr(60);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z);
    ok(!!q && d >= S.dist[0] - 1e-6 && d <= S.dist[1] + 1e-6, `con lugar en la primera vuelta, a ${d && d.toFixed(1)} m (la de siempre)`);
  }
  { // el bosque cerrado (ningún lugar despejado): nunca aparece adentro; mirando para el mismo lado deja de insistir (una búsqueda cada DESCANSO s, no cada 2,5)
    const t = presencia('mesa', { despejada: () => false });
    t.correr(70);
    const b0 = t.buscas[0], resto = t.buscas.filter((x) => x > b0 && x <= b0 + 40);
    ok(t.pedidos.length === 0, 'en el bosque cerrado no aparece nunca (siempre despejada: sin tronco pegado ni en la línea)');
    ok(A.descanso >= 10 && resto.length >= 1 && resto.length <= 3, `mirando al mismo rumbo sin lugar deja de intentar (${resto.length} búsquedas en los 40 s siguientes; antes, 16), pero no para siempre`);
  }
  { // si girás la vista, el rumbo nuevo se busca enseguida
    let yaw = 0.7;
    const t = presencia('mesa', { despejada: (x, z) => Math.atan2(x, z) > 1.7, rumbo: () => yaw });
    for (let i = 0; i < 300 && !t.buscas.length; i++) t.correr(0.2);   // (hasta la primera búsqueda, que no encuentra)
    t.correr(0.4);
    const antes = t.buscas.length;
    yaw = 2.5;
    t.correr(4);
    ok(antes >= 1 && t.pedidos.length === 1 && t.buscas.length > antes, `al girar la vista vuelve a buscar enseguida y encuentra lugar (${t.buscas.length - antes} búsquedas en 5 s)`);
  }
  { // más lejos: donde nada de 17 a 32 m está despejado (el monte tapa), la cuarta vuelta busca de 30 a 46 m
    const t = presencia('ramal', { cerca: () => false, despejada: (x, z) => Math.hypot(x, z) > 33 });
    t.correr(60);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z);
    ok(!!q && d > 33 && d <= A.lejos[1] + 1e-6, `si de cerca no hay lugar, aparece más lejos (a ${d && d.toFixed(1)} m)`);
  }
  { // sin árboles en ningún lado (campo abierto: la estepa, el lado del lago): la tercera vuelta, en el campo, despejada y a la vista
    const t = presencia('ramal', { cerca: () => false });
    t.correr(60);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z), ang = q && Math.atan2(q.x, q.z);
    ok(!!q && d >= A.campo[0] - 1e-6 && d <= A.campo[1] + 1e-6 && Math.abs(ang - 0.7) <= A.abanico + 1e-6, `en campo abierto aparece igual (a ${d && d.toFixed(1)} m, en el abanico de la vista)`);
    const u = presencia('ramal', { cerca: () => false, despejada: () => false });
    u.correr(60);
    ok(u.pedidos.length === 0, 'y si nada está despejado, tampoco en el campo');
  }
  { // con el borde del bosque de un solo lado, la silueta va ahí (entre los árboles antes que en el campo), con cualquier semilla
    let bien = 0;
    for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const t = presencia('bolsa', { semilla, cerca: (x, z, r) => r >= 4.5 && x > z * Math.tan(0.7) });
      t.correr(40);
      const q = t.pedidos[0];
      if (q && q.x > q.z * Math.tan(0.7)) bien++;
    }
    ok(bien === 8, `si hay borde de bosque en el abanico, la silueta va ahí y no al campo (${bien} de 8 semillas)`);
  }
  { // la de los capítulos 5 a 8 no cambia: sin segunda vuelta, reintenta a los 8 s
    const t = presencia('perdido', { cerca: (x, z, r) => r >= 4.5 });
    t.correr(70);
    const i0 = t.intentos[0], resto = t.intentos.filter((x) => x > i0 && x <= i0 + 20);
    ok(t.pedidos.length === 0 && resto.length <= 3, `la de los capítulos 5 a 8 sigue con sus reglas (sin segunda vuelta; ${resto.length} intentos en 20 s)`);
  }
  // main.js: cercaDeArbol mira el radio que le piden (la segunda vuelta usa 4,5 m)
  const main = leer('main.js');
  const linea = main.split('\n').find((l) => l.trimStart().startsWith('cercaDeArbol: '));
  ok(!!linea, 'main.js arma cercaDeArbol');
  if (linea) {
    const cod = linea.trimStart().slice('cercaDeArbol: '.length).replace(/,\s*\/\/.*$/, '').replace(/,\s*$/, '');
    const col = { resolver(p, r) { const d = Math.hypot(p.x, p.z); if (d < r + 0.5) { const k = (r + 0.5) / Math.max(d, 1e-6); p.x *= k; p.z *= k; } } };
    const fn = new Function('p', 'alt', 'col', `return (${cod});`)({ set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, () => 0, col);
    ok(fn(4, 0) === false && fn(4, 0, 4.5) === true && fn(2, 0) === true, 'main.js: cercaDeArbol(x, z) mira 2,4 m y cercaDeArbol(x, z, 4,5) mira 4,5 m');
  }
  // main.js: la línea de vista de la silueta se mira cada metro: una pared fina (la de la estación) a 9 m, entre dos muestras de 2 m, tapa
  const lineaD = main.split('\n').find((l) => l.trimStart().startsWith('despejada: '));
  ok(!!lineaD, 'main.js arma despejada');
  if (lineaD) {
    const cod = lineaD.trimStart().slice('despejada: '.length).replace(/,\s*\/\/.*$/, '').replace(/,\s*$/, '');
    const pared = { resolver(p, r) { if (Math.abs(p.x) < 5 && Math.abs(p.z - 9) < r + 0.16) p.z = 9 + Math.sign(p.z - 9 || 1) * (r + 0.17); } };
    const jugador = { estado: { pos: { x: 0, z: 0 } } };
    const fn = new Function('p', 'alt', 'col', 'jugador', `return (${cod});`)({ set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, () => 0, pared, jugador);
    ok(fn(0, 20) === false && fn(12, 20) === true, 'main.js: una pared fina en la línea tapa a la silueta (antes se colaba entre las muestras de 2 m); fuera de la línea, no');
  }
}

// ---------------------------------------------------------------- 5. el tocón del coihue grande
if (va('tocon')) {
  const talados = [{ i: 3, dia: 1 }, { i: 7, dia: 2 }, { i: 9, dia: 20 }];
  const sin = resumenBosque(talados, 20);
  ok(sin.rebrotando === 3 && sin.listos === 2, 'sin tocón quieto, el resumen de siempre');
  const con = resumenBosque(talados, 20, (i) => i === 7);
  ok(con.rebrotando === 2 && con.listos === 1, `el tocón que no rebrota no cuenta (${con.rebrotando} rebrotando, ${con.listos} listos)`);
  ok(resumenBosque([{ i: 7, dia: 1 }], 20, (i) => i === 7).rebrotando === 0, 'sólo el coihue talado: ningún tocón rebrotando');
  const main = leer('main.js');
  ok(enUnaLinea(main, ['const bosque = resumenBosque(talados(), progreso.dia, toconQuietoDeHistoria())']), 'la pausa le pasa el tocón quieto al resumen del bosque');
  const h = { activa: true, decisiones: { coihue: 'b' }, temas: { 'mundo:coihue-talado': 3 } };
  ok(coihueQuedaTocon(h) === true, '(D2 = b y el coihue talado: queda tocón)');
  const quieto = (hh, i) => funcion(main, 'toconQuietoDeHistoria', { progreso: { historia: hh }, coihueQuedaTocon, indiceCoihueDeHistoria: () => i })();
  const q = quieto(h, 12);
  ok(typeof q === 'function' && q(12) === true && q(11) === false, 'main.js: con el coihue talado, el tocón quieto es el del coihue grande');
  ok(quieto({ ...h, decisiones: { coihue: 'a' } }, 12) === null && quieto(h, -1) === null, 'y sin coihue talado (o sin el árbol) no hay tocón quieto');
}

// ---------------------------------------------------------------- 6. el plano de cerca de Elsa en el andén
if (va('elsa')) {
  const trochita = leer('trochita.js');
  const W = Number((trochita.match(/const W = chica \? [\d.]+ : ([\d.]+)/) || [])[1]);
  const extra = Number((trochita.match(/const alero = new THREE\.Mesh\(new THREE\.BoxGeometry\(W \+ ([\d.]+), 0\.16, anchoAlero\)/) || [])[1]);
  const largo = Number((trochita.match(/const largoAnden = chica \? [\d.]+ : ([\d.]+)/) || [])[1]);
  ok(W > 0 && extra > 0 && largo > 0, `los números del galpón y del alero salen de trochita.js (galpón ${W} m, alero ${W + extra} m, andén ${largo} m)`);
  const mitadAlero = (W + extra) / 2;
  const e = ESC['elsa-anden'];
  const ap = e.pasos.find((p) => p.tipo === 'gesto' && p.accion === 'aparecer' && p.quien === 'elsa');
  const A = ap && ap.a;
  ok(!!A && Math.abs(A.lx) >= mitadAlero + 0.6 && Math.abs(A.lx) <= largo / 2 - 0.8, `Elsa está pasado el alero (lx ${A && A.lx}, el alero llega a ${mitadAlero}) y sobre el andén (hasta ${largo / 2})`);
  ok(!!A && A.lz > -2.95 + 0.9 && A.lz < 0.25, 'entre el filo del andén y el frente del galpón');
  const libres = e.pasos.filter((p) => p.tipo === 'plano' && p.plano === 'libre');
  const cerca = libres[libres.length - 1];
  ok(cerca && !cerca.posFin && cerca.mira?.ref === 'elsa', 'el plano de cerca es un libre sin posFin que mira a Elsa');
  const mundo = { posicion: (r) => (r === 'elsa' ? { x: 10, z: 10, y: 0.6 } : { x: 0, z: 0 }), suelo: () => 0 };
  const f = ES.compilarPlano(cerca, { mundo, base: null });
  const ys = [0, 0.5, 1].map((u) => f(u).y);
  ok(ys.every((y) => Math.abs(y - cerca.pos.dy) < 1e-9), `y la lente se queda a la altura de los ojos (${ys.map((y) => y.toFixed(2)).join(', ')})`);
  // del otro lado de la vía, con Elsa adelante y el cartel de la estación (6,4; 2,2) a un costado: no detrás de la cabeza
  const C = cerca.pos, ver = (P) => Math.atan2(P.lx - C.lx, P.lz - C.lz);
  const gradosAlCartel = Math.abs(ver({ lx: 6.4, lz: 2.2 }) - ver(A)) * 180 / Math.PI;
  ok(C.lz < -4.45 && gradosAlCartel > 6, `la cámara del otro lado de la vía y el cartel a ${gradosAlCartel.toFixed(0)}° de Elsa (no le tapa la cara)`);
}

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['escenas.js', "const y0 = a.y + dyPos, y1 = p.posFin ? a2.y + dyFin : y0;", "const y0 = a.y + dyPos, y1 = a2.y + (p.posFin ? dyFin : 0);", 'sin posFin la lente baja al piso', 'motor,elsa'],
  ['escenas.js', "const dyFin = p.posFin ? dyDe(p.posFin, objeto(p.pos) && typeof p.pos.ref === 'string' ? num(p.pos.dy) : dyPos) : 0;", "const dyFin = p.posFin ? dyDe(p.posFin, 0) : 0;", 'un posFin sin dy termina en el piso', 'motor'],
  ['escenas.js', "typeof r.ref === 'string' ? (r.dy !== undefined ? 0 : def)", "typeof r.ref === 'string' ? (r.dy !== undefined ? num(r.dy) : def)", 'en { ref, dy } el dy se suma dos veces', 'motor'],
  ['escenas.js', "    if (mezcla === 0) cam.cortes = num(cam.cortes, 0) + 1;", "", 'el director no cuenta los cortes', 'vista,llegadas'],
  ['escenas-mundo.js', "      let libreYa = !(Math.hypot(bola.x - f.x, bola.z - f.z) > 0.02);", "      let libreYa = true;", 'el sólido que tiene al foco adentro tira la lente a 1,3 m (y queda pegada a él)', 'lente'],
  ['escenas-mundo.js', "  if (Math.hypot(vx, vy, vz) > V.lejos) return false;", "", 'lo muy lejano cuenta como visto', 'vista'],
  ['escenas-mundo.js', "      if (v.seVe(x, num(ctx.T?.altura?.(x, z), n.pos.y), z)) continue;", "", 'el lugar a 34 m puede caer a la vista', 'llegadas'],
  ['escenas-mundo.js', "    if (v.seVe(n.pos.x, n.pos.y, n.pos.z)) { esperar(); return; }", "", 'el de lejos salta aunque la cámara lo vea', 'llegadas'],
  ['escenas-mundo.js', "    llegarSinQueSeVea(c, { x: p.x, z: p.z }, null);   // (4.26.1 B: de golpe sólo donde la cámara no mira)", "    ubicar(n, { x: p.x, z: p.z }, null);", 'la caminata trabada llega de golpe a la vista', 'llegadas'],
  ['escenas-mundo.js', "      if (director.corriendo() && !director.saltando() && Math.hypot(c.n.pos.x - p.x, c.n.pos.z - p.z) > 0.6) { llegarSinQueSeVea(c, p, mira); return; }", "", 'el límite del director lo planta a la vista', 'llegadas'],
  ['escenas-mundo.js', "      if (director.corriendo() && !director.saltando() && Math.hypot", "      if (director.corriendo() && Math.hypot", 'al saltar la escena tampoco llega', 'llegadas'],
  ['escenas-mundo.js', "      else if ((p.visto += dt) >= ESPERA_CORTE && !p.parpadeo) p.parpadeo = pedirParpadeo(", "      else if ((p.visto += dt) >= 1e9 && !p.parpadeo) p.parpadeo = pedirParpadeo(", 'el trabado a la vista no llega nunca (sin parpadeo)', 'llegadas'],
  ['escenas-mundo.js', "    return p.t < B.baja ? p.t / B.baja : p.t < B.baja + B.queda ? 1 : Math.max(0, 1 - (p.t - B.baja - B.queda) / B.sube);", "    return 0;", 'el parpadeo no tapa', 'llegadas'],
  ['escenas-mundo.js', "    if (enDirector ? cortesDelDirector() !== cortesVistos : corteCuadro) return NADA_A_LA_VISTA;", "    if (enDirector ? !!(poseVista && director.camara() && Math.hypot(director.camara().x - poseVista.x, director.camara().z - poseVista.z) > 1.2) : corteCuadro) return NADA_A_LA_VISTA;", 'el despeje de la lente cuenta como corte', 'llegadas'],
  ['escenas-mundo.js', "    if (enDirector ? cortesDelDirector() !== cortesVistos : corteCuadro) return NADA_A_LA_VISTA;", "", 'un corte no deja acomodar a nadie', 'llegadas'],
  ['escenas-mundo.js', "Math.max(d.fundido, nivelParpadeo())", "d.fundido", 'el velo de la pantalla no sigue al parpadeo (Fermín salta a la vista)', 'llegadas'],
  ['historia-presencia.js', "    for (const vuelta of ['borde', 'campo', 'lejos']) {", "    for (const vuelta of ['campo', 'lejos']) {", 'sin la segunda vuelta (el borde del bosque)', 'silueta'],
  ['historia-presencia.js', "    for (const vuelta of ['borde', 'campo', 'lejos']) {", "    for (const vuelta of ['borde', 'lejos']) {", 'sin la tercera vuelta (el campo abierto)', 'silueta'],
  ['historia-presencia.js', "        if (ctx.despejada && !ctx.despejada(p.x, p.z)) continue;\n        const alto", "        const alto", 'la segunda y la tercera vuelta se meten en el bosque cerrado', 'silueta'],
  ['historia-presencia.js', "    for (const vuelta of ['borde', 'campo', 'lejos']) {", "    for (const vuelta of ['borde', 'campo']) {", 'sin la cuarta vuelta (más lejos)', 'silueta'],
  ['historia-presencia.js', "        if (Math.abs(g) < SILUETA_AMPLIA.giro && sinLugar.t < SILUETA_AMPLIA.descanso) { espera = SILUETA_AMPLIA.reintento; return; }", "", 'el rumbo sin lugar se busca siempre', 'silueta'],
  ['historia-presencia.js', "Math.abs(g) < SILUETA_AMPLIA.giro && sinLugar.t", "sinLugar.t", 'girar la vista no vuelve a buscar', 'silueta'],
  ['historia-presencia.js', "      if (suave && !sil) espera = SILUETA_AMPLIA.reintento;", "", 'la primera hora reintenta a los 8 s', 'silueta'],
  ['historia-presencia.js', "!ctx.cercaDeArbol(p.x, p.z, A.cerca))) continue;", "!ctx.cercaDeArbol(p.x, p.z))) continue;", 'la segunda vuelta pide el árbol pegado', 'silueta'],
  ['main.js', "n = Math.max(2, Math.ceil(Math.hypot(dx, dz))); for", "n = Math.max(2, Math.ceil(Math.hypot(dx, dz) / 2)); for", 'la línea de vista de la silueta otra vez cada 2 m', 'silueta'],
  ['main.js', "try { col.resolver(p, r, 1.0); } catch { return false; } return Math.hypot(p.x - x, p.z - z) > 0.05; },   // (4.26.1", "try { col.resolver(p, 2.4, 1.0); } catch { return false; } return Math.hypot(p.x - x, p.z - z) > 0.05; },   // (4.26.1", 'cercaDeArbol no mira el radio', 'silueta'],
  ['bosque.js', "  const vivos = typeof quieto === 'function' ? talados.filter((t) => quieto(t.i) !== true) : talados;", "  const vivos = talados;", 'el tocón quieto cuenta igual', 'tocon'],
  ['main.js', "const bosque = resumenBosque(talados(), progreso.dia, toconQuietoDeHistoria());", "const bosque = resumenBosque(talados(), progreso.dia);", 'la pausa no pasa el tocón quieto', 'tocon'],
  ['main.js', "  return i >= 0 ? (k) => k === i : null;", "  return null;", 'el tocón quieto nunca se reconoce', 'tocon'],
  ['historia-escenas-acto1.js', "const ELSA_ANDEN = { lugar: 'estacion', lx: 7.0, lz: -0.9 };", "const ELSA_ANDEN = { lugar: 'estacion', lx: 1.7, lz: -0.4 };", 'Elsa otra vez bajo el alero', 'elsa'],
  ['historia-escenas-acto1.js', "pos: { lugar: 'estacion', lx: 5.6, lz: -5.4, dy: 1.7 }", "pos: { lugar: 'estacion', lx: 7.8, lz: -5.6, dy: 1.7 }", 'el cartel detrás de la cabeza de Elsa', 'elsa'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4261b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = readFileSync(join(raiz, 'src', arch), 'utf8');
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4261B_HIJO: '1', A4261B_CALLADO: '1', A4261B_SECCIONES: secc }, encoding: 'utf8', timeout: 180000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (HIJO) process.exit(fallas ? 1 : 0);
console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.26.1 (B) cinemáticas y la Historia · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
