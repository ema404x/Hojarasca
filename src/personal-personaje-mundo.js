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
// 3.7.0: el cuerpo y la mano, al estilo de la gente (gente-cuerpo.js).
import * as THREE from 'three';
import { aspecto } from './personal-personaje.js';
import { crearPersona, soltarPersona, manoPrimeraPersona } from './gente-cuerpo.js';

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
  let manoAmor = null;   // 3.7.1 (mundo): el brazo que le das a tu pareja (0 el derecho, 1 el izquierdo) o null

  let persona = null;
  function tirar() {
    if (cuerpo) raiz.remove(cuerpo);
    if (persona) soltarPersona(persona);
    persona = null; cuerpo = null; piernas = []; brazos = [];
  }

  // 3.7.0: tu cuerpo, al estilo de la gente del valle (gente-cuerpo.js): la misma figura con piel
  // por huesos, con la ropa que elegiste (la campera, el poncho con su guarda, el gorro de lana, la
  // bufanda, los guantes, las botas) y tu peinado. Los pivotes de siempre (la figura de varón, a 1,07:
  // cadera a 0,88 y cabeza a 1,56). Sin sombra propia: la sombra es la silueta.
  function armar(datos) {
    tirar();
    persona = crearPersona({}, 'jugador', false, {}, { aspecto: aspectoJugador(aspecto(datos)) });
    const g = persona.g;
    piernas = persona.patas; brazos = persona.brazos;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
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
    // 3.7.1 (mundo): de la mano con tu pareja (amor-mundo.js): ese brazo, hacia ella (se ve en el modo foto y en la sombra)
    if (manoAmor !== null && brazos[manoAmor]) { const b = brazos[manoAmor]; b.rotation.x = -0.38; b.rotation.z = (manoAmor ? 1 : -1) * 0.11; }
    return cambio && conSombras;
  }

  return { aplicar: (d) => { armar(d); conSilueta = null; }, actualizar, mostrarEnCamara, raiz, silueta, cuerpo: () => cuerpo, tomarMano: (lado) => { manoAmor = lado === 0 || lado === 1 ? lado : null; } };
}

// La mano y la manga en primera persona, debajo de lo que llevás. `enMano` es el de
// enmano.js: se cuelga del soporte (el primer hijo de su pivote), así se balancea igual.
// Si enmano.js cambia y no hay soporte, simplemente no hay mano.
export function crearManoPropia(enMano) {
  const soporte = enMano?.pivote?.children?.[0];
  if (!soporte) return { aplicar() {}, actualizar() {}, grupo: null };
  const grupo = new THREE.Group();
  grupo.name = 'mano-jugador';
  // el puño agarra el mango un poco abajo del centro (ahí queda a la vista, abajo a la derecha)
  // 3.5.2: la mano como las de la gente del valle: el puño cerrado alrededor del mango con los
  // nudillos y el pulgar encima, la muñeca y la manga que se ensancha hacia el codo con su puño.
  // 3.7.0: al estilo P (gente-cuerpo.js): la piel con su pincelada (o el guante de lana) y la manga
  // con la tela y la guarda en el puño; una sola malla, que se rearma al cambiar la ropa.
  let malla = null;
  function aplicar(datos) {
    const a = aspecto(datos);
    if (malla) { grupo.remove(malla); malla.geometry.dispose(); }
    malla = manoPrimeraPersona({ piel: a.piel, guantes: a.guantes, manga: a.poncho || a.campera, guarda: a.poncho ? 2 : 1 });
    malla.userData.guante = a.guantes || null;   // 3.7.1: el guante va pintado en la malla; queda anotado (humo-2-8)
    grupo.add(malla);
  }
  aplicar(null);
  soporte.add(grupo);
  // Se ve sólo si hay algo en la mano y se está viendo (los prismáticos lo esconden).
  function actualizar() {
    let hay = false;
    for (const h of soporte.children) if (h !== grupo && h.visible) { hay = true; break; }
    grupo.visible = hay;
  }
  return { aplicar, actualizar, grupo };
}

// 3.7.0: lo que elegiste en "Tu personaje", como el aspecto de la gente (gente-ropa.js): la campera
// cerrada (el pulóver debajo no se ve), el pantalón de trabajo, las botas, el gorro de lana con su
// pompón, la bufanda, el poncho con la guarda de telar, los guantes y el peinado
function aspectoJugador(a) {
  const k = a.ancho || 1;
  return {
    colores: {
      piel: a.piel, pelo: a.pelo, ropa: a.campera, abrigo: a.campera, poncho: a.poncho || null, bufanda: a.bufanda || null,
      gorro: a.gorro ? 'gorroPunto' : null, gorroColor: a.gorro || null, pantalon: a.pantalon,
    },
    R: {
      mujer: false, botas: a.botasAltas ? 'goma' : 'altas', botaCol: a.botas, pantalon: a.pantalon, guantes: a.guantes || null,
      melena: a.peinado === 'largo', trenza: a.peinado === 'trenza', rodete: a.peinado === 'rodete', canas: /^#b9b4ab$/i.test(a.pelo) ? 0.6 : 0,
    },
    cuerpo: { ancho: k, fondo: 0.5 + 0.5 * k, brazos: 0.5 + 0.5 * k, piernas: 0.6 + 0.4 * k, panza: k > 1.1 ? 0.06 : 0 },
    cara: { sonrisa: 0.3 },
    guardas: { cuello: [1, 0, 'todo'], puno: [1, 0, 'todo'], poncho: [2, 0.07] },
  };
}
