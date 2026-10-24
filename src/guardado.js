// Progreso y ajustes en el almacenamiento local.
// RC2: guardado transaccional, migraciones y saneamiento de datos.
import { LIMITE, sanearDistancia, sanearPlantas } from './config.js';
import { sanearDesafio } from './desafio-reglas.js';
import { sanearChinches } from './chinches.js';
import { sanearTalados, sanearPicados } from './bosque.js';
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
// 3.1: el desafío del día (ver diarios.js). 4.5.1: los récords de las carreras ya no (se sacaron las carreras)
import { sanearDiarios } from './diarios.js';
import { sanearDiarioHoy } from './diario.js';
import { sanearAmarre } from './kayak-amarre.js';
// 4.2: lo que guardan la barraca, el depósito, el silo y el herramientero (ver almacen.js)
import { sanearAlmacen, esAlmacen } from './almacen.js';
// 3.1: la historia guiada y los eventos del valle
import { sanearHistoria } from './historia.js';
import { sanearFogatas } from './fogatas.js';
import { sanearEventosValle } from './eventos-valle.js';
// 3.1: rangos y oficios
import { sanearOficios, oficiosNuevos } from './oficios.js';
// 4.5: lo único que deja la consola de códigos en la partida
import { sanearMarcaTrucos } from './trucos.js';
// 4.6 recursos: lo usado de la veta, el juncal, las hierbas, la barranca de arcilla y los pehuenes (ver recursos-zona.js)
import { sanearRecursosZona, recursosZonaNuevos } from './recursos-zona.js';
// 3.6: la Aldea de los Duendes (reemplaza al pueblo que fundabas en la 3.1)
import { sanearAldea, aldeaNueva, migrarDesdePueblo } from './aldea.js';
// 3.6: la vecindad (amistad, ganas y memoria de los vecinos; ver vecindad.js)
import { sanearVecindad, vecindadNueva } from './vecindad.js';
import { conSocial } from './vecindad-social.js';
// 3.6 (mecánicas): lo de cada lugar de la aldea (el aljibe del día, el libro prestado)
import { sanearMecanicas, mecanicasNuevas } from './aldea-mecanicas.js';
// 3.7.0: la vida de la aldea (calendario, visitantes, mascota, apodo, familia, cartas) y su ritmo
import { sanearVidaAldea, vidaNueva, sanearRitmo } from './aldea-vida.js';
// 4.10 base: la experiencia de las defensas que se curten y los trofeos del tablero
import { sanearCurtido } from './desafio-mejoras-base.js';
import { IDS_TROFEOS } from './desafio-trofeos.js';
// 3.7.1: el amor en la aldea (y el ajuste para apagarlo)
import { sanearAmor, amorNuevo, sanearAjusteRomance } from './amor.js';
// 3.7.2: la cocina en pasos (el recetario, los trueques del día con los vecinos, las estaciones móviles)
import { sanearCocina, cocinaNueva, sanearCoccion } from './cocina-pasos.js';
// 3.7.2 (granja): la vaca, los chanchos, los corderos y los frutales (sólo en el Relax)
import { sanearGranja, granjaNueva } from './granja.js';
// 3.7.5 (rincones): los duendes, las huertas, el potrero, el taller, tu casa, el camino y el sulky (sólo en el Relax)
import { rinconesNuevos, sanearRincones } from './rincones.js';
// 4.2 (huevos de pascua): la estrella fugaz con deseo y lo que sigue (sólo en el Relax)
import { huevosNuevos, sanearHuevos } from './huevos.js';
// 3.7.3: el tren mejorado y el taller ferroviario de la aldea (sólo en el Relax)
import { trenNuevo, sanearTren, unificarNombreLoco } from './tren-mejoras.js';
// 3.7.5 (noticias): el diario de la aldea, las cartas de lejos, el club y las estrellas; los concursos y las cintas
import { noticiasNuevas, sanearNoticias } from './noticias.js';
import { concursosNuevo, sanearConcursos } from './concursos.js';
// 3.7.5: las fiestas y las fechas (los recuerdos, la minga, la nevada, los juegos, tu cumpleaños; sólo en el Relax)
import { fiestasNuevas, sanearFiestas } from './fiestas.js';
import { economiaNueva, sanearEconomia, convertirYerba } from './economia.js';
import { negociosNuevo, sanearNegocios } from './negocios.js';
import { empleoNuevo, sanearEmpleo } from './empleo.js';
import { negociosVecinosNuevo, sanearNegociosVecinos } from './negocios-vecinos.js';
// 4.6 puestos: los puestos de ruta
import { puestosRutaNuevos, sanearPuestosRuta } from './puestos-ruta.js';
import { cantinaNueva, sanearCantina } from './cantina.js';
// 4.3: el negocio propio (un local con estantes, precios, caja y fama; sólo en el Relax)
import { negocioPropioNuevo, sanearNegocioPropio } from './negocio-propio.js';
// 4.4: los empleados de tu negocio propio
import { empleadosNuevo, sanearEmpleadosNegocio } from './empleados-negocio.js';
import { sanearAjusteBorrachera } from './pena.js';
// 4.6 gente: el tablón de encargos y lo de la gente del campo (pedidos, tienditas, historias)
import { sanearGenteCampo, genteCampoNueva } from './gente-campo.js';

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
  ultimoSello = 0;   // 3.8.6
  ultimaSecuencia = 0;   // 4.4.2: (la cuenta de guardados es de cada partida: importar en otra ranura no la hereda)
  principalRoto = false;
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
    secuencia: secuenciaDe(p),   // 4.0.1
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
  const fotos = leerFotosDe(k.fotos);   // 3.8.4
  const fotosIncompletas = lecturaFotosIncompleta;   // 4.0.1
  let vista = null;
  try { vista = localStorage.getItem(k.vista); } catch {}
  return { progreso: p, fotos, vista, fotosIncompletas };
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
      guardarFotos(imagenes, true);   // (3.8.6: las de la partida que se reemplazó, se van)
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
  if (k.principal === CLAVE) { ultimoPrincipalValidoTexto = null; ultimoSello = 0; ultimaSecuencia = 0; }
  borrarFotosDe(k.fotos);   // 3.8.4: (también los archivos)
  try { for (const clave of Object.values(k)) localStorage.removeItem(clave); return true; } catch { return false; }
}
// La miniatura de la partida se guarda aparte: pesa más que todo lo demás.
export function guardarVista(datos) {
  if (typeof datos !== 'string' || !datos.startsWith('data:image')) return false;
  try { localStorage.setItem(CLAVE_VISTA, datos); return true; } catch { return false; }
}
export const VERSION_GUARDADO = 2;
// 4.10.1: la versión del juego con que se guardó por última vez la partida (`versionJuego`, «4.10.1»). `VERSION_GUARDADO` no sube nunca: sin
// esto, una partida abierta y guardada con una versión más vieja perdía en silencio los campos que esa versión no conoce. Una partida de
// antes de la 4.10.1 no la trae y carga igual (queda vacía).
export function sanearVersionJuego(v) {
  const t = typeof v === 'string' ? v.trim() : '';
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t) ? t : '';
}
// ¿`a` es una versión más nueva que `b`? Si alguna no es válida, no.
export function versionMasNueva(a, b) {
  const x = sanearVersionJuego(a), y = sanearVersionJuego(b);
  if (!x || !y) return false;
  const p = x.split('.').map(Number), q = y.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (p[i] !== q[i]) return p[i] > q[i];
  return false;
}
// 4.10.2: la versión que se escribe al guardar. Si la partida vino de una versión más nueva y el aviso todavía no se mostró, se conserva la
// de la partida (el primer autoguardado la pisaba con la vieja y el aviso ya no tenía ni una segunda oportunidad).
export function versionAlGuardar(pendiente, actual) { return versionMasNueva(pendiente, actual) ? sanearVersionJuego(pendiente) : sanearVersionJuego(actual); }
let ultimoOrigenCarga = 'ninguno';
// RC24: cache de la última copia principal ya validada. Evita releer y
// parsear localStorage en cada guardado manteniendo el backup transaccional.
let ultimoPrincipalValidoTexto = null;
// 3.8.6: el sello (guardadoEn) del último guardado de esta partida, para que el próximo no sea menor (ver guardarProgreso)
let ultimoSello = 0;
// 4.0.1: cuántas veces se guardó esta partida (sube de a uno y viaja con la partida al exportar o sincronizar). Los relojes de dos computadoras no coinciden: con
// el sello solo, lo que se juega en la otra computadora tras importar una partida de un reloj adelantado se veía como «apenas más nuevo» (ver sincronia.js)
let ultimaSecuencia = 0;
// 3.8.6: el principal no se pudo sanear y se cargó la copia: el próximo guardado no lo pasa a copia de seguridad
let principalRoto = false;
// (uno de más de un mes en el futuro es de un reloj roto o un archivo retocado: no cuenta)
const selloDe = (p) => { const s = typeof p?.guardadoEn === 'number' ? p.guardadoEn : 0; return Number.isFinite(s) && s > 0 && s < Date.now() + 30 * 864e5 ? s : 0; };
const secuenciaDe = (p) => { const s = typeof p?.secuencia === 'number' ? p.secuencia : 0; return Number.isFinite(s) && s > 0 && s < 1e9 ? Math.floor(s) : 0; };
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
  borrachera: 'normal',   // 3.9.1: el efecto de la borrachera (normal, suave o apagado)
};

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
// 3.8.6: `Number` tira con un objeto cuyo toString no es función (`{ "toString": 1 }` en una partida retocada): no es número
const numero = (v) => { try { return Number(v); } catch { return NaN; } };
const finito = (v, defecto) => { const n = numero(v); return Number.isFinite(n) ? n : defecto; };
// 4.10.3 (P9): `null`, `""`, `false` y `[]` no son números (`Number(null)` da 0): valen el defecto, no el mínimo (arrancaba mudo con un ajuste en null)
const acotar = (v, min, max, defecto) => (v == null || v === '' || typeof v === 'boolean' || Array.isArray(v) ? defecto : Math.min(max, Math.max(min, finito(v, defecto))));
const opcion = (v, permitidas, defecto) => permitidas.includes(v) ? v : defecto;

function parsear(texto) {
  if (!texto) return null;
  // 4.0.2: una partida retocada a mano con `"toString": 1` (o `valueOf`) hacía tirar a cada `Number(...)` de los módulos y se perdía la carga entera: esas dos claves no existen en ningún guardado de verdad, se sacan al leer
  try { const v = JSON.parse(texto, (_k, x) => { if (x && typeof x === 'object' && !Array.isArray(x)) { delete x.toString; delete x.valueOf; } return x; }); return objeto(v) ? v : null; } catch { return null; }
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
// 3.8.4: las fotos del álbum van en archivos aparte, en la carpeta de la partida (en Electron, `hojarasca.fotos` de
// preload.cjs → fotos-main.cjs), preparando la nube de Steam. Sin eso (las pruebas de Node, un navegador) siguen en el
// localStorage. Las que estaban en el localStorage pasan a los archivos la primera vez que se leen, y se borran de ahí.
function archivosFotos() {
  try { const a = globalThis.hojarasca?.fotos; return a && typeof a.leer === 'function' && typeof a.escribir === 'function' ? a : null; } catch { return null; }
}
// 3.8.6: lo que hay en los archivos de cada partida, en memoria ({ clave: { id: dataURL } }). Sólo este juego escribe esa
// carpeta, así que lo leído y lo escrito alcanza: empaquetar la partida (la carpeta sincronizada la copia cada 2 minutos)
// ya no relee el álbum entero del disco, y guardar sólo manda las fotos nuevas (antes, en cada foto, dos veces el álbum
// entero, cada archivo leído y comparado: cientos de ms con el juego quieto en un álbum grande).
const fotosEnDisco = new Map();
// 4.0.1: ¿la última lectura del álbum dejó fotos afuera (un archivo ocupado, el disco que no respondió)? Un paquete armado así no puede reemplazar el álbum de otra computadora
let lecturaFotosIncompleta = false;
function leerFotosDe(clave) {
  lecturaFotosIncompleta = false;
  const local = leer(clave);
  const a = archivosFotos();
  if (!a) return objeto(local) ? local : {};
  const hayLocal = objeto(local) && Object.keys(local).length > 0;
  if (!hayLocal && fotosEnDisco.has(clave)) return { ...fotosEnDisco.get(clave) };
  let deArchivos = null, entera = false;
  try { deArchivos = a.leer(clave); } catch { deArchivos = null; }
  // (preload.cjs entrega { fotos, sinLeer }; un puente viejo o de prueba, las fotos solas)
  if (objeto(deArchivos) && objeto(deArchivos.fotos) && typeof deArchivos.sinLeer === 'number') { entera = deArchivos.sinLeer === 0; deArchivos = deArchivos.fotos; }
  else entera = true;
  if (!objeto(deArchivos)) { lecturaFotosIncompleta = true; return objeto(local) ? local : {}; }   // (el disco no respondió: lo que haya)
  lecturaFotosIncompleta = !entera;
  // (si alguna no se pudo leer, no queda en memoria: la próxima vez se vuelve a leer del disco)
  if (entera) fotosEnDisco.set(clave, { ...deArchivos }); else fotosEnDisco.delete(clave);
  if (!hayLocal) return deArchivos;
  // las que estaban en el localStorage y todavía no en los archivos, pasan (sin tocar las que ya están)
  const faltan = Object.fromEntries(Object.entries(local).filter(([id]) => !Object.hasOwn(deArchivos, id)));
  if (escribirFotosDe(clave, faltan)) { try { localStorage.removeItem(clave); } catch {} }
  return { ...local, ...deArchivos };
}
// `reemplazar`: la partida queda con exactamente estas fotos (importar, sincronizar). Sin eso (guardar) sólo se agregan o
// cambian: nunca se borra una que no vino (3.8.6: una foto que no se pudo leer al abrir la partida, por ejemplo con el
// archivo ocupado un instante por el antivirus, se borraba del disco en el primer guardado).
function escribirFotosDe(clave, fotos, reemplazar = false) {
  const a = archivosFotos();
  if (a) {
    const enDisco = reemplazar ? null : fotosEnDisco.get(clave);
    const nuevas = enDisco ? Object.fromEntries(Object.entries(fotos).filter(([id, img]) => enDisco[id] !== img)) : fotos;
    if (enDisco && !Object.keys(nuevas).length) return true;   // (ya estaban todas)
    let ok = false;
    try { ok = a.escribir(clave, nuevas, { reemplazar }) === true; } catch { ok = false; }
    if (ok) {
      // (sin lo de antes en memoria no se sabe qué más hay en la carpeta: la próxima lectura va al disco)
      if (reemplazar) fotosEnDisco.set(clave, { ...fotos }); else if (enDisco) fotosEnDisco.set(clave, { ...enDisco, ...nuevas }); else fotosEnDisco.delete(clave);
      try { localStorage.removeItem(clave); } catch {}
      return true;
    }
    fotosEnDisco.delete(clave);
  }
  return escribir(clave, fotos);
}
function borrarFotosDe(clave) {
  fotosEnDisco.delete(clave);
  const a = archivosFotos();
  if (a) { try { a.borrar?.(clave); } catch {} }
  try { localStorage.removeItem(clave); } catch {}
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
    borrachera: sanearAjusteBorrachera(x.borrachera),   // 3.9.1 (sin el ajuste guardado: normal)
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
    // El Desafío arranca con hacha y pico (4.2: para picar piedra hace falta el pico) y algo de material: la primera noche llega pronto.
    ...(desafio ? { desafio: sanearDesafio(null) } : {}),
    entradas: {}, tomados: [], ramitas: 0, fotos: 0, peces: {}, desafios: {}, encargos: {}, cosas: desafio ? { hacha: 1, pico: 1 } : {}, picoEntregado: true, vueltas: 0, carpa: null, diario: [], renovales: [], talados: [], picados: [], acopio: {}, huerta: {}, gallineros: {}, feria: { dia: 0, tomadas: [] }, visitas: visitasNuevas(), majada: majadaNueva(), correo: correoNuevo(), tormenta: tormentaNueva(), caballo: caballoNuevo(), chinches: [], pescaTarde: 0, guiaDia: 0, barra: [], ranura: 0, materiales: desafio ? { tronco: 6, tabla: 6, piedra: 6 } : {}, obras: [], pistas: {},
    horas: 8.2, dia: 1, pos: null, yaw: 0,
    // 2.8: cada sección de Personalizar con lo suyo de fábrica
    personal: sanearPersonal(null),
    // 2.9: el comercio por la trochita y los fletes (ver `comercio.js`)
    comercio: comercioNuevo(),
    // 3.1: los oficios empiezan en cero. 3.6: la aldea, como el primer día (ya no hay `pueblo`;
    // 3.6.1: y en el Desafío, ninguna: allá no hay aldea)
    oficios: oficiosNuevos(), ...(desafio ? {} : { aldea: aldeaNueva(), vidaAldea: vidaNueva(1), amor: amorNuevo() }),   // (3.7.0: y la vida de la aldea; 3.7.1: y el amor)
    ...(desafio ? {} : { cocina: cocinaNueva() }),   // 3.7.2: la cocina (el recetario de siempre, nada al fuego)
    ...(desafio ? {} : { recursosZona: recursosZonaNuevos() }),   // 4.6 recursos: todo para juntar
    ...(desafio ? {} : { economia: economiaNueva(), negocios: negociosNuevo(), cantina: cantinaNueva(), casaTe: cantinaNueva(), negocioPropio: negocioPropioNuevo() }),   // 3.8.8: el peso (sin plata ni movimientos todavía; ver economia.js)
    ...(desafio ? {} : { tren: trenNuevo() }),   // 3.7.3: la trochita de siempre y el galpón viejo del taller
    ...(desafio ? {} : { empleo: empleoNuevo() }),   // 4.3: el empleo fijo (ningún puesto todavía; ver empleo.js)
    ...(desafio ? {} : { empleadosNegocio: empleadosNuevo() }),   // 4.4: los vecinos contratados en tu negocio propio (nadie todavía; ver empleados-negocio.js)
    ...(desafio ? {} : { genteCampo: genteCampoNueva() }),   // 4.6 gente: el tablón de encargos sin nada tomado y la gente del campo sin pedidos ni compras
    ...(desafio ? {} : { negociosVecinos: negociosVecinosNuevo() }),   // 4.4: negocios comprados y sociedades con vecinos (ninguno todavía; ver negocios-vecinos.js)
    ...(desafio ? {} : { puestosRuta: puestosRutaNuevos() }),   // 4.6 puestos: los cuatro puestos de ruta, abandonados (ver puestos-ruta.js)
    ...(desafio ? {} : { noticias: noticiasNuevas(), concursos: concursosNuevo() }),   // 3.7.5 (noticias): sin diarios, cartas ni cintas todavía
    // 3.6: la vecindad: nadie te conoce todavía
    vecindad: vecindadNueva(),
    // 3.6 (mecánicas): sin agua sacada ni libro prestado
    mecanicas: mecanicasNuevas(),
    // 3.7.5: las fiestas: ninguna vista todavía (en el Desafío, ninguna)
    ...(desafio ? {} : { fiestas: fiestasNuevas() }),
    // 3.7.2 (granja): vacía (en el Desafío, ninguna); la semilla decide el pelaje de la vaca, los mellizos y las camadas
    ...(desafio ? {} : { granja: granjaNueva(1 + Math.floor(Math.random() * 1e9)) }),
    // 3.7.5 (rincones): nada encontrado ni aprendido; el lote de tu casa, libre; sin sulky; el camino, una huella
    ...(desafio ? {} : { rincones: rinconesNuevos() }),
    ...(desafio ? {} : { huevos: huevosNuevos() }),   // 4.2 (huevos de pascua)
    // Se conserva la clave por compatibilidad con partidas anteriores; el mapa ya no usa este progreso.
    // 4.10.3 (P11): vacío: eran 4096 ceros (8 KB) en cada partida y en su copia, para nada
    explorado: [],
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
    if (d.pagadas !== undefined) d.pagadas = Math.max(0, Math.min(8, Math.floor(finito(d.pagadas, 0))));   // 3.8.8: las etapas de la casa ya pagadas (propiedad.js)
    // 3.8.6: el nombre que le pusiste (pedirNombre): un texto; otra cosa (una partida rota) rompía el mapa
    if (d.nombre !== undefined) { if (typeof d.nombre === 'string' && d.nombre.trim()) d.nombre = d.nombre.trim().slice(0, 28); else delete d.nombre; }
    // 4.10 base: la experiencia de una defensa que se curte y los trofeos colgados del tablero (una partida vieja no los trae)
    if (d.curt !== undefined) { const c = sanearCurtido(d.curt); if (c) d.curt = c; else delete d.curt; }
    if (d.colgados !== undefined) { if (Array.isArray(d.colgados)) d.colgados = d.colgados.filter((id) => IDS_TROFEOS.includes(id)); else delete d.colgados; }
    // 4.2: lo guardado en un almacén con tope (el nivel y las cosas que guarda); una obra de antes no lo trae y queda como estaba
    if (d.almacen !== undefined) { if (esAlmacen(d.plano) && d.almacen && typeof d.almacen === 'object' && !Array.isArray(d.almacen)) d.almacen = sanearAlmacen(d.almacen, d.plano); else delete d.almacen; }
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
  // 4.5.1: tampoco los récords de las carreras contrarreloj (se sacaron): una partida vieja los trae y se descartan
  const { pueblo: _pueblo31, carreras: _carreras31, ...resto } = p;
  const limpio = {
    ...base,
    ...resto,
    versionGuardado: VERSION_GUARDADO,
    versionJuego: sanearVersionJuego(p.versionJuego),   // 4.10.1
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
    picados: sanearPicados(p.picados),   // 4.4.2: los pedreros picados no vuelven (partidas viejas: vacío)
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
    // 3.7.5 (rincones): una partida vieja no los trae: arrancan de cero (en el Desafío, nada)
    rincones: modoPartida === 'desafio' ? undefined : sanearRincones(p.rincones, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 4.2 (huevos de pascua): una partida vieja no los trae: arrancan de cero (en el Desafío, nada)
    huevos: modoPartida === 'desafio' ? undefined : sanearHuevos(p.huevos, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.8.8: la historia del abuelo de Martín en el alero del arriero se sacó (vuelve la Cueva de las Manos): una partida vieja la traía
    aleroArriero: undefined,
    correo: sanearCorreo(p.correo),
    // la cantidad de árboles no se conoce acá: main.js vuelve a sanear con el número real
    tormenta: sanearTormenta(p.tormenta),
    caballo: sanearCaballo(p.caballo, LIMITE),
    // 3.8.4: la página del diario de hoy (de otro día, ya se escribió), dónde quedó amarrado el kayak y lo soltado con V
    diarioHoy: sanearDiarioHoy(p.diarioHoy, Math.max(1, Math.floor(finito(p.dia, 1)))),
    fogatas: sanearFogatas(p.fogatas),   // 3.8.7: los fuegos prendidos (ver fogatas.js)
    kayakAmarre: sanearAmarre(p.kayakAmarre),
    // 3.8.6: el entumecido y el descansado, en horas de juego (una partida vieja no lo trae)
    cuerpo: objeto(p.cuerpo) ? { entumecido: Math.max(0, Math.min(12, finito(p.cuerpo.entumecido, 0))), descansado: Math.max(0, Math.min(12, finito(p.cuerpo.descansado, 0))) } : undefined,
    soltados: arr(p.soltados).filter((s) => objeto(s) && ['ramita', 'pinon', 'calafate', 'frutilla', 'pluma', 'canto'].includes(s.tipo) && Number.isFinite(s.x) && Number.isFinite(s.z) && Math.abs(s.x) <= LIMITE && Math.abs(s.z) <= LIMITE).slice(-64).map((s) => ({ tipo: s.tipo, x: s.x, z: s.z })),
    // 2.8: una partida vieja no lo tiene: sale con lo de fábrica de cada sección
    personal: sanearPersonal(p.personal),
    // 2.9: una partida vieja no lo tiene: arranca sin fletes ni cuentas
    comercio: sanearComercio(p.comercio),
    // 2.9: dónde quedó el velero (null: sin varadero todavía, o una partida vieja)
    vela: sanearVela(p.vela),
    // 3.1: una partida vieja no lo tiene: sin racha
    diarios: sanearDiarios(p.diarios),
    // 3.1: la historia y los eventos del valle; una partida vieja no los trae y el juego
    // los arma la primera vez que hacen falta
    ...(p.historia ? { historia: sanearHistoria(p.historia) } : {}),
    ...(p.eventosValle ? { eventosValle: sanearEventosValle(p.eventosValle) } : {}),
    // 3.1: una partida vieja no los trae: los oficios salen sin acreditar (main.js le
    // acredita una vez lo que ya había hecho)
    oficios: sanearOficios(p.oficios),
    // 4.6 recursos: una partida vieja no lo trae: todo disponible. Un guardado roto, saneado (sólo puntos que existen y pehuenes «x,z»)
    recursosZona: modoPartida === 'desafio' ? undefined : sanearRecursosZona(p.recursosZona),
    trucos: modoPartida === 'desafio' ? undefined : sanearMarcaTrucos(p.trucos),   // 4.5: las anotaciones del cuaderno que puso la consola (para que no cuenten en los logros)
    // 3.6: la aldea. Una partida de la 3.1 trae `pueblo` y no `aldea`: sus pobladores se mudan
    // a la aldea con el local ya levantado (ver `migrarDesdePueblo`); el resto se descarta.
    // 3.6.1: con el día de la partida (ninguna fecha de la aldea puede ser del futuro). En el
    // Desafío no hay aldea: no se guarda (ver abajo, con el Desafío)
    aldea: p.aldea !== undefined ? sanearAldea(p.aldea, p.dia) : objeto(p.pueblo) ? migrarDesdePueblo(p.pueblo, p.dia) : aldeaNueva(),
    // 3.6: la vecindad (una partida vieja no la trae: arranca de cero)
    vecindad: sanearVecindad(p.vecindad),
    // 3.6 (mecánicas): una partida vieja no lo trae: arranca sin nada
    mecanicas: sanearMecanicas(p.mecanicas),
    // 3.7.5: las fiestas. Una partida vieja no las trae: arrancan de cero (sin recuerdos, la minga sin hacer, tu
    // cumpleaños el día de siempre); un guardado roto, saneado (sólo fechas y recuerdos que existen, nada del futuro).
    // En el Desafío no hay fiestas
    fiestas: modoPartida === 'desafio' ? undefined : sanearFiestas(p.fiestas, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.0: la vida de la aldea. Una partida de la 3.6 no la trae: arranca hoy (sin cartas atrasadas, la
    // familia dentro de unos días, los chicos creciendo desde hoy: ver `sanearAldea`)
    vidaAldea: sanearVidaAldea(p.vidaAldea, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.1: el amor. Una partida vieja no lo trae: nadie te conoce de ese modo todavía (un guardado roto, saneado:
    // sólo candidatas adultas y solteras, una sola pareja, hasta dos hijos, fechas posibles)
    amor: sanearAmor(p.amor, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.2: la cocina. Una partida vieja no la trae: el recetario de siempre (asado, pan, empanadas), sin trueques del día
    // ni nada al fuego (lo que se cocina en una obra viaja en la obra: `datos.coccion`, saneado al usarla)
    cocina: sanearCocina(p.cocina, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.3: el tren. Una partida de la 3.7.2 no lo trae: la trochita de siempre (con su coche de pasajeros) y el galpón
    // viejo esperando la primera mejora. Un guardado roto, saneado (sólo lo hecho de verdad vale, ver `sanearTren`)
    tren: sanearTren(p.tren, Math.max(1, Math.floor(finito(p.dia, 1)))),
    // 3.7.5 (noticias): una partida de la 3.7.4 no los trae: sin diarios, cartas, cintas ni truchas anotadas (el primer diario
    // sale a los días que diga el ritmo). Un guardado roto, saneado: nada del futuro, ids que existen, listas cortas
    noticias: sanearNoticias(p.noticias, Math.max(1, Math.floor(finito(p.dia, 1)))),
    concursos: sanearConcursos(p.concursos, Math.max(1, Math.floor(finito(p.dia, 1)))),
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
    explorado: [],   // 4.10.3 (P11): nadie lo lee; las partidas viejas sueltan sus 8 KB de ceros al guardarse
    modo: modoPartida,
    // (3.6.1: y en el Desafío no hay aldea: ni la vacía ni la de una partida del Relax importada)
    ...(modoPartida === 'desafio' ? { desafio: sanearDesafio(p.desafio), aldea: undefined, vidaAldea: undefined, amor: undefined, cocina: undefined, tren: undefined, noticias: undefined, concursos: undefined } : { desafio: undefined }),
  };
  // 4.2: el pico. Antes el hacha picaba piedra; ahora hace falta el pico. Una partida de antes (sin `picoEntregado`) que tiene el hacha y no el pico
  // recibe uno, UNA sola vez (`picoEntregado` queda en verdadero) y `picoAviso` hace que el juego se lo cuente al entrar. Quien no tenía hacha, no recibe nada.
  if (p.picoEntregado !== true) { if (limpio.cosas.hacha && !limpio.cosas.pico) { limpio.cosas.pico = 1; limpio.picoAviso = true; } }
  limpio.picoEntregado = true;
  if (limpio.picoAviso !== true || !limpio.cosas.pico) delete limpio.picoAviso;
  // 3.8.8: la economía. Sólo en el Relax. Una partida de antes no la trae: arranca en cero y la yerba que tenía se convierte a pesos (una vez)
  if (modoPartida === 'desafio') { limpio.economia = undefined; limpio.negocios = undefined; limpio.cantina = undefined; limpio.casaTe = undefined; limpio.negocioPropio = undefined; }
  else { limpio.economia = sanearEconomia(p.economia); convertirYerba(limpio); limpio.negocios = sanearNegocios(p.negocios, limpio.dia); limpio.negocioPropio = sanearNegocioPropio(p.negocioPropio, limpio.dia); limpio.cantina = sanearCantina(p.cantina, limpio.dia); limpio.casaTe = sanearCantina(p.casaTe, limpio.dia); }   // 3.9.2: la libreta de la casa de té (una partida de antes: vacía)   // 3.9.0: la cuenta de la cantina (una partida de antes no la trae: arranca vacía)   // 3.8.8: los negocios (negocios.js)
  // 4.3: el empleo fijo (sólo en el Relax). Una partida de antes no lo trae: sale vacío, sin ningún puesto, y lo demás queda como estaba
  limpio.empleo = modoPartida === 'desafio' ? undefined : sanearEmpleo(p.empleo, limpio.dia);
  // 4.4: los empleados de tu negocio propio (sólo en el Relax). Una partida de antes no los trae: sale vacío, nadie contratado, y lo demás queda como estaba
  limpio.empleadosNegocio = modoPartida === 'desafio' ? undefined : sanearEmpleadosNegocio(p.empleadosNegocio, limpio.dia);
  // 4.4: los negocios que le compraste a un vecino y tus sociedades (sólo en el Relax). Una partida de antes no lo trae: sale vacío y lo demás queda como estaba
  limpio.negociosVecinos = modoPartida === 'desafio' ? undefined : sanearNegociosVecinos(p.negociosVecinos, limpio.dia);
  // 4.6 gente: el tablón de encargos y la gente del campo (sólo en el Relax). Una partida de antes no lo trae: sale vacío (nada tomado,
  // nada comprado, ninguna historia contada) y lo demás queda como estaba
  limpio.genteCampo = modoPartida === 'desafio' ? undefined : sanearGenteCampo(p.genteCampo, limpio.dia);
  // 4.6 puestos: los puestos de ruta (sólo en el Relax): etapa y depósito de cada uno. Una partida de antes no los trae: los cuatro abandonados
  limpio.puestosRuta = modoPartida === 'desafio' ? undefined : sanearPuestosRuta(p.puestosRuta);
  // 3.7.4: lo de la vida social (humor, deseos y lo hecho hoy: `progreso.vecindad.social`), si lo trae (ver vecindad-social.js)
  conSocial(limpio.vecindad, p.vecindad, limpio.dia);
  // 3.8.4: un solo nombre de la locomotora (el del taller y el de Personalizar; ver tren-mejoras.js)
  unificarNombreLoco(limpio);
  return limpio;
}

export function cargarProgreso() {
  let p = null;
  ultimoOrigenCarga = 'ninguno';
  try {
    const principalTexto = localStorage.getItem(CLAVE);
    p = parsear(principalTexto);
    if (progresoPlausible(p)) { ultimoOrigenCarga = 'principal'; ultimoPrincipalValidoTexto = principalTexto; ultimoSello = Math.max(ultimoSello, selloDe(p)); ultimaSecuencia = Math.max(ultimaSecuencia, secuenciaDe(p)); }
    else {
      ultimoPrincipalValidoTexto = null;
      p = parsear(localStorage.getItem(CLAVE_BACKUP));
      if (progresoPlausible(p)) ultimoOrigenCarga = 'backup';
      else p = null;
    }
  } catch { p = null; ultimoPrincipalValidoTexto = null; }
  if (!p) return null;
  // 3.8.6: una partida que tira al sanearla (un número guardado como objeto raro: `{ "toString": 1 }`) dejaba el juego sin
  // arrancar, y la copia de seguridad buena nunca se probaba. Ahora se prueba la copia, y el principal roto no la pisa.
  let limpio = null;
  try { limpio = sanearProgreso(p); } catch { limpio = null; }
  if (!limpio && ultimoOrigenCarga === 'principal') {
    let b = null;
    try { b = parsear(localStorage.getItem(CLAVE_BACKUP)); } catch { b = null; }
    if (progresoPlausible(b)) { try { limpio = sanearProgreso(b); } catch { limpio = null; } }
    if (limpio) { ultimoOrigenCarga = 'backup'; ultimoPrincipalValidoTexto = null; principalRoto = true; }
  }
  if (!limpio) return null;
  p = limpio;
  // las miniaturas viven aparte y se vuelven a pegar al cargar
  const fotos = leerFotosDe(CLAVE_FOTOS);   // 3.8.4: (de los archivos de la partida)
  // 2.6.1: sólo las propias y que sean imagen (un `fotos.constructor` heredado se colaba)
  for (const [k, v] of Object.entries(p.desafios || {})) if (Object.hasOwn(fotos, k) && typeof fotos[k] === 'string' && objeto(v)) v.img = fotos[k];
  return p;
}

// Las miniaturas del álbum pesan mucho más que el resto de la partida,
// así que van en su propia clave y solo se escriben cuando cambian.
// 3.8.6: `reemplazar` (importar, sincronizar): la partida queda con exactamente éstas; sin eso, sólo se agregan
export function guardarFotos(desafios, reemplazar = false) {
  const soloImagenes = {};
  for (const [k, v] of Object.entries(desafios || {})) if (v && v.img) soloImagenes[k] = v.img;
  return escribirFotosDe(CLAVE_FOTOS, soloImagenes, reemplazar);   // 3.8.4
}
export function cargarFotos() { return leerFotosDe(CLAVE_FOTOS); }
export function borrarFotos() { borrarFotosDe(CLAVE_FOTOS); }

export function guardarProgreso(p) {
  const limpio = sanearProgreso(p);
  if (!limpio) return false;
  // La partida va sin imágenes: son lo que hace pesada la escritura.
  const desafios = {};
  for (const [k, v] of Object.entries(limpio.desafios || {})) desafios[k] = { dia: finito(v?.dia, limpio.dia), hora: finito(v?.hora, limpio.horas) };
  try {
    // El backup SOLO se reemplaza por un principal que ya era JSON válido.
    // RC24 reutiliza la última copia principal validada; si venimos de un
    // backup/corrupción, valida una sola vez antes de empezar la nueva cadena.
    let anteriorTexto = ultimoPrincipalValidoTexto;
    if (!anteriorTexto && !principalRoto) {
      const candidato = localStorage.getItem(CLAVE);
      const anterior = parsear(candidato);
      if (progresoPlausible(anterior)) { anteriorTexto = candidato; ultimoSello = Math.max(ultimoSello, selloDe(anterior)); ultimaSecuencia = Math.max(ultimaSecuencia, secuenciaDe(anterior)); }
    }
    // 3.8.6: el sello de cuándo se guardó nunca va para atrás en una partida, aunque el reloj de esta computadora atrase:
    // la carpeta sincronizada compara sellos de dos computadoras, y con el de una atrasada lo jugado acá quedaba «más viejo»
    // que lo que la otra ya había visto y se pisaba sin preguntar. Tampoco por debajo del de una partida importada.
    const guardadoEn = Math.max(Date.now(), ultimoSello + 1, selloDe(limpio));
    let nuevo;
    const secuencia = Math.max(ultimaSecuencia, secuenciaDe(limpio)) + 1;   // 4.0.1
    try { nuevo = JSON.stringify({ ...limpio, desafios, guardadoEn, secuencia }); } catch { return false; }
    if (anteriorTexto) localStorage.setItem(CLAVE_BACKUP, anteriorTexto);
    if (!escribirTexto(CLAVE, nuevo)) return false;
    ultimoPrincipalValidoTexto = nuevo;
    ultimoSello = guardadoEn;
    ultimaSecuencia = secuencia;
    principalRoto = false;
    return true;
  } catch { return false; }
}
// 4.10.3 (P10): una partida nueva en el lugar de la que había (Empezar de nuevo, Otra vuelta, Otra corrida): se escribe la nueva y
// recién ahí se borran las fotos; si no cupo (cuota, disco), vuelve lo que había (principal, copia y miniatura) y devuelve false.
// Antes se borraba todo primero y un `setItem` que fallaba dejaba la ranura vacía y sin copia.
export function reemplazarProgreso(nuevo) {
  const claves = [CLAVE, CLAVE_BACKUP, CLAVE_VISTA];
  let previos = null;
  try { previos = claves.map((k) => localStorage.getItem(k)); } catch { previos = null; }
  const marcas = [ultimoPrincipalValidoTexto, ultimoSello, ultimaSecuencia];
  ultimoPrincipalValidoTexto = null; ultimoSello = 0; ultimaSecuencia = 0;
  try { for (const k of claves) localStorage.removeItem(k); } catch {}
  if (guardarProgreso(nuevo)) {
    borrarFotosDe(CLAVE_FOTOS);
    try { localStorage.removeItem(CLAVE_FOTOS); } catch {}
    return true;
  }
  [ultimoPrincipalValidoTexto, ultimoSello, ultimaSecuencia] = marcas;
  try { claves.forEach((k, i) => { if (previos && previos[i] != null) localStorage.setItem(k, previos[i]); else localStorage.removeItem(k); }); } catch {}
  return false;
}
export function borrarProgreso() { ultimoPrincipalValidoTexto = null; ultimoSello = 0; ultimaSecuencia = 0; borrarFotosDe(CLAVE_FOTOS); try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_BACKUP); localStorage.removeItem(CLAVE_FOTOS); localStorage.removeItem(CLAVE_VISTA); } catch {} }
