// 4.30.0 (A): lo que la gente lleva en la mano.
//  1. `mano` (donde se cuelga la planilla, la caña, la copa, el arco o el martillo) es el PUÑO, no el codo: la planilla de Ercilia y de Josefina (el «anotador» que vio el
//     usuario) quedaba pegada al antebrazo, a 1 cm del codo, y la caña de Nicanor salía de la cintura hacia atrás.
//  2. `orientarEnMano` (gente.js) deja la tabla y la caña con el ángulo que les toca respecto del cuerpo, sea cual sea el del hombro (sus tres giros) y el del codo.
//  3. Con poncho los brazos nacen en el hombro (el antebrazo salía flotando del poncho al saludar).
//  4. La quietud (gente-cuerpo.js) no mete el brazo que lleva la planilla o la caña en la pose (los brazos cruzados con la caña atravesando el pecho) y no corre
//     mientras anota o pesca (`__tareaMano`); en una pose de la aldea (hachar, regar, bailar) la tabla o la caña se guardan y vuelven al terminar.
// Personas de verdad (gente-cuerpo.js en una VM con el three local) y la función real de gente.js. Mutaciones: cada una se arma como otro texto en la VM y
// tiene que hacer fallar su comprobación.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- la VM: three + gente-cuerpo.js (con sus imports) + el bloque de gente.js
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
const THREE_TXT = leer('three-r186-inline.js');
const CUERPO = leer('src/gente-cuerpo.js'), GENTE = leer('src/gente.js');
// el bloque de gente.js: EN_MANO, los temporales y orientarEnMano (de «export const EN_MANO» al cierre de la función)
const bloqueGente = (t) => {
  const i = t.indexOf('export const EN_MANO'), j = t.indexOf('export function orientarEnMano'), k = t.indexOf('\n}\n', j);
  assert.ok(i > 0 && j > i && k > j, 'gente.js: EN_MANO y orientarEnMano');
  return t.slice(i, k + 3).replace(/^export\s+/gm, '');
};
function armar(cuerpo = CUERPO, gente = GENTE) {
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    const texto = f === path.join(src, 'gente-cuerpo.js') ? cuerpo : fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  visitar(path.join(src, 'gente-cuerpo.js'));
  let code = THREE_TXT + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `\nconst __G = (() => {\n${bloqueGente(gente)}\nreturn { EN_MANO, orientarEnMano };\n})();\n`;
  code += ';globalThis.__C = __mod_gente_cuerpo; globalThis.__G = __G; globalThis.__THREE = THREE;';
  let semilla = 7;
  const azar = Object.assign(Object.create(Math), { random: () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; } });   // (la quietud elige al azar: sembrado)
  const ctx = { console, Math: azar, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'gente-4-30-0-a-vm.js' });
  return { C: ctx.__C, G: ctx.__G, THREE: ctx.__THREE };
}

// ---------------------------------------------------------------- las comprobaciones (cada una devuelve [ok, texto])
const COMPROBAR = {
  // 1. la mano es el puño: a lo largo del antebrazo, lejos del codo y cerca de la palma
  puno({ C, THREE }) {
    const p = C.crearPersona({ ropa: '#7f5a45', abrigo: '#594138' }, 'ercilia', false, {}, {});
    p.g.updateMatrixWorld(true);
    const cd = p.brazos[1].userData.codo, codo = new THREE.Vector3(), mano = new THREE.Vector3();
    cd.getWorldPosition(codo); p.mano.getWorldPosition(mano);
    const bajo = codo.y - mano.y, lejos = codo.distanceTo(mano);
    // y con el codo doblado 90°, la mano va adelante del codo (sigue al antebrazo)
    cd.rotation.x = -Math.PI / 2; p.g.updateMatrixWorld(true);
    cd.getWorldPosition(codo); p.mano.getWorldPosition(mano);
    const adelante = mano.z - codo.z;
    cd.rotation.x = 0;
    return [bajo > 0.22 && bajo < 0.32 && lejos < 0.33 && adelante > 0.22, `el puño a ${bajo.toFixed(3)} m debajo del codo (${lejos.toFixed(3)} m) y, doblado, ${adelante.toFixed(3)} m adelante`];
  },
  // 2. la tabla y la caña, con el ángulo del cuerpo, con el brazo como sea (también con los tres giros de la quietud)
  angulos({ G, THREE }) {
    const fallas = [];
    const g = { brazos: [new THREE.Group(), new THREE.Group()] }, b = g.brazos[1], cd = new THREE.Group(), mano = new THREE.Group();
    b.add(cd); b.userData.codo = cd; cd.add(mano); mano.position.set(0.006, -0.26, 0.03);
    g.planilla = new THREE.Object3D(); g.caña = new THREE.Object3D(); mano.add(g.planilla); mano.add(g.caña);
    const raiz = new THREE.Group(); raiz.add(b);
    const casos = [[0, 0, 0, 0], [-0.55, 0, 0, -1.3], [-1.2, 0, 0, -0.8], [0.3, 0.2, 0.1, -0.2], [-0.62, -1.3, -0.06, -2.05], [0.5, -1.45, 0.08, -1.3]];
    const eje = (o, v) => { o.updateWorldMatrix(true, false); const q = new THREE.Quaternion(); o.getWorldQuaternion(q); return v.clone().applyQuaternion(q); };
    for (const [x, y, z, codo] of casos) {
      b.rotation.order = 'XZY'; b.rotation.set(x, y, z); cd.rotation.set(codo, 0, 0);
      for (const anota of [false, true]) {
        G.orientarEnMano(g, anota, false);
        const q = anota ? G.EN_MANO.planilla.anotando : G.EN_MANO.planilla.colgando;
        const arriba = eje(g.planilla, new THREE.Vector3(0, 1, 0)), quiere = new THREE.Vector3(0, Math.cos(q.a), Math.sin(q.a));
        if (arriba.distanceTo(quiere) > 1e-6) fallas.push(`planilla ${anota ? 'anotando' : 'colgando'} con el brazo ${[x, y, z, codo]}: ${arriba.toArray().map((v) => v.toFixed(3))}`);
        // el centro de la tabla, respecto del puño en el cuerpo: `d` a lo largo de su eje y `x` de costado
        const c = new THREE.Vector3(), m = new THREE.Vector3(); g.planilla.getWorldPosition(c); mano.getWorldPosition(m);
        const esperado = quiere.clone().multiplyScalar(q.d); esperado.x += q.x;
        if (c.sub(m).distanceTo(esperado) > 1e-6) fallas.push(`planilla ${anota ? 'anotando' : 'colgando'}: el centro corrido`);
      }
      for (const pesca of [false, true]) {
        G.orientarEnMano(g, false, pesca);
        const a = pesca ? G.EN_MANO.caña.pescando + G.EN_MANO.caña.tiron * (x + 0.75) : G.EN_MANO.caña.quieta;
        const v = eje(g.caña, new THREE.Vector3(0, 1, 0));
        if (v.distanceTo(new THREE.Vector3(0, Math.cos(a), Math.sin(a))) > 1e-6) fallas.push(`caña ${pesca ? 'pescando' : 'quieta'} con el brazo ${[x, y, z, codo]}`);
      }
    }
    return [!fallas.length, fallas.join(' · ') || 'la tabla y la caña con su ángulo en 6 posturas del brazo'];
  },
  // 3. la quietud: con la planilla a la vista, el brazo derecho no entra; anotando, no hay quietud
  quietud({ C, THREE }) {
    const p = C.crearPersona({ ropa: '#7e8c5a', abrigo: '#4a5a34' }, 'ema', false, {}, {});
    const prueba = (extra) => {
      const g = { ...p, pos: p.g.position, fase: 0, posesM: ['cruzados'], vel: 0, ...extra };
      g.__mira = undefined;
      const cam = { position: new THREE.Vector3(50, 1.6, 50) };
      for (const br of g.brazos) { br.rotation.set(0, 0, 0); br.userData.codo && br.userData.codo.rotation.set(0, 0, 0); }
      let der = 0, izq = 0;   // (lo más doblado que llegó a estar cada codo: la quietud elige y suelta poses al azar)
      for (let i = 0; i < 300; i++) { for (const br of g.brazos) { br.rotation.x = 0; br.rotation.z = 0; } p.alPosar(g, 0.1, cam, false, false); der = Math.min(der, g.brazos[1].userData.codo.rotation.x); izq = Math.min(izq, g.brazos[0].userData.codo.rotation.x); }
      return { der, izq };
    };
    const sinNada = prueba({ __quietud: 'cruzados' });
    const conTabla = prueba({ __quietud: 'cruzados', planilla: { visible: true } });
    const guardada = prueba({ __quietud: 'cruzados', planilla: { visible: false } });
    const anotando = prueba({ planilla: { visible: true }, __tareaMano: true, posesM: ['cruzados', 'cintura', 'atras'] });
    const r = sinNada.der < -1.5 && conTabla.der > -0.5 && conTabla.izq < -1.5 && guardada.der < -1.5 && anotando.der > -0.5 && anotando.izq > -0.5;
    return [r, `cruzados: sin nada ${sinNada.der.toFixed(2)}, con la tabla der ${conTabla.der.toFixed(2)} izq ${conTabla.izq.toFixed(2)}, tabla guardada ${guardada.der.toFixed(2)}, anotando ${anotando.der.toFixed(2)}/${anotando.izq.toFixed(2)}`];
  },
  // 5. con poncho, los dos brazos nacen en el hombro (antes en el codo: al saludar el antebrazo salía flotando del poncho). Las personas se arman fundidas en una
  // sola malla con piel: se mira el armado de la figura (texto) y que siga armando a alguien de poncho sin romperse
  poncho({ C }, cuerpo = CUERPO) {
    const brazo = /\? \[\[-l \* 0\.03, 0\.0, 0\], \[-l \* 0\.01, -0\.03, 0\], \[l \* 0\.002, -0\.14, 0\.0\], \[l \* 0\.006, -0\.26, 0\.004\]/.test(cuerpo);
    const mate = /\? \[\[\[-l \* 0\.03, 0\.0, 0\], \[-l \* 0\.01, -0\.03, 0\], \[l \* 0\.002, -0\.14, 0\.0\], \[codoP\[0\], -0\.24, 0\.0\]/.test(cuerpo);
    let arma = false;
    try { const p = C.crearPersona({ poncho: true, ropa: '#6a5a4a' }, 'ramon', true, {}, {}); const q = C.crearPersona({ poncho: true }, 'nicanor', false, {}, { invierno: true }); arma = !!(p.g && q.g && p.mano && q.mano); } catch { arma = false; }
    // y con poncho no cruza los brazos (ni cintura, juntas, delantal, atrás): los antebrazos atravesaban el poncho; la del gorro (un brazo arriba) sí
    const pose = (nombre) => {
      const p = C.crearPersona({ poncho: true }, 'nicanor', false, {}, { invierno: true });
      const g = { ...p, pos: p.g.position, fase: 0, vel: 0, __quietud: nombre }, cam = { position: { x: 50, y: 1.6, z: 50 } };
      let min = 0;
      for (let i = 0; i < 60; i++) { for (const br of g.brazos) { br.rotation.x = 0; br.rotation.z = 0; } p.alPosar(g, 0.1, cam, false, false); for (const br of g.brazos) if (br.userData.codo) min = Math.min(min, br.userData.codo.rotation.x); }
      return min;
    };
    const quietas = ['cruzados', 'cintura', 'juntas', 'atras'].map(pose), gorro = pose('gorro');
    const sinCruzar = quietas.every((v) => v > -0.5) && gorro < -1.5;
    return [brazo && mate && arma && sinCruzar, `con poncho, el brazo (y el del mate) desde el hombro, se arma, y no cruza los brazos (codo ${quietas.map((v) => v.toFixed(2))}; el gorro ${gorro.toFixed(2)})`];
  },
  // 6. Ramón sale y entra de su puesto por la puerta: los puntos de paso entre el banco (adentro) y la leña (afuera), a la ida y al revés a la vuelta (el recorrido
  // se vio en la partida real: dos vueltas sin trabarse ni saltar; acá, que la ruta los tenga en orden)
  ramon(_v, gente = GENTE) {
    const m = gente.match(/export const PASO_RAMON = \{ quieto: ([\d.]+), puntos: (\[\[.*?\]\]) \};/);
    const pts = m ? JSON.parse(m[2]) : [];
    const ruta = /\{ \.\.\.ubicarJunto\(base, rot, 1\.55, 2\.62\), quieto: 14, mirar: base \},\n\s*\.\.\.\(L\.puesto \? ida : \[\]\),\n\s*\{ \.\.\.ubicarJunto\(base, rot, 3\.4, -1\.6\), quieto: 9 \},\n\s*\.\.\.\(L\.puesto \? vuelta : \[\]\),\n\s*\{ \.\.\.ubicarJunto\(base, rot, -0\.65, 3\.18\)/.test(gente);
    const idaVuelta = /const ida = PASO_RAMON\.puntos\.map\(paso\), vuelta = PASO_RAMON\.puntos\.slice\(\)\.reverse\(\)\.map\(paso\);/.test(gente);
    // la espera en cada punto de paso, mínima (con 0, `quieto || 8` lo dejaba 8 s parado en la puerta)
    const r = !!m && Number(m[1]) > 0 && Number(m[1]) < 0.2 && pts.length >= 3 && Math.hypot(pts[0][0] - 0.75, pts[0][1] - 5) < 0.6 && ruta && idaVuelta;
    return [r, `Ramón: ${pts.length} puntos de paso por la puerta, a la ida y a la vuelta`];
  },
  // 4. el enganche en gente.js (texto: el bucle de la gente no corre en Node)
  enganche(_v, gente = GENTE) {
    const r = /g\.__tareaMano = !!\(tarea && \(\(tarea\.anotando && g\.planilla\) \|\| \(tarea\.pescando && g\.caña\)\)\);/.test(gente)
      && /orientarEnMano\(g, anota, !!\(tarea && tarea\.pescando && g\.caña\) && !charlando\);/.test(gente)
      && /const deja = !!g\.pose && !andando, cosa = g\.planilla \|\| g\.caña;/.test(gente)
      && /else if \(!deja && g\.__enManoDejado\) \{ cosa\.visible = true;/.test(gente)
      && /npc\.planilla = tabla;\n {4}orientarEnMano\(npc, false, false\);/.test(gente)
      && !/palo\(lam\('#5a4530'\), 0\.012, 2\.1, \[0, 0\.95, 0\], \[0\.35/.test(gente);
    return [r, 'gente.js: orienta cada pose, quietud apagada al anotar o pescar, la tabla o la caña guardadas en las poses de la aldea'];
  },
};

const bien = armar();
for (const [n, f] of Object.entries(COMPROBAR)) { const [r, t] = f(bien); ok(r, `${n}: ${t}`); }
// (y la copa del casamiento, centrada en el puño)
ok(leer('src/amor-mundo.js').includes('m.position.set(0, -0.05, 0.02);'), 'amor-mundo.js: la copa, en el puño');
ok(!/\r/.test(GENTE) && !/\r/.test(CUERPO), 'fines de línea LF');

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['puno', 'el puño de vuelta en el codo', (c) => c.replace('a.position.set(P[0], P[1], P[2]);', 'a.position.set(0, -0.01, 0);'), null],
  ['puno', 'el puño sin el codo (en el hombro)', (c) => c.replace('cd.add(a); a.position.set', 'a.position.set'), null],
  ['angulos', 'sin deshacer el codo', null, (g) => g.replace('if (cd) _qManoInv.multiply(cd.quaternion);', '')],
  ['angulos', 'sin la inversa', null, (g) => g.replace('_qManoInv.invert();', '')],
  ['angulos', 'sólo el giro adelante del hombro', null, (g) => g.replace('_qManoInv.copy(b.quaternion);', '_qManoInv.setFromEuler(new THREE.Euler(b.rotation.x, 0, 0));')],
  ['angulos', 'el centro de la tabla sin girar', null, (g) => g.replace('p.position.copy(_vObjeto.applyQuaternion(_qManoInv));', 'p.position.copy(_vObjeto);')],
  ['angulos', 'la caña sin el tirón', null, (g) => g.replace('EN_MANO.caña.pescando + EN_MANO.caña.tiron * ((Number(b.rotation.x) || 0) + 0.75)', 'EN_MANO.caña.pescando')],
  ['quietud', 'la quietud con el brazo de la tabla', (c) => c.replace('if (!d || b.userData.muneca || (enMano && s === 1)) return;', 'if (!d || b.userData.muneca) return;'), null],
  ['quietud', 'quietud anotando', (c) => c.replace(' && !g.__tareaMano) {', ') {'), null],
  ['quietud', 'la tabla guardada cuenta como en la mano', (c) => c.replace("(g.planilla && g.planilla.visible !== false)", '(g.planilla)'), null],
  ['poncho', 'el brazo con poncho desde el codo', (c) => c.replace("? [[-l * 0.03, 0.0, 0], [-l * 0.01, -0.03, 0], [l * 0.002, -0.14, 0.0], [l * 0.006, -0.26, 0.004]", '? [[l * 0.006, -0.26, 0.004]').replace('[0.026, 0.034, 0.035, 0.038, 0.037, 0.034, 0.028]', '[0.038, 0.037, 0.034, 0.028]'), null],
  ['poncho', 'el brazo del mate con poncho desde el codo', (c) => c.replace('? [[[-l * 0.03, 0.0, 0], [-l * 0.01, -0.03, 0], [l * 0.002, -0.14, 0.0], [codoP[0], -0.24, 0.0]', '? [[[codoP[0], -0.24, 0.0]').replace('[0.026, 0.034, 0.035, 0.042, 0.045, 0.044, 0.042, 0.036]', '[0.042, 0.045, 0.044, 0.042, 0.036]'), null],
  ['poncho', 'con poncho cruza los brazos', (c) => c.replace('const P = g.conPoncho && PONCHO_SIN_POSE.has(q.nombre) ? null : POSES[q.nombre];', 'const P = POSES[q.nombre];'), null],
  ['ramon', 'Ramón sin los puntos de ida', null, (g) => g.replace('...(L.puesto ? ida : []),', '')],
  ['ramon', 'Ramón sin dar vuelta los de la vuelta', null, (g) => g.replace('vuelta = PASO_RAMON.puntos.slice().reverse().map(paso)', 'vuelta = PASO_RAMON.puntos.map(paso)')],
  ['ramon', 'Ramón con espera 0 en la puerta', null, (g) => g.replace('export const PASO_RAMON = { quieto: 0.01,', 'export const PASO_RAMON = { quieto: 0,')],
  ['enganche', 'sin __tareaMano', null, (g) => g.replace('g.__tareaMano = !!(tarea', 'g.__tareaManoX = !!(tarea')],
  ['enganche', 'sin devolver la tabla después de la pose', null, (g) => g.replace('else if (!deja && g.__enManoDejado) { cosa.visible = true;', 'else if (!deja && g.__enManoDejado) {')],
];
let mut = 0;
for (const [cual, nombre, mc, mg] of MUT) {
  const c = mc ? mc(CUERPO) : CUERPO, g = mg ? mg(GENTE) : GENTE;
  assert.ok(c !== CUERPO || g !== GENTE, `la mutación «${nombre}» no cambió nada`);
  let r;
  try { r = cual === 'enganche' ? COMPROBAR.enganche(null, g)[0] : cual === 'ramon' ? COMPROBAR.ramon(null, g)[0] : cual === 'poncho' ? COMPROBAR.poncho(armar(c, g), c)[0] : COMPROBAR[cual](armar(c, g))[0]; } catch { r = false; }
  ok(!r, `mutación «${nombre}»: su comprobación tiene que fallar`);
  mut++;
}
console.log(`verificar-4-30-0-a: ${pasos} comprobaciones, ${mut} mutaciones (todas fallan)`);
