// 4.25.0 (A): la caza de bugs de lo nuevo (de la 4.19.0 a la 4.24.1): guardado y migración, economía, mapa, perillas del Desafío y logros de la Historia.
// Cada sección es un barrido hecho para ENCONTRAR fallas (partidas viejas armadas con el código de la 4.18.4 y de la 4.22.0, partidas rotas a propósito, miles de
// operaciones del puesto de la trochita, todas las perillas…); lo que se encontró y se arregló lleva su mutación: la misma prueba sobre una copia de src/ con el
// arreglo deshecho tiene que fallar (cada mutación corre en su proceso, porque el caché de ESM engaña si no).
// Uso: node pruebas/verificar-4-25-0-a.mjs      (A4250_SECCIONES=guardado,economia,... para correr sólo algunas)
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4250_SRC || join(raiz, 'src');
const HIJO = !!process.env.A4250_SRC;
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const SEC = process.env.A4250_SECCIONES ? new Set(process.env.A4250_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4250_CALLADO) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t}: ${JSON.stringify(a)} y ${JSON.stringify(b)}`);
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);

// un localStorage de mentira, el mismo para todo
const datos = new Map();
globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k), clear: () => datos.clear() };
let s = 4250;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
const uno = (l) => l[Math.floor(azar() * l.length)];
const sinSellos = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.guardadoEn; delete c.secuencia; return c; };

// ================================================================ 1. guardado: partidas viejas y partidas rotas
if (va('guardado')) {
  const G = await imp('guardado.js');
  G.usarModoGuardado('relax', 1);
  const cargarTexto = (txt) => { datos.clear(); datos.set('hojarasca-v1', txt); return G.cargarProgreso(); };
  // 1a. partidas armadas por el código de la 4.18.4 y de la 4.22.0 (jugando el capítulo 6, con plata, fletes, existencias del puesto, una cabaña alquilada y el puesto de la feria)
  for (const [ver, archivo] of [['4.18.4', 'partida-4-18-4.json'], ['4.22.0', 'partida-4-22-0.json']]) {
    const txt = readFileSync(join(raiz, 'pruebas', 'datos-4-25-0-a', archivo), 'utf8');
    const v = JSON.parse(txt);
    const c = cargarTexto(txt);
    ok(c && G.origenUltimaCarga() === 'principal', `${ver}: carga`);
    ok(c.economia.pesos === 5400 && c.economia.libro.length === 1, `${ver}: la plata y el libro vuelven`);
    ok(c.dia === 41 && c.historia.capitulo === v.historia.capitulo && c.historia.fase === v.historia.fase, `${ver}: el día y el capítulo de la Historia vuelven`);
    igual(Object.keys(c.historia.escenas.vistas), Object.keys(v.historia.escenas.vistas), `${ver}: las escenas vistas vuelven`);
    igual(c.historia.cerrados, v.historia.cerrados, `${ver}: los capítulos cerrados vuelven`);
    igual(c.historia.lazos, v.historia.lazos, `${ver}: los lazos vuelven`);
    ok(c.historia.arranqueNuevo === (ver === '4.22.0'), `${ver}: la Historia de antes de la 4.21.0 conserva su estación (arranqueNuevo falso) y la de después trae la propia (verdadero)`);
    const f = c.comercio.fletes[0];
    ok(f && Number.isInteger(f.premio.pesos) && f.premio.pesos % 100 === 0 && f.premio.yerba === undefined, `${ver}: el flete en curso paga en pesos redondos (${JSON.stringify(f?.premio)})`);
    ok(ver === '4.18.4' ? f.premio.pesos === 1200 : f.premio.pesos === 800 && f.premio.material.n === 4, `${ver}: y lo que prometía (${JSON.stringify(f?.premio)})`);
    igual(c.comercio.hoy.tomados, v.comercio.hoy.tomados, `${ver}: lo tomado hoy vuelve`);
    ok(Object.keys(c.comercio.mercado).length === 2 && c.comercio.mercado['Parada del Molino'].caja === v.comercio.mercado['Parada del Molino'].caja, `${ver}: los dos puestos con su caja`);
    ok(c.negocios.casas.alquiladas['cabana-piedra'].cuantas === 1 && c.negocios.casas.puesto.stock.poncho === 2, `${ver}: la cabaña alquilada y el puesto de la feria vuelven`);
    // guardar y volver a abrir no cambia nada más (y lo guardado vuelve igual una segunda vez)
    const antes = sinSellos(c);
    ok(G.guardarProgreso(c) === true, `${ver}: guarda`);
    const c2 = G.cargarProgreso();
    igual(sinSellos(c2), antes, `${ver}: guardar y abrir deja la partida igual`);
    ok(c2.versionJuego !== undefined, `${ver}: sabe con qué versión se guardó`);
    // los puestos de la trochita traen existencias de todo lo que hoy se vende (lo de la granja que la partida vieja no conocía arranca en su nivel de siempre)
    const M = await imp('mercado.js'), C = await imp('comercio.js');
    const t = M.tienda(c2.comercio, 'Estación del Valle', 41);
    ok(C.bienesDe('Estación del Valle').every((b) => Number.isInteger(t.stock[b]) && t.stock[b] >= 0 && t.stock[b] <= 14), `${ver}: el puesto tiene existencias enteras de todo lo que vende (${JSON.stringify(t.stock)})`);
    ok(t.stock['carne-vaca'] === M.nivelBase('Estación del Valle', 'carne-vaca') || t.stock['carne-vaca'] >= 0, `${ver}: lo nuevo (carne de vaca) arranca en su nivel`);
  }
  // 1b. partidas rotas: lo hostil no tira ni se pierde la partida, y lo guardado vuelve igual (sin tocar la base de un lugar a otro)
  {
    const base = JSON.parse(readFileSync(join(raiz, 'pruebas', 'datos-4-25-0-a', 'partida-4-22-0.json'), 'utf8'));
    const RAROS = [null, 'x', '', -1, 0, 1e308, -1e308, 0.5, true, false, [], {}, [null, 'x', -5, { a: 1 }], { x: 'a', z: null }, 'NaN', 9e15, '__proto__', 'constructor'];
    const camino = (o, pref = []) => { const r = []; if (o && typeof o === 'object') for (const k of Object.keys(o)) { r.push([...pref, k]); r.push(...camino(o[k], [...pref, k])); } return r; };
    const rutas = camino(base);
    let tiran = 0, nulas = 0, noIdem = 0, sinSerializar = 0;
    const ejemplos = [];
    for (let i = 0; i < 900; i++) {
      const p = JSON.parse(JSON.stringify(base));
      const desc = [];
      for (let j = 0, k = 1 + Math.floor(azar() * 3); j < k; j++) {
        const r = uno(rutas); let o = p, bien = true;
        for (let q = 0; q < r.length - 1; q++) { o = o?.[r[q]]; if (!o || typeof o !== 'object') { bien = false; break; } }
        if (!bien) continue;
        const v = uno(RAROS), borra = azar() < 0.15;
        if (borra) delete o[r.at(-1)]; else o[r.at(-1)] = JSON.parse(JSON.stringify(v));
        desc.push(`${r.join('.')}=${borra ? 'DEL' : JSON.stringify(v)}`);
      }
      let c;
      try { c = cargarTexto(JSON.stringify(p)); } catch (e) { tiran++; if (ejemplos.length < 3) ejemplos.push(`tira: ${desc.join('; ')}`); continue; }
      if (!c) { nulas++; if (ejemplos.length < 3) ejemplos.push(`nula: ${desc.join('; ')}`); continue; }
      let t1;
      try { t1 = JSON.stringify(c); } catch { sinSerializar++; continue; }
      datos.clear(); datos.set('hojarasca-v1', t1);
      const c2 = G.cargarProgreso();
      if (!c2 || JSON.stringify(sinSellos(c2)) !== JSON.stringify(sinSellos(c))) { noIdem++; if (ejemplos.length < 3) ejemplos.push(`no idempotente: ${desc.join('; ')}`); }
    }
    ok(tiran === 0 && nulas === 0 && noIdem === 0 && sinSerializar === 0, `900 partidas rotas: ninguna tira (${tiran}), ninguna se pierde (${nulas}), todas vuelven igual (${noIdem} no), todas se serializan (${sinSerializar} no) ${ejemplos.join(' | ')}`);
  }
  // 1b bis. las libretas nuevas son las mismas que las guardadas y vueltas a abrir (la cantina y la casa de té traían un `mate` de menos)
  {
    const CA = await imp('cantina.js');
    igual(CA.sanearCantina(CA.cantinaNueva(), 5), CA.cantinaNueva(), 'una libreta nueva, guardada y vuelta a abrir, es la misma');
    const nueva = G.progresoNuevo();
    igual(CA.sanearCantina(JSON.parse(JSON.stringify(nueva.cantina)), 1), nueva.cantina, 'y la de una partida nueva también');
  }
  // 1c. los ajustes: lo hostil de cada clave vuelve del tipo de siempre (y las perillas, de −2 a +2)
  {
    const base = G.AJUSTES_BASE, RAROS = [null, 'x', '', -1, 0, 1, 2, 3, -3, 1e308, 0.5, true, false, [], {}, [1], 'NaN', '-2', ' 2 ', 9e15, '+2', '−2', 'Infinity'];
    let malos = 0, ejemplo = '';
    for (const k of Object.keys(base)) for (const v of RAROS) {
      datos.clear(); datos.set('hojarasca-ajustes-v1', JSON.stringify({ ...base, [k]: v }));
      let a;
      try { a = G.cargarAjustes(); } catch (e) { malos++; ejemplo = `${k}=${JSON.stringify(v)} tira`; continue; }
      if (a === null || typeof a !== 'object') { malos++; ejemplo = `${k}: no vuelve un objeto`; continue; }
      if (/^perilla/.test(k) && !(Number.isInteger(a[k]) && a[k] >= -2 && a[k] <= 2 && !Object.is(a[k], -0))) { malos++; ejemplo = `${k}=${JSON.stringify(v)} -> ${a[k]}`; }
    }
    ok(malos === 0, `los ajustes hostiles se sanean (${malos} malos: ${ejemplo})`);
  }
}

// ================================================================ 2. economía: el puesto de la trochita
if (va('economia')) {
  const CM = await imp('comercio-mundo.js'), C = await imp('comercio.js'), MER = await imp('mercado.js'), E = await imp('economia.js');
  const NOMBRES = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes', 'Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur'];
  const paradas = NOMBRES.map((nombre) => ({ nombre }));
  let P, dia = 1, temporada = 'verano', furg = null;
  const ctx = { panel: null, tablero: null, tren: { paradas, conduciendo: () => false }, progreso: () => P, dia: () => dia, temporada: () => temporada, nota() {}, sonido: null, guardar() {}, refrescar() {}, T_: (t) => t, furgon: () => furg };
  const puesto = CM.crearPuestoDeCargas(ctx);
  const nueva = () => { P = { modo: 'relax', dia: 1, economia: E.economiaNueva(), comercio: C.comercioNuevo(), cosas: {}, materiales: {}, entradas: {}, obras: [] }; dia = 1; };
  const BI = Object.keys(C.BIENES);
  const dar = (b, cant, conEntrada = true) => { const d = C.BIENES[b].donde; if (d === 'material') P.materiales[b] = cant; else if (d === 'cosa') P.cosas[b] = cant; else if (conEntrada) P.entradas[b] = { cantidad: cant }; else delete P.entradas[b]; };
  // 2a. comprar y vender en el mismo andén nunca deja ganancia (en cualquier parada, día, estación y existencias; también vender y volver a comprar)
  {
    let casos = 0, ganan = 0, peor = '';
    for (const par of paradas) for (let d = 1; d <= 100; d += 11) for (const t of ['verano', 'otono', 'invierno']) for (const b of C.bienesDe(par.nombre)) for (const orden of ['cv', 'vc']) for (const st of [0, 1, 2, 5, 14]) {
      dia = d; temporada = t; nueva(); P.dia = d; P.economia.pesos = 1e6;
      const bien = C.BIENES[b], lote = bien.lote;
      dar(b, lote * 5);
      P.comercio = C.comercioDeHoy(P.comercio, d);
      const m = MER.tienda(P.comercio, par.nombre, d); m.stock[b] = st; m.caja = 1e6;
      const fila = (modo) => { puesto.abrir(par, modo); return puesto.filas().findIndex((x) => x.bien === b); };
      const hacer = (modo) => { const i = fila(modo); if (i >= 0) puesto.elegir(i); };
      const p0 = P.economia.pesos;
      if (orden === 'cv') { hacer('comprar'); hacer('vender'); } else { hacer('vender'); hacer('comprar'); }
      const inv = bien.donde === 'material' ? P.materiales[b] : bien.donde === 'cosa' ? P.cosas[b] : P.entradas[b].cantidad;
      casos++;
      if (inv === lote * 5 && P.economia.pesos > p0) { ganan++; peor = `${par.nombre} ${b} día ${d} ${t} ${orden} stock ${st}: +$${P.economia.pesos - p0}`; }
    }
    ok(casos > 20000 && ganan === 0, `ir y venir en el mismo andén nunca gana (${casos} casos, ${ganan} con ganancia: ${peor})`);
  }
  // 2b. miles de operaciones al azar: la plata, lo que llevás y las existencias y cajas de los puestos siempre enteros y sin pasarse; el comercio guardado y vuelto a abrir queda igual
  {
    nueva();
    const malos = new Map(); const mal = (k, d) => { if (!malos.has(k)) malos.set(k, d); };
    const invariantes = (donde) => {
      const e = P.economia;
      if (!Number.isInteger(e.pesos) || e.pesos < 0 || e.pesos > E.MAX_PESOS) mal('pesos', `${e.pesos} ${donde}`);
      for (const [k, v] of Object.entries(P.materiales)) if (!Number.isInteger(v) || v < 0) mal('material', `${k}=${v} ${donde}`);
      for (const [k, v] of Object.entries(P.cosas)) if (!Number.isInteger(v) || v < 0) mal('cosa', `${k}=${v} ${donde}`);
      for (const [k, v] of Object.entries(P.entradas)) if (!Number.isInteger(v.cantidad) || v.cantidad < 0) mal('entrada', `${k}=${JSON.stringify(v)} ${donde}`);
      for (const [nom, t] of Object.entries(P.comercio.mercado || {})) {
        if (!Number.isInteger(t.caja) || t.caja < 0) mal('caja', `${nom}: ${t.caja} ${donde}`);
        for (const [b, q] of Object.entries(t.stock)) if (!Number.isInteger(q) || q < 0 || q > 30) mal('stock', `${nom}/${b}=${q} ${donde}`);
      }
      for (const f of P.comercio.fletes) {
        if (!Number.isInteger(f.premio.pesos) || f.premio.pesos < 0 || f.premio.pesos % 100) mal('premio de flete', JSON.stringify(f.premio));
        if (f.desde === f.hasta) mal('flete a sí mismo', JSON.stringify(f));
      }
      if (P.comercio.fletes.length > C.COMERCIO.fletesConFurgon) mal('demasiados fletes', String(P.comercio.fletes.length));
    };
    let compras = 0, ventas = 0, fletesTomados = 0, entregados = 0;
    for (let ronda = 0; ronda < 160; ronda++) {
      if (azar() < 0.1) nueva();
      for (const b of BI) dar(b, uno([0, 0, 1, 3, 8, 40, 200]), azar() < 0.8);
      P.economia.pesos = uno([0, 50, 400, 3000, 20000, 1e6, E.MAX_PESOS - 100]);
      for (let paso = 0; paso < 100; paso++) {
        const x = azar();
        if (x < 0.1) dia += uno([0, 1, 1, 2, 5, 40, 400]);
        else if (x < 0.15) temporada = uno(['verano', 'otono', 'invierno', 'raro', null]);
        else if (x < 0.2) furg = uno([null, { extra: 2, aLaVez: 5 }]);
        else if (x < 0.25) { const t0 = JSON.stringify(P.comercio); P.comercio = C.sanearComercio(JSON.parse(t0)); if (JSON.stringify(P.comercio) !== t0) mal('comercio no idempotente', Object.keys(JSON.parse(t0)).join()); }
        else if (x < 0.3) { P.comercio = C.comercioDeHoy(P.comercio, dia); const m = MER.tienda(P.comercio, uno(NOMBRES), dia); const b = uno(Object.keys(m.stock)); m.stock[b] = uno([0, 0, 1, 14, 30]); m.caja = uno([0, 10, 5000, 1e7]); }
        else {
          const par = uno(paradas), modo = uno(['comprar', 'vender', 'fletes']);
          puesto.abrir(par, modo);
          for (let k = 0; k < 4; k++) {
            const filas = puesto.filas(); if (!filas.length) break;
            const p0 = P.economia.pesos, f0 = P.comercio.fletes.length;
            puesto.elegir(Math.floor(azar() * (filas.length + 1)));
            if (modo === 'comprar' && P.economia.pesos < p0) compras++;
            if (modo === 'vender' && P.economia.pesos > p0) ventas++;
            if (modo === 'fletes' && P.comercio.fletes.length > f0) fletesTomados++;
            if (azar() < 0.15) entregados += puesto.llegar(uno(paradas)).length;
          }
          puesto.cerrar();
        }
        invariantes(`ronda ${ronda} paso ${paso}`);
      }
    }
    ok(malos.size === 0, `la economía del puesto aguanta el azar: ${[...malos].map(([k, v]) => k + ': ' + v).join(' | ')}`);
    ok(compras > 500 && ventas > 500 && fletesTomados > 50 && entregados > 20, `y se compró, vendió, tomó y entregó de verdad (${compras} compras, ${ventas} ventas, ${fletesTomados} fletes tomados, ${entregados} entregados)`);
  }
  // 2c. el flete: la fórmula entera de la 4.21.0 en todas las paradas y días (siempre pesos redondos, de $200 a $1.400, nunca a la misma parada)
  {
    const lista = NOMBRES.slice(0, 11);
    let raros = 0, min = 1e9, max = 0;
    for (let d = 1; d <= 400; d++) for (const desde of lista) for (const extra of [0, 2]) for (const f of C.fletesDelDia(d, lista, desde, extra)) {
      const p = f.premio.pesos;
      if (!Number.isInteger(p) || p % 100 || f.desde === f.hasta || f.cuantos < 1) raros++;
      min = Math.min(min, p); max = Math.max(max, p);
    }
    ok(raros === 0 && min >= 200 && max <= 1400, `los fletes de 400 días: pesos redondos de $${min} a $${max} (${raros} raros)`);
  }
}

// ================================================================ 3. Desafío: las perillas y lo que cuesta caer
if (va('perillas')) {
  const R = await imp('desafio-reglas.js'), P = await imp('desafio-perillas.js');
  let casos = 0, raros = 0, ejemplo = '';
  for (let c = -2; c <= 2; c++) for (let v = -2; v <= 2; v++) for (let d = -2; d <= 2; d++) {
    R.fijarPerillas({ cantidad: c, vida: v, dano: d });
    for (const dif of ['tranquila', 'normal', 'implacable', 'rara']) {
      const D = R.dificultad(dif);
      if (![D.cantidad, D.dano, D.vida].every((x) => Number.isFinite(x) && x > 0)) { raros++; ejemplo = `dificultad ${c},${v},${d},${dif}`; }
      for (let noche = 1; noche <= 40; noche += 3) for (const vuelta of [0, 1, 5, 30]) {
        casos++;
        const l = R.composicionOleada(noche, dif, vuelta);
        if (!Array.isArray(l) || l.length < 2 || l.some((x) => typeof x !== 'string') || R.sinJefe(l).length > 80) { raros++; ejemplo = `oleada ${c},${v},${d},${dif},${noche},${vuelta}`; }
      }
    }
  }
  R.fijarPerillas(null);
  ok(raros === 0, `las 125 combinaciones de perillas con todas las dificultades y noches dan oleadas sanas (${casos} casos, ${raros} raros: ${ejemplo})`);
  for (const x of [NaN, -5, 0, 0.4, 1, 1.9, 10, 40, 1e9, Infinity, '7', null, undefined]) for (const dif of ['tranquila', 'normal', 'implacable', undefined]) {
    const c = P.castigoDeCaer(x, dif);
    ok(c.materiales >= 0.2 && c.materiales <= 0.4 && c.cristalesQueQuedan >= 0 && c.cristalesQueQuedan <= 0.25, `castigo sano con noche ${x} y ${dif}`);
    const M = { tronco: 10, tabla: 3, piedra: 1, cristal: 7 }; P.aplicarCastigo(M, c);
    ok(Object.values(M).every((q) => Number.isInteger(q) && q >= 0), `lo que queda después de caer son enteros (noche ${x}, ${dif})`);
  }
  igual([P.castigoDeCaer(10).materiales, P.castigoDeCaer(1).materiales, P.castigoDeCaer(40).materiales], [0.3, 0.21, 0.4], 'el castigo crece con la noche: 21 %, 30 % (noche 10, como antes) y 40 % de tope');
  igual([P.castigoDeCaer(5, 'tranquila').cristalesQueQuedan, P.castigoDeCaer(5, 'normal').cristalesQueQuedan], [0.25, 0], 'sólo en Tranquila queda un cuarto de las semillas');
}

// ================================================================ 4. logros de la Historia: una sola vez y no se pierden
if (va('logros')) {
  const LR = await imp('logros-relax.js'), LH = await imp('logros-historia.js'), H = await imp('historia.js');
  const almacen = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
  // todos los `cumple` aguantan una partida vacía o rara sin tirar
  for (const raro of [null, undefined, {}, { historia: null }, { historia: {} }, { historia: { version: 2 } }, { historia: { version: 2, cerrados: 'x', raro: 5, optativas: [], duendes: { armas: 3 }, decisiones: null } }, { historia: 'x' }]) {
    for (const l of LR.LOGROS_RELAX) { let r; try { r = l.cumple(raro); } catch (e) { r = 'tira ' + e.message; } ok(typeof r === 'boolean', `${l.id} aguanta ${JSON.stringify(raro)?.slice(0, 40)} (${r})`); }
  }
  // jugar la historia con el jugador de mentira: cada logro se otorga una vez, nunca antes del capítulo que corresponde, y sobrevive a «recargar»
  const { jugar } = await import(pathToFileURL(join(raiz, 'pruebas', 'ayuda-4-18-4-historia.mjs')).href);
  const alm = almacen();
  let L = LR.crearLogrosRelax(alm, 'hojarasca-logros-relax-v1', () => '2026-11-03T12:00:00.000Z');
  const otorgados = [];
  const r = jugar(7, { alPaso: (h, P, paso) => {
    if (paso % 20) return;
    for (const l of L.revisar(P)) otorgados.push(l.id);
    if (paso % 400 === 0) L = LR.crearLogrosRelax(alm, 'hojarasca-logros-relax-v1', () => '2026-11-03T12:00:00.000Z');   // «recargar»: la libreta vuelve del almacén
  } });
  ok(r.fin === true, 'el jugador de mentira termina la historia');
  for (const l of L.revisar(r.S.P)) otorgados.push(l.id);
  ok(new Set(otorgados).size === otorgados.length, `ningún logro se otorgó dos veces (${otorgados.length})`);
  ok(otorgados.includes('historia-verano') && otorgados.includes('historia-otono') && otorgados.includes('historia-del-valle'), 'los tres de los actos y el final se otorgan');
  const guardados = Object.keys(JSON.parse(alm.m.get('hojarasca-logros-relax-v1')).logros);
  igual([...guardados].sort(), [...new Set(otorgados)].sort(), 'lo guardado es lo otorgado');
  const L2 = LR.crearLogrosRelax(alm);
  ok(otorgados.every((id) => L2.tiene(id)), 'después de volver a abrir siguen todos');
  ok(L2.revisar(r.S.P).length === 0, 'y revisar de nuevo no suma nada');
  ok(LH.LOGROS_HISTORIA.every((l) => LR.sanearLogrosRelax({ logros: { [l.id]: '2026-01-01T00:00:00.000Z' } }).logros[l.id]), 'el saneo de la libreta no pierde ninguno de los de la Historia');
  // un logro ganado no se pierde porque otra partida (nueva) no lo cumpla
  const vacia = { historia: H.historiaNueva() };
  ok(L2.revisar(vacia).length === 0 && otorgados.every((id) => L2.tiene(id)), 'cargar una partida nueva no quita lo ganado');
}

// ================================================================ las mutaciones: cada arreglo deshecho tiene que hacer fallar su sección
const MUT = [
  ['cantina.js', 'fuertes: { dia: 0, n: 0, mate: 0 }, ebrio', 'fuertes: { dia: 0, n: 0 }, ebrio', 'la libreta nueva no trae el mate', 'guardado'],
];
let atrapadas = 0;
if (!HIJO && MUT.length) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4250a-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4250_SRC: dir, A4250_CALLADO: '1', A4250_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.0 (A) la caza de bugs de lo nuevo · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
