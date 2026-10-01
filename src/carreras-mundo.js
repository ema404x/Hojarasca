// 3.1: las carreras en el mundo: los postes de largada (un palo con banderín y un cartel
// con el nombre del circuito), las puertas de la carrera en curso (dos palos y un paño en
// tierra, una boya en el lago), la puerta que sigue bien a la vista (más alta, con una
// columna de luz que se ve de lejos) y el fantasma de tu mejor vuelta.
//
// Poco para dibujar: los postes sólo se ven de cerca y las puertas existen mientras dura
// una carrera. Las reglas están en carreras.js.
import * as THREE from 'three';
import { CIRCUITOS } from './carreras.js';
import { cartelNombre } from './personal-mallas.js';

const COLOR_MEDIO = { pie: '#d8a23a', caballo: '#b8452f', kayak: '#e0662a', vela: '#3f7fb0' };
const VISTA_POSTE = 150;   // metros: más lejos, el poste no se dibuja

export function crearCarrerasMundo(T, escena) {
  const grupo = new THREE.Group();
  grupo.name = 'carreras-3-1';
  escena.add(grupo);
  const madera = new THREE.MeshLambertMaterial({ color: '#7a5a3a' });
  const geoPalo = new THREE.CylinderGeometry(0.07, 0.09, 3.2, 7);
  const geoBanderin = new THREE.PlaneGeometry(0.9, 0.55);
  const materiales = {};
  const matMedio = (medio) => (materiales[medio] ||= new THREE.MeshLambertMaterial({ color: COLOR_MEDIO[medio] || '#d8a23a', side: THREE.DoubleSide }));
  const sueloEn = (x, z, agua) => (agua ? 0 : T.altura(x, z));

  // ---------------------------------------------------------------- los postes de largada
  const postes = [];
  for (const c of CIRCUITOS) {
    const enAgua = c.medio === 'kayak' || c.medio === 'vela';
    const g = new THREE.Group();
    const y = sueloEn(c.salida.x, c.salida.z, enAgua);
    g.position.set(c.salida.x, y + (enAgua ? -0.6 : 0), c.salida.z);
    const palo = new THREE.Mesh(geoPalo, madera);
    palo.position.y = 1.6;
    g.add(palo);
    const banderin = new THREE.Mesh(geoBanderin, matMedio(c.medio));
    banderin.position.set(0.47, 2.85, 0);
    g.add(banderin);
    // el cartel, mirando al centro del circuito
    const cartel = cartelNombre(c.nombre, 1.9, 0.36, { ancho: 512, alto: 96, fondo: '#3b2a1c', tinta: '#f2ead8' });
    cartel.material.side = THREE.DoubleSide;
    cartel.position.set(0, 2.05, 0.1);
    g.add(cartel);
    if (enAgua) {
      // en el lago, el poste va sobre una boya grande
      const boya = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.1, 10), matMedio(c.medio));
      boya.position.y = 0.55;
      g.add(boya);
    }
    let cx = 0, cz = 0;
    for (const p of c.puertas) { cx += p.x; cz += p.z; }
    g.rotation.y = Math.atan2(cx / c.puertas.length - c.salida.x, cz / c.puertas.length - c.salida.z);
    g.visible = false;
    g.userData.agua = enAgua;
    grupo.add(g);
    postes.push({ c, g });
  }

  // ---------------------------------------------------------------- las puertas de la carrera
  let puertas = [], siguiente = -1;
  const matSiguiente = new THREE.MeshBasicMaterial({ color: '#ffd05a' });
  const matHaz = new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: 0.22, depthWrite: false });
  const matPasada = new THREE.MeshLambertMaterial({ color: '#8c8c80', side: THREE.DoubleSide });
  const geoHaz = new THREE.CylinderGeometry(0.35, 0.35, 40, 8, 1, true);
  const geoBoya = new THREE.CylinderGeometry(0.55, 0.7, 1.0, 10);
  const geoTope = new THREE.ConeGeometry(0.4, 0.7, 10);
  const geoPano = new THREE.PlaneGeometry(1, 0.7);
  function puertaEnTierra(p, medio, ancho) {
    const g = new THREE.Group();
    g.position.set(p.x, T.altura(p.x, p.z), p.z);
    for (const lado of [-1, 1]) {
      const palo = new THREE.Mesh(geoPalo, madera);
      palo.position.set(lado * ancho / 2, 1.6, 0);
      g.add(palo);
    }
    const pano = new THREE.Mesh(geoPano, matMedio(medio));
    pano.scale.x = ancho;
    pano.position.y = 3.0;
    g.add(pano);
    g.userData.pano = pano;
    return g;
  }
  function puertaEnAgua(p, medio) {
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z);
    const boya = new THREE.Mesh(geoBoya, matMedio(medio));
    boya.position.y = 0.2;
    const tope = new THREE.Mesh(geoTope, matMedio(medio));
    tope.position.y = 1.05;
    g.add(boya, tope);
    g.userData.pano = tope;
    return g;
  }
  let medioActual = 'pie';
  function ocultarCircuito() {
    for (const q of puertas) if (q.g) grupo.remove(q.g);
    puertas = []; siguiente = -1;
    haz.visible = false;
  }
  // `recorrido`: los puntos de carreras.recorridoDe (el último es el poste, que ya está)
  function mostrarCircuito(recorrido, medio, radio, salida) {
    ocultarCircuito();
    medioActual = medio;
    const enAgua = medio === 'kayak' || medio === 'vela';
    recorrido.forEach((p, i) => {
      if (p.meta || (salida && Math.hypot(p.x - salida.x, p.z - salida.z) < 0.5)) { puertas.push({ p, g: null }); return; }
      // un mismo punto dos veces (dos vueltas): una sola puerta dibujada
      const ya = puertas.find((q) => q.g && Math.hypot(q.p.x - p.x, q.p.z - p.z) < 0.5);
      if (ya) { puertas.push({ p, g: ya.g }); return; }
      const g = enAgua ? puertaEnAgua(p, medio) : puertaEnTierra(p, medio, Math.min(9, radio * 1.4));
      g.userData.pano.userData.matOriginal = g.userData.pano.material;
      // la puerta mira de dónde se viene
      const a = recorrido[i - 1] || salida || p;
      g.rotation.y = Math.atan2(p.x - a.x, p.z - a.z) + Math.PI / 2;
      grupo.add(g);
      puertas.push({ p, g });
    });
  }
  const haz = new THREE.Mesh(geoHaz, matHaz);
  haz.visible = false;
  grupo.add(haz);
  // La puerta `i` es la que sigue: amarilla y con la columna de luz. Las ya pasadas, grises.
  function marcarSiguiente(i) {
    siguiente = i;
    const actual = puertas[i]?.g || null;
    const quedan = new Set(puertas.slice(i).map((q) => q.g).filter(Boolean));
    for (const q of puertas) {
      if (!q.g) continue;
      const pano = q.g.userData.pano;
      pano.material = q.g === actual ? matSiguiente : quedan.has(q.g) ? pano.userData.matOriginal : matPasada;
    }
    const p = puertas[i]?.p;
    if (!p) { haz.visible = false; return; }
    const agua = medioActual === 'kayak' || medioActual === 'vela';
    haz.position.set(p.x, (agua ? 0 : T.altura(p.x, p.z)) + 20, p.z);
    haz.visible = true;
  }

  // ---------------------------------------------------------------- el fantasma
  const fantasma = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.35, depthWrite: false }));
  fantasma.scale.set(1, 2, 1);
  fantasma.visible = false;
  grupo.add(fantasma);
  const ALTO_FANTASMA = { pie: 1.0, caballo: 2.1, kayak: 0.6, vela: 1.2 };
  function ponerFantasma(pos, medio) {
    if (!pos) { fantasma.visible = false; return; }
    const agua = medio === 'kayak' || medio === 'vela';
    fantasma.position.set(pos.x, (agua ? 0 : T.altura(pos.x, pos.z)) + (ALTO_FANTASMA[medio] || 1), pos.z);
    fantasma.visible = true;
  }

  let reloj = 0;
  function actualizar(dt, cam, t = 0) {
    reloj += dt;
    // los postes, de a ratos (no hace falta cada cuadro)
    if (reloj > 0.5) {
      reloj = 0;
      for (const { c, g } of postes) g.visible = Math.hypot(cam.x - c.salida.x, cam.z - c.salida.z) < VISTA_POSTE;
    }
    // las boyas se mecen; el paño de la puerta que sigue flamea
    for (const q of puertas) if (q.g && q.g.position.y <= 0.01) q.g.children[0].position.y = 0.2 + Math.sin(t * 1.7 + q.p.x) * 0.06;
    if (haz.visible) haz.rotation.y += dt * 0.4;
  }

  return { grupo, postes, mostrarCircuito, ocultarCircuito, marcarSiguiente, ponerFantasma, actualizar, siguiente: () => siguiente, puertas: () => puertas };
}
