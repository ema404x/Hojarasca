// 4.10 (partidas): volver a jugar.
//   1. las semillas del Coihue: se ganan una por partida (mínimo de noches), se gastan, se guardan aparte y aguantan un almacenamiento que falla
//   2. las ventajas: el catálogo, los costos, el máximo de dos, los choques y el efecto de cada una
//   3. las reglas a elección y el multiplicador de puntos; los récords de cada modo
//   4. la partida corta: siete noches, el mandamás en la última, récord propio y final propio
//   5. la pesadilla: se desbloquea al ganar una vez; más duendes, sin cofre, más niebla
//   6. los finales: cuál sale con qué estado, y el cuaderno
//   7. el guardado: una partida vieja carga limpia; lo raro se sanea
//   8. el enganche con el juego (las semillas, el arranque de las ventajas, los aliados, el final) y el texto del código
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/desafio-meta.js';
import { crearMetaJuego } from '../src/desafio-meta-juego.js';
import * as R from '../src/desafio-reglas.js';
import * as A from '../src/desafio-aldea.js';
import { nivelDeAyuda } from '../src/desafio-vecinos.js';
import * as B from '../src/desafio-bonos.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };
const igual = (a, b, m) => { assert.deepEqual(a, b, m); pasos++; };

// un almacén de mentira (como localStorage), con la posibilidad de que falle
function almacen({ falla = false, soloPrincipal = false } = {}) {
  const m = new Map();
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (falla || (soloPrincipal && k === M.CLAVE_META)) throw new Error('lleno'); m.set(k, String(v)); },
  };
}

// ================================================================ 1. las semillas
{
  ok(M.SEMILLAS.porPartida === 1 && M.SEMILLAS.minNoches === 3, 'una semilla por partida, con tres noches como mínimo');
  ok(M.semillaPorPartida({ noches: 2 }) === 0, 'con dos noches no hay semilla');
  ok(M.semillaPorPartida({ noches: 3 }) === 1, 'con tres, sí');
  ok(M.semillaPorPartida({ noches: 20 }) === 1, 'y con veinte, una (no más)');
  ok(M.semillaPorPartida({ noches: 9, yaDada: true }) === 0, 'una partida que ya la dio no la da otra vez');
  ok(M.semillaPorPartida({ noches: 'x' }) === 0 && M.semillaPorPartida() === 0 && M.semillaPorPartida({ noches: -5 }) === 0, 'valores raros: nada');
  const n = M.metaNueva();
  ok(n.semillas === 0 && n.partidas === 0 && n.desbloqueos.pesadilla === false && n.finales.length === 0, 'una meta nueva está vacía');
  let r = M.terminarPartida(n, { noches: 5 });
  ok(r.semilla === 1 && r.meta.semillas === 1 && r.meta.ganadas === 1 && r.meta.partidas === 1, 'terminar una partida de cinco noches da la semilla y la cuenta');
  ok(n.semillas === 0, 'sin tocar la meta original');
  r = M.terminarPartida(r.meta, { noches: 1 });
  ok(r.semilla === 0 && r.meta.semillas === 1 && r.meta.partidas === 2, 'con una noche, la partida cuenta pero no da semilla');
  let m = M.sanearMeta({ semillas: 98 });
  for (let i = 0; i < 5; i++) m = M.terminarPartida(m, { noches: 5 }).meta;
  ok(m.semillas === M.SEMILLAS.tope, 'las semillas tienen tope (99)');
  // gastar
  const g = M.gastarSemillas(M.sanearMeta({ semillas: 3 }), 2);
  ok(g.semillas === 1, 'gastar descuenta');
  ok(M.gastarSemillas(M.sanearMeta({ semillas: 1 }), 2) === null, 'sin saldo no se gasta');
  ok(M.gastarSemillas(M.sanearMeta({ semillas: 1 }), -4).semillas === 1, 'un costo negativo no regala');
  // el saneo
  for (const raro of [null, undefined, 5, 'x', [], [1], { semillas: -3 }, { semillas: 'muchas' }, { semillas: 1e9 }, { semillas: NaN }, { semillas: true }]) {
    const s = M.sanearMeta(raro);
    ok(Number.isInteger(s.semillas) && s.semillas >= 0 && s.semillas <= M.SEMILLAS.tope, `saldo sano con ${JSON.stringify(raro)}`);
    ok(Object.keys(s.records).length === M.CLAVES_MODO.length, 'siempre hay una lista de récords por modo');
  }
  ok(M.sanearMeta({ semillas: 2.9 }).semillas === 2, 'con decimales, para abajo');
  // el almacenamiento
  const a = almacen();
  ok(M.guardarMeta(a, M.sanearMeta({ semillas: 4, finales: ['aldea'] })) === true, 'guarda');
  ok(a.m.has(M.CLAVE_META) && a.m.has(M.CLAVE_META_COPIA), 'y deja la copia de respaldo aparte');
  ok(M.CLAVE_META !== 'hojarasca-sinfin-v1' && M.CLAVE_META !== 'hojarasca-desafio-v1' && M.CLAVE_META.startsWith('hojarasca-'), 'con su clave propia, distinta de la del guardado de partida y la de los récords sin fin');
  ok(M.leerMeta(a).semillas === 4 && M.leerMeta(a).finales[0] === 'aldea', 'lee lo guardado');
  a.m.set(M.CLAVE_META, '{roto');
  ok(M.leerMeta(a).semillas === 4, 'si el principal está roto usa la copia');
  a.m.set(M.CLAVE_META_COPIA, '[1,2');
  igual(M.leerMeta(a), M.metaNueva(), 'si las dos están rotas, una meta nueva (sin tirar el juego)');
  igual(M.leerMeta(null), M.metaNueva(), 'sin almacenamiento, una meta nueva');
  igual(M.leerMeta({ getItem() { throw new Error('bloqueado'); } }), M.metaNueva(), 'si leer falla, una meta nueva');
  const b = almacen({ falla: true });
  ok(M.guardarMeta(b, M.sanearMeta({ semillas: 2 })) === false, 'si el almacenamiento falla, avisa que no pudo (y no revienta)');
  const c = almacen({ soloPrincipal: true });
  ok(M.guardarMeta(c, M.sanearMeta({ semillas: 2 })) === true && M.leerMeta(c).semillas === 2, 'si falla sólo el principal, la copia alcanza');
  ok(M.guardarMeta(null, M.metaNueva()) === false, 'sin almacén no revienta (y avisa que no guardó)');
}

// ================================================================ 2. las ventajas
{
  const V = M.VENTAJAS;
  ok(M.CLAVES_VENTAJA.length === 12, 'doce ventajas');
  igual(Object.keys(M.TIPOS_VENTAJA), ['arranque', 'aliados', 'personaje', 'costo'], 'de cuatro tipos');
  for (const t of Object.keys(M.TIPOS_VENTAJA)) ok(M.CLAVES_VENTAJA.some((k) => V[k].tipo === t), `hay de tipo ${t}`);
  ok(M.CLAVES_VENTAJA.every((k) => V[k].nombre && V[k].texto && Number.isInteger(V[k].costo) && V[k].costo >= 0 && V[k].costo <= 2), 'todas con nombre, texto y un costo chico');
  ok(M.CLAVES_VENTAJA.filter((k) => V[k].tipo !== 'costo').every((k) => V[k].costo >= 1), 'las de arranque, aliados y personaje cuestan semillas');
  ok(M.CLAVES_VENTAJA.filter((k) => V[k].tipo === 'costo').every((k) => V[k].costo === 0 && V[k].mult > 0), 'las «con costo» no cuestan semillas y suman puntos al récord');
  ok(M.MAX_VENTAJAS === 2, 'como mucho dos');
  const rico = { semillas: 20 };
  ok(M.validarEleccion(rico, { ventajas: ['tablas', 'flechas'] }).ok, 'dos ventajas, con saldo: se puede');
  const tres = M.validarEleccion(rico, { ventajas: ['tablas', 'flechas', 'salud'] });
  ok(!tres.ok && /dos|2/.test(tres.motivo), 'tres no');
  const pobre = M.validarEleccion({ semillas: 1 }, { ventajas: ['tablas', 'flechas'] });
  ok(!pobre.ok && /falta/i.test(pobre.motivo) && pobre.costo === 2, 'sin saldo no (y dice cuánto falta)');
  ok(M.validarEleccion({ semillas: 0 }, { ventajas: ['filo'] }).ok, 'una «con costo» se puede con 0 semillas');
  ok(M.validarEleccion({ semillas: 0 }, { ventajas: [], reglas: ['soloArco'] }).ok, 'y las reglas también');
  ok(M.validarEleccion({ semillas: 0 }, {}).ok, 'empezar sin nada siempre se puede');
  ok(!M.validarEleccion(rico, { ventajas: ['perro'], reglas: ['sinAliados'] }).ok, 'sin aliados y un aliado no se llevan');
  ok(!M.validarEleccion(rico, { ventajas: ['herrero'], reglas: ['sinReparar'] }).ok, 'sin reparar y Anselmo ligero tampoco');
  ok(M.validarEleccion(rico, { ventajas: ['salud'], reglas: ['sinAliados', 'sinReparar'] }).ok, 'pero sí con una de personaje');
  igual(M.validarEleccion(rico, { ventajas: ['tablas', 'tablas', '__proto__', 'constructor', 'noexiste'] }).ventajas, ['tablas'], 'repetidas o inexistentes se descartan');
  // el efecto de cada una
  const ef = (k) => M.efectosDe(M.metaDePartida({ ventajas: [k] }));
  igual(ef('tablas').inicio, { tabla: 10, tronco: 4, flechas: 0, miel: 0, trampa: 0 }, 'provisiones: tablas y troncos');
  ok(ef('flechas').inicio.flechas === 20, 'carcaj lleno: veinte flechas');
  ok(ef('trampa').inicio.trampa === 1 && ef('trampa').inicio.miel === 2, 'trampa de miel lista y dos frascos');
  ok(ef('perro').perro === 1.5, 'perro de pelea: un 50 % más fuerte');
  ok(ef('vecino').ayuda.anselmo === 1, 'Anselmo arranca con ayuda 1');
  ok(ef('herrero').anselmoPausa < 1, 'Anselmo repara más ligero');
  ok(ef('chicos').chicos.cadencia < 1 && ef('chicos').chicos.dano > 1, 'los chicos tiran más seguido y más fuerte');
  ok(ef('salud').bonos.saludMax === 15 && ef('correr').bonos.correr > 0 && ef('recarga').bonos.recarga > 0, 'personaje: salud, correr y recargar');
  ok(ef('filo').bonos.dano > 0 && ef('filo').bonos.saludMax < 0, 'más daño pero menos salud');
  ok(ef('avaro').materiales === 1.5 && ef('avaro').nochesLargas === true, 'más materiales pero noches más largas');
  igual(Object.keys(ef('salud').bonos).sort(), ['alcance', 'correr', 'dano', 'recarga', 'reparar', 'saludMax'], 'los bonos usan exactamente las claves del contrato');
  igual(M.efectosDe(null).bonos, { saludMax: 0, correr: 0, recarga: 0, dano: 0, reparar: 0, alcance: 0 }, 'sin meta no hay bonos');
  const dos = M.efectosDe(M.metaDePartida({ ventajas: ['salud', 'filo', 'correr'] }));
  ok(dos.bonos.saludMax === -15 && dos.bonos.correr === 0, 'la partida sólo toma las dos primeras ventajas (máximo dos)');
  const sa = M.efectosDe(M.metaDePartida({ ventajas: ['vecino'], reglas: ['sinAliados'] }));
  igual(sa.ayuda, {}, 'sin aliados anula la ayuda inicial');
}

// ================================================================ 3. reglas y puntos
{
  igual(M.CLAVES_REGLA, ['soloArco', 'sinAliados', 'nochesLargas', 'sinReparar', 'sinEmplastos'], 'las cinco reglas');
  ok(M.CLAVES_REGLA.every((k) => M.REGLAS[k].mult > 0 && M.REGLAS[k].nombre && M.REGLAS[k].texto), 'cada una suma puntos');
  ok(M.multiplicadorDe([], []) === 1, 'sin nada, ×1');
  ok(M.multiplicadorDe([], ['soloArco']) === 1.3, 'sólo arco suma 0,30');
  ok(M.multiplicadorDe(['filo'], ['soloArco', 'sinAliados']) === 1.75, 'filo + sólo arco + sin aliados = 1,75');
  ok(M.multiplicadorDe(['tablas'], []) === 1, 'una ventaja con semillas no suma puntos');
  ok(M.multiplicadorDe([], M.CLAVES_REGLA) === 2.05, 'todas las reglas: ×2,05');
  ok(M.multiplicadorDe([], ['soloArco', 'soloArco']) === 1.3, 'una regla repetida no suma dos veces');
  const e = M.efectosDe(M.metaDePartida({ reglas: M.CLAVES_REGLA }));
  ok(e.soloArco && e.sinAliados && e.nochesLargas && e.sinReparar && e.sinEmplastos && e.mult === 2.05, 'las cinco reglas se leen como banderas');
  ok(M.FACTOR_NOCHE_LARGA < 1 && M.FACTOR_NOCHE_LARGA > 0.5, 'las noches largas corren la hora más despacio (sin pasarse)');
  // los puntos
  ok(M.puntosDe({ noches: 5, abatidos: 30 }) === 530, '5 noches y 30 abatidos = 530');
  ok(M.puntosDe({ noches: 5, abatidos: 30, victoria: true }) === 1530, 'ganar suma 1000');
  ok(M.puntosDe({ noches: 5, abatidos: 30, mult: 1.5 }) === 795, 'el multiplicador manda');
  ok(M.puntosDe({ noches: 5, abatidos: 30, mult: 99 }) === 5300, 'con tope ×10');
  ok(M.puntosDe({ noches: 5, abatidos: 30, mult: 0.1 }) === 530, 'y nunca baja de ×1');
  ok(M.puntosDe({ noches: 'x', abatidos: -2 }) === 0, 'raros: 0');
  // los récords
  let meta = M.metaNueva();
  let r = M.registrarPuntos(meta, 'corta', { puntos: 700, noches: 7, abatidos: 40, victoria: true, mult: 1.3, fecha: '2026-10-23' });
  ok(r.puesto === 1 && r.meta.records.corta.length === 1 && r.meta.records.normal.length === 0, 'cada modo tiene su récord');
  ok(meta.records.corta.length === 0, 'sin tocar el original');
  for (let i = 0; i < 14; i++) r = M.registrarPuntos(r.meta, 'corta', { puntos: 100 + i * 10, noches: 3, abatidos: i, fecha: '2026-10-2' + (i % 9) });
  ok(r.meta.records.corta.length === M.TOPE_RECORDS, 'diez como mucho');
  ok(r.meta.records.corta[0].puntos === 700 && r.meta.records.corta.every((x, i, l) => i === 0 || l[i - 1].puntos >= x.puntos), 'de mejor a peor');
  ok(M.registrarPuntos(r.meta, 'corta', { puntos: 1, noches: 1, abatidos: 0 }).puesto === 0, 'uno malo no entra');
  const otro = M.registrarPuntos(r.meta, 'pesadilla', { puntos: 50, noches: 1, abatidos: 0 });
  ok(otro.meta.records.pesadilla.length === 1 && otro.meta.records.corta.length === M.TOPE_RECORDS, 'la pesadilla tiene el suyo aparte');
  ok(M.registrarPuntos(meta, 'inventado', { puntos: 5, noches: 1, abatidos: 0 }).meta.records.normal.length === 1, 'un modo raro cae en la campaña');
  ok(M.registrarPuntos(meta, 'corta', 'x').puesto === 0 && M.registrarPuntos(meta, 'corta', null).puesto === 0, 'una entrada rota no entra');
  const san = M.sanearMeta({ records: { corta: [{ puntos: 'x', noches: -1, fecha: 'ayer', mult: 99 }, null, 7], __proto__: { x: 1 }, constructor: [] } });
  ok(san.records.corta.length === 1 && san.records.corta[0].puntos === 0 && san.records.corta[0].mult === 10 && san.records.corta[0].fecha === '', 'el saneo de entradas rotas');
  ok(M.lineaRecordMeta({ puntos: 800, noches: 7, abatidos: 12, victoria: true, mult: 1.3, fecha: '2026-10-23' }, 0).startsWith('1. 800 puntos · 7 noches'), 'la línea del récord');
}

// ================================================================ 4. la partida corta
{
  ok(M.MODOS.corta.noches === 7 && M.MODOS.corta.nocheFinal === 7 && M.NOCHE_DEL_MANDAMAS_CORTA === 7, 'siete noches, el mandamás en la séptima');
  R.fijarPartidaMeta(null);
  ok(!R.esNocheDeJefe(4) && R.esNocheDeJefe(5) && R.esNocheDeJefe(10) && !R.esNocheDeJefe(7) && R.nocheFinalCoihue() === R.NOCHE_FINAL, 'sin meta, la campaña de siempre: jefes cada cinco, noche final 20');
  R.fijarPartidaMeta(M.metaDePartida({ modo: 'corta' }));
  ok(!R.esNocheDeJefe(5) && !R.esNocheDeJefe(6) && R.esNocheDeJefe(7) && R.esNocheDeJefe(8), 'en la corta el mandamás baja a la séptima (y sigue hasta que caiga)');
  ok(R.nocheFinalCoihue() === Infinity, 'y no hay noche final del Coihue');
  const c7 = R.composicionOleada(7, 'normal', 0);
  ok(c7[c7.length - 1] === 'jefe' && c7.filter((t) => t === 'jefe').length === 1, 'la noche siete trae al mandamás, uno solo y último');
  ok(!R.composicionOleada(5, 'normal', 0).includes('jefe'), 'la quinta ya no');
  ok(R.dificultad('normal').cantidad < 1 && R.dificultad('normal').vida < 1, 'la corta está ajustada (un poco más liviana: hay menos noches para armarse)');
  ok(R.nocheEspecial(7, 0.1, null) === null && R.nocheEspecial(8, 0.1, null) === null, 'ni en la del mandamás');
  ok(R.nocheEspecial(4, 0.1, null) !== null, 'pero sí en las anteriores');
  R.fijarPartidaMeta(null);
  ok(R.dificultad('normal') === R.DIFICULTADES.normal && R.dificultad('raro') === R.DIFICULTADES.normal && R.dificultad(undefined) === R.DIFICULTADES.normal, 'sin meta la dificultad es la de siempre');
  // el récord propio
  let m = M.registrarPuntos(M.metaNueva(), 'corta', { puntos: 900, noches: 7, abatidos: 40, victoria: true, mult: 1 }).meta;
  ok(m.records.corta.length === 1 && m.records.normal.length === 0 && m.records.sinfin.length === 0, 'el récord de la corta es aparte del de la campaña y el sin fin');
  // el final de la corta
  ok(M.textoFinal('aldea', 'corta') !== M.textoFinal('aldea', 'normal') && /mandam[aá]s/i.test(M.textoFinal('aldea', 'corta')), 'la corta tiene sus textos de final (cae el mandamás)');
  // fin de partida: después de ganar no sigue habiendo noches
  const nido = leer('src/desafio-nido.js');
  ok(/modo === 'corta'\) return false/.test(nido), 'ganada la corta, las noches terminan');
}

// ================================================================ 5. la pesadilla
{
  ok(M.MODOS.pesadilla.requiere === 'pesadilla' && M.MODOS.pesadilla.sinCaja === true, 'la pesadilla pide el desbloqueo y no trae cofre');
  const nueva = M.metaNueva();
  ok(!M.validarEleccion(nueva, { modo: 'pesadilla' }).ok && /ganar/i.test(M.validarEleccion(nueva, { modo: 'pesadilla' }).motivo), 'bloqueada de entrada');
  const conCorta = M.anotarVictoria(nueva, 'corta');
  ok(conCorta.desbloqueos.pesadilla === false && conCorta.victorias === 1, 'ganar la corta no la desbloquea');
  ok(!M.anotarVictoria(nueva, 'sinfin').desbloqueos.pesadilla, 'ni el sin fin');
  const gano = M.anotarVictoria(nueva, 'normal');
  ok(gano.desbloqueos.pesadilla === true, 'ganar la campaña la desbloquea');
  ok(M.validarEleccion(gano, { modo: 'pesadilla' }).ok, 'y se puede elegir');
  ok(M.sanearMeta(JSON.parse(JSON.stringify(gano))).desbloqueos.pesadilla === true, 'y queda guardado');
  ok(M.anotarVictoria(gano, 'corta').desbloqueos.pesadilla === true, 'no se pierde');
  ok(M.anotarVictoria(nueva, 'pesadilla').desbloqueos.pesadilla === true, 'ganar la pesadilla también cuenta');
  const e = M.efectosDe(M.metaDePartida({ modo: 'pesadilla' }));
  ok(e.cantidad > 1.2 && e.vida > 1 && e.dano > 1 && e.sinCaja === true && e.nieblaTope > 0.49, 'más duendes, más duros, sin cofre y más niebla');
  R.fijarPartidaMeta(M.metaDePartida({ modo: 'pesadilla' }));
  ok(R.dificultad('normal').cantidad === 1.3 && R.dificultad('implacable').cantidad > 1.7, 'la pesadilla se suma a la dificultad elegida');
  ok(R.composicionOleada(8, 'normal', 0).length > (R.fijarPartidaMeta(null), R.composicionOleada(8, 'normal', 0).length), 'y se nota en la cantidad');
  // la niebla
  let nieblas = 0, nieblasNormal = 0;
  const especiales = (modo) => { R.fijarPartidaMeta(modo ? M.metaDePartida({ modo }) : null); let n = 0; for (let i = 0; i < 1000; i++) if (R.nocheEspecial(6, i / 1000, null) === 'niebla') n++; return n; };
  nieblasNormal = especiales(null); nieblas = especiales('pesadilla');
  ok(nieblas > nieblasNormal + 100, `la pesadilla saca niebla mucho más seguido (${nieblas} contra ${nieblasNormal} de cada mil)`);
  R.fijarPartidaMeta(M.metaDePartida({ modo: 'pesadilla' }));
  ok(R.nocheEspecial(6, 0.99, null) === null && R.nocheEspecial(7, 0.6, 'roja') === null, 'sin especial arriba del tope, ni seguidas');
  ok(R.nocheEspecial(10, 0.6, null) === null, 'ni en la noche del jefe');
  ok(R.nocheEspecial(6, 0.6, null) === 'niebla', 'la franja de arriba es niebla');
  R.fijarPartidaMeta(null);
  ok(R.nocheEspecial(6, 0.6, null) === null, 'en la campaña esa misma tirada no da nada');
  // la caja y la niebla en el código
  const d = leer('src/desafio.js');
  ok(/function soltarCaja\(noche\) \{\n\s+if \(efectosPartida\(\)\?\.sinCaja\) return;/.test(d), 'la pesadilla no suelta el cofre del alba');
}

// ================================================================ 6. los finales
{
  igual(M.CLAVES_FINAL, ['ceniza', 'aldea', 'solitario', 'valle'], 'cuatro finales');
  ok(M.CLAVES_FINAL.every((k) => M.FINALES[k].nombre), 'con nombre');
  const e = (o) => M.elegirFinal({ ayudaron: 2, baseCayo: false, lugaresCaidos: 0, limpias: 0, noches: 20, ...o });
  ok(e({}) === 'valle', 'dos vecinos, nada especial: el valle respira');
  ok(e({ ayudaron: 4 }) === 'aldea' && e({ ayudaron: 3 }) === 'aldea', 'tres o cuatro vecinos y la aldea entera: la aldea');
  ok(e({ ayudaron: 4, lugaresCaidos: 1 }) === 'valle', 'si se perdió un lugar de la aldea, ya no es la aldea entera');
  ok(e({ ayudaron: 0 }) === 'solitario' && e({ ayudaron: 1 }) === 'solitario', 'ninguno o uno: solo');
  ok(e({ ayudaron: 4, baseCayo: true }) === 'ceniza' && e({ ayudaron: 0, baseCayo: true }) === 'ceniza', 'si la base cayó, ceniza (gane o no la ayuda)');
  ok(e({ ayudaron: 'x', baseCayo: false }) === 'solitario' && M.elegirFinal() === 'solitario' && M.elegirFinal({}) === 'solitario', 'estados raros caen en uno válido');
  ok(M.nochesLimpias({ noches: 20, limpias: 14 }) && !M.nochesLimpias({ noches: 20, limpias: 13 }) && !M.nochesLimpias({ noches: 3, limpias: 3 }), 'noches limpias: el 70 % y al menos cinco');
  const textos = M.CLAVES_FINAL.map((k) => M.textoFinal(k, 'normal'));
  ok(new Set(textos).size === 4 && textos.every((t) => t.length > 80), 'cuatro textos distintos');
  ok(new Set(M.CLAVES_FINAL.map((k) => M.textoFinal(k, 'corta'))).size === 4, 'y cuatro más para la corta');
  ok(M.textoFinal('valle', 'normal', true).length > M.textoFinal('valle', 'normal', false).length && M.textoFinal('ceniza', 'normal', true) === M.textoFinal('ceniza', 'normal', false), 'las noches limpias suman una línea (menos en ceniza)');
  ok(M.textoFinal('nada', 'normal') === M.textoFinal('valle', 'normal'), 'un final raro cae en el valle');
  ok(M.CLAVES_FINAL.every((k) => M.epilogoFinal(k).length > 10), 'cada final tiene su epílogo');
  // lo que se lee del juego
  const dd = { derrotas: 0, noches: 20, aldea: { ayuda: { anselmo: 2, herminia: 1, martin: 0, chicos: 1 } }, meta: { limpias: 15, lugaresCaidos: 0 } };
  ok(M.vecinosQueAyudaron(dd) === 3, 'cuenta los vecinos con ayuda mayor a 0 (D().aldea.ayuda)');
  ok(M.vecinosQueAyudaron({}) === 0 && M.vecinosQueAyudaron({ aldea: { ayuda: { __proto__: { anselmo: 2 } } } }) === 0, 'sin aldea o con algo heredado, 0');
  igual(M.estadoDeFinal(dd), { ayudaron: 3, baseCayo: false, lugaresCaidos: 0, limpias: 15, noches: 20 }, 'el estado que se pasa al final');
  ok(M.estadoDeFinal({ derrotas: 2 }).baseCayo === true, 'derrotas = la base cayó');
  ok(M.elegirFinal(M.estadoDeFinal(dd)) === 'aldea', 'con ese estado, «la aldea entera»');
  // el cuaderno
  let m = M.metaNueva();
  igual(M.resumenFinales(m).vistos, 0, 'ningún final visto');
  m = M.anotarFinal(m, 'aldea'); m = M.anotarFinal(m, 'aldea'); m = M.anotarFinal(m, 'ceniza'); m = M.anotarFinal(m, 'inventado');
  const res = M.resumenFinales(m);
  ok(res.vistos === 2 && res.total === 4 && res.lista.find((f) => f.id === 'aldea').visto && !res.lista.find((f) => f.id === 'solitario').visto, 'el cuaderno anota cuáles viste (sin repetir ni inventar)');
  ok(M.sanearMeta({ finales: ['aldea', 'x', '__proto__', 'aldea'] }).finales.length === 1, 'el saneo de finales');
}

// ================================================================ 7. el guardado
{
  const nueva = R.desafioNuevo();
  ok(nueva.meta === null, 'una partida nueva no trae meta hasta elegir');
  const vieja = R.sanearDesafio({ salud: 80, noches: 4 });
  ok(vieja.meta === null, 'una partida vieja carga sin meta: campaña de siempre, sin ventajas ni reglas');
  igual(M.efectosDe(vieja.meta), M.efectosDe(null), 'y sin ningún efecto');
  for (const raro of [5, 'x', [], [1], true, { modo: 'otro' }, { modo: 7, ventajas: 'x', reglas: 3 }]) {
    const s = R.sanearDesafio({ meta: raro }).meta;
    ok(s === null || (s.modo === 'normal' && Array.isArray(s.ventajas) && Array.isArray(s.reglas)), `meta rara (${JSON.stringify(raro)}) se sanea`);
  }
  const buena = R.sanearDesafio({ meta: { modo: 'corta', ventajas: ['tablas', 'filo', 'salud', '__proto__'], reglas: ['soloArco', 'x'], aplicado: 1, semillaDada: 'si', limpias: -3, lugaresCaidos: 'x', final: 'aldea', mult: 99 } }).meta;
  ok(buena.modo === 'corta' && buena.ventajas.length === 2 && buena.reglas.length === 1, 'se recorta a dos ventajas y las reglas válidas');
  ok(buena.mult === 1.5 && buena.aplicado === true && buena.semillaDada === true && buena.limpias === 0 && buena.lugaresCaidos === 0 && buena.final === 'aldea', 'el multiplicador se recalcula (no se confía en el guardado) y lo demás se sanea');
  ok(R.sanearDesafio({ meta: { final: 'inventado' } }).meta.final === null, 'un final inventado no vale');
  ok(R.sanearDesafio({ meta: { modo: 'pesadilla' } }).meta.modo === 'pesadilla', 'la pesadilla carga');
  ok(R.sanearDesafio({ meta: { modo: 'sinfin' } }).meta.modo === 'sinfin', 'el sin fin también');
  // ida y vuelta por JSON
  const ida = R.sanearDesafio(JSON.parse(JSON.stringify(R.sanearDesafio({ meta: buena }))));
  igual(ida.meta, buena, 'lo guardado vuelve igual');
  // no se toca el resto de la partida
  const conAldea = R.sanearDesafio({ aldea: { ayuda: { anselmo: 2 } }, meta: { ventajas: ['vecino'] } });
  ok(conAldea.aldea.ayuda.anselmo === 2, 'sanear la meta no toca la aldea');
}

// ================================================================ 8. el enganche con el juego
{
  // la aldea de la 4.9 y los aliados
  const dA = { aldea: { ayuda: { anselmo: 2, herminia: 1, martin: 1, chicos: 2 } } };
  ok(A.nivelAyuda(dA, 'anselmo') === 2, 'sin la regla, la ayuda es la de siempre');
  ok(['anselmo', 'herminia', 'martin', 'chicos'].every((k) => A.nivelAyuda({ ...dA, meta: { reglas: ['sinAliados'] } }, k) === 0), 'con «sin aliados» no ayuda ningún vecino');
  ok(nivelDeAyuda({ ...dA, meta: { reglas: ['sinAliados'] } }, 'chicos') === 0 && nivelDeAyuda(dA, 'chicos') === 2, 'tampoco para las noches grandes');
  ok(A.nivelAyuda({ ...dA, meta: { reglas: ['soloArco'] } }, 'martin') === 1, 'otra regla no los saca');
  // el enganche completo, con un almacén y un juego de mentira
  const al = almacen();
  M.guardarMeta(al, M.sanearMeta({ semillas: 2 }));
  const sumado = {};
  const juego = { progreso: { desafio: { ...R.desafioNuevo(), flechas: 3, miel: 0 } }, notas: [], guardados: 0, trampas: 0, bonos: [] };
  const puestas = [];
  const ctx = {
    almacen: () => al, progreso: () => juego.progreso, esSinFin: () => false, sumarMaterial: (k, n) => { sumado[k] = (sumado[k] || 0) + n; },
    nota: (t) => juego.notas.push(t), guardar: () => { juego.guardados++; }, posJugador: () => ({ x: 10, z: 20 }),
    desafio: () => ({ colocarTrampaMiel: (x, z, o) => { puestas.push({ x, z, o }); return { ok: puestas.length >= 2 }; } }),
    sumarBono: (d, fuente, clave, valor) => juego.bonos.push([fuente, clave, valor]),
  };
  const mj = crearMetaJuego(ctx);
  ok(mj.leer().semillas === 2, 'lee el saldo guardado');
  ok(mj.iniciar({ modo: 'normal', ventajas: ['tablas', 'flechas', 'salud'] }) === false && mj.leer().semillas === 2 && juego.progreso.desafio.meta === null, 'una elección que no vale no gasta ni deja nada');
  ok(mj.iniciar({ modo: 'pesadilla', ventajas: [] }) === false, 'la pesadilla bloqueada no empieza');
  igual(sumado, {}, 'ni da materiales');
  juego.progreso.desafio.aldea.pedidos.anselmo = { id: 'x' };
  ok(mj.iniciar({ modo: 'corta', ventajas: ['tablas', 'vecino'], reglas: ['soloArco'] }) === true, 'una elección válida empieza');
  const d = juego.progreso.desafio;
  ok(mj.leer().semillas === 0, 'gasta las dos semillas');
  ok(JSON.parse(al.m.get(M.CLAVE_META)).semillas === 0, 'y lo guarda');
  ok(d.meta.modo === 'corta' && d.meta.ventajas.join() === 'tablas,vecino' && d.meta.reglas.join() === 'soloArco' && d.meta.mult === 1.3, 'deja la elección en la partida');
  ok(sumado.tabla === 10 && sumado.tronco === 4, 'provisiones: diez tablas y cuatro troncos');
  ok(d.aldea.ayuda.anselmo === 1 && d.aldea.ayuda.herminia === 0 && d.aldea.pedidos.anselmo?.id === 'x', 'Anselmo arranca con ayuda 1 y el resto de la aldea queda como estaba');
  ok(R.efectosPartida().nocheFinal === 7 && R.esNocheDeJefe(7), 'el juego toma el modo de la partida');
  const guard = juego.guardados;
  mj.aplicarInicio();
  ok(sumado.tabla === 10 && juego.guardados === guard, 'el arranque se aplica una sola vez');
  mj.alCargar();
  ok(R.esNocheDeJefe(7) && !R.esNocheDeJefe(5), 'al cargar vuelve a tomar el modo');
  // con bonos (el contrato)
  const juego2 = { desafio: { ...R.desafioNuevo() } };
  const bonos = [];
  const al2 = almacen(); M.guardarMeta(al2, M.sanearMeta({ semillas: 5 }));
  const mj2 = crearMetaJuego({ ...ctx, almacen: () => al2, progreso: () => juego2, sumarBono: (dd, fuente, clave, valor) => bonos.push([dd === juego2.desafio, fuente, clave, valor]) });
  ok(mj2.iniciar({ modo: 'normal', ventajas: ['salud', 'filo'] }), 'salud y filo');
  igual(bonos.filter((b) => b[3]).map((b) => b.slice(1)).sort(), [['ventaja', 'dano', 0.25], ['ventaja', 'saludMax', -15]].sort(), 'los bonos van por sumarBono(d, «ventaja», clave, valor), sumando salud y filo');
  ok(bonos.every((b) => b[0]), 'con la partida como primer argumento');
  // con los bonos de verdad (desafio-bonos.js de «guardián»): origen «ventaja», sumando, y arrancando entero
  {
    const j = { desafio: { ...R.desafioNuevo() } };
    const a = almacen(); M.guardarMeta(a, M.sanearMeta({ semillas: 5 }));
    const mjB = crearMetaJuego({ ...ctx, almacen: () => a, progreso: () => j, sumarBono: B.sumarBono, alBonos: (dd) => { dd.salud = B.saludMaximaConBonos(R.SALUD_MAX, dd); } });
    ok(mjB.iniciar({ modo: 'normal', ventajas: ['salud', 'recarga'] }), 'salud y manos ligeras');
    ok(B.bonoDe(j.desafio, 'saludMax') === 15 && B.bonoDe(j.desafio, 'recarga') === 0.1 && j.desafio.bonos.origen.ventaja.saludMax === 15, 'los bonos quedan en D().bonos con origen «ventaja»');
    ok(j.desafio.salud === 115, 'y se arranca con la salud máxima nueva');
    mjB.aplicarInicio();
    ok(B.bonoDe(j.desafio, 'saludMax') === 15, 'sin duplicar al volver a aplicar (el contrato suma)');
    ok(B.quitarBonosDeOrigen(j.desafio, 'ventaja') && B.bonoDe(j.desafio, 'saludMax') === 0, 'y se pueden sacar por origen');
    const j2 = { desafio: { ...R.desafioNuevo() } };
    const a2 = almacen();
    const mjC = crearMetaJuego({ ...ctx, almacen: () => a2, progreso: () => j2, sumarBono: B.sumarBono, alBonos: (dd) => { dd.salud = B.saludMaximaConBonos(R.SALUD_MAX, dd); } });
    ok(mjC.iniciar({ modo: 'normal', ventajas: ['filo'] }) && B.bonoDe(j2.desafio, 'dano') === 0.25 && B.bonoDe(j2.desafio, 'saludMax') === -30 && j2.desafio.salud === 70, 'filo de riesgo: más daño y 30 de salud máxima menos (arranca con 70)');
  }
  // la trampa de miel
  const juego3 = { desafio: { ...R.desafioNuevo() } };
  const al3 = almacen(); M.guardarMeta(al3, M.sanearMeta({ semillas: 1 }));
  const sum3 = {}; const pu3 = [];
  const mj3 = crearMetaJuego({ ...ctx, almacen: () => al3, progreso: () => juego3, sumarMaterial: (k, n) => { sum3[k] = (sum3[k] || 0) + n; },
    desafio: () => ({ colocarTrampaMiel: (x, z, o) => { pu3.push(o); return { ok: pu3.length >= 3 }; } }) });
  ok(mj3.iniciar({ modo: 'normal', ventajas: ['trampa'] }) && juego3.desafio.miel === 2, 'trampa lista: dos frascos de miel');
  mj3.ponerTrampa(1);
  ok(pu3.length === 3 && pu3.every((o) => o.gratis === true), 'busca un lugar que sirva y la deja gratis');
  const sum4 = {};
  crearMetaJuego({ ...ctx, sumarMaterial: (k, n) => { sum4[k] = n; }, desafio: () => ({ colocarTrampaMiel: () => ({ ok: false }) }) }).ponerTrampa(1);
  ok(sum4.tabla === 2, 'si no hay lugar, se dan las tablas para armarla');
  // terminar: la semilla, una sola vez
  juego.progreso.desafio.noches = 7; juego.progreso.desafio.abatidos = 40;
  const fin = mj.terminar({ victoria: true });
  ok(fin.semilla === 1 && mj.leer().semillas === 1, 'ganar da la semilla');
  ok(fin.puntos === M.puntosDe({ noches: 7, abatidos: 40, victoria: true, mult: 1.3 }) && fin.puesto === 1, 'y anota los puntos con el multiplicador en el récord de la corta');
  ok(mj.leer().records.corta.length === 1 && mj.leer().records.normal.length === 0 && mj.leer().victorias === 1, 'en la lista de la corta');
  ok(mj.terminar() === null && mj.leer().semillas === 1 && mj.leer().records.corta.length === 1, 'una partida da su semilla una sola vez (abandonarla después no suma otra)');
  ok(mj.leer().desbloqueos.pesadilla === false, 'ganar la corta no abre la pesadilla');
  // abandonar con pocas noches
  const juego5 = { desafio: { ...R.desafioNuevo(), noches: 2 } };
  const al5 = almacen();
  const mj5 = crearMetaJuego({ ...ctx, almacen: () => al5, progreso: () => juego5 });
  const f5 = mj5.terminar();
  ok(f5.semilla === 0 && mj5.leer().semillas === 0 && mj5.leer().partidas === 1, 'dejar una partida con dos noches no da semilla');
  const juego6 = { desafio: { ...R.desafioNuevo(), noches: 3, meta: M.metaDePartida({ modo: 'normal' }) } };
  const al6 = almacen();
  const mj6 = crearMetaJuego({ ...ctx, almacen: () => al6, progreso: () => juego6 });
  ok(mj6.terminar().semilla === 1 && mj6.leer().semillas === 1, 'con tres noches, perdida o abandonada, da la semilla');
  ok(mj6.leer().records.normal[0].victoria === false, 'y anota los puntos sin el bono de ganar');
  // ganar la campaña: final y pesadilla
  const juego7 = { desafio: { ...R.desafioNuevo(), noches: 20, abatidos: 200, derrotas: 0, aldea: { ...R.desafioNuevo().aldea, ayuda: { anselmo: 2, herminia: 2, martin: 1, chicos: 2 } } } };
  const al7 = almacen();
  const mj7 = crearMetaJuego({ ...ctx, almacen: () => al7, progreso: () => juego7 });
  const v7 = mj7.alVencer();
  ok(v7.final === 'aldea' && v7.nombreFinal === 'La aldea entera' && v7.texto.length > 80 && juego7.desafio.meta.final === 'aldea', 'al ganar con los cuatro vecinos, el final de la aldea entera (guardado en la partida)');
  ok(mj7.leer().finales.includes('aldea') && mj7.leer().desbloqueos.pesadilla === true, 'queda anotado en el cuaderno y se abre la pesadilla');
  ok(mj7.final().final === 'aldea' && mj7.final().epilogo, 'el cierre de la cueva repite el final con su epílogo');
  const juego8 = { desafio: { ...R.desafioNuevo(), noches: 7, derrotas: 1, meta: M.metaDePartida({ modo: 'corta' }) } };
  const mj8 = crearMetaJuego({ ...ctx, almacen: () => almacen(), progreso: () => juego8 });
  const v8 = mj8.alVencer();
  ok(v8.final === 'ceniza' && v8.texto === M.textoFinal('ceniza', 'corta'), 'la base cayó: ceniza, con el texto de la corta');
  // un almacén que falla no tira la partida
  const juego9 = { desafio: { ...R.desafioNuevo(), noches: 5 } };
  const mj9 = crearMetaJuego({ ...ctx, almacen: () => almacen({ falla: true }), progreso: () => juego9 });
  ok(mj9.terminar().semilla === 1 && mj9.leer().semillas === 1, 'con el almacenamiento roto, la semilla vive en la sesión');
  const mj10 = crearMetaJuego({ ...ctx, almacen: () => { throw new Error('sin almacén'); }, progreso: () => ({ desafio: { ...R.desafioNuevo(), noches: 5 } }) });
  ok(mj10.terminar().semilla === 1, 'y sin almacenamiento tampoco revienta');
  // el sin fin
  const juego11 = { desafio: { ...R.desafioNuevo(), noches: 12 } };
  const mj11 = crearMetaJuego({ ...ctx, almacen: () => almacen(), progreso: () => juego11, esSinFin: () => true });
  ok(mj11.asegurarMeta().modo === 'sinfin', 'el sin fin tiene su modo');
  ok(mj11.terminar().modo === 'sinfin' && mj11.leer().records.sinfin.length === 1, 'y su récord de puntos');
  R.fijarPartidaMeta(null);
}

// ================================================================ 9. el texto del código (enganches que no se corren en Node)
{
  const d = leer('src/desafio.js'), main = leer('src/main.js'), reglas = leer('src/desafio-reglas.js');
  const al = leer('src/desafio-aliados.js'), vm = leer('src/desafio-vecinos-mundo.js'), pl = leer('src/plantilla.html');
  ok(/if \(efectosPartida\(\)\?\.soloArco && id !== 'arco' && id !== 'martillo'\)/.test(d), 'sólo arco: las otras armas no pegan (el martillo sirve para reparar)');
  ok(/function atacarAlterno\(id\) \{[^}]*soloArco/.test(d), 'sólo arco: ni el disparo cargado de la pistola');
  ok(/function martillar\(js\) \{\n\s+if \(efectosPartida\(\)\?\.sinReparar\)/.test(d), 'sin reparar: el martillo no repara');
  ok(/if \(r\.reparar && efectosPartida\(\)\?\.sinReparar\)/.test(d), 'sin reparar: el taller tampoco');
  ok(/reparar: \(o, cantidad\) => \{ if \(efectosPartida\(\)\?\.sinReparar\) return true;/.test(d), 'sin reparar: Anselmo y Don Ramón tampoco');
  ok(/obraMasDanada: [^\n]*\n\s+if \(efectosPartida\(\)\?\.sinReparar\) return null;/.test(d), 'y ni buscan qué arreglar');
  ok(/if \(efectosPartida\(\)\?\.sinEmplastos\)/.test(d), 'sin emplastos');
  ok(/efectosPartida\(\)\?\.nocheFinal && !d\.victoria && !d\.sinFin\) setTimeout/.test(d), 'la corta se gana al caer el mandamás');
  ok(/if \(!efectosPartida\(\)\?\.nocheFinal\) abrirSegundoActo\(\)/.test(d), 'sin cueva en la corta');
  ok(/d\.meta && !nocheActual\.perdidas\) d\.meta\.limpias\+\+/.test(d), 'cuenta las noches limpias');
  ok(/D\(\)\.meta\) D\(\)\.meta\.lugaresCaidos\+\+/.test(d), 'cuenta los lugares caídos');
  ok(!/>= NOCHE_FINAL/.test(d) && /nocheFinalCoihue\(\)/.test(d), 'la noche final del Coihue ya no es una constante en el juego');
  ok(/efectosPartida\(\)\?\.sinAliados\) return null/.test(al) && /efectosPartida\(\)\?\.sinAliados\) return false/.test(al), 'sin aliados: ni perro ni Ramón ni Josefina');
  ok(/efectosPartida\(\)\?\.perro \?\? 1/.test(al), 'el perro de pelea');
  ok(/efectosPartida\(\)\?\.anselmoPausa/.test(vm) && /chicos\.cadencia/.test(vm) && /chicos\.dano/.test(vm), 'Anselmo ligero y los chicos con puntería');
  ok(/FACTOR_NOCHE_LARGA : 1/.test(main) && /efectosPartida\(\)\?\.nochesLargas/.test(main), 'noches más largas: la hora corre más despacio de noche');
  ok(/materialesDeMeta\(troncosTala\)/.test(main) && /materialesDeMeta\(cuanto\)/.test(main), 'manos llenas: más troncos y piedras');
  ok(/pantallaNueva\.abrir\(\); return;/.test(main) && /esDesafio && !partidaEmpezada\(\) && !metaElegida && \(!HOJARASCA_DEBUG/.test(main), 'al entrar a una partida nueva del Desafío se abre la pantalla de ventajas y reglas');
  ok(/sumarBono,\s+\/\/ 4\.10 partidas/.test(main) && /alBonos: \(d\) => \{ d\.salud = saludMaximaConBonos/.test(main), 'main le pasa a las ventajas el contrato de bonos');
  ok(/if \(esDesafio\) metaJuego\.terminar\(\);/.test(main),'dejar una partida para empezar otra también da su semilla');
  ok(/alVencer: \(s\) => \{ s\.cierre = metaJuego\.alVencer\(\)/.test(main), 'ganar da la semilla, los puntos y el final');
  ok(/meta: metaJuego\.terminar\(\)/.test(main), 'la corrida sin fin también');
  ok(/if \(esDesafio\) fijarPartidaMeta\(progreso\.desafio\?\.meta \|\| null\)/.test(main), 'al abrir una partida se toma su modo');
  ok(/pestanas\.push\(\['partidas', 'Partidas'\]\)/.test(main), 'el cuaderno tiene la hoja de Partidas');
  ok(/id="nueva-partida"/.test(pl) && /id="victoria-final"/.test(pl) && /id="meta-portada"/.test(pl), 'la plantilla trae la pantalla, el final y la línea de la portada');
  ok(/meta: null[,; ]/.test(reglas) && /meta: sanearMetaPartida\(x\.meta\)/.test(reglas), 'la partida nueva no trae meta y la guardada se sanea');   // 4.10 (junta): «base» suma su campo `crece` después
  // el Relax queda afuera
  ok(/if \(!esDesafio\) \{ el\.textContent = ''; return; \}/.test(main), 'la portada del Relax no muestra las semillas');
  ok(/if \(esDesafio\) fijarPartidaMeta/.test(main) && !/fijarPartidaMeta\([^)]*\)[^\n]*\n[^\n]*!esDesafio/.test(main), 'nada de esto se prende en el Relax');
  // sin el inglés
  const nuevos = [leer('src/desafio-meta.js'), leer('src/desafio-meta-pantalla.js'), leer('src/desafio-meta-juego.js')].join('\n');
  ok(!/\b(Start|Cancel|Back|Rules|Advantages|Nightmare|Short game)\b/.test(nuevos.replace(/\/\/[^\n]*/g, '')), 'sin textos en inglés');
  // sin religión
  ok(!/\b(dios|santo|santa|rezar|bendición|bendecido|oración|ángel|demonio|cielo)\b/i.test(nuevos), 'nada religioso');
}

console.log(`verificar-4-10-partidas: ${pasos} comprobaciones`);
