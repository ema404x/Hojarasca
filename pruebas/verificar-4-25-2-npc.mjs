// 4.25.2 (NPC): los arreglos de la zona F2 de la revisión (trabajo/bugs9/zona-F2.md). Cada arreglo tiene su mutación: la misma suite sobre una copia del archivo
// con el arreglo deshecho (en src/, con un nombre que termina en `-mut<n>.js`, borrada al terminar) tiene que fallar.
//   F2-1  las escenas encuentran a la gente de la aldea (`aldea-<k>` / `poblador-<k>` con `claveAldea`), sin confundir las claves genéricas; y quien vive en la aldea es
//         la figura de la aldea (main.js: `figuraDeAldeaParaHistoria` antes del invitado), que no se esfuma en medio de la escena (aldea-gente.js: `enEscena`)
//   F2-2  el acompañante y el visitante que guiás aparecen y caminan sobre tierra (no en el fondo del lago); nadando, te esperan en la orilla
//   F2-3  el de ruta que no se acerca a su parada (Fermín contra el lago, Josefina contra una pared) llega de una a los 12 s (gente.js: `trabadoEnRuta`)
//   F2-4  gente-campo-mundo.js no le pisa la pose al que tomó una escena o te acompaña (`conVos`/`enCita`)
//   F2-5  la visita a tu mesa no es el que te acompaña ni el que va con vos
//   F2-6  el que tiene el agua adelante no «camina» en el lugar (`vel = 0`)
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };

const persona = (clave, x, z, extra = {}) => ({ clave, g: { visible: true, rotation: { y: 0 } }, pos: { x, y: 0, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; } }, ...extra });
const falso = () => new Proxy(function () {}, {
  get(_t, k) {
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'children') return [];
    if (k === Symbol.iterator) return undefined;
    return () => falso();
  },
  set() { return true; },
});
const doc = { head: falso(), body: falso(), createElement: () => falso(), pointerLockElement: null, getElementById: () => null, querySelector: () => null };

async function suite(sufijo = '', archMut = '') {
  const f0 = fallas;
  const nombre = (f) => (sufijo && archMut === f ? f.replace('.js', `${sufijo}.js`) : f);
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', nombre(f))).href);
  const leer = (f) => readFileSync(join(raiz, 'src', nombre(f)), 'utf8');
  const quiero = (f) => !sufijo || archMut === f;

  // ---------------------------------------------------------------- F2-1: la gente de la aldea en las escenas
  if (quiero('escenas-mundo.js')) {
    const EM = await imp('escenas-mundo.js');
    const armados = [];
    const lista = [
      persona('ramon', 1, 1),
      persona('aldea-jefe', 10, 0, { claveAldea: 'jefe' }),
      persona('poblador-carpintero', 12, 0, { claveAldea: 'carpintero' }),
      persona('aldea-abuela', 14, 0, { claveAldea: 'abuela' }),
      persona('poblador-panadera', 16, 0, { claveAldea: 'panadera' }),
      persona('poblador-nena', 18, 0),   // (a medio armar: todavía sin `claveAldea`)
      persona('visitante-mochilero', 20, 0, { claveAldea: 'visitante' }),
      persona('familia-mama', 22, 0, { claveAldea: 'familia' }),
      persona('hijo-1', 24, 0, { claveAldea: 'hijo' }),
      persona('juez-boda', 26, 0, { claveAldea: 'juez' }),
      persona('amor-x', 28, 0, { claveAldea: 'amor' }),
    ];
    const mundo = (l, pareja = null) => EM.crearEscenasMundo({
      doc, camara: { position: { x: 0, y: 0, z: 0, set() {} }, rotation: { x: 0, y: 0, z: 0, set() {} }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} },
      progreso: () => ({ dia: 1, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }),
      modo: () => 'jugando', ajustes: () => ({ fov: 70 }), T: { altura: () => 0, agua: () => false, lugares: {} }, col: null, gente: () => ({ gente: l }), clima: () => ({ estado: {} }), sonido: {},
      alturaDePie: () => 0, nota() {}, fallo() {}, parejaClave: () => pareja, armarYa: (k) => { armados.push(k); return null; },
    });
    const m = mundo(lista, 'panadera');
    for (const [k, quien] of [['ramon', 'ramon'], ['jefe', 'aldea-jefe'], ['carpintero', 'poblador-carpintero'], ['abuela', 'aldea-abuela'], ['panadera', 'poblador-panadera']]) {
      const p = m.mundo.posicion(k), n = lista.find((x) => x.clave === quien);
      ok(p && p.x === n.pos.x, `F2-1: la escena encuentra a «${k}» (${quien}) (${JSON.stringify(p)})`);
      m.mundo.capturar(k);
      ok(n.enEscena === true && n.conVos === true, `F2-1: «${k}» queda tomado por la escena`);
    }
    ok(armados.length === 0, `F2-1: no se arma a nadie de nuevo para los que ya están (${armados})`);
    m.mundo.capturar('pareja');
    ok(m.capturados().includes('pareja') && lista.find((x) => x.clave === 'poblador-panadera').enEscena === true && armados.length === 0, 'F2-1: «pareja» (Rosa) es la Rosa de la aldea, la misma que «panadera»');
    for (const k of ['jefe', 'carpintero', 'abuela', 'panadera', 'pareja', 'ramon']) m.mundo.soltar(k);
    ok(lista.every((x) => !x.enEscena && !x.conVos), 'F2-1: al soltarlos no queda nadie tomado');
    // las claves genéricas y la figura a medio armar no se confunden con las de una escena
    for (const k of ['visitante', 'familia', 'hijo', 'juez', 'amor', 'nena', 'mochilero', 'boda']) ok(m.mundo.posicion(k) === null, `F2-1: «${k}» no es nadie de la lista (${JSON.stringify(m.mundo.posicion(k))})`);
    m.mundo.capturar('nena');
    ok(armados.includes('nena') && !lista.find((x) => x.clave === 'poblador-nena').enEscena, 'F2-1: la que está a medio armar (sin claveAldea) no se toma: se pide armarla');
    // la clave exacta manda (el invitado de una escena anterior, Ercilia adoptada con su clave de siempre)
    const l2 = [persona('poblador-carpintero', 5, 0, { claveAldea: 'carpintero' }), persona('carpintero', 1, 0)];
    ok(mundo(l2).mundo.posicion('carpintero').x === 1, 'F2-1: con la clave exacta en la lista, es ésa');
    // main.js: quien vive en la aldea se pide a la aldea antes que armar un invitado
    const main = leer('main.js');
    ok(/armarYa: \(k\) => genteCampoMundo\?\.armarYa\?\.\(k\) \|\| figuraDeAldeaParaHistoria\(k\) \|\| invitadoDeHistoria\(k\)/.test(main), 'F2-1: main.js pide la figura de la aldea antes que el invitado');
    ok(/function figuraDeAldeaParaHistoria\(clave\) \{\n\s+try \{ return typeof clave === 'string' && clave && aldeaGente\?\.figura \? aldeaGente\.figura\(clave\) \|\| null : null;/.test(main), 'F2-1: figuraDeAldeaParaHistoria usa aldeaGente.figura');
  }
  if (quiero('main.js') && sufijo) {
    const main = leer('main.js');
    ok(/armarYa: \(k\) => genteCampoMundo\?\.armarYa\?\.\(k\) \|\| figuraDeAldeaParaHistoria\(k\) \|\| invitadoDeHistoria\(k\)/.test(main), 'F2-1: main.js pide la figura de la aldea antes que el invitado');
  }
  if (quiero('aldea-gente.js')) {
    const ag = leer('aldea-gente.js');
    ok(/if \(n && !d && !n\.deVisita && !n\.enEscena\) \{ n\.dormido = true;/.test(ag), 'F2-1: la aldea no esconde en medio de una escena a quien no tiene destino');
    ok(/if \(js\.enKayak \|\| js\.enVela \|\| js\.enTren \|\| js\.nadando\) \{ n\.camino = \[\]; return; \}/.test(ag), 'F2-2: el visitante que guiás no te sigue nadando');
    ok(/const atras = atrasEnTierra\(js, 2\.6\);\n\s+if \(!atras\) \{ n\.camino = \[\]; return; \}\n\s+if \(dj > 45\) \{ n\.pos\.set\(atras\.x/.test(ag), 'F2-2: el visitante aparece y camina a un punto en tierra');
    ok(/if \(!agua \|\| !agua\(x, z\)\) return \{ x, z \};/.test(ag), 'F2-2: atrasEnTierra descarta el agua');
  }
  if (quiero('main.js')) {
    const main = leer('main.js');
    ok(/agua: \(x, z\) => !!T\.agua\(x, z\), nadando: \(\) => !!jugador\.estado\.nadando,/.test(main), 'F2-2: el acompañante sabe del agua y de si nadás');
    ok(/alturaDePie: \(x, z, y\) => alturaDePie\(T, col, x, z, y\), agua: \(x, z\) => !!T\.agua\(x, z\),/.test(main), 'F2-2: la aldea sabe del agua (el visitante)');
    ok(/if \(llegando && \(npc\.conVos \|\| npc\.enCita\)\) return false;/.test(main), 'F2-5: traerVisita no trae al que te acompaña o va con vos');
    ok(/puedeVenir: \(k\) => \{[^\n]*!n\.deVisita && !n\.conVos && !n\.enCita && charla\.npc !== n/.test(main), 'F2-5: puedeVenir tampoco');
    ok(/aliadosTomados\.push\(\{ n, g: \{ pose: n\.pose,/.test(main) && /n\.pose = g\.pose \?\? null; \} catch/.test(main), 'F2-4: los aliados de la noche devuelven la pose que tenían');
  }

  // ---------------------------------------------------------------- F2-2: el acompañante sobre tierra
  if (quiero('historia-acompanante.js')) {
    const A = await imp('historia-acompanante.js');
    // el lago detrás tuyo (con yaw 0 se mira hacia −z: atrás es +z)
    const lagoAtras = (x, z) => z > 1;
    const p = A.puntoEnTierra({ x: 0, z: 0 }, 0, lagoAtras);
    ok(p && !lagoAtras(p.x, p.z), `F2-2: con el lago detrás, el punto es en tierra (${JSON.stringify(p)})`);
    ok(p && Math.hypot(p.x, p.z) > 1.2, 'F2-2: y no encima tuyo');
    ok(A.puntoEnTierra({ x: 0, z: 0 }, 0, () => true) === null, 'F2-2: todo agua → ninguno');
    const sin = A.puntoEnTierra({ x: 3, z: 4 }, 0.7), base = A.puntoDeSeguimiento({ x: 3, z: 4 }, 0.7);
    ok(sin.x === base.x && sin.z === base.z, 'F2-2: sin agua, el de siempre');
    for (let i = 0; i < 24; i++) {
      const yaw = i * 0.27, agua = (x, z) => x * Math.cos(i) + z * Math.sin(i) > 0.3;   // (media llanura de agua en una dirección cualquiera)
      const q = A.puntoEnTierra({ x: 0, z: 0 }, yaw, agua);
      if (!q || agua(q.x, q.z)) { ok(false, `F2-2: yaw ${yaw.toFixed(2)}: punto en el agua (${JSON.stringify(q)})`); break; }
    }
    // el terreno de verdad: junto a la orilla del lago, mirando a tierra, «detrás tuyo» es agua
    const { generarTerreno } = await imp('terreno.js');
    const T = generarTerreno();
    let orillas = 0, enAgua = 0, nulos = 0;
    for (let x = -400; x <= 400 && orillas < 300; x += 7) for (let z = -400; z <= 400 && orillas < 300; z += 7) {
      if (T.agua(x, z)) continue;
      for (let k = 0; k < 8; k++) {
        const yaw = k * Math.PI / 4;
        const s = A.puntoDeSeguimiento({ x, z }, yaw);
        if (!T.agua(s.x, s.z)) continue;
        orillas++;
        const q = A.puntoEnTierra({ x, z }, yaw, (a, b) => T.agua(a, b));
        if (!q) nulos++; else if (T.agua(q.x, q.z)) enAgua++;
      }
    }
    ok(orillas > 50, `F2-2: hay orillas donde «detrás tuyo» es agua (${orillas})`);
    ok(enAgua === 0, `F2-2: en el terreno de verdad nunca aparece en el agua (${enAgua} de ${orillas})`);
    ok(nulos === 0, `F2-2: parado en tierra siempre hay un lugar en tierra al lado (${nulos} sin lugar)`);
    // el acompañante entero: bajás del kayak con el lago detrás
    const mk = () => persona('graciela', 50, 50, { camino: [], velocidad: 1 });
    const est = { en: true, nada: false, j: { pos: { x: 0, y: 0, z: 0 }, yaw: 0 } };
    const npc = mk();
    const ac = A.crearAcompanante({ historia: () => ({ activa: true, acompanante: 'graciela' }), jugador: () => est.j, npcDe: () => npc, altura: () => 0, tomada: () => false,
      enVehiculo: () => est.en, agua: lagoAtras, nadando: () => est.nada });
    ac.actualizar(1);
    ok(npc.dormido === true && ac.esperando(), 'F2-2: en el kayak, espera');
    est.en = false; ac.actualizar(1);
    ok(npc.dormido === false && !lagoAtras(npc.pos.x, npc.pos.z) && Math.hypot(npc.pos.x, npc.pos.z) < 4, `F2-2: al bajar aparece a tu lado, en tierra (${npc.pos.x.toFixed(2)}, ${npc.pos.z.toFixed(2)})`);
    // lejos: aparece en tierra; caminando: la meta es en tierra
    npc.pos.set(200, 0, 200); ac.actualizar(1);
    ok(Math.hypot(npc.pos.x, npc.pos.z) < 4 && !lagoAtras(npc.pos.x, npc.pos.z), 'F2-2: el que aparece de lejos, en tierra');
    npc.pos.set(-6, 0, -6); ac.actualizar(1);
    ok(npc.camino.length === 1 && !lagoAtras(npc.camino[0].x, npc.camino[0].z), `F2-2: la meta al seguirte es en tierra (${JSON.stringify(npc.camino[0])})`);
    // nadando: te espera donde está, mirándote (no se mete al agua)
    est.nada = true; est.j = { pos: { x: 0, y: 0, z: 9 }, yaw: 0 }; npc.pos.set(0, 0, -5); ac.actualizar(1);
    ok(npc.camino.length === 0 && npc.dormido === false, 'F2-2: nadando, te espera en la orilla (visible y quieto)');
    {
      const n3 = mk(); n3.pos.set(0, 0, -6);
      const ac3 = A.crearAcompanante({ historia: () => ({ activa: true, acompanante: 'graciela' }), jugador: () => ({ pos: { x: 0, y: 0, z: 6 }, yaw: 0 }), npcDe: () => n3, altura: () => 0, tomada: () => false, enVehiculo: () => false, agua: () => false, nadando: () => true });
      ac3.actualizar(1);
      ok(n3.camino.length === 0 && n3.dormido !== true, 'F2-2: nadando (aunque el punto de seguirte sea tierra), no camina hacia vos');
    }
    // con todo agua alrededor al bajar (la punta del muelle), sigue esperando hasta que pisás tierra
    const npc2 = mk(); const e2 = { en: true, j: { pos: { x: 0, y: 0, z: 0 }, yaw: 0 }, agua: true };
    const ac2 = A.crearAcompanante({ historia: () => ({ activa: true, acompanante: 'graciela' }), jugador: () => e2.j, npcDe: () => npc2, altura: () => 0, tomada: () => false, enVehiculo: () => e2.en, agua: () => e2.agua });
    ac2.actualizar(1); e2.en = false; ac2.actualizar(1);
    ok(ac2.esperando() && npc2.dormido === true && npc2.pos.x === 50, 'F2-2: sin tierra al lado, no se lo pone en el agua: sigue esperando');
    e2.agua = false; ac2.actualizar(1);
    ok(!ac2.esperando() && npc2.dormido === false && Math.hypot(npc2.pos.x, npc2.pos.z) < 4, 'F2-2: y aparece cuando hay tierra');
  }

  // ---------------------------------------------------------------- F2-3 / F2-6: gente.js
  if (quiero('gente.js')) {
    const G = await imp('gente.js');
    const col = { resolver() {}, plataformaEn: null };
    const T = { agua: (x) => x > 3 && x < 6, altura: () => 0 };   // (un arroyo entre el lugar y la parada)
    const g = persona('fermin', 0, 0, { vel: 0 });
    const llego = G.caminarHaciaParaPruebas(g, 0.1, { x: 10, z: 0 }, 1, T, col);
    ok(!llego && g.vel === 1 && g.pos.x > 0, 'F2-6: en tierra camina y mueve las piernas');
    g.pos.set(2.95, 0, 0); G.caminarHaciaParaPruebas(g, 0.1, { x: 10, z: 0 }, 1, T, col);
    ok(g.pos.x === 2.95 && g.vel === 0, `F2-6: con el agua adelante no da el paso ni mueve las piernas (vel ${g.vel})`);
    // F2-3: la vuelta de Fermín: trabado contra el agua, a los 12 s llega de una
    const sim = (q, etapa, agua, dJug = 100, seg = 60) => {
      const TT = { agua, altura: () => 0 };
      for (let t = 0; t < seg; t += 0.1) {
        if (G.caminarHaciaParaPruebas(q, 0.1, etapa, 0.7, TT, col)) return t;
        if (G.trabadoEnRuta(q, etapa, dJug, 0.1)) G.ubicarEnEtapa(q, etapa, TT, col);
      }
      return Infinity;
    };
    const f = persona('fermin', 0, 0);
    const t1 = sim(f, { x: 10, z: 0, quieto: 20 }, T.agua);
    ok(t1 > 15 && t1 < 18, `F2-3: trabado contra el agua (a 3 m, a 0,7 m/s) llega a su parada 12 s después (${t1.toFixed(1)} s)`);
    const r = persona('ramon', 0, 0);
    const t2 = sim(r, { x: 30, z: 0 }, () => false);
    ok(Math.abs(t2 - 29.5 / 0.7) < 1, `F2-3: el que camina bien no salta: llega caminando (${t2.toFixed(1)} s)`);
    ok(r.pos.x > 29, 'F2-3: (y llega)');
    const v = persona('nicanor', 0, 0);
    const t3 = sim(v, { x: 10, z: 0 }, T.agua, 5, 60);
    ok(t3 === Infinity, 'F2-3: con vos al lado no salta (te está mirando)');
    // una etapa nueva vuelve a contar desde cero
    const w = persona('ema', 0, 0), e1 = { x: 10, z: 0 }, e2 = { x: -10, z: 0 };
    for (let i = 0; i < 100; i++) G.trabadoEnRuta(w, e1, 100, 0.1);
    ok(!G.trabadoEnRuta(w, e2, 100, 0.1), 'F2-3: al cambiar de etapa el trabado vuelve a cero');
    const tx = leer('gente.js');
    ok(/\} else if \(trabadoEnRuta\(g, etapa, d, dt\)\) ubicarEnEtapa\(g, etapa, T, col\);/.test(tx), 'F2-3: la ruta de gente.js usa el trabado');
    ok(/g\.espera = etapa\.quieto \|\| 8;\n\s+g\.__trabaRuta = null;/.test(tx), 'F2-3: al llegar se borra el trabado');
  }

  // ---------------------------------------------------------------- F2-4: gente-campo-mundo.js no pisa la pose de una escena
  if (quiero('gente-campo-mundo.js')) {
    const GC = await imp('gente-campo-mundo.js');
    const gente = { armarPobladorDeAPoco: (def) => ({ npc: persona(def.clave, def.pos.x, def.pos.z, { ruta: def.ruta, etapa: 0, espera: 0, vel: 0, velocidad: def.velocidad }), avanzar: () => true }) };
    const gc = GC.crearGenteCampoMundo({ T: { agua: () => false, altura: () => 0, lugares: {}, riel: [] }, col: { resolver() {} }, gente });
    const js = { pos: { x: 99999, z: 99999 } };
    for (const k of ['fermin', 'tobias']) {
      const npc = gc.armarYa(k);
      ok(!!npc, `F2-4: se arma a ${k}`);
      if (!npc) continue;
      // con la pose de su parada en espera, una escena lo toma y le pide otra
      const i = Math.max(0, npc.ruta.findIndex((e) => e.pose));
      npc.etapa = i; npc.espera = 5; npc.vel = 0;
      gc.actualizar(0.016, js);
      const deParada = npc.ruta[i].pose || null;
      ok(npc.pose === deParada, `F2-4: ${k} libre hace lo de su parada (${npc.pose})`);
      npc.conVos = true; npc.enCita = true; npc.pose = 'brindar';
      for (let c = 0; c < 5; c++) gc.actualizar(0.016, js);
      ok(npc.pose === 'brindar', `F2-4: ${k} tomado por una escena mantiene la pose que le pidió (${npc.pose})`);
      npc.pose = null;
      gc.actualizar(0.016, js);
      ok(npc.pose === null, `F2-4: ${k} acompañándote no vuelve a la pose de su parada (${npc.pose})`);
      npc.conVos = false; npc.enCita = false;
      gc.actualizar(0.016, js);
      ok(npc.pose === deParada, `F2-4: ${k} suelto vuelve a lo suyo (${npc.pose})`);
    }
  }
  return fallas - f0;
}

// ---------------------------------------------------------------- la suite sobre el código de verdad
await suite();

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['escenas-mundo.js', "    for (const n of lista) if ((n.clave === deAldea || n.clave === dePoblador) && n.claveAldea === clave) return n;\n", '', 'F2-1: actor() no busca a la gente de la aldea'],
  ['escenas-mundo.js', "&& n.claveAldea === clave) return n;", ') return n;', 'F2-1: se toma a la figura a medio armar'],
  ['escenas-mundo.js', "if ((n.clave === deAldea || n.clave === dePoblador) && n.claveAldea === clave)", 'if (n.claveAldea === clave)', 'F2-1: cualquier claveAldea coincide (visitante, familia, amor…)'],
  ['main.js', '|| figuraDeAldeaParaHistoria(k) || invitadoDeHistoria(k)', '|| invitadoDeHistoria(k)', 'F2-1: siempre se arma un invitado'],
  ['aldea-gente.js', '&& !n.deVisita && !n.enEscena) { n.dormido = true;', '&& !n.deVisita) { n.dormido = true;', 'F2-1: la aldea esconde a quien está en una escena'],
  ['historia-acompanante.js', '  if (!agua(p.x, p.z)) return p;\n', '  return p;\n', 'F2-2: el punto de seguimiento puede ser agua'],
  ['historia-acompanante.js', "if (esperando) { const t = puntoEnTierra(j.pos, j.yaw, agua); if (!t) return; esperando = false; npc.dormido = false; ponerA(t); return; }", 'if (esperando) { esperando = false; npc.dormido = false; ponerA(puntoDeSeguimiento(j.pos, j.yaw)); return; }', 'F2-2: al bajar del kayak aparece detrás aunque sea agua'],
  ['historia-acompanante.js', "    if (ctx.nadando?.() && d < DIST_TELETRANSPORTE) { mirarte(); return; }\n", '', 'F2-2: nadando, te sigue al agua'],
  ['historia-acompanante.js', "    const meta = puntoEnTierra(j.pos, j.yaw, agua);\n", '    const meta = puntoDeSeguimiento(j.pos, j.yaw);\n', 'F2-2: la meta de seguirte puede ser agua'],
  ['aldea-gente.js', '|| js.enTren || js.nadando) { n.camino = []; return; }', '|| js.enTren) { n.camino = []; return; }', 'F2-2: el visitante te sigue nadando'],
  ['main.js', 'agua: (x, z) => !!T.agua(x, z), nadando: () => !!jugador.estado.nadando,', '', 'F2-2: el acompañante no sabe del agua'],
  ['gente.js', '  else g.vel = 0;   // 4.25.2', '  // 4.25.2', 'F2-6: camina en el lugar contra el agua'],
  ['gente.js', 'export const TRABA_RUTA_S = 12,', 'export const TRABA_RUTA_S = 1e9,', 'F2-3: el de ruta trabado no llega nunca'],
  ['gente.js', 'if (falta < t.ref - TRABA_RUTA_M || dJugador', 'if (dJugador', 'F2-3: el que camina bien también salta'],
  ['gente.js', '|| dJugador < TRABA_RUTA_AL_LADO)', ')', 'F2-3: salta con vos al lado'],
  ['gente.js', "\n        } else if (trabadoEnRuta(g, etapa, d, dt)) ubicarEnEtapa(g, etapa, T, col);\n", '\n        }\n', 'F2-3: la ruta de gente.js no usa el trabado'],
  ['gente-campo-mundo.js', '      if (n.conVos || n.enCita) continue;\n', '', 'F2-4: la pose de la parada pisa la de la escena'],
  ['main.js', '  if (llegando && (npc.conVos || npc.enCita)) return false;', '', 'F2-5: la visita puede ser el que te acompaña'],
  ['main.js', '!n.deVisita && !n.conVos && !n.enCita && charla.npc !== n', '!n.deVisita && charla.npc !== n', 'F2-5: el compadre puede ser el que va con vos'],
  ['main.js', '{ pose: n.pose, camino: n.camino,', '{ camino: n.camino,', 'F2-4: los aliados de la noche pierden su pose'],
];
let atrapadas = 0;
const creados = [];
try {
  for (const [i, [arch, de, a, que]] of MUT.entries()) {
    const orig = readFileSync(join(raiz, 'src', arch), 'utf8');
    if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
    const sufijo = `-mut${i}`;
    const destino = join(raiz, 'src', arch.replace('.js', `${sufijo}.js`));
    writeFileSync(destino, orig.replace(de, () => a));
    creados.push(destino);
    callado = true;
    const nAntes = n;
    const malas = await suite(sufijo, arch);
    callado = false;
    fallas -= malas; n = nAntes;
    if (malas > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
    rmSync(destino, { force: true });
  }
} finally {
  callado = false;
  for (const f of creados) if (existsSync(f)) rmSync(f, { force: true });
}
ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.2 (NPC) zona F2 · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
