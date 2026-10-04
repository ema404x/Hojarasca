// 3.6: la Aldea de los Duendes en el mundo (sólo en el Relax). El plano y las reglas son de
// aldea.js, la gente de aldea-gente.js y cada edificio (con su interior y sus etapas de obra) de
// aldea-arquitectura.js; acá se los pone en el valle:
//   · el terreno: después de plantar el bosque (la lista de árboles no cambia) se empareja cada
//     lote a la altura de su piso, con un borde suave (`emparejarTerreno`, sobre `T.alturas` y
//     `T.pendiente`), y se despejan los árboles de las plantas y las calles (sólo
//     `veg.despejar`). La malla del suelo es gruesa (4 a 11 m entre vértices, según la calidad):
//     en la aldea va un parche fino (2 m) que sigue al terreno emparejado y se cose a la malla
//     gruesa en el borde; la de abajo, adentro del parche, se hunde 4 m y queda tapada.
//     El sorteo de sitios de estructuras.js mira el terreno de ANTES (`terrenoDeSorteo`): la
//     torre, la cueva y el galpón quedan donde estaban sin aldea;
//   · las calles de ripio pintadas en la máscara del suelo (canal del sendero: tierra, sin pasto,
//     flores ni helechos) y marcadas como piso (`pisos`, para marcarPisos de main.js); 3.6 (detalles):
//     niveladas a lo largo (sin los lomos que dejaban los bordes de los lotes) y con su ripio de
//     verdad (`materialRipio`: grava sin repetición, huellas, pasto ralo, charcos después de la
//     lluvia, nieve), sobre la misma rejilla del suelo fino;
//   · los edificios: cada manzana es un complejo (una raíz en `est.grupo`, en `est.conjuntos`):
//     el LOD de main.js la apaga lejos y `repasoSinOcultos` no recorre sus matrices. Adentro, el
//     exterior de todos sus edificios fundido en una pieza por material (estructura, vidrios,
//     carteles, follaje); los muebles y las brasas de cada uno sólo a menos de 25 m; las hojas de
//     las puertas, de a una malla, hasta 80 m; las sombras, cerca;
//   · la geometría se arma en un Worker (el mismo código de aldea-arquitectura.js, sacado del
//     script de la página): la carga no la espera salvo que aparezcas en la aldea, y cuando una
//     obra cambia de etapa se rearma SÓLO ese lote, sin tirón (lo de antes queda en la pieza
//     fundida con sus vértices colapsados, y el lote nuevo va suelto hasta la próxima carga). Sin
//     Worker (Node, o si falla) se arma en el momento;
//   · faroles a lo largo de las calles, veredas de tablas, cercos atrás de las casas, pircas y
//     hileras de álamos cortaviento (instanciados, con su LOD: si se funden, el otoño sale parejo);
//     3.6 (detalles): muretes de pirca y escalones de laja entre lotes a distinta altura
//     (`planDesniveles`), frutales en los patios, arbustos y cercos de palo a pique en el borde;
//   · la estación (`armarAgregadoEstacion`) sobre la parada del sur;
//   · las luces: un interior por edificio, los faroles de la calle y de la plaza, registrados
//     en luces.js: el presupuesto fijo (4 puntuales + 1 foco) elige los más cercanos, así que
//     nunca hay más de 4 ni se compila nada; las ventanas brillan con `brilloVentana`;
//   · bajo techo (lluvia, nieve, sonido), techos (sin nieve adentro), pisos (sin pasto), humo.
import * as THREE from 'three';
import { PARADA_ALDEA, EDIFICIOS_ALDEA, IDS_EDIFICIOS, CALLES_ALDEA, marcoAldea, zonasAldea, sitioEstructura, escucharAldea, esLote, puntosDe, distanciaACalle, quienLlega, obraEnCurso, LOTE_DE, plantaDe, suave01 } from './aldea.js';
import { estadoVisual } from './aldea-gente.js';
import { armarEdificio, armarAccesorio, armarAgregadoEstacion, registrarEnMundo, crearTexturaCarteles, ESCUELA_A_MEDIO_HACER, prepararMaterialAldea, prepararVidrioAldea, prepararFollajeAldea, armarCable, SUPERFICIES_ALDEA, aMundoAldea, azarAldea } from './aldea-arquitectura.js';
import { texturaCartas } from './vegetacion.js';
import { materialVegetal, U } from './materiales.js';
import { registrarLuz, olvidarLuz } from './luces.js';
import { armarTerreno } from './terreno.js';

// (3.6 (optimizar): `suave01` es el de aldea.js; el azar con semilla y el paso de un edificio al mundo,
// los de aldea-arquitectura.js)

// a cuántos metros se ve lo de adentro, las hojas de las puertas y las sombras
export const VER_ADENTRO_ALDEA = 25;
export const VER_PUERTAS_ALDEA = 80;
export const SOMBRA_ALDEA = 60;
// cuánto más que la planta se empareja (en el marco de cada edificio, la puerta en +Z): la galería,
// el horno o la leña del costado, los materiales de la obra y el frente hasta la vereda
export const MARGEN_EMPAREJAR = { lado: 2.2, atras: 2.1, frente: 3.2 };

// ---------------------------------------------------------------- el terreno (puro)
function rectEdificio(id) {
  const e = EDIFICIOS_ALDEA[id];
  // (al menos 2 m, una celda del terreno: así toda la planta cae entre puntos emparejados del todo)
  const mg = e.estructura || e.rol === 'plaza' ? { lado: 2.1, atras: 2.1, frente: 2.1 } : MARGEN_EMPAREJAR;
  return { x0: -e.ancho / 2 - mg.lado, x1: e.ancho / 2 + mg.lado, z0: -e.fondo / 2 - mg.atras, z1: e.fondo / 2 + mg.frente };
}
// Lo que se empareja: cada edificio (menos la estación, que arma trochita.js) a la altura de su
// piso (la de la tabla de aldea.js: la media del terreno en la planta), con el borde de `zonasAldea`.
export function zonasEmparejar(parada = PARADA_ALDEA) {
  return zonasAldea(parada).filter((z) => z.emparejar).map((z) => ({ id: z.id, x: z.x, z: z.z, rot: z.rot, altura: z.altura, borde: z.borde, ...rectEdificio(z.id),
    planta: { ancho: EDIFICIOS_ALDEA[z.id].ancho, fondo: EDIFICIOS_ALDEA[z.id].fondo } }));
}
// 3.6 (detalles): las calles en el mundo, para nivelarlas (de a tramos; las largas primero).
export function callesNivelar(parada = PARADA_ALDEA) {
  const m = marcoAldea(parada), lista = [];
  const orden = [...CALLES_ALDEA].sort((a, b) => (b.ancho - a.ancho) || (b.puntos.length - a.puntos.length));
  for (const c of orden) for (let s = 0; s < c.puntos.length - 1; s++) {
    // (la de la Estación, desde el andén: el primer tramo lo arma trochita.js)
    const desde = c.id === 'calle-estacion' ? 4 : 0;
    const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1], L = Math.hypot(bx - ax, bz - az);
    const a = m.aMundo(ax + (bx - ax) * desde / L, az + (bz - az) * desde / L), b = m.aMundo(bx, bz);
    lista.push({ id: c.id, ax: a.x, az: a.z, bx: b.x, bz: b.z, medio: c.ancho / 2 });
  }
  return lista;
}
// Empareja `T.alturas` (y rehace `T.pendiente` alrededor, con la misma cuenta de terreno.js).
// Devuelve lo de antes (copias enteras: el sorteo de estructuras.js las usa) y la región tocada.
// 3.6 (detalles): y después nivela las calles (`calles`): cada una sigue el terreno, pero con su
// perfil suavizado a lo largo y pareja de lado a lado, como una calle de ripio hecha con
// máquina (antes los bordes emparejados de los lotes le armaban lomos y pozos). Las plantas no
// se tocan: a menos de un metro de una, manda la planta.
export function emparejarTerreno(T, zonas = zonasEmparejar(), calles = callesNivelar()) {
  const total = T.alturas.length, N = Math.round(Math.sqrt(total)), RES = N - 1, CEL = 1024 / RES, MIT = 512;
  const antes = { alturas: T.alturas.slice(), pendiente: T.pendiente.slice() };
  // (`ax`, `az`, `cx`, `cz`: la mitad y el centro de la planta en el marco del edificio)
  const Z = zonas.map((z) => ({ ...z, c: Math.cos(z.rot), s: Math.sin(z.rot), ax: z.planta?.ancho / 2 || 0, az: z.planta?.fondo / 2 || 0, cx: 0, cz: 0,
    frente: EDIFICIOS_ALDEA[z.id] && !EDIFICIOS_ALDEA[z.id].estructura && EDIFICIOS_ALDEA[z.id].rol !== 'plaza' ? 2.6 : 0.3 }));
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const q of Z) {
    for (const [bx, bz] of [[q.x0 - q.borde, q.z0 - q.borde], [q.x1 + q.borde, q.z0 - q.borde], [q.x0 - q.borde, q.z1 + q.borde], [q.x1 + q.borde, q.z1 + q.borde]]) {
      const wx = q.x + bx * q.c + bz * q.s, wz = q.z - bx * q.s + bz * q.c;
      x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
    }
  }
  const BORDE_CALLE = 1.8;
  if (Z.length) for (const c of calles) for (const [wx, wz] of [[c.ax, c.az], [c.bx, c.bz]]) {
    const r = c.medio + BORDE_CALLE + 0.5;
    x0 = Math.min(x0, wx - r); x1 = Math.max(x1, wx + r); z0 = Math.min(z0, wz - r); z1 = Math.max(z1, wz + r);
  }
  const cl = (v) => Math.max(0, Math.min(RES, v));
  const i0 = cl(Math.floor((x0 + MIT) / CEL)), i1 = cl(Math.ceil((x1 + MIT) / CEL));
  const j0 = cl(Math.floor((z0 + MIT) / CEL)), j1 = cl(Math.ceil((z1 + MIT) / CEL));
  let cambiadas = 0;
  if (Z.length) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const k = j * N + i, x = i * CEL - MIT, z = j * CEL - MIT;
    let wMax = 0, suma = 0, pesos = 0, propio = null, dPropio = Infinity;
    for (const q of Z) {
      const dx = x - q.x, dz = z - q.z;
      const bx = dx * q.c - dz * q.s, bz = dx * q.s + dz * q.c;
      const ox = Math.max(q.x0 - bx, 0, bx - q.x1), oz = Math.max(q.z0 - bz, 0, bz - q.z1);
      const d = Math.hypot(ox, oz);
      if (d >= q.borde) continue;
      const w = 1 - suave01(d / q.borde);
      suma += w * q.altura; pesos += w;
      if (w > wMax) wMax = w;
      // a menos de una celda de la planta de un edificio manda ese edificio (dos lotes vecinos
      // a distinta altura no se promedian encima de una planta)
      const dp = Math.hypot(Math.max(Math.abs(bx - q.cx) - q.ax, 0), Math.max(Math.abs(bz - q.cz) - q.az, 0));
      if (dp <= CEL * 1.42 && dp < dPropio) { dPropio = dp; propio = q; }
    }
    if (propio) { wMax = 1; suma = propio.altura; pesos = 1; }
    if (wMax <= 0) continue;
    const orig = antes.alturas[k];
    T.alturas[k] = orig + (suma / pesos - orig) * wMax;
    cambiadas++;
  }
  // las calles: el perfil (cada metro, del terreno ya emparejado) suavizado dos veces con una
  // ventana de ±6 m; de lado a lado, pareja hasta el borde y se funde en 1,8 m más
  const hechas = [];
  if (Z.length) for (const c of calles) {
    const L = Math.hypot(c.bx - c.ax, c.bz - c.az), ux = (c.bx - c.ax) / L, uz = (c.bz - c.az) / L, n = Math.max(2, Math.ceil(L));
    const alturaGrilla = (x, z) => {
      const fx = Math.max(0, Math.min(RES - 1e-6, (x + MIT) / CEL)), fz = Math.max(0, Math.min(RES - 1e-6, (z + MIT) / CEL));
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, A = T.alturas;
      return (A[j * N + i] * (1 - u) + A[j * N + i + 1] * u) * (1 - v) + (A[(j + 1) * N + i] * (1 - u) + A[(j + 1) * N + i + 1] * u) * v;
    };
    const crudo = Float64Array.from({ length: n + 1 }, (_, k) => alturaGrilla(c.ax + ux * L * k / n, c.az + uz * L * k / n));
    let perfil = crudo;
    for (let pasada = 0; pasada < 2; pasada++) {
      const otro = new Float64Array(n + 1);
      for (let k = 0; k <= n; k++) { let s2 = 0, w2 = 0; for (let q = Math.max(0, k - 6); q <= Math.min(n, k + 6); q++) { s2 += perfil[q]; w2++; } otro[k] = s2 / w2; }
      perfil = otro;
    }
    // en los cruces con una calle ya nivelada manda la de antes: ahí el perfil queda clavado a lo que
    // hay y se acerca de a poco (8 m), sin escalón en la esquina
    const clavado = [];
    for (let k = 0; k <= n; k++) {
      const x = c.ax + ux * L * k / n, z = c.az + uz * L * k / n;
      if (hechas.some((h) => { const ex = x - h.ax, ez = z - h.az, hl = Math.hypot(h.bx - h.ax, h.bz - h.az), t2 = (ex * (h.bx - h.ax) + ez * (h.bz - h.az)) / hl; return t2 > -0.5 && t2 < hl + 0.5 && Math.abs((-ex * (h.bz - h.az) + ez * (h.bx - h.ax)) / hl) < h.medio + 0.5; })) clavado.push(k);
    }
    if (clavado.length) {
      const fin = new Float64Array(n + 1);
      for (let k = 0; k <= n; k++) {
        let mejor = null;
        for (const q of clavado) if (!mejor || Math.abs(q - k) < Math.abs(mejor - k)) mejor = q;
        const d = Math.abs(mejor - k) * L / n, f = d < 0.01 ? 1 : Math.max(0, 1 - d / 8);
        fin[k] = perfil[k] + (crudo[mejor] - perfil[mejor]) * f;
      }
      perfil = fin;
    }
    hechas.push(c);
    const r = c.medio + BORDE_CALLE;
    const ci0 = cl(Math.floor((Math.min(c.ax, c.bx) - r + MIT) / CEL)), ci1 = cl(Math.ceil((Math.max(c.ax, c.bx) + r + MIT) / CEL));
    const cj0 = cl(Math.floor((Math.min(c.az, c.bz) - r + MIT) / CEL)), cj1 = cl(Math.ceil((Math.max(c.az, c.bz) + r + MIT) / CEL));
    for (let j = cj0; j <= cj1; j++) for (let i = ci0; i <= ci1; i++) {
      const x = i * CEL - MIT, z = j * CEL - MIT, dx = x - c.ax, dz = z - c.az;
      const t = dx * ux + dz * uz, o = Math.abs(-dx * uz + dz * ux);
      const fuera = Math.max(0, -t, t - L), d = Math.hypot(fuera, o);
      let w = 1 - suave01((d - c.medio - 0.3) / (BORDE_CALLE - 0.3));
      if (w <= 0) continue;
      // cerca de una planta (con su galería, adelante) manda la planta: la galería no queda en el aire
      let dp = Infinity;
      for (const q of Z) {
        const ex = x - q.x, ez = z - q.z, bx = ex * q.c - ez * q.s, bz = ex * q.s + ez * q.c;
        const fr = q.frente ?? 0;
        dp = Math.min(dp, Math.hypot(Math.max(Math.abs(bx) - q.ax, 0), Math.max(-q.az - bz, 0, bz - q.az - fr)));
      }
      w *= suave01((dp - 0.6) / 1.4);
      if (w <= 0) continue;
      const k = j * N + i, h = perfil[Math.max(0, Math.min(n, Math.round(Math.max(0, Math.min(L, t)) * n / L)))];
      T.alturas[k] += (h - T.alturas[k]) * w;
      cambiadas++;
    }
  }
  const A = T.alturas;
  for (let j = Math.max(0, j0 - 1); j <= Math.min(RES, j1 + 1); j++) for (let i = Math.max(0, i0 - 1); i <= Math.min(RES, i1 + 1); i++) {
    const hx = A[j * N + Math.min(RES, i + 1)] - A[j * N + Math.max(0, i - 1)];
    const hz = A[Math.min(RES, j + 1) * N + i] - A[Math.max(0, j - 1) * N + i];
    T.pendiente[j * N + i] = Math.hypot(hx, hz) / (2 * CEL);
  }
  return { antes, region: { i0, i1, j0, j1, x0, x1, z0, z1 }, cambiadas };
}
// El terreno de antes de emparejar, con las mismas consultas (para el sorteo de estructuras.js).
export function terrenoDeSorteo(T, antes) {
  return armarTerreno({ ...T, alturas: antes.alturas, pendiente: antes.pendiente, rielLargo: T.riel.largo });
}

// ---------------------------------------------------------------- qué se dibuja (puro)
// Las manzanas: entre calles (la calle de la Vía y la Norte; los pasajes y las calles de la
// Biblioteca y del Almacén). Cada una es un complejo.
export function manzanaDe(id) {
  const e = EDIFICIOS_ALDEA[id];
  if (!e || e.rol === 'estacion') return null;
  const col = e.x < -27 ? 'o2' : e.x < -8 ? 'o1' : e.x < 20 ? 'c' : e.x < 53 ? 'e1' : 'e2';
  return `${col}-${e.z < 52 ? 's' : 'n'}`;
}
// Los edificios que arma este módulo (el almacén y la casa de té los arma estructuras.js).
export const IDS_MUNDO_ALDEA = IDS_EDIFICIOS.filter((id) => EDIFICIOS_ALDEA[id].rol !== 'estacion' && !EDIFICIOS_ALDEA[id].estructura);
// La etapa de aldea-arquitectura.js para lo que dice `estadoVisual`. La escuela nunca vuelve para
// atrás: a medio hacer ya tiene paredes y techo.
export function etapaVisual(aldea, id) {
  if (!esLote(id)) return { etapa: 4, opciones: {} };
  const v = estadoVisual(aldea, id);
  if (v === 'abierto') return { etapa: 4, opciones: {} };
  // 3.6 (detalles): el lote del próximo que viene ya tiene material apilado
  if (v === 'lote') return { etapa: 0, opciones: proximoLote(aldea) === id ? { proxima: true } : {} };
  if (v === 'a-medio') return { etapa: ESCUELA_A_MEDIO_HACER, opciones: {} };
  const k = Number(String(v).split('-')[1]) || 1;
  const etapa = id === 'escuela' ? Math.max(k - 1, ESCUELA_A_MEDIO_HACER) : k - 1;
  return { etapa, opciones: { obraActiva: true } };
}
const claveVisual = (id, v) => `${id}|${v.etapa}|${v.opciones.obraActiva ? 1 : 0}${v.opciones.proxima ? '|p' : ''}`;
// El lote que se levanta después (el del que espera en el andén o el del próximo en venir), si no
// hay una obra en curso.
export function proximoLote(aldea) {
  if (!aldea || obraEnCurso(aldea)) return null;
  const quien = aldea.llegando?.clave || quienLlega(aldea);
  return quien && Object.hasOwn(LOTE_DE, quien) ? LOTE_DE[quien] : null;
}

// Lo que ocupa de verdad cada edificio (la planta y, adelante, la galería con sus escalones):
// ahí no va ningún accesorio.
function rectOcupa(id) {
  const e = EDIFICIOS_ALDEA[id];
  const frente = e.estructura || e.rol === 'plaza' ? 0.3 : 2.5;
  return { x0: -e.ancho / 2 - 0.3, x1: e.ancho / 2 + 0.3, z0: -e.fondo / 2 - 0.3, z1: e.fondo / 2 + frente };
}
// En el marco de un edificio (bx, bz) un punto del plano (lx, lz).
function aEdificio(e, lx, lz) {
  const dx = lx - e.x, dz = lz - e.z, c = Math.cos(e.rot), s = Math.sin(e.rot);
  return { bx: dx * c - dz * s, bz: dx * s + dz * c };
}
// ¿El punto del plano cae en lo que ocupa algún edificio (con margen)?
function ocupado(lx, lz, margen = 0, ignorar = null) {
  for (const id of IDS_EDIFICIOS) {
    if (id === ignorar) continue;
    const e = EDIFICIOS_ALDEA[id];
    if (e.huella) {
      if (lx > e.huella.x0 - margen && lx < e.huella.x1 + margen && lz > e.huella.z0 - margen && lz < e.huella.z1 + margen) return id;
      continue;
    }
    const r = rectOcupa(id), b = aEdificio(e, lx, lz);
    if (b.bx > r.x0 - margen && b.bx < r.x1 + margen && b.bz > r.z0 - margen && b.bz < r.z1 + margen) return id;
  }
  return null;
}
const enCalle = (lx, lz, margen = 0, menos = null) => CALLES_ALDEA.some((c) => c !== menos && distanciaACalle(lx, lz, c) < margen);
// Las puertas (en el plano): ahí no va un farol ni un cerco (por ahí sale la gente a la calle).
const PUERTAS_PLANO = IDS_EDIFICIOS.map((id) => puntosDe(id).puerta).filter(Boolean);

// 3.6 (detalles): los desniveles entre lotes vecinos. Donde dos plantas quedan a menos de 5 m una al
// lado de la otra y a más de medio metro de altura, cada una emparejada a su altura deja un escalón
// en el medio (antes, un talud brusco con el zócalo de la de arriba al aire): ahí va un murete de
// pirca de contención (al ras del lote de arriba) y, del lado de la calle, escalones de laja.
// En el plano: { a, b, eje (en qué sentido están separadas), medio, u0, u1 (a lo largo del murete),
// frente (-1: la calle queda del lado de u0), ladoAlto (+1/-1 respecto de `medio`), bajo, alto }.
export function planDesniveles() {
  const lista = [];
  const ids = IDS_EDIFICIOS.filter((id) => EDIFICIOS_ALDEA[id].rol !== 'estacion');
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const A = plantaDe(ids[i]), B = plantaDe(ids[j]), ya = EDIFICIOS_ALDEA[ids[i]].y, yb = EDIFICIOS_ALDEA[ids[j]].y;
    if (Math.abs(ya - yb) < 0.5) continue;
    const gx = Math.max(A.x0 - B.x1, B.x0 - A.x1), gz = Math.max(A.z0 - B.z1, B.z0 - A.z1);
    let eje;
    if (gx > 0 && gz < 0 && gx < 5) eje = 'x'; else if (gz > 0 && gx < 0 && gz < 5) eje = 'z'; else continue;
    const medio = eje === 'x' ? (A.x1 < B.x0 ? (A.x1 + B.x0) / 2 : (B.x1 + A.x0) / 2) : (A.z1 < B.z0 ? (A.z1 + B.z0) / 2 : (B.z1 + A.z0) / 2);
    const p = (u) => (eje === 'x' ? [medio, u] : [u, medio]);
    let u0 = (eje === 'x' ? Math.min(A.z0, B.z0) : Math.min(A.x0, B.x0)) - 1.5;
    let u1 = (eje === 'x' ? Math.max(A.z1, B.z1) : Math.max(A.x1, B.x1)) + 1.5;
    const dCalle = (u) => { const [lx, lz] = p(u); return Math.min(...CALLES_ALDEA.map((c) => distanciaACalle(lx, lz, c))); };
    while (u1 - u0 > 2 && dCalle(u0) < 0.6) u0 += 0.25;
    while (u1 - u0 > 2 && dCalle(u1) < 0.6) u1 -= 0.25;
    if (u1 - u0 < 3) continue;
    const alta = ya > yb ? A : B;
    const ladoAlto = Math.sign((eje === 'x' ? (alta.x0 + alta.x1) / 2 : (alta.z0 + alta.z1) / 2) - medio);
    lista.push({ a: ids[i], b: ids[j], eje, medio, u0, u1, frente: dCalle(u0) <= dCalle(u1) ? -1 : 1, ladoAlto, bajo: Math.min(ya, yb), alto: Math.max(ya, yb) });
  }
  return lista;
}
export const ALTO_MURETE = 1.45;
// ¿El punto del plano cae sobre un murete (con margen)?
function sobreMurete(lx, lz, margen, desniveles) {
  return desniveles.some((d) => {
    const [a, u] = d.eje === 'x' ? [lx, lz] : [lz, lx];
    return Math.abs(a - d.medio) < margen && u > d.u0 - margen && u < d.u1 + margen;
  });
}

// Los accesorios de la aldea, en el plano: { tipo, lx, lz, giro, largo }. Siempre los mismos.
// (`especial`: armado con otras medidas que el de su tipo; `yFijo`: a esa altura, sin inclinarse)
export function planAccesorios() {
  const lista = [];
  const desniveles = planDesniveles();
  // 3.6 (detalles): los muretes y sus escalones
  for (const d of desniveles) {
    const ESC = 1.3, sube = d.alto - d.bajo, n = Math.max(2, Math.round(sube / 0.19)), largoEsc = n * 0.32;
    const p = (a, u) => (d.eje === 'x' ? [a, u] : [u, a]);
    // el murete, de la escalera al fondo, en tramos de unos 2,5 m
    const ua = d.frente < 0 ? d.u0 + ESC + 0.25 : d.u0, ub = d.frente < 0 ? d.u1 : d.u1 - ESC - 0.25, L = ub - ua, k = Math.max(1, Math.round(L / 2.5));
    for (let i = 0; i < k; i++) {
      const [lx, lz] = p(d.medio, ua + (i + 0.5) * L / k);
      lista.push({ tipo: 'murete', lx, lz, giro: d.eje === 'x' ? -Math.PI / 2 : 0, largo: L / k, yFijo: d.alto + 0.12 - ALTO_MURETE, desnivel: `${d.a}|${d.b}` });
    }
    // los escalones: del lado bajo al alto, cruzando la línea del murete, junto a la calle
    const uE = d.frente < 0 ? d.u0 + ESC / 2 + 0.1 : d.u1 - ESC / 2 - 0.1;
    const [lx, lz] = p(d.medio - d.ladoAlto * largoEsc / 2, uE);
    const giro = d.eje === 'x' ? (d.ladoAlto > 0 ? 0 : Math.PI) : -Math.PI / 2 * d.ladoAlto;
    lista.push({ tipo: 'escalones', lx, lz, giro, yFijo: d.bajo, desnivel: `${d.a}|${d.b}`,
      especial: { clave: `escalones|${sube.toFixed(2)}`, nombre: 'escalones', opciones: { alto: +sube.toFixed(2), ancho: ESC } } });
  }
  // de un solo lado de cada calle: en las dos largas (la de la Vía y la Norte), postes de luz
  // cada 21 m con los cables de poste a poste; en las demás, faroles cada 12 m
  CALLES_ALDEA.forEach((c, ic) => {
    if (c.id === 'calle-estacion') return;   // ahí van las veredas y los faroles de la estación
    const lado = ic % 2 ? -1 : 1;
    const postes = c.id === 'calle-via' || c.id === 'calle-norte';
    for (let s = 0; s < c.puntos.length - 1; s++) {
      const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1];
      const largo = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / largo, uz = (bz - az) / largo;
      const off = c.ancho / 2 + (postes ? 0.9 : 0.7);
      for (let t = 6; t < largo - 2; t += postes ? 21 : 12) {
        const lx = ax + ux * t - uz * off * lado, lz = az + uz * t + ux * off * lado;
        if (lz < 13 || enCalle(lx, lz, 2, c) || ocupado(lx, lz, 0.8)) continue;
        if (PUERTAS_PLANO.some((p) => Math.abs((p.x - ax) * ux + (p.z - az) * uz - t) < 2.4 && Math.abs((p.x - ax) * -uz + (p.z - az) * ux) < 9)) continue;
        // (el poste lleva su z a lo largo de la calle: los cables van de punta a punta)
        lista.push(postes ? { tipo: 'poste', lx, lz, giro: Math.atan2(ux, uz), linea: `${c.id}|${s}` } : { tipo: 'farol', lx, lz, giro: 0 });
      }
    }
  });
  // veredas de tablas: a los dos lados de la calle de la Estación (del andén a la calle de la Vía)
  {
    const c = CALLES_ALDEA.find((x) => x.id === 'calle-estacion');
    if (c) {
      const [[ax, az], [bx, bz]] = c.puntos, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (const lado of [-1, 1]) for (let t = 2.5; t + 1.5 <= L - 3.4; t += 3) {
        const off = c.ancho / 2 + 0.75, lx = ax + ux * (t + 1.5) - uz * off * lado, lz = az + uz * (t + 1.5) + ux * off * lado;
        if (ocupado(lx, lz, 0.2)) continue;
        lista.push({ tipo: 'vereda', lx, lz, giro: Math.atan2(ux, uz) - Math.PI / 2, largo: 3 });
      }
    }
  }
  // y entre la calle y el frente de los edificios que tienen lugar (los demás llegan a la calle
  // con su galería)
  for (const id of IDS_EDIFICIOS) {
    const e = EDIFICIOS_ALDEA[id];
    if (!e.calle || e.estructura || e.rol === 'estacion') continue;
    const c = CALLES_ALDEA.find((x) => x.id === e.calle);
    if (!c) continue;
    // el tramo de la calle que pasa por delante
    let mejor = null;
    for (let s = 0; s < c.puntos.length - 1; s++) {
      const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1];
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const t = (e.x - ax) * ux + (e.z - az) * uz;
      if (t < 0 || t > L) continue;
      const d = (e.x - ax) * -uz + (e.z - az) * ux;
      if (!mejor || Math.abs(d) < Math.abs(mejor.d)) mejor = { ax, az, ux, uz, t, d };
    }
    if (!mejor) continue;
    const hueco = Math.abs(mejor.d) - e.fondo / 2 - c.ancho / 2;
    if (hueco < (e.rol === 'plaza' ? 1.1 : 2.4) + 1.4) continue;   // la galería y los escalones ya llegan a la calle
    const signo = Math.sign(mejor.d) || 1;
    const off = c.ancho / 2 + 0.75;
    const ancho = e.ancho + 1;
    const n = Math.max(1, Math.round(ancho / 3));
    for (let k = 0; k < n; k++) {
      const t = mejor.t - ancho / 2 + (k + 0.5) * (ancho / n);
      const lx = mejor.ax + mejor.ux * t - mejor.uz * off * signo, lz = mejor.az + mejor.uz * t + mejor.ux * off * signo;
      if (enCalle(lx, lz, 0.3, c) || ocupado(lx, lz, 0.1)) continue;
      lista.push({ tipo: 'vereda', lx, lz, giro: Math.atan2(mejor.ux, mejor.uz) - Math.PI / 2, largo: ancho / n, id });
    }
  }
  // cercos de palo atrás de las casas
  for (const id of IDS_EDIFICIOS) {
    const e = EDIFICIOS_ALDEA[id];
    if (e.rol !== 'casa') continue;
    const W = e.ancho / 2 + 1.9, zb = -e.fondo / 2 - 2.6, zf = -e.fondo / 2 + 0.2;
    const tramos = [[-W, zb, W, zb], [-W, zb, -W, zf], [W, zb, W, zf]];
    for (const [ax, az, bx, bz] of tramos) {
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 3));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const mx = ax + (bx - ax) * (t0 + t1) / 2, mz = az + (bz - az) * (t0 + t1) / 2;
        const c = Math.cos(e.rot), s = Math.sin(e.rot);
        const lx = e.x + mx * c + mz * s, lz = e.z - mx * s + mz * c;
        if (enCalle(lx, lz, 0.8) || ocupado(lx, lz, 0.2, id) || sobreMurete(lx, lz, 0.9, desniveles)) continue;
        lista.push({ tipo: 'cerco', lx, lz, giro: e.rot + Math.atan2(bx - ax, bz - az) - Math.PI / 2, largo: L / n });
      }
    }
  }
  // 3.6 (detalles): el fondo de los lotes y el borde de la aldea, que no sea un corte: un frutal
  // viejo en el patio de cada casa, cercos de palo atrás de los locales de la orilla y arbustos
  // (calafate, rosa mosqueta) entre los álamos y junto a las pircas
  const azarPlano = (x, z) => { const v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };
  let nFrutal = 0;
  for (const id of IDS_EDIFICIOS) {
    const e = EDIFICIOS_ALDEA[id];
    if (e.rol !== 'casa') continue;
    const c = Math.cos(e.rot), s = Math.sin(e.rot), bx = -(e.lado || 1) * (e.ancho / 2 - 0.5), bz = -e.fondo / 2 - 2.0;
    const lx = e.x + bx * c + bz * s, lz = e.z - bx * s + bz * c;
    if (enCalle(lx, lz, 2) || ocupado(lx, lz, 0.6, id) || sobreMurete(lx, lz, 1.6, desniveles)) continue;
    const k = 1 + (nFrutal++ % 3);
    lista.push({ tipo: 'frutal', lx, lz, giro: azarPlano(lx, lz) * 6.283, especial: { clave: `frutal|${k}`, nombre: 'frutal', opciones: { semilla: k } } });
  }
  [['herreria', 'cerco-pique'], ['pescaderia', 'cerco'], ['sala-miel', 'cerco-pique'], ['hilanderia', 'cerco'], ['salon', 'cerco-pique']].forEach(([id, tipo]) => {
    const e = EDIFICIOS_ALDEA[id], c = Math.cos(e.rot), s = Math.sin(e.rot), zb = -e.fondo / 2 - 2.4, W = e.ancho / 2 + 1.0;
    const n = Math.max(1, Math.round((2 * W) / 3));
    for (let k = 0; k < n; k++) {
      const mx = -W + (k + 0.5) * (2 * W / n), lx = e.x + mx * c + zb * s, lz = e.z - mx * s + zb * c;
      if (enCalle(lx, lz, 0.8) || ocupado(lx, lz, 0.3, id) || sobreMurete(lx, lz, 0.9, desniveles)) continue;
      lista.push({ tipo, lx, lz, giro: e.rot, largo: 2 * W / n });
    }
  });
  const bordes = [];
  for (let x = -42.5; x <= 84.5; x += 7) bordes.push([x, 90, 0]);
  for (let z = 37.5; z <= 77.5; z += 7) bordes.push([-54.6, z, 1]);
  for (let z = 37.5; z <= 70.5; z += 7) bordes.push([98.6, z, 2]);
  for (let x = -40; x <= 10; x += 8.5) bordes.push([x, 83.6, 3]);
  for (let z = 33; z <= 63; z += 8.5) bordes.push([93.6, z, 4]);
  bordes.forEach(([lx, lz, g], i) => {
    if (azarPlano(lx + g, lz) < 0.4 || enCalle(lx, lz, 2) || ocupado(lx, lz, 1.2)) return;
    const k = 1 + (i % 4);
    lista.push({ tipo: 'arbusto', lx, lz, giro: azarPlano(lz, lx) * 6.283, especial: { clave: `arbusto|${k}`, nombre: 'arbusto', opciones: { semilla: k, flores: k % 2 === 0 } } });
  });
  // pircas: al fondo de la aldea, detrás de la escuela y las casas del oeste, y al este
  for (const [ax, az, bx, bz] of [[-44, 82, 14, 82], [92, 30, 92, 66]]) {
    const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 2.5);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, lx = ax + (bx - ax) * t, lz = az + (bz - az) * t;
      if (enCalle(lx, lz, 0.8) || ocupado(lx, lz, 0.3)) continue;
      lista.push({ tipo: 'pirca', lx, lz, giro: Math.atan2(bx - ax, bz - az) - Math.PI / 2, largo: L / n });
    }
  }
  // álamos cortaviento: una hilera al fondo y otra del lado del bosque
  const alamos = [];
  for (let x = -46; x <= 88; x += 7) alamos.push([x, 88.5]);
  for (let z = 34; z <= 81; z += 7) alamos.push([-53, z]);
  for (let z = 34; z <= 74; z += 7) alamos.push([97, z]);
  alamos.forEach(([lx, lz], i) => {
    if (enCalle(lx, lz, 2) || ocupado(lx, lz, 1.5)) return;
    lista.push({ tipo: 'alamo', lx, lz, giro: (i * 2.39996) % (Math.PI * 2), escala: 0.88 + ((i * 7919) % 25) / 100 });
  });
  return lista;
}

// ---------------------------------------------------------------- el Worker que arma la geometría
// (se pasa como texto al Worker: no puede usar nada de afuera de la función)
function armarSegun(A, p) {
  if (p.tipo === 'edificio') return A.armarEdificio(p.id, p.etapa, p.opciones || {});
  if (p.tipo === 'accesorio') return A.armarAccesorio(p.nombre, p.opciones || {});
  if (p.tipo === 'estacion') return A.armarAgregadoEstacion(p.opciones || {});
  throw new Error('pedido desconocido: ' + p.tipo);
}
// Las geometrías viajan como arreglos (transferidos, sin copiar); lo demás, como está.
function empacarAldea(v, transfer) {
  if (v === null || typeof v !== 'object') return v;
  if (v.isBufferGeometry) {
    const attrs = {};
    for (const k of Object.keys(v.attributes)) {
      const a = v.attributes[k];
      attrs[k] = { array: a.array, itemSize: a.itemSize, normalized: !!a.normalized };
      transfer.add(a.array.buffer);
    }
    const index = v.index ? v.index.array : null;
    if (index) transfer.add(index.buffer);
    return { __geo: 1, attrs, index };
  }
  if (ArrayBuffer.isView(v)) return v;
  if (Array.isArray(v)) return v.map((x) => empacarAldea(x, transfer));
  const o = {};
  for (const k of Object.keys(v)) o[k] = empacarAldea(v[k], transfer);
  return o;
}
function desempacar(v) {
  if (v === null || typeof v !== 'object' || ArrayBuffer.isView(v)) return v;
  if (v.__geo) {
    const g = new THREE.BufferGeometry();
    for (const [k, a] of Object.entries(v.attrs)) g.setAttribute(k, new THREE.BufferAttribute(a.array, a.itemSize, a.normalized));
    if (v.index) g.setIndex(new THREE.BufferAttribute(v.index, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  if (Array.isArray(v)) return v.map(desempacar);
  const o = {};
  for (const k of Object.keys(v)) o[k] = desempacar(v[k]);
  return o;
}
// El código del Worker: el three y los módulos que necesita aldea-arquitectura.js, sacados del
// mismo script de la página (armar.mjs los deja como `// ===== x.js =====\nconst __mod_x = …`).
function fuenteTrabajador() {
  if (typeof document === 'undefined' || !document.scripts) return null;
  let texto = null;
  for (const s of document.scripts) {
    const t = s.textContent || '';
    if (t.includes('// ===== aldea-arquitectura.js =====') && t.includes('const THREE = (() =>')) { texto = t; break; }
  }
  if (!texto) return null;
  const primera = texto.indexOf('\n// ===== ');
  if (primera < 0) return null;
  const marcas = [];
  const re = /\n\/\/ ===== [^\n]+ =====\nconst (__mod_[A-Za-z0-9_$]+) = /g;
  let m;
  while ((m = re.exec(texto))) marcas.push({ id: m[1], desde: m.index + 1 });
  const secciones = new Map();
  marcas.forEach((k, i) => secciones.set(k.id, texto.slice(k.desde, i + 1 < marcas.length ? marcas[i + 1].desde : texto.length)));
  const hace = new Set(), pendientes = ['__mod_aldea_arquitectura'];
  while (pendientes.length) {
    const id = pendientes.pop();
    if (hace.has(id) || !secciones.has(id)) continue;
    hace.add(id);
    for (const r of secciones.get(id).matchAll(/__mod_[A-Za-z0-9_$]+/g)) if (r[0] !== id && !hace.has(r[0])) pendientes.push(r[0]);
  }
  if (!hace.has('__mod_aldea_arquitectura')) return null;
  const modulos = marcas.filter((k) => hace.has(k.id)).map((k) => secciones.get(k.id)).join('\n');
  return `${texto.slice(0, primera)}\n${modulos}\n${armarSegun.toString()}\n${empacarAldea.toString()}\n`
    + 'self.onmessage = (e) => { const { n, pedido } = e.data || {}; try { const r = armarSegun(__mod_aldea_arquitectura, pedido); const t = new Set(); const out = empacarAldea(r, t); self.postMessage({ n, r: out }, [...t]); }'
    + ' catch (err) { self.postMessage({ n, error: String((err && err.stack) || err) }); } };';
}
// Pide edificios armados: al Worker si se puede; si no (o si se rompe), en el momento.
function crearFabrica() {
  const A = { armarEdificio, armarAccesorio, armarAgregadoEstacion };
  const enElMomento = (p) => armarSegun(A, p);
  const stats = { worker: 0, momento: 0, ms: 0, errores: 0, origen: 'momento' };
  let w = null, url = null, roto = false, n = 0, ocio = null;
  const espera = new Map();
  const conWorker = () => !roto && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
  function romper() {
    roto = true;
    try { w?.terminate(); } catch { /* ya */ }
    try { if (url) URL.revokeObjectURL(url); } catch { /* ya */ }
    w = null; url = null;
    // lo que estaba esperando se arma en el momento
    for (const [k, q] of espera) { espera.delete(k); try { stats.momento++; q.ok(enElMomento(q.pedido)); } catch (err) { q.mal(err); } }
  }
  function arrancar() {
    if (w || !conWorker()) return !!w;
    try {
      const fuente = fuenteTrabajador();
      if (!fuente) { roto = true; return false; }
      url = URL.createObjectURL(new Blob([fuente], { type: 'text/javascript' }));
      w = new Worker(url);
      stats.origen = 'worker';
      w.onmessage = (e) => {
        const { n: k, r, error } = e.data || {};
        const q = espera.get(k);
        if (!q) return;
        espera.delete(k);
        stats.ms += performance.now() - q.t0;
        if (error) { stats.errores++; try { stats.momento++; q.ok(enElMomento(q.pedido)); } catch (err) { q.mal(err); } }
        else { stats.worker++; q.ok(desempacar(r)); }
        dormir();
      };
      w.onerror = (e) => { e?.preventDefault?.(); romper(); };
      return true;
    } catch { roto = true; return false; }
  }
  // sin pedidos un rato, el Worker se cierra (se vuelve a abrir si hace falta)
  function dormir() {
    clearTimeout(ocio);
    if (espera.size) return;
    ocio = setTimeout(() => { if (!espera.size && w) { try { w.terminate(); } catch { /* ya */ } try { URL.revokeObjectURL(url); } catch { /* ya */ } w = null; url = null; } }, 20000);
  }
  function pedir(pedido) {
    if (arrancar()) {
      clearTimeout(ocio);
      return new Promise((ok, mal) => {
        const k = ++n;
        espera.set(k, { ok, mal, pedido, t0: performance.now() });
        try { w.postMessage({ n: k, pedido }); } catch { romper(); }
      });
    }
    return new Promise((ok, mal) => { try { const t0 = performance.now(); const r = enElMomento(pedido); stats.ms += performance.now() - t0; stats.momento++; ok(r); } catch (err) { mal(err); } });
  }
  return { pedir, stats, pendientes: () => espera.size, cerrar: () => { clearTimeout(ocio); try { w?.terminate(); } catch { /* ya */ } w = null; } };
}

// ---------------------------------------------------------------- juntar geometrías
// Una geometría por capa con las piezas (cada una con su matriz). Devuelve también el rango de
// vértices de cada pieza: para sacarla sin rehacer lo demás se colapsan sus vértices.
function juntar(piezas) {
  if (!piezas.length) return null;
  const nombres = new Map();
  let total = 0;
  const geos = piezas.map((p) => {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    total += g.attributes.position.count;
    for (const [k, a] of Object.entries(g.attributes)) if (!nombres.has(k)) nombres.set(k, a.itemSize);
    return g;
  });
  if (!total) return null;
  const datos = {};
  for (const [k, n] of nombres) datos[k] = new Float32Array(total * n);
  const rangos = new Map();
  const nm = new THREE.Matrix3();
  let v0 = 0;
  piezas.forEach((p, ip) => {
    const g = geos[ip], cuenta = g.attributes.position.count, M = p.matriz.elements;
    nm.getNormalMatrix(p.matriz);
    const Q = nm.elements;
    // (los arreglos directo: con getX/getY/getZ el armado de una manzana tardaba cuatro veces más)
    const plano = (a) => (a && a.array instanceof Float32Array && a.itemSize === 3 && !a.isInterleavedBufferAttribute && !a.normalized ? a.array : null);
    const pa = plano(g.attributes.position), na = plano(g.attributes.normal);
    const pos = g.attributes.position, nor = g.attributes.normal;
    const P = datos.position, Nn = datos.normal;
    const m0 = M[0], m1 = M[1], m2 = M[2], m4 = M[4], m5 = M[5], m6 = M[6], m8 = M[8], m9 = M[9], m10 = M[10], m12 = M[12], m13 = M[13], m14 = M[14];
    const q0 = Q[0], q1 = Q[1], q2 = Q[2], q3 = Q[3], q4 = Q[4], q5 = Q[5], q6 = Q[6], q7 = Q[7], q8 = Q[8];
    for (let i = 0; i < cuenta; i++) {
      const i3 = i * 3, o = (v0 + i) * 3;
      const x = pa ? pa[i3] : pos.getX(i), y = pa ? pa[i3 + 1] : pos.getY(i), z = pa ? pa[i3 + 2] : pos.getZ(i);
      P[o] = m0 * x + m4 * y + m8 * z + m12;
      P[o + 1] = m1 * x + m5 * y + m9 * z + m13;
      P[o + 2] = m2 * x + m6 * y + m10 * z + m14;
      if (nor && Nn) {
        const a = na ? na[i3] : nor.getX(i), b = na ? na[i3 + 1] : nor.getY(i), c = na ? na[i3 + 2] : nor.getZ(i);
        const nx = q0 * a + q3 * b + q6 * c, ny = q1 * a + q4 * b + q7 * c, nz = q2 * a + q5 * b + q8 * c;
        const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        Nn[o] = nx / l; Nn[o + 1] = ny / l; Nn[o + 2] = nz / l;
      }
    }
    for (const [k, n] of nombres) {
      if (k === 'position' || k === 'normal') continue;
      const a = g.attributes[k];
      if (!a) continue;
      if (a.array instanceof Float32Array && !a.normalized && a.itemSize === n) datos[k].set(a.array.subarray(0, cuenta * n), v0 * n);
      else for (let i = 0; i < cuenta; i++) for (let c = 0; c < n; c++) datos[k][(v0 + i) * n + c] = a.getComponent(i, c);
    }
    rangos.set(p.clave, { desde: v0, cuenta });
    v0 += cuenta;
  });
  const geo = new THREE.BufferGeometry();
  for (const [k, n] of nombres) geo.setAttribute(k, new THREE.BufferAttribute(datos[k], n));
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  return { geo, rangos };
}
// Saca una pieza de una geometría juntada: sus triángulos quedan en un punto (no se dibujan).
function colapsar(geo, r) {
  const p = geo.attributes.position, a = p.array, o = r.desde * 3;
  for (let i = 1; i < r.cuenta; i++) { a[o + i * 3] = a[o]; a[o + i * 3 + 1] = a[o + 1]; a[o + i * 3 + 2] = a[o + 2]; }
  p.addUpdateRange?.(o, r.cuenta * 3);
  p.needsUpdate = true;
}
// (`s.incl`: lo que se inclina a lo largo de su x para seguir la pendiente: veredas, cercos, pircas)
const matrizSitio = (s, origen, escalaX = 1, escala = 1) => new THREE.Matrix4().compose(
  new THREE.Vector3(s.x - origen.x, s.y - origen.y, s.z - origen.z),
  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rot || 0)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), s.incl || 0)),
  new THREE.Vector3(escalaX * escala, escala, escala));
const trisDe = (g) => (g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0);

// ---------------------------------------------------------------- texturas (una vez, en la carga)
const azarSemilla = azarAldea;
// Una textura de píxeles armados a mano (sin lienzo: dibujar en un canvas y leerlo costaba
// 150 ms en la carga). Con mipmaps: se ve de lejos sin brillos.
function texturaDe(datos, ancho, alto) {
  const t = new THREE.DataTexture(datos, ancho, alto);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = 1006; t.minFilter = 1008;   // Linear, LinearMipmapLinear
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// 3.6 (detalles): un ruido de valores con semilla, propio (no el de ruido.js). `periodo`: se repite
// cada tantas celdas (para las texturas que se embaldosan sin costura).
function ruidoValor(semilla, periodo = 0) {
  const h = (i, j) => {
    if (periodo) { i = ((i % periodo) + periodo) % periodo; j = ((j % periodo) + periodo) % periodo; }
    let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(semilla, 982451653);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
// 3.6 (detalles): el ripio, de cerca. Una baldosa de 2,2 m sin costura: arena y tierra fina de
// fondo y piedritas de tres tamaños (de 1 a 9 cm), cada una con su color (basalto, granito, canto
// rodado rojizo), su lado de luz y su sombrita. El alfa es la altura (las piedras arriba, la arena
// abajo): con eso el agua llena los huecos, el pasto sale entre las piedras y las dos escalas del
// shader se mezclan sin fantasmas. Se lee dos veces con escala y giro distintos: no se repite.
// (La baldosa mide 1,6 m: de 1 a 7 cm las piedras, como un ripio de cantera y no un canto rodado.)
function texturaGrava() {
  const N = 256, d = new Uint8Array(N * N * 4), alto = new Float32Array(N * N), r = azarSemilla(36037);
  const n1 = ruidoValor(11, 8), n2 = ruidoValor(12, 32);
  const fondo = [hexRGB('#8a7e6a'), hexRGB('#7d7262'), hexRGB('#948670')];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, m = n1(i / 32, j / 32), f = n2(i / 8, j / 8);
    const a = fondo[0], b = m < 0.5 ? fondo[1] : fondo[2], t = Math.abs(m - 0.5) * 2;
    const g = 0.9 + 0.2 * f + (r() - 0.5) * 0.1;
    d[k * 4] = (a[0] + (b[0] - a[0]) * t) * g; d[k * 4 + 1] = (a[1] + (b[1] - a[1]) * t) * g; d[k * 4 + 2] = (a[2] + (b[2] - a[2]) * t) * g;
    alto[k] = 0.18 + 0.12 * f;
  }
  const colores = ['#9b958a', '#868079', '#a99d86', '#76716a', '#8f8270', '#ada38e', '#7c6f61', '#9c8572', '#6c6761', '#b2a892'].map(hexRGB);
  const piedra = (cx, cy, rad, col) => {
    const ang = r() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang), asp = 0.6 + r() * 0.4, rel = 0.7 + r() * 0.3;
    const R = Math.ceil(rad) + 2;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const u = (x * ca + y * sa) / rad, v = (-x * sa + y * ca) / (rad * asp), q = u * u + v * v;
      const px = (((Math.round(cx) + x) % N) + N) % N, py = (((Math.round(cy) + y) % N) + N) % N, k = py * N + px;
      if (q > 1) {
        // la sombrita de contacto (abajo a la derecha, lejos de la luz)
        const us = ((x - 1.2) * ca + (y - 1.2) * sa) / rad, vs = (-(x - 1.2) * sa + (y - 1.2) * ca) / (rad * asp);
        if (us * us + vs * vs < 1.15 && alto[k] < 0.5) { d[k * 4] *= 0.87; d[k * 4 + 1] *= 0.87; d[k * 4 + 2] *= 0.86; }
        continue;
      }
      const h = 0.55 + 0.45 * Math.sqrt(1 - q) * rel;
      if (h <= alto[k]) continue;
      alto[k] = h;
      // de arriba a la izquierda viene la luz; el borde, más oscuro
      const luz = 0.92 + 0.16 * Math.max(-1, Math.min(1, (-x - y) / (rad * 1.4))) - 0.1 * q * q + (r() - 0.5) * 0.05;
      d[k * 4] = Math.min(255, col[0] * luz); d[k * 4 + 1] = Math.min(255, col[1] * luz); d[k * 4 + 2] = Math.min(255, col[2] * luz);
    }
  };
  for (const [n, r0, r1] of [[60, 3.5, 5.5], [420, 2, 3.5], [1700, 1, 2]]) for (let s = 0; s < n; s++) piedra(r() * N, r() * N, r0 + r() * (r1 - r0), colores[(r() * colores.length) | 0]);
  for (let k = 0; k < N * N; k++) d[k * 4 + 3] = Math.round(255 * Math.min(1, alto[k]));
  const t = texturaDe(d, N, N);
  t.wrapS = t.wrapT = 1000;   // Repeat
  return t;
}
// 3.6 (detalles): dónde hay ripio, en el plano de la aldea (una textura de 0,25 m por píxel que cubre
// todas las calles; no se repite). R: cuánto ripio (el borde despeinado, el pasto se le mete);
// G: lo apisonado y lo hundido (las dos huellas de las ruedas, que serpentean, y los baches: ahí
// junta agua); B: el pasto ralo (el lomo del medio y los bordes); A: zonas de unos metros (más
// claro o más oscuro, cuál de las dos escalas manda, dónde se junta el agua).
export const MARCO_RIPIO = { lx0: -52, lz0: 3, ancho: 150, alto: 82, paso: 0.25 };
export function mascaraRipio(calles = CALLES_ALDEA) {
  const P = MARCO_RIPIO, W = Math.round(P.ancho / P.paso), H = Math.round(P.alto / P.paso);
  const d = new Uint8Array(W * H * 4), escrito = new Uint8Array(W * H), r = azarSemilla(36038);
  const nb = ruidoValor(21), nb2 = ruidoValor(22), nz = ruidoValor(23), nh = ruidoValor(24), np = ruidoValor(25);
  // cada tramo: punta, dirección, largo, medio ancho, cuánto se usa y las huellas
  const tramos = [];
  for (const c of calles) for (let s = 0; s < c.puntos.length - 1; s++) {
    const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1], L = Math.hypot(bx - ax, bz - az);
    tramos.push({ ax, az, ux: (bx - ax) / L, uz: (bz - az) / L, L, m: c.ancho / 2, uso: c.id === 'calle-via' || c.id === 'calle-norte' ? 1 : c.ancho < 5 ? 0.6 : 0.8, fase: r() * 10, separa: c.ancho < 5 ? 0.72 : 0.82 });
  }
  // los baches: unos por tramo, fuera de las huellas (cada tramo mira sólo los suyos)
  for (const t of tramos) {
    t.baches = [];
    for (let k = 0; k < Math.round(t.L / 10); k++) {
      const s = 3 + r() * (t.L - 6), o = (r() - 0.5) * (t.m * 2 - 1.4);
      t.baches.push({ x: t.ax + t.ux * s - t.uz * o, z: t.az + t.uz * s + t.ux * o, ux: t.ux, uz: t.uz, a: 0.45 + r() * 0.5, b: 0.3 + r() * 0.25 });
    }
  }
  for (const t of tramos) {
    const x0 = Math.min(t.ax, t.ax + t.ux * t.L) - t.m - 1.5, x1 = Math.max(t.ax, t.ax + t.ux * t.L) + t.m + 1.5;
    const z0 = Math.min(t.az, t.az + t.uz * t.L) - t.m - 1.5, z1 = Math.max(t.az, t.az + t.uz * t.L) + t.m + 1.5;
    const i0 = Math.max(0, Math.floor((x0 - P.lx0) / P.paso)), i1 = Math.min(W - 1, Math.ceil((x1 - P.lx0) / P.paso));
    const j0 = Math.max(0, Math.floor((z0 - P.lz0) / P.paso)), j1 = Math.min(H - 1, Math.ceil((z1 - P.lz0) / P.paso));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const lx = P.lx0 + (i + 0.5) * P.paso, lz = P.lz0 + (j + 0.5) * P.paso;
      const dx = lx - t.ax, dz = lz - t.az, s = dx * t.ux + dz * t.uz, o = -dx * t.uz + dz * t.ux;
      const fuera = Math.max(0, -s, s - t.L), borde = Math.hypot(fuera, Math.abs(o)) - t.m;
      // el borde despeinado: dos ondas de ruido (2,5 m y 0,7 m); (lo que ni con el ruido llega, ni se
      // calcula: el ruido mueve el borde medio metro como mucho)
      if (borde > 0.65) continue;
      const desp = borde < -0.8 ? 0 : (nb(lx * 0.4, lz * 0.4) - 0.5) * 0.7 + (nb2(lx * 1.4, lz * 1.4) - 0.5) * 0.3;
      const cub = suave01((0.15 - (borde + desp)) / 0.45);
      if (cub <= 0) continue;
      const k = (j * W + i) * 4;
      // las huellas: serpentean despacio; se pierden en los cruces y en las puntas
      const sc = Math.min(Math.max(0, Math.min(s, t.L - s)) / 3, 1);
      const sv = 0.22 * Math.sin(s * 0.061 + t.fase) + 0.09 * Math.sin(s * 0.23 + t.fase * 2.1);
      const dh = Math.min(Math.abs(o - sv - t.separa), Math.abs(o - sv + t.separa));
      const enHuella = dh < 0.34 && sc > 0;
      const huella = enHuella ? suave01((0.34 - dh) / 0.22) * t.uso * sc * (0.75 + 0.25 * nh(lx * 0.3, lz * 0.3)) : 0;
      // (qué tan hundida está la huella: cambia cada uno o dos metros; ahí, y en los baches, el agua)
      const hondo = enHuella ? 0.45 + 0.45 * nh(lx * 0.85 + 11, lz * 0.85 - 4) : 0;
      // el lomo del medio (entre las huellas) y los bordes: pasto ralo
      const enLomo = Math.abs(o - sv) < 0.4 && sc > 0;
      const lomo = enLomo ? suave01((0.4 - Math.abs(o - sv)) / 0.3) * sc * (0.35 + 0.65 * np(lx * 0.5, lz * 0.5)) : 0;
      const orilla = borde > -0.95 ? suave01((borde + 0.95) / 0.9) * (0.4 + 0.6 * np(lx * 0.8 + 7, lz * 0.8)) : 0;
      const pasto = Math.max(lomo * (1.1 - t.uso * 0.4), orilla) * (1 - huella);
      let hundido = huella * hondo;
      for (const b of t.baches) {
        const bx = lx - b.x, bz = lz - b.z;
        if (Math.abs(bx) > 1.4 || Math.abs(bz) > 1.4) continue;
        const u = (bx * b.ux + bz * b.uz) / b.a, v = (-bx * b.uz + bz * b.ux) / b.b;
        hundido = Math.max(hundido, suave01((1 - Math.hypot(u, v)) / 0.5));
      }
      const zona = nz(lx * 0.16, lz * 0.16) * 0.75 + nz(lx * 0.5 + 3, lz * 0.5) * 0.25;
      d[k] = Math.max(d[k], Math.round(255 * cub));
      d[k + 1] = Math.max(d[k + 1], Math.round(255 * hundido));
      // (en un cruce, el pasto es el de la calle que menos tiene: por ahí pasan todos)
      d[k + 2] = escrito[k >> 2] ? Math.min(d[k + 2], Math.round(255 * pasto)) : Math.round(255 * pasto);
      escrito[k >> 2] = 1;
      d[k + 3] = Math.round(255 * zona);
    }
  }
  const t = new THREE.DataTexture(d, W, H);
  t.magFilter = 1006; t.minFilter = 1008; t.generateMipmaps = true; t.needsUpdate = true;
  return { tex: t, ...P, W, H, datos: d };
}
// 3.6 (detalles): el material del ripio. Un Lambert (la luz, las sombras y la niebla de siempre)
// que arma el color en el fragmento: la grava en dos escalas giradas que se mezclan por altura
// (las piedras de una tapan la arena de la otra, sin fantasmas) y por zonas de la máscara; las
// huellas apisonadas y más oscuras; el pasto ralo entre las piedras del lomo y de los bordes; el
// suelo mojado más oscuro y, con `uMojado` (lo que dejó la última lluvia), charcos en las huellas
// y en los baches que devuelven el cielo y el sol; la nieve y la escarcha encima (en las huellas,
// barro). Un programa más: se compila en la carga con las semillas.
const GLSL_RIPIO_PARS = /* glsl */`
  uniform sampler2D uGravaR; uniform sampler2D uMascaraR; uniform vec4 uMarcoR;
  uniform float uMojadoR; uniform float uInviernoR; uniform float uEscarchaR; uniform float uOtonoR; uniform float uNocheR;
  uniform vec3 uSolDirR; uniform vec3 uSolColorR; uniform vec3 uCieloR;
  varying vec2 vLocR; varying vec3 vMundoR;
  float charcoR = 0.0;
`;
const GLSL_RIPIO_COLOR = /* glsl */`
  {
    vec4 mk = texture2D(uMascaraR, (vLocR - uMarcoR.xy) * uMarcoR.zw);
    vec4 g1 = texture2D(uGravaR, vLocR * 0.62);
    vec4 g2 = texture2D(uGravaR, mat2(0.788, -0.616, 0.616, 0.788) * vLocR * 0.41 + vec2(0.31, 0.67));
    float wz = clamp(mk.a * 1.8 - 0.4, 0.0, 1.0);
    float w1 = g1.a + 1.0 - wz, w2 = g2.a + wz, mx = max(w1, w2) - 0.22;
    float b1 = max(w1 - mx, 0.0), b2 = max(w2 - mx, 0.0);
    vec4 g = (g1 * b1 + g2 * b2) / max(b1 + b2, 1e-4);
    float hundido = mk.g, pasto = mk.b;
    vec3 col = g.rgb * mix(0.84, 1.1, mk.a);
    // lo apisonado: la piedra hundida en la tierra, más oscura y pareja
    float huella = smoothstep(0.05, 0.7, hundido);
    float lum = dot(col, vec3(0.3, 0.55, 0.15));
    col = mix(col, vec3(lum) * vec3(1.03, 0.96, 0.86) * 0.7, huella * 0.75);
    // el pasto ralo: matas entre las piedras
    float mata = smoothstep(0.42, 0.7, pasto + (0.42 - g.a) * 0.9 + (g2.r - 0.45) * 0.4);
    vec3 cPasto = mix(vec3(0.075, 0.13, 0.035), vec3(0.17, 0.2, 0.06), g1.g * 1.6);
    cPasto = mix(cPasto, vec3(0.3, 0.22, 0.07), uOtonoR * 0.6);
    col = mix(col, cPasto, mata * 0.9);
    // mojado (lo que dejó la lluvia): todo más oscuro, y los charcos donde la tierra está hundida
    col *= 1.0 - 0.3 * uMojadoR * (1.0 - mata * 0.5);
    charcoR = uMojadoR * smoothstep(0.6, 0.82, hundido + (0.45 - g.a) * 0.4 + (mk.a - 0.5) * 0.3) * (1.0 - uInviernoR);
    col = mix(col, col * 0.35, charcoR);
    // la nieve (en las huellas queda barro) y la escarcha de la mañana
    float nieve = uInviernoR * (1.0 - 0.6 * huella) * smoothstep(-0.1, 0.35, g.a);
    col = mix(col, vec3(0.83, 0.86, 0.91) * (0.93 + 0.07 * g.a), nieve);
    col = mix(col, vec3(0.78, 0.82, 0.88), uEscarchaR * 0.4 * g.a * (1.0 - uInviernoR));
    diffuseColor.rgb = col;
    // el borde: la arena se va antes que las piedras
    float cub = mk.r;
    diffuseColor.a = clamp(cub * 1.35 - 0.12 + (g.a - 0.45) * 0.7 * (1.0 - cub), 0.0, 1.0);
    if (diffuseColor.a < 0.01) discard;
  }
`;
const GLSL_RIPIO_BRILLO = /* glsl */`
  if (charcoR > 0.01) {
    vec3 vdR = normalize(cameraPosition - vMundoR);
    float frR = 0.05 + 0.95 * pow(1.0 - clamp(vdR.y, 0.0, 1.0), 5.0);
    vec3 reR = reflect(-vdR, vec3(0.0, 1.0, 0.0));
    float solR = pow(max(dot(reR, normalize(uSolDirR)), 0.0), 140.0);
    // (de noche el cielo que devuelve es oscuro: no una raya clara en la calle)
    outgoingLight = mix(outgoingLight, uCieloR * mix(0.8, 0.12, uNocheR), clamp(0.2 + frR, 0.0, 1.0) * charcoR * 0.85) + uSolColorR * solR * 3.0 * charcoR;
  }
`;
function materialRipio(grava, mascara) {
  const m = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const propios = { uGravaR: { value: grava }, uMascaraR: { value: mascara.tex }, uMarcoR: { value: { x: mascara.lx0, y: mascara.lz0, z: 1 / mascara.ancho, w: 1 / mascara.alto } } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, propios, { uMojadoR: U.uMojado, uInviernoR: U.uInvierno, uEscarchaR: U.uEscarcha, uOtonoR: U.uOtono, uNocheR: U.uNoche, uSolDirR: U.uSolDir, uSolColorR: U.uSolColor, uCieloR: U.uCieloBajo });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aLocalR; varying vec2 vLocR; varying vec3 vMundoR;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocR = aLocalR; vMundoR = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_RIPIO_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_RIPIO_COLOR)
      .replace('#include <opaque_fragment>', GLSL_RIPIO_BRILLO + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'ripio-aldea-3.6';
  m.userData.ripio36 = true;
  return m;
}
// La mancha de luz de una ventana en el suelo: fuerte contra la pared, se abre y se apaga.
function texturaCharco() {
  const N = 64, d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, v = (j + 0.5) / N;
    const lado = Math.pow(suave01((0.5 - Math.abs(u - 0.5)) / 0.5), 1.4);
    const a = lado * Math.pow(1 - v, 2.2) * suave01(v / 0.08 + 0.3);
    const k = (j * N + i) * 4;
    d[k] = 255; d[k + 1] = 255; d[k + 2] = 255; d[k + 3] = Math.round(255 * a);
  }
  return texturaDe(d, N, N);
}
// 2.7.3 (como estructuras.js): el repaso de matrices no entra en lo apagado
function repasoSinOcultos(obj) {
  obj.updateMatrixWorld = function (forzar) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || forzar) {
      if (this.parent === null) this.matrixWorld.copy(this.matrix);
      else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      this.matrixWorldNeedsUpdate = false;
      forzar = true;
    }
    for (const h of this.children) {
      if (!h.visible) { h.__sinRepaso = true; continue; }
      if (h.__sinRepaso) { h.__sinRepaso = false; h.updateMatrixWorld(true); } else h.updateMatrixWorld(forzar);
    }
  };
}
const congelar = (o) => { o.traverse((k) => { k.updateMatrix(); k.matrixAutoUpdate = false; }); };

// ---------------------------------------------------------------- en el mundo
// ctx: { T, escena, veg, calidad, progreso(), brilloVentana(mat, f, dia), alCambiar(qué) }
export function crearAldeaMundo(ctx) {
  const { T, escena } = ctx;
  const parada = PARADA_ALDEA;
  const M = marcoAldea(parada);
  const fabrica = crearFabrica();
  const aMundo = (lx, lz) => M.aMundo(lx, lz);
  let est = null, col = null, puertas = null;
  let emparejado = null;
  const edificios = new Map();     // id → estado de cada edificio
  const manzanas = new Map();      // clave → { raiz, x, z, radio, ids, fusion }
  const accesorios = planAccesorios();
  const cola = [];                 // lo armado que espera montarse (de a uno por cuadro)
  const luces = [];                // { luz, clase, x, y, z, intensidad, color }
  let chimeneas = [];
  let materiales = null, semillas = null, alamos = null, estacionHecha = null, calles = null;
  let pedidosIniciales = null;
  const info = { emparejarMs: 0, parcheTris: 0, montajes: 0, rearmados: 0, msMontar: 0 };

  // el centro de la aldea (para saber si estás cerca)
  const centro = aMundo(22, 50);
  const centroY = T.altura(centro.x, centro.z);
  const distAldea = (x, z) => Math.hypot(x - centro.x, z - centro.z);

  // ------------------------------------------------ el terreno
  function emparejar() {
    const t0 = performance.now();
    emparejado = emparejarTerreno(T, zonasEmparejar(parada), callesNivelar(parada));
    // la textura de alturas (pasto, agua) en la región tocada
    const tex = U.uAlturas.value;
    const N = Math.round(Math.sqrt(T.alturas.length));
    if (tex?.image?.data) {
      const { i0, i1, j0, j1 } = emparejado.region;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) tex.image.data[j * N + i] = THREE.DataUtils.toHalfFloat(T.alturas[j * N + i]);
      tex.needsUpdate = true;
    }
    parcheSuelo();
    info.emparejarMs = performance.now() - t0;
    return terrenoDeSorteo(T, emparejado.antes);
  }
  // La malla del suelo es gruesa: en la aldea va un parche fino que sigue a `T` (emparejado) y en
  // el borde se cose a la gruesa (misma altura y normal que la gruesa en su arista).
  function parcheSuelo() {
    const malla = escena.getObjectByName('terreno');
    if (!malla) return;
    const geo = malla.geometry, p = geo.attributes.position, nA = geo.attributes.normal;
    const seg = Math.round(Math.sqrt(p.count)) - 1, s = 1024 / seg;
    // lo que cubre: toda la aldea (con la estación, los álamos y las pircas) y un margen de una celda gruesa
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [lx, lz] of [[-60, -4], [104, -4], [-60, 96], [104, 96]]) { const w = aMundo(lx, lz); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); z0 = Math.min(z0, w.z); z1 = Math.max(z1, w.z); }
    const ia0 = Math.max(0, Math.floor((x0 - s + 512) / s)), ia1 = Math.min(seg, Math.ceil((x1 + s + 512) / s));
    const ja0 = Math.max(0, Math.floor((z0 - s + 512) / s)), ja1 = Math.min(seg, Math.ceil((z1 + s + 512) / s));
    const X0 = ia0 * s - 512, X1 = ia1 * s - 512, Z0 = ja0 * s - 512, Z1 = ja1 * s - 512;
    const hG = (i, j) => p.getY(j * (seg + 1) + i);
    const vG = (i, j, k) => nA.getComponent(j * (seg + 1) + i, k);
    // altura (k = -1) o normal (k = 0..2) de la gruesa en (x, z), triángulo por triángulo
    const gruesa = (x, z, k) => {
      const fx = (x + 512) / s, fz = (z + 512) / s;
      const i = Math.min(seg - 1, Math.max(0, Math.floor(fx))), j = Math.min(seg - 1, Math.max(0, Math.floor(fz)));
      const u = fx - i, v = fz - j;
      const f = k < 0 ? hG : (a, b) => vG(a, b, k);
      const ha = f(i, j), hb = f(i, j + 1), hc = f(i + 1, j + 1), hd = f(i + 1, j);
      return u + v <= 1 ? ha + (hd - ha) * u + (hb - ha) * v : hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
    };
    const nx = Math.max(2, Math.ceil((X1 - X0) / 2)), nz = Math.max(2, Math.ceil((Z1 - Z0) / 2));
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), nor = new Float32Array(pos.length), uv = new Float32Array((nx + 1) * (nz + 1) * 2);
    // 3.6.1 (mundo): la gruesa hundida (4 m sus vértices de adentro; los del borde no se tocan), para que el
    // parche no quede nunca por debajo de ella: en las celdas del borde, donde el terreno emparejado
    // baja más que la gruesa, asomaba hasta 16 cm de la de abajo (en las esquinas del parche)
    const hundida = (x, z) => {
      const fx = (x + 512) / s, fz = (z + 512) / s;
      const i = Math.min(seg - 1, Math.max(0, Math.floor(fx))), j = Math.min(seg - 1, Math.max(0, Math.floor(fz)));
      const u = fx - i, v = fz - j;
      const f = (a, c) => hG(a, c) - (a > ia0 && a < ia1 && c > ja0 && c < ja1 ? 4 : 0);
      const ha = f(i, j), hb = f(i, j + 1), hc = f(i + 1, j + 1), hd = f(i + 1, j);
      return u + v <= 1 ? ha + (hd - ha) * u + (hb - ha) * v : hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
    };
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + ((X1 - X0) * i) / nx, z = Z0 + ((Z1 - Z0) * j) / nz, k = j * (nx + 1) + i;
      const b = suave01(Math.min(x - X0, X1 - x, z - Z0, Z1 - z) / s);
      let h = gruesa(x, z, -1) + (T.altura(x, z) - gruesa(x, z, -1)) * b;
      if (b < 1) h = Math.max(h, hundida(x, z) + 0.05 * b);
      const nt = T.normal(x, z);
      let ax = gruesa(x, z, 0) + (nt.x - gruesa(x, z, 0)) * b, ay = gruesa(x, z, 1) + (nt.y - gruesa(x, z, 1)) * b, az = gruesa(x, z, 2) + (nt.z - gruesa(x, z, 2)) * b;
      const l = Math.hypot(ax, ay, az) || 1;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      nor[k * 3] = ax / l; nor[k * 3 + 1] = ay / l; nor[k * 3 + 2] = az / l;
      uv[k * 2] = (x + 512) / 1024; uv[k * 2 + 1] = 1 - (z + 512) / 1024;
    }
    const ind = new Uint32Array(nx * nz * 6);
    let q = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = (j + 1) * (nx + 1) + i, c = b + 1, d = a + 1;
      ind[q++] = a; ind[q++] = b; ind[q++] = d; ind[q++] = b; ind[q++] = c; ind[q++] = d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(ind, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const parche = new THREE.Mesh(g, malla.material);
    parche.name = 'terreno-aldea';
    parche.receiveShadow = true;
    parche.matrixAutoUpdate = false;
    escena.add(parche);
    info.parcheTris = nx * nz * 2;
    // la gruesa, adentro del parche, se hunde (las aristas del borde no se tocan). Lejos de la
    // aldea el parche se apaga y la gruesa vuelve a subir (desde el refugio no suma nada).
    // 3.6.1 (mundo): vuelve a la altura del terreno EMPAREJADO (antes, a la de antes de emparejar: al
    // cruzar el corte, desde el mirador o el tren, el suelo de la aldea se movía hasta 1,1 m de golpe;
    // ahora cambia sólo el detalle, unos centímetros)
    const idx = [], alta = [], baja = [];
    for (let j = ja0 + 1; j < ja1; j++) for (let i = ia0 + 1; i < ia1; i++) { const k = j * (seg + 1) + i; idx.push(k); alta.push(T.altura(i * s - 512, j * s - 512)); baja.push(hG(i, j) - 4); }
    parche.userData.gruesa = { p, idx, alta, baja, desde: idx.length ? idx[0] : 0, hasta: idx.length ? idx[idx.length - 1] : 0 };
    suelo = parche;
    verParche(true);
    info.parche = { X0, X1, Z0, Z1, celdaGruesa: s, nx, nz };
  }
  let suelo = null, sueloVisible = null;
  function verParche(si) {
    if (!suelo || sueloVisible === si) return;
    sueloVisible = si;
    suelo.visible = si;
    const g = suelo.userData.gruesa;
    for (let n = 0; n < g.idx.length; n++) g.p.setY(g.idx[n], si ? g.baja[n] : g.alta[n]);
    g.p.addUpdateRange?.(g.desde * 3, (g.hasta - g.desde + 1) * 3);
    g.p.needsUpdate = true;
  }

  // 3.6 (detalles): la rejilla del suelo fino (para apoyar el ripio en sus mismos triángulos). Sin
  // parche (en Node no hay malla del terreno), una de 2 m sobre el terreno.
  function rejillaSuelo() {
    if (suelo && info.parche) {
      const P = info.parche, pa = suelo.geometry.attributes.position.array, na = suelo.geometry.attributes.normal.array;
      const k = (i, j) => (j * (P.nx + 1) + i) * 3;
      return { X0: P.X0, Z0: P.Z0, dx: (P.X1 - P.X0) / P.nx, dz: (P.Z1 - P.Z0) / P.nz, nx: P.nx, nz: P.nz,
        altura: (i, j) => pa[k(i, j) + 1], normal: (i, j) => [na[k(i, j)], na[k(i, j) + 1], na[k(i, j) + 2]] };
    }
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [lx, lz] of [[-52, 3], [98, 3], [-52, 85], [98, 85]]) { const w = aMundo(lx, lz); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); z0 = Math.min(z0, w.z); z1 = Math.max(z1, w.z); }
    const X0 = Math.floor(x0 / 2) * 2, Z0 = Math.floor(z0 / 2) * 2, nx = Math.ceil((x1 - X0) / 2), nz = Math.ceil((z1 - Z0) / 2);
    return { X0, Z0, dx: 2, dz: 2, nx, nz, altura: (i, j) => alturaEn(X0 + i * 2, Z0 + j * 2), normal: (i, j) => { const n = T.normal(X0 + i * 2, Z0 + j * 2); return [n.x, n.y, n.z]; } };
  }

  // ------------------------------------------------ despejar y pintar el suelo
  // `pelar(x, z, radio)` de main.js (el pasto alrededor). Devuelve cuántos árboles y matas salieron.
  function despejar() {
    const veg = ctx.veg;
    let sacados = 0;
    for (const z of zonasEmparejar(parada)) sacados += veg.despejar(z.x, z.z, Math.hypot((z.x1 - z.x0) / 2, (z.z1 - z.z0) / 2) + 1.5);
    for (const c of CALLES_ALDEA) for (let s = 0; s < c.puntos.length - 1; s++) {
      const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1], L = Math.hypot(bx - ax, bz - az);
      for (let t = 0; t <= L; t += 5) { const w = aMundo(ax + ((bx - ax) * t) / L, az + ((bz - az) * t) / L); sacados += veg.despejar(w.x, w.z, c.ancho / 2 + 2.2); }
    }
    for (const a of accesorios) { const w = aMundo(a.lx, a.lz); sacados += veg.despejar(w.x, w.z, a.tipo === 'alamo' ? 2.6 : 1.8); }
    // la estación: el galpón de cargas y el cartel
    for (const [lx, lz] of [[-7.2, 7.8], [6.8, 6.4], [-5.2, 6.2]]) { const w = aMundo(lx, lz); sacados += veg.despejar(w.x, w.z, 3.5); }
    // y el claro del pueblo: entre las casas no queda bosque (el borde lo hacen los álamos)
    // 3.6 (detalles): en la orilla del claro quedan algunos árboles: el borde no es un corte recto
    for (let lx = -47; lx <= 93; lx += 6) for (let lz = 14; lz <= 85; lz += 6) {
      const orilla = Math.min(lx + 47, 93 - lx, 85 - lz, lz - 14), v = Math.sin(lx * 12.9898 + lz * 78.233) * 43758.5453;
      if (orilla < 5 && v - Math.floor(v) < 0.45) continue;
      const w = aMundo(lx, lz); sacados += veg.despejar(w.x, w.z, 4.4);
    }
    // `despejar` deja el choque de cada árbol sacado marcado `apagado`, pero colisiones.js no lo
    // mira (con un talado queda el tocón): en la aldea, el choque de lo que salió no frena a nadie
    // (ni a vos ni a la gente) — se le baja el techo por debajo de todo, sin sacarlo de la grilla
    let choques = 0;
    for (const lista of [veg.arboles, veg.matas]) for (const a of lista || []) {
      if (!a?.sacado || !a.choque || a.choque.alturaMax === -1e9) continue;
      const l = M.aLocal(a.x, a.z);
      if (l.lx < -62 || l.lx > 108 || l.lz < -8 || l.lz > 98) continue;
      a.choque.alturaMax = -1e9; choques++;
    }
    info.choquesApagados = choques;
    pintarSuelo();
    return sacados;
  }
  // La máscara del suelo: las calles de ripio (canal del sendero: tierra, sin pasto, flores ni
  // helechos) y el pasto pelado bajo los edificios.
  function pintarSuelo() {
    const tex = U.uMascara.value;
    const d = tex?.image?.data;
    if (!d) return;
    const N = tex.image.width;
    const pintar = (wx0, wx1, wz0, wz1, fn) => {
      for (let j = Math.max(0, Math.floor((wz0 + 512) / 2)); j <= Math.min(N - 1, Math.ceil((wz1 + 512) / 2)); j++) {
        for (let i = Math.max(0, Math.floor((wx0 + 512) / 2)); i <= Math.min(N - 1, Math.ceil((wx1 + 512) / 2)); i++) fn((j * N + i) * 4, i * 2 - 512, j * 2 - 512);
      }
    };
    for (const c of CALLES_ALDEA) {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [lx, lz] of c.puntos) { const w = aMundo(lx, lz); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); z0 = Math.min(z0, w.z); z1 = Math.max(z1, w.z); }
      const r = c.ancho / 2 + 2;
      pintar(x0 - r, x1 + r, z0 - r, z1 + r, (k, x, z) => {
        const l = M.aLocal(x, z);
        const dist = distanciaACalle(l.lx, l.lz, c);   // < 0: sobre la calle
        // 3.6 (detalles): el pasto se mete hasta el borde (pisado, más ralo, un metro y medio) y la
        // tierra queda sólo debajo del ripio (antes asomaba un borde naranja de un metro afuera)
        const pisado = suave01((1.8 - dist) / 1.8);
        if (pisado <= 0) return;
        d[k] = Math.round(d[k] * (1 - 0.3 * pisado));
        const g = suave01((-0.3 - dist) / 1.2);
        if (g <= 0) return;
        d[k + 1] = Math.max(d[k + 1], Math.round(255 * g));
        d[k] = Math.round(d[k] * (1 - g));
      });
    }
    // las plantas: lo de alrededor, pasto de patio (antes, un rectángulo oscuro); los lotes, con lo
    // que tienen ahora (`pintarLote`: el pasto alto del terreno esperando, o el patio de la obra)
    lotesSuelo = new Map();
    for (const z of zonasEmparejar(parada)) {
      const c = Math.cos(z.rot), s = Math.sin(z.rot), r = Math.hypot(z.x1 - z.x0, z.z1 - z.z0) / 2 + 1;
      const e = EDIFICIOS_ALDEA[z.id], celdas = [];
      pintar(z.x - r, z.x + r, z.z - r, z.z + r, (k, x, wz) => {
        const dx = x - z.x, dz = wz - z.z, bx = dx * c - dz * s, bz = dx * s + dz * c;
        const patio = bx > z.x0 + 0.5 && bx < z.x1 - 0.5 && bz > z.z0 + 0.5 && bz < z.z1 - 0.5;
        const planta = Math.abs(bx) < e.ancho / 2 + 0.6 && Math.abs(bz) < e.fondo / 2 + 0.6;
        if (!patio && !planta) return;
        if (esLote(z.id)) { celdas.push({ k, original: d[k], planta, lote: Math.abs(bx) < e.ancho / 2 + 1.2 && Math.abs(bz) < e.fondo / 2 + 1.2 }); return; }
        d[k] = planta ? 0 : Math.round(d[k] * 0.82);   // bajo la planta, nada
      });
      if (celdas.length) lotesSuelo.set(z.id, { celdas, vacio: null });
    }
    for (const id of lotesSuelo.keys()) pintarLote(id, true, false);
    tex.needsUpdate = true;
  }
  // 3.6 (detalles): el suelo de un lote. Vacío: el pasto alto y tupido del terreno que espera
  // (con la máscara al máximo, el pasto sale más alto); con obra o abierto: bajo la planta nada y
  // alrededor un patio. Se rehace sólo cuando cambia (sube la máscara entera: un par de ms).
  let lotesSuelo = null;
  function pintarLote(id, vacio, subir = true) {
    const L = lotesSuelo?.get(id), tex = U.uMascara.value, d = tex?.image?.data;
    if (!L || !d || L.vacio === vacio) return;
    L.vacio = vacio;
    for (const q of L.celdas) d[q.k] = vacio ? (q.lote ? Math.max(q.original, 240) : Math.max(q.original, 200)) : q.planta ? 0 : Math.round(q.original * 0.82);
    if (subir) tex.needsUpdate = true;
  }
  // Para objetos.js: ahí no se dejan frutos, plumas ni piedras.
  function zonasObjetos() {
    return zonasEmparejar(parada).map((z) => ({ x: z.x, z: z.z, radio: Math.hypot((z.x1 - z.x0) / 2, (z.z1 - z.z0) / 2) + 0.5, nombre: EDIFICIOS_ALDEA[z.id].nombre }));
  }
  // Donde estructuras.js arma el almacén y la casa de té.
  const sitiosValle = () => ({ almacen: sitioEstructura('almacen', parada), 'casa-te': sitioEstructura('casa-te', parada) });

  // ------------------------------------------------ las raíces (los complejos)
  // (lo que tarda armar las texturas del ripio, en la carga)
  // 3.6 (optimizar): las texturas del ripio (la grava y la máscara de las calles, ~60 ms) y el atlas de
  // los carteles (~70 ms) se LLENAN después de la carga, en la portada (`trasCompilar` las agenda, de a
  // una, cuando el navegador está libre). En la carga se arman vacías, con su tamaño y sus filtros: los
  // programas se compilan igual (compilar no sube texturas) y ninguna se dibuja vacía, porque antes de
  // montar cualquier cosa de la aldea se completan (`completarTexturas`, al momento si hiciera falta:
  // por ejemplo si aparecés en la aldea y se monta todo en la carga).
  const texturas = { grava: null, mascara: null, pasos: null };
  function texturasVacias() {
    const g = texturaDe(new Uint8Array(256 * 256 * 4), 256, 256);
    g.wrapS = g.wrapT = 1000;   // Repeat
    const P = MARCO_RIPIO, W = Math.round(P.ancho / P.paso), H = Math.round(P.alto / P.paso);
    const t = new THREE.DataTexture(new Uint8Array(W * H * 4), W, H);
    t.magFilter = 1006; t.minFilter = 1008; t.generateMipmaps = true; t.needsUpdate = true;
    texturas.grava = g; texturas.mascara = { tex: t, ...P, W, H, datos: t.image.data };
    texturas.pasos = [
      () => { const t0 = performance.now(), d = texturaGrava().image.data; texturas.grava.image.data.set(d); texturas.grava.needsUpdate = true; info.gravaMs = performance.now() - t0; },
      () => { const t0 = performance.now(), d = mascaraRipio().datos; texturas.mascara.datos.set(d); texturas.mascara.tex.needsUpdate = true; info.mascaraMs = performance.now() - t0; info.ripioMs = (info.gravaMs || 0) + info.mascaraMs; },
      () => { const t0 = performance.now(); materiales.carteles.map.userData.pintar?.(); info.atlasMs = performance.now() - t0; },
    ];
  }
  // (de a un paso si `uno`; si no, todo lo que falte)
  function completarTexturas(uno = false) {
    while (texturas.pasos?.length) { texturas.pasos.shift()(); if (uno) break; }
  }
  function completarDespues() {
    if (!texturas.pasos?.length) return;
    const ocio = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 400 }) : (fn) => setTimeout(fn, 0);
    ocio(() => { completarTexturas(true); completarDespues(); });
  }
  function crearMateriales() {
    // (3.6 pulido: un material PROPIO con el detalle de superficie del shader; no el est.mat compartido)
    const estructura = prepararMaterialAldea(materialVegetal({ flex: 0 }));
    // 3.6 (plaza y álamos): las cartas de hojas pintadas, como el bosque (sin esto los álamos son sólo tronco y ramitas)
    const follaje = prepararFollajeAldea(materialVegetal({ flex: 1, copa: true }), { cartas: texturaCartas() });
    const atlas = crearTexturaCarteles({ despues: true });   // (se pinta en completarTexturas)
    texturasVacias();
    return {
      estructura, follaje, muebles: estructura,
      ripio: materialRipio(texturas.grava, texturas.mascara),
      ventanaLuz: new THREE.MeshBasicMaterial({ map: texturaCharco(), color: 0x000000, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
      carteles: new THREE.MeshLambertMaterial({ map: atlas }),
      vidrios: prepararVidrioAldea(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b }), { cielo: U.uCieloBajo }),
      brasas: new THREE.MeshBasicMaterial({ vertexColors: true }),
      puerta: new THREE.MeshLambertMaterial({ vertexColors: true }),
    };
  }
  // El almacén y la casa de té son los de estructuras.js (sin aSuperficie): en la aldea se les suma
  // el atributo (por la cara: piso, techo, zócalo, tablas o troncos; +10 adentro) y aLocal, y pasan
  // al material de la aldea, para que combinen con los demás. En el Desafío no se tocan.
  function vestirEstructuras() {
    const S = SUPERFICIES_ALDEA || {};
    const sitios = sitiosValle();
    const defs = { almacen: { lugar: est.almacen, techo: S.chapa ?? 4, pared: S.tablasVerticales ?? 1, H: 2.9 }, 'casa-te': { lugar: est.casaTe, techo: S.tejuela ?? 3, pared: S.tosca ?? 7, H: 2.7 } };
    let caras = 0;
    for (const [clave, def] of Object.entries(defs)) {
      const raiz = est.conjuntos.find((c) => c.clave === clave)?.obj, l = def.lugar, s0 = sitios[clave];
      if (!raiz || !l || !s0) continue;
      const c = Math.cos(l.rot), sn = Math.sin(l.rot), W = s0.ancho / 2, D = s0.fondo / 2;
      raiz.updateMatrixWorld(true);
      raiz.traverse((m) => {
        if (!m.isMesh || m.material !== est.mat || !m.geometry?.attributes?.position) return;
        const g0 = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
        const p = g0.attributes.position, col = g0.attributes.color, n = p.count;
        const loc = new Float32Array(n * 3), sup = new Float32Array(n), v = new THREE.Vector3();
        for (let i = 0; i < n; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
          const dx = v.x - l.x, dz = v.z - l.z;
          loc[i * 3] = dx * c - dz * sn; loc[i * 3 + 1] = v.y - l.y; loc[i * 3 + 2] = dx * sn + dz * c;
        }
        for (let t = 0; t + 2 < n; t += 3) {
          const a = t * 3, b = a + 3, d = a + 6;
          const ux = loc[b] - loc[a], uy = loc[b + 1] - loc[a + 1], uz = loc[b + 2] - loc[a + 2];
          const wx = loc[d] - loc[a], wy = loc[d + 1] - loc[a + 1], wz = loc[d + 2] - loc[a + 2];
          let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
          const ln = Math.hypot(nx, ny, nz) || 1; ny /= ln; nx /= ln; nz /= ln;
          const cy = (loc[a + 1] + loc[b + 1] + loc[d + 1]) / 3, cx = (loc[a] + loc[b] + loc[d]) / 3, cz = (loc[a + 2] + loc[b + 2] + loc[d + 2]) / 3;
          let r = 0.5, gg = 0.5, bb = 0.5;
          if (col) { r = col.getX(t); gg = col.getY(t); bb = col.getZ(t); }
          const mx = Math.max(r, gg, bb), sat = mx > 0 ? (mx - Math.min(r, gg, bb)) / mx : 0;
          let tipo = 0;
          if (Math.abs(ny) > 0.8) tipo = cy < 1.0 && ny > 0 ? (S.piso ?? 8) : 0;
          else if (Math.abs(ny) > 0.25) tipo = cy > def.H - 0.4 ? def.techo : 0;
          else if (sat < 0.2 && cy < 1.0) tipo = S.piedra ?? 5;
          else if (sat >= 0.2 && cy > 0.25 && cy < def.H + 0.2) tipo = def.pared;
          const adentro = Math.abs(cx) < W - 0.1 && Math.abs(cz) < D - 0.1 && cy > 0.2 && cy < def.H;
          if (tipo && adentro) tipo += 10;
          sup[t] = sup[t + 1] = sup[t + 2] = tipo;
          if (tipo) caras++;
        }
        const g = g0 === m.geometry ? m.geometry : g0;
        g.setAttribute('aSuperficie', new THREE.BufferAttribute(sup, 1));
        g.setAttribute('aLocal', new THREE.BufferAttribute(loc, 3));
        if (g !== m.geometry) m.geometry = g;
        m.material = materiales.estructura;
      });
    }
    info.carasVestidas = caras;
  }
  function nuevaRaiz(clave, x, z, radio) {
    const raiz = new THREE.Group();
    raiz.name = `estructura:${clave}`;
    raiz.userData.estructuraRaiz = true;
    raiz.userData.claveEstructura = clave;
    raiz.userData.x = x; raiz.userData.z = z; raiz.userData.radioEstructura = radio;
    raiz.matrixAutoUpdate = false;
    repasoSinOcultos(raiz);
    est.grupo.add(raiz);
    est.conjuntos.push({ clave, obj: raiz, x, z, radio });
    return raiz;
  }
  const alturaEn = (x, z) => T.altura(x, z);
  function montar({ est: e, col: c, puertas: p }) {
    est = e; col = c; puertas = p;
    const tMat = performance.now();
    materiales = crearMateriales();
    info.materialesMs = performance.now() - tMat;
    vestirEstructuras();
    // cada edificio, con su sitio en el mundo
    for (const id of IDS_MUNDO_ALDEA) {
      const ed = EDIFICIOS_ALDEA[id];
      const w = aMundo(ed.x, ed.z);
      edificios.set(id, {
        id, manzana: manzanaDe(id), sitio: { x: w.x, y: ed.y, z: w.z, rot: M.rotMundo(ed.rot) }, ancho: ed.ancho, fondo: ed.fondo,
        pedida: null, montada: null, datos: null, enFusion: null, suelto: null, interior: null, puertas: [], luz: null, techo: null, chim: [],
      });
    }
    // los accesorios, en el mundo y a su altura
    for (const a of accesorios) {
      const w = aMundo(a.lx, a.lz);
      a.x = w.x; a.z = w.z; a.y = alturaEn(w.x, w.z); a.rot = M.rotMundo(a.giro);
      // (los muretes y sus escalones van a la altura de los lotes, derechos)
      if (Number.isFinite(a.yFijo)) { a.y = a.yFijo; a.incl = 0; } else if (a.largo) {
        // apoyada en las dos puntas: sigue la pendiente
        const c = Math.cos(a.rot), s = Math.sin(a.rot), h = a.largo / 2;
        const y0 = alturaEn(w.x - h * c, w.z + h * s), y1 = alturaEn(w.x + h * c, w.z - h * s);
        a.y = (y0 + y1) / 2; a.incl = Math.atan2(y1 - y0, a.largo);
      }
      a.agua = !!T.agua(w.x, w.z);
      a.manzana = a.id ? manzanaDe(a.id) : null;
    }
    // las manzanas: centro y radio de lo que tienen
    const grupos = new Map();
    const sumar = (k, x, z, r) => { const g = grupos.get(k) || { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }; g.x0 = Math.min(g.x0, x - r); g.x1 = Math.max(g.x1, x + r); g.z0 = Math.min(g.z0, z - r); g.z1 = Math.max(g.z1, z + r); grupos.set(k, g); };
    for (const b of edificios.values()) sumar(b.manzana, b.sitio.x, b.sitio.z, Math.hypot(b.ancho, b.fondo) / 2 + 3);
    for (const a of accesorios) {
      if (a.tipo === 'alamo' || a.agua) continue;
      // cada accesorio, a la manzana más cercana
      if (!a.manzana) {
        let mejor = null, dm = Infinity;
        for (const b of edificios.values()) { const dd = Math.hypot(b.sitio.x - a.x, b.sitio.z - a.z); if (dd < dm) { dm = dd; mejor = b.manzana; } }
        a.manzana = mejor;
      }
      sumar(a.manzana, a.x, a.z, 2);
    }
    for (const [k, g] of grupos) {
      const x = (g.x0 + g.x1) / 2, z = (g.z0 + g.z1) / 2, radio = Math.hypot(g.x1 - g.x0, g.z1 - g.z0) / 2;
      manzanas.set(k, { clave: k, x, z, radio, y: alturaEn(x, z), raiz: nuevaRaiz(`aldea-${k}`, x, z, radio), fusion: null, lista: false });
    }
    // los álamos y la estación, cada uno su complejo
    {
      // (con los seis de alrededor de la plaza, que la plaza deja para el mundo: `extra.alamos`)
      const lista = accesorios.filter((a) => a.tipo === 'alamo' && !a.agua);
      const pz = EDIFICIOS_ALDEA.plaza;
      for (const [i, q] of [[-10.5, -6], [-10.5, 3.5], [10.5, -6], [10.5, 3.5], [-4.5, -8.5], [4.5, -8.5]].entries()) {
        const c = Math.cos(pz.rot), s = Math.sin(pz.rot);
        const w = aMundo(pz.x + q[0] * c + q[1] * s, pz.z - q[0] * s + q[1] * c);
        lista.push({ tipo: 'alamo', x: w.x, z: w.z, y: alturaEn(w.x, w.z), giro: i * 1.7, escala: 0.85 + (i % 3) * 0.06, plaza: true });
      }
      let gx0 = Infinity, gx1 = -Infinity, gz0 = Infinity, gz1 = -Infinity;
      for (const a of lista) { gx0 = Math.min(gx0, a.x); gx1 = Math.max(gx1, a.x); gz0 = Math.min(gz0, a.z); gz1 = Math.max(gz1, a.z); }
      const x = lista.length ? (gx0 + gx1) / 2 : centro.x, z = lista.length ? (gz0 + gz1) / 2 : centro.z;
      alamos = { lista, x, z, y: alturaEn(x, z), radio: lista.length ? Math.hypot(gx1 - gx0, gz1 - gz0) / 2 + 10 : 20, raiz: null, mallas: null };
      alamos.raiz = nuevaRaiz('aldea-alamos', x, z, alamos.radio);
    }
    {
      const w = aMundo(0, 6);
      estacionHecha = { x: w.x, z: w.z, raiz: nuevaRaiz('aldea-estacion', w.x, w.z, 14), lista: false, parada: null };
    }
    // las calles: el ripio, los cables entre los postes y, de noche, la luz de las ventanas en el suelo
    calles = { raiz: nuevaRaiz('aldea-calles', centro.x, centro.z, 98), lista: false, charcos: null, sucio: false };
    semillasDeCompilar();
    // lo que cambia en las obras: se rearma sólo ese lote
    escucharAldea((e) => { if (['aceptado', 'trabajando', 'etapa', 'abierto', 'llamado'].includes(e?.tipo)) revisar(); });
  }
  // Unas mallas mínimas con cada material (y cada clase de malla) de la aldea, para que los
  // programas se compilen en la carga con todo lo demás (`compilarCarga`) y no al aparecer.
  function semillasDeCompilar() {
    const tri = (attrs) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
      if (attrs.includes('color')) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(9), 3));
      if (attrs.includes('aTipo')) g.setAttribute('aTipo', new THREE.BufferAttribute(new Float32Array(3), 1));
      if (attrs.includes('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(6), 2));
      if (attrs.includes('aCarta')) g.setAttribute('aCarta', new THREE.BufferAttribute(new Float32Array(12), 4));
      if (attrs.includes('aLocalR')) g.setAttribute('aLocalR', new THREE.BufferAttribute(new Float32Array(6), 2));
      return g;
    };
    semillas = new THREE.Group();
    semillas.name = 'aldea-semillas';
    const m = materiales;
    for (const [mat, attrs] of [[m.estructura, ['color', 'aTipo']], [m.follaje, ['color', 'aTipo', 'aCarta']], [m.vidrios, ['color', 'aTipo']], [m.brasas, ['color', 'aTipo']], [m.carteles, ['uv']], [m.puerta, ['color']], [m.ripio, ['aLocalR']], [m.ventanaLuz, ['uv']]]) {
      const malla = new THREE.Mesh(tri(attrs), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      semillas.add(malla);
    }
    for (const mat of [m.estructura, m.follaje]) {
      const im = new THREE.InstancedMesh(tri(['color', 'aTipo', 'aCarta']), mat, 1);
      im.castShadow = true; im.receiveShadow = true;
      semillas.add(im);
    }
    alamos.raiz.add(semillas);
  }
  function trasCompilar() {
    setTimeout(completarDespues, 200);   // 3.6 (optimizar): las texturas, en la portada
    if (!semillas) return;
    semillas.parent?.remove(semillas);
    semillas.traverse((o) => o.geometry?.dispose());
    semillas = null;
  }

  // ------------------------------------------------ pedir y montar
  const protos = new Map();   // los accesorios armados una vez (nombre → edificio)
  const promesas = [];
  function pedirProto(clave, nombre, opciones) {
    if (protos.has(clave)) return protos.get(clave).promesa;
    const q = { datos: null };
    q.promesa = fabrica.pedir({ tipo: 'accesorio', nombre, opciones }).then((d) => { q.datos = d; return d; });
    protos.set(clave, q);
    return q.promesa;
  }
  const PROTO = { farol: ['faroles', {}], poste: ['poste-luz', {}], vereda: ['vereda', { largo: 3, ancho: 1.3 }], cerco: ['cerco', { largo: 3, tipo: 'varas' }], pirca: ['pirca', { largo: 2.5, alto: 0.75 }], alamo: ['alamo', { semilla: 7, alto: 14.5 }],
    // 3.6 (detalles): el murete de contención, el cerco de palo a pique
    murete: ['pirca', { largo: 2.5, alto: ALTO_MURETE }], 'cerco-pique': ['cerco', { largo: 3, tipo: 'pique' }] };
  // (los `especial` se arman con sus medidas: escalones de cada desnivel, frutales, arbustos)
  const claveProto = (a) => (a.especial ? a.especial.clave : a.tipo);
  const largoProto = (a) => (a.especial ? a.especial.opciones.largo : PROTO[a.tipo]?.[1].largo) || 1;
  // Lo que hay que pedir ahora: cada edificio en su etapa (los que cambiaron, de nuevo).
  function revisar() {
    const aldea = ctx.progreso()?.aldea || null;
    for (const b of edificios.values()) {
      const v = etapaVisual(aldea, b.id);
      const clave = claveVisual(b.id, v);
      if (b.pedida === clave) continue;
      b.pedida = clave;
      const p = fabrica.pedir({ tipo: 'edificio', id: b.id, etapa: v.etapa, opciones: v.opciones }).then((datos) => {
        if (b.pedida !== clave) return;   // ya se pidió otra
        cola.push({ tipo: 'edificio', b, clave, datos });
      }).catch((err) => { console.error('aldea-mundo: no se pudo armar', b.id, err); });
      promesas.push(p);
      // 3.6 (optimizar): la que ya llegó sale de la lista (antes quedaba toda la partida)
      p.then(() => { const i = promesas.indexOf(p); if (i >= 0) promesas.splice(i, 1); });
    }
  }
  // Arranca: los accesorios, la estación y cada edificio en su etapa.
  function arrancar() {
    if (pedidosIniciales) return pedidosIniciales;
    const ps = [];
    for (const [k, [nombre, op]] of Object.entries(PROTO)) ps.push(pedirProto(k, nombre, op));
    for (const a of accesorios) if (a.especial) ps.push(pedirProto(a.especial.clave, a.especial.nombre, a.especial.opciones));
    ps.push(fabrica.pedir({ tipo: 'estacion' }).then((d) => { estacionHecha.datos = d; }));
    revisar();
    pedidosIniciales = Promise.all([...ps, ...promesas]).then(() => {
      for (const m of manzanas.values()) cola.push({ tipo: 'manzana', m });
      cola.push({ tipo: 'alamos' });
      cola.push({ tipo: 'estacion' });
      cola.push({ tipo: 'calles' });
    });
    return pedidosIniciales;
  }
  // Todo lo pedido llegó (y quedó en la cola).
  async function listo() {
    arrancar();
    await pedidosIniciales;
    for (let i = 0; i < 4 && promesas.length; i++) { const ps = promesas.splice(0); await Promise.all(ps); }
  }
  // Monta lo que esté en la cola (todo, o de a uno: `uno`).
  function montarCola(uno = false) {
    let hechos = 0;
    if (cola.length) completarTexturas();   // 3.6 (optimizar): nada de la aldea se monta con las texturas vacías
    while (cola.length) {
      const t0 = performance.now();
      const q = cola.shift();
      try {
        if (q.tipo === 'edificio') recibirEdificio(q);
        else if (q.tipo === 'manzana') montarManzana(q.m);
        else if (q.tipo === 'alamos') montarAlamos();
        else if (q.tipo === 'estacion') montarEstacion();
        else if (q.tipo === 'calles') montarCalles();
      } catch (err) { console.error('aldea-mundo: falló el montaje', q.tipo, err); }
      info.msMontar += performance.now() - t0;
      hechos++;
      if (uno) break;
    }
    if (hechos) ctx.alCambiar?.('aldea');
    return hechos;
  }
  // Llegó un edificio armado: si su manzana ya está montada, se cambia sólo él (suelto); si no,
  // queda para cuando se monte la manzana.
  function recibirEdificio({ b, clave, datos }) {
    if (b.pedida !== clave) return;
    const m = manzanas.get(b.manzana);
    b.datos = datos; b.montada = clave;
    if (!m.lista) return;
    // sale de la pieza fundida (si estaba) o se sacan sus mallas sueltas
    if (b.enFusion) { for (const [capa, r] of Object.entries(b.enFusion)) colapsar(m.fusion.mallas[capa].geometry, r); b.enFusion = null; }
    desmontarEdificio(b);
    montarEdificio(b, m, true);
    info.rearmados++;
  }
  function desmontarEdificio(b) {
    for (const a of b.animables || []) { a.contenedor.parent?.remove(a.contenedor); a.contenedor.traverse((o) => o.geometry?.dispose()); }
    b.animables = [];
    if (b.suelto) { b.suelto.parent?.remove(b.suelto); b.suelto.traverse((o) => o.geometry?.dispose()); b.suelto = null; }
    if (b.interior) { b.interior.parent?.remove(b.interior); b.interior.traverse((o) => o.geometry?.dispose()); b.interior = null; }
    col.eliminarPorDuenio(`aldea:${b.id}`);
    puertas?.eliminarPorDuenio(`aldea:${b.id}`);
    b.puertas = [];
    // 3.6 (optimizar): la luz vieja también sale de la lista de cada cuadro y del registro de luces.js
    // (antes cada rearmado de un edificio con luz dejaba una entrada muerta que se recorría siempre)
    if (b.luz) {
      const q = b.luz;
      q.luz.intensity = 0; q.luz.visible = false; q.luz.parent?.remove(q.luz);
      const i = luces.indexOf(q);
      if (i >= 0) luces.splice(i, 1);
      olvidarLuz(q.luz);
      b.luz = null;
    }
  }
  const capaMat = (capa) => materiales[capa];
  // Lo que no va en la pieza fundida: colisiones, puertas, interior, luz, techo, chimeneas.
  function montarEdificio(b, m, suelto) {
    const d = b.datos, s = b.sitio;
    if (suelto) {
      const g = new THREE.Group();
      g.position.set(s.x, s.y, s.z); g.rotation.y = s.rot;
      for (const [capa, geo] of Object.entries(d.exterior)) {
        if (!geo || !capaMat(capa)) continue;
        const malla = new THREE.Mesh(geo, capaMat(capa));
        malla.castShadow = capa === 'estructura' || capa === 'follaje';
        malla.receiveShadow = capa !== 'vidrios';
        g.add(malla);
      }
      congelar(g);
      m.raiz.add(g); g.updateMatrixWorld(true);
      b.suelto = g;
    }
    // lo de adentro: sólo de cerca
    const gi = new THREE.Group();
    gi.position.set(s.x, s.y, s.z); gi.rotation.y = s.rot;
    for (const [capa, geo] of Object.entries(d.interior)) {
      if (!geo) continue;
      const malla = new THREE.Mesh(geo, capa === 'brasas' ? materiales.brasas : materiales.muebles);
      malla.castShadow = false; malla.receiveShadow = capa !== 'brasas';
      gi.add(malla);
    }
    gi.visible = false;
    congelar(gi);
    m.raiz.add(gi);
    // 3.6 (pulido): lo que se mueve (bandera, rueda de la rueca, fuelle, puerta del horno), fuera de
    // lo fundido: cada pieza en un Group en su pivote (rotarlo la mueve); las de adentro, con el
    // interior (sólo de cerca). La animación es de la fase de mecánicas: quedan en `animables()`.
    b.animables = (d.animables || []).map((a) => {
      const contenedor = new THREE.Group();
      contenedor.position.set(s.x, s.y, s.z); contenedor.rotation.y = s.rot;
      const objeto = new THREE.Group();
      objeto.position.set(a.pivote.lx, a.pivote.ly, a.pivote.lz);
      const malla = new THREE.Mesh(a.geometria, capaMat(a.material) || materiales.estructura);
      malla.castShadow = a.capa !== 'interior'; malla.receiveShadow = true;
      malla.updateMatrix(); malla.matrixAutoUpdate = false;
      objeto.add(malla);
      contenedor.add(objeto);
      contenedor.updateMatrix(); contenedor.matrixAutoUpdate = false;
      (a.capa === 'interior' ? gi : m.raiz).add(contenedor);
      contenedor.updateMatrixWorld(true);
      return { id: a.id, edificio: b.id, objeto, contenedor, eje: a.eje, movimiento: a.movimiento, dato: a };
    });
    b.interior = gi.children.length ? gi : null;
    if (!b.interior) m.raiz.remove(gi);
    // los emisores (para las partículas: el humo del horno va con las chimeneas; las chispas de la
    // fragua quedan expuestas para la fase de mecánicas)
    b.emisores = ['chispas', 'humo', 'vapor'].filter((k) => d[k]).map((k) => ({ tipo: k, edificio: b.id, ...aMundoEn(s, d[k].lx, d[k].lz), y: s.y + d[k].ly }));
    b.acometida = d.extra?.acometida ? { ...aMundoEn(s, d.extra.acometida.lx, d.extra.acometida.lz), y: s.y + d.extra.acometida.ly } : null;
    // 3.6 (detalles): el cable del poste a la casa aparece cuando abre el local (antes esperaba a que
    // se rehiciera la luz de las ventanas en el suelo, que va con el planificador)
    const firmaAcometida = b.acometida ? `${b.acometida.x.toFixed(2)},${b.acometida.y.toFixed(2)},${b.acometida.z.toFixed(2)}` : '';
    if (firmaAcometida !== b.firmaAcometida) { b.firmaAcometida = firmaAcometida; if (calles?.lista) rehacerAcometidas(); }
    // y el suelo del lote: el pasto alto mientras espera, el patio cuando empieza la obra
    if (esLote(b.id)) pintarLote(b.id, d.etapa === 0);
    // choques y puertas (con dueño: se sacan al rearmar)
    const r = registrarEnMundo({ col, puertas }, d, s, { duenio: `aldea:${b.id}` });
    for (const p of r.puertas) prepararPuerta(p, m);
    b.puertas = r.puertas;
    // la luz de adentro (la fragua, si hay; si no, la del local)
    const spec = d.luces.find((l) => l.clase === 'fragua') || d.luces.find((l) => l.clase === 'interior' && l.cuarto === 'local') || d.luces.find((l) => l.clase === 'interior');
    if (spec && b.datos.etapa >= 3) b.luz = nuevaLuz(m, s, spec, spec.clase === 'fragua' ? 'fragua' : 'interior');
    // techo, planta y chimeneas en el mundo
    b.techo = d.techo && d.etapa >= 3 ? { ...d.techo } : null;
    b.chim = d.etapa >= 4 ? [...(d.chimeneas || []), ...(d.humo ? [d.humo] : [])].map((c) => ({ ...aMundoEn(s, c.lx, c.lz), y: s.y + c.ly })) : [];
    b.pisos = (d.pisos || []).map((q) => { const w = aMundoEn(s, q.lx, q.lz); return { x: w.x, z: w.z, ang: -(s.rot + (q.giro || 0)), largo: q.largo, ancho: q.ancho, alto: alturaEn(w.x, w.z) }; });
    // desde los cimientos, la planta entera (entre los tablones de una obra no asoma el pasto)
    if (d.etapa >= 1 && b.id !== 'plaza') b.pisos.push({ x: s.x, z: s.z, ang: -s.rot, largo: b.ancho, ancho: b.fondo, alto: s.y });
    rehacerChimeneas();
    if (calles) calles.sucio = true;   // la luz de sus ventanas en el suelo
  }
  const aMundoEn = (s, lx, lz) => aMundoAldea(s, lx, 0, lz);
  // La hoja de una puerta de la aldea: de una sola malla (las de puertas.js son cuatro) y colgada
  // de su complejo (el LOD la apaga con el edificio).
  function prepararPuerta(p, m) {
    if (!p?.g) return;
    p.estructuraClave = m.raiz.userData.claveEstructura;
    m.raiz.attach(p.g);
    const giro = p.g.rotation.y;
    p.g.rotation.set(0, giro, 0);
    p.g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(p.g.matrixWorld).invert();
    const piezas = [];
    p.g.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      const c = o.material?.color || new THREE.Color(0x6b5238), n = g.attributes.position.count;
      const k = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { k[i * 3] = c.r; k[i * 3 + 1] = c.g; k[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(k, 3));
      for (const nombre of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(nombre)) g.deleteAttribute(nombre);
      piezas.push({ geo: g, matriz: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), clave: piezas.length });
    });
    const j = juntar(piezas);
    if (!j) return;
    for (const h of [...p.g.children]) { p.g.remove(h); h.traverse((o) => o.geometry?.dispose()); }
    const hoja = new THREE.Mesh(j.geo, materiales.puerta);
    hoja.castShadow = false; hoja.receiveShadow = true;
    hoja.updateMatrix(); hoja.matrixAutoUpdate = false;
    p.g.add(hoja);
    p.hojaAldea = hoja;
  }
  function nuevaLuz(m, s, spec, clase) {
    const w = aMundoEn(s, spec.lx, spec.lz);
    const radio = (spec.radio || 7) * (clase === 'farol' ? 1.25 : 1);
    const luz = new THREE.PointLight(spec.color ?? 0xffc384, 0, radio, 1.6);
    luz.position.set(w.x, s.y + spec.ly, w.z);
    luz.updateMatrix(); luz.matrixAutoUpdate = false;
    m.raiz.add(luz); luz.updateMatrixWorld(true);
    registrarLuz(luz);
    const q = { luz, clase, x: w.x, y: s.y + spec.ly, z: w.z, alto: spec.ly, intensidad: spec.intensidad ?? 1, color: new THREE.Color(spec.color ?? 0xffc384) };
    luces.push(q);
    return q;
  }
  // Una manzana: el exterior de sus edificios y sus accesorios en una pieza por material.
  function montarManzana(m) {
    if (m.lista) return;
    const origen = { x: m.x, y: m.y, z: m.z };
    const capas = {};
    const meter = (capa, geo, matriz, clave) => { if (geo) (capas[capa] ??= []).push({ geo, matriz, clave }); };
    const ids = [...edificios.values()].filter((b) => b.manzana === m.clave && b.datos);
    for (const b of ids) for (const [capa, geo] of Object.entries(b.datos.exterior)) meter(capa, geo, matrizSitio(b.sitio, origen), b.id);
    const accs = accesorios.filter((a) => a.manzana === m.clave && !a.agua && a.tipo !== 'alamo');
    accs.forEach((a, i) => {
      const proto = protos.get(claveProto(a))?.datos;
      if (!proto) return;
      const sx = a.largo ? a.largo / largoProto(a) : 1;
      for (const [capa, geo] of Object.entries(proto.exterior)) meter(capa, geo, matrizSitio(a, origen, sx), `acc-${i}`);
    });
    m.fusion = { mallas: {} };
    for (const [capa, piezas] of Object.entries(capas)) {
      if (!capaMat(capa)) continue;
      const j = juntar(piezas);
      if (!j) continue;
      const malla = new THREE.Mesh(j.geo, capaMat(capa));
      malla.position.set(origen.x, origen.y, origen.z);
      malla.castShadow = capa === 'estructura' || capa === 'follaje';
      malla.receiveShadow = capa !== 'vidrios';
      malla.updateMatrix(); malla.matrixAutoUpdate = false;
      m.raiz.add(malla); malla.updateMatrixWorld(true);
      m.fusion.mallas[capa] = malla;
      for (const b of ids) { const r = j.rangos.get(b.id); if (r) (b.enFusion ??= {})[capa] = r; }
    }
    m.lista = true;
    for (const b of ids) montarEdificio(b, m, false);
    // los accesorios: choques, pisos (veredas) y la luz de cada farol
    accs.forEach((a) => {
      const proto = protos.get(claveProto(a))?.datos;
      if (!proto) return;
      registrarAccesorio(proto, a, largoProto(a));
      if ((a.tipo === 'farol' || a.tipo === 'poste') && proto.luces[0]) nuevaLuz(m, { x: a.x, y: a.y, z: a.z, rot: a.rot }, proto.luces[0], 'farol');
    });
    // los faroles de la plaza (los cuatro de las esquinas)
    const plaza = edificios.get('plaza');
    if (plaza?.manzana === m.clave && plaza.datos) {
      plaza.datos.luces.filter((l) => l.clase === 'farol' && Math.abs(l.lx) > 5).slice(0, 4).forEach((l) => nuevaLuz(m, plaza.sitio, l, 'farol'));
    }
    info.montajes++;
  }
  // Los choques de un accesorio (escalado a lo largo de su x) y su piso.
  function registrarAccesorio(proto, a, largoProto) {
    const sx = a.largo ? a.largo / largoProto : 1;
    const c = Math.cos(a.rot), s = Math.sin(a.rot);
    const w = (lx, lz) => ({ x: a.x + lx * sx * c + lz * s, z: a.z - lx * sx * s + lz * c });
    for (const o of proto.colisiones.obstaculos) {
      const n = { ...o, alturaMin: o.alturaMin + a.y, alturaMax: o.alturaMax + a.y, duenio: 'aldea:accesorios' };
      if (o.seg) { const p0 = w(o.ax, o.az), p1 = w(o.bx, o.bz); n.ax = p0.x; n.az = p0.z; n.bx = p1.x; n.bz = p1.z; } else { const p = w(o.x, o.z); n.x = p.x; n.z = p.z; }
      col.agregar(n);
    }
    for (const p of proto.colisiones.plataformas) {
      const q = w(p.x, p.z);
      col.agregarPlataforma({ ...p, x: q.x, z: q.z, largo: (p.largo || 1) * sx, alto: p.alto + a.y, ang: (p.ang || 0) - a.rot, duenio: 'aldea:accesorios' });
    }
  }
  // Los álamos: instanciados (el otoño sale de cada instancia), cerca con todo el detalle y lejos
  // con su versión barata.
  function montarAlamos() {
    const proto = protos.get('alamo')?.datos;
    if (!proto || alamos.mallas) return;
    const n = alamos.lista.length;
    const crear = (geo, mat) => {
      if (!geo) return null;
      const im = new THREE.InstancedMesh(geo, mat, n);
      im.castShadow = true; im.receiveShadow = true;
      im.count = 0; im.frustumCulled = false;
      im.matrixAutoUpdate = false;
      alamos.raiz.add(im);
      return im;
    };
    alamos.mallas = {
      cerca: [crear(proto.exterior.estructura, materiales.estructura), crear(proto.exterior.follaje, materiales.follaje)],
      lejos: [crear(proto.lod?.estructura, materiales.estructura), crear(proto.lod?.follaje, materiales.follaje)],
    };
    alamos.matrices = alamos.lista.map((a) => new THREE.Matrix4().compose(new THREE.Vector3(a.x, a.y, a.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a.giro), new THREE.Vector3(a.escala, a.escala, a.escala)));
    for (const a of alamos.lista) col.agregar({ x: a.x, z: a.z, r: 0.32 * a.escala, alturaMin: a.y - 0.3, alturaMax: a.y + 15, duenio: 'aldea:accesorios' });
    alamos.cercaDe = null;
    lodAlamos({ x: centro.x, z: centro.z }, true);
  }
  // 3.6 (optimizar): cuáles están cerca, en un arreglo fijo (antes, un arreglo y un texto nuevos cuatro
  // veces por segundo); se rehace sólo si alguno cambió
  function lodAlamos(cam, forzar = false) {
    if (!alamos?.mallas) return;
    const n = alamos.lista.length;
    const cerca = alamos.cerca || (alamos.cerca = new Uint8Array(n));
    let cambio = forzar || !alamos.cercaDe;
    for (let i = 0; i < n; i++) {
      const a = alamos.lista[i], dx = a.x - cam.x, dz = a.z - cam.z, c = dx * dx + dz * dz < 4900 ? 1 : 0;
      if (cerca[i] !== c) { cerca[i] = c; cambio = true; }
    }
    if (!cambio) return;
    alamos.cercaDe = true;
    const [ce, cf] = alamos.mallas.cerca, [le, lf] = alamos.mallas.lejos;
    let nc = 0, nl = 0;
    alamos.lista.forEach((a, i) => {
      if (cerca[i]) { ce?.setMatrixAt(nc, alamos.matrices[i]); cf?.setMatrixAt(nc, alamos.matrices[i]); nc++; }
      else { le?.setMatrixAt(nl, alamos.matrices[i]); lf?.setMatrixAt(nl, alamos.matrices[i]); nl++; }
    });
    for (const [im, k] of [[ce, nc], [cf, nc], [le, nl], [lf, nl]]) {
      if (!im) continue;
      im.count = k; im.visible = k > 0;
      im.instanceMatrix.needsUpdate = true;
    }
  }
  // La estación: el galpón de cargas, el cartel grande, los faroles y el banco, en el marco de
  // la parada (cada pieza apoyada en el terreno).
  function estacion(p) { if (estacionHecha) estacionHecha.parada = p || null; }
  function montarEstacion() {
    const E = estacionHecha;
    if (!E || E.lista || !E.datos) return;
    const p = E.parada || parada;
    const mp = marcoAldea(p);
    const capas = {};
    const origen = { x: E.x, y: alturaEn(E.x, E.z), z: E.z };
    for (const pz of E.datos.piezas) {
      const w = mp.aMundo(pz.lx, pz.lz), rot = mp.rotMundo(pz.giro);
      const o = pz.edificio.ocupa;
      // apoyado: lo más alto de su planta (que no se entierre el piso)
      let y = -Infinity;
      for (const [bx, bz] of [[o.x0, o.z0], [o.x1, o.z0], [o.x0, o.z1], [o.x1, o.z1], [0, 0]]) { const q = aMundoEn({ x: w.x, z: w.z, rot }, bx, bz); y = Math.max(y, alturaEn(q.x, q.z)); }
      const s = { x: w.x, y: pz.id.startsWith('farol') || pz.id === 'banco' ? alturaEn(w.x, w.z) : y - 0.04, z: w.z, rot };
      for (const [capa, geo] of Object.entries(pz.edificio.exterior)) if (geo) (capas[capa] ??= []).push({ geo, matriz: matrizSitio(s, origen), clave: pz.id });
      for (const [capa, geo] of Object.entries(pz.edificio.interior)) if (geo) (capas[capa === 'brasas' ? 'brasas' : 'estructura'] ??= []).push({ geo, matriz: matrizSitio(s, origen), clave: pz.id });
      registrarEnMundo({ col, puertas }, pz.edificio, s, { duenio: 'aldea:estacion' }).puertas.forEach((q) => prepararPuerta(q, { raiz: E.raiz }));
      for (const l of pz.edificio.luces) nuevaLuz({ raiz: E.raiz }, s, l, l.clase === 'farol' ? 'farol' : 'interior');
      // 3.6 (mecánicas): gancho mínimo: la campana del andén (pieza animable, que no iba en lo
      // fundido y no se montaba) y los puntos con nombre de cada pieza, para aldea-mecanicas-mundo.js
      (E.puntos ??= {})[pz.id] = { sitio: { ...s }, nombrados: pz.edificio.puntos?.nombrados || {} };
      for (const a of pz.edificio.animables || []) (E.animables ??= []).push(animableEnSitio(a, s, E.raiz, 'estacion'));
    }
    for (const [capa, piezas] of Object.entries(capas)) {
      if (!capaMat(capa)) continue;
      const j = juntar(piezas);
      if (!j) continue;
      const malla = new THREE.Mesh(j.geo, capaMat(capa));
      malla.position.set(origen.x, origen.y, origen.z);
      malla.castShadow = capa === 'estructura' || capa === 'follaje'; malla.receiveShadow = capa !== 'vidrios';
      malla.updateMatrix(); malla.matrixAutoUpdate = false;
      E.raiz.add(malla); malla.updateMatrixWorld(true);
    }
    E.lista = true;
  }
  // 3.6 (mecánicas): gancho mínimo. Una pieza animable suelta en un sitio (lo mismo que hace
  // montarEdificio con las de cada edificio), y los puntos con nombre y los asientos (con su
  // nombre) de un edificio montado, en el mundo. `version` cambia cuando el edificio se rearma.
  function animableEnSitio(a, s, padre, edificio) {
    const contenedor = new THREE.Group();
    contenedor.position.set(s.x, s.y, s.z); contenedor.rotation.y = s.rot;
    const objeto = new THREE.Group();
    objeto.position.set(a.pivote.lx, a.pivote.ly, a.pivote.lz);
    const malla = new THREE.Mesh(a.geometria, capaMat(a.material) || materiales.estructura);
    malla.castShadow = true; malla.receiveShadow = true;
    malla.updateMatrix(); malla.matrixAutoUpdate = false;
    objeto.add(malla); contenedor.add(objeto);
    contenedor.updateMatrix(); contenedor.matrixAutoUpdate = false;
    padre.add(contenedor); contenedor.updateMatrixWorld(true);
    return { id: a.id, edificio, objeto, contenedor, eje: a.eje, movimiento: a.movimiento, dato: a };
  }
  function puntosDeEdificio(id) {
    const enMundo = (s, q) => (q ? { ...aMundoEn(s, q.lx, q.lz), y: s.y + q.ly, mira: s.rot + (q.mira || 0) } : null);
    if (id === 'estacion') {
      const E = estacionHecha;
      if (!E?.lista || !E.puntos) return null;
      if (E.puntosMundo) return E.puntosMundo;
      const nombrados = {};
      for (const { sitio, nombrados: N } of Object.values(E.puntos)) for (const [k, q] of Object.entries(N)) if (!nombrados[k]) nombrados[k] = enMundo(sitio, q);
      E.puntosMundo = { id, version: 'estacion', etapa: 4, nombrados, asientos: [], extra: {} };
      return E.puntosMundo;
    }
    const b = edificios.get(id);
    if (!b?.datos || !b.montada) return null;
    if (b.puntosMundo?.version === b.montada) return b.puntosMundo;
    const s = b.sitio, P = b.datos.puntos || {}, nombrados = {};
    for (const [k, q] of Object.entries(P.nombrados || {})) nombrados[k] = enMundo(s, q);
    const ab = b.datos.extra?.abejas;
    b.puntosMundo = {
      id, version: b.montada, etapa: b.datos.etapa, sitio: { ...s }, nombrados,
      asientos: (P.asientos || []).map((q) => ({ ...enMundo(s, q), nombre: q.nombre })),
      extra: { abejas: ab ? { ...enMundo(s, ab), radio: ab.radio } : null },
    };
    return b.puntosMundo;
  }
  // ------------------------------------------------ las calles
  // El ripio (ver `materialRipio` y `mascaraRipio`) y los cables de poste a poste, con su comba. Va
  // todo en un complejo que cubre la aldea.
  function montarCalles() {
    if (!calles || calles.lista) return;
    // el ripio: 3.6 (detalles) sobre la misma rejilla del suelo fino (los mismos vértices y los
    // mismos triángulos, 4 cm más arriba): queda paralelo al suelo y nunca lo atraviesa (antes, con
    // su propia rejilla, la tierra asomaba en triángulos naranjas donde el terreno es curvo). Sólo
    // las celdas que tocan una calle; el borde y el dibujo los pone la máscara.
    {
      const R = rejillaSuelo(), pos = [], nor = [], loc = [], ind = [], vert = new Map();
      const cerca = (lx, lz) => CALLES_ALDEA.some((c) => distanciaACalle(lx, lz, c) < 1.1);
      const vertice = (i, j) => {
        const k = j * (R.nx + 1) + i;
        if (vert.has(k)) return vert.get(k);
        const x = R.X0 + i * R.dx, z = R.Z0 + j * R.dz, n = R.normal(i, j), l = M.aLocal(x, z);
        pos.push(x - centro.x, R.altura(i, j) + 0.04 - centroY, z - centro.z);
        nor.push(n[0], n[1], n[2]); loc.push(l.lx, l.lz);
        vert.set(k, pos.length / 3 - 1);
        return pos.length / 3 - 1;
      };
      for (let j = 0; j < R.nz; j++) for (let i = 0; i < R.nx; i++) {
        let toca = false;
        for (const [fi, fj] of [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]]) { const l = M.aLocal(R.X0 + (i + fi) * R.dx, R.Z0 + (j + fj) * R.dz); if (cerca(l.lx, l.lz)) { toca = true; break; } }
        if (!toca) continue;
        // (como el parche: a = (i, j), b = (i, j + 1), c = (i + 1, j + 1), d = (i + 1, j))
        const a = vertice(i, j), b = vertice(i, j + 1), c = vertice(i + 1, j + 1), d = vertice(i + 1, j);
        ind.push(a, b, d, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aLocalR', new THREE.Float32BufferAttribute(loc, 2));
      g.setIndex(ind);
      g.computeBoundingSphere(); g.computeBoundingBox();
      const malla = new THREE.Mesh(g, materiales.ripio);
      malla.position.set(centro.x, centroY, centro.z);
      malla.receiveShadow = true; malla.castShadow = false; malla.renderOrder = 1;
      malla.updateMatrix(); malla.matrixAutoUpdate = false;
      calles.raiz.add(malla); malla.updateMatrixWorld(true);
      calles.ripio = malla;
      info.ripioTris = ind.length / 3;
    }
    // los cables entre los postes de una misma calle
    const proto = protos.get('poste')?.datos;
    const puntas = proto?.extra?.cables || [];
    if (puntas.length) {
      const lineas = new Map();
      for (const a of accesorios) if (a.tipo === 'poste' && !a.agua) { if (!lineas.has(a.linea)) lineas.set(a.linea, []); lineas.get(a.linea).push(a); }
      // (con `armarCable` de la arquitectura: el mismo cable que llega a cada casa)
      const piezasCable = [];
      const desde = new THREE.Matrix4().makeTranslation(-centro.x, -centroY, -centro.z);
      for (const lista of lineas.values()) {
        lista.sort((a, b) => a.x - b.x || a.z - b.z);
        for (let i = 0; i < lista.length - 1; i++) {
          const a = lista[i], b = lista[i + 1], d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d > 32) continue;
          for (const p of puntas) {
            const wa = aMundoEn(a, p.lx, p.lz), wb = aMundoEn(b, p.lx, p.lz);
            piezasCable.push({ geo: armarCable({ x: wa.x, y: a.y + p.ly, z: wa.z }, { x: wb.x, y: b.y + p.ly, z: wb.z }, { comba: 0.3 + d * 0.012 }), matriz: desde, clave: piezasCable.length });
          }
        }
      }
      const j = juntar(piezasCable);
      if (j) {
        const malla = new THREE.Mesh(j.geo, materiales.estructura);
        malla.position.set(centro.x, centroY, centro.z);
        malla.castShadow = false; malla.receiveShadow = false;
        malla.updateMatrix(); malla.matrixAutoUpdate = false;
        calles.raiz.add(malla); malla.updateMatrixWorld(true);
        calles.cables = malla;
      }
    }
    calles.lista = true;
    calles.sucio = true;
    rehacerAcometidas();
  }
  // De noche, la luz de cada ventana de la planta baja cae en la galería o en el suelo de
  // adelante: una mancha cálida (sin luz de verdad: el presupuesto es de 4). Una sola malla.
  // Los cables de luz de los postes a la acometida de cada casa y local terminados (el poste más
  // cercano, a menos de 40 m). Se rehacen cuando abre un local.
  function rehacerAcometidas() {
    if (calles.acometidas) { calles.raiz.remove(calles.acometidas); calles.acometidas.geometry.dispose(); calles.acometidas = null; }
    const proto = protos.get('poste')?.datos;
    const puntas = proto?.extra?.cables || [];
    if (!puntas.length) return;
    const postes = accesorios.filter((a) => a.tipo === 'poste' && !a.agua);
    const desde = new THREE.Matrix4().makeTranslation(-centro.x, -centroY, -centro.z);
    const piezasCable = [];
    for (const b of edificios.values()) {
      if (!b.acometida) continue;
      let mejor = null, dm = 40;
      for (const p of postes) { const d = Math.hypot(p.x - b.acometida.x, p.z - b.acometida.z); if (d < dm) { dm = d; mejor = p; } }
      if (!mejor) continue;
      const pt = puntas[Math.floor(puntas.length / 2)], w = aMundoEn(mejor, pt.lx, pt.lz);
      piezasCable.push({ geo: armarCable({ x: w.x, y: mejor.y + pt.ly, z: w.z }, b.acometida, {}), matriz: desde, clave: b.id });
    }
    info.acometidas = piezasCable.map((q) => q.clave);
    const j = juntar(piezasCable);
    if (!j) return;
    const malla = new THREE.Mesh(j.geo, materiales.estructura);
    malla.position.set(centro.x, centroY, centro.z);
    malla.castShadow = false; malla.receiveShadow = false;
    malla.updateMatrix(); malla.matrixAutoUpdate = false;
    calles.raiz.add(malla); malla.updateMatrixWorld(true);
    calles.acometidas = malla;
  }
  function rehacerCharcos() {
    if (!calles?.lista) return;
    calles.sucio = false;
    if (calles.charcos) { calles.raiz.remove(calles.charcos); calles.charcos.geometry.dispose(); calles.charcos = null; }
    const pos = [], uv = [];
    const suelo = (x, z, y0) => {
      const p = col?.plataformaEn?.(x, z, y0 + 0.6);
      const t = alturaEn(x, z);
      return (p && p.alto > t - 0.1 && p.alto < y0 + 0.8 ? p.alto : t) + 0.025;
    };
    for (const b of edificios.values()) {
      const d = b.datos;
      if (!d || d.etapa < 3 || !d.ventanas?.length) continue;
      for (const v of d.ventanas) {
        if (v.ly > 2.6 || !(Math.hypot(v.nx, v.nz) > 0.5)) continue;
        // en el marco del edificio: de la pared para afuera, abriéndose
        const ux = -v.nz, uz = v.nx, w0 = v.ancho / 2 + 0.25, w1 = v.ancho / 2 + 1.1, largo = 2.8;
        const esquinas = [[w0, 0.06], [-w0, 0.06], [-w1, largo], [w1, largo]].map(([o, f]) => {
          const lx = v.lx + ux * o + v.nx * f, lz = v.lz + uz * o + v.nz * f;
          const w = aMundoEn(b.sitio, lx, lz);
          return { x: w.x, z: w.z, y: suelo(w.x, w.z, b.sitio.y + 0.3) };
        });
        const [p0, p1, p2, p3] = esquinas;
        for (const [p, u, vv] of [[p0, 1, 0], [p1, 0, 0], [p2, 0, 1], [p0, 1, 0], [p2, 0, 1], [p3, 1, 1]]) { pos.push(p.x - centro.x, p.y - centroY, p.z - centro.z); uv.push(u, vv); }
      }
    }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeBoundingSphere();
    const malla = new THREE.Mesh(g, materiales.ventanaLuz);
    malla.position.set(centro.x, centroY, centro.z);
    malla.castShadow = false; malla.receiveShadow = false; malla.renderOrder = 2;
    malla.visible = false;
    malla.updateMatrix(); malla.matrixAutoUpdate = false;
    calles.raiz.add(malla); malla.updateMatrixWorld(true);
    calles.charcos = malla;
  }
  function rehacerChimeneas() {
    chimeneas = [];
    for (const b of edificios.values()) chimeneas.push(...b.chim);
    chimCache.t = -1;
  }

  // ------------------------------------------------ cada cuadro
  let acum = 0, acumRevisar = 0;
  const camPos = { x: 0, z: 0 };
  // `permitir()`: el planificador antitirones (un montaje por cuadro, si el cuadro anda bien)
  function actualizar(dt, cam, permitir = () => true) {
    if (cola.length && permitir()) montarCola(true);
    else if (calles?.sucio && calles.lista && !cola.length && permitir()) rehacerCharcos();
    acum += dt; acumRevisar += dt;
    if (acumRevisar > 3) { acumRevisar = 0; if (pedidosIniciales) revisar(); }
    if (acum < 0.25) return;
    acum = 0;
    camPos.x = cam.x; camPos.z = cam.z;
    // el suelo fino de la aldea: sólo con la aldea a tiro de la distancia de dibujo
    if (suelo) { const corte = (ctx.calidad?.lejos ?? 310) + 170, d = distAldea(cam.x, cam.z); if (d < corte - 15) verParche(true); else if (d > corte + 15) verParche(false); }
    if (distAldea(cam.x, cam.z) > 520) return;
    for (const b of edificios.values()) {
      const d = Math.hypot(cam.x - b.sitio.x, cam.z - b.sitio.z);
      if (b.interior) b.interior.visible = d < VER_ADENTRO_ALDEA + Math.hypot(b.ancho, b.fondo) / 2;
      for (const p of b.puertas) { if (p.g) p.g.visible = d < VER_PUERTAS_ALDEA; if (p.hojaAldea) p.hojaAldea.castShadow = d < 25; }
      if (b.suelto) for (const k of b.suelto.children) if (k.isMesh && k.material !== materiales.vidrios && k.material !== materiales.carteles) k.castShadow = d < SOMBRA_ALDEA;
    }
    for (const m of manzanas.values()) {
      const mallas = m.fusion?.mallas;
      if (!mallas) continue;
      const sombra = Math.hypot(cam.x - m.x, cam.z - m.z) < SOMBRA_ALDEA + m.radio;
      if (mallas.estructura) mallas.estructura.castShadow = sombra;
      if (mallas.follaje) mallas.follaje.castShadow = sombra;
    }
    lodAlamos(cam);
  }
  // Las ventanas, los faroles y la luz de adentro (cada cuadro, después de las del valle).
  function actualizarLuces(cam, encendido, dia, relleno, colorInterior) {
    if (materiales && ctx.brilloVentana) ctx.brilloVentana(materiales.vidrios, encendido, dia);
    if (calles?.charcos) {
      const k = encendido * 0.26;
      calles.charcos.visible = k > 0.02;
      materiales.ventanaLuz.color.setRGB(k, k * 0.66, k * 0.32);
    }
    // 3.6 (optimizar): lejos, apagadas una vez y no se recorren más (las que se arman lejos nacen
    // apagadas); cerca, la raíz sólo de las que están a tiro
    if (distAldea(cam.x, cam.z) > 520) {
      if (!lucesApagadas) { for (const q of luces) q.luz.intensity = 0; lucesApagadas = true; }
      return;
    }
    lucesApagadas = false;
    const ahora = performance.now(), titila = 1.6 + 0.25 * Math.sin(ahora / 170) * Math.sin(ahora / 410);
    for (const q of luces) {
      const dx = cam.x - q.x, dz = cam.z - q.z, d2 = dx * dx + dz * dz;
      // (los postes de luz cuelgan la lámpara a 5 m: necesitan más que un farol de 3 m)
      // 3.6 (detalles): al alejarse se apagan de a poco (antes, de golpe en el límite)
      if (q.clase === 'farol') q.luz.intensity = d2 < 8100 ? encendido * (q.alto > 4 ? 15 : 6) * q.intensidad * (1 - suave01((Math.sqrt(d2) - 70) / 20)) : 0;
      else if (q.clase === 'fragua') q.luz.intensity = d2 < 900 ? titila * (1 - suave01((Math.sqrt(d2) - 22) / 8)) : 0;
      else {
        q.luz.intensity = d2 < 324 ? (relleno * 0.7 * q.intensidad + encendido * 1.5) * (1 - suave01((Math.sqrt(d2) - 13) / 5)) : 0;
        if (q.luz.intensity > 0) q.luz.color.copy(colorInterior).lerp(q.color, Math.min(1, 0.35 + encendido));
      }
    }
  }
  let lucesApagadas = false;
  // ¿Adentro de un edificio de la aldea (bajo su techo, entre sus paredes)? Devuelve el edificio.
  function edificioEn(pos, galeria) {
    if (!pos || distAldea(pos.x, pos.z) > 150) return null;
    for (const b of edificios.values()) {
      if (!b.techo) continue;
      // 3.6 (optimizar): el giro de cada edificio no cambia: el seno y el coseno se guardan
      const s = b.sitio, dx = pos.x - s.x, dz = pos.z - s.z, c = b.cos ??= Math.cos(s.rot), sn = b.sen ??= Math.sin(s.rot);
      const bx = dx * c - dz * sn, bz = dx * sn + dz * c;
      if (Number.isFinite(pos.y) && (pos.y < s.y - 1 || pos.y > s.y + 4.2)) continue;
      const r = galeria ? b.techo : { x0: -b.ancho / 2, x1: b.ancho / 2, z0: -b.fondo / 2, z1: b.fondo / 2 };
      if (bx > r.x0 && bx < r.x1 && bz > r.z0 && bz < r.z1) return b;
    }
    return null;
  }
  const adentro = (pos) => edificioEn(pos, false);
  const bajoCubierta = (pos) => edificioEn(pos, true);
  const techoEn = (pos) => (edificioEn(pos, true) ? 'chapa' : null);
  // Lo cubierto, para marcarTechos (sin nieve adentro): rectángulos girados en el mundo.
  function techos() {
    const lista = [];
    for (const b of edificios.values()) if (b.techo) lista.push({ x: b.sitio.x, z: b.sitio.z, rot: b.sitio.rot, x0: b.techo.x0, x1: b.techo.x1, z0: b.techo.z0, z1: b.techo.z1 });
    return lista;
  }
  // Lo pisado sin pasto (para marcarPisos): las calles (en tramos de 20 m) y los pisos de cada edificio.
  let pisosCalles = null;
  function pisos() {
    if (!pisosCalles) {
      pisosCalles = [];
      for (const c of CALLES_ALDEA) for (let s = 0; s < c.puntos.length - 1; s++) {
        const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1], L = Math.hypot(bx - ax, bz - az);
        const n = Math.max(1, Math.ceil(L / 20));
        const a = aMundo(ax, az), b = aMundo(bx, bz), ang = Math.atan2(b.z - a.z, b.x - a.x);
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
          pisosCalles.push({ x, z, ang, largo: L / n + 0.5, ancho: c.ancho, alto: alturaEn(x, z) });
        }
      }
    }
    const lista = [...pisosCalles];
    for (const b of edificios.values()) if (b.pisos) lista.push(...b.pisos);
    return lista;
  }
  // El humo: con la aldea cerca, las chimeneas más cercanas (de la aldea y del valle).
  const chimCache = { t: -1, lista: null, base: null };
  function chimeneasCerca(cam, base) {
    if (!chimeneas.length || distAldea(cam.x, cam.z) > 260) return base;
    const ahora = performance.now();
    if (chimCache.lista && chimCache.base === base && ahora - chimCache.t < 1000) return chimCache.lista;
    // (3.6 (optimizar): con la distancia al cuadrado: el mismo orden, sin raíces)
    const d2 = (c) => (c.x - cam.x) * (c.x - cam.x) + (c.z - cam.z) * (c.z - cam.z);
    const todas = [...chimeneas, ...base.filter((c) => c && d2(c) < 67600)];
    todas.sort((a, b) => d2(a) - d2(b));
    chimCache.lista = todas.slice(0, 8); chimCache.t = ahora; chimCache.base = base;
    return chimCache.lista;
  }

  // lo que tarda cada paso en la carga (el Worker trabaja aparte)
  const medido = (k, fn) => (...a) => { const t0 = performance.now(); try { return fn(...a); } finally { info[k] = (info[k] || 0) + performance.now() - t0; } };
  // ------------------------------------------------ medir (pruebas y F3)
  function medir() {
    let tris = 0, mallas = 0;
    for (const r of [...[...manzanas.values()].map((m) => m.raiz), alamos?.raiz, estacionHecha?.raiz, calles?.raiz].filter(Boolean)) {
      r.traverse((o) => { if (o.isMesh) { mallas++; tris += trisDe(o.geometry) * (o.isInstancedMesh ? o.count : 1); } });
    }
    return {
      manzanas: manzanas.size, listas: [...manzanas.values()].filter((m) => m.lista).length, edificios: edificios.size,
      montados: [...edificios.values()].filter((b) => b.montada).length, cola: cola.length, luces: luces.length,
      lucesPrendidas: luces.filter((q) => q.luz.intensity > 0).length, mallas, triangulos: tris, chimeneas: chimeneas.length,
      accesorios: accesorios.length, fabrica: { ...fabrica.stats, pendientes: fabrica.pendientes() }, ...info,
    };
  }
  function estadoEdificio(id) {
    const b = edificios.get(id);
    if (!b) return null;
    return { id, pedida: b.pedida, montada: b.montada, enFusion: !!b.enFusion, suelto: !!b.suelto, interior: !!b.interior, interiorVisible: !!b.interior?.visible,
      puertas: b.puertas.map((p) => ({ nombre: p.nombre, clave: p.estructuraClave, x: p.x, z: p.z })), tris: b.datos ? b.datos.medidas.triangulos : null, techo: !!b.techo, sitio: { ...b.sitio } };
  }
  return {
    emparejar, despejar: medido('despejarMs', despejar), sitiosValle, zonasObjetos, montar: medido('montarMs', montar), estacion, arrancar: medido('arrancarMs', arrancar), listo, montarCola, trasCompilar,
    actualizar, luces: actualizarLuces, adentro, bajoCubierta, techoEn, techos, pisos, chimeneasCerca, medir, estadoEdificio,
    raices: () => [...[...manzanas.values()].map((m) => m.raiz), alamos?.raiz, estacionHecha?.raiz, calles?.raiz].filter(Boolean),
    charcos: () => calles?.charcos || null,
    // 3.6 (pulido): para la fase de mecánicas: lo que se mueve y lo que echa humo o chispas
    animables: (id = null) => [...edificios.values()].filter((b) => !id || b.id === id).flatMap((b) => b.animables || []),
    emisores: () => [...edificios.values()].flatMap((b) => b.emisores || []),
    // 3.6 (mecánicas): gancho mínimo (ver puntosDeEdificio y animableEnSitio)
    puntosEdificio: (id) => puntosDeEdificio(id), animablesEstacion: () => estacionHecha?.animables || [],
    centro, accesorios, emparejado: () => emparejado, aMundo: (lx, lz) => aMundo(lx, lz), fabrica: () => fabrica.stats,
  };
}
