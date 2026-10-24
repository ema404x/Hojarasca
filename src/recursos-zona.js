// 4.6 recursos: los recursos de zona del paquete 1a del mapa (PLAN_MAPA_VALOR.md, «Decisiones tras la auditoría»).
//
// Cada zona da algo que las otras no dan, y vuelve a darlo (el valle ya no se agota):
//   · la VETA de la cantera del suroeste (−405, −305): 6 piedras de cantera cada 2 días, sólo con el pico de cantero;
//   · el JUNCAL del mallín, junto al puente de troncos: 3 juncos por día, con la hoz de junco;
//   · las HIERBAS del mallín, al lado: 2 atados por día, con la misma hoz;
//   · la BARRANCA DE ARCILLA de la desembocadura del arroyo: 4 terrones cada 2 días, con la pala de arcilla;
//   · los 8 PEHUENES del mirador: 6 piñones cada uno, una vez por otoño (no se suman árboles: hay prueba del bosque).
// La lana sigue saliendo de la esquila y el cuero lo da el pastor (eso es de la gente del valle): acá sólo el material.
//
// El molde es el de la cantera del Desafío (desafio-mapa.js): un punto fijo que «da N cada D días». Lo que se usó se
// guarda en `progreso.recursosZona` = { usos: { id: díaEnQueSeUsó }, pehuenes: { 'x,z': añoEnQueSeJuntó } }.
// Una partida vieja no lo trae: arranca con todo disponible.
//
// Las herramientas de zona (hoz de junco, pala de arcilla, cuchillo de cuero y pico de cantero) viven en
// `progreso.cosas` como el hacha o la tijera. Las dan o las venden los personajes de cada zona: `venderHerramienta` y
// `darHerramienta` son lo que llaman (ver HERRAMIENTAS_ZONA).
//
// Módulo puro (sin three ni DOM): se prueba en Node. Lo visual y la tecla E están en recursos-zona-mundo.js.
import { pagar, hayEconomia, pesosDe, formatoPesos } from './economia.js';
import { nivelOficio, tituloDe } from './oficios.js';

// ---------------------------------------------------------------- los materiales nuevos
// (los nombres para las notas están también en MATERIALES de construccion.js, como los de siempre)
export const MATERIALES_ZONA = {
  junco: { nombre: 'juncos', uno: 'junco', corto: 'Junco', mochila: 'Juncos', texto: 'Del mallín. Para canastos, esteras y techos de quincho.' },
  hierbas: { nombre: 'atados de hierbas', uno: 'atado de hierbas', corto: 'Hierbas', mochila: 'Hierbas del mallín', texto: 'Menta de campo, poleo y llantén del mallín. Para tés, emplastos y la herbolaria.' },
  arcilla: { nombre: 'terrones de arcilla', uno: 'terrón de arcilla', corto: 'Arcilla', mochila: 'Arcilla', texto: 'De la barranca de la desembocadura. Para la ceramista, los hornos y el revoque.' },
  cuero: { nombre: 'cueros', uno: 'cuero', corto: 'Cuero', mochila: 'Cueros', texto: 'Del pastor de la estepa. Para riendas, botas, tientos y aperos.' },
  'piedra-cantera': { nombre: 'piedras de cantera', uno: 'piedra de cantera', corto: 'Piedra de cantera', mochila: 'Piedra de cantera', texto: 'Labrada en la veta del suroeste: pareja y sana. Vale más que la piedra suelta.' },
};
export const IDS_MATERIALES_ZONA = Object.keys(MATERIALES_ZONA);
export const esMaterialZona = (k) => typeof k === 'string' && Object.hasOwn(MATERIALES_ZONA, k);
// la anotación del cuaderno de cada material (cuaderno.js)
export const entradaDeMaterial = (k) => `${k}-mat`;

// ---------------------------------------------------------------- las herramientas de zona
// `precio`: en pesos, lo que cobra quien la vende (la puede dar gratis con `darHerramienta`).
// `requisito`: el oficio y el nivel que hace falta para que te la vendan (o null).
// `quien` y `zona`: sólo para los textos (lo decide la gente de cada zona). `icono`: el dibujo de la mochila (ICONOS_ZONA).
// El pico de cantero pide picapedrero 3, «Picapedrero de cantera» (ver oficios.js): unas 30 rocas picadas con el pico común (260 de experiencia).
export const HERRAMIENTAS_ZONA = {
  'hoz-junco': {
    id: 'hoz-junco', nombre: 'Hoz de junco', icono: 'hoz', precio: 900, requisito: null, zona: 'mallín', quien: 'la gente del mallín',
    texto: 'Hoja curva y corta, con cabo de maitén. Corta el junco al ras sin arrancarlo, así vuelve a salir.',
    efecto: 'Con ella se corta el junco y las hierbas del mallín, junto al puente de troncos (E).',
  },
  'pala-arcilla': {
    id: 'pala-arcilla', nombre: 'Pala de arcilla', icono: 'palaArcilla', precio: 1100, requisito: null, zona: 'costa', quien: 'la gente de la costa',
    texto: 'Pala angosta y recta, de las que usan los ladrilleros: saca la arcilla en panes sin mezclarla con la arena.',
    efecto: 'Con ella se saca arcilla de la barranca de la desembocadura del arroyo, en la orilla del lago (E).',
  },
  'cuchillo-cuero': {
    id: 'cuchillo-cuero', nombre: 'Cuchillo de cuero', icono: 'cuchilloCuero', precio: 1000, requisito: null, zona: 'estepa', quien: 'el pastor de la estepa',
    texto: 'Hoja ancha y vaina de suela, como los de los puesteros. Sirve para cuerear y cortar tientos.',
    efecto: 'Con él en la mochila, cada cuero que le comprás al pastor de la estepa te rinde uno más: cuereás el recorte vos.',
  },
  'pico-cantero': {
    id: 'pico-cantero', nombre: 'Pico de cantero', icono: 'picoCantero', precio: 4000, requisito: { oficio: 'picapedrero', nivel: 3 }, zona: 'cantera', quien: 'el cantero',
    texto: 'Más pesado que el pico común, con una punta y un cincel templados. Es el único que labra la veta de la cantera.',
    efecto: 'Con él se labra la veta de la cantera del suroeste (E): da piedra de cantera y vuelve a dar cada dos días.',
  },
};
export const IDS_HERRAMIENTAS_ZONA = Object.keys(HERRAMIENTAS_ZONA);
export const esHerramientaZona = (id) => typeof id === 'string' && Object.hasOwn(HERRAMIENTAS_ZONA, id);
export const tieneHerramienta = (progreso, id) => Number(progreso?.cosas?.[id]) > 0;

// El nivel del oficio que se usa para el requisito: el que se pasa (main.js suma lo que te enseñó tu esposa) o el de la partida.
const nivelPara = (progreso, req, nivel) => (Number.isFinite(Number(nivel)) ? Math.floor(Number(nivel)) : nivelOficio(progreso?.oficios, req.oficio));

// ¿Te la pueden vender? { ok, motivo, texto, precio, falta }. motivo: 'no-existe' | 'desafio' | 'ya-la-tenes' | 'oficio' | 'plata'.
// `nivel`: el nivel del oficio que pide (si no se pasa, se lee de progreso.oficios). `precio`: para cobrar otro precio (una rebaja).
export function puedeComprarHerramienta(progreso, id, { nivel, precio } = {}) {
  if (!esHerramientaZona(id)) return { ok: false, motivo: 'no-existe', texto: 'No existe esa herramienta' };
  const h = HERRAMIENTAS_ZONA[id];
  const cuesta = Number.isFinite(Number(precio)) ? Math.max(0, Math.floor(Number(precio))) : h.precio;
  if (!progreso || progreso.modo === 'desafio') return { ok: false, motivo: 'desafio', texto: 'En La noche de los duendes no se vende', precio: cuesta };
  if (tieneHerramienta(progreso, id)) return { ok: false, motivo: 'ya-la-tenes', texto: `Ya tenés ${h.nombre.toLowerCase()}`, precio: cuesta };
  if (h.requisito) {
    const n = nivelPara(progreso, h.requisito, nivel);
    if (n < h.requisito.nivel) {
      return { ok: false, motivo: 'oficio', precio: cuesta, nivel: n, pide: h.requisito.nivel,
        texto: `Hace falta ser ${tituloDe(h.requisito.oficio, h.requisito.nivel).toLowerCase()} (nivel ${h.requisito.nivel}; vas por el ${n})` };
    }
  }
  if (cuesta > 0 && (!hayEconomia(progreso) || pesosDe(progreso) < cuesta)) {
    const falta = cuesta - pesosDe(progreso);
    return { ok: false, motivo: 'plata', precio: cuesta, falta, texto: `Cuesta ${formatoPesos(cuesta)}; te faltan ${formatoPesos(falta)}` };
  }
  return { ok: true, motivo: '', precio: cuesta, texto: cuesta > 0 ? `${h.nombre}: ${formatoPesos(cuesta)}` : h.nombre };
}

// Te la dan (de regalo, o después de cobrar). No pide oficio ni plata: eso lo mira quien la da. { ok, nueva, id, nombre }
export function darHerramienta(progreso, id) {
  if (!esHerramientaZona(id) || !progreso || progreso.modo === 'desafio') return { ok: false, nueva: false, id, nombre: '' };
  progreso.cosas = progreso.cosas && typeof progreso.cosas === 'object' ? progreso.cosas : {};
  const nueva = !tieneHerramienta(progreso, id);
  progreso.cosas[id] = 1;
  return { ok: true, nueva, id, nombre: HERRAMIENTAS_ZONA[id].nombre };
}

// Te la venden: mira el oficio y la plata, cobra (queda en el libro de pesos) y te la da.
// { ok, motivo, texto, precio, saldo }. `quien`: a quién le pagaste (para el libro).
export function venderHerramienta(progreso, id, { nivel, precio, quien = '' } = {}) {
  const v = puedeComprarHerramienta(progreso, id, { nivel, precio });
  if (!v.ok) return v;
  const h = HERRAMIENTAS_ZONA[id];
  if (v.precio > 0) {
    const r = pagar(progreso, v.precio, `Compra: ${h.nombre.toLowerCase()}`, quien || h.quien);
    if (!r.ok) return { ok: false, motivo: 'plata', precio: v.precio, falta: r.faltan, texto: `Cuesta ${formatoPesos(v.precio)}; te faltan ${formatoPesos(r.faltan)}` };
  }
  darHerramienta(progreso, id);
  return { ok: true, motivo: '', precio: v.precio, saldo: pesosDe(progreso), texto: `Compraste ${h.nombre.toLowerCase()}${v.precio > 0 ? ` por ${formatoPesos(v.precio)}` : ''}` };
}

// ---------------------------------------------------------------- los puntos que se reponen
// Coordenadas fijas (no dependen de la calidad gráfica). `radio`: a cuánto del punto se usa con E.
// `cada`: cada cuántos días vuelve a dar (usado el día d, vuelve el día d + cada).
// La arcilla va en (52, 45) y no en (66, 44) como decía la auditoría: ese punto es agua del lago (altura −3,6); la barranca
// seca más cercana a la boca del arroyo está 14 m al oeste, sobre la orilla norte.
export const PUNTOS_ZONA = [
  { id: 'cantera', nombre: 'Veta de la cantera', x: -405, z: -305, radio: 4.6, da: { 'piedra-cantera': 6 }, cada: 2, herramienta: 'pico-cantero', golpes: 3,
    verbo: 'Labrar la veta', vacio: 'La veta está labrada: vuelve a dar piedra en', sinHerramienta: 'La veta se labra con el pico de cantero (lo vende el cantero)' },
  { id: 'juncal', nombre: 'Juncal del mallín', x: -265, z: -239, radio: 3.4, da: { junco: 3 }, cada: 1, herramienta: 'hoz-junco', golpes: 1,
    verbo: 'Cortar junco', vacio: 'El junco está cortado: vuelve a crecer en', sinHerramienta: 'El junco se corta con una hoz de junco' },
  { id: 'hierbas', nombre: 'Hierbas del mallín', x: -256, z: -244, radio: 3.0, da: { hierbas: 2 }, cada: 1, herramienta: 'hoz-junco', golpes: 1,
    verbo: 'Cortar hierbas', vacio: 'Las hierbas están cortadas: vuelven a crecer en', sinHerramienta: 'Las hierbas se cortan con una hoz de junco' },
  { id: 'arcilla', nombre: 'Barranca de arcilla', x: 52, z: 45, radio: 3.6, da: { arcilla: 4 }, cada: 2, herramienta: 'pala-arcilla', golpes: 1,
    verbo: 'Sacar arcilla', vacio: 'La barranca está sacada: vuelve a haber arcilla en', sinHerramienta: 'La arcilla se saca con una pala de arcilla' },
];
export const PUNTO_ZONA = Object.fromEntries(PUNTOS_ZONA.map((p) => [p.id, p]));

// los piñones del pehuenal
export const PINONES_PEHUEN = 6;
export const RADIO_PEHUEN = 3.2;
export const DIAS_ANIO = 12;   // como meteo.js y main.js: el año dura doce días

const entero = (v, d = 0) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : d; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export const recursosZonaNuevos = () => ({ usos: {}, pehuenes: {} });
// Sanea lo guardado: sólo ids de puntos que existen y claves de pehuén con forma «x,z»; días y años enteros.
export function sanearRecursosZona(v) {
  const o = objeto(v) ? v : {};
  const usos = {}, pehuenes = {};
  for (const [k, d] of Object.entries(objeto(o.usos) ? o.usos : {})) {
    if (!Object.hasOwn(PUNTO_ZONA, k) || !Number.isFinite(Number(d))) continue;
    usos[k] = Math.max(-1, Math.min(1e7, entero(d)));
  }
  for (const [k, a] of Object.entries(objeto(o.pehuenes) ? o.pehuenes : {}).slice(0, 64)) {
    if (!/^-?\d{1,4},-?\d{1,4}$/.test(k) || !Number.isFinite(Number(a))) continue;
    pehuenes[k] = Math.max(0, Math.min(1e6, entero(a)));
  }
  return { usos, pehuenes };
}
// El estado de la partida (lo crea si falta: una partida vieja).
export function estadoZona(progreso) {
  if (!objeto(progreso.recursosZona) || !objeto(progreso.recursosZona.usos) || !objeto(progreso.recursosZona.pehuenes)) progreso.recursosZona = sanearRecursosZona(progreso.recursosZona);
  return progreso.recursosZona;
}

// ¿Cuántos días faltan para que el punto vuelva a dar? (0 = ya)
export function faltaPara(estado, punto, dia) {
  const p = typeof punto === 'string' ? PUNTO_ZONA[punto] : punto;
  if (!p) return Infinity;
  const usado = estado?.usos?.[p.id];
  if (!Number.isFinite(usado)) return 0;
  return Math.max(0, usado + p.cada - entero(dia, 0));
}
export const disponible = (estado, punto, dia) => faltaPara(estado, punto, dia) === 0;

// El punto que tenés a mano (el más cercano dentro de su radio), o null.
export function puntoCerca(x, z) {
  let mejor = null, d0 = Infinity;
  for (const p of PUNTOS_ZONA) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < p.radio && d < d0) { d0 = d; mejor = p; }
  }
  return mejor;
}

const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;
export const textoDa = (da) => Object.entries(da).map(([k, n]) => `${n} ${n === 1 ? MATERIALES_ZONA[k]?.uno || k : MATERIALES_ZONA[k]?.nombre || k}`).join(' y ');

// Lo que dice el aviso al lado del punto (con E). `cosas`: progreso.cosas.
export function avisoPunto(estado, punto, dia, cosas = {}) {
  const p = typeof punto === 'string' ? PUNTO_ZONA[punto] : punto;
  if (!p) return null;
  const falta = faltaPara(estado, p, dia);
  if (falta > 0) return `${p.vacio} ${dias(falta)}`;
  if (!(Number(cosas?.[p.herramienta]) > 0)) return p.sinHerramienta;
  return `${p.verbo} (${textoDa(p.da)})`;
}

// Usar el punto: { ok, da, motivo ('herramienta' | 'falta'), falta }. Con ok, anota el día (vuelve en `cada` días).
export function usarPunto(estado, punto, dia, cosas = {}) {
  const p = typeof punto === 'string' ? PUNTO_ZONA[punto] : punto;
  if (!p) return { ok: false, motivo: 'no-existe' };
  const falta = faltaPara(estado, p, dia);
  if (falta > 0) return { ok: false, motivo: 'falta', falta };
  if (!(Number(cosas?.[p.herramienta]) > 0)) return { ok: false, motivo: 'herramienta' };
  estado.usos[p.id] = entero(dia, 0);
  return { ok: true, da: { ...p.da } };
}

// ---------------------------------------------------------------- los pehuenes
// El año del día (el primero es el 1) y si es otoño: con la estación fija en otoño, siempre; fija en otra, nunca;
// en «auto», la misma cuenta que el cuadro de main.js (el otoño ocupa de 0,35 a 0,68 del año: los días 5 a 8 de cada doce).
export const anioDe = (dia) => Math.floor((Math.max(1, entero(dia, 1)) - 1) / DIAS_ANIO) + 1;
export function esOtono(dia, horas = 12, ajuste = 'auto') {
  if (ajuste === 'otono') return true;
  if (ajuste !== 'auto') return false;
  const fase = ((((entero(dia, 1) - 1) + Number(horas || 0) / 24) % DIAS_ANIO) + DIAS_ANIO) % DIAS_ANIO / DIAS_ANIO;
  return fase >= 0.35 && fase < 0.68;
}
export const clavePehuen = (x, z) => `${Math.round(Number(x) || 0)},${Math.round(Number(z) || 0)}`;
export function pehuenCerca(pehuenes, x, z) {
  let mejor = null, d0 = Infinity;
  for (const a of pehuenes || []) {
    const d = Math.hypot(a.x - x, a.z - z) - (Number(a.r) || 0);
    if (d < RADIO_PEHUEN && d < d0) { d0 = d; mejor = a; }
  }
  return mejor;
}
export const pehuenDisponible = (estado, a, dia, horas, ajuste) => esOtono(dia, horas, ajuste) && estado?.pehuenes?.[clavePehuen(a.x, a.z)] !== anioDe(dia);
export function avisoPehuen(estado, a, dia, horas, ajuste) {
  if (!a) return null;
  if (!esOtono(dia, horas, ajuste)) return 'El pehuén larga sus piñones en otoño';
  if (estado?.pehuenes?.[clavePehuen(a.x, a.z)] === anioDe(dia)) return 'Este pehuén ya dio sus piñones este otoño';
  return `Juntar los piñones del pehuén (${PINONES_PEHUEN})`;
}
export function juntarPehuen(estado, a, dia, horas, ajuste) {
  if (!a) return { ok: false, motivo: 'no-existe' };
  if (!esOtono(dia, horas, ajuste)) return { ok: false, motivo: 'estacion' };
  const k = clavePehuen(a.x, a.z), anio = anioDe(dia);
  if (estado.pehuenes[k] === anio) return { ok: false, motivo: 'ya' };
  estado.pehuenes[k] = anio;
  return { ok: true, pinones: PINONES_PEHUEN };
}

// ---------------------------------------------------------------- la mochila
// Las casillas de los materiales y las herramientas de zona (mochila.js las pone después de la lana).
export function ranurasZona(progreso) {
  const M = progreso?.materiales || {}, C = progreso?.cosas || {};
  const r = [];
  for (const k of IDS_MATERIALES_ZONA) {
    const n = Number(M[k]) || 0;
    if (n > 0) r.push({ id: k, nombre: MATERIALES_ZONA[k].mochila, icono: ICONO_MATERIAL[k], cuenta: n, texto: MATERIALES_ZONA[k].texto });
  }
  // 4.10.1: el cristal del Relax (se compra en la Parada Alta y los puestos) ocupa casillas y no tenía ranura: el panel lo mostraba con la clave cruda
  if (progreso?.modo !== 'desafio' && Number(M.cristal) > 0) r.push({ id: 'cristal', nombre: 'Cristales', icono: 'cristal', cuenta: Number(M.cristal), texto: 'De la cantera. Se venden y se cambian en las paradas.' });
  for (const id of IDS_HERRAMIENTAS_ZONA) {
    const h = HERRAMIENTAS_ZONA[id];
    if (Number(C[id]) > 0) r.push({ id, nombre: h.nombre, icono: h.icono, texto: h.efecto });
  }
  return r;
}
const ICONO_MATERIAL = { junco: 'junco', hierbas: 'hierbas', arcilla: 'arcilla', cuero: 'cuero', 'piedra-cantera': 'piedraCantera' };

// Los dibujos de la mochila (64 × 64, como los de mochila.js). `x` es el contexto 2D del lienzo.
export const ICONOS_ZONA = {
  junco(x) {
    x.strokeStyle = '#7f8f3e'; x.lineWidth = 3;
    for (const [a, b, c] of [[22, 54, 16], [28, 56, 10], [34, 56, 8], [40, 55, 14], [46, 54, 20]]) { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + 2, 32, a + (a - 34) * 0.3, c); x.stroke(); }
    x.strokeStyle = '#a07a3c'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(20, 44); x.lineTo(48, 44); x.stroke();
    x.fillStyle = '#6a4a2a';
    for (const cx of [26, 40]) { x.beginPath(); x.ellipse(cx, 12, 2.5, 5, 0, 0, Math.PI * 2); x.fill(); }
  },
  hierbas(x) {
    x.strokeStyle = '#4f7a3a'; x.lineWidth = 2.5;
    for (const [a, b] of [[24, 14], [32, 10], [40, 14], [28, 18], [36, 18]]) { x.beginPath(); x.moveTo(32, 54); x.lineTo(a, b); x.stroke(); }
    x.fillStyle = '#6f9a4a';
    for (const [cx, cy, an] of [[24, 18, -0.6], [40, 18, 0.6], [30, 14, -0.2], [35, 13, 0.2], [26, 28, -0.8], [38, 28, 0.8]]) { x.beginPath(); x.ellipse(cx, cy, 3.5, 6.5, an, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#b48ac0';
    for (const [cx, cy] of [[32, 9], [23, 13]]) { x.beginPath(); x.arc(cx, cy, 2.5, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = '#c9a868'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(27, 44); x.lineTo(37, 44); x.stroke();
  },
  arcilla(x) {
    x.fillStyle = '#9a6a4c';
    x.beginPath(); x.roundRect(10, 30, 26, 18, 4); x.fill();
    x.fillStyle = '#b27c58';
    x.beginPath(); x.roundRect(28, 22, 26, 18, 4); x.fill();
    x.strokeStyle = 'rgba(80,50,30,0.6)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(32, 28); x.lineTo(48, 30); x.moveTo(14, 38); x.lineTo(30, 40); x.stroke();
  },
  cuero(x) {
    x.fillStyle = '#8a5a34';
    x.beginPath(); x.moveTo(14, 18); x.quadraticCurveTo(32, 10, 50, 18); x.lineTo(54, 30); x.lineTo(48, 50); x.quadraticCurveTo(32, 56, 16, 50); x.lineTo(10, 30); x.closePath(); x.fill();
    x.strokeStyle = '#5e3a20'; x.lineWidth = 1.5; x.setLineDash([3, 3]);
    x.beginPath(); x.moveTo(18, 22); x.quadraticCurveTo(32, 16, 46, 22); x.lineTo(48, 44); x.quadraticCurveTo(32, 50, 18, 44); x.closePath(); x.stroke();
    x.setLineDash([]);
  },
  piedraCantera(x) {
    x.fillStyle = '#8c8a84';
    x.beginPath(); x.moveTo(10, 44); x.lineTo(14, 28); x.lineTo(36, 26); x.lineTo(38, 44); x.closePath(); x.fill();
    x.fillStyle = '#a3a19a';
    x.beginPath(); x.moveTo(30, 34); x.lineTo(34, 18); x.lineTo(54, 20); x.lineTo(54, 36); x.closePath(); x.fill();
    x.strokeStyle = '#6a6862'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(14, 28); x.lineTo(36, 26); x.moveTo(34, 18); x.lineTo(54, 20); x.stroke();
  },
  hoz(x) {
    x.strokeStyle = '#6b5238'; x.lineWidth = 6;
    x.beginPath(); x.moveTo(18, 56); x.lineTo(26, 40); x.stroke();
    x.strokeStyle = '#a9b1b7'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(26, 40); x.quadraticCurveTo(30, 14, 50, 14); x.quadraticCurveTo(56, 24, 46, 30); x.stroke();
  },
  palaArcilla(x) {
    x.strokeStyle = '#6b5238'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(44, 8); x.lineTo(30, 40); x.stroke();
    x.beginPath(); x.moveTo(38, 8); x.lineTo(50, 8); x.stroke();
    x.fillStyle = '#9aa3aa';
    x.beginPath(); x.moveTo(26, 36); x.lineTo(36, 40); x.lineTo(28, 58); x.lineTo(18, 54); x.closePath(); x.fill();
    x.fillStyle = '#9a6a4c'; x.fillRect(20, 50, 8, 4);
  },
  cuchilloCuero(x) {
    x.fillStyle = '#4a3020';
    x.beginPath(); x.roundRect(12, 40, 18, 8, 3); x.fill();
    x.fillStyle = '#c9d0d6';
    x.beginPath(); x.moveTo(30, 40); x.lineTo(54, 30); x.quadraticCurveTo(52, 44, 30, 48); x.closePath(); x.fill();
    x.strokeStyle = '#8a9096'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(30, 44); x.lineTo(50, 36); x.stroke();
  },
  picoCantero(x) {
    x.strokeStyle = '#5a4430'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(22, 58); x.lineTo(38, 20); x.stroke();
    x.fillStyle = '#7d868e';
    x.beginPath(); x.moveTo(6, 30); x.quadraticCurveTo(24, 8, 40, 14); x.lineTo(44, 24); x.quadraticCurveTo(26, 20, 12, 36); x.fill();
    x.fillStyle = '#b8c0c6';
    x.beginPath(); x.moveTo(40, 14); x.lineTo(58, 16); x.lineTo(58, 26); x.lineTo(44, 24); x.closePath(); x.fill();
    x.strokeStyle = '#c99a3a'; x.lineWidth = 2.5;
    x.beginPath(); x.moveTo(34, 26); x.lineTo(38, 18); x.stroke();
  },
};
