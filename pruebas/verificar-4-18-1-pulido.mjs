// 4.18.1 (parte C): las seis escenas del acto III que quedaron flojas en la 4.18.0, arregladas. Sólo Node.
//   papel-elsa      Elsa sobre el andén, de tu lado de la estación (antes del otro lado del edificio: la cámara la miraba contra el muro)
//   josefina-fin    el cartelito de chapa mira hacia donde llegás y un plano cercano lo muestra (ferns y troncos lo tapaban)
//   pedir-perdon    los planos se anclan a la raíz de verdad, no a 7 m delante tuyo
//   majada-fin      de frente al portón del galpón de esquila, con el cartel a un costado y a la luz del día (plano sin despeje)
//   prestado-herrero  Anselmo se arma de invitado; las estacas, a 6 m y de frente, vistas en picado sin despeje (bancos y estatua frenaban la cámara)
//   galpon-pelea    la ventana con barro es la del refugio: la cámara parte de ahí y viaja a la puertita del galpón
//   más: Herminia en la puerta de su casa (umbral-fin con la pelea), las tres lucecitas del mirador en cuadro, los amaneceres colocados.
// Cada arreglo tiene su mutación: se rompe a propósito y la prueba tiene que fallar (cada mutante es una copia con otro nombre: sin la caché de ESM).
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const aUrl = (f) => pathToFileURL(join(raiz, 'src', f)).href;

async function suite(sufijo = '', archMut = '') {
  const nom = (f) => (sufijo && archMut === f ? f.replace('.js', `${sufijo}.js`) : f);
  const imp = (f) => import(aUrl(nom(f)));
  const fuente = (f) => leer(`src/${nom(f)}`);
  const f0 = fallas;
  // el juntador de las escenas del acto III: al mutar uno de sus archivos, una copia del juntador apunta al mutante
  const cMut = /^historia-escenas-acto3-c\d+b?\.js$/.test(archMut) ? archMut : '';
  let juntador = 'historia-escenas-acto3.js';
  const extra = [];
  if (cMut && sufijo) {
    juntador = `historia-escenas-acto3${sufijo}.js`;
    const j = join(raiz, 'src', juntador);
    writeFileSync(j, leer('src/historia-escenas-acto3.js').replace(`'./${cMut}'`, () => `'./${cMut.replace('.js', `${sufijo}.js`)}'`));
    extra.push(j);
  }
  try {
    const A3 = await import(aUrl(juntador));
    const E3 = A3.ESCENAS_ACTO3;
    const COL = await imp('historia-colocacion.js');
    const EN = await imp('escenas.js');
    const D = await import(aUrl('historia-disparadores.js'));
    const PR = await imp('historia-props-acto3.js');
    const pasos = (id) => { const l = []; const r = (p) => { l.push(p); if (p.tipo === 'fundido') (p.alMedio || []).forEach(r); }; E3[id].pasos.forEach(r); return l; };
    const idx = (id, f) => pasos(id).findIndex(f);
    const esDlg = (p, rx) => p.tipo === 'dialogo' && rx.test(JSON.stringify(p.lineas));
    const refTxt = (r) => JSON.stringify(r);
    const mainJs = fuente('main.js'), objetos = fuente('historia-objetos.js'), acto3d = fuente('historia-disparadores-acto3.js');

    // ---------------------------------------------------------------- los lugares nuevos
    const NUEVOS = ['galpon-cartel', 'galpon-afuera', 'ventana-refugio', 'ventana-refugio-vista', 'casa-herminia-puerta', 'casa-herminia-calle'];
    for (const k of NUEVOS) {
      ok(D.LUGARES_HISTORIA.includes(k), `${k}: es un lugar de la historia`);
      ok(new RegExp(`ponr\\('${k}'|P\\['${k}'\\] =`).test(mainJs), `${k}: main.js lo arma en puntosDeHistoria`);
    }
    ok(/P\['galpon-cartel'\] = \{ x: c\.x, z: c\.z, rot: \(Number\(g\.rot\) \|\| 0\) \+ Math\.PI \}/.test(mainJs), 'el cartel del galpón queda de cara a afuera (rot del galpón + π)');
    ok(/aMundoRefugio\(g, 3\.6, -5\.25\)/.test(mainJs), 'a un costado del portón (el portón está en −z local, a 4,25 m del centro)');
    ok(/puntosMundo\('casa-abuela'\)\?\.puerta/.test(mainJs), 'la puerta de la casa de Herminia sale de los puntos de la aldea');
    ok(/aMundoRefugio\(ref, 1\.35, 3\.0\)/.test(mainJs) && /ventana-barro': \{ forma: 'barro-bellotas', lx: 1\.35, lz: 3\.0/.test(fuente('historia-props-acto3.js')), 'la ventana del refugio es donde está el barro (1,35; 3,0)');
    ok(/'galpon-cartel', 'galpon-afuera', 'ventana-refugio', 'ventana-refugio-vista', 'casa-herminia-puerta', 'casa-herminia-calle'/.test(acto3d), 'LUGARES_ACTO3 los suma');
    ok(/const INVITABLES_HIST = new Set\(\[[^\]]*'herrero'\]\)/.test(mainJs), 'Anselmo (herrero) se arma de invitado cuando una escena lo pide');

    // ---------------------------------------------------------------- la colocación
    const C = COL.COLOCACION_PULIDO;
    for (const id of ['majada-fin', 'prestado-herrero', 'amanecer-trato-ganada', 'amanecer-trato-perdida', 'amanecer-pelea-ganada', 'amanecer-pelea-perdida']) {
      ok(!!C[id] && COL.validarColocacion(C[id]).ok, `${id}: tiene una colocación válida`);
      ok(Object.hasOwn(D.COLOCACION_ESCENA, id) && JSON.stringify(D.COLOCACION_ESCENA[id]) === JSON.stringify(C[id]), `${id}: el juego la usa`);
    }
    ok(C['majada-fin']?.punto === 'galpon-cartel' && C['majada-fin']?.desde === 'galpon-afuera', 'majada-fin: de frente al portón del galpón de esquila, con el cartel a un costado');
    ok(C['prestado-herrero']?.npc === 'herrero' && C['prestado-herrero']?.desde === 'frente', 'prestado-herrero: Anselmo de cara a vos');
    ok(['amanecer-trato-ganada', 'amanecer-pelea-ganada'].every((k) => C[k]?.punto === 'galpon-noche'), 'los amaneceres: frente al galpón de la noche');
    // la colocación de un lugar con rot: un punto libre del lado de afuera
    {
      const ctx = { punto: (k) => ({ 'galpon-cartel': { x: 10, z: 10 }, 'galpon-afuera': { x: 10, z: -20 } })[k] || null, npc: () => null, libre: () => true };
      const r = COL.resolverColocacion(C['majada-fin'] || { punto: 'x' }, ctx);
      ok(r && Math.abs(r.x - 10) < 1e-6 && Math.abs(r.z - 4) < 1e-6, `se para a 6 m del cartel, del lado de afuera (${r && r.x.toFixed(2)}, ${r && r.z.toFixed(2)})`);
    }

    // ---------------------------------------------------------------- papel-elsa
    {
      const ap = pasos('papel-elsa').find((p) => p.tipo === 'gesto' && p.quien === 'elsa' && p.accion === 'aparecer');
      ok(ap && ap.a && ap.a.frente === 'jugador' && ap.a.dist >= 4.5 && ap.a.dist <= 6.5, `papel-elsa: Elsa aparece 5 m delante tuyo, sobre el andén (${refTxt(ap && ap.a)})`);
      ok(!/lugar: 'estacion', dx: -2/.test(JSON.stringify(E3['papel-elsa'])), 'papel-elsa: ya no aparece del otro lado de la estación (dx −2, dz 2,4)');
      const i = idx('papel-elsa', (p) => p.tipo === 'gesto' && p.quien === 'elsa' && p.accion === 'aparecer');
      ok(i >= 0 && i < idx('papel-elsa', (p) => p.tipo === 'dialogo'), 'papel-elsa: está antes de que hable');
    }
    // ---------------------------------------------------------------- josefina-fin
    {
      const iEf = idx('josefina-fin', (p) => p.tipo === 'efecto' && p.nombre === 'mundo:cartel-arbol-notable');
      const iPl = idx('josefina-fin', (p) => p.tipo === 'plano' && p.a && p.a.lugar === 'coihue' && p.plano === 'medio');
      const iNa = idx('josefina-fin', (p) => esDlg(p, /cartelito nuevo, de chapa/));
      ok(iEf >= 0 && iPl > iEf && iPl < iNa, `josefina-fin: un plano cercano al coihue, con el cartel puesto, antes de leerlo (${iEf}, ${iPl}, ${iNa})`);
      const pl = pasos('josefina-fin')[iPl];
      ok(pl && pl.dist >= 3 && pl.dist <= 6 && pl.alto >= 1.2 && pl.alto <= 2 && pl.miraY >= 1.3 && pl.miraY <= 1.6, `josefina-fin: a 3-6 m y a la altura del cartel (${pl && pl.dist}, ${pl && pl.alto}, ${pl && pl.miraY})`);
      ok(pl && pl.si && pl.si.args && pl.si.args.d === 'cuaderno' ? true : !!(pl && pl.si), 'josefina-fin: sólo con D4 = c (el cartel)');
      const iVuelve = idx('josefina-fin', (p, ) => p.tipo === 'plano' && p.a === 'josefina' && p.sinEsperar === true && p.dur >= 30);
      ok(iVuelve > iNa, 'josefina-fin: y vuelve a Josefina después');
      ok(/hacia: rf \? Math\.atan2\(rf\.z - q\.z, rf\.x - q\.x\)/.test(objetos) && /a = Number\.isFinite\(info\?\.hacia\) \? info\.hacia : 1\.2/.test(objetos), 'el cartelito del coihue mira hacia el refugio (de donde llegás)');
      ok(/\[0\.62, 0\.4, 0\.02\]/.test(objetos), 'el cartelito es más grande (0,62 × 0,40 m)');
    }
    // ---------------------------------------------------------------- pedir-perdon
    {
      const ps = pasos('pedir-perdon').filter((p) => p.tipo === 'plano');
      ok(ps.length >= 3 && ps.every((p) => p.a && p.a.lugar === 'molino-viejo'), `pedir-perdon: todos los planos anclados a la raíz (${ps.map((p) => refTxt(p.a)).join(' ')})`);
      ok(ps[0].dist >= 5 && ps[0].dist <= 8 && ps[0].alto >= 2 && ps[0].miraY <= 0.6, 'pedir-perdon: el general, a 6 m y desde arriba, mirando al piso');
      ok(ps[2].dist <= 1.8 && ps[2].alto <= 1.2, 'pedir-perdon: el detalle, cerca del suelo');
      ok(!pasos('pedir-perdon').some((p) => p.tipo === 'plano' && p.a && p.a.frente === 'jugador'), 'pedir-perdon: ningún plano a «N pasos delante tuyo»');
    }
    // ---------------------------------------------------------------- majada-fin
    {
      const p0 = pasos('majada-fin').find((p) => p.tipo === 'plano');
      ok(p0 && p0.a && p0.a.lugar === 'galpon-cartel' && p0.sinDespeje === true && p0.sinEsperar === true, `majada-fin: el primer plano, sobre el cartel, sin despeje (la cerca del corral frenaba la cámara) y sin esperar (${refTxt(p0 && p0.a)})`);
      ok(p0 && p0.dist >= 4 && p0.dist <= 7 && p0.alto >= 2, 'majada-fin: a 4-7 m y por encima de la cerca (2 m o más)');
      const iCartel = idx('majada-fin', (p) => p.tipo === 'efecto' && p.nombre === 'mundo:cartel-puesto-catrileo');
      const iNa = idx('majada-fin', (p) => esDlg(p, /En el galpón de esquila hay un cartel nuevo/));
      ok(iCartel >= 0 && iCartel < iNa, `majada-fin: el cartel está puesto antes del primer plano que lo cuenta (${iCartel}, ${iNa})`);
      ok(pasos('majada-fin').filter((p) => p.tipo === 'efecto' && p.nombre === 'mundo:cartel-puesto-catrileo').length === 1, 'majada-fin: el efecto se aplica una vez');
      const pr = PR.OBJETOS_PROPS_ACTO3['cartel-catrileo'];
      ok(pr && pr.punto === 'galpon-cartel', 'majada-fin: el prop del cartel está en el punto del cartel (no a 3 m del centro del galpón)');
    }
    // ---------------------------------------------------------------- prestado-herrero
    {
      const iEf = idx('prestado-herrero', (p) => p.tipo === 'efecto' && p.nombre === 'mundo:estacas-prestadas');
      const ef = pasos('prestado-herrero')[iEf];
      const pl = pasos('prestado-herrero').find((p) => p.tipo === 'plano' && p.plano === 'picado');
      ok(ef && ef.args && ef.args.donde && ef.args.donde.frente === 'jugador' && ef.args.donde.dist <= 7 && ef.args.donde.lado === 0, `prestado-herrero: las estacas, a 6 m y de frente (${refTxt(ef && ef.args)})`);
      ok(pl && pl.sinDespeje === true && pl.alto >= 4, 'prestado-herrero: picado alto y sin despeje (los bancos y la estatua frenaban la cámara)');
      ok(pl && JSON.stringify(pl.a) === JSON.stringify(ef && ef.args && ef.args.donde), 'prestado-herrero: el plano mira donde están las estacas');
    }
    // ---------------------------------------------------------------- galpon-pelea
    {
      const lb = pasos('galpon-pelea').find((p) => p.tipo === 'plano' && p.plano === 'libre');
      const iLb = idx('galpon-pelea', (p) => p.tipo === 'plano' && p.plano === 'libre');
      const iNa = idx('galpon-pelea', (p) => esDlg(p, /A la mañana, la ventana del refugio/));
      ok(lb && lb.pos && lb.pos.lugar === 'ventana-refugio-vista' && lb.mira && lb.mira.ref === 'ventana-refugio', 'galpon-pelea: la cámara parte de la ventana del refugio');
      ok(lb && lb.posFin && lb.posFin.frente === 'jugador' && lb.miraFin && lb.miraFin.frente === 'jugador', 'galpon-pelea: y viaja hasta la puertita del galpón (delante tuyo)');
      ok(lb && lb.sinEsperar === true && lb.dur >= 6, 'galpon-pelea: el viaje dura más que leer el primer renglón');
      ok(iLb >= 0 && iLb < iNa, 'galpon-pelea: arranca antes de que se cuente la ventana');
      ok(pasos('galpon-pelea').some((p) => p.tipo === 'efecto' && p.nombre === 'mundo:ventana-barro-y-bellotas'), 'galpon-pelea: el barro está puesto');
    }
    // ---------------------------------------------------------------- umbral-fin con la pelea (Herminia en su casa)
    {
      const ap = pasos('umbral-fin').find((p) => p.tipo === 'gesto' && p.quien === 'herminia' && p.accion === 'aparecer');
      ok(ap && ap.a && ap.a.lugar === 'casa-herminia-puerta' && ap.mira && ap.mira.lugar === 'casa-herminia-calle', 'umbral-fin: Herminia en la puerta de su casa, mirando a la calle');
      const pl = pasos('umbral-fin').find((p) => p.tipo === 'plano' && p.a && p.a.lugar === 'casa-herminia-puerta');
      ok(pl && pl.desde && pl.desde.lugar === 'casa-herminia-calle', 'umbral-fin: la cámara, en la puerta de su casa y del lado de la calle (la gente a más de 130 m no se dibuja: el plano no depende de ella)');
      ok(!pasos('umbral-fin').some((p) => p.tipo === 'gesto' && p.quien === 'herminia' && p.a && p.a.frente === 'jugador'), 'umbral-fin: Herminia ya no aparece 8 m delante del umbral del refugio');
    }
    // ---------------------------------------------------------------- las tres lucecitas del mirador
    {
      const iEf = idx('cerro-mirador', (p) => p.tipo === 'efecto' && p.nombre === 'duende:lucecitas-mirador');
      const iPl = idx('cerro-mirador', (p, ) => p.tipo === 'plano' && p.plano === 'medio' && p.a && p.a.frente === 'jugador' && p.a.dist === 2.4 && p.a.lado === 0.7);
      const iNa = idx('cerro-mirador', (p) => esDlg(p, /tres lucecitas ámbar que tiemblan/));
      ok(iEf >= 0 && iPl > iEf && iPl < iNa, `cerro-mirador: un plano cercano a las lucecitas antes de contarlas (${iEf}, ${iPl}, ${iNa})`);
      ok(/'lucecitas-tres': \(c\) => \{ for \(let i = 0; i < 3; i\+\+\) brilla\(c, 0\.055,/.test(objetos), 'las lucecitas del mirador son más grandes (5,5 cm) y a la altura de los ojos');
      const pr = PR.OBJETOS_PROPS_ACTO3['lucecitas-mirador'];
      ok(pr && pr.frente && pr.frente.adelante === 2.4 && pr.frente.lado === 0.7, 'y están donde mira el plano (2,4 m adelante, 0,7 al costado)');
    }
    // ---------------------------------------------------------------- el motor: planos sin despeje
    {
      const mundo = { posicion: (r) => (r && r.lugar ? { x: 10, z: 5 } : r === 'jugador' ? { x: 0, z: 0 } : null), suelo: () => 0 };
      const base = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 70 };
      const con = EN.compilarPlano({ tipo: 'plano', plano: 'general', a: { lugar: 'x' }, desde: 'jugador', dist: 6, alto: 2 }, { mundo, base })(0.5);
      const sin = EN.compilarPlano({ tipo: 'plano', plano: 'general', a: { lugar: 'x' }, desde: 'jugador', dist: 6, alto: 2, sinDespeje: true }, { mundo, base })(0.5);
      ok(con && !!con.foco, 'un plano normal lleva foco (para despejar la cámara)');
      ok(sin && !sin.foco && Number.isFinite(sin.x) && Number.isFinite(sin.yaw), 'con «sinDespeje» no lleva foco: escenas-mundo.js no lo despeja');
      const mez = EN.mezclarPoses({ ...con }, { ...sin }, 0.5);
      ok(!mez.foco, 'y al mezclarse con el plano anterior tampoco');
      ok(/if \(!f \|\| !col\?\.resolver\) return c;/.test(fuente('escenas-mundo.js')), 'escenas-mundo.js no despeja lo que no lleva foco');
    }
    // ---------------------------------------------------------------- el cartel y la tranquera, más grandes; el punto con rot orienta la malla
    ok(/\.\.\.\(Number\.isFinite\(p\.rot\) \? \{ rot: p\.rot \} : \{\}\)/.test(objetos), 'un lugar con rot (el cartel del galpón) orienta la malla');
    ok(/palo\(c, 0\.17, 1\.9, \[-1\.6, 0\.95, 0\]/.test(objetos) && /\[3\.0, 0\.17, 0\.1\]/.test(objetos), 'la tranquera abierta es más gruesa (a 18 m no se veía)');
    // 0 programas: nada de materiales ni luces nuevas
    ok(!/Light\(/.test(objetos) && (objetos.match(/new THREE\.\w+Material\(/g) || []).length === 1, 'sin luces ni materiales nuevos en historia-objetos.js (un solo MeshBasicMaterial, el de las brasas de la aldea)');
  } finally { for (const e of extra) rmSync(e, { force: true }); }
  return fallas - f0;
}

// ---------------------------------------------------------------- el módulo real
{
  const f = await suite();
  ok(true, `la suite sobre los módulos reales (${f} fallas)`);
}

// ---------------------------------------------------------------- mutaciones
const MUTACIONES = [
  ['historia-colocacion.js', 'majada-fin vuelve al puesto', "'majada-fin': { punto: 'galpon-cartel', dist: 6,", "'majada-fin': { punto: 'puesto', dist: 6,"],
  ['historia-colocacion.js', 'prestado-herrero sin colocación', "'prestado-herrero': { npc: 'herrero'", "'prestado-herrero-no': { npc: 'herrero'"],
  ['historia-colocacion.js', 'los amaneceres sin colocación', "'amanecer-trato-ganada': { punto: 'galpon-noche', dist: 6, desde: 'sendero' }", "'amanecer-trato-ganada-no': { punto: 'galpon-noche', dist: 6, desde: 'sendero' }"],
  ['historia-escenas-acto3-c9.js', 'Elsa del otro lado de la estación', "aparece('elsa', FRENTE(5.4, 1.2))", "aparece('elsa', { lugar: 'estacion', dx: -2, dz: 2.4 })"],
  ['historia-escenas-acto3-c13.js', 'el cartel del coihue de lejos', "dist: 4.4, alto: 1.5, miraY: 1.45", "dist: 14, alto: 3.2, miraY: 1.45"],
  ['historia-escenas-acto3-c10.js', 'pedir-perdon a 7 m delante tuyo', "plano('general', { lugar: 'molino-viejo' }, { desde: 'jugador', dist: 6,", "plano('general', FRENTE(7, 2), { desde: 'jugador', dist: 6,"],
  ['historia-escenas-acto3-c13.js', 'majada-fin con despeje', "sinEsperar: true, sinDespeje: true }),", "sinEsperar: true }),"],
  ['historia-escenas-acto3-c13.js', 'el cartel de Catrileo después del plano', "    // D5 = A (o sin decidir): Fermín llevó la majada (el cartel se ve desde el primer plano)\n    efecto('mundo:cartel-puesto-catrileo'),\n", "    // D5 = A (o sin decidir): Fermín llevó la majada (el cartel se ve desde el primer plano)\n"],
  ['historia-escenas-acto3-c11b.js', 'las estacas sin despeje', "mezcla: 0.9, sinDespeje: true }),", "mezcla: 0.9 }),"],
  ['historia-escenas-acto3-c11b.js', 'las estacas a 12 m', "efecto('mundo:estacas-prestadas', { donde: FRENTE(6, 0) })", "efecto('mundo:estacas-prestadas', { donde: FRENTE(12, 4) })"],
  ['historia-escenas-acto3-c10.js', 'la ventana del refugio, mirada desde el galpón', "pos: { lugar: 'ventana-refugio-vista', dy: 1.6 }", "pos: { lugar: 'galpon-noche', dy: 1.6 }"],
  ['historia-escenas-acto3-c13.js', 'Herminia 8 m delante del umbral', "aparece('herminia', { lugar: 'casa-herminia-puerta' }, { lugar: 'casa-herminia-calle' })", "aparece('herminia', FRENTE(8, 3))"],
  ['historia-escenas-acto3-c10.js', 'las lucecitas del mirador fuera de cuadro', "con(plano('medio', FRENTE(2.4, 0.7), { desde: 'jugador', dist: 1.8,", "con(plano('medio', FRENTE(9, 0.7), { desde: 'jugador', dist: 1.8,"],
  ['escenas.js', 'sinDespeje no hace nada', 'if (p.sinDespeje === true && f)', 'if (false && f)'],
  ['historia-objetos.js', 'el cartel del coihue no mira al refugio', 'a = Number.isFinite(info?.hacia) ? info.hacia : 1.2', 'a = 1.2'],
  ['historia-objetos.js', 'el punto con rot no orienta', '...(Number.isFinite(p.rot) ? { rot: p.rot } : {})', ''],
  ['historia-objetos.js', 'las lucecitas del mirador, otra vez chicas', "brilla(c, 0.055, [(i - 1) * 0.3, 0.95", "brilla(c, 0.03, [(i - 1) * 0.3, 0.95"],
  ['historia-props-acto3.js', 'el cartel de Catrileo en el centro del galpón', "punto: 'galpon-cartel', dx: 0, dz: 0, efecto: 'mundo:cartel-puesto-catrileo'", "punto: 'galpon', dx: 3.2, dz: 2.6, efecto: 'mundo:cartel-puesto-catrileo'"],
  ['main.js', 'el cartel del galpón sin lugar', "P['galpon-cartel'] = {", "P['galpon-cartel-no'] = {"],
  ['main.js', 'Anselmo no se arma de invitado', "'panadera', 'graciela', 'herrero']);", "'panadera', 'graciela']);"],
  ['main.js', 'la puerta de Herminia sin lugar', "ponr('casa-herminia-puerta', pu);", ''],
  ['historia-disparadores-acto3.js', 'los lugares nuevos sin declarar', "'galpon-cartel', 'galpon-afuera', 'ventana-refugio',", "'ventana-refugio',"],
];
{
  let atrapadas = 0, probadas = 0;
  const antes = callado;
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [arch, nombre, de, a] = MUTACIONES[i];
    const origen = leer(`src/${arch}`);
    const cuantas = origen.split(de).length - 1;
    ok(cuantas === 1, `la mutación «${nombre}» encuentra su lugar una vez en ${arch} (${cuantas})`);
    if (cuantas !== 1) continue;
    probadas++;
    const sufijo = `-mut181-${i}`;
    const copia = join(raiz, 'src', arch.replace('.js', `${sufijo}.js`));
    writeFileSync(copia, origen.replace(de, () => a));
    let fallo = false;
    callado = true;
    const f1 = fallas;
    try { await suite(sufijo, arch); fallo = fallas > f1; } catch { fallo = true; } finally { rmSync(copia, { force: true }); }
    fallas = f1;
    callado = antes;
    if (fallo) atrapadas++;
    ok(fallo, `la prueba atrapa la mutación: ${nombre}`);
  }
  ok(atrapadas === probadas && probadas === MUTACIONES.length, `se atraparon ${atrapadas} de ${MUTACIONES.length} mutaciones`);
  console.log(`  (${atrapadas} mutaciones atrapadas)`);
}

console.log(`verificar-4-18-1-pulido: ${n} comprobaciones, ${fallas} fallas`);
if (fallas) process.exit(1);
