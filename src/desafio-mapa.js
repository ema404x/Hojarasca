// 3.0: el mapa del Desafío que cambia con la semilla.
//
// El valle es siempre el mismo: el terreno tiene semilla fija desde la RC1 y de él
// dependen las vías, el lago y los pueblos (la huella está en verificar-2-2.mjs). Lo que
// cambia con el código de partida es lo que se pone ENCIMA: dónde arrancás tu base, de
// qué lado baja la nave, dónde está el nido, dónde hay piedra, cristal y leña de sobra,
// dónde quedaron los alijos de suministros y el tiempo de la corrida.
//
// Los lugares posibles no se buscan al jugar: se buscaron una vez sobre el terreno real
// (planos, en tierra, alcanzables caminando o nadando, lejos de las casas, las vías y el
// arroyo) y quedaron anotados acá. La prueba verificar-3-0-supervivencia.mjs los vuelve
// a medir contra el terreno generado en Node, así que si el valle cambiara, avisa.
//
// Sin código (las partidas de antes de la 3.0) el mapa es el de siempre: la base en el
// refugio y la nave, el nido y la caja al azar como antes.
//
// Módulo puro (sin THREE ni DOM). `mapaDesafio(semilla)` es lo que usan los demás (los
// puestos de avanzada de desafio-puestos.js, por ejemplo): mismo código, mismo mapa.
import { normalizarCodigo, hashTexto, generador, codigoAlAzar } from './semilla.js';
import { LIMITE } from './config.js';

// La puerta del refugio (estructuras.js la calcula igual en cada arranque) y hacia dónde
// mira el que sale. Es la base de siempre y una de las posibles con código.
export const BASE_REFUGIO = { lugar: 'refugio', x: -114.76, z: 229.63, yaw: 5.1368, nombre: 'Refugio del Arroyo' };

// Buscados sobre el terreno real (pruebas/verificar-3-0-supervivencia.mjs los revisa).
export const SITIOS = {
  // claros planos de 13 m de radio, fuera del bosque cerrado, lejos de vías y arroyo
  bases: [[238, 292], [286, -356], [-74, -404], [382, -176], [-170, -8], [-362, 148], [370, 10], [166, -278], [394, 238], [-386, -302], [-212, 382], [76, -152]],
  // al pie de una ladera empinada: piedra suelta
  canteras: [[-230, -314], [-314, 94], [-320, -8], [-374, -128], [-20, 10], [418, -152], [-380, 418], [154, 238], [280, 106], [40, -68], [418, -32], [418, -386], [-218, -158], [418, 172], [-98, -38], [-128, -140], [-272, -404], [70, 418], [-416, 310], [-110, 406], [-416, -332], [226, -416], [262, 16], [256, 418], [64, 196], [118, -20], [184, -320], [-116, -410], [-14, 370], [112, -128], [-206, 178], [-416, 82], [418, 322], [418, -254], [-182, 334], [-416, 172], [322, -380], [-14, -416], [250, -218], [-278, 238], [280, 328], [-152, -236], [-368, -416], [82, -236], [-224, 418], [160, 388], [418, 418], [316, -152]],
  // en lo abierto (la estepa, sobre todo): donde cayó algo de ellos hace mucho
  cristales: [[328, 154], [358, -32], [382, -176], [334, 304], [370, -410], [322, -332], [406, 238], [262, 394], [232, -56], [400, 100], [388, 418], [232, -320], [412, -296], [232, 298], [172, 412], [232, -410], [232, -188], [-74, -404], [-176, -2], [-296, 328], [-74, 208], [-362, 148], [-320, -296], [4, 136], [-398, -8], [16, 370], [-242, -182], [-38, -284], [-308, 76], [22, -62], [-182, 286], [-392, -236], [70, -152], [34, -374], [-122, -200], [-404, -134], [-212, 388], [-218, -416], [-62, 418], [-200, -290]],
  // en lo más cerrado del bosque: troncos caídos
  maderas: [[-380, -416], [-260, -416], [76, -416], [-308, -338], [4, -326], [94, -314], [28, -212], [118, -212], [-368, -200], [-284, -164], [-374, -62], [-284, -62], [-86, -26], [-416, 88], [-104, 88], [-416, 238], [58, 238], [-92, 274], [130, 298], [-362, 352], [-158, 388], [94, 388], [-68, -200], [-326, 232], [-92, -362], [-32, 142], [-182, -368], [40, -8], [-296, 418], [160, -20], [214, 232]],
  // cerca de los senderos: alijos que dejó la gente al irse
  alijos: [[310, 190], [298, -44], [-116, -194], [76, -152], [-206, 196], [10, 262], [-278, 76], [-332, -74], [-308, -188], [328, 76], [-110, 268], [-86, 118], [-140, -32], [-224, -404], [364, -410], [-80, -398], [64, -350], [340, 304], [376, -170], [-200, 370], [-362, 148], [-392, -380], [-68, 376], [262, 394], [-356, 322], [16, -248], [172, -272], [40, 412], [244, -416], [388, 418], [28, 64], [412, -296], [-416, -272], [406, -2], [-416, -146], [-416, 418]],
  // planos de 9 m: donde se pueden plantar ellos (puestos de avanzada y el nido)
  puestos: [[226, 292], [-74, -404], [-284, -350], [364, -32], [-92, 118], [382, -176], [-176, -2], [52, -266], [-206, -122], [-338, 178], [52, 346], [286, -356], [328, 160], [64, -392], [-194, 364], [172, -272], [-404, -188], [382, 364], [154, -86], [-398, -8], [268, 406], [-68, 376], [-356, 406], [-50, 256], [-416, -374], [34, 58], [406, -344], [-62, -212], [250, -164], [-404, 292]],
};

// Qué da cada lugar y cada cuántos días vuelve a dar. El alijo se abre una sola vez.
export const RECURSOS = {
  cantera: { nombre: 'cantera', da: { piedra: 5 }, rebrota: 2, aviso: 'Juntar piedra de la cantera', vacio: 'La cantera está pelada: vuelve a haber piedra suelta en' },
  cristal: { nombre: 'cristales', da: { cristal: 2 }, rebrota: 3, aviso: 'Arrancar los cristales', vacio: 'Ya sacaste los cristales: vuelven a asomar en' },
  madera: { nombre: 'leña caída', da: { tronco: 4 }, rebrota: 2, aviso: 'Juntar troncos caídos', vacio: 'Ya juntaste los troncos: el viento voltea más en' },
  alijo: { nombre: 'alijo', da: { tabla: 4, piedra: 2, emplastos: 1 }, rebrota: 0, aviso: 'Abrir el alijo', vacio: 'El alijo está vacío' },
};
export const RADIO_USAR = 3.4;
// Cuántos de cada uno y a qué distancia de la base (m): cerca para ir y volver de día.
export const REPARTO = {
  cantera: { cuantos: 3, desde: 45, hasta: 260 },
  cristal: { cuantos: 2, desde: 70, hasta: 300 },
  madera: { cuantos: 3, desde: 40, hasta: 240 },
  alijo: { cuantos: 3, desde: 40, hasta: 260 },
  puesto: { cuantos: 6, desde: 85, hasta: 220 },
};
export const DISTANCIA_NIDO = [260, 480];   // como desafio-nido.js: lejos, hay que ir a buscarlo
const SEPARACION = 28;                      // entre dos cosas del mapa

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const yawHacia = (desde, hacia) => Math.atan2(-(hacia.x - desde.x), -(hacia.z - desde.z));

function barajar(lista, azar) {
  const l = lista.slice();
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return l;
}
// De `pool`, `cuantos` lugares entre `desde` y `hasta` de la base, sin pisar lo ya puesto.
// Si no alcanzan, completa con los más cercanos (siempre fuera de `desde`).
function repartir(pool, base, azar, { cuantos, desde, hasta }, ocupados) {
  const sal = [];
  const libre = (p) => !ocupados.some((o) => dist(o, p) < SEPARACION);
  for (const [x, z] of barajar(pool, azar)) {
    const p = { x, z }, d = dist(p, base);
    if (d < desde || d > hasta || !libre(p)) continue;
    sal.push(p); ocupados.push(p);
    if (sal.length >= cuantos) return sal;
  }
  const resto = pool.map(([x, z]) => ({ x, z })).filter((p) => dist(p, base) >= desde && libre(p)).sort((a, b) => dist(a, base) - dist(b, base));
  for (const p of resto) { if (sal.length >= cuantos) break; sal.push(p); ocupados.push(p); }
  return sal;
}

// El mapa de un código. `opciones.base` fija la base (una partida vieja sigue en el
// refugio aunque tenga código). Sin código: la base de siempre y lo demás repartido
// con una clave fija, igual en todas las partidas viejas.
export function mapaDesafio(semilla, opciones = {}) {
  const codigo = normalizarCodigo(semilla);
  const azar = generador(hashTexto(`${codigo || 'HOJARASCA-DE-SIEMPRE'}|mapa`));
  let base;
  // la tirada de la base se hace siempre (con código): así, con la base ya fijada, lo demás
  // sale igual que el día que se armó el mapa
  const tiroBase = codigo ? azar() : 0;
  if (opciones.base && Number.isFinite(Number(opciones.base.x)) && Number.isFinite(Number(opciones.base.z))) {
    base = { ...opciones.base, x: Number(opciones.base.x), z: Number(opciones.base.z) };
  } else if (!codigo) base = { ...BASE_REFUGIO };
  else {
    const i = Math.floor(tiroBase * (SITIOS.bases.length + 1));
    if (i === 0) base = { ...BASE_REFUGIO };
    else {
      const [x, z] = SITIOS.bases[i - 1];
      // mirando hacia el medio del valle
      base = { lugar: null, x, z, yaw: yawHacia({ x, z }, { x: 0, z: 0 }), nombre: 'Tu base' };
    }
  }
  if (!Number.isFinite(base.yaw)) base.yaw = 0;
  const ocupados = [{ x: base.x, z: base.z }];
  const sitios = [];
  for (const [tipo, pool] of [['cantera', SITIOS.canteras], ['cristal', SITIOS.cristales], ['madera', SITIOS.maderas], ['alijo', SITIOS.alijos]]) {
    for (const p of repartir(pool, base, azar, REPARTO[tipo], ocupados)) sitios.push({ id: `${tipo}:${p.x},${p.z}`, tipo, x: p.x, z: p.z, nombre: RECURSOS[tipo].nombre });
  }
  // lugares para los puestos de avanzada (los usa desafio-puestos.js), sin ocupar nada
  const puestos = repartir(SITIOS.puestos, base, azar, REPARTO.puesto, ocupados.slice());
  // Con código, el nido y el lado de la nave también salen del código. Sin código, como antes: al azar.
  let nido = null, rumboNave = null, semillaClima = null;
  if (codigo) {
    const lejos = barajar(SITIOS.puestos, azar).map(([x, z]) => ({ x, z }));
    nido = lejos.find((p) => { const d = dist(p, base); return d >= DISTANCIA_NIDO[0] && d <= DISTANCIA_NIDO[1]; })
      || lejos.sort((a, b) => dist(b, base) - dist(a, base))[0];
    nido = { x: nido.x, z: nido.z };
    rumboNave = azar() * Math.PI * 2;
    semillaClima = 1 + (hashTexto(`${codigo}|clima`) % (2 ** 31 - 2));
  }
  return { semilla: codigo, base, sitios, puestos, nido, rumboNave, semillaClima };
}

// Un código al azar cuyo mapa arranca en el refugio: el de una campaña que empieza sin
// código. La campaña de siempre arranca en el refugio; el código al azar cambia lo demás
// (lugares, nave, nido, tiempo) y se puede compartir: quien lo escriba arranca igual.
export function codigoAlAzarEnElRefugio(azar = Math.random) {
  for (let i = 0; i < 400; i++) {
    const c = codigoAlAzar(azar);
    if (mapaDesafio(c).base.lugar === 'refugio') return c;
  }
  return null;
}

// De qué lado baja la nave (radianes, alrededor del jugador). Sin rumbo, como antes: una
// sola tirada, cualquier lado. Con rumbo, siempre del mismo lado del valle, ±45°.
export function anguloDeBajada(mapa, azar = Math.random) {
  const r = Number(mapa?.rumboNave);
  const t = azar();
  return Number.isFinite(r) ? r + (t - 0.5) * (Math.PI / 2) : t * Math.PI * 2;
}

// ---------------------------------------------------------------- lo que se guarda
// `d.mapa` en la partida: la base con la que arrancó y qué lugares se usaron (día).
// Una partida de antes de la 3.0 no lo tiene: la base es el refugio, como siempre.
// `deAntes`: una partida vieja que usó un lugar; sigue siendo vieja (base en el refugio,
// nave y nido al azar), sólo que ahora recuerda qué juntó.
export function mapaGuardadoNuevo(mapa, deAntes = false) {
  const b = mapa?.base || BASE_REFUGIO;
  return { base: { x: num(b.x), z: num(b.z), yaw: num(b.yaw), refugio: b.lugar === 'refugio' }, usos: {}, deAntes: !!deAntes };
}
export function sanearMapaGuardado(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const b = v.base;
  if (!b || typeof b !== 'object' || !Number.isFinite(Number(b.x)) || !Number.isFinite(Number(b.z))) return null;
  const acotar = (n) => Math.max(-LIMITE, Math.min(LIMITE, Number(n)));
  const usos = {};
  const u = v.usos && typeof v.usos === 'object' && !Array.isArray(v.usos) ? v.usos : {};
  for (const [k, dia] of Object.entries(u).slice(0, 64)) {
    if (!/^(cantera|cristal|madera|alijo):-?\d+,-?\d+$/.test(k) || !Number.isFinite(Number(dia))) continue;
    usos[k] = Math.floor(Number(dia));
  }
  return { base: { x: acotar(b.x), z: acotar(b.z), yaw: num(b.yaw), refugio: !!b.refugio }, usos, deAntes: !!v.deAntes };
}
// El mapa de una partida: el del código, alrededor de la base con la que arrancó.
// Una partida de antes de la 3.0 (sin `d.mapa`) sigue en el refugio, y la nave y el nido
// siguen al azar como siempre: sólo se le suman los lugares de recursos alrededor.
export function mapaDePartida(d) {
  const g = d?.mapa;
  if (!g || g.deAntes) return { ...mapaDesafio(d?.semilla, { base: BASE_REFUGIO }), nido: null, rumboNave: null, semillaClima: null };
  return mapaDesafio(d?.semilla, { base: g.base.refugio ? BASE_REFUGIO : g.base });
}

// ---------------------------------------------------------------- usar un lugar
// ¿Se puede usar hoy? Devuelve cuántos días faltan (0 = ya).
export function faltaPara(usos, sitio, dia) {
  const r = RECURSOS[sitio?.tipo];
  if (!r) return Infinity;
  const usado = usos?.[sitio.id];
  if (!Number.isFinite(usado)) return 0;
  if (!r.rebrota) return Infinity;
  return Math.max(0, usado + r.rebrota - Math.floor(num(dia, 0)));
}
export function usarSitio(usos, sitio, dia) {
  const falta = faltaPara(usos, sitio, dia);
  if (falta > 0) return { ok: false, falta };
  usos[sitio.id] = Math.floor(num(dia, 0));
  return { ok: true, da: { ...RECURSOS[sitio.tipo].da } };
}
export function avisoSitio(usos, sitio, dia) {
  const r = RECURSOS[sitio?.tipo];
  if (!r) return null;
  const falta = faltaPara(usos, sitio, dia);
  if (!falta) return r.aviso;
  return falta === Infinity ? r.vacio : `${r.vacio} ${falta} ${falta === 1 ? 'día' : 'días'}`;
}

// Para el mapa de papel: la base y los lugares, con su clase (mapa.js les pone un dibujo).
export function marcasDelMapa(mapa, usos = {}, dia = 0) {
  if (!mapa) return [];
  const marcas = [];
  if (mapa.base && mapa.base.lugar !== 'refugio') marcas.push({ x: mapa.base.x, z: mapa.base.z, nombre: 'tu base', clase: 'base' });
  for (const s of mapa.sitios || []) {
    if (s.tipo === 'alijo' && faltaPara(usos, s, dia) === Infinity) continue;   // el alijo abierto ya no se marca
    marcas.push({ x: s.x, z: s.z, nombre: s.nombre, clase: s.tipo });
  }
  return marcas;
}
