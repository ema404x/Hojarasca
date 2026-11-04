// 4.25.1 (A): NPC trabados en las cinemáticas (el director de escenas, la captura y la suelta de la gente). Cada arreglo tiene su mutación (la misma prueba sobre una
// copia de src/ con el arreglo deshecho tiene que fallar). Lo que se reprodujo, con la gente de verdad (gente.js en una VM, ver ayuda-4-25-1-a.mjs):
//   1. la misma persona pedida con dos nombres («pareja» y «rosa» cuando tu pareja es Rosa) quedaba con `enEscena`, `conVos` y `enCita` para siempre (la aldea ya no la movía)
//   2. la caminata contra el agua (o contra un tronco, o con la meta en un obstáculo) dejaba al actor empujando hasta el límite del director (casi un minuto)
//   3. la caminata de alguien que arrancaba a 300 m hacía esperar 8 minutos con las barras de cine puestas
//   4. el de rutina (Nicanor, Josefina, Ramón) que la escena dejaba lejos de su parada seguía haciendo la tarea (pescando, anotando) donde lo dejó
//   5. un abrazo o una charla a medias (animSocial) le seguía pisando hacia dónde mira durante toda la escena
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { imp, SRC, crearBanco, correrEscena } from './ayuda-4-25-1-a.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4251_SRC;
const SEC = process.env.A4251_SECCIONES ? new Set(process.env.A4251_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4251_CALLADO) console.log('FALLA ' + t); } };

const EM = await imp('escenas-mundo.js');
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
const persona = (clave, x, z, extra = {}) => ({ clave, g: { visible: true, rotation: { y: 0 } }, pos: { x, y: 0, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; } }, ...extra });
function mundoCon(personas, o = {}) {
  const camara = { position: { x: 0, y: 0, z: 0, set() {} }, rotation: { x: 0, y: 0, z: 0, set() {} }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const progreso = { dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const m = EM.crearEscenasMundo({
    doc, camara, progreso: () => progreso, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
    T: { altura: () => 0, agua: o.agua || (() => false), lugares: {} }, col: null, gente: () => ({ gente: personas }), clima: () => ({ estado: {} }), sonido: {}, alturaDePie: () => 0, nota() {}, fallo() {},
    parejaClave: () => o.pareja || null,
  });
  return m;
}

// ---------------------------------------------------------------- 1. la misma persona con dos nombres
if (va('alias')) {
  for (const orden of [['pareja', 'panadera'], ['panadera', 'pareja']]) {
    const rosa = persona('panadera', 5, 5, { camino: [{ x: 9, z: 9 }], velocidad: 0.8, soloCerca: 25, dormido: false });
    const m = mundoCon([rosa], { pareja: 'panadera' });
    for (const k of orden) m.mundo.capturar(k);
    ok(rosa.enEscena === true && rosa.conVos === true, `[${orden}] mientras dura la escena está tomada`);
    ok(m.capturados().length === 2, `[${orden}] los dos nombres figuran capturados`);
    for (const k of orden) m.mundo.soltar(k);
    ok(!Object.hasOwn(rosa, 'enEscena'), `[${orden}] al soltar no queda «enEscena» (${rosa.enEscena})`);
    ok(!rosa.conVos && !rosa.enCita && !Object.hasOwn(rosa, 'conVos') && !Object.hasOwn(rosa, 'enCita'), `[${orden}] al soltar no queda «conVos» ni «enCita»: la aldea la vuelve a mover`);
    ok(rosa.soloCerca === 25 && rosa.dormido === false && rosa.sinFrenar === undefined, `[${orden}] el resto vuelve como estaba`);
    ok(m.capturados().length === 0, `[${orden}] no queda nadie capturado`);
  }
  // los gestos que se piden con cualquiera de los dos nombres llegan a la misma persona
  const rosa = persona('panadera', 0, 0);
  const m = mundoCon([rosa], { pareja: 'panadera' });
  m.mundo.capturar('panadera'); m.mundo.capturar('pareja');
  m.mundo.caminar('pareja', { x: 3, z: 0 }, { vel: 1 });
  ok(m.mundo.ocupado('panadera') && m.mundo.ocupado('pareja'), 'caminar con el nombre «pareja» mueve a la persona de verdad');
  // el estado de la pose es de la persona, no del nombre: sentada con un nombre, el otro no la levanta con un gesto del juego
  m.mundo.posar('pareja', 'sentado', 3);
  m.mundo.posar('panadera', 'tocar', 2);
  ok(rosa.pose === 'sentado', `sentada con el nombre «pareja», un gesto pedido con «panadera» no la levanta (${rosa.pose})`);
  m.mundo.posar('panadera', 'parado', 0);
  ok(rosa.pose !== 'sentado' && rosa.asiento === undefined, 'y «parado» con el otro nombre sí');
  m.mundo.soltar('pareja');
  ok(m.capturados().includes('panadera') && rosa.enEscena === true, 'soltar el alias no la suelta: sigue tomada por su nombre de verdad');
  m.mundo.soltar('panadera');
  ok(!Object.hasOwn(rosa, 'enEscena') && !rosa.conVos, 'y al soltar el nombre de verdad queda como estaba');
}

// ---------------------------------------------------------------- 2. la caminata que no avanza
if (va('atasco')) {
  // el actor no se mueve nunca (agua, un tronco…): a los pocos segundos rodea o llega de golpe
  const a = persona('ramon', 0, 0);
  const m = mundoCon([a]);
  m.mundo.capturar('ramon');
  m.mundo.caminar('ramon', { x: 12, z: 0 }, { vel: 1.2 });
  ok(m.mundo.ocupado('ramon'), 'arranca la caminata');
  let t = 0;
  while (m.mundo.ocupado('ramon') && t < 30) { m.despuesDeGente(0.1); t += 0.1; }
  ok(!m.mundo.ocupado('ramon') && t <= 7, `el que no avanza llega en menos de 7 s (${t.toFixed(1)} s) y no a los 30 del director`);
  ok(Math.hypot(a.pos.x - 12, a.pos.z) < 0.01, `y queda en la meta (${a.pos.x.toFixed(1)}, ${a.pos.z.toFixed(1)})`);
  // el primer intento es rodear: se le da un punto a un costado antes de ubicarlo
  const b = persona('ramon', 0, 0);
  const m2 = mundoCon([b]);
  m2.mundo.capturar('ramon');
  m2.mundo.caminar('ramon', { x: 12, z: 0 }, { vel: 1.2 });
  const camino0 = b.camino.length;
  for (let i = 0; i < 25; i++) m2.despuesDeGente(0.1);
  ok(b.camino.length === 2 && camino0 === 1, `a los 2 s sin avanzar prueba un rodeo (${camino0} → ${b.camino.length} puntos)`);
  // el que camina bien no se toca
  const c = persona('ramon', 0, 0);
  const m3 = mundoCon([c]);
  m3.mundo.capturar('ramon');
  m3.mundo.caminar('ramon', { x: 12, z: 0 }, { vel: 1.2 });
  let salto = 0, ant = 0;
  for (let i = 0; i < 200 && m3.mundo.ocupado('ramon'); i++) {
    c.pos.x = Math.min(12, c.pos.x + 1.2 * 0.1);
    if (c.pos.x >= 12) c.camino.length = 0;
    m3.despuesDeGente(0.1);
    salto = Math.max(salto, c.pos.x - ant); ant = c.pos.x;
  }
  ok(salto < 0.2 && Math.abs(c.pos.x - 12) < 0.01, `el que camina de verdad llega solo, sin saltos (el mayor ${salto.toFixed(2)} m por cuadro)`);
  // la meta con el agua alrededor: el rodeo no se pone en el agua
  const d = persona('ramon', 0, 0);
  const m4 = mundoCon([d], { agua: (x, z) => Math.abs(z) > 3 });
  m4.mundo.capturar('ramon');
  m4.mundo.caminar('ramon', { x: 12, z: 0 }, { vel: 1.2 });
  for (let i = 0; i < 25; i++) m4.despuesDeGente(0.1);
  ok(d.camino.length === 1, 'si el rodeo cae en el agua no se lo manda ahí');
}

// ---------------------------------------------------------------- 3. el que arranca lejos
if (va('lejos')) {
  const a = persona('belisario', 300, -120);
  const m = mundoCon([a]);
  m.mundo.capturar('belisario');
  m.mundo.caminar('belisario', { x: 0, z: 0 }, { vel: 1.4 });
  const resta = Math.hypot(a.pos.x, a.pos.z);
  ok(resta > 33 && resta < 35, `el que arrancaba a 320 m queda a 34 m de la meta (${resta.toFixed(1)}): la escena espera 25 s y no 8 minutos`);
  ok(a.camino.length === 1 && Math.hypot(a.camino[0].x, a.camino[0].z) < 0.01, 'y la caminata sigue hacia la meta');
  const cerca = persona('belisario', 30, 0);
  const m2 = mundoCon([cerca]);
  m2.mundo.capturar('belisario');
  m2.mundo.caminar('belisario', { x: 0, z: 0 }, { vel: 1.4 });
  ok(cerca.pos.x === 30, 'el que arranca a 30 m camina todo el tramo (no se lo mueve)');
  // del lado de donde venía, y sobre tierra
  const e = persona('belisario', 200, 0);
  const m3 = mundoCon([e], { agua: (x, z) => x > 30 && x < 38 && Math.abs(z) < 6 });
  m3.mundo.capturar('belisario');
  m3.mundo.caminar('belisario', { x: 0, z: 0 }, { vel: 1.4 });
  ok(!(e.pos.x > 30 && e.pos.x < 38 && Math.abs(e.pos.z) < 6), `si el punto cae en el agua se busca otro (${e.pos.x.toFixed(1)}, ${e.pos.z.toFixed(1)})`);
  ok(Math.hypot(e.pos.x, e.pos.z) > 33 && Math.hypot(e.pos.x, e.pos.z) < 35, 'a la misma distancia de la meta');
}

// ---------------------------------------------------------------- 4. la rutina después de la escena
if (va('rutina')) {
  const ruta = [{ x: 0, z: 0, quieto: 26, pescando: true }, { x: 20, z: 0, quieto: 10 }];
  const a = persona('nicanor', 0, 0, { ruta, etapa: 0, espera: 18 });
  const m = mundoCon([a]);
  m.mundo.capturar('nicanor');
  m.mundo.teletransportar('nicanor', { x: 40, z: 40 }, null);
  m.mundo.soltar('nicanor');
  ok(a.espera === 0 && a.camino === undefined, `Nicanor, lejos de su parada, no sigue pescando: vuelve a ella (espera ${a.espera})`);
  const b = persona('nicanor', 0, 0.4, { ruta, etapa: 0, espera: 18 });
  const m2 = mundoCon([b]);
  m2.mundo.capturar('nicanor');
  m2.mundo.soltar('nicanor');
  ok(b.espera === 18, `el que sigue en su parada sigue con lo suyo (espera ${b.espera})`);
  const c = persona('ramon', 0, 0, { ruta, etapa: 1, espera: 0 });
  const m3 = mundoCon([c]);
  m3.mundo.capturar('ramon'); m3.mundo.teletransportar('ramon', { x: 50, z: 50 }, null); m3.mundo.soltar('ramon');
  ok(c.espera === 0, 'el que ya caminaba hacia su parada sigue igual');
  const d = persona('tobias', 0, 0, { camino: [], espera: 9 });
  const m4 = mundoCon([d]);
  m4.mundo.capturar('tobias'); m4.mundo.teletransportar('tobias', { x: 50, z: 50 }, null); m4.mundo.soltar('tobias');
  ok(d.espera === 9, 'el de horario (sin rutina) no se toca');
}

// ---------------------------------------------------------------- 5. la charla o el abrazo a medias
if (va('social')) {
  const a = persona('ercilia', 0, 0, { animSocial: { id: 'abrazo', mira: 1.2, dur: 6 }, __volverA: { x: 3, z: 3 } });
  const m = mundoCon([a]);
  m.mundo.capturar('ercilia');
  ok(a.animSocial === null && a.__volverA === null, 'al capturarla se corta el abrazo a medias (no le pisa hacia dónde mira)');
  m.mundo.soltar('ercilia');
  ok(a.animSocial === null, 'y al soltarla no se lo devuelve');
}

// ---------------------------------------------------------------- 6. con la gente de verdad (gente.js)
if (va('real')) {
  const b = await crearBanco();
  ok(b.registradas.length === 0, `las ${Object.keys(b.ESC).length} escenas se registran`);
  const peligrosas = ['amanecer-pelea-perdida', 'fiesta-nieve', 'mulas-belisario', 'ramon-raiz', 'truchas-nicanor', 'tito-coihue'];
  const resumen = (r) => `${r.id}: ${JSON.stringify({ t: Math.round(r.t), forzadas: r.forzadas.length, pegadas: r.enEscenaPegada, quietud: r.quietudPegada, tarea: r.tareaFuera })}`;
  for (const id of peligrosas) {
    if (!b.ESC[id]) { ok(false, `existe la escena ${id}`); continue; }
    for (const s of [1, 2, 3, 4]) {
      const r = correrEscena(b, id, { semilla: s * 977 + id.length, saltarEn: s === 4 ? 6 : undefined });
      ok(r.termino, `${id}#${s}: termina`);
      ok(r.enEscenaPegada.length === 0 && r.quietudPegada.length === 0, `${id}#${s}: nadie queda pegado a la escena (${resumen(r)})`);
      ok(s === 4 || r.t < 150, `${id}#${s}: no dura más de 150 s (${Math.round(r.t)} s)`);
      ok(r.forzadas.length === 0, `${id}#${s}: ninguna caminata llega por el límite del director (${resumen(r)})`);
      ok(r.tareaFuera.length === 0, `${id}#${s}: nadie queda haciendo la tarea lejos de su parada (${resumen(r)})`);
      ok(r.diferencias.filter((d) => d.c !== 'camino').length === 0, `${id}#${s}: todo lo que se captura vuelve como estaba (${JSON.stringify(r.diferencias.filter((d) => d.c !== 'camino').slice(0, 3))})`);
    }
  }
  // todas las escenas, una corrida cada una (la mitad saltadas)
  const ids = Object.keys(b.ESC);
  let pegadas = 0, noTermina = 0, forzadas = 0, lentas = 0, tarea = 0;
  for (const id of ids) {
    const r = correrEscena(b, id, { semilla: 5000 + ids.indexOf(id), saltarEn: ids.indexOf(id) % 2 ? 4 : undefined });
    if (r.enEscenaPegada.length || r.quietudPegada.length || r.nanPos.length) pegadas++;
    if (!r.termino) noTermina++;
    if (r.forzadas.length) forzadas++;
    if (r.t > 150 && ids.indexOf(id) % 2 === 0) lentas++;
    if (r.tareaFuera.length) tarea++;
  }
  ok(pegadas === 0 && noTermina === 0, `las ${ids.length} escenas terminan y no dejan a nadie pegado (pegadas ${pegadas}, sin terminar ${noTermina})`);
  ok(forzadas === 0, `ninguna de las ${ids.length} escenas fuerza una caminata (${forzadas})`);
  ok(lentas === 0, `ninguna pasa de 150 s por una caminata larga (${lentas})`);
  ok(tarea === 0, `nadie queda haciendo la tarea lejos de su parada (${tarea})`);
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['escenas-mundo.js', "for (const [k, otra] of captura) if (otra.n === n && !otra.alias) { captura.set(clave, { n, alias: k }); return; }", "", 'la misma persona con dos nombres se captura dos veces', 'alias,real'],
  ['escenas-mundo.js', "const c = captura.get(clave);\n    if (!c) return;\n    captura.delete(clave);\n    if (c.alias) return;", "const c = captura.get(clave);\n    if (!c) return;\n    captura.delete(clave);", 'soltar el alias suelta a la persona', 'alias'],
  ['escenas-mundo.js', "const toma = (clave) => { const c = captura.get(clave); return c?.alias ? (captura.get(c.alias) || null) : (c || null); };", "const toma = (clave) => captura.get(clave) || null;", 'el alias no reenvía los gestos', 'alias'],
  ['escenas-mundo.js', "if (c.paseo) { try { vigilarPaseo(c, dt); } catch (e) { ctx.fallo?.(e, 'escenas-paseo'); } }", "", 'nadie vigila que la caminata avance', 'atasco,real'],
  ['escenas-mundo.js', "if (++p.malos < ATASCO_S) return;", "if (++p.malos < 1e9) return;", 'el rodeo nunca llega a ubicarlo', 'atasco'],
  ['escenas-mundo.js', "if (avance > 0.12) { p.malos = 0; return; }", "if (avance > -1) { p.malos = 0; return; }", 'todo avance cuenta (nunca se atasca)', 'atasco'],
  ['escenas-mundo.js', "if (avance > 0.12) { p.malos = 0; return; }", "if (avance > 50) { p.malos = 0; return; }", 'nada cuenta como avance (se lo ubica al segundo)', 'atasco'],
  ['escenas-mundo.js', "      if (!ctx.T?.agua?.(q.x, q.z)) { n.camino = [", "      if (true) { n.camino = [", 'el rodeo cae en el agua', 'atasco'],
  ['escenas-mundo.js', "      acercarSiEstaLejos(n, d);\n", "", 'el que arranca a 300 m camina los 300', 'lejos,real'],
  ['escenas-mundo.js', "const LEJOS_M = 50, LLEGADA_M = 34, ATASCO_S = 2;", "const LEJOS_M = 5000, LLEGADA_M = 34, ATASCO_S = 2;", 'el tope de distancia nunca se activa', 'lejos'],
  ['escenas-mundo.js', "const LEJOS_M = 50, LLEGADA_M = 34, ATASCO_S = 2;", "const LEJOS_M = 5, LLEGADA_M = 34, ATASCO_S = 2;", 'el tope mueve hasta al que está a 30 m', 'lejos'],
  ['escenas-mundo.js', "      if (ctx.T?.agua?.(x, z)) continue;\n      ubicar(n, { x, z }, null);", "      ubicar(n, { x, z }, null);", 'el punto de llegada puede ser el agua', 'lejos'],
  ['escenas-mundo.js', "&& Math.hypot(n.pos.x - e.x, n.pos.z - e.z) > 1.5) n.espera = 0;", "&& false) n.espera = 0;", 'el de rutina sigue con la tarea donde lo dejó la escena', 'rutina,real'],
  ['escenas-mundo.js', "&& Math.hypot(n.pos.x - e.x, n.pos.z - e.z) > 1.5) n.espera = 0;", "&& true) n.espera = 0;", 'al de rutina que no se movió se le corta la espera', 'rutina'],
  ['escenas-mundo.js', "Array.isArray(n.ruta) && n.ruta.length && n.camino === undefined && n.espera > 0", "n.espera > 0", 'al de horario también se le corta la espera', 'rutina'],
  ['escenas-mundo.js', "    n.animSocial = null; n.__volverA = null;", "", 'el abrazo a medias sigue durante la escena', 'social'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4251a-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = readFileSync(join(raiz, 'src', arch), 'utf8');
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4251_SRC: dir, A4251_CALLADO: '1', A4251_SECCIONES: secc }, encoding: 'utf8', timeout: 300000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.1 (A) NPC trabados en las cinemáticas · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
