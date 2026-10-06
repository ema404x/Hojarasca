// Fauna con comportamiento simple: se deja ver si te movés con calma
import * as THREE from 'three';
import { rng, clamp, lerp } from './ruido.js';
import { LIMITE } from './config.js';
import { lam, inclinacionTerrenoMamifero } from './vida.js';
import { compactar } from './vida.js';
import { bola, torno, miembro, deformar, pintar, ruido3, matiz, color as matDe } from './formas.js';
import { marchaMamifero } from './vida.js';
import { percepcionMamifero, calmaDe, puntoDeCuriosidad, CURIOSIDAD, anotarAcercamiento } from './percepcion.js';
import { crearSombraContacto, actualizarSombraContacto } from './naturaleza-reactiva.js';
import { ALCANCE_OIDO } from './oido.js';
import { ALCANCE_RESPUESTA, adondeViene } from './grabador.js';
import { esperaMigracion, lugarEnLaV } from './almanaque.js';
import { crearPoolPosicional, limitarSombrasPorDistancia, consumirPresupuestoIA } from './rendimiento.js';

// 3.4: el pudú como es: un ciervo enano de lomo arqueado (la grupa más alta que la cruz),
// cuello corto y grueso, cabeza corta con hocico oscuro, orejas redondas, patas finas con
// pezuñas y, el macho, dos cuernitos cortos en punta. El pelaje pardo rojizo entrecano se
// pinta en los vértices. Antes eran ~24 piezas sueltas (una llamada de dibujo cada una); ahora
// es una malla por grupo: cuerpo, cabeza y cada pata (6), con los mismos pivotes.
function crearPuduMalla(macho) {
  const g = new THREE.Group();
  const pelo = '#5f412a', rojizo = '#7a5032', oscuro = '#241a14';
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const _r = new THREE.Color(rojizo);
  // entrecano (cada pelo con la punta clara), el lomo más oscuro, la cara y las patas más rojizas
  const pelaje = (c, p, n) => {
    const k = ruido3(p.x * 31, p.y * 29, p.z * 27);
    c.multiplyScalar(1 + k * 0.09 - 0.14 * Math.max(0, n.y) * suave(0.36, 0.5, p.y));
    c.lerp(_r, 0.27 * Math.min(1, suave(0.36, 0.48, p.z) + (1 - suave(0.1, 0.24, p.y))));
  };
  const conPelaje = (m) => pintar(m, pelaje);
  // el cuerpo, un torno acostado: la grupa sube y la panza es pareja
  // 3.5.2: más hondo y más bajo (las patas se veían largas: el pudú es petiso y retacón), con
  // más lados y anillos (de cerca se veían las facetas del contorno)
  const cuerpo = torno(pelo, [[0.0, -0.33], [0.05, -0.322], [0.088, -0.3], [0.118, -0.27], [0.142, -0.22], [0.158, -0.15], [0.162, -0.08], [0.158, -0.01], [0.15, 0.06], [0.144, 0.12], [0.134, 0.17], [0.114, 0.215], [0.084, 0.245], [0.046, 0.264], [0.0, 0.27]], [0, 0.35, -0.03], [Math.PI / 2, 0, 0], null, 18);
  deformar(cuerpo, (v) => {
    const largo = v.y; let alto = -v.z;
    alto += 0.035 * suave(0.1, -0.2, largo) * (alto > 0 ? 1 : 0.4);   // la grupa alta
    if (alto < 0) alto *= 0.9;
    v.z = -alto;
  });
  g.add(conPelaje(cuerpo));
  g.add(conPelaje(bola(pelo, [0.022, 0.03, 0.022], [0, 0.38, -0.36], [-0.6, 0, 0])));   // la colita
  // ---- la cabeza, con el cuello (cuello corto y grueso, se mueve al pastar)
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.44, 0.28);
  cabeza.add(conPelaje(miembro(pelo, [[0, -0.1, -0.12], [0, -0.03, -0.05], [0, 0.04, 0.01]], [0.08, 0.065, 0.055], 6, 10)));
  cabeza.add(conPelaje(bola(pelo, [0.068, 0.068, 0.08], [0, 0.065, 0.04])));
  cabeza.add(conPelaje(miembro(pelo, [[0, 0.06, 0.07], [0, 0.04, 0.13], [0, 0.026, 0.165]], [0.052, 0.038, 0.026], 5, 10)));   // el hocico
  cabeza.add(bola(oscuro, [0.024, 0.02, 0.018], [0, 0.028, 0.172]));                        // la nariz
  for (const l of [-1, 1]) {
    cabeza.add(bola('#0d0a08', [0.012, 0.013, 0.01], [l * 0.05, 0.08, 0.09]));           // los ojos
    cabeza.add(conPelaje(bola(rojizo, [0.038, 0.046, 0.011], [l * 0.064, 0.125, 0.0], [-0.2, l * 0.5, -l * 0.55])));   // las orejas, redondas
    if (macho) cabeza.add(miembro('#3b3027', [[l * 0.026, 0.12, 0.05], [l * 0.03, 0.16, 0.035], [l * 0.032, 0.19, 0.022]], [0.011, 0.008, 0.002], 4, 6));   // los cuernitos
  }
  g.add(cabeza);
  // ---- las patas: finas, la de atrás con su garrón, y la pezuña oscura
  const patas = [];
  // 3.5.2: las patas, 2 cm más cortas (el pivote baja con el cuerpo) y un poco más gruesas
  const k = 0.93;
  for (const [x, z] of [[-0.075, 0.17], [0.075, 0.17], [-0.075, -0.18], [0.075, -0.18]]) {
    const pivote = new THREE.Group(); pivote.position.set(x, 0.3 * k, z);
    if (z > 0) pivote.add(conPelaje(miembro(pelo, [[0, 0.05, -0.004], [0, -0.08 * k, 0.0], [0, -0.19 * k, 0.004], [0, -0.285 * k, 0.012]], [0.037, 0.026, 0.016, 0.013], 8, 8)));
    else pivote.add(conPelaje(miembro(pelo, [[0, 0.06, 0.0], [0, -0.05 * k, 0.012], [0, -0.14 * k, -0.026], [0, -0.21 * k, -0.016], [0, -0.285 * k, 0.006]], [0.054, 0.04, 0.019, 0.014, 0.013], 9, 8)));
    pivote.add(bola(oscuro, [0.016, 0.016, 0.022], [0, -0.3 * k, 0.014]));
    g.add(pivote); patas.push(pivote);
  }
  compactar(g, { alto: 0.5, pie: 0.86, panza: 0.08, todo: true });
  return { g, cabeza, patas, macho };
}

// 3.4: el carpintero negro (Campephilus magellanicus) agarrado al tronco: cuerpo negro con la
// mancha blanca del ala, ojo claro, pico de cincel, la cola dura apoyada contra la corteza y
// el copete: rojo toda la cabeza en el macho; negro, ondulado hacia adelante y con rojo en la
// base del pico en la hembra. Todo en una sola malla (antes, una pieza por llamada de dibujo).
function crearCarpinteroMalla(macho) {
  const g = new THREE.Group();
  const negro = '#141414', rojo = '#b8231a';
  const cuerpo = torno(negro, [[0.0, -0.13], [0.04, -0.12], [0.064, -0.06], [0.072, 0.02], [0.066, 0.09], [0.048, 0.13], [0.0, 0.15]], [0, 0, -0.01], [-0.12, 0, 0], [1, 1, 0.85], 12);
  g.add(cuerpo);
  // las alas plegadas, con la mancha blanca de las secundarias abajo
  for (const l of [-1, 1]) {
    const ala = bola(negro, [0.03, 0.11, 0.062], [l * 0.056, 0.0, -0.02], [-0.1, 0, l * 0.12]);
    g.add(pintar(ala, (c, p) => { if (p.y < -0.02 && p.y > -0.075 && p.z < -0.01) c.set('#e6e4dc'); }));
  }
  g.add(bola(macho ? rojo : negro, [0.05, 0.054, 0.058], [0, 0.17, 0.028]));
  g.add(miembro(macho ? rojo : negro, [[0, 0.2, 0.0], [0, 0.235, -0.04], [0, 0.22, -0.075]], [0.032, 0.022, 0.004], 5, 7));   // el copete
  if (!macho) {
    g.add(miembro(negro, [[0, 0.215, 0.03], [0, 0.25, 0.05], [0, 0.245, 0.085]], [0.02, 0.012, 0.003], 5, 6));   // el rulo de la hembra
    g.add(bola(rojo, [0.022, 0.022, 0.02], [0, 0.155, 0.075]));
  }
  g.add(miembro('#5e5e58', [[0, 0.162, 0.07], [0, 0.158, 0.12], [0, 0.152, 0.15]], [0.016, 0.01, 0.003], 4, 6));   // el pico
  for (const l of [-1, 1]) g.add(bola('#e2cf6a', [0.01, 0.01, 0.006], [l * 0.04, 0.178, 0.058]));                // el ojo claro
  g.add(deformar(torno(negro, [[0.0, 0.0], [0.034, 0.02], [0.03, 0.14], [0.0, 0.17]], [0, -0.1, -0.03], [Math.PI - 0.22, 0, 0], null, 8), (v) => { v.z *= 0.35; }));   // la cola
  for (const l of [-1, 1]) g.add(miembro('#4a4a46', [[l * 0.03, -0.07, 0.02], [l * 0.034, -0.09, 0.06]], [0.008, 0.006], 3, 5));   // las patas
  compactar(g, { todo: true });
  return g;
}

// 3.4: las aves que cruzan el cielo, con su silueta: cuerpo de torno con cabeza, pico y cola,
// y alas con la forma de cada una (la cachaña, de punta y cola larga; el cauquén, de ganso;
// el cóndor, enorme, con los dedos de las primarias abiertos, la gorguera blanca y el blanco
// de las secundarias). Las alas se pintan por vértice y llevan las dos caras: todo sale con el
// material de la fauna. `color` y `envergadura` como siempre; `especie` elige la forma.
function crearAveVoladora(color, envergadura, especie = null) {
  const g = new THREE.Group();
  const E = envergadura, L = E * (especie === 'condor' ? 0.36 : especie === 'cachana' ? 0.46 : 0.5);
  const cuerpo = torno(color, [[0.0, -0.36], [0.05, -0.32], [0.1, -0.2], [0.12, -0.04], [0.11, 0.1], [0.08, 0.2], [0.0, 0.26]].map(([r, y]) => [r * L, y * L]), null, [Math.PI / 2, 0, 0], [1, 1, 0.85], 10);
  g.add(cuerpo);
  if (especie === 'condor') {
    g.add(bola('#eeeeea', [0.075 * L, 0.065 * L, 0.06 * L], [0, 0.01 * L, 0.27 * L]));          // la gorguera
    g.add(bola('#7a5a52', [0.05 * L, 0.05 * L, 0.07 * L], [0, 0.015 * L, 0.35 * L]));           // la cabeza pelada
    g.add(miembro('#c8bca6', [[0, 0.01 * L, 0.4 * L], [0, -0.01 * L, 0.45 * L]], [0.022 * L, 0.008 * L], 3, 6));
  } else if (especie === 'cauquen') {
    g.add(miembro(color, [[0, 0.0, 0.2 * L], [0, 0.03 * L, 0.32 * L], [0, 0.04 * L, 0.42 * L]], [0.06 * L, 0.04 * L, 0.04 * L], 5, 8));   // el cuello largo
    g.add(bola(matiz(color, 1.25), [0.055 * L, 0.05 * L, 0.07 * L], [0, 0.045 * L, 0.45 * L]));
    g.add(miembro('#2a2a28', [[0, 0.04 * L, 0.5 * L], [0, 0.03 * L, 0.56 * L]], [0.02 * L, 0.01 * L], 3, 6));
  } else {
    g.add(bola(color, [0.08 * L, 0.075 * L, 0.09 * L], [0, 0.02 * L, 0.28 * L]));
    g.add(miembro('#3a3a36', [[0, 0.0, 0.35 * L], [0, -0.03 * L, 0.39 * L]], [0.03 * L, 0.006 * L], 3, 6));
  }
  // la cola: larga y en punta en la cachaña (colorada por abajo), corta y ancha en los otros
  const largoCola = especie === 'cachana' ? 0.42 : 0.16;
  const cola = deformar(torno(especie === 'cachana' ? '#8e3426' : matiz(color, 0.85), [[0.0, 0.0], [0.06 * L, 0.03 * L], [0.07 * L, largoCola * 0.6 * L], [0.0, largoCola * L]], [0, 0, -0.3 * L], [-Math.PI / 2, 0, 0], null, 8), (v) => { v.z *= 0.25; });
  g.add(cola);
  compactar(g, { todo: true });
  // las alas, de dos caras y pintadas por vértice
  const alas = [];
  const w = E / 2;
  const contorno = especie === 'condor'
    ? [[0, 0.14], [0.3, 0.13], [0.62, 0.1], [0.78, 0.07], [0.98, 0.0], [0.86, -0.03], [0.97, -0.05], [0.84, -0.07], [0.93, -0.1], [0.8, -0.1], [0.86, -0.14], [0.72, -0.13], [0.5, -0.17], [0.25, -0.17], [0, -0.15]]
    : especie === 'cachana'
      ? [[0, 0.11], [0.35, 0.1], [0.7, 0.04], [1.0, -0.04], [0.75, -0.08], [0.4, -0.13], [0, -0.13]]
      : [[0, 0.12], [0.35, 0.11], [0.72, 0.05], [1.0, -0.03], [0.8, -0.09], [0.45, -0.15], [0, -0.14]];
  const tinta = (x, z, arriba) => {
    const c = new THREE.Color(color);
    if (especie === 'condor') { if (arriba && x > 0.18 && x < 0.62 && z < -0.02) c.set('#dcdcd4'); else if (!arriba && x > 0.2 && x < 0.6 && z < -0.05) c.set('#77736c'); }
    else if (especie === 'cachana') { if (x > 0.6) c.lerp(new THREE.Color('#2e5c74'), 0.6); }
    else if (x > 0.7) c.lerp(new THREE.Color('#2a2622'), 0.7); else if (z < -0.06 && x < 0.5) c.lerp(new THREE.Color('#e8e4da'), 0.6);
    if (!arriba) c.multiplyScalar(0.8);
    return c;
  };
  for (const lado of [-1, 1]) {
    const pivote = new THREE.Group();
    const pos = [], col = [], idx = [];
    for (const arriba of [true, false]) {
      const base = pos.length / 3;
      pos.push(0, 0, 0); { const c = tinta(0, 0, arriba); col.push(c.r, c.g, c.b); }
      for (const [x, z] of contorno) {
        pos.push(lado * x * w, (arriba ? 0.004 : -0.004) * E + Math.sin(x * Math.PI) * 0.03 * E, z * E);
        const c = tinta(x, z, arriba); col.push(c.r, c.g, c.b);
      }
      for (let i = 1; i < contorno.length; i++) {
        const a = base, b = base + i, c2 = base + i + 1;
        const haciaArriba = (lado > 0) === arriba;
        if (haciaArriba) idx.push(a, b, c2); else idx.push(a, c2, b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    pivote.add(new THREE.Mesh(geo, matDe(color)));
    compactar(pivote, { todo: true });
    g.add(pivote); alas.push(pivote);
  }
  return { g, alas };
}

// 2.8: `opciones.animales` (Tu partida, ver personal-partida.js): cuántos pudúes y
// carpinteros hay contra los de siempre (0,5 · 1 · 1,5). Con 1 el bosque sale idéntico.
export function crearFauna(T, veg, col, escena, sonido, registrar, progreso, opciones = {}) {
  const r = rng(5151);
  const factorAnimales = Number.isFinite(opciones.animales) ? Math.max(0.25, Math.min(2, opciones.animales)) : 1;
  const tmp = new THREE.Vector3(), adelante = new THREE.Vector3();
  let cam = null, zoom = false;
  const poolSujetos = crearPoolPosicional(() => new THREE.Vector3(), 32);
  const listaSujetos = poolSujetos.lista();

  const mirando = (pos, umbral, maxDist) => {
    tmp.subVectors(pos, cam.position);
    const d = tmp.length();
    if (d > maxDist) return false;
    return tmp.divideScalar(d).dot(adelante) > umbral;
  };

  // ---------------------------------------------------------------- pudúes
  const pudues = [];
  const casas = [];
  for (let i = 0; i < 400 && casas.length < Math.round(14 * factorAnimales); i++) {
    const x = (r() * 2 - 1) * 430, z = (r() * 2 - 1) * 430;
    const k = T.indice(x, z);
    if (T.bosque[k] < 0.45 || T.agua(x, z) || T.pendiente[k] > 0.6) continue;
    if (casas.some((c) => Math.hypot(c.x - x, c.z - z) < 70)) continue;
    casas.push({ x, z });
  }
  for (const casa of casas) {
    const m = crearPuduMalla(r() < 0.5);
    m.g.position.set(casa.x, T.altura(casa.x, casa.z), casa.z);
    escena.add(m.g);
    const sombra = crearSombraContacto(escena, 0.16, 0.30, 0.12);
    pudues.push({ ...m, sombra, casa, pos: m.g.position, rumbo: r() * 6.28, estado: 'pastar', t: 2 + r() * 5, vel: 0, fase: 0, objetivo: null, huidaDe: null });
  }

  function actualizarPudu(p, dt, jug, ambiente) {
    const js = jug.estado;
    const dx = p.pos.x - js.pos.x, dz = p.pos.z - js.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 160) { p.g.visible = false; if (p.sombra) p.sombra.visible = false; limitarSombrasPorDistancia(p.g, d, 42); return; }
    p.g.visible = true;
    limitarSombrasPorDistancia(p.g, d, 42);
    const vj = js.velocidadActual;
    const dtIAP = consumirPresupuestoIA(p, dt, d, p.estado === 'huir' || p.estado === 'alerta' || d < 22);
    let sensorP = p.__sensorIA;
    if (dtIAP > 0 || !sensorP) { sensorP = percepcionMamifero(T, p.pos, js, ambiente || {}, 18, 24); p.__sensorIA = sensorP; }
    p.percepcion = sensorP;
    const radioAlerta = Math.max(js.agachado ? 8 : js.corriendo ? 34 : 18, sensorP.radioVisual * 0.9, sensorP.radioOido * 0.72);
    // (3.7.1: con lo que te enseñó Ayelén, la veterinaria, los animales se espantan desde más cerca: `huidaAmor`)
    const radioHuida = Math.max(js.agachado ? 3.2 : js.corriendo ? 24 : 9, 6 + sensorP.firma * 8) * Math.max(0.5, Math.min(1, js.huidaAmor || 1));

    if (p.estado !== 'huir') {
      if ((d < radioHuida && (vj > 0.6 || d < 2.4)) || sensorP.riesgo > 0.78) { p.estado = 'huir'; p.t = 4 + r() * 2; }
      else if ((d < radioAlerta && vj > 0.4) || sensorP.riesgo > 0.24) { if (p.estado !== 'alerta') { p.estado = 'alerta'; p.t = 2.2 + r() * 2; } }
    }
    p.t -= dt;
    let velObj = 0, giro = null;
    switch (p.estado) {
      case 'pastar':
        if (p.t <= 0) {
          p.estado = 'caminar'; p.t = 3 + r() * 5;
          // con el jugador quieto, el pudú a veces se acerca a mirar en vez de dar su vuelta
          const curioso = puntoDeCuriosidad(p.pos, js.pos, calmaDe(js), CURIOSIDAD.pudu, r);
          if (curioso) { p.objetivo = curioso; p.t = 12 + r() * 6; if (!p.acercandose) anotarAcercamiento('pudu'); p.acercandose = true; }
          else { const a = r() * 6.28, rr = r() * 35; p.objetivo = { x: p.casa.x + Math.cos(a) * rr, z: p.casa.z + Math.sin(a) * rr }; p.acercandose = false; }
        }
        break;
      case 'caminar':
        velObj = 0.55;
        giro = Math.atan2(p.objetivo.x - p.pos.x, p.objetivo.z - p.pos.z);
        if (p.t <= 0 || Math.hypot(p.objetivo.x - p.pos.x, p.objetivo.z - p.pos.z) < 1) { p.estado = 'pastar'; p.t = 3 + r() * 7; }
        break;
      case 'alerta':
        giro = Math.atan2(-dx, -dz);
        if (p.t <= 0) { p.estado = 'pastar'; p.t = 2 + r() * 3; }
        break;
      case 'huir':
        velObj = 4.6;
        giro = Math.atan2(dx, dz) + Math.sin(p.fase * 0.3) * 0.4;
        if (p.t <= 0) { p.estado = 'pastar'; p.t = 4 + r() * 6; }
        break;
    }
    if (giro !== null) {
      let delta = giro - p.rumbo;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      p.rumbo += delta * Math.min(1, dt * (p.estado === 'huir' ? 8 : 2.5));
    }
    p.vel = lerp(p.vel, velObj, 1 - Math.exp(-4 * dt));
    if (p.vel > 0.01) {
      const nx = p.pos.x + Math.sin(p.rumbo) * p.vel * dt, nz = p.pos.z + Math.cos(p.rumbo) * p.vel * dt;
      if (T.agua(nx, nz) || Math.abs(nx) > LIMITE || Math.abs(nz) > LIMITE) { p.rumbo += Math.PI * 0.7; }
      else { p.pos.x = nx; p.pos.z = nz; col.resolver(p.pos, 0.25); }
    }
    p.pos.y = T.altura(p.pos.x, p.pos.z);
    p.g.rotation.y = p.rumbo;
    const marchaP = marchaMamifero(p.vel, p.estado, 0.55, 4.6);
    p.marcha = marchaP.modo;
    p.fase += dt * marchaP.cadencia;
    const paso = Math.min(1, p.vel * 1.2);
    p.patas.forEach((pata, i) => { pata.rotation.x = Math.sin(p.fase + (i % 2 ? Math.PI : 0) + (i > 1 ? marchaP.posterior : 0)) * marchaP.amplitud * paso; });
    p.pos.y += Math.abs(Math.sin(p.fase * 0.5)) * marchaP.rebote * paso;
    const sueloP = inclinacionTerrenoMamifero(T, p.pos, p.rumbo, 0.24);
    const kSueloP = 1 - Math.exp(-dt * 8);
    p.g.rotation.x = lerp(p.g.rotation.x, sueloP.pitch, kSueloP);
    p.g.rotation.z = lerp(p.g.rotation.z, sueloP.roll + Math.sin(p.fase * 0.5) * 0.008 * paso, kSueloP);
    const bajar = p.estado === 'pastar' ? 0.75 : p.estado === 'alerta' ? -0.25 : 0;
    p.cabeza.rotation.x = lerp(p.cabeza.rotation.x, bajar + (p.estado === 'pastar' ? Math.sin(p.fase * 0.7) * 0.08 : 0), 1 - Math.exp(-3 * dt));
    p.cabeza.rotation.y = lerp(p.cabeza.rotation.y, p.estado === 'alerta' ? Math.sin(p.fase * 0.38) * 0.42 : 0, 1 - Math.exp(-4 * dt));
    if (p.estado === 'huir') p.pos.y += Math.abs(Math.sin(p.fase)) * 0.12;
    actualizarSombraContacto(p.sombra, T, p.pos, p.g.visible, p.estado === 'huir' ? 0.7 : 0.92);

    if (!progreso.entradas.pudu && p.estado !== 'huir') {
      tmp.set(p.pos.x, p.pos.y + 0.35, p.pos.z);
      if (mirando(tmp, zoom ? 0.99 : 0.95, zoom ? 45 : 16)) registrar('pudu');
    }
  }

  // ---------------------------------------------------------------- carpinteros
  const arbolesCarp = veg.arboles.filter((a) => !a.sacado && (a.especie === 'coihue' || a.especie === 'lenga') && a.esc > 0.9);
  const posadas = [];
  for (let i = 0; i < 200 && posadas.length < 18; i++) {
    const a = arbolesCarp[Math.floor(r() * arbolesCarp.length)];
    if (!a || posadas.some((p) => Math.hypot(p.x - a.x, p.z - a.z) < 45)) continue;
    posadas.push(a);
  }
  const carpinteros = [];
  for (let i = 0; i < Math.min(Math.round(7 * factorAnimales), posadas.length); i++) {
    const g = crearCarpinteroMalla(i % 2 === 0);
    escena.add(g);
    const c = { g, posada: posadas[i], t: 3 + r() * 8, volando: null, picoteo: 0 };
    ubicarEnTronco(c, c.posada);
    carpinteros.push(c);
  }
  function ubicarEnTronco(c, a) {
    const ang = r() * 6.28, altura = 4 + r() * 3;
    const rad = a.r * 0.8 + 0.08;
    c.ang = ang;
    c.g.position.set(a.x + Math.cos(ang) * rad, a.y + altura, a.z + Math.sin(ang) * rad);
    c.g.rotation.set(0, Math.atan2(-Math.cos(ang), -Math.sin(ang)), 0);
    c.posada = a;
  }
  function actualizarCarpintero(c, dt, jug) {
    const js = jug.estado;
    const d = Math.hypot(c.g.position.x - js.pos.x, c.g.position.z - js.pos.z);
    if (c.volando) {
      const v = c.volando;
      v.t += dt / v.dur;
      const t = Math.min(1, v.t);
      c.g.position.lerpVectors(v.desde, v.hasta, t);
      c.g.position.y += Math.sin(t * Math.PI) * 6;
      c.g.rotation.x = -1.2;
      if (t >= 1) { c.volando = null; c.g.rotation.x = 0; ubicarEnTronco(c, v.arbol); }
      return;
    }
    c.t -= dt;
    if (c.t <= 0) {
      if (d < 120) sonido.carpintero(c.g.position);
      c.picoteo = 0.25;
      c.t = 5 + r() * 9;
    }
    if (c.picoteo > 0) { c.picoteo -= dt; c.g.rotation.x = Math.sin(c.picoteo * 40) * 0.25; } else c.g.rotation.x = 0;
    if (d < (js.agachado ? 3 : 6.5)) {
      const destino = posadas[Math.floor(r() * posadas.length)];
      if (destino && destino !== c.posada) {
        c.volando = { desde: c.g.position.clone(), hasta: new THREE.Vector3(destino.x, destino.y + 5, destino.z), dur: Math.max(2, Math.hypot(destino.x - c.g.position.x, destino.z - c.g.position.z) / 10), t: 0, arbol: destino };
        c.g.rotation.y = Math.atan2(destino.x - c.g.position.x, destino.z - c.g.position.z);
      }
    }
    if (!progreso.entradas.carpintero && mirando(c.g.position, zoom ? 0.993 : 0.96, zoom ? 70 : 18)) registrar('carpintero');
  }

  // ---------------------------------------------------------------- chucaos (se oyen)
  const chucaos = [];
  const colihues = veg.plantas.filter((p) => !p.sacado && (p.tipo === 'colihue' || p.tipo === 'helecho'));
  for (let i = 0; i < 400 && chucaos.length < 16; i++) {
    const p = colihues[Math.floor(r() * colihues.length)];
    if (!p || chucaos.some((c) => Math.hypot(c.x - p.x, c.z - p.z) < 50)) continue;
    chucaos.push({ x: p.x, y: p.y + 0.3, z: p.z, t: 5 + r() * 30 });
  }

  // ---------------------------------------------------------------- cachañas
  const bandada = { aves: [], activa: false, t: 60 + r() * 90, desde: new THREE.Vector3(), hasta: new THREE.Vector3(), prog: 0, dur: 1, charla: 0 };
  for (let i = 0; i < 10; i++) {
    const a = crearAveVoladora('#3d7a34', 0.7, 'cachana');
    a.g.visible = false; escena.add(a.g);
    bandada.aves.push({ ...a, off: new THREE.Vector3((r() - 0.5) * 10, (r() - 0.5) * 4, (r() - 0.5) * 10), fase: r() * 6 });
  }
  const centroBandada = new THREE.Vector3();

  function actualizarBandada(dt, jug, dia) {
    const js = jug.estado;
    if (!bandada.activa) {
      bandada.t -= dt;
      if (bandada.t <= 0 && dia > 0.5) {
        const ang = r() * 6.28;
        const alt = js.pos.y + 22 + r() * 18;
        bandada.desde.set(js.pos.x + Math.cos(ang) * 260, alt, js.pos.z + Math.sin(ang) * 260);
        bandada.hasta.set(js.pos.x - Math.cos(ang) * 260 + (r() - 0.5) * 80, alt + 10, js.pos.z - Math.sin(ang) * 260 + (r() - 0.5) * 80);
        bandada.prog = 0; bandada.dur = 520 / 17; bandada.activa = true;
        bandada.aves.forEach((a) => { a.g.visible = true; });
      }
      return;
    }
    bandada.prog += dt / bandada.dur;
    centroBandada.lerpVectors(bandada.desde, bandada.hasta, bandada.prog);
    const rumbo = Math.atan2(bandada.hasta.x - bandada.desde.x, bandada.hasta.z - bandada.desde.z);
    bandada.aves.forEach((a, i) => {
      a.fase += dt * 14;
      a.g.position.copy(centroBandada).add(a.off);
      a.g.position.y += Math.sin(bandada.prog * 20 + i) * 1.5;
      a.g.rotation.set(0, rumbo, 0);
      a.alas[0].rotation.z = Math.sin(a.fase) * 0.7;
      a.alas[1].rotation.z = -Math.sin(a.fase) * 0.7;
    });
    bandada.charla -= dt;
    if (bandada.charla <= 0) { sonido.cachanas(centroBandada); bandada.charla = 1.2 + r() * 1.2; }
    if (!progreso.entradas.cachana && mirando(centroBandada, zoom ? 0.975 : 0.93, zoom ? 180 : 90)) registrar('cachana');
    if (bandada.prog >= 1) { bandada.activa = false; bandada.t = 160 + r() * 200; bandada.aves.forEach((a) => { a.g.visible = false; }); }
  }

  // ---------------------------------------------------------------- 2.1: cauquenes que migran
  // En otoño, cada tanto, una bandada en V cruza el valle alta, hacia el norte, llamándose.
  const migracion = { aves: [], activa: false, t: esperaMigracion(r), desde: new THREE.Vector3(), hasta: new THREE.Vector3(), prog: 0, dur: 1, charla: 0, pasadas: 0 };
  for (let i = 0; i < 13; i++) {
    const a = crearAveVoladora('#8a7a64', 1.1, 'cauquen');
    a.g.visible = false; escena.add(a.g);
    migracion.aves.push({ ...a, v: lugarEnLaV(i), fase: r() * 6 });
  }
  const centroMigracion = new THREE.Vector3();
  function actualizarMigracion(dt, jug, m) {
    const js = jug.estado;
    if (!migracion.activa) {
      migracion.t -= dt;
      if (migracion.t <= 0 && (m.otono || 0) > 0.5 && (m.dia || 0) > 0.4 && (m.lluvia || 0) < 0.6) lanzarMigracion(js.pos);
      else if (migracion.t <= 0) migracion.t = 30;
      return;
    }
    migracion.prog += dt / migracion.dur;
    centroMigracion.lerpVectors(migracion.desde, migracion.hasta, migracion.prog);
    const rumbo = Math.atan2(migracion.hasta.x - migracion.desde.x, migracion.hasta.z - migracion.desde.z);
    const sx = Math.sin(rumbo), sz = Math.cos(rumbo);
    migracion.aves.forEach((a, i) => {
      a.fase += dt * 8;
      // la V: detrás de la punta y a los costados, con un vaivén chiquito
      a.g.position.set(centroMigracion.x - sx * a.v.atras + sz * a.v.lateral, centroMigracion.y + Math.sin(migracion.prog * 30 + i) * 0.6, centroMigracion.z - sz * a.v.atras - sx * a.v.lateral);
      a.g.rotation.set(0, rumbo, 0);
      a.alas[0].rotation.z = Math.sin(a.fase) * 0.5;
      a.alas[1].rotation.z = -Math.sin(a.fase) * 0.5;
    });
    migracion.charla -= dt;
    if (migracion.charla <= 0) { sonido.cauquen(centroMigracion); migracion.charla = 2 + r() * 2.5; }
    if (!progreso.entradas.cauquen && mirando(centroMigracion, zoom ? 0.975 : 0.93, zoom ? 260 : 140)) registrar('cauquen');
    if (migracion.prog >= 1) { migracion.activa = false; migracion.t = esperaMigracion(r); migracion.aves.forEach((a) => { a.g.visible = false; }); }
  }
  function lanzarMigracion(pos) {
    // del sur al norte (el norte del juego es -z), pasando cerca de donde estás
    const lateral = (r() - 0.5) * 120;
    const alt = (T.altura(pos.x, pos.z) || 0) + 55 + r() * 25;
    migracion.desde.set(pos.x + lateral, alt, pos.z + 420);
    migracion.hasta.set(pos.x + lateral + (r() - 0.5) * 80, alt + 15, pos.z - 420);
    migracion.prog = 0; migracion.dur = 840 / 14; migracion.activa = true; migracion.pasadas++;
    migracion.aves.forEach((a) => { a.g.visible = true; });
  }

  // ---------------------------------------------------------------- cóndor
  // 3.4: la gorguera blanca y las cubiertas blancas del ala (que el adulto muestra incluso
  // desde abajo) ahora son parte de su malla y de sus alas (ver crearAveVoladora)
  const condor = crearAveVoladora('#1c1b1a', 3.0, 'condor');
  escena.add(condor.g);
  const condorCentro = new THREE.Vector3(T.lugares.mirador.x + 40, T.lugares.mirador.y + 95, T.lugares.mirador.z - 30);
  let condorAng = 0;
  function actualizarCondor(dt, dia) {
    condor.g.visible = dia > 0.3;
    condorAng += dt * 0.06;
    const radio = 80 + Math.sin(condorAng * 0.7) * 20;
    condor.g.position.set(condorCentro.x + Math.cos(condorAng) * radio, condorCentro.y + Math.sin(condorAng * 1.3) * 12, condorCentro.z + Math.sin(condorAng) * radio);
    condor.g.rotation.set(0, Math.atan2(-Math.sin(condorAng), Math.cos(condorAng)), 0.25);
    condor.alas[0].rotation.z = 0.08 + Math.sin(condorAng * 30) * 0.03;
    condor.alas[1].rotation.z = -0.08 - Math.sin(condorAng * 30) * 0.03;
    if (!progreso.entradas.condor && condor.g.visible && mirando(condor.g.position, zoom ? 0.985 : 0.97, zoom ? 420 : 200)) registrar('condor');
  }

  // ---------------------------------------------------------------- noche: concón
  let proxConcon = 30;

  // punto al azar alrededor del jugador para sonidos del bosque
  function puntoCercano(min, max) {
    const ang = r() * 6.28, d = min + r() * (max - min);
    // 3.5.4: el sonido pide dónde cantar desde el primer cuadro; si la fauna todavía no dio su
    // primer paso (la ventana minimizada al cargar, o pausada enseguida al perder el foco) no hay
    // cámara: se usa dónde está el que escucha (antes, error en cada cuadro de esa pausa)
    const c = cam ? cam.position : (sonido?.oyente || { x: 0, z: 0 });
    const x = c.x + Math.cos(ang) * d, z = c.z + Math.sin(ang) * d;
    return { x, y: T.altura(x, z) + 4 + r() * 8, z };
  }

  function actualizar(dt, jug, camara, estadoMundo) {
    cam = camara;
    zoom = jug.estado.zoom;
    camara.getWorldDirection(adelante);
    for (const p of pudues) actualizarPudu(p, dt, jug, estadoMundo);
    for (const c of carpinteros) {
      c.g.visible = Math.hypot(c.g.position.x - jug.estado.pos.x, c.g.position.z - jug.estado.pos.z) < 200;
      actualizarCarpintero(c, dt, jug);
    }
    // 2.0: escuchando con atención el oído llega más lejos, y el chucao más cercano
    // que todavía no anotaste canta antes: no hace falta esperar un minuto de pie.
    const afinado = estadoMundo.escuchando || 0;
    const alcanceChucao = lerp(ALCANCE_OIDO.pasando, ALCANCE_OIDO.escuchando, afinado);
    let apurar = null;
    if (afinado > 0.8 && !progreso.entradas.chucao) {
      for (const ch of chucaos) {
        const d = Math.hypot(ch.x - jug.estado.pos.x, ch.z - jug.estado.pos.z);
        if (d < alcanceChucao && (!apurar || d < apurar.d)) apurar = { ch, d };
      }
      if (apurar && apurar.ch.t > 4) apurar.ch.t = 1.5 + r() * 2.5;
    }
    for (const ch of chucaos) {
      ch.t -= dt;
      if (ch.t <= 0) {
        const d = Math.hypot(ch.x - jug.estado.pos.x, ch.z - jug.estado.pos.z);
        if (d < Math.max(90, alcanceChucao) && estadoMundo.dia > 0.25 && estadoMundo.lluvia < 0.7) {
          sonido.chucao(ch);
          if (d < alcanceChucao && !progreso.entradas.chucao) setTimeout(() => registrar('chucao'), 1800);
        }
        ch.t = 22 + r() * 45;
      }
    }
    actualizarBandada(dt, jug, estadoMundo.dia);
    actualizarMigracion(dt, jug, estadoMundo);
    actualizarCondor(dt, estadoMundo.dia);
    proxConcon -= dt;
    if (proxConcon <= 0) {
      if (estadoMundo.noche > 0.7 && estadoMundo.lluvia < 0.5) {
        sonido.concon(puntoCercano(25, 60));
        if (!progreso.entradas.concon) setTimeout(() => registrar('concon'), 3000);
      }
      proxConcon = 45 + r() * 70;
    }
  }

  function sujetos() {
    poolSujetos.reiniciar();
    for (const p of pudues) if (p.g.visible) poolSujetos.agregar('pudu', p.pos, 0.35);
    for (const c of carpinteros) if (c.g.visible) poolSujetos.agregar('carpintero', c.g.position);
    if (bandada.activa) poolSujetos.agregar('cachana', centroBandada);
    if (condor.g.visible) poolSujetos.agregar('condor', condor.g.position);
    return listaSujetos;
  }

  // Lo que se puede oír en el valle y dónde está, para escuchar con atención. El concón
  // no tiene lugar fijo: de noche canta desde cualquier lado y se anota solo.
  function fuentesDeCanto(estadoMundo = {}) {
    const lista = [];
    if ((estadoMundo.dia ?? 1) > 0.25) for (const ch of chucaos) lista.push({ especie: 'chucao', x: ch.x, z: ch.z });
    for (const c of carpinteros) lista.push({ especie: 'carpintero', x: c.g.position.x, z: c.g.position.z });
    return lista;
  }

  // 2.1: el grabador (ver `grabador.js`). Las que se pueden mover vienen a ver quién
  // canta en su territorio: el carpintero se muda a un tronco cerca tuyo y la bandada
  // de cachañas te pasa por arriba. Devuelve si alguna se puso en camino.
  function llamar(especie, pos) {
    if (especie === 'carpintero') {
      let c = null, d0 = ALCANCE_RESPUESTA;
      for (const x of carpinteros) {
        const d = Math.hypot(x.g.position.x - pos.x, x.g.position.z - pos.z);
        if (!x.volando && d < d0) { d0 = d; c = x; }
      }
      if (!c) return false;
      const meta = adondeViene(c.g.position, pos, r);
      // Cualquier coihue o lenga grande sirve, no sólo las posadas de siempre: ésas
      // están a 45 m una de otra y la más cercana podía quedar más lejos que el
      // carpintero mismo, que entonces «venía» alejándose.
      // Para venir a ver le alcanza un árbol mediano, y el ñire también le sirve.
      let arbol = null, da = Infinity;
      for (const a of veg.arboles) {
        if (a.sacado || a.esc < 0.7 || !(a.especie === 'coihue' || a.especie === 'lenga' || a.especie === 'nire')) continue;
        if (a === c.posada || carpinteros.some((x) => x !== c && x.posada === a)) continue;
        const d = Math.hypot(a.x - meta.x, a.z - meta.z);
        if (d < da) { da = d; arbol = a; }
      }
      if (!arbol || Math.hypot(arbol.x - pos.x, arbol.z - pos.z) >= d0) return false;
      c.volando = { desde: c.g.position.clone(), hasta: new THREE.Vector3(arbol.x, arbol.y + 5, arbol.z), dur: Math.max(2, Math.hypot(arbol.x - c.g.position.x, arbol.z - c.g.position.z) / 10), t: 0, arbol };
      c.g.rotation.y = Math.atan2(arbol.x - c.g.position.x, arbol.z - c.g.position.z);
      c.t = c.volando.dur + 1.5;                       // al llegar, golpetea enseguida
      return true;
    }
    if (especie === 'cachana') {
      // te pasa por arriba, bajita, viniendo del lado donde andaba (o de cualquiera)
      const ang = r() * 6.28;
      const alt = (T.altura(pos.x, pos.z) || 0) + 14 + r() * 6;
      bandada.desde.set(pos.x + Math.cos(ang) * 200, alt + 8, pos.z + Math.sin(ang) * 200);
      bandada.hasta.set(pos.x - Math.cos(ang) * 200, alt + 12, pos.z - Math.sin(ang) * 200);
      bandada.prog = 0; bandada.dur = 400 / 17; bandada.activa = true;
      bandada.aves.forEach((a) => { a.g.visible = true; });
      return true;
    }
    return false;
  }

  return { actualizar, puntoCercano, pudues, carpinteros, sujetos, fuentesDeCanto, chucaos, llamar, migracion, lanzarMigracion, condor, bandada };
}
