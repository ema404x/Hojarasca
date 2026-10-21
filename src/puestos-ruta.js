// 4.6: los puestos de ruta (paquete 1a del mapa, ver PLAN_MAPA_VALOR.md y AUDITORIA_MAPA_VALOR.md). Cuatro puestos viejos, ya en el mapa y
// abandonados, lejos del pueblo y del refugio: el de la Cantera (A, suroeste), el del Paso (B, oeste, junto a la vía), el de la Estepa
// (C, este) y el del Riel Sur (D, sureste, que además es parada de la trochita). Cada uno:
//   · arranca ABANDONADO (tablas caídas, techo hundido, fogón apagado) y se REPARA pagando, en tres etapas de $3.000 cada una más
//     10 tablas y 10 piedras en total (repartidas por etapa), con la maquinaria de pesos de la 4.2 (obra-pesos.js). Cada etapa se ve;
//   · reparado, da DESCANSO (el catre bajo techo, con la salamandra: duerme como en una casa con confort), FOGÓN (se prende con F,
//     con la misma leña que el del refugio) y DEPÓSITO (las reglas de la barraca de almacen.js: 40 de cada material);
//   · y COMPRA Y VENDE con precios propios (los perfiles de comercio.js y el mercado de mercado.js), con una caja de $5.000 que se repone
//     $700 por día. El del Riel Sur lo atiende el panel de la trochita (con fletes); los otros tres, el mismo panel sin fletes.
// Las coordenadas son FIJAS (no dependen de la calidad gráfica, como el refugio o el mirador). Módulo puro (sin three ni DOM): se prueba en
// Node. Sólo en el Relax. Lo visual está en puestos-ruta-mundo.js y la tecla E y el aviso en puestos-ruta-juego.js.
import { registrarPrecios, puedePagarEtapa, pagarEtapa, precioDeEtapa } from './obra-pesos.js';
import { almacenNuevo, sanearAlmacen, guardar as guardarEnAlmacen, sacar as sacarDeAlmacen, libreDe, guardadoDe, totalGuardado, resumen as resumenAlmacen, cuantosDe, nombreDe, ALMACENES } from './almacen.js';
import { tienda, cajaMaxima } from './mercado.js';
import { formatoPesos, hayEconomia } from './economia.js';

// ---------------------------------------------------------------- los cuatro puestos
// `pos`: el centro de la casilla (x, z); `rot`: hacia dónde mira el frente (la puerta), como el `rotation.y` de three: el frente (+z local)
// mira a (sen rot, cos rot). `nombre` es también el del puesto en el mercado (comercio.js tiene su perfil, con la caja de $5.000).
// (A: corrido 3,5 m de la vía, al lado del claro; B: 8,5 m al este de la vía, como se decidió; D: 9,4 m al sureste del riel, detrás del andén)
export const PUESTOS_RUTA = {
  A: { id: 'A', nombre: 'Puesto de la Cantera', el: 'el puesto de la cantera', pos: { x: -322.88, z: -290.03 }, rot: 0.96, quien: 'El capataz de la cantera', parada: false },
  B: { id: 'B', nombre: 'Puesto del Paso', el: 'el puesto del paso', pos: { x: -343.3, z: -21 }, rot: -1.57, quien: 'El baqueano del paso', parada: false },
  C: { id: 'C', nombre: 'Puesto de la Estepa', el: 'el puesto de la estepa', pos: { x: 320, z: 80 }, rot: -2.96, quien: 'El puestero de la estepa', parada: false },
  D: { id: 'D', nombre: 'Puesto del Riel Sur', el: 'el puesto del riel sur', pos: { x: 295.92, z: -230.89 }, rot: -0.94, quien: 'El guardavía del riel sur', parada: true },
};
export const IDS_PUESTOS = Object.keys(PUESTOS_RUTA);
export const esPuesto = (id) => typeof id === 'string' && Object.hasOwn(PUESTOS_RUTA, id);
export const puestoPorNombre = (nombre) => IDS_PUESTOS.find((id) => PUESTOS_RUTA[id].nombre === nombre) || null;

// La casilla (en metros, en su marco local: x a lo ancho, z hacia el frente) y dónde queda cada cosa alrededor
export const CASILLA = { ancho: 4.6, fondo: 3.4, altoFrente: 2.3, altoFondo: 1.9, puerta: 0.95 };
const LOCAL = {
  centro: [0, 0],
  puerta: [0, CASILLA.fondo / 2 + 0.8],         // afuera, frente a la puerta
  mostrador: [-1.35, CASILLA.fondo / 2 + 0.85], // la ventanilla del frente, a la izquierda de la puerta
  banco: [1.35, CASILLA.fondo / 2 + 0.42],      // contra la pared del frente, a la derecha de la puerta
  fogon: [3.3, CASILLA.fondo / 2 + 1.9],        // adelante a la derecha
  tronco: [4.35, CASILLA.fondo / 2 + 2.75],     // el tronco para sentarse junto al fogón
  deposito: [-4.8, 0.2],                        // del lado abierto del alero del depósito (a la izquierda, lejos de la ventanilla)
  catre: [1.45, -0.85],                         // adentro, al fondo a la derecha
  cartel: [-3.4, CASILLA.fondo / 2 + 2.4],
};
export const PUNTOS = Object.keys(LOCAL);
// Del marco local del puesto al mundo
export function aMundo(id, lx, lz) {
  const P = PUESTOS_RUTA[id];
  if (!P) return null;
  const c = Math.cos(P.rot), s = Math.sin(P.rot);
  return { x: P.pos.x + lx * c + lz * s, z: P.pos.z - lx * s + lz * c };
}
// Del mundo al marco local
export function aLocal(id, x, z) {
  const P = PUESTOS_RUTA[id];
  if (!P) return null;
  const c = Math.cos(P.rot), s = Math.sin(P.rot), dx = x - P.pos.x, dz = z - P.pos.z;
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}
// Un punto del puesto en el mundo ('puerta', 'mostrador', 'fogon', 'deposito', 'catre', 'banco', 'tronco', 'cartel', 'centro').
// (Para la gente que vive en el puesto, p. ej. el arriero en el B: `puntoDe('B', 'puerta')`.)
export function puntoDe(id, cual) {
  if (!esPuesto(id) || !Object.hasOwn(LOCAL, cual)) return null;
  return aMundo(id, LOCAL[cual][0], LOCAL[cual][1]);
}
export const puntosDe = (id) => Object.fromEntries(PUNTOS.map((k) => [k, puntoDe(id, k)]));
// ¿Adentro de la casilla? (entre las cuatro paredes)
export function adentro(id, x, z) {
  const l = aLocal(id, x, z);
  return !!l && Math.abs(l.x) < CASILLA.ancho / 2 - 0.1 && Math.abs(l.z) < CASILLA.fondo / 2 - 0.1;
}
// El puesto más cercano a menos de `radio` metros: { id, d } o null
export function puestoCerca(pos, radio = 8) {
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return null;
  let mejor = null;
  for (const id of IDS_PUESTOS) {
    const P = PUESTOS_RUTA[id], d = Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z);
    if (d < radio && (!mejor || d < mejor.d)) mejor = { id, d };
  }
  return mejor;
}

// ---------------------------------------------------------------- la reparación
// Tres etapas de $3.000; entre las tres, 10 tablas y 10 piedras. Cada una cambia lo que se ve (ver puestos-ruta-mundo.js).
export const ETAPAS_PUESTO = [
  { nombre: 'paredes y puerta', hecho: 'Las paredes están enteras y la puerta cierra', pide: { tabla: 5, piedra: 2 }, pesos: 3000 },
  { nombre: 'techo y salamandra', hecho: 'El techo ya no se llueve y la salamandra tira', pide: { tabla: 3, piedra: 3 }, pesos: 3000 },
  { nombre: 'fogón, catre y depósito', hecho: 'Se puede dormir, prender el fogón, guardar y comerciar', pide: { tabla: 2, piedra: 5 }, pesos: 3000 },
];
export const ETAPAS_TOTAL = ETAPAS_PUESTO.length;
export const CAJA_PUESTO = 5000;   // la caja del puesto (comercio.js: perfil con `caja`); se repone $700 por día (MERCADO.cajaDia)
export const idPrecioPuesto = (id) => `puesto-ruta-${id}`;
for (const id of IDS_PUESTOS) {
  const n = PUESTOS_RUTA[id].nombre.toLowerCase();
  registrarPrecios(idPrecioPuesto(id), ETAPAS_PUESTO.map((e) => e.pesos), {
    nombre: n, motivoPago: `Reparación: ${n}`, motivoDevolucion: `Devolución de la reparación: ${n}`, motivoReintegro: `Reintegro: ${n}`,
    sujeto: 'La reparación', verbo: 'cuesta', deLoPagado: 'de la reparación', pagaA: 'Los peones del puesto', reintegro: 0,
  });
}

// ---------------------------------------------------------------- el estado guardado
// `progreso.puestosRuta = { A: { etapa, deposito, desde }, … }`: la etapa (0 abandonado … 3 reparado), lo guardado en su depósito
// ({ n, g } de almacen.js) y el día en que se terminó de reparar. La caja y los precios del puesto viven en el mercado
// (`progreso.comercio.mercado[nombre]`, ver mercado.js), como los de las paradas.
export const DEPOSITO = 'barraca';   // las reglas del depósito: las de la barraca de almacen.js (tronco, tabla, piedra y lana; 40 de cada uno)
const puestoNuevo = () => ({ etapa: 0, deposito: almacenNuevo(), desde: 0 });
export function puestosRutaNuevos() {
  return Object.fromEntries(IDS_PUESTOS.map((id) => [id, puestoNuevo()]));
}
const entero = (v, max) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
// Lo guardado, saneado: sólo los cuatro puestos (los buscados por nombre, con Object.hasOwn), etapa de 0 a 3, el depósito con las reglas de
// la barraca. Una partida de antes de la 4.6 no lo trae: los cuatro abandonados.
export function sanearPuestosRuta(v) {
  const limpio = puestosRutaNuevos();
  if (!objeto(v)) return limpio;
  for (const id of IDS_PUESTOS) {
    if (!Object.hasOwn(v, id) || !objeto(v[id])) continue;
    const x = v[id];
    // (el depósito del puesto no se amplía: siempre el tamaño de base de la barraca, 40 de cada cosa)
    limpio[id] = { etapa: entero(x.etapa, ETAPAS_TOTAL), deposito: { ...sanearAlmacen(x.deposito, DEPOSITO), n: 0 }, desde: entero(x.desde, 1e6) };
  }
  return limpio;
}
// El estado de un puesto en la partida (lo crea si falta: partida de antes)
export function estadoDe(p, id) {
  if (!p || !esPuesto(id)) return null;
  if (!objeto(p.puestosRuta)) p.puestosRuta = puestosRutaNuevos();
  if (!objeto(p.puestosRuta[id])) p.puestosRuta[id] = puestoNuevo();
  return p.puestosRuta[id];
}
export const etapaDe = (p, id) => entero(estadoDe(p, id)?.etapa, ETAPAS_TOTAL);
export const reparado = (p, id) => etapaDe(p, id) >= ETAPAS_TOTAL;
// La etapa que sigue: { indice, nombre, pide, pesos } o null si ya está reparado
export function proximaEtapa(p, id) {
  const i = etapaDe(p, id);
  if (!esPuesto(id) || i >= ETAPAS_TOTAL) return null;
  const e = ETAPAS_PUESTO[i];
  return { indice: i, nombre: e.nombre, hecho: e.hecho, pide: { ...e.pide }, pesos: hayEconomia(p) ? precioDeEtapa(idPrecioPuesto(id), i) : 0 };
}
// Lo que falta para la etapa que sigue, con lo que llevás (`materiales`: { tabla, piedra, … }): { materiales: ['2 tablas'], pago, ok }
export function faltaPara(p, id, materiales) {
  const s = proximaEtapa(p, id);
  if (!s) return { ok: false, materiales: [], pago: { ok: true, precio: 0 }, reparado: true };
  const lista = [];
  for (const [k, n] of Object.entries(s.pide)) {
    const tengo = entero(materiales?.[k], 1e7);
    if (tengo < n) lista.push(cuantosDe(n - tengo, k));
  }
  const pago = puedePagarEtapa(p, idPrecioPuesto(id), s.indice);
  return { ok: !lista.length && pago.ok, materiales: lista, pago };
}
// Hacer la etapa que sigue: cobra los pesos (obra-pesos.js), descuenta los materiales de `materiales` (el objeto de tus materiales, se
// modifica) y sube la etapa. Al terminar la última, el puesto abre con la caja llena. Devuelve { ok, etapa, reparado } o { ok: false, motivo, falta }
export function repararEtapa(p, id, materiales) {
  const s = proximaEtapa(p, id);
  if (!s) return { ok: false, motivo: 'reparado' };
  const f = faltaPara(p, id, materiales);
  if (!f.ok) return { ok: false, motivo: f.materiales.length ? 'materiales' : 'plata', falta: f };
  const pago = pagarEtapa(p, idPrecioPuesto(id), s.indice, 'Los peones del puesto');
  if (!pago.ok) return { ok: false, motivo: 'plata', falta: { ...f, pago } };
  for (const [k, n] of Object.entries(s.pide)) materiales[k] = Math.max(0, entero(materiales[k], 1e7) - n);
  const e = estadoDe(p, id);
  e.etapa = Math.min(ETAPAS_TOTAL, s.indice + 1);
  if (e.etapa >= ETAPAS_TOTAL) { e.desde = Math.max(1, entero(p.dia, 1e6)); abrirCaja(p, id); }
  return { ok: true, etapa: e.etapa, reparado: e.etapa >= ETAPAS_TOTAL, pagado: pago.precio || 0, nombre: s.nombre, hecho: s.hecho };
}
// El puesto recién reparado abre con la caja llena ($5.000); después se repone sola $700 por día (mercado.js)
export function abrirCaja(p, id) {
  if (!p || !esPuesto(id) || !objeto(p.comercio)) return null;
  const nombre = PUESTOS_RUTA[id].nombre;
  const t = tienda(p.comercio, nombre, p.dia);
  if (t) t.caja = cajaMaxima(nombre);
  return t;
}

// ---------------------------------------------------------------- el depósito
export const depositoDe = (p, id) => { const e = estadoDe(p, id); if (!e) return null; if (!objeto(e.deposito)) e.deposito = almacenNuevo(); return e.deposito; };
export const GUARDA = ALMACENES[DEPOSITO].guarda;
// Guarda en el depósito lo que llevás de cada cosa que entra (hasta el tope): devuelve { guardado: { k: n }, sobra: [k] }
export function guardarEnPuesto(p, id, materiales) {
  const a = depositoDe(p, id), guardado = {}, sobra = [];
  if (!a || !reparado(p, id)) return { guardado, sobra };
  for (const k of GUARDA) {
    const tengo = entero(materiales?.[k], 1e7);
    if (!tengo) continue;
    const n = guardarEnAlmacen(DEPOSITO, a, k, tengo);
    if (n > 0) { materiales[k] = tengo - n; guardado[k] = n; }
    if (materiales[k] > 0 && libreDe(DEPOSITO, a, k) <= 0) sobra.push(k);
  }
  return { guardado, sobra };
}
// Saca todo lo guardado y lo suma a `materiales`: devuelve { k: n }
export function sacarDePuesto(p, id, materiales) {
  const a = depositoDe(p, id), sacado = {};
  if (!a) return sacado;
  for (const k of GUARDA) {
    const n = sacarDeAlmacen(DEPOSITO, a, k);
    if (n > 0) { materiales[k] = entero(materiales[k], 1e7) + n; sacado[k] = n; }
  }
  return sacado;
}
export const resumenDeposito = (p, id) => resumenAlmacen(DEPOSITO, depositoDe(p, id), { soloLoQueHay: true });
export const hayEnDeposito = (p, id) => totalGuardado(DEPOSITO, depositoDe(p, id)) > 0;
export const enDeposito = (p, id, k) => guardadoDe(depositoDe(p, id), k);
export const enPalabras = (o) => Object.entries(o || {}).filter(([, n]) => n > 0).map(([k, n]) => cuantosDe(n, k)).join(' · ');
export const nombreMaterial = (k, n = 2) => nombreDe(k, n);

// ---------------------------------------------------------------- el descanso
// Dormir en el catre del puesto reparado: bajo techo y con la salamandra prendida por el puestero (como tu casa de la aldea, pero con lo
// justo: confort 6, que alcanza para amanecer descansado). Lo usa dormir() de main.js en vez de lo que dice estadoHabitat de una obra.
export const CASA_PUESTO = Object.freeze({ cubierta: true, habitable: true, calorFactor: 0.2, confortCasa: 6, cama: true });

// ---------------------------------------------------------------- los textos
const lista = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);
// «$3.000, 5 tablas y 2 piedras»
export function textoCosto(s) {
  if (!s) return '';
  const partes = [];
  if (s.pesos > 0) partes.push(formatoPesos(s.pesos));
  for (const [k, n] of Object.entries(s.pide)) partes.push(cuantosDe(n, k));
  return lista(partes);
}
// El aviso de la E junto a un puesto sin terminar: «Reparar el puesto (1 de 3: paredes y puerta) · $3.000, 5 tablas y 2 piedras»
export function textoReparar(p, id) {
  const s = proximaEtapa(p, id);
  if (!s) return '';
  return `Reparar ${PUESTOS_RUTA[id].el} (${s.indice + 1} de ${ETAPAS_TOTAL}: ${s.nombre}) · ${textoCosto(s)}`;
}
// Lo que falta, en palabras: «Faltan 2 tablas y $1.200»
export function textoFalta(f) {
  const xs = [...(f?.materiales || [])];
  if (f?.pago && f.pago.ok === false && f.pago.falta > 0) xs.push(formatoPesos(f.pago.falta));
  return xs.length ? `Faltan ${lista(xs)}` : '';
}
// Cómo está el puesto, en una línea (el cuaderno y el mapa)
export function textoEstado(p, id) {
  const e = etapaDe(p, id);
  if (e >= ETAPAS_TOTAL) return `${PUESTOS_RUTA[id].nombre}: reparado`;
  if (e === 0) return `${PUESTOS_RUTA[id].nombre}: abandonado`;
  return `${PUESTOS_RUTA[id].nombre}: reparándose (${e} de ${ETAPAS_TOTAL})`;
}
