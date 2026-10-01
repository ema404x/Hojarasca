// 2.8: Personalizar, en Node. El registro de secciones, los saneadores de las cuatro
// secciones propias (personaje, interfaz, bandera y partida), el guardado de ida y vuelta
// (partidas viejas, exportar/sincronizar) y que main.js tenga todo enganchado.
import fs from 'node:fs';
import assert from 'node:assert/strict';

// guardado.js escribe en localStorage: uno de mentira, en memoria
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
};

const P = await import('../src/personalizacion.js');
const TODO = await import('../src/personal-todo.js');
const PJ = await import('../src/personal-personaje.js');
const IF = await import('../src/personal-interfaz.js');
const BA = await import('../src/personal-bandera.js');
const PA = await import('../src/personal-partida.js');
const G = await import('../src/guardado.js');

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const pasos = [];
const ok = (m) => pasos.push(m);

// ---------------------------------------------------------------- 1. el registro
{
  const ids = TODO.secciones().map((s) => s.id);
  for (const id of ['personaje', 'interfaz', 'bandera', 'partida']) assert.ok(ids.includes(id), `falta la sección ${id}`);
  const orden = TODO.secciones().map((s) => s.orden);
  assert.deepEqual(orden, [...orden].sort((a, b) => a - b), 'las secciones salen ordenadas');
  for (const s of TODO.secciones()) assert.ok(!/ñ/.test(s.id), `${s.id}: sin eñe`);
  // las propias (las de los demás tienen sus pruebas)
  for (const s of TODO.secciones().filter((x) => ['personaje', 'interfaz', 'bandera', 'partida'].includes(x.id))) {
    assert.equal(typeof s.titulo, 'string');
    assert.deepEqual(s.sanear(s.porDefecto()), s.porDefecto(), `${s.id}: lo de fábrica ya está saneado`);
    assert.deepEqual(s.sanear(null), s.porDefecto(), `${s.id}: basura → fábrica`);
    assert.deepEqual(s.sanear(s.sanear({ x: 1 })), s.sanear({ x: 1 }), `${s.id}: sanear es idempotente`);
  }
  assert.throws(() => P.registrarSeccion({ id: 'año', sanear: (x) => x, porDefecto: () => ({}) }), /id/);
  assert.throws(() => P.registrarSeccion({ id: 'sin-sanear', porDefecto: () => ({}) }), /sanear/);
  // lo desconocido que sea un objeto se conserva (una versión más nueva), lo demás no
  const s = TODO.sanearPersonal({ futuro: { a: 1 }, numero: 3, lista: [1], __proto__: { malo: 1 }, interfaz: 'basura' });
  assert.deepEqual(s.futuro, { a: 1 });
  assert.ok(!('numero' in s) && !('lista' in s));
  assert.deepEqual(s.interfaz, IF.interfazDefecto());
  assert.deepEqual(TODO.sanearPersonal(null).personaje, PJ.personajeDefecto());
  assert.deepEqual(TODO.sanearPersonal([1, 2]).bandera, BA.banderaDefecto());
  ok('registro: 4 secciones propias ordenadas, saneadas y sin eñe; lo desconocido se conserva');
}

// ---------------------------------------------------------------- 2. tu personaje
{
  const d = PJ.sanearPersonaje({ piel: 'verde', pelo: 'rubio', peinado: 'trenza', contextura: 'robusta', poncho: 'si', colorPoncho: 'calafate', botas: 'goma', guantes: true, colorGuantes: '#ff0000' });
  assert.equal(d.piel, 'trigena', 'un tono que no existe vuelve al de fábrica');
  assert.equal(d.pelo, 'rubio'); assert.equal(d.peinado, 'trenza'); assert.equal(d.contextura, 'robusta');
  assert.equal(d.poncho, false, 'un booleano de mentira no se cuela');
  assert.equal(d.colorPoncho, 'calafate'); assert.equal(d.botas, 'goma');
  assert.equal(d.colorGuantes, 'gris', 'los colores son de la lista, no cualquier hex');
  // desbloqueos: arranca con lo básico, el poncho del telar, las botas del almacén, los tintes del cuaderno
  const nuevo = { entradas: {}, cosas: {} };
  assert.equal(PJ.desbloqueado(nuevo, 'gorro'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'bufanda'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'guantes'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'poncho'), false);
  assert.equal(PJ.desbloqueado({ entradas: { poncho: {} } }, 'poncho'), true, 'tejido en el telar');
  assert.equal(PJ.desbloqueado({ cosas: { poncho: 1 } }, 'poncho'), true, 'el de la carta de Amalia');
  assert.equal(PJ.desbloqueado({ cosas: { poncho: 0 } }, 'poncho'), false);
  assert.equal(PJ.desbloqueado(nuevo, 'botas:cuero'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'botas:goma'), false);
  assert.equal(PJ.desbloqueado({ entradas: { botas: {} } }, 'botas:goma'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'lana:gris'), true);
  assert.equal(PJ.desbloqueado(nuevo, 'lana:calafate'), false);
  assert.equal(PJ.desbloqueado({ entradas: { calafate: {} } }, 'lana:calafate'), true);
  assert.equal(PJ.desbloqueado({ entradas: Object.create({ notro: {} }) }, 'lana:notro'), false, 'sólo anotaciones propias (Object.hasOwn)');
  assert.equal(PJ.desbloqueado(nuevo, 'lana:inventado'), false);
  assert.equal(PJ.desbloqueado(nuevo, 'constructor'), false);
  // el abrigo y la noche de invierno
  assert.equal(PJ.abrigoDeRopa(PJ.personajeDefecto()), 2, 'gorro y bufanda de fábrica');
  const abrigado = { ...PJ.personajeDefecto(), poncho: true };
  assert.equal(PJ.abrigoDeRopa(abrigado), 4);
  assert.equal(PJ.templarNoche('frio', PJ.personajeDefecto()), 'frio', 'la ropa de fábrica sola no alcanza (el juego no cambia para nadie)');
  assert.equal(PJ.templarNoche('frio', abrigado), 'fresco');
  assert.equal(PJ.templarNoche('fresco', abrigado), 'normal');
  assert.equal(PJ.templarNoche('calentito', abrigado), 'calentito');
  assert.equal(PJ.templarNoche('normal', abrigado), 'normal');
  assert.equal(PJ.templarNoche('frio', { ...PJ.personajeDefecto(), bufanda: false, guantes: true, poncho: true }), 'fresco', 'guantes en vez de bufanda también');
  // colores para la mano y el cuerpo
  const pr = { personal: { personaje: { ...PJ.personajeDefecto(), campera: 'musgo' } } };
  assert.equal(PJ.colorManga(pr), PJ.LANAS.find((l) => l.id === 'musgo').color);
  assert.equal(PJ.colorManga({ personal: { personaje: { ...PJ.personajeDefecto(), poncho: true, colorPoncho: 'negro' } } }), '#2e2a26', 'con poncho, la manga es del poncho');
  assert.equal(PJ.colorMano(pr), PJ.PIELES.find((x) => x.id === 'trigena').color);
  assert.equal(PJ.colorMano({ personal: { personaje: { ...PJ.personajeDefecto(), guantes: true, colorGuantes: 'crudo' } } }), '#e2d6bd');
  assert.equal(PJ.colorManga(null), PJ.aspecto(null).campera, 'sin partida, lo de fábrica');
  const a = PJ.aspecto({ ...PJ.personajeDefecto(), gorro: false, botas: 'goma' });
  assert.equal(a.gorro, null); assert.equal(a.botasAltas, true);
  ok('personaje: saneo, desbloqueos (telar, almacén, cuaderno), abrigo que templa la noche, colores de mano y manga');
}

// ---------------------------------------------------------------- 3. tu interfaz
{
  const d = IF.sanearInterfaz({ acento: 'fucsia', letra: '1.1', mira: 'cruz', brujula: 0, minimalista: true });
  assert.deepEqual(d, { acento: 'papel', letra: 1.1, mira: 'cruz', brujula: true, minimalista: true });
  assert.equal(IF.sanearInterfaz({ letra: 3 }).letra, 1, 'nada de letras gigantes o diminutas por fuera de la lista');
  assert.equal(IF.escalaFinal(1.45, IF.interfazDefecto()), 1.45, 'sin retoque manda la accesibilidad (humo-accesibilidad espera 1.45)');
  assert.equal(IF.escalaFinal(1.2, { letra: 1.1 }), 1.32);
  assert.equal(IF.escalaFinal(1, { letra: 0.9 }), 0.9);
  assert.deepEqual(IF.clasesHud({ mira: 'circulo', brujula: false, minimalista: true }), { minimalista: true, 'sin-brujula': true, 'mira-circulo': true });
  assert.equal(IF.colorAcento('lago'), '#7cc4f0'); assert.equal(IF.colorAcento('x'), IF.ACENTOS[0].color);
  // los colores de la paleta daltónica no se tocan: el acento vive en otra variable
  const acc = leer('src/accesibilidad.js');
  assert.ok(!/acento/.test(acc), 'accesibilidad.js no sabe del acento');
  ok('interfaz: acento, letra encima de la accesibilidad, mira, brújula y modo mínimo');
}

// ---------------------------------------------------------------- 4. tu bandera
{
  const d = BA.sanearBandera({ colores: ['#AABBCC', 'rojo', null], cuantos: 7, disposicion: 'espiral', icono: 'pez', colorIcono: '#123456' });
  assert.deepEqual(d.colores, ['#aabbcc', BA.banderaDefecto().colores[1], BA.banderaDefecto().colores[2]]);
  assert.equal(d.cuantos, 3); assert.equal(d.disposicion, 'horizontal'); assert.equal(d.icono, 'pez'); assert.equal(d.colorIcono, '#123456');
  const area = (zs) => zs.reduce((s, z) => s + (z.tipo === 'rect' ? z.w * z.h : 0), 0);
  for (const disposicion of ['horizontal', 'vertical', 'cuarteles']) for (const cuantos of [2, 3]) {
    const zs = BA.zonasBandera({ ...BA.banderaDefecto(), disposicion, cuantos });
    assert.ok(Math.abs(area(zs) - 1) < 1e-9, `${disposicion}/${cuantos}: el paño entero pintado`);
  }
  assert.equal(BA.zonasBandera({ ...BA.banderaDefecto(), cuantos: 2 }).length, 2);
  assert.equal(BA.zonasBandera({ ...BA.banderaDefecto(), disposicion: 'diagonal', cuantos: 3 }).length, 3);
  // se dibuja sobre cualquier contexto 2D (acá uno que anota)
  const llamadas = [];
  const ctx = new Proxy({}, { get: (_o, k) => (k === 'fillStyle' ? undefined : (...args) => llamadas.push([k, ...args])), set: (_o, k, v) => { llamadas.push([k, v]); return true; } });
  for (const icono of BA.ICONOS.map((i) => i.id)) BA.dibujarBandera(ctx, { ...BA.banderaDefecto(), icono }, 192, 128);
  assert.ok(llamadas.some((l) => l[0] === 'fillRect'), 'pinta las franjas');
  assert.ok(llamadas.some((l) => l[0] === 'fillStyle' && l[1] === '#e0b12a'), 'y el dibujo con su color');
  assert.ok(!llamadas.some((l) => l.slice(1).some((v) => typeof v === 'number' && !Number.isFinite(v))), 'sin NaN en los trazos');
  ok('bandera: colores saneados, franjas/cuarteles/diagonal cubren el paño, se dibuja sobre cualquier lienzo');
}

// ---------------------------------------------------------------- 5. tu partida
{
  let d = PA.partidaDefecto();
  assert.deepEqual(PA.sanearPartida({ proxima: { estacion: 'primavera', animales: 'muchos', vecinos: false }, actual: { animales: 'x' } }),
    { proxima: { ...PA.recetaDefecto(), animales: 'muchos', vecinos: false }, actual: { animales: 'normal', vecinos: true }, recetas: [] });
  d = { ...d, proxima: { ...d.proxima, estacion: 'invierno', animales: 'pocos' } };
  let r = PA.guardarReceta(d, '  Invierno solo <b> ');
  assert.equal(r.ok, true);
  assert.equal(r.datos.recetas[0].nombre, 'Invierno solo b', 'el nombre se limpia');
  assert.equal(r.datos.recetas[0].estacion, 'invierno');
  assert.equal(PA.guardarReceta(d, '   ').ok, false, 'sin nombre no se guarda');
  // la misma receta con otro nombre en mayúsculas la reemplaza
  r = PA.guardarReceta({ ...r.datos, proxima: { ...r.datos.proxima, clima: 'lluvioso' } }, 'INVIERNO SOLO B');
  assert.equal(r.datos.recetas.length, 1); assert.equal(r.datos.recetas[0].clima, 'lluvioso');
  // usar y borrar
  let x = { ...r.datos, proxima: PA.recetaDefecto() };
  x = PA.usarReceta(x, 'INVIERNO SOLO B');
  assert.equal(x.proxima.estacion, 'invierno'); assert.equal(x.proxima.animales, 'pocos');
  assert.equal(PA.borrarReceta(x, 'INVIERNO SOLO B').recetas.length, 0);
  // tope de recetas
  let lleno = PA.partidaDefecto();
  for (let i = 0; i < PA.MAX_RECETAS; i++) lleno = PA.guardarReceta(lleno, `r${i}`).datos;
  assert.equal(lleno.recetas.length, PA.MAX_RECETAS);
  assert.equal(PA.guardarReceta(lleno, 'una más').ok, false);
  assert.equal(PA.sanearPartida({ recetas: [...lleno.recetas, ...lleno.recetas, { nombre: 'x' }] }).recetas.length, PA.MAX_RECETAS, 'repetidas y sobrantes afuera');
  // empezar: "como está" no toca los ajustes; lo elegido sí; lo personal pasa y `actual` sale de la receta
  const ajustes = { estacion: 'otono', clima: 'variable', dificultad: 'normal', volumen: 0.5 };
  const igual = PA.empezarConReceta({ partida: PA.partidaDefecto(), personaje: { piel: 'clara' } }, ajustes);
  assert.deepEqual(igual.ajustes, ajustes, 'la receta de fábrica deja todo como estaba');
  assert.deepEqual(igual.personal.personaje, { piel: 'clara' }, 'tu personaje pasa a la partida nueva');
  const conReceta = PA.empezarConReceta({ partida: { proxima: { estacion: 'invierno', clima: 'igual', dificultad: 'implacable', animales: 'muchos', vecinos: false } } }, ajustes);
  assert.deepEqual(conReceta.ajustes, { ...ajustes, estacion: 'invierno', dificultad: 'implacable' });
  assert.deepEqual(conReceta.personal.partida.actual, { animales: 'muchos', vecinos: false });
  assert.equal(PA.factorAnimales({ personal: conReceta.personal }), 1.5);
  assert.equal(PA.vecinosActivos({ personal: conReceta.personal }), false);
  assert.equal(PA.factorAnimales({}), 1, 'una partida vieja: los animales de siempre');
  assert.equal(PA.vecinosActivos(null), true, 'y con vecinos');
  assert.match(PA.resumenReceta({ estacion: 'invierno', animales: 'pocos', vecinos: false }), /Invierno · animales de siempre|Invierno · pocos animales · sin visitas/);
  ok('partida: recetas con nombre (guardar, reemplazar, usar, borrar, tope), empezar con receta sin tocar lo que no eligió');
}

// ---------------------------------------------------------------- 6. el guardado
{
  const n = G.progresoNuevo();
  assert.deepEqual(n.personal, TODO.sanearPersonal(null), 'una partida nueva trae todo de fábrica');
  n.personal.personaje.poncho = true;
  n.personal.bandera.icono = 'arbol';
  n.personal.partida.recetas = [{ nombre: 'Mía', ...PA.recetaDefecto() }];
  assert.equal(G.guardarProgreso(n), true);
  const c = G.cargarProgreso();
  assert.equal(c.personal.personaje.poncho, true);
  assert.equal(c.personal.bandera.icono, 'arbol');
  assert.equal(c.personal.partida.recetas[0].nombre, 'Mía');
  // una partida vieja sin `personal`, o con basura
  almacen.set('hojarasca-v1', JSON.stringify({ dia: 4, horas: 10, entradas: {} }));
  almacen.delete('hojarasca-v1-backup');
  G.usarModoGuardado('relax', 1);
  assert.deepEqual(G.cargarProgreso().personal, TODO.sanearPersonal(null), 'una partida de antes de la 2.8 sale con lo de fábrica');
  almacen.set('hojarasca-v1', JSON.stringify({ dia: 4, entradas: {}, personal: { personaje: 'x', interfaz: { mira: 'cruz', letra: 'mucho' }, otra: { v: 1 } } }));
  G.usarModoGuardado('relax', 1);
  const b = G.cargarProgreso().personal;
  assert.deepEqual(b.personaje, PJ.personajeDefecto());
  assert.equal(b.interfaz.mira, 'cruz'); assert.equal(b.interfaz.letra, 1);
  assert.deepEqual(b.otra, { v: 1 }, 'lo de una versión más nueva no se pierde');
  // exportar e importar (lo mismo que usa la carpeta sincronizada)
  const p = G.progresoNuevo(); p.dia = 2; p.personal.interfaz.minimalista = true;
  assert.equal(G.escribirPartida('relax', 3, p, {}, null), true);
  const l = G.leerPartida('relax', 3);
  assert.equal(l.progreso.personal.interfaz.minimalista, true, 'viaja con la partida exportada');
  assert.equal(G.escribirPartida('desafio', 2, l.progreso, {}, null), true);
  G.usarModoGuardado('desafio', 2);
  assert.equal(G.cargarProgreso().personal.interfaz.minimalista, true, 'y al importarla en otro lugar');
  G.usarModoGuardado('relax', 1);
  ok('guardado: partida nueva, ida y vuelta, partidas viejas y rotas, exportar/importar');
}

// ---------------------------------------------------------------- 7. módulos puros y empaquetado
{
  const todo = leer('src/personal-todo.js');
  for (const linea of todo.split('\n').filter((l) => /^\s*(import|export)\b/.test(l))) {
    assert.ok(/^import\s+\{[^}]+\}\s+from\s+'\.\/[\w-]+\.js';\s*$/.test(linea) || /^export\s*\{[^}]+\}\s*;?\s*$/.test(linea),
      `personal-todo.js: armar.mjs no entiende «${linea.trim()}» (usar import { X } from './x.js';)`);
  }
  for (const f of ['personalizacion', 'personal-todo', 'personal-controles', 'personal-personaje', 'personal-interfaz', 'personal-bandera', 'personal-partida']) {
    const t = leer(`src/${f}.js`);
    assert.ok(!/from 'three'/.test(t), `${f}.js es puro: sin three`);
    // el DOM sólo adentro de funciones (construir): ninguna línea sin sangría lo toca
    assert.ok(!/^(?:const|let|var)[^\n]*document\./m.test(t), `${f}.js no toca el DOM al importarse`);
    for (const m of t.matchAll(/^export\s+(?:const|let|function)\s+([^\s(=]+)/gm)) assert.ok(/^[\w$]+$/.test(m[1]), `${f}.js: ${m[1]} sin eñe`);
  }
  for (const f of ['personal-personaje-mundo', 'personal-bandera-mundo']) {
    const t = leer(`src/${f}.js`);
    for (const g of t.matchAll(/new THREE\.(\w+Geometry)/g)) {
      assert.ok(!/Octahedron|Capsule|Dodecahedron/.test(g[1]), `${f}.js: ${g[1]} no está en el three local`);
    }
    for (const m of t.matchAll(/^export\s+(?:const|let|function)\s+([^\s(=]+)/gm)) assert.ok(/^[\w$]+$/.test(m[1]), `${f}.js: ${m[1]} sin eñe`);
  }
  const three = leer('three-r186-inline.js');
  for (const g of ['CylinderGeometry', 'SphereGeometry', 'ConeGeometry', 'BoxGeometry', 'TorusGeometry', 'PlaneGeometry', 'CanvasTexture']) assert.ok(three.includes(g), `el three local trae ${g}`);
  // la fauna acepta la cantidad, y con 1 sale igual que siempre
  const fauna = leer('src/fauna.js');
  assert.match(fauna, /export function crearFauna\(T, veg, col, escena, sonido, registrar, progreso, opciones = \{\}\)/);
  assert.match(fauna, /casas\.length < Math\.round\(14 \* factorAnimales\)/);
  assert.match(fauna, /Math\.min\(Math\.round\(7 \* factorAnimales\), posadas\.length\)/);
  ok('módulos puros sin three ni DOM al importarse, personal-todo empaquetable, geometrías del three local');
}

// ---------------------------------------------------------------- 8. los ganchos en main.js y la plantilla
{
  const main = leer('src/main.js');
  const html = leer('src/plantilla.html');
  const G_ = leer('src/guardado.js');
  assert.match(G_, /import \{ sanearPersonal \} from '\.\/personal-todo\.js';/);
  assert.match(G_, /personal: sanearPersonal\(null\),/);
  assert.match(G_, /personal: sanearPersonal\(p\.personal\),/);
  assert.match(main, /import \{ secciones, sanearPersonal \} from '\.\/personal-todo\.js';/, 'main importa todas las secciones');
  // el panel: pestañas por sección, api con cambiar/guardar/mundo, aplica todo al cargar y al cambiar
  assert.match(main, /function dibujarPersonal\(\)[\s\S]*?for \(const s of lista\)[\s\S]*?s\.construir\(cont, apiPersonal\(s\)\)/);
  assert.match(main, /function apiPersonal\(s\) \{[\s\S]*?get progreso\(\)[\s\S]*?get datos\(\)[\s\S]*?cambiar: \(parcial\) => cambiarPersonal\(s, parcial\)[\s\S]*?guardar: \(\) => guardar\(\)[\s\S]*?mundo: mundoPersonal/);
  assert.match(main, /function cambiarPersonal\(s, parcial\) \{[\s\S]*?s\.sanear\(\{ \.\.\.antes[\s\S]*?guardar\(\);\s*aplicarPersonal\(\);/);
  assert.match(main, /function aplicarPersonal\(\) \{\s*for \(const s of secciones\(\)\)/);
  assert.match(main, /else jugador\.ubicar\(ref\.puerta\.x, ref\.puerta\.z, ref\.mira\);[\s\S]{0,200}armarMundoPersonal\(\);/, 'se aplica al armar el mundo');
  assert.match(main, /Object\.assign\(mundoPersonal, \{[\s\S]*?escena[\s\S]*?jugador[\s\S]*?perro[\s\S]*?caballo: caballoMundo[\s\S]*?kayak[\s\S]*?tren[\s\S]*?obras[\s\S]*?estructuras: est[\s\S]*?desafio[\s\S]*?sonido[\s\S]*?enmano: enMano/);
  // se abre desde la pausa, la portada, la mochila y F5; Esc lo cierra; pausa la entrada como la guía
  assert.match(main, /\$\('btn-personalizar'\)\.addEventListener\('click', \(\) => abrirPersonal\('pausa'\)\);/);
  assert.match(main, /\$\('btn-personalizar-inicio'\)\.addEventListener/);
  assert.match(main, /\$\('btn-personalizar-mochila'\)\.addEventListener\('click', personalizarDesdeElJuego\);/);
  assert.match(main, /if \(personalAbierto\(\)\) \{ if \(codigo === 'Escape' \|\| e\.code === 'F5'\)/);
  assert.match(main, /if \(e\.code === 'F5' && !accionDeTecla\(teclasPropias, 'F5'\)/, 'F5 sólo si el jugador no la usa para otra cosa');
  assert.match(main, /function personalizarDesdeElJuego\(\) \{[\s\S]*?abrirMochila\(false\);\s*abrir\('pausa'\);\s*abrirPersonal\('pausa'\);/);
  assert.ok(!/Key[A-Z]'?: *'personalizar'|personalizar: 'Key/.test(leer('src/accesibilidad.js')), 'no se robó ninguna letra');
  // los efectos en el juego
  assert.match(main, /const como = templarNoche\(comoSinRopa, progreso\.personal\?\.personaje\);/, 'la ropa abriga al dormir');
  assert.match(main, /crearFauna\(T, veg, col, escena, sonido, registrar, progreso, \{ animales: factorAnimales\(progreso\) \}\)/);
  assert.match(main, /gente: \(\) => \(vecinosActivos\(progreso\) \? gente : null\),/);
  assert.match(main, /if \(visitante \|\| !vecinosActivos\(progreso\) \|\| !tocaVisita\(/);
  assert.match(main, /const conReceta = empezarConReceta\(progreso\.personal, ajustes\);[\s\S]*?progreso = progresoNuevo\(\);\s*progreso\.personal = sanearPersonal\(conReceta\.personal\);/, 'lo personal pasa a la partida nueva');
  assert.match(main, /nueva\.personal = progreso\.personal;/, 'y a la otra vuelta del Desafío');
  assert.match(main, /pintarBanderaEn\(\$\('victoria-bandera'\), progreso\.personal\?\.bandera\);/);
  assert.match(main, /escalaFinal\(escalaLetra\(ajustes\.tamanoLetra\), progreso\?\.personal\?\.interfaz\)/);
  assert.match(main, /actualizarMundoPersonal\(dt, js\);/);
  assert.match(main, /cuerpoJugador\?\.mostrarEnCamara\(true\);/, 'te ves en el modo foto');
  assert.match(main, /barraEl\.classList\.toggle\('reciente'/);
  // el btn-nuevo sigue sin guardar desde la posición vieja (verificar-estabilidad-rc25)
  const bloqueNuevo = main.match(/\$\('btn-nuevo'\)\.addEventListener\('click',[\s\S]*?\n\}\);/)?.[0] || '';
  assert.ok(/empezarConReceta/.test(bloqueNuevo) && !/\bguardar\(\);/.test(bloqueNuevo));
  // la plantilla
  for (const id of ['personalizar', 'personal-pestanas', 'personal-contenido', 'cerrar-personalizar', 'btn-personalizar', 'btn-personalizar-inicio', 'btn-personalizar-mochila', 'victoria-bandera']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `#${id} una vez en la plantilla`);
  }
  assert.match(html, /#personalizar > div \{ zoom: var\(--escala-letra\); \}|#inicio > div, #personalizar > div \{ zoom: var\(--escala-letra\); \}/, 'el panel también se agranda con la letra');
  for (const regla of ['#hud.minimalista .recursos', '#hud.sin-brujula .brujula', '#hud.mira-cruz .mira', '#hud.mira-circulo .mira', '#hud.mira-ninguna .mira', '.aviso kbd { border-color: var(--acento']) assert.ok(html.includes(regla), `falta la regla ${regla}`);
  // el modo mínimo nunca esconde la salud, los avisos ni los subtítulos
  assert.ok(!/#hud\.minimalista [^{]*(desafio-hud|\.aviso|subtitulos|notas)/.test(html), 'el modo mínimo deja lo importante');
  ok('main.js y la plantilla: panel, api, F5/pausa/portada/mochila, ropa al dormir, fauna, vecinos, receta al empezar, bandera en la victoria');
}

console.log(`OK 2.8 personalizar · ${pasos.length} bloques\n  · ${pasos.join('\n  · ')}`);
