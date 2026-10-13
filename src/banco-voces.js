// 3.9.2: la voz de Amadeo Lezcano, el gerente del banco del pueblo, según tu situación: tus deudas, tus negocios (casas en alquiler, puesto en la feria,
// pedidos del banco), la confianza del banco, el día de la semana, la hora y la estación. Módulo puro: lo usa el saludo del mostrador (aldea-gente.js)
// y el propio mostrador (banco-mundo.js), que muestra una línea suya arriba de cada solapa y comenta cada operación.
// Sólo castellano (el inglés de la economía queda para más adelante, a pedido del usuario).
import { hayEconomia, formatoPesos } from './economia.js';
import { negociosDe } from './negocios.js';
import { prestamoDe, nivelBanco, GERENTE } from './prestamos.js';
import { tienePuesto, casasDe, enAlquilerDe, PROPIEDAD } from './propiedad.js';
import { nivelDe } from './vecindad.js';

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const diaSemana = (dia) => (((Math.floor(Number(dia) || 1) - 1) % 7) + 7) % 7;
const hash = (n) => { let h = (Math.floor(n) * 2654435761) >>> 0; h ^= h >>> 13; return h >>> 0; };
// una línea de la lista, sin repetir seguido: depende del día, de cuántas veces se habló y de una sal
const elegir = (lista, dia, n, sal = 0) => lista[hash((Number(dia) || 1) * 31 + (Number(n) || 0) * 7 + sal) % lista.length];

// ---------------------------------------------------------------- lo que dice según cada situación
const ATRASADO = [
  'Estimado, el plazo se pasó y el interés ya corre al tres por ciento. No es un reproche: es aritmética. Pero sáldelo cuanto antes, que el banco no presta mientras quede una deuda vencida.',
  'Tengo su préstamo vencido en el libro mayor, y me da pena escribirlo con tinta roja. Pase por la ventanilla y lo arreglamos, que todo se arregla pagando de a poco.',
  'Mire que no me gusta andar reclamando. Pero una deuda vencida es como una gotera: callada, crece. Veamos qué puede pagar hoy.',
];
const VENCE_HOY = [
  'Hoy vence su préstamo, estimado. Con algo a cuenta alcanza para dormir tranquilo; con todo, para dormir mejor.',
  'Hoy es el último día del plazo. No se me asuste: si me paga hoy, la libreta queda impecable y la confianza del banco sube.',
];
const VENCE_PRONTO = [
  'Le quedan {n} días para devolver lo que pidió. Hágale la cuenta: cada día que pasa le suma el dos por ciento sobre lo que debe.',
  'Su préstamo vence en {n} días. Ya sé que las plantas, las vacas y los troncos no esperan, pero el interés tampoco.',
  'Falta poco para el vencimiento, {n} días. Si le sobra algo esta semana, pague a cuenta: el interés se calcula sobre lo que queda, no sobre lo que pidió.',
];
const CON_DEUDA = [
  'Debe {debe} y todavía tiene {n} días de plazo. Hay deudas que se llevan con elegancia, y la suya va por buen camino.',
  'Veo que anda con un préstamo en curso, {debe} al día de hoy. Pague cuando pueda, pero no deje para después del plazo lo que puede hacer antes.',
  'Un préstamo se parece a un perro prestado: hay que devolverlo en buen estado y a su hora. Usted debe {debe}; no se me olvide.',
];
const SOCIO = [
  'Para un socio del pueblo como usted, el mostrador siempre tiene la pava lista. Pida lo que necesite, que su libreta es de las mejores que tengo.',
  'Treinta años de oficio me enseñaron a distinguir un buen pagador a la legua. Usted es de esos: el banco le presta hasta quince mil sin pedirle garantía.',
];
const CLIENTE_DE_CONFIANZA = [
  'Su libreta está limpia, estimado. Cuando pida, que sea por una buena razón; cuando devuelva, que sea a tiempo, y vamos a llevarnos bien.',
  'Veo que cumple con lo que promete. Eso, en un pueblo chico, vale más que un balance: vale una reputación.',
];
const SIN_HISTORIA = [
  'Buenas, pase. Si es su primera vez, sepa que el banco presta poco al principio y más a medida que uno devuelve. Es la regla más vieja del oficio.',
  'Bienvenido al Banco del Pueblo. Acá la plata no se inventa: se junta entre todos y se presta con cuidado. Pregunte, que no cobro la consulta.',
];
const PUESTO = [
  'Me dicen que su puesto en la feria anda bien. Cada día sale la mercadería: un buen comerciante vende lo que otros dejan para mañana.',
  'Su puesto tiene {caja} en la caja, y le aviso porque lo que está en la caja no rinde. La plata quieta es plata dormida: retírela o inviértala.',
];
const ALQUILER = [
  'Sus inquilinos son puntuales, estimado: el alquiler entra todos los días como el reloj. Una casa con familia adentro nunca da pérdidas, sólo trabajo.',
  'Tiene {n} casa{s} en alquiler. Es un buen negocio: el techo que no usa, trabaja por usted. Eso lo sabe cualquier banquero.',
];
const CASAS = [
  'Veo que anda levantando casas. Lo que sale de la tierra y vuelve a ella en forma de techo es la mejor inversión que conozco, y lo digo con las cuentas a la vista.',
  'Una casa nueva da trabajo al pueblo y valor al terreno. Cuando termine una, avíseme y vemos si la pone en alquiler.',
];
const GENERAL = [
  'Buenas. Dígame en qué lo ayudo. Si es por plata, hay para todos; si es por consejo, también, aunque ese lo cobro más barato.',
  'El interés es el precio del tiempo, estimado. Hoy tengo tiempo para atenderlo, y eso no tiene interés.',
  'Pase, pase. La libreta está abierta y la caja, cuadrada. Un buen día para hacer números.',
  'Un banco chico es como una huerta: se riega todos los días y se cosecha una vez al año. ¿Viene a sembrar o a cosechar?',
];

// ---------------------------------------------------------------- según el día, la hora y la estación (se agrega como segunda frase)
const DIA = {
  lunes: ['Lunes: la semana empieza con la caja cuadrada y la libreta en blanco. Es el día en que más prestamos pedimos y menos devolvemos.', 'Los lunes la gente viene con planes. Los viernes, con explicaciones.'],
  martes: ['Martes tranquilo. Hay cola chica y buena luz en el mostrador.'],
  miercoles: ['Mitad de semana: ni se estrena ni se cierra nada. Ideal para poner los papeles al día.'],
  jueves: ['Jueves: se acerca el fin de semana y la gente empieza a pensar en gastar. Yo, en cuadrar.'],
  viernes: ['Viernes: hoy cierro la semana con la caja bien contada. Mañana, sábado de baile, el banco cierra temprano.'],
  sabado: ['Sábado: cierro a las cuatro para ir a ver bailar. No lo diga en voz alta, pero a la bailarina nueva le presté el paraguas una vez.', 'Hoy hay baile en la cantina y yo cierro temprano. Un banco que no deja bailar a su gerente se queda sin gerente.'],
  domingo: ['Hoy el banco no atiende. Si me ve acá es por un olvido o por una deuda de conciencia.'],
};
const HORA = {
  temprano: ['Todavía tengo el café tibio. A esta hora los números se ven más claros.', 'Primera hora de la mañana: la mejor para decidir con la cabeza fría.'],
  tarde: ['Después de la siesta la gente viene más ligera de ánimo y de bolsillo.', 'A esta hora la caja ya tiene algo de movimiento: buen momento para hacer una gestión tranquila.'],
  cierre: ['Falta poco para cerrar. Hágalo ligero, que después hay que contar la caja y no me gusta contarla con prisa.', 'Estoy por bajar la persiana. Si es breve, lo atiendo; si es largo, lo atiendo igual, pero con cara de sueño.'],
};
const ESTACION = {
  verano: ['Con este calor los números se evaporan, pero los intereses no.', 'En verano la gente pide para sembrar y devuelve en otoño con la cosecha. Un banco de campo vive de esa cuenta.'],
  otono: ['Otoño: tiempo de cosecha y de devolver lo que se pidió en verano. Es mi estación favorita para ver cuadrar las libretas.', 'Las hojas caen y las deudas se pagan. Así son los ciclos.'],
  invierno: ['En invierno uno pide para la leña y devuelve en primavera. Pida lo justo: la nieve no sabe de plazos.', 'Con el frío el banco es el lugar más abrigado del pueblo, y no lo digo sólo por la estufa.'],
};

// ---------------------------------------------------------------- el saludo
// `ctx`: { dia, hora, temporada, n }  →  una o dos frases del gerente según la situación (la más urgente primero)
export function saludoDelGerente(p, ctx = {}) {
  const dia = Math.max(1, Math.floor(Number(ctx.dia) || 1)), n = ctx.n || 0;
  const hora = Number(ctx.hora);
  const lineas = [];
  const llenar = (t, d) => t.replace(/\{(\w+)\}/g, (_m, k) => String(d[k] ?? ''));
  if (hayEconomia(p)) {
    const pr = prestamoDe(p), neg = negociosDe(p), nivel = nivelBanco(p);
    if (pr) {
      const faltan = pr.hasta - dia;
      if (faltan < 0) lineas.push(elegir(ATRASADO, dia, n));
      else if (faltan === 0) lineas.push(elegir(VENCE_HOY, dia, n));
      else if (faltan <= 3) lineas.push(llenar(elegir(VENCE_PRONTO, dia, n), { n: faltan }));
      else lineas.push(llenar(elegir(CON_DEUDA, dia, n), { debe: formatoPesos(pr.debe), n: faltan }));
    } else {
      const alquiladas = Object.values(neg.casas.alquiladas || {}).length, caja = neg.casas.puesto?.caja || 0;
      const hechas = Object.keys(neg.casas.poseidas || {}).length;
      const opciones = [];
      if (nivel >= 3) opciones.push(SOCIO);
      if (nivel >= 1 && neg.banco.hechos >= 2) opciones.push(CLIENTE_DE_CONFIANZA);
      if (tienePuesto(p)) opciones.push(PUESTO.map((t) => llenar(t, { caja: formatoPesos(caja) })).filter((_t, i) => i === 0 || caja > 0));
      if (alquiladas) opciones.push(ALQUILER.map((t) => llenar(t, { n: alquiladas, s: alquiladas > 1 ? 's' : '' })));
      if (hechas) opciones.push(CASAS);
      if (neg.banco.hechos === 0 && nivel === 0) opciones.push(SIN_HISTORIA);
      if (!opciones.length) opciones.push(GENERAL);
      lineas.push(elegir(opciones[hash(dia + n) % opciones.length], dia, n, 3));
    }
    // la confianza (amistad) con el gerente: otro trato
    const amistad = ctx.amistad || (() => { try { return nivelDe('gerente', p); } catch { return 'conocido'; } })();
    if (amistad === 'compadre') lineas.push('Entre nosotros, compadre, hoy no hay que firmar nada: venga a charlar cuando quiera, que la persiana la bajo yo.');
    else if (amistad === 'amigo' && hash(dia + n) % 3 === 0) lineas.push('A los amigos les atiendo primero, pero que no se entere la cola.');
  } else lineas.push(elegir(GENERAL, dia, n));
  // una segunda frase: el día de la semana, la hora o la estación (rotando)
  const ds = diaSemana(dia), clave = DIAS[ds].normalize('NFD').replace(/[̀-ͯ]/g, '');
  const extra = [];
  if (DIA[clave]) extra.push(...DIA[clave]);
  if (Number.isFinite(hora)) {
    if (hora < 10.5) extra.push(...HORA.temprano); else if (hora >= 17) extra.push(...HORA.cierre); else if (hora >= 14.5 && hora < 16) extra.push(...HORA.tarde);
  }
  const est = ESTACION[ctx.temporada];
  if (est) extra.push(...est);
  if (extra.length && hash(dia * 3 + n) % 3 !== 0) lineas.push(elegir(extra, dia, n, 11));
  return lineas;
}

// ---------------------------------------------------------------- lo que dice al terminar cada operación
const OPERACION = {
  prestamo: [
    'Aquí tiene. Firmo de mi puño y letra: el banco confía en usted. Acuérdese, el dos por ciento por día corre desde mañana.',
    'Listo, la plata es suya. Lo que se pide con cabeza se devuelve con tranquilidad.',
    'Anotado en el libro mayor. No se lo digo como advertencia sino como cariño: el interés no descansa los domingos.',
  ],
  pago: [
    'Anotado. Cada peso que me devuelve es un día menos de interés, y eso se siente en el bolsillo.',
    'Muy bien: pagar de a poco es de gente prudente. Le quedan menos deudas y más sueño.',
  ],
  saldado: [
    'Saldado. Dé gusto ver una libreta sin deudas. Vuelva cuando quiera, que el banco se acuerda de los buenos pagadores.',
    'Deuda cancelada, estimado. Si fue a tiempo, la confianza del banco sube; y si no, igual le agradezco.',
  ],
  abasto: [
    'Entregado y en orden. Esto le va a hacer falta a alguien del pueblo: así se mueve la rueda.',
    'Excelente. Lo pago por encima del mercado porque de eso vive el pueblo: si el banco compra caro, el que vende tiene con qué comprarme después.',
  ],
  alquiler: [
    'Casa alquilada. Una familia se va a quedar y va a pagar todos los días. A usted le conviene que estén contentos: cuide el techo.',
    'Lista en alquiler. Un techo sin gente es un gasto; con gente, una renta.',
  ],
  puesto: [
    'Su puesto en la feria. Le deseo ventas parejas y clientes buenos pagadores.',
    'Ya tiene su puesto. Dejando mercadería en consigna, cada día se vende algo: el que no vende hoy, vende mañana.',
  ],
  caja: [
    'Retirada la caja del puesto. Le recomiendo no dejarla mucho tiempo ahí: la plata que se mueve, rinde.',
  ],
};
export function comentarioDe(evento, ctx = {}) {
  const lista = OPERACION[evento];
  if (!lista) return '';
  return elegir(lista, ctx.dia, ctx.n, evento.length);
}

// ---------------------------------------------------------------- una línea de cada solapa (arriba del cuerpo)
const SOLAPA = {
  prestamos: ['Un préstamo se pide con la cabeza y se devuelve con el calendario. Mire bien el plazo.', 'El banco presta poco al principio y más a medida que usted devuelve a tiempo.'],
  abasto: ['El pedido del banco cambia cada dos días. Si lo cumple, le pago por encima del mercado.', 'Lo que el banco necesita lo necesita el pueblo: traiga lo que pide y cobre de más.'],
  casas: ['Una casa que se alquila trabaja por usted. Una que se queda vacía es un gasto sin dueño.', 'Cuanto más grande la casa, más rinde la renta, pero más tarda en levantarse.'],
  puesto: ['Dejando mercadería en consigna, el puesto vende todos los días. Pase a retirar la caja cuando le convenga.', 'Un puesto sin mercadería es una mesa vacía. Déjele algo.'],
};
export function lineaDeSolapa(solapa, p, ctx = {}) {
  const lista = [...(SOLAPA[solapa] || SOLAPA.prestamos)];
  let urgente = null;   // lo urgente se dice siempre; lo demás, rotando
  if (hayEconomia(p)) {
    const pr = prestamoDe(p);
    if (solapa === 'prestamos' && pr && pr.hasta - (ctx.dia || 1) < 0) urgente = 'Mire que el plazo ya se pasó: salde primero y después hablamos.';
    if (solapa === 'casas') {
      const hay = Object.keys(PROPIEDAD.casas).reduce((s, id) => s + casasDe(p, id) - enAlquilerDe(p, id), 0);
      if (hay > 0) urgente = `Le quedan ${hay} casa${hay > 1 ? 's' : ''} sin alquilar. ¿Las deja vacías?`;
    }
  }
  return `${GERENTE}: «${urgente || elegir(lista, ctx.dia, ctx.n, solapa.length)}»`;
}
export const VOZ_BANCO = { saludoDelGerente, comentarioDe, lineaDeSolapa };
