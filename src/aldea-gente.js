// 3.6: la gente de la Aldea de los Duendes en el juego (las reglas están en aldea.js).
// Reemplaza a pueblo-mundo.js de la 3.1 (el "fundar el pueblo": casas tuyas, nombre y
// cartel), que se sacó a pedido del usuario (ver PLAN_ALDEA.md, sección 10).
//
// Lo que hace:
//   · los vecinos de siempre (el jefe de estación, Nélida, la abuela, la familia Jones con sus
//     dos chicos y la galesa de la casa de té) desde el día 1, y los pobladores que se quedan,
//     como gente de gente.js con horario: cada uno va a donde le toca a esa hora
//     (`rutinaAldea`), por las calles de la aldea (`caminoAldea`), y entra a los edificios por
//     la puerta. Ercilia, que en el Relax se mudó a la aldea con el almacén, es la de gente.js
//     (no se arma otra): sigue su horario y, atendiendo, su ruta de siempre detrás del mostrador;
//   · con vos a más de 150 m de la aldea no se dibujan ni se mueven: se los deja directo en su
//     punto, así al llegar cada uno está donde corresponde (las figuras se arman de a una, la
//     primera vez que te acercás a 260 m);
//   · la llegada: cuando la trochita para en la aldea y `puedeLlegar`, baja el próximo y espera
//     en el andén; le hablás con E, se presenta, pide quedarse y al aceptarlo se abre la obra de
//     su lote (mientras dura, duerme en la estación y de día trabaja en la obra);
//   · las obras del pueblo: aportar con E parado en el lote, y el reloj del juego que las
//     termina (`avanzarObras`, que nunca da dos etapas por una aunque duermas);
//   · lo que ofrece cada poblador una vez por día (`servicioDe`), con sus efectos de verdad;
//   · las charlas entre vecinos que están juntos: si pasás a menos de 6 m, un subtítulo chico,
//     una línea por vez, sin pausar nada (y el domingo, los cuentos de la abuela);
//   · la ficha de la aldea en el cuaderno;
//   · 3.6 (vida): en el tiempo libre (fuera de lo que fija el horario) cada uno elige qué hacer
//     según sus ganas, su forma de ser, sus amigos y el clima (`elegirActividad` de vecindad.js):
//     un té, la plaza, visitar a un amigo, los mandados, la leña, regar, palear la nieve, un paseo
//     hasta la estación, leer, jugar. Lo elegido dura lo suyo (no se cambia a cada rato) y se nota
//     con una pose de gente.js (sentado, leyendo, paleando, partiendo leña, regando, mirando,
//     jugando). Lejos, igual que siempre: no se camina, sólo se ubica;
//   · 3.6 (vida): la invitación a la casa de té (`citar`): el invitado va por las calles a su mesa;
//   · 3.7.0: las nueve de la calle de la Loma (Martina va y viene del muelle del lago, a medio kilómetro;
//     Valentina trabaja de noche), la escena de llegada con el objeto de cada una, los chicos que crecen
//     (la talla, la ropa y lo que dicen), los cumpleaños (el aviso del día antes y la fiesta), el cachorro
//     de la Chola, los visitantes del tren que guiás hasta un lugar del valle, la visita de tu familia al
//     refugio, las cartas de la aldea, el apodo, las charlas por la radio de la seccional (Julia con
//     Josefina) y el calendario en el cuaderno. Las reglas, en aldea.js y aldea-vida.js.
//
// Para el mundo (quien dibuja los edificios): `estadoVisual(aldea, id)` dice qué etapa dibujar
// y `escucharAldea` (aldea.js) avisa cuando algo cambia ('aceptado', 'trabajando', 'etapa',
// 'abierto'…).
//
// Sin three ni DOM (se prueba en Node): las figuras las arma gente.js y lo demás llega por `ctx`.
import { elegirActividad, cumplirActividad, estaLibre, climaDe, ACTIVIDADES, NOCHE_AFUERA, sumarAmistadDe, proximoChisme, revelarGusto, amistades } from './vecindad.js';
import { vidaNueva, ritmoDe, fechaDe, avisoDiaAntes, avisoDelDia, calendarioDelAnio, listaCumples, visitanteDelDia, textosVisitante, empezarGuia, guiado, visitanteSeVa, lineaGuiado, LUGARES_VISITA, RADIO_GUIADO, cachorrosNacen, nacenCachorros, ofertaCachorro, ofrecido, adoptarMascota, etapaMascota, apodoDe, apodoPorId, FAMILIA, HORAS_FAMILIA, familiaDeHoy, avisoFamilia, terminarVisitaFamilia, opinionesFamilia, cartaDeLaAldea, fuisteALaAldea, visitanteDef, nombreCortoDe, FIESTAS_ALDEA } from './aldea-vida.js';
import { fichaVecinos } from './vecindad-juego.js';
import { desfaseDe, NOMBRE_ALDEA, PARADA_ALDEA, EDIFICIOS_ALDEA, IDS_EDIFICIOS, CALLES_ALDEA, marcoAldea, puntosDe, dentroDePlanta, VECINOS_ALDEA, ORDEN_VECINOS_ALDEA, VECINOS_DEL_VALLE, POBLADORES_ALDEA, LOTE_DE, esVecinoAldea, esPobladorAldea, aldeaNueva, puedeLlegar, empezarLlegada, aceptar, llamarProximo, obraEnCurso, aportar, avanzarObras, etapaDe, estadoEdificio, localAbierto, servicioDe, aplicarAlAldea, rutinaAldea, diaSemanaDe, elegirCharla, charlasPosibles, ETAPAS_OBRA, anotacionesDe, anotacionesPedidas, quienLlega, puntosFijosDe, esPuntoLejano, pasarDiaChicos, tallaDe, coloresDe, dichosDe, CHICOS_ALDEA, NOMBRES_RADIO, quienesCharlan, fiestaDeCumple, CARRERAS, SENTADO_ADENTRO, ESCALERAS_ALDEA } from './aldea.js';

// a cuántos metros de la aldea (del rectángulo que ocupa) la gente se mueve y se ve, y a
// cuántos se arman las figuras
export const RADIO_ALDEA = 150;
export const RADIO_FIGURAS = 260;
// adentro de un edificio, a la gente se la ve sólo de cerca (como los muebles)
export const VER_ADENTRO = 25;
// dónde se oyen las charlas entre vecinos
export const OIR_CHARLA = 6;

const minus = (t) => `${t.charAt(0).toLowerCase()}${t.slice(1)}`;
const mayus = (t) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
const pila = (nombre) => String(nombre).split(' ')[0];
const NOMBRE_MAT = { tronco: ['tronco', 'troncos'], tabla: ['tabla', 'tablas'], piedra: ['piedra', 'piedras'] };
// "6 tablas, 2 troncos y 1 piedra"
export function listaMateriales(m) {
  const partes = Object.entries(m || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${(NOMBRE_MAT[k] || [k, k])[n === 1 ? 0 : 1]}`);
  if (partes.length < 2) return partes[0] || '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
const nombreLocal = (id) => minus(EDIFICIOS_ALDEA[id].nombre);   // "la panadería"
// 3.6.1: «falta 1 piedra» (no «faltan 1 piedra»): una sola cosa y una sola unidad, en singular
export const verboFalta = (m) => { const v = Object.values(m || {}).filter((x) => x > 0); return v.length === 1 && v[0] === 1 ? 'falta' : 'faltan'; };

// ---------------------------------------------------------------- lo que dibuja el mundo
// La etapa a dibujar de cada edificio: 'abierto' (terminado y abierto), 'a-medio' (la escuela
// antes de la maestra: cimientos y estructura hechos, sin obra), 'lote' (el terreno de un
// local que todavía no tiene dueño) u 'obra-1'…'obra-4' mientras se levanta: el número es la
// etapa que se está haciendo (1 cimientos, 2 estructura, 3 paredes y techo, 4 terminaciones),
// así que lo hecho son las anteriores (obra-1: el lote marcado, sin nada; obra-3: cimientos y
// estructura). Para el detalle (lo aportado, si los vecinos ya trabajan) está `etapaDe`.
export function estadoVisual(aldea, id) {
  const e = estadoEdificio(aldea, id);
  if (e !== 'obra') return e;
  const et = etapaDe(aldea, id);
  return `obra-${Math.min(ETAPAS_OBRA.length, et.hechas + 1)}`;
}

// ---------------------------------------------------------------- por las calles
// El grafo de las calles (en el plano de la aldea): las puntas y los cruces, unidos a lo largo
// de cada calle. Se arma una vez.
const segmentos = [];
for (const c of CALLES_ALDEA) for (let i = 0; i < c.puntos.length - 1; i++) segmentos.push({ calle: c.id, a: c.puntos[i], b: c.puntos[i + 1] });
function cruce(s, t) {
  const [ax, az] = s.a, [bx, bz] = s.b, [cx, cz] = t.a, [dx, dz] = t.b;
  const r1x = bx - ax, r1z = bz - az, r2x = dx - cx, r2z = dz - cz;
  const den = r1x * r2z - r1z * r2x;
  if (Math.abs(den) < 1e-9) return null;
  const u = ((cx - ax) * r2z - (cz - az) * r2x) / den, v = ((cx - ax) * r1z - (cz - az) * r1x) / den;
  if (u < -1e-6 || u > 1 + 1e-6 || v < -1e-6 || v > 1 + 1e-6) return null;
  return [ax + r1x * u, az + r1z * u];
}
const NODOS = [];
const nodoEn = (p) => {
  let i = NODOS.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.01);
  if (i < 0) { NODOS.push([p[0], p[1]]); i = NODOS.length - 1; }
  return i;
};
const paramEn = (s, p) => { const vx = s.b[0] - s.a[0], vz = s.b[1] - s.a[1]; return ((p[0] - s.a[0]) * vx + (p[1] - s.a[1]) * vz) / (vx * vx + vz * vz); };
for (const s of segmentos) {
  const ids = new Set([nodoEn(s.a), nodoEn(s.b)]);
  for (const t of segmentos) { if (t === s) continue; const p = cruce(s, t); if (p) ids.add(nodoEn(p)); }
  s.nodos = [...ids].sort((i, j) => paramEn(s, NODOS[i]) - paramEn(s, NODOS[j]));
}
const VECINOS_NODO = NODOS.map(() => []);
for (const s of segmentos) for (let k = 0; k < s.nodos.length - 1; k++) {
  const i = s.nodos[k], j = s.nodos[k + 1], d = Math.hypot(NODOS[i][0] - NODOS[j][0], NODOS[i][1] - NODOS[j][1]);
  VECINOS_NODO[i].push([j, d]); VECINOS_NODO[j].push([i, d]);
}
// El punto de calle más cercano a (x, z): en qué segmento cae y entre qué nodos.
function proyectar(x, z) {
  let mejor = null;
  for (const s of segmentos) {
    const t = Math.max(0, Math.min(1, paramEn(s, [x, z])));
    const p = [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
    const d = Math.hypot(p[0] - x, p[1] - z);
    if (!mejor || d < mejor.d) mejor = { s, t, p, d };
  }
  // los nodos de ese segmento que quedan a cada lado del punto
  const antes = mejor.s.nodos.filter((i) => paramEn(mejor.s, NODOS[i]) <= mejor.t + 1e-9);
  const despues = mejor.s.nodos.filter((i) => paramEn(mejor.s, NODOS[i]) >= mejor.t - 1e-9);
  mejor.lados = [antes[antes.length - 1], despues[0]].filter((i) => i !== undefined);
  return mejor;
}
// ¿El tramo derecho de `a` a `b` (en el plano) atraviesa algún edificio cerrado? (sin contar
// los de las puntas)
export function atraviesa(a, b) {
  const ea = edificioEn(a.x, a.z), eb = edificioEn(b.x, b.z);
  const largo = Math.hypot(b.x - a.x, b.z - a.z), pasos = Math.max(2, Math.ceil(largo / 0.4));
  for (let i = 1; i < pasos; i++) {
    const e = edificioEn(a.x + (b.x - a.x) * (i / pasos), a.z + (b.z - a.z) * (i / pasos));
    if (e && e !== ea && e !== eb) return true;
  }
  return false;
}
// El camino (en el plano) de `desde` a `hasta` por las calles, sin `desde`: [entrada a la
// calle, cruces…, salida de la calle, hasta]. Cerca y sin un edificio en el medio, derecho.
export function caminoAldea(desde, hasta, derecho = 10) {
  const d0 = Math.hypot(hasta.x - desde.x, hasta.z - desde.z);
  if (d0 < derecho && !atraviesa(desde, hasta)) return [{ x: hasta.x, z: hasta.z }];
  const A = proyectar(desde.x, desde.z), B = proyectar(hasta.x, hasta.z);
  let medio = [];
  if (A.s !== B.s || A.lados.join() !== B.lados.join()) {
    // Dijkstra chico (una veintena de nodos), desde los lados de A hasta los lados de B
    const dist = NODOS.map(() => Infinity), previo = NODOS.map(() => -1), hecho = NODOS.map(() => false);
    for (const i of A.lados) dist[i] = Math.hypot(NODOS[i][0] - A.p[0], NODOS[i][1] - A.p[1]);
    for (;;) {
      let u = -1;
      for (let i = 0; i < NODOS.length; i++) if (!hecho[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      hecho[u] = true;
      for (const [v, w] of VECINOS_NODO[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; previo[v] = u; }
    }
    let fin = -1, total = Infinity;
    for (const i of B.lados) { const t = dist[i] + Math.hypot(NODOS[i][0] - B.p[0], NODOS[i][1] - B.p[1]); if (t < total) { total = t; fin = i; } }
    for (let i = fin; i >= 0; i = previo[i]) medio.unshift(i);
    medio = medio.map((i) => ({ x: NODOS[i][0], z: NODOS[i][1] }));
  }
  const lista = [{ x: A.p[0], z: A.p[1] }, ...medio, { x: B.p[0], z: B.p[1] }, { x: hasta.x, z: hasta.z }];
  // sin puntos repetidos (ni el de partida)
  const salida = [];
  let ult = desde;
  for (const q of lista) { if (Math.hypot(q.x - ult.x, q.z - ult.z) > 0.3) salida.push(q); ult = q; }
  if (!salida.length || Math.hypot(salida[salida.length - 1].x - hasta.x, salida[salida.length - 1].z - hasta.z) > 0.01) salida.push({ x: hasta.x, z: hasta.z });
  return salida;
}
// El edificio cerrado (no la plaza) en el que cae el punto del plano, o null.
export function edificioEn(lx, lz) {
  for (const id of IDS_EDIFICIOS) if (!EDIFICIOS_ALDEA[id].abierta && dentroDePlanta(id, lx, lz, 0.05)) return id;
  return null;
}
// Por dónde se sale (y se entra) de cada edificio: la puerta y, en la estación, la salida a la
// calle (el galpón queda entre el andén y la calle).
function umbral(id) {
  const p = puntosDe(id);
  // (3.7.0 (integración): por el zaguán, frente a la puerta de verdad: no se atraviesa la pared)
  return p.salida ? [p.puerta, p.salida] : p.puerta ? (p.zaguan ? [p.zaguan, p.puerta] : [p.puerta]) : [];
}
// El recorrido completo de un punto a otro del plano: de adentro sale por la puerta, va por
// las calles y entra por la puerta del otro (los tramos de puerta para adentro, sin choques).
// 3.6.2: cuántos metros se caminan de verdad de un punto del plano a otro (por las puertas y las calles)
export function largoRecorrido(desde, hasta) {
  let p = desde, s = 0;
  for (const q of recorridoAldea(desde, hasta)) { s += Math.hypot(q.x - p.x, q.z - p.z); p = q; }
  return s;
}
export function recorridoAldea(desde, hasta) {
  const sale = edificioEn(desde.x, desde.z), entra = edificioEn(hasta.x, hasta.z);
  const pasos = [];
  if (sale && sale === entra) return [{ x: hasta.x, z: hasta.z, sinChoque: true }];
  let p0 = desde;
  if (sale) for (const q of umbral(sale)) { pasos.push({ x: q.x, z: q.z, sinChoque: true }); p0 = q; }
  const puertas = entra ? [...umbral(entra)].reverse() : [];
  const meta = puertas[0] || hasta;
  for (const q of caminoAldea(p0, meta, entra || sale ? 4 : 10)) pasos.push({ x: q.x, z: q.z });
  for (const q of puertas.slice(1)) pasos.push({ x: q.x, z: q.z, sinChoque: true });
  if (entra) pasos.push({ x: hasta.x, z: hasta.z, sinChoque: true });
  return pasos;
}

// Dónde va cada persona a esta hora: el punto del plano y del mundo. Si dos o más van al mismo
// punto (la familia a la mesa, dos obreros al mismo lado de la obra), se acomodan alrededor.
// 3.6 (vida): `elegidas` (clave → { lugar, edificio, punto, actividad }) manda sobre el horario:
// lo que eligió en su tiempo libre, o la mesa de la casa de té a la que lo invitaste.
const PUNTO_ADENTRO = new Map();   // 'edificio|punto' → ¿el punto cae adentro de un edificio?
export function destinosAldea(aldea, horas, dia, personas, M = marcoAldea(PARADA_ALDEA), elegidas = null) {
  const ds = diaSemanaDe(dia);
  const salida = new Map(), juntos = new Map();
  for (const k of personas) {
    const r = elegidas?.get(k) || rutinaAldea(k, horas, ds, aldea, dia);   // (3.7.0: con el día, por los cumpleaños)
    if (!r.lugar || !r.edificio) continue;
    // 3.6 (optimizar): los puntos sin copiar y si el punto está adentro, una vez por punto (no cambian)
    const pts = puntosFijosDe(r.edificio);
    const q = pts[r.punto] || pts.adentro || pts.puerta;
    if (!q) continue;
    const clave = `${r.edificio}|${r.punto}`;
    if (!juntos.has(clave)) juntos.set(clave, []);
    juntos.get(clave).push(k);
    let adentro = PUNTO_ADENTRO.get(clave);
    if (adentro === undefined) { adentro = !!edificioEn(q.x, q.z); PUNTO_ADENTRO.set(clave, adentro); }
    // (3.7.0 (integración): Malena en el banco del torno y Pocha en la silla de la máquina, sentadas; lo de arriba
    // de una escalera, `arriba`)
    const sentado = SENTADO.test(r.punto || '') || (r.punto === 'adentro' && SENTADO_ADENTRO.includes(r.edificio));
    salida.set(k, { ...r, clave, lx: q.x, lz: q.z, rot: q.rot, adentro, sentado, lejano: esPuntoLejano(r.punto), arriba: esArriba(r.edificio, r.punto) });   // (3.7.0: lejano: el muelle del lago)
  }
  for (const lista of juntos.values()) {
    if (lista.length < 2) continue;
    lista.forEach((k, i) => {
      const d = salida.get(k), a = (i / lista.length) * Math.PI * 2;
      d.sentado = false;   // 3.6: en una silla entra uno solo: los que se acomodan alrededor, parados
      d.lx += Math.sin(a) * 0.55; d.lz += Math.cos(a) * 0.55;
      // y se miran entre ellos
      d.rot = Math.atan2(-Math.sin(a), -Math.cos(a));
    });
  }
  for (const d of salida.values()) { const w = M.aMundo(d.lx, d.lz); d.x = w.x; d.z = w.z; d.mira = M.rotMundo(d.rot); }
  return salida;
}

// 3.7.0 (integración): ¿el punto está arriba de una escalera (la torreta del observatorio)?
export const esArriba = (edificio, punto) => Object.hasOwn(ESCALERAS_ALDEA, edificio || '') && ESCALERAS_ALDEA[edificio].altos.includes(punto);
// El recorrido (en el plano) a lo de arriba de una escalera y desde ahí: por el rodeo, el pie y el tope, sin
// choques (adentro). `subir`: los pasos desde el rodeo hasta el punto; `bajar`: desde arriba hasta el rodeo.
// (`alto`: la altura sobre el lote, en los escalones y arriba: ahí la gente va por la rampa, no por el piso)
export function tramoEscalera(edificio, punto, subir = true) {
  const E = ESCALERAS_ALDEA[edificio], P = puntosFijosDe(edificio);
  if (!E) return [];
  const q = (k, alto) => ({ x: P[k].x, z: P[k].z, sinChoque: true, precisa: true, ...(Number.isFinite(alto) ? { alto } : {}) });
  const lista = [...E.rodeo.map((k) => q(k)), q(E.pie), q(E.base, E.piso), q(E.cima, E.alto), q(E.tope, E.alto)];
  if (subir) { if (punto !== E.tope && P[punto]) lista.push(q(punto, E.alto)); return lista.slice(1); }
  return lista.reverse();
}
// 3.6 (vida): los puntos con silla o banco (la mesa de té, la mesa de lectura, el banco de la
// plaza, el pupitre, la silla del salón, el sillón de los cuentos): ahí se sientan.
const SENTADO = /^(mesa-[0-9]|lectura-|estar-|pupitre-|lugar-|cuentos$)/;
// 3.6.1: los cuatro almohadones de la alfombra de la biblioteca (lectura-13 a 16, ver aldea.js) y su
// altura (el almohadón de aldea-arquitectura.js: a 10 cm del piso, de 28 cm aplastado a un tercio)
export const ALMOHADONES = new Set(['lectura-13', 'lectura-14', 'lectura-15', 'lectura-16']);
export const ALTURA_ALMOHADON = 0.2;
// La pose de gente.js para lo que está haciendo, ya llegado (null: parado, como siempre).
export function poseDe(d) {
  if (!d) return null;
  const act = d.actividad;
  // (3.7.0 (integración): sentadas en lo suyo, el gesto de su oficio)
  if (d.sentado && d.punto === 'adentro' && (d.lugar === 'local' || d.lugar === 'trabajo') && Object.hasOwn(GESTO_SENTADO, d.edificio || '')) return GESTO_SENTADO[d.edificio];
  if (d.sentado) return act === 'leer' ? 'leyendo' : 'sentado';
  if (act === 'palear') return 'palear';
  if (act === 'lena') return 'hachar';
  if (act === 'regar') return 'regar';
  if (act === 'jugar') return 'jugar';
  if (act === 'paseo' || act === 'galeria') return 'mirar';
  if (d.lugar === 'obra') return 'hachar';   // los vecinos trabajando en la obra del pueblo
  // 3.6 (mecánicas): el jefe con la soga del mástil, el baile y el músico del sábado, y el gesto de
  // cada oficio mientras trabaja en su local
  if (d.punto === 'soga') return 'izar';
  if (/^baile-/.test(d.punto || '')) return 'bailar';
  if (d.lugar === 'salon' && d.punto === 'escenario') return 'tocar';
  if ((d.lugar === 'local' || d.lugar === 'trabajo') && Object.hasOwn(GESTO_OFICIO, d.edificio || '')) {
    const g = GESTO_OFICIO[d.edificio];
    return typeof g === 'function' ? g(d) : g;
  }
  return null;
}
// 3.6 (mecánicas): el gesto de cada oficio (el panadero amasa, el herrero martilla, el carpintero sierra)
const GESTO_OFICIO = { herreria: 'martillar', panaderia: 'amasar', carpinteria: 'serruchar',
  // 3.7.0 (integración): Valentina en el telescopio, Abril en el atril, Ayelén en la camilla, Inés con el mortero,
  // Martina con el bote
  observatorio: (d) => (d.punto === 'telescopio' ? 'telescopio' : null), 'taller-arte': (d) => (d.punto === 'adentro' ? 'pintar' : null),
  veterinaria: (d) => (d.punto === 'adentro' || d.punto === 'corral' ? 'curar' : null), herboristeria: (d) => (d.punto === 'adentro' ? 'amasar' : null),
  varadero: (d) => (d.punto === 'adentro' ? 'martillar' : null) };
const GESTO_SENTADO = { ceramica: 'tornear', costureria: 'coser' };

// Lo que se ve de la aldea desde un punto del mundo: cuánto falta para el rectángulo que ocupa.
export function distanciaAldea(x, z, M = marcoAldea(PARADA_ALDEA)) {
  const l = M.aLocal(x, z);
  // (3.7.0: con la calle de la Loma, hasta x = −150)
  const dx = Math.max(-150 - l.lx, 0, l.lx - 92), dz = Math.max(-2 - l.lz, 0, l.lz - 72);
  return Math.hypot(dx, dz);
}

// ---------------------------------------------------------------- en el juego
// `ctx`: progreso(), gente(), tren(), jugador(), alturaDePie(x, z, y), nota(t, sub, nueva),
// guardar(), sonido, redibujar(), registrar(id), sumarMaterial(k, n), sumarEntrada(k, n),
// conMateriales(fn), refrescarBarra(), hablandoCon(), alJugador(campo, valor), leerCarta(id),
// mandarFoto(id), partitura(id), pronostico(), ambiente() → { clima, estacion }, decir(texto).
export function crearAldeaGente(ctx) {
  const M = marcoAldea(PARADA_ALDEA);
  const personas = new Map();   // clave → { npc, destino, clave del destino, trabado }
  let acum = 0, lejos = Infinity, charlaHoy = 0;
  let saltos = 0;   // los que se trabaron caminando y llegaron de una (para las pruebas)

  const progreso = () => ctx.progreso();
  function aldea() {
    const p = progreso();
    if (!p.aldea || typeof p.aldea !== 'object') p.aldea = aldeaNueva();
    return p.aldea;
  }
  const dia = () => Math.max(1, Math.floor(progreso().dia || 1));
  const horas = () => Number(progreso().horas) || 0;
  // 3.7.0: la vida de la aldea (progreso.vidaAldea) y su ritmo (el ajuste)
  function vida() {
    const p = progreso();
    if (!p.vidaAldea || typeof p.vidaAldea !== 'object') p.vidaAldea = vidaNueva(dia());
    return p.vidaAldea;
  }
  const ritmo = () => ctx.ritmo?.() || 'normal';
  const defDe = (k) => (Object.hasOwn(VECINOS_ALDEA, k) ? VECINOS_ALDEA[k] : Object.hasOwn(POBLADORES_ALDEA, k) ? POBLADORES_ALDEA[k] : null);
  // el nombre (para las charlas): Ercilia es la de gente.js
  const nombreDe = (k) => defDe(k)?.nombre || personas.get(k)?.npc?.nombre || mayus(k);
  // los que viven (o esperan) en la aldea: los vecinos, Ercilia (que se mudó con el almacén) y
  // los pobladores
  function presentes() {
    const a = aldea();
    const lista = [...ORDEN_VECINOS_ALDEA, ...Object.keys(VECINOS_DEL_VALLE), ...(a.pobladores || []).map((p) => p.clave).filter(esPobladorAldea)];
    if (a.llegando && esPobladorAldea(a.llegando.clave) && !lista.includes(a.llegando.clave)) lista.push(a.llegando.clave);
    return lista;
  }

  // ---------------------------------------------------------------- las figuras
  // 3.6: Ercilia (y quien venga del valle) no se arma de nuevo: es la de gente.js, con su saludo,
  // sus historias y su ruta detrás del mostrador (que en el Relax queda en el almacén de la aldea).
  // Se la toma tal cual; el que está de visita en tu mesa se deja para después.
  function adoptar(k) {
    const npc = (ctx.gente?.()?.gente || []).find((x) => x.clave === k);
    if (!npc || npc.deVisita || npc.aBordo) return null;
    const st = personas.get(k);
    st.rutaPropia = Array.isArray(npc.ruta) && npc.ruta.length ? npc.ruta : null;
    npc.claveAldea = k;
    npc.camino = [];
    return npc;
  }
  // ¿Le toca estar en su ruta de siempre? (Ercilia atendiendo el almacén, con la ruta en la aldea)
  function usaRutaPropia(k, st, d) {
    const v = Object.hasOwn(VECINOS_DEL_VALLE, k) ? VECINOS_DEL_VALLE[k] : null;
    if (!v || !st.rutaPropia || d.edificio !== v.trabajo || d.punto !== 'adentro') return false;
    const q = st.rutaPropia[0];
    return distanciaAldea(q.x, q.z, M) < 1;
  }
  function aRutaPropia(n, st, saltar = false) {
    if (saltar) { const q = st.rutaPropia[0]; n.pos.set(q.x, ctx.alturaDePie(q.x, q.z, n.pos.y), q.z); }
    n.camino = null;
    n.ruta = st.rutaPropia;
    n.etapa = 0; n.espera = 0;
    n.soloCerca = 0;
  }
  // (3.7.0 (integración): en tres partes: lo que se le pide a gente.js, armarla (de una o de a poco) y completarla)
  function defFigura(k, d) {
    const def = defDe(k);
    const vecino = esVecinoAldea(k);
    const llegando = aldea().llegando?.clave === k;
    // 3.7.0: los chicos, según la etapa (la ropa, la talla y lo que dicen)
    const dichos = dichosDe(k, aldea()) || def;
    return {
      clave: `${vecino ? 'aldea' : 'poblador'}-${k}`, colores: coloresDe(k, aldea()) || def.colores, pos: { x: d.x, z: d.z },
      mira: { x: d.x + Math.sin(d.mira), z: d.z + Math.cos(d.mira) },
      nombre: def.nombre, oficio: dichos.oficio, saludo: llegando ? 'Buenas. ¿Usted es de la aldea?' : dichos.saludo,
      despedida: llegando ? 'Lo espero acá, en el andén.' : dichos.despedida,
      mano: def.mano, velocidad: def.chico ? 1.05 : 0.85, camino: [], talla: tallaDe(k, aldea()) ?? def.talla,
      llegando,
    };
  }
  function completarFigura(npc, k, d, llegando) {
    if (!npc) return null;
    npc.claveAldea = k;
    npc.llegando = llegando;
    npc.miraFinal = d.mira;
    npc.soloCerca = d.adentro ? VER_ADENTRO : 0;
    return npc;
  }
  function crearFigura(k, d) {
    if (Object.hasOwn(VECINOS_DEL_VALLE, k)) return adoptar(k);
    const g = ctx.gente?.();
    if (!g?.agregarPoblador) return null;
    const def = defFigura(k, d);
    return completarFigura(g.agregarPoblador(def), k, d, def.llegando);
  }
  // 3.7.0 (integración): las figuras se arman de a una y de a poco (unos ms por cuadro, ver armarPobladorDeAPoco
  // en gente.js): armar a alguien entero costaba 20 a 30 ms en el cuadro en que te acercabas. En la portada se
  // arman todas las de los que están en la aldea (`prearmar`), así al llegar ya están.
  let armando = null;   // { k, tarea, def }
  const MS_FIGURA = 3;
  function ubicarNueva(k, st) {
    st.clave = st.destino.clave;
    ubicar(st.npc, st.destino);
    if (usaRutaPropia(k, st, st.destino)) aRutaPropia(st.npc, st, true);
    st.npc.dormido = lejos > RADIO_ALDEA;
    if (st.destino.lejano) { st.npc.enLejano = true; st.npc.dormido = !cercaDe(st.npc); }   // 3.7.0
  }
  // Avanza el armado (`ms`: cuánto puede tardar); empieza el de la próxima que falte. Devuelve cuántas faltan.
  function avanzarArmado(ms, dt = 0) {
    if (!(ms > 0)) return faltan();   // (el planificador no dio lugar en este cuadro)
    const g = ctx.gente?.();
    if (armando) {
      const st = personas.get(armando.k);
      // (si en el medio se armó de otra forma, o ya no está, se descarta)
      if (!st || st.npc || !st.destino) { armando.tarea?.npc && g?.quitar?.(armando.tarea.npc); armando = null; }
      else if (armando.tarea.avanzar(ms)) {
        const k = armando.k;
        st.npc = completarFigura(armando.tarea.npc, k, st.destino, armando.def.llegando);
        armando = null;
        if (st.npc) ubicarNueva(k, st);
        return faltan();
      } else return faltan();
    }
    for (const [k, st] of personas) {
      if (st.npc || !st.destino) continue;
      // (la que no se pudo tomar, como Ercilia de visita en tu mesa, se reintenta más tarde)
      if (st.reintento > 0) { st.reintento -= dt; continue; }
      if (Object.hasOwn(VECINOS_DEL_VALLE, k) || !g?.armarPobladorDeAPoco) {
        st.npc = crearFigura(k, st.destino);
        if (!st.npc) { st.reintento = 3; continue; }
        ubicarNueva(k, st);
        break;
      }
      const def = defFigura(k, st.destino);
      armando = { k, def, tarea: g.armarPobladorDeAPoco(def) };
      if (armando.tarea.avanzar(ms)) {
        st.npc = completarFigura(armando.tarea.npc, k, st.destino, def.llegando);
        armando = null;
        if (st.npc) ubicarNueva(k, st);
      }
      break;
    }
    return faltan();
  }
  const faltan = () => { let n = 0; for (const st of personas.values()) if (!st.npc && st.destino) n++; return n; };
  // En la portada: los que están en la aldea, a la hora de la partida (`ms` por llamada). Devuelve cuántas faltan.
  function prearmar(ms = 10) {
    const lista = presentes();
    for (const k of lista) if (!personas.has(k)) personas.set(k, { npc: null, destino: null, clave: '', trabado: { d: Infinity, t: 0 } });
    const sinDestino = [...personas.values()].some((st) => !st.npc && !st.destino);
    if (sinDestino) {
      const destinos = destinosAldea(aldea(), horas(), dia(), lista, M);
      for (const [k, st] of personas) if (!st.destino && destinos.get(k)) st.destino = destinos.get(k);
    }
    const t0 = performance.now();
    let n = faltan();
    while (n && performance.now() - t0 < ms) n = avanzarArmado(Math.max(1, ms - (performance.now() - t0)));
    return n;
  }
  // 3.6.1: la altura del asiento donde se sienta (para la pose de gente.js): la silla de verdad que
  // está en ese punto (`ctx.asientoEn`, de los asientos de la aldea) o, en los almohadones de la
  // alfombra de la biblioteca (que no son asientos del jugador), su altura. Se guarda por punto.
  const asientos = new Map();
  function alturaAsiento(d, npc) {
    if (!d?.sentado) return undefined;
    const clave = `${d.clave}|${d.lx.toFixed(2)}|${d.lz.toFixed(2)}`;
    if (!asientos.has(clave)) {
      let a = ALMOHADONES.has(d.punto) && d.edificio === 'biblioteca' ? ALTURA_ALMOHADON : ctx.asientoEn?.(d.x, d.z, npc.pos.y);
      asientos.set(clave, Number.isFinite(a) ? a : undefined);
    }
    return asientos.get(clave);
  }
  // 3.7.0 (integración): lo de arriba de una escalera se busca desde el piso de arriba (si no, quedaba abajo)
  const yDesde = (npc, d) => (d.arriba ? EDIFICIOS_ALDEA[d.edificio].y + ESCALERAS_ALDEA[d.edificio].alto + 0.1 : npc.pos.y);
  function ubicar(npc, d) {
    npc.pos.set(d.x, ctx.alturaDePie(d.x, d.z, yDesde(npc, d)), d.z);
    npc.camino = [];
    npc.espera = 0;
    npc.miraFinal = d.mira;
    npc.rumbo = npc.rumboObjetivo = d.mira;
    if (npc.g?.rotation) npc.g.rotation.y = d.mira;
    npc.soloCerca = d.adentro ? VER_ADENTRO : 0;
    npc.pose = poseDe(d);   // 3.6 (vida)
    npc.asiento = alturaAsiento(d, npc);   // 3.6.1
  }
  function encaminar(npc, d) {
    const l = M.aLocal(npc.pos.x, npc.pos.z);
    // 3.7.0 (integración): por la escalera: si está arriba, baja primero (hasta el rodeo); si va arriba, sube
    // desde el rodeo
    const pasos = [];
    let desde = { x: l.lx, z: l.lz };
    const ed = edificioEn(l.lx, l.lz);
    if (ed && Object.hasOwn(ESCALERAS_ALDEA, ed) && npc.pos.y > EDIFICIOS_ALDEA[ed].y + 1.5 && !(d.arriba && d.edificio === ed)) {
      const baja = tramoEscalera(ed, null, false);
      pasos.push(...baja);
      desde = baja[baja.length - 1];
    }
    if (d.arriba) {
      const P = puntosFijosDe(d.edificio), E = ESCALERAS_ALDEA[d.edificio];
      const yaArriba = ed === d.edificio && npc.pos.y > EDIFICIOS_ALDEA[ed].y + 1.5;
      if (yaArriba) pasos.push({ x: d.lx, z: d.lz, sinChoque: true });
      else {
        const r0 = P[E.rodeo[0]];
        pasos.push(...recorridoAldea(desde, { x: r0.x, z: r0.z }), ...tramoEscalera(d.edificio, d.punto, true));
        // (el último, donde le toca: el punto, acomodado si hay más de uno)
        pasos[pasos.length - 1] = { x: d.lx, z: d.lz, sinChoque: true };
      }
    } else pasos.push(...recorridoAldea(desde, { x: d.lx, z: d.lz }));
    // (3.7.0 (integración): los de la escalera, con su altura y precisos: si no, se cortaba camino y no subía)
    const yEsc = (q) => (Number.isFinite(q.alto) ? { y: EDIFICIOS_ALDEA[d.arriba ? d.edificio : ed]?.y + q.alto } : {});
    npc.camino = pasos.map((q, i) => ({ ...M.aMundo(q.x, q.z), sinChoque: !!q.sinChoque, cerca: i === pasos.length - 1 ? 0.12 : q.precisa ? 0.12 : 0.6, ...yEsc(q) }));
    npc.espera = 0;
    npc.miraFinal = d.mira;
    // caminando se lo ve como a todos; adentro, sólo de cerca (se pone al llegar)
    npc.soloCerca = 0;
    npc.pose = null;   // 3.6 (vida): caminando, sin pose
  }

  // ---------------------------------------------------------------- 3.6 (vida): el tiempo libre
  // Lo que eligió cada uno (`st.act`: { e, hasta } en horas absolutas) dura lo suyo: se vuelve a
  // elegir cuando se cumple o cuando el horario lo vuelve a ocupar. Menos de media hora libre no
  // alcanza para empezar nada (se queda con lo del horario).
  const citas = new Map();   // clave → { edificio, punto } (la mesa de la casa de té a la que lo invitaste)
  const MINIMO_LIBRE = 0.5;
  // 3.6.2: para salir con tiempo: hasta cuántas horas antes se mira lo que viene, y de a cuánto (ver conTiempo)
  const LEJOS_TIEMPO = 1.5, PASO_ANTES = 0.125;
  function climaVecindad() {
    const c = ctx.climaVecindad?.();
    if (c) return c;
    return ctx.ambiente?.()?.clima || 'nublado';
  }
  function elegirLibres(lista) {
    const p = progreso(), h = horas(), d = dia(), ds = diaSemanaDe(d), abs = d * 24 + h;
    const elegidas = new Map();
    let clima = null, palabra = null;
    const elClima = () => { if (clima === null) { clima = climaVecindad(); palabra = climaDe(clima); } return palabra; };
    // 3.6.1: las mesas de la casa de té de una invitación quedan para el invitado y para vos
    const reservadas = new Set([...citas.values()].flatMap((c) => (c.edificio === 'casa-te' ? ['mesa-1', 'mesa-2'] : [c.punto])));
    lista.forEach((k, i) => {
      const st = personas.get(k);
      if (!st) return;
      const cita = citas.get(k);
      if (cita) { elegidas.set(k, { lugar: 'casa-te', edificio: cita.edificio, punto: cita.punto, actividad: 'te' }); st.act = null; return; }
      if (p.aldea?.llegando?.clave === k) { st.act = null; return; }
      if (!estaLibre(k, h, ds, p)) {
        st.act = null;
        // 3.6.1: lo que el horario manda en la plaza (la leyenda de la abuela) no se hace bajo la lluvia
        // ni de noche: a cubierto
        const r = aCubierto(k, h, ds, elClima());
        if (r) elegidas.set(k, r);
        return;
      }
      // 3.6.1: sale con tiempo para llegar a lo que le toca (la escuela, el local): a paso de pueblo, a
      // la otra punta de la aldea hay más de media hora del juego, y llegaba tarde o no llegaba
      const va = conTiempo(k, st, h, ds, p, abs, elClima);
      if (va) { elegidas.set(k, va); st.act = null; return; }
      // 3.6.1: con lo de afuera elegido, si se larga a llover (o a nevar), se vuelve a elegir
      const cambioElTiempo = st.act?.e && ACTIVIDADES[st.act.e.actividad]?.afuera && st.act.clima !== elClima();
      if (!st.act || abs >= st.act.hasta || abs < st.act.desde || cambioElTiempo) {
        elClima();
        let e = elegirActividad(k, h, ds, clima, p, d * 7 + i);
        // 3.6.1: si eligió la mesa de la casa de té de una invitación, otra mesa (o lo que sigue)
        if (e.edificio === 'casa-te' && reservadas.has(e.punto)) e = { ...e, punto: ['mesa-3', 'mesa-4'][i % 2] };
        st.act = e.libre && e.edificio && e.duracion >= MINIMO_LIBRE ? { e, desde: abs, hasta: abs + e.duracion, clima: palabra } : { e: null, desde: abs, hasta: abs + 0.25, clima: palabra };
        if (st.act.e) cumplirActividad(p, k, e);
      }
      const e = st.act.e;
      if (e) elegidas.set(k, { lugar: e.lugar, edificio: e.edificio, punto: e.punto, actividad: e.actividad, con: e.con || null });
      else { const r = aCubierto(k, h, ds, elClima()); if (r) elegidas.set(k, r); }
    });
    return elegidas;
  }
  // 3.6.1: donde vive cada uno (su cama está ahí: la casa, el cuarto de atrás del local o la estación)
  const viviendaDe = (k, ds) => rutinaAldea(k, 3, ds, aldea()).edificio || (k === 'astronoma' ? 'observatorio' : null);
  // Si el horario lo deja en un banco de la plaza con lluvia, nieve o de noche, a su casa (o null).
  function aCubierto(k, h, ds, palabra) {
    const r = rutinaAldea(k, h, ds, aldea(), dia());
    // 3.7.0: la fiesta de cumpleaños en la plaza, con lluvia o nieve, sigue bajo techo (cada uno en su casa)
    if (r.lugar === 'fiesta' && r.edificio === 'plaza') {
      if (palabra !== 'lluvia' && palabra !== 'nieve') return null;
      const casa = viviendaDe(k, ds);
      return casa ? { lugar: 'casa', edificio: casa, punto: 'adentro', actividad: 'descansar' } : null;
    }
    if (r.edificio !== 'plaza' || !/^estar-/.test(r.punto || '')) return null;
    const t = h - desfaseDe(k);
    if (palabra !== 'lluvia' && palabra !== 'nieve' && t < NOCHE_AFUERA && t >= 7) return null;
    const casa = viviendaDe(k, ds);
    return casa ? { lugar: 'casa', edificio: casa, punto: 'adentro', actividad: 'descansar' } : null;
  }
  // Lo que le toca dentro de lo que tarda en llegar caminando (o null si le da el tiempo).
  // (una vez que salió, sigue yendo aunque llegue antes: no se va a dar otra vuelta mientras espera)
  function conTiempo(k, st, h, ds, p, abs, palabra) {
    // (3.6.2: salvo que cambie el tiempo: iba a la leyenda de la plaza y se largó a llover)
    if (st.yendo && abs < st.yendo.hasta && abs >= st.yendo.desde && st.yendo.clima === palabra()) return st.yendo.d;
    st.yendo = null;
    const n = st.npc;
    if (!n || n.dormido || n.deVisita) return null;
    const vel = Math.max(0.3, Number(n.velocidad) || 0.85) * (Number(ctx.segundosPorHora?.()) || 75);   // metros por hora del juego
    // 3.6.2: lo primero que le toca en la próxima hora y media (antes se miraba a tres cuartos de hora y a lo
    // que eso tardaba: si lo de tres cuartos de hora después seguía libre, salía tarde)
    let r = null, hf = h, dsf = ds, falta = 0;
    for (let paso = PASO_ANTES; paso <= LEJOS_TIEMPO + 1e-9; paso += PASO_ANTES) {
      hf = h + paso; dsf = hf >= 24 ? (ds + 1) % 7 : ds; hf %= 24;
      if (estaLibre(k, hf, dsf, p)) continue;
      r = rutinaAldea(k, hf, dsf, aldea(), hf < h ? dia() + 1 : dia()); falta = paso;
      break;
    }
    if (!r) return null;   // lo que viene es tiempo libre
    if (r.punto === 'cama' || r.punto === 'cama-chicos') return null;   // a dormir, a su hora
    // 3.6.2: lo que el horario manda en la plaza (la leyenda de la abuela) también se sale a tiempo; con
    // lluvia, nieve o de noche, a cubierto (como cuando ya le toca: ver aCubierto)
    if (r.edificio === 'plaza' && /^estar-/.test(r.punto || '')) r = aCubierto(k, hf, dsf, palabra()) || r;
    const q = r.edificio && (puntosFijosDe(r.edificio)[r.punto] || puntosFijosDe(r.edificio).adentro);
    if (!q) return null;
    const w = M.aMundo(q.x, q.z), l0 = M.aLocal(n.pos.x, n.pos.z);
    const d = { lugar: r.lugar, edificio: r.edificio, punto: r.punto, actividad: null };
    // si ya está ahí y falta poco, ahí espera (no se va a hacer otra cosa para volver caminando enseguida)
    if (Math.hypot(w.x - n.pos.x, w.z - n.pos.z) < 1.5) return falta <= 0.5 ? d : null;
    // 3.6.2: lo que tarda de verdad, por las puertas y las calles (antes, la línea recta por 1,35: de la casa de
    // Ercilia al almacén hay 6 m en línea recta y 47 por la calle, y llegaban tarde igual), con un poco de margen
    const adelanto = largoRecorrido({ x: l0.lx, z: l0.lz }, q) / vel + 0.15;
    if (adelanto < falta) return null;   // todavía tiene tiempo
    st.yendo = { d, desde: abs, hasta: abs + adelanto + 0.05, clima: palabra() };
    return d;
  }
  // La casa de té (o null para soltarlo): mientras dure la invitación, va ahí.
  function citar(k, destino) {
    if (destino && destino.edificio && destino.punto) citas.set(k, { edificio: destino.edificio, punto: destino.punto });
    else citas.delete(k);
    acum = Math.max(acum, 0.5);   // que se note en el próximo cuadro
    return true;
  }
  // La figura de alguien de la aldea aunque estés lejos (para que te visite en el refugio): la
  // arma si todavía no estaba.
  function figura(k) {
    if (!presentes().includes(k)) return null;
    if (!personas.has(k)) personas.set(k, { npc: null, destino: null, clave: '', trabado: { d: Infinity, t: 0 } });
    const st = personas.get(k);
    if (st.npc) return st.npc;
    const d = destinosAldea(aldea(), horas(), dia(), [k], M).get(k);
    if (!d) return null;
    st.destino = d;
    st.npc = crearFigura(k, d);
    if (!st.npc) return null;
    st.clave = d.clave;
    ubicar(st.npc, d);
    if (usaRutaPropia(k, st, d)) aRutaPropia(st.npc, st, true);
    st.npc.dormido = lejos > RADIO_ALDEA;
    if (d.lejano) { st.npc.enLejano = true; st.npc.dormido = !cercaDe(st.npc); }   // 3.7.0
    return st.npc;
  }
  // 3.7.0: ¿estás cerca de esta figura? (para lo que está lejos de la aldea: Martina en el muelle)
  const cercaDe = (n) => { const js = ctx.jugador?.()?.estado; return !!js && Math.hypot(js.pos.x - n.pos.x, js.pos.z - n.pos.z) < RADIO_ALDEA; };
  // El andén, por donde se sale de la aldea hacia el muelle (y por donde se vuelve)
  function destinoAnden() {
    const q = puntosFijosDe('estacion-aldea').anden, w = M.aMundo(q.x, q.z);
    return { lugar: 'estacion', edificio: 'estacion-aldea', punto: 'anden', clave: 'estacion-aldea|anden-muelle', lx: q.x, lz: q.z, x: w.x, z: w.z, rot: q.rot, mira: M.rotMundo(q.rot), adentro: false, sentado: false, lejano: false };
  }
  // 3.7.0: Martina va al muelle del lago (a medio kilómetro): desde la aldea camina hasta el andén y ahí sigue
  // sin que la veas; allá se la ve si estás cerca de ella. Al volver, aparece en el andén y sube caminando.
  // Devuelve true si ya se ocupó de ella este cuadro.
  function moverLejano(st, n, d, despierta) {
    if (d.lejano) {
      if (n.enLejano || !despierta) {
        if (!n.enLejano || st.clave !== d.clave) { n.enLejano = true; st.clave = d.clave; ubicar(n, d); }
        n.dormido = !cercaDe(n);
        return true;
      }
      n.dormido = false;
      const a = destinoAnden();
      if (st.clave !== a.clave) { st.clave = a.clave; encaminar(n, a); return true; }
      if (!n.camino?.length) { n.enLejano = true; st.clave = d.clave; ubicar(n, d); n.dormido = !cercaDe(n); }
      return true;
    }
    if (n.enLejano) {
      n.enLejano = false;
      const a = destinoAnden();
      ubicar(n, a); st.clave = a.clave;
    }
    return false;
  }

  // ---------------------------------------------------------------- la llegada
  function trenEnLaAldea() {
    const e = ctx.tren?.()?.est;
    if (!e) return false;
    const aca = (p) => !!p && p.indice === PARADA_ALDEA.indice;
    // 3.6.1: y el tren está ahí: al bajarte de la cabina entre dos paradas, el tren espera parado
    // donde quedó con la próxima ya puesta (trochita.js), y si la próxima era la aldea, bajaba
    // alguien «en el andén» con el tren lejos
    const ahi = !Number.isFinite(e.s) || !Number.isFinite(e.proxima?.s) || Math.abs(e.s - e.proxima.s) < 2;
    return (e.parado > 0 && aca(e.proxima) && ahi) || (e.conduce && aca(e.paradaCabina));
  }
  function revisarLlegada(forzar = false) {
    const a = aldea();
    if (a.llegando || !(forzar || trenEnLaAldea())) return null;
    const r = puedeLlegar(progreso());
    if (!r.ok) return null;
    if (!empezarLlegada(a, r.quien, dia())) return null;
    const def = POBLADORES_ALDEA[r.quien];
    // 3.7.0: las nuevas bajan con su objeto (la escena de la llegada)
    ctx.nota(`Bajó alguien del tren en la ${NOMBRE_ALDEA}`, `${def.nombre}, ${def.oficio}, espera en el andén con ${def.objeto || 'una valija'}`, true);
    ctx.sonido?.anotar?.();
    ctx.guardar();
    ctx.redibujar?.();
    return r.quien;
  }
  function aceptarAlQueLlego(npc) {
    const a = aldea();
    const r = aceptar(a, dia());
    if (!r) return null;
    const def = POBLADORES_ALDEA[r.clave];
    if (npc) { npc.llegando = false; npc.saludo = def.saludo; npc.despedida = def.despedida; }
    const et = etapaDe(a, r.lote);
    ctx.nota(`${def.nombre} se queda en la ${NOMBRE_ALDEA}`, et.hechas
      ? `${mayus(nombreLocal(r.lote))} ya está a medio hacer: llevá material a la obra y los vecinos ponen la mano`
      : `Se marcó el lote de ${nombreLocal(r.lote)}: llevá material a la obra y los vecinos ponen la mano`, true);
    ctx.sonido?.anotar?.();
    ctx.guardar();
    ctx.redibujar?.();
    return r;
  }

  // ---------------------------------------------------------------- las obras
  function revisarObras() {
    const a = aldea();
    const eventos = avanzarObras(a, dia(), horas());
    for (const ev of eventos) {
      const def = POBLADORES_ALDEA[ev.clave];
      if (ev.tipo === 'abierto') {
        ctx.nota(`Abrió ${nombreLocal(ev.lote)} de ${def?.nombre || 'la aldea'}`, def?.resumen || NOMBRE_ALDEA, true);
        ctx.sonido?.anotar?.();
      } else {
        const hecha = ETAPAS_OBRA[ev.etapa - 1], sigue = ETAPAS_OBRA[ev.etapa];
        ctx.nota(`Avanzó la obra de ${nombreLocal(ev.lote)}`, `Quedó hecha: ${minus(hecha.nombre)}${sigue ? `. Ahora: ${minus(sigue.nombre)}` : ''}`);
      }
    }
    if (eventos.length) { ctx.guardar(); ctx.redibujar?.(); }
    return eventos;
  }
  // La obra en curso si estás parado en su lote (o al lado, donde trabajan los vecinos).
  function obraCerca(pos) {
    if (!pos) return null;
    const lote = obraEnCurso(aldea());
    if (!lote) return null;
    const l = M.aLocal(pos.x, pos.z);
    return dentroDePlanta(lote, l.lx, l.lz, -2.5) ? lote : null;
  }
  function avisoObra(lote) {
    const et = etapaDe(aldea(), lote);
    if (!et || et.estado !== 'obra') return null;
    if (et.lista) return `La obra de ${nombreLocal(lote)}: los vecinos están trabajando`;
    return `Aportar a la obra de ${nombreLocal(lote)} (${verboFalta(et.faltan)} ${listaMateriales(et.faltan)})`;
  }
  function aportarObra(lote) {
    const a = aldea();
    const et = etapaDe(a, lote);
    if (!et || et.estado !== 'obra') return null;
    if (et.lista) {
      ctx.nota(`Los vecinos trabajan en ${nombreLocal(lote)}`, `${et.etapa.nombre}: mañana a la mañana está lista la etapa`);
      return { usados: {}, faltan: {}, completa: true };
    }
    let r = null;
    // 3.6.1: lo que ya estaba aportado a la etapa (la experiencia se cuenta sobre lo acumulado)
    const antes = Object.values(et.aportado || {}).reduce((s, n) => s + (Number(n) || 0), 0);
    const hacer = (m) => {
      r = aportar(a, lote, m, dia(), horas());   // 3.6.1: con la hora (de madrugada, lista esa mañana)
      for (const [k, n] of Object.entries(r.usados)) m[k] = Math.max(0, (m[k] || 0) - n);
    };
    if (ctx.conMateriales) ctx.conMateriales(hacer);
    else { const p = progreso(); p.materiales = p.materiales || {}; hacer(p.materiales); }
    if (!Object.keys(r.usados).length) {
      ctx.nota('No tenés nada de lo que falta', `La obra de ${nombreLocal(lote)} pide ${listaMateriales(r.faltan)}`);
      return r;
    }
    ctx.sonido?.juntar?.();
    ctx.refrescarBarra?.();
    ctx.alAportar?.(r.usados, r.completa, antes);   // 3.6: lo que pusiste en la obra del pueblo cuenta para el oficio de constructor
    ctx.alAporteObra?.(lote, r.usados);   // 3.6 (vida): y los vecinos se acuerdan
    if (r.completa) ctx.nota(`Aportaste ${listaMateriales(r.usados)}`, 'Los vecinos van a trabajar en la obra: mañana a la mañana está lista la etapa', true);
    else ctx.nota(`Aportaste ${listaMateriales(r.usados)} a la obra de ${nombreLocal(lote)}`, `${mayus(verboFalta(r.faltan))} ${listaMateriales(r.faltan)}`);
    ctx.guardar();
    ctx.redibujar?.();
    return r;
  }

  // ---------------------------------------------------------------- hablar con E
  const charlasDichas = new Map();   // vecino → cuántas veces le hablaste (para no repetir)
  function charla(npc) {
    const k = npc?.claveAldea;
    if (!k) return null;
    const a = aldea();
    if (k === 'visitante') return charlaVisitante(npc);   // 3.7.0
    if (k === 'familia') return charlaFamilia(npc);         // 3.7.0
    if (esVecinoAldea(k)) {
      // 3.7.0: Ernesto te ofrece el cachorro de la Chola (una vez por día, hasta que digas que sí)
      if (k === 'jefe') {
        const of = ofertaCachorro(vida(), dia());
        if (of) {
          ofrecido(vida(), dia());
          return { id: 'aldea-cachorro', partes: of.partes, seguir: of.seguir, alTerminar: () => adoptarCachorro(), tipo: 'llegada' };
        }
      }
      const lineas = dichosDe(k, a)?.charla || VECINOS_ALDEA[k].charla;   // 3.7.0: según la etapa (los chicos)
      const n = charlasDichas.get(k) || 0;
      charlasDichas.set(k, n + 1);
      return { id: `aldea-${k}`, partes: [lineas[(dia() + n) % lineas.length]], tipo: 'vecino' };
    }
    if (!esPobladorAldea(k)) return null;
    const def = POBLADORES_ALDEA[k];
    if (a.llegando?.clave === k) {
      const lote = LOTE_DE[k], e = EDIFICIOS_ALDEA[lote];
      const calle = CALLES_ALDEA.find((c) => c.id === e.calle);
      const donde = estadoEdificio(a, lote) === 'a-medio'
        ? `${mayus(nombreLocal(lote))} ya está a medio hacer: con un poco de material la terminamos.`
        : `${mayus(nombreLocal(lote))} iría ${calle ? `sobre la ${minus(calle.nombre)}` : 'en la aldea'}.`;
      return {
        id: `aldea-${k}`,
        // (3.7.0: las nuevas, con su objeto al lado)
        partes: [...(def.objeto ? [`(Al lado, en el andén: ${def.objeto}.)`] : []), ...def.llegada, `Me dijeron que acá, al que llega, entre todos le levantan el local. ${donde} ¿Me puedo quedar?`],
        seguir: 'E: que se quede · Escape: todavía no',
        alTerminar: () => aceptarAlQueLlego(npc),
        tipo: 'llegada',
      };
    }
    const s = servicioDe(k, progreso(), dia(), extraServicio());
    return {
      id: `aldea-${k}`,
      partes: s.partes.length ? s.partes : [def.resumen],
      seguir: s.seguir,
      alTerminar: s.efectos ? () => usarServicio(k, s) : null,
      tipo: 'servicio', ofrece: !!s.efectos,
    };
  }
  // 3.7.0: lo que necesitan saber las nuevas (la hora, los lugares con dónde en el mapa, la foto que falta y
  // lo que Pocha sabe de algún vecino)
  function extraServicio() {
    return { pronostico: ctx.pronostico?.() || '', hora: horas(), lugares: ctx.lugaresConMapa?.() || null, fotoPendiente: ctx.fotoPendiente?.() || null, chisme: proximoChisme(progreso(), dia()) };
  }
  function usarServicio(k, s) {
    const p = progreso();
    const def = POBLADORES_ALDEA[k];
    // lo ofrecido se vuelve a mirar al aceptar: en el medio pudiste gastar lo que ibas a dar
    const ahora = servicioDe(k, p, dia(), extraServicio());
    if (!ahora.efectos || JSON.stringify(ahora.efectos) !== JSON.stringify(s.efectos)) {
      ctx.nota('Ya no alcanza', `${def.nombre}: «Mirá bien lo que traés y volvé»`);
      return false;
    }
    for (const f of s.efectos) {
      if (f.tipo === 'material') ctx.sumarMaterial(f.k, f.n);
      else if (f.tipo === 'cosa') { p.cosas = p.cosas || {}; p.cosas[f.k] = f.fijar !== undefined ? f.fijar : Math.max(0, (Number(p.cosas[f.k]) || 0) + f.n); }
      else if (f.tipo === 'entrada') ctx.sumarEntrada(f.k, f.n);
      else if (f.tipo === 'jugador') ctx.alJugador?.(f.campo, f.valor);
      else if (f.tipo === 'carta') ctx.leerCarta?.(f.k);
      else if (f.tipo === 'foto') ctx.mandarFoto?.(f.k);
      else if (f.tipo === 'partitura') ctx.partitura?.(f.k);
      // 3.7.0: lo de las nuevas
      else if (f.tipo === 'registrar') ctx.registrar?.(f.k);
      else if (f.tipo === 'chinche') ctx.chinche?.(f.k, f.nombre);
      else if (f.tipo === 'amistad') { const r = sumarAmistadDe(p, f.k, f.n, dia()); if (r?.subio) ctx.nota(`${nombreCortoDe(f.k)} te tiene confianza`, r.nivel === 'compadre' ? 'Ya son compadres' : 'Ya son amigos', true); }
      else if (f.tipo === 'gusto') revelarGusto(p, f.k, f.cosa);
    }
    aplicarAlAldea(aldea(), s.efectos, dia());
    ctx.alServicio?.(k, s.efectos);   // 3.6 (vida): los vecinos se acuerdan (el poncho de la tejedora)
    ctx.refrescarBarra?.();
    ctx.nota(s.titulo || def.nombre, def.nombre, true);
    ctx.guardar();
    return true;
  }

  // ---------------------------------------------------------------- las charlas entre vecinos
  const oida = { activa: null, vistas: new Set(), espera: 0 };
  // 3.7.0: el que habla por la radio de la seccional (Josefina)
  const radioDe = (c) => new Set(c?.radio || []);
  function dondeEs(c) {
    let x = 0, z = 0;
    for (const k of c.personas) { const n = personas.get(k).npc; x += n.pos.x; z += n.pos.z; }
    return { x: x / c.personas.length, z: z / c.personas.length };
  }
  // (3.6.2: `cuento`: los cuentos de la abuela del domingo; ésos sí frenan el reloj de estar sentado)
  function empezarCharla(c, personasCharla, monologo = null, cuento = false) {
    const lineas = monologo || c.lineas;
    oida.activa = { id: c?.id || 'cuentos', lineas, personas: personasCharla, linea: -1, t: 0.4, cuento, radio: radioDe(c) };
    const centro = dondeEs(oida.activa);
    oida.activa.centro = centro;
    for (const k of personasCharla) {
      const n = personas.get(k).npc;
      n.charlaVecinos = true;
      if (personasCharla.length > 1) n.miraFinal = Math.atan2(centro.x - n.pos.x, centro.z - n.pos.z);
    }
  }
  function terminarCharla() {
    const c = oida.activa;
    if (!c) return;
    for (const k of c.personas) {
      const st = personas.get(k);
      if (!st?.npc) continue;
      st.npc.charlaVecinos = false;
      if (st.destino) st.npc.miraFinal = st.destino.mira;
    }
    oida.vistas.add(c.id);
    // 3.6 (mecánicas): quién la escuchó entera (los cuentos del domingo dejan un recuerdo)
    ctx.alTerminarCharla?.({ id: c.id, completa: c.linea >= c.lineas.length, personas: [...c.personas], centro: c.centro });
    oida.activa = null;
    oida.espera = ritmoDe(ctx.ritmo?.()).esperaCharla;   // 3.7.0: según el ritmo de la aldea (antes, 12 s)
    ctx.decir?.(null);
  }
  function avanzarCharla(dt) {
    const c = oida.activa;
    if (!c) { oida.espera = Math.max(0, oida.espera - dt); return; }
    const js = ctx.jugador?.()?.estado;
    const hablando = ctx.hablandoCon?.();
    if (!js || hablando || Math.hypot(js.pos.x - c.centro.x, js.pos.z - c.centro.z) > OIR_CHARLA + 3) { terminarCharla(); return; }
    c.t -= dt;
    if (c.t > 0) return;
    c.linea++;
    if (c.linea >= c.lineas.length) { terminarCharla(); return; }
    const [quien, texto] = c.lineas[c.linea];
    // (3.7.0: por la radio: «Josefina, por la radio: …»)
    ctx.decir?.(c.radio?.has(quien) ? `${NOMBRES_RADIO[quien] || mayus(quien)}, por la radio: ${texto}` : `${pila(nombreDe(quien))}: ${texto}`);
    c.t = 2.4 + texto.length * 0.05;
  }
  // Busca dos o tres vecinos quietos y juntos cerca tuyo, y una charla de lo que corresponde.
  function buscarCharla(js) {
    if (oida.activa || oida.espera > 0 || ctx.hablandoCon?.()) return;
    if (charlaHoy !== dia()) { charlaHoy = dia(); oida.vistas.clear(); }
    const quietos = [];
    for (const [k, st] of personas) {
      const n = st.npc;
      if (!n || n.dormido || (n.camino && n.camino.length) || n.llegando) continue;
      quietos.push(k);
    }
    const a = aldea();
    const amb = ctx.ambiente?.() || {};
    // el domingo a la mañana, los cuentos de la abuela: si entrás a escucharla
    const abuela = personas.get('abuela');
    if (abuela?.npc && abuela.destino?.punto === 'cuentos' && quietos.includes('abuela')) {
      const n = abuela.npc;
      if (Math.hypot(js.pos.x - n.pos.x, js.pos.z - n.pos.z) < OIR_CHARLA) {
        const oyentes = quietos.filter((k) => { const q = personas.get(k).npc; return Math.hypot(q.pos.x - n.pos.x, q.pos.z - n.pos.z) < OIR_CHARLA; });
        const cuentos = charlasPosibles({ aldea: a, hora: horas(), estacion: amb.estacion, clima: amb.clima, presentes: oyentes })
          .filter((c) => ['biblioteca', 'leyenda'].includes(c.tema) && c.lineas.some(([q]) => q === 'abuela') && !oida.vistas.has(c.id));
        const c = cuentos[(dia() + oida.vistas.size) % (cuentos.length || 1)];
        if (c) { empezarCharla(c, [...new Set(c.lineas.map(([q]) => q))], null, true); return; }
        if (!oida.vistas.has('cuentos')) { empezarCharla(null, ['abuela'], VECINOS_ALDEA.abuela.charla.map((t) => ['abuela', t]), true); return; }
      }
    }
    for (const k of quietos) {
      const n = personas.get(k).npc;
      if (Math.hypot(js.pos.x - n.pos.x, js.pos.z - n.pos.z) > OIR_CHARLA + 2) continue;
      const grupo = [k, ...quietos.filter((q) => q !== k && Math.hypot(personas.get(q).npc.pos.x - n.pos.x, personas.get(q).npc.pos.z - n.pos.z) < 3.5)].slice(0, 3);
      if (grupo.length < 2) continue;
      const centro = dondeEs({ personas: grupo });
      if (Math.hypot(js.pos.x - centro.x, js.pos.z - centro.z) > OIR_CHARLA) continue;
      for (let s = 0; s < 6; s++) {
        const c = elegirCharla({ aldea: a, hora: horas(), estacion: amb.estacion, clima: amb.clima, presentes: grupo, semilla: dia() * 131 + Math.floor(horas()) * 7 + s });
        if (c && !oida.vistas.has(c.id)) { empezarCharla(c, quienesCharlan(c)); return; }
      }
    }
    // 3.7.0: Julia sola en la seccional, con la radio: charla con Josefina, que recorre el valle
    const julia = personas.get('guardaparque');
    if (julia?.npc && quietos.includes('guardaparque') && julia.destino?.edificio === 'seccional' && Math.hypot(js.pos.x - julia.npc.pos.x, js.pos.z - julia.npc.pos.z) < OIR_CHARLA) {
      const radio = charlasPosibles({ aldea: a, hora: horas(), estacion: amb.estacion, clima: amb.clima, presentes: ['guardaparque'] }).filter((c) => c.radio?.length && !oida.vistas.has(c.id));
      const c = radio[(dia() + oida.vistas.size) % (radio.length || 1)];
      if (c) empezarCharla(c, ['guardaparque']);
    }
  }

  // ---------------------------------------------------------------- cada cuadro
  function actualizar(dt) {
    acum += dt;
    avanzarCharla(dt);
    const js = ctx.jugador?.()?.estado;
    // las figuras se arman de a una, cuando te acercás (o si no hay ninguna lejos); 3.7.0 (integración): y de a
    // poco, unos ms por cuadro (ver avanzarArmado)
    if (js && lejos < RADIO_FIGURAS) avanzarArmado(ctx.msFigura?.() ?? MS_FIGURA, dt);
    if (acum < 0.5) return;
    const paso = acum;
    acum = 0;
    const a = aldea();
    revisarDia();   // 3.7.0: los chicos, los cumpleaños, los cachorros, las cartas, el apodo (antes que las obras: el aviso de la obra queda último)
    revisarObras();
    revisarLlegada();
    if (!js) return;
    lejos = distanciaAldea(js.pos.x, js.pos.z, M);
    const despierta = lejos < RADIO_ALDEA;
    if (lejos < 30) fuisteALaAldea(vida(), dia());   // 3.7.0: para las cartas de la aldea
    revisarVisitante(js);   // 3.7.0
    revisarFamilia(js);     // 3.7.0
    // la primera vez que llegás, al cuaderno
    if (!a.descubierta && lejos < 1) {
      a.descubierta = dia();
      ctx.registrar?.('aldea');
      ctx.guardar();
    }
    const lista = presentes();
    for (const k of lista) if (!personas.has(k)) personas.set(k, { npc: null, destino: null, clave: '', trabado: { d: Infinity, t: 0 } });
    const destinos = destinosAldea(a, horas(), dia(), lista, M, elegirLibres(lista));   // 3.6 (vida): con su tiempo libre
    // 3.6.1: en la silla donde estás sentado vos no se sienta nadie: se queda parado al lado
    if (js.sentado) for (const d of destinos.values()) {
      if (!d.sentado || Math.hypot(d.x - js.pos.x, d.z - js.pos.z) > 0.45) continue;
      d.sentado = false; d.x += Math.cos(d.mira) * 0.6; d.z -= Math.sin(d.mira) * 0.6; d.clave += '|al-lado';
      const l = M.aLocal(d.x, d.z); d.lx = l.lx; d.lz = l.lz;
    }
    const hablando = ctx.hablandoCon?.();
    for (const [k, st] of personas) {
      const d = destinos.get(k);
      st.destino = d || null;
      const n = st.npc;
      // (alguien que ya no está en esta partida, si la partida cambió sin recargar: no se ve)
      if (n && !d && !n.deVisita) { n.dormido = true; continue; }
      if (!n || !d) continue;
      // el que llegó y aceptaste ya no saluda como recién bajado
      if (n.llegando && a.llegando?.clave !== k) { const def = defDe(k); n.llegando = false; n.saludo = def.saludo; n.despedida = def.despedida; }
      // 3.6: de visita en tu mesa (visitas.js la trae y la devuelve), no se la toca; al volver,
      // sigue con su horario
      if (n.deVisita) { n.camino = null; n.dormido = false; st.clave = ''; continue; }
      if ((d.lejano || n.enLejano) && moverLejano(st, n, d, despierta)) continue;   // 3.7.0: Martina y el muelle
      n.dormido = !despierta;
      if (!despierta) {
        // lejos: nadie lo ve caminar, se lo deja en su lugar
        // (3.6.2: también al que quedó a mitad de camino: si al irte iba ya para donde le toca ahora, se quedaba
        // congelado en la calle hasta que volvías, horas después. Pasaba con el que sale con tiempo: el carpintero,
        // recién abierta su carpintería, seguía en el andén a las 10 y la E le hablaba a la que bajaba del tren)
        if (st.clave !== d.clave || n.camino?.length) {
          st.clave = d.clave;
          ubicar(n, d);
          if (usaRutaPropia(k, st, d)) aRutaPropia(n, st, true);
        }
        continue;
      }
      if (n === hablando || n.charlaVecinos) continue;
      // Ercilia atendiendo: su ruta de siempre detrás del mostrador
      if (!n.camino && st.clave === d.clave) continue;
      if (st.clave !== d.clave) {
        st.clave = d.clave;
        encaminar(n, d);
        st.trabado = { d: Infinity, t: 0 };
        continue;
      }
      if (n.camino?.length) {
        // trabado contra algo (y no porque esté charlando con vos al lado): llega de una. Lo que
        // falta se mide por el camino (por las calles a veces hay que alejarse para llegar)
        let falta = Math.hypot(n.pos.x - n.camino[0].x, n.pos.z - n.camino[0].z);
        for (let i = 1; i < n.camino.length; i++) falta += Math.hypot(n.camino[i].x - n.camino[i - 1].x, n.camino[i].z - n.camino[i - 1].z);
        // (3.6.1: el invitado que va con vos, aunque estés al lado: si se traba, llega igual)
        const alLado = !n.enCita && Math.hypot(n.pos.x - js.pos.x, n.pos.z - js.pos.z) < 7.5;
        const tr = st.trabado;
        if (!alLado && falta > tr.d - 0.2) tr.t += paso; else tr.t = 0;
        tr.d = Math.min(tr.d, falta);
        if (tr.t > 12) { ubicar(n, d); tr.t = 0; saltos++; st.saltos = (st.saltos || 0) + 1; }
      } else if (usaRutaPropia(k, st, d)) aRutaPropia(n, st);
      else { n.soloCerca = d.adentro ? VER_ADENTRO : 0; n.pose = poseDe(d); n.asiento = alturaAsiento(d, n); }   // 3.6 (vida): ya llegó: su pose (3.6.1: y su asiento)
    }
    if (despierta && js) buscarCharla(js);
    // 3.7.0: la figura de Martina en el muelle, aunque no hayas pasado por la aldea
    if (lejos >= RADIO_FIGURAS) for (const [k, st] of personas) if (!st.npc && st.destino?.lejano && Math.hypot(js.pos.x - st.destino.x, js.pos.z - st.destino.z) < RADIO_FIGURAS) figura(k);
  }

  // ---------------------------------------------------------------- 3.7.0: lo de cada día
  // 3.7.0 (integración): los de la aldea que son tus amigos o tus compadres (la vecindad); en la 3.7.1 se suman tu
  // pareja y tus hijos
  const cercanosDe = (p) => Object.entries(amistades(p) || {}).filter(([, n]) => n === 'amigo' || n === 'compadre').map(([k]) => k).filter((k) => esVecinoAldea(k) || esPobladorAldea(k) || k === 'ercilia');
  let diaRevisado = 0;
  const NOMBRE_ETAPA = { adolescente: 'ya es adolescente', joven: 'ya es grande' };
  function revisarDia() {
    const d = dia();
    if (diaRevisado === d) return;
    diaRevisado = d;
    const a = aldea(), v = vida(), p = progreso();
    // los chicos crecen el día de su cumpleaños
    for (const ev of pasarDiaChicos(a, d)) {
      const nombre = VECINOS_ALDEA[ev.clave]?.nombre || ev.clave;
      if (ev.tipo === 'crecio') ctx.nota(`${nombre} ${NOMBRE_ETAPA[ev.etapa] || 'creció'}`, 'Los chicos de la aldea crecen una etapa por año', true);
      else if (ev.tipo === 'aprendiz') ctx.nota(`${nombre} aprende el oficio`, `Con ${POBLADORES_ALDEA[ev.con]?.nombre || ev.con}, con quien más tiempo pasó`, true);
      else if (ev.tipo === 'estudiar') ctx.nota(`${nombre} se fue a estudiar`, `A la ciudad, unos días: quiere ser ${CARRERAS[ev.clave]?.oficio || 'algo nuevo'}`, true);
      else if (ev.tipo === 'volvio') ctx.nota(`${nombre} volvió a la aldea`, `Recibido de ${CARRERAS[ev.clave]?.oficio || 'algo nuevo'}`, true);
    }
    actualizarChicos();
    // la Chola tiene cachorros
    if (cachorrosNacen(v, a, d) && nacenCachorros(v, d)) ctx.nota('La Chola tuvo cachorros', 'Ernesto, el jefe de estación, les anda buscando casa', true);
    // 3.7.0 (integración): los más cercanos (tus amigos y compadres de la aldea): sólo sus cumpleaños se festejan
    a.cercanos = cercanosDe(p);
    // mañana: cumpleaños (y las fiestas, cuando las haya) y tu familia; (3.7.0 (integración): y hoy, los que cumplen
    // sin fiesta)
    if (v.avisado < d && a.descubierta) {
      v.avisado = d;
      const hoy = avisoDelDia(d, { aldea: a, fiestas: FIESTAS_ALDEA });
      if (hoy) ctx.nota(hoy.titulo, hoy.texto, true);
      const av = avisoDiaAntes(d, { aldea: a, fiestas: FIESTAS_ALDEA });
      if (av) ctx.nota(av.titulo, av.texto, true);
    }
    const fam = avisoFamilia(v, d);
    if (fam) ctx.nota(fam.titulo, fam.texto, true);
    // una carta, si hace días que no vas
    const carta = cartaDeLaAldea(v, p, d, ritmo());
    if (carta) ctx.nota('Llegó una carta de la aldea', `De ${nombreCortoDe(carta.de)}: está en el cuaderno, en «Calendario y vida de la aldea»`, true);
    // el apodo
    const ap = apodoDe(p);
    if (ap && ap.id !== v.apodo) { v.apodo = ap.id; ctx.nota(`En la aldea te dicen «${ap.texto}»`, 'Por lo que más hacés en el valle', true); }
    ctx.guardar();
  }
  // Los chicos, como son ahora (la talla, lo que dicen; la ropa nueva, la próxima vez que se arme la figura)
  function actualizarChicos() {
    const a = aldea();
    for (const k of CHICOS_ALDEA) {
      const n = personas.get(k)?.npc;
      if (!n) continue;
      const tall = tallaDe(k, a);
      if (n.g?.scale) n.g.scale.setScalar(Number.isFinite(tall) && tall > 0.3 ? tall : 1);
      const dch = dichosDe(k, a);
      if (dch) { n.oficio = dch.oficio; n.saludo = dch.saludo; n.despedida = dch.despedida; }
    }
  }

  // ---------------------------------------------------------------- 3.7.0: el cachorro de la Chola
  function adoptarCachorro() {
    const m = adoptarMascota(vida(), dia());
    if (!m) return null;
    ctx.nota(`Adoptaste a ${m.nombre}`, 'El cachorro de la Chola vive en tu refugio: va a crecer', true);
    ctx.sonido?.anotar?.();
    ctx.guardar();
    ctx.redibujar?.();
    return m;
  }

  // ---------------------------------------------------------------- 3.7.0: los visitantes del tren
  const visitantes = new Map();   // id → figura (una por visitante: se vuelven a usar)
  let decirHasta = 0;
  function figuraVisitante(vis, js) {
    let n = visitantes.get(vis.id);
    const def = visitanteDef(vis.id);
    const anden = puntosFijosDe('estacion-aldea').espera;
    const w = vis.estado === 'guiando' && js ? { x: js.pos.x - Math.sin(js.yaw || 0) * -3, z: js.pos.z - Math.cos(js.yaw || 0) * -3 } : M.aMundo(anden.x, anden.z);
    if (!n) {
      const g = ctx.gente?.();
      if (!g?.agregarPoblador || !def) return null;
      n = g.agregarPoblador({ clave: `visitante-${vis.id}`, colores: def.colores, pos: w, mira: { x: w.x, z: w.z + 1 }, nombre: def.nombre, oficio: def.de, saludo: def.saludo, despedida: def.despedida, mano: null, velocidad: 0.9, camino: [] });
      if (!n) return null;
      n.claveAldea = 'visitante';
      visitantes.set(vis.id, n);
    } else if (n.dormido || n.visitaDia !== vis.dia) n.pos.set(w.x, ctx.alturaDePie(w.x, w.z, n.pos.y), w.z);
    n.visitaDia = vis.dia;
    return n;
  }
  function ocultarVisitantes(menos = null) { for (const [id, n] of visitantes) if (id !== menos) { n.dormido = true; n.enCita = false; n.camino = []; } }
  function revisarVisitante(js) {
    const v = vida(), d = dia(), h = horas();
    // baja del tren, de día, cuando la trochita para en la aldea (y conocés la aldea)
    if (!v.visitante && aldea().descubierta && h >= 8 && h < 18 && trenEnLaAldea()) {
      const vis = visitanteDelDia(v, d, { ritmo: ritmo(), lugares: ctx.lugaresVisita?.() || [], semilla: aldea().descubierta });
      if (vis) {
        const def = visitanteDef(vis.id);
        ctx.nota(`Bajó un visitante en la ${NOMBRE_ALDEA}`, `${def.nombre}, ${def.de}, pregunta por ${LUGARES_VISITA[vis.lugar].nombre}`, true);
        ctx.guardar();
      }
    }
    const vis = v.visitante;
    if (!vis) { ocultarVisitantes(); return; }
    // el de otro día ya se fue; el que nadie llevó, se vuelve en el último tren
    if (vis.dia !== d || (vis.estado === 'anden' && h >= 20)) { visitanteSeVa(v); ocultarVisitantes(); ctx.guardar(); return; }
    ocultarVisitantes(vis.id);
    const n = figuraVisitante(vis, js);
    if (!n) return;
    const dj = Math.hypot(n.pos.x - js.pos.x, n.pos.z - js.pos.z);
    if (decirHasta && performance.now() > decirHasta) { decirHasta = 0; ctx.decir?.(null); }
    if (vis.estado === 'guiando') {
      n.dormido = false; n.ruta = null; n.enCita = true;
      // te sigue (y si te le adelantaste mucho, te alcanza: «¡Esperame!»)
      const atras = { x: js.pos.x + Math.sin(js.yaw || 0) * 2.6, z: js.pos.z + Math.cos(js.yaw || 0) * 2.6 };
      if (dj > 45) { n.pos.set(atras.x, ctx.alturaDePie(atras.x, atras.z, n.pos.y), atras.z); }
      n.camino = dj > 3 ? [{ x: atras.x, z: atras.z, cerca: 1.4 }] : [];
      n.velocidad = Math.min(4.5, Math.max(1.1, dj * 0.55));
      const l = ctx.lugarPos?.(vis.lugar);
      if (l && Math.hypot(js.pos.x - l.x, js.pos.z - l.z) < RADIO_GUIADO && Math.hypot(n.pos.x - l.x, n.pos.z - l.z) < RADIO_GUIADO + 6) {
        const g = guiado(v, d);
        const tx = textosVisitante(vis);
        if (g && tx) {
          ctx.nota(`Llevaste a ${tx.nombre} hasta ${LUGARES_VISITA[vis.lugar].nombre}`, 'Queda anotado en el cuaderno, en «Visitantes que guiaste»', true);
          ctx.decir?.(`${tx.nombre}: ${tx.gracias[0]}`);
          decirHasta = performance.now() + 6000;
          ctx.sonido?.anotar?.();
          ctx.alGuiar?.(g);
        }
        n.enCita = false; n.camino = []; n.velocidad = 0.9;
        ctx.guardar();
      }
      return;
    }
    n.enCita = false;
    if (vis.estado === 'llego') {
      // se queda mirando el lugar; cuando te alejás, se va (vuelve al tren a su ritmo)
      n.dormido = dj > RADIO_ALDEA;
      if (dj > 70) { visitanteSeVa(v); n.dormido = true; ctx.guardar(); }
      return;
    }
    // en el andén, esperando que alguien le hable
    n.dormido = dj > RADIO_ALDEA;
  }
  function charlaVisitante(npc) {
    const v = vida().visitante;
    const tx = textosVisitante(v);
    if (!tx) return { id: 'visitante', partes: ['Gracias, ya me arreglo solo.'], tipo: 'llegada' };
    if (v.estado === 'anden') {
      return { id: 'visitante', partes: tx.pide, seguir: tx.seguir, tipo: 'llegada',
        alTerminar: () => { if (empezarGuia(vida())) { ctx.nota(`${tx.nombre} te sigue`, `Llevalo hasta ${LUGARES_VISITA[v.lugar].nombre}`, true); npc.enCita = true; ctx.guardar(); } } };
    }
    if (v.estado === 'guiando') return { id: 'visitante', partes: [tx.yendo], tipo: 'llegada' };
    return { id: 'visitante', partes: tx.gracias, tipo: 'llegada' };
  }

  // ---------------------------------------------------------------- 3.7.0: tu familia
  const familia = new Map();   // 'mama' | 'hermano' → figura
  function revisarFamilia(js) {
    const v = vida(), d = dia(), h = horas();
    const quien = ctx.desafio?.() ? null : familiaDeHoy(v, d);
    if (quien && h >= HORAS_FAMILIA[1]) {
      // se volvió en el tren de la tarde (si no la viste, te dejó una nota)
      if (v.familia.charlo < d) ctx.nota(`Vino ${FAMILIA[quien].llamada} y no estabas`, 'Te dejó una nota en la mesa: «Pasé, comé algo, abrigate»', true);
      terminarVisitaFamilia(v, d, ritmo());
      for (const n of familia.values()) n.dormido = true;
      ctx.guardar();
      return;
    }
    if (!quien || h < HORAS_FAMILIA[0]) { for (const n of familia.values()) n.dormido = true; return; }
    let n = familia.get(quien);
    if (!n) {
      const g = ctx.gente?.(), l = ctx.lugarFamilia?.();
      const def = FAMILIA[quien];
      if (!g?.agregarPoblador || !l) return;
      n = g.agregarPoblador({ clave: `familia-${quien}`, colores: def.colores, pos: { x: l.x, z: l.z }, mira: { x: l.x + Math.sin(l.mira || 0), z: l.z + Math.cos(l.mira || 0) }, nombre: def.nombre, oficio: def.oficio, saludo: def.saludo, despedida: def.despedida, mano: def.mano, velocidad: 0.85, camino: [] });
      if (!n) return;
      n.claveAldea = 'familia';
      n.miraFinal = l.mira || 0;
      familia.set(quien, n);
    }
    for (const [q, x] of familia) if (q !== quien) x.dormido = true;
    n.dormido = Math.hypot(n.pos.x - js.pos.x, n.pos.z - js.pos.z) > RADIO_ALDEA;
  }
  function charlaFamilia(npc) {
    const v = vida(), d = dia();
    const quien = familiaDeHoy(v, d) || v.familia.quien;
    if (v.familia.charlo >= d) return { id: 'familia', partes: [quien === 'hermano' ? 'Yo me quedo acá tomando mate. Vos seguí con lo tuyo, que te miro.' : 'Andá, andá, que yo me quedo mirando el lago. Pero volvé a comer.'], tipo: 'llegada' };
    v.familia.charlo = d;
    ctx.guardar();
    const amb = ctx.ambiente?.() || {};
    return { id: 'familia', partes: opinionesFamilia(quien, progreso(), v, { perro: ctx.nombrePerro?.() || '', clima: amb.clima }), tipo: 'llegada' };
  }

  // ---------------------------------------------------------------- 3.7.0: el calendario en el cuaderno
  function dibujarCalendario(ficha, el) {
    const a = aldea(), v = vida(), p = progreso();
    const hoy = fechaDe(dia());
    ficha.appendChild(el('h2', '', 'Calendario y vida de la aldea'));
    ficha.appendChild(el('p', 'anotado', `Hoy: ${hoy.texto}. El año tiene doce días: cuatro de verano, cuatro de otoño y cuatro de invierno.`));
    const cal = calendarioDelAnio(dia(), { aldea: a, fiestas: FIESTAS_ALDEA });
    const ul = el('ul', 'lista');
    for (const fila of cal.filas) {
      const ev = fila.eventos.map((e) => (e.tipo === 'cumple' ? `cumple ${nombreCortoDe(e.clave)}` : e.nombre)).join(', ');
      const li = el('li', fila.hoy ? 'tiene' : '', `${fila.diaDelAnio}. ${fila.nombreEstacion}${fila.hoy ? ' (hoy)' : fila.manana ? ' (mañana)' : ''}: ${ev || '—'}`);
      if (fila.dia < hoy.dia) li.style.opacity = '0.6';
      ul.appendChild(li);
    }
    ficha.appendChild(ul);
    const av = avisoDiaAntes(dia(), { aldea: a, fiestas: FIESTAS_ALDEA });
    if (av) ficha.appendChild(el('p', 'pista', `${av.titulo}. ${av.texto}`));
    const fiesta = fiestaDeCumple(dia(), a);
    if (fiesta) ficha.appendChild(el('p', 'pista', `Hoy ${fiesta.claves.length > 1 ? 'festejan' : 'festeja'} ${fiesta.claves.map((k) => nombreCortoDe(k)).join(' y ')}, de 18 a 20, ${fiesta.donde === 'plaza' ? 'en la plaza' : `en ${(EDIFICIOS_ALDEA[fiesta.edificio]?.nombre || 'su casa').toLowerCase()}`}. Un regalo que le guste vale el doble.`));
    // el apodo, la mascota, la familia y los chicos
    const ap = apodoPorId(v.apodo);
    if (ap) ficha.appendChild(el('p', 'texto', `En la aldea te dicen «${ap.texto}».`));
    const m = v.mascota;
    if (m?.estado === 'adoptado') ficha.appendChild(el('p', 'texto', `${m.nombre}, el cachorro de la Chola, vive en tu refugio desde el día ${m.desde}: ${{ cachorro: 'todavía es un cachorro', joven: 'ya es un perro joven', adulto: 'ya es un perro grande' }[etapaMascota(m, dia())]}.`));
    else if (m?.estado === 'cachorros') ficha.appendChild(el('p', 'pista', 'La Chola, la perra de Ernesto, tuvo cachorros: hablale al jefe de estación.'));
    const fam = v.familia;
    if (fam) ficha.appendChild(el('p', 'texto', `La próxima visita de tu familia: ${FAMILIA[fam.quien].llamada}, el día ${fam.proxima}${fam.cuenta ? ` (ya vinieron ${fam.cuenta} ${fam.cuenta === 1 ? 'vez' : 'veces'})` : ''}.`));
    for (const k of CHICOS_ALDEA) { const dch = dichosDe(k, a); if (dch) ficha.appendChild(el('p', 'texto', `${VECINOS_ALDEA[k].nombre}: ${dch.oficio}.`)); }
    // los visitantes que guiaste
    if (v.guiados?.length) {
      ficha.appendChild(el('h3', '', 'Visitantes que guiaste'));
      const lg = el('ul', 'lista');
      for (const g of [...v.guiados].reverse()) lg.appendChild(el('li', '', lineaGuiado(g)));
      ficha.appendChild(lg);
    }
    // las cartas de la aldea
    if (v.cartas?.length) {
      ficha.appendChild(el('h3', '', 'Cartas de la aldea'));
      for (const c of [...v.cartas].reverse().slice(0, 4)) {
        ficha.appendChild(el('p', 'anotado', `Día ${c.dia}, de ${nombreCortoDe(c.de)}:`));
        ficha.appendChild(el('p', 'texto', c.texto.join(' ')));
        c.leida = true;
      }
    }
    ficha.appendChild(el('h3', '', 'Cumpleaños de todos'));
    ficha.appendChild(el('p', 'texto', listaCumples(a).map((x) => `${nombreCortoDe(x.clave)} (${x.diaDelAnio})`).join(' · ')));
    void p;
  }

  // ---------------------------------------------------------------- en el cuaderno
  function dibujarCuaderno(ficha, el) {
    const a = aldea();
    const p = progreso();
    ficha.appendChild(el('h2', '', NOMBRE_ALDEA));
    ficha.appendChild(el('p', 'texto', a.descubierta
      ? `Un pueblo chico en la parada del sur de la trochita. Lo conociste el día ${a.descubierta}.`
      : 'Un pueblo chico en la parada del sur de la trochita. Todavía no fuiste: la trochita para ahí en cada vuelta.'));
    const lista = el('ul', 'lista');
    for (const k of ORDEN_VECINOS_ALDEA) {
      const v = VECINOS_ALDEA[k];
      lista.appendChild(el('li', '', `${v.nombre}, ${v.oficio}.`));
    }
    // (Ercilia se vino del valle con el almacén)
    if (Object.hasOwn(VECINOS_DEL_VALLE, 'ercilia')) lista.appendChild(el('li', '', 'Ercilia, la del almacén de ramos generales, que se vino del valle con todo el almacén.'));
    for (const x of a.pobladores || []) {
      const def = POBLADORES_ALDEA[x.clave];
      if (!def) continue;
      const lote = LOTE_DE[x.clave];
      lista.appendChild(el('li', '', localAbierto(a, lote)
        ? `${def.nombre}, ${def.oficio}: atiende ${nombreLocal(lote)} desde el día ${a.locales[lote]}. ${def.resumen}`
        : `${def.nombre}, ${def.oficio}: vive en la estación mientras le levantan ${nombreLocal(lote)}.`));
    }
    ficha.appendChild(lista);
    const obra = obraEnCurso(a);
    if (obra) {
      const et = etapaDe(a, obra);
      ficha.appendChild(el('p', 'pista', `La obra de ${nombreLocal(obra)}: etapa ${et.hechas + 1} de ${et.total} (${minus(et.etapa.nombre)}). ${et.lista
        ? 'Los vecinos están trabajando: mañana a la mañana está lista.'
        : `${mayus(verboFalta(et.faltan))} ${listaMateriales(et.faltan)}: ${verboFalta(et.faltan) === 'falta' ? 'se aporta' : 'se aportan'} con E, parado en el lote.`}`));
    }
    if (a.llegando) {
      ficha.appendChild(el('p', 'pista', `${POBLADORES_ALDEA[a.llegando.clave].nombre} espera en el andén de la aldea: andá a hablarle.`));
    } else {
      const quien = quienLlega(a);
      if (quien) {
        const def = POBLADORES_ALDEA[quien];
        const r = puedeLlegar(p);
        ficha.appendChild(el('p', 'pista', `El próximo en llegar: ${def.nombre}, ${def.oficio}. ${r.ok
          ? 'Ya puede bajar del tren: viene en la próxima trochita que pare en la aldea.'
          : `Para que venga: ${minus(r.motivo)}.`} (Anotaciones: ${anotacionesDe(p)} de ${anotacionesPedidas(a)}.)`));
      } else ficha.appendChild(el('p', 'pista', 'Ya vinieron todos los que tenían que venir.'));
    }
  }

  function llamar() { llamarProximo(aldea()); ctx.guardar(); return true; }

  return {
    actualizar, charla, revisarLlegada, revisarObras, obraCerca, avisoObra, aportarObra, dibujarCuaderno, llamar,
    citar, figura, dibujarVecinos: (ficha, el) => fichaVecinos(progreso(), ficha, el),   // 3.6 (vida)
    prearmar, faltanFiguras: faltan, armando: () => (armando ? { k: armando.k, pasos: armando.tarea.tarea?.pasos || 0, msMax: armando.tarea.tarea?.msMax || 0 } : null),   // 3.7.0 (integración)
    dibujarCalendario, vida, adoptarCachorro, revisarDia: () => { diaRevisado = 0; revisarDia(); },   // 3.7.0
    oyendo: () => !!oida.activa,   // 3.6 (mecánicas): hay una charla (o un cuento) sonando cerca
    oyendoCuento: () => !!oida.activa?.cuento,   // 3.6.2: y si es uno de los cuentos del domingo
    personas, estadoVisual: (id) => estadoVisual(aldea(), id),
    // para las pruebas: cómo está todo
    estado: () => ({
      aldea: aldea(), lejos, saltos, enAldea: trenEnLaAldea(), charla: oida.activa ? { id: oida.activa.id, linea: oida.activa.linea, personas: oida.activa.personas } : null,
      // 3.7.0
      vida: vida(), visitantes: [...visitantes.entries()].map(([id, n]) => ({ id, x: n.pos.x, z: n.pos.z, dormido: !!n.dormido, siguiendo: !!n.enCita })),
      familia: [...familia.entries()].map(([q, n]) => ({ quien: q, x: n.pos.x, z: n.pos.z, dormido: !!n.dormido })),
      npcs: [...personas.entries()].filter(([, st]) => st.npc).map(([k, st]) => ({
        clave: k, saltos: st.saltos || 0, x: st.npc.pos.x, z: st.npc.pos.z, dormido: !!st.npc.dormido, llegando: !!st.npc.llegando, caminando: !!st.npc.camino?.length, enLejano: !!st.npc.enLejano, talla: st.npc.g?.scale?.y ?? 1,
        libre: !!st.act?.e, actividad: st.act?.e?.actividad || null, pose: st.npc.pose || null,
        destino: st.destino ? { edificio: st.destino.edificio, punto: st.destino.punto, lugar: st.destino.lugar, x: st.destino.x, z: st.destino.z } : null,
      })),
    }),
  };
}

