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

// 3.8.4: el caballo no cruza los puentes colgantes (el tablero se mueve y las sogas no aguantan un caballo): montado,
// se planta en el estribo (`noPisa`, con la plataforma que tiene abajo; ver jugador.js). Ahí E pregunta: amarrarlo en el
// estribo (te bajás y queda atado, como al bajarte en cualquier lado) o mandarlo solo al refugio (vuelve al palenque:
// `mandarAlRefugio`). Lo que elijas queda en la partida (`progreso.caballo`).
export const noPisa = (plataforma) => plataforma?.duenio?.tendido === 'puente';
export function mandarAlRefugio(c) {
  if (!c || typeof c !== 'object') return c;
  c.x = null; c.z = null; c.yaw = 0;   // (sin lugar: espera en el palenque, ver `dondeEspera`)
  return c;
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


// ---------------------------------------------------------------- 4.30.1: dónde cabe y cómo pisa
// Lo que ocupa un caballo parado, en planta: cuatro discos a lo largo del lomo ([adelante, radio], en metros, +adelante): el anca, la
// cinchera, el pecho y la cabeza. Antes se lo dejaba donde te bajabas (el centro del jugador, que montado choca con un disco de 0,6 m) y la
// grupa o la cabeza quedaban adentro de un tronco, de una pared o del retablo de la plaza.
export const CUERPO_CABALLO = Object.freeze([[-0.72, 0.42], [0, 0.45], [0.66, 0.4], [1.3, 0.3]]);
export const ALTO_CUERPO_CABALLO = 1.8;     // del suelo (más lo que no cuenta: un cordón, un escalón) a la cruz y la cabeza
const PIE_CUERPO = 0.25;
export const LEJOS_ACOMODAR = 4;            // lo más lejos que se lo corre a buscar lugar
// ¿cabe un caballo parado en (x, z) mirando a `yaw`? `empujar(p, radio, alto)` es la colisión de siempre (saca a {x, y, z} de lo que choca),
// `alturaEn(x, z, yRef)` el piso, `paredEntre(ax, az, bx, bz, y0, y1)` si una pared fina corta el cuerpo entre dos discos.
export function caballoLibre(x, z, yaw, { empujar, alturaEn = null, paredEntre = null } = {}) {
  if (typeof empujar !== 'function' || !Number.isFinite(x) || !Number.isFinite(z)) return true;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const y0 = alturaEn ? alturaEn(x, z) : 0;
  let ax = null, az = null;
  for (const [d, r] of CUERPO_CABALLO) {
    const cx = x + fx * d, cz = z + fz * d;
    const yc = alturaEn ? alturaEn(cx, cz, y0) : y0;
    const q = { x: cx, y: (Number.isFinite(yc) ? yc : y0) + PIE_CUERPO, z: cz };
    try { empujar(q, r, ALTO_CUERPO_CABALLO); } catch { return true; }   // (la colisión nunca traba el juego)
    if (!(Math.hypot(q.x - cx, q.z - cz) < 0.01)) return false;
    if (paredEntre && ax !== null && paredEntre(ax, az, cx, cz, y0 + 0.3, y0 + ALTO_CUERPO_CABALLO)) return false;
    ax = cx; az = cz;
  }
  // ni al borde de un escalón, un cordón alto o una barranca: entre el casco más alto y el más bajo, a lo sumo DESNIVEL_CASCOS (una loma de 22°)
  if (alturaEn) {
    const A = PATAS_APOYO.adelante, L = PATAS_APOYO.lado, lx = Math.cos(yaw), lz = -Math.sin(yaw);
    let min = Infinity, max = -Infinity;
    for (const [da, dl] of [[A, -L], [A, L], [-A, -L], [-A, L]]) {
      const h = alturaEn(x + fx * da + lx * dl, z + fz * da + lz * dl, y0);
      if (Number.isFinite(h)) { min = Math.min(min, h); max = Math.max(max, h); }
    }
    if (max - min > DESNIVEL_CASCOS) return false;
  }
  return true;
}
export const DESNIVEL_CASCOS = 0.5;
// El lugar libre más cercano a `d` ({x, z, yaw}): primero donde está; si no cabe, en anillos de 25 cm, mirando para el mismo lado hasta
// GIRAR_DESDE metros; si así no entra, también dado vuelta o de costado, hasta LEJOS_ACOMODAR. Nunca al otro lado de una pared. Si no hay
// lugar, queda donde estaba.
export const GIRAR_DESDE = 1.5;
export function lugarLibreCaballo(d, op = {}) {
  const yaw = Number.isFinite(d?.yaw) ? d.yaw : 0;
  const base = { x: d?.x, z: d?.z, yaw, movido: false };
  if (typeof op.empujar !== 'function' || !Number.isFinite(d?.x) || !Number.isFinite(d?.z)) return base;
  if (caballoLibre(d.x, d.z, yaw, op)) return base;
  const y0 = op.alturaEn ? op.alturaEn(d.x, d.z) : 0;
  const tandas = [[[0], GIRAR_DESDE], [[0, Math.PI, Math.PI / 2, -Math.PI / 2], LEJOS_ACOMODAR]];
  for (const [giros, hasta] of tandas) for (let r = 0.25; r <= hasta + 1e-6; r += 0.25) {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / 0.45));
    for (const g of giros) for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = d.x + Math.sin(a) * r, z = d.z + Math.cos(a) * r;
      if (op.paredEntre && op.paredEntre(d.x, d.z, x, z, y0 + 0.3, y0 + ALTO_CUERPO_CABALLO)) continue;
      if (caballoLibre(x, z, yaw + g, op)) return { x, z, yaw: yaw + g, movido: true };
    }
  }
  return base;
}
// Cómo apoya parado o andando: los cuatro cascos (manos a 0,62 m adelante, patas a 0,62 m atrás, a 0,2 m del medio) sobre el suelo que
// tienen abajo. Devuelve la altura del centro (el promedio: el plano que mejor pasa por los cuatro) y cuánto se inclina el cuerpo: `pitch`
// (rotation.x, + baja la cabeza) y `roll` (rotation.z, + sube el costado de +x), para un grupo con rotation.order = 'YXZ'. Antes se tomaba
// la normal del terreno en el centro con un tope de 0,22 rad y el grupo giraba en el orden XYZ (el cabeceo iba sobre el eje x del mundo, no
// del caballo): de costado a la pendiente quedaba torcido y con dos cascos en el aire.
export const PATAS_APOYO = Object.freeze({ adelante: 0.62, lado: 0.2 });
export function apoyoCaballo(alturaEn, x, z, yaw, yRef) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
  const A = PATAS_APOYO.adelante, L = PATAS_APOYO.lado;
  const h = (da, dl) => alturaEn(x + fx * da + lx * dl, z + fz * da + lz * dl, yRef);
  const ai = h(A, -L), ad = h(A, L), ti = h(-A, -L), td = h(-A, L);
  if (![ai, ad, ti, td].every(Number.isFinite)) { const y = alturaEn(x, z, yRef); return { y, pitch: 0, roll: 0 }; }
  const lim = (v, m) => Math.max(-m, Math.min(m, v));
  return {
    y: (ai + ad + ti + td) / 4,
    pitch: lim(Math.atan2((ti + td) / 2 - (ai + ad) / 2, 2 * A), 0.55),
    roll: lim(Math.atan2((ad + td) / 2 - (ai + ti) / 2, 2 * L), 0.45),
  };
}
