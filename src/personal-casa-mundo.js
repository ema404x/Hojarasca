// 2.8: tu refugio en el mundo (lo que elegís en Personalizar → Tu refugio).
// Las reglas y las paletas están en estilo-casa.js (puro); acá se pinta y se arma:
//   · la pintura del Refugio del Arroyo (paredes, aberturas y techo, sobre los colores por
//     vértice de su malla: sin rehacer el edificio) y de las hojas de puerta,
//   · lo de adentro (alfombra, rincones, alféizar, la mesa y dos cuadros con tus fotos),
//   · lo de afuera (faroles, cerco y el mástil donde flamea tu bandera).
// estructuras.js lo crea al final (`crearDecoRefugio`) y lo devuelve como `personal`;
// construccion.js usa `pintarHoja` para las puertas de tus obras.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { pintarRangos, rangosPorZona, MASTIL_LOCAL, refugioDefecto } from './estilo-casa.js';

// ---------------------------------------------------------------- puertas y postigos
// puertas.js comparte cuatro materiales de madera entre todas las hojas. Pintar una
// hoja le cambia el material a sus mallas por una copia con el color (una por color,
// compartida), y se recuerda el original para volver a la madera.
const ORIGINAL = new WeakMap();
const COPIAS = new Map();
const CLAROS = [0x6b5238, 0x4d6b52], OSCUROS = [0x4a3b2c, 0x3f5a44];
const parecido = (c, lista) => lista.some((h) => Math.abs(((h >> 16) & 255) - ((c >> 16) & 255)) < 3 &&
  Math.abs(((h >> 8) & 255) - ((c >> 8) & 255)) < 3 && Math.abs((h & 255) - (c & 255)) < 3);
export function pintarHoja(g, hex) {
  if (!g?.traverse) return 0;
  let n = 0;
  g.traverse((m) => {
    if (!m.isMesh || Array.isArray(m.material)) return;
    const orig = ORIGINAL.get(m) || m.material;
    const c = orig?.color?.getHex?.();
    if (!Number.isFinite(c)) return;
    const oscuro = parecido(c, OSCUROS);
    if (!oscuro && !parecido(c, CLAROS)) return;
    if (!ORIGINAL.has(m)) ORIGINAL.set(m, orig);
    if (!hex) { m.material = orig; return; }
    const clave = `${orig.uuid}|${hex}`;
    let copia = COPIAS.get(clave);
    if (!copia) {
      copia = orig.clone();
      copia.color.set(hex);
      if (oscuro) copia.color.multiplyScalar(0.72);
      COPIAS.set(clave, copia);
    }
    m.material = copia;
    n++;
  });
  return n;
}

// ---------------------------------------------------------------- el refugio
const MADERA = '#6b5238', MADERA_OSCURA = '#4a3b2c', TABLA = '#8a6b4a';
const TECHO_REFUGIO = new Set(['#43372f', '#493b31', '#3f342d', '#4d3f34']);

// Lugares en coordenadas del refugio (x a lo ancho, +z sale por la puerta; el piso está a
// 0,37 m). Elegidos contra lo que ya hay adentro: mesa, cama, hogar, estante, leña.
const PISO = 0.37;
const LUGAR = {
  alfombra: { x: 0.05, z: 0.75 },
  rincon: { x: 2.8, z: 1.75, giro: -2.4 },
  rinconPuerta: { x: -2.75, z: 2.05, giro: 2.4 },
  ventana: { x: 2.2, z: 2.47, y: 1.03 },
  // 3.0.1: la mesa se corrió 22 cm hacia la puerta (se metía en la cama): lo de arriba, con ella
  mesa: { x: 0.6, z: -0.88, y: 0.89 },   // la otra punta de la mesa tiene el tocadiscos (tocadiscos-mundo.js)
  cuadroCostado: { x: 3.29, z: 0.35, y: 1.55, giro: -Math.PI / 2 },
  cuadroCama: { x: 2.2, z: -2.54, y: 1.62, giro: 0 },
};
const FAROLES_EN = { dos: [[-1.25, 5.0], [1.25, 5.0]], cuatro: [[-1.25, 5.0], [1.25, 5.0], [-4.1, 3.5], [4.1, 3.5]] };
const CERCO_EN = [[-4.7, 3.0, -4.7, 7.4], [4.7, 3.0, 4.7, 6.3]];

export function crearDecoRefugio({ T, col, ref, raiz, mat, pintable = null, vidrioFarol = null, puertas = null }) {
  const rot = ref.rot || 0;
  const grupo = new THREE.Group();
  grupo.name = 'refugio:personal';
  grupo.position.set(ref.x, ref.y, ref.z);
  grupo.rotation.y = rot;
  grupo.updateMatrix();
  grupo.matrixAutoUpdate = false;
  (raiz || ref.grupo || null)?.add(grupo);
  const aMundo = (lx, lz) => ({ x: ref.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: ref.z - lx * Math.sin(rot) + lz * Math.cos(rot) });
  const sueloLocal = (lx, lz) => { const q = aMundo(lx, lz); return T.altura(q.x, q.z) - ref.y; };
  const fijar = (o) => { o.traverse((n) => { n.updateMatrix(); n.matrixAutoUpdate = false; }); return o; };
  const matVidrio = vidrioFarol || new THREE.MeshBasicMaterial({ color: 0x2a2018, side: THREE.DoubleSide });

  // Cada lugar tiene su malla (o su grupo) y su física; cambiar uno no toca los demás.
  const puestos = new Map();   // clave -> { obj, firma, duenio }
  function quitar(clave) {
    const p = puestos.get(clave);
    if (!p) return;
    if (p.obj) {
      grupo.remove(p.obj);
      p.obj.traverse((n) => {
        if (!n.isMesh) return;
        n.geometry?.dispose?.();
        // las copias propias (la lámina de un cuadro) se disponen; su textura no: se reusa
        if (n.material && n.material !== mat && n.material !== matVidrio) n.material.dispose?.();
      });
    }
    if (p.duenio && col?.eliminarPorDuenio) col.eliminarPorDuenio(p.duenio);
    puestos.delete(clave);
  }
  function poner(clave, firma, armar) {
    const p = puestos.get(clave);
    if (p && p.firma === firma) return false;
    quitar(clave);
    const duenio = { deco: clave };
    const obj = armar(duenio);
    if (obj) { grupo.add(obj); fijar(obj); }
    puestos.set(clave, { obj, firma, duenio });
    return true;
  }
  const malla = (c, sombra = false) => {
    const m = new THREE.Mesh(c.geometria(), mat);
    m.castShadow = sombra; m.receiveShadow = true;
    return m;
  };
  const circulo = (duenio, lx, lz, r, y0, y1) => {
    const q = aMundo(lx, lz);
    col?.agregar?.({ duenio, x: q.x, z: q.z, r, alturaMin: ref.y + y0, alturaMax: ref.y + y1 });
  };
  const segmento = (duenio, ax, az, bx, bz, r, y0, y1) => {
    const A = aMundo(ax, az), B = aMundo(bx, bz);
    col?.agregar?.({ duenio, seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r, alturaMin: ref.y + y0, alturaMax: ref.y + y1 });
  };
  const caja = (c, pos, tam, color, rotY = 0, tipo = 4, variar = 0.08) =>
    c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, variar, matriz: matriz(pos, [0, rotY, 0]) });
  const cil = (c, pos, r0, r1, alto, color, tipo = 4, lados = 8, rotXYZ = [0, 0, 0]) =>
    c.agregar(new THREE.CylinderGeometry(r0, r1, alto, lados), { color, tipo, variar: 0.08, matriz: matriz(pos, rotXYZ) });

  // ---------------------------------------------------------------- pintura
  let original = null;
  const zonas = pintable?.marcas ? rangosPorZona(pintable.marcas, (m) => {
    if (m.zona === 'techo') return TECHO_REFUGIO.has(m.color) ? 'techo' : null;
    return m.zona === 'pared' || m.zona === 'aberturas' ? m.zona : null;
  }) : {};
  let firmaPintura = '';
  function pintar(d) {
    const firma = `${d.pared}|${d.aberturas}|${d.techo}`;
    if (firma === firmaPintura) return false;
    firmaPintura = firma;
    const attr = pintable?.malla?.geometry?.getAttribute('color');
    if (attr) {
      const a = attr.array;
      if (!original && (d.pared || d.aberturas || d.techo)) original = a.slice();
      if (original) {
        a.set(original);
        for (const z of ['pared', 'aberturas', 'techo']) if (d[z] && zonas[z]) pintarRangos(a, zonas[z], d[z]);
        attr.needsUpdate = true;
      }
    }
    const puerta = puertas?.lista?.find((p) => !p.duenio && p.nombre === 'la puerta del refugio');
    if (puerta?.g) pintarHoja(puerta.g, d.aberturas || null);
    return true;
  }

  // ---------------------------------------------------------------- adentro
  function armarAlfombra(tipo) {
    const c = new Constructor();
    const { x, z } = LUGAR.alfombra;
    const y = PISO + 0.012;
    if (tipo === 'cuero') {
      // un cuero de oveja: óvalo irregular de lana clara
      c.agregar(new THREE.CylinderGeometry(0.62, 0.62, 0.025, 11), { color: '#d9d0bd', tipo: 0, variar: 0.1, matriz: matriz([x, y, z], [0, 0.4, 0], [1.25, 1, 0.8]) });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.CylinderGeometry(0.13, 0.1, 0.02, 6), { color: '#cfc5b0', tipo: 0, variar: 0.1,
        matriz: matriz([x + [-0.75, 0.75, -0.55, 0.55][i], y, z + [-0.3, -0.3, 0.42, 0.42][i]]) });
      return malla(c);
    }
    const base = { 'lana-roja': '#8a2f2a', 'lana-cruda': '#cfc4ac', guarda: '#2f3a4a' }[tipo] || '#8a2f2a';
    const franja = { 'lana-roja': '#d9b36a', 'lana-cruda': '#6b5a44', guarda: '#c9b27a' }[tipo] || '#d9b36a';
    caja(c, [x, y, z], [1.7, 0.02, 1.1], base, 0, 0, 0.06);
    for (const s of [-1, 1]) caja(c, [x, y + 0.004, z + s * 0.4], [1.62, 0.02, 0.09], franja, 0, 0, 0.05);
    if (tipo === 'guarda') {
      // la guarda pampa: rombos escalonados en el medio
      for (let i = 0; i < 5; i++) caja(c, [x - 0.6 + i * 0.3, y + 0.006, z], [0.16, 0.02, 0.16], i % 2 ? '#8a2f2a' : franja, Math.PI / 4, 0, 0.04);
    } else {
      for (let i = 0; i < 7; i++) caja(c, [x - 0.72 + i * 0.24, y + 0.006, z], [0.05, 0.02, 0.5], franja, 0, 0, 0.05);
    }
    // flecos
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) caja(c, [x + s * 0.88, y, z - 0.48 + i * 0.12], [0.08, 0.012, 0.025], franja, 0, 0, 0.1);
    return malla(c);
  }

  function armarRincon(tipo, L, duenio) {
    const c = new Constructor();
    const g = L.giro || 0;
    const loc = (dx, dz) => [L.x + dx * Math.cos(g) + dz * Math.sin(g), L.z - dx * Math.sin(g) + dz * Math.cos(g)];
    const en = (dx, y, dz) => { const [a, b] = loc(dx, dz); return [a, y, b]; };
    if (tipo === 'sillon') {
      caja(c, en(0, PISO + 0.4, 0), [0.8, 0.14, 0.72], '#7a5a3a', g, 0);
      caja(c, en(0, PISO + 0.52, 0.02), [0.72, 0.1, 0.64], '#8a2f2a', g, 0);          // almohadón
      caja(c, en(0, PISO + 0.82, -0.32), [0.8, 0.66, 0.1], '#7a5a3a', g, 0);          // respaldo
      caja(c, en(0, PISO + 0.84, -0.26), [0.66, 0.5, 0.06], '#b8432f', g, 0);         // manta
      for (const s of [-1, 1]) caja(c, en(s * 0.38, PISO + 0.62, 0), [0.08, 0.3, 0.7], '#6b4e33', g, 0);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(c, en(sx * 0.33, PISO + 0.17, sz * 0.28), 0.035, 0.035, 0.34, MADERA_OSCURA, 0, 6);
      circulo(duenio, ...loc(0, -0.05), 0.42, PISO - 0.1, PISO + 1.1);
    } else if (tipo === 'mecedora') {
      for (const s of [-1, 1]) c.agregar(new THREE.TorusGeometry(0.5, 0.025, 4, 12, Math.PI * 0.5), { color: MADERA_OSCURA, tipo: 0,
        matriz: matriz(en(s * 0.26, PISO + 0.5, 0), [0, g + Math.PI / 2, Math.PI * 1.25]) });
      caja(c, en(0, PISO + 0.42, 0.02), [0.56, 0.05, 0.5], TABLA, g, 0);
      caja(c, en(0, PISO + 0.8, -0.24), [0.56, 0.72, 0.05], TABLA, g, 0);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(c, en(sx * 0.26, PISO + 0.24, sz * 0.2), 0.025, 0.025, 0.36, MADERA, 0, 6);
      caja(c, en(0, PISO + 0.46, 0.04), [0.5, 0.04, 0.44], '#6b4a78', g, 0);
      circulo(duenio, ...loc(0, 0), 0.36, PISO - 0.1, PISO + 1.1);
    } else if (tipo === 'maceta') {
      cil(c, [L.x, PISO + 0.2, L.z], 0.22, 0.16, 0.4, '#9a5a3e', 4, 12);
      cil(c, [L.x, PISO + 0.4, L.z], 0.2, 0.2, 0.03, '#3a2c20', 4, 12);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        c.agregar(new THREE.ConeGeometry(0.06, 0.62, 4), { color: i % 2 ? '#4d6b32' : '#5f8040', tipo: 4, variar: 0.12,
          matriz: matriz([L.x + Math.cos(a) * 0.1, PISO + 0.66, L.z + Math.sin(a) * 0.1], [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55], [1, 1, 0.35]) });
      }
      circulo(duenio, L.x, L.z, 0.24, PISO - 0.1, PISO + 0.8);
    } else if (tipo === 'baul') {
      caja(c, en(0, PISO + 0.24, 0), [0.9, 0.48, 0.5], '#6b4e33', g, 0);
      c.agregar(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 10, 1, false, 0, Math.PI), { color: '#7a5a3a', tipo: 0, variar: 0.08,
        matriz: matriz(en(0, PISO + 0.48, 0), [0, g + Math.PI / 2, Math.PI / 2]) });
      for (const s of [-1, 1]) caja(c, en(s * 0.3, PISO + 0.36, 0), [0.05, 0.62, 0.52], '#3f3830', g, 4);
      caja(c, en(0, PISO + 0.42, 0.26), [0.1, 0.12, 0.02], '#b89a50', g, 4);
      circulo(duenio, ...loc(0, 0), 0.4, PISO - 0.1, PISO + 0.75);
    } else if (tipo === 'perchero') {
      cil(c, [L.x, PISO + 0.85, L.z], 0.03, 0.035, 1.7, MADERA_OSCURA, 0, 6);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; cil(c, [L.x + Math.cos(a) * 0.14, PISO + 0.06, L.z + Math.sin(a) * 0.14], 0.03, 0.03, 0.32, MADERA_OSCURA, 0, 5, [0, -a, Math.PI / 2]); }
      // el poncho colgado: dos paños en V con su franja
      caja(c, [L.x, PISO + 1.18, L.z + 0.06], [0.5, 0.8, 0.05], '#8a2f2a', g, 0);
      caja(c, [L.x, PISO + 0.86, L.z + 0.09], [0.5, 0.08, 0.05], '#1f1a17', g, 0);
      c.agregar(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 8), { color: '#3a2c20', tipo: 0, matriz: matriz([L.x, PISO + 1.72, L.z]) });   // sombrero
      c.agregar(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 12), { color: '#3a2c20', tipo: 0, matriz: matriz([L.x, PISO + 1.68, L.z]) });
      circulo(duenio, L.x, L.z, 0.22, PISO - 0.1, PISO + 1.8);
    } else return null;
    return malla(c, true);
  }

  function armarVentana(tipo) {
    const c = new Constructor();
    const { x, z, y } = LUGAR.ventana;
    caja(c, [x, y - 0.02, z], [1.2, 0.04, 0.2], TABLA, 0, 4);      // el alféizar de adentro
    if (tipo === 'macetas') {
      const flores = ['#c2264b', '#f2a93b', '#8e6bbf'];
      for (let i = 0; i < 3; i++) {
        const px = x - 0.36 + i * 0.36;
        cil(c, [px, y + 0.07, z], 0.07, 0.055, 0.14, '#9a5a3e', 4, 10);
        c.agregar(new THREE.IcosahedronGeometry(0.075, 0), { color: '#4d6b32', tipo: 4, variar: 0.12, matriz: matriz([px, y + 0.18, z], [i, i, 0], [1, 0.7, 1]) });
        for (let j = 0; j < 3; j++) c.agregar(new THREE.IcosahedronGeometry(0.03, 0), { color: flores[i], tipo: 4, variar: 0.08,
          matriz: matriz([px + Math.cos(j * 2.1 + i) * 0.045, y + 0.24, z + Math.sin(j * 2.1 + i) * 0.045]) });
      }
    } else if (tipo === 'frascos') {
      const colores = ['#5f7a86', '#8e9c6a', '#9a6a2c', '#7a4a52', '#6a8a9a'];
      for (let i = 0; i < 5; i++) {
        const px = x - 0.44 + i * 0.22, alto = 0.14 + (i % 3) * 0.04;
        cil(c, [px, y + alto / 2, z], 0.05, 0.05, alto, colores[i], 4, 8);
        cil(c, [px, y + alto + 0.012, z], 0.052, 0.052, 0.025, '#c9bfa6', 4, 8);
      }
    } else if (tipo === 'vela') {
      cil(c, [x, y + 0.02, z], 0.08, 0.09, 0.03, '#3f3830', 4, 10);
      cil(c, [x, y + 0.12, z], 0.035, 0.035, 0.18, '#efe6cf', 4, 8);
      c.agregar(new THREE.ConeGeometry(0.015, 0.05, 5), { color: '#ffcf6a', tipo: 4, variar: 0, matriz: matriz([x, y + 0.24, z]) });
    } else return null;
    return malla(c);
  }

  function armarMesa(tipo) {
    const c = new Constructor();
    const { x, z, y } = LUGAR.mesa;
    if (tipo === 'florero') {
      cil(c, [x, y + 0.11, z], 0.06, 0.08, 0.22, '#35557a', 4, 10);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        cil(c, [x + Math.cos(a) * 0.04, y + 0.3, z + Math.sin(a) * 0.04], 0.006, 0.006, 0.22, '#4d6b32', 4, 4, [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]);
        c.agregar(new THREE.IcosahedronGeometry(0.035, 0), { color: ['#f2a93b', '#c2264b', '#f4f1e6'][i % 3], tipo: 4, variar: 0.08,
          matriz: matriz([x + Math.cos(a) * 0.1, y + 0.41, z + Math.sin(a) * 0.1]) });
      }
    } else if (tipo === 'mate') {
      c.agregar(new THREE.SphereGeometry(0.055, 8, 6), { color: '#6b4e2a', tipo: 4, variar: 0.08, matriz: matriz([x - 0.15, y + 0.05, z], [0, 0, 0], [1, 1.1, 1]) });
      cil(c, [x - 0.13, y + 0.12, z], 0.005, 0.005, 0.12, '#b8b2a6', 4, 4, [0, 0, -0.3]);    // la bombilla
      cil(c, [x + 0.15, y + 0.1, z], 0.09, 0.1, 0.2, '#7a7c7e', 4, 10);                     // la pava
      cil(c, [x + 0.15, y + 0.215, z], 0.045, 0.06, 0.04, '#6a6c6e', 4, 10);
      cil(c, [x + 0.27, y + 0.14, z], 0.012, 0.018, 0.14, '#6a6c6e', 4, 5, [0, 0, -0.9]);  // el pico
    } else if (tipo === 'candil') {
      cil(c, [x, y + 0.02, z], 0.08, 0.09, 0.04, '#3f3830', 4, 10);
      cil(c, [x, y + 0.13, z], 0.055, 0.065, 0.18, '#d8e0e0', 4, 10);
      cil(c, [x, y + 0.24, z], 0.035, 0.03, 0.04, '#3f3830', 4, 8);
    } else if (tipo === 'libros') {
      const tapas = ['#6b2a26', '#2f4a3a', '#3a3f5a', '#7a5a2a'];
      for (let i = 0; i < 4; i++) caja(c, [x, y + 0.025 + i * 0.05, z], [0.26 - i * 0.02, 0.045, 0.19], tapas[i], 0.25 * (i % 2 ? 1 : -1), 4, 0.05);
    } else return null;
    return malla(c);
  }

  const texturas = new Map();
  function texturaFoto(img) {
    if (texturas.has(img)) return texturas.get(img);
    const t = new THREE.TextureLoader().load(img);
    t.colorSpace = THREE.SRGBColorSpace;
    texturas.set(img, t);
    return t;
  }
  function armarCuadro(clave, img) {
    if (!img) return null;
    const L = LUGAR[clave];
    const g = new THREE.Group();
    g.position.set(L.x, L.y, L.z);
    g.rotation.y = L.giro;
    const ancho = 0.62, alto = 0.46;
    const c = new Constructor();
    for (const s of [-1, 1]) {
      caja(c, [0, s * (alto / 2 + 0.04), 0], [ancho + 0.16, 0.08, 0.04], '#6b4e33', 0, 0);
      caja(c, [s * (ancho / 2 + 0.04), 0, 0], [0.08, alto, 0.04], '#6b4e33', 0, 0);
    }
    caja(c, [0, 0, -0.01], [ancho, alto, 0.015], '#e8e2d6', 0, 4, 0.02);   // el paspartú
    g.add(malla(c));
    const lamina = new THREE.Mesh(new THREE.PlaneGeometry(ancho - 0.06, alto - 0.06), new THREE.MeshBasicMaterial({ map: texturaFoto(img) }));
    lamina.position.z = 0.002;
    g.add(lamina);
    return g;
  }

  // ---------------------------------------------------------------- afuera
  function armarFaroles(tipo, duenio) {
    const lugares = FAROLES_EN[tipo];
    if (!lugares) return null;
    const c = new Constructor(), v = new Constructor();
    for (const [lx, lz] of lugares) {
      const s = sueloLocal(lx, lz);
      cil(c, [lx, s + 0.9, lz], 0.05, 0.065, 1.95, MADERA_OSCURA, 0, 7);
      caja(c, [lx, s + 1.82, lz + 0.16], [0.06, 0.06, 0.36], MADERA_OSCURA, 0, 0);
      caja(c, [lx, s + 1.6, lz + 0.3], [0.2, 0.03, 0.2], '#3f3830', 0, 4);
      c.agregar(new THREE.ConeGeometry(0.17, 0.12, 4), { color: '#3f3830', tipo: 4, matriz: matriz([lx, s + 1.8, lz + 0.3], [0, Math.PI / 4, 0]) });
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(c, [lx + dx * 0.09, s + 1.68, lz + 0.3 + dz * 0.09], 0.01, 0.01, 0.16, '#3f3830', 4, 4);
      v.agregar(new THREE.BoxGeometry(0.16, 0.16, 0.16), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([lx, s + 1.69, lz + 0.3]) });
      c.agregar(new THREE.IcosahedronGeometry(0.12, 0), { color: '#77736b', tipo: 4, variar: 0.15, matriz: matriz([lx, s + 0.02, lz], [0, lx, 0], [1.3, 0.5, 1.3]) });
      circulo(duenio, lx, lz, 0.09, s - 0.1, s + 1.95);
    }
    const g = new THREE.Group();
    g.add(malla(c, true));
    const vidrio = new THREE.Mesh(v.geometria(), matVidrio);
    g.add(vidrio);
    return g;
  }

  function armarCerco(tipo, duenio) {
    if (tipo !== 'palos' && tipo !== 'varas' && tipo !== 'pirca') return null;
    const c = new Constructor();
    let k = 0;
    for (const [ax, az, bx, bz] of CERCO_EN) {
      const largo = Math.hypot(bx - ax, bz - az);
      const at = (t) => [ax + (bx - ax) * t, az + (bz - az) * t];
      if (tipo === 'palos') {
        const n = Math.round(largo / 0.15);
        for (let i = 0; i <= n; i++, k++) {
          const [x, z] = at(i / n), s = sueloLocal(x, z), alto = 1.0 + ((k * 37) % 7) * 0.025;
          cil(c, [x, s + alto / 2 - 0.1, z], 0.045, 0.055, alto, k % 3 ? MADERA : MADERA_OSCURA, 0, 6);
          c.agregar(new THREE.ConeGeometry(0.045, 0.1, 6), { color: TABLA, tipo: 0, matriz: matriz([x, s + alto - 0.05, z]) });
        }
        segmento(duenio, ax, az, bx, bz, 0.08, sueloLocal(ax, az) - 0.1, sueloLocal(ax, az) + 1.05);
      } else if (tipo === 'varas') {
        const n = Math.max(2, Math.round(largo / 1.5));
        for (let i = 0; i <= n; i++) { const [x, z] = at(i / n), s = sueloLocal(x, z); cil(c, [x, s + 0.55, z], 0.07, 0.085, 1.25, MADERA_OSCURA, 0, 6); }
        for (let i = 0; i < n; i++) {
          const [x0, z0] = at(i / n), [x1, z1] = at((i + 1) / n);
          const s0 = sueloLocal(x0, z0), s1 = sueloLocal(x1, z1);
          for (const h of [0.5, 0.95]) {
            const dx = x1 - x0, dy = s1 - s0, dz = z1 - z0, l = Math.hypot(dx, dy, dz);
            const geo = new THREE.CylinderGeometry(0.045, 0.05, l, 6);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
            const m = new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, (s0 + s1) / 2 + h, (z0 + z1) / 2), q, new THREE.Vector3(1, 1, 1));
            c.agregar(geo, { color: MADERA, tipo: 0, variar: 0.1, matriz: m });
          }
        }
        segmento(duenio, ax, az, bx, bz, 0.08, sueloLocal(ax, az) - 0.1, sueloLocal(ax, az) + 1.2);
      } else {
        const n = Math.round(largo / 0.4);
        for (let fila = 0; fila < 2; fila++) for (let i = 0; i <= n - fila; i++, k++) {
          const [x, z] = at((i + fila * 0.5) / n), s = sueloLocal(x, z);
          c.agregar(new THREE.IcosahedronGeometry(0.25, 0), { color: ['#7d766c', '#6c665d', '#8a857b', '#77736b'][k % 4], tipo: 4, variar: 0.16,
            matriz: matriz([x + ((k * 7) % 3 - 1) * 0.03, s + 0.12 + fila * 0.3, z], [k * 0.6, k * 1.1, 0.2], [1.1, 0.72, 1.2 - fila * 0.2]) });
        }
        segmento(duenio, ax, az, bx, bz, 0.3, sueloLocal(ax, az) - 0.1, sueloLocal(ax, az) + 0.6);
      }
    }
    return malla(c, true);
  }

  // ---------------------------------------------------------------- el mástil
  // Se arma una vez, al crear el refugio, y se muestra u oculta. `mastil.grupo` cuelga en
  // la punta: ahí va la bandera (personal-bandera.js arma la textura; si trae su malla la
  // cuelga de este grupo, y si no, `mastil.ponerTextura(t)` la pone en el paño de acá).
  const mastil = (() => {
    const { lx, lz, alto } = MASTIL_LOCAL;
    const s = sueloLocal(lx, lz);
    const g = new THREE.Group();
    g.name = 'refugio:mastil';
    const c = new Constructor();
    cil(c, [lx, s + alto / 2 - 0.2, lz], 0.045, 0.075, alto, '#d9d2c2', 4, 8);
    c.agregar(new THREE.SphereGeometry(0.08, 8, 6), { color: '#b89a50', tipo: 4, variar: 0.04, matriz: matriz([lx, s + alto - 0.14, lz]) });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      c.agregar(new THREE.IcosahedronGeometry(0.18, 0), { color: ['#7d766c', '#6c665d', '#8a857b'][i % 3], tipo: 4, variar: 0.15,
        matriz: matriz([lx + Math.cos(a) * 0.26, s + 0.06, lz + Math.sin(a) * 0.26], [i, a, 0], [1.2, 0.65, 1.1]) });
    }
    const palo = malla(c, true);
    g.add(palo);
    const punta = new THREE.Group();
    punta.name = 'refugio:mastil-punta';
    punta.position.set(lx, s + alto - 0.35, lz);
    g.add(punta);
    const matPano = new THREE.MeshLambertMaterial({ color: 0xf2ead8, side: THREE.DoubleSide });
    const pano = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8, 6, 1), matPano);
    pano.name = 'refugio:bandera';
    pano.position.set(0.63, -0.38, 0);
    pano.castShadow = true;
    punta.add(pano);
    grupo.add(g);
    fijar(g);
    const duenio = { deco: 'mastil' };
    const tope = { ...aMundo(lx, lz), y: ref.y + s + alto - 0.35 };
    let fisica = false;
    const api = {
      grupo: punta, bandera: pano, tope, alto,
      get posicion() { return { ...aMundo(lx, lz), y: ref.y + s }; },
      get visible() { return g.visible; },
      mostrar(si) {
        g.visible = !!si;
        if (si && !fisica) { circulo(duenio, lx, lz, 0.12, s - 0.1, s + alto); fisica = true; }
        if (!si && fisica) { col?.eliminarPorDuenio?.(duenio); fisica = false; }
      },
      ponerTextura(t) {
        matPano.map = t || null;
        matPano.color.set(t ? 0xffffff : 0xf2ead8);
        matPano.needsUpdate = true;
      },
    };
    api.mostrar(refugioDefecto().exterior.mastil);
    return api;
  })();

  // ---------------------------------------------------------------- aplicar todo
  // `d`: lo saneado de progreso.personal.refugio. `progreso`: para buscar las fotos.
  function aplicar(d, progreso = null) {
    if (!d || typeof d !== 'object') return;
    pintar(d);
    const i = d.interior || {}, e = d.exterior || {};
    poner('alfombra', i.alfombra, () => (i.alfombra && i.alfombra !== 'nada' ? armarAlfombra(i.alfombra) : null));
    poner('rincon', i.rincon, (du) => armarRincon(i.rincon, LUGAR.rincon, du));
    poner('rinconPuerta', i.rinconPuerta, (du) => armarRincon(i.rinconPuerta, LUGAR.rinconPuerta, du));
    poner('ventana', i.ventana, () => armarVentana(i.ventana));
    poner('mesa', i.mesa, () => armarMesa(i.mesa));
    for (const clave of ['cuadroCostado', 'cuadroCama']) {
      const id = i[clave];
      const foto = id && progreso?.desafios && Object.hasOwn(progreso.desafios, id) ? progreso.desafios[id] : null;
      const img = typeof foto?.img === 'string' && /^data:image\//.test(foto.img) ? foto.img : null;
      poner(clave, img ? `${id}|${img.length}` : '', () => armarCuadro(clave, img));
    }
    poner('faroles', e.faroles, (du) => armarFaroles(e.faroles, du));
    poner('cerco', e.cerco, (du) => armarCerco(e.cerco, du));
    mastil.mostrar(e.mastil !== false);
  }

  // Para las pruebas y la depuración: qué quedó puesto.
  function estado() {
    const puesto = {};
    for (const [k, p] of puestos) puesto[k] = { firma: p.firma, visible: !!p.obj };
    return { pintura: firmaPintura, pintado: !!original, puesto, mastil: mastil.visible, hijos: grupo.children.length };
  }

  return { grupo, aplicar, estado, mastil, lugares: LUGAR };
}
