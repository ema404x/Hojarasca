// 4.8 ambiente: «Noches distintas», la parte del AMBIENTE (miedo, sonido, luz y clima). Reglas puras.
//
// Hasta la 4.7 todas las noches del Desafío sonaban y se veían igual: el valle callado, la música de tensión que sigue a la
// cantidad de duendes y nada más. Acá se decide, por tipo de noche, qué pasa alrededor sin cambiar cuántos duendes vienen ni el
// equilibrio (eso es de las reglas de las noches y de los ataques): ojos que brillan entre los árboles a lo lejos, ramas que
// crujen, risitas que se acercan y se alejan, un silencio raro antes de que salgan, algo que se lleva una antorcha sin que se
// vea quién, la niebla que avanza, la luna llena que alumbra el valle, y los animales que avisan (teros, vacas, pájaros que se callan).
//
// Todo acá es puro (sin three ni DOM): `desafio-ambiente-mundo.js` pone los ojos, la niebla y los puestos de fauna en el mundo, y
// `desafio-ambiente-sonidos.js` los sonidos nuevos. El tiempo se cuenta en segundos reales; la previa (la hora antes del ataque)
// se mide por su avance `f` de 0 a 1, así el cronograma sirve con cualquier largo de día.
import { HORA_ATAQUE, HORA_AMANECER, nocheFinalCoihue, claveNoche, esNocheDeJefe } from './desafio-reglas.js';

const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
const suave = (x, a, b) => { const t = limitar((x - a) / (b - a || 1), 0, 1); return t * t * (3 - 2 * t); };

export const HORA_PREVIA = HORA_ATAQUE - 1;

// ---------------------------------------------------------------- qué noche es
// La noche que está pasando (o la que viene, si todavía no salieron): `oleadas` cuenta las resistidas y sube al empezar la oleada.
export function nocheEnCurso(d, dia, horas) {
  const resistidas = Math.max(0, Math.floor(d?.oleadas || 0));
  const enMarcha = d && d.oleadaNoche === claveNoche(dia, horas) && !d.oleadaTerminada;
  return enMarcha ? Math.max(1, resistidas) : resistidas + 1;
}

// El tipo de noche para el ambiente. `especial` es el `d.especial` de las reglas de las noches ('roja', 'eclipse', 'silenciosa',
// 'apagon', y las nuevas 'niebla' y 'lunallena'); lo que no se conoce se trata como una noche común.
export function tipoDeNoche({ noche = 1, especial = null, sinFin = false } = {}) {
  if (!sinFin && noche >= nocheFinalCoihue()) return 'final';   // 4.10 partidas: nunca en la corta
  if (especial && Object.hasOwn(PERFILES, especial)) return especial;
  if (esNocheDeJefe(noche)) return 'jefe';
  return noche <= 1 ? 'primera' : 'comun';
}

// ---------------------------------------------------------------- los perfiles
// Cada campo en segundos reales salvo `f` (avance de la previa). `null`: eso no pasa en esa noche.
//   miedo       0..1   lo que se siente: la música no baja de acá y sube con la previa
//   silencio    { f }  el silencio raro antes de salir (desde ese avance de la previa hasta que salen)
//   crujidos    [a,b]  cada cuánto cruje una rama lejos (con el valle vacío de duendes, el doble)
//   risitas     { cada:[a,b], n:[a,b] }  secuencias de risitas que se acercan o se alejan
//   ojos        { max, cada, vida, dist, desde }  pares de ojos entre los árboles a lo lejos
//   oirDuendes  { cada, desde, hasta }  se oye al duende de verdad, que todavía no se ve (niebla)
//   antorcha    { desde }  algo se lleva una antorcha (una vez)
export const PERFILES = {
  // la primera noche: pocos duendes (tres) pero mucha tensión desde el principio
  primera: { nombre: 'primera', miedo: 0.82, silencio: { f: 0.86 }, llegada: true, crujidos: [5, 9], risitas: { cada: [14, 24], n: [2, 3] },
    ojos: { max: 3, cada: [7, 12], vida: [8, 13], dist: [30, 62], desde: 2 }, oirDuendes: null, antorcha: { desde: 12 }, fauna: true, viejos: false, musica: 'primera' },
  // las demás: lo justo para que el valle no esté mudo, sin repetirse hasta cansar
  comun: { nombre: 'comun', miedo: 0.38, silencio: { f: 0.9 }, llegada: true, crujidos: [16, 34], risitas: { cada: [48, 90], n: [2, 2] },
    ojos: { max: 1, cada: [28, 55], vida: [6, 10], dist: [32, 66], desde: 8 }, oirDuendes: null, antorcha: null, fauna: true, viejos: false, musica: 'comun' },
  jefe: { nombre: 'jefe', miedo: 0.62, silencio: { f: 0.88 }, llegada: true, crujidos: [10, 20], risitas: { cada: [30, 60], n: [2, 3] },
    ojos: { max: 2, cada: [14, 26], vida: [7, 12], dist: [30, 64], desde: 4 }, oirDuendes: null, antorcha: null, fauna: true, viejos: true, musica: 'comun' },
  final: { nombre: 'final', miedo: 0.7, silencio: { f: 0.86 }, llegada: true, crujidos: [8, 16], risitas: { cada: [24, 46], n: [2, 3] },
    ojos: { max: 3, cada: [10, 20], vida: [7, 12], dist: [30, 64], desde: 3 }, oirDuendes: null, antorcha: null, fauna: true, viejos: true, musica: 'comun' },
  // noche roja y eclipse: el cielo ya hace casi todo
  roja: { nombre: 'roja', miedo: 0.6, silencio: { f: 0.88 }, llegada: true, crujidos: [12, 24], risitas: { cada: [34, 64], n: [2, 3] },
    ojos: { max: 2, cada: [16, 30], vida: [7, 12], dist: [30, 64], desde: 4 }, oirDuendes: null, antorcha: null, fauna: true, viejos: false, musica: 'roja' },
  eclipse: { nombre: 'eclipse', miedo: 0.6, silencio: { f: 0.84 }, llegada: true, crujidos: [10, 20], risitas: { cada: [40, 70], n: [2, 3] },
    ojos: { max: 3, cada: [12, 24], vida: [8, 14], dist: [28, 60], desde: 3 }, oirDuendes: null, antorcha: null, fauna: true, viejos: true, musica: 'eclipse' },
  // silenciosa: casi nada suena, y ese casi nada pesa más
  silenciosa: { nombre: 'silenciosa', miedo: 0.55, silencio: { f: 0.7 }, llegada: false, crujidos: [30, 55], risitas: null,
    ojos: { max: 2, cada: [20, 38], vida: [8, 13], dist: [34, 70], desde: 6 }, oirDuendes: null, antorcha: null, fauna: false, viejos: false, musica: 'silenciosa' },
  apagon: { nombre: 'apagon', miedo: 0.6, silencio: { f: 0.88 }, llegada: true, crujidos: [10, 22], risitas: { cada: [30, 60], n: [2, 3] },
    ojos: { max: 3, cada: [10, 20], vida: [8, 13], dist: [28, 60], desde: 3 }, oirDuendes: null, antorcha: null, fauna: true, viejos: false, musica: 'apagon' },
  // niebla: no se ve nada, se los oye antes de verlos (los pasos y las risitas son los de los duendes de verdad)
  niebla: { nombre: 'niebla', miedo: 0.66, silencio: { f: 0.84 }, llegada: true, crujidos: [6, 12], risitas: { cada: [18, 34], n: [2, 3] },
    ojos: null, oirDuendes: { cada: [3.2, 6.5], desde: 14, hasta: 70 }, antorcha: null, fauna: true, viejos: false, musica: 'niebla', niebla: 1 },
  // luna llena con los viejos: el valle alumbrado, sombras largas, resuellos pesados
  lunallena: { nombre: 'lunallena', miedo: 0.64, silencio: { f: 0.86 }, llegada: true, crujidos: [8, 15], risitas: { cada: [26, 48], n: [2, 3] },
    ojos: { max: 2, cada: [14, 26], vida: [8, 14], dist: [32, 70], desde: 4 }, oirDuendes: { cada: [7, 13], desde: 16, hasta: 60 }, antorcha: null, fauna: true, viejos: true, musica: 'lunallena', luna: 1 },
};

// Las claves de `musica` que entiende desafio-musica.js
export const VARIANTES_MUSICA = ['primera', 'comun', 'roja', 'eclipse', 'silenciosa', 'apagon', 'niebla', 'lunallena'];
export function perfilDe(tipo) { return PERFILES[tipo] || PERFILES.comun; }

// ---------------------------------------------------------------- el miedo (para la música)
// Cuánto miedo se siente ahora, 0..1. Sube con la previa, se sostiene mientras hay duendes y afloja si el valle quedó vacío.
export function miedoDe(perfil, { fase = 'calma', f = 0, vivos = 0, tAtaque = 0, noche = 1 } = {}) {
  const base = perfil?.miedo ?? 0;
  if (fase === 'previa') return base * (0.3 + 0.7 * suave(f, 0, 1));
  if (fase === 'ataque') return base * (vivos > 0 ? 1 : 0.55) * (1 - 0.25 * suave(tAtaque, 120, 420));
  return noche > 0.5 ? base * 0.28 : 0;
}

// ---------------------------------------------------------------- la agenda de la noche
// Un cronograma sin mundo: se le da el estado cada cuadro y devuelve, casi siempre, una lista vacía. Los eventos:
//   { k:'crujido', dist, doble }            una rama que cruje lejos
//   { k:'risa', dist, sec, idx, n, modo, viejo }  una risita de una secuencia que se acerca ('acercan') o se aleja ('alejan')
//   { k:'silencio' } / { k:'silencio-fin' }  el silencio raro antes de salir
//   { k:'llegada' }                          salen: golpe grave y la música sube
//   { k:'ojo', vida, dist }                  un par de ojos entre los árboles
//   { k:'oirDuende', modo }                  se oye a un duende de verdad que todavía no se ve
//   { k:'antorcha' }                         algo se lleva una antorcha
//   { k:'pista' }                            de tarde, una pista del lado por donde van a entrar (sólo si el juego dice cuál: `e.hayLado`)
// La lista que devuelve `paso` es la misma cada vez (se vacía en cada llamada): no se guarda.
export function crearAgenda(perfil, azar = Math.random) {
  const sorteo = (r) => r[0] + azar() * (r[1] - r[0]);
  const entero = (r) => Math.floor(r[0] + azar() * (r[1] - r[0] + 1));
  const salida = [];
  const cola = [];                       // los pasos que faltan de la secuencia de risitas en curso
  const A = {
    perfil, tAtaque: 0, llegada: false, silencio: false, silenciado: false, antorcha: false, visto: false, secuencias: 0, eventos: 0,
    proxCrujido: perfil.crujidos ? sorteo(perfil.crujidos) * 0.5 : Infinity,
    proxRisita: perfil.risitas ? sorteo(perfil.risitas.cada) * 0.6 : Infinity,
    proxOjo: perfil.ojos ? perfil.ojos.desde : Infinity,
    proxOir: perfil.oirDuendes ? sorteo(perfil.oirDuendes.cada) : Infinity,
    proxPista: 6 + azar() * 6,
  };
  const poner = (ev) => { salida.push(ev); A.eventos++; };

  A.paso = function paso(dt, e) {
    salida.length = 0;
    if (!e || !e.activo || !(dt > 0)) return salida;
    dt = Math.min(dt, 0.5);
    const previa = e.fase === 'previa', ataque = e.fase === 'ataque';
    const oscuro = (e.noche ?? 0) > 0.4, cerrada = (e.noche ?? 0) > 0.8;   // la noche cerrada (los ojos y la antorcha se ven en la oscuridad, no en el crepúsculo)
    // si la partida se abre en pleno ataque, las salidas ya pasaron: sin golpe ni silencio
    if (!A.visto) { A.visto = true; if (ataque) { A.llegada = true; A.silenciado = true; } }
    if (ataque) {
      if (!A.llegada) {
        A.llegada = true;
        if (A.silencio) { A.silencio = false; poner({ k: 'silencio-fin' }); }
        if (perfil.llegada) poner({ k: 'llegada' });
      }
      A.tAtaque += dt;
    } else if (!previa && A.silencio) { A.silencio = false; poner({ k: 'silencio-fin' }); }   // 4.10.1: si no hay ataque (ya no salen noches) el silencio se rompía sólo con la llegada: quedaba pegado

    // el silencio raro: los últimos segundos de la previa, todo se calla
    if (previa && perfil.silencio && !A.silenciado && (e.f ?? 0) >= perfil.silencio.f) {
      A.silenciado = true; A.silencio = true; A.tSilencio = 0;
      poner({ k: 'silencio' });
    }
    // 4.10.1: con «Hora de tu reloj» la previa dura una hora y el silencio (por fracción) duraba minutos: tope de 14 s
    if (A.silencio) { A.tSilencio = (A.tSilencio || 0) + dt; if (A.tSilencio > 14) { A.silencio = false; poner({ k: 'silencio-fin' }); } }
    const callado = A.silencio;          // en el silencio no suena nada nuevo

    // ramas que crujen lejos: en la previa (desde un tercio) y de noche
    const quiereCrujir = previa ? (e.f ?? 0) > 0.3 : (oscuro && (ataque || e.fase === 'calma'));
    if (perfil.crujidos && quiereCrujir && !callado) {
      A.proxCrujido -= dt * ((e.vivos ?? 0) > 0 || previa ? 1 : 0.5);
      if (A.proxCrujido <= 0) {
        A.proxCrujido = sorteo(perfil.crujidos);
        poner({ k: 'crujido', dist: 24 + azar() * 52, doble: azar() < 0.25 });
      }
    }

    // risitas: una secuencia son dos o tres, a unos segundos una de otra, todas desde el mismo rumbo
    if (cola.length) {
      for (const p of cola) p.t -= dt;
      while (cola.length && cola[0].t <= 0 && !callado) {
        const p = cola.shift();
        poner({ k: 'risa', dist: p.dist, sec: p.sec, idx: p.idx, n: p.n, modo: p.modo, viejo: perfil.viejos });
      }
      if (callado) cola.length = 0;
    }
    const quiereReir = previa ? (e.f ?? 0) > 0.45 : (oscuro && ataque);
    if (perfil.risitas && quiereReir && !callado && !cola.length) {
      A.proxRisita -= dt;
      if (A.proxRisita <= 0) {
        A.proxRisita = sorteo(perfil.risitas.cada);
        const modo = azar() < 0.6 ? 'acercan' : 'alejan', n = entero(perfil.risitas.n), sec = ++A.secuencias;
        let dist = modo === 'acercan' ? 66 + azar() * 26 : 34 + azar() * 20, t = 0;
        for (let i = 0; i < n; i++) {
          cola.push({ t, dist, sec, idx: i, n, modo });
          t += 1.8 + azar() * 1.4;
          dist = modo === 'acercan' ? Math.max(14, dist - (11 + azar() * 6)) : dist + (13 + azar() * 8);
        }
      }
    }

    // ojos entre los árboles: sólo con la noche cerrada y sin pasarse de `max` a la vez
    if (perfil.ojos && ataque && cerrada && !callado && A.tAtaque >= perfil.ojos.desde) {
      A.proxOjo -= dt;
      if (A.proxOjo <= 0) {
        A.proxOjo = sorteo(perfil.ojos.cada);
        if ((e.ojos ?? 0) < perfil.ojos.max) poner({ k: 'ojo', vida: sorteo(perfil.ojos.vida), dist: sorteo(perfil.ojos.dist) });
      }
    }

    // se oye al duende de verdad (niebla, luna llena): sólo si hay uno en el rango
    if (perfil.oirDuendes && ataque && (e.vivos ?? 0) > 0 && (e.cerca ?? 99) > perfil.oirDuendes.desde && !callado) {
      A.proxOir -= dt;
      if (A.proxOir <= 0) {
        A.proxOir = sorteo(perfil.oirDuendes.cada);
        poner({ k: 'oirDuende', modo: azar() < 0.55 ? 'pasos' : azar() < 0.5 ? 'risa' : 'respiro' });
      }
    }

    // la pista de la tarde: en la previa (de un cuarto a tres cuartos), cada tanto el perro gruñe o suena algo del lado por donde van a entrar
    if (previa && e.hayLado && !callado && (e.f ?? 0) > 0.2 && (e.f ?? 0) < 0.78) {
      A.proxPista -= dt;
      if (A.proxPista <= 0) { A.proxPista = 9 + azar() * 7; poner({ k: 'pista', perro: azar() < 0.55 }); }
    }

    // algo se lleva una antorcha: una vez, cuando el mundo dice que hay una lejos y fuera de la vista
    if (perfil.antorcha && ataque && cerrada && !A.antorcha && !callado && A.tAtaque >= perfil.antorcha.desde && e.antorchaLista) {
      A.antorcha = true;
      poner({ k: 'antorcha' });
    }
    return salida;
  };
  return A;
}

// ---------------------------------------------------------------- geometría de lo que se oye y se ve
// Un punto a `dist` metros del jugador, hacia `rumbo` (radianes; 0 = +z, como el resto del juego: atan2(dx, dz)).
export function puntoA(jugador, rumbo, dist) {
  return { x: jugador.x + Math.sin(rumbo) * dist, z: jugador.z + Math.cos(rumbo) * dist };
}
export function rumboA(desde, hacia) { return Math.atan2(hacia.x - desde.x, hacia.z - desde.z); }

// El par de ojos que se mira se apaga: la regla de siempre de la oscuridad. «Mirarlo» es tenerlo en el centro de la vista (a menos de unos
// 20 grados de adonde apuntás), no en cualquier lado de la pantalla: si no, se apagarían apenas los ves de reojo.
export const CENTRO_VISTA = 0.94;   // coseno
export function enElCentro(mira, desde, hacia, cos = CENTRO_VISTA) {
  const dx = hacia.x - desde.x, dz = hacia.z - desde.z, d = Math.hypot(dx, dz), m = Math.hypot(mira.x, mira.z);
  if (!d || !m) return false;
  return (mira.x * dx + mira.z * dz) / (d * m) > cos;
}
// Devuelve cuánto tiempo seguido lo miraste, ya acumulado.
export const MIRADA_APAGA = 1.4;
export function seguirMirada(acumulado, mirando, dt) { return mirando ? acumulado + dt : Math.max(0, acumulado - dt * 2); }
export function ojosSeApagan(acumulado, distancia) { return acumulado >= MIRADA_APAGA * (distancia < 30 ? 0.6 : 1); }
// brillo de un par de ojos en su vida: se abren de a poco, parpadean una vez y se cierran
export function brilloOjos(edad, vida, apagando = 0) {
  if (!(vida > 0)) return 0;
  const a = suave(edad, 0, 0.9) * (1 - suave(edad, vida - 0.9, vida));
  const parpadeo = (edad > vida * 0.45 && edad < vida * 0.45 + 0.16) ? 0.05 : 1;
  return a * parpadeo * (1 - limitar(apagando, 0, 1));
}

// ---------------------------------------------------------------- niebla y luna
// La niebla de la noche de niebla sube despacio (casi una hora de juego) y se levanta de a poco al alba. Cuánto sube la densidad
// del cielo (`cielo.actualizar`, 4º parámetro); la densidad base es ~0.002, así que 0.03 se ve a unas decenas de metros.
export const NIEBLA_MAX = 0.03;
export const VELOCIDAD_NIEBLA = { sube: 1 / 85, baja: 1 / 55 };
export const VELOCIDAD_LUNA = { sube: 1 / 70, baja: 1 / 45 };
export function acercar(actual, objetivo, dt, v) {
  const paso = (objetivo > actual ? v.sube : v.baja) * dt;
  return Math.abs(objetivo - actual) <= paso ? objetivo : actual + Math.sign(objetivo - actual) * paso;
}
// `vista` es lo que dice `efectoClima` (1 = despejado; con lluvia o nubes baja): el clima de verdad ya acorta la vista, la niebla
// de la noche no se suma entera encima.
export function nieblaExtra(k, vista = 1) { return limitar(k, 0, 1) * NIEBLA_MAX * (1 - (1 - limitar(vista, 0.45, 1)) * 0.6); }
export function objetivoNiebla(especial) { return especial === 'niebla' ? 1 : 0; }
export function objetivoLuna(especial) { return especial === 'lunallena' ? 1 : 0; }

// La luna llena que alumbra el valle: más luz, más fría, y más baja (sombras largas). `k` es 0..1.
export const LUNA_LLENA = { luz: 1.0, bajaA: 0.27, frio: 0.55, ambiente: 0.4 };
export function lunaLlenaLuz(k) { return 1 + LUNA_LLENA.luz * limitar(k, 0, 1); }
export function lunaLlenaAltura(y, k) { return y + (Math.min(y, LUNA_LLENA.bajaA) - y) * limitar(k, 0, 1); }

// Las sombras largas de las antorchas: un cuerpo cerca de una antorcha prendida proyecta su sombra hacia el lado contrario, más larga
// cuanto más cerca de la llama. `alto` es lo alto del cuerpo; devuelve { largo, ancho, alfa } (0 si la luz no llega).
export const SOMBRA_ANTORCHA = { alcance: 13, maxLargo: 7.5 };
export function sombraDeAntorcha(distancia, alto = 1.7, noche = 1) {
  const R = SOMBRA_ANTORCHA.alcance;
  if (!(distancia > 0.4) || distancia >= R || noche < 0.3) return { largo: 0, ancho: 0, alfa: 0 };
  const cerca = 1 - distancia / R;
  // en los últimos 4 m del alcance se achica a nada: no aparece ni desaparece de golpe
  const borde = suave(R - distancia, 0, 4);
  const largo = Math.min(SOMBRA_ANTORCHA.maxLargo, alto * (0.9 + 5.2 * cerca * cerca + 1.3 * cerca)) * borde;
  return { largo, ancho: (0.5 + alto * 0.1) * borde, alfa: limitar(0.12 + 0.34 * cerca, 0, 0.5) * limitar((noche - 0.3) / 0.4, 0, 1) };
}

// ---------------------------------------------------------------- los animales que avisan
// Los puestos son lugares fijos del valle donde viven: los teros en los bajos mojados, las vacas en el pastizal. Cuando un duende
// pasa cerca, gritan o mugen (cada uno con su espera) y los pájaros alrededor tuyo se callan.
export const FAUNA = {
  tero: { alcance: 52, espera: 30, despues: 0.9 },     // el tero grita antes que nada: avisa de lejos
  vaca: { alcance: 64, espera: 48, despues: 1.4 },     // la vaca muge más tarde y más espaciado
  aves: { alcance: 60, calla: 10 },                    // los pájaros alrededor tuyo callan mientras haya duendes a esta distancia
};
// `cerca`: la distancia al duende vivo más cercano a ese puesto; `desdeUltimo`: segundos desde que avisó. Devuelve true si avisa ahora.
export function avisaElPuesto(tipo, cerca, desdeUltimo, noche = 1) {
  const F = Object.hasOwn(FAUNA, tipo) ? FAUNA[tipo] : null;
  if (!F || !F.espera || noche < 0.3) return false;
  return cerca < F.alcance && desdeUltimo >= F.espera;
}
export function avesCallan(distMasCercano) { return distMasCercano < FAUNA.aves.alcance; }
// de qué lado de la noche está la hora (para pruebas y para el mundo)
export const esDeNoche = (horas) => horas >= HORA_ATAQUE - 0.5 || horas < HORA_AMANECER;
