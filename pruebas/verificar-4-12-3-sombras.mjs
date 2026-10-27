// 4.12.3: sombras que llegan más lejos.
//
// Hasta la 4.12.0 había un solo mapa de sombras (1024 en Media, 2048 en Alta) sobre una caja de ±40 m (Media) o ±55 m (Alta) alrededor del jugador, y
// los árboles NO proyectaban sombra: las siluetas livianas del bosque (capa 1) nunca entraban al mapa porque en three r186 la pasada de sombras decide
// qué dibujar con las capas de la CÁMARA del juego, que sólo mira la capa 0. Ahora:
//   · la capa 1 se prende en la cámara sólo mientras se arma el mapa (`permitirSiluetasEnSombra`, cielo.js);
//   · la caja del mapa sale de la calidad (`sombraCaja`: ±70 en Media, ±110 en Alta) y los árboles proyectan hasta `sombraArboles`;
//   · el mapa se encaja en los téxeles en los ejes de la LUZ (`encajarEnTexeles`), no en x y z del mundo, y se rehace con un umbral que crece con la caja;
//   · Baja y Mínima no tienen sombras y no cambian.
// Esta prueba mira las reglas puras (sombras-alcance.js), la configuración de las cuatro calidades, el cielo armado de verdad (con el three real y sin placa),
// el interruptor de las siluetas con una cámara real, y el enganche de main.js y vegetacion.js. Después, MUTACIONES a propósito: cada regla rota en una
// copia del código tiene que hacer fallar la prueba.
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

// una dirección del sol de prueba (unitaria)
const unitaria = (x, y, z) => { const n = Math.hypot(x, y, z); return { x: x / n, y: y / n, z: z / n }; };
// el mismo reparto de ejes que arma lookAt con «arriba» = (0, 1, 0)
function ejesLuz(d) {
  const l = Math.hypot(d.z, d.x);
  const x = { x: d.z / l, y: 0, z: -d.x / l };
  const y = { x: d.y * x.z, y: d.z * x.x - d.x * x.z, z: -d.y * x.x };
  return { x, y };
}
const punto = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

async function revisar({ alcanceUrl, cieloUrl, configUrl, main, veg, etiqueta = 'código' }) {
  let total = 0;
  const ok = (c, t) => { assert.ok(c, `${etiqueta}: ${t}`); total++; };
  const eq = (a, b, t) => { assert.deepEqual(a, b, `${etiqueta}: ${t}`); total++; };
  const cerca = (a, b, t, tol = 1e-9) => { assert.ok(Math.abs(a - b) <= tol, `${etiqueta}: ${t} (${a} ≠ ${b})`); total++; };

  const A = await import(alcanceUrl);
  const { CALIDADES } = await import(configUrl);
  const { crearCielo, permitirSiluetasEnSombra } = await import(cieloUrl);

  // ------------------------------------------------------------ 1. reglas puras
  eq([A.cajaDeSombra(1024), A.cajaDeSombra(2048)], [40, 55], 'sin caja en la calidad valen las cajas de siempre (±40 con 1024, ±55 con 2048)');
  eq([A.cajaDeSombra(1024, 70), A.cajaDeSombra(2048, 110)], [70, 110], 'la caja de la calidad manda');
  eq([A.cajaDeSombra(1024, 0), A.cajaDeSombra(1024, NaN), A.cajaDeSombra(2048, undefined)], [40, 40, 55], 'una caja inválida cae a la de siempre');
  eq([A.distanciaLuz(40), A.distanciaLuz(55)], [150, 150], 'con las cajas de siempre la luz sigue a 150 m');
  ok(A.distanciaLuz(110) > 150 && A.distanciaLuz(110) >= 110 * 1.5, 'con una caja grande la luz se aleja (si no, lo de más allá del borde queda detrás de ella)');
  ok(A.distanciaLuz(70) > 110, 'con ±70 la luz queda a más de 110 m');
  eq(A.lejosDeLuz(40), 400, 'el rango de profundidad de siempre: 400 m');
  ok(A.lejosDeLuz(110) > A.distanciaLuz(110) + 200, 'el rango llega bastante más allá del blanco');
  ok(A.lejosDeLuz(150) > 450 && A.lejosDeLuz(110) > 400, 'con las cajas grandes el rango pasa de los 400 m de siempre');
  cerca(A.sesgoDeSombra(400), -0.0006, 'con el rango de siempre el sesgo es el de siempre');
  for (const caja of [40, 55, 70, 110, 150]) cerca(A.sesgoDeSombra(A.lejosDeLuz(caja)) * A.lejosDeLuz(caja), -0.0006 * 400, `el sesgo vale los mismos metros con la caja ${caja}`);
  // el corrimiento por normal de siempre con las cajas de siempre
  const viejo = (r, n) => 0.06 + 0.035 * (r - 1) * (2048 / Math.max(512, n));
  cerca(A.sesgoNormal(2.2, 1024, 40), viejo(2.2, 1024), 'sesgo de normal de Media con la caja de siempre');
  cerca(A.sesgoNormal(2.6, 2048, 55), viejo(2.6, 2048), 'sesgo de normal de Alta con la caja de siempre');
  ok(A.sesgoNormal(2.2, 1024, 70) > A.sesgoNormal(2.2, 1024, 40), 'con una caja más grande el téxel mide más metros y el corrimiento por normal crece');
  ok(A.sesgoNormal(2.6, 2048, 110) > A.sesgoNormal(2.6, 2048, 55), '… también en Alta');
  cerca(A.sesgoNormal(2.6, 4096, 110), A.sesgoNormal(2.6, 2048, 55), 'mismo téxel en metros (4096 con ±110 = 2048 con ±55) → mismo corrimiento');
  eq([A.umbralDeRecentrado(40), A.umbralDeRecentrado(55) >= 6, A.umbralDeRecentrado(110) <= 16, A.umbralDeRecentrado(500)], [6, true, true, 16], 'el umbral de recentrado: 6 m con la caja de siempre, crece con la caja y tiene techo');
  ok(A.umbralDeRecentrado(110) > A.umbralDeRecentrado(40), 'con la caja grande se rehace el mapa menos seguido');

  // encajar en téxeles, en los ejes de la luz
  const soles = [unitaria(0.5, 0.6, 0.62), unitaria(-0.8, 0.15, 0.3), unitaria(0.2, 0.95, -0.1), unitaria(1, 0.1, 0), unitaria(-0.3, 0.4, -0.86)];
  const lugares = [{ x: -120.37, y: 35.2, z: 231.9 }, { x: 18.5, y: 3.1, z: -300.77 }, { x: 0, y: 0, z: 0 }, { x: 301.123, y: 77.7, z: 41.9 }];
  for (const d of soles) for (const paso of [0.0537, 0.078125, 0.1074, 0.1367]) for (const t of lugares) {
    const s = A.encajarEnTexeles(t, d, paso);
    const { x, y } = ejesLuz(d);
    const a = punto(s, x) / paso, b = punto(s, y) / paso;
    ok(Math.abs(a - Math.round(a)) < 1e-6 && Math.abs(b - Math.round(b)) < 1e-6, `el blanco queda en la grilla de téxeles de la luz (sol ${d.x.toFixed(2)},${d.y.toFixed(2)},${d.z.toFixed(2)} paso ${paso})`);
    const dx = s.x - t.x, dy = s.y - t.y, dz = s.z - t.z;
    ok(Math.hypot(dx, dy, dz) <= paso * Math.SQRT1_2 + 1e-9, 'se corre menos de medio téxel en cada eje de la luz');
    cerca(dx * d.x + dy * d.y + dz * d.z, 0, 'no se corre a lo largo del rayo del sol (la profundidad no cambia)', 1e-9);
    const s2 = A.encajarEnTexeles(s, d, paso);
    cerca(Math.hypot(s2.x - s.x, s2.y - s.y, s2.z - s.z), 0, 'encajar dos veces da lo mismo', 1e-9);
  }
  // dos blancos del mismo téxel dan el mismo resultado (las sombras de lo quieto caen siempre en los mismos téxeles)
  { const d = soles[0], paso = 0.1074, { x, y } = ejesLuz(d); const t = { x: 40, y: 12, z: -77 };
    const mover = (u, v) => ({ x: t.x + x.x * u + y.x * v, y: t.y + y.y * v, z: t.z + x.z * u + y.z * v });
    const a = A.encajarEnTexeles(mover(0.2 * paso, 0.1 * paso), d, paso), b = A.encajarEnTexeles(mover(-0.2 * paso, -0.2 * paso), d, paso);
    cerca(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), 0, 'moverse menos de medio téxel no cambia dónde cae el mapa', 1e-9); }
  // el redondeo de antes (x y z del mundo) NO cae en la grilla de la luz cuando el sol viene de costado: por eso se cambió
  { const d = soles[0], paso = 0.1074, t = { x: -120.37, y: 35.2, z: 231.9 }, { x, y } = ejesLuz(d);
    const v = { x: Math.round(t.x / paso) * paso, y: t.y, z: Math.round(t.z / paso) * paso };
    const a = punto(v, x) / paso, b = punto(v, y) / paso;
    ok(Math.abs(a - Math.round(a)) > 1e-3 || Math.abs(b - Math.round(b)) > 1e-3, 'el redondeo de antes dejaba el mapa entre téxeles'); }
  // sol en el cenit: no hay «derecha» definida y se devuelve el blanco tal cual; paso inválido también
  eq(A.encajarEnTexeles({ x: 1, y: 2, z: 3 }, { x: 0, y: 1, z: 0 }, 0.1), { x: 1, y: 2, z: 3 }, 'con el sol en el cenit se devuelve el blanco sin tocar');
  eq(A.encajarEnTexeles({ x: 1, y: 2, z: 3 }, soles[0], 0), { x: 1, y: 2, z: 3 }, 'con un paso inválido se devuelve el blanco sin tocar');

  // ------------------------------------------------------------ 2. la configuración de las cuatro calidades
  for (const q of ['media', 'alta']) {
    const c = CALIDADES[q];
    ok(c.sombraSiluetas === true, `${q}: el bosque entra al mapa de sombras`);
    ok(Number.isFinite(c.sombraCaja) && c.sombraCaja > A.cajaDeSombra(c.sombras) && c.sombraCaja <= 160, `${q}: la caja llega más lejos que la de siempre (y no pasa de 160 m: más costaría dibujos y tirones sin ganar nitidez)`);
    ok(Number.isFinite(c.sombraArboles) && c.sombraArboles >= 45 && c.sombraArboles <= c.sombraCaja, `${q}: los árboles proyectan hasta cerca del borde de la caja (no más allá)`);
  }
  eq([CALIDADES.media.sombras, CALIDADES.alta.sombras], [1024, 2048], 'los tamaños de mapa no cambian (un mapa más grande cuesta memoria y tirones: ver CAMBIOS_4_12_3.md)');
  ok(CALIDADES.alta.sombraCaja > CALIDADES.media.sombraCaja, 'Alta llega más lejos que Media');
  eq([CALIDADES.media.sombraSuave, CALIDADES.alta.sombraSuave], [2.2, 2.6], 'el borde suave no cambia');
  for (const q of ['muybaja', 'baja']) {
    const c = CALIDADES[q];
    eq([c.sombras, c.sombraCaja, c.sombraArboles, c.sombraSiluetas], [0, undefined, undefined, undefined], `${q}: sin sombras y sin nada de lo nuevo (el costo no cambia)`);
  }

  // ------------------------------------------------------------ 3. el cielo armado de verdad (three real, sin placa)
  const armar = (q, extra = {}) => { const calidad = { ...CALIDADES[q], ...extra }; const escena = new THREE.Scene(); const cielo = crearCielo(escena, calidad); return { calidad, escena, cielo }; };
  for (const q of ['media', 'alta']) {
    const { calidad, cielo } = armar(q);
    const s = cielo.sol.shadow, cam = s.camera, caja = calidad.sombraCaja;
    ok(cielo.sol.castShadow === true, `${q}: el sol proyecta sombra`);
    eq([s.mapSize.width, s.mapSize.height], [calidad.sombras, calidad.sombras], `${q}: tamaño del mapa`);
    eq([cam.left, cam.right, cam.top, cam.bottom], [-caja, caja, caja, -caja], `${q}: la caja del mapa es la de la calidad (±${caja})`);
    eq([cam.near, cam.far], [1, A.lejosDeLuz(caja)], `${q}: el rango de profundidad acompaña a la caja`);
    cerca(s.bias, A.sesgoDeSombra(cam.far), `${q}: el sesgo`);
    cerca(s.radius, calidad.sombraSuave, `${q}: el borde suave`);
    cerca(s.normalBias, A.sesgoNormal(calidad.sombraSuave, calidad.sombras, caja), `${q}: el corrimiento por normal sigue al téxel`);
    ok(cam.layers.isEnabled(1), `${q}: la cámara de la luz mira la capa 1 (siluetas del bosque)`);
    ok(typeof cielo.reponerSombras === 'function', `${q}: hay reponerSombras (para medir variantes con ?debug=1)`);
  }
  for (const q of ['muybaja', 'baja']) {
    const { cielo } = armar(q);
    ok(cielo.sol.castShadow === false, `${q}: el sol no proyecta sombra`);
    eq([cielo.sol.shadow.camera.right, cielo.sol.shadow.mapSize.width], [5, 512], `${q}: la cámara de sombras ni se toca (queda la de fábrica de three)`);
  }
  // el cambio de calidad en vivo sigue la caja
  { const { calidad, cielo } = armar('alta');
    calidad.sombras = 1024; calidad.sombraCaja = 70;
    ok(cielo.ajustarSombras(1024) === true, 'ajustarSombras cambia el tamaño');
    eq([cielo.sol.shadow.mapSize.width, cielo.sol.shadow.camera.right], [1024, 70], 'al bajar de Alta a Media en vivo el mapa y la caja son los de Media');
    ok(cielo.ajustarSombras(1024) === false, 'con el mismo tamaño no hace nada');
    ok(cielo.ajustarSombras(0) === true && cielo.sol.castShadow === false, 'a 0 apaga las sombras');
    calidad.sombras = 2048; calidad.sombraCaja = 110;
    ok(cielo.ajustarSombras(2048) === true && cielo.sol.castShadow === true, 'y las vuelve a prender');
    eq([cielo.sol.shadow.mapSize.width, cielo.sol.shadow.camera.right, cielo.sol.shadow.radius], [2048, 110, 2.6], 'con la caja y el borde de Alta');
    calidad.sombraCaja = 90; calidad.sombras = 2048;
    ok(cielo.reponerSombras() === true && cielo.sol.shadow.camera.right === 90, 'reponerSombras toma la caja que tenga la calidad ahora'); }

  // el blanco de la luz se encaja en la grilla de téxeles de la luz al actualizar el cielo
  { const { calidad, cielo } = armar('alta');
    const clima = { nublado: 0, lluvia: 0 };
    for (const horas of [9, 12, 15.5, 18.6]) for (const cam of [{ x: -120.37, y: 36.8, z: 231.9 }, { x: 301.1, y: 12.3, z: -77.7 }]) {
      cielo.actualizar(horas, clima, cam, 0);
      const sol = cielo.sol, paso = (sol.shadow.camera.right * 2) / calidad.sombras;
      const dir = { x: sol.position.x - sol.target.position.x, y: sol.position.y - sol.target.position.y, z: sol.position.z - sol.target.position.z };
      const dist = Math.hypot(dir.x, dir.y, dir.z); const d = { x: dir.x / dist, y: dir.y / dist, z: dir.z / dist };
      cerca(dist, A.distanciaLuz(sol.shadow.camera.right), `a las ${horas} h la luz está a la distancia de la caja`, 1e-6);
      const { x, y } = ejesLuz(d); const t = sol.target.position;
      const a = punto(t, x) / paso, b = punto(t, y) / paso;
      ok(Math.abs(a - Math.round(a)) < 1e-4 && Math.abs(b - Math.round(b)) < 1e-4, `a las ${horas} h el blanco de la luz cae en un téxel del mapa`);
      ok(Math.hypot(t.x - cam.x, t.y - cam.y, t.z - cam.z) < paso * 1.5, `a las ${horas} h el blanco sigue a la cámara (a menos de un téxel y medio)`);
    } }
  // sin sombras (Baja) el blanco queda en la cámara, sin encajar
  { const { cielo } = armar('baja'); cielo.actualizar(12, { nublado: 0, lluvia: 0 }, { x: -120.37, y: 36.8, z: 231.9 }, 0);
    eq([cielo.sol.target.position.x, cielo.sol.target.position.z], [-120.37, 231.9], 'Baja: el blanco de la luz queda donde la cámara'); }

  // ------------------------------------------------------------ 4. las siluetas del bosque entran a la pasada de sombras
  { const camara = new THREE.PerspectiveCamera();
    const visto = [];
    const renderer = { shadowMap: { render(luces, escena, cam) { visto.push({ cam, capa1: cam.layers.isEnabled(1), capa0: cam.layers.isEnabled(0) }); return 'listo'; } } };
    const malla = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); malla.layers.set(1);
    ok(malla.layers.test(camara.layers) === false, 'sin el arreglo, una malla de la capa 1 no pasa el filtro de la cámara del juego (la causa de que el bosque no diera sombra)');
    ok(permitirSiluetasEnSombra(renderer) === true, 'se engancha');
    eq(renderer.shadowMap.render([], null, camara), 'listo', 'devuelve lo que devolvía');
    ok(visto[0].capa1 && visto[0].capa0, 'mientras se arma el mapa la cámara ve la capa 0 y la 1');
    ok(camara.layers.isEnabled(1) === false && camara.layers.isEnabled(0), 'después la cámara vuelve a mirar sólo la capa 0 (el dibujo normal no pinta las siluetas)');
    ok(permitirSiluetasEnSombra(renderer) === false, 'engancharse dos veces no apila nada');
    camara.layers.enable(1); renderer.shadowMap.render([], null, camara);
    ok(camara.layers.isEnabled(1), 'si la capa 1 ya estaba prendida no se la apaga');
    camara.layers.disable(1);
    renderer.shadowMap.__siluetasActivas = false; renderer.shadowMap.render([], null, camara);
    ok(visto[visto.length - 1].capa1 === false, 'el interruptor de las mediciones apaga las siluetas');
    renderer.shadowMap.__siluetasActivas = true;
    const roto = { shadowMap: { render() { throw new Error('placa'); } } };
    permitirSiluetasEnSombra(roto);
    assert.throws(() => roto.shadowMap.render([], null, camara), /placa/); total++;
    ok(camara.layers.isEnabled(1) === false, 'si la pasada falla la cámara igual vuelve a la capa 0');
    eq([permitirSiluetasEnSombra(null), permitirSiluetasEnSombra({}), permitirSiluetasEnSombra({ shadowMap: {} })], [false, false, false], 'sin renderer o sin pasada de sombras no hace nada'); }

  // ------------------------------------------------------------ 5. el enganche de main.js y vegetacion.js
  const okm = (c, t) => { assert.ok(c, `${etiqueta}: main.js: ${t}`); total++; };
  okm(enUnaLinea(main, ['if (calidad.sombraSiluetas) permitirSiluetasEnSombra(renderer);']), 'las siluetas se enganchan una vez, sólo con calidad.sombraSiluetas');
  okm((main.match(/permitirSiluetasEnSombra\(/g) || []).length === 1, 'permitirSiluetasEnSombra se llama una sola vez');
  okm(enUnaLinea(main, ["const camino = Math.hypot(cam.x - posSombra.x, cam.z - posSombra.z) > umbralDeRecentrado(cajaDeSombra(calidad.sombras, calidad.sombraCaja));"]), 'el mapa se rehace al alejarte más que el umbral de la caja');
  okm(/const CLAVES_CALIDAD_EN_VIVO = \[[^\]]*'sombraCaja', 'pixelRatio'\]/.test(main), 'al cambiar de calidad en vivo la caja de sombras sigue a la calidad');
  okm(enUnaLinea(main, ["if (new URLSearchParams(location.search).get('debug') === '1') { try { Object.assign(calidad, JSON.parse(new URLSearchParams(location.search).get('sombrasx') || '{}')); }"]), 'las variantes de las mediciones (sombrasx) sólo existen con ?debug=1');
  const okv = (c, t) => { assert.ok(c, `${etiqueta}: vegetacion.js: ${t}`); total++; };
  okv(enUnaLinea(veg, ['const alcanceSombra = calidad.sombraArboles ?? 45;']), 'hasta dónde proyectan los árboles sale de la calidad (45 m como antes si no hay)');
  okv(enUnaLinea(veg, ['if (m.sombra) m.sombra.visible = d < alcanceSombra;']), 'la silueta del tramo se prende dentro de ese alcance');
  okv(veg.includes('malla.sombra.layers.set(1);') && veg.includes('malla.sombra.castShadow = true;'), 'las siluetas siguen en la capa 1 y proyectando');
  okv(veg.includes('if (calidad.sombras) {') && veg.indexOf('if (calidad.sombras) {') < veg.indexOf('malla.sombra = hacer('), 'las siluetas sólo se arman con sombras (Baja y Mínima no gastan memoria ni dibujos)');

  return total;
}

const main = leer('main.js');
const veg = leer('vegetacion.js');
const total = await revisar({ alcanceUrl: urlSrc('sombras-alcance.js'), cieloUrl: urlSrc('cielo.js'), configUrl: urlSrc('config.js'), main, veg });

// ---------------------------------------------------------------- MUTACIONES
// [archivo, nombre, fragmento, reemplazo]
const MUTACIONES = [
  ['sombras-alcance.js', 'la caja de Media vuelve a 40 aunque la calidad diga otra', 'if (Number.isFinite(cajaConfig) && cajaConfig > 0) return cajaConfig;', ''],
  ['sombras-alcance.js', 'la luz no se aleja con la caja grande', 'return Math.max(150, Math.round(caja * 1.6));', 'return 150;'],
  ['sombras-alcance.js', 'la luz se aleja demasiado poco', 'return Math.max(150, Math.round(caja * 1.6));', 'return Math.max(150, Math.round(caja * 1.0));'],
  ['sombras-alcance.js', 'el rango de profundidad no crece', 'return distanciaLuz(caja) + 250;', 'return 400;'],
  ['sombras-alcance.js', 'el sesgo no se escala con el rango', 'return -0.0006 * 400 / lejos;', 'return -0.0006;'],
  ['sombras-alcance.js', 'el corrimiento por normal no crece con la caja', 'Math.max(1, caja / cajaAntes)', '1'],
  ['sombras-alcance.js', 'el corrimiento por normal también crece el término fijo', 'return 0.06 + 0.035 * (radio - 1) * (2048 / Math.max(512, tam)) * Math.max(1, caja / cajaAntes);', 'return (0.06 + 0.035 * (radio - 1) * (2048 / Math.max(512, tam))) * Math.max(1, caja / cajaAntes);'],
  ['sombras-alcance.js', 'el umbral de recentrado no crece', 'return Math.min(16, Math.max(6, Math.round(caja * 0.15)));', 'return 6;'],
  ['sombras-alcance.js', 'el umbral de recentrado no tiene techo', 'return Math.min(16, Math.max(6, Math.round(caja * 0.15)));', 'return Math.max(6, Math.round(caja * 0.15));'],
  ['sombras-alcance.js', 'encajar redondea x y z del mundo (como antes)', 'const da = Math.round(a / paso) * paso - a;\n  const db = Math.round(b / paso) * paso - b;\n  return { x: t.x + da * xx + db * yx, y: t.y + db * yy, z: t.z + da * xz + db * yz };', 'return { x: Math.round(t.x / paso) * paso, y: t.y, z: Math.round(t.z / paso) * paso };'],
  ['sombras-alcance.js', 'encajar corre también a lo largo del rayo', 'return { x: t.x + da * xx + db * yx, y: t.y + db * yy, z: t.z + da * xz + db * yz };', 'return { x: t.x + da * xx + db * yx + 0.3 * zx, y: t.y + db * yy + 0.3 * zy, z: t.z + da * xz + db * yz + 0.3 * zz };'],
  ['sombras-alcance.js', 'encajar usa un eje que no es el de la luz', 'const xx = zz / largo, xz = -zx / largo;', 'const xx = zx / largo, xz = zz / largo;'],
  ['sombras-alcance.js', 'encajar trunca en vez de redondear', 'const da = Math.round(a / paso) * paso - a;', 'const da = Math.floor(a / paso) * paso - a;'],
  ['sombras-alcance.js', 'encajar con el sol en el cenit divide por cero', 'if (!(paso > 0) || largo < 1e-4) return { x: t.x, y: t.y, z: t.z };', 'if (!(paso > 0)) return { x: t.x, y: t.y, z: t.z };'],
  ['config.js', 'Media sin siluetas', 'sombraSuave: 2.2, sombraSiluetas: true,', 'sombraSuave: 2.2,'],
  ['config.js', 'Alta sin siluetas', 'sombraSuave: 2.6, sombraSiluetas: true,', 'sombraSuave: 2.6,'],
  ['config.js', 'Media con la caja de siempre', 'sombraCaja: 70,', 'sombraCaja: 40,'],
  ['config.js', 'Alta con la caja de siempre', 'sombraCaja: 110,', 'sombraCaja: 55,'],
  ['config.js', 'Alta con una caja de 300 m', 'sombraCaja: 110,', 'sombraCaja: 300,'],
  ['config.js', 'los árboles de Media proyectan menos que antes', 'sombraArboles: 65 },', 'sombraArboles: 20 },'],
  ['config.js', 'los árboles de Alta proyectan más allá de la caja', 'sombraArboles: 105 },', 'sombraArboles: 400 },'],
  ['config.js', 'Alta con mapa de 4096', 'sombras: 2048, lejos: 310', 'sombras: 4096, lejos: 310'],
  ['config.js', 'Media con mapa de 2048', 'sombras: 1024, lejos: 230', 'sombras: 2048, lejos: 230'],
  ['config.js', 'Baja con sombras', 'baja: { pasto: 18000, radioPasto: 20, sombras: 0,', 'baja: { pasto: 18000, radioPasto: 20, sombras: 1024,'],
  ['config.js', 'Mínima con caja de sombras', 'muybaja: { pasto: 9000, radioPasto: 15, sombras: 0,', 'muybaja: { pasto: 9000, radioPasto: 15, sombraCaja: 70, sombras: 0,'],
  ['config.js', 'Baja con siluetas', 'baja: { pasto: 18000, radioPasto: 20, sombras: 0,', 'baja: { pasto: 18000, radioPasto: 20, sombraSiluetas: true, sombras: 0,'],
  ['cielo.js', 'la capa 1 nunca se prende (el bosque sigue sin dar sombra)', 'if (prendida) camara.layers.enable(capa);', ''],
  ['cielo.js', 'la capa 1 se queda prendida en la cámara (las siluetas se pintarían en pantalla)', 'finally { if (prendida) camara.layers.disable(capa); }', 'finally { /* queda */ }'],
  ['cielo.js', 'se apaga la capa 1 aunque ya estuviera prendida', 'const prendida = mapa.__siluetasActivas !== false && !!camara && !camara.layers.isEnabled(capa);', 'const prendida = mapa.__siluetasActivas !== false && !!camara; if (prendida && camara.layers.isEnabled(capa)) { /* sigue */ }'],
  ['cielo.js', 'el interruptor de las mediciones no hace nada', 'mapa.__siluetasActivas !== false && ', ''],
  ['cielo.js', 'engancharse dos veces apila envolturas', 'if (!mapa || typeof mapa.render !== \'function\' || mapa.__siluetasEnSombra) return false;', 'if (!mapa || typeof mapa.render !== \'function\') return false;'],
  ['cielo.js', 'la caja ignora la calidad', 'const s = cajaDeSombra(n, calidad.sombraCaja);', 'const s = cajaDeSombra(n, 0);'],
  ['cielo.js', 'la luz queda a 150 m aunque la caja sea grande', 'distLuz = distanciaLuz(s);', 'distLuz = 150;'],
  ['cielo.js', 'el rango de profundidad no sigue a la caja', 'const far = lejosDeLuz(s);', 'const far = 400;'],
  ['cielo.js', 'el sesgo no sigue al rango', 'sol.shadow.bias = sesgoDeSombra(far);', 'sol.shadow.bias = -0.0006;'],
  ['cielo.js', 'el corrimiento por normal ignora la caja', 'sol.shadow.normalBias = sesgoNormal(radio, n, s);', 'sol.shadow.normalBias = sesgoNormal(radio, n, 0);'],
  ['cielo.js', 'ajustarSombras no pone la caja', '    configurarSombra(n, n >= 2048 ? 2.6 : 2.2);   // 2.7: el mismo borde suave que al arrancar\n', '    sol.shadow.mapSize.set(n, n);\n'],
  ['cielo.js', 'el blanco se redondea en el mundo y no en los ejes de la luz', 'const t = encajarEnTexeles(cam, dirLuz, paso);', 'const t = { x: Math.round(cam.x / paso) * paso, y: cam.y, z: Math.round(cam.z / paso) * paso };'],
  ['cielo.js', 'el blanco no se encaja', 'const t = encajarEnTexeles(cam, dirLuz, paso);', 'const t = { x: cam.x, y: cam.y, z: cam.z };'],
  ['cielo.js', 'la luz se pone a 150 m al actualizar', 'sol.position.set(t.x + dirLuz.x * distLuz, t.y + dirLuz.y * distLuz, t.z + dirLuz.z * distLuz);', 'sol.position.set(t.x + dirLuz.x * 150, t.y + dirLuz.y * 150, t.z + dirLuz.z * 150);'],
  ['main.js', 'las siluetas se enganchan siempre', 'if (calidad.sombraSiluetas) permitirSiluetasEnSombra(renderer);', 'permitirSiluetasEnSombra(renderer);'],
  ['main.js', 'las siluetas nunca se enganchan', 'if (calidad.sombraSiluetas) permitirSiluetasEnSombra(renderer);', ''],
  ['main.js', 'el mapa se rehace a 6 m fijos', 'umbralDeRecentrado(cajaDeSombra(calidad.sombras, calidad.sombraCaja))', '6'],
  ['main.js', 'la caja no sigue a la calidad en vivo', "'aves', 'sombraCaja', 'pixelRatio'];", "'aves', 'pixelRatio'];"],
  ['main.js', 'las variantes de medición valen también sin ?debug=1', "if (new URLSearchParams(location.search).get('debug') === '1') { try { Object.assign(calidad,", "if (true) { try { Object.assign(calidad,"],
  ['vegetacion.js', 'los árboles proyectan sólo a 45 m aunque la calidad diga otra cosa', 'const alcanceSombra = calidad.sombraArboles ?? 45;', 'const alcanceSombra = 45;'],
  ['vegetacion.js', 'la silueta del tramo sigue en 45', 'if (m.sombra) m.sombra.visible = d < alcanceSombra;', 'if (m.sombra) m.sombra.visible = d < 45;'],
  ['vegetacion.js', 'las siluetas salen de la capa 1', 'malla.sombra.layers.set(1);', ''],
  ['vegetacion.js', 'las siluetas no proyectan', 'malla.sombra.castShadow = true;', ''],
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
    let alcance = 'sombras-alcance.js', cielo = 'cielo.js', config = 'config.js', m = main, v = veg;
    if (archivo === 'sombras-alcance.js') {
      alcance = copia('sombras-alcance.js', nueva);
      cielo = copia('cielo.js', leer('cielo.js').replace("from './sombras-alcance.js'", `from './${alcance}'`));
    } else if (archivo === 'cielo.js') cielo = copia('cielo.js', nueva);
    else if (archivo === 'config.js') config = copia('config.js', nueva);
    else if (archivo === 'main.js') m = nueva;
    else if (archivo === 'vegetacion.js') v = nueva;
    try { await revisar({ alcanceUrl: urlSrc(alcance), cieloUrl: urlSrc(cielo), configUrl: urlSrc(config), main: m, veg: v, etiqueta: `mutación ${i}` }); sobrevivieron.push(nombre); }
    catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
} finally {
  for (const f of temporales) { try { fs.unlinkSync(f); } catch { /* ya no está */ } }
}
assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);
console.log(`verificar-4-12-3-sombras: ${total} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
