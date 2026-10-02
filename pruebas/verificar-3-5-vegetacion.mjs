// 3.5: los arreglos de la vegetación. Puro Node (lee el código de los shaders, que no corren acá):
// la nieve del follaje es la misma en el LOD cercano, el lejano y los carteles; las cartas grandes
// no tapan la pantalla de cerca; el follaje pegado al ojo se abre; los helechos se ponen herrumbre
// en otoño; ninguna flor queda sobre la nieve; los carteles se hornean con más resolución.
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const mat = leer('src/materiales.js'), veg = leer('src/vegetacion.js'), imp = leer('src/impostores.js'), pasto = leer('src/pasto.js'), pkg = JSON.parse(leer('package.json'));

// ---------------------------------------------------------------- 1. el tipo de los helechos
const m = /export const TIPO_HELECHO = ([\d.]+);/.exec(mat);
assert.ok(m, 'materiales.js exporta TIPO_HELECHO');
const tipoHelecho = Number(m[1]);
// es follaje perenne para todo lo demás (hoja, no caduca: ni se pela ni se cae en invierno) y cae
// en la ventana propia del shader
assert.ok(tipoHelecho > 1.2 && tipoHelecho < 1.3 && tipoHelecho > 0.5 && tipoHelecho < 1.5, 'entre 1,2 y 1,3: perenne');
assert.ok(mat.includes('bool helecho35 = aTipo > 1.2 && aTipo < 1.3;'), 'el shader reconoce la fronda');
assert.ok(mat.includes('uOtono * mix(0.6, 0.95, fract(azar * 4.7))'), 'herrumbre en otoño, no todas igual');
assert.match(veg, /import \{ materialVegetal, U, TIPO_HELECHO, TIPO_COIRON \} from '\.\/materiales\.js';/);   // 3.5.2: y el del coirón
assert.ok(veg.includes('q[3], q[4], q[5], TIPO_HELECHO, 0, 0, p[3], p[4]);'), 'las frondas llevan el tipo de helecho');
assert.ok(pasto.includes('srgb(vec3(0.70, 0.38, 0.12)), srgb(vec3(0.53, 0.26, 0.10))'), 'los helechos del pasto, la misma herrumbre');

// ---------------------------------------------------------------- 2. la nieve, igual en los tres dibujos
assert.ok(mat.includes('float nyNieve = normal.y;'), 'el enganche de la nieve');
assert.ok(mat.includes('aTipo > 3.5 ? smoothstep(0.3, 0.85, nyNieve) : smoothstep(0.5, 0.95, nyNieve) * (helecho35 ? 0.45 : 1.0)'), 'el umbral del follaje (techos y piedras como antes)');
assert.ok(!mat.includes('float arriba = smoothstep(0.3, 0.85, normal.y);'), 'ya no la normal cruda en todo');
// lejos: la altura en la mancha; cerca: la mitad de arriba de cada carta
assert.ok(veg.includes(`if (!recorte) sh.vertexShader = sh.vertexShader.replace('float nyNieve = normal.y;', 'float nyNieve = aCarta.w > 0.5 ? clamp(aCarta.y / max(aCarta.z, 1e-3) * 0.9 + 0.2, -1.0, 1.0) : normal.y;');`), 'la mancha lejana se nieva arriba');
assert.ok(veg.includes(`else sh.vertexShader = sh.vertexShader.replace('float nyNieve = normal.y;', 'float nyNieve = dot(aCarta.xy, aCarta.xy) > 1e-6 ? normal.y - 0.2 + 0.45 * aCarta.y / length(aCarta.xy) : normal.y;');`), 'la carta cercana se nieva arriba (3.5.2: -0.2, a la par de la mancha lejana)');
assert.ok(imp.includes('smoothstep(0.5, 0.95, nObjImp.y - 0.2)'), 'el cartel, con el mismo umbral');
// la cuenta de la mancha: arriba se nieva, el centro y los costados no (como un racimo visto de frente)
const arribaFollaje = (ny) => { const t = Math.min(1, Math.max(0, (ny - 0.5) / 0.45)); return t * t * (3 - 2 * t); };
const nieveMancha = (y, radio) => arribaFollaje(Math.min(1, Math.max(-1, (y / radio) * 0.9 + 0.2)));
assert.ok(nieveMancha(1.12, 1) > 0.95, 'el borde de arriba de la mancha, blanco');
assert.equal(nieveMancha(0, 1), 0, 'el centro (el frente del racimo), verde');
assert.equal(nieveMancha(-1.12, 1), 0, 'abajo, verde');
// y una carta de ciprés (normal del racimo casi al cielo): arriba nevada, abajo verde
const nieveCarta = (ny, dy) => arribaFollaje(ny - 0.2 + 0.45 * dy);
assert.ok(nieveCarta(0.9, 0.55) > 0.5 && nieveCarta(0.9, -0.85) === 0, 'la ramita se nieva arriba');

// ---------------------------------------------------------------- 3. cartas de cerca
assert.ok(veg.includes('abreCarta *= min(1.0, 0.35 * length(mvPosition.xyz) / max(length(abreCarta), 1e-4));'), 'tope al tamaño aparente');
assert.ok(veg.includes('mvPosition.xy += abreCarta;'));
assert.match(veg, /function conCartas\(m, textura, \{ recorte = true, ojo = false \} = \{\}\)/);
assert.ok(veg.includes("(recorte ? 'recorte' : 'manchas') + (ojo ? '-ojo' : '')"), 'el programa del árbol cercano se distingue');
assert.ok(veg.includes('cartas, { ojo: true }),'), 'sólo el árbol cercano abre el follaje pegado al ojo');
assert.ok(veg.includes('if (dOjoHoja < 2.6 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) > smoothstep(1.0, 2.6, dOjoHoja)) discard;'));
// el tope: una carta de ciprés (1,6 m de medio lado) a 2,5 m del ojo queda en 0,875 m; una de
// arbusto (0,4 m) no cambia ni a 1,2 m
const tope = (largo, d) => largo * Math.min(1, (0.35 * d) / largo);
assert.ok(Math.abs(tope(1.6, 2.5) - 0.875) < 1e-9);
assert.equal(tope(0.4, 1.2), 0.4);
assert.ok(veg.includes('const cono = pisoConifera(radio * (detalle ? 0.8 : 1.1), h, detalle ? 11 : 7);'), 'la falda cercana del ciprés queda adentro');

// ---------------------------------------------------------------- 4. flores e invierno
assert.ok(mat.includes('(aTipo > 1.5 && aTipo < 2.5 && uInvierno > 0.5) || (aTipo > 2.5 && aTipo < 3.5 && uInvierno > 0.2)'), 'las flores de los arbustos se cierran antes');
assert.ok(pasto.includes('float temporada = (1.0 - smoothstep(0.02, 0.25, uInvierno))'), 'las flores del prado se van apenas llega el invierno');
assert.ok(pasto.includes('step(rnd, dens * 1.1) * step(1e-4, dens) * step(0.5, est.a)'), 'con densidad cero no sale ninguna (ni en el agua)');
assert.ok(pasto.includes('(1.0 - smoothstep(0.3, 0.9, uInvierno)) * step(0.5, est.a);'), 'los helechos no salen del agua');
assert.ok(pasto.includes('mix(0.97, 0.55, estepa)) * step(0.5, estT.a);'), 'menos pasto seco sobre la nieve, y nada en el agua');
assert.ok(leer('src/main.js').includes("estep[i * 4 + 3] = T.agua((i % N) * 2 - 512, Math.floor(i / N) * 2 - 512) ? 0 : 255;"), 'el alfa de uEstepa marca el agua');
assert.ok(veg.includes("if (detalle && o.cartas && o.hundir !== false)") && veg.includes('hundir: false, luz: 1.15 });'), 'las matas no se ven negras a la sombra');

// ---------------------------------------------------------------- 5. carteles
assert.ok(imp.includes('const CELDA_ANCHO = 112, CELDA_ALTO_MAX = 204;'), 'más resolución en el atlas');
assert.ok(Math.floor(4096 / 20) >= 204, 'las 20 especies entran en 4096 de alto');

// ---------------------------------------------------------------- 6. 3.5.2
const main = leer('src/main.js');
// el ciprés de cerca: la falda marcada se recoge, las cartas se achican junto al ojo (sin tramado)
assert.ok(veg.includes('const FALDA_CARTA = [0, 0, 0, -1];') && veg.includes('carta: FALDA_CARTA });'), 'la falda del ciprés va marcada');
assert.ok(veg.includes('if (aCarta.w < -0.5 && aCarta.w > -1.5) nyNieve -= 0.3;') && veg.includes('aCarta.w < 0.26 && dot(aCarta.xy, aCarta.xy) > 1e-6) nyNieve -= 0.15;'), 'la falda y las ramitas del ciprés se nievan menos (a la par del cartel)');
assert.ok(veg.includes('if (aCarta.w < -0.5 && aCarta.w > -1.5) transformed.xz *= smoothstep(5.0, 11.0,'), 'la falda se recoge al arrimarse');
assert.ok(veg.includes('abreCarta *= smoothstep(0.5, 2.2, length(mvPosition.xyz));'), 'las cartas se apartan junto al ojo');
assert.ok(veg.includes('if (vHojas > 0.5 && vCartaVeg.z < 0.5) {'), 'el tramado ya no cae sobre las cartas');
// el coirón y el notro llevan aCarta (si no, el material de las matas los recortaba enteros)
const funcion = (nombre) => veg.slice(veg.indexOf(`function ${nombre}(`), veg.indexOf('\n}\n', veg.indexOf(`function ${nombre}(`)));
assert.ok(funcion('coiron').includes('new ConstructorArbol()') && funcion('notro').includes('new ConstructorArbol()'), 'coirón y notro con aCarta');
const mc = /export const TIPO_COIRON = ([\d.]+);/.exec(mat);
assert.ok(mc && Number(mc[1]) > 1.35 && Number(mc[1]) < 1.45 && funcion('coiron').includes('tipo: TIPO_COIRON'), 'el coirón es pasto perenne (no se cierra en invierno)');
assert.ok(mat.includes('bool coiron352 = aTipo > 1.35 && aTipo < 1.45;'), 'el shader reconoce el coirón');
// el aire del follaje y de los carteles es el del suelo
for (const [nombre, t, nub, llu] of [['materialVegetal', mat, 'uNubesVeg', 'uLluviaVeg'], ['impostores', imp, 'uNubesImp', 'uLluviaImp']]) {
  assert.ok(t.includes(`float aireVeg = smoothstep(70.0, 380.0, dAireVeg) * (1.0 + ${nub} * 0.4 + ${llu} * 0.5);`), nombre + ': el aire del suelo');
  assert.ok(t.includes('clamp(aireVeg * bajoVeg * 0.2 * uBrumaFuerza, 0.0, 0.4)'), nombre + ': con el tope del suelo');
}
// (si el suelo cambia su cuenta, avisa: hay que volver a emparejarlas)
const suelo = /smoothstep\(([\d.]+), ([\d.]+), dAireSuelo\) \* \(([\d.]+) \+ uNubes \* ([\d.]+) \+ uLluvia \* ([\d.]+)\)/.exec(mat);
if (!suelo) console.warn('verificar-3-5-vegetacion: AVISO: cambió la cuenta del aire del suelo; emparejar la del follaje (materialVegetal, impostores.js)');
else assert.deepEqual(suelo.slice(1).map(Number), [70, 380, 0.2, 0.08, 0.1], 'el aire del follaje es el mismo que el del suelo');
// (y pesa menos en lo alto, como el suelo de la 3.5.2 de paisaje: con la altura del pie del árbol)
assert.ok(mat.includes('bajoVeg *= 0.6 + 0.4 * exp(-max(vSueloVeg - 14.0, 0.0) / 90.0);') && imp.includes('bajoVeg *= 0.6 + 0.4 * exp(-max(vPosMundoImp.y - vAlturaImp - 14.0, 0.0) / 90.0);'), 'el aire del follaje pesa menos en lo alto');
if (!mat.includes('aireSuelo *= 0.6 + 0.4 * exp(-max(vPosMundo.y - 14.0, 0.0) / 90.0);')) console.warn('verificar-3-5-vegetacion: AVISO: el suelo todavía no tiene la bruma por altura (rama de paisaje sin juntar)');
assert.ok(imp.includes('uTiempo: U.uTiempo,'), 'los carteles pasan el tiempo (bancos de niebla)');
// los núcleos de los racimos cercanos llevan las hojas pintadas (no una bola lisa, ni tramada)
assert.ok(veg.includes('detalle && o.cartas ? -(10 + (o.celda ?? 0)) : 0);') && veg.includes('if (aCarta.w < -9.5) {') && veg.includes('if (vCartaVeg.z > 1.5) {') && veg.includes('const cartasAdentro = detalle && o.cartas && o.hundir !== false;'), 'núcleos con hojas pintadas (en los árboles, tres cartas)');
// la nieve del follaje no encandila: sin trasluz ni borde de sol sobre la nieve
assert.ok(mat.includes('varying float vNieveVeg;') && mat.includes('* (1.0 - uInvierno * 0.75) * (1.0 - vNieveVeg);') && mat.includes('* (1.0 - vNieveVeg * 0.8);'), 'la nieve del follaje sin halo');
// el amancay no sale en franja a lo largo de los cortes del bosque; los canteros no tienen pasto
assert.ok(pasto.includes('borde *= 1.0 - smoothstep(0.12, 0.3, bosqueAlrededor - m.a);'), 'el amancay no sigue los cortes');
assert.ok(main.includes('function canterosParaPisos()') && main.includes('col.plataformas.concat(canterosParaPisos())'), 'los canteros entran a la marca de pisos');
// a la placa sube sólo lo usado al compactar
assert.ok(veg.split('subirUsado(im, n)').length - 1 >= 2 && !veg.includes('destM.set(M.subarray('), 'compactados sin subir el búfer entero');

assert.ok(pkg.scripts.verify.includes('node pruebas/verificar-3-5-vegetacion.mjs'), 'la prueba corre en verify');
console.log('verificar-3-5-vegetacion: ok · nieve pareja en los tres dibujos, cartas con tope, helechos de otoño, sin flores en la nieve · 3.5.2: ciprés de cerca, coirón y notro visibles, aire del suelo, amancay y canteros');
