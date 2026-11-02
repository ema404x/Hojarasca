// 4.19.0 (C): mundo y pulido a ojo. Lo que se puede mostrar sin Electron; lo demás lo miran `pruebas/humo-4-19-0-c.cjs` (partida real) y las hojas de contacto.
//
// 1. La gente de una escena activa se dibuja aunque esté a más de 130 m del jugador (Herminia en su casa, en `umbral-fin` con la pelea, con vos en el refugio a 700 m):
//    `crearEscenasMundo` le pone `enEscena` al personaje que captura y se lo saca al soltarlo; `gente.js` lo dibuja (y le anima la pose en tiempo real) mientras la tiene.
//    Cada mutación es una copia con otro nombre (sin la caché de ESM) y tiene que hacer fallar su comprobación.
// 2. La pareja se arma con su clave de verdad (`armarYa('panadera')` y no `armarYa('pareja')`), la colocación del frasco y de la pareja, y los props pulidos
//    (estacas del herrero, oveja del cartel, barro de la ventana, hoja de la tranquera): cada uno con su mutación.
// 3. Las pruebas de partida real de esta versión existen y están bien armadas.
//
// Uso: node pruebas/verificar-4-19-0-c.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expresion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

const falso = () => new Proxy(function () {}, {
  get(_t, k) {
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'children') return [];
    if (k === Symbol.iterator) return undefined;
    return () => falso();
  },
  set() { return true; },
});
const doc = { head: falso(), body: falso(), createElement: () => falso(), pointerLockElement: null, getElementById: () => null, querySelector: () => null };

// ---------------------------------------------------------------- 1. escenas-mundo.js: la marca `enEscena`
const fuenteMundo = leer('src/escenas-mundo.js');
const fuenteGente = leer('src/gente.js');

// una persona de mentira como las de gente.js (lo que `capturar` y `soltar` tocan) con vos a 700 m
function armar(modulo, extra = {}) {
  const npc = {
    clave: 'abuela', g: { visible: false, rotation: { y: 0 } }, pos: { x: 81, y: 0, z: -383, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    soloCerca: 25, dormido: true, aBordo: false, enViaje: false, ...extra,
  };
  const camara = { position: { x: 0, y: 0, z: 0, set() {} }, rotation: { x: 0, y: 0, z: 0, set() {} }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const progreso = { dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const m = modulo.crearEscenasMundo({
    doc, camara, progreso: () => progreso, jugador: () => ({ estado: { pos: { x: 700, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
    T: { altura: () => 0, lugares: {} }, col: null, gente: () => ({ gente: [npc] }), clima: () => ({ estado: {} }), sonido: {}, alturaDePie: () => 0, nota() {}, fallo() {},
  });
  return { m, npc };
}

// ¿se dibujaría? la línea de gente.js que decide `visible`, evaluada con la distancia que sea
const dibuja = (fuente, g, d) => expresion(fuente, 'g.g.visible = ', { g, d }, 'soloCerca');
// la frecuencia de la pose: con la marca, en tiempo real (0) aunque esté lejos
const pasoPose = (fuente, g, d) => expresion(fuente, 'const pasoPose = ', { g, d, charlando: false, presupuestoNivel: 0 });

async function comprobarMundo(rotulo, modulo, esperado) {
  const { m, npc } = armar(modulo);
  m.mundo.capturar('abuela');
  ok(npc.enEscena === true === esperado.pone, `${rotulo}: al capturar al personaje queda marcado «enEscena» (${npc.enEscena})`);
  m.mundo.soltar('abuela');
  ok(!Object.hasOwn(npc, 'enEscena') === esperado.saca, `${rotulo}: al soltarlo se le saca la marca (${Object.hasOwn(npc, 'enEscena') ? 'sigue' : 'ya no está'})`);
  // un personaje que ya traía la marca (otra cosa lo había puesto): la escena se la devuelve como estaba
  const { m: m2, npc: n2 } = armar(modulo, { enEscena: false });
  m2.mundo.capturar('abuela');
  m2.mundo.soltar('abuela');
  ok((n2.enEscena === false) === esperado.devuelve, `${rotulo}: si traía la marca en falso, al soltarlo vuelve a falso (${n2.enEscena})`);
}

const real = await import('../src/escenas-mundo.js');
await comprobarMundo('escenas-mundo.js', real, { pone: true, saca: true, devuelve: true });

// la regla de dibujo de gente.js, con el código de verdad
const lejos = { enEscena: true, soloCerca: 0 };
ok(dibuja(fuenteGente, { ...lejos }, 700) === true, 'gente.js: el que está en una escena se dibuja a 700 m');
ok(dibuja(fuenteGente, { soloCerca: 0 }, 700) === false, 'gente.js: sin la marca, a 700 m no se dibuja (como siempre)');
ok(dibuja(fuenteGente, { soloCerca: 0 }, 129) === true && dibuja(fuenteGente, { soloCerca: 0 }, 131) === false, 'gente.js: el corte normal sigue en 130 m');
ok(dibuja(fuenteGente, { soloCerca: 25 }, 100) === false && dibuja(fuenteGente, { soloCerca: 25, enEscena: true }, 100) === true, 'gente.js: la marca vale también para el que está adentro de un edificio (soloCerca)');
ok(dibuja(fuenteGente, { aBordo: true, enViaje: true, soloCerca: 0 }, 100) === false, 'gente.js: el que va a bordo de la trochita sigue con su regla (a más de 40 m no se ve)');
ok(dibuja(fuenteGente, { aBordo: false, enEscena: undefined, soloCerca: 0 }, 50) === true, 'gente.js: cerca se ve como siempre');
ok(pasoPose(fuenteGente, { enEscena: true }, 700) === 0, 'gente.js: la pose del de la escena se calcula en cada cuadro aunque esté lejos');
ok(pasoPose(fuenteGente, {}, 700) > 0, 'gente.js: la del que no está en una escena, lejos, sigue espaciada (el costo de siempre)');

// ---------------------------------------------------------------- mutaciones (copias con otro nombre)
let contador = 0;
async function mutarMundo(rotulo, cambio, esperado) {
  const copia = path.join(raiz, 'src', `__escenas-mundo-4190c-${++contador}.js`);
  const mutada = cambio(fuenteMundo);
  ok(mutada !== fuenteMundo, `mutación «${rotulo}»: el texto cambia`);
  fs.writeFileSync(copia, mutada);
  try {
    const mod = await import(`../src/${path.basename(copia)}`);
    const antes = fallas, antesTotal = total;
    const log = console.log; console.log = () => {};   // (las de la copia fallan a propósito: no se muestran)
    try { await comprobarMundo(`  [mutada] ${rotulo}`, mod, esperado); } finally { console.log = log; }
    const hechas = fallas - antes;
    fallas = antes; total = antesTotal;   // (las comprobaciones de la copia no cuentan como fallas: lo que cuenta es que la mutación se haya notado)
    ok(hechas > 0, `mutación «${rotulo}» atrapada (${hechas} comprobación(es) fallan en la copia)`);
  } finally { try { fs.unlinkSync(copia); } catch { /* ya */ } }
}
await mutarMundo('capturar no marca', (t) => t.replace(/ {4}n\.enEscena = true;[^\n]*\n/, ''), { pone: true, saca: true, devuelve: true });
await mutarMundo('soltar no la saca (no se guarda)', (t) => t.replace("'enViaje', 'enEscena']) guardado[k]", "'enViaje']) guardado[k]"), { pone: true, saca: true, devuelve: true });

// mutaciones de gente.js (se evalúan las líneas del código mutado)
function mutarGente(rotulo, cambio, comprobar) {
  const m = cambio(fuenteGente);
  ok(m !== fuenteGente, `mutación «${rotulo}»: el texto cambia`);
  let atrapada = false;
  try { atrapada = !comprobar(m); } catch { atrapada = true; }
  ok(atrapada, `mutación «${rotulo}» atrapada`);
}
const comprobarGente = (f) => dibuja(f, { ...lejos }, 700) === true && dibuja(f, { soloCerca: 0 }, 700) === false && dibuja(f, { soloCerca: 25, enEscena: true }, 100) === true && pasoPose(f, { enEscena: true }, 700) === 0;
ok(comprobarGente(fuenteGente), 'sanidad: las comprobaciones de gente.js pasan con el código de verdad');
mutarGente('gente.js ignora la marca al dibujar', (t) => t.replace('(!!g.enEscena || d < (g.soloCerca || 130))', '(d < (g.soloCerca || 130))'), comprobarGente);
mutarGente('gente.js dibuja a todos sin importar la distancia', (t) => t.replace('(!!g.enEscena || d < (g.soloCerca || 130))', 'true'), comprobarGente);
mutarGente('gente.js ignora la marca en la pose', (t) => t.replace('(charlando || d < 38 || g.enEscena)', '(charlando || d < 38)'), comprobarGente);
mutarGente('gente.js: la marca pisa a la regla de la trochita', (t) => t.replace('g.aBordo ? !!g.enViaje && d < 40 :', 'g.aBordo ? true :'), (f) => dibuja(f, { aBordo: true, enViaje: true, soloCerca: 0 }, 100) === false);

// ---------------------------------------------------------------- 2a. la pareja se arma con su clave de verdad
function pareja(modulo, claveDePareja = 'panadera') {
  const pedidos = [];
  const camara = { position: { x: 0, y: 0, z: 0, set() {} }, rotation: { x: 0, y: 0, z: 0, set() {} }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const progreso = { dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const npc = { clave: claveDePareja, g: { visible: false, rotation: { y: 0 } }, pos: { x: 0, y: 0, z: 0, set() {} } };
  const m = modulo.crearEscenasMundo({
    doc, camara, progreso: () => progreso, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
    T: { altura: () => 0, lugares: {} }, col: null, gente: () => ({ gente: [] }), clima: () => ({ estado: {} }), sonido: {}, alturaDePie: () => 0, nota() {}, fallo() {},
    parejaClave: () => claveDePareja, armarYa: (k) => { pedidos.push(k); return k === claveDePareja ? npc : null; },
  });
  m.mundo.capturar('pareja');
  return { pedidos, armada: m.capturados().includes('pareja'), npc };
}
{
  const r = pareja(real);
  ok(r.pedidos.length === 1 && r.pedidos[0] === 'panadera', 'escenas-mundo.js: a la pareja se la arma con su clave de verdad (se pidió «' + r.pedidos.join(',') + '»)');
  ok(r.npc.enEscena === true, 'y queda marcada para dibujarse en la escena');
  const copia = path.join(raiz, 'src', '__escenas-mundo-4190c-pareja.js');
  const mutada = fuenteMundo.replace("n = ctx.armarYa(real) || actor(clave);", "n = ctx.armarYa(clave) || actor(clave);");
  ok(mutada !== fuenteMundo, 'mutación «se pide armar a "pareja" en vez de a la persona»: el texto cambia');
  fs.writeFileSync(copia, mutada);
  try {
    const mod = await import('../src/__escenas-mundo-4190c-pareja.js');
    const rm = pareja(mod);
    ok(!(rm.pedidos.length === 1 && rm.pedidos[0] === 'panadera') && !rm.npc.enEscena, 'mutación «se pide armar a "pareja"» atrapada (se pidió «' + rm.pedidos.join(',') + '»)');
  } finally { try { fs.unlinkSync(copia); } catch { /* ya */ } }
}

// ---------------------------------------------------------------- 2b. la colocación del frasco de la repisa y de la pareja
{
  const { COLOCACION_PULIDO, validarColocacion } = await import('../src/historia-colocacion.js');
  const { OBJETOS } = await import('../src/historia-disparadores.js');
  const { ESCENAS_OPTATIVAS } = await import('../src/historia-escenas-optativas.js');
  for (const id of ['frasco-repisa', 'pareja-noche-antes']) ok(Object.hasOwn(COLOCACION_PULIDO, id) && validarColocacion(COLOCACION_PULIDO[id]).ok, 'colocación válida para ' + id);
  const c = COLOCACION_PULIDO['frasco-repisa'], fr = OBJETOS['frasco-repisa'];
  ok(!!c && !!fr, 'existen la colocación y el objeto del frasco');
  const aFrasco = c && fr ? Math.hypot(c.lx - fr.lx, c.lz - fr.lz) : 99, mira = c && fr ? Math.hypot(c.mira[0] - fr.lx, c.mira[1] - fr.lz) : 99;
  const plano = ESCENAS_OPTATIVAS['frasco-repisa']?.pasos?.find((p) => p.tipo === 'plano' && p.plano === 'detalle');
  ok(!!plano && plano.a?.frente === 'jugador', 'la escena del frasco tiene su plano de detalle anclado al jugador');
  ok(plano && Math.abs(plano.a.dist - aFrasco) < 0.15, 'frasco-repisa: el plano cae sobre el frasco (' + (plano && plano.a.dist) + ' m delante tuyo, el frasco a ' + aFrasco.toFixed(2) + ' m)');
  ok(mira < 0.2 && aFrasco < 1.5, 'frasco-repisa: parado a ' + aFrasco.toFixed(2) + ' m de la estantería y mirándola');
  const cp = COLOCACION_PULIDO['pareja-noche-antes'], dp = cp ? Math.hypot(cp.lx - cp.mira[0], cp.lz - cp.mira[1]) : 99;
  ok(dp >= 3 && dp <= 5, 'pareja-noche-antes: de frente al umbral, a ' + dp.toFixed(1) + ' m de lo que mira');
}

// ---------------------------------------------------------------- 2c. los props pulidos (se corre el código de cada forma con un mundo de mentira que anota lo que se agrega)
const fuenteObj = leer('src/historia-objetos.js');
function corrida(fuente, nombre) {
  const reg = [];
  const THREE = new Proxy({}, { get: (_t, k) => (typeof k === 'string' && /Geometry$/.test(k) ? class { constructor(...a) { this.tipo = k; this.args = a; } } : undefined) });
  const matriz = (pos, rot, esc) => ({ pos, rot, esc });
  const c = { agregar(geo, o) { reg.push({ ...o, geo: geo.tipo, args: geo.args }); } };
  const entorno = { THREE, matriz };
  for (const h of ['caja', 'esfera', 'palo', 'cajaM']) entorno[h] = expresion(fuente, 'const ' + h + ' = ', entorno);
  const i0 = fuente.search(new RegExp('\\n  (' + nombre + "|'" + nombre + "'): \\(c"));
  if (i0 < 0) throw new Error('no está la forma ' + nombre);
  const i1 = fuente.indexOf('\n  },', i0);
  const cuerpo = fuente.slice(fuente.indexOf('{', fuente.indexOf('=>', i0)) + 1, i1);
  new Function('c', 'info', 'caja', 'esfera', 'palo', 'cajaM', 'THREE', 'matriz', cuerpo)(c, { suelo: () => 0, r: 1.4 }, entorno.caja, entorno.esfera, entorno.palo, entorno.cajaM, THREE, matriz);
  return reg;
}
const media = (hex) => { const n = parseInt(hex.slice(1), 16); return (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3; };
const comprobaciones = {
  estacas: (f) => { const r = corrida(f, 'estacas'), palos = r.filter((x) => x.geo === 'CylinderGeometry'); return palos.filter((x) => x.args[0] >= 0.1).length === 6 && r.filter((x) => x.geo === 'ConeGeometry' && x.args[0] >= 0.1).length === 6; },
  'cartel-tabla': (f) => { const r = corrida(f, 'cartel-tabla'), tabla = r.find((x) => x.geo === 'BoxGeometry' && x.args[0] > 1.5), patas = r.filter((x) => x.geo === 'BoxGeometry' && x.args[0] < 0.06 && x.args[1] > 0.12); const fondo = tabla ? tabla.matriz.pos[1] - tabla.args[1] / 2 : 0; return !!tabla && tabla.args[1] >= 0.9 && r.some((x) => x.color === '#efe9d8') && patas.length === 4 && patas.every((p) => p.matriz.pos[1] - p.args[1] / 2 >= fondo - 0.001); },
  'barro-bellotas': (f) => { const r = corrida(f, 'barro-bellotas'), barro = r.filter((x) => x.geo === 'SphereGeometry' && x.args[0] >= 0.16); return barro.length === 5 && barro.every((x) => media(x.color) > 90) && r.filter((x) => x.geo === 'SphereGeometry' && x.args[0] < 0.05).every((x) => media(x.color) > 100); },
  'tranquera-abierta': (f) => { const r = corrida(f, 'tranquera-abierta'), hojas = r.filter((x) => x.geo === 'BoxGeometry' && x.args[0] === 3); return hojas.length >= 5 && hojas.every((x) => x.args[1] >= 0.2 && media(x.color) > 120); },
};
for (const [nombre, comprobar] of Object.entries(comprobaciones)) {
  let bien = false; try { bien = comprobar(fuenteObj); } catch (e) { bien = false; }
  ok(bien, 'historia-objetos.js: ' + nombre);
}
const mutacionesObj = [
  ['estacas', 'las estacas vuelven a ser siete y finas', (t) => t.replace('for (let i = 0; i < 6; i++) {\n      const x = (i - 2.5) * 1.05', 'for (let i = 0; i < 7; i++) {\n      const x = (i - 3) * 0.9').replace('palo(c, 0.11, 1.55,', 'palo(c, 0.06, 1.55,')],
  ['cartel-tabla', 'el cartel pierde la oveja', (t) => t.split("'#efe9d8'").join("'#a07a4a'")],
  ['cartel-tabla', 'las patas de la oveja sobresalen de la tabla', (t) => t.replace('caja(c, [1.75, 0.98, 0.05], [0, 1.18, 0.05]', 'caja(c, [1.75, 0.86, 0.05], [0, 1.24, 0.05]')],
  ['barro-bellotas', 'el barro vuelve a ser oscuro', (t) => t.replace("'#8a6a47'", "'#4a3726'")],
  ['tranquera-abierta', 'la hoja vuelve a ser fina y oscura', (t) => t.replace("caja(c, [3.0, 0.22, 0.14], [-1.6 + Math.cos(giro) * 1.5, 0.3 + i * 0.26, Math.sin(giro) * 1.5], '#b08c5c'", "caja(c, [3.0, 0.17, 0.1], [-1.6 + Math.cos(giro) * 1.5, 0.35 + i * 0.3, Math.sin(giro) * 1.5], '#6e5236'")],
];
for (const [nombre, texto, cambio] of mutacionesObj) {
  const m = cambio(fuenteObj);
  ok(m !== fuenteObj, 'mutación «' + texto + '»: el texto cambia');
  let bien = true; try { bien = comprobaciones[nombre](m); } catch (e) { bien = false; }
  ok(!bien, 'mutación «' + texto + '» atrapada');
}

// ---------------------------------------------------------------- 3. las pruebas de partida real de esta versión
for (const f of ['humo-4-19-0-c', 'humo-4-19-0-c-camara']) {
  const ruta = path.join(raiz, 'pruebas', `${f}.cjs`);
  ok(fs.existsSync(ruta), `existe pruebas/${f}.cjs`);
  if (!fs.existsSync(ruta)) continue;
  const t = fs.readFileSync(ruta, 'utf8');
  ok(!/\u0008/.test(t), `${f}: sin retrocesos (0x08) por barras perdidas`);
  ok(!/\bconsole\.log\(['"`]DEBUG/.test(t), `${f}: sin depuración suelta`);
  ok(/lanzar-electron|al-monitor|HUMO_PERFIL/.test(t), `${f}: se lanza con el lanzador del monitor externo y perfil propio`);
}
console.log(fallas ? `\nFALLARON ${fallas} de ${total}` : `\nTODO OK (${total} comprobaciones)`);
process.exit(fallas ? 1 : 0);
