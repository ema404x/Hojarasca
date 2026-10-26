// Nueva partida+: cómo se arma la partida de la vuelta siguiente (módulo puro: se prueba en Node).
//
// 4.11.0: separado de desafio-vuelta.js (que lo importa desafio-reglas.js para el multiplicador de cada vuelta) porque ahora necesita
// las reglas del guardián, el bestiario y las partidas, y de otro modo harían un ciclo de módulos.
import { SE_LLEVA, VUELTA_MAXIMA } from './desafio-vuelta.js';
import { sanearHabilidades, aplicarHabilidadesABonos } from './desafio-habilidades.js';
import { bonosNuevos, saludMaximaConBonos } from './desafio-bonos.js';
import { sanearBestiario } from './desafio-noche2.js';
import { creceNuevo } from './desafio-crece.js';
import { sanearTrofeos } from './desafio-trofeos.js';
import { metaDePartida, sanearMetaPartida } from './desafio-meta.js';
import { SALUD_MAX } from './desafio-reglas.js';

// Arma la partida de la vuelta siguiente sobre una partida nueva (`base`, la que da
// progresoNuevo en modo Desafío). No toca `viejo`.
//
// 4.11.0: la vuelta se lleva TODO lo que es del guardián y de cómo elegiste jugar (decisión del usuario, E2):
//   · las habilidades (niveles y puntos sin gastar; la «última noche que dio punto» vuelve a cero, si no la vuelta 2 no daría
//     un solo punto hasta pasar la noche en que terminó la anterior);
//   · el bestiario entero (vistos, abatidos y por qué lado entraron: los estudios y el +5 % de daño siguen);
//   · los trofeos ganados (el tablero es una obra de la base: se arma de nuevo y entonces vuelven sus bonos; lo que ya se había
//     «mirado» se limpia para que un trofeo que se hubiera perdido se pueda volver a ganar);
//   · el modo, las ventajas y las reglas elegidas al empezar (sin cobrar semillas otra vez; el arranque de las ventajas se vuelve
//     a dar porque la partida es nueva: `aplicado` vuelve a falso, y la semilla del Coihue de esta vuelta es suya: número nuevo).
// Los bonos se rehacen desde cero con el origen que corresponde a cada cosa: 'habilidad' desde los niveles (acá), 'ventaja' al
// aplicar el arranque, 'trofeo' cuando hay tablero en pie y 'defensa' desde las obras. Lo de la partida (noche, base, defensas,
// recursos, aldea del día, pedidos, perro curtido, órdenes) arranca de cero como siempre.
export function nuevaVuelta(viejo, base) {
  const d0 = viejo?.desafio || {};
  const p = { ...base, cosas: { ...(base.cosas || {}) }, desafio: { ...(base.desafio || {}) } };
  for (const k of SE_LLEVA) if (viejo?.cosas?.[k]) p.cosas[k] = viejo.cosas[k];
  p.desafio.planos = [...(d0.planos || [])];
  p.desafio.pistolaEncontrada = !!d0.pistolaEncontrada;
  p.desafio.vuelta = Math.min(VUELTA_MAXIMA, (Number(d0.vuelta) || 0) + 1);
  // las habilidades, con sus puntos; la noche del último punto vuelve a cero (los puntos se ganan por noche de esta vuelta)
  p.desafio.habilidades = { ...sanearHabilidades(d0.habilidades), noche: 0 };
  p.desafio.bonos = bonosNuevos();
  aplicarHabilidadesABonos(p.desafio);
  // el bestiario
  p.desafio.bestiario = sanearBestiario(d0.bestiario);
  // los trofeos ganados (no el perro curtido: es de la partida)
  p.desafio.crece = { ...creceNuevo(), trofeos: sanearTrofeos(d0.crece?.trofeos) };
  // lo elegido al empezar: la partida nueva tiene su propio número y su propio arranque; una campaña vieja sin `meta` sigue siendo normal
  const m = sanearMetaPartida(d0.meta);
  p.desafio.meta = metaDePartida({ modo: m && m.modo !== 'sinfin' ? m.modo : 'normal', ventajas: m?.ventajas, reglas: m?.reglas });
  // con las habilidades de salud puestas, se arranca entera
  p.desafio.salud = saludMaximaConBonos(SALUD_MAX, p.desafio);
  // el tutorial ya lo hiciste
  p.desafio.tutorial = Math.max(Number(base.desafio?.tutorial) || 0, 99);
  // 2.3: la otra vuelta sigue con el mismo código de partida, si tenía
  if (d0.semilla) p.desafio.semilla = d0.semilla;
  return p;
}
