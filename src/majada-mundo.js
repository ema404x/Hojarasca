// Las ovejas en el mundo: viven en el corral grande del galpón de esquila, que estaba
// armado con su portón y sus colisiones pero vacío. Pastan, se arriman entre ellas y
// se apartan del perro y del que corre, así que cuando el perro entra al corral la
// majada se junta sola. El vellón se achica al esquilarla y vuelve a crecer.
import * as THREE from 'three';
import { lam, compactar, inclinacionTerrenoMamifero, marchaMamifero } from './vida.js';
import { bola, miembro, deformar, pintar, matiz, ruido3, pata as pataMiembro } from './formas.js';
import { rng, lerp, clamp } from './ruido.js';
import { OVEJAS as OVEJAS_GALPON, lanaDe, rumboOveja, RADIO_ESQUILA } from './majada.js';

// El corral grande del galpón, en coordenadas locales del galpón (estructuras.js).
// 3.0.1: el corral del galpón se corrió 2,6 m (su alambrado tapaba el portón): la majada, con él
const CORRAL = { lx: -2, lz: -15.6, radio: 9 };
const RADIO_PASTO = 7.4;   // hasta dónde andan: el alambrado está a nueve metros

// 3.4: la oveja con su forma: cabeza alargada de nariz romana (cara blanca o negra, como
// antes), orejas caídas hacia los costados, patas finas con rodilla y pezuña, y el vellón
// con los rulos de la lana (un bulto ondulado, no una esfera lisa). Mismos pivotes, y el
// vellón sigue aparte con su material de siempre (es lo único que cambia de tamaño).
// (3.7.2 (granja): exportada: el cordero de tu corral sale de esta misma oveja, ver granja-mundo.js)
export function mallaOveja(caraNegra, r) {
  const g = new THREE.Group();
  const cara = caraNegra ? '#2c2622' : '#d9cfbd', pata = caraNegra ? '#2c2622' : '#6a5d4c';
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.66, 0.46);
  const testa = miembro(cara, [[0, 0.03, -0.08], [0, 0.03, 0.04], [0, -0.01, 0.14], [0, -0.05, 0.21]], [0.075, 0.09, 0.07, 0.045], 8, 11);
  testa.scale.set(0.85, 1, 1);
  cabeza.add(testa);
  cabeza.add(bola(matiz(cara, 0.7), [0.03, 0.02, 0.02], [0, -0.04, 0.225]));                     // la nariz
  cabeza.add(pintar(bola('#ece6da', [0.09, 0.06, 0.08], [0, 0.085, -0.02]), (c, p) => { c.multiplyScalar(1 + ruido3(p.x * 50, p.y * 50, p.z * 50) * 0.06); }));   // el copete de lana
  for (const l of [-1, 1]) {
    cabeza.add(bola('#0e0c0a', [0.013, 0.014, 0.011], [l * 0.06, 0.04, 0.08]));
    cabeza.add(bola(cara, [0.07, 0.018, 0.032], [l * 0.11, 0.035, -0.02], [0, -l * 0.3, -l * 0.35]));   // orejas caídas
  }
  g.add(cabeza);
  const patas = [];
  // 3.5.2: las patas se leían como palitos largos bajo una bola: ahora son más gruesas, con la
  // rodilla y el garrón marcados, la caña más oscura abajo y la pezuña partida. (Se probó
  // bajarles la lana del vellón por el muslo y se leía como medias: quedó sin.)
  const tono = 0.86 + r() * 0.08;
  for (const [px, pz] of [[-0.14, 0.26], [0.14, 0.26], [-0.14, -0.26], [0.14, -0.26]]) {
    const piv = new THREE.Group(); piv.position.set(px, 0.46, pz);
    piv.add(pintar(pataMiembro(pata, 0.46, pz > 0, 0.05, 9), (c, p) => {
      if (p.y < 0.12) c.multiplyScalar(0.82 + p.y * 1.5);
    }));
    for (const l of [-1, 1]) piv.add(bola(matiz(pata, 0.55), [0.012, 0.018, 0.03], [l * 0.011, -0.448, 0.016]));   // la pezuña partida
    g.add(piv); patas.push(piv);
  }
  compactar(g, { alto: 0.9, pie: 0.88, todo: true });
  // El vellón va aparte y sin compactar: es lo único que cambia de tamaño.
  const vellon = new THREE.Group(); vellon.position.set(0, 0.62, 0);
  const lana = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), lam(new THREE.Color(tono, tono * 0.96, tono * 0.88)));
  lana.scale.set(0.3, 0.27, 0.44);
  // los rulos: la superficie ondula en mechones (la lana se ve en bultos, no lisa)
  deformar(lana, (v) => { const k = 1 + 0.07 * ruido3(v.x * 3.1 + 7, v.y * 3.3, v.z * 2.9) + 0.03 * ruido3(v.x * 8, v.y * 8, v.z * 8); v.multiplyScalar(k); });
  vellon.add(lana);
  g.add(vellon);
  // Sombra sólo del vellón, que es el bulto: patas y cabeza no se notan y
  // duplicarían las llamadas del pase de sombras.
  vellon.children[0].castShadow = true;
  return { g, cabeza, patas, vellon };
}

// 2.4: `opciones` arma otra majada fuera del galpón (el corral propio, ver corral.js):
// { centro: {x, z}, cantidad, radio, semilla, propia }.
export function crearMajada(T, escena, opciones = {}) {
  const gal = T.lugares.galpon;
  if (!gal && !opciones.centro) return null;
  let centro;
  if (opciones.centro) centro = { x: opciones.centro.x, z: opciones.centro.z };
  else {
    const c = Math.cos(gal.rot), s = Math.sin(gal.rot);
    centro = { x: gal.x + CORRAL.lx * c + CORRAL.lz * s, z: gal.z - CORRAL.lx * s + CORRAL.lz * c };
  }
  const OVEJAS = opciones.cantidad ?? OVEJAS_GALPON;
  let radioPasto = opciones.radio ?? RADIO_PASTO;
  const r = rng(opciones.semilla ?? 4417);
  const ovejas = [];
  for (let i = 0; i < OVEJAS; i++) {
    const m = mallaOveja(i % 3 === 0, r);
    m.g.visible = false;
    escena.add(m.g);
    const a = (i / OVEJAS) * Math.PI * 2, d0 = 1.5 + r() * 4, d = opciones.radio ? Math.min(d0, radioPasto * 0.7) : d0;
    const pos = new THREE.Vector3(centro.x + Math.cos(a) * d, 0, centro.z + Math.sin(a) * d);
    pos.y = T.altura(pos.x, pos.z);
    ovejas.push({ ...m, i, pos, rumbo: r() * 6.28, vel: 0, paso: r() * 6, t: r() * 4, pasta: r() < 0.6, propia: !!opciones.propia });
  }
  const lanaVista = new Array(OVEJAS).fill(-1);

  // `amenazas`: [{ x, z, radio, peso }] — el jugador si corre, el perro siempre.
  // 2.6.1: el centro y las amenazas se reusan de cuadro en cuadro (antes, cuatro objetos
  // y un arreglo nuevos por cuadro y por majada, aunque estuvieras lejos)
  const centroMajada = { x: 0, z: 0 };
  const amenazaPerro = { x: 0, z: 0, radio: 7, peso: 1 };
  const amenazaJugador = { x: 0, z: 0, radio: 1.6, peso: 0.5 };
  const amenazas = [];
  function actualizar(dt, js, perroPos, ocultas) {
    const dJ = Math.hypot(js.pos.x - centro.x, js.pos.z - centro.z);
    const visibles = !ocultas && dJ < 180;
    // lejos alcanza con que estén; la IA corre sólo cerca
    if (!visibles || dJ > 90) { for (const o of ovejas) o.g.visible = visibles; return; }
    let cx = 0, cz = 0;
    for (const o of ovejas) { cx += o.pos.x; cz += o.pos.z; }
    centroMajada.x = cx / OVEJAS; centroMajada.z = cz / OVEJAS;
    amenazas.length = 0;
    if (perroPos) { amenazaPerro.x = perroPos.x; amenazaPerro.z = perroPos.z; amenazas.push(amenazaPerro); }
    amenazaJugador.x = js.pos.x; amenazaJugador.z = js.pos.z;
    if (js.corriendo) { amenazaJugador.radio = 6; amenazaJugador.peso = 0.8; }
    else { amenazaJugador.radio = 1.6; amenazaJugador.peso = 0.5; }   // al lado, se hace a un costado
    amenazas.push(amenazaJugador);
    for (const o of ovejas) {
      o.g.visible = visibles;
      const guia = rumboOveja(o.pos, centroMajada, amenazas);
      if (guia) {
        o.rumbo = lerpAngulo(o.rumbo, guia.rumbo, 1 - Math.exp(-dt * 4));
        o.vel = lerp(o.vel, 0.6 + guia.presion * 2.4, 1 - Math.exp(-dt * 3));
        o.pasta = false;
      } else {
        o.t -= dt;
        if (o.t <= 0) { o.t = 2.5 + Math.random() * 5; o.pasta = Math.random() < 0.65; o.rumbo += (Math.random() - 0.5) * 1.6; }
        o.vel = lerp(o.vel, o.pasta ? 0 : 0.45, 1 - Math.exp(-dt * 1.5));
      }
      if (o.vel > 0.03) {
        const nx = o.pos.x + Math.sin(o.rumbo) * o.vel * dt, nz = o.pos.z + Math.cos(o.rumbo) * o.vel * dt;
        // el corral manda: si el paso la saca, gira hacia adentro
        if (Math.hypot(nx - centro.x, nz - centro.z) < radioPasto) { o.pos.x = nx; o.pos.z = nz; }
        else o.rumbo = Math.atan2(centro.x - o.pos.x, centro.z - o.pos.z) + (Math.random() - 0.5) * 0.8;
      }
      o.pos.y = T.altura(o.pos.x, o.pos.z);
      const marcha = marchaMamifero(o.vel, o.vel > 1.6 ? 'huir' : 'caminar', 0.5, 3);
      o.paso += dt * marcha.cadencia;
      const anda = o.vel > 0.12;
      o.patas.forEach((p, k) => { p.rotation.x = anda ? Math.sin(o.paso + (k % 2 ? Math.PI : 0) + (k > 1 ? marcha.posterior : 0)) * marcha.amplitud * 0.8 : 0; });
      o.g.position.copy(o.pos);
      o.g.position.y += anda ? Math.abs(Math.sin(o.paso * 0.5)) * marcha.rebote : 0;
      o.g.rotation.y = o.rumbo;
      const suelo = inclinacionTerrenoMamifero(T, o.pos, o.rumbo, 0.2);
      o.g.rotation.x = lerp(o.g.rotation.x, suelo.pitch, 1 - Math.exp(-dt * 6));
      o.g.rotation.z = lerp(o.g.rotation.z, suelo.roll, 1 - Math.exp(-dt * 6));
      // pastando, la cabeza abajo
      o.cabeza.rotation.x = lerp(o.cabeza.rotation.x, o.pasta && !anda ? 0.75 : -0.05, 1 - Math.exp(-dt * 3));
    }
  }

  // El vellón según los días: se recalcula sólo cuando cambia.
  function refrescarLana(majada, dia) {
    for (const o of ovejas) {
      const l = lanaDe(majada, o.i, dia);
      if (Math.abs(l - lanaVista[o.i]) < 0.01) continue;
      lanaVista[o.i] = l;
      const e = 0.7 + l * 0.3;
      o.vellon.scale.set(e, 0.78 + l * 0.22, e);
    }
  }

  // La oveja que tenés al alcance, mirándola o no: son mansas.
  function ovejaCerca(pos, radio = RADIO_ESQUILA) {
    let mejor = null, d0 = radio;
    for (const o of ovejas) {
      if (!o.g.visible) continue;
      const d = Math.hypot(o.pos.x - pos.x, o.pos.z - pos.z);
      if (d < d0 && Math.abs(o.pos.y - pos.y) < 1.8) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  const cerca = (pos, radio) => Math.hypot(pos.x - centro.x, pos.z - centro.z) < radio;
  // 2.4: el corral propio se puede mudar; las ovejas van caminando... de un salto.
  function mudar(x, z, radio = radioPasto) {
    const dx = x - centro.x, dz = z - centro.z;
    centro.x = x; centro.z = z; radioPasto = radio;
    for (const o of ovejas) {
      o.pos.x += dx; o.pos.z += dz;
      const d = Math.hypot(o.pos.x - x, o.pos.z - z);
      if (d > radio * 0.8) { o.pos.x = x + (o.pos.x - x) * (radio * 0.6 / d); o.pos.z = z + (o.pos.z - z) * (radio * 0.6 / d); }
      o.pos.y = T.altura(o.pos.x, o.pos.z);
    }
  }
  function quitar() { for (const o of ovejas) escena.remove(o.g); }
  return { actualizar, refrescarLana, ovejaCerca, cerca, centro, ovejas, mudar, quitar };
}

function lerpAngulo(a, b, k) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * clamp(k, 0, 1);
}
