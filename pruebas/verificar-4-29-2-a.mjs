// 4.29.2 (A): lo que quedó afuera de Ultra, suelo y cascada (src/ultra-suelo.js, src/ultra-cascada.js y sus enganches).
// Comprueba, con el código de verdad (three del juego en Node):
//   1. el suelo de Ultra (el parche de ultra-bosque.js sobre materialTerreno) lleva el grano de cerca y las piedras de cerca rotas; el pasto y las flores siguen el mismo desvío; todos los anclajes se encuentran (ningún
//      aviso) y con Ultra apagado el texto del programa del suelo y del pasto es el de siempre;
//   2. las reglas del borde: el corte de los pisos sólo se corre hacia afuera (max), en el pasto y en las flores, y sólo cerca; el grano se apaga con la distancia (≤ 8 m) y con el tamaño del píxel;
//   3. (el relieve del ripio de la aldea quedó afuera por costo: ver CAMBIOS_4_29_2_A.md; la inyección del ripio no se toca)
//   4. la cascada: con Ultra apagado no se arma nada; al prenderlo la cortina y la poza tienen su material de Ultra (clave propia), la
//      neblina y el rocío usan el material de la bruma de siempre (ningún programa más) y las gotas cuadradas se esconden; al apagarlo todo
//      vuelve exactamente como estaba;
//   5. el enganche de main.js (con la calidad que corre).
// Mutaciones: copias de ultra-suelo.js y ultra-cascada.js con un cambio cada una, un proceso por copia (ESM en caché): todas tienen que fallar.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8').replace(/\r\n/g, '\n');
const NL = String.fromCharCode(10);
registrarThree();

const programaFalso = () => ({
  uniforms: {},
  vertexShader: ['#include <common>', 'void main() {', '#include <color_vertex>', '#include <begin_vertex>', '#include <project_vertex>', '}'].join(NL),
  fragmentShader: ['#include <common>', '#include <fog_pars_fragment>', 'void main() {', '#include <color_fragment>', '#include <normal_fragment_maps>', '#include <opaque_fragment>', '#include <fog_fragment>', '}'].join(NL),
});
const compilar = (m) => { const sh = programaFalso(); m.onBeforeCompile(sh, null); return sh; };
const compilarShader = (m) => { const sh = { uniforms: m.uniforms, vertexShader: m.vertexShader, fragmentShader: m.fragmentShader }; m.onBeforeCompile(sh, null); return sh; };

// el texto de un template literal de un archivo (`const NOMBRE = /* glsl */\`...\`;`)
function plantilla(texto, nombre) {
  const i = texto.indexOf('const ' + nombre + ' = ');
  if (i < 0) return null;
  const a = texto.indexOf('`', i), b = texto.indexOf('`', a + 1);
  return texto.slice(a + 1, b);
}

async function comprobar(archivoSuelo, archivoCascada, integrado) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const avisos = [];
  const warnOrig = console.warn;
  console.warn = (...a) => { avisos.push(a.join(' ')); };
  try {
    const THREE = await import('three');
    const S = await import(pathToFileURL(archivoSuelo).href);
    const C = await import(pathToFileURL(archivoCascada).href);

    // ---- 1 y 2: el suelo, el pasto y las flores (sobre los anclajes de verdad)
    const mats = leer('src/materiales.js'), bosque = leer('src/ultra-bosque.js'), pastoTx = leer('src/pasto.js');
    const anclas = ['vec4 m = texture2D(uMascara, uvTerreno(vPosMundo.xz));', 'vec4 est = texture2D(uEstepa, uvTerreno(vPosMundo.xz));'];
    falla(anclas.every((a) => mats.includes(a)), 'materialTerreno lee la máscara y los pisos como espera ultra-suelo.js');
    falla(bosque.includes('// el borde de los pisos (donde marcarPisos corta el pasto): tierra pisoteada y pasto corto, sin línea recta')
      && bosque.includes('float piedra = smoothstep(0.7, 0.86, g2) * tierraU * fino2;'), 'el parche del suelo de la 4.28.0 tiene las marcas donde entra el grano de cerca');
    falla(pastoTx.includes('vec4 m = texture2D(uMascara, uv);') && pastoTx.includes('vec4 estT = texture2D(uEstepa, uv);') && pastoTx.includes('vec4 est = texture2D(uEstepa, uv);'), 'el pasto y las flores leen la máscara como espera ultra-suelo.js');
    // un suelo sintético con las mismas anclas (para las copias mutadas) y, si `integrado`, el de verdad por ultra-bosque.js
    const sintetico = ['#include <common>', 'void main() {', '{', anclas[0], anclas[1], 'float dGU = 1.0;', 'if (true) { float piedra = smoothstep(0.7, 0.86, g2) * tierraU * fino2; }',
      '// el borde de los pisos (donde marcarPisos corta el pasto): tierra pisoteada y pasto corto, sin línea recta', '}', '}'].join(NL);
    const f = S.parcheSueloUltra(sintetico);
    const iG = f.indexOf('cercaFU'), iB = f.indexOf('// el borde de los pisos (donde marcarPisos');
    falla(iG > 0 && iG < iB, 'el suelo: el grano de cerca entra antes del borde pisoteado');
    falla(S.GRANO_CERCA.hasta <= 8 && S.GRANO_CERCA.desde < S.GRANO_CERCA.hasta && f.includes(`smoothstep(${S.GRANO_CERCA.desde.toFixed(1)}, ${S.GRANO_CERCA.hasta.toFixed(1)}, dGU)`), 'el suelo: el grano de cerca se apaga antes de los 8 m');
    falla(f.includes('float pieFU = length(fwidth(vPosMundo.xz));') && /nitidoFU = \(1\.0 - smoothstep\(0\.0\d+, 0\.0\d+, pieFU\)\)/.test(f), 'el suelo: el grano se apaga con el tamaño del píxel (no titila)');
    falla(f.includes('granoUB +='), 'el suelo: el grano de cerca suma al relieve');
    falla(f.includes('piedra *= mix(1.0,') && f.includes('smoothstep(4.0, 9.0, dGU)'), 'el suelo: las piedras de la 4.28.0 se rompen en grava sólo de cerca');
    falla(S.BORDE_ULTRA.grande + S.BORDE_ULTRA.chico <= 3.0 && S.BORDE_ULTRA.grande >= 1.0, 'el desvío del borde: del orden del téxel de la máscara (2 m), no más');
    const vM = S.parchePastoBordeU(['uniform sampler2D uMascara;', 'void main() {', 'vec2 b = vec2(0.0); vec2 uv = uvTerreno(b);', 'vec4 m = texture2D(uMascara, uv);', 'vec4 estT = texture2D(uEstepa, uv);', '}'].join(NL));
    falla(vM.includes('vec4 m = texture2D(uMascara, uv);') && vM.includes('if (estT.b > 0.002 && dCamBU < 25.0) estT.b = max(estT.b, texture2D(uEstepa, uvTerreno(b + desvioBordeU(b, dCamBU)')
      && vM.indexOf('vec2 desvioBordeU') < vM.indexOf('void main() {'), 'el pasto: el corte de los pisos con el mismo desvío que el suelo (max: sólo hacia afuera), sólo cerca de un piso');
    const vA = S.parcheAnilloBordeU(['void main() {', 'vec4 est = texture2D(uEstepa, uv);', '}'].join(NL));
    falla(vA.includes('if (est.b > 0.002 && dCamBU < 25.0) est.b = max(est.b, texture2D(uEstepa, uvTerreno(b + desvioBordeU(b, dCamBU)'), 'las flores y los helechos: los pisos corridos sólo hacia afuera');
    // el desvío: el mismo en el suelo y en el pasto (las matas siguen al suelo)
    falla(S.GLSL_DESVIO_BORDE_U && vM.includes(S.GLSL_DESVIO_BORDE_U) && vA.includes(S.GLSL_DESVIO_BORDE_U) && !f.includes('desvioBordeU') && f.includes(anclas[0]), 'el desvío es el mismo en el pasto y las flores; el suelo lee su máscara como siempre (el desvío del color quedó afuera por costo)');

    falla(!leer('src/ultra-materiales.js').includes('ultra-suelo'), 'el ripio de la aldea, como en la 4.29.1 (su relieve quedó afuera)');

    // ---- 1 (integrado): el suelo y el pasto de verdad, por ultra-bosque.js
    if (integrado) {
      const MAT = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
      const UB = await import(pathToFileURL(path.join(src, 'ultra-bosque.js')).href);
      const P = await import(pathToFileURL(path.join(src, 'pasto.js')).href);
      const { CALIDADES } = await import(pathToFileURL(path.join(src, 'config.js')).href);
      const suelo = MAT.materialTerreno();
      const antes = compilar(suelo).fragmentShader;
      falla(!antes.includes('cercaFU'), 'Ultra apagado: el suelo sin nada de la 4.29.2');
      UB.parcharUltra(suelo, UB.parcheTerreno);
      const con = compilar(suelo).fragmentShader;
      falla(con.includes('cercaFU') && con.includes('piedra *= mix(1.0,'), 'Ultra: el suelo de verdad con el grano de cerca y las piedras rotas');
      UB.quitarUltra(suelo);
      falla(compilar(suelo).fragmentShader === antes, 'al apagar Ultra el suelo vuelve a su texto de siempre');
      const pasto = P.crearPasto(CALIDADES.alta);
      const mp = pasto.malla.material, vAntes = compilarShader(mp).vertexShader;
      const anillos = pasto.malla.children.map((c) => c.material), aAntes = anillos.map((m) => compilarShader(m).vertexShader);
      pasto.ponerUltra(true, { parchar: UB.parcharUltra, parchePasto: UB.parchePasto, parcheAnillo: UB.parcheAnillo });
      falla(compilarShader(mp).vertexShader.includes('desvioBordeU(b, dCamBU)') && anillos.every((m) => compilarShader(m).vertexShader.includes('desvioBordeU(b, dCamBU)')), 'Ultra: el pasto, las flores y los helechos con el desvío');
      pasto.ponerUltra(false, { quitar: UB.quitarUltra });
      falla(compilarShader(mp).vertexShader === vAntes && anillos.every((m, i) => compilarShader(m).vertexShader === aAntes[i]), 'al apagar Ultra el pasto vuelve a su texto de siempre');
      falla(!avisos.some((a) => a.includes('ultra-suelo') || a.includes('ultra-bosque')), 'todos los anclajes encontrados (ningún aviso): ' + avisos.filter((a) => a.includes('ultra-')).join(' | '));
    }

    // ---- 4: la cascada
    const AG = await import(pathToFileURL(path.join(src, 'agua.js')).href);
    const MAT = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
    const T = { saltoAgua: { x: 0, z: 0, ang: 0.4, ancho: 2.4, arriba: 9, abajo: 3, i: 5 }, altura: () => 3 };
    const escena = new THREE.Scene();
    const cas = AG.crearCascada(T, escena, MAT.U);
    const P = cas.partes;
    falla(!!P && P.cortina && P.espuma && P.matNube && P.gotas && P.grupo, 'la cascada deja ver sus partes (sólo referencias)');
    const foto = () => ({ cortina: P.cortina.material, espuma: P.espuma.material, escala: P.espuma.scale.x, gotas: P.gotas.visible, hijos: P.grupo.children.length, hijosLista: P.grupo.children.slice() });
    const f0 = foto();
    const uc = C.crearUltraCascada(cas, {});
    for (let i = 0; i < 3; i++) uc.actualizar(false, 0.016, 0.5);
    const f1 = foto();
    falla(f1.cortina === f0.cortina && f1.espuma === f0.espuma && f1.escala === f0.escala && f1.gotas === f0.gotas && f1.hijos === f0.hijos && !uc.activo && uc.stats.armados === 0, 'Ultra apagado: la cascada no se toca');
    cas.actualizar(0.016, { x: 5, z: 5 });
    uc.actualizar(true, 0.016, 0.5);
    for (let i = 0; i < 5; i++) uc.actualizar(true, 0.05, 0.5);
    const mc = P.cortina.material, me = P.espuma.material;
    falla(mc !== f0.cortina && mc.isShaderMaterial && mc.fragmentShader === C.FRAG_CORTINA_ULTRA && mc.customProgramCacheKey() === C.CLAVE_CASCADA_ULTRA + '-cortina', 'Ultra: la cortina con su material y su clave propia');
    falla(me !== f0.espuma && me.fragmentShader === C.FRAG_ESPUMA_ULTRA && me.customProgramCacheKey() === C.CLAVE_CASCADA_ULTRA + '-espuma' && me.uniforms.uOp === f0.espuma.uniforms.uOp, 'Ultra: la poza con su material y su clave propia (la misma opacidad que mueve la cascada)');
    falla(mc.uniforms.uTiempo === f0.cortina.uniforms.uTiempo && mc.vertexShader === f0.cortina.vertexShader, 'Ultra: la cortina comparte el tiempo y el vértice de siempre');
    const nuevos = P.grupo.children.filter((o) => !f0.hijosLista.includes(o));
    falla(nuevos.length === 2 && nuevos.every((o) => o.isPoints && o.material === P.matNube), 'Ultra: la neblina y el rocío con el material de la bruma de siempre (ningún programa más)');
    falla(nuevos.some((o) => o.geometry.attributes.position.count === C.CASCADA_ULTRA.neblina) && nuevos.some((o) => o.geometry.attributes.position.count === C.CASCADA_ULTRA.rocio), 'Ultra: las cantidades de la neblina y el rocío');
    const neb = nuevos.find((o) => o.geometry.attributes.position.count === C.CASCADA_ULTRA.neblina);
    const ys = []; for (let i = 0; i < C.CASCADA_ULTRA.neblina; i++) ys.push(neb.geometry.attributes.position.array[i * 3 + 1]);
    falla(Math.max(...ys) > T.saltoAgua.abajo + 1 && Math.max(...ys) < T.saltoAgua.abajo + 8 && Math.min(...ys) >= T.saltoAgua.abajo, 'Ultra: la neblina sube desde el pie hasta unos metros (no se va al cielo)');
    falla(!P.gotas.visible && P.espuma.scale.x === C.CASCADA_ULTRA.pozaAncha && uc.activo && uc.stats.armados === 1, 'Ultra: las gotas cuadradas escondidas y la poza más ancha');
    uc.actualizar(false, 0.016, 0.5);
    const f2 = foto();
    falla(f2.cortina === f0.cortina && f2.espuma === f0.espuma && f2.escala === f0.escala && f2.gotas === f0.gotas && f2.hijos === f0.hijos && f2.hijosLista.every((o, i) => o === f0.hijosLista[i]) && !uc.activo && uc.stats.desarmados === 1,
      'al apagar Ultra la cascada vuelve exactamente como estaba');
    uc.actualizar(true, 0.016, 0.5); uc.apagar();
    falla(foto().cortina === f0.cortina && P.grupo.children.length === f0.hijos, 'apagar() también la deja como estaba');
    // los textos de los programas: lo nuevo de la cascada de Ultra no está en el de Alta
    falla(!f0.cortina.fragmentShader.includes('chispa') && C.FRAG_CORTINA_ULTRA.includes('chispa') && C.FRAG_CORTINA_ULTRA.includes('gl_FragColor'), 'la cortina de Alta sin tocar');

    // ---- 5: el enganche de main.js
    const main = leer('src/main.js');
    falla(main.includes("ultraCascada = crearUltraCascada(cascada, { renderer, camara, escena });"), 'main.js arma la cascada de Ultra con la cascada');
    falla(main.includes("ultraCascada?.actualizar(esUltra(ajustes) && calidadActiva === 'alta', dt, U.uViento.value)"), 'main.js: la cascada de Ultra con la calidad que corre');
    falla(main.indexOf('if (cascada) cascada.actualizar(dt, cam);') < main.indexOf('ultraCascada?.actualizar('), 'main.js: después de mover la cascada de siempre');
  } catch (e) {
    mal.push('excepción: ' + (e && e.stack || e));
  } finally {
    console.warn = warnOrig;
  }
  return { n, mal };
}

// ================================================================ mutaciones
const MUTACIONES = [
  ['suelo', 'el pasto: los pisos sin el max', 'dCamBU < 25.0) estT.b = max(estT.b, texture2D(', 'dCamBU < 25.0) estT.b = (texture2D('],
  ['suelo', 'el grano de cerca llega a 30 m', 'export const GRANO_CERCA = { desde: 3.0, hasta: 5.0 };', 'export const GRANO_CERCA = { desde: 3.0, hasta: 30.0 };'],
  ['suelo', 'el grano sin mirar el tamaño del píxel', 'float pieFU = length(fwidth(vPosMundo.xz));', 'float pieFU = 0.0;'],
  ['suelo', 'el desvío de 6 m', 'export const BORDE_ULTRA = { grande: 2.2, chico: 0.7, flecos: 0.35 };', 'export const BORDE_ULTRA = { grande: 6.0, chico: 0.7, flecos: 0.35 };'],
  ['suelo', 'las piedras rotas también de lejos', '(1.0 - smoothstep(4.0, 9.0, dGU)) * fino3);', '1.0);'],
  ['cascada', 'al apagar no vuelven las gotas', '    P.gotas.visible = p.gotasAntes;\n', ''],
  ['cascada', 'al apagar quedan la neblina y el rocío', 'for (const m of [p.neblina, p.rocio]) { P.grupo.remove(m); m.geometry.dispose(); }', 'for (const m of [p.neblina, p.rocio]) { m.geometry.dispose(); }'],
  ['cascada', 'la cortina sin clave propia', "matCortina.customProgramCacheKey = () => CLAVE_CASCADA_ULTRA + '-cortina';", ''],
  ['cascada', 'la neblina con un material nuevo (un programa más)', 'const m = new THREE.Points(g, P.matNube);', 'const m = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.2 }));'],
  ['cascada', 'se arma con Ultra apagado', 'if (pedido && !partes) armar();', 'if (!partes) armar();'],
  ['cascada', 'la neblina se va al cielo', "a[i * 3 + 1] = s.abajo + 0.2 + v * (3.0 + hashCU(i + 41) * 4.0);", "a[i * 3 + 1] = s.abajo + 0.2 + v * (30.0 + hashCU(i + 41) * 4.0);"],
  ['cascada', 'la poza no vuelve a su tamaño', '    P.espuma.scale.setScalar(p.escalaAntes);\n', ''],
];

const archS = path.join(src, 'ultra-suelo.js'), archC = path.join(src, 'ultra-cascada.js');
if (process.argv[2] === '--uno') {
  const r = await comprobar(process.argv[3], process.argv[4], false);
  console.log(JSON.stringify(r));
  process.exit(0);
}
const r = await comprobar(archS, archC, true);
if (r.mal.length) { console.error('verificar-4-29-2-a: FALLA' + NL + r.mal.map((m) => '  · ' + m).join(NL)); process.exit(1); }
let atrapadas = 0;
const fallidas = [];
MUTACIONES.forEach(([que, nombre, de, a], i) => {
  const orig = que === 'suelo' ? archS : archC;
  const texto = fs.readFileSync(orig, 'utf8').replace(/\r\n/g, '\n');
  if (!texto.includes(de)) { fallidas.push(nombre + ' (no encontré el texto a mutar)'); return; }
  const copia = path.join(src, `_mut-4292a-${i}-${path.basename(orig)}`);
  fs.writeFileSync(copia, texto.replace(de, a));
  try {
    const p = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--uno', que === 'suelo' ? copia : archS, que === 'cascada' ? copia : archC], { encoding: 'utf8' });
    let res = null;
    try { res = JSON.parse(p.stdout.trim().split(NL).pop()); } catch { res = null; }
    if (res && res.mal.length) atrapadas++; else fallidas.push(nombre);
  } finally { fs.rmSync(copia, { force: true }); }
});
if (fallidas.length) { console.error('verificar-4-29-2-a: mutaciones que pasaron: ' + fallidas.join(' | ')); process.exit(1); }
console.log(`verificar-4-29-2-a: ${r.n} comprobaciones del suelo, el borde, el ripio y la cascada de Ultra · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
