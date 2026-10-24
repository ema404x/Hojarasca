// 4.10 guardian: el bestiario que premia (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Estudiar a un tipo de duende es abatirlo: con 5, 15 y 40 abatidos (el enjambre, que viene de a docenas, con cuatro
// veces más) se desbloquea un dato útil que queda anotado en su ficha del bestiario:
//   · estudio 1 (5):   su punto débil, con los números: cuántos golpes de lanza o flechas lo bajan y qué hacer.
//   · estudio 2 (15):  por dónde suele venir: el lado (el río, el monte o el camino) por el que más lo viste entrar.
//   · estudio 3 (40):  un efecto chico: tus golpes le pegan un 5 % más fuerte.
// Los contadores son los del bestiario de siempre (`D().bestiario[tipo].abatidos`); lo nuevo es `lados`, por dónde
// entró cada uno que abatiste (también en `D().bestiario`, saneado en `sanearBestiario`).
import { TIPOS_ALIEN, ARMAS } from './desafio-reglas.js';
import { BESTIARIO } from './desafio-noche2.js';
import { NOMBRE_LADO } from './desafio-lados.js';

export const UMBRALES_ESTUDIO = [5, 15, 40];
export const MULTIPLICADOR_UMBRAL = { enjambre: 4 };   // (viene de a docenas: 20, 60 y 160)
// 4.10.2: el Mandamás cae una vez cada cinco noches (5, 10, 15 y 20: cuatro en toda la campaña): con 5/15/40 sus estudios no se alcanzaban nunca.
// Con 1, 2 y 4 se llega al primero en su primera caída y al último con el de la noche 20 (en la corrida sin fin, antes)
export const UMBRALES_PROPIOS = { jefe: [1, 2, 4] };
export const DANO_ESTUDIADO = 0.05;
export const TIPOS_ESTUDIO = ['rastreador', 'saltador', 'tirador', 'escupidor', 'bruto', 'excavador', 'volador', 'curandero', 'enjambre', 'jefe'];
const LADOS = ['rio', 'monte', 'camino'];

export function umbralesDe(tipo) {
  if (Object.hasOwn(UMBRALES_PROPIOS, tipo)) return [...UMBRALES_PROPIOS[tipo]];
  const m = Object.hasOwn(MULTIPLICADOR_UMBRAL, tipo) ? MULTIPLICADOR_UMBRAL[tipo] : 1;
  return UMBRALES_ESTUDIO.map((u) => u * m);
}
const abatidosDe = (best, tipo) => {
  const r = best && typeof best === 'object' && Object.hasOwn(best, tipo) ? best[tipo] : null;
  const n = Number(r?.abatidos);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};
// Cuántos estudios tiene hechos (0 a 3).
export function nivelEstudio(best, tipo) {
  if (!TIPOS_ESTUDIO.includes(tipo)) return 0;
  const n = abatidosDe(best, tipo);
  return umbralesDe(tipo).filter((u) => n >= u).length;
}
// ¿Subió de nivel al pasar de `antes` a `despues` abatidos? Devuelve el nivel nuevo o 0.
export function subioEstudio(tipo, antes, despues) {
  if (!TIPOS_ESTUDIO.includes(tipo)) return 0;
  const u = umbralesDe(tipo);
  for (let i = u.length - 1; i >= 0; i--) if (antes < u[i] && despues >= u[i]) return i + 1;
  return 0;
}

// ---------------------------------------------------------------- estudio 1: el punto débil, con números
const CONSEJO = {
  rastreador: 'Si lo mirás se frena: pegale mientras duda. El perro le muerde las patas.',
  saltador: 'No pasa por los muros almenados ni por los portones reforzados: ahí no entra.',
  tirador: 'Pegate a una pared o a un tronco y dejá que se acerque: de cerca apunta lento.',
  escupidor: 'De cerca no puede escupir: acercate o rodealo.',
  bruto: 'Gira lento: rodealo y pegale por detrás. Las estacas y los pozos lo frenan más que a nadie.',
  excavador: 'Apenas sale de la tierra queda aturdido un momento: ahí es cuando hay que pegarle. Con losa de piedra abajo no asoma.',
  volador: 'Arriba sólo lo alcanzan las flechas y el rayo; cuando baja a apagar una antorcha, también la lanza.',
  curandero: 'Va atrás del grupo curando a los heridos: ir a buscarlo primero. Si queda solo, se asusta y se va.',
  enjambre: 'Cualquier golpe los baja. Lo que rinde es pegar en abanico: las brasas y las trampas.',
  jefe: 'Los sacos de la espalda: pegale por detrás, del pecho para arriba, y el golpe vale doble.',
};
const golpes = (vida, dano) => Math.max(1, Math.ceil(vida / dano));
export function datoPuntoDebil(tipo) {
  const def = Object.hasOwn(TIPOS_ALIEN, tipo) ? TIPOS_ALIEN[tipo] : null;
  if (!def || !Object.hasOwn(CONSEJO, tipo)) return '';
  const v = def.vida, l = golpes(v, ARMAS.lanza.dano), a = golpes(v, ARMAS.arco.dano);
  const nums = v <= ARMAS.honda.dano ? 'Cae de un solo golpe.' : `Aguanta ${v} de vida: la lanza lo baja de ${l} ${l === 1 ? 'golpe' : 'golpes'} y el arco, de ${a} ${a === 1 ? 'flecha' : 'flechas'}.`;
  return `${nums} ${CONSEJO[tipo]}`;
}

// ---------------------------------------------------------------- estudio 2: por dónde suele venir
// Anota por qué lado entró uno que abatiste. Sólo si el tipo ya está en el bestiario. Devuelve true si lo anotó.
export function anotarLado(best, tipo, lado) {
  if (!best || !Object.hasOwn(best, tipo) || !LADOS.includes(lado)) return false;
  const r = best[tipo];
  if (!r.lados || typeof r.lados !== 'object') r.lados = {};
  r.lados[lado] = (Object.hasOwn(r.lados, lado) ? r.lados[lado] : 0) + 1;
  return true;
}
// El lado por el que más lo viste entrar: { id, nombre, n, total } o null si todavía no hay datos.
export function ladoFrecuente(best, tipo) {
  const l = best && Object.hasOwn(best, tipo) ? best[tipo]?.lados : null;
  if (!l || typeof l !== 'object') return null;
  let mejor = null, total = 0;
  for (const id of LADOS) {
    const n = Object.hasOwn(l, id) ? Math.floor(Number(l[id]) || 0) : 0;
    total += n;
    if (n > 0 && (!mejor || n > mejor.n)) mejor = { id, nombre: NOMBRE_LADO[id], n };
  }
  return mejor ? { ...mejor, total } : null;
}
export function datoLado(best, tipo) {
  const f = ladoFrecuente(best, tipo);
  if (!f) return 'Todavía no se le nota un lado preferido: cada noche entra por otro.';
  return f.n === f.total && f.total > 1
    ? `Siempre lo viste entrar por ${f.nombre} (${f.n} veces).`
    : `Lo viste entrar sobre todo por ${f.nombre} (${f.n} de ${f.total}).`;
}

// ---------------------------------------------------------------- estudio 3: pegarle más fuerte
export function danoContraTipo(best, tipo) {
  return nivelEstudio(best, tipo) >= 3 ? 1 + DANO_ESTUDIADO : 1;
}

// ---------------------------------------------------------------- la ficha
// Lo que se muestra en el bestiario: tres renglones (uno por estudio), con el dato si ya está desbloqueado o lo que falta.
export function renglonesEstudio(best, tipo) {
  if (!TIPOS_ESTUDIO.includes(tipo)) return [];
  const n = abatidosDe(best, tipo), u = umbralesDe(tipo), nivel = nivelEstudio(best, tipo);
  const titulos = ['Su punto débil', 'Por dónde suele venir', 'Ya lo conocés de memoria'];
  const datos = [
    () => datoPuntoDebil(tipo),
    () => datoLado(best, tipo),
    () => `Tus golpes le pegan un ${Math.round(DANO_ESTUDIADO * 100)} % más fuerte.`,
  ];
  return u.map((umbral, i) => ({
    nivel: i + 1, umbral, titulo: titulos[i], hecho: nivel > i,
    texto: nivel > i ? datos[i]() : null,
    falta: nivel > i ? '' : `Abatí ${umbral - n} más para estudiarlo (${Math.min(n, umbral)} de ${umbral}).`,
  }));
}
export function nombreDeTipo(tipo) { return Object.hasOwn(BESTIARIO, tipo) ? BESTIARIO[tipo].nombre : tipo; }
