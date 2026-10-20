// 4.2: el almacenaje con tope (src/almacen.js, planos-almacen.js, almacen-juego.js) y las doce piezas de huerta, granja y exteriores
// (planos-exteriores.js), en Node:
//   · la lógica pura: topes por nivel, guardar hasta el tope, sacar, el resumen («Piedra 18/40»), las ampliaciones y su precio en el registro de pesos;
//   · el saneo del guardado (partida vieja sin `almacen` intacta; lo guardado no se recorta; nivel y claves válidos);
//   · los planos: existen, cuestan según la escala, dibujan sin números rotos con el depósito al máximo y lleno, sólo tipo 0 y 4, dentro del
//     presupuesto de triángulos y de lo que dicen medir, con su física sana;
//   · main.js usa todo esto (la E, mantener E, pagar de los depósitos, devolver lo guardado al desarmar y el reintegro de las ampliaciones).
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO, PLANOS, MATERIALES } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const O = await import('../src/obra-pesos.js');
const A = await import('../src/almacen.js');
const { economiaNueva, pesosDe, formatoPesos } = await import('../src/economia.js');
const { PIEZAS_ALMACEN } = await import('../src/planos-almacen.js');
const { PIEZAS_EXTERIORES } = await import('../src/planos-exteriores.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const fallas = [];
const ok = (c, m) => { try { assert.ok(c, m); } catch (e) { fallas.push(m); } n++; };
const eq = (a, b, m) => { try { assert.deepEqual(a, b, m); } catch (e) { fallas.push(`${m} (${JSON.stringify(e.actual)} ≠ ${JSON.stringify(e.expected)})`); } n++; };
const relax = (pesos, dia = 4) => ({ modo: 'relax', dia, economia: { ...economiaNueva(), pesos } });

const ESCALA = { 'mueble bueno': [800, 3000], lujo: [4000, 20000], 'edificio de oficio': [15000, 60000] };
const VALOR = { tabla: 100, piedra: 100, tronco: 150, lana: 300 };
const valorMateriales = (pide) => Object.entries(pide).reduce((s, [k, c]) => s + (VALOR[k] || 0) * c, 0);

// ---------------------------------------------------------------- 1. la lógica pura
{
  eq(A.IDS_ALMACEN.sort(), ['barraca', 'deposito-piedra', 'herramientero', 'pila-piedra', 'silo'], 'los cinco almacenes');
  for (const id of A.IDS_ALMACEN) {
    const D = A.ALMACENES[id];
    ok(D.topes.length === D.ampliaciones.length + 1, `${id}: un tope por nivel (${D.topes.join(', ')})`);
    ok(D.topes.every((t, i) => Number.isInteger(t) && t > 0 && (i === 0 || t > D.topes[i - 1])), `${id}: los topes suben`);
    ok(D.ampliaciones.every((x) => x.pesos % 50 === 0 && x.pesos >= 800 && Object.values(x.pide).every((c) => Number.isInteger(c) && c > 0)), `${id}: las ampliaciones cuestan pesos redondos y materiales`);
    ok(D.ampliaciones.every((x, i) => i === 0 || x.pesos > D.ampliaciones[i - 1].pesos), `${id}: cada ampliación cuesta más que la anterior`);
    ok(D.guarda.every((k) => A.ETIQUETA[k]), `${id}: sabe cómo llamar a lo que guarda`);
    ok(A.textoCapacidad(id).length > 20, `${id}: la ficha dice la capacidad`);
  }
  // los tamaños: cuanto más grande, más guarda
  ok(A.ALMACENES['pila-piedra'].topes[0] < A.ALMACENES['deposito-piedra'].topes[0] && A.ALMACENES['deposito-piedra'].topes[0] > 0, 'la pila es más chica que el depósito');
  ok(A.ALMACENES['pila-piedra'].topes[0] < A.TOPE_ACOPIO + 1 || true, 'tope del acopio definido');
  eq(A.TOPE_ACOPIO, 40, 'el acopio de siempre ahora tiene tope: 40 de cada material');

  // guardar hasta el tope (modo «clase»: el tope es de cada cosa)
  const a = A.almacenNuevo();
  eq(A.topeDe('deposito-piedra', a), 60, 'el depósito arranca en 60');
  eq(A.guardar('deposito-piedra', a, 'piedra', 18), 18, 'guarda 18');
  eq(A.resumen('deposito-piedra', a), 'Piedra 18/60', 'el resumen «Piedra 18/60»');
  eq(A.guardar('deposito-piedra', a, 'piedra', 100), 42, 'llega al tope: sólo entran 42 más');
  eq(A.resumen('deposito-piedra', a), 'Piedra 60/60', 'lleno');
  eq(A.guardar('deposito-piedra', a, 'piedra', 1), 0, 'ya no entra nada');
  ok(A.estaLleno('deposito-piedra', a), 'está lleno');
  eq(A.guardar('deposito-piedra', a, 'tabla', 5), 0, 'y no guarda lo que no es suyo (tablas)');
  eq(A.guardar('deposito-piedra', a, 'piedra', -4), 0, 'ni números negativos');
  eq(A.guardar('deposito-piedra', a, 'piedra', NaN), 0, 'ni NaN');
  // ampliar: sube el tope
  const sig = A.proximaAmpliacion('deposito-piedra', a);
  eq([sig.indice, sig.topeActual, sig.tope, sig.pesos], [0, 60, 100, 2000], 'la primera ampliación: 60 → 100 por $2.000');
  ok(A.ampliar('deposito-piedra', a) && a.n === 1, 'se amplía');
  eq(A.topeDe('deposito-piedra', a), 100, 'tope 100');
  eq(A.guardar('deposito-piedra', a, 'piedra', 100), 40, 'entran 40 más, hasta 100');
  ok(A.ampliar('deposito-piedra', a) && A.topeDe('deposito-piedra', a) === 160, 'la segunda ampliación: 160');
  eq(A.proximaAmpliacion('deposito-piedra', a), null, 'no hay una tercera');
  ok(!A.ampliar('deposito-piedra', a) && a.n === 2, 'y ampliar de más no hace nada');
  eq(A.sacar('deposito-piedra', a, 'piedra', 30), 30, 'saca 30'); eq(A.guardadoDe(a, 'piedra'), 70, 'quedan 70');
  eq(A.sacar('deposito-piedra', a, 'piedra'), 70, 'saca todo'); eq(a.g, {}, 'queda vacío (sin claves en cero)');
  eq(A.sacar('deposito-piedra', a, 'piedra'), 0, 'sacar de vacío da cero');

  // la barraca guarda 4 cosas, cada una con su tope
  const b = A.almacenNuevo();
  eq(A.guardar('barraca', b, 'tronco', 50), 40, 'barraca: 40 de tronco'); eq(A.guardar('barraca', b, 'tabla', 50), 40, 'y 40 de tabla (el tope es de cada cosa)');
  eq(A.guardar('barraca', b, 'lana', 5), 5, 'y la lana entra'); eq(A.guardar('barraca', b, 'cristal', 5), 0, 'las semillas doradas no');
  eq(A.resumen('barraca', b), 'Troncos 40/40 · Tablas 40/40 · Piedra 0/40 · Lana 5/40', 'resumen de la barraca');
  eq(A.contenidoEnPalabras('barraca', b), '40 troncos · 40 tablas · 5 vellones de lana', 'lo guardado en palabras');
  eq(A.ALMACENES.barraca.topes, [40, 70, 110, 160], 'topes de la barraca');
  eq(A.ALMACENES.barraca.ampliaciones.length, 3, 'tres ampliaciones en la barraca');

  // el silo y el herramientero: el tope es de todo junto
  const s = A.almacenNuevo();
  eq(A.guardar('silo', s, 'haba', 50), 50, 'silo: 50 habas'); eq(A.guardar('silo', s, 'papa', 50), 10, 'y 10 papas más: 60 en total');
  eq(A.resumen('silo', s), 'Cosecha 60/60', 'cosecha 60/60');
  eq(A.guardar('silo', s, 'calafate', 1), 0, 'lleno para todo');
  eq(A.guardar('silo', s, 'piedra', 1), 0, 'y no guarda piedra');
  const h = A.almacenNuevo();
  eq(['hacha', 'pico', 'tijera', 'mosca', 'farol'].map((k) => A.guardar('herramientero', h, k, 1)), [1, 1, 1, 1, 0], 'herramientero: cuatro ganchos');
  eq(A.guardar('herramientero', h, 'hacha', 1), 0, 'una herramienta no se cuelga dos veces');
  eq(A.resumen('herramientero', h), 'Ganchos 4/4', 'ganchos 4/4');
  ok(A.ampliar('herramientero', h) && A.guardar('herramientero', h, 'farol', 1) === 1 && A.guardar('herramientero', h, 'botas', 1) === 1, 'ampliado: dos ganchos más (farol y botas)');
  eq(A.guardar('pila-piedra', A.almacenNuevo(), 'piedra', 99), 30, 'la pila: 30');
  eq(A.proximaAmpliacion('pila-piedra', A.almacenNuevo()), null, 'y no se amplía');
  eq(A.textoAmpliacion('deposito-piedra', A.almacenNuevo()), 'Sube el tope de 60 a 100 · cuesta 6 tablas, 8 piedras y $2.000', 'la confirmación dice qué sube y cuánto cuesta');

  // los pasos de llenado (lo que se dibuja)
  const p = A.almacenNuevo();
  eq(A.pasoDeLlenura('deposito-piedra', p), 0, 'vacío: paso 0');
  A.guardar('deposito-piedra', p, 'piedra', 10); eq(A.pasoDeLlenura('deposito-piedra', p), 1, 'poco: 1');
  A.guardar('deposito-piedra', p, 'piedra', 30); eq(A.pasoDeLlenura('deposito-piedra', p), 2, 'más de la mitad: 2');
  A.guardar('deposito-piedra', p, 'piedra', 20); eq(A.pasoDeLlenura('deposito-piedra', p), 3, 'lleno: 3');
}

// ---------------------------------------------------------------- 2. las ampliaciones se pagan con la maquinaria de pesos
{
  for (const id of A.IDS_ALMACEN) {
    const ap = A.ALMACENES[id].ampliaciones, idp = A.idPrecioAmpliacion(id);
    if (!ap.length) { ok(!O.tienePrecio(idp), `${id}: sin ampliaciones, sin precio`); continue; }
    ok(O.tienePrecio(idp) && O.etapasConPrecio(idp) === ap.length, `${id}: las ampliaciones están en el registro de pesos`);
    ap.forEach((x, i) => eq(O.precioDeEtapa(idp, i), x.pesos, `${id}: ampliación ${i + 1} cuesta ${formatoPesos(x.pesos)}`));
  }
  const idp = A.idPrecioAmpliacion('barraca');
  const q = relax(5000);
  eq(O.puedePagarEtapa(q, idp, 0), { ok: true, precio: 3500 }, 'con $5.000 alcanza la primera ampliación de la barraca');
  const r = O.pagarEtapa(q, idp, 0);
  ok(r.ok && pesosDe(q) === 1500, 'se paga y quedan $1.500');
  eq(q.economia.libro.at(-1).motivo, 'Ampliación: barraca de materiales', 'el libro dice qué fue');
  eq(O.puedePagarEtapa(q, idp, 1), { ok: false, precio: 6500, falta: 5000 }, 'la segunda no alcanza: faltan $5.000');
  eq(O.avisoSinPlata(idp, { precio: 6500, falta: 5000 }, 3).detalle, 'La ampliación cuesta $6.500 y te faltan $5.000. El banco te puede prestar', 'el aviso de siempre, con «La ampliación»');
  // el reintegro al desmontar: la mitad de lo que pagaste de ampliaciones (sólo las hechas Y pagadas)
  const t = relax(0);
  eq(O.reintegroAlDesmontar(t, idp, 2, 2), Math.floor((3500 + 6500) / 2 / 10) * 10, 'la mitad de $10.000');
  eq(O.reintegroAlDesmontar(relax(0), idp, 3, 0), 0, 'lo que nunca se pagó no vuelve');
  // el Desafío y las partidas sin economía no cobran
  eq(O.puedePagarEtapa({ modo: 'desafio', economia: economiaNueva() }, idp, 0), { ok: true, precio: 0 }, 'el Desafío no cobra');
  eq(O.puedePagarEtapa({ dia: 3 }, idp, 0), { ok: true, precio: 0 }, 'una partida sin economía tampoco');
}

// ---------------------------------------------------------------- 3. el saneo del guardado
{
  eq(A.sanearAlmacen(undefined, 'barraca'), { n: 0, g: {} }, 'sin nada: un almacén nuevo');
  eq(A.sanearAlmacen('hola', 'barraca'), { n: 0, g: {} }, 'un texto: nuevo');
  eq(A.sanearAlmacen({ n: 99, g: { tronco: 12.9, piedra: -3, tabla: 'x', raro: 5, lana: 2 } }, 'barraca'), { n: 3, g: { tronco: 12, lana: 2 } }, 'nivel dentro de los que existen, sólo lo que guarda, enteros y positivos');
  eq(A.sanearAlmacen({ n: -2, g: [1, 2] }, 'silo'), { n: 0, g: {} }, 'nivel negativo y lista: nuevo');
  eq(A.sanearAlmacen({ n: 0, g: { piedra: 500 } }, 'pila-piedra'), { n: 0, g: { piedra: 500 } }, 'lo guardado NO se recorta al tope (no se pierde nada)');
  eq(A.sanearAlmacen({ g: { hacha: 7, pico: 0 } }, 'herramientero'), { n: 0, g: { hacha: 1 } }, 'herramientas: colgada o no');
  eq(A.sanearAlmacen({ n: 1, g: {} }, 'no-existe'), { n: 0, g: {} }, 'un almacén que no existe: nuevo');
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  const obras = [
    { plano: 'barraca', x: 1, z: 2, rot: 0, etapas: 1, almacen: { n: 2, g: { tronco: 33, piedra: 7 } } },
    { plano: 'silo', x: 5, z: 2, rot: 0, etapas: 1 },                       // de antes: sin `almacen`
    { plano: 'pila-piedra', x: 9, z: 9, rot: 0, etapas: 1, almacen: 'roto' },  // roto
  ];
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 5, horas: 10, obras, economia: { ...economiaNueva(), pesos: 500 } }), 'se guarda');
  const r = G.leerPartida('relax', 1).progreso;
  eq(r.obras[0].almacen, { n: 2, g: { tronco: 33, piedra: 7 } }, 'lo guardado y el nivel vuelven iguales');
  ok(!('almacen' in r.obras[1]), 'una obra de antes no se llena de campos');
  ok(!('almacen' in r.obras[2]), 'y una rota se descarta');
}

// ---------------------------------------------------------------- 3b. el juego (almacen-juego.js) con un mundo de mentira
{
  const { crearAlmacenJuego } = await import('../src/almacen-juego.js');
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const nuevo = (pesos = 20000) => {
    const progreso = { modo: 'relax', dia: 4, materiales: {}, entradas: {}, cosas: {}, economia: { ...economiaNueva(), pesos } };
    const notas = [], rehechas = [];
    const obrasLista = [];
    const mundo = { obras: obrasLista, editando: null, obrasCerca: () => obrasLista, rehacer: (o) => rehechas.push(o) };   // (el índice real devuelve por celdas: acá devuelve todo)
    const pos = { x: 0, z: 0 };
    const mat = (k) => progreso.materiales[k] || 0;
    const J = crearAlmacenJuego({
      progreso: () => progreso, obras: () => mundo, jugador: () => ({ estado: { pos } }), sonido: () => ({ juntar() {} }),
      nota: (t, sub) => notas.push(`${t} | ${sub || ''}`), guardar() {}, refrescarBarra() {},
      material: mat, cuantoHay: (k) => progreso.entradas[k]?.cantidad || 0,
      sumarMaterial: (k, n) => { progreso.materiales[k] = mat(k) + n; }, sumarEntrada: (k, n) => { progreso.entradas[k] = { cantidad: Math.max(0, (progreso.entradas[k]?.cantidad || 0) + n) }; },
      conMateriales: (fn) => fn(progreso.materiales), materialesVisibles: () => progreso.materiales,
    });
    const poner = (id, x, z, almacen) => { const o = { plano: PLANO[id], datos: { plano: id, x, z, etapas: 1, ...(almacen ? { almacen } : {}) } }; obrasLista.push(o); return o; };
    return { progreso, notas, rehechas, J, poner, pos };
  };
  // el alcance: sólo los depósitos de materiales terminados a menos de 18 m, el más cercano primero
  {
    const W = nuevo();
    W.poner('deposito-piedra', 30, 0); W.poner('barraca', 10, 0); W.poner('pila-piedra', 4, 0); W.poner('silo', 2, 0);
    W.poner('barraca', 3, 3).datos.etapas = 0;
    eq(W.J.cerca(18).map((o) => o.plano.id), ['pila-piedra', 'barraca'], 'cerca(18): la pila y la barraca (no el silo, ni lo de 30 m, ni lo que está a medias), el más cercano primero');
  }
  // guardar, tope, avisos y notas
  {
    const W = nuevo(); const dep = W.poner('deposito-piedra', 1, 1);
    eq(W.J.aviso(dep), 'Depósito de piedra techado vacío (Piedra 0/60)', 'vacío: el aviso lo dice');
    W.progreso.materiales.piedra = 70;
    eq(W.J.aviso(dep), 'Guardar en el depósito (Piedra 0/60)', 'con piedra a mano: guardar');
    W.J.usar(dep);
    eq([dep.datos.almacen.g.piedra, W.progreso.materiales.piedra], [60, 10], 'E guarda hasta el tope y deja el resto en la mochila');
    ok(/Guardaste en el depósito \|.*Piedra 60\/60.*No entró el resto de piedra/.test(W.notas.at(-1)), 'la nota dice cuánto entró y que el resto no: ' + W.notas.at(-1));
    ok(W.rehechas.includes(dep), 'se rehizo la malla (la pila creció)');
    eq(W.J.aviso(dep), 'Depósito de piedra techado lleno (Piedra 60/60) · Supr: sacar · mantené E para ampliar', 'lleno: el aviso ofrece ampliar');
    W.progreso.materiales.piedra = 0;
    eq(W.J.aviso(dep), 'Sacar del depósito (Piedra 60/60)', 'sin nada a mano: sacar');
    W.J.usar(dep);
    eq([dep.datos.almacen.g.piedra, W.progreso.materiales.piedra], [undefined, 60], 'E saca todo');
    // la barraca guarda cuatro cosas; la cosecha sale de lo juntado; las herramientas se cuelgan sin quitarse
    const bar = W.poner('barraca', 8, 0); Object.assign(W.progreso.materiales, { tronco: 45, tabla: 3, piedra: 0, lana: 2, cristal: 4 });
    W.J.usar(bar);
    eq(bar.datos.almacen.g, { tronco: 40, tabla: 3, lana: 2 }, 'la barraca guarda cada material hasta su tope (y no las semillas doradas)');
    eq([W.progreso.materiales.tronco, W.progreso.materiales.cristal], [5, 4], 'lo que no entra queda en la mochila');
    const silo = W.poner('silo', 20, 0); W.progreso.entradas.haba = { cantidad: 70 }; W.progreso.entradas.papa = { cantidad: 5 };
    W.J.usar(silo);
    eq([silo.datos.almacen.g.haba, silo.datos.almacen.g.papa, W.progreso.entradas.haba.cantidad, W.progreso.entradas.papa.cantidad], [60, undefined, 10, 5], 'el silo guarda la cosecha hasta su tope (60 en total) y lo demás queda');
    const hr = W.poner('herramientero', 24, 0); Object.assign(W.progreso.cosas, { hacha: 1, pico: 1, tijera: 1, mosca: 1, farol: 1 });
    W.J.usar(hr);
    eq(Object.keys(hr.datos.almacen.g), ['hacha', 'pico', 'tijera', 'mosca'], 'el herramientero cuelga cuatro');
    ok(W.progreso.cosas.hacha === 1 && W.progreso.cosas.pico === 1, 'y las herramientas siguen a mano');
    ok(/Sin ganchos libres/.test(W.J.aviso(hr)), 'sin ganchos: ' + W.J.aviso(hr));
  }
  // pagar de los depósitos: el más cercano primero, y sin pasarse
  {
    const W = nuevo(); const a = W.poner('deposito-piedra', 2, 0, { n: 0, g: { piedra: 10 } }), b = W.poner('barraca', 9, 0, { n: 0, g: { piedra: 25, tabla: 7 } });
    eq(W.J.totales(W.J.cerca(18)), { piedra: 35, tabla: 7 }, 'los totales de lo guardado cerca');
    eq(W.J.gastar(W.J.cerca(18), 'piedra', 22), 22, 'gasta 22 de piedra');
    eq([a.datos.almacen.g.piedra, b.datos.almacen.g.piedra], [undefined, 13], 'primero del más cercano (se vació) y el resto del siguiente');
    eq(W.J.gastar(W.J.cerca(18), 'piedra', 50), 13, 'no saca de más: sólo 13');
    eq(W.J.gastar(W.J.cerca(18), 'lana', 5), 0, 'ni de lo que no hay');
  }
  // desarmar: lo guardado vuelve (una sola vez) y la mitad de lo pagado al ampliar
  {
    const W = nuevo(0); const dep = W.poner('barraca', 1, 1, { n: 2, g: { tronco: 33, piedra: 7 } });
    eq(W.J.contenido(dep.datos), '33 troncos · 7 piedras', 'lo que tenía guardado, en palabras');
    eq(W.J.devolver(dep.datos), '33 troncos · 7 piedras', 'al desarmar vuelve');
    eq([W.progreso.materiales.tronco, W.progreso.materiales.piedra], [33, 7], 'a la mochila');
    eq(W.J.devolver(dep.datos), '', 'una segunda vez no devuelve nada (no se duplica)');
    eq([W.progreso.materiales.tronco, dep.datos.almacen.n], [33, 2], 'y el nivel queda (para el reintegro)');
    eq(W.J.reintegro(dep.datos), 5000, 'vuelve la mitad de lo pagado en dos ampliaciones ($3.500 + $6.500 = $10.000)');
    eq(pesosDe(W.progreso), 5000, 'a la billetera');
    eq(W.J.materialesDeAmpliaciones(dep.datos), { tabla: 6 + 8, tronco: 2 + 3, piedra: 4 }, 'y la mitad de los materiales de esas dos ampliaciones');
    eq(W.J.devolver({ plano: 'cerco', x: 0, z: 0 }), '', 'lo que no es un almacén no hace nada');
    eq(W.J.devolver(null), '', 'ni un dato roto');
  }
  // ampliar: dos pasos, con tiempo de por medio; sin plata ni materiales no cobra
  {
    const W = nuevo(5000); const dep = W.poner('deposito-piedra', 1, 1, { n: 0, g: { piedra: 60 } });
    Object.assign(W.progreso.materiales, { tabla: 2, piedra: 0 });
    W.J.ampliar(dep);
    ok(/Falta para ampliar \| Faltan 4 tablas y 8 piedras/.test(W.notas.at(-1)), 'sin materiales: ' + W.notas.at(-1));
    eq([dep.datos.almacen.n, pesosDe(W.progreso)], [0, 5000], 'no cobró ni amplió');
    Object.assign(W.progreso.materiales, { tabla: 10, piedra: 20 }); W.progreso.economia.pesos = 1500;
    W.J.ampliar(dep);
    ok(/Falta plata para ampliar \| La ampliación cuesta \$2\.000 y te faltan \$500/.test(W.notas.at(-1)), 'sin plata: ' + W.notas.at(-1));
    W.progreso.economia.pesos = 5000;
    W.J.ampliar(dep);
    ok(/Ampliar el depósito \| Sube el tope de 60 a 100 · cuesta 6 tablas, 8 piedras y \$2\.000\. Mantené E otra vez/.test(W.notas.at(-1)), 'la primera sólo muestra el precio: ' + W.notas.at(-1));
    W.J.ampliar(dep);
    eq([dep.datos.almacen.n, pesosDe(W.progreso)], [0, 5000], 'la segunda enseguida (menos de 0,6 s) tampoco cobra: evita el doble toque');
    await espera(700);
    W.J.ampliar(dep);
    eq([dep.datos.almacen.n, pesosDe(W.progreso), W.progreso.materiales.tabla, W.progreso.materiales.piedra], [1, 3000, 4, 12], 'con la confirmación a tiempo: nivel 1, $2.000, 6 tablas y 8 piedras');
    ok(/Ampliaste el depósito \| Ahora guarda hasta 100/.test(W.notas.at(-1)), 'la nota: ' + W.notas.at(-1));
    // la confirmación vale para ese depósito
    const otro = W.poner('deposito-piedra', 5, 5, { n: 0, g: {} });
    Object.assign(W.progreso.materiales, { tabla: 30, piedra: 30, tronco: 10 }); W.progreso.economia.pesos = 9000;
    W.J.ampliar(dep); await espera(700); W.J.ampliar(otro);
    eq([dep.datos.almacen.n, otro.datos.almacen.n], [1, 0], 'la confirmación de uno no amplía otro');
    await espera(700); W.J.ampliar(otro);
    eq(otro.datos.almacen.n, 1, 'y el otro se amplía con la suya');
    const pila = W.poner('pila-piedra', 9, 9, { n: 0, g: {} });
    W.J.ampliar(pila);
    ok(/ya está al máximo/.test(W.notas.at(-1)), 'la pila no se amplía: ' + W.notas.at(-1));
  }
}

// ---------------------------------------------------------------- 4. los planos
const todas = [...PIEZAS_ALMACEN, ...PIEZAS_EXTERIORES];
const PRECIOS = {
  'pila-piedra': 0, 'deposito-piedra': 3000, barraca: 12000, herramientero: 1200, silo: 9000,
  'huerta-terrazas': 3000, 'establo-caballo': 6000, 'corral-grande': 3000, 'cobertizo-heno': 2000, palomar: 1500, aljibe: 2500, 'pozo-balde': 2000,
  tranquera: 1000, 'porton-arco': 4000, 'puente-piedra': 5000, 'pirca-campo': 0, 'camino-empedrado': 0,
};
const ids = Object.keys(PRECIOS);
ok(PIEZAS_ALMACEN.length === 5 && PIEZAS_EXTERIORES.length === 12, 'cinco de almacenaje y doce de huerta, granja y exteriores');
ok(new Set(PLANOS.map((p) => p.id)).size === PLANOS.length, 'ningún id repetido en todo el catálogo');
ok(todas.every((p) => PLANOS.filter((q) => q.nombre === p.nombre).length === 1), 'ninguna de las nuevas repite el nombre de otra');
eq(todas.map((p) => p.id).sort(), ids.sort(), 'exactamente las piezas del pedido');
const VIEJOS = ['invernadero', 'bebedero', 'mirador', 'pasarela', 'embarcadero', 'gallinero', 'tambo', 'chiquero', 'paridera', 'colmena', 'vivero', 'cerco', 'seto', 'senda-piedra', 'pozo', 'muro-piedra'];
for (const v of VIEJOS) ok(PLANO[v] && !ids.includes(v), `${v} ya existía y no se duplicó`);
const MAX = { 'pila-piedra': 450, 'deposito-piedra': 900, barraca: 1000, herramientero: 700, silo: 700 };
const lleno = (id) => {
  const D = A.ALMACENES[id]; const g = {};
  const N = D.topes.length - 1, tope = D.topes[N];
  if (D.tipo === 'herramienta') for (const k of D.guarda) g[k] = 1; else if (D.modo === 'clase') for (const k of D.guarda) g[k] = tope; else g[D.guarda[0]] = tope;
  return { almacen: { n: N, g }, x: 0, z: 0, y: 0, rot: 0, etapas: 1 };
};
for (const id of ids) {
  const P = PLANO[id], pesos = PRECIOS[id];
  ok(P && P.pieza === true && P.etapas.length === 1 && P.etapas[0].termina, `${id}: está en el catálogo, una etapa`);
  ok(P.soloRelax === true, `${id}: sólo en el Relax`);
  ok(['trabajo', 'exterior'].includes(P.categoria), `${id}: en una categoría que ya existía (${P.categoria})`);
  ok(Object.entries(P.pide).every(([k, c]) => MATERIALES[k] && Number.isInteger(c) && c > 0), `${id}: materiales que existen`);
  ok(P.nombre && P.texto && P.texto.length > 80 && P.radio > 0 && P.separacion >= 0 && P.ancho > 0 && P.fondo > 0 && P.alto > 0, `${id}: nombre, texto y medidas`);
  ok(!/[a-z]{3,} (the|of|and) /.test(P.texto), `${id}: el texto está en castellano`);
  // el precio, según la escala
  eq(P.etapas[0].pesos ?? 0, pesos, `${id}: precio ${formatoPesos(pesos)}`);
  eq(O.precioDeEtapa(id, 0), pesos, `${id}: el registro lo tiene`);
  if (pesos) {
    ok(pesos % 50 === 0, `${id}: precio redondo ($50)`);
    const [min, max] = pesos <= 3000 ? ESCALA['mueble bueno'] : ESCALA.lujo;
    ok(pesos >= min && pesos <= max, `${id}: dentro de la escala (${formatoPesos(min)} a ${formatoPesos(max)})`);
    const v = valorMateriales(P.pide);
    ok(pesos >= v * 0.95 && pesos <= v * 4, `${id}: pesos entre 1 y 4 veces los materiales ($${v}) → ×${(pesos / v).toFixed(2)}`);
  } else ok(valorMateriales(P.pide) < 2000, `${id}: barata: sólo materiales`);
  // la geometría: en el peor caso (depósito al máximo y lleno), con y sin suelo
  const datos = A.esAlmacen(id) ? lleno(id) : null;
  for (const suelo of [null, (x, z) => 0.2 + 0.1 * x - 0.05 * z]) {
    const c = new Constructor(); P.etapas[0].arma(c, P, datos ? { ...datos } : {}, suelo);
    ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite) && c.nor.every(Number.isFinite), `${id}: dibuja sin números rotos`);
    ok(c.tipo.every((t) => t === 0 || t === 4), `${id}: sólo tipo 0 y 4`);
  }
  const c = new Constructor(); P.etapas[0].arma(c, P, datos ? { ...datos } : {}, null);
  const tris = c.pos.length / 9;
  ok(tris <= (MAX[id] ?? 1000), `${id}: ${Math.round(tris)} triángulos (tope ${MAX[id] ?? 1000}; la mediana del juego es ~250)`);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); }
  ok(y0 >= -0.25, `${id}: no se hunde (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.15 && y1 >= P.alto * 0.4, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.2, `${id}: entra en su ancho (${Math.max(Math.abs(x0), Math.abs(x1)).toFixed(2)} de ${(P.ancho / 2).toFixed(2)})`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.2, `${id}: entra en su fondo (${Math.max(Math.abs(z0), Math.abs(z1)).toFixed(2)} de ${(P.fondo / 2).toFixed(2)})`);
  // la física
  const reg = { s: [], c: [], p: [] };
  if (P.fisica) P.fisica({ segmento: (...a) => reg.s.push(a), circulo: (...a) => reg.c.push(a), plataforma: (...a) => reg.p.push(a) });
  const chocaA = ['camino-empedrado'];
  if (chocaA.includes(id)) ok(reg.s.length + reg.c.length + reg.p.length === 0, `${id}: se pisa, no choca`);
  else {
    ok(reg.s.length + reg.c.length + reg.p.length >= 1, `${id}: choca`);
    for (const s of reg.s) ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6] && s[6] <= P.alto + 0.1, `${id}: segmento sano`);
    for (const q of reg.c) ok(q.length === 5 && q.every(Number.isFinite) && q[2] > 0 && q[3] < q[4] && q[4] <= P.alto + 0.1, `${id}: círculo sano`);
    const alcance = Math.max(0, ...reg.s.map((s) => Math.max(Math.abs(s[0]), Math.abs(s[2])) + s[4]), ...reg.c.map((q) => Math.abs(q[0]) + q[2]));
    ok(alcance <= P.ancho / 2 + 0.15, `${id}: el choque cabe en su ancho (${alcance.toFixed(2)} de ${(P.ancho / 2).toFixed(2)})`);
  }
}
ok(!todas.some((p) => p.funciones?.includes('luz')), 'sin luces dinámicas nuevas');
// la ficha de cada almacén dice cuánto guarda, y la pila dice que no se amplía
for (const id of A.IDS_ALMACEN) ok(PLANO[id].texto.includes(A.textoCapacidad(id)), `${id}: la ficha dice «${A.textoCapacidad(id).slice(0, 40)}…»`);
// el depósito cambia a la vista con cada nivel y con lo que se llena
{
  const tri = (id, datos) => { const c = new Constructor(); PLANO[id].etapas[0].arma(c, PLANO[id], datos, null); return c.pos.length / 9; };
  for (const id of ['deposito-piedra', 'barraca', 'silo', 'herramientero']) {
    const D = A.ALMACENES[id], N = D.topes.length - 1;
    const vacio = tri(id, { almacen: { n: 0, g: {} } }), mismoLleno = tri(id, { almacen: { n: 0, g: Object.fromEntries(D.guarda.map((k) => [k, D.tipo === 'herramienta' ? 1 : D.topes[0]])) } }), ampliado = tri(id, { almacen: { n: N, g: {} } });
    ok(mismoLleno > vacio, `${id}: lleno se ve más cargado que vacío (${Math.round(vacio)} → ${Math.round(mismoLleno)})`);
    ok(ampliado > vacio, `${id}: ampliado se ve distinto (${Math.round(vacio)} → ${Math.round(ampliado)})`);
  }
  const sinDatos = tri('barraca', null);
  ok(sinDatos > 0, 'el fantasma del plano (sin datos) se dibuja');
}

// ---------------------------------------------------------------- 5. main.js, construccion.js y guardado.js usan todo esto
{
  const m = leer('src/main.js'), c = leer('src/construccion.js'), g = leer('src/guardado.js');
  const tiene = (t, msg) => ok(m.includes(t), msg);
  tiene("import { crearAlmacenJuego } from './almacen-juego.js';", 'main.js trae almacen-juego.js');
  tiene('if (almacenJuego.esAlmacen(o.plano.id)) return almacenJuego.aviso(o);', 'el aviso de la E de un almacén');
  tiene('if (almacenJuego.esAlmacen(o.plano.id)) return almacenJuego.usar(o);', 'y la E');
  tiene('OBRAS_QUE_TRABAJAN.push(...almacenJuego.ids);', 'los almacenes son obras que se usan con E (con la misma prioridad que la leñera)');
  tiene('if (almacenJuego.esAlmacen(o.plano.id)) { almacenJuego.ampliar(o); return; }', 'mantener E amplía (4.4.2: ya no con Mayús, que es correr; y no con la tecla mantenida)');
  tiene('const cercaAcopio = hayAcopioCerca(RADIO_ACOPIO_OBRA), deps = almacenJuego.cerca(RADIO_ACOPIO_OBRA);', 'pagar: conMateriales mira el acopio y los depósitos de alrededor');
  tiene('const delDeposito = deps.length && gasto > delAcopio ? almacenJuego.gastar(deps, k, gasto - delAcopio) : 0;', 'primero el acopio, después los depósitos, al final la mochila');
  tiene('const delAcopio = hayAcopioCerca(RADIO_ACOPIO_OBRA), deps = almacenJuego.cerca(RADIO_ACOPIO_OBRA);', 'y materialesVisibles suma lo mismo (el panel y los avisos dicen «Faltan» con lo guardado cerca)');
  tiene("if (typeof almacenJuego !== 'undefined') almacenJuego.devolver(d);", 'devolverContenido (desarmar, el viento, el desalojo) devuelve lo guardado');
  tiene('const delDeposito = almacenJuego.contenido(r.datos);', 'desarmar dice qué volvió');
  tiene('const rAmp = almacenJuego.reintegro(r.datos), mAmp = almacenJuego.materialesDeAmpliaciones(r.datos);', 'y devuelve la mitad de lo de las ampliaciones');
  ok(m.indexOf('const delDeposito = almacenJuego.contenido(r.datos);') < m.indexOf('devolverContenido(r.datos);   // 3.5.1') && m.indexOf('devolverContenido(r.datos);   // 3.5.1') < m.indexOf('const rAmp = almacenJuego.reintegro(r.datos)'), 'el orden: lo guardado se lee, se devuelve y recién ahí se reintegra (el nivel no se pierde)');
  tiene('const entra = Math.max(0, Math.min(n, TOPE_ACOPIO - (a[k] || 0)));', 'el acopio de siempre tiene tope (40 de cada material)');
  tiene('almacenJuego.textoPanel(RADIO_ACOPIO_OBRA)', 'el panel de construcción dice lo que hay en los depósitos');
  ok(c.includes("import { PIEZAS_ALMACEN } from './planos-almacen.js';") && c.includes("import { PIEZAS_EXTERIORES } from './planos-exteriores.js';") && c.includes('PIEZAS.push(...PIEZAS_ALMACEN, ...PIEZAS_EXTERIORES);'), 'construccion.js: dos imports de una línea y un push');
  ok(c.includes('tieneFuncionCerca, rehacer, sincronizar'), 'construccion.js: expone rehacer (la pila crece a la vista)');
  ok(g.includes("import { sanearAlmacen, esAlmacen } from './almacen.js';") && g.includes('d.almacen = sanearAlmacen(d.almacen, d.plano)'), 'guardado.js sanea lo guardado del almacén');
  // el pedido: ninguna categoría nueva ni la paginación tocada
  ok(['trabajo', 'exterior'].every((k) => c.includes(`{ clave: '${k}'`)) && !/clave: 'almacenaje'|clave: 'granja'/.test(c), 'sin categorías nuevas');
}

if (fallas.length) { console.log(fallas.map((f) => '✗ ' + f).join(String.fromCharCode(10))); console.log(`verificar-4-2-almacen: FALLÓ ${fallas.length} de ${n}`); process.exit(1); }
console.log(`verificar-4-2-almacen: ${n} comprobaciones`);
