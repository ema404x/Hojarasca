// 3.8.4 (sonido): las decisiones 32, 33 y 34 de DECISIONES_3_8_4.md.
// 32. (3.8.4: la Cueva de las Manos pasó a ser «El alero del arriero», con la historia de Martín y su abuelo.) 3.8.8: a pedido del
//     usuario vuelve la Cueva de las Manos, ahora como una gruta de roca natural, con las manos en negativo, y se saca la
//     historia de los arrieros (alero-arriero.js). Acá se comprueba cómo quedó (y que las partidas viejas no se rompen).
// 33. Las voces de los vecinos: un murmullo cálido, corto y suave que nunca da miedo; los duendes conservan la suya.
// 34. El silbato de la trochita: silbato de vapor con campanas en acorde, soplido, arranque, corte y eco del valle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as VZ from '../src/social-voz.js';
import { VOCES as VOCES_DUENDES } from '../src/voz-alien.js';
import { SILBATOS } from '../src/personal-trochita.js';
import { SILBATO_PAJARO } from '../src/tren-viaje.js';
import { ENTRADA } from '../src/cuaderno.js';
import { LUGARES_VISITA } from '../src/aldea-vida.js';
import { LUGARES_CITA } from '../src/amor.js';
import * as G from '../src/guardado.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad|ángel|amén|pecado|\balmas?\b/i;

// ============================================================ 33. las voces
{
  const claves = ['aldea-nene', 'aldea-nena', 'pintora', 'aldea-madre', 'aldea-abuela', 'aldea-padre', 'martin', 'ramon', 'ercilia'];
  const textos = ['Hoy bajé al lago temprano y estaba quieto como un espejo.', '¿Vos viste cómo está el tiempo para mañana?', '¡Jaja, qué ocurrencia la tuya!', 'Bueno.',
    'Esto es un renglón larguísimo que dice muchas cosas sobre el tren, la lluvia, la pesca en el lago y lo que pasó ayer en la plaza con el perro.'];
  for (const k of claves) {
    const v = VZ.vozDe(k);
    ok(v.temblor === 0, `${k}: sin temblor (el vibrato de los mayores sonaba a fantasma)`);
    ok(v.aliento > 0 && v.aliento < 0.45, `${k}: con un poco de aire`);
    for (const [i, t] of textos.entries()) {
      const p = VZ.planBalbuceo(t, v, i);
      ok(p.silabas.length >= 2 && p.silabas.length <= 4, `${k} «${t.slice(0, 20)}»: dos a cuatro sílabas (${p.silabas.length})`);
      ok(p.dur <= VZ.BALBUCEO.maxDur + 0.2, `${k}: corto (${p.dur} s)`);
      ok(p.silabas.every((s) => s.cons === null || s.cons === 'm' || s.cons === 'h'), `${k}: sin «s», «ch» ni «t» (los soplidos agudos sonaban a susurro)`);
      ok(p.silabas.every((s) => ['m', 'a', 'e', 'i', 'o'].includes(s.vocal) && s.f0 > 60 && s.f0b > 60), `${k}: vocales y tonos posibles`);
    }
    // nada de saltos raros: ninguna sílaba se va más de un 45 % de la voz de esa persona
    const todos = textos.flatMap((t, i) => VZ.planBalbuceo(t, v, i).silabas);
    ok(todos.every((s) => s.f0 < v.f0 * 1.45 && s.f0b < v.f0 * 1.45 && s.f0 > v.f0 * 0.75), `${k}: el tono no se dispara`);
  }
  ok(VZ.gestoDe('¡Jaja, qué ocurrencia!') === 'risa' && VZ.gestoDe('Me hiciste reír.') === 'risa', 'la risita, cuando hay de qué reírse');
  ok(['eh', 'mm?'].includes(VZ.gestoDe('¿Vamos mañana?')), 'la pregunta es un «¿eh?» o un «¿mm?»');
  ok(['mm-hm', 'a-ha', 'mmm', 'ah'].includes(VZ.gestoDe('Hoy hace frío.')), 'lo dicho, un «mm-hm», un «a-há», un «mmm» o un «ah»');
  const preg = VZ.planBalbuceo('¿Vamos a pescar mañana temprano?', VZ.vozDe('carpintero'), 2);
  ok(preg.silabas.at(-1).f0b > preg.silabas.at(-1).f0 && preg.silabas.at(-1).f0 > preg.silabas[0].f0, 'la pregunta sube al final');
  // la risita de los vecinos no es la de los duendes: abierta, de tres o cuatro sílabas con aire
  const risa = VZ.planBalbuceo('¡Jaja!', VZ.vozDe('aldea-padre'), 1);
  ok(risa.gesto === 'risa' && risa.silabas.every((s) => s.cons === 'h' && s.vocal !== 'i'), 'la risita de un grande, «ja-ja» con aire');
  // el motor
  const s = leer('src/sonido.js');
  const tramo = s.slice(s.indexOf('  balbuceo(plan, {'), s.indexOf('  bramido(pos) {'));
  ok(/vozSuave/.test(tramo) && /'peaking'/.test(tramo) && !/'bandpass'; f1/.test(tramo), 'la voz: glotis relajada y los formantes como realces (la fundamental pasa)');
  ok(!/temblor/.test(tramo), 'el balbuceo ya no tiembla');
  ok(/vozSuave: onda\(serie\(30, \(h\) => Math\.pow\(h, -1\.9\)\)\)/.test(s), 'la onda suave');
  // el murmullo de la plaza es gente, no gargantas
  const mm = leer('src/aldea-mecanicas-mundo.js');
  const mur = mm.slice(mm.indexOf('  function murmullo(p) {'), mm.indexOf('  function ladridoLejos'));
  ok(/balbuceo/.test(mur) && !/garganta/.test(mur), 'el murmullo de la plaza, con la voz de los vecinos');
  // los duendes conservan su voz (voz-alien.js no se tocó: la risita «ji-ji-ji» sigue)
  ok(VOCES_DUENDES.rastreador.risa === 9 && VOCES_DUENDES.saltador.risa === 11.5, 'los duendes, con su risita de siempre');
  ok(/3\.8\.0: la risita de los duendes/.test(s), 'y el motor de su voz, igual');
}

// ============================================================ 34. el silbato
{
  const todos = { ...SILBATOS, pajaro: SILBATO_PAJARO };
  for (const [id, S] of Object.entries(todos)) {
    ok(S.canos.length >= 3, `${id}: tres campanas o más`);
    // un acorde, no los armónicos de una sola nota (520, 780, 1040 era eso)
    const fs0 = S.canos.map(([f]) => f).sort((a, b) => a - b);
    for (let i = 1; i < fs0.length; i++) {
      const r = fs0[i] / fs0[0];
      ok(Math.abs(r - Math.round(r)) > 0.04 || r > 1.9, `${id}: la campana ${fs0[i]} Hz no es un armónico de la primera (${r.toFixed(2)})`);
    }
    ok(S.vibrato > 0 && S.vibrato < 12 && S.soplo > 0, `${id}: la presión y el soplido`);
  }
  ok(SILBATOS.clasico.canos.length === 3 && SILBATOS.grave.canos.length === 5, 'el de siempre, tres campanas; el grave, cinco');
  const s = leer('src/sonido.js');
  const sil = s.slice(s.indexOf('  silbato(pos, tipo = this.silbatoElegido) {'), s.indexOf('  trueno(lejos = 0.5) {'));
  ok(/ecoDelValle\(/.test(sil) && /pitada\(S, t0 \+ cuando/.test(sil), 'cada pitada, con el eco del valle');
  ok(/setValueAtTime\(f \* 0\.8, tc\)/.test(sil), 'el arranque: las campanas arrancan bajas y suben con la presión');
  ok(/setTargetAtTime\(f \* 0\.87, tFin/.test(sil), 'el corte: el tono cae al cerrar la válvula');
  ok(/se cierra: el vapor que queda se escapa/.test(sil), 'y el vapor se escapa');
  ok(/ondas\.campana/.test(sil) && /campana: onda\(/.test(s), 'la campana, un caño cerrado');
  ok((sil.match(/createDelay/g) || []).length === 1 && /\[0\.42, 0\.42, -0\.55, 2200\]/.test(sil), 'cuatro paredes de eco');
}

// ============================================================ 32. la Cueva de las Manos (vuelve en la 3.8.8)
{
  const est = leer('src/estructuras.js');
  ok(/cartel\('Cueva de las Manos'/.test(est) && /nombre: 'Cueva de las Manos'/.test(est), 'el cartel y el nombre');
  ok(/manos en negativo y guanacos/.test(est) && /const guanaco = /.test(est) && /const mano = /.test(est), 'la pared pintada, con las manos en negativo y los guanacos');
  // la gruta: bloques redondeados abollados, no el techo y los muros de cajas
  ok(/abollar\(g, fuerza, /.test(est) && /new THREE\.IcosahedronGeometry\(1, 1\)/.test(est), 'la gruta de bloques redondeados');
  ok(!/BoxGeometry\(ANCHO \+ 3\.4, 2\.2/.test(est) && !/BoxGeometry\(3\.2, ALTO \+ 8/.test(est) && !/BoxGeometry\(ANCHO \+ 6, ALTO \+ 9/.test(est), 'sin el techo ni los muros rectos de antes');
  // el sorteo no cambia: la cueva sólo tira de r() en lo de siempre (el sitio, las nueve piedras sueltas y el fogón)
  const bloque = est.slice(est.indexOf('let cueva = null;'), est.indexOf("registrarHuella('cueva'"));
  ok(!/Sepúlveda|J\. Miranda|herradura|hollin|pirca|tizones|tallar\(/.test(bloque), 'sin lo de los arrieros en la cueva (nombres tallados, herradura, pirca, hollín)');
  const codigo = bloque.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  ok((codigo.match(/\br\(\)/g) || []).length === 10, `la cueva tira del sorteo exactamente como antes (${(codigo.match(/\br\(\)/g) || []).length} llamadas)`);
  ok(/const hs = \(k\) =>/.test(bloque), 'y el azar de la roca es propio');
  ok(/registrarHuella\('cueva', cueva, 9, 5\)/.test(est), 'la misma huella');
  ok(/linea\(\[-ANCHO \/ 2 - 0\.2, 1\.0\], \[-ANCHO \/ 2 - 0\.2, -FONDO \+ 1\.05 - 0\.3\]\)/.test(est) && /suelo: 'tierra'/.test(bloque) && /suelo: 'piedra'/.test(bloque), 'las mismas colisiones y los pisos que suenan a tierra y a piedra');
  // el cuaderno, el visitante, la cita y la foto: de nuevo la Cueva de las Manos (el id es el mismo)
  const e = ENTRADA.cueva;
  ok(e && e.nombre === 'Cueva de las Manos' && /manos en negativo/.test(e.texto) && !/arriero/i.test(e.texto), 'la entrada del cuaderno');
  ok(LUGARES_VISITA.cueva.nombre === 'la Cueva de las Manos' && /manos pintadas/.test(LUGARES_VISITA.cueva.pide), 'el visitante pregunta por la cueva');
  ok(/pinturas/.test(LUGARES_CITA.cueva.nombre) && /pinturas/.test(LUGARES_CITA.cueva.cita), 'la cita con la pintora');
  ok(/id: 'f-manos', nombre: 'Las manos'/.test(leer('src/fotos.js')), 'la foto de las manos');
  const en = ['b', 'e', 'g', 'l'].map((x) => leer(`src/idioma-en-${x}.js`)).join('\n');
  ok(/'Cueva de las Manos'/.test(en) && !/Drover's Overhang/.test(en), 'el inglés, de nuevo el de la Cueva de las Manos');
  ok(en.includes(e.texto.slice(0, 60)), 'el cuaderno en inglés');
  // la historia de los arrieros se sacó entera
  ok(!fs.existsSync(new URL('../src/alero-arriero.js', import.meta.url)), 'ya no existe alero-arriero.js');
  for (const f of ['src/main.js', 'src/guardado.js', 'src/vecindad-juego.js', 'src/vecindad-social.js']) {
    // (guardado.js descarta el campo viejo a propósito: `aleroArriero: undefined`)
    const texto = leer(f).replace('    aleroArriero: undefined,\n', '');
    ok(!/aleroJuego|aleroArriero|alero-arriero|crearAleroJuego|ctx\.alero|\^alero:/.test(texto.replace(/\/\/ 3\.8\.8: la historia del abuelo[^\n]*\n/, '')), `${f}: sin rastros de la historia del alero`);
  }
  // una partida vieja que traía el estado de la historia se carga sin romperse (y sin el campo)
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); }, key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } };
  G.usarModoGuardado('relax', 1);
  ok(!('aleroArriero' in G.progresoNuevo()), 'la partida nueva no trae el estado de la historia');
  G.guardarProgreso({ ...G.progresoNuevo(), dia: 5, aleroArriero: { paso: 2, dia: 4 } });
  const cargada = G.cargarProgreso();
  ok(cargada && cargada.dia === 5 && cargada.aleroArriero === undefined, 'una partida vieja con la historia empezada se carga igual, sin el campo');
}

console.log(`OK 3.8.4 sonido y 3.8.8 cueva · ${n} verificaciones · la Cueva de las Manos (gruta) sin la historia de los arrieros, voces cálidas, silbato de vapor`);
