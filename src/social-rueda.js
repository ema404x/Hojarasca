// 3.7.4: la rueda de interacciones (tipo Los Sims), la parte que piensa: sin three ni DOM (se prueba en Node).
// Al hablarle a un vecino, la charla de siempre (vecindad-juego.js: los temas, regalar, invitar, dar una mano, el
// servicio del poblador, lo del lugar, lo del amor de la 3.7.1, la granja y la cocina) y las interacciones nuevas
// (vecindad-social.js: amistosas, picantes, románticas y juntos) se juntan en una rueda de dos niveles:
//   · primero las categorías, alrededor de la cabeza: Charlar, Amistosas, Picantes, Románticas, Juntos, Lo suyo y Chau;
//   · al elegir una, la segunda rueda con sus opciones (ícono y nombre; las que no se pueden, en gris con su motivo).
// Un submenú de siempre (Regalar…, Dar una mano…, lo del amor) es una sola rueda, con «Mejor no» para volver.
// La opción de siempre se sigue eligiendo por su lugar en la lista de vecindad-juego (`plano`): así lo de siempre anda
// igual que antes; lo social, por su id (`social`).
import { hayIcono } from './social-iconos.js';

// ---------------------------------------------------------------- las categorías
// (las de vecindad-social.js: CATEGORIAS_RUEDA; éstas, por si sus reglas no dan nada: el que no es un vecino)
export const CATEGORIAS_VISTA = {
  charla: { nombre: 'Charlar', icono: 'charla' },
  amistosa: { nombre: 'Amistosas', icono: 'abrazo' },
  graciosa: { nombre: 'Graciosas', icono: 'chiste' },
  juntos: { nombre: 'Juntos', icono: 'mate' },
  hacer: { nombre: 'Hacer juntos', icono: 'herramienta' },   // 3.8.4
  ayuda: { nombre: 'Regalar y ayudar', icono: 'regalo' },
  romantica: { nombre: 'Románticas', icono: 'corazon' },
  picante: { nombre: 'Picantes', icono: 'rayo' },
  chau: { nombre: 'Nada más, chau', icono: 'chau' },
};
export const ORDEN_CATEGORIAS = ['charla', 'amistosa', 'graciosa', 'juntos', 'hacer', 'ayuda', 'romantica', 'picante'];

// La categoría de una opción de siempre (por su id en vecindad-juego.js, amor-juego.js, granja-juego.js, cocina-juego.js)
export function categoriaDeOpcion(id) {
  const s = String(id || '');
  if (s === 'chau') return 'chau';
  if (s === 'contame' || s === 'como-andas' || s === 'novedades' || s === 'historia') return 'charla';
  if (s === 'invitar') return 'juntos';
  if (/^rincones:/.test(s)) return 'hacer';   // 3.8.4: lo de los rincones (aprender una manualidad, el sulky, la pista de los duendes)
  if (/^amor(?:-|:|$)/.test(s)) return 'romantica';
  return 'ayuda';   // el servicio, regalar, dar una mano, lo del lugar, la granja, la cocina
}
// El menú de siempre, con la categoría de cada opción (lo que opcionesRueda recibe en ctx.menu)
export const menuParaRueda = (menu) => (Array.isArray(menu?.opciones) ? menu.opciones.map((o) => ({ id: o.id, titulo: o.titulo, categoria: categoriaDeOpcion(o.id) })) : []);
// El ícono de una opción de siempre
const ICONO_OPCION = {
  servicio: 'herramienta', contame: 'libro', 'como-andas': 'sonrisa', novedades: 'diario', historia: 'libro', regalar: 'regalo', invitar: 'mate',
  ayudar: 'mano', chau: 'chau', volver: 'volver', __lugar: 'puerta', amor: 'corazon', 'amor-cita': 'flor', 'amor-casa': 'casa', 'amor-correo': 'carta',
  'invitar:mate': 'mate', 'invitar:te': 'taza',
};
const ICONO_COSA = [
  [/yerba|mate/, 'mate'], [/trucha|pez|pejerrey|perca/, 'pez'], [/pan|harina|empanada/, 'canasta'], [/miel|dulce|frasco/, 'olla'], [/lana|vell/, 'oveja'],
  [/tronco|tabla|le[ñn]a/, 'arbol'], [/piedra|canto/, 'montana'], [/pluma/, 'hoja'], [/semilla|pi[ñn]/, 'semilla'], [/calafate|fruta/, 'hoja'], [/flor|ramo/, 'flor'],
];
export function iconoDeOpcion(id, titulo = '') {
  const s = String(id || '');
  if (Object.hasOwn(ICONO_OPCION, s)) return ICONO_OPCION[s];
  const t = String(titulo || '').toLowerCase();
  if (/^regalar:/.test(s) || /^ayudar:/.test(s)) { for (const [re, ic] of ICONO_COSA) if (re.test(t) || re.test(s)) return ic; return /^regalar:/.test(s) ? 'regalo' : 'mano'; }
  if (/^amor/.test(s)) {
    if (/anillo|proponer|casar/.test(s + t)) return 'anillo';
    if (/flores|ramo|piropo|mimo/.test(s + t)) return 'flor';
    if (/carta|correo/.test(s + t)) return 'carta';
    if (/chicos|buscar|hijo/.test(s + t)) return 'bebe';
    if (/convivir|casa|refugio|suya/.test(s + t)) return 'casa';
    if (/cita/.test(s + t)) return 'taza';
    return 'corazon';
  }
  if (/^granja/.test(s)) return 'vaca';
  if (/^cocina/.test(s)) return 'olla';
  if (/^invitar/.test(s)) return 'mate';
  return 'pregunta';
}

// Las categorías de vecindad-social.js (un arreglo de { id, nombre, icono }, de ids o un objeto id → datos)
export function normalizarCategorias(cats) {
  const m = new Map();
  const poner = (id, d) => { if (typeof id === 'string' && id) m.set(id, { nombre: d?.nombre || CATEGORIAS_VISTA[id]?.nombre || id, icono: hayIcono(d?.icono) ? d.icono : CATEGORIAS_VISTA[id]?.icono || 'estrella' }); };
  if (Array.isArray(cats)) for (const c of cats) { if (typeof c === 'string') poner(c, null); else if (c && typeof c === 'object') poner(c.id || c.categoria, c); }
  else if (cats && typeof cats === 'object') for (const [id, d] of Object.entries(cats)) poner(id, d && typeof d === 'object' ? d : { nombre: d });
  return m;
}

// ---------------------------------------------------------------- armar la rueda
// `menu`: el de la charla ({ tipo, texto, opciones: [{ id, titulo }], i }, con lo del lugar ya puesto);
// `social`: lo que devuelve opcionesRueda (o null); `cats`: CATEGORIAS_RUEDA.
// Devuelve { tipo: 'categorias', categorias: [{ id, nombre, icono, opciones: [opción] }] } o, en un submenú,
// { tipo: 'lista', opciones: [opción] }. Cada opción: { titulo, icono, disponible, motivo, plano (índice) | social (id) }.
export function armarRueda(menu, social = null, cats = null) {
  const opciones = Array.isArray(menu?.opciones) ? menu.opciones : [];
  const deSiempre = (o, i, icono = null, disponible = true) => ({ titulo: String(o.titulo || ''), icono: hayIcono(icono) ? icono : iconoDeOpcion(o.id, o.titulo), disponible, motivo: disponible ? null : 'Ahora no', plano: i, social: null, id: o.id });
  if (menu?.tipo && menu.tipo !== 'charla') return { tipo: 'lista', opciones: opciones.map((o, i) => deSiempre(o, i)) };
  const vista = normalizarCategorias(cats);
  const porCat = new Map(), nombres = new Map(), puestas = new Set();
  const agregar = (cat, op) => { if (!porCat.has(cat)) porCat.set(cat, []); porCat.get(cat).push(op); };
  // lo que dicen las reglas (vecindad-social.js): las de siempre (de: 'charla', por su lugar en el menú) y las nuevas
  for (const grupo of Array.isArray(social) ? social : []) {
    const cat = typeof grupo?.categoria === 'string' ? grupo.categoria : null;
    if (!cat) continue;
    if (grupo.nombre) nombres.set(cat, { nombre: String(grupo.nombre), icono: grupo.icono });
    for (const o of Array.isArray(grupo.opciones) ? grupo.opciones : []) {
      if (!o || typeof o.id !== 'string') continue;
      if (o.de === 'charla') {
        const i = opciones.findIndex((x, k) => x.id === o.id && !puestas.has(k));
        if (i < 0) continue;
        puestas.add(i);
        agregar(cat, { ...deSiempre(opciones[i], i, o.icono, o.disponible !== false), titulo: String(opciones[i].titulo || o.nombre || '') });
      } else {
        agregar(cat, { titulo: String(o.nombre || o.id), icono: hayIcono(o.icono) ? o.icono : 'estrella', disponible: o.disponible !== false, motivo: o.disponible === false ? String(o.motivo || 'Ahora no') : null, plano: null, social: o.id, id: o.id });
      }
    }
  }
  // lo de siempre que no vino (o todo, si las reglas no dieron nada) y «chau», abajo de todo
  let chau = null;
  opciones.forEach((o, i) => {
    if (puestas.has(i) || o.id === 'volver') return;
    const cat = categoriaDeOpcion(o.id);
    if (cat === 'chau') { chau = deSiempre(o, i); return; }
    agregar(cat, deSiempre(o, i));
  });
  const orden = [...(Array.isArray(social) ? social.map((g) => g?.categoria).filter((k) => typeof k === 'string') : []), ...ORDEN_CATEGORIAS, ...porCat.keys()];
  const categorias = [];
  for (const id of new Set(orden)) {
    const ops = porCat.get(id);
    if (!ops || !ops.length) continue;
    const v = nombres.get(id) || vista.get(id) || CATEGORIAS_VISTA[id] || { nombre: id, icono: 'estrella' };
    categorias.push({ id, nombre: v.nombre, icono: hayIcono(v.icono) ? v.icono : CATEGORIAS_VISTA[id]?.icono || 'estrella', opciones: ops, disponible: ops.some((o) => o.disponible) });
  }
  if (chau) categorias.push({ id: 'chau', nombre: chau.titulo, icono: 'chau', opciones: [], directa: chau, disponible: true });
  return { tipo: 'categorias', categorias };
}

// Lo que se ve en el anillo: [{ titulo, icono, disponible, motivo, categoria? , opcion? }]
export function anillo(rueda, nivel = 1, cat = null) {
  if (!rueda) return [];
  if (rueda.tipo === 'lista') return rueda.opciones.map((o) => ({ ...o, opcion: o }));
  if (nivel >= 2) {
    const c = rueda.categorias.find((x) => x.id === cat);
    return c ? c.opciones.map((o) => ({ ...o, opcion: o })) : [];
  }
  return rueda.categorias.map((c) => (c.directa ? { titulo: c.nombre, icono: c.icono, disponible: true, motivo: null, opcion: c.directa, categoria: null } : { titulo: c.nombre, icono: c.icono, disponible: c.disponible, motivo: c.disponible ? null : 'Ahora no se puede nada', categoria: c.id }));
}
// Dónde arranca la marca: en la categoría de la primera opción de siempre (el servicio del poblador o la historia que
// tiene sin contar, como antes); `alFinal`, en «chau» (E de seguido termina la charla, como antes); `volverA`, en esa
// categoría (después de una interacción, para hacer otra del mismo tipo).
export function marcaInicial(rueda, { alFinal = false, volverA = null, primera = 0 } = {}) {
  if (!rueda) return 0;
  if (rueda.tipo === 'lista') return Math.max(0, Math.min(rueda.opciones.length - 1, primera));
  const cs = rueda.categorias;
  if (volverA) { const k = cs.findIndex((c) => c.id === volverA); if (k >= 0) return k; }
  if (alFinal) { const k = cs.findIndex((c) => c.id === 'chau'); if (k >= 0) return k; }
  const k = cs.findIndex((c) => c.opciones.some((o) => o.plano === primera));
  return k >= 0 ? k : 0;
}

// ---------------------------------------------------------------- la geometría
// Los sectores alrededor del centro: el primero arriba y en el sentido del reloj (y hacia abajo, en pantalla)
export function posiciones(n, radio = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
    out.push({ x: Math.cos(a) * radio, y: Math.sin(a) * radio, ang: a });
  }
  return out;
}
// El sector hacia donde apunta (dx, dy) (en pantalla: y hacia abajo); -1 si está en el centro
export function sectorDeDireccion(dx, dy, n, zona = 0.35) {
  const m = Math.hypot(dx, dy);
  if (!(n > 0) || !(m > zona)) return -1;
  let a = Math.atan2(dy, dx) + Math.PI / 2;   // 0 arriba
  a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.round(a / (Math.PI * 2 / n)) % n;
}
// Las flechas: arriba y abajo, izquierda y derecha, al sector más cercano en esa dirección (con dos o tres sectores,
// el siguiente o el anterior)
export function sectorConFlecha(i, n, dir) {
  if (!(n > 0)) return 0;
  const p = posiciones(n);
  const v = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] }[dir];
  if (!v) return i;
  const actual = p[i] || { x: 0, y: 0 };
  let mejor = i, puntaje = -Infinity;
  for (let k = 0; k < n; k++) {
    if (k === i) continue;
    const dx = p[k].x - actual.x, dy = p[k].y - actual.y, d = Math.hypot(dx, dy) || 1;
    const alin = (dx * v[0] + dy * v[1]) / d;
    if (alin < 0.2) continue;
    const s = alin * 2 - d * 0.6;
    if (s > puntaje) { puntaje = s; mejor = k; }
  }
  if (mejor === i && n > 1) return (i + (dir === 'derecha' || dir === 'abajo' ? 1 : -1) + n) % n;
  return mejor;
}
// El puntero virtual (el mouse bloqueado o el palito): se acumula y se acota al círculo
export function moverPuntero(p, dx, dy, radio = 120) {
  let x = (Number(p?.x) || 0) + (Number(dx) || 0), y = (Number(p?.y) || 0) + (Number(dy) || 0);
  const m = Math.hypot(x, y);
  if (m > radio) { x *= radio / m; y *= radio / m; }
  return { x, y };
}

// ---------------------------------------------------------------- lo que se ve arriba de las cabezas
// Un renglón corto para debajo de la burbuja: la primera frase, cortada en una palabra
export function renglonCorto(texto, max = 44) {
  let t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const fin = t.search(/[.!?…](\s|$)/);
  if (fin > 0 && fin + 1 <= max) return t.slice(0, fin + 1);
  if (t.length <= max) return t;
  const corte = t.lastIndexOf(' ', max - 1);
  return `${t.slice(0, corte > 12 ? corte : max - 1).replace(/[,;:]$/, '')}…`;
}
// El ícono del tema: por lo que dice (el pez, el tren, la lluvia, el corazón, el mate…) o por el tema de la charla
const PALABRAS = [
  [/\b(pesc|trucha|pez|peces|pejerrey|ca[ñn]a)/i, 'pez'], [/\b(tren|trochita|vag[oó]n|locomotora|and[eé]n|estaci[oó]n)/i, 'tren'],
  [/\b(lluvi|llueve|llover|chaparr[oó]n|tormenta)/i, 'lluvia'], [/\b(nieve|nieva|nevad|helad)/i, 'nieve'], [/\b(sol|calor|lindo d[ií]a)\b/i, 'sol'],
  [/\b(viento|nublad|nubes?)\b/i, 'nube'], [/\b(mate|yerba|cebar|cebo)/i, 'mate'], [/\b(t[eé]|caf[eé])\b/i, 'taza'],
  [/\b(amor|quiero|novi[oa]|beso|coraz[oó]n|enamor)/i, 'corazon'], [/\b(oveja|esquila|lana|corral)/i, 'oveja'], [/\b(vaca|chancha|gallina|granja)/i, 'vaca'],
  [/\b(libro|leer|biblioteca|cuento)/i, 'libro'], [/\b(radio)\b/i, 'radio'], [/\b(bosque|[aá]rbol|coihue|lenga|ciprés|le[ñn]a|hacha)/i, 'arbol'],
  [/\b(luna|estrella|cielo|noche)\b/i, 'luna'], [/\b(m[uú]sica|guitarra|baile|bailar|canci[oó]n)/i, 'nota'], [/\b(carta|correo|telegrama)/i, 'carta'],
  [/\b(cocin|olla|guiso|pan|empanada|torta|horno)/i, 'olla'], [/\b(foto|c[aá]mara)\b/i, 'foto'], [/\b(cartas|truco|envido)\b/i, 'cartas'],
  [/\b(obra|casa|techo|pared|construir|carpinter)/i, 'casa'], [/\b(cerro|monta[ñn]a|loma)/i, 'montana'], [/\b(chicos|beb[eé]|hij[oa]s?)\b/i, 'bebe'],
  [/[¡!]\s*ja|\bja,? ja/i, 'risa'],
];
const ICONO_TEMA = {
  oficio: 'herramienta', leyenda: 'luna', tren: 'tren', historia: 'libro', estacion: 'hoja', clima: 'nube', naturaleza: 'arbol', te: 'taza', radio: 'radio',
  obra: 'casa', biblioteca: 'libro', familia: 'casa', cielo: 'estrella', almacen: 'canasta', pareja: 'corazon', loma: 'montana', chisme: 'charla',
};
export function iconoDeTexto(texto, tema = null) {
  const t = String(texto || '');
  for (const [re, ic] of PALABRAS) if (re.test(t)) return ic;
  if (tema && Object.hasOwn(ICONO_TEMA, tema)) return ICONO_TEMA[tema];
  return 'charla';
}
// La emoción (de humorDe o de una reacción) como ícono chico
const ICONO_EMOCION = { contento: 'contento', feliz: 'contento', alegre: 'contento', enojado: 'enojado', enojada: 'enojado', cansado: 'cansado', cansada: 'cansado', enamorado: 'enamorado', enamorada: 'enamorado', triste: 'triste', timido: 'timido', tímido: 'timido', avergonzado: 'timido', sorprendido: 'exclamacion' };
export function iconoDeEmocion(e) {
  const k = String(e || '').toLowerCase();
  return Object.hasOwn(ICONO_EMOCION, k) ? ICONO_EMOCION[k] : hayIcono(k) ? k : null;
}
export const PALABRA_EMOCION = { contento: 'Contento', enojado: 'Enojado', cansado: 'Cansado', enamorado: 'Enamorado', triste: 'Triste', timido: 'Con vergüenza', exclamacion: 'Sorprendido',
  // 3.8.3: las que faltaban (el humor de casi todos los días, «tranquilo», salía con minúscula, tal cual el id)
  tranquilo: 'Tranquilo', risa: 'Divertido', sorpresa: 'Sorprendido', verguenza: 'Con vergüenza', confundido: 'Confundido' };
// Las burbujas de entreVecinos: un ícono para cada uno ([a, b], { a, b } o [{ quien, icono }])
export function burbujasDe(b) {
  if (!b) return [null, null];
  const ic = (x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? x.icono || x.burbuja || null : null);
  if (Array.isArray(b)) {
    if (b.length && b.every((x) => x && typeof x === 'object' && 'quien' in x)) {
      const a = b.find((x) => x.quien === 'a' || x.quien === 0), c = b.find((x) => x.quien === 'b' || x.quien === 1);
      return [ic(a), ic(c)];
    }
    return [ic(b[0]), ic(b[1])];
  }
  if (typeof b === 'object') return [ic(b.a), ic(b.b)];
  return [ic(b), null];
}
// relacionDe, saneada: números de 0 a 100, las marcas de los niveles (amigo, compadre) y si la barra del romance se muestra
export function relacionVista(r) {
  const n = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const amistad = n(r?.amistad), romance = n(r?.romance);
  const marcas = { amigo: n(r?.marcas?.amigo ?? 25), compadre: n(r?.marcas?.compadre ?? 70) };
  const romanceVisible = typeof r?.romanceVisible === 'boolean' ? r.romanceVisible : romance > 0 || !!r?.nivelRomance;
  return { amistad, romance, nivel: r?.nivel ? String(r.nivel) : '', nivelRomance: r?.nivelRomance ? String(r.nivelRomance) : '', marcas, romanceVisible };
}
