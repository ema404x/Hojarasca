// 4.0: el musgo pintado de las piedras. Puro Node: la geometría de la piedra lleva el puntaje de musgo en el aTipo de cada
// vértice (cara de arriba, grietas, manchas), con transición suave; abajo piedra oscura; sólo en calidad media y alta; el
// shader lo convierte en color con un umbral suave y sin mallas ni dibujos de más.
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { roca, ruido3, puntajeMusgo } = await import('../src/vegetacion.js');

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const mat = leer('src/materiales.js'), veg = leer('src/vegetacion.js');

// la roca de siempre (calidad baja): nada nuevo, sigue en tipo 4 liso
const vieja = roca(7, false), va = vieja.attributes.aTipo;
for (let i = 0; i < va.count; i++) assert.equal(va.getX(i), 4, 'sin musgo: todos los vértices en tipo 4');
const triV = (vieja.index ? vieja.index.count : vieja.attributes.position.count) / 3;
assert.ok(triV <= 100, `la piedra de siempre: pocas caras (${triV})`);

// la roca con musgo
const g = roca(7, true), t = g.attributes.aTipo, n = g.attributes.normal, p = g.attributes.position;
const tri = (g.index ? g.index.count : p.count) / 3;
assert.ok(tri >= 600 && tri <= 800, `más caras para el borde fino, sin pasarse (${tri})`);
let mn = 9, mx = 0, arriba = [], lado = [], abajo = [], conMusgo = 0, sinMusgo = 0;
for (let i = 0; i < t.count; i++) {
  const v = t.getX(i), ny = n.getY(i);
  mn = Math.min(mn, v); mx = Math.max(mx, v);
  assert.ok(v >= 4 && v <= 4.95 + 1e-6, 'el tipo queda entre 4 y 4,95 (sigue siendo roca para el resto del shader)');
  (ny > 0.8 ? arriba : ny > -0.2 ? lado : abajo).push(v);
  if (v > 4.5) conMusgo++; else if (v < 4.3) sinMusgo++;
}
const media = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
assert.ok(arriba.length > 20 && lado.length > 20 && abajo.length > 20, 'hay vértices de las tres zonas');
assert.ok(media(arriba) > media(lado) + 0.1, `arriba más musgo que de costado (${media(arriba).toFixed(2)} vs ${media(lado).toFixed(2)})`);
assert.ok(media(lado) > media(abajo), 'de costado más que abajo');
assert.ok(mx - mn > 0.5, 'hay de todo: piedra pelada y musgo');
assert.ok(conMusgo > t.count * 0.1 && sinMusgo > t.count * 0.1, 'ni toda verde ni toda gris (el borde irregular existe)');

// transición suave: entre vértices vecinos el puntaje cambia poco (nada de cortes duros ni ruido de sal y pimienta)
let saltoMax = 0, aristas = 0; const saltos = [];
const ix = g.index;
for (let f = 0; f < tri; f++) for (let e = 0; e < 3; e++) {
  const a = ix ? ix.getX(f * 3 + e) : f * 3 + e, b = ix ? ix.getX(f * 3 + (e + 1) % 3) : f * 3 + (e + 1) % 3;
  const d = Math.abs(t.getX(a) - t.getX(b)); saltos.push(d); saltoMax = Math.max(saltoMax, d); aristas++;
}
saltos.sort((x, y) => x - y);
const p95 = saltos[Math.floor(saltos.length * 0.95)];
assert.ok(p95 < 0.4, `el 95 % de las aristas cambia poco (${p95.toFixed(2)} de 0,95)`);
assert.ok(saltoMax < 0.7, `y ninguna cambia de golpe (salto máximo ${saltoMax.toFixed(2)}, sólo en el canto de la piedra)`);

// determinista y acotado
assert.equal(ruido3(1.3, 2.7, -0.4), ruido3(1.3, 2.7, -0.4));
for (let i = 0; i < 500; i++) { const v = puntajeMusgo(Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3), Math.sin(i * 2.1)); assert.ok(v >= 0 && v <= 1); }
assert.ok(puntajeMusgo(0, 1, 0, 1) > puntajeMusgo(0, -1, 0, -1), 'arriba, más que abajo');

// sólo calidad media y alta (pasto >= 40000); la baja y la muy baja, la piedra de siempre
assert.ok(veg.includes('const musgo = calidad.pasto >= 40000;'));
assert.ok(veg.includes("registrar('roca', roca(7, musgo), null, mats.roca, 'soto');"));
for (const [nombre, pasto] of [['muybaja', 9000], ['baja', 18000], ['media', 40000], ['alta', 82000]]) {
  const cfg = leer('src/config.js');
  assert.ok(new RegExp(`${nombre}: \{ pasto: ${pasto},`).test(cfg), `${nombre} tiene pasto ${pasto}`);
}
// el shader: umbral suave por roca, del lado del sol más alto; sin llamadas de dibujo nuevas (todo por vértice)
assert.ok(mat.includes('if (aTipo > 4.01) {'), 'sólo las rocas con musgo (los techos son 4 justo)');
assert.ok(mat.includes('float musgoM = smoothstep(umbralM, umbralM + 0.4, puntajeM);'), 'borde que se desvanece');
assert.ok(mat.includes('umbralM = 0.34 + 0.2 * azar + 0.24 * ladoSolM'), 'cada roca con su umbral y menos musgo al sol');
assert.ok(mat.includes('.z);') && mat.includes('normalize(mat3(instanceMatrix) * normal).z'), 'el sol sale por +z (cielo.js): la sombra, hacia -z');
assert.ok(mat.indexOf('if (aTipo > 4.01) {') < mat.indexOf('float nyNieve = normal.y;'), 'el musgo va antes de la nieve (la nieve lo tapa)');
console.log(`musgo 4.0 OK: ${tri} caras por piedra, ${(100 * conMusgo / t.count).toFixed(0)} % de vértices con musgo, salto máximo ${saltoMax.toFixed(2)}`);
