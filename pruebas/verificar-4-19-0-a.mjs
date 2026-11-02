// 4.19.0 (A): mecánica y sistemas. Lo que se mejoró, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de src/ con
// el arreglo deshecho tiene que fallar):
//   1. la torta casera: receta nueva del horno de barro, guardable y comestible; es lo que se le lleva a Herminia (PARA_LA_TORTA) y se gasta UNA; la escena vuelve a
//      decir «¿Una torta? ¿Para mí?»
//   2. la mochila dibuja la llave del molino, el canto gemelo, la lámpara de Eusebio y la pluma de cóndor (sin ocupar casillas)
//   3. la tarjeta final larga se parte en páginas (sin scroll), con el cierre en la última y el premio sólo ahí
//   4. el objetivo de la deuda dice lo que de verdad cobra la escena (D1 = b: harina; D2 = b: tablas; las dos: las dos)
//   5. `ramon-sanitario`: el disparador anda (la E no existe: es una mecánica sin guion que el director no puede disparar); el diagnóstico queda como prueba
//   6. los anotados de la 4.18.4: sanearHistoria con «toString»: null, el margen de las marcas guardadas, el código muerto y el truco «historia capitulo N»
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, D, E, ES, ESC, imp, nuevaPartida, crear, crearJuego } from './ayuda-4-18-4-historia.mjs';

const CP = await imp('cocina-pasos.js'), MO = await imp('mochila.js'), CU = await imp('cuaderno.js'), R = await imp('historia-regalos.js'), FIN = await imp('historia-final.js');
const TR = await imp('trucos.js'), G = await imp('guardado.js'), EN = await imp('escenas.js'), NO = await imp('historia-noche.js'), OP = await imp('historia-optativas.js');
const A3D = await imp('historia-disparadores-acto3.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4190_SECCIONES ? new Set(process.env.A4190_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4190_CALLADO) console.log('FALLA ' + t); } };

// una partida de mentira en el capítulo `cap` (id), con lo anterior cerrado
const IDS = H.CAPITULOS.map((c) => c.id);
function armar(cap, o = {}) {
  const { P, X } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(cap);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: 'jugando', empezada: 1 });
  Object.assign(h.decisiones, o.dec || {});
  for (const e of o.vistas || []) h.escenas.vistas[e] = 1;
  P.horas = o.horas ?? 11; P.dia = o.dia ?? 30;
  return { P, X, h };
}
const dar = (P, k, c, donde = 'entradas') => { if (donde === 'cosas') P.cosas[k] = (P.cosas[k] || 0) + c; else P.entradas[k] = { dia: 1, hora: 1, cantidad: ((P.entradas[k] && P.entradas[k].cantidad) || 0) + c }; };
const quien = (h, P, X, ctx) => D.escenaPendiente(h, H.estadoHistoria(P, X), ctx);

// ---------------------------------------------------------------- 1. la torta casera
if (va('torta')) {
  const rc = CP.RECETA_PASOS['torta-casera'];
  ok(!!rc && rc.estacion === 'horno' && rc.deEntrada === true, 'la torta casera es una receta del horno de barro y se sabe de entrada');
  ok(CP.recetasDe('horno').map((r) => r.id).join() === 'pan-casero,empanadas,torta-casera', 'el horno tiene tres recetas: pan, empanadas y torta');
  ok(CP.RECETAS_PASOS.length === 10, 'diez recetas en pasos (con la torta)');
  ok(rc && rc.pide.map((x) => x.k).join() === 'harina,huevo,azucar' && rc.da.id === 'torta-casera' && rc.da.n >= 1, 'pide harina, huevos y azúcar (lo que ya existe) y rinde tortas guardables');
  ok(rc && rc.pasos.length >= 3 && rc.pasos[0].id === 'fuego' && rc.pasos[rc.pasos.length - 1].fin === true, 'prender el horno, meterla y sacarla');
  // de verdad, paso a paso, con las reglas de la cocina
  const horno = CP.estacionDeObra('horno');
  const p = { entradas: { huevo: { dia: 1, hora: 1, cantidad: 2 } }, cosas: { harina: 2 }, cocina: CP.cocinaNueva() };
  const falta = CP.empezar('torta-casera', horno, p, 1);
  ok(!falta.ok && falta.falta.some((f) => /azúcar/.test(f)), 'sin azúcar no se puede (el aviso dice qué falta)');
  p.cosas.azucar = 1;
  ok(!CP.empezar('torta-casera', horno, p, 0).ok, 'sin leña tampoco');
  const r = CP.empezar('torta-casera', horno, p, 1, { lluvia: 0.9 });
  ok(r.ok && !r.coccion.aOjo, 'con todo y un tronco empieza (el horno de barro, cerrado, hornea con lluvia)');
  CP.gastarIngredientes(p, r.gasta.ingredientes);
  ok(CP.cuantoHay(p, 'harina') === 0 && CP.cuantoHay(p, 'huevo') === 0 && CP.cuantoHay(p, 'azucar') === 0, 'se gastan la harina, los huevos y el azúcar');
  const c = r.coccion;
  let fin = null;
  for (let i = 0; i < 6 && !fin; i++) { CP.avanzarCoccion(c, 3, horno, 0); const q = CP.hacerPaso(c); if (q.accion === 'fin') fin = q; }
  ok(fin && fin.da.id === 'torta-casera' && fin.da.n === rc.da.n, 'al sacarla salen las tortas');
  p.entradas['torta-casera'] = { dia: 1, hora: 1, cantidad: fin.da.n };
  ok(R.regaloDeProgreso('herminia', p)?.k === 'torta-casera', 'con la torta en la alacena, Herminia tiene su regalo');
  // guardable, comestible, con casilla, en el cuaderno y en la alacena
  ok(CP.esComida('torta-casera') && CP.efectoDeComer('torta-casera')?.descanso >= 1, 'se come (una hora de buen paso)');
  const ra = CP.ranurasCocina(p).find((x) => x.id === 'torta-casera');
  ok(ra && ra.accion === 'comer' && ra.icono === 'torta' && ra.cuenta === fin.da.n, 'tiene casilla en la mochila, con su icono');
  ok(CP.alacenaDe(p).some((x) => x.id === 'torta-casera' && x.forma === 'torta'), 'se ve en la alacena');
  ok(CU.ENTRADA['torta-casera']?.seccion === 'recetas' && /horno/.test(CU.ENTRADA['torta-casera'].pista), 'está en el cuaderno, con su pista');
  ok(/icono|torta\(\)/.test(leer('mochila.js')) && /^    torta\(\) \{/m.test(leer('mochila.js')), 'el icono «torta» está dibujado en la mochila');
  ok(/forma === 'torta'/.test(leer('cocina-mundo.js')) && /torta: 0\.22/.test(leer('cocina-mundo.js')), 'la alacena del mundo sabe dibujarla');
  // lo que se lleva
  ok(R.PARA_LA_TORTA.length === 1 && R.PARA_LA_TORTA[0].k === 'torta-casera', 'PARA_LA_TORTA es la torta casera (antes, lo dulce que se guarda)');
  const q = { entradas: {}, cosas: {} }; dar(q, 'miel', 3); dar(q, 'dulce-leche', 2); dar(q, 'mermelada-pera', 1); dar(q, 'frasco-frutilla', 1);
  ok(R.regaloDeProgreso('herminia', q) === null, 'lo dulce suelto ya no es una torta');
  ok(/torta/.test(R.QUE_LLEVAR_TORTA) && /horno/.test(R.COMO_HACER_TORTA), 'el tablón puede decir qué llevar y cómo se hace');
  // la escena, el disparador y el gasto de UNA
  const dicho = JSON.stringify(ESC['herminia-noventa']);
  ok(dicho.includes('¿Una torta? ¿Para mí?') && !dicho.includes('¿Algo dulce para la torta?'), 'la escena vuelve a decir «¿Una torta? ¿Para mí?»');
  const a = armar('cuaderno');
  ok(quien(a.h, a.P, a.X, { modo: 'hablar', clave: 'abuela' }) !== 'herminia-noventa', 'sin torta, la E sobre Herminia no dispara los noventa');
  dar(a.P, 'miel', 2); dar(a.P, 'dulce-leche', 1);
  ok(quien(a.h, a.P, a.X, { modo: 'hablar', clave: 'abuela' }) !== 'herminia-noventa', 'con miel y dulce de leche, tampoco');
  dar(a.P, 'torta-casera', 2);
  ok(quien(a.h, a.P, a.X, { modo: 'hablar', clave: 'abuela' }) === 'herminia-noventa', 'con la torta casera sí');
  const avisos = [];
  const ctx = { cuanto: (k) => R.cuentaDe(a.P, k), gastar: (k, c2) => R.gastarRegalo(a.P, k, c2), aviso: (t, d) => avisos.push([t, d]) };
  EN.marcarVista(a.h, 'herminia-noventa', 30);
  D.aplicarVistas(a.h, 30, ctx);
  ok(a.P.entradas['torta-casera'].cantidad === 1 && a.P.entradas.miel.cantidad === 2 && a.P.entradas['dulce-leche'].cantidad === 1, 'se gasta UNA torta y nada más');
  ok(avisos.length === 1 && /Le llevaste una torta casera a Herminia/.test(avisos[0][0]), 'el aviso dice qué le llevaste');
  D.aplicarVistas(a.h, 31, ctx);
  ok(a.P.entradas['torta-casera'].cantidad === 1, 'una sola vez');
  const tablon = OP.optativasDelPanel(armar('cuaderno').h, H.estadoHistoria(armar('cuaderno').P, armar('cuaderno').X)).find((x) => x.id === 'noventa');
  ok(tablon && /te falta una torta casera/.test(tablon.texto) && /horno de barro/.test(tablon.texto), 'el tablón «De paso» sin torta: dice que falta y cómo se hace');
}

// ---------------------------------------------------------------- 2. la mochila con las cuatro cosas de la Historia
if (va('mochila')) {
  const ids = ['llave-molino', 'canto-gemelo', 'lampara-eusebio', 'pluma-condor'];
  // son premios de verdad (el jugador los recibe): están en los premios de los capítulos
  const premios = new Set();
  for (const c of H.CAPITULOS) { for (const x of c.premio?.cosas || []) premios.add(x); for (const o of Object.values(c.premioVar?.opciones || {})) for (const x of o.cosas || []) premios.add(x); }
  for (const id of ids) ok(premios.has(id), `«${id}» se da de premio en algún capítulo`);
  const base = () => { const p = G.progresoNuevo(); p.modo = 'relax'; return p; };
  const sin = MO.armarMochila(base(), {});
  for (const id of ids) ok(!sin.some((r) => r.id === id), `sin «${id}» no hay casilla`);
  const p = base(); for (const id of ids) p.cosas[id] = 1;
  const con = MO.armarMochila(p, {});
  for (const id of ids) { const r = con.find((x) => x.id === id); ok(!!r && r.nombre.length > 4 && r.texto.length > 20 && typeof r.icono === 'string', `«${id}»: casilla con nombre, texto e icono`); }
  const iconos = ids.map((id) => con.find((x) => x.id === id)?.icono);
  ok(new Set(iconos).size === 4 && iconos.join() === 'llaveMolino,cantoBlanco,lamparaAceite,plumaCondor', 'cada una con su propio icono (la lámpara no usa el del farol)');
  const src = leer('mochila.js');
  for (const ic of iconos) ok(new RegExp(`^    ${ic}\\(\\) \\{`, 'm').test(src), `el icono «${ic}» está dibujado`);
  // los recuerdos no ocupan casillas (son «cosas» que no se cuentan)
  const CA = await imp('carga.js');
  ok(CA.ocupacion(p, {}).usadas === CA.ocupacion(base(), {}).usadas, 'no ocupan lugar en la mochila');
  // sólo con la historia (Relax): en el Desafío no aparecen
  const d = base(); d.modo = 'desafio'; for (const id of ids) d.cosas[id] = 1;
  ok(ids.every((id) => !MO.armarMochila(d, { }).some((r) => r.id === id)), 'en el Desafío no aparecen');
  // el texto de la mochila no promete lo que no pasa
  ok(!/queda en la repisa/.test(con.filter((r) => ids.includes(r.id)).map((r) => r.texto).join(' ')), 'el texto no dice que quedan en la repisa');
}

// ---------------------------------------------------------------- 3. la tarjeta final en páginas
if (va('final')) {
  const todos = (h) => { for (const k of Object.keys(h.lazos)) h.lazos[k] = 3; return h; };
  const larga = todos(H.historiaNueva()); larga.duendes.trato = 'trato'; larga.decisiones.majada = 'a'; larga.decisiones.cuaderno = 'a'; larga.ramal = 10;
  const T = FIN.tarjetaFinal(larga);
  ok(T.texto.length >= 12 && Array.isArray(T.paginas) && T.paginas.length >= 2, `con los vecinos de la casa la tarjeta se parte en páginas (${T.paginas.length})`);
  ok(T.paginas.flat().join('|') === T.texto.join('|'), 'las páginas son los mismos párrafos, en el mismo orden');
  ok(T.paginas.every((pg) => pg.length >= 1 && pg.reduce((s, x) => s + x.length, 0) <= FIN.TOPE_PAGINA + Math.max(...T.texto.map((x) => x.length))), 'ninguna página pasa del tope (más el párrafo que no se corta)');
  ok(T.paginas.every((pg, i) => i === T.paginas.length - 1 || pg.reduce((s, x) => s + x.length, 0) <= FIN.TOPE_PAGINA), 'las páginas que no son la última entran enteras en el tope');
  ok(T.paginas[T.paginas.length - 1].at(-1) === FIN.PIEZAS_FINAL.siempre && T.paginas[T.paginas.length - 1].length >= 2, 'el cierre va en la última, acompañado');
  const corta = FIN.tarjetaFinal(H.historiaNueva());
  ok(corta.paginas.length === 1, 'el final sin vecinos sigue en una sola página');
  ok(FIN.paginarFinal([]).length === 0 && FIN.paginarFinal(null).length === 0 && FIN.paginarFinal(['a', '', null, 7]).length === 1, 'entradas raras: sin romper');
  // en la UI: «Seguir leyendo» pasa la página; sólo la última trae las salidas y el premio; el capítulo se cierra una sola vez
  const J = crearJuego({ relaxTipo: 'historia' });
  const h = J.P.historia;
  todos(h);
  IDS.slice(0, 12).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: 12, fase: 'outro', empezada: 1 }); h.duendes.trato = 'trato'; h.decisiones.majada = 'a'; h.decisiones.cuaderno = 'a'; h.ramal = 10;
  J.valle.revisarAhora();
  const veces = [];
  let guardia = 0;
  while (J.valle.tarjetas.actual() && guardia++ < 12) {
    const t = J.valle.tarjetas.actual();
    veces.push({ ids: t.opciones.map((o) => o.id).join(), premio: !!t.premio, arriba: t.arriba, parrafos: t.texto.length });
    if (t.opciones.some((o) => o.id === 'sigue')) { ok(h.terminada === 0, 'mientras se lee, el capítulo no se cerró'); J.valle.tarjetas.elegir('sigue'); } else break;
  }
  ok(veces.length === T.paginas.length && veces.slice(0, -1).every((v) => v.ids === 'sigue' && !v.premio), `la tarjeta pasa por sus ${T.paginas.length} páginas, con «Seguir leyendo» y sin premio`);
  ok(veces.at(-1)?.ids === 'seguir,creditos' && veces.at(-1)?.premio === true, 'la última trae el premio y las dos salidas');
  ok(veces.every((v) => /\d de \d/.test(v.arriba)), 'cada página dice en cuál va');
  J.valle.tarjetas.elegir('creditos');
  ok(!J.valle.tarjetas.actual() && h.fase === 'fin' && h.terminada > 0 && J.notas.some((x) => x[0] === 'creditos'), 'al elegir se cierra el capítulo, termina la historia y salen los créditos');
  ok(J.notas.filter((x) => x[0] === 'cobrar').length === 1, 'el premio se cobra una sola vez');
}

// ---------------------------------------------------------------- 4. el objetivo de la deuda
if (va('deuda')) {
  const obj = H.CAPITULOS.find((c) => c.id === 'arco').objetivos.find((o) => o.id === 'deuda');
  const t = (dec) => H.textoObjetivo(obj, { decisiones: dec, escenas: new Set(), lazos: {}, pobladores: new Set(), deuda: 1 });
  ok(/harina/.test(t({ bolsa: 'b', coihue: 'a' })) && !/tablas/.test(t({ bolsa: 'b', coihue: 'a' })) && !/ o /.test(t({ bolsa: 'b', coihue: 'a' })), 'D1 = b: una bolsa de harina (sin «o tablas»)');
  ok(/tablas/.test(t({ bolsa: 'a', coihue: 'b' })) && !/harina/.test(t({ bolsa: 'a', coihue: 'b' })), 'D2 = b: seis tablas');
  ok(/harina/.test(t({ bolsa: 'b', coihue: 'b' })) && /tablas/.test(t({ bolsa: 'b', coihue: 'b' })) && /las dos/.test(t({ bolsa: 'b', coihue: 'b' })) && !/ o /.test(t({ bolsa: 'b', coihue: 'b' })), 'las dos decisiones: hacen falta las dos');
  ok(/harina o seis tablas/.test(t({})), 'sin ninguna (una deuda anotada a mano): la regla de siempre');
  ok(H.loQueSeDebe({ decisiones: { bolsa: 'b', coihue: 'b' } }) === 'una bolsa de harina y seis tablas de coihue (las dos cosas)', 'la frase exacta con las dos');
  // y es lo que la escena cobra (la prueba de la 4.18.4: sólo se ofrece pagar si alcanza para las dos)
  ok(!A3D.puedePagarLoQueSeDebe({ decisiones: { bolsa: 'b', coihue: 'b' }, harina: 1, tablas: 0, tablasCoihue: 0 }), 'con las dos decisiones no alcanza con la harina sola');
  ok(A3D.puedePagarLoQueSeDebe({ decisiones: { bolsa: 'b', coihue: 'b' }, harina: 1, tablas: 6, tablasCoihue: 0 }), 'con las dos cosas, sí');
}

// ---------------------------------------------------------------- 5. ramon-sanitario
if (va('sanitario')) {
  // el diagnóstico: es una mecánica SIN guion. El director de escenas no tiene nada que correr («disparar» da false y por eso los recorridos reales decían «no se pudo
  // disparar»); el juego (historia-ui.js, lanzarEscena) la da por vista sola cuando se cumplen las condiciones del disparador.
  const J = crearJuego({ relaxTipo: 'historia' });
  ok(!J.S.dir.hay('ramon-sanitario') && J.S.dir.disparar('ramon-sanitario') === false, 'el director no tiene escena «ramon-sanitario» (es una mecánica sin guion): disparar a mano no puede andar');
  const caso = (o = {}) => {
    const j = crearJuego({ relaxTipo: 'historia' });
    const { P, X } = j, h = P.historia, i = IDS.indexOf('frios');
    IDS.slice(0, i).forEach((k) => { h.cerrados[k] = 1; });
    Object.assign(h, { activa: true, capitulo: i, fase: 'jugando', empezada: 1, acompanante: o.acompanante === undefined ? 'ramon' : o.acompanante });
    h.escenas.vistas['ramon-cama'] = o.diaCama ?? 28; h.aplicadas['ramon-cama'] = 1; P.dia = o.dia ?? 29; P.horas = o.horas ?? 10;   // (un día después de la cama: sólo el acompañante puede dispararla, no los dos días)
    X.lugares = { plaza: o.plaza ?? 30, puesto: 500, refugio: 400, estacion: 80 };
    for (let k = 0; k < 6; k++) j.valle.actualizar(0.6);
    return { j, h, vista: !!h.escenas.vistas['ramon-sanitario'] };
  };
  const a = caso();
  ok(a.vista && a.h.acompanante === null && a.j.notas.some((x) => /Ramón quedó en el puesto sanitario/.test(x[0])), 'con Ramón de acompañante cerca de la plaza, de día: sale sola, lo suelta y avisa en pantalla');
  ok(a.h.temas['ramon:sanitario'] !== undefined && a.h.hechos['frios:sanitario'] === undefined || H.CAPITULOS.find((c) => c.id === 'frios').objetivos.find((o) => o.id === 'sanitario').hecho(H.estadoHistoria(a.j.P, a.j.X)), 'y el objetivo «sanitario» del capítulo queda cumplido');
  ok(caso({ acompanante: null, dia: 31, diaCama: 29 }).vista, 'si pasaron dos días, Marta ya lo llevó: sale igual');
  ok(!caso({ acompanante: null, dia: 29, diaCama: 28 }).vista, 'sin Ramón y sin los dos días, no');
  ok(!caso({ horas: 22 }).vista && !caso({ horas: 6 }).vista, 'de noche o de madrugada espera a la mañana (de 8 a 21)');
  ok(!caso({ plaza: 400 }).vista, 'lejos de la plaza no sale');
  ok(caso({ horas: 8.1 }).vista && caso({ horas: 20.9 }).vista, 'pero sí a las 8 y a las 21 menos diez');
}

// ---------------------------------------------------------------- 6. los anotados de la 4.18.4
if (va('anotados')) {
  // 6a. «toString»: null (un guardado armado a mano) no tira
  const malo = JSON.parse('{"toString":null}');
  function* rutas(o, pre = [], prof = 0) { if (!o || typeof o !== 'object' || prof > 3) return; for (const k of Object.keys(o)) { yield [...pre, k]; yield* rutas(o[k], [...pre, k], prof + 1); } }
  const lleno = H.historiaNueva();
  Object.assign(lleno, { escenas: { vistas: { a: 1 }, elecciones: { a: { b: 'c' } } }, raro: [{ id: 'x', dia: 1 }], temas: { a: 1 }, optativas: { a: 1 }, oidas: { a: 1 }, panRosa: { quedan: 1, ultimo: 1 }, encargosLazo: { a: 1 }, costumbre: { bolsa: 'vacia', cosechas: 1, regalos: 1, dia: 1 } });
  let tiro = 0, probadas = 0;
  for (const r of rutas(lleno)) {
    const c = JSON.parse(JSON.stringify(lleno)); let q = c; for (const k of r.slice(0, -1)) q = q[k]; q[r[r.length - 1]] = malo; probadas++;
    try { H.sanearHistoria(c); } catch { tiro++; }
  }
  { const c = JSON.parse(JSON.stringify(lleno)); c.raro[0].dia = malo; probadas++; try { H.sanearHistoria(c); } catch { tiro++; } }
  { const c = JSON.parse(JSON.stringify(lleno)); c.raro[0].id = malo; probadas++; try { H.sanearHistoria(c); } catch { tiro++; } }
  { const c = JSON.parse(JSON.stringify(lleno)); c.noche = { estado: 'ganada', intentos: malo, horasAntes: malo }; probadas++; try { H.sanearHistoria(c); } catch { tiro++; } }
  ok(probadas > 80 && tiro === 0, `sanearHistoria no tira con un objeto «toString»: null en ninguno de los ${probadas} lugares (tiró ${tiro})`);
  { let t0 = false; try { const s = H.sanearHistoria({ ...JSON.parse(JSON.stringify(lleno)), toString: null }); t0 = typeof s === 'object'; } catch { t0 = false; } ok(t0, 'ni con la propiedad en la raíz'); }
  { let t0 = false; try { t0 = typeof EN.sanearEscenas({ vistas: { a: malo }, elecciones: {} }) === 'object'; } catch { t0 = false; } ok(t0, 'sanearEscenas tampoco'); }
  // lo de siempre sigue igual: números sueltos y cosas raras, idempotente
  const raro = H.sanearHistoria({ capitulo: '5', lazos: { ramon: '9', ema: -40, rosa: null }, hechos: { 'bolsa:decidir': 'x' }, empezada: 3.7 });
  ok(raro.capitulo === 5 && raro.lazos.ramon === H.LAZO_MAX && raro.lazos.ema === H.LAZO_MIN && raro.lazos.rosa === 0 && raro.empezada === 3, 'los números raros se acotan como siempre');
  ok(JSON.stringify(H.sanearHistoria(JSON.parse(JSON.stringify(raro)))) === JSON.stringify(raro), 'y es idempotente');
  // 6b. el margen de las marcas guardadas
  ok(H.TOPE_MARCAS >= 400, `el tope de marcas guardadas subió (${H.TOPE_MARCAS}): con ~190 de 200 posibles, dos escenas más se perdían al cargar`);
  const m = (k) => Object.fromEntries(Array.from({ length: k }, (_, i) => [`e:escena-${i}:lazo:ramon:1`.slice(0, 63), 1 + (i % 9)]));
  ok(Object.keys(H.sanearHistoria({ aplicadas: m(200) }).aplicadas).length === 200, 'una partida de hasta 200 marcas (las de antes) se carga entera');
  ok(Object.keys(H.sanearHistoria({ aplicadas: m(300) }).aplicadas).length === 300, 'con 300 también (antes se perdían 100)');
  ok(Object.keys(H.sanearHistoria({ aplicadas: m(900) }).aplicadas).length === H.TOPE_MARCAS && Object.keys(H.sanearHistoria({ temas: m(900) }).temas).length === H.TOPE_MARCAS, 'pero con basura sigue habiendo tope');
  // lo que usan las escenas de hoy, con lugar de sobra
  const S = crear({ semilla: 7 }), hh = S.hist();
  const todasAplicadas = new Set();
  const { efectosDe } = await imp('historia-escenas-util.js');
  // (los efectos que se anotan en `aplicadas`: los que cambian algo una sola vez; igual que la prueba de la 4.18.4)
  for (const [id, e] of Object.entries(ESC)) for (const nom of efectosDe(e)) { const tp = nom.split(':')[0]; if (['lazo', 'ramal', 'dar', 'quitar'].includes(tp) || nom === 'duendes:trato-fuerte' || nom.startsWith('duendes:deuda') || nom === 'duendes:vistos') todasAplicadas.add(`e:${id}:${nom}`.slice(0, 63)); }
  ok(todasAplicadas.size + Object.keys(D.EFECTOS_ESCENA).length < H.TOPE_MARCAS / 2, `las marcas que hoy pueden llegar (${todasAplicadas.size + Object.keys(D.EFECTOS_ESCENA).length}) ocupan menos de la mitad del tope`);
  void hh;
  // 6c. código muerto
  const ui = leer('historia-ui.js'), dis = leer('historia-disparadores.js'), a3 = leer('historia-disparadores-acto3.js');
  ok(!/a\.tipo === 'pago'/.test(ui) && !/pagarLaDeuda\(/.test(ui) && !/import \{[^}]*pagarLaDeuda/.test(ui) &&!/if \(o\.pago\)/.test(dis) && !/export function pagarLaDeuda/.test(a3), 'el pago directo de la deuda (tipo «pago», pagarLaDeuda) ya no está');
  ok(/a\.tipo === 'cuidar'/.test(ui) && D.OBJETOS['corral-ramon']?.cuidar === true, 'lo de «cuidar» no era código muerto: sigue (el corral de Ramón, D5 = b)');
  // 6d. el truco «historia capitulo N»
  const mk = () => { const p = G.progresoNuevo(); p.dia = 30; const aj = { relaxTipo: 'libre' }; return { p, m: { desafio: false, progreso: () => p, ajustes: () => aj, jugador: () => ({ pos: { x: 0, y: 0, z: 0 }, yaw: 0 }), reloj: {}, guardar() {}, refrescar() {}, limpiar() {}, lugares: () => [] } }; };
  {
    const { p, m } = mk();
    const r = TR.ejecutar('historia capitulo 10', m);
    const dec = p.historia.decisiones;
    ok(r.ok && ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada'].every((d) => dec[d] === 'a') && dec.duendes === null, 'capitulo 10: toma por la primera opción las decisiones de los capítulos que salta (hasta la D5) y deja la D6 para jugarla');
    ok(/Se tomaron por la primera opción/.test(r.texto) && /no se marcan como vistas/.test(r.texto), 'y lo avisa (con la advertencia de las escenas)');
    ok(p.historia.capitulo === 9 && p.historia.fase === 'intro' && p.historia.activa, 'el capítulo queda como siempre');
    ok(p.historia.duendes.deuda === 0, 'la deuda queda coherente (con las decisiones tomadas por la primera opción no se debe nada)');
  }
  {
    const { p, m } = mk();
    TR.ejecutar('historia capitulo 4', m);
    ok(['bolsa'].every((d) => p.historia.decisiones[d] === 'a') && ['coihue', 'molienda', 'cuaderno', 'majada', 'duendes'].every((d) => p.historia.decisiones[d] === null), 'capitulo 4: sólo la de los capítulos anteriores (la bolsa)');
    p.historia.decisiones.bolsa = 'b';
    const r2 = TR.ejecutar('historia capitulo 6', m);
    ok(p.historia.decisiones.bolsa === 'b' && p.historia.decisiones.coihue === 'a', 'lo que ya estaba decidido no se pisa; lo que falta se toma');
    ok(r2.ok, 'otra vez sin tirar');
    const r3 = TR.ejecutar('historia capitulo 2', m);
    ok(/Siguen tomadas/.test(r3.texto), 'al volver para atrás avisa cuáles de más adelante siguen tomadas');
  }
  {
    const { p, m } = mk();
    const r = TR.ejecutar('historia completar', m);
    ok(r.ok && H.DECISIONES.every((d) => p.historia.decisiones[d] != null) && p.historia.duendes.trato === 'trato', 'completar: las seis decisiones tomadas y el final del trato');
    ok(FIN.tarjetaFinal(p.historia).texto.length >= 3, 'y la tarjeta final se arma');
  }
  ok(Object.values(H.CAPITULO_DE_DECISION).every((id) => IDS.includes(id)) && H.DECISIONES.every((d) => Object.hasOwn(H.CAPITULO_DE_DECISION, d)), 'cada decisión tiene su capítulo');
  for (const d of H.DECISIONES) { const c = H.CAPITULOS.find((x) => x.id === H.CAPITULO_DE_DECISION[d]); ok(c.objetivos.some((o) => { try { return o.hecho({ decisiones: { [d]: 'a' }, escenas: new Set() }) === true && o.hecho({ decisiones: { [d]: null }, escenas: new Set() }) === false; } catch { return false; } }), `el capítulo de la decisión ${d} tiene su objetivo (que se cumple al decidir)`); }
}

// ---------------------------------------------------------------- 7. la conexión con lo de B (las dos optativas nuevas y el final con `solo`)
// B entrega `OPTATIVAS_LAZOS` (historia-escenas-lazos.js) y `finalDeLazos(lazoDe, final)` (historia-texto-lazos.js); el hueco de esta rama no trae las optativas. Acá se prueba la
// conexión con una copia de src/ a la que se le ponen los datos del tablero (las dos optativas, con los ids y las ventanas que B fijó) y un `finalDeLazos` mínimo que dice el final.
if (SEC && SEC.has('conexion')) {   // (sólo en el hijo con los datos de B)
  const OB = OP.OPTATIVAS.find((o) => o.id === 'ultimo-cruce'), OS = OP.OPTATIVAS.find((o) => o.id === 'del-otro-lado');
  ok(!!OB && !!OS, 'las dos optativas de B entran al registro');
  ok(OB && OS && OP.capsDe(OB).join() === 'frios,golpea,arco' && OP.capsDe(OS).join() === 'frios,golpea,arco', 'con la ventana del capítulo 9 al 11 (sin cruzar de acto)');
  ok(OB?.quien === 'belisario' && OS?.quien === 'sofia' && OB?.premio?.lazos?.belisario === 1 && OS?.premio?.lazos?.sofia === 1, 'cada una da un lazo a quien corresponde (si la escena no lo trae)');
  const db = D.DISPARADORES['ultimo-cruce'], ds = D.DISPARADORES['del-otro-lado'], dsh = D.DISPARADORES['del-otro-lado:hablar'];
  ok(db && db.modo === 'hablar' && db.clave === 'belisario' && db.hora.join() === '8,18' && db.requiere.join() === 'los-del-cerro' && db.cap.join() === 'frios,golpea,arco', 'ultimo-cruce: E sobre Belisario, de 8 a 18, con «Los del cerro» vista');
  ok(ds && ds.modo === 'auto' && ds.lugar[0] === 'estudio-fotos' && ds.requiere.join() === 'foto-valle' && dsh && dsh.escena === 'del-otro-lado' && dsh.modo === 'hablar' && dsh.clave === 'fotografa', 'del-otro-lado: llegar al estudio o E sobre Sofía, con «La luz de las cinco» vista');
  const h = H.historiaNueva();
  D.EFECTOS_ESCENA['ultimo-cruce'](h, 40, {}); D.EFECTOS_ESCENA['del-otro-lado'](h, 40, {});
  ok(h.temas['belisario:ultimo-cruce'] !== undefined && h.temas['sofia:del-otro-lado'] !== undefined, 'al verlas queda anotado el tema de cada una');
  const x = H.historiaNueva(); x.duendes.trato = 'pelea';
  ok(FIN.tarjetaFinal(x).texto.includes('final:pelea') && !FIN.tarjetaFinal(x).texto.includes('final:trato'), 'tarjetaFinal le pasa el final de la pelea a finalDeLazos');
  const y = H.historiaNueva(); y.duendes.trato = 'trato';
  ok(FIN.tarjetaFinal(y).texto.includes('final:trato') && !FIN.tarjetaFinal(y).texto.includes('final:pelea'), 'y el del trato');
}
// la copia de src/ con los datos de B (el hueco de esta rama no los trae)
function datosDeB(dir) {
  const fe = join(dir, 'historia-escenas-lazos.js');
  writeFileSync(fe, readFileSync(fe, 'utf8').replace('export const OPTATIVAS_LAZOS = [];', `export const OPTATIVAS_LAZOS = [
  { id: 'ultimo-cruce', escena: 'ultimo-cruce', desde: 'frios', hasta: 'arco', quien: 'belisario', ofrece: { escenas: ['los-del-cerro'] }, disparo: [{ modo: 'hablar', clave: 'belisario', hora: [8, 18] }] },
  { id: 'del-otro-lado', escena: 'del-otro-lado', desde: 'frios', hasta: 'arco', quien: 'sofia', ofrece: { escenas: ['foto-valle'], pobladores: ['fotografa'] }, disparo: [{ modo: 'auto', lugar: 'estudio-fotos', radio: 12, hora: [9, 16.5] }, { modo: 'hablar', clave: 'fotografa', hora: [9, 16.5] }] },
];`));
  const ft = join(dir, 'historia-texto-lazos.js');
  writeFileSync(ft, readFileSync(ft, 'utf8').replace('export function finalDeLazos(lazoDe) {', 'export function finalDeLazos(lazoDe, final) {\n  return [`final:${final}`];\n}\nfunction finalDeLazosViejo(lazoDe) {'));
}
if (!process.env.A4184_SRC) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4190c-'));
  try {
    const dir = join(tmp, 'src');
    cpSync(join(raiz, 'src'), dir, { recursive: true });
    datosDeB(dir);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4190_SECCIONES: 'conexion' }, encoding: 'utf8', timeout: 240000 });
    if (r.status !== 0) console.log(r.stdout.slice(-1500));
    ok(r.status === 0, 'la conexión con lo de B anda (optativas, disparadores, efectos y el final con su firma nueva)');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['cocina-pasos.js', "id: 'torta-casera', nombre: 'Torta casera', estacion: 'horno',", "id: 'torta-casera', nombre: 'Torta casera', estacion: 'cocina-lena',", 'la torta se hace en la cocina a leña', 'torta'],
  ['cocina-pasos.js', "pide: [{ k: 'harina', n: 2 }, { k: 'huevo', n: 2 }, { k: 'azucar', n: 1 }],", "pide: [{ k: 'harina', n: 2 }, { k: 'huevo', n: 2 }],", 'la torta no pide azúcar', 'torta'],
  ['cocina-pasos.js', "  'torta-casera': { nombre: 'Torta casera', porcion:", "  'torta-casera-x': { nombre: 'Torta casera', porcion:", 'la torta no se puede comer', 'torta'],
  ['historia-regalos.js', "  { k: 'torta-casera', n: 1, nombre: 'una torta casera', corto: 'torta casera' },\n];", "  { k: 'torta-casera', n: 1, nombre: 'una torta casera', corto: 'torta casera' },\n  { k: 'miel', n: 1, nombre: 'un frasco de miel', corto: 'miel' },\n];", 'la miel sigue haciendo de torta', 'torta'],
  ['historia-escenas-acto2-c8.js', "¿Una torta? ¿Para mí?", "¿Algo dulce para la torta? ¿Para mí?", 'la escena de Herminia no dice «una torta»', 'torta'],
  ['historia-disparadores-optativas.js', "  ctx?.gastar?.(r.k, r.n);\n", "", 'no se gasta la torta', 'torta'],
  ['mochila.js', "if (progreso.modo !== 'desafio') for (const r of ranurasHistoria(progreso)) ranuras.push(r);", "", 'la mochila no muestra las cosas de la Historia', 'mochila'],
  ['mochila.js', "{ id: 'pluma-condor', nombre: 'Pluma de cóndor', icono: 'plumaCondor',", "{ id: 'pluma-condo', nombre: 'Pluma de cóndor', icono: 'plumaCondor',", 'la pluma de cóndor no tiene su casilla', 'mochila'],
  ['mochila.js', "icono: 'lamparaAceite', texto:", "icono: 'farol', texto:", 'la lámpara usa el icono del farol', 'mochila'],
  ['historia-final.js', "export const TOPE_PAGINA = 620;", "export const TOPE_PAGINA = 99999;", 'la tarjeta final no se parte', 'final'],
  ['historia-ui.js', "premio: ultima && premioDeCapitulo(c, h)?.texto ?", "premio: premioDeCapitulo(c, h)?.texto ?", 'el premio sale en todas las páginas', 'final'],
  ['historia-ui.js', "alElegir: (id) => { if (id === 'sigue') { pagina(i + 1); return true; } return cerrarFinal(id); },", "alElegir: (id) => cerrarFinal(id),", 'Seguir leyendo cierra el capítulo', 'final'],
  ['historia.js', "  if (harina && tablas) return 'una bolsa de harina y seis tablas de coihue (las dos cosas)';\n", "", 'la deuda con las dos decisiones no dice las dos', 'deuda'],
  ['historia.js', "texto: (s) => `Pagá lo que debés del trato: ${loQueSeDebe(s)}, en la raíz del coihue (o el tocón)`,", "texto: () => 'Pagá lo que debés del trato: una bolsa de harina o seis tablas, en la raíz del coihue (o el tocón)',", 'el objetivo de la deuda dice «harina o tablas»', 'deuda'],
  ['historia-disparadores-acto3.js', "cond: (s, h) => s.acompanante === 'ramon' || s.dia >= diaVista(h, 'ramon-cama') + 2 },", "cond: (s, h) => s.dia >= diaVista(h, 'ramon-cama') + 2 },", 'Ramón de acompañante no dispara el puesto sanitario', 'sanitario'],
  ['historia-disparadores-acto3.js', "lugar: en('plaza', 60), hora: [8, 21], cond: (s, h) => s.acompanante", "lugar: en('plaza', 60), hora: [8, 9], cond: (s, h) => s.acompanante", 'el puesto sanitario sólo a las 8', 'sanitario'],
  ['historia-ui.js', "if (typeof dir.hay === 'function' && !dir.hay(id)) { marcarVista(h, id, ctx.progreso().dia); aplicarEscenas(h); return true; }", "", 'una escena sin guion nunca se da por vista', 'sanitario'],
  ['historia.js', "const aNum = (v) => { try { return Number(v); } catch { return NaN; } };", "const aNum = (v) => Number(v);", 'sanearHistoria tira con «toString»: null', 'anotados'],
  ['escenas.js', "try { x = Number(v); } catch { return d; }", "x = Number(v);", 'sanearEscenas tira con «toString»: null', 'anotados'],
  ['historia-noche.js', "const aNum = (v) => { try { return Number(v); } catch { return NaN; } };", "const aNum = (v) => Number(v);", 'la noche guardada tira con «toString»: null', 'anotados'],
  ['historia.js', "export const TOPE_MARCAS = 400;", "export const TOPE_MARCAS = 200;", 'el tope de marcas vuelve a 200', 'anotados'],
  ['trucos.js', "    const tomadas = tomarPorDefecto(h, idx, dia);\n", "    const tomadas = [];\n", 'el truco no toma las decisiones', 'anotados'],
  ['trucos.js', "    if (tomarDecision(h, d, 'a', null, dia)) r.push(d);", "    if (tomarDecision(h, d, 'b', null, dia)) r.push(d);", 'el truco toma la segunda opción', 'anotados'],
  ['trucos.js', "  if (quedan.length) t += ", "  if (false) t += ", 'el truco no avisa de las que siguen tomadas', 'anotados'],
  ['historia-disparadores.js', "  if (o.cuidar) return {", "  if (o.pago) return { tipo: 'pago', aviso: o.aviso };\n  if (o.cuidar) return {", 'vuelve el tipo de objeto «pago»', 'anotados'],
  ['historia-optativas.js', "for (const d of OPTATIVAS_LAZOS) { const o = optativaDeLazo(d); if (o && !OPTATIVAS.some((x) => x.id === o.id)) OPTATIVAS.push(o); }", "", 'las optativas de B no entran al registro', 'conexion', true],
  ['historia-disparadores-optativas.js', "  ...OPTATIVAS_LAZOS.reduce((r, d) => ({ ...r, ...disparadoresDeLazo(d) }), {}),", "", 'las optativas de B no tienen disparador', 'conexion', true],
  ['historia-disparadores-optativas.js', "map((d) => [d.escena, T(d.quien, d.id)])),", "map((d) => [d.escena, T('ramon', d.id)])),", 'el tema de las optativas de B va a nombre de Ramón', 'conexion', true],
  ['historia-final.js', "r = finalDeLazos((q) => lazoDe(h, q), trato === 'pelea' ? 'pelea' : 'trato');", "r = finalDeLazos((q) => lazoDe(h, q));", 'finalDeLazos no sabe el final', 'conexion', true],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4190-'));
  try {
    for (const [arch, de, a, que, secc, conB] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      if (conB) datosDeB(dir);
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4190_CALLADO: '1', A4190_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}
void ES; void NO; void E;

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.19.0 (A) torta, mochila, final en páginas, deuda, puesto sanitario y anotados · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
