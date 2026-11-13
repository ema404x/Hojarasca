// 4.24.0 (C): paisaje y vegetación. Sólo valores, colores, geometría, texturas de datos y órdenes de dibujo: 0 programas de shader nuevos, 0 capas de pantalla
// completa, sin sumar pasto ni densidad.
//
// 1. Las copas de lejos (LOD medio, de 66 a 135 m): dos celdas nuevas del atlas de cartas (10 y 11) con contorno de nube (nueve lóbulos de arco) en lugar del recorte con
//    las puntas de las hojas; las celdas de antes salen idénticas; el racimo lejano las usa para la copa densa y la abierta; el shader las trata como celdas de recorte.
// 2. El sotobosque con menos cantidad y más variedad: queda el 72 % de las plantas, parte se reemplaza por cuatro especies nuevas (michay, rosa mosqueta, zarzaparrilla y
//    otra fronda de helecho); los árboles, las piedras, los troncos y los choques NO se mueven (huellas de la 4.23.0); el calafate, el chilco y el notro no se tocan; las
//    especies nuevas no entran a `plantas`; cada arbusto y cada parche lleva su tinte.
// 3. El suelo del prado con variedad de color: parches chatos (trébol, musgo y paja) sólo en prado llano y fuera del sendero, con su propio azar; la textura de las manchas con
//    la capa fina de tono y las manchas secas chicas (las capas de antes, iguales); el coeficiente del tono en el material del terreno.
// 4. El pasto: tres anchos de hoja y tres familias de verdes por mata (el otoño, el invierno y la estepa pesan como antes).
// 5. Los árboles lejanos con la estación: los perennes se entibian en otoño con la MISMA cuenta en el dibujo de cerca, el medio y el cartel; el tono de cada árbol varía más.
// 6. La nieve con sombra azulada (el ambiente y el rebote del suelo, en cielo.js).
// 7. La CPU: las siluetas de la pasada de sombras, una malla por especie (antes una por tramo y por especie); los mismos árboles dan sombra; las especies sin ningún árbol
//    cerca no entran al repaso de dibujo.
// 8. Las reglas del presupuesto: 18 construcciones de ShaderMaterial (como en la 4.23.0), ninguna textura ni pasada nueva.
// Cada mutación es una copia del archivo con otro nombre (sin la caché de ESM, un proceso por copia) y tiene que hacer fallar su comprobación.
//
// Uso: node pruebas/verificar-4-24-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const sha = (u8) => createHash('sha256').update(u8).digest('hex').slice(0, 12);
registrarThree();

// lo que midió el censo de la 4.23.0 con el mismo código (herramientas/censo-sotobosque-4-24-0.mjs, corrido en la base): los árboles, las piedras y los troncos, los choques
const BASE = {
  media: { arboles: 6926, colisiones: 7341, hArb: -580541886, hFijos: 1880185073, hCol: -414093348 },
  baja: { arboles: 4810, colisiones: 5237, hArb: -987983161, hFijos: 274562842, hCol: -1458866855 },
  alta: { arboles: 8372, colisiones: 8770, hArb: -1823309694, hFijos: 2005012324, hCol: -595294711 },
};
// lo que da el sotobosque de la 4.24.0 en Media (determinista)
const MEDIA_NUEVA = { matas: 20028, helecho: 1702, helecho2: 943, maqui: 621, zarza: 298, chaura: 254, mosqueta: 114, michay: 709, neneo: 1685, colihue: 1467, nalca: 113, coiron: 8631,
  chilco: 74, notro: 145, calafate: 975, roca: 665, tronco: 11, parche0: 858, parche1: 763 };
// (4.24.1, a propósito: las celdas 0, 1 y 5 —las hojas de las copas y matas de cerca— se pintan ahora con la punta más roma, la rampa de alfa más ancha y el alfa suavizado: sus huellas son las de la 4.24.1; las otras ocho, las de la 4.23.0. Ver verificar-4-24-1-c.mjs)
const CELDAS_ATLAS_4230 = ['4038154774da', '3d626c9238da', '69a80c13c66a', '3c9be461dae5', '8551bb6e7d49', 'b21f16cc3723', '67d809d0c1c9', 'a3ad45dcd747', '789ee74da997', '0226f7d4cad0'];
const CELDA_VACIA = 'e12763bce5f0';
const MANCHAS_G_4230 = { media: 0.1714, desvio: 0.3132 };

// ================================================================ lo que cada copia (la original y las mutadas de vegetacion.js) tiene que cumplir: devuelve la lista de lo que falla
async function comprobarVegetacion(V, nivel) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const THREE = await import('three');

  // ---------------------------------------------------------------- el atlas: las celdas de antes igual, las de la copa lejana con contorno de nube
  {
    const D = V.texturaCartas().image.data;
    const celda = (c) => { const ox = (c % 4) * 256, oy = Math.floor(c / 4) * 256, h = createHash('sha256'); for (let y = 0; y < 256; y++) h.update(D.subarray(((oy + y) * 1024 + ox) * 4, ((oy + y) * 1024 + ox + 256) * 4)); return h.digest('hex').slice(0, 12); };
    falla(CELDAS_ATLAS_4230.every((h, c) => celda(c) === h), 'las diez celdas de antes (árboles, matas, flores y helecho) salen idénticas a las de la 4.23.0');
    falla([12, 13, 14, 15].every((c) => celda(c) === CELDA_VACIA), 'las celdas 12 a 15 siguen vacías');
    falla(V.CELDAS_COPA_LEJOS.densa === 10 && V.CELDAS_COPA_LEJOS.abierta === 11, 'las copas de lejos usan las celdas 10 y 11 (las que estaban libres)');
    for (const c of [10, 11]) {
      const ox = (c % 4) * 256, oy = Math.floor(c / 4) * 256, A = (x, y) => D[((oy + y) * 1024 + ox + x) * 4 + 3];
      falla(A(128, 128) === 255 && A(128, 90) === 255 && A(90, 128) === 255, `celda ${c}: el centro de la copa es macizo`);
      falla(A(2, 2) === 0 && A(253, 253) === 0 && A(2, 253) === 0 && A(253, 2) === 0, `celda ${c}: las esquinas son transparentes`);
      // el contorno sigue radioCopaLejos: adentro del radio es opaco y afuera es transparente, a lo largo de toda la vuelta
      let bien = 0, total = 0;
      const fase = c === 10 ? 0.7 : 2.1;
      for (let k = 0; k < 72; k++) {
        const a = (k / 72) * Math.PI * 2, R = V.radioCopaLejos(a, fase);
        const adentro = A(Math.round(128 + Math.cos(a) * (R - 3)), Math.round(128 + Math.sin(a) * (R - 3))), afuera = A(Math.round(128 + Math.cos(a) * (R + 3)), Math.round(128 + Math.sin(a) * (R + 3)));
        total++; if (adentro === 255 && afuera === 0) bien++;
      }
      falla(bien >= 70, `celda ${c}: el borde de la copa cae donde dice radioCopaLejos (${bien} de ${total} rumbos)`);
      // sin dientes: el alfa del contorno es una rampa suave (más de dos valores intermedios en la vuelta), no un corte duro
      let rampa = 0;
      for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2, R = V.radioCopaLejos(a, fase); for (let d = -1; d <= 1; d += 0.5) { const v = A(Math.round(128 + Math.cos(a) * (R + d)), Math.round(128 + Math.sin(a) * (R + d))); if (v > 0 && v < 255) rampa++; } }
      falla(rampa > 60, `celda ${c}: el borde es una rampa suave de alfa (${rampa} muestras intermedias), no un corte`);
    }
    // el contorno: nueve lóbulos de arco, entre 85 y 107 téxeles, siempre adentro de la celda
    let mn = 1e9, mx = 0, picos = 0;
    const pasos = 720, valores = [];
    for (let k = 0; k <= pasos; k++) { const R = V.radioCopaLejos((k / pasos) * Math.PI * 2, 0.7); valores.push(R); mn = Math.min(mn, R); mx = Math.max(mx, R); }
    for (let k = 1; k < valores.length - 1; k++) if (valores[k] > valores[k - 1] && valores[k] >= valores[k + 1] && valores[k] > 98) picos++;
    falla(mn > 84 && mx < 108 && mx < 124, `el contorno de la copa lejana queda entre ${mn.toFixed(0)} y ${mx.toFixed(0)} téxeles (85 a 107, adentro de la celda de 256)`);
    falla(picos >= 8 && picos <= 12, `el contorno tiene ${picos} lóbulos de arco (nueve y alguno de la irregularidad)`);
  }

  // ---------------------------------------------------------------- el racimo lejano usa la celda de contorno redondo
  {
    const lejos = (celda, detalle) => { const c = new V.ConstructorArbol(); V.racimo(c, 5, [0, 3, 0], [2, 1.4, 2], { color: '#34602c', tipo: 1, detalle, celda, cartas: 12 }); return c.geometria(); };
    const ws = (g) => { const a = g.attributes.aCarta, s = new Set(); for (let i = 0; i < a.count; i++) s.add(+a.getW(i).toFixed(3)); return [...s]; };
    falla(ws(lejos(V.CELDAS_CARTA.densa, false)).every((w) => w === 11), 'la mancha lejana de la copa densa pinta la celda 10 (aCarta.w = 11)');
    falla(ws(lejos(V.CELDAS_CARTA.abierta, false)).every((w) => w === 12), 'la de la copa abierta, la celda 11 (aCarta.w = 12)');
    falla(ws(lejos(V.CELDAS_CARTA.cepillo, false)).every((w) => w === 1 + V.CELDAS_CARTA.cepillo), 'lo que no es copa densa ni abierta (el cepillo del pehuén) conserva su celda');
    const cerca = lejos(V.CELDAS_CARTA.densa, true), a = cerca.attributes.aCarta;
    let manchas = 0; for (let i = 0; i < a.count; i++) if (a.getW(i) >= 1 && a.getW(i) <= 12 && Math.abs(a.getZ(i)) > 1.5) manchas++;
    falla(cerca.attributes.position.count > 0 && manchas === 0, 'el árbol de cerca (cartas) no cambia: no lleva celdas de mancha');
  }

  // ---------------------------------------------------------------- las reglas del sotobosque (puras)
  {
    falla(V.SOTO_QUE_QUEDA === 0.72, 'queda el 72 % de las plantas');
    falla(!V.esPlantaDeSoto('chilco') && !V.esPlantaDeSoto('notro') && !V.esPlantaDeSoto('calafate') && !V.esPlantaDeSoto('roca') && !V.esPlantaDeSoto('tronco') && !V.esPlantaDeSoto('hojarasca0'), 'el chilco, el notro, el calafate, las piedras, los troncos y la hojarasca no se ralean');
    falla(['helecho', 'maqui', 'chaura', 'neneo', 'colihue', 'nalca', 'coiron'].every((t) => V.esPlantaDeSoto(t)), 'las demás plantas sí');
    falla(V.especieDeSoto('helecho', 0.2) === 'helecho2' && V.especieDeSoto('helecho', 0.5) === 'helecho', 'el helecho: más abajo de 0,36 sale la otra fronda');
    falla(V.especieDeSoto('maqui', 0.1) === 'zarza' && V.especieDeSoto('maqui', 0.6) === 'maqui', 'el maqui: parte sale zarzaparrilla');
    falla(V.especieDeSoto('neneo', 0.1) === 'michay' && V.especieDeSoto('chaura', 0.1) === 'mosqueta', 'el neneo da michay y la chaura rosa mosqueta');
    falla(['colihue', 'nalca', 'coiron', 'chilco', 'roca'].every((t) => V.especieDeSoto(t, 0.01) === t), 'las que no tienen variante siguen siendo ellas mismas');
    falla(V.especieDeSoto('constructor', 0.1) === 'constructor' && V.especieDeSoto('__proto__', 0.1) === '__proto__' && !V.esPlantaDeSoto('constructor') && !V.esPlantaDeSoto('__proto__'), 'una clave como constructor o __proto__ no rompe la búsqueda por nombre');
    for (const [n, v] of Object.entries(V.TINTE_SOTO)) falla(v[0] >= 0.76 && v[0] + v[1] <= 1.32 && v[2] > 0 && v[2] <= 0.1, `el tinte de ${n} queda entre 0,76 y 1,32 de brillo y ±10 % de tono`);
    falla(['michay', 'mosqueta', 'zarza', 'helecho2', 'parche0', 'parche1', 'hojarasca0', 'hojarasca1'].every((n) => Object.hasOwn(V.TINTE_SOTO, n)), 'cada especie nueva, cada parche y la hojarasca (que comparte el material del suelo con los parches) llevan su tinte: el material del suelo sigue en un solo programa');
    falla(V.PARCHES_PRADO === 0.5 && V.PARCHES_VERDES === 0.55, 'la fracción de parches y la de verdes');
    // un parche: chato (nada a más de 10 cm del piso), de ~1,9 m de ancho, de colores propios (sin blanco ni negro) y siempre el mismo
    const g = V.parcheSuelo(51, V.TONOS_PARCHE.verde, 22, 0.95, [0.1, 0.3]), g2 = V.parcheSuelo(51, V.TONOS_PARCHE.verde, 22, 0.95, [0.1, 0.3]);
    const p = g.attributes.position, c = g.attributes.color;
    let ymax = 0, rmax = 0, claro = 0, oscuro = 0;
    for (let i = 0; i < p.count; i++) { ymax = Math.max(ymax, p.getY(i)); rmax = Math.max(rmax, Math.hypot(p.getX(i), p.getZ(i))); const l = (c.getX(i) + c.getY(i) + c.getZ(i)) / 3; if (l > 0.9) claro++; if (l < 0.02) oscuro++; }
    falla(ymax < 0.1 && ymax > 0.02, `el parche es chato (${(ymax * 100).toFixed(1)} cm de alto)`);
    falla(rmax > 0.9 && rmax < 1.5, `el parche mide ${(rmax * 2).toFixed(1)} m de punta a punta`);
    falla(claro === 0 && oscuro === 0, 'ningún vértice del parche es blanco ni negro');
    const tp = g.attributes.aTipo; let tipos = 0; for (let i = 0; i < tp.count; i++) if (tp.getX(i) === 3 && V.TIPO_PARCHE === 3) tipos++;
    falla(tp.count > 0 && tipos === tp.count, 'todo el parche es de tipo 3 (como las flores): con el invierno el material lo pliega a nada y no quedan hojas verdes sobre la nieve');
    falla(g.attributes.position.array.length === g2.attributes.position.array.length && g.attributes.position.array.every((v, i) => v === g2.attributes.position.array[i]), 'el mismo parche sale siempre igual');
  }

  if (nivel === 'puro') return { mal, n };

  // ---------------------------------------------------------------- el valle armado (Media): el censo, las huellas, los parches, las sombras
  const { generarTerreno } = await import('../src/terreno.js');
  const { CALIDADES } = await import('../src/config.js');
  const { perfilHabitatPatagonico } = await import('../src/patagonia.js');
  const T = globalThis.__T4240 || (globalThis.__T4240 = generarTerreno());
  const hashDe = (lista, f) => { let h = 0; for (const e of lista) for (const v of f(e)) h = (h * 31 + Math.round(v * 1000)) % 2147483647; return h; };
  const armar = (q) => { const escena = new THREE.Scene(); return { escena, veg: V.generarVegetacion(T, CALIDADES[q], escena) }; };
  const vegs = {};
  for (const q of ['media', 'baja', 'alta']) {
    const { escena, veg } = armar(q);
    vegs[q] = { escena, veg };
    const B = BASE[q], fijos = veg.matas.filter((m) => m.tipo === 'roca' || m.tipo === 'tronco');
    falla(veg.arboles.length === B.arboles && hashDe(veg.arboles, (a) => [a.x, a.z, a.esc]) === B.hArb, `${q}: ni un árbol se movió, cambió de tamaño ni de cuenta`);
    falla(hashDe(fijos, (m) => [m.x, m.z, m.esc || 0]) === B.hFijos, `${q}: ninguna roca ni tronco caído cambió de lugar (el azar del valle no se movió)`);
    falla(veg.colisiones.length === B.colisiones && hashDe(veg.colisiones, (c) => [c.x ?? c.ax, c.z ?? c.az, c.r]) === B.hCol, `${q}: los choques son los mismos`);
  }
  {
    const { veg, escena } = vegs.media;
    const porTipo = {};
    for (const m of veg.matas) porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
    falla(veg.matas.length === MEDIA_NUEVA.matas, `Media: ${veg.matas.length} matas (${MEDIA_NUEVA.matas} esperadas)`);
    for (const [t, n] of Object.entries(MEDIA_NUEVA)) if (t !== 'matas') falla(porTipo[t] === n, `Media: ${t} ${porTipo[t]} (${n} esperadas)`);
    const viejas = 24793 - 665 - 11, ahora = veg.matas.filter((m) => !m.parche && m.tipo !== 'roca' && m.tipo !== 'tronco').length;
    falla(ahora < viejas * 0.8 && ahora > viejas * 0.65, `el sotobosque de plantas baja de ${viejas} a ${ahora} (${(100 * (1 - ahora / viejas)).toFixed(0)} % menos)`);
    falla(porTipo.chilco === 74 && porTipo.notro === 145 && porTipo.calafate === 975 && veg.calafates.length === 975, 'el chilco, el notro y el calafate (frutos) quedan como estaban');
    const nuevas = new Set(['michay', 'mosqueta', 'zarza', 'helecho2', 'parche0', 'parche1']);
    falla(veg.plantas.length === 14692 && veg.plantas.every((p) => !nuevas.has(p.tipo)), 'las especies nuevas no entran a `plantas` (el cuaderno y los picaflores no cambian)');
    falla(veg.matas.filter((m) => nuevas.has(m.tipo) && !m.parche).every((m) => m.ref && m.ref.ch && !m.choque), 'las especies nuevas son matas decorativas con su lugar y sin choque');
    falla(veg.mats.arbusto && Object.hasOwn(veg.mats, 'suelo'), 'los materiales son los de siempre (arbusto y suelo): ningún material ni programa nuevo');
    falla(escena.children.length <= 22, `el bosque cuelga ${escena.children.length} objetos de la escena (los de siempre más el grupo de las sombras)`);

    // los parches de suelo: sólo prado llano, abierto, fuera del sendero y del agua
    const parches = veg.matas.filter((m) => m.parche);
    let mala = 0;
    for (const p of parches) {
      const k = T.indice(p.x, p.z), pf = perfilHabitatPatagonico(T, p.x, p.z);
      if (T.distSendero[k] < 1.4 || T.agua(p.x, p.z) || T.pendiente[k] > 0.14 || pf.pasto < 0.5 || pf.bosque > 0.45 || pf.estepa > 0.3) mala++;
    }
    falla(parches.length === 1621 && mala === 0, `los ${parches.length} parches están en prado llano y abierto, fuera del sendero y del agua (${mala} mal puestos)`);
    falla(parches.every((m) => m.decorativo === true && m.choque === null && (m.tipo === 'parche0' || m.tipo === 'parche1')), 'los parches son decorativos y sin choque');
    const q = parches[10], malla = q.ref.ch.porTipo[q.tipo][0];
    falla(malla.instanceMatrix.array[q.ref.i * 16] !== 0, 'el parche está en su instancia');
    veg.despejar(q.x, q.z, 2, true);
    falla(q.sacado === true && malla.instanceMatrix.array[q.ref.i * 16] === 0, 'una construcción despeja el parche de suelo como cualquier mata');
    const rocaAntes = veg.matas.filter((m) => m.tipo === 'roca' && !m.sacado).length;
    falla(rocaAntes > 600, 'y la cuenta de rocas sigue siendo la de siempre');
  }

  // ---------------------------------------------------------------- las sombras de los árboles: una malla por especie
  {
    const { veg, escena } = vegs.media, calidad = CALIDADES.media;
    const sombras = veg.sombrasArboles(), nombres = Object.keys(sombras);
    const medio = veg.arboles.filter((a) => !a.sacado && a.especie !== 'pehuen')[Math.floor(veg.arboles.length / 2)];
    const cam = new THREE.Vector3(medio.x, medio.y + 1.7, medio.z);
    veg.actualizar(cam);
    const alcance = (calidad.sombraArboles ?? 45) + 4 + 1;
    const esperadas = (c) => { const m = {}; for (const a of veg.arboles) { if (a.sacado) continue; const ch = a.ref.ch; if (Math.max(0, Math.hypot(c.x - ch.x, c.z - ch.z) - 120 * 0.7) >= alcance) continue; m[a.ref.tipo] = (m[a.ref.tipo] || 0) + 1; } return m; };
    const tengo = () => Object.fromEntries(Object.entries(sombras).map(([n, im]) => [n, im.count]).filter(([, n]) => n > 0));
    const igual = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
    falla(nombres.length >= 12 && nombres.length <= 20, `hay una malla de sombra por especie (${nombres.length}), no una por tramo y por especie`);
    falla(Object.values(sombras).every((im) => im.layers.mask === 2 && im.castShadow === true && im.receiveShadow === false && im.frustumCulled === false), 'las siluetas siguen en la capa 1, proyectando, sin recibir sombra y sin recorte por cámara');
    falla(Object.values(sombras).every((im) => im.instanceColor && im.instanceColor.count === im.instanceMatrix.count), 'las siluetas llevan un tinte de relleno por instancia, como las de antes (así el material de profundidad de la pasada de sombras es el mismo programa de siempre)');
    falla(Object.values(sombras).every((im) => im.parent && im.parent.name === 'sombras-arboles' && im.parent.parent === escena), 'cuelgan de un solo grupo de la raíz de la escena (main.js lo apaga adentro de un edificio)');
    falla(igual(tengo(), esperadas(cam)), 'los árboles de las siluetas son los de los tramos que caen dentro del alcance de la sombra (la cuenta de antes, más el margen de 5 m de lo que se camina)');
    const total = Object.values(tengo()).reduce((a, b) => a + b, 0);
    // las llamadas de la pasada de sombras de los árboles: una por tramo y especie dentro del alcance (antes) contra una por especie con árboles (ahora)
    let antes = 0;
    for (const ch of veg.chunks.values()) { const d = Math.max(0, Math.hypot(cam.x - ch.x, cam.z - ch.z) - 120 * 0.7); if (d < (calidad.sombraArboles ?? 45)) antes += Object.keys(ch.porTipo).filter((n) => veg.arboles.some((a) => a.ref.ch === ch && a.ref.tipo === n)).length; }
    const ahora = Object.values(sombras).filter((im) => im.count > 0).length;
    falla(total > 100 && ahora <= 20 && antes >= ahora * 2, `la pasada de sombras de los árboles pasa de ${antes} a ${ahora} llamadas de dibujo en el bosque (${total} árboles)`);
    // se rehace cuando la cámara se movió 4 m o cambió un árbol; no en cada cuadro
    const v0 = Object.values(sombras)[0].instanceMatrix.version;
    veg.actualizar(new THREE.Vector3(cam.x + 2, cam.y, cam.z));
    falla(Object.values(sombras)[0].instanceMatrix.version === v0, 'a 2 m de donde se armó, la malla de sombras no se rehace');
    veg.actualizar(new THREE.Vector3(cam.x + 6, cam.y, cam.z));
    falla(Object.values(sombras)[0].instanceMatrix.version > v0, 'a 6 m, se rehace');
    veg.actualizar(cam);
    // talar un árbol de la sombra: su silueta sale en la próxima actualización
    const a = veg.arboles.find((x) => !x.sacado && !x.caido && Math.hypot(x.x - cam.x, x.z - cam.z) < 30 && x.especie !== 'pehuen');
    const antesN = tengo()[a.ref.tipo];
    veg.talar(a, { x: 1, z: 0 });
    veg.actualizar(cam);
    falla(tengo()[a.ref.tipo] === antesN - 1, 'un árbol talado deja de dar su silueta en la sombra');
    // y las especies sin ningún árbol cerca no entran al repaso de dibujo
    const compactas = escena.children.filter((o) => o.isInstancedMesh && o.name === '' && o.layers.mask === 1);
    falla(compactas.length > 5 && compactas.every((o) => o.visible === (o.count > 0)), 'las mallas del LOD cercano sin ningún árbol quedan invisibles (y las que tienen, visibles)');
    falla(compactas.some((o) => o.count === 0 && o.visible === false), 'hay al menos una especie sin árboles cerca que no entra al dibujo');
    // Baja y Mínima: sin sombras, sin mallas de sombra
    falla(Object.keys(vegs.baja.veg.sombrasArboles()).length === 0 && !vegs.baja.escena.children.some((o) => o.name === 'sombras-arboles'), 'Baja: sin sombras no se arma ninguna silueta');
    falla(Object.keys(vegs.alta.veg.sombrasArboles()).length >= 12, 'Alta: también una malla por especie');
  }
  return { mal, n };
}

// ================================================================ las reglas de lo que vive en shaders y en JS suelto (texto y cuentas): devuelve lo que falla
function comprobarTextos({ pasto, mat, imp, cielo, veg, datos }) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  // ---- el pasto: tres anchos de hoja
  {
    const m = pasto.match(/float anchoHoja = ([\d.]+) \+ ([\d.]+) \* step\(([\d.]+), claseHoja\) \+ ([\d.]+) \* step\(([\d.]+), claseHoja\);/);
    falla(!!m, 'el pasto elige el ancho de la hoja entre tres clases (fina, media y ancha)');
    if (m) {
      const [a, b, c1, d, c2] = m.slice(1).map(Number), w = [a, a + b, a + b + d], p = [c1, c2 - c1, 1 - c2];
      const media = w[0] * p[0] + w[1] * p[1] + w[2] * p[2];
      falla(w[0] >= 0.03 && w[2] <= 0.11 && w[2] / w[0] >= 2 && w[1] > w[0] * 1.4 && w[2] > w[1] * 1.3, `los tres anchos son distintos: ${w.map((x) => x.toFixed(3)).join(' · ')} m (de 0,03 a 0,11; el ancho al ancho más de dos veces el fino)`);
      falla(p.every((x) => x >= 0.15 && x <= 0.55), `y se reparten ${p.map((x) => (100 * x).toFixed(0)).join(' / ')} % (ninguna clase menos del 15 %)`);
      falla(media > 0.057 && media < 0.07, `el ancho medio queda en ${media.toFixed(4)} m (era 0,064 con el ancho continuo)`);
    }
    falla(/float claseHoja = fract\(rh \* 7\.9 \+ aAzar \* 3\.1\);/.test(pasto), 'la clase sale del azar de la hoja y de la mata (no de la altura: las hojas anchas no son siempre las altas)');
    falla(!pasto.includes('ancho = (0.046 + 0.036 * rh)'), 'el ancho continuo de antes ya no está');
    // ---- los verdes por mata: tres familias que se funden; en otoño, invierno y estepa pesan como antes
    const f = pasto.match(/vec3 familia = mix\(mix\(srgb\(vec3\(([\d., ]+)\)\), srgb\(vec3\(([\d., ]+)\)\), clamp\(famV, 0\.0, 1\.0\)\), srgb\(vec3\(([\d., ]+)\)\), clamp\(famV - 1\.0, 0\.0, 1\.0\)\);/);
    falla(!!f && /float famV = fract\(rnd \* 7\.7\) \* 2\.0;/.test(pasto), 'cada mata toma su verde de una de tres familias (el azar de la mata, el mismo que usaba el verde de antes)');
    if (f) {
      const [A, B, C] = f.slice(1, 4).map((s) => s.split(',').map(Number));
      const dist = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
      falla(dist(A, B) > 0.15 && dist(B, C) > 0.15 && dist(A, C) > 0.3, 'las tres familias están separadas (azul profundo, verde medio y verde oliva)');
      falla([A, B, C].every((c) => c[1] > c[0] && c[1] > c[2] * 1.4), 'las tres son verdes (el canal verde manda en las tres)');
      falla(C[0] > B[0] && B[0] > A[0], 'de la azulada a la oliva sube el rojo');
    }
    const w = pasto.match(/punta = mix\(punta, familia, mix\(([\d.]+), ([\d.]+), max\(estepa, max\(uOtono, uInvierno\)\)\)\);/);
    falla(!!w && Number(w[1]) === 0.55 && Number(w[2]) === 0.25, 'en verano pesan 0,55 y en otoño, invierno y estepa 0,25 (lo de siempre)');
    falla(/brillo \*= 1\.0 \+ \(manchas\.z - 0\.5\) \* 0\.26;/.test(pasto), 'el brillo de la hoja sigue el tono del suelo con 0,26 (era 0,16)');
  }
  // ---- el suelo
  {
    falla(/col \*= 1\.0 \+ \(manchas\.z - 0\.5\) \* 0\.3 \* enPrado;/.test(mat), 'el material del terreno toma el tono de las manchas con 0,30 (era 0,14)');
    falla(/const tonoFino = crearFbm\(r, 250, 250, 1, 0\.5\), secoFino = crearFbm\(r, 70, 70, 2, 0\.5\);/.test(datos), 'la textura de las manchas suma la capa fina del tono (rejilla de 250) y las manchas secas chicas (rejilla de 70)');
    falla(/const seco = crearFbm\(r, 11, 11, 3, 0\.45\), humedo = crearFbm\(r, 14, 14, 3, 0\.45\), tono = crearFbm\(r, 110, 110, 1, 0\.5\);/.test(datos) && datos.indexOf('tonoFino = crearFbm') > datos.indexOf('tono = crearFbm(r, 110'), 'las capas de antes se crean primero y con el mismo azar: las nuevas, después');
  }
  // ---- los árboles lejanos y la estación
  {
    const dib = (t, v) => { const m = t.match(new RegExp('mix\\(vec3\\(1\\.0\\), vec3\\(([\\d., ]+)\\), ' + v + ' \\* ([\\d.]+) \\* fract\\((\\w+) \\* ([\\d.]+)\\)\\)')); return m ? [m[1], m[2], m[4]].join('|') : null; };
    const a = dib(mat, 'uOtono'), b = dib(imp, 'uOtonoImp');
    falla(!!a && a === b, `los perennes se entibian en otoño con la MISMA cuenta en el dibujo de cerca y en el cartel (${a} · ${b})`);
    falla(/if \(aTipo > 0\.9 && aTipo < 1\.1\) vColor\.rgb \*= mix/.test(mat) && /if \(tipoImp > 0\.5 && tipoImp < 1\.5\) diffuseColor\.rgb \*= mix/.test(imp), 'sólo a los perennes (tipo 1): ni los caducos, que ya tienen su otoño, ni los helechos ni el coirón');
    falla(/fract\(sin\(dot\(posI\.xz, vec2\(12\.9898, 78\.233\)\)\) \* 43758\.5453\)/.test(mat) && /vAzarImp = fract\(sin\(dot\(baseImp\.xz, vec2\(12\.9898, 78\.233\)\)\) \* 43758\.5453\);/.test(imp), 'y con el mismo azar de la posición del árbol en los dos (cada árbol se entibia igual de cerca y de lejos)');
    const c = a && a.split('|')[0].split(',').map(Number);
    falla(!!c && c[0] > 1 && c[0] <= 1.3 && c[2] < 1 && c[2] >= 0.55 && Number(a.split('|')[2]) === 3.1, 'el cambio es de un entibiado (más rojo, menos azul), no de un color nuevo');
    falla(/im\.setColorAt\(i, tinte\.setRGB\(v \* \(0\.92 \+ r\(\) \* 0\.16\), v, v \* \(0\.88 \+ r\(\) \* 0\.2\)\)\);/.test(veg), 'el tono de cada árbol se corre un poco más (rojo ±8 %, azul −12 % a +8 %): el mismo número de azar que antes');
    falla(/vDiscoVeg = vec3\(discoM, \(celdaM < 1\.5 \|\| celdaM > 9\.5\) \? 1\.0 : 0\.0\);/.test(veg), 'el shader de la mancha lejana recorta el borde también en las celdas 10 y 11');
  }
  // ---- la nieve
  {
    falla(/const AMBIENTE_NIEVE = C\('#86aaf0'\), SUELO_NIEVE = C\('#b0c0e2'\);/.test(cielo), 'la nieve tiene su ambiente celeste frío y su rebote blanco azulado');
    const i = cielo.indexOf('hemi.groundColor.copy(SUELO_HEMI)'), j = cielo.indexOf('hemi.intensity = 0.9');
    const bloque = i > 0 && j > i ? cielo.slice(i, j) : '';
    falla(/Math\.min\(1, Math\.max\(0, U\.uInvierno\.value\)\) \* dia/.test(bloque) && /hemi\.color\.lerp\(AMBIENTE_NIEVE, 0\.8 \* nieve\); hemi\.groundColor\.lerp\(SUELO_NIEVE, 0\.7 \* nieve\);/.test(bloque), 'con el invierno (y de día) el ambiente y el rebote del suelo van hacia esos colores, antes de fijar la intensidad');
    const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
    const [r, g, b] = hex('#86aaf0');
    falla(b > g && g > r && b - r > 70, 'el ambiente de la nieve es azul (el sol sigue siendo cálido: lo que no toca el sol, azul)');
  }
  return { mal, n };
}

// ================================================================ las mallas de la textura de las manchas (datos): lo que cada copia de texturas-datos.js tiene que cumplir
async function comprobarManchas(TD) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const m = TD.generarDatos('manchas').manchas;
  const st = (k) => { let s = 0, s2 = 0, n = m.length / 4, nz = 0; for (let i = 0; i < m.length; i += 4) { const v = m[i + k] / 255; s += v; s2 += v * v; if (m[i + k] > 10) nz++; } const mu = s / n; return { media: mu, desvio: Math.sqrt(s2 / n - mu * mu), nz: nz / n }; };
  const R = st(0), G = st(1), B = st(2);
  falla(Math.abs(G.media - MANCHAS_G_4230.media) < 0.0005 && Math.abs(G.desvio - MANCHAS_G_4230.desvio) < 0.0005, 'el canal del bajo húmedo (G) es el de siempre: las capas de antes se crean primero y no cambian de azar');
  falla(B.desvio > 0.24 && B.desvio < 0.27, `el tono (B) varía más: desvío ${B.desvio.toFixed(3)} (era 0,215)`);
  falla(Math.abs(B.media - 0.5) < 0.02, `y sigue centrado en 0,5 (${B.media.toFixed(3)}): no se oscurece ni se aclara el prado entero`);
  falla(R.media > 0.31 && R.media < 0.36 && R.nz > 0.55 && R.nz < 0.64, `hay más manchas secas chicas: media ${R.media.toFixed(3)} (era 0,284) y ${(100 * R.nz).toFixed(0)} % del valle con algo de seco (era 46 %)`);
  falla(R.media < 0.4, 'pero no se seca el valle entero');
  falla(m.length === 512 * 512 * 4 && m.every((v, i) => i % 4 !== 3 || v === 255), 'la textura mide 512 × 512 y es opaca');
  return { mal, n };
}

// ================================================================ modo hijo: una copia mutada corre una de las comprobaciones y dice cuántas fallan
if (process.argv[2] === '--hijo') {
  const archivo = process.argv[3], que = process.argv[4];
  const M = await import(pathToFileURL(archivo).href);
  let mal = [];
  if (que === 'puro') mal = (await comprobarVegetacion(M, 'puro')).mal;
  else if (que === 'completo') mal = (await comprobarVegetacion(M, 'completo')).mal;
  else if (que === 'manchas') mal = (await comprobarManchas(M)).mal;
  console.log('HIJO ' + JSON.stringify(mal));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const informar = (lista, vacio) => { if (!lista.length) { total++; console.log('✓ ' + vacio); return; } for (const t of lista) { total++; fallas++; console.log('✗ ' + t); } };

const V = await import(pathToFileURL(path.join(raiz, 'src/vegetacion.js')).href);
const TD = await import(pathToFileURL(path.join(raiz, 'src/texturas-datos.js')).href);
const MAT = await import(pathToFileURL(path.join(raiz, 'src/materiales.js')).href);

// ---------------------------------------------------------------- 1 a 3 y 7: el valle y el atlas, con la copia original
{
  const { mal, n } = await comprobarVegetacion(V, 'completo');
  total += n;
  if (mal.length) { for (const t of mal) { fallas++; console.log('✗ ' + t); } } else console.log('✓ el atlas, el sotobosque, los parches, las huellas y las sombras de la copia original cumplen todo');
}
{
  const { mal, n } = await comprobarManchas(TD);
  total += n;
  if (mal.length) { for (const t of mal) { fallas++; console.log('✗ ' + t); } } else console.log('✓ la textura de las manchas del prado: la capa vieja igual, más variedad de tono y de seco');
}

// ---------------------------------------------------------------- 4 a 6: los números de los shaders y de la nieve
const texto = { pasto: leer('src/pasto.js'), mat: leer('src/materiales.js'), imp: leer('src/impostores.js'), cielo: leer('src/cielo.js'), veg: leer('src/vegetacion.js'), datos: leer('src/texturas-datos.js') };
{
  const { mal, n } = comprobarTextos(texto);
  total += n;
  if (mal.length) { for (const t of mal) { fallas++; console.log('✗ ' + t); } } else console.log('✓ pasto (tres anchos, tres familias de verdes), suelo, estación de los árboles lejanos y nieve cumplen sus números');
}
ok(Math.abs(MAT.TIPO_HELECHO - 1.25) < 1e-9 && Math.abs(MAT.TIPO_COIRON - 1.4) < 1e-9 && !(MAT.TIPO_HELECHO > 0.9 && MAT.TIPO_HELECHO < 1.1) && !(MAT.TIPO_COIRON > 0.9 && MAT.TIPO_COIRON < 1.1), 'el helecho (1,25) y el coirón (1,4) quedan afuera del entibiado de los perennes (tipo 1)');
ok(!/[ñÑ]/.test(Object.keys(V).join(' ')), 'los nombres exportados de vegetacion.js no llevan ñ');

// ---------------------------------------------------------------- 8: las reglas del presupuesto
{
  let sh = 0, tex = 0, rt = 0;
  const recorrer = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorrer(p); else if (e.name.endsWith('.js') && !e.name.startsWith('ultra')) { const t = fs.readFileSync(p, 'utf8'); sh += (t.match(/new THREE\.(Raw)?ShaderMaterial\(/g) || []).length; tex += (t.match(/new THREE\.DataTexture\(/g) || []).length; rt += (t.match(/new THREE\.WebGLRenderTarget\(/g) || []).length; } } };
  recorrer(path.join(raiz, 'src'));
  ok(sh === 18, `programas de shader: ${sh} construcciones de ShaderMaterial en el código (18 como en la 4.23.0: ninguna nueva)`);
  ok(tex === 17 && rt === 3, `texturas de datos (${tex}, 17 como antes) y destinos de dibujo (${rt}, 3 como antes): ninguna nueva (el atlas de cartas es el mismo de 1024 × 1024)`);
  ok((texto.veg.match(/new THREE\.InstancedMesh\(/g) || []).length === 7, 'vegetacion.js arma 7 mallas instanciadas (las 6 de antes y la de las siluetas de la sombra por especie)');
  ok(/const CARTA_ANCHO = 1024, CARTA_ALTO = 1024, CARTA_CELDA = 256;/.test(texto.veg), 'el atlas de cartas sigue en 1024 × 1024 (las celdas nuevas son las libres 10 y 11)');
  const pt = leer('src/pasto.js'), mt = leer('src/materiales.js');
  ok((pt.match(/new THREE\.ShaderMaterial\(/g) || []).length === 2 && !/#if(def)? NUEVO|PASTO_NUEVO/.test(pt), 'pasto.js sigue con sus dos materiales: los cambios son cuentas dentro de los vertex shaders de siempre');
  void mt;
  const pas = fs.readFileSync(path.join(raiz, 'src/pasto.js'), 'utf8');
  ok(!/uniform float u(Familia|Clase)/.test(pas), 'sin uniformes nuevos en el pasto');
}

// ---------------------------------------------------------------- mutaciones de los textos de shaders y de cielo (copias en memoria: la comprobación es una función de los textos)
{
  const muta = (campo, de, a) => { const t = { ...texto }; if (t[campo].split(de).length !== 2) throw new Error('la mutación no encuentra su fragmento una sola vez: ' + de.slice(0, 60)); t[campo] = t[campo].replace(de, () => a); return t; };
  const M = [
    ['pasto', 'tres anchos pero casi iguales', '0.038 + 0.026 * step(0.34, claseHoja) + 0.034 * step(0.82, claseHoja)', '0.060 + 0.004 * step(0.34, claseHoja) + 0.004 * step(0.82, claseHoja)'],
    ['pasto', 'la hoja ancha es gigante', '0.038 + 0.026 * step(0.34, claseHoja) + 0.034 * step(0.82, claseHoja)', '0.038 + 0.026 * step(0.34, claseHoja) + 0.140 * step(0.82, claseHoja)'],
    ['pasto', 'casi todas las hojas son anchas', '0.038 + 0.026 * step(0.34, claseHoja) + 0.034 * step(0.82, claseHoja)', '0.038 + 0.026 * step(0.04, claseHoja) + 0.034 * step(0.12, claseHoja)'],
    ['pasto', 'la clase sale de la altura de la hoja', 'float claseHoja = fract(rh * 7.9 + aAzar * 3.1);', 'float claseHoja = fract(rh * 7.9 + aAzar * 3.1 * 0.0 + 0.5);'],
    ['pasto', 'vuelve el ancho continuo', 'ancho = anchoHoja * mix(1.0, 1.8, smoothstep(3.0, 18.0, d)) * (1.0 + (1.0 - desvanecer) * 1.5);', 'ancho = (0.046 + 0.036 * rh) * mix(1.0, 1.8, smoothstep(3.0, 18.0, d)) * (1.0 + (1.0 - desvanecer) * 1.5);\n          // ancho = (0.046 + 0.036 * rh)'],
    ['pasto', 'las tres familias son la misma', 'srgb(vec3(0.17, 0.43, 0.27)), srgb(vec3(0.31, 0.51, 0.19)), clamp(famV, 0.0, 1.0)), srgb(vec3(0.52, 0.57, 0.22))', 'srgb(vec3(0.30, 0.50, 0.20)), srgb(vec3(0.31, 0.51, 0.19)), clamp(famV, 0.0, 1.0)), srgb(vec3(0.32, 0.52, 0.20))'],
    ['pasto', 'una familia no es verde', 'srgb(vec3(0.52, 0.57, 0.22))', 'srgb(vec3(0.60, 0.22, 0.22))'],
    ['pasto', 'el otoño pesa 0,55 también', 'mix(0.55, 0.25, max(estepa, max(uOtono, uInvierno)))', 'mix(0.55, 0.55, max(estepa, max(uOtono, uInvierno)))'],
    ['pasto', 'el verano pesa como antes', 'mix(0.55, 0.25, max(estepa, max(uOtono, uInvierno)))', 'mix(0.25, 0.25, max(estepa, max(uOtono, uInvierno)))'],
    ['pasto', 'el azar de la familia ya no es el de la mata', 'float famV = fract(rnd * 7.7) * 2.0;', 'float famV = fract(rh * 7.7) * 2.0;'],
    ['pasto', 'el brillo del suelo no acompaña', '(manchas.z - 0.5) * 0.26;', '(manchas.z - 0.5) * 0.16;'],
    ['mat', 'el terreno ignora la variedad del tono', '(manchas.z - 0.5) * 0.3 * enPrado;', '(manchas.z - 0.5) * 0.14 * enPrado;'],
    ['datos', 'las capas nuevas se crean antes que las viejas', 'const seco = crearFbm(r, 11, 11, 3, 0.45), humedo = crearFbm(r, 14, 14, 3, 0.45), tono = crearFbm(r, 110, 110, 1, 0.5);', 'const tonoFino = crearFbm(r, 250, 250, 1, 0.5), secoFino = crearFbm(r, 70, 70, 2, 0.5); const seco = crearFbm(r, 11, 11, 3, 0.45), humedo = crearFbm(r, 14, 14, 3, 0.45), tono = crearFbm(r, 110, 110, 1, 0.5);'],
    ['mat', 'los perennes se entibian con otro azar en cerca', 'uOtono * 0.5 * fract(azar * 3.1)', 'uOtono * 0.5 * fract(azar * 4.7)'],
    ['imp', 'los perennes se entibian distinto en el cartel', 'uOtonoImp * 0.5 * fract(vAzarImp * 3.1)', 'uOtonoImp * 0.9 * fract(vAzarImp * 3.1)'],
    ['imp', 'el cartel entibia también a los caducos', 'if (tipoImp > 0.5 && tipoImp < 1.5) diffuseColor.rgb *= mix', 'if (tipoImp > 0.5 && tipoImp < 2.5) diffuseColor.rgb *= mix'],
    ['mat', 'el entibiado alcanza a los helechos', 'if (aTipo > 0.9 && aTipo < 1.1) vColor.rgb *= mix', 'if (aTipo > 0.9 && aTipo < 1.3) vColor.rgb *= mix'],
    ['mat', 'el entibiado vira a otro color', 'vec3(1.22, 1.05, 0.66), uOtono * 0.5', 'vec3(0.7, 1.05, 1.4), uOtono * 0.5'],
    ['veg', 'el tono de los árboles vuelve a ser parejo', 'tinte.setRGB(v * (0.92 + r() * 0.16), v, v * (0.88 + r() * 0.2))', 'tinte.setRGB(v * (0.95 + r() * 0.1), v, v * (0.92 + r() * 0.1))'],
    ['veg', 'el shader no recorta las celdas de nube', '(celdaM < 1.5 || celdaM > 9.5) ? 1.0 : 0.0', 'celdaM < 1.5 ? 1.0 : 0.0'],
    ['cielo', 'la nieve sin ambiente azul', 'hemi.color.lerp(AMBIENTE_NIEVE, 0.8 * nieve);', 'hemi.color.lerp(AMBIENTE_NIEVE, 0.0 * nieve);'],
    ['cielo', 'el ambiente de la nieve no es azul', "AMBIENTE_NIEVE = C('#86aaf0')", "AMBIENTE_NIEVE = C('#f0aa86')"],
    ['cielo', 'el ambiente de la nieve se aplica sin el día', 'Math.min(1, Math.max(0, U.uInvierno.value)) * dia', 'Math.min(1, Math.max(0, U.uInvierno.value))'],
  ];
  let atrapadas = 0; const vivas = [];
  for (const [campo, nombre, de, a] of M) {
    let mm;
    try { mm = comprobarTextos(muta(campo, de, a)).mal; } catch (e) { vivas.push(nombre + ' (' + e.message + ')'); continue; }
    if (mm.length) atrapadas++; else vivas.push(nombre);
  }
  ok(atrapadas === M.length, `mutaciones de los textos (shaders, nieve, tono de los árboles): ${atrapadas} de ${M.length} hacen fallar su comprobación${vivas.length ? ' · SOBREVIVEN: ' + vivas.join('; ') : ''}`);
}

// ---------------------------------------------------------------- mutaciones de vegetacion.js y texturas-datos.js (una copia con otro nombre por cada una; un proceso por copia)
{
  const dir = path.join(raiz, 'src');
  const copias = [];
  const correr = (archivo, que, de, a) => {
    const t = fs.readFileSync(path.join(dir, archivo), 'utf8');
    if (t.split(de).length !== 2) throw new Error(`la mutación no encuentra su fragmento una sola vez en ${archivo}: ${de.slice(0, 70)}`);
    const nombre = archivo.replace(/\.js$/, `.mut${copias.length}.js`), destino = path.join(dir, nombre);
    fs.writeFileSync(destino, t.replace(de, () => a)); copias.push(destino);
    const r = spawnSync(process.execPath, [path.join(raiz, 'pruebas/verificar-4-24-0-c.mjs'), '--hijo', destino, que], { encoding: 'utf8', timeout: 240000 });
    const linea = (r.stdout || '').split('\n').find((l) => l.startsWith('HIJO '));
    if (!linea) return ['(el proceso hijo no contestó: ' + (r.stderr || '').slice(0, 200) + ')'];
    return JSON.parse(linea.slice(5));
  };
  // la original pasa por el mismo camino (si no, una mutación «atrapada» podría ser un hijo roto)
  try {
    const f = (archivo, que) => { const nombre = archivo.replace(/\.js$/, `.orig.js`), destino = path.join(dir, nombre); fs.writeFileSync(destino, fs.readFileSync(path.join(dir, archivo), 'utf8')); copias.push(destino); const r = spawnSync(process.execPath, [path.join(raiz, 'pruebas/verificar-4-24-0-c.mjs'), '--hijo', destino, que], { encoding: 'utf8', timeout: 240000 }); const l = (r.stdout || '').split('\n').find((x) => x.startsWith('HIJO ')); return l ? JSON.parse(l.slice(5)) : ['sin respuesta']; };
    ok(f('vegetacion.js', 'completo').length === 0, 'la copia sin tocar de vegetacion.js (con otro nombre) pasa todo por el camino de los procesos hijos');
    ok(f('texturas-datos.js', 'manchas').length === 0, 'la copia sin tocar de texturas-datos.js pasa por el mismo camino');
    const M = [
      ['vegetacion.js', 'completo', 'queda todo el sotobosque (sin ralear)', 'export const SOTO_QUE_QUEDA = 0.72;', 'export const SOTO_QUE_QUEDA = 1.01;'],
      ['vegetacion.js', 'completo', 'queda un tercio del sotobosque', 'export const SOTO_QUE_QUEDA = 0.72;', 'export const SOTO_QUE_QUEDA = 0.33;'],
      ['vegetacion.js', 'completo', 'la planta que se saca no gasta sus números al azar (el azar del valle se corre)', '{ r(); r(); r(); continue; }', '{ continue; }'],
      ['vegetacion.js', 'completo', 'no hay especies nuevas', '        tipo = especieDeSoto(tipo, h3(x * 2.11 - 9.4, z * 1.73 + 3.6, 1.3));\n', ''],
      ['vegetacion.js', 'puro', 'el helecho da la otra fronda casi siempre', "helecho: [['helecho2', 0.36]]", "helecho: [['helecho2', 0.9]]"],
      ['vegetacion.js', 'puro', 'el maqui da otra especie', "maqui: [['zarza', 0.3]]", "maqui: [['michay', 0.3]]"],
      ['vegetacion.js', 'puro', 'el chilco también se ralea', '  nalca: [], colihue: [], coiron: [],\n', "  nalca: [], colihue: [], coiron: [], chilco: [],\n"],
      ['vegetacion.js', 'puro', 'el calafate también se ralea', '  nalca: [], colihue: [], coiron: [],\n', "  nalca: [], colihue: [], coiron: [], calafate: [],\n"],
      ['vegetacion.js', 'puro', 'la búsqueda por nombre cae en el prototipo', 'return Object.hasOwn(VARIANTES_SOTO, tipo);', "return tipo in VARIANTES_SOTO;"],
      ['vegetacion.js', 'puro', 'la copa lejana no usa la celda de nube', 'return celda === CELDAS_CARTA.densa ? CELDAS_COPA_LEJOS.densa : celda === CELDAS_CARTA.abierta ? CELDAS_COPA_LEJOS.abierta : celda;', 'return celda;'],
      ['vegetacion.js', 'puro', 'la copa abierta pinta la celda de la densa', 'celda === CELDAS_CARTA.abierta ? CELDAS_COPA_LEJOS.abierta : celda;', 'celda === CELDAS_CARTA.abierta ? CELDAS_COPA_LEJOS.densa : celda;'],
      ['vegetacion.js', 'puro', 'la copa lejana es más chica', 'return 90 + 13 * Math.abs(Math.sin(4.5 * ang + fase)) + 3 * Math.sin(7 * ang + 1.7 * fase);', 'return 60 + 13 * Math.abs(Math.sin(4.5 * ang + fase)) + 3 * Math.sin(7 * ang + 1.7 * fase);'],
      ['vegetacion.js', 'puro', 'el contorno es de lóbulos con puntas hacia adentro (sin el valor absoluto)', 'Math.abs(Math.sin(4.5 * ang + fase))', 'Math.sin(4.5 * ang + fase)'],
      ['vegetacion.js', 'puro', 'el borde de la copa es un corte duro (sin rampa)', 'const m = borde > 1.2 ? 1 : borde < -1.2 ? 0 : borde / 2.4 + 0.5;', 'const m = borde > 0 ? 1 : 0;'],
      ['vegetacion.js', 'puro', 'la copa no se recorta (el alfa siempre macizo)', 'D[i + 3] = m * 255;', 'D[i + 3] = 255;'],
      ['vegetacion.js', 'puro', 'las dos celdas de nube son la misma', 'export const CELDAS_COPA_LEJOS = { densa: 10, abierta: 11 };', 'export const CELDAS_COPA_LEJOS = { densa: 10, abierta: 10 };'],
      ['vegetacion.js', 'puro', 'una celda de antes se pisa', 'export const CELDAS_COPA_LEJOS = { densa: 10, abierta: 11 };', 'export const CELDAS_COPA_LEJOS = { densa: 10, abierta: 9 };'],
      ['vegetacion.js', 'completo', 'los parches también en lo que no es prado', 'if (perfil.pasto < 0.5 || perfil.bosque > 0.45 || perfil.estepa > 0.3) continue;', 'if (perfil.pasto < 0.0) continue;'],
      ['vegetacion.js', 'completo', 'los parches en la ladera', 'T.pendiente[k] > 0.14) continue;', 'T.pendiente[k] > 9) continue;'],
      ['vegetacion.js', 'completo', 'los parches se apartan demasiado del sendero (o el prado se llena hasta el borde del camino)', 'if (T.distSendero[k] < 1.4 || T.agua(x, z)', 'if (T.distSendero[k] < 9 || T.agua(x, z)'],
      ['vegetacion.js', 'completo', 'los parches gastan el azar del valle', 'giro, 0, rp);', 'giro);'],
      ['vegetacion.js', 'completo', 'el doble de parches', 'export const PARCHES_PRADO = 0.5;', 'export const PARCHES_PRADO = 0.9;'],
      ['vegetacion.js', 'completo', 'los parches no se despejan', 'matas.push({ x, z, tipo, ref, choque: null, decorativo: true, parche: true, esc: tam });', 'void 0;'],
      ['vegetacion.js', 'puro', 'el parche es alto', '0.03 + r() * 0.016, Math.sin(ang) * d]', '0.6 + r() * 0.016, Math.sin(ang) * d]'],
      ['vegetacion.js', 'puro', 'el parche es de tipo 0 (queda sobre la nieve)', 'export const TIPO_PARCHE = 3;', 'export const TIPO_PARCHE = 0;'],
      ['vegetacion.js', 'puro', 'los tonos del parche son blancos', "verde: ['#6fa63c', '#5f9a36', '#7ab045', '#548f33', '#86b84e', '#478a35'],", "verde: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],"],
      ['vegetacion.js', 'puro', 'el tinte del parche es enorme', 'parche0: [0.8, 0.36, 0.06]', 'parche0: [0.2, 2.5, 0.5]'],
      ['vegetacion.js', 'completo', 'las siluetas toman sólo la mitad del alcance', 'const alcance = (calidad.sombraArboles ?? 45) + MOVIDA_PARA_SOMBRA + 1;', 'const alcance = (calidad.sombraArboles ?? 45) * 0.4;'],
      ['vegetacion.js', 'completo', 'las siluetas sin tinte de relleno (un programa de sombras nuevo)', 'im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(total * 3).fill(1), 3);\n      im.count = 0;\n      im.frustumCulled = false;\n      im.castShadow = true;', 'im.count = 0;\n      im.frustumCulled = false;\n      im.castShadow = true;'],
      ['vegetacion.js', 'completo', 'las siluetas vuelven a la capa 0', 'im.layers.set(1);', ''],
      ['vegetacion.js', 'completo', 'la silueta de un árbol talado queda', "    sombraSucia = true;   // 4.24.0: la silueta de la sombra del árbol también se rehace\n", ''],
      ['vegetacion.js', 'completo', 'la malla de sombras se rehace en cada cuadro', 'Math.hypot(cam.x - sombraX, cam.z - sombraZ) > MOVIDA_PARA_SOMBRA) compactarSombras(cam);', 'Math.hypot(cam.x - sombraX, cam.z - sombraZ) > 0.5) compactarSombras(cam);'],
      ['vegetacion.js', 'completo', 'la malla de sombras no sigue a la cámara', 'Math.hypot(cam.x - sombraX, cam.z - sombraZ) > MOVIDA_PARA_SOMBRA) compactarSombras(cam);', 'Math.hypot(cam.x - sombraX, cam.z - sombraZ) > 1e9) compactarSombras(cam);'],
      ['vegetacion.js', 'completo', 'las especies sin árboles siguen en el repaso de dibujo', 'im.visible = n > 0;   // 4.24.0: una especie sin ningún árbol cerca', 'im.visible = true;   // 4.24.0: una especie sin ningún árbol cerca'],
      ['vegetacion.js', 'completo', 'las siluetas cuelgan de la raíz de la escena una por una', "sombrasGrupo.add(im);\n      sombras[nombre] = im;", "escena.add(im);\n      sombras[nombre] = im;"],
      ['vegetacion.js', 'completo', 'Baja arma siluetas aunque no haya sombras', '  if (calidad.sombras) {\n    escena.add(sombrasGrupo);', '  if (true) {\n    escena.add(sombrasGrupo);'],
      ['texturas-datos.js', 'manchas', 'el tono no suma la capa fina', 'sat(0.5 + (0.58 * tono(u, v) + 0.42 * tonoFino(u, v) - 0.5) * 1.7)', 'sat(0.5 + (tono(u, v) - 0.5) * 1.0)'],
      ['texturas-datos.js', 'manchas', 'el tono se estira de más', '- 0.5) * 1.7) * 255)', '- 0.5) * 3.4) * 255)'],
      ['texturas-datos.js', 'manchas', 'no hay manchas secas chicas', 'Math.max(suave(0.52, 0.72, seco(u, v)), 0.55 * suave(0.6, 0.78, secoFino(u, v)))', 'suave(0.52, 0.72, seco(u, v))'],
      ['texturas-datos.js', 'manchas', 'las manchas secas chicas son del tamaño de las grandes', '0.55 * suave(0.6, 0.78, secoFino(u, v))', '1.0 * suave(0.4, 0.6, secoFino(u, v))'],
      ['texturas-datos.js', 'manchas', 'el azar de las capas viejas se corre (una capa nueva se crea antes)', 'const seco = crearFbm(r, 11, 11, 3, 0.45), humedo', 'const tonoFino0 = crearFbm(r, 250, 250, 1, 0.5); const seco = crearFbm(r, 11, 11, 3, 0.45), humedo'],
      ['texturas-datos.js', 'manchas', 'el bajo húmedo cambia', 'suave(0.55, 0.74, humedo(u, v))', 'suave(0.45, 0.74, humedo(u, v))'],
    ];
    let atrapadas = 0; const vivas = [];
    for (const [archivo, que, nombre, de, a] of M) {
      const mm = correr(archivo, que, de, a);
      if (mm.length) atrapadas++; else vivas.push(nombre);
    }
    ok(atrapadas === M.length, `mutaciones de vegetacion.js y de la textura de las manchas (copias con otro nombre, un proceso por copia): ${atrapadas} de ${M.length} hacen fallar su comprobación${vivas.length ? ' · SOBREVIVEN: ' + vivas.join('; ') : ''}`);
  } finally { for (const c of copias) { try { fs.unlinkSync(c); } catch { /* ya no está */ } } }
}

console.log(`\n${fallas ? 'FALLA' : 'OK'} 4.24.0 (C): paisaje y vegetación · ${total} comprobaciones, ${fallas} fallas`);
process.exit(fallas ? 1 : 0);
void os;
