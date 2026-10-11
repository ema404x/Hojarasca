// 3.8.7 (duendes): el pase de bugs de La noche de los duendes, segunda mirada.
//  1. El río se vadea: el agua los frenaba siempre y, con el río entre ellos y su blanco, pasaban la noche en la
//     orilla (medido en partida real con humo-3-8-7-duendes: LENGA-7 y COIHUE-3, de 1 a 9 trabados por noche). El
//     lago se rodea siempre para el mismo lado.
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

console.log(`verificar-3-8-7-duendes: ${n} comprobaciones OK`);
