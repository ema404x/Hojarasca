// Más fauna: mamíferos introducidos, coipos, cauquenes y los bichos del aire
import * as THREE from 'three';
import { rng, lerp, clamp } from './ruido.js';
import { LAGO, LIMITE } from './config.js';
import { lam, esfera, cono, palo, patas, alas, actualizarCiervo, compactar, inclinacionTerrenoMamifero, marchaMamifero } from './vida.js';
import { bola, torno, miembro, huso, deformar, pintar, lomo, pata, ruido3, cuerpoZ, perfilHuso, color as matDe } from './formas.js';
import { perfilHabitatPatagonico } from './patagonia.js';
import { percepcionMamifero, firmaSonoraJugador } from './percepcion.js';
import { crearSombraContacto, actualizarSombraContacto } from './naturaleza-reactiva.js';
import { publicarAnimal, animalMasCercano, actividadFaunaPatagonica } from './ecosistema.js';
import { actualizarMicroconducta, gestoMicroconducta } from './microconductas.js';
import { crearPoolPosicional, limitarSombrasPorDistancia, consumirPresupuestoIA } from './rendimiento.js';

// ---------------------------------------------------------------- modelos
// 3.4: el ciervo colorado con su anatomía: cuerpo grande de pecho hondo, cuello fuerte (con
// la gorguera oscura del macho), cabeza larga, orejas anchas, patas largas con rodilla y
// garrón, el escudo claro del anca y, en el macho, la cornamenta ramificada (ahora toda en la
// malla de la cabeza: antes cada vara era una llamada de dibujo). Mismos pivotes.
function mallaCiervo(macho) {
  const g = new THREE.Group();
  const pelo = '#8a5a34', oscuro = '#4a3524', asta = '#6b5a42';
  const claro = new THREE.Color('#d6c29a'), cOsc = new THREE.Color(oscuro);
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 + 0.07 * Math.max(0, n.y) - 0.08 * Math.max(0, -n.y));
    if (p.z < -0.62 && p.y > 0.95) c.lerp(claro, sv(-0.62, -0.78, p.z) * 0.9);   // el escudo del anca
    if (p.y < 1.0 && p.y > 0.75) c.lerp(claro, 0.35 * sv(-0.2, -0.7, n.y));      // la panza, más clara
    if (macho && p.z > 0.45 && p.y > 1.15 && p.y < 1.8) c.lerp(cOsc, 0.55);      // la gorguera
    if (p.y < 0.5) c.lerp(cOsc, 0.4 * (1 - sv(0.2, 0.5, p.y)));                  // las cañas
  };
  const conPelaje = (m) => pintar(m, pelaje);
  g.add(conPelaje(lomo(pelo, { y: 1.18, atras: -0.88, adelante: 0.72, ancho: 0.3, alto: 0.34, pecho: 0.2, panza: 0.12 }, 18)));
  g.add(conPelaje(miembro(pelo, [[0, 1.2, 0.42], [0, 1.45, 0.6], [0, 1.72, 0.8]], [macho ? 0.23 : 0.2, macho ? 0.17 : 0.14, 0.11], 8, 12)));   // el cuello
  g.add(pintar(miembro('#d8c8a6', [[0, 1.22, -0.84], [0, 1.18, -0.92], [0, 1.08, -0.95]], [0.05, 0.06, 0.03], 5, 8), null));   // la colita
  const cabeza = new THREE.Group(); cabeza.position.set(0, 1.82, 0.86);
  const testa = miembro(pelo, [[0, 0.05, -0.1], [0, 0.03, 0.06], [0, -0.02, 0.24], [0, -0.05, 0.4]], [0.11, 0.12, 0.085, 0.055], 8, 12);
  testa.scale.set(0.8, 1, 1);
  cabeza.add(conPelaje(testa));
  cabeza.add(bola(oscuro, [0.05, 0.04, 0.045], [0, -0.045, 0.41]));
  for (const l of [-1, 1]) {
    cabeza.add(bola('#100c09', [0.016, 0.018, 0.014], [l * 0.085, 0.045, 0.1]));
    cabeza.add(conPelaje(bola(pelo, [0.04, 0.12, 0.065], [l * 0.12, 0.13, -0.04], [-0.2, 0, -l * 0.8])));   // las orejas
    if (macho) {
      // la cornamenta: la vara sube, se abre y se va para atrás, con sus puntas hacia adelante
      const ex = l, puntos = [[ex * 0.07, 0.12, 0.0], [ex * 0.2, 0.36, -0.06], [ex * 0.3, 0.6, -0.14], [ex * 0.32, 0.82, -0.2]];
      cabeza.add(miembro(asta, puntos, [0.03, 0.025, 0.02, 0.008], 8, 7));
      for (const [i, largo] of [[1, 0.2], [2, 0.18], [2.6, 0.14]]) {
        const k = Math.floor(i), f = i - k, a = puntos[k], b = puntos[Math.min(3, k + 1)];
        const o = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
        cabeza.add(miembro(asta, [o, [o[0] + ex * 0.02, o[1] + largo * 0.5, o[2] + largo * 0.6], [o[0] + ex * 0.03, o[1] + largo * 0.9, o[2] + largo * 0.75]], [0.018, 0.012, 0.004], 5, 6));
      }
    }
  }
  g.add(cabeza);
  const p = [];
  for (const [px, pz] of [[-0.19, 0.5], [0.19, 0.5], [-0.19, -0.5], [0.19, -0.5]]) {
    const piv = new THREE.Group(); piv.position.set(px, 0.9, pz);
    piv.add(conPelaje(pata(pelo, 0.9, pz > 0, 0.08, 9)));
    piv.add(bola('#2a211b', [0.038, 0.03, 0.05], [0, -0.88, 0.03]));
    g.add(piv); p.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 1.9, pie: 0.86, todo: true });
  return { g, cabeza, patas: p };
}

// 3.5.2: el jabalí como es: alto en la cruz y bajo en el anca, con la crin de cerdas que corre
// por el espinazo; la cabeza en cuña con el hocico largo que termina en la jeta (el disco de la
// nariz), los colmillos que asoman del labio, ojos chicos y orejas cortas y peludas; patas
// cortas y finas con pezuñas, y la cola con su pincel. Pelaje pardo negruzco entrecano pintado
// en los vértices; el chico, bermejo. Se arma a tamaño de adulto y se achica entero (`e`).
// Antes era una esfera, un cono y palitos. Mismos pivotes (cabeza y patas) y las mismas llamadas.
function mallaJabali(cria) {
  const g = new THREE.Group();
  const e = cria ? 0.55 : 1;
  const pelo = cria ? '#87603f' : '#594a3c', oscuro = '#2a231c';
  const cOsc = new THREE.Color(oscuro), canoso = new THREE.Color(cria ? '#ad8455' : '#9c8c78');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // (la pintura se arma a tamaño de adulto: `p` llega en el espacio de la figura ya achicada)
  const pelaje = (c, p, n) => {
    const x = p.x / e, y = p.y / e, z = p.z / e;
    c.multiplyScalar(1 + ruido3(x * 30, y * 28, z * 31) * 0.1);
    c.lerp(canoso, 0.4 * Math.max(0.3, Math.abs(n.x)) * sv(0.35, 0.65, y) * (0.6 + 0.4 * ruido3(x * 9, y * 11, z * 7)));   // las puntas canosas
    if (y < 0.32) c.lerp(cOsc, 0.65 * (1 - sv(0.14, 0.32, y)));                                             // las patas, oscuras
  };
  const conPelaje = (m) => pintar(m, pelaje);
  const perfil = [[0, -0.6], [0.1, -0.56], [0.16, -0.48], [0.2, -0.35], [0.22, -0.15], [0.23, 0.05], [0.235, 0.22], [0.22, 0.36], [0.17, 0.45], [0.1, 0.5], [0, 0.53]];
  const radioEn = (z) => { for (let i = 1; i < perfil.length; i++) if (z <= perfil[i][1]) { const [r0, z0] = perfil[i - 1], [r1, z1] = perfil[i]; return r0 + (r1 - r0) * (z - z0) / (z1 - z0); } return 0; };
  const subeLomo = (t) => 1.15 + 0.22 * Math.max(0, 1 - Math.abs(t - 0.22) / 0.3) - 0.16 * sv(-0.1, -0.45, t);
  // el alto del lomo a lo largo del cuerpo (la cruz alta, el anca baja), para la crin
  const lomoEn = (z) => 0.6 + radioEn(z) * subeLomo(z);
  g.add(conPelaje(cuerpoZ(pelo, perfil, [0, 0.6, 0], 16, (v) => {
    const t = v.z;
    if (v.y > 0) v.y *= subeLomo(t);                                                                        // la cruz alta
    else v.y *= 1.26 - 0.3 * sv(0.0, -0.4, t) + 0.1 * Math.max(0, 1 - Math.abs(t - 0.25) / 0.2);           // el pecho hondo, la panza recogida
    v.x *= 1 - 0.12 * sv(0.0, -0.5, t);
  })));
  // la crin: una cresta de cerdas a lo largo del espinazo, finita y dentada
  // (va medio hundida en el lomo: asoma unos 3 cm, más en la cruz)
  const crin = [0.42, 0.3, 0.15, -0.02, -0.2, -0.36].map((z) => [0, lomoEn(z) - 0.012, z]);
  g.add(conPelaje(deformar(miembro(oscuro, crin, [0.03, 0.045, 0.04, 0.032, 0.02, 0.006], 12, 6), (v) => {
    v.x *= 0.4;
    if (v.y > lomoEn(v.z)) v.y += 0.022 * Math.abs(Math.sin(v.z * 75)) * Math.max(0, 1 - Math.abs(v.z - 0.1) / 0.5);
  })));
  // la cola, con el pincel en la punta
  g.add(conPelaje(miembro(pelo, [[0, 0.7, -0.56], [0, 0.6, -0.63], [0, 0.48, -0.64]], [0.025, 0.016, 0.01], 6, 6)));
  g.add(bola(oscuro, [0.018, 0.04, 0.018], [0, 0.45, -0.64], null, [7, 5]));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.66, 0.52);
  // la cabeza en cuña: ancha en las quijadas, con la frente recta que baja hasta la jeta
  const testa = miembro(pelo, [[0, 0.06, -0.14], [0, 0.035, 0.02], [0, -0.03, 0.17], [0, -0.075, 0.3], [0, -0.095, 0.39]], [0.17, 0.15, 0.1, 0.066, 0.056], 12, 12);
  testa.scale.set(0.78, 1, 1);
  cabeza.add(conPelaje(testa));
  cabeza.add(conPelaje(bola(pelo, [0.11, 0.1, 0.11], [0, -0.05, 0.03], null, [12, 9])));                    // las quijadas
  cabeza.add(conPelaje(miembro(pelo, [[0, -0.11, 0.06], [0, -0.135, 0.22], [0, -0.13, 0.34]], [0.07, 0.045, 0.03], 6, 9)));   // la mandíbula
  cabeza.add(bola('#4d3c37', [0.058, 0.05, 0.022], [0, -0.095, 0.4]));                                       // la jeta
  for (const l of [-1, 1]) {
    cabeza.add(bola('#151110', [0.013, 0.016, 0.008], [l * 0.019, -0.098, 0.418]));                        // las narinas
    cabeza.add(bola('#0c0a08', [0.012, 0.012, 0.01], [l * 0.062, 0.035, 0.125]));                          // los ojos chicos
    if (!cria) cabeza.add(miembro('#e2d9c2', [[l * 0.042, -0.138, 0.27], [l * 0.066, -0.118, 0.31], [l * 0.072, -0.078, 0.3]], [0.013, 0.009, 0.002], 5, 6));   // los colmillos
    // las orejas: cortas, en punta y peludas
    const oreja = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 8, 2), matDe(pelo)), (v) => { v.z *= 0.42; });
    oreja.position.set(l * 0.085, 0.14, -0.05); oreja.rotation.set(-0.25, 0, -l * 0.4);
    cabeza.add(pintar(oreja, (c, p, n) => { if (n.z > 0.2) c.lerp(new THREE.Color('#5a4438'), 0.4); }));
  }
  g.add(cabeza);
  const p = [];
  for (const [px, pz] of [[-0.15, 0.32], [0.15, 0.32], [-0.15, -0.32], [0.15, -0.32]]) {
    const piv = new THREE.Group(); piv.position.set(px, 0.52, pz);
    piv.add(conPelaje(pata(pelo, 0.52, pz > 0, pz > 0 ? 0.062 : 0.07, 7)));
    piv.add(bola('#16120f', [0.026, 0.022, 0.04], [0, -0.508, 0.024], null, [8, 6]));                       // la pezuña
    g.add(piv); p.push(piv);
  }
  // todo se arma a tamaño de adulto: el chico se achica entero (pivotes incluidos)
  if (e !== 1) for (const h of g.children) { h.position.multiplyScalar(e); h.scale.multiplyScalar(e); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.9 * e, pie: 0.86, todo: true });
  return { g, cabeza, patas: p };
}

// 3.4: la liebre agazapada: lomo arqueado con el anca alta y los cuartos traseros grandes,
// patas de atrás largas con el pie apoyado, manos finas, cabeza de ojo grande y orejas largas
// con la punta negra, y la colita blanca. Pelaje pardo entrecano pintado. Mismos pivotes.
function mallaLiebre() {
  const g = new THREE.Group();
  const pelo = '#a08760', oscuro = '#3a2f22';
  const claro = new THREE.Color('#e2dac8'), negro = new THREE.Color('#2a221a');
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 + ruido3(p.x * 40, p.y * 38, p.z * 41) * 0.07 + 0.06 * Math.max(0, n.y));
    if (p.y < 0.17 && n.y < -0.2) c.lerp(claro, 0.45);
  };
  const conPelaje = (m) => pintar(m, pelaje);
  g.add(conPelaje(lomo(pelo, { y: 0.19, atras: -0.21, adelante: 0.17, ancho: 0.085, alto: 0.1, grupa: 0.35, pecho: 0.05, panza: 0.05 }, 12)));
  for (const l of [-1, 1]) g.add(conPelaje(bola(pelo, [0.05, 0.085, 0.1], [l * 0.06, 0.17, -0.1])));   // los cuartos
  g.add(pintar(bola('#e8e2d4', [0.035, 0.035, 0.03], [0, 0.24, -0.215]), (c, p) => { if (p.y > 0.25) c.lerp(negro, 0.8); }));   // la colita
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.3, 0.16);
  // 3.5.2: la cara de la liebre: cabeza larga de perfil recto (antes, dos bolas como de
  // perrito), el hocico con la nariz y el labio partido, los bigotes, y los ojos grandes a los
  // COSTADOS, ámbar con el anillo claro (antes miraban de frente, negros).
  const testa = miembro(pelo, [[0, 0.022, -0.045], [0, 0.018, 0.01], [0, 0.0, 0.05], [0, -0.012, 0.078], [0, -0.016, 0.092]], [0.047, 0.05, 0.043, 0.034, 0.026], 12, 12);
  testa.scale.set(0.8, 1, 1);
  cabeza.add(pintar(testa, (c, p, n) => { pelaje(c, p, n); if (p.y < 0.29 && n.y < -0.2) c.lerp(claro, 0.5); }));
  cabeza.add(conPelaje(bola(pelo, [0.036, 0.03, 0.04], [0, -0.012, 0.035])));                     // los cachetes
  cabeza.add(bola('#4e3a32', [0.011, 0.008, 0.007], [0, -0.008, 0.1]));                            // la nariz
  cabeza.add(bola('#3a2a22', [0.0018, 0.006, 0.003], [0, -0.018, 0.099]));                         // el labio partido
  for (const l of [-1, 1]) {
    cabeza.add(bola('#c4ad86', [0.009, 0.0175, 0.019], [l * 0.032, 0.018, 0.036]));               // el anillo claro
    cabeza.add(bola('#5e3a16', [0.0085, 0.0145, 0.016], [l * 0.0345, 0.018, 0.037]));              // el ojo ámbar, de costado
    cabeza.add(bola('#110c08', [0.005, 0.0095, 0.01], [l * 0.0375, 0.018, 0.038]));
    for (let k = 0; k < 2; k++) cabeza.add(miembro('#e6dfd0', [[l * 0.014, -0.01 + k * 0.006, 0.09], [l * 0.06, -0.014 + k * 0.012, 0.08 - k * 0.01], [l * 0.09, -0.02 + k * 0.02, 0.065 - k * 0.02]], [0.0015, 0.001, 0.0005], 3, 3));
  }
  const orejas = [];
  for (const l of [-1, 1]) {
    const pivOreja = new THREE.Group(); pivOreja.position.set(l * 0.035, 0.12, -0.03); pivOreja.rotation.z = -l * 0.16;
    pivOreja.add(pintar(bola(pelo, [0.022, 0.11, 0.032], [0, 0, 0]), (c, p, n) => { if (p.y > 0.49) c.lerp(negro, 0.85); else if (n.z > 0.5) c.lerp(new THREE.Color('#c9a98a'), 0.3); }));
    cabeza.add(pivOreja); orejas.push(pivOreja);
  }
  g.add(cabeza);
  const p = [];
  for (const [x, z, largo] of [[-0.07, 0.1, 0.16], [0.07, 0.1, 0.16], [-0.08, -0.09, 0.22], [0.08, -0.09, 0.22]]) {
    const piv = new THREE.Group(); piv.position.set(x, largo, z);
    // 3.5.2: patas cerradas en cúpula (la boca abierta del tubo de la de atrás asomaba sobre el anca)
    if (z > 0) piv.add(conPelaje(huso(pelo, [[0, 0.03, -0.01], [0, -0.08, 0.005], [0, -0.155, 0.018]], [0.02, 0.014, 0.012], 6, 7)));
    else piv.add(conPelaje(huso(pelo, [[0, 0.03, 0.0], [0, -0.08, -0.04], [0, -0.17, -0.055], [0, -0.21, -0.01], [0, -0.215, 0.06]], [0.035, 0.026, 0.017, 0.015, 0.014], 10, 7)));
    g.add(piv); p.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.4, pie: 0.88, todo: true });
  return { g, cabeza, patas: p, orejas };
}

// 3.5.2: el coipo, el roedor grande del agua: nada con el lomo y la cabeza afuera. Cuerpo
// macizo pardo, cabeza grande de hocico romo con la punta blanquecina, los bigotes largos, los
// incisivos anaranjados, ojos y orejas chicos bien arriba, y la cola larga, redonda y casi
// pelada, con anillos de escamas. Mismos pivotes (la cabeza) y las mismas dos llamadas.
function mallaCoipo() {
  const g = new THREE.Group();
  const pelo = '#5c4430';
  const claro = new THREE.Color('#cdbfa8'), oscuro = new THREE.Color('#2e241a');
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 + ruido3(p.x * 34, p.y * 30, p.z * 33) * 0.09 + 0.08 * Math.max(0, n.y));
    if (n.y < -0.3) c.lerp(new THREE.Color('#7a6650'), 0.4);   // la panza, más clara
  };
  g.add(pintar(cuerpoZ(pelo, perfilHuso(-0.33, 0.29, 0.152, 14, 0.85, 0.6), [0, 0.07, 0], 16, (v) => {
    v.y *= v.y > 0 ? 0.85 + 0.1 * Math.max(0, 1 - Math.abs(v.z + 0.05) / 0.25) : 0.75;   // el lomo redondo
  }), pelaje));
  // la cola, redonda y casi pelada, con los anillos de las escamas
  const cola = pintar(miembro('#3a332c', [[0, 0.06, -0.29], [0, 0.04, -0.42], [0, 0.025, -0.56], [0, 0.015, -0.7]], [0.034, 0.025, 0.016, 0.005], 12, 8), (c, p) => { c.multiplyScalar(1 + 0.12 * Math.sin(p.z * 140)); });
  g.add(cola);
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.16, 0.3);
  const testa = miembro(pelo, [[0, 0.0, -0.11], [0, 0.005, -0.01], [0, -0.012, 0.07], [0, -0.028, 0.125]], [0.09, 0.088, 0.064, 0.04], 10, 12);
  testa.scale.set(0.95, 1, 1);
  cabeza.add(pintar(testa, (c, p, n) => {
    pelaje(c, p, n);
    if (p.z > 0.4) c.lerp(claro, Math.min(1, (p.z - 0.4) * 14) * 0.85);   // la punta del hocico, blanquecina
  }));
  cabeza.add(bola('#231c17', [0.02, 0.013, 0.011], [0, -0.016, 0.135]));                              // la nariz
  for (const l of [-1, 1]) {
    cabeza.add(bola('#d9781c', [0.0065, 0.012, 0.005], [l * 0.0068, -0.044, 0.124]));                // los incisivos
    cabeza.add(bola('#0e0b09', [0.011, 0.011, 0.01], [l * 0.052, 0.04, 0.03]));                      // los ojos, arriba
    cabeza.add(pintar(bola(pelo, [0.022, 0.021, 0.01], [l * 0.066, 0.058, -0.045], [0, l * 0.5, 0]), (c) => c.lerp(oscuro, 0.3)));   // las orejas
    for (let k = 0; k < 3; k++) {
      // los bigotes, largos y claros
      cabeza.add(miembro('#ddd6c6', [[l * 0.03, -0.024 + k * 0.007, 0.11], [l * 0.09, -0.03 + k * 0.012, 0.1 - k * 0.012], [l * 0.13, -0.038 + k * 0.018, 0.085 - k * 0.025]], [0.0022, 0.0015, 0.0006], 3, 3));
    }
  }
  g.add(cabeza);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { todo: true });
  return { g, cabeza, cola };
}

// 3.4: el cauquén común de pie: cuerpo de ganso con el pecho lleno, cuello mediano, cabeza
// redonda de pico corto. El macho, con la cabeza y el pecho blancos y los flancos barrados
// de negro (las barras se pintan en los vértices), patas negras; la hembra, canela con un
// barrado fino, cabeza grisácea y patas amarillas. Mismos pivotes.
// 3.5.2: el cauquén común (el ganso de la estepa y los mallines), rehecho: cuerpo de ganso
// horizontal y de pecho lleno, el cuello que nace del pecho sin escalón, cabeza chica y pico
// corto negro; las alas plegadas a lo largo del lomo con la mancha blanca de las cubiertas y las
// primarias negras cruzadas sobre la cola negra. El macho: cabeza, cuello y pecho blancos, lomo
// gris barrado y los flancos con el barrado fino negro; patas negras. La hembra: cabeza gris
// canela, cuerpo canela con barrado fino, patas amarillas. (Antes: alas como óvalos enormes,
// barrado manchado y patas largas y finas.) Mismos pivotes.
function mallaCauquen(macho) {
  const g = new THREE.Group();
  const base = macho ? '#ecebe4' : '#a3683f';
  const barra = new THREE.Color(macho ? '#262624' : '#3e2616'), gris = new THREE.Color(macho ? '#8d8c86' : '#6e5544');
  const negro = new THREE.Color('#1c1b1a'), blanco = new THREE.Color('#f1efe8');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const plumaje = (c, p, n) => {
    // el lomo gris (el macho) o pardo (la hembra), barrado
    c.lerp(gris, 0.85 * sv(0.35, 0.75, n.y) * sv(0.1, -0.05, p.z));
    // el barrado fino de los flancos y del pecho de la hembra: rayas cada 3 cm a lo largo
    const raya = Math.max(0, Math.sin(p.z * 210 + p.y * 30)) ** 2;
    const dondeRaya = macho ? sv(0.5, 0.8, Math.abs(n.x)) * sv(0.4, 0.3, p.y) * sv(0.24, 0.3, p.y) * sv(0.16, 0.08, p.z) : sv(-0.2, 0.3, Math.abs(n.x) + n.z) * sv(0.43, 0.3, p.y);
    c.lerp(barra, raya * dondeRaya * (macho ? 0.5 : 0.4));
    if (p.z < -0.26) c.lerp(negro, 0.9 * sv(-0.26, -0.3, p.z));   // la rabadilla y la cola
  };
  g.add(pintar(cuerpoZ(base, perfilHuso(-0.34, 0.22, 0.13, 40, 0.9, 0.7), [0, 0.32, 0], 16, (v) => {
    v.y *= v.y > 0 ? 0.95 : 1.05;
    if (v.y < 0 && v.z > 0.0) v.y *= 1 + v.z * 0.6;   // el pecho lleno
  }), plumaje));
  // las alas plegadas: largas y angostas, pegadas al lomo; cubiertas blancas adelante y
  // primarias negras que se cruzan sobre la cola
  for (const l of [-1, 1]) {
    g.add(pintar(bola(base, [0.04, 0.036, 0.21], [l * 0.068, 0.375, -0.11], [-0.07, l * 0.08, l * 0.35]), (c, p, n) => {
      c.copy(gris);
      if (p.z > -0.02) c.lerp(blanco, 0.8 * sv(-0.02, 0.06, p.z));
      if (p.z < -0.16) c.lerp(negro, 0.92 * sv(-0.16, -0.22, p.z));
    }));
  }
  g.add(bola('#1c1b1a', [0.05, 0.022, 0.07], [0, 0.35, -0.33], [-0.25, 0, 0]));   // la cola
  // el cuello: nace ancho del pecho y sube con una curva suave
  g.add(huso(macho ? '#efeee8' : '#8f7f72', [[0, 0.31, 0.11], [0, 0.42, 0.165], [0, 0.54, 0.185], [0, 0.65, 0.19], [0, 0.745, 0.2]], [0.1, 0.058, 0.045, 0.04, 0.036], 14, 10));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.72, 0.2);
  cabeza.add(deformar(bola(macho ? '#f2f0ea' : '#8e8478', [0.046, 0.05, 0.062], [0, 0, 0]), (v) => { if (v.z > 0.4) v.y *= 0.88; }));
  cabeza.add(miembro('#232322', [[0, -0.012, 0.048], [0, -0.017, 0.082], [0, -0.021, 0.098]], [0.019, 0.012, 0.004], 5, 7));   // el pico corto
  for (const l of [-1, 1]) cabeza.add(bola('#0e0c0a', [0.008, 0.009, 0.007], [l * 0.038, 0.012, 0.028]));
  g.add(cabeza);
  const p = [];
  const colorPata = macho ? '#2f2f2d' : '#d39a2a';
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * 0.055, 0.22, 0);
    piv.add(pintar(bola(base, [0.036, 0.04, 0.042], [0, 0.012, 0]), plumaje));                           // el muslo emplumado
    piv.add(miembro(colorPata, [[0, 0.0, 0], [0, -0.09, 0.012], [0, -0.205, 0.01]], [0.026, 0.019, 0.017], 6, 7));
    piv.add(bola(colorPata, [0.034, 0.009, 0.048], [0, -0.213, 0.03]));   // el pie palmeado
    g.add(piv); p.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.75, pie: 0.88, todo: true });
  return { g, cabeza, patas: p };
}

function mallaManganga() {
  const g = new THREE.Group();
  const cuerpo = esfera(lam('#d97a14', { emissive: '#3a1c00' }), [0.035, 0.035, 0.05], [0, 0, 0]);
  g.add(cuerpo);
  g.add(esfera(lam('#3a2a14'), [0.028, 0.028, 0.02], [0, 0.005, 0.045]));
  const a = alas(g, '#d8d8d0', 0.07, 0.035, 0.025, -0.005);
  a.forEach((w) => { w.children[0].material.transparent = true; w.children[0].material.opacity = 0.6; });
  return { g, alas: a };
}

// 3.4: el guanaco con su silueta: cuerpo liviano de lomo recto, cuello largo y fino que se
// curva hacia adelante, cabeza chica gris con orejas largas en punta, patas largas y finas
// con almohadillas, y la cola corta. El pelaje (leonado arriba, blanco abajo con el corte
// neto del costado, cabeza gris, patas claras) se pinta en los vértices. Mismos pivotes.
function mallaGuanaco(cria = false) {
  const g = new THREE.Group();
  const e = cria ? 0.76 : 1;
  const leonado = '#b07548', blanco = new THREE.Color('#e6dfcf'), gris = new THREE.Color('#6d6962'), oscuro = '#3b3129';
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // el corte del vientre blanco va a media altura del costado; el cuello es blanco por delante
  const pelaje = (c, p, n) => {
    const y = p.y / e;
    if (y > 0.6 && y < 1.3 && p.z / e < 0.55) c.lerp(blanco, sv(0.92, 0.86, y) * sv(-0.1, -0.5, n.y + 0.2));
    if (p.z / e > 0.5 && y > 1.1) c.lerp(blanco, 0.85 * sv(0.0, 0.5, n.z - n.y * 0.3) * (1 - sv(1.7, 1.85, y)));
    if (y < 0.62) c.lerp(blanco, 0.55 * (1 - sv(0.4, 0.62, y)));
  };
  const conPelaje = (m) => pintar(m, pelaje);
  g.add(conPelaje(lomo(leonado, { y: 1.04 * e, atras: -0.74 * e, adelante: 0.66 * e, ancho: 0.27 * e, alto: 0.3 * e, pecho: 0.12, panza: 0.18 }, 16)));
  const cuello = new THREE.Group(); cuello.position.set(0, 1.24 * e, 0.5 * e);
  // 3.5.2: el cuello largo, más hondo que ancho, que nace del pecho y de la cruz sin escalón
  // (antes era un caño parejo que salía de arriba del lomo) y se mete en la cabeza; cierra en
  // cúpula en las dos puntas.
  cuello.add(conPelaje(deformar(huso(leonado, [[0, -0.34 * e, -0.24 * e], [0, -0.14 * e, -0.1 * e], [0, 0.06 * e, -0.02 * e], [0, 0.3 * e, 0.03 * e], [0, 0.52 * e, 0.08 * e], [0, 0.73 * e, 0.15 * e]], [0.25 * e, 0.21 * e, 0.13 * e, 0.09 * e, 0.078 * e, 0.06 * e], 16, 12), (v) => { v.x *= 0.82; })));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.72 * e, 0.18 * e);
  const testa = miembro('#6d6962', [[0, 0.04 * e, -0.1 * e], [0, 0.03 * e, 0.02 * e], [0, -0.01 * e, 0.15 * e], [0, -0.03 * e, 0.25 * e]], [0.075 * e, 0.095 * e, 0.07 * e, 0.042 * e], 8, 10);
  testa.scale.set(0.82, 1, 1);
  cabeza.add(pintar(testa, (c, p) => { if (p.y / e < 1.92 + 0.0 && p.z / e > 0.82) c.lerp(blanco, 0.4); }));
  cabeza.add(bola(oscuro, [0.028 * e, 0.02 * e, 0.02 * e], [0, -0.025 * e, 0.27 * e]));
  const orejas = [];
  for (const l of [-1, 1]) {
    cabeza.add(bola('#0d0b09', [0.013 * e, 0.014 * e, 0.011 * e], [l * 0.066 * e, 0.045 * e, 0.07 * e]));
    const pivOreja = new THREE.Group(); pivOreja.position.set(l * 0.055 * e, 0.11 * e, -0.05 * e); pivOreja.rotation.set(-0.2, 0, l * 0.18);
    pivOreja.add(deformar(new THREE.Mesh(new THREE.ConeGeometry(0.035 * e, 0.17 * e, 8, 2), matDe('#6d6962')), (v) => { v.z *= 0.6; }));
    cabeza.add(pivOreja); orejas.push(pivOreja);
  }
  cuello.add(cabeza); g.add(cuello);
  const patas = [];
  for (const [px, pz] of [[-0.18, 0.41], [0.18, 0.41], [-0.18, -0.41], [0.18, -0.41]]) {
    const piv = new THREE.Group(); piv.position.set(px * e, 0.9 * e, pz * e);
    piv.add(conPelaje(pata(leonado, 0.88 * e, pz > 0, 0.06 * e, 8)));
    piv.add(bola(oscuro, [0.034 * e, 0.022 * e, 0.05 * e], [0, -0.875 * e, 0.035 * e]));
    g.add(piv); patas.push(piv);
  }
  const cola = miembro(leonado, [[0, 1.12 * e, -0.7 * e], [0, 1.1 * e, -0.8 * e], [0, 1.0 * e, -0.86 * e]], [0.045 * e, 0.05 * e, 0.025 * e], 5, 8);
  g.add(cola);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 1.9 * e, pie: 0.86, todo: true });
  return { g, cuello, cabeza, patas, cola, cria, orejas };
}

// 3.5.2: el zorzal patagónico: lomo pardo oliva, la cabeza más oscura (casi negra), el pecho y
// la panza anaranjado pardo, la garganta clara rayada, el pico y las patas amarillos y el anillo
// amarillo del ojo; cuerpo apenas erguido, alas plegadas al costado y cola larga. Mismos pivotes.
// (Las alas quedan fundidas en el cuerpo como antes: `alas` son dos grupos vacíos, así el vuelo
// corto no suma llamadas de dibujo.)
function mallaZorzal() {
  const g = new THREE.Group();
  const pardo = '#5f4e3a', oscuro = '#33291f';
  const naranja = new THREE.Color('#c4823f'), crema = new THREE.Color('#d9c29a');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const plumaje = (c, p, n) => {
    // el pecho y la panza anaranjados, más claros hacia la cloaca
    const frente = sv(-0.35, 0.15, n.z - n.y * 0.6);
    c.lerp(naranja, 0.9 * frente);
    if (p.z < -0.02 && n.y < -0.3) c.lerp(crema, 0.6);
  };
  const cuerpo = pintar(cuerpoZ(pardo, perfilHuso(-0.1, 0.09, 0.064, 10, 0.85, 0.7), null, 14), plumaje);
  cuerpo.position.set(0, 0.135, 0); cuerpo.rotation.x = -0.4;
  g.add(cuerpo);
  for (const l of [-1, 1]) g.add(bola('#4f4031', [0.018, 0.032, 0.08], [l * 0.04, 0.155, -0.035], [-0.38, l * 0.08, l * 0.25]));   // las alas plegadas
  g.add(bola('#3e3226', [0.022, 0.007, 0.07], [0, 0.128, -0.13], [-0.25, 0, 0]));                                                  // la cola larga
  g.add(huso(pardo, [[0, 0.17, 0.04], [0, 0.205, 0.06], [0, 0.235, 0.075]], [0.042, 0.036, 0.032], 6, 10));               // el cuello
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.24, 0.08);
  cabeza.add(pintar(bola(oscuro, [0.04, 0.041, 0.047], [0, 0, 0]), (c, p, n) => {
    // la garganta clara con las rayitas oscuras
    if (p.y < 0.235 && n.z > 0.0 && n.y < 0.2) c.lerp(crema, 0.75 * (Math.sin(p.x * 260) > 0.2 ? 0.5 : 1));
  }));
  cabeza.add(miembro('#d9a52e', [[0, -0.004, 0.035], [0, -0.007, 0.06], [0, -0.01, 0.074]], [0.011, 0.006, 0.0018], 5, 6));   // el pico amarillo
  for (const l of [-1, 1]) {
    cabeza.add(bola('#d9a52e', [0.0105, 0.0105, 0.006], [l * 0.031, 0.012, 0.022]));   // el anillo del ojo
    cabeza.add(bola('#120e0b', [0.0075, 0.0075, 0.006], [l * 0.0335, 0.012, 0.023]));
  }
  g.add(cabeza);
  const patas = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * 0.026, 0.08, 0);
    piv.add(miembro('#c99a3e', [[0, 0.012, 0.0], [0, -0.045, 0.006], [0, -0.078, 0.0]], [0.0065, 0.005, 0.0045], 4, 5));
    for (const dx of [-0.008, 0, 0.008]) piv.add(miembro('#b88a34', [[0, -0.079, 0.0], [dx, -0.08, 0.02]], [0.0035, 0.0025], 2, 4));
    g.add(piv); patas.push(piv);
  }
  const alas = [];
  for (let i = 0; i < 2; i++) { const a2 = new THREE.Group(); g.add(a2); alas.push(a2); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.3, pie: 0.9, todo: true });
  return { g, cabeza, patas, alas };
}

function mallaLagartija() {
  const g = new THREE.Group();
  const piel = lam('#6a6250'), oscuro = lam('#3e3a30');
  g.add(esfera(piel, [0.028, 0.02, 0.08], [0, 0.02, 0]));
  g.add(esfera(oscuro, [0.029, 0.008, 0.07], [0, 0.032, 0]));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.022, 0.08);
  cabeza.add(esfera(piel, [0.024, 0.018, 0.035], [0, 0, 0]));
  cabeza.add(esfera(lam('#1c1713'), [0.007, 0.007, 0.007], [0.016, 0.008, 0.012]));
  cabeza.add(esfera(lam('#1c1713'), [0.007, 0.007, 0.007], [-0.016, 0.008, 0.012]));
  g.add(cabeza);
  g.add(cono(piel, 0.02, 0.16, [0, 0.02, -0.14], [-Math.PI / 2, 0, 0]));
  for (const l of [-1, 1]) for (const z of [0.045, -0.035]) {
    g.add(palo(piel, 0.007, 0.05, [l * 0.035, 0.012, z], [0, 0, l * 1.1]));
  }
  compactar(g, { suave: true });
  return { g, cabeza };
}

function mallaMariposa() {
  const g = new THREE.Group();
  g.add(esfera(lam('#3a3228'), [0.008, 0.008, 0.035], [0, 0, 0]));
  const a = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.03, l * 0.09, 0, 0.05, l * 0.08, 0, -0.03, 0, 0, -0.03], 3));
    geo.setIndex(l > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    geo.computeVertexNormals();
    piv.add(new THREE.Mesh(geo, lam('#d9752a', { side: THREE.DoubleSide })));
    g.add(piv); a.push(piv);
  }
  return { g, alas: a };
}

function mallaPanal(alto) {
  const g = new THREE.Group();
  const cera = lam('#b9924a');
  for (let i = 0; i < 4; i++) g.add(esfera(cera, [0.26 - i * 0.03, 0.13, 0.1], [0, i * 0.22, 0]));
  compactar(g, { suave: true });
  const hueco = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: '#1a1208' }));
  hueco.position.set(0, 0.34, 0.085);
  g.add(hueco);
  g.position.y = alto;
  return g;
}

// ---------------------------------------------------------------- lógica
export function crearBichos(T, veg, col, escena, sonido, registrar, progreso, objetos) {
  const r = rng(20260911);
  const tmp = new THREE.Vector3(), adelante = new THREE.Vector3();
  let cam = null, zoom = false;
  const poolSujetos = crearPoolPosicional(() => new THREE.Vector3(), 48);
  const poolRastros = crearPoolPosicional(() => new THREE.Vector3(), 16);
  const sujetos = poolSujetos.lista();
  const rastros = poolRastros.lista();
  const mirando = (pos, cerca, lejos) => {
    tmp.subVectors(pos, cam.position);
    const d = tmp.length();
    if (d > (zoom ? lejos : cerca)) return false;
    return tmp.divideScalar(d || 1).dot(adelante) > (zoom ? 0.985 : d < 4 ? 0.78 : 0.94);
  };
  const anotar = (id, pos, cerca, lejos) => { if (!progreso.entradas[id] && mirando(pos, cerca, lejos)) registrar(id); };
  const ver = (tipo, pos, id, cerca, lejos) => { const sujeto = poolSujetos.agregar(tipo, pos); if (id) anotar(id, sujeto.pos, cerca, lejos); };

  const buenSitio = (x, z, { bosqueMin = -1, bosqueMax = 2, pastoMin = -1, altMin = 1 } = {}) => {
    if (Math.abs(x) > 440 || Math.abs(z) > 440) return false;
    const k = T.indice(x, z);
    return !T.agua(x, z) && T.altura(x, z) > altMin && T.bosque[k] >= bosqueMin && T.bosque[k] <= bosqueMax && T.pasto[k] >= pastoMin && T.pendiente[k] < 0.8;
  };
  const buscarSitio = (opciones, separacion, ocupados) => {
    for (let i = 0; i < 500; i++) {
      const x = (r() * 2 - 1) * 430, z = (r() * 2 - 1) * 430;
      if (!buenSitio(x, z, opciones)) continue;
      if (ocupados.some((c) => Math.hypot(c.x - x, c.z - z) < separacion)) continue;
      return { x, z };
    }
    return null;
  };

  // ---------------------------------------------------------------- ciervos colorados
  const ciervos = [];
  const zonasCiervo = [];
  for (let i = 0; i < 3; i++) {
    const casa = buscarSitio({ bosqueMax: 0.85 }, 150, zonasCiervo);
    if (!casa) break;
    zonasCiervo.push(casa);
    const grupo = 1 + Math.floor(r() * 3);
    for (let j = 0; j < grupo; j++) {
      const macho = j === 0;
      const m = mallaCiervo(macho);
      const x = casa.x + (r() - 0.5) * 14, z = casa.z + (r() - 0.5) * 14;
      m.g.position.set(x, T.altura(x, z), z);
      escena.add(m.g);
      ciervos.push({ ...m, macho, casa, pos: m.g.position, rumbo: r() * 6, estado: 'pastar', t: r() * 5, vel: 0, fase: 0 });
    }
  }
  const PRM_CIERVO = { alerta: 34, huida: 15, radio: 55, paseo: 0.9, carrera: 7.5, zancada: 5, bajar: 0.95, salto: 0.28, r: 0.55 };
  let proxBramido = 12;

  // ---------------------------------------------------------------- jabalíes
  const jabalies = [];
  const zonasJabali = [];
  for (let i = 0; i < 3; i++) {
    const casa = buscarSitio({ bosqueMin: 0.35 }, 140, zonasJabali);
    if (!casa) break;
    zonasJabali.push(casa);
    const piara = 2 + Math.floor(r() * 3);
    for (let j = 0; j < piara; j++) {
      const m = mallaJabali(j > 1);
      const x = casa.x + (r() - 0.5) * 8, z = casa.z + (r() - 0.5) * 8;
      m.g.position.set(x, T.altura(x, z), z);
      escena.add(m.g);
      jabalies.push({ ...m, casa, pos: m.g.position, rumbo: r() * 6, estado: 'pastar', t: r() * 4, vel: 0, fase: 0, gruñe: r() * 6 });
    }
  }
  const PRM_JABALI = { alerta: 26, huida: 14, radio: 26, paseo: 0.7, carrera: 6.2, zancada: 7, bajar: 1.15, salto: 0.16, r: 0.45 };

  // ---------------------------------------------------------------- liebres
  const liebres = [];
  for (let i = 0; i < 4; i++) {
    const m = mallaLiebre();
    const idx = Math.floor(r() * T.sendero.length), p = T.sendero[idx];
    m.g.position.set(p.x + (r() - 0.5) * 12, T.altura(p.x, p.z), p.z + (r() - 0.5) * 12);
    escena.add(m.g);
    liebres.push({ ...m, idRastro: `liebre-${i}`, pos: m.g.position, rumbo: r() * 6, estado: 'quieta', t: 2 + r() * 5, vel: 0, fase: 0, brinco: 0 });
  }

  // ---------------------------------------------------------------- coipos
  const enAgua = (x, z) => { const a = T.agua(x, z); return a && a.prof > 0.25; };
  const orillaLago = () => {
    for (let i = 0; i < 80; i++) {
      const a = r() * 6.28;
      const rad = T.radioLago(a) * (0.72 + r() * 0.16);
      const x = LAGO.x + Math.cos(a) * rad, z = LAGO.z + Math.sin(a) * rad;
      if (enAgua(x, z)) return { x, z, a };
    }
    return null;
  };
  const coipos = [];
  for (let i = 0; i < 3; i++) {
    const p = orillaLago();
    if (!p) break;
    const m = mallaCoipo();
    m.g.position.set(p.x, 0.06, p.z);
    escena.add(m.g);
    coipos.push({ ...m, pos: m.g.position, casa: p, obj: null, rumbo: r() * 6, buceo: -1, t: r() * 6 });
  }

  // ---------------------------------------------------------------- cauquenes
  const cauquenes = [];
  const zonasCauquen = [];
  for (let i = 0; i < 2; i++) {
    const casa = buscarSitio({ bosqueMax: 0.12, pastoMin: 0.6 }, 120, zonasCauquen);
    if (!casa) break;
    zonasCauquen.push(casa);
    for (let j = 0; j < 2; j++) {
      const m = mallaCauquen(j === 0);
      const x = casa.x + (r() - 0.5) * 6, z = casa.z + (r() - 0.5) * 6;
      m.g.position.set(x, T.altura(x, z), z);
      escena.add(m.g);
      cauquenes.push({ ...m, casa, pos: m.g.position, rumbo: r() * 6, obj: null, t: r() * 4, fase: r() * 6, vel: 0 });
    }
  }
  let proxCauquen = 20;

  // ---------------------------------------------------------------- panal en un tronco
  let panal = null;
  {
    const candidatos = veg.arboles.filter((a) => !a.sacado && a.esc > 1 && (a.especie === 'coihue' || a.especie === 'lenga'));
    const a = candidatos[Math.floor(r() * candidatos.length)];
    if (a) {
      const ang = r() * 6.28;
      const g = mallaPanal(a.y + 2.6);
      g.position.set(a.x + Math.cos(ang) * (a.r - 0.05), a.y + 2.6, a.z + Math.sin(ang) * (a.r - 0.05));
      g.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang));
      escena.add(g);
      // abejas entrando y saliendo
      const N = 26;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const puntos = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#e0b344', size: 0.09, sizeAttenuation: true, depthWrite: false }));
      puntos.frustumCulled = false;
      escena.add(puntos);
      panal = { g, puntos, pos: new THREE.Vector3(g.position.x, a.y + 2.9, g.position.z), fases: Array.from({ length: N }, () => r()), arbol: a, enojo: 0 };
      col.agregar({ x: a.x, z: a.z, r: a.r + 0.1 });
    }
  }

  // ---------------------------------------------------------------- mangangás
  const flores = [
    ...veg.plantas.filter((p) => !p.sacado && (p.tipo === 'chilco' || p.tipo === 'notro')),
    ...objetos.items.filter((it) => it.tipo === 'amancay' || it.tipo === 'calafate'),
  ];
  const abejorros = [];
  for (let i = 0; i < 3; i++) {
    const m = mallaManganga();
    m.g.visible = false && !sale(m);
    escena.add(m.g);
    abejorros.push({ ...m, flor: null, obj: new THREE.Vector3(), t: 0, fase: r() * 6, zumba: r() * 4 });
  }
  let buscaFlor = 0;

  // ---------------------------------------------------------------- mariposas
  const mariposas = [];
  for (let i = 0; i < 6; i++) {
    const m = mallaMariposa();
    m.g.visible = false && !sale(m);
    escena.add(m.g);
    mariposas.push({ ...m, pos: new THREE.Vector3(), obj: new THREE.Vector3(), t: 0, fase: r() * 6 });
  }

  // ---------------------------------------------------------------- guanacos
  const guanacos = [];
  for (let i = 0; i < 7; i++) {
    const m = mallaGuanaco(i === 6);
    m.g.visible = false;
    escena.add(m.g);
    const sombra = crearSombraContacto(escena, i === 6 ? 0.30 : 0.38, i === 6 ? 0.62 : 0.82, 0.14);
    sombra.visible = false;
    guanacos.push({ ...m, idRastro: `guanaco-${i}`, sombra, pos: new THREE.Vector3(), rumbo: r() * 6, t: r() * 6, paso: r() * 6, vel: 0, alerta: 0, lejos: true, jefe: i === 0, offsetGrupo: new THREE.Vector2() });
  }
  let buscaTropilla = 0;
  const centroTropilla = new THREE.Vector3();

  // ---------------------------------------------------------------- zorzales
  // Posaderos bajos derivados de árboles reales: permiten alternar suelo/rama sin crear postes artificiales.
  const perchasZorzal = [];
  for (let i = 0; i < veg.arboles.length; i += 7) {
    const a = veg.arboles[i];
    if (!a || a.sacado || a.especie === 'seco' || a.esc < 0.65) continue;
    const ang = (i * 2.399963 + a.x * 0.013 - a.z * 0.009) % (Math.PI * 2);
    const rr = Math.max(0.35, a.r * 0.72);
    perchasZorzal.push({ x: a.x + Math.cos(ang) * rr, y: a.y + 1.4 + Math.min(1.5, a.esc * 0.65), z: a.z + Math.sin(ang) * rr });
  }
  const buscarPerchaZorzal = (x, z, radio = 11) => {
    let mejor = null, dm = radio;
    for (const p2 of perchasZorzal) { const d2 = Math.hypot(p2.x - x, p2.z - z); if (d2 < dm) { dm = d2; mejor = p2; } }
    return mejor;
  };
  const zorzales = [];
  for (let i = 0; i < 5; i++) {
    const m = mallaZorzal();
    m.g.visible = false && !sale(m);
    escena.add(m.g);
    zorzales.push({ ...m, pos: new THREE.Vector3(), obj: new THREE.Vector3(), rumbo: r() * 6, t: r() * 3, fase: r() * 6, salto: 0, volando: 0, lejos: true, enPercha: false });
  }

  // ---------------------------------------------------------------- lagartijas
  const lagartijas = [];
  for (let i = 0; i < 4; i++) {
    const m = mallaLagartija();
    m.g.visible = false && !sale(m);
    escena.add(m.g);
    lagartijas.push({ ...m, pos: new THREE.Vector3(), roca: null, rumbo: r() * 6, t: r() * 4, huyendo: 0 });
  }
  let buscaRoca = 0;

  // ---------------------------------------------------------------- murciélagos
  const murcielagos = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    g.add(esfera(lam('#2a2420'), [0.035, 0.035, 0.07], [0, 0, 0]));
    const a = alas(g, '#463c34', 0.19, 0.11, 0.01, -0.01);
    g.visible = false;
    escena.add(g);
    murcielagos.push({ g, alas: a, centro: new THREE.Vector3(), ang: r() * 6.28, radio: 6 + r() * 9, alto: 5 + r() * 5, vel: 1.1 + r() * 0.8, fase: r() * 6, chilla: r() * 3 });
  }

  // ================================================================== actualización
  function actualizar(dt, jugador, camara, m) {
    // con lluvia fuerte o tormenta los animales se guardan y casi no se ven
    const malTiempo = (m.lluvia || 0) > 0.5 || m.tormenta;
    const escondidos = malTiempo ? (m.tormenta ? 0.85 : 0.6) : 0;
    // a cada animal le toca un número fijo; si cae bajo el umbral, hoy no sale
    const sale = (o) => { if (o.suerte === undefined) o.suerte = Math.random(); return o.suerte >= escondidos; };
    cam = camara; zoom = jugador.estado.zoom;
    camara.getWorldDirection(adelante);
    const js = jugador.estado;
    poolSujetos.reiniciar();
    poolRastros.reiniciar();
    const h = m.horas;
    const penumbra = (h > 5.5 && h < 9.5) || (h > 18.5 && h < 22);
    const deDia = m.dia > 0.35;
    const actividadLiebre = actividadFaunaPatagonica('liebre', h, m);
    const actividadGuanaco = actividadFaunaPatagonica('guanaco', h, m);
    const actividadZorzal = actividadFaunaPatagonica('zorzal', h, m);
    const cerca = (p, d) => Math.hypot(p.x - js.pos.x, p.z - js.pos.z) < d;

    // ----- ciervos colorados
    for (const c of ciervos) {
      const dCiervo = Math.hypot(c.pos.x - js.pos.x, c.pos.z - js.pos.z);
      c.g.visible = (dCiervo < 240) && sale(c);
      limitarSombrasPorDistancia(c.g, dCiervo, 58);
      if (!c.g.visible) continue;
      actualizarCiervo(c, dt, js, PRM_CIERVO, T, col);
      tmp.set(c.pos.x, c.pos.y + 1.5, c.pos.z);
      if (c.estado !== 'huir') ver('ciervo', tmp, 'ciervo', 45, 150);
      else ver('ciervo', tmp);
    }
    proxBramido -= dt;
    if (proxBramido <= 0) {
      const machos = ciervos.filter((c) => c.macho && cerca(c.pos, 260));
      if (machos.length && (m.otono > 0.5 || penumbra)) {
        const c = machos[Math.floor(r() * machos.length)];
        sonido.bramido({ x: c.pos.x, y: c.pos.y + 1.6, z: c.pos.z });
        if (!progreso.entradas.ciervo && cerca(c.pos, 60)) setTimeout(() => registrar('ciervo'), 2500);
      }
      proxBramido = m.otono > 0.5 ? 20 + r() * 35 : 60 + r() * 90;
    }

    // ----- jabalíes
    for (const j of jabalies) {
      const dJabali = Math.hypot(j.pos.x - js.pos.x, j.pos.z - js.pos.z);
      j.g.visible = (dJabali < 200) && sale(j);
      limitarSombrasPorDistancia(j.g, dJabali, 52);
      if (!j.g.visible) continue;
      actualizarCiervo(j, dt, js, PRM_JABALI, T, col);
      j.gruñe -= dt;
      if (j.gruñe <= 0) {
        if (cerca(j.pos, 60) && r() < 0.5) sonido.gruñido({ x: j.pos.x, y: j.pos.y + 0.5, z: j.pos.z });
        j.gruñe = j.estado === 'huir' ? 1 + r() : 6 + r() * 12;
      }
      tmp.set(j.pos.x, j.pos.y + 0.6, j.pos.z);
      ver('jabali', tmp, j.estado !== 'huir' ? 'jabali' : null, 30, 110);
    }

    // ----- liebres
    for (let li = 0; li < liebres.length; li++) {
      const l = liebres[li];
      const d = Math.hypot(l.pos.x - js.pos.x, l.pos.z - js.pos.z);
      const dtIAL = consumirPresupuestoIA(l, dt, d, l.estado === 'correr' || d < 28);
      let zorroCerca = l.__predadorIA || null;
      if (dtIAL > 0 || l.__predadorIA === undefined) { zorroCerca = animalMasCercano('zorro', l.pos, 28); l.__predadorIA = zorroCerca; }
      l.g.visible = (d < 130) && sale(l);
      if (!l.g.visible) continue;
      l.t -= dt;
      const amenazaZorro = zorroCerca && zorroCerca.d < 22;
      if (l.estado !== 'correr' && ((d < (js.agachado ? 6 : 14) && js.velocidadActual > 0.3) || amenazaZorro)) {
        l.estado = 'correr'; l.t = amenazaZorro ? 4.2 + r() * 1.4 : 3.5 + r() * 2;
        const ax = amenazaZorro ? zorroCerca.x : js.pos.x, az = amenazaZorro ? zorroCerca.z : js.pos.z;
        l.rumbo = Math.atan2(l.pos.x - ax, l.pos.z - az);
      }
      let vel = 0;
      if (l.estado === 'correr') {
        vel = 7.5;
        l.rumbo += Math.sin(l.t * 5) * dt * 2.6;   // zigzag
        if (l.t <= 0) { l.estado = 'quieta'; l.t = 4 + r() * 6; }
      } else if (l.estado === 'quieta') {
        if (l.t <= 0) {
          if (r() < actividadLiebre) { l.estado = 'saltar'; l.t = 1.6 + r() * 2.6; l.rumbo = r() * 6.28; }
          else l.t = 2.5 + r() * 4.5;
        }
      } else {
        vel = 1.4;
        if (l.t <= 0) { l.estado = 'quieta'; l.t = 3 + r() * 6; }
      }
      l.vel = lerp(l.vel, vel, 1 - Math.exp(-6 * dt));
      if (l.vel > 0.05) {
        const nx = l.pos.x + Math.sin(l.rumbo) * l.vel * dt, nz = l.pos.z + Math.cos(l.rumbo) * l.vel * dt;
        if (T.agua(nx, nz) || Math.abs(nx) > LIMITE || Math.abs(nz) > LIMITE) l.rumbo += 2.4;
        else { l.pos.x = nx; l.pos.z = nz; col.resolver(l.pos, 0.2); }
      }
      l.fase += dt * (3 + l.vel * 3.2);
      l.pos.y = T.altura(l.pos.x, l.pos.z) + Math.abs(Math.sin(l.fase)) * Math.min(0.35, l.vel * 0.06);
      l.g.rotation.y = l.rumbo;
      const est = Math.min(1, l.vel);
      l.patas.forEach((p, i) => { p.rotation.x = Math.sin(l.fase * 2 + (i > 1 ? 0.6 : 0)) * 0.7 * est; });
      const microL = actualizarMicroconducta(l, 'liebre', dt, { riesgo: amenazaZorro ? 1 : clamp(1 - d / 16, 0, 1), actividad: actividadLiebre, velocidad: l.vel, estado: l.estado, lluvia: m.lluvia || 0 }, r);
      const gestoL = gestoMicroconducta('liebre', microL, l.microFase);
      const calmaL = l.estado === 'quieta' ? 1 : 0;
      l.cabeza.rotation.x = lerp(l.cabeza.rotation.x, (l.estado === 'quieta' ? 0.35 : -0.1) + gestoL.cabezaX * 0.55 * calmaL, 1 - Math.exp(-dt * 7));
      l.cabeza.rotation.y = lerp(l.cabeza.rotation.y, gestoL.cabezaY * calmaL, 1 - Math.exp(-dt * 8));
      if (l.orejas) l.orejas.forEach((o, i2) => { o.rotation.y = lerp(o.rotation.y, gestoL.orejaY * (i2 ? -1 : 1) * Math.max(calmaL, amenazaZorro ? 1 : 0), 1 - Math.exp(-dt * 10)); });
      publicarAnimal('liebre', `liebre-${li}`, l.pos, { estado: l.estado, vel: l.vel, micro: microL });
      poolRastros.agregar('liebre', l.pos, 0, l.idRastro, l.vel);
      tmp.set(l.pos.x, l.pos.y + 0.3, l.pos.z);
      ver('liebre', tmp, 'liebre', 20, 70);
    }

    // ----- coipos
    for (const c of coipos) {
      const d = Math.hypot(c.pos.x - js.pos.x, c.pos.z - js.pos.z);
      c.g.visible = (d < 120 && c.buceo < 0) && sale(c);
      if (d > 130) continue;
      if (c.buceo >= 0) {
        c.buceo -= dt;
        if (c.buceo < 0) {
          const p = orillaLago();
          if (p) { c.pos.set(p.x, 0.06, p.z); c.casa = p; }
          sonido.chapoteo(c.pos, 0.4);
        }
        continue;
      }
      c.t -= dt;
      if (d < (js.agachado ? 5 : 11)) { c.buceo = 4 + r() * 4; sonido.chapoteo(c.pos, 0.7); continue; }
      if (!c.obj || c.t <= 0) {
        for (let i = 0; i < 20; i++) {
          const a = r() * 6.28, rr = 2 + r() * 9;
          const x = c.casa.x + Math.cos(a) * rr, z = c.casa.z + Math.sin(a) * rr;
          if (enAgua(x, z)) { c.obj = { x, z }; break; }
        }
        c.t = 4 + r() * 6;
      }
      // 2.6.1: si en veinte intentos no encontró agua honda, `c.obj` quedaba null y
      // la línea de abajo reventaba; se queda quieto y prueba de nuevo el próximo cuadro
      if (!c.obj) continue;
      const rumbo = Math.atan2(c.obj.x - c.pos.x, c.obj.z - c.pos.z);
      c.rumbo += Math.atan2(Math.sin(rumbo - c.rumbo), Math.cos(rumbo - c.rumbo)) * Math.min(1, dt * 1.6);
      const vel = Math.min(0.65, Math.hypot(c.obj.x - c.pos.x, c.obj.z - c.pos.z) * 0.4);
      const nx = c.pos.x + Math.sin(c.rumbo) * vel * dt, nz = c.pos.z + Math.cos(c.rumbo) * vel * dt;
      if (enAgua(nx, nz)) { c.pos.x = nx; c.pos.z = nz; } else c.obj = null;
      c.pos.y = 0.02 + Math.sin(U() * 1.8) * 0.015;
      c.g.rotation.y = c.rumbo;
      c.cabeza.rotation.x = Math.sin(U() * 0.9) * 0.12;
      tmp.set(c.pos.x, c.pos.y + 0.2, c.pos.z);
      ver('coipo', tmp, 'coipo', 22, 75);
    }

    // ----- cauquenes
    const hayCauquen = deDia && m.invierno < 0.5;
    for (const c of cauquenes) {
      c.g.visible = (hayCauquen && cerca(c.pos, 180)) && sale(c);
      if (!c.g.visible) continue;
      const d = Math.hypot(c.pos.x - js.pos.x, c.pos.z - js.pos.z);
      c.t -= dt;
      const escapa = d < 22 && js.velocidadActual > 0.5 && !js.agachado;
      if (!c.obj || c.t <= 0 || escapa) {
        const ang = escapa ? Math.atan2(c.pos.x - js.pos.x, c.pos.z - js.pos.z) : r() * 6.28;
        const rr = escapa ? 14 : 3 + r() * 9;
        c.obj = { x: c.pos.x + Math.sin(ang) * rr, z: c.pos.z + Math.cos(ang) * rr };
        c.t = escapa ? 3 : 3 + r() * 5;
        if (escapa && r() < 0.4) sonido.cauquen({ x: c.pos.x, y: c.pos.y + 0.6, z: c.pos.z });
      }
      const rumbo = Math.atan2(c.obj.x - c.pos.x, c.obj.z - c.pos.z);
      c.rumbo += Math.atan2(Math.sin(rumbo - c.rumbo), Math.cos(rumbo - c.rumbo)) * Math.min(1, dt * 3);
      const lejos = Math.hypot(c.obj.x - c.pos.x, c.obj.z - c.pos.z);
      const vel = lejos > 0.6 ? (escapa ? 2.2 : 0.55) : 0;
      const nx = c.pos.x + Math.sin(c.rumbo) * vel * dt, nz = c.pos.z + Math.cos(c.rumbo) * vel * dt;
      if (!T.agua(nx, nz) && Math.abs(nx) < LIMITE && Math.abs(nz) < LIMITE) { c.pos.x = nx; c.pos.z = nz; } else c.obj = null;
      c.pos.y = T.altura(c.pos.x, c.pos.z);
      c.g.rotation.y = c.rumbo;
      c.fase += dt * (vel ? 6 : 1.2);
      c.patas.forEach((p, i) => { p.rotation.x = vel ? Math.sin(c.fase + i * Math.PI) * 0.5 : 0; });
      c.cabeza.rotation.x = vel ? 0.1 : 0.75 + Math.sin(c.fase * 2.5) * 0.25;
      tmp.set(c.pos.x, c.pos.y + 0.7, c.pos.z);
      ver('cauquen', tmp, 'cauquen', 32, 110);
    }
    proxCauquen -= dt;
    if (proxCauquen <= 0) {
      const c = cauquenes.find((x) => x.g.visible && cerca(x.pos, 140));
      if (c) sonido.cauquen({ x: c.pos.x, y: c.pos.y + 0.6, z: c.pos.z });
      proxCauquen = 25 + r() * 45;
    }

    // ----- panal
    let panalSonido = null;
    if (panal) {
      const d = Math.hypot(panal.pos.x - js.pos.x, panal.pos.z - js.pos.z);
      const visible = d < 70;
      panal.g.visible = (visible) && sale(panal);
      panal.puntos.visible = visible && deDia;
      if (visible) {
        panalSonido = { pos: panal.pos, fuerza: clamp(1 - d / 24, 0, 1) * (deDia ? 1 : 0.45) * (1 + panal.enojo) };
        if (panal.puntos.visible) {
          const arr = panal.puntos.geometry.attributes.position.array;
          for (let i = 0; i < panal.fases.length; i++) {
            panal.fases[i] += dt * (0.18 + (i % 5) * 0.05);
            if (panal.fases[i] > 1) panal.fases[i] -= 1;
            const f = panal.fases[i], a = i * 2.4 + U() * (0.6 + panal.enojo * 2);
            const rad = Math.sin(f * Math.PI) * (1.2 + panal.enojo * 2.2);
            arr[i * 3] = panal.pos.x + Math.cos(a) * rad;
            arr[i * 3 + 1] = panal.pos.y + Math.sin(f * 7 + i) * 0.5 + (f - 0.5) * 0.6;
            arr[i * 3 + 2] = panal.pos.z + Math.sin(a) * rad;
          }
          panal.puntos.geometry.attributes.position.needsUpdate = true;
        }
        if (d < 4.5) {
          panal.enojo = Math.min(1, panal.enojo + dt * 0.5);
          if (panal.enojo > 0.6 && !panal.aviso) { panal.aviso = true; registrar('panal'); }
        } else panal.enojo = Math.max(0, panal.enojo - dt * 0.3);
        ver('panal', panal.pos, null);
        if (!progreso.entradas.panal && mirando(panal.pos, 9, 26)) registrar('panal');
      }
    }

    // ----- mangangás
    buscaFlor -= dt;
    const hayBichos = deDia && m.invierno < 0.5 && m.lluvia < 0.5;
    if (buscaFlor <= 0) {
      buscaFlor = 2;
      for (const b of abejorros) {
        if (!hayBichos) { b.flor = null; continue; }
        let mejor = null, dm = 22;
        for (let i = 0; i < 40; i++) {
          const f = flores[Math.floor(r() * flores.length)];
          if (!f) break;
          const d = Math.hypot(f.x - js.pos.x, f.z - js.pos.z);
          if (d < dm && !abejorros.some((o) => o !== b && o.flor === f)) { dm = d; mejor = f; }
        }
        if (mejor && mejor !== b.flor) { b.flor = mejor; b.g.position.set(mejor.x, (mejor.y ?? T.altura(mejor.x, mejor.z)) + 0.8, mejor.z); b.t = 0; }
        else if (!mejor) b.flor = null;
      }
    }
    for (const b of abejorros) {
      b.g.visible = (!!b.flor && hayBichos) && sale(b);
      if (!b.g.visible) continue;
      b.t -= dt;
      if (b.t <= 0) {
        const a = r() * 6.28, rr = 0.25 + r() * 0.7;
        const base = (b.flor.y ?? T.altura(b.flor.x, b.flor.z));
        b.obj.set(b.flor.x + Math.cos(a) * rr, base + 0.35 + r() * 0.9, b.flor.z + Math.sin(a) * rr);
        b.t = 0.7 + r() * 1.4;
      }
      b.g.position.lerp(b.obj, 1 - Math.exp(-3.5 * dt));
      b.fase += dt * 60;
      b.alas[0].rotation.z = Math.sin(b.fase) * 0.9;
      b.alas[1].rotation.z = -Math.sin(b.fase) * 0.9;
      b.g.rotation.y += dt * 0.8;
      b.zumba -= dt;
      if (b.zumba <= 0) {
        if (Math.hypot(b.g.position.x - js.pos.x, b.g.position.z - js.pos.z) < 12) sonido.zumbido(b.g.position, 0.5 + r() * 0.8);
        b.zumba = 2.5 + r() * 4;
      }
      ver('manganga', b.g.position, 'manganga', 4.5, 14);
    }

    // ----- mariposas
    const hayMariposas = hayBichos && h > 10 && h < 18;
    for (const mp of mariposas) {
      const lejos = Math.hypot(mp.pos.x - js.pos.x, mp.pos.z - js.pos.z) > 26;
      mp.g.visible = (hayMariposas) && sale(mp);
      if (!hayMariposas) continue;
      mp.t -= dt;
      if (mp.t <= 0 || lejos) {
        for (let i = 0; i < 12; i++) {
          const a = r() * 6.28, d = 4 + r() * 16;
          const x = js.pos.x + Math.cos(a) * d, z = js.pos.z + Math.sin(a) * d;
          if (buenSitio(x, z, { bosqueMax: 0.55 })) {
            if (lejos) mp.pos.set(x, T.altura(x, z) + 1, z);
            mp.obj.set(x, T.altura(x, z) + 0.5 + r() * 1.4, z);
            break;
          }
        }
        mp.t = 1 + r() * 2;
      }
      mp.pos.lerp(mp.obj, 1 - Math.exp(-1.6 * dt));
      mp.fase += dt * 9;
      mp.g.position.copy(mp.pos);
      mp.g.position.y += Math.sin(mp.fase) * 0.09;
      mp.g.rotation.y += dt * 1.2;
      const aleteo = 0.3 + Math.abs(Math.sin(mp.fase)) * 1.1;
      mp.alas[0].rotation.z = aleteo; mp.alas[1].rotation.z = -aleteo;
      ver('mariposa', mp.g.position, 'mariposa', 5, 16);
    }

    // ----- guanacos: andan en tropilla por la estepa y miran de lejos
    buscaTropilla -= dt;
    const enEstepa = T.estepa && T.estepa[T.indice(js.pos.x, js.pos.z)] > 0.3;
    if (buscaTropilla <= 0) {
      buscaTropilla = 2.5;
      if (enEstepa && guanacos[0].lejos) {
        // la tropilla aparece a cierta distancia, en un claro de la estepa
        for (let i = 0; i < 40; i++) {
          const a2 = r() * 6.28, dd = 32 + r() * 55;
          const cx = js.pos.x + Math.cos(a2) * dd, cz = js.pos.z + Math.sin(a2) * dd;
          if (Math.abs(cx) > 430 || Math.abs(cz) > 430) continue;
          const perfilG = perfilHabitatPatagonico(T, cx, cz);
          if (perfilG.estepa < 0.48 || perfilG.pendiente > 0.5 || T.agua(cx, cz)) continue;
          centroTropilla.set(cx, 0, cz);
          guanacos.forEach((gu, k) => {
            const ang = (k / guanacos.length) * 6.28;
            const x = cx + Math.cos(ang) * (3 + r() * 7), z = cz + Math.sin(ang) * (3 + r() * 7);
            gu.pos.set(x, T.altura(x, z), z);
            gu.lejos = false; gu.alerta = 0; gu.rumbo = r() * 6.28;
          });
          break;
        }
      }
    }
    // La tropilla comparte la alarma: el adulto centinela reacciona antes y el resto lo sigue.
    let alarmaGrupo = 0;
    let activosGrupo = 0, gx = 0, gz = 0;
    for (const gu of guanacos) {
      if (gu.lejos) continue;
      const dG = Math.hypot(gu.pos.x - js.pos.x, gu.pos.z - js.pos.z);
      const dtIAG = consumirPresupuestoIA(gu, dt, dG, gu.alerta > 0.2 || dG < 52);
      let sensorG = gu.__sensorIA;
      if (dtIAG > 0 || !sensorG) { sensorG = percepcionMamifero(T, gu.pos, js, m, gu.jefe ? 54 : 42, gu.jefe ? 68 : 52); gu.__sensorIA = sensorG; }
      gu.percepcion = sensorG;
      const alertaSensor = sensorG.riesgo * (gu.jefe ? 1 : 0.86);
      alarmaGrupo = Math.max(alarmaGrupo, alertaSensor);
      gx += gu.pos.x; gz += gu.pos.z; activosGrupo++;
    }
    if (activosGrupo) { gx /= activosGrupo; gz /= activosGrupo; }

    for (const gu of guanacos) {
      const d = Math.hypot(gu.pos.x - js.pos.x, gu.pos.z - js.pos.z);
      gu.g.visible = !gu.lejos && d < 220 && sale(gu);
      limitarSombrasPorDistancia(gu.g, d, 58);
      if (gu.lejos || !gu.g.visible) { if (gu.sombra) gu.sombra.visible = false; if (d > 260) gu.lejos = true; continue; }
      const alertaPropia = gu.percepcion ? gu.percepcion.riesgo : (d < 42 ? clamp(1 - (d - 16) / 26, 0, 1) : 0);
      const objetivoAlerta = Math.max(alertaPropia, alarmaGrupo * (gu.jefe ? 1 : 0.86));
      gu.alerta = lerp(gu.alerta, objetivoAlerta, 1 - Math.exp(-dt * (objetivoAlerta > gu.alerta ? 3.2 : 0.6)));

      if (gu.alerta > 0.78) {
        gu.vel = lerp(gu.vel, gu.cria ? 5.5 : 6.4, 1 - Math.exp(-dt * 1.8));
        gu.rumbo = Math.atan2(gu.pos.x - js.pos.x, gu.pos.z - js.pos.z);
      } else if (gu.alerta > 0.2 || (gu.jefe && gu.alerta > 0.08)) {
        gu.vel = lerp(gu.vel, 0, 1 - Math.exp(-dt * 3));
        gu.rumbo = Math.atan2(js.pos.x - gu.pos.x, js.pos.z - gu.pos.z);
      } else {
        gu.t -= dt;
        if (gu.t <= 0) { gu.t = 3 + r() * 6; gu.rumbo += (r() - 0.5) * 1.3; }
        // cohesión suave: no marchan en círculo perfecto, pero tampoco se desarman como partículas.
        const dc = Math.hypot(gu.pos.x - gx, gu.pos.z - gz);
        if (dc > (gu.jefe ? 10 : 13)) gu.rumbo = Math.atan2(gx - gu.pos.x, gz - gu.pos.z) + (r() - 0.5) * 0.35;
        const activo = r() < 0.5 * actividadGuanaco;
        gu.vel = lerp(gu.vel, activo ? (gu.cria ? 0.75 : 0.9) : 0, 1 - Math.exp(-dt * 0.8));
      }
      if (gu.vel > 0.05) {
        const nx = gu.pos.x + Math.sin(gu.rumbo) * gu.vel * dt;
        const nz = gu.pos.z + Math.cos(gu.rumbo) * gu.vel * dt;
        const perfilPaso = perfilHabitatPatagonico(T, nx, nz);
        const sigueEstepa = perfilPaso.estepa > 0.16 && perfilPaso.pendiente < 0.75;
        if (!T.agua(nx, nz) && sigueEstepa && Math.abs(nx) < 460 && Math.abs(nz) < 460) { gu.pos.x = nx; gu.pos.z = nz; }
        else gu.rumbo += 2.0 + r() * 0.5;
      }
      gu.pos.y = T.altura(gu.pos.x, gu.pos.z);
      const marchaG = marchaMamifero(gu.vel, gu.alerta > 0.78 ? 'huir' : 'caminar', gu.cria ? 0.75 : 0.9, gu.cria ? 5.5 : 6.4);
      gu.marcha = marchaG.modo;
      gu.paso += dt * marchaG.cadencia;
      const anda = gu.vel > 0.2;
      gu.patas.forEach((pt, i2) => { pt.rotation.x = anda ? Math.sin(gu.paso + (i2 % 2 ? Math.PI : 0) + (i2 > 1 ? marchaG.posterior : 0)) * marchaG.amplitud : 0; });
      gu.g.position.copy(gu.pos);
      gu.g.position.y += anda ? Math.abs(Math.sin(gu.paso * 0.5)) * marchaG.rebote : 0;
      gu.g.rotation.y = gu.rumbo;
      const sueloG = inclinacionTerrenoMamifero(T, gu.pos, gu.rumbo, 0.22);
      const kSueloG = 1 - Math.exp(-dt * 7);
      gu.g.rotation.x = lerp(gu.g.rotation.x, sueloG.pitch, kSueloG);
      gu.g.rotation.z = lerp(gu.g.rotation.z, sueloG.roll + (anda ? Math.sin(gu.paso) * 0.012 : 0), kSueloG);
      // Centinela erguido; los demás alternan pastoreo, rumia, acicalado y vigilancia.
      const vigilancia = Math.max(gu.alerta, gu.jefe ? 0.28 : 0);
      const microG = actualizarMicroconducta(gu, 'guanaco', dt, { riesgo: vigilancia, actividad: actividadGuanaco, velocidad: gu.vel, estado: anda ? 'caminar' : 'pastar', lluvia: m.lluvia || 0 }, r);
      const gestoG = gestoMicroconducta('guanaco', microG, gu.microFase);
      const pastando = !anda && vigilancia < 0.18 && microG === 'forrajear' ? 1 : 0;
      gu.cuello.rotation.x = lerp(gu.cuello.rotation.x, lerp(0.78 * pastando, -0.1, clamp(vigilancia * 1.25, 0, 1)) + gestoG.cabezaX * 0.16 * (anda ? 0 : 1), 1 - Math.exp(-dt * 4));
      gu.cabeza.rotation.x = -gu.cuello.rotation.x * 0.52 + (gu.jefe ? -0.04 : 0) + gestoG.cabezaX * 0.22 * (anda ? 0 : 1);
      gu.cola.rotation.x = 0.9 + Math.sin(gu.paso * 0.35) * 0.05;
      gu.cola.rotation.z = gestoG.colaY * (anda ? 0.3 : 1);
      const miradaG = vigilancia > 0.14 ? Math.sin(reloj * (gu.jefe ? 0.72 : 0.48) + (gu.jefe ? 0 : gu.t)) * 0.28 : gestoG.cabezaY * (anda ? 0.2 : 1);
      gu.cabeza.rotation.y = lerp(gu.cabeza.rotation.y, miradaG, 1 - Math.exp(-dt * 3.5));
      if (gu.orejas) gu.orejas.forEach((o, i2) => { o.rotation.y = lerp(o.rotation.y, gestoG.orejaY * (i2 ? -1 : 1) * Math.max(0.35, 1 - gu.vel), 1 - Math.exp(-dt * 8)); });
      actualizarSombraContacto(gu.sombra, T, gu.pos, gu.g.visible, gu.alerta > 0.78 ? 0.72 : 1);
      ver('guanaco', gu.pos, 'guanaco', 40, 150);
      poolRastros.agregar('guanaco', gu.pos, 0, gu.idRastro, gu.vel);
    }

    // ----- zorzales: picotean el suelo y vuelan si te acercás
    const hayZorzal = deDia && actividadZorzal > 0.30 && m.lluvia < 0.6;
    const firmaJugador = firmaSonoraJugador(js, m);
    for (const z of zorzales) {
      z.g.visible = (hayZorzal) && sale(z);
      if (!hayZorzal) continue;
      const d = Math.hypot(z.pos.x - js.pos.x, z.pos.z - js.pos.z);
      if (z.lejos || d > 34) {
        // reaparece en un claro cerca del jugador
        for (let i = 0; i < 14; i++) {
          const a2 = r() * 6.28, dd = 8 + r() * 16;
          const x = js.pos.x + Math.cos(a2) * dd, zz = js.pos.z + Math.sin(a2) * dd;
          if (buenSitio(x, zz, { bosqueMax: 0.85 })) {
            const percha = r() < 0.30 ? buscarPerchaZorzal(x, zz, 10) : null;
            if (percha) { z.pos.set(percha.x, percha.y, percha.z); z.enPercha = true; z.t = 1.6 + r() * 3.2; }
            else { z.pos.set(x, T.altura(x, zz), zz); z.enPercha = false; }
            z.lejos = false; z.volando = 0; break;
          }
        }
        continue;
      }
      z.t -= dt;
      if (z.volando > 0) {
        z.volando -= dt;
        z.pos.x += Math.sin(z.rumbo) * 6 * dt;
        z.pos.z += Math.cos(z.rumbo) * 6 * dt;
        z.pos.y = T.altura(z.pos.x, z.pos.z) + Math.sin(Math.min(1, (0.9 - z.volando) * 1.4) * Math.PI) * 2.6;
        z.fase += dt * 22;
        z.alas.forEach((a3, i) => { a3.rotation.z = (i ? -1 : 1) * Math.sin(z.fase) * 0.9; });
        if (z.volando <= 0) { z.lejos = true; }
      } else {
        const zorroAve = animalMasCercano('zorro', z.pos, 7);
        const alarmaVecina = animalMasCercano('alarmaAve', z.pos, 12);
        const amenazaJugador = d < (js.agachado ? 4.5 : 8 + firmaJugador * 4.5) && (js.velocidadActual > 0.4 || firmaJugador > 0.55);
        if (amenazaJugador || zorroAve || alarmaVecina) {
        z.volando = 0.9; z.enPercha = false;
        const ax = zorroAve ? zorroAve.x : alarmaVecina ? alarmaVecina.x : js.pos.x;
        const az = zorroAve ? zorroAve.z : alarmaVecina ? alarmaVecina.z : js.pos.z;
        z.rumbo = Math.atan2(z.pos.x - ax, z.pos.z - az);
        publicarAnimal('alarmaAve', `zorzal-${zorzales.indexOf(z)}`, z.pos, { intensidad: amenazaJugador ? 1 : 0.72 });
        if (r() < 0.5) sonido.ave(z.pos);
        } else if (z.enPercha) {
        const microPercha = actualizarMicroconducta(z, 'zorzal', dt, { riesgo: 0, actividad: actividadZorzal, velocidad: 0, estado: 'percha', lluvia: m.lluvia || 0 }, r);
        const gestoPercha = gestoMicroconducta('zorzal', microPercha === 'picotear' ? 'observar' : microPercha, z.microFase);
        z.fase += dt * 1.4;
        z.cabeza.rotation.x = lerp(z.cabeza.rotation.x, -0.05 + gestoPercha.cabezaX * 0.45, 1 - Math.exp(-dt * 6));
        z.cabeza.rotation.y = lerp(z.cabeza.rotation.y, gestoPercha.cabezaY, 1 - Math.exp(-dt * 7));
        z.alas.forEach((a3) => { a3.rotation.z = 0; });
        z.patas.forEach((p) => { p.rotation.x = -0.22; });
        if (z.t <= 0) { z.volando = 0.9; z.enPercha = false; z.rumbo += (r() - 0.5) * 1.8; }
        } else {
        // Secuencias cortas: picoteo, observación y rascar la hojarasca entre saltitos.
        const microZorzal = actualizarMicroconducta(z, 'zorzal', dt, { riesgo: 0, actividad: actividadZorzal, velocidad: z.salto > 0 ? 0.9 : 0, estado: 'suelo', lluvia: m.lluvia || 0 }, r);
        const gestoZorzal = gestoMicroconducta('zorzal', microZorzal, z.microFase);
        if (z.t <= 0) {
          z.t = microZorzal === 'observar' ? 1.0 + r() * 1.2 : 0.6 + r() * 2.2;
          z.rumbo += (r() - 0.5) * (microZorzal === 'observar' ? 0.8 : 2.2);
          if (microZorzal !== 'observar') z.salto = 0.32;
        }
        if (z.salto > 0) {
          z.salto -= dt;
          z.pos.x += Math.sin(z.rumbo) * 0.9 * dt;
          z.pos.z += Math.cos(z.rumbo) * 0.9 * dt;
        }
        z.fase += dt * 3;
        z.pos.y = T.altura(z.pos.x, z.pos.z) + Math.max(0, Math.sin(Math.max(0, z.salto) * 10)) * 0.12;
        z.cabeza.rotation.x = z.salto > 0 ? 0 : 0.30 + gestoZorzal.cabezaX + Math.sin(z.fase * 2.2) * 0.12;
        z.cabeza.rotation.y = lerp(z.cabeza.rotation.y, gestoZorzal.cabezaY, 1 - Math.exp(-dt * 8));
        if (microZorzal === 'rascarHojarasca' && z.salto <= 0) z.patas.forEach((p, i2) => { p.rotation.x = Math.sin(z.microFase * 11 + i2 * Math.PI) * 0.36; });
        z.alas.forEach((a3) => { a3.rotation.z = 0; });
        }
      }
      z.g.position.copy(z.pos);
      z.g.rotation.y = z.rumbo;
      ver('zorzal', z.pos, 'zorzal', 12, 34);
    }

    // ----- lagartijas: al sol sobre las piedras, y salen disparando
    buscaRoca -= dt;
    const hayLagartija = deDia && m.lluvia < 0.3 && m.invierno < 0.4 && h > 10 && h < 19;
    if (buscaRoca <= 0) {
      buscaRoca = 2.5;
      // 2.6.1: sólo las matas a menos de 22 m (índice espacial), no todo el valle por lagartija
      const candidatasRoca = hayLagartija && veg.matasCerca ? veg.matasCerca(js.pos.x, js.pos.z, 22, rocasCerca) : veg.matas;
      for (const l of lagartijas) {
        if (!hayLagartija) { l.roca = null; continue; }
        if (l.roca && Math.hypot(l.roca.x - js.pos.x, l.roca.z - js.pos.z) < 26) continue;
        let mejor = null, dm = 22;
        for (const p2 of candidatasRoca) {
          if (p2.tipo !== 'roca' || p2.sacado) continue;
          const d2 = Math.hypot(p2.x - js.pos.x, p2.z - js.pos.z);
          if (d2 < dm && !lagartijas.some((o) => o !== l && o.roca === p2)) { dm = d2; mejor = p2; }
        }
        l.roca = mejor;
        if (mejor) {
          const a2 = r() * 6.28;
          l.pos.set(mejor.x + Math.cos(a2) * 0.3, T.altura(mejor.x, mejor.z) + 0.35, mejor.z + Math.sin(a2) * 0.3);
          l.rumbo = a2;
          l.huyendo = 0;
        }
      }
    }
    for (const l of lagartijas) {
      l.g.visible = (!!l.roca && hayLagartija && l.huyendo < 0.9) && sale(l);
      if (!l.g.visible) { if (l.huyendo > 0) l.huyendo -= dt; continue; }
      const d = Math.hypot(l.pos.x - js.pos.x, l.pos.z - js.pos.z);
      if (d < (js.agachado ? 1.6 : 3.2)) {
        // se escurre entre las piedras
        l.huyendo = 1.6;
        l.pos.x += Math.sin(l.rumbo) * 0.6;
        l.pos.z += Math.cos(l.rumbo) * 0.6;
      } else {
        l.t -= dt;
        if (l.t <= 0) { l.t = 2 + r() * 4; l.rumbo += (r() - 0.5) * 1.6; }
        l.cabeza.rotation.y = Math.sin(U() * 1.4) * 0.5;
      }
      l.g.position.copy(l.pos);
      l.g.rotation.y = l.rumbo;
      ver('lagartija', l.pos, 'lagartija', 4, 12);
    }

    // ----- murciélagos
    const hayMurcielagos = h > 20.2 && h < 22.4 && m.lluvia < 0.4 && m.invierno < 0.5;
    for (const b of murcielagos) {
      b.g.visible = (hayMurcielagos) && sale(b);
      if (!hayMurcielagos) continue;
      if (b.centro.lengthSq() === 0 || Math.hypot(b.centro.x - js.pos.x, b.centro.z - js.pos.z) > 45) {
        b.centro.set(js.pos.x + (r() - 0.5) * 40, 0, js.pos.z + (r() - 0.5) * 40);
        b.centro.y = T.altura(b.centro.x, b.centro.z);
      }
      b.ang += dt * b.vel * (0.5 + 0.5 * Math.sin(U() * 0.7 + b.fase));
      const rad = b.radio * (0.7 + 0.3 * Math.sin(U() * 0.5 + b.fase));
      b.g.position.set(b.centro.x + Math.cos(b.ang) * rad, b.centro.y + b.alto + Math.sin(U() * 2.3 + b.fase) * 1.6, b.centro.z + Math.sin(b.ang) * rad);
      b.g.rotation.set(0, -b.ang, Math.sin(U() * 3 + b.fase) * 0.4, 'YXZ');
      const aleteo = Math.sin(U() * 22 + b.fase) * 1.1;
      b.alas[0].rotation.z = aleteo; b.alas[1].rotation.z = -aleteo;
      b.chilla -= dt;
      if (b.chilla <= 0) {
        if (Math.hypot(b.g.position.x - js.pos.x, b.g.position.z - js.pos.z) < 25 && r() < 0.5) sonido.chillido(b.g.position);
        b.chilla = 1.5 + r() * 3;
      }
      ver('murcielago', b.g.position, 'murcielago', 22, 60);
    }

    return { panal: panalSonido };
  }

  let reloj = 0;
  const U = () => reloj;
  const rocasCerca = [];
  return {
    actualizar: (dt, jugador, camara, m) => { reloj += dt; return actualizar(dt, jugador, camara, m); },
    sujetos: () => sujetos,
    rastros: () => rastros,
    _debug: { ciervos, jabalies, liebres, coipos, cauquenes, abejorros, mariposas, murcielagos, zorzales, lagartijas, guanacos, panal },
  };
}
