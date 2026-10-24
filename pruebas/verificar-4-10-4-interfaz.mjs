// 4.10.4 — interfaz y partidas (zona R2): EJECUTA las funciones de main.js con un mundo de mentira.
//   R2-2 el clic de «Seguir recorriendo» no atrapa el mouse con un panel abierto debajo   R2-4 una partida nueva no muestra «Partida recuperada»
//   R2-5 el fallo al empezar de nuevo se dice con un cuadro y la semilla del Coihue se acredita recién cuando la nueva cupo
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { funcion } from './ayuda-codigo.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

// R2-2: el manejador del clic llama a volverAlJuego(sinMouse) con «hay un panel abierto debajo»
for (const id of ['btn-seguir', 'cerrar-cuaderno', 'cerrar-mapa']) {
  const inicio = `$('${id}').addEventListener('click', `;
  const linea = main.split('\n').find((l) => l.startsWith(inicio));
  ok(linea, `main.js engancha ${id}`);
  const cuerpo = linea.slice(inicio.length).replace(/\);\s*(\/\/.*)?$/, '');
  for (const panel of [true, false]) {
    const llamadas = [];
    const f = new Function('volverAlJuego', 'panelDelHudAbierto', `return (${cuerpo});`)((...a) => llamadas.push(a), () => panel);
    ok(typeof f === 'function', `${id}: el manejador es una función propia`);
    f({ type: 'click' });
    eq(llamadas, [[panel]], `${id}: con ${panel ? 'un panel abierto debajo el mouse queda suelto' : 'nada debajo el mouse se atrapa'}`);
  }
}

// R2-4: olvidarRecuperada borra la marca de la sesión y la bandera
{
  const sesion = new Map([['hojarasca-recuperada-pendiente', '1']]);
  const env = { recuperadaPendiente: true, CLAVE_RECUPERADA: 'hojarasca-recuperada-pendiente', sessionStorage: { removeItem: (k) => sesion.delete(k) } };
  funcion(main, 'olvidarRecuperada', env)();
  ok(!sesion.has('hojarasca-recuperada-pendiente') && env.recuperadaPendiente === false, 'olvidarRecuperada borra la marca y la bandera');
  // y se llama en las tres salidas con éxito (Empezar de nuevo, Otra vuelta, Otra corrida) y no en las de falla
  const ocurrencias = main.split('olvidarRecuperada();').length - 1;
  eq(ocurrencias, 3, 'se olvida la marca al empezar de nuevo, al otra vuelta y al otra corrida');
}

// R2-5: la falla se dice con una nota y un cuadro
{
  const notas = [], cuadros = [];
  funcion(main, 'avisarFalla', { nota: (...a) => notas.push(a), dialogos: { confirmar: (t, o) => { cuadros.push([t, o]); return Promise.resolve(true); } } })('No pude empezar de nuevo', 'No hay lugar');
  eq(notas.length, 1, 'sale la nota');
  ok(cuadros.length === 1 && cuadros[0][0].includes('No pude empezar de nuevo') && cuadros[0][0].includes('No hay lugar'), 'y un cuadro con el mismo texto');
  funcion(main, 'avisarFalla', { nota() {}, dialogos: { confirmar() { throw new Error('sin cuadro'); } } })('a', 'b');
  ok(true, 'si el cuadro falla no se rompe');
  // la semilla del Coihue se acredita DESPUÉS del reemplazo logrado
  const t = main.slice(main.indexOf("$('btn-nuevo').addEventListener('click'"), main.indexOf("$('btn-seguir')"));
  const iReemplazo = t.indexOf('if (!reemplazarProgreso(nueva))'), iMeta = t.indexOf('metaJuego.terminar()');
  ok(iReemplazo > 0 && iMeta > iReemplazo, 'metaJuego.terminar() va después de reemplazarProgreso');
  ok(t.includes("avisarFalla('No pude empezar de nuevo'"), 'el fallo usa avisarFalla');
}

// R2-6: el Coihue de la noche final también calza las patas (después de animarlas, y no mientras cae)
{
  const ev = fs.readFileSync(new URL('../src/desafio-eventos.js', import.meta.url), 'utf8');
  const i = ev.indexOf('animarCoihue(n, n.reloj, paso);'), j = ev.indexOf('calzarPatasCoihue(n, T.altura, px, pz, n.g.rotation.y)');
  ok(i > 0 && j > i && j - i < 200, 'actualizarNodriza calza las patas justo después de animarlas');
  ok(ev.includes("if (n.fase !== 'cayendo') calzarPatasCoihue"), 'y no mientras cae');
  ok(ev.split('\n').some((l) => l.startsWith('import {') && l.includes('calzarPatasCoihue') && l.includes('./desafio-coihue-formas.js')), 'importa calzarPatasCoihue');
}
console.log(`verificar-4-10-4-interfaz: ${pasos} pasos ok`);
