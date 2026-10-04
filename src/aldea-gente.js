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
//   · 3.6 (vida): la invitación a la casa de té (`citar`): el invitado va por las calles a su mesa.
//
// Para el mundo (quien dibuja los edificios): `estadoVisual(aldea, id)` dice qué etapa dibujar
// y `escucharAldea` (aldea.js) avisa cuando algo cambia ('aceptado', 'trabajando', 'etapa',
// 'abierto'…).
//
// Sin three ni DOM (se prueba en Node): las figuras las arma gente.js y lo demás llega por `ctx`.
import { elegirActividad, cumplirActividad, estaLibre, climaDe, ACTIVIDADES, NOCHE_AFUERA } from './vecindad.js';
import { fichaVecinos } from './vecindad-juego.js';
import { desfaseDe, NOMBRE_ALDEA, PARADA_ALDEA, EDIFICIOS_ALDEA, IDS_EDIFICIOS, CALLES_ALDEA, marcoAldea, puntosDe, dentroDePlanta, VECINOS_ALDEA, ORDEN_VECINOS_ALDEA, VECINOS_DEL_VALLE, POBLADORES_ALDEA, LOTE_DE, esVecinoAldea, esPobladorAldea, aldeaNueva, puedeLlegar, empezarLlegada, aceptar, llamarProximo, obraEnCurso, aportar, avanzarObras, etapaDe, estadoEdificio, localAbierto, servicioDe, aplicarAlAldea, rutinaAldea, diaSemanaDe, elegirCharla, charlasPosibles, ETAPAS_OBRA, anotacionesDe, anotacionesPedidas, quienLlega, puntosFijosDe } from './aldea.js';

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
  return p.salida ? [p.puerta, p.salida] : p.puerta ? [p.puerta] : [];
}
// El recorrido completo de un punto a otro del plano: de adentro sale por la puerta, va por
// las calles y entra por la puerta del otro (los tramos de puerta para adentro, sin choques).
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
    const r = elegidas?.get(k) || rutinaAldea(k, horas, ds, aldea);
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
    salida.set(k, { ...r, clave, lx: q.x, lz: q.z, rot: q.rot, adentro, sentado: SENTADO.test(r.punto || '') });
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
  if ((d.lugar === 'local' || d.lugar === 'trabajo') && Object.hasOwn(GESTO_OFICIO, d.edificio || '')) return GESTO_OFICIO[d.edificio];
  return null;
}
// 3.6 (mecánicas): el gesto de cada oficio (el panadero amasa, el herrero martilla, el carpintero sierra)
const GESTO_OFICIO = { herreria: 'martillar', panaderia: 'amasar', carpinteria: 'serruchar' };

// Lo que se ve de la aldea desde un punto del mundo: cuánto falta para el rectángulo que ocupa.
export function distanciaAldea(x, z, M = marcoAldea(PARADA_ALDEA)) {
  const l = M.aLocal(x, z);
  const dx = Math.max(-46 - l.lx, 0, l.lx - 92), dz = Math.max(-2 - l.lz, 0, l.lz - 72);
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
  function crearFigura(k, d) {
    if (Object.hasOwn(VECINOS_DEL_VALLE, k)) return adoptar(k);
    const g = ctx.gente?.();
    if (!g?.agregarPoblador) return null;
    const def = defDe(k);
    const vecino = esVecinoAldea(k);
    const llegando = aldea().llegando?.clave === k;
    const npc = g.agregarPoblador({
      clave: `${vecino ? 'aldea' : 'poblador'}-${k}`, colores: def.colores, pos: { x: d.x, z: d.z },
      mira: { x: d.x + Math.sin(d.mira), z: d.z + Math.cos(d.mira) },
      nombre: def.nombre, oficio: def.oficio, saludo: llegando ? 'Buenas. ¿Usted es de la aldea?' : def.saludo,
      despedida: llegando ? 'Lo espero acá, en el andén.' : def.despedida,
      mano: def.mano, velocidad: def.chico ? 1.05 : 0.85, camino: [], talla: def.talla,
    });
    if (!npc) return null;
    npc.claveAldea = k;
    npc.llegando = llegando;
    npc.miraFinal = d.mira;
    npc.soloCerca = d.adentro ? VER_ADENTRO : 0;
    return npc;
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
  function ubicar(npc, d) {
    npc.pos.set(d.x, ctx.alturaDePie(d.x, d.z, npc.pos.y), d.z);
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
    const pasos = recorridoAldea({ x: l.lx, z: l.lz }, { x: d.lx, z: d.lz });
    npc.camino = pasos.map((q, i) => ({ ...M.aMundo(q.x, q.z), sinChoque: !!q.sinChoque, cerca: i === pasos.length - 1 ? 0.12 : 0.6 }));
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
      const va = conTiempo(k, st, h, ds, p, abs);
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
  const viviendaDe = (k, ds) => rutinaAldea(k, 3, ds, aldea()).edificio;
  // Si el horario lo deja en un banco de la plaza con lluvia, nieve o de noche, a su casa (o null).
  function aCubierto(k, h, ds, palabra) {
    const r = rutinaAldea(k, h, ds, aldea());
    if (r.edificio !== 'plaza' || !/^estar-/.test(r.punto || '')) return null;
    const t = h - desfaseDe(k);
    if (palabra !== 'lluvia' && palabra !== 'nieve' && t < NOCHE_AFUERA && t >= 7) return null;
    const casa = viviendaDe(k, ds);
    return casa ? { lugar: 'casa', edificio: casa, punto: 'adentro', actividad: 'descansar' } : null;
  }
  // Lo que le toca dentro de lo que tarda en llegar caminando (o null si le da el tiempo).
  // (una vez que salió, sigue yendo aunque llegue antes: no se va a dar otra vuelta mientras espera)
  function conTiempo(k, st, h, ds, p, abs) {
    if (st.yendo && abs < st.yendo.hasta && abs >= st.yendo.desde) return st.yendo.d;
    st.yendo = null;
    const n = st.npc;
    if (!n || n.dormido || n.deVisita) return null;
    const vel = Math.max(0.3, Number(n.velocidad) || 0.85) * (Number(ctx.segundosPorHora?.()) || 75);   // metros por hora del juego
    let adelanto = 0.75;
    let r = null, hf = h, dsf = ds;
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      hf = h + adelanto; dsf = hf >= 24 ? (ds + 1) % 7 : ds; hf %= 24;
      r = rutinaAldea(k, hf, dsf, aldea());
      const q = r.edificio && (puntosFijosDe(r.edificio)[r.punto] || puntosFijosDe(r.edificio).adentro);
      if (!q) return null;
      const w = M.aMundo(q.x, q.z);
      adelanto = Math.min(1.25, (Math.hypot(w.x - n.pos.x, w.z - n.pos.z) * 1.35) / vel + 0.1);
    }
    if (estaLibre(k, hf, dsf, p)) return null;   // lo que viene es tiempo libre
    if (r.punto === 'cama' || r.punto === 'cama-chicos') return null;   // a dormir, a su hora
    if (r.edificio === 'plaza' && /^estar-/.test(r.punto || '')) return null;   // (a un banco de la plaza no se apura nadie: y con lluvia, no va)
    const ahora = rutinaAldea(k, h, ds, aldea());
    if (ahora.edificio === r.edificio && ahora.punto === r.punto) return null;
    const d = { lugar: r.lugar, edificio: r.edificio, punto: r.punto, actividad: null };
    st.yendo = { d, desde: abs, hasta: abs + adelanto + 0.05 };
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
    return st.npc;
  }

  // ---------------------------------------------------------------- la llegada
  function trenEnLaAldea() {
    const e = ctx.tren?.()?.est;
    if (!e) return false;
    const aca = (p) => !!p && p.indice === PARADA_ALDEA.indice;
    return (e.parado > 0 && aca(e.proxima)) || (e.conduce && aca(e.paradaCabina));
  }
  function revisarLlegada(forzar = false) {
    const a = aldea();
    if (a.llegando || !(forzar || trenEnLaAldea())) return null;
    const r = puedeLlegar(progreso());
    if (!r.ok) return null;
    if (!empezarLlegada(a, r.quien, dia())) return null;
    const def = POBLADORES_ALDEA[r.quien];
    ctx.nota(`Bajó alguien del tren en la ${NOMBRE_ALDEA}`, `${def.nombre}, ${def.oficio}, espera en el andén con una valija`, true);
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
    return `Aportar a la obra de ${nombreLocal(lote)} (faltan ${listaMateriales(et.faltan)})`;
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
    const hacer = (m) => {
      r = aportar(a, lote, m, dia());
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
    ctx.alAportar?.(r.usados, r.completa);   // 3.6: lo que pusiste en la obra del pueblo cuenta para el oficio de constructor
    ctx.alAporteObra?.(lote, r.usados);   // 3.6 (vida): y los vecinos se acuerdan
    if (r.completa) ctx.nota(`Aportaste ${listaMateriales(r.usados)}`, 'Los vecinos van a trabajar en la obra: mañana a la mañana está lista la etapa', true);
    else ctx.nota(`Aportaste ${listaMateriales(r.usados)} a la obra de ${nombreLocal(lote)}`, `Faltan ${listaMateriales(r.faltan)}`);
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
    if (esVecinoAldea(k)) {
      const def = VECINOS_ALDEA[k];
      const n = charlasDichas.get(k) || 0;
      charlasDichas.set(k, n + 1);
      return { id: `aldea-${k}`, partes: [def.charla[(dia() + n) % def.charla.length]], tipo: 'vecino' };
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
        partes: [...def.llegada, `Me dijeron que acá, al que llega, entre todos le levantan el local. ${donde} ¿Me puedo quedar?`],
        seguir: 'E: que se quede · Escape: todavía no',
        alTerminar: () => aceptarAlQueLlego(npc),
        tipo: 'llegada',
      };
    }
    const s = servicioDe(k, progreso(), dia(), { pronostico: ctx.pronostico?.() || '' });
    return {
      id: `aldea-${k}`,
      partes: s.partes.length ? s.partes : [def.resumen],
      seguir: s.seguir,
      alTerminar: s.efectos ? () => usarServicio(k, s) : null,
      tipo: 'servicio', ofrece: !!s.efectos,
    };
  }
  function usarServicio(k, s) {
    const p = progreso();
    const def = POBLADORES_ALDEA[k];
    // lo ofrecido se vuelve a mirar al aceptar: en el medio pudiste gastar lo que ibas a dar
    const ahora = servicioDe(k, p, dia(), { pronostico: ctx.pronostico?.() || '' });
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
  function dondeEs(c) {
    let x = 0, z = 0;
    for (const k of c.personas) { const n = personas.get(k).npc; x += n.pos.x; z += n.pos.z; }
    return { x: x / c.personas.length, z: z / c.personas.length };
  }
  function empezarCharla(c, personasCharla, monologo = null) {
    const lineas = monologo || c.lineas;
    oida.activa = { id: c?.id || 'cuentos', lineas, personas: personasCharla, linea: -1, t: 0.4 };
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
    oida.espera = 12;
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
    ctx.decir?.(`${pila(nombreDe(quien))}: ${texto}`);
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
        if (c) { empezarCharla(c, [...new Set(c.lineas.map(([q]) => q))]); return; }
        if (!oida.vistas.has('cuentos')) { empezarCharla(null, ['abuela'], VECINOS_ALDEA.abuela.charla.map((t) => ['abuela', t])); return; }
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
        if (c && !oida.vistas.has(c.id)) { empezarCharla(c, [...new Set(c.lineas.map(([q]) => q))]); return; }
      }
    }
  }

  // ---------------------------------------------------------------- cada cuadro
  function actualizar(dt) {
    acum += dt;
    avanzarCharla(dt);
    const js = ctx.jugador?.()?.estado;
    // las figuras se arman de a una por cuadro, cuando te acercás (o si no hay ninguna lejos)
    if (js && lejos < RADIO_FIGURAS) {
      for (const [k, st] of personas) {
        if (st.npc || !st.destino) continue;
        // (la que no se pudo tomar, como Ercilia de visita en tu mesa, se reintenta más tarde)
        if (st.reintento > 0) { st.reintento -= dt; continue; }
        st.npc = crearFigura(k, st.destino);
        if (!st.npc) { st.reintento = 3; continue; }
        st.clave = st.destino.clave;
        ubicar(st.npc, st.destino);
        if (usaRutaPropia(k, st, st.destino)) aRutaPropia(st.npc, st, true);
        st.npc.dormido = lejos > RADIO_ALDEA;
        break;
      }
    }
    if (acum < 0.5) return;
    const paso = acum;
    acum = 0;
    const a = aldea();
    revisarObras();
    revisarLlegada();
    if (!js) return;
    lejos = distanciaAldea(js.pos.x, js.pos.z, M);
    const despierta = lejos < RADIO_ALDEA;
    // la primera vez que llegás, al cuaderno
    if (!a.descubierta && lejos < 1) {
      a.descubierta = dia();
      ctx.registrar?.('aldea');
      ctx.guardar();
    }
    const lista = presentes();
    for (const k of lista) if (!personas.has(k)) personas.set(k, { npc: null, destino: null, clave: '', trabado: { d: Infinity, t: 0 } });
    const destinos = destinosAldea(a, horas(), dia(), lista, M, elegirLibres(lista));   // 3.6 (vida): con su tiempo libre
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
      n.dormido = !despierta;
      if (!despierta) {
        // lejos: nadie lo ve caminar, se lo deja en su lugar
        if (st.clave !== d.clave) {
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
        const alLado = Math.hypot(n.pos.x - js.pos.x, n.pos.z - js.pos.z) < 7.5;
        const tr = st.trabado;
        if (!alLado && falta > tr.d - 0.2) tr.t += paso; else tr.t = 0;
        tr.d = Math.min(tr.d, falta);
        if (tr.t > 12) { ubicar(n, d); tr.t = 0; saltos++; st.saltos = (st.saltos || 0) + 1; }
      } else if (usaRutaPropia(k, st, d)) aRutaPropia(n, st);
      else { n.soloCerca = d.adentro ? VER_ADENTRO : 0; n.pose = poseDe(d); n.asiento = alturaAsiento(d, n); }   // 3.6 (vida): ya llegó: su pose (3.6.1: y su asiento)
    }
    if (despierta && js) buscarCharla(js);
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
        : `Faltan ${listaMateriales(et.faltan)}: se aportan con E, parado en el lote.`}`));
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
    oyendo: () => !!oida.activa,   // 3.6 (mecánicas): hay una charla (o un cuento) sonando cerca
    personas, estadoVisual: (id) => estadoVisual(aldea(), id),
    // para las pruebas: cómo está todo
    estado: () => ({
      aldea: aldea(), lejos, saltos, enAldea: trenEnLaAldea(), charla: oida.activa ? { id: oida.activa.id, linea: oida.activa.linea, personas: oida.activa.personas } : null,
      npcs: [...personas.entries()].filter(([, st]) => st.npc).map(([k, st]) => ({
        clave: k, saltos: st.saltos || 0, x: st.npc.pos.x, z: st.npc.pos.z, dormido: !!st.npc.dormido, llegando: !!st.npc.llegando, caminando: !!st.npc.camino?.length,
        libre: !!st.act?.e, actividad: st.act?.e?.actividad || null, pose: st.npc.pose || null,
        destino: st.destino ? { edificio: st.destino.edificio, punto: st.destino.punto, lugar: st.destino.lugar, x: st.destino.x, z: st.destino.z } : null,
      })),
    }),
  };
}

