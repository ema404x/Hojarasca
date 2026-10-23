// 4.10 (guardian) — el progreso del jugador dentro de la partida del Desafío.
//   1. Los bonos (desafio-bonos.js): el contrato que comparten las habilidades, el bestiario y las ventajas.
//   2. Las habilidades del guardián (desafio-habilidades.js): un punto por noche, costos 1/2/3, tres ramas.
//   3. El bestiario que premia (desafio-bestiario-premia.js): 5, 15 y 40 abatidos.
//   4. El estado: partidas viejas y datos rotos cargan limpios.
//   5. La pestaña «Guardián» (desafio-habilidades-mundo.js), con un cuaderno de mentira.
//   6. El enganche con el juego: dónde se aplican los bonos, y que nada pase por cuadro de más.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  BONOS_CLAVES, TOPES_BONO, bonosNuevos, sumarBono, quitarBonosDeOrigen, bonoDe, bonoAplicado, sanearBonos, armaConBonos, saludMaximaConBonos,
} from '../src/desafio-bonos.js';
import {
  HABILIDADES, RAMAS, IDS_HABILIDAD, COSTOS, NIVEL_MAX_HABILIDAD, habilidadesNuevas, sanearHabilidades, nivelDe, costoSiguiente, puedeSubir,
  puntosGastados, subirHabilidad, puntoPorNoche, aplicarHabilidadesABonos, golpesPorMaterial, menosDano, GOLPES_BASE_POR_MATERIAL,
} from '../src/desafio-habilidades.js';
import {
  UMBRALES_ESTUDIO, TIPOS_ESTUDIO, umbralesDe, nivelEstudio, subioEstudio, datoPuntoDebil, anotarLado, ladoFrecuente, datoLado, danoContraTipo, renglonesEstudio, DANO_ESTUDIADO,
} from '../src/desafio-bestiario-premia.js';
import { BESTIARIO, sanearBestiario, anotarBestiario } from '../src/desafio-noche2.js';
import { desafioNuevo, sanearDesafio, SALUD_MAX, ARMAS, armaEfectiva, TIPOS_ALIEN } from '../src/desafio-reglas.js';
import { crearHabilidadesMundo, resumenDeBonos } from '../src/desafio-habilidades-mundo.js';
import { enUnaLinea } from './ayuda-codigo.mjs';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const igual = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, m) => { assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`); n++; };

// ================================================================ 1. los bonos
igual(BONOS_CLAVES, ['saludMax', 'correr', 'recarga', 'dano', 'reparar', 'alcance'], 'las seis claves del contrato');
igual(bonosNuevos(), { origen: {} }, 'bonosNuevos');
{
  const d = {};
  ok(sumarBono(d, 'ventaja', 'dano', 0.1), 'sumar crea el estado si no estaba');
  ok(sumarBono(d, 'habilidad', 'dano', 0.06) && sumarBono(d, 'trofeo', 'dano', 0.02), 'tres orígenes en la misma clave');
  cerca(bonoDe(d, 'dano'), 0.18, 'bonoDe suma todos los orígenes');
  sumarBono(d, 'ventaja', 'saludMax', 15);
  cerca(bonoDe(d, 'saludMax'), 15, 'otra clave aparte');
  cerca(bonoDe(d, 'correr'), 0, 'sin ningún origen vale 0');
  cerca(bonoDe({}, 'dano'), 0, 'sin estado vale 0');
  cerca(bonoDe(undefined, 'dano'), 0, 'sin partida vale 0');
  cerca(bonoDe(d, 'inventada'), 0, 'una clave que no existe vale 0');
  ok(quitarBonosDeOrigen(d, 'ventaja'), 'quitar un origen que estaba');
  cerca(bonoDe(d, 'dano'), 0.08, 'quitar un origen deja los otros');
  cerca(bonoDe(d, 'saludMax'), 0, 'y se lleva todo lo suyo');
  ok(!quitarBonosDeOrigen(d, 'ventaja'), 'quitar uno que no está no hace nada');
  // acumula dentro de un mismo origen
  sumarBono(d, 'habilidad', 'dano', 0.06);
  cerca(bonoDe(d, 'dano'), 0.14, 'sumar dos veces el mismo bono lo acumula');
  // rechazos
  ok(!sumarBono(d, 'x', 'inventada', 1), 'una clave que no existe se rechaza');
  ok(!sumarBono(d, 'x', 'dano', NaN) && !sumarBono(d, 'x', 'dano', 'mucho') && !sumarBono(d, 'x', 'dano', null) && !sumarBono(d, 'x', 'dano', true), 'un valor que no es número se rechaza');
  ok(!sumarBono(d, '__proto__', 'dano', 1) && !sumarBono(d, '', 'dano', 1) && !sumarBono(d, 7, 'dano', 1) && !sumarBono(d, 'a'.repeat(40), 'dano', 1), 'un origen raro se rechaza');
  ok(!('dano' in Object.prototype) && !Object.hasOwn(d.bonos.origen, '__proto__'), 'nada se pega al prototipo');
  ok(sumarBono(d, 'constructor', 'dano', 0.01) && Object.hasOwn(d.bonos.origen, 'constructor'), '«constructor» es un origen más');
  ok(!sumarBono(null, 'x', 'dano', 1), 'sin estado no hay dónde sumar');
  const lleno = {};
  for (let i = 0; i < 16; i++) sumarBono(lleno, `o${i}`, 'dano', 0.01);
  ok(!sumarBono(lleno, 'otro', 'dano', 0.01), 'hay un tope de orígenes');
  const gigante = {};
  sumarBono(gigante, 'x', 'dano', 1e12);
  ok(gigante.bonos.origen.x.dano <= 1000, 'un valor enorme se acota');
}
// los topes con los que se aplica
{
  const d = {};
  sumarBono(d, 'a', 'dano', 5); sumarBono(d, 'a', 'correr', 9); sumarBono(d, 'a', 'recarga', 9); sumarBono(d, 'a', 'alcance', 9); sumarBono(d, 'a', 'reparar', 99); sumarBono(d, 'a', 'saludMax', 9999);
  for (const k of BONOS_CLAVES) cerca(bonoAplicado(d, k), TOPES_BONO[k][1], `tope alto de ${k}`);
  const e = {};
  for (const k of BONOS_CLAVES) sumarBono(e, 'a', k, -9999);
  for (const k of BONOS_CLAVES) cerca(bonoAplicado(e, k), TOPES_BONO[k][0], `tope bajo de ${k}`);
  ok(saludMaximaConBonos(100, e) >= 40 && saludMaximaConBonos(50, e) === 40, 'la salud máxima nunca baja de 40');
  igual(saludMaximaConBonos(100, {}), 100, 'sin bonos, la salud máxima es la de siempre');
  const f = {}; sumarBono(f, 'habilidad', 'saludMax', 35);
  igual(saludMaximaConBonos(100, f), 135, 'con +35, 135');
}
// el arma con los bonos
{
  const d = {};
  sumarBono(d, 'habilidad', 'dano', 0.2); sumarBono(d, 'habilidad', 'alcance', 0.1); sumarBono(d, 'habilidad', 'recarga', 0.2);
  const arco = armaEfectiva('arco', {}), a = armaConBonos(arco, d);
  cerca(a.dano, arco.dano * 1.2, 'el arco pega 20 % más');
  cerca(a.vel, arco.vel * 1.1, 'y la flecha va 10 % más rápido');
  cerca(a.cadencia, arco.cadencia * 0.8, 'y espera 20 % menos');
  ok(arco.dano === ARMAS.arco.dano && arco.cadencia === ARMAS.arco.cadencia, 'la tabla de armas no se toca');
  const lanza = armaConBonos(armaEfectiva('lanza', {}), d);
  cerca(lanza.alcance, ARMAS.lanza.alcance * 1.1, 'la lanza llega 10 % más lejos');
  const pistola = armaConBonos(armaEfectiva('pistola', { pistolaCargada: true }), d);
  cerca(pistola.alcance, ARMAS.pistola.alcance * 1.1, 'el rayo llega más lejos');
  cerca(pistola.cargado.dano, 150 * 1.2, 'y el disparo cargado pega más');
  const martillo = armaConBonos(armaEfectiva('martillo', {}), d);
  ok(martillo.dano === undefined, 'el martillo no se inventa un daño');
  const sin = armaEfectiva('arco', {});
  ok(armaConBonos(sin, {}) === sin, 'sin bonos devuelve la misma arma');
  ok(armaConBonos(null, d) === null, 'sin arma devuelve nada');
  const rapido = {}; sumarBono(rapido, 'a', 'recarga', 99);
  ok(armaConBonos(armaEfectiva('honda', {}), rapido).cadencia >= 0.12, 'la espera tiene un piso');
}
// saneo
{
  const s = sanearBonos({ origen: { ventaja: { dano: 0.1, saludMax: '12', inventada: 4, correr: NaN }, '__proto__': { dano: 1 }, vacio: {}, mal: 7, lista: [1], trofeo: { dano: Infinity } } });
  igual(s, { origen: { ventaja: { dano: 0.1, saludMax: 12 } } }, 'sanear deja sólo lo válido');
  for (const feo of [null, undefined, 7, 'x', [], { origen: [] }, { origen: 'x' }, { origen: null }, {}]) igual(sanearBonos(feo), { origen: {} }, `sanear ${JSON.stringify(feo)}`);
  const a = JSON.parse(JSON.stringify(s));
  igual(sanearBonos(a), s, 'sanear es idempotente');
}

// ================================================================ 2. las habilidades
igual(RAMAS.map((r) => r.id), ['tiro', 'reparar', 'aguante'], 'tres ramas');
ok(IDS_HABILIDAD.length === 6, 'seis habilidades');
for (const r of RAMAS) ok(IDS_HABILIDAD.filter((id) => HABILIDADES[id].rama === r.id).length === 2, `dos habilidades en ${r.nombre}`);
igual(COSTOS, [1, 2, 3], 'costos 1/2/3');
ok(NIVEL_MAX_HABILIDAD === 3, 'tres niveles');
for (const id of IDS_HABILIDAD) {
  const h = HABILIDADES[id];
  ok(h.texto.length === 3 && h.nombre && h.descripcion, `${id} tiene sus tres textos`);
  ok(h.bonos ? h.bonos.length === 3 : h.extra, `${id} tiene efectos`);
  if (h.bonos) for (const b of h.bonos) for (const k of Object.keys(b)) ok(BONOS_CLAVES.includes(k), `${id}: la clave ${k} es del contrato`);
  // cada nivel mejora al anterior
  if (h.bonos) for (const k of Object.keys(h.bonos[2])) ok(h.bonos[0][k] < h.bonos[1][k] && h.bonos[1][k] < h.bonos[2][k], `${id}.${k} crece con el nivel`);
}
{
  // los puntos: uno por noche, una sola vez por noche
  const d = { habilidades: habilidadesNuevas() };
  ok(puntoPorNoche(d, 1), 'la noche 1 da punto');
  ok(!puntoPorNoche(d, 1), 'pero una sola vez (recargar y volver a amanecer no suma)');
  igual(d.habilidades.puntos, 1, 'un punto');
  ok(puntoPorNoche(d, 2) && puntoPorNoche(d, 3), 'cada noche siguiente suma uno');
  igual(d.habilidades.puntos, 3, 'tres puntos en tres noches');
  ok(!puntoPorNoche(d, 2), 'una noche vieja no vuelve a dar');
  ok(!puntoPorNoche(d, 0) && !puntoPorNoche(d, NaN) && !puntoPorNoche(d, 'x') && !puntoPorNoche(null, 4), 'noches raras no dan nada');
  const sin = {};
  ok(puntoPorNoche(sin, 5) && sin.habilidades.puntos === 1, 'una partida sin habilidades las crea');
  // gastar
  igual(costoSiguiente(d.habilidades, 'pulso'), 1, 'el primer nivel cuesta 1');
  ok(puedeSubir(d.habilidades, 'pulso').ok, 'con 3 puntos se puede');
  igual(puedeSubir(d.habilidades, 'inventada').razon, 'no existe', 'una que no existe');
  let r = subirHabilidad(d, 'pulso');
  ok(r.ok && r.nivel === 1 && r.costo === 1 && d.habilidades.puntos === 2, 'subir al 1 cuesta 1');
  cerca(bonoDe(d, 'dano'), 0.06, 'el nivel 1 suma 6 % de daño');
  cerca(bonoDe(d, 'alcance'), 0.05, 'y 5 % de alcance');
  r = subirHabilidad(d, 'pulso');
  ok(r.ok && r.nivel === 2 && r.costo === 2 && d.habilidades.puntos === 0, 'subir al 2 cuesta 2');
  cerca(bonoDe(d, 'dano'), 0.12, 'el nivel 2 reemplaza al 1 (no se acumulan)');
  r = subirHabilidad(d, 'pulso');
  ok(!r.ok && r.razon === 'puntos' && r.faltan === 3 && d.habilidades.puntos === 0 && nivelDe(d.habilidades, 'pulso') === 2, 'sin puntos no sube y no cobra');
  d.habilidades.puntos = 10;
  r = subirHabilidad(d, 'pulso');
  ok(r.ok && r.nivel === 3 && d.habilidades.puntos === 7, 'el nivel 3 cuesta 3');
  cerca(bonoDe(d, 'dano'), 0.2, 'el nivel 3 suma 20 %');
  r = subirHabilidad(d, 'pulso');
  ok(!r.ok && r.razon === 'maximo' && d.habilidades.puntos === 7 && costoSiguiente(d.habilidades, 'pulso') === null, 'al máximo no se sube más ni cobra');
  igual(puntosGastados(d.habilidades), 6, 'una habilidad completa son 6 puntos');
  // varias habilidades y otros orígenes
  sumarBono(d, 'ventaja', 'dano', 0.1);
  subirHabilidad(d, 'corazon'); subirHabilidad(d, 'pies'); subirHabilidad(d, 'manos');
  cerca(bonoDe(d, 'dano'), 0.3, 'el daño suma habilidad y ventaja');
  cerca(bonoDe(d, 'saludMax'), 10, 'la salud máxima del nivel 1');
  cerca(bonoDe(d, 'correr'), 0.04, 'correr del nivel 1');
  cerca(bonoDe(d, 'reparar'), 0.25, 'reparar del nivel 1');
  aplicarHabilidadesABonos(d);
  cerca(bonoDe(d, 'dano'), 0.3, 'volver a aplicar no duplica');
  ok(Object.hasOwn(d.bonos.origen, 'ventaja') && Object.hasOwn(d.bonos.origen, 'habilidad'), 'cada uno con su origen');
  quitarBonosDeOrigen(d, 'habilidad');
  cerca(bonoDe(d, 'dano'), 0.1, 'sacar las habilidades deja la ventaja');
  aplicarHabilidadesABonos(d);
  cerca(bonoDe(d, 'dano'), 0.3, 'y se rehacen desde los niveles');
}
{
  // lo que no es un bono
  const d = { habilidades: habilidadesNuevas() };
  igual(golpesPorMaterial(d), GOLPES_BASE_POR_MATERIAL, 'sin la habilidad, un material rinde 3 golpes');
  igual(golpesPorMaterial({}), 3, 'sin partida, también');
  d.habilidades.niveles.material = 1; igual(golpesPorMaterial(d), 4, 'nivel 1: 4');
  d.habilidades.niveles.material = 2; igual(golpesPorMaterial(d), 5, 'nivel 2: 5');
  d.habilidades.niveles.material = 3; igual(golpesPorMaterial(d), 6, 'nivel 3: 6');
  cerca(menosDano(d), 0, 'sin Corazón no se esquiva nada');
  d.habilidades.niveles.corazon = 2; cerca(menosDano(d), 0.05, 'nivel 2: 5 %');
  d.habilidades.niveles.corazon = 3; cerca(menosDano(d), 0.1, 'nivel 3: 10 %');
  d.habilidades.niveles.corazon = 1; cerca(menosDano(d), 0, 'nivel 1: sólo salud');
}
{
  // se puede llegar al máximo en lo que dura una partida larga, pero no a todo
  const total = IDS_HABILIDAD.length * COSTOS.reduce((a, b) => a + b, 0);
  igual(total, 36, 'tener todo cuesta 36 puntos');
  ok(total > 25, 'hay que elegir: en las 25 noches de la campaña no alcanza para todo');
}
// saneo de las habilidades
igual(sanearHabilidades({ puntos: 4, noche: 7, niveles: { pulso: 2, corazon: 9, inventada: 3, pies: -1, manos: 'x' } }), { puntos: 4, noche: 7, niveles: { pulso: 2, corazon: 3 } }, 'sanear habilidades: niveles al rango, ids que existen');
for (const feo of [null, undefined, 3, 'x', [], { puntos: 'mucho', niveles: [] }, { puntos: -4, noche: -1 }, { puntos: 1e9 }]) {
  const s = sanearHabilidades(feo);
  ok(s.puntos >= 0 && s.puntos <= 99 && s.noche >= 0 && typeof s.niveles === 'object', `habilidades rotas cargan limpias: ${JSON.stringify(feo)}`);
}
ok(!Object.hasOwn(sanearHabilidades({ niveles: { ['__proto__']: 3, constructor: 3 } }).niveles, 'constructor'), 'un id con nombre de objeto no entra');

// ================================================================ 3. el bestiario que premia
igual(UMBRALES_ESTUDIO, [5, 15, 40], 'estudios a los 5, 15 y 40');
igual(TIPOS_ESTUDIO, ['rastreador', 'saltador', 'tirador', 'escupidor', 'bruto', 'excavador', 'volador', 'curandero', 'enjambre', 'jefe'], 'los diez tipos');
for (const t of TIPOS_ESTUDIO) ok(Object.hasOwn(BESTIARIO, t) && Object.hasOwn(TIPOS_ALIEN, t), `${t} está en el bestiario y es un duende`);
igual(umbralesDe('bruto'), [5, 15, 40], 'umbrales de un bruto');
igual(umbralesDe('enjambre'), [20, 60, 160], 'el enjambre, que viene de a docenas, con cuatro veces más');
{
  const b = (t, a) => ({ [t]: { vistos: 1, abatidos: a, dia: 1 } });
  igual([0, 4, 5, 14, 15, 39, 40, 500].map((a) => nivelEstudio(b('bruto', a), 'bruto')), [0, 0, 1, 1, 2, 2, 3, 3], 'el nivel según los abatidos');
  igual(nivelEstudio(b('mutado', 99), 'mutado'), 0, 'el viejo no se estudia (no es un tipo)');
  igual(nivelEstudio({}, 'bruto'), 0, 'sin registro, nivel 0');
  igual(nivelEstudio(null, 'bruto'), 0, 'sin bestiario, nivel 0');
  igual(subioEstudio('bruto', 4, 5), 1, 'al 5.º, estudio 1');
  igual(subioEstudio('bruto', 14, 15), 2, 'al 15.º, estudio 2');
  igual(subioEstudio('bruto', 39, 40), 3, 'al 40.º, estudio 3');
  igual(subioEstudio('bruto', 5, 6), 0, 'en el medio, nada');
  igual(subioEstudio('enjambre', 19, 20), 1, 'el enjambre al 20.º');
  igual(subioEstudio('enjambre', 4, 5), 0, 'y no al 5.º');
  igual(subioEstudio('mutado', 4, 5), 0, 'un no-tipo no sube');
  // el dato del estudio 1: con los números reales
  const vida = TIPOS_ALIEN.rastreador.vida;
  const texto = datoPuntoDebil('rastreador');
  ok(texto.includes(`${vida} de vida`) && texto.includes(`${Math.ceil(vida / ARMAS.lanza.dano)} golpes`), 'el punto débil dice la vida y los golpes de lanza');
  ok(datoPuntoDebil('enjambre').startsWith('Cae de un solo golpe'), 'al enjambre lo baja cualquier golpe');
  ok(datoPuntoDebil('jefe').includes('doble'), 'el jefe: la espalda vale doble');
  for (const t of TIPOS_ESTUDIO) ok(datoPuntoDebil(t).length > 30, `${t} tiene su dato de punto débil`);
  igual(datoPuntoDebil('mutado'), '', 'un no-tipo no tiene');
  // el estudio 2: por dónde viene
  const best = { bruto: { vistos: 3, abatidos: 6, dia: 2 } };
  ok(anotarLado(best, 'bruto', 'monte') && anotarLado(best, 'bruto', 'monte') && anotarLado(best, 'bruto', 'rio'), 'anotar lados');
  ok(!anotarLado(best, 'bruto', 'luna') && !anotarLado(best, 'bruto', undefined) && !anotarLado(best, 'otro', 'rio') && !anotarLado(null, 'bruto', 'rio'), 'un lado raro o un tipo sin registro no se anota');
  igual(ladoFrecuente(best, 'bruto'), { id: 'monte', nombre: 'el monte', n: 2, total: 3 }, 'el lado más visto');
  ok(datoLado(best, 'bruto').includes('el monte') && datoLado(best, 'bruto').includes('2 de 3'), 'el dato lo dice con los números');
  igual(ladoFrecuente({ bruto: { abatidos: 9 } }, 'bruto'), null, 'sin datos, nada');
  ok(datoLado({ bruto: { abatidos: 9 } }, 'bruto').includes('Todavía'), 'y lo dice');
  const siempre = { rastreador: { vistos: 1, abatidos: 3, dia: 1, lados: { rio: 4 } } };
  ok(datoLado(siempre, 'rastreador').startsWith('Siempre'), 'si siempre viene por el mismo');
  // el estudio 3: el daño
  cerca(danoContraTipo(b('bruto', 39), 'bruto'), 1, 'con 39 no hay bonus');
  cerca(danoContraTipo(b('bruto', 40), 'bruto'), 1 + DANO_ESTUDIADO, 'con 40, 5 % más');
  cerca(danoContraTipo(b('bruto', 40), 'tirador'), 1, 'sólo contra ese tipo');
  cerca(danoContraTipo(b('enjambre', 40), 'enjambre'), 1, 'el enjambre necesita 160');
  cerca(danoContraTipo(b('enjambre', 160), 'enjambre'), 1.05, 'y con 160 sí');
  cerca(danoContraTipo(null, 'bruto'), 1, 'sin bestiario nada');
  // la ficha
  const r0 = renglonesEstudio(b('bruto', 7), 'bruto');
  ok(r0.length === 3 && r0[0].hecho && r0[0].texto && !r0[1].hecho && r0[1].texto === null && r0[1].falta.includes('8 más'), 'los renglones: uno hecho, uno que falta con lo que falta');
  ok(renglonesEstudio(b('bruto', 40), 'bruto').every((x) => x.hecho && x.texto), 'con 40, todos hechos');
  igual(renglonesEstudio({}, 'mutado'), [], 'un no-tipo no tiene renglones');
}
// las fichas nuevas del bestiario y que anotar cuenta a los dos duendes de la 4.8
for (const t of ['curandero', 'enjambre']) {
  const b = {};
  const r = anotarBestiario(b, t, 'visto');
  ok(r.nuevo && b[t].vistos === 1, `${t} ahora se anota en el bestiario`);
  ok(BESTIARIO[t].visto && BESTIARIO[t].aprendido && BESTIARIO[t].debil && BESTIARIO[t].nombre, `${t} tiene su ficha`);
}
// el saneo del bestiario con los lados
igual(sanearBestiario({ bruto: { vistos: 2, abatidos: 6, dia: 3, lados: { rio: 4, monte: '2', luna: 9, camino: -3 } } }), { bruto: { vistos: 2, abatidos: 6, dia: 3, lados: { rio: 4, monte: 2 } } }, 'los lados se sanean');
igual(sanearBestiario({ bruto: { vistos: 2, abatidos: 6, dia: 3 } }), { bruto: { vistos: 2, abatidos: 6, dia: 3 } }, 'una partida vieja (sin lados) carga igual que antes');
igual(sanearBestiario({ bruto: { vistos: 1, abatidos: 1, dia: 1, lados: [1, 2] } }), { bruto: { vistos: 1, abatidos: 1, dia: 1 } }, 'lados que no son un objeto se descartan');

// ================================================================ 4. el estado y las partidas viejas
{
  const nueva = desafioNuevo();
  igual(nueva.bonos, { origen: {} }, 'una partida nueva no tiene bonos');
  igual(nueva.habilidades, { puntos: 0, noche: 0, niveles: {} }, 'ni puntos');
  // una partida vieja (de la 4.9) carga limpia
  const vieja = JSON.parse(JSON.stringify(desafioNuevo()));
  delete vieja.bonos; delete vieja.habilidades;
  const s = sanearDesafio(vieja);
  igual(s.bonos, { origen: {} }, 'una partida vieja carga sin bonos');
  igual(s.habilidades, { puntos: 0, noche: 0, niveles: {} }, 'ni habilidades');
  igual(s.salud, SALUD_MAX, 'con la salud de siempre');
  // guardar y abrir deja todo igual
  const d = desafioNuevo();
  d.habilidades = { puntos: 2, noche: 5, niveles: { corazon: 3, pulso: 1 } };
  aplicarHabilidadesABonos(d);
  sumarBono(d, 'ventaja', 'dano', 0.1);
  d.salud = 130;
  const ida = sanearDesafio(JSON.parse(JSON.stringify(d)));
  igual(ida.habilidades, d.habilidades, 'las habilidades sobreviven a guardar y abrir');
  igual(ida.bonos, d.bonos, 'los bonos también');
  igual(ida.salud, 130, 'y la salud por arriba de 100 (el Corazón la sube)');
  igual(sanearDesafio(JSON.parse(JSON.stringify(ida))), ida, 'idempotente');
  // el bono de las habilidades no se puede inventar editando el guardado: se rehace desde los niveles
  const tramposo = JSON.parse(JSON.stringify(d));
  tramposo.bonos.origen.habilidad = { dano: 5, saludMax: 999 };
  const t = sanearDesafio(tramposo);
  cerca(bonoDe(t, 'dano'), 0.16, 'los bonos de habilidad se rehacen desde los niveles (daño 6 % de Pulso + 10 % de la ventaja)');
  cerca(bonoDe(t, 'saludMax'), 35, 'y la salud máxima también');
  // sin Corazón, la salud vuelve al tope de siempre
  const sinCorazon = JSON.parse(JSON.stringify(d));
  sinCorazon.habilidades.niveles = {}; sinCorazon.salud = 500;
  igual(sanearDesafio(sinCorazon).salud, SALUD_MAX, 'la salud no pasa de 100 sin el Corazón');
  // roto
  for (const feo of [{ bonos: 5, habilidades: 'x' }, { bonos: { origen: 7 }, habilidades: [] }, { bonos: [], habilidades: { puntos: NaN, niveles: 3 } }, { bonos: null, habilidades: null }]) {
    const r = sanearDesafio(feo);
    ok(typeof r.bonos.origen === 'object' && r.habilidades.puntos === 0, `datos rotos cargan limpios: ${JSON.stringify(feo)}`);
  }
  // el estado nuevo no choca con el resto de lo guardado
  ok(Object.hasOwn(s, 'bestiario') && Object.hasOwn(s, 'aldea'), 'el resto del estado sigue');
}

// ================================================================ 5. la pestaña «Guardián»
let enfocado = null;
function nodo(tag, clase, texto) {
  const hijos = [], ev = {}, attrs = {};
  const x = {
    tag, className: clase || '', textContent: texto ?? '', hijos, dataset: {}, style: {}, disabled: false,
    appendChild(h) { hijos.push(h); return h; },
    setAttribute(k, v) { attrs[k] = v; }, getAttribute: (k) => attrs[k],
    addEventListener(e, f) { ev[e] = f; },
    click(detail = 1) { ev.click?.({ detail }); },
    querySelector(sel) {
      const todos = x.todo();
      if (sel === 'button[data-subir]:not([disabled])') return todos.find((h) => h.tag === 'button' && h.dataset.subir && !h.disabled) || null;
      const m = /^button\[data-id="(.+)"\]$/.exec(sel);
      return m ? todos.find((h) => h.tag === 'button' && h.dataset.id === m[1]) || null : null;
    },
    querySelectorAll() { return []; },
    focus() { enfocado = x; },
    todo() { return [x, ...hijos.flatMap((h) => (h.todo ? h.todo() : []))]; },
  };
  return x;
}
{
  const d = desafioNuevo();
  const notas = []; let guardados = 0;
  let mundo = null, lista, ficha;
  const redibujar = () => { lista = nodo('div'); ficha = nodo('div'); mundo.dibujarCuaderno(lista, ficha, nodo); };
  mundo = crearHabilidadesMundo({ D: () => d, nota: (t, s) => notas.push([t, s]), guardar: () => { guardados++; }, redibujar, sonido: {} });
  redibujar();
  const textos = (raiz) => raiz.todo().map((h) => h.textContent).filter(Boolean);
  ok(textos(lista).includes('Puntos del guardián: 0'), 'se ven los puntos');
  ok(['Tiro · Pulso firme', 'Tiro · Mano ligera', 'Reparar · Manos hábiles', 'Reparar · Material justo', 'Aguante · Corazón de coihue', 'Aguante · Pies de zorro'].every((r) => textos(lista).includes(r)), 'se ven las seis habilidades con su rama');
  const botones = (raiz) => raiz.todo().filter((h) => h.tag === 'button');
  const botonesLista = botones(lista).filter((b) => b.dataset.id);
  ok(botonesLista.length === 6, 'seis habilidades para elegir');
  const subirBtn = () => botones(ficha).find((b) => b.dataset.subir);
  ok(subirBtn().disabled && /falta 1 punto/.test(subirBtn().textContent), 'sin puntos el botón está apagado y dice cuánto falta');
  d.habilidades.puntos = 3;
  redibujar();
  ok(textos(lista).includes('Puntos del guardián: 3') && !subirBtn().disabled, 'con puntos se enciende');
  // elegir otra con el ratón
  botones(lista).filter((b) => b.dataset.id).find((b) => b.dataset.id === 'pies').click();
  ok(mundo.elegida === 'pies' && textos(ficha).includes('Pies de zorro'), 'elegir con el ratón muestra su ficha');
  subirBtn().click();
  ok(nivelDe(d.habilidades, 'pies') === 1 && d.habilidades.puntos === 2 && guardados === 1, 'subir con el ratón gasta, sube y guarda');
  ok(notas.some(([t]) => /Pies de zorro: nivel 1/.test(t)), 'avisa');
  cerca(bonoDe(d, 'correr'), 0.04, 'y el bono de correr está en el estado');
  ok(textos(ficha).some((t) => /Corrés un 4 % más rápido/.test(t)) && textos(ficha).some((t) => t.startsWith('Velocidad al correr: +4 %')), 'la ficha muestra lo que sumás ahora');
  // con el teclado: Enter elige (detail 0), el foco pasa al botón de subir, y Enter otra vez sube
  enfocado = null;
  botones(lista).filter((b) => b.dataset.id).find((b) => b.dataset.id === 'pies').click(0);
  ok(enfocado && enfocado.dataset.subir === '1', 'con el teclado, elegir pasa el foco al botón de subir');
  enfocado = null;
  botones(lista).filter((b) => b.dataset.id).find((b) => b.dataset.id === 'corazon').click(1);
  ok(enfocado && enfocado.dataset.id === 'corazon', 'con el ratón, el foco queda en la habilidad elegida');
  botones(lista).filter((b) => b.dataset.id).find((b) => b.dataset.id === 'pies').click(0);
  subirBtn().click(0);
  ok(nivelDe(d.habilidades, 'pies') === 2 && d.habilidades.puntos === 0, 'con el teclado también (nivel 2 cuesta 2)');
  subirBtn().click();
  ok(nivelDe(d.habilidades, 'pies') === 2 && notas.some(([t, s]) => /Pies de zorro/.test(t) && /faltan 3 puntos|falta/.test(s)) , 'sin puntos no sube y avisa');
  ok(/(falta|faltan)/.test(subirBtn().textContent) && subirBtn().disabled, 'el botón apagado');
  d.habilidades.puntos = 9;
  for (let i = 0; i < 3; i++) { redibujar(); subirBtn()?.click(); }
  ok(nivelDe(d.habilidades, 'pies') === 3 && /máximo/.test(subirBtn().textContent) && subirBtn().disabled, 'al máximo el botón lo dice');
  ok(textos(lista).includes('al máximo'), 'y la lista también');
  // el resumen
  const e = desafioNuevo();
  igual(resumenDeBonos(e), [], 'sin nada, el resumen está vacío');
  e.habilidades = { puntos: 0, noche: 0, niveles: { corazon: 3, material: 2, manos: 1, manoligera: 1, pulso: 1 } };
  aplicarHabilidadesABonos(e);
  const filas = resumenDeBonos(e);
  ok(filas.includes('Salud máxima: 135 (+35)') && filas.some((f) => f.startsWith('Daño recibido: -10 %')) && filas.includes('Martillo: 5 golpes por material'), `el resumen dice la salud, el daño recibido y el martillo: ${filas.join(' | ')}`);
  ok(filas.some((f) => f.startsWith('Espera entre ataques: -6 %')) && filas.some((f) => f.startsWith('Daño de las armas: +6 %')), 'y la espera y el daño');
}

// ================================================================ 6. el enganche con el juego
const des = leer('src/desafio.js'), main = leer('src/main.js'), jug = leer('src/jugador.js'), reglas = leer('src/desafio-reglas.js');
ok(/import \{ armaConBonos, saludMaximaConBonos, bonoAplicado \} from '\.\/desafio-bonos\.js';/.test(des), 'desafio.js importa los bonos');
ok(des.includes('const arma = armaConBonos(armaEfectiva(id, progreso().cosas), D());'), 'atacar usa el arma con los bonos');
ok(des.split('armaConBonos(armaEfectiva(').length === 3, 'las dos armas del juego (atacar y el disparo cargado) pasan por los bonos');
ok(!/const arma = armaEfectiva\(/.test(des), 'y ninguna se saltea los bonos');
ok(des.includes('const saludMaxima = () => saludMaximaConBonos(SALUD_MAX, D());'), 'la salud máxima sale de los bonos');
ok(!/d\.salud (>=|<) SALUD_MAX|Math\.min\(SALUD_MAX/.test(des), 'curar, regenerar y la barra ya no usan el 100 fijo');
ok(des.includes('function levantarse() { caido = false; D().salud = saludMaxima();'), 'al levantarte, la salud entera es la máxima');
ok(enUnaLinea(des, ['if (desde) n *= 1 - menosDano(d);']), 'el golpe recibido pasa por «Corazón de coihue»');
ok(des.includes("relojBonos = 0.5; js.bonoCorrer = bonoAplicado(d, 'correr');"), 'el bono de correr se le lleva al jugador cada medio segundo (no por cuadro)');
ok(jug.includes('estado.corriendo && estado.bonoCorrer) vmax *= 1 + Math.max(-0.3, Math.min(0.35, estado.bonoCorrer));'), 'jugador.js lo usa corriendo y a pie');
ok(des.includes("const golpesMat = golpesPorMaterial(D()), rinde = 1 + bonoAplicado(D(), 'reparar');") && des.includes('pendienteMartillo += 1 / golpesMat;') && des.includes('max * 0.1 * rinde'), 'el martillo: más rendimiento y más material por golpe');
ok(des.includes("c.cantidad = Math.max(1, Math.ceil(c.cantidad / (1 + bonoAplicado(D(), 'reparar'))));") && des.includes("max * 0.3 * e.costo.cantidad * (1 + bonoAplicado(d, 'reparar'))"), 'reparar con R: cuesta menos y cura lo mismo o más');
ok(des.includes('if (puntoPorNoche(d, d.oleadas))'), 'al amanecer se da el punto');
{
  const i = des.indexOf('function amanecer()'), f = des.indexOf('// ---------------- logros y récords', i);
  ok(i > 0 && f > i && des.slice(i, f).includes('puntoPorNoche'), 'el punto se da en amanecer() (una noche aguantada) y no en otro lado');
  ok(des.split('puntoPorNoche(').length === 2, 'puntoPorNoche se llama una sola vez');
}
ok(des.includes("if (fuente === 'jugador' || fuente === 'lanza') dano *= danoContraTipo(D().bestiario, a.tipo);"), 'el estudio 3 sube el daño del jugador contra ese tipo');
ok(des.includes('if (est) bestiarioPendiente.push(t(`${nombre}: estudio ${est} de 3`));') && des.includes('anotarLado(d.bestiario, tipo, d.ladoNoche?.id);') && des.includes('subioEstudio(tipo, abatidosAntes, d.bestiario[tipo].abatidos)'), 'al abatir se anota el lado y se avisa el estudio');
ok(des.includes('habilidadesMundo,   // 4.10 guardian'), 'el juego ofrece la pestaña');
ok(/if \(desafio\?\.habilidadesMundo\) pestanas\.push\(\['guardian'/.test(main) && main.includes("pestana === 'guardian' && desafio?.habilidadesMundo"), 'main.js suma la pestaña «Guardián» (sólo en el Desafío)');
ok(main.includes('renglonesEstudio(best, t)'), 'main.js muestra los estudios en el bestiario');
ok(main.includes('desafio?.saludMaxima?.() ?? SALUD_MAX'), 'la caída guarda la salud máxima de la partida');
ok(reglas.includes('bonos, habilidades,   // 4.10 guardian'), 'sanearDesafio guarda bonos y habilidades');
// nada por cuadro: las habilidades no tienen "actualizar" y el único código por cuadro es una resta y una comparación
{
  const mundo = leer('src/desafio-habilidades-mundo.js');
  ok(!/actualizar|requestAnimationFrame|setInterval/.test(mundo), 'la pantalla del Guardián no corre por cuadro');
  ok(!/from 'three'/.test(leer('src/desafio-bonos.js') + leer('src/desafio-habilidades.js') + leer('src/desafio-bestiario-premia.js')), 'los módulos de reglas son puros (sin three)');
  ok(!/\bdocument\b|\bwindow\b/.test(leer('src/desafio-bonos.js') + leer('src/desafio-habilidades.js') + leer('src/desafio-bestiario-premia.js')), 'y sin DOM');
  const sinHud = des.split('\n').filter((l) => l.includes('relojBonos'));
  ok(sinHud.length === 3, 'el reloj de los bonos es una declaración, una resta y una comparación por cuadro');
}
// los invasores se reciclan: no se agregó ningún campo por invasor
ok(!/a\.estudio|a\.bonoCorrer|alien\.bono/.test(des), 'ningún campo nuevo por invasor (nada que limpiar en bajarAlien)');
// no hay una interacción nueva (la E y el aviso salen de interacciones.js)
ok(!leer('src/interacciones.js').includes('guardian'), 'la pestaña se abre con el cuaderno (J): no suma una E');

console.log(`✓ 4.10 (guardian): ${n} comprobaciones · bonos, habilidades del guardián, bestiario que premia, partidas viejas y la pestaña Guardián`);
