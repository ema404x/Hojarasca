// 3.8.4: el alero del arriero (DECISIONES_3_8_4.md, decisión 32). La Cueva de las Manos pasó a ser un alero donde
// hacían noche los arrieros que cruzaban la hacienda a Chile (lo de verdad está en estructuras.js: la pirca, el
// fogón renegrido, la pared tallada y la herradura). Y una historia chica, pedida por el usuario: uno de los nombres
// tallados es el del abuelo de Martín Sepúlveda, el maquinista del taller del tren. Martín te pide que se lo busques
// y, cuando lo encontrás, te cuenta de su abuelo arriero.
//
// Módulo puro (se prueba en Node): el estado de la historia, lo que se ofrece en la charla con Martín, lo que dice y
// cuándo se encuentra el nombre. Lo de la pantalla lo hace main.js (la nota, la amistad, el guardado) con lo que
// devuelve esto, a través de vecindad-juego.js (`ctx.alero`).
//
// El estado, en la partida (`progreso.aleroArriero`, sólo en el Relax): { paso, dia }
//   paso 0: Martín todavía no te pidió nada · 1: te lo pidió · 2: encontraste el nombre · 3: ya te contó.
//   dia: el día del último paso.

export const PASOS_ALERO = ['nada', 'pedido', 'encontrado', 'contado'];
export const QUIEN_PIDE = 'martin';
// a cuántos metros del nombre tallado (en el piso del alero) se lo encuentra
export const RADIO_NOMBRE = 2.4;
// la amistad que suma que le cuentes que lo encontraste (como una ayuda grande)
export const AMISTAD_ALERO = 12;
// lo tallado: lo dice el cuaderno, la nota y lo que lee Martín (y está en la pared, ver estructuras.js)
export const NOMBRE_ABUELO = 'Fermín Sepúlveda';
export const TALLADO_ABUELO = 'Fermín Sepúlveda 1927';
export const TALLADO_FAMILIA = 'Los Sepúlveda pasaron acá';

export const TITULOS_ALERO = {
  pedir: '¿Sos de familia ferroviaria?',
  recordar: 'Lo del nombre de tu abuelo',
  contar: 'Encontré el nombre de tu abuelo',
};

// Lo que dice Martín (cada renglón es una parte de la charla, se pasa con E).
export const DICHOS_ALERO = {
  // te lo pide
  pedir: [
    '¿Ferroviaria? No, qué va. El primero de los Sepúlveda que se subió a un tren fui yo, y de pura casualidad. Los de antes eran de a caballo. Mi abuelo Fermín era arriero: llevaba tropas de vacunos de la hacienda a Chile, por los pasos de la cordillera, cuando todavía no había ni ruta ni aduana que valiera.',
    'De chico me sentaba en las rodillas y me contaba que, cruzando, hacían noche en un alero de piedra, con una pirca para el viento y el fogón prendido toda la noche. Y que antes de seguir viaje cada uno tallaba su nombre en la roca con la punta del cuchillo. Él también. «Para que alguien sepa que pasé», decía.',
    'Yo nunca fui. Primero el trabajo, después las rodillas, y después ya me daba un poco de miedo no encontrarlo y que fuera un cuento de viejo. Vos que andás todo el valle… Mi abuelo decía que su nombre está tallado en ese alero. ¿Me lo buscás? Tiene que decir Sepúlveda.',
  ],
  // te lo recuerda (con el rumbo, si se sabe: «a 600 m al noroeste»)
  recordar: [
    'Un alero de piedra en una ladera empinada, lejos del sendero, con una pirca adelante. Mi abuelo lo contaba así; el resto lo inventa la memoria de uno.',
    'Si te sirve: desde la aldea queda {rumbo}. Tiene que decir Sepúlveda. Y si dice otra cosa, venite igual, que algo me vas a contar.',
  ],
  recordarSinRumbo: 'Si te sirve: queda lejos de todo, donde no llega ni el tren. Tiene que decir Sepúlveda. Y si dice otra cosa, venite igual, que algo me vas a contar.',
  // le contás que lo encontraste: la historia del abuelo
  contar: [
    '¿Lo encontraste? ¿«Fermín Sepúlveda, 1927»? ¿Y «Los Sepúlveda pasaron acá»? Esperá, que me tengo que sentar. Era cierto, nomás. El viejo no mentía.',
    'Fermín nació en un puesto de la cordillera, del lado de acá. A los doce ya arreaba con su padre; a los veinte era capataz de tropa: cuatrocientas cabezas, seis peones, una tropilla de mulas cargueras y un perro overo que se llamaba Chiflido, porque contestaba al silbido antes que nadie. Cruzaban en enero, cuando se abría el paso, y volvían en marzo, antes de la primera nevada.',
    'El alero era la última parada de este lado. Ahí se hacía noche, se herraba lo que venía rengo y se contaba la hacienda dos veces. Mi abuelo decía que la primera noche nadie dormía: se hablaba bajito alrededor del fogón, por el ruido del viento en la piedra, y los más viejos contaban cosas de la cordillera para asustar a los nuevos.',
    'En el 27 los agarró una nevada en el paso, tres días. Perdieron veinte animales y una mula con la carga, y a la vuelta mi abuelo talló el nombre con la fecha. Decía que era para acordarse de que se puede volver. La herradura de la pared, contaba, era de esa mula: la clavaron ahí porque ya no les servía a ellos y le podía servir al que viniera.',
    'Cuando cerraron los pasos y vino el camión, se quedó sin oficio. Se hizo puestero, crió a mi padre y nunca más cruzó. Pero en invierno, cuando nevaba, se paraba en la puerta a mirar la cordillera y decía: «Allá arriba está mi nombre». Yo era chico y pensaba que hablaba de las nubes.',
    'Y mirá vos: cuarenta años manejando un tren por la meseta, contando durmientes, y el que me lleva hasta el nombre de mi abuelo es un vecino que anda a pie. Gracias, de verdad. Un día de estos, si las rodillas me dejan, me llevás. Y el mate lo pongo yo.',
  ],
};

// Lo que avisa el juego al encontrarlo.
export const NOTA_ENCONTRADO = { titulo: `«${TALLADO_ABUELO}»`, sub: 'Encontraste el nombre del abuelo de Martín. Contáselo en el taller del tren' };
// Lo que queda en el diario del día en que te lo cuenta («Me contaron lo de …», ver diario.js)
export const DIARIO_ALERO = 'Fermín Sepúlveda, el abuelo arriero de Martín';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, piso = 0, techo = 1e6) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(piso, Math.min(techo, n)) : piso; };

export function aleroNuevo() { return { paso: 0, dia: 0 }; }
// Un guardado roto, retocado o de antes no rompe nada (una partida vieja arranca en 0).
export function sanearAlero(x) {
  if (!objeto(x)) return aleroNuevo();
  return { paso: entero(x.paso, 0, PASOS_ALERO.length - 1), dia: entero(x.dia, 0) };
}
const estadoDe = (p) => (objeto(p?.aleroArriero) ? p.aleroArriero : null);

// Lo que se ofrece al charlar con alguien: [{ id, titulo }]. `hayAlero`: si en este valle está el alero (si el sorteo
// no le encontró lugar, Martín no pide nada).
export function opcionesAlero(progreso, clave, { hayAlero = true } = {}) {
  if (clave !== QUIEN_PIDE || !hayAlero) return [];
  const e = estadoDe(progreso) || aleroNuevo();
  if (e.paso === 0) return [{ id: 'alero:pedir', titulo: TITULOS_ALERO.pedir }];
  if (e.paso === 1) return [{ id: 'alero:recordar', titulo: TITULOS_ALERO.recordar }];
  if (e.paso === 2) return [{ id: 'alero:contar', titulo: TITULOS_ALERO.contar }];
  return [];
}

// Elegir una opción. Devuelve { renglones, paso (el nuevo), amistad (cuánto suma), diario (o null) } o null si no
// corresponde. Cambia `progreso.aleroArriero`. `rumbo`: desde la aldea hasta el alero («a 600 m al noroeste»).
export function elegirAlero(progreso, id, { dia = 1, rumbo = null } = {}) {
  if (!objeto(progreso)) return null;
  const e = progreso.aleroArriero = sanearAlero(progreso.aleroArriero);
  const d = entero(dia, 1);
  if (id === 'alero:pedir' && e.paso === 0) {
    e.paso = 1; e.dia = d;
    return { renglones: [...DICHOS_ALERO.pedir], paso: 1, amistad: 0, diario: null };
  }
  if (id === 'alero:recordar' && e.paso === 1) {
    const r = typeof rumbo === 'string' && rumbo ? DICHOS_ALERO.recordar[1].replace('{rumbo}', rumbo) : DICHOS_ALERO.recordarSinRumbo;
    return { renglones: [DICHOS_ALERO.recordar[0], r], paso: 1, amistad: 0, diario: null };
  }
  if (id === 'alero:contar' && e.paso === 2) {
    e.paso = 3; e.dia = d;
    return { renglones: [...DICHOS_ALERO.contar], paso: 3, amistad: AMISTAD_ALERO, diario: DIARIO_ALERO };
  }
  return null;
}

// ¿Lo encontró? Con el pedido hecho y el jugador parado delante del nombre (`cerca`: metros hasta el punto del piso
// frente al nombre tallado). Devuelve la nota (y pasa al paso 2) o null.
export function buscarNombre(progreso, cerca, dia = 1) {
  const e = estadoDe(progreso);
  if (!e || e.paso !== 1 || !(Number(cerca) <= RADIO_NOMBRE)) return null;
  e.paso = 2; e.dia = entero(dia, 1);
  return NOTA_ENCONTRADO;
}

// En el juego: lo que main.js le pasa a vecindad-juego.js como `ctx.alero` (las opciones y lo que se elige) y lo que
// mira en cada cuadro (`actualizar`: si estás delante del nombre). `ctx`: { progreso(), desafio(), lugar() (el
// alero: T.lugares.cueva, con `sepulveda`), rumbo() (desde la aldea, o null), jugador() (la posición), sumarAmistad(k,
// n), diario(dato), nota(titulo, sub, nueva), guardar() }.
export function crearAleroJuego(ctx) {
  const progreso = () => ctx.progreso?.() || null;
  const dia = () => Math.max(1, Math.floor(Number(progreso()?.dia) || 1));
  let espera = 0;
  return {
    opciones(clave) {
      if (ctx.desafio?.()) return [];
      return opcionesAlero(progreso(), clave, { hayAlero: !!ctx.lugar?.()?.sepulveda });
    },
    // (la forma de vecindad-juego.js: { tipo: 'renglones', renglones } o { tipo: 'menu' })
    elegir(_s, id) {
      const p = progreso();
      const r = elegirAlero(p, id, { dia: dia(), rumbo: ctx.rumbo?.() || null });
      if (!r) return { tipo: 'menu' };
      if (r.amistad) ctx.sumarAmistad?.(QUIEN_PIDE, r.amistad);
      if (r.diario) ctx.diario?.(r.diario);
      ctx.guardar?.();
      return { tipo: 'renglones', renglones: r.renglones };
    },
    // cada medio segundo, con el pedido hecho: ¿estás delante del nombre?
    actualizar(dt) {
      espera -= Number(dt) || 0;
      if (espera > 0) return null;
      espera = 0.5;
      const p = progreso(), l = ctx.lugar?.(), j = ctx.jugador?.();
      if (ctx.desafio?.() || !p || p.aleroArriero?.paso !== 1 || !l?.sepulveda || !j) return null;
      const nota = buscarNombre(p, Math.hypot(j.x - l.sepulveda.x, j.z - l.sepulveda.z), dia());
      if (nota) { ctx.nota?.(nota.titulo, nota.sub, true); ctx.guardar?.(); }
      return nota;
    },
  };
}
