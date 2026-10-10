// 3.0: la supervivencia sin fin y el mapa del Desafío que cambia con la semilla.
//   1. el mapa: mismo código, mismo mapa; otro código, otro mapa
//   2. cada lugar posible sirve sobre el terreno real (en tierra, plano, alcanzable)
//   3. sin código (las partidas de antes), todo donde estaba
//   4. la corrida sin fin: escala sin NaN, con techo y pareja
//   5. los récords se sanean
//   6. la corrida guarda aparte: nunca pisa la campaña
//   7. enganchado en el juego
import fs from 'node:fs';
import assert from 'node:assert/strict';

// un localStorage de mentira, para el guardado en Node
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const G = await import('../src/guardado.js');
const M = await import('../src/desafio-mapa.js');
const S = await import('../src/desafio-supervivencia.js');
const R = await import('../src/desafio-reglas.js');
const { nochesQueVienen } = await import('../src/meteo.js');
const { marcasAutomaticas } = await import('../src/chinches.js');
const { generarTerreno } = await import('../src/terreno.js');
const { LIMITE, MITAD, CELDA, RES, N, LUGARES } = await import('../src/config.js');
const { PALABRAS } = await import('../src/semilla.js');
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------------------------------------------------------------- 1. mismo código, mismo mapa
{
  const a = M.mapaDesafio('COIHUE-4821');
  assert.deepEqual(M.mapaDesafio('coihue 4821'), a, 'el código se normaliza: el mismo mapa');
  assert.deepEqual(M.mapaDesafio('COIHUE-4821'), a, 'y sale igual cada vez');
  assert.equal(JSON.stringify(M.mapaDesafio('COIHUE-4821')), JSON.stringify(a));
  // otros códigos, otros mapas (todos distintos entre sí en lo que se reparte)
  const codigos = [];
  for (let i = 0; i < 60; i++) codigos.push(`${PALABRAS[i % PALABRAS.length]}-${1000 + i * 37}`);
  const firmas = new Set(codigos.map((c) => JSON.stringify(M.mapaDesafio(c).sitios.map((s) => s.id))));
  assert.equal(firmas.size, codigos.length, 'cada código reparte los lugares a su manera');
  const bases = new Set(codigos.map((c) => `${M.mapaDesafio(c).base.x},${M.mapaDesafio(c).base.z}`));
  assert.ok(bases.size >= 10, `la base cambia de lugar con el código (${bases.size} lugares distintos en 60 códigos)`);
  assert.notDeepEqual(M.mapaDesafio('LENGA-12').base, M.mapaDesafio('COIHUE-4821').base);
  // lo que trae cada mapa
  for (const c of codigos) {
    const m = M.mapaDesafio(c);
    const cuenta = {};
    for (const s of m.sitios) cuenta[s.tipo] = (cuenta[s.tipo] || 0) + 1;
    for (const [tipo, r] of Object.entries(M.REPARTO)) if (tipo !== 'puesto') assert.equal(cuenta[tipo], r.cuantos, `${c}: ${r.cuantos} ${tipo}`);
    assert.equal(m.puestos.length, M.REPARTO.puesto.cuantos, `${c}: lugares para los puestos`);
    for (const s of m.sitios) {
      assert.ok(dist(s, m.base) >= M.REPARTO[s.tipo].desde, `${c}: ${s.id} no pegado a la base`);
      assert.ok(dist(s, m.base) <= 480, `${c}: ${s.id} a una distancia que se camina`);
      assert.ok(m.sitios.every((o) => o === s || dist(o, s) >= 28), `${c}: ${s.id} no se encima con otro`);
    }
    assert.ok(dist(m.nido, m.base) >= 200, `${c}: el nido lejos de la base (${Math.round(dist(m.nido, m.base))} m)`);
    assert.ok(Number.isFinite(m.rumboNave) && Number.isInteger(m.semillaClima) && m.semillaClima > 0 && m.semillaClima < 2 ** 31, `${c}: el lado de la nave y el tiempo`);
    assert.ok(Number.isFinite(m.base.yaw));
  }
  // la nave: con rumbo, siempre del mismo lado (±45°); sin rumbo, una sola tirada como antes
  const t = [0, 0.25, 0.5, 0.99];
  for (const x of t) {
    assert.equal(M.anguloDeBajada(null, () => x), x * Math.PI * 2, 'sin mapa, el mismo ángulo que antes');
    const g = M.anguloDeBajada(a, () => x);
    assert.ok(Math.abs(g - a.rumboNave) <= Math.PI / 4 + 1e-9, 'con código, del lado del código');
  }
}

// ---------------------------------------------------------------- 2. los lugares, sobre el terreno real
{
  const T = generarTerreno();
  const pend = (x, z) => T.pendiente[T.indice(x, z)];
  const ronda = (x, z, r, f) => {
    if (!f(x, z)) return false;
    for (let a = 0; a < 16; a++) for (const rr of [r * 0.33, r * 0.66, r]) if (!f(x + Math.cos(a / 16 * Math.PI * 2) * rr, z + Math.sin(a / 16 * Math.PI * 2) * rr)) return false;
    return true;
  };
  // alcanzable desde el refugio, caminando (menos que la pendiente que resbala) o nadando
  const visto = new Uint8Array(N * N);
  const cola = [T.indice(M.BASE_REFUGIO.x, M.BASE_REFUGIO.z)];
  visto[cola[0]] = 1;
  const pasa = (k) => {
    const x = (k % N) * CELDA - MITAD, z = Math.floor(k / N) * CELDA - MITAD;
    return Math.abs(x) <= LIMITE && Math.abs(z) <= LIMITE && (T.pendiente[k] < 1.0 || !!T.agua(x, z));
  };
  for (let q = 0; q < cola.length; q++) {
    const k = cola[q], i = k % N, j = Math.floor(k / N);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii > RES || jj > RES) continue;
      const kk = jj * N + ii;
      if (!visto[kk] && pasa(kk)) { visto[kk] = 1; cola.push(kk); }
    }
  }
  const lugares = Object.values(T.lugares).filter((l) => l && Number.isFinite(l.x));
  const revisar = (tipo, lista, { radio, pendMax, lejos, riel, rio }) => {
    for (const [x, z] of lista) {
      const q = `${tipo} (${x}, ${z})`;
      assert.ok(Math.abs(x) <= LIMITE - 40 && Math.abs(z) <= LIMITE - 40, `${q}: adentro del valle`);
      assert.ok(ronda(x, z, radio, (px, pz) => !T.agua(px, pz)), `${q}: en tierra firme`);
      assert.ok(ronda(x, z, radio, (px, pz) => pend(px, pz) <= pendMax), `${q}: plano`);
      assert.ok(visto[T.indice(x, z)], `${q}: se llega caminando`);
      const k = T.indice(x, z);
      assert.ok(T.distRiel[k] >= riel, `${q}: lejos de las vías`);
      assert.ok(T.distRio[k] >= rio, `${q}: lejos del arroyo`);
      for (const l of lugares) assert.ok(dist(l, { x, z }) >= lejos, `${q}: lejos de ${l.nombre}`);
    }
  };
  revisar('base', M.SITIOS.bases, { radio: 13, pendMax: 0.2, lejos: 70, riel: 20, rio: 16 });
  revisar('cantera', M.SITIOS.canteras, { radio: 4, pendMax: 0.45, lejos: 40, riel: 10, rio: 8 });
  revisar('cristal', M.SITIOS.cristales, { radio: 4, pendMax: 0.35, lejos: 40, riel: 10, rio: 8 });
  revisar('madera', M.SITIOS.maderas, { radio: 5, pendMax: 0.4, lejos: 40, riel: 10, rio: 8 });
  revisar('alijo', M.SITIOS.alijos, { radio: 3, pendMax: 0.35, lejos: 35, riel: 8, rio: 6 });
  revisar('puesto', M.SITIOS.puestos, { radio: 9, pendMax: 0.3, lejos: 60, riel: 14, rio: 10 });
  // la leña está en el bosque cerrado; los cristales, en lo abierto
  for (const [x, z] of M.SITIOS.maderas) assert.ok(T.val(T.bosque, x, z) >= 0.6, `leña (${x}, ${z}) en el bosque`);
  for (const [x, z] of M.SITIOS.cristales) assert.ok(T.val(T.bosque, x, z) <= 0.35, `cristales (${x}, ${z}) en lo abierto`);
  // la base del refugio es la puerta de siempre (estructuras.js la calcula igual)
  assert.ok(dist(M.BASE_REFUGIO, LUGARES.refugio) < 8 && !T.agua(M.BASE_REFUGIO.x, M.BASE_REFUGIO.z));
}

// ---------------------------------------------------------------- 3. sin código, todo donde estaba
{
  const m = M.mapaDesafio(null);
  assert.equal(m.base.lugar, 'refugio', 'sin código, la base es el refugio');
  assert.deepEqual([m.base.x, m.base.z, m.base.yaw], [M.BASE_REFUGIO.x, M.BASE_REFUGIO.z, M.BASE_REFUGIO.yaw]);
  assert.equal(m.nido, null, 'el nido, al azar como antes');
  assert.equal(m.rumboNave, null, 'la nave, de cualquier lado como antes');
  assert.equal(m.semillaClima, null, 'el tiempo, el de la partida como antes');
  assert.deepEqual(M.mapaDesafio(''), m);
  assert.deepEqual(M.mapaDesafio('cualquier cosa'), m, 'lo que no es un código es como no tener código');
  // una partida de antes de la 3.0, aun con código: base en el refugio, nave y nido al azar
  for (const d of [{ semilla: null }, { semilla: 'COIHUE-4821' }, { semilla: 'COIHUE-4821', mapa: { base: { x: 1, z: 2 }, usos: {}, deAntes: true } }]) {
    const v = M.mapaDePartida(R.sanearDesafio(d));
    assert.equal(v.base.lugar, 'refugio', `partida vieja ${JSON.stringify(d)}: en el refugio`);
    assert.equal(v.nido, null); assert.equal(v.rumboNave, null); assert.equal(v.semillaClima, null);
  }
  // una partida de la 3.0 recuerda su base aunque el código cambie de mapa
  const nueva = { semilla: 'LENGA-12', mapa: M.mapaGuardadoNuevo(M.mapaDesafio('LENGA-12')) };
  assert.deepEqual(M.mapaDePartida(R.sanearDesafio(nueva)).base.x, M.mapaDesafio('LENGA-12').base.x);
  assert.deepEqual(M.mapaDePartida(R.sanearDesafio(nueva)).sitios, M.mapaDesafio('LENGA-12').sitios);
  // lo guardado se sanea
  assert.equal(M.sanearMapaGuardado(null), null);
  assert.equal(M.sanearMapaGuardado({ base: { x: 'a', z: 3 } }), null);
  const g = M.sanearMapaGuardado({ base: { x: 9999, z: -3, yaw: 'x' }, usos: { 'cantera:1,2': 4.7, __proto__: { mal: 1 }, 'otra:1,2': 1, 'cristal:3,4': 'no' } });
  assert.deepEqual(g, { base: { x: LIMITE, z: -3, yaw: 0, refugio: false }, usos: { 'cantera:1,2': 4 }, deAntes: false });
  // usar un lugar: da, se agota y vuelve; el alijo, una sola vez
  const usos = {};
  const cantera = { id: 'cantera:1,2', tipo: 'cantera' }, alijo = { id: 'alijo:5,6', tipo: 'alijo' };
  assert.deepEqual(M.usarSitio(usos, cantera, 3), { ok: true, da: { piedra: 5 } });
  assert.equal(M.usarSitio(usos, cantera, 4).ok, false);
  assert.match(M.avisoSitio(usos, cantera, 4), /1 día$/);
  assert.equal(M.usarSitio(usos, cantera, 5).ok, true, 'a los dos días vuelve a dar');
  assert.equal(M.usarSitio(usos, alijo, 1).ok, true);
  assert.equal(M.usarSitio(usos, alijo, 99).ok, false, 'el alijo se abre una vez');
  assert.equal(M.avisoSitio(usos, alijo, 99), M.RECURSOS.alijo.vacio);
  const mm = M.marcasDelMapa(M.mapaDesafio('COIHUE-4821'), usos, 5);
  assert.ok(mm.some((q) => q.clase === 'base') && mm.some((q) => q.clase === 'cantera'), 'el mapa de papel muestra la base y los lugares');
  assert.ok(!M.marcasDelMapa(M.mapaDesafio(null)).some((q) => q.clase === 'base'), 'el refugio ya está en el mapa: no se marca dos veces');
  const auto = marcasAutomaticas({ desafio: { sitiosMapa: mm } });
  assert.equal(auto.length, mm.length, 'chinches.js las pasa al mapa');
  const mapaJs = leer('src/mapa.js');
  for (const clase of ['base', 'cantera', 'cristal', 'madera', 'alijo']) assert.match(mapaJs, new RegExp(`\\n  ${clase}\\(c, x, y, s\\) \\{`), `mapa.js dibuja ${clase}`);
}

// ---------------------------------------------------------------- 4. la corrida sin fin
{
  const TIPOS = new Set(Object.keys(R.TIPOS_ALIEN));
  for (let n = 1; n < R.NOCHE_FINAL; n++) for (const dif of ['tranquila', 'normal', 'implacable']) {
    assert.deepEqual(S.composicionSinFin(n, dif), R.composicionOleada(n, dif), `noche ${n} (${dif}): hasta la 19 es la campaña`);
    assert.equal(S.multiplicadorSinFin(n), R.multiplicadorNoche(n));
  }
  let antes = 0;
  const noches = [];
  for (let n = 1; n <= 400; n++) noches.push(n);
  noches.push(1000, 5000, 1e6, 1e12, Number.MAX_SAFE_INTEGER, Infinity, NaN, -5, 0, '7', null, undefined);
  for (const n of noches) for (const dif of ['tranquila', 'normal', 'implacable', 'inventada']) {
    const l = S.composicionSinFin(n, dif);
    const m = S.multiplicadorSinFin(n);
    assert.ok(Number.isFinite(m) && m >= 1, `noche ${n}: multiplicador ${m}`);
    assert.ok(m <= S.techoSinFin() + 1e-9, `noche ${n}: con techo (${m})`);
    assert.ok(l.length >= 2 && l.length <= S.SIN_FIN.topeInvasores, `noche ${n} (${dif}): ${l.length} invasores`);
    assert.ok(l.every((t) => TIPOS.has(t)), `noche ${n}: sólo invasores que existen`);
    assert.ok(l.filter((t) => t === 'jefe').length <= 1, 'nunca dos jefes');
    if (l.includes('jefe')) assert.equal(l[l.length - 1], 'jefe', 'el jefe va último');
    assert.ok(l.filter((t) => t === 'rastreador' || t === 'saltador').length >= 2 || Number(n) < R.NOCHE_FINAL, `noche ${n}: siempre quedan rápidos`);
    if (dif === 'normal' && typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 400) {
      assert.ok(m >= antes - 1e-12, `noche ${n}: la dureza no baja`);
      antes = m;
    }
  }
  // más allá de la veinte sigue subiendo, pero se aplana
  assert.ok(S.multiplicadorSinFin(40) > S.multiplicadorSinFin(21) && S.multiplicadorSinFin(80) > S.multiplicadorSinFin(40));
  assert.ok(S.multiplicadorSinFin(200) - S.multiplicadorSinFin(100) < S.multiplicadorSinFin(40) - S.multiplicadorSinFin(20), 'crece cada vez menos');
  assert.ok(S.composicionSinFin(40).length > S.composicionSinFin(20).length - 1, 'vienen más');
  const pesados = (l) => l.filter((t) => ['bruto', 'escupidor', 'excavador', 'volador'].includes(t)).length;
  assert.ok(pesados(S.composicionSinFin(45)) > pesados(S.composicionSinFin(21)), 'y más pesados');
  // pareja: la tranquila nunca trae más que la normal, ni la normal más que la implacable
  for (let n = 20; n <= 120; n += 7) {
    assert.ok(S.composicionSinFin(n, 'tranquila').length <= S.composicionSinFin(n, 'normal').length);
    assert.ok(S.composicionSinFin(n, 'normal').length <= S.composicionSinFin(n, 'implacable').length);
  }
  // el jefe sigue bajando cada cinco noches, sin final
  for (const n of [20, 25, 50, 105]) assert.ok(S.composicionSinFin(n).includes('jefe'), `noche ${n}: jefe`);
  for (const n of [21, 33, 99]) assert.ok(!S.composicionSinFin(n).includes('jefe'));
  // noches especiales: después de la 20 siguen saliendo, nunca dos seguidas ni con el jefe
  const cuenta = {};
  for (let i = 0; i < 1000; i++) { const e = S.especialSinFin(41, i / 1000, null); cuenta[e] = (cuenta[e] || 0) + 1; }
  for (const k of ['roja', 'eclipse', 'silenciosa', 'apagon']) assert.ok(cuenta[k] > 50, `la ${k} sale en la corrida larga`);
  assert.ok(cuenta.null > 350, 'y la mayoría son comunes');
  assert.equal(S.especialSinFin(41, 0.01, 'roja'), null);
  assert.equal(S.especialSinFin(45, 0.01, null), null, 'con el jefe no');
  assert.equal(S.especialSinFin(3, 0.01, null), null);
  assert.equal(R.nocheEspecial(25, 0.01, null), null, 'en la campaña no hay especiales después de la final');
  for (let n = 4; n < 20; n++) for (const a of [0.01, 0.2, 0.31, 0.37, 0.5]) assert.equal(S.especialSinFin(n, a, null), R.nocheEspecial(n, a, null), `noche ${n}: antes de la 20, las mismas especiales`);
  for (const a of [NaN, -1, 2, 'x']) assert.ok(S.especialSinFin(30, a, null) === null || Object.hasOwn(R.ESPECIALES, S.especialSinFin(30, a, null)));
  // el pronóstico de la estación también sabe que no hay final
  const d = { oleadas: 19, sinFin: { terminada: false }, especial: null, especialAnterior: null, oleadaNoche: null };
  assert.ok(nochesQueVienen(d, { semilla: 5 }, 10, 12, 3).every((q) => q.tipo !== 'final'), 'sin nave nodriza');
  assert.equal(nochesQueVienen({ ...d, sinFin: null }, { semilla: 5 }, 10, 12, 1)[0].tipo, 'final', 'la campaña sí la tiene');
}

// ---------------------------------------------------------------- 5. los récords
{
  assert.deepEqual(S.sanearRecordsSinFin(null), { general: [], porCodigo: {} });
  assert.deepEqual(S.sanearRecordsSinFin('basura'), { general: [], porCodigo: {} });
  assert.deepEqual(S.sanearRecordsSinFin([1, 2]), { general: [], porCodigo: {} });
  const sucio = JSON.parse(`{"general":[{"noches":"5","abatidos":-3,"fecha":"hoy","codigo":"lenga 12","dificultad":"imposible"},null,7,{"noches":1e99,"abatidos":2,"fecha":"2026-09-29"},{"noches":NaN}],
    "porCodigo":{"__proto__":[{"noches":9}],"no es":[{"noches":1}],"COIHUE-1":[{"noches":2}],"PUDU-3":"x","constructor":[{"noches":4}]}}`.replace('NaN', '"NaN"'));
  const s = S.sanearRecordsSinFin(sucio);
  assert.deepEqual(s.general[0], { noches: 1e6, abatidos: 2, fecha: '2026-09-29', codigo: null, dificultad: 'normal' }, 'números con techo');
  assert.deepEqual(s.general[1], { noches: 5, abatidos: 0, fecha: '', codigo: 'LENGA-12', dificultad: 'normal' }, 'lo raro se limpia');
  assert.equal(s.general.length, 3);
  assert.deepEqual(Object.keys(s.porCodigo), ['COIHUE-1'], 'sólo códigos de verdad, sin __proto__ ni constructor');
  assert.equal(Object.getPrototypeOf(s.porCodigo), Object.prototype);
  // diez por lista, ordenados; y la lista de cada código
  let r = {};
  const puestos = [];
  for (let i = 0; i < 25; i++) {
    const x = S.registrarCorrida(r, { noches: i % 7, abatidos: i, fecha: `2026-09-${String(1 + i).padStart(2, '0')}`, codigo: i % 2 ? 'LENGA-12' : 'COIHUE-4821', dificultad: 'normal' });
    r = x.records; puestos.push(x.puesto);
  }
  assert.equal(r.general.length, 10);
  assert.ok(r.general.every((q, i) => i === 0 || S.comparar(r.general[i - 1], q) <= 0), 'de mejor a peor');
  assert.equal(r.general[0].noches, 6);
  assert.deepEqual(Object.keys(r.porCodigo).sort(), ['COIHUE-4821', 'LENGA-12']);
  assert.ok(S.listaDeCodigo(r, 'lenga 12').every((q) => q.codigo === 'LENGA-12'));
  assert.equal(S.listaDeCodigo(r, 'toString').length, 0);
  assert.equal(S.registrarCorrida(r, { noches: 0, abatidos: 0, fecha: '2026-10-01' }).puesto, 0, 'una corrida floja no entra');
  assert.equal(S.registrarCorrida(r, { noches: 99, abatidos: 0, fecha: '2026-10-01', codigo: 'PUDU-3' }).puesto, 1, 'la mejor queda primera');
  const antes = JSON.stringify(r);
  S.registrarCorrida(r, { noches: 50 });
  assert.equal(JSON.stringify(r), antes, 'registrar no cambia lo que le pasan');
  // no crece sin fin: 60 códigos como mucho
  let muchos = {};
  for (let i = 0; i < 80; i++) muchos = S.registrarCorrida(muchos, { noches: 1, codigo: `LAGO-${i}`, fecha: '2026-09-29' }).records;
  assert.equal(Object.keys(muchos.porCodigo).length, S.SIN_FIN.topeCodigos);
  assert.ok(Object.hasOwn(muchos.porCodigo, 'LAGO-79') && !Object.hasOwn(muchos.porCodigo, 'LAGO-0'), 'se van los más viejos');
  assert.deepEqual(S.sanearRecordsSinFin(JSON.parse(JSON.stringify(muchos))), muchos, 'ida y vuelta por JSON');
  const t = S.resumenCorrida({ noches: 1, abatidos: 1, codigo: 'LENGA-12', puesto: 3, puestoCodigo: 1 });
  assert.equal(t.titulo, 'Resististe 1 noche');
  assert.match(t.lugar, /3\.ª/); assert.match(t.lugar, /mejor corrida con este código/);
}

// ---------------------------------------------------------------- 6. la corrida guarda aparte
{
  assert.equal(G.RANURA_SIN_FIN, 'sinfin');
  // una campaña en la ranura 1 del Desafío
  G.usarModoGuardado('desafio', 1);
  const campana = { ...G.progresoNuevo(), dia: 9 };
  campana.desafio.noches = 8; campana.desafio.semilla = 'COIHUE-4821';
  assert.ok(G.guardarProgreso(campana));
  const textoCampana = almacen.get('hojarasca-desafio-v1');
  // la corrida
  G.usarModoGuardado('desafio', G.RANURA_SIN_FIN);
  assert.equal(G.ranuraActual(), 'sinfin');
  const corrida = G.progresoNuevo();
  corrida.desafio.sinFin = S.corridaNueva();
  corrida.desafio.mapa = M.mapaGuardadoNuevo(M.mapaDesafio('LENGA-12'));
  corrida.desafio.noches = 3;
  assert.ok(G.guardarProgreso(corrida));
  assert.ok(almacen.has('hojarasca-desafio-sinfin-v1'), 'la corrida tiene su clave');
  assert.equal(almacen.get('hojarasca-desafio-v1'), textoCampana, 'la campaña no se tocó');
  const cargada = G.cargarProgreso();
  assert.deepEqual(cargada.desafio.sinFin, { terminada: false, dificultad: null }, 'la corrida sabe que es corrida');   // 3.8.4: y su dificultad (se fija al entrar)
  assert.equal(cargada.desafio.mapa.base.x, M.mapaDesafio('LENGA-12').base.x, 'y dónde arrancó');
  G.borrarProgreso();
  assert.ok(!almacen.has('hojarasca-desafio-sinfin-v1') && almacen.get('hojarasca-desafio-v1') === textoCampana, 'borrar la corrida no borra la campaña');
  // la ranura sin fin es sólo del Desafío y no aparece en el menú de partidas
  G.usarModoGuardado('relax', G.RANURA_SIN_FIN);
  assert.equal(G.ranuraActual(), 1);
  assert.deepEqual(G.listaPartidas('desafio').map((q) => q.ranura), [1, 2, 3]);
  G.usarModoGuardado('desafio', 1);
  assert.equal(G.cargarProgreso().desafio.sinFin, null, 'la campaña no es corrida');
  assert.equal(G.cargarProgreso().desafio.noches, 8);
  // una partida vieja (sin los campos nuevos) carga igual
  const vieja = R.sanearDesafio({ noches: 4, semilla: 'COIHUE-4821', oleadas: 4 });
  assert.equal(vieja.sinFin, null); assert.equal(vieja.mapa, null); assert.equal(vieja.noches, 4);
  // el ajuste
  assert.equal(G.cargarAjustes().desafioTipo, 'campana');
  G.guardarAjustes({ ...G.cargarAjustes(), desafioTipo: 'sinfin' });
  assert.equal(G.cargarAjustes().desafioTipo, 'sinfin');
  G.guardarAjustes({ ...G.cargarAjustes(), desafioTipo: 'otra' });
  assert.equal(G.cargarAjustes().desafioTipo, 'campana');
}

// ---------------------------------------------------------------- 7. enganchado en el juego
{
  const main = leer('src/main.js');
  const des = leer('src/desafio.js');
  const i0 = main.indexOf('usarModoGuardado(ajustes.modo, ajustes.ranura)');
  const i1 = main.indexOf("if (esSinFin) usarModoGuardado('desafio', RANURA_SIN_FIN);");
  assert.ok(i0 > 0 && i1 > i0 && i1 < main.indexOf('cargarProgreso()'), 'la ranura de la corrida se elige antes de cargar');
  assert.match(main, /if \(esSinFin\) \{ terminarCorrida\(\); return; \}/, 'caer termina la corrida');
  assert.match(main, /function copiarASync\(forzar = false, ya = false\) \{\n  if \(esSinFin\) return false;/, 'la corrida no se sincroniza');
  assert.match(main, /if \(esSinFin\) ajustes\.desafioTipo = 'campana';/, 'elegir una partida vuelve a la campaña');
  assert.match(main, /empezarMapaDesafio\(\);   \/\/ 3\.0/, 'al entrar se arma el mapa');
  assert.match(main, /\|\| p\?\.desafio\?\.semilla \|\| \(esSinFin \? codigoAlAzar\(\) : codigoAlAzarEnElRefugio\(\) \|\| codigoAlAzar\(\)\);/, 'sin código, uno al azar (la campaña, en el refugio)');
  for (let i = 0; i < 20; i++) {
    const c = M.codigoAlAzarEnElRefugio();
    assert.ok(/^[A-Z]+-\d{4}$/.test(c) && M.mapaDesafio(c).base.lugar === 'refugio', `${c}: la campaña sin código arranca en el refugio`);
  }
  assert.match(des, /const esNocheFinal = \(\) => \{ const d = D\(\); return !d\.victoria && !d\.sinFin && /, 'sin noche final');
  assert.equal((des.match(/d\.sinFin \? composicionSinFin\(/g) || []).length, 3, 'la noche, la retomada y los refuerzos escalan en la corrida');
  assert.match(des, /D\(\)\.sinFin \? multiplicadorSinFin\(D\(\)\.oleadas\) : multiplicadorNoche\(D\(\)\.oleadas\)/);
  assert.match(des, /if \(d\.sinFin\) return;   \/\/ 3\.0: la corrida sin fin tiene sus propios récords/, 'la corrida no ensucia los récords de la campaña');
  assert.match(des, /const a = anguloDeBajada\(mapaMundo\.mapa, azar\), r = 72 \+ azar\(\) \* 26;/);
  assert.match(des, /fortin\.usarCerca\(pos, deNoche\(\), dPuerta\) \|\| mapaMundo\.usarCerca\(pos\),/);
  assert.match(des, /fortin\.avisoCerca\(pos, deNoche\(\), dPuerta\) \|\| mapaMundo\.avisoCerca\(pos\),/, 'el aviso y la tecla en el mismo orden');
  const html = leer('src/plantilla.html');
  for (const id of ['corrida', 'corrida-titulo', 'corrida-sub', 'corrida-lugar', 'corrida-records', 'corrida-otra', 'corrida-repetir', 'corrida-portada', 'desafio-tipo-texto']) assert.ok(html.includes(`id="${id}"`), `falta #${id}`);
  assert.ok(html.includes('data-ajuste="desafioTipo"'));
  // los módulos puros no traen three ni DOM, y lo exportado no lleva eñe
  for (const f of ['src/desafio-mapa.js', 'src/desafio-supervivencia.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
    for (const m of t.matchAll(/^export (?:const|function) ([^\s(=]+)/gm)) assert.match(m[1], /^[\w$]+$/, `${f}: ${m[1]}`);
  }
}

console.log('3.0 supervivencia y mapa: ok · mismo código, mismo mapa · lugares sobre el terreno real · sin código, lo de siempre · la corrida escala con techo · récords saneados · guarda aparte');
