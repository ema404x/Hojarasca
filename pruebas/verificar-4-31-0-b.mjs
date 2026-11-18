// 4.31.0 (B): el pueblo y la gente, al detalle (pueblo-detalles.js, pueblo-detalles-juego.js, pueblo-detalles-pose.js), sin Electron:
//   1. las reglas: el saludo (cerca y mirándolo, una vez cada tanto), el choque y la queja, el clima en la gente, quién está en cada
//      casa (con la aldea de verdad), la luz y el humo de cada edificio, golpear la puerta, la llave de la luz, la campana de la
//      escuela, los carteles y el guardado (saneado: una partida vieja carga igual);
//   2. la tecla E y el aviso (interacciones.js): la entrada «pueblo» va después del vecino y antes de la puerta;
//   3. el módulo en un mundo de mentira: saluda, se queja, golpeás, apagás la luz (se queja y la vuelve a prender), leés el cartel,
//      acariciás al perro, suena la campanita al entrar, la campana de la escuela, se sacuden la nieve y se tapan de la lluvia;
//   4. las poses (con figuras de mentira) y los enganches (gente.js, aldea-mundo.js, main.js, guardado.js).
// Con mutaciones de verdad (un proceso por mutación: `--mutacion=<id>`).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const MUT = (process.argv.find((a) => a.startsWith('--mutacion=')) || '').slice(11);

// ---------------------------------------------------------------- las mutaciones (el texto que cambian; cada una tiene que hacer fallar algo)
const MUTACIONES = {
  'saluda-de-espaldas': ['src/pueblo-detalles.js', '&& mira > S.mira &&', '&& mira > -2 &&'],
  'saluda-siempre': ['src/pueblo-detalles.js', 't - ultimo >= S.cadaVecino', 't - ultimo >= 0'],
  'choque-caminando': ['src/pueblo-detalles.js', 'velocidad: 1.6, cada: 6', 'velocidad: 0, cada: 6'],
  'nieve-es-lluvia': ['src/pueblo-detalles.js', "return invierno > 0.5 ? 'nieve' : 'lluvia';", "return 'lluvia';"],
  'luz-sin-nadie': ['src/pueblo-detalles.js', ': o.dormidos.length ? PUEBLO.luz.velador : 0;', ': o.dormidos.length ? PUEBLO.luz.velador : 1;'],
  'apagada-no-cuenta': ['src/pueblo-detalles.js', "if (objeto(apagadas) && Object.hasOwn(apagadas, id)) return 0;", ''],
  'humo-siempre': ['src/pueblo-detalles.js', 'export const hayHumo = (id, ocup) => SIEMPRE_PRENDIDOS.has(id) ||', 'export const hayHumo = (id, ocup) => true ||'],
  'puerta-sin-dormidos': ['src/pueblo-detalles.js', "if (o.dormidos.length) return { tipo: 'duerme'", "if (false) return { tipo: 'duerme'"],
  'campana-domingo': ['src/pueblo-detalles.js', 'if (diaSemanaDe(dia) >= 5 ||', 'if ('],
  'saneo-flojo': ['src/pueblo-detalles.js', 'if (!esEdificioAldea(k) || !tieneLlave(k)) continue;', ''],
  'prende-enseguida': ['src/pueblo-detalles-juego.js', 'const esperan = new Set(pendientes.filter((q) => q.luz).map((q) => q.luz));', 'const esperan = new Set();'],
  'golpe-sin-espera': ['src/pueblo-detalles-juego.js', '> PUEBLO.golpe.valido) {', '> -1) {'],
  'llave-tapa-puerta': ['src/pueblo-detalles-juego.js', '&& m.cos > mPuerta.cos) {', ') {'],
  'sin-campanita': ['src/pueblo-detalles-juego.js', 'campanita({ x: js.pos.x, y: js.pos.y + 2, z: js.pos.z });', ''],
  'sin-sacudir': ['src/pueblo-detalles-juego.js', "if (ed && previo === null && clima === 'nieve' && !g.enEscena)", 'if (false)'],
  'perro-sin-caricia': ['src/pueblo-detalles-juego.js', 'if (!ctx.animales?.()?.acariciar?.(perro.id, PUEBLO.perro.extra, js.pos)) return;', ''],
  'taparse-parado': ['src/pueblo-detalles-pose.js', "if (id === 'taparse' && !andando) id = null;", ''],
  'pueblo-despues-de-puerta': ['src/interacciones.js', "    id: 'pueblo', ...delModulo('pueblo', () => true),", "    id: 'pueblo-no', ...delModulo('pueblo', () => true),"],
  'perro-no-gana-al-banco': ['src/interacciones.js', "return a && (!c.objetivo || a.tipo === 'perro') ? a : null;", "return a && !c.objetivo ? a : null;"],
  'sin-luz-por-casa': ['src/aldea-mundo.js', 'encendido * 1.5 * q.fuerza * fe)', 'encendido * 1.5 * q.fuerza)'],
  'humo-sin-filtro': ['src/aldea-mundo.js', 'const todas = [...conGente,', 'const todas = [...chimeneas,'],
  'sin-escalon': ['src/aldea-arquitectura.js', "K.asiento('el escalón del mástil', 0, 0.25, ZM + 0.86, 0);", ''],
  'sin-buzon': ['src/aldea-arquitectura.js', '  if (P.buzon) N.buzon = copia(P.buzon);', ''],
  'boletin-de-hoy': ['src/pueblo-detalles.js', 'const hoy = Math.max(1, entero(dia, 1)), ayer = hoy - 1;', 'const hoy = Math.max(1, entero(dia, 1)), ayer = hoy;'],
  'aljibe-sin-tocar': ['src/aldea-mecanicas-mundo.js', "if (e.tipo === 'aljibe' && yaHoy(m, 'aljibe', dia())) return 'Mojarte las manos en el aljibe';", ''],
  'halos-de-todas': ['src/aldea-mundo.js', 'for (const v of sinLuz(b) ? [] : d.ventanas || [])', 'for (const v of d.ventanas || [])'],
};

// ---------------------------------------------------------------- el padre: corre la prueba y cada mutación en su proceso
if (!MUT && !process.argv.includes('--sin-mutaciones')) {
  const correr = (args) => new Promise((res) => execFile(process.execPath, [fileURLToPath(import.meta.url), ...args], { cwd: raiz, maxBuffer: 1 << 24 }, (err, out, errOut) => res({ ok: !err, out: String(out), err: String(errOut) })));
  const base = await correr(['--sin-mutaciones']);
  process.stdout.write(base.out);
  if (!base.ok) { console.error(base.err); process.exit(1); }
  const ids = Object.keys(MUTACIONES);
  for (const id of ids) { const [f, a] = MUTACIONES[id]; assert.ok(leer(f).includes(a), `mutación «${id}»: el texto a cambiar existe en ${f}`); }
  const res = [];
  for (let i = 0; i < ids.length; i += 4) res.push(...await Promise.all(ids.slice(i, i + 4).map(async (id) => ({ id, r: await correr(['--mutacion=' + id]) }))));
  let malas = 0;
  for (const { id, r } of res) {
    const falla = !r.ok;
    if (!falla) malas++;
    console.log(`${falla ? '✓' : '✗'} mutación «${id}» ${falla ? 'hace fallar la prueba' : 'NO hace fallar nada'}${falla ? ' (' + (r.err.match(/AssertionError[^\n]*\n?[^\n]*/)?.[0] || r.err.split('\n')[0]).replace(/\s+/g, ' ').slice(0, 150) + ')' : ''}`);
  }
  if (malas) { console.error(`${malas} mutaciones no se detectan`); process.exit(1); }
  console.log(`OK 4.31.0 (B) · ${ids.length} mutaciones detectadas`);
  process.exit(0);
}

// ---------------------------------------------------------------- el hijo: los módulos (con la mutación, una copia de src con otro nombre)
let SRC = path.join(raiz, 'src');
if (MUT) {
  const [f, a, b] = MUTACIONES[MUT];
  SRC = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4310b-'));
  for (const n of fs.readdirSync(path.join(raiz, 'src'))) if (n.endsWith('.js')) fs.copyFileSync(path.join(raiz, 'src', n), path.join(SRC, n));
  const abs = path.join(SRC, path.basename(f));
  fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace(a, b));
  process.on('exit', () => { try { fs.rmSync(SRC, { recursive: true, force: true }); } catch { /* nada */ } });
}
const fuente = (f) => fs.readFileSync(path.join(SRC, path.basename(f)), 'utf8');
if (MUT) { const [f, a, b] = MUTACIONES[MUT]; const abs = path.join(raiz, f); globalThis.__cambiarFuente = (archivo, texto) => (path.resolve(archivo) === path.resolve(abs) ? texto.replace(a, b) : texto); }
const importar = (n) => import(pathToFileURL(path.join(SRC, n)).href);
const PD = await importar('pueblo-detalles.js');
const { crearPuebloDetalles } = await importar('pueblo-detalles-juego.js');
const POSE = await importar('pueblo-detalles-pose.js');
const IX = await importar('interacciones.js');
const A = await importar('aldea.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const igual = (a, b, t) => { pasos++; assert.equal(a, b, t); };

// ---------------------------------------------------------------- 1. las reglas
{
  // el saludo
  ok(PD.leToca(3, 0.95, 1000), 'a 3 m y mirándolo, te saluda');
  ok(!PD.leToca(3, 0.2, 1000), 'de costado, no');
  ok(!PD.leToca(9, 0.99, 1000), 'a 9 m, no');
  ok(!PD.leToca(3, 0.99, 1000, 1000 - 30), 'el mismo vecino no te saluda de nuevo a los 30 s');
  ok(PD.leToca(3, 0.99, 1000, 1000 - 200), 'a los 200 s, sí');
  ok(!PD.leToca(3, 0.99, 1000, -Infinity, 998), 'ni dos vecinos en el mismo par de segundos');
  ok(/Buen día/.test(PD.saludoPara(8.5, null, 0)) && /tardes|Buenas|Hola/.test(PD.saludoPara(15, null, 0)) && /noches|Buenas/.test(PD.saludoPara(22, null, 0)), 'el saludo según la hora');
  ok(/llover|día|chaparrón/.test(PD.saludoPara(15, 'lluvia', 0)) && /resbala|hiela|nevada/.test(PD.saludoPara(15, 'nieve', 1)), 'y según el tiempo');
  ok(/Hola/.test(PD.saludoPara(15, null, 0, true)), 'los chicos dicen «¡Hola!»');
  // el choque
  ok(PD.loChocaste(0.4, 3, true) && !PD.loChocaste(0.4, 0.8, true) && !PD.loChocaste(1.2, 3, true) && !PD.loChocaste(0.4, 3, false), 'chocarlo es tocarlo yendo rápido hacia él (caminando despacio, o alejándote, no)');
  ok(PD.quejaChoque(1, 0) !== PD.quejaChoque(3, 0) && /Otra vez|Basta|propósito/.test(PD.quejaChoque(3, 0)), 'a la tercera seguida se enoja');
  igual(PD.animQueja(1), 'sorprenderse', 'la primera, se sorprende'); igual(PD.animQueja(3), 'cruzarse-brazos', 'la tercera, se cruza de brazos');
  // el clima en la gente
  igual(PD.climaDeGente(0.8, 0.1), 'lluvia', 'lluvia'); igual(PD.climaDeGente(0.8, 0.9), 'nieve', 'con invierno, nieve'); igual(PD.climaDeGente(0, 0.9), 'frio', 'invierno sin lluvia: frío'); igual(PD.climaDeGente(0, 0), null, 'verano: nada');
  igual(PD.gestoDeClima('lluvia', { andando: true }), 'taparse', 'caminando bajo la lluvia se tapa'); igual(PD.gestoDeClima('lluvia', { andando: true, bajoTecho: true }), null, 'bajo techo no');
  igual(PD.gestoDeClima('frio', { andando: false }), 'frotarse', 'parado al frío se frota las manos'); igual(PD.gestoDeClima('frio', { andando: false, pose: 'sentado' }), null, 'sentado en lo suyo, no');
  // quién está en cada casa (la aldea de verdad: a las 3 duermen, a las 21 están despiertos en casa)
  const a = A.aldeaNueva();
  const o3 = PD.ocupacion(a, 3, 3), o21 = PD.ocupacion(a, 21, 3);
  ok(o3.get('casa-nelida')?.dormidos.includes('nelida') && !o3.get('casa-nelida').despiertos.length, 'a las 3, Nélida duerme en su casa');
  ok(o21.get('casa-nelida')?.despiertos.includes('nelida'), 'a las 21, está despierta en su casa');
  ok(o3.get('casa-familia')?.dormidos.length === 4, 'los Jones, los cuatro en la cama');
  ok(!o21.has('biblioteca') && !o21.has('plaza'), 'la biblioteca de noche, vacía (y la plaza no es una casa)');
  // con lo que dice aldea-gente.js (lo que eligió en su tiempo libre) manda eso
  const oDest = PD.ocupacion(a, 21, 3, { destinoDe: (k) => (k === 'nelida' ? { edificio: 'casa-te', punto: 'mesa-3', adentro: true } : null) });
  ok(oDest.get('casa-te')?.despiertos.includes('nelida') && !oDest.get('casa-nelida'), 'si se fue a tomar el té, está en la casa de té y no en su casa');
  // la luz y el humo
  igual(PD.luzDeEdificio('casa-nelida', o21), 1, 'despierta: la luz entera'); igual(PD.luzDeEdificio('casa-nelida', o3), PD.PUEBLO.luz.velador, 'dormida: el velador');
  igual(PD.luzDeEdificio('biblioteca', o21), 0, 'sin nadie: apagada');
  igual(PD.luzDeEdificio('casa-nelida', new Map([['casa-nelida', { despiertos: [], dormidos: [] }]])), 0, 'con la lista vacía, también'); igual(PD.luzDeEdificio('estacion-aldea', new Map()), 1, 'la estación, siempre');
  igual(PD.luzDeEdificio('casa-nelida', o21, { 'casa-nelida': 4 }), 0, 'la que apagaste vos, apagada');
  ok(PD.hayHumo('casa-nelida', o3) && !PD.hayHumo('biblioteca', o21), 'humo donde hay alguien (aunque duerma), no donde no hay nadie');
  // golpear la puerta
  ok(PD.seGolpea('casa-nelida') && !PD.seGolpea('panaderia') && !PD.seGolpea('nada'), 'se golpean las puertas de las casas');
  igual(PD.respuestaPuerta('casa-nelida', o21, 21, 0, () => 'Nélida').tipo, 'abre', 'despierta: contesta');
  ok(/Nélida/.test(PD.respuestaPuerta('casa-nelida', o21, 21, 0, () => 'Nélida').texto), 'y dice quién');
  igual(PD.respuestaPuerta('casa-nelida', o21, 23.5, 0).tipo, 'tarde', 'a las 23:30, que vuelvas mañana');
  igual(PD.respuestaPuerta('casa-nelida', o3, 3, 0).tipo, 'duerme', 'durmiendo: nadie contesta (se oye roncar)');
  igual(PD.respuestaPuerta('biblioteca', o21, 21, 0).tipo, 'nadie', 'vacía: nadie');
  // la llave
  ok(PD.tieneLlave('casa-nelida') && PD.tieneLlave('panaderia') && !PD.tieneLlave('estacion-aldea') && !PD.tieneLlave('plaza'), 'llave en casas y locales; la estación y la plaza, no');
  const e = PD.puebloNuevo();
  ok(PD.cambiarLuz(e, 'casa-nelida', 5) && e.apagadas['casa-nelida'] === 5, 'apagar la luz la anota');
  ok(!PD.cambiarLuz(e, 'casa-nelida', 5) && !('casa-nelida' in e.apagadas), 'y prenderla la borra');
  PD.cambiarLuz(e, 'biblioteca', 5);
  igual(PD.volvieron(e, o21).length, 0, 'la biblioteca sigue apagada mientras no vuelva nadie');
  PD.cambiarLuz(e, 'casa-nelida', 5);
  ok(PD.volvieron(e, o21).includes('casa-nelida') && !('casa-nelida' in e.apagadas), 'cuando vuelve alguien despierto, la prende');
  // la campana de la escuela
  const conEscuela = { ...A.aldeaNueva(), locales: { escuela: 1 }, pobladores: [{ clave: 'maestra', dia: 1 }] };
  const abierta = A.localAbierto(conEscuela, 'escuela');
  if (abierta) {
    igual(PD.campanaEscuela(8.4, 8.55, 1, conEscuela)?.que, 'entrada', 'a las 8:30, la entrada');
    igual(PD.campanaEscuela(10.45, 10.6, 2, conEscuela)?.que, 'recreo', 'a las 10:30, el recreo');
    igual(PD.campanaEscuela(9, 9.5, 1, conEscuela), null, 'en el medio, nada');
    igual(PD.campanaEscuela(8.4, 8.55, 6, conEscuela), null, 'el domingo, nada');
  }
  igual(PD.campanaEscuela(8.4, 8.55, 1, A.aldeaNueva()), null, 'sin escuela abierta, nada');
  // los carteles
  const pan = PD.lecturaCartel('panaderia', 'Panadería', { abierto: true, dia: 3 });
  ok(pan.partes[0].includes('Abierto') && /horno/.test(pan.partes[1]), 'el cartel de la panadería: abierto y lo que salió del horno');
  ok(PD.lecturaCartel('panaderia', 'Panadería', { abierto: true, dia: 3 }).partes[1] !== PD.lecturaCartel('panaderia', 'Panadería', { abierto: true, dia: 4 }).partes[1], 'cambia de un día al otro');
  ok(/Cerrado/.test(PD.lecturaCartel('herreria', 'Herrería', { abierto: false }).partes[0]), 'cerrado, dice cerrado');
  ok(/Menú/.test(PD.lecturaCartel('cantina', 'La Cantina', { dia: 2 }).partes[1]), 'la cantina tiene menú del día');
  ok(/canteros/.test(PD.lecturaCartel('plaza', 'Plaza de los Duendes').partes[0]), 'los carteles fijos dicen lo suyo');
  // el boletín del buzón: lo de ayer
  const bol = PD.boletinDeAyer(5, { pobladores: [{ clave: 'panadera', dia: 4 }, { clave: 'herrero', dia: 5 }], locales: { panaderia: 4, herreria: 5 } });
  ok(bol.partes.some((t) => /Llegó a la aldea Rosa/.test(t)) && bol.partes.some((t) => /Abrió la panadería/.test(t)), `el boletín cuenta lo de ayer (${bol.partes.join(' | ')})`);
  ok(!bol.partes.some((t) => /herrería|Anselmo/.test(t)), 'y no lo de hoy');
  ok(/Primer boletín/.test(PD.boletinDeAyer(1).partes[0]) && /Benigno/.test(bol.partes[bol.partes.length - 1]), 'el primer día no hay ayer; siempre firma Benigno');
  ok(/hubo fiesta|demorado|helada|cosecha|obra|cumplió|tranquilo/.test(PD.boletinDeAyer(7).partes.join(' ')), 'con los eventos y cumpleaños del día anterior');
  // el aljibe: el trago del día y, después, el agua se toca
  const MC = await importar('aldea-mecanicas.js');
  const mm = { usos: {} };
  ok(MC.sacarAgua(mm, 3).efectos.length === 1 && /manos/.test(MC.sacarAgua(mm, 3).sub), 'el aljibe: el trago, y después te mojás las manos');
  ok(fuente('aldea-mecanicas-mundo.js').includes("if (e.tipo === 'aljibe' && yaHoy(m, 'aljibe', dia())) return 'Mojarte las manos en el aljibe';"), 'el aviso, después del trago: mojarte las manos');
  // los escalones del mástil y el buzón, en la plaza y la estafeta de verdad
  {
    const { cargarModulos } = await import('./ayuda-4-0-3-valle.mjs');
    const { M } = cargarModulos(['aldea-arquitectura.js']);
    const AA = M.aldea_arquitectura;
    const pl = AA.armarEdificio('plaza', 4).puntos;
    const esc = (pl.asientos || []).filter((q) => q.nombre === 'el escalón del mástil');
    ok(esc.length === 2 && esc.every((q) => Math.abs(q.ly - 0.25) < 0.01), `dos lugares para sentarse en el escalón del mástil, a 25 cm (${esc.length})`);
    ok((pl.asientos || []).findIndex((q) => q.nombre === 'el escalón del mástil') >= (pl.asientos || []).filter((q) => q.nombre !== 'el escalón del mástil').length, 'al final de la lista (los asientos de antes no cambian de número)');
    const es = AA.armarEdificio('estafeta', 4).puntos;
    ok(!!es.nombrados?.buzon && es.nombrados.buzon.ly > 1, `el buzón de la estafeta, con su lugar (${JSON.stringify(es.nombrados?.buzon)})`);
  }
  // el guardado
  const s = PD.sanearPueblo({ apagadas: { 'casa-nelida': 3, plaza: 2, 'estacion-aldea': 1, nada: 4, biblioteca: 99, 'casa-abuela': 'x', constructor: 1, __proto__: { x: 1 } } }, 10);
  ok(JSON.stringify(s) === JSON.stringify({ apagadas: { 'casa-nelida': 3 } }), `saneado: sólo edificios con llave y días posibles (${JSON.stringify(s)})`);
  ok(JSON.stringify(PD.sanearPueblo(undefined, 5)) === JSON.stringify({ apagadas: {} }) && JSON.stringify(PD.sanearPueblo('roto')) === JSON.stringify({ apagadas: {} }), 'una partida vieja (sin la clave) carga con todo prendido');
}

// ---------------------------------------------------------------- 2. la tecla E y el aviso
{
  const ids = IX.INTERACCIONES.map((x) => x.id);
  const i = ids.indexOf('pueblo');
  ok(i >= 0, 'hay una entrada «pueblo» en la tabla');
  ok(i > ids.indexOf('vecino') && i < ids.indexOf('puerta'), 'después del vecino (mirando a alguien, se le habla) y antes de la puerta (golpear antes de abrir)');
  ok(i > ids.indexOf('mecanica'), 'y después de lo de cada lugar de la aldea');
  const hechos = [];
  const c = { js: { pos: { x: 0, y: 0, z: 0 }, enTren: false, enKayak: false, sentado: false, montado: false }, objetivo: null, vecino: null, desafio: null,
    accion: (n) => (n === 'pueblo' ? { texto: 'Golpear la puerta', hacer: () => hechos.push('golpe') } : null), limpiar: (n) => hechos.push('limpiar ' + n), cerca: () => null,
    puertaCerca: () => ({ nombre: 'la puerta', objetivo: 0 }), accionarPuerta: () => hechos.push('abrir') };
  const sinNada = new Proxy(c, { get: (o, k) => (k in o ? o[k] : () => null) });
  igual(IX.avisoDe(sinNada)?.texto, 'Golpear la puerta', 'el aviso: golpear');
  igual(IX.hacerConE(sinNada), 'pueblo', 'la E golpea'); ok(hechos.includes('golpe') && hechos.includes('limpiar pueblo') && !hechos.includes('abrir'), 'y no abre');
  const sentado = new Proxy({ ...c, js: { ...c.js, sentado: true } }, { get: (o, k) => (k in o ? o[k] : () => null) });
  ok(IX.hacerConE(sentado) !== 'pueblo', 'sentado, no');
  const banco = { tipo: 'sentarse', texto: 'Sentarte en el banco', s: {} };
  const conBanco = (tipo) => new Proxy({ ...c, objetivo: banco, accion: (n) => (n === 'pueblo' ? { tipo, texto: 'X', hacer: () => {} } : null) }, { get: (o, k) => (k in o ? o[k] : () => null) });
  igual(IX.queHariaE(conBanco('perro')), 'pueblo', 'con el perro adelante, aunque mires un banco: acariciarlo');
  ok(IX.queHariaE(conBanco('golpe')) !== 'pueblo', 'lo demás, mirando un banco, no (te sentás)');
}

// ---------------------------------------------------------------- 3. el módulo, en un mundo de mentira
{
  const sonidos = [];
  const sonido = { ctx: {}, fuente: () => ({}), tono: (o) => sonidos.push('tono:' + o.frec.toFixed(0)), impacto: (m) => sonidos.push('impacto:' + m), golpeRuido: () => sonidos.push('click') };
  const fig = (clave, x, z, extra = {}) => ({ clave: `aldea-${clave}`, claveAldea: clave, pos: { x, y: 0, z }, g: { visible: true, scale: { y: 1 } }, vel: 0, fase: 0, ...extra });
  const nelida = fig('nelida', 0, -3), abuela = fig('abuela', 40, 40);
  const gente = [nelida, abuela];
  const js = { pos: { x: 0, y: 0, z: 0 }, yaw: Math.PI, pitch: 0, enTren: false, montado: false, sentado: false };
  const cam = { position: { x: 0, y: 1.6, z: 0 } };
  const progreso = { aldea: A.aldeaNueva(), dia: 3, horas: 21, puebloDetalles: PD.puebloNuevo() };
  const burbujas = [], anims = [], dichos = [], leidas = [], notas = [];
  let guardados = 0;
  // la casa de Nélida: la puerta en (0, -2), mirando a +z (afuera es z > -2); adentro, z < -2
  const puerta = { x: 0, z: -2, y: 0, rot: 0, ancho: 0.95, objetivo: 0, duenio: 'aldea:casa-nelida' };
  const puertas = { cerca: (p, r = 3.2) => (Math.hypot(p.x - puerta.x, p.z - puerta.z) < r ? puerta : null) };
  let adentroDe = (pos) => (pos.z < -2 && pos.z > -8 && Math.abs(pos.x) < 3 ? { id: 'casa-nelida' } : null);
  const carteles = { panaderia: [{ x: 10, y: 3, z: -6, texto: 'Panadería' }] };
  const AM = { puntosEdificio: (id) => (id === 'escuela' ? { sitio: { x: 20, y: 0, z: 20 } } : id === 'estafeta' ? { nombrados: { buzon: { x: -20, y: 1.25, z: 0 } } } : carteles[id] ? { carteles: carteles[id] } : null), adentro: (pos) => adentroDe(pos), bajoCubierta: () => null };
  let perroAcariciado = null;
  const animales = { perroCerca: (p) => (Math.hypot(p.x - 0, p.z - 1.2) < 1.7 ? { id: 'chola', nombre: 'Chola', x: 0, y: 0, z: 1.2 } : null), acariciar: (id) => { perroAcariciado = id; return true; } };
  let amb = { lluvia: 0, invierno: 0 };
  const P = crearPuebloDetalles({
    progreso: () => progreso, desafio: () => false, jugador: () => js, camara: () => cam, gente: () => gente, aldeaGente: () => ({ destinoDe: () => null }), aldeaMundo: () => AM,
    puertas: () => puertas, animales: () => animales, sonido, ambiente: () => amb, distanciaAldea: () => 0, dentroDe: (pos) => adentroDe(pos)?.id || null,
    hablandoCon: () => null, burbuja: (n, i, r) => burbujas.push([n.claveAldea, i, r]), voz: () => {}, anim: (g, id) => { anims.push([g.claveAldea, id]); g.animSocial = { id }; },
    leer: (l) => leidas.push(l), decir: (t) => dichos.push(t), nota: (t) => notas.push(t), guardar: () => guardados++,
  });
  const correr = (seg, paso = 0.05) => { for (let t = 0; t < seg; t += paso) P.actualizar(paso); };
  const mirarA = (x, z, pitch = 0) => { js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); js.pitch = pitch; cam.position.x = js.pos.x; cam.position.z = js.pos.z; };
  // la ocupación: a las 21, Nélida en su casa
  correr(1.2);
  ok(P.info().ocupacion['casa-nelida']?.despiertos === 1, 'el módulo sabe que Nélida está en su casa');
  igual(P.luz('casa-nelida'), 1, 'su luz, prendida'); igual(P.luz('biblioteca'), 0, 'la biblioteca, apagada'); ok(P.humo('casa-nelida') && !P.humo('biblioteca'), 'y el humo, igual');
  // el saludo: mirándola, a 3 m
  mirarA(0, 10); correr(0.6);
  igual(P.info().saludos, 0, 'de espaldas, no te saluda');
  mirarA(0, -3); correr(0.6);
  igual(P.info().saludos, 1, 'mirándola, te saluda'); ok(anims.some(([k, id]) => k === 'nelida' && id === 'saludar') && burbujas.some(([k, i]) => k === 'nelida' && i === 'saludo'), 'con la mano y su burbuja');
  nelida.animSocial = null; correr(3);
  igual(P.info().saludos, 1, 'y no de nuevo enseguida');
  // el choque: correr hacia ella y tocarla
  nelida.animSocial = null;
  js.pos.z = -2.0; correr(0.3); js.pos.z = -2.5; correr(0.3);
  ok(P.info().quejas >= 1 && anims.some(([k, id]) => k === 'nelida' && id === 'sorprenderse'), `chocándola, se queja (${P.info().ultimaQueja})`);
  js.pos.z = 0; correr(0.6);
  // golpear la puerta (desde afuera, mirando la puerta, cerrada)
  js.pos.x = 0; js.pos.z = -0.6; mirarA(0, -2, -0.1);
  const a1 = P.accion(js);
  igual(a1?.texto, 'Golpear la puerta', 'frente a la puerta cerrada de una casa: golpear');
  a1.hacer(); correr(1.6);
  ok(sonidos.filter((x) => x === 'impacto:hueco').length >= 3, 'tres golpes en la madera');
  ok(dichos.some((t) => /Nélida/.test(t)), `contesta Nélida (${dichos.join(' | ')})`);
  ok(P.accion(js) === null, 'después de golpear, la E abre la puerta (la de siempre)');
  correr(26);
  igual(P.accion(js)?.texto, 'Golpear la puerta', 'al rato se puede volver a golpear');
  puerta.objetivo = 1; ok(P.accion(js)?.texto !== 'Golpear la puerta', 'abierta, no se golpea'); puerta.objetivo = 0;
  // la llave de la luz: adentro, mirando al costado de la puerta (no a la puerta)
  js.pos.x = 0.4; js.pos.z = -3.3;
  mirarA(0, -2, 0.1);
  ok(P.accion(js)?.tipo !== 'llave', 'mirando la puerta, no es la llave (la puerta se abre)');
  js.pos.x = 0.5; js.pos.z = -4.0; mirarA(0, -2, Math.atan2(1.1 - 1.6, Math.hypot(0.5, 2)));
  ok(P.accion(js)?.tipo !== 'llave', 'tampoco de más lejos, con la llave casi en el medio de la vista: gana la puerta, que está más al centro');
  js.pos.x = 0.4; js.pos.z = -3.3;
  mirarA(0.775, -2, 0.12);
  const ll = P.accion(js);
  igual(ll?.texto, 'Apagar la luz', 'mirando la llave: apagar la luz');
  ll.hacer(); correr(0.8);
  igual(P.luz('casa-nelida'), 0, 'apagada');
  ok(P.info().quejasLuz === 1 && anims.some(([k, id]) => k === 'nelida' && id === 'quejarse'), 'Nélida se queja');
  correr(1.5);
  igual(P.luz('casa-nelida'), 0, 'durante unos segundos queda apagada (se queja primero)');
  correr(2.5);
  igual(P.luz('casa-nelida'), 1, 'y la vuelve a prender');
  ok(guardados >= 2, 'se guarda');
  // la biblioteca, sin nadie: queda apagada
  adentroDe = (pos) => (pos.z < -2 && pos.z > -8 && Math.abs(pos.x) < 3 ? { id: 'biblioteca' } : null);
  puerta.duenio = 'aldea:biblioteca';
  progreso.horas = 17; correr(1.2);
  const ll2 = P.accion(js);
  igual(ll2?.texto, 'Apagar la luz', 'en la biblioteca vacía también hay llave');
  ll2.hacer(); correr(6);
  ok(progreso.puebloDetalles.apagadas.biblioteca === 3, 'y queda apagada (anotada en el guardado)');
  igual(P.accion(js)?.texto, 'Prender la luz', 'después dice prender');
  P.accion(js).hacer(); ok(!('biblioteca' in progreso.puebloDetalles.apagadas), 'y la prende');
  adentroDe = (pos) => (pos.z < -2 && pos.z > -8 && Math.abs(pos.x) < 3 ? { id: 'casa-nelida' } : null); puerta.duenio = 'aldea:casa-nelida'; progreso.horas = 21;
  // el cartel de la panadería: mirándolo, se lee
  js.pos.x = 10; js.pos.z = -2; cam.position.y = 1.6; mirarA(10, -6, Math.atan2(3 - 1.6, 4));
  igual(P.accion(js)?.texto, 'Leer el cartel', 'mirando el cartel: leerlo');
  P.accion(js).hacer(); ok(leidas.length === 1 && leidas[0].quien === 'Panadería' && /horno/.test(leidas[0].partes.join(' ')), 'se lee con lo del día');
  mirarA(10, -6, -0.4); ok(P.accion(js)?.texto !== 'Leer el cartel', 'mirando el suelo, no');
  // el buzón de la estafeta: mirándolo, el boletín
  js.pos.x = -20; js.pos.z = 1.5; cam.position.y = 1.6; mirarA(-20, 0, Math.atan2(1.25 - 1.6, 1.5));
  igual(P.accion(js)?.texto, 'Leer el boletín del buzón', 'frente al buzón: leer el boletín');
  P.accion(js).hacer(); ok(leidas[leidas.length - 1]?.quien === 'El boletín de la estafeta' && /Benigno/.test(leidas[leidas.length - 1].partes.join(' ')), 'se lee lo de ayer');
  mirarA(-20, 10); ok(P.accion(js)?.texto !== 'Leer el boletín del buzón', 'de espaldas, no');
  // el perro: adelante, a menos de 1,7 m
  js.pos.x = 0; js.pos.z = 0.2; mirarA(0, 1.2, -0.4);
  igual(P.accion(js)?.texto, 'Acariciar a Chola', 'con la Chola adelante: acariciarla');
  P.accion(js).hacer(); igual(perroAcariciado, 'chola', 'y se la acaricia'); ok(notas.some((t) => /Chola/.test(t)), 'con su nota');
  // la campanita: entrar a un local
  adentroDe = (pos) => (pos.x > 30 ? { id: 'panaderia' } : null);
  const antes = P.info().campanitas;
  js.pos.x = 29; correr(0.2); js.pos.x = 31; correr(0.2);
  igual(P.info().campanitas, antes + 1, 'entrando a la panadería suena la campanita');
  ok(sonidos.includes('tono:2350'), 'una campanita de verdad (su tono)');
  js.pos.x = 29; correr(0.2); js.pos.x = 31; correr(0.2);
  igual(P.info().campanitas, antes + 1, 'y no a cada rato');
  // la campana de la escuela
  progreso.aldea = { ...A.aldeaNueva(), locales: { escuela: 1 }, pobladores: [{ clave: 'maestra', dia: 1 }] };
  if (A.localAbierto(progreso.aldea, 'escuela')) {
    progreso.dia = 1; progreso.horas = 8.4; correr(0.1); progreso.horas = 8.55; correr(0.1);
    igual(P.info().campanas, 1, 'a las 8:30 suena la campana de la escuela');
  }
  // con nieve: el que entra a una casa se sacude; caminando afuera, se tapa
  adentroDe = (pos) => (pos.z < -2 && pos.z > -8 && Math.abs(pos.x) < 3 ? { id: 'casa-nelida' } : null);
  amb = { lluvia: 0.8, invierno: 0.9 };
  js.pos.x = 5; js.pos.z = 5;
  nelida.animSocial = null; nelida.pos.z = -1; nelida.vel = 0.8; correr(0.6);
  igual(nelida.__detalle, 'taparse', 'caminando con nieve, se tapa la cabeza');
  nelida.pos.z = -3; correr(0.6);
  ok(P.info().sacudidas === 1 && nelida.__sacude > nelida.fase, 'al entrar, se sacude la nieve');
  amb = { lluvia: 0, invierno: 0.9 }; nelida.vel = 0; nelida.pos.z = 2; correr(0.6);
  igual(nelida.__detalle, 'frotarse', 'parada al frío, se frota las manos');
  amb = { lluvia: 0, invierno: 0 }; correr(0.6);
  igual(nelida.__detalle, null, 'con lindo tiempo, nada');
  ok(P.info().msMax < 5, `liviano (${P.info().msMax.toFixed(3)} ms)`);
}

// ---------------------------------------------------------------- 4. las poses y los enganches
{
  const brazo = () => ({ rotation: { x: 0, y: 0, z: 0, order: 'XYZ' }, position: { y: 1.3 }, userData: { codo: { rotation: { x: 0 } } } });
  const g = { brazos: [brazo(), brazo()], torso: { rotation: { x: 0, z: 0 }, position: { y: 0.82 } }, cabeza: { rotation: { x: 0, z: 0 } }, fase: 0, __detalle: 'taparse' };
  for (let i = 0; i < 20; i++) { g.fase += 0.05; g.brazos[1].rotation.x = 0; POSE.posarDetalle(g, true); }
  ok(g.brazos[1].rotation.x < -2.3 && g.brazos[1].userData.codo.rotation.x < -1.3, 'taparse: la mano derecha arriba de la cabeza');
  const g2 = { ...g, brazos: [brazo(), brazo()], fase: 0, __pesoDetalle: 0, __faseDetalle: undefined, __detalle: 'taparse' };
  for (let i = 0; i < 20; i++) { g2.fase += 0.05; g2.brazos[1].rotation.x = 0; POSE.posarDetalle(g2, false); }
  ok(g2.brazos[1].rotation.x > -0.5, 'parado, no se tapa');
  const g3 = { ...g, brazos: [brazo(), brazo()], fase: 0, __pesoDetalle: 0, __faseDetalle: undefined, __detalle: 'frotarse', pose: null };
  for (let i = 0; i < 20; i++) { g3.fase += 0.05; g3.brazos[0].rotation.x = 0; g3.brazos[1].rotation.x = 0; POSE.posarDetalle(g3, false); }
  ok(g3.brazos[0].rotation.x < -0.7 && g3.brazos[1].rotation.x < -0.7, 'frotarse: las dos manos adelante');
  const g4 = { ...g, brazos: [brazo(), brazo()], fase: 0, __pesoDetalle: 0, __faseDetalle: undefined, __detalle: null, __sacude: POSE.DUR_SACUDIR };
  let maxZ = 0; for (let i = 0; i < 20; i++) { g4.fase += 0.05; g4.torso.rotation.z = 0; POSE.posarDetalle(g4, false); maxZ = Math.max(maxZ, Math.abs(g4.torso.rotation.z)); }
  ok(maxZ > 0.04, 'sacudirse: el torso va de lado a lado');
  for (let i = 0; i < 40; i++) { g.fase += 0.05; g.__detalle = null; POSE.posarDetalle(g, true); }
  igual(g.brazos[1].rotation.y, 0, 'al terminar, el giro del hombro vuelve a cero');
  // los enganches
  const gente = fuente('gente.js'), am = fuente('aldea-mundo.js'), main = fuente('main.js'), guardado = fuente('guardado.js'), anim = fuente('aldea-animales-mundo.js');
  ok(/if \(g\.__detalle \|\| g\.__sacude \|\| g\.__pesoDetalle\) posarDetalle\(g, andando\);/.test(gente), 'gente.js hace los gestos en cada pose');
  ok(gente.indexOf('posarDetalle(g, andando)') > gente.indexOf('if (g.animSocial) animarSocial(g, dt);'), 'después de las animaciones sociales');
  ok(am.includes('encendido * 1.5 * q.fuerza * fe)') && am.includes('if (b.luz) b.luz.edificio = b.id;'), 'aldea-mundo.js: la luz de adentro de cada edificio, según quién está');
  ok(am.includes('if (ctx.luzEdificio) ventanasPorCasa(encendido);') && /a\[i\] = base\[i\] \* paso;/.test(am), 'y las ventanas (el color por vértice de sus vidrios)');
  ok(am.includes('const todas = [...conGente,'), 'el humo, sólo de las chimeneas con gente');
  ok(/if \(!d \|\| d\.etapa < 3 \|\| !d\.ventanas\?\.length \|\| sinLuz\(b\)\) continue;/.test(am) && am.includes('for (const v of sinLuz(b) ? [] : d.ventanas || [])'), 'los halos y la luz en el suelo, sólo de las casas con alguien despierto');
  ok(am.includes('carteles: (b.datos.carteles || []).map('), 'los carteles, con su lugar en el mundo');
  ok(main.includes('if (!desafio) puebloDetalles?.actualizar(dt);') && main.includes("case 'pueblo': return enE ? puebloDetalles?.accion(js) : cachePueblo;") && main.includes('cachePueblo = puebloDetalles ? puebloDetalles.accion(js) : null;'), 'main.js lo arma, lo mueve y le pregunta a la E');
  ok(main.includes('luzEdificio: (id) => (puebloDetalles ? puebloDetalles.luz(id) : 1)'), 'y le pasa la luz a la aldea');
  ok(guardado.includes("puebloDetalles: modoPartida === 'desafio' ? undefined : sanearPueblo(p.puebloDetalles,"), 'guardado.js sanea la clave nueva');
  ok(anim.includes('perroCerca, acariciar'), 'los perros de la aldea se acarician');
}
console.log(`OK 4.31.0 (B) · ${pasos} comprobaciones${MUT ? ` (mutación ${MUT})` : ''}`);
