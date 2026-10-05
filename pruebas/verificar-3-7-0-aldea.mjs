// 3.7.0 «La aldea crece»: el núcleo (aldea.js, aldea-vida.js, vecindad*.js, guardado.js), sin Electron.
//  · el plano de la calle de la Loma, medido contra el terreno real (como verificar-3-6-aldea);
//  · la llegada de los veinte, intercalados (y las partidas viejas, desde donde están);
//  · el calendario, los cumpleaños, los visitantes del tren, los chicos que crecen, la mascota, el apodo,
//    la familia, el ritmo de la aldea y las cartas;
//  · los servicios de las nueve nuevas, sus voces y sus charlas;
//  · Josefina (la que era Ema) en todos lados;
//  · los saneadores (con basura), la migración de una partida de la 3.6 y nada religioso.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as A from '../src/aldea.js';
import * as V from '../src/aldea-vida.js';
import * as VE from '../src/vecindad.js';
import * as VZ from '../src/vecindad-voces.js';
import * as G from '../src/aldea-gente.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { generarTerreno } from '../src/terreno.js';
import { LIMITE } from '../src/config.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const E = A.EDIFICIOS_ALDEA;
const NUEVAS = ['veterinaria', 'fotografa', 'andinista', 'herbolaria', 'pintora', 'ceramista', 'botera', 'astronoma', 'modista'];
const LOTES37 = { veterinaria: 'veterinaria', fotografa: 'estudio-fotos', andinista: 'refugio-andinista', herbolaria: 'herboristeria', pintora: 'taller-arte', ceramista: 'ceramica', botera: 'varadero', astronoma: 'observatorio', modista: 'costureria' };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad|ángel|amén|pecado/i;

// ============================================================ 0. los módulos
{
  for (const [f, M] of [['src/aldea.js', A], ['src/aldea-vida.js', V]]) {
    for (const k of Object.keys(M)) ok(!/ñ/.test(k), `${f}: export sin eñe: ${k}`);
    const t = leer(f);
    ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `${f}: import en una línea: ${m[0]}`);
    ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !t.includes('\r'), `${f}: lo que entiende armar.mjs, con LF`);
  }
  const mundo = leer('src/aldea-animales-mundo.js');
  for (const m of mundo.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE from 'three'|\{ [\w, ]+ \} from '\.\/[\w-]+\.js');$/.test(m[0]), `aldea-animales-mundo: ${m[0]}`);
  ok(leer('package.json').includes('node pruebas/verificar-3-7-0-aldea.mjs'), 'la prueba está en el gate');
  ok(/const DIAS_ANIO = 12;/.test(leer('src/main.js')) && A.DIAS_ANIO === 12, 'el año del calendario es el de las estaciones de main.js');
  for (const f of ['src/aldea.js', 'src/aldea-vida.js', 'src/aldea-gente.js', 'src/aldea-animales-mundo.js']) ok(/3\.7\.0/.test(leer(f)), `${f}: comentarios con 3.7.0`);
}

// ============================================================ 1. el plano: la calle de la Loma, medida con el terreno
const T = generarTerreno();
const marco = A.marcoAldea();
const segRiel = T.riel.filter((q) => Math.hypot(q.x - A.PARADA_ALDEA.x, q.z - A.PARADA_ALDEA.z) < 500);
function distRiel(x, z) {
  let d = Infinity;
  for (let i = 0; i < segRiel.length - 1; i++) {
    const a = segRiel[i], b = segRiel[i + 1];
    const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / l2));
    d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t));
  }
  return d;
}
{
  // el contrato con aldea-arquitectura.js (los tamaños que comparte el equipo de arquitectura)
  const CONTRATO = { veterinaria: [8, 6], 'estudio-fotos': [6, 6], 'refugio-andinista': [7, 6], herboristeria: [6, 6], 'taller-arte': [7, 6], ceramica: [7, 6], varadero: [8, 6], observatorio: [6, 6], costureria: [6, 5] };
  for (const [id, [w, d]] of Object.entries(CONTRATO)) {
    ok(A.esEdificioAldea(id) && E[id].ancho === w && E[id].fondo === d && E[id].rol === 'local' && E[id].calle === 'calle-loma', `${id}: ${w} × ${d}, sobre la calle de la Loma`);
  }
  for (const [k, l] of Object.entries(LOTES37)) ok(A.LOTE_DE[k] === l && A.pobladorDeLote(l) === k && A.esLote(l), `${k}: su lote es ${l}`);
  ok(E.veterinaria.anexo?.id === 'corral' && E.veterinaria.anexo.ancho === 6 && E.veterinaria.anexo.fondo === 6, 'la veterinaria, con su corral de 6 × 6');
  ok(E.ceramica.anexo?.id === 'horno' && E.observatorio.cupula === true, 'la cerámica con su horno afuera y el observatorio con cúpula');
  const calle = A.CALLES_ALDEA.find((c) => c.id === 'calle-loma');
  ok(calle && calle.nombre === 'Calle de la Loma' && calle.ancho === 5 && calle.puntos[0][0] === -44 && calle.puntos[0][1] === 52, 'la calle de la Loma sigue a la calle Norte');
  // la calle: sin agua, dentro del valle, lejos de la vía, y sube
  let alturas = [];
  for (let s = 0; s <= 1.0001; s += 0.02) {
    const lx = calle.puntos[0][0] + (calle.puntos[1][0] - calle.puntos[0][0]) * s, lz = calle.puntos[0][1] + (calle.puntos[1][1] - calle.puntos[0][1]) * s;
    const w = marco.aMundo(lx, lz);
    assert.ok(!T.agua(w.x, w.z) && Math.abs(w.x) < LIMITE && Math.abs(w.z) < LIMITE && distRiel(w.x, w.z) > calle.ancho / 2 + 2, `la calle en (${lx}, ${lz})`);
    alturas.push(T.altura(w.x, w.z));
  }
  n++;
  ok(Math.max(...alturas) - alturas[0] > 4, `la calle sube hacia la loma (de ${alturas[0].toFixed(1)} a ${Math.max(...alturas).toFixed(1)} m)`);
  // cada planta: desnivel ≤ 1,5 m, sin agua, dentro del valle, a 22 m o más de la vía, con vereda, el piso a la media
  const ids = A.IDS_EDIFICIOS;
  const medidas = {};
  for (const id of Object.keys(CONTRATO)) {
    const e = E[id];
    let min = Infinity, max = -Infinity, s = 0, k = 0, riel = Infinity, cal = Infinity, agua = false, fuera = false;
    for (const q of A.muestrasPlanta(id, 0.25)) {
      const w = marco.aMundo(q.lx, q.lz), h = T.altura(w.x, w.z);
      min = Math.min(min, h); max = Math.max(max, h); s += h; k++;
      riel = Math.min(riel, distRiel(w.x, w.z));
      if (T.agua(w.x, w.z)) agua = true;
      if (Math.abs(w.x) > LIMITE - 4 || Math.abs(w.z) > LIMITE - 4) fuera = true;
      for (const c of A.CALLES_ALDEA) cal = Math.min(cal, A.distanciaACalle(q.lx, q.lz, c));
    }
    medidas[id] = { des: max - min, y: s / k };
    ok(!agua && !fuera, `${id}: fuera del agua y dentro del valle`);
    ok(riel >= 22, `${id}: a ${riel.toFixed(1)} m de la vía (≥ 22)`);
    ok(max - min <= 1.5, `${id}: desnivel de ${(max - min).toFixed(2)} m (≤ 1,5)`);
    ok(Math.abs(A.muestrasPlanta(id).reduce((t, q) => { const w = marco.aMundo(q.lx, q.lz); return t + T.altura(w.x, w.z); }, 0) / A.muestrasPlanta(id).length - e.y) < 0.05, `${id}: el piso a la media del terreno (${e.y})`);
    ok(cal >= 1, `${id}: con vereda (${cal.toFixed(1)} m)`);
    const f = { x: e.x + (e.fondo / 2) * Math.sin(e.rot), z: e.z + (e.fondo / 2) * Math.cos(e.rot) };
    const df = A.distanciaACalle(f.x, f.z, calle);
    ok(df >= 1 && df <= 5, `${id}: la puerta mira a la calle de la Loma (${df.toFixed(1)} m)`);
    ok(Math.abs(Math.sin(e.rot * 2)) < 1e-9, `${id}: giro de a 90°`);
  }
  console.log(`  la calle de la Loma: ${Object.entries(medidas).map(([id, m]) => `${id} ${m.des.toFixed(2)} m`).join(', ')}`);
  // 3 m o más entre todos los edificios (los de siempre y los nuevos), y los anexos, sin pisar nada
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = A.plantaDe(ids[i]), b = A.plantaDe(ids[j]);
    const d = Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));
    assert.ok(d >= 3 - 1e-9, `${ids[i]} y ${ids[j]} a ${d.toFixed(1)} m`);
  }
  n++;
  for (const id of ['veterinaria', 'ceramica']) {
    const e = E[id], x = e.anexo, c = Math.cos(e.rot), s = Math.sin(e.rot);
    const cx = e.x + x.x * c + x.z * s, cz = e.z - x.x * s + x.z * c;
    const b = { x0: cx - x.ancho / 2, x1: cx + x.ancho / 2, z0: cz - x.fondo / 2, z1: cz + x.fondo / 2 };
    for (const o of ids) { const p = A.plantaDe(o); const d = Math.hypot(Math.max(0, p.x0 - b.x1, b.x0 - p.x1), Math.max(0, p.z0 - b.z1, b.z0 - p.z1)); assert.ok(d >= 0.3, `${id}: el ${x.id} no pisa ${o}`); }
    let cm = Infinity, agua = false;
    for (let px = b.x0; px <= b.x1; px += 0.5) for (let pz = b.z0; pz <= b.z1; pz += 0.5) { for (const cc of A.CALLES_ALDEA) cm = Math.min(cm, A.distanciaACalle(px, pz, cc)); const w = marco.aMundo(px, pz); if (T.agua(w.x, w.z)) agua = true; }
    ok(cm >= 1 && !agua, `${id}: el ${x.id} fuera de las calles y del agua`);
    const pt = A.puntosDe(id)[x.id];
    ok(pt && !A.dentroDePlanta(id, pt.x, pt.z, -0.2), `${id}: el punto del ${x.id}, afuera`);
  }
  // el observatorio, arriba de todo, con vista
  const lotes = Object.keys(CONTRATO);
  ok(lotes.every((id) => E.observatorio.y >= E[id].y), `el observatorio es el más alto (${E.observatorio.y} m)`);
  ok(A.IDS_EDIFICIOS.every((id) => E.observatorio.y >= E[id].y), 'más alto que toda la aldea');
  ok(E.observatorio.y - E.plaza.y > 6, `unos ${(E.observatorio.y - E.plaza.y).toFixed(1)} m sobre la plaza`);
  // los puntos de cada uno, con el formato de los locales de la 3.6
  for (const id of lotes) {
    const pts = A.puntosDe(id);
    for (const k of ['puerta', 'adentro', 'cliente', 'trabajo', 'cama', 'obra-1', 'obra-2', 'obra-3', 'obra-4']) ok(!!pts[k], `${id}: tiene ${k}`);
    for (const k of ['adentro', 'cliente', 'cama']) ok(A.dentroDePlanta(id, pts[k].x, pts[k].z, 0.3), `${id}.${k} adentro`);
    if (pts['lugar-1']) ok(A.dentroDePlanta(id, pts['lugar-1'].x, pts['lugar-1'].z, 0.3), `${id}: la silla adentro`);
  }
  for (const id of ['estudio-fotos', 'taller-arte', 'costureria']) ok(!!A.puntosDe(id)['lugar-1'], `${id}: la silla del retrato, del modelo o de la clienta`);
  // el lugar de Martina, junto al muelle del lago
  const mu = T.lugares.muelle, pm = A.puntosMundo('varadero')['trabajo-muelle'];
  const rotM = Math.atan2(Math.cos(mu.ang), Math.sin(mu.ang));
  const esp = { x: mu.x + 2.8 * Math.cos(rotM) - 1 * Math.sin(rotM), z: mu.z - 2.8 * Math.sin(rotM) - 1 * Math.cos(rotM) };
  ok(Math.hypot(pm.x - esp.x, pm.z - esp.z) < 0.1, `varadero.trabajo-muelle: al lado del muelle del lago (a ${Math.hypot(pm.x - mu.x, pm.z - mu.z).toFixed(1)} m)`);
  ok(!T.agua(pm.x, pm.z) && A.esPuntoLejano('trabajo-muelle') && !A.esPuntoLejano('trabajo'), 'en la orilla, y lejos de la aldea');
  ok(G.distanciaAldea(pm.x, pm.z) > 400, 'el muelle queda a más de 400 m de la aldea');
  for (const id of lotes) { const w = A.edificioEnMundo(id); ok(G.distanciaAldea(w.x, w.z) < 1, `${id}: dentro de la aldea (para el mundo y la gente)`); }
  // el mapa del valle y las zonas para el mundo los incluyen
  const mapa = A.planoAldeaMapa();
  ok(lotes.every((id) => mapa.edificios.some((e) => e.id === id && e.tipo === 'lote')) && mapa.calles.some((c) => c.id === 'calle-loma'), 'en el mapa: los lotes y la calle');
  ok(lotes.every((id) => A.zonasAldea().some((z) => z.id === id && z.emparejar)), 'el mundo empareja cada lote');
  // la gente camina por la calle nueva
  const r = G.recorridoAldea(A.puntosDe('plaza')['estar-1'], A.puntosDe('observatorio').adentro);
  ok(r.length > 2 && G.largoRecorrido(A.puntosDe('plaza')['estar-1'], A.puntosDe('observatorio').adentro) < 260, 'de la plaza al observatorio, por las calles');
}

// ============================================================ 2. la llegada de los veinte
const IDS = ENTRADAS.map((e) => e.id);
const partida = (anotadas = 0, extra = {}) => ({ modo: 'relax', dia: 1, horas: 10, entradas: Object.fromEntries(IDS.slice(0, anotadas).map((id) => [id, { dia: 1, hora: 9, cantidad: 0 }])), materiales: {}, cosas: {}, aldea: A.aldeaNueva(), personal: {}, ...extra });
{
  eq(A.ORDEN_POBLADORES_ALDEA.length, 20, 'veinte pobladores');
  eq([...A.POBLADORES_36, ...A.POBLADORAS_37].sort(), [...A.ORDEN_POBLADORES_ALDEA].sort(), 'los once de la 3.6 y las nueve de la 3.7');
  eq(A.POBLADORAS_37.sort(), [...NUEVAS].sort());
  // intercalados: nunca dos de la 3.7 seguidas
  const o = A.ORDEN_POBLADORES_ALDEA;
  for (let i = 1; i < o.length; i++) ok(!(A.esPobladora37(o[i]) && A.esPobladora37(o[i - 1])), `${o[i - 1]} y ${o[i]}: no son dos nuevas seguidas`);
  ok(o[0] === 'carpintero' && o.indexOf('modista') === o.indexOf('herrero') + 1 && o.indexOf('fotografa') > o.indexOf('telegrafista'), 'el carpintero primero, Pocha justo después de Anselmo y la fotógrafa después de Benigno');
  // los datos de cada una
  const edades = { veterinaria: 29, fotografa: 31, andinista: 33, herbolaria: 35, pintora: 27, ceramista: 30, botera: 28, astronoma: 32, modista: 58 };
  const nombres = { veterinaria: 'Ayelén Catriel', fotografa: 'Sofía Haddad', andinista: 'Rocío Lagos', herbolaria: 'Inés Ancalao', pintora: 'Abril Moretti', ceramista: 'Malena Jones', botera: 'Martina Roldán', astronoma: 'Valentina Ruiz Díaz', modista: 'Pocha Benítez' };
  for (const k of NUEVAS) {
    const p = A.POBLADORES_ALDEA[k];
    ok(p.nombre === nombres[k] && p.edad === edades[k], `${k}: ${p.nombre}, ${p.edad}`);
    ok(p.oficio && p.saludo && p.despedida && p.resumen && p.llegada.length === 2 && p.colores.ropa && p.colores.abrigo && typeof p.objeto === 'string' && p.objeto.length > 10, `${k}: completa, con su objeto para la llegada`);
    ok(!p.colores.barba, `${k}: sin barba`);
    ok(leer('src/gente.js').includes(`'poblador-${k}': {`), `${k}: su ropa en gente.js`);
  }
  ok(/prima de Mario/.test(A.POBLADORES_ALDEA.ceramista.llegada.join(' ')) && A.POBLADORES_ALDEA.ceramista.nombre.endsWith('Jones'), 'Malena es prima de Mario');
  ok(A.POBLADORES_ALDEA.modista.pareja === 'herrero' && A.POBLADORES_ALDEA.modista.romance === false && A.sinRomance('modista') && A.sinRomance('herrero'), 'Pocha y Anselmo, la pareja fija (nunca candidatos)');
  ok(!A.sinRomance('veterinaria') && !A.sinRomance('astronoma'), 'las otras ocho, sí (lo usa la 3.7.1)');
  // el ritmo: el vigésimo pide menos de la mitad del cuaderno
  const ultimo = A.LLEGADA.anotaciones + A.LLEGADA.porPoblador * 19;
  ok(ultimo <= ENTRADAS.length * 0.5, `la vigésima pide ${ultimo} anotaciones de ${ENTRADAS.length}`);
  // la partida entera: cada día una anotación más, se aporta todo
  const p = partida(A.LLEGADA.anotaciones);
  let anot = A.LLEGADA.anotaciones;
  const llegaron = [];
  for (let d = 1; d <= 300 && Object.keys(p.aldea.locales).length < 20; d++) {
    p.dia = d; anot = Math.min(IDS.length, anot + 1);
    p.entradas = Object.fromEntries(IDS.slice(0, anot).map((id) => [id, { dia: 1 }]));
    A.avanzarObras(p.aldea, d, 8);
    const q = A.puedeLlegar(p);
    if (q.ok) { A.empezarLlegada(p.aldea, q.quien, d); A.aceptar(p.aldea, d); llegaron.push(q.quien); }
    const lote = A.obraEnCurso(p.aldea);
    if (lote) A.aportar(p.aldea, lote, { tronco: 99, tabla: 99, piedra: 99 }, d, 10);
  }
  eq(llegaron, A.ORDEN_POBLADORES_ALDEA, 'llegan los veinte, en el orden intercalado');
  console.log(`  los veinte, en ${p.dia} días (los once de la 3.6 tardaban unos 66)`);
  ok(p.dia <= 110, `los veinte en un tiempo razonable (${p.dia} días)`);
  // las partidas viejas intercalan desde donde están
  const vieja = A.sanearAldea({ pobladores: A.POBLADORES_36.map((clave, i) => ({ clave, dia: i + 1 })), locales: Object.fromEntries(A.POBLADORES_36.map((k) => [A.LOTE_DE[k], 20])) }, 30);
  ok(A.quienLlega(vieja) === 'veterinaria', 'una partida de la 3.6 con los once: sigue la veterinaria');
  const seguidas = [];
  for (let i = 0; i < 9; i++) { const k = A.quienLlega(vieja); seguidas.push(k); A.empezarLlegada(vieja, k, 31 + i); A.aceptar(vieja, 31 + i); }
  eq(seguidas, A.ORDEN_POBLADORES_ALDEA.filter(A.esPobladora37), 'y después, las nueve, en su orden');
  const media = A.sanearAldea({ pobladores: ['carpintero', 'panadera', 'herrero', 'pescador'].map((clave) => ({ clave, dia: 1 })), locales: { carpinteria: 2, panaderia: 3, herreria: 4, pescaderia: 5 } }, 10);
  const orden = [];
  for (let i = 0; i < 16; i++) { const k = A.quienLlega(media); orden.push(k); A.empezarLlegada(media, k, 11 + i); A.aceptar(media, 11 + i); }
  for (let i = 1; i < 10; i++) ok(A.esPobladora37(orden[i]) !== A.esPobladora37(orden[i - 1]), `a mitad de camino, alternan (${orden[i - 1]}, ${orden[i]})`);
  ok(A.quienLlega(media) === null && orden.length === 16 && new Set(orden).size === 16, 'y llegan todos los que faltaban');
}

// ============================================================ 3. el calendario
{
  eq(V.ESTACIONES_ANIO.map((e) => [e.id, e.desde, e.hasta]), [['verano', 1, 4], ['otono', 5, 8], ['invierno', 9, 12]], 'doce días: cuatro de cada estación');
  const f = V.fechaDe(15);
  ok(f.anio === 2 && f.diaDelAnio === 3 && f.estacion === 'verano' && f.texto === '3.º día del verano, año 2', `la fecha (${f.texto})`);
  ok(V.fechaDe(1).anio === 1 && V.fechaDe(12).estacion === 'invierno' && V.fechaDe(13).diaDelAnio === 1 && V.fechaDe('x').dia === 1, 'el año da la vuelta');
  // cada uno, su cumpleaños; repartidos
  const todos = [...A.ORDEN_PERSONAS_ALDEA, ...V.VALLE_CALENDARIO];
  for (const k of todos) ok(A.cumpleDe(k) >= 1 && A.cumpleDe(k) <= 12, `${k}: cumple el ${A.cumpleDe(k)}`);
  eq(Object.keys(A.CUMPLES_ALDEA).sort(), [...todos].sort(), 'todos y nadie más');
  const porDia = Array.from({ length: 12 }, (_, i) => todos.filter((k) => A.cumpleDe(k) === i + 1).length);
  ok(Math.max(...porDia) <= 3, `repartidos (como mucho tres el mismo día: ${porDia.join(' ')})`);
  ok(A.cumpleDe('ema') === 8 && A.cumpleDe('__proto__') === null && A.cumpleDe('nadie') === null, 'también los del valle');
  // lo de un día y el aviso del día antes
  const a = A.aldeaNueva();
  const ev4 = V.eventosDelDia(4, { aldea: a });
  ok(ev4.some((e) => e.clave === 'nene') && ev4.some((e) => e.clave === 'guarda') && !ev4.some((e) => e.clave === 'veterinaria'), 'el día 4: Nahuel y Elsa (la veterinaria todavía no llegó)');
  a.pobladores.push({ clave: 'veterinaria', dia: 1 }); a.locales.veterinaria = 2;
  ok(V.eventosDelDia(16, { aldea: a }).some((e) => e.clave === 'veterinaria'), 'cuando llega, también cuenta su cumpleaños (y se repite cada año)');
  const av = V.avisoDiaAntes(3, { aldea: a });
  ok(av && /^Mañana cumplen años Nahuel, Ayelén y Elsa$/.test(av.titulo), `el aviso del día antes: ${av?.titulo}`);
  ok(/plaza/.test(av.texto), 'dos o más de la aldea festejan juntos en la plaza');
  ok(V.avisoDiaAntes(1, { aldea: A.aldeaNueva() }) === null || V.avisoDiaAntes(1, { aldea: A.aldeaNueva() }).titulo.startsWith('Mañana'), 'un día sin nada no avisa');
  // las fiestas (las suma la 3.7.3): el calendario ya las sabe mostrar
  eq(V.FIESTAS_ALDEA, [], 'sin fiestas todavía (son de la 3.7.3)');
  const fiestas = [{ id: 'dia-de-la-aldea', nombre: 'Día de la Aldea', diaDelAnio: 6, texto: 'Fiesta en la plaza' }, { id: 'mal', nombre: 'x', diaDelAnio: 40 }, { id: 'Mal Id', nombre: 'y', diaDelAnio: 2 }, null, { id: 'segundo', nombre: 'Desde el segundo año', diaDelAnio: 7, desdeAnio: 2 }];
  ok(V.eventosDelDia(6, { aldea: a, fiestas }).some((e) => e.tipo === 'fiesta' && e.id === 'dia-de-la-aldea'), 'una fiesta, en su día');
  ok(!V.eventosDelDia(7, { aldea: a, fiestas }).some((e) => e.tipo === 'fiesta') && V.eventosDelDia(19, { aldea: a, fiestas }).some((e) => e.id === 'segundo'), 'y desde el año que diga');
  ok(V.sanearFiesta(fiestas[1]) === null && V.sanearFiesta(fiestas[2]) === null && V.sanearFiesta(null) === null, 'las fiestas mal formadas no entran');
  ok(V.avisoDiaAntes(5, { aldea: a, fiestas }).titulo.includes('día de la Aldea'), 'y se avisan el día antes');
  const cal = V.calendarioDelAnio(15, { aldea: a, fiestas });
  ok(cal.anio === 2 && cal.filas.length === 12 && cal.filas.filter((x) => x.hoy).length === 1 && cal.filas[2].hoy && cal.filas[3].manana, 'el año en el cuaderno: doce filas, hoy y mañana');
  ok(cal.filas[5].eventos.some((e) => e.tipo === 'fiesta'), 'con las fiestas');
  ok(V.listaCumples(a).length === 8 + 1 + 1 + 4 && V.listaCumples(a).every((x, i, l) => !i || l[i - 1].diaDelAnio <= x.diaDelAnio), 'la lista de cumpleaños, ordenada');
}

// ============================================================ 4. los cumpleaños
{
  const llena = A.aldeaNueva();
  llena.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
  llena.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  // el día 10: la abuela y la enfermera (dos): en la plaza
  let f = A.fiestaDeCumple(10, llena);
  eq(f, { claves: ['abuela', 'enfermera'], donde: 'plaza', edificio: 'plaza' }, 'dos que cumplen el mismo día, juntos en la plaza');
  eq(A.rutinaAldea('abuela', 19, 1, llena, 10), { lugar: 'fiesta', edificio: 'plaza', punto: 'mastil' }, 'a la tardecita, en el medio de la plaza');
  ok(A.rutinaAldea('abuela', 19, 1, llena).lugar !== 'fiesta' && A.rutinaAldea('abuela', 16, 1, llena, 10).lugar !== 'fiesta', 'sin el día, o a otra hora, no');
  // uno solo: en su casa (o su local)
  const sola = A.aldeaNueva(); sola.pobladores = [{ clave: 'apicultor', dia: 1 }]; sola.locales = { 'sala-miel': 1 };
  f = A.fiestaDeCumple(13, sola);   // el día 1 del año: el jefe y el apicultor
  ok(f.donde === 'plaza', 'el jefe y Guido, juntos');
  f = A.fiestaDeCumple(13, A.aldeaNueva());
  eq(f, { claves: ['jefe'], donde: 'casa', edificio: 'casa-jefe' }, 'el jefe solo, en su casa');
  eq(A.rutinaAldea('jefe', 19.4, 2, A.aldeaNueva(), 13), { lugar: 'fiesta', edificio: 'casa-jefe', punto: 'adentro' }, 'después de arriar la bandera');
  // el de un chico: la familia en casa
  f = A.fiestaDeCumple(4, A.aldeaNueva());
  ok(f.claves.includes('nene') && f.edificio === 'casa-familia', 'Nahuel festeja en la casa de los Jones');
  for (const k of ['padre', 'madre', 'nena']) eq(A.rutinaAldea(k, 19, 3, A.aldeaNueva(), 4).edificio, 'casa-familia', `${k}: en el cumpleaños de Nahuel`);
  // la fiesta manda (no es tiempo libre)
  const p = { dia: 10, horas: 19, aldea: llena };
  ok(!VE.estaLibre('abuela', 19, 1, p) && VE.elegirActividad('abuela', 19, 1, 'sol', p).nombre === 'fiesta', 'la fiesta no es tiempo libre');
  // un regalo el día del cumpleaños vale el doble (si le gusta)
  const inv = () => 99;
  const q = { dia: 4, horas: 10, aldea: A.aldeaNueva() };
  const r = VE.regalar('nene', VE.PERFILES_VECINOS.nene.gustos.encanta[0], q, 4, inv);
  ok(r.ok && r.cumple && r.amistad.cambio === VE.AMISTAD.encanta * 2 && r.renglones[1] === VZ.FRASES.cumpleRegalo, 'el regalo de cumpleaños vale el doble y lo dice');
  const r2 = VE.regalar('nene', VE.PERFILES_VECINOS.nene.gustos.noGusta, q, 16, inv);
  ok(r2.cumple === false && r2.amistad.cambio === 0, 'lo que no le gusta, ni en su cumpleaños');
  ok(VZ.FRASES.cumpleSaludo.includes(VE.abrirCharla('nene', { dia: 16, horas: 10, aldea: A.aldeaNueva() }, { dia: 16 }).saludo), 'ese día te lo dice al saludarte');
  // los amigos lo van a saludar: el que cumple está en su casa, y su amigo lo visita (en su tiempo libre)
  // (a las 19:24: de 18:30 a 19:15 el jefe arría la bandera)
  const fiesta = { dia: 13, horas: 19.4, aldea: A.aldeaNueva() };
  let visitas = 0;
  for (let s = 0; s < 40; s++) { const e = VE.elegirActividad('abuela', 19.4, 0, 'sol', fiesta, s); if (e.con === 'jefe') visitas++; }
  ok(visitas >= 10, `la abuela va a saludar al jefe en su cumpleaños (${visitas} de 40)`);
}

// ============================================================ 5. los visitantes del tren
{
  ok(V.VISITANTES.length >= 6 && V.VISITANTES.every((v) => v.nombre && v.de && v.saludo && v.despedida && v.colores?.ropa), 'mochileros y turistas, completos');
  ok(Object.values(V.LUGARES_VISITA).every((l) => l.nombre && l.pide), 'los lugares por los que preguntan');
  for (const v of V.VISITANTES) ok(leer('src/gente.js').includes(`'visitante-${v.id}': {`), `${v.id}: su ropa`);
  // cuántos según el ritmo, y como mucho uno por día
  const cuenta = {};
  for (const ritmo of V.ORDEN_RITMOS) {
    const vida = V.vidaNueva(1);
    let c = 0;
    for (let d = 1; d <= 240; d++) {
      const v = V.visitanteDelDia(vida, d, { ritmo });
      ok(V.visitanteDelDia(vida, d, { ritmo }) === null || !v, 'uno por día');
      if (v) { c++; ok(Object.hasOwn(V.LUGARES_VISITA, v.lugar) && V.esVisitante(v.id) && v.estado === 'anden', 'baja al andén'); V.visitanteSeVa(vida); }
    }
    cuenta[ritmo] = c;
  }
  ok(cuenta.tranquilo < cuenta.normal && cuenta.normal < cuenta.animado && cuenta.tranquilo > 10, `más o menos visitantes según el ritmo (${JSON.stringify(cuenta)})`);
  // los lugares que hay en este valle
  const vida = V.vidaNueva(1);
  let v = null;
  for (let d = 1; d < 60 && !v; d++) v = V.visitanteDelDia(vida, d, { ritmo: 'animado', lugares: ['mirador', 'no-existe'] });
  ok(v && v.lugar === 'mirador', 'pregunta por un lugar que existe');
  ok(V.visitanteDelDia(V.vidaNueva(1), 3, { lugares: [] }) === null, 'sin lugares, no baja nadie');
  // la guía
  const tx = V.textosVisitante(v);
  ok(tx.pide.length === 2 && tx.pide[1].includes('el Mirador del Pehuén') && tx.seguir.startsWith('E:') && tx.gracias.length === 2, 'te pide que lo lleves');
  ok(V.guiado(vida, v.dia) === null, 'sin aceptar, no hay guía');
  ok(V.empezarGuia(vida) && vida.visitante.estado === 'guiando' && !V.empezarGuia(vida), 'te sigue');
  const g = V.guiado(vida, v.dia);
  ok(g && vida.guiados.length === 1 && vida.visitante.estado === 'llego' && /Mirador del Pehuén/.test(V.lineaGuiado(g)), 'llegaron: queda anotado');
  V.visitanteSeVa(vida);
  ok(vida.visitante === null && vida.guiados.length === 1, 'se va, y lo anotado queda');
  ok(V.RADIO_GUIADO >= 10 && V.RADIO_GUIADO <= 20, 'a unos metros del lugar ya llegaron');
}

// ============================================================ 6. los chicos crecen
{
  eq(A.ETAPAS_CHICOS, ['bebe', 'chico', 'adolescente', 'joven']);
  ok(A.crecimientos('nene', 1, 15) === 0 && A.crecimientos('nene', 1, 16) === 1 && A.crecimientos('nene', 1, 28) === 2, 'Nahuel (cumple el 4): adolescente el día 16, joven el 28');
  ok(A.crecimientos('nena', 1, 19) === 0 && A.crecimientos('nena', 1, 20) === 1, 'Lucía (cumple el 8): adolescente el día 20');
  ok(A.crecimientos('nene', 50, 61) === 0 && A.crecimientos('nene', 50, 64) === 1, 'una etapa por año desde que se empieza a contar');
  // de chico a joven, día por día, con locales abiertos: la veterinaria le encanta a Lucía
  const a = A.aldeaNueva();
  a.pobladores = [{ clave: 'veterinaria', dia: 1 }];
  a.locales = { veterinaria: 3 };
  const tallas = { nene: [], nena: [] };
  const eventos = [];
  for (let d = 1; d <= 40; d++) {
    for (const ev of A.pasarDiaChicos(a, d)) eventos.push(`${d}:${ev.clave}:${ev.tipo}:${ev.etapa || ev.con || ev.carrera || ''}`);
    eq(A.pasarDiaChicos(a, d), [], 'dos veces el mismo día no cambia nada');
    for (const k of ['nene', 'nena']) tallas[k].push(A.tallaDe(k, a));
  }
  ok(eventos.includes('16:nene:crecio:adolescente') && eventos.includes('28:nene:crecio:joven') && eventos.includes('20:nena:crecio:adolescente') && eventos.includes('32:nena:crecio:joven'), `crecen en su cumpleaños (${eventos.join(' ')})`);
  ok(eventos.includes('32:nena:aprendiz:veterinaria'), 'Lucía aprende el oficio con Ayelén, con quien más tiempo pasó');
  ok(eventos.includes('28:nene:estudiar:maquinista') && eventos.includes('32:nene:volvio:maquinista'), 'Nahuel no tuvo con quién: se fue a estudiar y volvió maquinista');
  for (const k of ['nene', 'nena']) ok(tallas[k].every((x, i, l) => !i || x >= l[i - 1]) && tallas[k][0] < 0.7 && tallas[k][39] > 0.9, `${k}: la talla crece (${tallas[k][0]} → ${tallas[k][39]})`);
  ok(A.coloresDe('nene', a).barba && !A.coloresDe('nena', a).barba, 'la ropa de cada etapa');
  eq(A.dichosDe('nene', a).oficio, 'maquinista de la trochita');
  eq(A.dichosDe('nena', a).oficio, 'aprendiz de veterinaria');
  ok(A.dichosDe('nena', a).charla[0].startsWith('Aprendo el oficio con Ayelén'), 'y lo cuenta');
  // mientras estudia, no está; de joven trabaja con lo suyo
  const b = A.sanearAldea({ chicos: { nene: { desde: 1, etapa: 3, estudia: 50 } } }, 47);
  ok(b.chicos.nene.afuera && A.rutinaAldea('nene', 11, 1, b).lugar === null && A.chicoAfuera(b, 'nene'), 'el que se fue a estudiar no está');
  eq(A.rutinaAldea('nene', 10, 1, a), { lugar: 'trabajo', edificio: 'estacion-aldea', punto: 'anden' }, 'Nahuel, maquinista, en el andén');
  eq(A.rutinaAldea('nena', 10, 1, a), { lugar: 'trabajo', edificio: 'veterinaria', punto: 'trabajo' }, 'Lucía, con Ayelén');
  ok(A.rutinaAldea('nena', 2, 1, a).punto === 'cama-chicos', 'y duerme en casa');
  // nunca en el romance
  ok(A.sinRomance('nene') && A.sinRomance('nena'), 'los chicos nunca entran en el romance');
}

// ============================================================ 7. la mascota
{
  const vida = V.vidaNueva(1);
  const a = A.aldeaNueva();
  ok(!V.cachorrosNacen(vida, a, 40), 'sin conocer la aldea, no');
  a.descubierta = 5;
  ok(!V.cachorrosNacen(vida, a, 9) && !V.cachorrosNacen(vida, a, 29) && V.cachorrosNacen(vida, a, 30), 'sin veterinaria, al mes');
  a.pobladores.push({ clave: 'veterinaria', dia: 10 });
  ok(!V.cachorrosNacen(vida, a, 11) && V.cachorrosNacen(vida, a, 12), 'con Ayelén, a los dos días de que llega');
  ok(V.ofertaCachorro(vida, 12) === null, 'antes de nacer, nadie te ofrece nada');
  ok(V.nacenCachorros(vida, 12) && !V.nacenCachorros(vida, 12) && vida.mascota.estado === 'cachorros', 'nacen una vez');
  const of = V.ofertaCachorro(vida, 12);
  ok(of && of.partes.length === 2 && /Chola/.test(of.partes[0]) && of.seguir.startsWith('E:'), 'Ernesto te ofrece uno');
  V.ofrecido(vida, 12);
  ok(V.ofertaCachorro(vida, 12) === null && V.ofertaCachorro(vida, 13), 'una vez por día');
  const m = V.adoptarMascota(vida, 13);
  ok(m && m.estado === 'adoptado' && m.nombre && V.adoptarMascota(vida, 14) === null && V.ofertaCachorro(vida, 14) === null, 'lo adoptás (una sola vez)');
  eq([13, 24, 25, 36, 37, 90].map((d) => V.etapaMascota(m, d)), ['cachorro', 'cachorro', 'joven', 'joven', 'adulto', 'adulto'], 'crece: cachorro, joven, adulto');
  ok(V.tallaMascota(m, 13) === 0.45 && V.tallaMascota(m, 25) > 0.7 && V.tallaMascota(m, 60) === 1, 'y la talla, de a poco');
  ok(V.perrosPresentes(A.aldeaNueva()).map((p) => p.id).join() === 'chola,tango', 'los perros de la aldea: la Chola y el Tango, y los otros cuando llegan sus dueños');
  ok(V.ANIMALES_ALDEA.caballos.length === 2 && V.ANIMALES_ALDEA.gallinas.length === 3, 'dos caballos atados en la plaza y gallinas en tres patios');
  for (const c of V.ANIMALES_ALDEA.caballos) ok(A.dentroDePlanta('plaza', c.x, c.z - 2.5, 0) || c.z > E.plaza.z, `${c.id}: junto a la plaza`);
  ok(V.SEGUIR_PERRO.segundos > 10 && V.SEGUIR_PERRO.radio > 2, 'los perros te siguen un rato');
}

// ============================================================ 8. el apodo
{
  ok(V.apodoDe({}) === null && V.apodoDe(null) === null, 'sin hacer nada, sin apodo');
  eq(V.apodoDe({ peces: { trucha: { cantidad: 12 } } }), { id: 'pescador', texto: 'el pescador del valle' });
  eq(V.apodoDe({ renovales: new Array(8).fill({}) }).texto, 'el que planta árboles');
  eq(V.apodoDe({ fotos: 15 }).texto, 'el fotógrafo');
  ok(V.apodoDe({ peces: { trucha: { cantidad: 12 } }, fotos: 45 }).id === 'fotografo', 'el que más (en proporción)');
  ok(V.APODOS.every((a) => /^el /.test(a.texto)), 'en masculino (el personaje del jugador es hombre)');
  ok(V.fraseApodo({ texto: 'el fotógrafo' }).includes('el fotógrafo'), 'los vecinos te lo dicen');
  // con confianza, te saludan por tu apodo (vecindad-juego.js lo pasa como tu nombre)
  const amigo = { dia: 3, aldea: A.aldeaNueva(), vecindad: { personas: { jefe: { p: 60, max: 1 } }, hechos: [], visita: {}, dia: 0 } };
  eq(VE.saludoDeAmistad('jefe', amigo, { nombre: 'el pescador del valle' }), '¡El pescador del valle! Justo estaba por tocar la campana. Para vos la toco igual.', 'el jefe te saluda por tu apodo');
  ok(leer('src/vecindad-juego.js').includes('nombre: ctx.apodo?.() || null') && leer('src/main.js').includes('apodo: () => apodoPorId(progreso.vidaAldea?.apodo)?.texto || null'), 'en el juego, el apodo que te ganaste');
}

// ============================================================ 9. tu familia
{
  const vida = V.vidaNueva(1);
  ok(vida.familia.proxima === 9 && V.familiaDeHoy(vida, 8) === null && V.familiaDeHoy(vida, 9) === 'mama', 'la primera visita, de tu mamá, a los ocho días');
  ok(V.avisoFamilia(vida, 7) === null && V.avisoFamilia(vida, 8)?.titulo === 'Mañana viene tu mamá' && V.avisoFamilia(vida, 8) === null, 'el aviso del día antes, una vez');
  const p = { obras: [], aldea: A.aldeaNueva(), peces: {} };
  const op = V.opinionesFamilia('mama', p, vida, { perro: 'Chispa', clima: 'lluvia' });
  ok(op.length === 4 && op.every((t) => typeof t === 'string' && t.length > 10) && /casa|carpa|frío/.test(op[0]) && op.some((t) => /Chispa/.test(t)) && op.some((t) => /bufanda/.test(t)), 'tu mamá opina de todo');
  const p2 = { obras: new Array(30).fill({}), aldea: { ...A.aldeaNueva(), descubierta: 3, pobladores: A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })) }, fotos: 20 };
  const op2 = V.opinionesFamilia('hermano', p2, vida, {});
  ok(op2[0] !== op[0] && op2.some((t) => /el fotógrafo/.test(t)) && op2.some((t) => /intendente/.test(t)), 'tu hermano también, según lo que hiciste');
  ok(V.terminarVisitaFamilia(vida, 9, 'normal') && vida.familia.quien === 'hermano' && vida.familia.proxima === 29 && V.familiaDeHoy(vida, 9) === null, 'se turnan; la próxima, según el ritmo');
  V.terminarVisitaFamilia(vida, 29, 'animado');
  ok(vida.familia.proxima === 41 && vida.familia.quien === 'mama' && vida.familia.cuenta === 2, 'con la aldea animada, más seguido');
  ok(leer('src/gente.js').includes("'familia-mama': {") && leer('src/gente.js').includes("'familia-hermano': {"), 'su ropa');
}

// ============================================================ 10. el ritmo de la aldea y las cartas
{
  eq(V.ORDEN_RITMOS, ['tranquilo', 'normal', 'animado']);
  const r = V.RITMOS;
  ok(r.tranquilo.visitante < r.normal.visitante && r.normal.visitante < r.animado.visitante && r.tranquilo.familia > r.animado.familia && r.tranquilo.carta > r.animado.carta && r.tranquilo.esperaCharla > r.animado.esperaCharla, 'cuántos eventos, chismes y visitas');
  ok(V.sanearRitmo('x') === 'normal' && V.sanearRitmo('animado') === 'animado' && V.ritmoDe(null) === r.normal, 'el ajuste, saneado');
  const t = leer('src/plantilla.html');
  ok(/data-ajuste="ritmoAldea"><button data-valor="tranquilo">Tranquilo<\/button><button data-valor="normal">Normal<\/button><button data-valor="animado">Animado<\/button>/.test(t), 'en Ajustes');
  ok(leer('src/aldea-gente.js').includes('ritmoDe(ctx.ritmo?.()).esperaCharla'), 'los chismes de la vereda, según el ritmo');
  // las cartas: si pasás días sin ir
  const vida = V.vidaNueva(1);
  const p = { dia: 10, aldea: { ...A.aldeaNueva(), descubierta: 2, llegando: { clave: 'pintora', dia: 9 } }, vecindad: { personas: { madre: { p: 80 } } } };
  ok(V.cartaDeLaAldea(vida, { ...p, aldea: A.aldeaNueva() }, 10) === null, 'sin conocer la aldea, nadie te escribe');
  V.fuisteALaAldea(vida, 8);
  ok(V.cartaDeLaAldea(vida, p, 10) === null, 'fuiste hace poco: no');
  const c = V.cartaDeLaAldea(vida, p, 12);
  ok(c && c.de === 'madre' && c.texto.some((x) => /Abril Moretti/.test(x)) && c.texto.length >= 3 && vida.cartas.length === 1, 'te escribe un amigo con las novedades');
  ok(V.cartaDeLaAldea(vida, p, 13) === null && V.cartaDeLaAldea(vida, p, 16), 'no todos los días');
  const sinAmigos = V.vidaNueva(1);
  ok(V.cartaDeLaAldea(sinAmigos, { ...p, vecindad: {} }, 20).de === 'nelida', 'si no tenés amigos, te escribe Nélida');
}

// ============================================================ 11. los servicios de las nueve
{
  const llena = () => {
    const p = partida(40, { dia: 10, horas: 22, fotos: 5, materiales: { tabla: 5, piedra: 9, tronco: 3 }, cosas: { yerba: 4, caballo: 1, tijera: 1 }, gallineros: { '1:2': { desde: 1, juntados: 0 } }, correo: { llegadas: {}, ultimoDia: -1, fotos: {} } });
    p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
    p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
    return p;
  };
  const extra = { hora: 22, lugares: new Set(['mirador', 'cascada', 'cueva']), fotoPendiente: { nombre: 'Un pudú', pista: 'Agachate y acercate despacio.' }, chisme: { persona: 'jefe', quien: 'Ernesto', k: 'yerba', cosa: 'la yerba', gusto: 'encanta' } };
  const p = llena();
  for (const k of NUEVAS) {
    const s = A.servicioDe(k, p, 10, extra);
    ok(s.partes.length && s.partes.every((x) => typeof x === 'string' && x.length > 5 && !/\{|\}|undefined|null/.test(x)), `${k}: dice algo`);
    ok(!s.efectos || s.efectos.every((f) => ['material', 'cosa', 'entrada', 'aldea', 'jugador', 'registrar', 'chinche', 'amistad', 'gusto'].includes(f.tipo)), `${k}: con lo que ya existe en el valle`);
  }
  const usar = (k, d, x = extra, q = p) => { const s = A.servicioDe(k, q, d, x); const al = s.efectos ? A.aplicarEfectos(q, s.efectos, d) : []; return { s, al }; };
  // la veterinaria: el zaino, las gallinas o la majada, uno por día
  let u = usar('veterinaria', 10);
  ok(u.s.efectos && (p.aldea.herrado === 10 || p.entradas.huevo?.cantidad === 2 || p.materiales.lana === 1), 'Ayelén ayuda con tus animales');
  ok(!A.servicioDe('veterinaria', p, 10, extra).efectos, 'una vez por día');
  const hechos = new Set();
  for (let d = 11; d < 14; d++) { u = usar('veterinaria', d); hechos.add(u.s.titulo); }
  ok(hechos.size >= 2, `y va variando (${[...hechos].join(' / ')})`);
  ok(/no tenés animales/i.test(A.servicioDe('veterinaria', { ...llena(), cosas: {}, gallineros: {} }, 10, extra).partes[0]), 'sin animales, te lo dice');
  // la fotógrafa: el lente y después la foto que falta
  u = usar('fotografa', 10);
  ok(p.cosas.lente === 1 && /lente/.test(u.s.partes[0]), 'Sofía te mejora la cámara');
  u = usar('fotografa', 11);
  ok(/Un pudú/.test(u.s.partes[0]) && /agachate/.test(u.s.partes[1]), 'y te dice qué foto falta y cómo');
  ok(leer('src/fotos.js').includes('(c.lente ? 1.5 : 1)') && leer('src/main.js').includes('lente: !!progreso.cosas?.lente'), 'el lente se nota en las fotos');
  ok(/Benigno/.test(A.POBLADORES_ALDEA.fotografa.resumen) && A.servicioDe('telegrafista', p, 10).partes.length, 'Benigno sigue despachando las fotos');
  // la guía: un lugar que no conocés, con chinche en el mapa
  u = usar('andinista', 10);
  ok(u.al.some((f) => f.tipo === 'chinche' && extra.lugares.has(f.k)) && /mapa/.test(u.s.partes[1]), 'Rocío te marca en el mapa un lugar que no conocés');
  // la herbolaria: frutos por yerba, y pistas de flora
  const y0 = p.cosas.yerba;
  u = usar('herbolaria', 10);
  ok(p.cosas.yerba === y0 - 1 && (p.entradas.frutilla?.cantidad >= 3 || p.entradas.calafate?.cantidad >= 3), 'Inés te cambia frutos del monte por yerba');
  const sinYerba = { ...llena(), cosas: {} };
  const pista = A.servicioDe('herbolaria', sinYerba, 10, extra).partes.join(' ');
  ok(/anotaste/.test(pista) && /Julia/.test(pista), 'sin yerba, una pista de flora (los bichos, Julia)');
  // la pintora: un dibujo de tu parte
  u = usar('pintora', 10);
  ok(u.al.some((f) => f.tipo === 'amistad' && A.esPersonaAldea(f.k) && f.n === A.SERVICIO.amistadDibujo) && p.materiales.tabla === 4, 'Abril le pinta un dibujo de tu parte al que menos confianza te tiene');
  // la ceramista: macetas hasta cuatro
  usar('ceramista', 10); usar('ceramista', 11); usar('ceramista', 12);
  ok(p.cosas['macetas-barro'] === 4 && !A.servicioDe('ceramista', p, 13, extra).efectos, 'Malena: macetas para el vivero, hasta cuatro');
  ok(leer('src/vivero.js').includes('export const macetasDe = (extra = 0) =>') && leer('src/main.js').includes("progreso.cosas?.['macetas-barro']"), 'y el vivero las usa');
  // la del varadero: el kayak calafateado
  usar('botera', 10);
  ok(p.aldea.calafateado === 10 && /calafateado/.test(A.servicioDe('botera', p, 10, extra).partes[0]), 'Martina te calafatea el kayak');
  ok(leer('src/main.js').includes("progreso.aldea?.calafateado === progreso.dia ? 1.15 : 1") && leer('src/main.js').includes('if (progreso.aldea?.herrado === progreso.dia)'), 'el kayak y el zaino lo notan');
  // la astrónoma: de noche, el telescopio
  const dia = A.servicioDe('astronoma', p, 10, { ...extra, hora: 12 });
  ok(!dia.efectos && /noche/.test(dia.partes[0]), 'de día, no');
  u = usar('astronoma', 10);
  ok(u.s.efectos?.some((f) => f.tipo === 'registrar') && Object.hasOwn(p.entradas, u.s.efectos.find((f) => f.tipo === 'registrar').k), 'de noche, Valentina te muestra algo del cielo y queda anotado');
  // la modista: un chisme
  u = usar('modista', 10);
  ok(/A Ernesto le encanta la yerba/.test(u.s.partes[1]) && u.al.some((f) => f.tipo === 'gusto' && f.k === 'jefe' && f.cosa === 'yerba'), 'Pocha te cuenta qué le gusta a un vecino');
  const ch = VE.proximoChisme({ dia: 10, aldea: A.aldeaNueva(), vecindad: VE.vecindadNueva() }, 10);
  ok(ch && VE.gustoDe(ch.persona, ch.k) === ch.gusto && VE.revelarGusto({ vecindad: VE.vecindadNueva() }, ch.persona, ch.k), 'el chisme sale de los gustos de verdad');
  // nada de economía nueva
  const t = JSON.stringify(NUEVAS.map((k) => A.POBLADORES_ALDEA[k]));
  ok(!/\b(plata|pesos|precio\w*|cobr\w+|vend\w+|pag\w+)\b/i.test(t), 'sin plata, ni precios, ni ventas');
}

// ============================================================ 12. las voces y las charlas
{
  for (const k of NUEVAS) {
    ok(VE.esPersonaVecindad(k) && VE.PERFILES_VECINOS[k].gustos.encanta.length === 3 && VE.PERFILES_VECINOS[k].amigos.length >= 2, `${k}: su perfil`);
    const v = VZ.VOCES[k];
    for (const c of VE.PERFILES_VECINOS[k].gustos.encanta) ok(typeof v.encanta[c] === 'string' && v.encanta[c].length > 20, `${k}: qué dice si le regalás ${c}`);
    ok(v.historia.partes.length === 3 && v.sobremesa.length === 3 && v.visita.length === 2 && ['bien', 'cansado', 'inquieto', 'charla'].every((x) => v.animo[x]), `${k}: con su voz`);
    ok(VZ.AYUDAS[k]?.length >= 1, `${k}: una mano que se le puede dar`);
    ok(A.CHARLAS_ALDEA.some((c) => c.lineas.some(([q]) => q === k)), `${k}: charla con los vecinos`);
  }
  ok(VZ.CHISMOSOS.includes('modista'), 'Pocha es chismosa');
  ok(A.CHARLAS_ALDEA.some((c) => c.id === 'pocha-anselmo' && c.lineas.some(([q]) => q === 'herrero')), 'Pocha y Anselmo charlan');
  ok(A.CHARLAS_ALDEA.some((c) => c.lineas.some(([q]) => q === 'ceramista') && c.lineas.some(([q]) => q === 'padre')), 'Malena y Mario, primos');
  // nadie repite: charlas posibles con todas
  const llena = A.aldeaNueva();
  llena.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
  const posibles = A.charlasPosibles({ aldea: llena, hora: 10, estacion: 'verano', clima: 'sol' });
  ok(posibles.filter((c) => c.lineas.some(([q]) => NUEVAS.includes(q))).length >= 15, 'muchas charlas nuevas');
}

// ============================================================ 13. Josefina en todos lados
{
  const archivos = fs.readdirSync(new URL('../src/', import.meta.url)).filter((f) => f.endsWith('.js') || f.endsWith('.html'));
  // (salvo el comentario que cuenta el cambio de nombre)
  for (const f of archivos) assert.ok(!/\bEma\b/.test(leer('src/' + f).replace(/Ema pasó a llamarse Josefina/g, '')), `${f}: ya no dice «Ema»`);
  n++;
  ok(VE.nombreCorto('ema') === 'Josefina' && V.nombreDe('ema') === 'Josefina' && A.NOMBRES_RADIO.ema === 'Josefina', 'el id interno sigue siendo `ema`');
  ok(leer('src/gente.js').includes("ema: { nombre: 'Josefina', oficio: 'guardaparque'"), 'en el valle');
  ok(/Josefina/.test(leer('src/historia.js')) && /Josefina/.test(leer('src/encargos.js')) && /Josefina/.test(leer('src/cuaderno.js')) && /Josefina/.test(leer('src/correo.js')) && /Josefina/.test(leer('src/eventos-valle.js')), 'en la historia, los encargos, el cuaderno, el correo y los eventos');
  ok(/Josefina/.test(leer('src/idioma-en-b.js')) && /told by Josefina/.test(leer('src/idioma-en-b.js')), 'y en inglés');
  // compañeras: se nombran y charlan por la radio
  ok(/Josefina/.test(A.POBLADORES_ALDEA.guardaparque.llegada.join(' ')) && VZ.VOCES.guardaparque.sobremesa.some((t) => /Josefina/.test(t)) && VZ.VOCES.ema.sobremesa.some((t) => /Julia/.test(t)), 'Julia y Josefina se nombran');
  const radio = A.CHARLAS_ALDEA.filter((c) => c.radio?.includes('ema'));
  ok(radio.length >= 2 && radio.every((c) => c.lineas.some(([q]) => q === 'ema') && c.lineas.some(([q]) => q === 'guardaparque')), 'y charlan por la radio de la seccional');
  const conJulia = A.aldeaNueva(); conJulia.pobladores = [{ clave: 'guardaparque', dia: 1 }];
  ok(A.charlasPosibles({ aldea: conJulia, hora: 10, presentes: ['guardaparque'] }).some((c) => c.radio), 'con Julia sola en la seccional alcanza');
  eq(A.quienesCharlan(radio[0]), ['guardaparque'], 'Josefina no tiene que estar ahí');
}

// ============================================================ 14. los saneadores (con basura) y la migración
{
  // la aldea: los chicos
  const basura = [null, undefined, 3, 'x', [], [1, 2], true, { nene: 'x' }, { nene: { etapa: 99, desde: -5, junto: { pescador: 1e12, x: 3, __proto__: { y: 1 } }, oficio: 'nadie', estudia: 'x', carrera: 'astronauta' } }, Object.create(null)];
  for (const [i, b] of basura.entries()) {
    const s = A.sanearAldea({ chicos: b }, 30);
    ok(A.CHICOS_ALDEA.every((k) => s.chicos[k].etapa >= 1 && s.chicos[k].etapa <= 3 && s.chicos[k].desde >= 1 && s.chicos[k].desde <= 30 && Number.isInteger(s.chicos[k].estudia)), `chicos basura ${i}`);
    eq(A.sanearAldea(JSON.parse(JSON.stringify(s)), 30), s, `chicos basura ${i}: estable`);
  }
  const s = A.sanearAldea({ chicos: { nene: { etapa: 3, oficio: 'nadie' } } }, 30);
  ok(s.chicos.nene.estudia === 34 && s.chicos.nene.afuera, 'un joven sin oficio ni estudio, de un guardado roto, se va a estudiar');
  ok(A.sanearAldea({ calafateado: 99, herrado: 'x' }, 10).calafateado === 10 && A.sanearAldea({ herrado: 'x' }, 10).herrado === 0, 'el kayak y el zaino, hasta hoy');
  // la vida: fuzz
  let r = 7;
  const azar = () => { r = (r * 1103515245 + 12345) >>> 0; return r / 4294967296; };
  const cosa = (d = 0) => {
    const x = azar();
    if (d > 2 || x < 0.15) return [null, undefined, 3.7, -2, 'x', true, NaN, 1e9][Math.floor(azar() * 8)];
    if (x < 0.3) return Array.from({ length: Math.floor(azar() * 4) }, () => cosa(d + 1));
    const o = {};
    for (const k of ['avisado', 'visitante', 'visitantesDia', 'guiados', 'mascota', 'apodo', 'familia', 'ultimaVisita', 'cartas', 'ultimaCarta', 'estado', 'nombre', 'desde', 'id', 'lugar', 'dia', 'de', 'texto', 'quien', 'proxima', '__proto__', 'constructor']) if (azar() < 0.4) o[k] = cosa(d + 1);
    if (azar() < 0.3) o.id = V.VISITANTES[Math.floor(azar() * V.VISITANTES.length)].id;
    if (azar() < 0.3) o.lugar = 'mirador';
    if (azar() < 0.3) o.de = 'nelida';
    if (azar() < 0.3) o.texto = ['hola', 3, null];
    if (azar() < 0.3) o.estado = ['nada', 'cachorros', 'adoptado', 'anden', 'guiando'][Math.floor(azar() * 5)];
    return o;
  };
  for (let i = 0; i < 600; i++) {
    const hoy = 1 + Math.floor(azar() * 200);
    const v = V.sanearVidaAldea(cosa(), hoy);
    assert.deepEqual(Object.keys(v).sort(), Object.keys(V.vidaNueva(1)).sort());
    assert.deepEqual(V.sanearVidaAldea(v, hoy), v, 'sanear dos veces da lo mismo');
    assert.deepEqual(V.sanearVidaAldea(JSON.parse(JSON.stringify(v)), hoy), v, 'lo guardado vuelve igual');
    assert.ok(v.avisado <= hoy && v.ultimaVisita <= hoy && v.ultimaCarta <= hoy && v.familia.ultima <= hoy && v.guiados.length <= V.TOPE_GUIADOS && v.cartas.length <= V.TOPE_CARTAS, 'nada del futuro, listas cortas');
    assert.ok(['nada', 'cachorros', 'adoptado'].includes(v.mascota.estado) && (v.mascota.estado !== 'adoptado' || typeof v.mascota.nombre === 'string'));
    assert.ok(!JSON.stringify(v).includes('__proto__') && !JSON.stringify(v).includes('constructor'));
    assert.ok(v.visitante === null || (V.esVisitante(v.visitante.id) && v.visitante.dia === hoy), 'el visitante de otro día ya se fue');
  }
  n += 600;
  eq(V.sanearVidaAldea(null, 5), V.vidaNueva(5), 'nada, vida nueva desde hoy');
  // la migración de una partida de la 3.6 (por guardado.js)
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const Gd = await import('../src/guardado.js?v370=' + Date.now());
  const nueva = Gd.progresoNuevo();
  eq(nueva.vidaAldea, V.vidaNueva(1), 'una partida nueva arranca con la vida de la aldea');
  eq(nueva.aldea.chicos, A.chicosNuevos(1), 'y los chicos, desde el día 1');
  const vieja36 = Gd.progresoNuevo();
  delete vieja36.vidaAldea; delete vieja36.aldea.chicos; delete vieja36.aldea.calafateado; delete vieja36.aldea.herrado;
  vieja36.dia = 80;
  vieja36.aldea.pobladores = A.POBLADORES_36.map((clave) => ({ clave, dia: 5 }));
  vieja36.aldea.locales = Object.fromEntries(A.POBLADORES_36.map((k) => [A.LOTE_DE[k], 6]));
  datos.set('hojarasca-v1', JSON.stringify(vieja36));
  const c = Gd.cargarProgreso();
  ok(c && c.vidaAldea && c.vidaAldea.ultimaVisita === 80 && c.vidaAldea.familia.proxima === 88 && c.vidaAldea.mascota.estado === 'nada', 'una partida de la 3.6: la vida arranca hoy (sin cartas atrasadas)');
  ok(A.CHICOS_ALDEA.every((k) => c.aldea.chicos[k].desde === 80 && c.aldea.chicos[k].etapa === 1), 'los chicos empiezan a crecer desde hoy (no de golpe)');
  ok(A.quienLlega(c.aldea) === 'veterinaria' && A.puedeLlegar({ ...c, entradas: Object.fromEntries(IDS.slice(0, 120).map((id) => [id, { dia: 1 }])) }).quien === 'veterinaria', 'y siguen llegando las nuevas, intercaladas');
  ok(Gd.guardarProgreso(c) && JSON.stringify(Gd.cargarProgreso().vidaAldea) === JSON.stringify(c.vidaAldea), 'guarda y vuelve igual');
  ok(Gd.cargarAjustes().ritmoAldea === 'normal', 'el ritmo de la aldea, normal de fábrica');
  ok(Gd.guardarAjustes({ ...Gd.cargarAjustes(), ritmoAldea: 'animado' }) && Gd.cargarAjustes().ritmoAldea === 'animado' && (Gd.guardarAjustes({ ritmoAldea: 'x' }) && Gd.cargarAjustes().ritmoAldea === 'normal'), 'y se guarda (saneado)');
  // en el Desafío, nada de esto
  Gd.establecerModo?.('desafio');
  const g = leer('src/guardado.js');
  ok(g.includes("aldea: undefined, vidaAldea: undefined"), 'en el Desafío no hay vida de la aldea');
}

// ============================================================ 15. en el juego (aldea-gente.js con un mundo de mentira)
{
  const M = A.marcoAldea();
  const p = partida(60, { dia: 4, horas: 10, gallineros: {}, vidaAldea: V.vidaNueva(1), vecindad: VE.vecindadNueva() });
  p.aldea.descubierta = 1;
  p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
  p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const figuras = [], notas = [], dichos = [], chinches = [];
  const jugador = { estado: { pos: vec(0, 0, 0), yaw: 0 } };
  const tren = { est: { parado: 0, proxima: null } };
  const ctx = {
    progreso: () => p, gente: () => ({ gente: [], agregarPoblador: (def) => { const f = { ...def, pos: vec(def.pos.x, 0, def.pos.z), g: { rotation: { y: 0 }, scale: { y: def.talla || 1, setScalar(s) { this.y = s; } } } }; figuras.push(f); return f; } }),
    tren: () => tren, jugador: () => jugador, alturaDePie: () => 0, nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, registrar: (id) => { p.entradas[id] = p.entradas[id] || { dia: p.dia }; },
    sumarMaterial: (k, x) => { p.materiales[k] = (p.materiales[k] || 0) + x; }, sumarEntrada: (k, x) => { p.entradas[k] = p.entradas[k] || { dia: p.dia, cantidad: 0 }; p.entradas[k].cantidad += x; },
    hablandoCon: () => null, decir: (t) => dichos.push(t), ambiente: () => ({ clima: 'sol', estacion: 'verano' }), pronostico: () => '',
    ritmo: () => 'animado', lugaresVisita: () => ['mirador'], lugarPos: () => ({ x: 300, z: 300 }), lugarFamilia: () => ({ x: 200, z: 200, mira: 0 }),
    lugaresConMapa: () => new Set(['mirador']), chinche: (k) => chinches.push(k), fotoPendiente: () => null, nombrePerro: () => 'Chispa',
  };
  const ag = G.crearAldeaGente(ctx);
  const ir = (lx, lz) => { const w = M.aMundo(lx, lz); jugador.estado.pos.x = w.x; jugador.estado.pos.z = w.z; };
  const tick = (k = 1) => { for (let i = 0; i < k; i++) ag.actualizar(0.6); };
  ir(6, 40); tick(4);
  ok(notas.some((x) => /^Mañana cumplen? años/.test(x)), `el aviso del día antes (${notas.find((x) => x.startsWith('Mañana'))})`);
  ok(ag.dibujarCalendario && ag.vida().avisado === 4, 'una vez por día');
  // Martina: en el muelle de 8 a 17 (se la ve si estás cerca de ella, no de la aldea)
  for (let i = 0; i < 40; i++) tick(1);
  const st = ag.estado();
  const martina = st.npcs.find((x) => x.clave === 'botera');
  const muelle = A.puntosMundo('varadero')['trabajo-muelle'];
  ok(martina && martina.destino.punto === 'trabajo-muelle', 'Martina, a las 10, en el muelle del lago');
  for (let i = 0; i < 200 && !ag.estado().npcs.find((x) => x.clave === 'botera').enLejano; i++) {
    const f = figuras.find((x) => x.clave === 'poblador-botera');
    if (f?.camino?.length) { const q = f.camino[0]; f.pos.x = q.x; f.pos.z = q.z; f.camino.shift(); }
    tick(1);
  }
  const m2 = ag.estado().npcs.find((x) => x.clave === 'botera');
  ok(m2.enLejano && Math.hypot(m2.x - muelle.x, m2.z - muelle.z) < 1.5, 'camina hasta el andén y aparece en el muelle');
  ok(m2.dormido, 'con vos en la aldea, allá no se dibuja');
  jugador.estado.pos.x = muelle.x + 10; jugador.estado.pos.z = muelle.z;
  tick(2);
  ok(!ag.estado().npcs.find((x) => x.clave === 'botera').dormido, 'con vos en el muelle, sí');
  // a las 17 vuelve: aparece en el andén
  ir(6, 40); p.horas = 17.6; tick(3);
  const m3 = ag.estado().npcs.find((x) => x.clave === 'botera');
  ok(!m3.enLejano && G.distanciaAldea(m3.x, m3.z) < 5, 'a la tardecita vuelve a la aldea');
  // un visitante baja del tren (con el ritmo animado y varios días)
  p.horas = 10;
  let bajo = null;
  for (let d = 5; d < 40 && !bajo; d++) {
    p.dia = d; tren.est = { parado: 5, proxima: { indice: A.PARADA_ALDEA.indice } };
    tick(2);
    bajo = ag.vida().visitante;
  }
  ok(bajo && notas.some((x) => x.startsWith('Bajó un visitante')), 'baja un visitante y te avisan');
  const fv = figuras.find((x) => x.claveAldea === 'visitante');
  ok(fv, 'está en el andén');
  let c = ag.charla(fv);
  ok(c.tipo === 'llegada' && c.partes.length === 2 && /Mirador/.test(c.partes[1]), 'te pregunta por el lugar');
  c.alTerminar();
  ok(ag.vida().visitante.estado === 'guiando', 'te sigue');
  jugador.estado.pos.x = 300; jugador.estado.pos.z = 300; fv.pos.x = 302; fv.pos.z = 302;
  tick(2);
  ok(ag.vida().guiados.length === 1 && notas.some((x) => x.startsWith('Llevaste a')), 'llegaron: anotado en el cuaderno');
  // tu familia en el refugio
  const vida = ag.vida();
  vida.familia.proxima = p.dia; p.horas = 12;
  jugador.estado.pos.x = 205; jugador.estado.pos.z = 200;
  tick(2);
  const fam = figuras.find((x) => x.claveAldea === 'familia');
  ok(fam && /Susana|Facundo/.test(fam.nombre), 'tu familia vino al refugio');
  c = ag.charla(fam);
  ok(c.partes.length === 4 && c.tipo === 'llegada', 'y opina de todo');
  ok(ag.charla(fam).partes.length === 1, 'la segunda vez, una línea');
  p.horas = 19.5; tick(2);
  ok(vida.familia.ultima === p.dia && fam.dormido, 'a la tardecita se vuelve en el tren');
  // los cachorros: Ernesto te ofrece uno
  ir(6, 40); p.horas = 10; p.dia += 1; tick(2);
  const jefe = figuras.find((x) => x.claveAldea === 'jefe');
  c = ag.charla(jefe);
  ok(c.id === 'aldea-cachorro' && c.tipo === 'llegada', 'el jefe te ofrece un cachorro de la Chola');
  c.alTerminar();
  ok(vida.mascota.estado === 'adoptado' && notas.some((x) => x.startsWith('Adoptaste a')), `lo adoptás (${JSON.stringify(vida.mascota)} · ${notas.slice(-3).join(' / ')})`);
  ok(ag.charla(jefe).id !== 'aldea-cachorro', 'y no te lo vuelve a ofrecer');
  // el calendario en el cuaderno
  const nodos = [];
  const el = (tag, clase, texto) => { const x = { tag, clase, texto: texto || '', hijos: [], style: {}, appendChild(h) { this.hijos.push(h); } }; nodos.push(x); return x; };
  ag.dibujarCalendario(el('div'), el);
  const texto = nodos.map((x) => x.texto).join(' | ');
  ok(/Calendario y vida de la aldea/.test(texto) && /Hoy: /.test(texto) && /Visitantes que guiaste/.test(texto) && /Cumpleaños de todos/.test(texto) && /el cachorro de la Chola/.test(texto), 'la ficha del calendario');
  ok(leer('src/oficios-ui.js').includes("'calendario'"), 'en el cuaderno, junto a «Tus vecinos»');
  // la radio: Julia sola en la seccional
  const juliaF = figuras.find((x) => x.claveAldea === 'guardaparque');
  ok(!!juliaF, 'Julia');
}

// ============================================================ 16. nada religioso (pedido del usuario)
{
  const textos = JSON.stringify([
    NUEVAS.map((k) => A.POBLADORES_ALDEA[k]), NUEVAS.map((k) => VZ.VOCES[k]), NUEVAS.map((k) => VZ.AYUDAS[k]), A.CHARLAS_ALDEA, A.ETAPAS_DE, A.CARRERAS,
    V.VISITANTES, V.LUGARES_VISITA, V.FAMILIA, V.APODOS.map((a) => a.texto), VZ.FRASES.cumpleSaludo, VZ.FRASES.cumpleRegalo,
    V.opinionesFamilia('mama', {}, V.vidaNueva(1)), V.opinionesFamilia('hermano', {}, V.vidaNueva(1)), V.textosVisitante({ id: 'lena', lugar: 'mirador' }),
  ]);
  const m = RELIGIOSO.exec(textos);
  ok(!m, `nada religioso (encontré «${m?.[0]}»)`);
  ok(!/mágic|hechiz|conjur|encantamiento/i.test(textos), 'ni magia');
}

console.log(`OK 3.7.0 aldea · ${n} verificaciones · calle de la Loma, veinte pobladores, calendario, cumpleaños, visitantes, chicos, mascota, apodo, familia, ritmo, Josefina, saneo y migración`);
