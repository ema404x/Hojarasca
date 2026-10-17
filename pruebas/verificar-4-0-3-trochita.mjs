// 4.0.3: F1 de la zona F. `trochita.js` definía `soltar` dos veces y la segunda pisaba a la de la caída en el Desafío (4.0.1 D2).
// Esta prueba EJECUTA las dos funciones sobre la trochita real del valle (la de 4.0.1 sólo buscaba texto en main.js).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// no queda ninguna función repetida en el mismo ámbito de trochita.js (el origen del bug)
{
  const t = leer('src/trochita.js');
  const nombres = [...t.matchAll(/^  function ([A-Za-z_$][\w$]*)\(/gm)].map((m) => m[1]);
  const rep = nombres.filter((x, i) => nombres.indexOf(x) !== i);
  ok(rep.length === 0, `trochita.js: sin funciones repetidas (${rep.join(', ')})`);
}

const { valle } = cargarValle();
const { tren } = valle();

// la de la caída: baja al jugador y no toca el tiempo de parada
{
  const jugador = { estado: { enTren: true, agachado: false }, ubicar() { throw new Error('soltar no debe teletransportar'); } };
  tren.est.subido = true; tren.est.parado = 0; tren.est.varado = false; tren.est.proxima = 3;
  tren.soltar(jugador);
  ok(jugador.estado.enTren === false, 'soltar(jugador): el jugador deja de estar en el tren');
  ok(tren.est.subido === false, 'soltar(jugador): el tren ya no te lleva');
  ok(typeof tren.est.parado === 'number', 'soltar(jugador): est.parado sigue siendo un número (antes quedaba el objeto jugador)');
  ok(tren.est.proxima === 3, 'soltar(jugador): no cambia la próxima parada');
  ok(tren.viajando() === false, 'soltar(jugador): viajando() da falso');
}
// con el tren parado en el andén también
{
  const jugador = { estado: { enTren: true }, ubicar() {} };
  tren.est.subido = true; tren.est.parado = 12;
  tren.soltar(jugador);
  ok(tren.est.parado === 12 && jugador.estado.enTren === false, 'soltar(jugador): respeta la espera del andén');
}
// la del Desafío (varada): suelta el tren varado y espera lo que se le pide
{
  tren.varar(100);
  ok(tren.est.varado === true && tren.est.vel === 0, 'varar: queda varado');
  tren.soltarVarada(35);
  ok(tren.est.varado === false, 'soltarVarada: el tren deja de estar varado');
  ok(tren.est.parado === 35, 'soltarVarada: espera 35 s');
  ok(tren.est.velVarado === 0, 'soltarVarada: sin velocidad de varado');
}
// los llamadores usan el nombre correcto
{
  const d = leer('src/desafio.js'), m = leer('src/main.js');
  ok(d.includes('tr.soltarVarada(35)') && !d.includes('tr.soltar(35)'), 'desafio.js llama a soltarVarada');
  ok(m.includes('tren.soltar(jugador)'), 'main.js llama a soltar(jugador) en la caída');
}
console.log(`OK 4.0.3 trochita · ${n} verificaciones · soltar(jugador) baja al jugador de verdad y soltarVarada es otra función`);
