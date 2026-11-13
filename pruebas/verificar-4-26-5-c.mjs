// 4.26.5 (C): cacería de bugs en lo que se hace en el pueblo. Un caso por arreglo (cada uno falla con su mutación).
//   1. El puesto de cargas: desde la 4.26.1, la E le pasaba `true` (el resultado de la cuenta con la campana) y no la parada a `abrirCargas`: el panel salía con «undefined»
//      de título, sin nada para comprar y se cerraba solo. Ahora la E le pasa la parada del puesto (y la campana a la vista le sigue ganando al puesto).
//   2. Guardar arriba de la trochita parada en un andén (la Aldea, el Mallín…): se guarda ese andén; sólo con el tren en marcha, la Estación del Valle
//      (antes siempre la Estación: guardar en la Aldea te dejaba a 700 m).
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-5-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mundoDeMentira } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.C4265_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  const I = await import(pathToFileURL(path.join(SRC, 'interacciones.js')).href);
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const troc = fs.readFileSync(path.join(SRC, 'trochita.js'), 'utf8');

  // ---- 1. la E del puesto de cargas le pasa la parada
  const ctx = (estado) => {
    const hechos = [];
    const js = { enTren: false, enKayak: false, enVela: false, montado: false, sentado: false, enCable: false, enSulky: false, enSuelo: true, nadando: false, pos: { x: 0, y: 0, z: 0 }, ...(estado.js || {}) };
    const base = { js, objetivo: null, vecino: null, desafio: null, hechos, limpiar: () => {}, accion: () => null, cerca: () => null };
    return new Proxy(base, {
      get(t, k) {
        if (typeof k !== 'string') return undefined;
        if (Object.hasOwn(t, k)) return t[k];
        if (Object.hasOwn(estado, k)) { const v = estado[k]; return typeof v === 'function' ? (...a) => { hechos.push(k); return v(...a); } : () => v; }
        return () => undefined;
      },
    });
  };
  const parada = { nombre: 'Aldea de los Duendes', cargas: { x: 1, z: 2 } };
  let recibido = 'nada';
  const c1 = ctx({ puestoDeCargasCerca: parada, abrirCargas: (p) => { recibido = p; } });
  const id1 = I.hacerConE(c1);
  ok('la E junto al puesto de cargas lo abre', id1 === 'cargas' && c1.hechos.includes('abrirCargas'));
  ok('abrirCargas recibe la parada del puesto (no un true)', recibido === parada);
  const aviso1 = I.avisoDe(ctx({ puestoDeCargasCerca: parada }));
  ok('el aviso dice «Comerciar en el puesto de cargas»', aviso1 && /Comerciar en el puesto de cargas/.test(aviso1.texto));
  recibido = 'nada';
  const c2 = ctx({ puestoDeCargasCerca: parada, campanaAnden: { ok: true }, abrirCargas: (p) => { recibido = p; }, tocarCampanaAnden: () => {} });
  const id2 = I.hacerConE(c2);
  ok('mirando la campana de cerca, la campana le gana al puesto', id2 === 'campana-anden' && recibido === 'nada');
  recibido = 'nada';
  const c3 = ctx({ puestoDeCargasCerca: null, abrirCargas: (p) => { recibido = p; } });
  ok('lejos del puesto, la E no abre las cargas', I.hacerConE(c3) !== 'cargas' && recibido === 'nada');
  const c4 = ctx({ js: { enTren: true }, puestoDeCargasCerca: parada, abrirCargas: (p) => { recibido = p; } });
  ok('arriba del tren, la E no abre las cargas', I.hacerConE(c4) !== 'cargas');

  // ---- 2. guardar arriba de la trochita
  const i0 = main.indexOf('progreso.pos = jugador.estado.enKayak');
  const i1 = main.indexOf(';\n  // 2.9: guardando arriba del velero', i0);
  ok('guardar() tiene la cuenta de la posición', i0 > 0 && i1 > i0);
  const cuenta = main.slice(i0 + 'progreso.pos = '.length, i1).split('\n').map((l) => l.replace(/\s\/\/ .*$/, '').replace(/^\s*\/\/.*$/, '')).join('\n');
  const posDe = (js, tren) => new Function('env', `with (env) { return (${cuenta}); }`)(mundoDeMentira({ T: { lugares: { muelle: { punta: { x: -7, z: -8 } }, estacion: { espera: { x: -234, z: 307 } } } }, jugador: { estado: js }, tren, m: { punta: { x: -7, z: -8 } }, e: { espera: { x: -234, z: 307 } } }));
  const aldea = { espera: { x: 40.7, y: 25.8, z: -342 }, anden: { x: 40.7, z: -342 } };
  const pie = { x: 10, y: 3, z: 4 };
  ok('a pie se guarda donde estás', JSON.stringify(posDe({ pos: pie }, { paradaDondeParo: () => aldea })) === JSON.stringify(pie));
  const p1 = posDe({ enTren: true, pos: { x: 40.7, y: 26.6, z: -338 } }, { paradaDondeParo: () => aldea });
  ok('arriba del tren parado en la Aldea se guarda el andén de la Aldea', p1 && p1.x === 40.7 && p1.z === -342 && p1.y === 25.8);
  const p2 = posDe({ enTren: true, pos: { x: 40.7, y: 26.6, z: -338 } }, { paradaDondeParo: () => null });
  ok('con el tren en marcha se guarda la Estación del Valle', p2 && p2.x === -234 && p2.z === 307);
  const p3 = posDe({ enTren: true, pos: { x: 0, y: 0, z: 0 } }, undefined);
  ok('sin tren en el mundo, la Estación', p3 && p3.x === -234);
  const p4 = posDe({ enTren: true, pos: {} }, { paradaDondeParo: () => ({ espera: { x: NaN, z: 1 } }) });
  ok('una parada sin posición válida cae en la Estación', p4 && p4.x === -234);
  ok('trochita.js da paradaDondeParo (el andén que se pisa al bajar) y bajar lo usa', /function paradaDondeParo\(\)/.test(troc) && /paradaEnVentana, paradaDondeParo,/.test(troc) && /const parada = paradaDondeParo\(\);\s*\n\s*if \(!parada\) return false;/.test(troc));
  ok('paradaDondeParo es null con el tren en marcha', /function paradaDondeParo\(\) \{\s*\n\s*if \(est\.parado <= 0\) return null;/.test(troc));

  // ---- 3. el texto del pedido: «2 frascos de miel», no «2 de frascos de miel»
  const Pd = await import(pathToFileURL(path.join(SRC, 'pedidos.js')).href);
  const { BIENES } = await import(pathToFileURL(path.join(SRC, 'comercio.js')).href);
  const { negociosNuevo } = await import(pathToFileURL(path.join(SRC, 'negocios.js')).href);
  const nuevo = (rep = 20) => ({ modo: 'relax', economia: { pesos: 0 }, negocios: { ...negociosNuevo(), rep: { panadera: rep, herrero: rep, enfermera: rep, veterinaria: rep }, fijos: {} }, granja: {}, entradas: {}, cosas: {}, materiales: {}, aldea: { pobladores: ['panadera', 'herrero', 'enfermera', 'veterinaria'].map((clave) => ({ clave, dia: 1 })), locales: { panaderia: 1, herreria: 1, 'puesto-sanitario': 1, veterinaria: 1 }, obras: {}, descubierta: 1 } });
  let vistos = 0, malTexto = 0, sinCosa = 0;
  for (const k of ['panadera', 'herrero', 'enfermera', 'veterinaria']) for (let dia = 1; dia <= 60; dia += 3) {
    const p = nuevo();
    const o = Pd.ofertaDePedido(p, k, dia, 'X');
    const q = Pd.pedidoDe(p, k, dia);
    if (!o || !q) continue;
    vistos++;
    const nombre = BIENES[q.k].nombre.toLowerCase();
    if (!o.partes[0].includes(`${q.n} ${nombre}`) || / \d+ de /.test(' ' + o.partes[0])) malTexto++;
    // y cumplido
    const b = BIENES[q.k];
    if (b.donde === 'material') p.materiales[q.k] = q.n; else if (b.donde === 'entrada') p.entradas[q.k] = { cantidad: q.n }; else p.cosas[q.k] = q.n;
    const ok2 = Pd.ofertaDePedido(p, k, dia, 'X');
    if (!ok2 || !ok2.efectos || !ok2.partes[0].includes(`${q.n} ${nombre}`) || / \d+ de /.test(' ' + ok2.partes[0])) sinCosa++;
  }
  ok('hay pedidos para mirar el texto', vistos >= 20);
  ok('el pedido dice «N cosas», sin «N de cosas»', malTexto === 0);
  ok('y al cumplirlo («¡Justo lo que necesitaba!»), también', sinCosa === 0);


  // ---- 4. tirar con el puesto de cargas abierto: el panel se vuelve a dibujar (antes quedaba el «tenés 8» de antes)
  const { funcion } = await import('./ayuda-codigo.mjs');
  const tirarCon = (abierto) => {
    let dibujos = 0, bultos = 0;
    const env = {
      ranuras: [{ id: 'tabla', nombre: 'Tablas' }], elegida: 0, jugador: { estado: { enTren: false, enKayak: false, nadando: false, enCable: false, pos: { x: 0, y: 0, z: 0 }, yaw: 0 } },
      durmiendo: false, escenasMundo: null, motivoParaNoTirar: () => null, T: { agua: () => false }, LIMITE: 1e9, col: null, progreso: {},
      sacarDeMochila: () => ({ ok: true, carga: { id: 'tabla', n: 1 } }), objetos: { soltar: () => false, tirarBulto: () => { bultos++; return { ok: true }; } },
      alturaDePie: () => 0, nota: () => {}, sonido: { paso: () => {} }, refrescarBarra: () => {}, enMano: null, guardar: () => {},
      enLasCargas: () => abierto, puestoCargas: { dibujar: () => { dibujos++; } },
    };
    funcion(main, 'soltarRanura', env)();
    return { dibujos, bultos };
  };
  const t1 = tirarCon(true), t0 = tirarCon(false);
  ok('con el puesto de cargas abierto, V tira y vuelve a dibujar el panel', t1.bultos === 1 && t1.dibujos === 1);
  ok('sin el puesto abierto no lo toca', t0.bultos === 1 && t0.dibujos === 0);

  return R;
}

if (process.argv.includes('--hijo')) {
  comprobar().then((R) => console.log(JSON.stringify(R)), (e) => { console.log(JSON.stringify([['error: ' + (e && e.message), false]])); });
} else {
  let malas = 0;
  const hijo = (src) => {
    const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, C4265_SRC: src }, encoding: 'utf8' });
    try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
  };
  const base = hijo(SRC);
  if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
  for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

  // ---- mutaciones
  const MUT = [
    ['interacciones.js', 'la cuenta vuelve a terminar en la campana (pasa true)', "cuando: (c) => aMano(c) && !campanaALaVista(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas'", "cuando: (c) => aMano(c) && c.puestoDeCargasCerca() && !campanaALaVista(c), aviso: () => 'Comerciar en el puesto de cargas'"],
    ['interacciones.js', 'la campana ya no le gana al puesto', "cuando: (c) => aMano(c) && !campanaALaVista(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas'", "cuando: (c) => aMano(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas'"],
    ['interacciones.js', 'el puesto se abre en el tren', "cuando: (c) => aMano(c) && !campanaALaVista(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas'", "cuando: (c) => !campanaALaVista(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas'"],
    ['main.js', 'siempre la Estación', 'const q = tren?.paradaDondeParo?.(), s = q?.espera;', 'const q = null, s = q?.espera;'],
    ['main.js', 'sin la altura del andén (y perdido)', '{ x: s.x, ...(Number.isFinite(s.y) ? { y: s.y } : {}), z: s.z }', '{ x: s.x, y: NaN, z: s.z }'],
    ['main.js', 'el andén sin validar', 'return s && Number.isFinite(s.x) && Number.isFinite(s.z) ?', 'return s ?'],
    ['main.js', 'tirar no redibuja el puesto', 'if (enLasCargas()) puestoCargas.dibujar();   // 4.26.5', 'if (false) puestoCargas.dibujar();   // 4.26.5'],
    ['pedidos.js', 'el pedido vuelve a decir «2 de frascos»', 'const lo = `${q.n} ${nombreCosa(q.k)}`;', 'const lo = `${q.n} de ${nombreCosa(q.k)}`;'],
    ['trochita.js', 'paradaDondeParo sin el chequeo de tren parado', 'if (est.parado <= 0) return null;\n    const p = enVia(est.s + (tren.adelanto', 'const p = enVia(est.s + (tren.adelanto'],
    ['trochita.js', 'paradaDondeParo no se exporta', 'puestoCerca, paradaEnVentana, paradaDondeParo,', 'puestoCerca, paradaEnVentana,'],
  ];
  for (const [archivo, nombre, de, a] of MUT) {
    const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
    if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4265c-'));
    fs.cpSync(SRC, dir, { recursive: true });
    fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
    const r = hijo(dir);
    const falla = !r || r.some(([, v]) => !v);
    console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
    if (!falla) malas++;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
  process.exit(malas ? 1 : 0);
}
