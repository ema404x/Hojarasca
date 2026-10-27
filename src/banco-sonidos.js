// 4.11.4: el banco de sonidos. Una lista de TODOS los sonidos del juego (el Desafío, el bosque, la gente, la música, la radio, la interfaz) para
// oírlos uno por uno desde la pausa, sin jugar hasta provocarlos. Cada entrada llama a la función REAL del motor (`sonido.js`, el banco del
// Desafío `desafio-sonidos.js`, las tandas nuevas `desafio-aro-sonido.js`, `desafio-brasas-sonido.js`, `desafio-campana-sonido.js`, la gramola,
// la radio): nada se copia ni se renderiza aparte. Los pocos sonidos que el juego dispara «en línea» (con `golpeRuido` o `tono` sueltos, como el
// martillo de Anselmo) salen de una tabla de datos (`LINEA`) y una prueba comprueba que esos mismos números sigan en el archivo del juego.
//
// Módulo sin DOM ni three (se prueba en Node con el contexto de audio de mentira). La pantalla vive en `banco-sonidos-panel.js`.
// NO toca la partida: no guarda nada, no lee ni escribe lo jugado, no gasta noches ni recursos. Sólo hace sonar el motor de audio.
import { crearBanco } from './desafio-sonidos.js';
import { crearSonidosAro } from './desafio-aro-sonido.js';
import { crearSonidoBrasas } from './desafio-brasas-sonido.js';
import { crearSonidoCampana } from './desafio-campana-sonido.js';
import { alternarGramola, detenerGramola, gramolaSuena, TEMAS } from './gramola.js';
import { sintetizarTango, sintetizarMorse, TASA_RADIO } from './radio-madrugada.js';
import { MENSAJES_MORSE } from './huevos.js';
import { emitirEmisora } from './huevos-juego.js';
import { FRASES_PIANO } from './piano-misterio.js';
import { SILBATOS } from './personal-trochita.js';
import { paletaMusical } from './musica-relax.js';
import { vozDe, planBalbuceo } from './social-voz.js';
import { MATERIALES } from './impactos.js';
import { SUELOS, TASA_PREVIA, canto } from './sonido-sintesis.js';

// ---------------------------------------------------------------- lo que se muestra
export const NOMBRE_BUS = { ambiente: 'El bosque', efectos: 'Efectos', musica: 'Música' };
export const GRUPOS = [
  { id: 'coihue', nombre: 'Noche de los duendes · El Coihue Viejo y su subida' },
  { id: 'duendes', nombre: 'Noche de los duendes · Voces y risas de los duendes' },
  { id: 'avisos', nombre: 'Noche de los duendes · Avisos de la noche y el miedo' },
  { id: 'asedio', nombre: 'Noche de los duendes · Asedio: tablas, puertas y tierra' },
  { id: 'aliados', nombre: 'Noche de los duendes · Aliados, vecinos y la campana' },
  { id: 'defensas', nombre: 'Noche de los duendes · Defensas, trampas, fuego y brasas' },
  { id: 'armas', nombre: 'Noche de los duendes · Armas y golpes' },
  { id: 'pajaros', nombre: 'Bosque · Pájaros y animales' },
  { id: 'viento', nombre: 'Bosque · Viento y hojas' },
  { id: 'agua', nombre: 'Bosque · Agua' },
  { id: 'lluvia', nombre: 'Bosque · Lluvia, truenos y techos' },
  { id: 'fuego', nombre: 'Bosque · Fuego, abejas y grillos' },
  { id: 'trabajo', nombre: 'Pasos y trabajo' },
  { id: 'gente', nombre: 'Gente y aldea' },
  { id: 'vehiculos', nombre: 'Trochita, kayak y pesca' },
  { id: 'musica', nombre: 'Música' },
  { id: 'radio', nombre: 'Radio de madrugada' },
  { id: 'interfaz', nombre: 'Interfaz y avisos' },
];

export const DISTANCIAS = [
  { id: 'cerca', nombre: 'Cerca (6 m)', metros: 6 },
  { id: 'media', nombre: 'Media (25 m)', metros: 25 },
  { id: 'lejos', nombre: 'Lejos (60 m)', metros: 60 },
];
export const LADOS = [
  { id: 'frente', nombre: 'Al frente', grados: 0 },
  { id: 'derecha', nombre: 'A la derecha', grados: 90 },
  { id: 'atras', nombre: 'Atrás', grados: 180 },
  { id: 'izquierda', nombre: 'A la izquierda', grados: 270 },
];
export const FUERZAS = [
  { id: 'suave', nombre: 'Suave', valor: 0.4 },
  { id: 'normal', nombre: 'Normal', valor: 0.7 },
  { id: 'fuerte', nombre: 'Fuerte', valor: 1 },
];

// Una lista de variantes para el selector de una entrada: pares [id, nombre]
const vs = (etiqueta, pares, defecto = null) => ({ etiqueta, opciones: pares.map(([id, nombre]) => ({ id, nombre })), defecto: defecto || pares[0][0] });
const TIPOS_DUENDE = [['rastreador', 'Rastreador'], ['tirador', 'Tirador'], ['saltador', 'Saltador'], ['escupidor', 'Escupidor'], ['bruto', 'Bruto'], ['jefe', 'Mandamás'], ['rey', 'Rey Duende']];
const CLASES_DUENDE = [['chico', 'Chico, travieso'], ['viejo', 'Viejo oscuro'], ['mandamas', 'Mandamás']];

// ---------------------------------------------------------------- los sonidos que el juego dispara «en línea»
// Con `golpeRuido` o `tono` sueltos, sin función propia en el motor. Los números están UNA vez, acá, y la prueba verifica que sigan escritos así
// en `archivo` (si alguien los cambia en el juego y no acá, la prueba avisa). `fuente`: el volumen de `sonido.fuente(pos, fuente, reverb)`.
export const LINEA = {
  'martillo-anselmo': { archivo: 'src/desafio-vecinos-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.07, frec: 1400, q: 3, vol: 0.2 }, fuente: 0.8 }] },
  'reparacion-aliado': { archivo: 'src/desafio-aliados.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.08, frec: 900, q: 2, vol: 0.18 }, fuente: 0.7 }] },
  'flecha-aliada': { archivo: 'src/desafio-aliados.js', llamadas: [{ fn: 'tono', args: { frec: 240, fin: 110, dur: 0.16, tipo: 'triangle', vol: 0.12 }, fuente: 0.8 }] },
  'piedra-chicos': { archivo: 'src/desafio-vecinos-mundo.js', llamadas: [{ fn: 'tono', args: { frec: 620, fin: 300, dur: 0.07, tipo: 'triangle', vol: 0.06 }, fuente: 0.7 }] },
  'fuego-herminia': { archivo: 'src/desafio-vecinos-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.35, frec: 2200, q: 0.8, vol: 0.14 }, fuente: 0.8 }] },
  'antorcha-apagon': { archivo: 'src/desafio-defensas.js', llamadas: [
    { fn: 'golpeRuido', args: { dur: 0.7, frec: 900, q: 0.5, tipo: 'lowpass', vol: 0.3 }, fuente: 1, reverb: 0.6, conRuido: true },
    { fn: 'golpeRuido', args: { dur: 0.35, frec: 3800, q: 0.7, vol: 0.08 }, fuente: 1, reverb: 0.6, cuando: 0.05 }] },
  'foso-atrapa': { archivo: 'src/desafio-defensas.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.35, frec: 260, tipo: 'lowpass', vol: 0.5 }, fuente: 1 }] },
  'foso-estacas': { archivo: 'src/desafio-defensas.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.28, frec: 320, tipo: 'lowpass', vol: 0.45 }, fuente: 1 }] },
  'mina-estalla': { archivo: 'src/desafio-defensas.js', llamadas: [
    { fn: 'golpeRuido', args: { dur: 1.2, frec: 140, tipo: 'lowpass', vol: 0.9 }, fuente: 1.4 },
    { fn: 'golpeRuido', args: { dur: 0.5, frec: 900, vol: 0.4 }, fuente: 1 }] },
  'miel-quema': { archivo: 'src/desafio-trampas-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.5, frec: 1400, q: 0.7, vol: 0.12 }, fuente: 1 }] },
  'miel-pega': { archivo: 'src/desafio-trampas-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.3, frec: 420, q: 1.2, tipo: 'lowpass', vol: 0.22 }, fuente: 1 }] },
  'puesto-golpe': { archivo: 'src/desafio-puestos-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.18, frec: 700, q: 2, vol: 0.22 }, fuente: 1 }], variantes: { 'blindado': 2600 }, fragmento: 'dur: 0.18, frec: r.blindado ? 2600 : 700, q: 2, vol: 0.22' },
  'puesto-rompe': { archivo: 'src/desafio-puestos-mundo.js', llamadas: [{ fn: 'golpeRuido', args: { dur: 0.9, frec: 140, tipo: 'lowpass', vol: 0.7 }, fuente: 1.3 }] },
};
// Cómo queda escrita una llamada en el código del juego (la prueba la busca en `archivo`)
export function fragmentoDe(id) {
  const L = LINEA[id];
  if (L.fragmento) return [L.fragmento];
  return L.llamadas.map((l) => Object.entries(l.args).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(', '));
}

// ---------------------------------------------------------------- el motor de pruebas (las piezas reales, armadas contra un `sonido`)
export function armarMotor(sonido, { adelante = null } = {}) {
  return {
    sonido,
    banco: crearBanco(sonido),
    aro: crearSonidosAro(sonido),
    brasas: crearSonidoBrasas(sonido),
    campana: crearSonidoCampana(sonido),
    gramola: { alternar: alternarGramola, detener: detenerGramola, suena: gramolaSuena },
    radio: { emitir: emitirEmisora },
    adelante,   // () => { x, z }: hacia dónde mira el que escucha (el juego pasa la dirección de la cámara)
  };
}

// ---------------------------------------------------------------- el catálogo
function entrada(id, nombre, grupo, bus, o) {
  return { id, nombre, grupo, bus, prioridad: 3, nuevo: null, pos: false, fuerza: false, variantes: null, bucle: false, sinFuentes: false, llama: [], nota: '', como: '', ...o };
}
const enLinea = (id, nombre, grupo, o = {}) => entrada(id, nombre, grupo, 'efectos', {
  pos: true, enLinea: true, llama: ['sonido.fuente', ...new Set(LINEA[id].llamadas.map((l) => 'sonido.' + l.fn))],
  como: LINEA[id].llamadas.map((l) => `sonido.${l.fn}(${Object.entries(l.args).map(([k, v]) => `${k}: ${v}`).join(', ')})`).join(' + '),
  tocar: (c) => {
    let r;
    for (const l of LINEA[id].llamadas) {
      const args = { ...l.args };
      if (c.v === 'blindado' && id === 'puesto-golpe') args.frec = LINEA[id].variantes.blindado;
      args.destino = c.R.sonido.fuente(c.pos(), l.fuente, l.reverb);
      if (l.conRuido) args.buffer = c.R.sonido.ruido;
      if (l.cuando) args.cuando = l.cuando;
      r = c.R.sonido[l.fn](args);
    }
    return r;
  },
  ...o,
});
// un bucle del ambiente: el motor lo maneja `actualizar` con el estado del mundo; acá se le fuerza ese estado mientras el banco está abierto
const bucle = (id, nombre, grupo, bus, parcial, o = {}) => entrada(id, nombre, grupo, bus, {
  bucle: true, llama: ['sonido.actualizar'], como: 'sonido.actualizar(dt, { ...el mundo, ' + (o.forzando || '…') + ' })',
  tocar: (c) => c.alternarBucle(id, parcial(c)),
  ...o,
});

// el canto de una especie, hecho ya (si no, el motor lo toca cuando sale de la cola, después de que el banco dejó de mirar)
const cantoListo = (R, especie) => R.sonido.variante('canto-' + especie, 3, () => canto(especie, TASA_PREVIA));

export function crearCatalogo() {
  const L = [];
  const agregar = (...es) => { for (const x of es) L.push(x); };

  // ============================================================ Desafío · el Coihue Viejo y su subida
  agregar(
    entrada('coihue-camina', 'El Coihue Viejo caminando', 'coihue', 'efectos', {
      pos: true, nuevo: '4.10.0', prioridad: 1, llama: ['banco.zumbido'], como: 'banco.zumbido(pos)',
      nota: 'Madera que cruje con voz de tronco hueco; la mitad de las veces, una raíz que se clava en la tierra. Es el sonido de su paso.',
      tocar: (c) => c.R.banco.zumbido(c.pos()),
    }),
    entrada('aro-brota', 'Las raíces brotan (la subida al Coihue)', 'coihue', 'efectos', {
      pos: true, nuevo: '4.8.1', prioridad: 1, llama: ['aro.brota'], como: 'aro.brota(pos)', preparar: (R) => R.aro.preparar(),
      nota: 'Viento que sube, retumbo, crujidos y tierra. 4 s.', tocar: (c) => c.R.aro.brota(c.pos()),
    }),
    entrada('aro-crujir', 'Crujido de las raíces', 'coihue', 'efectos', {
      pos: true, nuevo: '4.8.1', prioridad: 1, llama: ['aro.crujir'], como: 'aro.crujir(pos)', preparar: (R) => R.aro.preparar(),
      nota: 'Madera que se frota y se suelta. Se repite cada 2 o 3 s mientras el aro está; tiene 3 variantes.', tocar: (c) => c.R.aro.crujir(c.pos()),
    }),
    entrada('aro-sale', 'La raíz sale de la tierra', 'coihue', 'efectos', {
      pos: true, nuevo: '4.8.1', prioridad: 1, llama: ['aro.sale'], como: 'aro.sale(pos)', preparar: (R) => R.aro.preparar(),
      nota: 'Un terrón que se abre y un golpe hueco de tierra con hojas. 1,8 s.', tocar: (c) => c.R.aro.sale(c.pos()),
    }),
    entrada('aro-cierra', 'Las raíces se cierran', 'coihue', 'efectos', {
      pos: true, nuevo: '4.8.1', prioridad: 1, llama: ['aro.cierra'], como: 'aro.cierra(pos)', preparar: (R) => R.aro.preparar(),
      nota: 'Tierra que cae, hojas que se acomodan y un retumbo que se apaga. 5 s.', tocar: (c) => c.R.aro.cierra(c.pos()),
    }),
    entrada('nido-latido', 'El latido del nido enterrado', 'coihue', 'efectos', {
      pos: true, llama: ['banco.latido'], como: 'banco.latido(pos)', nota: 'Casi todo por debajo de los 60 Hz: tiene que sentirse más que oírse.', tocar: (c) => c.R.banco.latido(c.pos()),
    }),
    entrada('jefe-entra', 'Entra el Mandamás', 'coihue', 'efectos', {
      pos: true, llama: ['banco.jefe'], como: 'banco.jefe(pos)', preparar: (R) => R.sonido.prepararDuendes(),
      nota: 'Risa grave y lenta, un golpe de aire bajo y un golpe de tierra.', tocar: (c) => c.R.banco.jefe(c.pos()),
    }),
    entrada('rey-voz', 'La voz del Rey Duende', 'coihue', 'efectos', {
      pos: true, fuerza: true, llama: ['sonido.vozAlien'], como: "sonido.vozAlien('rey', estado, { pos, intensidad })",
      variantes: vs('Qué hace', [['llamado', 'Llama'], ['alerta', 'Te ve'], ['ataque', 'Embiste'], ['muerte', 'Cae']]),
      tocar: (c) => c.R.sonido.vozAlien('rey', c.v, { pos: c.pos(), intensidad: c.fuerzaValor }),
    }),
  );

  // ============================================================ Desafío · voces y risas de los duendes
  const alDuende = (id, nombre, fn, nota, o = {}) => entrada(id, nombre, 'duendes', 'efectos', {
    pos: true, fuerza: true, llama: ['banco.' + fn], como: `banco.${fn}(pos, tipo)`, nota, variantes: vs('Duende', TIPOS_DUENDE.slice(0, 6)), ...o,
    tocar: (c) => c.R.banco[fn](c.pos(), c.v),
  });
  agregar(
    entrada('duende-risa', 'La risa del duende', 'duendes', 'efectos', {
      pos: true, fuerza: true, llama: ['sonido.risaDuende'], como: 'sonido.risaDuende(clase, { pos, intensidad })',
      preparar: (R) => R.sonido.prepararDuendes(), variantes: vs('Clase', CLASES_DUENDE),
      nota: 'Carcajadas sintetizadas muestra por muestra (seis por garganta). Cada vez suena una distinta.',
      tocar: (c) => c.R.sonido.risaDuende(c.v, { pos: c.pos(), intensidad: c.fuerzaValor }),
    }),
    entrada('duende-alerta', 'Alerta: el duende te vio (se ríe)', 'duendes', 'efectos', {
      pos: true, llama: ['banco.chillido'], como: 'banco.chillido(pos, tipo, viejo)', preparar: (R) => R.sonido.prepararDuendes(),
      variantes: vs('Clase', CLASES_DUENDE), nota: 'La alerta es una risa. Si las risas no estuvieran hechas sonaría la risita de antes.',
      tocar: (c) => c.R.banco.chillido(c.pos(), c.v === 'viejo' ? 'bruto' : c.v === 'mandamas' ? 'jefe' : 'rastreador', c.v !== 'chico'),
    }),
    entrada('duende-llamado', 'Llamado: avisa a los otros (se ríe más fuerte)', 'duendes', 'efectos', {
      pos: true, llama: ['banco.llamado'], como: 'banco.llamado(pos, tipo, viejo)', preparar: (R) => R.sonido.prepararDuendes(),
      variantes: vs('Clase', CLASES_DUENDE), tocar: (c) => c.R.banco.llamado(c.pos(), c.v === 'viejo' ? 'bruto' : c.v === 'mandamas' ? 'jefe' : 'rastreador', c.v !== 'chico'),
    }),
    entrada('duende-travieso', 'La risa del travieso que se va corriendo', 'duendes', 'efectos', {
      pos: true, llama: ['banco.risa'], como: 'banco.risa(pos, tipo)', preparar: (R) => R.sonido.prepararDuendes(),
      nota: 'Una carcajada y los pasitos en la hojarasca.', tocar: (c) => c.R.banco.risa(c.pos(), 'saltador'),
    }),
    alDuende('duende-acecho', 'Acecho: la voz grave desde lejos', 'acecho', 'Baja, larga, casi sin abrir la boca.'),
    alDuende('duende-respiro', 'Respiración de un duende al lado', 'respiro', 'El aliento del que tenés al lado y no ves.'),
    alDuende('duende-embestida', 'Embestida: el grito del ataque', 'embestida', 'Arranca arriba y se quiebra.'),
    alDuende('duende-muerte', 'El duende cae', 'muerte', 'La voz se desarma y el cuerpo cae (corteza, tierra).'),
    entrada('duende-golpe', 'El golpe entra en un duende', 'duendes', 'efectos', {
      pos: true, llama: ['banco.golpe'], como: 'banco.golpe(pos, tipo, fuerte)', variantes: vs('Golpe', [['normal', 'Normal'], ['fuerte', 'Fuerte (con grito)']]),
      nota: 'Corteza hueca, carne y, si dolió, la voz.', tocar: (c) => c.R.banco.golpe(c.pos(), 'rastreador', c.v === 'fuerte'),
    }),
    entrada('duende-asoma', 'Un duende asoma de la tierra', 'duendes', 'efectos', {
      pos: true, llama: ['banco.emerger'], como: 'banco.emerger(pos)', preparar: (R) => R.sonido.prepararDuendes(), tocar: (c) => c.R.banco.emerger(c.pos()),
    }),
    entrada('duende-salta', 'Un duende salta', 'duendes', 'efectos', {
      pos: true, llama: ['banco.salto'], como: 'banco.salto(pos, tipo)', variantes: vs('Duende', [['saltador', 'Saltador'], ['rastreador', 'Rastreador']]),
      tocar: (c) => c.R.banco.salto(c.pos(), c.v),
    }),
    entrada('duende-escupe', 'El escupidor escupe', 'duendes', 'efectos', {
      pos: true, llama: ['banco.escupir'], como: 'banco.escupir(pos)', tocar: (c) => c.R.banco.escupir(c.pos()),
    }),
    entrada('duende-acido', 'El ácido come la madera', 'duendes', 'efectos', {
      pos: true, llama: ['banco.acido'], como: 'banco.acido(pos)', tocar: (c) => c.R.banco.acido(c.pos()),
    }),
    entrada('lechuza-aleteo', 'La lechuza con su jinete: aleteo', 'duendes', 'efectos', {
      pos: true, llama: ['banco.aleteo'], como: 'banco.aleteo(pos)', nota: 'Plumas; a veces un «hu-huu» desde arriba.', tocar: (c) => c.R.banco.aleteo(c.pos()),
    }),
    entrada('lechuza-picada', 'La lechuza en picada', 'duendes', 'efectos', {
      pos: true, llama: ['banco.picada'], como: 'banco.picada(pos)', preparar: (R) => R.sonido.prepararDuendes(), tocar: (c) => c.R.banco.picada(c.pos()),
    }),
  );

  // ============================================================ Desafío · avisos de la noche y el miedo
  agregar(
    entrada('sirena', 'El aviso de que salen: silbidos del monte', 'avisos', 'efectos', {
      llama: ['banco.sirena'], como: 'banco.sirena()', nota: 'Tres silbidos que suben y se quiebran (antes era una sirena).', tocar: (c) => c.R.banco.sirena(),
    }),
    entrada('salen', 'Salen: el golpe grave que rompe el silencio', 'avisos', 'efectos', {
      nuevo: '4.8.0', prioridad: 1, llama: ['banco.salen'], como: 'banco.salen()', nota: 'Un seno que baja de 74 a 31 Hz, ruido grave y tierra. Se siente en el pecho.', tocar: (c) => c.R.banco.salen(),
    }),
    entrada('silencio-raro', 'El silencio raro (el bosque se calla)', 'avisos', 'efectos', {
      sinFuentes: true, nuevo: '4.8.0', prioridad: 1, llama: ['banco.silencioRaro'], como: 'banco.silencioRaro(seg)', variantes: vs('Cuánto', [['8', '8 segundos'], ['14', '14 segundos']], '8'),
      nota: 'Ojo: es un silencio. Baja toda la mezcla un 80 % y calla pájaros y grillos. «Salen» o «Detener todo» lo rompen.',
      tocar: (c) => c.R.banco.silencioRaro(Number(c.v)),
    }),
    entrada('pajaros-callan', 'Los pájaros se callan (pasan duendes)', 'avisos', 'ambiente', {
      sinFuentes: true, nuevo: '4.8.0', prioridad: 1, llama: ['banco.callarAves'], como: 'banco.callarAves(seg, grillos)', nota: 'Otro silencio: durante 10 s los pájaros del bosque no cantan.', tocar: (c) => c.R.banco.callarAves(10, true),
    }),
    entrada('rama-cruje', 'Una rama que cruje lejos', 'avisos', 'efectos', {
      pos: true, nuevo: '4.8.0', prioridad: 1, llama: ['banco.crujidoRama'], como: 'banco.crujidoRama(pos, doble)', preparar: (R) => R.banco.prepararAmbiente(),
      variantes: vs('Cuántas', [['una', 'Una'], ['doble', 'Dos seguidas']]), nota: 'Quejido de madera que se dobla y un chasquido seco. De lejos queda el chasquido.',
      tocar: (c) => c.R.banco.crujidoRama(c.pos(), c.v === 'doble'),
    }),
    entrada('tero-grita', 'El grito del tero', 'avisos', 'efectos', {
      pos: true, nuevo: '4.8.0', prioridad: 1, llama: ['banco.teroGrita'], como: 'banco.teroGrita(pos)', preparar: (R) => R.banco.prepararAmbiente(),
      nota: 'Cinco a ocho «ter-ó» ásperos que se aceleran.', tocar: (c) => c.R.banco.teroGrita(c.pos()),
    }),
    entrada('vaca-muge', 'El mugido de la vaca', 'avisos', 'efectos', {
      pos: true, nuevo: '4.8.0', prioridad: 1, llama: ['banco.vacaMuge'], como: 'banco.vacaMuge(pos)', preparar: (R) => R.banco.prepararAmbiente(),
      nota: 'La más difícil de hacer creíble con síntesis: ¿parece una vaca?', tocar: (c) => c.R.banco.vacaMuge(c.pos()),
    }),
  );

  // ============================================================ Desafío · asedio
  const simple = (id, nombre, grupo, fn, nota = '', o = {}) => entrada(id, nombre, grupo, 'efectos', { pos: true, llama: ['banco.' + fn], como: `banco.${fn}(pos)`, nota, tocar: (c) => c.R.banco[fn](c.pos()), ...o });
  agregar(
    simple('asedio-aranazo', 'Uñas contra la tabla', 'asedio', 'aranazo', 'Pasadas agudas y el golpecito de la garra.'),
    simple('asedio-puerta', 'Prueban la puerta', 'asedio', 'puerta', 'El pestillo que golpetea y la hoja en el marco.'),
    simple('asedio-excavar', 'Cavan bajo tierra', 'asedio', 'excavar'),
    simple('asedio-roca', 'Cae la piedra del artillero', 'asedio', 'roca'),
    entrada('asedio-tiro-roca', 'El Mandamás tira una piedra', 'asedio', 'efectos', {
      pos: true, llama: ['banco.tiroRoca'], como: 'banco.tiroRoca(pos)', nota: 'El silbido y la voz del tiro.', tocar: (c) => c.R.banco.tiroRoca(c.pos()),
    }),
    simple('asedio-madera', 'Golpe contra la madera de la defensa', 'asedio', 'madera'),
    simple('asedio-derrumbe', 'Se derrumba una defensa', 'asedio', 'derrumbe', 'Tablas, tronco y tierra. Es de los más largos.'),
    simple('asedio-enredo', 'Quedan enredados', 'asedio', 'enredo'),
    simple('asedio-pasos', 'Pasos rápidos de duendes que se acercan', 'asedio', 'pasos', 'Cinco pasos en la hojarasca, cada vez más fuertes.'),
    simple('asedio-capullo', 'Revienta un nido de hongos', 'asedio', 'capullo'),
    simple('asedio-quemar', 'Algo se quema', 'asedio', 'quemar'),
    simple('asedio-zanja', 'Prende la zanja de fuego', 'asedio', 'zanja'),
    simple('asedio-apagar', 'Se apaga una llama de golpe', 'asedio', 'apagar'),
    simple('asedio-hielo', 'El hielo que cruje', 'asedio', 'hielo'),
    simple('asedio-rayo', 'El rayo en cadena', 'asedio', 'rayoCadena'),
  );

  // ============================================================ Desafío · aliados, vecinos y la campana
  agregar(
    enLinea('martillo-anselmo', 'El martillo de Anselmo reparando', 'aliados', { nuevo: '4.9.0', prioridad: 1, nota: 'Martillo sobre el hierro y la madera: un golpe seco de 70 ms. En el juego se repite cada medio segundo.' }),
    enLinea('piedra-chicos', 'La piedra que tiran los chicos', 'aliados', { nuevo: '4.9.0', prioridad: 1, nota: 'Un «tuc» corto que baja de 620 a 300 Hz.' }),
    enLinea('reparacion-aliado', 'Un aliado repara una defensa', 'aliados', { nota: 'Un golpecito de 80 ms cada 0,55 s.' }),
    enLinea('flecha-aliada', 'La flecha de la aliada tiradora', 'aliados', { nota: 'Un tono que baja de 240 a 110 Hz.' }),
    enLinea('fuego-herminia', 'Herminia prende un fuego', 'aliados', { nota: 'Un soplido de 350 ms.' }),
    entrada('campana-tanido', 'El tañido de la campana de alarma', 'aliados', 'efectos', {
      pos: true, nuevo: '4.9.0', prioridad: 1, llama: ['campana.sonar'], como: 'campana.sonar(pos)', preparar: (R) => R.campana.preparar(),
      nota: 'Golpe del badajo y ocho parciales de campana, seis golpes seguidos y la cola larga. 5 s.', tocar: (c) => c.R.campana.sonar(c.pos(2.2)),
    }),
    entrada('campana-vieja', 'La campana de siempre (la de antes del tañido)', 'aliados', 'efectos', {
      pos: true, llama: ['sonido.campana'], como: 'sonido.campana(pos)', nota: 'Seis golpes de seis parciales. Es la que sonaba antes; queda de reserva.', tocar: (c) => c.R.sonido.campana(c.pos(2)),
    }),
    simple('perro-grune', 'El perro gruñe', 'aliados', 'grunirPerro', 'Garganta grave que rueda.'),
    simple('perro-ladra', 'El perro ladra', 'aliados', 'ladrarPerro'),
    entrada('martin-silbato', 'Martín silba al pasar la trochita', 'aliados', 'efectos', {
      pos: true, llama: ['sonido.silbato'], como: 'sonido.silbato(pos)', nota: 'El silbato de vapor con el eco del valle, en el lugar elegido.', tocar: (c) => c.R.sonido.silbato(c.pos(3)),
    }),
  );

  // ============================================================ Desafío · defensas, trampas, fuego y brasas
  agregar(
    entrada('brasas-abanico', 'La pala de brasas: el abanico', 'defensas', 'efectos', {
      pos: true, nuevo: '4.9.0', prioridad: 1, llama: ['brasas.abanico'], como: 'brasas.abanico(pos)', preparar: (R) => R.brasas.preparar(),
      nota: 'Soplido y un racimo de chasquidos. 0,75 s, 3 variantes.', tocar: (c) => c.R.brasas.abanico(c.pos()),
    }),
    entrada('brasas-cargar', 'La pala de brasas: cargarla', 'defensas', 'efectos', {
      pos: true, nuevo: '4.9.0', prioridad: 1, llama: ['brasas.cargar'], como: 'brasas.cargar(pos)', preparar: (R) => R.brasas.preparar(),
      nota: 'Raspado de metal sobre piedra y ceniza. 0,6 s.', tocar: (c) => c.R.brasas.cargar(c.pos()),
    }),
    entrada('brasas-miel', 'La miel que prende (el «fum» y el chisporroteo)', 'defensas', 'efectos', {
      pos: true, nuevo: '4.9.0', prioridad: 1, llama: ['brasas.prender'], como: 'brasas.prender(pos)', preparar: (R) => R.brasas.preparar(),
      nota: 'Un «fum» grave y el chisporroteo del azúcar. 0,8 s.', tocar: (c) => c.R.brasas.prender(c.pos()),
    }),
    enLinea('miel-quema', 'La bandeja de miel se quema', 'defensas', { nota: 'Un chasquido de 0,5 s.' }),
    enLinea('miel-pega', 'Un duende se pega en la miel', 'defensas', { nota: 'Un golpe grave y blando de 0,3 s.' }),
    enLinea('foso-atrapa', 'Cae un duende en la trampa', 'defensas'),
    enLinea('foso-estacas', 'El foso de estacas pincha', 'defensas'),
    enLinea('mina-estalla', 'Estalla el barril de resina', 'defensas', { nota: 'Un golpe grave de 1,2 s y otro más agudo encima.' }),
    enLinea('antorcha-apagon', 'La llama se ahoga (noche del apagón)', 'defensas'),
    entrada('antorcha-prende', 'Se prende una antorcha', 'defensas', 'efectos', {
      llama: ['sonido.encender'], como: 'sonido.encender()', nota: 'Chispa, bocanada de fuego y brasitas.', tocar: (c) => c.R.sonido.encender(),
    }),
    enLinea('puesto-golpe', 'Golpe a una estructura de la madriguera', 'defensas', {
      variantes: vs('Material', [['comun', 'Común'], ['blindado', 'Blindada']]), nota: 'La blindada suena más aguda (2600 Hz contra 700).',
    }),
    enLinea('puesto-rompe', 'Se rompe una estructura de la madriguera', 'defensas', { nota: 'Un golpe grave de 0,9 s.' }),
  );

  // ============================================================ Desafío · armas y golpes
  const arma = (id, nombre, fn, nota = '', o = {}) => entrada(id, nombre, 'armas', 'efectos', { llama: ['banco.' + fn], como: `banco.${fn}()`, nota, tocar: (c) => c.R.banco[fn](), ...o });
  agregar(
    arma('arma-herido', 'Te hieren', 'herido', 'El golpe en el cuerpo, el aire que se va y el pitido sordo.'),
    arma('arma-tajo', 'Tajo con facón o hacha', 'tajo'),
    arma('arma-arco', 'El arco: la cuerda, la pala y la flecha', 'arco'),
    entrada('arma-ballesta', 'La ballesta', 'armas', 'efectos', { pos: true, llama: ['banco.ballesta'], como: 'banco.ballesta(pos)', tocar: (c) => c.R.banco.ballesta(c.pos()) }),
    arma('arma-honda', 'La honda: el cuero girando y la piedra', 'honda'),
    arma('arma-pistola', 'La pistola de luz (semilla dorada)', 'pistola', 'Soplo de aire, tintineo y un golpe sordo. Sin chisporroteo eléctrico.'),
    arma('arma-cargado', 'El disparo cargado: tres campanitas y el soplo grande', 'cargado'),
    entrada('arma-plasma', 'La chispa de ámbar (tirador y faro)', 'armas', 'efectos', { pos: true, llama: ['banco.plasma'], como: 'banco.plasma(pos)', tocar: (c) => c.R.banco.plasma(c.pos()) }),
    arma('arma-martillo', 'El martillo de carpintero', 'martillo'),
    arma('arma-cura', 'Curarse', 'cura', 'Dos tonos que suben.'),
  );

  // ============================================================ Bosque · pájaros y animales
  const ave = (fn, nombre, nota = '', o = {}) => entrada('ave-' + fn, nombre, 'pajaros', 'ambiente', {
    pos: true, preparar: (R) => cantoListo(R, fn), prioridad: 2, nuevo: '4.11.1', llama: ['sonido.' + fn], como: `sonido.${fn}(pos)`, nota: nota || 'Sale por «El bosque» (desde la 4.11.1) y adentro de una casa se apaga.',
    tocar: (c) => c.R.sonido[fn](c.pos(4)), ...o,
  });
  agregar(
    ave('zorzal', 'Zorzal'), ave('rayadito', 'Rayadito'), ave('fiofio', 'Fío-fío'), ave('chucao', 'Chucao'),
    ave('carpintero', 'Carpintero negro', 'No canta: golpea dos veces el tronco hueco.'),
    ave('cachanas', 'Cachañas (loros)'), ave('concon', 'Concón (lechuza)'), ave('ranita', 'Ranita del mallín (de noche)'),
    ave('bandurrias', 'Bandurrias'), ave('cisnes', 'Cisnes de cuello negro'), ave('martin', 'Martín pescador'), ave('cauquen', 'Cauquén'),
    ave('ave', 'Pájaro cualquiera'),
    entrada('ave-picaflor', 'Picaflor', 'pajaros', 'ambiente', {
      pos: true, preparar: (R) => cantoListo(R, 'picaflor'), prioridad: 2, nuevo: '4.11.1', llama: ['sonido.picaflor'], como: 'sonido.picaflor(pos, zumbido)', variantes: vs('Con', [['zumbido', 'Con zumbido de alas'], ['canto', 'Sólo el canto']]),
      tocar: (c) => c.R.sonido.picaflor(c.pos(4), c.v === 'zumbido'),
    }),
    entrada('ave-murcielago', 'Murciélagos (chillido)', 'pajaros', 'efectos', {
      pos: true, preparar: (R) => cantoListo(R, 'chillido'), llama: ['sonido.chillido'], como: 'sonido.chillido(pos)', nota: 'Único «pájaro» que sale por Efectos y no por El bosque.', tocar: (c) => c.R.sonido.chillido(c.pos(4)),
    }),
    entrada('animal-ciervo', 'El ciervo brama', 'pajaros', 'efectos', { pos: true, llama: ['sonido.bramido'], como: 'sonido.bramido(pos)', tocar: (c) => c.R.sonido.bramido(c.pos()) }),
    entrada('animal-jabali', 'Gruñido de jabalí', 'pajaros', 'efectos', { pos: true, llama: ['sonido.gruñido'], como: 'sonido.gruñido(pos)', tocar: (c) => c.R.sonido['gruñido'](c.pos()) }),
    entrada('animal-bicho', 'Zumbido de un bicho', 'pajaros', 'efectos', {
      pos: true, llama: ['sonido.zumbido'], como: 'sonido.zumbido(pos, largo)', variantes: vs('Largo', [['0.7', 'Corto'], ['1.6', 'Largo']]), tocar: (c) => c.R.sonido.zumbido(c.pos(), Number(c.v)),
    }),
    entrada('animal-chasquido', 'Chasquido de una brasa de leña', 'pajaros', 'efectos', { pos: true, llama: ['sonido.chasquido'], como: 'sonido.chasquido(pos)', tocar: (c) => c.R.sonido.chasquido(c.pos()) }),
  );

  // ============================================================ Bosque · viento, agua, lluvia, fuego (los bucles que maneja `actualizar`)
  agregar(
    bucle('viento', 'Viento entre los árboles y hojas', 'viento', 'ambiente', (c) => ({ viento: Number(c.v), bosque: 1 }), {
      forzando: 'viento, bosque', variantes: vs('Qué tan fuerte', [['0.3', 'Brisa'], ['0.7', 'Viento'], ['1', 'Temporal']], '0.7'),
      nota: 'Sigue sonando (el motor lo maneja con el mundo) hasta que lo apagues con Enter o con «Detener todo». Con «El bosque» en 0 no se oye.',
    }),
    entrada('viento-crujido', 'La estructura cruje con una racha', 'viento', 'ambiente', {
      llama: ['sonido.crujido'], como: 'sonido.crujido(espacio)', variantes: vs('Dónde', [['adentro', 'Adentro (tabla)'], ['alero', 'Bajo un alero'], ['carpa', 'En la carpa (lona)']]),
      tocar: (c) => c.R.sonido.crujido(c.v),
    }),
    bucle('arroyo', 'El arroyo corriendo (caudal, piedras, burbujas)', 'agua', 'ambiente', () => ({ arroyo: 1 }), { forzando: 'arroyo: 1' }),
    bucle('orilla', 'La orilla del lago (olas chicas)', 'agua', 'ambiente', () => ({ orilla: 1 }), { forzando: 'orilla: 1' }),
    bucle('cascada', 'La cascada', 'agua', 'ambiente', (c) => ({ cascada: { pos: c.pos(), fuerza: 1 } }), { pos: true, forzando: 'cascada' }),
    entrada('agua-chapoteo', 'Chapoteo en el agua', 'agua', 'efectos', {
      pos: true, llama: ['sonido.chapoteo'], como: 'sonido.chapoteo(pos, fuerza)', variantes: vs('Fuerza', [['0.6', 'Suave'], ['1', 'Normal'], ['1.5', 'Fuerte']], '1'),
      tocar: (c) => c.R.sonido.chapoteo(c.pos(), Number(c.v)),
    }),
    entrada('agua-chapuzon', 'Chapuzón', 'agua', 'efectos', { llama: ['sonido.chapuzon'], como: 'sonido.chapuzon()', tocar: (c) => c.R.sonido.chapuzon() }),
    bucle('lluvia', 'La lluvia sobre las hojas', 'lluvia', 'ambiente', (c) => ({ lluvia: Number(c.v), invierno: 0 }), {
      forzando: 'lluvia', variantes: vs('Cuánta', [['0.3', 'Llovizna'], ['0.7', 'Lluvia'], ['1', 'Temporal']], '0.7'),
    }),
    bucle('techo-lluvia', 'La lluvia sobre un techo', 'lluvia', 'ambiente', (c) => ({ techo: c.v, lluvia: 0.8, invierno: 0, espacio: c.v === 'lona' ? 'carpa' : 'adentro' }), {
      forzando: 'techo, lluvia, espacio', variantes: vs('Techo', [['chapa', 'De chapa'], ['tablas', 'De tablas'], ['lona', 'De lona (carpa)']]),
      nota: 'Es el sonido de estar adentro: la cama de gotas y cada gota por separado. Cambia el filtro de las paredes.',
    }),
    entrada('lluvia-gotas', 'Seis gotas sueltas en el techo', 'lluvia', 'ambiente', {
      llama: ['sonido.gotaEnTecho'], como: 'sonido.gotaEnTecho(techo, cuando)', variantes: vs('Techo', [['chapa', 'De chapa'], ['tablas', 'De tablas'], ['lona', 'De lona']]),
      tocar: (c) => { for (let i = 0; i < 6; i++) c.R.sonido.gotaEnTecho(c.v, i * 0.18); },
    }),
    entrada('trueno', 'El trueno', 'lluvia', 'ambiente', {
      llama: ['sonido.trueno'], como: 'sonido.trueno(lejos)', variantes: vs('Qué tan lejos', [['0.2', 'Cerca (con chasquido)'], ['0.5', 'Medio'], ['0.9', 'Lejos']], '0.5'),
      tocar: (c) => c.R.sonido.trueno(Number(c.v)),
    }),
    bucle('fuego', 'La fogata crepitando', 'fuego', 'efectos', (c) => ({ fuego: c.pos() }), { pos: true, forzando: 'fuego: pos' }),
    bucle('panal', 'El zumbido del panal', 'fuego', 'efectos', (c) => ({ panal: { pos: c.pos(), fuerza: 1 } }), { pos: true, forzando: 'panal' }),
    bucle('grillos', 'Los grillos de la noche', 'fuego', 'ambiente', () => ({ noche: 1, lluvia: 0, invierno: 0, otono: 0 }), { forzando: 'noche: 1, lluvia: 0' }),
  );

  // ============================================================ Pasos y trabajo
  const SUPERFICIES = Object.keys(SUELOS).concat(['agua']).filter((s, i, a) => a.indexOf(s) === i);
  agregar(
    entrada('paso', 'Un paso', 'trabajo', 'efectos', {
      llama: ['sonido.paso'], como: 'sonido.paso(superficie, fuerza, correr)', fuerza: true, variantes: vs('Suelo', SUPERFICIES.map((s) => [s, s[0].toUpperCase() + s.slice(1)]), 'hojarasca'),
      tocar: (c) => c.R.sonido.paso(c.v, c.fuerzaValor, false),
    }),
    entrada('caminata', 'Cuatro pasos caminando', 'trabajo', 'efectos', {
      llama: ['sonido.paso'], como: 'sonido.paso(superficie, fuerza, false) ×4', variantes: vs('Suelo', SUPERFICIES.map((s) => [s, s[0].toUpperCase() + s.slice(1)]), 'hojarasca'),
      tocar: (c) => { c.R.sonido.paso(c.v, 0.6, false); for (let i = 1; i < 4; i++) c.luego(() => c.R.sonido.paso(c.v, 0.6, false), i * 480); },
    }),
    entrada('carrera', 'Seis pasos corriendo', 'trabajo', 'efectos', {
      llama: ['sonido.paso'], como: 'sonido.paso(superficie, fuerza, true) ×6', variantes: vs('Suelo', SUPERFICIES.map((s) => [s, s[0].toUpperCase() + s.slice(1)]), 'hojarasca'),
      tocar: (c) => { c.R.sonido.paso(c.v, 0.8, true); for (let i = 1; i < 6; i++) c.luego(() => c.R.sonido.paso(c.v, 0.8, true), i * 270); },
    }),
    entrada('casco', 'El caballo: un casco', 'trabajo', 'efectos', {
      llama: ['sonido.casco'], como: 'sonido.casco(superficie, fuerza)', variantes: vs('Suelo', SUPERFICIES.map((s) => [s, s[0].toUpperCase() + s.slice(1)]), 'tierra'),
      tocar: (c) => c.R.sonido.casco(c.v, 0.8),
    }),
    entrada('hachazo', 'El hachazo en el tronco', 'trabajo', 'efectos', {
      pos: true, llama: ['sonido.hachazo'], como: 'sonido.hachazo(pos, hondura)', variantes: vs('Muesca', [['0.15', 'Superficial'], ['0.5', 'Media'], ['0.9', 'Honda']], '0.5'),
      tocar: (c) => c.R.sonido.hachazo(c.pos(), Number(c.v)),
    }),
    entrada('picazo', 'El pico en la piedra', 'trabajo', 'efectos', {
      pos: true, llama: ['sonido.picazo'], como: 'sonido.picazo(pos, avance)', variantes: vs('Avance', [['0.1', 'Recién empieza'], ['0.5', 'A la mitad'], ['1', 'La que se parte']], '0.5'),
      tocar: (c) => c.R.sonido.picazo(c.pos(), Number(c.v)),
    }),
    entrada('arbol-cae', 'Se cae un árbol', 'trabajo', 'efectos', {
      pos: true, llama: ['sonido.arbolCae'], como: 'sonido.arbolCae(pos, demora)', variantes: vs('Demora', [['1', 'Corta (1 s)'], ['1.5', 'Normal (1,5 s)'], ['2.5', 'Larga (2,5 s)']], '1.5'),
      nota: 'El más largo del juego: fibra que se rompe, arrastre entre las ramas, golpe contra el suelo.', tocar: (c) => c.R.sonido.arbolCae(c.pos(), Number(c.v)),
    }),
    entrada('impacto', 'Un golpe contra un material', 'trabajo', 'efectos', {
      pos: true, fuerza: true, llama: ['sonido.impacto'], como: 'sonido.impacto(material, { pos, fuerza })',
      variantes: vs('Material', Object.keys(MATERIALES).map((m) => [m, m[0].toUpperCase() + m.slice(1)]), 'tronco'),
      tocar: (c) => c.R.sonido.impacto(c.v, { pos: c.pos(), fuerza: c.fuerzaValor + 0.3 }),
    }),
  );

  // ============================================================ Gente y aldea
  const VOCES = { hombre: { edad: 40, mujer: false }, mujer: { edad: 35, mujer: true }, chico: { edad: 9, chico: true }, mayor: { edad: 72 } };
  const habla = (id, nombre, texto, nota) => entrada(id, nombre, 'gente', 'efectos', {
    pos: true, llama: ['sonido.balbuceo'], como: 'sonido.balbuceo(planBalbuceo(texto, vozDe(clave)), { pos, vol })', nota,
    variantes: vs('Voz', [['hombre', 'Hombre'], ['mujer', 'Mujer'], ['chico', 'Chico'], ['mayor', 'Mayor']]),
    tocar: (c) => c.R.sonido.balbuceo(planBalbuceo(texto, vozDe('banco-' + c.v, VOCES[c.v]), 7), { pos: c.pos(1.5 + 1.6), vol: 0.09 }),
  });
  agregar(
    habla('voz-vecino', 'Un vecino habla (murmullo)', 'Buen día, ¿cómo andás por acá?', 'No son palabras: dos o tres sílabas cálidas («mm-hm», «a-há»).'),
    habla('voz-risita', 'Un vecino se ríe (risita)', '¡Jajaja, qué bueno!', 'La risita corta de los vecinos.'),
    entrada('gente-bisagra', 'Una puerta que chirría', 'gente', 'efectos', { pos: true, llama: ['sonido.bisagra'], como: 'sonido.bisagra(pos)', tocar: (c) => c.R.sonido.bisagra(c.pos()) }),
    entrada('gente-portazo', 'Portazo', 'gente', 'efectos', { pos: true, llama: ['sonido.portazo'], como: 'sonido.portazo(pos)', tocar: (c) => c.R.sonido.portazo(c.pos()) }),
    entrada('gente-ladrido', 'Ladrido de un perro', 'gente', 'efectos', { pos: true, llama: ['sonido.ladrido'], como: 'sonido.ladrido(pos)', tocar: (c) => c.R.sonido.ladrido(c.pos()) }),
  );

  // ============================================================ Trochita, kayak y pesca
  agregar(
    entrada('silbato', 'El silbato de la trochita', 'vehiculos', 'efectos', {
      pos: true, llama: ['sonido.silbato'], como: 'sonido.silbato(pos, tipo)', variantes: vs('Silbato', Object.entries(SILBATOS).map(([id, s]) => [id, s.nombre])),
      nota: 'Campanas de vapor en acorde, soplido, corte y eco en el valle.', tocar: (c) => c.R.sonido.silbato(c.pos(3), c.v),
    }),
    entrada('riel', 'El riel que canta al pasar el tren', 'vehiculos', 'efectos', { pos: true, llama: ['sonido.riel'], como: 'sonido.riel(pos)', tocar: (c) => c.R.sonido.riel(c.pos()) }),
    entrada('frenos', 'Frenos del tren', 'vehiculos', 'efectos', { pos: true, llama: ['sonido.frenos'], como: 'sonido.frenos(pos, fuerza)', tocar: (c) => c.R.sonido.frenos(c.pos(), 1) }),
    entrada('traqueteo', 'El traqueteo de las ruedas', 'vehiculos', 'efectos', {
      pos: true, llama: ['sonido.traqueteo'], como: 'sonido.traqueteo(pos, fuerza, hueco)', variantes: vs('Sobre', [['tierra', 'Vía común'], ['hueco', 'Puente (hueco)']]),
      tocar: (c) => c.R.sonido.traqueteo(c.pos(), 1, c.v === 'hueco'),
    }),
    entrada('remada', 'Una remada', 'vehiculos', 'efectos', { llama: ['sonido.remada'], como: 'sonido.remada(fuerza)', tocar: (c) => c.R.sonido.remada(1) }),
    entrada('kayak-golpe', 'El kayak roza algo', 'vehiculos', 'efectos', { llama: ['sonido.golpeKayak'], como: 'sonido.golpeKayak()', tocar: (c) => c.R.sonido.golpeKayak() }),
    entrada('pesca-lanzar', 'Lanzar la caña', 'vehiculos', 'efectos', { llama: ['sonido.lanzar'], como: 'sonido.lanzar()', tocar: (c) => c.R.sonido.lanzar() }),
    entrada('pesca-carrete', 'El carrete', 'vehiculos', 'efectos', { llama: ['sonido.carrete'], como: 'sonido.carrete()', tocar: (c) => c.R.sonido.carrete() }),
    entrada('pesca-tension', 'La tensión del hilo', 'vehiculos', 'efectos', {
      llama: ['sonido.tension'], como: 'sonido.tension(nivel)', variantes: vs('Nivel', [['0.2', 'Flojo'], ['0.6', 'Medio'], ['1', 'A punto de cortarse']]), tocar: (c) => c.R.sonido.tension(Number(c.v)),
    }),
    entrada('pesca-corte', 'Se corta el hilo', 'vehiculos', 'efectos', { llama: ['sonido.corte'], como: 'sonido.corte()', tocar: (c) => c.R.sonido.corte() }),
  );

  // ============================================================ Música
  const NOTAS = [['50', 'Grave (re 2)'], ['62', 'Media (re 4)'], ['76', 'Aguda (mi 5)']];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  agregar(
    entrada('musica-frase', 'Una frase de la música del valle', 'musica', 'musica', {
      llama: ['sonido.frase'], como: 'sonido.frase(noche, paleta)', variantes: vs('Momento', [['dia', 'De día (verano)'], ['atardecer', 'Atardecer'], ['noche', 'De noche'], ['lluvia', 'Con lluvia'], ['invierno', 'Invierno']]),
      nota: 'Elige sola guitarra o quena, a veces con un colchón debajo. Repetila para oír las dos.',
      tocar: (c) => {
        const p = { dia: [{ horas: 12 }, 0], atardecer: [{ horas: 19 }, 0.3], noche: [{ horas: 23 }, 1], lluvia: [{ horas: 12, lluvia: 1 }, 0], invierno: [{ horas: 12, invierno: 1 }, 0] }[c.v];
        return c.R.sonido.frase(p[1], paletaMusical(p[0]));
      },
    }),
    entrada('musica-guitarra', 'Una nota de guitarra (cuerda pulsada)', 'musica', 'musica', {
      llama: ['sonido.pulsar'], como: 'sonido.pulsar(midi, { dur, vol, destino })', variantes: vs('Nota', NOTAS, '62'),
      tocar: (c) => c.R.sonido.pulsar(Number(c.v), { dur: 3, vol: 0.14 * Math.pow(2, (Number(c.v) - 57) / 24), destino: c.R.sonido.bus.musica }),
    }),
    entrada('musica-quena', 'Una nota de quena', 'musica', 'musica', {
      llama: ['sonido.quena'], como: 'sonido.quena(frec, { dur, vol, destino })', variantes: vs('Nota', NOTAS, '62'),
      tocar: (c) => c.R.sonido.quena(hz(Number(c.v)), { dur: 2, vol: 0.03, destino: c.R.sonido.bus.musica }),
    }),
    entrada('musica-colchon', 'El colchón que sostiene la nota', 'musica', 'musica', {
      llama: ['sonido.colchon'], como: 'sonido.colchon(frec, { dur, vol, destino })', variantes: vs('Nota', NOTAS, '50'),
      tocar: (c) => c.R.sonido.colchon(hz(Number(c.v) - 12), { dur: 5, vol: 0.03, destino: c.R.sonido.bus.musica }),
    }),
    entrada('gramola', 'La gramola', 'musica', 'musica', {
      continuo: true, nuevo: '4.11.1', prioridad: 2, llama: ['gramola.alternar'], como: 'alternarGramola(sonido, cerca, obra, tema)',
      variantes: vs('Tema', TEMAS.map((t) => [t.id, t.nombre])), nota: 'Caja de música vieja con un crujido de púa. Desde la 4.11.1 sale por «Música». Dura un minuto o dos; «Detener todo» la para.',
      tocar: (c) => { if (c.R.gramola.suena()) c.R.gramola.detener(); return c.R.gramola.alternar(c.R.sonido, () => true, null, c.v); },
    }),
    entrada('piano-misterio', 'El piano de misterio de los duendes', 'musica', 'musica', {
      llama: ['sonido.pianoMisterio'], como: 'sonido.pianoMisterio(frase)', preparar: (R) => { for (let k = 0; k < FRASES_PIANO.length; k++) R.sonido.prepararPiano(k); },
      variantes: vs('Frase', FRASES_PIANO.map((f, i) => [String(i), f.id[0].toUpperCase() + f.id.slice(1)])), nota: 'Una frase por noche cuando salen. Sale por Música.',
      tocar: (c) => c.R.sonido.pianoMisterio(Number(c.v)),
    }),
  );

  // ============================================================ Radio de madrugada
  const emisora = (id, nombre, nombreBuffer, crear, o = {}) => entrada(id, nombre, 'radio', 'efectos', {
    continuo: true, nuevo: '4.11.1', prioridad: 2, llama: ['sonido.preparar', 'radio.emitir'], como: 'sonido.preparar(...) + emitirEmisora(sonido, buffer)',
    preparar: (R, v) => R.sonido.preparar(nombreBuffer(v), () => crear(v), null, TASA_RADIO),
    tocar: (c) => { let e = null; c.R.sonido.preparar(nombreBuffer(c.v), () => crear(c.v), (buf) => { e = c.R.radio.emitir(c.R.sonido, buf); }, TASA_RADIO); if (e) c.emision(e); return e; },
    ...o,
  });
  agregar(
    emisora('radio-tango', 'Un tango viejo entre la estática', () => 'radio-mad-tango', () => sintetizarTango(TASA_RADIO, 7), { nota: 'Orquesta lejana que se pierde antes del final. Dura más de un minuto; «Detener todo» lo corta.' }),
    emisora('radio-morse', 'Alguien transmite en Morse', (v) => `radio-mad-morse-${MENSAJES_MORSE.indexOf(v)}`, (v) => sintetizarMorse(v, TASA_RADIO, 11 + MENSAJES_MORSE.indexOf(v)), {
      variantes: vs('Mensaje', MENSAJES_MORSE.map((m) => [m, m[0] + m.slice(1).toLowerCase()])),
    }),
  );

  // ============================================================ Interfaz y avisos
  agregar(
    entrada('ui-anotar', 'Anotar en el cuaderno', 'interfaz', 'efectos', { llama: ['sonido.anotar'], como: 'sonido.anotar()', nota: 'Cinco rasgueos de lápiz y dos notas de cuerda.', tocar: (c) => c.R.sonido.anotar() }),
    entrada('ui-juntar', 'Juntar algo del suelo', 'interfaz', 'efectos', { llama: ['sonido.juntar'], como: 'sonido.juntar()', tocar: (c) => c.R.sonido.juntar() }),
    entrada('ui-encender', 'Prender fuego', 'interfaz', 'efectos', { llama: ['sonido.encender'], como: 'sonido.encender()', tocar: (c) => c.R.sonido.encender() }),
    entrada('ui-obturador', 'Sacar una foto', 'interfaz', 'efectos', { llama: ['sonido.obturador'], como: 'sonido.obturador()', tocar: (c) => c.R.sonido.obturador() }),
    entrada('ui-logro', 'Un logro (también las habilidades, trofeos y placas)', 'interfaz', 'efectos', {
      llama: ['sonido.pulsar'], como: 'sonido.pulsar(76, …) + sonido.pulsar(83, …)',
      nota: 'Esas tres cosas no tienen un sonido propio: avisan con este par de notas de cuerda (mi y si).',
      tocar: (c) => { c.R.sonido.pulsar(76, { dur: 1.2, vol: 0.1, destino: c.R.sonido.bus.efectos }); return c.R.sonido.pulsar(83, { cuando: 0.12, dur: 1.4, vol: 0.09, destino: c.R.sonido.bus.efectos }); },
    }),
  );
  return L;
}
export const CATALOGO = crearCatalogo();

// ---------------------------------------------------------------- el banco en marcha
const ahoraMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// `R` es el motor de pruebas (`armarMotor`). Devuelve el control del banco: abrir, cerrar, tocar, detenerTodo, estado.
export function crearBancoSonidos(R, { catalogo = CATALOGO, tiempo = ahoraMs } = {}) {
  const sonido = R.sonido;
  const porId = new Map(catalogo.map((e) => [e.id, e]));
  let abierto = false, relaxAntes = false, restaurar = null, actualizarOriginal = null;
  let enCurso = false, drenando = false, ventanaHasta = 0, generacion = 0;
  const fuentes = new Set();            // las fuentes de audio que nacieron de un sonido del banco y todavía no terminaron
  const emisiones = new Set();          // las emisoras de radio sonando
  const timers = new Set();
  const forzados = new Map();           // id de bucle -> lo que se le fuerza al mundo
  let ultimo = null;                    // { id, nombre, bus, creadas, desde }

  function contexto(e, o) {
    const dist = DISTANCIAS.find((d) => d.id === o.distancia) || DISTANCIAS[0];
    const lado = LADOS.find((l) => l.id === o.lado) || LADOS[0];
    const fuerza = FUERZAS.find((f) => f.id === o.fuerza) || FUERZAS[1];
    const variante = e.variantes ? (e.variantes.opciones.some((v) => v.id === o.variante) ? o.variante : e.variantes.defecto) : null;
    return {
      R, e, v: variante, distancia: dist.metros, lado: lado.grados, fuerzaValor: fuerza.valor,
      // un punto a `distancia` metros del que escucha, del lado elegido; `alto`: metros sobre el piso
      pos: (alto = 0) => lugarDe(R, dist.metros, lado.grados, alto),
      luego: (f, ms) => { const t = setTimeout(() => { timers.delete(t); try { f(); } catch { /* ya */ } }, ms); timers.add(t); },
      alternarBucle: (id, parcial) => {
        if (forzados.has(id)) { forzados.delete(id); return { encendido: false }; }
        forzados.set(id, parcial);
        return { encendido: true };
      },
      emision: (x) => { emisiones.add(x); x.fuente.addEventListener?.('ended', () => { emisiones.delete(x); }); },
    };
  }

  function registrar(nodo) {
    if (drenando || (!enCurso && tiempo() > ventanaHasta)) return;   // (lo que nace al terminar la cola —los bucles del ambiente— no es del banco)
    fuentes.add(nodo);
    if (ultimo) { ultimo.creadas++; if (ultimo.fuentes.length < 400) ultimo.fuentes.push(nodo); }   // (las fuentes quedan para que una partida de prueba lea el grafo)
    nodo.addEventListener?.('ended', () => { fuentes.delete(nodo); });
  }
  function instalar() {
    const ctx = sonido.ctx;
    const propios = {};
    for (const k of ['createBufferSource', 'createOscillator']) {
      if (typeof ctx[k] !== 'function') continue;
      const original = ctx[k];
      propios[k] = Object.hasOwn(ctx, k) ? original : null;
      ctx[k] = function (...a) { const n = original.apply(ctx, a); registrar(n); return n; };
    }
    return () => { for (const k of Object.keys(propios)) { if (propios[k]) ctx[k] = propios[k]; else delete ctx[k]; } };
  }

  async function drenar(maxMs = 5000) {
    const t0 = tiempo();
    while (sonido.cola?.length && tiempo() - t0 < maxMs) {
      drenando = true;
      try { sonido.trabajarCola(40); } finally { drenando = false; }
      await dormir(0);
    }
  }

  let gramolaDeLaCasa = false;   // 4.12.2
  function abrir() {
    if (abierto) return true;
    sonido.iniciar?.();
    if (!sonido.ctx) return false;
    abierto = true;
    gramolaDeLaCasa = !!R.gramola.suena?.();   // 4.12.2: si ya sonaba la gramola de tu casa, no es del banco: abrir y cerrar (o Detener todo) no la corta
    // en el Relax los duendes son leyenda y los sonidos del Desafío no suenan: mientras el banco está abierto sí (se restaura al cerrar)
    relaxAntes = !!sonido.relax; sonido.relax = false;
    restaurar = instalar();
    // los bucles del ambiente: se les fuerza el estado del mundo que pidan (el original sigue andando con el resto)
    actualizarOriginal = Object.hasOwn(sonido, 'actualizar') ? sonido.actualizar : null;
    const real = Object.getPrototypeOf(sonido).actualizar;
    sonido.actualizar = function (dt, e) {
      if (!forzados.size) return real.call(sonido, dt, e);
      return real.call(sonido, dt, Object.assign({}, e, ...forzados.values()));
    };
    return true;
  }

  // Corta todo lo que lanzó el banco: las fuentes vivas (con un fundido corto de la mezcla para que no haga clic), la gramola, la radio, los bucles
  // forzados y los silencios raros. No toca el ambiente ni la música propios del juego.
  function detenerTodo() {
    generacion++;
    ventanaHasta = 0;   // lo que nazca después ya no es de lo que se cortó
    for (const t of timers) clearTimeout(t);
    timers.clear();
    forzados.clear();
    if (!gramolaDeLaCasa) { try { R.gramola.detener(); } catch { /* ya */ } }   // 4.12.2: la de la casa que ya sonaba antes de abrir el banco queda como estaba
    const ctx = sonido.ctx;
    if (!ctx) return 0;
    const t = ctx.currentTime;
    const cuantas = fuentes.size;
    const m = sonido.master?.gain;
    // un fundido de 40 ms de la salida general, se cortan las fuentes cuando ya casi no se oye, y la salida vuelve a su volumen
    if (m && cuantas + emisiones.size) {
      try {
        m.cancelScheduledValues(t);
        m.setValueAtTime(m.value, t);
        m.linearRampToValueAtTime(0.0001, t + 0.04);
      } catch { /* ya */ }
    }
    for (const e of emisiones) { try { e.salida.gain.cancelScheduledValues(t); e.salida.gain.setTargetAtTime(0, t, 0.02); e.fuente.stop(t + 0.06); } catch { /* ya */ } }
    emisiones.clear();
    for (const s of fuentes) { try { s.stop(t + 0.06); } catch { /* todavía no arrancó o ya terminó */ } }
    fuentes.clear();
    if (m && cuantas) {
      try { m.setValueAtTime(0.0001, t + 0.07); m.setTargetAtTime(sonido.volumen, t + 0.07, 0.03); } catch { /* ya */ }
    }
    try { sonido.romperSilencio?.(); } catch { /* ya */ }
    sonido.risasSonando = [];   // el tope de risas a la vez (tres) cuenta las que cortamos
    try { sonido.bajaMusica?.gain.setTargetAtTime(1, t, 0.1); } catch { /* ya */ }
    if (ultimo) ultimo.cortado = true;
    return cuantas;
  }

  function cerrar() {
    if (!abierto) return;
    detenerTodo();
    abierto = false;
    gramolaDeLaCasa = false;
    if (restaurar) { try { restaurar(); } catch { /* ya */ } restaurar = null; }
    if (actualizarOriginal) sonido.actualizar = actualizarOriginal; else delete sonido.actualizar;
    sonido.relax = relaxAntes;
  }

  // Dispara un sonido del catálogo. `o`: { variante, distancia, lado, fuerza }.
  async function tocar(id, o = {}) {
    const e = porId.get(id);
    if (!e) return { ok: false, motivo: 'Ese sonido no existe' };
    if (id === 'gramola') gramolaDeLaCasa = false;   // 4.12.2: desde acá la gramola es del banco (la prende o la apaga él)
    if (!abierto && !abrir()) return { ok: false, motivo: 'El sonido todavía no arrancó' };
    const ctx = sonido.ctx;
    try { if (ctx.state === 'suspended') await ctx.resume(); } catch { /* sigue */ }
    const c = contexto(e, o);
    const gen = generacion;
    ultimo = { id: e.id, nombre: e.nombre, bus: e.bus, busNombre: NOMBRE_BUS[e.bus], creadas: 0, fuentes: [], desde: tiempo(), cortado: false, continuo: !!e.continuo, bucle: !!e.bucle };
    const mio = ultimo;
    // lo que se sintetiza de antemano (risas, raíces, rama que cruje…) tiene que estar hecho: si no, el motor toca la versión de antes
    try { e.preparar?.(R, c.v); } catch { /* el sonido avisará */ }
    if (sonido.cola?.length) await drenar();
    if (gen !== generacion) return { ok: false, motivo: 'Cortado antes de sonar' };
    ultimo = mio;
    let resultado;
    enCurso = true;
    try { resultado = e.tocar(c); }
    catch (err) { enCurso = false; return { ok: false, motivo: String(err?.message || err) }; }
    enCurso = false;
    ventanaHasta = tiempo() + 2500;
    return { ok: true, resultado, id: e.id, bus: e.bus, busNombre: NOMBRE_BUS[e.bus], encendido: resultado && typeof resultado === 'object' && 'encendido' in resultado ? resultado.encendido : undefined };
  }

  function estado() {
    const sonando = fuentes.size > 0 || forzados.size > 0 || !!R.gramola.suena() || emisiones.size > 0;
    return {
      abierto, sonando, fuentesVivas: fuentes.size, bucles: [...forzados.keys()], gramola: !!R.gramola.suena(), emisoras: emisiones.size,
      preparando: (sonido.cola?.length || 0) > 0, ultimo: ultimo ? { ...ultimo } : null,
    };
  }

  return { catalogo, porId, abrir, cerrar, tocar, detenerTodo, estado, drenar, get abierto() { return abierto; } };
}

// Un punto a `metros` del que escucha, hacia donde mira girado `grados` (0 = al frente, 90 = a la derecha), `alto` metros sobre el piso
export function lugarDe(R, metros, grados, alto = 0) {
  const o = R.sonido.oyente || { x: 0, y: 1.7, z: 0 };
  const f = R.adelante?.() || { x: 0, z: -1 };
  const largo = Math.hypot(f.x, f.z) || 1;
  const fx = f.x / largo, fz = f.z / largo;
  const rx = -fz, rz = fx;   // a la derecha de quien mira (con y hacia arriba)
  const a = (grados * Math.PI) / 180;
  const dx = fx * Math.cos(a) + rx * Math.sin(a), dz = fz * Math.cos(a) + rz * Math.sin(a);
  return { x: o.x + dx * metros, y: (o.y ?? 1.7) - 1.6 + alto, z: o.z + dz * metros };
}
