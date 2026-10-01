// El zaino en el mundo: la malla y cómo anda. Las reglas están en caballo.js.
import * as THREE from 'three';
import { compactar, inclinacionTerrenoMamifero, MAT_FAUNA } from './vida.js';
import { bola, tubo, torno, miembro, huso, deformar, pintar, color, ruido3 } from './formas.js';
import { lerp } from './ruido.js';
import { marcha } from './caballo.js';
import { sanearCaballoPersonal, firmaCaballo, PELAJE_CABALLO } from './personal-caballo.js';
import { desechar } from './personal-mallas.js';

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
function mallaCaballo(ap = sanearCaballoPersonal(null)) {
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
  g.add(huso(oscuro, [[0, 1.52, -0.84], [0, 1.47, -0.95], [0, 1.36, -1.03]], [0.06, 0.075, 0.07], 6, 10));
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5), x = a * 0.11, largo = 0.72 + 0.1 * Math.sin(i * 2.3) + (Math.abs(a) < 0.2 ? 0.08 : 0);
    const z0 = -1.02 - Math.abs(a) * 0.02, abre = 1 + Math.abs(a) * 0.6;
    g.add(pintar(huso(oscuro, [[x * 0.5, 1.42, -0.99], [x * abre, 1.2, z0 - 0.08], [x * abre * 1.3, 1.42 - largo * 0.62, z0 - 0.07], [x * abre * 1.4, 1.42 - largo, z0 - 0.02 + 0.03 * Math.cos(i * 1.7)]],
      [0.05, 0.05, 0.035, 0.008], 8, 6), cerda));
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
    cabeza.add(conPelaje(oreja));
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
  return { g, cuello, cabeza, patas };
}

export function crearCaballo(T, escena) {
  let apariencia = sanearCaballoPersonal(null);
  const m = mallaCaballo(apariencia);
  m.g.visible = false;
  escena.add(m.g);
  const est = { x: 0, z: 0, yaw: 0, fase: 0, vel: 0, montado: false, visible: false };

  // `donde`: {x, z, yaw}. `vel`: la velocidad del jugador si va montado.
  function actualizar(dt, donde, vel, montado, visible) {
    est.montado = montado;
    est.visible = visible;
    m.g.visible = visible;
    if (!visible) return;
    est.x = donde.x; est.z = donde.z;
    est.yaw = donde.yaw;
    est.vel = lerp(est.vel, montado ? vel : 0, 1 - Math.exp(-dt * 6));
    const mc = marcha(est.vel);
    est.fase += dt * mc.cadencia;
    const y = T.altura(est.x, est.z);
    m.g.position.set(est.x, y + (mc.modo === 'quieto' ? 0 : Math.abs(Math.sin(est.fase)) * 0.05 * mc.amplitud), est.z);
    m.g.rotation.y = est.yaw;
    const suelo = inclinacionTerrenoMamifero(T, { x: est.x, z: est.z }, est.yaw, 0.22);
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
    m.cuello.rotation.x = lerp(m.cuello.rotation.x, pastando ? 0.55 + Math.sin(performance.now() / 2400) * 0.12 : (galope ? 0.18 : 0), 1 - Math.exp(-dt * 2));
  }

  const distancia = (pos) => Math.hypot(pos.x - est.x, pos.z - est.z);

  // 2.8: lo elegido en "Personalizar". Si cambió cómo se ve, se rearma la malla sin
  // moverlo: el grupo es el mismo, cambian las piezas de adentro.
  function personalizar(datos) {
    const nuevo = sanearCaballoPersonal(datos);
    const rearmar = firmaCaballo(nuevo) !== firmaCaballo(apariencia);
    apariencia = nuevo;
    if (!rearmar) return false;
    const n = mallaCaballo(nuevo);
    const cuelloX = m.cuello.rotation.x;
    const viejas = [...m.g.children];
    for (const c of viejas) m.g.remove(c);
    for (const c of [...n.g.children]) m.g.add(c);
    for (const c of viejas) desechar(c, [MAT_FAUNA]);
    m.cuello = n.cuello; m.cabeza = n.cabeza; m.patas = n.patas;
    m.cuello.rotation.x = cuelloX;
    return true;
  }
  return { actualizar, distancia, est, malla: m.g, personalizar, apariencia: () => apariencia, nombre: () => apariencia.nombre };
}
