// proto-cantina (3.8.4, DECISIONES «La cantina»): prototipo en imágenes de la moza y la bailarina de los sábados.
// Usa el cuerpo y el esqueleto de gente-cuerpo.js con telas por código; las cuatro variantes se agregan a
// ASPECTO sólo acá (el juego no las conoce). Lo arma pruebas/visor-cantina-proto.cjs (`?debug=1&cantina=proto`).
import * as THREE from 'three';
import { __mallaPersona } from '../../src/gente.js';
import { atlasPersonajes, completarAtlas } from '../../src/gente-atlas.js';
import { ASPECTO } from '../../src/gente-ropa.js';

// ---------------------------------------------------------------- las cuatro variantes
const PIEL_A = '#d9ae8c', PIEL_B = '#b98a62';
const V = {
  'cantina-moza-A': { titulo: 'Moza A · vestido bordó, melena suelta, bandeja en alto', pose: 'bandeja', flor: '#e8473c', tajo: 1, escote: 1,
    def: { edad: 30, mujer: true, cuerpo: { ancho: 0.93, fondo: 0.95, panza: 0, brazos: 0.95, piernas: 1.02, alto: 1.01 },
      cara: { ancho: 0.96, largo: 1.0, nariz: 0.9, ojos: 1.08, boca: 1.04, pomulos: 1.2, sonrisa: 0.75, labios: 1.25, arco: 1.25, rasgado: 0.08, rouge: '#c0182a', iris: '#4a2e1c' },
      colores: { piel: PIEL_A, pelo: '#2a1a14', ropa: '#7a1e2a', abrigo: '#7a1e2a', gorro: null, aros: 'chicos' },
      R: { mujer: true, pollera: true, colPollera: '#6e1a26', melena: true, rayaCostado: true, panuelo: '#d0242c', delantal: '#e8dcc4', telaDelantal: 'lienzo', pantalon: '#3a2c2a', botas: 'cortas', botaCol: '#1e1612' },
      guardas: { pollera: [12, 0.04] }, poses: ['cintura'] } },
  'cantina-moza-B': { titulo: 'Moza B · vestido oliva, rodete con flor, apoyada', pose: 'barra', flor: '#f2e6d0', tajo: 1, escote: 1,
    def: { edad: 32, mujer: true, cuerpo: { ancho: 0.95, fondo: 0.96, brazos: 0.96, piernas: 1.0, alto: 0.99 },
      cara: { ancho: 1.0, largo: 0.98, nariz: 0.95, ojos: 1.04, boca: 1.08, pomulos: 1.3, sonrisa: 0.6, labios: 1.3, arco: 1.35, rouge: '#b8142a', iris: '#5c4a2a' },
      colores: { piel: PIEL_B, pelo: '#6a3a1e', ropa: '#4e5a32', abrigo: '#4e5a32', gorro: null, aros: 'chicos' },
      R: { mujer: true, pollera: true, colPollera: '#434e2a', rodete: true, flequillo: true, panuelo: '#c8202a', delantal: '#d8c8a4', telaDelantal: 'lienzo', pantalon: '#2e2626', botas: 'cortas', botaCol: '#2a1c14' },
      guardas: { pollera: [5, 0.04] }, poses: ['cintura'] } },
  'cantina-bailarina-A': { titulo: 'Bailarina A · tango negro, tajo alto, tacos rojos', pose: 'tango', flor: '#d01c28', tajo: 1.4, escote: 1.2,
    def: { edad: 28, mujer: true, cuerpo: { ancho: 0.92, fondo: 0.93, brazos: 0.94, piernas: 1.04, alto: 1.02 },
      cara: { ancho: 0.95, largo: 1.03, nariz: 0.9, ojos: 1.06, boca: 1.02, pomulos: 1.35, sonrisa: 0.45, labios: 1.3, arco: 1.4, rasgado: 0.12, rouge: '#a8101e', iris: '#2e1e14' },
      colores: { piel: PIEL_A, pelo: '#141010', ropa: '#1c1618', abrigo: '#1c1618', gorro: null, aros: 'chicos' },
      R: { mujer: true, pollera: true, colPollera: '#141012', rodete: true, rayaCostado: true, pantalon: '#2a2020', botas: 'cortas', botaCol: '#8a1420' },
      guardas: { pollera: [13, 0.03] }, poses: ['cintura'] } },
  'cantina-bailarina-B': { titulo: 'Bailarina B · chamamé celeste con vuelo, trenzas', pose: 'chamame', flor: '#f0d040', tajo: 0, escote: 0.8, vuelo: 1.5,
    def: { edad: 26, mujer: true, cuerpo: { ancho: 0.94, fondo: 0.95, brazos: 0.95, piernas: 1.0, alto: 0.99 },
      cara: { ancho: 0.98, largo: 0.99, nariz: 0.92, ojos: 1.1, boca: 1.06, pomulos: 1.15, sonrisa: 0.85, labios: 1.2, arco: 1.1, rouge: '#c82838', iris: '#4a3a22' },
      colores: { piel: PIEL_B, pelo: '#3a2416', ropa: '#5a8aa8', abrigo: '#5a8aa8', gorro: null, aros: 'chicos' },
      R: { mujer: true, pollera: true, colPollera: '#4e82a4', dosTrenzas: true, trenza: true, panuelo: '#e8e0d0', pantalon: '#d8c0a8', botas: 'cortas', botaCol: '#3a2418' },
      guardas: { pollera: [6, 0.06] }, poses: ['cintura'] } },
};
for (const [k, v] of Object.entries(V)) ASPECTO[k] = v.def;

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
// la barra (mostrador) con estantes de botellas atrás
const barra = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 0.55), madera('#4a2e1a')); barra.position.set(-1.95, 0.525, -0.7); barra.castShadow = barra.receiveShadow = true; escena.add(barra);
const tapa = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 0.65), madera('#6e4626')); tapa.position.set(-1.95, 1.08, -0.7); escena.add(tapa);
for (const y of [1.5, 1.9]) {
  const e = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 0.2), madera('#3e2616')); e.position.set(-1.6, y, -2.08); escena.add(e);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.26, 8), madera(['#2e4a2a', '#5a2a1e', '#c8b070', '#2a3a3e'][i % 4])); b.position.set(-2.9 + i * 0.23, y + 0.15, -2.06); escena.add(b); }
}
// la mesa
const mesa = new THREE.Group(); mesa.position.set(1.5, 0, -0.9); escena.add(mesa);
const tm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.7), madera('#7a5232')); tm.position.y = 0.76; tm.castShadow = true; mesa.add(tm);
for (const [x, z] of [[-0.44, -0.3], [0.44, -0.3], [-0.44, 0.3], [0.44, 0.3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), madera('#4a2e1a')); p.position.set(x, 0.37, z); mesa.add(p); }
const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.09, 10), madera('#b8c8b0')); vaso.position.set(0.1, 0.83, 0); mesa.add(vaso);
// el farol colgado
const caja = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: '#ffcc80' })); caja.position.set(0.9, 2.35, 1.4); escena.add(caja);
const camara = new THREE.PerspectiveCamera(36, 16 / 9, 0.05, 100);
atlasPersonajes(); completarAtlas();

// ---------------------------------------------------------------- lo que el cuerpo no trae: escote, tajo, flor, bandeja
const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
function agregados(m, v) {
  const piel = v.def.colores.piel, R = v.def.R;
  if (v.escote) {   // el escote en V, de la piel, sobre el pecho
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.05 * v.escote, 3), mat(piel));
    e.rotation.set(-0.35, 0, -Math.PI / 2); e.scale.set(1.25, 0.7, 1); e.position.set(0, 0.5, 0.118); m.torso.add(e);
  }
  if (v.tajo) {   // el tajo: una franja de la media a un costado de la pollera
    const h = 0.26 * v.tajo, a = 0.55;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.035, h), mat(R.pantalon)); t.material.side = THREE.DoubleSide;
    const y = -0.52 + h / 2, r = 0.236 - (h / 2) * 0.08;
    t.position.set(Math.sin(a) * (r + 0.004), y, Math.cos(a) * (r + 0.004)); t.rotation.set(-0.07, a, 0); m.torso.add(t);
  }
  if (v.vuelo) m.torso.traverse((o) => {
    if (o.userData && o.userData.rol === 'pollera') {
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0.1) { const k = 1 + (v.vuelo - 1) * Math.min(1, (0.1 - y) / 0.62) ** 1.5; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
      p.needsUpdate = true; o.geometry.computeBoundingSphere();
    }
  });
  // la flor en el pelo, sobre la oreja
  const flor = new THREE.Group(); flor.position.set(0.075, 0.09, 0.02);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat(v.flor)); const a = (i / 6) * Math.PI * 2; p.position.set(0, Math.cos(a) * 0.017, Math.sin(a) * 0.017); p.scale.set(0.5, 1, 1); flor.add(p); }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), mat('#e8b830')); c.position.x = 0.006; flor.add(c);
  m.cabeza.add(flor);
  if (v.pose === 'bandeja' && m.mano) {
    const b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.012, 24), mat('#9a9890')));
    for (const [x, z, col] of [[0.06, 0.03, '#c8a040'], [-0.06, -0.02, '#7a2030'], [0, -0.08, '#d8d0b8']]) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.1, 10), mat(col)); g.position.set(x, 0.056, z); b.add(g); }
    m.__bandeja = b; escena.add(b);
  }
}
// las poses, a mano sobre lo que deja el juego (brazo: x adelante, z afuera; el codo dobla en x)
function brazo(b, x, y, z, codo) { b.rotation.order = 'XZY'; b.rotation.set(x, y, z); if (b.userData.codo) b.userData.codo.rotation.x = codo; }
function posar(m, v) {
  const [izq, der] = m.brazos;
  if (v.pose === 'bandeja') {
    brazo(der, -0.2, 0, 2.3, -0.7); brazo(izq, 0.5, -1.45, -0.08, -1.3);
    m.torso.rotation.z = 0.05; m.cabeza.rotation.set(-0.04, 0.12, -0.1);
  } else if (v.pose === 'barra') {
    brazo(izq, -0.3, 0, -0.75, -0.35); brazo(der, 0.5, 1.45, 0.08, -1.3);
    m.torso.rotation.z = -0.08; m.cabeza.rotation.set(0, 0.25, 0.12);
  } else if (v.pose === 'tango') {
    brazo(der, -1.3, 0, 0.9, -0.5); brazo(izq, 0.5, -1.45, -0.08, -1.3);
    m.torso.rotation.set(-0.06, 0, 0.1); m.cabeza.rotation.set(-0.08, -0.2, -0.12);
    m.patas[1].rotation.set(-0.35, 0, 0.12); if (m.patas[1].userData.rodilla) m.patas[1].userData.rodilla.rotation.x = 0.5;
  } else if (v.pose === 'chamame') {
    brazo(der, -0.2, 0, 1.05, -0.4); brazo(izq, -0.2, 0, -1.05, -0.4);
    m.torso.rotation.set(0, 0, -0.06); m.cabeza.rotation.set(-0.05, 0.1, 0.1);
  }
  if (m.__bandeja) { m.g.updateMatrixWorld(true); const p = new THREE.Vector3(); m.mano.getWorldPosition(p); m.__bandeja.position.set(p.x, p.y + 0.04, p.z); }
}
let actual = null;
function armar(clave) {
  if (actual) { escena.remove(actual.g); if (actual.__bandeja) escena.remove(actual.__bandeja); actual.soltar?.(); }
  const v = V[clave];
  const m = __mallaPersona({}, clave, false, {});
  m.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  escena.add(m.g); m.fase = 0; m.pose = null; m.pos = m.g.position; m.clave = clave;
  agregados(m, v); actual = m;
  return m;
}
function cuadro(m, v) {
  escena.updateMatrixWorld(true);
  m.cabeza.rotation.set(0, 0, 0); m.torso.rotation.set(0, 0, 0);
  m.__gesto = v.pose === 'tango' ? 'neutral' : 'sonrisa'; m.__cerca = true; m.__quietud = null;
  if (m.alPosar) m.alPosar(m, 1 / 60, camara, false, false);
  posar(m, v);
}
function rotulo(cv, texto) {
  const x = cv.getContext('2d'); x.fillStyle = 'rgba(20,14,10,0.75)'; x.fillRect(0, 0, cv.width, 40);
  x.fillStyle = '#f2e6d0'; x.font = 'bold 22px Georgia, serif'; x.fillText(texto, 12, 28); return cv;
}
window.cantina = {
  claves: Object.keys(V),
  titulo: (k) => V[k].titulo,
  toma(clave, vista) {
    const v = V[clave], m = armar(clave);
    const ang = vista === 'tres-cuartos' ? 0.75 : 0.06;
    camara.position.set(Math.sin(ang) * 3.3, 1.12, Math.cos(ang) * 3.3); camara.lookAt(0, 0.95, 0); camara.fov = 36; camara.updateProjectionMatrix();
    for (let i = 0; i < 50; i++) cuadro(m, v);
    renderer.render(escena, camara);
    const cv = document.createElement('canvas'); cv.width = 620; cv.height = 900;
    cv.getContext('2d').drawImage(lienzo, 490, 0, 620, 900, 0, 0, 620, 900);
    return rotulo(cv, `${v.titulo.split(' · ')[0]} · ${vista === 'tres-cuartos' ? '3/4' : 'frente'}`).toDataURL('image/png');
  },
};
window.estudioListo = true;
