// 4.26.0: la campana del andén. En cualquier andén de la trochita (Relax, Historia y, sin ataque, el Desafío), si el tren tarda más de
// `umbral` segundos, la E toca la campana del jefe de estación: la pantalla se va a negro un momento y la locomotora aparece a `metros` del poste,
// en marcha, y llega sola en unos 20 s (lo mismo que hace la escena de Elsa de la 4.24.0 con `traerAlAnden`). No cambia los horarios ni el
// recorrido: el tren sigue su vuelta desde ahí, con las mismas paradas de 45 a 70 s.
//
// Por qué la campana y no «esperar sentado con R»: sentado corre el reloj de la partida (×40, o ×8 esperando una escena), pero el tren anda con
// el tiempo de verdad; acelerar la trochita con R hubiera cambiado su marcha para todos (también el tren que manejás o el que ves pasar).
//
// Para que no se abuse:
//   · con el tren parado en otro andén (o frenando para entrar a otro) no se lo saca de ahí: se dice cuándo sale y se toca otra vez;
//   · varado (el Desafío) o plantado en la nieve esperando a la cuadrilla, no viene;
//   · con un ataque del Desafío encima, la campana no se toca;
//   · si ya llega en `umbral` segundos o menos, sólo se avisa cuánto falta (no hay fundido);
//   · no da un viaje: subir sigue siendo con la E en el coche (y eso es lo que anota el viaje);
//   · en la Historia, mientras la escena de Elsa de ese andén no se vio (la ida en la Estación del Valle, en los capítulos 1 y 2 sin un viaje hecho;
//     la vuelta en la Aldea, en el capítulo 2 con un viaje hecho), la campana es de ella: la soga está atada y la escena sale como siempre.
//
// Reglas puras (sin three ni DOM): main.js arma los datos (`tren.estadoDelLlamado(parada)`) y hace el fundido.

export const CAMPANA_ANDEN = Object.freeze({
  radio: 8,      // metros desde el centro del andén (los andenes miden 9 y 18 m)
  umbral: 45,    // segundos: con menos, el tren «ya viene» (el mismo número que usa la escena de Elsa)
  metros: 135,   // dónde aparece la locomotora, antes del poste (fuera de la vista desde el andén)
  frenando: 60,  // metros: el tren que entra a otro andén ya está frenando ahí (ver trochita.js `actualizar`)
  alcance: 3,    // 4.26.1: metros (en el piso) del jugador a la campana para que la E la ofrezca
  frente: 0.8,   // 4.26.1: y mirándola: el coseno del ángulo entre adónde mira y la campana (unos 37° a cada lado)
});

// 4.26.1: la E ofrece la campana sólo mirándola de cerca (antes, en cualquier lugar a 8 m del centro del andén). `js`: el estado del jugador
// ({ pos, yaw }: mira hacia (−sen yaw, −cos yaw), como rastreo.js `mirandoAlPerro`); `campana`: { x, z } de la campana (la del poste de la
// parada, trochita.js, o la de la estación de la Aldea, aldea-mecanicas-mundo.js). Sin campana a la vista no hay aviso.
export function mirandoLaCampana(js, campana) {
  if (!js?.pos || !campana || !Number.isFinite(campana.x) || !Number.isFinite(campana.z)) return false;
  const dx = campana.x - js.pos.x, dz = campana.z - js.pos.z, d = Math.hypot(dx, dz);
  if (d > CAMPANA_ANDEN.alcance) return false;
  if (d < 0.25) return true;   // (abajo de la campana, cualquier rumbo la tiene encima)
  const yaw = Number(js.yaw) || 0;
  return (-Math.sin(yaw) * dx - Math.cos(yaw) * dz) / d >= CAMPANA_ANDEN.frente;
}

// Las escenas de Elsa que se quedan con la campana (ver historia-disparadores.js)
export const ESCENA_ELSA_IDA = 'elsa-anden';
export const ESCENA_ELSA_VUELTA = 'elsa-anden-vuelta';
const CAPITULOS_IDA = ['llave', 'bolsa'];

// ¿La escena de Elsa de este andén está por verse? Devuelve su id o null. `d`: { historia (la Historia en curso), capitulo (id), vistas
// (`historia.escenas.vistas`), viaje (si ya se tomó la trochita), esEstacion, esAldea }.
export function campanaDeElsa(d) {
  if (!d || !d.historia) return null;
  const vista = (id) => !!d.vistas && typeof d.vistas === 'object' && Object.hasOwn(d.vistas, id);
  if (d.esEstacion && !d.viaje && CAPITULOS_IDA.includes(d.capitulo) && !vista(ESCENA_ELSA_IDA)) return ESCENA_ELSA_IDA;
  if (d.esAldea && d.viaje && d.capitulo === 'bolsa' && !vista(ESCENA_ELSA_VUELTA)) return ESCENA_ELSA_VUELTA;
  return null;
}

// Qué pasa si se toca la campana. `f`: lo que dice el tren (`estadoDelLlamado`): { espera, aca, subido, conduce, varado, nieve, enOtra, sale,
// entrando }. `o`: { ataque, elsa }. Devuelve { ok, motivo, espera, enOtra, sale, elsa, suena }:
//   motivo: 'arriba' | 'aca' (no se ofrece) · 'ataque' | 'elsa' (no suena) · 'varado' | 'nieve' | 'otra' | 'cerca' (suena, no viene) · 'viene'.
export function decidirCampana(f, o = {}) {
  if (!f) return null;
  const r = (motivo, ok = false, suena = true) => ({ ok, motivo, suena, espera: Math.max(0, Math.round(Number(f.espera) || 0)), enOtra: f.enOtra || null, sale: Math.max(0, Math.round(Number(f.sale) || 0)), entrando: !!f.entrando, elsa: o.elsa || null });
  if (f.subido || f.conduce) return r('arriba', false, false);
  if (f.aca) return r('aca', false, false);
  if (o.ataque) return r('ataque', false, false);
  if (o.elsa) return r('elsa', false, false);
  if (f.varado) return r('varado');
  if (f.nieve) return r('nieve');
  if (f.enOtra) return r('otra');
  if (!(Number(f.espera) > CAMPANA_ANDEN.umbral)) return r('cerca');
  return r('viene', true);
}

// Si la E ofrece la campana (el aviso): todo menos ir arriba o con el tren en el andén.
export const ofreceCampana = (d) => !!d && d.motivo !== 'arriba' && d.motivo !== 'aca';

// Lo que se dice al tocarla: { titulo, sub }
export function textoCampana(d, nombre = 'el andén') {
  if (!d) return null;
  switch (d.motivo) {
    case 'viene': return { titulo: 'Tocaste la campana del andén', sub: `La trochita viene a ${nombre}: llega en un rato` };
    case 'cerca': return { titulo: 'La trochita ya viene', sub: `Llega a ${nombre} en unos ${Math.max(5, d.espera)} segundos` };
    case 'otra': return d.entrando
      ? { titulo: `La trochita está entrando a ${d.enOtra}`, sub: 'Cuando vuelva a arrancar, tocá otra vez la campana' }
      : { titulo: `La trochita está parada en ${d.enOtra}`, sub: `Sale en unos ${Math.max(5, d.sale)} segundos: tocá otra vez cuando arranque` };
    case 'nieve': return { titulo: 'La vía está tapada de nieve', sub: 'La trochita espera a la cuadrilla de las palas' };
    case 'varado': return { titulo: 'La trochita está varada', sub: 'No viene hasta que la suelten' };
    case 'ataque': return { titulo: 'No es momento de tocar la campana', sub: 'Primero, el ataque' };
    case 'elsa': return d.elsa === ESCENA_ELSA_VUELTA
      ? { titulo: 'La soga de la campana está atada a un clavo', sub: '«La toca la guarda.» Elsa anda por la Aldea de 6 a 21: hacé los mandados y volvé al andén' }
      : { titulo: 'La soga de la campana está atada a un clavo', sub: '«La toca la guarda.» Elsa anda por el andén de 6 a 21' };
    default: return null;
  }
}
