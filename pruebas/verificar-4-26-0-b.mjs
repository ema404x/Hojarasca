// 4.26.0 (B): la trochita sin la espera larga, siempre. La campana del andén (src/campana-anden.js): en cualquier andén, con el tren a más de 45 s, la E
// la toca y la locomotora aparece en un fundido a 135 m del poste (`traerAlAnden`, el mismo de la escena de Elsa). Se prueba:
//   1. las reglas puras: cuándo viene, cuándo sólo avisa, cuándo no suena; los textos; que la escena de Elsa de la Historia se quede con la campana;
//   2. trochita.js `estadoDelLlamado`: la espera, el tren acá, parado en otro andén o entrando a otro (no se lo saca de ahí), varado, en la nieve;
//      y que los horarios no cambiaron (la parada de 45 a 70 s, la velocidad);
//   3. la tabla de la E: la entrada nueva, en su lugar (subir al tren y la casa de té le ganan; a pie, sin mirar nada, no sentado);
//   4. main.js: `campanaAndenCerca` y `tocarCampanaAnden` corridas con un mundo de mentira (radio, Historia, Desafío con ataque, el fundido, el sonido);
//   5. no se abusa: la campana no anota un viaje, no corta otra parada, con el tren que ya viene no hay fundido, y tocarla de nuevo no lo vuelve a mover.
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';
import { contexto } from './ayuda-interacciones.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.B4260_SRC || join(raiz, 'src');
const HIJO = !!process.env.B4260_SRC;
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.B4260_CALLADO) console.log('FALLA ' + t); } };

const C = await imp('campana-anden.js');
const I = await imp('interacciones.js');
const main = leer('main.js'), trochita = leer('trochita.js'), disparadores = leer('historia-disparadores.js');

// ---------------------------------------------------------------- 1. las reglas puras
{
  const { CAMPANA_ANDEN: K, decidirCampana: dec, textoCampana: tx, campanaDeElsa: elsa, ofreceCampana: ofrece } = C;
  ok(K.umbral === 45 && K.metros === 135 && K.radio === 8 && K.frenando === 60, 'los números: 45 s, 135 m, 8 m de radio, 60 m de frenada');
  ok(Object.isFrozen(K), 'y no se pueden pisar');
  // (el mismo umbral que la escena de Elsa)
  ok(/export const ESPERA_MAXIMA_TREN = 45;/.test(disparadores), 'la escena de Elsa usa los mismos 45 s');
  const f = (o = {}) => ({ espera: 300, aca: false, subido: false, conduce: false, varado: false, nieve: false, enOtra: null, sale: 0, entrando: false, ...o });
  ok(dec(null) === null, 'sin datos, nada');
  { const d = dec(f()); ok(d.ok && d.motivo === 'viene' && d.suena && ofrece(d), 'con el tren a 5 minutos, viene'); }
  { const d = dec(f({ espera: 46 })); ok(d.ok && d.motivo === 'viene', 'a 46 s, viene'); }
  { const d = dec(f({ espera: 45 })); ok(!d.ok && d.motivo === 'cerca' && d.suena && ofrece(d), 'a 45 s, ya viene: suena y sólo avisa'); }
  { const d = dec(f({ espera: 12 })); ok(!d.ok && d.motivo === 'cerca' && d.espera === 12, 'a 12 s, ya viene'); }
  { const d = dec(f({ aca: true, espera: 0 })); ok(!d.ok && d.motivo === 'aca' && !ofrece(d), 'con el tren en el andén no se ofrece (la E sube)'); }
  { const d = dec(f({ subido: true })); ok(!d.ok && d.motivo === 'arriba' && !ofrece(d), 'arriba del tren no se ofrece'); }
  { const d = dec(f({ conduce: true })); ok(!d.ok && d.motivo === 'arriba', 'ni manejándolo'); }
  { const d = dec(f({ enOtra: 'Parada del Mallín', sale: 52 })); ok(!d.ok && d.motivo === 'otra' && d.suena && d.enOtra === 'Parada del Mallín' && d.sale === 52, 'parado en otro andén no viene: se dice dónde y cuándo sale'); }
  { const d = dec(f({ enOtra: 'Parada del Mallín', entrando: true })); ok(!d.ok && d.motivo === 'otra' && d.entrando, 'entrando a otro andén, tampoco'); }
  { const d = dec(f({ varado: true })); ok(!d.ok && d.motivo === 'varado', 'varado, no viene'); }
  { const d = dec(f({ nieve: true })); ok(!d.ok && d.motivo === 'nieve', 'plantado en la nieve, no viene (la cuadrilla manda)'); }
  { const d = dec(f(), { ataque: true }); ok(!d.ok && d.motivo === 'ataque' && !d.suena && ofrece(d), 'con un ataque del Desafío, no se toca'); }
  { const d = dec(f(), { elsa: 'elsa-anden' }); ok(!d.ok && d.motivo === 'elsa' && !d.suena && d.elsa === 'elsa-anden', 'con la escena de Elsa por verse, la campana es de ella'); }
  { const d = dec(f({ nieve: true, enOtra: 'X' }), { elsa: 'elsa-anden' }); ok(d.motivo === 'elsa', 'Elsa antes que lo demás'); }
  // textos
  { const t = tx(dec(f()), 'Estación del Valle'); ok(t.titulo === 'Tocaste la campana del andén' && /Estación del Valle/.test(t.sub), `al venir: «${t.titulo}» / «${t.sub}»`); }
  { const t = tx(dec(f({ espera: 3 })), 'X'); ok(t.titulo === 'La trochita ya viene' && /unos 5 segundos/.test(t.sub), 'ya viene: nunca menos de 5 s en el texto'); }
  { const t = tx(dec(f({ espera: 30 })), 'X'); ok(/unos 30 segundos/.test(t.sub), 'ya viene: los segundos que faltan'); }
  { const t = tx(dec(f({ enOtra: 'Parada Alta', sale: 40 }))); ok(/Parada Alta/.test(t.titulo) && /40 segundos/.test(t.sub) && /otra vez/.test(t.sub), 'parado en otro: dónde, cuándo sale y que se toque de nuevo'); }
  { const t = tx(dec(f({ enOtra: 'Parada Alta', entrando: true }))); ok(/entrando a Parada Alta/.test(t.titulo), 'entrando a otro'); }
  for (const m of ['nieve', 'varado']) { const t = tx(dec(f({ [m]: true }))); ok(!!t && t.titulo.length > 5, `texto para ${m}`); }
  { const t = tx(dec(f(), { ataque: true })); ok(!!t, 'texto para el ataque'); }
  { const t = tx(dec(f(), { elsa: 'elsa-anden' })); ok(/soga/.test(t.titulo) && /6 a 21/.test(t.sub), 'la soga atada, Elsa de 6 a 21'); }
  { const t = tx(dec(f(), { elsa: 'elsa-anden-vuelta' })); ok(/soga/.test(t.titulo) && /mandados/.test(t.sub), 'en la Aldea: hacé los mandados'); }
  ok(tx(dec(f({ aca: true }))) === null && tx(null) === null, 'sin texto si no se ofrece');
  // la escena de Elsa (no se saltea)
  const E = (o) => elsa({ historia: true, capitulo: 'bolsa', vistas: {}, viaje: false, esEstacion: true, esAldea: false, ...o });
  ok(E() === 'elsa-anden', 'Historia, capítulo 2, en la estación sin viaje hecho: es de Elsa (la ida)');
  ok(E({ capitulo: 'llave' }) === 'elsa-anden', 'también en el capítulo 1 (un viaje ahí se comería la escena del 2)');
  ok(E({ capitulo: 'mesa' }) === null, 'en el capítulo 3 ya no');
  ok(E({ vistas: { 'elsa-anden': 3 } }) === null, 'con la escena vista, la campana es tuya');
  ok(E({ viaje: true }) === null, 'con un viaje hecho la ida ya no sale');
  ok(E({ historia: false }) === null, 'en el Relax no hay nada que esperar');
  ok(E({ esEstacion: false }) === null, 'en otra parada, nada');
  const V = (o) => elsa({ historia: true, capitulo: 'bolsa', vistas: { 'elsa-anden': 1 }, viaje: true, esEstacion: false, esAldea: true, ...o });
  ok(V() === 'elsa-anden-vuelta', 'en la Aldea, capítulo 2 con un viaje hecho: es de Elsa (la vuelta)');
  ok(V({ viaje: false }) === null, 'sin viaje, la vuelta no');
  ok(V({ capitulo: 'llave' }) === null && V({ capitulo: 'mesa' }) === null, 'sólo en el capítulo 2');
  ok(V({ vistas: { 'elsa-anden-vuelta': 2 } }) === null, 'vista la vuelta, la campana es tuya');
  ok(elsa({ historia: true, capitulo: 'bolsa', vistas: { __proto__: null }, esEstacion: true }) === 'elsa-anden' && elsa(null) === null, 'datos raros no rompen');
}

// ---------------------------------------------------------------- 2. trochita.js
function anidada(fuente, nombre) {
  const i0 = fuente.indexOf(`\n  function ${nombre}(`);
  if (i0 < 0) throw new Error('no está ' + nombre);
  const i1 = fuente.indexOf('\n  }\n', i0);
  return fuente.slice(i0 + 1, i1 + 5);
}
const TOTAL = 2303;
function trenDeMentira(est) {
  const estacion = { s: 600, nombre: 'Estación del Valle' }, mallin = { s: 1200, nombre: 'Parada del Mallín' }, alta = { s: 1800, nombre: 'Parada Alta' };
  const codigo = `const delta = (a, b) => { let d = b - a; while (d < 0) d += total; while (d > total) d -= total; return d; };\n${anidada(trochita, 'proximoTrenA')}\n${anidada(trochita, 'esperaEnAnden')}\n${anidada(trochita, 'traerAlAnden')}\n${anidada(trochita, 'estadoDelLlamado')}\nreturn { proximoTrenA, esperaEnAnden, traerAlAnden, estadoDelLlamado };`;
  const poste = (p) => p.s + 4;
  const f = new Function('est', 'total', 'poste', codigo)(est, TOTAL, poste);
  return { ...f, estacion, mallin, alta, poste };
}
const estTren = (o = {}) => ({ s: 0, vel: 7, objetivo: 7, parado: 0, proxima: null, subido: false, conduce: false, varado: false, esperaNieve: 0, avisoSilbato: true, frenos: 3, ...o });
{
  { const e = estTren({ s: 700 }); const t = trenDeMentira(e); e.proxima = t.mallin;   // recién salió de la estación
    const d = t.estadoDelLlamado(t.estacion);
    ok(d.espera > 300 && !d.aca && d.enOtra === null && !d.entrando && !d.nieve && !d.varado, `recién salido: espera ${d.espera} s, nada que lo frene`);
    ok(C.decidirCampana(d).ok, 'y la campana lo trae'); }
  { const e = estTren({ s: 604, parado: 50 }); const t = trenDeMentira(e); e.proxima = t.estacion;
    const d = t.estadoDelLlamado(t.estacion); ok(d.aca && d.espera === 0, 'parado en este andén: acá'); }
  { const e = estTren({ s: 1204, parado: 52.3, vel: 0 }); const t = trenDeMentira(e); e.proxima = t.mallin;
    const d = t.estadoDelLlamado(t.estacion);
    ok(d.enOtra === 'Parada del Mallín' && d.sale === 53 && !d.entrando, `parado en el Mallín: ${d.enOtra}, sale en ${d.sale} s`);
    ok(C.decidirCampana(d).motivo === 'otra', 'la campana no lo saca de ahí'); }
  { const e = estTren({ s: 1160, vel: 4 }); const t = trenDeMentira(e); e.proxima = t.mallin;   // 44 m del poste del Mallín: frenando
    const d = t.estadoDelLlamado(t.estacion); ok(d.entrando && d.enOtra === 'Parada del Mallín' && d.sale === 0, 'frenando para entrar al Mallín: entrando'); }
  { const e = estTren({ s: 1100, vel: 7 }); const t = trenDeMentira(e); e.proxima = t.mallin;   // 104 m: todavía no frena
    const d = t.estadoDelLlamado(t.estacion); ok(!d.entrando && d.enOtra === null, 'a 104 m del Mallín todavía no cuenta como entrando'); }
  { const e = estTren({ s: 1160, vel: 4 }); const t = trenDeMentira(e); e.proxima = t.mallin;
    const d = t.estadoDelLlamado(t.estacion, 30); ok(!d.entrando, 'la frenada se puede achicar (parámetro)'); }
  { const e = estTren({ s: 500, vel: 7 }); const t = trenDeMentira(e); e.proxima = t.estacion;   // viene hacia acá: no es «otra»
    const d = t.estadoDelLlamado(t.estacion); ok(d.enOtra === null && d.espera > 0 && d.espera <= 20, `viniendo hacia acá (${d.espera} s), no es otra parada`); }
  { const e = estTren({ s: 1500, varado: true }); const t = trenDeMentira(e); e.proxima = t.alta; ok(t.estadoDelLlamado(t.estacion).varado, 'varado'); }
  { const e = estTren({ s: 1500, esperaNieve: 12 }); const t = trenDeMentira(e); e.proxima = t.alta; ok(t.estadoDelLlamado(t.estacion).nieve, 'plantado en la nieve'); }
  { const e = estTren({ s: 1500, subido: true }); const t = trenDeMentira(e); e.proxima = t.alta; ok(t.estadoDelLlamado(t.estacion).subido, 'con alguien arriba'); }
  { const e = estTren({ s: 1500 }); const t = trenDeMentira(e); ok(t.estadoDelLlamado(null) === null, 'sin parada, nada'); }
  // el llamado completo: decide, trae y después ya viene (tocar de nuevo no lo mueve)
  { const e = estTren({ s: 700 }); const t = trenDeMentira(e); e.proxima = t.mallin;
    const d = C.decidirCampana(t.estadoDelLlamado(t.estacion));
    ok(d.ok && t.traerAlAnden(t.estacion, C.CAMPANA_ANDEN.metros) === true, 'se toca y viene');
    ok(Math.abs(e.s - (t.poste(t.estacion) - 135)) < 1e-9 && e.proxima === t.estacion && e.parado === 0, 'la locomotora queda a 135 m del poste, yendo a este andén');
    const ahora = t.esperaEnAnden(t.estacion);
    ok(ahora >= 15 && ahora <= 25, `y llega en ${ahora} s`);
    const s0 = e.s, d2 = C.decidirCampana(t.estadoDelLlamado(t.estacion));
    ok(!d2.ok && d2.motivo === 'cerca' && e.s === s0, 'tocarla otra vez sólo dice que ya viene: no lo vuelve a mover'); }
  ok(enUnaLinea(trochita, ['esperaEnAnden, traerAlAnden, estadoDelLlamado,']), 'trochita.js ofrece estadoDelLlamado');
  // los horarios no cambiaron: la parada de 45 a 70 s y la marcha
  ok(enUnaLinea(trochita, ['est.vel = 0; est.s = poste(est.proxima) % total; est.parado = 45 + r() * 25;']), 'la parada en cada andén sigue de 45 a 70 s');
  ok(enUnaLinea(trochita, ['const objetivo = frenando ? Math.max(1.1, falta * 0.13) : est.objetivo;']), 'la marcha y la frenada, iguales');
  ok(enUnaLinea(trochita, ['est.vel = Math.min(est.objetivo, 6); est.parado = 0; est.proxima = parada;']), 'traerAlAnden es el de la 4.24.0');
}

// ---------------------------------------------------------------- 3. la tabla de la E
{
  const IDS = I.INTERACCIONES.map((e) => e.id);
  const pos = (id) => IDS.indexOf(id);
  ok(pos('campana-anden') > 0, 'la entrada «campana-anden» está en la tabla');
  ok(pos('trochita') < pos('campana-anden') && pos('cabina') < pos('campana-anden'), 'subir al tren y a la cabina le ganan');
  ok(pos('casa-te') < pos('campana-anden'), 'la casa de té de la estación le gana');
  ok(pos('campana-anden') < pos('objetivo') && pos('campana-anden') < pos('fuego'), 'y va antes que el fuego y que lo que mirás');
  const que = (estado) => { const c = contexto(estado); const info = {}; const av = I.avisoDe(c, info); return { e: I.queHariaE(c), aviso: av, id: info.id, c }; };
  const CAMP = { motivo: 'viene', ok: true };
  { const r = que({ campanaAnden: CAMP }); ok(r.e === 'campana-anden' && r.id === 'campana-anden' && r.aviso?.tecla === 'E' && r.aviso.texto === 'Tocar la campana del andén', `a pie en el andén: E · ${r.aviso?.texto}`); }
  { const c = contexto({ campanaAnden: CAMP }); c.control.anotar = true; I.hacerConE(c); ok(c.hechos.includes('tocarCampanaAnden'), 'la E la toca'); }
  ok(que({ campanaAnden: null }).e !== 'campana-anden', 'sin campana a mano, nada');
  ok(que({ campanaAnden: CAMP, js: { sentado: true } }).e !== 'campana-anden', 'sentado en el banco del andén, no (R te levanta)');
  ok(que({ campanaAnden: CAMP, js: { montado: 'caballo' } }).e !== 'campana-anden', 'a caballo, no');
  ok(que({ campanaAnden: CAMP, js: { enTren: true } }).e === 'tren', 'arriba del tren, lo del tren');
  ok(que({ campanaAnden: CAMP, objetivo: { tipo: 'planta', texto: 'Anotar' } }).e === 'objetivo', 'mirando algo para anotar, eso');
  ok(que({ campanaAnden: CAMP, puedeSubirAlTren: true }).e === 'trochita', 'con el tren en el andén, subir');
  ok(que({ campanaAnden: CAMP, cercaDelMostrador: true }).e === 'mostrador', 'el mostrador le gana');
  ok(enUnaLinea(main, ['campanaAnden: () => campanaAndenCerca()', 'tocarCampanaAnden: () => tocarCampanaAnden()']), 'main.js le da a la tabla la campana');
}

// ---------------------------------------------------------------- 4. main.js con un mundo de mentira
{
  const CAP = ['llave', 'bolsa', 'mesa', 'ramal'].map((id) => ({ id }));
  const mundo = (o = {}) => {
    // (4.26.1: la campanita del poste de cada parada; la de la Aldea es la de la estación, ver `mecanicasAldea`)
    const estacion = { nombre: 'Estación del Valle', anden: { x: 100, z: 50 }, espera: { x: 100, z: 50, y: 20 }, campana: { x: 102, y: 22.4, z: 49.5 } };
    const aldea = { nombre: 'Aldea de los Duendes', anden: { x: -300, z: 80 }, espera: { x: -300, z: 80, y: 12 }, aldea: true };
    const otra = { nombre: 'Parada Alta', anden: { x: 400, z: -200 }, espera: { x: 400, z: -200, y: 30 }, campana: { x: 402, y: 32.4, z: -200.5 } };
    const paradas = [estacion, aldea, otra];
    const llamado = { espera: 300, aca: false, subido: false, conduce: false, varado: false, nieve: false, enOtra: null, sale: 0, entrando: false, ...(o.llamado || {}) };
    const R = { notas: [], sonidos: [], traidos: [], fundidos: 0, fallas: [] };
    const js = { pos: { x: 100 + (o.dx ?? 2), y: 20, z: 50 + (o.dz ?? 1) }, enTren: false, sentado: false, ...(o.js || {}) };
    const env = {
      jugador: { estado: js },
      tren: o.sinTren ? null : {
        estacion, paradas,
        paradaCerca: (j) => paradas.find((p) => Math.hypot(p.anden.x - j.pos.x, p.anden.z - j.pos.z) < 14) || null,
        estadoDelLlamado: (p, fr) => { R.frenando = fr; R.llamadoDe = p; return { ...llamado }; },
        traerAlAnden: (p, m) => { R.traidos.push([p.nombre, m]); return true; },
      },
      progreso: { historia: o.historia ?? { activa: false, capitulo: 0, escenas: { vistas: {} } }, entradas: o.entradas || {} },
      esDesafio: !!o.desafio, desafio: o.desafio ? { hayAtaque: () => !!o.ataque } : null,
      mirandoLaCampana: C.mirandoLaCampana, mecanicasAldea: { dondeCampana: () => ({ x: -302, y: 14.4, z: 78.5 }), tocarCampana: () => { R.sonidos.push({ x: -302, y: 14.4, z: 78.5, aldea: true }); return { x: -302, y: 14.4, z: 78.5 }; } },   // (4.26.1)
      CAPITULOS: CAP, CAMPANA_ANDEN: C.CAMPANA_ANDEN, decidirCampana: C.decidirCampana, ofreceCampana: C.ofreceCampana, textoCampana: C.textoCampana, campanaDeElsa: C.campanaDeElsa, umbralDeCampana: C.umbralDeCampana, vueltaHecha: C.vueltaHecha,
      sonido: { campana: (p) => R.sonidos.push(p) },
      nota: (t, s) => R.notas.push([t, s]),
      fundirCorto: (f) => { R.fundidos++; if (o.alFundir) o.alFundir(env); f(); },
      fallaSistema: (k, e) => R.fallas.push([k, String(e)]),
      Math,
    };
    env.campanaAndenCerca = funcion(main, 'campanaAndenCerca', env);
    env.tocarCampanaAnden = funcion(main, 'tocarCampanaAnden', env);
    return { env, R, js, estacion, aldea, otra };
  };
  // dónde se ofrece
  { const { env, R } = mundo(); const d = env.campanaAndenCerca(); ok(d && d.ok && d.parada.nombre === 'Estación del Valle', 'Relax, a 2 m del andén con el tren lejos: viene'); ok(R.frenando === 60, 'con los 60 m de frenada'); }
  { const { env } = mundo({ dx: 2, dz: 2.4 }); ok(!!env.campanaAndenCerca(), '(4.26.1) mirándola a 2,9 m, todavía'); }
  { const { env } = mundo({ dx: 2, dz: 3 }); ok(env.campanaAndenCerca() === null, '(4.26.1) a 3,5 m de la campana, aunque la mires, ya no'); }
  { const { env } = mundo({ js: { yaw: Math.PI } }); ok(env.campanaAndenCerca() === null, '(4.26.1) de espaldas a la campana, no'); }
  { const { env } = mundo({ dx: 9, dz: 3 }); ok(env.campanaAndenCerca() === null, 'a 9,5 m ya no (aunque la parada esté cerca: el cartel sí dice la espera)'); }
  { const { env } = mundo({ js: { enTren: true } }); ok(env.campanaAndenCerca() === null, 'arriba del tren, no'); }
  { const { env } = mundo({ js: { sentado: true } }); ok(env.campanaAndenCerca() === null, 'sentado, no'); }
  { const { env } = mundo({ sinTren: true }); ok(env.campanaAndenCerca() === null, 'sin tren, no'); }
  { const { env } = mundo({ llamado: { aca: true, espera: 0 } }); ok(env.campanaAndenCerca() === null, 'con el tren en el andén, no (la E sube)'); }
  // tocarla
  { const { env, R } = mundo(); env.tocarCampanaAnden();
    ok(R.fundidos === 1 && R.traidos.length === 1 && R.traidos[0][0] === 'Estación del Valle' && R.traidos[0][1] === 135, 'viene: fundido y el tren a 135 m');
    ok(R.sonidos.length === 1 && R.sonidos[0].x === 102 && Math.abs(R.sonidos[0].y - 22.4) < 1e-9, '(4.26.1) suena la campana, desde la campanita del poste');
    ok(R.notas.length === 1 && R.notas[0][0] === 'Tocaste la campana del andén', 'y lo dice'); }
  { const { env, R } = mundo({ llamado: { espera: 30 } }); env.tocarCampanaAnden();
    ok(R.fundidos === 0 && R.traidos.length === 0 && R.sonidos.length === 1 && R.notas[0][0] === 'La trochita ya viene', 'a 30 s: suena, sin fundido, avisa'); }
  { const { env, R } = mundo({ llamado: { enOtra: 'Parada Alta', sale: 40 } }); env.tocarCampanaAnden();
    ok(R.fundidos === 0 && R.traidos.length === 0 && /Parada Alta/.test(R.notas[0][0]), 'parado en otro andén: no se lo saca de ahí'); }
  { const { env, R } = mundo({ llamado: { nieve: true } }); env.tocarCampanaAnden(); ok(R.traidos.length === 0 && /nieve/.test(R.notas[0][0]), 'en la nieve: no viene'); }
  { const { env, R } = mundo({ alFundir: (e) => { e.jugador.estado.enTren = true; } }); env.tocarCampanaAnden();
    ok(R.fundidos === 1 && R.traidos.length === 0, 'si en el fundido ya vas arriba, no se mueve el tren'); }
  { const { env, R } = mundo(); env.tren.traerAlAnden = () => { throw new Error('roto'); }; env.tocarCampanaAnden(); ok(R.fallas.length === 1 && R.fallas[0][0] === 'campana-anden', 'una falla queda anotada y no rompe el cuadro'); }
  // no anota un viaje
  { const { env } = mundo(); env.tocarCampanaAnden(); ok(!env.progreso.entradas.viaje, 'tocar la campana no anota un viaje'); }
  ok(!/registrar\('viaje'\)/.test(main.slice(main.indexOf('function tocarCampanaAnden('), main.indexOf('\n}\n', main.indexOf('function tocarCampanaAnden(')))), 'ni llama a registrar el viaje');
  // la Historia: la escena de Elsa
  const hist = (cap, vistas = {}) => ({ activa: true, capitulo: cap, escenas: { vistas } });
  { const { env, R } = mundo({ historia: hist(1) }); const d = env.campanaAndenCerca(); ok(d && d.motivo === 'elsa' && d.elsa === 'elsa-anden', 'Historia, capítulo 2, estación, sin viaje: es de Elsa');
    env.tocarCampanaAnden(); ok(R.fundidos === 0 && R.traidos.length === 0 && R.sonidos.length === 0 && /soga/.test(R.notas[0][0]), 'no suena ni trae el tren: la soga está atada'); }
  { const { env } = mundo({ historia: hist(0) }); ok(env.campanaAndenCerca()?.motivo === 'elsa', 'también en el capítulo 1'); }
  { const { env } = mundo({ historia: hist(1, { 'elsa-anden': 2 }) }); ok(env.campanaAndenCerca()?.ok, 'vista la escena, la campana anda'); }
  { const { env } = mundo({ historia: hist(2) }); ok(env.campanaAndenCerca()?.ok, 'en el capítulo 3, anda'); }
  { const { env } = mundo({ historia: { ...hist(1), activa: false } }); ok(env.campanaAndenCerca()?.ok, 'con la Historia en pausa (Relax), anda'); }
  { const { env } = mundo({ historia: hist(1), entradas: { viaje: { cantidad: 1 } } }); ok(env.campanaAndenCerca()?.ok, 'en la estación con un viaje hecho, anda'); }
  { const { env } = mundo({ historia: hist(1, { 'elsa-anden': 1 }), entradas: { viaje: { cantidad: 1 } }, dx: -402, dz: 30 }); const d = env.campanaAndenCerca();
    ok(d && d.parada.aldea && d.motivo === 'elsa' && d.elsa === 'elsa-anden-vuelta', 'en la Aldea, capítulo 2 con un viaje: la vuelta es de Elsa'); }
  { const { env } = mundo({ historia: hist(1, { 'elsa-anden': 1, 'elsa-anden-vuelta': 1 }), entradas: { viaje: { cantidad: 1 } }, dx: -402, dz: 30 }); ok(env.campanaAndenCerca()?.ok, 'vista la vuelta, anda'); }
  { const { env } = mundo({ historia: hist(1), dx: 302, dz: -249 }); const d = env.campanaAndenCerca(); ok(d && d.parada.nombre === 'Parada Alta' && d.ok, 'en otra parada, la Historia no la ata'); }
  // el Desafío
  { const { env } = mundo({ desafio: true }); ok(env.campanaAndenCerca()?.ok, 'en el Desafío de día, anda'); }
  { const { env, R } = mundo({ desafio: true, ataque: true }); ok(env.campanaAndenCerca()?.motivo === 'ataque', 'con un ataque, no'); env.tocarCampanaAnden(); ok(R.sonidos.length === 0 && R.traidos.length === 0, 'ni suena'); }
  { const { env } = mundo({ desafio: true, historia: hist(1) }); ok(env.campanaAndenCerca()?.ok, 'en el Desafío la Historia no cuenta'); }
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['campana-anden.js', '  umbral: 45,', '  umbral: 5,', 'con el tren a 30 s igual hay fundido'],
  ['campana-anden.js', '  metros: 135,', '  metros: 30,', 'la locomotora aparece a la vista'],
  ['campana-anden.js', '  alcance: 3,', '  alcance: 8,', 'la campana se toca desde toda la parada'],   // (4.26.1: el alcance es de la campana, a 3 m; el radio de 8 m del andén es sólo el primer filtro)
  ['campana-anden.js', "  if (o.elsa) return r('elsa', false, false);\n", '', 'la campana saltea la escena de Elsa'],
  ['campana-anden.js', "  if (f.enOtra) return r('otra');\n", '', 'la campana saca al tren de otra parada'],
  ['campana-anden.js', "  if (f.nieve) return r('nieve');\n", '', 'la campana saltea la cuadrilla de la nieve'],
  ['campana-anden.js', "  if (f.varado) return r('varado');\n", '', 'la campana suelta al tren varado'],
  ['campana-anden.js', "  if (o.ataque) return r('ataque', false, false);\n", '', 'la campana se toca en pleno ataque'],
  ['campana-anden.js', "  if (f.aca) return r('aca', false, false);\n", '', 'la campana se ofrece con el tren en el andén'],
  ['campana-anden.js', "const CAPITULOS_IDA = ['llave', 'bolsa'];", "const CAPITULOS_IDA = ['bolsa'];", 'en el capítulo 1 la campana se come la escena del 2'],
  ['campana-anden.js', "if (d.esAldea && d.viaje && d.capitulo === 'bolsa'", "if (d.esAldea && d.capitulo === 'bolsa'", 'la vuelta de Elsa ata la campana sin viaje hecho'],
  ['campana-anden.js', "export const ofreceCampana = (d) => !!d && d.motivo !== 'arriba' && d.motivo !== 'aca';", "export const ofreceCampana = (d) => !!d;", 'la campana se ofrece arriba del tren'],
  ['trochita.js', "    const entrando = !!otra && !paradoEnOtra && !est.varado && !est.conduce && delta(est.s, poste(otra)) < frenando;", "    const entrando = false;", 'se trae el tren que está entrando a otra parada'],
  ['trochita.js', "    const paradoEnOtra = !!otra && est.parado > 0;", "    const paradoEnOtra = false;", 'se trae el tren parado en otra parada'],
  ['trochita.js', "varado: !!est.varado, nieve: est.esperaNieve > 0,", "varado: !!est.varado, nieve: false,", 'la nieve no cuenta'],
  ['trochita.js', "sale: paradoEnOtra ? Math.ceil(est.parado) : 0,", "sale: 0,", 'no se dice cuándo sale'],
  ['trochita.js', "    est.vel = 0; est.s = poste(est.proxima) % total; est.parado = 45 + r() * 25;", "    est.vel = 0; est.s = poste(est.proxima) % total; est.parado = 15 + r() * 25;", 'cambia el horario de las paradas'],
  ['main.js', "  if (!mirandoLaCampana(js, campana)) return null;\n", '', 'la campana se toca desde toda la parada (main.js)'],   // (4.26.1: lo que limita es mirar la campana a 3 m; los 8 m del andén son sólo el primer filtro)
  ['main.js', "  if (!tren?.estadoDelLlamado || !js || js.enTren || js.sentado) return null;", "  if (!tren?.estadoDelLlamado || !js || js.enTren) return null;", 'se toca sentado'],
  ['main.js', "esEstacion: p === tren.estacion,", "esEstacion: false,", 'main.js no ve que es la estación de Elsa'],
  ['main.js', "const elsa = campanaDeElsa({ historia: !esDesafio && !!h?.activa,", "const elsa = campanaDeElsa({ historia: false,", 'main.js no le avisa a la campana de la Historia'],
  ['main.js', "{ ataque: !!desafio?.hayAtaque?.(), elsa, umbral", "{ ataque: false, elsa, umbral", 'main.js no mira el ataque'],
  ['main.js', "  if (d.ok) fundirCorto(() => { try { if (!jugador.estado.enTren) tren.traerAlAnden(p, CAMPANA_ANDEN.metros); }", "  if (d.ok) { try { if (!jugador.estado.enTren) tren.traerAlAnden(p, CAMPANA_ANDEN.metros); }", 'el tren aparece sin fundido'],
  ['main.js', "  if (d.ok) fundirCorto(() => { try { if (!jugador.estado.enTren) tren.traerAlAnden(", "  if (d.ok) fundirCorto(() => { try { if (true) tren.traerAlAnden(", 'el tren se mueve con el jugador ya arriba'],
  ['main.js', "  if (d.ok) fundirCorto(", "  if (d.ok || d.motivo === 'cerca') fundirCorto(", 'hay fundido con el tren que ya viene'],
  ['main.js', "  if (d.suena && !(p.aldea && mecanicasAldea?.tocarCampana?.())) sonido.campana?.(", "  if (!(p.aldea && mecanicasAldea?.tocarCampana?.())) sonido.campana?.(", 'la soga atada suena igual'],   // (4.26.1: la línea del sonido cambió)
  ['main.js', "  const d = decidirCampana(tren.estadoDelLlamado(p, CAMPANA_ANDEN.frenando),", "  const d = decidirCampana(tren.estadoDelLlamado(p, 0),", 'no se mira si entra a otra parada'],
  ['interacciones.js', "const campanaALaVista = (c) => aPie(c) && !c.js.sentado && c.campanaAnden?.();", "const campanaALaVista = (c) => aPie(c) && c.campanaAnden?.();", 'la tabla ofrece la campana sentado'],   // (4.26.1: la condición es campanaALaVista)
  ['interacciones.js', "const campanaALaVista = (c) => aPie(c) && !c.js.sentado && c.campanaAnden?.();", "const campanaALaVista = (c) => libre(c.js) && !c.js.sentado && c.campanaAnden?.();", 'la campana le gana a lo que mirás'],
];
let atrapadas = 0;
if (!HIJO) {
  // la mutación de la tabla que la mueve antes de subir al tren
  const tabla = leer('interacciones.js');
  const lineaCamp = tabla.split('\n').find((l) => l.includes("{ id: 'campana-anden',"));
  const lineaTroch = tabla.split('\n').find((l) => l.includes("{ id: 'trochita',"));
  MUT.push(['interacciones.js', `${lineaTroch}\n`, `${lineaCamp}\n${lineaTroch}\n`, 'la campana le gana a subir al tren (duplicada antes)']);
  const tmp = mkdtempSync(join(tmpdir(), 'b4260-'));
  try {
    for (const [arch, de, a, que] of MUT) {
      const orig = leer(arch);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      let nuevo = orig.replace(de, () => a);
      if (que.startsWith('la campana le gana a subir')) { const i = nuevo.lastIndexOf(lineaCamp); nuevo = nuevo.slice(0, i) + nuevo.slice(i + lineaCamp.length + 1); }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), nuevo);
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, B4260_SRC: dir, B4260_CALLADO: '1' }, encoding: 'utf8', timeout: 120000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.26.0 (B) la campana del andén: la trochita sin la espera larga en cualquier andén · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
