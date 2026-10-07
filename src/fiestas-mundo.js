// 3.7.5 (fiestas): lo que se ve y se oye de las fiestas (las reglas están en fiestas.js; lo que pasa, en
// fiestas-juego.js). Sólo en el Relax.
//
//   · el predio de la fiesta, del otro lado de la calle de la vía (queda siempre): el ruedo de la jineteada con su
//     palenque y su tranquera, la tarima del músico, la pista de tablas, la mesa larga con sus dos bancos, el fogón
//     con troncos para sentarse, la mesita de los juegos y la cancha de la taba. Los bancos, los troncos y las sillas
//     son asientos (el jugador se sienta con E y los vecinos se sientan a la altura justa); la pista y la tarima se
//     pisan; los postes y la mesa frenan. Con la minga aparecen la leñera y los bancos del fogón;
//   · en un día de fiesta: guirnaldas de banderines, el mantel y la comida de esa fiesta en la mesa larga (cordero,
//     locro, la torta), el asador con la cruz, el fuego (con su luz, del presupuesto fijo de luces.js) y la música en
//     la tarima, tocada por código como el resto del juego (acordeón para el chamamé, guitarra y bombo legüero para el
//     loncomeo, violín y bombo para la chacarera, quena y guitarra para el folklore del sur); el músico, con su
//     instrumento en la mano;
//   · los invitados de otras paradas: bajan del tren de fiesta, van al predio y se vuelven en el último tren;
//   · la jineteada: el redomón que corcovea en el ruedo con el domador arriba (o vos: la cámara va en la montura);
//   · la nevada solidaria: la nieve amontonada en las puertas de los que viven solos (se va al palearla);
//   · los recuerdos de cada fiesta, colgados en la pared del refugio.
// Fluidez: lo sólido va con el material de las estructuras (sin programas nuevos); el fuego, con un material igual al
// de la cocina (el mismo programa); el predio es un solo dibujo, los adornos otro, el fuego uno; el caballo y las
// figuras, sólo cerca. Nada se arma por cuadro.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { piezas } from './piezas.js';
import { marcoAldea, PARADA_ALDEA, edificioEnMundo, puntosFijosDe } from './aldea.js';
import { recorridoAldea } from './aldea-gente.js';
import { registrarLuz, olvidarLuz } from './luces.js';
import { mallaCaballo } from './caballo-mundo.js';
import { PREDIO, puntosPredio, eventosMusica, RECUERDOS, NEVADA, mingaHecha, MUSICAS } from './fiestas.js';

const PI = Math.PI;
const DUENIO = 'fiestas-mundo';
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const VER_PREDIO = 320;   // a cuántos metros se arma y se ve el predio
const VER_FIGURAS = 150;  // las figuras y el caballo
const OIR = 34;           // la música

// ---------------------------------------------------------------- piezas chicas (con el material de las estructuras)
function cj(c, pos, tam, color, rot = [0, 0, 0], tipo = 0) { c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, matriz: matriz(pos, rot), variar: 0.08 }); }
function cil(c, pos, r0, r1, alto, color, tipo = 4, lados = 8, rot = [0, 0, 0]) { c.agregar(new THREE.CylinderGeometry(r0, r1, alto, lados), { color, tipo, matriz: matriz(pos, rot), variar: 0.06 }); }
function bola(c, pos, r, color, esc = [1, 1, 1], tipo = 4) { c.agregar(new THREE.SphereGeometry(r, 9, 7), { color, tipo, matriz: matriz(pos, [0, 0, 0], esc), variar: 0.05 }); }
function aro(c, pos, r, tubo, color, rot = [PI / 2, 0, 0]) { c.agregar(new THREE.TorusGeometry(r, tubo, 6, 16), { color, tipo: 4, matriz: matriz(pos, rot), variar: 0.02 }); }
// un palo de `a` a `b` (puntos [x, y, z])
function palo(c, a, b, r, color, lados = 6, tipo = 4) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  if (L < 1e-4) return;
  const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)));
  m.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  c.agregar(new THREE.CylinderGeometry(r, r, L, lados), { color, tipo, matriz: m, variar: 0.05 });
}
// un banderín triangular (un prisma de tres caras, finito: la punta para abajo), colgado de `p` en una cuerda que va
// hacia `rumbo` (en lo local: (sin rumbo, cos rumbo))
function banderin(c, p, rumbo, color, tam = 0.2) {
  c.agregar(new THREE.CylinderGeometry(tam, tam, 0.012, 3), { color, tipo: 4, matriz: matriz([p[0], p[1] - tam / 2, p[2]], [PI / 2, rumbo - PI / 2, 0]), variar: 0.04 });
}
const BANDERINES = ['#c83a3a', '#e8c048', '#3a7ab8', '#f2ece0', '#4a9a5a', '#d8783a', '#8a4ab0'];

// El acordeón y la guitarra del músico (en la mano)
function geoAcordeon() {
  const c = new Constructor();
  cj(c, [0, 0, 0], [0.34, 0.26, 0.16], '#7a1a22', [0, 0, 0], 4);
  for (let i = -2; i <= 2; i++) cj(c, [i * 0.055, 0, 0], [0.018, 0.27, 0.165], '#e8e2d4', [0, 0, 0], 4);   // el fuelle
  cj(c, [-0.19, 0, 0], [0.05, 0.28, 0.17], '#1e1a18', [0, 0, 0], 4);
  cj(c, [0.19, 0, 0], [0.05, 0.28, 0.17], '#1e1a18', [0, 0, 0], 4);
  return c.geometria();
}
function geoGuitarra() {
  const c = new Constructor();
  bola(c, [0, -0.08, 0], 0.17, '#a8743a', [1, 1.2, 0.35]);
  bola(c, [0, 0.12, 0], 0.13, '#a8743a', [1, 1.1, 0.35]);
  cil(c, [0, -0.02, 0.06], 0.045, 0.045, 0.01, '#1e140c', 4, 10, [PI / 2, 0, 0]);
  cj(c, [0, 0.42, 0], [0.05, 0.42, 0.03], '#3a2a1a');
  cj(c, [0, 0.66, 0], [0.07, 0.1, 0.035], '#2a1e14');
  return c.geometria();
}

// ---------------------------------------------------------------- los recuerdos (cómo se dibuja cada uno)
function dibujarRecuerdo(c, forma, color, x, y, z) {
  const pos = (dx, dy, dz = 0) => [x + dx, y + dy, z + dz];
  switch (forma) {
    case 'cinta': cj(c, pos(0, 0), [0.1, 0.06, 0.01], color); cj(c, pos(-0.03, -0.1), [0.03, 0.16, 0.008], color, [0, 0, 0.15]); cj(c, pos(0.03, -0.1), [0.03, 0.16, 0.008], color, [0, 0, -0.15]); bola(c, pos(0, 0.01, 0.01), 0.025, '#e8d070'); break;
    case 'banderin': palo(c, pos(-0.12, 0.08), pos(0.12, 0.08), 0.008, '#5a4331'); c.agregar(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 3), { color, tipo: 4, matriz: matriz(pos(0, -0.01, 0), [PI / 2, 0, PI], [1, 1, 1.4]), variar: 0.03 }); break;
    case 'trenza': for (let i = 0; i < 5; i++) bola(c, pos(0, 0.1 - i * 0.05), 0.03, color, [1, 1.4, 1]); for (const dx of [-0.04, 0, 0.04]) bola(c, pos(dx, -0.16), 0.028, '#b83a2a'); break;
    case 'cuna': cj(c, pos(0, 0), [0.16, 0.08, 0.04], color, [0, 0, 0.1]); break;
    case 'escarapela': cil(c, pos(0, 0, 0.005), 0.07, 0.07, 0.01, '#78b0d8', 4, 14, [PI / 2, 0, 0]); cil(c, pos(0, 0, 0.012), 0.045, 0.045, 0.01, '#f2f0e8', 4, 14, [PI / 2, 0, 0]); cil(c, pos(0, 0, 0.018), 0.02, 0.02, 0.01, '#78b0d8', 4, 12, [PI / 2, 0, 0]); break;
    case 'farolito': cj(c, pos(0, -0.02), [0.09, 0.13, 0.09], '#3a3a3a'); cj(c, pos(0, -0.02, 0.0), [0.07, 0.1, 0.095], color); cil(c, pos(0, 0.07), 0.05, 0.02, 0.04, '#3a3a3a'); break;
    case 'panuelo': cj(c, pos(0, 0), [0.16, 0.16, 0.006], color, [0, 0, PI / 4]); break;
    case 'copo': for (let k = 0; k < 3; k++) cj(c, pos(0, 0), [0.2, 0.025, 0.012], color, [0, 0, (k * PI) / 3]); break;
    case 'pala': cj(c, pos(0, -0.09), [0.09, 0.08, 0.01], color); palo(c, pos(0, -0.05), pos(0, 0.14), 0.01, '#7a5a3a'); break;
    case 'tarjeta': cj(c, pos(0, 0), [0.14, 0.18, 0.006], color); cj(c, pos(0, 0.03, 0.004), [0.08, 0.06, 0.002], '#c84a4a'); break;
    case 'cuadro': cj(c, pos(0, 0), [0.22, 0.17, 0.02], color); cj(c, pos(0, 0, 0.011), [0.18, 0.13, 0.004], '#c8b090'); for (let i = 0; i < 4; i++) bola(c, pos(-0.06 + i * 0.04, -0.02, 0.014), 0.014, '#5a3a2a'); break;
    default: cj(c, pos(0, 0), [0.1, 0.1, 0.02], color);
  }
}

export function crearFiestasMundo(ctx) {
  const M = marcoAldea(PARADA_ALDEA);
  const T = ctx.T, escena = ctx.escena, mat = ctx.mat;
  const P = puntosPredio();
  const C = PREDIO.centro;
  const wc = M.aMundo(C.x, C.z);
  const rotPredio = M.rotMundo(0);
  const alturaEn = (x, z) => T.altura(x, z);
  const aMundo = (x, z) => M.aMundo(x, z);
  const centroMundo = { x: wc.x, z: wc.z };
  const jugadorPos = () => ctx.jugador?.()?.pos || null;
  const juego = () => ctx.juego?.() || null;
  const reloj = { t: 0 };

  // ---------------------------------------------------------------- el predio (siempre)
  const predio = { malla: null, firma: '', y0: 0, asientos: [] };
  function quitarPredio() {
    if (predio.malla) { predio.malla.parent?.remove(predio.malla); predio.malla.geometry.dispose(); }
    ctx.col?.eliminarPorDuenio?.(DUENIO);
    const lista = ctx.sentaderos?.();
    if (Array.isArray(lista)) for (const s of predio.asientos) { const i = lista.indexOf(s); if (i >= 0) lista.splice(i, 1); }
    predio.malla = null; predio.firma = ''; predio.asientos = [];
  }
  function armarPredio(firma) {
    const y0 = alturaEn(wc.x, wc.z);
    predio.y0 = y0;
    const c = new Constructor();
    const colC = { agregar: (o) => ctx.col?.agregar({ ...o, duenio: DUENIO }), agregarPlataforma: (p) => ctx.col?.agregarPlataforma({ ...p, duenio: DUENIO }) };
    const PR = piezas(c, colC, { x: wc.x, z: wc.z, y: y0, rot: rotPredio }, matriz);
    // del plano a lo local del predio, y la altura del terreno (sobre y0) en ese punto del plano
    const L = (x, z) => [x - C.x, z - C.z];
    const suelo = (x, z) => { const w = aMundo(x, z); return alturaEn(w.x, w.z) - y0; };
    const MADERA = '#7a5a3e', MADERA2 = '#6a4c34', OSCURA = '#4a3626', TABLA = '#8a6b4a';
    const asientos = [];
    const asiento = (x, z, alto, nombre, rot) => { const w = aMundo(x, z); asientos.push({ x: w.x, z: w.z, y: y0 + alto + 0.02, nombre, mira: M.rotMundo(rot) + PI, fiesta: true }); };
    // --- el ruedo: postes de ciprés y tres varas, con la tranquera del lado de la pista
    const R = PREDIO.ruedo, n = R.postes;
    const postes = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2;
      const x = R.x + Math.sin(a) * R.radio, z = R.z + Math.cos(a) * R.radio;
      postes.push({ a, x, z, y: suelo(x, z) });
    }
    const enTranquera = (a) => Math.abs(((a - R.tranquera + PI * 3) % (PI * 2)) - PI) < 0.16;
    for (const p of postes) {
      const [lx, lz] = L(p.x, p.z);
      cil(c, [lx, p.y + 0.72, lz], 0.075, 0.09, 1.55, MADERA2, 4, 7);
      const w = aMundo(p.x, p.z);
      ctx.col?.agregar({ x: w.x, z: w.z, r: 0.12, duenio: DUENIO });
    }
    for (let i = 0; i < n; i++) {
      const p = postes[i], q = postes[(i + 1) % n];
      if (enTranquera((p.a + q.a + (i === n - 1 ? PI * 2 : 0)) / 2)) continue;
      const [ax, az] = L(p.x, p.z), [bx, bz] = L(q.x, q.z);
      for (const h of [0.45, 0.85, 1.25]) palo(c, [ax, p.y + h, az], [bx, q.y + h, bz], 0.035, MADERA, 5);
      const wa = aMundo(p.x, p.z), wb = aMundo(q.x, q.z);
      ctx.col?.agregar({ seg: true, ax: wa.x, az: wa.z, bx: wb.x, bz: wb.z, r: 0.06, duenio: DUENIO });
    }
    // la tranquera abierta, de costado
    {
      const a = R.tranquera + 0.2, x = R.x + Math.sin(a) * (R.radio + 0.9), z = R.z + Math.cos(a) * (R.radio + 0.9), y = suelo(x, z);
      const [lx, lz] = L(x, z);
      for (const h of [0.4, 0.8, 1.2]) cj(c, [lx, y + h, lz], [0.06, 0.07, 1.4], TABLA, [0, a + PI / 2, 0]);
    }
    // el palenque en el medio
    { const [lx, lz] = L(R.x, R.z), y = suelo(R.x, R.z); cil(c, [lx, y + 0.95, lz], 0.11, 0.14, 1.95, OSCURA, 4, 9); const w = aMundo(R.x, R.z); ctx.col?.agregar({ x: w.x, z: w.z, r: 0.18, duenio: DUENIO }); }
    // --- la tarima del músico y la pista de baile: tablas sobre pilotes, a nivel (se pisan)
    const tablado = (q, sobre, nombre) => {
      const esquinas = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => suelo(q.x + sx * q.largo / 2, q.z + sz * q.ancho / 2));
      const alto = Math.max(...esquinas) + sobre;
      const [lx, lz] = L(q.x, q.z);
      PR.pisoCaja({ lx, lz, largo: q.largo, ancho: q.ancho, alto: alto - 0.06, espesor: 0.12, color: TABLA });
      for (let i = 0; i < Math.round(q.largo / 0.2); i++) cj(c, [lx - q.largo / 2 + 0.1 + i * 0.2, alto + 0.005, lz], [0.012, 0.01, q.ancho], '#5e4630', [0, 0, 0], 4);   // las juntas
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1]]) {
        const px = q.x + sx * (q.largo / 2 - 0.1), pz = q.z + sz * (q.ancho / 2 - 0.1), sy = suelo(px, pz);
        const [plx, plz] = L(px, pz);
        if (alto - 0.12 - sy > 0.02) cil(c, [plx, (sy + alto - 0.12) / 2 - 0.05, plz], 0.06, 0.07, alto - 0.12 - sy + 0.1, OSCURA, 4, 6);
      }
      // el borde
      for (const sz of [-1, 1]) cj(c, [lx, alto - 0.09, lz + sz * (q.ancho / 2 + 0.02)], [q.largo + 0.06, 0.1, 0.05], MADERA2);
      for (const sx of [-1, 1]) cj(c, [lx + sx * (q.largo / 2 + 0.02), alto - 0.09, lz], [0.05, 0.1, q.ancho + 0.06], MADERA2);
      // los escalones: en el medio de cada lado donde el tablado queda alto (uno o dos, según lo que haya que subir)
      for (const [sx, sz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const ex = q.x + sx * (q.largo / 2 + 0.3), ez = q.z + sz * (q.ancho / 2 + 0.3), sy = suelo(ex, ez), sube = alto - sy;
        if (sube < 0.28) continue;
        const n = sube > 0.62 ? 2 : 1, [elx, elz] = L(ex, ez), giro = sx ? PI / 2 : 0;
        for (let k = 1; k <= n; k++) {
          const h = sy + (sube * k) / (n + 1), off = (n - k) * 0.3;
          PR.escalon({ lx: elx + sx * off, lz: elz + sz * off, largo: 1.3, ancho: 0.32, alto: h, espesor: 0.08, color: MADERA, giro });
          cil(c, [elx + sx * off, (sy + h) / 2 - 0.04, elz + sz * off], 0.04, 0.04, Math.max(0.05, h - sy), OSCURA, 4, 5);
        }
      }
      void nombre;
      return alto;
    };
    const altoTarima = tablado(PREDIO.tarima, 0.4, 'tarima');
    predio.altoTarima = altoTarima;
    // (el telón de atrás de la tarima: dos postes y una vara)
    { const q = PREDIO.tarima, [lx, lz] = L(q.x, q.z - q.ancho / 2 + 0.1); for (const sx of [-1, 1]) cil(c, [lx + sx * (q.largo / 2 - 0.1), altoTarima + 1.1, lz], 0.05, 0.05, 2.2, OSCURA, 4, 6); cj(c, [lx, altoTarima + 2.15, lz], [q.largo, 0.06, 0.06], OSCURA); }
    predio.altoPista = tablado(PREDIO.pista, 0.12, 'pista');
    // --- la mesa larga y sus dos bancos (a nivel: las patas se estiran donde baja el terreno)
    {
      const q = PREDIO.mesa;
      let mx = -Infinity;
      for (let i = 0; i <= 8; i++) for (const dz of [-q.banco - 0.2, 0, q.banco + 0.2]) mx = Math.max(mx, suelo(q.x - q.largo / 2 + (i / 8) * q.largo, q.z + dz));
      const base = mx;
      const [lx, lz] = L(q.x, q.z);
      cj(c, [lx, base + 0.76, lz], [q.largo, 0.06, q.ancho], TABLA);
      for (let i = 0; i < 5; i++) {
        const x = q.x - q.largo / 2 + 0.2 + i * (q.largo - 0.4) / 4;
        for (const sz of [-1, 1]) {
          const z = q.z + sz * (q.ancho / 2 - 0.1), sy = suelo(x, z), [plx, plz] = L(x, z);
          cil(c, [plx, (sy + base + 0.74) / 2, plz], 0.045, 0.05, base + 0.74 - sy + 0.04, OSCURA, 4, 6);
        }
      }
      PR.mueble({ lx, ly: base + 0.4, lz, largo: q.largo, alto: 0.8, ancho: q.ancho, color: TABLA, dibujar: false });
      for (const sz of [-1, 1]) {
        const z = q.z + sz * q.banco;
        const [blx, blz] = L(q.x, z);
        cj(c, [blx, base + 0.43, blz], [q.largo - 0.2, 0.05, 0.3], MADERA);
        for (let i = 0; i < 4; i++) {
          const x = q.x - q.largo / 2 + 0.4 + i * (q.largo - 0.8) / 3, sy = suelo(x, z), [plx, plz] = L(x, z);
          cil(c, [plx, (sy + base + 0.41) / 2, plz], 0.04, 0.045, base + 0.41 - sy + 0.04, OSCURA, 4, 6);
        }
        for (let i = 0; i < q.sitios; i++) { const k = `mesa-${sz > 0 ? 'n' : 's'}-${i}`; const p = P[k]; asiento(p.x, p.z, base + 0.455, 'el banco de la mesa larga', p.rot); }
      }
      predio.altoMesa = base + 0.76;
    }
    // --- el fogón: un círculo de piedras, la ceniza, y troncos (o bancos, después de la minga) para sentarse
    {
      const q = PREDIO.fogon, [lx, lz] = L(q.x, q.z), y = suelo(q.x, q.z);
      for (let i = 0; i < 11; i++) { const a = (i / 11) * PI * 2; bola(c, [lx + Math.sin(a) * 0.72, y + 0.06, lz + Math.cos(a) * 0.72], 0.14 + (i % 3) * 0.02, i % 2 ? '#7a756b' : '#8f887b', [1.2, 0.7, 1]); }
      cil(c, [lx, y + 0.02, lz], 0.62, 0.66, 0.05, '#3a3632', 4, 14);
      const w = aMundo(q.x, q.z); ctx.col?.agregar({ x: w.x, z: w.z, r: 0.85, duenio: DUENIO });
      const bancos = mingaHecha(ctx.progreso?.()?.fiestas, 'bancos');
      for (let i = 0; i < q.troncos; i++) {
        const p = P[`fogon-${i}`], sy = suelo(p.x, p.z), [plx, plz] = L(p.x, p.z);
        if (bancos) { cj(c, [plx, sy + 0.4, plz], [0.9, 0.06, 0.34], MADERA, [0, p.rot + PI / 2, 0]); for (const s of [-1, 1]) cj(c, [plx + Math.cos(p.rot) * s * 0.35, sy + 0.2, plz - Math.sin(p.rot) * s * 0.35], [0.08, 0.4, 0.3], OSCURA, [0, p.rot + PI / 2, 0]); asiento(p.x, p.z, sy + 0.43, 'un banco del fogón', p.rot); }
        else { cil(c, [plx, sy + 0.2, plz], 0.2, 0.21, 0.62, i % 2 ? '#6a5040' : '#5e4636', 4, 9, [0, p.rot, PI / 2]); asiento(p.x, p.z, sy + 0.4, 'un tronco del fogón', p.rot); }
      }
    }
    // --- la mesita de los juegos y sus dos sillas
    {
      const q = PREDIO.juegos, [lx, lz] = L(q.x, q.z), y = suelo(q.x, q.z);
      cj(c, [lx, y + 0.72, lz], [0.8, 0.04, 0.8], TABLA);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cil(c, [lx + sx * 0.33, y + 0.36, lz + sz * 0.33], 0.03, 0.03, 0.72, OSCURA, 4, 6);
      PR.mueble({ lx, ly: y + 0.37, lz, largo: 0.8, alto: 0.74, ancho: 0.8, color: TABLA, dibujar: false });
      for (const k of ['juegos-0', 'juegos-1']) {
        const p = P[k], sy = suelo(p.x, p.z), [plx, plz] = L(p.x, p.z);
        cj(c, [plx, sy + 0.45, plz], [0.4, 0.04, 0.4], MADERA);
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cil(c, [plx + sx * 0.16, sy + 0.22, plz + sz * 0.16], 0.022, 0.022, 0.45, OSCURA, 4, 6);
        const dx = Math.sin(p.rot), dz = Math.cos(p.rot);
        cj(c, [plx - dx * 0.19, sy + 0.72, plz - dz * 0.19], [0.4, 0.5, 0.04], MADERA, [0, p.rot, 0]);
        asiento(p.x, p.z, sy + 0.47, 'una silla de la mesita de juegos', p.rot);
      }
    }
    // --- la cancha de la taba: la raya de cal y el «queso» de tierra blanda
    {
      const r = P['taba-raya'], qq = P['taba-queso'];
      const [rx, rz] = L(r.x, r.z); cj(c, [rx, suelo(r.x, r.z) + 0.01, rz], [0.06, 0.02, 1.2], '#e8e4d8', [0, 0, 0], 4);
      const [qx, qz] = L(qq.x, qq.z); cj(c, [qx, suelo(qq.x, qq.z) + 0.005, qz], [1.1, 0.02, 0.9], '#6a5a46', [0, 0, 0], 4);
      for (const sz of [-1, 1]) { const [px, pz] = L(r.x, r.z + sz * 0.7); cil(c, [px, suelo(r.x, r.z + sz * 0.7) + 0.2, pz], 0.025, 0.025, 0.4, OSCURA, 4, 6); }
    }
    // --- la leñera de la minga
    if (mingaHecha(ctx.progreso?.()?.fiestas, 'lenera')) {
      const q = PREDIO.lenera, [lx, lz] = L(q.x, q.z);
      const ys = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => suelo(q.x + sx * q.largo / 2, q.z + sz * q.ancho / 2));
      const y = Math.min(...ys);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const sy = suelo(q.x + sx * q.largo / 2, q.z + sz * q.ancho / 2); cil(c, [lx + sx * q.largo / 2, sy + (y + 2.1 - sy) / 2, lz + sz * q.ancho / 2], 0.08, 0.09, y + 2.1 - sy, MADERA2, 4, 7); }
      cj(c, [lx, y + 2.2, lz], [q.largo + 0.5, 0.06, q.ancho + 0.6], '#7c7a72', [0.12, 0, 0], 4);   // la chapa
      for (let fila = 0; fila < 5; fila++) for (let i = 0; i < 11; i++) {
        const x = lx - q.largo / 2 + 0.2 + i * (q.largo - 0.4) / 10 + (fila % 2) * 0.1;
        cil(c, [x, y + 0.14 + fila * 0.24, lz], 0.11, 0.11, q.ancho - 0.2, (i + fila) % 3 ? '#8a6a4a' : '#a07a52', 4, 7, [PI / 2, 0, 0]);
      }
      PR.mueble({ lx, ly: y + 0.7, lz, largo: q.largo, alto: 1.4, ancho: q.ancho, color: TABLA, dibujar: false });
      predio.lenera = { x: q.x, z: q.z };
    } else predio.lenera = null;
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(wc.x, y0, wc.z); m.rotation.y = rotPredio; m.castShadow = true; m.receiveShadow = true;
    escena.add(m); m.updateMatrixWorld(true);
    predio.malla = m; predio.firma = firma;
    const lista = ctx.sentaderos?.();
    if (Array.isArray(lista)) lista.push(...asientos);
    predio.asientos = asientos;
    ctx.alArmar?.();
  }
  // la altura del suelo del predio en un punto del plano (la pista y la tarima tienen tablado)
  function yPlano(x, z) {
    const w = aMundo(x, z);
    return alturaEn(w.x, w.z);
  }

  // ---------------------------------------------------------------- los adornos de la fiesta de hoy
  const adorno = { malla: null, firma: '' };
  function quitarAdorno() {
    if (adorno.malla) { adorno.malla.parent?.remove(adorno.malla); adorno.malla.geometry.dispose(); }
    adorno.malla = null; adorno.firma = '';
  }
  function armarAdorno(info, firma) {
    const y0 = predio.y0 || alturaEn(wc.x, wc.z);
    const c = new Constructor();
    const L = (x, z) => [x - C.x, z - C.z];
    const suelo = (x, z) => { const w = aMundo(x, z); return alturaEn(w.x, w.z) - y0; };
    const f = info.fecha;
    const patria = f.tipo === 'patria';
    const colores = patria ? ['#78b0d8', '#f2f0e8'] : BANDERINES;
    if (!info.soloNieve) {
    // las guirnaldas: postes alrededor de la mesa y la pista, con hileras de banderines colgando entre ellos
    const cx = (PREDIO.mesa.x + PREDIO.pista.x) / 2;
    const postes = [[cx - 4.6, 22.4], [cx + 4.6, 22.4], [cx + 4.6, 10.4], [cx - 4.6, 10.4], [cx, 22.6], [cx, 10.2]];
    const alto = 3.3;
    const tope = postes.map(([x, z]) => { const [lx, lz] = L(x, z), y = suelo(x, z); cil(c, [lx, y + alto / 2, lz], 0.05, 0.065, alto, '#5a4331', 4, 6); return [lx, y + alto, lz]; });
    const hileras = [[0, 4], [4, 1], [1, 2], [2, 5], [5, 3], [3, 0], [4, 5], [0, 2], [1, 3]];
    let k = 0;
    for (const [i, j] of hileras) {
      const a = tope[i], b = tope[j];
      const L2 = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(4, Math.round(L2 / 0.42));
      const rumbo = Math.atan2(b[0] - a[0], b[2] - a[2]);
      let ant = null;
      for (let s = 0; s <= n; s++) {
        const t = s / n, comba = Math.sin(t * PI) * 0.55;
        const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - comba, a[2] + (b[2] - a[2]) * t];
        if (ant) palo(c, ant, p, 0.006, '#d8d0c0', 4);
        if (s > 0 && s < n) banderin(c, p, rumbo, colores[k++ % colores.length]);
        ant = p;
      }
    }
    // el mantel y la comida en la mesa larga
    const q = PREDIO.mesa, top = (predio.altoMesa ?? 0.76) + 0.03;
    const [mx, mz] = L(q.x, q.z);
    cj(c, [mx, top, mz], [q.largo + 0.1, 0.012, q.ancho + 0.12], patria ? '#eef2f4' : '#ece6d8', [0, 0, 0], 4);
    for (const sz of [-1, 1]) cj(c, [mx, top - 0.1, mz + sz * (q.ancho / 2 + 0.06)], [q.largo + 0.1, 0.2, 0.008], '#e4ddcc', [0, 0, 0], 4);
    for (let i = 0; i < 11; i++) {
      const x = mx - q.largo / 2 + 0.5 + i * (q.largo - 1) / 10;
      for (const sz of [-1, 1]) { cil(c, [x, top + 0.012, mz + sz * 0.27], 0.11, 0.1, 0.012, '#e8e2d4', 4, 12); cil(c, [x + 0.15, top + 0.05, mz + sz * 0.18], 0.028, 0.022, 0.09, '#d8d6cc', 4, 8); }
    }
    const comida = info.menu?.platos || [];
    const fuente = (x, color, forma) => {
      cil(c, [x, top + 0.02, mz], 0.22, 0.2, 0.03, '#d8d0c0', 4, 14);
      if (forma === 'olla') { cil(c, [x, top + 0.13, mz], 0.17, 0.15, 0.2, '#2a2826', 4, 12); cil(c, [x, top + 0.23, mz], 0.155, 0.155, 0.01, color, 4, 12); }
      else if (forma === 'torta') { cil(c, [x, top + 0.09, mz], 0.17, 0.17, 0.12, '#f2ece0', 4, 16); cil(c, [x, top + 0.18, mz], 0.11, 0.11, 0.07, '#f2ece0', 4, 14); for (let v = 0; v < 6; v++) cil(c, [x + Math.sin(v) * 0.07, top + 0.25, mz + Math.cos(v) * 0.07], 0.006, 0.006, 0.06, '#e8c8a0', 4, 5); }
      else for (let i = 0; i < 6; i++) bola(c, [x - 0.1 + (i % 3) * 0.1, top + 0.06, mz - 0.05 + Math.floor(i / 3) * 0.1], 0.055, color, [1.3, 0.55, 0.8]);
    };
    const DIBUJO = { 'cordero al asador': ['#8a4a2a', 'trozos'], curanto: ['#9a6a4a', 'olla'], locro: ['#d8a84a', 'olla'], 'guiso de la minga': ['#8a5a3a', 'olla'], 'chocolate caliente': ['#5a3020', 'olla'], empanadas: ['#d89a4a', 'trozos'], pastelitos: ['#e0a850', 'trozos'],
      'torta de la aldea': ['#f2ece0', 'torta'], 'torta de cumpleaños': ['#f2ece0', 'torta'], 'torta negra': ['#3a2418', 'torta'], 'torta con noventa velitas': ['#f2ece0', 'torta'], 'frambuesas con crema': ['#b8304a', 'trozos'], 'manzanas asadas': ['#b8502a', 'trozos'], 'pan casero': ['#c8904a', 'trozos'] };
    comida.forEach((pl, i) => { const d = DIBUJO[pl] || ['#a8784a', 'trozos']; fuente(mx - q.largo / 2 + 1.4 + i * ((q.largo - 2.8) / Math.max(1, comida.length - 1)), d[0], d[1]); });
    for (const dx of [-2.6, 0.2, 2.8]) { cil(c, [mx + dx, top + 0.11, mz + 0.2], 0.06, 0.07, 0.2, '#c8c8c0', 4, 10); cil(c, [mx + dx, top + 0.09, mz + 0.2], 0.055, 0.065, 0.14, patria ? '#e8d070' : '#7a1a2a', 4, 10); }
    // el asador: la cruz con el cordero (o la olla en las trébedes) al lado del fogón
    {
      const a = P.asador, [ax, az] = L(a.x, a.z), y = suelo(a.x, a.z);
      if (info.asado) {
        palo(c, [ax, y - 0.1, az], [ax + Math.sin(a.rot) * 0.5, y + 1.6, az + Math.cos(a.rot) * 0.5], 0.04, '#5a4331');
        const mid = [ax + Math.sin(a.rot) * 0.3, y + 0.95, az + Math.cos(a.rot) * 0.3];
        palo(c, [mid[0] - Math.cos(a.rot) * 0.45, mid[1], mid[2] + Math.sin(a.rot) * 0.45], [mid[0] + Math.cos(a.rot) * 0.45, mid[1], mid[2] - Math.sin(a.rot) * 0.45], 0.025, '#5a4331');
        bola(c, [mid[0], mid[1] + 0.05, mid[2]], 0.3, '#8a4a28', [1.3, 1.9, 0.35]);
      } else {
        for (let i = 0; i < 3; i++) { const ang = (i / 3) * PI * 2; palo(c, [ax + Math.sin(ang) * 0.32, y, az + Math.cos(ang) * 0.32], [ax, y + 0.5, az], 0.015, '#2a2826'); }
        cil(c, [ax, y + 0.42, az], 0.22, 0.2, 0.3, '#2a2826', 4, 12);
      }
    }
    }
    // la nevada: los montones de nieve en las puertas que todavía no se palearon
    for (const casa of info.nieve || []) {
      const e = edificioEnMundo(casa.edificio);
      const pt = puntosFijosDe(casa.edificio).puerta;
      if (!e || !pt) continue;
      const w = aMundo(pt.x, pt.z);
      const [lx, lz] = [w.x, w.z];
      // (en el marco del predio: del mundo a lo local)
      const dx = lx - wc.x, dz = lz - wc.z, cR = Math.cos(rotPredio), sR = Math.sin(rotPredio);
      const px = dx * cR - dz * sR, pz = dx * sR + dz * cR, y = alturaEn(w.x, w.z) - y0;
      for (let i = 0; i < 5; i++) bola(c, [px + Math.sin(i * 1.7) * 0.6, y + 0.12, pz + Math.cos(i * 2.3) * 0.5], 0.42 - i * 0.04, '#eef2f6', [1.4, 0.55, 1.2]);
    }
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(wc.x, y0, wc.z); m.rotation.y = rotPredio; m.castShadow = true; m.receiveShadow = true;
    escena.add(m); m.updateMatrixWorld(true);
    adorno.malla = m; adorno.firma = firma;
  }

  // ---------------------------------------------------------------- el fuego (como el de la cocina: el mismo programa)
  const matFuego = new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  const fuego = { malla: null, luz: null, prendido: false };
  function armarFuego() {
    const c = new Constructor();
    for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.22 : 0; c.agregar(new THREE.ConeGeometry(0.16 - (i ? 0.05 : 0), 0.85 - (i ? 0.3 : 0), 6), { color: '#ffffff', tipo: 0, matriz: matriz([Math.sin(a) * r, 0.38, Math.cos(a) * r]), variar: 0 }); }
    const m = new THREE.Mesh(c.geometria(), matFuego);
    const q = PREDIO.fogon, w = aMundo(q.x, q.z);
    m.position.set(w.x, alturaEn(w.x, w.z) + 0.04, w.z);
    m.visible = false;
    escena.add(m);
    fuego.malla = m;
    const luz = new THREE.PointLight('#ffaa55', 0, 14, 1.6);
    luz.position.set(w.x, alturaEn(w.x, w.z) + 1.2, w.z);
    escena.add(luz);
    registrarLuz(luz);
    fuego.luz = luz;
  }

  // ---------------------------------------------------------------- el instrumento del músico
  let geoInstr = { acordeon: null, guitarra: null };
  const conInstrumento = new Map();   // npc → malla
  function darInstrumento(npc, cual) {
    const ya = conInstrumento.get(npc);
    if (ya && ya.userData.cual === cual) { ya.visible = true; return; }
    if (ya) { ya.parent?.remove(ya); conInstrumento.delete(npc); }
    if (!cual || !npc?.torso) return;
    geoInstr[cual] = geoInstr[cual] || (cual === 'acordeon' ? geoAcordeon() : geoGuitarra());
    const m = new THREE.Mesh(geoInstr[cual], mat);
    m.userData.cual = cual;
    if (cual === 'acordeon') { m.position.set(0, 0.1, 0.24); }
    else { m.position.set(0.02, -0.05, 0.22); m.rotation.set(0, 0, -1.05); }
    npc.torso.add(m);
    conInstrumento.set(npc, m);
  }
  function quitarInstrumentos(menos = null) { for (const [n, m] of conInstrumento) if (n !== menos) { m.parent?.remove(m); conInstrumento.delete(n); } }

  // ---------------------------------------------------------------- la música
  const musica = { s: null, id: null, proxima: 0, destino: null };
  function callar() {
    const s = ctx.sonido?.();
    if (musica.s && s?.ctx) { try { musica.s.destino.gain.setTargetAtTime(0, s.ctx.currentTime, 0.4); } catch { /* ya */ } const d = musica.s.destino; setTimeout(() => { try { d.disconnect(); } catch { /* ya */ } }, 3000); }
    musica.s = null;
  }
  function acordeon(s, midi, cuando, dur, vol, destino) {
    if (!s.puedeSonar?.(2, cuando)) return;
    const c = s.ctx, t = c.currentTime + cuando, hz = 440 * Math.pow(2, (midi - 69) / 12);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(3200, hz * 5); lp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.035); g.gain.setTargetAtTime(vol * 0.8, t + 0.08, 0.1); g.gain.setTargetAtTime(0, t + dur * 0.92, 0.04);
    const trem = c.createOscillator(); trem.frequency.value = 5.8; const tg = c.createGain(); tg.gain.value = vol * 0.18; trem.connect(tg); tg.connect(g.gain);
    const osc = [];
    for (const [k, det] of [[1, -7], [1, 7], [2, 0]]) {
      const o = c.createOscillator();
      if (s.ondas?.sawtooth) o.setPeriodicWave(k === 2 ? s.ondas.square || s.ondas.sawtooth : s.ondas.sawtooth); else o.type = 'sawtooth';
      o.frequency.value = hz * k; o.detune.value = det;
      const og = c.createGain(); og.gain.value = k === 2 ? 0.25 : 0.5;
      o.connect(og); og.connect(lp); osc.push([o, og]);
      o.start(t); o.stop(t + dur + 0.3);
    }
    lp.connect(g); g.connect(destino);
    trem.start(t); trem.stop(t + dur + 0.3);
    osc[0][0].onended = () => { try { for (const [o, og] of osc) { o.disconnect(); og.disconnect(); } lp.disconnect(); g.disconnect(); trem.disconnect(); tg.disconnect(); } catch { /* ya */ } };
  }
  function violin(s, midi, cuando, dur, vol, destino) {
    if (!s.puedeSonar?.(2, cuando)) return;
    const c = s.ctx, t = c.currentTime + cuando, hz = 440 * Math.pow(2, (midi - 69) / 12);
    const o = c.createOscillator(); if (s.ondas?.sawtooth) o.setPeriodicWave(s.ondas.sawtooth); else o.type = 'sawtooth';
    o.frequency.value = hz;
    const vib = c.createOscillator(); vib.frequency.value = 5.5; const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(hz * 0.006, t + Math.min(0.4, dur * 0.6)); vib.connect(vg); vg.connect(o.frequency);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(3000, hz * 3); bp.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.setTargetAtTime(0, t + dur * 0.9, 0.06);
    o.connect(bp); bp.connect(g); g.connect(destino);
    o.start(t); o.stop(t + dur + 0.4); vib.start(t); vib.stop(t + dur + 0.4);
    o.onended = () => { try { o.disconnect(); bp.disconnect(); g.disconnect(); vib.disconnect(); vg.disconnect(); } catch { /* ya */ } };
  }
  function tocarEvento(s, e, cuando, instrumento, destino) {
    if (e.voz === 'melodia') {
      if (instrumento === 'acordeon') acordeon(s, e.midi, cuando, e.dur, 0.05, destino);
      else if (instrumento === 'violin') violin(s, e.midi, cuando, e.dur, 0.045, destino);
      else if (instrumento === 'quena') s.quena?.(440 * Math.pow(2, (e.midi - 69) / 12), { cuando, dur: Math.max(0.3, e.dur * 0.94), vol: 0.035, destino });
      else s.pulsar?.(e.midi, { cuando, dur: Math.max(1.2, e.dur * 2), vol: 0.13 * Math.pow(2, (e.midi - 57) / 24), destino });
    } else if (e.voz === 'bajo') s.pulsar?.(e.midi, { cuando, dur: Math.max(1.2, e.dur * 1.3), vol: 0.08, destino });
    else if (e.voz === 'rasgueo') { for (let i = 0; i < 3; i++) s.pulsar?.(e.midi + [0, 4, 7][i], { cuando: cuando + i * 0.012, dur: 0.6, vol: 0.045, destino }); }
    else if (e.voz === 'bombo') { s.tono?.({ frec: 96, fin: 52, dur: 0.32, tipo: 'sine', vol: 0.28, ataque: 0.004, destino, cuando }); s.golpeRuido?.({ dur: 0.12, frec: 220, tipo: 'lowpass', vol: 0.12, destino, cuando }); }
    else if (e.voz === 'parche') s.golpeRuido?.({ dur: 0.07, frec: 1900, q: 1.4, tipo: 'bandpass', vol: 0.09, destino, cuando });
  }
  function actualizarMusica(info) {
    const s = ctx.sonido?.();
    const js = jugadorPos();
    const id = info?.musica || null;
    const musico = info?.musico || null;
    const t = P.tarima, w = aMundo(t.x, t.z);
    const d = js ? dist(js, w) : Infinity;
    if (!s?.ctx || !s.bus?.musica || !id || !musico || d > OIR || s.musicaActiva === false) { if (musica.s) callar(); return; }
    s.proxMusica = Math.max(s.proxMusica || 0, 20);   // (que no se le encime una frase del piano del valle)
    const vol = (d < 10 ? 1 : Math.max(0, 1 - (d - 10) / (OIR - 10))) * (info.suave ? 0.45 : 1);
    if (musica.s && musica.s.id !== id) callar();
    if (!musica.s) {
      if (s.ctx.currentTime < musica.proxima) return;
      const ev = eventosMusica(id);
      if (!ev) return;
      const destino = s.ctx.createGain(); destino.gain.value = 0.9 * vol; destino.connect(s.bus.musica);
      if (s.envioReverb) { const rv = s.ctx.createGain(); rv.gain.value = 0.7; destino.connect(rv); rv.connect(s.envioReverb); }
      musica.s = { id, destino, t0: s.ctx.currentTime + 0.2, i: 0, ev, fin: s.ctx.currentTime + 0.2 + ev.duracion + 1 };
    }
    const m = musica.s;
    try { m.destino.gain.setTargetAtTime(0.9 * vol, s.ctx.currentTime, 0.3); } catch { /* ya */ }
    const ahora = s.ctx.currentTime, hasta = ahora + 1.2 - m.t0;
    while (m.i < m.ev.eventos.length && m.ev.eventos[m.i].cuando <= hasta) {
      const e = m.ev.eventos[m.i++];
      tocarEvento(s, e, Math.max(0, m.t0 + e.cuando - ahora), m.ev.instrumento, m.destino);
    }
    if (m.i >= m.ev.eventos.length && ahora > m.fin) { const dd = m.destino; setTimeout(() => { try { dd.disconnect(); } catch { /* ya */ } }, 2000); musica.s = null; musica.proxima = ahora + 3.5; musica.tandas = (musica.tandas || 0) + 1; }
  }

  // ---------------------------------------------------------------- figuras propias: los invitados y el domador
  const figuras = new Map();   // id → { def, npc, tarea, clave }
  let armando = null;
  let deUna = false;   // (las capturas y las pruebas: se ubican sin caminar)
  function pedirFigura(id, def) {
    let f = figuras.get(id);
    if (!f) { f = { id, def, npc: null, tarea: null, clave: '' }; figuras.set(id, f); }
    return f;
  }
  function quitarFigura(id) {
    const f = figuras.get(id);
    if (!f) return;
    if (f.npc) { darInstrumento(f.npc, null); ctx.gente?.()?.quitar?.(f.npc); }
    else if (f.tarea?.npc) ctx.gente?.()?.quitar?.(f.tarea.npc);
    figuras.delete(id);
    if (armando === f) armando = null;
  }
  function avanzarArmado() {
    const g = ctx.gente?.();
    if (!g?.armarPobladorDeAPoco) return;
    if (!armando) armando = [...figuras.values()].find((f) => !f.npc && f.querida) || null;
    if (!armando) return;
    const f = armando;
    if (!f.tarea) {
      const p0 = f.querida;
      f.tarea = g.armarPobladorDeAPoco({ ...f.def, pos: { x: p0.x, z: p0.z }, mira: { x: p0.x + Math.sin(p0.mira || 0), z: p0.z + Math.cos(p0.mira || 0) }, camino: [] });
    }
    if (f.tarea.avanzar(ctx.msFigura?.() || 3)) {
      f.npc = f.tarea.npc; f.tarea = null; armando = null;
      if (f.npc) { f.npc.claveAldea = f.def.clave; f.npc.invitado = true; f.npc.dormido = false; f.npc.enLejano = true; f.clave = ''; }
    }
  }
  const anden = () => { const q = puntosFijosDe('estacion-aldea').anden, w = aMundo(q.x, q.z); return { x: w.x, z: w.z, mira: M.rotMundo(q.rot) }; };
  function porLaAldea(desde, hasta) {
    const a = M.aLocal(desde.x, desde.z), b = M.aLocal(hasta.x, hasta.z);
    return recorridoAldea({ x: a.lx, z: a.lz }, { x: b.lx, z: b.lz }).map((q) => ({ ...aMundo(q.x, q.z), sinChoque: !!q.sinChoque, cerca: 0.5 }));
  }
  // lleva la figura a `d` ({ x, z, mira, pose, asiento }) caminando si la ves; si no, de una
  function moverFigura(f, d) {
    const n = f.npc;
    if (!n) return;
    if (!d) { n.dormido = true; n.camino = []; f.clave = ''; return; }
    const js = jugadorPos();
    const clave = `${d.x.toFixed(1)}|${d.z.toFixed(1)}|${d.pose || ''}`;
    if (clave !== f.clave) {
      f.clave = clave;
      const ver = !deUna && js && (dist(js, n.pos) < 70 || dist(js, d) < 70);
      if (ver && dist(n.pos, d) > 1.2) { n.camino = [...porLaAldea(n.pos, d).slice(0, -1), { x: d.x, z: d.z, cerca: 0.15 }]; n.pose = null; n.asiento = undefined; f.llegar = d; }
      else ubicar(n, d);
    }
    if (f.llegar && !n.camino?.length) { ubicar(n, f.llegar); f.llegar = null; }
    n.dormido = !js || dist(js, n.pos) > VER_FIGURAS;
  }
  function ubicar(n, d) {
    n.pos.set(d.x, ctx.alturaDePie?.(d.x, d.z, n.pos.y) ?? alturaEn(d.x, d.z), d.z);
    n.camino = []; n.espera = 0;
    n.miraFinal = d.mira ?? 0; n.rumbo = n.rumboObjetivo = n.miraFinal;
    if (n.g?.rotation) n.g.rotation.y = n.miraFinal;
    n.pose = d.pose || null; n.asiento = Number.isFinite(d.asiento) ? d.asiento : undefined;
  }
  // un punto del predio en el mundo (con la pose)
  const enMundo = (punto, extra = {}) => { const q = P[punto]; if (!q) return null; const w = aMundo(q.x, q.z); return { x: w.x, z: w.z, mira: M.rotMundo(q.rot), ...extra }; };

  // ---------------------------------------------------------------- la jineteada: el redomón
  const caballo = { m: null, t: 0, monta: null, jinete: null, base: null };
  function armarCaballo() {
    if (caballo.m) return;
    caballo.m = mallaCaballo({ pelaje: 'tordillo', montura: '#4a3226', manta: '#8a3a2a' });
    caballo.m.g.visible = false;
    escena.add(caballo.m.g);
  }
  // `monta`: { t (s), eq (−1 a 1), cayo, aguanto } de quien monta; null: atado al palenque
  function ponerCaballo(dt, monta, ver) {
    if (!caballo.m) armarCaballo();
    const g = caballo.m.g;
    g.visible = ver;
    if (!ver) return null;
    const R = PREDIO.ruedo;
    caballo.t += dt;
    const t = caballo.t;
    let x, z, yaw, cabeceo = 0, salto = 0, rolido = 0;
    if (monta && !monta.fin) {
      // da vueltas por el ruedo, corcoveando
      const a = t * 0.55;
      const r = 2.3 + Math.sin(t * 0.9) * 0.6;
      const p = { x: R.x + Math.sin(a) * r, z: R.z + Math.cos(a) * r };
      const w = aMundo(p.x, p.z);
      x = w.x; z = w.z; yaw = M.rotMundo(a + PI / 2) + Math.sin(t * 3.1) * 0.35;
      const k = Math.sin(t * 7.5);
      cabeceo = k * 0.32; salto = Math.abs(Math.sin(t * 7.5)) * 0.32; rolido = (monta.eq || 0) * 0.18;
    } else {
      const q = P.palenque, w = aMundo(q.x + 1.1, q.z + 0.2);
      x = w.x; z = w.z; yaw = M.rotMundo(-PI / 2); cabeceo = Math.sin(t * 0.8) * 0.02;
    }
    g.position.set(x, alturaEn(x, z) + salto, z);
    g.rotation.order = 'YXZ';
    g.rotation.set(-cabeceo, yaw, rolido);
    g.updateMatrixWorld(true);
    return { x, z, y: alturaEn(x, z) + salto, yaw, cabeceo, rolido };
  }
  const _v = new THREE.Vector3();
  // el punto de la montura en el mundo
  function montura(alto = 1.18) { _v.set(0, alto, -0.05); caballo.m.g.localToWorld(_v); return { x: _v.x, y: _v.y, z: _v.z }; }

  // ---------------------------------------------------------------- los recuerdos en la pared del refugio
  const recuerdos = { malla: null, firma: '' };
  function actualizarRecuerdos() {
    const fz = ctx.progreso?.()?.fiestas;
    const colgados = Array.isArray(fz?.colgados) ? fz.colgados : [];
    const r = ctx.refugio?.();
    const firma = r ? `${colgados.join(',')}|${r.x.toFixed(1)}` : '';
    if (firma === recuerdos.firma) { if (recuerdos.malla) { const js = jugadorPos(); recuerdos.malla.visible = !!js && dist(js, r) < 40; } return; }
    if (recuerdos.malla) { recuerdos.malla.parent?.remove(recuerdos.malla); recuerdos.malla.geometry.dispose(); recuerdos.malla = null; }
    recuerdos.firma = firma;
    if (!r) return;
    const c = new Constructor();
    // (armado en su lugar del marco del refugio y girado para que mire hacia adentro: ver `TABLERO.giro`)
    const P0 = { ...TABLERO, x: 0, y: 0, z: 0 };
    // el tablero de madera (siempre: ahí se cuelgan)
    cj(c, [P0.x, P0.y, P0.z], [P0.ancho, P0.alto, 0.03], '#8a6b4a', [0, 0, 0], 4);
    cj(c, [P0.x, P0.y + P0.alto / 2 + 0.02, P0.z + 0.01], [P0.ancho + 0.06, 0.04, 0.05], '#6a4c34');
    cj(c, [P0.x, P0.y - P0.alto / 2 - 0.02, P0.z + 0.01], [P0.ancho + 0.06, 0.04, 0.05], '#6a4c34');
    colgados.slice(0, 12).forEach((id, i) => {
      const d = RECUERDOS[id];
      if (!d) return;
      const col = i % 6, fila = Math.floor(i / 6);
      const x = P0.x - P0.ancho / 2 + 0.15 + col * ((P0.ancho - 0.3) / 5), y = P0.y + 0.17 - fila * 0.36;
      cil(c, [x, y + 0.13, P0.z + 0.03], 0.008, 0.008, 0.04, '#b8a070', 4, 5, [PI / 2, 0, 0]);   // el clavito
      dibujarRecuerdo(c, d.forma, d.color, x, y, P0.z + 0.04);
    });
    const m = new THREE.Mesh(c.geometria(), mat);
    const cR = Math.cos(r.rot || 0), sR = Math.sin(r.rot || 0);
    m.position.set(r.x + TABLERO.x * cR + TABLERO.z * sR, r.y + TABLERO.y, r.z - TABLERO.x * sR + TABLERO.z * cR); m.rotation.y = (r.rot || 0) + TABLERO.giro; m.castShadow = false; m.receiveShadow = true;
    escena.add(m); m.updateMatrixWorld(true);
    recuerdos.malla = m;
  }

  // ---------------------------------------------------------------- cada cuadro
  let acum = 1, firmaAdorno = '';
  function actualizar(dt) {
    reloj.t += dt;
    const js = jugadorPos();
    const j = juego();
    const activo = !!j?.activo?.();
    if (!activo || !js) { if (musica.s) callar(); return; }
    const cerca = dist(js, centroMundo);
    acum += dt;
    // el predio: se arma (una vez) al acercarte
    const firmaPredio = `${mingaHecha(ctx.progreso?.()?.fiestas, 'lenera')}|${mingaHecha(ctx.progreso?.()?.fiestas, 'bancos')}`;
    if (cerca < VER_PREDIO && predio.firma !== firmaPredio) { quitarPredio(); armarPredio(firmaPredio); }
    if (predio.malla) predio.malla.visible = cerca < VER_PREDIO;
    if (!fuego.malla) armarFuego();
    const info = j.paraElMundo?.() || null;   // { fecha, fase, menu, asado, musica, fuego, nieve, invitados, jineteada, … }
    // los adornos de hoy
    if (acum >= 0.5) {
      acum = 0;
      const fa = info?.adornos ? `${info.fecha.id}|${info.fecha.anio}|${(info.nieve || []).map((c) => c.clave).join(',')}|${info.asado}` : '';
      if (fa !== firmaAdorno) { quitarAdorno(); firmaAdorno = fa; if (fa && cerca < VER_PREDIO) armarAdorno(info, fa); else firmaAdorno = fa && cerca >= VER_PREDIO ? '' : fa; }
      actualizarRecuerdos();
    }
    if (adorno.malla) adorno.malla.visible = cerca < VER_PREDIO;
    // el fuego
    const prender = !!info?.fuego && cerca < 200;
    fuego.malla.visible = prender;
    if (prender) {
      const t = reloj.t;
      fuego.malla.scale.set(0.92 + Math.sin(t * 11) * 0.06, 0.85 + Math.sin(t * 17.3) * 0.12 + Math.sin(t * 6.1) * 0.06, 0.92 + Math.cos(t * 9.7) * 0.06);
      const noche = ctx.noche?.() ?? 0.5;
      fuego.luz.intensity = cerca < 60 ? (0.6 + noche * 2.2) * (0.9 + Math.sin(t * 13) * 0.08) : 0;
    } else fuego.luz.intensity = 0;
    // el músico con su instrumento (y la música)
    const musico = info?.musico ? ctx.aldeaGente?.()?.personas?.get?.('musico')?.npc : null;
    const toca = !!(musico && !musico.dormido && musico.pose === 'tocar');
    if (toca) darInstrumento(musico, MUSICAS[info.musica]?.instrumento === 'acordeon' ? 'acordeon' : 'guitarra'); else if (musico) darInstrumento(musico, null);
    if (!toca && !info?.musico) quitarInstrumentos();
    actualizarMusica(toca ? info : null);
    // los invitados
    const quiero = new Set();
    for (const inv of info?.invitados || []) {
      quiero.add(inv.clave);
      const f = pedirFigura(inv.clave, { ...inv, velocidad: 0.9, camino: [] });
      const d = inv.destino ? (inv.destino === 'anden' ? anden() : enMundo(inv.destino, { pose: inv.pose || null, asiento: inv.asiento })) : null;
      f.querida = f.querida || anden();
      if (f.npc) moverFigura(f, d);
    }
    for (const id of [...figuras.keys()]) if (!quiero.has(id)) quitarFigura(id);
    if (cerca < 260) avanzarArmado();
    // la jineteada
    const jin = info?.jineteada || null;   // { monta: { quien: 'jugador'|clave, t, eq, fin }, ver }
    const verCaballo = !!jin && cerca < VER_FIGURAS;
    const pc = ponerCaballo(dt, jin?.monta || null, verCaballo);
    caballo.ultimo = pc;
    // el jinete (una figura propia: el domador u otro invitado) arriba del caballo
    const quien = jin?.monta && !jin.monta.fin && jin.monta.quien !== 'jugador' ? jin.monta.quien : null;
    if (caballo.jinete && caballo.jinete !== quien) { const f = figuras.get(caballo.jinete); if (f?.npc) { f.npc.pose = null; f.clave = ''; } caballo.jinete = null; }
    if (quien && pc) {
      const f = figuras.get(quien);
      if (f?.npc) {
        caballo.jinete = quien;
        const p = montura(1.05);
        f.npc.pos.set(p.x, p.y - 0.32, p.z); f.npc.camino = []; f.npc.pose = 'jinete'; f.npc.dormido = false;
        f.npc.rumbo = f.npc.rumboObjetivo = f.npc.miraFinal = pc.yaw; if (f.npc.g?.rotation) f.npc.g.rotation.y = pc.yaw;
        f.clave = 'jinete';
      }
    }
  }
  // La cámara del jugador, arriba del redomón (la llama fiestas-juego.js mientras montás): después del jugador
  function camaraJineteada(camara, eq = 0) {
    if (!caballo.m?.g?.visible || !caballo.ultimo) return false;
    const p = montura(1.95);
    camara.position.set(p.x, p.y, p.z);
    camara.rotation.order = 'YXZ';
    camara.rotation.set(-0.12 - caballo.ultimo.cabeceo * 0.6, caballo.ultimo.yaw + PI, eq * 0.45 + caballo.ultimo.rolido);
    return true;
  }
  // dónde parás al jugador mientras monta (sobre el suelo, abajo de la montura)
  function sueloJineteada() { if (!caballo.ultimo) return null; return { x: caballo.ultimo.x, z: caballo.ultimo.z }; }

  function liberar() {
    quitarPredio(); quitarAdorno(); callar(); quitarInstrumentos();
    for (const id of [...figuras.keys()]) quitarFigura(id);
    if (fuego.malla) { fuego.malla.parent?.remove(fuego.malla); fuego.malla.geometry.dispose(); fuego.malla = null; }
    if (fuego.luz) { olvidarLuz(fuego.luz); fuego.luz.parent?.remove(fuego.luz); fuego.luz = null; }
    if (caballo.m) { caballo.m.g.parent?.remove(caballo.m.g); caballo.m = null; }
    if (recuerdos.malla) { recuerdos.malla.parent?.remove(recuerdos.malla); recuerdos.malla = null; recuerdos.firma = ''; }
  }

  // Lo pisado sin pasto (para marcarPisos de main.js): todo el predio, en dos rectángulos (y la leñera)
  let pisosHechos = null;
  function pisos() {
    if (!pisosHechos) {
      pisosHechos = [];
      const ang = Math.atan2(aMundo(1, 0).z - aMundo(0, 0).z, aMundo(1, 0).x - aMundo(0, 0).x);
      for (const [x0, x1, z0, z1] of [[10.6, 22.6, 7.6, 23.2], [22.6, 36.2, 6.6, 23.2]]) {
        const w = aMundo((x0 + x1) / 2, (z0 + z1) / 2);
        pisosHechos.push({ x: w.x, z: w.z, ang, largo: x1 - x0, ancho: z1 - z0, alto: alturaEn(w.x, w.z) });
      }
    }
    return pisosHechos;
  }
  return {
    actualizar, liberar, camaraJineteada, sueloJineteada, pisos,
    centro: () => ({ ...centroMundo }),
    // del plano de la aldea al mundo (para fiestas-juego.js: dónde está cada cosa del predio)
    punto: (nombre) => { const q = P[nombre]; if (!q) return null; const w = aMundo(q.x, q.z); return { x: w.x, z: w.z, y: alturaEn(w.x, w.z), mira: M.rotMundo(q.rot) }; },
    aLocal: (x, z) => { const l = M.aLocal(x, z); return { x: l.lx, z: l.lz }; },
    altos: () => ({ pista: predio.altoPista ?? null, tarima: predio.altoTarima ?? null, mesa: predio.altoMesa ?? null, y0: predio.y0 }),
    figura: (id) => figuras.get(id)?.npc || null,
    deUna: (si = true) => { deUna = !!si; for (const f of figuras.values()) f.clave = ''; },
    armarTodo: (ms = 1e6) => { for (let i = 0; i < 12; i++) { const a = [...figuras.values()].find((f) => !f.npc && f.querida); if (!a) break; armando = a; const g = ctx.gente?.(); if (!a.tarea && g) a.tarea = g.armarPobladorDeAPoco({ ...a.def, pos: { x: a.querida.x, z: a.querida.z }, mira: { x: a.querida.x, z: a.querida.z + 1 }, camino: [] }); if (a.tarea?.avanzar(ms)) { a.npc = a.tarea.npc; a.tarea = null; armando = null; if (a.npc) { a.npc.claveAldea = a.def.clave; a.npc.invitado = true; a.npc.enLejano = true; } } } },
    tablero: () => { const r = ctx.refugio?.(); if (!r) return null; const c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0); return { x: r.x + TABLERO.x * c + TABLERO.z * s, z: r.z - TABLERO.x * s + TABLERO.z * c, y: r.y + TABLERO.y }; },
    // para las pruebas
    estado: () => ({
      predio: !!predio.malla, asientos: predio.asientos.length, adorno: !!adorno.malla, firmaAdorno, fuego: !!fuego.malla?.visible, musica: musica.s ? musica.s.id : null,
      invitados: [...figuras.values()].map((f) => ({ id: f.id, lista: !!f.npc, x: f.npc?.pos.x, z: f.npc?.pos.z, pose: f.npc?.pose || null, dormido: !!f.npc?.dormido })),
      caballo: !!caballo.m?.g?.visible, jinete: caballo.jinete, recuerdos: recuerdos.firma, instrumentos: conInstrumento.size,
      dibujos: [predio.malla, adorno.malla, fuego.malla?.visible ? fuego.malla : null, recuerdos.malla].filter(Boolean).length,
    }),
  };
}
// El tablero de los recuerdos, en el marco del refugio (W 7 × D 5,5, la puerta en +Z): en la pared de la puerta, al costado,
// mirando hacia adentro (y: sobre la base del refugio). En la del fondo están la salamandra, los estantes y la cama (ahí E
// te acostaba)
export const TABLERO = { x: -1.95, y: 1.72, z: 2.6, ancho: 1.5, alto: 0.78, giro: Math.PI };
