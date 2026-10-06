// 3.7.2 (granja): la granja en el mundo (las reglas, en granja.js; el enganche, en granja-juego.js):
//   · la vaca lechera, overa negra o colorada, con su ubre, el cencerro y el ternero al pie. De día pasta frente al
//     tambo, a veces se echa a rumiar; de noche duerme echada en el tambo. Se queda quieta mientras la ordeñás y
//     aparece el balde;
//   · la chancha y los lechones, adentro del chiquero: hozan, se arriman a la batea y de noche se echan en la casilla;
//   · los corderos de tu corral: la oveja de majada-mundo.js, más chica, con la cabeza grande, las patas largas y el
//     vellón corto; van detrás de su madre y pegan saltitos;
//   · los frutales (manzano, peral, ciruelo, cerezo; frambuesa y grosella en mata) con las mismas cartas de hojas
//     pintadas y el mismo material del bosque (vegetacion.js, sin tocar su lógica): crecen, florecen en primavera,
//     dan fruta, en otoño se ponen colorados y en invierno quedan pelados (eso lo hace el material, con la estación).
// Lo que cuesta: los animales van instanciados (cada especie, cuatro mallas: el cuerpo, la cabeza, las patas de
// adelante y las de atrás, para todos los que haya) con MAT_FAUNA; los frutales, una malla instanciada por especie y
// por cómo está (en flor, con fruta, con hojas; en invierno, pelados y sin fruta). Las mallas se crean al cargar (vacías, así el programa se
// compila con todo lo demás) y la geometría se arma la primera vez que hace falta. Lejos no se dibuja nada.
import * as THREE from 'three';
import { compactar, MAT_FAUNA, inclinacionTerrenoMamifero, marchaMamifero } from './vida.js';
import { bola, miembro, tubo, torno, lomo, pata, deformar, pintar, ruido3, matiz, color as colorPieza } from './formas.js';
import { mallaOveja } from './majada-mundo.js';
import { ConstructorArbol, racimo, rama, fuste, conCartas, texturaCartas, CELDAS_CARTA } from './vegetacion.js';
import { materialVegetal } from './materiales.js';
import { matriz } from './geometria.js';
import { rng, lerp, clamp } from './ruido.js';
import { TAMBO, CHIQUERO } from './planos-granja.js';
import { FRUTALES, ORDEN_FRUTALES, GRANJA } from './granja.js';

const VER = 130;          // a cuántos metros se ve la granja
const ANIMAR = 70;        // a cuántos metros se mueven los animales (más lejos quedan quietos)
const suave = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const enMundo = (l, lx, lz) => ({ x: l.x + lx * Math.cos(l.rot) + lz * Math.sin(l.rot), z: l.z - lx * Math.sin(l.rot) + lz * Math.cos(l.rot) });

// ================================================================ los animales
// La vaca overa (Holando de campo): lomo derecho, barril hondo, la cadera angulosa (los ganchos y los isquiones se
// marcan), la ubre rosada con sus cuatro pezones, la cola fina con la borla blanca, la cabeza larga de morro ancho,
// las orejas de costado y el cencerro colgado de una correa. `ternero`: sin ubre, sin cencerro, sin la cadera marcada.
function modeloVaca(pelaje, ternero = false) {
  const g = new THREE.Group();
  const blanco = '#ebe4d6', mancha = pelaje === 'colorada' ? '#7c3b20' : '#1e1c1b', rosa = '#d6a196', pezuna = '#2b2520';
  const cB = new THREE.Color(blanco), cM = new THREE.Color(mancha);
  // el overo: manchones grandes y de borde quebrado; las patas abajo y la panza, blancas
  const overo = (c, p, n) => {
    // (manchones grandes: el ruido a escala de medio metro, con un borde quebrado más fino)
    let k = ruido3(p.x * 0.34 + 3.1, p.y * 0.3 + 0.7, p.z * 0.31 + 1.9) + 0.22 * ruido3(p.x * 1.3 + 2, p.y * 1.2, p.z * 1.25 + 4) + 0.05 * ruido3(p.x * 4, p.y * 4, p.z * 4) + 0.12;
    if (p.y < 0.55) k -= (0.55 - p.y) * 3.2;
    if (n.y < -0.5 && p.y < 0.8) k -= 0.7;
    if (p.z < -0.9 && p.y < 1.1) k -= 0.4;   // el anca de atrás, clara
    c.copy(cB).lerp(cM, suave(0.0, 0.1, k));
    c.multiplyScalar(1 + 0.07 * Math.max(0, n.y) - 0.05 * Math.max(0, -n.y));
  };
  const conOvero = (m) => pintar(m, overo);
  // la cara: del color de la mancha, con el lucero blanco en la frente
  const cara = (c, p, n) => {
    c.copy(cM);
    if (Math.abs(p.x) < 0.03 + Math.max(0, p.y - 1.08) * 0.3 && p.y > 0.93 && n.z > 0.25) c.copy(cB);   // el lucero y la lista
    c.multiplyScalar(1 + 0.06 * Math.max(0, n.y));
  };
  // ---- el cuerpo: barril hondo, lomo derecho
  g.add(conOvero(lomo(blanco, { y: 0.98, atras: -0.98, adelante: 0.86, ancho: 0.34, alto: 0.4, pecho: 0.1, panza: -0.14, grupa: 0 }, 20)));
  g.add(conOvero(bola(blanco, [0.17, 0.1, 0.34], [0, 1.27, 0.4])));                              // la cruz
  g.add(conOvero(bola(blanco, [0.28, 0.11, 0.32], [0, 1.25, -0.62])));                            // el anca
  g.add(conOvero(bola(blanco, [0.3, 0.32, 0.22], [0, 1.02, -0.8])));                              // las nalgas: el anca cuadrada de la lechera
  if (!ternero) {
    // la ubre y los pezones
    g.add(pintar(bola(rosa, [0.15, 0.12, 0.19], [0, 0.56, -0.47]), (c, p) => { c.multiplyScalar(0.92 + 0.12 * suave(0.45, 0.66, p.y)); }));
    for (const lx of [-0.06, 0.06]) for (const lz of [-0.39, -0.55]) g.add(tubo(matiz(rosa, 0.85), 0.017, 0.014, 0.08, [lx, 0.42, lz], null, 6, true));
    // el cencerro: la correa de cuero alrededor del pescuezo y la campana de bronce
    const correa = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 5, 22), colorPieza('#4a2e1c'));
    correa.position.set(0, 1.04, 0.86); correa.rotation.set(-0.45, 0, 0); correa.scale.set(0.82, 1.05, 1);
    g.add(correa);
    g.add(torno('#8c6a30', [[0.0, -0.075], [0.05, -0.07], [0.047, -0.02], [0.035, 0.03], [0.018, 0.055], [0.0, 0.058]], [0, 0.78, 1.0], [0.25, 0, 0], [1, 1, 0.85], 10));
    g.add(bola('#3a2c18', [0.012, 0.02, 0.012], [0, 0.69, 1.0]));
  }
  // la cola fina, que cae hasta el garrón, con la borla blanca
  g.add(conOvero(miembro(blanco, [[0, 1.3, -0.94], [0, 1.18, -1.02], [0, 0.9, -1.04], [0, 0.6, -1.02]], [0.035, 0.03, 0.024, 0.02], 10, 7)));
  g.add(pintar(bola(blanco, [0.045, 0.12, 0.045], [0, 0.5, -1.01]), (c, p) => { c.multiplyScalar(0.92 + 0.15 * Math.sin(p.x * 200 + p.z * 90)); }));
  // ---- el pescuezo y la cabeza (se mueven juntos al pastar), colgados del pecho
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.92, 0.72);
  // (el pescuezo corto y hondo, casi horizontal; la cabeza ancha, colgada hacia abajo: así se lee vaca y no caballo)
  const cuello = miembro(blanco, [[0, 0.06, -0.22], [0, 0.12, 0.04], [0, 0.18, 0.24], [0, 0.23, 0.4]], [0.32, 0.27, 0.22, 0.18], 10, 14);
  cuello.scale.set(0.74, 1, 1);
  cabeza.add(conOvero(cuello));
  cabeza.add(conOvero(bola(blanco, [0.035, 0.09, 0.17], [0, 0.0, 0.15], [0.3, 0, 0])));       // la papada
  const testa = miembro(mancha, [[0, 0.3, 0.44], [0, 0.18, 0.56], [0, 0.03, 0.68], [0, -0.1, 0.77]], [0.16, 0.15, 0.13, 0.115], 10, 12);
  testa.scale.set(0.88, 1, 1);
  cabeza.add(pintar(testa, cara));
  cabeza.add(pintar(bola(mancha, [0.15, 0.1, 0.1], [0, 0.31, 0.45]), cara));                    // la frente ancha
  cabeza.add(pintar(bola(mancha, [0.085, 0.11, 0.12], [0, 0.08, 0.6]), cara));                   // la quijada
  cabeza.add(bola(rosa, [0.12, 0.085, 0.095], [0, -0.13, 0.8]));                                // el morro
  for (const l of [-1, 1]) {
    cabeza.add(bola('#2a1c18', [0.02, 0.014, 0.01], [l * 0.05, -0.12, 0.885]));                 // los ollares
    cabeza.add(bola('#0d0a08', [0.024, 0.028, 0.028], [l * 0.125, 0.2, 0.57]));                 // los ojos
    // la oreja: ancha y chata, de costado y un poco caída (como una hoja)
    cabeza.add(pintar(bola(mancha, [0.11, 0.028, 0.06], [l * 0.22, 0.26, 0.47], [0.2, l * 0.15, -l * 0.35]), (c, p, n) => { c.copy(cM); if (n.z > 0.3) c.lerp(new THREE.Color('#c9958c'), 0.5); }));
  }
  g.add(cabeza);
  // ---- las patas: rodilla adelante, garrón atrás; la pezuña partida
  const patas = [];
  for (const [px, pz] of [[-0.19, 0.58], [0.19, 0.58], [-0.19, -0.62], [0.19, -0.62]]) {
    const del = pz > 0, L = del ? 0.88 : 0.94;
    const piv = new THREE.Group(); piv.position.set(px, L, pz);
    piv.add(conOvero(pata(blanco, L, del, del ? 0.1 : 0.12, 10)));
    for (const l of [-1, 1]) piv.add(bola(pezuna, [0.03, 0.035, 0.05], [l * 0.024, -L + 0.02, 0.035]));
    g.add(piv); patas.push(piv);
  }
  compactar(g, { alto: 1.4, pie: 0.86, panza: 0.08, todo: true });
  return { g, cabeza, patas };
}

// La chancha criolla: barril bajo de lomo un poco arqueado, la cabeza grande en cuña con la jeta chata, las
// orejas caídas sobre los ojos, patas cortas de pezuña partida y la cola enrulada. Rosada con manchas negras.
function modeloChancho() {
  const g = new THREE.Group();
  const piel = '#f2b4a4', mancha = '#2c2523', jeta = '#de8f82';
  const cP = new THREE.Color(piel), cM = new THREE.Color(mancha);
  const overo = (c, p, n) => {
    // (manchas redondas, de un palmo: el ruido a escala de la mancha)
    const k = ruido3(p.x * 0.75 + 1.3, p.y * 0.7, p.z * 0.68 + 2.2) + 0.25 * ruido3(p.x * 2.2, p.y * 2.2 + 1, p.z * 2.1);
    c.copy(cP).lerp(cM, suave(0.42, 0.5, k));
    c.multiplyScalar((1 + 0.07 * Math.max(0, n.y) - 0.08 * Math.max(0, -n.y)) * (0.97 + 0.05 * Math.sin(p.z * 160 + p.x * 70)));
  };
  const conOvero = (m) => pintar(m, overo);
  g.add(conOvero(lomo(piel, { y: 0.4, atras: -0.52, adelante: 0.5, ancho: 0.27, alto: 0.25, pecho: 0.05, panza: -0.12, grupa: 0.1 }, 18)));
  for (const l of [-1, 1]) for (let i = 0; i < 4; i++) g.add(bola(matiz(piel, 0.9), [0.018, 0.014, 0.018], [l * 0.075, 0.165, -0.2 + i * 0.13]));   // las tetas
  // la cola enrulada
  g.add(conOvero(miembro(piel, [[0, 0.56, -0.52], [0.03, 0.6, -0.58], [0, 0.64, -0.6], [-0.03, 0.6, -0.6], [0, 0.57, -0.62]], [0.02, 0.016, 0.014, 0.012, 0.01], 10, 6)));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.45, 0.46);
  const testa = miembro(piel, [[0, 0.04, -0.06], [0, 0.03, 0.08], [0, -0.02, 0.2], [0, -0.06, 0.3]], [0.17, 0.15, 0.11, 0.075], 10, 14);
  testa.scale.set(0.92, 0.95, 1);
  cabeza.add(conOvero(testa));
  cabeza.add(conOvero(bola(piel, [0.12, 0.09, 0.1], [0, -0.06, 0.05])));        // la papada
  // la jeta: un disco chato con los dos agujeros
  cabeza.add(torno(jeta, [[0.0, -0.02], [0.07, -0.02], [0.075, 0.0], [0.07, 0.02], [0.0, 0.022]], [0, -0.065, 0.34], [Math.PI / 2, 0, 0], [1, 1, 0.8], 14));
  for (const l of [-1, 1]) {
    cabeza.add(bola('#3a2420', [0.012, 0.016, 0.006], [l * 0.025, -0.065, 0.36]));
    cabeza.add(bola('#0c0908', [0.014, 0.012, 0.012], [l * 0.078, 0.06, 0.15]));
    // la oreja caída hacia adelante, sobre el ojo
    cabeza.add(conOvero(bola(piel, [0.07, 0.014, 0.1], [l * 0.1, 0.12, 0.14], [0.6, 0, -l * 0.5])));
  }
  g.add(cabeza);
  const patas = [];
  for (const [px, pz] of [[-0.13, 0.33], [0.13, 0.33], [-0.13, -0.33], [0.13, -0.33]]) {
    const del = pz > 0, L = del ? 0.27 : 0.29;
    const piv = new THREE.Group(); piv.position.set(px, L, pz);
    piv.add(conOvero(pata(piel, L, del, del ? 0.078 : 0.09, 9)));
    for (const l of [-1, 1]) piv.add(bola('#3a2c26', [0.018, 0.022, 0.03], [l * 0.016, -L + 0.012, 0.018]));
    g.add(piv); patas.push(piv);
  }
  compactar(g, { alto: 0.7, pie: 0.86, panza: 0.1, todo: true });
  return { g, cabeza, patas };
}

// El cordero: la oveja de majada-mundo.js (cara blanca), con el vellón corto de recién nacido fundido en el cuerpo
// (la oveja lo lleva aparte porque se esquila; el cordero no). Lo de cordero (cabeza grande, patas largas) va en
// cómo se pone cada uno (ver `poner`).
function modeloCordero() {
  const m = mallaOveja(false, rng(9201));
  const lana = m.vellon.children[0];
  const geo = lana.geometry.clone();
  lana.updateMatrix(); m.vellon.updateMatrix();
  geo.applyMatrix4(lana.matrix);
  geo.scale(0.94, 0.92, 0.9);
  geo.applyMatrix4(m.vellon.matrix);
  // el color del vellón corto: crema, con los rulos marcados y más oscuro abajo
  const P = geo.attributes.position, N = geo.attributes.normal, col = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    c.set('#efe7d6').multiplyScalar(0.9 + 0.12 * ruido3(x * 20, y * 20, z * 20) + 0.05 * Math.max(0, N.getY(i)) - 0.12 * Math.max(0, -N.getY(i)));
    c.multiplyScalar(0.86 + 0.14 * suave(0.35, 0.7, y));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // las patas del cordero, claras (las de la oveja son pardas), con la pezuña oscura
  const claro = new THREE.Color('#d8cfbf');
  for (const piv of [m.patas[0], m.patas[2]]) {
    const gp = piv.children.find((o) => o.isMesh)?.geometry;
    const C = gp?.attributes.color, PP = gp?.attributes.position;
    if (!C) continue;
    for (let i = 0; i < C.count; i++) { if (PP.getY(i) < -0.4) continue; c.setRGB(C.getX(i), C.getY(i), C.getZ(i)).lerp(claro, 0.75); C.setXYZ(i, c.r, c.g, c.b); }
  }
  if (geo.index) { const sin = geo.toNonIndexed(); geo.dispose(); return { ...m, cuerpoGeo: sin }; }
  return { ...m, cuerpoGeo: geo };
}

// Las cuatro piezas de un modelo ya fundido: el cuerpo (en el espacio de la figura), la cabeza y las patas (en el
// de su grupo, con dónde va cada grupo).
function partesDe(mod) {
  const geoDe = (grupo) => grupo.children.find((o) => o.isMesh && o.material === MAT_FAUNA)?.geometry || null;
  const cuerpo = mod.cuerpoGeo || geoDe(mod.g);
  return {
    cuerpo, cabeza: geoDe(mod.cabeza), del: geoDe(mod.patas[0]), tras: geoDe(mod.patas[2]),
    posCabeza: mod.cabeza.position.clone(), piv: mod.patas.map((p) => p.position.clone()),
  };
}
// una geometría vacía con los mismos atributos (para crear las mallas al cargar)
function geoVacia(extra = null) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([], 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute([], 3));
  if (extra) for (const [k, n] of extra) g.setAttribute(k, new THREE.Float32BufferAttribute([], n));
  return g;
}

// Un rebaño instanciado: cuatro mallas (cuerpo, cabeza, patas de adelante y de atrás). `cuerpos`: cuántos cuerpos
// distintos (la vaca y el ternero: el ternero no tiene ubre ni cencerro).
function crearRebano(escena, nombre, max, cuerpos = 1) {
  const mk = (n, sombra) => { const m = new THREE.InstancedMesh(geoVacia(), MAT_FAUNA, n); m.count = 0; m.frustumCulled = false; m.castShadow = sombra; m.name = nombre; escena.add(m); return m; };
  const r = { cuerpos: Array.from({ length: cuerpos }, () => mk(max, true)), cabeza: mk(max, false), del: mk(max * 2, false), tras: mk(max * 2, false), partes: null, n: 0, nc: new Array(cuerpos).fill(0) };
  return r;
}
function armarRebano(r, partes, cuerposExtra = []) {
  r.partes = partes;
  const poner = (m, geo) => { if (!geo) return; m.geometry.dispose(); m.geometry = geo; };
  poner(r.cuerpos[0], partes.cuerpo);
  cuerposExtra.forEach((geo, i) => poner(r.cuerpos[i + 1], geo));
  poner(r.cabeza, partes.cabeza); poner(r.del, partes.del); poner(r.tras, partes.tras);
}
const _M = new THREE.Matrix4(), _P = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Matrix4();
// Pone un animal: `a` = { x, y, z, rumbo, pitch, roll, cab (giro de la cabeza), giroCab, paso, amp, posterior,
// echado (0..1) }. `forma` = { s (tamaño), cab (tamaño de la cabeza), piernas (largo de las patas), cuerpo (cuál) }.
function poner(r, a, forma) {
  const P = r.partes, s = forma.s, piernas = forma.piernas ?? 1;
  const alzar = (piernas - 1) * P.piv[0].y * s;           // con las patas más largas, el cuerpo más alto
  const bajar = a.echado * P.piv[0].y * s * piernas * 0.72; // echado, el cuerpo baja casi hasta el suelo
  _e.set(a.pitch || 0, a.rumbo, a.roll || 0, 'YXZ');
  _q.setFromEuler(_e);
  _M.compose(_v.set(a.x, a.y + alzar - bajar + (a.salto || 0), a.z), _q, _s.set(s, s, s));
  const ic = r.nc[forma.cuerpo || 0]++;
  r.cuerpos[forma.cuerpo || 0].setMatrixAt(ic, _M);
  // la cabeza: de su lugar, girada (pastar, hozar) y del tamaño que va
  const k = forma.cab ?? 1;
  _e.set(a.cab || 0, a.giroCab || 0, 0, 'YXZ'); _q.setFromEuler(_e);
  _P.compose(P.posCabeza, _q, _s.set(k, k, k));
  r.cabeza.setMatrixAt(r.n, _c.multiplyMatrices(_M, _P));
  // las patas: de su pivote, con el paso; echado, dobladas abajo del cuerpo
  for (let i = 0; i < 4; i++) {
    const del = i < 2;
    const fase = (i % 2 ? Math.PI : 0) + (del ? 0 : a.posterior || 0);
    let giro = a.amp ? Math.sin((a.paso || 0) + fase) * a.amp : 0;
    if (a.echado > 0) giro = lerp(giro, del ? 1.45 : -1.35, a.echado);   // echado: las de adelante dobladas abajo del pecho, las de atrás hacia adelante
    _e.set(giro, 0, 0, 'YXZ'); _q.setFromEuler(_e);
    const pv = P.piv[i];
    _P.compose(_v.set(pv.x, pv.y * piernas, pv.z), _q, _s.set(1, piernas * (1 - a.echado * 0.35), 1));
    (del ? r.del : r.tras).setMatrixAt(r.n * 2 + (i % 2), _c.multiplyMatrices(_M, _P));
  }
  r.n++;
}
function cerrarRebano(r) {
  // (las matrices se suben sólo si hay alguno, o si recién se fueron todos)
  const subir = (m, n) => { if (n || m.count) m.instanceMatrix.needsUpdate = true; m.count = n; };
  r.cuerpos.forEach((m, i) => subir(m, r.nc[i]));
  subir(r.cabeza, r.n); subir(r.del, r.n * 2); subir(r.tras, r.n * 2);
}
function vaciarRebano(r) { r.n = 0; r.nc.fill(0); }

// ================================================================ los frutales
// Cada especie con su porte: el manzano bajo y abierto, el peral alto y derecho, el ciruelo redondo y chico, el
// cerezo de corteza rojiza anillada y copa alta; la frambuesa en cañas arqueadas y el grosellero en mata.
// `estado`: 'hoja' | 'flor' | 'fruta' (en invierno no hay fruta: ni en el árbol ni en el piso). Todo en el mismo constructor del bosque (las cartas pintadas).
const FORMA_FRUTAL = {
  manzano: { semilla: 71, tronco: 1.0, r0: 0.13, brazos: 4, abre: 1.05, altoCopa: [1.9, 2.5], rCopa: 0.85, color: '#5c8a35', corteza: '#5a4838', flor: '#ffc4cf', fruta: '#c0302a', fruta2: '#d89a36', rFruta: 0.062, nFruta: 26, forma: [1, 1, 1] },
  peral: { semilla: 83, tronco: 1.5, r0: 0.12, brazos: 4, abre: 0.7, altoCopa: [2.3, 3.4], rCopa: 0.72, color: '#4c7e33', corteza: '#4e443b', flor: '#fff0dc', fruta: '#d2bd4c', fruta2: '#a8b03c', rFruta: 0.055, nFruta: 22, forma: [0.85, 1.35, 0.85] },
  ciruelo: { semilla: 97, tronco: 0.85, r0: 0.1, brazos: 5, abre: 0.95, altoCopa: [1.6, 2.2], rCopa: 0.75, color: '#4d7030', corteza: '#3e3330', flor: '#fff0e4', fruta: '#5a2552', fruta2: '#86507e', rFruta: 0.042, nFruta: 30, forma: [1, 0.95, 1] },
  cerezo: { semilla: 109, tronco: 1.4, r0: 0.12, brazos: 5, abre: 0.9, altoCopa: [2.3, 3.2], rCopa: 0.8, color: '#5e9038', corteza: '#6b3a30', flor: '#ffd6e0', fruta: '#9c1422', fruta2: '#c02a30', rFruta: 0.032, nFruta: 44, forma: [1, 1.05, 1] },
  frambuesa: { semilla: 127, mata: true, canas: 9, altoMata: 1.35, color: '#5b8a3a', corteza: '#7a5a3c', flor: '#f4f1ea', fruta: '#c42c48', fruta2: '#d8506a', rFruta: 0.022, nFruta: 34 },
  grosella: { semilla: 131, mata: true, canas: 7, altoMata: 1.05, color: '#5f9040', corteza: '#6a5440', flor: '#e8e4c8', fruta: '#d42a26', fruta2: '#f05a4a', rFruta: 0.017, nFruta: 28 },
};
const TIPO_HOJA = 2, TIPO_FLOR = 3;
// las piezas de fruta y de flor, sobre los racimos (con su propio azar: el árbol es el mismo en los cuatro estados)
function frutaSobre(c, F, racimos, estado, r) {
  // (la fruta chica, con menos lados: de cerca igual se lee redonda y no suma triángulos de más)
  const esfera = F.rFruta < 0.035 ? new THREE.SphereGeometry(1, 6, 4) : new THREE.SphereGeometry(1, 9, 6);
  const color = new THREE.Color();
  for (let i = 0; i < F.nFruta; i++) {
    const k = racimos[i % racimos.length];
    // del lado de afuera y un poco abajo de cada racimo (se ven entre las hojas)
    // (en la cáscara del racimo, del lado de afuera y de la mitad para abajo: la fruta asoma entre las hojas y cuelga)
    const afuera = Math.atan2(k.cen[2], k.cen[0]);
    const a = (k.cen[0] || k.cen[2] ? afuera : 0) + (r() - 0.5) * (F.mata ? 6.28 : 2.6), b = 0.1 - r() * 0.85, f = 1.0 + r() * 0.08;
    const x = k.cen[0] + Math.cos(a) * Math.sqrt(1 - b * b) * k.rad[0] * f, y = k.cen[1] + b * k.rad[1] * f, z = k.cen[2] + Math.sin(a) * Math.sqrt(1 - b * b) * k.rad[2] * f;
    color.set(r() < 0.65 ? F.fruta : F.fruta2);
    const rf = F.rFruta * (0.85 + r() * 0.3);
    if (F === FORMA_FRUTAL.cerezo) {
      // de a pares, colgando del cabito
      for (const s of [-1, 1]) c.agregar(esfera, { color, tipo: 4, suave: true, variar: 0.1, matriz: matriz([x + s * rf * 1.1, y - rf, z], [0, 0, 0], [rf, rf, rf]) });
      c.agregar(new THREE.CylinderGeometry(0.004, 0.004, rf * 3, 3), { color: '#4e6a2e', tipo: 0, matriz: matriz([x, y + rf * 0.4, z]) });
    } else if (F.mata) {
      // racimitos de bolitas (la grosella, en hilera colgante; la frambuesa, apretadas)
      const nb = F === FORMA_FRUTAL.grosella ? 4 : 2;
      for (let j = 0; j < nb; j++) c.agregar(esfera, { color, tipo: 4, suave: true, variar: 0.1, matriz: matriz([x + (r() - 0.5) * rf, y - j * rf * 1.7, z + (r() - 0.5) * rf], [0, 0, 0], [rf, rf * (F === FORMA_FRUTAL.frambuesa ? 1.25 : 1), rf]) });
    } else {
      const alto = F === FORMA_FRUTAL.peral ? 1.35 : F === FORMA_FRUTAL.ciruelo ? 1.12 : 0.95;
      c.agregar(esfera, { color, tipo: 4, suave: true, variar: 0.1, matriz: matriz([x, y, z], [r() * 0.4, r() * 6, 0], [rf, rf * alto, rf]) });
      if (F === FORMA_FRUTAL.peral) c.agregar(esfera, { color, tipo: 4, suave: true, variar: 0.1, matriz: matriz([x, y + rf * 0.9, z], [0, 0, 0], [rf * 0.62, rf * 0.75, rf * 0.62]) });
    }
  }
}
function florSobre(c, F, racimos, r) {
  const col = new THREE.Color(F.flor), n = F.mata ? 26 : 70;
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const k = racimos[i % racimos.length];
    const yy = 1 - 2 * r() * 0.85, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = r() * Math.PI * 2;
    const x = k.cen[0] + Math.cos(a) * rr * k.rad[0] * 1.02, y = k.cen[1] + yy * k.rad[1] * 1.02, z = k.cen[2] + Math.sin(a) * rr * k.rad[2] * 1.02;
    p.set(x - k.cen[0], (y - k.cen[1]) + 0.3, z - k.cen[2]).normalize();
    const tam = (F.mata ? 0.09 : 0.17) * (0.8 + r() * 0.4);
    const t = col.clone().multiplyScalar(0.9 + r() * 0.12);
    // una carta de la celda densa, blanca o rosada: de lejos, la copa nevada de flor
    cartaFlor(c, x, y, z, p, tam, (dy) => t.clone().multiplyScalar(dy < 0 ? 0.86 : 1));
  }
}
// (la carta de vegetacion.js, con el tipo de flor: se cierra en invierno)
function cartaFlor(c, x, y, z, n, tam, tinte) {
  const celda = CELDAS_CARTA.densa, cu = (celda % 4) * 0.25, cv = Math.floor(celda / 4) / 4;
  const esq = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const col = tinte(sy);
    esq.push([sx * tam, sy * tam, cu + (0.03 + (sx * 0.5 + 0.5) * 0.94) * 0.25, cv + (0.03 + (0.5 - sy * 0.5) * 0.94) / 4, col.r, col.g, col.b]);
  }
  for (const j of [0, 1, 2, 0, 2, 3]) { const e = esq[j]; c.vertice(x, y, z, n.x, n.y, n.z, e[4], e[5], e[6], TIPO_FLOR, e[0], e[1], e[2], e[3]); }
}
export function geometriaFrutal(especie, estado = 'hoja') {
  const F = FORMA_FRUTAL[especie] || FORMA_FRUTAL.manzano;
  const r = rng(F.semilla), c = new ConstructorArbol(), racimos = [];
  if (F.mata) {
    // las cañas, arqueadas hacia afuera, con sus racimitos de hojas
    for (let i = 0; i < F.canas; i++) {
      const a = (i / F.canas) * Math.PI * 2 + r() * 0.5, alto = F.altoMata * (0.75 + r() * 0.35), abre = 0.25 + r() * 0.3;
      const base = [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05], medio = [Math.cos(a) * abre * 0.6, alto * 0.7, Math.sin(a) * abre * 0.6], punta = [Math.cos(a) * abre, alto * (0.92 + r() * 0.1), Math.sin(a) * abre];
      rama(c, base, medio, 0.018, 0.014, F.corteza, 4);
      rama(c, medio, punta, 0.014, 0.008, F.corteza, 4);
      for (const t of [0.45, 0.75, 1]) {
        const cen = [base[0] + (punta[0] - base[0]) * t + (r() - 0.5) * 0.1, alto * t * 0.95, base[2] + (punta[2] - base[2]) * t + (r() - 0.5) * 0.1];
        const rad = [0.2 + r() * 0.06, 0.15, 0.2 + r() * 0.06];
        racimo(c, F.semilla * 13 + i * 7 + Math.round(t * 10), cen, rad, { color: F.color, tipo: TIPO_HOJA, detalle: true, celda: CELDAS_CARTA.abierta, cartas: 6, tam: 0.62, luz: 0.92 + 0.1 * t });
        racimos.push({ cen, rad });
      }
    }
  } else {
    const curva = [(r() - 0.5) * 0.35, (r() - 0.5) * 0.35];
    fuste(c, F.tronco + 0.25, F.r0, F.r0 * 0.7, curva, 8, 4, F.corteza, F.semilla, especie === 'cerezo' ? { placas: true } : {});
    const horq = [curva[0], F.tronco, curva[1]];
    let ang = r() * Math.PI * 2;
    for (let i = 0; i < F.brazos; i++) {
      const t = i / Math.max(1, F.brazos - 1);
      const y = F.altoCopa[0] + (F.altoCopa[1] - F.altoCopa[0]) * (i % 2 ? t : 1 - t) * 0.85;
      const d = F.rCopa * F.abre * (0.85 + r() * 0.3);
      const cen = [horq[0] + Math.cos(ang) * d, y, horq[2] + Math.sin(ang) * d];
      const rx = F.rCopa * (0.85 + r() * 0.25);
      const rad = [rx * F.forma[0], rx * 0.68 * F.forma[1], rx * F.forma[2]];
      rama(c, horq, [cen[0] - Math.cos(ang) * rx * 0.25, cen[1] - rad[1] * 0.25, cen[2] - Math.sin(ang) * rx * 0.25], F.r0 * 0.62, 0.03, F.corteza, 5);
      racimo(c, F.semilla * 11 + i * 17, cen, rad, { color: i % 2 ? F.color : matiz(F.color, 1.08), tipo: TIPO_HOJA, detalle: true, celda: CELDAS_CARTA.densa, cartas: 13, tam: 0.5, luz: 0.9 + 0.1 * t });
      racimos.push({ cen, rad });
      ang += (Math.PI * 2) / F.brazos + (r() - 0.5) * 0.5;
    }
    // la cima
    const cima = [horq[0], F.altoCopa[1] + F.rCopa * 0.45 * F.forma[1], horq[2]];
    const radC = [F.rCopa * 0.75 * F.forma[0], F.rCopa * 0.55 * F.forma[1], F.rCopa * 0.75 * F.forma[2]];
    rama(c, horq, [cima[0], cima[1] - radC[1] * 0.4, cima[2]], F.r0 * 0.55, 0.025, F.corteza, 5);
    racimo(c, F.semilla * 11 + 99, cima, radC, { color: matiz(F.color, 1.1), tipo: TIPO_HOJA, detalle: true, celda: CELDAS_CARTA.densa, cartas: 11, tam: 0.5, luz: 1.02 });
    racimos.push({ cen: cima, rad: radC });
  }
  const r2 = rng(F.semilla * 3 + 5);
  if (estado === 'flor') florSobre(c, F, racimos, r2);
  else if (estado === 'fruta') frutaSobre(c, F, racimos, estado, r2);
  const geo = c.geometria();
  geo.userData.racimos = racimos.length;
  return geo;
}

// ================================================================ el mundo de la granja
// `ctx`: { T, escena, col? (las colisiones: los animales no atraviesan paredes) }
export function crearGranjaMundo(ctx) {
  const { T, escena } = ctx;
  // ---- los animales: las mallas, vacías hasta que hagan falta
  const vacas = crearRebano(escena, 'granja-vacas', 1 + GRANJA.terneros, 2);
  const chanchos = crearRebano(escena, 'granja-chanchos', 1 + GRANJA.lechones);
  const corderos = crearRebano(escena, 'granja-corderos', GRANJA.corderos);
  // La geometría se arma la primera vez que hace falta, de a una cosa y cuando el cuadro lo permite (ctx.permitir:
  // el planificador antitirones de main.js); `armado` dice cuántos ms tardó cada una (para medir).
  let pelajeArmado = null;
  const armado = { vacas: 0, chanchos: 0, corderos: 0, frutales: 0 };
  let armoEsteCuadro = false;
  const puede = () => !armoEsteCuadro && ctx.permitir?.() !== false;
  function asegurarVacas(pelaje) {
    if (pelajeArmado === pelaje) return true;
    if (!puede()) return false;
    const t0 = performance.now();
    const v = partesDe(modeloVaca(pelaje)), t = partesDe(modeloVaca(pelaje, true));
    armarRebano(vacas, v, [t.cuerpo]);
    pelajeArmado = pelaje; armoEsteCuadro = true;
    armado.vacas = performance.now() - t0;
    return true;
  }
  const asegurar = (r, fn, k) => {
    if (r.partes) return true;
    if (!puede()) return false;
    const t0 = performance.now();
    armarRebano(r, partesDe(fn()));
    armoEsteCuadro = true; armado[k] = performance.now() - t0;
    return true;
  };
  // ---- el balde del ordeñe (una malla chica, sólo mientras se ordeña)
  const balde = new THREE.Group();
  balde.add(tubo('#8f959a', 0.13, 0.11, 0.24, [0, 0.12, 0], null, 12, true));
  balde.add(bola('#f2ecdc', [0.12, 0.01, 0.12], [0, 0.2, 0]));
  balde.add(bola('#6e7378', [0.11, 0.01, 0.11], [0, 0.005, 0]));
  compactar(balde, { todo: true });
  balde.visible = false;
  escena.add(balde);
  // ---- los frutales: una malla instanciada por especie y por estado (se crean cuando hacen falta). El material,
  // el del sotobosque del bosque (vegetacion.js): mismo programa, nada que compilar.
  const matFrutal = conCartas(materialVegetal({ flex: 1, copa: true, doble: true }), texturaCartas());
  const frutales = new Map();   // `${especie}|${estado}` → InstancedMesh
  const geoFrutal = (k) => geoVacia([['aTipo', 1], ['aCarta', 4]]);
  function mallaFrutal(especie, estado) {
    const k = `${especie}|${estado}`;
    let m = frutales.get(k);
    if (!m) {
      if (!puede()) return null;
      const t0 = performance.now();
      m = new THREE.InstancedMesh(geometriaFrutal(especie, estado), matFrutal, GRANJA.frutales);
      armoEsteCuadro = true; armado.frutales = Math.max(armado.frutales, performance.now() - t0);
      m.count = 0; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.name = 'granja-frutal';
      escena.add(m);
      frutales.set(k, m);
    }
    return m;
  }
  // una malla vacía, ya al cargar, para que el material se compile con todo lo demás
  const testigo = new THREE.InstancedMesh(geoFrutal(), matFrutal, 1);
  testigo.count = 0; testigo.frustumCulled = false; testigo.name = 'granja-frutal';
  escena.add(testigo);

  // ---- el estado de cada animal en el mundo (las reglas no saben dónde está)
  const agentes = new Map();   // id → { tipo, x, z, y, rumbo, vel, paso, cab, echado, t, objetivo, ... }
  let datos = null;            // lo último de sincronizar
  let frutalesSucios = true;   // hay que rehacer las matrices de los frutales
  let invVisto = false;        // el invierno que se ve (el material pela los árboles)
  const cercaFrutal = new Map();
  let ordene = 0;              // segundos que quedan de ordeñe
  let saltoT = 0;

  function nuevoAgente(tipo, id, cerca) {
    const r = Math.random;
    const a = { tipo, id, x: cerca.x + (r() - 0.5) * 1.5, z: cerca.z + (r() - 0.5) * 1.5, y: 0, rumbo: r() * 6.28, vel: 0, paso: r() * 6, cab: 0, giroCab: 0, echado: 0, t: r() * 3, objetivo: null, pitch: 0, roll: 0, amp: 0, posterior: 0, quiere: 'pasta', salto: 0, saltoV: 0 };
    a.y = T.altura(a.x, a.z);
    agentes.set(`${tipo}:${id}`, a);
    return a;
  }
  // `d`: { granja, tambo, chiquero, corral: { x, z, radio }, paridera, frutales: [{ clave, x, z, rot, y, estado: estadoFrutal }],
  // ovejas: () => [{ x, z }] (las madres, para los corderos) }
  function sincronizar(d) {
    datos = d;
    frutalesSucios = true;
    const g = d.granja, vivos = new Set();
    const hogarVaca = d.tambo ? enMundo(d.tambo, TAMBO.cama.lx, TAMBO.cama.lz + 2.5) : g.vaca?.lugar || null;
    if (g.vaca && hogarVaca) {
      vivos.add(`vaca:${g.vaca.id}`);
      if (!agentes.has(`vaca:${g.vaca.id}`)) nuevoAgente('vaca', g.vaca.id, hogarVaca);
      for (const t of g.terneros) { vivos.add(`ternero:${t.id}`); if (!agentes.has(`ternero:${t.id}`)) nuevoAgente('ternero', t.id, hogarVaca); }
    }
    const hogarChancho = d.chiquero || g.chancha?.lugar || null;
    if (g.chancha && hogarChancho) {
      vivos.add(`chancha:${g.chancha.id}`);
      if (!agentes.has(`chancha:${g.chancha.id}`)) nuevoAgente('chancha', g.chancha.id, hogarChancho);
      for (const l of g.lechones) { vivos.add(`lechon:${l.id}`); if (!agentes.has(`lechon:${l.id}`)) nuevoAgente('lechon', l.id, hogarChancho); }
    }
    if (d.corral) for (const c of g.corderos) { vivos.add(`cordero:${c.id}`); if (!agentes.has(`cordero:${c.id}`)) nuevoAgente('cordero', c.id, d.corral).madre = c.madre; }
    for (const k of [...agentes.keys()]) if (!vivos.has(k)) agentes.delete(k);
  }

  // ---- moverse
  const _pos = new THREE.Vector3();
  function paso(a, dt, x, z, vel, radio) {
    if (a.fijo) { a.vel = 0; return 0; }   // (las capturas lo dejan quieto donde lo ponen)
    const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
    if (d < 0.2 || vel <= 0) { a.vel = lerp(a.vel, 0, 1 - Math.exp(-dt * 5)); return d; }
    a.rumbo += angDif(Math.atan2(dx, dz), a.rumbo) * Math.min(1, dt * 2.6);
    a.vel = lerp(a.vel, vel, 1 - Math.exp(-dt * 2.5));
    let nx = a.x + Math.sin(a.rumbo) * a.vel * dt, nz = a.z + Math.cos(a.rumbo) * a.vel * dt;
    const col = ctx.col?.();
    if (col?.resolver) { _pos.set(nx, a.y, nz); col.resolver(_pos, radio, 0.9); nx = _pos.x; nz = _pos.z; }
    a.x = nx; a.z = nz;
    return d;
  }
  // un lugar al azar en un círculo, o en un rectángulo local de una obra
  const enCirculo = (cx, cz, radio) => { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * radio; return { x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d }; };
  const enCaja = (l, x0, x1, z0, z1) => enMundo(l, x0 + Math.random() * (x1 - x0), z0 + Math.random() * (z1 - z0));
  // pastar / caminar / echarse (lo de todos): `zona()` da un lugar nuevo; `noche` manda a dormir a `cama`
  function vagar(a, dt, zona, { vel = 0.45, cama = null, noche = false, radio = 0.4, pastar = 0.6, echarse = 0.12, cabPasta = 1.2, cabReposo = 0 } = {}) {
    a.t -= dt;
    if (noche && cama) {
      const d = paso(a, dt, cama.x, cama.z, vel * 1.2, radio);
      a.echado = lerp(a.echado, d < 0.6 ? 1 : 0, 1 - Math.exp(-dt * (d < 0.6 ? 0.8 : 4)));
      a.cab = lerp(a.cab, 0.25, 1 - Math.exp(-dt * 2));
      return;
    }
    if (a.t <= 0) {
      const r = Math.random();
      a.quiere = r < echarse ? 'echada' : r < echarse + pastar ? 'pasta' : 'camina';
      a.t = a.quiere === 'echada' ? 18 + Math.random() * 25 : 4 + Math.random() * 8;
      a.objetivo = a.quiere === 'camina' || !a.objetivo ? zona() : a.objetivo;
    }
    if (a.quiere === 'camina' && a.objetivo) {
      const d = paso(a, dt, a.objetivo.x, a.objetivo.z, vel, radio);
      if (d < 0.3) { a.quiere = 'pasta'; a.t = 3 + Math.random() * 6; }
    } else paso(a, dt, a.x, a.z, 0, radio);
    a.echado = lerp(a.echado, a.quiere === 'echada' ? 1 : 0, 1 - Math.exp(-dt * (a.quiere === 'echada' ? 0.7 : 3)));
    a.cab = lerp(a.cab, a.quiere === 'pasta' && a.vel < 0.1 ? cabPasta : a.quiere === 'echada' ? 0.2 : cabReposo, 1 - Math.exp(-dt * 2));
  }
  function seguir(a, dt, x, z, dist, vel, radio) {
    const d = Math.hypot(x - a.x, z - a.z);
    if (d > dist) paso(a, dt, x, z, d > dist * 2.5 ? vel * 2 : vel, radio); else paso(a, dt, a.x, a.z, 0, radio);
  }
  function marcar(a, dt, sobre = 0.5) {
    a.y = T.altura(a.x, a.z);
    const m = marchaMamifero(a.vel, 'caminar', sobre, 3);
    a.paso += dt * m.cadencia; a.amp = a.vel > 0.06 ? m.amplitud * 0.8 : 0; a.posterior = m.posterior;
    const s = inclinacionTerrenoMamifero(T, a, a.rumbo, 0.22);
    a.pitch = lerp(a.pitch, s.pitch * (1 - a.echado), 1 - Math.exp(-dt * 5)); a.roll = lerp(a.roll, s.roll * (1 - a.echado), 1 - Math.exp(-dt * 5));
  }

  // ---- cada cuadro
  let dibujos = 0;
  function actualizar(dt, horas, pos, ovejas = null) {
    dt = Math.min(0.1, Math.max(0, dt));
    armoEsteCuadro = false;
    vaciarRebano(vacas); vaciarRebano(chanchos); vaciarRebano(corderos);
    balde.visible = false;
    dibujos = 0;
    if (!datos) { cerrarTodo(); return 0; }
    const g = datos.granja;
    const noche = horas >= 20.5 || horas < 6.2;
    ordene = Math.max(0, ordene - dt);
    saltoT += dt;
    // ---- la vaca y los terneros
    const tambo = datos.tambo || (g.vaca?.lugar ? { ...g.vaca.lugar } : null);
    if (g.vaca && tambo && Math.hypot(tambo.x - pos.x, tambo.z - pos.z) < VER && asegurarVacas(g.vaca.pelaje)) {
      const anima = Math.hypot(tambo.x - pos.x, tambo.z - pos.z) < ANIMAR;
      const pasto = enMundo(tambo, 0, TAMBO.pasto.lz), cama = enMundo(tambo, TAMBO.cama.lx, TAMBO.cama.lz);
      const vaca = agentes.get(`vaca:${g.vaca.id}`);
      if (vaca) {
        if (anima) {
          if (ordene > 0) { paso(vaca, dt, vaca.x, vaca.z, 0, 0.55); vaca.echado = lerp(vaca.echado, 0, 1 - Math.exp(-dt * 4)); vaca.cab = lerp(vaca.cab, 0.15, 1 - Math.exp(-dt * 3)); }
          else vagar(vaca, dt, () => enCirculo(pasto.x, pasto.z, TAMBO.pasto.radio), { vel: 0.42, cama, noche, radio: 0.55, cabPasta: 1.3, cabReposo: -0.18, echarse: 0.14 });
          marcar(vaca, dt, 0.5);
        }
        poner(vacas, vaca, { s: 1, cuerpo: 0 });
        if (ordene > 0) {
          // el balde, abajo de la ubre
          const u = enMundoDe(vaca, 0.32, -0.42);
          balde.position.set(u.x, T.altura(u.x, u.z), u.z); balde.visible = true;
        }
        for (const t of g.terneros) {
          const a = agentes.get(`ternero:${t.id}`);
          if (!a) continue;
          const novillo = datos.dia - t.nacio >= GRANJA.diasNovillo;
          const s = novillo ? 0.82 : 0.48 + 0.3 * Math.min(1, (datos.dia - t.nacio) / GRANJA.diasNovillo);
          if (anima) {
            if (novillo) vagar(a, dt, () => enCirculo(pasto.x, pasto.z, TAMBO.pasto.radio), { vel: 0.45, cama: enMundo(tambo, TAMBO.cama.lx + 1.1, TAMBO.cama.lz + 0.4), noche, radio: 0.45, cabPasta: 1.3, cabReposo: -0.18 });
            else {
              // al pie de la madre (del lado de la ubre), y echado cuando ella se echa
              const lado = enMundoDe(vaca, (t.id % 2 ? 1 : -1) * 1.0, -0.2);
              seguir(a, dt, lado.x, lado.z, 0.6, 0.6, 0.35);
              a.echado = lerp(a.echado, vaca.echado > 0.5 ? 1 : 0, 1 - Math.exp(-dt * 1.2));
              a.cab = lerp(a.cab, a.vel < 0.1 && vaca.cab > 0.8 ? 1.0 : -0.15, 1 - Math.exp(-dt * 2));
              if (a.vel < 0.05 && vaca.vel < 0.05) a.rumbo += angDif(vaca.rumbo, a.rumbo) * Math.min(1, dt);
            }
            marcar(a, dt, 0.5);
          }
          poner(vacas, a, { s, cuerpo: 1, cab: novillo ? 1 : 1.18, piernas: novillo ? 1 : 1.16 });
        }
      }
    }
    // ---- la chancha y los lechones, adentro del chiquero
    const chiq = datos.chiquero || g.chancha?.lugar || null;
    if (g.chancha && chiq && Math.hypot(chiq.x - pos.x, chiq.z - pos.z) < VER && asegurar(chanchos, modeloChancho, 'chanchos')) {
      const anima = Math.hypot(chiq.x - pos.x, chiq.z - pos.z) < ANIMAR;
      const A = CHIQUERO.adentro;
      const zona = () => enCaja(chiq, A.x0 + 0.3, A.x1 - 0.3, A.z0 + 0.6, A.z1 - 0.3);
      const cama = enMundo(chiq, CHIQUERO.casilla.lx, CHIQUERO.casilla.lz);
      const batea = enMundo(chiq, CHIQUERO.batea.lx, CHIQUERO.batea.lz - 0.55);
      const madre = agentes.get(`chancha:${g.chancha.id}`);
      if (madre) {
        if (anima) {
          // con la batea llena, de a ratos va a comer
          const zonaM = () => (g.batea > 0 && Math.random() < 0.35 ? batea : zona());
          vagar(madre, dt, zonaM, { vel: 0.35, cama, noche, radio: 0.32, pastar: 0.65, echarse: 0.15, cabPasta: 0.55 });
          encerrar(madre, chiq, A);
          marcar(madre, dt, 0.4);
        }
        poner(chanchos, madre, { s: 1, cab: 1 });
        for (const l of g.lechones) {
          const a = agentes.get(`lechon:${l.id}`);
          if (!a) continue;
          const capon = l.engorde >= GRANJA.diasCapon;
          const s = capon ? 0.78 : 0.36 + 0.3 * Math.min(1, l.engorde / GRANJA.diasCapon);
          if (anima) {
            if (noche) vagar(a, dt, zona, { vel: 0.4, cama: { x: cama.x + (l.id % 3 - 1) * 0.3, z: cama.z + ((l.id >> 1) % 2) * 0.3 }, noche, radio: 0.2 });
            else if (!capon && a.quiere !== 'juega' && Math.random() < dt * 0.05) { a.quiere = 'juega'; a.t = 2 + Math.random() * 2; a.objetivo = zona(); }
            else if (a.quiere === 'juega') { a.t -= dt; if (paso(a, dt, a.objetivo.x, a.objetivo.z, 1.4, 0.2) < 0.3 || a.t <= 0) { a.quiere = 'pasta'; a.t = 1; } }
            else if (capon) vagar(a, dt, zona, { vel: 0.35, radio: 0.3, cabPasta: 0.55 });
            else {
              // cerca de la madre, hozando
              const lado = enMundoDe(madre, ((l.id % 3) - 1) * 0.5, -0.3 - (l.id % 2) * 0.35);
              seguir(a, dt, lado.x, lado.z, 0.4, 0.55, 0.2);
              a.cab = lerp(a.cab, a.vel < 0.1 ? 0.55 : 0, 1 - Math.exp(-dt * 2));
              a.echado = lerp(a.echado, madre.echado > 0.5 ? 1 : 0, 1 - Math.exp(-dt));
            }
            encerrar(a, chiq, A);
            marcar(a, dt, 0.35);
          }
          poner(chanchos, a, { s, cab: capon ? 1 : 1.2 });
        }
      }
    }
    // ---- los corderos, en el corral, detrás de su madre
    const corral = datos.corral;
    if (corral && g.corderos.length && Math.hypot(corral.x - pos.x, corral.z - pos.z) < VER && asegurar(corderos, modeloCordero, 'corderos')) {
      const anima = Math.hypot(corral.x - pos.x, corral.z - pos.z) < ANIMAR;
      const madres = ovejas || [];
      for (const c of g.corderos) {
        const a = agentes.get(`cordero:${c.id}`);
        if (!a) continue;
        const listo = datos.dia - c.nacio >= GRANJA.diasCordero;
        const s = listo ? 0.82 : 0.58 + 0.2 * Math.min(1, (datos.dia - c.nacio) / GRANJA.diasCordero);
        if (anima) {
          const m = madres[c.madre] || madres[0] || null;
          if (noche) { const p = m || corral; seguir(a, dt, p.x + 0.5, p.z + 0.4, 0.4, 0.5, 0.25); a.echado = lerp(a.echado, 1, 1 - Math.exp(-dt * 0.8)); }
          else {
            a.echado = lerp(a.echado, 0, 1 - Math.exp(-dt * 3));
            if (m) { const off = (c.id % 2 ? 1 : -1) * 0.7; seguir(a, dt, m.x + off, m.z + 0.5, 0.7, 0.7, 0.25); }
            else vagar(a, dt, () => enCirculo(corral.x, corral.z, corral.radio * 0.7), { vel: 0.5, radio: 0.25 });
            a.cab = lerp(a.cab, a.vel < 0.1 && Math.sin(saltoT * 0.4 + c.id) > 0.2 ? 1.0 : 0, 1 - Math.exp(-dt * 2));
            // los saltitos de cordero chico
            if (!listo && a.salto <= 0 && a.saltoV <= 0 && Math.random() < dt * 0.12) a.saltoV = 1.6;
          }
          if (a.saltoV > 0 || a.salto > 0) { a.salto += a.saltoV * dt; a.saltoV -= 9.8 * dt; if (a.salto <= 0) { a.salto = 0; a.saltoV = 0; } }
          // adentro del corral
          const dc = Math.hypot(a.x - corral.x, a.z - corral.z), lim = Math.max(1, corral.radio - 0.3);
          if (dc > lim && !a.fijo) { a.x = corral.x + (a.x - corral.x) * (lim / dc); a.z = corral.z + (a.z - corral.z) * (lim / dc); }
          marcar(a, dt, 0.5);
        }
        poner(corderos, a, { s, cab: listo ? 1.05 : 1.2, piernas: listo ? 0.92 : 0.86 });
      }
    }
    // ---- los frutales: no se mueven; las matrices se rehacen sólo cuando cambia algo (un estado, uno que entra o
    // sale de la vista)
    for (const f of datos.frutales || []) {
      const cerca = Math.hypot(f.x - pos.x, f.z - pos.z) <= VER * 1.4;
      if (cercaFrutal.get(f.clave) !== cerca) { cercaFrutal.set(f.clave, cerca); frutalesSucios = true; }
    }
    const inv = !!ctx.inviernoVisual?.();
    if (inv !== invVisto) { invVisto = inv; frutalesSucios = true; }
    if (frutalesSucios) armarFrutales();
    cerrarTodo();
    return dibujos;
  }
  function armarFrutales() {
    frutalesSucios = false;
    for (const m of frutales.values()) { m.count = 0; m.instanceMatrix.needsUpdate = true; }
    for (const f of datos.frutales || []) {
      if (!f.estado || f.estado.etapa === 'hoyo' || !cercaFrutal.get(f.clave)) continue;
      const s = f.estado;
      // (con el invierno que se ve —una estación fija, o mientras cambia—, ni flor ni fruta: las ramas peladas)
      const est = invVisto ? 'hoja' : s.flor ? 'flor' : s.fruta === 'madura' ? 'fruta' : 'hoja';
      // (de plantín, el árbol entero chico; la fruta en el piso, del tamaño de siempre: es la de un árbol grande)
      const m = mallaFrutal(s.especie, est);
      if (!m) { frutalesSucios = true; continue; }   // (se arma en otro cuadro)
      const esc = 0.28 + 0.72 * s.crece;
      _e.set(0, f.rot || 0, 0, 'YXZ'); _q.setFromEuler(_e);
      _M.compose(_v.set(f.x, (f.y ?? T.altura(f.x, f.z)) + 0.04, f.z), _q, _s.set(esc, esc, esc));
      if (m.count < GRANJA.frutales) m.setMatrixAt(m.count++, _M);
    }
  }
  // un punto al lado de un animal (lx a su derecha, lz adelante), en el mundo
  function enMundoDe(a, lx, lz) { return { x: a.x + lx * Math.cos(a.rumbo) + lz * Math.sin(a.rumbo), z: a.z - lx * Math.sin(a.rumbo) + lz * Math.cos(a.rumbo) }; }
  function encerrar(a, l, A) {
    if (a.fijo) return;
    // a coordenadas del chiquero y de vuelta, adentro del cerco
    const dx = a.x - l.x, dz = a.z - l.z, c = Math.cos(l.rot), s = Math.sin(l.rot);
    let lx = dx * c - dz * s, lz = dx * s + dz * c;
    lx = clamp(lx, A.x0 + 0.15, A.x1 - 0.15); lz = clamp(lz, A.z0 + 0.15, A.z1 - 0.15);
    const w = enMundo(l, lx, lz); a.x = w.x; a.z = w.z;
  }
  function cerrarTodo() {
    for (const r of [vacas, chanchos, corderos]) {
      cerrarRebano(r);
      if (r.n) dibujos += r.cuerpos.filter((m) => m.count).length + 3;
    }
    for (const m of frutales.values()) if (m.count) dibujos++;
    if (balde.visible) dibujos++;
  }
  // El animal que tenés al alcance (el más cercano): { tipo, id, x, z, d }.
  function animalCerca(pos, radio = 1.8, tipos = null) {
    let mejor = null;
    for (const a of agentes.values()) {
      if (tipos && !tipos.includes(a.tipo)) continue;
      const alcance = a.tipo === 'vaca' ? radio + 0.6 : a.tipo === 'ternero' ? radio + 0.2 : radio;
      const d = Math.hypot(a.x - pos.x, a.z - pos.z);
      if (d < alcance && Math.abs(a.y - pos.y) < 2 && (!mejor || d - alcance < mejor.d - mejor.alcance)) mejor = { tipo: a.tipo, id: a.id, x: a.x, z: a.z, d, alcance };
    }
    return mejor;
  }
  function ordenar(segundos = 3) { ordene = segundos; }
  // (para las capturas: un animal quieto en un lugar)
  function posar(tipo, x, z, rumbo, extra = {}) {
    const a = [...agentes.values()].find((q) => q.tipo === tipo && (extra.id === undefined || q.id === extra.id));
    if (!a) return null;
    Object.assign(a, { x, z, y: T.altura(x, z), rumbo, fijo: true, quiere: 'quieta', t: 999, vel: 0, echado: 0, cab: 0 }, extra);
    return a;
  }
  return {
    sincronizar, actualizar, animalCerca, ordenar, geometriaFrutal, posar,
    // (para las capturas: que cada uno vuelva a su casa, de un salto)
    olvidar: () => { agentes.clear(); if (datos) sincronizar(datos); },
    // para las pruebas y las capturas
    agentes, mallas: () => ({ vacas, chanchos, corderos, frutales, balde, testigo }),
    estado: () => ({
      vacas: vacas.n, chanchos: chanchos.n, corderos: corderos.n, balde: balde.visible, dibujos, armado: { ...armado },
      frutales: [...frutales.entries()].filter(([, m]) => m.count).map(([k, m]) => `${k}×${m.count}`),
      triangulos: [vacas, chanchos, corderos].reduce((s, r) => s + (r.partes ? r.n * (['cuerpo', 'cabeza', 'del', 'tras'].reduce((t, k) => t + ((r.partes[k]?.index?.count ?? r.partes[k]?.attributes?.position?.count ?? 0) / 3) * (k === 'del' || k === 'tras' ? 2 : 1), 0)) : 0), 0)
        + [...frutales.values()].reduce((s, m) => s + m.count * ((m.geometry.index?.count ?? m.geometry.attributes.position.count) / 3), 0),
    }),
  };
}
