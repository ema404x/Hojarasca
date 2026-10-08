// 2.3 — todo lo nuevo también en inglés (tanda P, src/idioma-en-p.js). Cada texto se
// arma como lo arma el juego y se pasa por el traductor: si sale igual, quedó en castellano.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EN } from '../src/idioma-en.js';
import { crearTraductor } from '../src/idioma.js';
import { ENTRADA, SECCIONES } from '../src/cuaderno.js';
import { RECETAS_FUEGO, textoPide } from '../src/cocina.js';
import { AL_ABRIR } from '../src/conservas.js';
import { armarMochila } from '../src/mochila.js';
import { CUENTOS } from '../src/cuentos.js';
import { avisoColmena } from '../src/colmena.js';
import { avisoAhumadero } from '../src/ahumadero.js';
import { avisoVivero, ARBOLES_VIVERO } from '../src/vivero.js';
import { avisoLenera } from '../src/lena.js';
import { avisoCapullo } from '../src/desafio-infestacion.js';
import { avisoZanja } from '../src/desafio-zanja.js';
import { BESTIARIO } from '../src/desafio-noche2.js';
import { SONIDOS_ESCRITOS } from '../src/desafio-sentidos.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const t = crearTraductor(EN, 'en').t;
const falta = [];
const traducido = (texto, donde) => { if (texto && t(texto) === texto && EN[texto] === undefined) falta.push(`${donde}: «${texto}»`); };
const may = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- el cuaderno
traducido(SECCIONES.find((s) => s.id === 'fogon')?.nombre, 'sección fogón');
const nuevas = ['miel', 'trucha-fresca', 'trucha-ahumada', 'sopaipillas-miel', 'trucha-papas', 'avistaje-lago',
  ...['coihue', 'lenga', 'nire', 'cipres'].map((e) => `semilla-${e}`), ...['coihue', 'lenga', 'nire', 'cipres', 'pehuen'].map((e) => `plantin-${e}`), ...CUENTOS.map((c) => c.id)];
for (const id of nuevas) {
  const e = ENTRADA[id];
  assert.ok(e, `falta la entrada ${id}`);
  for (const campo of ['nombre', 'pista', 'texto']) traducido(e[campo], `cuaderno ${id}.${campo}`);
  if (e.cientifico && !/^[A-Z][a-z]+( [a-z.]+){1,2}$/.test(e.cientifico)) traducido(e.cientifico, `cuaderno ${id}.cientifico`);
}
for (const c of CUENTOS) for (const p of c.partes) traducido(p, `cuento ${c.id}`);

// ---------------------------------------------------------------- las obras nuevas (el fuente importa three)
const planos = leer('src/construccion.js');
for (const id of ['colmena', 'ahumadero', 'vivero', 'lenera', 'ballesta-cielo', 'zanja-fuego']) {
  const m = new RegExp(`id: '${id}', nombre: '([^']+)'[\\s\\S]*?texto: '([^']+)'`).exec(planos);
  assert.ok(m, `no encontré el plano ${id}`);
  traducido(m[1], `plano ${id}`);
  traducido(m[2], `plano ${id}.texto`);
}

// ---------------------------------------------------------------- cocina, conservas y mochila
for (const rc of RECETAS_FUEGO.filter((r) => ['sopaipillas-miel', 'trucha-papas'].includes(r.id))) { traducido(may(rc.nombre), `receta ${rc.id}`); traducido(textoPide(rc), `receta ${rc.id} pide`); }
for (const k of ['miel', 'trucha-ahumada']) traducido(AL_ABRIR[k], `abrir ${k}`);
const cant = (n) => ({ dia: 1, hora: 8, cantidad: n });
const entradas = { miel: cant(2), 'trucha-fresca': cant(1), 'trucha-ahumada': cant(3) };
for (const e of ['coihue', 'lenga', 'nire', 'cipres']) entradas[`semilla-${e}`] = cant(1);
for (const e of ['coihue', 'lenga', 'nire', 'cipres', 'pehuen']) entradas[`plantin-${e}`] = cant(1);
for (const r of armarMochila({ entradas, cosas: {}, materiales: {}, ramitas: 0 }, {})) {
  if (!Object.keys(entradas).includes(r.id)) continue;
  traducido(r.nombre, `mochila ${r.id}`); traducido(r.texto, `mochila ${r.id}.texto`);
}

// ---------------------------------------------------------------- los avisos de las obras
for (const miel of [0, 1, 2]) for (const invierno of [0, 1]) traducido(avisoColmena({ miel, horas: 0 }, { invierno }), `aviso colmena ${miel}/${invierno}`);
for (const [a, frescas, lena] of [[{ truchas: 0, listas: 2, horas: 0 }, 0, 0], [{ truchas: 3, listas: 0, horas: 4 }, 0, 0], [{ truchas: 0, listas: 0, horas: 0 }, 1, 1], [{ truchas: 0, listas: 0, horas: 0 }, 5, 1], [{ truchas: 0, listas: 0, horas: 0 }, 2, 0], [{ truchas: 0, listas: 0, horas: 0 }, 0, 0]]) traducido(avisoAhumadero(a, frescas, lena), 'aviso ahumadero');
traducido(avisoVivero({ macetas: [{ especie: 'coihue', dia: 1 }] }, {}, 9), 'aviso vivero listo');
traducido(avisoVivero({ macetas: [{ especie: 'coihue', dia: 1 }, { especie: 'lenga', dia: 1 }] }, {}, 9), 'aviso vivero listos');
traducido(avisoVivero({ macetas: [] }, { 'semilla-coihue': cant(2) }, 9), 'aviso vivero sembrar');
traducido(avisoVivero({ macetas: [{ especie: 'coihue', dia: 9 }] }, {}, 9), 'aviso vivero germinando');
traducido(avisoVivero({ macetas: [{ especie: 'coihue', dia: 9 }, { especie: 'coihue', dia: 9 }] }, {}, 9), 'aviso vivero germinando 2');
traducido(avisoVivero({ macetas: [] }, {}, 9), 'aviso vivero vacío');
for (const troncos of [0, 3]) traducido(avisoLenera({ secos: 4 }, troncos), `aviso leñera ${troncos}`);
for (const [ramitas, lluvia] of [[1, 0], [0, 0], [1, 0.9]]) traducido(avisoCapullo({ ramitas, lluvia }), 'aviso capullo');
for (const [z, troncos, lluvia] of [[{ lena: 0, ardiendo: 30 }, 0, 0], [{ lena: 1, ardiendo: 0 }, 2, 0], [{ lena: 0, ardiendo: 0 }, 0, 0], [{ lena: 2, ardiendo: 0 }, 0, 0.9], [{ lena: 2, ardiendo: 0 }, 0, 0]]) traducido(avisoZanja(z, { troncos, lluvia }), 'aviso zanja');

// ---------------------------------------------------------------- lo que se escribe armado (notas del juego)
for (const esp of Object.values(ARBOLES_VIVERO)) {
  if (esp.nombre === 'pehuén') continue;
  traducido(`Semilla de ${esp.nombre}`, 'nota semilla'); traducido(`Juntar semilla de ${esp.nombre}`, 'aviso semilla');
}
for (const s of [
  'Te la quedás para el ahumadero (1 de 2 hoy)', 'Una más gracias a las abejas. Llevás 6', 'La colmena tiene miel', 'Cuando quieras, la sacás con E',
  'Sacaste 1 frasco de miel', 'Sacaste 3 frascos de miel', 'Llevás 3. Para el fuego, la feria o el invierno', 'Las abejas no salen en invierno',
  'Se quedan apretadas adentro, calentándose entre ellas', 'Las abejas están trabajando', 'Falta miel: más o menos un día de sol', 'Falta miel: unos 3 días de sol',
  'Las truchas ya están ahumadas', 'Están en el ahumadero, esperándote', 'Sacaste 1 trucha ahumada', 'Sacaste 4 truchas ahumadas', 'Llevás 4. Aguantan hasta el invierno',
  'Colgaste 1 trucha al humo', 'Colgaste 3 truchas al humo', 'En medio día están. El fuego se cuida solo', 'Se están ahumando', 'Falta leña', 'Un tronco por tanda, para el fuego de abajo',
  'No tenés truchas', 'Con el ahumadero, de lo que pescás te quedás con 2 truchas por día',
  'Sacaste 1 plantín', 'Sacaste 4 plantines', 'Se plantan con B en un claro: ya vienen crecidos a la mitad', 'Sembraste 1 almácigo', 'Sembraste 6 almácigos',
  'En 3 días salen los plantines', 'Están germinando', 'Falta un día', 'Faltan 2 días', 'No tenés semillas',
  'En otoño, junto a un coihue, una lenga, un ñire o un ciprés grande, E junta semilla. Los piñones también sirven', 'Llevás 2. En el vivero germina en 3 días', 'Plantaste un plantín',
  'Guardaste 1 tronco en la leñera', 'Guardaste 6 troncos en la leñera', 'Hay 6 secos. En invierno, cada fuego se lleva uno', '1 tronco seco', '4 troncos secos',
  'La leñera está llena', 'Traé troncos para guardar', 'La leña está mojada', 'Hace humo y no prende. La que guardás en la leñera queda seca', 'En invierno hace falta leña',
  'Con ramitas solas no alcanza: traé un tronco seco', 'Se fue un tronco de leña', 'Quedan 5 en la leñera', 'De los que llevabas encima',
  'Dormiste calentito', 'El fuego aguantó toda la noche', 'Pasaste frío', 'Sin fuego, la noche de invierno se mete en los huesos: vas a andar lento un rato, o hasta que te calientes junto a un fuego',
  'La manta ayudó, pero no alcanzó', 'Te levantás entumecido: un fuego lo arregla', 'Ya entraste en calor', 'El cuerpo arrancó', 'Las abejas se alborotan', 'Pasá despacio al lado de la colmena',
  'Nicanor se queda al fuego', 'Hablale: de noche, al fogón, se cuentan otras cosas', 'Me voy yendo, que se hizo tarde. Gracias por el fuego.',
  '¿Viste eso?', 'Algo asomó en el lago. Si tenés la cámara (P), es ahora',
  // el diario
  'Saqué un frasco de miel de la colmena. Las abejas ni se enteraron.', 'Saqué 2 frascos de miel. Huele a flor de todo el valle.',
  'Saqué las truchas del ahumadero. La casa quedó oliendo a humo, y está bien.', 'Afuera helaba. Adentro el fuego duró toda la noche.',
  'Me dormí sin fuego y la helada se metió por todos lados. Mañana, leña.', 'La manta ayudó, pero sin fuego el invierno se siente igual.',
  'En el lago asomó algo. Un lomo oscuro, un rato, y se hundió. No sé qué vi.', 'Junté los huevos del gallinero, todavía tibios.',
  'Esquilé una oveja. Se sacudió y se fue a pastar como si nada.', 'Esquilé 3 ovejas. Me duelen las manos.',
  // el Desafío (3.8.0: con duendes, nidos de hongos, lechuzas y semillas doradas)
  'Quedó un nido de hongos en el bosque', 'Quedaron 3 nidos de hongos en el bosque', 'Está al norte. Quemalo (E, con una ramita) antes de que caiga la noche',
  'El más cercano, al sureste. Quemalos (E, con una ramita) antes de que caiga la noche', 'Se abrió un nido de hongos', 'Se abrieron 3 nidos de hongos',
  'Un duende más, desde el bosque', '4 duendes más, desde el bosque', 'Mojado no prende', 'Rompelo a golpes: son tres, y el que sale, sale flojo',
  'Te falta una ramita', 'Juntá ramitas bajo los árboles, o rompelo a golpes', 'Rompiste el nido de hongos', 'El que estaba adentro salió flojo: terminalo',
  'Quemaste un nido de hongos', 'Quedan 2 en el bosque · +1 semilla dorada', 'No queda ninguno · +1 semilla dorada',
  '¡La trochita se quedó varada!', 'Elsa está adentro, al oeste, a 300 m de la estación. Si la escoltás, llega', 'Rompieron la trochita',
  'Elsa no va a querer hablarte por unos días, y el tren queda parado hasta que amanezca', 'La trochita llegó a la estación',
  'Elsa te agradece: +4 semillas doradas, +6 tablas, +4 piedras', 'La trochita siguió sola con la luz', 'Elsa esperó a que amaneciera. Esta vez no llegó con vos',
  'Una lechuza apagó una antorcha', 'Vienen montados en lechuzas a buscar las llamas. F la vuelve a prender; la ballesta al cielo los baja',
  'La zanja está cargada', 'Echaste leña en la zanja', 'Prendela con E cuando lleguen: arde un minuto', 'Falta 1 tronco', '¡La zanja arde!',
  'Un minuto de fuego. Con viento, cuidado con el pasto', 'La leña queda en la zanja: prendela cuando afloje', 'Faltan troncos', 'La zanja se carga con 2 troncos',
  'La zanja ya arde', 'Quedan 40 segundos', 'La zanja se apagó', 'Cargala de nuevo con dos troncos', '¡El fuego se escapó al pasto!',
  'Con viento se corre: alejate y cuidá la madera de las defensas',
  'Código de partida', 'El de esta semana', 'Sin código: noches al azar', 'Esta partida usa COIHUE-4821: las mismas noches para cualquiera que lo use.',
  'Esta partida no tiene código. Se elige al empezar de nuevo La noche de los duendes.', 'Con un código, las noches salen siempre iguales: sirve para comparar con la otra computadora o con amigos.',
  'Un código es una palabra y un número, como COIHUE-4821.', 'Tu mejor con LENGA-12: 1 noche.', 'Tu mejor con LENGA-12: 7 noches.',
  'Con LENGA-12, las mismas noches para cualquiera que lo use.', 'Código LENGA-12', 'Las mismas noches para cualquiera que lo use. Tu récord con este código se guarda aparte',
  'Tu mejor noche con LENGA-12', '1 noche resistida con este código', '5 noches resistidas con este código',
]) traducido(s, 'nota');

// ---------------------------------------------------------------- bestiario, subtítulos, guía y foto
for (const campo of ['nombre', 'visto', 'aprendido', 'debil']) traducido(BESTIARIO.volador[campo], `bestiario volador.${campo}`);
for (const k of ['aleteo', 'picada', 'apagar', 'capullo', 'quemar', 'zanja']) traducido(SONIDOS_ESCRITOS[k], `subtítulo ${k}`);
const guia = leer('src/guia.js');
const TITULOS_23 = ['La colmena', 'El ahumadero', 'El vivero', 'La leña del invierno', 'El fogón', 'Los nidos de hongos', 'La trochita varada', 'Las lechuzas', 'La zanja de fuego', 'Código de partida'];
for (const titulo of TITULOS_23) {
  const m = new RegExp(`\\['${titulo}', '([^']+)'\\]`).exec(guia);
  assert.ok(m, `falta en la guía: ${titulo}`);
  traducido(titulo, 'guía'); traducido(m[1], `guía ${titulo}`);
}
const foto = /\{ id: 'f-nahuelito', nombre: '([^']+)', texto: '([^']+)', pista: '([^']+)' \}/.exec(leer('src/fotos.js'));
assert.ok(foto, 'falta el desafío de foto del lago');
for (const s of foto.slice(1)) traducido(s, 'foto del lago');

assert.deepEqual(falta, [], `quedó en castellano:\n  ${falta.join('\n  ')}`);
console.log('idioma 2.3: colmena, ahumadero, vivero, leña, fogón, capullos, trochita varada, volador, zanja y código de partida, en inglés');
