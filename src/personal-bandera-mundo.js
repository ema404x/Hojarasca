// 2.8: tu bandera en el mundo. Una sola textura de lienzo (se repinta al cambiarla) que
// comparten el mástil del refugio y las banderitas de las torres de vigía del Desafío.
// `texturaBandera()` la deja a mano para cualquier otro que la quiera usar (una obra,
// un cartel, el kayak…): devuelve siempre la misma CanvasTexture, al día.
// 3.8.9: el paño flamea con el viento y el clima como el resto (bandera-viento.js: el mismo material con el flameo en el vertex shader
// y la orientación al viento); antes tenía una onda propia en la CPU, que no seguía la lluvia ni se orientaba.
import * as THREE from 'three';
import { dibujarBandera, sanearBandera } from './personal-bandera.js';
import { crearPanoBandera, materialBandera, registrarBandera, quitarBandera } from './bandera-viento.js';

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

// El paño: el de bandera-viento.js (cuelga de un grupo en el mástil, con el origen en la esquina de arriba junto al palo, y se orienta
// con el viento). `largo` × `alto` en metros.
function crearPano(largo, alto, material, tex) {
  return registrarBandera(crearPanoBandera(largo, alto, tex, { material, segmentos: [largo > 1 ? 24 : 16, 6] }));
}

// `T`: el terreno (lugares.refugio con x, z, y, rot). `col`: colisiones (el mástil ataja).
// `mastilAjeno`: el mástil que arma "Tu refugio" (personal-casa-mundo.js, est.mastil), con
// `grupo` (la punta, donde se cuelga el paño) y `bandera` (su paño quieto). Si está, el
// paño que ondea se cuelga ahí y el quieto se esconde; si no, se arma un mástil propio.
export function crearBanderaMundo(escena, T, col, { mastilAjeno = null } = {}) {
  const tex = asegurarTextura();
  const matPano = materialBandera({ map: tex });   // (el mismo para todos tus paños: el refugio y las torres)
  const matMastil = new THREE.MeshLambertMaterial({ color: new THREE.Color('#6b5238') });
  const matRemate = new THREE.MeshLambertMaterial({ color: new THREE.Color('#b9a271') });

  // el mástil del refugio: adelante a la izquierda de la puerta, lejos del fogón y del banco
  const ref = T?.lugares?.refugio;
  let mastil = null;
  if (mastilAjeno?.grupo?.isObject3D) {
    const pano = crearPano(1.2, 0.8, matPano, tex);
    pano.position.set(0.03, 0.02, 0);
    mastilAjeno.grupo.add(pano);
    if (mastilAjeno.bandera) mastilAjeno.bandera.visible = false;
    mastilAjeno.ponerTextura?.(tex);
    mastil = mastilAjeno.grupo;
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
    const pano = crearPano(1.5, 1.0, matPano, tex);
    pano.position.set(0.04, 5.45, 0);
    mastil.add(palo, remate, piedras, pano);
    mastil.rotation.y = rot;
    escena.add(mastil);
    col?.agregar?.({ x, z, r: 0.12 });
  }

  // 2.8: banderitas en las torres de vigía terminadas (Desafío). Se buscan de a ratos.
  const torres = new Map();   // obra -> grupo
  const _v = new THREE.Vector3();
  function banderita() {
    const g = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 6), matMastil);
    palo.position.y = 0.75; palo.castShadow = true;
    const pano = crearPano(0.75, 0.5, matPano, tex);
    pano.position.set(0.02, 1.5, 0);
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
      if (!g) { g = banderita(); escena.add(g); torres.set(o, g); }
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
      quitarBandera(g.userData.pano);
      torres.delete(o);
    }
  }

  // `desde`, `viento`: ya no hacen falta (el paño flamea en la placa de video con el clima y se orienta en bandera-viento.js);
  // se siguen recibiendo para no cambiar la llamada de main.js.
  function actualizar(dt, desde, { obras = null } = {}) {
    // cada dos segundos de reloj (el dt del juego se recorta y se congela en el modo foto)
    const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (ahora - ultimaRevision > 2000) { ultimaRevision = ahora; revisarTorres(obras); }
  }

  function aplicar(datos) {
    datosActuales = sanearBandera(datos);
    pintar();
  }

  return { aplicar, actualizar, mastil, textura: () => tex, cantidadTorres: () => torres.size, revisarTorres };
}
