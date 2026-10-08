// 3.7.5 (fiestas): las fiestas y las fechas, sin Electron.
//  · fiestas.js (puro): el calendario del año de 12 días (las de cada estación, el Día de la Aldea, las fechas patrias,
//    la minga, la noche de la leyenda), las que no son fijas (la gran nevada, tu cumpleaños, los 90 de la abuela), las
//    fases de cada día, el gancho de actividades (los concursos de «noticias»), la música de cada una, los invitados,
//    los recuerdos, la minga, la jineteada, la clase de baile, la nevada solidaria, el predio y quién va a dónde, el
//    guardado (saneado y migración);
//  · el calendario del cuaderno (aldea-vida.js) con las fiestas, y el aviso del día antes;
//  · fiestas-juego.js con un contexto de mentira (sin DOM): la fecha de ahora, los destinos, E y el aviso, la mesa larga,
//    la jineteada, el truco desde la rueda, la minga, la nevada, los recuerdos y la foto;
//  · los enganches: main.js (E y el aviso en el mismo orden, el panel, la cámara, el clima, la foto, el álbum),
//    guardado.js, plantilla.html, gente.js (las poses), vecindad-social.js (el truco de verdad);
//  · nada religioso, sin inglés nuevo, comentarios con 3.7.5, imports en una línea, exportados sin ñ.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad|ángel|amén|pecado|navidad|pesebre|patron[oa]/i;

const almacen = new Map();
globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };

const F = await import('../src/fiestas.js');
const A = await import('../src/aldea.js');
const AV = await import('../src/aldea-vida.js');
const FJ = await import('../src/fiestas-juego.js');
const GU = await import('../src/guardado.js');

// ============================================================ 1. los módulos
{
  for (const f of ['src/fiestas.js', 'src/truco.js', 'src/juegos-mesa.js']) {
    const t = leer(f);
    ok(!/from 'three'|document\.|window\./.test(t), `${f}: puro (sin three ni DOM)`);
  }
  ok(!/from 'three'/.test(leer('src/fiestas-juego.js')), 'fiestas-juego.js: sin three');
  for (const f of ['src/fiestas.js', 'src/fiestas-juego.js', 'src/fiestas-mundo.js', 'src/truco.js', 'src/juegos-mesa.js']) {
    const t = leer(f);
    ok(/3\.7\.5/.test(t), `${f}: comentarios con 3.7.5`);
    ok(!t.includes('\r'), `${f}: fines de línea LF`);
    for (const l of t.split('\n').filter((x) => /^\s*import\b/.test(x))) ok(/^import \{ [^}]+ \} from '\.\/[a-z0-9-]+\.js';$|^import \* as THREE from 'three';$/.test(l), `${f}: import en una línea (${l.slice(0, 60)})`);
    ok(!/^export (async function|function\*|\* from|\{[^}]*\} from)/m.test(t), `${f}: sin export raros`);
    for (const m of t.matchAll(/^export (?:const|function|let) ([^\s(=]+)/gm)) ok(!/ñ/.test(m[1]), `${f}: ${m[1]} sin ñ`);
    ok(!/ShapeGeometry|new THREE\.Shape\b|OctahedronGeometry|Vector4|Frustum/.test(t), `${f}: sin lo que el three local no trae`);
  }
}

// ============================================================ 2. el calendario
{
  ok(F.FECHAS.length >= 8, 'las fechas del año');
  const dias = new Set();
  for (const f of F.FECHAS) {
    ok(/^[a-z0-9-]{1,40}$/.test(f.id) && typeof f.nombre === 'string' && f.nombre.length > 3, `${f.id}: id y nombre`);
    ok(f.diaDelAnio >= 1 && f.diaDelAnio <= A.DIAS_ANIO, `${f.id}: un día del año`);
    ok(!dias.has(f.diaDelAnio), `${f.id}: una fecha por día`);
    dias.add(f.diaDelAnio);
    ok(Object.hasOwn(F.PROGRAMAS, f.programa) && F.programaDe(f).length > 0, `${f.id}: su programa`);
    ok(Object.hasOwn(F.RECUERDOS, f.id), `${f.id}: su recuerdo`);
    ok(F.actividadesDeFiesta(f.id).length > 0, `${f.id}: sus actividades`);
    ok(AV.sanearFiesta({ id: f.id, nombre: f.nombre, diaDelAnio: f.diaDelAnio, texto: f.texto }) !== null, `${f.id}: entra en el calendario de aldea-vida.js`);
  }
  // una por estación, cada una con su música
  const est = F.FECHAS.filter((f) => f.tipo === 'fiesta');
  eq(est.map((f) => AV.estacionDelAnio(f.diaDelAnio).id).sort(), ['invierno', 'otono', 'verano'], 'una fiesta por estación, en su estación');
  for (const f of est) ok(f.estacion === AV.estacionDelAnio(f.diaDelAnio).id, `${f.id}: su estación`);
  eq(new Set(est.map((f) => F.musicaDe(f))).size, 3, 'cada fiesta de estación con su música');
  ok(est.map((f) => F.musicaDe(f)).includes('chamame') && est.map((f) => F.musicaDe(f)).includes('loncomeo') && est.map((f) => F.musicaDe(f)).includes('sur'), 'chamamé, loncomeo y folklore del sur');
  ok(F.FECHAS.filter((f) => f.tipo === 'patria').length === 2 && F.FECHAS.some((f) => f.tipo === 'aldea') && F.FECHAS.some((f) => f.tipo === 'minga') && F.FECHAS.some((f) => f.tipo === 'leyenda'), 'el Día de la Aldea, las fechas patrias, la minga y la leyenda');
  // fechaDe: { id, nombre, tipo }, y el año que vuelve
  for (const f of F.FECHAS) {
    const x = F.fechaDe(f.diaDelAnio);
    ok(x && x.id === f.id && x.nombre === f.nombre && x.tipo === f.tipo, `fechaDe(${f.diaDelAnio}) → ${f.id}`);
    ok(F.fechaDe(f.diaDelAnio + A.DIAS_ANIO * 3)?.id === f.id && F.fechaDe(f.diaDelAnio + A.DIAS_ANIO * 3).anio === 4, `${f.id}: también el año 4`);
  }
  const vacios = [...Array(A.DIAS_ANIO).keys()].map((i) => i + 1).filter((d) => !dias.has(d));
  for (const d of vacios) ok(F.fechaDe(d) === null || F.fechaDe(d).tipo === 'cumple-jugador', `día ${d}: sin fecha fija`);
  // la gran nevada: sólo en invierno de verdad, en uno de sus días
  ok(F.DIAS_NEVADA.every((d) => AV.estacionDelAnio(d).id === 'invierno'), 'la nevada cae en invierno');
  for (let anio = 1; anio <= 6; anio++) {
    const d = F.diaNevada(anio, 77), dia = (anio - 1) * 12 + d;
    ok(F.fechasDelDia(dia, { invierno: true, semilla: 77 }).some((x) => x.tipo === 'nevada'), `año ${anio}: la nevada el día ${d}`);
    ok(!F.fechasDelDia(dia, { invierno: false, semilla: 77 }).some((x) => x.tipo === 'nevada'), `año ${anio}: sin invierno (estación fija en verano), no nieva`);
  }
  // tu cumpleaños: fiesta sorpresa sólo con amigos
  const st = F.fiestasNuevas();
  ok(F.fechasDelDia(F.CUMPLE_JUGADOR, { estado: st, amigos: 0 }).find((x) => x.tipo === 'cumple-jugador')?.sorpresa === false, 'tu cumpleaños sin amigos: sin sorpresa');
  ok(F.hayFiestaSorpresa(F.CUMPLE_JUGADOR, { estado: st, amigos: 3 }), 'con amigos: fiesta sorpresa');
  ok(F.fiestaDeAhora(F.CUMPLE_JUGADOR, 19, { estado: st, amigos: 0 }) === null && F.fiestaDeAhora(F.CUMPLE_JUGADOR, 19, { estado: st, amigos: 3 })?.fase.fase === 'sorpresa', 'la sorpresa a la tardecita');
  ok(F.elegirCumple(st, 7) && F.cumpleDelJugador(st) === 7 && !F.elegirCumple(st, 13), 'se puede elegir el día (del 1 al 12)');
  // los 90 de la abuela
  ok(F.fechasDelDia(10, { noventa: true }).some((x) => x.tipo === 'noventa'), 'los 90 de la abuela, cuando aldea.js dice');
  // las fases
  const fruta = F.fechaPorId('fiesta-verano');
  eq(F.programaDe(fruta).map((p) => p.fase), ['llegada', 'mesa', 'juegos', 'baile'], 'la fiesta de estación: la llegada, la mesa larga, los juegos y el baile');
  ok(F.faseDe(fruta, 13)?.fase === 'mesa' && F.faseDe(fruta, 15)?.fase === 'juegos' && F.faseDe(fruta, 19)?.fase === 'baile' && F.faseDe(fruta, 23) === null, 'las fases por hora');
  ok(F.fiestaDeAhora(2, 13)?.fecha.id === 'fiesta-verano' && F.fiestaDeAhora(2, 7) === null && F.fiestaDeAhora(9, 21)?.fase.fase === 'fogon', 'la fiesta de ahora');
  // el calendario del cuaderno
  const lista = [];
  ok(F.cargarFiestasEnCalendario(lista) === F.FECHAS.length + 1 && F.cargarFiestasEnCalendario(lista) === F.FECHAS.length + 1 && lista.length === F.FECHAS.length + 1, 'cargar las fiestas en el calendario (dos veces: no se duplican)');
  const ev = AV.eventosDelDia(2, { fiestas: lista });
  ok(ev.some((e) => e.tipo === 'fiesta' && e.id === 'fiesta-verano'), 'el calendario de aldea-vida.js trae la fiesta');
  const av = AV.avisoDiaAntes(1, { fiestas: lista, aldea: A.aldeaNueva() });
  ok(av && /fruta fina/i.test(av.titulo), `el aviso del día antes (${av?.titulo})`);
  F.cargarFiestasEnCalendario(lista, { cumple: 5 });
  ok(lista.filter((x) => x.id === 'cumple-jugador').length === 1 && lista.find((x) => x.id === 'cumple-jugador').diaDelAnio === 5, 'tu cumpleaños se mueve en el calendario');
}

// ============================================================ 3. el gancho de actividades (para «noticias»)
{
  const antes = F.actividadesDeFiesta('fiesta-verano').length;
  ok(F.registrarActividad('fiesta', { id: 'concurso-dulce', nombre: 'Concurso de dulce', fase: 'mesa' }), 'registrar en todas las de estación');
  ok(F.actividadesDeFiesta('fiesta-verano').some((a) => a.id === 'concurso-dulce') && F.actividadesDeFiesta('fiesta-cosecha').some((a) => a.id === 'concurso-dulce') && !F.actividadesDeFiesta('minga').some((a) => a.id === 'concurso-dulce'), 'por tipo');
  ok(F.actividadesDeFiesta.registrar('fiesta-nieve', { id: 'concurso-poncho', nombre: 'Concurso de poncho' }) && F.actividadesDeFiesta('fiesta-nieve').some((a) => a.id === 'concurso-poncho'), 'por id, con actividadesDeFiesta.registrar');
  ok(F.registrarActividad('*', { id: 'concurso-foto', nombre: 'Concurso de foto' }) && F.actividadesDeFiesta('leyenda').some((a) => a.id === 'concurso-foto'), 'a todas');
  F.registrarActividad('fiesta', { id: 'concurso-dulce', nombre: 'Concurso de dulces caseros' });
  ok(F.actividadesDeFiesta('fiesta-verano').filter((a) => a.id === 'concurso-dulce').length === 1 && F.actividadesDeFiesta('fiesta-verano').find((a) => a.id === 'concurso-dulce').nombre === 'Concurso de dulces caseros', 'registrar dos veces reemplaza');
  ok(!F.registrarActividad('', { id: 'x' }) && !F.registrarActividad('fiesta-nieve', null) && !F.registrarActividad('fiesta-nieve', { nombre: 'sin id' }), 'lo roto no se registra');
  ok(F.quitarActividad('fiesta', 'concurso-dulce') && F.actividadesDeFiesta.quitar('fiesta-nieve', 'concurso-poncho') && F.quitarActividad('*', 'concurso-foto') && F.actividadesDeFiesta('fiesta-verano').length === antes, 'y se quitan');
  ok(F.actividadesDeFiesta('no-existe').length === 0, 'una fiesta que no existe: nada');
}

// ============================================================ 4. la música, los invitados, los recuerdos, la leyenda
{
  for (const id of F.ORDEN_MUSICAS) {
    const e = F.eventosMusica(id);
    ok(e && e.eventos.length > 40 && e.duracion > 20 && e.eventos.every((x) => Number.isFinite(x.cuando) && x.dur > 0), `${id}: la música se arma (${e?.eventos.length} golpes, ${e?.duracion.toFixed(0)} s)`);
    ok(e.eventos.some((x) => x.voz === 'melodia') && e.eventos.some((x) => x.voz === 'bajo'), `${id}: melodía y bajos`);
  }
  ok(F.eventosMusica('loncomeo').eventos.some((x) => x.voz === 'bombo') && F.eventosMusica('chacarera').eventos.some((x) => x.voz === 'bombo'), 'el bombo legüero en el loncomeo y la chacarera');
  ok(F.MUSICAS.chamame.instrumento === 'acordeon', 'el chamamé, con acordeón');
  ok(F.eventosMusica('nada') === null && F.musicaDe('leyenda') === null, 'la leyenda no tiene música');
  eq(F.invitadosDe('fiesta-verano', 'tranquilo').length, F.INVITADOS_POR_RITMO.tranquilo, 'el ritmo tranquilo: pocos invitados');
  eq(F.invitadosDe('fiesta-verano', 'animado').length, F.INVITADOS_POR_RITMO.animado, 'animado: muchos');
  ok(F.invitadosDe('fiesta-verano', 'normal').some((x) => x.jinete) && F.invitadosDe('fiesta-verano', 'tranquilo').some((x) => x.jinete), 'con jineteada, el domador viene siempre');
  ok(F.invitadosDe('minga').length === 0 && F.invitadosDe('25-mayo').length === 0, 'la minga y las patrias, sin tren de fiesta');
  const ropa = leer('src/gente.js');
  for (const i of F.INVITADOS) ok(ropa.includes(`'${i.clave}': {`) && i.saludo && i.despedida && i.de, `${i.clave}: su ropa, de dónde viene y lo que dice`);
  for (const [id, r] of Object.entries(F.RECUERDOS)) ok(r.nombre && r.forma && /^#[0-9a-f]{6}$/i.test(r.color), `${id}: recuerdo con nombre, forma y color`);
  ok(F.LEYENDAS.length >= 3 && F.LEYENDAS.every((l) => l.partes.length >= 4 && l.titulo && l.quien), 'tres leyendas del sur');
  ok(F.leyendaDelAnio(1).id !== F.leyendaDelAnio(2).id && F.leyendaDelAnio(1).id === F.leyendaDelAnio(1 + F.LEYENDAS.length).id, 'una por año, y vuelven a empezar');
  // nada religioso en lo que se lee
  const textos = [...F.FECHAS.map((f) => `${f.nombre} ${f.texto}`), ...Object.values(F.DINAMICAS).map((f) => `${f.nombre} ${f.texto}`), ...F.LEYENDAS.flatMap((l) => [l.titulo, ...l.partes]), ...F.INVITADOS.flatMap((i) => [i.saludo, i.despedida, i.oficio]),
    ...Object.values(F.RECUERDOS).flatMap((r) => [r.nombre, r.texto]), ...Object.values(F.MENUS).flatMap((m) => m.platos), ...F.MINGAS.flatMap((m) => [m.nombre, m.texto]), ...Object.values(F.ACTIVIDADES).flatMap((a) => [a.nombre, a.texto])];
  for (const t of textos) ok(!RELIGIOSO.test(t), `nada religioso: «${t.slice(0, 50)}»`);
  ok(!RELIGIOSO.test(leer('src/fiestas-juego.js').replace(/\/\/.*$/gm, '')), 'fiestas-juego.js: nada religioso en lo que dice');
  // sin inglés nuevo en lo que se ve (sí en los nombres internos)
  for (const t of textos) ok(!/\b(the|party|dance|game|winner|click)\b/i.test(t), `en castellano: «${t.slice(0, 40)}»`);
}

// ============================================================ 5. la minga, la nevada, la jineteada, el baile
{
  const st = F.fiestasNuevas();
  const m1 = F.mingaDelAnio(1);
  ok(m1.id === 'lenera' && F.mingaDelAnio(2).id === 'camino' && F.mingaDelAnio(9).id === 'arreglos', 'la minga de cada año (y después, arreglos)');
  let r = F.cargarMinga(st, 7);
  ok(r.cargas === 1 && r.faltan === m1.cargas - 1 && F.ayudasteEnLaMinga(st, 7) && !F.ayudasteEnLaMinga(st, 8), 'una carga en la minga');
  for (let i = 1; i < m1.cargas; i++) r = F.cargarMinga(st, 7);
  ok(r.faltan === 0 && !F.mingaHecha(st, 'lenera'), 'tu parte hecha (la obra queda al terminar la mañana)');
  ok(F.terminarMinga(st, 7)?.id === 'lenera' && F.mingaHecha(st, 'lenera') && F.terminarMinga(st, 7) === null, 'la obra queda una vez por año');
  ok(F.cargarMinga(st, 7).hecha, 'después, ya está hecha');
  ok(F.terminarMinga(st, 19)?.id === 'camino' && F.mingaHecha(st, 'camino'), 'el año 2, el camino (para el equipo del camino: `mingaHecha`)');
  // la nevada solidaria
  for (const c of F.NEVADA.casas) {
    ok(F.ayudarEnLaNevada(st, 1, c.clave, 'pala').ok && !F.ayudarEnLaNevada(st, 1, c.clave, 'pala').ok, `${c.clave}: palear (una vez)`);
    r = F.ayudarEnLaNevada(st, 1, c.clave, 'lena');
  }
  ok(r.ok && r.todas && F.nevadaHecha(st, 1, 'abuela', 'lena'), 'todas las puertas paleadas y con leña');
  ok(!F.ayudarEnLaNevada(st, 1, 'nadie', 'pala').ok && !F.nevadaHecha(st, 2, 'abuela', 'pala'), 'otra casa no; el año que viene, de nuevo');
  // la jineteada: sin hacer nada te caés; adelantándote, aguantás
  let caidos = 0, aguantados = 0;
  for (let s = 1; s <= 30; s++) {
    const j = F.jineteadaNueva(s);
    while (!j.cayo && !j.aguanto) F.pasoJineteada(j, 1 / 60, 0);
    if (j.cayo) caidos++;
    const k = F.jineteadaNueva(s);
    const buf = [];
    while (!k.cayo && !k.aguanto) { buf.push([k.eq, k.vel]); const [eq, v] = buf.length > 12 ? buf[buf.length - 13] : [0, 0]; const x = eq + 0.5 * v; F.pasoJineteada(k, 1 / 60, Math.abs(x) > 0.12 ? Math.sign(x) : 0); }
    if (k.aguanto) aguantados++;
  }
  ok(caidos >= 25, `sin hacer nada, te caés (${caidos} de 30)`);
  ok(aguantados >= 28, `adelantándote a los corcovos, aguantás (${aguantados} de 30, con 0,2 s de reflejos)`);
  ok(F.montaDeJinete('inv-domador', 3) === F.montaDeJinete('inv-domador', 3), 'lo del domador, con semilla');
  ok(F.anotarMonta(st, 8, 5) === true && F.anotarMonta(st, 8, 6) === false && st.jineteada.aguantadas === 2 && !F.puedeMontar(st, 6) && F.puedeMontar(st, 7), 'las montas: la primera vez que aguantás, la cinta; una por fiesta');
  // la clase de baile
  const cl = F.claseNueva('chamame', 0, 9);
  ok(cl.secuencia.length === F.largoClase(0) && cl.secuencia.every((i) => i >= 0 && i < F.BAILES.chamame.pasos.length), 'la clase: Pocha muestra los pasos');
  for (const i of cl.secuencia) F.responderPaso(cl, i);
  ok(cl.fin && cl.aprobada, 'repetida bien: aprobada');
  const mal = F.claseNueva('chacarera', 2, 4);
  for (let i = 0; i < 6 && !mal.fin; i++) F.responderPaso(mal, (mal.secuencia[mal.i] + 1) % F.BAILES.chacarera.pasos.length);
  ok(mal.fin && !mal.aprobada, 'con tres pisotones, no');
  ok(F.aprobarClase(st, 'chamame', 3) === 1 && !F.puedeTomarClase(st, 3) && F.puedeTomarClase(st, 4), 'una clase por día');
  for (let d = 4; d < 10; d++) F.aprobarClase(st, 'chamame', d);
  ok(st.baile.chamame === F.NIVEL_BAILE_MAX, 'hasta el nivel 3');
  // los recuerdos
  ok(F.darRecuerdo(st, 'fiesta-cosecha', 6)?.nombre && F.darRecuerdo(st, 'fiesta-cosecha', 18) === null && F.porColgar(st).includes('fiesta-cosecha'), 'el recuerdo de la cosecha (uno)');
  eq(F.colgarRecuerdos(st), ['fiesta-cosecha'], 'colgarlo en el refugio');
  ok(F.porColgar(st).length === 0 && st.colgados.includes('fiesta-cosecha'), 'colgado');
  // la mesa larga y la foto
  ok(F.comerEnLaMesa(st, 'fiesta-verano', 1)?.platos.length && F.comerEnLaMesa(st, 'fiesta-verano', 1) === null && F.comerEnLaMesa(st, 'fiesta-verano', 2), 'comer en la mesa larga: una vez por fiesta y año');
  ok(F.fotoDeFiesta(st, 'fiesta-nieve', 1) === 'foto-fiesta-nieve-1' && F.fotoDeFiesta(st, 'fiesta-nieve', 1) === null && F.fotosParaAlbum(st).some((x) => x.id === 'foto-fiesta-nieve-1' && /Fiesta de la Nieve/.test(x.nombre)), 'la foto de la fiesta, al álbum');
  // los partidos
  F.anotarPartido(st, 'truco', true); F.anotarPartido(st, 'truco', false); F.anotarPartido(st, 'taba', true);
  eq(st.juegos.truco, { g: 1, p: 1 }, 'los partidos de truco');
  ok(F.anotarPartido(st, 'ajedrez', true) === null, 'un juego que no hay: nada');
}

// ============================================================ 6. el guardado
{
  const b = F.fiestasNuevas();
  eq(F.sanearFiestas(null, 5), b, 'sin nada: de cero');
  eq(F.sanearFiestas('basura', 5), b, 'basura: de cero');
  const s = F.sanearFiestas({ vistas: { 'fiesta-verano': [1, 1, 3, 'x'], inventada: [1] }, recuerdos: [{ id: 'fiesta-cosecha', dia: 400 }, { id: 'fiesta-cosecha', dia: 2 }, { id: 'inventado' }], colgados: ['fiesta-cosecha', 'fiesta-nieve'],
    minga: [{ anio: 1, obra: 'lenera' }, { anio: 1, obra: 'camino' }, { anio: 9, obra: 'lenera' }, { anio: 2, obra: 'pirámide' }], cumple: 40, baile: { chamame: 9, chacarera: -2 }, juegos: { truco: { g: 3.7, p: -1 } }, jineteada: { montas: 2, aguantadas: 5, mejor: 33 }, comio: ['fiesta-nieve|1', 'x'], fotos: ['fiesta-nieve|1', 'basura'], leyendas: ['cuero', 'otra'] }, 20);
  eq(s.vistas, { 'fiesta-verano': [1] }, 'lo visto: sólo fiestas que existen y años que ya pasaron (el día 20 es del año 2)');
  ok(s.recuerdos.length === 1 && s.recuerdos[0].dia === 20 && s.colgados.length === 1, 'los recuerdos: sin repetidos, nada del futuro; colgado sólo lo que tenés');
  eq(s.minga, [{ anio: 1, obra: 'lenera' }], 'la minga: una por año, ninguna del futuro, ninguna inventada');
  ok(s.cumple === F.CUMPLE_JUGADOR && s.baile.chamame === 3 && s.baile.chacarera === 0 && s.juegos.truco.g === 3 && s.juegos.truco.p === 0, 'el cumpleaños, el baile y los partidos, en sus topes');
  ok(s.jineteada.aguantadas === 2 && s.jineteada.mejor === F.JINETEADA.tiempo, 'la jineteada, coherente');
  eq(s.comio, ['fiesta-nieve|1'], 'lo comido'); eq(s.leyendas, ['cuero'], 'las leyendas');
  ok(s.version === F.VERSION_FIESTAS, 'con versión');
  GU.usarModoGuardado('relax', 1);
  eq(GU.progresoNuevo().fiestas, b, 'partida nueva: las fiestas de cero');
  GU.usarModoGuardado('desafio', 1);
  ok(GU.progresoNuevo().fiestas === undefined, 'en el Desafío, ninguna');
  GU.usarModoGuardado('relax', 1);
  const vieja = GU.progresoNuevo(); delete vieja.fiestas; vieja.dia = 14;
  almacen.set('hojarasca-v1', JSON.stringify(vieja));
  eq(GU.cargarProgreso()?.fiestas, b, 'una partida de la 3.7.4 (sin fiestas): de cero');
  vieja.fiestas = { recuerdos: [{ id: 'fiesta-verano', dia: 2 }], colgados: ['fiesta-verano'], minga: [{ anio: 1, obra: 'lenera' }] };
  almacen.set('hojarasca-v1', JSON.stringify(vieja));
  const c = GU.cargarProgreso();
  ok(c.fiestas.colgados[0] === 'fiesta-verano' && F.mingaHecha(c.fiestas, 'lenera'), 'lo guardado vuelve, saneado');
  const g = leer('src/guardado.js');
  ok(g.includes("fiestas: modoPartida === 'desafio' ? undefined : sanearFiestas(p.fiestas, Math.max(1, Math.floor(finito(p.dia, 1)))),") && g.includes('...(desafio ? {} : { fiestas: fiestasNuevas() }),'), 'guardado.js: las fiestas (y en el Desafío, no)');
}

// ============================================================ 7. el predio y quién va a dónde
{
  const P = F.puntosPredio();
  for (const [k, q] of Object.entries(P)) ok(Number.isFinite(q.x) && Number.isFinite(q.z) && Number.isFinite(q.rot) && F.enElPredio(q.x, q.z, F.PREDIO.radio), `${k}: en el predio`);
  // lejos de las calles y de los edificios de la aldea
  for (const [k, q] of Object.entries(P)) {
    for (const c of A.CALLES_ALDEA) for (let i = 0; i < c.puntos.length - 1; i++) {
      const [ax, az] = c.puntos[i], [bx, bz] = c.puntos[i + 1], vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((q.x - ax) * vx + (q.z - az) * vz) / (vx * vx + vz * vz)));
      const d = Math.hypot(ax + vx * t - q.x, az + vz * t - q.z);
      ok(d > (c.ancho || 4) / 2 + 0.3, `${k}: fuera de ${c.id} (${d.toFixed(1)} m)`);
    }
    for (const id of A.IDS_EDIFICIOS) ok(!A.dentroDePlanta(id, q.x, q.z, 1.0), `${k}: fuera de ${id}`);
  }
  const { mesa, pista, fogon, ruedo, tarima, lenera } = F.PREDIO;
  const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  ok(d(fogon, ruedo) > fogon.radio + ruedo.radio + 0.5, 'el fogón no pisa el ruedo');
  ok(Math.abs(pista.z - mesa.z) > pista.ancho / 2 + mesa.banco + 1.5 && tarima.z < pista.z - pista.ancho / 2, 'la mesa, la pista y la tarima, cada una en lo suyo');
  ok(d(lenera, ruedo) > ruedo.radio + 1.5 && mesa.x + mesa.largo / 2 < fogon.x - fogon.radio, 'la leñera y el fogón, libres');
  const claves = A.ORDEN_PERSONAS_ALDEA.slice(0, 24);
  for (const fase of ['llegada', 'acto', 'mesa', 'juegos', 'baile', 'fogon', 'trabajo', 'palear', 'sorpresa']) {
    const r = F.repartoFiesta('fiesta-verano', fase, claves, { musica: 'chamame' });
    const puntos = [...r.values()].filter((x) => x.edificio === 'predio').map((x) => x.punto);
    ok(new Set(puntos).size === puntos.length, `${fase}: nadie en el lugar de otro (${puntos.length})`);
    for (const [k, x] of r) ok(x.lugar === 'fiesta' && x.edificio && x.punto && (x.edificio !== 'predio' || (Object.hasOwn(P, x.punto) && x.plano)), `${fase}: ${k} va a un lugar que existe`);
    ok(![...r.keys()].some((k) => !claves.includes(k)), `${fase}: sólo los que están`);
  }
  const baile = F.repartoFiesta('fiesta-verano', 'baile', claves, { musica: 'chamame' });
  ok(baile.get('musico')?.punto === 'tarima' && baile.get('musico').pose === 'tocar', 'el músico en la tarima');
  ok([...baile.values()].filter((x) => x.pose === 'chamame').length >= 4, 'parejas bailando chamamé en la pista');
  ok(baile.get('herrero')?.punto.startsWith('pista-') && baile.get('modista')?.punto.startsWith('pista-'), 'Anselmo y Pocha, juntos en la pista');
  const chaca = F.repartoFiesta('25-mayo', 'baile', claves, { musica: 'chacarera' });
  ok([...chaca.values()].some((x) => x.pose === 'chacarera' && x.punto.startsWith('suelta-')), 'la chacarera, suelta');
  const fogon2 = F.repartoFiesta('leyenda', 'fogon', claves, { leyenda: F.LEYENDAS.find((l) => l.id === 'cuero') });   // 3.8.0: la de los duendes va primera
  ok(fogon2.get('pescador')?.pose === 'contar' && [...fogon2.values()].filter((x) => x.sentado).length === F.PREDIO.fogon.troncos, 'la leyenda: el que la cuenta, parado; los demás, en los troncos');
  const jue = F.repartoFiesta('fiesta-verano', 'juegos', claves);
  ok(!F.CHICOS.some((k) => jue.get(k)?.punto?.startsWith('ruedo')), 'los chicos no van al ruedo');
  ok([...jue.values()].filter((x) => x.punto.startsWith('ruedo-mira')).length >= 6, 'la jineteada tiene público');
  const nev = F.repartoFiesta('fiesta-nieve', 'palear', claves);
  ok(F.NEVADA.casas.map((c) => c.clave).every((k) => !claves.includes(k) || nev.get(k)?.punto === 'puerta') && [...nev.values()].filter((x) => x.pose === 'palear').length >= 4, 'la nevada: cada uno en su puerta, los demás con la pala');
  ok(F.repartoFiesta('fiesta-verano', null, claves).size === 0 && F.repartoFiesta('nada', 'mesa', claves).size === 0, 'sin fase o sin fiesta: nadie');
}

// ============================================================ 8. fiestas-juego.js, con un contexto de mentira
{
  const P = F.puntosPredio();
  const progreso = { dia: 2, horas: 13, aldea: A.aldeaNueva(), tren: null };
  const personas = new Map(A.ORDEN_VECINOS_ALDEA.map((k, i) => [k, { npc: { pos: { x: 100 + i, z: 100 }, dormido: false, nombre: k } }]));
  const notas = [];
  const js = { pos: { x: 0, y: 0, z: 0 }, sentado: false, vel: { set() {} } };
  const teclas = new Set();
  const amistad = {};
  const mingas = [];
  const mundo = {
    centro: () => ({ x: F.PREDIO.centro.x, z: F.PREDIO.centro.z }),
    punto: (k) => (P[k] ? { x: P[k].x, z: P[k].z, y: 0, mira: P[k].rot } : null),
    aLocal: (x, z) => ({ x, z }),
    tablero: () => ({ x: 500, z: 500, y: 1.8 }),
    sueloJineteada: () => ({ x: P.palenque.x, z: P.palenque.z }),
    camaraJineteada: () => true,
    figura: () => ({}),
    deUna: () => {},
  };
  const J = FJ.crearFiestasJuego({
    progreso: () => progreso, desafio: () => false, jugador: () => ({ estado: js, teclas }), aldeaGente: () => ({ personas }), mundo: () => mundo,
    nota: (t, s) => notas.push(`${t} · ${s || ''}`), guardar: () => {}, sonido: () => null, amigos: () => 0, sumarAmistad: (k, x) => { amistad[k] = (amistad[k] || 0) + x; },
    invierno: (d) => AV.estacionDelAnio(((d - 1) % 12) + 1).id === 'invierno', semilla: () => 77, ritmo: () => 'normal', troncos: () => 10, gastarTroncos: () => {},
    puertaDe: (id) => { const q = A.puntosFijosDe(id).puerta; return q ? { x: q.x, z: q.z } : null; }, enLaPlaza: () => false, alHacerMinga: (o) => mingas.push(o.id),
  });
  ok(AV.FIESTAS_ALDEA.some((f) => f.id === 'fiesta-verano'), 'al crearse, las fiestas quedan en el calendario del cuaderno');
  ok(J.activo() && J.ahora()?.fecha.id === 'fiesta-verano' && J.ahora().fase.fase === 'mesa', 'el día 2 a la una: la mesa larga de la Fruta Fina');
  const dJefe = J.destino('jefe');
  ok(dJefe && dJefe.edificio === 'predio' && dJefe.plano && dJefe.sentado && dJefe.pose === 'comer', `Ernesto va a la mesa larga (${dJefe?.punto})`);
  const pm = J.paraElMundo();
  ok(pm.adornos && pm.menu?.platos.length && pm.asado && pm.fuego && pm.musica === 'chamame' && pm.suave, 'el mundo: adornos, la comida, el asado, el fuego y la música bajita en la mesa');
  ok(pm.invitados.length === F.INVITADOS_POR_RITMO.normal && pm.invitados.every((i) => /^invitado-|^anden$/.test(i.destino)), 'los invitados, en el predio');
  // la mesa larga: sentado en un banco, te sirven
  Object.assign(js.pos, { x: P['mesa-n-3'].x, z: P['mesa-n-3'].z }); js.sentado = true;
  for (let i = 0; i < 30; i++) J.actualizar(0.5);
  ok(notas.some((t) => /^Te sirven cordero al asador/.test(t)) && progreso.fiestas.comio.includes('fiesta-verano|1'), 'sentado a la mesa, te sirven');
  ok(progreso.fiestas.recuerdos.some((r) => r.id === 'fiesta-verano'), 'estuviste: el recuerdo de la fiesta');
  js.sentado = false;
  // los juegos: la jineteada
  progreso.horas = 15;
  Object.assign(js.pos, { x: P.tranquera.x, z: P.tranquera.z });
  J.actualizar(0.6);
  let a = J.accion(js);
  ok(a?.texto === 'Anotarte en la jineteada', `E en la tranquera: «${a?.texto}»`);
  a.hacer();
  ok(J.montando() && J.estadoPanel()?.vista === 'jineteada', 'montás: la cámara arriba y el panel de la jineteada');
  for (let i = 0; i < 1200 && J.jineteada().monta && !J.jineteada().monta.fin; i++) J.actualizar(1 / 60);
  ok(J.jineteada().monta?.fin && progreso.fiestas.jineteada.montas === 1, `sin tocar nada, te caés (${J.jineteada().jugador?.t.toFixed(1)} s)`);
  ok(notas.some((t) => /^Te caíste/.test(t)), 'el aviso de la caída');
  J.cerrarPanel();
  // el truco desde la rueda
  Object.assign(js.pos, { x: 0.5, z: 0.5 });
  ok(J.jugarTruco({ nombre: 'Ernesto', pos: { x: 0, z: 0 } }, 'jefe') && J.estadoPanel()?.vista === 'truco', 'el truco de la rueda abre la mesa');
  for (let i = 0; i < 4000 && J.estadoPanel()?.juego?.terminado === null; i++) {
    const ops = J.estadoPanel().opciones;
    const k = ops.findIndex((o) => o.puede && !/mazo/.test(o.texto));
    if (k >= 0) J.elegirPanel(k); else J.actualizar(1);
  }
  ok(J.estadoPanel()?.juego?.terminado !== null && progreso.fiestas.juegos.truco.g + progreso.fiestas.juegos.truco.p === 1, `el partido termina y queda anotado (${J.estadoPanel()?.juego?.puntos})`);
  J.cerrarPanel();
  // la minga
  progreso.dia = 7; progreso.horas = 10; J.reiniciarDia();
  Object.assign(js.pos, { x: P.lenera.x, z: P.lenera.z - 2 });
  J.actualizar(0.6);
  a = J.accion(js);
  ok(/^Dar una mano en la minga/.test(a?.texto || ''), `la minga: «${a?.texto}»`);
  for (let i = 0; i < 6; i++) a.hacer();
  ok(progreso.fiestas.recuerdos.some((r) => r.id === 'minga'), 'diste una mano: la cuña de la minga');
  progreso.horas = 13.2; J.actualizar(0.6);
  ok(F.mingaHecha(progreso.fiestas, 'lenera') && notas.some((t) => /^La minga terminó/.test(t)) && mingas.join() === 'lenera', 'al mediodía, la leñera queda hecha (y avisa a los otros equipos: alHacerMinga)');
  // la gran nevada (el año 1, el día de la semilla)
  const dn = F.diaNevada(1, 77);
  progreso.dia = dn; progreso.horas = 9; J.reiniciarDia(); J.actualizar(0.6);
  ok(notas.some((t) => /^La gran nevada/.test(t)), 'la gran nevada');
  const q = A.puntosFijosDe('casa-abuela').puerta;
  Object.assign(js.pos, { x: q.x, z: q.z });
  a = J.accion(js);
  ok(/^Palear la nieve de la puerta de/.test(a?.texto || ''), `en lo de la abuela: «${a?.texto}»`);
  a.hacer();
  a = J.accion(js);
  ok(/^Llevarle leña a/.test(a?.texto || ''), 'después, la leña (de la leñera de la minga)');
  a.hacer();
  ok(J.accion(js) === null && (amistad.abuela || 0) >= 2 * F.NEVADA.amistad, 'hecho: la abuela, más amiga');
  ok(J.climaForzado(Math.floor((dn * 24 + 9) / 3)) === 'lluvia' && J.climaForzado(Math.floor((2 * 24 + 9) / 3)) === null, 'ese día nieva (el programa del tiempo)');
  // colgar los recuerdos
  const tab = mundo.tablero();
  Object.assign(js.pos, { x: tab.x, z: tab.z, y: 0.3 });
  a = J.accion(js);
  ok(/^Colgar (el recuerdo|los \d+ recuerdos)/.test(a?.texto || ''), `en el refugio: «${a?.texto}»`);
  a.hacer();
  ok(F.porColgar(progreso.fiestas).length === 0 && J.accion(js) === null, 'colgados');
  // la foto
  progreso.dia = 2; progreso.horas = 19; J.reiniciarDia();
  ok(J.fotoDeLaFiesta({ x: F.PREDIO.pista.x, z: F.PREDIO.pista.z })?.id === 'foto-fiesta-verano-1' && J.fotoDeLaFiesta({ x: F.PREDIO.pista.x, z: F.PREDIO.pista.z }) === null && J.fotosAlbum().length === 1, 'la foto de la fiesta: al álbum (una por fiesta)');
  ok(J.fotoDeLaFiesta({ x: 900, z: 900 }) === null, 'lejos del predio, no');
}

// ============================================================ 9. los enganches
{
  const m = leer('src/main.js');
  const e = m.indexOf("      if (!js.enTren && !js.enKayak && !objetivo && fiestasJuego) { const a = fiestasJuego.accion(js); if (a) { a.hacer(); cacheFiesta = null; break; } }");
  const t = m.indexOf("      if (!js.enTren && !js.enKayak && !objetivo && tallerTren) { const a = tallerTren.accion(js); if (a) { a.hacer(); cacheTaller = null; break; } }");
  ok(e > 0 && t > 0 && e > t, 'la tecla E: lo de la fiesta, después del taller');
  const av = m.indexOf("    if (!aviso && cacheFiesta && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: cacheFiesta.texto };");
  const at = m.indexOf("    if (!aviso && cacheTaller && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: cacheTaller.texto };");
  ok(av > at && at > 0 && av - at < 300, 'el aviso: en el mismo lugar (después del taller)');
  ok(m.includes("      cacheFiesta = fiestasJuego ? fiestasJuego.accion(js) : null;   // 3.7.5"), 'el aviso usa la misma función');
  ok(m.includes("  if (fiestasJuego?.panelAbierto()) return { id: 'fiesta', ...fiestasJuego.lista() };   // 3.7.5") && m.includes('|| !!fiestasJuego?.panelAbierto();'), 'las listas del HUD (teclado, mouse y mando)');
  ok(m.split("if (fiestasJuego?.panelAbierto()) { marcarEn('fiesta', Number(codigo.slice(5)) - 1); fiestasJuego.elegirPanel(Number(codigo.slice(5)) - 1); break; }").length === 3, 'los números del 1 al 9');
  ok(m.includes('else if (fiestasJuego?.panelAbierto()) fiestasJuego.atras();') && m.includes('if (fiestasJuego?.panelAbierto()) { fiestasJuego.alApretarE(); break; }'), 'Escape deja el partido; E no');
  ok(m.includes('amorDestino: (k) => destinoConFiesta(k),') && m.includes("if (a && (a.lugar === 'cita' || a.lugar === 'boda')) return a;") && m.includes('return fiestasJuego?.destino(k) || a || cocinaJuego?.destino(k) || null;'), 'quién va a dónde: la cita y el casamiento, después la fiesta, después lo demás');
  ok(m.includes('if (fiestasJuego?.montando()) fiestasJuego.camara(camara);') && m.includes("fallaSistema('fiestas', e)"), 'el cuadro (aislado) y la cámara de la jineteada');
  ok(m.includes("p.tipo = (k) => (!desafio && fiestasJuego?.climaForzado(k)) || tipo(k);"), 'el tiempo de la gran nevada');
  ok(m.includes('const ff = fiestasJuego?.fotoDeLaFiesta(jugador.estado.pos);') && m.includes('datosAlbum({ progreso, desafios: fiestasJuego.fotosAlbum() })'), 'la foto de la fiesta y el álbum');
  ok(m.includes('trucoReal: () => !!fiestasJuego?.activo(),') && m.includes("if (o.tipo === 'cartas' && o.real && fiestasJuego?.activo())"), 'el truco de la rueda, de verdad');
  ok(m.includes('if (fiestasMundo) lista.push(...fiestasMundo.pisos());'), 'el predio, sin pasto alto');
  ok(m.includes("__fiestas: () => fiestasJuego, __fiestasMundo: () => fiestasMundo,"), 'para las pruebas');
  const vs = leer('src/vecindad-social.js');
  ok(vs.includes("if (id === 'cartas' && ctx?.trucoReal) o.real = true;"), 'vecindad-social.js: con el truco de verdad no se sortea');
  const S = await import('../src/vecindad-social.js');
  const pr = { vecindad: { personas: { jefe: { p: 80 } } }, dia: 3 };
  let r1 = null, r2 = null;
  for (let s = 1; s < 60 && !(r1 && r2); s++) {
    const x = S.probarInteraccion('jefe', 'cartas', JSON.parse(JSON.stringify(pr)), { dia: 3, hora: 20, semilla: s, trucoReal: true });
    if (x.exito) r1 = x;
    const y = S.probarInteraccion('jefe', 'cartas', JSON.parse(JSON.stringify(pr)), { dia: 3, hora: 20, semilla: s });
    if (y.exito) r2 = y;
  }
  ok(r1 && r1.efectos.otros.some((o) => o.tipo === 'cartas' && o.real && o.gano === undefined), 'el truco aceptado, para jugarlo');
  ok(r2 && r2.efectos.otros.some((o) => o.tipo === 'cartas' && typeof o.gano === 'boolean'), 'sin el juego (las pruebas viejas), se sortea como antes');
  const pl = leer('src/plantilla.html');
  ok(pl.includes('<div class="trueque oculto" id="fiesta-panel">') && pl.includes('<ul id="fiesta-lista"></ul>'), 'plantilla.html: el panel');
  const ge = leer('src/gente.js');
  for (const p of ['aplaudir', 'chamame', 'chacarera', 'contar', 'jinete', 'tirar']) ok(ge.includes(`case '${p}':`), `gente.js: la pose «${p}»`);
  ok(ge.includes("case 'sentado': case 'leyendo': case 'tornear': case 'coser': case 'comer': {"), 'comer, sentado a la mesa');
}

console.log(`✓ 3.7.5 (fiestas): ${n} comprobaciones`);
