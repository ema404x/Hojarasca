// 3.7.0: el estudio de personajes (pruebas/estudio-personajes.cjs). Una escena chica con la luz de la
// tarde y el mismo dibujante del juego (ACES, sRGB): para mirar de cerca a la gente (gente-cuerpo.js,
// gente-ropa.js) sin cargar el valle. Las capturas de verdad son las del juego (visor-personajes.cjs).
import * as THREE from 'three';
import { __mallaPersona, __ROPA } from '../../src/gente.js';
import { __piezasPersona, huesosEnUso } from '../../src/gente-cuerpo.js';
import { atlasPersonajes, completarAtlas } from '../../src/gente-atlas.js';
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
Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 3, bottom: -1, near: 0.5, far: 20 });
sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
escena.add(sol); escena.add(sol.target);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: '#7d7660' }));
piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);
const camara = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 100);
atlasPersonajes(); completarAtlas();

// la definición de cada clave (los colores de aldea.js; los del valle, los suyos de gente-ropa.js)
function defDe(clave) {
  const k = clave.replace(/^(aldea|poblador)-/, '');
  if (clave.startsWith('aldea-') && VECINOS_ALDEA[k]) return VECINOS_ALDEA[k];
  if (clave.startsWith('poblador-') && POBLADORES_ALDEA[k]) return POBLADORES_ALDEA[k];
  return { colores: {}, mano: clave === 'ramon' ? 'mate' : null };
}
let actuales = [];
function armar(claves, opciones = {}) {
  for (const a of actuales) { escena.remove(a.g); a.soltar?.(); }
  const n = claves.length, paso = opciones.paso || 0.85;
  actuales = claves.map((clave, i) => {
    const def = defDe(clave);
    const conMate = def.mano === 'mate';
    const m = __mallaPersona(def.colores || {}, clave, conMate, { talla: def.talla, invierno: !!opciones.invierno, fiesta: !!opciones.fiesta });
    if (def.talla) m.g.scale.setScalar(def.talla);
    m.g.position.set((i - (n - 1) / 2) * paso, 0, 0);
    m.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    escena.add(m.g);
    m.brazos[0].rotation.z = -0.035; m.brazos[1].rotation.z = 0.035;
    if (m.muneca) { const q = m.brazos[1].quaternion.clone().invert(); m.muneca.quaternion.copy(q); }
    m.fase = 0; m.pose = null; m.pos = m.g.position; m.clave = clave;
    m.mate = m.mateVisible;
    return m;
  });
}
function posar(dt = 1 / 60) {
  escena.updateMatrixWorld(true);
  for (const m of actuales) {
    m.cabeza.rotation.set(0, 0, 0); m.torso.rotation.set(0, 0, 0);
    if (!m.__quietud) for (const b of m.brazos) { b.rotation.order = 'XYZ'; b.rotation.y = 0; }
    if (m.__pose) aplicarPose(m);
    if (m.alPosar) m.alPosar(m, dt, camara, !!m.__charla, false);
  }
}
// una pose de gente.js (lo justo para verla): sentado, y con el mate a la boca
function aplicarPose(m) {
  if (m.__pose === 'sentado') {
    const b = 0.35;
    m.torso.position.y = 0.82 - b; m.cabeza.position.y = 1.46 - b;
    m.brazos[0].position.y = 1.3 - b; m.brazos[1].position.y = 1.3 - b;
    for (const p of m.patas) { p.position.y = 0.82 - b; p.rotation.x = -1.45; p.userData.rodilla.rotation.x = 1.45; }
    m.brazos[0].rotation.x = -0.45; m.brazos[1].rotation.x = -0.45;
    if (m.muneca) {
      const k = m.__toma ? 1 : 0;
      m.brazos[1].rotation.x = -0.05 + (-0.6 + 0.05) * k; m.brazos[1].rotation.y = -0.48 * k;
      const q = m.brazos[1].quaternion.clone().invert();
      m.muneca.quaternion.copy(q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.6 * k, 0, 0))));
      m.cabeza.rotation.x -= 0.18 * k;
    }
  }
}
function mirar(o, a, fov) {
  camara.position.set(...o); camara.lookAt(...a);
  if (camara.fov !== fov) { camara.fov = fov; camara.updateProjectionMatrix(); }
}
function recorte(x, y, w, h) { renderer.render(escena, camara); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(lienzo, x, y, w, h, 0, 0, w, h); return cv; }
function lado(cvs, sep = 6, columnas = 0) {
  const cols = columnas || cvs.length, filas = Math.ceil(cvs.length / cols);
  const W = cvs[0].width, H = cvs[0].height;
  const out = document.createElement('canvas'); out.width = cols * (W + sep) - sep; out.height = filas * (H + sep) - sep;
  const x = out.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, out.width, out.height);
  cvs.forEach((c, i) => x.drawImage(c, (i % cols) * (W + sep), Math.floor(i / cols) * (H + sep)));
  return out;
}
function rotulo(cv, texto) {
  const x = cv.getContext('2d'); x.fillStyle = 'rgba(29,26,23,0.7)'; x.fillRect(0, 0, cv.width, 34);
  x.fillStyle = '#efe6d6'; x.font = 'bold 22px Georgia, serif'; x.fillText(texto, 12, 24);
  return cv;
}
const corto = (k) => k.replace(/^(aldea|poblador)-/, '');
window.estudio = {
  // toma: cuerpo | espalda | cara | sonrisa | risa | perfil | poses | sentado; las claves, separadas por coma
  async toma(clavesTxt, toma, opciones = {}) {
    const claves = clavesTxt.split(',').filter(Boolean);
    armar(claves, opciones);
    for (const m of actuales) { m.__quietud = null; m.__gesto = null; m.__cerca = true; }
    const solo = (m) => { for (const a of actuales) a.g.visible = a === m; };
    const tiras = [];
    if (toma === 'cuerpo' || toma === 'espalda') {
      for (const m of actuales) {
        solo(m);
        const c = m.g.position, k = m.g.scale.y, atras = toma === 'espalda';
        m.__gesto = 'neutral';
        mirar([c.x + 0.3 * k, 1.0 * k, (atras ? -3.0 : 3.0) * k], [c.x, 0.88 * k, 0], 36);
        for (let i = 0; i < 40; i++) posar();
        tiras.push(rotulo(recorte(530, 0, 540, 900), corto(m.clave)));
      }
    } else if (toma === 'poses') {
      for (const m of actuales) {
        solo(m);
        for (const p of m.posesM || []) {
          m.__quietud = p; m.__gesto = 'sonrisa';
          const c = m.g.position, k = m.g.scale.y;
          mirar([c.x + 0.6 * k, 1.05 * k, 3.4 * k], [c.x, 0.95 * k, 0], 36);
          for (let i = 0; i < 60; i++) posar();
          tiras.push(rotulo(recorte(530, 0, 540, 900), `${corto(m.clave)} · ${p}`));
        }
        m.__quietud = null;
      }
    } else if (toma === 'sentado') {
      for (const m of actuales) {
        solo(m);
        for (const tomando of [0, 1]) {
          m.__pose = 'sentado'; m.__toma = tomando; m.__gesto = 'neutral';
          const c = m.g.position, k = m.g.scale.y;
          mirar([c.x + 1.2 * k, 0.95 * k, 2.4 * k], [c.x, 0.7 * k, 0.1], 38);
          for (let i = 0; i < 30; i++) posar();
          tiras.push(rotulo(recorte(530, 0, 540, 900), `${corto(m.clave)}${tomando ? ' · mate' : ''}`));
        }
        m.__pose = null;
      }
    } else {
      // la cara: cada uno a 1 m (lente de 30°); `sonrisa`/`risa`: con el gesto; `perfil`: de tres cuartos
      for (const m of actuales) {
        solo(m);
        m.__gesto = toma === 'sonrisa' || toma === 'risa' ? toma : 'neutral';
        m.g.updateMatrixWorld(true);
        const c = new THREE.Vector3(); m.cabeza.getWorldPosition(c); c.y += 0.045 * m.g.scale.y;
        const ang = toma === 'perfil' ? 0.8 : 0.18;
        mirar([c.x + Math.sin(ang) * 0.95, c.y + 0.02, c.z + Math.cos(ang) * 0.95], [c.x, c.y - 0.01, c.z], 30);
        for (let i = 0; i < 50; i++) posar();
        renderer.render(escena, camara);
        const cv = document.createElement('canvas'); cv.width = 520; cv.height = 600;
        cv.getContext('2d').drawImage(lienzo, (1600 - 520) / 2, (900 - 600) / 2, 520, 600, 0, 0, 520, 600);
        tiras.push(rotulo(cv, corto(m.clave)));
      }
    }
    for (const a of actuales) a.g.visible = true;
    return lado(tiras, 6, Math.min(6, tiras.length)).toDataURL('image/png');
  },
  medir(clavesTxt) {
    armar(clavesTxt.split(',').filter(Boolean));
    return actuales.map((m) => { let tri = 0, dib = 0; m.g.traverse((o) => { if (o.isMesh) { dib++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return { clave: m.clave, tri: Math.round(tri), dib }; });
  },
  partes(clave) { const def = defDe(clave); return __piezasPersona(def.colores, clave, def.mano === 'mate', __ROPA[clave] || {}).map(([k, e]) => `${k} ${Math.round(e.tri)}/${e.ver} (${e.n})`).join(' | '); },
  tiempoArmado(clavesTxt, n = 3) {
    const claves = clavesTxt.split(',').filter(Boolean), t0 = performance.now();
    for (let i = 0; i < n; i++) for (const clave of claves) { const def = defDe(clave); const m = __mallaPersona(def.colores || {}, clave, def.mano === 'mate', { talla: def.talla, invierno: i % 2 === 1 }); m.soltar?.(); }
    return { ms: +((performance.now() - t0) / (n * claves.length)).toFixed(1), huesos: huesosEnUso() };
  },
  atlasPng() { return atlasPersonajes().image.toDataURL('image/png'); },
  atlas() { const t = atlasPersonajes(); return { ms: +t.userData.info.ms.toFixed(1), pasos: t.userData.info.pasos, mb: +(t.userData.bytes / 1048576).toFixed(1) }; },
};
window.estudioListo = true;
