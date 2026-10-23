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

// ---------------------------------------------------------------- 4.10 coihue: los peligros de la subida
// Subiendo por la escalera de raíces (antes de la puerta del corazón) hay dos cosas, las dos con aviso y las dos
// esquivables, y ninguna te deja encerrado:
//   · las raíces que se mueven: una raíz sale de la pared, el escalón brilla un instante (aviso), barre el
//     tramo de arriba para abajo (te tira para atrás si te agarra, con un golpe chico), queda atravesada unos
//     segundos y se vuelve a meter en la pared. Sólo empieza cuando estás cerca, y siempre se retira.
//   · los duendes de las ramas: salen de sus casitas, chillan (aviso) y tiran una semilla de ámbar. Se esconden si
//     te acercás, y si les pegás se van un rato (a la segunda, del todo, hasta que vuelvas a subir).
// Con poca salud (menos de `saludMinima`) no hacen daño: la subida no es el lugar donde se pierde la partida.
export const PELIGROS = {
  raices: { aviso: 1.8, barrido: 0.8, tapa: 3.2, vuelta: 1.0, reposo: [4.8, 4.0, 3.4], cerca: 13, barre: 2.8, banda: 0.9, dano: 7, empuje: 7 },
  ramas: { vida: 36, aviso: 1.2, cada: 5.6, dano: 6, alcance: 10.5, minimo: 3.5, retiro: 9, vel: 11 },
  saludMinima: 30,
};
export function periodoRaiz(i = 0) {
  const r = PELIGROS.raices;
  return r.reposo[Math.abs(Math.floor(i)) % r.reposo.length] + r.aviso + r.barrido + r.tapa + r.vuelta;
}
// En qué parte del ciclo está una raíz a los `t` segundos: { fase, u (0 a 1 dentro de la fase) }.
export function faseRaiz(t, i = 0) {
  const r = PELIGROS.raices, R = r.reposo[Math.abs(Math.floor(i)) % r.reposo.length];
  const partes = [['reposo', R], ['aviso', r.aviso], ['barrido', r.barrido], ['tapa', r.tapa], ['vuelta', r.vuelta]];
  let x = Math.max(0, t);
  for (const [fase, dur] of partes) {
    if (x < dur) return { fase, u: dur > 0 ? x / dur : 1 };
    x -= dur;
  }
  return { fase: 'reposo', u: 0 };
}
// Avanza el reloj de una raíz (`r.t`, `r.i`). Sólo arranca el aviso si hay alguien cerca; una vez empezado, termina siempre.
export function avanzarRaiz(r, dt, cerca) {
  const R = PELIGROS.raices.reposo[Math.abs(Math.floor(r.i)) % PELIGROS.raices.reposo.length];
  if (!cerca && r.t < R) { r.t = 0; return; }
  r.t += dt;
  if (r.t >= periodoRaiz(r.i)) r.t = 0;
}
// Dónde está el barredor a lo largo del escalón (m desde el centro; positivo es hacia arriba): sube desde +barre/2,
// baja hasta -barre/2 con el barrido y se queda ahí atravesado. Antes del barrido está arriba, al final.
export function posicionBarrido(fase, u) {
  const m = PELIGROS.raices.barre / 2;
  if (fase === 'barrido') { const e = u * u * (3 - 2 * u); return m - 2 * m * e; }
  return fase === 'tapa' || fase === 'vuelta' ? -m : m;
}
// Cuánto sacó de la pared la raíz (0 escondida, 1 entera).
export function salidaRaiz(fase, u) {
  if (fase === 'aviso') return 0.55 * u;
  if (fase === 'barrido') return 0.55 + 0.45 * Math.min(1, u * 3);
  if (fase === 'tapa') return 1;
  if (fase === 'vuelta') return 1 - u;
  return 0;
}
// ¿Está atravesada (sólida)? Sólo en la tapa, y nunca encima de nadie.
export const raizSolida = (fase) => fase === 'tapa';
// ¿El barrido te agarra? `s`: dónde estás a lo largo del escalón (m desde el centro, positivo hacia arriba); `p`: dónde
// está el barredor; `altura`: a cuánto estás del escalón de ahí.
export function barridoTeAgarra(s, p, altura) {
  return Math.abs(s - p) < PELIGROS.raices.banda && altura > -0.6 && altura < 2.0;
}
// Dónde se paran las raíces: en tramos parejos de la escalera (no en los descansos ni en los primeros ni en los últimos),
// repartidas. `tramos`: [{ alto }]; `descansos`: [{ y }]. Devuelve los índices de tramo.
export function lugaresRaices(tramos, descansos, cuantas = 3) {
  const n = tramos?.length || 0, sal = [];
  if (n < 40) return sal;
  const desde = 12, hasta = n - 16;
  for (let k = 0; k < cuantas; k++) {
    const meta = Math.round(desde + ((k + 0.5) / cuantas) * (hasta - desde));
    for (let d = 0; d < (hasta - desde); d++) {
      const i = meta + (d % 2 ? -1 : 1) * Math.ceil(d / 2);
      if (i < desde || i > hasta || sal.some((j) => Math.abs(j - i) < 14)) continue;
      const y = tramos[i].alto;
      if (y === tramos[i - 3].alto || y === tramos[i + 3].alto) continue;   // un descanso a la vista
      if ((descansos || []).some((q) => Math.abs(q.y - y) < 1.4)) continue;
      sal.push(i);
      break;
    }
  }
  return sal.sort((a, b) => a - b);
}
