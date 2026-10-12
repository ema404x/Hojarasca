// 3.8.8: la escalera de casas (cabaña de tablas y piedra, casa con galería, casona de dos cuartos), en Node.
// Lo que se ve (cómo quedan en el valle) lo mira el jugador; acá va lo que se puede comprobar sin 3D:
//   · están en el catálogo, en Refugios, en orden de tamaño (casilla < puesto < cabaña < casa < casona) y de costo;
//   · cada una arma sus cuatro etapas sin números rotos y con lo que dicen las reglas del molde (nombres para el teñido,
//     habitable, huella de la galería);
//   · la física entra por la puerta y no por las paredes, la cama y la mesa estorban y los tabiques dejan pasar por su vano;
//   · el inglés de nombre, texto y etapas está.
import assert from 'assert/strict';
import fs from 'fs';
import { PLANO, PLANOS } from '../src/construccion.js';
import { Constructor } from '../src/geometria.js';
import { crearColisiones } from '../src/colisiones.js';
import { zonaCasa } from '../src/estilo-casa.js';
import { EN } from '../src/idioma-en.js';

const IDS = ['cabana-piedra', 'casa-galeria', 'casona'];
const area = (p) => p.ancho * p.fondo;
const costo = (p) => p.etapas.reduce((s, e) => s + Object.values(e.pide).reduce((a, b) => a + b, 0), 0);

// ---------------------------------------------------------------- 1. el catálogo y la escalera
{
  for (const id of IDS) {
    assert.ok(PLANO[id], `${id} está en el catálogo`);
    assert.equal(PLANO[id].categoria, 'refugios', `${id} va en Refugios`);
    assert.equal(PLANO[id].habitable, true, `${id} es habitable (se duerme adentro)`);
    assert.equal(PLANO[id].etapas.length, 4, `${id} tiene cuatro etapas`);
    assert.equal(PLANOS.filter((p) => p.id === id).length, 1, `${id} no se repite`);
    assert.equal(PLANOS.filter((p) => p.id === id && (p.soloDesafio || p.soloRelax)).length, 0, `${id} está en los dos modos`);
  }
  const escalera = ['casilla', 'puesto', ...IDS].map((id) => PLANO[id]);
  for (let i = 1; i < escalera.length; i++) {
    assert.ok(area(escalera[i]) > area(escalera[i - 1]), `${escalera[i].id} es más grande que ${escalera[i - 1].id}`);
  }
  for (let i = 3; i < escalera.length; i++) assert.ok(costo(escalera[i]) > costo(escalera[i - 1]), `${escalera[i].id} cuesta más que ${escalera[i - 1].id}`);
  // las nuevas van después de la casilla y del puesto en el panel
  const orden = PLANOS.filter((p) => p.categoria === 'refugios').map((p) => p.id);
  assert.ok(orden.indexOf('cabana-piedra') > orden.indexOf('casilla') && orden.indexOf('cabana-piedra') > orden.indexOf('puesto'));
  assert.ok(orden.indexOf('casa-galeria') > orden.indexOf('cabana-piedra') && orden.indexOf('casona') > orden.indexOf('casa-galeria'));
  // siempre son habitables sin ser módulos de snap
  for (const id of IDS) assert.ok(!PLANO[id].snap && !PLANO[id].pieza, `${id} es una obra por etapas, no una pieza`);
}

// ---------------------------------------------------------------- 2. geometría de cada etapa
{
  for (const id of IDS) {
    const P = PLANO[id];
    for (let i = 0; i < 4; i++) {
      const e = P.etapas[i];
      assert.ok(e.nombre && e.dice && Object.keys(e.pide).length, `${id} etapa ${i + 1}: nombre, texto y materiales`);
      for (const [k, n] of Object.entries(e.pide)) assert.ok(['piedra', 'tronco', 'tabla'].includes(k) && Number.isInteger(n) && n > 0, `${id}: material ${k}=${n}`);
      for (const suelo of [null, (x, z) => 0.25 + 0.1 * x - 0.05 * z]) {   // llano y en pendiente
        const c = new Constructor();
        e.arma(c, P, {}, suelo);
        assert.ok(c.pos.length > 0, `${id} etapa ${i + 1} dibuja algo`);
        for (const v of c.pos) assert.ok(Number.isFinite(v), `${id} etapa ${i + 1}: vértice finito`);
        for (const v of c.col) assert.ok(Number.isFinite(v));
      }
    }
    assert.equal(P.etapas.filter((e) => e.termina).length, 1);
    assert.ok(P.etapas[3].termina, `${id}: la última etapa termina`);
    // la etapa 3 es la de las paredes y la 4 la del techo: así las tiñe la tecla T
    assert.match(P.etapas[2].nombre, /pared/i);
    assert.match(P.etapas[3].nombre, /techo/i);
    assert.equal(zonaCasa(P, P.etapas[2].nombre, '#745c43'), 'pared', `${id}: sus paredes se tiñen`);
    assert.equal(zonaCasa(P, P.etapas[2].nombre, '#4a3b2c'), 'aberturas', `${id}: sus marcos se tiñen`);
    assert.equal(zonaCasa(P, P.etapas[2].nombre, '#91a7a3'), null, `${id}: el vidrio no se tiñe`);
    assert.equal(zonaCasa(P, P.etapas[3].nombre, '#4e4038'), 'techo', `${id}: su techo se tiñe`);
    // el zócalo de piedra (etapa 1) y la piedra del hogar (etapa 4) no se pintan como pared
    assert.equal(zonaCasa(P, P.etapas[0].nombre, '#7d766c'), null, `${id}: el zócalo no se tiñe`);
    assert.equal(zonaCasa(P, P.etapas[3].nombre, '#7d766c'), null, `${id}: el hogar no se tiñe`);
    // las partes de cada etapa quedan dentro de lo que ocupa la casa (más la galería, el hogar y el techo)
    const c = new Constructor();
    for (let i = 0; i < 4; i++) P.etapas[i].arma(c, P, {}, null);
    let minY = Infinity, maxY = -Infinity, minZ = Infinity;
    for (let k = 0; k < c.pos.length; k += 3) { minY = Math.min(minY, c.pos[k + 1]); maxY = Math.max(maxY, c.pos[k + 1]); minZ = Math.min(minZ, c.pos[k + 2]); }
    assert.ok(minY >= -0.3 && maxY < 7, `${id}: altura razonable (${minY.toFixed(2)}..${maxY.toFixed(2)})`);
    if (P.galeria) {
      assert.ok(minZ < -P.fondo / 2 - P.galeria + 0.1, `${id}: la galería sobresale del frente`);
      assert.equal(P.huellasExtra.length, 1, `${id}: la galería cuenta en la huella`);
      const h = P.huellasExtra[0];
      assert.ok(h.lz < -P.fondo / 2 && h.ancho >= P.ancho && h.fondo >= P.galeria, `${id}: la huella de la galería cubre el frente`);
    } else assert.ok(!P.huellasExtra);
  }
}

// ---------------------------------------------------------------- 3. la física, con el motor del juego
// La obra va en el origen sin giro: las coordenadas locales son las del mundo.
function armarFisica(id, etapas = 4) {
  const P = PLANO[id], col = crearColisiones(), duenio = { id };
  for (let k = 1; k <= etapas; k++) {
    const f = P.fisicaCasa(k);
    for (const [ax, az, bx, bz, r, y0, y1] of f.segmentos) col.agregar({ duenio, seg: true, ax, az, bx, bz, r, alturaMin: y0, alturaMax: y1 });
    for (const [x, z, r, y0, y1] of f.circulos) col.agregar({ duenio, x, z, r, alturaMin: y0, alturaMax: y1 });
    for (const [x, z, largo, ancho, alto, espesor] of f.plataformas) col.agregarPlataforma({ duenio, x, z, ang: 0, largo, ancho, alto, espesor, escalonMax: 0.62 });
  }
  return col;
}
// Camina de a pasos hacia cada punto, con los pies a la altura del piso que haya. Devuelve hasta dónde llegó.
function caminar(col, desde, puntos) {
  const pos = { x: desde[0], y: 0, z: desde[1] };
  for (const [tx, tz] of puntos) {
    for (let i = 0; i < 400; i++) {
      const dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz);
      if (d < 0.12) break;
      const paso = Math.min(0.08, d);
      pos.x += dx / d * paso; pos.z += dz / d * paso;
      const p = col.plataformaEn(pos.x, pos.z, pos.y);
      pos.y = p ? p.alto : 0;
      col.resolver(pos, 0.35, 1.7);
    }
  }
  return pos;
}
const cerca = (pos, x, z, tol = 0.35) => Math.hypot(pos.x - x, pos.z - z) <= tol;

{
  // las tres: se entra por la puerta hasta el centro de la sala
  for (const id of IDS) {
    const P = PLANO[id], col = armarFisica(id), zf = -P.fondo / 2;
    const entra = caminar(col, [0, zf - (P.galeria || 0) - 3], [[0, zf - (P.galeria || 0) - 1.0], [0, zf + 1.0]]);
    assert.ok(entra.z > zf + 0.5, `${id}: se entra por la puerta (llegó a z=${entra.z.toFixed(2)})`);
    assert.ok(Math.abs(entra.y - 0.62) < 0.02, `${id}: adentro se camina sobre el piso (y=${entra.y.toFixed(2)})`);
    // no se atraviesa la pared del fondo ni las laterales
    const atrasF = caminar(col, [0, 0], [[0, P.fondo / 2 + 2]]);
    assert.ok(atrasF.z < P.fondo / 2, `${id}: la pared del fondo frena (z=${atrasF.z.toFixed(2)})`);
    const lado = caminar(col, [-P.ancho / 2 - 2, zf - 3], [[-P.ancho / 2 - 2, 0], [0, 0]]);
    assert.ok(Math.abs(lado.x) > 0.5 || lado.x < -P.ancho / 2 + 0.2, `${id}: la pared lateral frena`);
    // el zócalo de piedra (etapa 1) es un muro bajo; las paredes altas llegan recién con la etapa 3
    const alturaMax = (k) => Math.max(0, ...P.fisicaCasa(k).segmentos.map((s) => s[6]));
    assert.ok(alturaMax(1) <= 1.2, `${id}: el zócalo es bajo (${alturaMax(1).toFixed(2)})`);
    assert.equal(P.fisicaCasa(2).segmentos.length, 0, `${id}: el piso no pone paredes`);
    assert.ok(alturaMax(3) >= P.alto, `${id}: las paredes de la etapa 3 llegan hasta el techo`);
  }
  // la cabaña: la cama de la esquina estorba y la mesa también
  {
    const col = armarFisica('cabana-piedra');
    const cama = PLANO['cabana-piedra'].camas[0];
    const sobreCama = caminar(col, [0, 0], [[cama.x, cama.z]]);
    assert.ok(!cerca(sobreCama, cama.x, cama.z, 0.3), 'la cabaña: no se camina sobre la cama');
    const mesa = PLANO['cabana-piedra'].mesas[0];
    const sobreMesa = caminar(col, [mesa.x, mesa.z - 2], [[mesa.x, mesa.z]]);
    assert.ok(!cerca(sobreMesa, mesa.x, mesa.z, 0.3), 'la cabaña: no se camina sobre la mesa');
    // el hogar de piedra de adentro frena
    const h = PLANO['cabana-piedra'].hogares[0];
    const alHogar = caminar(col, [0, h.z], [[PLANO['cabana-piedra'].ancho / 2 - 0.1, h.z]]);
    assert.ok(alHogar.x < PLANO['cabana-piedra'].ancho / 2 - 0.5, 'la cabaña: el hogar de adentro frena');
  }
  // la casa con galería: la baranda cierra los lados de la galería pero deja el paso al escalón
  {
    const P = PLANO['casa-galeria'], col = armarFisica('casa-galeria');
    const zg = -P.fondo / 2 - P.galeria;
    const porLado = caminar(col, [P.ancho / 2 + 1.5, zg - 0.5], [[P.ancho / 2 - 0.4, zg - 0.5], [P.ancho / 2 - 0.4, zg + 1.2]]);
    assert.ok(porLado.y < 0.4, 'la casa: no se sube a la galería por el costado (pasa la baranda)');
    const porEscalon = caminar(col, [0, zg - 3], [[0, zg - 0.6], [0, zg + 1.0]]);
    assert.ok(porEscalon.z > zg + 0.5 && porEscalon.y > 0.55, 'la casa: se sube a la galería por el escalón');
    // por la baranda del frente, fuera del paso, no
    const porFrente = caminar(col, [-2.6, zg - 3], [[-2.6, zg + 1.0]]);
    assert.ok(porFrente.z < zg + 0.3 || porFrente.y < 0.4, 'la casa: la baranda del frente frena');
    // los postes de la galería estorban
    const poste = P.fisicaCasa(4).circulos[1];
    const aPoste = caminar(col, [poste[0], poste[1] - 1.5], [[poste[0], poste[1]]]);
    assert.ok(!cerca(aPoste, poste[0], poste[1], 0.25), 'la casa: el poste de la galería frena');
  }
  // la casona: los dormitorios se entran por su vano y no por el tabique del medio
  {
    const P = PLANO['casona'], col = armarFisica('casona');
    const zf = -P.fondo / 2, zg = zf - P.galeria;
    const dormI = caminar(col, [0, zg - 3], [[0, zg - 1], [0, zf + 1.2], [-2.4, zf + 1.2], [-2.4, 2.0]]);
    assert.ok(cerca(dormI, -2.4, 2.0, 0.45), `la casona: se llega al dormitorio izquierdo por su vano (${dormI.x.toFixed(2)}, ${dormI.z.toFixed(2)})`);
    const dormD = caminar(col, [0, zg - 3], [[0, zg - 1], [0, zf + 1.2], [2.4, zf + 1.2], [2.4, 2.0]]);
    assert.ok(cerca(dormD, 2.4, 2.0, 0.45), 'la casona: se llega al dormitorio derecho por su vano');
    const pared = caminar(col, [-2.4, 2.0], [[-0.2, 2.0], [2.4, 2.0]]);
    assert.ok(pared.x < 0, `la casona: el tabique del medio separa los dormitorios (x=${pared.x.toFixed(2)})`);
    const salto = caminar(col, [0.7, 1.8], [[0.7, -0.5]]);
    assert.ok(salto.z > 0.5, `la casona: entre vanos, el tabique del frente de los dormitorios frena (z=${salto.z.toFixed(2)})`);
    // las camas
    for (const b of P.camas) {
      const s = caminar(col, [b.x, b.z - 1.6], [[b.x, b.z]]);
      assert.ok(!cerca(s, b.x, b.z, 0.3), 'la casona: no se camina sobre la cama');
    }
    // los dos hogares
    for (const h of P.hogares) {
      const s = caminar(col, [0, h.z], [[h.lado * (P.ancho / 2 - 0.1), h.z]]);
      assert.ok(Math.abs(s.x) < P.ancho / 2 - 0.5, 'la casona: los hogares frenan');
    }
  }
  // los segmentos y los círculos tienen alturas en orden y números finitos
  for (const id of IDS) for (let k = 1; k <= 4; k++) {
    const f = PLANO[id].fisicaCasa(k);
    for (const s of f.segmentos) { assert.ok(s.every(Number.isFinite), `${id}: segmento finito`); assert.ok(s[5] < s[6], `${id}: segmento con altura`); }
    for (const q of f.circulos) { assert.ok(q.every(Number.isFinite)); assert.ok(q[3] < q[4]); }
    for (const q of f.plataformas) assert.ok(q.every(Number.isFinite));
  }
}

// ---------------------------------------------------------------- 4. el inglés
{
  const T = (s) => EN[s] ?? EN[s?.trim?.()];
  for (const id of IDS) {
    const P = PLANO[id];
    for (const s of [P.nombre, P.texto, ...P.etapas.flatMap((e) => [e.nombre, e.dice])]) {
      assert.ok(T(s), `${id}: falta el inglés de «${s}»`);
    }
  }
}

// ---------------------------------------------------------------- 5. la lluvia y el cableado
{
  const con = fs.readFileSync(new URL('../src/construccion.js', import.meta.url), 'utf8');
  const lluvia = con.slice(con.indexOf('function cubiertasLluvia'), con.indexOf('function cubiertasLluvia') + 2400);
  assert.ok(lluvia.includes('P.galeria') && lluvia.includes('P.fondo / 2 - P.galeria'), 'la galería techada también cubre de la lluvia');
  assert.ok(con.includes('PLANOS.push(...PLANOS_CASAS)') && con.includes('P.fisicaCasa'), 'los planos y su física están conectados');
}

// ---------------------------------------------------------------- 6. la cama suelta
{
  const C = PLANO['cama-tablas'];
  assert.ok(C, 'la cama suelta está en el catálogo');
  assert.equal(C.categoria, 'mobiliario');
  assert.equal(C.pieza, true, 'es una pieza: se coloca, se gira y se mueve (Shift+Y)');
  assert.ok(C.funciones.includes('dormir') && C.confort >= PLANO['catre-campo'].confort, 'se duerme en ella y abriga más que el catre');
  assert.ok(C.ancho >= 1.0 && C.fondo >= 2.0, 'mide lo que se ve');
  assert.deepEqual(Object.keys(C.pide).sort(), ['tabla', 'tronco'], 'sólo pide lo que hay en los dos modos');
  const c = new Constructor();
  C.arma(c, C, {}, null);
  assert.ok(c.pos.length > 0 && c.pos.every(Number.isFinite));
  let mx = -Infinity, mn = Infinity;
  for (let k = 1; k < c.pos.length; k += 3) { mx = Math.max(mx, c.pos[k]); mn = Math.min(mn, c.pos[k]); }
  assert.ok(mn >= -0.01 && mx <= C.alto + 0.05, `la cama entra en su alto (${mn.toFixed(2)}..${mx.toFixed(2)})`);
  const con = fs.readFileSync(new URL('../src/construccion.js', import.meta.url), 'utf8');
  assert.ok(con.includes("id === 'cama-tablas'") && con.includes("'cama-tablas': 'mobiliario'"), 'la cama tiene su física y su categoría');
  assert.ok(EN['Cama de tablas'] && EN[C.texto], 'la cama está traducida');
}

console.log('verificar-3-8-8-casas: ok');
