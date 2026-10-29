// 4.16.0 (agente A): la mecánica del acto II de la Historia nueva (capítulos 5 a 8): objetivos, decisiones D2/D3/D4, disparadores de las escenas, lo que
// cambia al verlas, los objetos del mundo, la puerta de estación y el clima de la historia, el coihue grande, el cuaderno de Eusebio, el acompañante que
// te sigue a pie y el enganche con el juego (por texto). Las escenas de B no están en esta prueba (son datos de otro agente): acá sólo se prueba que, esté
// o no escrita una escena, la historia no se traba y la mecánica propia anda. Al final: mutaciones (se rompe a propósito el código y la prueba tiene que fallar).
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const progresoBase = (H) => ({ dia: 6, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, historia: H.historiaNueva() });

async function chequear(arch = '', sufijo = '') {
  // (al mutar el acto II, el juntador de disparadores se vuelve a cargar con la copia mutada)
  const usaMut = (f) => sufijo && (arch === f || (arch === 'historia-disparadores-acto2.js' && f === 'historia-disparadores.js'));
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', usaMut(f) ? f.replace('.js', `${sufijo}.js`) : f)).href);
  const H = await imp('historia.js');
  const D = await imp('historia-disparadores.js');
  const A2 = await imp('historia-disparadores-acto2.js');
  const AC = await imp('historia-acompanante.js');
  const X = await imp('historia-escenas-efectos.js');
  const U = await imp('historia-escenas-util.js');
  const EN = await import('../src/escenas.js');
  const f0 = fallas;

  // ayudas
  const armar = (cap, { dec = {}, fase = 'jugando', dia = 6, horas = 10, p0 = null } = {}) => {
    const p = p0 || progresoBase(H); p.dia = dia; p.horas = horas;
    const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = cap; h.fase = fase; h.base = { dia }; h.cerrados = { ramal: dia - 1 };
    Object.assign(h.decisiones, dec);
    return { p, h };
  };
  const E = (p, extra = {}) => H.estadoHistoria(p, { estacionNatural: 'otono', estacion: 'otono', lugares: {}, ...extra });
  const hecho = (h, p, id, extra) => {
    const s = E(p, extra), o = H.capituloActual(h).objetivos.find((x) => x.id === id);
    return o.cuenta ? o.cuenta(s, h.base) >= (o.meta || 1) : !!o.hecho(s, h.base);
  };
  const vista = (h, id, dia = 6) => EN.marcarVista(h, id, dia);

  // ---------------------------------------------------------------- 1. los cuatro capítulos
  {
    const ids = ['rueda', 'perdido', 'cosecha', 'cuaderno'];
    igual(H.CAPITULOS.slice(4, 8).map((c) => c.id), ids, 'los capítulos 5 a 8, en orden');
    ok(H.CAPITULOS_COMPLETOS === 8, 'ya son 8 los capítulos completos');
    for (const c of H.CAPITULOS.slice(4, 8)) {
      ok(!H.esContinuara(c) && c.objetivos.length >= 6, `${c.id}: objetivos de verdad (${c.objetivos.length})`);
      ok(!/todavía se está escribiendo/.test(c.intro.join(' ')), `${c.id}: sin «continuará»`);
      for (const o of c.objetivos) ok(typeof o.hecho === 'function' || typeof o.cuenta === 'function', `${c.id}:${o.id} se mide`);
      ok(new Set(c.objetivos.map((o) => o.id)).size === c.objetivos.length, `${c.id}: objetivos únicos`);
    }
    ok(H.CAPITULOS[4].puerta?.estacion === 'otono' && H.CAPITULOS[4].puerta.tope === 2, 'el capítulo 5 tiene su puerta de estación (otoño, 2 días)');
    ok(H.CAPITULOS[4].decisiones[0].id === 'coihue' && H.CAPITULOS[6].decisiones[0].id === 'molienda' && H.CAPITULOS[7].decisiones[0].id === 'cuaderno', 'las decisiones D2, D3 y D4 cuelgan de sus capítulos');
    ok(H.CAPITULOS[4].momento.evento === 'puente', 'el momento del capítulo 5: el puente del arroyo');
    ok(H.CAPITULOS[5].objetivos.some((o) => o.espera), 'la guardia del capítulo 6 es una espera (acelera el reloj sentado)');
    ok(H.CAPITULOS[8].objetivos.length === 1 && H.esContinuara(H.CAPITULOS[8]), 'del 9 en adelante sigue el «continuará»');
    for (const d of ['coihue', 'molienda', 'cuaderno']) {
      const def = H.DEFINICION_DECISIONES[d];
      ok(def && def.opciones.length === 3 && def.opciones.every((o) => ['a', 'b', 'c'].includes(o.id)), `${d}: la tarjeta de respaldo con tres opciones`);
    }
    igual(H.DEFINICION_DECISIONES.coihue.opciones.map((o) => o.lazos.ema), [1, -2, 1], 'D2: Josefina +1, −2, +1');
    igual(H.DEFINICION_DECISIONES.molienda.opciones.map((o) => o.ramal || 0), [4, 0, 2], 'D3: el ramal suma 4 a Esquel y 2 partida');
    igual(H.DEFINICION_DECISIONES.cuaderno.opciones.map((o) => o.lazos.ema), [-1, 2, 1], 'D4: Josefina −1, +2, +1');
    ok(H.PRESTADOS.includes('zaino') && H.ACOMPANANTES.includes('tobias') && !H.ACOMPANANTES.includes('constructor'), 'el zaino se presta y Tobías puede acompañar');
  }

  // ---------------------------------------------------------------- 2. capítulo 5: La rueda
  {
    const { p, h } = armar(4);
    ok(!hecho(h, p, 'piedras') && !hecho(h, p, 'zaino') && !hecho(h, p, 'molino') && !hecho(h, p, 'coihue') && !hecho(h, p, 'habas'), 'al empezar no hay nada hecho');
    vista(h, 'piedras-molino'); ok(hecho(h, p, 'piedras'), 'las piedras del molino viejo: la escena');
    vista(h, 'zaino-ramon'); ok(hecho(h, p, 'zaino'), 'el zaino: la escena');
    ok(!hecho(h, p, 'molino') && hecho(h, p, 'molino', { terminadas: [{ id: 'molino-agua', x: 1, z: 1 }] }), 'el molino de agua terminado');
    p.huerta['0,0'] = {}; ok(hecho(h, p, 'habas'), 'un cantero sembrado');
    const ext = (x, z = 0) => ({ terminadas: [{ id: 'aserradero', x, z }], coihue: { x: 0, z: 0 } });
    const cump = (extra) => hecho(h, p, 'cumplir', extra);
    // D2 = A: el aserradero a más de 25 m del coihue
    h.decisiones.coihue = 'a';
    ok(!cump(ext(10)) && !cump(ext(25)) && cump(ext(26)) && cump(ext(60, 40)), 'A: dejarlo en pie y el aserradero a más de 25 m');
    ok(!cump({}) && !cump({ coihue: { x: 0, z: 0 } }), 'A: sin aserradero no se cumple');
    // D2 = B: talado + aserradero
    h.decisiones.coihue = 'b';
    ok(!cump(ext(40)), 'B: sin talar el coihue no se cumple');
    H.marcarTema(h, 'mundo', 'coihue-talado', 6);
    ok(cump(ext(5)) && !cump({}), 'B: talado y con el aserradero (donde sea) se cumple');
    // D2 = C: pirca + aserradero
    h.temas = {}; h.decisiones.coihue = 'c';
    ok(!cump(ext(40)), 'C: sin la pirca no se cumple');
    H.marcarObjeto(h, 'pirca', 6);
    ok(cump(ext(5)) && !cump({}), 'C: con la pirca y el aserradero se cumple');
    // el texto del objetivo sigue lo que falta
    const q = H.CAPITULOS[4].objetivos.find((o) => o.id === 'cumplir');
    const txt = (extra = {}) => H.textoObjetivo(q, E(p, extra));
    h.objetos = {}; h.entregados = {}; h.decisiones.coihue = 'c';
    ok(/Tobías, en la cantera/.test(txt()), 'C: primero, llevarle piedras a Tobías');
    H.marcarEntrega(h, 'tobias', 'piedra', 6); ok(/levantá la pirca/.test(txt()), 'C: después, la pirca en la raíz');
    H.marcarObjeto(h, 'pirca', 6); ok(/aserradero/.test(txt()), 'C: al final, el aserradero');
    h.decisiones.coihue = 'a'; ok(/más de 25 metros/.test(txt()), 'A: el texto dice los 25 metros');
    h.decisiones.coihue = 'b'; h.temas = {}; ok(/seis hachazos/.test(txt()), 'B: el texto dice los seis hachazos');
    ok(!q.visible(E(p, {})) === false || q.visible(E(p, {})), 'el objetivo de cumplir aparece con la decisión');
    h.decisiones.coihue = null; ok(q.visible(E(p, {})) === false, 'y no antes de decidir');
    // el cierre de la tarjeta según la decisión y el premio
    for (const [d, re] of [['a', /quedó en pie/], ['b', /tocón ancho/], ['c', /pirca de Tobías/]]) {
      h.decisiones.coihue = d;
      ok(re.test(H.lineasCarta(H.CAPITULOS[4], h, 'outro').join(' ')), `la tarjeta de cierre, variante ${d}`);
    }
    ok(H.CAPITULOS[4].premio.cuenta.harina === 4 && H.CAPITULOS[4].premio.cuenta['semillas-habas'] > 0, 'el premio: cuatro medidas de harina y semillas');
  }

  // ---------------------------------------------------------------- 3. capítulo 6: Lo que se pierde, aparece
  {
    const { p, h } = armar(5, { horas: 23.5 });
    vista(h, 'luces-lago-nicanor'); ok(hecho(h, p, 'nicanor'), 'Nicanor: las luces del lago');
    H.marcarObjeto(h, 'dedal', 6); H.marcarObjeto(h, 'pipa', 6);
    ok(!hecho(h, p, 'buscar'), 'buscar: faltan una');
    H.marcarObjeto(h, 'cuchara', 6); ok(hecho(h, p, 'buscar'), 'buscar: las tres');
    ok(!hecho(h, p, 'devolver'), 'devolver: falta llevárselas a Ercilia');
    vista(h, 'perdidas-devueltas'); ok(hecho(h, p, 'devolver'), 'devolver: la escena con Ercilia');
    // el faro: de noche, en el kayak o el velero y cerca
    const faro = (extra, horas = 23.5) => { p.horas = horas; return hecho(h, p, 'faro', { lugares: { faro: 30 }, ...extra }); };
    ok(faro({ enKayak: true }) && faro({ enVela: true }), 'el faro: en kayak o en velero, de noche, a menos de 40 m');
    ok(!faro({ enKayak: true }, 12) && !faro({}) && !faro({ enKayak: true, lugares: { faro: 90 } }), 'el faro: no de día, no a pie, no lejos');
    ok(faro({ enKayak: true }, 0.5) && !faro({ enKayak: true }, 1.5), 'el faro: de 23 a 1 h (cruza la medianoche)');
    // la guardia y las huellas
    ok(!hecho(h, p, 'guardia') && !hecho(h, p, 'huellas'), 'la guardia y las huellas esperan sus escenas');
    vista(h, 'guardia-molino'); ok(hecho(h, p, 'guardia'), 'la guardia: la escena');
    vista(h, 'ramon-raiz'); ok(hecho(h, p, 'huellas'), 'las huellas: la escena de la raíz de Ramón');
    // esperar sentado acelera el reloj sólo si hay algo que esperar
    const { p: p2, h: h2 } = armar(5); h2.hechos = {};
    ok(H.aceleracionDeEspera(h2, E(p2, { sentado: true })) === 8, 'sentado con la guardia pendiente, el reloj corre ×8');
    ok(H.aceleracionDeEspera(h2, E(p2, { sentado: false })) === 1, 'de pie, normal');
    h2.hechos['perdido:guardia'] = 6;
    ok(H.aceleracionDeEspera(h2, E(p2, { sentado: true })) === 1, 'cumplida la guardia, sentado ya no acelera nada de la historia');
    const { p: p3, h: h3 } = armar(1); ok(H.aceleracionDeEspera(h3, E(p3, { sentado: true })) === 1, 'y en un capítulo sin esperas, tampoco');
    ok(H.CAPITULOS[5].premio.cosas.includes('farol'), 'el premio: el farol');
  }

  // ---------------------------------------------------------------- 4. capítulo 7: La cosecha
  {
    const { p, h } = armar(6);
    // lo molido se cuenta desde que empezó el capítulo
    h.molido = 30; h.base = { dia: 6, molido: 25, cocinadas: 0, cosechas: 0 };
    ok(!hecho(h, p, 'moler'), 'moler: cinco desde que empezó el capítulo no alcanzan');
    h.molido = 35; ok(hecho(h, p, 'moler'), 'moler: diez medidas desde que empezó el capítulo');
    h.base.cosechas = 0; p.cosechasTotal = 5; ok(!hecho(h, p, 'cosechar'), 'cosechar: cinco no alcanzan'); p.cosechasTotal = 6; ok(hecho(h, p, 'cosechar'), 'cosechar: seis');
    ok(!hecho(h, p, 'galpon') && hecho(h, p, 'galpon', { terminadas: [{ id: 'galponcito', x: 0, z: 0 }] }), 'el galponcito');
    // D3
    const c = (extra) => hecho(h, p, 'cumplir', extra);
    h.decisiones.molienda = 'a'; h.fletesHarina = 2; ok(!c() && ((h.fletesHarina = 3), c()), 'A: tres fletes a Esquel');
    h.decisiones.molienda = 'b'; ok(!c(), 'B: sin entregar no se cumple'); H.marcarEntrega(h, 'ercilia', 'harina', 6); ok(c(), 'B: seis medidas al almacén');
    h.decisiones.molienda = 'c'; h.entregados = {}; h.fletesHarina = 2;
    ok(!c(), 'C: falta todo lo demás'); H.marcarEntrega(h, 'ercilia', 'harina-3', 6); ok(!c(), 'C: falta la raíz'); H.marcarEntrega(h, 'raiz', 'harina', 6); ok(c(), 'C: dos fletes, tres al almacén y una a la raíz');
    h.fletesHarina = 1; ok(!c(), 'C: con un solo flete no');
    // la minga: algo cocinado desde que empezó el capítulo; el galpón y el cuaderno
    vista(h, 'minga-aldea'); ok(hecho(h, p, 'minga'), 'la minga'); vista(h, 'galpon-ronda'); ok(hecho(h, p, 'ronda'), 'el galpón en ronda');
    ok(!hecho(h, p, 'cuaderno'), 'el cuaderno todavía no'); H.marcarObjeto(h, 'cuaderno-eusebio', 7); ok(hecho(h, p, 'cuaderno'), 'el cuaderno del pozo');
    ok(H.CAPITULOS[6].premio.cuenta.yerba > 0, 'un premio chico: yerba y el cuaderno');
    // los fletes de la molienda cuentan desde la decisión (los de antes, no)
    const f = H.historiaNueva(); f.activa = true; f.capitulo = 6; f.decisiones.molienda = 'a';
    H.sumarFletes(f, { entregas: 2 }); ok(f.entregasVistas === 2 && f.fletesHarina === 0, 'los fletes anteriores a la decisión no cuentan');
    H.sumarFletes(f, { entregas: 5 }); ok(f.fletesHarina === 3 && f.fletes === 3, 'tres fletes después de decidir: cuentan para cumplir y para el ramal');
    H.sumarFletes(f, { entregas: 20 }); ok(f.fletesHarina <= 9 && f.fletes <= 8, 'con tope');
    const g = H.historiaNueva(); g.activa = true; g.capitulo = 6; H.sumarFletes(g, { entregas: 1 }); H.sumarFletes(g, { entregas: 4 }); ok(g.fletesHarina === 0, 'sin decisión de fletes no se cuenta nada para la molienda');
  }

  // ---------------------------------------------------------------- 5. capítulo 8: El cuaderno de Eusebio
  {
    const { p, h } = armar(7, { horas: 18 });
    ok(!hecho(h, p, 'leer'), 'leer: ninguna página');
    for (let i = 1; i <= 3; i++) { const pag = A2.leerPagina(h, E(p), 7); ok(Array.isArray(pag) && pag[0].includes(`${i} de 3`) && pag[1].length > 60, `la página ${i}`); }
    ok(A2.leerPagina(h, E(p), 7) === null && hecho(h, p, 'leer'), 'después de la tercera, no hay más y el objetivo se tilda');
    vista(h, 'libreta-fiado'); vista(h, 'cuaderno-abuelo'); vista(h, 'los-del-cerro');
    ok(hecho(h, p, 'ercilia') && hecho(h, p, 'josefina') && hecho(h, p, 'belisario'), 'Ercilia, Josefina y Belisario');
    ok(!hecho(h, p, 'ramon'), 'Ramón: todavía no'); vista(h, 'secreto-ramon'); ok(hecho(h, p, 'ramon'), 'Ramón: la escena del atardecer');
    // con Ramón enojado no hay escena: alcanza con estar en su puesto al atardecer (nunca se traba)
    const { p: q, h: k } = armar(7, { horas: 18 }); k.lazos.ramon = -1;
    ok(hecho(k, q, 'ramon', { lugares: { puesto: 20 } }) && !hecho(k, q, 'ramon', { lugares: { puesto: 90 } }), 'con lazo de Ramón < 0: se lo ve de lejos desde su puesto al atardecer');
    q.horas = 12; ok(!hecho(k, q, 'ramon', { lugares: { puesto: 20 } }), '(pero no al mediodía)');
    ok(!hecho(h, p, 'fogon'), 'el fogón: sin decidir'); h.decisiones.cuaderno = 'b'; ok(hecho(h, p, 'fogon'), 'el fogón: la decisión');
    // el premio según lo decidido
    for (const [d, re, mat, cosa] of [['a', /leña/, 'tronco', null], ['b', /poncho/, null, 'poncho'], ['c', /flete/, null, null]]) {
      h.decisiones.cuaderno = d;
      const pr = H.premioDeCapitulo(H.CAPITULOS[7], h);
      ok(re.test(pr.texto) && pr.cuenta.yerba === 4 && pr.cosas.includes('pluma-condor'), `el premio, variante ${d}`);
      ok(!mat || pr.materiales[mat] === 6, `variante ${d}: la leña`); ok(!cosa || pr.cosas.includes(cosa), `variante ${d}: lo regalado`);
    }
    h.decisiones.cuaderno = null; ok(H.premioDeCapitulo(H.CAPITULOS[7], h) === H.CAPITULOS[7].premio, 'sin decidir, el premio base');
    H.CAPITULOS[7].premio.cuenta.yerba === 4;
    const h2 = H.historiaNueva(); h2.activa = true; D.alCerrarCapitulo(h2, 'cuaderno', 9); ok(h2.ramal === 0, 'cerrar el capítulo 8 sin decidir no suma al ramal');
  }

  // ---------------------------------------------------------------- 6. recorrido de punta a punta del acto II (sin trabarse)
  {
    for (const [cap, hace] of [
      [4, (p, h) => { vista(h, 'piedras-molino'); vista(h, 'zaino-ramon'); h.decisiones.coihue = 'a'; p.huerta['0,0'] = {}; h.hechos['rueda:puente'] = 6; return { terminadas: [{ id: 'molino-agua', x: 0, z: 0 }, { id: 'aserradero', x: 50, z: 0 }], coihue: { x: 0, z: 0 } }; }],
      [5, (p, h) => { vista(h, 'luces-lago-nicanor'); for (const o of H.PERDIDAS) H.marcarObjeto(h, o, 6); vista(h, 'perdidas-devueltas'); vista(h, 'guardia-molino'); vista(h, 'ramon-raiz'); p.horas = 23.5; return { enKayak: true, lugares: { faro: 10 } }; }],
      [6, (p, h) => { h.base = { dia: 6, molido: 0, cocinadas: 0, cosechas: 0 }; h.molido = 10; p.cosechasTotal = 6; h.decisiones.molienda = 'a'; h.fletesHarina = 3; vista(h, 'minga-aldea'); vista(h, 'galpon-ronda'); H.marcarObjeto(h, 'cuaderno-eusebio', 6); return { terminadas: [{ id: 'galponcito', x: 0, z: 0 }] }; }],
      [7, (p, h) => { for (let i = 0; i < 3; i++) A2.leerPagina(h, E(p), 7); for (const e of ['libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro', 'secreto-ramon']) vista(h, e); h.decisiones.cuaderno = 'c'; return {}; }],
    ]) {
      const { p, h } = armar(cap, { fase: 'intro' });
      ok(H.arrancarCapitulo(h, E(p)), `capítulo ${cap + 1}: arranca`);
      const extra = hace(p, h);
      const r = H.revisarHistoria(h, E(p, extra));
      ok(r.completo && h.fase === 'outro', `capítulo ${cap + 1}: con todo hecho se completa (${h.fase})`);
      const cerr = H.cerrarCapitulo(h, p.dia);
      ok(cerr && cerr.siguiente.id === H.CAPITULOS[cap + 1].id && cerr.premio, `capítulo ${cap + 1}: cierra con su premio y sigue el siguiente`);
    }
  }

  // ---------------------------------------------------------------- 7. la puerta de estación y el clima de la historia
  {
    const { p, h } = armar(4, { fase: 'intro', dia: 3 });
    const s = (extra = {}) => E(p, { estacionNatural: 'verano', estacion: 'verano', ...extra });
    ok(H.puertaDeEstacion(h, s()) && H.puertaDeEstacion(h, s()).titulo.includes('lengas'), 'en verano, a un día de cerrar el acto I: la tarjeta de la puerta');
    p.dia = 4; ok(H.diasEsperados(h, s()) === 2 && H.puertaDeEstacion(h, s()) === null, 'a los dos días ya no espera más');
    p.dia = 3; ok(H.puertaDeEstacion(h, E(p, { estacionNatural: 'otono' })) === null, 'si ya es otoño no hay puerta');
    ok(H.puertaDeEstacion(h, E(p, { estacionNatural: 'invierno' })) === null, 'ni en invierno: se arranca igual');
    const { p: p1, h: h1 } = armar(1, { fase: 'intro' }); ok(H.puertaDeEstacion(h1, E(p1, { estacionNatural: 'verano' })) === null, 'los otros capítulos no tienen puerta');
    const { p: pj, h: hj } = armar(4, { fase: 'jugando', dia: 3 });
    ok(H.puertaDeEstacion(hj, s()) === null, 'la puerta sólo vale con la tarjeta de entrada pendiente');
    // el clima: verano natural + dos días de espera: otoño forzado; antes no; y sólo en el acto II
    const f = (dia, nat, cap = 4) => { const { p: q, h: k } = armar(cap, { dia }); k.cerrados.ramal = 2; return H.estacionForzada(k, E(q, { estacionNatural: nat })); };
    ok(f(3, 'verano') === null && f(4, 'verano') === 'otono' && f(9, 'verano') === 'otono', 'el otoño de la historia, desde el segundo día de espera');
    ok(f(4, 'otono') === null && f(4, 'invierno') === null, 'si el calendario ya trae otoño o invierno, no se fuerza nada');
    ok(f(4, 'verano', 8) === null && f(4, 'verano', 0) === null, 'el acto I y el III no fuerzan nada');
    ok(f(4, 'verano', 7) === 'otono', 'el capítulo 8 sigue en otoño');
    const off = armar(4, { dia: 4 }); off.h.activa = false; ok(H.estacionForzada(off.h, E(off.p, { estacionNatural: 'verano' })) === null, 'con la historia en pausa, nada');
  }

  // ---------------------------------------------------------------- 8. los disparadores de las escenas del acto II
  {
    const base = (cap, dec = {}, horas = 10) => { const { p, h } = armar(cap, { dec, horas }); return { p, h }; };
    const quien = (h, p, extra, ctx) => D.escenaPendiente(h, E(p, extra), ctx);
    const ids = A2.ESCENAS_ACTO2_IDS;
    const EB = await import('../src/historia-escenas-acto2.js');
    ok(ids.length === 32 && new Set(ids).size === 32, 'son 32 las escenas que dispara el juego en el acto II');
    for (const id of ids) ok(EB.IDS_ACTO2.includes(id) || A2.ESCENAS_SIN_GUION.includes(id), `${id}: es una escena de B o una mecánica sin guion`);
    igual(EB.IDS_ACTO2.filter((x) => !ids.includes(x)).sort(), ['cuaderno-1', 'cuaderno-2', 'cuaderno-3', 'foto-sofia', 'mulas-belisario', 'tablas-tito'], 'las de B que no dispara el juego: el cuaderno (sale de la mesa) y tres optativas');
    const conDisp = new Set(Object.entries(A2.DISPARADORES_ACTO2).map(([k, d]) => d.escena || k));
    for (const id of ids) ok(conDisp.has(id), `${id}: tiene su disparador`);
    for (const id of conDisp) ok(ids.includes(id), `${id}: el disparador es de una escena conocida`);
    for (const [k, d] of Object.entries(A2.DISPARADORES_ACTO2)) { ok(Object.hasOwn(H.CAPITULO, d.cap) && H.CAPITULOS.indexOf(H.CAPITULO[d.cap]) >= 4 && H.CAPITULOS.indexOf(H.CAPITULO[d.cap]) < 8, `${k}: es de los capítulos 5 a 8`); for (const r of d.requiere || []) ok(ids.includes(r), `${k}: requiere una escena conocida`); }
    for (const id of Object.keys(A2.EFECTOS_ESCENA_ACTO2)) ok(ids.includes(id), `${id}: el efecto es de una escena conocida`);
    ok(D.DISPARADORES['piedras-molino'] && D.EFECTOS_ESCENA['zaino-ramon'] && D.OBJETOS.dedal, 'el acto II está juntado con el acto I');
    for (const l of A2.LUGARES_ACTO2) ok(D.LUGARES_HISTORIA.includes(l), `lugar ${l}`);
    // capítulo 5
    { const { p, h } = base(4);
      ok(quien(h, p, { lugares: { 'molino-viejo': 30 } }) === null && quien(h, p, { lugares: { 'molino-viejo': 8 } }) === 'piedras-molino', 'las piedras del molino viejo, cuando llegás');
      p.horas = 22; ok(quien(h, p, { lugares: { 'molino-viejo': 8 } }) === null, '(no de noche)'); p.horas = 10;
      vista(h, 'piedras-molino');
      ok(quien(h, p, { lugares: { puesto: 5 } }) === 'zaino-ramon' && quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === 'zaino-ramon', 'el zaino: llegar al Puesto Alto o hablarle a Ramón');
      ok(quien(h, p, { lugares: { 'molino-viejo': 20 } }) === null, 'Tito espera al molino terminado');
      ok(quien(h, p, { lugares: { 'molino-viejo': 20 }, terminadas: [{ id: 'molino-agua', x: 0, z: 0 }] }) === 'tito-coihue', 'Tito y el coihue, con el molino terminado y cerca del coihue');
      vista(h, 'zaino-ramon'); vista(h, 'tito-coihue');
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'tobias' }) === null, 'Tobías sin D2 = pirca: nada');
      h.decisiones.coihue = 'c'; p.materiales.piedra = 9; ok(quien(h, p, {}, { modo: 'hablar', clave: 'tobias' }) === null, 'Tobías con 9 piedras: nada'); p.materiales.piedra = 10; ok(quien(h, p, {}, { modo: 'hablar', clave: 'tobias' }) === 'tobias-pirca', 'Tobías con 10 piedras');
      p.materiales.piedra = 4; p.acopio.piedra = 6; ok(quien(h, p, {}, { modo: 'hablar', clave: 'tobias' }) === 'tobias-pirca', '(las del acopio cuentan)');
      ok(quien(h, p, { lugares: { 'molino-propio': 10 }, terminadas: [{ id: 'molino-agua' }] }) === null, 'la rueda gira sólo con el aserradero hecho');
      ok(quien(h, p, { lugares: { 'molino-propio': 10 }, terminadas: [{ id: 'molino-agua' }, { id: 'aserradero' }] }) === 'rueda-gira', 'la rueda gira: molino, aserradero y D2 decidida');
    }
    // capítulo 6
    { const { p, h } = base(5);
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'nicanor' }) === 'luces-lago-nicanor', 'las luces del lago: Nicanor');
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === null, 'Ercilia sin las tres cosas: nada');
      H.marcarObjeto(h, 'dedal', 6); H.marcarObjeto(h, 'pipa', 6); ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === null, 'con dos tampoco');
      H.marcarObjeto(h, 'cuchara', 6); ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === 'perdidas-devueltas', 'con las tres, a Ercilia');
      vista(h, 'perdidas-devueltas'); ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === null, '(una sola vez)');
      p.horas = 23.5; ok(quien(h, p, { lugares: { faro: 30 } }) === 'el-que-vuela' && quien(h, p, { lugares: { faro: 90 } }) === null, 'el que vuela: cerca del faro, de noche');
      p.horas = 0.7; ok(quien(h, p, { lugares: { 'molino-viejo': 10 }, sentado: false }) === null, 'la guardia pide estar sentado');
      ok(quien(h, p, { lugares: { 'molino-viejo': 10 }, sentado: true }) === 'guardia-molino', 'la guardia: sentado junto al coihue a las 0:40');
      ok(quien(h, p, { lugares: { 'molino-viejo': 40 }, sentado: true }) === null, '(no lejos)'); p.horas = 3; ok(quien(h, p, { lugares: { 'molino-viejo': 10 }, sentado: true }) === null, '(no a las 3)');
      p.horas = 7; ok(quien(h, p, { lugares: { 'molino-viejo': 10 } }) === null && quien(h, p, { lugares: { 'raiz-ramon': 5 } }) === null, 'las huellas y la raíz de Ramón piden haber hecho la guardia'); vista(h, 'guardia-molino');
      ok(quien(h, p, { lugares: { 'molino-viejo': 10 } }) === 'huellas-escarcha' && quien(h, p, { lugares: { 'molino-viejo': 60 } }) === null, 'las huellas de la escarcha: a la mañana, junto al molino');
      p.horas = 9.5; ok(quien(h, p, { lugares: { 'molino-viejo': 10 } }) === null, '(no tan tarde)'); p.horas = 7;
      ok(quien(h, p, { lugares: { 'raiz-ramon': 5 } }) === 'ramon-raiz' && quien(h, p, { lugares: { 'raiz-ramon': 50 } }) === null, 'Ramón en la raíz: a la mañana, siguiendo las huellas');
      vista(h, 'ramon-raiz'); ok(quien(h, p, { lugares: { 'molino-viejo': 10 } }) === null, 'visto Ramón, las huellas ya no hacen falta');
      const { p: p2, h: h2 } = base(5, { bolsa: 'b' }); ok(quien(h2, p2, {}, { modo: 'hablar', clave: 'panadera' }) === 'masa-crece', 'la masa que crece sola: sólo con D1 = b'); const { p: p3, h: h3 } = base(5, { bolsa: 'a' }); ok(quien(h3, p3, {}, { modo: 'hablar', clave: 'panadera' }) === null, '(con otra decisión, no)');
    }
    // capítulo 7
    { const { p, h } = base(6, {}, 10); h.base = { dia: 6, molido: 0, cocinadas: 0 };
      ok(quien(h, p, { lugares: { 'molino-propio': 5 } }) === null, 'la primera molienda pide diez medidas'); h.molido = 10;
      ok(quien(h, p, { lugares: { 'molino-propio': 5 } }) === 'primera-molienda' && quien(h, p, { lugares: { 'molino-propio': 80 } }) === null, 'la primera molienda: diez medidas y cerca del molino');
      vista(h, 'primera-molienda');
      ok(quien(h, p, { lugares: { plaza: 10 } }) === null, 'la minga pide haber cocinado'); p.cocina.hechas['pan-casero'] = 1; h.base.cocinadas = 0;
      ok(quien(h, p, { lugares: { plaza: 10 } }) === 'minga-aldea', 'la minga: algo cocinado, en la plaza, de día'); p.horas = 20; ok(quien(h, p, { lugares: { plaza: 10 } }) === null, '(no de noche)'); p.horas = 10;
      ok(quien(h, p, { lugares: { 'galpon-propio': 5 } }) === null, 'el galpón en ronda pide la minga'); vista(h, 'minga-aldea', 6); p.horas = 6.5;
      ok(quien(h, p, { lugares: { 'galpon-propio': 5 } }) === null, '… y esperar al otro día'); p.dia = 7;
      ok(quien(h, p, { lugares: { 'galpon-propio': 5 } }) === 'galpon-ronda', 'el galpón en ronda: al amanecer siguiente a la minga, en tu galpón');
      p.horas = 15; ok(quien(h, p, { lugares: { 'galpon-propio': 5 } }) === null, '(no a la tarde)');
      h.decisiones.molienda = 'b'; p.cosas.harina = 5; ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === null, 'el fiado: con 5 medidas no alcanza'); p.cosas.harina = 6;
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === 'molienda-fiado', 'el fiado: seis medidas');
      h.decisiones.molienda = 'c'; p.cosas.harina = 3; ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === 'harina-ercilia-c', 'partida: tres medidas a Ercilia (mecánica sin guion)');
      H.marcarEntrega(h, 'ercilia', 'harina-3', 7); ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === null, '(ya entregadas)');
      ok(quien(h, p, {}, { modo: 'interaccion', clave: 'raiz-molienda' }) === null, 'partida: la raíz pide los dos fletes'); h.fletesHarina = 2; ok(quien(h, p, {}, { modo: 'interaccion', clave: 'raiz-molienda' }) === 'molienda-partir', 'partida: una medida a la raíz, ya hechos los fletes y las tres del almacén'); p.cosas.harina = 1; p.cosas.harina = 0; ok(quien(h, p, {}, { modo: 'interaccion', clave: 'raiz-molienda' }) === null, '(sin harina, no)');
    }
    // capítulo 8
    { const { p, h } = base(7, {}, 18);
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === 'libreta-fiado' && quien(h, p, {}, { modo: 'hablar', clave: 'ema' }) === 'cuaderno-abuelo' && quien(h, p, {}, { modo: 'hablar', clave: 'belisario' }) === 'los-del-cerro', 'la libreta, el cuaderno del abuelo y los del cerro');
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === 'secreto-ramon', 'Ramón al atardecer'); p.horas = 12; ok(quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === null, '(no a mediodía)'); p.horas = 18;
      h.lazos.ramon = -1; ok(quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === null, '(ni con el lazo de Ramón por el piso)'); h.lazos.ramon = 0;
      p.horas = 21; ok(quien(h, p, { lugares: { plaza: 10 } }) === null, 'el fogón pide las dos escenas de los cuadernos'); vista(h, 'libreta-fiado'); vista(h, 'cuaderno-abuelo');
      ok(quien(h, p, { lugares: { plaza: 10 } }) === 'fogon-leyenda' && quien(h, p, { lugares: { plaza: 90 } }) === null, 'el fogón: de noche, en la plaza'); p.horas = 12; ok(quien(h, p, { lugares: { plaza: 10 } }) === null, '(no de día)');
    }
    // una escena de otro capítulo no sale
    { const { p, h } = base(0); p.horas = 0.7; ok(quien(h, p, { lugares: { 'molino-viejo': 10 }, sentado: true }) !== 'guardia-molino', 'las escenas del acto II no salen en el capítulo 1'); }
  }

  // ---------------------------------------------------------------- 9. lo que cambia al ver las escenas
  {
    const { p, h } = armar(4); h.prestado = H.historiaNueva().prestado;
    const llamadas = [];
    const ctx = { dar: (c, k) => llamadas.push(['dar', c, k]), gastar: (c, k) => llamadas.push(['gastar', c, k]), tieneCaballo: () => false };
    vista(h, 'zaino-ramon'); D.aplicarVistas(h, 6, ctx);
    ok(h.prestado.zaino === true && h.temas['ramon:zaino'] > 0 && llamadas.length === 1 && llamadas[0].join() === 'dar,caballo,1', 'el zaino: queda prestado y se da el caballo');
    D.aplicarVistas(h, 6, ctx); ok(llamadas.length === 1, 'una sola vez');
    const h2 = H.historiaNueva(); h2.activa = true; vista(h2, 'zaino-ramon'); D.aplicarVistas(h2, 6, { ...ctx, tieneCaballo: () => true }); ok(!llamadas.some((l, i) => i > 0), 'si ya tenías caballo, no te dan otro');
    vista(h, 'tobias-pirca'); D.aplicarVistas(h, 6, ctx);
    ok(h.objetos.pirca > 0 && h.entregados['tobias:piedra'] > 0 && llamadas.some((l) => l.join() === 'gastar,piedra,10'), 'Tobías: se gastan diez piedras y queda la pirca');
    h.decisiones.molienda = 'b'; vista(h, 'molienda-fiado'); D.aplicarVistas(h, 7, ctx);
    ok(h.entregados['ercilia:harina'] > 0 && llamadas.some((l) => l.join() === 'gastar,harina,6'), 'el fiado: seis medidas');
    h.decisiones.molienda = 'c'; vista(h, 'harina-ercilia-c'); D.aplicarVistas(h, 7, ctx);
    ok(h.entregados['ercilia:harina-3'] > 0 && llamadas.some((l) => l.join() === 'gastar,harina,3'), 'partida: tres medidas');
    vista(h, 'molienda-partir'); D.aplicarVistas(h, 7, ctx);
    ok(h.entregados['raiz:harina'] > 0 && llamadas.some((l) => l.join() === 'gastar,harina,1') && h.duendes.convidado === 1, 'la raíz: una medida, y cuenta como convidado');
    vista(h, 'perdidas-devueltas'); D.aplicarVistas(h, 7, ctx);
    ok(h.entregados['ercilia:dedal'] && h.entregados['belisario:pipa'] && h.entregados['panadera:cuchara'], 'las tres cosas devueltas');
    for (const id of ['luces-lago-nicanor', 'libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro', 'secreto-ramon', 'piedras-molino', 'tito-coihue', 'rueda-gira']) vista(h, id);
    D.aplicarVistas(h, 7, ctx);
    for (const t of ['nicanor:luces', 'ercilia:cuaderno', 'ema:cuaderno', 'belisario:cerro', 'ramon:ceniza', 'ema:piedras', 'tito:coihue', 'ema:rueda']) ok(h.temas[t] > 0, `tema ${t}`);
    for (const id of Object.keys(A2.NOTAS_ESCENA_ACTO2)) ok(A2.NOTAS_ESCENA_ACTO2[id].length === 2 && id in A2.EFECTOS_ESCENA_ACTO2, `${id}: su aviso es de una escena con efecto`);
    // el coihue talado
    const t = H.historiaNueva(); t.activa = true; t.decisiones.coihue = 'a';
    A2.alTalarCoihue(t, 7); ok(t.temas['mundo:coihue-talado'] > 0 && t.decisiones.coihue === 'b' && t.lazos.ema === -2, 'talar el coihue grande: queda marcado, pasa a «talarlo» y Josefina −2');
    A2.alTalarCoihue(t, 7); ok(t.lazos.ema === -2, 'una sola vez');
    const t2 = H.historiaNueva(); t2.activa = true; t2.decisiones.coihue = 'b'; A2.alTalarCoihue(t2, 7); ok(t2.lazos.ema === 0, 'si ya lo habías decidido así, Josefina no lo toma peor');
    const t3 = H.historiaNueva(); t3.activa = true; A2.alTalarCoihue(t3, 7); ok(t3.decisiones.coihue === 'b' && t3.lazos.ema === -2, 'talarlo sin haber decidido: también');
    // sanear: lo nuevo que se guarda
    const g = H.sanearHistoria(JSON.parse(JSON.stringify({ ...h, acompanante: 'tobias', prestado: { zaino: true, constructor: true }, fletesHarina: 99, fletesBase: -3 })));
    ok(g.acompanante === 'tobias' && g.prestado.zaino === true && g.fletesHarina === 9 && g.fletesBase === 0, 'se guarda: el acompañante, lo prestado y la cuenta de fletes (acotada)');
    ok(H.sanearHistoria({ acompanante: 'cualquiera' }).acompanante === null && H.sanearHistoria({}).fletesBase === null, 'y con basura, los valores de siempre');
    igual(H.sanearHistoria(JSON.parse(JSON.stringify(g))), g, 'ida y vuelta por JSON');
  }

  // ---------------------------------------------------------------- 10. los objetos del mundo del acto II
  {
    const vis = (h, p, extra) => D.objetosVisibles(h, E(p, extra)).sort();
    { const { p, h } = armar(5); h.base = { dia: 6 };
      ok(vis(h, p).includes('dedal') && vis(h, p).includes('pipa') && vis(h, p).includes('cuchara') && vis(h, p).includes('puertitas-raiz'), 'capítulo 6: las tres cosas perdidas a la vista (y las puertitas del coihue)');
      H.marcarObjeto(h, 'dedal', 6); ok(!vis(h, p).includes('dedal') && vis(h, p).includes('pipa'), 'el dedal levantado ya no está');
      const a = D.accionDeObjeto('pipa', h, E(p)); ok(a.tipo === 'marca' && a.marca === 'pipa' && /pipa/i.test(a.aviso), 'la E sobre la pipa la levanta');
      ok(!vis(h, p).includes('huellas') && !vis(h, p).includes('yerba-raiz'), 'las huellas esperan la guardia'); vista(h, 'guardia-molino'); p.horas = 6.2;
      ok(vis(h, p).includes('huellas') && vis(h, p).includes('yerba-raiz'), 'a la mañana, las huellas y la yerba'); p.horas = 13; ok(!vis(h, p).includes('huellas'), 'a mediodía la escarcha ya no está'); p.horas = 6.2; vista(h, 'ramon-raiz'); ok(!vis(h, p).includes('huellas') && !vis(h, p).includes('yerba-raiz'), 'seguidas, se apagan');
    }
    { const { p, h } = armar(6, { dec: { molienda: 'c' } }); h.base = { dia: 6 };
      ok(!vis(h, p).includes('ronda-harina'), 'el galpón en ronda espera la minga'); vista(h, 'minga-aldea', 6); p.dia = 6; ok(!vis(h, p).includes('ronda-harina'), '… y el día siguiente'); p.dia = 7;
      ok(vis(h, p).includes('ronda-harina') && vis(h, p).includes('cuaderno-pozo'), 'al día siguiente: la ronda de harina y el cuaderno en el pozo');
      const a = D.accionDeObjeto('cuaderno-pozo', h, E(p)); ok(a.marca === 'cuaderno-eusebio', 'agarrar el cuaderno'); H.marcarObjeto(h, 'cuaderno-eusebio', 7);
      ok(vis(h, p).includes('ronda-harina') && !vis(h, p).includes('cuaderno-pozo'), 'sin el cuaderno, la ronda queda');
      ok(vis(h, p).includes('raiz-molienda') && D.accionDeObjeto('raiz-molienda', h, E(p)).tipo === 'escena', 'partida: la raíz espera la medida de harina');
      H.marcarEntrega(h, 'raiz', 'harina', 7); ok(!vis(h, p).includes('raiz-molienda'), '(entregada, se apaga)');
    }
    { const { p, h } = armar(7); H.marcarTema(h, 'mundo', 'x', 1);
      vista(h, 'nota-eusebio'); ok(vis(h, p).includes('cuaderno-mesa') && !vis(h, p).includes('nota-mesa'), 'capítulo 8: el cuaderno en la mesa tapa a la nota');
      ok(D.accionDeObjeto('cuaderno-mesa', h, E(p)).aviso === 'Leer el cuaderno de Eusebio (página 1 de 3)', 'la E lo dice con la página');
      for (let i = 0; i < 3; i++) A2.leerPagina(h, E(p), 7);
      ok(!vis(h, p).includes('cuaderno-mesa') && vis(h, p).includes('nota-mesa'), 'leídas las tres páginas, vuelve la nota de siempre');
    }
    { const { p, h } = armar(4, { dec: { coihue: 'c' } }); h.base = { dia: 6 };
      ok(!vis(h, p).includes('raiz-pirca') && !vis(h, p).includes('pirca'), 'la pirca espera a Tobías'); H.marcarEntrega(h, 'tobias', 'piedra', 6);
      const a = D.accionDeObjeto('raiz-pirca', h, E(p)); ok(vis(h, p).includes('raiz-pirca') && a.marca === 'pirca' && a.limpiaAcompanante === true, 'con las piedras entregadas, la E en la raíz levanta la pirca (y Tobías vuelve a su cantera)');
      H.marcarObjeto(h, 'pirca', 6); ok(vis(h, p).includes('pirca') && !vis(h, p).includes('raiz-pirca'), 'levantada, se ve y la raíz se apaga');
    }
    { const { p, h } = armar(3); h.base = { dia: 4 }; H.marcarTema(h, 'mundo', 'pinones-en-tocon', 3); H.marcarTema(h, 'mundo', 'cuchara-en-techo', 3);
      const { p: p2, h: h2 } = armar(2); H.marcarTema(h2, 'mundo', 'pinones-en-tocon', 3); H.marcarTema(h2, 'mundo', 'cuchara-en-techo', 3);
      ok(vis(h2, p2).includes('pinones') && vis(h2, p2).includes('cuchara-techo'), 'los piñones en el tocón y la cuchara en el techo ya se dibujan (antes sólo dejaban una marca)');
      ok(D.accionDeObjeto('pinones', h2, E(p2)).marca === 'pinones', 'los piñones se juntan con la E');
      const { p: p3, h: h3 } = armar(3); H.marcarTema(h3, 'mundo', 'puertita-a-la-noche', 3); p3.horas = 22;
      ok(vis(h3, p3).includes('puertita-noche') && D.accionDeObjeto('puertita-noche', h3, E(p3)).raro === 'puertita-noche', 'la puertita apoyada en tu puerta de noche (y anota lo raro al levantarla)'); p3.horas = 12; ok(!vis(h3, p3).includes('puertita-noche'), 'de día no está');
      void p; void h;
    }
    { const { p, h } = armar(4); ok(vis(h, p).includes('muelas-rotas'), 'capítulo 5: las muelas rotas del molino viejo se dibujan');
      const { p: p2, h: h2 } = armar(6); h2.base = { dia: 6, molido: 0 }; h2.molido = 10; ok(vis(h2, p2).includes('diez-bolsas'), 'capítulo 7: las diez bolsas junto al molino'); h2.decisiones.molienda = 'a'; ok(!vis(h2, p2).includes('diez-bolsas'), '(decidida la molienda, se van)');
      const { p: p3, h: h3 } = armar(7, { horas: 22 }); vista(h3, 'fogon-leyenda'); ok(vis(h3, p3).includes('pluma-umbral') && D.accionDeObjeto('pluma-umbral', h3, E(p3)).marca === 'pluma-condor', 'capítulo 8: la pluma de cóndor en el umbral, de noche, después del fogón'); p3.horas = 12; ok(!vis(h3, p3).includes('pluma-umbral'), '(de día no)'); }
    ok(Object.values(D.OBJETOS).every((o) => o.visible), 'todos los objetos dicen cuándo se ven');
  }

  // ---------------------------------------------------------------- 11. el acompañante
  {
    const { puntoDeSeguimiento: pto, decidirPaso: paso } = AC;
    const q = pto({ x: 10, z: 10 }, 0); ok(Math.abs(Math.hypot(q.x - 10, q.z - 10) - Math.hypot(AC.DIST_ATRAS, AC.DIST_LADO)) < 1e-9 && q.z > 10, 'el punto de seguimiento queda detrás de vos (mirando hacia −z, detrás es +z)');
    const q2 = pto({ x: 0, z: 0 }, Math.PI / 2); ok(q2.x > 2 && Math.abs(q2.z) < 1.5, 'y se gira con vos');
    igual([1, 3.4, 5, 15, 30, 42, 100].map((d) => paso(d).accion), ['quieto', 'quieto', 'caminar', 'apurar', 'correr', 'aparecer', 'aparecer'], 'cuándo se queda, camina, apura, corre y aparece');
    ok(paso(5).velocidad < paso(10).velocidad && paso(10).velocidad < paso(30).velocidad && paso(NaN).accion === 'aparecer', 'cada vez más rápido; sin dato, aparece');
    ok(AC.acompananteActual({ activa: true, acompanante: 'tobias' }) === 'tobias' && AC.acompananteActual({ activa: false, acompanante: 'tobias' }) === null && AC.acompananteActual({ activa: true, acompanante: null }) === null, 'sólo con la historia en curso');
    // una persona de mentira
    const npc = { pos: { x: 100, y: 0, z: 100, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, camino: null, velocidad: 0.8, conVos: false, enCita: false, sinFrenar: false, dormido: false, rumboObjetivo: 0 };
    const jug = { pos: { x: 0, y: 0, z: 0 }, yaw: 0 };
    const h = { activa: true, acompanante: 'tobias' }; let tomada = false, vehiculo = false;
    const ac = AC.crearAcompanante({ historia: () => h, jugador: () => jug, npcDe: (k) => (k === 'tobias' ? npc : null), altura: () => 0, tomada: () => tomada, enVehiculo: () => vehiculo });
    ac.actualizar(1);
    ok(npc.conVos === true && npc.sinFrenar === true && Math.hypot(npc.pos.x, npc.pos.z) < 5, 'lejos (a 140 m): aparece a tu lado y ya es tu acompañante');
    npc.pos.set(0, 0, 9); ac.actualizar(1);
    ok(Array.isArray(npc.camino) && npc.camino.length === 1 && npc.velocidad > 1.5, 'a 9 m: camina hacia el punto detrás de vos, apurado');
    npc.pos.set(0, 0, 2.5); ac.actualizar(1); ok(npc.camino.length === 0, 'cerca: se queda quieto');
    tomada = true; npc.pos.set(0, 0, 9); npc.camino = []; ac.actualizar(1); ok(npc.camino.length === 0, 'con una escena en marcha, no se mueve'); tomada = false;
    vehiculo = true; ac.actualizar(1); ok(npc.dormido === true && ac.esperando(), 'en el tren o el kayak, no se ve');
    vehiculo = false; jug.pos.x = 300; ac.actualizar(1); ok(npc.dormido === false && Math.hypot(npc.pos.x - 300, npc.pos.z) < 5, 'al bajar, aparece a tu lado');
    h.acompanante = null; ac.actualizar(1); ok(npc.conVos === false && npc.camino === null && npc.sinFrenar === false, 'al soltarlo, vuelve a lo suyo (su ruta)');
    ok(!/from 'three'|document\.|window\./.test(leer('src/historia-acompanante.js')), 'el módulo no toca three ni el DOM');
  }

  // ---------------------------------------------------------------- 12. los efectos y condiciones nuevos
  {
    ok(U.parsearEfecto('quitar:harina:6')?.tipo === 'quitar' && U.parsearEfecto('quitar:harina:0') === null && U.parsearEfecto('prestado:zaino')?.id === 'zaino', 'quitar:<cosa>:<n> y prestado:<id>');
    ok(U.CONDICIONES_HISTORIA.includes('presente') && U.TIPOS_EFECTO.includes('quitar'), 'las claves nuevas figuran en la convención');
    const registro = { efectos: {}, conds: {}, registrarEfecto(nm, f) { this.efectos[nm] = f; }, registrarCondicion(nm, f) { this.conds[nm] = f; } };
    const { p, h } = armar(4); const quitados = [];
    X.registrarEfectosHistoria(registro, { historia: () => h, dia: () => 6, estado: () => E(p, { }), opcionDeEvento: () => null });
    X.registrarEfectosActo1(registro, { historia: () => h, dia: () => 6, quitar: (c, k) => quitados.push([c, k]) }, ['quitar:piedra:10', 'prestado:zaino', 'prestado:inventado']);
    registro.efectos['quitar:piedra:10']({}, { escena: 'x' }); registro.efectos['quitar:piedra:10']({}, { escena: 'x' });
    ok(quitados.length === 1 && quitados[0].join() === 'piedra,10', 'quitar: una sola vez por escena');
    h.prestado = H.historiaNueva().prestado; registro.efectos['prestado:zaino']({}, {}); ok(h.prestado.zaino === true, 'prestado: anota lo prestado');
    registro.efectos['acompanante']({ quien: 'tobias' }); ok(h.acompanante === 'tobias', 'el acompañante puede ser Tobías'); registro.efectos['acompanante']({ quien: 'cualquiera' }); ok(h.acompanante === null, '(y no cualquiera)');
    p.aldea.pobladores = [{ clave: 'panadera' }];
    ok(registro.conds.presente({ args: { quien: 'rosa' } }) === true && registro.conds.presente({ args: { quien: 'tito' } }) === false && registro.conds.presente({ args: {} }) === false, 'presente: Rosa es la panadera de la aldea');
    p.aldea.pobladores = []; ok(registro.conds.presente({ args: { quien: 'rosa' } }) === false, 'y sin ella en la aldea, no');
  }

  // ---------------------------------------------------------------- 13. el enganche con el juego (por texto)
  {
    const main = leer('src/main.js');
    for (const frag of [
      "import { ESCENAS_ACTO2, EFECTOS_ACTO2 } from './historia-escenas-acto2.js';",
      "import { crearAcompanante } from './historia-acompanante.js';",
      '...Object.values(ESCENAS_ACTO2)',
      '...new Set([...EFECTOS_ACTO1, ...EFECTOS_ACTO2])',
      'conClimaDeHistoria({ oto, inv })',
      "valle?.estacionForzada?.() === 'otono'",
      'estacionNatural: estacionNaturalDeHistoria()',
      'valle.aceleracion?.() || 1',
      'valle?.coihueTalado?.()',
      'valle?.harinaMolida?.(r.harina)',
      'const GOLPES_COIHUE = 6;',
      'arbol.grande === true',
      'molinoViejoHist.arbol.grande = true;',
      "acompananteDeHistoria()?.actualizar(dt);",
      "obraPunto('molino-propio', 'molino-agua')", "obraPunto('galpon-propio', 'galponcito')", "ponr('raiz-ramon'",
      'colocar: (c) => colocarParaEscena(c)', 'levantar: () =>',
      'puntos: () => puntosCacheadosDeHistoria()',
      'permitirVehiculo: (si) => { escenaDesdeVehiculo = !!si; }', 'escenaDesdeVehiculo || (!js.enKayak && !js.enVela)', 'function efectoDuendesActo2(id, args) {', "obraPunto('aserradero-propio', 'aserradero')",
    ]) ok(main.includes(frag.replace('obraPunto(\'molino-propio\'', 'obraPunto(\'molino-propio\'')), `main.js: ${frag.slice(0, 70)}`);
    ok(main.includes('const hacen = golpesParaTalarAhora();') && main.includes('const escala = js.sentado && !durmiendo'), 'las líneas de siempre del hachazo y del reloj sentado siguen como estaban (otras pruebas las leen)');
    ok(/let talaGrande = false;[\s\S]*golpesParaTalarAhora = \(\) => \(talaGrande \? GOLPES_COIHUE/.test(main), 'el coihue grande lleva seis hachazos sin importar el oficio ni el filo');
    ok(main.indexOf('const { oto, inv } = estacionObjetivo();') > 0 && main.indexOf('function estacionObjetivo() {') > 0, 'estacionObjetivo sigue siendo la cuenta de siempre (el clima de la historia se aplica aparte)');
    const ui = leer('src/historia-ui.js');
    for (const frag of ['puertaDeEstacion(h, s)', 'mostrarPuerta(pu)', 'premioDeCapitulo(c, h)', 'aceleracionDeEspera(h, s)', 'estacionForzada(h, s)', 'leerPagina(h, estado(), p.dia)', 'alTalarCoihue(h, ctx.progreso().dia)', 'ESCENAS_DESDE_SENTADO.includes(id)', 'COLOCACION_ESCENA[id]', 'NOTAS_ESCENA_ACTO2', 'limpiaAcompanante']) ok(ui.includes(frag.replace('limpiaAcompanante', 'a.limpiaAcompanante')), `historia-ui.js: ${frag}`);
    ok(/aceleracion: \(\) => aceleracion, estacionForzada: \(\) => forzada, coihueTalado, harinaMolida/.test(ui), 'historia-ui.js: lo que usa main.js');
    for (const f of ['src/historia-disparadores-acto2.js', 'src/historia-acompanante.js']) {
      const t = leer(f);
      ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
      for (const m of t.matchAll(/^export\s+(?:const|function)\s+([^\s(=,]+)/gm)) ok(!/ñ/i.test(m[1]), `${f}: ${m[1]} sin eñe`);
      for (const m of t.matchAll(/^import .+$/gm)) ok(/^import \{ [^}]+ \} from '\.\/[a-z0-9-]+\.js';$/.test(m[0]), `${f}: import en una línea`);
      ok(!/\r/.test(t) && !/export \{|export \* from/.test(t), `${f}: LF y sin re-exportar`);
      ok(!/ (?:the|you|your|with|and|of) /i.test(t.split('\n').filter((l) => /^\s*(?:'|\{ id:)/.test(l) && /«|»|[áéíóú]/.test(l)).join('\n')), `${f}: los textos van en castellano`);
    }
    for (const t of Object.values(A2.PAGINAS_CUADERNO).flat().concat(...Object.values(A2.NOTAS_ESCENA_ACTO2))) ok(!/[ÃÂ]/.test(t) && !/ofrenda|dios|santo|sagrad/i.test(t), 'páginas y avisos: sin mojibake ni palabras religiosas');
    // el hueco del acto II (lo reemplaza el archivo de B al juntar) tiene la forma que main.js espera
    const E2 = await import('../src/historia-escenas-acto2.js');
    ok(typeof E2.ESCENAS_ACTO2 === 'object' && Array.isArray(E2.EFECTOS_ACTO2), 'ESCENAS_ACTO2 (id → escena) y EFECTOS_ACTO2 (lista de nombres) existen');
    const T2 = await import('../src/historia-texto-acto2.js');
    ok(T2.TEXTO_ACTO2 && typeof T2.TEXTO_ACTO2.raro === 'object', 'TEXTO_ACTO2.raro existe');
  }
  return fallas - f0;
}

const base = await chequear();
ok(base === 0, 'el código de verdad pasa todo');

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['historia.js', "export const DISTANCIA_ASERRADERO = 25;", "export const DISTANCIA_ASERRADERO = 250;", 'el aserradero «lejos» a 250 m'],
  ['historia.js', "if (d === 'a') return ase && s.aserradero.lejos;", "if (d === 'a') return ase;", 'D2 = A no mira la distancia'],
  ['historia.js', "if (d === 'b') return ase && s.temas.has('mundo:coihue-talado');", "if (d === 'b') return ase;", 'D2 = B sin talar'],
  ['historia.js', "if (d === 'c') return ase && s.objetos.has('pirca');", "if (d === 'c') return ase;", 'D2 = C sin pirca'],
  ['historia.js', "if (d === 'b') return s.entregados.has('ercilia:harina') || s.escenas.has('molienda-fiado');", "if (d === 'b') return true;", 'D3 = B sin entregar'],
  ['historia.js', "if (d === 'c') return s.fletesHarina >= 2 && s.entregados.has('ercilia:harina-3') && (s.entregados.has('raiz:harina') || s.escenas.has('molienda-partir'));", "if (d === 'c') return s.fletesHarina >= 2;", 'D3 = C sin la raíz ni el almacén'],
  ['historia.js', "if (d === 'a') return s.fletesHarina >= 3;", "if (d === 'a') return s.fletesHarina >= 1;", 'D3 = A con un solo flete'],
  ['historia.js', "  if (diasEsperados(h, s) >= c.puerta.tope) return null;", "", 'la puerta de estación espera para siempre'],
  ['historia.js', "  return diasEsperados(h, s) >= (CAPITULOS[4].puerta?.tope ?? 2) ? 'otono' : null;", "  return null;", 'la historia nunca trae su otoño'],
  ['historia.js', "  if (s.estacionNatural !== 'verano') return null;\n  return diasEsperados", "  return diasEsperados", 'fuerza el otoño aun con invierno'],
  ['historia.js', "if (!h?.activa || h.fase === 'fin' || !s || capituloActual(h).acto !== 2) return null;", "if (!h?.activa || h.fase === 'fin' || !s) return null;", 'fuerza el otoño en cualquier acto'],
  ['historia.js', "  r.texto = `${base.texto}. Y además: ${x.texto}`;", "  r.texto = base.texto;", 'el premio no suma lo decidido'],
  ['historia.js', "for (const [k, n] of Object.entries(x.materiales || {})) r.materiales[k] = (r.materiales[k] || 0) + n;", "", 'el premio no suma la leña'],
  ['historia.js', "    if (h.fletesBase === null || h.fletesBase === undefined) h.fletesBase = previas;", "    if (h.fletesBase === null || h.fletesBase === undefined) h.fletesBase = 0;", 'los fletes de antes cuentan para la molienda'],
  ['historia.js', "if (dm === 'a' || dm === 'c') {", "if (dm === 'a') {", 'la molienda partida no cuenta fletes'],
  ['historia.js', "export const CONTADORES_HISTORIA = ['anotaciones', 'dia', 'talados', 'peces', 'aceptados', 'encargosHechos', 'entregas', 'cosechas', 'visitas', 'cuentos', 'molido', 'cocinadas'];", "export const CONTADORES_HISTORIA = ['anotaciones', 'dia', 'talados', 'peces', 'aceptados', 'encargosHechos', 'entregas', 'cosechas', 'visitas', 'cuentos'];", 'lo molido no se cuenta desde que empieza el capítulo'],
  ['historia.js', "(s) => (s.enKayak || s.enVela) && Number(s.lugares?.faro) <= 40 && enHora(s.horas, 23, 1)", "(s) => Number(s.lugares?.faro) <= 40", 'el faro sin kayak ni noche'],
  ['historia.js', "(s.lazos.ramon < 0 && enHora(s.horas, 17, 20) && Number(s.lugares?.puesto) <= 30)", "false", 'con Ramón enojado el capítulo se traba'],
  ['historia.js', "export const ACOMPANANTES = [...PERSONAS_LAZO, 'tobias'];", "export const ACOMPANANTES = [...PERSONAS_LAZO];", 'Tobías no puede acompañar'],
  ['historia.js', "export const PRESTADOS = ['herrero', 'apicultor', 'maquinista', 'guarda', 'tobias', 'zaino'];", "export const PRESTADOS = ['herrero', 'apicultor', 'maquinista', 'guarda', 'tobias'];", 'el zaino no se puede prestar'],
  ['historia-disparadores-acto2.js', "'guardia-molino': { cap: 'perdido', modo: 'auto', lugar: en('molino-viejo', 22), hora: [0.5, 2.5], cond: (s) => s.sentado },", "'guardia-molino': { cap: 'perdido', modo: 'auto', lugar: en('molino-viejo', 22), hora: [0.5, 2.5] },", 'la guardia sin estar sentado'],
  ['historia-disparadores-acto2.js', "hora: [0.5, 2.5], cond: (s) => s.sentado }", "hora: [0, 24], cond: (s) => s.sentado }", 'la guardia a cualquier hora'],
  ['historia-disparadores-acto2.js', "export const HARINA_DE_ENTREGA = { b: 6, c: 3 };", "export const HARINA_DE_ENTREGA = { b: 1, c: 1 };", 'el fiado cuesta una medida'],
  ['historia-disparadores-acto2.js', "cond: (s, h) => s.dia > diaVista(h, 'minga-aldea') },", "cond: () => true },", 'el galpón en ronda el mismo día de la minga'],
  ['historia-disparadores-acto2.js', "const rondaVisible = (s, h) => cosecha7(h) && s.escenas.has('minga-aldea') && (s.dia > diaVista(h, 'minga-aldea') || s.escenas.has('galpon-ronda'));", "const rondaVisible = (s, h) => cosecha7(h);", 'la ronda de harina se ve antes de la minga'],
  ['historia-disparadores-acto2.js', "  marcarTema(h, 'cuaderno', String(n), dia);\n", "", 'leer una página no la marca'],
  ['historia-disparadores-acto2.js', "    if (!Object.hasOwn(h.aplicadas, 'lazo-coihue-talado')) {", "    if (true) {", 'cada hachazo al tocón baja el lazo de Josefina'],
  ['historia-disparadores-acto2.js', "if (!ctx?.tieneCaballo?.()) ctx?.dar?.('caballo', 1);", "ctx?.dar?.('caballo', 1);", 'te dan otro caballo si ya tenías'],
  ['historia-disparadores-acto2.js', "ctx?.gastar?.('piedra', 10);", "", 'las piedras de Tobías no se gastan'],
  ['historia-disparadores-acto2.js', "'tobias-pirca': { cap: 'rueda', modo: 'hablar', clave: 'tobias', cond: (s) => s.decisiones.coihue === 'c' && s.piedra >= 10 && !s.entregados.has('tobias:piedra') },", "'tobias-pirca': { cap: 'rueda', modo: 'hablar', clave: 'tobias', cond: (s) => s.decisiones.coihue === 'c' && !s.entregados.has('tobias:piedra') },", 'Tobías sin pedir las diez piedras'],
  ['historia-acompanante.js', "export const DIST_TELETRANSPORTE = 42;", "export const DIST_TELETRANSPORTE = 4200;", 'el acompañante nunca aparece a tu lado'],
  ['historia-acompanante.js', "const fx = -Math.sin(yaw), fz = -Math.cos(yaw);", "const fx = Math.sin(yaw), fz = Math.cos(yaw);", 'el acompañante se pone adelante'],
  ['historia-acompanante.js', "    if (ctx.tomada?.()) return;   // una escena lo está usando", "", 'el acompañante se mueve durante una escena'],
  ['historia-acompanante.js', "    npc.camino = g.camino === undefined ? [] : g.camino;", "    npc.camino = [];", 'al soltarlo no vuelve a su ruta'],
  ['historia-escenas-efectos.js', "case 'quitar': if (una(h, clave(c))) ctx.quitar?.(p.cosa, p.n); break;", "case 'quitar': ctx.quitar?.(p.cosa, p.n); break;", 'quitar no es idempotente'],
  ['historia-escenas-efectos.js', "const clave = q === 'rosa' ? 'panadera' : q;", "const clave = q;", 'Rosa no es la panadera'],
];
let atrapadas = 0;
for (const [archivo, de, a, que] of MUT) {
  const orig = leer(`src/${archivo}`);
  if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
  const sufijo = '.mut';
  const dest = join(raiz, 'src', archivo.replace('.js', `${sufijo}.js`));
  writeFileSync(dest, orig.replace(de, () => a));
  const destD = join(raiz, 'src', 'historia-disparadores.mut.js');
  if (archivo === 'historia-disparadores-acto2.js') writeFileSync(destD, leer('src/historia-disparadores.js').replace("'./historia-disparadores-acto2.js'", "'./historia-disparadores-acto2.mut.js'"));
  const antes = fallas, antesN = n;
  callado = true;
  try {
    const r = await chequear(archivo, sufijo);
    if (r > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
  } catch { atrapadas++; }
  finally { rmSync(dest, { force: true }); rmSync(destD, { force: true }); callado = false; }
  fallas = antes; n = antesN;
}
ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.16.0 Historia nueva, acto II (mecánica) · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
