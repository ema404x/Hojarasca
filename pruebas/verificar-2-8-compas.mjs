// 2.8 "Personalización": el perro, el caballo, el kayak, la trochita, las armas, la
// música y el cuaderno. Node: lo que se guarda (sanear), el registro de las secciones,
// las melodías y el tocadiscos, los silbatos, y que cada módulo del mundo tenga su
// enganche. Uso: node pruebas/verificar-2-8-compas.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

const todo = await import('../src/personal-todo.js');
const { seccion } = await import('../src/personalizacion.js');
const perro = await import('../src/personal-perro.js');
const caballo = await import('../src/personal-caballo.js');
const botes = await import('../src/personal-botes.js');
const trochita = await import('../src/personal-trochita.js');
const armas = await import('../src/personal-armas.js');
const musica = await import('../src/personal-musica.js');
const cuaderno = await import('../src/personal-cuaderno.js');

const MIAS = ['perro', 'caballo', 'botes', 'trochita', 'armas', 'musica', 'cuaderno'];
const MODULOS = ['personal-perro', 'personal-caballo', 'personal-botes', 'personal-trochita', 'personal-armas', 'personal-musica', 'personal-cuaderno', 'personal-campos'];

// ---------------------------------------------------------------- 1. registro
{
  const ids = todo.secciones().map((s) => s.id);
  for (const id of MIAS) {
    assert.ok(ids.includes(id), `falta la sección ${id}`);
    const s = seccion(id);
    assert.equal(typeof s.construir, 'function', `${id}: sin construir`);
    assert.equal(typeof s.aplicar, 'function', `${id}: sin aplicar`);
    assert.ok(s.titulo && !/ñ/.test(s.id), `${id}: título o id`);
    // lo de fábrica ya está saneado y sanear no rompe con basura
    const def = s.porDefecto();
    assert.deepEqual(s.sanear(def), def, `${id}: lo de fábrica no pasa su propio sanear`);
    for (const basura of [null, undefined, 7, 'x', [], { __proto__: { x: 1 } }, { constructor: 'x', pelo: 5, nombre: { a: 1 } }]) {
      const r = s.sanear(basura);
      assert.ok(r && typeof r === 'object' && !Array.isArray(r), `${id}: sanear(${JSON.stringify(basura)}) no devuelve un objeto`);
      assert.deepEqual(s.sanear(r), r, `${id}: sanear no es estable`);
    }
  }
  const orden = todo.secciones().map((s) => s.orden);
  assert.equal(new Set(orden).size, orden.length, 'dos secciones con el mismo orden');
  // lo guardado vuelve igual
  const p = todo.sanearPersonal({ perro: { nombre: 'Tobi', pelo: '#2A2521', trucos: { traer: true } }, botes: { casco: '#2f5a74', nombre: 'La Bruja' } });
  assert.equal(p.perro.nombre, 'Tobi');
  assert.equal(p.perro.pelo, '#2a2521');
  assert.equal(p.perro.trucos.traer, true);
  assert.equal(p.botes.nombre, 'La Bruja');
  assert.deepEqual(todo.sanearPersonal(JSON.parse(JSON.stringify(p))), p, 'lo guardado no vuelve igual');
  // lo que presta main.js se usa tal cual: `nota` es una función y no se la llama al buscarla
  const { refDelMundo } = await import('../src/personal-campos.js');
  let llamadas = 0;
  const nota = () => { llamadas++; };
  assert.equal(refDelMundo({ mundo: { nota, caballo: null, caballoMundo: 7 } }, 'nota'), nota);
  assert.equal(refDelMundo({ mundo: { caballo: null, caballoMundo: 7 } }, 'caballo', 'caballoMundo'), 7);
  assert.equal(refDelMundo({ mundo: {} }, 'constructor'), null);
  assert.equal(refDelMundo(null, 'perro'), null);
  assert.equal(llamadas, 0, 'buscar una referencia no llama a la función');
  // y aplicar sin mundo (o con un mundo vacío) no rompe
  for (const id of MIAS) { seccion(id).aplicar(seccion(id).porDefecto(), { mundo: {}, progreso: {} }); seccion(id).aplicar(seccion(id).porDefecto(), {}); }
  console.log('✓ las siete secciones se registran, se sanean y vuelven igual');
}

// ---------------------------------------------------------------- 2. cada sanear
{
  const pr = perro.sanearPerro({ nombre: '  <Firulais>\u0007 del valle que es muy largo ', pelo: 'rojo', dibujo: 'rayado', conCollar: 'si', conBandana: 1, trucos: { sentarse: 'true', avisar: true } });
  assert.equal(pr.nombre, 'Firulais del val', 'el nombre del perro se limpia y se corta (16)');
  assert.equal(pr.pelo, perro.perroPorDefecto().pelo);
  assert.equal(pr.dibujo, 'pecho');
  assert.equal(pr.conCollar, true);
  assert.equal(pr.conBandana, false);
  assert.deepEqual(pr.trucos, { sentarse: false, traer: false, avisar: true });
  assert.notEqual(perro.firmaPerro(pr), perro.firmaPerro({ ...pr, conBandana: true }), 'el pañuelo cambia la malla');
  assert.equal(perro.firmaPerro(pr), perro.firmaPerro({ ...pr, nombre: 'otro', trucos: { traer: true } }), 'el nombre y las pruebas no rearman la malla');

  const cb = caballo.sanearCaballoPersonal({ pelaje: 'constructor', montura: '#ABCDEF', conAlforjas: true });
  assert.equal(cb.pelaje, 'zaino', 'un pelaje como "constructor" no vale');
  assert.equal(cb.montura, '#abcdef');
  assert.ok(cb.conAlforjas);
  for (const p of caballo.PELAJES_CABALLO) assert.match(p.pelo + p.oscuro, /^#[0-9a-f]{6}#[0-9a-f]{6}$/);
  assert.ok(!Object.hasOwn(caballo.PELAJE_CABALLO, 'toString'));

  const bt = botes.sanearBotes({ casco: '#fff', banderin: 'pirata', nombre: 'Nombre larguísimo del bote' });
  assert.equal(bt.casco, botes.botesPorDefecto().casco, 'un color corto no vale');
  assert.equal(bt.banderin, 'ninguno');
  assert.ok(bt.nombre.length <= 14);

  const tr = trochita.sanearTrochita({ silbato: '__proto__', coches: '#123456' });
  assert.equal(tr.silbato, 'clasico');
  assert.equal(tr.coches, '#123456');
  // el silbato de siempre es el de antes (sonido.js 2.7)
  assert.deepEqual(trochita.SILBATOS.clasico.canos, [[520, 0.09], [780, 0.06], [1040, 0.035]]);
  assert.deepEqual(trochita.SILBATOS.clasico.toques, [[0, 1.5]]);
  assert.equal(trochita.silbatoDe('constructor'), trochita.SILBATOS.clasico);
  assert.equal(trochita.silbatoDe('doble').toques.length, 2);
  for (const [id, s] of Object.entries(trochita.SILBATOS)) {
    assert.ok(s.nombre && s.canos.length >= 2 && s.toques.every(([c, l]) => c >= 0 && l > 0.3 && l < 3.5), `silbato ${id}`);
  }

  const ar = armas.sanearArmas({ grabado: 'dragones', plumas: 'azul', nombreBallesta: 'La <b>Justa</b>', lucirForja: 0 });
  assert.equal(ar.grabado, 'ninguno');
  assert.equal(ar.plumas, armas.armasPorDefecto().plumas);
  assert.equal(ar.nombreBallesta, 'La bJusta/b');
  assert.equal(ar.lucirForja, true, 'sólo false apaga lo forjado');
  const forja = armas.forjaVisible(armas.armasPorDefecto(), { lanzaHielo: 1, arcoRayo: 0 });
  assert.deepEqual(forja, { lanza: true, arco: false, honda: false, ballesta: false });
  assert.deepEqual(armas.forjaVisible({ lucirForja: false }, { lanzaHielo: 1 }).lanza, false);
  const base = armas.armasPorDefecto();
  assert.notEqual(armas.firmaArma('hacha', base, {}), armas.firmaArma('hacha', { ...base, grabado: 'aros' }, {}));
  assert.notEqual(armas.firmaArma('lanza', base, {}), armas.firmaArma('lanza', base, { lanza: true }), 'lo forjado rearma la lanza');
  assert.equal(armas.firmaArma('camara', base, {}), '', 'lo que no se personaliza no se rearma');
  assert.equal(armas.nombreDeBallesta({ personal: { armas: { nombreBallesta: 'Justa' } } }, 'Ballesta de mano'), 'Ballesta de mano «Justa»');
  assert.equal(armas.nombreDeBallesta({}, 'Ballesta de mano'), 'Ballesta de mano');

  const cu = cuaderno.sanearCuaderno({ adornos: [
    { tipo: 'sello', ref: 'pehuen', x: 500, y: -3, giro: 90 }, { tipo: 'sello', ref: 'constructor' },
    { tipo: 'nota', ref: '<script>' }, { tipo: 'foto', ref: '../../x' }, { tipo: 'foto', ref: 'f-pudu', x: 10, y: 20 }, { tipo: 'otra', ref: 'x' },
    ...Array.from({ length: 20 }, () => ({ tipo: 'sello', ref: 'luna' })),
  ] });
  assert.deepEqual(cu.adornos[0], { tipo: 'sello', ref: 'pehuen', x: 98, y: 2, giro: 30 });
  assert.equal(cu.adornos[1].ref, 'script', 'la nota se limpia');
  assert.equal(cu.adornos[2].ref, 'f-pudu');
  assert.equal(cu.adornos.length, cuaderno.MAX_ADORNOS, 'no más de doce adornos');
  assert.deepEqual(cuaderno.fotosParaPegar({ desafios: { 'f-pudu': { img: 'data:image/jpeg;base64,xx' }, 'f-zorro': { img: 'http://afuera' }, x: {} } }), ['f-pudu']);
  for (const s of cuaderno.SELLOS) assert.match(s.d, /^M[\d\s.,MLHVCSQTAZmlhvcsqtaz-]+$/, `el dibujo ${s.id} no es un trazo`);
  console.log('✓ cada sección sanea lo suyo (nombres, colores, listas, trucos y adornos)');
}

// ---------------------------------------------------------------- 3. las melodías
{
  assert.deepEqual(musica.leerNotas('A4:1 C#5:0.5 R:2 Bb3:1 X:1 D4:0'), [{ midi: 69, t: 1 }, { midi: 73, t: 0.5 }, { midi: null, t: 2 }, { midi: 58, t: 1 }]);
  const lugares = ['muelle', 'puente', 'mallin', 'faro', 'mirador', 'arrayanes'];
  assert.equal(musica.MELODIAS.filter((m) => m.inicial).length, 1, 'una sola melodía viene de fábrica');
  for (const m of musica.MELODIAS) {
    const notas = musica.leerNotas(m.notas);
    assert.equal(notas.length, m.notas.trim().split(/\s+/).length, `${m.id}: hay notas que no se entienden`);
    const tiempos = notas.reduce((a, n) => a + n.t, 0);
    assert.equal(tiempos % m.compas, 0, `${m.id}: los compases no cierran (${tiempos} tiempos)`);
    assert.equal(m.bajos.length, tiempos / m.compas, `${m.id}: un bajo por compás`);
    const ev = musica.eventosDe(m.id);
    assert.ok(ev.duracion > 8 && ev.duracion < 60, `${m.id}: dura ${ev.duracion.toFixed(1)} s`);
    assert.ok(ev.eventos.every((e, i, a) => i === 0 || a[i - 1].cuando <= e.cuando), `${m.id}: eventos desordenados`);
    assert.ok(notas.every((n) => n.midi === null || (n.midi >= 55 && n.midi <= 84)), `${m.id}: notas fuera de registro`);
    if (!m.inicial) assert.ok(lugares.includes(m.lugar) && m.pista, `${m.id}: sin lugar o sin pista`);
  }
  assert.equal(musica.eventosDe('constructor'), null);

  const d0 = musica.musicaPorDefecto();
  assert.deepEqual(musica.disponibles(d0), ['refugio']);
  assert.equal(musica.siguienteDisco(d0, 'refugio'), null, 'con una sola, después se apaga');
  const prog = {};
  assert.equal(musica.anotarPartitura(prog, 'zamba').id, 'zamba');
  assert.equal(musica.anotarPartitura(prog, 'zamba'), null, 'la misma partitura no se anota dos veces');
  assert.equal(musica.anotarPartitura(prog, 'refugio'), null, 'la de fábrica no es una partitura');
  assert.equal(musica.anotarPartitura(prog, 'toString'), null);
  assert.equal(prog.personal.musica.elegida, 'zamba', 'la primera que encontrás queda puesta');
  musica.anotarPartitura(prog, 'vidala');
  assert.deepEqual(musica.disponibles(prog.personal.musica), ['refugio', 'zamba', 'vidala']);
  assert.equal(musica.siguienteDisco(prog.personal.musica, 'refugio'), 'zamba');
  assert.equal(musica.siguienteDisco(prog.personal.musica, 'vidala'), null);
  assert.deepEqual(musica.sanearMusica({ halladas: ['zamba', 'zamba', 'refugio', 'x', 3], elegida: 'nada', modo: 'loco' }), { elegida: 'refugio', modo: 'una', encendido: true, halladas: ['zamba'] });
  console.log(`✓ ${musica.MELODIAS.length} melodías que se leen y cierran sus compases; las partituras se anotan una vez`);
}

// ---------------------------------------------------------------- 4. el tocadiscos, con un motor de mentira
{
  const tocadas = [];
  const nodo = () => ({ gain: { value: 1, setTargetAtTime() {}, cancelScheduledValues() {} }, connect() {}, disconnect() {} });
  const sonido = {
    ctx: { currentTime: 0, createGain: nodo }, bus: { musica: nodo() }, envioReverb: nodo(), musicaActiva: true,
    pulsar: (midi, o) => tocadas.push({ midi, ...o, ins: 'guitarra' }), quena: (f, o) => tocadas.push({ f, ...o, ins: 'quena' }),
  };
  const T = musica.tocadiscos;
  T.pos = { x: 10, y: 1, z: 10 };
  T.datos = musica.sanearMusica({ elegida: 'refugio' });
  const adentro = { cam: { x: 11, y: 1.6, z: 9 }, espacio: 'adentro' };
  const afuera = { cam: { x: 40, y: 1.6, z: 9 }, espacio: 'bosque' };
  const correr = (seg, e) => { for (let t = 0; t < seg; t += 0.05) { sonido.ctx.currentTime += 0.05; musica.actualizarTocadiscos(sonido, 0.05, e); } };
  correr(2, afuera);
  assert.equal(tocadas.length, 0, 'afuera del refugio no suena');
  assert.equal(musica.tocadiscosSuena(), false);
  correr(3, adentro);
  assert.ok(tocadas.length > 3 && musica.tocadiscosSuena(), `adentro suena el disco (${tocadas.length} notas)`);
  assert.ok(tocadas.every((n) => n.cuando >= 0 && n.cuando < 1.6), 'se programa de a poco, no todo junto');
  correr(1, afuera);
  assert.equal(musica.tocadiscosSuena(), false, 'al salir se calla');
  const antes = tocadas.length;
  correr(2, afuera);
  assert.equal(tocadas.length, antes, 'afuera no sigue programando');
  T.datos = musica.sanearMusica({ elegida: 'refugio', encendido: false });
  correr(3, adentro);
  assert.equal(tocadas.length, antes, 'apagado no suena');
  sonido.musicaActiva = false;
  T.datos = musica.sanearMusica({ elegida: 'refugio' });
  correr(3, adentro);
  assert.equal(tocadas.length, antes, 'con la música apagada en los ajustes no suena');
  T.pos = null; T.datos = null;
  console.log('✓ el tocadiscos suena sólo adentro del refugio, se calla al salir y respeta los ajustes');
}

// ---------------------------------------------------------------- 5. los enganches en el mundo
{
  const enmano = leer('src/enmano.js'), perroJs = leer('src/perro.js'), cab = leer('src/caballo-mundo.js'), kay = leer('src/kayak.js');
  const tro = leer('src/trochita.js'), son = leer('src/sonido.js'), obj = leer('src/objetos.js'), moch = leer('src/mochila.js'), agg = leer('src/personal-todo.js');
  assert.ok(enmano.includes('function personalizar(datos, leerCosas)') && enmano.includes('pivote.userData.enMano = api'), 'enmano: personalizar');
  assert.ok(enmano.includes('firmaArma(id, op.armas, op.forja)') && enmano.includes('soltarModelo(id)'), 'enmano: se rearma lo que cambió');
  assert.ok(/mangoGrabado\(o\.armas\.mango/.test(enmano) && enmano.includes('plumas(o.armas.plumas') && enmano.includes('o.armas.conCintas') && enmano.includes('o.armas.nombreBallesta'), 'enmano: mango, plumas, cintas y nombre');
  assert.ok(enmano.includes('o.forja.lanza') && enmano.includes('o.forja.arco') && enmano.includes('o.forja.honda'), 'enmano: lo forjado se ve');
  assert.ok(perroJs.includes('sanearPerro(progreso?.personal?.perro)'), 'perro: sale como lo dejaste');
  assert.ok(perroJs.includes('function personalizar(datos)') && perroJs.includes("m.g.rotation.order = 'YXZ'"), 'perro: personalizar');
  assert.ok(perroJs.includes('apariencia.trucos.sentarse') && perroJs.includes('apariencia.trucos.traer') && perroJs.includes('apariencia.trucos.avisar'), 'perro: las tres pruebas');
  assert.ok(perroJs.includes('desechar(c, [MAT_FAUNA])') && cab.includes('desechar(c, [MAT_FAUNA])'), 'el material de la fauna no se suelta');
  assert.ok(cab.includes('function personalizar(datos)') && cab.includes('paloEntre(riendas'), 'caballo: personalizar y riendas');
  assert.ok(!/confianza/.test(cab), 'caballo: no se inventa la confianza');
  assert.ok(kay.includes('function personalizar(datos)') && kay.includes('mallaBanderin') && kay.includes('cartelNombre(d.nombre'), 'kayak: casco, nombre y banderín');
  assert.ok(tro.includes('function personalizar(datos)') && tro.includes('repintarVertices(tren.loco') && tro.includes('sonido.silbatoElegido = d.silbato'), 'trochita: pintura, nombre y silbato');
  assert.ok(son.includes('silbato(pos, tipo = this.silbatoElegido)') && son.includes('silbatoDe(tipo)'), 'sonido: el silbato elegido');
  assert.ok(son.includes('actualizarTocadiscos(this, dt, e)') && son.includes('!tocadiscosSuena()'), 'sonido: el tocadiscos y el piano no se pisan');
  assert.ok(obj.includes("partitura: { geo: geoPartitura()") && obj.includes('anotarPartitura(progreso, obj.it.melodia)') && obj.includes('crearTocadiscos(T, escena)'), 'objetos: partituras y tocadiscos');
  assert.ok(obj.includes('rng(2808)'), 'objetos: las partituras tienen su propio azar');
  assert.ok(moch.includes('nombreDeBallesta(progreso,'), 'mochila: el nombre de la ballesta en la barra');
  for (const m of MODULOS.filter((x) => x !== 'personal-campos')) {
    const nombre = `SECCION_${m.replace('personal-', '').toUpperCase()}`;
    assert.ok(agg.includes(`import { ${nombre} } from './${m}.js';`), `personal-todo.js no importa ${m}`);
  }
  console.log('✓ enmano, perro, caballo, kayak, trochita, sonido, objetos y mochila tienen su enganche');
}

// ---------------------------------------------------------------- 6. módulos puros y empaquetables
{
  for (const m of [...MODULOS, 'personal-mallas', 'tocadiscos-mundo']) {
    const t = leer(`src/${m}.js`);
    const puro = m !== 'personal-mallas' && m !== 'tocadiscos-mundo';
    if (puro) assert.ok(!/from 'three'/.test(t), `${m} importa three`);
    // armar.mjs: imports de una línea, con nombre, y sin re-exportar
    for (const l of t.split('\n').filter((x) => /^import\s/.test(x))) assert.match(l, /^import (\{[^}]+\}|\* as THREE) from '[^']+';$/, `${m}: import que armar.mjs no entiende: ${l}`);
    assert.ok(!/^export\s*\{[^}]*\}\s*from/m.test(t) && !/^export\s+default/m.test(t), `${m}: export que armar.mjs no entiende`);
    for (const x of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) assert.ok(!/ñ/.test(x[1]), `${m}: ${x[1]} lleva eñe`);
    // nada del DOM al importarse: document/window sólo adentro de funciones
    for (const l of t.split('\n')) if (/^(const|let|var)\s.*\b(document|window)\./.test(l)) assert.fail(`${m}: toca el DOM al importarse: ${l}`);
  }
  // un solo `lam(color)` del hacha, con su clase: el mango sigue siendo de madera
  assert.ok(leer('src/enmano.js').includes("m.add(palo(lam(color, 'madera'), radio, largo));"));
  console.log('✓ módulos puros, sin eñes en lo exportado y empaquetables por armar.mjs');
}

console.log('OK 2.8 compás: perro, caballo, kayak, trochita, armas, música y cuaderno');
