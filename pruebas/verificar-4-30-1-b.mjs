// 4.30.1 (B): lo de la captura del usuario en la Plaza de los Duendes (el retablo, el árbol pegado y la vecina de pollera), sin Electron:
//   1. el retablo de los títeres (rincones-mundo.js, modeloRetablo): de 2,2 a 2,5 m de alto y no más ancho que 1,7 m; tablas de verdad (con su
//      junta) atrás, a los costados y adelante; la boca con las cortinas coloradas y el telón azul (no un agujero negro); mira a la plaza;
//   2. ningún árbol pegado a lo construido: los álamos de alrededor de la plaza (ALAMOS_PLAZA), los de adentro y los del plano (álamos, frutales,
//      arbustos) quedan lejos del retablo y de tu talla; los frutales de los patios, con la copa fuera de las otras casas; nada en la calle;
//   3. las de pollera, paradas en la ladera, doblan la pierna de arriba como las de poncho (`conPollera`, de gente-cuerpo.js a gente.js, también
//      al cambiarse de ropa);
//   4. con la piel de verdad: nada de la pierna sale por la pollera, ni parada en la ladera ni en todo el ciclo del paso (`pasoPollera`);
//   5. caminando, a todos (pollera y pantalón) el pie de apoyo no les patina (cadenciaPaso), sin ritmo frenético y sin llegar tarde.
// Con mutaciones de verdad (un proceso por mutación: `--mutacion=<id>`).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expresion, enUnaLinea, funcion, derechaDe } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const MUT = (process.argv.find((a) => a.startsWith('--mutacion=')) || '').slice(11);

// ---------------------------------------------------------------- las mutaciones (el texto que cambian; cada una tiene que hacer fallar algo)
const MUTACIONES = {
  'retablo-caja-lisa': ['src/rincones-mundo.js', 'tablas(7, LX, YR, YD,', 'tablas(1, LX, YR, YD,'],
  'retablo-sin-tablas-abajo': ['src/rincones-mundo.js', 'tablas(7, LX, Y0, YR,', 'tablas(1, LX, Y0, YR,'],
  'retablo-costados-lisos': ['src/rincones-mundo.js', 'tablas(3, LZ, Y0, YD,', 'tablas(1, LZ, Y0, YD,'],
  'retablo-gigante': ['src/rincones-mundo.js', 'const Y0 = -0.3, YR = 1.15, YB = 1.84, YD = 2.08;', 'const Y0 = -0.3, YR = 1.55, YB = 2.24, YD = 2.48;'],
  'retablo-ancho': ['src/rincones-mundo.js', 'const AN = 1.5, FO = 0.56,', 'const AN = 1.9, FO = 0.56,'],
  'retablo-sin-cortinas': ['src/rincones-mundo.js', "P.caja(k % 2 ? '#8e2220' : TELA, 0.07,", "P.caja(k % 2 ? '#5a5a5a' : '#6a6a6a', 0.07,"],
  'retablo-boca-negra': ['src/rincones-mundo.js', "P.caja('#26324a', LX,", "P.caja('#121212', LX,"],
  'retablo-de-espaldas': ['src/rincones.js', 'retablo: { lx: 2.4, lz: 47.6, rot: PI },', 'retablo: { lx: 2.4, lz: 47.6, rot: 0 },'],
  'alamo-pegado': ['src/aldea-mundo.js', '[-4.5, -8.5], [7.5, -8.5]];', '[-4.5, -8.5], [4.5, -8.5]];'],
  'frutal-pegado': ['src/aldea-mundo.js', 'ocupado(q.lx, q.lz, COPA_FRUTAL, id)', 'ocupado(q.lx, q.lz, 0.6, id)'],
  'copa-chica': ['src/aldea-mundo.js', 'export const COPA_FRUTAL = 2.1;', 'export const COPA_FRUTAL = 0.6;'],
  'pollera-tope': ['src/gente.js', '|| g.conPoncho || g.conPollera ? 0.035 : 0.07;', '|| g.conPoncho ? 0.035 : 0.07;'],
  'sin-conPollera': ['src/gente-cuerpo.js', 'r.conPollera = !!(A.R && A.R.pollera);', 'r.conPollera = false;'],
  'vestir-sin-pollera': ['src/gente.js', 'conPoncho: m.conPoncho, conPollera: m.conPollera, pasoPollera', 'conPoncho: m.conPoncho, pasoPollera'],
  'pollera-se-frena': ['src/gente.js', 'return Math.max(v / TARDE_MAX, Math.min(v,', 'return Math.max(v / 2, Math.min(v,'],
  'pantalon-se-frena': ['src/gente.js', '  if (g.pasoPollera) velocidad = velocidadPaso(g, velocidad);', '  velocidad = g.pasoPollera ? velocidadPaso(g, velocidad) : velocidad * 0.85;'],
  'sin-alargar': ['src/gente.js', 'return Math.max(A0, Math.asin(Math.min(0.95, (g.vel || 0) / (pasosMax(g) * 2 * 0.775 * escalaPaso(g)))));', 'return A0;'],
  'chicos-como-grandes': ['src/gente.js', 'return (g.pasoPollera ? PASOS_POLLERA_MAX : PASOS_MAX) / escalaPaso(g) *', 'return (g.pasoPollera ? PASOS_POLLERA_MAX : PASOS_MAX) *'],
  'ritmo-viejo': ['src/gente.js', 'return Math.PI * v / (2 * 0.775 * escalaPaso(g) * Math.sin(amplitudPaso(g)));', 'return 2.6 + v * 5;'],
  'sin-escala': ['src/gente.js', 'function escalaPaso(g) {\n  return g.g?.scale?.y || 1;', 'function escalaPaso(g) {\n  return 1;'],
  'vestir-sin-paso': ['src/gente.js', 'conPollera: m.conPollera, pasoPollera: m.pasoPollera, soltar', 'conPollera: m.conPollera, soltar'],
  'paso-largo': ['src/gente-cuerpo.js', '{ cadera: 0.5, rodilla: 0.5 }', '{ cadera: 1, rodilla: 1 }'],
  'paso-largo-tobillo': ['src/gente-cuerpo.js', '{ cadera: 0.34, rodilla: 0.32 }', '{ cadera: 0.5, rodilla: 0.5 }'],
  'sin-pasoPollera': ['src/gente.js', 'const A0 = g.pasoPollera ? 0.5 * g.pasoPollera.cadera : PASO_PANTALON;', 'const A0 = PASO_PANTALON;'],
  'paso-en-seno': ['src/gente.js', 'return Math.asin(0.998 * Math.sin(f)) / Math.asin(0.998);', 'return Math.sin(f);'],
};

// ---------------------------------------------------------------- el padre: corre la prueba y cada mutación en su proceso
if (!MUT && !process.argv.includes('--sin-mutaciones')) {
  const correr = (args) => new Promise((res) => execFile(process.execPath, [fileURLToPath(import.meta.url), ...args], { cwd: raiz, maxBuffer: 1 << 24 }, (err, out, errOut) => res({ ok: !err, out: String(out), err: String(errOut) })));
  const base = await correr(['--sin-mutaciones']);
  process.stdout.write(base.out);
  if (!base.ok) { console.error(base.err); process.exit(1); }
  const ids = Object.keys(MUTACIONES);
  for (const id of ids) { const [f, a] = MUTACIONES[id]; assert.ok(leer(f).includes(a), `mutación «${id}»: el texto a cambiar existe en ${f}`); }
  const res = [];
  for (let i = 0; i < ids.length; i += 4) res.push(...await Promise.all(ids.slice(i, i + 4).map(async (id) => ({ id, r: await correr(['--mutacion=' + id]) }))));
  let malas = 0;
  for (const { id, r } of res) {
    const falla = !r.ok;
    if (!falla) malas++;
    console.log(`${falla ? '✓' : '✗'} mutación «${id}» ${falla ? 'hace fallar la prueba' : 'NO hace fallar nada'}${falla ? ' (' + (r.err.match(/AssertionError[^\n]*\n?[^\n]*/)?.[0] || r.err.split('\n')[0]).replace(/\s+/g, ' ').slice(0, 150) + ')' : ''}`);
  }
  if (malas) { console.error(`${malas} mutaciones no se detectan`); process.exit(1); }
  console.log(`OK 4.30.1 (B) · ${ids.length} mutaciones detectadas`);
  process.exit(0);
}

// ---------------------------------------------------------------- el hijo
if (MUT) {
  const [f, a, b] = MUTACIONES[MUT];
  const abs = path.join(raiz, f);
  globalThis.__cambiarFuente = (archivo, texto) => (path.resolve(archivo) === path.resolve(abs) ? texto.replace(a, b) : texto);
}
const fuente = (f) => (globalThis.__cambiarFuente ? globalThis.__cambiarFuente(path.join(raiz, f), leer(f)) : leer(f));
const { cargarModulos } = await import('./ayuda-4-0-3-valle.mjs');
const { THREE, M } = cargarModulos(['rincones-mundo.js', 'rincones.js', 'aldea.js', 'aldea-mundo.js', 'gente-cuerpo.js']);
const RM = M.rincones_mundo, R = M.rincones, A = M.aldea, AM = M.aldea_mundo;
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el retablo
{
  const g = RM.modeloRetablo();
  g.computeBoundingBox();
  const b = g.boundingBox, P = g.attributes.position, Nn = g.attributes.normal, C = g.attributes.color;
  const alto = b.max.y, ancho = b.max.x - b.min.x, fondo = b.max.z - b.min.z, tris = P.count / 3;
  ok(alto >= 2.2 && alto <= 2.5, `el retablo, de teatrito de títeres: ${alto.toFixed(2)} m sobre el piso (de 2,2 a 2,5)`);
  ok(ancho <= 1.7 && ancho >= 1.3 && fondo <= 0.75, `y de 1,3 a 1,7 m de ancho (${ancho.toFixed(2)}) y poco fondo (${fondo.toFixed(2)})`);
  ok(b.min.y <= -0.25, 'entra en el piso (en la ladera no queda colgando)');
  ok(tris >= 600, `con detalle de madera pintada (${tris} triángulos; la caja lisa tenía 156)`);
  // los triángulos que miran a un lado (n), que tocan la franja de alto [y0, y1] y están en la cara de afuera (entre `desde` y `hasta` en esa dirección)
  const caras = (n, y0, y1, desde, hasta = Infinity) => {
    const out = [];
    for (let t = 0; t < P.count; t += 3) {
      let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0, r = 0, gg = 0, bb = 0, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let k = 0; k < 3; k++) {
        const i = t + k; nx += Nn.getX(i) / 3; ny += Nn.getY(i) / 3; nz += Nn.getZ(i) / 3; cx += P.getX(i) / 3; cy += P.getY(i) / 3; cz += P.getZ(i) / 3;
        r += C.getX(i) / 3; gg += C.getY(i) / 3; bb += C.getZ(i) / 3;
        x0 = Math.min(x0, P.getX(i)); x1 = Math.max(x1, P.getX(i)); z0 = Math.min(z0, P.getZ(i)); z1 = Math.max(z1, P.getZ(i));
      }
      let ya = Infinity, yb = -Infinity;
      for (let k = 0; k < 3; k++) { ya = Math.min(ya, P.getY(t + k)); yb = Math.max(yb, P.getY(t + k)); }
      if (nx * n[0] + ny * n[1] + nz * n[2] < 0.9 || yb < y0 || ya > y1) continue;
      const fuera = cx * n[0] + cz * n[2];
      if (fuera < desde || fuera > hasta) continue;
      out.push({ cx, cy, cz, r, g: gg, b: bb, x0, x1, z0, z1 });
    }
    return out;
  };
  // cuántas tablas: los tramos (en x o en z) que cubren esas caras, separados por las juntas
  const tramos = (lista, eje) => {
    const iv = lista.map((c) => (eje === 'x' ? [c.x0, c.x1] : [c.z0, c.z1])).sort((p, q) => p[0] - q[0]);
    let n = 0, fin = -Infinity;
    for (const [a, z] of iv) { if (a > fin + 0.004) n++; fin = Math.max(fin, z); }
    return n;
  };
  // (la cara de afuera de las tablas: a 27,5 cm del medio, adelante y atrás; a 74,5 a los costados)
  const atrasArriba = caras([0, 0, -1], 1.25, 1.55, 0.27, 0.285), atrasAbajo = caras([0, 0, -1], 0.08, 0.2, 0.27, 0.285);
  ok(tramos(atrasArriba, 'x') >= 7, `de atrás, arriba, se ven las tablas (${tramos(atrasArriba, 'x')} tramos con junta; la caja lisa: 1)`);
  ok(tramos(atrasAbajo, 'x') >= 7, `y abajo también (${tramos(atrasAbajo, 'x')} tramos)`);
  const adelanteAbajo = caras([0, 0, 1], 0.08, 0.2, 0.27, 0.285);
  ok(tramos(adelanteAbajo, 'x') >= 7, `adelante, abajo de la repisa, tablas (${tramos(adelanteAbajo, 'x')} tramos)`);
  for (const sx of [-1, 1]) { const c = caras([sx, 0, 0], 1.2, 1.4, 0.74, 0.752); ok(tramos(c, 'z') >= 5, `el costado ${sx < 0 ? 'izquierdo' : 'derecho'}, de tablas (${tramos(c, 'z')} tramos: los dos parantes y tres tablas)`); }
  const cortinas = caras([0, 0, 1], 1.25, 1.65, 0.15).filter((c) => c.r > 0.2 && c.r > 4 * c.g && c.r > 3 * c.b);
  ok(cortinas.length >= 12, `la boca con las cortinas coloradas a la vista (${cortinas.length} caras)`);
  const telon = caras([0, 0, 1], 1.3, 1.8, -0.3).filter((c) => c.cz < -0.15 && c.b > c.r * 1.3 && c.b > c.g * 1.3 && c.b > 0.02);
  ok(telon.length >= 2, `y el telón del fondo, azul de noche: no un agujero negro (${telon.length} caras)`);
  // mira a la plaza: su +Z, girado como lo pone rincones-mundo.js (rotation.y = rotMundo), apunta al centro de la plaza
  const L = R.lugarEnMundo('retablo'), m = A.marcoAldea(), pz = A.EDIFICIOS_ALDEA.plaza, c = m.aMundo(pz.x, pz.z);
  const fx = Math.sin(L.rotMundo), fz = Math.cos(L.rotMundo), dx = c.x - L.x, dz = c.z - L.z, dd = Math.hypot(dx, dz);
  ok((fx * dx + fz * dz) / dd > 0.85, `la cara linda (la boca) mira a la plaza y a los bancos (coseno ${((fx * dx + fz * dz) / dd).toFixed(2)})`);
}

// ---------------------------------------------------------------- 2. ningún árbol pegado a lo construido
{
  const pz = A.EDIFICIOS_ALDEA.plaza, c = Math.cos(pz.rot), s = Math.sin(pz.rot);
  const dePlaza = ([lx, lz]) => ({ lx: pz.x + lx * c + lz * s, lz: pz.z - lx * s + lz * c });
  const plan = AM.planAccesorios();
  const arboles = [
    ...AM.ALAMOS_PLAZA.map((q) => ({ tipo: 'álamo de la plaza', ...dePlaza(q) })),
    ...[[-8.1, 2.6], [8.1, 2.6]].map((q) => ({ tipo: 'álamo de adentro de la plaza', ...dePlaza(q) })),
    ...plan.filter((a) => ['alamo', 'frutal', 'arbusto'].includes(a.tipo)).map((a) => ({ tipo: a.tipo, lx: a.lx, lz: a.lz })),
  ];
  ok(AM.ALAMOS_PLAZA.length === 6 && arboles.length > 60, `los árboles de la aldea (${arboles.length})`);
  // la distancia de un punto a un rectángulo (centro, giro, ancho en x, fondo en z), en el plano de la aldea
  const aRect = (p, k) => { const dx = p.lx - k.x, dz = p.lz - k.z, cc = Math.cos(k.rot), ss = Math.sin(k.rot), x = dx * cc - dz * ss, z = dx * ss + dz * cc; return Math.hypot(Math.max(0, Math.abs(x) - k.w / 2), Math.max(0, Math.abs(z) - k.d / 2)); };
  const LR = R.LUGARES_RINCONES;
  for (const [id, w, d] of [['retablo', 1.5, 0.6], ['talla', 1, 1]]) {
    const k = { x: LR[id].lx, z: LR[id].lz, rot: LR[id].rot || 0, w, d };
    const cerca = arboles.map((a) => ({ a, d: aRect(a, k) })).sort((p, q) => p.d - q.d)[0];
    ok(cerca.d >= 2, `el ${id === 'retablo' ? 'retablo de los títeres' : 'lugar de tu talla'}: el árbol más cerca (${cerca.a.tipo}) está a ${cerca.d.toFixed(2)} m (al menos 2: ni pegado ni adentro)`);
  }
  // los frutales de los patios: la copa (1,8 m) no se mete en la casa de al lado; los álamos y arbustos, como siempre, fuera de las casas
  const rects = A.IDS_EDIFICIOS.map((id) => { const e = A.EDIFICIOS_ALDEA[id]; return { id, x: e.x, z: e.z, rot: e.rot || 0, w: e.ancho, d: e.fondo }; });
  const frutales = plan.filter((a) => a.tipo === 'frutal');
  ok(frutales.length >= 6, `los frutales de los patios (${frutales.length})`);
  // (la suya: la casa de cuyo patio es, 2 m detrás de la pared de atrás)
  const deQuien = (f) => rects.find((k) => { const e = A.EDIFICIOS_ALDEA[k.id], dx = f.lx - k.x, dz = f.lz - k.z, cc = Math.cos(k.rot), ss = Math.sin(k.rot), bx = dx * cc - dz * ss, bz = dx * ss + dz * cc; return Math.abs(bz + e.fondo / 2 + 2) < 0.05 && Math.abs(bx) <= e.ancho / 2; });
  for (const f of frutales) {
    const propia = deQuien(f)?.id;
    ok(!!propia, `el frutal (${f.lx.toFixed(1)}, ${f.lz.toFixed(1)}) está en el patio de una casa`);
    const otra = rects.filter((k) => k.id !== propia).map((k) => ({ k, d: aRect(f, k) })).sort((p, q) => p.d - q.d)[0];
    ok(otra.d >= 1.9, `el frutal de ${propia} (${f.lx.toFixed(1)}, ${f.lz.toFixed(1)}): la copa lejos de ${otra.k.id} (${otra.d.toFixed(2)} m)`);
  }
  for (const a of arboles) {
    ok(!A.CALLES_ALDEA.some((cl) => A.distanciaACalle(a.lx, a.lz, cl) < 0.5), `${a.tipo} (${a.lx.toFixed(1)}, ${a.lz.toFixed(1)}): fuera de la calle`);
    if (a.tipo !== 'álamo de adentro de la plaza') ok(!A.IDS_EDIFICIOS.some((id) => id !== 'plaza' && A.dentroDePlanta(id, a.lx, a.lz, 1.0)), `${a.tipo} (${a.lx.toFixed(1)}, ${a.lz.toFixed(1)}): fuera de los edificios`);
  }
}

// ---------------------------------------------------------------- 3. las de pollera en la ladera
{
  const gente = fuente('src/gente.js'), cuerpo = fuente('src/gente-cuerpo.js');
  const tope = (g) => expresion(gente, 'const tope = ', { g, R_PONCHO: new Set(['ramon']) });
  ok(tope({ clave: 'aldea-nena', conPollera: true }) === 0.035, 'con pollera, la pierna de arriba sube 3,5 cm como mucho (como con poncho): la rodilla no sale por delante');
  ok(tope({ clave: 'aldea-nena', conPollera: true, conPoncho: true }) === 0.035 && tope({ clave: 'ramon' }) === 0.035, 'y con poncho, igual que antes');
  ok(tope({ clave: 'aldea-padre' }) === 0.07, 'con pantalón, como antes (7 cm)');
  const conPollera = (R) => expresion(cuerpo, 'r.conPollera = ', { A: { R } });
  ok(conPollera({ pollera: true, chamal: true }) === true && conPollera({ pollera: true, curvas: true }) === true, 'gente-cuerpo.js marca a las de pollera (también el chamal y la falda ceñida)');
  ok(conPollera({ chaleco: true }) === false && conPollera(undefined) === false, 'y a los de pantalón, no');
  ok(enUnaLinea(gente, ['conPoncho: m.conPoncho', 'conPollera: m.conPollera', 'pasoPollera: m.pasoPollera', 'soltar: m.soltar']), 'al cambiarse de ropa (vestir), la marca y el paso pasan a la figura nueva');
  // y quién la tiene: todas las de pollera del juego (gente-ropa.js)
  const ropa = fuente('src/gente-ropa.js');
  const conLaPollera = [...ropa.matchAll(/^\s+R: \{[^\n]*\bpollera: true/gm)].length;
  ok(conLaPollera >= 15, `las de pollera o vestido del juego (${conLaPollera} fichas) llevan \`pollera: true\` y con eso la marca`);
}

// ---------------------------------------------------------------- el paso de gente.js (sus funciones y las expresiones de la pose, compiladas una vez)
function armarPaso(gente) {
  const k = (n) => expresion(gente, `export const ${n} = `);
  const PASOS_MAX = k('PASOS_MAX'), PASOS_POLLERA_MAX = k('PASOS_POLLERA_MAX'), PASO_PANTALON = k('PASO_PANTALON'), TARDE_MAX = k('TARDE_MAX');
  const escalaPaso = funcion(gente, 'escalaPaso');
  const pasosMax = funcion(gente, 'pasosMax', { PASOS_MAX, PASOS_POLLERA_MAX, escalaPaso });
  const velocidadPaso = funcion(gente, 'velocidadPaso', { TARDE_MAX, pasosMax, escalaPaso });
  const amplitudPaso = funcion(gente, 'amplitudPaso', { PASO_PANTALON, pasosMax, escalaPaso });
  const cadenciaPaso = funcion(gente, 'cadenciaPaso', { amplitudPaso, escalaPaso });
  const perfilPaso = funcion(gente, 'perfilPaso');
  const caminar = funcion(gente, 'caminarHacia', { alturaDePie: () => 0, velocidadPaso });
  const fc = new Function('andando', 'f', 'g', 'alza', 'perfilPaso', 'amplitudPaso', `return (${derechaDe(gente, 'p2.rotation.x = ', 'amplitudPaso')});`);
  const fr = new Function('andando', 'f', 'pp', 'alza', `return (${derechaDe(gente, 'if (rod) rod.rotation.x = ', 'pp.rodilla')});`);
  return { PASOS_MAX, PASOS_POLLERA_MAX, PASO_PANTALON, TARDE_MAX, pasosMax, cadenciaPaso, caminar, velocidadPaso,
    cadera: (f, g) => fc(true, f, g, 0, perfilPaso, amplitudPaso), rodilla: (f, g) => fr(true, f, g.pasoPollera, 0) };
}

// ---------------------------------------------------------------- 4. con la piel: nada de la pierna sale por la pollera, parada en la ladera ni caminando
// Cada una de pollera se arma de verdad (gente-cuerpo.js), se le ponen las poses de gente.js (las expresiones mismas: la ladera con su `tope` y el
// paso con `pasoPollera`) y se mueven los vértices con la piel (los huesos y los pesos de la malla). Un vértice de la canilla, la bota o el pie que
// queda más arriba del ruedo y más afuera que la pollera a su altura y de su lado (en 48 gajos alrededor del cuerpo) es uno que asoma.
{
  const gente = fuente('src/gente.js');
  const tope = (g) => expresion(gente, 'const tope = ', { g, R_PONCHO: new Set(['ramon']) });
  const PS = armarPaso(gente);
  const GC = M.gente_cuerpo, NB = 48, ropa = fuente('src/gente-ropa.js');
  const claves = [];
  { let k = null; for (const l of ropa.split('\n')) { const m = /^  '?([a-z][a-z-]*)'?: \{\s*$/.exec(l); if (m) k = m[1]; else if (k && /^    R: \{.*\bpollera: true/.test(l) && !claves.includes(k)) claves.push(k); } }
  ok(claves.length >= 14 && claves.includes('aldea-nena') && claves.includes('aldea-abuela'), `las de pollera para medir (${claves.length}: ${claves.join(', ')})`);
  const v = new THREE.Vector3(), t = new THREE.Vector3(), inv = new THREE.Matrix4();
  for (const k of claves) {
    const r = GC.crearPersona({}, k, false, {}, {});
    let malla = null; r.g.traverse((o) => { if (o.skeleton && o.skeleton.huesos) malla = o; });
    const sk = malla.skeleton, geo = malla.geometry, P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight, VI = geo.attributes.aVientoU, H = sk.huesos, base = sk.base;
    const deLaPierna = new Set(r.patas.flatMap((p) => [H.indexOf(p.userData.rodilla), H.indexOf(p.userData.rodilla.userData.tobillo)]));
    const dom = (i) => { let b = -1, w = 0; for (let c = 0; c < 4; c++) if (SW.getComponent(i, c) > w) { w = SW.getComponent(i, c); b = SI.getComponent(i, c) - base; } return b; };
    const pierna = [], tela = [];
    for (let i = 0; i < P.count; i++) { if (deLaPierna.has(dom(i))) pierna.push(i); else if (VI.getX(i) > 0 && P.getY(i) > 0.05 && P.getY(i) < 0.95) tela.push(i); }
    ok(pierna.length > 100 && tela.length > 100, `${k}: piernas (${pierna.length} vértices) y pollera (${tela.length})`);
    const mats = H.map(() => new THREE.Matrix4());
    const piel = (i) => { const a = new THREE.Vector3(); v.fromBufferAttribute(P, i); for (let c = 0; c < 4; c++) { const w = SW.getComponent(i, c); if (w) a.addScaledVector(t.copy(v).applyMatrix4(mats[SI.getComponent(i, c) - base]), w); } return a; };
    const gajo = (q) => Math.floor((Math.atan2(q.x, q.z) / (2 * Math.PI) + 1) * NB) % NB;
    // cuánto asoma lo que más asoma (en cm) con la pose `poner`
    const asoma = (poner) => {
      for (const p of r.patas) { p.rotation.set(0, 0, 0); p.userData.rodilla.rotation.set(0, 0, 0); }
      r.torso.rotation.set(0, 0, 0);
      poner();
      r.g.updateMatrixWorld(true); inv.copy(malla.matrixWorld).invert();
      H.forEach((h, i) => mats[i].multiplyMatrices(inv, h.matrixWorld).multiply(sk.inversas[i]));
      const gajos = Array.from({ length: NB }, () => []);
      for (const i of tela) { const q = piel(i); gajos[gajo(q)].push(q); }
      const ruedo = gajos.map((l) => Math.min(...l.map((q) => q.y)));
      let peor = 0;
      for (const i of pierna) {
        const q = piel(i), b = gajo(q), vec = [b, (b + 1) % NB, (b + NB - 1) % NB];
        if (q.y < Math.max(...vec.map((c) => ruedo[c])) + 0.015) continue;
        let rp = 0; for (const c of vec) for (const s of gajos[c]) if (Math.abs(s.y - q.y) < 0.03) rp = Math.max(rp, Math.hypot(s.x, s.z));
        if (rp) peor = Math.max(peor, Math.hypot(q.x, q.z) - rp);
      }
      return Math.max(0, peor * 100);
    };
    const g = { clave: k, g: r.g, vel: 0, conPollera: r.conPollera, conPoncho: r.conPoncho, pasoPollera: r.pasoPollera };
    g.vel = PS.velocidadPaso(g, 0.85);   // (a paso de siempre: el de los vecinos de la aldea, como lo deja caminarHacia)
    const a = Math.sqrt(tope(g) / 0.41);
    const ladera = asoma(() => { r.patas[0].rotation.x = -a; r.patas[0].userData.rodilla.rotation.x = 0.03 + a * 2; r.patas[1].userData.rodilla.rotation.x = 0.03; });
    ok(ladera <= 0.5, `${k}, parada en la ladera (la pierna de arriba sube ${(tope(g) * 100).toFixed(1)} cm): no asoma nada (${ladera.toFixed(1)} cm)`);
    let paso = 0, fPeor = 0;
    for (let f = 0; f < 2 * Math.PI; f += Math.PI / 16) {
      const c = asoma(() => { r.patas.forEach((p, i) => { const ff = f + i * Math.PI; p.rotation.x = PS.cadera(ff, g); p.userData.rodilla.rotation.x = PS.rodilla(ff, g); }); r.torso.rotation.x = 0.035; r.torso.rotation.y = Math.sin(f) * 0.06; });
      if (c > paso) { paso = c; fPeor = f; }
    }
    ok(paso <= 1, `${k}, caminando a ${g.vel.toFixed(2)} m/s (todo el paso, de a 11,25°): no asoma nada que se vea (lo peor: ${paso.toFixed(1)} cm en ${(fPeor * 180 / Math.PI).toFixed(0)}°; con el paso de antes, hasta 38)`);
  }
}

// ---------------------------------------------------------------- 5. el pie de apoyo no patina (todos: pollera y pantalón)
// Cada uno camina de verdad: caminarHacia (gente.js) lo mueve hacia adelante cuadro a cuadro (1/120 s), el ciclo avanza con cadenciaPaso y las piernas
// toman la pose del paso (las expresiones de gente.js). Mientras un pie es el de apoyo (cos f > 0, la rodilla derecha), lo que se corre contra el suelo
// es lo que patina: ≤ 2 cm por paso. Sin ponerse frenético (a lo sumo pasosMax pasos por segundo) y sin llegar tarde: los de pantalón, a su velocidad;
// las de pollera, a lo sumo un 10 % más despacio. A paso de siempre (0,8), los chicos (1,05, con su talla), apurados (1,3) y el que te sigue corriendo (3).
{
  const P = armarPaso(fuente('src/gente.js'));
  ok(P.PASOS_MAX <= 2.5 && P.PASOS_POLLERA_MAX <= 2.7 && P.TARDE_MAX <= 1.1 && P.PASO_PANTALON > 0.25, `los topes del paso (${P.PASOS_MAX} y ${P.PASOS_POLLERA_MAX} pasos/s, ${Math.round((P.TARDE_MAX - 1) * 100)} % más lento como mucho, ${P.PASO_PANTALON} rad con pantalón)`);
  const ropa = fuente('src/gente-ropa.js'), pollera = [], pantalon = [];
  { let k = null; for (const l of ropa.split('\n')) { const m = /^  '?([a-z][a-z-]*)'?: \{\s*$/.exec(l); if (m) k = m[1]; else if (k && /^    R: \{/.test(l)) { const lista = /\bpollera: true/.test(l) ? pollera : pantalon; if (!lista.includes(k)) lista.push(k); k = null; } } }
  ok(pollera.length >= 14 && pantalon.length >= 20, `todos: ${pollera.length} de pollera y ${pantalon.length} de pantalón`);
  const casos = [...[...pollera, ...pantalon].map((c) => [c, 1, 0.8]), ['aldea-nena', 0.72, 1.05], ['aldea-nene', 0.66, 1.05], ['ercilia', 1, 1.3], ['aldea-padre', 1, 1.3], ['ramon', 1, 3], ['poblador-modista', 1, 3]];
  const T = { agua: () => false }, col = { resolver() {} }, w = new THREE.Vector3();
  for (const [k, talla, apuro] of casos) {
    const r = M.gente_cuerpo.crearPersona({}, k, false, {}, {});
    r.g.scale.multiplyScalar(talla);
    const g = { g: r.g, pos: r.g.position, vel: 0, paso: 0, pasoPollera: r.pasoPollera, __sinChoque: true };
    const dt = 1 / 120, pies = r.patas.map((p) => p.userData.rodilla.userData.tobillo);
    const apoyo = [null, null], patina = [];
    let t = 0, antes = null, paso0 = 0;
    for (let n = 0; n < 120 * 5; n++) {
      P.caminar(g, dt, { x: 0, z: 1000 }, apuro, T, col);
      g.paso += dt * P.cadenciaPaso(g);
      r.patas.forEach((p, i) => { const f = g.paso + i * Math.PI; p.rotation.x = P.cadera(f, g); p.userData.rodilla.rotation.x = P.rodilla(f, g); });
      r.g.updateMatrixWorld(true);
      const z = pies.map((p) => p.getWorldPosition(w).z);
      const abajo = Math.cos(g.paso) > 0 ? 0 : 1;   // (el de apoyo: el que tiene cos f > 0, con la rodilla derecha, como en gente.js)
      if (n < 240) { antes = abajo; paso0 = g.paso; continue; }   // (dos segundos para entrar en ritmo)
      t += dt;
      if (abajo !== antes) { const a = apoyo[antes]; if (a) patina.push(a.max - a.min); apoyo[abajo] = { min: z[abajo], max: z[abajo] }; }
      else if (apoyo[abajo]) { apoyo[abajo].min = Math.min(apoyo[abajo].min, z[abajo]); apoyo[abajo].max = Math.max(apoyo[abajo].max, z[abajo]); }
      antes = abajo;
    }
    const peor = Math.max(...patina) * 100, ritmo = (g.paso - paso0) / Math.PI / t, quien = `${k}${talla < 1 ? ' (chico)' : ''} a ${apuro} m/s`;
    ok(patina.length >= 2 && peor <= 2, `${quien}: el pie de apoyo no patina (lo peor: ${peor.toFixed(1)} cm por paso, en ${patina.length} pasos, ${ritmo.toFixed(2)} pasos/s)`);
    ok(ritmo <= P.pasosMax(g) + 0.1, `${quien}: sin ponerse frenético (${ritmo.toFixed(2)} pasos por segundo)`);
    if (g.pasoPollera) ok(g.vel >= apuro / P.TARDE_MAX - 1e-9, `${quien}: a lo sumo un 10 % más despacio (${g.vel.toFixed(2)} m/s)`);
    else ok(g.vel === apuro, `${quien}: con pantalón, a su velocidad (no llega tarde)`);
  }
}

console.log(`OK 4.30.1 (B) · ${pasos} verificaciones · el retablo de tablas y a escala, ningún árbol pegado a lo construido, las de pollera en la ladera`);
