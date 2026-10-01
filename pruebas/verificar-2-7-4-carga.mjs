// 2.7.4: la carga más rápida, sin cambiar nada del juego. Las texturas procedurales, el
// ruido y el terreno se calculan más rápido pero dan los MISMOS bytes que en la 2.7.0; las
// texturas pueden salir de un Worker y todo puede salir de la caché de la carga
// (IndexedDB), que sólo se usa si la clave (versión, generación, semilla y huella del
// código) coincide y los tamaños y sumas de control dan.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { rng, crearRuido } from '../src/ruido.js';
import { TEXTURAS, GENERADORES, generarDatos, fuenteGenerador } from '../src/texturas-datos.js';
import { generarTerreno, datosTerreno, pasosTerreno, armarTerreno, partirDatosTerreno, unirDatosTerreno, claveTerreno, fuenteTerreno, GRILLAS_TERRENO } from '../src/terreno.js';
import { GENERACION_CACHE, huellaTexto, sumaBytes, versionDelBuild, claveCarga, armarRegistro, validarRegistro } from '../src/cache-carga.js';
import { N, SEMILLA } from '../src/config.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const sha = (u8) => createHash('sha256').update(u8).digest('hex').slice(0, 24);

// ---------------------------------------------------------------- texturas: los bytes de la 2.7.0
// (huellas tomadas con el texturas.js de la 2.7.0, antes de tocarlo)
const HUELLAS_270 = {
  montana: 'af14893b1881508c9ee12b46', manchas: 'fd96e5758ee4ef05d70d4526', vegetal: 'fb3b9b9a9889905cb32e2911',
  vegetalRelieve: '8c5e81bf77a191b378280ae8', hojas: 'e06fb7f14ecaf01a9af88b47', suelo: 'b57e797051c7587fc421feca',
};
const directo = {};
for (const gen of GENERADORES) Object.assign(directo, generarDatos(gen));
assert.deepEqual(Object.keys(directo).sort(), Object.keys(TEXTURAS).sort(), 'cada textura sale de un generador');
// 3.3: la carga sólo calcula las que usa el estilo pintado (las otras, en el momento si se piden)
assert.deepEqual((await import('../src/texturas-datos.js')).GENERADORES_EN_USO, ['manchas', 'vegetal'], 'la carga calcula sólo las manchas y el vegetal');
for (const [n, t] of Object.entries(TEXTURAS)) {
  assert.ok(directo[n] instanceof Uint8Array && directo[n].length === t.ancho * t.alto * 4, `${n}: tamaño`);
  assert.equal(sha(directo[n]), HUELLAS_270[n], `la textura ${n} cambió: tiene que dar los mismos bytes que la 2.7.0`);
}

// ---------------------------------------------------------------- el código del Worker
// Se corre tal cual en un contexto aislado (sin módulos ni nada del juego): tiene que
// alcanzarle con lo suyo y devolver los mismos bytes.
const ctx = { self: {} };   // (con sus propios Math y arreglos, como un Worker de verdad)
vm.createContext(ctx);
// (dentro de una función y con los globales a mano: en un contexto de vm cada búsqueda
// global es lenta; en un Worker de verdad no)
const api = vm.runInContext(`(() => {
const { Math, Float32Array, Float64Array, Uint8Array, Object, String } = globalThis;
${fuenteGenerador()}
return { rejilla, valor, crearCeldas };
})()`, ctx);
const recibidos = {};
ctx.self.postMessage = (m) => { assert.ok(!m.error, `worker: ${m.error}`); Object.assign(recibidos, m.datos); };
ctx.self.onmessage({ data: { generadores: GENERADORES } });
for (const n of Object.keys(TEXTURAS)) assert.equal(sha(recibidos[n]), HUELLAS_270[n], `el Worker da otra ${n}`);

// ---------------------------------------------------------------- el ruido de valor, número por número
// La cuenta original de la 2.7.0 contra la de ahora (sacada del mismo código del Worker)
function valor270(R, x, y) {
  const fx = x * R.nx, fy = y * R.ny;
  const xi = Math.floor(fx), yi = Math.floor(fy);
  let tx = fx - xi, ty = fy - yi;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  const x0 = ((xi % R.nx) + R.nx) % R.nx, y0 = ((yi % R.ny) + R.ny) % R.ny;
  const x1 = (x0 + 1) % R.nx, y1 = (y0 + 1) % R.ny;
  const g = R.g;
  const a = g[y0 * R.nx + x0], b = g[y0 * R.nx + x1], c = g[y1 * R.nx + x0], d = g[y1 * R.nx + x1];
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}
function celdas270(r, nx, ny) {
  const px = new Float32Array(nx * ny), py = new Float32Array(nx * ny), id = new Float32Array(nx * ny);
  for (let i = 0; i < nx * ny; i++) { px[i] = r(); py[i] = r(); id[i] = r(); }
  return (x, y) => {
    const fx = x * nx, fy = y * ny;
    const cx = Math.floor(fx), cy = Math.floor(fy);
    let f1 = 9, f2 = 9, idm = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j;
      const k = (((gy % ny) + ny) % ny) * nx + (((gx % nx) + nx) % nx);
      const dx = gx + px[k] - fx, dy = gy + py[k] - fy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) { f2 = f1; f1 = d; idm = id[k]; } else if (d < f2) f2 = d;
    }
    return [f1, f2, idm];
  };
}
{
  const az = rng(7401);
  const coords = [0, 1, -1, 0.5, 0.999999, -0.000001, 1e-9, -1e-9, 2.37, -3.61, 17.25];
  for (let k = 0; k < 4000; k++) coords.push((az() - 0.5) * 8);
  let pruebas = 0;
  for (const [nx, ny] of [[1, 1], [2, 40], [3, 6], [12, 3], [64, 64], [110, 110], [5, 7]]) {
    const R = api.rejilla(nx, ny, rng(nx * 131 + ny));
    for (let k = 0; k + 1 < coords.length; k++) {
      const x = coords[k], y = coords[coords.length - 1 - k];
      assert.ok(Object.is(api.valor(R, x, y), valor270(R, x, y)), `valor(${nx}×${ny}, ${x}, ${y})`);
      pruebas++;
    }
    const nueva = api.crearCeldas(rng(nx + 9), nx, ny), vieja = celdas270(rng(nx + 9), nx, ny);
    for (let k = 0; k + 1 < coords.length; k += 3) {
      const x = coords[k], y = coords[k + 1], a = [...nueva(x, y)], b = vieja(x, y);
      assert.ok(a.every((v, i) => Object.is(v, b[i])), `celdas(${nx}×${ny}, ${x}, ${y})`);
      pruebas++;
    }
  }
  assert.ok(pruebas > 30000);
}

// ---------------------------------------------------------------- simplex, número por número
{
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const simplex270 = (seed) => {
    const r = rng(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return (xin, yin) => {
      let n0 = 0, n1 = 0, n2 = 0;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t), y0 = yin - (j - t);
      const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { const g = GRAD[perm[ii + perm[jj]] & 7]; t0 *= t0; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { const g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { const g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }
      return 70 * (n0 + n1 + n2);
    };
  };
  const az = rng(99);
  for (const seed of [SEMILLA, 1, 12345]) {
    const viejo = simplex270(seed), nuevo = crearRuido(seed).simplex;
    for (let k = 0; k < 20000; k++) {
      const x = (az() - 0.5) * (k % 3 ? 20 : 4000), y = (az() - 0.5) * (k % 2 ? 20 : 4000);
      assert.ok(Object.is(nuevo(x, y), viejo(x, y)), `simplex(${seed}, ${x}, ${y})`);
    }
  }
}

// ---------------------------------------------------------------- terreno: el mismo valle por los tres caminos
const huellaTerreno = (T) => {
  const h = createHash('sha256');
  for (const [k, v] of Object.entries(T)) {
    if (ArrayBuffer.isView(v)) h.update(k).update(Buffer.from(v.buffer, v.byteOffset, v.byteLength));
    else if (Array.isArray(v)) h.update(k).update(JSON.stringify(v));
  }
  h.update(JSON.stringify(T.lugares || {}));
  // y además lo que la huella de la 2.2 no mira: consultas, salto, largo de la vía, claves
  h.update(JSON.stringify([T.saltoAgua, T.riel.largo, Object.keys(T)]));
  for (const x of [0.5, -123.4, 300.7, 151, -290]) for (const z of [7.25, -401.1, 222, 112]) {
    h.update(JSON.stringify([T.altura(x, z), T.normal(x, z), T.agua(x, z), T.indice(x, z), T.ruido.simplex(x * 0.01, z * 0.01), T.ruido.fbm(x * 0.003, z * 0.003, 4), T.radioLago(x), T.val(T.bosque, x, z)]));
  }
  return h.digest('hex').slice(0, 16);
};
const T0 = generarTerreno();
const huella0 = huellaTerreno(T0);
{
  // la huella de verificar-2-2.mjs, tal cual
  const h = createHash('sha256');
  for (const [k, v] of Object.entries(T0)) {
    if (ArrayBuffer.isView(v)) h.update(k).update(Buffer.from(v.buffer, v.byteOffset, v.byteLength));
    else if (Array.isArray(v)) h.update(k).update(JSON.stringify(v));
  }
  h.update(JSON.stringify(T0.lugares || {}));
  assert.equal(h.digest('hex').slice(0, 16), '2414ce1a25286f52', 'el valle cambió');
}
// de a pasos (como en la carga): cede varias veces y da lo mismo
{
  const it = pasosTerreno();
  let r = it.next(), pasos = 0;
  while (!r.done) { pasos++; r = it.next(); }
  assert.ok(pasos > 50, `cede seguido (${pasos} veces)`);
  assert.equal(huellaTerreno(armarTerreno(r.value)), huella0, 'de a pasos da el mismo valle');
}
// por la caché: se guarda (copiado), se clona como lo hace IndexedDB, se valida y se arma
{
  const datos = datosTerreno();
  const { grillas, meta } = partirDatosTerreno(datos);
  assert.deepEqual(Object.keys(grillas), GRILLAS_TERRENO);
  const clave = claveTerreno('2.7.4');
  const reg = armarRegistro(clave, grillas, meta);
  // lo guardado es una copia: si el juego después cambia sus arreglos, la caché no se entera
  datos.alturas[1234] += 5; datos.lugares.refugio.x += 1;
  const leido = structuredClone(reg);
  const esperado = Object.fromEntries(GRILLAS_TERRENO.map((n) => [n, { tipo: 'Float32Array', bytes: N * N * 4 }]));
  const ok = validarRegistro(leido, clave, esperado);
  assert.ok(ok, 'el registro del terreno se valida');
  assert.equal(huellaTerreno(armarTerreno(unirDatosTerreno(ok.partes, ok.meta))), huella0, 'desde la caché: el mismo valle, bit por bit');
  // y no se acepta nada raro
  assert.equal(validarRegistro(structuredClone(reg), claveTerreno('2.7.5'), esperado), null, 'otra versión: no');
  const roto = structuredClone(reg); roto.partes.alturas.datos[777] += 0.5;
  assert.equal(validarRegistro(roto, clave, esperado), null, 'un byte cambiado: no');
  const corto = structuredClone(reg); corto.partes.pasto.datos = corto.partes.pasto.datos.slice(0, 100);
  assert.equal(validarRegistro(corto, clave, esperado), null, 'otro tamaño: no');
  const otroTipo = structuredClone(reg); otroTipo.partes.bosque.datos = new Float64Array(otroTipo.partes.bosque.datos);
  assert.equal(validarRegistro(otroTipo, clave, esperado), null, 'otro tipo: no');
  const metaRota = structuredClone(reg); metaRota.meta.rio[3].x += 0.001;
  assert.equal(validarRegistro(metaRota, clave, esperado), null, 'recorridos cambiados: no');
  const sinParte = structuredClone(reg); delete sinParte.partes.estepa;
  assert.equal(validarRegistro(sinParte, clave, esperado), null, 'falta una grilla: no');
  for (const basura of [null, undefined, 3, 'x', {}, { clave }, { clave, partes: {} }]) assert.equal(validarRegistro(basura, clave, esperado), null);
}

// ---------------------------------------------------------------- texturas por la caché
{
  const clave = claveCarga({ que: 'texturas', version: '2.7.4', fuente: fuenteGenerador() });
  const reg = structuredClone(armarRegistro(clave, directo));
  const esperado = Object.fromEntries(Object.entries(TEXTURAS).map(([n, t]) => [n, { tipo: 'Uint8Array', bytes: t.ancho * t.alto * 4 }]));
  const ok = validarRegistro(reg, clave, esperado);
  assert.ok(ok);
  for (const n of Object.keys(TEXTURAS)) assert.equal(sha(ok.partes[n]), HUELLAS_270[n], `${n} desde la caché`);
}

// ---------------------------------------------------------------- la clave
{
  const base = { que: 'terreno', version: '2.7.4', semilla: SEMILLA, fuente: fuenteTerreno() };
  const k = claveCarga(base);
  assert.ok(k.includes('v2.7.4') && k.includes(`g${GENERACION_CACHE}`) && k.includes(`s${SEMILLA}`) && k.includes(huellaTexto(fuenteTerreno())), k);
  assert.equal(claveTerreno('2.7.4'), k);
  // cualquier cambio de versión, semilla o de una coma del código la cambia
  assert.notEqual(claveCarga({ ...base, version: '2.7.5' }), k);
  assert.notEqual(claveCarga({ ...base, semilla: 1 }), k);
  assert.notEqual(claveCarga({ ...base, fuente: base.fuente.replace('0.011', '0.012') }), k);
  assert.notEqual(claveCarga({ que: 'texturas', version: '2.7.4', fuente: fuenteGenerador() }), claveCarga({ que: 'texturas', version: '2.7.4', fuente: fuenteGenerador().replace('27011', '27012') }));
  // la huella del terreno mira todo lo que decide el valle (generador, ruido y constantes)
  for (const trozo of ['function* calcularTerreno', 'function crearRuido', 'function rng', '20260910', 'RIEL_CONTROL', 'indiceSegmentos']) assert.ok(fuenteTerreno().includes(trozo), trozo);
  // y es estable
  assert.equal(huellaTexto('hojarasca'), huellaTexto('hojarasca'));
  assert.notEqual(huellaTexto('hojarasca'), huellaTexto('hojarascA'));
  assert.match(huellaTexto(''), /^[0-9a-f]{16}$/);
  // la versión sale del comentario del build
  const doc = (data) => ({ head: { childNodes: [{ nodeType: 1 }, { nodeType: 8, data }] } });
  assert.equal(versionDelBuild(doc(' HOJARASCA BUILD 2.7.4 ')), '2.7.4');
  assert.equal(versionDelBuild(doc('otra cosa')), 'dev');
  assert.equal(versionDelBuild(undefined), 'dev');
  assert.equal(versionDelBuild({ get head() { throw new Error('x'); } }), 'dev');
  // la suma de control no depende de la alineación de la vista
  const b = new Uint8Array(1003); for (let i = 0; i < b.length; i++) b[i] = (i * 37) & 255;
  const suelta = new Uint8Array(1003 + 1); suelta.set(b, 1);
  assert.equal(sumaBytes(b), sumaBytes(suelta.subarray(1)));
  assert.notEqual(sumaBytes(b), sumaBytes(b.subarray(0, 1002)));
}

// ---------------------------------------------------------------- enganchado en la carga
{
  const main = leer('src/main.js');
  // las etapas, con sus textos y en su orden de siempre
  const etapas = ['Levantando los cerros', 'Asentando el suelo', 'Llenando el lago', 'Pintando el cielo', 'Plantando el bosque andino-patagónico',
    'Clavando los tablones del muelle', 'Tendiendo las vías de la trochita', 'Dejando crecer el pasto', 'Escondiendo frutillas y plumas',
    'Despertando la fauna patagónica', 'Soltando cisnes en el lago', 'Escondiendo un panal en un tronco', 'Avisándole a la gente del puesto', 'Afinando los sonidos del bosque'];
  let ultimo = -1;
  for (const e of etapas) { const i = main.indexOf(`paso('${e}'`); assert.ok(i > ultimo, `etapa en su lugar: ${e}`); ultimo = i; }
  const iPreparar = main.indexOf('const texturasEnCamino = prepararTexturas();');
  assert.ok(iPreparar > 0 && iPreparar < main.indexOf("paso('Levantando los cerros'"), 'las texturas arrancan antes que el valle');
  assert.ok(main.includes("paso('Levantando los cerros', 5, () => cargarTerreno({ info: infoCarga.terreno }))"), 'el valle sale de cargarTerreno');
  assert.ok(main.includes("await esperarTexturas('montana'); return crearCielo(escena, calidad);"), 'el cielo espera la montaña');
  assert.ok(main.includes("await esperarTexturas('manchas'); const p = crearPasto(calidad);"), 'el pasto espera las manchas');
  const iAfinar = main.indexOf("paso('Afinando los sonidos del bosque'");
  assert.ok(main.indexOf('await esperarTexturas();', iAfinar) < main.indexOf('variantesLuces.compilarCarga(', iAfinar), 'los materiales compilan con las texturas listas');
  // el Worker sale de un Blob: la política de contenido lo deja
  assert.match(leer('src/plantilla.html'), /Content-Security-Policy" content="[^"]*worker-src blob:/);
  // armar.mjs no reconoce `export async function` ni `export function*`
  for (const f of ['src/cache-carga.js', 'src/terreno.js', 'src/texturas.js', 'src/texturas-datos.js', 'src/ruido.js']) {
    assert.ok(!/^export\s+(async\s+function|function\s*\*)/m.test(leer(f)), `${f}: exportaciones que el empaquetador entiende`);
  }
  // el sonido no se guarda: sus recetas usan Math.random (cada arranque suena distinto) y se
  // sintetizan en ratos libres después del primer clic, no durante la carga
  assert.ok(!leer('src/sonido.js').includes('cache-carga'));
  assert.ok(JSON.parse(leer('package.json')).scripts.verify.includes('node pruebas/verificar-2-7-4-carga.mjs'), 'en npm run verify');
}

console.log(`2.7.4: carga · ${Object.keys(TEXTURAS).length} texturas idénticas a la 2.7.0 (directo, Worker y caché) · valor, celdas y simplex número por número · el mismo valle calculado, de a pasos y desde la caché · clave ${GENERACION_CACHE}`);
