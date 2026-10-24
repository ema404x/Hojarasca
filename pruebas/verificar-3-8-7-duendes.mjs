// 3.8.7 (duendes): el pase de bugs de La noche de los duendes, segunda mirada.
//  1. El río se vadea: el agua los frenaba siempre y, con el río entre ellos y su blanco, pasaban la noche en la
//     orilla (medido en partida real con humo-3-8-7-duendes: LENGA-7 y COIHUE-3, de 1 a 9 trabados por noche). El
//     lago se rodea siempre para el mismo lado.
//  2. La hachuela o la jabalina que iba en el aire al guardar se perdía (se anotaba como tirada recién al caer).
//  3. La casilla elegida de la barra se guarda también cuando la marca sigue a lo elegido (gastar el último emplasto
//     corría las armas de después y al abrir quedaba elegida otra).
// Donde se puede, el código de verdad corre en Node.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const des = leer('src/desafio.js');
const R = await import('../src/desafio-duendes-reglas.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. el río se vadea, el lago se rodea
{
  const rio = { nivel: 3, prof: 1.2, lago: false }, lago = { nivel: 0, prof: 4, lago: true };
  ok(!R.aguaFrena(null, 0), 'en seco no frena');
  ok(R.aguaFrena(rio, 0), 'el río frena al llegar a la orilla');
  ok(R.aguaFrena(rio, R.VADO.espera * 0.9), 'un ratito en la orilla');
  ok(!R.aguaFrena(rio, R.VADO.espera), 'y después se mete');
  ok(!R.aguaFrena({ nivel: 3, prof: 2.4, lago: false }, R.VADO.espera), 'aunque el río sea hondo en ese tramo (si no, quedaba trabado igual)');
  ok(R.aguaFrena(lago, 0) && R.aguaFrena(lago, 999), 'el lago no se vadea nunca');
  ok(R.VADO.lento > 0 && R.VADO.lento < 1, 'en el río va más despacio');
  ok(des.includes('fuera || (!T.agua(p.x, p.z) && aguaFrena(wSig, a.orilla))'), 'el paso usa aguaFrena con los segundos en la orilla');
  ok(des.includes('if (!fuera && wSig && !wSig.lago) a.orilla = (a.orilla || 0) + dt;'), 'frenado por el río, cuenta');
  ok(des.includes('if (!wSig) a.orilla = 0;'), 'en seco se olvida');
  ok(des.includes("const paso = velObj * dt * (T.agua(p.x, p.z) ? VADO.lento : 1);"), 'en el agua, el paso es más corto');
  ok(/a\.salto = null; a\.orilla = 0;/.test(des), 'el duende reciclado no trae la orilla de su vida anterior (bajarAlien)');
  ok(des.includes('const r = a.rumbo + a.sentido * k * 0.38'), 'la orilla del lago se sigue para su lado (a.sentido), no al azar');
}

// ---------------------------------------------------------------- 2. lo tirado en el aire se anota al salir de la mano
{
  const ars = leer('src/desafio-arsenal-mundo.js');
  const i = ars.indexOf('function lanzar('), lanzar = ars.slice(i, ars.indexOf('\n  }\n', i));
  ok(lanzar.includes('if (RECUPERABLES[tipo]) anotarTirada(RECUPERABLES[tipo], 1);'), 'lanzar anota la hachuela y la jabalina');
  const j = ars.indexOf('function dejarEnElSuelo('), dejar = ars.slice(j, ars.indexOf('\n  }\n', j));
  ok(!dejar.includes('anotarTirada(RECUPERABLES[tipo], 1)'), 'al caer no se anota dos veces');
  ok(dejar.includes('anotarTirada(RECUPERABLES[tipo], -1); volverATusCosas(RECUPERABLES[tipo]); return;'), 'si vuelve directo, se desanota');
}
// ---------------------------------------------------------------- 3. la casilla guardada sigue a lo elegido
{
  const main = leer('src/main.js');
  ok(main.includes('if (sg.seguir) { elegida = sg.elegida; progreso.ranura = elegida; }'), 'refrescarBarra guarda la casilla nueva de lo elegido');   // 4.10.2: ahora por seguirElegida (sólo si sigue en una de las 8 casillas)
}

// ---------------------------------------------------------------- 4. la pantalla de la corrida sin fin respeta la pausa y la portada
{
  const main = leer('src/main.js');
  const i = main.indexOf('const cerrarCorrida = () => {'), c = main.slice(i, main.indexOf('setTimeout(cerrarCorrida, 1600);', i));
  ok(i > 0 && c.includes("if (modo === 'pausa' || modo === 'dialogo' || modo === 'valle' || modo === 'cuaderno' || modo === 'mapa' || modo === 'trucos') { setTimeout(cerrarCorrida, 700); return; }"), 'pausado en el fundido, espera a que vuelvas');
  ok(c.includes("if (modo === 'jugando') mostrarCorrida();"), 'sólo se abre si seguís en el juego (no sobre la portada)');
}

// ---------------------------------------------------------------- 5. las partículas se preparan en el primer cuadro, no en el primer golpe
{
  const ef = leer('src/desafio-efectos.js');
  const i = ef.indexOf('function precalentar() {'), c = ef.slice(i, ef.indexOf('\n  }\n', i));
  ok(i > 0 && c.includes('lanzarAstillas(') && c.includes('lanzarGotas('), 'emite una partícula sólida y una brillante (cada nube compila su programa)');
  ok(c.includes('y: -900'), 'bajo el suelo: nadie la ve');
  ok(/actualizar, limpiar, precalentar,/.test(ef), 'efectos la exporta');
  ok(des.includes('efectos.precalentar?.();'), 'desafio.js la llama en el primer cuadro (primerCuadro)');
  ok(des.indexOf('efectos.precalentar?.();') > des.indexOf('for (const a of precalentados) soltarAlien(a);'), 'junto a la preparación de los duendes');
}

console.log(`verificar-3-8-7-duendes: ${n} comprobaciones OK`);
