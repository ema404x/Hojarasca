// 3.1 "Modos y progreso": rangos y oficios.
//  · oficios.js: los niveles, la experiencia, cada habilidad (chica y de verdad), lo que
//    sobra de las obras y rinde la huerta con arrastre de fracciones, el crédito de una
//    partida vieja (una sola vez y con tope) y el saneo;
//  · guardado.js: una partida vieja carga sin oficios, y todo vuelve igual;
//  · main.js, pesca.js, kayak.js y desafio.js: los enganches.
// 3.6: era verificar-3-1-pueblo.mjs. El "fundar un pueblo" de la 3.1 se sacó (la gente llega
// ahora a la Aldea de los Duendes): sus pruebas están en verificar-3-6-aldea.mjs (el núcleo) y
// verificar-3-6-gente.mjs (la gente, las obras y los enganches).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as O from '../src/oficios.js';
// 3.6: el progreso ya no guarda `pueblo`: guarda la aldea (ver verificar-3-6-aldea.mjs)
import * as A from '../src/aldea.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ============================================================ 1. los oficios
{
  for (const k of Object.keys(O)) assert.ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  assert.deepEqual(O.ORDEN_OFICIOS, ['hachero', 'pescador', 'cazador', 'obrero', 'huertero', 'navegante']);
  assert.ok(!O.esOficio('constructor') && !O.esOficio('__proto__') && !O.esOficio('toString') && !O.esOficio(undefined), 'nada heredado es un oficio');
  for (const id of O.ORDEN_OFICIOS) {
    const o = O.OFICIOS[id];
    assert.equal(o.titulos.length, 5, `${id}: cinco títulos`);
    assert.equal(o.habilidades.length, 5, `${id}: una habilidad por nivel`);
    assert.ok(o.titulos.every((t) => t && t.length < 40) && o.habilidades.every((h) => h.length > 10));
  }
  assert.equal(O.NIVEL_MAX, 5);
  assert.deepEqual([0, 39, 40, 119, 120, 260, 479, 480, 799, 800, 5000].map(O.nivelDe), [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(O.nivelDe('abc'), 0);
  assert.equal(O.nivelDe(-50), 0);

  // subir de nivel talando
  const of = O.oficiosNuevos();
  assert.equal(of.acreditado, true, 'una partida nueva no tiene nada que acreditar');
  let r;
  for (let i = 0; i < 3; i++) { r = O.sumarXp(of, 'hachero', O.XP.tala); assert.ok(!r.subio); }
  r = O.sumarXp(of, 'hachero', O.XP.tala);
  assert.ok(r.subio && r.nivel === 1 && r.antes === 0, 'al cuarto árbol, aprendiz de hachero');
  assert.equal(r.titulo, 'Aprendiz de hachero');
  assert.match(r.habilidad, /tronco más/);
  assert.equal(O.sumarXp(of, 'nada', 50).subio, false);
  assert.equal(O.sumarXp(of, 'hachero', -30).nivel, 1, 'la experiencia no baja');
  assert.equal(O.sumarXp(of, 'hachero', 'mucho').nivel, 1);
  O.sumarXp(of, 'hachero', 1e9);
  assert.equal(O.nivelOficio(of, 'hachero'), 5, 'con tope, pero llega al máximo');
  assert.ok(O.xpDe(of, 'hachero') <= 99999);
  const e = O.estadoOficio(of, 'hachero');
  assert.equal(e.hasta, null); assert.equal(e.avance, 1); assert.ok(e.habilidades.every((h) => h.tiene));
  const e0 = O.estadoOficio(of, 'pescador');
  assert.equal(e0.nivel, 0); assert.equal(e0.falta, 40); assert.ok(e0.habilidades.every((h) => !h.tiene));
  assert.equal(O.rangoGeneral(of).titulo, 'Maestro hachero');
  assert.equal(O.rangoGeneral(O.oficiosNuevos()).titulo, 'Recién llegado');

  // las habilidades: reales y modestas
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.troncosAlTalar(4, n)), [4, 5, 5, 5, 5, 6]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.tablasAMano(2, n)), [2, 2, 3, 3, 3, 3]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.golpesParaTalar(3, n)), [3, 3, 3, 2, 2, 2]);
  assert.equal(O.golpesParaTalar(1, 5), 1, 'nunca menos de un hachazo');
  assert.deepEqual([0, 3, 4].map(O.extraDeMata), [0, 0, 1]);
  const piques = [0, 1, 2, 3, 4, 5].map(O.factorPique);
  assert.equal(piques[0], 1);
  for (let i = 1; i < 6; i++) assert.ok(piques[i] <= piques[i - 1] && piques[i] >= 0.75, 'el pique mejora de a poco, hasta un cuarto');
  assert.ok(O.segundosParaClavar(0) === 1.1 && O.segundosParaClavar(2) > 1.1 && O.segundosParaClavar(5) < 2);
  assert.ok(O.factorLinea(0) === 1 && O.factorLinea(4) < 1 && O.factorLinea(4) >= 0.85);
  const pulsos = [0, 1, 2, 3, 4, 5].map(O.factorPulso);
  assert.ok(pulsos[0] === 1 && pulsos[5] <= 1.25 && pulsos.every((p, i) => !i || p >= pulsos[i - 1]), 'el arco se tensa un poco más rápido, como mucho un cuarto');
  assert.ok(O.radioHuellas(1.8, 1) === 1.8 && O.radioHuellas(1.8, 2) > 1.8 && O.radioHuellas(1.8, 2) < 3);
  assert.ok(O.factorEsperaRastro(3) === 1 && O.factorEsperaRastro(4) === 0.75);
  assert.ok(O.factorRemo(0) === 1 && Math.abs(O.factorRemo(5) - 1.2) < 1e-9);
  assert.equal(O.factorPique(99), O.factorPique(5), 'un nivel imposible se acota');
  assert.equal(O.factorPique('x'), 1);

  // constructor: lo que sobra, con arrastre (un 5% de 4 tablas no se pierde)
  let resto = {}, sobra = 0;
  for (let i = 0; i < 10; i++) { const a = O.ahorroDeObra({ tabla: 4 }, 1, resto); resto = a.resto; sobra += a.devuelve.tabla || 0; }
  assert.equal(sobra, 2, '5% de 40 tablas: sobran dos');
  const grande = O.ahorroDeObra({ piedra: 8, tronco: 4 }, 5, {});
  assert.deepEqual(grande.devuelve, { piedra: 2, tronco: 1 });
  assert.deepEqual(O.ahorroDeObra({ tabla: 16 }, 0, {}).devuelve, {}, 'sin oficio no sobra nada');
  assert.deepEqual(O.ahorroDeObra({ tabla: 1 }, 5, { tabla: 0.99 }).devuelve, {}, 'nunca sobra todo lo pedido');
  assert.ok(O.porcentajeAhorro(5) <= 0.25);
  assert.equal(O.xpDeEtapa({ piedra: 8, tronco: 4 }), O.XP.etapa + 4);
  // huertero: rinde un poco más, también con arrastre
  let rc = 0, extra = 0;
  for (let i = 0; i < 4; i++) { const x = O.extraDeCosecha(3, 1, rc); rc = x.resto; extra += x.extra; }
  assert.equal(extra, 1, 'un 15% de doce: una más');
  assert.equal(O.extraDeCosecha(4, 5, 0).extra, 3);
  assert.equal(O.extraDeCosecha(4, 0, 0).extra, 0);

  // una partida vieja: se acredita lo hecho, una vez y con tope
  const vieja = { talados: Array.from({ length: 60 }, (_, i) => ({ i, dia: 1 })), peces: { arcoiris: { cantidad: 3, record: 40 }, marron: { cantidad: 'x' } },
    rastreos: 2, obras: [{ plano: 'puesto', etapas: 4 }, { plano: 'banco', etapas: 1 }], entradas: { haba: { cantidad: 5 } }, desafio: { abatidos: 10 } };
  const c = O.creditoInicial(vieja);
  assert.equal(c.hachero, O.TOPE_CREDITO, 'sesenta árboles: tope, nadie arranca de maestro');
  assert.equal(c.pescador, 30);
  assert.equal(c.cazador, 10 * O.XP.abatido + 2 * O.XP.rastreo);
  assert.ok(c.obrero > 0 && c.huertero > 0);
  assert.ok(!('navegante' in c));
  assert.deepEqual(O.creditoInicial(null), {});
  const sv = O.sanearOficios(undefined);
  assert.equal(sv.acreditado, false, 'una partida sin oficios se acredita');
  const dado = O.acreditarOficios(sv, vieja);
  assert.equal(O.nivelOficio(sv, 'hachero'), 3);
  assert.equal(O.nivelOficio(sv, 'pescador'), 0);
  assert.ok(sv.acreditado && Object.keys(dado).length > 0);
  assert.deepEqual(O.acreditarOficios(sv, vieja), {}, 'una sola vez');
  assert.equal(O.nivelOficio(sv, 'hachero'), 3);
  // el saneo
  const rotos = O.sanearOficios({ xp: { hachero: '50', pescador: -3, constructor: 900, __proto__: { cazador: 400 }, navegante: Infinity }, resto: { obra: { tabla: 7, oro: 0.5 }, cosecha: 'x' }, metros: 1e9, acreditado: 'si' });
  assert.deepEqual(rotos.xp, { hachero: 50 }, 'sólo oficios de verdad y números');
  assert.deepEqual(rotos.resto, { obra: { tabla: 0.999 }, cosecha: 0 });
  assert.equal(rotos.metros, O.METROS_REMO);
  assert.equal(rotos.acreditado, false);
  for (const basura of [null, 3, 'x', [], { xp: [] }]) assert.doesNotThrow(() => O.sanearOficios(basura));
  assert.deepEqual(O.sanearOficios(JSON.parse(JSON.stringify(of))).xp, of.xp, 'lo guardado vuelve igual');
}

// ============================================================ 2. el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?pueblo31=' + Date.now());
  const nuevo = G.progresoNuevo();
  assert.deepEqual(nuevo.oficios, O.oficiosNuevos(), 'una partida nueva: oficios en cero y ya acreditados');
  // 3.6: una partida nueva lleva la aldea y no el pueblo
  assert.ok(!('pueblo' in nuevo)); assert.deepEqual(nuevo.aldea, A.aldeaNueva());
  const vieja = G.progresoNuevo(); delete vieja.oficios; delete vieja.aldea; vieja.dia = 7;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const cargada = G.cargarProgreso();
  assert.ok(cargada && cargada.dia === 7, 'una partida de antes de la 3.1 carga');
  assert.equal(cargada.oficios.acreditado, false, 'y se le acreditará lo hecho');
  assert.deepEqual(cargada.aldea, A.aldeaNueva());
  const con = G.progresoNuevo();
  O.sumarXp(con.oficios, 'hachero', 130);
  // 3.6: un pueblo de la 3.1 (sin aldea) se muda a la aldea al cargar
  delete con.aldea; con.pueblo = { nombre: '', cartel: null, pobladores: [], llegando: null, ultimaLlegada: 0, llamado: false, usos: {}, afilado: 0, mandado: null, mandados: 0 };
  con.pueblo.pobladores.push({ clave: 'carpintero', casa: { id: 'puesto@1.0,2.0', plano: 'puesto', nombre: 'El Rincón', x: 1, z: 2, rot: 0 }, dia: 3 });
  con.pueblo.nombre = 'Villa Lenga'; con.pueblo.cartel = { x: 4, z: 5, rot: 1 };
  assert.ok(G.guardarProgreso(con));
  const vuelta = G.cargarProgreso();
  assert.equal(O.nivelOficio(vuelta.oficios, 'hachero'), 2, 'los oficios vuelven');
  assert.ok(!('pueblo' in vuelta) && A.localAbierto(vuelta.aldea, 'carpinteria'), 'el pueblo vuelve como aldea, con el local del carpintero abierto');
  const rota = G.progresoNuevo(); rota.oficios = 'x'; rota.aldea = [1, 2];
  datos.set('hojarasca-v1', JSON.stringify(rota));
  const r2 = G.cargarProgreso();
  assert.ok(r2 && r2.aldea.pobladores.length === 0 && typeof r2.oficios.xp === 'object', 'lo roto no rompe la partida');
  const g = leer('src/guardado.js');
  assert.ok(g.includes("import { sanearOficios, oficiosNuevos } from './oficios.js';") && g.includes("import { sanearAldea, aldeaNueva, migrarDesdePueblo } from './aldea.js';"));
  // (3.6.1: la aldea se sanea con el día de la partida, ver verificar-3-6-1-aldea.mjs)
  assert.ok(g.includes('oficios: sanearOficios(p.oficios),') && g.includes('aldea: p.aldea !== undefined ? sanearAldea(p.aldea, p.dia)'));
}

// ============================================================ 3. los enganches
{
  const main = leer('src/main.js');
  assert.ok(main.includes("import { crearOficiosUI } from './oficios-ui.js';"));
  // (3.6: los oficios se arman junto con la aldea, que reemplazó al pueblo)
  assert.ok(main.includes('armarOficiosYAldea(esDesafio);'), 'se arman al cargar');
  assert.ok(main.includes("if (modo === 'jugando') actualizarAldea(dt);"), 'y se actualizan en el bucle');
  // cada acción da su experiencia
  for (const [oficio, xp] of [['hachero', 'tala'], ['hachero', 'mata'], ['hachero', 'aserrar'], ['pescador', 'pez'], ['cazador', 'rastro'], ['cazador', 'rastreo'], ['huertero', 'siembra'], ['huertero', 'cosecha']]) {
    assert.ok(main.includes(`ganarOficio('${oficio}', XP.${xp})`), `${oficio} gana con ${xp}`);
  }
  assert.ok(main.includes("ganarOficio('obrero', xpDeEtapa(r.etapa.pide))"), 'constructor gana con cada etapa');
  assert.ok(main.includes("alAbatir: (a) => ganarOficio('cazador', a?.def?.jefe ? XP.jefe : XP.abatido)"), 'cazador gana en el Desafío');
  // y cada habilidad se aplica donde corresponde
  assert.ok(main.includes('const hacen = golpesParaTalarAhora();') && main.includes('if (golpes < hacen) {'), 'el hachazo menos');
  assert.ok(main.includes("troncosAlTalar(TRONCOS_TALA, nivelDe('hachero'))") && main.includes("tablasAMano(TABLAS_A_MANO, nivelDe('hachero'))") && main.includes("extraDeMata(nivelDe('hachero'))"));
  assert.ok(main.includes('ctxPesca.pique = factorPique(nPesca); ctxPesca.clavar = segundosParaClavar(nPesca); ctxPesca.linea = factorLinea(nPesca);'));
  assert.ok(main.includes('conMateriales((m) => conOficioDeObra(obras.avanzar(obra, m), m))') && main.includes('conMateriales((m) => conOficioDeObra(obras.avanzar(nueva, m), m))'), 'lo que sobra en las dos maneras de construir');
  assert.ok(main.includes("radioHuellas(1.8, nivelDe('cazador'))") && main.includes("factorEsperaRastro(nivelDe('cazador'))") && main.includes("pulso: () => factorPulso(nivelDe('cazador'))"));
  assert.ok(main.includes("kayak.est.brazo = factorRemo(nivelDe('navegante'))"));
  const pesca = leer('src/pesca.js'), kayak = leer('src/kayak.js'), des = leer('src/desafio.js');
  assert.ok(pesca.includes('if (mundo.pique) espera *= mundo.pique;') && pesca.includes('est.t > (mundo.clavar || 1.1)') && pesca.includes('* (mundo.linea || 1)'));
  assert.ok(kayak.includes('est.vel += empuje * dt * 1.6 * (est.brazo || 1);'));
  assert.ok(des.includes("factorTension(seg * (ctx.pulso?.() || 1))") && des.includes('ctx.alAbatir?.(a);'));
  // (3.6: la aldea en la pestaña de los oficios)
  assert.ok(main.includes("pestanas.push(['oficios', desafio ? 'Oficios' : 'Oficios y aldea']);"), 'la pestaña del cuaderno');
  // los módulos puros no importan three ni tocan el DOM
  for (const f of ['src/oficios.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
  }
  assert.ok(!/from 'three'/.test(leer('src/oficios-ui.js')), 'oficios-ui.js no usa three');
  // armar.mjs: los imports en una línea, sin `export … from`
  for (const f of ['src/oficios.js', 'src/oficios-ui.js']) {
    const t = leer(f);
    assert.ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !/^import\s+'/m.test(t), `${f}: lo que entiende armar.mjs`);
  }
}

console.log('OK 3.1 oficios: rangos y oficios (6 oficios, 5 niveles, habilidades modestas, crédito de partidas viejas)');
