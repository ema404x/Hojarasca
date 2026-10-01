// 2.9: lo que se mueve del molino y del aserradero: la rueda de paletas, que gira con
// el agua del arroyo, y la sierra circular, que gira mientras hay troncos. La obra es una
// sola malla quieta (ver `planos-maquinas.js`); esto va aparte, una pieza por máquina
// terminada, y se arma y se desarma cuando main.js le pasa la lista (`sincronizar`).
// Cada parte que gira es una sola malla (con el material de las obras), para no sumar
// dibujos: la rueda son dos (lo que gira y el eje con su poste) y la sierra una.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { RUEDA_MOLINO, SIERRA_ASERRADERO } from './planos-maquinas.js';

const MADERA = '#6b5238', OSCURA = '#4a3b2c', METAL = '#9a9a96';

export function crearMolinoMundo(T, escena) {
  const mat = materialVegetal({ flex: 0 });
  const R = RUEDA_MOLINO.radio, A = RUEDA_MOLINO.ancho;
  // lo que gira de la rueda: igual para todas, se arma una vez
  const gRueda = (() => {
    const c = new Constructor();
    c.agregar(new THREE.CylinderGeometry(0.18, 0.18, A + 0.1, 10), { color: OSCURA, tipo: 0, matriz: matriz([0, 0, 0], [0, 0, Math.PI / 2]) });
    for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.06, R * 1.8, 0.08), { color: MADERA, tipo: 0, matriz: matriz([0, 0, 0], [(i / 4) * Math.PI, 0, 0]) });
    for (const sx of [-1, 1]) c.agregar(new THREE.TorusGeometry(R * 0.88, 0.045, 4, 22), { color: MADERA, tipo: 0, matriz: matriz([sx * (A / 2 - 0.04), 0, 0], [0, Math.PI / 2, 0]) });
    const N = 16;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      c.agregar(new THREE.BoxGeometry(A, 0.32, 0.05), { color: i % 2 ? MADERA : OSCURA, tipo: 0, variar: 0.1,
        matriz: matriz([0, Math.sin(a) * (R - 0.16), Math.cos(a) * (R - 0.16)], [Math.PI / 2 - a, 0, 0]) });
    }
    return c.geometria();
  })();
  // la hoja de la sierra, con sus dientes
  const gHoja = (() => {
    const c = new Constructor(), r = SIERRA_ASERRADERO.radio;
    c.agregar(new THREE.CylinderGeometry(r, r, 0.02, 20), { color: METAL, tipo: 4, variar: 0.04, matriz: matriz([0, 0, 0], [Math.PI / 2, 0, 0]) });
    c.agregar(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), { color: OSCURA, tipo: 4, matriz: matriz([0, 0, 0], [Math.PI / 2, 0, 0]) });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.agregar(new THREE.BoxGeometry(0.05, 0.05, 0.022), { color: METAL, tipo: 4, variar: 0, matriz: matriz([Math.cos(a) * r, Math.sin(a) * r, 0], [0, 0, a + Math.PI / 4]) });
    }
    return c.geometria();
  })();

  const grupo = new THREE.Group();
  grupo.name = 'maquinas-molino';
  escena.add(grupo);
  const ruedas = new Map();   // datos de la obra → { g, giro, vel }
  const sierras = new Map();  // datos de la obra → { g, hoja, vel, objetivo }

  const local = (d, lx, lz) => ({ x: d.x + lx * Math.cos(d.rot || 0) + lz * Math.sin(d.rot || 0), z: d.z - lx * Math.sin(d.rot || 0) + lz * Math.cos(d.rot || 0) });

  function armarRueda(d) {
    const g = new THREE.Group();
    const p = local(d, RUEDA_MOLINO.lx, 0);
    const agua = T.agua(p.x, p.z);
    const nivel = agua && !agua.lago ? agua.nivel : (d.y ?? T.altura(p.x, p.z)) - 0.8;
    const cy = nivel + R - RUEDA_MOLINO.hunde;
    g.position.set(p.x, cy, p.z);
    g.rotation.y = d.rot || 0;
    const giro = new THREE.Mesh(gRueda, mat);
    g.add(giro);
    // el eje entra en la casilla; del otro lado, un poste lo sostiene desde el fondo del agua
    const c = new Constructor();
    c.agregar(new THREE.CylinderGeometry(0.09, 0.09, 1.35, 8), { color: OSCURA, tipo: 0, matriz: matriz([-0.1, 0, 0], [0, 0, Math.PI / 2]) });
    const fondo = nivel - 0.9 - cy, alto = Math.max(0.6, 0.15 - fondo);
    c.agregar(new THREE.CylinderGeometry(0.08, 0.1, alto, 6), { color: OSCURA, tipo: 0, variar: 0.1, matriz: matriz([A / 2 + 0.12, fondo + alto / 2, 0]) });
    const fijo = new THREE.Mesh(c.geometria(), mat);
    g.add(fijo);
    grupo.add(g);
    return { g, giro, fijo, vel: 0 };
  }
  function armarSierra(d) {
    const p = local(d, SIERRA_ASERRADERO.lx, SIERRA_ASERRADERO.lz);
    const g = new THREE.Group();
    g.position.set(p.x, (d.y ?? T.altura(p.x, p.z)) + SIERRA_ASERRADERO.y, p.z);
    g.rotation.y = d.rot || 0;
    const hoja = new THREE.Mesh(gHoja, mat);
    g.add(hoja);
    grupo.add(g);
    return { g, hoja, vel: 0, objetivo: 0 };
  }
  function soltar(mapa, k) {
    const x = mapa.get(k);
    if (!x) return;
    grupo.remove(x.g);
    x.fijo?.geometry.dispose();   // lo propio de cada rueda; lo compartido queda
    mapa.delete(k);
  }
  const cambio = (x, d) => x.x !== d.x || x.z !== d.z || x.rot !== d.rot || x.y !== d.y;

  // `molinos`: [{ datos, vel }] (vel en rad/s); `aserraderos`: [{ datos, trabajando }].
  // Las piezas de obras que ya no están (o se movieron) se sueltan.
  function sincronizar(molinos, aserraderos) {
    const vistos = new Set();
    for (const { datos, vel } of molinos) {
      vistos.add(datos);
      let r = ruedas.get(datos);
      if (r && cambio(r, datos)) { soltar(ruedas, datos); r = null; }
      if (!r) { r = armarRueda(datos); Object.assign(r, { x: datos.x, z: datos.z, y: datos.y, rot: datos.rot }); ruedas.set(datos, r); }
      r.vel = vel;
    }
    for (const k of [...ruedas.keys()]) if (!vistos.has(k)) soltar(ruedas, k);
    vistos.clear();
    for (const { datos, trabajando } of aserraderos) {
      vistos.add(datos);
      let s = sierras.get(datos);
      if (s && cambio(s, datos)) { soltar(sierras, datos); s = null; }
      if (!s) { s = armarSierra(datos); Object.assign(s, { x: datos.x, z: datos.z, y: datos.y, rot: datos.rot }); sierras.set(datos, s); }
      s.objetivo = trabajando ? 38 : 0;
    }
    for (const k of [...sierras.keys()]) if (!vistos.has(k)) soltar(sierras, k);
  }
  function animar(dt) {
    for (const r of ruedas.values()) r.giro.rotation.x -= r.vel * dt;
    for (const s of sierras.values()) {
      // arranca y para despacio, como una sierra de verdad
      s.vel += (s.objetivo - s.vel) * Math.min(1, dt * (s.objetivo > s.vel ? 1.2 : 0.5));
      if (s.vel > 0.01) s.hoja.rotation.z -= s.vel * dt;
    }
  }
  return {
    grupo, sincronizar, animar,
    get ruedas() { return ruedas; }, get sierras() { return sierras; },
  };
}
