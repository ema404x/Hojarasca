// 4.18.4 (zona B): comprobaciones de los bugs del pase de búsqueda en el juego base (sin la Historia). Cada bloque dice el id del informe (BUGS_4_18_4_B.md).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- B-01 · la trochita varada al amanecer (Desafío)
// `cerrarVarada` (amanecer o caída con la trochita varada y sin escoltar) llamaba a `tren.soltar(0)`: desde la 4.0.3 esa es la de la caída
// (`soltar(jugador)`), así que tiraba «Cannot set properties of undefined (setting 'enTren')» en pleno `amanecer()`: el tren quedaba varado para
// siempre y no se hacía el resto del amanecer (capullos nuevos, lugares tomados, evolución, puestos, récord de la semilla).
// Se ejecuta la función REAL de desafio.js contra la trochita REAL del valle.
{
  const fuente = leer('src/desafio.js');
  const m = /^  function cerrarVarada\(avisar\) \{[\s\S]*?\n  \}\n/m.exec(fuente);
  ok(!!m, 'desafio.js tiene cerrarVarada');
  const { valle } = cargarValle();
  const { tren } = valle();
  // la función se corre con `D()` devolviendo un objeto que se puede mirar después
  const correr = (texto, varada, avisar) => {
    const d = { varada: { ...varada } };
    const notas = [];
    const cuerpo = new Function('D', 'trenDelDesafio', 'ctx', `${texto}\nreturn cerrarVarada;`)(() => d, () => tren, { nota: (t) => notas.push(t) });
    cuerpo(avisar);
    return { d, notas };
  };
  const varada = { s: 100, llego: false, roto: false };

  // sin escoltar: el tren se suelta (no queda varado), la varada se cierra y avisa que siguió sola
  tren.varar(100);
  ok(tren.est.varado === true, 'preparación: el tren queda varado');
  let r;
  assert.doesNotThrow(() => { r = correr(m[0], varada, true); }, 'cerrarVarada no tira con el tren varado sin escoltar');
  n++;
  ok(tren.est.varado === false, 'B-01: al amanecer el tren deja de estar varado (sigue su camino)');
  ok(r.d.varada === null, 'B-01: la varada queda cerrada');
  ok(r.notas.some((t) => /siguió sola/.test(t)), 'B-01: avisa que la trochita siguió sola con la luz');

  // cayendo (avisar en falso): lo mismo, sin aviso
  tren.varar(200);
  assert.doesNotThrow(() => { r = correr(m[0], varada, false); });
  n++;
  ok(tren.est.varado === false && r.d.varada === null && r.notas.length === 0, 'B-01: si caíste, el tren también sigue (y sin aviso)');

  // llegó a la estación: no se toca (ya lo soltó actualizarVarada)
  tren.varar(300);
  r = correr(m[0], { ...varada, llego: true }, true);
  ok(tren.est.varado === true && r.notas.length === 0, 'B-01: una varada que ya llegó no suelta nada de más');
  tren.soltarVarada(0);

  // MUTACIÓN: con la llamada vieja (`soltar(0)`) la prueba tiene que fallar
  const vieja = m[0].replace('tr?.soltarVarada?.(0)', 'tr?.soltar?.(0)');
  ok(vieja !== m[0], 'mutación: se pudo volver a la llamada vieja');
  tren.varar(100);
  assert.throws(() => correr(vieja, varada, true), /enTren/);
  n++;
  tren.soltarVarada(0);
}

console.log(`OK 4.18.4 B · ${n} verificaciones`);
