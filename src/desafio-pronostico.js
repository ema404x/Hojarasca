// 4.9 dias: preparar la noche con el pronóstico (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// De día se puede saber qué noche viene y por qué lado entran los duendes. Nada de esto es azar nuevo:
//   · la noche (común o especial) es la misma cuenta que ya usa la estación meteorológica y el aviso del
//     atardecer: `nochesQueVienen` (meteo.js) → `nocheEspecial(n, azarEspecial(...), anterior)`;
//   · el lado (río, monte o camino) es `ladoDeLaNoche(semilla, n, plan.disponibles)` (desafio-lados.js), la misma
//     función pura que decide `ataques.decidir` al caer la tarde, y el punto de entrada es `puntoDeLaNoche`.
// Nada de esto se anota en la partida ni gasta un número del azar de ninguna noche: anticiparlo no cambia nada.
//
// Cuánto se sabe depende de lo que tenés:
//   · sin nada: la noche de un mandamás o la final se sabe siempre (es por número); lo demás, a la hora del
//     aviso del atardecer (una hora antes de que salgan);
//   · la radio del refugio: qué noche trae esta noche, desde la mañana;
//   · el perro (siempre está con vos): a la tarde, desde las 15, olfatea por qué lado van a entrar;
//   · la estación meteorológica: esta noche y la de mañana, la noche y el lado, desde la mañana.
import { nochesQueVienen } from './meteo.js';
import { ladoDeLaNoche, puntoDeLaNoche, NOMBRE_LADO, LADO_DE, LADOS } from './desafio-lados.js';
import { ESPECIALES, HORA_ATAQUE } from './desafio-reglas.js';

export const HORA_PERRO = 15;                // desde esta hora el perro sabe por dónde vienen
export const HORA_AVISO = HORA_ATAQUE - 1;   // el aviso del atardecer: ahí todos lo saben

// Qué se sabe con lo que hay. `tiene`: { estacion, radio, perro }. `horas`: la hora del reloj del juego.
export function queSeSabe(tiene, horas) {
  const t = tiene || {};
  const aviso = horas >= HORA_AVISO && horas < HORA_ATAQUE;   // (desde las 19:30 la noche de hoy ya está decidida)
  const s = { tipoHoy: !!(t.estacion || t.radio || aviso), tipoManana: !!t.estacion, ladoHoy: !!(t.estacion || aviso || (t.perro && horas >= HORA_PERRO && horas < HORA_ATAQUE)), ladoManana: !!t.estacion };
  s.nada = !s.tipoHoy && !s.ladoHoy;
  return s;
}

// Un consejo corto por tipo de noche y por lado (cuaderno de campo; sin promesas de mecánica).
export const CONSEJO_NOCHE = {
  comun: 'Una noche como las otras: la tranquilidad es lo que menos se aprovecha.',
  jefe: 'Sale un mandamás: guardá flechas y no dejes ningún tramo flojo.',
  final: 'Despierta el Coihue Viejo: todo lo que tengas, esta noche.',
  roja: 'Vienen más duendes de lo normal: cerrá bien y juntá flechas.',
  eclipse: 'Vienen apurados, con la luna apagada: llevá luz a donde pelees.',
  silenciosa: 'Son pocos, pero tiradores: mantenete cubierto detrás de la empalizada.',
  apagon: 'Las antorchas se apagan de a una: llevá con qué prenderlas.',
  niebla: 'Se ve a pocos metros: se los oye antes de verlos. Quedate cerca de las defensas.',
  lunallena: 'La luna alumbra el valle y salen sobre todo los viejos oscuros: cuidá el portón.',
};
export const CONSEJO_LADO = {
  rio: 'Por la orilla del río: una trampa donde la costa se angosta los frena.',
  monte: 'Por entre los árboles: poné la trampa en el claro por donde van a salir.',
  camino: 'Por el camino, derecho: ahí una trampa los agarra de frente.',
};

const nombreDeLaNoche = (n) => {
  if (n.tipo === 'final') return 'El Coihue Viejo despierta';
  if (n.tipo === 'jefe') return 'Sale un mandamás';
  if (n.tipo === 'calma') return 'Noche tranquila';
  if (n.tipo === 'comun') return 'Noche común';
  return ESPECIALES[n.tipo]?.nombre || 'Noche común';
};
const llevaTipoPorNumero = (tipo) => tipo === 'final' || tipo === 'jefe' || tipo === 'calma';

// El lado de la noche `n`: { id, nombre, de, x, z, distancia, exacto }. Si ya se decidió (al caer la tarde) y es
// de esa noche, es el de siempre; si no, sale de la misma función pura con el plan de la base. `base`: { x, z }.
export function ladoAnticipado(d, plan, base, n) {
  const real = d?.ladoNoche;
  if (real && real.noche === n && real.id && !real.anulado) {
    return { id: real.id, nombre: NOMBRE_LADO[real.id], de: LADO_DE[real.id], x: real.x, z: real.z, distancia: Math.round(Math.hypot(real.x - base.x, real.z - base.z)), exacto: true };
  }
  if (!plan?.lados || !plan.disponibles?.length) return null;
  const id = ladoDeLaNoche(d?.semilla, n, plan.disponibles.length ? plan.disponibles : LADOS);
  const p = id && puntoDeLaNoche(plan, id, d?.semilla, n);
  if (!p) return null;
  return { id, nombre: NOMBRE_LADO[id], de: LADO_DE[id], x: p.x, z: p.z, distancia: Math.round(Math.hypot(p.x - base.x, p.z - base.z)), exacto: false };
}

// El pronóstico entero para el tablón y el cuaderno.
//   `c`: { d (estado del Desafío), meteo, dia, horas, base:{x,z}, plan (una función que da el plan de lados de la base, o null), tiene:{estacion,radio,perro}, hayBlanco }
// Devuelve { saber, noches: [{ n, cuando, tipo, nombre, consejo, sabeTipo, lado, sabeLado, aviso }], marca }.
//   · `sabeTipo`/`sabeLado`: si con lo que tenés ya se sabe;
//   · `lado`: sólo si se sabe (si no, null);
//   · `aviso`: la línea para leer.
export function armarPronostico(c) {
  const { d, meteo, dia, horas, base } = c;
  const saber = queSeSabe(c.tiene, horas);
  const lista = nochesQueVienen(d, meteo, dia, horas, 2);
  const noches = lista.map((n, i) => {
    const hoy = i === 0 && n.cuando !== 'Mañana a la noche' && n.cuando !== 'Pasado mañana a la noche';
    const porNumero = llevaTipoPorNumero(n.tipo);
    const sabeTipo = porNumero || (hoy ? saber.tipoHoy : saber.tipoManana);
    const sabeLado = n.tipo !== 'calma' && (hoy ? saber.ladoHoy : saber.ladoManana);
    const lado = sabeLado ? ladoAnticipado(d, c.plan?.() ?? null, base, n.n) : null;
    const nombre = sabeTipo ? nombreDeLaNoche(n) : null;
    const partes = [];
    if (sabeTipo) partes.push(nombre);
    else partes.push('Todavía no se sabe cómo viene. Se sabrá una hora antes de que salgan (con una radio o la estación meteorológica, desde la mañana)');
    if (n.tipo !== 'calma') {
      if (lado && !c.hayBlanco) partes.push(`Van a entrar ${lado.de}, a unos ${lado.distancia} m de la base`);
      else if (lado && c.hayBlanco) partes.push(`Si no cambian de rumbo, entrarían ${lado.de}; esta noche hay algo que los llama a otra parte`);
      else if (sabeLado) partes.push('Por dónde entran, no se puede saber todavía: hacia el atardecer');
      else partes.push(hoy ? `Por dónde entran, se sabe ${c.tiene?.perro ? 'desde las 15 (el perro lo huele)' : 'hacia el atardecer'}` : 'Por dónde entran, con la estación meteorológica');
    }
    return { n: n.n, clave: n.clave, cuando: n.cuando, tipo: sabeTipo ? n.tipo : null, nombre, consejo: sabeTipo ? CONSEJO_NOCHE[n.tipo] || CONSEJO_NOCHE.comun : null,
      consejoLado: lado ? CONSEJO_LADO[lado.id] : null, sabeTipo, sabeLado: !!lado, lado, avisos: partes };
  });
  // la marca para el mapa de papel: el punto de entrada de la primera noche, si se sabe
  const primera = noches.find((n) => n.lado && n.n === (lista[0]?.n));
  const marca = primera && primera.lado ? { x: primera.lado.x, z: primera.lado.z, nombre: `Por acá entrarían los duendes (${primera.lado.nombre})`, exacto: primera.lado.exacto } : null;
  return { saber, noches, marca };
}
