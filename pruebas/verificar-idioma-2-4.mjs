// 2.4 — las estructuras nuevas también en inglés (tanda Q, src/idioma-en-q.js). Cada texto
// se arma como lo arma el juego y se pasa por el traductor: si sale igual, quedó en castellano.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EN } from '../src/idioma-en.js';
import { crearTraductor } from '../src/idioma.js';
import { ENTRADA } from '../src/cuaderno.js';
import { RECETAS_HORNO, textoPide } from '../src/cocina.js';
import { armarMochila } from '../src/mochila.js';
import { OFERTAS, textoOferta } from '../src/feria.js';
import { CARTAS, dePara } from '../src/correo.js';
import { TINTES } from '../src/tintes.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const t = crearTraductor(EN, 'en').t;
const falta = [];
const traducido = (texto, donde) => { if (texto && t(texto) === texto && EN[texto] === undefined) falta.push(`${donde}: «${texto}»`); };
const may = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- las obras nuevas (el fuente importa three)
const planos = leer('src/construccion.js');
for (const id of ['alero', 'pared-hogar', 'horno', 'invernadero', 'embarcadero', 'buzon', 'bebedero', 'adarve']) {
  const m = new RegExp(`id: '${id}', nombre: '([^']+)'[\\s\\S]*?texto: '([^']+)'`).exec(planos);
  assert.ok(m, `no encontré el plano ${id}`);
  traducido(m[1], `plano ${id}`);
  traducido(m[2], `plano ${id}.texto`);
}
for (const motivo of ['Girala: la punta va hacia el agua (R)', 'El arranque tiene que quedar en la orilla', 'La punta tiene que llegar al agua honda del lago', 'La escalera quedaría colgando: buscá un lugar más parejo']) {
  assert.ok(planos.includes(`'${motivo}'`), `falta el motivo ${motivo}`);
  traducido(motivo, 'motivo embarcadero');
}

// ---------------------------------------------------------------- horno, cuaderno, mochila y feria
for (const rc of RECETAS_HORNO) {
  traducido(may(rc.nombre), `horno ${rc.id}`); traducido(`Hornear ${rc.nombre}`, `aviso horno ${rc.id}`); traducido(textoPide(rc), `horno ${rc.id} pide`);
  for (const campo of ['nombre', 'pista', 'texto']) traducido(ENTRADA[rc.id]?.[campo], `cuaderno ${rc.id}.${campo}`);
}
traducido(`Pan: ${textoPide(RECETAS_HORNO[0])}. Empanadas: ${textoPide(RECETAS_HORNO[1])}`, 'horno sin nada');
const cant = (n) => ({ dia: 1, hora: 8, cantidad: n });
for (const r of armarMochila({ entradas: { 'pan-casero': cant(3), empanadas: cant(4) }, cosas: {}, materiales: {}, ramitas: 0 }, {})) {
  if (!['pan-casero', 'empanadas'].includes(r.id)) continue;
  traducido(r.nombre, `mochila ${r.id}`); traducido(r.texto, `mochila ${r.id}.texto`);
}
for (const o of OFERTAS.filter((x) => ['pan-yerba', 'empanadas-tablas', 'pan-lana'].includes(x.id))) {
  const tx = textoOferta(o);
  traducido(o.texto, `feria ${o.id}`); traducido(`da ${tx.da} por ${tx.pide}`, `feria ${o.id}`);
}

// ---------------------------------------------------------------- las cartas en el buzón
for (const c of CARTAS) {
  // sólo las que ya tenían su aviso en inglés (todas desde la 1.11)
  if (EN[`De ${dePara(c)}. La tiene Ercilia en el almacén`] === undefined) continue;
  traducido(`De ${dePara(c)}. Te la dejaron en el buzón`, `carta ${c.id} en el buzón`);
}

// ---------------------------------------------------------------- lo que se escribe armado (notas y avisos)
for (const tinte of Object.values(TINTES)) traducido(`Teñiste de ${tinte.nombre}`, 'nota tinte');
for (const s of [
  // la casa abriga
  'Descansaste de verdad', 'La casa ya es casa: vas a andar más liviano un rato', 'El calor de la estufa llegó a toda la casa',
  'La casa y la manta alcanzaron', 'Sin fuego, pero bajo techo y abrigado', 'Dormiste bajo techo, sin fuego', 'Se sintió el frío, pero la casa aguantó: un fuego lo arregla',
  // el hogar
  'Encender el hogar', 'Encendiste el hogar', 'Calienta la casa, y el humo sale por la chimenea',
  // avisos de las obras
  'El horno de barro', 'Abrir el buzón: hay carta', 'Mandar la foto por el buzón', 'Mirar el buzón', 'Traer el kayak al embarcadero', 'Mirar tu corral', 'El bebedero',
  // horno
  'No tenés con qué hornear', 'Un tronco por horneada, para calentar el barro', 'Horneaste 3 panes caseros', 'Horneaste 4 empanadas', 'Llevás 7. Para la feria o para el camino',
  // buzón
  'El buzón está vacío', 'Las cartas llegan con el tren', 'Tu buzón, en la puerta de casa', 'Levantás la tapa del buzón.', 'Cerrás la tapa del buzón.',
  // embarcadero
  'Trajiste el kayak', 'Quedó amarrado al costado de la punta', 'El kayak no llega hasta acá', 'La punta tiene que dar al agua honda del lago',
  'El kayak quedó amarrado en tu embarcadero', 'Desde la punta también se pesca',
  // corral
  'Las ovejas se quedan en el galpón', 'Todavía no es un corral', 'Faltan 3 tramos de cerco alrededor, a menos de 7 m', 'Tu corral', '1 de 2 con el vellón entero',
  'Las dos recién esquiladas: el vellón vuelve en unos días', 'Don Ramón te trajo dos ovejas', 'Para tu corral. Se esquilan con la misma tijera',
  // helada
  'Heló la huerta', 'Lo de afuera se atrasa un día; lo del invernadero sigue creciendo', 'Lo sembrado afuera se atrasa un día. Un invernadero lo cubre',
  // tinte
  'Nada para teñir', 'Acercate a una pared, un piso o un techo tuyo terminado', 'No te alcanza para teñir', 'Calafate: 3 frutos · ocre: 1 piedra · cal: 2 piedras',
  'T otra vez pasa al siguiente', 'Volvió al color de la madera',
  // el diario
  'Dormí en casa sin fuego. Fresco, pero con techo: nada que ver con la intemperie.', 'Me desperté descansado. Se nota cuando la casa está bien puesta.',
  'Horneé pan casero en el horno de barro. La casa olió a eso toda la tarde.', 'Horneé empanadas en el horno de barro. La casa olió a eso toda la tarde.',
  'Había carta en el buzón. Da gusto no tener que bajar al almacén.', 'Don Ramón subió con dos ovejas para mi corral. Dice que son mansas; ya veremos.',
  'Heló. La huerta de afuera se quemó un poco; lo del invernadero ni se enteró.', 'Heló fuerte. La huerta de afuera se atrasó.', 'Heló, pero lo del invernadero sigue verde.',
  ...Object.values(TINTES).map((x) => `Teñí una pared de ${x.nombre}. La casa ya no parece la de nadie.`),
]) traducido(s, 'nota');

// ---------------------------------------------------------------- guía y teclas
const guia = leer('src/guia.js');
for (const titulo of ['Teñir la casa', 'La galería y el invernadero', 'El hogar de piedra', 'El embarcadero', 'El adarve', 'La casa abriga', 'El horno de barro', 'El buzón', 'Tu corral']) {
  const m = new RegExp(`\\['${titulo}', '([^']+)'\\]`).exec(guia);
  assert.ok(m, `falta en la guía: ${titulo}`);
  traducido(titulo, 'guía'); traducido(m[1], `guía ${titulo}`);
}
traducido('con los planos abiertos: teñir la pared, el piso o el techo que tenés al lado (calafate, ocre, cal o natural)', 'teclas T');

assert.deepEqual(falta, [], `quedó en castellano:\n  ${falta.join('\n  ')}`);
console.log('idioma 2.4: casa, hogar, galería, invernadero, horno, embarcadero, buzón, corral, adarve y tintes, en inglés');
