// 4.24.0 (A): «No te pierdas». Lo que se hizo, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de src/ con el
// arreglo deshecho tiene que fallar):
//   1. la marca del objetivo en el mapa: el objetivo ya nombra el lugar → banderita en el papel; la brújula la sigue con un clic en la marca; sin spoilers
//   2. los lugares que el mapa no nombraba (molino viejo, coihue grande, panadería, carpintería, estudio de fotos, raíz de Ramón), sólo cuando el jugador ya los conoce
//   3. las cadenas del capítulo 11 (el arco y la honda) bajo un título con contador, y el panel que se achica solo si no entra en la ventana
//   4. la línea de teclas de la Historia en la guía
//   5. el tono de todo lo nuevo (castellano, sin números de lazo, sin inglés)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, imp, nuevaPartida, crearJuego, documentoFalso, UI } from './ayuda-4-18-4-historia.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

const MK = await imp('historia-marca.js'), CH = await imp('chinches.js'), MAPA = await imp('mapa.js'), CFG = await imp('config.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4240_SECCIONES ? new Set(process.env.A4240_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4240_CALLADO) console.log('FALLA ' + t); } };

const main = leer('main.js'), historiaUi = leer('historia-ui.js'), mapaJs = leer('mapa.js');
const IDS = H.CAPITULOS.map((c) => c.id);
// una partida de mentira en el capítulo `cap` (id), con lo anterior cerrado
function armar(cap, o = {}) {
  const { P, X } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(cap);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: o.fase || 'jugando', empezada: 1 });
  for (const e of o.vistas || []) h.escenas.vistas[e] = 1;
  for (const q of o.hablados || []) h.hablados[q] = true;
  for (const [q, v] of Object.entries(o.lazos || {})) h.lazos[q] = v;
  for (const k of o.hechos || []) h.hechos[`${cap}:${k}`] = 1;
  for (const k of o.pobladores || []) P.aldea.pobladores.push({ clave: k });
  P.horas = o.horas ?? 12; P.dia = o.dia ?? 5;
  h.base = { dia: o.baseDia ?? 5, talados: 0, cocinadas: 0, cantos: 0 };
  Object.assign(X, o.extra || {});
  Object.assign(h.decisiones, o.decisiones || {});
  return { P, X, h, s: () => H.estadoHistoria(P, X) };
}
// los puntos del mundo, cada uno en un lugar distinto (los arma el juego: puntosDeHistoria de main.js)
const PUNTOS = Object.fromEntries(Object.keys(MK.PUNTOS_MARCA).map((k, i) => [k, { x: 10 + i * 7, z: -40 + i * 5 }]));
PUNTOS['galpon-noche'] = { ...PUNTOS['galpon-propio'] };
const estado0 = armar('llave').s();

// ---------------------------------------------------------------- 1. la tabla de lugares
if (va('tabla')) {
  const claves = Object.keys(MK.PUNTOS_MARCA);
  ok(claves.length >= 20 && claves.every((k) => /^[a-z]+(-[a-z]+)*$/.test(k)), `los lugares de la tabla tienen ids sin ñ ni tildes (${claves.length})`);
  ok(claves.every((k) => { const p = MK.PUNTOS_MARCA[k]; return typeof p.nombre === 'string' && p.nombre.length >= 4 && p.nombre.length <= 30 && Array.isArray(p.palabras) && p.palabras.length > 0 && p.palabras.every((w) => w === w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()); }), 'cada lugar trae nombre corto y palabras en minúscula y sin tildes');
  // los puntos son los que arma el juego
  const i0 = main.indexOf('function puntosDeHistoria() {'), i1 = main.indexOf('\n}\n', i0);
  const cuerpo = main.slice(i0, i1);
  ok(i0 > 0 && claves.every((k) => cuerpo.includes(`'${k}'`)), `todos los lugares de la tabla los arma puntosDeHistoria de main.js${claves.filter((k) => !cuerpo.includes(`'${k}'`)).length ? ' (faltan: ' + claves.filter((k) => !cuerpo.includes(`'${k}'`)).join() + ')' : ''}`);
  ok(Object.entries(MK.HOGARES).every(([q, v]) => Object.hasOwn(MK.PUNTOS_MARCA, v.punto) && H.LAZOS_TODOS.includes(v.lazo)), 'cada casa conocida apunta a un lugar de la tabla y a un lazo que existe');
  const objetivos = new Set(H.CAPITULOS.flatMap((c) => c.objetivos.map((o) => `${c.id}:${o.id}`)));
  ok(Object.entries(MK.EXTRAS).every(([k, ps]) => objetivos.has(k) && ps.every((p) => Object.hasOwn(MK.PUNTOS_MARCA, p))), 'cada objetivo de la tabla extra existe y apunta a lugares de la tabla');
  // el nombre en el papel es el que ya usa el mapa para ese lugar
  ok(MK.PUNTOS_MARCA.refugio.nombre === CFG.LUGARES.refugio.nombre && MK.PUNTOS_MARCA.mirador.nombre === CFG.LUGARES.mirador.nombre, 'refugio y mirador se llaman como en el mapa (el rótulo no se repite)');
  ok(MK.MAX_MARCAS === 4, 'a lo sumo cuatro marcas a la vez');
}

// ---------------------------------------------------------------- 2. la marca y los spoilers
if (va('marcas')) {
  // cobertura: de los 85 objetivos, cuántos tienen lugar y cuántos se marcan sin conocer a nadie
  let conPunto = 0, marcables = 0, conCasa = 0, total = 0;
  const raros = [];
  for (const c of H.CAPITULOS) for (const o of c.objetivos) {
    total++;
    const ps = MK.puntosDeObjetivo(c.id, o);
    let t = ''; try { t = H.textoObjetivo(o, estado0); } catch { t = ''; }
    if (ps.length) conPunto++;
    const solo = ps.filter((p) => MK.sePuedeMarcar({ hablados: {} }, estado0, p, t));
    const conoce = ps.filter((p) => MK.sePuedeMarcar({ hablados: { ramon: true, ema: true, ercilia: true, fermin: true } }, { ...estado0, hablados: ['ramon', 'ema', 'ercilia', 'fermin'], lazos: { ...estado0.lazos, tobias: 2, belisario: 1, tito: 1, rosa: 1, sofia: 1, herminia: 1, nicanor: 1 } }, p, t));
    if (solo.length) marcables++;
    if (conoce.length) conCasa++;
    // sin spoilers: lo que se marca sin conocer a nadie lo nombra el texto
    for (const p of solo) if (!MK.nombraElLugar(t, p.punto)) raros.push(`${c.id}:${o.id}`);
  }
  ok(total === 85, `son 85 objetivos (${total})`);
  ok(conPunto >= 33, `al menos 33 objetivos tienen un lugar resuelto con datos que ya existen (${conPunto})`);
  ok(marcables >= 28, `al menos 28 se marcan sólo con lo que dice el texto (${marcables})`);
  ok(conCasa >= marcables + 2 && conCasa <= 40, `y conociendo a los vecinos se suman los de casa conocida (${conCasa})`);
  ok(raros.length === 0, `sin conocer a nadie, sólo se marca lo que el texto nombra (${raros.join() || 'ninguno'})`);

  // lo que el texto NO dice no se marca
  const marca = (cap, obj, op = {}) => {
    const a = armar(cap, op);
    return MK.marcasDeObjetivos(a.h, a.s(), PUNTOS).filter((m) => m.objetivo === obj);
  };
  ok(marca('perdido', 'huellas', { vistas: ['guardia-molino'], horas: 7 }).length === 0, '«seguí las huellas»: el objetivo no nombra la raíz, no se marca');
  ok(marca('golpea', 'mesa').length === 0, '«Juntá a los vecinos en tu mesa»: no nombra el refugio, no se marca');
  ok(marca('cuaderno', 'josefina').length === 0, '«Mostrale el cuaderno a Josefina» sin conocerla: no se dice dónde vive');
  ok(marca('cuaderno', 'josefina', { hablados: ['ema'] }).map((m) => m.punto).join() === 'seccional', 'si ya hablaste con Josefina, sí');
  ok(marca('cuaderno', 'josefina', { lazos: { ema: 1 } }).length === 1, 'o si el lazo ya se movió');
  ok(marca('perdido', 'devolver').length === 0 && marca('perdido', 'devolver', { hablados: ['ercilia'] }).map((m) => m.punto).join() === 'ramos', 'lo mismo con Ercilia: el almacén se marca cuando la conocés');
  ok(marca('bolsa', 'ramon').length === 0 && marca('mesa', 'hablar').length === 0, 'los objetivos de hablar con alguien sin lugar nombrado no se marcan');
  // lo que sí dice
  ok(marca('rueda', 'piedras').map((m) => m.punto).join() === 'molino-viejo', '«las piedras del molino viejo»: se marca');
  ok(marca('rueda', 'zaino').map((m) => m.punto).join() === 'puesto' && marca('rueda', 'zaino')[0].nombre === 'Puesto Alto', '«en el Puesto Alto»: se marca con su nombre');
  ok(marca('cuaderno', 'belisario').map((m) => m.punto).join() === 'puesto-paso', '«Andá al Puesto del Paso»: se marca');
  ok(marca('deshielo', 'majada').map((m) => m.punto).join() === 'puesto,galpon', '«el Puesto Alto o el galpón de esquila»: las dos');
  ok(marca('golpea', 'cerro').map((m) => m.punto).join() === 'mirador', '«el mirador del pehuén»: se marca');
  ok(marca('arco', 'blancos-paso').map((m) => m.punto).join() === 'puesto-paso' && marca('arco', 'blancos-esquila', { hechos: ['fermin'] }).map((m) => m.punto).join() === 'galpon', 'los blancos del arco y de la honda, en su lugar');

  // lo que todavía no se ve no se marca (la estación de la noche de la nevada sólo vale si no diste el cuaderno)
  ok(marca('nevada', 'estacion').length === 1 && marca('nevada', 'estacion', { decisiones: { cuaderno: 'a' } }).length === 0, 'un objetivo que todavía no se ve en el panel no se marca');
  // dos objetivos del mismo lugar, una sola banderita
  { const a = armar('arco'); const g = MK.marcasDeObjetivos(a.h, a.s(), PUNTOS).filter((m) => m.punto === 'galpon'); ok(g.length === 1 && g[0].objetivo === 'fermin', 'Fermín y los blancos de la honda son el mismo galpón: una sola banderita'); }
  ok(marca('deshielo', 'umbral', { hechos: ['carpeta', 'majada', 'fiesta'] }).map((m) => m.punto).join() === 'refugio', '«en tu refugio» (la puerta del refugio es el refugio): se marca el refugio');
  ok(marca('frios', 'sanitario').map((m) => m.punto).join() === 'plaza', '«a la aldea, al puesto sanitario»: la plaza de la aldea');
  // la primera hora: el primer objetivo del primer capítulo ya se marca
  const prim = armar('llave', { horas: 18.3, dia: 1, baseDia: 1 });
  const m0 = MK.marcasDeObjetivos(prim.h, prim.s(), PUNTOS);
  ok(m0.length === 1 && m0[0].punto === 'refugio' && m0[0].objetivo === 'refugio' && m0[0].x === PUNTOS.refugio.x && m0[0].z === PUNTOS.refugio.z, 'el minuto uno: «Llegá al Refugio del Arroyo» ya está marcado en el mapa');
  prim.h.hechos['llave:refugio'] = 1;
  ok(MK.marcasDeObjetivos(prim.h, prim.s(), PUNTOS).length === 0, 'cumplido el objetivo, la marca se va');
  // sin Historia en curso, nada
  const pausa = armar('rueda'); pausa.h.activa = false;
  ok(MK.marcasDeObjetivos(pausa.h, pausa.s(), PUNTOS).length === 0, 'con la Historia en pausa no hay marcas');
  for (const fase of ['intro', 'outro', 'fin']) { const b = armar('rueda', { fase }); ok(MK.marcasDeObjetivos(b.h, b.s(), PUNTOS).length === 0, `en la fase «${fase}» no hay marcas`); }
  const sinH = armar('rueda');
  ok(MK.marcasDeObjetivos(null, sinH.s(), PUNTOS).length === 0 && MK.marcasDeObjetivos(sinH.h, null, PUNTOS).length === 0 && MK.marcasDeObjetivos(sinH.h, sinH.s(), null).length === 0 && MK.marcasDeObjetivos(sinH.h, sinH.s(), {}).length === 0, 'sin historia, sin estado o sin puntos: nada (y no se rompe)');
  ok(MK.marcasDeObjetivos(sinH.h, sinH.s(), { 'molino-viejo': { x: NaN, z: 3 } }).length === 0, 'un punto sin coordenadas se ignora');
  // un capítulo con muchos: cuatro como mucho, en el orden del panel, sin repetir lugar
  const des = armar('deshielo', { horas: 12 });
  const md = MK.marcasDeObjetivos(des.h, des.s(), PUNTOS);
  ok(md.length === MK.MAX_MARCAS && new Set(md.map((m) => m.punto)).size === md.length, `el capítulo 13 tiene más de cuatro candidatos y se dibujan ${md.length}, sin repetir`);
  ok(md[0].objetivo === 'carpeta', 'en el orden del panel (el primero, primero)');
  // cada marca de cada capítulo es de un objetivo sin cumplir y a la vista, y cae en un punto del mundo
  let marcasTotal = 0;
  for (const c of H.CAPITULOS) {
    const a = armar(c.id, { horas: 12 });
    for (const m of MK.marcasDeObjetivos(a.h, a.s(), PUNTOS)) {
      marcasTotal++;
      const o = c.objetivos.find((x) => x.id === m.objetivo);
      if (!(o && (!o.visible || o.visible(a.s())) && a.h.hechos[`${c.id}:${o.id}`] === undefined && PUNTOS[m.punto] && m.x === PUNTOS[m.punto].x && typeof m.nombre === 'string' && m.nombre.length > 3)) ok(false, `marca rara en ${c.id}: ${JSON.stringify(m)}`);
    }
  }
  ok(marcasTotal >= 20, `entre los trece capítulos hay marcas para ${marcasTotal} objetivos`);
  // el galpón de la noche
  ok(MK.nombreDeMarca('galpon-noche', PUNTOS) === 'Tu galpón', 'si armaste tu galponcito, la noche es ahí');
  ok(MK.nombreDeMarca('galpon-noche', { ...PUNTOS, 'galpon-noche': { x: 1, z: 1 } }) === 'Refugio del Arroyo', 'si no, en la puerta del refugio: se llama como es');
  ok(MK.nombreDeMarca('nada', PUNTOS) === '', 'un lugar que no está en la tabla no tiene nombre');
  ok(MK.lineaDeMarcas([]) === '' && MK.lineaDeMarcas(md).startsWith('En el mapa: ') && !/undefined/.test(MK.lineaDeMarcas(md)), 'la línea del panel: «En el mapa: …»');
  ok(!/\d/.test(MK.lineaDeMarcas([{ nombre: 'Puesto Alto' }])), 'sin números en la línea');
}

// ---------------------------------------------------------------- 3. los lugares que el mapa nombra al conocerlos
if (va('conocidos')) {
  const sabe = (cap, op) => { const a = armar(cap, op); return MK.lugaresConocidos(a.h, a.s(), PUNTOS).map((l) => l.punto); };
  const SEIS = ['molino-viejo', 'coihue', 'panaderia', 'carpinteria', 'estudio-fotos', 'raiz-ramon'];
  ok(Object.keys(MK.CONOCIDOS).sort().join() === SEIS.slice().sort().join(), 'son los seis que el mapa no traía');
  ok(sabe('llave', { dia: 1, baseDia: 1, pobladores: ['panadera', 'carpintero', 'fotografa'] }).length === 0, 'el primer día no se nombra ninguno, aunque la aldea ya tenga a la panadera, al carpintero y a la fotógrafa');
  ok(sabe('bolsa').length === 0 && sabe('mesa').length === 0 && sabe('ramal').length === 0, 'hasta el capítulo 4 tampoco');
  ok(sabe('rueda').join() === 'molino-viejo,coihue', 'desde el capítulo 5 el objetivo manda al molino viejo y al coihue grande: se nombran');
  ok(sabe('llave', { vistas: ['bolsa-coihue'], dia: 1 }).join() === 'molino-viejo,coihue', 'o antes, si la escena de la bolsa te llevó al coihue');
  ok(!sabe('rueda').includes('raiz-ramon') && sabe('perdido', { vistas: ['ramon-raiz'] }).includes('raiz-ramon'), 'la raíz de Ramón se escribe cuando la viste (la escena del amanecer), no antes');
  ok(!sabe('perdido', { vistas: ['guardia-molino'] }).includes('raiz-ramon'), 'ni siquiera con la guardia hecha: sería el spoiler de las huellas');
  ok(!sabe('mesa', { pobladores: ['panadera'] }).includes('panaderia') && sabe('mesa', { pobladores: ['panadera'], vistas: ['bolsa-rosa'] }).includes('panaderia') && sabe('mesa', { pobladores: ['panadera'], lazos: { rosa: 1 } }).includes('panaderia'), 'la panadería, cuando conocés a Rosa');
  ok(!sabe('mesa', { vistas: ['bolsa-rosa'] }).includes('panaderia'), 'y sólo si Rosa vive en la aldea');
  ok(!sabe('rueda', { pobladores: ['carpintero'] }).includes('carpinteria') && sabe('arco', { pobladores: ['carpintero'] }).includes('carpinteria') && sabe('rueda', { pobladores: ['carpintero'], vistas: ['tablas-tito'] }).includes('carpinteria'), 'la carpintería, desde el capítulo 11 («en la carpintería») o cuando conocés a Tito');
  ok(!sabe('arco').includes('carpinteria'), 'sin Tito en la aldea no hay carpintería');
  ok(sabe('cosecha', { pobladores: ['fotografa'], vistas: ['foto-sofia'] }).includes('estudio-fotos') && !sabe('cosecha', { pobladores: ['fotografa'] }).includes('estudio-fotos'), 'el estudio de fotos, cuando le llevaste la foto a Sofía');
  const a = armar('rueda'); a.h.empezada = 0;
  ok(MK.lugaresConocidos(a.h, a.s(), PUNTOS).length === 0 && MK.lugaresConocidos(null, a.s(), PUNTOS).length === 0 && MK.lugaresConocidos(a.h, null, PUNTOS).length === 0, 'sin Historia empezada, nada');
  ok(MK.lugaresConocidos(armar('rueda').h, armar('rueda').s(), {}).length === 0, 'sin puntos del mundo, nada');
  ok(sabe('deshielo').includes('molino-viejo') && sabe('rueda', { fase: 'intro' }).includes('molino-viejo'), 'una vez conocidos, se quedan');
  ok(MK.lugaresConocidos(armar('rueda').h, armar('rueda').s(), PUNTOS).every((l) => l.nombre === MK.PUNTOS_MARCA[l.punto].nombre), 'con los nombres de la tabla');
}

// ---------------------------------------------------------------- 4. las cadenas del panel
if (va('panel')) {
  const panelDe = (cap, hechos = []) => { const a = armar(cap, { hechos }); return H.panelHistoria(a.h, a.s()); };
  const sinHechos = panelDe('arco');
  ok(sinHechos.objetivos.length === 11 && sinHechos.objetivos.every((o) => !o.hecho), 'el capítulo 11 abre con once objetivos a la vista (doce con la deuda del trato)');
  const filas = MK.filasDelPanel('arco', sinHechos.objetivos);
  ok(filas.filter((f) => f.tipo === 'cadena').map((f) => f.titulo).join() === 'El arco,La honda,Lo prestado', 'tres cadenas con título: el arco, la honda y lo prestado (4.24.1: lo prestado también)');
  ok(filas.filter((f) => f.id !== 'prestado' && f.tipo === 'cadena').every((f) => f.hechos === 0) && filas.find((f) => f.id === 'arco').total === 6 && filas.find((f) => f.id === 'honda').total === 3 && filas.find((f) => f.id === 'prestado').total === 3, 'con su contador: 0 de 6, 0 de 3 y lo prestado con su cuenta de 3');
  ok(filas.filter((f) => f.tipo === 'objetivo').map((f) => f.o.id).join() === 'lado', 'sólo el lado del arroyo queda suelto (4.24.1: lo prestado pasó a ser la tercera cadena)');
  ok(filas.length === 4, `cuatro filas en lugar de once líneas sueltas (${filas.length})`);
  // en el modo normal no se pierde ningún objetivo sin cumplir
  const vistos = (fs) => fs.flatMap((f) => (f.tipo === 'objetivo' ? [f.o.id] : f.items.map((o) => o.id)));
  ok(vistos(filas).slice().sort().join() === sinHechos.objetivos.map((o) => o.id).sort().join(), 'todos los objetivos siguen a la vista');
  // lo hecho de una cadena se cuenta y no se lista
  const algo = panelDe('arco', ['lenga', 'tito', 'cuerda', 'cantos']);
  const f2 = MK.filasDelPanel('arco', algo.objetivos);
  ok(f2.find((f) => f.id === 'arco').hechos === 3 && f2.find((f) => f.id === 'arco').items.map((o) => o.id).join() === 'puntas,plumas,blancos-paso', 'tres del arco hechos: «3 de 6» y quedan tres en la lista');
  ok(f2.find((f) => f.id === 'honda').hechos === 1 && f2.find((f) => f.id === 'honda').items.length === 2, 'uno de la honda: «1 de 3»');
  ok(!vistos(f2).includes('lenga') && !vistos(f2).includes('cantos'), 'los hechos de una cadena no se listan');
  // una cadena terminada queda en una línea
  const f3 = MK.filasDelPanel('arco', panelDe('arco', ['fermin', 'cantos', 'blancos-esquila']).objetivos);
  const honda = f3.find((f) => f.id === 'honda');
  ok(honda.hechos === 3 && honda.items.length === 0 && honda.resto === 0, 'la honda terminada: «3 de 3» y sin pasos');
  // compacto: de cada cadena, el próximo paso y cuántos más
  const fc = MK.filasDelPanel('arco', sinHechos.objetivos, { compacto: true });
  const arcoC = fc.find((f) => f.id === 'arco'), hondaC = fc.find((f) => f.id === 'honda');
  ok(arcoC.items.length === 1 && arcoC.items[0].id === 'lenga' && arcoC.resto === 5 && hondaC.items.length === 1 && hondaC.resto === 2, 'compacto: el próximo paso y «y N más» (5 y 2)');
  ok(fc.filter((f) => f.tipo === 'objetivo').length === 2, 'compacto: los sueltos no se esconden nunca');
  ok(arcoC.hechos + arcoC.items.length + arcoC.resto === arcoC.total, 'la cuenta cierra: hechos + a la vista + resto = total');
  // el resto de los capítulos, igual que siempre
  for (const c of H.CAPITULOS) {
    if (c.id === 'arco') continue;
    const p = panelDe(c.id);
    const f = MK.filasDelPanel(c.id, p.objetivos);
    ok(f.every((x) => x.tipo === 'objetivo') && f.map((x) => x.o.id).join() === p.objetivos.map((o) => o.id).join(), `${c.id}: sin cadenas, el panel es el de siempre`);
  }
  // con un solo miembro a la vista no hay título
  const solo = MK.filasDelPanel('arco', sinHechos.objetivos.filter((o) => o.id === 'lenga' || o.id === 'lado'));
  ok(solo.every((f) => f.tipo === 'objetivo'), 'una cadena con un solo objetivo a la vista no lleva título');
  ok(MK.filasDelPanel('arco', null).length === 0 && MK.filasDelPanel('nada', sinHechos.objetivos).length === sinHechos.objetivos.length, 'datos raros no rompen');
  const pc = MK.panelConFilas(armar('arco').h, armar('arco').s());
  ok(pc && Array.isArray(pc.filas) && pc.filas.length === 4 && MK.panelConFilas({ activa: false }, null) === null, 'panelConFilas junta las dos cosas');
}

// ---------------------------------------------------------------- 5. el panel de verdad (historia-ui.js) y la guía
if (va('ui')) {
  const puntoDe = (k) => (Object.hasOwn(PUNTOS, k) ? PUNTOS[k] : null);
  const juego = (cap, op = {}) => { const a = armar(cap, op); const J = crearJuego({ P: a.P, X: a.X }); J.ctx.puntoDe = puntoDe; return { a, J, panel: J.ctx.documento.body.children.find((c) => c.id === 'historia-hud') }; };
  // el capítulo 11 con tres del arco hechos
  const { J, panel } = juego('arco', { hechos: ['lenga', 'tito', 'cuerda', 'cantos'], pobladores: ['herrero', 'carpintero', 'tejedora'] });
  J.valle.revisarAhora();
  const html = panel.innerHTML;
  ok(/<div class="cadena"><div class="cadena-t"><span>El arco<\/span><i>3 de 6<\/i><\/div>/.test(html), 'el panel dice «El arco · 3 de 6»');
  ok(/<span>La honda<\/span><i>1 de 3<\/i>/.test(html), 'y «La honda · 1 de 3»');
  ok(!/Dejale la madera a Tito|El arco: talá un árbol seco/.test(html) && /Las puntas: encargale a Anselmo/.test(html), 'lo hecho de la cadena no se lista y lo que falta sí');
  ok(/<p class="">/.test(html) && /<kbd>E<\/kbd>Pedí defensas prestadas/.test(html), 'lo prestado ya no repite su cuenta en la línea (va en el título: ver verificar-4-24-1-a)');
  ok(/<p class="mapa">En el mapa: [^<]*Puesto del Paso[^<]*<\/p>/.test(html), 'la línea gris «En el mapa: …» nombra lo marcado');
  ok(!/\blazo\b|[+-]\d/.test(html.replace(/<[^>]+>/g, ' ').replace(/\$\d|\(\d+\/\d+\)|\d de \d|\d+ metros/g, '')), 'sin números de lazo en el panel');
  const nueve = panel.innerHTML.length;
  // sin lugares del mundo (la aldea no está armada) no hay línea de mapa
  const sinP = juego('arco'); sinP.J.ctx.puntoDe = () => null; sinP.J.valle.revisarAhora();
  ok(!/class="mapa"/.test(sinP.panel.innerHTML), 'sin puntos del mundo, ni línea ni marcas');
  ok(sinP.J.valle.marcasObjetivo().length === 0, 'la API tampoco');
  // la API para el mapa
  ok(J.valle.marcasObjetivo().length >= 2 && J.valle.marcasObjetivo().every((m) => Number.isFinite(m.x) && Number.isFinite(m.z) && m.nombre), 'valle.marcasObjetivo() entrega las marcas con nombre y coordenadas');
  ok(J.valle.lugaresConocidos().map((l) => l.punto).join() === 'molino-viejo,coihue,carpinteria', 'valle.lugaresConocidos() entrega los que ya conocés');
  const pausada = juego('rueda'); pausada.J.valle.historia(); pausada.J.P.historia.activa = false;
  ok(pausada.J.valle.marcasObjetivo().length === 0 && pausada.J.valle.lugaresConocidos().length === 2, 'con la Historia en pausa: sin marcas de objetivo, pero el papel sigue nombrando lo que ya conocés');
  const desafio = juego('rueda');
  { const vd = UI.crearValleUi({ ...desafio.J.ctx, esDesafio: true }); ok(vd.marcasObjetivo().length === 0 && vd.lugaresConocidos().length === 0, 'en el Desafío, nada'); }

  // si el panel no entra en la ventana: compacto, y después sin las optativas
  const cuentaP = (t) => (t.match(/<p/g) || []).length;
  const alto = (P, innerHeight) => {
    const g = juego('arco', { hechos: ['lenga'], pobladores: ['herrero', 'carpintero', 'tejedora'] });
    g.J.ctx.documento.defaultView = { innerHeight };
    g.panel.getBoundingClientRect = () => ({ bottom: 20 * cuentaP(g.panel.innerHTML) });
    g.J.valle.revisarAhora();
    return g.panel.innerHTML;
  };
  const normal = alto(null, 100000), apretado = alto(null, 20 * cuentaP(normal) - 8 - 1), minimo = alto(null, 90);
  ok(!/pasos? más/.test(normal) && /<span>El arco<\/span><i>1 de 6<\/i>/.test(normal), 'con lugar, el panel se ve completo');
  ok(/y \d+ pasos? más/.test(apretado) && cuentaP(apretado) < cuentaP(normal) && /De paso \(si querés\)/.test(apretado), 'si no entra, de cada cadena queda el próximo paso y «y N pasos más» (con las optativas)');
  ok(!/De paso \(si querés\)/.test(minimo) && /Recorré el lado del arroyo/.test(minimo) && /Pedí defensas prestadas/.test(minimo), 'si todavía no entra, se van las optativas; los objetivos sueltos nunca');
  ok(/y \d+ pasos? más/.test(minimo), 'el minimo sigue contando lo que falta');
  { const sinOpt = apretado.replace(/<div class="optativas">[\s\S]*$/, '');
    const medio = alto(null, 20 * cuentaP(sinOpt) + 8);
    ok(!/De paso \(si querés\)/.test(medio) && /La trochita · el ramal/.test(medio) && /y \d+ pasos? más/.test(medio), 'si sin las optativas ya entra, la barra del ramal se queda'); }
  ok(/La trochita · el ramal/.test(normal) && /La trochita · el ramal/.test(apretado) && !/La trochita · el ramal/.test(minimo), 'la barra del ramal es lo último que se va');
  // la barra de la mano: si el panel la pisa (1024 de ancho), también se achica, aunque entre en la ventana
  { const g = juego('arco', { hechos: ['lenga'], pobladores: ['herrero', 'carpintero', 'tejedora'] });
    g.J.ctx.documento.defaultView = { innerHeight: 100000 };
    const barra = { getBoundingClientRect: () => ({ left: 270, right: 770, top: 20 * cuentaP(g.panel.innerHTML) - 50 - 2, bottom: 100000, width: 500, height: 60 }) };
    g.J.ctx.documento.getElementById = (id) => (id === 'barra' ? barra : null);
    g.panel.getBoundingClientRect = () => ({ left: 28, right: 408, bottom: 20 * cuentaP(g.panel.innerHTML) });
    g.J.valle.revisarAhora();
    ok(/y \d+ pasos? más/.test(g.panel.innerHTML), 'si el panel pisa la barra de la mano (a la derecha del panel en 1024), se achica');
    const lejos = juego('arco', { hechos: ['lenga'], pobladores: ['herrero', 'carpintero', 'tejedora'] });
    lejos.J.ctx.documento.defaultView = { innerHeight: 100000 };
    lejos.J.ctx.documento.getElementById = (id) => (id === 'barra' ? { getBoundingClientRect: () => ({ left: 433, right: 933, top: 0, bottom: 100000, width: 500, height: 60 }) } : null);
    lejos.panel.getBoundingClientRect = () => ({ left: 28, right: 408, bottom: 20 * cuentaP(lejos.panel.innerHTML) });
    lejos.J.valle.revisarAhora();
    ok(!/pasos? más/.test(lejos.panel.innerHTML), 'y si la barra queda al costado (1366), el panel no se toca'); }
  // sin medida de ventana (o de caja) no se toca nada
  ok(!/pasos? más/.test(alto(null, 0)), 'sin medir la ventana, el panel queda completo');
  ok(nueve > 0, 'el panel tiene contenido');

  // la guía: la línea de teclas
  const { P, X } = nuevaPartida();
  const J2 = crearJuego({ P, X });
  const base = documentoFalso(), crear = base.createElement;
  const guia = crear('div'); guia.id = 'guia-contenido';
  const cajas = [];
  const doc2 = { ...base, createElement: (t) => { const e = crear(t); cajas.push(e); return e; }, getElementById: (id) => (id === 'guia-contenido' ? guia : null) };
  UI.crearValleUi({ ...J2.ctx, documento: doc2, teclaVisible: (t) => ({ E: 'Q', M: 'N' }[t] || t) });
  const cajaGuia = cajas.find((e) => e.id === 'historia-guia');
  ok(cajaGuia && /<p class="teclas">Teclas de la historia: Q hablar o tomar · R esperar sentado · N mapa · J cuaderno<\/p>/.test(cajaGuia.innerHTML), 'la guía dice las teclas de la Historia con las que eligió el jugador');
  ok(cajaGuia && /un clic en la marca y la brújula te lleva/.test(cajaGuia.innerHTML), 'y cuenta la marca del mapa');
  const cajas3 = []; const doc3 = { ...base, createElement: (t) => { const e = crear(t); cajas3.push(e); return e; }, getElementById: (id) => (id === 'guia-contenido' ? guia : null) };
  UI.crearValleUi({ ...J2.ctx, documento: doc3 });
  ok(/Teclas de la historia: E hablar o tomar · R esperar sentado · M mapa · J cuaderno/.test(cajas3.find((e) => e.id === 'historia-guia')?.innerHTML || ''), 'con las teclas de fábrica, las de fábrica');
}

// ---------------------------------------------------------------- 6. las marcas del mapa (chinches.js y mapa.js)
if (va('mapa')) {
  const m = CH.marcasAutomaticas({ lugares: { galpon: { x: 1, z: 2 } }, objetivos: [{ x: 5, z: 6, nombre: 'Puesto Alto' }, { x: 7, z: 8, nombre: 'Galpón de Esquila', activa: true }, { x: 'a', z: 1, nombre: 'roto' }, { x: 9, z: 9 }] });
  const ob = m.filter((x) => x.clase === 'objetivo');
  ok(ob.length === 3 && ob[0].nombre === 'Puesto Alto' && !ob[0].activa && ob[1].activa === true && ob[2].nombre === 'objetivo', 'marcasAutomaticas suma las de los objetivos (con la que sigue la brújula, y sin las rotas)');
  ok(m.filter((x) => x.clase === 'lugar').length === 1, 'sin tocar lo de siempre (el galpón de esquila)');
  ok(CH.marcasAutomaticas({ desafio: { caja: null }, objetivos: [{ x: 1, z: 1, nombre: 'x' }] }).every((x) => x.clase !== 'objetivo'), 'en el Desafío no hay marcas de objetivo');
  ok(CH.marcasAutomaticas({ objetivos: 'nada' }).length === 0 && CH.marcasAutomaticas({}).length === 0, 'sin objetivos, nada');

  // el papel de verdad, con un lienzo de mentira
  const registro = [];
  const ctxFalso = () => new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : k === 'measureText' ? (s) => ({ width: String(s).length * 7 }) : k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : (...a) => { registro.push([k, ...a]); }),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  const lienzo = (w = 640) => ({ width: w, height: w, getContext: () => ctxFalso() });
  const antes = globalThis.document;
  globalThis.document = { createElement: () => lienzo() };
  try {
    const N = CFG.N;
    const T = { altura: () => 5, indice: () => 0, agua: () => null, bosque: new Float32Array(1), alturas: new Float32Array(N * N), rio: [], riel: [], sendero: [], val: () => 0 };
    const mapa = MAPA.crearMapa(T, null);
    const dibujar = (autom, lugares = {}, marcas = []) => { registro.length = 0; mapa.dibujar(lienzo(640), null, { pos: { x: 0, z: 0 }, yaw: 0 }, null, lugares, marcas, [], null, autom); return registro.slice(); };
    const textos = (r) => r.filter((x) => x[0] === 'fillText').map((x) => x[1]);
    const r1 = dibujar([{ x: 100, z: 100, nombre: 'Puesto Alto', clase: 'objetivo' }]);
    ok(textos(r1).filter((t) => t === 'Puesto Alto').length === 1, 'el mapa escribe el nombre de la marca del objetivo');
    const r2 = dibujar([{ x: 100, z: 100, nombre: 'Puesto Alto', clase: 'objetivo', activa: true }]);
    ok(r2.filter((x) => x[0] === 'arc').length === r1.filter((x) => x[0] === 'arc').length + 1, 'la que sigue la brújula lleva un redondel de más');
    ok(r1.some((x) => x[0] === 'closePath') && r1.some((x) => x[0] === 'fill'), 'la banderita se dibuja (un triángulo relleno)');
    // el rótulo no se repite si el mapa ya lo escribe (el mismo nombre al lado)
    const r3 = dibujar([{ x: 100, z: 100, nombre: 'Refugio del Arroyo', clase: 'objetivo' }], { refugio: { x: 100, z: 100, nombre: 'Refugio del Arroyo' } });
    ok(textos(r3).filter((t) => t === 'Refugio del Arroyo').length === 1, 'si el lugar ya tiene su rótulo en el mapa, el nombre no se escribe dos veces');
    const r4 = dibujar([], {}, [{ x: 50, z: 50, tipo: 'parada', nombre: 'Molino viejo' }]);
    ok(textos(r4).includes('Molino viejo'), 'un lugar conocido se escribe como cualquier parada');
  } finally { globalThis.document = antes; }
}

// ---------------------------------------------------------------- 7. main.js: el clic en la marca, la brújula y el cableado
if (va('juego')) {
  const entorno = (extra = {}) => {
    const e = {
      chincheActiva: null, notas: [], guardadas: 0, dibujadas: 0, sonidos: 0, listaChinches: [],
      marcas: [{ x: 100, z: 100, nombre: 'Puesto Alto', punto: 'puesto' }, { x: 300, z: -50, nombre: 'Plaza de la aldea', punto: 'plaza' }],
      ...extra,
    };
    Object.assign(e, {
      puntoDelMapa: () => e.clic, chinches: () => e.listaChinches, chincheCerca: CH.chincheCerca, ponerChinche: CH.ponerChinche, nombreLibre: CH.nombreLibre, MAX_CHINCHES: CH.MAX_CHINCHES,
      marcasDeObjetivo: () => e.marcas, nota: (t, s) => e.notas.push([t, s]), sonido: { anotar: () => { e.sonidos++; } }, guardar: () => { e.guardadas++; }, dibujarMapaSiAbierto: () => { e.dibujadas++; },
      progreso: {},
    });
    return e;
  };
  const tocar = (e, x, z) => { e.clic = { x, z }; funcion(main, 'tocarMapa', e)({}); };
  const e1 = entorno();
  tocar(e1, 104, 98);
  ok(e1.chincheActiva && e1.chincheActiva.objetivo === true && e1.chincheActiva.nombre === 'Puesto Alto' && e1.chincheActiva.x === 100, 'un clic sobre la marca de un objetivo pone el rumbo de la brújula');
  ok(e1.notas[0][0] === 'Rumbo a Puesto Alto' && e1.sonidos === 1 && e1.dibujadas === 1, 'avisa y vuelve a dibujar el mapa');
  ok(e1.listaChinches.length === 0 && e1.guardadas === 0 && (e1.progreso.chinches === undefined), 'no es una chinche: no ocupa lugar ni se guarda');
  tocar(e1, 100, 100);
  ok(e1.chincheActiva === null && e1.notas[1][0] === 'Rumbo cancelado', 'otro clic en la misma la suelta');
  tocar(e1, 104, 98); tocar(e1, 302, -52);
  ok(e1.chincheActiva.nombre === 'Plaza de la aldea', 'un clic en otra marca cambia el rumbo');
  const e2 = entorno({ listaChinches: [{ x: 102, z: 100, nombre: 'Mi lugar' }] });
  tocar(e2, 102, 100);
  ok(e2.chincheActiva && e2.chincheActiva.nombre === 'Mi lugar' && !e2.chincheActiva.objetivo, 'si hay una chinche propia justo ahí, gana la chinche');
  const e3 = entorno();
  tocar(e3, -200, -200);
  ok(e3.chincheActiva && !e3.chincheActiva.objetivo && e3.progreso.chinches.length === 1 && e3.guardadas === 1, 'un clic en el papel vacío sigue poniendo una chinche, como siempre');
  // la lista de marcas del juego: cacheada un segundo
  const e4 = { desafio: null, valle: { cuenta: 0, marcasObjetivo() { this.cuenta++; return [{ x: 1, z: 2, nombre: 'a' }]; } }, performance: { now: () => e4.t }, t: 5000, marcasObjCache: { t: -1e9, v: [] }, fallaSistema: () => {} };
  const mo = funcion(main, 'marcasDeObjetivo', e4);
  mo(); mo(); e4.t = 5400; mo();
  ok(e4.valle.cuenta === 1, 'las marcas se piden a lo sumo una vez por segundo');
  e4.t = 6100; mo(); mo(true);
  ok(e4.valle.cuenta === 3, 'pasado un segundo, o al abrir el mapa («fresco»), se piden de nuevo');
  const e5 = { ...e4, desafio: {}, valle: e4.valle, marcasObjCache: { t: -1e9, v: [] } };
  ok(funcion(main, 'marcasDeObjetivo', e5)().length === 0, 'en el Desafío no hay marcas');
  const e6 = { desafio: null, valle: { marcasObjetivo() { throw new Error('x'); } }, performance: { now: () => 1 }, marcasObjCache: { t: -1e9, v: [] }, fallaSistema: (a) => { e6.fallo = a; } };
  ok(funcion(main, 'marcasDeObjetivo', e6)().length === 0 && e6.fallo === 'historia-marcas-objetivo', 'si las marcas fallan, el juego sigue sin ellas');
  // el cableado
  ok(enUnaLinea(main, ['if (valle && !desafio) for (const m of valle.lugaresConocidos())', "tipo: 'parada'"]), 'dibujarMapa nombra los lugares que ya conocés');
  ok(enUnaLinea(main, ['marcasAutomaticas({ desafio, lugares: T.lugares, objetivos: marcasDeObjetivo(true)', 'chincheActiva?.objetivo']), 'dibujarMapa pasa las marcas de los objetivos (la que sigue la brújula, marcada)');
  ok(enUnaLinea(main, ['if (chincheActiva?.objetivo && !marcasDeObjetivo().some((m) => m.x === chincheActiva.x && m.z === chincheActiva.z)) chincheActiva = null;']), 'la brújula suelta el objetivo cuando se cumple (o la historia se pausa)');
  ok(enUnaLinea(main, ['const delObjetivo = existente ? null : chincheCerca(marcasDeObjetivo(true), p.x, p.z);']), 'tocarMapa busca la marca sólo si no hay una chinche ahí');
  ok(/^import \{[^}]+\} from '[^']+';$/m.test(leer('historia-marca.js')), 'el módulo nuevo usa imports de una línea (armar.mjs)');
}

// ---------------------------------------------------------------- 8. el tono
if (va('tono')) {
  const textos = [
    ...Object.values(MK.PUNTOS_MARCA).map((p) => p.nombre),
    ...MK.GRUPOS_PANEL.arco.map((g) => g.titulo),
    'Teclas de la historia', 'En el mapa:', 'Lo que un objetivo nombra (un puesto, la plaza, un galpón) aparece marcado en el mapa: un clic en la marca y la brújula te lleva hasta ahí.',
    'La brújula te lleva hasta que llegues o cumplas el objetivo',
  ];
  ok(textos.every((t) => !/\b(the|and|you|click|map|quest|objective|mark)\b/i.test(t)), 'nada de inglés en los textos nuevos');
  ok(textos.every((t) => !/dios|santo|sagrad|virgen|difunta|gauchito/i.test(t)), 'nada religioso');
  const fuente = leer('historia-marca.js');
  ok(/^\/\/ 4\.24\.0 \(A\)/.test(fuente) && !fuente.includes('\r'), 'comentario de versión y fines de línea LF');
  ok(historiaUi.includes('4.24.0 (A)') && !historiaUi.includes('\r'), 'historia-ui.js lleva la marca de la versión');
}

// ---------------------------------------------------------------- las mutaciones
const MUT = [
  ['historia-marca.js', "  return p.via === 'hogar' && conoceA(h, s, p.clave);", "  return p.via === 'hogar';", 'la casa de un vecino se marca sin conocerlo (spoiler)', 'marcas'],
  ['historia-marca.js', "  if (nombraElLugar(texto, p.punto)) return true;", "  if (true) return true;", 'se marca aunque el texto no nombre el lugar', 'marcas'],
  ['historia-marca.js', "    if (obj(h.hechos)[`${c.id}:${o.id}`] !== undefined) continue;\n    let texto", "    let texto", 'se marcan también los objetivos ya cumplidos', 'marcas'],
  ['historia-marca.js', "    if (o.visible && !o.visible(s)) continue;\n    if (obj(h.hechos)", "    if (obj(h.hechos)", 'se marcan los objetivos que todavía no se ven', 'marcas'],
  ['historia-marca.js', "  if (!h?.activa || h.fase !== 'jugando' || !s) return [];\n  const c = CAPITULOS[Number(h.capitulo) || 0];", "  if (!s) return [];\n  const c = CAPITULOS[Number(h.capitulo) || 0];", 'hay marcas con la Historia en pausa o fuera del capítulo', 'marcas'],
  ['historia-marca.js', "export const MAX_MARCAS = 4;", "export const MAX_MARCAS = 40;", 'el mapa se llena de banderitas', 'marcas'],
  ['historia-marca.js', "      if (salida.some((m) => m.punto === p.punto)) continue;\n", "", 'dos objetivos del mismo lugar dibujan dos banderitas', 'marcas'],
  ['historia-marca.js', "  'llave:refugio': ['refugio'],\n", "", 'el primer objetivo (llegar al refugio) no se marca', 'marcas'],
  ['historia-marca.js', "  'arco:blancos-paso': ['puesto-paso'],\n", "", 'los blancos del Puesto del Paso no se marcan', 'marcas'],
  ['historia-marca.js', "const ALIAS = { 'refugio-puerta': 'refugio', 'puesto-alto': 'puesto', 'molino-historia': 'molino-viejo' };", "const ALIAS = { };", 'la puerta del refugio no cuenta como el refugio', 'marcas'],
  ['historia-marca.js', "palabras: ['plaza', 'aldea', 'predio'] },", "palabras: ['plaza', 'predio'] },", 'el puesto sanitario «de la aldea» no se marca', 'marcas'],
  ['historia-marca.js', "    if (!(a && b && a.x === b.x && a.z === b.z)) return PUNTOS_MARCA.refugio.nombre;", "    if (false) return PUNTOS_MARCA.refugio.nombre;", 'sin galponcito, la noche dice «Tu galpón»', 'marcas'],
  ['historia-marca.js', "  'raiz-ramon': (h, s) => vio(s, 'ramon-raiz'),", "  'raiz-ramon': (h, s) => (Number(h.capitulo) || 0) >= indiceCap('perdido'),", 'la raíz de Ramón se nombra antes de verla', 'conocidos'],
  ['historia-marca.js', "  'molino-viejo': (h, s) => (Number(h.capitulo) || 0) >= indiceCap('rueda') || vio(s, 'piedras-molino', 'bolsa-coihue'),", "  'molino-viejo': (h, s) => true,", 'el molino viejo se nombra el primer día', 'conocidos'],
  ['historia-marca.js', "  panaderia: (h, s) => s.pobladores?.has?.('panadera') && (", "  panaderia: (h, s) => (", 'la panadería se nombra aunque Rosa no viva en la aldea', 'conocidos'],
  ['historia-marca.js', "  if (!h?.empezada || !s) return [];\n  const P = obj(puntos), salida = [];\n  for (const [punto, conoce]", "  if (!s) return [];\n  const P = obj(puntos), salida = [];\n  for (const [punto, conoce]", 'sin Historia empezada igual se nombran', 'conocidos'],
  ['historia-marca.js', "    { id: 'honda', titulo: 'La honda', objetivos: ['fermin', 'cantos', 'blancos-esquila'] },", "    { id: 'honda', titulo: 'La honda', objetivos: ['fermin', 'cantos'] },", 'la honda pierde un paso (la cuenta no cierra)', 'panel'],
  ['historia-marca.js', "    const pendientes = miembros.filter((m) => !m.hecho);", "    const pendientes = miembros;", 'los pasos hechos de la cadena se siguen listando', 'panel'],
  ['historia-marca.js', "    const items = compacto ? pendientes.slice(0, PASOS_COMPACTOS) : pendientes;", "    const items = pendientes.slice(0, PASOS_COMPACTOS);", 'en el modo normal se esconden pasos', 'panel'],
  ['historia-marca.js', "    if (!g || miembros.length < 2) {", "    if (!g) {", 'una cadena de un solo objetivo lleva título', 'panel'],
  ['historia-ui.js', "if (alto && desbordaPanel(alto)) {", "if (false && desbordaPanel(alto)) {", 'el panel no se achica cuando no entra en la ventana', 'ui'],
  ['historia-ui.js', "          panel.innerHTML = armar(true, false); ctx.traducir?.(panel);\n", "          panel.innerHTML = armar(true, true); ctx.traducir?.(panel);\n", 'si aun compacto no entra, las optativas siguen', 'ui'],
  ['historia-ui.js', "          if (desbordaPanel(alto)) { panel.innerHTML = armar(true, false, true); ctx.traducir?.(panel); }\n", "", 'el último recurso (sin la barra del ramal) no existe', 'ui'],
  ['historia-ui.js', "    return !!(b && b.width > 0 && b.height > 0 && r.right > b.left && r.left < b.right && r.bottom > b.top - 4);", "    return false;", 'el panel puede pisar la barra de la mano', 'ui'],
  ['historia-ui.js', "(lineaDeMarcas(marcas) ? `<p class=\"mapa\">", "(false ? `<p class=\"mapa\">", 'el panel no dice qué está marcado en el mapa', 'ui'],
  ['historia-ui.js', "Teclas de la historia: ${k('E')} hablar o tomar · ${k('R')} esperar sentado · ${k('M')} mapa · ${k('J')} cuaderno", "Teclas de la historia: ${k('E')} hablar o tomar · ${k('M')} mapa · ${k('J')} cuaderno", 'la guía se olvida de R (esperar sentado)', 'ui'],
  ['historia-ui.js', "const k = (t) => (ctx.teclaVisible ? ctx.teclaVisible(t) : t);", "const k = (t) => t;", 'la guía dice las teclas de fábrica aunque el jugador las cambió', 'ui'],
  ['historia-ui.js', "    lugaresConocidos: () => { const h = historia(); if (ctx.esDesafio || !h.empezada) return []; return", "    lugaresConocidos: () => { const h = historia(); return", 'el Desafío pide lugares de la Historia', 'ui'],
  ['historia-ui.js', "    marcasObjetivo: () => { const h = historia(); if (ctx.esDesafio || !h.activa) return []; return", "    marcasObjetivo: () => { const h = historia(); return", 'el Desafío pide marcas de la Historia', 'ui'],
  ['chinches.js', "      sumar(o, String(o?.nombre ?? '').trim() || 'objetivo', 'objetivo');", "      void o;", 'las marcas automáticas no traen los objetivos', 'mapa'],
  ['chinches.js', "  if (!desafio && Array.isArray(objetivos)) {", "  if (Array.isArray(objetivos)) {", 'el Desafío también marca objetivos', 'mapa'],
  ['chinches.js', "marcas[marcas.length - 1].activa = true;", "void 0;", 'la marca que sigue la brújula no se distingue', 'mapa'],
  ['mapa.js', "        if (a.activa) { ctx.strokeStyle = 'rgba(184, 67, 47, 0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py - s * 0.9, s * 1.9, 0, Math.PI * 2); ctx.stroke(); }\n", "", 'el mapa no distingue la marca que sigue la brújula', 'mapa'],
  ['mapa.js', "rotular(a.nombre, px, py - s * 0.6, s * 2.2, W / 46, true, { ax: px + s * 0.5, ay: py - s * 1.35 });", "void 0;", 'la banderita no lleva nombre', 'mapa'],
  ['main.js', "  const delObjetivo = existente ? null : chincheCerca(marcasDeObjetivo(true), p.x, p.z);", "  const delObjetivo = null;", 'el clic en la marca del objetivo no hace nada', 'juego'],
  ['main.js', "chincheActiva = siguiendo ? null : { x: delObjetivo.x, z: delObjetivo.z, nombre: delObjetivo.nombre, objetivo: true };", "chincheActiva = { x: delObjetivo.x, z: delObjetivo.z, nombre: delObjetivo.nombre, objetivo: true };", 'un segundo clic no suelta la brújula', 'juego'],
  ['main.js', "  if (chincheActiva?.objetivo && !marcasDeObjetivo().some((m) => m.x === chincheActiva.x && m.z === chincheActiva.z)) chincheActiva = null;\n", "", 'la brújula sigue un objetivo ya cumplido', 'juego'],
  ['main.js', "  if (fresco || ahora - marcasObjCache.t > 1000) {", "  if (true) {", 'las marcas se recalculan en cada cuadro', 'juego'],
  ['main.js', "  if (valle && !desafio) for (const m of valle.lugaresConocidos()) marcas.push(", "  if (false) for (const m of valle.lugaresConocidos()) marcas.push(", 'el mapa no nombra los lugares que ya conocés', 'juego'],
];
let atrapadas = 0;
const SIN_MUT = !!process.env.A4240_SIN_MUT;
if (!HIJO && !SIN_MUT) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4240a-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4240_CALLADO: '1', A4240_SECCIONES: secc }, encoding: 'utf8', timeout: 280000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO || SIN_MUT) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.24.0 (A) no te pierdas: marca del objetivo en el mapa, lugares conocidos, cadenas del panel y teclas de la guía · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
