// 3.6 (mecánicas): lo que se hace en cada lugar de la Aldea de los Duendes (PLAN_ALDEA §14), sin
// Electron. Pedido del usuario: "trabajá en los detalles también y las mecánicas de cada cosa".
//  · las reglas puras de aldea-mecanicas.js: el aljibe, la bandera, los libros y el préstamo, los
//    cuentos del domingo, el pizarrón y los dibujos, el horario de trenes, la camilla, el mapa del
//    valle, el baile del sábado, los gestos de los oficios y los asientos;
//  · una vez por día donde corresponde (y la camilla comparte el día con la enfermera);
//  · los textos: sin nada religioso (pedido del usuario);
//  · el aviso y la tecla E con el mismo orden (la misma función, en el mismo lugar de main.js);
//  · el guardado (`progreso.mecanicas`), la rutina (el jefe con la bandera, el baile en el salón) y
//    las poses;
//  · aldea-mecanicas-mundo.js con un mundo de mentira: los sentaderos, el aviso y lo que hace E;
//  · las reglas de siempre: imports de una línea, exportados sin ñ, sin programas nuevos.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as MC from '../src/aldea-mecanicas.js';
import * as L from '../src/aldea-lecturas.js';
import * as A from '../src/aldea.js';
import * as G from '../src/aldea-gente.js';
import * as V from '../src/vecindad.js';
import { ENTRADAS, ENTRADA, SECCIONES } from '../src/cuaderno.js';
import { progresoNuevo } from '../src/guardado.js';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// aldea-mecanicas-mundo.js usa three: en Node, el three local del juego (three-r186-inline.js) como módulo
const { crearMecanicasAldea } = await (async () => {
  const codigo = leer('three-r186-inline.js');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  vm.runInNewContext(codigo + '\n;this.__claves = Object.keys(THREE);', caja);
  const archivo = path.join(os.tmpdir(), 'hojarasca-three-mecanicas.mjs');
  fs.writeFileSync(archivo, codigo + '\nexport const { ' + caja.__claves.join(', ') + ' } = THREE;\n');
  register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(archivo).href)}, shortCircuit: true }; return n(s, c); }`));
  return import('../src/aldea-mecanicas-mundo.js');
})();
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ============================================================ 1. el código
{
  for (const f of ['src/aldea-mecanicas.js', 'src/aldea-mecanicas-mundo.js', 'src/aldea-lecturas.js']) {
    const t = leer(f);
    ok(t.startsWith('// 3.6 (mecánicas):'), `${f}: el encabezado con la versión`);
    ok(!t.includes('\r\n'), `${f}: fines de línea LF`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), `${f}: import en una línea: ${m[0]}`);
    for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `${f}: exportado sin ñ: ${m[1]}`);
    ok(!/^export (async function|function\*|\{|.* from )/m.test(t), `${f}: sin exports que armar.mjs no entiende`);
    ok(!/ShapeGeometry|OctahedronGeometry|THREE\.Shape\b|Vector4|Frustum/.test(t), `${f}: nada que el three local no trae`);
  }
  ok(!/three/.test(leer('src/aldea-mecanicas.js').split('\n').filter((l) => l.startsWith('import')).join('\n')), 'las reglas, puras (sin three)');
  ok(!/document\.|window\./.test(leer('src/aldea-mecanicas.js')), 'las reglas, sin DOM');
  const mu = leer('src/aldea-mecanicas-mundo.js');
  // sin compilaciones a mitad del juego: ni luces, ni shaders, ni materiales con otro programa
  ok(!/new THREE\.(PointLight|SpotLight|ShaderMaterial|RawShaderMaterial|MeshStandardMaterial|MeshLambertMaterial|MeshBasicMaterial|MeshPhongMaterial)/.test(mu), 'no crea luces ni materiales de malla');
  const pm = [...mu.matchAll(/new THREE\.PointsMaterial\(\{([^}]*)\}\)/g)].map((m) => m[1]);
  ok(pm.length === 1 && /transparent: true/.test(pm[0]) && /sizeAttenuation: true/.test(pm[0]) && /depthWrite: false/.test(pm[0]) && /map: textura/.test(pm[0]) && !/vertexColors|blending/.test(pm[0]),
    'las partículas: un solo PointsMaterial para las tres nubes (un solo programa)');
  // se arman con la aldea, antes de la compilación de la carga (renderer.compile recorre también lo apagado)
  const main = leer('src/main.js');
  ok(main.indexOf('mecanicasAldea = crearMecanicasAldea(') > 0 && main.indexOf('armarOficiosYAldea(esDesafio);') < main.indexOf("await paso('Afinando los sonidos del bosque'")
    && main.indexOf('await variantesLuces.compilarCarga(') > main.indexOf("await paso('Afinando los sonidos del bosque'"), 'las nubes existen cuando se compila en la carga');
  ok((mu.match(/nube\('aldea-/g) || []).length === 3, 'tres nubes de puntos (chispas, abejas, humo del horno): un dibujo cada una');
  // el mundo: sólo ganchos mínimos, comentados
  const am = leer('src/aldea-mundo.js');
  ok(/3\.6 \(mecánicas\): gancho mínimo/.test(am) && /puntosEdificio: \(id\) => puntosDeEdificio\(id\)/.test(am) && /animablesEstacion/.test(am), 'aldea-mundo.js: el gancho (puntos con nombre y la campana del andén)');
  ok(!/3\.6 \(mecánicas\)/.test(leer('src/aldea-arquitectura.js')), 'aldea-arquitectura.js no se tocó');
}

// ============================================================ 2. el orden de E y del aviso
{
  const main = leer('src/main.js');
  const e0 = main.indexOf("case 'KeyE': {"), e1 = main.indexOf("case 'Tab':", e0);
  const tecla = main.slice(e0, e1);
  const a0 = main.indexOf('let aviso = objetivo ?'), a1 = main.indexOf('const fuegoPropio = ', a0);
  const aviso = main.slice(a0, a1);
  ok(e0 > 0 && a0 > 0, 'están la tecla E y el aviso');
  // en los dos, después de la obra de la aldea y antes de la oveja, el acopio y las puertas
  const orden = (txt, marcas) => marcas.map((m) => txt.indexOf(m));
  const enE = orden(tecla, ['aldeaGente.obraCerca(js.pos)', 'mecanicasAldea.accion(js)', 'ovejaCercana', 'hayAcopioCerca(RADIO_ACOPIO_MANO)', 'puertas.accionar(p)', 'enLaCasaDeTe()']);
  const enAviso = orden(aviso, ['cacheObraAldea && !js.enTren', 'cacheMecanica && !js.enTren', 'ovejaCercana && !objetivo', 'cacheAcopio && !objetivo', 'puertaCerca)', 'enLaCasaDeTe()']);
  ok(enE.every((x, i) => x > 0 && (i === 0 || x > enE[i - 1])), `E: obra de la aldea → mecánicas → oveja → acopio → puerta → casa de té (${enE.join(', ')})`);
  ok(enAviso.every((x, i) => x > 0 && (i === 0 || x > enAviso[i - 1])), `aviso: el mismo orden (${enAviso.join(', ')})`);
  // las mismas condiciones y la misma función (el aviso usa lo que dio `accion` hace un momento)
  ok(/if \(!js\.enTren && !js\.enKayak && !objetivo && mecanicasAldea\) \{ const m = mecanicasAldea\.accion\(js\); if \(m\) \{ m\.hacer\(\);/.test(tecla), 'E: accion(js).hacer()');
  ok(/if \(!aviso && cacheMecanica && !js\.enTren && !js\.enKayak && !objetivo\) aviso = \{ tecla: 'E', texto: cacheMecanica\.texto \};/.test(aviso), 'aviso: accion(js).texto');
  ok(/cacheMecanica = mecanicasAldea \? mecanicasAldea\.accion\(js\) : null;/.test(main), 'el aviso se calcula con la misma función');
  ok(/El aviso visual y la acción usan la misma prioridad/.test(main), 'el comentario de la prioridad sigue en main.js');
  // y adentro, la prioridad es una sola lista
  eq(MC.ORDEN_MECANICAS.slice().sort(), Object.keys(MC.MECANICAS).sort(), 'cada mecánica tiene su lugar en el orden');
  const c = MC.elegirMecanica([{ tipo: 'mapa', d: 0.1 }, { tipo: 'aljibe', d: 1.5 }, { tipo: 'aljibe', d: 0.9 }, { tipo: 'nada', d: 0 }]);
  ok(c.tipo === 'aljibe' && c.d === 0.9, 'la de más prioridad y, entre iguales, la más cercana');
  ok(MC.elegirMecanica([{ tipo: 'duende', d: 0.2 }, { tipo: 'libro', d: 0.7 }]).tipo === 'libro', 'sentado a la mesa, el libro primero');
  ok(MC.elegirMecanica([]) === null && MC.elegirMecanica(null) === null, 'nada a mano: nada');
}

// ============================================================ 3. los textos (nada religioso)
{
  const RELIGIOSO = /\b(dios|dioses|diosa|iglesia|capilla|misa|cura|curas|sacerdote|santo|santa|santos|sagrad\w*|rez\w*|oraci\w*|bendi\w*|milagr\w*|diablo|demonio\w*|[áa]ngel(es)?|pecado|biblia|templo|altar|religi\w*|machi|ngenechen|nguenechen|esp[íi]ritu\w*|alma|almas|cielo eterno|parroquia|pastor|creyente)\b/i;
  const todos = [...MC.textosMecanicas(), ...L.LIBROS_ALDEA.flatMap((l) => [l.titulo, l.de, ...l.partes]), ...L.PLACA_DUENDE.partes, L.CUENTOS_DOMINGO.texto,
    ...ENTRADAS.filter((e) => e.seccion === 'pueblo').flatMap((e) => [e.nombre, e.cientifico, e.pista, e.texto])];
  for (const t of todos) ok(typeof t === 'string' && t.length > 0 && !RELIGIOSO.test(t), `sin nada religioso: «${String(t).slice(0, 60)}»`);
  // y lo que se agregó a main.js, en castellano y sin religión
  const main = leer('src/main.js');
  for (const m of main.matchAll(/3\.6 \(mecánicas\)[^\n]*\n([^\n]*)/g)) ok(!RELIGIOSO.test(m[0]), 'main.js sin religión: ' + m[0].slice(0, 50));
  // los avisos, con su texto exacto
  eq(MC.AVISOS_MECANICAS, {
    libro: 'Leer un libro', estufa: 'Calentarte junto a la estufa', camilla: 'Recostarte en la camilla', prestamo: 'Pedir un libro prestado', aljibe: 'Sacar agua del aljibe',
    duende: 'Leer la plaquita del duende', pizarron: 'Mirar el pizarrón', dibujos: 'Mirar los dibujos de los chicos', horario: 'Mirar el horario de trenes',
    casillas: 'Abrir tu casilla de correo', mapa: 'Mirar el mapa del valle',
    // 3.7.0 (integración): los de la calle de la Loma
    telescopio: 'Mirar por el telescopio', 'cartas-cielo': 'Mirar las cartas del cielo', 'mapa-cumbres': 'Mirar el mapa de las cumbres', espejo: 'Mirarte en el espejo',
  }, 'los avisos');
}

// ============================================================ 4. los libros y el cuaderno
{
  ok(L.LIBROS_ALDEA.length >= 12 && L.LIBROS_ALDEA.length <= 15, `entre 12 y 15 libros (${L.LIBROS_ALDEA.length})`);
  ok(new Set(L.LIBROS_ALDEA.map((l) => l.id)).size === L.LIBROS_ALDEA.length, 'ids sin repetir');
  const temas = new Set(L.LIBROS_ALDEA.map((l) => l.tema));
  ok(['leyenda', 'historia', 'naturaleza'].every((t) => temas.has(t)), 'leyendas, historia y naturaleza');
  for (const l of L.LIBROS_ALDEA) {
    ok(l.partes.length >= 2 && l.partes.length <= 3 && l.partes.every((p) => p.length > 60 && p.length < 320), `${l.id}: una página corta (${l.partes.length} partes)`);
    ok(ENTRADA[l.id]?.seccion === 'pueblo' && ENTRADA[l.id].modo === 'libro', `${l.id}: entrada del cuaderno en «De la aldea»`);
  }
  ok(SECCIONES.some((s) => s.id === 'pueblo' && s.nombre === 'De la aldea'), 'la sección «De la aldea»');
  ok(ENTRADA['duende-plaza']?.seccion === 'pueblo' && ENTRADA['cuentos-domingo']?.seccion === 'pueblo', 'la plaquita y los cuentos del domingo, también');
  ok(new Set(ENTRADAS.map((e) => e.id)).size === ENTRADAS.length, 'el cuaderno sin ids repetidos');
  // el libro de cada mesa: el primero sin leer; con todos leídos, uno por día
  ok(MC.libroParaLeer({}, 1).id === L.LIBROS_ALDEA[0].id, 'el primero sin leer');
  ok(MC.libroParaLeer({ [L.LIBROS_ALDEA[0].id]: {} }, 1).id === L.LIBROS_ALDEA[1].id, 'después, el siguiente');
  const todos = Object.fromEntries(L.LIBROS_ALDEA.map((l) => [l.id, {}]));
  ok(MC.libroParaLeer(todos, 3).id !== MC.libroParaLeer(todos, 4).id, 'leídos todos: uno distinto cada día');
  eq(MC.librosLeidos(todos), L.LIBROS_ALDEA.length);
  // el préstamo: uno por vez, uno por día; se devuelve en el mostrador
  const m = MC.mecanicasNuevas();
  ok(MC.textoPrestamo(m, 5) === 'Pedir un libro prestado', 'el aviso del mostrador');
  const p1 = MC.pedirPrestado(m, {}, 5);
  ok(p1.ok && m.prestado?.id === p1.libro.id && m.prestamos === 1, 'te llevás uno');
  ok(p1.libro.id !== MC.libroParaLeer({}, 5).id, 'uno distinto del de la mesa');
  ok(MC.textoPrestamo(m, 5) === `Devolver «${p1.libro.titulo}»`, 'con uno en la mano, el mostrador dice devolver');
  ok(!MC.pedirPrestado(m, {}, 5).ok, 'no dos a la vez');
  ok(MC.devolverLibro(m).ok && m.prestado === null, 'lo devolvés');
  ok(MC.textoPrestamo(m, 5) === null && !MC.pedirPrestado(m, {}, 5).ok, 'uno por día');
  ok(MC.textoPrestamo(m, 6) === 'Pedir un libro prestado' && MC.pedirPrestado(m, {}, 6).ok, 'mañana, otro');
  ok(MC.avisoPrestado(L.LIBRO_ALDEA['libro-trochita']) === 'Leer «La trochita», el libro prestado', 'el aviso en el refugio');
  // los cuentos del domingo: domingo a la mañana, sentado, en la biblioteca y entero
  const base = { diaSemana: 6, hora: 10.4, sentado: true, enBiblioteca: true, completa: true, personas: ['abuela', 'nena'] };
  ok(MC.cuentoEscuchado(base), 'escuchado entero, sentado, el domingo');
  for (const [k, v] of [['diaSemana', 5], ['sentado', false], ['enBiblioteca', false], ['completa', false], ['personas', ['jefe']], ['hora', 15]]) ok(!MC.cuentoEscuchado({ ...base, [k]: v }), `sin ${k}, no`);
}

// ============================================================ 5. la plaza
{
  // la bandera: arriba de 8 a 19, sube y baja en un cuarto de hora
  ok(MC.izadaA(7.9) === 0 && MC.izadaA(2) === 0 && MC.izadaA(21) === 0, 'de noche, abajo');
  ok(MC.izadaA(8.3) === 1 && MC.izadaA(12) === 1 && MC.izadaA(18.99) === 1, 'de día, arriba');
  let antes = -1, sube = true;
  for (let h = 8; h <= 8.25; h += 0.01) { const f = MC.izadaA(h); sube = sube && f >= antes; antes = f; }
  ok(sube && MC.izadaA(8.12) > 0.2 && MC.izadaA(8.12) < 0.8, 'se iza despacio');
  ok(MC.izadaA(19.1) > 0 && MC.izadaA(19.1) < 1 && MC.izadaA(19.3) === 0, 'se arría a las 19');
  ok(MC.banderaEnMovimiento(8.1) && !MC.banderaEnMovimiento(12) && MC.banderaEnMovimiento(19.1), 'se mueve sólo al izar y al arriar');
  ok(MC.izadaA(NaN) === 0 && MC.izadaA(36) === 1 && MC.izadaA(-12) === 1, 'cualquier hora');
  // el jefe de estación va a la soga a izar y a arriar
  const llena = A.aldeaNueva();
  const LUNES = 0, SABADO = 5;
  eq(A.rutinaAldea('jefe', 7.8, LUNES, llena), { lugar: 'plaza', edificio: 'plaza', punto: 'soga' }, 'a las 8, el jefe iza la bandera');
  eq(A.rutinaAldea('jefe', 18.8, LUNES, llena), { lugar: 'plaza', edificio: 'plaza', punto: 'soga' }, 'a las 19, la arría');
  ok(A.rutinaAldea('jefe', 10, LUNES, llena).edificio === 'estacion-aldea', 'a las 10, en la estación');
  ok(Object.hasOwn(A.puntosDe('plaza'), 'soga'), 'la soga es un punto de la plaza');
  ok(!V.estaLibre('jefe', 7.8, LUNES, { aldea: llena, vecindad: V.vecindadNueva() }) && !V.estaLibre('jefe', 18.8, SABADO, { aldea: llena, vecindad: V.vecindadNueva() }), 'la bandera es una obligación (no se va a tomar el té)');
  eq(G.poseDe({ lugar: 'plaza', punto: 'soga' }), 'izar', 'con la soga en las manos');
  // el aljibe: un trago, una vez por día
  const m = MC.mecanicasNuevas();
  const a1 = MC.sacarAgua(m, 3), a2 = MC.sacarAgua(m, 3), a3 = MC.sacarAgua(m, 4);
  ok(a1.efectos.length === 1 && a1.efectos[0].campo === 'descansado' && a1.efectos[0].valor === MC.ALJIBE.descanso, 'el primer trago del día: un rato descansado');
  ok(a2.efectos.length === 0 && /hoy ya/.test(a2.sub), 'el segundo: sólo el trago');
  ok(a3.efectos.length === 1, 'al otro día, otra vez');
  ok(MC.ALJIBE.descanso <= 1, 'no más que un pedazo de pan');
  // la plaquita del duende: una entrada del cuaderno
  ok(L.PLACA_DUENDE.id === 'duende-plaza' && L.PLACA_DUENDE.partes.length === 2, 'la plaquita');
}

// ============================================================ 6. escuela, estación, puesto, seccional
{
  const ent = { coihue: {}, huemul: {}, estepa: {}, 'libro-trochita': {} };
  const piz = MC.pizarronDelDia(ent, 7);
  ok(['Coihue', 'Huemul', 'La estepa'].some((x) => piz[0].includes(x)), `el pizarrón enseña algo que anotaste: ${piz[0]}`);
  eq(MC.pizarronDelDia(ent, 7), piz, 'el mismo todo el día');
  ok(new Set([1, 2, 3, 4, 5, 6].map((d) => MC.pizarronDelDia(ent, d)[0])).size > 1, 'cambia con los días');
  ok(/en blanco/.test(MC.pizarronDelDia({}, 1)[0]), 'sin anotaciones, el pizarrón espera');
  const dib = MC.dibujosDeLosChicos(ent, 3);
  ok(dib.length === 5 && ['Coihue', 'Huemul', 'La estepa'].every((x) => dib.some((l) => l.includes(`«${x}»`))), 'los dibujos: lo que anotaste');
  ok(/Nahuel|Lucía/.test(dib.join(' ')), 'firmados por los chicos');
  ok(!dib.join(' ').includes('trochita'), 'sólo lo del valle (los libros no se dibujan)');
  // el horario de trenes
  const h = MC.horarioTrenes({ segundos: 150, metros: 900, hora: 10, duracionDia: 30, vuelta: 600 });
  ok(/llega a las 12:00/.test(h[1]) && /faltan unas 2 horas/.test(h[1]), `la próxima llegada, a la hora del juego: ${h[1]}`);
  ok(/vuelta entera/.test(h[2]), 'y cada cuánto pasa');
  ok(/en el andén/.test(MC.horarioTrenes({ enAnden: true })[1]), 'con el tren en el andén');
  eq([MC.cuantoFalta(1), MC.cuantoFalta(25), MC.cuantoFalta(60), MC.cuantoFalta(80), MC.cuantoFalta(130)], ['un minuto', 'unos 25 minutos', 'una hora', 'una hora y 20 minutos', 'unas 2 horas y 10 minutos']);
  ok(Math.abs(MC.minutosDeJuego(60, 30) - 48) < 1e-9 && Math.abs(MC.minutosDeJuego(60, 1440) - 1) < 1e-9, 'segundos reales a minutos del juego');
  // la camilla: el descanso de la enfermera, gratis, una vez por día y el mismo día que ella
  const a = A.aldeaNueva();
  const c1 = MC.descansarEnCamilla(a, 9);
  ok(c1.ok && c1.efectos.some((f) => f.campo === 'descansado' && f.valor === A.SERVICIO.descanso) && c1.efectos.some((f) => f.campo === 'entumecido' && f.valor === 0), 'descansado y sin entumecido');
  ok(a.usos.enfermera === 9, 'cuenta como el día de la enfermera');
  ok(!MC.descansarEnCamilla(a, 9).ok && MC.descansarEnCamilla(a, 9).efectos.length === 0, 'una vez por día');
  const p = { aldea: A.sanearAldea({ pobladores: [{ clave: 'enfermera', dia: 1 }], locales: { 'puesto-sanitario': 1 } }) };
  p.aldea.usos = { enfermera: 9 };
  ok(/ya te revisé/.test(A.servicioDe('enfermera', p, 9).partes[0]) && !MC.descansarEnCamilla(p.aldea, 9).ok, 'si te revisó la enfermera, la camilla no suma (y al revés)');
  ok(MC.descansarEnCamilla(a, 10).ok, 'al otro día, sí');
  // el mapa de la seccional: lo que falta de la fauna y de los lugares, con pistas
  const f0 = MC.faltanDelValle({}, 1);
  const fauna = ENTRADAS.filter((e) => e.seccion === 'fauna').length, lugares = ENTRADAS.filter((e) => e.seccion === 'lugares').length;
  ok(f0[1].includes(`${fauna} animales`) && f0[1].includes(`${lugares} lugares`), `cuánto falta: ${f0[1]}`);
  ok(f0.length === 4 && ENTRADAS.some((e) => f0[2].includes(e.pista)), 'con pistas generales');
  const todo = Object.fromEntries(ENTRADAS.filter((e) => ['fauna', 'lugares'].includes(e.seccion)).map((e) => [e.id, {}]));
  ok(/No te falta nada/.test(MC.faltanDelValle(todo, 1)[1]), 'con todo visto, te felicita');
}

// ============================================================ 7. el salón, los oficios y los asientos
{
  const llena = A.aldeaNueva();
  llena.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
  llena.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  // el sábado de 17 a 19, con el salón abierto
  const SAB = 6, VIE = 5;   // día 6 de la partida: sábado
  ok(A.diaSemanaDe(SAB) === 5 && MC.hayBaile(llena, SAB, 17.5) && MC.hayBaile(llena, SAB, 18.9), 'el sábado de 17 a 19 hay baile');
  ok(!MC.hayBaile(llena, SAB, 16.9) && !MC.hayBaile(llena, SAB, 19) && !MC.hayBaile(llena, VIE, 18) && !MC.hayBaile(A.aldeaNueva(), SAB, 18), 'otro día, otra hora o sin músico, no');
  eq(A.rutinaAldea('musico', 18, 5, llena), { lugar: 'salon', edificio: 'salon', punto: 'escenario' }, 'el músico en el escenario');
  const pts = A.puntosDe('salon');
  for (let k = 1; k <= 8; k++) ok(Object.hasOwn(pts, `baile-${k}`) && A.dentroDePlanta('salon', pts[`baile-${k}`].x, pts[`baile-${k}`].z, 0.5), `baile-${k}, adentro del salón`);
  eq(G.poseDe({ lugar: 'salon', punto: 'baile-3' }), 'bailar', 'en la pista, se baila');
  eq(G.poseDe({ lugar: 'salon', punto: 'escenario' }), 'tocar', 'el músico toca');
  eq(G.poseDe({ lugar: 'salon', punto: 'lugar-2', sentado: true }), 'sentado', 'en las sillas, sentados');
  ok(MC.TANDA_BAILE.every((id) => leer('src/personal-musica.js').includes(`id: '${id}'`)), 'las melodías de siempre');
  ok(MC.melodiaDelBaile(6, 0) !== MC.melodiaDelBaile(6, 1), 'una distinta por tanda');
  // los oficios: mientras el dueño trabaja
  const LUN = 1;
  ok(MC.trabajando(llena, 'herreria', LUN, 10) && MC.trabajando(llena, 'herreria', LUN, 15), 'el herrero en la fragua');
  ok(!MC.trabajando(llena, 'herreria', LUN, 2) && !MC.trabajando(llena, 'herreria', LUN, 13) && !MC.trabajando(A.aldeaNueva(), 'herreria', LUN, 10), 'de noche, al almuerzo o sin herrería, no');
  ok(MC.trabajando(llena, 'panaderia', LUN, 7) && !MC.trabajando(llena, 'panaderia', LUN, 15), 'el horno humea a la mañana');
  ok(MC.trabajando(llena, 'sala-miel', LUN, 12) && !MC.trabajando(llena, 'sala-miel', LUN, 21), 'las abejas, de día');
  ok(MC.hayAbejas(12, 0, 0) && !MC.hayAbejas(12, 1, 0) && !MC.hayAbejas(12, 0, 0.8), 'ni en invierno ni con lluvia');
  eq(G.poseDe({ lugar: 'local', edificio: 'herreria', punto: 'adentro' }), 'martillar', 'el herrero martilla');
  eq(G.poseDe({ lugar: 'local', edificio: 'panaderia', punto: 'adentro' }), 'amasar', 'la panadera amasa');
  eq(G.poseDe({ lugar: 'trabajo', edificio: 'carpinteria', punto: 'trabajo' }), 'serruchar', 'el carpintero sierra');
  eq(G.poseDe({ lugar: 'casa', edificio: 'herreria', punto: 'adentro' }), null, 'en casa, nada');
  const ge = leer('src/gente.js');
  for (const p of ['bailar', 'tocar', 'izar', 'martillar', 'amasar', 'serruchar']) ok(ge.includes(`case '${p}':`), `gente.js: la pose ${p}`);
  ok(CERCA_OK(), 'sólo cerca');
  function CERCA_OK() { return MC.CERCA_GESTOS <= 45 && MC.CERCA_GESTOS >= 30; }
  // los asientos: los públicos, con el nombre de dónde
  ok(MC.asientoValido('una silla de lectura', 'biblioteca') && MC.asientoValido('un banco de la plaza', 'plaza') && MC.asientoValido('un pupitre', 'escuela') && MC.asientoValido('una silla del salón', 'salon'), 'biblioteca, plaza, escuela y salón');
  ok(!MC.asientoValido('el músico', 'salon') && !MC.asientoValido('una silla de la vivienda', 'herreria') && !MC.asientoValido('una silla', 'casa-jefe') && MC.asientoValido('el banco de la galería', 'casa-jefe'), 'ni la silla del músico, ni las viviendas, ni adentro de las casas (el banco de afuera sí)');
  eq(MC.nombreAsiento('una silla de lectura', 'biblioteca'), 'una silla de lectura', 'ya dice de qué es');
  eq(MC.nombreAsiento('un pupitre', 'escuela'), 'un pupitre de la escuela');
  eq(MC.nombreAsiento('una silla del salón', 'salon'), 'una silla del salón');
  eq(MC.nombreAsiento('una silla', 'biblioteca'), 'una silla de la biblioteca');
}

// ============================================================ 8. el guardado
{
  eq(MC.sanearMecanicas(null), MC.mecanicasNuevas(), 'nada: de cero');
  const roto = MC.sanearMecanicas({ usos: { aljibe: '7', prestamo: -3, toString: 9, __proto__: { x: 1 } }, prestado: { id: 'no-existe', dia: 2 }, prestamos: Infinity });
  eq(roto, { usos: { aljibe: 7 }, prestado: null, prestamos: 0 }, 'lo roto, saneado');
  eq(MC.sanearMecanicas({ prestado: { id: 'libro-huemul', dia: 'x' } }).prestado, { id: 'libro-huemul', dia: 1 }, 'el libro prestado se conserva');
  ok(MC.yaHoy({ usos: { aljibe: 3 } }, 'aljibe', 3) && !MC.yaHoy({ usos: { aljibe: 3 } }, 'aljibe', 4) && !MC.yaHoy(null, 'aljibe', 3), 'una vez por día');
  const g = leer('src/guardado.js');
  ok(/mecanicas: mecanicasNuevas\(\)/.test(g) && /mecanicas: sanearMecanicas\(p\.mecanicas\)/.test(g), 'guardado.js lo crea y lo sanea');
  try { eq(progresoNuevo().mecanicas, MC.mecanicasNuevas(), 'una partida nueva, sin nada'); } catch (e) { if (!/localStorage/.test(String(e))) throw e; }
}

// ============================================================ 9. el mundo (con uno de mentira)
{
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const M = A.marcoAldea(A.PARADA_ALDEA);
  const c = M.aMundo(22, 50);
  const P = (dx, dz, y = 20, mira = 0) => ({ x: c.x + dx, y, z: c.z + dz, mira });
  const puntos = {
    plaza: { id: 'plaza', version: 'v1', nombrados: { aljibe: P(0, 0), duende: P(10, 0) }, asientos: [{ ...P(3, 3, 20.5), nombre: 'un banco de la plaza' }], extra: {} },
    biblioteca: { id: 'biblioteca', version: 'v1', nombrados: { adentro: P(20, 0), estufa: P(24, 0) }, asientos: [{ ...P(22, 2, 20.8), nombre: 'una silla de lectura' }, { ...P(22, 4, 20.8), nombre: 'el banco de la biblioteca' }], extra: {} },
    'casa-jefe': { id: 'casa-jefe', version: 'v1', nombrados: {}, asientos: [{ ...P(40, 0, 20.8), nombre: 'una silla' }, { ...P(40, 3, 20.8), nombre: 'el banco de la galería' }], extra: {} },
  };
  const mundo = { puntosEdificio: (id) => puntos[id] || null, animables: () => [], animablesEstacion: () => [], emisores: () => [], adentro: () => null };
  const sentaderos = [{ nombre: 'el banco del refugio' }];
  const progreso = { dia: 3, horas: 10, entradas: {}, aldea: A.aldeaNueva() };
  const hechos = [];
  const js = { pos: vec(c.x, 20, c.z - 1), yaw: Math.PI, sentado: false, entumecido: 0 };   // de frente al aljibe (+z): yaw π mira a +z
  const mc = crearMecanicasAldea({
    mundo, gente: () => null, escena: null, sonido: null, col: null, progreso: () => progreso, jugador: () => ({ estado: js }), tren: () => null, sentaderos,
    registrar: (id) => hechos.push(['registrar', id]), nota: (t, s) => hechos.push(['nota', t, s]), guardar: () => {}, leer: (l) => hechos.push(['leer', l.quien, l.id || null, l.partes.length]),
    sentarEn: (s) => hechos.push(['sentar', s]), alJugador: (k, v) => { js[k] = v; hechos.push(['jugador', k, v]); }, abrirCasilla: () => hechos.push(['casilla']), enCasa: () => false,
    duracionDia: () => 30, ambiente: () => ({ invierno: 0, lluvia: 0, viento: 0.3 }),
  });
  mc.actualizar(0.016, { x: c.x, z: c.z });
  ok(mc.medir().listo, 'lee los puntos del mundo');
  // los sentaderos: los públicos y el banco de afuera de la casa, con su nombre; el de siempre queda
  const nombres = sentaderos.map((s) => s.nombre);
  ok(nombres.includes('el banco del refugio') && nombres.includes('un banco de la plaza') && nombres.includes('una silla de lectura') && nombres.includes('el banco de la biblioteca'), `los asientos de la aldea son sentaderos (${nombres.join(', ')})`);
  ok(nombres.includes('el banco de la galería') && !nombres.includes('una silla'), 'en las casas, sólo el banco de afuera');
  const lect = sentaderos.find((s) => s.nombre === 'una silla de lectura');
  ok(Math.abs(lect.y - 20.82) < 1e-6 && Math.abs(lect.mira - Math.PI) < 1e-9, 'la altura del asiento y el yaw del jugador (al revés del muñeco)');
  // al rearmarse un edificio, sus sentaderos se cambian (no se duplican)
  puntos.plaza = { ...puntos.plaza, version: 'v2', asientos: [{ ...P(3, 3, 20.5), nombre: 'un banco de la plaza' }, { ...P(-3, 3, 20.5), nombre: 'un banco de la plaza' }] };
  mc.revisar();
  ok(sentaderos.filter((s) => s.nombre === 'un banco de la plaza').length === 2 && sentaderos.length === 1 + 2 + 2 + 1, 'rearmada la plaza, sus bancos de nuevo y sin repetir');
  // el aviso y E: el aljibe, una vez por día
  let a = mc.accion(js);
  ok(a && a.tipo === 'aljibe' && a.texto === 'Sacar agua del aljibe', `al lado del aljibe: «${a?.texto}»`);
  a.hacer();
  ok(js.descansado === MC.ALJIBE.descanso && progreso.mecanicas.usos.aljibe === 3, 'un trago: un rato descansado');
  js.descansado = 0; mc.accion(js).hacer();
  ok(!js.descansado, 'el segundo trago del día no suma');
  js.yaw = 0;   // de espaldas
  ok(mc.accion(js) === null, 'de espaldas, nada');
  // el mostrador de la biblioteca
  js.pos.set(c.x + 20, 20, c.z - 1); js.yaw = Math.PI;
  a = mc.accion(js);
  ok(a?.tipo === 'prestamo' && a.texto === 'Pedir un libro prestado', 'en el mostrador');
  a.hacer();
  ok(progreso.mecanicas.prestado && mc.accion(js)?.texto.startsWith('Devolver «'), 'te lo llevás; después, devolver');
  // sentado a la mesa de lectura: un libro
  js.pos.set(c.x + 22, 20.82 - 0.45, c.z + 2); js.sentado = true;
  a = mc.accion(js);
  ok(a?.tipo === 'libro' && a.texto === 'Leer un libro', 'sentado a la mesa: leer un libro');
  a.hacer();
  ok(hechos.some((h) => h[0] === 'leer' && h[1] === 'Biblioteca Popular' && h[2] === L.LIBROS_ALDEA[0].id), 'se abre la página del primero (y al terminarla queda en el cuaderno)');
  // la estufa: sólo con frío (el entumecido)
  js.sentado = false; js.pos.set(c.x + 23, 20, c.z); js.yaw = -Math.PI / 2;
  ok(mc.accion(js)?.tipo !== 'estufa' && mc.juntoAEstufa(js.pos), 'sin frío no hay aviso (pero estás junto a la estufa)');
  js.entumecido = 0.8;
  a = mc.accion(js);
  ok(a?.tipo === 'estufa' && a.texto === 'Calentarte junto a la estufa', 'entumecido: calentarte');
  a.hacer();
  ok(js.entumecido === 0, 'se te va el frío');
  js.pos.set(c.x + 30, 20, c.z);
  ok(!mc.juntoAEstufa(js.pos), 'lejos de la estufa, no');
  // el libro prestado se lee en el refugio
  const mc2 = crearMecanicasAldea({ ...{ mundo, gente: () => null, escena: null, sonido: null, col: null, progreso: () => progreso, jugador: () => ({ estado: js }), tren: () => null, sentaderos: [] },
    registrar() {}, nota() {}, guardar() {}, leer: (l) => hechos.push(['leer-casa', l.id]), sentarEn() {}, alJugador() {}, abrirCasilla() {}, enCasa: () => true, duracionDia: () => 30, ambiente: () => ({}) });
  mc2.revisar();
  js.sentado = true; js.pos.set(c.x + 500, 20, c.z);
  a = mc2.accion(js);
  ok(a?.tipo === 'libro-prestado' && a.texto === `Leer «${L.LIBRO_ALDEA[progreso.mecanicas.prestado.id].titulo}», el libro prestado`, `sentado en casa: «${a?.texto}»`);
  // lejos de la aldea no calcula nada y apaga lo suyo
  const t0 = mc.medir().revisiones;
  mc.actualizar(0.016, { x: c.x + 2000, z: c.z });
  ok(mc.medir().revisiones === t0 && mc.medir().dibujos === 0, 'lejos: nada');
  ok(MC.LEJOS_MECANICAS >= 150, 'el corte, más allá de la aldea');
}

// ============================================================ 10. los puntos del plano, sobre los muebles de verdad
{
  // la gente de la aldea va a los puntos de aldea.js; los muebles son los de aldea-arquitectura.js: las
  // sillas de lectura, el sillón de los cuentos, los pupitres, la maestra en el pizarrón y las sillas
  // del salón tienen que coincidir (si no, se sientan en el aire)
  const ARQ = await import('../src/aldea-arquitectura.js');
  const giro = (a) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  const igual = (id, plano, arq) => {
    const e = A.EDIFICIOS_ALDEA[id], N = ARQ.armarEdificio(id, 4).puntos.nombrados, P = A.puntosDe(id);
    const c = Math.cos(e.rot), s = Math.sin(e.rot);
    for (const [kp, ka] of Object.entries(plano)) {
      const p = P[kp], q = N[ka];
      ok(p && q, `${id}: ${kp} y ${ka}`);
      const dx = p.x - e.x, dz = p.z - e.z, bx = dx * c - dz * s, bz = dx * s + dz * c;
      ok(Math.hypot(bx - q.lx, bz - q.lz) < 0.06 && giro(p.rot - e.rot - q.mira) < 0.05, `${id}.${kp} sobre ${ka} de la arquitectura (${bx.toFixed(2)}, ${bz.toFixed(2)} / ${q.lx}, ${q.lz})`);
    }
  };
  igual('biblioteca', { ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`lectura-${i + 1}`, `lectura-${i + 1}`])), cuentos: 'cuentos', cliente: 'adentro' });
  igual('escuela', { ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`pupitre-${i + 1}`, `pupitre-${i + 1}`])), adentro: 'pizarron' });
  igual('salon', Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`lugar-${i + 1}`, `lugar-${i + 1}`])));
  ok(Object.keys(A.puntosDe('biblioteca')).filter((k) => k.startsWith('lectura-')).length === 16, 'dieciséis lugares para los cuentos (doce sillas y cuatro almohadones)');
}

// 3.6: al mostrador no te tapa la E quien está ahí: para hablarle hay que mirarlo de frente, y lo del lugar queda en su menú
{
  const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const gente = fs.readFileSync(new URL('../src/gente.js', import.meta.url), 'utf8');
  ok(gente.includes('function cerca(js, camara, deFrente = false)') && gente.includes('const minimo = deFrente ? 0.9 : 0.45;'), 'gente.cerca con deFrente');
  ok(main.includes('vecino = gente.cerca(js, camara, true);') && main.includes('function accionDelLugar()') && main.includes("if (m.opciones[i].id === '__lugar')"), 'el mostrador gana y queda en el menú de la charla');
}

console.log(`OK 3.6.0 mecánicas · ${n} verificaciones · ${L.LIBROS_ALDEA.length} libros, ${MC.ORDEN_MECANICAS.length} cosas para hacer con E, una vez por día donde corresponde, sin nada religioso`);
