// 2.9: las reglas del velero, sin three ni DOM (se prueban en Node). El dibujo y el
// manejo en el mundo están en `vela.js`.
//
// Convenciones (las mismas del kayak): el rumbo `r` apunta hacia (sen r, cos r) en x/z.
// El viento se da por el rumbo HACIA DONDE sopla. En el valle manda el oeste: sopla hacia
// +x (hacia donde se van el humo de las chimeneas, la nieve y las hojas; ver clima.js),
// con un giro lento de unos veinte grados para cada lado.

export const VELA = {
  velMax: 6.0,          // m/s con viento fuerte, de través y la vela bien puesta
  proaMuerta: 0.62,     // rad (~35°): más cerca del viento que esto, la vela flamea y no empuja
  giroMax: 0.55,        // rad/s con el timón a fondo y el barco andando
  escotaPorSeg: 0.45,   // cuánto se caza o se suelta por segundo
  remo: 0.8,            // m/s con el remo corto (Espacio), para la calma y para atracar
  calma: 0.06,          // viento de clima.js por debajo del cual la vela no hace nada
  ladoCasco: 0.75,      // media manga
  largo: 4.4,           // eslora
};

const TAU = Math.PI * 2;
const acotar = (v, a, b) => (v < a ? a : v > b ? b : v);
// ángulo en (-π, π]
export function envolver(a) {
  a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return a === -Math.PI ? Math.PI : a;
}

// Hacia dónde sopla (rumbo). `dirClima`, si clima.js algún día trae una dirección propia,
// manda; si no, el oeste con su vaivén lento (tiempo en segundos del juego).
export function rumboViento(tiempo = 0, dirClima = null) {
  if (Number.isFinite(dirClima)) return envolver(dirClima);
  const t = Number.isFinite(tiempo) ? tiempo : 0;
  return envolver(Math.PI / 2 + Math.sin(t * 0.0021) * 0.28 + Math.sin(t * 0.00057 + 1.3) * 0.12);
}

// Qué tan cerca del viento se navega: 0 = proa al viento, π = viento de popa.
export function anguloAlViento(rumbo, vientoHacia) {
  return Math.abs(envolver(rumbo - (vientoHacia + Math.PI)));
}

// Por qué banda entra el viento: +1 estribor (derecha), -1 babor. La botavara se va al
// otro lado (sotavento). `previa` evita que cambie de lado a cada rato con viento de popa.
export function amuraDe(rumbo, vientoHacia, previa = 1) {
  // derecha del barco: (-cos r, sen r); el viento viene de -w
  const fx = -Math.sin(vientoHacia), fz = -Math.cos(vientoHacia);
  const lado = fx * -Math.cos(rumbo) + fz * Math.sin(rumbo);
  if (Math.abs(lado) < 0.06) return previa >= 0 ? 1 : -1;
  return lado > 0 ? 1 : -1;
}

// Cuánto hay que abrir la vela según el ángulo: cazada (0) ciñendo, suelta (1) en popa.
export function escotaIdeal(alfa) {
  return acotar((alfa - VELA.proaMuerta) / (Math.PI - VELA.proaMuerta - 0.25), 0, 1);
}

// La polar: cuánto empuja la vela bien puesta según el ángulo al viento.
export function polar(alfa) {
  if (alfa < VELA.proaMuerta) return 0;
  if (alfa < 1.6) { const t = (alfa - VELA.proaMuerta) / (1.6 - VELA.proaMuerta); return 0.35 + 0.65 * Math.sin(t * Math.PI / 2); }
  const t = (alfa - 1.6) / (Math.PI - 1.6);
  return 1 - 0.3 * t;
}

// Qué tan bien está puesta la vela: demasiado suelta flamea y no empuja; demasiado
// cazada empuja menos (la vela se "ahoga"), pero algo empuja.
export function rendimientoEscota(escota, alfa) {
  const d = escota - escotaIdeal(alfa);
  if (d > 0) return acotar(1 - (d / 0.38) ** 2, 0, 1);
  return acotar(1 - (d / 0.6) ** 2, 0.2, 1);
}

// La vela flamea: en la proa muerta o con la escota muy suelta.
export function flamea(escota, alfa) {
  return alfa < VELA.proaMuerta || escota - escotaIdeal(alfa) > 0.22;
}

// De 0 (calma) a ~1.3 (temporal): lo que el viento de clima.js le da a la vela
export function fuerzaViento(viento) {
  return acotar(((Number(viento) || 0) - VELA.calma) / (0.9 - VELA.calma), 0, 1.3);
}

// La velocidad a la que tiende el barco con ese viento y esa vela
export function velocidadObjetivo(alfa, escota, viento) {
  return VELA.velMax * fuerzaViento(viento) * polar(alfa) * rendimientoEscota(escota, alfa);
}

// Cómo se lee la vela, para el cartel de abajo
export function estadoVela(escota, alfa, viento) {
  if (fuerzaViento(viento) < 0.05) return 'calma';
  if (alfa < VELA.proaMuerta) return 'proa al viento';
  if (flamea(escota, alfa)) return 'flamea: cazá';
  if (escota - escotaIdeal(alfa) < -0.18) return 'muy cazada: soltá';
  return 'bien puesta';
}

export function nombreRumboViento(alfa) {
  if (alfa < VELA.proaMuerta) return 'en contra';
  if (alfa < 1.2) return 'ciñendo';
  if (alfa < 2.0) return 'de través';
  if (alfa < 2.75) return 'de aleta';
  return 'de popa';
}

// Un paso del barco. `est`: { x, z, rumbo, vel, giro, escota, amura }. `entrada`:
// { timon (-1 izquierda … 1 derecha), escota (-1 cazar … 1 soltar), remo (bool) }.
// Devuelve el estado nuevo (no toca `est`), con la posición propuesta: el que llama
// decide si hay agua honda ahí (ver vela.js).
export function pasoVela(est, entrada, dt, viento, vientoHacia) {
  const e = { ...est };
  dt = acotar(Number(dt) || 0, 0, 0.1);
  e.escota = acotar((Number(e.escota) || 0) + (entrada?.escota || 0) * VELA.escotaPorSeg * dt, 0, 1);
  const alfa = anguloAlViento(e.rumbo, vientoHacia);
  e.amura = amuraDe(e.rumbo, vientoHacia, e.amura);
  let objetivo = velocidadObjetivo(alfa, e.escota, viento);
  if (entrada?.remo) objetivo = Math.max(objetivo, VELA.remo);
  const vel = Math.max(0, Number(e.vel) || 0);
  // acelera despacio, se frena un poco más rápido; en la proa muerta se para
  const k = objetivo > vel ? 0.35 : alfa < VELA.proaMuerta ? 0.8 : 0.45;
  e.vel = vel + (objetivo - vel) * (1 - Math.exp(-dt * k));
  // el timón muerde con el barco andando: parado casi no gira (por eso para virar
  // contra el viento hay que llegar con envión)
  const muerde = 0.2 + 0.8 * acotar(e.vel / 2, 0, 1);
  const giroObjetivo = -(entrada?.timon || 0) * VELA.giroMax * muerde;
  e.giro = (Number(e.giro) || 0) + (giroObjetivo - (Number(e.giro) || 0)) * (1 - Math.exp(-dt * 3));
  e.rumbo = envolver(e.rumbo + e.giro * dt);
  // la deriva: el viento empuja un poco de costado, más ciñendo
  const deriva = 0.14 * fuerzaViento(viento) * (alfa < Math.PI / 2 ? 1 : 0.4);
  e.x = e.x + Math.sin(e.rumbo) * e.vel * dt + Math.sin(vientoHacia) * deriva * dt;
  e.z = e.z + Math.cos(e.rumbo) * e.vel * dt + Math.cos(vientoHacia) * deriva * dt;
  // la escora: hacia sotavento, más de través y con la vela trabajando
  e.escora = acotar(fuerzaViento(viento) * polar(alfa) * rendimientoEscota(e.escota, alfa) * (1 - e.escota * 0.7) * 0.32, 0, 0.3);
  e.alfa = alfa;
  e.flamea = flamea(e.escota, alfa);
  return e;
}

// progreso.vela: dónde quedó el velero (null si todavía no hay varadero o no se movió)
export function sanearVela(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const x = Number(v.x), z = Number(v.z), rumbo = Number(v.rumbo);
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 5000 || Math.abs(z) > 5000) return null;
  return { x, z, rumbo: Number.isFinite(rumbo) ? envolver(rumbo) : 0 };
}
