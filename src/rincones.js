// 3.7.5 (rincones): los rincones de la aldea y la casa (PLAN_3_7.md, «Tradiciones»). Las reglas puras (se prueban en
// Node); lo que se ve está en rincones-mundo.js y el enganche con el juego en rincones-juego.js. El fútbol (la pelota y
// los que corren) está en futbol.js, el camino y el sulky en sulky.js y la casa propia en casa-propia.js.
//
// Lo que hay acá:
//   · los doce duendes escondidos (figuritas talladas, ver rincones-cuaderno.js): dónde están y el registro;
//   · la talla del jugador en la plaza (al encontrar los doce, Tito te talla de madera al lado del duende viejo);
//   · el cuaderno en la biblioteca (con el cuaderno bien lleno, la abuela pone una copia en un atril);
//   · el taller del refugio: lo que te enseñan los amigos (una manualidad por maestro, con amistad de amigo o más);
//   · la huerta comunitaria (cuatro canteros al final de la calle Norte) y la huerta de los chicos en la escuela, con
//     las reglas de huerta.js;
//   · los títeres (una función por día a la tardecita, en el retablo de la plaza);
//   · el fuerte del bosque (tres etapas con los chicos, de a una por día) y el campamento con tus hijos;
//   · el potrero (dónde está; la pelota, en futbol.js) y lo que se anota de los partidos;
//   · el guardado (`progreso.rincones`) con su saneador.
//
// Todo lo que el plan no decía (dónde va cada cosa, qué enseña cada amigo, cómo se consigue la casa o el sulky) está en
// constantes, fácil de cambiar: ver «Decisiones para el usuario» en CAMBIOS_3_7_5 (rincones).
// Sólo Relax; nada religioso; sin economía nueva (trueque y servicios sí).
import { marcoAldea, PARADA_ALDEA, EDIFICIOS_ALDEA, diaSemanaDe, num } from './aldea.js';
import { CULTIVOS, avance, lista, diasQueFaltan } from './huerta.js';
import { DUENDES, IDS_DUENDES } from './rincones-cuaderno.js';
import { sulkyNuevo, sanearSulky, caminoNuevo, sanearCaminoAldea } from './sulky.js';
import { casaNueva, sanearCasa } from './casa-propia.js';

const PI = Math.PI;
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, def = 0) => { const n = Math.floor(num(v)); return Number.isFinite(n) ? n : def; };
const noNeg = (v, tope = Infinity) => Math.max(0, Math.min(tope, entero(v, 0)));
const diaValido = (d, def = 1) => Math.max(1, entero(d, def));
const tieneDe = (o, k) => objeto(o) && Object.hasOwn(o, k);

// ---------------------------------------------------------------- dónde está cada cosa (en el plano de la aldea)
// (lx, lz) en el marco de la aldea de aldea.js (X a lo largo de la vía, Z alejándose de ella); `rot` en el plano.
// Medidos contra el terreno real (pruebas/verificar-3-7-5-rincones.mjs): todos fuera de las plantas y de las calles.
export const LUGARES_RINCONES = {
  // el potrero: pasando la pescadería, al final de la calle de la Vía (24 × 14 m, el largo a lo largo de Z)
  potrero: { lx: 124, lz: 46, rot: PI / 2, largo: 24, ancho: 14 },
  // la huerta comunitaria: al final de la calle Norte, pasando la sala de miel (9 × 6 m, cuatro canteros)
  huerta: { lx: 84.5, lz: 64, rot: PI / 2, largo: 9, ancho: 6 },
  // la huerta de los chicos: dos canteros detrás de la escuela
  huertaChicos: { lx: 6.9, lz: 71, rot: 0 },
  // el retablo de los títeres, en la plaza (de frente a los bancos del medio)
  retablo: { lx: 2.4, lz: 47.6, rot: PI },
  // tu talla, al lado del duende viejo de la plaza (el de aldea.js, en (9, 37))
  talla: { lx: 11.3, lz: 37.2, rot: PI },
  // el atril con tu cuaderno, adentro de la biblioteca, al lado de la puerta
  atril: { lx: -13.9, lz: 44.0, rot: -PI / 2, piso: 'biblioteca' },
  // el fuerte del bosque, detrás de la calle de la Loma (entre la veterinaria y el estudio de fotos, bosque adentro)
  fuerte: { lx: -74, lz: 85, rot: 0.3 },
  // el campamento, en el claro al lado del fuerte
  campamento: { lx: -66.5, lz: 90, rot: -0.4 },
};
export const PISO_ALDEA_RINCONES = 0.32;   // la cara de arriba del piso de adentro (PISO_ALDEA de aldea-arquitectura.js)
export function lugarEnMundo(id, parada = PARADA_ALDEA) {
  const l = LUGARES_RINCONES[id];
  if (!l) return null;
  const M = marcoAldea(parada), w = M.aMundo(l.lx, l.lz);
  return { ...l, x: w.x, z: w.z, rotMundo: M.rotMundo(l.rot || 0) };
}
// Un punto en el marco de un lugar (u a lo ancho, v a lo largo del lugar), al mundo.
export function puntoDeLugar(id, u, v, parada = PARADA_ALDEA) {
  const l = LUGARES_RINCONES[id];
  if (!l) return null;
  const M = marcoAldea(parada), c = Math.cos(l.rot || 0), s = Math.sin(l.rot || 0);
  return M.aMundo(l.lx + u * c + v * s, l.lz - u * s + v * c);
}

// ---------------------------------------------------------------- el estado (progreso.rincones)
export const RINCONES = {
  version: 1,
  radioDuende: 1.8,          // a cuánto se ve (y se anota) una figurita
  tallaDias: 2,              // lo que tarda Tito en tallarte
  cuadernoEntradas: 40,      // las anotaciones que pide la biblioteca para la copia del cuaderno
  manualidadesPorDia: 1,     // cada manualidad, una vez por día
  titeres: { desde: 16, hasta: 19.5 },
  fuerte: { etapas: 3, pide: { tronco: 3 }, desde: 9, hasta: 19 },
  campamento: { desde: 19.5, hasta: 23 },   // 3.8.3: desde que es de noche para dormir (de 18 a 19,5 «Acampar» era una siesta y gastaba la noche)
  huerta: { canteros: 4, mitad: 0.5, desde: 7, hasta: 20 },
  huertaChicos: { canteros: 2, desde: 13, hasta: 19 },
};
// Los cultivos de cada cantero (la huerta de todos rota: cuando se cosecha, va el que sigue)
export const CULTIVOS_COMUNITARIA = ['papas', 'habas', 'frutillas', 'papas'];
export const CULTIVOS_CHICOS = ['frutillas', 'calafates'];
export const DUENOS_CHICOS = ['nena', 'nene'];   // «Frutillas de Lucía», «Calafates de Nahuel»

export function rinconesNuevos() {
  return {
    v: RINCONES.version,
    duendes: {},                  // id → día en que lo encontraste
    talla: 0,                     // día en que Tito la pone en la plaza (0: todavía no)
    cuaderno: 0,                  // día en que dejaste la copia del cuaderno en la biblioteca
    lecturas: 0,                  // cuántos vecinos lo leyeron (se nota en el atril)
    oficios: {},                  // id de manualidad → día en que la aprendiste
    hechos: {},                   // id de manualidad → { n, ultimo }
    huerta: {},                   // 'c0'..'c3' → parcela de huerta.js (+ `trabajado`: día)
    chicos: {},                   // 'c0'..'c1' → parcela (+ `trabajado`)
    cosechas: 0,                  // lo que se cosechó en las dos huertas (para el cuaderno)
    futbol: { goles: 0, partidos: 0, ultimo: 0, encontra: 0 },
    titeres: { funciones: 0, ultima: 0 },
    fuerte: { etapa: 0, dia: 0 },
    campamento: { veces: 0, ultimo: 0 },
    casa: casaNueva(),            // tu casa en la calle de la Loma (casa-propia.js)
    sulky: sulkyNuevo(),          // el sulky (sulky.js)
    camino: caminoNuevo(),        // el camino refugio–aldea: el día de la minga
  };
}
const sanearParcela = (p, cultivos, hoy) => {
  if (!objeto(p) || !Object.hasOwn(CULTIVOS, String(p.cultivo)) || !cultivos.includes(p.cultivo)) return null;
  return { cultivo: p.cultivo, dia: Math.min(hoy, diaValido(p.dia, hoy)), lluvia: noNeg(p.lluvia, 60), ultimaLluvia: Math.min(hoy, entero(p.ultimaLluvia, -1)), trabajado: Math.min(hoy, noNeg(p.trabajado)) };
};
export function sanearRincones(v, hoy = null) {
  const base = rinconesNuevos();
  if (!objeto(v)) return base;
  const d = hoy === null ? Infinity : diaValido(hoy, 1);
  const fecha = (x) => Math.min(d, noNeg(x));
  for (const id of IDS_DUENDES) if (tieneDe(v.duendes, id) && fecha(v.duendes[id]) > 0) base.duendes[id] = fecha(v.duendes[id]);
  // 3.8.3: la talla es una fecha que viene (Tito tarda RINCONES.tallaDias): el tope es hoy + eso, no hoy (al recargar salía antes)
  base.talla = Math.min(d + RINCONES.tallaDias, noNeg(v.talla));
  // (la talla sólo con los doce)
  if (Object.keys(base.duendes).length < IDS_DUENDES.length) base.talla = 0;
  base.cuaderno = fecha(v.cuaderno);
  base.lecturas = base.cuaderno ? noNeg(v.lecturas, 999) : 0;
  for (const id of Object.keys(MANUALIDADES)) {
    if (tieneDe(v.oficios, id) && fecha(v.oficios[id]) > 0) base.oficios[id] = fecha(v.oficios[id]);
    if (tieneDe(v.hechos, id) && objeto(v.hechos[id]) && base.oficios[id]) base.hechos[id] = { n: noNeg(v.hechos[id].n, 9999), ultimo: fecha(v.hechos[id].ultimo) };
  }
  const hd = Number.isFinite(d) ? d : 1e9;
  for (let i = 0; i < RINCONES.huerta.canteros; i++) { const p = sanearParcela(v.huerta?.[`c${i}`], [CULTIVOS_COMUNITARIA[i]], hd); if (p) base.huerta[`c${i}`] = p; }
  for (let i = 0; i < RINCONES.huertaChicos.canteros; i++) { const p = sanearParcela(v.chicos?.[`c${i}`], [CULTIVOS_CHICOS[i]], hd); if (p) base.chicos[`c${i}`] = p; }
  base.cosechas = noNeg(v.cosechas, 99999);
  if (objeto(v.futbol)) base.futbol = { goles: noNeg(v.futbol.goles, 99999), partidos: noNeg(v.futbol.partidos, 99999), ultimo: fecha(v.futbol.ultimo), encontra: noNeg(v.futbol.encontra, 99999) };
  if (objeto(v.titeres)) base.titeres = { funciones: noNeg(v.titeres.funciones, 9999), ultima: fecha(v.titeres.ultima) };
  if (objeto(v.fuerte)) base.fuerte = { etapa: noNeg(v.fuerte.etapa, RINCONES.fuerte.etapas), dia: fecha(v.fuerte.dia) };
  if (objeto(v.campamento)) base.campamento = { veces: noNeg(v.campamento.veces, 9999), ultimo: fecha(v.campamento.ultimo) };
  base.casa = sanearCasa(v.casa, d);
  base.sulky = sanearSulky(v.sulky, d);
  base.camino = sanearCaminoAldea(v.camino, d);
  return base;
}

// ---------------------------------------------------------------- los doce duendes
// Dónde está cada uno en el mundo: { id, x, z, y, rot, adentro }. `T`: el terreno (altura, agua, lugares, saltoAgua);
// `lugares`: los que no están en T.lugares (el refugio de estructuras.js trae su puerta). Busca el piso seco y no muy
// empinado más cerca del punto pedido (hasta 8 m), así un duende nunca queda en el agua.
const LUGARES_FIJOS = ['refugio', 'muelle', 'puente', 'mallin', 'mirador', 'arrayanes'];
export function ubicarDuendes(T, lugares = {}, parada = PARADA_ALDEA) {
  const M = marcoAldea(parada);
  const seco = (x, z) => !T.agua?.(x, z);
  const pendiente = (x, z) => { const h = T.altura(x, z); return Math.max(Math.abs(T.altura(x + 0.6, z) - h), Math.abs(T.altura(x, z + 0.6) - h)) / 0.6; };
  const buscar = (x0, z0) => {
    if (seco(x0, z0) && pendiente(x0, z0) < 0.7) return { x: x0, z: z0 };
    for (let r = 0.75; r <= 8; r += 0.75) for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 2 * PI + r, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
      if (seco(x, z) && pendiente(x, z) < 0.7) return { x, z };
    }
    return { x: x0, z: z0 };
  };
  const salida = [];
  for (const d of DUENDES) {
    const q = d.donde;
    let x, z, y = null, rot = 0, adentro = false;
    if (q.aldea) {
      const w = M.aMundo(q.aldea[0], q.aldea[1]);
      x = w.x; z = w.z; rot = M.ang + (q.rot || 0);
      if (q.piso && EDIFICIOS_ALDEA[q.piso]) { y = EDIFICIOS_ALDEA[q.piso].y + PISO_ALDEA_RINCONES; adentro = true; }
    } else {
      const L = q.lugar === 'salto' ? T.saltoAgua : lugares[q.lugar] || T.lugares?.[q.lugar];
      if (!L) continue;
      let bx = L.x + (q.dx || 0), bz = L.z + (q.dz || 0);
      // la cabecera del puente (o el pie del muelle, o la orilla del salto): sobre el eje, del lado que sale a la tierra
      if (q.cabecera || q.orilla) {
        const ang = Number.isFinite(L.ang) ? L.ang : 0, largo = q.cabecera ? (L.largo || 19) / 2 + 2.2 : q.lugar === 'salto' ? 4.5 : 1.5;
        const ux = Math.cos(ang), uz = Math.sin(ang);
        const a = { x: L.x + ux * largo, z: L.z + uz * largo }, b = { x: L.x - ux * largo, z: L.z - uz * largo };
        // la punta que está en seco y más cerca del refugio
        const ref = lugares.refugio || T.lugares?.refugio || { x: 0, z: 0 };
        const cands = [a, b].filter((p) => seco(p.x, p.z));
        const p = (cands.length ? cands : [a, b]).sort((m, n) => Math.hypot(m.x - ref.x, m.z - ref.z) - Math.hypot(n.x - ref.x, n.z - ref.z))[0];
        bx = p.x + uz * 1.6; bz = p.z - ux * 1.6;
      }
      const p = buscar(bx, bz);
      x = p.x; z = p.z; rot = Math.atan2(x - L.x, z - L.z);
    }
    salida.push({ id: d.id, x, z, y: Number.isFinite(y) ? y : T.altura(x, z), rot, adentro });
  }
  return salida;
}
export const duendesEncontrados = (r) => (objeto(r?.duendes) ? IDS_DUENDES.filter((id) => r.duendes[id] > 0).length : 0);
export const encontrado = (r, id) => !!(objeto(r?.duendes) && r.duendes[id] > 0);
// Anotar uno: { ok, nuevo, cuantos, todos, talla (el día en que estará la talla, si con este se completaron) }
export function encontrarDuende(r, id, dia) {
  if (!objeto(r) || !IDS_DUENDES.includes(id)) return { ok: false };
  if (!objeto(r.duendes)) r.duendes = {};
  if (r.duendes[id] > 0) return { ok: true, nuevo: false, cuantos: duendesEncontrados(r), todos: duendesEncontrados(r) === IDS_DUENDES.length };
  r.duendes[id] = diaValido(dia);
  const cuantos = duendesEncontrados(r), todos = cuantos === IDS_DUENDES.length;
  if (todos && !r.talla) r.talla = diaValido(dia) + RINCONES.tallaDias;
  return { ok: true, nuevo: true, cuantos, todos, talla: todos ? r.talla : 0 };
}
// La talla ya está en la plaza (a las 8 del día en que Tito la termina)
export const tallaEnLaPlaza = (r, dia, hora = 12) => !!r?.talla && (diaValido(dia) > r.talla || (diaValido(dia) === r.talla && num(hora) >= 8));
// Lo que dice una figurita que tenés adelante
export const textoDuende = (r, id) => {
  const d = DUENDES.find((q) => q.id === id);
  if (!d) return '';
  return encontrado(r, id) ? `${d.nombre} (ya lo anotaste)` : `Anotar ${d.nombre.charAt(0).toLowerCase()}${d.nombre.slice(1)}`;
};
// La pista del que sigue (la abuela en la charla, y el cuaderno): el primero que falta, en orden
export function pistaDuende(r) {
  const d = DUENDES.find((q) => !encontrado(r, q.id));
  return d ? d.pista : null;
}

// ---------------------------------------------------------------- el cuaderno en la biblioteca
export const puedeDejarCuaderno = (r, anotaciones) => !!r && !r.cuaderno && entero(anotaciones) >= RINCONES.cuadernoEntradas;
export function dejarCuaderno(r, anotaciones, dia) {
  if (!puedeDejarCuaderno(r, anotaciones)) return { ok: false, faltan: Math.max(0, RINCONES.cuadernoEntradas - entero(anotaciones)) };
  r.cuaderno = diaValido(dia); r.lecturas = 0;
  return { ok: true };
}
// Cada día, alguno lo lee (para lo que dice el atril y lo que te comentan): uno por día, hasta todos
export function leyeronCuaderno(r, dia) {
  if (!r?.cuaderno) return 0;
  return Math.min(30, Math.max(r.lecturas || 0, diaValido(dia) - r.cuaderno));
}
export function textoAtril(r, anotaciones, dia) {
  if (!r) return null;
  if (r.cuaderno) { const n = leyeronCuaderno(r, dia); return n ? `Tu cuaderno en el atril (lo leyeron ${n === 1 ? 'un vecino' : `${n} vecinos`})` : 'Tu cuaderno en el atril (todavía nadie lo leyó)'; }
  if (puedeDejarCuaderno(r, anotaciones)) return 'Dejar una copia de tu cuaderno en la biblioteca';
  return null;
}

// ---------------------------------------------------------------- el taller del refugio: lo que te enseñan los amigos
// Una manualidad por maestro. Te la enseña cuando es tu amigo (o compadre), en la charla: «Enseñame a …». Después la
// hacés en el banco del taller, al lado del refugio, una vez por día, con lo que gasta. Lo que da es de siempre (pan,
// dulce, un poncho, tablas, calafates secos, el filo del hacha) o un adorno para el estante del taller.
// tipo: 'material' (progreso.materiales), 'cosa' (progreso.cosas), 'entrada' (progreso.entradas), 'filo' (el hacha,
// como el servicio de Anselmo), 'adorno' (al estante).
export const MANUALIDADES = {
  pan: { maestro: 'panadera', titulo: 'Amasar pan casero', pedir: 'Enseñame a amasar el pan',
    ensena: ['Mirá: harina, agua tibia, sal y la levadura que te guardo yo. Se amasa hasta que la masa te conteste.', 'Ahora sabés. En tu taller, con una medida de harina, te salen dos panes.'],
    gasta: [{ tipo: 'cosa', k: 'harina', n: 1 }], da: [{ tipo: 'entrada', k: 'pan-casero', n: 2 }], hecho: 'Amasaste dos panes caseros' },
  dulce: { maestro: 'madre', titulo: 'Hacer dulce de frutilla', pedir: 'Enseñame a hacer el dulce',
    ensena: ['El secreto es no apurarlo: fuego bajo, cuchara de palo y paciencia. Y un chorrito de limón, si hay.', 'Con tres puñados de frutillas te sale un frasco. Lo hacés en tu taller cuando quieras.'],
    gasta: [{ tipo: 'entrada', k: 'frutilla', n: 3 }], da: [{ tipo: 'entrada', k: 'frasco-frutilla', n: 1 }], hecho: 'Hiciste un frasco de dulce de frutilla' },
  filo: { maestro: 'herrero', titulo: 'Afilar las herramientas', pedir: 'Enseñame a afilar',
    ensena: ['La piedra mojada, el ángulo parejo y nada de apurarse. El filo se hace de a poquito.', 'Con una piedra en tu banco le das filo al hacha. Ya no tenés que venir hasta acá.'],
    gasta: [{ tipo: 'material', k: 'piedra', n: 1 }], da: [{ tipo: 'filo' }], hecho: 'Afilaste el hacha: corta con un golpe menos' },
  poncho: { maestro: 'tejedora', titulo: 'Tejer un poncho', pedir: 'Enseñame a tejer en el telar chico',
    ensena: ['El telar chico se arma con cuatro palos. Urdís, cruzás, apretás. La guarda la elegís vos.', 'Con cuatro vellones te sale un poncho. Que te abrigue, que el invierno viene.'],
    gasta: [{ tipo: 'material', k: 'lana', n: 4 }], da: [{ tipo: 'cosa', k: 'poncho', n: 1 }], hecho: 'Tejiste un poncho en el telar chico' },
  tablas: { maestro: 'carpintero', titulo: 'Cepillar tablas', pedir: 'Enseñame a sacar tablas',
    ensena: ['Del tronco se sacan tres tablas, no dos, si lo marcás con hilo y lo abrís derecho.', 'Con un tronco, en tu banco, te salen tres tablas cepilladas.'],
    gasta: [{ tipo: 'material', k: 'tronco', n: 1 }], da: [{ tipo: 'material', k: 'tabla', n: 3 }], hecho: 'Cepillaste tres tablas' },
  secar: { maestro: 'herbolaria', titulo: 'Secar calafates', pedir: 'Enseñame a secar los frutos',
    ensena: ['En una zaranda, a la sombra y con aire. Nunca al sol fuerte, que se arrugan amargos.', 'Con tres puñados de calafate te queda una bolsita de secos, que dura todo el invierno.'],
    gasta: [{ tipo: 'entrada', k: 'calafate', n: 3 }], da: [{ tipo: 'entrada', k: 'calafate-seco', n: 1 }], hecho: 'Secaste una bolsita de calafates' },
  jarro: { maestro: 'ceramista', titulo: 'Hacer un jarro de barro', pedir: 'Enseñame a hacer un jarro',
    ensena: ['El barro de la orilla del arroyo, bien amasado. Lo levantás en chorizos, de abajo para arriba.', 'Hacelo en tu banco: queda en el estante, y si te sale lindo, me lo mostrás.'],
    gasta: [], da: [{ tipo: 'adorno', k: 'jarro' }], hecho: 'Hiciste un jarro de barro: quedó en el estante' },
  cuadro: { maestro: 'pintora', titulo: 'Pintar un cuadrito del valle', pedir: 'Enseñame a pintar',
    ensena: ['No pintes lo que ves: pintá lo que te dio ganas de pintarlo. Primero la luz, después las cosas.', 'Te dejo unos pinceles y una tabla. Pintá en tu taller; colgalo donde te guste.'],
    gasta: [], da: [{ tipo: 'adorno', k: 'cuadro' }], hecho: 'Pintaste un cuadrito del valle: quedó en el estante' },
};
export const ORDEN_MANUALIDADES = Object.keys(MANUALIDADES);
export const MAESTROS = Object.fromEntries(ORDEN_MANUALIDADES.map((id) => [MANUALIDADES[id].maestro, id]));
export const TOPE_ADORNOS = 6;   // los del estante que se ven (los demás quedan en el cuaderno)
// ¿Te lo enseña? `nivel`: el de la amistad ('conocido', 'amigo', 'compadre')
export function puedeAprender(r, clave, nivel) {
  const id = Object.hasOwn(MAESTROS, String(clave)) ? MAESTROS[clave] : null;
  if (!id || !r) return null;
  if (r.oficios?.[id]) return null;
  return nivel === 'amigo' || nivel === 'compadre' ? id : null;
}
export function aprender(r, id, dia) {
  if (!r || !Object.hasOwn(MANUALIDADES, String(id)) || r.oficios?.[id]) return { ok: false };
  if (!objeto(r.oficios)) r.oficios = {};
  const primera = !Object.keys(r.oficios).length;
  r.oficios[id] = diaValido(dia);
  return { ok: true, primera, renglones: [...MANUALIDADES[id].ensena] };
}
export const tallerArmado = (r) => objeto(r?.oficios) && Object.keys(r.oficios).length > 0;
// `tengo(tipo, k)`: cuánto hay. Devuelve las que se pueden hacer hoy, en orden, con lo que falta de las otras.
export function manualidadesDeHoy(r, tengo, dia) {
  const d = diaValido(dia), salida = [];
  for (const id of ORDEN_MANUALIDADES) {
    if (!r?.oficios?.[id]) continue;
    const m = MANUALIDADES[id], hecha = r.hechos?.[id]?.ultimo === d;
    const falta = m.gasta.find((g) => (Number(tengo(g.tipo, g.k)) || 0) < g.n) || null;
    salida.push({ id, titulo: m.titulo, maestro: m.maestro, hecha, falta, puede: !hecha && !falta });
  }
  return salida;
}
// Hacer una: { ok, efectos: [{ tipo, k, n }] (lo que se gasta en negativo y lo que da), texto }
export function hacerManualidad(r, id, tengo, dia) {
  const m = Object.hasOwn(MANUALIDADES, String(id)) ? MANUALIDADES[id] : null;
  if (!m || !r?.oficios?.[id]) return { ok: false, motivo: 'no la sabés' };
  const d = diaValido(dia);
  if (r.hechos?.[id]?.ultimo === d) return { ok: false, motivo: 'hoy ya' };
  const falta = m.gasta.find((g) => (Number(tengo(g.tipo, g.k)) || 0) < g.n);
  if (falta) return { ok: false, motivo: 'falta', falta };
  if (!objeto(r.hechos)) r.hechos = {};
  const h = r.hechos[id] || { n: 0, ultimo: 0 };
  r.hechos[id] = { n: h.n + 1, ultimo: d };
  return { ok: true, efectos: [...m.gasta.map((g) => ({ tipo: g.tipo, k: g.k, n: -g.n })), ...m.da.map((x) => ({ ...x }))], texto: m.hecho };
}
// Los adornos del estante, en el orden en que se hicieron (para el mundo): ['jarro', 'cuadro', 'jarro', …]
export function adornosDelEstante(r) {
  const lista = [];
  for (const id of ORDEN_MANUALIDADES) {
    const m = MANUALIDADES[id];
    if (!m.da.some((x) => x.tipo === 'adorno')) continue;
    const n = Math.min(3, r?.hechos?.[id]?.n || 0);
    for (let i = 0; i < n; i++) lista.push(m.da.find((x) => x.tipo === 'adorno').k);
  }
  return lista.slice(0, TOPE_ADORNOS);
}

// ---------------------------------------------------------------- las huertas (la comunitaria y la de los chicos)
// Cada cantero tiene su cultivo fijo. Lo siembran los vecinos (o vos, si pasás y está vacío); trabajarlo (carpir y
// regar) una vez por día le adelanta un día, como la lluvia; cuando está listo, se cosecha: en la comunitaria te llevás
// la mitad y el resto va para la mesa de todos; en la de los chicos, lo cosechan ellos y te convidan.
const grupoDe = (tipo) => (tipo === 'chicos' ? { clave: 'chicos', cultivos: CULTIVOS_CHICOS, ...RINCONES.huertaChicos } : { clave: 'huerta', cultivos: CULTIVOS_COMUNITARIA, ...RINCONES.huerta });
export function parcelaDe(r, tipo, i) {
  const g = grupoDe(tipo);
  return r?.[g.clave]?.[`c${i}`] || null;
}
// Lo que hay en el cantero (para el aviso y el mundo): { estado: 'vacio'|'creciendo'|'listo', cultivo, avance, faltan, trabajadoHoy }
export function estadoCantero(r, tipo, i, dia) {
  const g = grupoDe(tipo), p = parcelaDe(r, tipo, i), d = diaValido(dia);
  if (!p) return { estado: 'vacio', cultivo: g.cultivos[i], avance: 0, faltan: CULTIVOS[g.cultivos[i]].dias, trabajadoHoy: false };
  return { estado: lista(p, d) ? 'listo' : 'creciendo', cultivo: p.cultivo, avance: avance(p, d), faltan: diasQueFaltan(p, d), trabajadoHoy: p.trabajado === d };
}
export function textoCanteroRincon(r, tipo, i, dia) {
  const e = estadoCantero(r, tipo, i, dia), c = CULTIVOS[e.cultivo];
  const de = tipo === 'chicos' ? ` (${i === 0 ? 'de Lucía' : 'de Nahuel'})` : '';
  if (e.estado === 'vacio') return tipo === 'chicos' ? `Ayudar a sembrar ${c.nombre}${de}` : `Sembrar ${c.nombre} en la huerta de todos`;
  if (e.estado === 'listo') return tipo === 'chicos' ? `Cosechar ${c.nombre} con los chicos` : `Cosechar ${c.nombre} de la huerta de todos`;
  if (e.trabajadoHoy) return `${c.nombre.charAt(0).toUpperCase()}${c.nombre.slice(1)}${de}: ${e.faltan === 1 ? 'falta un día' : `faltan ${e.faltan} días`} (hoy ya la trabajaste)`;
  return tipo === 'chicos' ? `Regar ${c.nombre}${de} con los chicos` : `Carpir y regar ${c.nombre} en la huerta de todos`;
}
// Trabajar: { ok, que: 'sembrar'|'trabajar'|'cosechar', da: [{ tipo: 'entrada', k, n }], texto }
export function trabajarCantero(r, tipo, i, dia) {
  const g = grupoDe(tipo), d = diaValido(dia);
  if (!r || !Number.isInteger(i) || i < 0 || i >= g.canteros) return { ok: false };
  if (!objeto(r[g.clave])) r[g.clave] = {};
  const k = `c${i}`, p = r[g.clave][k], cultivo = g.cultivos[i], c = CULTIVOS[cultivo];
  if (!p) {
    r[g.clave][k] = { cultivo, dia: d, lluvia: 0, ultimaLluvia: -1, trabajado: d };
    return { ok: true, que: 'sembrar', da: [], texto: tipo === 'chicos' ? `Sembraron ${c.nombre} con los chicos` : `Sembraste ${c.nombre} en la huerta de todos` };
  }
  if (lista(p, d)) {
    delete r[g.clave][k];
    r.cosechas = (r.cosechas || 0) + 1;
    const n = tipo === 'chicos' ? Math.max(1, Math.floor(c.cosecha / 3)) : Math.max(1, Math.round(c.cosecha * RINCONES.huerta.mitad));
    return { ok: true, que: 'cosechar', da: [{ tipo: 'entrada', k: c.ingrediente, n }],
      texto: tipo === 'chicos' ? `Los chicos cosecharon ${c.nombre} y te convidaron` : `Cosechaste ${c.nombre}: la mitad para vos y el resto para la mesa de todos` };
  }
  if (p.trabajado === d) return { ok: false, motivo: 'hoy ya' };
  p.trabajado = d;
  // un día de trabajo cuenta como un día de lluvia (una vez por día; si ya llovió hoy, igual suma el trabajo)
  p.lluvia = (p.lluvia || 0) + 1;
  return { ok: true, que: 'trabajar', da: [], texto: tipo === 'chicos' ? `Regaste ${c.nombre} con los chicos: crecen más parejas` : `Carpiste y regaste ${c.nombre}: un día menos para la cosecha` };
}
// Los vecinos también la siembran: cada mañana, un cantero vacío de la comunitaria se siembra solo
export function sembrarVecinos(r, dia) {
  if (!r) return 0;
  if (!objeto(r.huerta)) r.huerta = {};
  for (let i = 0; i < RINCONES.huerta.canteros; i++) {
    const k = `c${i}`;
    if (r.huerta[k]) continue;
    r.huerta[k] = { cultivo: CULTIVOS_COMUNITARIA[i], dia: diaValido(dia), lluvia: 0, ultimaLluvia: -1, trabajado: 0 };
    return 1;
  }
  return 0;
}
export const horaDeHuerta = (tipo, hora) => { const g = grupoDe(tipo), h = num(hora); return h >= g.desde && h < g.hasta; };

// ---------------------------------------------------------------- los títeres
export const horaDeTiteres = (hora) => { const h = num(hora); return h >= RINCONES.titeres.desde && h < RINCONES.titeres.hasta; };
export const funcionHoy = (r, dia) => r?.titeres?.ultima === diaValido(dia);
export function darFuncion(r, dia, hora) {
  if (!r) return { ok: false };
  if (!horaDeTiteres(hora)) return { ok: false, motivo: 'hora' };
  if (funcionHoy(r, dia)) return { ok: false, motivo: 'hoy ya' };
  if (!objeto(r.titeres)) r.titeres = { funciones: 0, ultima: 0 };
  r.titeres.funciones++; r.titeres.ultima = diaValido(dia);
  return { ok: true, numero: r.titeres.funciones, obra: OBRAS_TITERES[(r.titeres.funciones - 1) % OBRAS_TITERES.length] };
}
// Las obras que se inventan (una por función, en rueda)
export const OBRAS_TITERES = [
  { titulo: 'El zorro que quería ser guarda del tren', renglones: ['—¡Boletos, boletos! —grita el zorro con la gorra de Ernesto.', 'El pudú no tiene boleto: tiene una frutilla. El zorro lo deja subir igual.', 'Los chicos gritan «¡atrás tuyo!» cuando aparece el duende.'] },
  { titulo: 'El pudú y la nevada grande', renglones: ['El pudú se pierde en la nieve y el duende le presta su gorro.', 'Lucía se tapa los ojos en la parte del viento.', 'Al final todos toman chocolate en la casa de té. Nahuel aplaude parado.'] },
  { titulo: 'El duende que no encontraba su lugar', renglones: ['El duende prueba vivir en el muelle, en el puente, en la biblioteca…', 'Los chicos le gritan dónde están los otros duendes. Algunos aciertan.', 'Se queda en la plaza, con todos. Aplausos y una pelota que vuela.'] },
  { titulo: 'La trucha que se escapó del almacén', renglones: ['La trucha se escapa del mostrador de Ercilia y se va nadando por la calle Norte.', 'El zorro la persigue con una red de Aurelio, y se enreda solo.', 'Lucía dice que la próxima la escribe ella.'] },
];

// ---------------------------------------------------------------- el fuerte del bosque y el campamento
export const horaDeFuerte = (hora) => { const h = num(hora); return h >= RINCONES.fuerte.desde && h < RINCONES.fuerte.hasta; };
export function textoFuerte(r, dia, hora, tengo) {
  const f = r?.fuerte || { etapa: 0, dia: 0 };
  if (f.etapa >= RINCONES.fuerte.etapas) return null;
  if (!horaDeFuerte(hora)) return null;
  const pide = RINCONES.fuerte.pide.tronco;
  if (f.dia === diaValido(dia)) return 'El fuerte: por hoy, suficiente (los chicos ya se fueron a merendar)';
  const nombres = ['Empezar el fuerte con los chicos', 'Levantar las paredes del fuerte', 'Ponerle el techo al fuerte'];
  const tengoN = Number(tengo('material', 'tronco')) || 0;
  return `${nombres[f.etapa]} (pide ${pide} troncos; tenés ${tengoN})`;
}
export function trabajarFuerte(r, dia, hora, tengo) {
  if (!r) return { ok: false };
  if (!objeto(r.fuerte)) r.fuerte = { etapa: 0, dia: 0 };
  const f = r.fuerte, d = diaValido(dia);
  if (f.etapa >= RINCONES.fuerte.etapas) return { ok: false, motivo: 'terminado' };
  if (!horaDeFuerte(hora)) return { ok: false, motivo: 'hora' };
  if (f.dia === d) return { ok: false, motivo: 'hoy ya' };
  const pide = RINCONES.fuerte.pide.tronco;
  if ((Number(tengo('material', 'tronco')) || 0) < pide) return { ok: false, motivo: 'falta', falta: { tipo: 'material', k: 'tronco', n: pide } };
  f.etapa++; f.dia = d;
  const textos = ['Clavaron los primeros palos con los chicos', 'Las paredes de ramas ya están: Nahuel quiere una ventanita', 'El fuerte tiene techo de colihue y bandera: es de los chicos'];
  return { ok: true, etapa: f.etapa, terminado: f.etapa >= RINCONES.fuerte.etapas, efectos: [{ tipo: 'material', k: 'tronco', n: -pide }], texto: textos[f.etapa - 1] };
}
export const fuerteTerminado = (r) => (r?.fuerte?.etapa || 0) >= RINCONES.fuerte.etapas;
// ¿Hay hijos para acampar? `hijos`: los de amor.js con su etapa ('bebe', 'chico', 'adolescente', 'joven')
export const hijosParaAcampar = (hijos) => (Array.isArray(hijos) ? hijos.filter((h) => h && (h.etapa === 'chico' || h.etapa === 'adolescente')) : []);
export const horaDeCampamento = (hora) => { const h = num(hora); return h >= RINCONES.campamento.desde && h < RINCONES.campamento.hasta; };
export function puedeAcampar(r, hijos, dia, hora) {
  if (!r || !hijosParaAcampar(hijos).length) return false;
  if (!horaDeCampamento(hora)) return false;
  return r.campamento?.ultimo !== diaValido(dia);
}
export function acampar(r, hijos, dia, hora) {
  if (!puedeAcampar(r, hijos, dia, hora)) return { ok: false };
  if (!objeto(r.campamento)) r.campamento = { veces: 0, ultimo: 0 };
  r.campamento.veces++; r.campamento.ultimo = diaValido(dia);
  const quienes = hijosParaAcampar(hijos).map((h) => h.nombre).filter(Boolean);
  return { ok: true, quienes, texto: quienes.length > 1 ? `Acampaste con ${quienes.slice(0, -1).join(', ')} y ${quienes.at(-1)}` : `Acampaste con ${quienes[0] || 'tu hijo'}` };
}

// ---------------------------------------------------------------- el potrero
export function anotarGol(r, dia, nuestro = true) {
  if (!r) return 0;
  if (!objeto(r.futbol)) r.futbol = { goles: 0, partidos: 0, ultimo: 0, encontra: 0 };
  if (nuestro) r.futbol.goles++; else r.futbol.encontra++;
  r.futbol.ultimo = diaValido(dia);
  return r.futbol.goles;
}
export function empezarPartido(r, dia) {
  if (!r) return 0;
  if (!objeto(r.futbol)) r.futbol = { goles: 0, partidos: 0, ultimo: 0, encontra: 0 };
  r.futbol.partidos++; r.futbol.ultimo = diaValido(dia);
  return r.futbol.partidos;
}
export const horaDePartido = (hora) => { const h = num(hora); return h >= 9 && h < 20; };
// Quiénes juegan (de los que están en la aldea y libres): los chicos primero, después los que tienen ganas
export const JUGADORES_POTRERO = ['nene', 'nena', 'andinista', 'padre', 'carpintero', 'pescador', 'fotografa', 'botera'];
export function elegirJugadores(disponibles, cuantos = 3) {
  const lista = Array.isArray(disponibles) ? disponibles : [];
  return JUGADORES_POTRERO.filter((k) => lista.includes(k)).slice(0, Math.max(0, cuantos));
}

// ---------------------------------------------------------------- la semana (para los horarios de los rincones)
export const esDiaDeSemana = (dia, i) => diaSemanaDe(dia) === i;
