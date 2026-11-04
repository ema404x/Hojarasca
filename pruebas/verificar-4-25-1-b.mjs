// 4.25.1 (B): los traspasos de las cinemáticas de la Historia. La auditoría con el director real (herramientas/auditoria-4-25-1-b-traspasos.cjs, Electron) mostró gente
// PUESTA adentro de un sólido (Elsa y Graciela en la pared del vagón parado en el andén, Fermín en la pared del galpón, Josefina y Tobías en la roca de la pirca, la abuela
// en el tablón de la plaza) y la lente de la cámara dirigida metida en el tronco del coihue, en la pared del galpón y en un tablón. Esta prueba lo ve sin Electron, con las
// colisiones de verdad (colisiones.js) y el mundo de escenas real (escenas-mundo.js). Cada arreglo tiene su mutación (la misma prueba sobre una copia de src/ con el arreglo
// deshecho tiene que fallar):
//   1. aparecer/teletransportar: quien se pone en un sólido (círculo o pared fina) queda afuera, en el lugar libre más cercano; lo que ya estaba libre no se mueve
//   2. el agua: quien se pone en el agua queda en seco
//   3. arriba de un techo (altura pedida bien por encima del piso) no hay con qué chocar: se respeta el lugar
//   4. caminar: la meta adentro de un sólido se corre al lugar libre (la caminata llega; antes se frenaba contra el borde)
//   5. la cámara dirigida con el plano pegado a un tronco o una pared no queda adentro
//   6. el director, al saltar la escena, deja a cada uno afuera de los sólidos (aunque la meta de la caminata esté adentro)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4251B_SRC || join(raiz, 'src');
const HIJO = !!process.env.A4251B_SRC;
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
const SEC = process.env.A4251B_SECCIONES ? new Set(process.env.A4251B_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4251B_CALLADO) console.log('FALLA ' + t); } };

const { crearEscenasMundo } = await imp('escenas-mundo.js');
const { crearColisiones } = await imp('colisiones.js');

// ---------------------------------------------------------------- el mundo de mentira con las colisiones de verdad
// Un tronco (círculo r 1 en 10,0), una pared fina (de 20,-5 a 20,5, r 0,16, 3 m de alto), un tablón bajo (círculo r 0,4 en -10,0, hasta 0,5 m) y el lago a x > 40
function armar() {
  const col = crearColisiones();
  col.agregar({ x: 10, z: 0, r: 1 });
  col.agregar({ seg: true, ax: 20, az: -5, bx: 20, bz: 5, r: 0.16, alturaMin: 0, alturaMax: 3 });
  col.agregar({ x: -10, z: 0, r: 0.4, alturaMin: 0, alturaMax: 0.5 });
  const mk = (clave) => ({ clave, pos: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, g: { rotation: { y: 0 }, visible: true }, rumbo: 0, cabeza: { rotation: { x: 0, y: 0, z: 0 }, position: { y: 1 } }, brazos: [], camino: [] });
  const elsa = mk('guarda'), fermin = mk('fermin');
  const camara = { position: { x: 0, y: 1.6, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const progreso = { horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const T = { altura: (x) => 0.1 * x, agua: (x) => x > 40, lugares: {} };
  const em = crearEscenasMundo({
    doc: null, gente: () => ({ gente: [elsa, fermin] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), camara, T, col,
    progreso: () => progreso, clima: () => null, sonido: {}, modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
  });
  return { em, m: em.mundo, col, elsa, fermin, camara, T };
}
const solapa = (col, x, z, y = 0, radio = 0.2) => { const q = { x, y, z }; col.resolver(q, radio, 1.65); return Math.hypot(q.x - x, q.z - z); };

if (va('puestos')) {
  const { m, col, elsa, fermin } = armar();
  m.capturar('guarda'); m.capturar('fermin');
  ok(solapa(col, 10.3, 0) > 0.5 && solapa(col, 20.02, 0) > 0.2, 'el mundo de mentira: el tronco y la pared existen (el punto pedido adentro se empuja)');
  // 1. aparecer en el tronco, en la pared, en el tablón; teletransportar también
  m.aparecer('guarda', { x: 10.3, z: 0.2 }, null);
  ok(solapa(col, elsa.pos.x, elsa.pos.z) < 0.02 && Math.hypot(elsa.pos.x - 10, elsa.pos.z) > 1.1, `aparecer en el tronco: queda afuera (a ${Math.hypot(elsa.pos.x - 10, elsa.pos.z).toFixed(2)} m del centro)`);
  ok(Math.hypot(elsa.pos.x - 10.3, elsa.pos.z - 0.2) < 1.6, 'y cerca de donde se pidió (el lugar libre más cercano, no al otro lado del mapa)');
  m.aparecer('guarda', { x: 20.02, z: 1 }, null);
  ok(solapa(col, elsa.pos.x, elsa.pos.z) < 0.02 && Math.abs(elsa.pos.x - 20) > 0.3, `aparecer en la pared fina: queda afuera (x = ${elsa.pos.x.toFixed(2)})`);
  m.teletransportar('fermin', { x: 19.95, z: -2 }, null);
  ok(solapa(col, fermin.pos.x, fermin.pos.z) < 0.02 && Math.abs(fermin.pos.x - 20) > 0.3, `teletransportar en la pared: queda afuera (x = ${fermin.pos.x.toFixed(2)})`);
  m.aparecer('guarda', { x: -10.05, z: 0 }, null);
  ok(solapa(col, elsa.pos.x, elsa.pos.z) < 0.02 && Math.hypot(elsa.pos.x + 10, elsa.pos.z) > 0.55, 'aparecer en el tablón bajo: afuera (el cuerpo entero lo toca)');
  ok(Math.abs(elsa.pos.y - 0.1 * elsa.pos.x) < 1e-9, 'y la altura del pie es la del lugar donde quedó, no la del lugar pedido');
  // lo que ya está libre no se mueve
  m.aparecer('guarda', { x: 5, z: 5 }, null);
  ok(elsa.pos.x === 5 && elsa.pos.z === 5, 'un lugar libre queda exactamente donde se pidió');
  m.aparecer('guarda', { x: 11.3, z: 0 }, { x: 0, z: 0 });
  ok(elsa.pos.x === 11.3 && elsa.pos.z === 0, 'pegado al tronco pero sin tocarlo (radio 0,22): no se mueve');
  // la mirada se calcula desde donde queda
  m.aparecer('guarda', { x: 10.3, z: 0.2 }, { x: 30, z: 0 });
  ok(Math.abs(elsa.g.rotation.y - Math.atan2(30 - elsa.pos.x, 0 - elsa.pos.z)) < 1e-9, 'y mira hacia donde se pidió, desde el lugar donde quedó');
}

if (va('agua')) {
  const { m, elsa, T } = armar();
  m.capturar('guarda');
  m.aparecer('guarda', { x: 41, z: 3 }, null);
  ok(!T.agua(elsa.pos.x, elsa.pos.z) && Math.hypot(elsa.pos.x - 41, elsa.pos.z - 3) < 3, `aparecer en el agua: queda en seco (x = ${elsa.pos.x.toFixed(2)})`);
  m.teletransportar('guarda', { x: 40.5, z: 0 }, null);
  ok(!T.agua(elsa.pos.x, elsa.pos.z), 'teletransportar en la orilla mojada: en seco');
}

if (va('techo')) {
  const { m, col, elsa } = armar();
  m.capturar('guarda');
  m.aparecer('guarda', { x: 10.2, z: 0, y: 5 }, null);
  ok(elsa.pos.x === 10.2 && elsa.pos.z === 0 && elsa.pos.y === 5, 'una altura pedida bien por encima del piso (el techo del galpón) se respeta: ahí no hay con qué chocar');
  ok(solapa(col, 10.2, 0, 0) > 0.5, '(y a ras del piso ese mismo lugar sí es sólido)');
}

if (va('caminar')) {
  const { m, col, elsa } = armar();
  m.capturar('guarda');
  m.caminar('guarda', { x: 10.2, z: 0.1 }, { vel: 1.4 });
  const meta = elsa.camino[0];
  ok(elsa.camino.length === 1 && solapa(col, meta.x, meta.z) < 0.02 && Math.hypot(meta.x - 10, meta.z) > 1.1, `la meta de una caminata adentro del tronco se corre afuera (${meta.x.toFixed(2)}, ${meta.z.toFixed(2)})`);
  ok(Math.hypot(meta.x - 10.2, meta.z - 0.1) < 1.6, 'y queda cerca de lo pedido');
  m.caminar('guarda', { x: 6, z: 6 }, { vel: 1.4 });
  ok(elsa.camino[0].x === 6 && elsa.camino[0].z === 6 && elsa.camino[0].cerca === 0.22, 'una meta libre no se toca');
  m.caminar('guarda', { x: 20, z: 0 }, { vel: 1.4, mira: { x: 0, z: 0 } });
  ok(solapa(col, elsa.camino[0].x, elsa.camino[0].z) < 0.02, 'la meta sobre la pared fina también se corre');
}

if (va('camara')) {
  const { em, camara, col } = armar();
  // un plano libre pegado al tronco (a 0,3 m del centro) con el foco a menos de 1,3 m: el barrido de la cámara ni arranca
  em.registrar({ id: 'prueba-lente', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 10.3, z: 0.2, dy: 1.6 }, mira: { x: 11.2, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
  ok(em.disparar('prueba-lente') === true, 'la escena de prueba arranca');
  for (let i = 0; i < 150; i++) em.actualizar(1 / 30);
  const d = Math.hypot(camara.position.x - 10, camara.position.z);
  ok(d > 1.1, `la lente pegada al centro del tronco queda afuera (a ${d.toFixed(2)} m del centro, el tronco mide 1)`);
  const q = { x: camara.position.x, y: camara.position.y - 0.45, z: camara.position.z };
  col.resolver(q, 0.22, 0.7);
  ok(Math.hypot(q.x - camara.position.x, q.z - camara.position.z) < 0.06, 'y no se solapa con ningún sólido (con el barrido del barrido de escenas)');
  em.saltar();
  for (let i = 0; i < 90; i++) em.actualizar(1 / 30);
  // pegada a la pared fina
  em.registrar({ id: 'prueba-pared', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 20.03, z: 0, dy: 1.6 }, mira: { x: 20.5, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
  ok(em.disparar('prueba-pared') === true, 'la escena de la pared arranca');
  for (let i = 0; i < 150; i++) em.actualizar(1 / 30);
  ok(Math.abs(camara.position.x - 20) > 0.3, `la lente pegada a la pared fina queda al costado (x = ${camara.position.x.toFixed(2)})`);
  em.saltar();
  for (let i = 0; i < 90; i++) em.actualizar(1 / 30);
  // un plano libre y despejado no se mueve
  em.registrar({ id: 'prueba-libre', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 3, z: 6, dy: 1.6 }, mira: { x: 0, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
  ok(em.disparar('prueba-libre') === true, 'la escena libre arranca');
  for (let i = 0; i < 150; i++) em.actualizar(1 / 30);
  ok(Math.abs(camara.position.x - 3) < 0.05 && Math.abs(camara.position.z - 6) < 0.05, 'una lente libre queda donde la puso el plano (' + camara.position.x.toFixed(2) + ', ' + camara.position.z.toFixed(2) + ')');
}

if (va('director')) {
  // 6. con el director de verdad: una escena que hace caminar a Fermín a una meta adentro de la pared y la salteás (Esc): queda afuera
  const { em, elsa, fermin, col } = armar();
  em.registrar({ id: 'prueba-salto', repetible: true, pasos: [
    { tipo: 'gesto', quien: 'fermin', accion: 'aparecer', a: { x: 5, z: 5 } },
    { tipo: 'gesto', quien: 'fermin', accion: 'caminar', a: { x: 20.02, z: 0 }, vel: 1.4 },
    { tipo: 'gesto', quien: 'guarda', accion: 'aparecer', a: { x: 10.2, z: 0.1 } },
    { tipo: 'espera', dur: 30 },
  ] });
  const quedaron = [];
  const origSoltar = em.mundo.soltar;
  em.mundo.soltar = (k) => { const n = k === 'fermin' ? fermin : k === 'guarda' ? elsa : null; if (n) quedaron.push({ k, x: n.pos.x, z: n.pos.z }); return origSoltar(k); };
  ok(em.disparar('prueba-salto') === true, 'la escena arranca');
  for (let i = 0; i < 12; i++) em.actualizar(1 / 30);
  em.saltar();
  for (let i = 0; i < 120; i++) em.actualizar(1 / 30);
  ok(quedaron.length >= 2 && quedaron.every((q) => solapa(col, q.x, q.z) < 0.02), `al saltar la escena nadie queda adentro de un sólido (${quedaron.map((q) => `${q.k}: ${q.x.toFixed(2)}, ${q.z.toFixed(2)}`).join(' · ')})`);
}

if (va('texto')) {
  const t = leer('escenas-mundo.js');
  ok(/function despejarPuesto\(x, z, y\)/.test(t) && /RADIO_PUESTO = 0\.22/.test(t), 'escenas-mundo.js tiene el despeje del puesto con el radio de la gente');
  ok(/const q = despejarPuesto\(p\.x, p\.z, piso\)/.test(t) && /meta = despejarPuesto\(d\.x, d\.z,/.test(t), 'lo usan ubicar (aparecer y teletransportar) y caminar');
  ok(/col\.resolver\(bola, 0\.25, 0\.7\);\s*\n\s*if \(Math\.hypot\(bola\.x - r\.x, bola\.z - r\.z\) > 0\.02\)/.test(t), 'y la cámara se saca por el costado si queda adentro de un sólido');
}

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['escenas-mundo.js', "if (!alto) { const q = despejarPuesto(p.x, p.z, piso);", "if (false) { const q = despejarPuesto(p.x, p.z, piso);", 'ubicar no despeja nada', 'puestos'],
  ['escenas-mundo.js', "const RADIO_PUESTO = 0.22;", "const RADIO_PUESTO = 0.0001;", 'el despeje no ve los sólidos (radio ínfimo)', 'puestos'],
  ['escenas-mundo.js', "if (Math.hypot(sonda.x - x, sonda.z - z) < 0.02 && !agua(x, z)) return { x, z };", "if (!agua(x, z)) return { x, z };", 'un lugar en un sólido se da por bueno', 'puestos'],
  ['escenas-mundo.js', "const RADIO_PUESTO = 0.22;", "const RADIO_PUESTO = 0.6;", 'el despeje mueve hasta lo que apenas roza', 'puestos'],
  ['escenas-mundo.js', "if (!agua(sonda.x, sonda.z) && libreDeSolidos(sonda.x, sonda.z, y)) return { x: sonda.x, z: sonda.z };", "return { x, z };", 'sin el empujón ni los anillos', 'puestos'],
  ['escenas-mundo.js', "if (Math.hypot(sonda.x - x, sonda.z - z) < 0.02 && !agua(x, z)) return { x, z };", "if (Math.hypot(sonda.x - x, sonda.z - z) < 0.02) return { x, z };", 'el agua no cuenta', 'agua'],
  ['escenas-mundo.js', "const alto = Number.isFinite(p.y) && p.y > piso + 1.2;", "const alto = false;", 'la altura pedida del techo no se respeta', 'techo'],
  ['escenas-mundo.js', "meta = despejarPuesto(d.x, d.z, alturaDePie(ctx.T, ctx.col, d.x, d.z, n.pos.y));", "meta = { x: d.x, z: d.z };", 'la meta de la caminata queda adentro', 'caminar'],
  ['escenas-mundo.js', "col.resolver(bola, 0.25, 0.7);\n    if (Math.hypot(bola.x - r.x, bola.z - r.z) > 0.02) { r.x = bola.x; r.z = bola.z; }", "", 'la lente puede quedar adentro', 'camara'],
  ['escenas-mundo.js', "if (Math.hypot(bola.x - r.x, bola.z - r.z) > 0.02) { r.x = bola.x; r.z = bola.z; }", "if (Math.hypot(bola.x - r.x, bola.z - r.z) > 0.02) { r.z = bola.z; }", 'la lente se corre sólo en un eje', 'camara'],
  ['escenas-mundo.js', "if (!alto) { const q = despejarPuesto(p.x, p.z, piso); if (q.x !== p.x || q.z !== p.z) { p = { ...p, x: q.x, z: q.z }; piso = alturaDePie(ctx.T, ctx.col, p.x, p.z, num(p.y)); } }", "if (!alto) { const q = despejarPuesto(p.x, p.z, piso); if (q.x !== p.x || q.z !== p.z) { p = { ...p, x: q.x, z: q.z }; } }", 'queda la altura del lugar viejo', 'puestos'],
];
let atrapadas = 0, aplicables = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4251b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = readFileSync(join(raiz, 'src', arch), 'utf8');
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      aplicables++;
      const dir = join(tmp, `m${aplicables}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4251B_SRC: dir, A4251B_CALLADO: '1', A4251B_SECCIONES: secc }, encoding: 'utf8', timeout: 120000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (HIJO) process.exit(fallas ? 1 : 0);
console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.1 (B) traspasos de las cinemáticas · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
