// 4.24.1 (C): lo que quedó del paisaje de la 4.24.0. Sólo geometría, color y atlas: 0 programas de shader nuevos, 0 capas de pantalla completa, 0 texturas nuevas.
//
// 1. Los dientes de las hojas del árbol de cerca: las celdas 0, 1 y 5 del atlas de cartas (las que usan las copas y las matas de cerca) pintan sus hojas con la punta y el pie
//    más romos y el borde en una rampa de alfa más ancha (2,4 téxeles en lugar de 1,4); el resto de las celdas (cortina del maitén, cipreses, pehuén, flores, helecho y las
//    dos copas de lejos) salen idénticas a las de la 4.24.0, y las hojas no engordan (la cobertura opaca se mueve menos de un 5 %). Además el alfa de esas tres celdas se suaviza
//    (1-2-1 a lo ancho y a lo alto): los dientes de a un téxel y los agujeros de a uno entre hojas se redondean sin mover el borde medio.
// 2. Los cipreses a media distancia (LOD medio, sin cartas): cada falda con más puntas (9 en lugar de 7), entrantes menos hondos y puntas que cuelgan menos, de modo que el borde
//    sale en onda y no en dientes de sierra; el ciprés de cerca (y por lo tanto su cartel lejano, que se hornea de él) no cambia.
// 3. La silueta de la sombra al caminar (se rehace cada 4 m): caminando 400 m en pasos de 2 m, todo árbol que cae dentro del alcance de la sombra YA está en la malla antes de
//    que la cámara llegue (ninguno aparece de golpe adentro del alcance) y, al rehacerse, no entra ni sale ninguno que estuviera dentro del alcance.
// 4. Las pisadas en la nieve (huellas.js y el material del terreno): el borde de cada pisada sube más rápido (el centro queda parejo) y el tinte es más marcado y más azul.
// 5. Las reglas del presupuesto: ninguna construcción de ShaderMaterial, textura de datos ni destino de dibujo nuevos.
// Cada mutación es una copia de vegetacion.js con otro nombre (sin la caché de ESM, un proceso por copia) y tiene que hacer fallar su comprobación.
//
// Uso: node pruebas/verificar-4-24-1-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
registrarThree();

// lo que da el atlas de la 4.24.0 (celda por celda) y lo que da ahora en las tres celdas que cambian
const CELDAS_4240 = ['7de7d3f9cdf6', 'bbc5b2dc993a', '69a80c13c66a', '3c9be461dae5', '8551bb6e7d49', '8894f0d59c7e', '67d809d0c1c9', 'a3ad45dcd747', '789ee74da997', '0226f7d4cad0', '162f79929afb', '4ca50a715cf0'];
const CELDAS_NUEVAS = { 0: '4038154774da', 1: '3d626c9238da', 5: 'b21f16cc3723' };
const COBERTURA_4240 = { 0: [23851, 3859], 1: [15592, 3013], 5: [26573, 1357] };   // [téxeles de alfa > 127, téxeles de alfa intermedio]
const CELDA_VACIA = 'e12763bce5f0';
const sha = (a) => createHash('sha256').update(Buffer.from(new Float32Array(a).buffer)).digest('hex').slice(0, 12);

// ================================================================ lo que cada copia (la original y las mutadas de vegetacion.js) tiene que cumplir: devuelve la lista de lo que falla
async function comprobar(V, nivel) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const THREE = await import('three');

  // ---------------------------------------------------------------- 1. el atlas: los dientes de las hojas de cerca
  {
    const D = V.texturaCartas().image.data;
    const celda = (c) => { const ox = (c % 4) * 256, oy = Math.floor(c / 4) * 256, h = createHash('sha256'); for (let y = 0; y < 256; y++) h.update(D.subarray(((oy + y) * 1024 + ox) * 4, ((oy + y) * 1024 + ox + 256) * 4)); return h.digest('hex').slice(0, 12); };
    const cob = (c) => { const ox = (c % 4) * 256, oy = Math.floor(c / 4) * 256; let o = 0, m = 0; for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const a = D[((oy + y) * 1024 + ox + x) * 4 + 3]; if (a > 127) o++; if (a > 10 && a < 245) m++; } return [o, m]; };
    const otras = [2, 3, 4, 6, 7, 8, 9, 10, 11];
    falla(otras.every((c) => celda(c) === CELDAS_4240[c]), 'las celdas que no cambian (cortina, escamas, cepillo, flores, helecho y las dos copas de lejos) salen idénticas a las de la 4.24.0');
    falla([12, 13, 14, 15].every((c) => celda(c) === CELDA_VACIA), 'las celdas 12 a 15 siguen vacías (el atlas es el mismo de 1024 × 1024)');
    for (const c of [0, 1, 5]) {
      falla(celda(c) !== CELDAS_4240[c] && celda(c) === CELDAS_NUEVAS[c], `celda ${c}: pintada con las hojas romas y la rampa ancha (${celda(c)})`);
      const [o, m] = cob(c), [o0, m0] = COBERTURA_4240[c];
      falla(Math.abs(o - o0) / o0 < 0.05, `celda ${c}: las hojas no engordan (cobertura opaca ${o} contra ${o0}: ${(100 * (o - o0) / o0).toFixed(1)} %)`);
      falla(m > m0 * 2, `celda ${c}: el borde de las hojas es una rampa más ancha (${m} téxeles de alfa intermedio contra ${m0})`);
    }
    falla(V.RAMPA_SUAVE > V.RAMPA_HOJA * 1.5 && V.RAMPA_HOJA === 1.4, `la rampa de las hojas suaves (${V.RAMPA_SUAVE} téxeles) es más ancha que la de siempre (${V.RAMPA_HOJA})`);
  }

  // ---------------------------------------------------------------- 2. los cipreses a media distancia
  {
    const a = V.pisoConifera(2, 4, 7, false), b = V.pisoConifera(2, 4, 9, true), c = V.pisoConifera(2, 4, 11, false);
    falla(sha(a.attributes.position.array) === '6903ec6b00a8' && sha(c.attributes.position.array) === 'df2533d42179', 'la falda sin `suave` (7 y 11 lados) es la de siempre: los demás pisos de coníferas no cambian');
    // el borde: radio y altura de las puntas y de los entrantes (el vértice del borde de cada cara de arriba)
    const borde = (g, lados) => {
      const p = g.attributes.position.array, pts = [];
      for (let i = 0; i < lados * 2; i++) { const o = i * 18 + 3; pts.push([Math.hypot(p[o], p[o + 2]), p[o + 1]]); }   // (el segundo vértice de la cara de arriba de cada triángulo)
      return pts;
    };
    const amp = (g, l) => { const pts = borde(g, l); const rs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); return { radial: (Math.max(...rs) - Math.min(...rs)) / Math.max(...rs), vertical: Math.max(...ys) - Math.min(...ys), puntas: l }; };
    const A = amp(a, 7), B = amp(b, 9);
    falla(B.puntas > A.puntas, `más puntas por falda (${B.puntas} contra ${A.puntas})`);
    falla(B.radial < A.radial * 0.7, `el entrante es menos hondo (${(100 * B.radial).toFixed(0)} % del radio contra ${(100 * A.radial).toFixed(0)} %)`);
    falla(B.vertical < A.vertical * 0.65, `las puntas cuelgan menos (${B.vertical.toFixed(2)} m de desnivel contra ${A.vertical.toFixed(2)} m)`);
    falla(V.PISO_SUAVE.entrante > 0.8 && V.PISO_SUAVE.entrante < 0.92 && V.PISO_SUAVE.cuelga <= 0.12 && V.PISO_SUAVE.sube <= 0.09, 'los números de la falda suave están en su rango');
    // el ciprés de cerca no se toca; el de media distancia sí (152 → 192 triángulos)
    const lejos = V.cipres(7, false), cerca = V.cipres(7, true);
    falla(lejos.geo.index.count / 3 === 192 && sha(lejos.geo.attributes.position.array) === 'f348180d4a33', `el ciprés a media distancia: ${lejos.geo.index.count / 3} triángulos (192: 40 más que antes por las puntas nuevas) y la forma con la falda suave`);
    falla(sha(V.pisoConifera(2, 4, 7).attributes.position.array) === '6903ec6b00a8', 'sin pedirla, la falda es la de siempre (la suave es sólo para los cipreses de media distancia)');
    falla(sha(cerca.geo.attributes.position.array) === '00109c89f60e' && cerca.geo.index.count / 3 === 1246, 'el ciprés de cerca (y su cartel lejano) sale igual que en la 4.24.0');
  }

  if (nivel === 'puro') return { mal, n };

  // ---------------------------------------------------------------- 3. la silueta de la sombra al caminar
  {
    const { generarTerreno } = await import('../src/terreno.js');
    const { CALIDADES } = await import('../src/config.js');
    const T = globalThis.__T4241 || (globalThis.__T4241 = generarTerreno());
    for (const q of ['media', 'alta']) {
      const escena = new THREE.Scene(), veg = V.generarVegetacion(T, CALIDADES[q], escena), calidad = CALIDADES[q];
      const sombras = veg.sombrasArboles();
      const nominal = (c) => { const m = {}; for (const a of veg.arboles) { if (a.sacado) continue; const ch = a.ref.ch; if (Math.max(0, Math.hypot(c.x - ch.x, c.z - ch.z) - 120 * 0.7) >= (calidad.sombraArboles ?? 45)) continue; m[a.ref.tipo] = (m[a.ref.tipo] || 0) + 1; } return m; };
      const tengo = () => Object.fromEntries(Object.entries(sombras).map(([nom, im]) => [nom, im.count]).filter(([, k]) => k > 0));
      const L = T.lugares.refugio;
      let faltan = 0, pasos = 0, rehechas = 0, sobran = 0;
      let v = Object.values(sombras)[0].instanceMatrix.version;
      const dir = [[1, 0], [0, 1], [-0.7, 0.7]];
      for (const [dx, dz] of dir) {
        veg.actualizar(new THREE.Vector3(L.x, 1.7, L.z));
        for (let m = 0; m <= 400; m += 2) {   // 400 m en pasos de 2 m (un cuarto de segundo corriendo)
          const cam = new THREE.Vector3(L.x + dx * m, 1.7, L.z + dz * m);
          if (Math.abs(cam.x) > 420 || Math.abs(cam.z) > 420) break;
          veg.actualizar(cam);
          const w = Object.values(sombras)[0].instanceMatrix.version; if (w !== v) { rehechas++; v = w; }
          const nom = nominal(cam), has = tengo();
          for (const k of Object.keys(nom)) if ((has[k] || 0) < nom[k]) faltan++;
          for (const k of Object.keys(has)) if (!(k in nom) && has[k] > 0) sobran++;
          pasos++;
        }
      }
      falla(pasos > 150, `${q}: se caminaron ${pasos} pasos`);
      falla(faltan === 0, `${q}: en ${pasos} pasos y ${rehechas} rehechas, ningún árbol de adentro del alcance de la sombra falta en la malla (${faltan} faltas)`);
      falla(rehechas > 30 && rehechas < pasos / 1.5, `${q}: la malla se rehace de a ratos (${rehechas} de ${pasos} pasos), no en cada cuadro`);
      void sobran;
    }
  }
  return { mal, n };
}

// ================================================================ modo hijo
if (process.argv[2] === '--hijo') {
  const M = await import(pathToFileURL(process.argv[3]).href);
  const { mal } = await comprobar(M, process.argv[4]);
  console.log('HIJO ' + JSON.stringify(mal));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const informar = (lista, vacio) => { if (!lista.length) { total++; console.log('✓ ' + vacio); return; } for (const t of lista) { total++; fallas++; console.log('✗ ' + t); } };

const V = await import(pathToFileURL(path.join(raiz, 'src/vegetacion.js')).href);
{
  const { mal, n } = await comprobar(V, 'completo');
  total += n - 0;
  if (mal.length) { for (const t of mal) { fallas++; console.log('✗ ' + t); } } else console.log(`✓ el atlas, los cipreses de media distancia y la silueta de la sombra al caminar cumplen sus ${n} comprobaciones`);
}
void informar;

// ---------------------------------------------------------------- 4. las pisadas en la nieve
async function comprobarHuellas(H) {
  const mal = [];
  const THREE = await import('three');
  void THREE;
  const h = H.crearHuellas();
  const d = h.tex.image.data;
  h.actualizar(0.016, { pos: { x: 0, z: 0 }, yaw: 0, enSuelo: true, nadando: false, agachado: false }, 1, 0);
  const RES = 256;
  let mx = 0, iu = 0, iv = 0, n = 0;
  for (let v = 0; v < RES; v++) for (let u = 0; u < RES; u++) { const val = d[(v * RES + u) * 4]; if (val > 0) n++; if (val > mx) { mx = val; iu = u; iv = v; } }
  // un téxel a cada lado del centro (la mitad del radio de 2 téxeles): con el cono liso valía la mitad; con el plateau, lo mismo que el centro
  const al = (du, dv) => d[((iv + dv) * RES + iu + du) * 4];
  const mitad = Math.max(al(1, 0), al(-1, 0));
  if (!(mx >= 230)) mal.push('el centro de la pisada llega a su valor pleno (' + mx + ')');
  if (!(mitad >= 220)) mal.push('a medio radio la pisada sigue en su valor pleno (' + mitad + ' contra ' + mx + '): el borde cae en la mitad de afuera');
  if (!(n >= 6 && n <= 14)) mal.push('la pisada marca entre 6 y 14 téxeles (' + n + '): no engorda');
  return mal;
}
{
  const H = await import(pathToFileURL(path.join(raiz, 'src/huellas.js')).href);
  const mal = await comprobarHuellas(H);
  total++; if (mal.length) { fallas++; for (const t of mal) console.log('✗ ' + t); } else console.log('✓ la pisada tiene el centro parejo y el borde marcado (plateau ' + H.HUELLA_PLATEAU + ')');
  const mt = leer('src/materiales.js');
  ok(mt.includes('col = mix(col, col * vec3(0.50, 0.58, 0.70), pisada * 0.9);'), 'el terreno tiñe la pisada más marcada y más azul (0,50 · 0,58 · 0,70 a 0,9)');
  // mutaciones de huellas.js (copias con otro nombre, en el mismo proceso: cada una es una URL distinta)
  const src = leer('src/huellas.js'), copias = [];
  const MH = [['el borde cae desde el centro como antes', 'export const HUELLA_PLATEAU = 2;', 'export const HUELLA_PLATEAU = 1;'], ['la pisada engorda', 'const r = Math.max(1, Math.round(2 * escala));', 'const r = Math.max(1, Math.round(4 * escala));'], ['la pisada sin plateau (se usa el cono)', 'Math.min(1, caida * HUELLA_PLATEAU)', 'caida'], ['el centro de la pisada no llega al valor pleno', '* 235 * fuerza);', '* 150 * fuerza);']];
  let atr = 0; const vivas = [];
  MH.forEach(([nombre, de, a], i) => {
    if (src.split(de).length !== 2) { vivas.push(nombre + ' (fragmento)'); return; }
    const arch = path.join(raiz, 'src', `huellas.mut${i}.js`); copias.push(arch); fs.writeFileSync(arch, src.replace(de, () => a));
    atr++; void atr;
  });
  let atrapadas = 0;
  for (let i = 0; i < copias.length; i++) {
    const Hm = await import(pathToFileURL(copias[i]).href);
    const mm = await comprobarHuellas(Hm);
    if (mm.length) atrapadas++; else vivas.push(MH[i][0]);
  }
  for (const c of copias) { try { fs.unlinkSync(c); } catch { /* ya no está */ } }
  ok(atrapadas === MH.length && vivas.length === 0, `mutaciones de huellas.js (copias con otro nombre): ${atrapadas} de ${MH.length} hacen fallar su comprobación${vivas.length ? ' · SOBREVIVEN: ' + vivas.join(' | ') : ''}`);
}

// ---------------------------------------------------------------- 5. presupuesto
{
  let sh = 0, tex = 0, rt = 0;
  const recorrer = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorrer(p); else if (e.name.endsWith('.js') && !/\.base41\.js$/.test(e.name) && !e.name.startsWith('ultra')) { const t = fs.readFileSync(p, 'utf8'); sh += (t.match(/new THREE\.(RawShaderMaterial|ShaderMaterial)\(/g) || []).length; tex += (t.match(/new THREE\.DataTexture\(/g) || []).length; rt += (t.match(/new THREE\.WebGLRenderTarget\(/g) || []).length; } } };
  recorrer(path.join(raiz, 'src'));
  ok(sh === 18, `programas de shader: ${sh} construcciones de ShaderMaterial (18 como en la 4.24.0)`);
  ok(tex === 17 && rt === 3, `texturas de datos (${tex}, 17 como antes) y destinos de dibujo (${rt}, 3 como antes)`);
  const t = leer('src/vegetacion.js');
  ok((t.match(/new THREE\.InstancedMesh\(/g) || []).length === 7, 'vegetacion.js arma 7 mallas instanciadas, como en la 4.24.0');
  ok(/const CARTA_ANCHO = 1024, CARTA_ALTO = 1024, CARTA_CELDA = 256;/.test(t), 'el atlas de cartas sigue en 1024 × 1024');
  ok(!/[ñÑ]/.test(Object.keys(V).join(' ')), 'los nombres exportados de vegetacion.js no llevan ñ');
}

// ---------------------------------------------------------------- mutaciones de vegetacion.js (una copia con otro nombre por cada una; un proceso por copia)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4241-'));
  const src = leer('src/vegetacion.js');
  // las copias viven dentro de src/ (sus importaciones son relativas) y se borran al terminar
  const M = [
    ['puro', 'los cipreses de media distancia sin la falda suave', "h, detalle ? 11 : 9, !detalle);", "h, detalle ? 11 : 9, false);"],
    ['puro', 'los cipreses de media distancia con siete puntas otra vez', "h, detalle ? 11 : 9, !detalle);", "h, detalle ? 11 : 7, !detalle);"],
    ['puro', 'el entrante de la falda suave igual de hondo que antes', "entrante: 0.84,", "entrante: 0.72,"],
    ['puro', 'las puntas de la falda suave cuelgan como antes', "cuelga: 0.11,", "cuelga: 0.16,"],
    ['puro', 'la falda suave pasa a todas las coníferas', "function pisoConifera(radio, h, lados, suave = false) {", "function pisoConifera(radio, h, lados, suave = true) {"],
    ['puro', 'la rampa suave igual de angosta que la de siempre', "export const RAMPA_SUAVE = 2.4;", "export const RAMPA_SUAVE = 1.4;"],
    ['puro', 'la rampa suave tan ancha que las hojas engordan', "export const RAMPA_SUAVE = 2.4;", "export const RAMPA_SUAVE = 4.4;"],
    ['puro', 'las hojas ovales con la punta fina de antes', "ovalSuave: tablaHoja((t) => Math.pow(Math.sin(Math.PI * t), 0.6)),", "ovalSuave: tablaHoja((t) => Math.pow(Math.sin(Math.PI * t), 0.75)),"],
    ['puro', 'las hojas redondas con el borde de antes', "redondaSuave: tablaHoja((t) => Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.5) * (0.92 + 0.08 * Math.cos(t * 38))),", "redondaSuave: tablaHoja((t) => Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.55) * (0.9 + 0.1 * Math.cos(t * 38))),"],
    ['puro', 'la celda 0 con las hojas de antes', "relleno(0, 70, 128, 128, 86, 84, 128, 60, [20, 27, 5, 6.5], [0.38, 0.55], 'ovalSuave');", "relleno(0, 70, 128, 128, 86, 84, 128, 60, [20, 27, 5, 6.5], [0.38, 0.55], 'oval');"],
    ['puro', 'la celda 1 con las hojas de antes', "ramillete(1, 128, 40, 8, 2.5, [104, 158], [14, 19, 6.5, 8], 11, 'redondaSuave', [0.52, 0.95]);", "ramillete(1, 128, 40, 8, 2.5, [104, 158], [14, 19, 6.5, 8], 11, 'redonda', [0.52, 0.95]);"],
    ['puro', 'la celda 5 con las hojas de antes', "relleno(5, 44, 128, 136, 78, 70, 128, 150, [27, 34, 11, 13.5], [0.45, 0.72], 'ovalSuave');", "relleno(5, 44, 128, 136, 78, 70, 128, 150, [27, 34, 11, 13.5], [0.45, 0.72], 'oval');"],
    ['puro', 'el alfa de las celdas no se suaviza', 'for (const celda of CELDAS_ALFA_SUAVE) suavizarAlfa(D, celda);', ''],
    ['puro', 'el alfa suavizado también en la cortina del maitén', 'export const CELDAS_ALFA_SUAVE = [0, 1, 5];', 'export const CELDAS_ALFA_SUAVE = [0, 1, 2, 5];'],
    ['puro', 'la cortina del maitén (celda 2) también cambia', "relleno(2, 34, 128, 50, 100, 30, 128, 20, [20, 26, 7, 9], [0.34, 0.76], 'oval');", "relleno(2, 34, 128, 50, 100, 30, 128, 20, [20, 26, 7, 9], [0.34, 0.76], 'ovalSuave');"],
    ['puro', 'las copas de lejos cambian de hoja', "copa(CELDAS_COPA_LEJOS.densa, 'oval', [18, 25, 5, 6.5], 0.7);", "copa(CELDAS_COPA_LEJOS.densa, 'ovalSuave', [18, 25, 5, 6.5], 0.7);"],
    ['completo', 'la malla de sombras se rehace cada 12 m y deja árboles afuera', "export const PISO_SUAVE", "export const PISO_SUAVE"],
  ];
  // (la última se arma aparte: cambia el paso de la silueta de la sombra)
  M[M.length - 1] = ['completo', 'la silueta de la sombra con un margen de 1 m (se rehace cada 4): aparecen árboles de golpe', 'const alcance = (calidad.sombraArboles ?? 45) + MOVIDA_PARA_SOMBRA + 1;', 'const alcance = (calidad.sombraArboles ?? 45) + 1;'];
  M.push(['completo', 'la silueta de la sombra recortada 3 m: aparecen árboles de golpe', 'const alcance = (calidad.sombraArboles ?? 45) + MOVIDA_PARA_SOMBRA + 1;', 'const alcance = (calidad.sombraArboles ?? 45) - 3;']);
  const copias = [];
  const correr = (archivo, que) => {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', archivo, que], { encoding: 'utf8', timeout: 600000 });
    const l = (r.stdout || '').split('\n').find((x) => x.startsWith('HIJO '));
    return l ? JSON.parse(l.slice(5)) : ['(el hijo no contestó) ' + (r.stderr || '').slice(0, 200)];
  };
  // la original pasa por el mismo camino (si no, una mutación «atrapada» podría ser un hijo roto)
  const origen = path.join(raiz, 'src', 'vegetacion.mut-original.js');
  copias.push(origen); fs.writeFileSync(origen, src);
  const base = { puro: correr(origen, 'puro'), completo: correr(origen, 'completo') };
  ok(base.puro.length === 0 && base.completo.length === 0, 'la copia sin tocar pasa por el mismo camino y cumple todo' + (base.puro.length + base.completo.length ? ' · ' + JSON.stringify([...base.puro, ...base.completo]) : ''));
  let atrapadas = 0; const vivas = [];
  M.forEach(([que, nombre, de, a], i) => {
    if (src.split(de).length !== 2) { vivas.push(nombre + ' (el fragmento no está una sola vez)'); return; }
    const arch = path.join(raiz, 'src', `vegetacion.mut${i}.js`);
    copias.push(arch); fs.writeFileSync(arch, src.replace(de, () => a));
    const mm = correr(arch, que);
    if (mm.length > 0) atrapadas++; else vivas.push(nombre);
  });
  for (const c of copias) { try { fs.unlinkSync(c); } catch { /* ya no está */ } }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* sin carpeta */ }
  ok(atrapadas === M.length, `mutaciones de vegetacion.js (copias con otro nombre, un proceso por copia): ${atrapadas} de ${M.length} hacen fallar su comprobación${vivas.length ? ' · SOBREVIVEN: ' + vivas.join(' | ') : ''}`);
}

console.log(`\n${total - fallas}/${total} comprobaciones en verde`);
process.exit(fallas ? 1 : 0);
