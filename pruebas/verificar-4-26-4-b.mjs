// 4.26.4 (B): la vuelta en trochita. En la Historia, mientras no hiciste la primera vuelta (subirte a la trochita en la Aldea), la campanita del andén
// llama al tren con más de 25 s de espera (en lo demás, 45 s de siempre). Se prueba:
//   1. las reglas puras (`umbralDeCampana`, `vueltaHecha`, `decidirCampana` con umbral propio);
//   2. main.js: `campanaAndenCerca` con la Historia (antes y después de la vuelta, Relax, Desafío) y `prepararTren` (la marca al subirse en la Aldea);
//   3. el objetivo de la vuelta en `historia.js` (la línea de la campanita, sólo hasta la vuelta);
//   4. `traerAlAnden` del tren de verdad con esperas de 20, 30 y 40 s.
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.B4264_SRC || join(raiz, 'src');
const HIJO = !!process.env.B4264_SRC;
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.B4264_CALLADO) console.log('FALLA ' + t); } };

const C = await imp('campana-anden.js');
const H = await imp('historia.js');
const main = leer('main.js'), trochita = leer('trochita.js');

// ---------------------------------------------------------------- 1. reglas puras
{
  const { CAMPANA_ANDEN: K, umbralDeCampana: um, vueltaHecha: vh, decidirCampana: dec, MARCA_VUELTA } = C;
  ok(K.umbral === 45 && K.umbralHistoria === 25, 'los números: 45 s de siempre y 25 s en la Historia antes de la vuelta');
  ok(MARCA_VUELTA === 'mundo:vuelta-trochita', 'la marca de la primera vuelta');
  ok(um({ historia: true, vuelta: false }) === 25, 'Historia sin vuelta: 25 s');
  ok(um({ historia: true, vuelta: true }) === 45, 'Historia con la vuelta hecha: 45 s');
  ok(um({ historia: false, vuelta: false }) === 45, 'Relax: 45 s');
  ok(um(null) === 45 && um({}) === 45, 'sin datos: 45 s');
  ok(vh({ [MARCA_VUELTA]: 3 }) && !vh({}) && !vh(null) && !vh({ constructor: 1 }) && !vh('x'), 'vueltaHecha mira la marca y nada más');
  const f = (o = {}) => ({ espera: 30, aca: false, subido: false, conduce: false, varado: false, nieve: false, enOtra: null, sale: 0, entrando: false, ...o });
  ok(dec(f({ espera: 30 }), { umbral: 25 }).motivo === 'viene' && dec(f({ espera: 30 }), { umbral: 25 }).ok, 'a 30 s con umbral 25, viene');
  ok(dec(f({ espera: 25 }), { umbral: 25 }).motivo === 'cerca', 'a 25 s con umbral 25, ya viene');
  ok(dec(f({ espera: 30 })).motivo === 'cerca', 'a 30 s sin umbral propio (45), ya viene');
  ok(dec(f({ espera: 30 }), { umbral: 25, elsa: 'elsa-anden' }).motivo === 'elsa', 'la escena de Elsa sigue mandando');
}

// ---------------------------------------------------------------- 2. main.js con un mundo de mentira
{
  const CAP = ['llave', 'bolsa', 'mesa', 'ramal'].map((id) => ({ id }));
  const mundo = (o = {}) => {
    const estacion = { nombre: 'Estación del Valle', anden: { x: 100, z: 50 }, espera: { x: 100, z: 50, y: 20 }, campana: { x: 102, y: 22.4, z: 49.5 } };
    const aldea = { nombre: 'Aldea de los Duendes', anden: { x: -300, z: 80 }, espera: { x: -300, z: 80, y: 12 }, aldea: true };
    const paradas = [estacion, aldea];
    const llamado = { espera: o.espera ?? 30, aca: false, subido: false, conduce: false, varado: false, nieve: false, enOtra: null, sale: 0, entrando: false };
    const R = { traidos: [], fundidos: 0, notas: [], fallas: [] };
    const js = { pos: { x: o.aldea ? -298 : 102, y: 20, z: o.aldea ? 80 : 51 }, yaw: 0, enTren: false, sentado: false, ...(o.js || {}) };
    const h = o.historia === undefined ? { activa: true, capitulo: 2, escenas: { vistas: { 'elsa-anden': 1, 'elsa-anden-vuelta': 1 } }, temas: o.vuelta ? { 'mundo:vuelta-trochita': 3 } : {} } : o.historia;
    const env = {
      jugador: { estado: js },
      tren: { estacion, paradas,
        paradaCerca: (j) => paradas.find((p) => Math.hypot(p.anden.x - j.pos.x, p.anden.z - j.pos.z) < 14) || null,
        estadoDelLlamado: () => ({ ...llamado }),
        traerAlAnden: (p, m) => { R.traidos.push([p.nombre, m]); return true; } },
      progreso: { historia: h, dia: 7, entradas: { viaje: { dia: 1 } } },
      esDesafio: !!o.desafio, desafio: o.desafio ? { hayAtaque: () => false } : null,
      mirandoLaCampana: () => true, mecanicasAldea: { dondeCampana: () => ({ x: -302, z: 78 }), tocarCampana: () => ({}) },
      CAPITULOS: CAP, CAMPANA_ANDEN: C.CAMPANA_ANDEN, decidirCampana: C.decidirCampana, ofreceCampana: C.ofreceCampana, textoCampana: C.textoCampana, campanaDeElsa: C.campanaDeElsa,
      umbralDeCampana: C.umbralDeCampana, vueltaHecha: C.vueltaHecha, MARCA_VUELTA: C.MARCA_VUELTA,
      sonido: { campana: () => {} }, nota: (t) => R.notas.push(t),
      fundirCorto: (f) => { R.fundidos++; f(); }, fallaSistema: (k, e) => R.fallas.push([k, String(e)]),
      Math,
    };
    env.campanaAndenCerca = funcion(main, 'campanaAndenCerca', env);
    env.tocarCampanaAnden = funcion(main, 'tocarCampanaAnden', env);
    return { env, R, js, h, aldea };
  };
  // la Historia antes de la vuelta: 30 s ya alcanza
  { const { env, R } = mundo({ espera: 30 }); const d = env.campanaAndenCerca(); ok(d && d.ok && d.motivo === 'viene', 'Historia sin vuelta, tren a 30 s: la campana lo llama'); env.tocarCampanaAnden(); ok(R.fundidos === 1 && R.traidos.length === 1 && R.traidos[0][1] === 135, 'y lo trae a 135 m'); }
  { const { env } = mundo({ espera: 25 }); const d = env.campanaAndenCerca(); ok(d && !d.ok && d.motivo === 'cerca', 'a 25 s, ya viene: sólo avisa'); }
  { const { env } = mundo({ espera: 600 }); ok(env.campanaAndenCerca().ok, 'a 600 s, viene'); }
  // después de la vuelta, 45 s
  { const { env } = mundo({ espera: 30, vuelta: true }); const d = env.campanaAndenCerca(); ok(d && !d.ok && d.motivo === 'cerca', 'Historia con la vuelta hecha, a 30 s: sólo avisa'); }
  { const { env } = mundo({ espera: 50, vuelta: true }); ok(env.campanaAndenCerca().ok, 'con la vuelta hecha, a 50 s: viene (los 45 s de siempre)'); }
  // Relax y Desafío: 45 s
  { const { env } = mundo({ espera: 30, historia: { activa: false, capitulo: 0, escenas: { vistas: {} }, temas: {} } }); ok(env.campanaAndenCerca().motivo === 'cerca', 'Relax: a 30 s, sólo avisa'); }
  { const { env } = mundo({ espera: 30, desafio: true }); ok(env.campanaAndenCerca().motivo === 'cerca', 'Desafío: a 30 s, sólo avisa'); }
  { const { env } = mundo({ espera: 30, desafio: true }); env.progreso.historia = { activa: true, capitulo: 2, temas: {} }; ok(env.campanaAndenCerca().motivo === 'cerca', 'Desafío con una Historia a medias en el guardado: 45 s'); }
  { const { env } = mundo({ espera: 30, historia: { activa: true, capitulo: 2, escenas: { vistas: { 'elsa-anden': 1 } } } }); ok(env.campanaAndenCerca().ok, 'una Historia sin la lista de temas: sin vuelta, 25 s (no rompe)'); }
  // Elsa sigue mandando en su escena (la vuelta, capítulo 2, escena por verse)
  { const { env } = mundo({ espera: 300, aldea: true, historia: { activa: true, capitulo: 1, escenas: { vistas: {} }, temas: {} } }); ok(env.campanaAndenCerca().motivo === 'elsa', 'la soga de Elsa en la Aldea del capítulo 2 sigue atada'); }

  // la marca al subirse en la Aldea (prepararTren)
  const sube = (o = {}) => {
    const m = mundo({ aldea: !o.enEstacion, vuelta: o.vuelta, historia: o.historia });
    const marcados = [];
    const env = { ...m.env, desafio: o.desafio ? {} : null, esDesafio: !!o.desafio, empezarViaje: () => {}, viajeTren: () => ({}), ahoraJuego: () => 0, trenMejorado: () => false, enTrenAntes: false,
      paradaAldeaHist: () => (o.desafio ? null : m.aldea),
      marcarTema: (h, q, t, d) => { marcados.push([q, t, d]); h.temas = { ...(h.temas || {}), [`${q}:${t}`]: d }; },
      vueltaHecha: C.vueltaHecha, MARCA_VUELTA: C.MARCA_VUELTA };
    return { env, marcados, m };
  };
  const correr = (s, subido = true) => { s.m.js.enTren = subido; funcion(main, 'prepararTren', s.env)(0.1); };
  { const s = sube(); correr(s); ok(s.marcados.length === 1 && s.marcados[0][0] === 'mundo' && s.marcados[0][1] === 'vuelta-trochita' && s.marcados[0][2] === 7, 'subirse en la Aldea en la Historia marca la primera vuelta'); }
  { const s = sube({ enEstacion: true }); correr(s); ok(s.marcados.length === 0, 'subirse en la Estación del Valle (la ida) no la marca'); }
  { const s = sube({ vuelta: true }); correr(s); ok(s.marcados.length === 0, 'con la vuelta hecha no se vuelve a marcar'); }
  { const s = sube({ historia: { activa: false, temas: {} } }); correr(s); ok(s.marcados.length === 0, 'en el Relax no marca nada'); }
  { const s = sube({ desafio: true }); s.env.desafio = {}; correr(s); ok(s.marcados.length === 0, 'en el Desafío no marca nada'); }
  { const s = sube(); correr(s, false); ok(s.marcados.length === 0, 'sin subirse, nada'); }
  { const s = sube(); correr(s); correr(s); ok(s.marcados.length === 1, 'dos cuadros arriba del tren: una sola marca'); }
  { const s = sube(); s.env.marcarTema = () => { throw new Error('roto'); }; correr(s); ok(s.m.R.fallas.some((x) => x[0] === 'historia-vuelta'), 'una falla queda anotada y no rompe el cuadro'); }
}

// ---------------------------------------------------------------- 3. el objetivo de la vuelta
{
  const bolsa = H.CAPITULOS.find((c) => c.id === 'bolsa');
  const talar = bolsa.objetivos.find((o) => o.id === 'talar');
  const LINEA = 'Tocá la campanita del andén para llamar a la trochita.';
  const s = (o = {}) => ({ viaje: true, hacha: true, temas: new Set(o.vuelta ? ['mundo:vuelta-trochita'] : []), ...o });
  ok(H.textoObjetivo(talar, s()).includes(LINEA), 'con el viaje y el hacha, sin la vuelta: la línea de la campanita');
  ok(H.textoObjetivo(talar, s()).startsWith('Talá un árbol seco: tres hachazos (al pehuén no se lo toca)'), 'sin perder el objetivo de siempre');
  ok(!H.textoObjetivo(talar, s({ vuelta: true })).includes('campanita'), 'después de la primera vuelta, la línea no está');
  ok(!H.textoObjetivo(talar, s({ hacha: false })).includes('campanita'), 'sin el hacha todavía, no está');
  ok(!H.textoObjetivo(talar, s({ viaje: false })).includes('campanita'), 'sin el viaje de ida, no está');
  ok(H.textoObjetivo(talar) === 'Talá un árbol seco: tres hachazos (al pehuén no se lo toca)', 'con el estado vacío, el texto de siempre (no se rompe)');
  const est = H.estadoHistoria({ entradas: { viaje: { dia: 1 } }, cosas: { hacha: 1 }, historia: { temas: { 'mundo:vuelta-trochita': 3 } } });
  ok(est.temas.has('mundo:vuelta-trochita'), 'el estado de la Historia ve la marca en los temas guardados');
  ok(bolsa.objetivos.length === 8, 'los objetivos del capítulo son los mismos 8 (la vuelta es una línea, no un objetivo más)');
  ok(H.marcarTema({ temas: {} }, 'mundo', 'vuelta-trochita', 3) === true, 'la marca cabe en los temas (id seguro)');
}

// ---------------------------------------------------------------- 4. el tren de verdad: traerAlAnden con 25 s
{
  const i0 = trochita.indexOf('function esperaEnAnden(parada)'), i1 = trochita.indexOf('function estadoDelLlamado');
  ok(i0 > 0 && i1 > i0, 'trochita.js tiene esperaEnAnden y traerAlAnden');
  const trozo = trochita.slice(i0, i1);
  const crear = (espera, extra = {}) => {
    const est = { s: 0, vel: 0, objetivo: 5, parado: 0, proxima: null, subido: false, conduce: false, varado: false, avisoSilbato: true, frenos: 3, ...extra };
    const f = new Function('est', 'total', 'poste', 'proximoTrenA', 'delta', `${trozo}\nreturn { esperaEnAnden, traerAlAnden };`)(est, 6000, () => 3000, () => ({ segundos: espera }), (a, b) => b - a);
    return { est, f };
  };
  for (const [e, trae] of [[20, false], [25, false], [26, true], [30, true], [40, true], [600, true]]) {
    const { est, f } = crear(e); const r = f.traerAlAnden({ id: 'p' }, 135);
    ok(r === trae, `traerAlAnden con ${e} s de espera: ${trae ? 'trae' : 'no trae'}`);
    if (trae) ok(est.s === 3000 - 135 && est.vel > 0 && est.parado === 0, `queda a 135 m del poste y en marcha (${e} s)`);
  }
  { const { f } = crear(300, { subido: true }); ok(f.traerAlAnden({ id: 'p' }) === false, 'con alguien arriba, no'); }
  { const { f } = crear(300, { varado: true }); ok(f.traerAlAnden({ id: 'p' }) === false, 'varado, no'); }
  ok(/function traerAlAnden\(parada, metros = 135, ya = 25\)/.test(trochita), 'traerAlAnden sigue con sus 25 s (nada cambió en el tren)');
  ok(/est\.parado = 45 \+ r\(\) \* 25;/.test(trochita), 'y la parada sigue de 45 a 70 s (ningún horario cambia)');
}

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['campana-anden.js', '  umbralHistoria: 25,', '  umbralHistoria: 45,', 'la Historia espera los 45 s de siempre'],
  ['campana-anden.js', '  umbralHistoria: 25,', '  umbralHistoria: 5,', 'la Historia trae el tren con 5 s'],
  ['campana-anden.js', '(d && d.historia && !d.vuelta ? CAMPANA_ANDEN.umbralHistoria : CAMPANA_ANDEN.umbral)', '(d && d.historia ? CAMPANA_ANDEN.umbralHistoria : CAMPANA_ANDEN.umbral)', 'los 25 s siguen después de la vuelta'],
  ['campana-anden.js', '(d && d.historia && !d.vuelta ? CAMPANA_ANDEN.umbralHistoria : CAMPANA_ANDEN.umbral)', '(d && !d.vuelta ? CAMPANA_ANDEN.umbralHistoria : CAMPANA_ANDEN.umbral)', 'los 25 s también en el Relax'],
  ['campana-anden.js', '(Number(o.umbral) || CAMPANA_ANDEN.umbral)', 'CAMPANA_ANDEN.umbral', 'decidirCampana ignora el umbral propio'],
  ['campana-anden.js', "export const MARCA_VUELTA = 'mundo:vuelta-trochita';", "export const MARCA_VUELTA = 'mundo:otra-cosa';", 'la marca cambia de nombre y la prueba no la reconoce'],
  ['campana-anden.js', 'Object.hasOwn(temas, MARCA_VUELTA)', 'false', 'la vuelta nunca se da por hecha'],
  ['main.js', "umbral: umbralDeCampana({ historia: !esDesafio && !!h?.activa, vuelta: vueltaHecha(h?.temas) }) }", 'umbral: undefined }', 'main.js no pasa el umbral'],
  ['main.js', 'umbralDeCampana({ historia: !esDesafio && !!h?.activa,', 'umbralDeCampana({ historia: !!h?.activa,', 'el Desafío usa los 25 s de la Historia'],
  ['main.js', 'vuelta: vueltaHecha(h?.temas) })', 'vuelta: false })', 'main.js nunca ve la vuelta hecha'],
  ['main.js', 'if (h?.activa && pa?.espera && !vueltaHecha(h.temas) && Math.hypot(js.pos.x - pa.espera.x, js.pos.z - pa.espera.z) < 30) marcarTema(', 'if (h?.activa && pa?.espera && !vueltaHecha(h.temas)) marcarTema(', 'subirse en cualquier parada marca la vuelta'],
  ['main.js', 'if (h?.activa && pa?.espera && !vueltaHecha(h.temas) &&', 'if (pa?.espera && !vueltaHecha(h.temas) &&', 'la vuelta se marca fuera de la Historia'],
  ['main.js', '  if (subido && !enTrenAntes && !desafio) { try { const h = progreso.historia, pa', '  if (false) { try { const h = progreso.historia, pa', 'subirse en la Aldea no marca la vuelta'],
  ['historia.js', " + (s.viaje && s.hacha && s.temas && !s.temas.has(MARCA_VUELTA) ? ' · Tocá la campanita del andén para llamar a la trochita.' : '')", " + ''", 'el objetivo no dice nada de la campanita'],
  ['historia.js', 's.viaje && s.hacha && s.temas && !s.temas.has(MARCA_VUELTA)', 's.viaje && s.hacha && s.temas', 'la línea sigue después de la vuelta'],
  ['historia.js', 's.viaje && s.hacha && s.temas && !s.temas.has(MARCA_VUELTA)', 's.temas && !s.temas.has(MARCA_VUELTA)', 'la línea sale antes del viaje y del hacha'],
  ['trochita.js', 'function traerAlAnden(parada, metros = 135, ya = 25)', 'function traerAlAnden(parada, metros = 135, ya = 45)', 'el tren no viene con 30 s (traerAlAnden)'],
  ['trochita.js', 'est.parado = 45 + r() * 25;', 'est.parado = 15 + r() * 25;', 'cambia un horario del tren'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'b4264-'));
  try {
    for (const [arch, de, a, que] of MUT) {
      const orig = leer(arch);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, B4264_SRC: dir, B4264_CALLADO: '1' }, encoding: 'utf8', timeout: 120000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
  console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.26.4 (B) la vuelta en trochita: la campanita llama al tren con 25 s hasta la primera vuelta · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
}
process.exit(fallas ? 1 : 0);
