// 4.15.0 (B): ayudas PURAS para escribir las escenas de la Historia como datos (sin three ni DOM; se prueban en Node).
// Las escenas del acto I (historia-escenas-acto1.js) usan estos constructores: devuelven los mismos pasos que entiende el director
// (escenas.js), sólo que más cortos de escribir. Acá también están:
//   · los personajes de la Historia con la clave que tienen en el juego (`PERSONAJES_HISTORIA`);
//   · la tabla de gestos del guion (`reír`, `suspirar`…) a las poses que de verdad existen (`POSE_DE`);
//   · la CONVENCIÓN DE NOMBRES de los efectos y las condiciones (`parsearEfecto`, `CONDICIONES_HISTORIA`): el agente que arma el
//     aplicador (historia.js) registra cada nombre con `director.registrarEfecto(nombre, fn)`; `efectosDe(escena)` da la lista
//     exacta que una escena usa, y `parsearEfecto(nombre)` lo desarma en {tipo, ...} para no tener que repetir la sintaxis.
//
// Convención de efectos (todos idempotentes y de una sola vez por partida; el director los corre uno a uno, también al saltar):
//   lazo:<quien>:<n>        sube o baja el lazo (−3 a +3 por efecto). quien: ramon | ema (Josefina) | ercilia | guarda (Elsa) | fermin |
//                           graciela; y los secundarios rosa | herminia | nicanor | tito | tobias | belisario (si la historia no los lleva, se ignora)
//   decision:<d>:<a|b|c>    guarda la decisión grande (d: bolsa | coihue | molienda | cuaderno | majada). Pisa la anterior (la última acción manda)
//   ramal:<n>               suma n a la cuenta del ramal
//   raro:<id>               anota el indicio en el cuaderno de lo raro (id de TEXTO_ACTO1.raro; no se repite)
//   objeto:<id>             el objeto de historia queda a mano / en la mochila (canto-blanco, puertita, foto-eusebio, bolsa-eusebio…)
//   entrega:<id>            el objeto de historia sale de la mochila (se lo dio a alguien)
//   dar:<cosa>:<n>          el jugador recibe n de una cosa de la economía (pan, yerba, tabla…)
//   mundo:<id>              pone o cambia algo en el mundo (la ronda de ramitas, el hacha en el tocón, la bolsa que desaparece…); lleva `args`
//   duende:<id>             un duende de historia hace algo (cruza el sendero, mira desde las raíces…); lleva `args` (historia-duendes.js)
//   optativa:<id>           ofrece una optativa (suma la entrada al tablón de historia)
//   hablado:<clave>         anota que ya hablaste con esa persona (para el objetivo «conocé a los vecinos»)
// Convención de condiciones (`si: { cond, args }`; las registra quien aplica la historia con `director.registrarCondicion`):
//   decision  { d, es }     la decisión d vale es ('a' | 'b' | 'c' | 'ninguna' si todavía no se tomó)
//   lazo      { quien, min?, max? }
//   evento    { id }        el evento del valle (tobillo, oveja, derrumbe…) ya pasó
//   (4.17.0) trato { es: 'trato'|'pelea' } · noche { es: 'ganada'|'perdida' } · convidado { min } · deuda { es: 'pagada'|'debe' } · perdon · prestado { quien } · amor

export const LAZOS_PRINCIPALES = ['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'];
export const LAZOS_SECUNDARIOS = ['rosa', 'herminia', 'nicanor', 'tito', 'tobias', 'belisario'];
export const DECISIONES = ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada', 'duendes'];   // (4.17.0: D6 `duendes`: a y b = trato, c = pelea)
export const TIPOS_EFECTO = ['lazo', 'decision', 'ramal', 'raro', 'objeto', 'entrega', 'dar', 'mundo', 'duende', 'optativa', 'hablado', 'quitar', 'prestado'];   // (4.16.0: quitar:<cosa>:<n> gasta algo; prestado:<id> anota lo prestado)
export const CONDICIONES_HISTORIA = ['decision', 'lazo', 'evento', 'presente', 'trato', 'noche', 'convidado', 'deuda', 'perdon', 'prestado', 'amor'];   // (4.17.0: las del acto III)   // (4.16.0: presente { quien }: esa persona vive ahora en la aldea)

const ID_SUELTO = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const entero = (s) => /^-?\d{1,3}$/.test(s) ? Number(s) : null;

// 'lazo:ema:-1' → { tipo: 'lazo', quien: 'ema', n: -1 }. Devuelve null si el nombre no sigue la convención.
export function parsearEfecto(nombre) {
  if (typeof nombre !== 'string') return null;
  const p = nombre.split(':');
  const tipo = p[0];
  if (!TIPOS_EFECTO.includes(tipo)) return null;
  switch (tipo) {
    case 'lazo': {
      const n = entero(p[2]);
      if (p.length !== 3 || n === null || n === 0 || Math.abs(n) > 3) return null;
      return [...LAZOS_PRINCIPALES, ...LAZOS_SECUNDARIOS].includes(p[1]) ? { tipo, quien: p[1], n } : null;
    }
    case 'decision':
      return p.length === 3 && DECISIONES.includes(p[1]) && ['a', 'b', 'c'].includes(p[2]) ? { tipo, d: p[1], v: p[2] } : null;
    case 'ramal': {
      const n = entero(p[1]);
      return p.length === 2 && n !== null && n > 0 && n <= 10 ? { tipo, n } : null;
    }
    case 'dar': case 'quitar': {
      const n = entero(p[2]);
      return p.length === 3 && ID_SUELTO.test(p[1] || '') && n !== null && n > 0 && n <= 99 ? { tipo, cosa: p[1], n } : null;
    }
    default:
      return p.length === 2 && ID_SUELTO.test(p[1] || '') ? { tipo, id: p[1] } : null;
  }
}

// Todos los nombres de efecto que una escena puede correr (pasos, opciones de elección, fundidos), sin repetir.
export function efectosDe(escena) {
  const nombres = new Set();
  const paso = (p) => {
    if (!p || typeof p !== 'object') return;
    if (p.tipo === 'efecto' && typeof p.nombre === 'string') nombres.add(p.nombre);
    if (p.tipo === 'eleccion') for (const o of p.opciones || []) if (typeof o.efecto === 'string') nombres.add(o.efecto);
    if (p.tipo === 'fundido') for (const q of p.alMedio || []) paso(q);
  };
  for (const p of (escena && escena.pasos) || []) paso(p);
  return [...nombres];
}
// Las condiciones `cond` que una escena usa (para saber que el aplicador las tiene registradas)
export function condicionesDe(escena) {
  const nombres = new Set();
  for (const p of (escena && escena.pasos) || []) if (p && p.si && typeof p.si.cond === 'string') nombres.add(p.si.cond);
  return [...nombres];
}

// ---------------------------------------------------------------- personajes
// `clave`: la que tiene la persona en el juego (gente.js, aldea.js, gente-campo.js). Graciela todavía no existe (pedido para el agente A).
export const PERSONAJES_HISTORIA = {
  elsa: { clave: 'guarda', nombre: 'Elsa', color: '#9aa6d9' },
  ramon: { clave: 'ramon', nombre: 'Don Ramón', color: '#c9a36a' },
  josefina: { clave: 'ema', nombre: 'Josefina', color: '#a8c97a' },
  ercilia: { clave: 'ercilia', nombre: 'Ercilia', color: '#d98f6a' },
  nicanor: { clave: 'nicanor', nombre: 'Nicanor', color: '#7fb4c9' },
  nelida: { clave: 'nelida', nombre: 'Nélida', color: '#d9b3a0' },
  ernesto: { clave: 'jefe', nombre: 'Ernesto', color: '#8fa3b8' },
  herminia: { clave: 'abuela', nombre: 'Herminia', color: '#c7a8c9' },
  rosa: { clave: 'panadera', nombre: 'Rosa', color: '#e0b07a' },
  fermin: { clave: 'fermin', nombre: 'Fermín', color: '#b9a089' },
  graciela: { clave: 'graciela', nombre: 'Graciela', color: '#c9bb8a' },
  nota: { clave: null, nombre: 'La nota', color: '#e8d9b0' },
  narra: { clave: null, nombre: '', color: '#e9dfc4' },
};
// sólo los que una escena usa (así cada una declara lo suyo)
export function personajesDe(...nombres) {
  const r = {};
  for (const n of nombres) if (Object.hasOwn(PERSONAJES_HISTORIA, n)) r[n] = { ...PERSONAJES_HISTORIA[n] };
  return r;
}

// El gesto del guion (entre corchetes) → la pose que existe en escenas-mundo.js
export const POSE_DE = {
  saludar: 'saludo', abrazar: 'saludo', senalar: 'senalar', asentir: 'asentir', negar: 'negar', encogerse: 'encoger', sorprenderse: 'mirar',
  pensar: 'pensar', cruzarse: 'cruzados', reir: 'cintura', 'hacer-broma': 'cintura', suspirar: 'juntas', susurrar: 'juntas', 'tomar-mate': 'brindar',
  'cebar-mate': 'brindar', barba: 'barba', amasar: 'tocar', contar: 'contar', mirar: 'mirar', leer: 'pensar', 'palmada': 'asentir',
};

// ---------------------------------------------------------------- constructores de pasos
// un gesto dentro de una línea de diálogo (se pierde al saltar: lo que tiene que valer va en pasos)
export const gs = (gesto, dur = 1.8) => ({ accion: 'posar', pose: POSE_DE[gesto] || gesto, dur });
// plano sobre el hombro de `desde` (el jugador) hacia `a`, para una línea de diálogo
export const hombro = (a, o = {}) => ({ plano: 'hombro', desde: 'jugador', a, mezcla: 0.6, dur: 30, sinEsperar: true, ...o });
export const linea = (texto, o = {}) => ({ texto, ...o });
export const dlg = (quien, lineas, o = {}) => ({ tipo: 'dialogo', quien, lineas, ...o });
export const narra = (...lineas) => ({ tipo: 'dialogo', quien: 'narra', lineas });
export const plano = (tipoPlano, a, o = {}) => ({ tipo: 'plano', plano: tipoPlano, a, ...o });
export const pose = (quien, gesto, o = {}) => ({ tipo: 'gesto', quien, accion: 'posar', pose: POSE_DE[gesto] || gesto, sinEsperar: true, ...o });
export const aparece = (quien, a, mira = 'jugador') => ({ tipo: 'gesto', quien, accion: 'aparecer', a, mira });
export const camina = (quien, a, o = {}) => ({ tipo: 'gesto', quien, accion: 'caminar', a, ...o });
export const mira = (quien, a, o = {}) => ({ tipo: 'gesto', quien, accion: 'mirar', a, ...o });
export const desaparece = (quien) => ({ tipo: 'gesto', quien, accion: 'desaparecer' });
export const espera = (dur) => ({ tipo: 'espera', dur });
export const sonido = (id, o = {}) => ({ tipo: 'sonido', id, ...o });
export const efecto = (nombre, args) => (args === undefined ? { tipo: 'efecto', nombre } : { tipo: 'efecto', nombre, args });
export const opcion = (id, texto, o = {}) => ({ id, texto, ...o });
// una elección: `sabor: true` en la opción dice que no cambia nada más que el tono (la prueba lo exige: o lleva efecto o es de sabor)
export const eleccion = (id, pregunta, opciones, porDefecto = 0) => ({ tipo: 'eleccion', id, pregunta, opciones, porDefecto });
// una condición sobre lo ya elegido en esta escena
export const siEleg = (id, es) => ({ eleccion: id, es });
export const siDecision = (d, es) => ({ cond: 'decision', args: { d, es } });
export const siLazo = (quien, min, max) => ({ cond: 'lazo', args: { quien, min, max } });
export const siEvento = (id) => ({ cond: 'evento', args: { id } });
// 4.16.0: esa persona ya vive en la aldea (`ausente: true`: todavía no llegó)
export const siPresente = (quien, ausente = false) => (ausente ? { cond: 'presente', args: { quien }, no: true } : { cond: 'presente', args: { quien } });
