// 3.8.8: el reloj y el almanaque. Hasta ahora la hora y el día sólo se veían en el menú de pausa. Ahora hay dos maneras de
// saberlos sin pausar:
//   · los comunitarios, para todos: el reloj de la plaza de la aldea y el almanaque de la biblioteca (se miran con E);
//   · los propios, que se consiguen en el almacén (por trueque): el reloj de bolsillo pone la hora y el almanaque de pared el
//     día, en una línea del HUD. No hacen falta si vas a la aldea, y con los de la aldea no hace falta tener los tuyos:
//     por eso dicen lo mismo.
// Módulo puro (sin three ni DOM): los textos y las reglas, para probarlos en Node. El dibujo de los comunitarios está en
// aldea-arquitectura.js, la tecla E en aldea-mecanicas*.js y la línea del HUD en main.js.
import { SEMANA, diaSemanaDe, localAbierto, aldeaNueva } from './aldea.js';
import { fechaDe, eventosDelDia, FIESTAS_ALDEA } from './aldea-vida.js';
import { faseLunar, nombreFase } from './cielo-noche.js';
import { CLUB_LECTURA } from './calendario.js';

// Los dos cambios del almacén (ids de `progreso.cosas`). Los precios están en trueque.js.
export const RELOJ_PROPIO = 'reloj';
export const ALMANAQUE_PROPIO = 'almanaque';

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const mayus = (t) => (typeof t === 'string' && t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
const diaValido = (v) => Math.max(1, Math.floor(num(v, 1)));
const horaValida = (v) => { const h = num(v, 12) % 24; return h < 0 ? h + 24 : h; };

// «10:30» (la hora de juego, redondeada hacia abajo al minuto)
export function horaFormato(h) {
  const x = horaValida(h), hh = Math.floor(x), mm = Math.min(59, Math.floor((x - hh) * 60));
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
// Cómo se dice el momento del día
export function momentoDelDia(h) {
  const x = horaValida(h);
  if (x < 5) return 'de madrugada';
  if (x < 8) return 'al amanecer';
  if (x < 12) return 'a la mañana';
  if (x < 14) return 'al mediodía';
  if (x < 19) return 'a la tarde';
  if (x < 21) return 'al anochecer';
  return 'de noche';
}
export const nombreDiaSemana = (dia) => SEMANA[diaSemanaDe(diaValido(dia))];

// ---------------------------------------------------------------- los comunitarios (se leen con E)
// El reloj de la plaza: la hora y el día, y a qué hora hace qué la aldea (lo que el juego nunca decía).
export function partesReloj({ hora, dia }) {
  const d = diaValido(dia);
  return [
    `Son las ${horaFormato(hora)}, ${momentoDelDia(hora)}.`,
    `Hoy es ${nombreDiaSemana(d)}, día ${d} en el valle.`,
  ];
}
// Lo que viene en los próximos días (un año del juego son doce): { dias, texto }[].
export function proximosEventos(dia, { aldea = null, fiestas = FIESTAS_ALDEA, extras = null, tope = 4 } = {}) {
  const hoy = diaValido(dia), lista = [];
  for (let k = 1; k <= 12 && lista.length < tope; k++) {
    for (const e of eventosDelDia(hoy + k, { aldea, fiestas, extras })) {
      if (lista.length >= tope) break;
      lista.push({ dias: k, texto: e.texto || e.nombre });
    }
  }
  return lista;
}
// El almanaque de la biblioteca, una línea por cosa (cortas y con moldes simples: así las traduce el juego): el día, la
// fecha, la estación y la luna, lo que viene y lo que se repite cada semana.
export function partesAlmanaque({ dia, horas = 12, aldea = null, extras = null }) {
  const d = diaValido(dia), a = aldea || aldeaNueva();
  const f = fechaDe(d);
  const partes = [
    `${mayus(nombreDiaSemana(d))}, día ${d}.`,
    `${f.diaDeEstacion}.º día del ${f.nombreEstacion.toLowerCase()}, año ${f.anio}.`,
    `Estación: ${f.nombreEstacion}.`,
    `La luna: ${nombreFase(faseLunar(d, num(horas, 12)))}.`,
  ];
  const prox = proximosEventos(d, { aldea: a, extras });
  if (!prox.length) partes.push('No hay nada anotado para los próximos días.');
  else {
    partes.push('Lo que viene en los próximos días:');
    for (const p of prox) partes.push(p.dias === 1 ? `Mañana: ${p.texto}.` : `En ${p.dias} días: ${p.texto}.`);
  }
  partes.push('Cada semana:');
  partes.push('Los domingos, de 10 a 11: los cuentos de la abuela en la biblioteca.');
  if (localAbierto(a, 'salon')) partes.push('Los sábados, de 17 a 19: el baile en el salón.');
  partes.push(`Los ${SEMANA[CLUB_LECTURA.diaSemana]}, de ${CLUB_LECTURA.desde} a ${String(CLUB_LECTURA.hasta).replace('.5', ':30')}: el club de lectura.`);
  return partes;
}

// ---------------------------------------------------------------- los propios (la línea del HUD)
export const tieneReloj = (progreso) => !!progreso?.cosas?.[RELOJ_PROPIO];
export const tieneAlmanaque = (progreso) => !!progreso?.cosas?.[ALMANAQUE_PROPIO];
// El texto de la línea: la hora si tenés el reloj, el día y la estación si tenés el almanaque. '' si no tenés ninguno.
export function textoHud(progreso) {
  if (!progreso || progreso.modo === 'desafio') return '';
  const partes = [];
  if (tieneReloj(progreso)) partes.push(horaFormato(progreso.horas));
  if (tieneAlmanaque(progreso)) {
    const d = diaValido(progreso.dia);
    partes.push(`${mayus(nombreDiaSemana(d))}, día ${d}`, fechaDe(d).nombreEstacion);
  }
  return partes.join(' · ');
}
