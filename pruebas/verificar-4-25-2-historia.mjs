// 4.25.2 (Historia): los arreglos de la zona G1 de la revisión (trabajo/bugs10/zona-G1.md). Cada arreglo tiene su mutación: la misma suite sobre una copia del archivo
// con el arreglo deshecho (en src/, con un nombre que termina en `-mut<n>.js`, borrada al terminar) tiene que fallar.
//   G1-1  la E sobre la gente de la aldea le pasa a la Historia la clave corta (`npc.claveAldea || npc.clave`): «Llevarla a Rosa» (capítulo 2) y el capítulo 11 se trababan
//   G1-2  sentado a esperar la hora de una escena: la escena empieza con vos sentado (te levanta) y el reloj va a ×8 cerca de la ventana (antes ×40: la ventana duraba 4 s)
//   G1-3  la partida vieja que se reinicia arranca una Historia nueva de verdad (`arranqueNuevo`: la estación propia)
//   G1-4  sin visitas, el capítulo 4 lanza el derrumbe (su objetivo ya no lleva `vecinos`): la puertita no queda librada al azar
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { expresion } from './ayuda-codigo.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };

// (al mutar historia.js, los módulos de la Historia que la importan y que la prueba usa se copian también con el sufijo, apuntando a la copia)
const DEPENDEN = {
  'historia.js': ['historia-disparadores.js', 'historia-espera.js', 'historia-reinicio.js', 'historia-ajustes.js'],
};

async function suite(sufijo = '', archMut = '') {
  const f0 = fallas;
  const mutados = sufijo ? new Set([archMut, ...(DEPENDEN[archMut] || [])]) : new Set();
  const nombre = (f) => (mutados.has(f) ? f.replace('.js', `${sufijo}.js`) : f);
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', nombre(f))).href);
  const leer = (f) => readFileSync(join(raiz, 'src', nombre(f)), 'utf8');

  const H = await imp('historia.js');
  const D = await imp('historia-disparadores.js');
  const ES = await imp('historia-espera.js');
  const idx = (id) => H.CAPITULOS.findIndex((c) => c.id === id);
  const armar = (capId, mod = () => {}, p = {}) => {
    const h = H.historiaNueva();
    h.activa = true; h.empezada = 1; h.capitulo = idx(capId); h.fase = 'jugando'; h.base = { dia: 1 };
    mod(h);
    const prog = { dia: p.dia ?? 3, horas: p.horas ?? 10, historia: h, economia: { pesos: 5000 }, materiales: { lana: 4 }, aldea: { pobladores: (p.pobladores || []).map((clave) => ({ clave })) }, eventosValle: { hechos: {} } };
    return { h, s: H.estadoHistoria(prog, { lugares: {}, vecinos: p.vecinos ?? true, sentado: !!p.sentado }) };
  };

  // ---------------------------------------------------------------- G1-1: la clave que la E le pasa a la Historia
  {
    const main = leer('main.js');
    const claveDe = (npc) => expresion(main, 'const claveHist = ', { npc });
    ok(/if \(!desafio && valle\?\.alHablarCon\?\.\(claveHist\)\) return;/.test(main), 'G1-1: hablar() dispara la escena con la clave corta');
    ok(/const lineaHist = !desafio \? valle\?\.lineaDeHistoria\?\.\(claveHist\) : null;/.test(main), 'G1-1: y la línea de historia también');
    const figura = (k, vecino) => ({ clave: `${vecino ? 'aldea' : 'poblador'}-${k}`, claveAldea: k });
    const casos = [
      ['bolsa', 'panadera', false, (h) => { h.escenas.vistas['bolsa-alero'] = 1; h.decisiones.bolsa = 'b'; }, ['panadera'], 'bolsa-rosa'],
      ['arco', 'tejedora', false, () => {}, ['tejedora'], 'elvira-cuerda'],
      ['arco', 'herrero', false, () => {}, ['herrero'], 'anselmo-puntas'],
      ['arco', 'martin', true, () => {}, [], null],
      ['arco', 'carpintero', false, (h) => { h.hechos['arco:lenga'] = 1; }, ['carpintero'], 'tito-arco'],
    ];
    for (const [cap, k, vecino, mod, pob, esperada] of casos) {
      const { h, s } = armar(cap, mod, { pobladores: pob });
      const corta = D.escenaPendiente(h, s, { modo: 'hablar', clave: k });
      ok(corta && (!esperada || corta === esperada), `G1-1: (la Historia) E sobre ${k} en «${cap}» da ${esperada || 'una escena'} (${corta})`);
      const npc = figura(k, vecino);
      const r = D.escenaPendiente(h, s, { modo: 'hablar', clave: claveDe(npc) });
      ok(r === corta, `G1-1: con la figura de la aldea (${npc.clave}) también (${r})`);
    }
    // los del valle (sin claveAldea, o con la misma) siguen igual
    ok(claveDe({ clave: 'ramon' }) === 'ramon' && claveDe({ clave: 'ercilia', claveAldea: 'ercilia' }) === 'ercilia', 'G1-1: la gente del valle pasa su clave de siempre');
  }

  // ---------------------------------------------------------------- G1-2: esperar sentado
  {
    const ui = leer('historia-ui.js');
    ok(/const deSentado = !!s\.sentado && \(ESCENAS_DESDE_SENTADO\.includes\(id\) \|\| escenasDeEspera\(h, s\)\.has\(id\)\);/.test(ui), 'G1-2: la escena que esperabas sentado empieza (te levanta)');
    ok(/aceleracion = jugando && h\.activa \? Math\.max\(aceleracionDeEspera\(h, s\), frenoDeEspera\(h, s\)\) : 1;/.test(ui), 'G1-2: el reloj sentado se frena con frenoDeEspera');
    ok(/import \{ esperasDelCapitulo, escenasDeEspera, frenoDeEspera \} from '\.\/historia-espera\.js';/.test(ui), 'G1-2: historia-ui.js lo importa');
    const DUR = 30;   // minutos por día de fábrica
    const segReales = (horasJuego, escala) => horasJuego / (24 * escala / (DUR * 60));
    const casos = [['nevada', 'espera', 21.5, []], ['cuaderno', 'fogon', null, ['libreta-fiado', 'cuaderno-abuelo']], ['golpea', 'mesa', null, ['galpon-golpe', 'galpon-encuentro', 'cerro-mirador']], ['deshielo', 'fiesta', null, []]];
    for (const [cap, obj, , vistas] of casos) {
      const o = H.CAPITULOS[idx(cap)].objetivos.find((x) => x.id === obj);
      const id = ES.escenaDeObjetivo(o);
      const d = ES.disparadoresDe(id, cap).find((x) => x.hora);
      if (!d) { ok(false, `G1-2: ${cap}:${obj} tiene ventana de hora`); continue; }
      const mod = (h) => { for (const v of vistas) h.escenas.vistas[v] = 1; };
      // dentro de la ventana, sentado: la escena es de las que esperan, y el reloj va a ×8
      const dentro = (d.hora[0] + 0.2) % 24;
      const a = armar(cap, mod, { dia: 2, horas: dentro, sentado: true });
      ok(ES.escenasDeEspera(a.h, a.s).has(id), `G1-2: ${cap}: «${id}» es una escena que se espera sentado`);
      const acel = Math.max(H.aceleracionDeEspera(a.h, a.s), ES.frenoDeEspera(a.h, a.s));
      ok(acel === H.ACELERACION_ESPERA, `G1-2: ${cap}: sentado dentro de la ventana el reloj va a ×${H.ACELERACION_ESPERA} (${acel})`);
      const largo = ((d.hora[1] - d.hora[0]) + 24) % 24;
      ok(segReales(largo, acel) > 15, `G1-2: ${cap}: la ventana dura más de 15 s reales sentado (${segReales(largo, acel).toFixed(1)} s)`);
      // a media hora de la ventana, también; a cinco horas, rápido (×40, sin freno)
      const antes = armar(cap, mod, { dia: 2, horas: (d.hora[0] - 0.5 + 24) % 24, sentado: true });
      ok(ES.frenoDeEspera(antes.h, antes.s) === H.ACELERACION_ESPERA, `G1-2: ${cap}: media hora antes, ya frena`);
      // (el capítulo puede tener otras escenas con hora: alguna hora del día sin ninguna cerca, el reloj sentado sigue rápido)
      let rapido = 0;
      for (let hh = 0; hh < 24; hh += 0.5) { const x = armar(cap, mod, { dia: 2, horas: hh, sentado: true }); if (ES.frenoDeEspera(x.h, x.s) === 1) rapido++; }
      ok(rapido >= 8, `G1-2: ${cap}: lejos de las ventanas el reloj sentado sigue rápido (${rapido} de 48 medias horas)`);
      // de pie, nada
      const pie = armar(cap, mod, { dia: 2, horas: dentro, sentado: false });
      ok(ES.frenoDeEspera(pie.h, pie.s) === 1, `G1-2: ${cap}: de pie no hay freno`);
    }
    // una escena que vale a cualquier hora no es «de esperar»; tampoco la de un objetivo cumplido
    {
      const { h, s } = armar('bolsa', (x) => { x.escenas.vistas['bolsa-alero'] = 1; x.decisiones.bolsa = 'b'; }, { pobladores: ['panadera'], sentado: true });
      ok(!ES.escenasDeEspera(h, s).has('bolsa-rosa'), 'G1-2: la escena sin ventana de hora no levanta a nadie');
      const n2 = armar('nevada', () => {}, { dia: 2, horas: 22, sentado: true });
      const o = H.CAPITULOS[idx('nevada')].objetivos.find((x) => x.id === 'espera');
      n2.h.hechos[`nevada:${o.id}`] = 1;
      ok(!ES.escenasDeEspera(n2.h, n2.s).has(ES.escenaDeObjetivo(o)), 'G1-2: la del objetivo ya cumplido, tampoco');
    }
  }

  // ---------------------------------------------------------------- G1-3: el reinicio de una partida vieja
  {
    const RE = await imp('historia-reinicio.js');
    const AJ = await imp('historia-ajustes.js');
    const vieja = { dia: 40, historia: { activa: true, capitulo: 3, fase: 'jugando', empezada: 2, hechos: { 'x:y': 3 } } };
    const p = RE.reiniciarPartida(vieja, { dia: 1, horas: 8, pos: null }, 'copia-previa-historia-4.15.0-p1-x.json');
    const h = H.sanearHistoria(p.historia);
    ok(h.arranqueNuevo === true, 'G1-3: la Historia reiniciada es nueva (arranqueNuevo)');
    const ajustes = { modo: 'relax', relaxTipo: 'historia', estacion: 'verano', duracion: 30 };
    const n2 = H.historiaNueva(); H.empezarHistoria(n2, 1);
    ok(AJ.estacionEfectiva(ajustes, h) === AJ.estacionEfectiva(ajustes, n2), `G1-3: con la estación de la Historia, como una empezada de cero (${AJ.estacionEfectiva(ajustes, h)})`);
    const l = H.sanearHistoria(RE.limpiarHistoria(vieja).historia);
    ok(l.empezada === 0, 'G1-3: limpiarHistoria sigue dejando la historia sin empezar');
  }

  // ---------------------------------------------------------------- G1-4: el derrumbe sin visitas
  {
    const mod = (h) => { h.base = { dia: 5 }; h.escenas.vistas['anden-graciela'] = 5; };
    const sin = armar('ramal', mod, { dia: 6, horas: 12, vecinos: false });
    if (idx('ramal') < 0 || H.CAPITULOS[idx('ramal')].objetivos.every((o) => o.id !== 'derrumbe')) {
      // (el capítulo del derrumbe por su objetivo, por si cambia de id)
      ok(false, 'G1-4: el capítulo 4 se llama «ramal» y tiene el objetivo «derrumbe»');
    } else {
      ok(H.momentoPendiente(sin.h, sin.s) === 'derrumbe', `G1-4: sin visitas, el capítulo 4 lanza el derrumbe (${H.momentoPendiente(sin.h, sin.s)})`);
      const con = armar('ramal', mod, { dia: 6, horas: 12, vecinos: true });
      ok(H.momentoPendiente(con.h, con.s) === 'derrumbe', 'G1-4: con visitas, igual que antes');
      const r = H.revisarHistoria(sin.h, sin.s);
      ok(!r.nuevos.some((o) => o.id === 'derrumbe'), 'G1-4: sin visitas «Piedras en la vía» ya no se tilda solo (se juega)');
    }
  }
  return fallas - f0;
}

await suite();

const MUT = [
  ['main.js', 'const claveHist = npc.claveAldea || npc.clave;', 'const claveHist = npc.clave;', 'G1-1: la E pasa la clave larga'],
  ['historia-ui.js', ' || escenasDeEspera(h, s).has(id));', ');', 'G1-2: sentado no empieza la escena que esperabas'],
  ['historia-ui.js', 'Math.max(aceleracionDeEspera(h, s), frenoDeEspera(h, s))', 'aceleracionDeEspera(h, s)', 'G1-2: el reloj sentado no se frena'],
  ['historia-espera.js', 'if (ds.length && ds.every((d) => Array.isArray(d.hora))) r.add(id);', 'if (ds.length) r.add(id);', 'G1-2: cualquier escena cuenta como de esperar'],
  ['historia-espera.js', '    if (e && e.horas <= 1) return ACELERACION_ESPERA;\n', '    if (e) return ACELERACION_ESPERA;\n', 'G1-2: frena toda la espera, no sólo la última hora'],
  ['historia-espera.js', "    if (disparadoresDe(id, c.id).some((d) => horaEntre(s.horas, d.hora[0], d.hora[1]))) return ACELERACION_ESPERA;\n", '', 'G1-2: dentro de la ventana no frena'],
  ['historia-reinicio.js', '  h.arranqueNuevo = true;   // 4.25.2', '  // 4.25.2', 'G1-3: la reiniciada no es nueva'],
  ['historia.js', "texto: 'Piedras en la vía: pasá por el derrumbe del ramal', hecho:", "texto: 'Piedras en la vía: pasá por el derrumbe del ramal', vecinos: true, hecho:", 'G1-4: el derrumbe vuelve a ser de vecinos'],
];
// los que importan al mutado se copian también con el sufijo, apuntando a la copia
function copiar(arch, sufijo, texto) {
  const creados = [];
  const destino = join(raiz, 'src', arch.replace('.js', `${sufijo}.js`));
  writeFileSync(destino, texto); creados.push(destino);
  for (const dep of DEPENDEN[arch] || []) {
    const t = readFileSync(join(raiz, 'src', dep), 'utf8').split(`from './${arch}'`).join(`from './${arch.replace('.js', `${sufijo}.js`)}'`)
      .replace(/from '\.\/historia-disparadores\.js'/g, `from './historia-disparadores${sufijo}.js'`);
    const d = join(raiz, 'src', dep.replace('.js', `${sufijo}.js`));
    writeFileSync(d, t); creados.push(d);
  }
  return creados;
}
let atrapadas = 0;
const todos = [];
try {
  for (const [i, [arch, de, a, que]] of MUT.entries()) {
    const orig = readFileSync(join(raiz, 'src', arch), 'utf8');
    if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
    const sufijo = `-mut${i}`;
    const creados = copiar(arch, sufijo, orig.replace(de, () => a));
    todos.push(...creados);
    callado = true;
    const nAntes = n;
    const fAntes = fallas;
    let tiro = 0;
    try { await suite(sufijo, arch); } catch { tiro = 1; }   // (la copia mutada que tira también es atrapada)
    const malas = fallas - fAntes + tiro;
    callado = false;
    fallas = fAntes; n = nAntes;
    if (malas > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
    for (const f of creados) rmSync(f, { force: true });
  }
} finally {
  callado = false;
  for (const f of todos) if (existsSync(f)) rmSync(f, { force: true });
}
ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.2 (Historia) zona G1 · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
