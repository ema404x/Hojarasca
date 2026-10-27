// El zaino en el mundo: la malla y cómo anda. Las reglas están en caballo.js.
import * as THREE from 'three';
import { compactar, inclinacionTerrenoMamifero, MAT_FAUNA } from './vida.js';
import { bola, tubo, torno, miembro, huso, deformar, pintar, color, ruido3, etiquetar } from './formas.js';
// 4.12.2: la piel por huesos de los animales (cerca, Media y Alta)
import { armarPielCaballo } from './animales-piel.js';
import { lerp } from './ruido.js';
import { marcha } from './caballo.js';
import { sanearCaballoPersonal, firmaCaballo, PELAJE_CABALLO } from './personal-caballo.js';
import { desechar } from './personal-mallas.js';
import { ENGANCHE } from './carro.js';

// 2.8: un palo de `a` a `b` (para las riendas)
const _eje = new THREE.Vector3(), _arriba = new THREE.Vector3(0, 1, 0);
function paloEntre(mat, r, a, b) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  _eje.subVectors(vb, va);
  const largo = _eje.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 5), mat);
  m.position.copy(va).addScaledVector(_eje, 0.5);
  m.quaternion.setFromUnitVectors(_arriba, _eje.normalize());
  return m;
}
function caja(mat, tam, pos, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...tam), mat);
  m.position.set(...pos); m.rotation.set(...rot);
  return m;
}

// ---------------------------------------------------------------- el zaino
// 2.8: `ap` es cómo lo elegiste en "Personalizar" (ver `personal-caballo.js`): el pelaje y
// los colores del recado. Con lo de siempre sale el zaino de Don Ramón, ahora con riendas.
// 3.4: el criollo como es: compacto y musculoso, de pecho hondo y lomo corto, cuello grueso con
// crin abundante, cabeza de perfil recto con quijada marcada, orejas chicas, patas fuertes con
// rodilla, garrón, menudillo y casco, y cola tupida. Los cabos oscuros (crin, cola, hocico y
// medias) y las manchas del overo se pintan en los vértices; también la cabezada. Los pivotes
// (cuello, cabeza y patas) y lo del recado están donde estaban.
export function mallaCaballo(ap = sanearCaballoPersonal(null)) {
  const g = new THREE.Group();
  const pj = PELAJE_CABALLO[ap.pelaje] || PELAJE_CABALLO.zaino;
  const pelo = pj.pelo, oscuro = pj.oscuro, ojo = '#0a0806';
  const cuero = ap.montura, manta = ap.manta, metal = '#9aa0a4';
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const cOsc = new THREE.Color(oscuro), cMancha = pj.manchas ? new THREE.Color(pj.manchas) : null;
  // el pelaje: brillo en el lomo y la grupa, el vientre más oscuro, las medias oscuras y, en el
  // overo, las manchas blancas del costillar, el anca y la panza
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 + 0.08 * Math.max(0, n.y) - 0.1 * Math.max(0, -n.y));
    c.lerp(cOsc, 1 - suave(0.42, 0.62, p.y));
    if (cMancha && p.y > 0.75) {
      const k = ruido3(p.x * 2.2 + 3, p.y * 2.4, p.z * 2.1) + (Math.abs(p.x) > 0.2 ? 0.25 : 0) - (p.z > 0.7 ? 0.6 : 0) - (p.y > 1.45 ? 0.5 : 0);
      c.lerp(cMancha, suave(0.18, 0.26, k));
    }
  };
  const conPelaje = (m) => pintar(m, pelaje);
  // ---- el cuerpo, un torno acostado: pecho hondo, cinchera y grupa redonda
  const cuerpo = torno(pelo, [[0.0, -0.98], [0.2, -0.95], [0.33, -0.82], [0.39, -0.62], [0.4, -0.4], [0.385, -0.15], [0.395, 0.1], [0.41, 0.35], [0.4, 0.55], [0.34, 0.75], [0.2, 0.88], [0.0, 0.92]], [0, 1.24, 0], [Math.PI / 2, 0, 0], null, 18);
  deformar(cuerpo, (v) => {
    const largo = v.y; let alto = -v.z;
    if (alto < 0) alto *= 1.08 + 0.06 * suave(0.0, 0.5, largo); else alto *= 0.94;
    v.x *= 0.9 + 0.06 * suave(-0.2, -0.6, largo);   // la grupa, más ancha
    v.z = -alto;
  });
  g.add(conPelaje(cuerpo));
  // la cruz, que une el pescuezo con el lomo
  g.add(conPelaje(bola(pelo, [0.18, 0.2, 0.3], [0, 1.5, 0.56], [0.4, 0, 0])));
  // ---- el recado: pelero de lana, bastos de cuero y un estribo a cada lado
  // el pelero cae por los costados siguiendo el lomo, con la guarda en el borde; encima los
  // bastos (dos rollos de cuero) y el cojinillo de lana
  g.add(pintar(deformar(bola(manta, [0.38, 0.06, 0.42], [0, 1.625, 0.02], null, [22, 12]), (v) => {
    const ax = Math.abs(v.x); if (ax > 0.35) v.y -= Math.pow(ax - 0.35, 1.5) * 9;
  }), (c, p) => { if (p.y < 1.4) c.multiplyScalar(0.62); }));
  for (const l of [-1, 1]) g.add(miembro(cuero, [[l * 0.12, 1.66, -0.3], [l * 0.13, 1.69, 0.02], [l * 0.12, 1.67, 0.32]], [0.055, 0.065, 0.055], 8, 9));
  g.add(pintar(bola('#d8ccb2', [0.25, 0.05, 0.3], [0, 1.72, 0.02]), (c, p) => { c.multiplyScalar(1 + ruido3(p.x * 40, p.y * 40, p.z * 40) * 0.08); }));
  for (const l of [-1, 1]) {
    g.add(tubo(cuero, 0.015, 0.015, 0.55, [l * 0.38, 1.42, 0.05], null, 6, true));
    g.add(torno(metal, [[0.035, -0.04], [0.045, 0.0], [0.035, 0.04]], [l * 0.38, 1.13, 0.05], [0, 0, Math.PI / 2], [1, 1, 0.5], 10));
  }
  // 2.8: las alforjas, a los dos lados detrás de la montura
  if (ap.conAlforjas) {
    const alforja = color(ap.alforjas), tapa = color('#3a2616');
    for (const l of [-1, 1]) {
      g.add(caja(alforja, [0.1, 0.26, 0.3], [l * 0.41, 1.42, -0.42], [0, 0, l * 0.1]));
      g.add(caja(tapa, [0.105, 0.07, 0.31], [l * 0.415, 1.54, -0.42], [0, 0, l * 0.1]));
    }
    g.add(caja(alforja, [0.72, 0.04, 0.26], [0, 1.6, -0.42]));   // el puente sobre el lomo
  }
  // la cola, tupida, que cae desde el maslo
  // 3.5: la cola en mechones (antes era un solo tubo liso): el maslo corto y, de ahí, siete
  // mechones que caen abiertos, de largos distintos, con la punta afinada
  const cerda = (c, p) => { c.multiplyScalar(0.9 + 0.2 * (0.5 + 0.5 * Math.sin(p.x * 140 + p.z * 60))); };
  g.add(etiquetar(huso(oscuro, [[0, 1.52, -0.84], [0, 1.47, -0.95], [0, 1.36, -1.03]], [0.06, 0.075, 0.07], 6, 10), 'cola'));   // (4.12.2: lo etiquetado con `cola` y `oreja` lleva sus huesos en la piel)
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5), x = a * 0.11, largo = 0.72 + 0.1 * Math.sin(i * 2.3) + (Math.abs(a) < 0.2 ? 0.08 : 0);
    const z0 = -1.02 - Math.abs(a) * 0.02, abre = 1 + Math.abs(a) * 0.6;
    g.add(etiquetar(pintar(huso(oscuro, [[x * 0.5, 1.42, -0.99], [x * abre, 1.2, z0 - 0.08], [x * abre * 1.3, 1.42 - largo * 0.62, z0 - 0.07], [x * abre * 1.4, 1.42 - largo, z0 - 0.02 + 0.03 * Math.cos(i * 1.7)]],
      [0.05, 0.05, 0.035, 0.008], 8, 6), cerda), 'cola'));
  }
  // ---- el cuello y la cabeza, con la crin (se mueven juntos al pastar)
  const cuello = new THREE.Group(); cuello.position.set(0, 1.55, 0.8);
  const pescuezo = miembro(pelo, [[0, -0.2, -0.2], [0, 0.08, 0.06], [0, 0.36, 0.24], [0, 0.6, 0.36]], [0.28, 0.21, 0.16, 0.135], 10, 14);
  pescuezo.scale.set(0.74, 1, 1);
  cuello.add(conPelaje(pescuezo));
  // la crin, tupida, echada sobre el borde de arriba del pescuezo
  // 3.5: una raíz fina sobre el borde y, colgando de ella hacia un lado, mechones sueltos de
  // largos distintos (antes era una sola lámina lisa)
  const lomoCrin = [[0.03, 0.08, -0.2], [0.04, 0.34, -0.02], [0.035, 0.56, 0.15], [0.02, 0.7, 0.27]];
  const crin = miembro(oscuro, lomoCrin, [0.045, 0.055, 0.045, 0.025], 10, 8);
  crin.scale.set(0.6, 1, 1);
  cuello.add(pintar(crin, cerda));
  const curvaCrin = new THREE.CatmullRomCurve3(lomoCrin.map((q) => new THREE.Vector3(...q)));
  const q = new THREE.Vector3();
  for (let i = 0; i < 13; i++) {
    const t = 0.04 + i * 0.07;
    curvaCrin.getPoint(Math.min(0.97, t), q);
    const lado = i % 4 === 3 ? -1 : 1, largo = (0.15 + 0.06 * Math.sin(i * 2.7)) * (1 - t * 0.35);
    cuello.add(pintar(huso(oscuro, [[q.x * 0.6, q.y, q.z], [q.x * 0.6 + lado * 0.07, q.y - largo * 0.45, q.z - 0.03], [q.x * 0.6 + lado * 0.1, q.y - largo, q.z - 0.05 + 0.02 * Math.sin(i)]],
      [0.032, 0.026, 0.005], 5, 6), cerda));
  }
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.64, 0.4);
  const testa = miembro(pelo, [[0, 0.07, -0.05], [0, 0.02, 0.14], [0, -0.04, 0.3], [0, -0.075, 0.45]], [0.13, 0.125, 0.105, 0.09], 8, 12);
  testa.scale.set(0.8, 1, 1);
  cabeza.add(conPelaje(testa));
  cabeza.add(conPelaje(bola(pelo, [0.1, 0.13, 0.13], [0, -0.03, 0.04])));                     // la quijada
  cabeza.add(pintar(bola(pelo, [0.08, 0.08, 0.095], [0, -0.085, 0.46]), (c) => c.lerp(cOsc, 0.75)));   // el hocico, más oscuro
  for (const l of [-1, 1]) {
    cabeza.add(bola(ojo, [0.016, 0.024, 0.026], [l * 0.094, 0.05, 0.12]));
    cabeza.add(bola('#120d0a', [0.018, 0.012, 0.012], [l * 0.036, -0.075, 0.545]));             // los ollares
    const oreja = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8, 2), color(pelo)), (v) => { v.z *= 0.55; });
    oreja.position.set(l * 0.06, 0.17, -0.04); oreja.rotation.set(-0.2, 0, -l * 0.22);
    cabeza.add(etiquetar(conPelaje(oreja), 'oreja'));
  }
  cabeza.add(miembro(oscuro, [[0, 0.15, -0.03], [0, 0.13, 0.07], [0, 0.085, 0.13]], [0.04, 0.032, 0.01], 4, 6));   // el copete
  // la cabezada de cuero: la muserola
  const correa = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.012, 5, 20), color(ap.riendas));
  correa.position.set(0, -0.05, 0.34); correa.rotation.set(Math.PI / 2 + 0.28, 0, 0); correa.scale.set(0.82, 1, 1);
  cabeza.add(correa);
  cuello.add(cabeza);
  // 2.8: las riendas, de las argollas del freno hasta la cruz (se mueven con el cuello)
  const riendas = color(ap.riendas);
  for (const l of [-1, 1]) {
    cuello.add(bola(metal, [0.025, 0.025, 0.025], [l * 0.11, 0.56, 0.8]));
    cuello.add(paloEntre(riendas, 0.012, [l * 0.11, 0.56, 0.8], [l * 0.16, 0.05, -0.28]));
  }
  g.add(cuello);
  // ---- las patas: antebrazo, rodilla, caña, menudillo y casco adelante; muslo, garrón y caña
  // atrás. Cuelgan del mismo pivote de siempre.
  const patas = [];
  for (const [px, pz] of [[-0.2, 0.62], [0.2, 0.62], [-0.2, -0.62], [0.2, -0.62]]) {
    const piv = new THREE.Group(); piv.position.set(px, 1.05, pz);
    if (pz > 0) piv.add(conPelaje(miembro(pelo, [[0, 0.15, -0.02], [0, -0.2, 0.0], [0, -0.48, 0.02], [0, -0.56, 0.02], [0, -0.86, 0.0], [0, -0.95, 0.03]], [0.145, 0.115, 0.08, 0.076, 0.062, 0.066], 14, 10)));
    else piv.add(conPelaje(miembro(pelo, [[0, 0.16, 0.02], [0, -0.14, -0.04], [0, -0.42, -0.13], [0, -0.6, -0.09], [0, -0.86, -0.02], [0, -0.95, 0.03]], [0.17, 0.135, 0.08, 0.066, 0.062, 0.066], 14, 10)));
    piv.add(torno('#2b2622', [[0.0, -1.055], [0.072, -1.05], [0.07, -1.0], [0.058, -0.965], [0.0, -0.96]], [0, 0, 0.04], null, [1, 1, 1.15], 10));   // el casco
    g.add(piv); patas.push(piv);
  }
  compactar(g, { alto: 1.65, pie: 0.86, panza: 0.08, todo: true });
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.parent === g; });   // sombra del cuerpo, no de cada hueso
  // 4.12.2: la misma figura con huesos, para cuando está cerca (null en Baja y Mínima)
  const m = { g, cuello, cabeza, patas };
  m.piel = armarPielCaballo(m);
  return m;
}

// ---------------------------------------------------------------- 4.11.5: el carro
// Un carro de campo de dos ruedas: tablón con barandas bajas, eje, ruedas de rayos con llanta de hierro y dos varas que terminan
// en el balancín, que se engancha detrás del caballo. El origen es el suelo bajo el eje; +z mira al caballo. Las piezas que no se
// mueven se funden en una sola malla (compactar); cada rueda es un grupo propio que gira con lo que anda.
export const RUEDA_CARRO = 0.46;
const _p = { x: 0, y: 0, z: 0 };
const RADIO_CUERPO_CARRO = 0.6, ALTO_CUERPO_CARRO = 0.7;   // 4.12.2: lo que ocupa el cuerpo del carro para la colisión
export function mallaCarro() {
  const R = RUEDA_CARRO;
  const madera = color('#7a5638'), oscura = color('#5a3e28'), tabla = color('#8a6b4a'), hierro = color('#2e2c2a');
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  // el piso de tablas (cinco, con una luz fina entre cada una), las baranda bajas y los postes de las esquinas
  for (let i = 0; i < 5; i++) g.add(caja(tabla, [0.2, 0.045, 1.6], [-0.44 + i * 0.22, 0.68, -0.05]));
  for (const l of [-1, 1]) g.add(caja(madera, [0.04, 0.2, 1.6], [l * 0.56, 0.82, -0.05]));
  g.add(caja(madera, [1.16, 0.2, 0.04], [0, 0.82, -0.85]));
  g.add(caja(madera, [1.16, 0.3, 0.04], [0, 0.87, 0.75]));
  for (const x of [-1, 1]) for (const z of [-0.85, 0.75]) g.add(caja(oscura, [0.06, 0.5, 0.06], [x * 0.56, 0.84, z]));
  // las dos vigas del chasis (de punta a punta), el eje y el cubo de cada rueda
  for (const l of [-1, 1]) g.add(caja(oscura, [0.07, 0.07, 1.7], [l * 0.3, 0.62, -0.02]));
  g.add(tubo('#5a3e28', 0.04, 0.04, 1.5, [0, R, 0], [0, 0, Math.PI / 2], 8, true));
  // las varas suben del chasis al balancín, que queda a la altura del lomo del caballo
  for (const l of [-1, 1]) g.add(paloEntre(madera, 0.035, [l * 0.3, 0.62, 0.55], [l * 0.3, ENGANCHE.alto, ENGANCHE.largo]));
  g.add(tubo('#2e2c2a', 0.025, 0.025, 0.72, [0, ENGANCHE.alto, ENGANCHE.largo], [0, 0, Math.PI / 2], 8, true));
  // la carga: dos bolsas, un cajón y un rollo de lona
  g.add(bola('#c9b890', [0.26, 0.17, 0.2], [-0.25, 0.84, -0.45], [0, 0.4, 0.1]));
  g.add(bola('#bba57a', [0.24, 0.16, 0.2], [0.27, 0.83, -0.5], [0, -0.3, -0.1]));
  g.add(caja(oscura, [0.5, 0.26, 0.4], [0.02, 0.83, 0.2]));
  g.add(caja(color('#7a6b3a'), [0.52, 0.04, 0.42], [0.02, 0.97, 0.2]));
  // las ruedas: la llanta de madera, la banda de hierro, el cubo y ocho rayos (cuatro pasantes)
  const ruedas = [];
  for (const l of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(l * 0.66, R, 0);
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R - 0.035, 0.032, 6, 22), madera));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.013, 5, 22), hierro));
    w.add(tubo('#5a3e28', 0.065, 0.065, 0.16, [0, 0, 0], [0, 0, Math.PI / 2], 8, true));
    for (let k = 0; k < 4; k++) w.add(caja(madera, [0.04, 2 * (R - 0.04), 0.035], [0, 0, 0], [(k * Math.PI) / 4, 0, 0]));
    w.children.forEach((c) => { if (c.isMesh && c.geometry.type === 'TorusGeometry') c.rotation.y = Math.PI / 2; });
    g.add(w); ruedas.push(w);
  }
  compactar(g);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { g, ruedas };
}

// 4.12.2: `alturaPie(x, z, y)` (opcional) es sobre qué se apoya algo en (x, z): el piso de una obra, el Puente de Troncos o un muelle si hay, y si no
// el terreno (igual que el jugador a pie). Sin ella (pruebas viejas) vale sólo el terreno, como antes.
// `empujar(pos, radio, alto)` (opcional) saca una posición {x, y, z} de lo que choca (la misma colisión que usan el jugador y los animales).
export function crearCaballo(T, escena, alturaPie = null, empujar = null) {
  const alto = (x, z, y) => (alturaPie ? alturaPie(x, z, y) : T.altura(x, z));
  let apariencia = sanearCaballoPersonal(null);
  const m = mallaCaballo(apariencia);
  m.g.visible = false;
  escena.add(m.g);
  const est = { x: 0, z: 0, yaw: 0, fase: 0, vel: 0, montado: false, visible: false, conCarro: false };
  // 4.11.5: el carro, si lo enganchaste: sigue al balancín como un remolque (el eje queda a ENGANCHE.largo del enganche)
  let carro = null;
  const cs = { x: 0, z: 0, yaw: 0, listo: false, giro: 0 };

  // `donde`: {x, z, yaw}. `vel`: la velocidad del jugador si va montado. `sinCarro`: atado a las varas del sulky no lleva el carro.
  function actualizar(dt, donde, vel, montado, visible, sinCarro = false) {
    est.montado = montado;
    est.visible = visible;
    m.g.visible = visible;
    if (!visible) { seguirCarro(dt, false); return; }
    est.x = donde.x; est.z = donde.z;
    est.yaw = donde.yaw;
    est.vel = lerp(est.vel, montado ? vel : 0, 1 - Math.exp(-dt * 6));
    const mc = marcha(est.vel);
    est.fase += dt * mc.cadencia;
    // 4.12.2: montado, el caballo está a la altura en que vas vos (la cubierta del puente, no el lecho del arroyo de abajo)
    const y = alto(est.x, est.z, Number.isFinite(donde.y) ? donde.y : m.g.position.y);
    est.y = y;
    m.g.position.set(est.x, y + (mc.modo === 'quieto' ? 0 : Math.abs(Math.sin(est.fase)) * 0.05 * mc.amplitud), est.z);
    m.g.rotation.y = est.yaw;
    // 4.12.2: sobre un piso (puente, muelle) va derecho: la inclinación del terreno de abajo no vale
    const suelo = y > T.altura(est.x, est.z) + 0.3 ? { pitch: 0, roll: 0 } : inclinacionTerrenoMamifero(T, { x: est.x, z: est.z }, est.yaw, 0.22);
    m.g.rotation.x = lerp(m.g.rotation.x, suelo.pitch, 1 - Math.exp(-dt * 6));
    m.g.rotation.z = lerp(m.g.rotation.z, suelo.roll, 1 - Math.exp(-dt * 6));
    // patas: el trote es diagonal (mano izquierda con pata derecha), el galope va de a pares
    const galope = mc.modo === 'galope';
    m.patas.forEach((p, k) => {
      const diag = (k === 0 || k === 3) ? 0 : Math.PI;
      const par = k < 2 ? 0 : Math.PI * 0.6;
      p.rotation.x = mc.modo === 'quieto' ? 0 : Math.sin(est.fase + (galope ? par : diag)) * mc.amplitud;
    });
    // quieto y sin jinete, cabecea y pasta un poco
    const pastando = !montado && mc.modo === 'quieto';
    seguirCarro(dt, visible && est.conCarro && !sinCarro);
    m.cuello.rotation.x = lerp(m.cuello.rotation.x, pastando ? 0.55 + Math.sin(performance.now() / 2400) * 0.12 : (galope ? 0.18 : 0), 1 - Math.exp(-dt * 2));
    // 4.12.2: cerca y en Media o Alta se dibuja con huesos: marchas continuas, columna, cuello, cola y orejas (la rígida sigue siendo la fuente de la pose)
    if (m.piel?.lod(m.g)) m.piel.posar(dt, m, { fase: est.fase, modo: mc.modo, amplitud: mc.amplitud, galope, montado });
  }

  // 4.11.5: el eje del carro queda siempre a ENGANCHE.largo del enganche, en la línea que lo une con él (así gira como un remolque de
  // verdad); el piso se apoya en cuatro puntos del terreno (dos por eje) para que no lo atraviese en una ladera
  function seguirCarro(dt, con) {
    if (!con) { if (carro) carro.g.visible = false; cs.listo = false; return; }
    if (!carro) { carro = mallaCarro(); escena.add(carro.g); }
    const sy = Math.sin(est.yaw), cy = Math.cos(est.yaw);
    const hx = est.x - sy * ENGANCHE.atras, hz = est.z - cy * ENGANCHE.atras;
    let giro = 0;
    let dx = hx - cs.x, dz = hz - cs.z;
    if (!cs.listo || Math.hypot(dx, dz) > 8) { cs.yaw = est.yaw; cs.x = hx - sy * ENGANCHE.largo; cs.z = hz - cy * ENGANCHE.largo; cs.listo = true; }
    else {
      const d = Math.hypot(dx, dz) || 1e-6;
      dx /= d; dz /= d;
      const antes = { x: cs.x, z: cs.z };
      cs.x = hx - dx * ENGANCHE.largo; cs.z = hz - dz * ENGANCHE.largo;
      // 4.12.2: el carro ya no atraviesa árboles, obras, cercas ni paredes. Si el cuerpo del carro cae adentro de algo, la colisión lo
      // saca y el carro gira alrededor del enganche hacia donde quedó libre (sigue a ENGANCHE.largo, así que el balancín no se despega).
      // Si la salida cae sobre el propio enganche (no hay hacia dónde girar) se queda como estaba. Es sólo dibujo: no cambia la mochila ni el paso del caballo.
      if (empujar) {
        try {
          _p.x = cs.x; _p.z = cs.z; _p.y = Number.isFinite(est.y) ? est.y + 0.25 : 0;
          empujar(_p, RADIO_CUERPO_CARRO, ALTO_CUERPO_CARRO);
          const ex = hx - _p.x, ez = hz - _p.z, de = Math.hypot(ex, ez);
          if (Number.isFinite(de) && de > 0.6) { dx = ex / de; dz = ez / de; cs.x = hx - dx * ENGANCHE.largo; cs.z = hz - dz * ENGANCHE.largo; }
        } catch { /* la colisión nunca frena el dibujo */ }
      }
      cs.yaw = Math.atan2(dx, dz);
      giro = (Math.hypot(cs.x - antes.x, cs.z - antes.z) * (((cs.x - antes.x) * dx + (cs.z - antes.z) * dz) >= 0 ? 1 : -1)) / RUEDA_CARRO;
    }
    const fx = Math.sin(cs.yaw), fz = Math.cos(cs.yaw), lx = Math.cos(cs.yaw), lz = -Math.sin(cs.yaw);
    // 4.12.2: (todo el carro se apoya como el caballo: sobre el puente si va por el puente)
    const yRef = Number.isFinite(est.y) ? est.y : 0;
    const yA = alto(cs.x + fx, cs.z + fz, yRef), yR = alto(cs.x - fx, cs.z - fz, yRef);
    const yD = alto(cs.x + lx * 0.66, cs.z + lz * 0.66, yRef), yI = alto(cs.x - lx * 0.66, cs.z - lz * 0.66, yRef);
    const g = carro.g;
    g.visible = true;
    g.rotation.y = cs.yaw;
    g.rotation.x = lerp(g.rotation.x, -Math.atan2(yA - yR, 2) , 1 - Math.exp(-dt * 12));
    g.rotation.z = lerp(g.rotation.z, Math.atan2(yD - yI, 1.32), 1 - Math.exp(-dt * 12));
    // en una ladera el carro se inclina y el balancín se corre: se acomoda el carro para que el balancín caiga justo en el enganche
    const rx = g.rotation.x, rz = g.rotation.z, y1 = ENGANCHE.alto * Math.cos(rz), x1 = -ENGANCHE.alto * Math.sin(rz);
    const z2 = y1 * Math.sin(rx) + ENGANCHE.largo * Math.cos(rx);
    const gx = hx - (x1 * Math.cos(cs.yaw) + z2 * Math.sin(cs.yaw)), gz = hz - (-x1 * Math.sin(cs.yaw) + z2 * Math.cos(cs.yaw));
    g.position.set(gx, (alto(gx + lx * 0.66, gz + lz * 0.66, yRef) + alto(gx - lx * 0.66, gz - lz * 0.66, yRef)) / 2, gz);
    for (const w of carro.ruedas) w.rotation.x += giro;
  }

  const distancia = (pos) => Math.hypot(pos.x - est.x, pos.z - est.z);

  // 2.8: lo elegido en "Personalizar". Si cambió cómo se ve, se rearma la malla sin
  // moverlo: el grupo es el mismo, cambian las piezas de adentro.
  function personalizar(datos) {
    const nuevo = sanearCaballoPersonal(datos);
    est.conCarro = nuevo.carro === true && nuevo.enganchado === true;   // 4.11.5
    const rearmar = firmaCaballo(nuevo) !== firmaCaballo(apariencia);
    apariencia = nuevo;
    if (!rearmar) return false;
    const n = mallaCaballo(nuevo);
    const cuelloX = m.cuello.rotation.x;
    m.piel?.liberar();
    const viejas = [...m.g.children];
    for (const c of viejas) m.g.remove(c);
    for (const c of [...n.g.children]) m.g.add(c);
    for (const c of viejas) desechar(c, [MAT_FAUNA]);
    m.cuello = n.cuello; m.cabeza = n.cabeza; m.patas = n.patas; m.piel = n.piel;
    m.cuello.rotation.x = cuelloX;
    return true;
  }
  return { actualizar, distancia, est, malla: m.g, carro: () => carro, conCarro: () => est.conCarro, personalizar, apariencia: () => apariencia, nombre: () => apariencia.nombre };
}
