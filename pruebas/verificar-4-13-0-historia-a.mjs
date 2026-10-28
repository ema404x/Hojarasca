// 4.13.0 (agente A): los duendes en la Historia: presencia de lejos (capítulos 5 y 6), el encuentro del galpón con elección (trato o pelea) y las
// misiones de las armas (arco y honda). Código y reglas (sin placa); la partida real está en pruebas/humo-4-13-0-historia-a.cjs.
//   1. lo guardado: `progreso.historia.duendes` (default seguro, basura, partidas viejas) y el hito «noche pendiente»;
//   2. los capítulos: el encuentro cuelga del capítulo 5 (en el lugar, de noche) y las armas del 7; no se rompe el recorrido;
//   3. los eventos: el galpón (trato y pelea), el arco y la honda, nunca al azar, con sus seguimientos encadenados;
//   4. la presencia: ventanas de hora, puntos en el abanico, la vista, el galpón;
//   5. la infraestructura: sólo con Historia, la voz sólo durante la llamada, los duendes sueltos se reciclan;
//   6. el enganche con el juego (carga, después de lo de la gente, sin tocar el Desafío ni la risa del Relax).
// Al final: mutaciones (se rompe a propósito el código y la prueba tiene que fallar).
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
let callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const lienzo = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ getContext: () => lienzo, width: 0, height: 0, style: {} }) };
const THREE = await import('three');

// Todo el chequeo vive en una función: se corre con el código de verdad y con cada mutación
async function chequear(sufijo = '') {
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', sufijo === '.mut' && f === 'historia.js' ? 'historia.mut.js' : f)).href);
  const H = await imp('historia.js');
  const E = await import('../src/eventos-valle.js');
  const P = await import(sufijo && sufijo.startsWith('.p') ? pathToFileURL(join(raiz, 'src', `historia-presencia${sufijo}.js`)).href : '../src/historia-presencia.js');
  const D = await import(sufijo && sufijo.startsWith('.d') ? pathToFileURL(join(raiz, 'src', `historia-duendes${sufijo}.js`)).href : '../src/historia-duendes.js');
  const f0 = fallas;

  // ---------------------------------------------------------------- 1. lo guardado
  {
    const d0 = H.duendesNuevos();
    igual(d0, { trato: null, vistos: 0, regalos: 0, armas: { arco: false, honda: false }, noche: 'ninguna', final: null, intentos: 0, deuda: 0, perdon: false, convidado: 0 }, 'el esquema nuevo (4.15.0: y deuda, perdón y convidado)');
    igual(H.sanearHistoria(null).duendes, d0, 'una historia nueva trae los duendes en blanco');
    igual(H.sanearHistoria({ activa: true, capitulo: 2 }).duendes, d0, 'una partida vieja (sin duendes) abre con el default');
    for (const basura of [null, 7, 'x', [], { trato: 'otro', vistos: -4, regalos: 99, armas: { arco: 1, honda: 'si' }, noche: 'rara', final: 'x', intentos: -1 }, { armas: [] }]) {
      const d = H.sanearHistoria({ duendes: basura }).duendes;
      ok(d.trato === null && d.noche === 'ninguna' && d.final === null && d.vistos >= 0 && d.regalos <= H.REGALOS_TOPE && d.intentos >= 0, `basura ${JSON.stringify(basura)}`);
      ok(d.armas.arco === false && d.armas.honda === false, `las armas sólo valen con true (${JSON.stringify(basura)})`);
    }
    const bueno = { trato: 'pelea', vistos: 3, regalos: 2, armas: { arco: true, honda: false }, noche: 'pendiente', final: 'trato', intentos: 4, deuda: 1, perdon: true, convidado: 2 };
    igual(H.sanearHistoria({ duendes: bueno }).duendes, bueno, 'lo bueno se conserva');
    igual(H.sanearHistoria({ duendes: { ...bueno, regalos: 50 } }).duendes.regalos, H.REGALOS_TOPE, 'los regalos tienen tope');
    // el trato y las armas
    const h = H.sanearHistoria(null);
    ok(!H.hacerTrato(h, 'otro') && h.duendes.trato === null, 'un trato inventado no vale');
    ok(H.hacerTrato(h, 'trato') && h.duendes.trato === 'trato', 'el trato queda');
    ok(!H.ganarArma(h, 'lanza') && !h.duendes.armas.arco, 'un arma inventada no vale');
    ok(!H.revisarNoche(h) && h.duendes.noche === 'ninguna', 'sin armas la noche no queda pendiente');
    H.ganarArma(h, 'arco');
    ok(!H.revisarNoche(h), 'con una sola arma, tampoco');
    H.ganarArma(h, 'honda');
    ok(H.revisarNoche(h) && h.duendes.noche === 'pendiente', 'con el trato y las dos armas la noche queda pendiente');
    h.duendes.noche = 'ganada';
    ok(!H.revisarNoche(h) && h.duendes.noche === 'ganada', 'una noche jugada no se pisa');
    const h2 = H.sanearHistoria(null);
    H.ganarArma(h2, 'arco'); H.ganarArma(h2, 'honda');
    ok(!H.revisarNoche(h2), 'sin encuentro la noche no queda pendiente');
    const viejo = { activa: true }; // sin duendes ni nada
    ok(H.duendesDe(viejo).trato === null, 'duendesDe crea lo que falta');
    // el estado que mira la historia
    const s = H.estadoHistoria({ historia: { duendes: { trato: 'pelea', armas: { arco: true, honda: false } } } }, {});
    ok(s.trato === 'pelea' && s.armas.arco === true && s.armas.honda === false, 'el estado trae el trato y las armas');
    ok(H.estadoHistoria({}, {}).trato === null && H.estadoHistoria({}, {}).armas.arco === false, 'y sin nada, en blanco');
  }

  // ---------------------------------------------------------------- 2. los capítulos
  {
    // 4.15.0: la Historia nueva tiene trece capítulos y el encuentro del galpón y las armas son de los capítulos 10 y 11, que vienen en una versión
    // que sigue. Lo que mira esta sección es la MECÁNICA de historia.js (el momento con lugar, la presencia, el arma por pedir), con dos capítulos de
    // prueba iguales a los del lago y el invierno de la Historia vieja, subidos al final de la lista.
    igual(H.CAPITULOS.map((c) => c.id).slice(0, 4), ['llave', 'bolsa', 'mesa', 'ramal'], 'los capítulos de la historia nueva');
    ok(H.CAPITULOS.length >= 13, 'trece o más capítulos');
    const desde = (s, b, k) => Math.max(0, (Number(s[k]) || 0) - (Number(b?.[k]) || 0));
    const iLago = H.CAPITULOS.push({
      id: 'lago', titulo: 'El lago', intro: ['Esa semana, al caer la tarde, desde los árboles de la orilla llega una risa finita, como de chicos. Nicanor dice que son zorros. Los zorros no se ríen.'],
      objetivos: [
        { id: 'pez', tecla: 'Q', texto: 'Pescá una trucha', hecho: (s, b) => desde(s, b, 'peces') >= 1 },
        { id: 'varadero', tecla: 'O', texto: 'Construí un varadero', hecho: (s) => s.terminadas.has('varadero-velero') },
        { id: 'navegar', tecla: 'E', texto: 'Salí a navegar', hecho: (s) => s.enVela },
        { id: 'duendes', tecla: '·', delMomento: true, texto: 'Al anochecer, pasá por el Galpón de Esquila', hecho: (s) => s.eventos.has('duendes-galpon') },
      ],
      momento: { evento: 'duendes-galpon', cuando: 'resto', lugar: 'galpon' }, outro: ['x'], premio: { materiales: { tabla: 8 }, texto: 'Ocho tablas' },
    }) - 1;
    const iInv = H.CAPITULOS.push({
      id: 'invierno', titulo: 'Antes del invierno', intro: ['x'],
      objetivos: [{ id: 'armas', tecla: '·', delMomento: true, texto: 'Conseguí un arco y una honda', vecinos: true, meta: 2, cuenta: (s) => (s.armas.arco ? 1 : 0) + (s.armas.honda ? 1 : 0) }],
      momento: { evento: 'arco-josefina', cuando: 'pronto' }, outro: ['x'], premio: { materiales: { tronco: 6 }, texto: 'Seis troncos' },
    }) - 1;
    H.CAPITULO.lago = H.CAPITULOS[iLago]; H.CAPITULO.invierno = H.CAPITULOS[iInv];
    const lago = H.CAPITULO.lago, inv = H.CAPITULO.invierno;
    ok(lago.momento?.evento === 'duendes-galpon' && lago.momento.lugar === 'galpon' && lago.momento.cuando === 'resto', 'el encuentro es un momento en el galpón y al final');
    ok(lago.objetivos.some((o) => o.id === 'duendes' && o.delMomento), 'y su objetivo espera el momento');
    ok(inv.momento?.evento === 'arco-josefina' && inv.objetivos.some((o) => o.id === 'armas' && o.delMomento && o.vecinos && o.meta === 2), 'las armas son un objetivo con su momento');
    const objArmas = inv.objetivos.find((o) => o.id === 'armas');
    ok(objArmas.cuenta({ armas: { arco: true, honda: false } }) === 1 && objArmas.cuenta({ armas: { arco: true, honda: true } }) === 2 && objArmas.cuenta({ armas: { arco: false, honda: false } }) === 0, 'el objetivo cuenta las armas');
    ok(/risa/.test(lago.intro.join(' ')) && !/enemig|monstruo|ataque/i.test(lago.intro.join(' ')), 'la intro deja el misterio sin decir que son enemigos');
    // el recorrido: el momento sale cuando lo demás está hecho
    const hh = H.sanearHistoria({ activa: true, capitulo: iLago, fase: 'jugando', empezada: 1, base: { dia: 1 }, hechos: { 'lago:pez': 3, 'lago:varadero': 3 } });
    const base = H.estadoHistoria({ dia: 5, horas: 20, eventosValle: { hechos: {} } }, {});
    ok(H.momentoPendiente(hh, base) === null, 'con el velero sin navegar, el encuentro todavía no');
    hh.hechos['lago:navegar'] = 4;
    ok(H.momentoPendiente(hh, base) === 'duendes-galpon', 'hechos el pez, el varadero y el velero: toca el galpón');
    const luego = H.estadoHistoria({ dia: 5, horas: 20, eventosValle: { hechos: { 'duendes-galpon': { dia: 5, opcion: 'comida' } } } }, {});
    const r = H.revisarHistoria(hh, luego);
    ok(r.completo && hh.fase === 'outro', 'elegido el encuentro, el capítulo se completa');
    // la presencia de lejos: los capítulos 6 a 8 de la historia nueva (los indicios del acto II)
    ok(H.hayPresencia(H.sanearHistoria({ activa: true, capitulo: 5 })) && H.hayPresencia(H.sanearHistoria({ activa: true, capitulo: 6 })) && H.hayPresencia(H.sanearHistoria({ activa: true, capitulo: 7 })), 'hay presencia en los capítulos 6, 7 y 8');
    ok(!H.hayPresencia(H.sanearHistoria({ activa: true, capitulo: 0 })) && !H.hayPresencia(H.sanearHistoria({ activa: true, capitulo: 8 })) && !H.hayPresencia(H.sanearHistoria({ capitulo: 5 })), 'y no en los otros, ni con la historia en pausa');
    // armaPorPedir (con el capítulo de prueba)
    const ha = H.sanearHistoria({ activa: true, capitulo: iInv, fase: 'jugando', empezada: 1, momentos: { invierno: 'lanzado' } });
    const sa = (arco, honda) => ({ vecinos: true, armas: { arco, honda } });
    ok(H.armaPorPedir(ha, sa(false, false), []) === 'arco-josefina', 'sin armas ni nada pendiente: se vuelve a pedir el arco');
    ok(H.armaPorPedir(ha, sa(true, false), []) === 'honda-ramon', 'con el arco: la honda');
    ok(H.armaPorPedir(ha, sa(true, false), ['s-honda-ramon']) === null, 'con el seguimiento agendado: nada');
    ok(H.armaPorPedir(ha, sa(true, true), []) === null && H.armaPorPedir(ha, { ...sa(false, false), vecinos: false }, []) === null, 'con las dos o sin vecinos: nada');
    ok(H.armaPorPedir(H.sanearHistoria({ activa: true, capitulo: 3, fase: 'jugando' }), sa(false, false), []) === null, 'fuera de ese capítulo: nada');
    // los capítulos de prueba salen de la lista para lo que sigue
    H.CAPITULOS.splice(iLago, 2); delete H.CAPITULO.lago; delete H.CAPITULO.invierno;
  }

  // ---------------------------------------------------------------- 3. los eventos
  {
    for (const id of ['duendes-galpon', 'arco-josefina', 'honda-ramon']) {
      const e = E.EVENTO_VALLE[id];
      ok(e && e.soloHistoria && e.cuando({ dia: 99 }) === false, `${id}: sólo de la Historia, nunca al azar`);
      ok(!E.posibles(E.sanearEventosValle(null), { dia: 50, horas: 12, vecinos: true, viaje: true, sembrados: 3 }).some((x) => x.id === id), `${id}: no entra en los posibles`);
      for (const o of e.opciones) ok(o.diario && o.texto && o.detalle, `${id}.${o.id}: con diario y textos`);
    }
    const g = E.EVENTO_VALLE['duendes-galpon'];
    const tr = (o) => g.opciones.find((x) => x.id === o).efectos.find((f) => f.tipo === 'duendes')?.trato;
    ok(g.opciones.length >= 2 && g.opciones.length <= 3, 'el galpón tiene dos o tres opciones');
    ok(tr('comida') === 'trato' && tr('senal') === 'trato' && tr('espantar') === 'pelea', 'comida y señal son trato; espantar es pelea');
    ok(!/[«"]\w+[^«»]*»/.test(g.texto) || !/dijo|dice|pregunt/i.test(g.texto), 'los duendes no hablan en el encuentro');
    ok(!/dios|santo|virgen|bendi|diablo/i.test(JSON.stringify(g)) , 'nada religioso');
    // el arco encadena a la honda; el «todavía no» vuelve a preguntar
    const ev = E.sanearEventosValle(null);
    E.forzarEvento(ev, 'arco-josefina', 20);
    const r1 = E.elegirOpcion(ev, 'hacer', 20, { materiales: { tabla: 4, tronco: 1 }, cosas: {}, ramitas: 0 });
    ok(r1.ok && r1.efectos.some((f) => f.tipo === 'arma' && f.id === 'arco') && ev.pendientes.some((p) => p.id === 's-honda-ramon'), 'hacer el arco: queda el arco y viene la honda');
    const falta = E.elegirOpcion((() => { const e2 = E.sanearEventosValle(null); E.forzarEvento(e2, 'arco-josefina', 20); return e2; })(), 'hacer', 20, { materiales: {}, cosas: {}, ramitas: 0 });
    ok(falta.ok === false && falta.falta.length === 2, 'sin madera no se puede hacer');
    const c1 = E.cerrarSeguimiento(ev, 's-honda-ramon', 21, { vecinos: true });
    ok(c1.cadena?.id === 'honda-ramon', 'el seguimiento trae la honda');
    const r2 = E.elegirOpcion(ev, 'luego', 21, null);
    ok(r2.ok && ev.pendientes.some((p) => p.id === 's-honda-otra-vez'), 'el «todavía no» agenda la vuelta');
    const c2 = E.cerrarSeguimiento(ev, 's-honda-otra-vez', 22, { vecinos: true });
    ok(c2.cadena?.id === 'honda-ramon', 'y la vuelta repite la pregunta (repite: 1)');
    const r3 = E.elegirOpcion(ev, 'hacer', 22, { materiales: { piedra: 5 }, cosas: {}, ramitas: 4 });
    ok(r3.ok && r3.efectos.some((f) => f.tipo === 'arma' && f.id === 'honda'), 'hacer la honda');
    ok(E.faltaPara(E.EVENTO_VALLE['honda-ramon'].opciones[0].pide, { materiales: { piedra: 5 }, ramitas: 3 }).length === 1, 'la honda pide cuatro ramitas');
    ok(E.resumenEventos(E.sanearEventosValle(null)).includes(String(E.EVENTOS_VALLE.filter((e) => !e.soloHistoria).length)), 'el resumen no cuenta los de la Historia entre los que pueden pasar');
    const sinVec = E.seguimientoDe(E.sanearEventosValle(null), 's-arco-otra-vez', { vecinos: false });
    ok(sinVec.evento === null, 'sin vecinos no se encadena');
  }

  // ---------------------------------------------------------------- 4. la presencia
  {
    ok(P.enVentana(19, P.VENTANAS.silueta) && !P.enVentana(12, P.VENTANAS.silueta) && !P.enVentana(22.5, P.VENTANAS.silueta), 'el anochecer');
    ok(P.enVentana(23, P.VENTANAS.risa) && P.enVentana(2, P.VENTANAS.risa) && !P.enVentana(4.5, P.VENTANAS.risa) && !P.enVentana(15, P.VENTANAS.risa), 'la risa cruza la medianoche');
    ok(P.enVentana(25, P.VENTANAS.risa) === P.enVentana(1, P.VENTANAS.risa) && P.enVentana(-1, P.VENTANAS.risa), 'las horas fuera de rango se acomodan');
    ok(P.enVentana(18, P.VENTANAS.galpon) && P.enVentana(0, P.VENTANAS.galpon) && !P.enVentana(10, P.VENTANAS.galpon), 'el galpón: de noche');
    ok(P.enVentana(7, P.VENTANAS.regalo) && !P.enVentana(14, P.VENTANAS.regalo), 'los regalitos: a la mañana');
    const yo = { x: 10, z: -4 };
    for (let i = 0; i < 40; i++) {
      const a = (i * 0.157) % 6.28;
      const p = P.puntoEnAbanico(yo, a, () => (i % 7) / 7 + 0.01, P.TIEMPOS.distSilueta);
      const d = Math.hypot(p.x - yo.x, p.z - yo.z);
      ok(d >= P.TIEMPOS.distSilueta[0] - 1e-6 && d <= P.TIEMPOS.distSilueta[1] + 1e-6, `el punto está a la distancia pedida (${d.toFixed(1)})`);
      ok(P.enLaVista(yo, a, p, 1.0), 'y a la vista');
    }
    ok(!P.enLaVista({ x: 0, z: 0 }, 0, { x: 0, z: -20 }) && P.enLaVista({ x: 0, z: 0 }, 0, { x: 3, z: 20 }), 'lo de atrás no se ve; lo de adelante sí');
    ok(P.enLaVista({ x: 0, z: 0 }, Math.PI - 0.1, { x: 0, z: -20 }), 'la vuelta de ±π');
    const g = { x: 100, z: 50, rot: 0 };
    igual(P.delGalpon(g, 2, -6), { x: 102, z: 44 }, 'un punto del galpón, sin giro');
    const q = P.delGalpon({ ...g, rot: Math.PI / 2 }, 0, -6);
    ok(Math.abs(q.x - 94) < 1e-9 && Math.abs(q.z - 50) < 1e-9, 'y girado un cuarto');
    ok(P.TIEMPOS.huyeConTrato < P.TIEMPOS.huyeSinTrato, 'con trato dejan acercarse más');
    ok(P.TIEMPOS.vidaSilueta <= 60 && P.TIEMPOS.luces <= 3, 'pocos y poco tiempo (rendimiento)');
  }

  // ---------------------------------------------------------------- 5. la infraestructura
  {
    ok(D.hayHistoria({ relaxTipo: 'historia' }, null) && D.hayHistoria({ relaxTipo: 'libre' }, { activa: true }) && !D.hayHistoria({ relaxTipo: 'libre' }, { activa: false }) && !D.hayHistoria(null, null), 'sólo hay duendes con la Historia en marcha');
    // la voz: relax apagado sólo durante la llamada
    const vistas = [];
    const sonido = { ctx: {}, relax: true, risaDuende() { vistas.push(this.relax); return { dur: 1 }; }, prepararRisa() {} };
    D.reirDuende(sonido, { x: 1, z: 1 }, {});
    ok(vistas[0] === false && sonido.relax === true, 'la risa suena con relax apagado y lo devuelve');
    const roto = { ctx: {}, relax: true, risaDuende() { throw new Error('x'); } };
    try { D.reirDuende(roto, {}, {}); } catch { /* ya */ }
    ok(roto.relax === true, 'aun si falla, relax vuelve');
    ok(D.reirDuende(null, {}, {}) === 0 && D.reirDuende({ relax: true }, {}, {}) === 0, 'sin audio no hace nada');
    const pedidas = [];
    D.prepararVozDuende({ ctx: {}, prepararRisa: (c, k) => pedidas.push(`${c}${k}`) }, ['chico']);
    ok(pedidas.length === 6, 'se piden las seis risas de la clase');
    // un duende suelto de punta a punta
    const escena = new THREE.Scene();
    let activo = false;
    const dh = D.crearDuendesHistoria({ escena, altura: () => 0, jugador: () => ({ x: 0, z: 0 }), activo: () => activo });
    ok(dh.paraCompilar() === false && !dh.listo() && dh.aparecer('rastreador', { x: 5, z: 5 }) === null, 'sin Historia no instala ni crea nada');
    activo = true;
    ok(dh.paraCompilar() === true && dh.listo(), 'con Historia instala y precalienta');
    const d = dh.aparecer('rastreador', { x: 20, z: 20, mira: true });
    ok(d && d.estado === 'mirando' && dh.cantidad() === 1 && d.m.g.parent === escena, 'aparece, mira y está en la escena');
    for (let i = 0; i < 30; i++) dh.actualizar(0.05);
    const dif = Math.abs(((d.rumbo - Math.atan2(-20, -20) + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    ok(dif < 0.1, `mira al jugador (${dif.toFixed(2)})`);
    d.irA(25, 20);
    for (let i = 0; i < 200 && d.estado === 'yendo'; i++) dh.actualizar(0.05);
    ok(d.estado !== 'yendo' && Math.hypot(d.x - 25, d.z - 20) < 0.5, 'camina hasta el punto');
    d.huir(null, { desaparecer: true });
    for (let i = 0; i < 40; i++) dh.actualizar(0.05);
    ok(Math.hypot(d.x, d.z) > Math.hypot(25, 20) + 5, 'huye alejándose del jugador');
    for (let i = 0; i < 200; i++) dh.actualizar(0.05);
    ok(d.estado === 'fuera' && dh.cantidad() === 0 && !d.m.g.parent, 'se esconde y sale de la escena');
    const d2 = dh.aparecer('rastreador', { x: 3, z: 3 });
    ok(d2.m === d.m, 'los duendes se reciclan (no gastan filas de la textura)');
    d2.saludar(1); dh.actualizar(0.1);
    ok(d2.estado === 'saludando', 'saluda');
    for (let i = 0; i < 40; i++) dh.actualizar(0.05);
    ok(d2.estado === 'quieto', 'y vuelve a quedarse quieto');
    for (let i = 0; i < D.MAXIMO + 3; i++) dh.aparecer('rastreador', { x: i, z: 0 });
    ok(dh.cantidad() <= D.MAXIMO, 'el tope de duendes sueltos');
    dh.limpiar();
    ok(dh.cantidad() === 0, 'limpiar saca a todos');
  }

  // ---------------------------------------------------------------- 6. el enganche
  {
    const main = leer('src/main.js'), ui = leer('src/historia-ui.js'), evui = leer('src/eventos-valle-ui.js'), pres = leer('src/historia-presencia.js'), duen = leer('src/historia-duendes.js');
    ok(main.indexOf('gente?.trasCompilar?.();') < main.indexOf('duendesHistoria()?.paraCompilar();') && main.indexOf('duendesHistoria()?.paraCompilar();') < main.indexOf('prearmarAldea();   // 3.7.0 (integración)'), 'los duendes de la historia se instalan en la carga, DESPUÉS de lo de la gente (si no, la sombra del jugador se compila tarde)');
    ok(/if \(!esDesafio\) return|if \(esDesafio\) return null;/.test(main.slice(main.indexOf('function duendesHistoria()'), main.indexOf('function presenciaHistoria()'))), 'nada de esto en el Desafío');
    ok(main.includes('duendesHist.actualizar(dt)') && main.includes('presenciaHist?.actualizar(dt)'), 'se actualiza cada cuadro');
    ok(main.includes('alActivarHistoria:') && ui.includes('ctx.alActivarHistoria?.()'), 'al empezar la Historia desde la pausa se arma bajo la pausa');
    ok(ui.includes('revisarNoche(h)') && ui.includes('armaPorPedir(h, s,') && ui.includes('lugarOk'), 'la historia revisa la noche, las armas y el lugar');
    ok(/case 'duendes':[\s\S]*hacerTrato[\s\S]*case 'arma':[\s\S]*ganarArma/.test(evui), 'los efectos guardan el trato y las armas');
    ok(!/sonido\.relax\s*=\s*(false|!esDesafio)/.test(pres) && /sonido\.relax = false;[\s\S]*finally \{ sonido\.relax = antes; \}/.test(duen), 'la risa de los duendes enciende la voz sólo en la llamada');
    ok(main.includes('sonido.relax = !esDesafio;'), 'el Relax sigue mudo (la decisión de la 3.8.5)');
    ok(!/esDesafio|desafio.js|desafio-reglas/.test(pres + duen), 'no se mezclan reglas del Desafío');
    ok(!/export (?:const|function) w*ñ/.test(duen + pres + leer('src/historia.js')), 'identificadores exportados sin ñ');
    ok(!/\b(?:the|you|your)\b/i.test(leer('src/eventos-valle.js').split('4.13.0')[1] || ''), 'sin inglés');
  }
  return fallas - f0;
}

const base = await chequear();
ok(base === 0, 'el código de verdad pasa todo');

// ---------------------------------------------------------------- mutaciones
// Se rompe una cosa a la vez y se vuelve a correr todo: tiene que fallar.
const MUT = [
  ['historia.js', 'if (d.noche !== \'ninguna\' || !d.trato || !d.armas.arco || !d.armas.honda) return false;', 'if (d.noche !== \'ninguna\' || !d.armas.arco) return false;', 'la noche pendiente sin exigir encuentro y las dos armas'],
  ['historia.js', "d.trato = v.trato === 'trato' || v.trato === 'pelea' ? v.trato : null;", 'd.trato = v.trato || null;', 'el saneado acepta cualquier trato'],
  ['historia.js', "d.armas.arco = a.arco === true; d.armas.honda = a.honda === true;", 'd.armas.arco = !!a.arco; d.armas.honda = !!a.honda;', 'las armas valen con cualquier cosa'],
  ['historia.js', '  h.duendes = sanearDuendes(v.duendes);', '', 'sanearHistoria descarta los duendes'],
  ['historia.js', "export const CAPITULOS_CON_PRESENCIA = ['perdido', 'cosecha', 'cuaderno'];", "export const CAPITULOS_CON_PRESENCIA = ['perdido', 'cosecha', 'cuaderno', 'frios'];", 'presencia también en el invierno'],
  ['historia.js', "if (m.cuando === 'resto' && !c.objetivos.every((o) => o.delMomento || h.hechos[`${c.id}:${o.id}`] !== undefined)) return null;", "", 'el momento sale sin esperar a lo demás'],
  ['historia.js', "if (!s.armas.arco) return 'arco-josefina';", "if (!s.armas.arco) return 'honda-ramon';", 'se pide la honda primero'],
  ['historia.js', 'd.regalos = Math.max(0, Math.min(REGALOS_TOPE,', 'd.regalos = Math.max(0, Math.min(1e6,', 'regalos sin tope'],
  ['historia-presencia.js', 'huyeSinTrato: 16, huyeConTrato: 8,', 'huyeSinTrato: 8, huyeConTrato: 16,', 'el trato y la pelea al revés al huir'],
  ['historia-presencia.js', "risa: [21, 4],", "risa: [9, 12],", 'la risa de día'],
  ['historia-presencia.js', 'return desde <= hasta ? h >= desde && h < hasta : h >= desde || h < hasta;', 'return h >= desde && h < hasta;', 'las ventanas no cruzan la medianoche'],
  ['historia-presencia.js', 'Math.abs(d) <= medio', 'Math.abs(d) >= medio', 'la vista al revés'],
  ['historia-presencia.js', 'x: g.x + lx * Math.cos(g.rot) + lz * Math.sin(g.rot)', 'x: g.x + lx * Math.cos(g.rot) - lz * Math.sin(g.rot)', 'el punto del galpón girado al revés'],
  ['historia-duendes.js', 'sonido.relax = antes;', 'sonido.relax = false;', 'la risa deja el Relax con voz'],
  ['historia-duendes.js', 'if (!listo() || !activo()) return null;', 'if (!listo()) return null;', 'duendes sin Historia'],
  ['historia-duendes.js', 'if (!activo()) return false;\n    if (!instalado)', 'if (!instalado)', 'instalar sin Historia'],
  ['historia-duendes.js', '(libres[tipo] || (libres[tipo] = [])).pop() || crearDuende(tipo)', 'crearDuende(tipo)', 'los duendes no se reciclan'],
  ['historia-duendes.js', 'if (vivos.length >= MAXIMO)', 'if (vivos.length >= 1e6)', 'sin tope de duendes'],
];
let atrapadas = 0;
for (const [archivo, de, a, que] of MUT) {
  const orig = leer(`src/${archivo}`);
  if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
  const sufijo = archivo === 'historia.js' ? '.mut' : archivo === 'historia-presencia.js' ? '.pmut' : '.dmut';
  const base2 = archivo.replace('.js', '');
  const dest = join(raiz, 'src', `${base2}${sufijo}.js`);
  let mut = orig.replace(de, () => a);
  // la presencia y los duendes importan a historia.js: las copias siguen apuntando al de verdad (se prueba cada archivo solo)
  writeFileSync(dest, mut);
  const antes = fallas, antesN = n;
  callado = true;
  try {
    const r = await chequear(sufijo);
    if (r > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
  } catch { atrapadas++; }
  finally { rmSync(dest, { force: true }); callado = false; }
  // lo que dio la mutación no cuenta como falla de la prueba
  fallas = antes; n = antesN;
}
ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.13.0 (A) duendes en la Historia: presencia, encuentro y armas · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
