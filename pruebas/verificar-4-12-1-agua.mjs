// 4.12.1 (A): agua y reflejos.
//
// El lago y el arroyo (src/agua.js) espejan ahora el cielo de verdad: el mismo degradado y bruma del horizonte, la franja rosa y la banda dorada del ocaso (más
// fuertes del lado del sol), las nubes (el mismo ruido del cielo sobre la dirección del reflejo), la luna rota en las ondas y los cerros encendidos por el sol bajo.
// La orilla es más turquesa y más transparente, con la película mojada del borde y una lengua de espuma que avanza y se retira. Baja y Mínima tienen una versión
// barata de todo eso (las nubes con dos muestras en vez de cinco, el reflejo de orilla con una muestra, el encaje de la espuma sin ruido) y NO cuestan más que antes:
// los ruidos de las cuentas caras quedan detrás de `if` (sólo se pagan donde hay orilla, nubes o camino de sol).
//
// Esta prueba mira, con el three real y sin placa: los dos programas del agua (media/alta y baja/mínima) armados de verdad; que cada uniforme declarado exista y
// que los del cielo (`UAGUA`) sean los compartidos; el tope de llamadas a `vnoise` (lo que corre siempre y el total); las decisiones de diseño (el sol de verdad
// y la luna, no `uSolDir`, que de noche es la luna y al ocaso cambia de golpe); que cielo.js los ponga en cada `actualizar` (de día, al ocaso y de noche); y
// la configuración de las calidades. Después MUTACIONES a propósito: cada regla rota en una copia del código tiene que hacer fallar la prueba.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { urlDe, materialDeAgua, contarRuido, uniformesDeclarados, equilibrado } from './ayuda-agua-4-12-1.mjs';

registrarThree();
const THREE = await import('three');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(RAIZ, 'src');
const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const { UAGUA } = await import(urlDe(SRC, 'materiales.js'));
const { CALIDADES } = await import(urlDe(SRC, 'config.js'));

// los topes de llamadas a `vnoise` en main() del fragment shader (4.12.0, sin esto: baja 6 siempre y 11 en total; media/alta 10 y 15)
const TOPE = { siempre: 2, totalBaja: 14, totalNueva: 18 };

async function revisar({ aguaUrl, cieloUrl, etiqueta = 'código' }) {
  let total = 0;
  const ok = (c, t) => { assert.ok(c, `${etiqueta}: ${t}`); total++; };
  const eq = (a, b, t) => { assert.deepEqual(a, b, `${etiqueta}: ${t}`); total++; };

  // ---------------------------------------------------------------- 1. los dos programas del agua
  const estadisticas = {};
  for (const nuevo of [true, false]) {
    const nombre = nuevo ? 'media/alta' : 'baja/mínima';
    const m = await materialDeAgua(aguaUrl, nuevo, THREE);
    const fs2 = m.fragmentShader;
    estadisticas[nuevo ? 'nueva' : 'baja'] = contarRuido(fs2);
    ok(!/\$\{|undefined|\[object/.test(fs2), `${nombre}: el shader no tiene restos de plantilla`);
    ok(equilibrado(fs2, '{', '}') && equilibrado(fs2, '(', ')'), `${nombre}: llaves y paréntesis equilibrados`);
    const declarados = uniformesDeclarados(fs2);
    for (const u of declarados) ok(Object.hasOwn(m.uniforms, u), `${nombre}: el uniforme ${u} declarado en el shader existe en el material`);
    for (const k of Object.keys(UAGUA)) {
      ok(declarados.includes(k), `${nombre}: el shader declara ${k}`);
      ok(m.uniforms[k] === UAGUA[k], `${nombre}: ${k} es el compartido con el cielo (no una copia)`);
    }
    // lo de las dos versiones
    ok(/float hs = max\(dot\(rumboR, normalize\(uSolA\.xz/.test(fs2), `${nombre}: el lado del sol se mide con el sol de verdad (uSolA), no con uSolDir (de noche es la luna y al ocaso salta)`);
    ok(/float dlN = max\(dot\(R, uLunaA\), 0\.0\);/.test(fs2), `${nombre}: la luna reflejada usa la luna (uLunaA)`);
    ok(/smoothstep\(0\.9988, 0\.9996, dlN\) \* nocheA/.test(fs2), `${nombre}: el disco de la luna sólo de noche`);
    ok(/float franjaRosa = /.test(fs2) && /vec3 cerros = /.test(fs2) && /hs \* hs \* bajoSol/.test(fs2), `${nombre}: franja rosa y cerros encendidos por el sol bajo`);
    ok(/if \(corre352 < 0\.7\) \{\s*vec2 uvN = R\.xz \/ \(ry \+ 0\.18\);/.test(fs2), `${nombre}: las nubes se espejan con las coordenadas del cielo y no en el agua que corre`);
    ok(/if \(cercaOrilla > 0\.01\) \{/.test(fs2) && /float lengua = 0\.0;\s*if \(prof < 0\.7\)/.test(fs2), `${nombre}: reflejo de orilla y lengua de espuma sólo cerca de la costa`);
    ok(/if \(alineadoSol > 0\.9 && detalle > 0\.05\) \{/.test(fs2), `${nombre}: los destellos sólo sobre el camino del sol`);
    ok(/mix\(0\.40, 0\.95, pow\(smoothstep\(0\.0, 3\.0, prof\), 0\.75\)\)/.test(fs2), `${nombre}: la orilla es más transparente que antes (0,40 en lo somero, 0,58 antes)`);
    ok(/srgb\(vec3\(0\.14, 0\.52, 0\.50\)\)/.test(fs2), `${nombre}: la orilla toma el turquesa`);
    ok(/if \(sedimento > 0\.0\) sedimento \*= /.test(fs2) && /if \(espuma > 0\.0\) espuma \*= /.test(fs2) && /if \(prof < 0\.42\) \{/.test(fs2), `${nombre}: los ruidos de la orilla sólo donde hay orilla`);
    // lo que cambia entre versiones
    if (nuevo) {
      ok(/float nN = fbmNubes\(uvN \* 1\.05 \+ vientoN\);/.test(fs2), `${nombre}: las nubes con el fbm de tres octavas del cielo`);
      ok(/exp\(-ry \/ 0\.085\)/.test(fs2), `${nombre}: la banda dorada baja del ocaso (la que el cielo pinta en media y alta)`);
      ok(/float puntillas = 0\.0;\s*if \(prof < 1\.0\)/.test(fs2), `${nombre}: las puntillas de espuma sólo en lo somero`);
      ok(/float tira = vnoise\([^;]*vnoise\(/.test(fs2), `${nombre}: el reflejo de la costa con dos muestras`);
      ok(/vnoise\(vPos\.xz \* 2\.6/.test(fs2), `${nombre}: el encaje de la lengua con ruido`);
    } else {
      ok(!/fbmNubes\(uvN/.test(fs2), `${nombre}: sin el fbm de tres octavas (costaría más que antes)`);
      ok(/float nN = \(0\.54 \* vnoise\(pN\) \+ 0\.27 \* vnoise\(pN \* 2\.02 \+ 3\.1\) \+ 0\.0675\) \* 1\.08;/.test(fs2), `${nombre}: las nubes con dos octavas y la media de la tercera`);
      ok(!/exp\(-ry \/ 0\.085\)/.test(fs2) && !/float puntillas/.test(fs2), `${nombre}: sin banda dorada ni puntillas (el cielo de baja tampoco las pinta)`);
      ok(/float tira = vnoise\(vec2\(aAn \* 1\.2/.test(fs2) && !/float tira = vnoise\([^;]*vnoise\(/.test(fs2), `${nombre}: el reflejo de la costa con una muestra`);
      ok(/0\.5 \+ 0\.5 \* sin\(vPos\.x \* 5\.3/.test(fs2) && !/vnoise\(vPos\.xz \* 2\.6/.test(fs2), `${nombre}: el encaje de la lengua sin ruido`);
    }
    // el programa es el mismo cada vez (nada que cambie por cuadro: el material se arma una vez al cargar)
    const m2 = await materialDeAgua(aguaUrl, nuevo, THREE);
    ok(m2.fragmentShader === fs2, `${nombre}: el programa es el mismo cada vez que se arma`);
  }
  // el costo (tope de llamadas a vnoise)
  ok(estadisticas.baja.siempre <= TOPE.siempre && estadisticas.nueva.siempre <= TOPE.siempre, `ruidos que corren siempre en main(): baja ${estadisticas.baja.siempre}, media/alta ${estadisticas.nueva.siempre} (tope ${TOPE.siempre}; antes 6 y 10)`);
  ok(estadisticas.baja.total <= TOPE.totalBaja, `ruidos en total en baja: ${estadisticas.baja.total} (tope ${TOPE.totalBaja}; antes 11)`);
  ok(estadisticas.nueva.total <= TOPE.totalNueva, `ruidos en total en media/alta: ${estadisticas.nueva.total} (tope ${TOPE.totalNueva}; antes 15)`);
  ok(estadisticas.baja.total < estadisticas.nueva.total, 'la versión de baja tiene menos ruidos que la de media/alta');

  // ---------------------------------------------------------------- 2. cielo.js pone lo que el agua espeja
  const { crearCielo } = await import(cieloUrl);
  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(0xffffff, 0.001);
  const cielo = crearCielo(escena, CALIDADES.media);
  const cam = new THREE.Vector3(0, 10, 0);
  const clima = { nublado: 0.2, lluvia: 0 };
  const al = (h) => { cielo.actualizar(h, clima, cam, 0, null); return { sol: UAGUA.uSolA.value.clone(), luna: UAGUA.uLunaA.value.clone(), dia: UAGUA.uDiaA.value, tarde: UAGUA.uTardeA.value, dorada: UAGUA.uDoradaA.value, nub: UAGUA.uNubA.value, luz: UAGUA.uLunaLuzA.value }; };
  const mediodia = al(12), ocaso = al(20.2), noche = al(23);
  ok(mediodia.sol.y > 0.7 && mediodia.dia > 0.99 && mediodia.tarde < 0.05, 'mediodía: el sol alto, día pleno y nada de ocaso');
  ok(Math.abs(mediodia.nub - 0.2) < 1e-6, 'las nubes del clima llegan al agua');
  ok(ocaso.sol.y > 0 && ocaso.sol.y < 0.2 && ocaso.tarde > 0.5 && ocaso.dia < 0.9, 'al ocaso: el sol bajo, la tarde fuerte');
  ok(noche.sol.y < 0 && noche.luna.y > 0.3 && noche.dia < 0.01, 'de noche: el sol de verdad está bajo el horizonte y la luna arriba (uSolDir sería la luna: por eso el agua tiene uSolA)');
  ok(Math.abs(noche.luna.length() - 1) < 1e-6 && Math.abs(noche.sol.length() - 1) < 1e-6, 'las direcciones están normalizadas');
  ok(ocaso.dorada > 0.5 && mediodia.dorada === 0, 'la hora dorada llega al agua');
  const otra = al(12);
  eq([otra.dia, otra.tarde], [mediodia.dia, mediodia.tarde], 'cada actualizar vuelve a poner los valores (no se quedan pegados)');
  ok(noche.luz >= 0 && noche.luz <= 1, 'la luz de la luna está entre 0 y 1');

  // ---------------------------------------------------------------- 3. las calidades
  ok(CALIDADES.media.post === true && CALIDADES.alta.post === true, 'media y alta llevan la versión completa del agua (calidad.post)');
  ok(CALIDADES.baja.post === false && CALIDADES.muybaja.post === false, 'baja y mínima llevan la versión barata (que no cuesta más que antes)');
  for (const q of Object.keys(CALIDADES)) ok(!('agua' in CALIDADES[q]) && !('reflejoAgua' in CALIDADES[q]), `${q}: el agua no tiene una opción nueva en la configuración (no hay un apagado que rompa lo de «Bajar nunca apaga el agua»)`);
  return total;
}

// el enganche de main.js y de agua.js (texto): el agua se arma una sola vez al cargar y con la calidad
const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
let enganche = 0;
const okE = (c, t) => { assert.ok(c, t); enganche++; };
okE(/ajustarAguaNueva\(calidad\.post\);/.test(main), 'main.js elige la versión del agua con calidad.post antes de crearla');
okE(main.indexOf('ajustarAguaNueva(calidad.post);') < main.indexOf('crearAgua(T, escena)'), 'y la elige antes de crearla');
okE((main.match(/crearAgua\(/g) || []).length === 1, 'el agua se crea una sola vez');
okE(!/new THREE\.ShaderMaterial/.test(fs.readFileSync(path.join(SRC, 'agua.js'), 'utf8').split('export function crearAgua')[1]), 'crearAgua no arma otro material: un solo programa para lago y arroyo');

const r = await revisar({ aguaUrl: urlDe(SRC, 'agua.js'), cieloUrl: urlDe(SRC, 'cielo.js') });

// ---------------------------------------------------------------- MUTACIONES
const A = 'agua.js', C = 'cielo.js';
const MUTACIONES = [
  [A, 'la luna usa uSolDir', 'float dlN = max(dot(R, uLunaA), 0.0);', 'float dlN = max(dot(R, uSolDir), 0.0);'],
  [A, 'el lado del sol usa uSolDir', 'normalize(uSolA.xz + vec2(1e-4, 0.0))', 'normalize(uSolDir.xz + vec2(1e-4, 0.0))'],
  [A, 'el disco de la luna también de día', 'smoothstep(0.9988, 0.9996, dlN) * nocheA *', 'smoothstep(0.9988, 0.9996, dlN) *'],
  [A, 'los uniformes del cielo no se pasan al material', '  Object.assign(uniforms, UAGUA);   // 4.12.1: el cielo que se espeja\n', '  const _sinUAGUA = UAGUA;\n'],
  [A, 'uniforme declarado que no existe', 'uniform float uLunaLuzA;\n      varying vec3 vPos;', 'uniform float uLunaLuzA; uniform float uInventado;\n      varying vec3 vPos;'],
  [A, 'las nubes de media y alta sin las tres octavas', 'float nN = fbmNubes(uvN * 1.05 + vientoN);', 'float nN = (0.54 * vnoise(uvN * 1.05 + vientoN) + 0.27 * vnoise(uvN * 2.12 + 3.1) + 0.0675) * 1.08;'],
  [A, 'las nubes de baja con las tres octavas (cuesta más)', 'float nN = (0.54 * vnoise(pN) + 0.27 * vnoise(pN * 2.02 + 3.1) + 0.0675) * 1.08;', 'float nN = fbmNubes(pN);'],
  [A, 'las nubes se calculan también en el arroyo', 'if (corre352 < 0.7) {\n          vec2 uvN', '{\n          vec2 uvN'],
  [A, 'el sedimento sin guarda', 'if (sedimento > 0.0) sedimento *= (0.55', 'sedimento *= (0.55'],
  [A, 'la espuma sin guarda', 'if (espuma > 0.0) espuma *= (0.38', 'espuma *= (0.38'],
  [A, 'la línea de orilla sin guarda', '        if (prof < 0.42) {\n', '        {\n'],
  [A, 'el reflejo de orilla en todo el lago', 'if (cercaOrilla > 0.01) {', '{'],
  [A, 'las puntillas en todo el lago', '        if (prof < 1.0) {\n          float ola4', '        {\n          float ola4'],
  [A, 'la lengua de espuma en todo el lago', 'float lengua = 0.0;\n        if (prof < 0.7) {', 'float lengua = 0.0;\n        {'],
  [A, 'los destellos en todo el lago', 'if (alineadoSol > 0.9 && detalle > 0.05) {', 'if (detalle > 0.05) {'],
  [A, 'la orilla vuelve a ser opaca', 'mix(0.40, 0.95, pow(smoothstep(0.0, 3.0, prof), 0.75))', 'mix(0.58, 0.95, smoothstep(0.0, 2.5, prof))'],
  [A, 'sin turquesa en la orilla', 'srgb(vec3(0.14, 0.52, 0.50))', 'srgb(vec3(0.30, 0.42, 0.36))'],
  [A, 'la banda dorada en baja', "${nuevo ? `\n        // la banda de luz dorada", "${true ? `\n        // la banda de luz dorada"],
  [A, 'el encaje de la lengua de baja con ruido', "'0.5 + 0.5 * sin(vPos.x * 5.3 + vPos.z * 3.1 + uTiempo * 0.7)'", "'vnoise(vPos.xz * 2.6)'"],
  [A, 'el reflejo de la costa de baja con dos muestras', "'float tira = vnoise(vec2(aAn * 1.2, aLo * 0.08 + uTiempo * 0.05));", "'float tira = vnoise(vec2(aAn * 1.2, aLo * 0.08 + uTiempo * 0.05)) + vnoise(vec2(aAn * 3.0, aLo * 0.2)) * 0.5;"],
  [A, 'una cuenta cara más que corre siempre', 'float ry = max(R.y, 0.0);', 'float ry = max(R.y, 0.0) + vnoise(vPos.xz * 7.0) * 0.001;'],
  [C, 'cielo.js no pone el sol de verdad', 'UAGUA.uSolA.value.copy(solDir);', 'UAGUA.uSolA.value.copy(U.uSolDir.value);'],
  [C, 'cielo.js pone la luna como el sol', 'UAGUA.uLunaA.value.copy(lunaDir);', 'UAGUA.uLunaA.value.copy(solDir);'],
  [C, 'cielo.js no pone el ocaso', 'UAGUA.uTardeA.value = tarde;', 'UAGUA.uTardeA.value = 0;'],
  [C, 'cielo.js no pone las nubes', 'UAGUA.uNubA.value = nub;', 'UAGUA.uNubA.value = 0;'],
  [C, 'cielo.js no pone la hora dorada', 'UAGUA.uDoradaA.value = dorada;', 'UAGUA.uDoradaA.value = 1;'],
  [C, 'cielo.js no pone el día', 'UAGUA.uDiaA.value = dia;', 'UAGUA.uDiaA.value = 1;'],
  [C, 'cielo.js no pone la luz de la luna', 'UAGUA.uLunaLuzA.value = uniforms.uIluminada.value;', 'UAGUA.uLunaLuzA.value = 7;'],
];
let atrapadas = 0;
const sobrevivieron = [];
const temporales = [];
try {
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [archivo, nombre, de, a] = MUTACIONES[i];
    const t = leer(archivo);
    assert.equal(t.split(de).length - 1, 1, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
    const nueva = t.replace(de, () => a);
    const copia = (f, contenido) => { const n = f.replace(/\.js$/, `.mut${i}.js`); fs.writeFileSync(path.join(SRC, n), contenido); temporales.push(path.join(SRC, n)); return n; };
    const ag = archivo === A ? copia(A, nueva) : A;
    const ci = archivo === C ? copia(C, nueva) : C;
    try { await revisar({ aguaUrl: urlDe(SRC, ag), cieloUrl: urlDe(SRC, ci), etiqueta: `mutación ${i}` }); sobrevivieron.push(nombre); }
    catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
} finally {
  for (const f of temporales) { try { fs.unlinkSync(f); } catch { /* ya no está */ } }
}
assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);
console.log(`verificar-4-12-1-agua: ${r + enganche} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
