// 4.31.1 (A): la cacería de bugs de personajes, la Historia y el pueblo, sin Electron:
//   1. el pueblo (pueblo-detalles-juego.js, en un mundo de mentira): con una escena o una charla abierta nadie te saluda ni se queja; el que camina con vos
//      (la cita, el acompañante) tampoco; el que duerme (destino «cama»), tampoco, ni hace gestos; con el mate en la mano no hay gesto del clima; la queja
//      no corta otra animación; al volver a verlo no se sacude por una entrada vieja; la bienvenida la da el dueño; la burbuja de «Mañana, mañana» tiene
//      ícono; el renglón de abajo sólo se borra si sigue siendo el nuestro; la puerta le gana al perro si la mirás más de frente; el perro lejos de su casa;
//   2. la E y el aviso (interacciones.js): la nota de Eusebio (sólo la más cercana) cede a lo del refugio que mirás; mirándola, gana; a caballo, el objeto que
//      abre una escena cede a «Bajarte»; los carteles de la estación se leen;
//   3. la Historia: la línea de espera del mirador, la ronda y el canelo (hay que pasar la medianoche desde la escena); el intento de la noche dejado a medias no
//      cuenta (y los logros «Nevó y no cedió» / «Otra vez»); los textos del galpón y del lado del arroyo; a caballo, el vecino con escena te baja;
//   4. la gente: la pierna del jinete; el martillo y el arco fuera de la quietud; el golpe del brazo dura;
//      el brazo de tu cuerpo después de soltar la mano.
// Con mutaciones de verdad (un proceso por mutación: `--mutacion=<id>`, copia de src con otro nombre).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const MUT = (process.argv.find((a) => a.startsWith('--mutacion=')) || '').slice(11);

const MUTACIONES = {
  'saluda-en-escena': ['src/pueblo-detalles-juego.js', "const tomada = !!ctx.tomada?.() || !!hablando;", 'const tomada = false;'],
  'saluda-al-que-camina-con-vos': ['src/pueblo-detalles-juego.js', 'if (duerme || g.conVos || g.enCita || tomada) continue;', 'if (duerme || tomada) continue;'],
  'saluda-dormido': ['src/pueblo-detalles-juego.js', "return typeof d?.punto === 'string' && /^cama/.test(d.punto);", 'return false;'],
  'gesto-con-mate': ['src/pueblo-detalles-pose.js', 'if (g.mate && g.mate.visible !== false) { g.mate.visible = false; g.__mateDejado = true; }', ''],
  'queja-corta-abrazo': ['src/pueblo-detalles-juego.js', '&& t - ch.t > PUEBLO.choque.cada && !g.animSocial) {', '&& t - ch.t > PUEBLO.choque.cada) {'],
  'sacude-por-lo-viejo': ['src/pueblo-detalles-juego.js', '&& t - (visto ?? -Infinity) < 20) {', ') {'],
  'bienvenida-del-cliente': ['src/pueblo-detalles-juego.js', "quien = duenio && o?.despiertos?.includes(duenio) ? duenio : o?.despiertos?.[0];", 'quien = o?.despiertos?.[0];'],
  'icono-z': ['src/pueblo-detalles-juego.js', "r.tipo === 'abre' ? 'puerta' : 'cansado'", "r.tipo === 'abre' ? 'puerta' : 'z'"],
  'calla-a-todos': ['src/pueblo-detalles-juego.js', "despues(5.5, () => callar(r.texto));", "despues(5.5, () => ctx.decir?.(''));"],
  'perro-le-gana-a-la-puerta': ['src/pueblo-detalles-juego.js', '&& !(qPerro && mirando(o, { x: qPerro.x, z: qPerro.z, y: (qPerro.y ?? js.pos.y) + 1.1 }).cos > cosPerro)) {', ') {'],
  'nota-roba-la-lampara': ['src/interacciones.js', "&& (o.mirado || c.js.montado || !c.accion?.('casa', enE)) ? o : null; }", ' ? o : null; }'],
  'montado-se-come-la-e': ['src/interacciones.js', "return o && !(o.escena && c.js.montado) && (o.mirado", 'return o && (o.mirado'],
  'mirador-sin-dia': ['src/historia-disparadores-acto3.js', "requiere: ['galpon-encuentro'], diaTras: 'galpon-encuentro', lugar: en('mirador', 16)", "requiere: ['galpon-encuentro'], lugar: en('mirador', 16)"],
  'espera-sin-dia-tras': ['src/historia-espera.js', "if (typeof d?.diaTras === 'string' && !(s.dia > diaVistaDe(h, d.diaTras))) return true;", ''],
  'intento-a-medias-cuenta': ['src/historia-noche.js', '  n.intentos = Math.max(0, n.intentos - 1);\n', '\n'],
  'golpe-un-cuadro': ['src/gesto-golpe.js', '  b.rotation.x += (q.x - b.rotation.x) * k;', ''],
  'golpe-sin-final': ['src/gesto-golpe.js', "if (!b || q.t <= 0) { g.__golpe = null; return; }", 'if (!b) return;'],
  'quietud-con-martillo': ['src/gente-cuerpo.js', ' || !!g.__enMano;   // (4.31.1 (A)', ';   // (4.31.1 (A)'],
  'estacion-sin-carteles': ['src/aldea-mundo.js', "E.puntosMundo = { id, version: 'estacion', etapa: 4, nombrados, asientos: [], extra: {}, carteles };", "E.puntosMundo = { id, version: 'estacion', etapa: 4, nombrados, asientos: [], extra: {} };"],
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
  console.log(`OK 4.31.1 (A) · ${ids.length} mutaciones detectadas`);
  process.exit(0);
}

// ---------------------------------------------------------------- el hijo: los módulos (con la mutación, una copia de src con otro nombre)
let SRC = path.join(raiz, 'src');
if (MUT) {
  const [f, a, b] = MUTACIONES[MUT];
  SRC = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4311a-'));
  for (const n of fs.readdirSync(path.join(raiz, 'src'))) if (n.endsWith('.js')) fs.copyFileSync(path.join(raiz, 'src', n), path.join(SRC, n));
  const abs = path.join(SRC, path.basename(f));
  fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace(a, b));
  process.on('exit', () => { try { fs.rmSync(SRC, { recursive: true, force: true }); } catch { /* nada */ } });
}
const fuente = (f) => fs.readFileSync(path.join(SRC, path.basename(f)), 'utf8');
const importar = (n) => import(pathToFileURL(path.join(SRC, n)).href);
const PD = await importar('pueblo-detalles.js');
const { crearPuebloDetalles } = await importar('pueblo-detalles-juego.js');
const IX = await importar('interacciones.js');
const A = await importar('aldea.js');
const ESP = await importar('historia-espera.js');
const NOCHE = await importar('historia-noche.js');
const HIST = await importar('historia.js');
const DISP = await importar('historia-disparadores.js');
const LOGROS = await importar('logros-historia.js');
const GOLPE = await importar('gesto-golpe.js');
const POSE = await importar('pueblo-detalles-pose.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const igual = (a, b, t) => { pasos++; assert.equal(a, b, t); };

// ---------------------------------------------------------------- 1. el pueblo, en un mundo de mentira
{
  const sonido = { ctx: {}, fuente: () => ({}), tono: () => {}, impacto: () => {}, golpeRuido: () => {} };
  const fig = (clave, x, z, extra = {}) => ({ clave: `aldea-${clave}`, claveAldea: clave, pos: { x, y: 0, z }, g: { visible: true, scale: { y: 1 } }, vel: 0, fase: 0, ...extra });
  const nelida = fig('nelida', 0, -3);
  const gente = [nelida];
  const js = { pos: { x: 0, y: 0, z: 0 }, yaw: Math.PI, pitch: 0, enTren: false, montado: false, sentado: false };
  const cam = { position: { x: 0, y: 1.6, z: 0 } };
  const progreso = { aldea: A.aldeaNueva(), dia: 3, horas: 11, puebloDetalles: PD.puebloNuevo() };
  const burbujas = [], anims = [], dichos = [], notas = [];
  let tomada = false, destinos = {}, renglon = '';
  const puerta = { x: 0, z: -2, y: 0, rot: 0, ancho: 0.95, objetivo: 0, duenio: 'aldea:casa-nelida' };
  const puertas = { cerca: (p, r = 3.2) => (Math.hypot(p.x - puerta.x, p.z - puerta.z) < r ? puerta : null) };
  let adentroDe = (pos) => (pos.z < -2 && pos.z > -8 && Math.abs(pos.x) < 3 ? { id: 'casa-nelida' } : null);
  const AM = { puntosEdificio: () => null, adentro: (pos) => adentroDe(pos), bajoCubierta: () => null };
  let perroAca = { id: 'chola', nombre: 'Chola', x: 0, y: 0, z: 1.2, lejosDeCasa: false };
  const animales = { perroCerca: (p) => (perroAca && Math.hypot(p.x - perroAca.x, p.z - perroAca.z) < 1.7 ? perroAca : null), acariciar: () => true };
  let amb = { lluvia: 0, invierno: 0 };
  const P = crearPuebloDetalles({
    progreso: () => progreso, desafio: () => false, jugador: () => js, camara: () => cam, gente: () => gente, aldeaGente: () => ({ destinoDe: (k) => destinos[k] || null }), aldeaMundo: () => AM,
    puertas: () => puertas, animales: () => animales, sonido, ambiente: () => amb, distanciaAldea: () => 0, dentroDe: (pos) => adentroDe(pos)?.id || null,
    hablandoCon: () => null, burbuja: (n, i, r) => burbujas.push([n.claveAldea, i, r]), voz: () => {}, anim: (g, id) => { anims.push([g.claveAldea, id]); g.animSocial = { id }; },
    leer: () => {}, decir: (t) => { dichos.push(t); renglon = t || ''; }, nota: (t, sub) => notas.push([t, sub]), guardar: () => {},
    tomada: () => tomada, callar: (t) => { if (renglon === t) { renglon = ''; dichos.push(''); } },
  });
  const correr = (seg, paso = 0.05) => { for (let t = 0; t < seg; t += paso) P.actualizar(paso); };
  const mirarA = (x, z, pitch = 0) => { js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); js.pitch = pitch; cam.position.x = js.pos.x; cam.position.z = js.pos.z; };
  correr(1.2);
  // con una escena o una charla: no saluda
  tomada = true; mirarA(0, -3); correr(0.8);
  igual(P.info().saludos, 0, 'con una escena o una charla abierta, nadie te saluda');
  tomada = false;
  // caminando con vos (el acompañante, la cita): tampoco
  nelida.conVos = true; correr(0.8);
  igual(P.info().saludos, 0, 'el que camina con vos no te saluda como a un desconocido');
  nelida.conVos = false;
  // dormida (su destino es la cama): ni saluda ni se queja
  destinos.nelida = { edificio: 'casa-nelida', punto: 'cama' };
  correr(0.8);
  igual(P.info().saludos, 0, 'la que duerme (parada junto a la cama) no te saluda');
  nelida.animSocial = null;
  js.pos.z = -2.0; correr(0.3); js.pos.z = -2.5; correr(0.3);
  igual(P.info().quejas, 0, 'ni se queja si la chocás');
  amb = { lluvia: 0, invierno: 0.9 }; js.pos.z = 0; correr(0.6);
  igual(nelida.__detalle, null, 'ni se frota las manos al frío');
  amb = { lluvia: 0, invierno: 0 };
  destinos = {};
  // despierta: ahora sí te saluda
  mirarA(0, -3); correr(0.8);
  igual(P.info().saludos, 1, 'despierta y mirándola, te saluda');
  // la queja no corta otra animación (el abrazo)
  nelida.animSocial = { id: 'abrazar' };
  correr(7);
  js.pos.z = -2.0; correr(0.3); js.pos.z = -2.5; correr(0.3);
  igual(P.info().quejas, 0, 'abrazando a otro, chocarla no le corta el abrazo');
  nelida.animSocial = null; js.pos.z = 0; correr(7);
  js.pos.z = -2.0; correr(0.3); js.pos.z = -2.5; correr(0.3);
  igual(P.info().quejas, 1, 'sin animación, chocarla la hace quejarse (como siempre)');
  js.pos.z = 0; nelida.animSocial = null; correr(0.5);
  // con el mate en la mano, sin gesto del clima
  amb = { lluvia: 0, invierno: 0.9 }; nelida.pos.z = 2; nelida.mate = { visible: true }; correr(0.6);
  igual(nelida.__detalle, 'frotarse', 'con el mate en la mano, parada al frío, se frota las manos igual (4.31.0)');
  nelida.mate = null;
  {
    // y mientras dura el gesto, el mate y la planilla se guardan (con figuras de mentira): el brazo del mate subía por arriba de la cabeza
    const brazo = () => ({ rotation: { x: 0, y: 0, z: 0, order: 'XYZ' }, position: { y: 1.3 }, userData: { codo: { rotation: { x: 0 } } } });
    const f = { brazos: [brazo(), brazo()], torso: { rotation: { x: 0, z: 0 }, position: { y: 0.82 } }, cabeza: { rotation: { x: 0, z: 0 } }, fase: 0, __detalle: 'frotarse', mate: { visible: true }, planilla: { visible: true } };
    for (let i = 0; i < 10; i++) { f.fase += 0.05; POSE.posarDetalle(f, false); }
    ok(f.mate.visible === false && f.__mateDejado === true, 'frotándose, el mate queda guardado (y gente.js lo vuelve a sacar)');
    ok(f.planilla.visible === false && f.__enManoDejado === true, 'y la planilla también');
  }
  amb = { lluvia: 0, invierno: 0 }; correr(0.6);
  // la sacudida de la nieve: si dejó de verse afuera y la volvés a ver adentro, no se sacude por algo viejo
  amb = { lluvia: 0.8, invierno: 0.9 }; nelida.animSocial = null; nelida.pos.z = -1; nelida.vel = 0; correr(0.6);
  nelida.g.visible = false; correr(21);
  nelida.pos.z = -3; correr(0.3); nelida.g.visible = true; correr(0.6);
  igual(P.info().sacudidas, 0, 'vuelta a ver adentro (entró mientras no se veía), no se sacude');
  nelida.pos.z = -1; correr(0.6); nelida.pos.z = -3; correr(0.6);
  igual(P.info().sacudidas, 1, 'entrando a la vista, sí');
  amb = { lluvia: 0, invierno: 0 }; correr(0.6);
  // golpear tarde a la noche: la burbuja tiene ícono de verdad
  progreso.horas = 23.2; nelida.pos.z = -3; destinos.nelida = { edificio: 'casa-nelida', punto: 'adentro', adentro: true }; correr(1.2);
  js.pos.x = 0; js.pos.z = -0.6; mirarA(0, -2, -0.1);
  const a1 = P.accion(js);
  igual(a1?.texto, 'Golpear la puerta', 'frente a la puerta: golpear');
  a1.hacer(); correr(1.6);
  const b = burbujas[burbujas.length - 1];
  ok(b && b[0] === 'nelida' && b[1] === 'cansado', `contesta «Mañana, mañana» con un ícono que existe (${b && b[1]})`);
  destinos = {};
  // el renglón: si mientras tanto alguien dijo otra cosa abajo, no se borra
  renglon = 'Rosa: «¿Viste lo del tren?»';
  correr(5);
  igual(renglon, 'Rosa: «¿Viste lo del tren?»', 'la charla de los vecinos que escuchás no se corta');
  progreso.horas = 11; correr(1.2);
  // la puerta le gana al perro echado al lado si la mirás más de frente
  js.pos.x = 0.3; js.pos.z = -0.6; perroAca = { id: 'chola', nombre: 'Chola', x: 0.2, y: 0, z: -1.5, lejosDeCasa: false };
  const mirar3 = (x, y, z) => mirarA(x, z, Math.atan2(y - 1.6, Math.hypot(x - js.pos.x, z - js.pos.z)));
  puerta.objetivo = 0; mirar3(0, 1.1, -2);
  ok(P.accion(js)?.tipo !== 'perro', `mirando la puerta, con el perro al costado, no es el perro (${P.accion(js)?.texto})`);
  mirar3(0.2, 0.4, -1.5);
  igual(P.accion(js)?.tipo, 'perro', 'mirando al perro, sí');
  perroAca.lejosDeCasa = true; P.accion(js).hacer();
  ok(notas.some(([, sub]) => /vuelve para su casa/.test(sub)), 'lejos de su casa, el aviso dice que se vuelve (no «te va a seguir»)');
  perroAca = null;
  // la bienvenida la da el dueño (con una clienta adentro)
  const fig2 = fig('panadera', 31, 0), cliente = fig('nelida', 32, 0);
  gente.length = 0; gente.push(fig2, cliente);
  const prog2 = { aldea: { ...A.aldeaNueva(), locales: { panaderia: 1 }, pobladores: [{ clave: 'panadera', dia: 1 }] }, dia: 3, horas: 11, puebloDetalles: PD.puebloNuevo() };
  const burb2 = [];
  const dest2 = { nelida: { edificio: 'panaderia', punto: 'adentro', adentro: true }, panadera: { edificio: 'panaderia', punto: 'adentro', adentro: true } };
  const aldeaGente2 = { destinoDe: (k) => dest2[k] || null };
  const P2 = crearPuebloDetalles({
    progreso: () => prog2, desafio: () => false, jugador: () => js, camara: () => cam, gente: () => gente, aldeaGente: () => aldeaGente2, aldeaMundo: () => AM,
    puertas: () => null, animales: () => null, sonido, ambiente: () => ({}), distanciaAldea: () => 0, dentroDe: (pos) => (pos.x > 30 ? 'panaderia' : null),
    hablandoCon: () => null, burbuja: (n, i) => burb2.push([n.claveAldea, i]), voz: () => {}, anim: () => {}, leer: () => {}, decir: () => {}, nota: () => {}, guardar: () => {},
  });
  // (la ocupación pone primero a los vecinos y después a los pobladores: Nélida queda primera)
  js.pos.x = 29; js.pos.z = 0; for (let t = 0; t < 1.2; t += 0.05) P2.actualizar(0.05);
  js.pos.x = 31; for (let t = 0; t < 1.2; t += 0.05) P2.actualizar(0.05);
  ok(burb2.some(([k, i]) => k === 'panadera' && i === 'saludo') && !burb2.some(([k, i]) => k === 'nelida' && i === 'saludo'), `la bienvenida la da la panadera, no la clienta (${JSON.stringify(burb2)})`);
}

// ---------------------------------------------------------------- 2. la E y el aviso
{
  const caso = (o) => {
    const hechos = [];
    const c = { js: { pos: { x: 0, y: 0, z: 0 }, enTren: false, enKayak: false, sentado: false, montado: o.montado || false }, objetivo: null, vecino: null, desafio: null,
      historiaObjeto: () => ({ aviso: o.aviso || 'Releer la nota de Eusebio', mirado: !!o.mirado, escena: !!o.escena, hacer: () => hechos.push('historia') }),
      accion: (n) => (n === 'casa' && o.casa ? { texto: 'Apagar la lámpara', hacer: () => hechos.push('casa') } : null), limpiar: () => {}, desmontar: () => hechos.push('desmontar'),
      caballoDicho: () => 'del caballo' };
    return { c: new Proxy(c, { get: (x, k) => (k in x ? x[k] : () => null) }), hechos };
  };
  { const { c, hechos } = caso({ casa: true }); IX.hacerConE(c); ok(hechos.includes('casa') && !hechos.includes('historia'), 'la nota sólo cercana (no la mirás) cede a la lámpara que mirás'); igual(IX.avisoDe(c)?.texto, 'Apagar la lámpara', 'y el aviso dice la lámpara'); }
  { const { c, hechos } = caso({ casa: true, mirado: true }); IX.hacerConE(c); ok(hechos.includes('historia'), 'mirando la nota, gana la nota'); }
  { const { c, hechos } = caso({ casa: false }); IX.hacerConE(c); ok(hechos.includes('historia'), 'sin nada del refugio a la vista, la nota cercana sigue'); }
  { const { c, hechos } = caso({ montado: true, escena: true, aviso: 'Golpear la puerta del galpón' }); IX.hacerConE(c); ok(hechos.includes('desmontar') && !hechos.includes('historia'), 'a caballo, el objeto que abre una escena cede a «Bajarte» (la E no se pierde)'); }
  { const { c, hechos } = caso({ montado: true, escena: false, aviso: 'Releer la nota de la bolsa' }); IX.hacerConE(c); ok(hechos.includes('historia'), 'a caballo, una nota se lee igual'); }
  // los carteles de la estación (aldea-mundo.js arma `carteles` también para la estación)
  ok(/E\.puntosMundo = \{ id, version: 'estacion', etapa: 4, nombrados, asientos: \[\], extra: \{\}, carteles \};/.test(fuente('aldea-mundo.js')) && /carteles: pz\.edificio\.carteles \|\| \[\]/.test(fuente('aldea-mundo.js')), 'los carteles de la estación («Aldea de los Duendes», «Cargas») llegan a puntosEdificio');
  ok(PD.lecturaCartel('estacion-aldea', 'Aldea de los Duendes', { abierto: null, dia: 3 }).partes[0].includes('Ramal'), 'y se leen con su texto fijo');
}

// ---------------------------------------------------------------- 3. la Historia
{
  const idx = (id) => HIST.CAPITULOS.findIndex((c) => c.id === id);
  const historiaEn = (cap, vistas, dia) => ({ activa: true, fase: 'jugando', capitulo: idx(cap), base: { dia: dia - 1 }, hechos: {}, escenas: { vistas } });
  const estado = (h, horas, dia) => ({ horas, dia, escenas: new Set(Object.keys(h.escenas.vistas)) });
  // el mirador: el encuentro fue a las 0:30 de este mismo día; a las 2 la espera dice mañana (no «hasta las 6»)
  const obj = HIST.CAPITULOS[idx('golpea')].objetivos.find((o) => o.id === 'cerro');
  const h1 = historiaEn('golpea', { 'galpon-golpe': 10, 'galpon-encuentro': 10, 'galpon-trato': 10 }, 10);
  const e1 = ESP.esperaDeObjetivo(h1, estado(h1, 2, 10), obj);
  ok(e1 && e1.horas > 24, `golpeado después de medianoche: la espera pasa del día (${e1 && e1.texto}, ${e1 && e1.horas.toFixed(1)} h)`);
  const e2 = ESP.esperaDeObjetivo(h1, estado(h1, 2, 11), obj);
  ok(e2 && e2.horas === 4 && /las 6:00/.test(e2.texto), `al día siguiente, a las 2: hasta las 6 (${e2 && e2.texto})`);
  ok(ESP.esperaDeObjetivo(h1, estado(h1, 7, 10), obj)?.horas > 20, 'a las 7 del mismo día del encuentro, todavía falta (no es «ya es la hora»)');
  igual(DISP.DISPARADORES['cerro-mirador'].diaTras, 'galpon-encuentro', 'el mirador sabe de qué escena cuenta el día');
  // los textos
  const golpe = HIST.CAPITULOS[idx('golpea')].objetivos.find((o) => o.id === 'golpe');
  ok(/de noche/.test(golpe.texto), 'el galpón: «de noche» (de día no hay E en la puerta)');
  const lado = HIST.CAPITULOS[idx('arco')].objetivos.find((o) => o.id === 'lado');
  ok(/tres defensas prestadas/.test(lado.texto), 'el lado del arroyo: dice que hacen falta tres defensas prestadas');
  // la noche a medias no cuenta
  const h = { version: 2, duendes: { intentos: 0, noche: 'pendiente' }, noche: null, escenas: { vistas: {} } };
  NOCHE.empezarIntento(h, 22);
  NOCHE.descontarIntento(h);   // (la historia en pausa en plena noche, o el juego cerrado)
  NOCHE.empezarIntento(h, 22);
  igual(h.noche.intentos, 1, 'empezada de nuevo después de dejarla a medias: es el primer intento');
  igual(h.duendes.intentos, 1, 'también del lado de los duendes');
  NOCHE.cerrarIntento(h, true);
  const logro = (id) => LOGROS.LOGROS_HISTORIA.find((l) => l.id === id);
  ok(logro('historia-noche-una').cumple({ historia: h }) && !logro('historia-noche-otra').cumple({ historia: h }), '«Nevó y no cedió» sí, «Otra vez» no');
  // el enganche en la noche y en main.js
  const nui = fuente('historia-noche-ui.js');
  ok(/h\.noche\.horasAntes = null;\n\s*descontarIntento\(h\);/.test(nui) && /n\.horasAntes = null; descontarIntento\(h\); ctx\.guardar\(\);/.test(nui), 'historia-noche-ui.js descuenta al dejarla y al volver de un cierre');
  const main = fuente('main.js');
  ok(/if \(!desafio && jugador\?\.estado\?\.montado && valle\?\.hayEscenaCon\?\.\(claveHist\)\) \{ desmontar\(\);/.test(main), 'a caballo, el vecino con una escena para vos te baja (y no se gasta la charla)');
  ok(main.indexOf('valle?.hayEscenaCon?.(claveHist)') < main.indexOf('valle?.alHablarCon?.(claveHist)') && main.indexOf('valle?.alHablarCon?.(claveHist)') < main.indexOf('valle?.lineaDeHistoria?.(claveHist)'), 'antes de la escena y de la línea de historia');
  ok(/tomada: \(\) => !!escenasMundo\?\.activa\(\) \|\| !!charla\.npc/.test(main) && /callar: \(texto\) =>/.test(main), 'main.js le pasa al pueblo la escena y la charla, y el «callar»');
  ok(/mirado: !!mirado/.test(main), 'main.js anota si el objeto de historia se está mirando');
}

// ---------------------------------------------------------------- 4. la gente
{
  // el golpe del brazo: arriba de entrada y vuelve en su tiempo, en varios cuadros
  const g = { brazos: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }] };
  GOLPE.golpear(g, -1.7, 0.3);
  let arriba = 0, cuadros = 0;
  for (let i = 0; i < 40; i++) { g.brazos[1].rotation.x = 0.1; GOLPE.brazoDeGolpe(g, 1 / 60); if (g.brazos[1].rotation.x < -0.8) arriba++; if (g.__golpe) cuadros++; }
  ok(arriba >= 6, `el brazo del martillo se ve arriba varios cuadros (${arriba})`);
  ok(!g.__golpe && cuadros < 25, `y el golpe termina (${cuadros} cuadros)`);
  igual(g.brazos[1].rotation.x, 0.1, 'después, el brazo queda donde lo pone la pose');
  const gente = fuente('gente.js'), cuerpo = fuente('gente-cuerpo.js');
  ok(/if \(g\.__golpe\) brazoDeGolpe\(g, dt\);/.test(gente), 'gente.js aplica el golpe en cada cuadro');
  ok(/golpear\(npc, -1\.7, 0\.32\);/.test(fuente('desafio-vecinos-mundo.js')) && /golpear\(npc, -2\.5, 0\.3\);/.test(fuente('desafio-vecinos-mundo.js')) && /golpear\(npc, -1\.6, 0\.3\);/.test(fuente('desafio-aliados.js')), 'Anselmo, los chicos y Ramón golpean con gesto-golpe.js');
  ok(/npc\.mano\.add\(martillo\); npc\.__enMano = true;/.test(fuente('desafio-vecinos-mundo.js')) && /npc\.mano\.add\(arco\); npc\.__enMano = true;/.test(fuente('desafio-aliados.js')), 'el martillo y el arco marcan la mano ocupada');
  // la quietud con el martillo en la mano: el brazo derecho no entra en la pose (con figuras de mentira)
  const m = cuerpo.match(/function quietud\(g, st, dt, andando, charlando\) \{[\s\S]*?\n\}/);
  ok(!!m, 'la quietud está');
  const POSES = { cruzados: { izq: { x: -0.6, yl: 0.3, zl: 0.2, codo: -1.6 }, der: { x: -0.6, yl: 0.3, zl: 0.2, codo: -1.6 } } };
  const quietud = new Function('POSES', 'PONCHO_SIN_POSE', m[0] + '\nreturn quietud;')(POSES, new Set());
  const brazo = () => ({ rotation: { x: 0, y: 0, z: 0.03, order: 'XYZ' }, userData: { codo: { rotation: { x: 0 } } } });
  const anselmo = { brazos: [brazo(), brazo()], cabeza: { rotation: { x: 0, z: 0 } }, __quietud: 'cruzados', __enMano: true };
  const st = {};
  for (let i = 0; i < 30; i++) quietud(anselmo, st, 0.1, false, false);
  ok(anselmo.brazos[0].userData.codo.rotation.x < -1 && anselmo.brazos[1].userData.codo.rotation.x === 0, 'Anselmo «cruza los brazos» con el izquierdo; el del martillo queda afuera (no le atraviesa el pecho)');
  // la pierna del jinete; el brazo de tu cuerpo (el mate en el saludo: no se reprodujo en el juego, no se tocó)
  ok(/p2\.position\.y = 0\.82 - g\.baja \+ alz;\n\s*p2\.rotation\.z = 0;/.test(gente), 'la pierna abierta del jinete se repone al caminar');
  ok(/brazos\[0\]\.rotation\.z = 0; brazos\[1\]\.rotation\.z = 0;/.test(fuente('personal-personaje-mundo.js')), 'tu cuerpo: el brazo vuelve después de soltar la mano');
}

ok(!/\r/.test(fuente('gesto-golpe.js')) && !/\r/.test(fuente('pueblo-detalles-juego.js')), 'fines de línea LF');
console.log(`OK 4.31.1 (A) · ${pasos} comprobaciones`);
