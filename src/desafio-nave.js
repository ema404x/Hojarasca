// 3.0: la pelea adentro de la nave nodriza (reglas puras: sin three ni DOM).
//
// Cuando el asedio abre el haz, se sube a la nave. Adentro hay una cámara orgánica, de
// cristal y carne, y en el medio la que la maneja: la Madre. Pelea en tres fases:
//
//   1. Los ojos. Tres ojos alrededor del cuerpo, que se da vuelta despacio: hay que
//      rodearla. Escupe plasma y llama crías de las vainas de la pared.
//   2. Los pilares. Sin ojos se encierra en un escudo que alimentan cuatro pilares de
//      cristal en el borde. Mientras tanto, ondas por el piso (se saltan) y púas que
//      salen debajo tuyo (se esquivan: primero brilla el piso).
//   3. El corazón. Sin pilares se abre el caparazón y queda el corazón al aire. Todo
//      viene más rápido.
//
// Todas las armas le pegan a los puntos débiles por el mismo camino que a los núcleos de
// la nodriza y al nido. Si caés adentro, la nave te escupe afuera y se puede volver a
// subir: la pelea arranca de cero (no se guarda a medias).

export const NAVE = {
  alturaInterior: 650,     // metros sobre el suelo del sitio donde se asentó
  radioArena: 27,
  radioCuerpo: 4.6,        // la Madre ocupa el medio
  ojos: 3, vidaOjo: 260,
  pilares: 4, vidaPilar: 200, radioPilares: 18,
  vidaCorazon: 800,
  maxCrias: [3, 4, 5],     // crías vivas a la vez, por fase
  // cada cuánto hace cada cosa, por fase (0 = no lo hace)
  cadencias: {
    disparo: [2.6, 2.1, 1.5],
    llamar: [20, 17, 13],
    onda: [0, 7, 5],
    pua: [0, 6.5, 4.2],
  },
  crias: [['rastreador', 'rastreador'], ['saltador', 'tirador'], ['rastreador', 'saltador', 'tirador']],
  dano: { disparo: 7, onda: 14, pua: 18 },
  onda: { vel: 9, ancho: 0.75, alto: 0.4 },
  pua: { aviso: 1.1, radio: 1.7 },
};
export const FASES_NAVE = ['ojos', 'pilares', 'corazon'];
export const NOMBRE_FASE = { ojos: 'las piedras de ámbar', pilares: 'las raíces', corazon: 'el corazón' };
export const AVISO_FASE = {
  ojos: ['El Rey Duende', 'Tres piedras de ámbar le brillan en el cuerpo: rodealo y reventáselas. Se da vuelta despacio'],
  pilares: ['Se encerró en su corteza', 'La alimentan las cuatro raíces del borde. Saltá las ondas del piso y salí de donde brilla'],
  corazon: ['¡Se le abrió la corteza!', 'El corazón de ámbar quedó al aire. Ahora viene todo más rápido'],
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// `vida`: el multiplicador de vida de la dificultad; `debilidad`: zonas libres de más
// (con las cuatro, la Madre arranca con un ojo menos).
export function naveNueva({ vida = 1, debilidad = 0 } = {}) {
  const k = clamp(Number(vida) || 1, 0.5, 2);
  const ojos = Array.from({ length: NAVE.ojos }, (_, i) => (i < Math.max(0, Math.floor(debilidad)) ? 0 : Math.round(NAVE.vidaOjo * k)));
  if (ojos.every((v) => v <= 0)) ojos[ojos.length - 1] = Math.round(NAVE.vidaOjo * k);   // siempre queda uno
  return {
    fase: 'ojos', t: 0,
    ojos, vidaOjo: Math.round(NAVE.vidaOjo * k),
    pilares: Array.from({ length: NAVE.pilares }, () => Math.round(NAVE.vidaPilar * k)), vidaPilar: Math.round(NAVE.vidaPilar * k),
    corazon: Math.round(NAVE.vidaCorazon * k), vidaCorazon: Math.round(NAVE.vidaCorazon * k),
    relojes: { disparo: 3, llamar: 6, onda: 4, pua: 3 },
    ganada: false,
  };
}
export const indiceFase = (n) => Math.max(0, FASES_NAVE.indexOf(n?.fase));

// Los puntos a los que se les puede pegar ahora: [{ tipo, i }].
export function puntosActivos(n) {
  if (!n || n.ganada) return [];
  if (n.fase === 'ojos') return n.ojos.map((v, i) => ({ tipo: 'ojo', i, v })).filter((p) => p.v > 0).map(({ tipo, i }) => ({ tipo, i }));
  if (n.fase === 'pilares') return n.pilares.map((v, i) => ({ tipo: 'pilar', i, v })).filter((p) => p.v > 0).map(({ tipo, i }) => ({ tipo, i }));
  return n.corazon > 0 ? [{ tipo: 'corazon', i: 0 }] : [];
}
// Un golpe a un punto. Devuelve { ok, roto, fase (la nueva si cambió), ganada }.
export function herirPunto(n, tipo, i, dano) {
  if (!n || n.ganada || !(dano > 0)) return { ok: false };
  const lista = tipo === 'ojo' ? n.ojos : tipo === 'pilar' ? n.pilares : null;
  const esperado = n.fase === 'ojos' ? 'ojo' : n.fase === 'pilares' ? 'pilar' : 'corazon';
  if (tipo !== esperado) return { ok: false };   // el escudo o el caparazón lo frenan
  if (tipo === 'corazon') {
    if (n.corazon <= 0) return { ok: false };
    n.corazon = Math.max(0, n.corazon - dano);
    if (n.corazon > 0) return { ok: true, roto: false };
    n.ganada = true;
    return { ok: true, roto: true, ganada: true };
  }
  if (!lista || !(lista[i] > 0)) return { ok: false };
  lista[i] = Math.max(0, lista[i] - dano);
  if (lista[i] > 0) return { ok: true, roto: false };
  if (lista.some((v) => v > 0)) return { ok: true, roto: true };
  n.fase = tipo === 'ojo' ? 'pilares' : 'corazon';
  // al cambiar de fase, un respiro antes de lo nuevo
  n.relojes.onda = 3; n.relojes.pua = 2.5; n.relojes.llamar = Math.min(n.relojes.llamar, 4);
  return { ok: true, roto: true, fase: n.fase };
}
// Avanza los relojes y deja en `salida` lo que hace en este paso:
// 'disparo', 'llamar', 'onda', 'pua'. `crias`: cuántas crías siguen vivas.
export function avanzarNave(n, dt, { crias = 0 } = {}, salida = []) {
  salida.length = 0;
  if (!n || n.ganada || !(dt > 0)) return salida;
  n.t += dt;
  const f = indiceFase(n);
  for (const clave of ['disparo', 'llamar', 'onda', 'pua']) {
    const cada = NAVE.cadencias[clave][f];
    if (!cada) continue;
    n.relojes[clave] -= dt;
    if (n.relojes[clave] > 0) continue;
    n.relojes[clave] = cada;
    if (clave === 'llamar' && crias >= NAVE.maxCrias[f]) continue;
    salida.push(clave);
  }
  return salida;
}
export const criasDeFase = (n) => NAVE.crias[indiceFase(n)] || NAVE.crias[0];

// Cuánto le queda, de 0 a 1, contando todo (para la barra).
export function fraccionNave(n) {
  if (!n) return 0;
  const total = n.vidaOjo * n.ojos.length + n.vidaPilar * n.pilares.length + n.vidaCorazon;
  const queda = n.ojos.reduce((s, v) => s + v, 0) + n.pilares.reduce((s, v) => s + v, 0) + n.corazon;
  return total > 0 ? clamp(queda / total, 0, 1) : 0;
}
export function textoNave(n) {
  if (!n) return '';
  if (n.ganada) return 'Cayó el Rey Duende';
  const vivos = puntosActivos(n).length;
  if (n.fase === 'corazon') return 'Fase 3 · el corazón';
  return `Fase ${indiceFase(n) + 1} · ${NOMBRE_FASE[n.fase]} (${vivos})`;
}

// ¿La onda que va por el piso te alcanza? `radio`: por dónde va; `distancia`: a qué
// distancia del centro estás; `altura`: cuánto tenés los pies sobre el piso (saltando se pasa).
export function tocaOnda(radio, distancia, altura) {
  return Math.abs(distancia - radio) < NAVE.onda.ancho && altura < NAVE.onda.alto;
}
export function tocaPua(pua, x, z) {
  return Math.hypot(x - pua.x, z - pua.z) < NAVE.pua.radio;
}
// Adentro de la arena (el piso es un disco): se acota al borde.
export function dentroDeArena(dx, dz, radio = 0.4) {
  const d = Math.hypot(dx, dz), max = NAVE.radioArena - radio;
  if (d <= max) return { dx, dz, afuera: false };
  return { dx: dx / d * max, dz: dz / d * max, afuera: true };
}
// Y afuera del cuerpo de la Madre.
export function fueraDelCuerpo(dx, dz, radio = 0.4) {
  const d = Math.hypot(dx, dz) || 1e-4, min = NAVE.radioCuerpo + radio;
  if (d >= min) return { dx, dz, adentro: false };
  return { dx: dx / d * min, dz: dz / d * min, adentro: true };
}
