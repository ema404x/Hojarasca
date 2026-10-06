// 2.9: manejar la trochita. La física de la cabina, sin nada de three ni del DOM.
//
// El regulador se abre de a poco con W (o el stick para adelante) y queda donde lo
// dejás; con S se cierra y, ya cerrado, se aprietan los frenos. La caldera junta presión
// con el regulador cerrado y la gasta abierto: si la exigís mucho rato, tira menos. El
// tren tiene su inercia: arranca despacio, sigue rodando sin vapor y en bajada se
// embala. No descarrila ni va para atrás: la vía es un anillo y siempre hay otra parada.
//
// Puro (se prueba en Node). Lo usa `trochita.js`.

export const CABINA = {
  vmax: 12,             // m/s (unos 43 km/h, más de lo que corría la de verdad)
  traccion: 0.9,        // m/s² con el regulador abierto y la caldera llena
  freno: 2.2,           // m/s² con los frenos apretados del todo
  rozamiento: 0.06,     // m/s² de las ruedas y los ejes
  arrastre: 0.01,       // por m/s: el aire y la vía
  gravedad: 9.8 * 0.6,  // la pendiente, suavizada: es una trochita, no un funicular
  abre: 0.5,            // cuánto se abre el regulador por segundo con W
  cierra: 1.1,          // cuánto se cierra por segundo con S
  aprieta: 2.5,         // cuánto se aprietan los frenos por segundo con S
  suelta: 3,            // cuánto se sueltan por segundo
  ventana: 12,          // metros antes o después del poste de la parada en que cuenta la parada
};

export function cabinaNueva() { return { regulador: 0, freno: 0, presion: 0.8, vel: 0 }; }

const acotar = (v, a, b) => Math.max(a, Math.min(b, v));
const numero = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// Un paso: `acelera` y `frena` son lo que sostiene el jugador; `pendiente`, la subida de
// la vía (metros que sube por metro que avanza; en bajada es negativa).
// 3.7.3 (tren): lo del taller y la vía (todo opcional; sin nada, la cabina de siempre):
//   `manejo` { traccion, vmax, freno }: multiplicadores de la caldera y el freno (ver tren-viaje.js `manejoDe`);
//   `agarre` (0..1): con la vía mojada o helada y sin arenero, las ruedas patinan si se abre mucho el regulador
//   (tiran menos y `c.patina` queda en true) y el freno resbala un poco;
//   `nieve`: m/s² de más que frena la nieve de la vía; `tope`: la velocidad máxima ahí (con el quitanieves).
export function pasoCabina(c, dt, { acelera = false, frena = false, pendiente = 0, manejo = null, agarre = 1, nieve = 0, tope = Infinity } = {}) {
  dt = acotar(numero(dt), 0, 0.1);
  const mt = manejo ? acotar(numero(manejo.traccion, 1), 0.5, 3) : 1, mv = manejo ? acotar(numero(manejo.vmax, 1), 0.5, 3) : 1, mf = manejo ? acotar(numero(manejo.freno, 1), 0.5, 3) : 1;
  const vmax = CABINA.vmax * mv;
  const ag = acotar(numero(agarre, 1), 0.2, 1);
  c.regulador = acotar(numero(c.regulador), 0, 1);
  c.freno = acotar(numero(c.freno), 0, 1);
  c.presion = acotar(numero(c.presion, 0.8), 0, 1);
  c.vel = acotar(numero(c.vel), 0, vmax);
  if (acelera && !frena) c.regulador = Math.min(1, c.regulador + CABINA.abre * dt);
  if (frena) c.regulador = Math.max(0, c.regulador - CABINA.cierra * dt);
  if (frena && c.regulador === 0) c.freno = Math.min(1, c.freno + CABINA.aprieta * dt);
  else c.freno = Math.max(0, c.freno - CABINA.suelta * dt);
  // la caldera: con el regulador cerrado junta presión; abierto del todo la va gastando
  const objetivo = 1 - 0.45 * c.regulador;
  c.presion += (objetivo - c.presion) * (1 - Math.exp(-dt * 0.22));
  let empuje = CABINA.traccion * mt * c.regulador * (0.35 + 0.65 * c.presion) * Math.max(0, 1 - c.vel / vmax);
  // sin arenero en la vía resbalosa: pasado lo que agarran los rieles, las ruedas giran en falso
  const agarran = ag < 1 ? CABINA.traccion * mt * (0.15 + 0.6 * ag) : Infinity;
  c.patina = empuje > agarran;
  if (c.patina) empuje = agarran * 0.8;
  const rodando = c.vel > 0.01 ? 1 : 0;
  const pend = acotar(numero(pendiente), -0.2, 0.2);
  const resiste = CABINA.rozamiento * rodando + CABINA.arrastre * c.vel + CABINA.gravedad * pend + Math.max(0, numero(nieve)) * rodando;
  const frenado = CABINA.freno * mf * c.freno * rodando * (ag < 1 ? 0.55 + 0.45 * ag : 1);
  c.vel = acotar(c.vel + (empuje - resiste - frenado) * dt, 0, vmax);
  // en la nieve (con el quitanieves) no pasa del tope: lo que sobra lo frena la cuña, de a poco
  const top = Math.max(0, numero(tope, Infinity));
  if (c.vel > top) c.vel = Math.max(top, c.vel - 3 * dt);
  // parado y sin vapor, se queda quieto aunque la vía baje un poco
  if (c.vel < 0.08 && c.regulador < 0.02) c.vel = 0;
  return c;
}

export const kmh = (vel) => Math.round(Math.max(0, numero(vel)) * 3.6);
// Si `falta` (lo que falta hasta el poste de la parada; negativo si ya se pasó) cae
// adentro del andén.
export const enElAnden = (falta) => Math.abs(numero(falta, Infinity)) <= CABINA.ventana;
