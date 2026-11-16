// 4.29.0 (A): Ultra en los detalles — el agua y el cielo.
//
// Lo de la zona A (todo sólo con Ultra prendido; con Ultra apagado no existe nada de esto):
//   · src/ultra-agua.js: el agua de Ultra (anillos de la lluvia y de tus pasos, espuma y chispas en el arroyo rápido) y el reflejo del lago en
//     la composición (lo que hay en pantalla: la orilla, los árboles, el cielo, ondulado por el viento);
//   · src/ultra-cielo.js: nubes con volumen (quietas en el mundo) y sus sombras en el valle, la Vía Láctea y las estrellas que titilan, el
//     halo de la luna con humedad, el relámpago (el cielo se enciende y se ve el rayo);
//   · src/ultra-luz.js (reglas puras) y src/ultra-luz-mundo.js (el enganche).
//
// Esta prueba mira las reglas (la sombra de las nubes según el día y el clima, la humedad del halo, cuándo se calcula el reflejo del lago, los
// anillos de las pisadas, el relámpago), que con Ultra apagado el lago y el arroyo siguen con su material y nada se compila, que al prenderlo
// pasan al agua de Ultra (que se compila al prender) y al apagarlo vuelven, que los programas de Alta (agua, cielo, composición) no cambian,
// y el enganche de main.js. Después, MUTACIONES: cada regla rota en una copia del código tiene que hacer fallar la prueba.
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
const urlSrc = (f) => pathToFileURL(path.join(SRC, f)).href;

function rendererFalso() {
  const r = {
    capabilities: { isWebGL2: true, maxSamples: 8 }, autoClear: true, llamadas: [], compilados: [], salida: null,
    shadowMap: { needsUpdate: false },
    getSize(v) { v.set(1280, 720); return v; }, getPixelRatio() { return 1.5; },
    setRenderTarget(t) { r.salida = t; }, getRenderTarget() { return r.salida; }, clear() {},
    compile(o) { r.compilados.push(o.isScene ? o.children[0]?.material : o.material); },
    render() {},
  };
  return r;
}
function fragmentoCieloDeAlta() {
  const t = leer('cielo.js');
  const i = t.indexOf('fragmentShader: /* glsl */`', t.indexOf('const matCielo')), j = t.indexOf('}`,', i);
  return t.slice(i + 'fragmentShader: /* glsl */`'.length, j + 1).replace(/\$\{GLSL_COMUN\}|\$\{GLSL_ESTILO\}/g, '').replace(/\$\{calidad\.post \? `[\s\S]*?` : ''\}/, '');
}
function cieloFalso() {
  const material = new THREE.ShaderMaterial({ uniforms: { uSol: { value: new THREE.Vector3(0, 1, 0) }, uTiempo: { value: 33 } }, vertexShader: 'void main() {}', fragmentShader: fragmentoCieloDeAlta(), side: THREE.BackSide });
  const c = { material, malla: new THREE.Mesh(new THREE.SphereGeometry(1, 4, 3), material), sol: { color: new THREE.Color(1, 1, 1), intensity: 1 }, sombras: [] };
  c.sombraUltra = (cfg) => { c.sombras.push(cfg); return true; };
  return c;
}
// el agua de verdad (agua.js), con un arroyo corto
const { crearAgua, ajustarAguaNueva } = await import(urlSrc('agua.js'));
const RIO = [{ x: 0, z: 0, s: 1, w: 2 }, { x: 10, z: 0, s: 0.5, w: 2 }, { x: 20, z: 0, s: 0, w: 2 }, { x: 30, z: 0, s: -0.2, w: 2 }];
const { LAGO, CALIDADES } = await import(urlSrc('config.js'));
const { crearPostproceso } = await import(urlSrc('postproceso.js'));

async function revisar({ reglasUrl, mundoUrl, aguaUrl, cieloUrl, etiqueta = 'código' }) {
  let total = 0;
  const ok = (c, t) => { assert.ok(c, `${etiqueta}: ${t}`); total++; };
  const R = await import(reglasUrl);
  const M = await import(mundoUrl);
  const AU = await import(aguaUrl);
  const C = await import(cieloUrl);

  // ------------------------------------------------------------ 1. las nubes: su sombra en el valle
  ok(R.sombraDeNubes({ dia: 1, nublado: 0.4 }) > 0.4, 'de día, con nubes sueltas, la sombra de las nubes se nota (le quita casi la mitad del sol)');
  ok(R.sombraDeNubes({ dia: 0, nublado: 0.4 }) === 0, 'de noche, nada');
  ok(R.sombraDeNubes({ dia: 1, nublado: 1 }) === 0, 'con el cielo cubierto no hay manchas (todo está a la sombra)');
  ok(R.sombraDeNubes({ dia: 1, nublado: 0.4, lluvia: 1 }) < R.sombraDeNubes({ dia: 1, nublado: 0.4 }) * 0.2, 'lloviendo, casi nada');
  ok(R.sombraDeNubes({ dia: 1, nublado: 0.4, solY: 0.12 }) < R.sombraDeNubes({ dia: 1, nublado: 0.4, solY: 0.6 }) * 0.2, 'con el sol bajo las sombras se estiran y se borran (no manchan los cerros de oscuro)');
  const v1 = R.vientoNubes(0.2), v2 = R.vientoNubes(1);
  ok(Math.hypot(v1.x, v1.z) >= 3 && Math.hypot(v1.x, v1.z) < 8 && Math.hypot(v2.x, v2.z) > Math.hypot(v1.x, v1.z) * 1.5, 'las sombras pasan despacio (unos metros por segundo), más rápido con viento');
  ok(R.NUBES_ULTRA.alto >= 1000 && R.NUBES_ULTRA.sombra > 0.3 && R.NUBES_ULTRA.sombra <= 0.6, 'las nubes andan alto y su sombra no es negra');
  {
    const f = M.FRAG_NIEBLA_PARA_PRUEBAS;
    ok(f.includes('float nubeSobre(vec3 p)') && f.includes('Tr *= 1.0 - uNubesF.z * nubeSobre(pw)'), 'la sombra de las nubes cae en el suelo y en todo lo que se ve (la pasada de la niebla tiene la posición de cada píxel)');
    ok(f.includes('(0.25 + 0.75 * alSol)'), 'lo que ya está a la sombra del sol no se oscurece dos veces');
    ok(f.includes('(1.0 - 0.65 * smoothstep(500.0, 2500.0, L))'), 'lejos (los cerros, la cordillera) la sombra se aclara con el aire');
    ok(C.GLSL_SOMBRA_NUBES.includes('vec2 c = p.xz + sd.xz * ((uNubesF.w - p.y) / sd.y);') && C.GLSL_SOMBRA_NUBES.includes('(c - uVientoNubesF * uNubesF.x)'), 'la sombra cae siguiendo al sol desde la altura de las nubes y el viento la arrastra');
    ok(C.GLSL_SOMBRA_NUBES.includes('float umbral = 0.64 - uNubesF.y * 0.36'), 'más manchas cuanto más cargado está el cielo');
  }

  // ------------------------------------------------------------ 2. la noche y la luna
  ok(R.humedadLuna({ horas: 23, nublado: 0.5, lluvia: 0.5 }) > R.humedadLuna({ horas: 23, nublado: 0 }) + 0.3, 'el halo de la luna crece con la humedad');
  ok(R.humedadLuna({ horas: 23, nublado: 1, lluvia: 1 }) <= 1 && R.humedadLuna({ horas: 14 }) >= 0, 'entre 0 y 1');
  ok(C.CIELO_NOCHE.includes('bandaU') && C.CIELO_NOCHE.includes('polvoU') && C.CIELO_NOCHE.includes('titU'), 'de noche: la Vía Láctea con franjas de polvo y estrellas que titilan');
  ok(C.CIELO_LUNA.includes('aU - 0.384') && C.CIELO_LUNA.includes('(0.2 + 0.8 * uHumedadLunaU)') && C.CIELO_LUNA.includes('anilloU * 0.16 * uHumedadLunaU'), 'el halo de 22 grados de la luna, con la humedad');

  // ------------------------------------------------------------ 3. el lago: cuándo se calcula el reflejo, los anillos de tus pasos
  ok(R.lagoCerca(LAGO.x, 2, LAGO.z, LAGO) && R.lagoCerca(LAGO.x + 300, 2, LAGO.z, LAGO), 'cerca del lago (o mirándolo desde la orilla) se calcula el reflejo');
  ok(!R.lagoCerca(37.9, 25, -363.3, LAGO) && !R.lagoCerca(LAGO.x + 600, 2, LAGO.z, LAGO), 'en la plaza (o lejos) no cuesta nada');
  ok(!R.lagoCerca(LAGO.x, -0.5, LAGO.z, LAGO), 'con la cámara bajo el agua, no');
  {
    const P = R.crearPisadasAgua();
    let anillos = 0;
    for (let i = 0; i <= 20; i++) if (P.actualizar(LAGO.x + 110 + i * 0.3, LAGO.z, -0.3, i * 0.2, LAGO)) anillos++;
    ok(anillos >= 9 && anillos <= 11, `caminando por el agua baja se abre un anillo cada medio metro (${anillos} en 6 m)`);
    ok(P.vivos(4.1) > 0 && P.vivos(4.1) <= R.PISADAS_AGUA.max && P.vivos(99) === 0, 'los anillos viven un rato y se apagan');
    const Q = R.crearPisadasAgua();
    let quieto = 0;
    for (let i = 0; i < 30; i++) if (Q.actualizar(LAGO.x + 110, LAGO.z, -0.3, i * 0.1, LAGO)) quieto++;
    ok(quieto === 0, 'parado en el agua no se abren anillos');
    const S = R.crearPisadasAgua();
    let seco = 0, hondo = 0;
    for (let i = 0; i < 20; i++) { if (S.actualizar(LAGO.x + 110 + i * 0.6, LAGO.z, 0.8, i * 0.2, LAGO)) seco++; }
    const D = R.crearPisadasAgua();
    for (let i = 0; i < 20; i++) { if (D.actualizar(LAGO.x + 50 + i * 0.6, LAGO.z, -4, i * 0.2, LAGO)) hondo++; }
    ok(seco === 0 && hondo === 0, 'en tierra seca y en lo hondo (nadando, en kayak), no');
    const F = R.crearPisadasAgua();
    let fuera = 0;
    for (let i = 0; i < 20; i++) { if (F.actualizar(LAGO.x + 500 + i * 0.6, LAGO.z, -0.3, i * 0.2, LAGO)) fuera++; }
    ok(fuera === 0, 'sólo en el lago');
  }
  ok(AU.GLSL_ANILLOS.includes('uLluviaAU') && AU.GLSL_ANILLOS.includes('uPasosU[i]'), 'los anillos: los de la lluvia y los de tus pasos');
  ok(AU.GLSL_REFLEJO_FUNCIONES.includes('olasVientoU(hp.xz) * (0.01 + 0.025 * uVientoC)') && AU.GLSL_REFLEJO_FUNCIONES.includes('anillosAguaU(hp.xz)'), 'el reflejo se ondula con el viento y con los anillos');
  ok(AU.GLSL_REFLEJO_FUNCIONES.includes('texture2D(uColor, s).rgb') && AU.GLSL_REFLEJO_FUNCIONES.includes('zEscenaU(s) > ' + R.REFLEJO_LAGO.lejano.toFixed(1)) && R.REFLEJO_LAGO.lejano >= 100, 'el reflejo toma lo que hay en pantalla (la orilla, los árboles) y, si no pega en nada cerca, lo lejano en esa dirección (los cerros, el cielo)');

  // ------------------------------------------------------------ 4. el relámpago
  {
    const e = {};
    const az = [0.25, 0.5, 0.1, 0.9];
    let k = 0;
    const azar = () => az[k++ % az.length];
    ok(R.seguirRelampago(e, 1, azar) === true && e.cuantos === 1 && e.dir.y > 0.1 && e.dir.y < 0.4, 'un destello nuevo cae en un rumbo del cielo (sobre el horizonte)');
    const d1 = { ...e.dir };
    ok(R.seguirRelampago(e, 0.8, azar) === false && e.dir.x === d1.x, 'mientras dura, el mismo rumbo');
    R.seguirRelampago(e, 0, azar);
    ok(R.seguirRelampago(e, 1, azar) === true && e.cuantos === 2 && e.dir.x !== d1.x, 'el siguiente, en otro rumbo');
    ok(C.CIELO_RELAMPAGO.includes('lineaU') && C.CIELO_RELAMPAGO.includes('(col * 0.5 + vec3(0.76, 0.83, 1.0) * (0.08 + 1.2 * pow(drU, 5.0))) * uRelampagoU.w'), 'el cielo se enciende (más del lado donde cae) y se ve el rayo');
  }

  // ------------------------------------------------------------ 5. Ultra apagado: nada; prendido: el agua de Ultra; apagado otra vez: todo vuelve
  const armar = () => {
    const renderer = rendererFalso(), escena = new THREE.Scene();
    escena.name = 'escena'; escena.fog = new THREE.FogExp2(0x8899aa, 0.01);
    const camara = new THREE.PerspectiveCamera(70, 16 / 9, 0.15, 8000);
    camara.position.set(LAGO.x, 2, LAGO.z + 140);
    const cielo = cieloFalso();
    const post = crearPostproceso(renderer, escena, camara, { ...CALIDADES.alta });
    ajustarAguaNueva(true);
    const agua = crearAgua({ rio: RIO, saltoAgua: null }, escena);
    const T = { altura: (x) => (x > LAGO.x + 100 ? -0.3 : 1), bosque: new Float32Array(4) };
    let pies = null;
    const ultra = M.crearUltraLuz({ renderer, escena, camara, cielo, post, T, agua, bocas: () => ({ jugador: null, vecinos: [], invierno: 0, otono: 0, pies }) });
    return { renderer, escena, camara, cielo, post, agua, ultra, ponerPies: (p) => { pies = p; } };
  };
  const luz = { dia: 1, solDir: new THREE.Vector3(0.3, 0.9, 0.2).normalize() }, clima = { nublado: 0.4, lluvia: 0, viento: 0.6 };
  {
    const m = armar(), mat = m.agua.mat, fragAlta = mat.fragmentShader, n0 = m.renderer.compilados.length;
    for (let i = 0; i < 10; i++) m.ultra.actualizar(false, luz, clima, 10 + i);
    m.ultra.relampago(0.9);
    ok(m.agua.lago.material === mat && m.agua.arroyo.material === mat, 'con Ultra apagado el lago y el arroyo siguen con su material de siempre');
    ok(m.renderer.compilados.length === n0 && m.ultra.stats.armados === 0, 'y no se compila nada (ni con un relámpago)');
    ok(!/anillosAguaU|espumaU|uPasosU/.test(fragAlta), 'el agua de Alta no trae nada de Ultra');
    ok(m.ultra.actualizar(true, luz, clima, 12) === true, 'se prende');
    const mu = m.agua.lago.material;
    ok(mu !== mat && mu === m.agua.arroyo.material && mu.name === 'agua-ultra', 'prendido, el lago y el arroyo pasan al agua de Ultra');
    ok(mu.fragmentShader.includes('anillosAguaU(vPos.xz)') && mu.fragmentShader.includes('col = mix(col, blancoU, espumaU * 0.85);') && mat.fragmentShader === fragAlta, 'el agua de Ultra es la de siempre con agregados; la de Alta no se toca (su programa no cambia)');
    ok(mu.uniforms.uTiempo === mat.uniforms.uTiempo && mu.uniforms.uSolDir === mat.uniforms.uSolDir, 'con los mismos uniformes (el sol, el tiempo, la lluvia del juego)');
    ok(m.renderer.compilados.includes(mu), 'el agua de Ultra se compila al prender (no a mitad de juego)');
    const p = m.ultra.partes;
    ok(p.matCielo.fragmentShader.includes('uUltraNubesU') && p.matCielo.fragmentShader.includes('n2U = fbm((uv + haciaLuz * 2.4)') && p.matCielo.fragmentShader.includes('bandaU') && p.matCielo.fragmentShader.includes('anilloU') && p.matCielo.fragmentShader.includes('lineaU'), 'el cielo de Ultra trae las nubes con volumen, la noche, el halo y el relámpago');
    ok(p.matComponer.fragmentShader.includes('if (uLagoVis > 0.5) c = reflejoLagoU(vUv, c);') && p.matComponer.fragmentShader.indexOf('reflejoLagoU(vUv, c)') < p.matComponer.fragmentShader.indexOf('c *= mix(1.0, aoS'), 'la composición de Ultra refleja el lago (antes de la oclusión y la niebla)');
    ok(p.matComponer.uniforms.uLagoVis.value === 1, 'con la cámara junto al lago, el reflejo se calcula');
    m.camara.position.set(37.9, 25, -363.3);
    m.ultra.actualizar(true, luz, clima, 12);
    ok(p.matComponer.uniforms.uLagoVis.value === 0, 'en la plaza, no');
    ok(p.matNiebla.uniforms.uNubesF.value[2] > 0.3 && Math.abs(p.matNiebla.uniforms.uNubesF.value[3] - R.NUBES_ULTRA.alto) < 1e-6, 'de día con nubes sueltas, la sombra de las nubes prendida');
    ok(Math.abs(p.matNiebla.uniforms.uVientoNubesF.value.x - R.vientoNubes(0.6).x) < 1e-6 && p.matNiebla.uniforms.uVientoNubesF.value.x > 0, 'el viento del clima arrastra las sombras');
    ok(p.matNiebla.uniforms.uNubesF.value[0] === 33, 'las nubes de la sombra andan con el reloj del cielo');
    m.ultra.actualizar(true, { dia: 0, solDir: new THREE.Vector3(0, -0.5, 1).normalize(), lunaDir: new THREE.Vector3(0, 0.6, 0.8) }, clima, 23);
    ok(p.matNiebla.uniforms.uNubesF.value[2] === 0, 'de noche la sombra de las nubes se apaga');
    // los anillos de tus pasos llegan al agua y al reflejo
    m.ponerPies({ x: LAGO.x + 110, z: LAGO.z });
    for (let i = 1; i <= 8; i++) { m.ponerPies({ x: LAGO.x + 110 + i * 0.6, z: LAGO.z }); m.ultra.actualizar(true, luz, clima, 12); }
    const pasos = p.comunAgua.uPasosU.value;
    ok(Array.from({ length: R.PISADAS_AGUA.max }, (_, i) => pasos[i * 4 + 3]).filter((f) => f > 0).length >= 5, 'caminando por la orilla, los anillos llegan al agua');
    ok(mu.uniforms.uPasosU === p.matComponer.uniforms.uPasosU, 'los mismos en el agua y en el reflejo');
    // el relámpago
    m.ultra.relampago(0.9);
    ok(Math.abs(p.matCielo.uniforms.uRelampagoU.value[3] - 0.9) < 1e-6 && p.matNiebla.uniforms.uRelampagoF.value > 0.2, 'el relámpago del juego enciende el cielo y el aire de Ultra');
    m.ultra.relampago(0);
    ok(p.matCielo.uniforms.uRelampagoU.value[3] === 0 && p.matNiebla.uniforms.uRelampagoF.value === 0, 'y se apaga');
    m.ultra.fijarRelampago(0.7);
    m.ultra.relampago(0);
    ok(Math.abs(p.matCielo.uniforms.uRelampagoU.value[3] - 0.7) < 1e-6, 'para las capturas, un relámpago quieto');
    m.ultra.fijarRelampago(-1);
    // apagar
    let tirado = false;
    const dispose = mu.dispose.bind(mu);
    mu.dispose = () => { tirado = true; dispose(); };
    ok(m.ultra.actualizar(false, luz, clima, 13) === false, 'se apaga');
    ok(m.agua.lago.material === mat && m.agua.arroyo.material === mat && tirado, 'al apagarlo el lago y el arroyo vuelven a su material (y el de Ultra se tira)');
  }
  return total;
}

const total = await revisar({ reglasUrl: urlSrc('ultra-luz.js'), mundoUrl: urlSrc('ultra-luz-mundo.js'), aguaUrl: urlSrc('ultra-agua.js'), cieloUrl: urlSrc('ultra-cielo.js') });

// ---------------------------------------------------------------- lo de Alta no cambia y el enganche de main.js
const main = leer('main.js');
let enganche = 0;
const okm = (c, t) => { assert.ok(c, `main.js: ${t}`); enganche++; };
okm(!/Ultra|ultra/.test(leer('agua.js')) && !/uUltraNubesU|nubeSobre|reflejoLagoU/.test(leer('cielo.js') + leer('postproceso.js')), 'el agua, el cielo y la composición de Alta no traen nada de Ultra (sus programas no cambian)');
okm(enUnaLinea(main, ['if (post) ultraLuz = crearUltraLuz({', 'agua });']), 'Ultra recibe el agua (con Ultra apagado no la toca)');
okm(enUnaLinea(main, ['const fogonazo = clima.actualizarTormenta(dt, cam, sonido);']) && main.indexOf('ultraLuz?.relampago(fogonazo);') > main.indexOf('const fogonazo = clima.actualizarTormenta(dt, cam, sonido);'), 'el relámpago del juego llega a Ultra');
okm(enUnaLinea(main, ["pies: js && js.pos && modo === 'jugando' ? { x: js.pos.x, z: js.pos.z } : null };"]), 'tus pasos llegan a Ultra (los anillos en el agua)');
okm(/new THREE\.ShaderMaterial/.test(leer('ultra-agua.js')) && !/new THREE\.ShaderMaterial/.test(leer('ultra-cielo.js')), 'lo nuevo con shader vive en src/ultra*.js (la regla de 0 shaders nuevos sigue para todo lo demás)');

// ---------------------------------------------------------------- MUTACIONES (copias de los cuatro módulos con otro nombre: el caché de módulos no las tapa)
const MUTACIONES = [
  ['ultra-luz.js', 'la sombra de las nubes también de noche', 'NUBES_ULTRA.sombra * suave(0.15, 0.6, Number(dia) || 0)', 'NUBES_ULTRA.sombra'],
  ['ultra-luz.js', 'la sombra de las nubes también con el cielo cubierto', '* (1 - suave(0.55, 0.92, nub))', ''],
  ['ultra-luz.js', 'las sombras de las nubes quietas', 'const v = NUBES_ULTRA.vel * (1 + 1.5 * entre(Number(viento) || 0, 0, 1.25));', 'const v = 0;'],
  ['ultra-luz.js', 'el halo no depende de la humedad', '(n.densidad - 0.0012) / 0.006 + nub * 0.8 + entre(Number(lluvia) || 0, 0, 1) * 0.4', '0.5'],
  ['ultra-luz.js', 'el reflejo del lago se calcula en todo el valle', 'return Math.hypot(dx, dz) < REFLEJO_LAGO.cerca;', 'return true;'],
  ['ultra-luz.js', 'parado en el agua se abren anillos', '      if (primera) return false;   // pararse en el agua no abre anillos: caminar, sí\n', '\n'],
  ['ultra-luz.js', 'anillos en tierra seca', 'piso < cfg.orilla && piso > cfg.hondo', 'piso > cfg.hondo'],
  ['ultra-luz.js', 'anillos en lo hondo', 'piso < cfg.orilla && piso > cfg.hondo', 'piso < cfg.orilla'],
  ['ultra-luz.js', 'cada destello en el mismo rumbo', "const nuevo = luz > 0.3 && !(estado.luz > 0.05);", 'const nuevo = !estado.dir;'],
  ['ultra-luz-mundo.js', 'el lago no pasa al agua de Ultra', '    if (matAgua) { if (agua.lago) agua.lago.material = matAgua; if (agua.arroyo) agua.arroyo.material = matAgua; }\n', '\n'],
  ['ultra-luz-mundo.js', 'al apagar el lago no vuelve', '    if (p.matAgua) { if (agua.lago) agua.lago.material = agua.mat; if (agua.arroyo) agua.arroyo.material = agua.mat; p.matAgua.dispose(); }   // 4.29.0 (A)\n', '\n'],
  ['ultra-luz-mundo.js', 'el agua de Ultra no se compila al prender', '      if (matAgua && agua.lago) renderer.compile(agua.lago, camara, escena);   // 4.29.0 (A): el agua de Ultra\n', '\n'],
  ['ultra-luz-mundo.js', 'la sombra de las nubes no se oscurece', '      Tr *= 1.0 - uNubesF.z * nubeSobre(pw) * (0.25 + 0.75 * alSol) * (1.0 - uInterior) * (1.0 - 0.65 * smoothstep(500.0, 2500.0, L));\n', '\n'],
  ['ultra-luz-mundo.js', 'el viento no arrastra las sombras', '    u.uVientoNubesF.value.set(vn.x, vn.z);\n', '\n'],
  ['ultra-luz-mundo.js', 'el reflejo del lago siempre apagado', '    uk.uLagoVis.value = lagoCerca(cam.x, cam.y, cam.z, LAGO) ? 1 : 0;\n', '\n'],
  ['ultra-luz-mundo.js', 'tus pasos no llegan al agua', "    p.pisadas.lista.forEach((a, i) => p.comunAgua.uPasosU.value.set([a.x, a.z, a.t, a.f], i * 4));\n", '\n'],
  ['ultra-luz-mundo.js', 'el relámpago no llega al cielo', '    p.matCielo.uniforms.uRelampagoU.value.set([p.rel.dir.x, p.rel.dir.y, p.rel.dir.z, luzR]);\n', '\n'],
  ['ultra-luz-mundo.js', 'el cielo de Ultra sin la noche', "  f = insertar(f, '        // luna' + NL, true, CIELO_NOCHE);\n", '\n'],
  ['ultra-luz-mundo.js', 'la sombra del sol se oscurece dos veces', '(0.25 + 0.75 * alSol)', '1.0'],
  ['ultra-agua.js', 'el agua de Ultra sin anillos', '  f = insertar(f, \'        vec3 N = normalize(vec3((n0 - nx) / e * fuerza * 0.08, 1.0, (n0 - nz) / e * fuerza * 0.08));\' + NL, false, AGUA_ANILLOS);\n', '\n'],
  ['ultra-agua.js', 'el arroyo sin espuma', "  f = insertar(f, '        float alineadoSol = max(dot(R, uSolDir), 0.0);', true, AGUA_ARROYO.trimStart() + '        ');\n", '\n'],
  ['ultra-agua.js', 'el agua de Ultra pisa la de Alta', '    vertexShader: base.vertexShader, fragmentShader: fragmentoAguaUltra(base.fragmentShader),', '    vertexShader: base.vertexShader, fragmentShader: (base.fragmentShader = fragmentoAguaUltra(base.fragmentShader)),'],
  ['ultra-luz.js', 'con el sol bajo las sombras siguen fuertes', '* suave(0.1, 0.35, Number(solY))', ''],
  ['ultra-agua.js', 'el reflejo no se ondula con el viento', 'olasVientoU(hp.xz) * (0.01 + 0.025 * uVientoC)', 'vec2(0.0) * uVientoC'],
  ['ultra-cielo.js', 'la sombra no depende de lo nublado', 'float umbral = 0.64 - uNubesF.y * 0.36', 'float umbral = 0.64'],
  ['ultra-cielo.js', 'la sombra no sigue al sol', 'vec2 c = p.xz + sd.xz * ((uNubesF.w - p.y) / sd.y);', 'vec2 c = p.xz;'],
  ['ultra-cielo.js', 'el halo sin humedad', '(0.2 + 0.8 * uHumedadLunaU)', '1.0'],
];
const MODULOS = ['ultra-luz.js', 'ultra-cielo.js', 'ultra-agua.js', 'ultra-luz-mundo.js'];
let atrapadas = 0;
const sobrevivieron = [];
const temporales = [];
try {
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [archivo, nombre, de, a] = MUTACIONES[i];
    const t = leer(archivo);
    assert.equal(t.split(de).length - 1, 1, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
    const nombres = Object.fromEntries(MODULOS.map((f) => [f, f.replace(/\.js$/, `.mut${i}.js`)]));
    for (const f of MODULOS) {
      let c = f === archivo ? t.replace(de, () => a) : leer(f);
      for (const g of MODULOS) c = c.split(`from './${g}'`).join(`from './${nombres[g]}'`);
      fs.writeFileSync(path.join(SRC, nombres[f]), c);
      temporales.push(path.join(SRC, nombres[f]));
    }
    try { await revisar({ reglasUrl: urlSrc(nombres['ultra-luz.js']), mundoUrl: urlSrc(nombres['ultra-luz-mundo.js']), aguaUrl: urlSrc(nombres['ultra-agua.js']), cieloUrl: urlSrc(nombres['ultra-cielo.js']), etiqueta: `mutación ${i}` }); sobrevivieron.push(nombre); }
    catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
} finally {
  for (const f of temporales) { try { fs.unlinkSync(f); } catch { /* ya no está */ } }
}
assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);

// las del enganche de main.js (texto)
const MUT_MAIN = [
  ['ultraLuz?.relampago(fogonazo);', ''],
  ['bocas: bocasUltra, agua });', 'bocas: bocasUltra });'],
  ["pies: js && js.pos && modo === 'jugando' ? { x: js.pos.x, z: js.pos.z } : null };", 'pies: null };'],
];
for (const [de, a] of MUT_MAIN) {
  assert.equal(main.split(de).length - 1, 1, `la mutación de main.js encuentra «${de.slice(0, 50)}» una vez`);
  const m = main.replace(de, a);
  const sigue = m.includes('ultraLuz?.relampago(fogonazo);') && enUnaLinea(m, ['if (post) ultraLuz = crearUltraLuz({', 'agua });']) && enUnaLinea(m, ["pies: js && js.pos && modo === 'jugando' ? { x: js.pos.x, z: js.pos.z } : null };"]);
  assert.ok(!sigue, `la mutación de main.js «${de.slice(0, 50)}» se atrapa`);
  atrapadas++;
}
console.log(`verificar-4-29-0-a: ${total + enganche} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length + MUT_MAIN.length} mutaciones atrapadas`);
