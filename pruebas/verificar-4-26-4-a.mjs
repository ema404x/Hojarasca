// 4.26.4 (A): cinemáticas.
//   1. El encuentro del galpón (`galpon-encuentro`): los planos miran al grupo de duendes (su centro, o el Mandamás en los de cerca) donde de verdad están, con la cámara del lado
//      del jugador, ENTRE él y el grupo (`entre: true`: nunca más allá del jugador). `mundo.posicion({ grupo })` (escenas-mundo.js de verdad) resuelve el centro o el Mandamás de lo que
//      dice `ctx.grupoDuendes` (main.js: los duendes vivos de la escena), con un corrimiento `lado`; sin grupo todavía, el punto de siempre adelante tuyo.
//   2. La silueta del anochecer (historia-presencia.js): una quinta vuelta, sólo si las cuatro no dieron lugar: de 12 a 24 m, en el abanico de la vista, en un punto sin tronco
//      a menos de 1,2 m (`ctx.sinTronco`), sin exigir la línea limpia.
// Cada mutación es una copia de src/ con otro nombre, corre en su propio proceso (la caché de ESM sólo mide la primera) y tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-4-a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();   // (historia-presencia.js usa three; las copias de las mutaciones no traen node_modules)

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4264_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);
const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);

function rng(semilla) { let s = semilla >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

async function comprobar() {
  const { crearEscenasMundo } = await imp('escenas-mundo.js');
  const ES = await imp('escenas.js');
  const PR = await imp('historia-presencia.js');
  const { ESCENAS_C10 } = await imp('historia-escenas-acto3-c10.js');
  const fuente = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  const okc = (v, nombre) => ok(nombre, v);   // (en la parte de la silueta: la condición primero)
  const cerca = (p, q, e = 1e-6) => !!p && Math.hypot(p.x - q.x, p.z - q.z) < e;

  // ---- 1a. mundo.posicion({ grupo })
  let grupo = null;
  const js = { pos: { x: 0, y: 0, z: 0 }, yaw: 0 };   // yaw 0 mira hacia -z
  const pedidos = [];
  const ctx = {
    jugador: () => ({ estado: js }), col: { resolver() {} }, T: { altura: () => 0, agua: () => false, lugares: {} }, progreso: () => ({ horas: 12 }), camara: { position: { x: 0, y: 1.6, z: 0 }, rotation: { x: 0, y: 0 } },
    alturaDePie: () => 0, fallo(e) { throw e; },
    grupoDuendes: (que) => { pedidos.push(que); return grupo; },
  };
  const EM = crearEscenasMundo(ctx);
  const pos = (r) => EM.mundo.posicion(r);
  grupo = { x: 3, z: -9 };
  ok('{ grupo: centro } es el centro que da el juego', cerca(pos({ grupo: 'centro' }), { x: 3, z: -9 }));
  ok('el juego recibe qué se pide (centro o jefe)', (pos({ grupo: 'jefe' }), pedidos.includes('centro') && pedidos.includes('jefe')));
  const l = pos({ grupo: 'centro', lado: 4 });
  const dx = 3, dz = -9, L = Math.hypot(dx, dz);
  ok('con `lado` se corre de costado, perpendicular a la línea jugador-grupo', cerca(l, { x: 3 + (-dz / L) * 4, z: -9 + (dx / L) * 4 }) && Math.abs((l.x - 3) * dx + (l.z + 9) * dz) < 1e-9);
  grupo = null;
  ok('sin grupo todavía: el punto de siempre adelante tuyo (6,5 m)', cerca(pos({ grupo: 'centro' }), pos({ frente: 'jugador', dist: 6.5 })) && cerca(pos({ grupo: 'centro' }), { x: 0, z: -6.5 }));
  grupo = { x: NaN, z: 1 };
  ok('un centro que no es número: también el de siempre', cerca(pos({ grupo: 'centro' }), { x: 0, z: -6.5 }));

  // ---- 1b. la cámara: `entre`
  const mundo = { posicion: (r) => (r === 'jugador' ? { x: 0, z: 0, y: 0 } : r && r.x !== undefined ? r : null), suelo: () => 0 };
  const A = { x: 0, z: -6 };
  const camaraDe = (o) => ES.compilarPlano({ tipo: 'plano', plano: 'general', a: A, desde: 'jugador', dist: 10, alto: 2.6, ...o }, { mundo, base: { x: 0, z: 0, yaw: 0 } })(0.5);
  const sin = camaraDe({}), con = camaraDe({ entre: true });
  ok('sin `entre`: con dist 10 la lente queda DETRÁS del jugador (z > 0)', sin.z > 3.9);
  ok('con `entre`: la lente queda entre el jugador y el grupo (z entre -6 y 0, del lado del jugador)', con.z < 0 && con.z > -6 && Math.abs(con.z - (-6 + 6 * 0.7)) < 1e-6);
  ok('con `entre` mira al grupo (el foco es el ancla)', Math.abs(con.foco.x - A.x) < 1e-9 && Math.abs(con.foco.z - A.z) < 1e-9);
  ok('con `entre` y un grupo muy cerca (1 m): nunca a menos de 1,5 m del ancla', Math.hypot(camaraDe({ a: { x: 0, z: -1 }, entre: true }).z - (-1)) >= 1.5 - 1e-9);
  ok('con `entre` y dist chica (2): vale la menor', Math.abs(camaraDe({ dist: 2, entre: true }).z - (-6 + 2)) < 1e-6);
  const prim = ES.compilarPlano({ tipo: 'plano', plano: 'primer', a: { x: 0, z: -8 }, desde: 'jugador', dist: 1.6, alto: 1.7, entre: true }, { mundo, base: null })(0.5);
  ok('el primer plano del Mandamás queda a 1,6 m, del lado del jugador', Math.abs(prim.z - (-8 + 1.6)) < 1e-6);

  // ---- 1c. la escena
  const pl = ESCENAS_C10['galpon-encuentro'].pasos.filter((p) => p.tipo === 'plano');
  const miran = pl.filter((p) => p.a && p.a.grupo !== undefined);
  ok('los planos de cerca y generales del encuentro miran al grupo (6 con `grupo` en el ancla)', miran.length === 6);
  ok('ninguno de esos planos usa ya el `frente` fijo', miran.every((p) => !p.a.frente));
  ok('todos esos planos van del lado del jugador y entre él y la gente (`entre`), salvo el paneo', miran.filter((p) => p.plano !== 'paneo').every((p) => p.entre === true && p.desde === 'jugador'));
  ok('hay planos al Mandamás (grupo: jefe) y al centro (grupo: centro)', miran.some((p) => p.a.grupo === 'jefe') && miran.some((p) => p.a.grupo === 'centro'));
  const pan = pl.find((p) => p.plano === 'paneo');
  ok('el paneo va de un costado al otro del grupo', pan.a.grupo === 'centro' && pan.hasta.grupo === 'centro' && pan.a.lado === -pan.hasta.lado && pan.a.lado !== 0);
  const reg = EM.registrar ? EM.registrar(ESCENAS_C10['galpon-encuentro']) : { ok: true };
  ok('el director acepta la escena (los refs `grupo` son válidos)', reg.ok !== false);

  // ---- 1d. main.js: el centro de los duendes de la escena
  const duendes = [
    { estado: 'mirando', tipo: 'rastreador', posicion: { x: 2, z: -6 } },
    { estado: 'mirando', tipo: 'rastreador', posicion: { x: 4, z: -8 } },
    { estado: 'mirando', tipo: 'jefe', posicion: { x: 8, z: -12 } },
    { estado: 'fuera', tipo: 'rastreador', posicion: { x: 100, z: 100 } },
    { estado: 'mirando', tipo: 'rastreador', posicion: { x: NaN, z: 0 } },
  ];
  const centro = funcion(fuente, 'centroDeLosDuendesDeEscena', { duendesDeEscena: duendes, Number, Math });
  const c0 = centro('centro'), c1 = centro('jefe');
  ok('el centro es el promedio de los vivos (los que se fueron o sin posición no cuentan)', cerca(c0, { x: 14 / 3, z: -26 / 3 }));
  ok('`jefe` es la posición del Mandamás', cerca(c1, { x: 8, z: -12 }));
  duendes.forEach((d) => { if (d.tipo === 'jefe') d.estado = 'fuera'; });
  ok('sin Mandamás vivo, `jefe` cae al centro del resto', cerca(centro('jefe'), { x: 3, z: -7 }));
  duendes.forEach((d) => { d.estado = 'fuera'; });
  ok('sin nadie: null (el punto de siempre)', centro('centro') === null);
  ok('main.js le pasa a las escenas `grupoDuendes`', /grupoDuendes: \(que\) => centroDeLosDuendesDeEscena\(que\)/.test(fuente));

  // ---- 2. la silueta: la quinta vuelta
  const S = PR.SILUETA_SUAVE, AM = PR.SILUETA_AMPLIA;
  ok('la quinta vuelta: de 12 a 24 m, sin pasar de 1,2 m de tronco', Array.isArray(AM.monte) && AM.monte[0] === 12 && AM.monte[1] === 24 && AM.libre === 1.2);
  const armar = (o = {}) => {
    const hh = { activa: true, capitulo: 1, fase: 'jugando', empezada: 1, cerrados: { llave: 1 }, base: { dia: 5 }, vistos: {}, lazos: {}, decisiones: {}, indicios: {}, duendes: { vistos: 0, trato: null } };
    const pedidos2 = [], tronco = [];
    const dh = { listo: () => true, aparecer: (tipo, p) => { pedidos2.push({ tipo, ...p }); return { estado: 'mirando', posicion: { x: p.x, z: p.z }, huir() { this.estado = 'fuera'; }, reir() {}, saludar() {}, quitar() { this.estado = 'fuera'; } }; }, reir() {} };
    let t = 0;
    const cx = {
      dh, escena: { add() {}, remove() {} }, historia: () => hh, jugador: () => ({ x: 0, z: 0 }), rumbo: () => 0.7, altura: () => 0, hora: () => 19, dia: () => 5, libre: () => true,
      enTierra: o.enTierra || (() => true), cercaDeArbol: () => false, refugio: () => ({ x: 0, z: 0 }), galpon: () => null, cobrar() {}, nota() {}, guardar() {},
      azar: rng(o.semilla || 7), indicio() {}, despejada: o.despejada || (() => false),
    };
    if (o.sinTronco) cx.sinTronco = (x, z, r) => { tronco.push(r); return o.sinTronco(x, z, r); };
    const p = PR.crearPresencia(cx);
    return { pedidos: pedidos2, tronco, correr: (seg) => { for (let i = 0; i < seg / 0.2; i++) { t += 0.2; p.actualizar(0.2); } } };
  };
  { // el monte cerrado: nada despejado, ni árbol, pero hay puntos sin tronco pegado
    const t = armar({ sinTronco: () => true });
    t.correr(90);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z), ang = q && Math.atan2(q.x, q.z);
    okc(!!q, 'en el monte cerrado (nada despejado) la silueta aparece por la quinta vuelta');
    okc(!!q && d >= AM.monte[0] - 1e-6 && d <= AM.monte[1] + 1e-6 && Math.abs(ang - 0.7) <= AM.abanico + 1e-6, `a ${d && d.toFixed(1)} m, dentro del abanico de la vista`);
    okc(t.tronco.length > 0 && t.tronco.every((r) => r === AM.libre), 'pide el punto sin tronco a menos de 1,2 m');
    okc(!!q && q.escala === S.escala && q.pisoNoche === S.pisoNoche, 'con la escala y los ojos de la primera hora');
  }
  { // sin lugar sin tronco: nada
    const t = armar({ sinTronco: () => false });
    t.correr(90);
    okc(t.pedidos.length === 0, 'si todo tiene un tronco a menos de 1,2 m, no aparece');
  }
  { // el agua no
    const t = armar({ sinTronco: () => true, enTierra: () => false });
    t.correr(90);
    okc(t.pedidos.length === 0, 'en el agua no aparece');
  }
  { // sin la línea limpia: aparece aunque `despejada` diga que no en todos lados (lo que exigen las otras vueltas)
    const t = armar({ sinTronco: () => true, despejada: () => false });
    t.correr(90);
    okc(t.pedidos.length === 1, 'no se exige la línea limpia (puede verse entre los troncos)');
  }
  { // entre los lugares posibles se prefiere uno con la línea limpia (no atrás de una casa), si lo hay, con cualquier semilla
    let bien = 0;
    for (const semilla of [3, 101, 977, 5003, 31337, 70001, 123457, 999983]) {
      const t = armar({ semilla, sinTronco: () => true, despejada: (x, z) => x > z * Math.tan(0.7) + 2 && Math.hypot(x, z) < 16.5 });
      t.correr(90);
      const q = t.pedidos[0];
      if (q && q.x > q.z * Math.tan(0.7) + 2) bien++;
    }
    okc(bien === 8, `si hay un lugar con la línea limpia, la quinta lo elige (${bien} de 8 semillas)`);
  }
  { // sólo si las cuatro anteriores no dieron lugar: con la línea limpia a 17 a 28 m aparece ahí, no de 12 a 24
    const t = armar({ sinTronco: () => true, despejada: (x, z) => Math.hypot(x, z) > 25 });
    t.correr(90);
    const q = t.pedidos[0], d = q && Math.hypot(q.x, q.z);
    okc(!!q && d > 25, `si una de las cuatro anteriores da lugar, esa gana (a ${d && d.toFixed(1)} m: no la quinta)`);
    okc(t.tronco.length === 0, 'y la quinta ni se consulta');
  }
  { // el que no pasa `sinTronco` (la presencia de otra versión): sin la quinta vuelta, como antes
    const t = armar({});
    t.correr(90);
    okc(t.pedidos.length === 0, 'sin el dato del juego no hay quinta vuelta');
  }
  // main.js: sinTronco mira el radio que le piden y no la línea
  const linea = fuente.split('\n').find((q) => q.trimStart().startsWith('sinTronco: (x, z, r) =>'));
  okc(!!linea && /col\.resolver\(p, r, 1\.0\)/.test(linea) && /< 0\.05/.test(linea) && !/despejada/.test(linea), 'main.js: sinTronco usa el radio pedido y no mira la línea');
  return R;
}

if (process.argv[2] === '--hijo') {
  const R = await comprobar();
  console.log(JSON.stringify(R));
  process.exit(0);
}

let malas = 0;
const hijo = (src) => {
  const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, A4264_SRC: src }, encoding: 'utf8' });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { if (!src.includes('mut4264')) console.error(r.stderr); return null; }
};
const base = hijo(SRC);
if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

// ---- mutaciones
const MUT = [
  ['escenas.js', 'entre no recorta la distancia', 'if (p.entre === true) {', 'if (false) {'],
  ['escenas.js', 'entre deja la lente a todo el camino (no al 70 %)', 'Math.hypot(e.x - A.x, e.z - A.z) * 0.7', 'Math.hypot(e.x - A.x, e.z - A.z) * 1.4'],
  ['escenas.js', 'entre se acerca hasta pegarse al grupo', 'Math.max(1.5, Math.hypot', 'Math.max(0.1, Math.hypot'],
  ['escenas.js', 'el director rechaza el ref `grupo`', " || typeof r.grupo === 'string');", ');'],
  ['escenas-mundo.js', 'grupo no pide al juego', 'ctx.grupoDuendes?.(ref.grupo) || null', 'null'],
  ['escenas-mundo.js', 'grupo ignora el lado', 'if (!l) return { x: b.x, z: b.z };', 'return { x: b.x, z: b.z };'],
  ['escenas-mundo.js', 'grupo sin duendes: sin plan B', "mundo.posicion({ frente: 'jugador', dist: 6.5 });", 'null;'],
  ['main.js', 'el Mandamás no se distingue del grupo', "if (que === 'jefe') {", "if (false) {"],
  ['main.js', 'los que se fueron cuentan', "d.estado !== 'fuera' && d.posicion &&", 'd.posicion &&'],
  ['main.js', 'el juego no pasa el grupo', 'grupoDuendes: (que) => centroDeLosDuendesDeEscena(que),', ''],
  ['main.js', 'sinTronco con otro radio', 'sinTronco: (x, z, r) => { p.set(x, alt(x, z), z); try { col.resolver(p, r, 1.0);', 'sinTronco: (x, z, r) => { p.set(x, alt(x, z), z); try { col.resolver(p, 0.1, 1.0);'],
  ['historia-escenas-acto3-c10.js', 'el general vuelve al frente fijo', "plano('general', GRUPO, { desde: 'jugador', dist: 10, alto: 2.6, fov: 72, entre: true,", "plano('general', { frente: 'jugador', dist: 6 }, { desde: 'jugador', dist: 10, alto: 2.6, fov: 72,"],
  ['historia-escenas-acto3-c10.js', 'el Mandamás vuelve al frente fijo', "plano('contrapicado', JEFE,", "plano('contrapicado', { frente: 'jugador', dist: 8 },"],
  ['historia-presencia.js', 'sin la quinta vuelta', "'lejos', 'monte']) {", "'lejos']) {"],
  ['historia-presencia.js', 'la quinta exige la línea limpia', "if (vuelta === 'monte') { if (!ctx.sinTronco || !ctx.sinTronco(p.x, p.z, A.libre)) continue; }", "if (vuelta === 'monte') { if (!ctx.sinTronco || !ctx.sinTronco(p.x, p.z, A.libre) || !ctx.despejada(p.x, p.z)) continue; }"],
  ['historia-presencia.js', 'la quinta no mira el tronco', 'if (!ctx.sinTronco || !ctx.sinTronco(p.x, p.z, A.libre)) continue; }', 'if (!ctx.sinTronco) continue; }'],
  ['historia-presencia.js', 'la quinta no prefiere la línea limpia', 'if (ctx.despejada && ctx.despejada(p.x, p.z)) alto += 1000;', 'void 0;'],
  ['historia-presencia.js', 'la quinta pide otro radio', 'libre: 1.2,', 'libre: 0.5,'],
  ['historia-presencia.js', 'la quinta busca de más lejos', 'monte: [12, 24]', 'monte: [30, 40]'],
  ['historia-presencia.js', 'la quinta se mete en el agua', "if (!ctx.enTierra(p.x, p.z) || (vuelta === 'borde'", "if ((vuelta !== 'monte' && !ctx.enTierra(p.x, p.z)) || (vuelta === 'borde'"],
];
for (const [archivo, nombre, de, a] of MUT) {
  const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
  if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4264-'));
  fs.cpSync(SRC, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
  const r = hijo(dir);
  const falla = !r || r.some(([, v]) => !v);
  console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
  if (!falla) malas++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
process.exit(malas ? 1 : 0);
