// 2.0: cuatro cosas nuevas de las noches del Desafío, en lo que tienen de lógica pura.
//
//   4. El asedio. Si te encerrás, no te rompen la pared de una: primero la tantean
//      —arañan, prueban la puerta— y recién después golpean. Lo que rompan queda
//      marcado para arreglar de día.
//   5. Se apagan las luces. Una noche especial nueva: las antorchas se apagan de a una,
//      sin que se vea quién.
//   8. El bestiario. El cuaderno del Desafío anota a cada invasor: primero lo que se
//      vio, después lo que se aprendió peleando, y el punto débil al tercero abatido.
//   9. Las noches después. Con el nido caído el Desafío termina, pero se puede elegir
//      seguir: cinco noches más de invasores cambiados, más duros.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- 4. el asedio
// Cuánto tiempo pasa rascando y probando la puerta antes de ponerse a golpear. El
// bruto no tantea: pega. El jefe, tampoco.
export const TANTEO = { rastreador: [2.2, 4.4], saltador: [1.6, 3.2], tirador: [2.5, 4.5], escupidor: [2, 3.6] };
export function tiempoDeTanteo(tipo, azar = Math.random) {
  const r = TANTEO[tipo];
  return r ? r[0] + (r[1] - r[0]) * azar() : 0;
}
// Qué hace en este momento del tanteo: los primeros dos tercios rasca; el último,
// prueba la puerta si la obra tiene una; si no, sigue rascando.
export function faseAsedio(t, total, conPuerta) {
  if (!(total > 0) || t >= total) return 'golpear';
  if (conPuerta && t > total * 0.62) return 'puerta';
  return 'rascar';
}
// ¿Es el refugio donde está metido el jugador? Sólo entonces se tantea: al aire libre
// un invasor no pierde tiempo. En una casa modular lo que se ataca es una pared y lo
// que "contiene" al jugador es el piso, así que no alcanza con comparar obras: cuenta
// estar adentro y que la pared atacada esté a pocos metros.
export const RADIO_ASEDIO = 7;
export function esAsedio(adentro, distanciaObraJugador) {
  return !!adentro && distanciaObraJugador < RADIO_ASEDIO;
}
// Qué obras tienen puerta para forcejear.
export function tienePuerta(plano) {
  return !!plano && (/puerta|porton/.test(plano.id || '') || !!plano.habitable);
}

// ---------------------------------------------------------------- 5. se apagan las luces
export const APAGON = {
  nombre: 'Noche sin luces', aviso: 'Algo anda apagando las antorchas', cantidad: 1,
};
// Cada cuánto se apaga una. Al principio de a poco; cuanto más oscuro está, más rápido.
export function esperaApagon(prendidas, azar = Math.random) {
  if (prendidas <= 0) return Infinity;
  return 18 + azar() * 16 - Math.min(10, (6 - Math.min(6, prendidas)) * 1.5);
}
// Antes de apagarse, la llama tiembla: el titileo dura esto.
export const TITILEO_APAGON = 1.6;
export function brilloTitileo(t) {
  if (t <= 0) return 1;
  if (t >= TITILEO_APAGON) return 0;
  const k = t / TITILEO_APAGON;
  return clamp((1 - k) * (0.55 + 0.45 * Math.sin(t * 37) * Math.sin(t * 11.3)), 0, 1);
}

// ---------------------------------------------------------------- 8. el bestiario
export const BESTIARIO = {
  rastreador: {
    nombre: 'Rastreador', visto: 'Flaco, encorvado, con gorro de corteza; corre en cuatro patas cuando te tiene en la mira.',
    aprendido: 'Caza como los perros cimarrones: si lo mirás, se frena o se esconde; si le das la espalda, carga. No le des la espalda.',
    debil: 'Poca vida y ningún blindaje: la lanza lo baja de dos golpes. El perro lo frena mordiéndole las patas.',
  },
  tirador: {
    nombre: 'Tirador', visto: 'Alto para ser duende, con un farolito de ámbar en la mano que se enciende antes de tirar.',
    aprendido: 'Se planta a media distancia y te tira chispas de ámbar. No tira si hay una pared entre él y vos.',
    debil: 'Pegate a una pared o a un tronco y hacelo acercarse. De cerca es lento para apuntar.',
  },
  bruto: {
    nombre: 'Bruto', visto: 'Un viejo enorme y lento, con barba de musgo y los ojos color brasa.',
    aprendido: 'No le tienen miedo a la luz: van derecho a las antorchas y las apagan. Rompen una empalizada en pocos golpes.',
    debil: 'Lento para girar: rodealo. Las estacas y los pozos lo frenan más que a nadie.',
  },
  saltador: {
    nombre: 'Saltador', visto: 'Chico y rapidísimo. Pasa por encima de lo que le pongas adelante.',
    aprendido: 'Salta empalizadas simples de una. Acecha como el rastreador.',
    debil: 'Casi sin vida. Los muros altos y los portones reforzados no los puede saltar.',
  },
  escupidor: {
    nombre: 'Escupidor', visto: 'Pesado, con una bolsa en el cuello que burbujea.',
    aprendido: 'Escupe savia hirviendo en arco por encima de las defensas. La savia quema las obras donde cae.',
    debil: 'De cerca no puede escupir: tiene que alejarse para apuntar. Encima, es presa fácil.',
  },
  jefe: {
    nombre: 'Capataz', visto: 'Cuatro metros de duende viejo, con hongos verdes en la espalda.',
    aprendido: 'Se da vuelta despacio y aplasta lo que tenga adelante.',
    debil: 'Los hongos de la espalda: el golpe ahí duele el doble.',
  },
  // 2.1
  excavador: {
    nombre: 'Excavador', visto: 'Bajo, encorvado, color de tierra, con brazos cortos como palas.',
    aprendido: 'Si tiene una empalizada adelante, no la rompe: se mete bajo tierra y sale adentro, cerca tuyo. Se lo oye cavar y se ve el polvo.',
    debil: 'Donde hay losa de piedra no puede asomar. Y cuando sale queda aturdido un momento: ahí.',
  },
  // 2.3
  volador: {
    nombre: 'Jinete de lechuza', visto: 'Un duende flaco montado en una lechuza grande, de alas que no hacen ruido.',
    aprendido: 'Pasa por arriba de todo y va derecho a las antorchas prendidas: la lechuza baja en picada y las apaga. Si no queda ninguna, viene rasante por vos.',
    debil: 'Arriba sólo lo alcanzan las flechas, la pistola y la ballesta que apunta al cielo. Cuando baja a apagar una llama, también la lanza.',
  },
  mutado: {
    nombre: 'Viejo', visto: 'Uno de los de siempre, pero viejo: barba de musgo y las venas encendidas de ámbar.',
    aprendido: 'Salen después de la cueva. Aguantan más, pegan más fuerte y se curan solos si los dejás respirar.',
    debil: 'No les des tregua: si seguís pegando no llegan a cerrarse las heridas.',
  },
};
export const ABATIDOS_PARA_DEBIL = 3;
// Una ficha según lo que sabés. `r` es el registro del bestiario de ese tipo.
// `t` traduce cada frase por separado: la ficha junta varias y el diccionario las conoce
// de a una.
export function fichaBestiario(tipo, r, t = (x) => x) {
  const B = BESTIARIO[tipo];
  if (!B || !r || !(r.vistos > 0 || r.abatidos > 0)) return null;
  const partes = [t(B.visto)];
  if (r.abatidos > 0) partes.push(t(B.aprendido));
  if (r.abatidos >= ABATIDOS_PARA_DEBIL) partes.push(t(`Punto débil: ${B.debil}`));
  return {
    tipo, nombre: t(B.nombre), texto: partes.join(' '),
    abatidos: r.abatidos || 0, dia: r.dia || 1,
    completa: r.abatidos >= ABATIDOS_PARA_DEBIL,
    falta: r.abatidos >= ABATIDOS_PARA_DEBIL ? '' : r.abatidos > 0
      ? t(`Abatí ${r.abatidos} de ${ABATIDOS_PARA_DEBIL} para conocer su punto débil.`)
      : t('Todavía no abatí ninguno.'),
  };
}
export function anotarBestiario(best, tipo, que, dia = 1) {
  if (!BESTIARIO[tipo]) return { nuevo: false, debil: false };
  const r = best[tipo] || (best[tipo] = { vistos: 0, abatidos: 0, dia });
  const antes = { vistos: r.vistos, abatidos: r.abatidos };
  if (que === 'visto') r.vistos++;
  if (que === 'abatido') r.abatidos++;
  return {
    nuevo: antes.vistos === 0 && antes.abatidos === 0,
    aprendido: que === 'abatido' && antes.abatidos === 0,
    debil: que === 'abatido' && r.abatidos === ABATIDOS_PARA_DEBIL,
  };
}
export function sanearBestiario(v) {
  const s = {};
  if (!v || typeof v !== 'object') return s;
  for (const t of Object.keys(BESTIARIO)) {
    const r = v[t];
    if (!r || typeof r !== 'object') continue;
    const n = (x) => (Number.isFinite(Number(x)) ? Math.max(0, Math.floor(Number(x))) : 0);
    s[t] = { vistos: n(r.vistos), abatidos: n(r.abatidos), dia: Math.max(1, n(r.dia) || 1) };
  }
  return s;
}
// Se ve de cerca: a menos de esto, en la pantalla, cuenta como visto.
export const DISTANCIA_VISTO = 22;

// ---------------------------------------------------------------- 9. las noches después
export const NOCHES_DESPUES = 5;
export function sanearDespues(v) {
  if (!v || typeof v !== 'object') return null;
  const n = Number.isFinite(Number(v.noches)) ? clamp(Math.floor(Number(v.noches)), 0, NOCHES_DESPUES) : 0;
  return { activo: !!v.activo, noches: n, terminado: !!v.terminado || n >= NOCHES_DESPUES };
}
export function empezarDespues() { return { activo: true, noches: 0, terminado: false }; }
export function siguenDespues(despues) { return !!despues?.activo && !despues.terminado; }
// Una noche más sobrevivida. Devuelve si con ésta se terminó.
export function sumarNocheDespues(despues) {
  if (!siguenDespues(despues)) return false;
  despues.noches = Math.min(NOCHES_DESPUES, despues.noches + 1);
  if (despues.noches >= NOCHES_DESPUES) despues.terminado = true;
  return despues.terminado;
}
// Qué tan cambiados vienen: la primera noche, la mitad; la última, casi todos.
export function probabilidadMutado(nochesDespues) {
  return clamp(0.5 + nochesDespues * 0.1, 0.5, 0.95);
}
// Lo que cambia en un mutado.
export const MUTADO = { vida: 1.4, vel: 1.12, dano: 1.25, escala: 1.08, regenera: 0.035, tregua: 3.5 };
// Cuánto se cura en este cuadro: nada mientras le sigan pegando.
export function regeneracion(a, dt) {
  if (!a?.mutado || !(a.vida > 0) || a.vida >= a.vidaMax) return 0;
  if ((a.sinGolpe || 0) < MUTADO.tregua) return 0;
  return Math.min(a.vidaMax - a.vida, a.vidaMax * MUTADO.regenera * dt);
}
// Las venas de otro color: de verde a un naranja rojizo, y el doble de brillo.
export const VENA_MUTADO = '#ff5a2a';
