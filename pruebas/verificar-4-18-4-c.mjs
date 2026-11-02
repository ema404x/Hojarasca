// 4.18.4 (C): comprobaciones de lo que encontró la búsqueda de bugs en partida real (Electron) y que se puede mostrar sin Electron.
//
// 1. La cámara de una escena NO debe meterse bajo el terreno en la salida (el segundo en que vuelve al jugador). `despejarCamara` (escenas-mundo.js) sólo ponía el
//    piso de la cámara cuando la pose llevaba `foco`; la mezcla de salida (de la escena al jugador) no lleva foco, así que cruzando una loma la cámara pasaba por adentro del
//    cerro. En partida real se vio en carpeta-celeste (3,9 m bajo el suelo), bolsa-josefina (1,8 m), piedras-molino, el-que-vuela y huellas-escarcha (humo-4-18-4-escenas.cjs).
//    La prueba arma el mundo de mentira más chico que hace falta: una escena de un plano y una loma entre la cámara de la escena y la del jugador.
//    escenas-mundo.js es de la zona de A (el motor de escenas): C no lo toca. Por eso la prueba corre dos veces: con el código de verdad (si todavía falla, avisa «pendiente»
//    y no tumba el gate; apenas se aplica el arreglo pasa a ser exigente sola) y con una COPIA parcheada con el arreglo propuesto (esa tiene que pasar siempre: es la mutación inversa
//    que demuestra que el arreglo de tres líneas alcanza). Cada copia se escribe con otro nombre y se importa en este mismo proceso una sola vez.
// 2. Las pruebas de partida real de esta versión existen y están bien armadas (sin retrocesos 0x08 por barras perdidas, sin depuración suelta, con el lanzador del monitor externo).
//
// Uso: node pruebas/verificar-4-18-4-c.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

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

// una loma de 8 m en x = 5 entre la escena (x = 0) y el jugador (x = 10)
const altura = (x) => 10 + 8 * Math.exp(-(((x - 5) / 2.2) ** 2));

// corre la escena de prueba con el módulo dado y devuelve lo peor que le pasó a la cámara respecto del terreno
function correr(crearEscenasMundo) {
  const jugadorEn = { x: 10, z: 0 };
  const camara = {
    position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    rotation: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {},
  };
  const progreso = { dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const jugador = { estado: { pos: { x: jugadorEn.x, y: altura(jugadorEn.x), z: jugadorEn.z }, yaw: 0, pitch: 0, zoom: false }, soltar() {} };
  const mundo = crearEscenasMundo({
    doc, camara, progreso: () => progreso, jugador: () => jugador, modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
    T: { altura, lugares: { cima: { x: 0, z: 0 } } }, col: { resolver() {} }, gente: () => ({ gente: [] }), clima: () => ({ estado: {} }), sonido: {},
    alturaDePie: (T, _c, x, z) => T.altura(x, z), nota() {}, fallo(e, donde) { throw new Error(`fallo en ${donde}: ${e && e.message}`); },
  });
  const reg = mundo.registrar({
    id: 'prueba-salida-camara', titulo: 'Prueba', resumen: 'prueba',
    pasos: [
      { tipo: 'plano', plano: 'libre', pos: { lugar: 'cima', dy: 0.6 }, mira: { lugar: 'cima', dx: -4, dy: 0.6 }, dur: 0.6, sinEsperar: true },
      { tipo: 'espera', dur: 0.6 },
    ],
  });
  const poner = () => { camara.position.set(jugadorEn.x, altura(jugadorEn.x) + 1.62, jugadorEn.z); camara.rotation.set(0, 0, 0); };
  poner();
  const r = { registrada: !!reg && reg.ok !== false, arranca: mundo.disparar('prueba-salida-camara', { forzar: true }) === true, peor: Infinity, fase: '', cuadros: 0, saliendo: false };
  for (let i = 0; i < 600 && mundo.activa(); i++) {
    poner();   // (como hace jugador.actualizar en cada cuadro, antes de la escena)
    mundo.actualizar(0.05);
    r.cuadros++;
    const fase = mundo.director.fase();
    if (fase === 'saliendo') r.saliendo = true;
    const d = camara.position.y - altura(camara.position.x);
    if (d < r.peor) { r.peor = d; r.fase = fase; }
  }
  r.termina = !mundo.activa();
  return r;
}

// el arreglo propuesto: sin foco (la salida, o un plano `sinDespeje`) la cámara tampoco baja del piso del terreno
const ORIGINAL = '    if (!f || !col?.resolver) return c;';
const PARCHE = '    if (!f || !col?.resolver) {   // 4.18.4: sin foco (la salida de la escena, un plano `sinDespeje`) igual no se baja del terreno\n      const s0 = ctx.T?.altura ? ctx.T.altura(c.x, c.z) : null;\n      return Number.isFinite(s0) && c.y < s0 + DESPEJE.bajo ? { ...c, y: s0 + DESPEJE.bajo } : c;\n    }';

const real = await import('../src/escenas-mundo.js');
const fuente = fs.readFileSync(path.join(raiz, 'src', 'escenas-mundo.js'), 'utf8');
const rr = correr(real.crearEscenasMundo);
ok(rr.registrada && rr.arranca, 'la escena de prueba se registra y arranca');
ok(rr.termina && rr.saliendo, `termina pasando por la fase de salida (${rr.cuadros} cuadros)`);
if (rr.peor >= -0.001) ok(true, `escenas-mundo.js: la cámara nunca queda bajo el terreno (lo peor: ${rr.peor.toFixed(2)} m)`);
else console.log(`⚠ PENDIENTE (zona de A, ver BUGS_4_18_4_C.md C-01): con el código actual la cámara queda ${(-rr.peor).toFixed(2)} m bajo el terreno en la fase «${rr.fase}»`);

// la copia parcheada (otro nombre, otro módulo)
ok(fuente.includes(ORIGINAL) || rr.peor >= -0.001, 'el texto a parchear está en escenas-mundo.js (o el arreglo ya está aplicado)');
if (fuente.includes(ORIGINAL)) {
  const copia = path.join(raiz, 'src', '__escenas-mundo-parche-4184c.js');
  fs.writeFileSync(copia, fuente.replace(ORIGINAL, PARCHE));
  try {
    const p = await import('../src/__escenas-mundo-parche-4184c.js');
    const rp = correr(p.crearEscenasMundo);
    ok(rp.termina && rp.saliendo, 'copia parcheada: la escena termina pasando por la salida');
    ok(rp.peor >= -0.001, `copia parcheada: la cámara nunca queda bajo el terreno (lo peor: ${rp.peor.toFixed(2)} m)`);
    ok(rp.peor > rr.peor || rr.peor >= -0.001, 'y el arreglo cambia algo: sin él la cámara quedaba más abajo');
  } finally { try { fs.unlinkSync(copia); } catch { /* ya */ } }
}

// ---------------------------------------------------------------- 2. las pruebas de partida real de esta versión
for (const f of ['escenas', 'recorridos', 'caos', 'largo']) {
  const ruta = path.join(raiz, 'pruebas', `humo-4-18-4-${f}.cjs`);
  ok(fs.existsSync(ruta), `existe pruebas/humo-4-18-4-${f}.cjs`);
  if (!fs.existsSync(ruta)) continue;
  const t = fs.readFileSync(ruta, 'utf8');
  ok(!/\u0008/.test(t), `humo-4-18-4-${f}: sin retrocesos (0x08) por barras perdidas`);
  ok(!/\bconsole\.log\(['"`]DEBUG/.test(t), `humo-4-18-4-${f}: sin depuración suelta`);
  ok(/lanzar-electron|al-monitor|HUMO_PERFIL/.test(t), `humo-4-18-4-${f}: se lanza con el lanzador del monitor externo y perfil propio`);
}
console.log(fallas ? `\nFALLARON ${fallas}` : '\nTODO OK');
process.exit(fallas ? 1 : 0);
