// 4.28.0 (A): el nivel Ultra — el ajuste, la luz y el cielo.
//
// Ultra es un ajuste aparte (`ajustes.ultra`, ver src/ultra.js) que sólo vale con la calidad en Alta. Lo de la zona A (src/ultra-luz.js y
// src/ultra-luz-mundo.js): el mapa de sombras de 4096 con el borde suave ancho, el cielo con dispersión de la atmósfera, la oclusión ambiental de
// pantalla y la niebla de altura de los valles. Todo se arma sólo con Ultra pedido y se desarma entero al apagarlo o al bajar la calidad.
//
// Esta prueba mira: las reglas puras (cuándo corre, la niebla por hora y clima, la mezcla del cielo, el cielo con dispersión en la CPU), que
// con Ultra apagado `crearUltraLuz` no crea ni compila nada ni toca el cielo, las sombras o el postproceso; que al prenderlo arma todo y al
// apagarlo devuelve todo como estaba; que el postproceso sin Ultra dibuja lo mismo que antes y con Ultra dibuja a su destino; que los
// programas de Alta (el cielo y la composición) no cambian; y el enganche de main.js y del menú. Después, MUTACIONES: cada regla rota en una
// copia del código tiene que hacer fallar la prueba.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(RAIZ, 'src');
const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const urlSrc = (f) => pathToFileURL(path.join(SRC, f)).href;

// un renderer de mentira: guarda qué se compila y a qué salida se dibuja
function rendererFalso() {
  const r = {
    capabilities: { isWebGL2: true, maxSamples: 8 }, autoClear: true, llamadas: [], compilados: [], salida: null,
    shadowMap: { needsUpdate: false },
    getSize(v) { v.set(1280, 720); return v; }, getPixelRatio() { return 1.5; },
    setRenderTarget(t) { r.salida = t; }, getRenderTarget() { return r.salida; }, clear() {},
    compile(o) { r.compilados.push(o.isScene ? o.children[0]?.material : o.material); },
    render(escena) { r.llamadas.push({ material: escena.isScene && escena.name !== 'escena' ? escena.children[0]?.material : null, escena: escena.name || '?', salida: r.salida }); },
  };
  return r;
}
// el cielo de mentira: lo que crearUltraLuz le pide al de cielo.js (con el material de verdad del cielo de Alta)
function cieloFalso(fragmento) {
  const material = new THREE.ShaderMaterial({ uniforms: { uSol: { value: new THREE.Vector3(0, 1, 0) } }, vertexShader: 'void main() {}', fragmentShader: fragmento, side: THREE.BackSide });
  const c = { material, malla: new THREE.Mesh(new THREE.SphereGeometry(1, 4, 3), material), sol: { color: new THREE.Color(1, 1, 1) }, sombras: [] };
  c.sombraUltra = (cfg) => { c.sombras.push(cfg); return true; };
  return c;
}
// el fragmento de verdad del cielo de Alta (sale de cielo.js tal cual, sin armar el cielo)
function fragmentoCieloDeAlta() {
  const t = leer('cielo.js');
  const i = t.indexOf('fragmentShader: /* glsl */`', t.indexOf('const matCielo')), j = t.indexOf('}`,', i);
  return t.slice(i + 'fragmentShader: /* glsl */`'.length, j + 1).replace(/\$\{GLSL_COMUN\}|\$\{GLSL_ESTILO\}/g, '').replace(/\$\{calidad\.post \? `[\s\S]*?` : ''\}/, '');
}

async function revisar({ reglasUrl, mundoUrl, postUrl, etiqueta = 'código' }) {
  let total = 0;
  const ok = (c, t) => { assert.ok(c, `${etiqueta}: ${t}`); total++; };
  const R = await import(reglasUrl);
  const { crearUltraLuz, fragmentoCieloUltra, fragmentoComponerUltra } = await import(mundoUrl);
  const { crearPostproceso } = await import(postUrl);
  const { CALIDADES } = await import(urlSrc('config.js'));

  // ------------------------------------------------------------ 1. cuándo corre Ultra
  const aj = (o) => ({ calidad: 'alta', ultra: true, ...o });
  ok(R.ultraPedido(aj(), 'alta', {}) === true, 'Ultra pedido con la calidad en Alta, el mundo en Alta y el postproceso');
  ok(R.ultraPedido(aj({ ultra: false }), 'alta', {}) === false, 'con el ajuste en No, nada');
  ok(R.ultraPedido(aj({ ultra: 'true' }), 'alta', {}) === false, 'el ajuste tiene que ser verdadero de verdad (no un texto)');
  for (const q of ['media', 'baja', 'muybaja']) ok(R.ultraPedido(aj({ calidad: q }), 'alta', {}) === false, `con la calidad en ${q} (por ejemplo, la autocalidad la bajó), Ultra queda inactivo`);
  ok(R.ultraPedido(aj(), 'media', {}) === false, 'con Alta elegida y el mundo armado en Media, no corre hasta volver a cargar');
  ok(R.ultraPedido(aj(), 'alta', null) === false, 'sin postproceso no hay Ultra');
  ok(R.ultraPedido(null, 'alta', {}) === false, 'sin ajustes, nada');

  // ------------------------------------------------------------ 2. la niebla de los valles y el cielo
  const n = (o) => R.nieblaDeValle(o);
  ok(n({ horas: 7 }).densidad > n({ horas: 13 }).densidad * 5, 'la niebla de los valles es mucho más densa a la mañana que a la siesta');
  ok(n({ horas: 13, lluvia: 1 }).densidad > n({ horas: 13 }).densidad * 4 && n({ horas: 13, lluvia: 1 }).alto > n({ horas: 13 }).alto, 'con lluvia es más densa y sube más');
  ok(n({ horas: 23 }).densidad > n({ horas: 13 }).densidad, 'de noche hay algo más que a la siesta');
  ok(n({ horas: 13 }).max < 0.7 && n({ horas: 13, lluvia: 1 }).max <= 0.85, 'nunca tapa del todo');
  ok(n({ horas: 31 }).densidad === n({ horas: 7 }).densidad && n({ horas: -17 }).densidad === n({ horas: 7 }).densidad, 'la hora da la vuelta (31 = 7 = -17)');
  ok(R.mezclaCielo(0.8, 0) > 0.85, 'de día el cielo con dispersión manda');
  ok(R.mezclaCielo(-0.3, 0) === 0, 'de noche cerrada el cielo es el pintado (estrellas, luna y la noche azul quedan como están)');
  ok(R.mezclaCielo(0.8, 1) < R.mezclaCielo(0.8, 0) * 0.3, 'con el cielo cubierto, casi todo pintado');
  const sol = (y) => { const l = Math.hypot(0.6, y); return { x: -0.6 / l, y: y / l, z: 0 }; };
  const cenit = R.cieloFisico({ x: 0, y: 1, z: 0 }, sol(1.6));
  ok(cenit[2] > cenit[1] && cenit[1] > cenit[0] && cenit[2] > 0.1, 'el cenit del mediodía es azul');
  const ocaso = R.cieloFisico({ x: -1, y: 0.02, z: 0 }, sol(0.02));
  ok(ocaso[0] > ocaso[2] * 1.4, 'el horizonte del lado del sol que se pone es anaranjado');
  ok(R.cieloFisico({ x: 0, y: 1, z: 0 }, sol(-0.6)).every((v) => v === 0), 'con el sol muy abajo, el cielo con dispersión se apaga');
  ok(R.SOMBRA_ULTRA.mapa === 4096 && R.SOMBRA_ULTRA.mapa > CALIDADES.alta.sombras, 'el mapa de sombras de Ultra es más grande que el de Alta');
  ok(R.SOMBRA_ULTRA.mapa / (2 * R.SOMBRA_ULTRA.caja) > CALIDADES.alta.sombras / (2 * CALIDADES.alta.sombraCaja) * 1.6, 'y con más detalle cerca tuyo (téxel más chico)');
  ok(R.SOMBRA_ULTRA.caja >= CALIDADES.alta.sombraCaja, 'y llega por lo menos igual de lejos');
  ok(R.SOMBRA_ULTRA.radio * (2 * R.SOMBRA_ULTRA.caja / R.SOMBRA_ULTRA.mapa) >= CALIDADES.alta.sombraSuave * (2 * CALIDADES.alta.sombraCaja / CALIDADES.alta.sombras) * 0.9, 'el borde suave mide en metros lo mismo que en Alta (no se ve el serrucho)');

  // la niebla volumétrica: capas con viento, más espesa en el bosque, bancos sobre el lago a la mañana, el sol con su sombra y las luces
  {
    const fn = (await import(mundoUrl)).FRAG_NIEBLA_PARA_PRUEBAS;
    const tiene = (...l) => typeof fn === 'string' && l.every((x) => fn.includes(x));
    ok(tiene('sampler2DShadow uSombra', 'uSolCol * fase * sombraSol(p)'), 'la luz del sol entra en la niebla con su mapa de sombras (los rayos entre las copas y por las ventanas)');
    ok(tiene('vec3(uViento.x, 0.0, uViento.y) * uTiempo', 'ruido3(q)'), 'las capas de niebla son ruido 3D que el viento arrastra');
    ok(tiene('texture2D(uBosque', 'uLagoDens * uManana'), 'más espesa entre los árboles y en bancos sobre el lago a la mañana');
    ok(tiene('uLuzPos[k]', 'uLuzDir[k]', 'uLuzCos[k]'), 'las luces cercanas (la linterna con su cono, los faroles) la iluminan');
    const nm = R.nieblaDeValle({ horas: 7 }), ns = R.nieblaDeValle({ horas: 13 });
    ok(nm.polvo > ns.polvo && nm.bosque > ns.bosque && nm.manana === 1 && ns.manana === 0, 'a la mañana hay más polvo y humedad en el bosque y bancos sobre el lago; a la siesta, no');
    const A = await import(urlSrc('ultra-aliento.js'));
    ok(A.frioDelAire({ invierno: 1, horas: 13 }) > A.ALIENTO.umbral && A.frioDelAire({ horas: 13 }) === 0 && A.frioDelAire({ otono: 1, horas: 23 }) > A.ALIENTO.umbral && A.frioDelAire({ otono: 1, horas: 14 }) < A.ALIENTO.umbral, 'el aliento se ve con frío: en invierno siempre, en otoño de noche, en verano nunca');
  }

  // ------------------------------------------------------------ 3. con Ultra apagado no se crea nada
  const armar = () => {
    const renderer = rendererFalso(), escena = new THREE.Scene();
    escena.name = 'escena'; escena.fog = new THREE.FogExp2(0x8899aa, 0.01);
    const camara = new THREE.PerspectiveCamera(70, 16 / 9, 0.15, 8000);
    const cielo = cieloFalso(fragmentoCieloDeAlta());
    const post = crearPostproceso(renderer, escena, camara, { ...CALIDADES.alta });
    const enganches = [];
    const ponerOriginal = post.ponerUltra;
    post.ponerUltra = (u) => { enganches.push(u); ponerOriginal(u); };
    const ultra = crearUltraLuz({ renderer, escena, camara, cielo, post });
    return { renderer, escena, camara, cielo, post, ultra, enganches };
  };
  const luz = { dia: 1, solDir: new THREE.Vector3(0.3, 0.9, 0.2).normalize() }, clima = { nublado: 0, lluvia: 0 };
  {
    const m = armar(), compAntes = m.renderer.compilados.length, matCielo = m.cielo.material;
    for (let i = 0; i < 20; i++) ok(m.ultra.actualizar(false, luz, clima, 7 + i) === false, 'con Ultra apagado actualizar no hace nada');
    ok(m.ultra.sincronizar(false) === false && !m.ultra.activo, 'sincronizar(false) deja todo apagado');
    ok(m.renderer.compilados.length === compAntes, 'con Ultra apagado no se compila ningún programa');
    ok(m.cielo.malla.material === matCielo, 'el cielo sigue con su material de Alta');
    ok(m.cielo.sombras.length === 0, 'las sombras no se tocan');
    ok(m.enganches.length === 0, 'el postproceso no recibe nada');
    ok(m.ultra.stats.armados === 0, 'no se armó nada');
    ok(!m.escena.getObjectByName('ultra-aliento'), 'ni el aliento');
    // el postproceso, sin Ultra, dibuja lo mismo que antes (5 dibujos sin sol en pantalla, la escena a su destino y la composición de Alta a la pantalla)
    m.renderer.llamadas.length = 0;
    m.post.render({ noche: 0, rayos: 0.6, solDir: null, tiempo: 1, dt: 1 / 60, exposicion: 1 });
    const ll = m.renderer.llamadas;
    ok(ll.length === 7, 'sin Ultra: escena + brillo + 4 desenfoques (dos pasadas en Alta) + composición = 7 dibujos, como en la 4.27.0');
    ok(ll[0].escena === 'escena' && ll[0].salida === m.post.destino, 'sin Ultra la escena va al destino de siempre');
    ok(ll[6].material === m.post.materialComponer && ll[6].salida === null, 'sin Ultra la composición es la de Alta');
  }

  // ------------------------------------------------------------ 4. prender y apagar
  {
    const m = armar(), matCielo = m.cielo.material, compAntes = m.renderer.compilados.length;
    ok(m.ultra.actualizar(true, luz, clima, 12) === true && m.ultra.activo, 'con Ultra pedido se arma');
    ok(m.cielo.malla.material !== matCielo && m.cielo.malla.material.fragmentShader.includes('cieloFisicoU'), 'el cielo pasa al material con dispersión');
    ok(m.cielo.sombras.length === 1 && m.cielo.sombras[0] && m.cielo.sombras[0].mapa === 4096, 'las sombras pasan al mapa de Ultra');
    ok(m.enganches.length === 1 && m.enganches[0] === m.ultra, 'el postproceso recibe el enganche de Ultra');
    ok(m.renderer.compilados.length - compAntes === 5 && !!m.escena.getObjectByName('ultra-aliento'), 'se compilan los cinco programas nuevos (oclusión, niebla, composición, cielo y aliento) al prenderlo, no a mitad de juego');
    ok(m.ultra.destino.depthTexture && m.ultra.destino.depthTexture.isDepthTexture, 'el destino de Ultra tiene textura de profundidad');
    ok(m.ultra.destino.width === m.post.destino.width && m.ultra.destino.texture.type === m.post.destino.texture.type, 'del mismo tamaño y tipo que el de Alta (los programas de la escena no cambian)');
    ok(!/uProf|uNiebla/.test(m.post.materialComponer.fragmentShader) && !/uUltraCielo/.test(matCielo.fragmentShader), 'prendido, los materiales de Alta siguen intactos (sus programas no cambian)');
    m.ultra.actualizar(true, luz, clima, 13);
    ok(m.ultra.stats.armados === 1, 'prendido, no se rearma en cada cuadro');
    m.renderer.llamadas.length = 0;
    m.post.render({ noche: 0, rayos: 0.6, solDir: null, tiempo: 1, dt: 1 / 60, exposicion: 1 });
    const ll = m.renderer.llamadas;
    ok(ll[0].escena === 'escena' && ll[0].salida === m.ultra.destino, 'con Ultra la escena va al destino con profundidad');
    ok(ll.length === 9 && ll[8].salida === null && ll[8].material !== m.post.materialComponer && ll[6].salida && ll[7].salida && ll[6].salida !== ll[7].salida && ll[6].salida !== m.post.destino, 'con Ultra: dos pasadas más (la oclusión y la niebla volumétrica, a media resolución) y la composición propia a la pantalla');
    m.post.redimensionar(1000, 600);
    ok(m.ultra.destino.width === 1500 && m.ultra.destino.height === 900, 'el destino de Ultra sigue a la ventana');
    // apagar (o bajar la calidad): todo vuelve
    ok(m.ultra.actualizar(false, luz, clima, 14) === false && !m.ultra.activo, 'al dejar de pedirlo se apaga');
    ok(m.cielo.malla.material === matCielo, 'el cielo vuelve a su material de Alta');
    ok(m.cielo.sombras.length === 2 && m.cielo.sombras[1] === null, 'las sombras vuelven a las de la calidad');
    ok(m.enganches.length === 2 && m.enganches[1] === null, 'el postproceso se desengancha');
    ok(m.ultra.stats.desarmados === 1, 'se desarmó una vez');
    ok(!m.escena.getObjectByName('ultra-aliento'), 'y el aliento sale de la escena');
    m.renderer.llamadas.length = 0;
    m.post.render({ noche: 0, rayos: 0.6, solDir: null, tiempo: 1, dt: 1 / 60, exposicion: 1 });
    ok(m.renderer.llamadas.length === 7 && m.renderer.llamadas[0].salida === m.post.destino && m.renderer.llamadas[6].material === m.post.materialComponer, 'apagado, el postproceso dibuja otra vez como Alta');
  }

  // ------------------------------------------------------------ 5. los programas de Alta no cambian
  {
    const m = armar(), base = m.post.materialComponer.fragmentShader, cieloBase = fragmentoCieloDeAlta();
    ok(!/uProf|uAO|uNiebla/.test(base), 'la composición de Alta no trae nada de Ultra');
    ok(!/uUltraCielo|cieloFisicoU/.test(leer('cielo.js')), 'el cielo de Alta (cielo.js) no trae nada de Ultra');
    const fu = fragmentoComponerUltra(base), cu = fragmentoCieloUltra(cieloBase);
    ok(fu.startsWith(base.slice(0, base.indexOf('  void main() {'))) && fu.endsWith(base.slice(base.indexOf('    c += texture2D(uBrillo, vUv).rgb * uBloom;'))), 'la composición de Ultra es la de Alta con un agregado (el resto, igual)');
    ok(fu.indexOf('uNieblaTex') > 0 && fu.indexOf('c *= mix(1.0, aoS') < fu.indexOf('c += texture2D(uBrillo'), 'la oclusión y la niebla van antes del brillo y la curva');
    ok(cu.includes('uUltraCielo') && cu.indexOf('cieloFisicoU(d, uSol)') < cu.indexOf('// estrellas') && cu.indexOf('cieloFisicoU(d, uSol)') > cu.indexOf('disco_sol'), 'el cielo con dispersión entra entre el sol y las estrellas');
  }
  return total;
}

const total = await revisar({ reglasUrl: urlSrc('ultra-luz.js'), mundoUrl: urlSrc('ultra-luz-mundo.js'), postUrl: urlSrc('postproceso.js') });

// ---------------------------------------------------------------- el enganche de main.js y del menú (no corre en Node)
const main = leer('main.js'), plantilla = leer('plantilla.html'), guardado = leer('guardado.js');
let enganche = 0;
const okm = (c, t) => { assert.ok(c, `main.js: ${t}`); enganche++; };
okm(enUnaLinea(main, ['if (post) ultraLuz = crearUltraLuz({ renderer, escena, camara, cielo, post, T, bocas: bocasUltra });']), 'lo de Ultra se crea sólo con postproceso (y no arma nada hasta que se pide)');
okm(enUnaLinea(main, ['ultraLuz?.actualizar(ultraPedido(ajustes, calidadActiva, post), luzCielo, clima.estado, progreso.horas);']), 'cada cuadro pregunta si Ultra sigue pedido (si la calidad baja, se apaga solo)');
okm(enUnaLinea(main, ['ultraLuz?.sincronizar(ultraPedido(ajustes, calidadActiva, post));', 'compilan acá, con los de la carga']), 'con Ultra pedido, sus programas se compilan en la carga');
okm(main.indexOf('ultraLuz?.sincronizar(ultraPedido(ajustes, calidadActiva, post));') < main.indexOf('await variantesLuces.compilarCarga(jugador.estado.pos);   // 3.3'), 'antes de compilar la carga');
okm(enUnaLinea(main, ["if (clave === 'ultra' || clave === 'calidad') ultraLuz?.sincronizar(ultraPedido(ajustes, calidadActiva, post));"]), 'en el menú se prende y se apaga en vivo');
okm(enUnaLinea(main, ["if (clave === 'ultra') v = v === 'true';"]), 'el ajuste se guarda como verdadero o falso');
okm(enUnaLinea(main, ["document.querySelectorAll('[data-ajuste=\"ultra\"] button').forEach((b) => { b.disabled = !alta; });"]), 'sin calidad Alta los botones quedan grises');
okm(main.includes("'Necesita calidad Alta'") && main.includes("'Se aplica al volver a cargar.'"), 'con el motivo debajo');
okm(!/ajustes\.ultra\s*=[^=]/.test(main) && !/ultra\s*=\s*true/.test(leer('autocalidad.js')), 'la autocalidad (ni nada del juego) prende Ultra solo');
okm(plantilla.includes('<span>Ultra (efectos nuevos, pide una buena placa)</span>') && enUnaLinea(plantilla, ['data-ajuste="ultra"', 'data-valor="true">Sí</button>', 'data-valor="false">No</button>']), 'el menú de gráficos tiene el ajuste Sí/No');
okm(plantilla.indexOf('data-ajuste="ultra"') > plantilla.indexOf('id="aviso-calidad"'), 'debajo de la calidad gráfica');
{ const al = leer('ultra-aliento.js'); okm(al.includes('vAlfa *= smoothstep(0.5, 1.2, -mv.z);') && al.includes('uEscala * 0.08);') && al.includes('const ad = propio ? 0.6 : 0.12;'), 'el aliento no tapa la cámara: se apaga pegado al ojo, tiene tope de tamaño y el tuyo sale adelante (la mancha blanca con nieve)'); }
okm(/ultra: false,/.test(guardado) && /ultra: x\.ultra === true,/.test(guardado), 'el ajuste se guarda, apagado por defecto (la base de la 4.28.0)');

// ---------------------------------------------------------------- MUTACIONES (cada una en una copia con otro nombre, así el caché de módulos no las tapa)
const MUTACIONES = [
  ['ultra-luz.js', 'Ultra corre aunque el ajuste esté en No', "return esUltra(ajustes) && calidadActiva === 'alta' && !!hayPost;", 'return calidadActiva === \'alta\' && !!hayPost;'],
  ['ultra-luz.js', 'Ultra corre con el mundo armado en otra calidad', "return esUltra(ajustes) && calidadActiva === 'alta' && !!hayPost;", 'return esUltra(ajustes) && !!hayPost;'],
  ['ultra-luz.js', 'la niebla de la mañana no espesa', 'densidad: 0.0012 + manana * 0.005', 'densidad: 0.0012 + manana * 0.0'],
  ['ultra-luz.js', 'el cielo con dispersión también de noche', 'return 0.9 * suave(-0.2, -0.04, solY)', 'return 0.9 * suave(-2, -1, solY)'],
  ['ultra-luz.js', 'el mapa de sombras de Ultra es el de Alta', 'mapa: 4096, caja: 125', 'mapa: 2048, caja: 125'],
  ['ultra-luz-mundo.js', 'se arma aunque no se pida', '    if (pedido && !partes) armar();', '    if (!partes) armar();'],
  ['ultra-luz-mundo.js', 'al apagarlo el cielo no vuelve', '    cielo.malla.material = p.cieloBase;\n', '\n'],
  ['ultra-luz-mundo.js', 'al apagarlo las sombras no vuelven', '    cielo.sombraUltra(null);\n', '\n'],
  ['ultra-luz-mundo.js', 'al apagarlo el postproceso sigue enganchado', '    post.ponerUltra(null);\n', '\n'],
  ['ultra-luz-mundo.js', 'no se compila al prender (se compilaría a mitad de juego)', '      quad.material = matAO; renderer.setRenderTarget(rtAO); renderer.compile(plano, camPlana);\n', '\n'],
  ['ultra-luz-mundo.js', 'la profundidad no viene con el destino', 'depthTexture: new THREE.DepthTexture(ancho, alto), ', ''],
  ['ultra-luz-mundo.js', 'la oclusión no se dibuja', '    pasada(p.matAO, p.rtAO);\n', '\n'],
  ['ultra-luz-mundo.js', 'la composición de Ultra pisa la de Alta', '      vertexShader: base.vertexShader, fragmentShader: fragmentoComponerUltra(base.fragmentShader),', '      vertexShader: base.vertexShader, fragmentShader: (base.fragmentShader = fragmentoComponerUltra(base.fragmentShader)),'],
  ['ultra-luz-mundo.js', 'la niebla volumétrica no se dibuja', '    pasada(p.matNiebla, p.rtNiebla);\n', '\n'],
  ['ultra-luz-mundo.js', 'al apagarlo el aliento queda en la escena', '    p.aliento.desarmar();\n', '\n'],
  ['ultra-luz-mundo.js', 'la niebla no toma la sombra del sol', 'uSolCol * fase * sombraSol(p)', 'uSolCol * fase'],
  ['postproceso.js', 'con Ultra la escena no va a su destino', '    const dst = ultra ? ultra.destino : destino;', '    const dst = destino;'],
  ['postproceso.js', 'con Ultra se compone dos veces', '    else\n    pasada(matComponer, null);\n', '    pasada(matComponer, null);\n'],
  ['postproceso.js', 'el destino de Ultra no sigue a la ventana', '    if (ultra) ultra.redimensionar(ancho * p, alto * p);   // 4.28.0 (Ultra)\n', '\n'],
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
    let reglas = 'ultra-luz.js', mundo = 'ultra-luz-mundo.js', post = 'postproceso.js';
    if (archivo === 'ultra-luz.js') { reglas = copia('ultra-luz.js', nueva); mundo = copia('ultra-luz-mundo.js', leer('ultra-luz-mundo.js').replace("from './ultra-luz.js'", `from './${reglas}'`)); }
    else if (archivo === 'ultra-luz-mundo.js') mundo = copia('ultra-luz-mundo.js', nueva);
    else post = copia('postproceso.js', nueva);
    try { await revisar({ reglasUrl: urlSrc(reglas), mundoUrl: urlSrc(mundo), postUrl: urlSrc(post), etiqueta: `mutación ${i}` }); sobrevivieron.push(nombre); }
    catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
} finally {
  for (const f of temporales) { try { fs.unlinkSync(f); } catch { /* ya no está */ } }
}
assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);

// las del enganche de main.js (texto): cada una tiene que romper una comprobación de arriba
const MUT_MAIN = [
  ['ultraLuz?.actualizar(ultraPedido(ajustes, calidadActiva, post), luzCielo', 'ultraLuz?.actualizar(true, luzCielo'],
  ["document.querySelectorAll('[data-ajuste=\"ultra\"] button').forEach((b) => { b.disabled = !alta; });", ''],
  ["if (clave === 'ultra' || clave === 'calidad') ultraLuz?.sincronizar(", "if (clave === 'ultra') ultraLuz?.sincronizar("],
];
for (const [de, a] of MUT_MAIN) {
  assert.equal(main.split(de).length - 1, 1, `la mutación de main.js encuentra «${de.slice(0, 50)}» una vez`);
  const m = main.replace(de, a);
  const sigue = enUnaLinea(m, ['ultraLuz?.actualizar(ultraPedido(ajustes, calidadActiva, post), luzCielo, clima.estado, progreso.horas);'])
    && enUnaLinea(m, ["document.querySelectorAll('[data-ajuste=\"ultra\"] button').forEach((b) => { b.disabled = !alta; });"])
    && enUnaLinea(m, ["if (clave === 'ultra' || clave === 'calidad') ultraLuz?.sincronizar(ultraPedido(ajustes, calidadActiva, post));"]);
  assert.ok(!sigue, `la mutación de main.js «${de.slice(0, 50)}» se atrapa`);
  atrapadas++;
}
void execFileSync;
console.log(`verificar-4-28-0-a: ${total + enganche} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length + MUT_MAIN.length} mutaciones atrapadas`);
