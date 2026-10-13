// 3.9.2 · LA CASA DE TÉ IGUAL QUE LA CANTINA: las reglas propias (módulo puro, se prueba en Node). Ceinwen Evans, la galesa, viene caminando a tu mesa,
// te muestra la carta de tés y tortas galesas, se paga igual que en la cantina (pesos, trueque o la cuenta) y trae la bandeja con la tetera y la taza. Todo lo demás
// (la visita, la carta, el cobro, el sorbo, levantar la mesa) lo comparte con la cantina: cantina.js (las reglas generales) y cantina-juego.js (el flujo).
// Lo que hay acá: la carta de la casa de té (tés y tortas, que cambian con la estación, el tiempo y lo que produce la aldea), el horario, el lugar (las seis sillas y
// por dónde camina ella), lo que dice y el saludo. Sin inglés todavía (a pedido del usuario): los textos nuevos están listados en CAMBIOS_3_9_2C.md.
import { eleg } from './cantina.js';
import { diaSemanaDe } from './aldea.js';

export const NOMBRE_GALESA = 'Ceinwen';
// Atiende cuando está en la galería o en la cocina: de 9 (hornea) a 20 (cuando la galería se queda sin gente). El resto del día anda en otras cosas: «sola»
export const HORARIO_CASA_TE = { abre: 9, cierra: 20 };
export const casaTeAbierta = (hora) => { const h = (((Number(hora) || 0) % 24) + 24) % 24; return h >= HORARIO_CASA_TE.abre && h < HORARIO_CASA_TE.cierra; };

// ---------------------------------------------------------------- el lugar
// En el marco de la ESTRUCTURA (el de PUNTOS_ESTRUCTURA de aldea.js y el de estructuras.js: el centro del cuerpo de 6,4 × 5,2, la puerta al frente en +z, la galería
// de z 2,7 a 5,3 con dos mesas redondas en x ±1,9 y, adentro, las dos mesas del salón en x ±1,3, z 1,0; la cocina, al fondo a la derecha). `dz`: lo que
// hay que sumar a la z para pasar al marco del edificio de la aldea (la estructura no está en el centro del plano: aldea.js, `estructura.dz`).
// Las seis sillas son las de verdad (las de estructuras.js: `sentaderos`; la prueba de la partida real las compara): afuera una por mesa (la de afuera;
// la otra queda de adorno) y adentro, las cuatro del salón. `servicio`: donde ella se para a dejar la bandeja, mirando la mesa. `fin`: hasta qué nodo
// de la cadena va antes de ir a la mesa; `extra`: lo que falta de ahí. `alto`: la altura del mantel sobre el terreno del edificio.
export const CASA_TE = {
  dz: -2,
  barra: { x: 1.6, z: -0.8 },   // donde hornea y prepara el té (el punto `cocina` de aldea.js)
  paso: [{ x: 0.5, z: -0.3 }, { x: 0.0, z: 0.9 }, { x: 0.0, z: 2.1 }, { x: 0.0, z: 3.3 }],   // de la cocina al medio del salón (entre las mesas), la puerta y la galería
  mesas: [
    { id: 'mesa-1', x: -1.9, z: 4.0, alto: 0.99, fin: 3, extra: [{ x: -1.9, z: 4.9 }],
      sillas: [{ x: -2.41, z: 4.0, mira: Math.PI / 2 }], servicio: { x: -1.9, z: 4.9, rot: Math.PI } },
    { id: 'mesa-2', x: 1.9, z: 4.0, alto: 0.99, fin: 3, extra: [{ x: 1.9, z: 4.9 }],
      sillas: [{ x: 2.41, z: 4.0, mira: -Math.PI / 2 }], servicio: { x: 1.9, z: 4.9, rot: Math.PI } },
    { id: 'mesa-3', x: -1.3, z: 1.0, alto: 1.16, fin: 2, extra: [{ x: -1.0, z: 1.85 }],
      sillas: [{ x: -2.02, z: 1.0, mira: Math.PI / 2 }, { x: -0.58, z: 1.0, mira: -Math.PI / 2 }], servicio: { x: -1.0, z: 1.85, rot: Math.PI } },
    { id: 'mesa-4', x: 1.3, z: 1.0, alto: 1.16, fin: 2, extra: [{ x: 1.0, z: 1.85 }],
      sillas: [{ x: 0.58, z: 1.0, mira: Math.PI / 2 }, { x: 2.02, z: 1.0, mira: -Math.PI / 2 }], servicio: { x: 1.0, z: 1.85, rot: Math.PI } },
  ],
};
// El mismo plano en el marco del edificio (para `crearCantinaJuego`)
export function planoCasaTe() {
  const z = (q) => ({ ...q, z: q.z + CASA_TE.dz });
  return {
    barra: z(CASA_TE.barra), paso: CASA_TE.paso.map(z),
    mesas: CASA_TE.mesas.map((m) => ({ ...z(m), sillas: m.sillas.map(z), servicio: z(m.servicio), extra: m.extra.map(z) })),
  };
}

// ---------------------------------------------------------------- la carta
// Igual que la de la cantina (cantina.js): `forma` es lo que se ve en la mesa y en la bandeja (cantina-mundo.js). `registra`: la entrada del cuaderno que se anota
// al servirte (lo que antes daba «pedir algo en la casa de té»). Los tés vienen en tetera con su taza de sauce: cada sorbo es una taza.
export const CARTA_TE = [
  { id: 'te-gales', nombre: 'Té galés en tetera', tipo: 'bebida', precio: 180, porciones: 4, fuerte: false, caliente: true, descanso: 0.4, prepara: 7, forma: 'tetera', color: '#a8642a', registra: 'te-galesa', texto: 'Té negro bien cargado, en tetera con su cubretetera tejida y la taza de sauce. Con leche, si querés.' },
  { id: 'te-hierbas', nombre: 'Té de hierbas del valle', tipo: 'bebida', precio: 170, porciones: 4, fuerte: false, caliente: true, descanso: 0.4, prepara: 7, forma: 'tetera', color: '#9aa85a', texto: 'Manzanilla, menta y un poco de rosa mosqueta, de las que juntan en el valle. Suave y de los que calman.' },
  { id: 'te-especiado', nombre: 'Té especiado de invierno', tipo: 'bebida', precio: 210, porciones: 4, fuerte: false, caliente: true, descanso: 0.5, prepara: 8, forma: 'tetera', color: '#8a3a1a', texto: 'Té negro con canela, clavo y jengibre, humeando. Para los días que no entran en calor.' },
  { id: 'te-miel', nombre: 'Té con miel de la sala', tipo: 'bebida', precio: 220, porciones: 4, fuerte: false, caliente: true, descanso: 0.5, prepara: 7, forma: 'tetera', color: '#c8923a', texto: 'Té claro con una cucharada de la miel de la sala de la aldea, que se disuelve despacito.' },
  { id: 'te-helado', nombre: 'Té helado con limón', tipo: 'bebida', precio: 170, porciones: 3, fuerte: false, caliente: false, descanso: 0.2, prepara: 5, forma: 'jarra', color: '#c8a050', texto: 'Té fuerte, helado de la cueva, con limón y una ramita de menta. Para las tardes de calor.' },
  { id: 'cafe-leche', nombre: 'Café con leche', tipo: 'bebida', precio: 150, porciones: 3, fuerte: false, caliente: true, descanso: 0.3, prepara: 5, forma: 'taza', color: '#9a7048', texto: 'Cargado, con la leche espumada y un terrón de azúcar al costado. A la manera de la casa.' },
  { id: 'chocolate', nombre: 'Chocolate caliente', tipo: 'bebida', precio: 280, porciones: 3, fuerte: false, caliente: true, descanso: 0.5, prepara: 6, forma: 'taza', color: '#4a2a1a', registra: 'chocolate', texto: 'Espeso, con canela y crema por encima. Como lo hacen en Gaiman, dicen.' },
  { id: 'mate', nombre: 'Unos mates con bizcochitos', tipo: 'bebida', precio: 140, porciones: 4, fuerte: false, caliente: true, descanso: 0.3, prepara: 6, forma: 'mate', color: '#5a6a2a', registra: 'mate', texto: 'Una calabaza con su bombilla, la pava al lado y unos bizcochitos de grasa. Yo tomo té, pero la casa es de todos.' },
  { id: 'torta-negra', nombre: 'Torta negra galesa', tipo: 'comida', precio: 300, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 5, forma: 'torta-negra', color: '#3a2214', registra: 'te-galesa', texto: 'Frutas secas, especias y paciencia: un mes de reposo con un chorrito de licor. La receta de mi tatarabuela.' },
  { id: 'scones', nombre: 'Scones con crema y dulce', tipo: 'comida', precio: 260, porciones: 3, fuerte: false, caliente: true, descanso: 0.8, prepara: 6, forma: 'plato-scones', color: '#d8a050', texto: 'Tibios, partidos al medio, con crema de la lechería y dulce de frutilla. Se comen con las manos y sin culpa.' },
  { id: 'bara-brith', nombre: 'Bara brith con manteca', tipo: 'comida', precio: 240, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 5, forma: 'plato-bara', color: '#6a3a1e', texto: 'El pan moteado de pasas, que se remoja en el té la noche antes. Con manteca, nada más.' },
  { id: 'pan-jengibre', nombre: 'Pan de jengibre', tipo: 'comida', precio: 220, porciones: 3, fuerte: false, caliente: false, descanso: 0.6, prepara: 5, forma: 'plato-jengibre', color: '#8a5a2a', texto: 'Oscuro, picante y pegajoso, con su glasé blanco. Los muñequitos están ahí para que los mires un rato antes de comerlos.' },
  { id: 'welsh-cakes', nombre: 'Welsh cakes recién hechos', tipo: 'comida', precio: 230, porciones: 3, fuerte: false, caliente: true, descanso: 0.7, prepara: 6, forma: 'plato-welsh', color: '#c88a3a', texto: 'Tortitas de la plancha con pasas y azúcar por arriba. Se comen calientes, burlándose del reloj.' },
  { id: 'tarta-manzana', nombre: 'Tarta de manzana galesa', tipo: 'comida', precio: 320, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 6, forma: 'plato-tarta', color: '#b0603a', texto: 'Con las manzanas del valle, canela y la masa que se me quiebra sola. Con una cucharada de crema.' },
  { id: 'te-completo', nombre: 'El té completo (para uno)', tipo: 'bebida', precio: 650, porciones: 6, fuerte: false, caliente: true, descanso: 1.8, prepara: 12, forma: 'servicio-te', color: '#a8642a', registra: 'te-galesa', texto: 'La tetera con su taza y la torre de tres platos: scones, welsh cakes, bara brith y una rodaja de torta negra. Para una tarde entera.' },
];
export const ID_CARTA_TE = CARTA_TE.map((x) => x.id);
const FRIO_TE = (c) => c.estacion === 'invierno' || c.clima === 'nieve';
const LLUVIA_TE = (c) => c.clima === 'lluvia' || c.clima === 'nieve';
const CUANDO_TE = {
  'te-hierbas': (c) => !!c.prod?.herbolaria || c.estacion === 'verano',
  'te-especiado': (c) => FRIO_TE(c) || c.estacion === 'otono' || LLUVIA_TE(c),
  'te-miel': (c) => !!c.prod?.miel,
  'te-helado': (c) => c.estacion === 'verano' && !LLUVIA_TE(c),
  chocolate: (c) => FRIO_TE(c) || c.estacion === 'otono' || LLUVIA_TE(c),
  scones: (c) => !!c.prod?.leche || c.estacion !== 'verano' || !!c.prod?.panaderia,
  'tarta-manzana': (c) => !!c.prod?.fruta || c.estacion === 'otono',
  'welsh-cakes': (c) => !!c.prod?.panaderia || c.estacion !== 'verano',
};
// Lo de la aldea o tu campo que se nota en la carta: con la miel de la sala, el té de miel; con tu granja, la crema y la tarta; con la panadería, las tortitas
const TORTAS_DEL_DIA = ['torta-negra', 'scones', 'bara-brith', 'pan-jengibre', 'welsh-cakes', 'tarta-manzana'];
export function cartaTeDeHoy(c = {}) {
  const ctx = { estacion: c.estacion || 'verano', clima: c.clima || 'sol', locales: c.locales || {}, prod: c.prod || null, dia: Math.max(0, Math.floor(Number(c.dia) || 0)) };
  const lista = CARTA_TE.filter((x) => !CUANDO_TE[x.id] || CUANDO_TE[x.id](ctx)).map((x) => ({ ...x }));
  // la torta del día (diez por ciento menos): una distinta cada día, de las que están en carta
  if (ctx.dia) {
    const hay = TORTAS_DEL_DIA.filter((id) => lista.some((x) => x.id === id));
    const id = hay.length ? hay[ctx.dia % hay.length] : null;
    const x = id && lista.find((q) => q.id === id);
    if (x) { x.delDia = true; x.precio = Math.max(100, Math.round((x.precio * 0.9) / 10) * 10); }
  }
  return lista;
}
export const itemTe = (id) => CARTA_TE.find((x) => x.id === id) || null;

// ---------------------------------------------------------------- lo que dice Ceinwen
export const SALUDOS_TE = {
  nuevo: ['Prynhawn da, que es «buenas tardes» en la lengua de mis abuelos. Sentate donde quieras: la pava está siempre al fuego.', 'Una cara nueva en la casa de té. Soy Ceinwen. Pedí lo que quieras, cariad, que hoy hay torta negra recién cortada.'],
  // {0}: tu apodo en la aldea
  conocido: ['{0}, croeso. La silla de siempre te espera, y la pava, también.', '¡{0}! Justo ponía el agua. Sentate, que hoy te atiendo yo.'],
  conocidoSinApodo: ['Ah, vos. Volviste, y eso en esta casa es la mejor propina. Sentate.', 'Qué bueno verte de nuevo, cariad. Pasá, que se enfría el té.'],
  manana: 'Todavía estoy horneando, pero algo te puedo servir. El olor te lo regalo.',
  tarde: 'La hora del té de verdad: desde las tres la galería es la mejor mesa del valle.',
  atardecer: 'Se acaba la tarde y la torta, y todavía queda té para rato. Pedí ahora, que no sobra.',
  lluvia: 'Con esta lluvia no hay mejor lugar que éste. Escuchá cómo suena en el techo de chapa.',
  nieve: 'Nieva afuera. Acá adentro está la pava, el fuego y la torta negra. Elegí.',
  viento: 'Con este viento no hay galería que aguante. Adentro, junto al fuego, se está mejor.',
  frio: 'Qué frío hace. Arrimate al hogar y pedí algo que humee.',
  calor: 'Con este calor, nada como un té helado con limón. Lo saco de la cueva.',
  'trucha-grande': 'Dicen que sacaste una trucha enorme. En Gales también se cuentan esas historias; la diferencia es que acá las creen.',
  talar: 'Dicen que talaste un montón de árboles. Con tanta leña, el hogar de la casa de té se pone contento.',
  'obra-propia': 'Me dijeron que terminaste una obra tuya. Eso se festeja con té y con torta.',
  tren: 'Te vi bajar de la trochita. Los que llegan en tren siempre traen hambre de torta.',
  'aporte-obra': 'Dicen que le diste una mano al pueblo con las obras. En esta casa, ese gesto tiene torta gratis, en el corazón.',
  cuenta: 'Y no me olvido de lo que quedó en la cuenta, cariad. Sin apuro, pero sin olvido.',
  // {0}: lo último que pediste
  ultimo: ['La última vez fue {0}, ¿no? ¿Repetimos o probamos otra cosa?', '¿Otra vez {0}, o hoy te animás a algo distinto?', 'Me acuerdo de que pediste {0}. Si te gustó, te lo preparo igual.'],
  ultimoFavorito: ['Siempre {0}. Ya ni te pregunto: te lo hago de memoria.', '{0}, como siempre. Esta casa aprende de sus clientes.'],
};
export const DICHOS_TE = {
  anota: ['Anotado, cariad. Ya pongo el agua.', 'Marchando. Lo bueno de esta casa es que nada sale apurado.', 'Enseguida. Mirá el fuego mientras tanto: es gratis y siempre sale bien.'],
  trae: ['Acá tenés. Con cuidado, que la tetera quema.', 'Servido, cariad. Dejalo reposar un minuto, que sale mejor.', 'Tomá. Y si pedís otra taza, que sea sin culpa.'],
  trae_fria: ['Acá lo tenés, bien frío.', 'Tomá, recién sacado de la cueva.'],
  se_va: ['Cualquier cosa, me llamás.', 'Si querés más agua caliente, levantá la mano.', 'Disfrutalo. Yo vuelvo cuando haga falta.'],
  limpia: ['Dejame que te levanto esto.', 'Te saco las tazas. Volvé cuando quieras.'],
  sin_plata: 'Con eso no alcanza, cariad. Probá con un trueque o decime «anotalo» y lo arreglamos después.',
  cuenta_llena: 'La cuenta ya está demasiado larga. Primero saldame algo, ¿sí?',
  cerrada: 'La casa de té abre de 9 a 8 de la noche. Volvé más tarde y te sirvo con gusto.',
  sola: 'Hoy no hay nadie atendiendo: Ceinwen anda por ahí. Volvé más tarde.',
  vuelve_pronto: '¿Otra tacita, cariad? Mirá la carta cuando quieras.',
  llega: 'Ya voy, ya voy. No te vayas.',
  pagada: 'Cuenta saldada. Diolch, cariad.',
  mandado: 'Diolch por el mandado. Con esto estamos a mano.',
  sorbo: ['Ahhh. Eso entra en calor.', 'Qué bueno.', 'Con esto se vive otro rato.'],
  bocado: ['Mmm. Qué rico.', 'Eso sí que es torta.', 'Despacito, que se disfruta más.'],
  termino_trago: 'Se terminó la tetera. Pedí otra, si querés, o quedate un rato a escuchar el fuego.',
  termino_comida: 'Plato limpio. Mi tatarabuela estaría orgullosa.',
};
export const dichoTe = (clave, semilla = 0) => (Array.isArray(DICHOS_TE[clave]) ? eleg(DICHOS_TE[clave], semilla) : DICHOS_TE[clave]);
// El saludo: dos renglones (la presentación y lo del momento), como en la cantina; con «lo último que pediste» y los que ya son de la casa
export function saludoDeGalesa({ hora = 16, clima = 'sol', estacion = 'verano', apodo = null, visitas = 0, cuenta = null, hechos = [], dia = 1, ultimo = null, veces = 0 } = {}) {
  const semilla = dia * 7 + visitas;
  const h = ((Number(hora) % 24) + 24) % 24;
  let frase;
  if (!visitas) frase = eleg(SALUDOS_TE.nuevo, semilla);
  else if (apodo) frase = eleg(SALUDOS_TE.conocido, semilla).replace('{0}', apodo);
  else frase = eleg(SALUDOS_TE.conocidoSinApodo, semilla);
  const hecho = (hechos || []).find((x) => Object.hasOwn(SALUDOS_TE, x?.id) && x.id !== 'cuenta');
  let extra;
  if (visitas && ultimo) extra = eleg(veces >= 3 ? SALUDOS_TE.ultimoFavorito : SALUDOS_TE.ultimo, semilla + 3).replace('{0}', ultimo);
  else if (visitas && hecho) extra = SALUDOS_TE[hecho.id];
  else if (clima === 'lluvia') extra = SALUDOS_TE.lluvia;
  else if (clima === 'nieve') extra = SALUDOS_TE.nieve;
  else if (clima === 'viento') extra = SALUDOS_TE.viento;
  else if (estacion === 'invierno') extra = SALUDOS_TE.frio;
  else if (estacion === 'verano') extra = SALUDOS_TE.calor;
  else extra = h < 12.5 ? SALUDOS_TE.manana : h < 17.5 ? SALUDOS_TE.tarde : SALUDOS_TE.atardecer;
  if (!visitas) extra = h < 12.5 ? SALUDOS_TE.manana : h < 17.5 ? SALUDOS_TE.tarde : SALUDOS_TE.atardecer;
  return [frase, cuenta && visitas ? SALUDOS_TE.cuenta : extra];
}
// Todo lo nuevo que lee el jugador (para la prueba: nada religioso ni explícito)
export function textosCasaTe() {
  const t = [];
  for (const x of CARTA_TE) t.push(x.nombre, x.texto);
  for (const v of [...Object.values(SALUDOS_TE), ...Object.values(DICHOS_TE)]) t.push(...(Array.isArray(v) ? v : [v]));
  return t;
}
// Qué tan llena está la galería (0 a 1): la hora del té (de 15 a 19) y más los fines de semana. Hace tardar un poco más a Ceinwen.
export function afluenciaTe(hora, dia) {
  if (!casaTeAbierta(hora)) return 0;
  const h = ((Number(hora) % 24) + 24) % 24, ds = diaSemanaDe(dia);
  const tarde = h >= 15 && h < 19 ? 1 - Math.abs(h - 17) / 2.5 : 0.15;
  return Math.max(0.1, Math.min(1, tarde * (ds === 5 || ds === 6 ? 1 : 0.6)));
}
