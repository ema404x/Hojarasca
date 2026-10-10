// Cosas para encontrar, anotar y juntar; y qué se puede hacer con lo que tenés adelante
import * as THREE from 'three';
import { rng, smoothstep } from './ruido.js';
import { Constructor, matriz, abollar, lamina, troncoCurvo } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { ENTRADA } from './cuaderno.js';
import { LAGO } from './config.js';
import { MELODIAS, MELODIA, anotarPartitura, tocadiscos, tocadiscosSuena, sanearMusica, disponibles, siguienteDisco, escucharMuestra } from './personal-musica.js';
import { crearTocadiscos } from './tocadiscos-mundo.js';

const NOMBRE_ESPECIE = { coihue: 'coihue', lenga: 'lenga', cipres: 'ciprés', arrayan: 'arrayán', pehuen: 'pehuén', nire: 'ñire', maiten: 'maitén' };
const NOMBRE_PLANTA = { helecho: 'helecho', nalca: 'nalca', colihue: 'caña colihue', chilco: 'chilco', notro: 'notro', maqui: 'maqui', chaura: 'chaura', coiron: 'coirón', neneo: 'neneo' };

function geoAmancay() {
  const c = new Constructor(), r = rng(11);
  for (let i = 0; i < 4; i++) {
    const ang = r() * 6.28, d = r() * 0.25, alto = 0.45 + r() * 0.3;
    const x = Math.cos(ang) * d, z = Math.sin(ang) * d;
    c.agregar(troncoCurvo(alto, 0.012, 0.01, [r() * 0.1, r() * 0.1], 4, 2), { color: '#4f6b2a', tipo: 3, matriz: matriz([x, 0, z]) });
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * 6.28;
      c.agregar(lamina(0.09, 0.05, 0.4, 2), { color: p % 2 ? '#d9791b' : '#dea024', tipo: 3, matriz: matriz([x, alto, z], [-0.7, a, 0]) });
    }
    c.agregar(lamina(0.3, 0.05, 0.2, 3), { color: '#4f7a2c', tipo: 3, matriz: matriz([x, 0.02, z], [-0.5, r() * 6, 0]) });
  }
  return c.geometria();
}
function geoFrutilla() {
  const c = new Constructor(), r = rng(12);
  for (let i = 0; i < 6; i++) c.agregar(new THREE.CircleGeometry(0.07, 7), { color: '#3f6a26', tipo: 3, matriz: matriz([Math.cos(i) * 0.1, 0.06 + r() * 0.04, Math.sin(i) * 0.1], [-1.2, i, 0]) });
  for (let i = 0; i < 4; i++) c.agregar(new THREE.IcosahedronGeometry(0.025, 0), { color: '#d9261c', tipo: 3, matriz: matriz([(r() - 0.5) * 0.2, 0.04, (r() - 0.5) * 0.2], [0, 0, 0], [1, 1.25, 1]) });
  return c.geometria();
}
function geoCalafate() {
  const c = new Constructor(), r = rng(13);
  for (let i = 0; i < 14; i++) c.agregar(new THREE.IcosahedronGeometry(0.03, 0), { color: i % 3 ? '#2f2d5a' : '#3d3a6e', tipo: 3, matriz: matriz([(r() - 0.5) * 0.35, (r() - 0.5) * 0.25, (r() - 0.5) * 0.35]) });
  return c.geometria();
}
function geoLlaollao() {
  const c = new Constructor(), r = rng(14);
  for (let i = 0; i < 5; i++) c.agregar(abollar(new THREE.IcosahedronGeometry(0.045 + r() * 0.03, 1), 0.012, 60), { color: '#e59a3a', tipo: 4, variar: 0.2, matriz: matriz([(r() - 0.5) * 0.18, (r() - 0.5) * 0.3, r() * 0.05]) });
  return c.geometria();
}
function geoPinon() {
  const c = new Constructor(), r = rng(15);
  for (let i = 0; i < 6; i++) c.agregar(new THREE.IcosahedronGeometry(0.025, 0), { color: '#7a4a28', tipo: 4, matriz: matriz([(r() - 0.5) * 0.25, 0.015, (r() - 0.5) * 0.25], [r(), r() * 6, 0], [0.7, 0.6, 2]) });
  return c.geometria();
}
function geoPluma() {
  const c = new Constructor();
  c.agregar(lamina(0.22, 0.05, 0.05, 4, true), { color: '#3f8a3a', tipo: 3, matriz: matriz([0, 0.02, -0.1], [-0.05, 0, 0]) });
  c.agregar(lamina(0.07, 0.035, 0.0, 2, true), { color: '#a03a28', tipo: 3, matriz: matriz([0, 0.021, 0.1], [0, 0, 0]) });
  return c.geometria();
}
function geoCanto() {
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.11, 1), { color: '#8a8780', tipo: 4, variar: 0.15, matriz: matriz([0, 0.05, 0], [0, 0, 0], [1.2, 0.55, 0.9]) });
  return c.geometria();
}
function geoRamita() {
  const c = new Constructor();
  c.agregar(troncoCurvo(0.7, 0.025, 0.012, [0.1, 0], 5, 3), { color: '#6b5238', tipo: 4, matriz: matriz([0, 0.03, -0.35], [Math.PI / 2, 0, 0]) });
  c.agregar(troncoCurvo(0.22, 0.012, 0.006, [0, 0], 4, 1), { color: '#6b5238', tipo: 4, matriz: matriz([0, 0.03, 0.05], [Math.PI / 2, 0.6, 0]) });
  return c.geometria();
}

// 2.8: una partitura en el suelo, con una piedra encima para que no se la lleve el viento
function geoPartitura() {
  const c = new Constructor(), r = rng(16);
  c.agregar(new THREE.BoxGeometry(0.21, 0.004, 0.29), { color: '#ece4cf', tipo: 4, variar: 0.04, matriz: matriz([0, 0.012, 0]) });
  // dos pentagramas con algunas notas
  for (const z0 of [-0.08, 0.05]) {
    for (let i = 0; i < 5; i++) c.agregar(new THREE.BoxGeometry(0.17, 0.002, 0.0035), { color: '#3a332b', tipo: 4, variar: 0, matriz: matriz([0, 0.0145, z0 + i * 0.011]) });
    for (let k = 0; k < 6; k++) c.agregar(new THREE.BoxGeometry(0.01, 0.003, 0.008), { color: '#2a2521', tipo: 4, variar: 0, matriz: matriz([-0.07 + k * 0.028, 0.0155, z0 + Math.floor(r() * 9) * 0.0055]) });
  }
  c.agregar(new THREE.IcosahedronGeometry(0.045, 0), { color: '#8a8378', tipo: 4, variar: 0.1, matriz: matriz([0.075, 0.03, -0.115], [0.3, 0.5, 0], [1.2, 0.7, 1]) });
  return c.geometria();
}

export function crearObjetos(T, veg, est, escena, progreso, edificios = []) {
  const r = rng(4040);
  const mat = materialVegetal({ flex: 2 });
  const tipos = {
    amancay: { geo: geoAmancay(), entrada: 'amancay', accion: 'anotar', etiqueta: 'amancay' },
    frutilla: { geo: geoFrutilla(), entrada: 'frutilla', accion: 'juntar', etiqueta: 'frutillas' },
    calafate: { geo: geoCalafate(), entrada: 'calafate', accion: 'juntar', etiqueta: 'frutos de calafate' },
    // 2.1: una vez anotado, el llao llao también se junta, para secarlo en el tendal
    llaollao: { geo: geoLlaollao(), entrada: 'llaollao', accion: 'anotar', etiqueta: 'llao llao', juntableTrasAnotar: true },
    pinon: { geo: geoPinon(), entrada: 'pinon', accion: 'juntar', etiqueta: 'piñones' },
    pluma: { geo: geoPluma(), entrada: 'pluma', accion: 'juntar', etiqueta: 'pluma' },
    canto: { geo: geoCanto(), entrada: 'canto', accion: 'juntar', etiqueta: 'canto rodado' },
    ramita: { geo: geoRamita(), entrada: null, accion: 'juntar', etiqueta: 'ramita' },
    // 2.8: las melodías para el tocadiscos (ver `personal-musica.js`)
    partitura: { geo: geoPartitura(), entrada: null, accion: 'juntar', etiqueta: 'partitura' },
  };
  const items = [];
  const poner = (tipo, x, z, y, rotY = r() * 6.28, esc = 1) => {
    if (T.distRiel[T.indice(x, z)] < 2.2) return;   // entre los rieles no queda nada
    if (y === undefined && T.agua(x, z)) return;    // ni bajo el agua
    if (edificios.some((b) => Math.hypot(b.x - x, b.z - z) < (b.radio || 4) + 1)) return;   // ni adentro de las casas
    if (y === undefined) { if (T.agua(x, z)) return; y = T.altura(x, z); }
    items.push({ tipo, x, y, z, rotY, esc });
  };

  const intentos = (n, fn) => { for (let i = 0; i < n; i++) fn(); };
  const punto = () => [(r() * 2 - 1) * 460, (r() * 2 - 1) * 460];

  // amancay en claros, en manchones
  intentos(90, () => {
    const [cx, cz] = punto();
    const k = T.indice(cx, cz);
    if (T.bosque[k] > 0.25 || T.pasto[k] < 0.4 || T.altura(cx, cz) < 1) return;
    for (let i = 0; i < 4; i++) poner('amancay', cx + (r() - 0.5) * 6, cz + (r() - 0.5) * 6, undefined, r() * 6, 0.8 + r() * 0.5);
  });
  // frutillas al borde del sendero
  for (let i = 0; i < T.sendero.length; i += 9) {
    if (r() > 0.4) continue;
    const p = T.sendero[i], lado = r() < 0.5 ? -1 : 1;
    const q = T.sendero[(i + 1) % T.sendero.length];
    const tx = q.x - p.x, tz = q.z - p.z, l = Math.hypot(tx, tz) || 1;
    poner('frutilla', p.x - (tz / l) * lado * (2.4 + r()), p.z + (tx / l) * lado * (2.4 + r()));
  }
  // calafate: sobre los arbustos
  for (const b of veg.calafates) poner('calafate', b.x + 0.2, b.z + 0.1, b.y + 0.85 * b.esc, r() * 6);
  // llao llao en troncos de lenga y coihue
  const vivos = veg.arboles.filter((a) => !a.sacado);
  const nothofagus = vivos.filter((a) => a.especie === 'lenga' || a.especie === 'coihue');
  intentos(70, () => {
    const a = nothofagus[Math.floor(r() * nothofagus.length)];
    if (!a) return;
    const ang = r() * 6.28, rad = a.r - 0.02;
    items.push({ tipo: 'llaollao', x: a.x + Math.cos(ang) * rad, y: a.y + 1.9 + r() * 0.7, z: a.z + Math.sin(ang) * rad, rotY: Math.PI / 2 - ang, esc: 1, alto: true });
  });
  // piñones al pie de los pehuenes
  for (const a of vivos.filter((a) => a.especie === 'pehuen')) {
    for (let i = 0; i < 4; i++) { const ang = r() * 6.28, d = 1.5 + r() * 4; poner('pinon', a.x + Math.cos(ang) * d, a.z + Math.sin(ang) * d); }
  }
  // plumas
  intentos(120, () => { const [x, z] = punto(); if (T.val(T.bosque, x, z) > 0.3) poner('pluma', x, z); });
  // cantos rodados: en la orilla del lago y en las piedras del arroyo
  for (let i = 0; i < 260; i++) {
    const a2 = r() * Math.PI * 2;
    const rad = T.radioLago(a2) * (0.95 + (r() - 0.5) * 0.06);
    const x = LAGO.x + Math.cos(a2) * rad, z = LAGO.z + Math.sin(a2) * rad;
    if (!T.agua(x, z) && T.altura(x, z) > 0.1) poner('canto', x, z, undefined, r() * 6, 0.8 + r() * 0.5);
  }
  for (let i = 8; i < T.rio.length - 6; i += 2) {
    if (r() > 0.55) continue;
    const p2 = T.rio[i], a2 = T.rio[i - 1], b2 = T.rio[i + 1];
    const tx = b2.x - a2.x, tz = b2.z - a2.z, l = Math.hypot(tx, tz) || 1;
    const lado = r() < 0.5 ? -1 : 1;
    const d = p2.w + 0.6 + r() * 1.4;
    const x = p2.x - (tz / l) * lado * d, z = p2.z + (tx / l) * lado * d;
    if (!T.agua(x, z)) poner('canto', x, z, undefined, r() * 6, 0.8 + r() * 0.5);
  }
  // ramitas bajo los árboles
  intentos(900, () => {
    const a = vivos[Math.floor(r() * vivos.length)];
    if (!a || a.especie === 'pehuen') return;
    const ang = r() * 6.28, d = 1.5 + r() * 4;
    poner('ramita', a.x + Math.cos(ang) * d, a.z + Math.sin(ang) * d);
  });

  // 2.8: una partitura cerca de cada lugar que dice su melodía. Con su propio azar, para
  // no correr nada de lo que ya estaba puesto (los ids van por lugar).
  const rP = rng(2808);
  for (const m of MELODIAS) {
    const l = m.lugar ? T.lugares?.[m.lugar] : null;
    if (!l || !Number.isFinite(l.x) || !Number.isFinite(l.z)) continue;
    const a0 = rP() * Math.PI * 2;
    let puesto = false;
    for (const d of [7, 10, 13, 16, 20, 25, 31]) {
      for (let k = 0; k < 8 && !puesto; k++) {
        const a = a0 + (k * Math.PI) / 4;
        const antes = items.length;
        poner('partitura', l.x + Math.cos(a) * d, l.z + Math.sin(a) * d, undefined, rP() * 6.28, 1);
        if (items.length > antes) { items[items.length - 1].melodia = m.id; puesto = true; }
      }
      if (puesto) break;
    }
  }

  // cada objeto se identifica por su tipo y su lugar, no por su número de orden:
  // así la partida sigue valiendo aunque cambies la calidad gráfica
  items.forEach((it) => { it.id = `${it.tipo}:${Math.round(it.x * 4)}:${Math.round(it.z * 4)}`; });
  const tomados = new Set(progreso.tomados);
  // 2.8: una partitura ya juntada queda anotada en "Tu música" (por si se perdió el dato)
  for (const it of items) if (it.tipo === 'partitura' && it.melodia && tomados.has(it.id)) anotarPartitura(progreso, it.melodia);
  // 2.8: el tocadiscos del refugio, y lo que tiene puesto
  const vitrola = crearTocadiscos(T, escena);
  if (vitrola) {
    tocadiscos.pos = vitrola.pos; tocadiscos.disco = vitrola.disco;
    // para las pruebas: si suena y qué tiene puesto
    vitrola.suena = tocadiscosSuena;
    vitrola.estado = () => ({ suena: tocadiscosSuena(), datos: tocadiscos.datos, proxima: tocadiscos.proxima, indice: tocadiscos.indice });
  }
  tocadiscos.datos = sanearMusica(progreso.personal?.musica);
  // (si el mundo se vuelve a armar, el tocadiscos arranca de cero)
  Object.assign(tocadiscos, { sonando: null, proxima: 0, indice: 0, ultimaElegida: null, acum: 0 });
  if (!vitrola) { tocadiscos.pos = null; tocadiscos.disco = null; }

  // 3.8.4: lo que soltaste con V queda en la partida (`progreso.soltados`: [{ tipo, x, z }]) y al cargar vuelve a estar
  // donde lo dejaste (antes se perdía al recargar). Al levantarlo de nuevo, sale de la lista.
  const SOLTADOS_TOPE = 64;
  if (!Array.isArray(progreso.soltados)) progreso.soltados = [];
  const soltadosGuardados = progreso.soltados.filter((s) => s && Object.hasOwn(tipos, s.tipo) && Number.isFinite(s.x) && Number.isFinite(s.z)).slice(-SOLTADOS_TOPE);
  progreso.soltados = soltadosGuardados.slice();

  // mallas
  const mallas = {}, vistas = {};
  const M = new THREE.Matrix4(), cero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const [tipo, def] of Object.entries(tipos)) {
    const lista = items.filter((it) => it.tipo === tipo);
    // se reservan huecos de más para lo que el jugador suelte de vuelta
    // (3.8.4: y para lo que ya había soltado en la partida guardada, que vuelve a estar donde lo dejó)
    const RESERVA = 16 + soltadosGuardados.filter((s) => s.tipo === tipo).length;
    const im = new THREE.InstancedMesh(def.geo, mat, Math.max(1, lista.length) + RESERVA);
    lista.forEach((it, i) => {
      it.indice = i;
      M.copy(matriz([it.x, it.y, it.z], [0, it.rotY, 0], [it.esc, it.esc, it.esc]));
      const yaNoEsta = tomados.has(it.id);
      im.setMatrixAt(i, yaNoEsta ? cero : M);
      if (yaNoEsta) it.tomado = true;
    });
    for (let i = lista.length; i < lista.length + RESERVA; i++) im.setMatrixAt(i, cero);
    im.count = lista.length + RESERVA;
    im.userData.libres = [];
    for (let i = lista.length; i < lista.length + RESERVA; i++) im.userData.libres.push(i);
    im.instanceMatrix.needsUpdate = true;
    mallas[tipo] = im;
    // 1.4: antes se dibujaban TODOS los objetos del mapa en cada cuadro (el calafate solo
    // sumaba más de un millón de triángulos). Ahora se dibuja una vista con los cercanos.
    const capacidad = Math.min(im.count, 700);
    const vista = new THREE.InstancedMesh(def.geo, mat, capacidad);
    vista.count = 0;
    vista.frustumCulled = false;
    vista.receiveShadow = true;
    vista.matrixAutoUpdate = false;
    escena.add(vista);
    vistas[tipo] = vista;
  }
  // alcance de dibujo según el tamaño: una baya no se ve a 100 m, un amancay sí
  const RADIO_VISTA = { amancay: 120, llaollao: 90, canto: 95, frutilla: 70, calafate: 75, pinon: 60, pluma: 60, ramita: 55, partitura: 45 };
  const ultimaCam = { x: 1e9, z: 1e9 };
  function compactar(tipo) {
    const fuente = mallas[tipo], vista = vistas[tipo];
    const M = fuente.instanceMatrix.array, D = vista.instanceMatrix.array, cap = vista.instanceMatrix.count;
    const r2 = RADIO_VISTA[tipo] ** 2;
    let n = 0;
    for (let i = 0; i < fuente.count && n < cap; i++) {
      const o = i * 16;
      if (M[o] === 0 && M[o + 5] === 0) continue;                        // juntado o hueco libre
      const dx = M[o + 12] - ultimaCam.x, dz = M[o + 14] - ultimaCam.z;
      if (dx * dx + dz * dz > r2) continue;
      D.set(M.subarray(o, o + 16), n * 16);
      n++;
    }
    vista.count = n;
    vista.instanceMatrix.needsUpdate = true;
  }
  // se llama con la cámara; sólo recompacta si hubo movimiento apreciable
  function actualizar(cam) {
    // 2.8: el tocadiscos se ve sólo cerca del refugio
    if (vitrola) vitrola.grupo.visible = Math.hypot(cam.x - vitrola.pos.x, cam.z - vitrola.pos.z) < 140;
    if (Math.hypot(cam.x - ultimaCam.x, cam.z - ultimaCam.z) < 4) return;
    ultimaCam.x = cam.x; ultimaCam.z = cam.z;
    for (const tipo of Object.keys(vistas)) compactar(tipo);
  }

  // grilla de búsqueda
  const grilla = new Map();
  const clave = (x, z) => Math.floor(x / 12) + ',' + Math.floor(z / 12);
  for (const it of items) { const k = clave(it.x, it.z); if (!grilla.has(k)) grilla.set(k, []); grilla.get(k).push(it); }
  const grillaPlantas = new Map();
  for (const p of veg.plantas.filter((p) => !p.sacado)) { const k = clave(p.x, p.z); if (!grillaPlantas.has(k)) grillaPlantas.set(k, []); grillaPlantas.get(k).push(p); }
  const grillaArboles = new Map();
  for (const a of vivos) { const k = clave(a.x, a.z); if (!grillaArboles.has(k)) grillaArboles.set(k, []); grillaArboles.get(k).push(a); }
  const vecinosItems = [], vecinosPlantas = [], vecinosArboles = [];
  const vecinos = (g, x, z, out) => {
    out.length = 0;
    const cx = Math.floor(x / 12), cz = Math.floor(z / 12);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const l = g.get((cx + dx) + ',' + (cz + dz));
      if (l) for (let i = 0; i < l.length; i++) out.push(l[i]);
    }
    return out;
  };

  function quitar(it) {
    if (it.tomado) return false;
    it.tomado = true;
    mallas[it.tipo].setMatrixAt(it.indice, cero);
    compactar(it.tipo);
    // 3.8.4: lo que habías soltado sale de la lista (su hueco queda para el próximo que sueltes)
    if (it.suelto) { const i = progreso.soltados.indexOf(it.suelto); if (i >= 0) progreso.soltados.splice(i, 1); it.suelto = null; return true; }
    progreso.tomados.push(it.id);
    return true;
  }

  const dir = new THREE.Vector3(), adelante = new THREE.Vector3(), adelantePlano = new THREE.Vector3();
  // qué hay para hacer delante del jugador
  function buscar(cam, jug) {
    cam.getWorldDirection(adelante);
    const ojo = cam.position;
    const mira = (x, y, z, max) => {
      dir.set(x - ojo.x, y - ojo.y, z - ojo.z);
      const d = dir.length();
      if (d > max) return -1;
      const dot = dir.divideScalar(d || 1).dot(adelante);
      return d < 1.1 ? Math.max(dot, 0.9) : dot;
    };
    adelantePlano.set(adelante.x, 0, adelante.z).normalize();
    let mejor = null, puntaje = 0.86;
    const probar = (cand, dot) => { if (dot > puntaje) { puntaje = dot; mejor = cand; } };

    for (const it of vecinos(grilla, ojo.x, ojo.z, vecinosItems)) {
      if (it.tomado) continue;
      const def = tipos[it.tipo];
      const anotado = def.accion === 'anotar' && progreso.entradas[def.entrada];
      if (anotado && !def.juntableTrasAnotar) continue;
      const dot = mira(it.x, it.y + 0.15, it.z, 3.2);
      // 2.6.1: el candidato (y su texto) se arma sólo si le gana al mejor
      if (dot > 0 && dot + 0.02 > puntaje) probar({ tipo: 'item', it, texto: (def.accion === 'anotar' && !anotado ? 'Anotar ' : 'Juntar ') + def.etiqueta }, dot + 0.02);
    }
    for (const p of vecinos(grillaPlantas, ojo.x, ojo.z, vecinosPlantas)) {
      if (progreso.entradas[p.tipo]) continue;
      const dot = mira(p.x, p.y + 0.7, p.z, 3.4);
      if (dot > 0 && dot > puntaje) probar({ tipo: 'planta', p, texto: 'Anotar ' + NOMBRE_PLANTA[p.tipo] }, dot);
    }
    for (const a of vecinos(grillaArboles, ojo.x, ojo.z, vecinosArboles)) {
      if (progreso.entradas[a.especie]) continue;
      dir.set(a.x - ojo.x, 0, a.z - ojo.z);
      const d = dir.length() - a.r;
      if (d > 2.2) continue;
      const dot = dir.normalize().dot(adelantePlano);
      if (dot > 0.75) probar({ tipo: 'arbol', a, texto: 'Anotar ' + NOMBRE_ESPECIE[a.especie] }, 0.9 + dot * 0.05);
    }
    // 2.8: el tocadiscos: E pone el próximo disco; después del último, se apaga
    if (vitrola && !jug.estado.sentado) {
      const p = vitrola.pos;
      const dot = mira(p.x, p.y, p.z, 2.4);
      if (dot > 0 && dot > puntaje) {
        const d = tocadiscos.datos || sanearMusica(progreso.personal?.musica);
        const sig = d.encendido ? siguienteDisco(d, d.elegida) : null;
        const texto = !d.encendido ? 'Poner un disco' : sig ? `Cambiar el disco (suena «${MELODIA[d.elegida]?.nombre || 'un vals'}»)` : 'Apagar el tocadiscos';
        probar({ tipo: 'tocadiscos', texto }, dot);
      }
    }
    for (const s of est.sentaderos) {
      if (jug.estado.sentado) break;
      const d = Math.hypot(s.x - ojo.x, s.z - ojo.z);
      if (d >= 2) continue;
      // 3.0.1: el asiento tiene que estar a tu alcance de verdad: en tu mismo piso (desde
      // el pie de la torre se «sentaba» uno en el piso de arriba), sin una pared en el
      // medio (la cama del refugio desde afuera) y, si no lo tenés encima, más o menos
      // adelante (con el banco al costado de la puerta del refugio, E no abría la puerta)
      if (Math.abs(s.y - 0.45 - jug.estado.pos.y) > 1.1) continue;
      if (d > 0.8 && ((s.x - ojo.x) * adelantePlano.x + (s.z - ojo.z) * adelantePlano.z) / d < 0.55) continue;
      if (est.col?.paredEntre?.(ojo.x, ojo.z, s.x, s.z, s.y)) continue;
      if (est.ocupado?.(s)) continue;   // 3.6.1: en la silla donde está sentado un vecino, no (te sentabas encima)
      probar({ tipo: 'sentarse', s, texto: s.cama ? 'Acostarte a dormir' : 'Sentarte en ' + s.nombre }, s.cama ? 0.95 : 0.87);
    }
    return mejor;
  }

  function usar(obj, registrar, sonido) {
    if (!obj) return null;
    // 2.8: el tocadiscos y las partituras (ver `personal-musica.js`)
    if (obj.tipo === 'tocadiscos') {
      const d = sanearMusica(progreso.personal?.musica);
      const lista = disponibles(d);
      if (!d.encendido) { d.encendido = true; if (!lista.includes(d.elegida)) d.elegida = lista[0]; }
      else {
        const sig = siguienteDisco(d, d.elegida);
        if (sig) d.elegida = sig; else { d.encendido = false; d.elegida = lista[0]; }
      }
      if (!progreso.personal || typeof progreso.personal !== 'object') progreso.personal = {};
      progreso.personal.musica = d;
      tocadiscos.datos = d;
      sonido.juntar?.();
      try { tocadiscos.nota?.(d.encendido ? MELODIA[d.elegida].nombre : 'Tocadiscos apagado', d.encendido ? 'Suena en el tocadiscos' : 'E lo vuelve a prender'); tocadiscos.guardar?.(); } catch {}
      return { tocadiscos: d.encendido ? MELODIA[d.elegida].nombre : null };
    }
    if (obj.tipo === 'item' && obj.it.tipo === 'partitura') {
      if (!quitar(obj.it)) return null;
      sonido.juntar();
      const m = anotarPartitura(progreso, obj.it.melodia);
      // se escucha un pedazo ahí mismo: así sabés qué encontraste
      if (m) {
        escucharMuestra(sonido, m.id, 10);
        try { tocadiscos.nota?.(m.nombre, 'Una partitura para el tocadiscos del refugio', true); tocadiscos.guardar?.(); } catch {}
      }
      return { juntado: 'partitura', partitura: m ? m.nombre : null };
    }
    if (obj.tipo === 'item') {
      const def = tipos[obj.it.tipo];
      if (def.accion === 'juntar' || (def.juntableTrasAnotar && progreso.entradas[def.entrada])) {
        // 3.8.3: con doce ramitas no entra otra: se queda en el suelo (antes se borraba del valle para siempre sin sumar)
        if (obj.it.tipo === 'ramita' && progreso.ramitas >= 12) return { ramita: true, llena: true };
        if (!quitar(obj.it)) return null;
        sonido.juntar();
        if (obj.it.tipo === 'ramita') { progreso.ramitas = Math.min(12, progreso.ramitas + 1); return { ramita: true }; }
        registrar(def.entrada, true);
        return { juntado: def.etiqueta };
      }
      registrar(def.entrada);
    } else if (obj.tipo === 'planta') registrar(obj.p.tipo);
    else if (obj.tipo === 'arbol') registrar(obj.a.especie);
    else if (obj.tipo === 'sentarse') return { sentarse: obj.s };
    return null;
  }

  // Dejar algo de vuelta en el suelo: se reusa un hueco de los ya tomados,
  // así no hace falta agrandar la malla instanciada.
  function soltar(id, x, z, guardado = null) {
    const tipo = id === 'ramita' ? 'ramita' : id;
    // 2.6.1: Object.hasOwn: un id como "constructor" encontraba una función y tiraba
    const im = Object.hasOwn(mallas, tipo) ? mallas[tipo] : null;
    if (!im) return false;
    const y = T.altura(x, z);
    // 3.8.4: va a un hueco propio (uno de lo soltado antes, ya levantado, o uno reservado) y queda anotado en la partida;
    // sin huecos, como antes: se reusa uno de los que juntaste (ése, al recargar, vuelve a su lugar de siempre)
    let candidato = items.find((it) => it.tipo === tipo && it.tomado && it.esSuelto);
    if (!candidato && im.userData.libres?.length) {
      const libre = im.userData.libres.pop();
      candidato = { tipo, id: `suelto-${tipo}-${libre}`, indice: libre, esc: 1, esSuelto: true };
      items.push(candidato);
    }
    if (candidato) {
      candidato.suelto = guardado || { tipo, x, z };
      if (!guardado) { progreso.soltados.push(candidato.suelto); if (progreso.soltados.length > SOLTADOS_TOPE) progreso.soltados.shift(); }
    } else candidato = items.find((it) => it.tipo === tipo && it.tomado);
    if (candidato && !candidato.esSuelto) {
      const i = progreso.tomados.indexOf(candidato.id);
      if (i >= 0) progreso.tomados.splice(i, 1);
    } else if (!candidato) {
      // no había ninguno levantado: se usa un hueco reservado
      const libre = im.userData.libres && im.userData.libres.pop();
      if (libre === undefined) return false;
      candidato = { tipo, id: `suelto-${tipo}-${libre}-${Math.random().toString(36).slice(2, 7)}`, indice: libre, esc: 1 };
      items.push(candidato);
    }
    candidato.tomado = false;
    candidato.x = x; candidato.z = z; candidato.y = y;
    candidato.rotY = Math.random() * 6.28;
    M.copy(matriz([x, y, z], [0, candidato.rotY, 0], [candidato.esc, candidato.esc, candidato.esc]));
    im.setMatrixAt(candidato.indice, M);
    compactar(tipo);
    // se reubica en la grilla de búsqueda para poder volver a levantarlo
    const k = clave(x, z);
    if (!grilla.has(k)) grilla.set(k, []);
    if (!grilla.get(k).includes(candidato)) grilla.get(k).push(candidato);
    return true;
  }

  // 3.8.4: lo soltado de la partida guardada, otra vez en el suelo
  for (const s of soltadosGuardados) soltar(s.tipo, s.x, s.z, s);

  return { buscar, usar, soltar, items, tipos, ENTRADA, actualizar, tocadiscos: vitrola };
}
