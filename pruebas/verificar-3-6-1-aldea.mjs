// 3.6.1 (aldea): los arreglos de las reglas de la Aldea de los Duendes y su guardado, sin Electron.
//  · la etapa completada de madrugada queda lista esa misma mañana (dormir de madrugada no
//    cambia el día, y la etapa seguía un día entero sin terminar);
//  · la experiencia de constructor de la obra del pueblo: da lo mismo en cualquier orden (de a
//    dos rendía la mitad más que todo junto, y de a uno nada);
//  · ninguna fecha de la aldea del futuro: con una en un guardado roto, la obra quedaba
//    «trabajando» para siempre, no bajaba nadie más del tren o el músico no enseñaba nunca;
//  · en el Desafío no se guarda la aldea (ni la vacía ni la de una partida del Relax importada);
//  · baja alguien del tren sólo con el tren en el andén de la aldea (no con la aldea como
//    próxima parada y el tren parado en otro lado);
//  · la progresión entera (los once con sus once locales) con el reloj del juego: dormir,
//    madrugadas, varias noches seguidas, aportes de a poco, guardar y cargar en cada paso.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as A from '../src/aldea.js';
import * as G from '../src/aldea-gente.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { sanearCorreo } from '../src/correo.js';
import { XP, xpDeAporte } from '../src/oficios.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const M = A.marcoAldea();
const IDS = ENTRADAS.map((e) => e.id);
const partida = (anotadas = 0, extra = {}) => ({ modo: 'relax', dia: 1, horas: 10, entradas: Object.fromEntries(IDS.slice(0, anotadas).map((id) => [id, { dia: 1, hora: 9, cantidad: 0 }])), materiales: {}, cosas: {}, aldea: A.aldeaNueva(), personal: {}, correo: sanearCorreo({}), ...extra });
// dormir como en main.js (`dormir`): de noche, si ya pasaron las 7, es otro día; se despierta a las 7:12
const dormir = (p) => { if (p.horas > 7) p.dia++; p.horas = 7.2; };
const todo = { tronco: 999, tabla: 999, piedra: 999 };

// ============================================================ 0. el módulo y el gate
{
  ok(leer('package.json').includes('node pruebas/verificar-3-6-1-aldea.mjs'), 'la prueba está en el gate');
  for (const f of ['src/aldea.js', 'src/aldea-gente.js', 'src/oficios.js', 'src/guardado.js']) ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
}

// ============================================================ 1. la etapa completada de madrugada
{
  const conObra = () => A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }] });
  // de día (o de noche antes de las 24): queda lista a las 7 del día siguiente, como siempre
  for (const hora of [7, 7.5, 12, 18, 23.9]) {
    const a = conObra();
    A.aportar(a, 'carpinteria', todo, 5, hora);
    eq(a.obras.carpinteria.lista, { dia: 6, hora: 7 }, `completada a las ${hora}: lista el día siguiente a las 7`);
  }
  // de madrugada: esa misma mañana
  for (const hora of [0, 1, 2.5, 6.9]) {
    const a = conObra();
    A.aportar(a, 'carpinteria', todo, 5, hora);
    eq(a.obras.carpinteria.lista, { dia: 5, hora: 7 }, `completada a las ${hora}: lista esa misma mañana`);
  }
  // sin la hora (las pruebas de la 3.6.0, quien no la sepa): como siempre
  { const a = conObra(); A.aportar(a, 'carpinteria', todo, 5); eq(a.obras.carpinteria.lista, { dia: 6, hora: 7 }, 'sin hora, el día siguiente'); }
  { const a = conObra(); A.aportar(a, 'carpinteria', todo, 5, 'x'); eq(a.obras.carpinteria.lista, { dia: 6, hora: 7 }, 'con una hora rota, el día siguiente'); }
  // lo que pasaba: a las 2:30 se completa, se duerme (de madrugada no cambia el día) y al despertar…
  for (const hora of [0.5, 2.5, 5]) {
    const p = partida(0, { dia: 4, horas: hora, aldea: conObra() });
    A.aportar(p.aldea, 'carpinteria', todo, p.dia, p.horas);
    dormir(p);
    const ev = A.avanzarObras(p.aldea, p.dia, p.horas);
    ok(ev.length === 1 && ev[0].tipo === 'etapa' && p.aldea.obras.carpinteria.etapa === 1, `completada a las ${hora} y dormido: al despertar, la etapa está hecha`);
  }
  // y completada a la noche, igual que antes: al despertar al otro día
  { const p = partida(0, { dia: 4, horas: 22, aldea: conObra() }); A.aportar(p.aldea, 'carpinteria', todo, p.dia, p.horas); dormir(p); ok(A.avanzarObras(p.aldea, p.dia, p.horas).length === 1 && p.dia === 5, 'completada a las 22 y dormido: al despertar, hecha'); }
  // nunca dos etapas por una, aunque el reloj salte días
  { const a = conObra(); A.aportar(a, 'carpinteria', todo, 5, 3); A.avanzarObras(a, 40, 12); A.avanzarObras(a, 80, 12); eq(a.obras.carpinteria.etapa, 1, 'una etapa por vez aunque pasen semanas'); }
  // aldea-gente.js le pasa la hora
  ok(leer('src/aldea-gente.js').includes('r = aportar(a, lote, m, dia(), horas());'), 'aldea-gente.js aporta con la hora del juego');
}

// ============================================================ 2. la experiencia de constructor (sin que se pueda exprimir)
{
  // la etapa da lo mismo se aporte como se aporte: un tercio de lo puesto (redondeado) y la etapa
  let semilla = 11;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  for (const lote of A.LOTES_ALDEA) for (let e = 0; e < A.ETAPAS_OBRA.length; e++) {
    const pide = A.pideEtapa(lote, e);
    const total = Object.values(pide).reduce((s, x) => s + x, 0);
    const deUna = xpDeAporte(pide, true, 0);
    for (let prueba = 0; prueba < 6; prueba++) {
      // aportes de a poco (de a uno, de a dos o al azar), como hace aldea-gente.js
      const a = A.sanearAldea({ pobladores: [{ clave: A.pobladorDeLote(lote), dia: 1 }] });
      a.obras[lote] = { etapa: e, aportado: {}, lista: null, desde: 1 };
      let xp = 0, vueltas = 0;
      while (!a.obras[lote].lista && vueltas++ < 500) {
        const antes = Object.values(a.obras[lote].aportado).reduce((s, x) => s + x, 0);
        const tam = prueba === 0 ? 1 : prueba === 1 ? 2 : 1 + Math.floor(r() * 5);
        const k = Object.keys(pide)[Math.floor(r() * Object.keys(pide).length)];
        const res = A.aportar(a, lote, { [k]: tam }, 3, 12);
        if (Object.keys(res.usados).length) xp += xpDeAporte(res.usados, res.completa, antes);
      }
      assert.equal(xp, deUna, `${lote} ${e}: de a poco (${prueba}) da lo mismo que todo junto`);
      n++;
    }
    assert.equal(deUna, Math.round(total / 3) + XP.etapa); n++;
  }
  // los casos que andaban mal
  let deADos = 0; for (let i = 0; i < 7; i++) deADos += xpDeAporte({ piedra: 2 }, false, i * 2);
  eq(deADos, xpDeAporte({ piedra: 14 }), 'de a dos no rinde más que todo junto (antes: 7 contra 5)');
  let deAUno = 0; for (let i = 0; i < 9; i++) deAUno += xpDeAporte({ tabla: 1 }, false, i);
  eq(deAUno, xpDeAporte({ tabla: 9 }), 'de a uno rinde lo mismo (antes: nada)');
  // lo de la 3.6.0, igual
  eq(xpDeAporte({ tabla: 6, tronco: 3 }), 3); eq(xpDeAporte({ tabla: 6 }, true), 2 + XP.etapa); eq(xpDeAporte(null), 0); eq(xpDeAporte({ tabla: -5, x: 'a' }), 0);
  eq(xpDeAporte({ tabla: 3 }, false, 'x'), 1, 'con lo anterior roto, como si no hubiera nada');
  // aportar con E sin nada, o con la etapa ya trabajando, no da nada (no se exprime)
  ok(/if \(et\.lista\) \{[\s\S]*?return \{ usados: \{\}, faltan: \{\}, completa: true \};[\s\S]*?if \(!Object\.keys\(r\.usados\)\.length\) \{[\s\S]*?return r;\n {4}\}[\s\S]*?ctx\.alAportar\?\.\(r\.usados, r\.completa, antes\);/.test(leer('src/aldea-gente.js')), 'sin aporte, sin experiencia');
}

// ============================================================ 3. con la gente de mentira: la hora y la experiencia de verdad
{
  const p = partida(0, { dia: 3, horas: 2.5, aldea: A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }] }) });
  const notas = [], xps = [];
  const ag = G.crearAldeaGente({
    progreso: () => p, gente: () => ({ gente: [], agregarPoblador: () => null }), tren: () => ({ est: { parado: 0 } }), jugador: () => null,
    alturaDePie: () => 0, nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, registrar: () => {},
    sumarMaterial: (k, x) => { p.materiales[k] = (p.materiales[k] || 0) + x; }, sumarEntrada: () => {},
    alAportar: (usados, completa, antes) => xps.push(xpDeAporte(usados, completa, antes)),
  });
  p.materiales = { piedra: 2 };
  for (let i = 0; i < 6; i++) { p.materiales.piedra = 2; ag.aportarObra('carpinteria'); }
  p.materiales = { piedra: 99, tronco: 99 };
  ag.aportarObra('carpinteria');
  const pide = A.pideEtapa('carpinteria', 0);
  eq(xps.reduce((s, x) => s + x, 0), Math.round((pide.piedra + pide.tronco) / 3) + XP.etapa, 'aportando de a dos con E: lo mismo que todo junto');
  eq(p.aldea.obras.carpinteria.lista, { dia: 3, hora: 7 }, 'completada a las 2:30 con E: lista esa mañana');
  dormir(p);
  ag.revisarObras();
  eq(p.aldea.obras.carpinteria.etapa, 1, 'y al despertar está hecha');
  ok(notas.some((x) => /^Avanzó la obra de la carpintería/.test(x)), 'con su aviso');
}

// ============================================================ 4. ninguna fecha del futuro
{
  const pob = (k, dia) => ({ clave: k, dia });
  const rota = {
    pobladores: [pob('carpintero', 3), pob('panadera', 500)], locales: { carpinteria: 900 },
    obras: { panaderia: { etapa: 1, aportado: A.pideEtapa('panaderia', 1), lista: { dia: 999999, hora: 7 }, desde: 777 } },
    llegando: null, ultimaLlegada: 800, ultimaApertura: 999999, usos: { carpintero: 10, panadera: 12, herrero: 4000 },
    mandado: { id: ENTRADAS[2].id, dia: 600 }, partitura: 99999, descubierta: 4000,
  };
  const s = A.sanearAldea(rota, 10);
  eq(s.pobladores, [pob('carpintero', 3), pob('panadera', 10)], 'los días de llegada, hasta hoy');
  eq(s.locales, { carpinteria: 10 }, 'el día que abrió, hasta hoy');
  eq(s.obras.panaderia.lista, { dia: 11, hora: 7 }, 'la etapa lista, como mucho mañana');
  ok(s.obras.panaderia.desde === 10 && s.ultimaLlegada === 10 && s.ultimaApertura === 10 && s.partitura === 10 && s.descubierta === 10 && s.mandado.dia === 10, 'lo demás, hasta hoy');
  eq(s.usos, { carpintero: 10 }, 'lo usado hoy queda; lo «usado» en el futuro no es de hoy: se descarta');
  eq(A.sanearAldea(s, 10), s, 'sanear dos veces da lo mismo');
  eq(A.sanearAldea(JSON.parse(JSON.stringify(s)), 10), s, 'y va y vuelve de JSON igual');
  // sin `hoy`, lo de siempre (nada se acota)
  eq(A.sanearAldea(rota).obras.panaderia.lista.dia, 999999, 'sin hoy, como en la 3.6.0');
  // lo que destraba: la obra termina mañana, la panadería abre…
  const p = partida(60, { dia: 10, horas: 12, aldea: s });
  dormir(p);
  ok(A.avanzarObras(p.aldea, p.dia, p.horas).length === 1 && p.aldea.obras.panaderia.etapa === 2, 'la obra «trabajando para siempre» sigue al día siguiente');
  for (let e = 2; e < 4; e++) { A.aportar(p.aldea, 'panaderia', todo, p.dia, 12); dormir(p); A.avanzarObras(p.aldea, p.dia, p.horas); }
  ok(A.localAbierto(p.aldea, 'panaderia'), 'y la panadería abre');
  p.dia += 2;
  ok(A.puedeLlegar(p).ok && A.puedeLlegar(p).quien === 'herrero', 'y el próximo baja del tren (la última apertura ya no está en el futuro)');
  // el músico
  const q = partida(0, { dia: 20, aldea: A.sanearAldea({ pobladores: [pob('musico', 1)], locales: { salon: 1 }, partitura: 1e6 }, 20) });
  ok(!!A.servicioDe('musico', q, 27).efectos, 'el músico vuelve a enseñar a la semana');
  // fuzz con `hoy`: cualquier cosa, saneada, estable y sin fechas del futuro
  let semilla = 3;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  const RAROS = [0, -1, 1, 2, 5, 9, 10, 11, 12, 77, 1e6, 1e308, -Infinity, NaN, 'texto', '7', null, true, [], {}];
  const raro = () => RAROS[Math.floor(r() * RAROS.length)];
  const claves = [...A.ORDEN_POBLADORES_ALDEA, '__proto__', 'constructor', 'x'];
  const lotes = [...A.LOTES_ALDEA, 'plaza', 'constructor'];
  for (let i = 0; i < 3000; i++) {
    const hoy = 1 + Math.floor(r() * 40);
    const v = {
      pobladores: Array.from({ length: Math.floor(r() * 13) }, () => (r() < 0.1 ? raro() : { clave: claves[Math.floor(r() * claves.length)], dia: raro() })),
      locales: Object.fromEntries(Array.from({ length: 4 }, () => [lotes[Math.floor(r() * lotes.length)], raro()])),
      obras: Object.fromEntries(Array.from({ length: 3 }, () => [lotes[Math.floor(r() * lotes.length)], r() < 0.2 ? raro() : { etapa: raro(), aportado: r() < 0.5 ? todo : { piedra: raro(), tronco: raro() }, lista: r() < 0.3 ? raro() : { dia: raro(), hora: raro() }, desde: raro() }])),
      llegando: r() < 0.5 ? { clave: claves[Math.floor(r() * claves.length)], dia: raro() } : raro(),
      usos: Object.fromEntries(claves.map((k) => [k, raro()])), mandado: r() < 0.5 ? { id: ENTRADAS[i % ENTRADAS.length].id, dia: raro() } : raro(),
      ultimaLlegada: raro(), ultimaApertura: raro(), partitura: raro(), descubierta: raro(), afilado: raro(), mandados: raro(), fauna: raro(), llamado: raro(),
    };
    const s = A.sanearAldea(v, hoy);
    assert.deepEqual(A.sanearAldea(s, hoy), s);
    assert.deepEqual(A.sanearAldea(JSON.parse(JSON.stringify(s)), hoy), s);
    for (const p of s.pobladores) assert.ok(p.dia >= 1 && p.dia <= hoy);
    for (const d of Object.values(s.locales)) assert.ok(d >= 1 && d <= hoy);
    for (const o of Object.values(s.obras)) assert.ok(o.desde <= hoy && (!o.lista || o.lista.dia <= hoy + 1));
    for (const d of Object.values(s.usos)) assert.ok(d >= 1 && d <= hoy);
    for (const k of ['ultimaLlegada', 'ultimaApertura', 'partitura', 'descubierta']) assert.ok(s[k] >= 0 && s[k] <= hoy, k);
    assert.ok(!s.llegando || s.llegando.dia <= hoy);
    assert.ok(!s.mandado || s.mandado.dia <= hoy);
    // y nada queda trabado: en a lo sumo dos días cada obra con su etapa completa avanza
    const a = JSON.parse(JSON.stringify(s));
    const conLista = Object.keys(a.obras).filter((l) => a.obras[l].lista);
    A.avanzarObras(a, hoy + 2, 0);
    for (const l of conLista) assert.ok(!a.obras[l] || a.obras[l].etapa > s.obras[l].etapa);
  }
  n += 3000;
  // la migración de la 3.1, también con el día
  const m = A.migrarDesdePueblo({ pobladores: [{ clave: 'carpintero', dia: 50, casa: {} }], llegando: { clave: 'panadera', dia: 70 }, ultimaLlegada: 60, usos: { carpintero: 80 }, mandado: { id: ENTRADAS[0].id, dia: 90 } }, 12);
  ok(m.pobladores[0].dia === 12 && m.llegando.dia === 12 && m.ultimaApertura === 12 && !m.usos.carpintero && m.mandado.dia === 12, 'la migración, sin fechas del futuro');
}

// ============================================================ 5. el guardado: el día de la partida y el Desafío
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const Gd = await import('../src/guardado.js?aldea361=' + Date.now());
  // Relax: la aldea se sanea con el día de la partida
  Gd.usarModoGuardado('relax', 1);
  const p = Gd.progresoNuevo();
  ok(!!p.aldea, 'el Relax tiene aldea');
  p.dia = 8;
  p.aldea = { pobladores: [{ clave: 'carpintero', dia: 2 }], obras: { carpinteria: { etapa: 0, aportado: A.pideEtapa('carpinteria', 0), lista: { dia: 999999, hora: 7 }, desde: 2 } }, ultimaApertura: 5000 };
  datos.set('hojarasca-v1', JSON.stringify(p));
  const c = Gd.cargarProgreso();
  ok(c.aldea.obras.carpinteria.lista.dia === 9 && c.aldea.ultimaApertura === 8, 'al cargar, la aldea sin fechas del futuro');
  ok(Gd.guardarProgreso(c));
  eq(Gd.cargarProgreso().aldea, c.aldea, 'y vuelve igual');
  // una partida de la 3.1 con un pueblo con fechas raras
  const vieja = Gd.progresoNuevo(); delete vieja.aldea; vieja.dia = 6;
  vieja.pueblo = { nombre: 'X', cartel: null, pobladores: [{ clave: 'carpintero', dia: 3, casa: { id: 'a', x: 1, z: 1 } }, { clave: 'panadera', dia: 40, casa: { id: 'b', x: 2, z: 2 } }], llegando: null, ultimaLlegada: 40, llamado: false, usos: {}, afilado: 0, mandado: null, mandados: 0 };
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const cv = Gd.cargarProgreso();
  eq(cv.aldea.pobladores, [{ clave: 'carpintero', dia: 3 }, { clave: 'panadera', dia: 6 }], 'la 3.1: los dos, sin perder ni duplicar a nadie');
  ok(!('pueblo' in cv) && cv.aldea.ultimaApertura === 6, 'sin el pueblo viejo y sin fechas del futuro');
  // Desafío: sin aldea
  Gd.usarModoGuardado('desafio', 1);
  const d = Gd.progresoNuevo();
  ok(!('aldea' in d), 'una partida nueva del Desafío no tiene aldea');
  const importada = { ...p, modo: 'relax', aldea: A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }], locales: { carpinteria: 1 } }) };
  ok(Gd.escribirPartida('desafio', 2, importada), 'una partida del Relax importada en el Desafío');
  const leida = JSON.parse(datos.get('hojarasca-desafio-p2-v1'));
  ok(!('aldea' in leida) && leida.modo === 'desafio', 'queda sin la aldea');
  Gd.usarModoGuardado('desafio', 1);
  const vd = Gd.progresoNuevo(); vd.pueblo = { pobladores: [], llegando: null };
  datos.set('hojarasca-desafio-v1', JSON.stringify(vd));
  const cd = Gd.cargarProgreso();
  ok(cd && !cd.aldea && !('pueblo' in cd), 'un Desafío de la 3.1 (con su pueblo vacío) carga sin aldea ni pueblo');
  ok(Gd.guardarProgreso(cd) && !/"aldea"|"pueblo"/.test(datos.get('hojarasca-desafio-v1')), 'y se guarda sin aldea');
  Gd.usarModoGuardado('relax', 1);
  ok(!!Gd.cargarProgreso().aldea, 'el Relax de la misma ranura conserva su aldea');
  // lo que lee la aldea en el Desafío no tira sin `progreso.aldea`
  ok(A.golpesConFilo(3, undefined) === 3 && A.gastarFilo(undefined) === false && A.puedeLlegar({ modo: 'desafio', entradas: {} }).ok === false, 'sin aldea: el filo y la llegada no tiran');
  const ev = leer('src/eventos-valle-ui.js');
  ok(ev.includes('const r = p.aldea ? puedeLlegar(p) : null;'), 'el evento del viajero mira si hay aldea');
}

// ============================================================ 6. baja alguien sólo con el tren en el andén de la aldea
{
  const p = partida(14);
  const tren = { est: { parado: 0, proxima: null } };
  const ag = G.crearAldeaGente({ progreso: () => p, gente: () => ({ gente: [], agregarPoblador: () => null }), tren: () => tren, jugador: () => null, alturaDePie: () => 0, nota: () => {}, guardar: () => {} });
  const aldea = { indice: A.PARADA_ALDEA.indice, s: 500 };
  // al bajarte de la cabina lejos de una parada, el tren espera parado donde quedó con la próxima puesta
  tren.est = { parado: 30, proxima: aldea, s: 200 };
  ag.actualizar(0.6);
  eq(p.aldea.llegando, null, 'parado en la vía con la aldea como próxima: no baja nadie');
  tren.est = { parado: 30, proxima: aldea, s: 500 };
  ag.actualizar(0.6);
  eq(p.aldea.llegando?.clave, 'carpintero', 'parado en el andén de la aldea: baja el carpintero');
  ok(leer('src/trochita.js').includes('else { est.proxima = siguienteParada(est.s); est.parado = 30; }'), 'trochita.js sigue dejando el tren parado con la próxima puesta');
}

// ============================================================ 6b. «falta 1», en singular
{
  const p = partida(A.LLEGADA.anotaciones - 1);
  eq(A.puedeLlegar(p).motivo, 'El valle todavía se conoce poco: falta 1 anotación en el cuaderno', 'una anotación: en singular');
  eq(A.puedeLlegar(partida(A.LLEGADA.anotaciones - 3)).motivo, 'El valle todavía se conoce poco: faltan 3 anotaciones en el cuaderno', 'varias: en plural');
  eq(G.verboFalta({ piedra: 1 }), 'falta'); eq(G.verboFalta({ piedra: 2 }), 'faltan'); eq(G.verboFalta({ piedra: 1, tronco: 1 }), 'faltan'); eq(G.verboFalta({ piedra: 1, tronco: 0 }), 'falta');
  const q = partida(0, { aldea: A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }] }) });
  const pide = A.pideEtapa('carpinteria', 0);
  q.aldea.obras.carpinteria.aportado = { piedra: pide.piedra - 1, tronco: pide.tronco };
  const notas = [];
  const ag = G.crearAldeaGente({ progreso: () => q, gente: () => ({ gente: [], agregarPoblador: () => null }), tren: () => ({ est: {} }), jugador: () => null, alturaDePie: () => 0, nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, sumarMaterial: () => {} });
  eq(ag.avisoObra('carpinteria'), 'Aportar a la obra de la carpintería (falta 1 piedra)', 'el aviso: «falta 1 piedra»');
  q.aldea.obras.carpinteria.aportado = { piedra: pide.piedra - 3, tronco: pide.tronco - 1 };
  q.materiales = { piedra: 1 };
  ag.aportarObra('carpinteria');
  ok(/· Faltan 2 piedras y 1 tronco$/.test(notas.at(-1)), `al aportar, lo que falta (${notas.at(-1)})`);
  q.materiales = { piedra: 2 };
  ag.aportarObra('carpinteria');
  ok(/· Falta 1 tronco$/.test(notas.at(-1)), `y en singular (${notas.at(-1)})`);
}

// ============================================================ 7. la progresión entera, con el reloj del juego
{
  // de una partida nueva a los once con sus once locales: el tren pasa cada hora y media, el
  // jugador anota dos o tres cosas por día, junta algo de material, va a la aldea a distintas
  // horas (a veces de madrugada), duerme casi siempre (a veces dos noches seguidas, a veces de
  // madrugada), y se guarda y se carga (sanear con el día, ida y vuelta por JSON) a cada rato
  const correr = (semilla, { visita = [10, 15, 2], cada = 1.5 } = {}) => {
    let s = semilla >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const p = partida(0, { dia: 1, horas: 8.2, materiales: { tronco: 0, tabla: 0, piedra: 0 } });
    let anotadas = 0, tren = cada, cargas = 0;
    const abiertos = [];
    for (let paso = 0; paso < 24 * 4 * 400; paso++) {
      p.horas += 0.25;
      if (p.horas >= 24) { p.horas -= 24; p.dia++; }
      // dormir: de noche casi siempre; a veces a la madrugada; a veces dos noches seguidas
      if ((Math.abs(p.horas - 22) < 0.1 && rnd() < 0.8) || (Math.abs(p.horas - 3) < 0.1 && rnd() < 0.3)) { dormir(p); if (rnd() < 0.1) { p.horas = 23; dormir(p); } }
      if (Math.abs(p.horas - 12) < 0.1) for (let i = 0; i < 2 + (rnd() < 0.5 ? 1 : 0) && anotadas < IDS.length; i++) p.entradas[IDS[anotadas++]] = { dia: p.dia, hora: 12, cantidad: 0 };
      if (rnd() < 0.25) p.materiales.tronco++; if (rnd() < 0.2) p.materiales.tabla++; if (rnd() < 0.18) p.materiales.piedra++;
      for (const ev of A.avanzarObras(p.aldea, p.dia, p.horas)) if (ev.tipo === 'abierto') abiertos.push(ev.clave);
      tren -= 0.25;
      if (tren <= 0) { tren = cada; if (!p.aldea.llegando) { const r = A.puedeLlegar(p); if (r.ok) A.empezarLlegada(p.aldea, r.quien, p.dia); } }
      if (visita.some((h) => Math.abs(p.horas - h) < 0.1)) {
        if (p.aldea.llegando) A.aceptar(p.aldea, p.dia);
        const lote = A.obraEnCurso(p.aldea);
        if (lote) { const r = A.aportar(p.aldea, lote, { ...p.materiales }, p.dia, p.horas); for (const [k, x] of Object.entries(r.usados)) p.materiales[k] -= x; }
      }
      if (rnd() < 0.02) {
        cargas++;
        const antes = JSON.stringify(p.aldea);
        p.aldea = A.sanearAldea(JSON.parse(antes), p.dia);
        assert.equal(JSON.stringify(p.aldea), antes, `guardar y cargar no cambia nada (día ${p.dia}, ${p.horas} h)`);
      }
      if (Object.keys(p.aldea.locales).length === A.LOTES_ALDEA.length) break;
    }
    return { p, abiertos, cargas };
  };
  for (const [semilla, op] of [[1, {}], [2, { visita: [2.5, 16] }], [3, { visita: [13], cada: 6 }], [4, { visita: [6.5, 20] }], [5, {}]]) {
    const { p, abiertos, cargas } = correr(semilla, op);
    eq(abiertos, A.ORDEN_POBLADORES_ALDEA, `semilla ${semilla}: los once, en orden, cada uno con su local (día ${p.dia}, ${cargas} cargas)`);
    ok(p.aldea.pobladores.length === 11 && !p.aldea.llegando && !A.obraEnCurso(p.aldea) && !A.puedeLlegar(p).ok, `semilla ${semilla}: nadie más espera`);
    ok(p.dia < 140, `semilla ${semilla}: en un tiempo razonable (${p.dia} días)`);
  }
  // si el jugador nunca va: el primero baja y espera en el andén, sin trabar nada
  const nunca = partida(80);
  A.empezarLlegada(nunca.aldea, A.puedeLlegar(nunca).quien, 1);
  for (let d = 1; d < 200; d++) { nunca.dia = d; A.avanzarObras(nunca.aldea, d, 12); }
  ok(nunca.aldea.llegando?.clave === 'carpintero' && !A.puedeLlegar(nunca).ok && /esperando en la estación/.test(A.puedeLlegar(nunca).motivo), 'si nunca vas, el carpintero te espera en el andén');
  A.aceptar(nunca.aldea, 200);
  ok(A.obraEnCurso(nunca.aldea) === 'carpinteria', 'y cuando vas, todo sigue');
}

console.log(`OK 3.6.1 aldea · ${n} verificaciones · madrugada, experiencia de constructor, fechas del futuro, Desafío sin aldea, tren en el andén y progresión entera`);
