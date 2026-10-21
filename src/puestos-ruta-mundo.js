// 4.6: los puestos de ruta, lo que se ve (las reglas están en puestos-ruta.js). Cada puesto es UNA malla fusionada con el material de las
// estructuras (tipo 0 o 4, sin luces nuevas): la casilla sobre su pirca de piedra, el fogón, el alero del depósito y lo de adentro. Cuando
// cambia la etapa (o lo guardado en el depósito) se rehace la geometría de esa malla: no se compila nada a mitad de juego.
//   · etapa 0, abandonado: faltan tablas (algunas tiradas al pie de la pared), la puerta caída, el techo hundido (un tramo de chapa en el
//     suelo, otro vencido en V, una viga partida adentro), el fogón desarmado y apagado, el alero del depósito tirado;
//   · etapa 1, paredes y puerta: las tablas nuevas (más claras) tapan los huecos y la puerta está colgada;
//   · etapa 2, techo y salamandra: chapa nueva, la salamandra adentro y su caño;
//   · etapa 3, reparado: el fogón armado con su tronco para sentarse, el banco del frente, la ventanilla del mostrador abierta, el catre y
//     el alero del depósito en pie, con lo que guardaste encima.
// El del Riel Sur (D) es además un apeadero de la trochita: el andén y su cartel los arma trochita.js (ver `apeaderoDelRielSur`).
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { PUESTOS_RUTA, IDS_PUESTOS, CASILLA, LOCAL_PUESTO, aMundo, puntoDe, etapaDe, depositoDe, DEPOSITO, reparado } from './puestos-ruta.js';
import { pasoDe } from './almacen.js';
import { cubierta } from './techo-lluvia.js';

const MADERA_OSCURA = '#4e3a28', TABLA_VIEJA = ['#927c5e', '#857057'], TABLA_NUEVA = '#b88c56', PIEDRA = '#837c70';
const CHAPA_NUEVA = '#9ea5a4', CHAPA_VIEJA = '#8a5a3c';
const W = CASILLA.ancho, D = CASILLA.fondo, HF = CASILLA.altoFrente, HB = CASILLA.altoFondo, PUERTA = CASILLA.puerta, GAL = CASILLA.galeria;
const VENTANA = [-1.85, -0.85];   // la ventanilla del mostrador, a lo ancho del frente
const R_FOGON = LOCAL_PUESTO.fogon, R_TRONCO = LOCAL_PUESTO.tronco;   // (el fogón y su tronco: los mismos puntos que las reglas)
const altoPared = (z) => HB + (HF - HB) * ((z + D / 2) / D);   // de la pared del fondo (baja) a la del frente (alta)
// azar con semilla (el mismo puesto se rompe siempre igual)
const azar = (semilla) => { let s = semilla >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

// El apeadero del Riel Sur para crearTrochita (opciones.apeaderos): junto a la vía, frente al puesto, con su mostrador para comerciar.
// `progreso()`: la partida (el puesto comercia sólo reparado).
export function apeaderoDelRielSur(T, progreso) {
  const P = PUESTOS_RUTA.D, junto = aMundo('D', 0, 9.4), m = puntoDe('D', 'mostrador');
  return { x: junto.x, z: junto.z, nombre: P.nombre, cargas: { x: m.x, z: m.z, y: pisoDe(T, 'D').y0 }, atiende: () => reparado(progreso(), 'D') };
}
// El piso de la casilla y de su galería: un poco sobre lo más alto del terreno debajo (la pirca de piedra tapa la diferencia hasta lo más
// bajo). { y0 (el piso), gmin, gmax }
export function pisoDe(T, id) {
  let gmin = Infinity, gmax = -Infinity;
  for (let lx = -W / 2 - 0.3; lx <= W / 2 + 0.31; lx += 0.5) for (let lz = -D / 2 - 0.3; lz <= D / 2 + GAL + 0.16; lz += 0.5) {
    const q = aMundo(id, lx, lz), h = T.altura(q.x, q.z);
    gmin = Math.min(gmin, h); gmax = Math.max(gmax, h);
  }
  return { y0: gmax + 0.18, gmin, gmax };
}

// `ctx`: { T, escena, grupo (el de las estructuras, para el LOD por distancia), mat, col, cartel(texto, x, z, rot), sentaderos (los de las
//          estructuras), cubiertas (las de las estructuras: bajo el techo arreglado no llueve), progreso() }
export function crearPuestosRutaMundo(ctx) {
  const { T, col } = ctx;
  const P = () => ctx.progreso();
  const puestos = {};
  const info = { rehechos: 0, triangulos: 0 };

  for (const id of IDS_PUESTOS) {
    const def = PUESTOS_RUTA[id];
    const { y0, gmin, gmax } = pisoDe(T, id);
    const malla = new THREE.Mesh(new THREE.BufferGeometry(), ctx.mat);
    malla.name = `puesto-ruta:${id}`;
    malla.position.set(def.pos.x, y0, def.pos.z); malla.rotation.y = def.rot;
    malla.castShadow = true; malla.receiveShadow = true;
    malla.updateMatrix(); malla.matrixAutoUpdate = false;
    (ctx.grupo || ctx.escena).add(malla);
    const p = puestos[id] = { id, def, y0, gmin, gmax, malla, firma: '', sentados: false, techo: false };
    // lo que choca siempre: las cuatro paredes (con el hueco de la puerta) desde el pie de la pirca, el piso y los escalones
    const w = (lx, lz) => aMundo(id, lx, lz);
    const pared = (a, b, alto) => { const A = w(...a), B = w(...b); col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.12, alturaMin: gmin - 0.35, alturaMax: y0 + alto + 0.2, duenio: `puesto-ruta-${id}` }); };
    pared([-W / 2, D / 2], [-PUERTA / 2 - 0.12, D / 2], HF);
    pared([PUERTA / 2 + 0.12, D / 2], [W / 2, D / 2], HF);
    pared([-W / 2, -D / 2], [W / 2, -D / 2], HB);
    pared([-W / 2, -D / 2], [-W / 2, D / 2], HF);
    pared([W / 2, -D / 2], [W / 2, D / 2], HF);
    // (el piso de adentro y el de la galería del frente, en una sola plataforma)
    { const q = w(0, GAL / 2); col.agregarPlataforma({ x: q.x, z: q.z, ang: -def.rot, largo: W, ancho: D + GAL, alto: y0, espesor: y0 - gmin + 0.35, duenio: `puesto-ruta-${id}`, suelo: 'madera' }); }
    p.escalones = [];
    { let tope = 0;
      // (escalones de 28 cm de alto y 38 de pisada: en la ladera del Paso la galería queda a metro y medio del suelo, que además baja)
      for (let k = 0; k < 10; k++) {
        const lz = D / 2 + GAL + 0.2 + k * 0.38, q = w(0, lz), suelo = T.altura(q.x, q.z) - y0;
        if (k === 0 && suelo > -0.25) break;
        tope = Math.max(suelo + 0.06, tope - 0.28);
        const alto = tope - suelo + 0.2;
        p.escalones.push({ lz, tope, alto });
        col.agregarPlataforma({ x: q.x, z: q.z, ang: -def.rot, largo: 1.3, ancho: 0.4, alto: y0 + tope, espesor: alto, suelo: 'piedra', duenio: `puesto-ruta-${id}` });
        if (tope - suelo < 0.3) break;
      } }
    // el cartel con el nombre (el del Riel Sur lo pone trochita.js, en el andén)
    if (!def.parada && ctx.cartel) { const c = puntoDe(id, 'cartel'); ctx.cartel(def.nombre, c.x, c.z, def.rot); }
    armar(id);
  }

  // ------------------------------------------------ la geometría de un puesto, según su etapa
  function armar(id) {
    const p = puestos[id], def = p.def, e = etapaDe(P(), id), a = depositoDe(P(), id);
    const firma = `${e}|${e >= 3 ? ['tronco', 'tabla', 'piedra', 'lana'].map((k) => pasoDe(DEPOSITO, a, k)).join('') : ''}`;
    if (firma === p.firma) return false;
    p.firma = firma;
    const c = new Constructor();
    const r = azar(id.charCodeAt(0) * 7919 + 17);
    const suelo = (lx, lz) => { const q = aMundo(id, lx, lz); return T.altura(q.x, q.z) - p.y0; };   // el terreno, en la altura local
    const caja = (dims, pos, color, rot = [0, 0, 0], variar = 0.1) => c.agregar(new THREE.BoxGeometry(...dims), { color, tipo: 4, variar, matriz: matriz(pos, rot) });
    const palo = (radio, largo, pos, rot, color = MADERA_OSCURA) => c.agregar(new THREE.CylinderGeometry(radio, radio * 1.1, largo, 6), { color, tipo: 0, matriz: matriz(pos, rot) });
    // un palo entre dos puntos (para las vigas partidas y los postes caídos)
    const entre = (A, B, radio, color = MADERA_OSCURA) => {
      const v = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), largo = v.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
      const m = new THREE.Matrix4().compose(new THREE.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), q, new THREE.Vector3(1, 1, 1));
      c.agregar(new THREE.CylinderGeometry(radio, radio, largo, 6), { color, tipo: 0, matriz: m });
    };
    // una tabla o chapa entre dos puntos, con ancho y espesor (el ancho va por x local)
    const lamina = (A, B, ancho, espesor, color, variar = 0.1) => {
      const dz = B[2] - A[2], dy = B[1] - A[1], largo = Math.hypot(dz, dy);
      caja([ancho, espesor, largo], [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], color, [-Math.atan2(dy, dz), 0, 0], variar);
    };

    // la pirca y el piso
    // (la pirca va bajo la casilla y la galería del frente; la galería, de tablones: abandonado, le faltan unos cuantos)
    const bajo = p.gmin - p.y0 - 0.3, z0 = -D / 2 - 0.15, z1 = D / 2 + GAL + 0.05;
    caja([W + 0.3, -0.05 - bajo, z1 - z0], [0, (bajo - 0.05) / 2, (z0 + z1) / 2], PIEDRA, [0, 0, 0], 0.16);
    caja([W, 0.06, D], [0, -0.02, 0], '#7a6650', [0, 0, 0], 0.08);
    for (let x = -W / 2 + 0.15, k = 0; x < W / 2 - 0.1; x += 0.3, k++) {
      if (e === 0 && (k % 4 === 1 || k === 10)) continue;
      caja([0.28, 0.06, GAL], [x, -0.02, D / 2 + GAL / 2], e === 0 || k % 3 ? TABLA_VIEJA[k % 2] : TABLA_NUEVA, [0, 0, 0], 0.1);
    }
    caja([W + 0.1, 0.1, 0.12], [0, -0.08, D / 2 + GAL - 0.04], MADERA_OSCURA, [0, 0, 0], 0.05);
    p.escalones.forEach((s, k) => caja([1.3, s.alto, 0.4], [0, s.tope - s.alto / 2, s.lz], k % 2 ? '#7f7a70' : '#77726a', [0, 0, 0], 0.1));
    // los esquineros y las soleras de arriba
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const h = sz > 0 ? HF : HB; palo(0.07, h, [sx * (W / 2 - 0.04), h / 2, sz * (D / 2 - 0.04)], [0, 0, 0]); }
    caja([W, 0.1, 0.1], [0, HF - 0.05, D / 2 - 0.04], MADERA_OSCURA, [0, 0, 0], 0.05);
    caja([W, 0.1, 0.1], [0, HB - 0.05, -D / 2 + 0.04], MADERA_OSCURA, [0, 0, 0], 0.05);
    for (const sx of [-1, 1]) lamina([sx * (W / 2 - 0.04), HB - 0.05, -D / 2], [sx * (W / 2 - 0.04), HF - 0.05, D / 2], 0.1, 0.1, MADERA_OSCURA, 0.05);
    // el marco de la puerta y de la ventanilla
    for (const sx of [-1, 1]) palo(0.05, 2.0, [sx * (PUERTA / 2 + 0.04), 1.0, D / 2 + 0.01], [0, 0, 0]);
    caja([PUERTA + 0.2, 0.08, 0.08], [0, 2.02, D / 2 + 0.01], MADERA_OSCURA, [0, 0, 0], 0.05);
    caja([VENTANA[1] - VENTANA[0] + 0.12, 0.07, 0.08], [(VENTANA[0] + VENTANA[1]) / 2, 0.95, D / 2 + 0.01], MADERA_OSCURA, [0, 0, 0], 0.05);
    caja([VENTANA[1] - VENTANA[0] + 0.12, 0.07, 0.08], [(VENTANA[0] + VENTANA[1]) / 2, 1.75, D / 2 + 0.01], MADERA_OSCURA, [0, 0, 0], 0.05);

    // ---- las paredes: tablas paradas de 30 cm. Abandonado, falta una de cada tres o cuatro (y algunas quedaron tiradas al pie)
    const tablas = [];
    for (let x = -W / 2 + 0.15; x < W / 2 - 0.1; x += 0.3) {
      if (Math.abs(x) < PUERTA / 2 + 0.05) continue;
      const enVentana = x > VENTANA[0] && x < VENTANA[1];
      tablas.push({ lado: 'frente', x, z: D / 2, y0: 0, y1: enVentana ? 0.95 : HF });
      if (enVentana) tablas.push({ lado: 'frente', x, z: D / 2, y0: 1.75, y1: HF, chica: true });
      tablas.push({ lado: 'fondo', x, z: -D / 2, y0: 0, y1: HB });
    }
    for (let z = -D / 2 + 0.15; z < D / 2 - 0.1; z += 0.3) for (const sx of [-1, 1]) tablas.push({ lado: sx < 0 ? 'izq' : 'der', x: sx * W / 2, z, y0: 0, y1: altoPared(z) });
    const caidas = [];
    tablas.forEach((t, i) => {
      const falta = !t.chica && (r() < 0.27 || (t.lado === 'izq' && i % 5 === 0));
      if (falta && e === 0) { caidas.push(t); return; }
      const nueva = falta;   // las que faltaban, ya repuestas: madera nueva, más clara
      const color = nueva ? TABLA_NUEVA : TABLA_VIEJA[i % 2];
      const alto = t.y1 - t.y0;
      if (t.lado === 'frente' || t.lado === 'fondo') caja([0.29, alto, 0.04], [t.x, t.y0 + alto / 2, t.z + (t.lado === 'frente' ? 0.02 : -0.02)], color, [0, 0, 0], 0.1);
      else caja([0.04, alto, 0.29], [t.x + (t.lado === 'der' ? 0.02 : -0.02), alto / 2, t.z], color, [0, 0, 0], 0.1);
    });
    // las caídas: tiradas en el suelo, afuera, al pie de su pared (acostadas sobre el terreno, cada una a su altura)
    if (e === 0) caidas.slice(0, 9).forEach((t, k) => {
      // (cada una entera afuera de la pirca, que ocupa x ±2,45 y z de −1,85 a la punta de la galería: cayó hacia afuera, acostada a lo
      // largo; las del frente, a los costados de la escalera)
      const largo = Math.min(1.9, t.y1 - t.y0), mas = r() * 0.4, giro0 = (r() - 0.5) * 0.5;
      let lx = t.x, lz = t.z;
      if (t.lado === 'izq' && Math.abs(lz) < 1.6) return;   // (al costado izquierdo está el alero del depósito, también caído)
      if (t.lado === 'frente') { lz = D / 2 + GAL + 0.25 + largo / 2 + mas; lx = (t.x < 0 ? -1 : 1) * (1.3 + r() * 0.5); }
      else if (t.lado === 'fondo') lz = -D / 2 - 0.4 - largo / 2 - mas;
      else lx = (t.lado === 'der' ? 1 : -1) * (W / 2 + 0.4 + largo / 2 + mas);
      const giro = giro0 + (t.lado === 'izq' || t.lado === 'der' ? Math.PI / 2 : 0);
      const ca = Math.cos(giro), sa = Math.sin(giro);
      const A = [lx - sa * largo / 2, 0, lz - ca * largo / 2], B = [lx + sa * largo / 2, 0, lz + ca * largo / 2];
      const ya = suelo(A[0], A[2]) + 0.025, yb = suelo(B[0], B[2]) + 0.025;
      caja([0.29, 0.04, largo], [lx, (ya + yb) / 2 + (k % 3) * 0.045, lz], TABLA_VIEJA[k % 2], [-Math.atan2(yb - ya, largo), giro, 0], 0.12);
    });

    // ---- la puerta: abandonado, tirada en el suelo delante; después, colgada y abierta hacia adentro, contra la pared
    if (e === 0) {
      // (tirada sobre la galería, cruzada)
      caja([0.88, 0.05, 1.9], [0.75, 0.035, D / 2 + GAL / 2], '#6e5a44', [0, Math.PI / 2 - 0.12, 0], 0.1);
    } else caja([0.88, 1.92, 0.05], [PUERTA / 2 + 0.44, 0.98, D / 2 - 0.1], TABLA_NUEVA, [0, 0, 0], 0.08);

    // ---- el techo: una chapa a un agua del frente (alto) al fondo (bajo), con alero adelante
    const yF = HF + 0.08, yB = HB + 0.08, zF = D / 2 + 0.55, zB = -D / 2 - 0.35;
    const yEn = (z) => yB + (yF - yB) * ((z - zB) / (zF - zB));
    const ancho = W + 0.7, tramo = ancho / 3;
    if (e >= 2) {
      const pend = Math.atan2(yF - yB, zF - zB);
      for (const sx of [-1, 0, 1]) palo(0.05, D + 0.3, [sx * (W / 2 - 0.5), yEn(0) - 0.08, 0], [Math.PI / 2 - pend, 0, 0]);
      for (let k = 0; k < 3; k++) lamina([-ancho / 2 + tramo * (k + 0.5), yB, zB], [-ancho / 2 + tramo * (k + 0.5), yF, zF], tramo + 0.02, 0.04, k === 1 ? '#858d8f' : CHAPA_NUEVA, 0.05);
      // la salamandra adentro (al fondo a la izquierda) y su caño por el techo
      c.agregar(new THREE.CylinderGeometry(0.22, 0.24, 0.62, 8), { color: '#2f2c29', tipo: 4, variar: 0.05, matriz: matriz([-1.55, 0.31, -1.05]) });
      const zc = -1.05, tope = yEn(zc) + 0.7;
      c.agregar(new THREE.CylinderGeometry(0.06, 0.06, tope - 0.62, 6), { color: '#3a3633', tipo: 4, variar: 0.05, matriz: matriz([-1.55, 0.62 + (tope - 0.62) / 2, zc]) });
      c.agregar(new THREE.ConeGeometry(0.14, 0.14, 6), { color: '#3a3633', tipo: 4, variar: 0.05, matriz: matriz([-1.55, tope + 0.08, zc]) });
    } else {
      // abandonado: un tramo entero (el de la izquierda) aguanta, el del medio está en el suelo y el de la derecha se venció en V;
      // una viga partida quedó cruzada adentro
      lamina([-ancho / 2 + tramo / 2, yB, zB], [-ancho / 2 + tramo / 2, yF, zF], tramo + 0.02, 0.04, CHAPA_VIEJA, 0.18);
      // (el tramo vencido va de pared a pared, apoyado en las soleras: no atraviesa las tablas de los costados ni del frente)
      const xd = 1.55, ym = (HF + HB) / 2 - 0.45, sF = (HF + 0.04 - ym) / (D / 2), sB = (HB + 0.04 - ym) / (D / 2);
      lamina([xd, ym + sB * -zB, zB], [xd, ym, 0], 1.3, 0.04, CHAPA_VIEJA, 0.18);
      lamina([xd, ym, 0], [xd, ym + sF * zF, zF], 1.3, 0.04, '#7d5236', 0.18);
      palo(0.05, D + 0.3, [-(W / 2 - 0.5), yEn(0) - 0.08, 0], [Math.PI / 2 - Math.atan2(yF - yB, zF - zB), 0, 0]);
      entre([0.15, HF - 0.1, D / 2 - 0.15], [0.95, 0.06, -0.55], 0.05);
      // el tramo caído: apoyado en el suelo al costado derecho, de plano
      const lx = W / 2 + 1.1, lz = -0.3, ya = suelo(lx, lz - 1.1), yb = suelo(lx, lz + 1.1);
      caja([tramo, 0.04, D + 0.4], [lx, (ya + yb) / 2 + 0.06, lz], CHAPA_VIEJA, [-Math.atan2(yb - ya, 2.2), 0.3, 0.06], 0.2);
    }

    // ---- el fogón: abandonado, piedras desparramadas y ceniza vieja; reparado, la ronda de piedras con leña y un tronco para sentarse
    { const [fx, fz] = R_FOGON, fy = suelo(fx, fz);
      c.agregar(new THREE.CylinderGeometry(0.46, 0.5, 0.1, 9), { color: '#3a3632', tipo: 4, variar: 0.15, matriz: matriz([fx, fy - 0.02, fz]) });
      const n = e >= 3 ? 8 : 5;
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2 + (e >= 3 ? 0 : r() * 0.8), rad = e >= 3 ? 0.58 : 0.5 + r() * 0.5;
        const sx = fx + Math.cos(ang) * rad, sz = fz + Math.sin(ang) * rad;
        caja([0.24, 0.17, 0.2], [sx, suelo(sx, sz) + 0.06, sz], k % 2 ? '#6d6862' : '#5e5a55', [r() * 0.3, ang + r() * 0.6, r() * 0.3], 0.15);
      }
      if (e >= 3) {
        for (let k = 0; k < 3; k++) { const ang = k * 2.1 + 0.3; palo(0.06, 0.7, [fx + Math.cos(ang) * 0.12, fy + 0.11, fz + Math.sin(ang) * 0.12], [Math.PI / 2 - 0.25, 0, ang], '#5b4330'); }
        const [tx, tz] = R_TRONCO, ty = suelo(tx, tz);
        c.agregar(new THREE.CylinderGeometry(0.22, 0.24, 0.48, 8), { color: '#6b5138', tipo: 0, matriz: matriz([tx, ty + 0.2, tz]) });
      } }

    // ---- el alero del depósito (a la izquierda): abandonado, los postes y la chapa en el suelo; reparado, en pie y con lo guardado
    { const x0 = -W / 2, x1 = -W / 2 - 1.9, zs = [-1.2, 1.2];
      if (e >= 3) {
        // (en una ladera el suelo del alero queda abajo de la casilla: los postes no pasan de 2 m sobre el suelo y la chapa baja más)
        const sPost = Math.min(...zs.map((z) => suelo(x1 + 0.08, z))), yBajo = Math.min(1.58, sPost + 2.0), yAlto = 1.8;
        for (const z of zs) { const s = suelo(x1 + 0.08, z), largo = yBajo - 0.02 - (s - 0.1); palo(0.07, largo, [x1 + 0.08, s - 0.1 + largo / 2, z], [0, 0, 0]); }
        caja([0.1, 0.1, 2.6], [x1 + 0.08, yBajo - 0.06, 0], MADERA_OSCURA, [0, 0, 0], 0.05);
        const l = Math.hypot(x0 - x1, yAlto - yBajo);
        caja([l + 0.2, 0.04, 2.9], [(x0 + x1) / 2, (yAlto + yBajo) / 2 + 0.03, 0], CHAPA_NUEVA, [0, 0, Math.atan2(yAlto - yBajo, x0 - x1)], 0.05);
        // la tarima y las pilas (cuánto hay de cada cosa, en cuatro pasos: almacen.js)
        // (la tarima, sobre unas piedras: de lo más bajo del suelo debajo a un poco más arriba de lo más alto)
        const cx = (x0 + x1) / 2, esq = [[-0.85, -1.15], [0.85, -1.15], [-0.85, 1.15], [0.85, 1.15], [0, 0]].map(([dx, dz]) => suelo(cx + dx, dz));
        const sMin = Math.min(...esq), base = Math.max(...esq) + 0.12;
        caja([1.7, base - sMin + 0.1, 2.3], [cx, (base + sMin - 0.1) / 2, 0], '#6f6a62', [0, 0, 0], 0.14);
        caja([1.72, 0.05, 2.32], [cx, base - 0.02, 0], '#7a6650', [0, 0, 0], 0.1);
        const tr = pasoDe(DEPOSITO, a, 'tronco'), ta = pasoDe(DEPOSITO, a, 'tabla'), pi = pasoDe(DEPOSITO, a, 'piedra'), la = pasoDe(DEPOSITO, a, 'lana');
        for (let k = 0; k < tr * 2; k++) palo(0.11, 1.4, [cx + 0.35, base + 0.11 + Math.floor(k / 2) * 0.2, -0.75 + (k % 2) * 0.24], [0, 0, Math.PI / 2], '#6b5138');
        for (let k = 0; k < ta * 2; k++) caja([1.3, 0.05, 0.28], [cx - 0.2, base + 0.03 + k * 0.06, -0.15], TABLA_NUEVA, [0, 0, 0], 0.08);
        for (let k = 0; k < pi * 3; k++) caja([0.26, 0.2, 0.24], [cx - 0.35 + (k % 3) * 0.3, base + 0.1 + Math.floor(k / 3) * 0.2, 0.45], '#77726a', [0, k * 0.7, 0], 0.15);
        for (let k = 0; k < la * 2; k++) caja([0.42, 0.3, 0.36], [cx + 0.2 + (k % 2) * 0.1, base + 0.15 + Math.floor(k / 2) * 0.28, 0.85 + (k % 2) * 0.08], '#ddd6c6', [0, k * 0.5, 0], 0.08);
      } else {
        // los postes y la chapa, tirados
        for (const z of zs) { const A = [x1 + 0.1, suelo(x1 + 0.1, z) + 0.07, z], bx = x1 + 0.3, bz = z * 0.2 + 0.5 + (z < 0 ? -1.2 : 1.2); entre(A, [bx, suelo(bx, bz) + 0.07, bz], 0.07); }
        const lx = (x0 + x1) / 2 - 0.1, ya = suelo(lx, -1.2), yb = suelo(lx, 1.2);
        caja([1.7, 0.04, 2.6], [lx, (ya + yb) / 2 + 0.05, 0], CHAPA_VIEJA, [-Math.atan2(yb - ya, 2.4), 0.15, Math.atan2(suelo(lx - 0.8, 0) - suelo(lx + 0.8, 0), 1.6)], 0.2);
      } }

    // ---- reparado: el banco del frente, la ventanilla abierta con su mostrador y el catre de adentro
    if (e >= 3) {
      const [bx, bz] = [1.35, D / 2 + 0.42], by = 0;   // (sobre la galería)
      caja([1.2, 0.06, 0.34], [bx, by + 0.46, bz], TABLA_NUEVA, [0, 0, 0], 0.06);
      for (const dx of [-0.5, 0.5]) caja([0.08, 0.46, 0.3], [bx + dx, by + 0.23, bz], MADERA_OSCURA, [0, 0, 0], 0.05);
      const xv = (VENTANA[0] + VENTANA[1]) / 2;
      caja([1.12, 0.05, 0.4], [xv, 0.98, D / 2 + 0.2], TABLA_NUEVA, [0, 0, 0], 0.06);   // el mostrador
      caja([1.1, 0.04, 0.62], [xv, 1.98, D / 2 + 0.26], TABLA_NUEVA, [-0.55, 0, 0], 0.06);   // el postigo, levantado de alero
      caja([0.8, 0.32, 1.7], [1.4, 0.16, -0.85], MADERA_OSCURA, [0, Math.PI / 2, 0], 0.05);
      caja([0.74, 0.1, 1.64], [1.4, 0.37, -0.85], '#b9a888', [0, Math.PI / 2, 0], 0.08);
      caja([0.76, 0.05, 0.9], [1.0, 0.44, -0.85], '#8a3b2e', [0, Math.PI / 2, 0], 0.08);
    }
    const g = c.geometria();
    p.malla.geometry.dispose();
    p.malla.geometry = g;
    info.rehechos++;
    info.triangulos = Object.values(puestos).reduce((s, q) => s + (q.malla.geometry.attributes.position?.count || 0) / 3, 0);
    // los asientos (el banco y el tronco del fogón) y la cubierta del techo, una vez, al llegar a su etapa
    if (e >= 3 && !p.sentados && ctx.sentaderos) {
      p.sentados = true;
      const b = aMundo(id, 1.35, D / 2 + 0.42), t = aMundo(id, R_TRONCO[0], R_TRONCO[1]);
      const f = aMundo(id, R_FOGON[0], R_FOGON[1]);
      // (`mira`: el que se sienta mira hacia (−sen, −cos) de su ángulo: el banco, hacia afuera; el tronco, al fuego)
      ctx.sentaderos.push({ x: b.x, z: b.z, y: p.y0 + 0.49, nombre: `el banco del ${def.nombre.toLowerCase()}`, mira: def.rot + Math.PI, puestoRuta: id });
      ctx.sentaderos.push({ x: t.x, z: t.z, y: T.altura(t.x, t.z) + 0.44, nombre: 'el tronco junto al fogón', mira: Math.atan2(-(f.x - t.x), -(f.z - t.z)), puestoRuta: id });
    }
    if (e >= 2 && !p.techo && ctx.cubiertas) {
      p.techo = true;
      const az = (yF - yB) / (zF - zB);
      ctx.cubiertas.push(cubierta({ x: def.pos.x, z: def.pos.z }, def.rot, -ancho / 2, ancho / 2, zB, zF, p.y0 + yB - az * zB, { az }));
    }
    return true;
  }

  return {
    puestos,
    // lo que no tiene que tener árboles, pasto ni objetos sueltos encima (la casilla, el depósito, el fogón y el cartel)
    zonas: IDS_PUESTOS.map((id) => ({ x: PUESTOS_RUTA[id].pos.x, z: PUESTOS_RUTA[id].pos.z, r: 7.5, nombre: PUESTOS_RUTA[id].nombre })),
    // se rehace la malla del puesto si cambió su etapa o lo guardado (devuelve si cambió)
    refrescar: (id) => (puestos[id] ? armar(id) : false),
    refrescarTodos: () => IDS_PUESTOS.map((id) => armar(id)).some(Boolean),
    piso: (id) => puestos[id]?.y0 ?? null,
    info: () => ({ ...info }),
  };
}
