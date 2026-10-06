// 3.7.1 (mundo): dónde está y qué hace cada uno del amor en el mundo (PLAN_3_7.md, «3.7.1 — Amor en la aldea» y
// «Detalles y extras elegidos»). Módulo puro, como amor.js: sin three ni DOM, se prueba en Node. Lo dibuja y lo mueve
// amor-mundo.js; a la gente de la aldea la mueve aldea-gente.js con lo que dice `destinoPareja`.
//
// Lo que resuelve:
//   · la esposa (o la novia) que vive con vos: de 19 a 8 en el refugio (`rutinaPareja` de amor.js), a la mesa en su
//     silla y de noche en la cama; de día va a su local y vuelve (de la aldea al refugio, en la trochita: ver
//     `llegadaRefugio`, por dónde aparece caminando);
//   · la cita: sale con tiempo y va caminando al lugar (en la aldea, por las calles; al valle, por el camino), espera,
//     y la cita tiene su momento según el lugar (sentados en el banco, el té en la mesa, mirar desde el mirador);
//   · el casamiento civil en la biblioteca popular (el juez de paz detrás del mostrador, los dos enfrente, los testigos
//     al lado, los invitados en las sillas y la familia en el sillón) y la fiesta chica de después (en el salón si
//     está abierto, o en la plaza con una mesa larga): música, baile y un brindis. Nada religioso;
//   · los hijos: su rutina (`rutinaHijo`) puesta en el mundo, con el cuarto que se suma a la casa cuando nace alguien
//     (en el refugio, pegado a la pared del costado; en la aldea, al costado del local de ella) con la cuna y las camas;
//   · el ñiki ñiki no se ve (el fundido de main.js); a la mañana, si viven juntos, desayunan juntos.
import { LUGARES_CITA, CANDIDATAS, rutinaPareja, rutinaHijo, casaDeElla, invitadosBoda, AMOR, etapaHijo, esCandidata } from './amor.js';
import { EDIFICIOS_ALDEA, IDS_EDIFICIOS, CALLES_ALDEA, plantaDe, distanciaACalle, puntosFijosDe, localAbierto, diaSemanaDe, ETAPAS_CHICOS, num } from './aldea.js';

const PI = Math.PI;
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const horaNorm = (h) => ((((Number.isFinite(num(h)) ? num(h) : 12) % 24) + 24) % 24);

// ---------------------------------------------------------------- los marcos
// Un marco: { x, z, y, rot } en el mundo (el centro de un edificio y su giro, con la puerta en +Z local).
export function aMundoMarco(m, lx, lz) {
  const c = Math.cos(m.rot || 0), s = Math.sin(m.rot || 0);
  return { x: m.x + lx * c + lz * s, z: m.z - lx * s + lz * c };
}
export function aLocalMarco(m, x, z) {
  const c = Math.cos(m.rot || 0), s = Math.sin(m.rot || 0), dx = x - m.x, dz = z - m.z;
  return { lx: dx * c - dz * s, lz: dx * s + dz * c };
}
// un ángulo de mirar del marco al mundo (mirar = adelante (sin a, cos a))
export const miraMundo = (m, a) => (m.rot || 0) + a;

// ---------------------------------------------------------------- el refugio
// En el marco del refugio de estructuras.js (W 7 × D 5,5; la puerta en +Z, mirando al lago; el piso a 0,37 m).
export const REFUGIO = { W: 7, D: 5.5, piso: 0.37 };
// `cama`: la punta de los pies (acostada boca arriba, la cabeza hacia atrás de donde mira: hacia la almohada, en x 1,35);
// `y`: sobre la base del refugio. La silla de ella la pone amor-mundo.js (con sus cosas) en la cabecera de la mesa.
export const PUNTOS_REFUGIO = {
  adentro: { x: -0.22, z: -0.98, a: PI / 2, sentado: true, asiento: 0.47 },   // su silla, a la mesa (mira a la mesa)
  cama: { x: 2.9, z: -2.2, a: PI / 2, y: 0.9, pose: 'dormir' },              // del lado de la pared
  umbral: { x: 0, z: 1.9, a: PI },
  puerta: { x: 0, z: 3.7, a: PI },
  // los chicos a la tardecita, en la alfombra (y los que te visitan)
  'chico-1': { x: -0.35, z: 0.95, a: 2.6, sentado: true, asiento: 0 },
  'chico-2': { x: 0.5, z: 0.62, a: -2.4, sentado: true, asiento: 0 },
};
export const SILLA_REFUGIO = { x: -0.3, z: -0.98, giro: PI / 2 };
export const MESA_REFUGIO = { x: 1.1, z: -0.98, y: 0.89 };

// ---------------------------------------------------------------- el cuarto de los chicos
// PLAN_3_7 (3.7.0): «las casas suman un cuarto cuando nace alguien». Un cuarto de tablas con techo de chapa a un agua,
// sobre pilotes (así no hay que tocar el terreno), pegado a la pared del costado de la casa, con su puerta al frente.
// En su marco: 3 × 3,3 m, la pared compartida en +X (`espejo` −1: en −X), la puerta en +Z.
export const CUARTO = { ancho: 3.0, fondo: 3.3, puerta: { x: 0.65, ancho: 0.8, alto: 1.75 } };
// las alturas (sobre la base): el refugio tiene el alero bajo (la chapa pasa por debajo); los de la aldea, más altos
const ALTOS_CUARTO = { refugio: { piso: 0.37, alto: 2.38, bajo: 2.2 }, aldea: { piso: 0.32, alto: 2.75, bajo: 2.5 } };
// En el marco del cuarto (sin espejar). `cama`: acostado boca arriba, mirando hacia los pies (la figura gira sobre los pies:
// el punto que se devuelve es el de los pies, según la talla).
export const PUNTOS_CUARTO = {
  cuna: { x: 0.92, z: -1.3, a: PI / 2 },
  'cama-hijo-1': { x: -1.3, z: -1.18, a: PI / 2, cama: true },   // (en las camas: x, z es la coronilla, sobre la almohada)
  'cama-hijo-2': { x: -1.03, z: -0.35, a: 0, cama: true },
  adentro: { x: 0.2, z: 0.3, a: 0 },
  umbral: { x: 0.65, z: 1.1, a: PI },
  puerta: { x: 0.65, z: 2.5, a: PI },
};
// los muebles: la cama 1 contra la pared del fondo, la cuna en el rincón, la cama 2 contra la pared de afuera
export const MUEBLES_CUARTO = {
  cuna: { x: 0.92, z: -1.3, largo: 0.95, ancho: 0.55 },
  'cama-hijo-1': { x: -0.5, z: -1.18, largo: 1.75, ancho: 0.78, giro: 0 },
  'cama-hijo-2': { x: -1.03, z: 0.45, largo: 1.75, ancho: 0.78, giro: PI / 2 },
};
const ALTURA_CAMA_HIJO = 0.42;
// Dónde va el cuarto de la casa `casa` ('refugio' o un edificio de la aldea): { base, lx, lz, espejo, ...alturas } en
// el marco de la casa. En el refugio, del lado de la ventana del costado (−X): ese lado no tiene nada afuera. En la
// aldea, del costado (izquierdo o derecho) que esté libre de otros edificios, de su anexo (el corral, el horno) y de
// las calles; si los dos chocan, el que choca menos (se avisa en `choca`).
export function cuartoDe(casa) {
  if (casa === 'refugio') return { base: 'refugio', lx: -(REFUGIO.W / 2 + 0.16 + CUARTO.ancho / 2), lz: -0.85, espejo: 1, choca: 0, ...ALTOS_CUARTO.refugio };
  const e = EDIFICIOS_ALDEA[casa];
  if (!e || e.abierta || e.rol === 'plaza' || e.rol === 'estacion') return null;
  const lz = -e.fondo / 2 + CUARTO.fondo / 2 + 0.25;
  const opciones = [-1, 1].map((lado) => {
    const lx = lado * (e.ancho / 2 + 0.04 + CUARTO.ancho / 2);
    return { base: casa, lx, lz, espejo: lado < 0 ? 1 : -1, choca: chocaCuarto(casa, lx, lz), ...ALTOS_CUARTO.aldea };
  });
  opciones.sort((a, b) => a.choca - b.choca || a.lx - b.lx);
  return opciones[0];
}
// cuánto choca (puntos de la planta del cuarto, con margen, que caen en otro edificio, en el anexo o en una calle)
function chocaCuarto(casa, lx, lz) {
  const e = EDIFICIOS_ALDEA[casa];
  const c = Math.cos(e.rot), s = Math.sin(e.rot);
  const enPlano = (bx, bz) => ({ x: e.x + bx * c + bz * s, z: e.z - bx * s + bz * c });
  let n = 0;
  const m = 0.6;
  for (const fx of [-0.5, 0, 0.5]) for (const fz of [-0.5, 0, 0.5]) {
    const bx = lx + fx * (CUARTO.ancho + 2 * m), bz = lz + fz * (CUARTO.fondo + 2 * m);
    const p = enPlano(bx, bz);
    for (const id of IDS_EDIFICIOS) {
      if (id === casa) continue;
      const q = plantaDe(id), o = EDIFICIOS_ALDEA[id];
      if (q && !o.abierta && p.x >= q.x0 && p.x <= q.x1 && p.z >= q.z0 && p.z <= q.z1) n++;
      if (o.anexo) {
        // el anexo de otro (en su marco)
        const co = Math.cos(o.rot), so = Math.sin(o.rot), dx = p.x - o.x, dz = p.z - o.z;
        const ax = dx * co - dz * so, az = dx * so + dz * co;
        if (Math.abs(ax - o.anexo.x) < o.anexo.ancho / 2 && Math.abs(az - o.anexo.z) < o.anexo.fondo / 2) n++;
      }
    }
    if (e.anexo && Math.abs(bx - e.anexo.x) < e.anexo.ancho / 2 + 0.3 && Math.abs(bz - e.anexo.z) < e.anexo.fondo / 2 + 0.3) n += 2;
    for (const calle of CALLES_ALDEA) if (distanciaACalle(p.x, p.z, calle) < 0.4) n++;
  }
  return n;
}
// El marco del cuarto en el mundo, desde el marco de su casa.
export function marcoCuarto(cuarto, marcoCasa) {
  if (!cuarto || !marcoCasa) return null;
  const w = aMundoMarco(marcoCasa, cuarto.lx, cuarto.lz);
  return { x: w.x, z: w.z, y: marcoCasa.y, rot: marcoCasa.rot || 0, espejo: cuarto.espejo, piso: cuarto.piso, alto: cuarto.alto, bajo: cuarto.bajo };
}
// Un punto del cuarto (espejado si hace falta) en el mundo.
export const LARGO_ACOSTADO = 1.65;   // de los pies a la coronilla, con talla 1
export function puntoCuarto(mc, nombre, talla = TALLA_HIJO.chico) {
  const q = PUNTOS_CUARTO[nombre];
  if (!mc || !q) return null;
  const s = mc.espejo || 1;
  const largo = q.cama ? LARGO_ACOSTADO * talla : 0;
  const w = aMundoMarco(mc, s * (q.x + Math.sin(q.a) * largo), q.z + Math.cos(q.a) * largo);
  const a = Math.atan2(s * Math.sin(q.a), Math.cos(q.a));
  const r = { x: w.x, z: w.z, mira: miraMundo(mc, a), y: mc.y + mc.piso };
  if (q.cama) { r.y = mc.y + mc.piso + ALTURA_CAMA_HIJO + 0.1; r.pose = 'dormir'; r.cama = true; }
  if (nombre === 'cuna') r.pose = 'dormir';
  return r;
}

// ---------------------------------------------------------------- los chicos
// La talla y la ropa de cada etapa (como los chicos de la aldea de la 3.7.0: aldea.js, ETAPAS_DE).
export const TALLA_HIJO = { bebe: 0.3, chico: 0.62, adolescente: 0.84, joven: 0.97 };
const ROPA_HIJO = {
  nene: {
    chico: { ropa: '#5a7a9a', abrigo: '#3a4a5e', gorro: 'gorro', pelo: '#3a2a20' },
    adolescente: { ropa: '#4a6a4a', abrigo: '#2e3e30', gorro: null, pelo: '#3a2a20' },
    joven: { ropa: '#5a4a3e', abrigo: '#36302a', gorro: 'boina', pelo: '#3a2a20' },
  },
  nena: {
    chico: { ropa: '#b0605a', abrigo: '#7a3a3a', gorro: null, pelo: '#4a3022', bufanda: '#e8c890' },
    adolescente: { ropa: '#7a5a8a', abrigo: '#4a3a5a', gorro: null, pelo: '#4a3022', bufanda: '#d8b878' },
    joven: { ropa: '#6a4a5a', abrigo: '#3e2e38', gorro: null, pelo: '#4a3022', bufanda: '#c8b898' },
  },
};
const DICHOS_HIJO = {
  chico: { saludo: ['¡Papá! ¿Me llevás a ver los caballos?', '¡Pa! Hoy en la escuela dibujé el refugio. Con humo y todo.'], despedida: 'Chau, pa.' },
  adolescente: { saludo: ['Hola, pa. ¿Me prestás la caña el sábado?', 'Ma dice que ordene el cuarto. Ya sé, ya sé.'], despedida: 'Nos vemos.' },
  joven: { saludo: ['Hola, viejo. ¿Te doy una mano con la leña?', 'Ya trabajo en la aldea. Todavía me cuesta creerlo.'], despedida: 'Cuidate, eh.' },
};
// Lo que el mundo necesita para armar a un hijo (gente.js, agregarPoblador): null para el bebé (va en brazos o en la cuna).
export function figuraHijo(h, i, dia) {
  if (!h) return null;
  const etapa = ETAPAS_CHICOS[etapaHijo(h, dia)];
  if (etapa === 'bebe') return null;
  const sexo = h.sexo === 'nena' ? 'nena' : 'nene';
  const d = DICHOS_HIJO[etapa];
  return {
    clave: `hijo-${i + 1}`, etapa, colores: ROPA_HIJO[sexo][etapa], talla: TALLA_HIJO[etapa], nombre: h.nombre,
    oficio: sexo === 'nena' ? 'tu hija' : 'tu hijo', saludo: d.saludo[(dia + i) % d.saludo.length], despedida: d.despedida, velocidad: etapa === 'chico' ? 1.05 : 0.9,
  };
}

// ---------------------------------------------------------------- los marcos que hacen falta
// `marcos`: { refugio: { x, z, y, rot } | null, edificio(id) → { x, z, y, rot } | null, lugarValle(id) → { x, z } | null,
// sentadero(x, z, radio) → { x, z, mira, asiento } | null (un banco del valle cerca), seco(x, z) → ¿tierra firme?,
// sendero: [{ x, z }] (para llegar por el camino), aldea: { x, z } (el centro, para saber de qué lado se viene) }.
function marcoDeCasa(casa, marcos) { return casa === 'refugio' ? marcos.refugio || null : marcos.edificio?.(casa) || null; }
// Un punto del refugio en el mundo.
export function puntoRefugio(ref, nombre) {
  const q = PUNTOS_REFUGIO[nombre];
  if (!ref || !q) return null;
  const w = aMundoMarco(ref, q.x, q.z);
  return { x: w.x, z: w.z, mira: miraMundo(ref, q.a), y: Number.isFinite(q.y) ? ref.y + q.y : undefined, sentado: !!q.sentado, asiento: q.asiento, pose: q.pose || null, adentro: nombre !== 'puerta' };
}
// Por dónde se llega caminando al refugio (desde la trochita): un punto del sendero cerca (de 18 a 60 m de la
// puerta), o a 22 m de la puerta, hacia el lago. Y el camino: de ahí a la puerta, adentro y al punto.
export function llegadaRefugio(ref, sendero = []) {
  const puerta = aMundoMarco(ref, 0, REFUGIO.D / 2 + 3);
  let mejor = null, dm = Infinity;
  for (const q of sendero || []) {
    const d = Math.hypot(q.x - puerta.x, q.z - puerta.z);
    if (d >= 18 && d <= 60 && d < dm) { dm = d; mejor = { x: q.x, z: q.z }; }
  }
  return mejor || aMundoMarco(ref, 0, REFUGIO.D / 2 + 22);
}
// Por dónde se llega a un lugar del valle: el punto del sendero a 18–45 m (en tierra firme, según `seco`), o a 25 m en la
// dirección de la aldea (o la primera que no sea agua). null: no hay por dónde (se la pone directo en el lugar).
export function llegadaValle(p, sendero = [], aldea = null, seco = () => true) {
  let mejor = null, dm = Infinity;
  for (const q of sendero || []) {
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d >= 18 && d <= 45 && Math.abs(d - 28) < dm && seco(q.x, q.z)) { dm = Math.abs(d - 28); mejor = { x: q.x, z: q.z }; }
  }
  if (mejor) return mejor;
  const a0 = Math.atan2((aldea?.x ?? p.x + 1) - p.x, (aldea?.z ?? p.z) - p.z);
  for (let i = 0; i < 12; i++) {
    const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 6);
    const q = { x: p.x + Math.sin(a) * 25, z: p.z + Math.cos(a) * 25 };
    let ok = true;
    for (let k = 1; k <= 5 && ok; k++) if (!seco(p.x + Math.sin(a) * 5 * k, p.z + Math.cos(a) * 5 * k)) ok = false;
    if (ok) return q;
  }
  return null;
}
// El punto de ella (o el tuyo) en un lugar de cita del valle (el mismo que usa amor-juego.js: `posLugar`).
export function puntoCitaValle(v, quien = 'suyo') {
  if (!v || !Number.isFinite(v.x)) return null;
  return quien === 'suyo' ? { x: v.x + 1.2, z: v.z + 1.2, mira: PI * 1.25 } : { x: v.x - 0.4, z: v.z - 0.4, mira: PI * 0.25 };
}

// ---------------------------------------------------------------- la cita: su momento
// Qué hace ella en cada lugar, ya empezada la cita (la pose de gente.js). En el valle, en su lugar favorito y en los
// que tienen dónde sentarse, se sienta (en el suelo, en el muelle); en los altos mira el paisaje.
export const MOMENTO_CITA = {
  plaza: { pose: 'sentado' }, 'casa-te': { pose: 'sentado' }, estacion: { pose: 'mirar' }, baile: { pose: 'bailar' }, observatorio: { pose: 'mirar' },
  mirador: { pose: 'mirar' }, muelle: { pose: 'sentado', asiento: 0 }, arrayanes: { pose: 'mirar' }, puente: { pose: 'mirar' },
  mallin: { pose: 'sentado', asiento: 0 }, faro: { pose: 'mirar' }, torre: { pose: 'mirar' }, cueva: { pose: 'mirar' },
};
// cuánto antes sale para la cita (horas): a la aldea, media hora; al valle, la trochita y el camino
export const SALIDA_CITA = { aldea: 0.5, valle: 1.0 };

// ---------------------------------------------------------------- la pareja
// Dónde va ella ahora, por el amor (o null: su horario de siempre, el de aldea-gente.js). Devuelve uno de:
//   { lugar, edificio, punto, pose?, sentado?, asiento? }                       — un punto con nombre de la aldea;
//   { lugar, edificio, punto, x, z, mira, ... }                                  — un punto suelto de la aldea;
//   { lugar, edificio, punto, x, z, mira, fuera: true, y?, llegada, entrada }    — fuera de la aldea (el refugio, el
//     valle): sale por el andén y llega caminando desde `llegada` por los puntos de `entrada`.
// `ctx`: { dia, hora, aldea, mundo (mundoAmor), marcos, escena (la de escenaBoda, o null), puesta (la de amor-juego.js) }.
export function destinoPareja(progreso, clave, ctx = {}) {
  const mundo = ctx.mundo;
  if (!mundo?.activo || !esCandidata(clave)) return null;
  const amor = progreso?.amor;
  if (!amor?.personas?.[clave]) return null;
  const d = Math.max(1, Math.floor(num(ctx.dia) || 1)), h = horaNorm(ctx.hora), ds = diaSemanaDe(d);
  const marcos = ctx.marcos || {};
  // el casamiento y la fiesta mandan
  const esc = ctx.escena;
  if (esc?.ella?.clave === clave) return esc.ella.destino;
  // la cita: sale con tiempo, espera y tiene su momento (también la sobremesa: amor-juego.js la tiene en el lugar media
  // hora más, `ctx.puesta`, aunque la cita ya haya terminado)
  const pu = ctx.puesta;
  const c = amor.cita || (pu?.clave === clave && pu.por === 'cita' && Object.hasOwn(LUGARES_CITA, pu.lugar) ? { clave, lugar: pu.lugar, estado: 'en-curso' } : null);
  if (c && c.clave === clave && Object.hasOwn(LUGARES_CITA, c.lugar)) {
    const L = LUGARES_CITA[c.lugar];
    const antes = L.aldea ? SALIDA_CITA.aldea : SALIDA_CITA.valle;
    const enCurso = c.estado === 'en-curso';
    if (enCurso || (c.dia === d && h >= c.desde - antes && h <= c.hasta)) {
      const momento = enCurso ? MOMENTO_CITA[c.lugar] || {} : {};
      if (L.aldea) return { lugar: 'cita', edificio: L.aldea.edificio, punto: L.aldea.suyo, pose: momento.pose || null, ...(momento.pose === 'sentado' ? { sentado: true } : {}), ...(momento.pose && momento.pose !== 'sentado' ? { sentado: false } : {}) };
      const v = marcos.lugarValle?.(L.valle), p = puntoCitaValle(v);
      if (!p) return null;
      const llegada = llegadaValle(p, marcos.sendero, marcos.aldea, marcos.seco);
      // empezada, si hay un banco cerca (el del mirador), se sienta en una punta: la otra es para vos
      const banco = enCurso ? marcos.sentadero?.(p.x, p.z, 10) : null;
      if (banco) {
        const m = banco.mira || 0, x = banco.x - Math.cos(m) * 0.5, z = banco.z + Math.sin(m) * 0.5;
        return { lugar: 'cita', edificio: null, punto: `${c.lugar}-banco`, x, z, mira: m, fuera: true, adentro: false, pose: 'sentado', sentado: true, asiento: banco.asiento, llegada, entrada: [] };
      }
      return { lugar: 'cita', edificio: null, punto: c.lugar, x: p.x, z: p.z, mira: p.mira, fuera: true, adentro: false,
        pose: momento.pose || null, sentado: momento.pose === 'sentado', asiento: momento.asiento, llegada, entrada: [] };
    }
  }
  const base = rutinaPareja(progreso, clave, h, ds, d, ctx.aldea || progreso.aldea);
  // a la mañana después del ñiki ñiki, si viven juntos: el desayuno (hasta las 9 y media)
  const conv = amor.convivencia;
  const viven = conv?.con === clave && amor.personas[clave]?.etapa !== 'separados';
  const desayuno = viven && Number(amor.niki) > 0 && d === Number(amor.niki) + 1 && h >= 7 && h < 9.5;
  if (viven && conv.donde === 'refugio' && (base.edificio === 'refugio' || desayuno)) {
    const ref = marcos.refugio;
    if (!ref) return null;
    const punto = desayuno || base.punto !== 'cama' ? 'adentro' : 'cama';
    const p = puntoRefugio(ref, punto);
    return { lugar: 'casa', edificio: 'refugio', punto, x: p.x, z: p.z, y: p.y, mira: p.mira, fuera: true, adentro: true, sentado: p.sentado, asiento: p.asiento, pose: p.pose || (p.sentado ? 'sentado' : null),
      llegada: llegadaRefugio(ref, marcos.sendero), entrada: entradaRefugio(ref) };
  }
  if (desayuno && conv.donde === 'suya') return { lugar: 'casa', edificio: casaDeElla(clave), punto: 'adentro' };
  // esperando un bebé, a la obra no va (a su casa)
  if (mundo.embarazo?.madre === clave && base.lugar === 'obra') return { lugar: 'casa', edificio: casaDeElla(clave), punto: 'adentro' };
  return null;
}
// de la puerta del refugio para adentro (para el que llega caminando)
export function entradaRefugio(ref) {
  return [aMundoMarco(ref, 0, REFUGIO.D / 2 + 1.4), aMundoMarco(ref, 0, REFUGIO.D / 2 - 0.9)].map((q, i) => ({ ...q, sinChoque: i > 0 }));
}

// ---------------------------------------------------------------- los hijos
// Dónde está el hijo `i` ahora: null si no hay figura (el bebé va con la mamá o en la cuna: ver `bebe`), o un destino
// como los de destinoPareja (siempre con x, z: los chicos los mueve amor-mundo.js). `bebe`: { donde: 'cuna'|'mama', ... }.
export function destinoHijo(progreso, i, ctx = {}) {
  const mundo = ctx.mundo;
  if (!mundo?.activo) return null;
  const h = progreso?.amor?.hijos?.[i];
  if (!h) return null;
  const d = Math.max(1, Math.floor(num(ctx.dia) || 1)), hora = horaNorm(ctx.hora), ds = diaSemanaDe(d);
  if (d < h.nacio) return null;
  const r = rutinaHijo(progreso, i, hora, ds, d, ctx.aldea || progreso.aldea);
  if (!r) return null;
  const etapa = ETAPAS_CHICOS[etapaHijo(h, d)];
  const marcos = ctx.marcos || {};
  if (etapa === 'bebe') {
    if (r.punto === 'cuna') {
      const mc = marcoCuarto(cuartoDe(r.edificio), marcoDeCasa(r.edificio, marcos));
      const p = puntoCuarto(mc, 'cuna');
      return p ? { bebe: true, donde: 'cuna', casa: r.edificio, ...p } : null;
    }
    return { bebe: true, donde: 'mama', madre: h.madre };
  }
  // el cuarto: la cama
  if (/^cama-hijo-/.test(r.punto || '') || r.punto === 'cuna') {
    const mc = marcoCuarto(cuartoDe(r.edificio), marcoDeCasa(r.edificio, marcos));
    const p = puntoCuarto(mc, r.punto === 'cuna' ? 'cama-hijo-1' : r.punto, TALLA_HIJO[etapa]);
    if (!p) return null;
    const base = r.edificio === 'refugio' ? marcos.refugio : marcoDeCasa(r.edificio, marcos);
    return { lugar: 'casa', edificio: r.edificio, punto: r.punto, ...p, fuera: r.edificio === 'refugio', adentro: true, cuarto: true,
      entrada: [puntoCuarto(mc, 'puerta'), { ...puntoCuarto(mc, 'umbral'), sinChoque: true }].filter(Boolean),
      llegada: r.edificio === 'refugio' && base ? llegadaRefugio(base, marcos.sendero) : null };
  }
  // en el refugio (a la tardecita, o de visita si están separados): en la alfombra
  if (r.edificio === 'refugio') {
    const ref = marcos.refugio;
    if (!ref) return null;
    const p = puntoRefugio(ref, i % 2 ? 'chico-2' : 'chico-1');
    return { lugar: r.lugar, edificio: 'refugio', punto: 'adentro', ...p, pose: 'sentado', fuera: true, adentro: true, llegada: llegadaRefugio(ref, marcos.sendero), entrada: entradaRefugio(ref) };
  }
  // en la aldea: un punto con nombre (la escuela, la plaza, el local, la casa)
  const m = marcos.edificio?.(r.edificio);
  const pts = puntosFijosDe(r.edificio);
  const q = pts[r.punto] || pts.adentro || pts.puerta;
  if (!m || !q || !marcos.aMundoPlano) return null;
  const w = marcos.aMundoPlano(q.x, q.z);
  const pose = r.lugar === 'escuela' ? 'sentado' : r.lugar === 'plaza' ? 'jugar' : null;
  return { lugar: r.lugar, edificio: r.edificio, punto: r.punto, x: w.x, z: w.z, mira: marcos.rotPlano(q.rot), plano: { x: q.x, z: q.z }, fuera: false,
    adentro: r.lugar !== 'plaza', pose, sentado: pose === 'sentado' };
}
// ¿Algún hijo vive (o duerme) en esta casa? El cuarto que se ve: { casa, camas: [i…], cuna } o null.
export function cuartoVisible(mundo) {
  if (!mundo?.activo || !mundo.cuarto || !mundo.hijos?.length) return null;
  const camas = [], casa = mundo.cuarto.edificio;
  let cuna = false;
  mundo.hijos.forEach((h, i) => { if (h.etapa === 'bebe') cuna = true; else camas.push(i); });
  return { casa, camas, cuna };
}

// ---------------------------------------------------------------- el casamiento y la fiesta
// Las horas: la ceremonia mientras ella espera (de 10:30 a 14, ver amor.js); la fiesta, dos horas y media desde que
// se casaron (hasta las 18 como mucho); el brindis, al principio; el juez llega a las 10 en el tren y se va al terminar.
export const BODA = { juezDesde: 10, desde: AMOR.boda.desde, hasta: AMOR.boda.hasta, fiesta: 2.5, fiestaHasta: 18, brindis: [0.05, 0.4] };
// Un lugar de la biblioteca corrido a un costado (en metros, en el marco del punto: `lado` a la derecha del que mira,
// `atras` hacia atrás).
function corrido(pts, nombre, lado, atras = 0) {
  const q = pts[nombre];
  if (!q) return null;
  const r = q.rot || 0;
  // adelante (sin r, cos r); a la derecha del que mira, (−cos r, sin r) en este marco (el de gente.js: rumbo = atan2(dx, dz))
  return { x: q.x - Math.cos(r) * lado - Math.sin(r) * atras, z: q.z + Math.sin(r) * lado - Math.cos(r) * atras, rot: r };
}
// La escena del día (o null). `ctx`: { dia, hora, mundo, aldea, fiesta: { dia, desde, con } | null (la recuerda
// amor-mundo.js desde que se casaron), invitados: { invitados, familia } (invitadosBoda), presentes: [claves que viven en
// la aldea] }. Devuelve { fase: 'ceremonia'|'fiesta', con, ella: { clave, destino }, personas: Map(clave → destino),
// juez: destino|null, familia: [{ quien, destino }], mesa: punto|null, musica: punto|null, brindis: bool, donde }.
// Los destinos: como los de destinoPareja (puntos de la aldea: `plano` en el plano de la aldea y la pose).
export function escenaBoda(progreso, ctx = {}) {
  const mundo = ctx.mundo;
  if (!mundo?.activo) return null;
  const d = Math.max(1, Math.floor(num(ctx.dia) || 1)), h = horaNorm(ctx.hora);
  const a = ctx.aldea || progreso?.aldea;
  const presentes = new Set(ctx.presentes || []);
  const inv = ctx.invitados || invitadosBoda(progreso);
  const b = mundo.boda;
  const punto = (edificio, p, extra = {}) => ({ lugar: 'boda', edificio, punto: p, ...extra });
  const suelto = (edificio, nombre, q, extra = {}) => (q ? { lugar: 'boda', edificio, punto: nombre, plano: { x: q.x, z: q.z }, rotPlano: q.rot, ...extra } : null);
  // la ceremonia
  if (b && b.dia === d && h >= BODA.juezDesde && h < BODA.hasta) {
    const pts = puntosFijosDe('biblioteca');
    const personas = new Map();
    const lugar = (k, dest) => { if (dest && presentes.has(k) && k !== b.con) personas.set(k, dest); };
    // testigos al lado de los novios, los demás en las sillas de lectura (los chicos en los almohadones)
    lugar('jefe', suelto('biblioteca', 'testigo-1', corrido(pts, 'cliente', 1.05, 0.25)));
    lugar('modista', suelto('biblioteca', 'testigo-2', corrido(pts, 'cliente', -1.1, 0.25)));
    let silla = 1, almohadon = 13;
    for (const k of inv.invitados) {
      if (personas.has(k) || k === b.con || !presentes.has(k)) continue;
      if ((k === 'nene' || k === 'nena') && almohadon <= 16) lugar(k, punto('biblioteca', `lectura-${almohadon++}`, { sentado: true, pose: 'sentado' }));
      else if (silla <= 12) lugar(k, punto('biblioteca', `lectura-${silla++}`, { sentado: true, pose: 'sentado' }));
    }
    const ella = h >= BODA.desde ? suelto('biblioteca', 'novia', corrido(pts, 'cliente', 0.38), { sentado: false, pose: null }) : null;
    return {
      fase: 'ceremonia', con: b.con, donde: 'biblioteca', personas, brindis: false, mesa: null, musica: null,
      ella: ella ? { clave: b.con, destino: ella } : null,
      // (detrás del mostrador, corrido: en el lugar de siempre atiende quien atiende la biblioteca)
      juez: suelto('biblioteca', 'juez', corrido(pts, 'adentro', 0.7), { pose: null }),
      familia: inv.familia.map((quien) => ({ quien, destino: suelto('biblioteca', 'familia', pts.cuentos, { sentado: true, pose: 'sentado' }) })),
    };
  }
  // la fiesta
  const f = ctx.fiesta;
  if (!f || f.dia !== d || h < f.desde - 1e-3 || h >= Math.min(f.desde + BODA.fiesta, BODA.fiestaHasta)) return null;
  const salon = localAbierto(a, 'salon');
  const personas = new Map();
  const brindis = h - f.desde >= BODA.brindis[0] && h - f.desde < BODA.brindis[1];
  const lista = [...new Set(['musico', ...inv.invitados])].filter((k) => k !== f.con && presentes.has(k));
  let ella, mesa = null, musica = null;
  if (salon) {
    const pts = puntosFijosDe('salon');
    ella = punto('salon', 'baile-1', { pose: 'bailar', sentado: false });
    let baile = 2, silla = 1;
    for (const k of lista) {
      if (k === 'musico') { personas.set(k, punto('salon', 'escenario', { pose: 'tocar', sentado: false })); continue; }
      if (baile <= 8) personas.set(k, punto('salon', `baile-${baile++}`, { pose: brindis ? 'brindar' : 'bailar', sentado: false }));
      else if (silla <= 8) personas.set(k, punto('salon', `lugar-${silla++}`, { sentado: true, pose: 'sentado' }));
    }
    musica = pts.escenario ? { x: pts.escenario.x, z: pts.escenario.z, edificio: 'salon' } : null;
  } else {
    // la plaza: una mesa larga en el medio (en el marco de la plaza, a lo largo de X), los novios bailando delante y
    // los invitados alrededor (los que no entran, en los bancos)
    const P = EDIFICIOS_ALDEA.plaza;
    const c = Math.cos(P.rot), s = Math.sin(P.rot);
    const enPlano = (bx, bz, r = 0) => ({ x: P.x + bx * c + bz * s, z: P.z - bx * s + bz * c, rot: P.rot + r });
    // (entre el duende tallado del medio y la base del mástil)
    mesa = { ...enPlano(0, 2.9), edificio: 'plaza', largo: 3.2, ancho: 0.9 };
    ella = suelto('plaza', 'baile', enPlano(-1.9, 1.1, PI * 0.75), { pose: 'bailar', sentado: false });
    const alrededor = [[-2.25, 2.9, PI / 2], [2.25, 2.9, -PI / 2], [-0.9, 3.85, PI], [0.0, 3.85, PI], [0.9, 3.85, PI], [-0.9, 1.95, 0], [0.9, 1.95, 0]];
    let i = 0, banco = 1;
    for (const k of lista) {
      if (k === 'musico') { const q = puntosFijosDe('plaza').musico; personas.set(k, suelto('plaza', 'musico', q, { pose: 'tocar', sentado: false })); musica = q ? { x: q.x, z: q.z, edificio: 'plaza' } : null; continue; }
      if (i < alrededor.length) { const [x, z, r] = alrededor[i++]; personas.set(k, suelto('plaza', `fiesta-${i}`, enPlano(x, z, r), { pose: brindis ? 'brindar' : null, sentado: false, copa: true })); }
      else if (banco <= 20) personas.set(k, punto('plaza', `estar-${banco++}`, { sentado: true, pose: 'sentado' }));
    }
  }
  return {
    fase: 'fiesta', con: f.con, donde: salon ? 'salon' : 'plaza', personas, brindis, mesa, musica,
    ella: { clave: f.con, destino: ella }, juez: null,
    familia: inv.familia.map((quien) => ({ quien, destino: salon ? punto('salon', 'lugar-8', { sentado: true, pose: 'sentado' }) : suelto('plaza', 'familia', enPlanoPlaza(-1.6, 2.6, PI), { pose: brindis ? 'brindar' : null, sentado: false }) })),
  };
}
function enPlanoPlaza(bx, bz, r = 0) {
  const P = EDIFICIOS_ALDEA.plaza, c = Math.cos(P.rot), s = Math.sin(P.rot);
  return { x: P.x + bx * c + bz * s, z: P.z - bx * s + bz * c, rot: P.rot + r };
}

// ---------------------------------------------------------------- caminar juntos
// En público se nota la pareja (amor.js, `parejas[].gesto`): saliendo, caminan cerca; novios y comprometidos, de la
// mano; casados, del brazo. A qué distancia de vos camina (a tu derecha) y cuánto dura el paseo.
export const JUNTOS = {
  lado: { cerca: 1.0, mano: 0.47, brazo: 0.44 },
  adelante: { cerca: 0.05, mano: 0.12, brazo: 0.15 },
  dura: 1.25,          // horas del juego
  lejos: 22,           // si te alejás más que esto (corriendo, a caballo), te deja ir
  alcanzar: 14,        // si queda más atrás que esto (una puerta, un tronco), te alcanza
  despues: 8,          // al terminar la cita, si estás a menos de esto, vuelven juntos
};
// ¿Quiere salir a caminar ahora? { ok, motivo: 'trabaja'|'noche'|null }
export function puedeCaminar(progreso, clave, ctx = {}) {
  const amor = progreso?.amor;
  const f = amor?.personas?.[clave];
  if (!f || !['saliendo', 'novios', 'comprometidos', 'casados'].includes(f.etapa)) return { ok: false, motivo: 'no' };
  const d = Math.max(1, Math.floor(num(ctx.dia) || 1)), h = horaNorm(ctx.hora);
  if (h >= 22 || h < 7) return { ok: false, motivo: 'noche' };
  const r = rutinaPareja(progreso, clave, h, diaSemanaDe(d), d, ctx.aldea || progreso.aldea);
  if (['local', 'trabajo', 'obra'].includes(r.lugar) && r.punto !== 'cliente') return { ok: false, motivo: 'trabaja' };
  return { ok: true, motivo: null };
}
export const FRASES_JUNTOS = {
  si: { saliendo: 'Dale, vamos. Despacito, que quiero mirar todo.', novios: '¡Vamos! Dame la mano.', comprometidos: '¡Vamos! Dame la mano, que ya sos casi mi marido.', casados: 'Vamos. Del brazo, como los viejitos de la plaza.' },
  no: { trabaja: 'Ahora no puedo, estoy trabajando. A la tarde, si querés.', noche: '¿A esta hora? Mañana, mejor.', no: 'Mejor otro día.' },
  chau: 'Bueno, hasta acá llego. Gracias por el paseo.',
  opcion: 'Salir a caminar juntos', soltar: 'Hasta acá, gracias',
};
// El desayuno de la mañana después (una nota tierna, sin mostrar nada de la noche)
export const FRASES_MANANA = {
  refugio: ['{ella} ya puso la pava', 'Hay pan tostado y mate en la mesa'],
  suya: ['{ella} te despierta con mate', 'Hay pan casero y dulce en la mesa'],
};
// La fiesta
export const FRASES_FIESTA = {
  empieza: { salon: ['¡Que vivan los novios!', 'Hay fiesta en el salón: música, empanadas y un brindis'], plaza: ['¡Que vivan los novios!', 'Hay fiesta en la plaza: una mesa larga, música y un brindis'] },
  brindis: ['¡Un brindis por los novios!', 'Todos levantan el vaso'],
};
export const JUEZ = {
  clave: 'juez', nombre: 'El juez de paz', oficio: 'juez de paz', mano: 'planilla',
  colores: { ropa: '#3a3a42', abrigo: '#24242a', gorro: null, pelo: '#9a9690', barba: '#a8a49e' },
  saludo: 'Buen día. Vine en el tren de la mañana con el libro de actas. Cuando estén listos, los caso.', despedida: 'Que sean muy felices. Yo me vuelvo en el tren.',
};
// ¿Están despiertos los hijos, a esta hora, en su cuarto? (para la luz del cuarto y el bebé en la cuna; el ñiki ñiki lo
// decide amor.js con `hijosDormidos`)
export const esNocheDeChicos = (h) => horaNorm(h) >= 19.5 || horaNorm(h) < 7.5;
// Los candidatos y su casa (para las pruebas y el cuaderno): clave → casa
export const CASAS_CANDIDATAS = Object.fromEntries(Object.keys(CANDIDATAS).map((k) => [k, casaDeElla(k)]));
