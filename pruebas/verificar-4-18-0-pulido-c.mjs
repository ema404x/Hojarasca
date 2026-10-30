// 4.18.0 (parte C): el mundo del acto III y el pulido de las escenas optativas. Sólo Node.
//   1. los props de los `mundo:` (historia-props-acto3.js): cada `mundo:` de las escenas del acto III tiene prop o una razón para no tenerlo; cada prop
//      tiene forma (malla o brillo en historia-objetos.js), lugar que existe, y se ve sólo cuando la historia lo dice (con el estado de verdad);
//   2. dónde va un prop de escena (`donde` o delante del jugador), los faroles entre el galpón y la aldea, Fermín en el techo del galpón;
//   3. Ramón sentado (la pose de base «sentado» de escenas-mundo.js) y el ancla `techo` (por conducta, con un mundo de mentira);
//   4. las escenas tocadas: ramon-cama (sentado y con la manta durante la escena), noche-espera (Fermín en el techo, Ramón sentado), umbral-fin (el corte a la raíz);
//   5. la colocación de las escenas del acto III y de las optativas (historia-colocacion.js);
//   6. 0 programas nuevos por texto (sólo materialVegetal y un MeshBasicMaterial con color de vértice, el de las brasas de la aldea; sin luces);
//   7. mutaciones: se rompe a propósito el código y la prueba tiene que fallar (cada mutante es una copia con otro nombre: sin caché de ESM).
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const cerca = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

async function suite(sufijo = '', archMut = '') {
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', sufijo && archMut === f ? f.replace('.js', `${sufijo}.js`) : f)).href);
  const fuente = (f) => leer(`src/${sufijo && archMut === f ? f.replace('.js', `${sufijo}.js`) : f}`);
  const f0 = fallas;
  const PR = await imp('historia-props-acto3.js');
  const H = await import(pathToFileURL(join(raiz, 'src', 'historia.js')).href);
  const A3 = await import(pathToFileURL(join(raiz, 'src', 'historia-escenas-acto3.js')).href);
  const D = await import(pathToFileURL(join(raiz, 'src', 'historia-disparadores.js')).href);
  const { OBJETOS_PROPS_ACTO3: OP, MUNDO_SIN_PROP, propsDeEfecto, puestoDeEfecto, puestoHacia, ferminEnElTecho, TECHO_GALPONCITO } = PR;
  const ids = Object.keys(OP);

  // ---------------------------------------------------------------- 1. los props
  ok(ids.length >= 30, `hay props para los mundo: del acto III (${ids.length})`);
  const mundos = A3.EFECTOS_ACTO3.filter((e) => e.startsWith('mundo:')).map((e) => e.slice(6));
  for (const m of mundos) ok(propsDeEfecto(`mundo:${m}`).length > 0 || Object.hasOwn(MUNDO_SIN_PROP, m), `mundo:${m} tiene prop o una razón para no tenerlo`);
  for (const m of Object.keys(MUNDO_SIN_PROP)) ok(propsDeEfecto(`mundo:${m}`).length === 0 || m === 'galpon-luz-vuelve', `mundo:${m} está en la lista sin prop pero tiene uno`);
  for (const k of ['ramon-convaleciente', 'faroles-en-la-loma', 'mesa-con-mapa', 'puertita-nueva-en-la-raiz', 'arco-y-honda-en-la-pared', 'estacas-prestadas', 'galpon-luz-adentro']) ok(propsDeEfecto(`mundo:${k}`).length > 0, `mundo:${k} se dibuja`);
  ok(propsDeEfecto('duende:lucecitas-raices').includes('lucecitas-raices'), 'las lucecitas de las raíces se dibujan con el duende de la escena');
  // los efectos de los props existen en las escenas (las del acto III o las claves de B para las optativas)
  const EFECTOS_OK = new Set([...A3.EFECTOS_ACTO3, 'mundo:pan-de-rosa', 'mundo:ovejas-juntas']);
  for (const [id, o] of Object.entries(OP)) for (const e of [].concat(o.efecto || [])) ok(EFECTOS_OK.has(e) || /^mundo:galpon-luz-/.test(e), `${id}: su efecto ${e} existe en alguna escena`);
  // las formas: en historia-objetos.js (malla o brillo)
  const ho = fuente('historia-objetos.js');
  const bloque = (desde, hasta) => { const i = ho.indexOf(desde), j = ho.indexOf(hasta, i + 1); return i >= 0 && j > i ? ho.slice(i, j) : ''; };
  const nombres = (t) => new Set([...t.matchAll(/^ {2}'?([a-z-]+)'?: \(c(?:, info)?\) =>/gm)].map((m) => m[1]));
  const MALLAS = nombres(bloque('const FORMAS = {', 'const brilla = ')), BRILLOS = nombres(bloque('const FORMAS_BRILLO = {', 'const SIGUE_SUELO'));
  ok(MALLAS.size > 30 && BRILLOS.size >= 6, `las formas se leen de historia-objetos.js (${MALLAS.size} mallas, ${BRILLOS.size} brillos)`);
  // lo que brilla sin cuerpo (las lucecitas) sólo tiene brillo; lo demás tiene su malla (los faroles: las siluetas de los vecinos y el vidrio)
  for (const [id, o] of Object.entries(OP)) if (o.forma) ok(MALLAS.has(o.forma) || (o.brillo && /^lucecitas/.test(o.forma) && BRILLOS.has(o.forma)), `${id}: la forma «${o.forma}» existe en historia-objetos.js`);
  for (const [id, o] of Object.entries(OP)) if (o.brillo) ok(BRILLOS.has(o.forma), `${id}: lo que brilla de «${o.forma}» está en FORMAS_BRILLO`);
  for (const f of BRILLOS) ok(Object.values(OP).some((o) => o.forma === f && o.brillo), `el brillo «${f}» es de un prop que brilla`);
  // los lugares
  const LUG = new Set(D.LUGARES_HISTORIA);
  for (const [id, o] of Object.entries(OP)) {
    const tiene = (typeof o.punto === 'string' && LUG.has(o.punto)) || ['coihue', 'molino-viejo'].includes(o.lugar) || Number.isFinite(o.lx);
    ok(tiene || o.soloEscena || o.apaga, `${id}: tiene un lugar que existe (${o.punto || o.lugar || o.lx})`);
    if (o.punto) ok(LUG.has(o.punto), `${id}: el punto ${o.punto} es un lugar de la historia`);
    if (o.hacia) ok(LUG.has(o.hacia), `${id}: hacia ${o.hacia} es un lugar de la historia`);
    ok(!o.aviso && !o.escena && !o.marca && !o.pago && !o.cuidar, `${id}: no tiene acción de E (no le gana la E a nada)`);
    ok(!Object.hasOwn(D.OBJETOS, id) || D.OBJETOS[id] === o, `${id}: no pisa un objeto de historia de otro`);
  }
  // los enganches de A (historia-disparadores.js y main.js; los pone A en su rama: en la rama de C solos no están, y la prueba avisa sin fallar.
  // Juntadas las ramas, se exigen)
  {
    const disp = leer('src/historia-disparadores.js'), mainJs = leer('src/main.js');
    const enganches = [
      [/import \{ OBJETOS_PROPS_ACTO3 \} from '\.\/historia-props-acto3\.js';/.test(disp) && /\.\.\.OBJETOS_PROPS_ACTO3,/.test(disp), 'historia-disparadores.js suma los props a OBJETOS'],
      [/objetosHist\?\.efecto\?\.\(`mundo:\$\{id\}`, args\?\.donde != null \? escenasMundo\?\.mundo\?\.posicion\(args\.donde\) : null, jugador\?\.estado\)/.test(mainJs), 'main.js pasa los efectos mundo: a los objetos con dónde los pone la escena'],
      [/objetosHist\?\.efecto\?\.\(`duende:\$\{id\}`, null, jugador\?\.estado\)/.test(mainJs), 'main.js pasa los efectos duende: (las lucecitas)'],
      [/if \(k === 'fermin'\) \{ const q = ferminEnElTecho\(/.test(mainJs), 'main.js pone a Fermín en el techo en la noche'],
    ];
    const juntadas = /\.\.\.OBJETOS_PROPS_ACTO3,/.test(disp) || /ferminEnElTecho/.test(mainJs);
    for (const [si, texto] of enganches) { if (juntadas) ok(si, texto); else if (!callado && !sufijo) console.log(`  (enganche de A pendiente en esta rama: ${texto})`); }
  }
  // visibilidad, con el estado de verdad
  const cap = (id) => H.CAPITULOS ? H.CAPITULOS.findIndex((c) => c.id === id) : ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'].indexOf(id);
  const estado = (capId, o = {}) => {
    const h = H.historiaNueva();
    h.activa = true; h.capitulo = cap(capId);
    Object.assign(h.decisiones, { cuaderno: 'a', majada: 'a', coihue: 'a' }, o.decisiones || {});
    h.duendes = Object.assign(h.duendes || {}, { trato: 'trato', noche: 'pendiente', final: null }, o.duendes || {});
    for (const t of o.temas || []) { if (!h.temas) h.temas = {}; h.temas[t] = o.diaTema || 5; }
    for (const e of o.vistas || []) h.escenas.vistas[e] = 4;
    if (o.objetos) { h.objetos = {}; for (const x of o.objetos) h.objetos[x] = 4; }
    if (o.costumbre) h.costumbre = o.costumbre;
    const p = { historia: h, dia: o.dia || 5, horas: o.horas ?? 11 };
    return { s: H.estadoHistoria(p, {}), h };
  };
  const ve = (id, capId, o) => { const { s, h } = estado(capId, o); try { return !!OP[id].visible(s, h); } catch { return false; } };
  const CASOS = [
    // [prop, capítulo, opciones con las que se ve, opciones con las que no]
    ['hojas-canelo', 'frios', { temas: ['mundo:hojas-canelo'] }, { temas: [] }],
    ['corral-abierto', 'frios', { temas: ['mundo:corral-abierto'] }, { temas: ['mundo:corral-abierto', 'mundo:ovejas-juntas'] }],
    ['galpon-luz', 'golpea', { temas: ['mundo:galpon-luz-adentro'], horas: 22.5 }, { temas: ['mundo:galpon-luz-adentro'], horas: 22.5, vistas: ['galpon-trato'] }],
    ['galpon-luz', 'golpea', { temas: ['mundo:galpon-luz-adentro'], horas: 23 }, { temas: ['mundo:galpon-luz-adentro'], horas: 12 }],
    ['puertita-reves', 'golpea', { temas: ['mundo:puertita-al-reves'] }, { temas: [] }],
    ['ventana-barro', 'arco', { temas: ['mundo:ventana-barro-y-bellotas'] }, { temas: [] }],
    ['mapa-mesa', 'nevada', { temas: ['mundo:mesa-con-mapa'] }, { temas: ['mundo:mesa-con-mapa'], duendes: { noche: 'ganada' } }],
    ['arco-mesa', 'arco', { temas: ['mundo:arco-sin-cuerda'] }, { temas: ['mundo:arco-sin-cuerda'], duendes: { armas: { arco: true, honda: false } } }],
    ['puntas-mesa', 'arco', { temas: ['mundo:puntas-de-flecha'] }, { temas: [] }],
    ['flechas-atado', 'nevada', { temas: ['mundo:flechas-extra'] }, { temas: ['mundo:flechas-extra'], duendes: { noche: 'perdida' } }],
    ['campana-taller', 'arco', { temas: ['mundo:campana-del-taller'] }, { temas: ['mundo:campana-del-taller'], vistas: ['noche-espera'] }],
    ['pirca-alta', 'arco', { temas: ['mundo:pirca-reforzada'], objetos: ['pirca'] }, { temas: ['mundo:pirca-reforzada'] }],
    ['faroles-loma', 'nevada', { temas: ['mundo:faroles-en-la-loma'], horas: 22.5 }, { temas: ['mundo:faroles-en-la-loma'], horas: 22.5, decisiones: { cuaderno: 'b' } }],
    ['faroles-loma', 'nevada', { temas: ['mundo:faroles-en-la-loma'], horas: 2 }, { temas: ['mundo:faroles-en-la-loma'], horas: 13 }],
    ['lucecitas-raices', 'nevada', { vistas: ['noche-espera'], horas: 23 }, { vistas: ['noche-espera'], horas: 23, duendes: { trato: 'pelea' } }],
    ['lucecitas-raices', 'nevada', { vistas: ['noche-espera'], horas: 23 }, { horas: 23 }],
    ['cartel-catrileo', 'deshielo', { temas: ['mundo:cartel-puesto-catrileo'] }, { temas: [] }],
    ['cartel-notable', 'deshielo', { temas: ['mundo:cartel-arbol-notable'] }, { temas: [] }],
    ['puertita-nueva', 'deshielo', { temas: ['mundo:puertita-nueva-en-la-raiz'] }, { temas: [] }],
    ['puertitas-vacias', 'deshielo', { temas: ['mundo:puertitas-vacias'] }, { temas: [] }],
    ['bellota-derecha', 'deshielo', { temas: ['mundo:bellota-derecha'] }, { temas: [] }],
    ['ronda-final', 'deshielo', { temas: ['mundo:ronda-ramitas-final'] }, { temas: ['mundo:ronda-ramitas-final'], costumbre: { bolsa: 'vacia', cosechas: 0, regalos: 0, dia: 1 } }],
    ['bolsa-doblada', 'deshielo', { temas: ['mundo:bolsa-vacia-doblada'] }, { temas: ['mundo:bolsa-vacia-doblada'], costumbre: { bolsa: 'llena', cosechas: 0, regalos: 0, dia: 1 } }],
    ['regalito', 'deshielo', { temas: ['mundo:regalito-umbral'], diaTema: 5, dia: 5 }, { temas: ['mundo:regalito-umbral'], diaTema: 3, dia: 5 }],
    ['arco-honda-pared', 'deshielo', { temas: ['mundo:arco-y-honda-en-la-pared'] }, { temas: [] }],
    ['repisa-puertita', 'deshielo', { temas: ['mundo:puertita-repisa-abre'] }, { temas: [] }],
    ['repisa-canto', 'deshielo', { temas: ['mundo:canto-blanco-queda'] }, { temas: [] }],
    ['pan-umbral', 'mesa', { temas: ['mundo:pan-de-rosa'], diaTema: 4, dia: 6, horas: 8 }, { temas: ['mundo:pan-de-rosa'], diaTema: 2, dia: 6, horas: 8 }],
  ];
  for (const [id, c, si, no] of CASOS) {
    ok(Object.hasOwn(OP, id), `${id}: existe`);
    if (!Object.hasOwn(OP, id)) continue;
    ok(ve(id, c, si), `${id}: se ve cuando la historia lo dice (${JSON.stringify(si)})`);
    ok(!ve(id, c, no), `${id}: no se ve cuando no (${JSON.stringify(no)})`);
  }
  for (const id of ids) if (OP[id].soloEscena) ok(!ve(id, 'arco', { temas: [] }) && !ve(id, 'nevada', { temas: ids.map((k) => [].concat(OP[k].efecto || [])).flat().filter((e) => e.startsWith('mundo:')) }), `${id}: sólo existe durante su escena`);
  ok(ids.every((id) => !ve(id, 'llave', { temas: [] }) || id === 'pan-umbral'), 'en una historia que empieza no se ve ningún prop del acto III');

  // ---------------------------------------------------------------- 2. dónde van
  {
    const jug = { pos: { x: 10, y: 0, z: 20 }, yaw: 0 };   // mirando a −z
    const o = { frente: { adelante: 5, lado: 2 } };
    const p = puestoDeEfecto(o, null, jug);
    ok(p && cerca(p.x, 12) && cerca(p.z, 15), `sin «donde» va delante del jugador (${JSON.stringify(p)})`);
    ok(p && cerca(p.rot, Math.atan2(10 - 12, 20 - 15)), 'y mira al jugador');
    const q = puestoDeEfecto({ usaDonde: true }, { x: 3, z: 4 }, jug);
    ok(q && q.x === 3 && q.z === 4 && cerca(q.rot, Math.atan2(7, 16)), `con «donde» va donde dice la escena, mirando al jugador (${JSON.stringify(q)})`);
    ok(puestoDeEfecto({}, null, jug) === null, 'sin «donde» ni «frente», ninguno (usa su lugar fijo)');
    const h1 = puestoHacia({ punto: 'a', hacia: 'b', dist: 30 }, { a: { x: 0, z: 0 }, b: { x: 0, z: 100 } });
    ok(h1 && cerca(h1.x, 0) && cerca(h1.z, 30), `los faroles van a 30 m del galpón hacia la aldea (${JSON.stringify(h1)})`);
    const h2 = puestoHacia({ punto: 'a', hacia: 'b', dist: 30 }, { a: { x: 0, z: 0 }, b: { x: 0, z: 20 } });
    ok(h2 && h2.z <= 16.01, `y nunca más allá de la aldea (${JSON.stringify(h2)})`);
    ok(puestoHacia({ punto: 'a', hacia: 'b', dist: 30, dx: 2 }, { a: { x: 1, z: 1 } }).x === 3, 'sin el lugar de destino, en el punto con su corrimiento');
    const f = ferminEnElTecho({ x: 50, z: 60, rot: 0 }, () => 7, { ux: 1, uz: 0 });
    ok(f && cerca(f.y, 7 + TECHO_GALPONCITO.cumbrera) && cerca(f.x, 50) && cerca(f.z, 60.9) && cerca(f.rumbo, Math.PI / 2), `Fermín arriba de la cumbrera, mirando al lado de ataque (${JSON.stringify(f)})`);
    const f2 = ferminEnElTecho({ x: 0, z: 0, rot: Math.PI / 2 }, () => 0, null);
    ok(f2 && cerca(f2.x, 0.9) && cerca(f2.z, 0, 1e-9), 'la cumbrera corre a lo largo del galpón (gira con él)');
    ok(ferminEnElTecho(null, () => 0, null) === null, 'sin galponcito, Fermín queda donde lo pone la noche');
    ok(cerca(TECHO_GALPONCITO.cumbrera, 2.3 + 1.2, 0.05), 'la cumbrera del galponcito es la de construccion.js (alto 2,3 + 1,2)');
    ok(/alto: 2\.3,/.test(leer('src/construccion.js')) && /H \+ 1\.2, -D \/ 2 - 0\.3\]/.test(leer('src/construccion.js')), 'construccion.js sigue con esa cumbrera');
  }

  // ---------------------------------------------------------------- 3. Ramón sentado y el ancla del techo (por conducta)
  {
    const EM = await imp('escenas-mundo.js');
    const { pj3 } = await import(pathToFileURL(join(raiz, 'src', 'historia-escenas-acto3-util.js')).href);
    const v3 = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; } });
    const ramon = { clave: 'ramon', pos: v3(0, 0, -3), g: { visible: true, rotation: { x: 0, y: 0 } }, pose: 'mate', asiento: undefined };
    const fermin = { clave: 'fermin', pos: v3(5, 0, 5), g: { visible: true, rotation: { x: 0, y: 0 } } };
    const camara = { position: v3(0, 1.6, 0), rotation: { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
    const progreso = { horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } };
    let puntos = { 'galpon-noche': { x: 20, z: 20 }, 'galpon-propio': { x: 20, z: 20 } };
    const em = EM.crearEscenasMundo({
      doc: null, gente: () => ({ gente: [ramon, fermin] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), camara, T: { altura: () => 10, lugares: {} }, col: { resolver() {} },
      progreso: () => progreso, clima: () => null, sonido: {}, modo: () => 'jugando', ajustes: () => ({ fov: 70 }), puntos: () => puntos,
    });
    const r = em.mundo.posicion({ lugar: 'galpon-noche', techo: true });
    ok(r && cerca(r.y, 10 + EM.CUMBRERA_GALPONCITO), `el ancla «techo» queda arriba de la cumbrera (${JSON.stringify(r)})`);
    ok(cerca(EM.CUMBRERA_GALPONCITO, TECHO_GALPONCITO.cumbrera), 'la misma cumbrera en escenas-mundo.js y en historia-props-acto3.js');
    puntos = { 'galpon-noche': { x: 20, z: 20 } };
    const r2 = em.mundo.posicion({ lugar: 'galpon-noche', techo: true });
    ok(r2 && r2.y === undefined, 'sin galponcito (el galpón de la noche es la puerta del refugio), en el suelo');
    puntos = { 'galpon-noche': { x: 20, z: 20 }, 'galpon-propio': { x: 20, z: 20 } };
    ok(em.mundo.posicion({ lugar: 'galpon-noche' }).y === undefined, 'sin «techo», el ancla de siempre');
    em.registrar({ id: 'prueba-sentado', repetible: true, personajes: pj3('ramon', 'fermin'), pasos: [
      { tipo: 'gesto', quien: 'ramon', accion: 'aparecer', a: { x: 0, z: -3 } },
      { tipo: 'gesto', quien: 'ramon', accion: 'posar', pose: 'sentado', dur: 0.3, sinEsperar: true },
      { tipo: 'gesto', quien: 'fermin', accion: 'aparecer', a: { lugar: 'galpon-noche', techo: true } },
      { tipo: 'gesto', quien: 'ramon', accion: 'posar', pose: 'tocar', dur: 0.6 },
      { tipo: 'gesto', quien: 'ramon', accion: 'posar', pose: 'cruzados', dur: 0.6 },
      { tipo: 'espera', dur: 30 },
    ] });
    ok(em.disparar('prueba-sentado') === true, 'la escena de prueba arranca');
    let mientras = true, enTocar = null;
    for (let i = 0; i < 60; i++) { em.actualizar(1 / 30); if (i > 4 && ramon.pose !== 'sentado') mientras = false; if (i === 20) enTocar = ramon.pose; }
    ok(mientras && ramon.pose === 'sentado' && ramon.asiento === 0.47, `Ramón queda sentado toda la escena (pose ${ramon.pose}, asiento ${ramon.asiento})`);
    ok(enTocar === 'sentado', 'un gesto del juego que ocupa el cuerpo no lo levanta');
    ok(cerca(fermin.pos.y, 10 + EM.CUMBRERA_GALPONCITO), `Fermín aparece arriba del techo (y = ${fermin.pos.y})`);
    em.saltar();
    for (let i = 0; i < 90; i++) em.actualizar(1 / 30);
    ok(ramon.pose === 'mate' && ramon.asiento === undefined, `al terminar, Ramón vuelve a lo suyo (${ramon.pose})`);
    ok(/'sentado', 'parado'\]/.test(fuente('escenas.js')), 'el motor de escenas conoce las poses «sentado» y «parado»');
  }

  // ---------------------------------------------------------------- 4. las escenas tocadas
  {
    const E3 = A3.ESCENAS_ACTO3;
    const pasos = (id) => { const l = []; const r = (p) => { l.push(p); if (p.tipo === 'fundido') (p.alMedio || []).forEach(r); }; E3[id].pasos.forEach(r); return l; };
    const iDe = (id, f) => pasos(id).findIndex(f);
    const rc = (f) => iDe('ramon-cama', f);
    const iSent = rc((p) => p.tipo === 'gesto' && p.quien === 'ramon' && p.pose === 'sentado');
    const iManta = rc((p) => p.tipo === 'efecto' && p.nombre === 'mundo:ramon-convaleciente');
    const iDlg = rc((p) => p.tipo === 'dialogo' && p.quien !== 'narra');
    ok(iSent >= 0 && iManta > iSent && iManta < iDlg, `ramon-cama: Ramón se sienta y la manta y la estufa están antes de que hablen (${iSent}, ${iManta}, ${iDlg})`);
    ok(pasos('ramon-cama').filter((p) => p.tipo === 'efecto' && p.nombre === 'mundo:ramon-convaleciente').length === 1, 'ramon-cama: el efecto se aplica una vez');
    const ap = pasos('noche-espera').find((p) => p.tipo === 'gesto' && p.accion === 'aparecer' && p.quien === 'fermin');
    ok(ap && ap.a && ap.a.lugar === 'galpon-noche' && ap.a.techo === true, 'noche-espera: Fermín aparece en el techo del galpón');
    ok(pasos('noche-espera').some((p) => p.tipo === 'gesto' && p.quien === 'ramon' && p.pose === 'sentado'), 'noche-espera: Ramón sentado en su cajón');
    ok(pasos('noche-tras-ganar').every((p) => !(p.tipo === 'gesto' && p.quien === 'fermin' && p.a && p.a.techo)), 'al amanecer Fermín ya bajó del techo');
    const uf = (f) => iDe('umbral-fin', f);
    const iCorte = uf((p) => p.tipo === 'plano' && p.a && p.a.lugar === 'molino-viejo');
    const iPuert = uf((p) => p.tipo === 'efecto' && p.nombre === 'mundo:puertita-nueva-en-la-raiz');
    const iVuelve = uf((p, i) => p.tipo === 'plano' && p.plano === 'picado' && i > iCorte);
    ok(iCorte > 0 && iPuert >= 0 && iPuert < iCorte, `umbral-fin: la puertita nueva está antes del corte a la raíz (${iPuert}, ${iCorte})`);
    ok(iVuelve > iCorte, 'umbral-fin: y después vuelve al umbral');
    ok(uf((p) => p.tipo === 'plano' && p.plano === 'paneo' && JSON.stringify(p.hasta || '').includes('frente')) < 0, 'umbral-fin: ya no hay paneo al vacío (30 m delante del umbral)');
    const iVacio = uf((p) => p.tipo === 'dialogo' && /El umbral está vacío/.test(JSON.stringify(p.lineas)));
    ok(iVacio >= 0 && iVacio < iCorte, 'umbral-fin (pelea): el umbral vacío se cuenta antes del corte');
    // con la pelea se saltea la puertita nueva (era sólo del coihue: salían las dos cosas) y Herminia está en la aldea, no delante tuyo
    const top = E3['umbral-fin'].pasos;
    const iSalto = top.findIndex((p) => p.tipo === 'salto' && p.a === 'raiz-pelea' && p.si && p.si.cond === 'trato' && p.si.args.es === 'pelea');
    const iEtq = top.findIndex((p) => p.etiqueta === 'raiz-pelea');
    const iNueva = top.findIndex((p) => p.tipo === 'dialogo' && /puertita nueva, de madera clara/.test(JSON.stringify(p.lineas)));
    ok(iSalto >= 0 && iNueva > iSalto && iEtq > iNueva, `umbral-fin: con la pelea se saltea la puertita nueva (${iSalto}, ${iNueva}, ${iEtq})`);
    const her = pasos('umbral-fin').find((p) => p.tipo === 'gesto' && p.quien === 'herminia' && p.accion === 'aparecer');
    ok(her && her.a && her.a.lugar === 'casa-herminia', 'umbral-fin: Herminia aparece en la puerta de su casa');
    const det = pasos('costumbre-regalito').find((p) => p.tipo === 'plano' && p.plano === 'detalle');
    ok(det && det.miraY <= 0.2, 'costumbre-regalito: el detalle mira el escalón');
  }

  // ---------------------------------------------------------------- 5. la colocación
  {
    const COL = await imp('historia-colocacion.js');
    const LUG = new Set([...D.LUGARES_HISTORIA, 'galpon-noche']);
    for (const id of ['ramon-cama', 'papel-elsa', 'galpon-golpe', 'galpon-sin-golpear', 'mesa-guerra', 'llave-79', 'pedir-perdon', 'noche-espera', 'majada-fin', 'josefina-fin', 'umbral-fin', 'costumbre-dejar', 'costumbre-regalito', 'prestado-tobias']) {
      const c = COL.COLOCACION_PULIDO[id];
      ok(!!c, `${id}: tiene colocación`);
      if (!c) continue;
      ok(COL.validarColocacion(c).ok, `${id}: la colocación es válida (${COL.validarColocacion(c).errores})`);
      if (c.punto) ok(LUG.has(c.punto), `${id}: su punto ${c.punto} existe`);
      if (c.desde && c.desde !== 'frente') ok(LUG.has(c.desde), `${id}: su lado ${c.desde} existe`);
      ok(Object.hasOwn(D.COLOCACION_ESCENA, id) && D.COLOCACION_ESCENA[id] === c, `${id}: el juego la usa (COLOCACION_ESCENA)`);
    }
  }

  // ---------------------------------------------------------------- 6. programas: por texto
  {
    const mats = [...ho.matchAll(/new THREE\.(\w+Material)\(([^)]*)\)/g)].map((m) => `${m[1]}(${m[2]})`);
    ok(mats.length === 1 && mats[0] === 'MeshBasicMaterial({ vertexColors: true })', `historia-objetos.js sólo arma un material propio, el de las brasas de la aldea (${mats.join(' | ')})`);
    ok(/brasas: new THREE\.MeshBasicMaterial\(\{ vertexColors: true \}\)/.test(leer('src/aldea-mundo.js')), 'y las brasas de la aldea siguen con ese material (el programa ya está desde la carga)');
    ok(/const mat = materialVegetal\(\{ flex: 0 \}\);/.test(ho), 'lo demás, con el material de las estructuras');
    ok(!/Light\(/.test(ho) && !/Light\(/.test(fuente('historia-props-acto3.js')), 'ninguna luz');
    ok(/b\.castShadow = false; b\.receiveShadow = false;/.test(ho) && /m\.castShadow = false; m\.receiveShadow = true;/.test(ho), 'nada nuevo en el mapa de sombras (ningún programa de profundidad)');
    ok(!/import .*three/.test(fuente('historia-props-acto3.js')), 'historia-props-acto3.js es puro (sin three)');
  }
  return fallas - f0;
}

// ---------------------------------------------------------------- el módulo real
{
  const f = await suite();
  ok(true, `la suite sobre los módulos reales (${f} fallas)`);
}

// ---------------------------------------------------------------- mutaciones
const MUTACIONES = [
  ['historia-props-acto3.js', 'la manta de Ramón no sale con su efecto', "efecto: 'mundo:ramon-convaleciente'", "efecto: 'mundo:otra-cosa'"],
  ['historia-props-acto3.js', 'los faroles se ven con cualquier decisión', "s.decisiones.cuaderno === 'a' && deNoche(s)", 'deNoche(s)'],
  ['historia-props-acto3.js', 'los faroles se ven de día', "const deNoche = (s) => s.horas >= 19 || s.horas < 6.5;", 'const deNoche = () => true;'],
  ['historia-props-acto3.js', 'las lucecitas se ven en la pelea', "s.trato === 'trato' && s.escenas.has('noche-espera')", "s.escenas.has('noche-espera')"],
  ['historia-props-acto3.js', 'el corral no se cierra al juntar las ovejas', " && !tema(s, 'ovejas-juntas') }", ' }'],
  ['historia-props-acto3.js', 'un mundo: sin prop ni razón', "  'cobro-majada': 'mecánica: el pago',\n", ''],
  ['historia-props-acto3.js', 'el mapa sigue en la mesa después de la noche', "tema(s, 'mesa-con-mapa') && antesDeLaNoche(s)", "tema(s, 'mesa-con-mapa')"],
  ['historia-props-acto3.js', 'el regalito queda para siempre', "diaDeTema(h, 'regalito-umbral') === s.dia", 'true'],
  ['historia-props-acto3.js', 'un prop de escena queda después de la escena', "'estacas-escena': { forma: 'estacas', soloEscena: true, usaDonde: true, efecto: 'mundo:estacas-prestadas', visible: () => false },", "'estacas-escena': { forma: 'estacas', soloEscena: true, usaDonde: true, efecto: 'mundo:estacas-prestadas', visible: (s) => tema(s, 'estacas-prestadas') },"],
  ['historia-props-acto3.js', 'el prop de escena no mira al jugador', 'return { x: q.x, z: q.z, rot: Math.atan2(j.x - q.x, j.z - q.z) };', 'return { x: q.x, z: q.z, rot: 0 };'],
  ['historia-props-acto3.js', 'sin «donde» no va delante del jugador', 'q = { x: j.x + fx * a - fz * l, z: j.z + fz * a + fx * l };', 'q = { x: j.x, z: j.z };'],
  ['historia-props-acto3.js', 'los faroles se pasan de la aldea', 'k = Math.min(Number(o.dist) || 10, d * 0.8), l', 'k = Number(o.dist) || 10, l'],
  ['historia-props-acto3.js', 'Fermín en el suelo', 'return { x, y: suelo + TECHO_GALPONCITO.cumbrera, z, rumbo };', 'return { x, y: suelo, z, rumbo };'],
  ['historia-props-acto3.js', 'Fermín no mira al lado de ataque', 'const rumbo = Number.isFinite(ux) && Number.isFinite(uz) && (ux || uz) ? Math.atan2(ux, uz) : rot;', 'const rumbo = rot;'],
  ['historia-props-acto3.js', 'la cumbrera no gira con el galpón', 'const lz = 0.9, x = galpon.x + lz * Math.sin(rot), z = galpon.z + lz * Math.cos(rot);', 'const lz = 0.9, x = galpon.x, z = galpon.z + lz;'],
  ['escenas-mundo.js', 'un gesto del juego levanta a Ramón', "if (POSES_DEL_JUEGO.has(pose) && !c.base) n.pose = pose;", 'if (POSES_DEL_JUEGO.has(pose)) n.pose = pose;'],
  ['escenas-mundo.js', 'la altura pedida no se respeta', 'n.pos.set(p.x, Number.isFinite(p.y) && p.y > piso + 1.2 ? p.y : piso, p.z);', 'n.pos.set(p.x, piso, p.z);'],
  ['escenas-mundo.js', 'el ancla del techo sin galponcito flota', "&& lugarDe('galpon-propio') && ctx.T?.altura) q.y", '&& ctx.T?.altura) q.y'],
  ['historia-objetos.js', 'un material nuevo para lo que brilla', 'if (!matBrillo) matBrillo = new THREE.MeshBasicMaterial({ vertexColors: true });', 'if (!matBrillo) matBrillo = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true });'],
  ['historia-objetos.js', 'lo que brilla hace sombra', 'b.castShadow = false; b.receiveShadow = false;', 'b.castShadow = true; b.receiveShadow = false;'],
  ['historia-objetos.js', 'falta la forma de los faroles', '  faroles: (c, info) => {\n    for (let i = 0; i < 12; i++) {\n      const x = (i - 5.5) * 2.1 + Math.sin(i * 1.7) * 0.4, z = Math.sin(i * 0.9) * 1.2, y = info.suelo(x, z), chico', '  farolitos: (c, info) => {\n    for (let i = 0; i < 12; i++) {\n      const x = (i - 5.5) * 2.1 + Math.sin(i * 1.7) * 0.4, z = Math.sin(i * 0.9) * 1.2, y = info.suelo(x, z), chico'],
  ['historia-colocacion.js', 'ramon-cama sin colocación', "  'ramon-cama':", "  'ramon-cama-no':"],
  ['historia-escenas-acto3-c9.js', 'la manta aparece al final de la escena', "    efecto('mundo:ramon-convaleciente', { donde: FRENTE(3, 0.8) }),\n    pose('ramon', 'cruzarse', { dur: 1.6 }),", "    pose('ramon', 'cruzarse', { dur: 1.6 }),"],
  ['historia-escenas-acto3-c12.js', 'Fermín en el suelo en la espera', "espera ? { lugar: 'galpon-noche', techo: true } : FRENTE(7, -5)", 'FRENTE(7, -5)'],
];
{
  let atrapadas = 0, probadas = 0;
  const antes = callado;
  // las escenas del acto III se importan por el juntador (historia-escenas-acto3.js): al mutar una de ellas, una copia del juntador apunta al mutante
  const JUNTA = 'historia-escenas-acto3.js';
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [arch, nombre, de, a] = MUTACIONES[i];
    const origen = leer(`src/${arch}`);
    const cuantas = origen.split(de).length - 1;
    ok(cuantas === 1, `la mutación «${nombre}» encuentra su lugar una vez en ${arch} (${cuantas})`);
    if (cuantas !== 1) continue;
    probadas++;
    const sufijo = `-mut18c${i}`;
    const copia = join(raiz, 'src', arch.replace('.js', `${sufijo}.js`));
    writeFileSync(copia, origen.replace(de, () => a));
    const extra = [];
    try {
      let fallo = false;
      callado = true;
      const f1 = fallas;
      if (/^historia-escenas-acto3-c\d+\.js$/.test(arch)) {
        // el juntador mutado y una suite que lo usa
        const j = join(raiz, 'src', JUNTA.replace('.js', `${sufijo}.js`));
        writeFileSync(j, leer(`src/${JUNTA}`).replace(`'./${arch}'`, () => `'./${arch.replace('.js', `${sufijo}.js`)}'`));
        extra.push(j);
        const A3m = await import(pathToFileURL(j).href);
        const E3 = A3m.ESCENAS_ACTO3;
        const ps = (id) => { const l = []; const r = (p) => { l.push(p); if (p.tipo === 'fundido') (p.alMedio || []).forEach(r); }; E3[id].pasos.forEach(r); return l; };
        const iM = ps('ramon-cama').findIndex((p) => p.tipo === 'efecto' && p.nombre === 'mundo:ramon-convaleciente'), iD = ps('ramon-cama').findIndex((p) => p.tipo === 'dialogo');
        const ap = ps('noche-espera').find((p) => p.tipo === 'gesto' && p.accion === 'aparecer' && p.quien === 'fermin');
        fallo = !(iM >= 0 && iM < iD) || !(ap && ap.a && ap.a.techo === true);
      } else {
        try { await suite(sufijo, arch); fallo = fallas > f1; } catch { fallo = true; }
      }
      fallas = f1;
      callado = antes;
      if (fallo) atrapadas++;
      ok(fallo, `la prueba atrapa la mutación: ${nombre}`);
    } finally { rmSync(copia, { force: true }); for (const e of extra) rmSync(e, { force: true }); }
  }
  ok(atrapadas === probadas && probadas === MUTACIONES.length, `se atraparon ${atrapadas} de ${MUTACIONES.length} mutaciones`);
  console.log(`  (${atrapadas} mutaciones atrapadas)`);
}

console.log(`verificar-4-18-0-pulido-c: ${n} comprobaciones, ${fallas} fallas`);
if (fallas) process.exit(1);
