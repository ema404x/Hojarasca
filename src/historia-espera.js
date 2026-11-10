// 4.21.0: la línea de espera del panel de la Historia («La Historia arranca bien»). Módulo PURO (sin three ni DOM; se prueba en Node).
//
// 27 objetivos de la Historia valen sólo en una ventana de hora (la guardia del molino, la noche de la nevada, el fogón de la aldea…) y el panel
// nunca decía que había que esperar ni que R acelera el reloj. Cuando lo único que le falta a un objetivo es que llegue la hora (o que pase
// la noche), el panel le agrega abajo una línea gris: «Falta esperar hasta las 17:00 (R te sienta y el reloj corre más rápido)».
//
// De dónde sale: el objetivo se cumple con una escena (la función `hecho` de `escena(id)` lleva anotado el id, o el objetivo trae `escena`) y la escena
// tiene disparadores con ventana de hora (`DISPARADORES[...].hora`). Si algún disparador de esa escena no tiene ventana, se puede cumplir a
// cualquier hora y no hay nada que esperar. Si falta otra cosa (una escena previa, un capítulo), tampoco: no es sólo la hora.
import { capituloActual, horaEntre, ACELERACION_ESPERA } from './historia.js';
import { DISPARADORES } from './historia-disparadores.js';

// La escena que cumple un objetivo (o null si se cumple de otra forma)
export function escenaDeObjetivo(o) {
  if (o && typeof o.escena === 'string') return o.escena;
  if (o && typeof o.hecho === 'function' && typeof o.hecho.escena === 'string') return o.hecho.escena;
  return null;
}

// Los disparadores de una escena que valen en el capítulo `capId`
export function disparadoresDe(escenaId, capId) {
  const r = [];
  for (const [k, d] of Object.entries(DISPARADORES)) {
    if ((d.escena || k) !== escenaId) continue;
    if (!(Array.isArray(d.cap) ? d.cap.includes(capId) : d.cap === capId)) continue;
    r.push(d);
  }
  return r;
}

const dosDigitos = (n) => String(n).padStart(2, '0');
// 17 → «17:00»; 0,5 → «0:30»; 21,5 → «21:30»
export function horaEnTexto(h) {
  const x = ((Number(h) % 24) + 24) % 24;
  let hh = Math.floor(x), mm = Math.round((x - hh) * 60);
  if (mm === 60) { hh = (hh + 1) % 24; mm = 0; }
  return `${hh}:${dosDigitos(mm)}`;
}

// Horas de juego hasta que empiece la ventana [a, b) desde la hora `h` (0 si ya estamos adentro)
export function horasHastaVentana(h, ventana) {
  if (!Array.isArray(ventana)) return 0;
  if (horaEntre(h, ventana[0], ventana[1])) return 0;
  const x = ((Number(h) % 24) + 24) % 24;
  return (((ventana[0] - x) % 24) + 24) % 24;
}

// La espera de un objetivo: { hasta: 'las 17:00' | 'mañana a las 5:30', horas, texto } o null si no hay nada que esperar.
// `h`: la historia, `s`: el estado (estadoHistoria), `o`: el objetivo. `hechos`: si ya está cumplido no hay espera.
export function esperaDeObjetivo(h, s, o) {
  if (!h || !s || !o) return null;
  const c = capituloActual(h);
  if (h.hechos?.[`${c.id}:${o.id}`] !== undefined) return null;
  const id = escenaDeObjetivo(o);
  if (!id || s.escenas?.has(id)) return null;
  const ds = disparadoresDe(id, c.id);
  if (!ds.length || ds.some((d) => !d.hora)) return null;   // sin ventana en alguno: se puede a cualquier hora
  // lo único que falta es la hora (o el día): lo estructural tiene que estar (las escenas previas y las que se excluyen)
  const listos = ds.filter((d) => (!d.requiere || d.requiere.every((x) => s.escenas.has(x))) && (!d.no || !d.no.some((x) => s.escenas.has(x))));
  if (!listos.length) return null;
  if (listos.some((d) => horaEntre(s.horas, d.hora[0], d.hora[1]) && !(d.despues && !(s.dia > (Number(h.base?.dia) || 1))))) return null;   // ya es la hora: lo que falta es otra cosa (el lugar, sentarse)
  // la espera más corta entre los disparadores que podrían abrirse
  const x = ((Number(s.horas) % 24) + 24) % 24;
  let mejor = null;
  for (const d of listos) {
    const inicio = ((d.hora[0] % 24) + 24) % 24;
    // con «después del día en que empezó el capítulo» hay que pasar la medianoche: la ventana vale desde mañana
    const esperaDia = !!d.despues && !(s.dia > (Number(h.base?.dia) || 1));
    const horas = esperaDia ? (24 - x) + inicio : horasHastaVentana(s.horas, d.hora);
    if (!mejor || horas < mejor.horas) mejor = { horas, inicio, esperaDia };
  }
  if (!mejor) return null;
  // «las 17:00» (hoy más tarde), «las 0:30 (de madrugada)» (después de medianoche) o «mañana a las 5:30»
  const hoy = mejor.inicio > x && !mejor.esperaDia;
  const hasta = hoy ? `las ${horaEnTexto(mejor.inicio)}` : mejor.inicio < 5 ? `las ${horaEnTexto(mejor.inicio)} (de madrugada)` : `mañana a las ${horaEnTexto(mejor.inicio)}`;
  return { hasta, horas: mejor.horas, texto: `Falta esperar hasta ${hasta} (R te sienta y el reloj corre más rápido)` };
}

// Las esperas del capítulo en curso: { [idObjetivo]: texto } (sólo los objetivos visibles y sin cumplir que esperan)
export function esperasDelCapitulo(h, s) {
  const r = {};
  if (!h?.activa || h.fase !== 'jugando' || !s) return r;
  const c = capituloActual(h);
  for (const o of c.objetivos) {
    if (o.visible && !o.visible(s)) continue;
    const e = esperaDeObjetivo(h, s, o);
    if (e) r[o.id] = e.texto;
  }
  return r;
}

// 4.25.2: las escenas que el panel manda a esperar sentado: las que cumplen un objetivo sin cumplir del capítulo en curso y sólo valen en una ventana de hora
// (todos sus disparadores de este capítulo tienen `hora`). Antes sólo la guardia del molino podía empezar con vos sentado y sólo ella frenaba el reloj:
// sentado a esperar la noche de la nevada, el reloj iba ×40, la ventana duraba 4 s reales y la escena no arrancaba porque estabas sentado.
export function escenasDeEspera(h, s) {
  const r = new Set();
  if (!h?.activa || h.fase !== 'jugando' || !s) return r;
  const c = capituloActual(h);
  for (const o of c.objetivos) {
    if (h.hechos?.[`${c.id}:${o.id}`] !== undefined) continue;
    const id = escenaDeObjetivo(o);
    if (!id || s.escenas?.has(id)) continue;
    const ds = disparadoresDe(id, c.id);
    if (ds.length && ds.every((d) => Array.isArray(d.hora))) r.add(id);
  }
  return r;
}
// 4.25.2: sentado, el reloj va a ×ACELERACION_ESPERA (no ×40) en la última hora antes de que se abra la ventana de una de esas escenas y mientras está abierta;
// el resto de la espera, rápido como siempre. Devuelve la aceleración tope (1 = sin freno), como `aceleracionDeEspera`.
export function frenoDeEspera(h, s) {
  if (!s?.sentado) return 1;
  const ids = escenasDeEspera(h, s);
  if (!ids.size) return 1;
  const c = capituloActual(h);
  for (const o of c.objetivos) {
    const id = escenaDeObjetivo(o);
    if (!id || !ids.has(id)) continue;
    if (disparadoresDe(id, c.id).some((d) => horaEntre(s.horas, d.hora[0], d.hora[1]))) return ACELERACION_ESPERA;
    const e = esperaDeObjetivo(h, s, o);
    if (e && e.horas <= 1) return ACELERACION_ESPERA;
  }
  return 1;
}
