// 3.8.8 · Economía, Fase 3: trabajos con sueldo. Los vecinos con local te dan una changa: una tarea del oficio por día por
// local (un jornal), con un cupo de dos jornales por día en total. El sueldo sale de la caja del local (si no tiene, hoy no
// puede pagarte) y sube con tu habilidad en ese oficio (cada tres jornales, un 10 % más, hasta el 50 %) y con la demanda del
// pueblo (aldea-viva.js). Módulo puro, sin imports de la aldea: `servicioDe` (aldea.js) lo consulta cuando el vecino no tiene otra cosa
// para ofrecerte. Sólo en el Relax.
import { negociosDe, caja, TOPE_CAJA } from './negocios.js';
import { cobrar, formatoPesos, hayEconomia } from './economia.js';
import { turnosDelDia } from './empleo.js';

export const JORNAL = { porDia: 2, hechosPorNivel: 3, nivelMax: 5, porNivel: 0.1, redondeo: 50 };

// Lo que hace cada uno: la tarea (lo que le ayudás), lo que paga de base y cómo se lo cuenta
export const TRABAJOS = {
  carpintero: { base: 1100, tarea: 'apilar tablas en el aserradero', pide: 'Si me ayudás a apilar las tablas del aserradero, te pago el jornal.' },
  panadera: { base: 900, tarea: 'amasar y repartir la tanda', pide: 'Me vendría bien una mano con la masa y con el reparto del pan.' },
  herrero: { base: 1300, tarea: 'dar fuelle en la fragua', pide: 'Dame una mano con el fuelle de la fragua y juntamos unos pesos para vos.' },
  pescador: { base: 1000, tarea: 'remendar las redes', pide: '¿Me ayudás a remendar redes? Es aburrido pero se paga.' },
  maestra: { base: 800, tarea: 'corregir cuadernos y ordenar la biblioteca', pide: 'Hay cuadernos para corregir y libros para ordenar: si me ayudás, te pago el jornal.' },
  enfermera: { base: 1000, tarea: 'preparar vendas y ordenar el botiquín', pide: 'Necesito manos para hervir vendas y ordenar el botiquín.' },
  telegrafista: { base: 900, tarea: 'copiar partes y llevar mensajes', pide: 'Se me juntaron mensajes para copiar y llevar. ¿Me ayudás?' },
  tejedora: { base: 1000, tarea: 'devanar lana y armar madejas', pide: 'Ayudame a devanar lana y armar madejas, que sola no llego.' },
  apicultor: { base: 1200, tarea: 'revisar las colmenas y cosechar cuadros', pide: 'Hoy toca revisar colmenas y sacar cuadros. ¿Te animás a ayudarme?' },
  guardaparque: { base: 1100, tarea: 'marcar senderos y contar huellas', pide: 'Hay senderos para marcar y huellas para contar: tengo con qué pagarte el día.' },
  musico: { base: 700, tarea: 'afinar y cargar los instrumentos', pide: 'Voy a necesitar a alguien que cargue y afine instrumentos. Se paga.' },
  veterinaria: { base: 1200, tarea: 'sostener animales y limpiar el consultorio', pide: 'Tengo un día de pacientes: necesito alguien que sostenga y limpie.' },
  herbolaria: { base: 900, tarea: 'secar hierbas y armar atados', pide: 'Hay hierbas para secar y atar. Te pago el jornal.' },
  modista: { base: 1000, tarea: 'marcar telas y pegar botones', pide: 'Ayudame con las telas: marcar, cortar, pegar botones.' },
  botera: { base: 1200, tarea: 'lijar y calafatear un casco', pide: 'Este casco hay que lijarlo y calafatearlo. ¿Me das una mano?' },
  pintora: { base: 800, tarea: 'preparar telas y moler pigmentos', pide: 'Preparar telas y moler pigmentos es lo que más me lleva: ¿me ayudás?' },
  andinista: { base: 1300, tarea: 'revisar cuerdas y armar mochilas', pide: 'Hay que revisar las cuerdas y armar las mochilas de la próxima salida.' },
  fotografa: { base: 900, tarea: 'revelar y secar copias', pide: 'Hay copias para revelar y secar. Con dos manos, el doble de rápido.' },
  ceramista: { base: 1000, tarea: 'amasar barro y cargar el horno', pide: 'Hay barro para amasar y el horno para cargar: te pago el jornal.' },
  astronoma: { base: 900, tarea: 'limpiar lentes y anotar mediciones', pide: 'Limpiar lentes y anotar mediciones: trabajo fino, bien pago.' },
};
export const hayTrabajo = (k) => typeof k === 'string' && Object.hasOwn(TRABAJOS, k);

export const nivelOficio = (p, k) => Math.min(JORNAL.nivelMax, Math.floor((negociosDe(p)?.oficio?.[k] || 0) / JORNAL.hechosPorNivel));
export const jornalesHoy = (p, dia) => { const h = negociosDe(p)?.hoy; return h && h.dia === dia ? h.jornales : 0; };
// Lo que te paga hoy: base × habilidad × demanda, redondeado
export function sueldoDe(p, k, demanda = 1) {
  if (!hayTrabajo(k)) return 0;
  const m = (1 + JORNAL.porNivel * nivelOficio(p, k)) * (Number.isFinite(demanda) && demanda > 0 ? demanda : 1);
  return Math.max(JORNAL.redondeo, Math.round((TRABAJOS[k].base * m) / JORNAL.redondeo) * JORNAL.redondeo);
}
// ¿Podés trabajar hoy con él?: { ok, sueldo } o { ok: false, motivo: 'ya' | 'cupo' | 'caja' | 'nada' }
export function puedeTrabajar(p, k, dia, demanda = 1) {
  if (!hayEconomia(p) || !hayTrabajo(k)) return { ok: false, motivo: 'nada' };
  const n = negociosDe(p);
  if (n.jornal[k] === dia) return { ok: false, motivo: 'ya' };
  // 4.3: el turno del empleo fijo ocupa uno de los dos jornales del día (turno + un jornal ≈ lo de dos jornales y medio de antes)
  if (jornalesHoy(p, dia) + turnosDelDia(p, dia) >= JORNAL.porDia) return { ok: false, motivo: 'cupo' };
  const sueldo = sueldoDe(p, k, demanda);
  if (caja(p, k) < sueldo) return { ok: false, motivo: 'caja', sueldo };
  return { ok: true, sueldo };
}
// El jornal hecho: cobra, baja la caja del local, sube la habilidad y anota el cupo. Devuelve { ok, sueldo }
export function cumplirJornal(p, k, dia, nombre = '', demanda = 1) {
  const v = puedeTrabajar(p, k, dia, demanda);
  if (!v.ok) return v;
  const n = negociosDe(p);
  n.cajas[k] = Math.max(0, Math.min(TOPE_CAJA, caja(p, k) - v.sueldo));
  n.oficio[k] = (n.oficio[k] || 0) + 1;
  n.jornal[k] = dia;
  n.hoy = n.hoy.dia === dia ? n.hoy : { dia, jornales: 0, pedidos: 0 };
  n.hoy.jornales++;
  cobrar(p, v.sueldo, `Jornal: ${TRABAJOS[k].tarea}`, nombre);
  return { ok: true, sueldo: v.sueldo };
}
// Lo que dice el vecino: { partes, seguir?, efectos?, titulo? } (el formato de `servicioDe`), o null si no hay nada que decir
export function ofertaDeJornal(p, k, dia, nombre = '', demanda = 1, seguir = '') {
  if (!hayEconomia(p) || !hayTrabajo(k)) return null;
  const t = TRABAJOS[k];
  const v = puedeTrabajar(p, k, dia, demanda);
  if (!v.ok) {
    if (v.motivo === 'ya') return { partes: ['Por hoy ya me ayudaste. Gracias: mañana te tengo otro jornal.'] };
    if (v.motivo === 'cupo') return { partes: ['Hoy ya trabajaste por dos. Descansá un poco: mañana hay más.'] };
    if (v.motivo === 'caja') return { partes: ['Hoy no tengo con qué pagarte un jornal: la caja está vacía. Cuando venda algo, vuelvo a llamarte.'] };
    return null;
  }
  const nivel = nivelOficio(p, k);
  const sube = nivel > 0 ? ` Ya sabés del oficio: te pago ${Math.round(nivel * JORNAL.porNivel * 100)} % más.` : '';
  return {
    partes: [t.pide, `Son ${formatoPesos(v.sueldo)} por el jornal.${sube}`],
    seguir,
    efectos: [{ tipo: 'jornal', k, n: v.sueldo, motivo: `Jornal: ${t.tarea}`, con: nombre }],
    titulo: `Jornal cumplido: ${formatoPesos(v.sueldo)}`,
  };
}
