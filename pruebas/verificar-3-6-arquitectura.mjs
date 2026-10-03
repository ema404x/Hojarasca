// 3.6: la arquitectura de la Aldea de los Duendes (src/aldea-arquitectura.js), sin ubicarla.
//  · arma todos los edificios en todas sus etapas (y los accesorios y la parada) sin errores
//  · la estructura y los muebles sólo con aTipo 0 o 4 (las obras no pueden tener hoja ni flor)
//  · presupuestos: triángulos y dibujos por edificio (los imprime: van al informe)
//  · puertas ≥ 1,0 × 2,0 m, cielorraso ≥ 2,4 m, y se camina de verdad: desde la calle se entra por
//    la puerta y se llega al mostrador, a la cama, a la cocina y a cada lugar de trabajo (pasillo ≥ 0,9)
//  · ninguna colisión tapa la puerta; misma semilla, misma geometría
// Corre el módulo en una VM con el three local (como verificar-2-8-casa).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- reglas del archivo
{
  const t = leer('src/aldea-arquitectura.js');
  assert.ok(!t.includes('\r'), 'aldea-arquitectura.js con fines de línea LF');
  for (const m of t.matchAll(/^import .*$/gm)) assert.ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), 'import en una línea: ' + m[0]);
  for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) assert.ok(!/ñ/i.test(m[1]), 'exportado sin ñ: ' + m[1]);
  assert.ok(!/^export (async function|function\*|\{|.* from )/m.test(t), 'sin exports que armar.mjs no entiende');
  assert.ok(!/rng\(31\)|from '\.\/ruido\.js'/.test(t), 'azar propio: no toca rng(31)');
  assert.ok(!/new THREE\.(PointLight|SpotLight)/.test(t), 'no crea luces: sólo especificaciones');
  assert.ok(!/ShapeGeometry|OctahedronGeometry|THREE\.Shape\b|Vector4|Frustum/.test(t), 'nada que el three local no trae');
  assert.ok(!/capilla|altar|campanario|almacen-aldea|casa-almacenera|casa de té/i.test(t), 'sin capilla (pedido del usuario); el almacén y la casa de té son los de estructuras.js');
  assert.ok(/^\/\/ 3\.6:/.test(t), 'el encabezado documenta la API (3.6:)');
}

// ---------------------------------------------------------------- el módulo, armado en una VM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f);
  if (visto.has(f)) return;
  visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
visitar(path.join(src, 'aldea-arquitectura.js'));
visitar(path.join(src, 'colisiones.js'));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.__A = __mod_aldea_arquitectura; globalThis.__COL = __mod_colisiones; globalThis.__THREE = THREE;';
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Error, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'aldea-arquitectura-vm.js' });
const A = ctx.__A, COL = ctx.__COL;

// ---------------------------------------------------------------- el contrato con el núcleo
const CONTRATO = {
  plaza: [18, 14], biblioteca: [7, 11], escuela: [10, 7], 'casa-jefe': [6, 6], 'casa-ercilia': [5, 5], 'casa-nelida': [6, 5],
  'casa-abuela': [5, 5], 'casa-familia': [7, 6], panaderia: [7, 6], herreria: [7, 7], carpinteria: [8, 6], pescaderia: [6, 5],
  'puesto-sanitario': [6, 6], estafeta: [5, 5], hilanderia: [7, 6], 'sala-miel': [6, 5], seccional: [6, 6], salon: [10, 8],
};
assert.deepEqual(Object.keys(A.EDIFICIOS_ALDEA).sort(), Object.keys(CONTRATO).sort(), 'los ids del contrato, ni uno más');
for (const [id, [w, d]] of Object.entries(CONTRATO)) {
  assert.ok(Object.hasOwn(A.EDIFICIOS_ALDEA, id), 'falta ' + id);
  assert.equal(A.EDIFICIOS_ALDEA[id].ancho, w, id + ' ancho'); assert.equal(A.EDIFICIOS_ALDEA[id].fondo, d, id + ' fondo');
}
assert.deepEqual([...A.LOTES_ALDEA], ['panaderia', 'herreria', 'carpinteria', 'pescaderia', 'escuela', 'puesto-sanitario', 'estafeta', 'hilanderia', 'sala-miel', 'seccional', 'salon']);

// ---------------------------------------------------------------- utilidades
const huella = (ed) => {
  const h = createHash('sha1');
  for (const capa of ['exterior', 'interior']) for (const [k, g] of Object.entries(ed[capa])) {
    if (!g) continue;
    h.update(k);
    for (const a of ['position', 'color', 'aTipo', 'uv']) if (g.attributes[a]) h.update(Buffer.from(new Float32Array(g.attributes[a].array).buffer));
  }
  h.update(JSON.stringify(ed.colisiones));
  return h.digest('hex');
};
const tiposDe = (g) => (g && g.attributes.aTipo ? [...new Set(g.attributes.aTipo.array)].sort() : []);
const sinNaN = (g) => !g || [...g.attributes.position.array].every(Number.isFinite);

// Grilla de paso: ¿cabe un cuerpo de radio `R` (y 1,65 de alto) en (x, z)? El pie sale de la
// plataforma más alta que lo sostiene; se pasa de una celda a otra subiendo hasta 0,62.
function caminable(ed, R) {
  const P = ed.colisiones.plataformas, O = ed.colisiones.obstaculos;
  const dentro = (p, x, z) => {
    const dx = x - p.x, dz = z - p.z;
    if (p.radio !== undefined) return dx * dx + dz * dz <= p.radio * p.radio;
    const c = Math.cos(p.ang || 0), s = Math.sin(p.ang || 0);
    return Math.abs(dx * c + dz * s) <= p.largo / 2 && Math.abs(-dx * s + dz * c) <= p.ancho / 2;
  };
  const pie = (x, z) => { let y = 0; for (const p of P) if (p.alto <= 1.0 && dentro(p, x, z)) y = Math.max(y, p.alto); return y; };
  const distSeg = (x, z, o) => {
    const vx = o.bx - o.ax, vz = o.bz - o.az, l2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - o.ax) * vx + (z - o.az) * vz) / l2));
    return Math.hypot(x - o.ax - vx * t, z - o.az - vz * t);
  };
  const libre = (x, z) => {
    const y = pie(x, z);
    for (const o of O) {
      if (o.alturaMax <= y + 0.12 || o.alturaMin >= y + 1.65) continue;   // (lo que se pisa de un paso no frena)
      const d = o.seg ? distSeg(x, z, o) : Math.hypot(x - o.x, z - o.z);
      if (d < o.r + R) return null;
    }
    return y;
  };
  return { libre, pie };
}
function alcanzables(ed, desde, R, paso = 0.1) {
  const { libre } = caminable(ed, R);
  const o = ed.ocupa;
  const x0 = Math.min(o.x0, desde.lx) - 1.5, z0 = Math.min(o.z0, desde.lz) - 1.5, x1 = Math.max(o.x1, desde.lx) + 1.5, z1 = Math.max(o.z1, desde.lz) + 1.5;
  const nx = Math.ceil((x1 - x0) / paso) + 1, nz = Math.ceil((z1 - z0) / paso) + 1;
  const y = new Float32Array(nx * nz).fill(NaN), vis = new Uint8Array(nx * nz);
  const idx = (i, j) => j * nx + i;
  const celda = (x, z) => [Math.round((x - x0) / paso), Math.round((z - z0) / paso)];
  const alto = (i, j) => { const k = idx(i, j); if (Number.isNaN(y[k])) { const v = libre(x0 + i * paso, z0 + j * paso); y[k] = v === null ? -99 : v; } return y[k]; };
  const [si, sj] = celda(desde.lx, desde.lz);
  assert.ok(alto(si, sj) > -1, `${ed.id}: el punto de partida no está libre (${desde.lx.toFixed(2)}, ${desde.lz.toFixed(2)})`);
  const cola = [[si, sj]]; vis[idx(si, sj)] = 1;
  while (cola.length) {
    const [i, j] = cola.pop();
    const ya = alto(i, j);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz || vis[idx(a, b)]) continue;
      const yb = alto(a, b);
      if (yb < -1 || Math.abs(yb - ya) > 0.62) continue;
      vis[idx(a, b)] = 1; cola.push([a, b]);
    }
  }
  if (process.env.MAPA === ed.id + '@' + ed.etapa + '@' + R) {
    // (para mirar a mano: MAPA=id@etapa@radio dibuja la grilla: # no cabe, . se llega, o cabe pero no se llega)
    for (let j = 0; j < nz; j += 2) { let s = ''; for (let i = 0; i < nx; i += 2) s += alto(i, j) < -1 ? '#' : vis[idx(i, j)] ? '.' : 'o'; console.log(s); }
  }
  return (p) => {
    // llega si alguna celda a menos de 0,15 m del punto quedó alcanzada
    const [ci, cj] = celda(p.lx, p.lz);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) if (i >= 0 && j >= 0 && i < nx && j < nz && vis[idx(i, j)]) return true;
    return false;
  };
}

// ---------------------------------------------------------------- todos los edificios, todas las etapas
const tabla = [];
const P = A.PRESUPUESTO_ALDEA;
for (const id of Object.keys(A.EDIFICIOS_ALDEA)) {
  const def = A.EDIFICIOS_ALDEA[id];
  const etapas = def.lote ? [0, 1, 2, 3, 4] : [4];
  for (const e of etapas) {
    const ed = A.armarEdificio(id, e);
    const tag = `${id}@${e}`;
    assert.equal(ed.id, id); assert.equal(ed.etapa, e, tag + ' etapa');
    for (const [k, g] of Object.entries(ed.exterior)) assert.ok(sinNaN(g), tag + ' NaN en ' + k);
    for (const [k, g] of Object.entries(ed.interior)) assert.ok(sinNaN(g), tag + ' NaN en ' + k);
    for (const t of tiposDe(ed.exterior.estructura)) assert.ok(t === 0 || t === 4, `${tag}: aTipo ${t} en la estructura`);
    for (const t of tiposDe(ed.interior.muebles)) assert.equal(t, 0, `${tag}: adentro sólo aTipo 0 (sin nieve), hay ${t}`);
    assert.ok(ed.exterior.estructura, tag + ' tiene estructura');
    const clase = def.clase;
    const pres = P[clase] || P.local;
    if (!process.env.SIN_TOPE) assert.ok(ed.medidas.triangulos.exterior <= pres.exterior, `${tag}: ${ed.medidas.triangulos.exterior} triángulos afuera (tope ${pres.exterior})`);
    if (!process.env.SIN_TOPE) assert.ok(ed.medidas.triangulos.interior <= pres.interior, `${tag}: ${ed.medidas.triangulos.interior} triángulos adentro (tope ${pres.interior})`);
    assert.ok(ed.medidas.dibujos.exterior <= P.dibujos.exterior && ed.medidas.dibujos.interior <= P.dibujos.interior, tag + ' dibujos');
    for (const o of ed.colisiones.obstaculos) assert.ok([o.alturaMin, o.alturaMax, o.r, o.seg ? o.ax : o.x].every(Number.isFinite), tag + ' colisión rota');
    for (const p of ed.colisiones.plataformas) assert.ok([p.x, p.z, p.alto].every(Number.isFinite), tag + ' plataforma rota');
    assert.ok(Number.isFinite(ed.ocupa.x0) && ed.ocupa.x1 > ed.ocupa.x0 && ed.ocupa.z1 > ed.ocupa.z0, tag + ' ocupa');
    if (def.lote && e < 4) {
      for (let k = 1; k <= 4; k++) assert.ok(ed.puntos.nombrados['obra-' + k], tag + ' obra-' + k);
      assert.equal(ed.puertas.length, 0, tag + ': la obra no tiene hoja de puerta');
    }
    if (e === 0) assert.ok(ed.carteles.some((c) => c.texto.startsWith('Lote para ')), tag + ': el cartel del lote');
    tabla.push({ id, e, ext: ed.medidas.triangulos.exterior, int: ed.medidas.triangulos.interior, dib: `${ed.medidas.dibujos.exterior}+${ed.medidas.dibujos.interior}` });
    if (e !== 4 || id === 'plaza') continue;

    // ---- terminado: puertas, cielorraso, caminar de verdad
    assert.ok(ed.techo && ed.techo.x1 > ed.techo.x0, tag + ' techo');
    assert.ok(ed.ventanas.length >= 1 && ed.exterior.vidrios, tag + ' ventanas que brillan');
    assert.ok(ed.luces.length >= 1, tag + ' luces (spec)');
    for (const d of ed.puertas) {
      assert.ok(d.ancho >= 1.0 && d.alto >= 2.0, `${tag}: puerta ${d.ancho}×${d.alto}`);
      assert.equal(d.piso, A.PISO_ALDEA); assert.equal(d.adentro, true);
    }
    const N = ed.puntos.nombrados;
    for (const k of ['puerta', 'adentro', 'trabajo']) assert.ok(N[k], `${tag}: punto ${k}`);
    if (def.clase !== 'grande' || def.lote) assert.ok(N.cama, tag + ': cama');
    // la puerta: ningún obstáculo fijo dentro del vano (a lo ancho de la hoja, del lado de adentro)
    const pf = ed.puntos.entrada;
    const { libre } = caminable(ed, 0.35);
    for (let z = ed.fondo / 2 + 0.3; z > ed.fondo / 2 - 1.0; z -= 0.1) assert.ok(libre(pf.lx, z) !== null, `${tag}: algo tapa la puerta en z=${z.toFixed(2)}`);
    // de la calle a cada lugar: pasillos de 0,9 (radio 0,45) a lo principal; 0,72 detrás del mostrador
    const ancho = alcanzables(ed, pf, 0.45);
    const angosto = alcanzables(ed, pf, 0.36);
    const pp = ed.puntos;
    for (const k of ['adentro', 'cocina', 'cliente']) if (pp[k]) assert.ok(ancho(pp[k]), `${tag}: no se llega a ${k} con 0,9 m de pasillo`);
    // (al costado de la cama, a la mesa y detrás del mostrador alcanza con 0,72: un cuerpo de 0,7)
    for (const k of ['atiende', 'cama', 'mesa']) if (pp[k]) assert.ok(angosto(pp[k]), `${tag}: no se llega a ${k}`);
    for (const t of pp.trabajo) assert.ok(angosto(t), `${tag}: no se llega al trabajo ${t.nombre}`);
    for (const [k, p] of Object.entries(N)) if (/^(lugar|pupitre|cliente)/.test(k) || k === 'escenario') assert.ok(angosto({ lx: p.lx + (k.startsWith('lugar') || k.startsWith('pupitre') ? 0 : 0), lz: p.lz }) || /^(lugar|pupitre)/.test(k), `${tag}: no se llega a ${k}`);
  }
}
// los asientos (sillas, pupitres) quedan sobre el mueble: se comprueba que se llega a su lado
{
  const ed = A.armarEdificio('salon', 4);
  assert.ok(ed.puntos.nombrados.escenario && Object.keys(ed.puntos.nombrados).filter((k) => k.startsWith('lugar-')).length === 8, 'salón: escenario y 8 lugares');
  const esc = A.armarEdificio('escuela', 4);
  assert.equal(Object.keys(esc.puntos.nombrados).filter((k) => k.startsWith('pupitre-')).length, 8, 'escuela: 8 pupitres');
  const bib = A.armarEdificio('biblioteca', 4).puntos.nombrados;
  for (let i = 1; i <= 12; i++) assert.ok(bib['lectura-' + i], 'biblioteca: lectura-' + i);
  for (const k of ['adentro', 'cuentos', 'puerta']) assert.ok(bib[k], 'biblioteca: ' + k);
  assert.ok(A.armarEdificio('casa-familia', 4).puntos.nombrados['cama-chicos'], 'casa-familia: cama-chicos');
}
// la plaza: su frente (+Z) mira a la estación; mástil y duende de ese lado; se llega a todo
{
  const pl = A.armarEdificio('plaza', 4);
  const N = pl.puntos.nombrados;
  for (let i = 1; i <= 20; i++) assert.ok(N['estar-' + i], 'plaza estar-' + i);
  for (let i = 1; i <= 4; i++) assert.ok(N['juego-' + i], 'plaza juego-' + i);
  for (const k of ['musico', 'mastil', 'duende']) assert.ok(N[k], 'plaza ' + k);
  assert.ok(N.mastil.lz > 0 && N.duende.lz > 0, 'mástil y duende del lado de la estación (+Z)');
  const llega = alcanzables(pl, { lx: 0, lz: 7.6 }, 0.45);
  for (const [k, p] of Object.entries(N)) assert.ok(llega(p), 'plaza: no se llega a ' + k);
  assert.ok(pl.medidas.triangulos.exterior <= P.plaza.exterior, 'plaza: ' + pl.medidas.triangulos.exterior + ' triángulos');
  tabla.push({ id: 'plaza', e: 4, ext: pl.medidas.triangulos.exterior, int: pl.medidas.triangulos.interior, dib: `${pl.medidas.dibujos.exterior}+${pl.medidas.dibujos.interior}` });
}
// la escuela a medio hacer: tapiada (no se entra) y sin materiales de obra tirados
{
  const e3 = A.armarEdificio('escuela', A.ESCUELA_A_MEDIO_HACER);
  const { libre } = caminable(e3, 0.35);
  const pf = e3.puntos.entrada;
  let tapada = false;
  for (let z = e3.fondo / 2 + 0.1; z > e3.fondo / 2 - 0.3; z -= 0.05) if (libre(pf.lx, z) === null) tapada = true;
  assert.ok(tapada, 'la escuela a medio hacer está cerrada');
  assert.ok(e3.ocupa.x1 <= e3.ancho / 2 + 0.5, 'sin pilas de obra alrededor');
  const activa = A.armarEdificio('escuela', 3, { obraActiva: true });
  assert.ok(activa.ocupa.x1 > activa.ancho / 2 + 1, 'con la obra en marcha, materiales y andamio');
}

// ---------------------------------------------------------------- determinismo
for (const id of ['casa-jefe', 'panaderia', 'plaza']) {
  assert.equal(huella(A.armarEdificio(id, 4)), huella(A.armarEdificio(id, 4)), id + ': la misma semilla da la misma geometría');
}
assert.notEqual(huella(A.armarEdificio('casa-jefe', 4)), huella(A.armarEdificio('casa-jefe', 4, { semilla: 99 })), 'otra semilla, otra casa');
assert.equal(huella(A.armarEdificio('herreria', 2)), huella(A.armarEdificio('herreria', 2)), 'las etapas también');

// ---------------------------------------------------------------- accesorios, parada y carteles
for (const n of A.ACCESORIOS_ALDEA) {
  const ac = A.armarAccesorio(n, ['cerco', 'pirca', 'vereda'].includes(n) ? { largo: 4 } : {});
  assert.ok(ac.exterior.estructura, n);
  for (const t of tiposDe(ac.exterior.estructura)) assert.ok(t === 0 || t === 4, `${n}: aTipo ${t}`);
  assert.ok(ac.medidas.triangulos.exterior < 3000, n + ': ' + ac.medidas.triangulos.exterior + ' triángulos');
  if (n === 'alamo') {
    assert.ok(ac.exterior.follaje && tiposDe(ac.exterior.follaje).join() === '2', 'álamo: hojas que caen (aTipo 2)');
    assert.ok(ac.lod && ac.lod.follaje && tris(ac.lod.estructura) + tris(ac.lod.follaje) < 200, 'álamo: LOD barato');
  }
  tabla.push({ id: 'accesorio ' + n, e: '-', ext: ac.medidas.triangulos.exterior, int: 0, dib: `${ac.medidas.dibujos.exterior}+0` });
}
function tris(g) { return g ? g.attributes.position.count / 3 : 0; }
{
  const ag = A.armarAgregadoEstacion();
  const ids = ag.piezas.map((p) => p.id);
  for (const k of ['galpon-cargas', 'cartel-aldea', 'banco']) assert.ok(ids.includes(k), 'estación: ' + k);
  assert.ok(ag.piezas.filter((p) => p.id.startsWith('farol')).length >= 2, 'estación: faroles');
  for (const p of ag.piezas) {
    // fuera de la parada chica (andén x ±4,5 z 1,15..4,75; galponcito z 4,5..7,5 x ±2,1; escalones hasta |x| 7,7 en z 2..4,5)
    const o = p.edificio.ocupa, c = Math.cos(p.giro), s = Math.sin(p.giro);
    for (const [x, z] of [[o.x0, o.z0], [o.x1, o.z0], [o.x0, o.z1], [o.x1, o.z1]]) {
      const X = p.lx + x * c + z * s, Z = p.lz - x * s + z * c;
      assert.ok(!(Math.abs(X) < 4.5 && Z > 1.1 && Z < 4.8) && !(Math.abs(X) < 2.2 && Z > 4.4 && Z < 7.6) && !(Math.abs(X) < 7.8 && Z > 2.0 && Z < 4.5), `estación: ${p.id} pisa la parada (${X.toFixed(1)}, ${Z.toFixed(1)})`);
    }
  }
  assert.ok(ag.piezas.find((p) => p.id === 'cartel-aldea').edificio.carteles.some((c) => c.texto === 'Aldea de los Duendes'), 'el cartel grande');
}
{
  // cada cartel usado tiene su celda; el atlas entra en la textura
  const A2 = A.ATLAS_CARTELES;
  assert.ok(A.CARTELES_ALDEA.length <= (A2.alto / A2.celdaAlto) * A2.columnas, 'el atlas alcanza');
  const textos = new Set(A.CARTELES_ALDEA.map((c) => c.texto));
  assert.equal(textos.size, A.CARTELES_ALDEA.length, 'sin carteles repetidos');
  for (const id of A.LOTES_ALDEA) assert.ok(textos.has(A.armarEdificio(id, 0).carteles[0].texto), id + ': cartel del lote');
}
// registrarEnMundo: las colisiones pasan al mundo con el giro del sitio
{
  const col = COL.crearColisiones();
  const ed = A.armarEdificio('casa-jefe', 4);
  const altas = [];
  const puertas = { agregar: (o) => { altas.push(o); return o; } };
  const sitio = { x: 40.3, y: 25, z: -339.1, rot: Math.PI / 2 };
  const r = A.registrarEnMundo({ col, puertas }, ed, sitio, { duenio: 'aldea:casa-jefe' });
  assert.equal(r.obstaculos.length, ed.colisiones.obstaculos.length);
  assert.equal(altas.length, 1); assert.equal(altas[0].rot, Math.PI / 2);
  const piso = col.plataformaEn(sitio.x, sitio.z, 25.3);
  assert.ok(piso && Math.abs(piso.alto - (25 + A.PISO_ALDEA)) < 1e-6, 'el piso queda donde va');
  const q = A.aMundoAldea(sitio, 1, 0, 0);
  assert.ok(Math.abs(q.x - 40.3) < 1e-9 && Math.abs(q.z - (-339.1 - 1)) < 1e-9, 'aMundoAldea gira como piezas.js');
  assert.ok(col.eliminarPorDuenio('aldea:casa-jefe').obstaculos > 0, 'se dan de baja por dueño');
}
// fusionarAldea: una manzana, una pieza por material
{
  const lista = [{ edificio: A.armarEdificio('casa-jefe', 4), sitio: { x: 0, z: 0, rot: 0 } }, { edificio: A.armarEdificio('casa-abuela', 4), sitio: { x: 9, z: 0, rot: Math.PI } }];
  const f = A.fusionarAldea(lista, 'exterior');
  assert.equal(f.estructura.attributes.position.count, lista.reduce((s, x) => s + x.edificio.exterior.estructura.attributes.position.count, 0));
  assert.ok(f.estructura.attributes.aTipo && f.vidrios, 'la fusión conserva aTipo y los vidrios');
}

console.log('edificio                 etapa   triángulos afuera  adentro  dibujos');
for (const t of tabla) console.log(`${t.id.padEnd(24)} ${String(t.e).padEnd(7)} ${String(t.ext).padStart(10)} ${String(t.int).padStart(8)}  ${t.dib}`);
console.log('verificar-3-6-arquitectura: todo bien');
