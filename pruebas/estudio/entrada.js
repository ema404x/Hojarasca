// PROTOTIPO: el estudio de personajes (pruebas/estudio-personajes.cjs). Una escena chica con la luz
// de la tarde y el mismo dibujante del juego (ACES, sRGB, MAT_FAUNA): para mirar de cerca las
// variantes sin cargar el valle. No es la captura final: esas son las del juego (visor-personajes).
import * as THREE from 'three';
import { __mallaPersona, __ROPA } from '../../src/gente.js';
import { protoPersona, __piezasProto } from '../../src/gente-proto.js';
import { POBLADORES_ALDEA, VECINOS_ALDEA } from '../../src/aldea.js';

const lienzo = document.createElement('canvas');
lienzo.width = 1600; lienzo.height = 900;
document.body.appendChild(lienzo);
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const escena = new THREE.Scene();
escena.background = new THREE.Color('#9fb4bf');
escena.add(new THREE.HemisphereLight(0xbcd4e6, 0x3a3222, 1.0));
const sol = new THREE.DirectionalLight(0xffe2bc, 2.3);
sol.position.set(4, 4.2, 5); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1, near: 0.5, far: 20 });
sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
escena.add(sol); escena.add(sol.target);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshLambertMaterial({ color: '#7d7660' }));
piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);
const camara = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 100);

const QUIENES = [
  { clave: 'poblador-panadera', def: POBLADORES_ALDEA.panadera },
  { clave: 'poblador-herrero', def: POBLADORES_ALDEA.herrero },
  { clave: 'aldea-nena', def: VECINOS_ALDEA.nena },
];
let actuales = [];
function armar(V, opciones = {}) {
  for (const a of actuales) escena.remove(a.g);
  actuales = QUIENES.map(({ clave, def }, i) => {
    const conMate = def.mano === 'mate';
    const m = V === 'base' ? __mallaPersona(def.colores, clave, conMate) : protoPersona(V, def.colores, clave, conMate, __ROPA[clave] || {});
    if (def.talla) m.g.scale.setScalar(def.talla);
    m.g.position.set([-0.9, 0, 0.8][i], 0, 0);
    m.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    escena.add(m.g);
    // una pose de reposo como la del juego (los brazos apenas abiertos)
    m.brazos[0].rotation.z = -0.035; m.brazos[1].rotation.z = 0.035;
    if (m.muneca) { const q = m.brazos[1].quaternion.clone().invert(); m.muneca.quaternion.copy(q); }
    m.fase = 0; m.pose = null; m.pos = m.g.position;
    return m;
  });
  if (opciones.grupo) {
    const [r, a, l] = actuales;
    r.g.position.set(0.5, 0, 0); r.g.rotation.y = -1.0;
    a.g.position.set(-0.55, 0, 0.2); a.g.rotation.y = 1.1;
    l.g.position.set(0.85, 0, 0.75); l.g.rotation.y = -1.2;
    a.brazos[1].rotation.x = -0.7; a.brazos[0].rotation.x = -0.25;
  }
}
function posar(dt = 1 / 60) {
  escena.updateMatrixWorld(true);
  for (const m of actuales) { m.cabeza.rotation.y = 0; if (m.alPosar) m.alPosar(m, dt, camara, false, false); }
}
function mirar(o, a, fov) {
  camara.position.set(...o); camara.lookAt(...a);
  if (camara.fov !== fov) { camara.fov = fov; camara.updateProjectionMatrix(); }
}
function foto() { renderer.render(escena, camara); return lienzo.toDataURL('image/png'); }
window.estudio = {
  async toma(V, toma) {
    armar(V, { grupo: toma === 'grupo' });
    if (toma === 'cuerpo') { mirar([0, 0.95, 3.0], [0, 0.85, 0], 45); for (let i = 0; i < 30; i++) posar(); return foto(); }
    if (toma === 'grupo') { mirar([0.5, 1.65, 3.4], [0.1, 1.0, 0.2], 70); for (let i = 0; i < 30; i++) posar(); return foto(); }
    if (toma === 'espalda') { mirar([0.3, 1.2, -2.6], [0, 0.95, 0], 45); for (let i = 0; i < 30; i++) posar(); return foto(); }
    // la cara: cada uno a 1 m (lente de 30°), las tres juntas en una tira (o de tres cuartos);
    // `sonrisa` y `risa` (S): la misma toma con el gesto puesto
    const tiras = [];
    for (const m of actuales) m.__gesto = toma === 'sonrisa' || toma === 'risa' ? toma : 'neutral';
    for (const m of actuales) m.__lejos = toma === 'lejos';   // (S: la cara fundida en el cuerpo, la de lejos)
    for (const m of actuales) {
      m.g.updateMatrixWorld(true);
      const c = new THREE.Vector3(); m.cabeza.getWorldPosition(c); c.y += 0.045 * m.g.scale.y;
      const ang = toma === 'perfil' ? 0.75 : 0;
      mirar([c.x + Math.sin(ang) * 1.0, c.y + 0.02, c.z + Math.cos(ang) * 1.0], [c.x, c.y, c.z], 30);
      for (let i = 0; i < 45; i++) posar();
      renderer.render(escena, camara);
      const cv = document.createElement('canvas'); cv.width = 560; cv.height = 640;
      cv.getContext('2d').drawImage(lienzo, (1600 - 560) / 2, (900 - 640) / 2, 560, 640, 0, 0, 560, 640);
      tiras.push(cv);
    }
    const out = document.createElement('canvas'); out.width = 560 * 3 + 12; out.height = 640;
    const x = out.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, out.width, out.height);
    tiras.forEach((t, i) => x.drawImage(t, i * 566, 0));
    return out.toDataURL('image/png');
  },
  medir(V) {
    armar(V);
    return actuales.map((m) => { let tri = 0, dib = 0; m.g.traverse((o) => { if (o.isMesh) { dib++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return { tri: Math.round(tri), dib }; });
  },
  partes(V) { return QUIENES.map(({ clave, def }) => [clave, __piezasProto(V, def.colores, clave, def.mano === 'mate', __ROPA[clave] || {}).map(([k, e]) => `${k} ${Math.round(e.tri)}/${e.ver} (${e.n})`).join(' | ')]); },
  tiempoArmado(V, n = 10) {
    const t0 = performance.now();
    for (let i = 0; i < n; i++) for (const { clave, def } of QUIENES) {
      const m = V === 'base' ? __mallaPersona(def.colores, clave, def.mano === 'mate') : protoPersona(V, def.colores, clave, def.mano === 'mate', __ROPA[clave] || {});
      m.g.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    }
    return (performance.now() - t0) / (n * QUIENES.length);
  },
};
window.estudioListo = true;
