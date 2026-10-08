// 3.0: adentro de la nave nodriza (ver `desafio-nave.js` para las reglas de la pelea).
// 3.8.0: la nave pasó a ser el Coihue Viejo: adentro está su corazón, una sala redonda de madera roja con
// el Rey Duende en su trono (en el lugar de la Madre), y se llega subiendo por la escalera de raíces del
// tronco hueco: una escalera de raíces que se camina (ver `hacerEntrada` y armarSubida). Las reglas y los nombres de adentro son
// los de siempre (ojos = las tres piedras de ámbar del trono, pilares = las raíces con su semilla dorada,
// corazón = el del Coihue, en el pecho del Rey); las mallas son las de desafio-coihue-formas.js.
//
// La cámara de adentro se arma por código, como todo: un piso de carne con venas que
// brillan, un domo de costillas, racimos de cristal, vainas en la pared de donde salen
// las crías y, en el medio, la Madre. Queda muy arriba del lugar donde se asentó la nave
// (cientos de metros): al subir por el haz se lleva al jugador hasta ahí, se esconde el
// valle, la niebla se cierra y la luz pasa a ser la de adentro. Al salir, todo vuelve.
//
// Las crías son invasores del mismo pool de siempre, marcados con `enNave`: las armas,
// la muerte y los cristales van por el camino de siempre, pero el andar lo maneja este
// módulo (el de afuera los pegaría al terreno del valle).
import * as THREE from 'three';
import { SALUD_MAX, dificultad } from './desafio-reglas.js';
import { NAVE, AVISO_FASE, naveNueva, puntosActivos, herirPunto, avanzarNave, criasDeFase, fraccionNave, textoNave, tocaOnda, tocaPua, dentroDeArena, fueraDelCuerpo, indiceFase } from './desafio-nave.js';
import { debilidadNave } from './desafio-asedio.js';
import { armarSubida, armarRey, geoSemilla, geoAmbar, herramientasCoihue, testigosCoihue } from './desafio-coihue-formas.js';
import { registrarLuz } from './luces.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Color();
const ARRIBA = new THREE.Vector3(0, 1, 0);
const R = NAVE.radioArena;

// ---------------------------------------------------------------- geometría
// Junta piezas en una sola geometría no indexada (posición, normal y color por vértice):
// un solo dibujo por material.
function unir(partes) {
  let total = 0;
  const listas = partes.map(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    total += g.attributes.position.count;
    return { g, color };
  });
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const { g, color } of listas) {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++, o++) {
      pos[o * 3] = p.getX(i); pos[o * 3 + 1] = p.getY(i); pos[o * 3 + 2] = p.getZ(i);
      nor[o * 3] = n.getX(i); nor[o * 3 + 1] = n.getY(i); nor[o * 3 + 2] = n.getZ(i);
      if (c) { col[o * 3] = c.getX(i); col[o * 3 + 1] = c.getY(i); col[o * 3 + 2] = c.getZ(i); }
      else if (typeof color === 'function') { const k = color(p.getX(i), p.getY(i), p.getZ(i)); col[o * 3] = k.r; col[o * 3 + 1] = k.g; col[o * 3 + 2] = k.b; }
      else { col[o * 3] = color.r; col[o * 3 + 1] = color.g; col[o * 3 + 2] = color.b; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}
const ruido = (x, y, z) => Math.sin(x * 1.7 + Math.sin(z * 1.3) * 1.4) * Math.sin(y * 2.1 + x * 0.7) * 0.5 + Math.sin(z * 2.9 + y * 1.1) * 0.25;
const vena = (x, z) => Math.abs(Math.sin(x * 0.55 + Math.sin(z * 0.31) * 2.2) * Math.sin(z * 0.62 + Math.sin(x * 0.27) * 1.9));
function colorear(geo, fn) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i), p.getY(i), p.getZ(i)); col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
// los tonos se piensan como se ven (sRGB): el color por vértice se guarda lineal
const C = (r, g, b) => _c.setRGB(r, g, b, THREE.SRGBColorSpace);

export function crearNaveMundo(T, escena, col, camara, efectos, sonido, api, opciones = {}) {
  const delValle = opciones.delValle || (() => false);
  let arena = null;             // la cámara armada (se arma la primera vez que se sube)
  let adentro = false, pelea = null, seq = null, hora = null;
  const crias = new Set();
  const ocultos = [];
  const DUENIO = { naveInterior: true };
  const S = () => api.S || {};

  // ---------------------------------------------------------------- DOM: barra y fundido
  const hud = document.createElement('div');
  hud.id = 'nave-hud';
  hud.style.cssText = 'position:fixed;top:58px;left:50%;transform:translateX(-50%);width:min(460px,72vw);text-align:center;color:#ffe8c0;font:600 14px system-ui,sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;z-index:6;display:none';
  const hudTitulo = document.createElement('div');
  const hudBarra = document.createElement('div');
  hudBarra.style.cssText = 'margin-top:5px;height:10px;border-radius:5px;background:rgba(26,14,6,.7);box-shadow:0 0 0 2px rgba(255,184,72,.55),0 0 14px rgba(255,184,72,.35);overflow:hidden';
  const hudRelleno = document.createElement('i');
  hudRelleno.style.cssText = 'display:block;height:100%;width:100%;background:linear-gradient(90deg,#c8501e,#ffcb52)';   // 3.8.0: en ámbar
  hudBarra.appendChild(hudRelleno);
  hud.append(hudTitulo, hudBarra);
  // 3.5.1: dentro del HUD del juego: al volver a la portada desde adentro, la barra de la Madre quedaba encima
  (document.getElementById('hud') || document.body).appendChild(hud);
  const velo = document.createElement('div');
  velo.id = 'nave-velo';
  velo.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;background:#fff';
  document.body.appendChild(velo);
  // 3.8.0: los programas del Coihue y del Rey se compilan en la carga (mallas chiquitas, bajo el mundo)
  escena.add(testigosCoihue());
  let opVelo = 0;
  function ponerVelo(v, color) {
    if (color && velo.style.background !== color) velo.style.background = color;
    const k = Math.max(0, Math.min(1, v));
    if (Math.abs(k - opVelo) < 0.004) return;
    opVelo = k; velo.style.opacity = String(k);
  }

  // ---------------------------------------------------------------- 3.8.0: el corazón del Coihue
  // La sala redonda del corazón: la pared de madera roja del coihue hueco (sube y se cierra arriba, con el
  // hueco de la luna), raíces que la recorren, puertitas de duendes donde estaban las vainas, hongos de luz
  // donde estaban los cristales, cuatro raíces-pilar con su semilla dorada, y en el medio el Rey Duende en
  // su trono de raíces. Detrás de la salida, la escalera de raíces por la que se sube (`subida`).
  const ESC_REY = 3.5;        // el Rey, agrandado (sentado, la cabeza a unos 10 m)
  const ALTO_SALA = 31;       // hasta el hueco de arriba
  const PUERTA_SALA = { medio: 0.065, alto: 3.6 };   // la puerta de la escalera, en la pared (ángulo 0, +x)
  function construir(sitio) {
    const t0 = performance.now();   // 3.8.0: lo que tarda en armarse (se arma al subir, detrás del fundido)
    const y = sitio.y + NAVE.alturaInterior;
    const grupo = new THREE.Group();
    grupo.position.set(sitio.x, y, sitio.z);
    grupo.visible = false;
    grupo.name = 'nave-interior';
    const basico = (extra = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, ...extra });
    const lambert = (extra = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...extra });
    const { pieza, raiz, fundirCorteza, fundirBrillo, deform, esfera, lathe, afinar, musgoEn, M4, V3, azar, ruido: ruidoC, sv, tinta, colorDe, halosDe, TAU } = herramientasCoihue;
    const r = azar(2027);
    const corteza = [], brillos = [], halos = [];

    // el piso: tierra oscura con raíces que la cruzan, manchas de musgo y un anillo de hongos alrededor del trono
    const piso = new THREE.RingGeometry(0.01, R + 1.2, 128, 64).rotateX(-Math.PI / 2);
    colorear(piso, (x, _, z) => {
      const rr = Math.hypot(x, z), v = vena(x, z);
      const raices = v < 0.06 ? 0.55 : v < 0.12 ? 0.22 : 0;
      const musgo = Math.max(0, ruido(x * 0.25, 0, z * 0.25) + 0.15) * 1.4;
      const anillo = Math.abs(rr - 8.5) < 0.22 || Math.abs(rr - 10.2) < 0.12 ? 0.6 : 0;
      const borde = Math.min(1, Math.max(0, (rr - R + 5) / 5));
      const base = 0.13 + ruido(x * 0.4, 0, z * 0.4) * 0.03 - borde * 0.03;
      return C(base * 1.25 + raices * 0.2 + anillo * 0.55 - musgo * 0.02, base * 0.95 + raices * 0.12 + musgo * 0.07 + anillo * 0.35, base * 0.7 + raices * 0.05 + anillo * 0.08);
    });
    grupo.add(new THREE.Mesh(piso, lambert()));

    // la pared: el coihue hueco por dentro. Con la puerta de la escalera (un hueco abajo, en +x) y el
    // dintel arriba de la puerta.
    const perfil = afinar([[R + 0.8, -0.4], [R + 1.1, 3], [R + 0.6, 8], [R - 0.5, 14], [R - 3, 20], [R - 8, 25], [R - 14, 28.5], [8, ALTO_SALA - 0.6], [3.2, ALTO_SALA], [0.01, ALTO_SALA + 0.4]], 4);
    const pintaPared = (c, p, n, l) => {
      const a = Math.atan2(l.x, l.z), yy = l.y;
      c.multiplyScalar(0.85 + 0.3 * (Math.sin(a * 23 + 4 * ruidoC(a * 2, yy * 0.15, 2)) * 0.5 + 0.5) * 0.6);
      tinta(c, '#3a2014', 0.75 * sv(14, ALTO_SALA - 2, yy));
      tinta(c, '#5a6a2a', 0.45 * sv(0.4, 0.9, ruidoC(a * 4, yy * 0.2, 7)) * sv(6, 0, yy));
      if (yy > ALTO_SALA - 0.2) c.set('#a8b8d0');   // el hueco de arriba: la luna
    };
    const pared = (desde, arco, perf) => {
      const gw = lathe(perf, Math.max(4, Math.round(72 * arco / TAU)), desde, arco);
      const I = gw.index.array; for (let t = 0; t < I.length; t += 3) { const k = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = k; }
      deform(gw, (v) => { const a = Math.atan2(v.x, v.z), rr = Math.hypot(v.x, v.z), k = 1 + 0.025 * ruidoC(a * 5, v.y * 0.2, 1) + 0.012 * Math.sin(a * 41 + v.y * 0.4); v.x *= k; v.z *= k; void rr; });
      corteza.push(pieza(gw, null, '#7a4430', { veta: (l) => [Math.atan2(l.x, l.z) * R * 0.5, l.y, 0.7], pintar: pintaPared }));
    };
    const m = PUERTA_SALA.medio;
    pared(Math.PI / 2 + m, TAU - 2 * m, perfil);
    {
      // el dintel: el perfil desde el alto de la puerta
      const arriba = [];
      for (let i = 0; i < perfil.length - 1; i++) {
        const [r0, y0] = perfil[i], [r1, y1] = perfil[i + 1];
        if (y1 <= PUERTA_SALA.alto) continue;
        if (y0 < PUERTA_SALA.alto) { const t = (PUERTA_SALA.alto - y0) / (y1 - y0); arriba.push([r0 + (r1 - r0) * t, PUERTA_SALA.alto]); }
        arriba.push([r1, y1]);
      }
      pared(Math.PI / 2 - m, 2 * m, arriba);
    }
    // el marco de la puerta: dos raíces que suben y se cierran en arco, y el umbral
    {
      const rp = R + 0.9, hw = Math.sin(m) * rp;
      for (const sz of [-1, 1]) corteza.push(raiz([[rp - 0.6, -0.1, sz * (hw + 0.5)], [rp - 0.45, 1.6, sz * (hw + 0.15)], [rp - 0.4, PUERTA_SALA.alto - 0.2, sz * hw * 0.8], [rp - 0.4, PUERTA_SALA.alto + 0.35, 0]], [0.42, 0.34, 0.3, 0.26], '#5a3a26', { nudos: 0.06, tramos: 18, pintar: (c, p, n) => musgoEn(c, p, n, 0.6) }));
      corteza.push(pieza(deform(esfera(14, 8), (v) => { if (v.y > 0) v.y *= 0.3; }), M4([rp - 0.7, 0, 0], [0, 0, 0], [0.9, 0.25, hw + 0.6]), '#6a4630', { veta: (l) => [l.x * 2, l.z * 2, 0.8] }));
    }
    // raíces que suben por la pared (lo que eran las costillas del domo)
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + 0.18 + (r() - 0.5) * 0.1;
      if (Math.abs(Math.atan2(Math.cos(a), Math.sin(a))) < 0.25) continue;   // la puerta (+x): a = π/2
      const pts = [0.6, 4, 9, 15, 21, 26].map((yy, k) => {
        const [rr] = perfil.find((p, j) => perfil[j + 1] && perfil[j + 1][1] >= yy) || perfil[0];
        const aa = a + Math.sin(k * 1.3 + i) * 0.03;
        return [Math.sin(aa) * (rr - 0.7), yy, Math.cos(aa) * (rr - 0.7)];
      });
      pts.unshift([Math.sin(a) * (R - 3.5), -0.2, Math.cos(a) * (R - 3.5)]);
      corteza.push(raiz(pts, [0.5, 0.55, 0.5, 0.45, 0.4, 0.32, 0.2], i % 2 ? '#5a3a26' : '#4a3020', { nudos: 0.12, tramos: 30, lados: 8, pintar: (c, p, n) => musgoEn(c, p, n, 0.7) }));
    }
    // raíces que cruzan el piso
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, a2 = a + (r() - 0.5) * 1.2, d0 = R - 1 - r() * 2, d1 = 11 + r() * 6;
      if (Math.abs(Math.atan2(Math.cos(a), Math.sin(a))) < 0.3) continue;
      corteza.push(raiz([[Math.sin(a) * d0, 0.25, Math.cos(a) * d0], [Math.sin((a + a2) / 2) * (d0 + d1) / 2, 0.18, Math.cos((a + a2) / 2) * (d0 + d1) / 2], [Math.sin(a2) * d1, -0.05, Math.cos(a2) * d1]], [0.42, 0.3, 0.08], '#4a3020', { nudos: 0.06, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
    }
    // hongos de luz al pie de la pared (donde la nave tenía los racimos de cristal)
    const hongo = (p, tam, col) => {
      corteza.push(pieza(deform(lathe([[0.001, 0], [0.12, 0], [0.1, 0.5], [0.08, 0.9], [0.001, 0.95]], 8), () => {}), M4(p, [0, 0, (r() - 0.5) * 0.4], [tam, tam, tam]), '#d8c8a4', { veta: () => [0, 0, 0.1] }));
      brillos.push(pieza(deform(lathe([[0.001, 0.85], [0.45, 0.82], [0.55, 0.95], [0.38, 1.12], [0.001, 1.18]], 12), () => {}), M4(p, [0, 0, 0], [tam, tam, tam]), col, { fuerza: 1.6 }));
    };
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * TAU + 0.55;
      if (Math.abs(Math.atan2(Math.cos(a), Math.sin(a))) < 0.3) continue;   // donde está la puerta, no
      const cx = Math.sin(a) * (R - 1.4), cz = Math.cos(a) * (R - 1.4);
      const col = i % 3 === 0 ? '#c8ff6a' : '#ffb040';
      for (let k = 0; k < 6; k++) hongo(V3(cx + Math.sin(a + k * 1.3) * 0.9, -0.02, cz + Math.cos(a + k * 1.3) * 0.9), 0.55 + ((i * 7 + k * 3) % 5) * 0.22, col);
      halos.push({ p: V3(cx, 1.0, cz), col, tam: 3.2 });
    }
    // faroles de hongos en repisas, en la pared, más arriba
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4 + 0.9, yy = 5 + (i % 5) * 3.4;
      if (Math.abs(Math.atan2(Math.cos(a), Math.sin(a))) < 0.3) continue;
      const [rr] = perfil.find((p, j) => perfil[j + 1] && perfil[j + 1][1] >= yy) || perfil[0];
      const p = V3(Math.sin(a) * (rr - 0.5), yy, Math.cos(a) * (rr - 0.5));
      corteza.push(pieza(deform(esfera(14, 6), (v) => { if (v.y > 0) v.y *= 0.4; else v.y *= 0.25; }), M4(p, [0, a, 0], [1.3, 0.5, 1.0]), '#c8a070', { veta: () => [0, 0, 0.1], pintar: (c, pp, n) => { if (n.y < 0) c.multiplyScalar(0.55); } }));
      const col = i % 2 ? '#c8ff6a' : '#ffb040';
      for (let k = 0; k < 4; k++) brillos.push(pieza(deform(esfera(10, 8), () => {}), M4(p.clone().add(V3((r() - 0.5) * 0.9, 0.2 + r() * 0.3, (r() - 0.5) * 0.9)), [0, 0, 0], [0.24, 0.22, 0.24]), col, { fuerza: 1.7 }));
      halos.push({ p: p.clone().add(V3(0, 0.4, 0)), col, tam: 4 });
    }

    // las puertitas de los duendes: de acá salen las crías (donde la nave tenía las vainas)
    const rajas = [];
    const lugaresVaina = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * (R - 0.4), z = Math.sin(a) * (R - 0.4), giro = Math.atan2(-x, -z);
      // 3.8.0: a la medida de los duendes (de 60-80 cm; el grandote, 1 m; el Mandamás, 1,3 m)
      const p = V3(x, 0.8, z);
      // el marco de raíz y la puerta, entreabierta
      for (const lado of [-1, 1]) corteza.push(raiz([[x, -0.1, z], [x, 1.15, z], [x, 1.75, z]].map((q, k) => [q[0] + lado * Math.cos(giro) * 0.62 * (k < 2 ? 1 : 0.5), q[1], q[2] - lado * Math.sin(giro) * 0.62 * (k < 2 ? 1 : 0.5)]), [0.2, 0.17, 0.13], '#5a3a26', { nudos: 0.04 }));
      corteza.push(pieza(new THREE.BoxGeometry(1.05, 1.55, 0.14), M4(p, [0, giro, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, pp, n, l) => { if (Math.abs(Math.sin(l.x * 12)) < 0.15) c.multiplyScalar(0.6); } }));
      // la ventanita redonda y la luz que se escapa por las rendijas
      brillos.push(pieza(new THREE.CircleGeometry(0.2, 14), M4(p.clone().add(V3(Math.sin(giro) * 0.09, 0.38, Math.cos(giro) * 0.09)), [0, giro, 0]), '#ffb860', { fuerza: 1.5 }));
      rajas.push({ geo: new THREE.BoxGeometry(0.09, 1.55, 0.1).rotateY(giro).translate(x + Math.sin(giro) * 0.1 + Math.cos(giro) * 0.55, 0.8, z + Math.cos(giro) * 0.1 - Math.sin(giro) * 0.55), color: new THREE.Color(1, 0.62, 0.25) });
      rajas.push({ geo: new THREE.BoxGeometry(1.05, 0.07, 0.1).rotateY(giro).translate(x + Math.sin(giro) * 0.1, 0.05, z + Math.cos(giro) * 0.1), color: new THREE.Color(1, 0.62, 0.25) });
      halos.push({ p: p.clone().add(V3(Math.sin(giro) * 0.4, 0.38, Math.cos(giro) * 0.4)), col: '#ffb860', tam: 1.8 });
      lugaresVaina.push({ x: Math.cos(a) * (R - 3.4), z: Math.sin(a) * (R - 3.4) });
    }
    const matRajas = basico();
    grupo.add(new THREE.Mesh(unir(rajas), matRajas));

    // la salida: la puerta de la escalera, con luciérnagas que dan vueltas (E baja al valle)
    const salida = { x: R - 3.2, z: 0 };
    const aro = (() => {
      const pos = [], cols = [];
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; pos.push(0, Math.sin(a) * 1.9 + (r() - 0.5) * 0.3, Math.cos(a) * 1.5 + (r() - 0.5) * 0.3); cols.push(1, 0.85, 0.45); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const pts = halosDe([{ p: V3(), col: '#ffd070', tam: 0.7 }]).children[0];
      pts.geometry.dispose(); pts.geometry = geo;
      return pts;
    })();
    aro.position.set(R - 0.6, 1.8, 0);
    grupo.add(aro);
    const charco = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffc870', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    charco.position.set(salida.x, 0.03, 0);
    grupo.add(charco);

    // la puerta de la escalera, cerrada (detrás está la subida: E la abre y baja), con la luz que se filtra
    {
      const rp = R + 0.75, hw = Math.sin(PUERTA_SALA.medio) * rp;
      corteza.push(pieza(new THREE.BoxGeometry(0.16, PUERTA_SALA.alto - 0.1, hw * 2 + 0.1), M4([rp, (PUERTA_SALA.alto - 0.1) / 2, 0]), '#7a4a2a', { veta: (l) => [l.z * 6, l.y, 0.6], pintar: (c, p, n, l) => { if (Math.abs(Math.sin(l.z * 9)) < 0.15) c.multiplyScalar(0.6); } }));
      brillos.push(pieza(new THREE.BoxGeometry(0.05, PUERTA_SALA.alto - 0.3, 0.07), M4([rp - 0.1, PUERTA_SALA.alto / 2, hw * 0.3]), '#ffb860', { fuerza: 1.4 }));
      brillos.push(pieza(new THREE.BoxGeometry(0.05, 0.06, hw * 2), M4([rp - 0.1, 0.05, 0]), '#ffb860', { fuerza: 1.4 }));
    }

    // ---------------- el Rey Duende (en el lugar de la Madre)
    const madre = new THREE.Group();
    grupo.add(madre);
    const cuerpo = new THREE.Group();   // gira para mirarte (con el trono)
    madre.add(cuerpo);
    const rey = armarRey(ESC_REY);
    rey.scale.setScalar(ESC_REY);
    cuerpo.add(rey);
    // el corazón del Coihue: en el pecho del Rey, adentro de una vaina de corteza que se abre en la última fase
    const pecho = V3(0, 1.26, 1.45).multiplyScalar(ESC_REY);
    const corazon = new THREE.Mesh(geoAmbar([0.82, 0.98, 0.7], 11), new THREE.MeshBasicMaterial({ vertexColors: true }));
    corazon.position.copy(pecho);
    corazon.add(halosDe([{ p: V3(0, 0, 0.4), col: '#ffa020', tam: 6 }]));
    cuerpo.add(corazon);
    const blancoCorazon = { asedio: true, nave: true, tipo: 'corazon', i: 0, pos: new THREE.Vector3(), radio: 2.4 };
    const gajos = [];
    for (let i = 0; i < 5; i++) {
      const phi0 = (i / 5) * Math.PI * 2, largo = (Math.PI * 2) / 5 * 0.97;
      // una cáscara de semilla (media esfera hacia adelante, en cinco gajos) de corteza con musgo
      const gg = new THREE.SphereGeometry(1.25, 10, 9, phi0, largo, 0, Math.PI / 2).rotateX(Math.PI / 2);
      const piv = new THREE.Group();
      piv.position.copy(pecho);
      piv.add(fundirCorteza([pieza(gg, null, '#7a5a40', { veta: (l) => [Math.atan2(l.x, l.y) * 2, l.z * 3, 0.9], pintar: (c, p, n, l) => { c.multiplyScalar(0.8 + 0.3 * (ruidoC(l.x * 3, l.y * 3, l.z * 3) * 0.5 + 0.5)); musgoEn(c, p, n, 0.5); } })]));
      cuerpo.add(piv);
      const pc = phi0 + largo / 2;
      // el eje: de costado al gajo (para que se abra hacia afuera, como una flor que mira adelante)
      const d = V3(-Math.cos(pc), -Math.sin(pc), 0);
      gajos.push({ piv, eje: V3(0, 0, 1).cross(d).normalize() });
    }
    // las tres piedras de ámbar del trono (donde la Madre tenía los ojos): una a los pies y dos en el respaldo
    const ojos = [];
    const lugarOjo = [[0, 1.8, 4.4], [2.094, 4.6, 3.9], [4.189, 4.6, 3.9]];
    for (let i = 0; i < NAVE.ojos; i++) {
      const [a, oy, orr] = lugarOjo[i % 3];
      const g = new THREE.Group();
      g.position.set(Math.sin(a) * orr, oy, Math.cos(a) * orr);
      g.rotation.y = a;
      const globo = new THREE.Mesh(geoAmbar([0.8, 1.02, 0.64], 3 + i), new THREE.MeshBasicMaterial({ vertexColors: true }));
      const pupila = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1).scale(1, 1.3, 0.5), new THREE.MeshBasicMaterial({ color: '#ffe48a' }));
      pupila.position.z = 0.55;
      globo.add(halosDe([{ p: V3(0, 0, 0.5), col: '#ffa830', tam: 3.2 }]));
      // el engarce de raíz
      const parpado = fundirCorteza([pieza(new THREE.TorusGeometry(0.95, 0.24, 8, 18).scale(1, 1.22, 1), null, '#4a3020', { veta: (l) => [Math.atan2(l.x, l.y), l.z * 4, 0.9], pintar: (c, p, n) => musgoEn(c, p, n, 0.6) })]);
      parpado.position.z = 0.1;
      const herida = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1).scale(1, 1.2, 0.6), new THREE.MeshBasicMaterial({ color: '#1a0c05' }));
      herida.visible = false;
      g.add(globo, pupila, parpado, herida);
      cuerpo.add(g);
      ojos.push({ g, globo, pupila, herida, flash: 0, blanco: { asedio: true, nave: true, tipo: 'ojo', i, pos: new THREE.Vector3(), radio: 1.35 } });
    }
    // las raíces del trono que se abren por el piso (donde la Madre tenía los tentáculos)
    const tent = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const pts = [[3.0, 1.2], [4.6, 0.7], [6.2, 0.35], [8.2, 0.15], [9.6, -0.1]].map(([rr, h], k) => [Math.sin(a + k * 0.1) * rr, h, Math.cos(a + k * 0.1) * rr]);
      tent.push(raiz(pts, [0.75, 0.62, 0.48, 0.32, 0.12], '#4a3424', { nudos: 0.1, tramos: 18, lados: 9, pintar: (c, p, n) => musgoEn(c, p, n, 0.9) }));
    }
    const tentaculos = fundirCorteza(tent);
    madre.add(tentaculos);
    // el escudo de la segunda fase: una burbuja de resina de ámbar
    const escudo = new THREE.Mesh(new THREE.SphereGeometry(7.8, 32, 16),
      new THREE.MeshBasicMaterial({ color: '#ffb848', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    escudo.position.y = 4.4; escudo.visible = false;
    madre.add(escudo);
    // los pilares del borde: raíces gruesas que sostienen una semilla dorada
    const pilares = [];
    const geoNucleo = geoSemilla(1.6);
    for (let i = 0; i < NAVE.pilares; i++) {
      const a = Math.PI / 4 + (i / NAVE.pilares) * Math.PI * 2;
      const x = Math.cos(a) * NAVE.radioPilares, z = Math.sin(a) * NAVE.radioPilares;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      // la columna: tres raíces trenzadas, de -4 a 4 (se achica entera al romperse), y el brazo que tiende la semilla
      const hacia = [-Math.cos(a), -Math.sin(a)];
      const trenza = [0, 1, 2].map((k) => raiz([0, 1, 2, 3, 4, 5].map((j) => { const t = j / 5, aa = k * 2.1 + t * 3.2; return [Math.cos(aa) * 0.55 * (1 - t * 0.3), -4.4 + t * 8.4, Math.sin(aa) * 0.55 * (1 - t * 0.3)]; }), [0.7, 0.6, 0.55, 0.5, 0.45, 0.3], k % 2 ? '#5a3a26' : '#4a3020', { nudos: 0.08, tramos: 26, lados: 9, pintar: (c, p, n) => musgoEn(c, p, n, 0.7) }));
      trenza.push(raiz([[0, 1.0, 0], [hacia[0] * 0.8, 0.2, hacia[1] * 0.8], [hacia[0] * 1.5, -0.9, hacia[1] * 1.5], [hacia[0] * 1.55, -1.5, hacia[1] * 1.55]], [0.4, 0.32, 0.22, 0.1], '#4a3020', { nudos: 0.05 }));
      const columna = fundirCorteza(trenza);
      columna.position.y = 4;
      const nucleo = new THREE.Mesh(geoNucleo, new THREE.MeshBasicMaterial({ vertexColors: true }));
      // la semilla cuelga del lado del Rey, a la vista
      nucleo.position.set(-Math.cos(a) * 1.5, 2.9, -Math.sin(a) * 1.5);
      nucleo.add(halosDe([{ p: V3(), col: '#ffb030', tam: 4.5 }]));
      g.add(columna, nucleo);
      const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 5, 1, true).translate(0, 0.5, 0),
        new THREE.MeshBasicMaterial({ color: '#ffb848', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      hilo.visible = false;
      grupo.add(g, hilo);
      pilares.push({ g, columna, nucleo, hilo, flash: 0, blanco: { asedio: true, nave: true, tipo: 'pilar', i, pos: new THREE.Vector3(), radio: 1.6 } });
    }
    // peligros: ondas por el piso (el golpe del Rey) y raíces que brotan debajo tuyo
    const ondas = [];
    for (let i = 0; i < 3; i++) {
      const mo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 72).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#ffcf6a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      mo.position.y = 0.08; mo.visible = false;
      grupo.add(mo);
      ondas.push({ m: mo, activa: false, r: 0, golpeo: false });
    }
    const geoEspinas = unir(Array.from({ length: 6 }, (_, k) => ({
      geo: new THREE.ConeGeometry(0.26, 2.1, 6).translate(Math.cos(k * 1.05) * 0.7 * (k % 2 ? 1 : 0.4), 1.05, Math.sin(k * 1.05) * 0.7 * (k % 2 ? 1 : 0.4)).rotateZ((k % 3 - 1) * 0.15),
      color: (x, yy) => C(0.3 + yy * 0.12, 0.2 + yy * 0.08, 0.12 + yy * 0.04),
    })));
    const matEspinas = lambert();
    const puas = [];
    for (let i = 0; i < 4; i++) {
      const aviso = new THREE.Mesh(new THREE.CircleGeometry(NAVE.pua.radio, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      aviso.position.y = 0.06;
      const espinas = new THREE.Mesh(geoEspinas, matEspinas);
      aviso.visible = espinas.visible = false;
      grupo.add(aviso, espinas);
      puas.push({ aviso, espinas, activa: false, t: 0, x: 0, z: 0, golpeo: false });
    }
    // lo de madera, lo que brilla y los halos: pocas mallas
    grupo.add(fundirCorteza(corteza));
    { const b = fundirBrillo(brillos); if (b) grupo.add(b); }
    grupo.add(halosDe(halos));
    // las luces de adentro (en el presupuesto fijo: no cambian los programas)
    const luces = [
      [0xffa040, 9, 40, pecho.x, pecho.y, pecho.z + 2],
      [0xffb060, 3, 22, salida.x - 1, 3, 0],
      [0xc8ff8a, 2.5, 24, -R + 4, 5, 0],
    ].map(([colr, i, d, x, yy, z]) => { const l = new THREE.PointLight(colr, i, d, 1.6); l.position.set(x, yy, z); grupo.add(l); registrarLuz(l); return l; });
    escena.add(grupo);
    return {
      grupo, x: sitio.x, y, z: sitio.z, sitio, madre, cuerpo, gajos, ojos, corazon, blancoCorazon, tentaculos, escudo,
      pilares, ondas, puas, lugaresVaina, salida, aro, charco, matRajas, apertura: 0, rey, luces, ms: performance.now() - t0,
    };
  }

  // ---------------------------------------------------------------- esconder el valle
  const conLuz = new WeakMap();
  function tieneLuz(o) {
    if (conLuz.has(o)) return conLuz.get(o);
    let si = false;
    o.traverse((q) => { if (q.isLight) si = true; });
    conLuz.set(o, si);
    return si;
  }
  // Se esconde lo que era del valle antes del Desafío (terreno, bosque, cielo, agua...).
  // Lo que tiene luces adentro se deja: cambiar la cantidad de luces recompila todo, y la
  // cámara es cerrada, así que desde adentro no se ve.
  function ocultarValle() {
    ocultos.length = 0;
    for (const o of escena.children) {
      if (!o.visible || (arena && o === arena.grupo) || (subida && o === subida.g) || o.isLight || !delValle(o) || tieneLuz(o)) continue;
      o.visible = false;
      ocultos.push(o);
    }
  }
  function mostrarValle() {
    for (const o of ocultos) o.visible = true;
    ocultos.length = 0;
  }
  let hemi = null, sol = null;
  function lucesDeAdentro() {
    if (!hemi) hemi = escena.children.find((o) => o.isHemisphereLight) || null;
    if (!sol) sol = escena.children.find((o) => o.isDirectionalLight) || null;
    // 3.8.0: la luz tibia de adentro del Coihue (los faroles de hongos y el ámbar)
    if (hemi) { hemi.color.set('#f4d4b4'); hemi.groundColor.set('#4a3424'); hemi.intensity = 1.9; }
    if (sol) { sol.color.set('#ffe0b0'); sol.intensity = 0.6; }
    if (escena.fog) { escena.fog.color.set('#3a2416'); if ('density' in escena.fog) escena.fog.density = 0.012; }
  }

  // ---------------------------------------------------------------- física de adentro
  function ponerFisica() {
    col.agregarPlataforma({ x: arena.x, z: arena.z, radio: R + 0.6, alto: arena.y, espesor: 0.5, duenio: DUENIO, sinTecho: true, sinLaterales: true });
    // la pared: segmentos alrededor, para no caerse al vacío
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, r = R - 0.3;
      col.agregar({ seg: true, ax: arena.x + Math.cos(a0) * r, az: arena.z + Math.sin(a0) * r, bx: arena.x + Math.cos(a1) * r, bz: arena.z + Math.sin(a1) * r,
        r: 0.3, alturaMin: arena.y - 1, alturaMax: arena.y + 12, duenio: DUENIO });
    }
    // la Madre
    col.agregar({ x: arena.x, z: arena.z, r: NAVE.radioCuerpo, alturaMin: arena.y - 1, alturaMax: arena.y + 9, duenio: DUENIO });
    // los pilares
    for (const p of arena.pilares) col.agregar({ x: arena.x + p.g.position.x, z: arena.z + p.g.position.z, r: 1.05, alturaMin: arena.y - 1, alturaMax: arena.y + 8, duenio: DUENIO });
  }
  // 3.8.0: la subida: el piso de abajo, un tramo por cada pedazo de escalera, la pared del tronco en segmentos
  // y la columna de raíces del medio (el borde: entre las dos no hay por dónde caerse)
  function ponerFisicaSubida() {
    const s = subida, o = s.origen;
    col.agregarPlataforma({ x: o.x, z: o.z, radio: s.radio, alto: o.y, espesor: 0.4, duenio: DUENIO, sinTecho: true, sinLaterales: true });
    for (const q of s.tramos) col.agregarPlataforma({ x: o.x + q.x, z: o.z + q.z, largo: q.largo, ancho: q.ancho, ang: q.ang, alto: o.y + q.alto, espesor: 0.25, duenio: DUENIO, sinLaterales: true });
    const n = 48, rr = s.radio - 0.12;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      col.agregar({ seg: true, ax: o.x + Math.cos(a0) * rr, az: o.z + Math.sin(a0) * rr, bx: o.x + Math.cos(a1) * rr, bz: o.z + Math.sin(a1) * rr,
        r: 0.25, alturaMin: o.y - 3, alturaMax: o.y + s.techo + 2, duenio: DUENIO });
    }
    col.agregar({ x: o.x, z: o.z, r: s.columna + 0.12, alturaMin: o.y - 3, alturaMax: o.y + s.techo + 2, duenio: DUENIO });
  }
  const sacarFisica = () => { col.eliminarPorDuenio(DUENIO); fisicaArena = false; };

  // ---------------------------------------------------------------- 3.8.0: la subida (se arma al entrar, detrás del fundido)
  // Queda debajo del corazón (60 m más abajo, sobre el mismo sitio: el terreno de abajo es el llano del Coihue)
  let subida = null, enSubida = false, ultimoDescanso = 0, fisicaArena = false, pendienteCorazon = false, avisoCaida = 0;
  const BAJO_SUBIDA = 60;
  function construirSubida(sitio) {
    const t0 = performance.now();
    const s = armarSubida();
    s.origen = { x: sitio.x, y: sitio.y + NAVE.alturaInterior - BAJO_SUBIDA, z: sitio.z };
    s.sitio = sitio;
    s.g.position.set(s.origen.x, s.origen.y, s.origen.z);
    s.g.visible = false;
    s.g.name = 'coihue-subida';
    // las luces (en el presupuesto fijo: no cambian los programas)
    s.lucesP = s.luces.map((p, i) => { const l = new THREE.PointLight(i === s.luces.length - 1 ? 0xffa040 : 0xffb070, i === s.luces.length - 1 ? 5 : 3.6, 12, 1.4); l.position.copy(p); s.g.add(l); registrarLuz(l); return l; });
    escena.add(s.g);
    s.ms = performance.now() - t0;
    return s;
  }
  const enMundo = (p) => ({ x: subida.origen.x + p.x, y: subida.origen.y + (p.y || 0), z: subida.origen.z + p.z });
  // mirando hacia donde sube la escalera (la tangente del camino)
  const rumboSubida = (p) => { const a = Math.atan2(p.x, p.z); return Math.atan2(-Math.cos(a), Math.sin(a)); };
  function ponerEnDescanso(i) {
    const d = subida.descansos[Math.max(0, Math.min(subida.descansos.length - 1, i))], w = enMundo(d);
    api.jugador().ubicar(w.x, w.z, rumboSubida(d), w.y + 0.05);
  }

  // ---------------------------------------------------------------- entrar y salir
  const salidaMundo = () => ({ x: arena.x + arena.salida.x, z: arena.z + arena.salida.z });
  function entrar() {
    if (adentro || seq) return false;
    const s = api.sitioHaz?.();
    if (!s) return false;
    seq = { tipo: 'entrar', t: 0, hecho: false, sitio: s };
    sonido.tono?.({ frec: 90, fin: 420, dur: 1.2, tipo: 'sawtooth', vol: 0.12, destino: sonido.bus?.efectos });
    return true;
  }
  // 3.8.0: E en la puerta del pie: adentro del tronco hueco, al pie de la escalera de raíces. La pelea del
  // corazón arranca de cero cada vez que entrás al Coihue (como siempre).
  function hacerEntrada(s) {
    const d = api.D();
    // lo que quedaba afuera se va: adentro no se ve y no tiene que seguir persiguiéndote
    for (const a of api.aliens) if (!a.enNave && a.estado !== 'morir' && a.estado !== 'irse') { a.estado = 'irse'; a.t = 0; }
    hora = api.horaActual?.() || null;
    const asedio = d.asedio;
    if (asedio) asedio.abordajes = (asedio.abordajes || 0) + 1;
    if (!subida || Math.hypot(subida.sitio.x - s.x, subida.sitio.z - s.z) > 1) {
      if (subida) escena.remove(subida.g);
      subida = construirSubida(s);   // (detrás del fundido: la pantalla está a oscuras)
    }
    // y la sala del Rey, también ahora (a oscuras); arriba, al abrir la puerta, ya está
    if (!arena || Math.hypot(arena.sitio.x - s.x, arena.sitio.z - s.z) > 1) {
      if (arena) escena.remove(arena.grupo);
      arena = construir(s);
    }
    pelea = null;
    crias.clear();
    activos.length = 0;
    ponerFisicaSubida();
    subida.g.visible = true;
    if (arena) arena.grupo.visible = false;
    ocultarValle();
    adentro = true; enSubida = true; ultimoDescanso = 0;
    ponerEnDescanso(0);
    lucesDeAdentro();
    hud.style.display = 'none';
    api.nota('El tronco hueco', 'Subí por la escalera de raíces hasta la puerta del corazón. Si te caés, volvés al último descanso', true);
    api.guardar();
  }
  function entrarCorazon() {
    if (!adentro || !enSubida || seq) return false;
    seq = { tipo: 'corazon', t: 0, hecho: false };
    return true;
  }
  // la puerta del corazón: adentro, la sala del Rey (se arma la primera vez, detrás del fundido)
  function hacerCorazon() {
    const s = subida.sitio;
    if (!arena || Math.hypot(arena.sitio.x - s.x, arena.sitio.z - s.z) > 1) {
      if (arena) escena.remove(arena.grupo);
      arena = construir(s);
    }
    if (!fisicaArena) { ponerFisica(); fisicaArena = true; }
    const nueva = !pelea;
    if (nueva) {
      pelea = naveNueva({ vida: dificultad(api.claveDificultad?.()).vida, debilidad: debilidadNave(api.D().asedio) });
      pelea.bruto = false;
      for (const o of arena.ondas) { o.activa = false; o.m.visible = false; }
      for (const p of arena.puas) { p.activa = false; p.aviso.visible = p.espinas.visible = false; }
      arena.apertura = 0;
      // 3.5.1: la arena se reusa al volver a subir: los ojos y pilares rotos la vez anterior
      // seguían reventados (sin globo ni núcleo) aunque la Madre se recompone y les entran los
      // golpes; no se veía a qué tirarle, y el plasma no salía de esos ojos
      for (const o of arena.ojos) { o.globo.visible = o.pupila.visible = true; o.herida.visible = false; o.flash = 0; }
      for (const p of arena.pilares) { p.nucleo.visible = true; p.hilo.visible = false; p.columna.scale.y = 1; p.columna.position.y = 4; p.flash = 0; }
      arena.corazonFlash = 0;
    }
    enSubida = false;
    subida.g.visible = false;
    arena.grupo.visible = true;
    const sal = salidaMundo();
    api.jugador().ubicar(sal.x, sal.z, Math.PI / 2, arena.y);
    hud.style.display = 'block';
    _v.set(arena.x, arena.y + 5, arena.z);
    S().jefe?.(_v);
    if (nueva) api.nota(AVISO_FASE.ojos[0], AVISO_FASE.ojos[1] + (debilidadNave(api.D().asedio) ? '. Con las cuatro zonas libres, llegó más débil: le falta un ojo' : ''), true);
    api.guardar();
  }
  // E en la puerta de la sala: de vuelta a la escalera (arriba), para bajar caminando
  function bajarEscalera() {
    if (!adentro || enSubida || seq) return false;
    seq = { tipo: 'bajar', t: 0, hecho: false };
    return true;
  }
  function hacerBajada() {
    for (const a of crias) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 10; }
    crias.clear();
    activos.length = 0;
    enSubida = true;
    if (arena) arena.grupo.visible = false;
    subida.g.visible = true;
    hud.style.display = 'none';
    const p = enMundo(subida.puertaArriba);
    api.jugador().ubicar(p.x, p.z, rumboSubida(subida.puertaArriba) + Math.PI, p.y + 0.05);
    ultimoDescanso = subida.descansos.length - 1;
  }
  // (para las pruebas: te deja en la puerta del corazón y la abre; si todavía estás entrando, al terminar)
  function atajoCorazon() {
    if (adentro && enSubida && !seq) {
      const p = enMundo(subida.puertaArriba);
      api.jugador().ubicar(p.x, p.z, 0, p.y + 0.05);
      return entrarCorazon();
    }
    pendienteCorazon = true;
    return true;
  }
  function salir() {
    if (!adentro || seq) return false;
    seq = { tipo: 'salir', t: 0, hecho: false };
    return true;
  }
  function alCaerAdentro() {
    if (!adentro) return false;
    if (seq) { api.D().salud = Math.max(1, api.D().salud); return true; }
    api.D().salud = 1;
    seq = { tipo: 'derrota', t: 0, hecho: false };
    return true;
  }
  function hacerSalida(motivo) {
    for (const a of crias) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 10; }
    crias.clear();
    activos.length = 0;
    sacarFisica();
    if (arena) arena.grupo.visible = false;
    if (subida) subida.g.visible = false;
    mostrarValle();
    adentro = false; enSubida = false; pendienteCorazon = false;
    hud.style.display = 'none';
    try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(1, sonido.ctx.currentTime, 0.4); } catch { /* sin audio */ }
    const s = api.sitioHaz?.() || subida?.sitio || { x: arena.x, z: arena.z, y: T.altura(arena.x, arena.z) };
    const d = api.D();
    if (motivo === 'final') {
      // se sale lejos de donde va a caer la nave, mirándola
      const c = api.centroBase?.() || { x: s.x + 60, z: s.z };
      const dx = c.x - s.x, dz = c.z - s.z, l = Math.hypot(dx, dz) || 1;
      const x = s.x + (dx / l) * 55, z = s.z + (dz / l) * 55;
      api.jugador().ubicar(x, z, Math.atan2(-(s.x - x), -(s.z - z)), T.altura(x, z));
      pelea = null;
      return;
    }
    const x = s.x + 4, z = s.z + 4;
    api.jugador().ubicar(x, z, Math.atan2(-(s.x - x), -(s.z - z)), T.altura(x, z));
    pelea = null;
    if (motivo === 'derrota') {
      d.salud = Math.round(SALUD_MAX * 0.6);
      if (d.asedio) d.asedio.derrotasNave = (d.asedio.derrotasNave || 0) + 1;
      api.nota('La nave te escupió', 'Caíste adentro y el haz te bajó al valle. Sigue abierto: cuando estés listo, volvé a subir (la Madre se recompone)', true);
    } else api.nota('Volviste al valle', 'El haz sigue abierto. Adentro, la Madre se recompone');
    api.guardar();
  }
  // por cuadro, en la escalera: el último descanso al que llegaste y, si te caíste, de vuelta ahí
  function actualizarSubida(dt, js) {
    if (!subida || seq) return;
    const o = subida.origen;
    for (let i = subida.descansos.length - 1; i > ultimoDescanso; i--) {
      if (js.pos.y >= o.y + subida.descansos[i].y - 0.3) { ultimoDescanso = i; break; }
    }
    const fuera = Math.hypot(js.pos.x - o.x, js.pos.z - o.z) > subida.radio + 1.5;
    if (js.pos.y < o.y - 3 || js.pos.y > o.y + subida.techo + 3 || fuera) {
      ponerEnDescanso(ultimoDescanso);
      avisoCaida -= 1;
      if (avisoCaida <= 0) { avisoCaida = 3; api.nota('Volviste al último descanso', 'La escalera de raíces sigue para arriba'); }
    }
  }

  // ---------------------------------------------------------------- blancos y golpes
  const activos = [];
  const blancos = () => activos;
  function herir(n, dano) {
    if (!adentro || !pelea || !n?.nave || seq) return;
    const r = herirPunto(pelea, n.tipo, n.i, dano);
    if (!r.ok) {
      // el escudo o el caparazón frenan el golpe
      efectos?.chispas(n.pos, 5);
      return;
    }
    const vis = n.tipo === 'ojo' ? arena.ojos[n.i] : n.tipo === 'pilar' ? arena.pilares[n.i] : null;
    if (vis) vis.flash = 1; else arena.corazonFlash = 1;
    if (!r.roto) return;
    efectos?.explosion(n.pos, n.tipo === 'corazon' ? 12 : 6);
    efectos?.chispas(n.pos, 14);   // 3.8.0: ámbar y astillas, no sangre
    posar('herido', 0.9);
    sonido.golpeRuido?.({ dur: 1.3, frec: 120, tipo: 'lowpass', vol: 0.85, destino: sonido.fuente?.(n.pos, 1.3) });
    api.vibrar?.('jefe', 0.8);
    if (n.tipo === 'ojo') { vis.globo.visible = vis.pupila.visible = false; vis.herida.visible = true; }
    if (n.tipo === 'pilar') { vis.nucleo.visible = false; vis.hilo.visible = false; vis.columna.scale.y = 0.55; vis.columna.position.y = 2.2; }
    if (r.ganada) { empezarFinal(); return; }
    if (r.fase) {
      _v.set(arena.x, arena.y + 6, arena.z);
      S().jefe?.(_v);
      api.nota(AVISO_FASE[r.fase][0], AVISO_FASE[r.fase][1], true);
      if (r.fase === 'corazon') efectos?.explosion(_v, 9);
    } else {
      const quedan = puntosActivos(pelea).length;
      api.nota(n.tipo === 'ojo' ? 'Le reventaste un ojo' : 'Cayó un pilar', `Quedan ${quedan}`);
    }
  }
  function empezarFinal() {
    seq = { tipo: 'final', t: 0, hecho: false, boom: 0 };
    api.camaraLenta?.(2.4);
    for (const a of crias) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 0; }
    api.nota('¡La Madre cayó!', 'La nave se viene abajo. ¡Afuera, rápido!', true);
    api.guardar();
  }

  // ---------------------------------------------------------------- las crías
  const pose = { dt: 0, jugador: null, velocidad: 0, golpe: 0, ataca: false, carrera: false, apuntando: false, agazapado: false, enredado: false, saltando: 0, noche: 1, reflejo: 0 };
  function llamarCrias() {
    const f = indiceFase(pelea);
    const lista = [...criasDeFase(pelea)];
    if (f === 2 && !pelea.bruto) { lista.push('bruto'); pelea.bruto = true; }
    let n = 0;
    for (const tipo of lista) {
      if (crias.size >= NAVE.maxCrias[f] + (tipo === 'bruto' ? 1 : 0)) break;
      const v = arena.lugaresVaina[Math.floor(Math.random() * arena.lugaresVaina.length)];
      const x = arena.x + v.x + (Math.random() - 0.5) * 1.5, z = arena.z + v.z + (Math.random() - 0.5) * 1.5;
      const a = api.invocar?.(tipo, x, z);
      if (!a) continue;
      a.enNave = true;
      a.m.g.position.y = arena.y;
      a.cd = 0.8 + Math.random();
      crias.add(a);
      n++;
      _v.set(x, arena.y + 1.6, z);
      efectos?.polvo?.(_v, 8);   // 3.8.0: salen de las puertitas, entre el polvo
    }
    if (n) { _v.set(arena.x, arena.y + 6, arena.z); S().llamado?.(_v, 'jefe'); }
  }
  function actualizarAlien(a, dt, js) {
    const g = a.m.g, p = g.position, def = a.def;
    if (a.estado === 'morir') {
      a.t += dt; a.m.caer(a.t);
      if (a.t > 0.9) a.m.disolver(Math.min(1, (a.t - 0.9) / 1.4));
      return a.t > 2.4 ? 'fuera' : undefined;
    }
    if (a.estado === 'irse' || !adentro) {
      if (a.estado !== 'irse') { a.estado = 'irse'; a.t = 0; }
      a.t += dt; p.y += dt * (3 + a.t * 4); g.rotation.y += dt * 4;
      g.scale.setScalar(Math.max(0.05, 1 - a.t * 0.35)); a.m.disolver(Math.min(1, a.t / 2.6));
      return a.t > 2.6 ? 'fuera' : undefined;
    }
    if (a.estado !== 'avanzar') a.estado = 'avanzar';
    a.flash = Math.max(0, (a.flash || 0) - dt * 6); a.m.flash(a.flash);
    a.cd -= dt;
    const dx = js.pos.x - p.x, dz = js.pos.z - p.z, dist = Math.hypot(dx, dz);
    let vel = def.vel * (a.velMult || 1);
    if (a.congeladoT > 0) { a.congeladoT -= dt; vel *= 0.33; }
    if (a.frenoT > 0) { a.frenoT -= dt; vel *= 0.45; }
    let ataca = false, apunta = false, quieto = false;
    if (a.enredadoT > 0 || a.atrapadoT > 0) { a.enredadoT = Math.max(0, a.enredadoT - dt); a.atrapadoT = Math.max(0, (a.atrapadoT || 0) - dt); vel = 0; quieto = true; }
    const alcance = (def.cuerpo || def.alcance) + def.radio * (a.m.esc - 1) + 0.35;
    if (!quieto && def.aDistancia && dist < def.alcance && dist > 4) {
      vel = dist < def.distancia ? -vel * 0.5 : dist < def.distancia + 3 ? 0 : vel;
      apunta = true;
      if (a.cd <= 0) {
        a.cd = def.cadencia * (0.8 + Math.random() * 0.4);
        _v.set(p.x, p.y + def.altura * 0.8, p.z);
        _d.set(js.pos.x - _v.x, js.pos.y + 1.2 - _v.y, js.pos.z - _v.z).normalize();
        _d.x += (Math.random() - 0.5) * 0.06; _d.y += (Math.random() - 0.5) * 0.04;
        api.lanzarProyectil('plasma', _v, _d.multiplyScalar(19), def.dano * a.danoMult, false);
        S().plasma?.(p);
        a.golpeT = 0.3;
      }
    } else if (!quieto && dist < alcance && Math.abs(js.pos.y - p.y) < 2.2) {
      vel = 0; ataca = true;
      if (a.cd <= 0) { a.cd = def.cadencia; a.golpeT = 0.35; api.herirJugador(def.dano * a.danoMult, p); }
    }
    let dif = Math.atan2(dx, dz) - (a.rumbo || 0);
    dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    a.rumbo = (a.rumbo || 0) + dif * Math.min(1, dt * (def.giro || 6));
    g.rotation.y = a.rumbo;
    if (vel) { p.x += Math.sin(a.rumbo) * vel * dt; p.z += Math.cos(a.rumbo) * vel * dt; }
    // adentro de la arena y afuera del cuerpo de la Madre
    let lx = p.x - arena.x, lz = p.z - arena.z;
    const r1 = dentroDeArena(lx, lz, def.radio); lx = r1.dx; lz = r1.dz;
    const r2 = fueraDelCuerpo(lx, lz, def.radio); lx = r2.dx; lz = r2.dz;
    p.x = arena.x + lx; p.z = arena.z + lz; p.y = arena.y;
    a.px = p.x; a.pz = p.z;
    a.golpeT = Math.max(0, (a.golpeT || 0) - dt);
    pose.dt = dt; pose.jugador = js.pos; pose.velocidad = Math.abs(vel); pose.golpe = a.golpeT > 0 ? Math.sin((1 - a.golpeT / 0.35) * Math.PI) : 0;
    pose.ataca = ataca; pose.carrera = a.tipo === 'rastreador' && vel > 0 && dist > 7; pose.apuntando = apunta && !vel;
    pose.agazapado = false; pose.enredado = quieto; pose.saltando = 0; pose.noche = 1; pose.reflejo = 0;
    a.m.animar(pose);
    return undefined;
  }

  // ---------------------------------------------------------------- 3.8.0: las poses del Rey
  // Cada hueso (los brazos, la cabeza, el torso) va hacia la pose del momento y vuelve al reposo, donde
  // respira y mira alrededor. Las poses acompañan lo que hace: tirar ámbar, llamar a los suyos, golpear el
  // piso (la onda), señalarte (las raíces que brotan) y encogerse cuando le rompen algo.
  const poseRey = { nombre: 'reposo', t: 0, dur: 1 };
  function posar(nombre, dur) { poseRey.nombre = nombre; poseRey.t = 0; poseRey.dur = dur; }
  const meta = { b0: [0, 0, 0], b1: [0, 0, 0], cab: [0, 0, 0], tor: [0, 0, 0] };
  function animarRey(dt, t) {
    const h = arena?.rey?.userData.huesos;
    if (!h) return;
    poseRey.t += dt;
    let u = poseRey.dur > 0 ? poseRey.t / poseRey.dur : 1;
    if (u >= 1 && poseRey.nombre !== 'reposo') { poseRey.nombre = 'reposo'; u = 1; }
    const s = Math.sin(Math.min(1, u) * Math.PI);
    const o = meta;
    o.b0 = [Math.sin(t * 0.8) * 0.03, 0, 0]; o.b1 = [Math.sin(t * 0.8 + 1) * 0.03, 0, 0];
    o.cab = [Math.sin(t * 0.5) * 0.04, Math.sin(t * 0.31) * 0.12, 0]; o.tor = [Math.sin(t * 0.9) * 0.012, 0, 0];
    if (poseRey.nombre === 'lanzar') { o.b1 = [-1.9 * s, 0, -0.3 * s]; o.cab[0] += 0.15 * s; }
    else if (poseRey.nombre === 'llamar') { o.b0 = [-0.6 * s, 0, 1.3 * s]; o.b1 = [-0.6 * s, 0, -1.3 * s]; o.cab[0] -= 0.35 * s; }
    else if (poseRey.nombre === 'golpe') {
      // los dos puños arriba y abajo de golpe (la onda sale del piso)
      const arriba = u < 0.55 ? Math.sin((u / 0.55) * Math.PI / 2) : Math.max(0, 1 - (u - 0.55) / 0.12);
      const x = u < 0.55 ? -2.4 * arriba : -0.25 - 2.15 * arriba;
      o.b0 = [x, 0, 0.15]; o.b1 = [x, 0, -0.15]; o.tor[0] = u < 0.55 ? -0.1 * arriba : 0.16 * (1 - u);
    } else if (poseRey.nombre === 'senalar') { o.b0 = [-1.45 * s, 0, 0.1 * s]; o.cab[0] += 0.1 * s; }
    else if (poseRey.nombre === 'herido') { o.cab[0] -= 0.45 * s; o.tor[0] -= 0.12 * s; o.b0[2] += 0.5 * s; o.b1[2] -= 0.5 * s; }
    const k = Math.min(1, dt * 10);
    const ir = (q, [x, y, z]) => { q.rotation.x += (x - q.rotation.x) * k; q.rotation.y += (y - q.rotation.y) * k; q.rotation.z += (z - q.rotation.z) * k; };
    ir(h.brazo0, o.b0); ir(h.brazo1, o.b1); ir(h.cabeza, o.cab); ir(h.torso, o.tor);
  }

  // ---------------------------------------------------------------- lo que hace la Madre
  const hechos = [];
  function disparar(js) {
    // desde el ojo que mejor te ve, o desde arriba cuando ya no tiene ojos
    let desde = null, mejor = -2;
    if (pelea.fase === 'ojos') {
      for (const o of arena.ojos) {
        if (!o.globo.visible) continue;
        _w.subVectors(js.pos, o.blanco.pos).normalize();
        o.g.getWorldDirection(_d);
        const k = _d.dot(_w);
        if (k > mejor) { mejor = k; desde = o.blanco.pos; }
      }
    }
    if (!desde) desde = _v.set(arena.x, arena.y + 8.2, arena.z);
    const origen = _w.copy(desde);
    for (let i = -1; i <= 1; i++) {
      _d.set(js.pos.x - origen.x, js.pos.y + 1.1 - origen.y, js.pos.z - origen.z).normalize();
      _d.applyAxisAngle(ARRIBA, i * 0.09);
      api.lanzarProyectil('plasma', origen, _d.multiplyScalar(18), NAVE.dano.disparo, false);
    }
    S().plasma?.(origen);
  }
  function lanzarOnda() {
    const o = arena.ondas.find((q) => !q.activa);
    if (!o) return;
    o.activa = true; o.r = NAVE.radioCuerpo + 0.5; o.golpeo = false; o.m.visible = true;
    sonido.tono?.({ frec: 70, fin: 40, dur: 0.9, tipo: 'sine', vol: 0.35, destino: sonido.bus?.efectos });
    sonido.golpeRuido?.({ dur: 0.6, frec: 180, tipo: 'lowpass', vol: 0.5, destino: sonido.bus?.efectos });
  }
  function lanzarPua(js) {
    const p = arena.puas.find((q) => !q.activa);
    if (!p) return;
    p.activa = true; p.t = 0; p.golpeo = false;
    p.x = js.pos.x - arena.x; p.z = js.pos.z - arena.z;
    p.aviso.position.set(p.x, 0.06, p.z); p.espinas.position.set(p.x, -2, p.z);
    p.aviso.visible = true; p.espinas.visible = false;
    sonido.tono?.({ frec: 900, fin: 1400, dur: 0.5, tipo: 'triangle', vol: 0.06, destino: sonido.bus?.efectos });
  }
  function actualizarPeligros(dt, js) {
    const alto = js.pos.y - arena.y;
    const lx = js.pos.x - arena.x, lz = js.pos.z - arena.z, dist = Math.hypot(lx, lz);
    for (const o of arena.ondas) {
      if (!o.activa) continue;
      o.r += NAVE.onda.vel * dt;
      o.m.scale.set(o.r, 1, o.r);
      o.m.material.opacity = Math.max(0, 0.85 * (1 - o.r / (R + 1)));
      if (!o.golpeo && !seq && tocaOnda(o.r, dist, alto)) {
        o.golpeo = true;
        api.herirJugador(NAVE.dano.onda, _v.set(arena.x, arena.y, arena.z));
      }
      if (o.r > R + 1) { o.activa = false; o.m.visible = false; }
    }
    for (const p of arena.puas) {
      if (!p.activa) continue;
      p.t += dt;
      if (p.t < NAVE.pua.aviso) {
        p.aviso.material.opacity = 0.25 + (p.t / NAVE.pua.aviso) * 0.5 + Math.sin(p.t * 30) * 0.08;
        continue;
      }
      const k = Math.min(1, (p.t - NAVE.pua.aviso) / 0.15);
      p.espinas.visible = true;
      p.espinas.position.y = -1.9 + k * 1.9;
      p.aviso.material.opacity = Math.max(0, 0.6 - (p.t - NAVE.pua.aviso) * 0.8);
      if (!p.golpeo && k >= 1) {
        p.golpeo = true;
        _v.set(arena.x + p.x, arena.y + 0.5, arena.z + p.z);
        efectos?.chispas(_v, 10);
        sonido.golpeRuido?.({ dur: 0.35, frec: 2600, q: 2, vol: 0.35, destino: sonido.fuente?.(_v, 0.8) });
        if (!seq && alto < 1.2 && tocaPua({ x: p.x, z: p.z }, lx, lz)) api.herirJugador(NAVE.dano.pua, _v);
      }
      if (p.t > NAVE.pua.aviso + 1.6) { p.activa = false; p.aviso.visible = p.espinas.visible = false; }
    }
  }

  // ---------------------------------------------------------------- por cuadro
  let tHud = 0, tAgache = 0;
  const pisoT = { altura: () => (enSubida && subida ? subida.origen.y : arena ? arena.y : 0) };
  function actualizar(dt, js) {
    // una partida guardada adentro de la nave (o cualquier caída al vacío): de vuelta al valle
    // 3.5.1: el guardado acota la altura a 320 m: con el sitio del haz alto, la partida guardada
    // adentro volvía en el aire sobre el haz (y caía cientos de metros); se la reconoce igual
    const sh = !adentro && !seq ? api.sitioHaz?.() : null;
    const sobreElHaz = !!sh && Math.hypot(js.pos.x - sh.x, js.pos.z - sh.z) < NAVE.radioArena + 2 && js.pos.y > sh.y + 20;
    if (!adentro && !seq && (js.pos.y > T.altura(js.pos.x, js.pos.z) + 250 || sobreElHaz)) {
      const s = api.sitioHaz?.();
      const x = s ? s.x + 4 : js.pos.x, z = s ? s.z + 4 : js.pos.z;
      api.jugador().ubicar(x, z, js.yaw, T.altura(x, z));
      return;
    }
    if (seq) actualizarSecuencia(dt, js);
    if (!adentro) return;
    if (hora) api.fijarHora?.(hora.h, hora.dia);
    lucesDeAdentro();
    for (const o of ocultos) o.visible = false;   // lo que el valle vuelve a prender, se apaga
    tAgache -= dt;
    if (tAgache <= 0) { tAgache = 0.5; try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(0.18, sonido.ctx.currentTime, 0.3); } catch { /* sin audio */ } }
    // 3.8.0: en la escalera no hay pelea (el Rey espera en su sala)
    if (enSubida) { activos.length = 0; actualizarSubida(dt, js); return; }
    if (!arena) return;
    // se cayó del piso (no debería): vuelve a la salida
    if (js.pos.y < arena.y - 4) { const s = salidaMundo(); api.jugador().ubicar(s.x, s.z, Math.PI / 2, arena.y); }
    for (const a of crias) if (!api.aliens.includes(a) || !a.enNave) crias.delete(a);
    const t = performance.now() / 1000;
    // la Madre te busca con la mirada, despacio
    if (pelea && !pelea.ganada) {
      const quiere = Math.atan2(js.pos.x - arena.x, js.pos.z - arena.z);
      let dif = quiere - arena.cuerpo.rotation.y;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      arena.cuerpo.rotation.y += Math.max(-dt * 0.45, Math.min(dt * 0.45, dif));
      if (!seq) {
        avanzarNave(pelea, dt, { crias: crias.size }, hechos);
        for (const h of hechos) {
          if (h === 'disparo') { disparar(js); posar('lanzar', 0.7); }
          else if (h === 'llamar') { llamarCrias(); posar('llamar', 1.6); }
          else if (h === 'onda') { lanzarOnda(); posar('golpe', 0.9); }
          else if (h === 'pua') { lanzarPua(js); posar('senalar', 1.1); }
        }
      }
    }
    actualizarPeligros(dt, js);
    // la forma de la Madre según la fase
    const fase = pelea?.fase || 'corazon';
    arena.apertura += ((fase === 'corazon' ? 1 : 0) - arena.apertura) * Math.min(1, dt * 1.2);
    for (const g of arena.gajos) g.piv.quaternion.setFromAxisAngle(g.eje, arena.apertura * 1.05);
    arena.escudo.visible = fase === 'pilares';
    if (arena.escudo.visible) arena.escudo.material.opacity = 0.045 + Math.sin(t * 3) * 0.015;
    arena.madre.scale.setScalar(1 + Math.sin(t * 1.3) * 0.006);
    arena.tentaculos.rotation.y = Math.sin(t * 0.4) * 0.012;
    // 3.8.0: la luz de las puertitas titila como un fuego; las luciérnagas de la puerta dan vueltas
    arena.matRajas.color.setRGB(1, 0.78 + Math.sin(t * 7) * 0.12 + Math.sin(t * 2.3) * 0.08, 0.6 + Math.sin(t * 5) * 0.2);
    arena.charco.material.opacity = 0.25 + Math.sin(t * 3) * 0.1;
    arena.aro.rotation.x += dt * 0.8;
    animarRey(dt, t);
    arena.grupo.updateMatrixWorld(true);
    // los blancos, en el mundo
    activos.length = 0;
    const puedenPegar = pelea && !pelea.ganada && !seq;
    for (const o of arena.ojos) {
      o.globo.getWorldPosition(o.blanco.pos);
      o.flash = Math.max(0, o.flash - dt * 4);
      { const k = 0.92 + Math.sin(t * 2.2 + o.blanco.i) * 0.08; o.globo.material.color.setRGB(k + o.flash * 0.5, k + o.flash * 0.7, k + o.flash * 0.9); }   // 3.8.0: el ámbar late
      o.pupila.scale.setScalar(1 + Math.sin(t * 5 + o.blanco.i) * 0.15);
      if (puedenPegar && fase === 'ojos' && pelea.ojos[o.blanco.i] > 0) activos.push(o.blanco);
      else if (pelea && pelea.ojos[o.blanco.i] <= 0 && o.globo.visible) { o.globo.visible = o.pupila.visible = false; o.herida.visible = true; }
    }
    for (const p of arena.pilares) {
      p.nucleo.getWorldPosition(p.blanco.pos);
      p.flash = Math.max(0, p.flash - dt * 4);
      const vivo = pelea && pelea.pilares[p.blanco.i] > 0;
      p.nucleo.material.color.setRGB(0.9 + p.flash * 0.4, 0.9 + p.flash * 0.4, 0.85 + p.flash * 0.5);   // 3.8.0: la semilla dorada
      p.nucleo.scale.setScalar(0.9 + Math.sin(t * 2.6 + p.blanco.i) * 0.1 + p.flash * 0.3);
      p.hilo.visible = vivo && fase === 'pilares';
      if (p.hilo.visible) {
        _v.set(p.g.position.x + p.nucleo.position.x, p.nucleo.position.y, p.g.position.z + p.nucleo.position.z);
        _w.set(0, 3.6, 0).sub(_v);
        const largo = _w.length() - 6.4;
        p.hilo.position.copy(_v);
        p.hilo.quaternion.setFromUnitVectors(ARRIBA, _w.normalize());
        p.hilo.scale.set(1, Math.max(0.1, largo), 1);
      }
      if (puedenPegar && fase === 'pilares' && vivo) activos.push(p.blanco);
    }
    arena.corazon.visible = arena.apertura > 0.25;
    arena.corazon.getWorldPosition(arena.blancoCorazon.pos);
    arena.corazonFlash = Math.max(0, (arena.corazonFlash || 0) - dt * 4);
    arena.corazon.scale.setScalar((0.95 + Math.sin(t * 5.5) * 0.06) * (1 + arena.corazonFlash * 0.25));
    { const k = 0.95 + Math.sin(t * 5.5) * 0.1; arena.corazon.material.color.setRGB(k + arena.corazonFlash * 0.5, k + arena.corazonFlash * 0.7, k + arena.corazonFlash * 0.9); }   // 3.8.0: el ámbar late
    if (puedenPegar && fase === 'corazon' && arena.apertura > 0.4) activos.push(arena.blancoCorazon);
    // la barra
    tHud -= dt;
    if (tHud <= 0 && pelea) {
      tHud = 0.12;
      const texto = `La Madre · ${textoNave(pelea)}`;
      if (hudTitulo.textContent !== texto) hudTitulo.textContent = texto;
      hudRelleno.style.width = `${Math.round(fraccionNave(pelea) * 100)}%`;
    }
  }
  // 3.8.0: los fundidos de las puertas: al tronco hueco (entrar), al corazón, de vuelta a la escalera (bajar)
  const FUNDIDO = { entrar: 0.35, puerta: 0.3, aclarar: 0.45 };
  function actualizarSecuencia(dt, js) {
    const s = seq;
    s.t += dt;
    if (s.tipo === 'entrar' || s.tipo === 'corazon' || s.tipo === 'bajar') {
      const f = s.tipo === 'entrar' ? FUNDIDO.entrar : FUNDIDO.puerta;
      ponerVelo(s.hecho ? 1 - (s.t - f) / FUNDIDO.aclarar : s.t / f, '#140b05');
      if (!s.hecho && s.t >= f) {
        s.hecho = true;
        if (s.tipo === 'entrar') hacerEntrada(s.sitio); else if (s.tipo === 'corazon') hacerCorazon(); else hacerBajada();
      }
      if (s.t > f + FUNDIDO.aclarar) {
        ponerVelo(0); seq = null;
        if (pendienteCorazon && adentro && enSubida) { pendienteCorazon = false; atajoCorazon(); }
      }
    } else if (s.tipo === 'salir' || s.tipo === 'derrota') {
      ponerVelo(s.t / 0.6, s.tipo === 'derrota' ? '#200808' : '#140b05');
      if (!s.hecho && s.t >= 0.6) { s.hecho = true; hacerSalida(s.tipo === 'derrota' ? 'derrota' : 'voluntario'); }
      if (s.t > 0.6) ponerVelo(1 - (s.t - 0.6) / 1.1);
      if (s.t > 1.7) { ponerVelo(0); seq = null; }
    } else if (s.tipo === 'final') {
      // la Madre revienta de a pedazos, la cámara tiembla y se va todo a blanco
      if (adentro && arena) {
        s.boom -= dt;
        if (s.boom <= 0) {
          s.boom = 0.18;
          const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
          _v.set(arena.x + Math.cos(a) * r, arena.y + 1 + Math.random() * 7, arena.z + Math.sin(a) * r);
          efectos?.explosion(_v, 5);
          sonido.golpeRuido?.({ dur: 0.9, frec: 90 + Math.random() * 80, tipo: 'lowpass', vol: 0.6, destino: sonido.bus?.efectos });
        }
        const k = Math.min(1, s.t / 3);
        arena.madre.scale.setScalar(Math.max(0.05, 1 - k * 0.8));
        arena.madre.position.y = -k * 2;
        camara.position.x += (Math.random() - 0.5) * 0.12 * (1 - k * 0.5);
        camara.position.y += (Math.random() - 0.5) * 0.08;
        api.vibrar?.('derrumbe', 0.5);
      }
      if (s.t > 2.4) ponerVelo((s.t - 2.4) / 0.8, '#fff3d8');
      if (!s.hecho && s.t >= 3.2) {
        s.hecho = true;
        hacerSalida('final');
        arena.madre.scale.setScalar(1); arena.madre.position.y = 0;
        api.alGanarNave?.();
      }
      if (s.t > 3.2) ponerVelo(1 - (s.t - 3.2) / 1.6, '#fff3d8');
      if (s.t > 4.8) { ponerVelo(0); seq = null; }
    }
  }

  // ---------------------------------------------------------------- E: las puertas
  // En la sala, la puerta de la escalera (baja a la subida). En la subida, arriba la puerta del corazón y
  // abajo la puertita al valle.
  function enLaSalida(pos) {
    if (!adentro || enSubida || !arena || seq) return false;
    const s = salidaMundo();
    return Math.hypot(pos.x - s.x, pos.z - s.z) < 2.4 && Math.abs(pos.y - arena.y) < 2;
  }
  function cercaDe(pos, p, r) { const w = enMundo(p); return Math.hypot(pos.x - w.x, pos.z - w.z) < r && Math.abs(pos.y - w.y) < 2.2; }
  const puertaSubida = (pos) => (!adentro || !enSubida || !subida || seq ? null : cercaDe(pos, subida.puertaArriba, 2.6) ? 'corazon' : cercaDe(pos, subida.puertaAbajo, 2.4) ? 'valle' : null);
  function usarCerca(pos) {
    if (enLaSalida(pos)) return bajarEscalera();
    const p = puertaSubida(pos);
    if (p === 'corazon') return entrarCorazon();
    if (p === 'valle') return salir();
    return false;
  }
  function avisoCerca(pos) {
    if (enLaSalida(pos)) return 'Bajar por la escalera de raíces';
    const p = puertaSubida(pos);
    return p === 'corazon' ? 'Entrar al corazón del Coihue' : p === 'valle' ? 'Salir al valle por la puertita' : null;
  }

  function limpiar() {
    if (adentro) {
      sacarFisica(); if (arena) arena.grupo.visible = false; if (subida) subida.g.visible = false; mostrarValle(); adentro = false; enSubida = false;
      // 3.5.1: como al salir por el haz: el ambiente del valle quedaba apagado (al caer o volver a la portada adentro)
      try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(1, sonido.ctx.currentTime, 0.4); } catch { /* sin audio */ }
    }
    crias.clear();
    seq = null; pelea = null; pendienteCorazon = false;
    hud.style.display = 'none';
    ponerVelo(0);
  }

  return {
    entrar, salir, alCaerAdentro, actualizar, actualizarAlien, blancos, herir, usarCerca, avisoCerca, limpiar,
    // 3.8.0: la subida caminable (y el atajo de las pruebas a la puerta del corazón)
    entrarCorazon, bajarEscalera, atajoCorazon,
    get enSubida() { return adentro && enSubida; },
    get subida() { return subida; },
    get ultimoDescanso() { return ultimoDescanso; },
    get adentro() { return adentro; },
    get enTransicion() { return !!seq; },
    get pelea() { return pelea; },
    get arena() { return arena; },
    get crias() { return crias.size; },
    get ocultos() { return ocultos.length; },
    // el piso de adentro, para lo que cae (proyectiles, cristales, partículas)
    alturaPiso: (x, z) => (enSubida && subida ? subida.origen.y : arena && Math.hypot(x - arena.x, z - arena.z) < R + 1 ? arena.y : -1e9),
    pisoT,
    textoHud: () => (adentro && pelea ? `Adentro de la nave · ${textoNave(pelea)}` : ''),
  };
}
