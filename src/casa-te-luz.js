// 4.0 (prototipo) · LA LUZ DE LA CASA DE TÉ: lo que hace que el interior se lea como la referencia (faroles encendidos con halo, el fuego del hogar,
// charcos de luz cálida en el piso y las mesas, ventanas con el paisaje de afuera y el sol que entra) SIN luces dinámicas nuevas: el motor sigue con sus
// luces fijas (src/luces.js). Todo es geometría emisiva y mallas aditivas baratas, de pocos dibujos:
//   · `emisivo`  (vidrio de los faroles y llamas de las velas: MeshBasicMaterial con color de vértice y brillo mayor a 1, que el bloom levanta)
//   · `fuego`    (las llamas y brasas del hogar: aparte, para que titilen sin mover los faroles)
//   · `halos`    (un solo dibujo: halos que miran a la cámara, de los faroles, el hogar y los dos de la galería; se ven desde afuera de noche)
//   · `charcos`  (charcos de luz aditivos en el piso y sobre las mesas bajo cada farol, y el del hogar)
//   · `sol`      (de día: los rectángulos de sol de las dos ventanas en el piso y los dos haces)
//   · `paisaje`  (los dos ventanales vistos desde adentro: montañas, pinos y pradera pintados por código, que se oscurecen de noche)
// Marco local del edificio (el de estructuras.js): +z la puerta, piso en y = F. Sin textos. Módulo de render: no se prueba en Node.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';

const F = 0.38;

// ---------------------------------------------------------------- texturas pintadas por código
export function lienzo(ancho, alto, dibujar, srgb = true) {
  const l = document.createElement('canvas'); l.width = ancho; l.height = alto;
  dibujar(l.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(l);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function azar(semilla) { let s = semilla >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// el paisaje del ventanal: cielo de tarde despejada, picos con nieve, lomas, pinos, la pradera con lupinos y una cerca
function pintarPaisaje(x, w, h) {
  const r = azar(7);
  const cielo = x.createLinearGradient(0, 0, 0, h * 0.62);
  cielo.addColorStop(0, '#6fa6dc'); cielo.addColorStop(0.55, '#a9d0ea'); cielo.addColorStop(1, '#f2e6c2');
  x.fillStyle = cielo; x.fillRect(0, 0, w, h);
  const sol = x.createRadialGradient(w * 0.78, h * 0.34, 0, w * 0.78, h * 0.34, h * 0.5);
  sol.addColorStop(0, 'rgba(255,244,205,0.95)'); sol.addColorStop(1, 'rgba(255,244,205,0)');
  x.fillStyle = sol; x.fillRect(0, 0, w, h);
  // nubes largas
  x.fillStyle = 'rgba(255,255,255,0.55)';
  for (const [cx, cy, ax] of [[0.2, 0.16, 0.2], [0.55, 0.1, 0.16], [0.85, 0.22, 0.12]]) { x.beginPath(); x.ellipse(w * cx, h * cy, w * ax, h * 0.03, 0, 0, 7); x.fill(); }
  // las montañas del fondo, con la nieve y la cara en sombra
  const picos = [[0.0, 0.5], [0.12, 0.4], [0.24, 0.27], [0.33, 0.37], [0.46, 0.2], [0.58, 0.36], [0.7, 0.3], [0.84, 0.42], [1.0, 0.36]];
  x.fillStyle = '#8397c4'; x.beginPath(); x.moveTo(0, h * 0.62);
  for (const [px, py] of picos) x.lineTo(w * px, h * py);
  x.lineTo(w, h * 0.62); x.closePath(); x.fill();
  x.fillStyle = '#f4f5fb';
  for (const [px, py] of picos) { if (py > 0.3) continue; x.beginPath(); x.moveTo(w * px, h * py); x.lineTo(w * (px - 0.05), h * (py + 0.1)); x.lineTo(w * (px - 0.02), h * (py + 0.075)); x.lineTo(w * px, h * (py + 0.115)); x.lineTo(w * (px + 0.025), h * (py + 0.07)); x.lineTo(w * (px + 0.055), h * (py + 0.1)); x.closePath(); x.fill(); }
  x.fillStyle = 'rgba(80,92,150,0.35)';
  for (const [px, py] of picos) { if (py > 0.3) continue; x.beginPath(); x.moveTo(w * px, h * py); x.lineTo(w * (px + 0.055), h * (py + 0.12)); x.lineTo(w * px, h * (py + 0.12)); x.closePath(); x.fill(); }
  // lomas y la bruma de abajo
  x.fillStyle = '#6e9a68'; x.beginPath(); x.moveTo(0, h * 0.7); x.bezierCurveTo(w * 0.25, h * 0.52, w * 0.5, h * 0.64, w * 0.72, h * 0.54); x.bezierCurveTo(w * 0.85, h * 0.5, w * 0.95, h * 0.58, w, h * 0.56); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
  const bruma = x.createLinearGradient(0, h * 0.5, 0, h * 0.68); bruma.addColorStop(0, 'rgba(235,240,230,0)'); bruma.addColorStop(1, 'rgba(235,240,230,0.5)');
  x.fillStyle = bruma; x.fillRect(0, h * 0.5, w, h * 0.2);
  // el pinar: tres hileras, de lo lejano y claro a lo cercano y oscuro
  const pino = (px, base, alto, ancho, c1, c2) => {
    x.fillStyle = c1; x.beginPath(); x.moveTo(px, base - alto); x.lineTo(px - ancho, base); x.lineTo(px + ancho, base); x.closePath(); x.fill();
    x.fillStyle = c2; x.beginPath(); x.moveTo(px, base - alto); x.lineTo(px + ancho, base); x.lineTo(px + ancho * 0.1, base); x.closePath(); x.fill();
  };
  for (let i = 0; i < 26; i++) pino(r() * w, h * (0.66 + r() * 0.04), h * (0.13 + r() * 0.06), w * (0.02 + r() * 0.012), '#4a7a58', '#3a6448');
  for (let i = 0; i < 16; i++) pino(r() * w, h * (0.74 + r() * 0.05), h * (0.2 + r() * 0.1), w * (0.03 + r() * 0.015), '#2f6246', '#244e38');
  for (const px of [0.05, 0.2, 0.9]) pino(w * px, h * 0.86, h * (0.42 + r() * 0.08), w * 0.055, '#235238', '#183c2a');
  // la pradera, las flores y la cerca
  const pradera = x.createLinearGradient(0, h * 0.78, 0, h); pradera.addColorStop(0, '#8fb450'); pradera.addColorStop(1, '#6a9a3c');
  x.fillStyle = pradera; x.fillRect(0, h * 0.8, w, h * 0.2);
  for (let i = 0; i < 70; i++) { x.fillStyle = ['#8a5ac8', '#d8c3ee', '#f0ede0', '#e8c84a'][i % 4]; x.fillRect(r() * w, h * (0.84 + r() * 0.15), 2.5, 4 + r() * 4); }
  x.fillStyle = '#7a5836'; for (let px = 0; px < w; px += w / 9) x.fillRect(px, h * 0.8, 4, h * 0.14);
  x.fillRect(0, h * 0.84, w, 3); x.fillRect(0, h * 0.89, w, 3);
}
// un charco de luz: blanco al centro y negro afuera (se suma a lo que hay)
export function pintarCharco(x, w, h) {
  const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#b8b8b8'); g.addColorStop(0.55, '#4a4a4a'); g.addColorStop(1, '#000000');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}
// el rectángulo de sol de una ventana con su travesaño: dos paños claros con los bordes suaves
function pintarSol(x, w, h) {
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.filter = 'blur(4px)'; x.fillStyle = '#fff';
  x.fillRect(w * 0.1, h * 0.12, w * 0.37, h * 0.76); x.fillRect(w * 0.53, h * 0.12, w * 0.37, h * 0.76);
}
// un haz: claro al medio y negro en los costados
function pintarHaz(x, w, h) {
  const g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#000'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------- piezas
// el material de los halos (un cuadrado que mira a la cámara, aditivo): lo usan la casa de té y la aldea de noche (aldea-noche-luz.js)
export function crearMaterialHalo() {
  const uniforms = { uBrillo: { value: 0 }, uEnc: { value: 0 }, uTiempo: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.6, 0.26) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `
      attribute vec2 esq; attribute vec3 par;
      uniform float uTiempo;
      varying vec2 vE; varying float vF; varying float vD; varying float vN;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        if (mv.z > -0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vE = vec2(2.0); vF = 0.0; vD = 0.0; vN = 0.0; return; }   // detrás de la cámara: afuera
        float f = 1.0 + par.y * (0.07 * sin(uTiempo * 7.0 + position.x * 13.0 + position.z * 5.0) + 0.05 * sin(uTiempo * 12.3 + position.z * 9.0));
        mv.xy += esq * par.x * f;
        gl_Position = projectionMatrix * mv;
        vE = esq; vF = f; vD = -mv.z; vN = par.z;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uBrillo; uniform float uEnc;
      varying vec2 vE; varying float vF; varying float vD; varying float vN;
      void main() {
        float r = length(vE);
        if (r >= 1.0) discard;
        float a = pow(1.0 - r, 2.4);
        float nucleo = exp(-r * r * 22.0);
        float cerca = smoothstep(0.3, 1.4, vD);
        gl_FragColor = vec4(uColor * (a * 0.36 + nucleo * 0.6) * mix(uBrillo, uEnc * 0.9, vN) * vF * cerca, 1.0);
      }`,
  });
  return { mat, uniforms };
}
// un cuadrado en el aire, para los halos: 4 vértices con la misma posición y la esquina que se abre en el shader
function agregarHalo(P, E, A, [x, y, z], radio, fluctua, soloNoche) {
  for (const [ex, ey] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x, y, z); E.push(ex, ey); A.push(radio, fluctua, soloNoche ? 1 : 0); }
}
export function geoHalos(lista) {
  const P = [], E = [], A = [], I = [];
  for (const h of lista) { const b = P.length / 3; agregarHalo(P, E, A, h.pos, h.radio, h.fluctua, h.soloNoche); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('esq', new THREE.Float32BufferAttribute(E, 2));
  g.setAttribute('par', new THREE.Float32BufferAttribute(A, 3));
  g.setIndex(I);
  return g;
}
// un cuadrado plano con uv y color de vértice (charcos y haces): `pts` = 4 puntos en el orden de las esquinas del uv
export function geoPlano(quads) {
  const P = [], U = [], C = [], I = [];
  for (const q of quads) {
    const b = P.length / 3;
    q.pts.forEach((p, i) => { P.push(...p); U.push([0, 0, 1, 0, 1, 1, 0, 1][i * 2], [0, 0, 1, 0, 1, 1, 0, 1][i * 2 + 1]); C.push(...(q.cols ? q.cols[i] : q.col)); });
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I);
  return g;
}
const suelo = (cx, cz, ax, az, y) => [[cx - ax, y, cz + az], [cx + ax, y, cz + az], [cx + ax, y, cz - az], [cx - ax, y, cz - az]];   // visto desde arriba (la cara mira a +y)

// ---------------------------------------------------------------- el armado
// `H`: alto de las paredes; `D`: fondo. Devuelve { grupo (todo lo de adentro), halos (la malla de halos, para mostrarla desde más lejos), farolesColgados,
// farolesMesa, geoFarol(c) (agrega la parte de hierro de un farol al constructor del edificio) y actualizar(e) }
export function crearLuzCasaTe({ W, D, H }) {
  const grupo = new THREE.Group(); grupo.name = 'luz-casa-te';
  const colgados = [[-1.3, 1.0], [1.3, 1.0], [0, -0.4]];
  const yFarol = H - 0.42;
  // los dos faroles de mesa: a un costado del servicio de cada mesa del salón, del lado de las ventanas
  const deMesa = [{ x: -1.5, z: 1.3, y: F + 0.78 }, { x: 1.5, z: 1.3, y: F + 0.78 }];
  const gal = [[-1.9, D / 2 + 1.4], [1.9, D / 2 + 1.4]].map(([x, z]) => ({ x, z, y: 2.55 + (z - (D / 2 + 1.5)) * 0.12 - 0.06 - 0.41 }));
  const hogar = { x: -3.06 + 0.24, y: F + 0.38, z: -1.2 };

  // ---- el vidrio de los faroles y las velas (emisivo)
  const ce = new Constructor();
  const vidrioFarol = (x, y, z, r, alto) => {
    ce.agregar(new THREE.CylinderGeometry(r * 1.08, r * 0.86, alto, 8), { color: '#ffb859', tipo: 0, variar: 0, matriz: matriz([x, y, z]) });
    ce.agregar(new THREE.SphereGeometry(r * 0.5, 8, 6), { color: '#fff2c4', tipo: 0, variar: 0, matriz: matriz([x, y - alto * 0.12, z]) });
  };
  for (const [x, z] of colgados) vidrioFarol(x, yFarol, z, 0.085, 0.21);
  for (const m of deMesa) vidrioFarol(m.x, m.y + 0.085, m.z, 0.04, 0.12);
  // las dos velas de la repisa del hogar
  for (const dz of [-0.7, 0.7]) ce.agregar(new THREE.ConeGeometry(0.012, 0.045, 6), { color: '#ffd37a', tipo: 0, variar: 0, matriz: matriz([-3.06 + 0.3, F + 2.0, -1.2 + dz]) });
  const matEmisivo = new THREE.MeshBasicMaterial({ vertexColors: true });
  const geoEmisivo = ce.geometria(); geoEmisivo.deleteAttribute('aTipo');   // (sin `aTipo`: no es del material del edificio, no se viste con el de la aldea)
  const emisivo = new THREE.Mesh(geoEmisivo, matEmisivo); emisivo.name = 'faroles-encendidos'; grupo.add(emisivo);

  // ---- el fuego del hogar
  const cf = new Constructor();
  const llama = (dx, dz, alto, r, col) => cf.agregar(new THREE.ConeGeometry(r, alto, 6), { color: col, tipo: 0, variar: 0, matriz: matriz([hogar.x + dx, F + 0.12 + alto / 2, hogar.z + dz]) });
  llama(0.0, 0.0, 0.46, 0.1, '#ff9a3a'); llama(0.02, -0.17, 0.34, 0.075, '#ff7a28'); llama(0.02, 0.17, 0.36, 0.08, '#ff8a30'); llama(-0.04, 0.06, 0.28, 0.06, '#ffd070'); llama(0.0, -0.08, 0.2, 0.045, '#fff0b0');
  for (let i = 0; i < 6; i++) cf.agregar(new THREE.BoxGeometry(0.11, 0.05, 0.11), { color: i % 3 ? '#ff6a24' : '#ffa23c', tipo: 0, variar: 0, matriz: matriz([-3.06 + 0.2 + (i % 2) * 0.1, F + 0.15, -1.2 - 0.3 + i * 0.12], [0, i, 0]) });
  const matFuego = new THREE.MeshBasicMaterial({ vertexColors: true });
  const geoFuego = cf.geometria(); geoFuego.deleteAttribute('aTipo');
  const fuego = new THREE.Mesh(geoFuego, matFuego); fuego.name = 'fuego-hogar'; grupo.add(fuego);

  // ---- los halos (un dibujo): cada farol, el fuego y los de la galería
  const lista = [];
  for (const [x, z] of colgados) lista.push({ pos: [x, yFarol, z], radio: 0.95, fluctua: 0.35 });
  for (const m of deMesa) lista.push({ pos: [m.x, m.y + 0.09, m.z], radio: 0.4, fluctua: 0.5 });
  lista.push({ pos: [hogar.x, hogar.y + 0.1, hogar.z], radio: 1.45, fluctua: 1 });
  const nInt = lista.length;
  for (const g of gal) lista.push({ pos: [g.x, g.y, g.z], radio: 0.85, fluctua: 0.3 });
  // la luz que sale por los dos ventanales hacia afuera (sólo de noche, y cuando el alumbrado está prendido)
  for (const vx of [-1.36, 1.36]) lista.push({ pos: [vx, 1.55, D / 2 + 0.15], radio: 1.25, fluctua: 0.15, soloNoche: true });
  const { mat: matHalo, uniforms: uHalo } = crearMaterialHalo();
  const halos = new THREE.Mesh(geoHalos(lista), matHalo); halos.name = 'halos-casa-te'; halos.frustumCulled = false; halos.renderOrder = 3;
  // (los halos de la galería son los últimos: el dibujo entero se muestra desde más lejos que el resto)

  // ---- los charcos de luz (piso, mesas y hogar)
  const cCar = [];
  const calido = [1.0, 0.6, 0.27];
  for (const [x, z] of colgados) {
    cCar.push({ pts: suelo(x, z, 1.5, 1.5, F + 0.034), col: [1.0, 0.5, 0.2].map((v) => v * 0.3) });
    if (z === 1.0) cCar.push({ pts: suelo(x, z, 0.58, 0.58, F + 0.796), col: calido.map((v) => v * 0.62) });
  }
  for (const m of deMesa) cCar.push({ pts: suelo(m.x, m.z, 0.3, 0.3, F + 0.8), col: calido.map((v) => v * 0.9) });
  cCar.push({ pts: suelo(-3.06 + 1.2, -1.2, 1.5, 1.35, F + 0.036), col: [1.0, 0.42, 0.14].map((v) => v * 0.9) });
  const texCharco = lienzo(128, 128, pintarCharco, false);
  const matCharco = new THREE.MeshBasicMaterial({ map: texCharco, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const charcos = new THREE.Mesh(geoPlano(cCar), matCharco); charcos.name = 'charcos-de-luz'; charcos.renderOrder = 2; grupo.add(charcos);

  // ---- el sol que entra por las dos ventanas (de día) y los ventanales vistos desde adentro
  const cSol = [], cHaz = [];
  const zV = D / 2 - 0.12;
  for (const vx of [-1.36, 1.36]) {
    // el rectángulo en el piso: el sol viene algo de costado (desplazado hacia la puerta)
    const px0 = vx + 0.45, zA = zV - 0.1, zB = zV - 1.55;
    cSol.push({ pts: [[px0 - 0.72, F + 0.04, zA], [px0 + 0.72, F + 0.04, zA], [px0 + 0.72, F + 0.04, zB], [px0 - 0.72, F + 0.04, zB]], col: [1.0, 0.86, 0.55] });
    // los dos haces, uno detrás del otro, del marco de arriba al charco
    for (const k of [0, 1]) {
      const a = [vx - 0.66, F + 2.02, zV], b = [vx + 0.66, F + 2.02, zV];
      const c2 = [px0 + 0.66 + k * 0.05, F + 0.05, zB], d = [px0 - 0.66 + k * 0.05, F + 0.05, zB];
      cHaz.push({ pts: [d, c2, b, a], cols: [[0.1, 0.085, 0.05], [0.1, 0.085, 0.05], [0.55, 0.47, 0.28], [0.55, 0.47, 0.28]].map((c) => c.map((v) => v * (k ? 0.7 : 1))) });
    }
  }
  const matSol = new THREE.MeshBasicMaterial({ map: lienzo(128, 128, pintarSol, false), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const sol = new THREE.Mesh(geoPlano(cSol), matSol); sol.name = 'sol-en-el-piso'; sol.renderOrder = 2; grupo.add(sol);
  const matHaz = new THREE.MeshBasicMaterial({ map: lienzo(64, 8, pintarHaz, false), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const haces = new THREE.Mesh(geoPlano(cHaz), matHaz); haces.name = 'haces-de-sol'; haces.renderOrder = 2; grupo.add(haces);

  const texPaisaje = lienzo(512, 348, pintarPaisaje);
  const matPaisaje = new THREE.MeshBasicMaterial({ map: texPaisaje, color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const gp = new THREE.PlaneGeometry(1.4, 0.95);
  gp.rotateY(Math.PI);
  const posP = gp.attributes.position.array, uvP = gp.attributes.uv.array, idxP = gp.index.array;
  const PP = [], UU = [], II = [];
  [-1.36, 1.36].forEach((vx, k) => {
    for (let i = 0; i < posP.length; i += 3) PP.push(posP[i] + vx, posP[i + 1] + 1.55, posP[i + 2] + D / 2 - 0.03);
    for (let i = 0; i < uvP.length; i++) UU.push(uvP[i]);
    for (const j of idxP) II.push(j + k * 4);
  });
  const gPais = new THREE.BufferGeometry();
  gPais.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3));
  gPais.setAttribute('uv', new THREE.Float32BufferAttribute(UU, 2));
  gPais.setIndex(II); gPais.computeVertexNormals();
  const paisaje = new THREE.Mesh(gPais, matPaisaje); paisaje.name = 'ventanales-paisaje'; grupo.add(paisaje);

  const cielo = new THREE.Color(), tinte = new THREE.Color(), NOCHE_VENTANA = new THREE.Color(0.05, 0.08, 0.19), CALIDO_INT = new THREE.Color(1.0, 0.8, 0.52);
  let destello = 0;
  // `e`: { noche (0 a 1, lo oscuro que está), enc (0 a 1, qué tan prendido el alumbrado, con la noche), dia (luz del día 0 a 1), nublado, cielo (Color del horizonte),
  //        tiempo, cerca (a menos de ~24 m), lejos (a menos de ~45 m), pleno (calidad con post: halos, charcos y haces), interior (la luz de relleno del edificio) }
  function actualizar(e) {
    grupo.visible = e.cerca;
    halos.visible = e.lejos && e.pleno && (e.enc > 0.02 || e.cerca);
    if (!e.lejos) return;
    const enc = e.enc, dia = e.dia;
    // titileo del fuego y respiración de los faroles (suave, sin saltos)
    const t = e.tiempo;
    destello = 0.86 + 0.08 * Math.sin(t * 9.1) + 0.06 * Math.sin(t * 15.7 + 1.3) + 0.04 * Math.sin(t * 23.3 + 0.4);
    const kFarol = 1.25 + 1.55 * enc;
    matEmisivo.color.setScalar(kFarol);
    matFuego.color.setScalar((1.5 + 1.2 * enc) * destello);
    uHalo.uBrillo.value = (0.28 + 0.8 * enc) * (e.pleno ? 1 : 0) * (0.9 + 0.1 * destello);
    uHalo.uTiempo.value = t; uHalo.uEnc.value = enc * (e.pleno ? 1 : 0);
    // charcos: más presentes de noche, apenas de día
    const kc = 0.2 + 0.36 * enc;
    matCharco.color.setScalar(kc * (0.9 + 0.1 * destello));
    charcos.visible = e.pleno;
    // el sol entra de día y despejado
    const sx = dia * (1 - e.nublado * 0.85) * (1 - enc);
    sol.visible = haces.visible = e.pleno && sx > 0.03;
    matSol.color.setScalar(0.75 * sx); matHaz.color.setScalar(0.3 * sx);
    // los ventanales: el color del horizonte de día; de noche, azul de luna
    cielo.copy(e.cielo);
    tinte.setRGB(0.55 + cielo.r * 0.8, 0.55 + cielo.g * 0.8, 0.55 + cielo.b * 0.8).multiplyScalar(1.05 + 0.25 * dia).lerp(NOCHE_VENTANA, Math.min(1, enc * 1.1));
    matPaisaje.color.copy(tinte);
    // el relleno del interior: de día el cielo, de noche el calor de los faroles; el amarillo de la madera sube todo el tiempo (la referencia es dorada)
    // (el ámbar rinde menos luz que el blanco del cielo: se sube un poco la intensidad para que el interior y la galería no pierdan brillo)
    if (e.interior) { e.interior.color.lerp(CALIDO_INT, 0.48 + 0.4 * enc); e.interior.intensity *= 1.16; }
  }
  return { grupo, halos, nInt, farolesColgados: colgados, farolesMesa: deMesa, farolesGaleria: gal, actualizar };
}

// la parte de hierro de un farol colgado y de uno de mesa, para el constructor iluminado del edificio (el vidrio y su luz son de `crearLuzCasaTe`)
export function ferreteriaFarolColgado(c, cil, x, z, H) {
  const HIERRO = '#2f2b27', LATON = '#8a6a30';
  cil(0.006, 0.3, [x, H - 0.21, z], HIERRO);                                   // la cadena
  c.agregar(new THREE.CylinderGeometry(0.02, 0.16, 0.085, 8), { color: HIERRO, tipo: 4, matriz: matriz([x, H - 0.26, z]), variar: 0.04 });   // el sombrerete
  cil(0.012, 0.03, [x, H - 0.31, z], LATON);
  cil(0.125, 0.025, [x, H - 0.305, z], HIERRO);                                  // el aro de arriba
  cil(0.105, 0.03, [x, H - 0.545, z], HIERRO);                                   // la base
  c.agregar(new THREE.SphereGeometry(0.022, 6, 5), { color: LATON, tipo: 4, matriz: matriz([x, H - 0.585, z]), variar: 0.04 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cil(0.008, 0.25, [x + sx * 0.102, H - 0.425, z + sz * 0.102], HIERRO);   // los cuatro montantes
}
export function ferreteriaFarolMesa(c, cil, x, y, z) {
  const HIERRO = '#2f2b27';
  cil(0.052, 0.015, [x, y + 0.008, z], HIERRO);
  cil(0.046, 0.012, [x, y + 0.162, z], HIERRO);
  c.agregar(new THREE.CylinderGeometry(0.012, 0.05, 0.04, 8), { color: HIERRO, tipo: 4, matriz: matriz([x, y + 0.18, z]), variar: 0.04 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cil(0.005, 0.15, [x + sx * 0.042, y + 0.088, z + sz * 0.042], HIERRO);
  cil(0.004, 0.06, [x, y + 0.225, z], HIERRO);
}
