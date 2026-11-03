// 4.24.1 (B): la primera hora a ojo (lo que quedó de la 4.24.0). Cada arreglo tiene su mutación (la misma prueba sobre una copia de src/ con el arreglo deshecho
// tiene que fallar):
//   1. la silueta del anochecer de la primera hora se LEE: más cerca (pero sin huir), más alta, adelante de donde mirás, en el terreno más alto de los posibles y con
//      los ojos prendidos; la de los capítulos 6 a 8 no cambia
//   2. el plano de Elsa en el andén (encuadre)
//   3. la leña y las botas: forma y colocación a la vista de la puerta
//   4. los indicios de los capítulos 2 a 4: sin frases repetidas con otras escenas y con el tono del guion
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, D, ES, ESC, imp, nuevaPartida, rng } from './ayuda-4-18-4-historia.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

const PR = await imp('historia-presencia.js'), TX1 = await imp('historia-texto-acto1.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4241_SECCIONES ? new Set(process.env.A4241_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4241_CALLADO) console.log('FALLA ' + t); } };

const duendesJs = leer('historia-duendes.js'), presenciaJs = leer('historia-presencia.js');
const IDS = H.CAPITULOS.map((c) => c.id);
function armar(cap, o = {}) {
  const { P, X } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(cap);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: o.fase || 'jugando', empezada: 1 });
  P.horas = o.horas ?? 19; P.dia = 5; h.base = { dia: 5 };
  return { P, X, h };
}

// ---------------------------------------------------------------- 1. la silueta se lee
// Un mundo de mentira: el jugador en el origen mirando a `rumbo`; `altura` y `azar` a gusto; guarda lo que se le pide al duende.
function presencia(capId, o = {}) {
  const a = armar(capId, { horas: o.hora ?? 19 });
  const pedidos = [], candidatos = [];
  const duendes = [];
  const dh = {
    listo: () => true,
    aparecer: (tipo, p) => { pedidos.push({ tipo, ...p }); const d = { estado: 'mirando', posicion: { x: p.x, z: p.z }, huir() { this.estado = 'fuera'; }, reir() {}, saludar() {}, quitar() { this.estado = 'fuera'; } }; duendes.push(d); return d; },
    reir() {},
  };
  const alt = o.altura || (() => 0);
  const ctx = {
    dh, escena: { add() {}, remove() {} }, historia: () => a.h, jugador: () => ({ x: 0, z: 0 }), rumbo: () => o.rumbo ?? 0.7, altura: alt, hora: () => o.hora ?? 19, dia: () => 5, libre: () => true,
    enTierra: (x, z) => { candidatos.push({ x, z }); return o.enTierra ? o.enTierra(x, z) : true; }, cercaDeArbol: () => true, refugio: () => ({ x: 0, z: 0 }), galpon: () => null, cobrar() {}, nota() {}, guardar() {},
    azar: o.azar || rng(7), indicio() {},
  };
  const consultas = [];
  if (o.despejada) ctx.despejada = (x, z) => { consultas.push({ x, z }); return o.despejada(x, z); };
  const p = PR.crearPresencia(ctx);
  return { a, p, pedidos, candidatos, duendes, consultas };
}
if (va('silueta')) {
  const S = PR.SILUETA_SUAVE, T = PR.TIEMPOS;
  ok(S && Array.isArray(S.dist) && S.dist.length === 2, 'SILUETA_SUAVE existe con su rango de distancias');
  ok(S.dist[0] > T.huyeSinTrato + 1, `nunca nace dentro del umbral de huida (${S.dist[0]} m contra ${T.huyeSinTrato} m): no se esfuma al aparecer`);
  ok(S.dist[1] <= T.distSilueta[0], `más cerca que la del acto II (hasta ${S.dist[1]} m contra desde ${T.distSilueta[0]} m)`);
  ok(S.dist[1] <= 26 && S.dist[0] >= 17, 'entre 17 y 26 m: a la vista, pero a lo lejos (no un cartel)');
  ok(S.escala > PR.ESCALA_SILUETA && S.escala <= 2.3, `un poco más alta que la del acto II (${S.escala} contra ${PR.ESCALA_SILUETA}), todavía del alto de un chico grande`);
  ok(S.abanico > 0.3 && S.abanico < 0.9, `en un abanico más angosto que el de siempre (${S.abanico} contra 0,9): adelante de donde mirás`);
  ok(S.pisoNoche > 0 && S.pisoNoche < 0.8, 'con los ojos prendidos al anochecer, sin que sea un faro');
  ok(S.candidatos >= 3, 'elige entre varios lugares posibles');

  for (const capId of ['bolsa', 'mesa', 'ramal']) {
    const t = presencia(capId);
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    const q = t.pedidos[0];
    ok(!!q, `${capId}: aparece una silueta`);
    if (!q) continue;
    const d = Math.hypot(q.x, q.z), ang = Math.atan2(q.x, q.z);
    ok(d >= S.dist[0] - 1e-6 && d <= S.dist[1] + 1e-6, `${capId}: a ${d.toFixed(1)} m (entre ${S.dist.join(' y ')})`);
    ok(Math.abs(ang - 0.7) <= S.abanico + 1e-6, `${capId}: dentro del abanico de lo que mirás (${(ang - 0.7).toFixed(2)} rad)`);
    ok(q.escala === S.escala && q.pisoNoche === S.pisoNoche && q.mira === true, `${capId}: con la escala y los ojos de la primera hora`);
  }
  { // sobre el terreno más alto de los posibles (así asoma del pasto)
    const alt = (x, z) => 0.01 * x + 0.02 * z + 0.03 * Math.sin(x * 3);
    let bien = 0;
    for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const t = presencia('bolsa', { altura: alt, azar: rng(semilla) });
      for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
      const q = t.pedidos[0];
      const lista = t.candidatos.slice(0, S.candidatos);   // (las tentativas, todas con tierra y árbol cerca)
      const mejor = Math.max(...lista.map((c) => alt(c.x, c.z)));
      if (q && lista.length === S.candidatos && Math.abs(alt(q.x, q.z) - mejor) < 1e-9) bien++;   // (y miró los S.candidatos, no uno solo)
    }
    ok(bien === 8, `elige el lugar más alto de los ${S.candidatos} primeros (${bien} de 8 semillas)`); }
  { // la silueta de la primera hora se ve: sólo en lugares despejados (sin tronco pegado ni en la línea)
    const t = presencia('bolsa', { despejada: (x, z) => x > 8 });
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    ok(t.consultas.length > 0 && t.pedidos.length >= 1 && t.pedidos.every((q) => q.x > 8), `sólo nace donde está despejado (${t.pedidos.length} pedido(s), ${t.consultas.length} consultas)`);
    const u = presencia('bolsa', { despejada: () => false });
    for (let i = 0; i < 220; i++) u.p.actualizar(0.2);
    ok(u.pedidos.length === 0, 'si no hay un lugar despejado no aparece (y reintenta, no se traba)');
    const v = presencia('perdido', { despejada: () => false });
    for (let i = 0; i < 300; i++) v.p.actualizar(0.2);
    ok(v.pedidos.length >= 1 && v.consultas.length === 0, 'la silueta de los capítulos 6 a 8 no usa esa regla (sigue entre los árboles)');
    ok(enUnaLinea(leer('main.js'), ['despejada: (x, z) =>', 'col.resolver(p, r, 1.0)', 'if (!libre(x, z, 1.1)) return false;', 'libre(j.x + dx * k / n, j.z + dz * k / n, 0.5)']), 'main.js la arma con el mundo de colisiones'); }
  { // si sólo sirve un lugar, ese
    let k = 0;
    const t = presencia('bolsa', { enTierra: () => (++k % 5 === 0) });
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    ok(t.pedidos.length >= 1, 'aunque casi todo el terreno esté mojado, aparece en uno que sirve'); }
  { const t = presencia('bolsa', { enTierra: () => false });
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    ok(t.pedidos.length === 0, 'sin tierra firme no aparece (y no se traba)'); }
  { // la silueta de la primera hora no huye al nacer: dura sus segundos
    const t = presencia('bolsa');
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    ok(t.duendes.length >= 1 && t.duendes[0].estado === 'mirando', 'queda mirando, a su distancia'); }
  // la presencia de siempre (capítulos 6 a 8) no cambió
  for (const capId of ['perdido', 'cosecha']) {
    const t = presencia(capId);
    for (let i = 0; i < 300; i++) t.p.actualizar(0.2);
    const q = t.pedidos.find((x) => x.escala === PR.ESCALA_SILUETA);
    const d = q && Math.hypot(q.x, q.z);
    ok(q && d >= T.distSilueta[0] - 1e-6 && d <= T.distSilueta[1] + 1e-6 && !q.pisoNoche, `${capId}: la silueta del acto II sigue igual (${d && d.toFixed(1)} m, escala ${q && q.escala}, sin ojos prendidos)`);
  }
  { // la silueta ya (herramienta de las partidas de prueba)
    const t = presencia('bolsa');
    ok(typeof t.p.forzarSilueta === 'function' && t.p.forzarSilueta() === true && t.pedidos.length === 1 && t.p.silueta() !== null, 'forzarSilueta pone una con las reglas del capítulo');
    t.p.forzarSilueta(); ok(t.duendes[0].estado === 'fuera' && t.p.silueta() === t.duendes[1], 'y una segunda reemplaza a la primera'); }
  // los ojos: el duende de la Historia toma la «noche» mínima que se le pide
  ok(enUnaLinea(duendesJs, ['pisoNoche: Number.isFinite(o.pisoNoche)']), 'historia-duendes.js guarda el piso de noche de cada duende');
  ok(enUnaLinea(duendesJs, ['e.noche = Math.max(n, s.pisoNoche)']), 'y los ojos y la mirada lo usan en cada cuadro');
  ok(enUnaLinea(presenciaJs, ['pisoNoche: S ? S.pisoNoche : 0']), 'la presencia lo pide sólo en la primera hora');
}


// ---------------------------------------------------------------- 2. el plano de Elsa en el andén
if (va('elsa')) {
  const trochita = leer('trochita.js'), main = leer('main.js'), acto1 = leer('historia-escenas-acto1.js');
  // la geometría del andén (trochita.js, construirParada): el marco local tiene x paralelo a la vía y z alejándose; el punto «estacion» de la Historia es el centro del andén
  ok(enUnaLinea(trochita, ['const bordeAnden = 1.15']) && enUnaLinea(trochita, ['const anchoAnden = 3.6']) && enUnaLinea(trochita, ['[-3.4, 0, 3.4]']) && enUnaLinea(trochita, ['bordeAnden + 0.6']), 'los números del andén que usa la prueba son los de trochita.js');
  const CENTRO = 1.15 + 3.6 / 2;                 // el punto «estacion» está a 2,95 m de la vía
  const POSTES = [-3.4, 0, 3.4].map((x) => ({ x, z: 1.15 + 0.6 - CENTRO }));   // (en el marco del punto «estacion»)
  const PARED = 6.0 - 5 / 2 - CENTRO;            // el frente del galpón (Z0 - D/2)
  const VIA = -CENTRO;
  const e = ESC['elsa-anden'];
  const planos = e.pasos.filter((p) => p.tipo === 'plano');
  const libres = planos.filter((p) => p.plano === 'libre');
  ok(libres.length >= 2, 'los planos del andén son libres, puestos en el marco del andén (no «desde el jugador», que cae donde sea)');
  ok(!planos.some((p) => p.desde === 'jugador' && p.a === 'elsa'), 'ningún plano de Elsa sale «desde el jugador»');
  const aparece = e.pasos.find((p) => p.tipo === 'gesto' && p.accion === 'aparecer' && p.quien === 'elsa');
  const A = aparece && aparece.a;
  ok(A && A.lugar === 'estacion' && Number.isFinite(A.lx) && Number.isFinite(A.lz), 'Elsa aparece en el marco del andén (lx, lz)');
  if (A) {
    ok(A.lz > VIA + 0.9 && A.lz < PARED - 0.3, `Elsa está sobre el andén, entre el filo y el frente del galpón (lz ${A.lz} entre ${(VIA + 0.9).toFixed(2)} y ${(PARED - 0.3).toFixed(2)})`);
    const aPoste = Math.min(...POSTES.map((p) => Math.hypot(p.x - A.lx, p.z - A.lz)));
    ok(aPoste > 1.1, `y a más de 1,1 m de cualquier poste (${aPoste.toFixed(2)} m): se la ve entera`);
    ok(aparece.mira && aparece.mira.lugar === 'estacion' && aparece.mira.lz < A.lz - 4, 'mirando hacia la vía');
    const medio = libres[libres.length - 1];
    const C = medio.pos;
    ok(C.lugar === 'estacion' && C.lz < VIA - 1.5, `el plano de cerca se toma del otro lado de la vía (lz ${C.lz} contra la vía en ${VIA.toFixed(2)})`);
    ok(C.dy >= 1.5 && C.dy <= 1.9, 'a la altura de los ojos');
    // la línea de la cámara a Elsa pasa lejos de los postes (el alero está a 3 m; la cámara y Elsa, por debajo)
    const dist = (P) => { const dx = A.lx - C.lx, dz = A.lz - C.lz, t = ((P.x - C.lx) * dx + (P.z - C.lz) * dz) / (dx * dx + dz * dz); const q = { x: C.lx + dx * Math.max(0, Math.min(1, t)), z: C.lz + dz * Math.max(0, Math.min(1, t)) }; return Math.hypot(P.x - q.x, P.z - q.z); };
    const lib = Math.min(...POSTES.map(dist));
    ok(lib > 0.8, `y entre la cámara y Elsa no hay ningún poste (pasa a ${lib.toFixed(2)} m del más cercano)`);
    ok(medio.mira && medio.mira.ref === 'elsa' && medio.mira.dy >= 1.2 && medio.mira.dy <= 1.7, 'el plano mira a Elsa a la altura del pecho y la cara');
    const larga = libres[0];
    ok(larga.pos.lz < VIA - 4 && larga.pos.dy > 2, 'el plano largo es desde afuera y más alto, con el valle atrás');
  }
  { // el plano compilado: la cámara se mantiene a la altura de los ojos de principio a fin (sin posFin, el plano libre perdía el dy y bajaba al piso en el segundo siguiente)
    const EN = ES;
    const mundo = { posicion: (r) => (r === 'elsa' || r?.ref === 'elsa' ? { x: 10, z: 10, y: 0.6 } : { x: 0, z: 0 }), suelo: () => 0 };
    for (const [i, p] of libres.entries()) {
      const f = EN.compilarPlano(p, { mundo, base: null });
      const ys = [0, 0.5, 1].map((u) => f(u)?.y);
      ok(ys.every((y) => Number.isFinite(y) && y >= 1.5 && y <= 4), `el plano libre ${i + 1} del andén se mantiene entre 1,5 y 4 m de alto de principio a fin (${ys.map((y) => y && y.toFixed(2)).join(', ')})`);
    } }
  // el marco del lugar: lx sigue la vía y lz se aleja (la cuenta de aMundo de la parada)
  const EM = await imp('escenas-mundo.js');
  const T = { altura: () => 0, lugares: {} };
  const falso = () => new Proxy(function () {}, { get(_t, k) { if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } }; if (k === 'style' || k === 'dataset') return {}; if (k === 'children') return []; if (k === Symbol.iterator) return undefined; return () => falso(); }, set() { return true; } });
  const doc = { head: falso(), body: falso(), createElement: () => falso(), pointerLockElement: null, getElementById: () => null, querySelector: () => null };
  const camara = { position: { x: 0, y: 0, z: 0, set() {} }, rotation: { x: 0, y: 0, z: 0, set() {} }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
  const mundoCon = (punto) => EM.crearEscenasMundo({
    doc, camara, progreso: () => ({ dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
    T, puntos: () => ({ estacion: punto }), col: null, gente: () => ({ gente: [] }), clima: () => ({ estado: {} }), sonido: {}, alturaDePie: () => 0, nota() {}, fallo() {},
  }).mundo;
  { const m = mundoCon({ x: 100, z: 200, ang: 0 });
    const p = m.posicion({ lugar: 'estacion', lx: 3, lz: -5 });
    ok(Math.abs(p.x - 103) < 1e-9 && Math.abs(p.z - 195) < 1e-9, `con la vía al este-oeste: lx corre en x y lz en z (${p.x}, ${p.z})`); }
  { const m = mundoCon({ x: 100, z: 200, ang: Math.PI / 2 });
    const p = m.posicion({ lugar: 'estacion', lx: 3, lz: -5 });
    ok(Math.abs(p.x - 95) < 1e-9 && Math.abs(p.z - 197) < 1e-9, `girado un cuarto de vuelta: (${p.x.toFixed(2)}, ${p.z.toFixed(2)})`); }
  { const m = mundoCon({ x: 100, z: 200 });
    const p = m.posicion({ lugar: 'estacion', lx: 3, lz: -5 });
    ok(Math.abs(p.x - 100) < 1e-9 && Math.abs(p.z - 200) < 1e-9, 'un lugar sin ángulo no se mueve con lx y lz (no inventa un marco)');
    const q = m.posicion({ lugar: 'estacion', dx: 3, dz: -5 });
    ok(Math.abs(q.x - 103) < 1e-9 && Math.abs(q.z - 195) < 1e-9, 'y los corrimientos de siempre (dx, dz) siguen en el mundo'); }
  ok(enUnaLinea(main, [/if \(P\.estacion && Number\.isFinite\(est\?\.ang\)\) P\.estacion\.ang = est\.ang/]), 'main.js le da a la Historia hacia dónde corre la vía');
  ok(!/dx: 3, dz: 2/.test(acto1.slice(acto1.indexOf('const elsaAnden = {'), acto1.indexOf('// ---------------------------------------------------------------- CAPÍTULO 3'))), 'la escena de Elsa ya no usa corrimientos del mundo para el andén');
}

// ---------------------------------------------------------------- 4. los indicios no repiten frases de otras escenas
if (va('textos')) {
  const nuevos = ['silueta-bolsa', 'huellas-arroyo', 'silbato-solo', 'lena-apilada', 'silueta-mesa', 'ovejas-silencio', 'migas-rosa', 'botas-calafate', 'silueta-ramal', 'almacen-acomodado'];
  const archivos = readdirSync(SRC).filter((f) => /^historia.*\.js$/.test(f) && f !== 'historia-texto-acto1.js' && f !== 'historia-disparadores.js');
  const otros = archivos.map((f) => leer(f)).join('\n').toLowerCase().replace(/\s+/g, ' ');
  const frases = (t) => t.split(/(?<=[.!?»])\s+/).map((x) => x.trim()).filter((x) => x.length >= 28);
  for (const id of nuevos) {
    const r = TX1.TEXTO_ACTO1.raro[id];
    for (const fr of frases(r.texto)) ok(!otros.includes(fr.toLowerCase().replace(/[«»"]/g, '').slice(0, 60)), `${id}: la frase «${fr.slice(0, 40)}…» no está repetida en otra escena`);
  }
  // nadie dice lo que el personaje todavía no dijo
  const ramal = TX1.TEXTO_ACTO1.raro['silueta-ramal'].texto;
  ok(!/Elsa dice|Graciela dice/.test(ramal), 'silueta-ramal no le hace decir a Elsa ni a Graciela lo que dicen recién en otras escenas');
  ok(/chico/i.test(ramal) && /no andan a esta hora/.test(ramal), 'y conserva la duda: los chicos de la aldea no andan a esa hora');
  // el tono: sin lazos ni religión ni inglés
  for (const id of nuevos) {
    const t = TX1.TEXTO_ACTO1.raro[id].texto;
    ok(!/\b(lazos?|dios|santo|virgen|milagro|bendic)\w*/i.test(t) && !/\d+\s*\/\s*\d+/.test(t), `${id}: sin números de lazo ni religión`);
    ok(!/\b(OK|ok|click|spawn|boss)\b/.test(t), `${id}: castellano rioplatense, sin inglés`);
  }
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['historia-presencia.js', "dist: [18, 24], escala: 2.0,", "dist: [24, 38], escala: 2.0,", 'la silueta de la primera hora vuelve a los 24-38 m', 'silueta'],
  ['historia-presencia.js', "dist: [18, 24], escala: 2.0,", "dist: [10, 24], escala: 2.0,", 'la silueta nace dentro del umbral de huida', 'silueta'],
  ['historia-presencia.js', "escala: 2.0, abanico: 0.6,", "escala: 1.6, abanico: 0.6,", 'la silueta vuelve a medir lo de siempre', 'silueta'],
  ['historia-presencia.js', "abanico: 0.6,", "abanico: 0.9,", 'el abanico vuelve a ser el ancho', 'silueta'],
  ['historia-presencia.js', "if (!mejor || alto > mejor.alto) mejor = { p, alto };", "if (!mejor) mejor = { p, alto };", 'la silueta ya no elige el terreno más alto', 'silueta'],
  ['historia-presencia.js', "pisoNoche: S ? S.pisoNoche : 0 });", "pisoNoche: 0 });", 'los ojos no se prenden al anochecer', 'silueta'],
  ['historia-presencia.js', "pisoNoche: S ? S.pisoNoche : 0 });", "pisoNoche: 0.5 });", 'la presencia del acto II también prende los ojos', 'silueta'],
  ['historia-presencia.js', "const p = puntoEnAbanico(j, rumbo, azar, S ? S.dist : TIEMPOS.distSilueta,", "const p = puntoEnAbanico(j, rumbo, azar, TIEMPOS.distSilueta,", 'la silueta suave usa la distancia del acto II', 'silueta'],
  ['historia-presencia.js', "      if (ctx.despejada && !ctx.despejada(p.x, p.z)) continue;", "", 'la silueta nace pegada a un tronco o detrás de uno', 'silueta'],
  ['main.js', "if (!libre(x, z, 1.1)) return false;", "", 'despejada ya no mira el tronco de al lado', 'silueta'],
  ['main.js', "if (!libre(j.x + dx * k / n, j.z + dz * k / n, 0.5)) return false;", "", 'despejada ya no mira los troncos de la línea', 'silueta'],
  ['historia-presencia.js', "if (++nCand >= S.candidatos) break;", "if (++nCand >= 1) break;", 'se mira un solo lugar', 'silueta'],
  ['historia-presencia.js', "forzarSilueta: () => { if (sil) { sil.quitar(); sil = null; } return aparecerSilueta(hayIndicios(h())); },", "forzarSilueta: () => aparecerSilueta(hayIndicios(h())),", 'una silueta forzada no reemplaza a la anterior', 'silueta'],
  ['historia-duendes.js', "e.noche = Math.max(n, s.pisoNoche);", "e.noche = n;", 'el duende ignora el piso de noche', 'silueta'],
  ["historia-escenas-acto1.js", "const ELSA_ANDEN = { lugar: 'estacion', lx: 1.7, lz: -0.4 };", "const ELSA_ANDEN = { lugar: 'estacion', lx: 3.4, lz: -1.2 };", "Elsa parada junto a un poste", 'elsa'],
  ["historia-escenas-acto1.js", "const ELSA_ANDEN = { lugar: 'estacion', lx: 1.7, lz: -0.4 };", "const ELSA_ANDEN = { lugar: 'estacion', lx: 1.7, lz: 1.4 };", "Elsa parada pegada al galpón, adentro del alero", 'elsa'],
  ["historia-escenas-acto1.js", "pos: { lugar: 'estacion', lx: 2.6, lz: -5.6, dy: 1.7 }", "pos: { lugar: 'estacion', lx: 2.6, lz: -0.2, dy: 1.7 }", "la cámara adentro del alero", 'elsa'],
  ["historia-escenas-acto1.js", "pos: { lugar: 'estacion', lx: 2.6, lz: -5.6, dy: 1.7 }", "pos: { lugar: 'estacion', lx: 3.4, lz: -1.4, dy: 1.7 }", "la cámara pegada a un poste", 'elsa'],
  ["historia-escenas-acto1.js", "pos: { lugar: 'estacion', lx: 2.6, lz: -5.6, dy: 1.7 }", "pos: { lugar: 'estacion', lx: 2.6, lz: -5.6, dy: 3.4 }", "la cámara a la altura del techo", 'elsa'],
  ["historia-escenas-acto1.js", "    plano('libre', null, { pos: { lugar: 'estacion', lx: 2.6,", "    plano('medio', 'elsa', { desde: 'jugador', fov: 48, mezcla: 1, dur: 1, sinEsperar: true }),\n    plano('libre', null, { pos: { lugar: 'estacion', lx: 2.6,", "un plano de Elsa desde el jugador (cae donde sea)", 'elsa'],
  ["escenas-mundo.js", "if ((ref.lx !== undefined || ref.lz !== undefined) && Number.isFinite(l.ang))", "if (false && Number.isFinite(l.ang))", "el mundo ignora lx y lz", 'elsa'],
  ["escenas-mundo.js", "oz += -lx * Math.sin(l.ang) + lz * Math.cos(l.ang);", "oz += lx * Math.sin(l.ang) + lz * Math.cos(l.ang);", "el giro del marco con el signo cambiado", 'elsa'],
  ["historia-escenas-acto1.js", "posFin: { lugar: 'estacion', lx: 2.6, lz: -5.6, dy: 1.7 }, miraFin: { ref: 'elsa', dy: 1.45 }, ", "", "el plano de cerca sin posFin: la cámara baja al piso", "elsa"],
  ["main.js", "if (P.estacion && Number.isFinite(est?.ang)) P.estacion.ang = est.ang;", "if (false) P.estacion.ang = est.ang;", "main.js no da el ángulo de la vía", 'elsa'],
  ['historia-texto-acto1.js', "Será algún chico de la aldea, pensé. Pero los chicos", "Elsa dice que son chicos de la aldea. Los chicos", 'la silueta del capítulo 4 le hace decir a Elsa lo que no dijo', 'textos'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4241b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4241_CALLADO: '1', A4241_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.24.1 (B) la primera hora a ojo · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
