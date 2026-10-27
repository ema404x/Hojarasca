// 4.12.0 (A): bordes suaves.
//
// Hasta la 4.11.5 la escena de Media y Alta se dibujaba a un WebGLRenderTarget sin muestras y sin FXAA: el `antialias` del contexto sólo vale
// para la pantalla, así que los techos, vallas y cables se veían en escalera. Ahora Media y Alta pasan un FXAA dentro de la composición final
// (`calidad.fxaa`, un define fijo al crear el material: sin shaders nuevos a mitad de juego, sin pasadas ni dibujos de más). El MSAA del destino
// (`calidad.msaa`) queda programado pero apagado: en la placa integrada de la notebook costó entre 1,3 y 3,8 ms por cuadro (ver CAMBIOS_4_12_0_A.md).
//
// Esta prueba mira: la configuración de las cuatro calidades, el material y el destino que arma `crearPostproceso` (con el three real y un
// renderer de mentira), que el FXAA no suma pasadas ni cambia el shader después de armarse, que el tamaño del texel sigue al de la ventana, el
// cuerpo del FXAA (no toca lo plano, no se pasa de rango) y el enganche de main.js. Después, MUTACIONES a propósito: cada regla rota en una copia
// del código tiene que hacer fallar la prueba.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(RAIZ, 'src');
const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

// un preprocesador mínimo de GLSL: #ifdef / #else / #endif sobre los define que se pasan
function preprocesar(fuente, defines) {
  const salida = [];
  const pila = [];
  for (const linea of fuente.split('\n')) {
    const t = linea.trim();
    let m;
    if ((m = /^#ifdef (\w+)/.exec(t))) { pila.push({ activo: defines.has(m[1]) }); continue; }
    if (t === '#else') { const p = pila[pila.length - 1]; p.activo = !p.activo; continue; }
    if (t === '#endif') { pila.pop(); continue; }
    if (pila.every((p) => p.activo)) salida.push(linea);
  }
  return salida.join('\n');
}
const defineDe = (fuente) => new Set([...fuente.matchAll(/^#define (\w+)/gm)].map((m) => m[1]));

// un renderer de mentira: guarda a qué salida y qué escena se dibujó
function rendererFalso({ webgl2 = true, maxSamples = 8, ancho = 1280, alto = 720, pr = 1 } = {}) {
  const r = {
    capabilities: { isWebGL2: webgl2, maxSamples },
    autoClear: true, llamadas: [], salida: null, pr,
    getSize(v) { v.set(ancho, alto); return v; },
    getPixelRatio() { return r.pr; },
    setRenderTarget(t) { r.salida = t; },
    clear() {},
    compilados: [],
    compile(escena, camara) { r.compilados.push({ material: escena.children[0]?.material, salida: r.salida }); },
    render(escena, camara) { r.llamadas.push({ escena: escena.name || (escena.isScene ? 'escena' : '?'), salida: r.salida }); },
  };
  return r;
}

async function revisar({ postUrl, configUrl, etiqueta = 'código' }) {
  let total = 0;
  const ok = (c, t) => { assert.ok(c, `${etiqueta}: ${t}`); total++; };
  const eq = (a, b, t) => { assert.deepEqual(a, b, `${etiqueta}: ${t}`); total++; };

  const { CALIDADES } = await import(configUrl);
  const { crearPostproceso } = await import(postUrl);

  // ------------------------------------------------------------ 1. la configuración de las calidades
  for (const q of ['media', 'alta']) {
    ok(CALIDADES[q].post === true, `${q} lleva postproceso`);
    ok(CALIDADES[q].fxaa === true, `${q} lleva FXAA`);
  }
  for (const q of ['muybaja', 'baja']) {
    ok(CALIDADES[q].post === false, `${q} no paga postproceso`);
    ok(!CALIDADES[q].fxaa && !CALIDADES[q].msaa, `${q} no paga suavizado de bordes en la escena`);
  }
  for (const [q, c] of Object.entries(CALIDADES)) {
    ok(!c.msaa, `${q}: el MSAA del destino queda apagado (costaba de 1,3 a 3,8 ms por cuadro en la placa integrada)`);
    ok(!c.fxaa || c.post === true, `${q}: el FXAA vive en el postproceso: sin postproceso no hace nada`);
  }

  // ------------------------------------------------------------ 2. lo que arma crearPostproceso
  const escena = new THREE.Scene();
  escena.name = 'escena';
  const camara = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 500);
  const armar = (calidad, opciones) => {
    const r = rendererFalso(opciones);
    return { r, post: crearPostproceso(r, escena, camara, calidad) };
  };
  const conFxaa = armar({ ...CALIDADES.media });
  const sinFxaa = armar({ ...CALIDADES.media, fxaa: false });

  const fsFx = conFxaa.post.materialComponer.fragmentShader;
  const fsNo = sinFxaa.post.materialComponer.fragmentShader;
  ok(defineDe(fsFx).has('HOJ_FXAA'), 'con fxaa la composición se arma con el define');
  ok(!defineDe(fsNo).has('HOJ_FXAA'), 'sin fxaa la composición se arma sin el define');
  const mainFx = preprocesar(fsFx, defineDe(fsFx)), mainNo = preprocesar(fsNo, defineDe(fsNo));
  ok(/vec3 c = escenaFx\(vUv\);/.test(mainFx) && !/vec3 c = texture2D\(uColor, vUv\)\.rgb;/.test(mainFx), 'con fxaa el color de la escena sale de escenaFx');
  ok(/vec3 c = texture2D\(uColor, vUv\)\.rgb;/.test(mainNo) && !/escenaFx/.test(mainNo), 'sin fxaa se lee la textura como antes y el FXAA ni existe');
  ok(mainFx.includes('uniform vec2 uTexel;') && fsFx.includes('uniform vec2 uTexel;'), 'el texel es un uniforme');

  // el cuerpo del FXAA
  const cuerpo = /vec3 escenaFx\(vec2 uv\) \{([\s\S]*?)\n  \}\n/.exec(fsFx)?.[1] || '';
  ok(cuerpo.length > 200, 'se encuentra el cuerpo de escenaFx');
  ok(/if \(lMax - lMin < max\(0\.04, lMax \* 0\.14\)\) return m;/.test(cuerpo), 'lo plano no se toca (sale el píxel tal cual: sin emborronar el texto de los carteles ni los fondos lisos)');
  ok(/clamp\(dir \/ \(min\(abs\(dir\.x\), abs\(dir\.y\)\) \+ reduc\), vec2\(-6\.0\), vec2\(6\.0\)\)/.test(cuerpo), 'el desplazamiento está acotado (±6 texeles): no corre la imagen');
  ok(/return \(lB < lMin \|\| lB > lMax\) \? a : b;/.test(cuerpo), 'si el promedio ancho se sale del rango de luz, se queda con el corto');
  ok(/lumaFx\(vec3 c\) \{ return sqrt\(max\(/.test(fsFx), 'la luma del borde es perceptual (raíz): las luces fuertes del sol no ahogan los bordes de la sombra');
  ok((cuerpo.match(/texture2D\(uColor/g) || []).length === 9, 'nueve lecturas como mucho (centro, cuatro diagonales y cuatro del promedio) y sólo de uColor');

  // el destino
  eq(conFxaa.post.destino.samples, 0, 'con fxaa y sin msaa el destino no tiene muestras');
  eq(armar({ ...CALIDADES.media, msaa: 4 }).post.destino.samples, 4, 'msaa 4 → 4 muestras');
  eq(armar({ ...CALIDADES.media, msaa: 4 }, { maxSamples: 2 }).post.destino.samples, 2, 'msaa 4 en una placa de 2 → 2');
  eq(armar({ ...CALIDADES.media, msaa: 4 }, { webgl2: false }).post.destino.samples, 0, 'sin WebGL2 no hay muestras');
  eq(armar({ ...CALIDADES.alta, msaa: 2 }).post.destino.samples, 2, 'msaa 2 en alta → 2');

  // el texel sigue al tamaño de la ventana y a la escala de pixeles
  const tx = (p) => { const v = p.uniforms.uTexel.value; return [+(1 / v.x).toFixed(3), +(1 / v.y).toFixed(3)]; };
  eq(tx(conFxaa.post), [1280, 720], 'el texel inicial es el del destino');
  const alta = armar({ ...CALIDADES.alta }, { pr: 1.5 });
  eq(tx(alta.post), [1920, 1080], 'con escala de pixeles 1,5 el texel es el del destino grande');
  alta.r.pr = 1.25;
  alta.post.redimensionar(800, 600);
  eq(tx(alta.post), [1000, 750], 'al redimensionar el texel sigue al nuevo tamaño y a la escala');
  eq([alta.post.destino.width, alta.post.destino.height], [1000, 750], 'y el destino también');

  // la pasada de los rayos se compila al armar, contra un destino lineal (no al girar hacia el sol)
  eq(conFxaa.r.compilados.length, 1, 'al armar el postproceso se compila una pasada (la de los rayos de sol)');
  ok(conFxaa.r.compilados[0].material?.fragmentShader.includes('uCanal') && conFxaa.r.compilados[0].salida?.isWebGLRenderTarget === true, 'es la de los rayos y se compila contra un destino (salida lineal), no contra la pantalla');
  ok(conFxaa.r.salida === null, 'y la salida queda en la pantalla');

  // ------------------------------------------------------------ 3. el FXAA no suma pasadas ni cambia el shader
  const estado = { noche: 0, rayos: 0.6, solDir: null, tiempo: 1, dt: 1 / 60, exposicion: 1 };
  const cuentas = (c) => { c.r.llamadas.length = 0; c.post.render({ ...estado }); return c.r.llamadas.length; };
  const nFx = cuentas(conFxaa), nNo = cuentas(sinFxaa);
  eq(nFx, nNo, 'el FXAA no suma ninguna pasada (mismas llamadas a render por cuadro)');
  eq(nFx, 5, 'Media sin sol en pantalla: escena + brillo + 2 desenfoques + composición = 5 dibujos de pantalla completa, como antes del FXAA');
  ok(conFxaa.r.llamadas[0].escena === 'escena' && conFxaa.r.llamadas[0].salida === conFxaa.post.destino, 'la escena se dibuja al destino');
  ok(conFxaa.r.llamadas[conFxaa.r.llamadas.length - 1].salida === null, 'la última pasada (la composición, con el FXAA adentro) va a la pantalla');
  const antes = conFxaa.post.materialComponer.fragmentShader, version = conFxaa.post.materialComponer.version;
  for (let i = 0; i < 5; i++) { conFxaa.post.render({ ...estado, noche: i / 5, rayos: i % 2 }); conFxaa.post.redimensionar(1000 + i, 700); }
  ok(conFxaa.post.materialComponer.fragmentShader === antes && conFxaa.post.materialComponer.version === version, 'después de armarse, el shader no cambia ni se pide recompilar (nada de compilar a mitad de juego)');
  ok(!/\.needsUpdate\s*=\s*true/.test(fs.readFileSync(fileURLToPath(postUrl.split('?')[0]), 'utf8')), 'postproceso.js no marca ningún material para recompilar');

  return total;
}

const urlSrc = (f, q = '') => pathToFileURL(path.join(SRC, f)).href + q;
const total = await revisar({ postUrl: urlSrc('postproceso.js'), configUrl: urlSrc('config.js') });

// ---------------------------------------------------------------- el enganche de main.js (no corre en Node)
const main = leer('main.js');
let enganche = 0;
const okm = (c, t) => { assert.ok(c, `main.js: ${t}`); enganche++; };
okm(enUnaLinea(main, ['if (calidad.post) post = crearPostproceso(renderer, escena, camara, calidad);']), 'el postproceso (y con él el FXAA) se arma al cargar, una sola vez, sólo con calidad.post');
okm(enUnaLinea(main, ['antialias: !!calidad.antialias', 'powerPreference']), 'el contexto sigue tomando el antialias de la calidad');
okm((main.match(/crearPostproceso\(/g) || []).length === 1, 'crearPostproceso se llama una sola vez');
okm(enUnaLinea(main, ['if (post) post.redimensionar(window.innerWidth, window.innerHeight);']), 'al redimensionar la ventana el postproceso (y su texel) se acomoda');
okm((main.match(/post\.redimensionar\(/g) || []).length >= 3, 'la escala de pantalla y el modo fluido también redimensionan el postproceso');

// ---------------------------------------------------------------- MUTACIONES
const MUTACIONES = [
  ['config.js', 'Media sin FXAA', 'antialias: true, fxaa: true, terrenoDetalle: 170', 'antialias: true, terrenoDetalle: 170'],
  ['config.js', 'Alta sin FXAA', 'antialias: true, fxaa: true, terrenoDetalle: 240', 'antialias: true, terrenoDetalle: 240'],
  ['config.js', 'Baja con FXAA (sin postproceso no hace nada y promete algo que no hay)', 'antialias: false, terrenoDetalle: 120, post: false', 'antialias: false, fxaa: true, terrenoDetalle: 120, post: false'],
  ['config.js', 'Mínima con MSAA', 'antialias: false, terrenoDetalle: 90, post: false', 'antialias: false, msaa: 4, terrenoDetalle: 90, post: false'],
  ['config.js', 'Media con MSAA 4 (3,8 ms medidos)', 'antialias: true, fxaa: true, terrenoDetalle: 170', 'antialias: true, fxaa: true, msaa: 4, terrenoDetalle: 170'],
  ['config.js', 'Alta con MSAA 2', 'antialias: true, fxaa: true, terrenoDetalle: 240', 'antialias: true, fxaa: true, msaa: 2, terrenoDetalle: 240'],
  ['postproceso.js', 'el define del FXAA nunca se pone', "(calidad.fxaa ? '#define HOJ_FXAA 1' + String.fromCharCode(10) : '')", "('')"],
  ['postproceso.js', 'el define se pone siempre', "(calidad.fxaa ? '#define HOJ_FXAA 1' + String.fromCharCode(10) : '')", "('#define HOJ_FXAA 1' + String.fromCharCode(10))"],
  ['postproceso.js', 'el color de la escena no pasa por el FXAA', '    vec3 c = escenaFx(vUv);', '    vec3 c = texture2D(uColor, vUv).rgb;'],
  ['postproceso.js', 'el FXAA toca también lo plano', 'if (lMax - lMin < max(0.04, lMax * 0.14)) return m;', 'if (lMax - lMin < 0.0) return m;'],
  ['postproceso.js', 'el FXAA desplaza sin tope', 'vec2(-6.0), vec2(6.0)', 'vec2(-60.0), vec2(60.0)'],
  ['postproceso.js', 'el FXAA no cuida el rango de luz', 'return (lB < lMin || lB > lMax) ? a : b;', 'return b;'],
  ['postproceso.js', 'la luma del FXAA es lineal', 'float lumaFx(vec3 c) { return sqrt(max(dot(c, vec3(0.299, 0.587, 0.114)), 0.0)); }', 'float lumaFx(vec3 c) { return max(dot(c, vec3(0.299, 0.587, 0.114)), 0.0); }'],
  ['postproceso.js', 'el FXAA lee de más', 'vec3 b = a * 0.5 + 0.25 * (texture2D(uColor, uv + dir * -0.5).rgb + texture2D(uColor, uv + dir * 0.5).rgb);', 'vec3 b = a * 0.5 + 0.25 * (texture2D(uColor, uv + dir * -0.5).rgb + texture2D(uColor, uv + dir * 0.5).rgb + texture2D(uColor, uv).rgb) * 0.75;'],
  ['postproceso.js', 'el destino ignora el msaa', '{ ...opciones, samples: muestras }', 'opciones'],
  ['postproceso.js', 'el msaa se pasa de lo que banca la placa', 'Math.min(renderer.capabilities.maxSamples || 0, calidad.msaa ?? 0)', 'Math.min(64, calidad.msaa ?? 0)'],
  ['postproceso.js', 'el msaa sin WebGL2', 'renderer.capabilities.isWebGL2 ? Math.max(0,', 'true ? Math.max(0,'],
  ['postproceso.js', 'el texel no sigue a la ventana', '    matComponer.uniforms.uTexel.value.set(1 / Math.max(1, ancho * p), 1 / Math.max(1, alto * p));\n', ''],
  ['postproceso.js', 'el texel inicial ignora la escala de pixeles', 'new THREE.Vector2(1 / Math.max(1, tam.x * pr), 1 / Math.max(1, tam.y * pr))', 'new THREE.Vector2(1 / Math.max(1, tam.x), 1 / Math.max(1, tam.y))'],
  ['postproceso.js', 'los rayos se compilan al girar hacia el sol y no al armar', 'renderer.compile(escenaPlana, camaraPlana);', ''],
  ['postproceso.js', 'los rayos se compilan contra la pantalla (otro programa)', 'renderer.setRenderTarget(rtRayos); renderer.compile', 'renderer.compile'],
  ['postproceso.js', 'el FXAA suma una pasada propia', '    pasada(matComponer, null);\n', '    pasada(matComponer, rtRayos2);\n    pasada(matComponer, null);\n'],
  ['postproceso.js', 'el FXAA se recompila en cada cuadro', '    pasada(matComponer, null);\n', '    matComponer.needsUpdate = true;\n    pasada(matComponer, null);\n'],
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
    const p = archivo === 'postproceso.js' ? copia('postproceso.js', nueva) : 'postproceso.js';
    const c = archivo === 'config.js' ? copia('config.js', nueva) : 'config.js';
    try { await revisar({ postUrl: urlSrc(p), configUrl: urlSrc(c), etiqueta: `mutación ${i}` }); sobrevivieron.push(nombre); }
    catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
} finally {
  for (const f of temporales) { try { fs.unlinkSync(f); } catch { /* ya no está */ } }
}
assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);
console.log(`verificar-4-12-0-bordes: ${total + enganche} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
