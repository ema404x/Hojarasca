// 4.31.1 (C): cacería de bugs del mundo y la naturaleza. Cada arreglo, con el código de verdad y su mutación (una copia con otro nombre
// que deshace el arreglo: la prueba tiene que fallar; un proceso de import por copia):
//   1. la leña suelta y las piñas no salen metidas en un tronco, una pared o debajo de un puente (la barrida de humo-4-31-1-c.cjs
//      encontró 120 de 2864, casi todas piñas y atados de leña dentro de troncos);
//   2. desde un puente o un andén no se patea la piedrita de abajo;
//   3. desde un puente o un muelle no se «toca el agua» de abajo;
//   4. lo que está del otro lado de una pared (la mata de afuera, mirando desde adentro de la casa) no se sacude;
//   5. las gotas del jugador mojado caen al piso donde está parado (en un puente o adentro, no atraviesan hasta el terreno);
//   6. el aviso de la naturaleza le deja el lugar a la otra tecla del lugar (H para talar el ñire que mirás con el hacha, F para el
//      fogón, Y en el banco de aserrar): la E sigue sacudiendo;
//   7. el sapito no pica en la tierra de enfrente (en una bahía chica las ondas salían en la orilla);
//   8. las ranas no aparecen adentro de un tronco ni debajo del muelle;
//   9. el desenfoque de las cinemáticas de Ultra lee sin derivadas dentro del lazo (la consola mostraba el aviso X3595 de la placa);
//  10. en las laderas el tronco de los árboles se entierra del lado de abajo (1.679 árboles quedaban con el pie en el aire);
//  11. la malla del terreno dibuja la altura que se pisa en cada vértice (en Alta, el suelo se despegaba 34 cm o más en 1 de cada 20 lugares);
//  12. en las esquinas del valle no asoma el piso de la cordillera (un plano a 18 m que cortaba los troncos donde el suelo es más bajo).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { contexto } from './ayuda-interacciones.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;

registrarThree();

// ---------------------------------------------------------------- un mundo de mentira (el de verificar-4-31-0-c.mjs, con colisiones)
function mundoJuego(crear, { obstaculos = [], plataforma = null, pared = false, anchoAgua = Infinity } = {}) {
  const T = {
    altura: () => 0,
    agua: (x) => (x > 40 && x < 40 + anchoAgua ? { nivel: 0, prof: x > 45 ? 3 : 0.3, lago: true } : null),
    indice: (x, z) => (x < 0 ? 0 : Math.abs(z - 100) < 1 ? 2 : 1),
    distSendero: [20, 20, 20], distRiel: [50, 50, 0.5], bosque: [0.9, 0.1, 0.1], pasto: [0, 0.9, 0], pendiente: [0, 0, 0],
  };
  const progreso = { dia: 3, horas: 12, ramitas: 0, entradas: {}, naturaleza: undefined };
  const js = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, z: 0 }, yaw: 0, pitch: 0, enSuelo: true, nadando: false, sentado: false, agachado: false, superficie: 'hojarasca', velocidadActual: 0 };
  const sonido = new Proxy({}, { get: (t, k) => () => (k === 'fuente' ? {} : undefined) });
  const matas = [];
  const col = {
    cercanos: () => obstaculos,
    plataformaBaja: (x, z) => (plataforma && Math.hypot(x - plataforma.x, z - plataforma.z) < plataforma.r ? { alto: plataforma.alto } : null),
    paredEntre: () => pared,
  };
  const ctx = {
    T, sonido, escena: { add() {} }, objetos: { items: [], arrancar: () => true },
    veg: { matasCerca: () => matas, arbolesCerca: () => [], sacudirMata: () => true, sacudir: () => true },
    camara: () => null, jugador: () => ({ estado: js }), progreso: () => progreso,
    nota: () => {}, guardar: () => {}, registrar: () => {}, cabeJuntar: () => true,
    ramitas: () => progreso.ramitas, sumarRamitas: (k) => { progreso.ramitas = Math.min(12, progreso.ramitas + k); },
    dia: () => progreso.dia, horas: () => progreso.horas, bajoTecho: () => false, cercaDelFuego: () => false,
    ambiente: () => ({ lluvia: 0, viento: 0, invierno: 0, otono: 0 }), distanciaAldea: () => 999, pelarPasto: () => () => {},
    col,
  };
  return { G: crear(ctx), js, progreso, matas, col };
}

function bateriaJuego(crear, et = '') {
  const m = (t) => `${et}${t}`;
  // 1. adentro de un tronco o bajo un puente no hay leña ni piedritas
  {
    const W = mundoJuego(crear);
    assert.ok(W.G._debug.lugarLena(-40, -40), m('en el bosque, lejos de todo, hay lugar para leña'));
    assert.equal(W.G._debug.sueloPiedra(10, 100), 'piedra', m('sobre la vía, piedritas'));
    const T1 = mundoJuego(crear, { obstaculos: [{ x: -40.3, z: -40, r: 0.45 }] });
    assert.ok(!T1.G._debug.lugarLena(-40, -40), m('al pie de un tronco no hay atado de leña'));
    const T2 = mundoJuego(crear, { obstaculos: [{ x: 10.05, z: 100, r: 0.3 }] });
    assert.equal(T2.G._debug.sueloPiedra(10, 100), null, m('adentro de un poste o un tronco no hay piedrita'));
    const T3 = mundoJuego(crear, { obstaculos: [{ seg: true, ax: 9, az: 99.9, bx: 11, bz: 99.9, r: 0.15 }] });
    assert.equal(T3.G._debug.sueloPiedra(10, 100), null, m('ni metida en una pared'));
    const T4 = mundoJuego(crear, { plataforma: { x: 10, z: 100, r: 3, alto: 1.5 } });
    assert.equal(T4.G._debug.sueloPiedra(10, 100), null, m('ni debajo de un puente'));
    const T5 = mundoJuego(crear, { obstaculos: [{ x: -40.3, z: -40, r: 0.45, despejado: true }] });
    assert.ok(T5.G._debug.lugarLena(-40, -40), m('un árbol despejado (ya no está) no cuenta'));
  }
  // 2. la piedrita de abajo de un puente no se patea desde arriba (en el suelo, sí)
  for (const [alto, debe] of [[0, true], [1.5, false]]) {
    const W = mundoJuego(crear);
    const { G, js } = W;
    js.pos.x = 10; js.pos.z = 10;
    G.actualizar(0.016);
    const p = G._debug.piedras.find((q) => !q.mueve);
    assert.ok(p, m('hay una piedrita'));
    js.pos.x = p.x - 0.3; js.pos.z = p.z; js.pos.y = alto; js.vel.x = 4; js.vel.z = 0;
    const x0 = p.x;
    for (let k = 0; k < 30; k++) G.actualizar(1 / 60);
    assert.equal(p.x - x0 > 0.3, debe, m(alto ? `desde ${alto} m arriba no se patea (${(p.x - x0).toFixed(2)} m)` : 'en el suelo se patea'));
  }
  // 3. tocar el agua: en la orilla sí; desde un muelle a 2 m, no
  for (const [alto, debe] of [[0, true], [2, false]]) {
    const { G, js } = mundoJuego(crear);
    js.pos.x = 40; js.pos.z = 0; js.pos.y = alto; js.yaw = -Math.PI / 2; js.agachado = true; js.pitch = -0.8;
    G.actualizar(0.5);
    assert.equal(G.accion(js)?.id === 'tocarAgua', debe, m(alto ? 'desde el muelle, el agua no se toca' : 'agachado en la orilla, se toca'));
  }
  // 7. el sapito en una bahía de 10 m: la piedra no pica en la tierra de enfrente (con el agua ancha, pica lejos)
  for (const ancho of [10, Infinity]) {
    const W = mundoJuego(crear, { anchoAgua: ancho });
    const { G, js } = W;
    const ondas = [];
    const anillo0 = G.mundo.anillo;
    G.mundo.anillo = (x, z, nivel, o) => { ondas.push(x); return anillo0(x, z, nivel, o); };
    const azar = Math.random;
    Math.random = () => 0.99;   // nueve saltos (agachado)
    try {
      js.pos.x = 39; js.pos.z = 0; js.yaw = -Math.PI / 2; js.pitch = 0; js.agachado = true;
      G.actualizar(0.5);
      const s = G.accion(js);
      assert.equal(s?.id, 'sapito', m(`en la orilla, el sapito (${s?.id})`));
      s.hacer();
      for (let k = 0; k < 400; k++) G.actualizar(1 / 60);
    } finally { Math.random = azar; }
    const lejos = Math.max(...ondas);
    if (ancho === 10) assert.ok(ondas.length > 0 && lejos < 50, m(`en la bahía chica, todas las ondas en el agua (la más lejos en x ${lejos.toFixed(1)})`));
    else assert.ok(lejos > 50, m(`en el agua ancha, la piedra llega lejos (${lejos.toFixed(1)})`));
  }
  // 8. las ranas no salen adentro de un tronco ni debajo del muelle
  for (const [obst, debe] of [[[], true], [[{ x: 40, z: 0, r: 500 }], false]]) {
    const { G, js } = mundoJuego(crear, { obstaculos: obst });
    js.pos.x = 30; js.pos.z = 0;
    for (let k = 0; k < 300; k++) G.actualizar(0.1);
    assert.equal(G._debug.ranas.some((r) => r.visible), debe, m(debe ? 'en la orilla hay ranas' : 'donde está todo ocupado, ninguna'));
  }
  // 4. la mata del otro lado de la pared no se sacude
  for (const [pared, debe] of [[false, true], [true, false]]) {
    const W = mundoJuego(crear, { pared });
    const { G, js } = W;
    js.pos.x = 10; js.pos.z = 0; js.yaw = 0;   // mirando hacia −z
    W.matas.push({ tipo: 'chilco', x: 10, z: -1.5, esc: 1 });
    G.actualizar(0.5);
    assert.equal(G.accion(js)?.id === 'arbusto', debe, m(pared ? 'con una pared en el medio, no' : 'la mata de adelante se sacude'));
  }
}

// 5. las gotas caen al piso donde estás
async function bateriaGotas(crearNaturalezaMundo, et = '') {
  const hijos = [];
  const M = crearNaturalezaMundo({ escena: { add: (o) => hijos.push(o) }, T: { agua: () => null, altura: () => 0 } });
  for (let k = 0; k < 6; k++) M.gotear(0, 2, 0, 1.2);
  let min = Infinity;
  for (let k = 0; k < 50; k++) {
    M.actualizar(1 / 60);
    const g = M.pools.gota.im;
    for (let i = 0; i < g.count; i++) min = Math.min(min, g.instanceMatrix.array[i * 16 + 13]);
  }
  assert.ok(min > 1.15, `${et}las gotas se quedan en el piso del puente (más baja: ${min.toFixed(2)} m)`);
  M.gotear(0, 2, 0);
  min = Infinity;
  for (let k = 0; k < 50; k++) { M.actualizar(1 / 60); const g = M.pools.gota.im; for (let i = 0; i < g.count; i++) min = Math.min(min, g.instanceMatrix.array[i * 16 + 13]); }
  assert.ok(min < 0.2, `${et}sin piso, caen al terreno (${min.toFixed(2)} m)`);
}

// 6. el aviso: la otra tecla del lugar le gana; la E igual hace lo de la naturaleza
function bateriaAviso(I, et = '') {
  const m = (t) => `${et}${t}`;
  const caso = (estado) => {
    const c = contexto(estado);
    const info = {};
    const av = I.avisoDe(c, info);
    return { av, e: I.hacerConE(contexto(estado)) };
  };
  const arbol = { id: 'arbol', texto: 'Sacudir el ñire' }, mata = { id: 'arbusto', texto: 'Sacudir el chilco' };
  let r = caso({ acciones: { naturaleza: arbol } });
  assert.ok(r.av?.tecla === 'E' && r.av.texto === 'Sacudir el ñire' && r.e === 'naturaleza', m('sin nada más, «E · Sacudir el ñire»'));
  r = caso({ acciones: { naturaleza: arbol }, hachaCerca: { tipo: 'tronco', arbol: {}, talar: true }, textoHacha: 'Talar el ñire' });
  assert.ok(r.av?.tecla === 'H' && r.e === 'naturaleza', m(`con el hacha mirando el ñire, el aviso dice H y la E sacude (${JSON.stringify(r.av)})`));
  r = caso({ acciones: { naturaleza: mata }, hachaCerca: { tipo: 'tronco', arbol: {}, talar: true }, textoHacha: 'Talar el coihue' });
  assert.ok(r.av?.tecla === 'E', m('mirando una mata con un árbol al lado: la mata (el hacha se ofrece en todo el bosque)'));
  r = caso({ acciones: { naturaleza: mata }, hachaCerca: { tipo: 'tronco', mata: {} }, textoHacha: 'Hachar el tronco' });
  assert.ok(r.av?.tecla === 'H', m('con el tronco caído al lado, H'));
  r = caso({ acciones: { naturaleza: mata }, fogonApagadoCerca: true });
  assert.ok(r.av?.tecla === 'F', m('junto al fogón apagado, F'));
  r = caso({ acciones: { naturaleza: mata }, semilla: { nombre: 'una semilla de ñire' } });
  assert.ok(r.av?.tecla === 'E', m('con semillas encima (se ofrece en todos lados), la naturaleza'));
  r = caso({ acciones: { naturaleza: mata }, aserrar: 'mano' });
  assert.ok(r.av?.tecla === 'E', m('aserrar a mano (en todos lados), la naturaleza'));
  r = caso({ acciones: { naturaleza: mata }, aserrar: 'banco' });
  assert.ok(r.av?.tecla === 'Y', m('en el banco de aserrar, Y'));
}

const { crearNaturalezaJuego } = await import('../src/naturaleza-juego.js');
bateriaJuego(crearNaturalezaJuego); n += 25;
const { crearNaturalezaMundo } = await import('../src/naturaleza-mundo.js');
await bateriaGotas(crearNaturalezaMundo); n += 2;
const I = await import('../src/interacciones.js');
bateriaAviso(I); n += 8;

// 9. el cine de Ultra: las lecturas del lazo (y las de zDe, que el lazo llama) sin derivadas (el aviso X3595 de la placa)
function bateriaCine(C, et = '') {
  const F = C.FRAG_CINE;
  const lazo = F.slice(F.indexOf('for (int i'), F.lastIndexOf('gl_FragColor = acc'));
  assert.ok(lazo.length > 50 && !lazo.includes('texture2D('), `${et}en el lazo del desenfoque, ninguna lectura con derivadas`);
  const zde = F.slice(F.indexOf('float zDe('), F.indexOf('float cocDe('));
  assert.ok(zde.includes('textureLod(uProf, uv, 0.0)') && !zde.includes('texture2D('), `${et}zDe (que se llama en el lazo) lee sin derivadas`);
}
bateriaCine(await import('../src/ultra-cine.js')); n += 2;

// 10. el tronco en la ladera: se entierra del lado de abajo (el bloque de vegetacion.js, evaluado con un suelo en pendiente)
function bateriaTronco(texto, et = '') {
  const linea = texto.split(String.fromCharCode(10)).find((l) => l.includes('{ const rt = Math.max(0.15, radio - 0.12); let bajo = Infinity;'));
  assert.ok(linea, `${et}vegetacion.js entierra el tronco`);
  const T = { altura: (x) => -0.6 * x };   // una ladera de 31°: baja hacia +x
  const pie = new Function('T', 'x', 'z', 'h', 'radio', `let pie = h - 0.25; ${linea.trim()} return pie;`)(T, 0, 0, 0, 0.7);
  const bajo = Math.min(...Array.from({ length: 8 }, (_, k) => T.altura(Math.cos(k * Math.PI / 4) * 0.58)));
  assert.ok(pie <= bajo - 0.07 && pie > -1.75, `${et}en la ladera el tronco nace bajo el punto más bajo de su contorno (${pie.toFixed(2)} contra ${bajo.toFixed(2)})`);
  const llano = new Function('T', 'x', 'z', 'h', 'radio', `let pie = h - 0.25; ${linea.trim()} return pie;`)({ altura: () => 0 }, 0, 0, 0, 0.7);
  assert.ok(Math.abs(llano + 0.25) < 1e-9, `${et}en lo llano, como siempre (25 cm)`);
}
const textoVeg = leer('src/vegetacion.js');
bateriaTronco(textoVeg); n += 3;
assert.ok(textoVeg.includes('colocar(nombre, x, pie, z, escalaVisual') && textoVeg.includes("colocar('pehuen', x, pie, z, esc"), 'los árboles y los pehuenes se colocan en su pie'); n++;

// 11. la malla del terreno: cada vértice con la altura que se pisa (T.altura en su lugar), no la del nodo de 2 m más cercano
function bateriaMalla(texto, et = '') {
  const linea = texto.split(String.fromCharCode(10)).find((l) => l.trim().startsWith('p.setY(j * (seg + 1) + i,'));
  assert.ok(linea, `${et}main.js arma la malla del terreno`);
  const T = { altura: (x, z) => 0.37 * x + 0.21 * z, alturas: new Float32Array(513 * 513) };
  for (let j = 0; j <= 512; j++) for (let i = 0; i <= 512; i++) T.alturas[j * 513 + i] = T.altura(i * 2 - 512, j * 2 - 512);
  const ys = new Map();
  const p = { setY: (k, y) => ys.set(k, y) };
  const seg = 240;
  new Function('T', 'p', 'seg', 'RES', 'N', `for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) { const salto = RES / seg; ${linea.trim()} }`)(T, p, seg, 512, 513);
  let peor = 0;
  for (let j = 0; j <= seg; j += 7) for (let i = 0; i <= seg; i += 7) peor = Math.max(peor, Math.abs(ys.get(j * (seg + 1) + i) - T.altura(i * 1024 / seg - 512, j * 1024 / seg - 512)));
  assert.ok(peor < 1e-3, `${et}cada vértice a la altura de su lugar (peor: ${peor.toFixed(3)} m)`);
}
const textoMain = leer('src/main.js');
bateriaMalla(textoMain); n++;

// 12. la cordillera: el piedemonte que cae adentro del cuadrado del valle (las esquinas) va bajo el terreno
function bateriaCordillera(texto, et = '') {
  const linea = texto.split(String.fromCharCode(10)).find((l) => l.trim().startsWith('filas(14, LADOS_PIE,'));
  assert.ok(linea, `${et}cielo.js arma el piedemonte`);
  const t = linea.trim(), cuerpo = t.slice('filas(14, LADOS_PIE, '.length, t.length - 2);
  const punto = new Function('piedemonte', `return ${cuerpo};`)(() => 18);
  const esquina = punto(Math.PI / 4, 0);   // anillo de 520 m, en la diagonal: (368, 368), adentro del valle
  const afuera = punto(0, 0);              // anillo de 520 m sobre el eje: (520, 0), afuera
  assert.ok(esquina[1] <= -10, `${et}en la esquina del valle, bajo el terreno (${esquina[1]})`);
  assert.equal(afuera[1], 18, `${et}afuera del valle, como siempre`);
}
bateriaCordillera(leer('src/cielo.js')); n += 2;

// los enganches
{
  const main = leer('src/main.js');
  assert.ok(/pelarPasto: \(x, z, r\) => pelarPastoTemporal\(x, z, r\),\n    col,/.test(main), 'main.js le pasa las colisiones a la naturaleza');
  n++;
}

// ---------------------------------------------------------------- mutaciones
let mutaciones = 0;
async function mutar(nombre, archivoSrc, de, a, bateria) {
  const f = leer(`src/${archivoSrc}`);
  if (!f.includes(de)) throw new Error(`la mutación «${nombre}» no encuentra su texto: ${de}`);
  const archivo = path.join(raiz, 'src', `__mut_4311c_${process.pid}_${mutaciones++}.js`);
  fs.writeFileSync(archivo, f.replace(de, a));
  try {
    const M = await import(pathToFileURL(archivo).href);
    let fallo = false;
    try { await bateria(M); } catch { fallo = true; }
    assert.ok(fallo, `la mutación «${nombre}» tendría que hacer fallar la prueba y pasó`);
    n++;
  } finally { fs.rmSync(archivo, { force: true }); }
}
const juego = (nombre, de, a) => mutar(nombre, 'naturaleza-juego.js', de, a, (M) => bateriaJuego(M.crearNaturalezaJuego, `[${nombre}] `));
await juego('piedritas en los troncos', ' || ocupado(x, z, 0.15)) return null;', ') return null;');
await juego('leña en los troncos', ' && !ocupado(x, z, 0.7);', ';');
await juego('lo despejado cuenta', '      if (o.despejado || o.sinTocon) continue;\n', '');
await juego('las paredes no ocupan', "      if (o.seg) {\n        const ax = o.bx - o.ax", "      if (o.seg && false) {\n        const ax = o.bx - o.ax");
await juego('bajo el puente sí', '    return !!(p && p.alto > T.altura(x, z) + 0.25);', '    return false;');
await juego('se patea desde arriba', ' || Math.abs(p.y - js.pos.y) > 0.45) continue;', ') continue;');
await juego('el agua desde el muelle', 'if (ag && js.pos.y - ag.nivel < 0.9 && !tapado(js, ag.x, ag.z)) c.tocarAgua', 'if (ag) c.tocarAgua');
await juego('el sapito pica en tierra', '    if (k < piques.length) { piques.length = Math.max(1, k); saltos = piques.length - 1; }', '');
await juego('ranas en los troncos', 'if (T.agua(x, z) || ocupado(x, z, 0.2)) continue;', 'if (T.agua(x, z)) continue;');
await juego('a través de la pared', 'if (mejorM && !tapado(js, mejorM.x, mejorM.z)) c.arbusto', 'if (mejorM) c.arbusto');
await mutar('las gotas atraviesan el piso', 'naturaleza-mundo.js', 'if (s && Number.isFinite(piso)) s.piso = piso;', '', (M) => bateriaGotas(M.crearNaturalezaMundo, '[gotas] '));
await mutar('el cine con derivadas en zDe', 'ultra-cine.js', 'min(textureLod(uProf, uv, 0.0).r, 0.99999)', 'min(texture2D(uProf, uv).r, 0.99999)', (M) => bateriaCine(M, '[cine] '));
await mutar('el cine con derivadas en el lazo', 'ultra-cine.js', 'acc += textureLod(uColor, uv, 0.0) * w;', 'acc += texture2D(uColor, uv) * w;', (M) => bateriaCine(M, '[cine] '));
const texto = (nombre, archivo, de, a, bateria) => { const t = leer(archivo); if (!t.includes(de)) throw new Error(`la mutación «${nombre}» no encuentra su texto`); let fallo = false; try { bateria(t.replace(de, a)); } catch { fallo = true; } assert.ok(fallo, `la mutación «${nombre}» tendría que hacer fallar la prueba y pasó`); n++; mutaciones++; };
texto('el tronco no se entierra', 'src/vegetacion.js', 'pie = Math.max(h - 1.75, Math.min(pie, bajo - 0.08));', 'pie = Math.max(h - 1.75, pie);', (t) => bateriaTronco(t, '[tronco] '));
texto('la malla del nodo cercano', 'src/main.js', 'p.setY(j * (seg + 1) + i, T.altura(i * (1024 / seg) - 512, j * (1024 / seg) - 512));', 'p.setY(j * (seg + 1) + i, T.alturas[Math.round(j * salto) * N + Math.round(i * salto)]);', (t) => bateriaMalla(t, '[malla] '));
texto('el piedemonte en las esquinas', 'src/cielo.js', 'return [r, Math.abs(Math.cos(a) * r) < 512 && Math.abs(Math.sin(a) * r) < 512 ? Math.min(y, -12) : y];', 'return [r, y];', (t) => bateriaCordillera(t, '[cordillera] '));
const aviso = (nombre, de, a) => mutar(nombre, 'interacciones.js', de, a, (M) => bateriaAviso(M, `[${nombre}] `));
await aviso('la naturaleza tapa a las otras teclas', 'aviso: (c, a) => (otraTeclaManda(c, a) ? null : a.texto) }', 'aviso: (c, a) => a.texto }');
await aviso('el hacha manda siempre', "    if (en.id === 'hacha' && a?.id !== 'arbol' && !hit.mata) continue;\n", '');
await aviso('aserrar a mano manda', "    if (en.id === 'aserrar' && hit !== 'banco') continue;\n", '');
await aviso('plantar manda', "const CEDE_NATURALEZA = ['fuego-propio', 'hacha',", "const CEDE_NATURALEZA = ['plantar', 'fuego-propio', 'hacha',");
await aviso('el fogón no manda', "'levantar-carpa', 'fogon', 'fogon-puesto'];", "'levantar-carpa', 'fogon-puesto'];");

console.log(`verificar-4-31-1-c: ${n} comprobaciones y ${mutaciones} mutaciones, todo bien`);
