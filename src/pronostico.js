// 2.1: el tiempo que se ve venir.
//
// En la cordillera el mal tiempo entra del oeste: primero se cubren los cerros, después
// baja el viento frío y recién entonces llueve. El que vive acá mira para ese lado y
// sabe. Ahora el juego decide el tiempo que viene con anticipación: las nubes se ven
// asomar sobre la cordillera una o dos horas antes, los vecinos lo anuncian cuando los
// saludás, y el diario anota si acertaron.
//
// Puro. El cielo lo dibuja `cielo.js`; el clima lo decide `clima.js`.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Los segundos de reloj que faltan, pasados a horas del juego.
export function horasHasta(segundos, minutosPorDia = 30) {
  const m = Number(minutosPorDia) > 0 ? Number(minutosPorDia) : 30;
  return (segundos / (m * 60)) * 24;
}

export const ANTICIPO = 2.5;   // horas de juego: desde cuándo se ve venir

// Cuánto se ve el frente sobre la cordillera (0 a 1): nada si no cambia o si falta
// mucho; crece a medida que se acerca. La lluvia se ve más cargada que un nublado.
export function frente(actual, proximo, horas) {
  if (!proximo || proximo === actual || proximo === 'despejado') return 0;
  const k = clamp(1 - horas / ANTICIPO, 0, 1);
  return k * (proximo === 'lluvia' ? 1 : 0.55);
}

// Lo que dice cada vecino. Cada uno a su manera: Don Ramón mira los cerros, Nicanor el
// lago, Josefina el cielo, Elsa el humo de la locomotora.
const FRASES = {
  lluvia: {
    ramon: ['Mirá cómo se tapó el cerro. A la tarde se larga, acordate de lo que te digo.', 'Se viene agua del lado de la cordillera. Guardá la leña.'],
    nicanor: ['El lago se puso quieto y oscuro. Ésa es lluvia, en un rato.', 'Las truchas están saltando como locas: se viene agua.'],
    ema: ['Hay un frente entrando por el oeste. En un par de horas llueve.', 'Esas nubes sobre los cerros no son de paso: va a llover.'],
    guarda: ['El humo de la máquina se va para abajo. Llueve, seguro.', 'Hoy la trochita va a volver mojada.'],
    ercilia: ['Me duelen las rodillas. Va a llover, ya vas a ver.', 'Traé la ropa del tendal, que se viene.'],
  },
  nublado: {
    ramon: ['Se está cerrando del oeste. No creo que llueva, pero el sol se va.'],
    nicanor: ['Se nubla. Para pescar, mejor: la trucha se anima.'],
    ema: ['Viene un nublado. Buena luz para sacar fotos, sin sombras duras.'],
    guarda: ['Se pone gris. Nada que preocupe.'],
    ercilia: ['Se viene un día gris, de esos para la estufa.'],
  },
  despejado: {
    ramon: ['Esto para enseguida: mirá el claro que se abre sobre el lago.'],
    nicanor: ['Ya afloja. Detrás del cerro se ve el celeste.'],
    ema: ['El frente ya pasa. En un rato sale el sol.'],
    guarda: ['Se está limpiando. Mañana la vía amanece seca.'],
    ercilia: ['Ya para, ya para. Esperá un ratito adentro.'],
  },
};

// Lo que dice ahora (o null si no hay nada que anunciar). `actual` es el tiempo que
// hay, `proximo` el que viene, `horas` las que faltan para el cambio.
export function frasePronostico(quien, actual, proximo, horas, azar = Math.random) {
  if (!proximo || proximo === actual || horas > ANTICIPO + 1) return null;
  // que pare sólo se anuncia si está lloviendo o nublado
  if (proximo === 'despejado' && actual === 'despejado') return null;
  const lista = FRASES[proximo]?.[quien];
  if (!lista?.length) return null;
  return lista[Math.floor(azar() * lista.length) % lista.length];
}

// ¿Acertó? Se mira al cerrar el día: si anunció lluvia, que haya llovido después.
export function acerto(pronostico, lluviaDespues) {
  if (!pronostico) return null;
  if (pronostico.proximo === 'lluvia') return lluviaDespues > 0.35;
  if (pronostico.proximo === 'despejado') return lluviaDespues < 0.35;
  return true;
}
