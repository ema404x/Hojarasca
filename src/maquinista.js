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
export function pasoCabina(c, dt, { acelera = false, frena = false, pendiente = 0 } = {}) {
  dt = acotar(numero(dt), 0, 0.1);
  c.regulador = acotar(numero(c.regulador), 0, 1);
  c.freno = acotar(numero(c.freno), 0, 1);
  c.presion = acotar(numero(c.presion, 0.8), 0, 1);
  c.vel = acotar(numero(c.vel), 0, CABINA.vmax);
  if (acelera && !frena) c.regulador = Math.min(1, c.regulador + CABINA.abre * dt);
  if (frena) c.regulador = Math.max(0, c.regulador - CABINA.cierra * dt);
  if (frena && c.regulador === 0) c.freno = Math.min(1, c.freno + CABINA.aprieta * dt);
  else c.freno = Math.max(0, c.freno - CABINA.suelta * dt);
  // la caldera: con el regulador cerrado junta presión; abierto del todo la va gastando
  const objetivo = 1 - 0.45 * c.regulador;
  c.presion += (objetivo - c.presion) * (1 - Math.exp(-dt * 0.22));
  const empuje = CABINA.traccion * c.regulador * (0.35 + 0.65 * c.presion) * Math.max(0, 1 - c.vel / CABINA.vmax);
  const rodando = c.vel > 0.01 ? 1 : 0;
  const pend = acotar(numero(pendiente), -0.2, 0.2);
  const resiste = CABINA.rozamiento * rodando + CABINA.arrastre * c.vel + CABINA.gravedad * pend;
  const frenado = CABINA.freno * c.freno * rodando;
  c.vel = acotar(c.vel + (empuje - resiste - frenado) * dt, 0, CABINA.vmax);
  // parado y sin vapor, se queda quieto aunque la vía baje un poco
  if (c.vel < 0.08 && c.regulador < 0.02) c.vel = 0;
  return c;
}

export const kmh = (vel) => Math.round(Math.max(0, numero(vel)) * 3.6);
// Si `falta` (lo que falta hasta el poste de la parada; negativo si ya se pasó) cae
// adentro del andén.
export const enElAnden = (falta) => Math.abs(numero(falta, Infinity)) <= CABINA.ventana;
