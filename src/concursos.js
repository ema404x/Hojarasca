// 3.7.5 (noticias): los concursos de las fiestas (PLAN_3_7.md, 3.7.5): el dulce, la trucha, el poncho y la foto. Cada
// uno va dentro de una fiesta (`actividadesDeFiesta` de fiestas.js suma `actividadesDeConcurso`): ese día te anotás
// con Nélida (la comisión de fiestas) llevando lo tuyo, los vecinos también compiten, y a la hora del fallo un jurado
// de tres vecinos prueba, mide o mira todo y da las cintas (primero, segundo, tercero; los demás, mención). El que
// sale entre los tres primeros se lleva un regalo útil (de lo que ya hay en el juego: sin economía nueva).
//
// Lo tuyo sale de lo que ya existe:
//   · el dulce, de la cocina (3.7.2: el dulce de leche y las mermeladas de la cocina a leña, el frasco de frutilla
//     del fuego, la miel de la colmena): se lleva un frasco (se lo comen en el jurado);
//   · la trucha, de la pesca: la más grande que sacaste hoy o ayer (se mide; no se gasta);
//   · el poncho, del telar (o el que te regalaron): se muestra y se devuelve;
//   · la foto, del álbum (el modo foto): la mejor que tengas; si la sacaste en la fiesta, suma.
//
// Todo lo que el plan no dice (las horas, los regalos, cómo se juzga, qué fiesta tiene qué concurso) está en
// constantes de acá arriba, para cambiarlo fácil (son decisiones del usuario: quedan para que él elija).
// Módulo puro: sin three ni DOM.
import { hashTexto, generador } from './semilla.js';
import { diaDelAnio, esVecinoAldea, esPobladorAldea } from './aldea.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const entero = (v, d = 0) => Math.floor(num(v, d));
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));

// ---------------------------------------------------------------- las constantes (para decidir)
// Las horas: te anotás desde `desde` hasta el fallo; el jurado da el fallo a las `fallo`.
export const HORAS_CONCURSO = { desde: 9, fallo: 17 };
// La trucha que cuenta: la más grande de los últimos `DIAS_TRUCHA` días (hoy incluido).
export const DIAS_TRUCHA = 2;
// Cómo se juzga: cada jurado le da a cada uno su calidad más un poco de gusto propio (± `GUSTO_JURADO` / 2); vale el
// promedio de los tres. Los vecinos llegan con su mano (`compiten`) ± `VARIACION_VECINO` / 2 cada año.
export const JURADO = 3, GUSTO_JURADO = 12, VARIACION_VECINO = 18;
// Las cintas. Los que no quedan entre los tres primeros se llevan la de mención.
export const CINTAS = [
  { puesto: 1, id: 'azul', nombre: 'cinta azul', texto: 'primer premio' },
  { puesto: 2, id: 'roja', nombre: 'cinta roja', texto: 'segundo premio' },
  { puesto: 3, id: 'blanca', nombre: 'cinta blanca', texto: 'tercer premio' },
];
export const MENCION = { puesto: 0, id: 'verde', nombre: 'cinta verde', texto: 'mención' };
export const cintaDe = (puesto) => CINTAS.find((c) => c.puesto === puesto) || MENCION;
// En qué fiesta va cada concurso: por el id de la fecha (`fechas`) o, si no, por la estación de la fiesta (los
// de `TIPOS_CON_CONCURSO`). La foto va el día de la aldea.
export const TIPOS_CON_CONCURSO = ['fiesta', 'estacion'];
export const CONCURSOS = {
  dulce: {
    id: 'dulce', nombre: 'Concurso de dulces', corto: 'el dulce', estacion: 'otono', fechas: ['fiesta-otono', 'fiesta-cosecha'],
    trae: 'un frasco de dulce (de leche, mermelada, frutilla) o de miel', gasta: true,
    // los vecinos que compiten y su mano (0 a 100)
    compiten: { madre: 76, abuela: 74, galesa: 72, panadera: 70, herbolaria: 64, apicultor: 62 },
    jurado: ['jefe', 'padre', 'maestra', 'enfermera', 'telegrafista', 'herrero', 'carpintero', 'martin'],
    regalos: {
      1: { cuenta: { azucar: 4, cacao: 2 }, texto: 'Azúcar y cacao, para el próximo dulce' },
      2: { cuenta: { azucar: 3 }, texto: 'Tres paquetes de azúcar, para el próximo dulce' },
      3: { cuenta: { azucar: 1 }, texto: 'Un paquete de azúcar' },
    },
  },
  trucha: {
    id: 'trucha', nombre: 'Concurso de la trucha', corto: 'la trucha', estacion: 'verano', fechas: ['fiesta-verano'],
    trae: 'la trucha más grande que sacaste hoy o ayer', gasta: false,
    compiten: { pescador: 74, botera: 70, padre: 62, nene: 56, andinista: 58, guardaparque: 60 },
    jurado: ['jefe', 'nelida', 'abuela', 'maestra', 'telegrafista', 'galesa', 'martin'],
    regalos: {
      1: { cuenta: { sal: 3, yerba: 4 }, texto: 'Sal gruesa para ahumar y yerba para la espera' },
      2: { cuenta: { sal: 2, yerba: 2 }, texto: 'Sal gruesa y yerba' },
      3: { cuenta: { yerba: 2 }, texto: 'Un poco de yerba' },
    },
  },
  poncho: {
    id: 'poncho', nombre: 'Concurso del poncho', corto: 'el poncho', estacion: 'invierno', fechas: ['fiesta-invierno', 'fiesta-nieve'],
    trae: 'un poncho (tejido en tu telar o el que te regalaron)', gasta: false,
    compiten: { tejedora: 80, modista: 72, abuela: 70, galesa: 64, madre: 60 },
    jurado: ['jefe', 'nelida', 'padre', 'maestra', 'pintora', 'carpintero', 'martin'],
    regalos: {
      1: { materiales: { lana: 4 }, texto: 'Cuatro vellones de lana, para el próximo' },
      2: { materiales: { lana: 2 }, texto: 'Dos vellones de lana' },
      3: { materiales: { lana: 1 }, texto: 'Un vellón de lana' },
    },
  },
  foto: {
    id: 'foto', nombre: 'Concurso de fotos', corto: 'la foto', estacion: null, fechas: ['dia-aldea', 'dia-de-la-aldea'], tipos: ['aldea'],
    trae: 'tu mejor foto del álbum (si es de la fiesta, mejor)', gasta: false,
    compiten: { fotografa: 78, pintora: 70, nena: 58, telegrafista: 62, guardaparque: 64 },
    jurado: ['jefe', 'nelida', 'abuela', 'padre', 'maestra', 'galesa', 'martin'],
    regalos: {
      1: { cuenta: { yerba: 4 }, materiales: { tabla: 4 }, texto: 'Yerba y cuatro tablas para el marco (y tu foto sale en el diario)' },
      2: { cuenta: { yerba: 3 }, texto: 'Yerba (y tu foto sale en el diario)' },
      3: { cuenta: { yerba: 1 }, texto: 'Un poco de yerba' },
    },
  },
};
export const ORDEN_CONCURSOS = Object.keys(CONCURSOS);
export const esConcurso = (id) => typeof id === 'string' && Object.hasOwn(CONCURSOS, id);
// Quién anota (la comisión de fiestas)
export const ORGANIZA = 'nelida';

// ---------------------------------------------------------------- qué concurso hay en una fecha
const ESTACION_DDA = (dda) => (dda <= 4 ? 'verano' : dda <= 8 ? 'otono' : 'invierno');
export const estacionDeDia = (dia) => ESTACION_DDA(diaDelAnio(diaValido(dia, 1)));
// `fecha`: { id, nombre, tipo } (de fiestas.js) o null. `dia`: el día de la partida (para la estación). Uno por fiesta.
export function concursoDeFecha(fecha, dia = null) {
  if (!objeto(fecha) || typeof fecha.id !== 'string') return null;
  for (const id of ORDEN_CONCURSOS) if (CONCURSOS[id].fechas.includes(fecha.id)) return id;
  for (const id of ORDEN_CONCURSOS) if ((CONCURSOS[id].tipos || []).includes(fecha.tipo)) return id;
  if (!TIPOS_CON_CONCURSO.includes(fecha.tipo) || dia === null) return null;
  const e = estacionDeDia(dia);
  return ORDEN_CONCURSOS.find((id) => CONCURSOS[id].estacion === e) || null;
}
// Para `actividadesDeFiesta` (fiestas.js): el concurso de esa fiesta, con su hora y quién anota.
export function actividadesDeConcurso(fecha, dia = null) {
  const id = concursoDeFecha(fecha, dia);
  if (!id) return [];
  const c = CONCURSOS[id];
  return [{ id: `concurso-${id}`, tipo: 'concurso', concurso: id, nombre: c.nombre, desde: HORAS_CONCURSO.desde, hasta: HORAS_CONCURSO.fallo, organiza: ORGANIZA,
    texto: `${c.nombre}: traé ${c.trae}. Anota Nélida hasta las ${HORAS_CONCURSO.fallo}; a esa hora el jurado da las cintas.` }];
}

// ---------------------------------------------------------------- lo que llevás (la calidad: 0 a 100)
// Los dulces: lo de la alacena (cocina-pasos.js) y lo que guarda la colmena. `receta`: la de cocina.hechas (la mano
// que tenés: cuantas más hiciste, mejor te sale).
export const DULCES = {
  'dulce-leche': { nombre: 'dulce de leche', base: 70, receta: 'dulce-leche' },
  'mermelada-frambuesa': { nombre: 'mermelada de frambuesa', base: 66, receta: 'mermeladas' },
  'mermelada-cereza': { nombre: 'mermelada de cereza', base: 66, receta: 'mermeladas' },
  'mermelada-ciruela': { nombre: 'mermelada de ciruela', base: 64, receta: 'mermeladas' },
  'mermelada-manzana': { nombre: 'mermelada de manzana', base: 62, receta: 'mermeladas' },
  'mermelada-pera': { nombre: 'mermelada de pera', base: 62, receta: 'mermeladas' },
  'mermelada-grosella': { nombre: 'mermelada de grosella', base: 66, receta: 'mermeladas' },
  'frasco-frutilla': { nombre: 'dulce de frutilla', base: 60, receta: 'mermeladas' },
  miel: { nombre: 'miel', base: 56, receta: null },
};
export const MANO_DULCE = { porVez: 2, tope: 14 };
const cuanto = (p, k) => Math.max(0, Math.floor(num(p?.entradas?.[k]?.cantidad))) + Math.max(0, Math.floor(num(p?.cosas?.[k])));
export function entradaDulce(p) {
  let mejor = null;
  for (const [k, d] of Object.entries(DULCES)) {
    if (cuanto(p, k) < 1) continue;
    const hechas = d.receta ? Math.max(0, entero(p?.cocina?.hechas?.[d.receta])) : 0;
    const calidad = Math.min(100, d.base + Math.min(MANO_DULCE.tope, hechas * MANO_DULCE.porVez));
    if (!mejor || calidad > mejor.calidad) mejor = { k, que: `un frasco de ${d.nombre}`, calidad };
  }
  return mejor;
}
// Las truchas (pesca.js: arcoíris, marrón y de arroyo): la más grande de los últimos días. 20 cm, 30 puntos; cada
// centímetro más, 1,3 (una marrón de 72, 98).
export const TRUCHAS = ['arcoiris', 'marron', 'fontinalis'];
export const NOMBRE_TRUCHA = { arcoiris: 'trucha arcoíris', marron: 'trucha marrón', fontinalis: 'trucha de arroyo' };
export const puntosTrucha = (cm) => Math.max(0, Math.min(100, Math.round(30 + (num(cm) - 20) * 1.3)));
export function entradaTrucha(estado, dia) {
  const d = diaValido(dia, 1);
  const lista = (Array.isArray(estado?.truchas) ? estado.truchas : []).filter((t) => t.dia > d - DIAS_TRUCHA && t.dia <= d);
  if (!lista.length) return null;
  const t = lista.reduce((a, b) => (b.cm > a.cm ? b : a));
  return { k: t.especie, que: `una ${NOMBRE_TRUCHA[t.especie] || 'trucha'} de ${t.cm} cm`, calidad: puntosTrucha(t.cm), cm: t.cm };
}
// El poncho: uno tuyo (cosas.poncho). La mano: cuantos más tenés (tejidos o regalados), un poco mejor.
export const MANO_PONCHO = { base: 62, porPoncho: 4, tope: 16 };
export function entradaPoncho(p) {
  const n = Math.max(0, entero(p?.cosas?.poncho));
  if (n < 1) return null;
  return { k: 'poncho', que: 'un poncho de tu telar', calidad: Math.min(100, MANO_PONCHO.base + Math.min(MANO_PONCHO.tope, (n - 1) * MANO_PONCHO.porPoncho)) };
}
// La foto: la mejor del álbum (fotos.js). Lo difícil vale más; la sacada el día de la fiesta suma `FOTO_FIESTA`.
export const FOTO_BASE = 56, FOTO_FIESTA = 12;
export const RAREZA_FOTO = {
  'f-huemul': 82, 'f-pudu': 80, 'f-condor': 78, 'f-picaflor': 74, 'f-ciervo': 72, 'f-murcielago': 70, 'f-zorro': 68,
  'f-carpintero': 68, 'f-pato': 66, 'f-coipo': 66, 'f-manganga': 64, 'f-atardecer': 62, 'f-luna': 62, 'f-faro': 60,
};
export function entradaFoto(p, dia, nombres = {}) {
  const d = diaValido(dia, 1);
  let mejor = null;
  for (const [id, f] of Object.entries(objeto(p?.desafios) ? p.desafios : {})) {
    if (!objeto(f)) continue;
    const deLaFiesta = entero(f.dia) === d;
    const calidad = Math.min(100, (Object.hasOwn(RAREZA_FOTO, id) ? RAREZA_FOTO[id] : FOTO_BASE) + (deLaFiesta ? FOTO_FIESTA : 0));
    if (!mejor || calidad > mejor.calidad) mejor = { k: id, que: `tu foto «${(Object.hasOwn(nombres, id) && nombres[id]) || id}»${deLaFiesta ? ', sacada en la fiesta' : ''}`, calidad };
  }
  return mejor;
}
// Lo que llevarías a `id` hoy (o null si no tenés nada): { k, que, calidad }.
export function entradaDe(id, p, estado, dia, nombresFoto = {}) {
  if (id === 'dulce') return entradaDulce(p);
  if (id === 'trucha') return entradaTrucha(estado, dia);
  if (id === 'poncho') return entradaPoncho(p);
  if (id === 'foto') return entradaFoto(p, dia, nombresFoto);
  return null;
}

// ---------------------------------------------------------------- el estado (progreso.concursos)
export const TOPE_TRUCHAS = 8, TOPE_RESULTADOS = 12, TOPE_CINTAS = 40;
export function concursosNuevo() { return { inscripto: null, truchas: [], resultados: [], cintas: [] }; }
const claveSana = (k) => typeof k === 'string' && /^[a-z0-9-]{1,40}$/.test(k);
const textoSano = (s, tope = 80) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').slice(0, tope) : '');
export function sanearConcursos(x0, hoy = null) {
  const tope = Number.isFinite(Number(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const x = objeto(x0) ? x0 : {};
  const base = concursosNuevo();
  const i = x.inscripto;
  if (objeto(i) && esConcurso(i.id) && claveSana(i.k)) {
    const d = diaValido(i.dia, 1);
    // (de otro día ya no vale: el fallo pasó)
    if (d <= tope && (!Number.isFinite(Number(hoy)) || d === tope)) base.inscripto = { id: i.id, dia: d, k: i.k, que: textoSano(i.que), calidad: Math.max(0, Math.min(100, num(i.calidad))) };
  }
  for (const t of Array.isArray(x.truchas) ? x.truchas : []) {
    if (!objeto(t) || !TRUCHAS.includes(t.especie)) continue;
    const d = diaValido(t.dia, 1);
    if (d > tope) continue;
    base.truchas.push({ dia: d, cm: Math.max(1, Math.min(120, entero(t.cm, 1))), especie: t.especie });
  }
  base.truchas = base.truchas.slice(-TOPE_TRUCHAS);
  for (const r of Array.isArray(x.resultados) ? x.resultados : []) {
    if (!objeto(r) || !esConcurso(r.id)) continue;
    const d = diaValido(r.dia, 1);
    if (d > tope || base.resultados.some((q) => q.dia === d && q.id === r.id)) continue;
    const podio = (Array.isArray(r.podio) ? r.podio : []).filter((q) => q === 'jugador' || (typeof q === 'string' && (esVecinoAldea(q) || esPobladorAldea(q)))).slice(0, 3);
    base.resultados.push({ id: r.id, dia: d, podio, puesto: Math.max(0, Math.min(99, entero(r.puesto))), jurado: (Array.isArray(r.jurado) ? r.jurado : []).filter((q) => typeof q === 'string' && (esVecinoAldea(q) || esPobladorAldea(q))).slice(0, JURADO) });
  }
  base.resultados = base.resultados.slice(-TOPE_RESULTADOS);
  for (const c of Array.isArray(x.cintas) ? x.cintas : []) {
    if (!objeto(c) || !esConcurso(c.id)) continue;
    const d = diaValido(c.dia, 1);
    if (d > tope) continue;
    const puesto = Math.max(0, Math.min(99, entero(c.puesto)));
    base.cintas.push({ id: c.id, dia: d, puesto, cinta: cintaDe(puesto).id, que: textoSano(c.que) });
  }
  base.cintas = base.cintas.slice(-TOPE_CINTAS);
  return base;
}

// Una trucha sacada (para el concurso). `pez`: { id, cm } de pesca.js.
export function anotarTrucha(estado, pez, dia) {
  if (!objeto(estado) || !pez || !TRUCHAS.includes(pez.id)) return false;
  estado.truchas = [...(Array.isArray(estado.truchas) ? estado.truchas : []), { dia: diaValido(dia, 1), cm: Math.max(1, Math.min(120, entero(pez.cm, 1))), especie: pez.id }].slice(-TOPE_TRUCHAS);
  return true;
}

// Anotarse: `entrada` es la de `entradaDe`. Una vez por concurso (y por día). Devuelve true si quedó anotado.
export function inscribir(estado, id, entrada, dia, hora) {
  if (!objeto(estado) || !esConcurso(id) || !entrada || !claveSana(entrada.k)) return false;
  const d = diaValido(dia, 1);
  if (num(hora, 12) < HORAS_CONCURSO.desde || num(hora, 12) >= HORAS_CONCURSO.fallo) return false;
  if (estado.inscripto?.dia === d) return false;
  if (estado.resultados?.some((r) => r.dia === d && r.id === id)) return false;
  estado.inscripto = { id, dia: d, k: entrada.k, que: textoSano(entrada.que), calidad: Math.max(0, Math.min(100, num(entrada.calidad))) };
  return true;
}

// ---------------------------------------------------------------- el jurado y el fallo
// `presentes(k)`: si `k` vive en la aldea (vecinos siempre; pobladores, los que llegaron).
export function competidoresDe(id, presentes = () => true) {
  const c = CONCURSOS[id];
  if (!c) return [];
  return Object.keys(c.compiten).filter((k) => presentes(k));
}
export function juradoDe(id, dia, presentes = () => true) {
  const c = CONCURSOS[id];
  if (!c) return [];
  const r = generador(hashTexto(`jurado-${id}-${diaValido(dia, 1)}`));
  const compiten = new Set(Object.keys(c.compiten));
  const pool = c.jurado.filter((k) => presentes(k) && !compiten.has(k));
  const elegidos = [];
  while (pool.length && elegidos.length < JURADO) elegidos.push(pool.splice(Math.floor(r() * pool.length) % pool.length, 1)[0]);
  // (si no alcanzan, los de siempre)
  for (const k of ['jefe', 'nelida', 'padre']) if (elegidos.length < JURADO && !elegidos.includes(k) && !compiten.has(k)) elegidos.push(k);
  return elegidos;
}
// El fallo: { id, dia, jurado, tabla: [{ quien ('jugador' | clave), puntos, puesto, cinta }], podio: [quien×3], puesto
// (el tuyo, 0 si no te anotaste), regalo (el tuyo, o null) }. Siempre el mismo para el mismo día y lo mismo llevado.
export function juzgar(id, dia, { presentes = () => true, jugador = null } = {}) {
  const c = CONCURSOS[id];
  if (!c) return null;
  const d = diaValido(dia, 1);
  const r = generador(hashTexto(`concurso-${id}-${d}`));
  const jurado = juradoDe(id, d, presentes);
  const nota = (calidad) => {
    let s = 0;
    for (let i = 0; i < jurado.length; i++) s += calidad + (r() - 0.5) * GUSTO_JURADO;
    return Math.max(0, Math.min(100, Math.round((s / Math.max(1, jurado.length)) * 10) / 10));
  };
  const tabla = [];
  for (const k of competidoresDe(id, presentes)) tabla.push({ quien: k, puntos: nota(c.compiten[k] + (r() - 0.5) * VARIACION_VECINO) });
  if (jugador && Number.isFinite(Number(jugador.calidad))) tabla.push({ quien: 'jugador', puntos: nota(Number(jugador.calidad)), que: jugador.que || '' });
  tabla.sort((a, b) => b.puntos - a.puntos || (a.quien === 'jugador' ? 1 : b.quien === 'jugador' ? -1 : a.quien.localeCompare(b.quien)));
  tabla.forEach((x, i) => { x.puesto = i + 1; x.cinta = cintaDe(i + 1).id; });
  const mio = tabla.find((x) => x.quien === 'jugador');
  const puesto = mio ? mio.puesto : 0;
  return { id, dia: d, jurado, tabla, podio: tabla.slice(0, 3).map((x) => x.quien), puesto, cinta: mio ? cintaDe(puesto) : null, regalo: mio ? regaloDe(id, puesto) : null };
}
export const regaloDe = (id, puesto) => (esConcurso(id) && Object.hasOwn(CONCURSOS[id].regalos, puesto) ? CONCURSOS[id].regalos[puesto] : null);
// Guarda el fallo (y tu cinta, si te anotaste). Devuelve el fallo, o null si ya estaba.
export function fallar(estado, id, dia, presentes = () => true) {
  if (!objeto(estado) || !esConcurso(id)) return null;
  const d = diaValido(dia, 1);
  if ((estado.resultados || []).some((x) => x.dia === d && x.id === id)) return null;
  const ins = estado.inscripto && estado.inscripto.dia === d && estado.inscripto.id === id ? estado.inscripto : null;
  const f = juzgar(id, d, { presentes, jugador: ins });
  estado.resultados = [...(estado.resultados || []), { id, dia: d, podio: f.podio, puesto: f.puesto, jurado: f.jurado }].slice(-TOPE_RESULTADOS);
  if (ins) {
    estado.cintas = [...(estado.cintas || []), { id, dia: d, puesto: f.puesto <= 3 ? f.puesto : 0, cinta: cintaDe(f.puesto).id, que: ins.que }].slice(-TOPE_CINTAS);
    estado.inscripto = null;
  }
  return f;
}
// Lo que dice el jurado (para la nota y la charla). `nombre(k)`: el nombre corto de un vecino.
export function textoFallo(f, nombre = (k) => k) {
  if (!f) return null;
  const c = CONCURSOS[f.id];
  const quien = (k) => (k === 'jugador' ? 'vos' : nombre(k));
  const podio = f.podio.map((k, i) => `${CINTAS[i].nombre}, ${quien(k)}`).join('; ');
  const titulo = f.puesto >= 1 && f.puesto <= 3 ? `¡${cintaDe(f.puesto).nombre.charAt(0).toUpperCase()}${cintaDe(f.puesto).nombre.slice(1)} en el ${c.nombre.toLowerCase()}!` : f.puesto ? `Cinta verde de mención en el ${c.nombre.toLowerCase()}` : `El fallo del ${c.nombre.toLowerCase()}`;
  const regalo = f.regalo ? ` Te regalan: ${f.regalo.texto.charAt(0).toLowerCase()}${f.regalo.texto.slice(1)}.` : '';
  return { titulo, texto: `El jurado (${f.jurado.map(nombre).join(', ')}): ${podio}.${regalo}` };
}
// Para el diario y la radio: «En el concurso de dulces ganó Gladys (cinta azul)…».
export function noticiaDeResultado(r, nombre = (k) => k) {
  if (!objeto(r) || !esConcurso(r.id) || !r.podio?.length) return null;
  const c = CONCURSOS[r.id];
  const quien = (k) => (k === 'jugador' ? 'nuestro vecino del refugio' : nombre(k));
  const resto = r.podio.slice(1).map(quien);
  return `En el ${c.nombre.toLowerCase()} se llevó la cinta azul ${quien(r.podio[0])}${resto.length ? `; después, ${resto.join(' y ')}` : ''}.${r.puesto > 3 ? ' El del refugio se llevó una mención: el año que viene, dicen.' : ''}`;
}
