// 4.31.0 (B): el pueblo y la gente, al detalle. Las reglas y los textos de lo que reacciona en la Aldea de los Duendes
// (lo que se ve y se oye está en pueblo-detalles-juego.js y las poses en pueblo-detalles-pose.js):
//   · los vecinos te saludan cuando pasás cerca y los mirás, y se quejan si los chocás o les apagás la luz;
//   · con lluvia se tapan la cabeza, con frío se frotan las manos y, si nieva, se sacuden la nieve al entrar;
//   · golpear la puerta de una casa (contesta el que está adentro, o nadie);
//   · la campanita de los locales al entrar y la campana de la escuela (entrada, recreo y salida);
//   · los carteles de los locales se leen (abierto o cerrado, y lo del día: el pan, el pescado, el menú);
//   · los perros de la aldea se dejan acariciar y te siguen un rato más;
//   · el humo de las chimeneas y la luz de las ventanas, sólo donde hay alguien (y despierto);
//   · el boletín pegado en el buzón de la estafeta: lo que pasó ayer en el valle;
//   · la llave de la luz junto a la puerta: la apagás y el que está adentro se queja (y la vuelve a prender); si no hay nadie,
//     queda apagada hasta que vuelva el dueño. Eso se guarda (`progreso.puebloDetalles`).
// Módulo puro (sin three ni DOM): se prueba en Node. Nada religioso (la campana es la de la escuela).
import { EDIFICIOS_ALDEA, esEdificioAldea, rutinaAldea, diaSemanaDe, ORDEN_VECINOS_ALDEA, VECINOS_DEL_VALLE, esPobladorAldea, localAbierto } from './aldea.js';
import { eventoDelDia } from './aldea-viva.js';
import { eventosDelDia, nombreDe } from './aldea-vida.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : d);
const horaSana = (h) => ((((Number(h) || 0) % 24) + 24) % 24);
// el elegido de una lista para un número cualquiera (el mismo número, la misma frase)
export const elegir = (lista, n) => lista[((entero(n, 0) % lista.length) + lista.length) % lista.length];

// ---------------------------------------------------------------- medidas
export const PUEBLO = {
  saludo: { radio: 6, mira: 0.9, cadaVecino: 150, cadaUno: 7 },   // a menos de 6 m y mirándolo (coseno), una vez cada 150 s por vecino y uno cada 7 s
  choque: { radio: 0.75, velocidad: 1.6, cada: 6, memoria: 60 },   // tocándolo (a 75 cm) yendo a más de 1,6 m/s; las quejas seguidas se cuentan 60 s
  golpe: { valido: 25 },          // después de golpear, la E abre (25 s)
  luz: { velador: 0.1, vuelve: 4 }, // dormidos, apenas el velador; el que se queja la vuelve a prender a los 4 s
  campanita: { cada: 45 },        // la campanita de un local, a lo sumo cada 45 s
  perro: { radio: 1.7, extra: 40 },  // a menos de 1,7 m se acaricia y te sigue 40 s más
  revisar: 0.25,                  // cada cuánto se mira la gente de alrededor (s)
  lejos: 40,                      // la gente que reacciona, a menos de esto
};

// ---------------------------------------------------------------- el saludo
const SALUDOS = {
  manana: ['¡Buen día!', '¡Buen día! ¿Cómo andás?', 'Buenas, ¿todo bien?', '¡Buen día, vecino!'],
  tarde: ['¡Buenas tardes!', 'Buenas, ¿qué tal?', '¡Hola! ¿Cómo va?', '¡Buenas! ¿Todo en orden?'],
  noche: ['Buenas noches.', '¡Buenas! Andá abrigado.', 'Buenas noches, ¿todo tranquilo?'],
  lluvia: ['¡Qué manera de llover!', 'Buenas… ¡qué día, eh!', '¡Buenas! Que no te agarre el chaparrón.'],
  nieve: ['¡Buenas! Cuidado que resbala.', 'Abrigate, que hiela.', '¡Qué nevada, eh!'],
  frio: ['¡Buenas! Qué frío, ¿no?', 'Buenas… ¡está para quedarse adentro!'],
  chico: ['¡Hola!', '¡Holaaa!', '¡Hola! ¿Jugás?'],
};
// `clima`: 'lluvia' | 'nieve' | 'frio' | null; `chico`: si es uno de los chicos
export function saludoPara(horas, clima = null, n = 0, chico = false) {
  if (chico) return elegir(SALUDOS.chico, n);
  if (clima && Object.hasOwn(SALUDOS, clima)) return elegir(SALUDOS[clima], n);
  const h = horaSana(horas);
  return elegir(h >= 5 && h < 12.5 ? SALUDOS.manana : h < 20 && h >= 12.5 ? SALUDOS.tarde : SALUDOS.noche, n);
}
// ¿te saluda? `d`: la distancia; `mira`: el coseno entre adonde mirás y hacia él; `t`: el reloj (s); `ultimo`: cuándo te saludó él; `ultimoUno`: cuándo saludó cualquiera
export function leToca(d, mira, t, ultimo = -Infinity, ultimoUno = -Infinity) {
  const S = PUEBLO.saludo;
  return Number.isFinite(d) && d < S.radio && mira > S.mira && t - ultimo >= S.cadaVecino && t - ultimoUno >= S.cadaUno;
}

// ---------------------------------------------------------------- el choque
const QUEJAS_CHOQUE = ['¡Epa! Mirá por dónde andás.', '¡Uy! ¡Cuidado!', '¡Ay, mi pie!', 'Despacio, que no es carrera.', '¡Eh! ¿Adónde vas tan apurado?'];
const QUEJAS_OTRA_VEZ = ['¡Otra vez! ¿Qué te pasa?', '¡Basta, che!', '¿Lo hacés a propósito?'];
// la queja según cuántas veces lo chocaste seguido (1 = la primera)
export const quejaChoque = (veces, n = 0) => (veces >= 3 ? elegir(QUEJAS_OTRA_VEZ, n) : elegir(QUEJAS_CHOQUE, n));
// la animación de la queja (las de social-anim.js)
export const animQueja = (veces) => (veces >= 3 ? 'cruzarse-brazos' : veces === 2 ? 'quejarse' : 'sorprenderse');
// ¿lo chocaste? (`v`: tu velocidad en m/s; `acerca`: si venías hacia él)
export const loChocaste = (d, v, acerca = true) => Number.isFinite(d) && d < PUEBLO.choque.radio && v > PUEBLO.choque.velocidad && !!acerca;

// ---------------------------------------------------------------- el clima en la gente
// 'nieve' | 'lluvia' | 'frio' | null. `lluvia` 0 a 1 (con invierno es nieve), `invierno` 0 a 1, `noche` 0 a 1
export function climaDeGente(lluvia = 0, invierno = 0, noche = 0) {
  if (lluvia > 0.3) return invierno > 0.5 ? 'nieve' : 'lluvia';
  if (invierno > 0.6 || (invierno > 0.35 && noche > 0.6)) return 'frio';
  return null;
}
// La pose de clima de alguien (la pone pueblo-detalles-pose.js): caminando bajo la lluvia o la nieve, se tapa la cabeza;
// parado al frío (sin pose propia), se frota las manos. Bajo techo, nada.
export function gestoDeClima(clima, { andando = false, bajoTecho = false, pose = null, charlando = false } = {}) {
  if (!clima || bajoTecho || charlando) return null;
  if ((clima === 'lluvia' || clima === 'nieve') && andando) return 'taparse';
  if (!andando && !pose && clima !== 'lluvia') return 'frotarse';
  return null;
}

// ---------------------------------------------------------------- quién está en cada casa
// Los de la aldea: los vecinos, los del valle que viven ahí (Ercilia) y los pobladores que ya llegaron.
export function presentesAldea(aldea) {
  const a = objeto(aldea) ? aldea : {};
  const lista = [...ORDEN_VECINOS_ALDEA, ...Object.keys(VECINOS_DEL_VALLE), ...(Array.isArray(a.pobladores) ? a.pobladores : []).map((p) => p?.clave).filter(esPobladorAldea)];
  return [...new Set(lista)];
}
const esCama = (punto) => typeof punto === 'string' && /^cama/.test(punto);
// edificio → { despiertos: [claves], dormidos: [claves] }. `destinoDe(k)`: donde está ahora (el de aldea-gente.js, con lo que eligió
// en su tiempo libre); sin eso, su horario. Sólo cuenta el que está adentro (o en su cama).
export function ocupacion(aldea, horas, dia, { destinoDe = null, presentes = null } = {}) {
  const salida = new Map();
  const ds = diaSemanaDe(dia);
  for (const k of presentes || presentesAldea(aldea)) {
    let d = null;
    try { d = destinoDe?.(k) || null; } catch { d = null; }
    if (!d) d = rutinaAldea(k, horas, ds, aldea, dia);
    if (!d || !d.edificio || !esEdificioAldea(d.edificio) || d.edificio === 'plaza') continue;
    const dentro = d.adentro !== undefined ? !!d.adentro || esCama(d.punto) : d.punto === 'adentro' || esCama(d.punto) || /^(mesa|silla|pupitre|sillon|banco-adentro)/.test(d.punto || '');
    if (!dentro) continue;
    if (!salida.has(d.edificio)) salida.set(d.edificio, { despiertos: [], dormidos: [] });
    salida.get(d.edificio)[esCama(d.punto) ? 'dormidos' : 'despiertos'].push(k);
  }
  return salida;
}
// Los lugares que nunca se apagan (la estación, el taller, la cantina de noche: tienen su horario y su gente de paso)
export const SIEMPRE_PRENDIDOS = new Set(['estacion-aldea', 'taller-tren', 'plaza', 'cantina']);
// La luz de un edificio (0 a 1; la multiplica lo prendido del alumbrado): con alguien despierto, entera; todos dormidos, el
// velador; nadie, apagada. La que apagaste vos queda apagada mientras no vuelva nadie despierto (`apagadas`).
export function luzDeEdificio(id, ocup, apagadas = null) {
  if (SIEMPRE_PRENDIDOS.has(id)) return 1;
  const o = ocup?.get?.(id);
  if (objeto(apagadas) && Object.hasOwn(apagadas, id)) return 0;
  if (!o) return 0;
  return o.despiertos.length ? 1 : o.dormidos.length ? PUEBLO.luz.velador : 0;
}
// El humo de la chimenea: si hay alguien (despierto o durmiendo: la estufa queda prendida), o en los lugares de siempre
export const hayHumo = (id, ocup) => SIEMPRE_PRENDIDOS.has(id) || !!(ocup?.get?.(id) && (ocup.get(id).despiertos.length || ocup.get(id).dormidos.length));

// ---------------------------------------------------------------- golpear la puerta
const ABRE = ['¡Voy!', '¡Pasá, que está abierto!', '¿Quién es? ¡Ah, sos vos! Pasá nomás.', '¡Un momentito, ya va!'];
const TARDE = ['¿A esta hora? Mañana, mañana.', 'Estamos por acostarnos… ¡mañana!'];
// Lo que pasa cuando golpeás. `nombreDe(k)`: el nombre corto. Devuelve { tipo: 'abre'|'tarde'|'duerme'|'nadie', quien, texto }.
export function respuestaPuerta(id, ocup, horas, n = 0, nombreDe = (k) => k) {
  const o = ocup?.get?.(id) || { despiertos: [], dormidos: [] };
  const h = horaSana(horas);
  if (o.despiertos.length) {
    const quien = elegir(o.despiertos, n);
    const tarde = h >= 23 || h < 6;
    return { tipo: tarde ? 'tarde' : 'abre', quien, texto: `${nombreDe(quien) || 'Alguien'}: «${elegir(tarde ? TARDE : ABRE, n)}»` };
  }
  if (o.dormidos.length) return { tipo: 'duerme', quien: null, texto: 'Nadie contesta. Adentro se oye roncar.' };
  return { tipo: 'nadie', quien: null, texto: 'No contesta nadie: no hay nadie en casa.' };
}
// Las puertas que se golpean: las de las casas (las de los locales se abren nomás)
export const seGolpea = (id) => esEdificioAldea(id) && EDIFICIOS_ALDEA[id].rol === 'casa';

// ---------------------------------------------------------------- la luz que apagás
const QUEJAS_LUZ = ['¡Eh! ¡Que estoy acá!', '¿Quién apagó la luz?', '¡No veo nada! Prendé, por favor.'];
export const quejaLuz = (n = 0) => elegir(QUEJAS_LUZ, n);
// Las casas y los locales tienen llave de la luz junto a la puerta (la estación, el taller, la plaza y la cantina no)
export const tieneLlave = (id) => esEdificioAldea(id) && !SIEMPRE_PRENDIDOS.has(id) && ['casa', 'local', 'biblioteca', 'escuela', 'almacen', 'casa-te'].includes(EDIFICIOS_ALDEA[id].rol);

// ---------------------------------------------------------------- campanita y campana
// Los que tienen campanita en la puerta (los locales con mostrador)
export const CAMPANITA = new Set(['almacen', 'panaderia', 'pescaderia', 'sala-miel', 'herboristeria', 'costureria', 'ceramica', 'hilanderia', 'estafeta', 'estudio-fotos', 'casa-te', 'carpinteria', 'veterinaria']);
const BIENVENIDAS = ['¡Buenas! Pasá nomás.', '¡Hola! ¿Qué andabas buscando?', '¡Buenas! Enseguida te atiendo.'];
export const bienvenida = (n = 0) => elegir(BIENVENIDAS, n);
// La campana de la escuela: la entrada (8:30), el recreo (10:30) y la salida (12:30), de lunes a viernes, con la escuela abierta.
export const CAMPANA_ESCUELA = [{ hora: 8.5, que: 'entrada' }, { hora: 10.5, que: 'recreo' }, { hora: 12.5, que: 'salida' }];
// ¿Suena entre `antes` y `ahora` (horas del juego, el mismo día)? Devuelve el toque o null.
export function campanaEscuela(antes, ahora, dia, aldea) {
  if (diaSemanaDe(dia) >= 5 || !localAbierto(objeto(aldea) ? aldea : {}, 'escuela')) return null;
  const a = Number(antes), b = Number(ahora);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || b - a > 1) return null;
  return CAMPANA_ESCUELA.find((c) => a < c.hora && b >= c.hora) || null;
}

// ---------------------------------------------------------------- los carteles
// Lo del día de cada local (cambia cada día, el mismo para todas las partidas)
const DEL_DIA = {
  panaderia: { que: 'Hoy salió del horno', lista: ['pan casero y facturas', 'pan de campo y bizcochitos', 'tortas fritas y pan dulce', 'medialunas de manteca', 'galletas de campo y pan de salvado'] },
  pescaderia: { que: 'Pesca del día', lista: ['truchas del lago', 'percas frescas', 'trucha ahumada', 'pejerrey del lago'] },
  'sala-miel': { que: 'Hoy hay', lista: ['miel de ulmo', 'miel de flores del valle', 'propóleo y velas de cera', 'miel cremosa'] },
  herboristeria: { que: 'Para el mate de hoy', lista: ['cedrón y menta', 'paico y manzanilla', 'burrito y poleo', 'yerba con cáscara de naranja'] },
  cantina: { que: 'Menú del día', lista: ['guiso de lentejas', 'empanadas al horno', 'locro', 'milanesa con puré', 'cordero al disco'] },
  'casa-te': { que: 'Hoy con el té', lista: ['torta galesa', 'scones con dulce de frambuesa', 'pan con manteca y dulce de rosa mosqueta', 'torta de crema'] },
  escuela: { que: 'En el pizarrón de la puerta', lista: ['«Hoy: lectura y cuentas. Recreo a las 10:30»', '«Hoy: los ríos del valle»', '«Hoy: dibujo y música»', '«Traer una hoja seca para mañana»'] },
  salon: { que: 'Este sábado', lista: ['baile de 17 a 19, con el músico', 'baile y torta frita', 'baile de 17 a 19: se invita a todos'] },
  estafeta: { que: 'Hoy', lista: ['correo con el tren de la mañana', 'telegrama: preguntar en la ventanilla', 'sale «La Hoja de los Duendes»'] },
};
const CARTEL_FIJO = {
  'Aldea de los Duendes': 'Estación Aldea de los Duendes. Ramal de trocha angosta. Que tengas buen viaje.',
  'Plaza de los Duendes': 'Plaza de los Duendes. Se ruega no pisar los canteros (los perros no saben leer).',
  Bienvenidos: 'Bienvenidos a la Aldea de los Duendes.',
  Cargas: 'Cargas: se reciben bultos hasta media hora antes del tren.',
  Correo: 'Correo: la valija sale con el tren de la tarde.',
};
// Lo que dice un cartel. `edificio`: de qué edificio es; `texto`: lo escrito; `abierto`: true | false | null (no se sabe).
// Devuelve { titulo, partes } (para leerlo como una charla).
export function lecturaCartel(edificio, texto, { abierto = null, dia = 1 } = {}) {
  const titulo = String(texto || EDIFICIOS_ALDEA[edificio]?.nombre || 'El cartel').slice(0, 60);
  if (Object.hasOwn(CARTEL_FIJO, titulo)) return { titulo, partes: [CARTEL_FIJO[titulo]] };
  if (/^Lote para /.test(titulo)) return { titulo, partes: [`«${titulo}». Todavía es un terreno con estacas.`] };
  const partes = [`«${titulo}».`];
  if (abierto === true) partes[0] += ' Abierto.';
  else if (abierto === false) partes[0] += ' Cerrado: vuelva más tarde.';
  if (Object.hasOwn(DEL_DIA, edificio)) { const d = DEL_DIA[edificio]; partes.push(`${d.que}: ${elegir(d.lista, entero(dia, 1))}.`); }
  return { titulo, partes };
}

// ---------------------------------------------------------------- el boletín del buzón
// Lo que pasó ayer en el valle, pegado en el buzón de la estafeta (lo escribe Benigno, el telegrafista): lo que movió los precios, los
// cumpleaños, quién llegó a la aldea y qué local abrió. `dia`: hoy. Devuelve { titulo, partes } (para leerlo como una charla).
const AYER_EVENTO = { 'tren-demorado': 'el tren llegó demorado', fiesta: 'hubo fiesta en el pueblo', helada: 'cayó una helada fuerte', cosecha: 'hubo buena cosecha', obra: 'se armó una obra grande' };
export function boletinDeAyer(dia, aldea = null) {
  const hoy = Math.max(1, entero(dia, 1)), ayer = hoy - 1;
  const titulo = 'El boletín de la estafeta';
  if (ayer < 1) return { titulo, partes: ['«Primer boletín. Todavía no pasó nada: el valle recién se despierta». Firma Benigno, de la estafeta.'] };
  const a = objeto(aldea) ? aldea : {};
  const partes = [];
  const ev = eventoDelDia(ayer);
  if (ev) partes.push(`Ayer ${Object.hasOwn(AYER_EVENTO, ev.id) ? AYER_EVENTO[ev.id] : ev.titulo.toLowerCase()}. ${ev.texto}`);
  for (const e of eventosDelDia(ayer, { aldea: a })) if (e.tipo === 'cumple') partes.push(`Ayer cumplió años ${e.nombre}. ¡Que sean muchos más!`);
  for (const q of Array.isArray(a.pobladores) ? a.pobladores : []) if (q && entero(q.dia, 0) === ayer && esPobladorAldea(q.clave)) partes.push(`Llegó a la aldea ${nombreDe(q.clave) || 'alguien nuevo'}: pasen a saludar.`);
  for (const [id, d] of Object.entries(objeto(a.locales) ? a.locales : {})) if (entero(d, 0) === ayer && esEdificioAldea(id)) partes.push(`Abrió ${EDIFICIOS_ALDEA[id].nombre.replace(/^La /, 'la ').replace(/^El /, 'el ')}.`);
  if (!partes.length) partes.push('Ayer fue un día tranquilo en el valle: nada para contar, que también es una noticia.');
  partes.push('Firma Benigno, de la estafeta.');
  return { titulo, partes: partes.slice(0, 6) };
}

// ---------------------------------------------------------------- los perros
const MIMOS = ['mueve la cola', 'se tira panza arriba', 'te lame la mano', 'se sienta a tu lado'];
export const mimoPerro = (nombre, n = 0) => `${nombre || 'El perro'} ${elegir(MIMOS, n)}`;

// ---------------------------------------------------------------- el guardado
// { apagadas: { edificio: día } } (las luces que apagaste vos y siguen apagadas)
export const puebloNuevo = () => ({ apagadas: {} });
export function sanearPueblo(v, hoy = null) {
  const s = puebloNuevo();
  if (!objeto(v) || !objeto(v.apagadas)) return s;
  const tope = Number.isFinite(Number(hoy)) ? Math.max(1, Math.floor(Number(hoy))) : 1e6;
  for (const [k, d] of Object.entries(v.apagadas)) {
    if (!esEdificioAldea(k) || !tieneLlave(k)) continue;
    const n = entero(d, 0);
    if (n >= 1 && n <= tope) s.apagadas[k] = n;
  }
  return s;
}
// Apagar o prender la luz de un edificio (con la llave). Devuelve si quedó apagada.
export function cambiarLuz(estado, id, dia) {
  if (!objeto(estado) || !tieneLlave(id)) return false;
  if (!objeto(estado.apagadas)) estado.apagadas = {};
  if (Object.hasOwn(estado.apagadas, id)) { delete estado.apagadas[id]; return false; }
  estado.apagadas[id] = Math.max(1, entero(dia, 1));
  return true;
}
// Cuando vuelve alguien despierto a una casa con la luz apagada (por vos), la prende. Devuelve los edificios que se prendieron.
export function volvieron(estado, ocup) {
  const prendidas = [];
  if (!objeto(estado?.apagadas)) return prendidas;
  for (const k of Object.keys(estado.apagadas)) if (ocup?.get?.(k)?.despiertos?.length) { delete estado.apagadas[k]; prendidas.push(k); }
  return prendidas;
}
