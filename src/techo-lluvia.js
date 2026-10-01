// 2.0: la lluvia sobre el techo, y cómo suena estar adentro.
//
// Hasta la 1.9, bajo techo la lluvia era la misma de afuera con la mitad de volumen.
// Pero lo que se escucha de verdad bajo un techo no es la lluvia: es el techo. Cada
// gota es un golpe, y el golpe suena al material que recibe:
//
//   · la chapa repiquetea: golpes agudos y metálicos que zumban un instante;
//   · las tablas tamborilean sordo, más grave y mucho más apagado;
//   · la lona de la carpa es un parche: golpecitos secos, cercanos, casi en la oreja.
//
// Y abajo de los golpes, la cama: el rumor parejo de miles de gotas que no se
// distinguen, que en la chapa es un siseo alto y en la madera un murmullo grave.
//
// Lo otro es el espacio (ver ESPACIOS). Las paredes cortan el viento y se comen los
// agudos de afuera; una carpa casi no corta nada; un alero sin paredes deja pasar el
// viento pero ya no la lluvia en la cara. Todo lo puro vive acá; el motor lo arma en
// `sonido.js` con los golpes de `impactos.js`.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Cada techo: con qué material golpea la gota, cuántas gotas por segundo con lluvia
// fuerte, el rango de tamaños, y la cama que suena debajo de los golpes.
export const TECHOS = {
  chapa: {
    material: 'chapa', porSegundo: 30, tamaño: [0.45, 1.25], dureza: [0.7, 1], vol: 0.2,
    cama: { frec: 3600, q: 0.55, vol: 0.13 }, grave: { frec: 180, vol: 0.05 },
  },
  tablas: {
    material: 'tabla', porSegundo: 16, tamaño: [1.4, 2.6], dureza: [0.15, 0.4], vol: 0.26,
    cama: { frec: 950, q: 0.7, vol: 0.1 }, grave: { frec: 140, vol: 0.09 },
  },
  lona: {
    material: 'lona', porSegundo: 24, tamaño: [0.7, 1.3], dureza: [0.5, 0.9], vol: 0.32,
    cama: { frec: 1500, q: 0.6, vol: 0.14 }, grave: { frec: 110, vol: 0.07 },
  },
};

// Los techos del mapa. El refugio, las casas, el almacén y la estación son de chapa,
// como casi todo lo que se techa en la cordillera; el molino es de tablas.
export const TECHO_DE_LUGAR = {
  refugio: 'chapa', cabana: 'chapa', puesto: 'chapa', 'casa-te': 'chapa', almacen: 'chapa',
  galpon: 'chapa', estacion: 'chapa', molino: 'tablas',
};

// Lo que construye el jugador: todo es de tablas, salvo el techo a una agua, que es
// la cubierta de chapa de las casas nuevas de campo.
export function techoDeObra(planoId, cubiertaId) {
  if (cubiertaId === 'techo-una-agua' || planoId === 'techo-una-agua') return 'chapa';
  return 'tablas';
}

// Cómo suena cada espacio. `lluvia` y `viento` multiplican las camas de afuera,
// `filtro` es hasta dónde llegan los agudos del ambiente, `reverb` cuál de las tres
// salas se usa, y `cruje` cuánto trabaja la estructura con las rachas.
export const ESPACIOS = {
  bosque: { lluvia: 1, viento: 1, hojas: 1, filtro: 19000, reverb: 'bosque', cruje: 0 },
  // bajo un alero, un leñero o una galería: el viento pasa, la lluvia cae al costado
  alero: { lluvia: 0.62, viento: 0.85, hojas: 0.8, filtro: 9000, reverb: 'bosque', cruje: 0.3 },
  // la carpa: una tela no aísla nada, pero la lluvia de afuera queda tapada por la del techo
  carpa: { lluvia: 0.55, viento: 0.72, hojas: 0.7, filtro: 5200, reverb: 'bosque', cruje: 1 },
  // entre cuatro paredes: el viento es un rumor, la lluvia de afuera casi no llega
  adentro: { lluvia: 0.22, viento: 0.3, hojas: 0.12, filtro: 1900, reverb: 'adentro', cruje: 0.7 },
  cueva: { lluvia: 0.12, viento: 0.2, hojas: 0, filtro: 1400, reverb: 'cueva', cruje: 0 },
};
export function espacioDe(nombre) { return ESPACIOS[nombre] || ESPACIOS.bosque; }

// En invierno lo que cae es nieve, y la nieve no suena sobre ningún techo.
export function lluviaQueSuena(lluvia, invierno) {
  return clamp(lluvia || 0, 0, 1) * (invierno > 0.5 ? 0 : 1 - clamp(invierno, 0, 0.5) * 0.6);
}

// Cuántas gotas suenan en este cuadro. La lluvia fina es de gotas sueltas, que se
// cuentan; la fuerte, un redoble. El tope por cuadro cuida el presupuesto de audio:
// lo que no entra como golpe lo cubre la cama.
export const GOTAS_POR_CUADRO = 4;
export function gotasEnCuadro(techo, lluvia, dt, azar = Math.random) {
  const T = TECHOS[techo];
  if (!T || !(lluvia > 0.04) || !(dt > 0)) return 0;
  const esperadas = T.porSegundo * Math.pow(lluvia, 1.3) * Math.min(dt, 0.25);
  return Math.min(GOTAS_POR_CUADRO, Math.floor(esperadas + azar()));
}

// Una gota. Las grandes caen menos y pegan más fuerte; ninguna suena igual a otra.
export function gota(techo, azar = Math.random) {
  const T = TECHOS[techo];
  if (!T) return null;
  const g = azar();
  const [t0, t1] = T.tamaño, [d0, d1] = T.dureza;
  return {
    material: T.material,
    tamaño: t0 + (t1 - t0) * azar(),
    dureza: d0 + (d1 - d0) * azar(),
    // la mayoría son gotitas; una de cada tanto es un goterón que se escucha solo
    fuerza: 0.35 + g * g * 0.9,
    vol: T.vol * (0.55 + azar() * 0.45),
    // de qué lado del techo cayó: la lluvia rodea, no sale de un punto
    lado: azar() * 2 - 1,
  };
}

// La cama del techo, según cuánto llueve.
export function camaDeTecho(techo, lluvia) {
  const T = TECHOS[techo];
  if (!T) return { vol: 0, grave: 0, frec: 1000, q: 0.7, frecGrave: 150 };
  const l = clamp(lluvia, 0, 1);
  return { vol: T.cama.vol * Math.pow(l, 1.1), grave: T.grave.vol * l, frec: T.cama.frec, q: T.cama.q, frecGrave: T.grave.frec };
}

// ¿Cruje la estructura? Con las rachas fuertes, la madera trabaja y la lona flamea.
// Devuelve la probabilidad por segundo.
export function crujidosPorSegundo(espacio, viento) {
  const E = espacioDe(espacio);
  const v = clamp(viento, 0, 1.5);
  if (!E.cruje || v < 0.35) return 0;
  return E.cruje * (v - 0.35) * 0.9;
}
