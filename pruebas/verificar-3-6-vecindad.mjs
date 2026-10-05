// 3.6 "Vecinos con más vida, tipo Sims sin exagerar" (PLAN_ALDEA.md, sección 13): la vecindad
// (src/vecindad.js y src/vecindad-voces.js), sin Electron.
//  · los perfiles: rasgos, gustos con ids reales del juego (cosas que se llevan encima),
//    amigos, voces completas y sin nada religioso ni de economía;
//  · la autonomía: nunca pisa el trabajo ni lo que fija `rutinaAldea` (barrido de horas y días
//    para cada persona), reacciona a la lluvia, la nieve y la noche, y es determinista;
//  · regalar (uno por día, la reacción según el gusto), invitar (rechazos con motivo, amistad
//    una vez por día), las ayudas de cada oficio;
//  · la amistad: niveles que suben, lo que abren y que nunca vuelve de amigo a conocido;
//  · la memoria: comentarios sin repetir, sólo lo reciente y lo que tiene sentido;
//  · el guardado: el saneador con basura, `progreso.vecindad` y el tamaño acotado tras 1000 días.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as V from '../src/vecindad.js';
import * as VZ from '../src/vecindad-voces.js';
import * as A from '../src/aldea.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { BIENES } from '../src/comercio.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const IDS_ENTRADAS = new Set(ENTRADAS.map((e) => e.id));
const MATERIALES = [...leer('src/construccion.js').match(/export const MATERIALES = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
const PERSONAS = V.PERSONAS_VECINDAD;
const ALDEA = A.ORDEN_PERSONAS_ALDEA;
const copia = (x) => JSON.parse(JSON.stringify(x));
// Una partida chica para las pruebas.
const partida = (extra = {}) => ({ dia: 1, horas: 12, entradas: {}, materiales: {}, cosas: {}, aldea: A.aldeaNueva(), vecindad: V.vecindadNueva(), ...extra });
const lleno = () => {
  const inv = { materiales: {}, cosas: {}, entradas: {} };
  for (const [k, r] of Object.entries(V.REGALABLES)) {
    if (r.tipo === 'material') inv.materiales[k] = 99;
    else if (r.tipo === 'cosa') inv.cosas[k] = 99;
    else inv.entradas[k] = { cantidad: 99 };
  }
  return inv;
};
// Una aldea con todos viviendo y los locales abiertos.
const aldeaCompleta = () => {
  const a = A.aldeaNueva();
  a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  return A.sanearAldea(a);
};
// Con una obra en curso (el herrero levanta la herrería) y alguien esperando en el andén.
const aldeaConObra = () => {
  const a = A.aldeaNueva();
  a.pobladores = [{ clave: 'carpintero', dia: 1 }, { clave: 'panadera', dia: 2 }, { clave: 'herrero', dia: 5 }];
  a.locales = { carpinteria: 3, panaderia: 4 };
  a.llegando = null;
  return A.sanearAldea(a);
};

// ============================================================ 0. el módulo
{
  for (const f of ['src/vecindad.js', 'src/vecindad-voces.js']) {
    const t = leer(f);
    ok(!/from 'three'|document\.|window\.|localStorage/.test(t), `${f} es puro`);
    ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !/^import\s+'/m.test(t), `${f}: lo que entiende armar.mjs`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `import en una línea: ${m[0]}`);
    ok(!t.includes('\r'), `${f}: fines de línea LF`);
    ok(/^\/\/ 3\.6:/.test(t), `${f}: comentario con la versión`);
  }
  for (const k of [...Object.keys(V), ...Object.keys(VZ)]) ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  ok(leer('package.json').includes('node pruebas/verificar-3-6-vecindad.mjs'), 'la prueba está en el gate');
  const g = leer('src/guardado.js');
  ok(g.includes("import { sanearVecindad, vecindadNueva } from './vecindad.js';") && g.includes('vecindad: vecindadNueva(),') && g.includes('vecindad: sanearVecindad(p.vecindad),'), 'guardado.js guarda la vecindad');
  // sin nada religioso (pedido del usuario) ni economía (rechazada)
  // (lo que lee el jugador: los textos, no los comentarios del código)
  const texto = JSON.stringify([VZ.VOCES, VZ.AYUDAS, VZ.COMENTARIOS, VZ.FRASES, V.REGALABLES, V.ACTIVIDADES]) + [...leer('src/vecindad.js').matchAll(/'(?:[^'\\\n]|\\.)*'/g)].map((m) => m[0]).join(' ');
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|plata|pesos|precio\w*|cobr\w+|vend\w+|pag\w+)\b/i;
  const m = texto.match(prohibido);
  ok(!m, `sin religión ni economía (encontré «${m?.[0]}»)`);
}

// ============================================================ 1. los perfiles y los gustos
{
  ok(PERSONAS.length >= 23, 'todos los vecinos del Relax');
  for (const k of ['jefe', 'nelida', 'abuela', 'padre', 'madre', 'nene', 'nena', 'galesa', 'ercilia', ...A.ORDEN_POBLADORES_ALDEA, 'ramon', 'nicanor', 'ema', 'guarda']) ok(PERSONAS.includes(k), `está ${k}`);
  for (const k of ALDEA) ok(PERSONAS.includes(k), `la aldea entera: ${k}`);
  eq(Object.keys(V.PERFILES_VECINOS).sort(), [...PERSONAS].sort(), 'un perfil por persona');
  // lo regalable: ids reales del juego y que se llevan encima
  for (const [k, r] of Object.entries(V.REGALABLES)) {
    if (r.tipo === 'material') ok(MATERIALES.includes(k), `material real: ${k}`);
    else ok(IDS_ENTRADAS.has(k), `id real del cuaderno: ${k}`);
    ok(Object.hasOwn(BIENES, k) || leer('src/mochila.js').includes(`cant('${k}')`) || leer('src/mochila.js').includes(`cosas?.${k}`), `se lleva encima: ${k}`);
    ok(r.n >= 1 && typeof r.nombre === 'string' && typeof r.el === 'string', `cómo se dice: ${k}`);
  }
  const efectoReal = (e, m) => {
    ok(['material', 'cosa', 'entrada'].includes(e.tipo) && e.n >= 1, m);
    ok(e.tipo === 'material' ? MATERIALES.includes(e.k) : IDS_ENTRADAS.has(e.k), `${m}: id real ${e.k}`);
  };
  for (const k of PERSONAS) {
    const p = V.PERFILES_VECINOS[k];
    ok(p.rasgos.length >= 2 && p.rasgos.length <= 3 && p.rasgos.every((r) => V.RASGOS.includes(r)), `${k}: 2 o 3 rasgos`);
    const { encanta, gusta, noGusta } = p.gustos;
    ok(encanta.length === 3 && gusta.length === 2 && typeof noGusta === 'string', `${k}: 3, 2 y 1`);
    const todos = [...encanta, ...gusta, noGusta];
    ok(new Set(todos).size === 6 && todos.every(V.esRegalable), `${k}: gustos distintos y regalables`);
    ok(p.amigos.length >= 2 && p.amigos.length <= 3 && p.amigos.every((a) => a !== k && V.esPersonaVecindad(a)), `${k}: 2 o 3 amigos`);
    efectoReal(p.regala, `${k}: su regalo`);
    const voz = VZ.VOCES[k];
    ok(!!voz, `${k}: tiene voz`);
    for (const c of encanta) ok(typeof voz.encanta[c] === 'string' && voz.encanta[c].length > 30, `${k}: texto propio para ${c}`);
    for (const campo of ['gusta', 'noGusta', 'ocupado', 'acepta', 'saludoAmigo', 'saludoCompadre', 'fauna', 'regalo']) ok(typeof voz[campo] === 'string' && voz[campo].length > 5, `${k}: ${campo}`);
    ok(voz.saludoAmigo.includes('{nombre}') && voz.saludoCompadre.includes('{nombre}') && voz.fauna.includes('{unbicho}') && voz.acepta.includes('{lugar}'), `${k}: marcas`);
    ok(['bien', 'cansado', 'inquieto', 'charla'].every((a) => typeof voz.animo[a] === 'string'), `${k}: cuatro ánimos`);
    ok(voz.historia.partes.length === 3 && voz.historia.titulo, `${k}: historia en tres partes`);
    ok(voz.sobremesa.length >= 3 && voz.visita.length === 2, `${k}: sobremesa y visita`);
    ok(Array.isArray(VZ.AYUDAS[k]) && VZ.AYUDAS[k].length >= 1, `${k}: una ayuda de su oficio`);
    for (const a of VZ.AYUDAS[k]) {
      ok(a.id && a.titulo && a.gracias.length && a.consejo, `${k}/${a.id}: completa`);
      if (a.pide) efectoReal(a.pide, `${k}/${a.id}: pide`);
      if (a.devuelve) { efectoReal(a.devuelve, `${k}/${a.id}: devuelve`); ok(a.devuelve.n <= 3, 'algo chico'); }
    }
  }
  // lo que pidió el usuario, con sentido
  ok(V.PERFILES_VECINOS.abuela.gustos.encanta.includes('calafate'), 'a la abuela, el calafate de su dulce');
  ok(V.PERFILES_VECINOS.herrero.gustos.encanta.includes('trucha-ahumada'), 'al herrero, la trucha ahumada');
  for (const c of ['nene', 'nena']) ok(['frutilla', 'miel'].every((x) => V.PERFILES_VECINOS[c].gustos.encanta.includes(x)), `a ${c}, frutillas y miel`);
  ok(V.PERFILES_VECINOS.panadera.gustos.noGusta === 'pan-casero' && V.PERFILES_VECINOS.pescador.gustos.noGusta === 'trucha-fresca', 'no le regalás lo suyo');
  // las amistades tienen ida y vuelta casi siempre
  let mutuas = 0, total = 0;
  for (const k of PERSONAS) for (const a of V.PERFILES_VECINOS[k].amigos) { total++; if (V.PERFILES_VECINOS[a].amigos.includes(k)) mutuas++; }
  ok(mutuas / total > 0.5, 'la mayoría de las amistades son mutuas');
  // los comentarios: hechos conocidos y personas reales
  for (const [h, tabla] of Object.entries(VZ.COMENTARIOS)) {
    ok(Object.hasOwn(V.HECHOS, h), `hecho conocido: ${h}`);
    for (const k of Object.keys(tabla)) ok(k.startsWith('_') || V.esPersonaVecindad(k), `${h}: ${k}`);
  }
  for (const [h, d] of Object.entries(V.HECHOS)) ok(d.que && d.donde, `hecho documentado: ${h}`);
}

// ============================================================ 2. la autonomía
{
  const OBLIGA = new Set(['trabajo', 'local', 'escuela', 'obra', 'estacion', 'biblioteca', 'almacen']);
  const aldeas = { nueva: A.aldeaNueva(), completa: aldeaCompleta(), obra: aldeaConObra() };
  const cuenta = { sol: {}, lluvia: {}, nieve: {} };
  let barridos = 0, libres = 0, visitas = 0;
  for (const [nombreAldea, aldea] of Object.entries(aldeas)) {
    const est = { aldea, vecindad: V.vecindadNueva() };
    for (const persona of ALDEA) {
      const amigos = V.PERFILES_VECINOS[persona].amigos;
      const des = A.desfaseDe(persona);
      for (let ds = 0; ds < 7; ds++) {
        for (let q = 0; q < 96; q++) {
          const h = q / 4 + 0.07;
          const r = A.rutinaAldea(persona, h, ds, aldea);
          for (const clima of nombreAldea === 'obra' ? ['sol'] : ['sol', 'lluvia', 'nieve']) {
            const e = V.elegirActividad(persona, h, ds, clima, est, q * 7 + ds);
            barridos++;
            if (!r.lugar) { assert.equal(e.actividad, null); continue; }
            const t = h - des;
            // la rutina manda: trabajo, cama, almuerzo, cuentos, música, leyenda
            const dormir = r.punto === 'cama' || r.punto === 'cama-chicos';
            if (OBLIGA.has(r.lugar) || dormir) assert.equal(e.libre, false, `${persona} ${ds} ${h}: en hora de ${r.lugar}`);
            if (!e.libre) {
              assert.equal(e.actividad, 'rutina');
              assert.equal(e.edificio, r.edificio, `${persona} ${ds} ${h}: sigue la rutina`);
              assert.equal(e.punto, r.punto);
              continue;
            }
            libres++;
            assert.ok(Object.hasOwn(V.ACTIVIDADES, e.actividad), e.actividad);
            assert.ok(Object.hasOwn(A.puntosDe(e.edificio), e.punto), `${persona}: ${e.edificio}/${e.punto} existe`);
            // lo libre no se come el trabajo que viene: todo el rato elegido sigue libre
            assert.ok(e.duracion >= 0 && e.duracion <= 3);
            for (let s = 0; s * 0.02 < e.duracion - 1e-6; s++) {
              const x = s * 0.02;
              const hx = h + x, dx = hx >= 24 ? (ds + 1) % 7 : ds;
              assert.ok(V.estaLibre(persona, hx % 24, dx, est), `${persona} ${ds} ${h}+${x.toFixed(2)}: ${e.actividad} pisa la rutina`);
            }
            if (e.con) { visitas++; assert.ok(amigos.includes(e.con), `${persona} visita a un amigo`); }
            const afuera = V.ACTIVIDADES[e.actividad].afuera;
            if (clima === 'lluvia') assert.ok(!afuera && e.edificio !== 'plaza', `${persona}: con lluvia, a cubierto (${e.actividad})`);
            if (t >= 20.5) assert.ok(!afuera && !['plaza', 'biblioteca', 'almacen', 'casa-te', 'estacion-aldea'].filter((x) => x !== A.VECINOS_ALDEA[persona]?.casa && x !== (e.con && A.rutinaAldea(e.con, 3, ds, aldea).edificio) && x !== A.rutinaAldea(persona, 3, ds, aldea).edificio).includes(e.edificio), `${persona} ${h}: de noche, adentro (${e.actividad} en ${e.edificio})`);
            if (e.actividad === 'palear') assert.equal(clima, 'nieve');
            if (e.actividad === 'jugar') assert.ok(A.VECINOS_ALDEA[persona]?.chico, 'juegan los chicos');
            if (nombreAldea !== 'obra') cuenta[clima][e.actividad] = (cuenta[clima][e.actividad] || 0) + 1;
          }
        }
      }
    }
  }
  ok(barridos > 50000 && libres > 5000, `barrido de horas y días (${barridos}, ${libres} libres)`);
  ok(visitas > 100, 'se visitan entre amigos');
  const parte = (c, ks) => ks.reduce((s, k) => s + (cuenta[c][k] || 0), 0) / Object.values(cuenta[c]).reduce((s, x) => s + x, 0);
  ok(parte('sol', ['plaza', 'paseo']) > 0.12, 'con lindo día, plaza y paseo');
  eq(parte('lluvia', ['plaza', 'paseo', 'regar', 'lena', 'jugar', 'palear']), 0, 'con lluvia, nadie afuera');
  ok(parte('lluvia', ['te', 'galeria', 'leer', 'visitar', 'descansar', 'compras']) === 1 && (cuenta.lluvia.galeria || 0) > 0, 'con lluvia: galería, té, adentro');
  ok((cuenta.nieve.palear || 0) > 0 && !cuenta.sol.palear && !cuenta.lluvia.palear, 'con nieve, alguno palea la vereda');
  ok(parte('sol', ['plaza', 'paseo']) > parte('nieve', ['plaza', 'paseo']), 'con nieve, menos plaza');
  ok((cuenta.sol.te || 0) > 0 && (cuenta.sol.compras || 0) > 0 && (cuenta.sol.leer || 0) > 0 && (cuenta.sol.lena || 0) > 0 && (cuenta.sol.regar || 0) > 0 && (cuenta.sol.jugar || 0) > 0, 'té, almacén, biblioteca, leña, riego y juego');
  // el té en la casa de té, sólo mientras Ceinwen atiende la galería
  {
    const aldea = aldeaCompleta(), est = { aldea };
    let enCasaTe = 0;
    for (let s = 0; s < 400; s++) for (const h of [18.8, 19.3]) {
      const e = V.elegirActividad('nelida', h, 2, 'sol', est, s);
      if (e.edificio === 'casa-te') { enCasaTe++; assert.equal(A.rutinaAldea('galesa', h, 2, aldea).punto, 'adentro', 'sólo con la galería abierta'); }
    }
    ok(enCasaTe > 0, 'a la tarde, al té');
    let r = 0;
    for (let s = 0; s < 300; s++) { const e = V.elegirActividad('jefe', 21, 2, 'sol', est, s); if (e.edificio === 'casa-te') r++; }
    ok(r === 0, 'de noche, la casa de té está cerrada');
  }
  // los del valle: en lo suyo
  for (const k of V.VALLE_VECINDAD) {
    const e = V.elegirActividad(k, 15, 2, 'sol', {}, 3);
    ok(e.lugar === 'suyo' && e.edificio === null && e.punto === null && e.libre, `${k}: autonomía mínima`);
    ok(V.elegirActividad(k, 23, 2, 'sol', {}, 3).nombre === 'quedarse adentro' && V.elegirActividad(k, 15, 2, 'lluvia', {}, 3).nombre === 'quedarse bajo techo', `${k}: de noche y con lluvia, adentro`);
  }
  eq(V.elegirActividad('nadie', 12, 1, 'sol', {}, 1).actividad, null, 'una clave rara no hace nada');
  // determinismo con semilla
  {
    const est = { aldea: aldeaCompleta(), vecindad: V.vecindadNueva() };
    const a = [], b = [];
    for (const k of ALDEA) for (const h of [7.5, 14.2, 18.6, 20.9]) { a.push(V.elegirActividad(k, h, 3, 'sol', est, 42)); b.push(V.elegirActividad(k, h, 3, 'sol', copia(est), 42)); }
    eq(a, b, 'misma semilla, mismas elecciones');
    const distintas = new Set(Array.from({ length: 40 }, (_x, s) => V.elegirActividad('madre', 14.2, 3, 'sol', est, s).actividad));
    ok(distintas.size >= 3, 'con otra semilla, otra cosa');
  }
  // las ganas: suben y bajan con lo que hacen, y cambian lo que eligen
  {
    const est = { aldea: aldeaCompleta(), vecindad: V.vecindadNueva() };
    ok(V.cumplirActividad(est, 'carpintero', { actividad: 'visitar', duracion: 2, con: 'padre' }), 'cumplir una actividad');
    const g = est.vecindad.personas.carpintero.ganas;
    ok(g.social < 0.3 && g.descanso > 0.4, 'visitar baja las ganas de charlar y sube las demás');
    const contar = (e2) => { let s = 0; for (let x = 0; x < 300; x++) if (V.elegirActividad('carpintero', 19.2, 2, 'nublado', e2, x).actividad === 'visitar') s++; return s; };
    const conGanas = { aldea: est.aldea, vecindad: V.vecindadNueva() };
    V.cumplirActividad(conGanas, 'carpintero', { actividad: 'descansar', duracion: 3 });
    ok(contar(conGanas) > contar(est), 'el que recién charló tiene menos ganas de visitar');
    ok(!V.cumplirActividad(est, 'carpintero', { actividad: 'volar' }), 'una actividad rara no cuenta');
  }
}

// ============================================================ 3. regalar
{
  for (const k of PERSONAS) {
    const p = partida({ dia: 4 }), inv = lleno();
    const { encanta, gusta, noGusta } = V.PERFILES_VECINOS[k].gustos;
    const r1 = V.regalar(k, encanta[0], p, 4, inv);
    ok(r1.ok && r1.reaccion === 'encanta' && r1.renglones[0] === VZ.VOCES[k].encanta[encanta[0]], `${k}: le encanta, con su texto`);
    eq(r1.efectos, [{ tipo: V.REGALABLES[encanta[0]].tipo, k: encanta[0], n: -V.REGALABLES[encanta[0]].n }], `${k}: se descuenta lo regalado`);
    const puntos = p.vecindad.personas[k].p;
    const r2 = V.regalar(k, gusta[0], p, 4, inv);
    ok(!r2.ok && r2.reaccion === 'ya-hoy' && r2.efectos.length === 0 && p.vecindad.personas[k].p === puntos, `${k}: un regalo por día`);
    const r3 = V.regalar(k, gusta[0], p, 5, inv);
    ok(r3.ok && r3.reaccion === 'gusta' && !/\{|\}/.test(r3.renglones[0]), `${k}: le gusta`);
    const r4 = V.regalar(k, noGusta, p, 6, inv);
    ok(r4.ok && r4.reaccion === 'noGusta' && r4.renglones[0] === VZ.VOCES[k].noGusta && r4.amistad.cambio === 0, `${k}: no le gusta`);
    const neutra = Object.keys(V.REGALABLES).find((c) => V.gustoDe(k, c) === 'neutro');
    const r5 = V.regalar(k, neutra, p, 7, inv);
    ok(r5.ok && r5.reaccion === 'neutro' && VZ.FRASES.neutro.includes(r5.renglones[0]), `${k}: lo demás, un gracias`);
    // (3.7.0: el día de su cumpleaños, lo que le gusta vale el doble)
    const x2 = (d) => (A.esCumpleanos(k, d) ? 2 : 1);
    ok(p.vecindad.personas[k].p === V.AMISTAD.encanta * x2(4) + V.AMISTAD.gusta * x2(5) + V.AMISTAD.noGusta + V.AMISTAD.neutro * x2(7), `${k}: la amistad según el gusto`);
  }
  const p = partida({ dia: 2, cosas: { yerba: 0 } });
  const sin = V.regalar('jefe', 'yerba', p, 2);
  ok(!sin.ok && sin.reaccion === 'no-tenes' && sin.renglones[0] === 'No tenés yerba encima.', 'sin la cosa, no se regala');
  ok(V.regalar('jefe', 'cristal', p, 2).reaccion === 'no-se' && V.regalar('nadie', 'yerba', p, 2).reaccion === 'no-se', 'lo que no es regalable');
  ok(V.regalar('jefe', 'yerba', partida({ dia: 2, cosas: { yerba: 1 } }), 2).ok, 'con la partida, mira lo que tenés');
}

// ============================================================ 4. invitar
{
  const aldea = aldeaCompleta();
  const p = partida({ dia: 3, aldea });   // día 3: miércoles
  const ds = A.diaSemanaDe(3);
  // rechazos con motivo
  const r = (k, que, h, extra = {}) => V.invitar(k, que, p, h, extra);
  ok(r('jefe', 'mate', 22).motivo === 'noche' && r('jefe', 'mate', 6).motivo === 'noche', 'de noche, no');
  const trab = r('jefe', 'mate', 10);
  ok(trab.motivo === 'trabajando' && trab.renglones[0] === VZ.VOCES.jefe.ocupado, 'el jefe, en el andén');
  ok(r('panadera', 'mate', 9.5).motivo === 'trabajando' && r('maestra', 'te', 10).motivo === 'trabajando', 'cada uno en su local');
  ok(r('ramon', 'te', 19).motivo === 'no-le-gusta' && r('ramon', 'te', 19).renglones[0] === VZ.VOCES.ramon.noToma.te, 'a Don Ramón no le gusta el té');
  ok(r('enfermera', 'mate', 19).motivo === 'no-le-gusta' && r('nene', 'mate', 19).motivo === 'no-le-gusta', 'a la enfermera no le va el mate; a los chicos, tampoco');
  ok(r('galesa', 'te', 19).motivo === 'anfitriona', 'la galesa no va a su casa de té de invitada');
  ok(r('ramon', 'mate', 10).motivo === 'trabajando' && r('guarda', 'mate', 12).motivo === 'trabajando', 'los del valle también trabajan');
  ok(r('nene', 'te', 9, { diaSemana: 5 }).motivo === 'cerrado', 'la casa de té a la mañana, cerrada');
  ok(A.rutinaAldea('carpintero', 19, ds, aldea).lugar !== 'local', 'a las 19 el carpintero está libre');
  // acepta: camina con vos, se sienta y charla; suma amistad una sola vez por día
  const si = r('carpintero', 'mate', 19);
  ok(si.ok && si.motivo === null && si.acepta.includes('tu mesa'), 'acepta el mate');
  eq(si.secuencia.map((x) => x.paso), ['ir', 'sentarse', 'charla'], 'ir, sentarse, charlar');
  ok(si.secuencia[0].lugar === 'mesa-refugio' && si.renglones.length >= 2 && si.renglones.length <= 3, 'en tu mesa, con dos o tres renglones');
  const pts = p.vecindad.personas.carpintero.p;
  ok(pts === V.AMISTAD.invitar, 'suma amistad');
  const otra = r('carpintero', 'mate', 19.5);
  ok(!otra.ok && otra.motivo === 'ya-tomo' && p.vecindad.personas.carpintero.p === pts, 'la segunda del día, no (ni suma)');
  const te = V.invitar('carpintero', 'te', p, 19.2, { dia: 8, diaSemana: 0 });
  ok(te.ok && te.secuencia[0].edificio === 'casa-te' && Object.hasOwn(A.puntosDe('casa-te'), te.secuencia[0].punto) && Object.hasOwn(A.puntosDe('casa-te'), te.secuencia[0].tuPunto), 'el té, en la galería de la casa de té');
  ok(p.vecindad.personas.carpintero.p === 2 * V.AMISTAD.invitar, 'otro día, suma otra vez');
  // la sobremesa no se repite hasta agotarse
  const q = partida({ aldea });
  const vistas = [];
  for (let d = 1; d <= 3; d++) vistas.push(...V.invitar('herrero', 'mate', q, 19.5, { dia: d, diaSemana: 2 }).renglones.slice(1));
  eq(new Set(vistas).size, vistas.length, 'la sobremesa no se repite');
  ok(V.invitar('herrero', 'whisky', q, 19).motivo === 'no-se', 'sólo mate o té');
  ok(V.invitar('telegrafista', 'mate', partida(), 19).motivo === 'ausente', 'el que todavía no llegó no viene');
}

// ============================================================ 5. ayudas por oficio
{
  for (const k of PERSONAS) {
    const p = partida({ dia: 2 });
    const lista = V.ayudas(k, p);
    ok(lista.length >= 1 && lista.every((a) => a.titulo && (a.pide || a.hace)), `${k}: ayudas del día`);
    const a = lista[0];
    const sinNada = { materiales: {}, cosas: {}, entradas: {} };
    if (a.pide) ok(V.ayudar(k, a.id, p, sinNada).motivo === 'no-tenes', `${k}: sin lo que pide, no se puede`);
    const r1 = V.ayudar(k, a.id, p, lleno());
    ok(r1.ok && r1.renglones.length >= 2 && r1.renglones.length <= 3 && r1.amistad.cambio === V.AMISTAD.ayudar, `${k}: ayuda hecha, suma amistad`);
    if (a.pide) ok(r1.efectos.some((e) => e.k === a.pide.k && e.n === -a.pide.n), `${k}: se descuenta lo que pide`);
    ok(V.ayudar(k, a.id, p, lleno()).motivo === 'ya-hoy' && V.ayudas(k, p).length === 0, `${k}: una por día`);
    const r2 = V.ayudar(k, a.id, p, lleno(), 3);
    const def = VZ.AYUDAS[k].find((x) => x.id === a.id);
    if (def.devuelve) ok(r1.efectos.some((e) => e.n > 0) !== r2.efectos.some((e) => e.n > 0), `${k}: a veces devuelve algo chico`);
    ok(r1.renglones.includes(def.consejo) || r2.renglones.includes(def.consejo), `${k}: y si no, un consejo`);
  }
  // de su oficio
  const pide = (k, id) => VZ.AYUDAS[k].find((x) => x.id === id)?.pide;
  eq(pide('panadera', 'lena-horno'), { tipo: 'material', k: 'tronco', n: 2 }, 'leña para el horno de la panadera');
  eq(pide('galesa', 'truchas-te'), { tipo: 'entrada', k: 'trucha-fresca', n: 2 }, 'dos truchas para la galesa');
  ok(pide('herrero', 'piedras-fragua')?.k === 'piedra', 'piedras para el herrero');
  ok(VZ.AYUDAS.maestra.some((x) => x.id === 'leer-chicos' && x.hace) && VZ.AYUDAS.nena.some((x) => x.hace), 'leerle a los chicos');
  ok(V.ayudar('herrero', 'nada', partida(), lleno()).motivo === 'no-se' && V.ayudas('nadie', partida()).length === 0, 'una ayuda rara no existe');
}

// ============================================================ 6. la amistad y lo que abre
{
  const p = partida({ dia: 1, aldea: aldeaCompleta() });
  const k = 'abuela';
  eq(V.nivelDe(k, p), 'conocido', 'empieza conocido');
  ok(V.saludoDeAmistad(k, p, {}) === null, 'de conocido, el saludo de siempre');
  const t0 = V.temasDeCharla(k, p, { dia: 1 });
  eq(t0.map((x) => x.id), ['como-andas', 'novedades', 'historia'], 'tres temas');
  ok(t0.every((x) => x.titulo && x.renglones.length >= 1 && x.renglones.length <= 3), 'de 1 a 3 renglones');
  const h1 = V.elegirTema(k, 'historia', p, { dia: 1 });
  eq(h1.renglones, [VZ.VOCES[k].historia.partes[0]], 'la primera parte, de entrada');
  const bloq = V.temasDeCharla(k, p, { dia: 1 }).find((x) => x.id === 'historia');
  ok(bloq.bloqueada && VZ.FRASES.historiaAmigo.includes(bloq.renglones[0]), 'la segunda, con amigo');
  V.elegirTema(k, 'historia', p, { dia: 1 });
  ok(p.vecindad.personas[k].hist === 1, 'bloqueada no avanza');
  // charlar suma poco y una vez por día
  const antes = p.vecindad.personas[k].p;
  V.charlar(k, p, 1); V.charlar(k, p, 1);
  ok(p.vecindad.personas[k].p === antes, 'charlar dos veces el mismo día no suma');
  // subir: regalos, invitaciones y ayudas
  const inv = lleno();
  let dia = 2, subio = null;
  while (V.nivelDe(k, p) === 'conocido' && dia < 60) {
    const r = V.regalar(k, 'calafate', p, dia, inv);
    V.ayudar(k, 'lena-abuela', p, inv, dia);
    if (r.amistad.subio) subio = r.amistad.nivel;
    dia++;
  }
  eq(V.nivelDe(k, p), 'amigo', 'llega a amigo');
  ok(dia > 3 && dia < 10, `sin apuro pero sin eternidad (${dia} días)`);
  ok(V.saludoDeAmistad(k, p, {}).toLowerCase().includes('tesoro') && V.saludoDeAmistad(k, p, { nombre: 'Martina' }).includes('Martina'), 'con amigo, te saluda por tu nombre (o con cariño)');
  eq(V.elegirTema(k, 'historia', p, { dia }).renglones, [VZ.VOCES[k].historia.partes[1]], 'con amigo, la segunda parte');
  ok(V.temasDeCharla(k, p, { dia }).find((x) => x.id === 'historia').bloqueada, 'la tercera, con compadre');
  ok(V.visitaDeAmistad(p, dia) === null && V.regaloDeAmistad(p, dia) === null, 'de amigo, todavía no te visita ni te deja regalos');
  while (V.nivelDe(k, p) !== 'compadre' && dia < 200) {
    V.regalar(k, 'calafate-seco', p, dia, inv);
    V.invitar(k, 'mate', p, 19.5, { dia, diaSemana: A.diaSemanaDe(dia) });
    V.ayudar(k, 'aguja', p, inv, dia);
    dia++;
  }
  eq(V.nivelDe(k, p), 'compadre', 'llega a compadre');
  ok(dia < 25, `compadre en un tiempo razonable (${dia})`);
  eq(V.elegirTema(k, 'historia', p, { dia }).renglones, [VZ.VOCES[k].historia.partes[2]], 'con compadre, la historia completa');
  ok(VZ.FRASES.historiaFin.includes(V.elegirTema(k, 'historia', p, { dia }).renglones[0]), 'y después, que ya te contó todo');
  ok(V.saludoDeAmistad(k, p, { nombre: 'Martina' }) === '¡Ay, Martina! Vos sos como de la familia ya. Dame un abrazo.', 'el saludo de compadre');
  const vis = V.visitaDeAmistad(p, dia);
  ok(vis && vis.clave === k && vis.partes.length === 2 && vis.regalo.k === 'calafate-seco', 'el compadre te visita en el refugio (con regalo)');
  ok(V.visitaDeAmistad(p, dia + 1) === null && V.visitaDeAmistad(p, dia + V.VISITA_AMISTAD.cada) !== null, 'no todos los días');
  // el regalo de amistad: cada 5 a 8 días
  const desde = p.vecindad.personas[k].desde;
  const dias = [];
  for (let d = desde; d < desde + 40; d++) { const g = V.regaloDeAmistad(p, d); if (g) { dias.push(d); ok(g.clave === k && g.efectos[0].k === 'calafate-seco' && g.texto, 'de sus gustos u oficio'); } }
  ok(dias.length >= 4, 'te deja regalos de vez en cuando');
  for (let i = 1; i < dias.length; i++) ok(dias[i] - dias[i - 1] >= 5 && dias[i] - dias[i - 1] <= 8, `cada 5 a 8 días (${dias[i] - dias[i - 1]})`);
  ok(dias[0] - desde >= 5, 'el primero, unos días después de hacerse compadres');
  // con el tiempo baja apenas, pero de amigo no vuelve a conocido
  const q = partida({ dia: 1 });
  for (let d = 1; d < 9; d++) { V.regalar('jefe', 'yerba', q, d, inv); V.ayudar('jefe', 'faroles', q, inv, d); }
  eq(V.nivelDe('jefe', q), 'amigo');
  V.pasarDiaVecindad(q, 10);
  const p10 = q.vecindad.personas.jefe.p;
  V.pasarDiaVecindad(q, 15);
  ok(q.vecindad.personas.jefe.p < p10 && q.vecindad.personas.jefe.p >= p10 - 5, 'baja de a poco sin contacto');
  V.pasarDiaVecindad(q, 400);
  eq(V.nivelDe('jefe', q), 'amigo', 'nunca de amigo a conocido');
  for (let x = dia; x <= dia + 300; x += 10) V.pasarDiaVecindad(p, x);
  eq(V.nivelDe(k, p), 'amigo', 'el compadre olvidado vuelve a amigo, no a conocido');
  // aportar a la obra suma con el dueño y los que trabajan (una vez por día y por obra)
  const o = partida({ dia: 5, aldea: aldeaConObra() });
  V.anotarHecho(o, 'aporte-obra', 5, { lote: 'herreria' });
  V.anotarHecho(o, 'aporte-obra', 5, { lote: 'herreria' });
  ok(o.vecindad.personas.herrero.p === V.AMISTAD.obraDueno && o.vecindad.personas.padre.p === V.AMISTAD.obraObrero && o.vecindad.personas.carpintero.p === V.AMISTAD.obraObrero, 'la obra: el dueño y los obreros');
  ok(!o.vecindad.personas.abuela, 'los demás, nada');
  eq(Object.keys(V.amistades(o)).sort(), ['carpintero', 'herrero', 'padre'], 'el cuaderno: a quiénes conocés');
}

// ============================================================ 7. la memoria
{
  const p = partida({ dia: 10 });
  ok(!V.anotarHecho(p, 'trucha-grande', 10, { cm: 30 }), 'una trucha chica no es noticia');
  ok(!V.anotarHecho(p, 'volar', 10) && !V.anotarHecho(p, 'regalo', 10, {}), 'un hecho raro o sin persona no se anota');
  ok(V.anotarHecho(p, 'trucha-grande', 10, { cm: 62, especie: 'Trucha marrón' }), 'una trucha grande');
  const c1 = V.comentarioSobreVos('pescador', p, 10);
  ok(c1 && c1.texto.includes('62') && c1.texto.includes('trucha marrón') && c1.hecho === 'trucha-grande', 'el pescador la comenta');
  ok(V.comentarioSobreVos('pescador', p, 11) === null, 'y no la comenta dos veces');
  ok(V.comentarioSobreVos('abuela', p, 10) === null, 'a la abuela no le interesa la pesca');
  ok(V.comentarioSobreVos('nicanor', p, 13) === null && V.comentarioSobreVos('nicanor', p, 12) !== null, 'sólo lo reciente (2 o 3 días)');
  // la tala: sólo si fue mucha
  for (let i = 0; i < 5; i++) V.anotarHecho(p, 'talar', 10);
  ok(V.comentarioSobreVos('ema', p, 10) === null, 'unos pocos árboles no son noticia');
  for (let i = 0; i < 5; i++) V.anotarHecho(p, 'talar', 10);
  ok(p.vecindad.hechos.filter((h) => h.id === 'talar').length === 1 && p.vecindad.hechos.find((h) => h.id === 'talar').dato.n === 10, 'los árboles del día se suman');
  ok(V.comentarioSobreVos('ema', p, 10).texto === VZ.COMENTARIOS.talar.ema[0], 'Ema te lo dice');
  // el regalo: el que lo recibió lo comenta al otro día, y los chismosos se enteran
  const inv = lleno();
  V.regalar('madre', 'miel', p, 10, inv);
  ok(V.comentarioSobreVos('madre', p, 10) === null, 'el mismo día no vuelve sobre el regalo');
  const rec = V.comentarioSobreVos('madre', p, 11);
  ok(rec && rec.texto.includes('la miel') && rec.hecho === 'regalo', 'al otro día, se acuerda de la miel');
  const ch = V.comentarioSobreVos('nelida', p, 11);
  ok(ch && ch.texto.includes('Gladys') && ch.texto.includes('un frasco de miel'), 'Nélida ya se enteró');
  ok(V.comentarioSobreVos('padre', p, 11)?.hecho !== 'regalo', 'el que no es chismoso no lo cuenta');
  V.anotarHecho(p, 'capitulo', 11, { capitulo: 'Manos a la obra' });
  ok(V.comentarioSobreVos('maestra', p, 11).texto.includes('«Manos a la obra»'), 'el capítulo');
  V.anotarHecho(p, 'aporte-obra', 11, { lote: 'panaderia' });
  ok(V.comentarioSobreVos('panadera', p, 11).texto.includes('la panadería'), 'la dueña agradece las tablas de su obra');
  for (const h of ['poncho', 'durmio-afuera', 'cosecha', 'horneada', 'miel', 'esquila', 'tren', 'renoval', 'pez-nativo', 'foto-fauna', 'obra-propia']) ok(V.anotarHecho(p, h, 11, { especie: 'perca criolla', obra: 'el galpón' }), `se anota: ${h}`);
  const vistos = new Set();
  for (let i = 0; i < 30; i++) for (const k of PERSONAS) { const c = V.comentarioSobreVos(k, p, 11); if (c) { ok(!/\{|\}/.test(c.texto), 'sin marcas sueltas'); vistos.add(`${k}:${c.texto}`); } }
  ok(vistos.size > 20, `muchos comentarios distintos (${vistos.size})`);
  for (const k of PERSONAS) ok(V.comentarioSobreVos(k, p, 11) === null, `${k}: se acabaron (no repite)`);
  // las novedades no se repiten y dan pistas concretas del cuaderno
  const q = partida({ dia: 4, entradas: { huemul: { dia: 1 } }, aldea: aldeaConObra() });
  q.aldea.llegando = { clave: 'pescador', dia: 4 };
  const ctx = { dia: 4, pronostico: 'que mañana llueve', tren: 15.5 };
  const charlas = Array.from({ length: 6 }, () => V.elegirTema('jefe', 'novedades', q, ctx).renglones);
  ok(charlas.every((c) => c.length >= 1 && c.length <= 3), 'de 1 a 3 renglones');
  const dichas = charlas.flat();
  eq(new Set(dichas).size, dichas.length, 'las novedades no se repiten');
  ok(VZ.FRASES.llego.some((f) => charlas[0].join(' ').includes('Aurelio Nahuel')) && charlas[0].join(' ').includes('que mañana llueve'), 'primero, el que llegó y el tiempo de mañana');
  const todas = dichas.join(' ');
  ok(todas.includes('Para tu cuaderno:'), 'una pista concreta del cuaderno');
  ok(todas.includes('Aurelio Nahuel') && todas.includes('la herrería') && todas.includes('que mañana llueve') && todas.includes('15:30'), 'el que llegó, la obra, el tiempo de mañana y el tren');
  ok(!/huemul\b/i.test(todas.replace(/huellas de huemul/gi, '')), 'no te cuenta lo que ya anotaste');
  const ultima = V.elegirTema('pescador', 'novedades', q, { dia: 4 }).renglones.join(' ');
  ok(/trucha|perca|pejerrey|cisne|coipo|martín|pato/.test(ultima), 'el pescador ve lo del agua');
  // ¿cómo andás?, según el ánimo, el clima y lo que viene haciendo
  const r = partida({ dia: 2, aldea: aldeaCompleta() });
  const c0 = V.temasDeCharla('padre', r, { dia: 2, clima: 'nieve', hora: 10 })[0].renglones;
  ok(c0.length === 2 && VZ.FRASES.clima.nieve.includes(c0[1]), 'el clima');
  V.cumplirActividad(r, 'padre', { actividad: 'visitar', duracion: 1, con: 'carpintero' });
  const c1b = V.temasDeCharla('padre', r, { dia: 2, hora: 10 })[0].renglones;
  ok(c1b[1].includes('Tito'), 'lo que viene haciendo');
  ok(V.temasDeCharla('padre', r, { dia: 2, hora: 22 })[0].renglones[0] === VZ.VOCES.padre.animo.cansado, 'de noche, cansado');
  // abrir la charla junta todo
  const ab = V.abrirCharla('pescador', partida({ dia: 3, aldea: aldeaCompleta() }), { dia: 3, hora: 15 });
  ok(ab && ab.temas.length === 3 && ab.nivel === 'conocido' && ab.puede.regalar && ab.puede.ayudar && ab.amistad.cambio === V.AMISTAD.charla, 'abrir la charla');
}

// ============================================================ 8. el saneador con basura
{
  const nueva = V.vecindadNueva();
  for (const [i, basura] of [null, undefined, 3, 'x', [], [1, 2], true, { personas: 'x' }, { hechos: {} }, Object.create(null)].entries()) eq(V.sanearVecindad(basura), nueva, `basura ${i}`);
  const rota = V.sanearVecindad({
    personas: {
      jefe: { p: 1e9, max: 7, charla: -3, hist: 99, ganas: { social: 9, descanso: 'x', aire: -2 }, dichos: ['ok', 7, '<script>', 'fauna:huemul', 'fauna:huemul'], coment: 'x', hizo: 'volar', con: 'nadie', ultimoRegalo: 'cristal' },
      __proto__: { p: 3 }, toString: { p: 4 }, nadie: { p: 9 },
      abuela: { p: 10, max: 2 },
    },
    hechos: [{ id: 'trucha-grande', dia: 3, dato: { cm: 1e9, especie: 'x'.repeat(300) } }, { id: 'regalo', dia: 3, dato: {} }, { id: 'volar', dia: 1 }, null, { id: 'aporte-obra', dia: 2, dato: { lote: 'casa-te-falsa' } }],
    visita: { ultima: -1, cuenta: 'x' }, dia: 'x',
  });
  eq(Object.keys(rota.personas).sort(), ['abuela', 'jefe'], 'sólo personas conocidas');
  const j = rota.personas.jefe;
  ok(j.p === V.AMISTAD.tope && j.max === 2 && j.charla === 0 && j.hist === 3, 'números acotados');
  eq(j.ganas, { social: 1, descanso: 0.4, aire: 0, hacer: 0.7 }, 'ganas entre 0 y 1');
  eq(j.dichos, ['ok', 'fauna:huemul'], 'la memoria, sólo claves sanas y sin repetir');
  ok(j.coment.length === 0 && j.hizo === null && j.con === null && j.ultimoRegalo === null, 'lo demás saneado');
  ok(rota.personas.abuela.p >= V.AMISTAD.umbral.amigo, 'el que llegó a compadre no queda debajo de amigo');
  ok(rota.hechos.length === 1 && rota.hechos[0].dato.cm === 200 && rota.hechos[0].dato.especie.length <= 40, 'los hechos, saneados');
  eq(rota.visita, { ultima: 0, cuenta: 0 });
  // fuzz: cualquier cosa sale saneada, estable e idéntica tras ir y volver de JSON
  let semilla = 11;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  const claves = [...PERSONAS, ...Object.keys(V.HECHOS), ...Object.keys(V.REGALABLES), 'p', 'max', 'ganas', 'dichos', 'coment', 'hist', 'dato', 'id', 'dia', 'persona', 'cosa', 'lote', 'herreria', '__proto__', 'constructor', 'toString', ''];
  const valor = (prof = 0) => {
    const t = r();
    if (prof > 3 || t < 0.3) return [0, -1, 1.5, 1e308, -Infinity, NaN, 'texto', null, true, 3, 'fauna:x', 'regalo'][Math.floor(r() * 12)];
    if (t < 0.5) return Array.from({ length: Math.floor(r() * 5) }, () => valor(prof + 1));
    const o = {};
    for (let i = 0; i < 1 + r() * 6; i++) o[claves[Math.floor(r() * claves.length)]] = valor(prof + 1);
    return o;
  };
  for (let i = 0; i < 800; i++) {
    const v = { personas: valor(), hechos: valor(), visita: valor(), dia: valor() };
    if (i % 2) v.personas = Object.fromEntries(PERSONAS.filter(() => r() < 0.3).map((k) => [k, valor(1)]));
    if (i % 3) v.hechos = Array.from({ length: 1 + Math.floor(r() * 60) }, () => ({ id: claves[Math.floor(r() * claves.length)], dia: valor(3), dato: valor(1) }));
    const s = V.sanearVecindad(v);
    assert.equal(Object.getPrototypeOf(s), Object.prototype);
    assert.deepEqual(Object.keys(s).sort(), Object.keys(nueva).sort());
    assert.ok(Object.keys(s.personas).every(V.esPersonaVecindad));
    for (const f of Object.values(s.personas)) {
      assert.ok(f.p >= 0 && f.p <= V.AMISTAD.tope && [0, 1, 2].includes(f.max) && f.dichos.length <= 24 && f.coment.length <= 16);
      assert.ok(Object.values(f.ganas).every((g) => g >= 0 && g <= 1));
    }
    assert.ok(s.hechos.length <= 40 && s.hechos.every((h) => Object.hasOwn(V.HECHOS, h.id) && Number.isInteger(h.dia)));
    assert.deepEqual(V.sanearVecindad(s), s, 'estable');
    assert.deepEqual(V.sanearVecindad(copia(s)), s, 'igual tras JSON');
    // y con basura, las funciones no tiran
    const est = { vecindad: s, aldea: A.sanearAldea(valor()), dia: valor() };
    const k = PERSONAS[i % PERSONAS.length];
    V.abrirCharla(k, est, { dia: valor(), hora: valor(), clima: valor() });
    V.elegirActividad(k, valor(), valor(), valor(), est, valor());
    V.regalar(k, claves[i % claves.length], est, valor(), valor());
    V.invitar(k, i % 2 ? 'mate' : 'te', est, valor());
    V.comentarioSobreVos(k, est, valor());
    V.pasarDiaVecindad(est, valor());
  }
  n += 800;
  // por guardado.js
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?vecindad36=' + Date.now());
  const nuevo = G.progresoNuevo();
  eq(nuevo.vecindad, V.vecindadNueva(), 'el progreso nuevo trae la vecindad vacía');
  V.regalar('abuela', 'calafate', nuevo, 1, lleno());
  V.anotarHecho(nuevo, 'trucha-grande', 1, { cm: 55 });
  ok(G.guardarProgreso(nuevo), 'se guarda');
  eq(G.cargarProgreso().vecindad, V.sanearVecindad(nuevo.vecindad), 'y vuelve igual');
  const vieja = G.progresoNuevo(); delete vieja.vecindad;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  eq(G.cargarProgreso().vecindad, V.vecindadNueva(), 'una partida vieja arranca sin vecindad');
  const rotaG = G.progresoNuevo(); rotaG.vecindad = 'x';
  datos.set('hojarasca-v1', JSON.stringify(rotaG));
  eq(G.cargarProgreso().vecindad, V.vecindadNueva(), 'una vecindad rota no rompe la partida');
}

// ============================================================ 9. mil días: el guardado no crece sin límite
{
  const p = partida({ aldea: aldeaCompleta(), entradas: {} });
  const inv = lleno();
  let semilla = 5;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  const cosas = Object.keys(V.REGALABLES);
  let mayor = 0, mitad = 0, comentarios = 0, visitas = 0, regalos = 0;
  for (let dia = 1; dia <= 1000; dia++) {
    p.dia = dia;
    V.pasarDiaVecindad(p, dia);
    const ds = A.diaSemanaDe(dia);
    for (const k of PERSONAS) {
      if (r() < 0.5) { const a = V.abrirCharla(k, p, { dia, hora: 17, clima: 'sol', pronostico: 'que mañana sigue lindo' }); if (a.comentario) comentarios++; V.elegirTema(k, ['como-andas', 'novedades', 'historia'][dia % 3], p, { dia }); }
      if (r() < 0.3) V.regalar(k, cosas[Math.floor(r() * cosas.length)], p, dia, inv);
      if (r() < 0.2) V.invitar(k, r() < 0.5 ? 'mate' : 'te', p, 16 + r() * 4, { dia, diaSemana: ds });
      if (r() < 0.2) { const a = V.ayudas(k, p)[0]; if (a) V.ayudar(k, a.id, p, inv); }
      if (A.esPersonaAldea(k)) for (const h of [8, 13.7, 18.5, 20.8]) V.cumplirActividad(p, k, V.elegirActividad(k, h, ds, ['sol', 'lluvia', 'nieve', 'nublado'][dia % 4], p, dia));
    }
    for (let i = 0; i < 12; i++) V.anotarHecho(p, 'talar', dia);
    V.anotarHecho(p, 'trucha-grande', dia, { cm: 50 + (dia % 20), especie: 'trucha arcoíris' });
    V.anotarHecho(p, 'aporte-obra', dia, { lote: 'herreria' });
    V.anotarHecho(p, ['poncho', 'tren', 'cosecha', 'miel', 'esquila', 'renoval'][dia % 6], dia);
    if (V.visitaDeAmistad(p, dia)) visitas++;
    if (V.regaloDeAmistad(p, dia)) regalos++;
    mayor = Math.max(mayor, JSON.stringify(p.vecindad).length);
    if (dia === 500) mitad = mayor;
    if (dia % 100 === 0) assert.deepEqual(V.sanearVecindad(copia(p.vecindad)), p.vecindad, `día ${dia}: lo guardado vuelve igual`);
  }
  ok(p.vecindad.hechos.length <= 40, 'los hechos, acotados');
  ok(Object.values(p.vecindad.personas).every((f) => f.dichos.length <= 24 && f.coment.length <= 16), 'la memoria de cada uno, acotada');
  // (3.7.0: con las nueve de la calle de la Loma hay 33 personas en vez de 24: el tope crece igual)
  ok(mayor < 36000 * PERSONAS.length / 24 && mayor <= mitad * 1.1, `el guardado no crece sin límite (${mitad} a los 500 días, ${mayor} a los 1000)`);
  ok(comentarios > 100 && visitas > 50 && regalos > 50, `en mil días pasan cosas (${comentarios} comentarios, ${visitas} visitas, ${regalos} regalos)`);
  ok(Object.values(V.amistades(p)).includes('compadre'), 'hay compadres');
}

console.log(`OK 3.6.0 vecindad · ${n} verificaciones`);
