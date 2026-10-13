// 3.9: el visor de la moza de la cantina ('aldea-moza'): el cuerpo, la ropa y las poses del juego de verdad (gente-cuerpo.js,
// gente-ropa.js), en un rincón de cantina con luz de farol. Viene del prototipo proto-cantina (3.8.4); ya no inventa ropa ni
// poses: lo único propio de acá es la escena y la cámara. Lo arma pruebas/visor-cantina-proto.cjs.
import * as THREE from 'three';
import { __mallaPersona } from '../../src/gente.js';
import { atlasPersonajes, completarAtlas } from '../../src/gente-atlas.js';

const CLAVE = 'aldea-moza';
// ---------------------------------------------------------------- la escena: interior con luz de farol
const lienzo = document.createElement('canvas');
lienzo.width = 1600; lienzo.height = 900; document.body.appendChild(lienzo);
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const escena = new THREE.Scene();
escena.background = new THREE.Color('#2a1c14');
escena.add(new THREE.HemisphereLight(0x8a6a50, 0x2a1a10, 0.9));
const farol = new THREE.PointLight(0xffb060, 9, 9, 1.4); farol.position.set(0.9, 2.2, 1.4); farol.castShadow = true; farol.shadow.mapSize.set(1024, 1024); escena.add(farol);
const llenado = new THREE.DirectionalLight(0xffd2a0, 1.1); llenado.position.set(-2, 2.5, 4); escena.add(llenado);
const madera = (c) => new THREE.MeshLambertMaterial({ color: c });
const piso = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), madera('#5a3e28')); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);
const pared = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), madera('#6a4a30')); pared.position.set(0, 4, -2.2); escena.add(pared);
for (let i = -6; i <= 6; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, 8, 0.02), madera('#3a2618')); t.position.set(i * 0.32, 4, -2.18); escena.add(t); }
for (const y of [1.5, 1.9]) {
  const e = new THREE.Mesh(new THREE.BoxGeometry(6, 0.04, 0.2), madera('#3e2616')); e.position.set(0, y, -2.08); escena.add(e);
  for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.26, 8), madera(['#2e4a2a', '#5a2a1e', '#c8b070', '#2a3a3e'][i % 4])); b.position.set(-2.9 + i * 0.25, y + 0.15, -2.06); escena.add(b); }
}
// la barra, a la izquierda de ella (sólo para la pose 'barra'): su canto queda a 24 cm del eje de la moza, la tapa a 1,06 m
const sala = new THREE.Group(); escena.add(sala);   // (gira con ella: la barra y la mesa se quedan donde las necesita la pose)
const barra = new THREE.Group(); sala.add(barra);
const cuerpoBarra = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.02, 3.2), madera('#4a2e1a')); cuerpoBarra.position.set(-0.64, 0.51, 0); cuerpoBarra.castShadow = cuerpoBarra.receiveShadow = true; barra.add(cuerpoBarra);
const tapaBarra = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 3.3), madera('#6e4626')); tapaBarra.position.set(-0.64, 1.045, 0); barra.add(tapaBarra);
barra.visible = false;
// la mesa (para la pose 'dejar'), adelante de ella: la tapa a 0,76 m
const mesa = new THREE.Group(); mesa.position.set(0, 0, 0.62); sala.add(mesa);
const tm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.7), madera('#7a5232')); tm.position.y = 0.76; tm.castShadow = true; mesa.add(tm);
for (const [x, z] of [[-0.44, -0.3], [0.44, -0.3], [-0.44, 0.3], [0.44, 0.3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), madera('#4a2e1a')); p.position.set(x, 0.37, z); mesa.add(p); }
mesa.visible = false;
const caja = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: '#ffcc80' })); caja.position.set(0.9, 2.35, 1.4); escena.add(caja);
const camara = new THREE.PerspectiveCamera(36, 16 / 9, 0.02, 100);
atlasPersonajes(); completarAtlas();

// ---------------------------------------------------------------- la moza, con las poses del juego
let m = null;
function armar(opciones = {}) {
  if (m) { escena.remove(m.g); m.soltar?.(); }
  m = __mallaPersona({}, CLAVE, false, opciones);
  m.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  escena.add(m.g); m.fase = 0; m.pose = null; m.pos = m.g.position; m.clave = CLAVE;
  return m;
}
// lo que hace gente.js antes de llamar a alPosar: los brazos y las piernas de quieto o de caminata
function base(t, andando) {
  const f = (i) => t + i * Math.PI;
  m.patas.forEach((p, i) => { p.rotation.set(andando ? Math.sin(f(i)) * 0.5 : 0, 0, 0); if (p.userData.rodilla) p.userData.rodilla.rotation.x = andando ? 0.1 + Math.max(0, -Math.cos(f(i))) * 0.75 : 0.03; });
  m.torso.position.y = 0.82; m.cabeza.position.y = 1.46;
  m.torso.rotation.set(andando ? 0.035 : 0, andando ? Math.sin(t) * 0.06 : 0, andando ? Math.cos(t) * 0.022 : 0);
  m.cabeza.rotation.set(0, andando ? -m.torso.rotation.y * 0.7 : 0, 0);
  m.brazos[0].rotation.set(andando ? Math.sin(t + Math.PI) * 0.3 : 0, 0, andando ? -0.07 : -0.035);
  m.brazos[1].rotation.set(andando ? Math.sin(t) * 0.3 : 0, 0, andando ? 0.07 : 0.035);
}
// un cuadro: pose del juego (m.pose), andando o quieta
function cuadro(pose, andando, t, quietud = null) {
  escena.updateMatrixWorld(true);
  m.pose = pose;
  m.__gesto = 'sonrisa'; m.__cerca = true; m.__quietud = quietud;
  base(t, andando);
  m.alPosar(m, 1 / 60, camara, false, andando);
}
const VISTAS = {
  'frente': { ang: 0.06, dist: 3.3, y: 1.12, mira: 0.95, fov: 36, recorte: [490, 0, 620, 900] },
  'tres-cuartos': { ang: 0.75, dist: 3.3, y: 1.12, mira: 0.95, fov: 36, recorte: [490, 0, 620, 900] },
  'espalda': { ang: Math.PI - 0.15, dist: 3.3, y: 1.12, mira: 0.95, fov: 36, recorte: [490, 0, 620, 900] },
  'lado2': { ang: 1.4, dist: 3.3, y: 1.12, mira: 0.95, fov: 36, recorte: [490, 0, 620, 900] },
  'lado': { ang: -1.4, dist: 3.3, y: 1.12, mira: 0.95, fov: 36, recorte: [490, 0, 620, 900] },
  'medio': { ang: 0.35, dist: 2.0, y: 1.3, mira: 1.2, fov: 36, recorte: [350, 0, 900, 900] },
  'rostro': { ang: 0.25, dist: 0.95, y: 1.6, mira: 1.55, fov: 30, recorte: [350, 0, 900, 900] },
  'escote': { ang: 0.18, dist: 1.05, y: 1.4, mira: 1.32, fov: 30, recorte: [350, 0, 900, 900] },
  'cintura': { ang: 0.6, dist: 1.5, y: 0.95, mira: 0.72, fov: 36, recorte: [350, 0, 900, 900] },
  'piernas': { ang: 0.95, dist: 1.8, y: 0.62, mira: 0.5, fov: 36, recorte: [350, 0, 900, 900] },
  'mesa': { ang: 0.9, dist: 2.6, y: 1.1, mira: 0.95, fov: 36, recorte: [350, 0, 900, 900] },
};
window.cantina = {
  vistas: Object.keys(VISTAS),
  // opts: { vista, pose, andando, t, vasos, bandeja, lado, invierno, rotulo }
  toma(o = {}) {
    const v = VISTAS[o.vista || 'frente'];
    armar({ invierno: !!o.invierno });
    if (o.vasos !== undefined && m.bandeja) m.bandeja.vasos(o.vasos);
    if (o.bandeja !== undefined && m.bandeja) m.bandeja.visible(o.bandeja);
    m.ladoBarra = o.lado || 0;
    barra.visible = o.pose === 'barra'; mesa.visible = o.pose === 'dejar' || !!o.mesa;
    cuerpoBarra.position.x = o.lado ? 0.64 : -0.64; tapaBarra.position.x = cuerpoBarra.position.x;
    // la cámara queda adelante y gira ella (con su barra y su mesa): así la pared de atrás no tapa nunca
    m.g.rotation.y = -v.ang; sala.rotation.y = -v.ang; m.rumbo = -v.ang;
    camara.position.set(0, v.y, v.dist); camara.lookAt(0, v.mira, 0); camara.fov = v.fov; camara.updateProjectionMatrix();
    const t = o.t || 0;
    for (let i = 0; i < 50; i++) cuadro(o.pose || null, !!o.andando, t, o.quietud || null);
    renderer.render(escena, camara);
    const [x, y, w, h] = v.recorte;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c2 = cv.getContext('2d'); c2.drawImage(lienzo, x, y, w, h, 0, 0, w, h);
    if (o.rotulo) { c2.fillStyle = 'rgba(20,14,10,0.75)'; c2.fillRect(0, 0, w, 40); c2.fillStyle = '#f2e6d0'; c2.font = 'bold 22px Georgia, serif'; c2.fillText(o.rotulo, 12, 28); }
    return cv.toDataURL('image/png');
  },
  // cuánto pesa la moza (triángulos y vértices de la malla fundida) frente a otras vecinas del juego
  info() {
    const peso = (clave) => {
      const x = __mallaPersona({}, clave, false, {});
      let tri = 0, ver = 0; x.g.traverse((o) => { if (o.isMesh && o.geometry.index) { tri += o.geometry.index.count / 3; ver += o.geometry.attributes.position.count; } });
      const r = { clave, tri, ver, llamadas: 0 }; x.g.traverse((o) => { if (o.isMesh) r.llamadas++; }); x.soltar?.(); return r;
    };
    armar();
    return { bandeja: !!m.bandeja, estado: m.bandeja ? m.bandeja.estado() : null, pesos: [CLAVE, 'poblador-herbolaria', 'poblador-modista', 'aldea-madre', 'aldea-gerente'].map(peso) };
  },
};
window.estudioListo = true;
