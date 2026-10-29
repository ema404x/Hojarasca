// 4.17.0: cuándo y dónde se dispara cada escena del ACTO III de la Historia (capítulos 9 a 13: el invierno, la noche de la nevada y el epílogo), qué cambia en
// la partida cuando se ve y los objetos de historia del mundo del acto III. Módulo PURO (sin three ni DOM; se prueba en Node). Mismo formato que
// `historia-disparadores.js` y `historia-disparadores-acto2.js` (que junta estas tablas con las del acto I): ver el encabezado del primero.
//
// Regla de siempre: una escena que es objetivo se alcanza con la E sobre el vecino o el objeto, o llegando al lugar; ninguna traba un capítulo.
import { marcarTema, marcarEntrega, cambiarLazo, duendesDe, capituloActual, hacerTrato, pagarDeuda, necesitaPaces, esConvidado } from './historia.js';

const en = (nombre, radio) => [nombre, radio];
const diaVista = (h, id) => Math.max(0, Math.floor(Number(h?.escenas?.vistas && Object.hasOwn(h.escenas.vistas, id) ? h.escenas.vistas[id] : 0) || 0));
const diaHecho = (h, cap, obj) => Math.max(0, Math.floor(Number(h?.hechos?.[`${cap}:${obj}`]) || 0));
const enCap = (h, ...ids) => ids.includes(capituloActual(h).id);

// Los lugares nuevos de los que el juego pasa la distancia (los arma `puntosDeHistoria` de main.js): el galpón de la noche (tu galponcito o, si no
// hay, la puerta del refugio) y el Puesto del Paso (los blancos de paja de Belisario)
export const LUGARES_ACTO3 = ['galpon-noche', 'puesto-paso'];
// Lo que cuestan las dos entregas con plata y el costo en harina y tablas de la deuda del trato
export const PRECIO_PUNTAS = 400;
export const DEUDA_COSTO = { harina: 1, tabla: 6 };

export const DISPARADORES_ACTO3 = {
  // ---- capítulo 9 · Los primeros fríos
  'ramon-cama': { cap: 'frios', modo: 'auto', lugar: en('puesto', 14), hora: [8, 20] },
  'ramon-cama:hablar': { escena: 'ramon-cama', cap: 'frios', modo: 'hablar', clave: 'ramon' },
  'fermin-puerta': { cap: 'frios', modo: 'auto', requiere: ['ramon-cama'], lugar: en('puesto', 40), hora: [8, 20] },
  'hojas-canelo': { cap: 'frios', modo: 'auto', requiere: ['fermin-puerta'], lugar: en('puesto', 45), hora: [6, 12], cond: (s, h) => s.dia > diaVista(h, 'fermin-puerta') },
  // Ramón camina despacio con vos hasta la aldea (o, si pasan dos días, ya lo llevó Marta)
  'ramon-sanitario': { cap: 'frios', modo: 'auto', requiere: ['ramon-cama'], lugar: en('plaza', 60), hora: [8, 21], cond: (s, h) => s.acompanante === 'ramon' || s.dia >= diaVista(h, 'ramon-cama') + 2 },
  'papel-elsa': { cap: 'frios', modo: 'hablar', clave: 'guarda', requiere: ['ramon-cama'] },
  'ramon-chocolate': { cap: 'frios', modo: 'hablar', clave: 'ramon', requiere: ['ramon-sanitario'] },
  // ---- capítulo 10 · Golpeá antes de abrir
  'golpe': { cap: 'golpea', modo: 'interaccion', clave: 'puerta-galpon' },
  'encuentro': { cap: 'golpea', modo: 'auto', requiere: ['golpe'], lugar: en('galpon-noche', 22) },
  'cerro': { cap: 'golpea', modo: 'auto', requiere: ['encuentro'], lugar: en('mirador', 16), hora: [6, 12], cond: (s, h) => s.dia > diaVista(h, 'encuentro') },
  'mesa-guerra': { cap: 'golpea', modo: 'auto', requiere: ['cerro'], lugar: en('refugio', 35), hora: [16, 21], cond: (s) => s.mesa },
  'llave-79': { cap: ['golpea', 'arco'], modo: 'interaccion', clave: 'cajon-trabado', requiere: ['encuentro'], cond: (s) => s.llave79 && s.final == null && s.trato === 'trato' },
  'pedir-perdon': { cap: ['golpea', 'arco'], modo: 'interaccion', clave: 'raiz-perdon', requiere: ['encuentro'], cond: (s) => s.trato === 'pelea' && !s.perdon },
  // ---- capítulo 11 · El arco y la honda
  'carpinteria-arco': { cap: 'arco', modo: 'hablar', clave: 'carpintero', cond: (s, h) => diaHecho(h, 'arco', 'lenga') > 0 && s.dia > diaHecho(h, 'arco', 'lenga') },
  'cuerda-elvira': { cap: 'arco', modo: 'hablar', clave: 'tejedora', cond: (s) => s.lana >= 2 },
  'puntas-anselmo': { cap: 'arco', modo: 'hablar', clave: 'herrero', cond: (s) => s.pesos >= PRECIO_PUNTAS && !s.entregados.has('herrero:puntas') },
  'plumas-josefina': { cap: 'arco', modo: 'hablar', clave: 'ema', cond: (s) => s.lazos.ema >= 2 && s.plumas < 6 },
  'paces-fermin': { cap: 'arco', modo: 'hablar', clave: 'fermin', cond: (s) => necesitaPaces(s) && (s.harina >= 1 || s.yerba >= 1) },
  'honda-fermin': { cap: 'arco', modo: 'hablar', clave: 'fermin', cond: (s) => !necesitaPaces(s) || s.escenas.has('paces-fermin') },
  'prestado-anselmo': { cap: 'arco', modo: 'hablar', clave: 'herrero', cond: (s) => !s.prestado.herrero },
  'prestado-guido': { cap: 'arco', modo: 'hablar', clave: 'apicultor', cond: (s) => !s.prestado.apicultor },
  'prestado-martin': { cap: 'arco', modo: 'hablar', clave: 'martin', cond: (s) => !s.prestado.maquinista },
  'prestado-elsa': { cap: 'arco', modo: 'hablar', clave: 'guarda', cond: (s) => !s.prestado.guarda },
  'recorrer-lado': { cap: 'arco', modo: 'auto', lugar: en('galpon-noche', 28), hora: [16.5, 20.5], cond: (s) => s.prestadoN >= 3 },
  // ---- capítulo 12 · La noche de la nevada
  'ramon-guiso': { cap: 'nevada', modo: 'auto', lugar: en('refugio', 30), hora: [17, 22], cond: (s, h) => (Number(s.cocinadas) || 0) > (Number(h.base?.cocinadas) || 0) },
  'estacion-gente': { cap: 'nevada', modo: 'auto', lugar: en('estacion', 40), hora: [17, 22.5] },
  'espera': { cap: 'nevada', modo: 'auto', lugar: en('galpon-noche', 20), hora: [22, 23.6] },
  'cita-noche': { cap: 'nevada', modo: 'auto', no: ['espera'], lugar: en('refugio', 30), hora: [19, 22], cond: (s) => s.amor },
  'amanecer-trato-ganada': { cap: 'nevada', modo: 'auto', requiere: ['espera'], lugar: en('galpon-noche', 45), hora: [5.5, 11], cond: (s) => s.trato !== 'pelea' && s.nocheEstado === 'ganada' },
  'amanecer-trato-perdida': { cap: 'nevada', modo: 'auto', requiere: ['espera'], lugar: en('galpon-noche', 45), hora: [5.5, 11], cond: (s) => s.trato !== 'pelea' && s.nocheEstado === 'perdida' },
  'amanecer-pelea-ganada': { cap: 'nevada', modo: 'auto', requiere: ['espera'], lugar: en('galpon-noche', 45), hora: [5.5, 11], cond: (s) => s.trato === 'pelea' && s.nocheEstado === 'ganada' },
  'amanecer-pelea-perdida': { cap: 'nevada', modo: 'auto', requiere: ['espera'], lugar: en('galpon-noche', 45), hora: [5.5, 11], cond: (s) => s.trato === 'pelea' && s.nocheEstado === 'perdida' },
  // ---- capítulo 13 · El deshielo
  'carpeta': { cap: 'deshielo', modo: 'auto', lugar: en('estacion', 32), hora: [9, 20] },
  'majada-fin': { cap: 'deshielo', modo: 'auto', lugar: en('puesto', 22), hora: [8, 19] },
  'majada-fin:galpon': { escena: 'majada-fin', cap: 'deshielo', modo: 'auto', lugar: en('galpon', 22), hora: [8, 19] },
  'volver-a-subir': { cap: 'deshielo', modo: 'hablar', clave: 'ramon', requiere: ['majada-fin'], cond: (s) => s.decisiones.majada === 'c' },
  'josefina-fin': { cap: 'deshielo', modo: 'auto', lugar: en('coihue', 26), hora: [14, 20] },
  'umbral-fin': { cap: 'deshielo', modo: 'auto', requiere: ['carpeta', 'majada-fin', 'josefina-fin'], lugar: en('refugio-puerta', 16), hora: [6, 10.5], despues: true },
};
export const ESCENAS_ACTO3_IDS = Object.keys(DISPARADORES_ACTO3).map((k) => DISPARADORES_ACTO3[k].escena || k).filter((x, i, l) => l.indexOf(x) === i);
// las que no tienen escena escrita: se dan por vistas y sólo cambia la mecánica (con su aviso en pantalla)
export const ESCENAS_SIN_GUION_ACTO3 = ['estacion-gente'];

// ---------------------------------------------------------------- lo que cambia al ver una escena
// `ctx` (opcional): { dar(cosa, n), gastar(cosa, n), pagar(monto, motivo), tieneCaballo() } los pone el juego; sin ellos sólo cambia la partida guardada.
const T = (quien, tema) => (h, dia) => marcarTema(h, quien, tema, dia);
const juntar = (...fs) => (h, dia, ctx) => { for (const f of fs) f(h, dia, ctx); };
const entrega = (quien, cosa) => (h, dia) => marcarEntrega(h, quien, cosa, dia);
const prestado = (k) => (h) => { if (h.prestado) h.prestado[k] = true; };
const marcaVista = (id) => (h, dia) => marcarTema(h, 'escena', id, dia);
export const EFECTOS_ESCENA_ACTO3 = {
  'ramon-cama': juntar(T('ramon', 'cama'), (h) => { h.acompanante = 'ramon'; }),
  'fermin-puerta': T('fermin', 'majada'),
  'hojas-canelo': T('marta', 'canelo'),
  'ramon-sanitario': juntar(T('ramon', 'sanitario'), (h) => { if (h.acompanante === 'ramon') h.acompanante = null; }),
  'papel-elsa': T('guarda', 'papel'),
  'ramon-chocolate': T('ramon', 'chocolate'),
  'golpe': T('duendes', 'golpe'),
  // el encuentro: si la escena no tomó la decisión, la toma la tarjeta de respaldo; acá sólo se anota
  'encuentro': T('duendes', 'encuentro'),
  'cerro': T('duendes', 'cerro'),
  'mesa-guerra': T('mesa', 'guerra'),
  'llave-79': juntar(entrega('foto', 'eusebio'), T('ema', 'llave')),
  'pedir-perdon': (h) => { duendesDe(h).perdon = true; },
  'carpinteria-arco': juntar(entrega('tito', 'madera'), T('tito', 'arco')),
  'cuerda-elvira': (h, dia, ctx) => { entrega('tejedora', 'vellones')(h, dia); ctx?.gastar?.('lana', 2); },
  'puntas-anselmo': (h, dia, ctx) => { entrega('herrero', 'puntas')(h, dia); ctx?.pagar?.(PRECIO_PUNTAS, 'Doce puntas de flecha', 'Anselmo'); },
  'plumas-josefina': juntar(entrega('ema', 'plumas'), (h) => { cambiarLazo(h, 'ema', 1); }),
  'paces-fermin': (h, dia, ctx) => { entrega('fermin', 'regalo')(h, dia); T('fermin', 'paces')(h, dia); ctx?.gastar?.(ctx?.regalo?.() || 'harina', 1); cambiarLazo(h, 'fermin', 1); },
  'honda-fermin': T('fermin', 'honda'),
  'prestado-anselmo': juntar(prestado('herrero'), entrega('herrero', 'estacas')),
  'prestado-guido': juntar(prestado('apicultor'), entrega('apicultor', 'miel')),
  'prestado-martin': juntar(prestado('maquinista'), entrega('martin', 'campana')),
  'prestado-elsa': juntar(prestado('guarda'), entrega('guarda', 'durmientes')),
  'recorrer-lado': T('duendes', 'lado'),
  'ramon-guiso': T('ramon', 'guiso'),
  'cita-noche': T('amor', 'noche-antes'),
  // la escena de la espera: la noche pasa a «pendiente» (y sin encuentro anotado se juega el trato) y empieza al terminar la escena (historia-noche-ui.js)
  'espera': (h) => { const d = duendesDe(h); if (!d.trato) hacerTrato(h, 'trato'); if (d.noche === 'ninguna') d.noche = 'pendiente'; },
  'amanecer-trato-ganada': marcaVista('amanecer'),
  'amanecer-trato-perdida': marcaVista('amanecer'),
  'amanecer-pelea-ganada': marcaVista('amanecer'),
  'amanecer-pelea-perdida': marcaVista('amanecer'),
  'carpeta': T('graciela', 'carpeta'),
  'majada-fin': T('ramon', 'majada-fin'),
  'volver-a-subir': T('ramon', 'subir'),
  'josefina-fin': T('ema', 'fin'),
  // el final: A (trato) o B (pelea). Con el trato empieza la costumbre de la bolsa vacía en el umbral cada cosecha.
  'umbral-fin': (h, dia) => {
    const d = duendesDe(h);
    d.final = d.trato === 'pelea' ? 'pelea' : 'trato';
    if (d.final === 'trato') h.costumbre = { bolsa: 'vacia', cosechas: 0, regalos: 0, dia: Math.max(1, Math.floor(Number(dia) || 1)) };
    marcarTema(h, 'final', d.final, dia);
  },
};
// Avisos en pantalla de lo que cambia la mecánica sola (por si la escena no está escrita o se saltó): [título, detalle]
export const NOTAS_ESCENA_ACTO3 = {
  'ramon-cama': ['Ramón tiene fiebre y la cadera mal', 'Dos semanas de reposo en la aldea. Ramón va a ir con vos, despacio'],
  'ramon-sanitario': ['Ramón quedó en el puesto sanitario', 'Marta lo tapa con la manta. La majada es otra pregunta'],
  'estacion-gente': ['La aldea se juntó en la estación', 'Cerca de la salamandra, como en las noches bravas de antes'],
  'cuerda-elvira': ['Le diste los vellones a Elvira', 'Va a hilar la cuerda del arco'],
  'puntas-anselmo': ['Anselmo forja las doce puntas', 'Le pagaste $400'],
  'paces-fermin': ['Hiciste las paces con Fermín', 'El regalo lo dejó callado un rato largo'],
  'prestado-anselmo': ['Anselmo te presta las estacas', 'Son de un arado viejo, duras como el que las forjó'],
  'prestado-guido': ['Guido te presta las trampas de miel', 'Que no se las coman, que es de ulmo'],
  'prestado-martin': ['Martín te presta la campana', 'La vieja del taller ferroviario: avisa cada ola'],
  'prestado-elsa': ['Elsa te presta los durmientes', 'Que sirvan de algo, que de tren ya no sirven'],
  'pedir-perdon': ['Dejaste algo en la raíz del coihue', 'No cambia lo que pasó, pero queda dicho'],
  'umbral-fin': ['Primer día del año', 'Un año en el valle'],
};

// ---------------------------------------------------------------- los objetos de historia en el mundo del acto III
// Mismo formato que OBJETOS_ACTO2 (historia-disparadores-acto2.js). `pago`: la E gasta algo (ver accionDeObjeto); `cuidar`: la E de la majada (una por día).
const deNoche = (s) => s.horas >= 19 || s.horas < 6;
export const OBJETOS_ACTO3 = {
  // la puerta de tu galpón: de noche, en el capítulo 10, la E dice «Golpear» (no «Abrir»)
  'puerta-galpon': { forma: null, punto: 'galpon-noche', dx: 0, dz: 0, visible: (s, h) => enCap(h, 'golpea') && !s.escenas.has('golpe') && deNoche(s),
    aviso: 'Golpear la puerta del galpón', escena: 'golpe' },
  // el cajón trabado del molino viejo (la llave del 79, sólo con trato)
  'cajon-trabado': { forma: null, lugar: 'molino-viejo', dx: -3.0, dz: -2.2, visible: (s, h) => enCap(h, 'golpea', 'arco') && s.trato === 'trato' && s.llave79 && !s.escenas.has('llave-79'),
    aviso: 'Probar la llave del 79 en el cajón trabado', escena: 'llave-79' },
  // pedir perdón en la raíz del coihue (sólo pelea)
  'raiz-perdon': { forma: null, lugar: 'molino-viejo', dx: 1.4, dz: 1.0, visible: (s, h) => enCap(h, 'golpea', 'arco') && s.trato === 'pelea' && !s.perdon && s.escenas.has('encuentro'),
    aviso: 'Dejar algo en la raíz del coihue para pedir perdón', escena: 'pedir-perdon' },
  // pagar la deuda del trato: una bolsa de harina o seis tablas en la raíz (o el tocón)
  'raiz-deuda': { forma: null, lugar: 'molino-viejo', dx: -1.2, dz: 1.4, visible: (s, h) => enCap(h, 'arco') && s.deuda > 0,
    aviso: 'Pagar lo que debés del trato en la raíz', pago: true },
  // cuidar la majada de Ramón (D5 = b): agua y forraje, una vez por mañana
  'corral-ramon': { forma: null, punto: 'puesto', dx: 7, dz: 4, visible: (s, h) => enCap(h, 'frios') && s.decisiones.majada === 'b' && s.cuidados < 3 && !s.temas.has(`majada:dia${s.dia}`),
    aviso: 'Darle agua y forraje a la majada de Ramón', cuidar: true },
};

// ---------------------------------------------------------------- la costumbre del trato (final A): la bolsa vacía en el umbral cada cosecha
export const COSTUMBRE_REGALOS = ['canto', 'pinones', 'pluma'];
export function costumbreDe(h) {
  const c = h?.costumbre;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  return { bolsa: ['vacia', 'llena'].includes(c.bolsa) ? c.bolsa : null, cosechas: Math.max(0, Math.floor(Number(c.cosechas) || 0)), regalos: Math.max(0, Math.floor(Number(c.regalos) || 0)), dia: Math.max(1, Math.floor(Number(c.dia) || 1)) };
}
// La bolsa vacía se ve en el umbral con el final A; la E la llena con una medida de harina; a la mañana siguiente hay un regalito
export function accionBolsaUmbral(h, s) {
  const c = costumbreDe(h);
  if (!c || h?.duendes?.final !== 'trato') return null;
  if (c.bolsa === 'vacia') return s.harina >= 1 ? { tipo: 'llenar', aviso: 'Llenar la bolsa del umbral con una medida de harina' } : { tipo: 'nota', aviso: 'La bolsa vacía del umbral', nota: ['La bolsa vacía del umbral', 'Piden la de este año. Con una medida de harina, alcanza'] };
  return null;
}
// Al amanecer: si la bolsa se llenó, deja el regalito y la costumbre espera a la próxima cosecha
export function amanecerCostumbre(h, s, dia) {
  const c = costumbreDe(h);
  if (!c || h?.duendes?.final !== 'trato') return null;
  if (c.bolsa === 'llena' && dia > c.dia) {
    const regalo = COSTUMBRE_REGALOS[c.regalos % COSTUMBRE_REGALOS.length];
    h.costumbre = { bolsa: null, cosechas: c.cosechas, regalos: c.regalos + 1, dia };
    return regalo;
  }
  // con una cosecha nueva (desde la última vez), la bolsa vuelve a aparecer vacía
  if (c.bolsa === null && (s.cosechas || 0) >= c.cosechas + 6) { h.costumbre = { bolsa: 'vacia', cosechas: s.cosechas, regalos: c.regalos, dia: c.dia }; }
  return null;
}
export function llenarBolsa(h, dia) { const c = costumbreDe(h); if (!c || c.bolsa !== 'vacia') return false; h.costumbre = { ...c, bolsa: 'llena', dia: Math.max(1, Math.floor(Number(dia) || 1)) }; return true; }

// El pago de la deuda: harina o tablas
export function puedePagarDeuda(s) { return s.harina >= DEUDA_COSTO.harina || s.tablas >= DEUDA_COSTO.tabla; }
export function pagarLaDeuda(h, s, ctx = {}) {
  if (!pagarDeuda(h)) return null;
  if (s.harina >= DEUDA_COSTO.harina) { ctx.gastar?.('harina', DEUDA_COSTO.harina); return 'harina'; }
  ctx.gastar?.('tabla', DEUDA_COSTO.tabla);
  return 'tablas';
}
export { esConvidado };
