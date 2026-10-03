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
//     flores ni helechos) y marcadas como piso (`pisos`, para marcarPisos de main.js);
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
//   · la estación (`armarAgregadoEstacion`) sobre la parada del sur;
//   · las luces: un interior por edificio, los faroles de la calle y de la plaza, registrados
//     en luces.js: el presupuesto fijo (4 puntuales + 1 foco) elige los más cercanos, así que
//     nunca hay más de 4 ni se compila nada; las ventanas brillan con `brilloVentana`;
//   · bajo techo (lluvia, nieve, sonido), techos (sin nieve adentro), pisos (sin pasto), humo.
import * as THREE from 'three';
import { PARADA_ALDEA, EDIFICIOS_ALDEA, IDS_EDIFICIOS, CALLES_ALDEA, marcoAldea, zonasAldea, sitioEstructura, escucharAldea, esLote, puntosDe, distanciaACalle } from './aldea.js';
import { estadoVisual } from './aldea-gente.js';
import { armarEdificio, armarAccesorio, armarAgregadoEstacion, registrarEnMundo, crearTexturaCarteles, ESCUELA_A_MEDIO_HACER, prepararMaterialAldea, prepararVidrioAldea, armarCable, SUPERFICIES_ALDEA } from './aldea-arquitectura.js';
import { materialVegetal, U } from './materiales.js';
import { registrarLuz } from './luces.js';
import { armarTerreno } from './terreno.js';

const suave01 = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

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
// Empareja `T.alturas` (y rehace `T.pendiente` alrededor, con la misma cuenta de terreno.js).
// Devuelve lo de antes (copias enteras: el sorteo de estructuras.js las usa) y la región tocada.
export function emparejarTerreno(T, zonas = zonasEmparejar()) {
  const total = T.alturas.length, N = Math.round(Math.sqrt(total)), RES = N - 1, CEL = 1024 / RES, MIT = 512;
  const antes = { alturas: T.alturas.slice(), pendiente: T.pendiente.slice() };
  // (`ax`, `az`, `cx`, `cz`: la mitad y el centro de la planta en el marco del edificio)
  const Z = zonas.map((z) => ({ ...z, c: Math.cos(z.rot), s: Math.sin(z.rot), ax: z.planta?.ancho / 2 || 0, az: z.planta?.fondo / 2 || 0, cx: 0, cz: 0 }));
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const q of Z) {
    for (const [bx, bz] of [[q.x0 - q.borde, q.z0 - q.borde], [q.x1 + q.borde, q.z0 - q.borde], [q.x0 - q.borde, q.z1 + q.borde], [q.x1 + q.borde, q.z1 + q.borde]]) {
      const wx = q.x + bx * q.c + bz * q.s, wz = q.z - bx * q.s + bz * q.c;
      x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
    }
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
  if (v === 'lote') return { etapa: 0, opciones: {} };
  if (v === 'a-medio') return { etapa: ESCUELA_A_MEDIO_HACER, opciones: {} };
  const k = Number(String(v).split('-')[1]) || 1;
  const etapa = id === 'escuela' ? Math.max(k - 1, ESCUELA_A_MEDIO_HACER) : k - 1;
  return { etapa, opciones: { obraActiva: true } };
}
const claveVisual = (id, v) => `${id}|${v.etapa}|${v.opciones.obraActiva ? 1 : 0}`;

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

// Los accesorios de la aldea, en el plano: { tipo, lx, lz, giro, largo }. Siempre los mismos.
export function planAccesorios() {
  const lista = [];
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
        if (enCalle(lx, lz, 0.8) || ocupado(lx, lz, 0.2, id)) continue;
        lista.push({ tipo: 'cerco', lx, lz, giro: e.rot + Math.atan2(bx - ax, bz - az) - Math.PI / 2, largo: L / n });
      }
    }
  }
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
function azarSemilla(s) {
  let a = s >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
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
// El ripio de las calles: piedritas sueltas, dos huellas de ruedas apisonadas, el lomo del medio
// con alguna mata, y los bordes que se pierden en la tierra (alfa). u: de costado; v: a lo largo
// (seis metros por vuelta; las piedritas cruzan la costura).
function texturaRipio() {
  const W = 256, H = 512, d = new Uint8Array(W * H * 4), r = azarSemilla(36036);
  const base = hexRGB('#8b806d');
  // el fondo: tierra con manchas grandes (dos ondas suaves, sin costura a lo largo)
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i / W, v = j / H;
    const m = 0.06 * Math.sin(v * Math.PI * 2 * 3 + u * 7) + 0.05 * Math.sin(v * Math.PI * 2 * 7 + u * 13 + 1.3);
    const huella = Math.max(0, 1 - Math.min(Math.abs(u - 0.3), Math.abs(u - 0.7)) / 0.09);
    const f = (1 + m) * (1 - 0.2 * huella * huella);
    const k = (j * W + i) * 4;
    d[k] = base[0] * f; d[k + 1] = base[1] * f; d[k + 2] = base[2] * f; d[k + 3] = 255;
  }
  const punto = (cx, cy, rad, col, a = 1) => {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      if (x < 0 || x >= W) continue;
      const dd = Math.hypot(x - cx, y - cy);
      if (dd > rad) continue;
      const k = (((y % H) + H) % H * W + x) * 4, t = a * Math.min(1, (rad - dd) * 1.5);
      d[k] += (col[0] - d[k]) * t; d[k + 1] += (col[1] - d[k + 1]) * t; d[k + 2] += (col[2] - d[k + 2]) * t;
    }
  };
  // las piedritas (menos en las huellas), con su sombrita
  const colores = ['#9a907e', '#837a6b', '#a3977f', '#7a736a', '#90856f', '#ada490', '#716b62'].map(hexRGB);
  const sombra = [52, 47, 40];
  for (let n = 0; n < 4200; n++) {
    const u = r(), v = r() * H;
    const huella = Math.min(Math.abs(u - 0.3), Math.abs(u - 0.7)) < 0.06;
    if (huella && r() < 0.75) continue;
    const t = 0.5 + r() * (huella ? 0.8 : 1.5);
    if (t > 1.4) punto(u * W + 0.5, v + 0.7, t * 0.85, sombra, 0.25);
    punto(u * W, v, t, colores[(r() * colores.length) | 0]);
  }
  // matas de pasto en el lomo del medio
  for (let n = 0; n < 160; n++) {
    const u = 0.5 + (r() - 0.5) * 0.12, v = r() * H, col = r() < 0.5 ? [96, 112, 60] : [128, 128, 72];
    for (let k = 0; k < 4; k++) { const dx = (r() - 0.5) * 6, dy = -2 - r() * 5; for (let s = 0; s <= 6; s++) punto(u * W + dx * s / 6, v + dy * s / 6, 0.6, col, 0.55); }
  }
  // los bordes: se funden con la tierra (y no son una línea recta)
  let b0 = 0.1, b1 = 0.1;
  for (let j = 0; j < H; j++) {
    if (j % 4 === 0) { b0 = 0.06 + r() * 0.08; b1 = 0.06 + r() * 0.08; }
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      d[(j * W + i) * 4 + 3] = Math.round(255 * 0.94 * suave01(u / (b0 + 0.06)) * suave01((1 - u) / (b1 + 0.06)));
    }
  }
  const t = texturaDe(d, W, H);
  t.wrapS = 1001; t.wrapT = 1000;   // ClampToEdge a lo ancho, Repeat a lo largo (el three local no exporta los nombres)
  return t;
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
    emparejado = emparejarTerreno(T, zonasEmparejar(parada));
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
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + ((X1 - X0) * i) / nx, z = Z0 + ((Z1 - Z0) * j) / nz, k = j * (nx + 1) + i;
      const b = suave01(Math.min(x - X0, X1 - x, z - Z0, Z1 - z) / s);
      const h = gruesa(x, z, -1) + (T.altura(x, z) - gruesa(x, z, -1)) * b;
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
    // aldea el parche se apaga y la gruesa vuelve a su altura (desde el refugio no suma nada).
    const idx = [], alta = [], baja = [];
    for (let j = ja0 + 1; j < ja1; j++) for (let i = ia0 + 1; i < ia1; i++) { const k = j * (seg + 1) + i; idx.push(k); alta.push(hG(i, j)); baja.push(hG(i, j) - 4); }
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
    for (let lx = -47; lx <= 93; lx += 6) for (let lz = 14; lz <= 85; lz += 6) { const w = aMundo(lx, lz); sacados += veg.despejar(w.x, w.z, 4.4); }
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
        // el borde de pasto pisado: ralo hasta un par de metros de la calle
        const pisado = suave01((2.4 - dist) / 2.4);
        if (pisado <= 0) return;
        d[k] = Math.round(d[k] * (1 - 0.45 * pisado));
        const g = suave01((0.9 - dist) / 1.6);
        if (g <= 0) return;
        d[k + 1] = Math.max(d[k + 1], Math.round(255 * g));
        d[k] = Math.round(d[k] * (1 - g));
      });
    }
    for (const z of zonasEmparejar(parada)) {
      const c = Math.cos(z.rot), s = Math.sin(z.rot), r = Math.hypot(z.x1 - z.x0, z.z1 - z.z0) / 2 + 1;
      pintar(z.x - r, z.x + r, z.z - r, z.z + r, (k, x, wz) => {
        const dx = x - z.x, dz = wz - z.z, bx = dx * c - dz * s, bz = dx * s + dz * c;
        if (bx > z.x0 + 0.5 && bx < z.x1 - 0.5 && bz > z.z0 + 0.5 && bz < z.z1 - 0.5) d[k] = Math.round(d[k] * 0.25);
        const e = EDIFICIOS_ALDEA[z.id];
        if (Math.abs(bx) < e.ancho / 2 + 0.6 && Math.abs(bz) < e.fondo / 2 + 0.6) d[k] = 0;   // bajo la planta, nada
      });
    }
    tex.needsUpdate = true;
  }
  // Para objetos.js: ahí no se dejan frutos, plumas ni piedras.
  function zonasObjetos() {
    return zonasEmparejar(parada).map((z) => ({ x: z.x, z: z.z, radio: Math.hypot((z.x1 - z.x0) / 2, (z.z1 - z.z0) / 2) + 0.5, nombre: EDIFICIOS_ALDEA[z.id].nombre }));
  }
  // Donde estructuras.js arma el almacén y la casa de té.
  const sitiosValle = () => ({ almacen: sitioEstructura('almacen', parada), 'casa-te': sitioEstructura('casa-te', parada) });

  // ------------------------------------------------ las raíces (los complejos)
  function crearMateriales() {
    // (3.6 pulido: un material PROPIO con el detalle de superficie del shader; no el est.mat compartido)
    const estructura = prepararMaterialAldea(materialVegetal({ flex: 0 }));
    const follaje = materialVegetal({ flex: 1 });
    const tA = performance.now();
    const atlas = crearTexturaCarteles();
    info.atlasMs = performance.now() - tA;
    return {
      estructura, follaje, muebles: estructura,
      ripio: new THREE.MeshLambertMaterial({ map: texturaRipio(), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
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
      if (a.largo) {
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
      return g;
    };
    semillas = new THREE.Group();
    semillas.name = 'aldea-semillas';
    const m = materiales;
    for (const [mat, attrs] of [[m.estructura, ['color', 'aTipo']], [m.follaje, ['color', 'aTipo']], [m.vidrios, ['color', 'aTipo']], [m.brasas, ['color', 'aTipo']], [m.carteles, ['uv']], [m.puerta, ['color']], [m.ripio, ['uv']], [m.ventanaLuz, ['uv']]]) {
      const malla = new THREE.Mesh(tri(attrs), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      semillas.add(malla);
    }
    for (const mat of [m.estructura, m.follaje]) {
      const im = new THREE.InstancedMesh(tri(['color', 'aTipo']), mat, 1);
      im.castShadow = true; im.receiveShadow = true;
      semillas.add(im);
    }
    alamos.raiz.add(semillas);
  }
  function trasCompilar() {
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
  const PROTO = { farol: ['faroles', {}], poste: ['poste-luz', {}], vereda: ['vereda', { largo: 3, ancho: 1.3 }], cerco: ['cerco', { largo: 3, tipo: 'varas' }], pirca: ['pirca', { largo: 2.5, alto: 0.75 }], alamo: ['alamo', { semilla: 7, alto: 14.5 }] };
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
    }
  }
  // Arranca: los accesorios, la estación y cada edificio en su etapa.
  function arrancar() {
    if (pedidosIniciales) return pedidosIniciales;
    const ps = [];
    for (const [k, [nombre, op]] of Object.entries(PROTO)) ps.push(pedirProto(k, nombre, op));
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
    if (b.luz) { b.luz.intensity = 0; b.luz.visible = false; b.luz.parent?.remove(b.luz); b.luz = null; }
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
  const aMundoEn = (s, lx, lz) => { const c = Math.cos(s.rot), sn = Math.sin(s.rot); return { x: s.x + lx * c + lz * sn, z: s.z - lx * sn + lz * c }; };
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
      const proto = protos.get(a.tipo)?.datos;
      if (!proto) return;
      const largoProto = PROTO[a.tipo][1].largo || 1;
      const sx = a.largo ? a.largo / largoProto : 1;
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
      const proto = protos.get(a.tipo)?.datos;
      if (!proto) return;
      registrarAccesorio(proto, a, PROTO[a.tipo][1].largo || 1);
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
  function lodAlamos(cam, forzar = false) {
    if (!alamos?.mallas) return;
    const cerca = alamos.lista.map((a) => Math.hypot(a.x - cam.x, a.z - cam.z) < 70);
    const firma = cerca.join('');
    if (!forzar && firma === alamos.cercaDe) return;
    alamos.cercaDe = firma;
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
  // ------------------------------------------------ las calles
  // El ripio: una lámina sobre el terreno con la textura de las piedritas y las huellas de las
  // ruedas (los bordes se funden con la tierra pintada en la máscara). Los cables: de poste a
  // poste, con su comba. Va todo en un complejo que cubre la aldea.
  function montarCalles() {
    if (!calles || calles.lista) return;
    // el ripio
    {
      const pos = [], nor = [], uv = [], ind = [];
      for (const c of CALLES_ALDEA) for (let s = 0; s < c.puntos.length - 1; s++) {
        const [ax, az] = c.puntos[s], [bx, bz] = c.puntos[s + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
        const filas = Math.max(2, Math.ceil(L / 1.5)), cols = 4, mitad = c.ancho / 2 + 0.5;
        const v0 = pos.length / 3;
        for (let f = 0; f <= filas; f++) for (let k = 0; k <= cols; k++) {
          const t = (L * f) / filas, o = -mitad + (2 * mitad * k) / cols;
          const w = aMundo(ax + ux * t - uz * o, az + uz * t + ux * o);
          const n = T.normal(w.x, w.z);
          pos.push(w.x - centro.x, alturaEn(w.x, w.z) + 0.035 - centroY, w.z - centro.z);
          nor.push(n.x, n.y, n.z);
          uv.push(k / cols, t / 6);
        }
        for (let f = 0; f < filas; f++) for (let k = 0; k < cols; k++) {
          const a = v0 + f * (cols + 1) + k, b = a + cols + 1;
          ind.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(ind);
      g.computeBoundingSphere();
      const malla = new THREE.Mesh(g, materiales.ripio);
      malla.position.set(centro.x, centroY, centro.z);
      malla.receiveShadow = true; malla.castShadow = false; malla.renderOrder = 1;
      malla.updateMatrix(); malla.matrixAutoUpdate = false;
      calles.raiz.add(malla); malla.updateMatrixWorld(true);
      calles.ripio = malla;
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
    rehacerAcometidas();
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
      const d = Math.hypot(cam.x - m.x, cam.z - m.z);
      for (const [capa, malla] of Object.entries(m.fusion?.mallas || {})) if (capa === 'estructura' || capa === 'follaje') malla.castShadow = d < SOMBRA_ALDEA + m.radio;
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
    const lejos = distAldea(cam.x, cam.z) > 520;
    for (const q of luces) {
      if (lejos) { q.luz.intensity = 0; continue; }
      const d = Math.hypot(cam.x - q.x, cam.z - q.z);
      // (los postes de luz cuelgan la lámpara a 5 m: necesitan más que un farol de 3 m)
      if (q.clase === 'farol') q.luz.intensity = d < 90 ? encendido * (q.alto > 4 ? 15 : 6) * q.intensidad : 0;
      else if (q.clase === 'fragua') q.luz.intensity = d < 30 ? 1.6 + 0.25 * Math.sin(performance.now() / 170) * Math.sin(performance.now() / 410) : 0;
      else {
        q.luz.intensity = d < 18 ? relleno * 0.7 * q.intensidad + encendido * 1.5 : 0;
        if (q.luz.intensity > 0) q.luz.color.copy(colorInterior).lerp(q.color, Math.min(1, 0.35 + encendido));
      }
    }
  }
  // ¿Adentro de un edificio de la aldea (bajo su techo, entre sus paredes)? Devuelve el edificio.
  function edificioEn(pos, galeria) {
    if (!pos || distAldea(pos.x, pos.z) > 150) return null;
    for (const b of edificios.values()) {
      if (!b.techo) continue;
      const s = b.sitio, dx = pos.x - s.x, dz = pos.z - s.z, c = Math.cos(s.rot), sn = Math.sin(s.rot);
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
    const todas = [...chimeneas, ...base.filter((c) => c && Math.hypot(c.x - cam.x, c.z - cam.z) < 260)];
    todas.sort((a, b) => Math.hypot(a.x - cam.x, a.z - cam.z) - Math.hypot(b.x - cam.x, b.z - cam.z));
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
    centro, accesorios, emparejado: () => emparejado, aMundo: (lx, lz) => aMundo(lx, lz), fabrica: () => fabrica.stats,
  };
}
