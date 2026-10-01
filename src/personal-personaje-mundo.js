// 2.8: tu cuerpo en el mundo. Hasta la 2.7 el jugador era sólo una cámara: no tenía
// sombra ni aparecía en el modo foto. Acá hay un cuerpo liviano (una veintena de piezas
// simples) con la ropa y el aspecto que elegiste en "Tu personaje":
//   · en el modo foto se ve entero, con sus colores, para sacarte una foto con el bosque;
//   · para la sombra hay una silueta aparte: TODAS las piezas fundidas en una sola malla
//     que no pinta nada en la cámara (colorWrite y depthWrite apagados: no tapa la vista)
//     pero sí entra en el mapa de sombras. Una llamada de dibujo, sin textura.
//     (La capa 1 de cielo.js no sirve: en three r186 la pasada de sombras mira las capas
//     de la cámara, no las de la luz.)
//   · el mapa de sombras se rehace pocas veces (cuando se mueve el sol o te alejás 6 m,
//     ver main.js): para que tu sombra no quede atrás mientras caminás, la silueta sólo
//     está cuando estás quieto, y al quedarte quieto (o arrancar) se pide un mapa nuevo.
// Además, la mano y la manga en primera persona, debajo de lo que llevás en la mano.
import * as THREE from 'three';
import { aspecto } from './personal-personaje.js';
import { compactar } from './vida.js';
import { bola, tubo, torno, miembro, huso, deformar, pintar, colorear, matiz, mezcla, color, ruido3 } from './formas.js';

function lam(color) { return new THREE.MeshLambertMaterial({ color: new THREE.Color(color) }); }
function pieza(geo, mat, pos, rot = null, esc = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (esc) m.scale.set(esc[0], esc[1], esc[2]);
  return m;
}

// Todas las mallas de `g` en una sola geometría (sólo posiciones: es para la sombra).
function siluetaDe(g) {
  g.updateMatrixWorld(true);
  const partes = [];
  let total = 0;
  g.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    let v = o; let oculto = false;
    while (v && v !== g) { if (!v.visible) { oculto = true; break; } v = v.parent; }
    if (oculto) return;
    const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    q.applyMatrix4(o.matrixWorld);
    const pos = q.attributes.position.array;
    partes.push(pos); total += pos.length;
    q.dispose();
  });
  const todo = new Float32Array(total);
  let i = 0;
  for (const p of partes) { todo.set(p, i); i += p.length; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(todo, 3));
  geo.computeBoundingSphere();
  return geo;
}

export function crearCuerpoJugador(escena) {
  const raiz = new THREE.Group();
  raiz.name = 'cuerpo-jugador';
  escena.add(raiz);
  // la silueta de la sombra: invisible para la cámara, pero con sombra
  const matSilueta = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const silueta = new THREE.Mesh(new THREE.BufferGeometry(), matSilueta);
  silueta.name = 'cuerpo-jugador-sombra';
  silueta.castShadow = true; silueta.receiveShadow = false;
  silueta.frustumCulled = false;
  raiz.add(silueta);
  let cuerpo = null, piernas = [], brazos = [], verEnCamara = false, paso = 0, quieto = 0, conSilueta = null;
  const materiales = [];
  const geometrias = [];
  const geo = (g) => { geometrias.push(g); return g; };
  const mat = (c) => { const m = lam(c); materiales.push(m); return m; };

  function tirar() {
    if (cuerpo) raiz.remove(cuerpo);
    for (const m of materiales) m.dispose();
    for (const g of geometrias) g.dispose();
    materiales.length = 0; geometrias.length = 0;
    cuerpo = null; piernas = []; brazos = [];
  }

  function armar(datos) {
    tirar();
    const a = aspecto(datos);
    const k = a.ancho;
    const g = new THREE.Group();
    // 3.4: el cuerpo al estilo de la gente del valle (ver mallaPersona en gente.js): piernas de
    // torno con la bota, torso con la campera, hombros, codos y manos de mitón, cabeza con
    // nariz, orejas, cejas y el peinado elegido, gorro de lana con pompón y la bufanda que
    // cuelga. Cada grupo se funde en una malla (antes, una veintena de piezas sueltas). Los
    // pivotes de piernas (0.86) y brazos (1.40) son los de siempre.
    const piel = a.piel, campera = a.campera, pantalon = a.pantalon, botas = a.botas, pelo = a.pelo;
    const mano = a.guantes || piel;
    // piernas (con la bota), colgadas de la cadera para poder moverlas al caminar
    for (const l of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(l * 0.1 * k, 0.86, 0);
      piv.add(torno(pantalon, [[0.052, -0.74], [0.057, -0.66], [0.061, -0.55], [0.068, -0.46], [0.08, -0.3], [0.088 * k, -0.13], [0.089 * k, 0.0], [0.074 * k, 0.06]], null, null, [1, 1, 0.92], 11));
      piv.add(torno(botas, a.botasAltas
        ? [[0.055, -0.84], [0.062, -0.76], [0.068, -0.62], [0.072, -0.52], [0.077, -0.46], [0.072, -0.455]]
        : [[0.055, -0.84], [0.06, -0.78], [0.064, -0.7], [0.068, -0.65], [0.064, -0.645]], null, null, null, 11));
      piv.add(bola(botas, [0.062, 0.052, 0.13], [0, -0.818, 0.05]));
      piv.add(bola(matiz(botas, 0.55), [0.065, 0.019, 0.133], [0, -0.851, 0.045]));
      g.add(piv); piernas.push(piv);
    }
    // el torso con la campera, sobre la cadera; los hombros anchos y el pecho adelante
    const torso = new THREE.Group(); torso.position.set(0, 0.86, 0);
    torso.add(bola(pantalon, [0.155 * k, 0.12, 0.108], [0, 0.02, 0]));
    torso.add(deformar(torno(campera, [[0.17, -0.08], [0.168, 0.02], [0.158, 0.13], [0.174, 0.26], [0.2, 0.37], [0.214, 0.46], [0.212, 0.5], [0.186, 0.55], [0.134, 0.585], [0.073, 0.605]].map(([r, y]) => [r * k, y]), null, null, null, 16), (v) => {
      const pecho = Math.max(0, 1 - Math.abs(v.y - 0.35) / 0.16), hombro = Math.max(0, 1 - Math.abs(v.y - 0.48) / 0.08);
      v.z *= 0.74 * (v.z > 0 ? 1 + 0.08 * pecho : 0.96) * (v.y > 0.47 ? 0.88 : 1);
      v.x *= 1 + 0.07 * hombro;
    }));
    torso.add(torno(matiz(campera, 0.88), [[0.087, 0.57], [0.09, 0.61], [0.078, 0.625]], null, null, [1, 1, 0.95], 14));   // el cuello de la campera
    if (a.poncho) {
      // el poncho cae de los hombros y tapa los brazos, con la guarda clara cerca del borde
      const claroP = mezcla(a.poncho, '#e3d6b8', 0.7), oscuroP = matiz(a.poncho, 0.55);
      const p = torno(a.poncho, [[0.37, -0.2], [0.368, -0.17], [0.367, -0.166], [0.365, -0.14], [0.364, -0.136], [0.362, -0.11], [0.361, -0.106],
        [0.355, 0.04], [0.345, 0.2], [0.33, 0.34], [0.31, 0.45], [0.27, 0.515], [0.21, 0.56], [0.15, 0.59], [0.1, 0.615], [0.08, 0.635]].map(([r, y]) => [r * k, y]), null, null, null, 28);
      colorear(p, (c, v) => { if (v.y >= -0.1665 && v.y <= -0.1395) c.set(claroP); else if (v.y >= -0.1365 && v.y <= -0.1095) c.set(oscuroP); });
      torso.add(deformar(p, (v) => {
        const r = Math.hypot(v.x, v.z), cz = r > 1e-4 ? v.z / r : 0, fi = Math.atan2(v.x, v.z);
        const pl = 1 + 0.04 * Math.sin(fi * 7 + 0.4) * Math.min(1, Math.max(0, (0.38 - v.y) / 0.45));
        v.x *= pl; v.z *= pl;
        if (v.y < 0.12) v.y -= 0.075 * cz * cz * Math.min(1, (0.12 - v.y) / 0.25);
        v.z *= 0.64;
      }));
    }
    if (a.bufanda && !a.poncho) {
      const vuelta = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.034, 8, 18), color(a.bufanda));
      vuelta.position.set(0, 0.6, 0.008); vuelta.rotation.set(Math.PI / 2 - 0.12, 0, 0); vuelta.scale.set(1, 0.86, 1);
      torso.add(vuelta);
      torso.add(bola(a.bufanda, [0.036, 0.11, 0.017], [0.05, 0.48, 0.152], [-0.1, 0, 0.12]));
    }
    g.add(torso);
    // brazos colgados del hombro, con el codo y la mano de mitón al final
    for (const l of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(l * 0.25 * k, 1.4, 0);
      const x = -l * 0.03 * k;
      if (!a.poncho) {
        // 3.5: el brazo de una sola pieza suave, del hombro (que nace adentro del torso) a la
        // muñeca, como la gente del valle: sin la bola del hombro ni el anillo del codo
        piv.add(huso(campera, [[x - l * 0.03, 0.025, 0], [x - l * 0.01, -0.02, 0], [x + l * 0.008, -0.15, 0.0], [x + l * 0.018, -0.3, 0.004], [x + l * 0.022, -0.43, 0.014], [x + l * 0.027, -0.54, 0.024]],
          [0.047 * k, 0.062 * k, 0.058 * k, 0.05 * k, 0.046 * k, 0.042 * k], 18, 12));
        piv.add(torno(matiz(campera, 0.82), [[0.045, -0.02], [0.048, 0.016], [0.044, 0.02]], [x + l * 0.027, -0.55, 0.024], [-0.1, 0, 0], null, 11));
      }
      piv.add(bola(mano, [0.038, 0.055, 0.031], [x + l * 0.03, -0.6, 0.03]));
      piv.add(bola(mano, [0.014, 0.027, 0.016], [x + l * 0.003, -0.582, 0.046], [0, 0, l * 0.45]));
      g.add(piv); brazos.push(piv);
    }
    if (a.poncho) for (const b of brazos) b.position.x *= 0.8;
    // cuello y cabeza: mentón, nariz, orejas, ojos y cejas (que en la foto se sepa para dónde mirás)
    const cab = new THREE.Group(); cab.position.set(0, 1.56, 0);
    cab.add(tubo(piel, 0.049, 0.057, 0.18, [0, -0.06, 0.004]));
    cab.add(deformar(bola(piel, [0.104, 0.126, 0.114], [0, 0.07, 0.004], null, [18, 14]), (v) => {
      if (v.y < 0) { const t = -v.y; v.x *= 1 - 0.22 * t * t; v.z += 0.08 * t * Math.max(0, v.z); }
      if (v.z < 0) v.z *= 1.05;
      if (v.z > 0.6) v.z = 0.6 + (v.z - 0.6) * 0.6;
    }));
    cab.add(deformar(bola(matiz(piel, 0.97), [0.017, 0.029, 0.02], [0, 0.055, 0.105], [-0.2, 0, 0]), (v) => { if (v.y > 0) v.z *= 1 - 0.45 * v.y; }));
    for (const l of [-1, 1]) {
      cab.add(bola('#241c16', [0.013, 0.015, 0.005], [l * 0.036, 0.085, 0.098]));
      cab.add(bola(matiz(pelo, 0.85), [0.027, 0.007, 0.006], [l * 0.037, 0.109, 0.101], [0, 0, -l * 0.15]));
      cab.add(bola(piel, [0.016, 0.03, 0.014], [l * 0.103, 0.064, -0.004]));
    }
    cab.add(bola(matiz(piel, 0.72), [0.021, 0.0048, 0.0065], [0, 0.017, 0.104]));
    // el pelo según el peinado (con gorro, se ve lo que asoma)
    if (a.peinado !== 'rapado') {
      cab.add(deformar(bola(pelo, [0.11, 0.126, 0.12], [0, 0.088, -0.013], null, [16, 11]), (v) => {
        if (v.z > 0.15 && v.y < 0.4) v.z -= (v.z - 0.15) * 0.85 * Math.min(1, (0.4 - v.y) * 2.2);
        if (v.z < -0.1 && v.y < 0) v.y *= a.peinado === 'largo' ? 2.4 : 1.3;
      }));
    }
    if (a.peinado === 'trenza') cab.add(miembro(pelo, [[0, 0.02, -0.11], [0, -0.1, -0.13], [0, -0.24, -0.15]], [0.034, 0.03, 0.018], 8, 7));
    if (a.peinado === 'rodete') cab.add(bola(pelo, [0.055, 0.05, 0.048], [0, 0.17, -0.105]));
    if (a.gorro) {
      // el gorro de lana: copa, el doblez de abajo y el pompón
      cab.add(torno(a.gorro, [[0.118, 0.0], [0.121, 0.035], [0.11, 0.075], [0.08, 0.11], [0.04, 0.126], [0.0, 0.13]], [0, 0.112, -0.006], null, null, 16));
      cab.add(torno(matiz(a.gorro, 0.85), [[0.122, -0.006], [0.127, 0.02], [0.124, 0.045], [0.119, 0.05]], [0, 0.112, -0.006], null, null, 16));
      cab.add(pintar(bola(a.gorro, [0.042, 0.04, 0.042], [0, 0.255, -0.006]), (c, p) => { c.multiplyScalar(1 + ruido3(p.x * 60, p.y * 60, p.z * 60) * 0.08); }));
    }
    g.add(cab);
    compactar(g, { alto: 1.8, pie: 0.8, panza: 0.1, todo: true });
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; geo(o.geometry); } });
    // la silueta, de pie y quieta (se arma antes de colgar el cuerpo, en su lugar de origen)
    const vieja = silueta.geometry;
    silueta.geometry = siluetaDe(g);
    vieja.dispose();
    g.visible = verEnCamara;
    raiz.add(g);
    cuerpo = g;
  }

  // En el modo foto el cuerpo también se ve.
  function mostrarEnCamara(si) {
    verEnCamara = !!si;
    if (cuerpo) cuerpo.visible = verEnCamara;
  }

  // `js`: jugador.estado. Sin sombras ni modo foto, ni se recorre. Devuelve true cuando la
  // sombra cambió (apareció, se fue o cambió de pose) y conviene rehacer el mapa.
  function actualizar(dt, js, { conSombras = true } = {}) {
    if (!cuerpo) return false;
    const oculto = !js || js.enKayak || js.enTren || js.montado || js.nadando || (!conSombras && !verEnCamara);
    raiz.visible = !oculto;
    if (oculto) { const cambio = !!conSilueta; conSilueta = false; return cambio && conSombras; }
    const vel0 = Number(js.velocidadActual) || 0;
    // (con el mundo congelado del modo foto dt es 0: se cuenta igual)
    quieto = vel0 < 0.2 ? quieto + Math.max(dt, 1 / 60) : 0;
    const quiere = conSombras && quieto > 0.35;
    // la sombra cambia si aparece o se va, o si te sentás o te agachás estando quieto
    const firma = quiere ? `${!!js.sentado}${!!js.agachado}` : false;
    const cambio = firma !== conSilueta;
    conSilueta = firma;
    silueta.visible = quiere;
    raiz.position.set(js.pos.x, js.pos.y - (js.sentado ? 0.42 : 0), js.pos.z);
    // en el modo foto la cámara se va y gira sola: el cuerpo se queda como estaba (así
    // se puede dar la vuelta y sacarte de frente)
    if (!verEnCamara) raiz.rotation.y = js.yaw + Math.PI;
    const agachado = js.agachado && !js.sentado;
    raiz.scale.set(1, agachado ? 0.78 : 1, 1);
    const vel = Math.min(1.6, Number(js.velocidadActual) || 0);
    paso += dt * (3 + vel * 2.2);
    const bal = js.sentado ? 0 : Math.sin(paso) * Math.min(0.55, vel * 0.22);
    piernas[0].rotation.x = js.sentado ? -1.45 : bal;
    piernas[1].rotation.x = js.sentado ? -1.45 : -bal;
    brazos[0].rotation.x = -bal * 0.8;
    brazos[1].rotation.x = bal * 0.8;
    return cambio && conSombras;
  }

  return { aplicar: (d) => { armar(d); conSilueta = null; }, actualizar, mostrarEnCamara, raiz, silueta, cuerpo: () => cuerpo };
}

// La mano y la manga en primera persona, debajo de lo que llevás. `enMano` es el de
// enmano.js: se cuelga del soporte (el primer hijo de su pivote), así se balancea igual.
// Si enmano.js cambia y no hay soporte, simplemente no hay mano.
export function crearManoPropia(enMano) {
  const soporte = enMano?.pivote?.children?.[0];
  if (!soporte) return { aplicar() {}, actualizar() {}, grupo: null };
  const grupo = new THREE.Group();
  grupo.name = 'mano-jugador';
  const matManga = lam('#6b4a3a'), matMano = lam('#c49a70');
  // el puño agarra el mango un poco abajo del centro (ahí queda a la vista, abajo a la derecha)
  const puno = pieza(new THREE.SphereGeometry(0.036, 14, 10), matMano, [0.004, -0.06, 0.012], null, [1, 1.25, 1.1]);
  const munieca = pieza(new THREE.CylinderGeometry(0.03, 0.034, 0.05, 12), matMano, [0.012, -0.105, 0.03], [0.35, 0, -0.25]);
  const manga = pieza(new THREE.CylinderGeometry(0.046, 0.058, 0.34, 14), matManga, [0.06, -0.27, 0.1], [0.5, 0, -0.28]);
  grupo.add(puno, munieca, manga);
  grupo.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
  soporte.add(grupo);
  function aplicar(datos) {
    const a = aspecto(datos);
    matManga.color.set(a.poncho || a.campera);
    matMano.color.set(a.guantes || a.piel);
  }
  // Se ve sólo si hay algo en la mano y se está viendo (los prismáticos lo esconden).
  function actualizar() {
    let hay = false;
    for (const h of soporte.children) if (h !== grupo && h.visible) { hay = true; break; }
    grupo.visible = hay;
  }
  return { aplicar, actualizar, grupo };
}
