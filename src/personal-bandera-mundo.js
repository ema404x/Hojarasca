// 2.8: tu bandera en el mundo. Una sola textura de lienzo (se repinta al cambiarla) que
// comparten el mástil del refugio y las banderitas de las torres de vigía del Desafío.
// `texturaBandera()` la deja a mano para cualquier otro que la quiera usar (una obra,
// un cartel, el kayak…): devuelve siempre la misma CanvasTexture, al día.
import * as THREE from 'three';
import { dibujarBandera, sanearBandera } from './personal-bandera.js';

const ANCHO = 192, ALTO = 128;
let lienzo = null, textura = null, datosActuales = sanearBandera(null);

function asegurarTextura() {
  if (textura) return textura;
  lienzo = document.createElement('canvas');
  lienzo.width = ANCHO; lienzo.height = ALTO;
  textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 2;
  pintar();
  return textura;
}
function pintar() {
  const ctx = lienzo?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, ANCHO, ALTO);
  dibujarBandera(ctx, datosActuales, ANCHO, ALTO);
  // un poco de trama de lana: líneas apenas más oscuras
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < ALTO; y += 4) ctx.fillRect(0, y, ANCHO, 1);
  textura.needsUpdate = true;
}
// La textura de tu bandera (siempre la misma, se actualiza sola al cambiarla).
export function texturaBandera() { return asegurarTextura(); }
// Pintar la bandera en otro lienzo (la pantalla de victoria, el panel).
export function pintarBanderaEn(canvas, datos = datosActuales) {
  const ctx = canvas?.getContext?.('2d');
  if (!ctx) return false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarBandera(ctx, datos, canvas.width, canvas.height);
  return true;
}

// El paño: un plano con columnas que ondean. `largo` × `alto` en metros.
function crearPano(largo, alto, material) {
  const g = new THREE.PlaneGeometry(largo, alto, 8, 3);
  g.translate(largo / 2, 0, 0);
  const base = Float32Array.from(g.attributes.position.array);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.userData.base = base;
  m.userData.largo = largo;
  return m;
}
function ondear(pano, t, fuerza) {
  const pos = pano.geometry.attributes.position;
  const base = pano.userData.base, L = pano.userData.largo;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1];
    const k = x / L;   // pegado al mástil no se mueve
    pos.array[i * 3 + 2] = Math.sin(t * 3.1 - x * 3.4 + y * 0.8) * 0.12 * k * fuerza;
    pos.array[i * 3 + 1] = y - k * k * 0.06 * (1 - fuerza * 0.5);
  }
  pos.needsUpdate = true;
  pano.geometry.computeVertexNormals();
}

// `T`: el terreno (lugares.refugio con x, z, y, rot). `col`: colisiones (el mástil ataja).
// `mastilAjeno`: el mástil que arma "Tu refugio" (personal-casa-mundo.js, est.mastil), con
// `grupo` (la punta, donde se cuelga el paño) y `bandera` (su paño quieto). Si está, el
// paño que ondea se cuelga ahí y el quieto se esconde; si no, se arma un mástil propio.
export function crearBanderaMundo(escena, T, col, { mastilAjeno = null } = {}) {
  const tex = asegurarTextura();
  const matPano = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  const matMastil = new THREE.MeshLambertMaterial({ color: new THREE.Color('#6b5238') });
  const matRemate = new THREE.MeshLambertMaterial({ color: new THREE.Color('#b9a271') });
  const panos = [];

  // el mástil del refugio: adelante a la izquierda de la puerta, lejos del fogón y del banco
  const ref = T?.lugares?.refugio;
  let mastil = null;
  if (mastilAjeno?.grupo?.isObject3D) {
    const pano = crearPano(1.2, 0.8, matPano);
    pano.position.set(0.03, -0.38, 0);
    mastilAjeno.grupo.add(pano);
    if (mastilAjeno.bandera) mastilAjeno.bandera.visible = false;
    mastilAjeno.ponerTextura?.(tex);
    mastil = mastilAjeno.grupo;
    panos.push(pano);
  } else if (ref && Number.isFinite(ref.x)) {
    const rot = ref.rot || 0, lx = -4.8, lz = 4.3;
    const x = ref.x + lx * Math.cos(rot) + lz * Math.sin(rot);
    const z = ref.z - lx * Math.sin(rot) + lz * Math.cos(rot);
    const y = T.altura ? T.altura(x, z) : (ref.y || 0);
    mastil = new THREE.Group();
    mastil.name = 'mastil-refugio';
    mastil.position.set(x, y, z);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 5.6, 7), matMastil);
    palo.position.y = 2.8; palo.castShadow = true;
    const remate = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), matRemate);
    remate.position.y = 5.64;
    const piedras = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.22, 8), new THREE.MeshLambertMaterial({ color: new THREE.Color('#7d776b') }));
    piedras.position.y = 0.06; piedras.receiveShadow = true;
    const pano = crearPano(1.5, 1.0, matPano);
    pano.position.set(0.04, 4.95, 0);
    mastil.add(palo, remate, piedras, pano);
    mastil.rotation.y = rot;
    escena.add(mastil);
    panos.push(pano);
    col?.agregar?.({ x, z, r: 0.12 });
  }

  // 2.8: banderitas en las torres de vigía terminadas (Desafío). Se buscan de a ratos.
  const torres = new Map();   // obra -> grupo
  const _v = new THREE.Vector3();
  function banderita() {
    const g = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 6), matMastil);
    palo.position.y = 0.75; palo.castShadow = true;
    const pano = crearPano(0.75, 0.5, matPano);
    pano.position.set(0.02, 1.25, 0);
    g.add(palo, pano);
    g.userData.pano = pano;
    return g;
  }
  let ultimaRevision = -Infinity;
  function revisarTorres(obras) {
    const vivas = new Set();
    for (const o of obras?.obras || []) {
      if (o?.plano?.id !== 'torre-vigia' || !o.grupo || !(o.datos?.etapas >= (o.plano.etapas?.length || 1))) continue;
      vivas.add(o);
      let g = torres.get(o);
      if (!g) { g = banderita(); escena.add(g); torres.set(o, g); panos.push(g.userData.pano); }
      // arriba del poste de una esquina de la torre
      o.grupo.updateWorldMatrix(true, false);
      _v.set(-1.05, 3.42, -1.05).applyMatrix4(o.grupo.matrixWorld);
      g.position.copy(_v);
      g.rotation.y = o.grupo.rotation.y || 0;
    }
    for (const [o, g] of torres) {
      if (vivas.has(o)) continue;
      escena.remove(g);
      // 3.5.4: las geometrías de la banderita son suyas (los materiales, compartidos): antes quedaban
      // en la placa, dos por cada torre derribada o desarmada
      g.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });
      const i = panos.indexOf(g.userData.pano);
      if (i >= 0) panos.splice(i, 1);
      torres.delete(o);
    }
  }

  let t = 0, acumulado = 0;
  // `desde`: la posición del jugador (sólo ondea lo que está cerca).
  function actualizar(dt, desde, { obras = null, viento = 0.5 } = {}) {
    t += dt;
    // cada dos segundos de reloj (el dt del juego se recorta y se congela en el modo foto)
    const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (ahora - ultimaRevision > 2000) { ultimaRevision = ahora; revisarTorres(obras); }
    acumulado += dt;
    if (acumulado < 1 / 24) return;   // el paño se mueve a 24 cuadros: no hace falta más
    acumulado = 0;
    const fuerza = 0.45 + Math.min(1, Math.max(0, viento)) * 0.55;
    for (const p of panos) {
      let o = p;
      while (o && o.visible) o = o.parent;
      if (o) continue;   // escondido (sin mástil, torre lejos): no se mueve
      p.getWorldPosition(_v);
      if (desde && (_v.x - desde.x) ** 2 + (_v.z - desde.z) ** 2 > 90 * 90) continue;
      ondear(p, t + _v.x * 0.1, fuerza);
    }
  }

  function aplicar(datos) {
    datosActuales = sanearBandera(datos);
    pintar();
  }

  return { aplicar, actualizar, mastil, textura: () => tex, cantidadTorres: () => torres.size, revisarTorres };
}
