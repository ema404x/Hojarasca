// El caballo: el zaino de Don Ramón. El valle es grande —el anillo del tren tiene más de
// dos kilómetros— y antes del tren todo se movía a caballo: lo cuentan Ercilia y el
// cuaderno. Ramón te lo presta cuando ya caminaste el valle y le traés lana para el
// pelero, la manta que va entre el lomo y la montura.
//
// Arriba del caballo se va al trote (W) o al galope (con Shift), se ve más lejos y no se
// agacha ni se salta. No entra al agua honda. E para bajarte: queda donde lo dejes.
//
// Sólo en el Relax: pelear a caballo es otro juego.
//
// Reglas puras (se prueban en Node); el zaino se dibuja y se mueve en caballo-mundo.js.


export const MARCHA_CABALLO = { trote: 6.2, galope: 11 };   // metros por segundo
export const ALTURA_MONTADO = 0.95;                          // lo que suben los ojos
export const RADIO_MONTAR = 2.6;
export const AGUA_QUE_NO_PISA = 0.9;                         // más honda que esto, no entra

// Dónde espera el zaino: atado al palenque, junto al refugio, o donde lo dejaste.
export function caballoNuevo() {
  return { x: null, z: null, yaw: 0 };
}
export function sanearCaballo(v, limite = Infinity) {
  const base = caballoNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  // 3.5.1: `null` (nunca lo moviste) no es el 0: Number(null) daba 0 y, al cargar cualquier
  // partida, el zaino aparecía en el centro del mapa en vez de en el palenque
  const num = (n) => (n === null || n === undefined || n === '' ? NaN : Number(n));
  const x = num(v.x), z = num(v.z), yaw = Number(v.yaw);
  // (las partidas que ya pasaron por eso traen justo 0,0: vuelven al palenque)
  if (Number.isFinite(x) && Number.isFinite(z) && !(x === 0 && z === 0) && Math.abs(x) <= limite && Math.abs(z) <= limite) { base.x = x; base.z = z; }
  if (Number.isFinite(yaw)) base.yaw = yaw;
  return base;
}
// El palenque: al costado de la puerta del refugio, un poco hacia afuera. `mira` es
// hacia dónde mira el que sale por esa puerta (el jugador mira hacia -z con yaw 0).
export function palenque(refugio) {
  const p = refugio?.puerta || refugio;
  if (!p) return { x: 0, z: 0, yaw: 0 };
  const yaw = Number(refugio.mira) || 0;
  const ax = -Math.sin(yaw), az = -Math.cos(yaw);   // hacia afuera
  const dx = Math.cos(yaw), dz = -Math.sin(yaw);    // a la derecha
  return { x: p.x + dx * 4 + ax * 2.5, z: p.z + dz * 4 + az * 2.5, yaw: yawCaballo(yaw + Math.PI / 2) };
}
export function dondeEspera(caballo, refugio) {
  if (Number.isFinite(caballo?.x) && Number.isFinite(caballo?.z)) return { x: caballo.x, z: caballo.z, yaw: caballo.yaw || 0 };
  return palenque(refugio);
}

// El caballo mira hacia +z; el jugador, hacia -z. Montado, el caballo va para donde miras.
export const yawCaballo = (yawJugador) => yawJugador + Math.PI;

// Qué marcha va: para el sonido y la animación.
export function marcha(vel) {
  const v = Math.max(0, Number(vel) || 0);
  if (v < 0.3) return { modo: 'quieto', cadencia: 0, amplitud: 0 };
  if (v < 3.5) return { modo: 'paso', cadencia: 4.2 + v * 1.4, amplitud: 0.35 };
  if (v < 8) return { modo: 'trote', cadencia: 7 + v * 0.8, amplitud: 0.5 };
  return { modo: 'galope', cadencia: 9.5 + v * 0.35, amplitud: 0.7 };
}

