// Progreso y ajustes en el almacenamiento local.
// RC2: guardado transaccional, migraciones y saneamiento de datos.
import { GRILLA_EXPLORADA } from './mapa.js';
import { LIMITE, sanearDistancia, sanearPlantas } from './config.js';
import { sanearDesafio } from './desafio-reglas.js';
import { sanearChinches } from './chinches.js';
import { sanearTalados } from './bosque.js';
import { sanearBase } from './encargos-temporada.js';
import { sanearGrabaciones } from './grabador.js';
import { sanearHuerta, desdeCanteroViejo, claveCantero } from './huerta.js';
import { sanearGallineros } from './gallinero.js';
import { sanearFeria } from './feria.js';
import { sanearVisitas, visitasNuevas } from './visitas.js';
import { sanearMajada, majadaNueva } from './majada.js';
import { sanearCorral } from './corral.js';
import { sanearCorreo, correoNuevo } from './correo.js';
import { sanearTormenta, tormentaNueva } from './tormenta.js';
import { sanearCaballo, caballoNuevo } from './caballo.js';
// 2.8: lo personal (ropa, interfaz, bandera, recetas… ver personalizacion.js)
import { sanearPersonal } from './personal-todo.js';
import { sanearComercio, comercioNuevo } from './comercio.js';
// 2.9: dónde quedó el velero
import { sanearVela } from './vela-reglas.js';
// 3.1: los récords de las carreras y el desafío del día (ver carreras.js y diarios.js)
import { sanearCarreras } from './carreras.js';
import { sanearDiarios } from './diarios.js';
// 3.1: la historia guiada y los eventos del valle
import { sanearHistoria } from './historia.js';
import { sanearEventosValle } from './eventos-valle.js';
// 3.1: rangos y oficios
import { sanearOficios, oficiosNuevos } from './oficios.js';
// 3.6: la Aldea de los Duendes (reemplaza al pueblo que fundabas en la 3.1)
import { sanearAldea, aldeaNueva, migrarDesdePueblo } from './aldea.js';
// 3.6: la vecindad (amistad, ganas y memoria de los vecinos; ver vecindad.js)
import { sanearVecindad, vecindadNueva } from './vecindad.js';
// 3.6 (mecánicas): lo de cada lugar de la aldea (el aljibe del día, el libro prestado)
import { sanearMecanicas, mecanicasNuevas } from './aldea-mecanicas.js';
// 3.7.0: la vida de la aldea (calendario, visitantes, mascota, apodo, familia, cartas) y su ritmo
import { sanearVidaAldea, vidaNueva, sanearRitmo } from './aldea-vida.js';
// 3.7.1: el amor en la aldea (y el ajuste para apagarlo)
import { sanearAmor, amorNuevo, sanearAjusteRomance } from './amor.js';
// 3.7.2: la cocina en pasos (el recetario, los trueques del día con los vecinos, las estaciones móviles)
import { sanearCocina, cocinaNueva, sanearCoccion } from './cocina-pasos.js';
// 3.7.2 (granja): la vaca, los chanchos, los corderos y los frutales (sólo en el Relax)
import { sanearGranja, granjaNueva } from './granja.js';

// Cada modo tiene su propia partida: jugar al Desafío nunca pisa el recorrido
// tranquilo (Relax), que conserva las claves históricas.
let CLAVE = 'hojarasca-v1';
let CLAVE_BACKUP = 'hojarasca-v1-backup';
const CLAVE_AJUSTES = 'hojarasca-ajustes-v1';
let CLAVE_FOTOS = 'hojarasca-fotos-v1';
let CLAVE_VISTA = 'hojarasca-vista-v1';
let modoPartida = 'relax';
let ranuraPartida = 1;
export const MODOS = ['relax', 'desafio'];
// Tres partidas por modo. La primera conserva las claves históricas para no
// pisar lo que ya estaba guardado antes de que existieran las ranuras.
export const RANURAS = [1, 2, 3];
// 3.0: la supervivencia sin fin guarda su corrida aparte, en una ranura propia del Desafío
// que no aparece en el menú de partidas: una corrida nunca pisa una campaña.
export const RANURA_SIN_FIN = 'sinfin';
function sufijoDe(modo, ranura) {
  if (modo === 'desafio' && ranura === RANURA_SIN_FIN) return '-desafio-sinfin';
  return (modo === 'relax' ? '' : `-${modo}`) + (Number(ranura) > 1 ? `-p${Math.floor(Number(ranura))}` : '');
}
function clavesDe(modo, ranura) {
  const s = sufijoDe(modo, ranura);
  return { principal: `hojarasca${s}-v1`, backup: `hojarasca${s}-v1-backup`, fotos: `hojarasca${s}-fotos-v1`, vista: `hojarasca${s}-vista-v1` };
}
export function usarModoGuardado(modo, ranura = ranuraPartida) {
  modoPartida = MODOS.includes(modo) ? modo : 'relax';
  ranuraPartida = modoPartida === 'desafio' && ranura === RANURA_SIN_FIN ? RANURA_SIN_FIN   // 3.0
    : RANURAS.includes(Math.floor(Number(ranura))) ? Math.floor(Number(ranura)) : 1;
  const k = clavesDe(modoPartida, ranuraPartida);
  CLAVE = k.principal;
  CLAVE_BACKUP = k.backup;
  CLAVE_FOTOS = k.fotos;
  CLAVE_VISTA = k.vista;
  ultimoPrincipalValidoTexto = null;
  return modoPartida;
}
export function ranuraActual() { return ranuraPartida; }
export function hayPartidaGuardada(modo, ranura = 1) {
  const k = clavesDe(modo, ranura);
  return progresoPlausible(leer(k.principal)) || progresoPlausible(leer(k.backup));
}
// Lo que muestra el menú de partidas: día, hora, modo y una miniatura.
// 2.6.1: el primero que sea una partida. Con `leer(principal) || leer(backup)`, un
// principal que era JSON pero no partida tapaba al backup bueno: la ranura se veía vacía.
function leerPlausible(k) {
  const p = leer(k.principal);
  return progresoPlausible(p) ? p : leer(k.backup);
}
export function infoPartida(modo, ranura) {
  const k = clavesDe(modo, ranura);
  const p = leerPlausible(k);
  if (!progresoPlausible(p)) return { modo, ranura, hay: false };
  let vista = null;
  try { vista = localStorage.getItem(k.vista); } catch {}
  return {
    modo, ranura, hay: true,
    dia: Math.max(1, Math.floor(finito(p.dia, 1))),
    horas: ((finito(p.horas, 8) % 24) + 24) % 24,
    guardadoEn: finito(p.guardadoEn, 0),
    noches: finito(p.desafio?.noches, 0),
    anotaciones: Object.keys(obj(p.entradas)).length,
    vista,
  };
}
export function listaPartidas(modo) { return RANURAS.map((r) => infoPartida(modo, r)); }
// Lo guardado en una ranura, tal cual está, para poder empaquetarlo y llevárselo.
export function leerPartida(modo, ranura) {
  const k = clavesDe(modo, ranura);
  const p = leerPlausible(k);
  if (!progresoPlausible(p)) return null;
  const fotos = leer(k.fotos) || {};
  let vista = null;
  try { vista = localStorage.getItem(k.vista); } catch {}
  return { progreso: p, fotos, vista };
}
// Escribe una partida que viene de afuera. Se sanea igual que cualquier otra: un
// archivo retocado a mano no puede dejar la partida en un estado imposible.
export function escribirPartida(modo, ranura, progreso, fotos = {}, vista = null) {
  const modoAnterior = modoPartida, ranuraAnterior = ranuraPartida;
  try {
    usarModoGuardado(modo, ranura);
    const limpio = sanearProgreso(progreso);
    if (!limpio) return false;
    const ok = guardarProgreso(limpio);
    if (ok) {
      // 2.4.1: `leerPartida` entrega las fotos como están guardadas ({ id: imagen }), y
      // `guardarFotos` espera los desafíos ({ id: { img } }): pasadas tal cual, importar o
      // sincronizar dejaba el álbum vacío. Se aceptan las dos formas.
      const imagenes = {};
      for (const [k, v] of Object.entries(obj(fotos))) {
        const img = typeof v === 'string' ? v : v?.img;
        if (typeof img === 'string' && img.startsWith('data:image')) imagenes[k] = { img };
      }
      guardarFotos(imagenes);
      // 3.5.1: sin miniatura en el archivo, la de la partida que se reemplazó no queda pegada
      if (vista) guardarVista(vista);
      else { try { localStorage.removeItem(CLAVE_VISTA); } catch {} }
    }
    return ok;
  } catch { return false; }
  finally { usarModoGuardado(modoAnterior, ranuraAnterior); }
}
export function borrarPartida(modo, ranura) {
  const k = clavesDe(modo, ranura);
  if (k.principal === CLAVE) ultimoPrincipalValidoTexto = null;
  try { for (const clave of Object.values(k)) localStorage.removeItem(clave); return true; } catch { return false; }
}
// La miniatura de la partida se guarda aparte: pesa más que todo lo demás.
export function guardarVista(datos) {
  if (typeof datos !== 'string' || !datos.startsWith('data:image')) return false;
  try { localStorage.setItem(CLAVE_VISTA, datos); return true; } catch { return false; }
}
export const VERSION_GUARDADO = 2;
let ultimoOrigenCarga = 'ninguno';
// RC24: cache de la última copia principal ya validada. Evita releer y
// parsear localStorage en cada guardado manteniendo el backup transaccional.
let ultimoPrincipalValidoTexto = null;
export function origenUltimaCarga() { return ultimoOrigenCarga; }

export const AJUSTES_BASE = {
  calidad: 'media', estacion: 'verano', clima: 'variable', duracion: 30, limiteFps: 'auto', virado: 'suave',
  volumen: 0.8, musica: true, volumenAmbiente: 1, volumenEfectos: 1, volumenMusica: 1, sensibilidad: 1, invertirY: false, fov: 70, movimientoCamara: 'normal', modo: 'relax', dificultad: 'normal', ranura: 1, autoCalidad: true, guiaPrimerDia: true, idioma: 'es',
  tamanoLetra: 'normal', paleta: 'normal', subtitulos: false, teclas: {},
  // 2.0: los sonidos del Desafío escritos con dirección, y el mando que vibra
  sonidosEscritos: true, vibracion: true,
  // 3.0: en el Desafío, la campaña de siempre o la supervivencia sin fin
  desafioTipo: 'campana',
  // 3.1: en el Relax, libre o con la historia guiada
  relaxTipo: 'libre',
  // 3.3: modo fluido (resolución dinámica entre 70% y 100%), apagado de fábrica
  modoFluido: false,
  // 3.5: distancia de dibujo ('calidad' = la de cada calidad, o bloques de 40 m) y de plantas
  distancia: 'calidad', distanciaPlantas: 'normal',
  // 3.7.0: el ritmo de la aldea (cuántos visitantes, cartas, visitas y chismes): tranquilo, normal o animado
  ritmoAldea: 'normal',
  // 3.7.1: el romance (coquetear, citas, casamiento, hijos): encendido de fábrica; apagado, no aparece nada
  romance: true,
};

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const finito = (v, defecto) => Number.isFinite(Number(v)) ? Number(v) : defecto;
const acotar = (v, min, max, defecto) => Math.min(max, Math.max(min, finito(v, defecto)));
const opcion = (v, permitidas, defecto) => permitidas.includes(v) ? v : defecto;

function parsear(texto) {
  if (!texto) return null;
  try { const v = JSON.parse(texto); return objeto(v) ? v : null; } catch { return null; }
}
function leer(clave) {
  try { return parsear(localStorage.getItem(clave)); } catch { return null; }
}
function progresoPlausible(v) {
  if (!objeto(v)) return false;
  // Compatible con saves viejos sin número de versión, pero no con un JSON
  // cualquiera que casualmente haya quedado bajo la misma clave.
  return ['entradas', 'dia', 'horas', 'cosas', 'pos', 'tomados'].some((k) => Object.prototype.hasOwnProperty.call(v, k));
}
function escribirTexto(clave, texto) {
  try {
    localStorage.setItem(clave, texto);
    return localStorage.getItem(clave) === texto && !!parsear(texto);
  } catch { return false; }
}
function escribir(clave, valor) {
  try { return escribirTexto(clave, JSON.stringify(valor)); } catch { return false; }
}

// 3.2: los ajustes llevan versión. En la 2 el límite de cuadros de fábrica pasó de 60 a
// 'auto' (según el monitor: ver `planCadencia` en rendimiento.js). Los ajustes de antes no
// distinguían el 60 de fábrica del elegido, así que un 60 viejo pasa a 'auto'; desde acá, un
// 60 elegido a mano se guarda con la versión nueva y se respeta.
export const VERSION_AJUSTES = 2;
export const LIMITES_FPS = ['auto', 30, 60, 120, 'libre'];
// `versionAjustes`: la de los ajustes guardados (sin versión = de antes de la 3.2)
export function sanearLimiteFps(v, versionAjustes) {
  const viejo = !(Number(versionAjustes) >= VERSION_AJUSTES);
  const fps = v === 'libre' || v === 'auto' ? v : opcion(finito(v, AJUSTES_BASE.limiteFps), [30, 60, 120], AJUSTES_BASE.limiteFps);
  return viejo && fps === 60 ? 'auto' : fps;
}

function sanearAjustes(a) {
  const x = objeto(a) ? a : {};
  const dur = x.duracion === 'reloj' ? 'reloj' : opcion(finito(x.duracion, AJUSTES_BASE.duracion), [20, 30, 45], AJUSTES_BASE.duracion);
  const fps = sanearLimiteFps(x.limiteFps, x.versionAjustes);
  return {
    versionAjustes: VERSION_AJUSTES,
    calidad: opcion(x.calidad, ['muybaja', 'baja', 'media', 'alta'], AJUSTES_BASE.calidad),
    estacion: opcion(x.estacion, ['verano', 'otono', 'invierno', 'auto'], AJUSTES_BASE.estacion),
    clima: opcion(x.clima, ['variable', 'despejado', 'lluvioso'], AJUSTES_BASE.clima),
    duracion: dur,
    limiteFps: fps,
    virado: opcion(x.virado, ['suave', 'apagado'], AJUSTES_BASE.virado),
    volumen: acotar(x.volumen, 0, 1, AJUSTES_BASE.volumen),
    volumenAmbiente: acotar(x.volumenAmbiente, 0, 1, AJUSTES_BASE.volumenAmbiente),
    volumenEfectos: acotar(x.volumenEfectos, 0, 1, AJUSTES_BASE.volumenEfectos),
    volumenMusica: acotar(x.volumenMusica, 0, 1, AJUSTES_BASE.volumenMusica),
    musica: typeof x.musica === 'boolean' ? x.musica : AJUSTES_BASE.musica,
    sensibilidad: acotar(x.sensibilidad, 0.3, 2.5, AJUSTES_BASE.sensibilidad),
    invertirY: typeof x.invertirY === 'boolean' ? x.invertirY : AJUSTES_BASE.invertirY,
    fov: acotar(x.fov, 60, 90, AJUSTES_BASE.fov),
    movimientoCamara: opcion(x.movimientoCamara, ['normal', 'reducido'], AJUSTES_BASE.movimientoCamara),
    modo: opcion(x.modo, MODOS, AJUSTES_BASE.modo),
    dificultad: opcion(x.dificultad, ['tranquila', 'normal', 'implacable'], AJUSTES_BASE.dificultad),
    ranura: opcion(Math.floor(finito(x.ranura, 1)), RANURAS, 1),
    idioma: opcion(x.idioma, ['es', 'en'], AJUSTES_BASE.idioma),
    autoCalidad: typeof x.autoCalidad === 'boolean' ? x.autoCalidad : AJUSTES_BASE.autoCalidad,
    guiaPrimerDia: typeof x.guiaPrimerDia === 'boolean' ? x.guiaPrimerDia : AJUSTES_BASE.guiaPrimerDia,
    tamanoLetra: opcion(x.tamanoLetra, ['normal', 'grande', 'enorme'], AJUSTES_BASE.tamanoLetra),
    paleta: opcion(x.paleta, ['normal', 'protanopia', 'deuteranopia', 'tritanopia'], AJUSTES_BASE.paleta),
    subtitulos: typeof x.subtitulos === 'boolean' ? x.subtitulos : AJUSTES_BASE.subtitulos,
    sonidosEscritos: typeof x.sonidosEscritos === 'boolean' ? x.sonidosEscritos : AJUSTES_BASE.sonidosEscritos,
    vibracion: typeof x.vibracion === 'boolean' ? x.vibracion : AJUSTES_BASE.vibracion,
    desafioTipo: opcion(x.desafioTipo, ['campana', 'sinfin'], AJUSTES_BASE.desafioTipo),
    relaxTipo: opcion(x.relaxTipo, ['libre', 'historia'], AJUSTES_BASE.relaxTipo),
    modoFluido: typeof x.modoFluido === 'boolean' ? x.modoFluido : AJUSTES_BASE.modoFluido,
    distancia: sanearDistancia(x.distancia),   // 3.5 (un guardado viejo: la de su calidad)
    distanciaPlantas: sanearPlantas(x.distanciaPlantas),
    ritmoAldea: sanearRitmo(x.ritmoAldea),   // 3.7.0
    romance: sanearAjusteRomance(x.romance),   // 3.7.1 (sin el ajuste guardado: encendido)
    teclas: objeto(x.teclas) ? x.teclas : {},
  };
}

export function cargarAjustes() { return sanearAjustes(leer(CLAVE_AJUSTES)); }
export function guardarAjustes(a) { return escribir(CLAVE_AJUSTES, sanearAjustes(a)); }

export function progresoNuevo() {
  const desafio = modoPartida === 'desafio';
  return {
    versionGuardado: VERSION_GUARDADO,
    modo: modoPartida,
    // El Desafío arranca con hacha y algo de material: la primera noche llega pronto.
    ...(desafio ? { desafio: sanearDesafio(null) } : {}),
    entradas: {}, tomados: [], ramitas: 0, fotos: 0, peces: {}, desafios: {}, encargos: {}, cosas: desafio ? { hacha: 1 } : {}, vueltas: 0, carpa: null, diario: [], renovales: [], talados: [], acopio: {}, huerta: {}, gallineros: {}, feria: { dia: 0, tomadas: [] }, visitas: visitasNuevas(), majada: majadaNueva(), correo: correoNuevo(), tormenta: tormentaNueva(), caballo: caballoNuevo(), chinches: [], pescaTarde: 0, guiaDia: 0, barra: [], ranura: 0, materiales: desafio ? { tronco: 6, tabla: 6, piedra: 6 } : {}, obras: [], pistas: {},
    horas: 8.2, dia: 1, pos: null, yaw: 0,
    // 2.8: cada sección de Personalizar con lo suyo de fábrica
    personal: sanearPersonal(null),
    // 2.9: el comercio por la trochita y los fletes (ver `comercio.js`)
    comercio: comercioNuevo(),
    // 3.1: los oficios empiezan en cero. 3.6: la aldea, como el primer día (ya no hay `pueblo`;
    // 3.6.1: y en el Desafío, ninguna: allá no hay aldea)
    oficios: oficiosNuevos(), ...(desafio ? {} : { aldea: aldeaNueva(), vidaAldea: vidaNueva(1), amor: amorNuevo() }),   // (3.7.0: y la vida de la aldea; 3.7.1: y el amor)
    ...(desafio ? {} : { cocina: cocinaNueva() }),   // 3.7.2: la cocina (el recetario de siempre, nada al fuego)
    // 3.6: la vecindad: nadie te conoce todavía
    vecindad: vecindadNueva(),
    // 3.6 (mecánicas): sin agua sacada ni libro prestado
    mecanicas: mecanicasNuevas(),
    // 3.7.2 (granja): vacía (en el Desafío, ninguna); la semilla decide el pelaje de la vaca, los mellizos y las camadas
    ...(desafio ? {} : { granja: granjaNueva(1 + Math.floor(Math.random() * 1e9)) }),
    // Se conserva por compatibilidad con partidas anteriores; el mapa ya no usa este progreso.
    explorado: new Array(GRILLA_EXPLORADA * GRILLA_EXPLORADA).fill(0),
  };
}

function sanearPos(pos) {
  if (!objeto(pos) || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.z))) return null;
  const limpia = {
    x: Math.max(-LIMITE, Math.min(LIMITE, Number(pos.x))),
    z: Math.max(-LIMITE, Math.min(LIMITE, Number(pos.z))),
  };
  // RC25: la altura es opcional para mantener compatibilidad con saves viejos.
  // Si existe, se sanea para poder restaurar correctamente entrepisos/terrazas.
  if (Number.isFinite(Number(pos.y))) limpia.y = Math.max(-80, Math.min(320, Number(pos.y)));
  return limpia;
}
function obj(v) { return objeto(v) ? v : {}; }
function arr(v) { return Array.isArray(v) ? v : []; }
// Un contador de cosas: entero, no negativo y con techo. Una partida editada a mano
// con `{ tronco: "5" }` rompía la cuenta (`"5" + 1` da `"51"`), y un `Infinity`
// se propagaba a todos los paneles de obra.
const TOPE_MATERIAL = 99999;
function cuentas(v) {
  const limpio = {};
  for (const [k, n] of Object.entries(obj(v))) {
    const c = Math.floor(finito(n, 0));
    if (c > 0) limpio[k] = Math.min(TOPE_MATERIAL, c);
  }
  return limpio;
}
// 2.4.1: una obra que no es un objeto, sin plano o con coordenadas que no son números
// tiraba al armar el bosque (y el juego no llegaba al menú). La que tiene un plano que
// esta versión no conoce se deja pasar: main.js la guarda aparte y la devuelve al
// guardar, para que una partida de una versión más nueva no la pierda en esta.
// 3.5.4: una obra fuera del valle (una coordenada enorme como 1e308 en una partida rota) colgaba
// la carga para siempre: los recorridos por celdas de las colisiones no avanzan con números así
// (1e308 + 1 sigue siendo 1e308). Ninguna obra se puede fundar tan lejos: se descarta, como la
// que tiene coordenadas que no son números. Lo mismo una altura imposible: va al suelo.
const LEJOS_OBRA = LIMITE * 2, ALTO_OBRA = 2000;
const enElValle = (o) => { const x = Number(o.x), z = Number(o.z); return Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= LEJOS_OBRA && Math.abs(z) <= LEJOS_OBRA; };
function sanearObras(v) {
  const salida = [];
  for (const o of arr(v)) {
    if (!objeto(o) || typeof o.plano !== 'string' || !o.plano) continue;
    if (!enElValle(o)) continue;
    const x = Number(o.x), z = Number(o.z);
    const d = { ...o, x, z, rot: finito(o.rot, 0), etapas: Math.max(0, Math.floor(finito(o.etapas, 0))) };
    if (d.y !== undefined && (!Number.isFinite(Number(d.y)) || Math.abs(Number(d.y)) > ALTO_OBRA)) delete d.y;
    else if (d.y !== undefined) d.y = Number(d.y);
    if (d.tinte !== undefined && typeof d.tinte !== 'string') delete d.tinte;
    // 3.7.2: lo que se está cocinando en la obra (la parrilla, el horno, la cocina a leña)
    if (d.coccion !== undefined) { const c = sanearCoccion(d.coccion); if (c) d.coccion = c; else delete d.coccion; }
    salida.push(d);
  }
  return salida;
}
// Contadores de cosas (yerba, harina, ponchos...): como los materiales, números enteros.
function sanearCosas(v) {
  const limpio = {};
  for (const [k, n] of Object.entries(obj(v))) {
    const c = Math.floor(finito(n, 0));
    if (c > 0) limpio[k] = Math.min(TOPE_MATERIAL, c);
  }
  return limpio;
}
function migrarEntradas(v) {
  const e = {};
  // 2.4.1: cada entrada es un objeto ({ dia, hora, cantidad }); lo que no lo es, se va,
  // y una cantidad que no es número vuelve a cero
  for (const [k, x] of Object.entries(obj(v))) {
    if (!objeto(x)) continue;
    e[k] = x.cantidad === undefined ? x : { ...x, cantidad: Math.max(0, Math.min(TOPE_MATERIAL, Math.floor(finito(x.cantidad, 0)))) };
  }
  // Nombres usados por builds de desarrollo anteriores. Mantener la migración
  // evita que una partida vieja pierda recetas o decoración ya desbloqueada.
  if (e['frutillas-rescoldo'] && !e['frutillas-brasas']) e['frutillas-brasas'] = e['frutillas-rescoldo'];
  if (e['te-torta'] && !e['te-galesa']) e['te-galesa'] = e['te-torta'];
  delete e['frutillas-rescoldo'];
  delete e['te-torta'];
  return e;
}
// 2.2: los canteros de las partidas de la 2.x (plano 'huerta', con la planta guardada
// adentro de la obra) pasan a ser canteros de la huerta de la 1.10, que guarda lo
// sembrado en progreso.huerta por la posición. Lo que estaba creciendo sigue creciendo.
function migrarCanteros(p) {
  if (!Array.isArray(p.obras) || !p.obras.some((o) => o?.plano === 'huerta')) return p;
  const huerta = objeto(p.huerta) ? { ...p.huerta } : {};
  const obras = p.obras.map((o) => {
    if (o?.plano !== 'huerta') return o;
    const { huerta: sembrado, ...resto } = o;
    const parcela = desdeCanteroViejo(sembrado, p.dia);
    if (parcela) huerta[claveCantero(o.x, o.z)] = parcela;
    return { ...resto, plano: 'cantero' };
  });
  return { ...p, obras, huerta };
}

function sanearProgreso(p) {
  if (!objeto(p)) return null;
  p = migrarCanteros(p);
  const base = progresoNuevo();
  // 3.6: el pueblo de la 3.1 no pasa: se convierte en la aldea (ver `aldea` más abajo)
  const { pueblo: _pueblo31, ...resto } = p;
  return {
    ...base,
    ...resto,
    versionGuardado: VERSION_GUARDADO,
    entradas: migrarEntradas(p.entradas),
    tomados: arr(p.tomados),
    ramitas: Math.max(0, Math.floor(finito(p.ramitas, 0))),
    fotos: Math.max(0, Math.floor(finito(p.fotos, 0))),
    peces: Object.fromEntries(Object.entries(obj(p.peces)).filter(([, v]) => objeto(v))), desafios: obj(p.desafios), encargos: obj(p.encargos), cosas: sanearCosas(p.cosas), pistas: obj(p.pistas),
    materiales: cuentas(p.materiales), acopio: cuentas(p.acopio),
    vueltas: Math.max(0, Math.floor(finito(p.vueltas, 0))),
    rastreos: Math.max(0, Math.floor(finito(p.rastreos, 0))),
    pescaTarde: Math.max(0, Math.floor(finito(p.pescaTarde, 0))),
    guiaDia: Math.max(0, Math.floor(finito(p.guiaDia, 0))),
    // 3.5.4: la carpa y los renovales, como las obras: dentro del valle (ver `sanearObras`)
    carpa: objeto(p.carpa) && enElValle(p.carpa) ? { ...p.carpa, x: Number(p.carpa.x), z: Number(p.carpa.z), yaw: finito(p.carpa.yaw, 0) } : null,
    diario: arr(p.diario).filter(objeto),
    renovales: arr(p.renovales).filter((r) => objeto(r) && enElValle(r)),
    barra: arr(p.barra), obras: sanearObras(p.obras),
    // Las chinches y los tocones tienen su propio saneador en el módulo que los usa.
    // La cantidad de árboles no se conoce acá: main.js vuelve a sanear con el número real.
    chinches: sanearChinches(p.chinches),
    talados: sanearTalados(p.talados),
    // 3.5.1: lo talado y lo cosechado en total (no bajan); una partida vieja arranca de lo que tiene
    taladosTotal: Math.max(arr(p.talados).length, Math.floor(finito(p.taladosTotal, 0))),
    cosechasTotal: Math.max(0, Math.floor(finito(p.cosechasTotal, ['haba', 'papa', 'frutilla-huerta'].reduce((s, k) => s + (Number(p.entradas?.[k]?.cantidad) || 0), 0)))),
    // 2.0: cómo estabas cuando aceptaste cada encargo de temporada
    encargoBase: sanearBase(p.encargoBase),
    // 2.1: los cantos grabados
    grabaciones: sanearGrabaciones(p.grabaciones),
    huerta: sanearHuerta(p.huerta),
    gallineros: sanearGallineros(p.gallineros),
    feria: sanearFeria(p.feria),
    visitas: sanearVisitas(p.visitas),
    majada: sanearMajada(p.majada),
    // 2.4: el corral propio (null hasta que Don Ramón trae las ovejas)
    corral: sanearCorral(p.corral),
    // 3.7.2 (granja): una partida vieja no la trae: arranca vacía. Un guardado roto, saneado (fechas posibles, topes, ids únicos);
    // en el Desafío no hay granja
    granja: modoPartida === 'desafio' ? undefined : sanearGranja(p.granja, Math.max(1, Math.floor(finito(p.dia, 1))), 1 + Math.floor(Math.random() * 1e9)),
    correo: sanearCorreo(p.correo),
    // la cantidad de árboles no se conoce acá: main.js vuelve a sanear con el número real
    tormenta: sanearTormenta(p.tormenta),
    caballo: sanearCaballo(p.caballo, LIMITE),
    // 2.8: una partida vieja no lo tiene: sale con lo de fábrica de cada sección
    personal: sanearPersonal(p.personal),
    // 2.9: una partida vieja no lo tiene: arranca sin fletes ni cuentas
    comercio: sanearComercio(p.comercio),
    // 2.9: dónde quedó el velero (null: sin varadero todavía, o una partida vieja)
    vela: sanearVela(p.vela),
    // 3.1: una partida vieja no los tiene: sin récords, sin racha
    carreras: sanearCarreras(p.carreras),
    diarios: sanearDiarios(p.diarios),
    // 3.1: la historia y los eventos del valle; una partida vieja no los trae y el juego
    // los arma la primera vez que hacen falta
    ...(p.historia ? { historia: sanearHistoria(p.historia) } : {}),
    ...(p.eventosValle ? { eventosValle: sanearEventosValle(p.eventosValle) } : {}),
    // 3.1: una partida vieja no los trae: los oficios salen sin acreditar (main.js le
    // acredita una vez lo que ya había hecho)
    oficios: sanearOficios(p.oficios),
    // 3.6: la aldea. Una partida de la 3.1 trae `pueblo` y no `aldea`: sus pobladores se mudan
    // a la aldea con el local ya levantado (ver `migrarDesdePueblo`); el resto se descarta.
    // 3.6.1: con el día de la partida (ninguna fecha de la aldea puede ser del futuro). En el
    // Desafío no hay aldea: no se guarda (ver abajo, con el Desafío)
    aldea: p.aldea !== undefined ? sanearAldea(p.aldea, p.dia) : objeto(p.pueblo) ? migrarDesdePueblo(p.pueblo, p.dia) : aldeaNueva(),
    // 3.6: la vecindad (una partida vieja no la trae: arranca de cero)
    vecindad: sanearVecindad(p.vecindad),
    // 3.6 (mecánicas): una partida vieja no lo trae: arranca sin nada
    mecanicas: sanearMecanicas(p.mecanicas),
    // 3.7.0: la vida de la aldea. Una partida de la 3.6 no la trae: arranca hoy (sin cartas atrasadas, la
    // familia dentro de unos días, los chicos creciendo desde hoy: ver `sanearAldea`)
    vidaAldea: sanearVidaAldea(p.vidaAldea, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.1: el amor. Una partida vieja no lo trae: nadie te conoce de ese modo todavía (un guardado roto, saneado:
    // sólo candidatas adultas y solteras, una sola pareja, hasta dos hijos, fechas posibles)
    amor: sanearAmor(p.amor, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.2: la cocina. Una partida vieja no la trae: el recetario de siempre (asado, pan, empanadas), sin trueques del día
    // ni nada al fuego (lo que se cocina en una obra viaja en la obra: `datos.coccion`, saneado al usarla)
    cocina: sanearCocina(p.cocina, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 2.3: las truchas del día, las semillas juntadas hoy, la humedad de la leña y la
    // última noche en que asomó algo en el lago
    truchasHoy: p.truchasHoy && typeof p.truchasHoy === 'object' ? { dia: Math.max(0, Math.floor(finito(p.truchasHoy.dia, 0))), n: Math.max(0, Math.min(9, Math.floor(finito(p.truchasHoy.n, 0)))) } : null,
    semillasJuntadas: p.semillasJuntadas && typeof p.semillasJuntadas === 'object' ? { dia: Math.floor(finito(p.semillasJuntadas.dia, 0)), arboles: arr(p.semillasJuntadas.arboles).filter(Number.isInteger).slice(0, 64) } : null,
    humedadLena: Math.max(0, Math.min(1, finito(p.humedadLena, 0))),
    lomoUltimo: Math.floor(finito(p.lomoUltimo, -99)),
    ranura: Math.max(0, Math.min(7, Math.floor(finito(p.ranura, 0)))),
    horas: ((finito(p.horas, base.horas) % 24) + 24) % 24,
    dia: Math.max(1, Math.floor(finito(p.dia, 1))),
    pos: sanearPos(p.pos),
    yaw: finito(p.yaw, 0),
    explorado: Array.isArray(p.explorado) && p.explorado.length === base.explorado.length ? p.explorado : base.explorado,
    modo: modoPartida,
    // (3.6.1: y en el Desafío no hay aldea: ni la vacía ni la de una partida del Relax importada)
    ...(modoPartida === 'desafio' ? { desafio: sanearDesafio(p.desafio), aldea: undefined, vidaAldea: undefined, amor: undefined, cocina: undefined } : { desafio: undefined }),
  };
}

export function cargarProgreso() {
  let p = null;
  ultimoOrigenCarga = 'ninguno';
  try {
    const principalTexto = localStorage.getItem(CLAVE);
    p = parsear(principalTexto);
    if (progresoPlausible(p)) { ultimoOrigenCarga = 'principal'; ultimoPrincipalValidoTexto = principalTexto; }
    else {
      ultimoPrincipalValidoTexto = null;
      p = parsear(localStorage.getItem(CLAVE_BACKUP));
      if (progresoPlausible(p)) ultimoOrigenCarga = 'backup';
      else p = null;
    }
  } catch { p = null; ultimoPrincipalValidoTexto = null; }
  if (!p) return null;
  p = sanearProgreso(p);
  if (!p) return null;
  // las miniaturas viven aparte y se vuelven a pegar al cargar
  const fotos = leer(CLAVE_FOTOS) || {};
  // 2.6.1: sólo las propias y que sean imagen (un `fotos.constructor` heredado se colaba)
  for (const [k, v] of Object.entries(p.desafios || {})) if (Object.hasOwn(fotos, k) && typeof fotos[k] === 'string' && objeto(v)) v.img = fotos[k];
  return p;
}

// Las miniaturas del álbum pesan mucho más que el resto de la partida,
// así que van en su propia clave y solo se escriben cuando cambian.
export function guardarFotos(desafios) {
  const soloImagenes = {};
  for (const [k, v] of Object.entries(desafios || {})) if (v && v.img) soloImagenes[k] = v.img;
  return escribir(CLAVE_FOTOS, soloImagenes);
}
export function cargarFotos() { return leer(CLAVE_FOTOS) || {}; }
export function borrarFotos() { try { localStorage.removeItem(CLAVE_FOTOS); } catch {} }

export function guardarProgreso(p) {
  const limpio = sanearProgreso(p);
  if (!limpio) return false;
  // La partida va sin imágenes: son lo que hace pesada la escritura.
  const desafios = {};
  for (const [k, v] of Object.entries(limpio.desafios || {})) desafios[k] = { dia: finito(v?.dia, limpio.dia), hora: finito(v?.hora, limpio.horas) };
  const aGuardar = { ...limpio, desafios, guardadoEn: Date.now() };
  let nuevo;
  try { nuevo = JSON.stringify(aGuardar); } catch { return false; }

  try {
    // El backup SOLO se reemplaza por un principal que ya era JSON válido.
    // RC24 reutiliza la última copia principal validada; si venimos de un
    // backup/corrupción, valida una sola vez antes de empezar la nueva cadena.
    let anteriorTexto = ultimoPrincipalValidoTexto;
    if (!anteriorTexto) {
      const candidato = localStorage.getItem(CLAVE);
      if (progresoPlausible(parsear(candidato))) anteriorTexto = candidato;
    }
    if (anteriorTexto) localStorage.setItem(CLAVE_BACKUP, anteriorTexto);
    if (!escribirTexto(CLAVE, nuevo)) return false;
    ultimoPrincipalValidoTexto = nuevo;
    return true;
  } catch { return false; }
}
export function borrarProgreso() { ultimoPrincipalValidoTexto = null; try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_BACKUP); localStorage.removeItem(CLAVE_FOTOS); localStorage.removeItem(CLAVE_VISTA); } catch {} }
