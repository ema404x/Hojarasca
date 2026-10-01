// 3.1: la historia guiada del Relax y los eventos del valle con decisiones.
//   1. los capítulos: ocho, cada uno con entrada, 2 a 4 objetivos, salida y premio
//   2. el recorrido de un capítulo: empezar, tildar, cerrar, premio, el siguiente, el final
//   3. los objetivos miran la partida de verdad (estadoHistoria) y cuentan desde el capítulo
//   4. los momentos de la historia (eventos puntuales dentro de un capítulo)
//   5. los eventos: 10 a 12, con 2 o 3 opciones y consecuencias concretas y bien armadas
//   6. el azar sembrado: pocos, espaciados, nunca antes del día 3, iguales con la misma semilla
//   7. elegir, lo que pasa después, la cadena y la gratitud
//   8. el guardado: sanea basura, sobrevive a la vuelta y las partidas viejas cargan
//   9. el diario, y todo enganchado en el juego (fuente y paquete)
import fs from 'node:fs';
import assert from 'node:assert/strict';

const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const H = await import('../src/historia.js');
const E = await import('../src/eventos-valle.js');
const G = await import('../src/guardado.js');
const { crearDiario } = await import('../src/diario.js');
const { TRUEQUES } = await import('../src/trueque.js');
const { VISITANTES } = await import('../src/visitas.js');
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- 1. los capítulos
assert.ok(H.CAPITULOS.length >= 6 && H.CAPITULOS.length <= 8, `entre 6 y 8 capítulos (${H.CAPITULOS.length})`);
assert.equal(new Set(H.CAPITULOS.map((c) => c.id)).size, H.CAPITULOS.length, 'ids de capítulo únicos');
for (const c of H.CAPITULOS) {
  assert.ok(c.titulo && c.intro.length >= 1 && c.outro.length >= 1, `${c.id}: entrada y salida`);
  assert.ok(c.objetivos.length >= 2 && c.objetivos.length <= 4, `${c.id}: 2 a 4 objetivos (${c.objetivos.length})`);
  assert.equal(new Set(c.objetivos.map((o) => o.id)).size, c.objetivos.length, `${c.id}: objetivos únicos`);
  for (const o of c.objetivos) assert.ok(o.texto && (typeof o.hecho === 'function' || typeof o.cuenta === 'function'), `${c.id}:${o.id} se mide`);
  assert.ok(c.premio && c.premio.texto && (c.premio.materiales || c.premio.cuenta || c.premio.ramitas), `${c.id}: premio concreto`);
  for (const k of Object.keys(c.premio.materiales || {})) assert.ok(['tronco', 'tabla', 'piedra', 'lana'].includes(k), `${c.id}: material ${k}`);
  if (c.momento) {
    assert.ok(Object.hasOwn(E.EVENTO_VALLE, c.momento.evento), `${c.id}: el momento es un evento del valle`);
    assert.ok(c.objetivos.some((o) => o.delMomento), `${c.id}: un objetivo espera su momento`);
  }
  for (const t of [...c.intro, ...c.outro]) assert.ok(!/[ÃÂ]/.test(t), `${c.id}: sin mojibake`);
}
// los planos que piden los capítulos existen y se pueden hacer en el Relax
{
  const lineas = ['src/construccion.js', 'src/planos-maquinas.js', 'src/planos-vehiculos.js'].flatMap((f) => leer(f).split(/\r?\n/));
  for (const id of ['banco-trabajo', 'mesa-campo', 'silla-campo', 'varadero-velero', 'molino-agua', 'aserradero', 'estufa-hierro', 'lenera', 'cantero']) {
    const linea = lineas.find((l) => l.includes(`id: '${id}',`));
    assert.ok(linea, `existe el plano ${id}`);
    assert.ok(!/soloDesafio: true/.test(linea), `${id} se construye en el Relax`);
  }
}
// los temas pedidos, en orden: llegada, refugio, vecinos, tren, lago, molino, invierno, final
assert.deepEqual(H.CAPITULOS.map((c) => c.id), ['llegada', 'manos', 'vecinos', 'trochita', 'lago', 'molino', 'invierno', 'temporal']);

// ---------------------------------------------------------------- 2. el recorrido
const progresoBase = () => ({ dia: 1, horas: 9, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, historia: H.historiaNueva() });
{
  const h = H.historiaNueva();
  assert.equal(h.activa, false, 'una partida arranca sin historia');
  assert.equal(H.panelHistoria(h), null, 'sin historia no hay panel');
  assert.equal(H.empezarHistoria(h, 1), true, 'empezar la historia');
  assert.equal(h.fase, 'intro');
  assert.equal(H.empezarHistoria(h, 5), false, 'retomar no la reinicia');
  const p = progresoBase();
  let s = H.estadoHistoria(p, { fuego: false });
  assert.deepEqual(H.revisarHistoria(h, s).nuevos, [], 'antes de la tarjeta de entrada no se tilda nada');
  assert.ok(H.arrancarCapitulo(h, s), 'la tarjeta de entrada arranca el capítulo');
  assert.equal(h.base.anotaciones, 0);
  // el refugio y el fuego
  p.entradas.refugio = { dia: 1 };
  s = H.estadoHistoria(p, { fuego: true });
  let r = H.revisarHistoria(h, s);
  assert.deepEqual(r.nuevos.map((o) => o.id), ['refugio', 'fuego'], 'llegar y prender fuego se tildan');
  assert.equal(r.completo, false);
  // el fuego apagado no destilda
  s = H.estadoHistoria(p, { fuego: false });
  assert.deepEqual(H.revisarHistoria(h, s).nuevos, []);
  assert.ok(h.hechos['llegada:fuego'] !== undefined, 'un objetivo cumplido queda cumplido');
  // tres anotaciones más (la del refugio cuenta) y una noche
  p.entradas.coihue = {}; p.entradas.lenga = {};
  s = H.estadoHistoria(p, {});
  const panel = H.panelHistoria(h, s);
  assert.match(panel.titulo, /Capítulo 1 · La llegada/);
  assert.ok(panel.objetivos.find((o) => o.id === 'anotar').texto.includes('(3/3)'), 'el panel muestra la cuenta');
  r = H.revisarHistoria(h, s);
  assert.deepEqual(r.nuevos.map((o) => o.id), ['anotar']);
  p.dia = 2;
  r = H.revisarHistoria(h, H.estadoHistoria(p, {}));
  assert.ok(r.completo && h.fase === 'outro', 'la primera noche cierra el capítulo');
  assert.equal(H.panelHistoria(h, s).objetivos.every((o) => o.hecho), true);
  const c = H.cerrarCapitulo(h, 2);
  assert.equal(c.capitulo.id, 'llegada');
  assert.ok(c.premio.ramitas > 0 && !c.fin);
  assert.equal(h.capitulo, 1); assert.equal(h.fase, 'intro');
  assert.equal(H.cerrarCapitulo(h, 2), null, 'no se cobra dos veces');
  // saltar al último y terminar
  h.capitulo = H.CAPITULOS.length - 1; h.fase = 'outro';
  const fin = H.cerrarCapitulo(h, 30);
  assert.ok(fin.fin && h.fase === 'fin' && h.terminada === 30, 'el último capítulo termina la historia');
  assert.equal(H.panelHistoria(h, s), null, 'terminada no hay panel: se sigue libre');
  assert.equal(H.revisarHistoria(h, s).nuevos.length, 0);
  assert.match(H.resumenHistoria(h), /Terminaste la historia el día 30/);
  const h2 = H.sanearHistoria(JSON.parse(JSON.stringify(h)));
  assert.equal(h2.fase, 'fin'); assert.equal(h2.terminada, 30);
  // pausar
  const h3 = H.historiaNueva(); H.empezarHistoria(h3, 1); H.pausarHistoria(h3);
  assert.equal(H.panelHistoria(h3), null, 'en pausa no hay panel');
  assert.equal(H.revisarHistoria(h3, s).nuevos.length, 0, 'en pausa no avanza');
  assert.match(H.resumenHistoria(h3), /En pausa/);
}

// ---------------------------------------------------------------- 3. los objetivos miran la partida
{
  const p = progresoBase();
  p.cosas = { hacha: 1, manta: 1 };
  p.materiales = { tabla: 4 }; p.acopio = { tabla: 3 };
  p.talados = [1, 2];
  p.peces = { arcoiris: { cantidad: 2 }, marron: { cantidad: 1 } };
  p.encargos = { 'e-fuego': 'hecho', 'e-tren': 'pedido' };
  p.comercio = { entregas: 2 };
  p.huerta = { '1:2': { cultivo: 'haba' } };
  p.entradas = { haba: { cantidad: 3 }, papa: { cantidad: 1 }, viaje: {}, 'c-luz-mala': {} };
  p.obras = [{ plano: 'lenera', x: 0, z: 0, etapas: 1, lenera: { secos: 4 } }, { plano: 'lenera', x: 5, z: 0, etapas: 1, lenera: { secos: 3 } }];
  p.historia.hablados = { ramon: true, ema: true, intruso: true };
  p.eventosValle = { hechos: { tobillo: { dia: 3 } } };
  const terminadas = [{ id: 'mesa-campo', x: 0, z: 0 }, { id: 'silla-campo', x: 1, z: 0 }, { id: 'banco', x: -1, z: 0.5 }, { id: 'banco-trabajo', x: 9, z: 9 }];
  const s = H.estadoHistoria(p, { terminadas, conduciendo: true, enVela: true });
  assert.equal(s.hacha, true); assert.equal(s.tablas, 7); assert.equal(s.talados, 2); assert.equal(s.peces, 3);
  assert.equal(s.aceptados, 2); assert.equal(s.encargosHechos, 1); assert.equal(s.entregas, 2);
  assert.equal(s.sembrados, 1); assert.equal(s.cosechas, 4); assert.equal(s.lena, 7); assert.equal(s.abrigo, true);
  assert.equal(s.cuentos, 1); assert.equal(s.mesa, true, 'la mesa con dos asientos alrededor');
  assert.deepEqual(s.hablados.sort(), ['ema', 'ramon'], 'sólo los vecinos cuentan');
  assert.ok(s.terminadas.has('banco-trabajo') && s.eventos.has('tobillo') && s.conduciendo && s.enVela);
  assert.equal(H.estadoHistoria(p, { terminadas: [{ id: 'mesa-campo', x: 0, z: 0 }, { id: 'silla-campo', x: 1, z: 0 }] }).mesa, false, 'una sola silla no alcanza');
  // lo que se mide "desde ahora": cuenta desde que empezó el capítulo
  const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 4;   // el lago
  H.arrancarCapitulo(h, s);
  assert.deepEqual(H.revisarHistoria(h, H.estadoHistoria(p, { terminadas })).nuevos.map((o) => o.id), [], 'los peces de antes no cuentan');
  p.peces.marron.cantidad = 2;
  assert.deepEqual(H.revisarHistoria(h, H.estadoHistoria(p, { terminadas, enVela: true })).nuevos.map((o) => o.id), ['pez', 'navegar'], 'uno nuevo sí; y navegar se tilda en el momento');
  // una partida sin vecinos (2.8) no se traba en los capítulos de vecinos
  const hv = H.historiaNueva(); H.empezarHistoria(hv, 1); hv.capitulo = 2;
  const sv = H.estadoHistoria(progresoBase(), { vecinos: false, terminadas });
  H.arrancarCapitulo(hv, sv);
  const rv = H.revisarHistoria(hv, sv);
  assert.ok(rv.completo, `sin vecinos, los de vecinos se dan por hechos (${rv.nuevos.map((o) => o.id)})`);
  // anotar la charla
  const ha = H.historiaNueva();
  assert.equal(H.anotarCharla(ha, 'ramon'), true); assert.equal(H.anotarCharla(ha, 'ramon'), false);
  assert.equal(H.anotarCharla(ha, 'guarda'), false, 'Elsa no es de los cuatro vecinos');
  assert.equal(H.anotarCharla(ha, '__proto__'), false);
}

// ---------------------------------------------------------------- 4. los momentos
{
  const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 2; h.fase = 'jugando';
  const s = H.estadoHistoria(progresoBase(), {});
  assert.equal(H.momentoPendiente(h, s), 'tobillo', 'en los vecinos, Nicanor se lastima pronto');
  assert.equal(H.momentoPendiente(h, { ...s, vecinos: false }), null, 'sin vecinos, Nicanor no se lastima');
  H.momentoLanzado(h);
  assert.equal(H.momentoPendiente(h, s), null, 'una sola vez');
  // el temporal espera a que lo demás esté hecho
  const f = H.historiaNueva(); H.empezarHistoria(f, 1); f.capitulo = 7; f.fase = 'jugando';
  assert.equal(H.momentoPendiente(f, s), null, 'el temporal no llega antes de la visita y el cuento');
  f.hechos['temporal:visita'] = 9; f.hechos['temporal:cuento'] = 9;
  assert.equal(H.momentoPendiente(f, s), 'temporal', 'y llega al final');
  const conTemporal = { ...s, eventos: new Set(['temporal']) };
  assert.equal(H.momentoPendiente(f, conTemporal), null, 'si ya pasó, no se repite');
  assert.ok(H.revisarHistoria(f, conTemporal).completo, 'pasar el temporal termina el capítulo');
}

// ---------------------------------------------------------------- 5. los eventos
assert.ok(E.EVENTOS_VALLE.length >= 10 && E.EVENTOS_VALLE.length <= 12, `10 a 12 eventos (${E.EVENTOS_VALLE.length})`);
assert.equal(new Set(E.EVENTOS_VALLE.map((e) => e.id)).size, E.EVENTOS_VALLE.length);
const TIPOS = ['dar', 'gratitud', 'horas', 'lena', 'helada', 'voltear', 'cosa', 'visita', 'poblador'];
const QUIENES = ['ramon', 'nicanor', 'ema', 'ercilia', 'guarda'];
const COSAS_ITEM = new Set(TRUEQUES.map((t) => t.id));
function revisarEfectos(donde, efectos) {
  for (const f of efectos) {
    assert.ok(TIPOS.includes(f.tipo), `${donde}: efecto ${f.tipo}`);
    if (f.tipo === 'gratitud') assert.ok(QUIENES.includes(f.quien) && f.n > 0, `${donde}: gratitud de ${f.quien}`);
    if (f.tipo === 'dar') assert.ok(f.premio.texto && (f.premio.materiales || f.premio.cuenta || f.premio.ramitas), `${donde}: premio`);
    if (f.tipo === 'cosa') assert.ok(COSAS_ITEM.has(f.id) && f.sino, `${donde}: la cosa ${f.id} existe y tiene alternativa`);
    if (f.tipo === 'visita') assert.ok(Object.hasOwn(VISITANTES, f.quien), `${donde}: la visita es de un vecino que visita`);
    for (const k of Object.keys(f.premio?.materiales || {})) assert.ok(['tronco', 'tabla', 'piedra', 'lana'].includes(k), `${donde}: material ${k}`);
  }
}
const tiposUsados = new Set();
for (const e of E.EVENTOS_VALLE) {
  assert.ok(e.titulo && e.texto && typeof e.cuando === 'function', `${e.id}: título, texto y condición`);
  assert.ok(e.opciones.length >= 2 && e.opciones.length <= 3, `${e.id}: 2 o 3 opciones`);
  for (const o of e.opciones) {
    assert.ok(o.texto && o.detalle !== undefined, `${e.id}.${o.id}: texto`);
    revisarEfectos(`${e.id}.${o.id}`, o.efectos);
    for (const f of o.efectos) tiposUsados.add(f.tipo);
    for (const l of o.luego || []) {
      assert.ok(Object.hasOwn(E.SEGUIMIENTOS, l.id), `${e.id}.${o.id}: existe ${l.id}`);
      assert.ok(l.dias >= 1, `${e.id}.${o.id}: lo de después llega otro día`);
    }
    for (const k of Object.keys(o.pide?.materiales || {})) assert.ok(['tronco', 'tabla', 'piedra'].includes(k));
    for (const k of Object.keys(o.pide?.cuenta || {})) assert.ok(['yerba', 'harina'].includes(k));
  }
  // cada evento cambia algo: alguna opción tiene efectos o consecuencias después
  assert.ok(e.opciones.some((o) => o.efectos.length || (o.luego || []).length), `${e.id}: tiene consecuencias`);
}
for (const [id, s] of Object.entries(E.SEGUIMIENTOS)) {
  assert.ok(s.titulo && s.texto, `${id}: título y texto`);
  revisarEfectos(id, s.efectos);
  for (const f of s.efectos) tiposUsados.add(f.tipo);
  if (s.evento) assert.ok(Object.hasOwn(E.EVENTO_VALLE, s.evento), `${id}: encadena un evento que existe`);
  assert.ok(!/ñ/.test(id), `${id}: sin eñe en el id`);
}
for (const t of TIPOS) assert.ok(tiposUsados.has(t), `algún evento usa el efecto ${t}`);
// cada seguimiento se usa (por una opción o por la gratitud)
const usados = new Set(E.EVENTOS_VALLE.flatMap((e) => e.opciones.flatMap((o) => (o.luego || []).map((l) => l.id))));
for (const id of Object.keys(E.SEGUIMIENTOS)) assert.ok(usados.has(id) || id.startsWith('regalo-'), `${id} se usa`);
for (const q of QUIENES) assert.ok(E.SEGUIMIENTOS[`regalo-${q}`], `regalo de ${q}`);

// ---------------------------------------------------------------- 6. el azar sembrado
const sBase = (dia, extra = {}) => ({ dia, horas: 18, vecinos: true, viaje: true, sembrados: 1, lluvia: false, pronostico: { temporal: false, helada: false }, ...extra });
function correr(semilla, dias = 240) {
  const ev = E.sanearEventosValle({ semilla });
  const salieron = [];
  for (let d = 1; d <= dias; d++) {
    for (const h of [8, 12, 17.9]) {
      const e = E.revisarEventos(ev, sBase(d, { horas: h }));
      if (e) { salieron.push([d, e.id]); E.elegirOpcion(ev, e.opciones[e.opciones.length - 1].id, d); break; }
    }
  }
  return { ev, salieron };
}
{
  const a = correr(12345), b = correr(12345), c = correr(999);
  assert.deepEqual(a.salieron, b.salieron, 'misma semilla, mismos eventos los mismos días');
  assert.notDeepEqual(a.salieron, c.salieron, 'otra semilla, otros días');
  for (const x of [a, c, correr(7), correr(31337)]) {
    assert.ok(x.salieron.every(([d]) => d >= E.EVENTOS.diaMinimo), 'nunca antes del tercer día');
    for (let i = 1; i < x.salieron.length; i++) assert.ok(x.salieron[i][0] - x.salieron[i - 1][0] >= E.EVENTOS.cada, 'como mucho uno cada tres días');
    const primeros = x.salieron.filter(([d]) => d <= 60).length;
    assert.ok(primeros >= 5 && primeros <= 15, `raros pero no ausentes: ${primeros} en 60 días`);
    // los que no se repiten, una sola vez
    const veces = {};
    for (const [, id] of x.salieron) veces[id] = (veces[id] || 0) + 1;
    for (const [id, n] of Object.entries(veces)) if (!E.EVENTO_VALLE[id].repite) assert.equal(n, 1, `${id} pasa una sola vez`);
  }
  // el temporal y la helada sólo con el pronóstico
  const t = E.sanearEventosValle({ semilla: 5 });
  assert.ok(!E.posibles(t, sBase(10)).some((e) => e.id === 'temporal' || e.id === 'helada'));
  assert.ok(E.posibles(t, sBase(10, { pronostico: { temporal: true, helada: true } })).some((e) => e.id === 'temporal'));
  assert.ok(E.posibles(t, sBase(10, { pronostico: { helada: true } })).some((e) => e.id === 'helada'));
  assert.ok(!E.posibles(t, sBase(10, { sembrados: 0, pronostico: { helada: true } })).some((e) => e.id === 'helada'), 'sin huerta, la helada no importa');
  assert.ok(!E.posibles(t, sBase(10, { vecinos: false })).some((e) => e.vecinos), 'sin vecinos, los de vecinos no pasan');
  // una hora antes de la tirada, todavía no
  const u = E.sanearEventosValle({ semilla: 77 });
  let dia = 3; while (!E.tiradaDelDia(u, dia).sale) dia++;
  const hora = E.tiradaDelDia(u, dia).hora;
  assert.equal(E.revisarEventos(u, sBase(dia, { horas: hora - 0.1 })), null);
  assert.ok(E.revisarEventos(u, sBase(dia, { horas: hora + 0.1 })), 'a la hora de la tirada, sale');
  assert.ok(u.activo, 'queda activo hasta que elijas');
  assert.equal(E.revisarEventos(u, sBase(dia, { horas: hora + 1 })).id, u.activo.id, 'se vuelve a mostrar el mismo');
}

// ---------------------------------------------------------------- 7. elegir, después, cadena, gratitud
{
  const ev = E.sanearEventosValle({ semilla: 3 });
  assert.ok(E.forzarEvento(ev, 'puente', 8), 'la historia puede pedir un evento puntual');
  assert.equal(E.forzarEvento(ev, 'tobillo', 8), null, 'con uno abierto no se pisa');
  // no alcanza para arreglarlo
  const r0 = E.elegirOpcion(ev, 'arreglar', 8, { materiales: { tabla: 2 } });
  assert.equal(r0.ok, false); assert.ok(r0.falta.join().includes('6 tablas'));
  assert.ok(ev.activo, 'sigue abierto');
  assert.deepEqual(E.faltaPara({ materiales: { tabla: 6, piedra: 4 } }, { materiales: { tabla: 6, piedra: 4 } }), []);
  const r = E.elegirOpcion(ev, 'nada', 8);
  assert.ok(r.ok && !ev.activo && ev.hechos.puente.opcion === 'nada' && ev.ultimo === 8);
  assert.ok(r.diario.length > 10, 'deja su línea en el diario');
  assert.deepEqual(ev.pendientes, [{ id: 's-puente-caida', dia: 10 }], 'dejarlo así trae algo dos días después');
  assert.equal(E.seguimientoListo(ev, { dia: 9, horas: 20 }), null, 'antes, nada');
  assert.equal(E.seguimientoListo(ev, { dia: 10, horas: 6 }), null, 'ese día, de mañana');
  assert.equal(E.seguimientoListo(ev, { dia: 10, horas: 7.5 }).id, 's-puente-caida');
  const c = E.cerrarSeguimiento(ev, 's-puente-caida', 10);
  assert.equal(c.cadena.id, 'tobillo', 'el puente flojo termina con Nicanor en el agua');
  assert.equal(ev.activo.id, 'tobillo'); assert.equal(ev.activo.desde, 'cadena');
  assert.equal(E.cerrarSeguimiento(ev, 's-puente-caida', 10), null, 'se muestra una sola vez');
  const t = E.elegirOpcion(ev, 'llevar', 10);
  assert.deepEqual(t.efectos.map((f) => f.tipo), ['horas', 'gratitud']);
  assert.equal(ev.pendientes[0].id, 's-tobillo-cana');
  assert.equal(E.seguimientoListo(ev, { dia: 12, horas: 10 }), null, 'la visita de Nicanor es a la tarde');
  assert.ok(E.seguimientoListo(ev, { dia: 12, horas: 15.5 }));
  // la gratitud: al llegar a tres, un regalo, una sola vez
  assert.equal(E.sumarGratitud(ev, 'nicanor', 2, 10), false);
  assert.equal(E.sumarGratitud(ev, 'nicanor', 1, 10), true, 'a la tercera, regalo');
  assert.ok(ev.pendientes.some((p) => p.id === 'regalo-nicanor' && p.dia === 11));
  assert.equal(E.sumarGratitud(ev, 'nicanor', 5, 12), false, 'una sola vez');
  assert.equal(E.sumarGratitud(ev, 'constructor', 5, 12), false);
  assert.match(E.resumenEventos(ev), /Nicanor/);
}

// ---------------------------------------------------------------- 8. el guardado
{
  const basura = E.sanearEventosValle({ semilla: 'x', ultimo: -4, hechos: { __proto__: { dia: 1 }, constructor: { dia: 2 }, puente: { dia: 'n', opcion: 'volar' }, tobillo: 5 }, veces: { constructor: 9 }, pendientes: [{ id: 'toString', dia: 1 }, { id: 's-oveja-lana', dia: 'mañana' }, { id: 's-oveja-lana', dia: 3 }, 7], gratitud: { ramon: 'mucho', hasOwnProperty: 4 }, regalos: { valueOf: true }, activo: { id: 'constructor' } });
  assert.ok(basura.semilla > 0, 'una semilla rota se rehace');
  assert.deepEqual(Object.keys(basura.hechos), ['puente']);
  assert.equal(basura.hechos.puente.opcion, null);
  assert.deepEqual(basura.pendientes, [{ id: 's-oveja-lana', dia: 0 }]);
  assert.deepEqual(basura.gratitud, { ramon: 0 });
  assert.deepEqual(basura.regalos, {}); assert.equal(basura.activo, null); assert.deepEqual(basura.veces, {});
  assert.equal(E.sanearEventosValle(null).activo, null);
  assert.equal(E.sanearEventosValle({ semilla: 44 }).semilla, 44);
  const hb = H.sanearHistoria({ activa: 'sí', capitulo: 99, fase: 'volando', hechos: { 'llegada:fuego': 3, 'x:y': 2, constructor: 1 }, base: { anotaciones: -3, dia: 4, toString: 1 }, hablados: { ramon: 1, __proto__: 1 }, momentos: { vecinos: 'lanzado', llegada: 'otra', constructor: 'lanzado' } });
  assert.equal(hb.activa, false); assert.equal(hb.capitulo, H.CAPITULOS.length - 1); assert.equal(hb.fase, 'intro');
  assert.deepEqual(hb.hechos, { 'llegada:fuego': 3 }); assert.deepEqual(hb.base, { anotaciones: 0, dia: 4 });
  assert.deepEqual(hb.hablados, { ramon: true }); assert.deepEqual(hb.momentos, { vecinos: 'lanzado' });
  assert.deepEqual(H.sanearHistoria('x'), H.historiaNueva());
  // la vuelta entera por el guardado
  G.usarModoGuardado('relax', 1);
  const p = G.progresoNuevo();
  assert.equal(p.historia, undefined, 'una partida nueva no trae historia hasta que haga falta');
  p.pos = { x: 1, z: 2 };
  p.historia = H.historiaNueva(); H.empezarHistoria(p.historia, 1); p.historia.hablados.ema = true; p.historia.hechos['llegada:fuego'] = 1;
  p.eventosValle = E.sanearEventosValle({ semilla: 99 }); E.forzarEvento(p.eventosValle, 'viajero', 4); E.agendar(p.eventosValle, 's-oveja-lana', 6); E.sumarGratitud(p.eventosValle, 'ema', 2, 4);
  assert.ok(G.guardarProgreso(p));
  const v = G.cargarProgreso();
  assert.deepEqual(v.historia, p.historia, 'la historia vuelve igual');
  assert.deepEqual(v.eventosValle, p.eventosValle, 'los eventos, lo pendiente y la gratitud vuelven igual');
  // una partida de antes de la 3.1 carga igual, sin nada de esto
  localStorage.setItem('hojarasca-v1', JSON.stringify({ dia: 7, horas: 10, entradas: { coihue: {} }, pos: { x: 0, z: 0 } }));
  const vieja = G.cargarProgreso();
  assert.ok(vieja && vieja.dia === 7 && vieja.historia === undefined && vieja.eventosValle === undefined, 'una partida vieja carga');
  // la opción de la portada
  localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ relaxTipo: 'aventura' }));
  assert.equal(G.cargarAjustes().relaxTipo, 'libre');
  localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ relaxTipo: 'historia' }));
  assert.equal(G.cargarAjustes().relaxTipo, 'historia');
  assert.equal(G.AJUSTES_BASE.relaxTipo, 'libre', 'de fábrica, libre como siempre');
}

// ---------------------------------------------------------------- 9. el diario y el juego
{
  const d = crearDiario();
  d.anotar('evento', 'Arreglé el puente del arroyo.');
  d.anotar('capitulo', 'terminé «La llegada»');
  const pagina = d.cerrar(4, 'verano', () => 0.3);
  assert.match(pagina.texto, /Arreglé el puente del arroyo\./);
  assert.match(pagina.texto, /En la historia del valle, terminé «La llegada»\./);
}
{
  // los módulos puros no tocan THREE ni el DOM; los exportados sin eñe
  for (const f of ['src/historia.js', 'src/eventos-valle.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
    for (const m of t.matchAll(/^export\s+(?:const|function)\s+([^\s(=]+)/gm)) assert.ok(!/ñ/i.test(m[1]), `${f}: ${m[1]} sin eñe`);
  }
  for (const f of ['src/historia-ui.js', 'src/eventos-valle-ui.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'/.test(t), `${f} sin THREE`);
    for (const m of t.matchAll(/^import .+$/gm)) assert.match(m[0], /^import \{ [^}]+ \} from '\.\/[a-z0-9-]+\.js';$/, `${f}: import en una línea (${m[0]})`);
  }
  const main = leer('src/main.js');
  assert.ok(main.includes("import { crearValleUi } from './historia-ui.js';"));
  assert.ok(main.includes('if (!esDesafio) valle?.actualizar(dt);'), 'la historia y los eventos, sólo en el Relax');
  assert.ok(main.includes('valle?.hablo(npc.clave);'), 'hablar anota al vecino');
  assert.ok(main.includes('valle?.alEntrar();'), 'la portada empieza la historia');
  assert.ok(main.includes('valle?.portada(ajustes);'));
  assert.ok(/pausar: \(\) => \{ modo = 'valle'; jugador\?\.soltar\(\); \}/.test(main), 'con la tarjeta abierta, el mundo se queda quieto');
  assert.ok(/libre: \(\) => !charla\.npc && !enElAlmacen && !enLaFeria && !enLasCargas\(\) && !mochilaAbierta && !modoObra && !foto\.activo && !personalAbierto\(\)/.test(main), 'nunca con un menú o un panel abierto');
  const plantilla = leer('src/plantilla.html');
  assert.ok(plantilla.includes('data-ajuste="relaxTipo"><button data-valor="libre">Libre</button><button data-valor="historia">Historia</button>'));
  const guardado = leer('src/guardado.js');
  assert.ok(guardado.includes("relaxTipo: opcion(x.relaxTipo, ['libre', 'historia'], AJUSTES_BASE.relaxTipo)"));
  const ui = leer('src/historia-ui.js');
  assert.ok(ui.includes("if (ctx.esDesafio) return;"), 'nada de esto en el Desafío');
  const index = leer('index.html');
  for (const marca of ['La historia del valle', 'Lo que pasó después', 'Pasa algo en el valle', 'data-ajuste="relaxTipo"', 'valle?.actualizar(dt)']) assert.ok(index.includes(marca), `el paquete trae «${marca}»`);
}

console.log(`OK 3.1 historia y eventos del valle · ${H.CAPITULOS.length} capítulos (${H.CAPITULOS.reduce((s, c) => s + c.objetivos.length, 0)} objetivos) · ${E.EVENTOS_VALLE.length} eventos · ${Object.keys(E.SEGUIMIENTOS).length} consecuencias después`);
