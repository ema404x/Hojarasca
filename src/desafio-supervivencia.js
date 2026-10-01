// 3.0: la supervivencia sin fin.
//
// Una sola vida y ninguna noche final: la nave sigue bajando mientras aguantes. Hasta la
// noche 19 es la campaña de siempre (la misma composición y la misma dureza); desde ahí
// no baja la nodriza sino más de lo mismo, cada vez peor:
//   · los que vienen se van corriendo hacia los pesados (brutos, escupidores, excavadores,
//     voladores), porque la cantidad ya no puede crecer mucho más (el tope de la nave);
//   · pegan y aguantan más, pero cada vez crece menos y hay un techo: la noche 200 tiene
//     que ser muy difícil, no imposible por una cuenta que se fue al infinito;
//   · el jefe sigue bajando cada cinco noches, y las noches especiales siguen saliendo
//     (más seguido después de la veinte).
// Caer termina la corrida. Queda un récord (noches resistidas, abatidos y la fecha): los
// diez mejores de todas y los diez mejores de cada código.
//
// Módulo puro (sin THREE ni DOM). Se guarda en su propia ranura (guardado.js): una
// corrida nunca pisa la campaña.
import { composicionOleada, multiplicadorNoche, esNocheDeJefe, NOCHE_FINAL, sinJefe, dificultad } from './desafio-reglas.js';
import { normalizarCodigo } from './semilla.js';

export const SIN_FIN = {
  desde: NOCHE_FINAL,          // la campaña llega hasta acá; desde acá escala sola
  topeInvasores: 24,           // lo que entra en la nave (MAX_ALIENS de desafio.js)
  cadaPesado: 3,               // cada tantas noches, un rastreador se vuelve de los pesados
  minimoRastreadores: 3,       // siempre quedan algunos de los rápidos
  sumaMultiplicador: 1.6,      // lo más que se suma a la dureza de la noche 20 (techo)
  escalaMultiplicador: 30,     // cuántas noches tarda en llegar a dos tercios del techo
  especial: 0.38,              // la chance de noche especial en la campaña…
  especialMax: 0.55,           // …y la que alcanza de a poco en la corrida larga
  topeRecords: 10,
  topeCodigos: 60,
};
// El orden en que los rápidos se vuelven pesados, de a uno.
const PESADOS = ['bruto', 'escupidor', 'volador', 'bruto', 'excavador', 'tirador'];
const TECHO_TIPO = { bruto: 8, escupidor: 6, volador: 5, excavador: 4, tirador: 7 };

const nocheDe = (n) => Math.max(1, Math.floor(Number.isFinite(Number(n)) ? Number(n) : 1));

// Hasta la noche 19 es exactamente composicionOleada. Después, la misma de la noche 19
// (sin el jefe) con un invasor más cada dos noches hasta el tope, y los rápidos que se
// vuelven pesados. El jefe baja las noches de jefe, siempre último y uno solo.
export function composicionSinFin(n, claveDificultad = 'normal', vuelta = 0) {
  const noche = Math.min(1e6, nocheDe(n));
  if (noche < SIN_FIN.desde) return composicionOleada(noche, claveDificultad, vuelta);
  const pasadas = noche - (SIN_FIN.desde - 1);
  const lista = sinJefe(composicionOleada(SIN_FIN.desde - 1, claveDificultad, vuelta));
  const jefe = esNocheDeJefe(noche);
  // el tope sigue a la dificultad: en la tranquila la nave trae menos
  const tope = Math.max(lista.length, Math.min(SIN_FIN.topeInvasores, Math.round(SIN_FIN.topeInvasores * dificultad(claveDificultad).cantidad))) - (jefe ? 1 : 0);
  // más cantidad, de a poco, hasta el tope
  const mas = Math.floor(pasadas / 2);
  for (let i = 0; i < mas && lista.length < tope; i++) lista.push(i % 3 === 2 ? 'tirador' : 'rastreador');
  // los rápidos se vuelven pesados, de a uno, cada tantas noches (con techo por tipo:
  // una noche de puros brutos no se juega, se padece)
  const cambios = Math.min(60, Math.floor(pasadas / SIN_FIN.cadaPesado));
  const cuantos = (t) => lista.reduce((n, x) => n + (x === t ? 1 : 0), 0);
  for (let i = 0, hechos = 0; hechos < cambios && i < cambios + PESADOS.length * 2; i++) {
    const pesado = PESADOS[i % PESADOS.length];
    if (cuantos(pesado) >= TECHO_TIPO[pesado]) continue;
    const liviano = cuantos('rastreador') > SIN_FIN.minimoRastreadores ? 'rastreador' : cuantos('saltador') > 1 ? 'saltador' : null;
    if (!liviano) break;
    lista[lista.indexOf(liviano)] = pesado;
    hechos++;
  }
  while (lista.length > tope) lista.pop();
  // agrupados como en la campaña: primero los rápidos, después los pesados
  const orden = ['rastreador', 'bruto', 'tirador', 'saltador', 'escupidor', 'excavador', 'volador'];
  lista.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
  if (jefe) lista.push('jefe');
  return lista;
}

// Dureza (vida y daño) de la noche. Hasta la 19 es la de siempre; después crece con una
// curva que se aplana: nunca pasa de la de la noche 20 más `sumaMultiplicador`.
export function multiplicadorSinFin(n) {
  const noche = nocheDe(n);
  if (noche < SIN_FIN.desde) return multiplicadorNoche(noche);
  const base = multiplicadorNoche(SIN_FIN.desde);
  const pasadas = Math.min(1e6, noche - SIN_FIN.desde);
  return base + SIN_FIN.sumaMultiplicador * (1 - Math.exp(-pasadas / SIN_FIN.escalaMultiplicador));
}
export function techoSinFin() { return multiplicadorNoche(SIN_FIN.desde) + SIN_FIN.sumaMultiplicador; }

// Noche especial sin noche final: desde la 4, nunca dos seguidas, nunca con el jefe. Las
// franjas son las de `nocheEspecial` (roja, eclipse, silenciosa y, arriba, el apagón),
// y después de la 20 la chance sube de a poco.
export function especialSinFin(n, azar = Math.random(), anterior = null) {
  const noche = nocheDe(n);
  if (noche < 4 || anterior || esNocheDeJefe(noche)) return null;
  const a = Number.isFinite(Number(azar)) ? Math.min(0.999999, Math.max(0, Number(azar))) : 0.99;
  const extra = noche < SIN_FIN.desde ? 0 : Math.min(SIN_FIN.especialMax - SIN_FIN.especial, (noche - SIN_FIN.desde) * 0.006);
  const tope = SIN_FIN.especial + extra;
  if (a > tope) return null;
  // se estira la franja para que las cuatro sigan en la misma proporción
  const x = a * (0.38 / tope);
  if (x > 0.3) return 'apagon';
  const claves = ['roja', 'eclipse', 'silenciosa'];
  return claves[Math.min(claves.length - 1, Math.floor((x / 0.3) * claves.length))];
}

// ---------------------------------------------------------------- la corrida
// `d.sinFin` en la partida (sanearDesafio lo sanea): null en la campaña.
export function corridaNueva() { return { terminada: false }; }

// ---------------------------------------------------------------- los récords
// { general: [ {noches, abatidos, fecha, codigo, dificultad} × 10 ], porCodigo: { 'COIHUE-4821': [× 10] } }
const DIFICULTADES = ['tranquila', 'normal', 'implacable'];
function sanearEntrada(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const ent = (v) => Math.max(0, Math.min(1e6, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0)));
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(r.fecha || '')) ? String(r.fecha) : '';
  return { noches: ent(r.noches), abatidos: ent(r.abatidos), fecha, codigo: normalizarCodigo(r.codigo), dificultad: DIFICULTADES.includes(r.dificultad) ? r.dificultad : 'normal' };
}
// Mejor = más noches; a igualdad, más abatidos; a igualdad, la más vieja (llegó primero).
export function comparar(a, b) {
  return b.noches - a.noches || b.abatidos - a.abatidos || (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
}
function ordenarLista(v) {
  return (Array.isArray(v) ? v : []).slice(0, 200).map(sanearEntrada).filter(Boolean).sort(comparar).slice(0, SIN_FIN.topeRecords);
}
export function sanearRecordsSinFin(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const porCodigo = {};
  const pc = x.porCodigo && typeof x.porCodigo === 'object' && !Array.isArray(x.porCodigo) ? x.porCodigo : {};
  for (const [k, lista] of Object.entries(pc).slice(-SIN_FIN.topeCodigos)) {
    const c = normalizarCodigo(k);
    if (!c || !Object.hasOwn(pc, k)) continue;
    const l = ordenarLista(lista).map((r) => ({ ...r, codigo: c }));
    if (l.length) porCodigo[c] = l;
  }
  return { general: ordenarLista(x.general), porCodigo };
}
// Anota una corrida terminada. Devuelve el puesto (1..10, o 0 si no entró) en la lista
// general y en la del código. No cambia `records`: devuelve los nuevos.
export function registrarCorrida(records, entrada) {
  const r = sanearRecordsSinFin(records);
  const e = sanearEntrada(entrada);
  if (!e) return { records: r, puesto: 0, puestoCodigo: 0 };
  const meter = (lista) => {
    const l = [...lista, e].sort(comparar);
    const i = l.indexOf(e);
    return { lista: l.slice(0, SIN_FIN.topeRecords), puesto: i < SIN_FIN.topeRecords ? i + 1 : 0 };
  };
  const g = meter(r.general);
  r.general = g.lista;
  let puestoCodigo = 0;
  if (e.codigo) {
    const previa = Object.hasOwn(r.porCodigo, e.codigo) ? r.porCodigo[e.codigo] : [];
    const c = meter(previa);
    delete r.porCodigo[e.codigo];   // el último que se jugó queda al final (los viejos se caen primero)
    r.porCodigo[e.codigo] = c.lista;
    puestoCodigo = c.puesto;
    const claves = Object.keys(r.porCodigo);
    for (const k of claves.slice(0, Math.max(0, claves.length - SIN_FIN.topeCodigos))) delete r.porCodigo[k];
  }
  return { records: r, puesto: g.puesto, puestoCodigo };
}
export function listaDeCodigo(records, codigo) {
  const c = normalizarCodigo(codigo);
  return c && records?.porCodigo && Object.hasOwn(records.porCodigo, c) ? records.porCodigo[c] : [];
}

// ---------------------------------------------------------------- textos
export function textoNoches(n) { return `${n} ${n === 1 ? 'noche' : 'noches'}`; }
export function lineaRecord(r, i) {
  const dif = r.dificultad && r.dificultad !== 'normal' ? ` · ${r.dificultad}` : '';
  return `${i + 1}. ${textoNoches(r.noches)} · ${r.abatidos} abatidos${r.codigo ? ` · ${r.codigo}` : ''}${dif}${r.fecha ? ` · ${r.fecha}` : ''}`;
}
// Lo que dice la pantalla de la corrida terminada.
export function resumenCorrida({ noches = 0, abatidos = 0, codigo = null, puesto = 0, puestoCodigo = 0 } = {}) {
  const titulo = noches === 0 ? 'No llegaste al amanecer' : `Resististe ${textoNoches(noches)}`;
  const partes = [`${abatidos} ${abatidos === 1 ? 'invasor abatido' : 'invasores abatidos'}`];
  if (codigo) partes.push(`código ${codigo}`);
  let lugar = '';
  if (puesto === 1) lugar = '¡Tu mejor corrida!';
  else if (puesto) lugar = `Quedó ${puesto}.ª entre tus diez mejores.`;
  if (codigo && puestoCodigo === 1 && puesto !== 1) lugar += `${lugar ? ' ' : ''}Tu mejor corrida con este código.`;
  else if (codigo && puestoCodigo && puesto !== 1) lugar += `${lugar ? ' ' : ''}${puestoCodigo}.ª con este código.`;
  return { titulo, sub: partes.join(' · '), lugar };
}
