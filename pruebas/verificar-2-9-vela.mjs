// 2.9: el velero, la tirolesa y el puente colgante. Las reglas puras (vela-reglas.js,
// tirolesa-reglas.js), los planos (planos-vehiculos.js, dentro de construccion.js, con
// three de verdad en un vm) y el tendido real de tirolesa.js sobre las colisiones de
// verdad: el puente se camina de punta a punta. Y los enganches en main.js, jugador.js,
// kayak.js y guardado.js (la tecla E y el aviso en el mismo orden).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as V from '../src/vela-reglas.js';
import * as R from '../src/tirolesa-reglas.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// (sin \r: el texto se compara igual con saltos de Windows o de Unix)
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ------------------------------------------------------------------ el velero (reglas)
{
  const vh = V.rumboViento(0);
  assert.ok(Math.abs(V.envolver(vh - Math.PI / 2)) < 0.45, 'el viento del valle sopla hacia +x (el oeste), con su vaivén');
  assert.ok(cerca(V.rumboViento(123, 1.0), 1.0), 'si clima.js trae una dirección, manda esa');
  assert.ok(cerca(V.anguloAlViento(vh + Math.PI, vh), 0), 'proa al viento: ángulo 0');
  assert.ok(cerca(V.anguloAlViento(vh, vh), Math.PI), 'viento de popa: π');
  assert.equal(V.polar(0.3), 0, 'en la proa muerta la vela no empuja');
  assert.ok(V.polar(1.6) > V.polar(1.0) && V.polar(1.0) > V.polar(0.7), 'empuja más a medida que se abre del viento');
  assert.ok(V.polar(Math.PI) < V.polar(1.6), 'de popa anda menos que de través');
  assert.ok(V.escotaIdeal(0.7) < 0.1 && V.escotaIdeal(Math.PI) === 1, 'ciñendo, cazada; de popa, suelta');
  assert.ok(V.rendimientoEscota(V.escotaIdeal(1.6), 1.6) === 1, 'la escota justa rinde todo');
  assert.ok(V.rendimientoEscota(1, 1.0) === 0 && V.flamea(1, 1.0), 'muy suelta flamea y no empuja');
  assert.ok(V.rendimientoEscota(0, 2.6) >= 0.2 && !V.flamea(0, 2.6), 'muy cazada empuja poco, pero no flamea');
  assert.equal(V.estadoVela(0.4, 1.6, 0.45), 'bien puesta');
  assert.equal(V.estadoVela(0.4, 0.3, 0.45), 'proa al viento');
  assert.equal(V.estadoVela(0.4, 1.6, 0.02), 'calma');
  assert.equal(V.amuraDe(vh - Math.PI / 2, vh), V.amuraDe(vh - Math.PI / 2, vh, -1), 'la amura no depende de la anterior si el viento entra claro');
  assert.equal(V.amuraDe(vh - Math.PI / 2, vh), -V.amuraDe(vh + Math.PI / 2, vh), 'del otro bordo, la otra amura');

  const navegar = (rumbo, viento, segundos, entrada = {}, controlar = null) => {
    let e = { x: 0, z: 0, rumbo, vel: 0, giro: 0, escota: 0.5, amura: 1 };
    for (let t = 0; t < segundos; t += 0.05) e = V.pasoVela(e, controlar ? controlar(e, t) : entrada, 0.05, viento, vh);
    return e;
  };
  // de través, con la escota bien puesta a mano (W/S)
  const trimar = (e) => ({ timon: 0, escota: Math.sign(V.escotaIdeal(V.anguloAlViento(e.rumbo, vh)) - e.escota) * (Math.abs(V.escotaIdeal(V.anguloAlViento(e.rumbo, vh)) - e.escota) > 0.02 ? 1 : 0) });
  const traves = navegar(vh - Math.PI / 2, 0.45, 40, null, trimar);
  assert.ok(traves.vel > 2 && Math.hypot(traves.x, traves.z) > 60, `de través con viento normal anda (${traves.vel.toFixed(2)} m/s)`);
  const fuerte = navegar(vh - Math.PI / 2, 0.95, 40, null, trimar);
  assert.ok(fuerte.vel > traves.vel * 1.5, 'con más viento, más rápido');
  const calma = navegar(vh - Math.PI / 2, 0.08, 40, null, trimar);
  assert.ok(calma.vel < 0.3, `en la calma casi no anda (${calma.vel.toFixed(2)} m/s)`);
  const remando = navegar(vh - Math.PI / 2, 0.02, 20, { remo: true });
  assert.ok(remando.vel > 0.6 && remando.vel <= V.VELA.remo + 1e-9, 'con el remo corto se avanza despacio en la calma');
  const contra = navegar(vh + Math.PI, 0.6, 30, { escota: -1 });
  assert.ok(contra.vel < 0.05 && contra.flamea, 'proa al viento no anda: flamea');
  const suelta = navegar(vh - Math.PI / 2, 0.45, 40, { escota: 1 });
  assert.ok(suelta.vel < 0.3 && suelta.flamea, 'con la escota toda suelta, de través, flamea y no anda');
  // el timón: A (izquierda) sube el rumbo, como en el kayak
  const giro = V.pasoVela({ x: 0, z: 0, rumbo: 0, vel: 2, giro: 0, escota: 0.4, amura: 1 }, { timon: -1 }, 0.1, 0.45, vh);
  assert.ok(giro.giro > 0, 'A gira a la izquierda (el rumbo sube), como en el kayak');
  const parado = V.pasoVela({ x: 0, z: 0, rumbo: 0, vel: 0, giro: 0, escota: 0.4, amura: 1 }, { timon: -1 }, 0.1, 0.45, vh);
  assert.ok(parado.giro > 0 && parado.giro < giro.giro, 'parado el timón muerde menos, pero algo gira');
  // bordear: contra el viento directo no se gana nada; en zigzag (ciñendo, virando) sí
  const barlo = (e) => -(e.x * Math.sin(vh) + e.z * Math.cos(vh));   // cuánto se avanzó contra el viento
  let bordo = 1;
  const zigzag = navegar(vh + Math.PI - 0.9, 0.5, 180, null, (e, t) => {
    if (Math.floor(t / 30) % 2 !== (bordo > 0 ? 0 : 1)) bordo = -bordo;
    const objetivo = V.envolver(vh + Math.PI + bordo * 0.9);
    const d = V.envolver(objetivo - e.rumbo);
    return { timon: Math.abs(d) > 0.05 ? -Math.sign(d) : 0, escota: trimar(e).escota };
  });
  assert.ok(barlo(zigzag) > 40, `bordeando se gana barlovento (${barlo(zigzag).toFixed(1)} m)`);
  assert.ok(barlo(contra) < 1, 'derecho contra el viento, no');
  // la deriva: en la calma nada; con viento, un poco hacia donde sopla
  assert.ok(Math.hypot(calma.x, calma.z) < 12);
  // el guardado
  assert.equal(V.sanearVela(null), null);
  assert.equal(V.sanearVela('x'), null);
  assert.equal(V.sanearVela([1, 2]), null);
  assert.equal(V.sanearVela({ x: 'a', z: 3 }), null);
  assert.equal(V.sanearVela({ x: 1e9, z: 3 }), null);
  assert.deepEqual(V.sanearVela({ x: '10', z: 5, rumbo: 'nada' }), { x: 10, z: 5, rumbo: 0 });
  assert.ok(cerca(V.sanearVela({ x: 1, z: 2, rumbo: 7 }).rumbo, V.envolver(7)));
  console.log('✓ velero: viento del oeste, polar, escota, calma y remo, proa muerta, timón y bordear');
}

// ------------------------------------------------------------------ tirolesa y puente (reglas)
{
  assert.ok(cerca(R.alturaCurva(10, 4, 0, 1), 10) && cerca(R.alturaCurva(10, 4, 1, 1), 4) && cerca(R.alturaCurva(10, 10, 0.5, 1), 9), 'la curva pasa por las puntas y baja la comba en el medio');
  assert.equal(R.sentidoTirolesa(10, 5), 'baja');
  assert.equal(R.sentidoTirolesa(5, 5.2), 'llano');
  assert.equal(R.sentidoTirolesa(5, 8), 'sube');
  // bajando acelera; en el llano se va tirando a mano, despacio y parejo
  let s = 0, v = R.TIROLESA.arranque, maxV = 0;
  for (let i = 0; i < 60; i++) { const r = R.avanzarCable(s, v, 0.05, -0.25); s = r.s; v = r.v; maxV = Math.max(maxV, v); }
  assert.ok(maxV > 5, `bajando, la gravedad lleva (${maxV.toFixed(1)} m/s)`);
  const llano = R.avanzarCable(0, 3, 0.05, 0);
  assert.ok(llano.v < 3, 'en el llano se frena');
  const mano = R.avanzarCable(0, R.TIROLESA.velMano, 0.05, 0.05);
  assert.ok(mano.aMano && cerca(mano.v, R.TIROLESA.velMano), 'sin envión, a mano');
  assert.ok(R.avanzarCable(0, 14, 0.05, -0.4, 2).v < 3, 'al final, el freno de resorte');
  assert.ok(R.avanzarCable(0, 20, 0.05, -2).v <= R.TIROLESA.velMax, 'nunca más que el tope');

  // emparejar: cada punta con la más cercana posible; la que queda sola dice por qué
  const puntas = [{ id: 'a', x: 0, y: 0, z: 0 }, { id: 'b', x: 10, y: 0, z: 0 }, { id: 'c', x: 30, y: 0, z: 0 }, { id: 'd', x: 200, y: 0, z: 0 }];
  let r = R.emparejar(puntas, 8, 80, () => ({ ok: true }));
  assert.deepEqual(r.pares.map((p) => [p.a.id, p.b.id]), [['a', 'b']]);
  assert.ok(r.sueltas.has('c') && r.sueltas.has('d') && /Falta la otra punta/.test(r.sueltas.get('d')));
  r = R.emparejar(puntas, 8, 80, (a, b) => (a.id === 'a' && b.id === 'b' ? { ok: false, motivo: 'Hay un árbol en el medio' } : { ok: true }));
  assert.deepEqual(r.pares.map((p) => [p.a.id, p.b.id]), [['b', 'c']], 'si la más cercana no sirve, se prueba la siguiente');
  assert.equal(r.sueltas.get('a'), 'Hay un árbol en el medio', 'y a la que queda sola se le cuenta lo que falló');

  // revisar la línea: cable sobre una ladera que baja, sobre el llano, en rampa, con un árbol
  const ladera = (x) => -0.12 * x;
  const A = { x: -20, y: ladera(-20) + R.TIROLESA.altoCable, z: 0 }, B = { x: 20, y: ladera(20) + R.TIROLESA.altoCable, z: 0 };
  assert.ok(R.revisarLinea('tirolesa', A, B, (x) => ladera(x)).ok, 'en una ladera de 40 m se tiende');
  const llanoA = { x: -39, y: R.TIROLESA.altoCable, z: 0 }, llanoB = { x: 39, y: R.TIROLESA.altoCable, z: 0 };
  assert.match(R.revisarLinea('tirolesa', llanoA, llanoB, () => 0).motivo, /muy bajo/, 'en el llano, 78 m: la comba baja los pies al suelo');
  assert.ok(R.revisarLinea('tirolesa', llanoA, llanoB, (x) => (Math.abs(x) < 34 ? -4 : 0)).ok, 'sobre una quebrada, el llano sí se tiende');
  assert.match(R.revisarLinea('tirolesa', { x: 0, y: 40, z: 0 }, { x: 30, y: 0, z: 0 }, () => -50).motivo, /empinada/);
  assert.match(R.revisarLinea('tirolesa', A, B, ladera, () => true).motivo, /árbol/);
  assert.match(R.revisarLinea('tirolesa', A, { x: 100, y: 0, z: 0 }, ladera).motivo, /Muy lejos/);
  // puente: sobre el arroyo sí; por encima de una loma, no; en rampa, no
  const P = R.PUENTE.altoPiso;
  const arroyo = (x) => (Math.abs(x) < 5 ? -2.5 : 0);
  assert.ok(R.revisarLinea('puente', { x: -8, y: P, z: 0 }, { x: 8, y: P, z: 0 }, arroyo).ok, 'sobre el arroyo se tiende');
  assert.match(R.revisarLinea('puente', { x: -8, y: P, z: 0 }, { x: 8, y: P, z: 0 }, (x) => (Math.abs(x) < 3 ? 1 : 0)).motivo, /toca el suelo/);
  assert.match(R.revisarLinea('puente', { x: -8, y: P, z: 0 }, { x: 8, y: P + 8, z: 0 }, arroyo).motivo, /rampa/);
  assert.ok(R.combaPuente(10) < R.combaPuente(20) && R.combaPuente(100) === R.PUENTE.combaMax, 'la comba del puente crece con el largo, hasta un tope');
  console.log('✓ tirolesa y puente: comba, sentido, gravedad y a mano, freno, emparejar y revisar la línea');
}

// ------------------------------------------------------------------ los planos y el tendido, con three de verdad
const src = path.join(raiz, 'src');
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visitando = new Set(), visitado = new Set();
function visitar(archivo) {
  archivo = path.resolve(archivo); if (visitado.has(archivo)) return;
  if (visitando.has(archivo)) throw Error('ciclo en ' + archivo);
  visitando.add(archivo);
  const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
  info.set(archivo, texto);
  for (const d of deps) visitar(d);
  visitando.delete(archivo); visitado.add(archivo); orden.push(archivo);
}
for (const f of ['construccion.js', 'tirolesa.js', 'colisiones.js']) visitar(path.join(src, f));
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
    const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
    return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += `
;globalThis.__R29 = (() => {
  const C = __mod_construccion, TI = __mod_tirolesa, TR = __mod_tirolesa_reglas, col = __mod_colisiones.crearColisiones();
  const out = {};
  const ids = ['varadero-velero', 'poste-tirolesa', 'estribo-puente'];
  out.planos = ids.map((id) => { const p = C.PLANO[id]; return p ? { id, pieza: !!p.pieza, soloRelax: !!p.soloRelax, categoria: p.categoria, etapas: p.etapas.length, sobreAgua: !!p.sobreAgua } : null; });
  // el terreno: en z ~ 0 un arroyo (|x| < 5); en z ~ 100 una ladera que baja hacia +x; el lago lejos
  const altura = (x, z) => (Math.abs(z - 100) < 30 ? -0.12 * x : Math.abs(x) < 5 ? -2.5 : 0);
  const T = { altura, agua: (x, z) => (Math.abs(z) < 30 && Math.abs(x) < 4.5 ? { nivel: -1.8, prof: 0.7, lago: false } : null),
    normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
  const veg = { arboles: [], despejar() {} };
  const escena = new THREE.Scene();
  const S = C.crearConstruccion(T, escena, col, veg, null);
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999 };
  const armar = (id, x, z, rot = 0) => { S.elegir(C.PLANO[id]); const r = S.fundar(x, z, rot, 0); S.elegir(null); if (!r.ok) return { error: r.motivo };
    for (let k = 0; k < 4 && r.obra.datos.etapas < r.obra.plano.etapas.length; k++) S.avanzar(r.obra, mats); return r.obra; };
  // los tipos de material de cada plano (sólo 0 y 4)
  out.tipos = {};
  for (const id of ids) { const g = new THREE.Group(); const c = new (__mod_geometria.Constructor)(); C.PLANO[id].etapas[0].arma(c, C.PLANO[id]); out.tipos[id] = [...new Set(c.geometria().getAttribute('aTipo').array)]; }
  out.varaderoEnSeco = S.revisarSitio(-40, -60, C.PLANO['varadero-velero'], 0).motivo || 'ok';
  // el puente: dos estribos a los lados del arroyo
  const e1 = armar('estribo-puente', -8, 0), e2 = armar('estribo-puente', 8, 0), e3 = armar('estribo-puente', 60, 0);
  out.estribos = [e1, e2, e3].map((o) => !!o && !o.error && o.datos.etapas === 1);
  const obrasFalsas = { obras: S.obras, get plano() { return null; }, get estadoSitio() { return null; } };
  const notas = [];
  const TIR = TI.crearTirolesas(T, escena, col, veg, null, { obras: () => obrasFalsas, nota: (a, b) => notas.push(a + ' · ' + b) });
  TIR.actualizar(1, null);
  out.lineas = TIR.lineas.map((l) => ({ tipo: l.tipo, largo: +l.largo.toFixed(2) }));
  out.sueltaMotivo = TIR.sueltas.get(e3) || null;
  // se camina: de un estribo al otro, siempre hay tablero bajo los pies y ningún escalón alto
  const puente = TIR.lineas.find((l) => l.tipo === 'puente');
  out.platsPuente = col.plataformas.filter((p) => p.duenio === puente?.duenio).length;
  let y = 0.45, maxPaso = 0, sinPiso = 0, minY = 9;
  for (let x = -8; x <= 8; x += 0.1) {
    const p = col.plataformaEn(x, 0.2, y, 0.62);
    if (!p) { sinPiso++; continue; }
    maxPaso = Math.max(maxPaso, Math.abs(p.alto - y)); y = p.alto; minY = Math.min(minY, y);
  }
  out.camino = { sinPiso, maxPaso: +maxPaso.toFixed(3), minY: +minY.toFixed(2), llega: +y.toFixed(2) };
  // las sogas frenan: desde el medio del puente, caminar de costado choca
  const pos = new THREE.Vector3(0, minY, 0.5);
  col.resolver(pos, 0.35, 1.65); out.baranda = +(pos.z).toFixed(2);
  // la tirolesa: dos postes en la ladera, a 40 m
  const p1 = armar('poste-tirolesa', -20, 100), p2 = armar('poste-tirolesa', 20, 100);
  TIR.actualizar(1, null);
  out.lineas2 = TIR.lineas.map((l) => l.tipo).sort();
  const cable = TIR.lineas.find((l) => l.tipo === 'tirolesa');
  out.cable = cable ? { A: +cable.A.y.toFixed(2), B: +cable.B.y.toFixed(2), largo: +cable.largo.toFixed(1) } : null;
  // E desde el poste de arriba: se larga y llega al de abajo; desde el de abajo, no sube
  const jugador = { estado: { pos: new THREE.Vector3(-20.8, altura(-20.8, 100), 100), vel: new THREE.Vector3(), yaw: 0, enKayak: false, enTren: false },
    ubicar(x, z, yaw) { this.estado.pos.set(x, altura(x, z), z); this.estado.yaw = yaw; this.ubicado = { x, z }; } };
  const a = TIR.accion(jugador);
  out.accionArriba = a?.texto || null;
  a?.hacer();
  out.colgado = !!jugador.estado.enCable;
  let t = 0, maxAlto = 0, minPies = 99;
  while (jugador.estado.enCable && t < 120) { TIR.andar(0.05, jugador); t += 0.05; if (jugador.estado.enCable) minPies = Math.min(minPies, jugador.estado.pos.y - altura(jugador.estado.pos.x, 100)); }
  out.viaje = { t: +t.toFixed(1), llego: !jugador.estado.enCable, x: +jugador.estado.pos.x.toFixed(1), minPies: +minPies.toFixed(2), nota: notas[notas.length - 1] || '' };
  jugador.estado.pos.set(20.8, altura(20.8, 100), 100);
  out.accionAbajo = TIR.accion(jugador)?.texto || null;
  // se desarma un poste: el cable desaparece
  S.desmontarCerca({ x: 20, y: altura(20, 100), z: 100 }, 1.5);
  TIR.actualizar(1, null);
  out.lineas3 = TIR.lineas.map((l) => l.tipo).sort();
  out.posteSuelto = TIR.accion({ estado: { pos: new THREE.Vector3(-20.5, altura(-20.5, 100), 100), enKayak: false } })?.texto || null;
  return out;
})();
`;
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Boolean, Map, Set, WeakMap, WeakSet, Symbol, Error, TypeError, RangeError, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Promise, Proxy, Reflect, parseInt, parseFloat, isFinite, isNaN, performance, setTimeout, clearTimeout };
ctx.globalThis = ctx; ctx.self = ctx; ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'r29.js' });
const r = JSON.parse(JSON.stringify(ctx.__R29));   // del vm, a objetos de acá

assert.deepEqual(r.planos, [
  { id: 'varadero-velero', pieza: true, soloRelax: true, categoria: 'exterior', etapas: 1, sobreAgua: true },
  { id: 'poste-tirolesa', pieza: true, soloRelax: true, categoria: 'exterior', etapas: 1, sobreAgua: false },
  { id: 'estribo-puente', pieza: true, soloRelax: true, categoria: 'exterior', etapas: 1, sobreAgua: false },
], 'los tres planos están en PLANOS, como piezas de Relax en Exterior');
for (const [id, tipos] of Object.entries(r.tipos)) assert.deepEqual(tipos.filter((x) => x !== 0 && x !== 4), [], `${id}: sólo materiales tipo 0/4`);
assert.match(r.varaderoEnSeco, /agua honda/, 'el varadero necesita la punta en el agua honda del lago');
assert.deepEqual(r.estribos, [true, true, true]);
assert.deepEqual(r.lineas.map((l) => l.tipo), ['puente'], 'dos estribos a los lados del arroyo: un puente; el tercero queda solo');
assert.ok(r.lineas[0].largo > 14 && r.lineas[0].largo < 16, `el tablero va de borde a borde (${r.lineas[0].largo} m)`);
assert.match(r.sueltaMotivo, /Falta la otra punta/);
assert.ok(r.platsPuente >= 25, `el tablero tiene plataformas (${r.platsPuente})`);
assert.equal(r.camino.sinPiso, 0, 'de un estribo al otro, siempre hay tablas bajo los pies');
assert.ok(r.camino.maxPaso < 0.1, `sin escalones (${r.camino.maxPaso})`);
assert.ok(r.camino.minY < 0.4 && r.camino.minY > -1, `con su comba (${r.camino.minY})`);
assert.ok(cerca(r.camino.llega, 0.45, 0.02) || r.camino.llega >= 0.4, `y se llega al piso del otro estribo (${r.camino.llega})`);
assert.ok(r.baranda < 0.3, `las sogas de los costados frenan: no se sale del tablero (${r.baranda})`);
assert.deepEqual(r.lineas2, ['puente', 'tirolesa'], 'dos postes en la ladera: la tirolesa');
assert.ok(r.cable && r.cable.A - r.cable.B > 4 && cerca(r.cable.largo, 40, 0.1), `el cable va de 3,6 m sobre cada poste (${JSON.stringify(r.cable)})`);
assert.equal(r.accionArriba, 'Largarse por la tirolesa');
assert.ok(r.colgado, 'E cuelga al jugador del cable');
assert.ok(r.viaje.llego && r.viaje.x > 17 && r.viaje.x < 20 && r.viaje.t < 20, `baja y llega al otro poste (${JSON.stringify(r.viaje)})`);
assert.ok(r.viaje.minPies > 0.2, 'los pies nunca tocan el suelo');
assert.match(r.viaje.nota, /Llegaste al otro poste/);
assert.equal(r.accionAbajo, 'La tirolesa sube desde acá', 'desde abajo no se sube');
assert.deepEqual(r.lineas3, ['puente'], 'desarmado un poste, el cable se va');
assert.equal(r.posteSuelto, 'Poste de tirolesa: falta la otra punta');
console.log('✓ planos (tipo 0/4, sólo Relax), varadero al agua honda, puente caminable con sogas, tirolesa de ida y no de vuelta');

// ------------------------------------------------------------------ los enganches
{
  const cons = leer('src/construccion.js');
  assert.ok(cons.includes("import { PLANOS_VEHICULOS } from './planos-vehiculos.js';") && /^PLANOS\.push\(\.\.\.PLANOS_VEHICULOS\);/m.test(cons), 'construccion.js suma los planos');
  for (const f of ['src/vela.js', 'src/vela-reglas.js', 'src/tirolesa.js', 'src/tirolesa-reglas.js', 'src/planos-vehiculos.js']) {
    const t = leer(f);
    assert.ok(!/OctahedronGeometry/.test(t), `${f}: el three local no trae OctahedronGeometry`);
    assert.ok(!/^export\s+(async function|function\*)|^export\s+.*\bfrom\b|^import\s+['"]/m.test(t), `${f}: armar.mjs no entiende ese import/export`);
    for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) assert.ok(/^[\w$]+$/.test(m[1]), `${f}: ${m[1]} sin eñe`);
  }
  for (const f of ['src/vela-reglas.js', 'src/tirolesa-reglas.js']) assert.ok(!/from 'three'|document\.|window\./.test(leer(f)), `${f} es puro`);
  const g = leer('src/guardado.js');
  assert.ok(g.includes("import { sanearVela } from './vela-reglas.js';") && g.includes('vela: sanearVela(p.vela),'), 'guardado sanea progreso.vela');
  const jug = leer('src/jugador.js');
  assert.ok(jug.includes('if (estado.enCable) {') && jug.includes('opciones.alCable?.(dt);'), 'el jugador colgado del cable');
  assert.ok(jug.includes('if (estado.enVela && opciones.alVela) opciones.alVela(dt, teclaKayak);'), 'arriba del velero manda el velero');
  const kay = leer('src/kayak.js');
  assert.ok(kay.includes('function sumarBote(bote)') && kay.includes('for (const bote of botes) bote.personalizar?.(d);'), 'lo de «Tu kayak y tus botes» llega al velero');
  assert.ok(kay.includes('!js.enKayak && Math.hypot(js.pos.x - est.x'), 'arriba del velero el kayak no se ofrece');
  const main = leer('src/main.js');
  const en = (t) => { const i = main.indexOf(t); assert.ok(i >= 0, `main.js: falta ${t}`); return i; };
  assert.ok(main.includes("import { crearVela } from './vela.js';") && main.includes("import { crearTirolesas } from './tirolesa.js';"));
  assert.ok(main.includes('kayak.sumarBote(vela);') && main.includes('vela.cargar(progreso.vela);'));
  // la tecla E: bajar del velero antes que del kayak; subir al velero y la tirolesa después del kayak
  assert.ok(en('if (js.enVela) {\n        if (!vela.bajar(jugador))') < en('if (js.enKayak) {\n        if (!kayak.bajar(jugador))'), 'E: el velero antes que el kayak');
  assert.ok(en("if (!objetivo && kayak.cerca(js)) { kayak.subir(jugador)") < en('const a = vela?.accion(jugador) || tirolesas?.accion(jugador); if (a) { a.hacer(); break; }'), 'E: el velero y la tirolesa después del kayak');
  // el aviso, en el mismo orden
  assert.ok(en("aviso = { tecla: 'E', texto: 'Bajar del velero' }") < en("aviso = { tecla: 'E', texto: 'Bajar del kayak' }"), 'aviso: el velero antes que el kayak');
  assert.ok(en("aviso = { tecla: 'E', texto: 'Subir al kayak' }") < en('const a = vela?.accion(jugador) || tirolesas?.accion(jugador); if (a) aviso = { tecla: \'E\', texto: a.texto }; }'), 'aviso: el velero y la tirolesa después del kayak');
  assert.ok(main.includes('if (js.enCable) return;') && main.includes('if (js.enCable) aviso = null;'), 'colgado del cable, ni E ni aviso');
  assert.ok(main.includes('progreso.vela = guardadoVela ? guardadoVela.barco : vela.datos();'), 'el velero se guarda');
  assert.ok(/"verify": "[^"]*node pruebas\/verificar-2-9-vela\.mjs/.test(leer('package.json')), 'la prueba está en npm run verify');
  console.log('✓ enganches: construccion, guardado, jugador, kayak y main (E y aviso en el mismo orden)');
}
console.log('OK 2.9 velero, tirolesa y puente colgante');
