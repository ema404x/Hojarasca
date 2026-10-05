// 3.7.0: la calle de la loma en src/aldea-arquitectura.js (los nueve locales nuevos, sin ubicarlos).
//  · el contrato con el núcleo (ids y tamaños) y que lo de la 3.6 no cambió
//  · cada local en todas sus etapas (lote, cimientos, estructura, paredes, terminado) sin errores, con la
//    estructura y los muebles en aTipo 0 o 4 y el detalle de superficie (aSuperficie) en todo
//  · presupuestos: ≤ 7k triángulos afuera y 6k adentro, ≤ 4 + 4 dibujos (también fundidos)
//  · se camina de verdad, en varios niveles (la escalera y la torreta del observatorio, la escalinata):
//    desde la calle se entra y se llega a cada punto nombrado; las puertas son de 1,0 × 2,05 y nada las tapa
//  · las piezas animables (cúpula, telescopio, torno, pedal) y el humo del horno de la cerámica
//  · el zócalo alto del refugio, el hueco del techo y del cielorraso de la torreta
//  · misma semilla, misma geometría
// Corre el módulo en una VM con el three local (como verificar-3-6-arquitectura).
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
  assert.ok(!t.includes('\r'), 'LF');
  assert.ok(/^\/\/ 3\.7\.0 \(la calle de la loma\)/m.test(t), 'el encabezado documenta lo de la 3.7.0');
  assert.ok(!/ShapeGeometry|OctahedronGeometry|THREE\.Shape\b|Vector4|Frustum/.test(t), 'nada que el three local no trae');
  assert.ok(!/new THREE\.(PointLight|SpotLight)/.test(t), 'no crea luces');
  assert.ok(!/capilla|altar|campanario|\bmisa\b|iglesia|parroq/i.test(t), 'nada religioso');
  for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) assert.ok(!/ñ/i.test(m[1]), 'exportado sin ñ: ' + m[1]);
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
code += '\n;globalThis.__A = __mod_aldea_arquitectura;';
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Error, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'aldea-arquitectura-vm.js' });
const A = ctx.__A;

// ---------------------------------------------------------------- el contrato
const CONTRATO = {
  veterinaria: [8, 6], 'estudio-fotos': [6, 6], 'refugio-andinista': [7, 6], herboristeria: [6, 6], 'taller-arte': [7, 6],
  ceramica: [7, 6], varadero: [8, 6], observatorio: [6, 6], costureria: [6, 5],
};
const IDS = Object.keys(CONTRATO);
assert.deepEqual([...A.LOTES_LOMA], IDS, 'LOTES_LOMA: los nueve, en el orden del plan');
for (const [id, [w, d]] of Object.entries(CONTRATO)) {
  const e = A.EDIFICIOS_ALDEA[id];
  assert.ok(e && Object.hasOwn(A.EDIFICIOS_ALDEA, id), 'falta ' + id);
  assert.equal(e.ancho, w, id + ' ancho'); assert.equal(e.fondo, d, id + ' fondo');
  assert.ok(e.loma === true && e.lote === true && e.clase === 'local' && typeof e.nombre === 'string', id + ': local de la loma, con lote');
}
assert.equal(Object.keys(A.EDIFICIOS_ALDEA).filter((id) => A.EDIFICIOS_ALDEA[id].loma).length, 9, 'sólo nueve de la loma');
assert.deepEqual([...A.LOTES_ALDEA], ['panaderia', 'herreria', 'carpinteria', 'pescaderia', 'escuela', 'puesto-sanitario', 'estafeta', 'hilanderia', 'sala-miel', 'seccional', 'salon'], 'los lotes de la 3.6 no cambian');
assert.ok(A.EDIFICIOS_ALDEA.veterinaria.anexo, 'el corral de la veterinaria (anexo)');

// ---------------------------------------------------------------- utilidades
const huella = (ed) => {
  const h = createHash('sha1');
  for (const capa of ['exterior', 'interior']) for (const [k, g] of Object.entries(ed[capa])) {
    if (!g) continue;
    h.update(k);
    for (const a of ['position', 'color', 'aTipo', 'aSuperficie', 'uv']) if (g.attributes[a]) h.update(Buffer.from(new Float32Array(g.attributes[a].array).buffer));
  }
  for (const a of ed.animables) h.update(Buffer.from(new Float32Array(a.geometria.attributes.position.array).buffer));
  h.update(JSON.stringify(ed.colisiones)); h.update(JSON.stringify(ed.puntos.nombrados));
  return h.digest('hex');
};
const tiposDe = (g) => (g && g.attributes.aTipo ? [...new Set(g.attributes.aTipo.array)].sort() : []);
const sinNaN = (g) => !g || [...g.attributes.position.array].every(Number.isFinite);
const tris = (g) => (g ? g.attributes.position.count / 3 : 0);
const validosSup = new Set(Object.values(A.SUPERFICIES_ALDEA).flatMap((v) => [v, v + A.SUPERFICIES_ALDEA.adentro]));

// El mundo de un edificio para caminar, en varios niveles, con las reglas de colisiones.js: los pies van
// a la plataforma más alta que se alcanza de un paso (0,62), los obstáculos frenan entre los pies y la
// cabeza (1,65), las plataformas altas frenan de costado y las losas (no `sinTecho`) frenan la cabeza.
function mundoDe(ed, suelo = () => 0) {
  const P = ed.colisiones.plataformas, O = ed.colisiones.obstaculos;
  const dentro = (p, x, z, R = 0) => {
    const dx = x - p.x, dz = z - p.z;
    if (p.radio !== undefined) return Math.hypot(dx, dz) <= p.radio + R;
    const c = Math.cos(p.ang || 0), s = Math.sin(p.ang || 0);
    return Math.abs(dx * c + dz * s) <= p.largo / 2 + R && Math.abs(-dx * s + dz * c) <= p.ancho / 2 + R;
  };
  const distSeg = (x, z, o) => {
    const vx = o.bx - o.ax, vz = o.bz - o.az, l2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - o.ax) * vx + (z - o.az) * vz) / l2));
    return Math.hypot(x - o.ax - vx * t, z - o.az - vz * t);
  };
  // el piso al que se llega desde una altura de pies `y` (o −∞ si nada lo sostiene)
  const piso = (x, z, y) => {
    let best = -Infinity;
    const s = suelo(x, z);
    if (s <= y + 0.62) best = s;
    for (const p of P) if (p.alto <= y + 0.62 && p.alto > best && dentro(p, x, z)) best = p.alto;
    return best;
  };
  const libre = (x, z, y, R) => {
    for (const o of O) {
      if (o.alturaMax <= y + 0.12 || o.alturaMin >= y + 1.65) continue;
      if ((o.seg ? distSeg(x, z, o) : Math.hypot(x - o.x, z - o.z)) < o.r + R) return false;
    }
    for (const p of P) {
      const ab = p.alto - Math.max(0.02, p.espesor ?? 0.12);
      if (!p.sinLaterales && p.alto > y + 0.64 && ab < y + 1.64 && p.alto > y + 0.03 && dentro(p, x, z, R)) return false;
      if (!p.sinTecho && ab > y + 0.05 && ab < y + 1.64 && dentro(p, x, z, R)) return false;
    }
    return true;
  };
  return { piso, libre };
}
function alcanzables(ed, desde, R, o = {}) {
  const M = mundoDe(ed, o.suelo), paso = 0.1, oc = ed.ocupa;
  const x0 = Math.min(oc.x0, desde.lx) - 1.5, z0 = Math.min(oc.z0, desde.lz) - 1.5, x1 = Math.max(oc.x1, desde.lx) + 1.5, z1 = Math.max(oc.z1, desde.lz) + 1.5;
  const nx = Math.ceil((x1 - x0) / paso) + 1, nz = Math.ceil((z1 - z0) / paso) + 1;
  const visto = new Map();   // "i,j" → alturas alcanzadas
  const marca = (i, j, y) => { const k = i + ',' + j; let s = visto.get(k); if (!s) visto.set(k, s = []); if (s.some((v) => Math.abs(v - y) < 0.03)) return false; s.push(y); return true; };
  const si = Math.round((desde.lx - x0) / paso), sj = Math.round((desde.lz - z0) / paso);
  const y0 = M.piso(x0 + si * paso, z0 + sj * paso, (desde.ly ?? 0) + 0.05);
  assert.ok(Number.isFinite(y0) && M.libre(x0 + si * paso, z0 + sj * paso, y0, R), `${ed.id}@${ed.etapa}: el punto de partida no está libre (${desde.lx.toFixed(2)}, ${desde.lz.toFixed(2)})`);
  const cola = [[si, sj, y0]];
  marca(si, sj, y0);
  while (cola.length) {
    const [i, j, y] = cola.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const x = x0 + a * paso, z = z0 + b * paso, yb = M.piso(x, z, y);
      if (!Number.isFinite(yb) || !M.libre(x, z, yb, R)) continue;
      if (marca(a, b, yb)) cola.push([a, b, yb]);
    }
  }
  if (process.env.MAPA === ed.id + '@' + R) {
    // (para mirar a mano: MAPA=id@radio dibuja la planta a la altura del piso: # no cabe, . se llega, o cabe y no se llega)
    const yM = Number(process.env.MAPA_Y ?? A.PISO_ALDEA);
    for (let j = 0; j < nz; j += 2) {
      let s = '';
      for (let i = 0; i < nx; i += 2) { const x = x0 + i * paso, z = z0 + j * paso, y = M.piso(x, z, yM); const v = visto.get(i + ',' + j); s += !Number.isFinite(y) || !M.libre(x, z, y, R) ? '#' : v && v.some((q) => Math.abs(q - y) < 0.05) ? '.' : 'o'; }
      console.log((z0 + j * paso).toFixed(1).padStart(5), s);
    }
    console.log('x0', x0.toFixed(2));
  }
  return (p, tolY = 0.3) => {
    const ci = Math.round((p.lx - x0) / paso), cj = Math.round((p.lz - z0) / paso);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const s = visto.get(i + ',' + j);
      if (s && s.some((y) => Math.abs(y - (p.ly ?? 0)) <= tolY || (p.ly === undefined))) return true;
    }
    return false;
  };
}
// un asiento queda sobre el mueble: alcanza con llegar a uno de sus cuatro lados
function alLado(llega, p) {
  for (const d of [0.6, 0.95]) for (let k = 0; k < 4; k++) {
    const a = (p.mira ?? 0) + k * Math.PI / 2;
    if (llega({ lx: p.lx + Math.sin(a) * d, lz: p.lz + Math.cos(a) * d, ly: p.ly - 0.5 }, 0.45)) return true;
  }
  return false;
}

// ---------------------------------------------------------------- todos, en todas sus etapas
const P = A.PRESUPUESTO_ALDEA;
const tabla = [];
const OFICIO = {
  veterinaria: ['camilla-animal', 'corral'], 'estudio-fotos': ['camara', 'cuarto-oscuro'], 'refugio-andinista': ['mapa', 'mapa-cumbres'], herboristeria: ['mortero'],
  'taller-arte': ['atril'], ceramica: ['torno', 'horno'], varadero: ['bote'], observatorio: ['telescopio', 'cartas', 'cartas-cielo', 'escalera', 'escalera-arriba'],
  costureria: ['maquina-coser', 'espejo', 'mesa-corte'],
};
const CARTEL = { veterinaria: 'Veterinaria', 'estudio-fotos': 'Foto Estudio', 'refugio-andinista': 'Refugio Andino', herboristeria: 'Herboristería', 'taller-arte': 'Taller de Arte',
  ceramica: 'Cerámica', varadero: 'Varadero', observatorio: 'Observatorio', costureria: 'Costurería' };
for (const id of IDS.filter((x) => !process.env.SOLO || process.env.SOLO.split(',').includes(x))) {
  const def = A.EDIFICIOS_ALDEA[id];
  for (const e of [0, 1, 2, 3, 4]) {
    const ed = A.armarEdificio(id, e), tag = `${id}@${e}`;
    assert.equal(ed.id, id); assert.equal(ed.etapa, e, tag + ' etapa');
    for (const capa of ['exterior', 'interior']) for (const [k, g] of Object.entries(ed[capa])) assert.ok(sinNaN(g), `${tag}: NaN en ${k}`);
    for (const t of tiposDe(ed.exterior.estructura)) assert.ok(t === 0 || t === 4, `${tag}: aTipo ${t} en la estructura`);
    for (const t of tiposDe(ed.interior.muebles)) assert.equal(t, 0, `${tag}: adentro sólo aTipo 0, hay ${t}`);
    for (const [capa, k] of [['exterior', 'estructura'], ['interior', 'muebles']]) {
      const g = ed[capa][k];
      if (!g) continue;
      assert.ok(g.attributes.aSuperficie && g.attributes.aLocal && g.attributes.aSuperficie.count === g.attributes.position.count, `${tag}: ${k} con aSuperficie y aLocal`);
      for (const v of new Set(g.attributes.aSuperficie.array)) assert.ok(validosSup.has(v), `${tag}: aSuperficie ${v}`);
    }
    if (ed.exterior.follaje) assert.equal(ed.exterior.follaje.attributes.aCarta?.count, ed.exterior.follaje.attributes.position.count, tag + ': aCarta en el follaje');
    assert.ok(ed.medidas.triangulos.exterior <= P.local.exterior, `${tag}: ${ed.medidas.triangulos.exterior} triángulos afuera (tope ${P.local.exterior})`);
    assert.ok(ed.medidas.triangulos.interior <= P.local.interior, `${tag}: ${ed.medidas.triangulos.interior} triángulos adentro (tope ${P.local.interior})`);
    assert.ok(ed.medidas.dibujos.exterior <= P.dibujos.exterior && ed.medidas.dibujos.interior <= P.dibujos.interior, `${tag}: dibujos ${ed.medidas.dibujos.exterior}+${ed.medidas.dibujos.interior}`);
    for (const o of ed.colisiones.obstaculos) assert.ok([o.alturaMin, o.alturaMax, o.r, o.seg ? o.ax : o.x].every(Number.isFinite), tag + ' colisión rota');
    for (const p of ed.colisiones.plataformas) assert.ok([p.x, p.z, p.alto].every(Number.isFinite), tag + ' plataforma rota');
    assert.ok(ed.ocupa.x1 - ed.ocupa.x0 >= def.ancho && ed.ocupa.z1 - ed.ocupa.z0 >= def.fondo, tag + ' ocupa');
    if (def.anexo) assert.ok(ed.ocupa.x1 >= def.anexo.x1 - 1e-6 && ed.ocupa.z0 <= def.anexo.z0 + 1e-6, tag + ': el corral ya ocupa su lugar');
    if (e < 4) {
      for (let k = 1; k <= 4; k++) assert.ok(ed.puntos.nombrados['obra-' + k], tag + ' obra-' + k);
      assert.equal(ed.puertas.length, 0, tag + ': la obra no tiene hoja de puerta');
      assert.ok(ed.animables.length === 0 || e === 4, tag + ': nada se mueve en la obra');
    }
    if (e === 0) assert.ok(ed.carteles.some((c) => c.texto.startsWith('Lote para ')), tag + ': el cartel del lote');
    tabla.push({ id, e, ext: ed.medidas.triangulos.exterior, int: ed.medidas.triangulos.interior, dib: `${ed.medidas.dibujos.exterior}+${ed.medidas.dibujos.interior}`, anim: ed.animables.length });
    if (e !== 4) continue;

    // ---- terminado
    assert.ok(ed.techo && ed.techo.x1 > ed.techo.x0 && ed.techo.cubiertas?.length >= 1, tag + ' techo (y su cubierta para la lluvia)');
    assert.ok(ed.ventanas.length >= 3 && ed.exterior.vidrios, tag + ' ventanas que brillan');
    assert.ok(ed.ventanas.some((v) => v.cuarto === 'vivienda'), tag + ': la vivienda tiene su ventana');
    assert.ok(ed.luces.length >= 2 && ed.luces.some((l) => l.cuarto === 'vivienda'), tag + ' luces (spec), también en la vivienda');
    assert.ok(ed.extra.acometida, tag + ': la acometida del cable');
    assert.ok(ed.chimeneas.length >= 1, tag + ': la chimenea de la cocina a leña');
    assert.ok(ed.carteles.some((c) => c.texto === CARTEL[id]), tag + ': su cartel');
    for (const d of ed.puertas) {
      assert.ok(d.ancho >= 1.0 && d.alto >= 2.03, `${tag}: puerta ${d.ancho}×${d.alto}`);
      assert.equal(d.piso, A.PISO_ALDEA); assert.equal(d.adentro, true, tag + ': abre para adentro');
    }
    assert.ok(ed.puertas.length >= 1 || id === 'varadero', tag + ': su puerta (el varadero tiene el portón abierto)');
    const N = ed.puntos.nombrados, pp = ed.puntos;
    for (const k of ['puerta', 'adentro', 'trabajo', 'cama']) assert.ok(N[k], `${tag}: punto ${k}`);
    assert.ok(pp.mesa && pp.cocina && pp.cama, tag + ': la vivienda con cama, mesa y cocina a leña');
    assert.ok(Object.keys(N).some((k) => k.startsWith('asiento-')), tag + ': algún asiento');
    for (const k of OFICIO[id]) assert.ok(N[k], `${tag}: falta el punto ${k}`);
    assert.equal(Object.keys(N).filter((k) => k.startsWith('asiento-')).length, pp.asientos.length, tag + ': cada asiento con su nombre');
    // la puerta: ningún obstáculo fijo en el vano
    const pf = pp.entrada, M = mundoDe(ed);
    for (let z = ed.fondo / 2 + 0.3; z > ed.fondo / 2 - 1.0; z -= 0.1) { const y = M.piso(pf.lx, z, 0.4); assert.ok(M.libre(pf.lx, z, y, 0.35), `${tag}: algo tapa la puerta en z=${z.toFixed(2)}`); }
    // caminar: pasillos de 0,9 a lo principal, de 0,72 a cada lugar
    const ancho = alcanzables(ed, { ...pf, ly: 0 }, 0.45), angosto = alcanzables(ed, { ...pf, ly: 0 }, 0.36);
    for (const k of ['adentro', 'cocina', 'cliente']) if (pp[k]) assert.ok(ancho(pp[k]), `${tag}: no se llega a ${k} con 0,9 m de pasillo`);
    for (const k of ['atiende', 'cama', 'mesa']) if (pp[k]) assert.ok(angosto(pp[k]), `${tag}: no se llega a ${k}`);
    for (const t of pp.trabajo) assert.ok(angosto(t), `${tag}: no se llega al trabajo ${t.nombre}`);
    for (const [k, p] of Object.entries(N)) {
      if (k.startsWith('obra-') || k === 'escalinata') continue;
      if (k.startsWith('asiento-')) assert.ok(alLado(angosto, p), `${tag}: no se llega al lado de ${k}`);
      else assert.ok(angosto(p), `${tag}: no se llega a ${k} (${p.lx}, ${p.ly}, ${p.lz})`);
    }
    tabla[tabla.length - 1].puntos = Object.keys(N).length;
  }
}

// ---------------------------------------------------------------- las piezas que se mueven y el humo
{
  const anim = (id, a) => { const ed = A.armarEdificio(id, 4); const x = ed.animables.find((p) => p.id === a); assert.ok(x && x.geometria.attributes.position.count > 0 && x.eje && x.pivote && x.movimiento, id + ': animable ' + a); return x; };
  const cup = anim('observatorio', 'cupula');
  assert.ok(cup.noche === true && cup.abierta < -1 && cup.capa === 'exterior' && cup.eje.join() === '1,0,0', 'la cúpula: se abre de noche, sobre su eje X');
  const tel = anim('observatorio', 'telescopio');
  assert.ok(tel.capa === 'interior' && tel.abierta < 0 && Number.isFinite(tel.reposo) && tel.pivote.ly > 3.5, 'el telescopio, en la torreta');
  const tor = anim('ceramica', 'torno');
  assert.ok(tor.movimiento === 'gira' && tor.vueltasPorSegundo > 0 && tor.eje.join() === '0,1,0' && tor.capa === 'interior', 'el torno gira');
  const ped = anim('costureria', 'pedal');
  assert.ok(ped.movimiento === 'mece' && ped.abierta > 0 && ped.capa === 'interior', 'el pedal de la máquina mece');
  anim('ceramica', 'puerta-horno');
  for (const a of [cup, tel, tor, ped]) for (const t of new Set(a.geometria.attributes.aTipo.array)) assert.ok(t === 0 || t === 4, a.id + ': aTipo ' + t);
  // (la geometría va con su pivote en el origen: girarla la mueve en su lugar)
  const bb = cup.geometria.boundingBox;
  assert.ok(Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x)) < 1.5 && bb.max.y < 1.4, 'la compuerta alrededor de su pivote');
  const cer = A.armarEdificio('ceramica', 4);
  assert.ok(cer.humo && cer.humo.ly > 1 && cer.puntos.nombrados.horno, 'la cerámica: el horno de barro humea');
}
// ---------------------------------------------------------------- lo propio de cada uno
{
  // el zócalo de piedra alto del refugio, cortado en la puerta
  const ref = A.armarEdificio('refugio-andinista', 4), g = ref.exterior.estructura, s = g.attributes.aSuperficie, p = g.attributes.position;
  let alto = 0;
  for (let i = 0; i < p.count; i++) if (s.getX(i) === A.SUPERFICIES_ALDEA.piedra && Math.abs(Math.abs(p.getX(i)) - 3.58) < 0.03) alto = Math.max(alto, p.getY(i));
  assert.ok(alto >= 1.0, 'el refugio: la piedra sube a ' + alto.toFixed(2) + ' m por los costados');
  const pf = ref.puntos.entrada;
  for (let i = 0; i < p.count; i++) if (s.getX(i) === A.SUPERFICIES_ALDEA.piedra && p.getY(i) > 0.5 && Math.abs(p.getZ(i) - 3.08) < 0.01) assert.ok(Math.abs(p.getX(i) - pf.lx) >= 0.49, 'el zócalo alto no cruza la puerta');
  // la torreta del observatorio: el techo y el cielorraso tienen su hueco; se sube por la escalera
  const ob = A.armarEdificio('observatorio', 4), t = ob.extra.torreta;
  assert.ok(t && t.piso > 2.9 && t.alto > 5, 'la torreta (extra.torreta)');
  const ge = ob.exterior.estructura, se = ge.attributes.aSuperficie, pe = ge.attributes.position;
  for (let i = 0; i < pe.count; i++) {
    const x = pe.getX(i), y = pe.getY(i), z = pe.getZ(i);
    if (se.getX(i) === A.SUPERFICIES_ALDEA.chapa && x > t.x0 + 0.05 && x < t.x1 - 0.05 && z > t.z0 + 0.05 && z < t.z1 - 0.05) assert.ok(y > t.alto - 0.1, `el techo no pasa por adentro de la torreta (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
    if (se.getX(i) === A.SUPERFICIES_ALDEA.piso + A.SUPERFICIES_ALDEA.adentro && Math.abs(y - (A.PISO_ALDEA + 2.6)) < 0.01) assert.ok(!(x > -0.4 && x < 0.7 && z > 1.78 && z < 2.6), 'el cielorraso deja la escotilla abierta');
  }
  const llega = alcanzables(ob, { ...ob.puntos.entrada, ly: 0 }, 0.36);
  assert.ok(llega(ob.puntos.nombrados.telescopio) && llega(ob.puntos.nombrados['escalera-arriba']), 'al telescopio se sube por la escalera');
  assert.ok(ob.puntos.nombrados.telescopio.ly > 2.9, 'el telescopio está arriba');
  // la veterinaria: el corral con su tranquera abierta, al costado
  const vet = A.armarEdificio('veterinaria', 4), co = vet.extra.corral;
  assert.ok(co && co.x0 >= vet.ancho / 2 && co.x1 - co.x0 >= 5.9 && co.z1 - co.z0 >= 5.9, 'el corral de 6 × 6 al costado');
  // el taller de arte: el ventanal grande, dicho para que el mundo lo ponga al norte
  const ta = A.armarEdificio('taller-arte', 4);
  assert.ok(ta.extra.ventanal?.cara === 'der' && ta.ventanas.some((v) => v.ancho >= 2.5 && v.alto >= 1.7), 'el ventanal del taller');
  // la escalinata: con desnivel se baja a la calle y desde la calle se entra
  for (const [id, des] of [['observatorio', A.EDIFICIOS_ALDEA.observatorio.desnivelSugerido], ['refugio-andinista', 1.0], ['costureria', 0.7]]) {
    const ed = A.armarEdificio(id, 4, { desnivel: des }), N = ed.puntos.nombrados, d = des;
    assert.ok(N.escalinata && Math.abs(N.escalinata.ly + d) < 1e-6, `${id}: la escalinata baja ${d} m`);
    const zM = ed.puntos.entrada.lz + 0.45;
    const llegaE = alcanzables(ed, { ...N.escalinata }, 0.36, { suelo: (x, z) => (z > zM ? -d : 0) });
    assert.ok(llegaE(N.puerta) && llegaE(N.adentro), `${id}: desde la calle se sube la escalinata y se entra`);
  }
  assert.ok(!A.armarEdificio('costureria', 4).puntos.nombrados.escalinata && !A.armarEdificio('observatorio', 4).puntos.nombrados.escalinata, 'sin desnivel, sin escalinata');
  assert.equal(A.armarEdificio('observatorio', 4).ocupa.z1, A.armarEdificio('observatorio', 4, { desnivel: 0 }).ocupa.z1, 'sin desnivel el lote no crece');
}
// ---------------------------------------------------------------- dibujos fundidos y carteles
{
  const lista = IDS.map((id, i) => ({ edificio: A.armarEdificio(id, 4), sitio: { x: (i % 3) * 14, z: Math.floor(i / 3) * 12, rot: i % 2 ? Math.PI : 0 } }));
  const ext = A.fusionarAldea(lista, 'exterior'), int = A.fusionarAldea(lista, 'interior');
  assert.ok(Object.keys(ext).length <= 4 && Object.keys(int).length <= 4, `fundidos: ${Object.keys(ext).length} + ${Object.keys(int).length} dibujos`);
  assert.equal(ext.estructura.attributes.position.count, lista.reduce((s, x) => s + x.edificio.exterior.estructura.attributes.position.count, 0));
  const AT = A.ATLAS_CARTELES;
  assert.ok(A.CARTELES_ALDEA.length <= Math.floor(AT.alto / AT.celdaAlto) * AT.columnas, 'el atlas alcanza para todos los carteles');
  const textos = new Set(A.CARTELES_ALDEA.map((c) => c.texto));
  assert.equal(textos.size, A.CARTELES_ALDEA.length, 'sin carteles repetidos');
  for (const id of IDS) assert.ok(textos.has(A.armarEdificio(id, 0).carteles[0].texto), id + ': cartel del lote');
  // las celdas de la 3.6 no se movieron (el atlas sólo creció para abajo)
  assert.equal(A.CARTELES_ALDEA[0].texto, 'Aldea de los Duendes');
  assert.equal(A.CARTELES_ALDEA.findIndex((c) => c.texto === 'Lote para el salón'), 27);
}
// ---------------------------------------------------------------- determinismo
for (const id of IDS) assert.equal(huella(A.armarEdificio(id, 4)), huella(A.armarEdificio(id, 4)), id + ': la misma semilla da la misma geometría');
assert.equal(huella(A.armarEdificio('observatorio', 3)), huella(A.armarEdificio('observatorio', 3)), 'las etapas también');
assert.notEqual(huella(A.armarEdificio('costureria', 4)), huella(A.armarEdificio('costureria', 4, { semilla: 7 })), 'otra semilla, otra casa');

console.log('edificio              etapa  afuera  adentro  dibujos  animables  puntos');
for (const t of tabla) console.log(`${t.id.padEnd(21)} ${String(t.e).padEnd(6)} ${String(t.ext).padStart(6)} ${String(t.int).padStart(8)}  ${t.dib.padEnd(7)}  ${String(t.anim).padStart(9)}  ${t.puntos ?? ''}`);
console.log('verificar-3-7-0-arquitectura: todo bien');
