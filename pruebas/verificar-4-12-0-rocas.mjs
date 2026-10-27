// 4.12.0 (parte B): rocas y terreno. Con el bosque de verdad armado en Node:
//   · cinco modelos de piedra en Media y Alta (peñasco, lajas, canto rodado, roca partida, peña con musgo y líquenes), uno solo en Baja:
//     cada uno con su forma, su musgo y sus colores; ninguno blanco ni roto; sin salirse del presupuesto de triángulos;
//   · NADA se mueve: los árboles, las matas, las colisiones y la cuenta de rocas son idénticos a los de la 4.11.5 (huellas de abajo);
//   · el reparto de modelos sigue el lugar (cantos en la orilla, rocas partidas en la ladera, cantos las chicas) y no gasta números al azar;
//   · cada piedra con su escala y su hundimiento, y una malla instanciada por modelo (comparten el material: ningún programa nuevo);
//   · el terreno: la variedad de escala media vive en el onBeforeCompile que ya existía, detrás de uDetalleSuelo (Baja y Mínima, nada),
//     sin uniformes, texturas ni luces nuevas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const { generarTerreno } = await import('../src/terreno.js');
const V = await import('../src/vegetacion.js');
const { CALIDADES, LAGO } = await import('../src/config.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

const T = generarTerreno();
const NOMBRES = ['roca', 'roca1', 'roca2', 'roca3', 'roca4'];

// ---- los cinco modelos, uno por uno
const modelos = { roca: V.roca(7, true), roca1: V.rocaLajas(), roca2: V.rocaCanto(), roca3: V.rocaPartida(), roca4: V.rocaPenaMusgosa() };
const medidas = {};
for (const nombre of NOMBRES) {
  const g = modelos[nombre], p = g.attributes.position, c = g.attributes.color, t = g.attributes.aTipo, nr = g.attributes.normal;
  const tris = (g.index ? g.index.count : p.count) / 3;
  g.computeBoundingBox();
  const b = g.boundingBox;
  let rotos = 0, blancos = 0, conMusgo = 0, tMin = Infinity, tMax = -Infinity, lum = 0, norm = 0;
  for (let i = 0; i < p.count; i++) {
    if (![p.getX(i), p.getY(i), p.getZ(i), c.getX(i), c.getY(i), c.getZ(i), t.getX(i)].every(Number.isFinite)) rotos++;
    if (c.getX(i) > 0.95 && c.getY(i) > 0.95 && c.getZ(i) > 0.95) blancos++;
    const tv = t.getX(i);
    tMin = Math.min(tMin, tv); tMax = Math.max(tMax, tv);
    if ((tv - 4) / 0.95 > 0.6) conMusgo++;   // musgo pleno (puntaje arriba de 0,6)
    lum += (c.getX(i) + c.getY(i) + c.getZ(i)) / 3;
    if (Math.abs(Math.hypot(nr.getX(i), nr.getY(i), nr.getZ(i)) - 1) < 1e-3) norm++;
  }
  medidas[nombre] = { tris, ancho: b.max.x - b.min.x, fondo: b.max.z - b.min.z, alto: b.max.y - b.min.y, y0: b.min.y, y1: b.max.y, musgo: conMusgo / p.count, tMin, tMax, lum: lum / p.count };
  ok(rotos === 0, `${nombre}: ningún vértice roto`);
  ok(blancos === 0, `${nombre}: ningún vértice blanco`);
  ok(norm === p.count, `${nombre}: todas las normales unitarias`);
  ok(tMin >= 4 - 1e-6 && tMax <= 4.95 + 1e-6, `${nombre}: sigue siendo piedra (aTipo entre 4 y 4,95: ${tMin.toFixed(2)}..${tMax.toFixed(2)})`);
  ok(tris >= 400 && tris <= 2200, `${nombre}: ${tris} triángulos (ni basto ni pesado)`);
  ok(medidas[nombre].ancho > 1.3 && medidas[nombre].ancho < 3.0 && medidas[nombre].fondo > 1.2 && medidas[nombre].fondo < 2.8, `${nombre}: huella de ${medidas[nombre].ancho.toFixed(2)} × ${medidas[nombre].fondo.toFixed(2)} m (una piedra de escala 1)`);
  ok(medidas[nombre].alto > 0.6 && medidas[nombre].alto < 2.3, `${nombre}: ${medidas[nombre].alto.toFixed(2)} m de alto`);
  ok(medidas[nombre].lum > 0.1 && medidas[nombre].lum < 0.45, `${nombre}: gris de piedra (luminosidad ${medidas[nombre].lum.toFixed(2)})`);
}
// cada modelo con su carácter
ok(medidas.roca2.musgo === 0 && medidas.roca2.tMax === 4, 'el canto rodado es liso: sin una pizca de musgo');
ok(medidas.roca1.musgo > 0.1 && medidas.roca3.musgo > 0.01 && medidas.roca4.musgo > 0.3, 'lajas, roca partida y peña llevan musgo (la peña, mucho más)');
ok(medidas.roca4.musgo > medidas.roca1.musgo * 1.2 && medidas.roca4.musgo > medidas.roca3.musgo * 3, 'la peña es la más musgosa de las tres');
ok(medidas.roca2.alto < medidas.roca4.alto * 0.9, 'el canto es bajo y la peña, alta');
ok(medidas.roca1.alto / Math.max(medidas.roca1.ancho, medidas.roca1.fondo) < 0.6, 'las lajas son más anchas que altas');
ok(medidas.roca4.alto / Math.max(medidas.roca4.ancho, medidas.roca4.fondo) > 0.8, 'la peña es alta');
const huellas = NOMBRES.map((k) => [medidas[k].alto.toFixed(2), medidas[k].musgo.toFixed(2), medidas[k].lum.toFixed(2)].join('|'));
ok(new Set(huellas).size === 5, 'los cinco modelos son distintos entre sí (alto, musgo y luminosidad)');
// la roca partida tiene caras planas más claras (el color del vértice se aclara en el corte)
{
  const g = modelos.roca3, c = g.attributes.color;
  let claros = 0, oscuros = 0;
  for (let i = 0; i < c.count; i++) { const l = (c.getX(i) + c.getY(i) + c.getZ(i)) / 3; if (l > 0.27) claros++; else if (l < 0.2) oscuros++; }
  ok(claros > c.count * 0.1 && oscuros > c.count * 0.05, `la roca partida mezcla caras claras de quebradura (${claros}) con la piedra oscura (${oscuros})`);
}
// la peña tiene líquenes: vértices que no son grises ni verdes de musgo (ocre o verde pálido)
{
  const g = modelos.roca4, c = g.attributes.color, t = g.attributes.aTipo;
  let liquen = 0;
  for (let i = 0; i < c.count; i++) { const r = c.getX(i), ve = c.getY(i), a = c.getZ(i); if (r > a * 1.45 && t.getX(i) < 4.6) liquen++; }
  ok(liquen > 20, `la peña lleva líquenes ocres (${liquen} vértices cálidos fuera del musgo)`);
}
// las geometrías son siempre las mismas (sin azar: el mismo bosque en cada partida)
{
  const a = V.rocaPartida().attributes.position.array, b = V.rocaPartida().attributes.position.array;
  ok(a.length === b.length && a.every((v, i) => v === b[i]), 'los modelos salen siempre iguales');
}

// ---- el bosque armado: nada se mueve, y el reparto
const HUELLAS = {   // la 4.11.5, medida con el mismo código en la rama de partida (x, z y escala de cada árbol, mata y choque)
  media: { arboles: 6926, matas: 24793, rocas: 665, colisiones: 7341, hArb: -580541886, hMatas: -1190529502, hCol: -414093348, grupos: { rocas: 73, troncos: 11, gruposRoca: 25, gruposTronco: 9 } },
  baja: { arboles: 4810, matas: 23062, rocas: 639, colisiones: 5237, hArb: -987983161, hMatas: -1664011902, hCol: -1458866855, grupos: { rocas: 34, troncos: 4, gruposRoca: 12, gruposTronco: 3 } },
  alta: { arboles: 8372, matas: 25786, rocas: 640, colisiones: 8770, hArb: -1823309694, hMatas: -612024883, hCol: -595294711, grupos: { rocas: 68, troncos: 3, gruposRoca: 23, gruposTronco: 2 } },
};
const hashDe = (lista, f) => { let h = 0; for (const e of lista) for (const v of f(e)) h = (h * 31 + Math.round(v * 1000)) % 2147483647; return h; };
const orilla = (x, z) => Math.hypot(x - LAGO.x, z - LAGO.z) - T.radioLago(Math.atan2(z - LAGO.z, x - LAGO.x));
const vegs = {};
for (const q of ['media', 'baja', 'alta']) {
  const escena = new THREE.Scene();
  const veg = generarConEscena(q, escena);
  vegs[q] = { veg, escena };
  const H = HUELLAS[q];
  const rocas = veg.matas.filter((m) => m.tipo === 'roca');
  ok(veg.arboles.length === H.arboles && veg.matas.length === H.matas && rocas.length === H.rocas && veg.colisiones.length === H.colisiones, `${q}: los mismos ${H.arboles} árboles, ${H.matas} matas, ${H.rocas} rocas y ${H.colisiones} choques que en la 4.11.5`);
  ok(hashDe(veg.arboles, (a) => [a.x, a.z, a.esc]) === H.hArb, `${q}: ni un árbol se movió ni cambió de tamaño`);
  ok(hashDe(veg.matas, (m) => [m.x, m.z, m.esc || 0]) === H.hMatas, `${q}: ninguna mata ni roca cambió de lugar`);
  ok(hashDe(veg.colisiones, (c) => [c.x ?? c.ax, c.z ?? c.az, c.r]) === H.hCol, `${q}: los choques (árboles, rocas, troncos) son los mismos`);
  ok(JSON.stringify(veg.composicionPaisaje) === JSON.stringify(H.grupos), `${q}: los grupos de rocas y troncos del paisaje, los mismos`);
  // lo picable sigue siendo tipo «roca» (la lógica de oficios y de recolección lo busca así), con la escala de siempre
  ok(rocas.every((m) => m.ref && NOMBRES.includes(m.ref.tipo) && Number.isFinite(m.esc) && m.esc > 0.3), `${q}: toda roca picable guarda su modelo y su escala`);
}
function generarConEscena(q, escena) { return V.generarVegetacion(T, CALIDADES[q], escena); }

// Baja: una sola piedra, como siempre (mismo costo)
{
  const rocas = vegs.baja.veg.matas.filter((m) => m.tipo === 'roca');
  ok(rocas.every((m) => m.ref.tipo === 'roca'), 'Baja: una sola piedra, la de siempre');
  const bloques = vegs.baja.escena.children.flatMap((c) => c.children || []).filter((o) => /^soto-roca/.test(o.name));
  ok(bloques.length === 1 && bloques[0].name === 'soto-roca', 'Baja: un solo bloque de piedras en el sotobosque');
}
for (const q of ['media', 'alta']) {
  const { veg, escena } = vegs[q];
  const rocas = veg.matas.filter((m) => m.tipo === 'roca');
  const cuenta = {};
  for (const m of rocas) cuenta[m.ref.tipo] = (cuenta[m.ref.tipo] || 0) + 1;
  for (const k of NOMBRES) ok((cuenta[k] || 0) >= rocas.length * 0.06, `${q}: el modelo ${k} aparece en al menos el 6 % de las piedras (${cuenta[k] || 0} de ${rocas.length})`);
  ok(NOMBRES.every((k) => (cuenta[k] || 0) <= rocas.length * 0.4), `${q}: ningún modelo pasa del 40 % (repetición evidente)`);
  // una malla instanciada por modelo, todas con el mismo material
  const bloques = escena.children.flatMap((c) => c.children || []).filter((o) => /^soto-roca/.test(o.name));
  ok(bloques.length === 5, `${q}: cinco bloques de piedras (uno por modelo), no uno por piedra`);
  ok(new Set(bloques.map((b) => b.material)).size === 1 && bloques[0].material === veg.mats.roca, `${q}: los cinco comparten el material de la piedra (ningún programa nuevo que compilar)`);
  ok(bloques.every((b) => b.isInstancedMesh), `${q}: todos instanciados`);
  // el reparto sigue el lugar (en el valle armado; el detalle, abajo, con la función pura)
  const por = (f) => { const l = rocas.filter(f), c = {}; for (const m of l) c[m.ref.tipo] = (c[m.ref.tipo] || 0) + 1; return { l, c }; };
  const lad = por((m) => !m.decorativo && T.pendiente[T.indice(m.x, m.z)] > 0.55);
  const ori = por((m) => !m.decorativo && Math.abs(orilla(m.x, m.z)) < 8);
  if (ori.l.length >= 4) ok((ori.c.roca2 || 0) / ori.l.length >= 0.2, `${q}: en la orilla hay cantos rodados (${ori.c.roca2 || 0} de ${ori.l.length})`);
  if (lad.l.length >= 8) ok((lad.c.roca3 || 0) / lad.l.length > (cuenta.roca3 / rocas.length) * 1.0, `${q}: en la ladera hay rocas partidas de sobra (${lad.c.roca3 || 0} de ${lad.l.length})`);
  ok(rocas.filter((m) => !m.decorativo && m.esc < 0.5).length > 10, `${q}: hay piedras chicas sueltas`);
  // el hundimiento propio de cada modelo, en lo llano (la roca de siempre queda en h - 0,2·esc; las demás, un poco más abajo según el modelo)
  {
    const M = new THREE.Matrix4(), p = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3(), hundes = {};
    for (const m of rocas) {
      if (m.decorativo || T.pendiente[T.indice(m.x, m.z)] > 0.06) continue;
      m.ref.ch.porTipo[m.ref.tipo][0].getMatrixAt(m.ref.i, M); M.decompose(p, qq, s);
      (hundes[m.ref.tipo] ||= []).push((T.altura(m.x, m.z) - 0.2 * m.esc - p.y) / m.esc);
    }
    const media = (l) => l.reduce((x, y) => x + y, 0) / l.length;
    ok((hundes.roca || []).every((h) => Math.abs(h) < 1e-3), `${q}: el peñasco de siempre queda donde siempre en lo llano`);
    ok((hundes.roca2 || []).length >= 2 && media(hundes.roca2) > 0.04 && media(hundes.roca2) < 0.16, `${q}: el canto rodado se entierra más (${(media(hundes.roca2 || [0]) * 100).toFixed(0)} % de su tamaño)`);
    ok((hundes.roca1 || []).length >= 2 && media(hundes.roca1) < media(hundes.roca2) && media(hundes.roca1) > 0.005, `${q}: las lajas, menos que el canto (${(media(hundes.roca1 || [0]) * 100).toFixed(1)} %)`);
  }
  // cada piedra con su escala y su hundimiento: las matrices de un mismo modelo no se repiten
  for (const k of NOMBRES) {
    const xs = new Set(), ys = new Set(), M = new THREE.Matrix4(), p = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
    let total = 0;
    for (const m of rocas) {
      if (m.ref.tipo !== k) continue;
      m.ref.ch.porTipo[k][0].getMatrixAt(m.ref.i, M);
      M.decompose(p, qq, s);
      xs.add(Math.round(s.x * 50)); ys.add(Math.round(s.y * 50));
      total++;
    }
    ok(total > 0 && xs.size >= Math.min(total, 12) && ys.size >= Math.min(total, 12), `${q}: ${k}: ${total} piedras con ${xs.size} anchos y ${ys.size} altos distintos`);
  }
  // las sueltas (que antes eran bolas parejas, escala igual en x, y, z) ahora tienen proporciones propias
  {
    const proporciones = new Set(), M = new THREE.Matrix4(), p = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
    let anchas = 0, total = 0;
    for (const m of rocas) {
      if (m.decorativo) continue;
      m.ref.ch.porTipo[m.ref.tipo][0].getMatrixAt(m.ref.i, M);
      M.decompose(p, qq, s);
      proporciones.add(Math.round((s.x / s.z) * 100));
      if (s.x / s.z > 1.06) anchas++;
      
      total++;
    }
    ok(total > 100 && proporciones.size >= 25 && anchas > total * 0.15, `${q}: las piedras sueltas ya no son bolas parejas (${proporciones.size} proporciones, ${anchas} de ${total} más anchas que hondas)`);
  }
  // el reparto no depende del azar de la partida: dos armados dan el mismo modelo en cada lugar
  const otra = V.generarVegetacion(T, CALIDADES[q], new THREE.Scene());
  const r2 = otra.matas.filter((m) => m.tipo === 'roca');
  ok(r2.length === rocas.length && r2.every((m, i) => m.ref.tipo === rocas[i].ref.tipo && m.x === rocas[i].x), `${q}: dos armados reparten los mismos modelos en los mismos lugares`);
}
// la función pura del reparto: determinista, por lugar y por tamaño
{
  const { modeloDePiedra, PESOS_ROCA } = V;
  const tabla = (contexto, tam, dominante = -1, n = 6000) => {
    const c = [0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) c[modeloDePiedra((i * 37.7) % 900 - 450, ((i * 91.3) % 900) - 450 + (i % 7) * 0.31, tam, contexto, dominante)]++;
    return c.map((v) => v / n);
  };
  const ladera = tabla('ladera', 1), orillaT = tabla('orilla', 1), suelta = tabla('suelta', 1), chica = tabla('suelta', 0.4), grande = tabla('suelta', 1.8), grupo = tabla('grupo', 1);
  ok(modeloDePiedra(12.5, -80.2, 1, 'suelta') === modeloDePiedra(12.5, -80.2, 1, 'suelta'), 'el modelo de un lugar es siempre el mismo');
  ok([ladera, orillaT, suelta, chica, grande, grupo].every((t) => t.every((v) => v > 0.01)), 'en todos los contextos y tamaños salen los cinco modelos');
  ok(Object.keys(PESOS_ROCA).join() === 'ladera,orilla,suelta,grupo', 'cuatro contextos: ladera, orilla, suelta y grupo');
  ok(orillaT[2] > 0.4 && orillaT[2] > suelta[2] * 1.8, `en la orilla mandan los cantos rodados (${(orillaT[2] * 100).toFixed(0)} % contra ${(suelta[2] * 100).toFixed(0)} % de las sueltas)`);
  ok(ladera[3] > 0.2 && ladera[3] > suelta[3] * 1.5, `en la ladera sobresalen las rocas partidas (${(ladera[3] * 100).toFixed(0)} % contra ${(suelta[3] * 100).toFixed(0)} %)`);
  ok(chica[2] > grande[2] * 4 && chica[2] > 0.4, `las chicas son sobre todo cantos (${(chica[2] * 100).toFixed(0)} %) y las grandes casi no (${(grande[2] * 100).toFixed(0)} %)`);
  ok(grande[4] > chica[4] * 3 && grande[0] > chica[0], `las grandes son peñascos y peñas con musgo (${(grande[4] * 100).toFixed(0)} % de peñas contra ${(chica[4] * 100).toFixed(0)} % de las chicas)`);
  for (let d = 0; d < 5; d++) { const t = tabla('grupo', 1, d); ok(t[d] > 0.55, `un grupo con el modelo ${d} dominante lo usa en más de la mitad (${(t[d] * 100).toFixed(0)} %)`); }
  ok(tabla('grupo', 1, -1).every((v) => v < 0.5), 'sin modelo dominante ninguno pasa de la mitad');
  ok(grupo.every((v) => v > 0.08 && v < 0.4), 'en el paisaje, mezcla pareja de los cinco');
}
// el modelo que dominaba un grupo de rocas del paisaje se nota: algún grupo con más de la mitad de un mismo modelo
{
  const g = vegs.media.veg.matas.filter((m) => m.decorativo && m.tipo === 'roca');
  let con = 0;
  for (const m of g) {
    const vecinas = g.filter((o) => Math.hypot(o.x - m.x, o.z - m.z) < 9);
    if (vecinas.length >= 3) { const c = {}; for (const o of vecinas) c[o.ref.tipo] = (c[o.ref.tipo] || 0) + 1; if (Math.max(...Object.values(c)) > vecinas.length / 2) con++; }
  }
  ok(con >= 1, 'en los grupos del paisaje domina un modelo (afloramientos, no mezcla pareja)');
}

// ---- el código: el reparto no toca los números al azar; el terreno no suma nada nuevo
const v = leer('src/vegetacion.js');
const iModelo = v.indexOf('export function modeloDePiedra('), fModelo = v.indexOf('export const ACOSTAR_ROCA');
ok(iModelo > 0 && fModelo > iModelo && !/\br\(\)/.test(v.slice(iModelo, fModelo)), 'elegir el modelo no gasta números al azar del bosque (r())');
const iColocar = v.indexOf('function colocarRoca('), fColocar = v.indexOf('  const lug = T.lugares;', iColocar);
ok(!/\br\(\)/.test(v.slice(iColocar, fColocar)), 'colocar la roca no gasta números al azar propios (sólo los de colocar())');
ok(v.includes('const modelosRoca = [\'roca\'];') && v.includes('if (musgo) {') && v.includes("registrar('roca1', rocaLajas()"), 'los modelos nuevos sólo se registran con el musgo (Media y Alta)');
ok(v.includes("registrar('roca', roca(7, musgo), null, mats.roca, 'soto');"), 'el peñasco de siempre sigue registrado igual');
ok(!/instanceColor/.test(v.slice(v.indexOf('function rocaLajas'), v.indexOf('export const ACOSTAR_ROCA'))), 'los modelos no piden color por instancia (otro programa)');

const m = leer('src/materiales.js');
const iT = m.indexOf('export function materialTerreno()'), fT = m.indexOf('\nexport', iT + 10) > 0 ? m.indexOf('\nexport', iT + 10) : m.length;
const terreno = m.slice(iT, fT);
const iB = terreno.indexOf('4.12.0: variedad de escala media'), fB = terreno.indexOf('// 3.2: manchones de flores', iB);
ok(iB > 0 && fB > iB, 'el terreno tiene su bloque de variedad de escala media');
const bloque = terreno.slice(iB, fB);
ok(/if \(uDetalleSuelo > 0\.5\) \{/.test(bloque), 'la variedad del terreno sólo corre con el detalle del suelo (Media y Alta)');
ok(/cercaV = 1\.0 - smoothstep\(180\.0, 300\.0, dV\)/.test(bloque) && /if \(cercaV > 0\.01\)/.test(bloque), 'y se apaga con la distancia (no se paga en el horizonte)');
ok((bloque.match(/vnoise\(/g) || []).length <= 5, `tres o cuatro ruidos más, no una tormenta (${(bloque.match(/vnoise\(/g) || []).length})`);
ok(!/texture2D|sampler2D|uniform /.test(bloque), 'sin texturas ni uniformes nuevos');
ok(/seco \* 0\.[1-9]\d* \* enPradoV/.test(bloque) && /hondo \* 0\.[1-9]\d* \* enPradoV/.test(bloque) && /musgoV \* 0\.[1-9]\d* \* enBosque/.test(bloque) && /hojasV \* 0\.[1-9]\d* \* enBosque/.test(bloque), 'el prado (seco y hondo) y el bosque (musgo y hojas) se pintan con peso');
ok(/tierraV \* 0\.[1-9]\d* \* cercaV/.test(bloque) && /bordeCam \* 0\.[1-9]\d* \* cercaV/.test(bloque) && /dentroCam \* 0\.[1-9]\d* \* cercaV/.test(bloque) && /bordeBosque \* \(0\.3 \+ 0\.7 \* n4\) \* 0\.5 \* cercaV/.test(bloque), 'tierra pelada, borde y motas del camino y borde del bosque se pintan con peso');
for (const palabra of ['seco', 'hondo', 'musgoV', 'hojasV', 'tierraV', 'bordeCam', 'dentroCam', 'bordeBosque']) ok(bloque.includes(palabra), `el terreno pinta «${palabra}»`);
ok(!/PointLight|SpotLight|DirectionalLight/.test(bloque), 'sin luces nuevas');
ok((terreno.match(/new THREE\.\w*Material|ShaderMaterial/g) || []).length === 1, 'el terreno sigue siendo un solo material (sin shader aparte)');
// Baja y Mínima: detalleSuelo en cero, así que el bloque no corre
ok(CALIDADES.baja.detalleSuelo === 0 && CALIDADES.muybaja.detalleSuelo === 0 && CALIDADES.media.detalleSuelo === 1 && CALIDADES.alta.detalleSuelo === 1, 'detalleSuelo: 0 en Baja y Mínima, 1 en Media y Alta (de ahí cuelga todo)');
// el uniforme se nutre de la calidad en vivo
ok(leer('src/main.js').includes('U.uDetalleSuelo.value = calidad.detalleSuelo ?? 1;'), 'main.js sigue poniendo uDetalleSuelo según la calidad');

console.log(`OK 4.12.0 rocas y terreno (${n} comprobaciones)`);
