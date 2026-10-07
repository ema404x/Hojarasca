// 3.7.5 (rincones): el fútbol que se juega en el potrero de la aldea. Reglas puras (se prueban en Node): la pelota con
// física simple (rueda, rebota, se frena con el pasto, pega en los palos y en el travesaño), el gol, el lateral y lo
// que hacen los que juegan (corren a la pelota, la patean hacia el arco de enfrente, el arquero se queda cerca de su
// arco). Lo que se ve está en rincones-mundo.js y el partido en rincones-juego.js.
//
// La cancha va en su propio marco: u a lo ancho (−ancho/2 … ancho/2), v a lo largo (−largo/2 … largo/2); el arco 0
// está en v = −largo/2 y el arco 1 en v = +largo/2. El terreno se pasa como función: `altura(u, v)` (la del mundo,
// llevada al marco de la cancha por quien llama).

export const CANCHA = {
  largo: 24, ancho: 14,
  arco: { ancho: 3.2, alto: 1.7, fondo: 0.9, palo: 0.06 },
};
export const PELOTA = {
  radio: 0.11,
  gravedad: 9.8,
  rebote: 0.42,          // lo que devuelve el piso al rebotar
  rebotePalo: 0.55,      // y un palo
  rozamiento: 1.25,      // frenado al rodar (1/s): el pasto del potrero
  aire: 0.06,            // frenado en el aire
  pendiente: 3.2,        // lo que tira la pendiente del terreno (m/s² por unidad de pendiente)
  quieta: 0.08,          // por debajo de esto, se para
};
export const PATADA = { suave: 6.5, fuerte: 11, alto: 0.32, alcance: 0.95, toque: 0.6 };
export const CORRER = { chico: 3.6, grande: 4.2, arquero: 2.6 };

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const finito = (v, def = 0) => (Number.isFinite(v) ? v : def);

export function pelotaNueva(u = 0, v = 0) {
  return { u, v, y: 0, vu: 0, vv: 0, vy: 0, giro: 0, enJuego: true, quieta: true };
}
// Saca del medio (o de donde se pida), quieta
export function sacar(p, u = 0, v = 0) {
  p.u = u; p.v = v; p.y = 0; p.vu = 0; p.vv = 0; p.vy = 0; p.enJuego = true; p.quieta = true;
  return p;
}

// Patear: `dir` en el marco de la cancha ({ u, v }, no hace falta que sea unitaria); `fuerza` en m/s; `alto`: cuánto
// sube (0 a 1, una fracción de la fuerza)
export function patear(p, dir, fuerza = PATADA.suave, alto = 0) {
  const l = Math.hypot(finito(dir?.u), finito(dir?.v));
  if (!(l > 1e-6)) return false;
  const f = clamp(finito(fuerza, PATADA.suave), 0, 25);
  p.vu = (dir.u / l) * f; p.vv = (dir.v / l) * f;
  p.vy = Math.max(p.vy, clamp(finito(alto), 0, 1) * f);
  p.quieta = false;
  return true;
}

// Un paso de la pelota. `altura(u, v)`: el piso; devuelve lo que pasó: { gol: 0|1|null (el arco donde entró), afuera:
// 'lateral'|'fondo'|null, pique: velocidad del pique (para el sonido), palo: true si pegó en un palo }
export function pasoPelota(p, dt, altura = () => 0) {
  const r = PELOTA.radio, A = CANCHA.arco, L2 = CANCHA.largo / 2, W2 = CANCHA.ancho / 2;
  const salida = { gol: null, afuera: null, pique: 0, palo: false };
  if (!p.enJuego) return salida;
  dt = clamp(finito(dt), 0, 0.1);
  if (dt <= 0) return salida;
  // de a pasos chicos: una patada fuerte no atraviesa un palo
  const n = Math.max(1, Math.ceil((Math.hypot(p.vu, p.vv, p.vy) * dt) / 0.12));
  const h = dt / n;
  for (let k = 0; k < n; k++) {
    const piso = finito(altura(p.u, p.v));
    const sobre = p.y > 0.002 || p.vy > 0.01;
    if (sobre) {
      p.vy -= PELOTA.gravedad * h;
      const f = Math.max(0, 1 - PELOTA.aire * h);
      p.vu *= f; p.vv *= f;
    } else {
      // rodando: la pendiente la lleva y el pasto la frena
      const e = 0.4, gu = (finito(altura(p.u + e, p.v)) - finito(altura(p.u - e, p.v))) / (2 * e), gv = (finito(altura(p.u, p.v + e)) - finito(altura(p.u, p.v - e))) / (2 * e);
      p.vu -= gu * PELOTA.pendiente * h; p.vv -= gv * PELOTA.pendiente * h;
      const f = Math.max(0, 1 - PELOTA.rozamiento * h);
      p.vu *= f; p.vv *= f;
    }
    const u0 = p.u, v0 = p.v;
    p.u += p.vu * h; p.v += p.vv * h; p.y += p.vy * h;
    if (p.y <= 0) {
      if (p.vy < -1.2) { salida.pique = Math.max(salida.pique, -p.vy); p.vy = -p.vy * PELOTA.rebote; }
      else p.vy = 0;
      p.y = 0;
    }
    // los palos y el travesaño de cada arco (los dos palos como cilindros, el travesaño como un tubo)
    for (const lado of [0, 1]) {
      const vl = lado === 0 ? -L2 : L2;
      for (const su of [-1, 1]) {
        const pu = (su * A.ancho) / 2, du = p.u - pu, dv = p.v - vl, d = Math.hypot(du, dv), min = r + A.palo;
        if (p.y < A.alto && d < min && d > 1e-6) {
          const nu = du / d, nv = dv / d, vn = p.vu * nu + p.vv * nv;
          p.u = pu + nu * min; p.v = vl + nv * min;
          if (vn < 0) { p.vu -= (1 + PELOTA.rebotePalo) * vn * nu; p.vv -= (1 + PELOTA.rebotePalo) * vn * nv; salida.palo = true; }
        }
      }
      // el travesaño
      if (Math.abs(p.u) < A.ancho / 2) {
        const dy = p.y - A.alto, dv = p.v - vl, d = Math.hypot(dy, dv), min = r + A.palo;
        if (d < min && d > 1e-6) {
          const ny = dy / d, nv = dv / d, vn = p.vy * ny + p.vv * nv;
          p.y = A.alto + ny * min; p.v = vl + nv * min;
          if (vn < 0) { p.vy -= (1 + PELOTA.rebotePalo) * vn * ny; p.vv -= (1 + PELOTA.rebotePalo) * vn * nv; salida.palo = true; }
        }
      }
    }
    // ¿cruzó la línea de un arco entre los palos y abajo del travesaño? gol (y la red la frena)
    for (const lado of [0, 1]) {
      const vl = lado === 0 ? -L2 : L2, s = lado === 0 ? -1 : 1;
      const cruzo = s * (v0 - vl) < 0 && s * (p.v - vl) >= 0;
      if (cruzo && Math.abs(p.u) < A.ancho / 2 - r && p.y < A.alto - r) {
        salida.gol = lado;
        p.vu *= 0.15; p.vv *= 0.1; p.vy *= 0.3;
        p.enJuego = false;
        return salida;
      }
    }
    // afuera (lateral o por el fondo, sin gol)
    if (Math.abs(p.u) > W2 + 1.2) { salida.afuera = 'lateral'; p.enJuego = false; return salida; }
    if (Math.abs(p.v) > L2 + 1.2) { salida.afuera = 'fondo'; p.enJuego = false; return salida; }
    void u0;
  }
  const vel = Math.hypot(p.vu, p.vv);
  p.quieta = p.y <= 0.002 && Math.abs(p.vy) < 0.01 && vel < PELOTA.quieta;
  if (p.quieta) { p.vu = 0; p.vv = 0; }
  // el giro (para que la pelota ruede a la vista)
  p.giro = (p.giro + (vel * dt) / r) % (Math.PI * 2);
  return salida;
}

// Lo que hace uno que juega: { u, v } adonde corre y si patea. `j`: { u, v, equipo (0 ataca hacia el arco 1, 1 hacia el
// 0), rol: 'campo'|'arquero', chico }. `p`: la pelota. `sorteo()`: un azar de 0 a 1 (para que no sean robots)
export function pensarJugador(j, p, sorteo = Math.random) {
  const L2 = CANCHA.largo / 2, arcoPropio = j.equipo === 0 ? -L2 : L2, arcoRival = -arcoPropio;
  if (j.rol === 'arquero') {
    // se queda en su área, siguiendo la pelota a lo ancho; sale si la pelota está cerca
    const cerca = Math.abs(p.v - arcoPropio) < 5;
    const objetivo = cerca ? { u: p.u, v: p.v } : { u: clamp(p.u * 0.35, -CANCHA.arco.ancho / 2, CANCHA.arco.ancho / 2), v: arcoPropio + Math.sign(-arcoPropio) * 0.9 };
    return { ...objetivo, velocidad: CORRER.arquero, patear: cerca && Math.hypot(p.u - j.u, p.v - j.v) < PATADA.alcance };
  }
  // los de campo: van detrás de la pelota (del lado de su arco) y la patean hacia el arco de enfrente
  const atras = Math.sign(arcoPropio - p.v) || -1;
  const objetivo = { u: p.u + (sorteo() - 0.5) * 0.3, v: p.v + atras * 0.45 };
  const d = Math.hypot(p.u - j.u, p.v - j.v);
  return { ...objetivo, velocidad: j.chico ? CORRER.chico : CORRER.grande, patear: d < PATADA.alcance && p.y < 0.5, haciaU: (sorteo() - 0.5) * CANCHA.arco.ancho * 0.9, haciaV: arcoRival };
}
// La patada del que juega: hacia el arco de enfrente, con algo de error
export function patadaDe(j, p, sorteo = Math.random) {
  const L2 = CANCHA.largo / 2, arcoRival = j.equipo === 0 ? L2 : -L2;
  const dist = Math.abs(arcoRival - p.v);
  const fuerza = dist > 10 ? PATADA.suave + sorteo() * 2 : PATADA.suave + 1 + sorteo() * 3;
  const apunta = { u: (sorteo() - 0.5) * CANCHA.arco.ancho * (j.chico ? 1.6 : 1.1) - p.u, v: arcoRival - p.v };
  return { dir: apunta, fuerza: j.chico ? fuerza * 0.8 : fuerza, alto: sorteo() < 0.25 ? PATADA.alto : 0.05 };
}
// ¿Está la pelota al alcance para patearla (vos o alguien)?
export const alAlcance = (pos, p, alcance = PATADA.alcance) => p.enJuego && p.y < 0.6 && Math.hypot(p.u - pos.u, p.v - pos.v) < alcance;
// El saque después de un gol o de que se fue: del medio (gol) o de donde salió, adentro
export function saqueDespues(p, que) {
  if (que === 'gol') return sacar(p, 0, 0);
  const u = clamp(p.u, -CANCHA.ancho / 2 + 0.5, CANCHA.ancho / 2 - 0.5), v = clamp(p.v, -CANCHA.largo / 2 + 1.5, CANCHA.largo / 2 - 1.5);
  return sacar(p, u, v);
}
