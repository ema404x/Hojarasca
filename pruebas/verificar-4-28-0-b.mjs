// 4.28.0 (B): el bosque y el pasto del nivel Ultra (src/ultra-bosque.js, el pasto denso de pasto.js y el registro de materiales.js).
// Comprueba, con el código de verdad (three del juego en Node):
//   1. con Ultra apagado (ajuste en falso, calidad que no es Alta, o Alta elegida pero Media corriendo) no se toca ningún material, no
//      se arma la malla densa ni la textura del pisado: el texto de los programas, sus claves y los uniformes son los de siempre;
//   2. con Ultra prendido cada material anotado queda con su parche (todos los anclajes encontrados), con la clave de siempre + la de
//      Ultra, y el pasto con su malla densa (el doble de matas a menos de 20 m, el mismo material);
//   3. al apagarlo (también cuando la calidad baja de Alta) todo vuelve a ser exactamente lo de antes;
//   4. el pasto aplastado: se marca donde pisás, se corre con el centro sin perder lo marcado y se recupera solo;
//   5. el enganche de main.js (con la calidad que corre).
// Mutaciones: copias de ultra-bosque.js y pasto.js con un cambio cada una, un proceso por copia (ESM en caché): todas tienen que fallar.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8').replace(/\r\n/g, '\n');
registrarThree();

// un programa de mentira con los lugares de three donde enganchan los materiales
const programaFalso = () => ({
  uniforms: {},
  vertexShader: '#include <common>\nvoid main() {\n#include <color_vertex>\n#include <begin_vertex>\n#include <project_vertex>\n}',
  fragmentShader: '#include <common>\n#include <fog_pars_fragment>\nvoid main() {\n#include <color_fragment>\n#include <normal_fragment_maps>\n#include <opaque_fragment>\n#include <fog_fragment>\n}',
});
const compilar = (m) => { const sh = programaFalso(); m.onBeforeCompile(sh, null); return sh; };
const compilarShader = (m) => { const sh = { uniforms: m.uniforms, vertexShader: m.vertexShader, fragmentShader: m.fragmentShader }; m.onBeforeCompile(sh, null); return sh; };

// ================================================================ las comprobaciones (para la copia original y las mutadas)
async function comprobar(archivoUltra, archivoPasto) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  // (junta, pasada final) el viento y el pasto pisado se tienen que ver en una captura de cerca: ráfaga más fuerte, huella de 60 cm y aplastado hondo
  { const tx = fs.readFileSync(archivoUltra, 'utf8');
    falla(tx.includes('const r = 0.6 / tam;') && tx.includes('pisadoUB * 0.8;') && tx.includes('olaUB * 1.8)') && tx.includes('* 0.42 * smoothstep(0.3, 1.0, t)'), 'junta: la ráfaga y el pasto pisado se ven de cerca (huella de 60 cm, aplastado hondo, ola 1,8)'); }
  const avisos = [];
  const warnOrig = console.warn;
  console.warn = (...a) => { avisos.push(a.join(' ')); };
  try {
    const THREE = await import('three');
    const MAT = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
    const UBm = await import(pathToFileURL(archivoUltra).href);
    const P = await import(pathToFileURL(archivoPasto).href);
    const { CALIDADES } = await import(pathToFileURL(path.join(src, 'config.js')).href);

    // los materiales de siempre: una copa, una hierba, una estructura y el suelo; y sus programas antes de todo
    const copa = MAT.materialVegetal({ flex: 1, copa: true });
    const hierba = MAT.materialVegetal({ flex: 5, doble: true, detalle: false });
    const obra = MAT.materialVegetal({ flex: 0 });
    const suelo = MAT.materialTerreno();
    const mats = [copa, hierba, suelo];
    const antes = new Map([...mats, obra].map((m) => [m, { obc: m.onBeforeCompile, clave: m.customProgramCacheKey(), propia: Object.hasOwn(m, 'customProgramCacheKey'), sh: compilar(m) }]));
    falla(MAT.REGISTRO_ULTRA_B.veg.some((w) => w.deref() === copa) && MAT.REGISTRO_ULTRA_B.veg.some((w) => w.deref() === hierba), 'las copas y las hierbas quedan anotadas para Ultra');
    falla(!MAT.REGISTRO_ULTRA_B.veg.some((w) => w.deref() === obra), 'las obras (materialVegetal sin viento) no: Ultra del bosque no las toca');
    falla(MAT.REGISTRO_ULTRA_B.suelo.some((w) => w.deref() === suelo), 'el suelo queda anotado');

    const pasto = P.crearPasto(CALIDADES.alta);
    const matPasto = pasto.malla.material;
    const anillos = pasto.malla.children.map((c) => c.material);
    const pastoAntes = { hijos: pasto.malla.children.length, vs: matPasto.vertexShader, obc: matPasto.onBeforeCompile, uni: Object.keys(matPasto.uniforms).sort().join(','), anillos: anillos.map((m) => compilarShader(m).vertexShader), clave: matPasto.customProgramCacheKey() };
    const js = { pos: { x: 10, y: 0, z: -4 }, enSuelo: true, nadando: false };
    const iguales = (etiqueta) => {
      for (const [m, a] of antes) {
        const sh = compilar(m);
        falla(m.onBeforeCompile === a.obc && m.customProgramCacheKey() === a.clave && Object.hasOwn(m, 'customProgramCacheKey') === a.propia && !m.userData.ultraB,
          `${etiqueta}: el material queda con su onBeforeCompile y su clave de siempre`);
        falla(sh.vertexShader === a.sh.vertexShader && sh.fragmentShader === a.sh.fragmentShader && Object.keys(sh.uniforms).join() === Object.keys(a.sh.uniforms).join(), `${etiqueta}: el texto del programa y sus uniformes, los de siempre`);
      }
      falla(pasto.malla.children.length === pastoAntes.hijos && pasto.matasUltra === 0 && !pasto.malla.children.some((c) => c.name === 'pasto-ultra'), `${etiqueta}: el pasto sin la malla densa`);
      falla(matPasto.onBeforeCompile === pastoAntes.obc && !Object.hasOwn(matPasto, 'onBeforeCompile') && matPasto.customProgramCacheKey() === pastoAntes.clave && Object.keys(matPasto.uniforms).sort().join(',') === pastoAntes.uni,
        `${etiqueta}: el material del pasto, el de siempre (sin uniformes de más)`);
      falla(compilarShader(matPasto).vertexShader === pastoAntes.vs && anillos.every((m, i) => compilarShader(m).vertexShader === pastoAntes.anillos[i]), `${etiqueta}: el texto del pasto, las flores y los helechos, el de siempre`);
      falla(UBm.UB.uPisado.value === null, `${etiqueta}: sin la textura del pisado`);
    };

    // ---- 1: apagado de todas las formas
    const ub = UBm.crearUltraBosque();
    for (const [aj, corre, que] of [[{ ultra: false, calidad: 'alta' }, 'alta', 'ajuste en No'], [{ ultra: true, calidad: 'media' }, 'media', 'calidad Media'], [{ ultra: true, calidad: 'baja' }, 'baja', 'calidad Baja'],
      [{ ultra: true, calidad: 'alta' }, 'media', 'Alta elegida con Media corriendo'], [{ calidad: 'alta' }, 'alta', 'sin el ajuste (partida vieja)'], [{ ultra: 'si', calidad: 'alta' }, 'alta', 'ajuste raro']]) {
      for (let i = 0; i < 3; i++) ub.revisarAjustes(aj, corre, 0.016, js, pasto);
      falla(!ub.activo && ub.pisado === null && ub.motas === null && ub.parchados === 0 && UBm.UB.uGotas.value === 0 && !pasto.malla.children.some((c) => c.name === 'motas-ultra'), `${que}: Ultra no se prende (ni motas ni gotas)`);
      iguales(que);
    }

    // ---- 2: prendido
    avisos.length = 0;
    ub.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 0.016, js, pasto);
    falla(ub.activo && ub.pisado && UBm.UB.uPisado.value === ub.pisado.tex, 'Ultra y Alta: se prende, con la textura del pisado');
    const motas = ub.motas;
    falla(motas && pasto.malla.children.includes(motas.malla) && motas.malla.isPoints && motas.malla.geometry.attributes.aClase.count === UBm.MOTAS_POLVO + UBm.MOTAS_HOJAS, 'las motas (polvo, polen y hojas que caen): un solo dibujo de puntos, colgado del pasto');
    {
      const sv = motas ? motas.malla.material.vertexShader : '';
      falla(sv.includes('float rayo = smoothstep(0.45, 0.8, vnoise((piso + uSolDir.xz * 6.0 + desliz) * 0.55));') && leer('src/materiales.js').includes('vec2 pm = vPosMundo.xz + uSolDir.xz * 6.0 + desliz;') && leer('src/materiales.js').includes('float moteado = smoothstep(0.45, 0.8, vnoise(pm * 0.55));'),
        'el polvo brilla en las mismas manchas de sol que el suelo del bosque (los rayos)');
      falla(sv.includes('float cuantas = 0.15 + 0.6 * uOtono + 0.25 * min(uViento, 1.0);') && sv.includes('(1.0 - smoothstep(0.2, 0.6, uInvierno))'), 'las hojas caen más en otoño y con viento, y no en invierno');
    }
    // las gotas: rocío a la mañana, lo mojado después de la lluvia; nada con nieve ni a la tarde seca
    falla(UBm.gotasAhora(6.8, 0, 0, 0) > 0.8 && UBm.gotasAhora(15, 0, 0, 0) === 0 && UBm.gotasAhora(15, 0.9, 0, 0) > 0.8 && UBm.gotasAhora(6.8, 0, 0, 1) === 0 && UBm.gotasAhora(6.8, 0, 1, 0) === 0, 'las gotas: rocío de mañana, lo mojado después de la lluvia, nada con nieve');
    ub.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 0.016, js, pasto, 7);
    falla(UBm.UB.uGotas.value > 0.5, 'con Ultra a las 7 de la mañana hay rocío');
    for (const m of mats) {
      falla(m.customProgramCacheKey() === antes.get(m).clave + '|' + UBm.CLAVE_ULTRA_B, 'cada material de Ultra con la clave de siempre + la de Ultra');
      const sh = compilar(m);
      falla(sh.vertexShader !== antes.get(m).sh.vertexShader || sh.fragmentShader !== antes.get(m).sh.fragmentShader, 'y su programa cambia');
    }
    falla(antes.get(obra).clave === obra.customProgramCacheKey() && !obra.userData.ultraB, 'las obras siguen igual');
    const shC = compilar(copa), shS = compilar(suelo);
    falla(shC.vertexShader.includes('olaUltraB(posI.xz, uTiempo)') && shC.vertexShader.includes('0.26 * smoothstep(0.4, 2.4, length(position.xz))') && shC.vertexShader.includes('(1.6 + 0.6 * uLluviaUB) + 0.05 * olaUB'), 'copas: la ola de ráfaga, los troncos quietos y las hojas que se agitan');
    falla(shC.uniforms.uLluviaUB === MAT.U.uLluvia, 'copas: el viento sube con la lluvia (uLluvia)');
    falla(shC.fragmentShader.includes('espesorUB') && shC.fragmentShader.includes('pasaUB'), 'copas: la luz que atraviesa las hojas');
    falla(shS.fragmentShader.includes('granoUB = ((g1 - 0.5)') && shS.fragmentShader.includes('normal = normalize(abs(detU) * normal - gradU)') && shS.fragmentShader.includes('bordePisoU'), 'suelo: el grano con relieve y el borde de los pisos');
    const shP = compilarShader(matPasto);
    falla(shP.vertexShader.includes('olaUltraB(b, uTiempo)') && shP.vertexShader.includes('pisadoUB = texture2D(uPisadoUB') && shP.vertexShader.includes('step(0.4 - 0.16 * vnoise(b * 1.7), estT.b)'), 'pasto: la ola, el pisado y el corte quebrado');
    falla(shP.vertexShader.includes('alto *= mix(0.3, 1.0, 1.0 - smoothstep(0.02, 0.3, estT.b))'), 'pasto: se achica antes del piso');
    falla(shP.vertexShader.includes('florUB * smoothstep(0.95, 1.0, t)') && shP.vertexShader.includes('t = mix(t, 0.92,') && shP.vertexShader.includes('espigaUB * smoothstep(0.7, 1.0, t)'), 'pasto: tallos con espiga y florcitas de cerca');
    falla(shP.fragmentShader.includes('puntoGU') && shP.uniforms.uGotasUB === UBm.UB.uGotas && shC.fragmentShader.includes('puntoGU') && shC.uniforms.uGotasUB === UBm.UB.uGotas, 'gotas que brillan en el pasto y en las hojas');
    falla(anillos.every((m) => compilarShader(m).vertexShader.includes('step(0.4 - 0.16 * vnoise(b * 1.7), est.b)')), 'flores y helechos: el corte quebrado');
    // el corte quebrado nunca deja pasto DENTRO de un piso (sólo corta antes): el umbral queda entre 0,24 y 0,4
    falla(shP.vertexShader.includes('0.4 - 0.16 * vnoise') && !/step\(0\.4 \+/.test(shP.vertexShader), 'el corte sólo se adelanta (nunca pasa del 0,4 de siempre)');
    falla(avisos.length === 0, 'todos los anclajes de los parches están en el código de siempre' + (avisos.length ? ': ' + avisos.join(' | ') : ''));
    const densa = pasto.malla.children.find((c) => c.name === 'pasto-ultra');
    falla(!!densa && densa.material === matPasto, 'la malla densa usa el mismo material del pasto (ningún programa más)');
    // el doble a menos de 20 m: las matas de la malla densa en su cuadrado de 40 m son las mismas que el pasto de siempre tiene ahí
    const R = CALIDADES.alta.radioPasto, nM = Math.round(CALIDADES.alta.pasto * 0.36);
    const esperado = nM * (0.38 / (0.9 * R) ** 2 + 0.3 / (1.4 * R) ** 2 + 0.32 / (2 * R) ** 2) * 1600;
    falla(densa && Math.abs(pasto.matasUltra - esperado) < 2 && pasto.matasUltra > 12000 && pasto.matasUltra < 26000, `la malla densa lleva lo mismo que el pasto de siempre a menos de 20 m (${pasto.matasUltra} matas)`);
    falla(densa && Math.abs(densa.geometry.attributes.aRadio.array[0] * matPasto.uniforms.uR.value - 20) < 1e-6, 'su anillo mide 20 m');
    pasto.ajustar(1.4);
    falla(densa && Math.abs(densa.geometry.attributes.aRadio.array[5] * matPasto.uniforms.uR.value - 20) < 1e-6, 'y sigue en 20 m al cambiar la distancia de plantas');
    pasto.ajustar(1);
    // un material creado con Ultra prendido se parcha en el cuadro siguiente
    const nueva = MAT.materialVegetal({ flex: 2 });
    const claveNueva = nueva.customProgramCacheKey();
    ub.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 0.016, js, pasto);
    falla(nueva.customProgramCacheKey() === claveNueva + '|' + UBm.CLAVE_ULTRA_B, 'una planta nueva con Ultra prendido se parcha sola');

    // ---- 3: apagado (la autocalidad baja a Media)
    let soltada = false;
    if (densa) densa.geometry.addEventListener('dispose', () => { soltada = true; });
    ub.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 0.016, js, pasto, 7);
    ub.revisarAjustes({ ultra: true, calidad: 'media' }, 'media', 0.016, js, pasto);
    falla(!ub.activo && soltada, 'al bajar de Alta se apaga y suelta los búferes de la malla densa');
    falla(motas && !motas.malla.parent && UBm.UB.uGotas.value === 0, 'y saca las motas y las gotas');
    iguales('después de apagarlo');
    falla(nueva.customProgramCacheKey() === claveNueva && !nueva.userData.ultraB, 'la planta nueva también vuelve a lo de siempre');
    // y se puede volver a prender (la misma malla densa) y apagar con el ajuste
    ub.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 0.016, js, pasto);
    falla(ub.activo && pasto.matasUltra > 0, 'se vuelve a prender');
    ub.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 0.016, js, pasto);
    iguales('apagado con el ajuste');

    // ---- 4: el pasto aplastado
    {
      const pis = UBm.crearPisado();
      const lado = UBm.PISADO_LADO, res = UBm.PISADO_RES, tam = lado / res;
      const valor = (x, z) => { const u = Math.round((x - pis.centro.x) / tam + res / 2 - 0.5), v = Math.round((z - pis.centro.y) / tam + res / 2 - 0.5); return pis.datos[v * res + u]; };
      const J = { pos: { x: 3.1, z: 7.2 }, enSuelo: true };
      pis.actualizar(0.016, J);
      falla(valor(3.1, 7.2) > 200, 'donde pisás el pasto se aplasta');
      falla(valor(3.1 + 2, 7.2) === 0, 'a dos metros, no');
      // caminar 4 m: queda el rastro
      for (let i = 1; i <= 20; i++) { J.pos.x = 3.1 + i * 0.2; pis.actualizar(0.016, J); }
      falla(valor(4.1, 7.2) > 200 && valor(6.0, 7.2) > 200, 'al caminar queda el rastro');
      // irse lejos corre el centro sin perder lo pisado
      const antesX = valor(4.1, 7.2);
      J.pos.x = 3.1 + 7.5; pis.actualizar(0.016, J);
      falla(Math.abs(pis.centro.x - 10.6) < tam && valor(4.1, 7.2) === antesX, 'al alejarse se corre la textura sin perder lo pisado');
      // nadando o en el aire no se marca
      const Jn = { pos: { x: 12, z: 10 }, enSuelo: true, nadando: true };
      pis.actualizar(0.016, Jn);
      falla(valor(12, 10) === 0, 'nadando no se aplasta nada');
      // se recupera solo en unos veinte segundos
      for (let t = 0; t < 10; t += 0.05) pis.actualizar(0.05, J);
      const aMedias = valor(4.1, 7.2);
      for (let t = 0; t < 12; t += 0.05) pis.actualizar(0.05, J);
      falla(aMedias > 30 && aMedias < 180 && valor(4.1, 7.2) === 0, `se recupera de a poco (a los 10 s: ${aMedias}) y a los 22 s ya no queda nada`);
      pis.dispose();
      falla(UBm.UB.uPisado.value === null, 'al soltarlo no queda la textura');
    }
  } catch (e) {
    mal.push('se rompió: ' + (e && e.stack || e));
  } finally {
    console.warn = warnOrig;
  }
  return { mal, n };
}

// ================================================================ modo hijo
if (process.argv[2] === '--hijo') {
  const { mal } = await comprobar(process.argv[3], process.argv[4]);
  console.log('HIJO ' + JSON.stringify(mal));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

// la copia original, en otro proceso (como las mutadas)
const correr = (u, p) => {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', u, p], { encoding: 'utf8', timeout: 120000 });
  const l = (r.stdout || '').split('\n').find((x) => x.startsWith('HIJO '));
  return l ? JSON.parse(l.slice(5)) : ['sin respuesta: ' + (r.stderr || '').slice(0, 400)];
};
const archU = path.join(src, 'ultra-bosque.js'), archP = path.join(src, 'pasto.js');
{
  const { n } = await comprobar(archU, archP);   // (para contar)
  const mal = correr(archU, archP);
  total += n;
  if (mal.length) for (const t of mal) { fallas++; console.log('✗ ' + t); }
  else console.log(`✓ ultra-bosque.js y pasto.js de verdad: ${n} comprobaciones (apagado sin tocar nada, prendido, apagado otra vez, el pisado)`);
}

// ---------------------------------------------------------------- 5: main.js
const main = leer('src/main.js');
const enlace = (t) => {
  const i = t.indexOf('  pasto.actualizar(cam, miraPasto, presupuestoAdaptativo.factorDetalle(0.78));\n');
  const j = t.indexOf('ultraBosque.revisarAjustes(ajustes, calidadActiva, dt, js, pasto, progreso.horas)');
  return i > 0 && j > i && j - i < 200 && /^const ultraBosque = crearUltraBosque\(\);/m.test(t) && /^import \{ crearUltraBosque \} from '\.\/ultra-bosque\.js';$/m.test(t);
};
ok(enlace(main), 'main.js: Ultra del bosque se revisa en cada cuadro, junto al pasto, con la calidad que corre (calidadActiva)');
ok(!enlace(main.replace('revisarAjustes(ajustes, calidadActiva,', 'revisarAjustes(ajustes, ajustes.calidad,')), 'mutación: con la calidad elegida en vez de la que corre, falla');
const ub = leer('src/ultra-bosque.js');
ok(/revisar\(esUltra\(ajustes\) && calidadActiva === 'alta'/.test(ub), 'ultra-bosque.js decide con esUltra (ultra.js) y la calidad que corre');
ok((ub.match(/new THREE\.(ShaderMaterial|MeshLambertMaterial|MeshBasicMaterial|PointsMaterial)\(/g) || []).length === 1 && /function crearMotas\(\) \{[\s\S]*new THREE\.ShaderMaterial\(/.test(ub.split('function gotasAhora')[0])
  && (ub.match(/crearMotas\(\)/g) || []).length === 2 && !/new THREE\.(ShaderMaterial|MeshLambertMaterial)\(/.test(leer('src/pasto.js').split('function ponerUltra')[1].split('function ajustar')[0]),
  'Ultra no crea materiales salvo el de las motas (polvo y hojas), que sólo se arma al prenderlo: lo demás parcha los de siempre');

// ---------------------------------------------------------------- mutaciones
const mutaciones = [
  ['u', 'Ultra sin mirar el ajuste', "revisar(esUltra(ajustes) && calidadActiva === 'alta'", "revisar(calidadActiva === 'alta'"],
  ['u', 'el pasto pisado, otra vez chico', 'const r = 0.6 / tam;', 'const r = 0.45 / tam;'],
  ['u', 'la ráfaga, otra vez débil', 'olaUB * 1.8)', 'olaUB * 1.1)'],
  ['u', 'Ultra sin mirar la calidad que corre', "revisar(esUltra(ajustes) && calidadActiva === 'alta'", 'revisar(esUltra(ajustes)'],
  ['u', 'la clave de Ultra igual a la de Alta', "m.customProgramCacheKey = () => claveAlta + '|' + CLAVE_ULTRA_B;", 'm.customProgramCacheKey = () => claveAlta;'],
  ['u', 'apagar no devuelve el onBeforeCompile', 'if (g.propioObc) m.onBeforeCompile = g.obc; else delete m.onBeforeCompile;', ''],
  ['u', 'apagar no devuelve la clave', 'if (g.propioClave) m.customProgramCacheKey = g.clave; else delete m.customProgramCacheKey;', ''],
  ['u', 'apagar deja los uniformes del pasto', "for (const k of ['uLluviaUB', 'uPisadoUB', 'uPisadoCentroUB', 'uPisadoLadoUB', 'uGotasUB']) delete m.uniforms[k];", ''],
  ['u', 'apagar no saca el pasto denso', 'if (pastoUltra) { pastoUltra.ponerUltra(false, { quitar: quitarUltra }); pastoUltra = null; }', ''],
  ['u', 'apagar deja la textura del pisado', 'pisado?.dispose(); pisado = null;', 'pisado = null;'],
  ['u', 'un anclaje que ya no está (las copas)', "'float rigidez = mix(0.26, 1.0, esFollajeV);'", "'float rigidez = mix(0.25, 1.0, esFollajeV);'"],
  ['u', 'un anclaje que ya no está (el suelo)', "f = cambiar(f, 'diffuseColor.rgb = col;'", "f = cambiar(f, 'diffuseColor.rgb = col ;'"],
  ['u', 'el corte del pasto pasa del de siempre', "'* enPantallaAnillo(b) * (1.0 - step(0.4 - 0.16 * vnoise(b * 1.7), estT.b));'", "'* enPantallaAnillo(b) * (1.0 - step(0.4 + 0.16 * vnoise(b * 1.7), estT.b));'"],
  ['u', 'el pisado no se borra', 'datos[k] = Math.max(0, datos[k] - 3);', 'datos[k] = Math.max(0, datos[k] - 0);'],
  ['u', 'el pisado se pierde al correr el centro', 'if (primero || Math.abs(di) >= PISADO_RES', 'if (true || Math.abs(di) >= PISADO_RES'],
  ['u', 'apagar deja las motas', 'if (motas) { motas.malla.parent?.remove(motas.malla); motas.dispose(); motas = null; }', ''],
  ['u', 'las gotas también a la tarde', 'Math.max(0, 1 - Math.abs(h - 6.8) / 3.2)', 'Math.max(0, 1 - Math.abs(h - 6.8) / 13.2)'],
  ['u', 'apagar deja las gotas prendidas', '    UB.uGotas.value = 0;\n', '\n'],
  ['u', 'no se parchan las plantas nuevas', 'if (version !== REGISTRO_ULTRA_B.version) parcharTodo();', ''],
  ['p', 'el pasto denso con un material propio', 'densa = new THREE.Mesh(g, mat);', 'densa = new THREE.Mesh(g, mat.clone());'],
  ['p', 'el pasto denso con la mitad de las matas', 'const n = Math.round(densidadCerca * (2 * R_DENSA) ** 2);', 'const n = Math.round(densidadCerca * (2 * R_DENSA) ** 2 / 2);'],
  ['p', 'el pasto denso no se va', 'if (densa) { malla.remove(densa); densa.geometry.dispose(); densa = null; }', 'if (densa) { densa = null; }'],
  ['p', 'el anillo denso no sigue a la distancia de plantas', '    radioDensa();   // 4.28.0 (B, Ultra)\n', '\n'],
];
const vivas = [];
let i = 0;
for (const [donde, que, de, a] of mutaciones) {
  i++;
  const base = donde === 'u' ? archU : archP;
  const texto = fs.readFileSync(base, 'utf8');
  if (!texto.includes(de)) { ok(false, `mutación «${que}»: no encontré el texto a cambiar`); continue; }
  const copia = path.join(src, `__mut-4280b-${process.pid}-${i}-${path.basename(base)}`);
  let copiaP = archP;
  try {
    if (donde === 'u') {
      fs.writeFileSync(copia, texto.split(de).join(a));
    } else {
      fs.writeFileSync(copia, texto.split(de).join(a));
      copiaP = copia;
    }
    const mal = correr(donde === 'u' ? copia : archU, copiaP);
    if (mal.length) total++; else { total++; fallas++; vivas.push(que); }
  } finally { fs.rmSync(copia, { force: true }); }
}
if (vivas.length) console.log('✗ mutaciones que no fallaron: ' + vivas.join(' · ')); else console.log(`✓ las ${mutaciones.length} mutaciones fallan (un proceso por copia)`);

console.log(fallas ? `FALLA verificar-4-28-0-b: ${fallas} de ${total}` : `OK verificar-4-28-0-b: ${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
