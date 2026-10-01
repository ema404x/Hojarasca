// 1.9: el motor de sonido nuevo. Las recetas de golpe (`impactos.js`) y las gargantas
// de los invasores (`voz-alien.js`) son módulos puros, así que se pueden probar acá
// sin audio. Lo que suena de verdad se mide en `pruebas/render-sonidos.cjs`, que
// renderiza cada sonido a un archivo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MATERIALES, modos, capas, azarEn, ronda } from '../src/impactos.js';
import { VOCES, ESTADOS, voz, lejania, esperaVoz } from '../src/voz-alien.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------- los materiales
const NOMBRES = ['tronco', 'tabla', 'hueco', 'piedra', 'tierra', 'carne', 'quitina', 'hueso', 'metal', 'cristal'];
for (const n of NOMBRES) assert.ok(MATERIALES[n], `falta el material «${n}»`);
for (const [n, M] of Object.entries(MATERIALES)) {
  assert.ok(M.modos.length >= 2, `${n}: un golpe con un solo modo suena a sintetizador`);
  // los modos no pueden ser armónicos: un tronco no es una cuerda
  const razones = M.modos.map(([r]) => r);
  assert.equal(razones[0], 1, `${n}: el primer modo es el fundamental`);
  for (let i = 1; i < razones.length; i++) {
    assert.ok(razones[i] > razones[i - 1], `${n}: los modos van de menor a mayor`);
    assert.ok(Math.abs(razones[i] - Math.round(razones[i])) > 0.01 || n === 'cristal' || razones[i] === 2,
      `${n}: el modo ${i} cae justo en un armónico (${razones[i]}), y eso suena a órgano`);
  }
  // y los agudos se apagan antes que los graves, como en cualquier cuerpo real
  for (let i = 1; i < M.modos.length; i++) {
    assert.ok(M.modos[i][1] <= M.modos[i - 1][1], `${n}: el modo ${i} dura más que el anterior`);
    assert.ok(M.modos[i][2] < M.modos[i - 1][2], `${n}: el modo ${i} suena más fuerte que el anterior`);
  }
  assert.ok(M.golpe.dur < 0.05, `${n}: el transitorio tiene que ser cortísimo`);
  assert.ok(M.golpe.frec > M.base, `${n}: el transitorio va más arriba que el cuerpo`);
}
// la piedra casi no resuena y el metal sí: es lo que los distingue
assert.ok(MATERIALES.piedra.modos[0][1] < 0.1 && MATERIALES.metal.modos[0][1] > 1, 'piedra y metal tienen que caer distinto');

// un cuerpo más grande suena más grave y le dura más
const chico = modos('tronco', { tamaño: 1 }), grande = modos('tronco', { tamaño: 4 });
assert.ok(grande[0].frec < chico[0].frec * 0.4, 'un tronco grande suena mucho más grave');
assert.ok(grande[0].dur > chico[0].dur * 1.5, 'y le dura más');
// dos golpes seguidos no son el mismo golpe
const a = modos('piedra', { azar: 1 }), b = modos('piedra', { azar: 2 });
assert.notEqual(a[0].frec, b[0].frec, 'dos golpes iguales suenan a máquina');
assert.ok(Math.abs(a[0].frec - b[0].frec) / a[0].frec < 0.3, 'pero siguen siendo el mismo material');
// nada se va de rango audible
for (const n of NOMBRES) for (const t of [0.2, 1, 6]) {
  for (const m of modos(n, { tamaño: t })) {
    assert.ok(m.frec >= 24 && m.frec <= 17000, `${n} a tamaño ${t}: ${m.frec} Hz se va de rango`);
    assert.ok(m.dur > 0 && m.dur <= 6, `${n} a tamaño ${t}: ${m.dur} s de caída`);
  }
  const c = capas(n, { tamaño: t });
  assert.ok(c.golpe.frec >= 40 && c.golpe.frec <= 18000, `${n}: transitorio fuera de rango`);
}
assert.equal(modos('no-existe').length, 0);
assert.equal(capas('no-existe'), null);
// el azar repetible: con la misma semilla, el mismo número
assert.equal(azarEn(5, 2), azarEn(5, 2));
assert.notEqual(azarEn(5, 2), azarEn(5, 3));
// la ronda no repite hasta dar la vuelta
{
  const r = ronda(6), vistos = new Set();
  for (let i = 0; i < 6; i++) vistos.add(r());
  assert.equal(vistos.size, 6, 'la ronda repitió antes de dar la vuelta');
}

// ---------------- las gargantas
const TIPOS = ['rastreador', 'tirador', 'saltador', 'escupidor', 'bruto', 'jefe', 'nido'];
for (const t of TIPOS) {
  const V = VOCES[t];
  assert.ok(V, `falta la voz del ${t}`);
  assert.equal(V.formantes.length, 3, `${t}: hacen falta tres formantes para que haya cuerpo`);
  assert.ok(V.formantes[0][0] < V.formantes[1][0] && V.formantes[1][0] < V.formantes[2][0], `${t}: los formantes van de menor a mayor`);
  // la aspereza es lo que hace el grano del gruñido: arriba de 130 Hz ya es zumbido
  assert.ok(V.aspereza >= 5 && V.aspereza <= 130, `${t}: la aspereza se fue de rango`);
}
// cuanto más grande el bicho, más abajo la garganta y los formantes
assert.ok(VOCES.jefe.base < VOCES.bruto.base && VOCES.bruto.base < VOCES.rastreador.base && VOCES.rastreador.base < VOCES.saltador.base);
assert.ok(VOCES.jefe.formantes[0][0] < VOCES.saltador.formantes[0][0] / 4, 'el jefe tiene que sonar enorme');
assert.ok(VOCES.jefe.sub >= 1, 'el jefe es casi todo subarmónico');

for (const e of ['acecho', 'alerta', 'ataque', 'dolor', 'muerte', 'llamado', 'respiro', 'latido']) {
  assert.ok(ESTADOS[e], `falta el estado «${e}»`);
}
// el acecho es lo más bajo y lo más largo; el dolor, lo más corto y lo más alto
assert.ok(ESTADOS.acecho.tono[0] < 1 && ESTADOS.acecho.dur > 1.5, 'el acecho es bajo y largo');
assert.ok(ESTADOS.dolor.dur < 0.6 && ESTADOS.dolor.tono[0] > 1.5, 'el dolor es corto y agudo');
assert.ok(ESTADOS.muerte.tono[1] < 0.4 && ESTADOS.muerte.desarma, 'la muerte se desarma hacia abajo');

const v = voz('bruto', 'ataque', { intensidad: 1, azar: 3 });
assert.ok(v.base > 18 && v.base < 2000, 'el tono de la voz se fue de rango');
assert.ok(v.dur > 0.3 && v.dur < 6);
assert.equal(v.formantes.length, 3);
assert.ok(v.distorsion >= 0 && v.distorsion <= 1);
// más intensidad: más alto, más áspero y más saturado, todo junto
const flojo = voz('bruto', 'ataque', { intensidad: 0.1, azar: 3 });
const fuerte = voz('bruto', 'ataque', { intensidad: 1, azar: 3 });
assert.ok(fuerte.base > flojo.base, 'gritar con ganas sube el tono');
assert.ok(fuerte.aspereza > flojo.aspereza, 'y rompe más la voz');
assert.ok(fuerte.distorsion > flojo.distorsion, 'y satura más');
// dos bichos del mismo tipo no suenan idénticos
assert.notEqual(voz('rastreador', 'alerta', { azar: 1 }).base, voz('rastreador', 'alerta', { azar: 2 }).base);
// una voz desconocida no rompe nada
assert.ok(voz('no-existe', 'no-existe').base > 0);

// ---------------- la distancia
const cerca = lejania(2), lejos = lejania(90);
assert.ok(lejos.corte < cerca.corte / 3, 'de lejos el aire se come los agudos');
assert.ok(lejos.volumen < cerca.volumen, 'y llega más bajo');
assert.ok(lejos.reverb > cerca.reverb, 'con más cola');
assert.ok(lejos.sub > cerca.sub, 'y lo grave es lo que sobrevive');
// el retardo es la velocidad del sonido: 340 metros por segundo
assert.ok(Math.abs(lejania(100).retardo - 100 / 340) < 0.001, 'el retardo no sigue la velocidad del sonido');
// más allá del alcance del valle todo queda igual: no tiene sentido seguir apagando
assert.equal(lejania(300).retardo, lejania(160).retardo, 'la distancia está acotada');
assert.ok(lejania(0).corte <= 15000 && lejania(400).corte >= 320, 'el corte se mantiene en rango');
// la espera entre voces nunca es un ritmo parejo
{
  const esperas = new Set(); for (let i = 0; i < 20; i++) esperas.add(esperaVoz('acecho', false));
  assert.ok(esperas.size > 15, 'la espera entre gruñidos no puede ser siempre la misma');
}

// ---------------- los ojos que te encuentran
{
  const { mirada, silueta, acercar, anguloCorto, CONO, ALCANCE } = await import('../src/mirada.js');
  // de frente y cerca, prendidos; de costado, apagados
  assert.ok(mirada({ dif: 0, distancia: 6, noche: 1 }) > 0.9, 'de frente y cerca los ojos se prenden');
  assert.equal(mirada({ dif: CONO + 0.01, distancia: 6, noche: 1 }), 0, 'fuera del cono no te ve');
  assert.equal(mirada({ dif: Math.PI, distancia: 6, noche: 1 }), 0, 'de espaldas tampoco');
  // el cono es simétrico
  assert.equal(mirada({ dif: 0.4, distancia: 8, noche: 1 }), mirada({ dif: -0.4, distancia: 8, noche: 1 }));
  // y no se rompe si el ángulo viene dado vuelta
  assert.ok(Math.abs(anguloCorto(Math.PI * 2 + 0.3) - 0.3) < 1e-9, 'el ángulo se normaliza');
  assert.ok(Math.abs(mirada({ dif: Math.PI * 2, distancia: 6, noche: 1 }) - mirada({ dif: 0, distancia: 6, noche: 1 })) < 1e-9);
  // la distancia lo apaga
  assert.ok(mirada({ dif: 0, distancia: 40, noche: 1 }) < mirada({ dif: 0, distancia: 8, noche: 1 }));
  assert.equal(mirada({ dif: 0, distancia: ALCANCE + 1, noche: 1 }), 0, 'más allá del alcance no te reconoce');
  // de día casi no se nota; de noche es lo único que se ve
  assert.ok(mirada({ dif: 0, distancia: 8, noche: 0 }) < mirada({ dif: 0, distancia: 8, noche: 1 }) * 0.6, 'el terror es de noche');
  // atacando, más
  assert.ok(mirada({ dif: 0, distancia: 8, noche: 1, ataca: true }) > mirada({ dif: 0, distancia: 8, noche: 1 }));
  // la silueta: de cerca se ve el cuerpo, de lejos no
  assert.equal(silueta(10, 1), 0, 'de cerca el cuerpo se ve entero');
  assert.ok(silueta(60, 1) > 0.9, 'de lejos queda la sombra y los ojos');
  assert.ok(silueta(60, 0) < silueta(60, 1), 'de día menos');
  // la brasa sube rápido y baja despacio: si fuera igual, parpadearía
  assert.ok(acercar(0, 1, 0.1) > 0.4 && acercar(0, 1, 0.1) < 1, 'sube rápido');
  assert.ok(1 - acercar(1, 0, 0.1) < 0.2, 'y baja despacio');
  assert.equal(acercar(0.5, 0.5, 0.1), 0.5, 'y se queda quieta cuando llegó');
  assert.ok(acercar(1, 0, 10) === 0 && acercar(0, 1, 10) === 1, 'nunca se pasa del objetivo');
}

// ---------------- cableado
const sonido = leer('src/sonido.js'), banco = leer('src/desafio-sonidos.js'), alien = leer('src/desafio-alien.js');
assert.match(sonido, /import \{ modos, capas, ronda \} from '\.\/impactos\.js';/);
assert.match(sonido, /import \{ voz, lejania \} from '\.\/voz-alien\.js';/);
assert.match(sonido, /impacto\(material, \{/, 'falta el motor de golpes');
assert.match(sonido, /vozAlien\(tipo, estado, \{/, 'falta el motor de voces');
assert.match(sonido, /createWaveShaper/, 'la saturación de la garganta va con un WaveShaper');
assert.match(sonido, /iniciar\(ctxExterno\)/, 'el motor tiene que aceptar un contexto de afuera para poder renderizar a archivo');
// el banco usa las capas nuevas, no un ruido pelado
for (const clave of ['acecho', 'embestida', 'llamado', 'respiro', 'golpe', 'muerte', 'jefe']) {
  assert.ok(new RegExp(`${clave}:`).test(banco), `falta «${clave}» en el banco del Desafío`);
}
assert.ok((banco.match(/sonido\.impacto/g) || []).length >= 12, 'los golpes del Desafío tienen que pasar por el motor de capas');
assert.ok((banco.match(/vozAlien/g) || []).length >= 7, 'las gargantas tienen que usarse en todo el banco');
// los ojos que te miran
assert.match(alien, /uniform float uMirada; uniform float uSilueta; uniform vec3 uOjoColor;/);
assert.match(alien, /import \{ mirada, silueta, acercar \} from '\.\/mirada\.js';/);
assert.match(alien, /u\.uMirada\.value = acercar\(u\.uMirada\.value, quiere, dt\);/, 'la mirada sube rápido y baja despacio');
assert.match(alien, /outgoingLight \*= 1\.0 - uSilueta \* 0\.72;/, 'de lejos el cuerpo se apaga');
// Cazado en la revisión de la 1.9: el color de los ojos se le sumaba también a los
// sacos del jefe, que son el punto débil y tienen que leerse verdes. Sus ojos son rojos.
assert.match(alien, /uOjoColor \* vEmision \* \(1\.0 - vDebilA\)/, 'el color de los ojos no puede pintar el punto débil');
// Y los invasores se reciclan entre oleadas: hay que apagarles lo de la vida anterior.
assert.match(alien, /reiniciar\(\) \{[\s\S]*?uMirada\.value = 0; u\.uSilueta\.value = 0;/, 'reiniciar tiene que apagar los ojos del invasor reciclado');

// El motor tiene que aguantar que le pidan sonidos antes del primer clic, que es
// cuando todavía no hay contexto de audio: un invasor puede morirse en el primer cuadro.
assert.match(sonido, /fuente\(pos, vol = 1, reverb = 0\.6\) \{\n    if \(!this\.ctx\) return null;/, 'fuente sin contexto tiene que devolver null');
for (const m of ['tono', 'golpeRuido']) {
  assert.ok(new RegExp(`${m}\\(\\{[^}]*\\}\\) \\{\\n    if \\(!destino`).test(sonido), `${m} tiene que aguantar un destino nulo`);
}
// Los golpes de relleno van con menos modos: sin eso, un árbol cayéndose pedía
// cuatrocientos nodos de audio en un solo cuadro.
assert.match(sonido, /capasMax = 99/, 'falta el recorte de capas para los golpes de relleno');
assert.ok((sonido.match(/capasMax: 2/g) || []).length >= 2, 'el árbol que cae tiene que usar golpes de relleno');
assert.equal(modos('tronco', { cuantos: 2 }).length, 2, 'el recorte de modos no funciona');
assert.equal(modos('tronco', { cuantos: 0 }).length, 1, 'siempre queda al menos el fundamental');
// recortar no cambia los modos que quedan: es el mismo material, con menos cola
assert.deepEqual(modos('tronco', { azar: 4, cuantos: 2 }), modos('tronco', { azar: 4 }).slice(0, 2));

// ---------------- 2.7: la síntesis de antemano (ver `sonido-sintesis.js`)
{
  const X = await import('../src/sonido-sintesis.js');
  const T = X.TASA_PREVIA, az = X.crearAzar(27);
  const sano = (nombre, d, techo = 1) => {
    const m = X.medir(d);
    assert.equal(m.nan, 0, `${nombre}: hay muestras que no son números`);
    assert.ok(m.pico > 0.001 && m.pico <= techo, `${nombre}: pico ${m.pico} fuera de rango`);
    assert.ok(Math.abs(m.dc) < 0.01, `${nombre}: tiene continua (${m.dc})`);
    return m;
  };
  // los generadores largos ceden: el motor los corre de a pedazos y no traba un cuadro
  const g = X.susurroHojas(T, 1, az);
  assert.equal(typeof g.next, 'function', 'las recetas largas son generadores');
  let pasos = 0; for (let r = g.next(); !r.done; r = g.next()) pasos++;
  assert.ok(pasos > 10, 'y ceden seguido');
  sano('hojas', X.completar(X.susurroHojas(T, 1, az)), 1.5);
  sano('burbujeo', X.completar(X.burbujeo(T, 1, az)), 1.5);
  for (const c of X.completar(X.lluviaEstereo(T, 1, az))) sano('lluvia', c, 1.5);
  sano('crepitar', X.completar(X.crepitar(T, 1, az)), 1.5);
  sano('enjambre', X.completar(X.enjambre(24000, 1, az)), 1.5);
  sano('retumbo', X.completar(X.retumbo(24000, 1.5, az)));
  // los grillos son muchos y distintos: pulsos cortos con silencios, no un tono cortado
  const [gi, gd] = X.completar(X.coroGrillos(24000, 3, 4, az));
  sano('grillos', gi); sano('grillos', gd);
  let callados = 0; for (let i = 0; i < gi.length; i += 64) if (Math.abs(gi[i]) + Math.abs(gd[i]) < 1e-4) callados++;
  assert.ok(callados / (gi.length / 64) > 0.3, 'entre chirridos hay silencio');
  // una pisada por suelo, caminando y corriendo
  for (const s of [...Object.keys(X.SUELOS), 'agua']) for (const correr of [false, true]) sano(`paso ${s}`, X.completar(X.pisada(s, T, az, correr)));
  sano('chapoteo', X.completar(X.chapoteo(T, az, 1.5)));
  sano('bisagra', X.completar(X.chirrido(T, az)));
  // la cuerda pulsada suena en su nota: se mide el período con la autocorrelación
  for (const f of [110, 440]) {
    const d = X.completar(X.cuerdaPulsada(T, f, 1, { cuerpo: false, doble: 0 }, az));
    sano(`cuerda ${f}`, d);
    const a = d.subarray(Math.floor(T * 0.2), Math.floor(T * 0.5));
    let mejor = 0, periodo = 0;
    for (let k = Math.floor(T / (f * 1.1)); k < T / (f * 0.9); k++) { let c = 0; for (let i = 0; i + k < a.length; i++) c += a[i] * a[i + k]; if (c > mejor) { mejor = c; periodo = k; } }
    assert.ok(Math.abs(T / periodo - f) / f < 0.02, `la cuerda de ${f} Hz suena a ${(T / periodo).toFixed(1)} Hz`);
  }
  // cada ave que el motor sabe hacer cantar tiene su receta
  for (const e of ['zorzal', 'rayadito', 'fiofio', 'chucao', 'carpintero', 'cachanas', 'concon', 'ranita', 'bandurrias', 'picaflor', 'cisnes', 'martin', 'cauquen']) {
    assert.ok(X.CANTOS[e], `falta el canto del ${e}`);
    sano(`canto ${e}`, X.completar(X.canto(e, T, az)));
  }
  // cableado: el motor usa la cola y los bancos, y ningún bucle sale de un oscilador
  assert.match(sonido, /import \{ TASA_PREVIA, completar,[^}]*\} from '\.\/sonido-sintesis\.js';/);
  assert.ok(!/trem\.type = 'square'/.test(sonido) && !/zum\.type = 'sawtooth'/.test(sonido), 'volvió el grillo de cuadrada o el zumbido de sierra');
  assert.match(sonido, /sonarBuffer\(buf, destino[^)]*\) \{[\s\S]{0,420}this\.soltarAlTerminar\(s, g\);/, 'cada buffer suelto se suelta al terminar');
  assert.match(sonido, /requestIdleCallback/, 'la síntesis de antemano va en los ratos libres');
}

console.log('sonido: ok ·', Object.keys(MATERIALES).length, 'materiales ·', Object.keys(VOCES).length, 'gargantas ·', Object.keys(ESTADOS).length, 'estados');
