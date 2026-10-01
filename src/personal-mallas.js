// 2.8: ayudas de three para lo personalizado (perro, caballo, kayak, trochita, armas):
// repintar mallas compactadas, pintar un nombre en una textura y soltar lo que ya no se
// usa. Sólo lo importan módulos del mundo (no es puro: usa three y el canvas).
import * as THREE from 'three';

// `compactar` (vida.js) junta las piezas de un grupo en una malla con colores por
// vértice. Para cambiarle un color sin rearmarla: cada vértice cuyo color de base esté en
// `mapa` (hex de base → hex nuevo) toma el nuevo; los demás vuelven a su color de base.
// El color de base se guarda la primera vez, así se puede repintar cuantas veces haga falta.
export function repintarVertices(raiz, mapa) {
  const pares = Object.entries(mapa || {}).map(([de, a]) => [new THREE.Color(de), new THREE.Color(a)]);
  let tocados = 0;
  raiz.traverse((o) => {
    const col = o.isMesh ? o.geometry?.attributes?.color : null;
    if (!col) return;
    const ud = o.geometry.userData || (o.geometry.userData = {});
    if (!ud.colorBase) ud.colorBase = col.array.slice();
    const base = ud.colorBase, a = col.array;
    for (let i = 0; i < a.length; i += 3) {
      let r = base[i], g = base[i + 1], b = base[i + 2];
      for (const [de, hacia] of pares) {
        if (Math.abs(r - de.r) < 2e-3 && Math.abs(g - de.g) < 2e-3 && Math.abs(b - de.b) < 2e-3) { r = hacia.r; g = hacia.g; b = hacia.b; tocados++; break; }
      }
      a[i] = r; a[i + 1] = g; a[i + 2] = b;
    }
    col.needsUpdate = true;
  });
  return tocados;
}

// Un color más oscuro (o más claro, con `k` > 1), en hex
export function tono(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * k)));
  return `#${c.getHexString()}`;
}

// ¿Conviene letra clara u oscura sobre este fondo?
export function letraSobre(hex) {
  const c = new THREE.Color(hex);
  return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.22 ? '#231d17' : '#f2ead8';
}

// Un nombre pintado en una textura. `fondo` null = transparente. Se vuelve a pintar
// cuando terminan de cargar las letras del juego (la primera vez puede salir con otra).
export function texturaNombre(texto, { ancho = 512, alto = 96, fondo = null, tinta = '#f2ead8', borde = null, fuente = 'Spectral', peso = 600, cursiva = false } = {}) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const pintar = () => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, ancho, alto);
    if (fondo) {
      x.fillStyle = fondo; x.fillRect(0, 0, ancho, alto);
      if (borde) { x.strokeStyle = borde; x.lineWidth = alto * 0.08; x.strokeRect(alto * 0.08, alto * 0.08, ancho - alto * 0.16, alto - alto * 0.16); }
    }
    let tam = Math.round(alto * 0.62);
    const tipo = () => `${cursiva ? 'italic ' : ''}${peso} ${tam}px ${fuente}, Georgia, serif`;
    x.font = tipo();
    while (tam > 10 && x.measureText(texto).width > ancho * 0.88) { tam -= 2; x.font = tipo(); }
    x.fillStyle = tinta; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(texto, ancho / 2, alto * 0.54);
    tex.needsUpdate = true;
  };
  pintar();
  try { document.fonts?.ready?.then(pintar); } catch {}
  return tex;
}

// Suelta geometrías, materiales y las texturas propias (las de `texturaNombre`) de todo
// lo que cuelga de `raiz`. Las texturas compartidas del juego no se tocan, y los
// materiales de `conservar` (el MAT_FAUNA de toda la fauna, por ejemplo) tampoco.
export function desechar(raiz, conservar = []) {
  raiz?.traverse?.((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || conservar.includes(m)) continue;
      if (m.userData?.texturaPropia && m.map) m.map.dispose();
      m.dispose?.();
    }
  });
}

// Un cartel con nombre: un plano con la textura, que no se fusiona con nada
export function cartelNombre(texto, ancho, alto, opciones = {}) {
  const tex = texturaNombre(texto, opciones);
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: !opciones.fondo, depthWrite: !!opciones.fondo, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mat.userData.texturaPropia = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);
  m.name = 'nombre-personal';
  return m;
}
