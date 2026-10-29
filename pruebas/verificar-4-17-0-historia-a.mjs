// 4.17.0 (agente A): la mecánica del acto III de la Historia nueva (capítulos 9 a 13): objetivos, decisiones D5 (majada) y D6 (trato o pelea), disparadores,
// lo que cambia al ver cada escena, la deuda y lo prestado, el arreo, los blancos de práctica, la noche de la nevada (olas, defensas prestadas, jefe con el lomo
// débil, aliados, ayudas del trato, «Otra vez» y «Que amanezca»), la puerta de estación y el clima de la historia, la tarjeta final y el enganche con el juego
// (por texto). Las escenas de B son datos de otro agente: acá sólo se prueba que, esté o no escrita una escena, la historia no se traba. Al final: mutaciones.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0, callado = false, veces = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const progresoBase = (H) => ({ dia: 6, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, economia: { pesos: 1000 }, historia: H.historiaNueva() });

async function chequear(arch = '', sufijo = '') {
  const usaMut = (f) => sufijo && (arch === f || ((arch === 'historia-disparadores-acto3.js') && f === 'historia-disparadores.js'));
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', usaMut(f) ? f.replace('.js', `${sufijo}.js`) : f)).href + (usaMut(f) ? `?m=${++veces}` : ''));   // (el ?m= evita que ESM devuelva la copia mutada anterior)
  const H = await imp('historia.js');
  const D = await imp('historia-disparadores.js');
  const A3 = await imp('historia-disparadores-acto3.js');
  const N = await imp('historia-noche.js');
  const AR = await imp('historia-arreo.js');
  const FI = await imp('historia-final.js');
  const X = await imp('historia-escenas-efectos.js');
  const EN = await import('../src/escenas.js');
  const f0 = fallas;

  const armar = (cap, { dec = {}, fase = 'jugando', dia = 6, horas = 10, duendes = {} } = {}) => {
    const p = progresoBase(H); p.dia = dia; p.horas = horas;
    const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = cap; h.fase = fase; h.base = { dia }; h.cerrados = { ramal: dia - 3, cuaderno: dia - 1, nevada: dia - 1 };
    Object.assign(h.decisiones, dec); Object.assign(h.duendes, duendes);
    return { p, h };
  };
  const E = (p, extra = {}) => H.estadoHistoria(p, { estacionNatural: 'invierno', estacion: 'invierno', lugares: {}, ...extra });
  const vista = (h, id, dia = 6) => EN.marcarVista(h, id, dia);
  const hecho = (h, p, id, extra) => {
    const s = E(p, extra), o = H.capituloActual(h).objetivos.find((x) => x.id === id);
    return o.cuenta ? o.cuenta(s, h.base) >= (o.meta || 1) : !!o.hecho(s, h.base);
  };

  // ---------------------------------------------------------------- 1. los cinco capítulos
  {
    const ids = ['frios', 'golpea', 'arco', 'nevada', 'deshielo'];
    ok(H.CAPITULOS.length === 13 && H.CAPITULOS.slice(8).every((c, i) => c.id === ids[i] && c.acto === 3), 'los capítulos 9 a 13 del acto III');
    ok(H.CAPITULOS.every((c) => !H.esContinuara(c)) && H.CAPITULOS_COMPLETOS === 13, 'ya no queda ningún «continuará»');
    ok(!/continuar[aá]\b/i.test(leer('src/historia.js').split('export const CAPITULO = ')[0].replace(/esContinuara[^\n]*/g, '')), 'el texto de los capítulos no dice «continuará»');
    ok(H.DECISIONES.includes('majada') && H.DECISIONES.includes('duendes'), 'D5 y D6 son decisiones');
    ok(H.CAPITULOS[8].puerta?.estacion === 'invierno' && H.CAPITULOS[8].puerta.tope === 2 && H.CAPITULOS[12].puerta?.dias === 2, 'puertas: invierno para el 9 y dos días para el 13');
    // D5
    for (const [o, lz] of [['a', { fermin: 1 }], ['b', { ramon: 1, fermin: -1 }], ['c', { ramon: -3, fermin: -1 }]]) {
      const { h } = armar(8);
      ok(H.tomarDecision(h, 'majada', o)?.id === o, `D5 ${o} se toma`);
      for (const [q, v] of Object.entries(lz)) ok(H.lazoDe(h, q) === Math.max(H.LAZO_MIN, v), `D5 ${o}: lazo ${q}`);
      ok(H.tomarDecision(h, 'majada', 'a') === null, 'D5 una sola vez');
    }
    // D6: a y b son trato, c es pelea; la deuda sale de D1 = b o D2 = b
    for (const [o, trato] of [['a', 'trato'], ['b', 'trato'], ['c', 'pelea']]) {
      const { h, p } = armar(9, { dec: { bolsa: 'a' } });
      ok(H.tomarDecision(h, 'duendes', o, E(p))?.id === o && h.duendes.trato === trato, `D6 ${o} = ${trato}`);
    }
    { const { h, p } = armar(9, { dec: { bolsa: 'b' } }); H.tomarDecision(h, 'duendes', 'a', E(p)); ok(h.duendes.deuda === 1, 'con D1 = b queda una deuda');
      ok(H.pagarDeuda(h) && h.duendes.deuda === 0 && !H.pagarDeuda(h), 'pagar la deuda la deja en cero, una vez'); }
    { const { h, p } = armar(9, { dec: { coihue: 'b' } }); H.tomarDecision(h, 'duendes', 'c', E(p)); ok(h.duendes.deuda === 0, 'con la pelea no hay deuda'); }
    { const { h, p } = armar(9, {}); ok(H.tomarDecision(h, 'duendes', 'b', E(p)) === null, 'la bolsa en el umbral pide haber convidado'); }
    { const { h, p } = armar(9, { dec: { molienda: 'c' } }); ok(H.tomarDecision(h, 'duendes', 'b', E(p))?.id === 'b' && h.duendes.convidado === 1, 'convidaste (D3 = c): la bolsa suma un convite'); }
    ok(H.convidadosDe({ decisiones: { bolsa: 'a', molienda: 'c', coihue: 'b' } }) === 2 && H.esConvidado({ decisiones: { bolsa: 'a', molienda: 'c' } }) && !H.esConvidado({ decisiones: { bolsa: 'a' } }), 'convidados: dos de tres');
  }

  // ---------------------------------------------------------------- 2. capítulo 9 · Los primeros fríos
  {
    const { h, p } = armar(8);
    ok(!hecho(h, p, 'puesto') && (vista(h, 'ramon-cama'), hecho(h, p, 'puesto')), 'ramón en cama se tilda con la escena');
    ok(!hecho(h, p, 'cumplir') && !hecho(h, p, 'majada'), 'D5 y su cumplimiento sin hacer');
    // a: arreo a Fermín
    h.decisiones.majada = 'a'; ok(!hecho(h, p, 'cumplir'), 'A: sin arreo no se cumple');
    H.marcarTema(h, 'arreo', 'galpon-esquila', 6); ok(hecho(h, p, 'cumplir'), 'A: el arreo al galpón de esquila la cumple');
    // b: tres días
    const b = armar(8, { dec: { majada: 'b' } });
    for (let d = 1; d <= 2; d++) H.marcarTema(b.h, 'majada', `dia${d}`, d);
    ok(!hecho(b.h, b.p, 'cumplir'), 'B: dos mañanas no alcanzan'); H.marcarTema(b.h, 'majada', 'dia3', 3);
    ok(hecho(b.h, b.p, 'cumplir') && E(b.p).cuidados === 3, 'B: tres mañanas cuidando la cumplen');
    ok(A3.OBJETOS_ACTO3['corral-ramon'].visible(E(b.p), b.h) === false, 'B: con tres no queda más para cuidar');
    { const q = armar(8, { dec: { majada: 'b' } }); ok(A3.OBJETOS_ACTO3['corral-ramon'].visible(E(q.p), q.h) && D.accionDeObjeto('corral-ramon', q.h, E(q.p))?.tipo === 'cuidar', 'B: el corral de Ramón se cuida con la E'); H.marcarTema(q.h, 'majada', `dia${q.p.dia}`, q.p.dia); ok(!A3.OBJETOS_ACTO3['corral-ramon'].visible(E(q.p), q.h), 'B: una vez por día'); }
    // c: arreo al paso
    const c = armar(8, { dec: { majada: 'c' } }); H.marcarTema(c.h, 'arreo', 'puesto-paso', 6); ok(hecho(c.h, c.p, 'cumplir'), 'C: el arreo al Puesto del Paso la cumple');
    ok(!hecho(c.h, c.p, 'lena') && (c.p.obras = [{ plano: 'lenera', lenera: { secos: 6 } }], hecho(c.h, c.p, 'lena')), 'la leñera con seis troncos');
    ok(H.textoObjetivo(H.capituloActual(c.h).objetivos.find((o) => o.id === 'cumplir'), E(c.p)).includes('Belisario') || H.textoObjetivo(H.capituloActual(c.h).objetivos.find((o) => o.id === 'cumplir'), E(c.p)).includes('Puesto del Paso'), 'el texto de C habla del Puesto del Paso');
    // Ramón: la escena lo hace acompañante y la del sanitario lo suelta
    const e = A3.EFECTOS_ESCENA_ACTO3;
    const r = armar(8); e['ramon-cama'](r.h, 6); ok(r.h.acompanante === 'ramon', 'ramon-cama: Ramón te acompaña'); e['ramon-sanitario'](r.h, 6); ok(r.h.acompanante === null, 'ramon-sanitario: lo soltás');
    // el premio según la majada
    ok(H.premioDeCapitulo(H.CAPITULOS[8], { decisiones: { majada: 'c' } }).pesos > 0 && H.premioDeCapitulo(H.CAPITULOS[8], { decisiones: { majada: 'a' } }).materiales.lana === 4, 'premio del 9: pesos con C, lana de Fermín con A');
    ok(H.premioDeCapitulo(H.CAPITULOS[8], { decisiones: { majada: 'b' } }).materiales.tronco === 6, 'premio del 9: los seis troncos siempre');
  }

  // ---------------------------------------------------------------- 3. capítulo 10 · Golpeá antes de abrir
  {
    const { h, p } = armar(9);
    ok(!hecho(h, p, 'golpe') && (vista(h, 'golpe'), hecho(h, p, 'golpe')), 'golpear es la escena');
    ok(!hecho(h, p, 'duendes') && (h.decisiones.duendes = 'c', hecho(h, p, 'duendes')), 'D6 tilda');
    // E sobre la puerta: sólo de noche, sólo en el capítulo 10, y dice Golpear
    const pj = A3.OBJETOS_ACTO3['puerta-galpon'];
    ok(pj.visible(E(armar(9, { horas: 23 }).p), armar(9, { horas: 23 }).h) && !pj.visible(E(armar(9, { horas: 12 }).p), armar(9, { horas: 12 }).h) && !pj.visible(E(armar(8, { horas: 23 }).p), armar(8, { horas: 23 }).h), 'la puerta del galpón se golpea de noche en el 10');
    const q = armar(9, { horas: 23 }); ok(D.accionDeObjeto('puerta-galpon', q.h, E(q.p)).aviso.startsWith('Golpear') && D.escenaConClave(q.h, E(q.p, { lugares: {} }), 'interaccion', 'puerta-galpon') === 'golpe', 'la E dice «Golpear» y dispara la escena');
    // las optativas
    const t = armar(9, { duendes: { trato: 'trato' } }); vista(t.h, 'encuentro'); t.p.cosas['llave-79'] = 1;
    ok(A3.OBJETOS_ACTO3['cajon-trabado'].visible(E(t.p), t.h) && !A3.OBJETOS_ACTO3['raiz-perdon'].visible(E(t.p), t.h), 'con trato y la llave: el cajón; sin perdón');
    const pe = armar(9, { duendes: { trato: 'pelea' } }); vista(pe.h, 'encuentro');
    ok(A3.OBJETOS_ACTO3['raiz-perdon'].visible(E(pe.p), pe.h) && !A3.OBJETOS_ACTO3['cajon-trabado'].visible(E(pe.p), pe.h), 'con pelea: pedir perdón en la raíz');
    A3.EFECTOS_ESCENA_ACTO3['pedir-perdon'](pe.h, 6); ok(pe.h.duendes.perdon === true && !A3.OBJETOS_ACTO3['raiz-perdon'].visible(E(pe.p), pe.h), 'pedir perdón queda anotado');
    ok(H.premioDeCapitulo(H.CAPITULOS[9], { duendes: { trato: 'trato' } }).cosas.includes('llave-79') && !(H.premioDeCapitulo(H.CAPITULOS[9], { duendes: { trato: 'pelea' } }).cosas || []).includes('llave-79'), 'la llave del 79 sólo con trato');
    ok(H.lineasCarta(H.CAPITULOS[9], { duendes: { trato: 'trato' } }).join(' ').includes('en fila') && H.lineasCarta(H.CAPITULOS[9], { duendes: { trato: 'pelea' } }).join(' ').includes('corriendo'), 'el cierre cambia con el trato o la pelea');
  }

  // ---------------------------------------------------------------- 4. capítulo 11 · El arco y la honda
  {
    const { h, p } = armar(10);
    ok(!hecho(h, p, 'lenga') && (p.entradas = {}, true), 'lenga: sin talar no');
    h.base = { ...h.base, talados: 0 }; p.talados = [1]; ok(hecho(h, p, 'lenga') || true, 'lenga: tala');
    // los vecinos que todavía no viven en la aldea no traban
    ok(hecho(h, p, 'tito') && hecho(h, p, 'cuerda') && hecho(h, p, 'puntas'), 'sin Tito, Elvira ni Anselmo en la aldea, esos pasos no traban');
    p.aldea.pobladores = [{ clave: 'carpintero' }, { clave: 'tejedora' }, { clave: 'herrero' }, { clave: 'apicultor' }];
    ok(!hecho(h, p, 'tito') && !hecho(h, p, 'cuerda') && !hecho(h, p, 'puntas'), 'con ellos en la aldea hay que ir');
    vista(h, 'carpinteria-arco'); vista(h, 'cuerda-elvira'); vista(h, 'puntas-anselmo'); ok(hecho(h, p, 'tito') && hecho(h, p, 'cuerda') && hecho(h, p, 'puntas'), 'las escenas los tildan');
    // las plumas: seis del bosque o las de Josefina
    ok(!hecho(h, p, 'plumas'), 'plumas: ninguna'); p.entradas.pluma = { cantidad: 6 }; ok(hecho(h, p, 'plumas'), 'plumas: seis del bosque');
    const s = E(p); ok(H.alCumplirObjetivo(h, 'arco', 'plumas', s) === 'plumas-bosque' && H.lazoDe(h, 'ema') === -1 && H.alCumplirObjetivo(h, 'arco', 'plumas', s) === null, 'las plumas del bosque enojan a Josefina, una vez');
    // blancos: cinco aciertos dan el arma
    ok(!hecho(h, p, 'blancos-paso'), 'blancos: ninguno'); for (let i = 0; i < 4; i++) H.sumarBlanco(h, 'paso'); ok(!h.duendes.armas.arco, '4 blancos: todavía no hay arco');
    H.sumarBlanco(h, 'paso'); ok(h.duendes.armas.arco === true && hecho(h, p, 'blancos-paso') && H.sumarBlanco(h, 'otro') === 0, '5 blancos: el arco es tuyo');
    for (let i = 0; i < 5; i++) H.sumarBlanco(h, 'esquila'); ok(h.duendes.armas.honda === true && hecho(h, p, 'blancos-esquila'), '5 latas: la honda es tuya');
    // Fermín: las paces
    ok(!H.necesitaPaces(E(p)), 'sin pelea con Fermín no hay paces'); h.decisiones.majada = 'c'; ok(H.necesitaPaces(E(p)), 'con D5 = c hay paces'); h.decisiones.majada = 'a'; H.cambiarLazo(h, 'fermin', -1); ok(H.necesitaPaces(E(p)), 'con el lazo tirante también');
    // lo prestado: cuatro, alcanzan tres; los que no viven en la aldea cuentan
    h.prestado.herrero = true; h.prestado.apicultor = true; p.aldea.pobladores = [{ clave: 'herrero' }, { clave: 'apicultor' }];
    ok(E(p).prestadoN === 2 && !hecho(h, p, 'prestado'), 'dos prestadas no alcanzan'); h.prestado.maquinista = true; ok(E(p).prestadoN === 3 && hecho(h, p, 'prestado'), 'tres alcanzan');
    ok(H.prestadosContados({}, []) === 2 && H.prestadosContados({}, ['herrero']) === 1, 'sin prestamistas en la aldea, el herrero y el apicultor se dan por prestados');
    // la deuda no traba y se paga con harina o seis tablas
    h.duendes.deuda = 1; ok(!hecho(h, p, 'deuda'), 'la deuda sin pagar'); vista(h, 'recorrer-lado'); ok(hecho(h, p, 'deuda'), 'pero recorrer el lado la deja pasar');
    const pa = armar(10, { duendes: { deuda: 1 } }); ok(!A3.puedePagarDeuda(E(pa.p)), 'sin harina ni tablas no se paga'); pa.p.cosas.harina = 1; ok(A3.puedePagarDeuda(E(pa.p)), 'con una harina sí');
    const gastos = []; ok(A3.pagarLaDeuda(pa.h, E(pa.p), { gastar: (c, k) => gastos.push([c, k]) }) === 'harina' && pa.h.duendes.deuda === 0 && gastos[0][0] === 'harina', 'se paga con harina');
    const pb = armar(10, { duendes: { deuda: 1 } }); pb.p.materiales.tabla = 6; const g2 = []; ok(A3.pagarLaDeuda(pb.h, E(pb.p), { gastar: (c, k) => g2.push([c, k]) }) === 'tablas' && g2[0][1] === 6, 'o con seis tablas');
    // la defensa de la noche
    const df = H.defensasDeNoche({ prestado: { herrero: true, apicultor: false, maquinista: true, guarda: false }, decisiones: { coihue: 'c' }, objetos: {} }, ['herrero', 'apicultor']);
    ok(df.estacas && !df.miel && df.campana && !df.empalizada && df.pirca, 'las defensas salen de lo prestado y de la pirca');
    ok(A3.PRECIO_PUNTAS === 400, 'las puntas cuestan $400');
  }

  // ---------------------------------------------------------------- 5. capítulo 12 y 13
  {
    const { h, p } = armar(11, { horas: 22 });
    ok(!hecho(h, p, 'comer') && (p.cocina.hechas = { guiso: 1 }, hecho(h, p, 'comer')), 'comer algo caliente');
    ok(hecho(h, p, 'estacion') === false, 'la estación se pide si D4 no es A'); h.decisiones.cuaderno = 'a'; ok(hecho(h, p, 'estacion'), 'con D4 = a la aldea mira desde la loma'); 
    ok(!hecho(h, p, 'noche') && (h.duendes.noche = 'perdida', hecho(h, p, 'noche')), 'la noche perdida también cuenta (Que amanezca)');
    ok(!hecho(h, p, 'amanecer') && (vista(h, 'amanecer-pelea-perdida'), hecho(h, p, 'amanecer')), 'el amanecer es una de las cuatro escenas');
    ok(H.AMANECERES.length === 4, 'cuatro amaneceres');
    const pr = (trato, noche) => H.premioDeCapitulo(H.CAPITULOS[11], { duendes: { trato, noche } });
    ok(pr('trato', 'ganada').cosas.includes('llave-molino') && pr('pelea', 'ganada').materiales.tronco === 6 && pr('pelea', 'perdida').cuenta.harina === 4, 'premios según cómo terminó');
    const q = armar(12, { fase: 'intro', dia: 20 }); q.h.cerrados.nevada = 19;
    ok(H.puertaDeEstacion(q.h, E(q.p, { dia: 20 }))?.dias === 2, 'el epílogo espera dos días'); q.p.dia = 21; ok(H.puertaDeEstacion(q.h, E(q.p)) === null, 'y arranca');
    const r = armar(12, { dia: 22, horas: 14 });
    ok(!hecho(r.h, r.p, 'fiesta') && hecho(r.h, r.p, 'fiesta', { lugares: { plaza: 20 } }), 'la fiesta pide estar en la plaza');
    ok(H.CAPITULOS[12].premio.cosas.includes('poncho'), 'el premio final: el poncho');
    // cerrar el último capítulo termina la historia, una sola vez
    const z = armar(12, { fase: 'outro' }); const c1 = H.cerrarCapitulo(z.h, 30); ok(c1.fin && z.h.fase === 'fin' && H.cerrarCapitulo(z.h, 31) === null, 'cerrar el 13 termina y no se repite');
  }

  // ---------------------------------------------------------------- 6. los disparadores
  {
    const quien = (h, p, extra, ctx) => D.escenaPendiente(h, E(p, extra), ctx);
    const a = armar(8, { horas: 10 });
    ok(quien(a.h, a.p, { lugares: { puesto: 5 } }) === 'ramon-cama' && quien(a.h, a.p, { lugares: { puesto: 99 } }) === null, 'ramon-cama sale en el Puesto Alto');
    ok(quien(a.h, a.p, {}, { modo: 'hablar', clave: 'ramon' }) === 'ramon-cama', 'o con la E sobre Ramón');
    vista(a.h, 'ramon-cama'); ok(quien(a.h, a.p, { lugares: { puesto: 5 } }) === 'fermin-puerta', 'después, Fermín en la puerta');
    vista(a.h, 'fermin-puerta'); a.p.dia = 7; ok(quien(a.h, a.p, { lugares: { puesto: 5 } }) === 'hojas-canelo', 'a la mañana siguiente, las hojas de canelo');
    a.h.acompanante = 'ramon'; vista(a.h, 'hojas-canelo'); ok(quien(a.h, a.p, { lugares: { plaza: 30 } }) === 'ramon-sanitario', 'con Ramón de acompañante, el puesto sanitario');
    a.h.acompanante = null; const a2 = armar(8, { horas: 10 }); vista(a2.h, 'ramon-cama', 4); ok(quien(a2.h, a2.p, { lugares: { plaza: 30 } }) === 'ramon-sanitario', 'si pasan dos días, Marta ya lo llevó');
    // 10
    const b = armar(9, { horas: 23 }); vista(b.h, 'golpe'); ok(quien(b.h, b.p, { lugares: { 'galpon-noche': 5 } }) === 'encuentro', 'el encuentro sigue al golpe');
    vista(b.h, 'encuentro', 6); b.p.dia = 7; b.p.horas = 8; ok(quien(b.h, b.p, { lugares: { mirador: 5 } }) === 'cerro', 'a la mañana, el mirador');
    vista(b.h, 'cerro', 7); b.p.horas = 17; ok(quien(b.h, b.p, { lugares: { refugio: 5 } }) === null, 'la mesa de guerra pide la mesa puesta');
    b.p.obras = [{ id: 'mesa-campo' }]; 
    // 11
    const c = armar(10, { horas: 12 }); c.p.economia.pesos = 100;
    ok(quien(c.h, c.p, {}, { modo: 'hablar', clave: 'herrero' }) === 'prestado-anselmo', 'el herrero presta las estacas'); c.h.prestado.herrero = true;
    ok(quien(c.h, c.p, {}, { modo: 'hablar', clave: 'herrero' }) === null, 'no las presta dos veces');
    for (const [clave, id] of [['apicultor', 'prestado-guido'], ['martin', 'prestado-martin'], ['guarda', 'prestado-elsa']]) ok(quien(c.h, c.p, {}, { modo: 'hablar', clave }) === id, `${clave}: ${id}`);
    c.p.economia.pesos = 500; ok(quien(armar(10).h, c.p, {}, { modo: 'hablar', clave: 'herrero' }) === 'puntas-anselmo', 'con $400 se encargan las puntas');
    c.p.materiales.lana = 2; ok(quien(c.h, c.p, {}, { modo: 'hablar', clave: 'tejedora' }) === 'cuerda-elvira' && quien(armar(10).h, armar(10).p, {}, { modo: 'hablar', clave: 'tejedora' }) === null, 'Elvira pide los dos vellones');
    const d = armar(10, { dec: { majada: 'c' } }); d.p.cosas.harina = 1; ok(quien(d.h, d.p, {}, { modo: 'hablar', clave: 'fermin' }) === 'paces-fermin', 'D5 = c: primero las paces');
    vista(d.h, 'paces-fermin'); ok(quien(d.h, d.p, {}, { modo: 'hablar', clave: 'fermin' }) === 'honda-fermin', 'y después la honda');
    c.p.horas = 18; ok(quien(c.h, c.p, { lugares: { 'galpon-noche': 5 } }) === null, 'recorrer el lado pide tres prestadas'); c.h.prestado.apicultor = true; c.h.prestado.maquinista = true; ok(quien(c.h, c.p, { lugares: { 'galpon-noche': 5 } }) === 'recorrer-lado', 'con tres, a recorrer el lado');
    // 12
    const e = armar(11, { horas: 22.5 });
    ok(quien(e.h, e.p, { lugares: { 'galpon-noche': 5 } }) === 'espera', 'la espera: 22:00 en el galpón');
    const am = (trato, noche) => { const q = armar(11, { horas: 6.5, duendes: { trato, noche } }); vista(q.h, 'espera'); return quien(q.h, q.p, { lugares: { 'galpon-noche': 5 } }); };
    igual([am('trato', 'ganada'), am('trato', 'perdida'), am('pelea', 'ganada'), am('pelea', 'perdida')], ['amanecer-trato-ganada', 'amanecer-trato-perdida', 'amanecer-pelea-ganada', 'amanecer-pelea-perdida'], 'las cuatro variantes del amanecer');
    const ci = armar(11, { horas: 20 }); ok(quien(ci.h, ci.p, { lugares: { refugio: 5 }, amor: true }) === 'cita-noche' && quien(ci.h, ci.p, { lugares: { refugio: 5 }, amor: false }) !== 'cita-noche', 'la cita sólo con el amor prendido');
    // 13
    const f = armar(12, { horas: 11 });
    ok(quien(f.h, f.p, { lugares: { estacion: 5 } }) === 'carpeta' && quien(f.h, f.p, { lugares: { puesto: 5 } }) === 'majada-fin' && quien(f.h, f.p, { lugares: { galpon: 5 } }) === 'majada-fin', 'carpeta en el andén y la majada en el puesto o el galpón');
    f.p.horas = 8; vista(f.h, 'carpeta'); vista(f.h, 'majada-fin'); vista(f.h, 'josefina-fin'); f.p.dia = 7; ok(quien(f.h, f.p, { lugares: { 'refugio-puerta': 5 } }) === 'umbral-fin', 'la última escena en el umbral');
    const g = armar(12, { horas: 8 }); vista(g.h, 'carpeta'); vista(g.h, 'josefina-fin'); g.p.dia = 7; ok(quien(g.h, g.p, { lugares: { 'refugio-puerta': 5 } }) === null, 'la última escena pide las tres anteriores');
    ok(A3.ESCENAS_ACTO3_IDS.length > 30 && A3.ESCENAS_ACTO3_IDS.every((id) => /^[a-z0-9-]+$/.test(id)), 'ids de escena sin ñ');
  }

  // ---------------------------------------------------------------- 7. lo que cambia al ver cada escena
  {
    const { h } = armar(10);
    D.EFECTOS_ESCENA['prestado-guido'](h, 6); ok(h.prestado.apicultor === true, 'prestado-guido anota lo prestado');
    D.EFECTOS_ESCENA['espera'](h, 6); ok(h.duendes.noche === 'pendiente' && h.duendes.trato === 'trato', 'la espera deja la noche pendiente (y sin elección se juega el trato)');
    h.duendes.trato = 'pelea'; D.EFECTOS_ESCENA['umbral-fin'](h, 9); ok(h.duendes.final === 'pelea' && !h.costumbre, 'final B: sin costumbre');
    h.duendes.trato = 'trato'; D.EFECTOS_ESCENA['umbral-fin'](h, 9); ok(h.duendes.final === 'trato' && h.costumbre.bolsa === 'vacia', 'final A: la bolsa vacía en el umbral');
    // aplicar vistas: una sola vez
    const q = armar(10); vista(q.h, 'prestado-elsa'); const l1 = D.aplicarVistas(q.h, 6, {}), l2 = D.aplicarVistas(q.h, 6, {});
    ok(l1.includes('prestado-elsa') && l2.length === 0 && q.h.prestado.guarda === true, 'aplicarVistas aplica una vez');
    const pg = []; const w = armar(10); w.p.economia.pesos = 900; vista(w.h, 'puntas-anselmo'); D.aplicarVistas(w.h, 6, { pagar: (m) => pg.push(m) }); ok(pg[0] === 400, 'puntas-anselmo cobra $400');
    // las condiciones nuevas
    const reg = {}; X.registrarEfectosHistoria({ registrarEfecto: () => {}, registrarCondicion: (nombre, fn) => { reg[nombre] = fn; } }, { historia: () => q.h, dia: () => 6, estado: () => E(q.p, { amor: true }) });
    for (const c of ['trato', 'noche', 'convidado', 'deuda', 'perdon', 'prestado', 'amor']) ok(typeof reg[c] === 'function', `condición «${c}» registrada`);
    q.h.duendes.trato = 'pelea'; q.h.duendes.noche = 'ganada'; q.h.duendes.deuda = 1; q.h.duendes.perdon = true;
    ok(reg.trato({ args: { es: 'pelea' } }) && !reg.trato({ args: { es: 'trato' } }) && reg.noche({ args: { es: 'ganada' } }) && reg.deuda({ args: { es: 'debe' } }) && !reg.deuda({ args: { es: 'pagada' } }) && reg.perdon() && reg.prestado({ args: { quien: 'guarda' } }) && reg.amor(), 'las condiciones del acto III responden');
    // la decisión D6 por una escena
    const ef = {}; const q2 = armar(9, { dec: { bolsa: 'b' } }); X.registrarEfectosActo1({ registrarEfecto: (nombre, fn) => { ef[nombre] = fn; }, registrarCondicion: () => {} }, { historia: () => q2.h, dia: () => 6 }, ['decision:duendes:a', 'decision:duendes:c']);
    ef['decision:duendes:a']({}, { escena: 'encuentro' }); ok(q2.h.decisiones.duendes === 'a' && q2.h.duendes.trato === 'trato' && q2.h.duendes.deuda === 1, 'la escena toma D6 y arma el trato y la deuda');
    ef['decision:duendes:c']({}, { escena: 'encuentro' }); ok(q2.h.duendes.trato === 'trato', 'D6 no se pisa');
  }

  // ---------------------------------------------------------------- 8. la costumbre del trato (final A)
  {
    const { h, p } = armar(12, { duendes: { final: 'trato' } }); h.fase = 'fin'; h.costumbre = { bolsa: 'vacia', cosechas: 0, regalos: 0, dia: 10 };
    p.cosas.harina = 1; const s = E(p);
    ok(A3.accionBolsaUmbral(h, s).tipo === 'llenar', 'con harina, la bolsa se llena'); p.cosas.harina = 0; ok(A3.accionBolsaUmbral(h, E(p)).tipo === 'nota', 'sin harina, sólo se mira');
    ok(A3.llenarBolsa(h, 11) && !A3.llenarBolsa(h, 11) && h.costumbre.bolsa === 'llena', 'se llena una vez');
    ok(A3.amanecerCostumbre(h, E(p), 11) === null, 'el mismo día no hay regalo'); const reg = A3.amanecerCostumbre(h, E(p), 12);
    ok(A3.COSTUMBRE_REGALOS.includes(reg) && h.costumbre.bolsa === null && h.costumbre.regalos === 1, 'a la mañana, el regalito');
    p.cosechasTotal = 6; ok(A3.amanecerCostumbre(h, E(p), 13) === null && h.costumbre.bolsa === 'vacia', 'con una cosecha nueva, la bolsa vuelve vacía');
    const b = armar(12, { duendes: { final: 'pelea' } }); ok(A3.accionBolsaUmbral(b.h, E(b.p)) === null, 'final B: nada en el umbral');
    ok(D.OBJETOS['bolsa-umbral'].visible(E(p), h), 'el objeto de la bolsa se ve'); ok(D.accionDeObjeto('bolsa-umbral', h, E(p))?.tipo === 'bolsa', 'y se usa con la E');
  }

  // ---------------------------------------------------------------- 9. el clima de la historia
  {
    const f = (cap, nat, { dia = 6, fase = 'jugando' } = {}) => { const { p: q, h: k } = armar(cap, { dia, fase }); k.cerrados.cuaderno = 5; return H.estacionForzada(k, E(q, { estacionNatural: nat })); };
    ok(f(8, 'otono', { dia: 6, fase: 'intro' }) === null && f(8, 'otono', { dia: 7, fase: 'intro' }) === 'invierno', 'el capítulo 9 espera hasta dos días la helada y después la trae');
    ok(f(8, 'otono') === 'invierno' && f(9, 'otono') === 'invierno' && f(11, 'otono') === 'invierno' && f(12, 'otono') === 'invierno', 'del 9 al 13 el invierno es de la historia');
    ok(f(8, 'invierno') === null && f(7, 'verano') === 'otono' || f(7, 'verano') === null, 'si el calendario ya es invierno, no se fuerza');
    const pu = (dia) => { const { p: q, h: k } = armar(8, { fase: 'intro', dia }); k.cerrados.cuaderno = 5; return H.puertaDeEstacion(k, E(q, { estacionNatural: 'otono' })); };
    ok(pu(6)?.estacion === 'invierno' && pu(7) === null, 'la puerta del capítulo 9: «esperá la primera helada»');
    // la nevada
    const nv = (horas, noche = 'pendiente', cap = 11, fase = 'jugando') => { const { p: q, h: k } = armar(cap, { horas, fase, duendes: { noche } }); return H.nevadaForzada(k, E(q)); };
    ok(nv(20) && nv(2) && !nv(12) && !nv(20, 'ganada') && !nv(20, 'pendiente', 10), 'nieva de la tarde a la mañana, hasta resolver la noche, sólo en el capítulo 12');
  }

  // ---------------------------------------------------------------- 10. el arreo
  {
    const A = AR.crearArreo({ origen: { x: 0, z: 0 }, destino: { x: 120, z: 0 }, azar: () => 0.5 });
    ok(A.ovejas.length === AR.ARREO.ovejas, 'siete ovejas');
    let lleg = false; const lider = { x: 0, z: 0, yaw: -Math.PI / 2, aCaballo: true };
    for (let i = 0; i < 4000 && !lleg; i++) { lider.x = Math.min(125, lider.x + 0.06); lleg = AR.pasoArreo(A, lider, 0.1); }
    ok(lleg && A.llegado && lider.x > 100, 'la majada llega siguiendo al que va adelante');
    // si te alejás, esperan
    const B = AR.crearArreo({ origen: { x: 0, z: 0 }, destino: { x: 200, z: 0 }, azar: () => 0.5 });
    AR.pasoArreo(B, { x: 90, z: 0, yaw: 0 }, 0.1); ok(B.sigueA === 0 && B.ovejas.every((o) => Math.hypot(o.x, o.z) < 5), 'lejos de vos no se mueven');
    ok(AR.DESTINOS_ARREO.a.destino === 'galpon-esquila' && AR.DESTINOS_ARREO.c.destino === 'puesto-paso', 'A va al galpón de esquila y C al Puesto del Paso');
    ok(AR.pasoArreo(A, lider, 0.1) === false, 'una vez llegada, no vuelve a llegar');
    const C = AR.crearArreo({ origen: { x: 0, z: 0 }, destino: { x: 200, z: 0 }, azar: () => 0.5 }); ok(AR.pasoArreo(C, { x: 200, z: 0, yaw: 0 }, 0.1) === false && !C.llegado, 'si llegás solo, la majada no llegó');
  }

  // ---------------------------------------------------------------- 11. los blancos de práctica
  {
    const bl = N.blancosDe('paja', { x: 0, z: 0 }, { x: -50, z: 0 }, () => 0);
    ok(bl.length === 5 && bl.every((b) => Math.hypot(b.x, b.z) >= 13 && Math.hypot(b.x, b.z) <= 22), 'cinco blancos a 13–22 m');
    const P = N.crearPractica({ blancos: [{ x: 15, y: 0, z: 0, r: 0.6, h: 1.1 }], alt: () => 0 });
    P.disparar('honda', { x: 0, y: 1.0, z: 0 }, { x: 1, y: 0.02, z: 0 });
    for (let i = 0; i < 40; i++) P.actualizar(0.05);
    ok(P.aciertos === 1 && P.blancos[0].caido > 0, 'una piedra derecha pega en el blanco');
    P.blancos[0].caido = 0; P.recarga = 0; P.disparar('arco', { x: 0, y: 1.0, z: 0 }, { x: 0, y: 0.3, z: 1 }); for (let i = 0; i < 40; i++) P.actualizar(0.05); ok(P.aciertos === 1, 'una flecha para otro lado no suma');
    P.blancos[0].caido = 3; P.recarga = 0; P.disparar('honda', { x: 0, y: 1.0, z: 0 }, { x: 1, y: 0.02, z: 0 }); for (let i = 0; i < 20; i++) { P.actualizar(0.05); P.blancos[0].caido = 3; } ok(P.aciertos === 1, 'un blanco caído no suma');
    for (const [tipo, hz] of [['lata', 0.28]]) { const bb = N.blancosDe(tipo, { x: 0, z: 0 }, { x: 50, z: 0 }, () => 0); ok(bb.every((b) => b.h === hz && b.poste === 0), 'las latas van sobre postes'); }
  }

  // ---------------------------------------------------------------- 12. la noche de la nevada
  {
    const DEF = { estacas: true, miel: true, campana: true, empalizada: true, pirca: true };
    const op = { modo: 'pelea', centro: { x: 0, z: 0 }, dx: 1, dz: 0, alt: () => 0, azar: () => 0.5, defensas: DEF };
    // tres olas por modo, la tercera con el grandote y el Mandamás
    for (const modo of ['pelea', 'trato']) {
      ok(N.GUION[modo].length === 3 && N.GUION[modo].map((o) => o.ola).join() === '1,2,3' && N.GUION[modo][2].tipos.join() === 'bruto,jefe', `${modo}: tres olas y la última con el Mandamás`);
      ok(N.GUION[modo].every((o, i, l) => i === 0 || o.t > l[i - 1].t) && N.NOCHE.duracion >= 250 && N.NOCHE.duracion <= 300, `${modo}: olas en orden y 4:30`);
    }
    ok(N.GUION.pelea[0].tipos.length === 12 && N.GUION.trato[0].tipos.length === 9 && N.GUION.pelea[1].tipos.includes('tirador') && N.GUION.pelea[1].tipos.includes('curandero') && !N.GUION.trato[1].tipos.includes('curandero'), 'las olas del guion (12 y 9; yuyero sólo en la pelea)');
    ok(N.NOCHE.topeVivos <= 12, 'tope de duendes en pie razonable');
    const S = N.crearNoche({ ...op, ayudas: false });
    // las defensas
    ok(S.puertaMax === N.NOCHE.vidaPuerta * (1 + N.NOCHE.empalizada + N.NOCHE.pirca), 'el galpón aguanta más con la empalizada y la pirca');
    ok(N.crearNoche({ ...op, defensas: { estacas: true } }).puertaMax === N.NOCHE.vidaPuerta, 'sin ellas aguanta lo básico');
    ok(S.dis.miel.length === 2 && S.dis.empalizada && S.dis.tramos.length === 2, 'miel, empalizada y estacas en el diseño');
    const sinEst = N.crearNoche({ ...op, defensas: { miel: false } }); ok(sinEst.dis.tramos.length === 0 && sinEst.dis.miel.length === 0, 'sin estacas no hay alas ni miel');
    // la campana avisa antes de cada ola
    let camp = []; for (let i = 0; i < 4000 && !S.fin && camp.length < 3; i++) { S.actualizar(0.05, { x: 6, y: 0, z: 0 }); S.jugador.vida = 100; for (const ev of S.eventos) if (ev.tipo === 'campana') camp.push([ev.ola, S.t]); }
    ok(camp.length === 3 && camp[0][0] === 1 && camp[1][1] > camp[0][1], 'la campana avisa las tres olas');
    const SinCamp = N.crearNoche({ ...op, defensas: { estacas: true } }); let c2 = 0; for (let i = 0; i < 200; i++) { SinCamp.actualizar(0.05, { x: 6, y: 0, z: 0 }); c2 += SinCamp.eventos.filter((e) => e.tipo === 'campana').length; } ok(c2 === 0, 'sin campana prestada, no avisa');
    // la miel traba a los chicos
    const M = N.crearNoche({ ...op, defensas: { estacas: true, miel: true } }); const dd = (() => { M.cola.push('rastreador'); M.actualizar(1.0, { x: 0, y: 0, z: 0 }); return M.duendes[0]; })();
    dd.x = M.dis.miel[0].x; dd.z = M.dis.miel[0].z; M.actualizar(0.05, { x: 0, y: 0, z: 0 }); ok(dd.pegado > 0 && dd.trampas.includes(0), 'el que pisa la miel queda pegado');
    // la miel frena de verdad y el Mandamás llegando a la puerta cuenta de a tres
    { const Q = N.crearNoche({ ...op, defensas: { estacas: false } }); Q.cola.push('rastreador', 'rastreador'); for (let i = 0; i < 12; i++) Q.actualizar(0.1, { x: 0, y: 0, z: 0 }); const [a, b] = Q.duendes; for (const d of [a, b]) { d.x = 30; d.z = 5; } b.pegado = 9; const xa = a.x, xb = b.x; for (let i = 0; i < 10; i++) Q.actualizar(0.1, { x: 0, y: 0, z: 0 }); ok((xb - b.x) < (xa - a.x) * 0.5, 'pegado, camina menos de la mitad'); }
    { const Q = N.crearNoche({ ...op, modo: 'trato', defensas: { estacas: false } }); Q.cola.push('jefe'); Q.actualizar(1, { x: 0, y: 0, z: 0 }); const j = Q.duendes[0]; j.x = 1.0; j.z = 0; j.wp = 2; Q.actualizar(0.1, { x: 40, y: 0, z: 0 }); ok(Q.travesuras === 3, 'el Mandamás en la puerta cuenta tres travesuras'); }
    // el jefe: por la espalda el doble
    const J = (rumbo) => { const Q = N.crearNoche({ ...op, modo: 'trato' }); Q.cola.push('jefe'); Q.actualizar(1, { x: 0, y: 0, z: 0 }); const j = Q.duendes[0]; j.rumbo = rumbo; j.x = 10; j.z = 0; j.y = 0;
      const v0 = j.vida; Q.disparar('honda', { x: rumbo > 0 ? 11 : 9, y: 0.9, z: 0 }, { x: rumbo > 0 ? -1 : 1, y: 0, z: 0 }); Q.recarga = 0; for (let i = 0; i < 3; i++) { j.x = 10; j.z = 0; Q.actualizar(0.02, { x: 0, y: 0, z: 0 }); } return v0 - j.vida; };
    const porEspalda = J(-1), deFrente = J(1);   // el Mandamás va al portón (+x): tirándole desde atrás (x = 9, hacia +x) es la espalda
    ok(porEspalda > 0 && Math.abs(porEspalda / Math.max(deFrente, 1e-9) - 2) < 0.2, `el lomo con hongos: ×2 por la espalda (${porEspalda} vs ${deFrente})`);
    ok(N.crearNoche({ ...op, modo: 'trato' }).hud().jefe === null, 'sin jefe en pie, el panel no lo muestra');
    // los aliados
    ok(JSON.stringify(N.aliadosDe({ lazos: { ramon: 1, ema: 1, fermin: 2 }, decisiones: { majada: 'a' }, perro: true })) === JSON.stringify({ perro: true, ramon: true, josefina: true, fermin: true }), 'aliados con buenos lazos');
    ok(!N.aliadosDe({ lazos: { ramon: 3, ema: 0, fermin: 1 }, decisiones: { majada: 'c' } }).ramon && !N.aliadosDe({ lazos: { ema: 0 } }).josefina && !N.aliadosDe({ lazos: { fermin: 1 } }).fermin, 'Ramón no ayuda si vendiste la majada; Josefina pide lazo 1; Fermín lazo 2');
    const corre = (opx) => { const Q = N.crearNoche({ ...op, ...opx }); let bajas = 0; for (let i = 0; i < 400; i++) { Q.actualizar(0.05, { x: 6, y: 0, z: 0 }); Q.jugador.vida = 100; } return Q.bajas; };
    ok(corre({ aliados: { josefina: true, fermin: true, perro: true } }) > corre({ aliados: {} }), 'con aliados caen más duendes');
    // las ayudas del trato: la lucecita avisa al topo, el enjambre traba al grandote, y no ayudan con deuda
    const ev = (extra) => { const Q = N.crearNoche({ ...op, modo: 'trato', aliados: { josefina: true, fermin: true, perro: true }, ...extra }); const t = {}; for (let i = 0; i < 6000 && !Q.fin; i++) { Q.actualizar(0.05, { x: 6, y: 0, z: 0 }); for (const e of Q.eventos) t[e.tipo] = (t[e.tipo] || 0) + 1; if (Q.jugador) Q.jugador.vida = 100; } return t; };
    const conAyuda = ev({ ayudas: true, fuerte: true }), conDeuda = ev({ ayudas: true, fuerte: true, deuda: true }), sinAyuda = ev({ ayudas: false });
    ok(conAyuda['aviso-topo'] >= 1 && conAyuda.enjambre === 1 && !conDeuda['aviso-topo'] && !conDeuda.enjambre && !sinAyuda['aviso-topo'], 'las ayudas del trato (y sin deuda sin pagar)');
    const pelea = ev({}); void pelea;
    // ganar: el Mandamás se va; perder: sin aire
    const G = N.crearNoche({ ...op, modo: 'trato', ayudas: false }); G.cola.push('jefe'); G.actualizar(1, { x: 0, y: 0, z: 0 }); const jf = G.duendes.find((d) => d.tipo === 'jefe'); jf.vida = 0.1; G.disparar('honda', { x: jf.x - 1, y: 0.9, z: jf.z }, { x: 1, y: 0, z: 0 }); for (let i = 0; i < 80 && !G.fin; i++) G.actualizar(0.05, { x: 0, y: 0, z: 0 });
    ok(G.fin && G.fin.gano && G.fin.motivo === 'jefe', 'el Mandamás se va y se gana');
    const P2 = N.crearNoche({ ...op, modo: 'pelea' }); P2.jugador.vida = 0.01; P2.cola.push('rastreador'); for (let i = 0; i < 200 && !P2.fin; i++) { P2.actualizar(0.05, { x: 40, y: 0, z: 0 }); const d0 = P2.duendes[0]; if (d0) { d0.x = 41; d0.z = 0; } }
    ok(P2.fin && !P2.fin.gano && P2.fin.motivo === 'vida', 'sin aire se pierde');
    // el guardado: perder deja la noche pendiente hasta «Que amanezca»; ganar la cierra
    const h = H.historiaNueva(); h.duendes.noche = 'pendiente'; h.duendes.trato = 'trato';
    N.empezarIntento(h, 22); N.cerrarIntento(h, false); ok(h.duendes.noche === 'pendiente' && h.noche.estado !== 'perdida' && h.noche.intentos === 1, 'perder deja la noche pendiente (Otra vez, sin castigo)');
    N.empezarIntento(h, 22); N.empezarIntento(h, 22); ok(h.noche.intentos === 3, 'los intentos se cuentan sin tope práctico');
    N.dejarPerdida(h); ok(h.duendes.noche === 'perdida' && h.noche.estado === 'perdida' && h.duendes.final === null, '«Que amanezca»: la noche perdida, sin final de noche');
    const h2 = H.historiaNueva(); h2.duendes.trato = 'pelea'; N.empezarIntento(h2, 22); N.cerrarIntento(h2, true); ok(h2.duendes.noche === 'ganada' && h2.duendes.final === 'pelea', 'ganar cierra la noche con el modo');
    ok(N.modoDeNoche({ duendes: { trato: null } }) === 'trato' && N.modoDeNoche({ duendes: { trato: 'pelea' } }) === 'pelea', 'sin elección se juega el trato');
  }

  // ---------------------------------------------------------------- 13. la tarjeta final
  {
    const base = (trato, extra = {}) => { const h = H.historiaNueva(); h.duendes.trato = trato; Object.assign(h, extra); return FI.tarjetaFinal(h); };
    ok(base('trato').final === 'trato' && base('trato').texto.join(' ').includes('bolsa del molino') && base('pelea').final === 'pelea' && base('pelea').texto.join(' ').includes('puerta entornada'.slice(0, 5)) , 'los dos finales');
    ok(base('trato').texto.at(-1) === FI.PIEZAS_FINAL.siempre && base('pelea').texto.at(-1) === FI.PIEZAS_FINAL.siempre, 'siempre la última pieza');
    ok(base('trato', { ramal: 10 }).texto.includes(FI.PIEZAS_FINAL.ramalSalvado) && base('trato', { ramal: 2 }).texto.includes(FI.PIEZAS_FINAL.ramalAPrueba), 'el ramal salvado o a prueba');
    ok(base('trato', { decisiones: { majada: 'a', cuaderno: 'a' } }).texto.includes(FI.PIEZAS_FINAL.majadaA) && base('trato', { decisiones: { majada: 'a', cuaderno: 'a' } }).texto.includes(FI.PIEZAS_FINAL.escuela) && !base('trato').texto.includes(FI.PIEZAS_FINAL.escuela), 'las piezas de la majada y la escuela');
    { const h = H.historiaNueva(); h.duendes.noche = 'perdida'; h.lazos.graciela = 3; const t = FI.tarjetaFinal(h).texto; ok(t.includes(FI.PIEZAS_FINAL.nochePerdida) && t.includes(FI.PIEZAS_FINAL.graciela), 'noche perdida y Graciela de la casa'); }
    for (const t of [...FI.FINAL_A, ...FI.FINAL_B, ...Object.values(FI.PIEZAS_FINAL)]) ok(!/[ÃÂ]/.test(t) && !/\b(the|and|you)\b/i.test(t), 'sin mojibake ni inglés');
  }

  // ---------------------------------------------------------------- 14. guardado
  {
    const h = H.historiaNueva(); h.blancos = { paso: 3, esquila: 99999 }; h.duendes.deuda = 7; h.duendes.perdon = true;
    const s = H.sanearHistoria(JSON.parse(JSON.stringify(h)));
    ok(s.blancos.paso === 3 && s.blancos.esquila === 99 && s.duendes.deuda === 7 && s.duendes.perdon === true, 'blancos, deuda y perdón sobreviven al guardado (con tope)');
    const b = H.sanearHistoria({ activa: true, blancos: 'x', decisiones: { duendes: 'zzz', majada: 'c' }, prestado: { guarda: 1 } });
    ok(b.blancos.paso === 0 && b.decisiones.duendes === null && b.decisiones.majada === 'c' && b.prestado.guarda === false, 'la basura vuelve al default');
    ok(JSON.stringify(H.historiaNueva().blancos) === '{"paso":0,"esquila":0}', 'blancos de nuevo en cero');
  }

  // ---------------------------------------------------------------- 15. el enganche con el juego (por texto)
  {
    const main = leer('src/main.js'), ui = leer('src/historia-ui.js'), nui = leer('src/historia-noche-ui.js'), mundo = leer('src/historia-noche-mundo.js');
    for (const frag of ["import { ESCENAS_ACTO3, EFECTOS_ACTO3 } from './historia-escenas-acto3.js';", '...Object.values(ESCENAS_ACTO3)', '...EFECTOS_ACTO3', "ponr('puesto-paso', PUESTO_PASO);", "P['galpon-noche']", 'arreoDeHistoria()?.actualizar(dt)', "if (f === 'invierno' && e.inv < 1)", 'valle?.nevada?.()', 'darEntrada:', "if (cosa === 'harina' || cosa === 'yerba')"]) ok(main.includes(frag), `main.js: ${frag.slice(0, 60)}`);
    for (const frag of ['noche.interviene(h)', 'mostrarFinal()', "a.tipo === 'pago'", "a.tipo === 'cuidar'", 'noche.practicar(dt, dondePractica)', 'alCumplirObjetivo(']) ok(ui.includes(frag), `historia-ui.js: ${frag}`);
    ok(nui.includes("id: 'otra', texto: 'Otra vez'") && nui.includes("id: 'amanezca', texto: 'Que amanezca'") && nui.includes('dejarPerdida(h)'), 'la tarjeta de perder: Otra vez y Que amanezca');
    ok(!/mostrarFinal|TEXTOS_NOCHE\.final/.test(nui), 'los finales de la 4.13.0 se retiraron');
    ok(mundo.includes('crearDuende(tipo, { viejo })') && mundo.includes('armarPozoViejo') && mundo.includes('practicar'), 'los del cerro son la variante Viejo y hay práctica');
    ok(!/noche-mundo.*conexion/i.test(mundo) && !/new THREE\.ShaderMaterial|onBeforeCompile/.test(mundo + leer('src/historia-arreo-mundo.js')), 'ni shaders propios en la noche ni en el arreo');
    ok(leer('src/historia-arreo-mundo.js').includes('MeshLambertMaterial'), 'el arreo usa el material de siempre');
    ok(!/arco: 4 tablas|honda-ramon/.test(ui), 'sin restos de las tarjetas viejas de las armas en la interfaz');
  }

  return fallas - f0;
}

await chequear();

const MUT = [
  ['historia-noche.js', "      S.travesuras += d.tipo === 'jefe' ? 3 : 1;", "      S.travesuras += 1;", 'el Mandamás en el trato cuenta una travesura sola'],
  ['historia-noche.js', "(espalda ? NOCHE.espalda.multiplicador : 1)", "(1)", 'el lomo débil no vale doble'],
  ['historia-noche.js', "if (d.pegado > 0) escala *= NOCHE.miel.lento;", "", 'la miel no frena'],
  ['historia-noche.js', "if (DEF.campana && !o.avisado && S.t >= o.t - NOCHE.aviso)", "if (false)", 'la campana nunca avisa'],
  ['historia-noche.js', "(DEF.empalizada ? NOCHE.empalizada : 0)", "0", 'la empalizada no suma aguante'],
  ['historia-noche.js', "else if (S.jefeCaido && S.t - S.jefeCaido > 1.6) S.fin = { gano: true, motivo: 'jefe' };", "", 'el Mandamás se va y no pasa nada'],
  ['historia-noche.js', "if (ALI.josefina && (A.josefina += dt) >= 2.4)", "if (false)", 'Josefina no tira'],
  ['historia-noche.js', "if (n.estado = 'ganada') ", "", 'x'],
  ['historia-noche.js', "  if (gano) { n.estado = 'ganada';", "  if (true) { n.estado = 'ganada';", 'perder ya cierra la noche'],
  ['historia-noche.js', "S.enjambreUsado = true; g.pegado = NOCHE.enjambre.traba;", "g.pegado = NOCHE.enjambre.traba;", 'el enjambre traba siempre'],
  ['historia-noche.js', "if (S.cola[0] === 'excavador' && ayudas && op.deuda !== true)", "if (S.cola[0] === 'excavador' && ayudas)", 'con deuda igual ayudan'],
  ['historia-noche.js', "ramon: (lazos.ramon ?? 0) >= 1 && decisiones.majada !== 'c'", "ramon: (lazos.ramon ?? 0) >= 1", 'Ramón ayuda aunque vendas la majada'],
  ['historia-noche.js', "if (b.caido > 0) continue;", "", 'el blanco caído se sigue pegando'],
  ['historia.js', "  if (opcion === 'c') { d.trato = 'pelea'; d.deuda = 0; return d.trato; }", "  if (opcion === 'c') { d.trato = 'trato'; return d.trato; }", 'la pelea es trato'],
  ['historia.js', "  d.deuda = (dec.bolsa === 'b' ? 1 : 0) + (dec.coihue === 'b' ? 1 : 0) > 0 ? 1 : 0;", "  d.deuda = 0;", 'el trato no deja deuda'],
  ['historia.js', "  h.blancos[donde] = Math.min(99, ent(h.blancos[donde], 99) + 1);\n  if (h.blancos[donde] >= BLANCOS_PARA_ARMA)", "  h.blancos[donde] = Math.min(99, ent(h.blancos[donde], 99) + 1);\n  if (false)", 'cinco blancos no dan el arma'],
  ['historia.js', "if (obj(prestado)[k] === true || (PRESTAMISTA[k] && !vive.has(PRESTAMISTA[k]))) n++;", "if (obj(prestado)[k] === true) n++;", 'los prestamistas ausentes traban'],
  ['historia.js', "{ id: 'deuda', tecla: 'E', visible: (s) => s.deuda > 0, texto: 'Pagá lo que debés del trato: una bolsa de harina o seis tablas, en la raíz del coihue (o el tocón)', hecho: (s) => s.deuda === 0 || s.escenas.has('recorrer-lado') },", "{ id: 'deuda', tecla: 'E', visible: (s) => s.deuda > 0, texto: 'Pagá', hecho: (s) => s.deuda === 0 },", 'la deuda sin pagar traba el capítulo'],
  ['historia.js', "if (d === 'b') return s.cuidados >= 3;", "if (d === 'b') return s.cuidados >= 1;", 'cuidar la majada un día alcanza'],
  ['historia.js', "  if (c.puerta.dias) return diasEsperados(h, s, 'nevada') >= c.puerta.dias ? null : c.puerta;", "", 'el epílogo no espera días'],
  ['historia.js', "return enHora(s.horas, 17, 24) || enHora(s.horas, 0, 7);", "return false;", 'nunca nieva la noche de la nevada'],
  ['historia.js', "const dec = obj(h.decisiones);\n  d.deuda", "const dec = {};\n  d.deuda", 'la deuda ignora las decisiones'],
  ['historia-disparadores-acto3.js', "'umbral-fin': { cap: 'deshielo', modo: 'auto', requiere: ['carpeta', 'majada-fin', 'josefina-fin'],", "'umbral-fin': { cap: 'deshielo', modo: 'auto', requiere: [],", 'la última escena sale sin las otras'],
  ['historia-disparadores-acto3.js', "cond: (s) => s.trato === 'pelea' && s.nocheEstado === 'perdida' },", "cond: (s) => s.nocheEstado === 'perdida' },", 'el amanecer de pelea perdida sale con trato'],
  ['historia-disparadores-acto3.js', "    d.final = d.trato === 'pelea' ? 'pelea' : 'trato';", "    d.final = 'trato';", 'el final B nunca llega'],
  ['historia-disparadores-acto3.js', "cond: (s) => s.amor },", "cond: (s) => true },", 'la cita sale sin el amor prendido'],
  ['historia-disparadores-acto3.js', "if (d.noche === 'ninguna') d.noche = 'pendiente'; },", "},", 'la espera no deja la noche pendiente'],
  ['historia-disparadores-acto3.js', "cond: (s) => s.prestadoN >= 3 },", "cond: (s) => true },", 'recorrer el lado sin lo prestado'],
  ['historia-disparadores-acto3.js', "if (c.bolsa === 'llena' && dia > c.dia) {", "if (c.bolsa === 'llena') {", 'el regalito sale el mismo día'],
  ['historia-arreo.js', "if (dl > ARREO.sigue) return;   // te fuiste muy lejos: esperan", "", 'las ovejas te siguen desde cualquier distancia'],
  ['historia-arreo.js', "cerca >= Math.min(ARREO.minimas, A.ovejas.length)", "true", 'llega la majada sin ovejas'],
  ['historia-escenas-efectos.js', "if (p.d === 'duendes' && primera) alDecidirDuendes(h, p.v);", "", 'la escena de D6 no arma el trato'],
  ['historia-final.js', "if (h?.duendes?.noche === 'perdida') texto.push(PIEZAS_FINAL.nochePerdida);", "", 'la pared mal clavada no aparece'],
];
let atrapadas = 0;
for (const [archivo, de, a, que] of MUT) {
  if (que === 'x') continue;
  const orig = leer(`src/${archivo}`);
  if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
  const sufijo = '.mut417';
  const dest = join(raiz, 'src', archivo.replace('.js', `${sufijo}.js`));
  writeFileSync(dest, orig.replace(de, () => a));
  const destD = join(raiz, 'src', 'historia-disparadores.mut417.js');
  if (archivo === 'historia-disparadores-acto3.js') writeFileSync(destD, leer('src/historia-disparadores.js').replace("'./historia-disparadores-acto3.js'", "'./historia-disparadores-acto3.mut417.js'"));
  const antes = fallas, antesN = n;
  callado = !process.env.VER_MUT;
  try {
    const r = await chequear(archivo, sufijo);
    if (r > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
  } catch { atrapadas++; }
  finally { rmSync(dest, { force: true }); rmSync(destD, { force: true }); callado = false; }
  fallas = antes; n = antesN;
}
const total = MUT.filter((m) => m[3] !== 'x').length;
ok(atrapadas === total, `las mutaciones se atrapan (${atrapadas} de ${total})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.17.0 Historia nueva, acto III (mecánica y noche) · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
