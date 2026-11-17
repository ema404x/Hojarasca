// 4.30.0 (B): el refugio, las casas y la mochila. Con el valle de verdad (terreno, estructuras, colisiones, puertas, el paisaje del molino y la
// construcción, cargados como en main.js) y las funciones de main.js corridas con un mundo de mentira:
//   1. el espejo de pie va ADENTRO del refugio: el de fábrica se arma contra una pared libre, apoyado en el piso, a escuadra y mirando al cuarto;
//      se puede mover (Shift+Y) adentro y afuera; no pisa los muebles del refugio; cualquier otra pieza sigue sin entrar (regla de la 3.8.6);
//      las partidas de antes (espejo afuera, sin `espejoAdentro`) lo mudan adentro una vez; en el Desafío nada de esto;
//   2. la casa del molino se entra: por la escalerita, la galería y la puerta (que choca cerrada y se abre), con piso que se pisa, muebles que frenan
//      y la caja de los interiores del valle (interior-visible.js) que reconoce el adentro;
//   3. la mochila: cada casilla de la barra (95 cosas distintas) se tira con V (de a una y entera) y vuelve con E igual, pasando por guardar y
//      cargar el bulto: nada se pierde ni se duplica;
//   4. la plata: la billetera cuenta justo con cobros y pagos al azar y guardar y cargar en el medio, y comprar y vender en el mismo puesto de la
//      trochita nunca deja plata.
// Con mutaciones de verdad (un proceso por mutación: `--mutacion=<id>`).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { funcion, expresion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const MUT = (process.argv.find((a) => a.startsWith('--mutacion=')) || '').slice(11);

// ---------------------------------------------------------------- las mutaciones (el texto que cambian; cada una tiene que hacer fallar algo)
const MUTACIONES = {
  'sin-refugio': ['src/construccion.js', 'if (esquinas.every((q) => T.dentroRefugioPropio(q.x, q.z))) {', 'if (false) {'],
  'sin-escuadra': ['src/construccion.js', 'if (Number.isFinite(r0)) return {', 'if (false) return {'],
  'sin-choques': ['src/construccion.js', 'if (muebleEnHuella(x, z, plano, rot, piso) || encimaDeMueblesDelRefugio(x, z, plano, rot))', 'if (encimaDeMueblesDelRefugio(x, z, plano, rot))'],
  'sin-muebles-fijos': ['src/construccion.js', 'if (!ref || !Array.isArray(lista)) return false;', 'return false;'],
  'sin-mesa-fija': ['src/estructuras.js', 'ref.muebles = [{ lx: MESA.x, lz: MESA.z, largo: 1.8, ancho: 0.9 }, ', 'ref.muebles = ['],
  'sin-deco': ['src/construccion.js', 'if ((o.duenio && !o.duenio.deco) || o.despejado || o.apagado || o.dinamico', 'if (o.duenio || o.despejado || o.apagado || o.dinamico'],
  'piso-terreno': ['src/construccion.js', "return { ok: true, base: piso, sobrePlataforma: true };", "return { ok: true, base: T.altura(x, z), sobrePlataforma: true };"],
  'espejo-afuera': ['src/main.js', 'for (const l of lugaresDelEspejo(ref)) {   // 4.30.0 (B): adentro, primero', 'for (const l of []) {'],
  'sin-mudar': ['src/main.js', "const afuera = espejos.find((o) => Math.hypot(o.datos.x - ref.x, o.datos.z - ref.z) < 6.5);", 'const afuera = null;'],
  'casa-cerrada': ['src/molino-paisaje.js', 'seg([x0, z1], [cx - VANO_MEDIO - 0.2, z1], 0.2, yA, yB); seg([cx + VANO_MEDIO + 0.2, z1], [x1, z1], 0.2, yA, yB);', 'seg([x0, z1], [x1, z1], 0.2, yA, yB);'],
  'galeria-cerrada': ['src/molino-paisaje.js', 'seg([gx0 - 0.3, gz1], [cx - 0.75, gz1], 0.2, yA, yB); seg([cx + 0.75, gz1], [gx1 + 0.3, gz1], 0.2, yA, yB);', 'seg([gx0 - 0.3, gz1], [gx1 + 0.3, gz1], 0.2, yA, yB);'],
  'sin-pisos': ['src/molino-paisaje.js', "for (const p of plataformas) col.agregarPlataforma?.({ ...p, duenio: 'molino-paisaje' });", ''],
  'sin-puerta': ['src/molino-paisaje.js', 'if (puertas?.agregar) puertas.agregar({', 'if (false) puertas.agregar({'],
  'sin-muebles-casa': ['src/molino-paisaje.js', 'const segL = (a, b, r, alto) => seg(a, b, r, yP - 0.1, yP + alto);', 'const segL = () => {};'],
  'cobrar-de-mas': ['src/economia.js', 'const e = progreso.economia, antes = entero(e.pesos), despues = Math.min(MAX_PESOS, antes + n), entra = despues - antes;', 'const e = progreso.economia, antes = entero(e.pesos), despues = Math.min(MAX_PESOS, antes + n + (n > 4000 ? 1 : 0)), entra = despues - antes;'],
  'venta-cara': ['src/comercio.js', 'const compra = Math.max(venta + 1, Math.ceil(v * (1 + COMERCIO.margen)', 'const compra = Math.max(1, Math.floor(0.9 * v * (1 - COMERCIO.margen)'],
  'tirar-pierde': ['src/tirar.js', 'if (k === \'ramitas\') progreso.ramitas = entero(progreso.ramitas) + q;\n      else if (k === \'material\') { if (!progreso.materiales || typeof progreso.materiales !== \'object\') progreso.materiales = {}; progreso.materiales[carga.id] = entero(progreso.materiales[carga.id]) + q; }',
    'if (k === \'ramitas\') progreso.ramitas = entero(progreso.ramitas) + q;\n      else if (k === \'material\') { if (!progreso.materiales || typeof progreso.materiales !== \'object\') progreso.materiales = {}; progreso.materiales[carga.id] = entero(progreso.materiales[carga.id]) + q - 1; }'],
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
  console.log(`OK 4.30.0 (B) · ${ids.length} mutaciones detectadas`);
  process.exit(0);
}

// ---------------------------------------------------------------- el hijo
if (MUT) {
  const [f, a, b] = MUTACIONES[MUT];
  const abs = path.join(raiz, f);
  globalThis.__cambiarFuente = (archivo, texto) => (path.resolve(archivo) === path.resolve(abs) ? texto.replace(a, b) : texto);
}
const fuente = (f) => (globalThis.__cambiarFuente ? globalThis.__cambiarFuente(path.join(raiz, f), leer(f)) : leer(f));
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 3. la mochila (puro, sin el valle)
{
  // (tirar.js por texto, para que la mutación llegue: se copia a un archivo temporal con otro nombre; sus imports apuntan a src/)
  const tmp = path.join(raiz, 'src', `__tirar-4-30-0-b-${process.pid}.js`);
  fs.writeFileSync(tmp, fuente('src/tirar.js'));
  let TI;
  try { TI = await import(pathToFileURL(tmp).href); } finally { fs.rmSync(tmp, { force: true }); }
  const imp = (x) => import(pathToFileURL(path.join(raiz, 'src', x)).href);
  const M = await imp('mochila.js'), CP = await imp('cocina-pasos.js'), RZ = await imp('recursos-zona.js'), G = await imp('granja.js');
  const ent = {};
  const pon = (k, n = 3) => { ent[k] = { dia: 1, hora: 9, cantidad: n }; };
  for (const k of ['pinon', 'calafate', 'frutilla', 'pluma', 'llaollao', 'frasco-frutilla', 'calafate-seco', 'hongos-secos', 'canto', 'haba', 'huevo', 'papa', 'miel', 'trucha-fresca', 'pan-casero', 'empanadas', 'trucha-ahumada', 'leche', 'carne-vaca', 'carne-cordero', 'carne-cerdo', 'chorizo', 'fardo']) pon(k);
  for (const e of ['coihue', 'lenga', 'nire', 'cipres']) pon('semilla-' + e);
  for (const e of ['coihue', 'lenga', 'nire', 'cipres', 'pehuen']) pon('plantin-' + e);
  for (const k of G.ORDEN_FRUTALES) { pon(G.FRUTALES[k].fruta); pon(G.FRUTALES[k].plantin); }
  for (const k of Object.keys(CP.COMIDAS)) pon(k, 2);
  const cosas = { hacha: true, pico: true, manta: true, grabador: true, tijera: true, mosca: true, yerba: 4, harina: 3, poncho: 2, 'semillas-habas': 3, 'semillas-papa': 2 };
  for (const k of CP.DEL_ALMACEN) cosas[k] = 3;
  for (const k of RZ.IDS_HERRAMIENTAS_ZONA) cosas[k] = 1;
  for (const c of M.COSAS_HISTORIA_MOCHILA) cosas[c.id] = 1;
  const mat = { tronco: 5, tabla: 4, piedra: 6, lana: 2, cristal: 3 };
  for (const k of RZ.IDS_MATERIALES_ZONA) mat[k] = 5;
  const base = { modo: 'relax', dia: 3, horas: 10, ramitas: 7, entradas: ent, cosas, materiales: mat, grabaciones: {}, dejadas: {} };
  const clon = (o) => JSON.parse(JSON.stringify(o));
  const barra = (p) => JSON.stringify(M.armarMochila(clon(p), {}).map((x) => [x.id, x.cuenta]));
  const ranuras = M.armarMochila(clon(base), {});
  ok(ranuras.length >= 90, `la mochila de prueba llena la barra con casi todo lo del juego (${ranuras.length} casillas)`);
  const noSe = [];
  let vueltas = 0;
  for (const r of ranuras) for (const todo of [false, true]) {
    const p = clon(base);
    const no = TI.motivoParaNoTirar(p, r.id);
    if (no) { if (!todo) noSe.push(r.id); continue; }
    const t = TI.sacarDeMochila(p, r.id, { todo, nombre: r.nombre });
    ok(t.ok, `${r.id}: se tira con V`);
    assert.equal(t.carga.n, todo ? (r.cuenta || 1) : 1, `${r.id} (${todo ? 'entero' : 'de a uno'}): sale lo que se pidió`);
    const [b] = TI.sanearBultos([{ x: 1, y: 0, z: 1, carga: clon(t.carga) }]);
    ok(!!b, `${r.id}: el bulto sobrevive a guardar y cargar`);
    const d = TI.devolverAMochila(p, b.carga);
    ok(d.ok && !d.resto, `${r.id}: vuelve entero con E`);
    assert.equal(barra(p), barra(base), `${r.id} (${todo ? 'entero' : 'de a uno'}): la barra queda exactamente igual (nada se pierde ni se duplica)`);
    vueltas++;
  }
  assert.deepEqual(noSe.sort(), ['camara', ...M.COSAS_HISTORIA_MOCHILA.map((c) => c.id)].sort(), 'sólo la cámara y lo de la Historia no se tiran');
  ok(vueltas >= 180, `${vueltas} idas y vueltas por el suelo`);
}

// ---------------------------------------------------------------- 4. la plata: no se duplica ni se pierde
{
  const tmpE = path.join(raiz, 'src', `__economia-4-30-0-b-${process.pid}.js`), tmpC = path.join(raiz, 'src', `__comercio-4-30-0-b-${process.pid}.js`);
  fs.writeFileSync(tmpE, fuente('src/economia.js')); fs.writeFileSync(tmpC, fuente('src/comercio.js'));
  let EC, CO;
  try { EC = await import(pathToFileURL(tmpE).href); CO = await import(pathToFileURL(tmpC).href); } finally { fs.rmSync(tmpE, { force: true }); fs.rmSync(tmpC, { force: true }); }
  // la billetera: mil movimientos al azar (cobrar y pagar, montos raros), con guardar y cargar en el medio
  let semilla = 4300;
  const azar = () => { semilla = (Math.imul(semilla, 1103515245) + 12345) >>> 0; return semilla / 4294967296; };
  const p = { modo: 'relax', dia: 4, economia: EC.economiaNueva() };
  let esperado = 0, malos = 0;
  for (let i = 0; i < 1000; i++) {
    const monto = [Math.floor(azar() * 5000), -3, 0, 2.7, '12', NaN][i % 6 === 5 ? 1 + Math.floor(azar() * 5) : 0];
    const n = Math.max(0, Math.floor(Number(monto) || 0));
    if (azar() < 0.55) { const r = EC.cobrar(p, monto, 'prueba'); if (n > 0) esperado += n; if (r.ok !== (n > 0)) malos++; }
    else { const r = EC.pagar(p, monto, 'prueba'); if (n > 0 && esperado >= n) { esperado -= n; if (!r.ok) malos++; } else if (r.ok && n > 0) malos++; }
    if (EC.pesosDe(p) !== esperado || p.economia.pesos < 0) malos++;
    if (i % 97 === 0) p.economia = EC.sanearEconomia(JSON.parse(JSON.stringify(p.economia)));
  }
  ok(malos === 0 && EC.pesosDe(p) === esperado, `la billetera cuenta justo en 1000 movimientos con guardar y cargar en el medio (${EC.pesosDe(p)} = ${esperado})`);
  ok(p.economia.ganado - p.economia.gastado === EC.pesosDe(p), 'lo ganado menos lo gastado es lo que hay');
  ok(!EC.pagar(p, EC.pesosDe(p) + 1).ok && EC.pesosDe(p) === esperado, 'pagar de más no deja la billetera en negativo ni la toca');
  ok(EC.pesosDe({ modo: 'desafio', economia: { pesos: 500 } }) === 0 && !EC.cobrar({ modo: 'desafio', economia: EC.economiaNueva() }, 100).ok, 'en el Desafío no hay pesos');
  // los puestos de la trochita: comprar un lote y venderlo en el mismo puesto siempre pierde (no hay plata gratis en un mostrador)
  const nombres = [...new Set(['Estación del Valle', 'Parada del Mallín', 'Parada Alta', 'Apeadero del Lago', 'Un pueblo cualquiera', 'Otro más'])];
  let vueltas = 0, ganancias = 0;
  for (const nom of nombres) for (const bien of CO.bienesDe(nom)) for (const t of CO.TEMPORADAS) for (const factor of [0.5, 1, 1.7]) for (const dia of [1, 9, 33]) {
    const c = CO.comercioNuevo();
    let caja = 1e9;
    const ini = caja;
    for (let k = 0; k < 6; k++) {
      const a = CO.comprar(c, nom, bien, dia, t, caja, factor); if (!a.ok) break; caja -= a.precio;
      const b = CO.vender(c, nom, bien, dia, t, a.cantidad, factor); if (!b.ok) break; caja += b.precio;
      vueltas++;
    }
    if (caja >= ini) ganancias++;
  }
  ok(vueltas > 1000 && ganancias === 0, `comprar y vender en el mismo puesto nunca deja plata (${vueltas} vueltas, ${ganancias} con ganancia)`);
}

// ---------------------------------------------------------------- 1 y 2. el valle de verdad
const { cargarValle } = await import('./ayuda-4-0-3-valle.mjs');
const { M, valle } = cargarValle(['molino-paisaje.js', 'molino-paisaje-plano.js', 'construccion.js']);
const v = valle({ aldea: true });
const { T, col, est, veg, puertas } = v;
const main = fuente('src/main.js');
// las reglas de main.js: los interiores fijos (como la 4.0.3) y las nuevas del refugio, con el código de verdad
const interiores = []; const agregar = (l, r) => { if (l && typeof l.x === 'number') interiores.push({ x: l.x, z: l.z, r }); };
const L = T.lugares; agregar(L.refugio, 3.1); for (const c of est.cabañas) agregar(c, 2.6); agregar(L.almacen, 4.2);
T.interiorFijo = (x, z) => interiores.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
const enMiRefugio = funcion(main, 'enMiRefugio', { T, esDesafio: false });
const pisoDelRefugio = expresion(main, 'const pisoDelRefugio = ', { T });
const ESPEJO_EN_REFUGIO = expresion(main, 'const ESPEJO_EN_REFUGIO = ');
const lugaresDelEspejo = funcion(main, 'lugaresDelEspejo', { ESPEJO_EN_REFUGIO });
const entornoT = { T, enMiRefugio, pisoDelRefugio };
T.dentroRefugioPropio = expresion(main, 'T.dentroRefugioPropio = ', entornoT);
T.ejesRefugio = expresion(main, 'T.ejesRefugio = ', entornoT);
T.pisoRefugio = expresion(main, 'T.pisoRefugio = ', entornoT);
ok(funcion(main, 'enMiRefugio', { T, esDesafio: true })(L.refugio.x, L.refugio.z) === false && enMiRefugio(L.refugio.x, L.refugio.z) === true, 'en el Desafío el refugio no recibe muebles; en el Relax, sí');
const mp = M.molino_paisaje.crearMolinoPaisaje({ T, escena: v.escena, col, molino: est.molino, densidad: 1, puertas });
const obras = M.construccion.crearConstruccion(T, v.escena, col, veg, puertas);
const { PLANO } = M.construccion;
const ref = L.refugio, c = Math.cos(ref.rot), s = Math.sin(ref.rot), piso = pisoDelRefugio(ref);
const aM = (lx, lz) => ({ x: ref.x + lx * c + lz * s, z: ref.z - lx * s + lz * c });
const aL = (x, z) => { const dx = x - ref.x, dz = z - ref.z; return { lx: dx * c - dz * s, lz: dx * s + dz * c }; };
const aEscuadra = (rot) => { const k = (rot - ref.rot) / (Math.PI / 2); return Math.abs(k - Math.round(k)) < 1e-6; };
const E = PLANO.espejo;
ok(E.entraEnRefugio === true && !PLANO['mesa-campo'].entraEnRefugio, 'el espejo es de los muebles que entran en el refugio (y la mesa de campo, no)');
const sitio = (lx, lz, rotL = 0, plano = E, ignorar = null) => { const q = aM(lx, lz); return obras.revisarSitio(q.x, q.z, plano, ref.rot + rotL, ignorar, null, piso); };
// los lugares del espejo de fábrica: los tres sirven, sobre el piso
for (const [i, l] of lugaresDelEspejo(ref).entries()) {
  const r = obras.revisarSitio(l.x, l.z, E, l.rot, null, null, piso);
  ok(r.ok && Math.abs(r.base - piso) < 1e-9, `el lugar ${i + 1} del espejo de fábrica sirve y apoya en el piso del refugio (${r.motivo || 'ok'})`);
}
// lo que no se puede: encima de los muebles del refugio, atravesando la pared, y otras piezas adentro
ok(!sitio(2.2, -2.0).ok, 'no se pone encima de la cama del refugio');
ok(!sitio(1.1, -0.98).ok, 'ni en la mesa');
ok(!sitio(-2.4, -2.2).ok, 'ni en el hogar');
ok(!sitio(-2.65, 1.21).ok, 'ni en la leña de adentro');
ok(!sitio(-3.4, 0.3, Math.PI / 2).ok, 'ni atravesando la pared');
ok(sitio(0, 0.3).ok && sitio(0.5, 1.0, Math.PI).ok, 'en el medio del cuarto, sí');
ok(!sitio(0, 0.3, 0, PLANO['mesa-campo']).ok && !sitio(0, 0.3, 0, PLANO.banco).ok, 'cualquier otra pieza sigue sin armarse adentro del refugio (regla de la 3.8.6)');
// los adornos de Personalizar cuentan (un rincón de mentira, con su dueño `{ deco }`, en el medio)
{ const q = aM(0, 0.3), deco = { duenio: { deco: 'prueba' }, x: q.x, z: q.z, r: 0.3, alturaMin: piso - 0.1, alturaMax: piso + 1 }; col.agregar(deco); ok(!sitio(0, 0.3).ok, 'no pisa un adorno de Personalizar'); col.eliminar(deco); ok(sitio(0, 0.3).ok, '(sin el adorno, ahí entra)'); }
// un giro torcido se pone a escuadra con las paredes (y se saca: era una prueba)
{
  obras.elegir(PLANO.espejo);
  obras.fijarRotacion(ref.rot + 0.25);
  const q = aM(0, 0.3), f1 = obras.fundar(q.x, q.z, 0, piso);
  ok(f1.ok && aEscuadra(f1.obra.datos.rot), `un espejo torcido adentro queda a escuadra con las paredes (${f1.motivo || 'ok'})`);
  obras.destruir?.(f1.obra);
  ok(!obras.obras.includes(f1.obra), '(se saca)');
  obras.elegir(null);
}
// el espejo de fábrica, con colocarEspejoDeFabrica de verdad: adentro, girado como pide y apoyado en el piso
const progresoF = { personal: { bruno: { espejoPuesto: false } }, obras: [] };
const marcas = [];
const hayEspejoArmado = expresion(main, 'const hayEspejoArmado = ', { obras });
const colocar = funcion(main, 'colocarEspejoDeFabrica', { secciones: () => [{ id: 'bruno' }], obras, esDesafio: false, progreso: progresoF, PLANO, T, hayEspejoArmado, lugaresDelEspejo, pisoDelRefugio, cambiarPersonal: (_s, d) => marcas.push(d), console });
colocar();
const espejo = obras.obras.find((o) => o.plano.id === 'espejo');
ok(!!espejo && marcas.length === 1 && marcas[0].espejoPuesto === true && marcas[0].espejoAdentro === true, 'el espejo de fábrica se arma y se anota puesto y adentro');
{ const p = aL(espejo.datos.x, espejo.datos.z); ok(Math.abs(p.lx) < 3.5 && Math.abs(p.lz) < 2.75, `queda adentro del refugio (lx ${p.lx.toFixed(2)}, lz ${p.lz.toFixed(2)})`); }
ok(Math.abs(espejo.datos.y - piso) < 1e-9, 'apoyado en las tablas del piso, ni hundido ni flotando');
ok(aEscuadra(espejo.datos.rot), 'a escuadra con las paredes del refugio');
{ const frente = { x: -Math.sin(espejo.datos.rot), z: -Math.cos(espejo.datos.rot) }, alCentro = { x: ref.x - espejo.datos.x, z: ref.z - espejo.datos.z };
  ok(frente.x * alCentro.x + frente.z * alCentro.z > 0, 'el vidrio mira al cuarto (no a la pared)'); }
ok(espejo.datos.etapas >= E.etapas.length, 'armado (gratis)');
// moverlo con la edición (Shift+Y): a la pared de la derecha y después afuera
{
  const e = obras.iniciarEdicionCerca({ x: espejo.datos.x, z: espejo.datos.z, y: espejo.datos.y }, 1);
  ok(e.ok && e.obra === espejo, 'se agarra para mover');
  const l1 = lugaresDelEspejo(ref)[1];
  obras.fijarRotacion(l1.rot - 0.3);
  const r = obras.confirmarEdicion(l1.x, l1.z, 0, piso);
  ok(r.ok && aEscuadra(espejo.datos.rot) && Math.abs(espejo.datos.y - piso) < 1e-9, `se mueve a otra pared del refugio, a escuadra y en el piso (${r.motivo || 'ok'})`);
  const e2 = obras.iniciarEdicionCerca({ x: espejo.datos.x, z: espejo.datos.z, y: espejo.datos.y }, 1);
  const q = aM(-2.5, 5.0);
  const r2 = e2.ok ? obras.confirmarEdicion(q.x, q.z, ref.rot, null) : e2;
  ok(r2.ok, `y también se puede llevar afuera (${r2.motivo || 'ok'})`);
}
// una partida de antes: el espejo afuera, sin `espejoAdentro` → se muda adentro al cargar (mudarEspejoAdentro, con el código de verdad)
{
  const progreso = { personal: { bruno: { espejoPuesto: true, espejoAdentro: false } }, obras: [] };
  const mudar = funcion(main, 'mudarEspejoAdentro', { progreso, esDesafio: false, obras, PLANO, T, enMiRefugio, lugaresDelEspejo, pisoDelRefugio, console });
  ok(mudar() === true, 'una partida vieja con el espejo afuera lo muda adentro');
  const p = aL(espejo.datos.x, espejo.datos.z);
  ok(enMiRefugio(espejo.datos.x, espejo.datos.z, 0.16) && Math.abs(espejo.datos.y - piso) < 1e-9 && aEscuadra(espejo.datos.rot), `queda adentro, en el piso y a escuadra (lx ${p.lx.toFixed(2)}, lz ${p.lz.toFixed(2)})`);
  ok(progreso.personal.bruno.espejoAdentro === true && progreso.obras.some((d) => d === espejo.datos), 'se anota (una sola vez) y la posición nueva es la que se guarda');
  const x0 = espejo.datos.x;
  ok(mudar() === false && espejo.datos.x === x0, 'la segunda vez no hace nada');
  // si lo llevaste lejos, no se toca
  const e = obras.iniciarEdicionCerca({ x: espejo.datos.x, z: espejo.datos.z, y: espejo.datos.y }, 1);
  const q = aM(0, 12);
  ok(e.ok && obras.confirmarEdicion(q.x, q.z, ref.rot, null).ok, '(lo llevo lejos del refugio)');
  progreso.personal.bruno.espejoAdentro = false;
  ok(mudar() === true && aL(espejo.datos.x, espejo.datos.z).lz > 10, 'un espejo que llevaste lejos se queda donde lo dejaste');
}
// las partidas guardadas: `espejoAdentro` sobrevive a sanear
{ const B = await import(pathToFileURL(path.join(raiz, 'src', 'personal-bruno.js')).href);
  ok(B.brunoDefecto().espejoAdentro === false && B.sanearBruno({ espejoAdentro: true }).espejoAdentro === true && B.sanearBruno({ espejoAdentro: 'sí' }).espejoAdentro === false && B.sanearBruno({}).espejoAdentro === false, '`espejoAdentro` se guarda y se carga (sólo verdadero si vino verdadero)'); }

// ---------------------------------------------------------------- 2. la casa del molino
{
  const mol = est.molino, ca = mp.casa, cr = Math.cos(mol.rot), sr = Math.sin(mol.rot);
  const mM = (lx, lz) => ({ x: mol.x + lx * cr + lz * sr, z: mol.z - lx * sr + lz * cr });
  const mL = (x, z) => { const dx = x - mol.x, dz = z - mol.z; return { lx: dx * cr - dz * sr, lz: dx * sr + dz * cr }; };
  // un cuerpo que camina con las colisiones y los pisos (como jugador.js: sube escalones de hasta 0,6 m, se apoya en lo más alto)
  const caminar = (desde, hasta, paso = 0.05) => {
    const a = mM(...desde), b = mM(...hasta), n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / paso);
    const pos = { x: a.x, z: a.z, y: T.altura(a.x, a.z) };
    let alto = 0;
    for (let i = 1; i <= n; i++) {
      const nx = a.x + (b.x - a.x) * i / n, nz = a.z + (b.z - a.z) * i / n;
      const pl = col.plataformaEn(nx, nz, pos.y, 0.6);
      const y = Math.max(T.altura(nx, nz), pl ? pl.alto : -Infinity);
      if (y - pos.y > 0.62) break;   // un escalón de más: no se sube
      const t = { x: nx, y, z: nz };
      col.resolver(t, 0.35, 1.65);
      if (Math.hypot(t.x - nx, t.z - nz) > 0.04) break;
      alto = Math.max(alto, y - pos.y); pos.x = nx; pos.z = nz; pos.y = y;
    }
    return { ...mL(pos.x, pos.z), y: pos.y, subida: alto };
  };
  const pu = puertas.lista ? puertas.lista.find((p) => p.nombre === 'la puerta de la casa del molino') : null;
  ok(!!pu, 'la casa del molino tiene puerta de verdad');
  // cerrada: se llega a la puerta y se frena en la hoja
  const cerrada = caminar([ca.cx, ca.gz1 + 4], [ca.cx, ca.cz]);
  ok(cerrada.lz > ca.z1 - 0.1 && cerrada.lz < ca.z1 + 0.8 && Math.abs(cerrada.y - ca.F) < 0.05, `por la escalerita y la galería se llega a la puerta cerrada, a la altura del piso (lz ${cerrada.lz.toFixed(2)}, y ${(cerrada.y - ca.F).toFixed(2)} del piso)`);
  ok(cerrada.subida <= 0.35, `los escalones son parejos (el más alto sube ${cerrada.subida.toFixed(2)} m)`);
  // abierta: se entra hasta los muebles, sobre el piso
  puertas.accionar(pu); for (let i = 0; i < 60; i++) puertas.actualizar(0.05);
  const adentro = caminar([ca.cx, ca.gz1 + 4], [ca.cx, ca.z0 + 0.4]);
  ok(adentro.lz < ca.z1 - 0.5 && Math.abs(adentro.y - ca.F) < 0.02, `con la puerta abierta se entra y se camina sobre el piso de la casa (lz ${adentro.lz.toFixed(2)}, y ${(adentro.y - ca.F).toFixed(2)})`);
  ok(adentro.lz > ca.cz - 0.4, `la mesa frena (no se atraviesa): se frenó en lz ${adentro.lz.toFixed(2)}`);
  // por los costados de la galería, la baranda sigue frenando; las paredes de la casa también
  for (const lx of [ca.cx - 2.3, ca.cx + 2.3]) { const r = caminar([lx, ca.gz1 + 4], [lx, ca.cz]); ok(r.lz > ca.gz1 - 0.8, `la baranda de la galería frena (lx ${lx.toFixed(1)}: lz ${r.lz.toFixed(2)})`); }
  { const r = caminar([ca.x1 + 3, ca.cz], [ca.cx, ca.cz]); ok(r.lx > ca.x1 - 0.2, 'la pared del costado frena'); }
  // se sale caminando
  { const r = caminar([ca.cx + 0.1, ca.cz + 0.9], [ca.cx + 0.1, ca.gz1 + 4]); ok(r.lz > ca.gz1 + 3, `se sale por la puerta y baja la escalerita (lz ${r.lz.toFixed(2)})`); }
  // la caja de los interiores (interior-visible.js): adentro sí, en la galería y afuera no; sólo la puerta deja ver para afuera
  const IV = await import(pathToFileURL(path.join(raiz, 'src', 'interior-visible.js')).href);
  const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
  const cam = (lx, lz, y = 1.6) => ({ ...mM(lx, lz), y: ca.F + y });
  ok(IV.interiorDeCaja(cam(ca.cx + 1, ca.cz), mp.interior, sal)?.id === 'casa-molino', 'adentro de la casa, la caja la reconoce');
  ok(!IV.interiorDeCaja(cam(ca.cx, ca.gz1 - 0.8), mp.interior, sal) && !IV.interiorDeCaja(cam(ca.cx, ca.cz, 4), mp.interior, sal), 'en la galería o arriba del techo, no');
  const it = IV.interiorDeCaja(cam(ca.cx, ca.cz), mp.interior, sal);
  const mira = (lx, lz) => { const a = mM(0, 0), b = mM(lx, lz); return { x: b.x - a.x, z: b.z - a.z }; };
  ok(IV.apagarExteriorAhora(it, cam(ca.cx, ca.cz), mira(0, -1), IV.cosVistaDe(70, 16 / 9)) === true, 'mirando al fondo (de espaldas a la puerta) no se dibuja lo de afuera');
  ok(IV.apagarExteriorAhora(it, cam(ca.cx, ca.cz), mira(0, 1), IV.cosVistaDe(70, 16 / 9)) === false, 'mirando a la puerta, se dibuja todo');
  ok(/if \(nombre === 'molino-paisaje' && it\.id === 'casa-molino'\) \{ for \(const h of o\.children\) if \(h\.name !== 'molino-paisaje-obras'\) ocultar\(h\); continue; \}/.test(main) && main.includes('const casaMolino = est?.molinoPaisaje?.interior;'), 'main.js usa la caja y, adentro, deja la casa (la misma malla que los cercos) a la vista');
}
console.log(`OK 4.30.0 (B)${MUT ? ' [mutación ' + MUT + ']' : ''} · ${pasos} comprobaciones · el espejo adentro del refugio, la casa del molino se entra y la mochila no pierde ni duplica`);
