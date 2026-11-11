// 4.26.0 · A · Los pedidos de los vecinos, sólo de lo que se puede conseguir (src/pedidos.js, `seConsigue`), en Node con los módulos reales:
//   · el bug: con 16 pedidos cumplidos (nivel 3) un vecino te pedía leche, cordero, chorizo, fruta o mermelada aunque no tuvieras granja: en el
//     valle del Relax nadie vende cordero, chorizo, fruta ni mermelada, y la leche y las carnes de vaca y de cerdo se compran sólo si ya las
//     conocés (el puesto no vende lo del cuaderno que no anotaste). Y desde la 3.8.8 la pintora, la fotógrafa y la astrónoma pedían cristales,
//     que en el Relax sólo venden los puestos de la Cantera y del Paso (arreglados);
//   · la regla: del valle, o te lo vende un puesto a tu alcance (las cuatro paradas del Relax y los puestos de ruta arreglados; lo del cuaderno,
//     si lo conocés), o lo producís (vaca, chancha, paridera, el frutal de esa fruta; la mermelada, con su frutal y si sabés hacerla);
//   · las paradas de la regla son las del valle de verdad (se arma la trochita con el terreno real);
//   · la misma paga: con todo a mano, el pedido es exactamente el de la 4.25.3 (cosa, cantidad y paga); sin todo, la paga sale de la misma cuenta;
//   · lo que pide en una ventana no cambia a mitad (queda fijo la primera vez: `negocios.fijos`, optativo en el guardado);
//   · antes falla: el `pedidos.js` de `main` (4.25.3) pide cordero sin granja; y cada mutación de la regla la atrapa esta prueba.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';

registrarThree();
const raiz = fileURLToPath(new URL('..', import.meta.url));
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const C = await import('../src/comercio.js');
const E = await import('../src/economia.js');
const G = await import('../src/granja.js');
const R = await import('../src/puestos-ruta.js');
const Preal = await import('../src/pedidos.js');
const Nreal = await import('../src/negocios.js');

const VECINOS = ['carpintero', 'panadera', 'herrero', 'pescador', 'maestra', 'enfermera', 'telegrafista', 'tejedora', 'apicultor', 'guardaparque', 'musico', 'veterinaria',
  'herbolaria', 'modista', 'botera', 'pintora', 'andinista', 'fotografa', 'ceramista', 'astronoma'];
// Las listas de la 4.23.0 a la 4.25.3 (lo que pide cada uno, con la cuarta cosa de la granja)
const NECESITA_4_25 = {
  carpintero: ['tronco', 'piedra', 'lana', 'chorizo'], panadera: ['harina', 'huevo', 'miel', 'leche'], herrero: ['piedra', 'tronco', 'cristal', 'carne-vaca'],
  pescador: ['tronco', 'lana', 'pan-casero', 'mermelada-manzana'], maestra: ['papa', 'pan-casero', 'frasco-frutilla', 'manzana'], enfermera: ['miel', 'lana', 'frasco-frutilla', 'leche'],
  telegrafista: ['tronco', 'pan-casero', 'empanadas', 'chorizo'], tejedora: ['lana', 'frutilla', 'poncho', 'carne-cordero'], apicultor: ['tabla', 'frasco-frutilla', 'harina', 'mermelada-frambuesa'],
  guardaparque: ['trucha-ahumada', 'tronco', 'hongos-secos', 'carne-cordero'], musico: ['tabla', 'empanadas', 'miel', 'carne-cerdo'], veterinaria: ['huevo', 'lana', 'haba', 'leche'],
  herbolaria: ['miel', 'calafate-seco', 'hongos-secos', 'grosella'], modista: ['lana', 'poncho', 'cristal', 'ciruela'], botera: ['tabla', 'tronco', 'lana', 'carne-vaca'],
  pintora: ['cristal', 'frutilla', 'calafate-seco', 'cereza'], andinista: ['trucha-ahumada', 'pan-casero', 'empanadas', 'chorizo'], fotografa: ['cristal', 'miel', 'papa', 'cereza'],
  ceramista: ['piedra', 'haba', 'papa', 'ciruela'], astronoma: ['cristal', 'empanadas', 'miel', 'mermelada-frambuesa'],
};
const PRODUCE_ALDEA = new Set(C.perfilDe('Aldea de los Duendes').produce);
// El pedido de la 4.25.3, tal cual (la elección, la cantidad y la paga), para comparar
function pedidoViejo(nivel, k, dia) {
  const P = Preal;
  const v = P.ventanaDe(dia), id = `${k}|${v}`;
  const r = C.azarDe(C.hashTexto(`pedido|${id}`));
  const lista = nivel >= 3 ? NECESITA_4_25[k] : NECESITA_4_25[k].slice(0, 3);
  const sin = lista.filter((b) => !PRODUCE_ALDEA.has(b));
  const pool = (sin.length ? sin : lista).slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2);
  const bien = pool[Math.floor(r() * pool.length) % pool.length];
  const lotes = 1 + Math.floor(r() * 2) + (nivel >= 1 ? 1 : 0);
  const n = lotes * C.BIENES[bien].lote;
  const rapido = dia === v * P.PEDIDOS.dias + 1;
  const mult = P.PEDIDOS.base + P.PEDIDOS.porNivel * nivel + (rapido ? P.PEDIDOS.rapido : 0);
  return { id, k: bien, tipo: C.BIENES[bien].donde, n, premio: P.premioDe(bien, n, mult), limite: (v + 1) * P.PEDIDOS.dias, rapido, pool };
}
const norma = (q) => JSON.stringify(q && { id: q.id, k: q.k, tipo: q.tipo, n: q.n, premio: q.premio, limite: q.limite, rapido: q.rapido });
const REP = [0, 3, 8, 16];
const partida = (x = {}) => ({ modo: 'relax', dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva(), ...x });
const frutales = (especies) => Object.fromEntries(especies.map((e, i) => [`${i * 3}:7`, { especie: e, plantado: 1, cosecha: -1 }]));
const arreglados = (ids) => Object.fromEntries(['A', 'B', 'C', 'D'].map((id) => [id, { etapa: ids.includes(id) ? R.ETAPAS_TOTAL : 0 }]));
// Una partida que consigue todo (la granja entera, la receta de la mermelada, lo de la granja anotado y los cuatro puestos arreglados)
const todo = () => partida({ entradas: Object.fromEntries(C.DE_GRANJA_CON_VALOR.map((b) => [b, { dia: 1, hora: 1, cantidad: 0 }])), cocina: { sabe: { mermeladas: 1 } }, puestosRuta: arreglados(['A', 'B', 'C', 'D']),
  granja: { vaca: { id: 1 }, terneros: [], chancha: { id: 2 }, lechones: [], paridera: 1, corderos: [], encargos: [], frutales: frutales(G.ORDEN_FRUTALES) } });
const conRep = (p, k, rep) => { p.negocios = Nreal.negociosNuevo(); p.negocios.rep[k] = rep; return p; };

// ---------------------------------------------------------------- las paradas del valle de verdad (una vez: arma el terreno)
const { valle } = cargarValle(['puestos-ruta.js', 'puestos-ruta-mundo.js']);
const PARADAS_REALES = JSON.parse(JSON.stringify(valle({ aldea: true }).tren.paradas.map((p) => p.nombre))).sort();   // (del vm: a un arreglo de acá)

// ---------------------------------------------------------------- todo lo que se revisa (con el módulo de pedidos y el de negocios que se pasen)
const RESUMEN = {};
function revisar(P, N) {
  let n = 0;
  const ok = (c, m) => { assert.ok(c, m); n++; };
  const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

  // 1. las paradas de la regla son las del valle; los puestos de ruta, los de puestos-ruta.js
  eq([...P.PARADAS_DEL_VALLE].sort(), PARADAS_REALES, `las paradas del Relax de la regla son las del valle de verdad (${PARADAS_REALES.join(', ')})`);
  eq(P.puestosATuAlcance(partida()), P.PARADAS_DEL_VALLE, 'sin puestos de ruta arreglados, sólo las cuatro paradas');
  eq(P.puestosATuAlcance(partida({ puestosRuta: arreglados(['A']) })), [...P.PARADAS_DEL_VALLE, 'Puesto de la Cantera'], 'con la Cantera arreglada, también la Cantera');
  eq(P.puestosATuAlcance(partida({ puestosRuta: { A: { etapa: R.ETAPAS_TOTAL - 1 } } })), P.PARADAS_DEL_VALLE, 'a medio arreglar, todavía no');
  // la regla del puesto es la del panel de cargas (lo del cuaderno, sólo si ya lo conocés)
  ok(leer('src/comercio-mundo.js').includes("const conocido = (bien) => BIENES[bien].donde !== 'entrada' || !!P().entradas?.[bien];"), 'comercio-mundo.js: el puesto vende lo del cuaderno sólo si lo conocés');

  // 2. del valle: lo de siempre, sin los cristales ni lo de la granja; lo que es material o «cosa» se vende en alguna parada del Relax
  ok(!P.DEL_VALLE.has('cristal'), 'los cristales no son «del valle» en el Relax');
  for (const b of P.DEL_VALLE) {
    ok(C.esBien(b) && !C.DE_GRANJA_CON_VALOR.includes(b), `${b}: del valle, no de la granja`);
    if (C.BIENES[b].donde !== 'entrada') ok(P.PARADAS_DEL_VALLE.some((par) => C.bienesDe(par).includes(b)), `${b}: se compra en una parada del Relax`);
  }
  for (const [k, l] of Object.entries(NECESITA_4_25)) for (const b of l.slice(0, 3)) ok(P.DEL_VALLE.has(b) || b === 'cristal', `${k}: ${b}, de las tres de siempre, es del valle (o es cristal)`);

  // 3. cada camino, cosa por cosa
  const sin = partida();
  for (const b of C.DE_GRANJA_CON_VALOR) ok(!P.seConsigue(sin, b), `${b}: sin granja y sin conocerlo, no se consigue`);
  ok(!P.seConsigue(sin, 'cristal'), 'cristales: sin puesto arreglado, no');
  for (const b of P.DEL_VALLE) ok(P.seConsigue(sin, b), `${b}: se consigue siempre`);
  const conoce = (b) => partida({ entradas: { [b]: { dia: 1, hora: 1, cantidad: 0 } } });
  // lo que venden las paradas del Relax: leche (Mallín), carne de vaca (Estación), carne de cerdo (Arrayanes), si lo conocés
  for (const b of ['leche', 'carne-vaca', 'carne-cerdo']) ok(P.seCompra(conoce(b), b) && P.seConsigue(conoce(b), b), `${b}: conocido, se compra en una parada del Relax`);
  for (const b of ['carne-cordero', 'chorizo', 'manzana', 'pera', 'ciruela', 'cereza', 'frambuesa', 'grosella', 'mermelada-manzana', 'mermelada-frambuesa'])
    ok(!P.seConsigue(conoce(b), b), `${b}: conocerlo no alcanza (ninguna parada del Relax lo vende)`);
  ok(P.seConsigue(partida({ puestosRuta: arreglados(['A']) }), 'cristal') && P.seConsigue(partida({ puestosRuta: arreglados(['B']) }), 'cristal'), 'cristales: con la Cantera o el Paso arreglados, sí');
  ok(!P.seConsigue(partida({ puestosRuta: arreglados(['C', 'D']) }), 'cristal'), 'cristales: la Estepa y el Riel Sur no los venden');
  // la granja propia
  const g = (x) => partida({ granja: { ...G.granjaNueva(5), ...x } });
  ok(P.seConsigue(g({ vaca: { id: 1 } }), 'leche') && !P.seConsigue(g({}), 'leche'), 'leche: con la vaca');
  ok(P.seConsigue(g({ vaca: { id: 1 } }), 'carne-vaca') && P.seConsigue(g({ terneros: [{ id: 3, nacio: 1 }] }), 'carne-vaca') && P.seConsigue(g({ encargos: [{ que: 'novillo', dia: 4, vuelve: 5 }] }), 'carne-vaca'), 'carne de vaca: con la vaca, un ternero o un novillo carneado por llegar');
  for (const b of ['carne-cerdo', 'chorizo']) {
    ok(P.seConsigue(g({ chancha: { id: 2 } }), b) && P.seConsigue(g({ lechones: [{ id: 4, nacio: 1, engorde: 0 }] }), b) && P.seConsigue(g({ encargos: [{ que: 'capon', dia: 4, vuelve: 5 }] }), b), `${b}: con la chancha, un lechón o un capón por llegar`);
    ok(!P.seConsigue(g({ vaca: { id: 1 } }), b), `${b}: la vaca no da ${b}`);
  }
  ok(P.seConsigue(g({ paridera: 3 }), 'carne-cordero') && P.seConsigue(g({ corderos: [{ id: 5, nacio: 1, madre: 0 }] }), 'carne-cordero') && !P.seConsigue(g({ chancha: { id: 2 } }), 'carne-cordero'), 'cordero: con la paridera o un cordero');
  for (const [esp, f] of Object.entries(G.FRUTALES)) {
    ok(P.seConsigue(g({ frutales: frutales([esp]) }), f.fruta), `${f.fruta}: con su ${f.nombre}`);
    const otra = G.ORDEN_FRUTALES.find((e) => e !== esp);
    ok(!P.seConsigue(g({ frutales: frutales([otra]) }), f.fruta), `${f.fruta}: otro frutal no la da`);
    ok(!P.seConsigue(g({ frutales: { '0:0': { especie: null, plantado: 0, cosecha: -1 } } }), f.fruta), `${f.fruta}: un hoyo vacío no la da`);
    const mer = `mermelada-${f.fruta}`;
    const conFrutal = (x) => partida({ granja: { ...G.granjaNueva(5), frutales: frutales([esp]) }, ...x });
    ok(!P.seConsigue(conFrutal({}), mer), `${mer}: el frutal solo no alcanza (hay que saber hacerla)`);
    ok(P.seConsigue(conFrutal({ cocina: { sabe: { mermeladas: 1 } } }), mer), `${mer}: con el frutal y la receta, sí`);
    ok(P.seConsigue(conFrutal({ entradas: { [mer]: { cantidad: 0 } } }), mer), `${mer}: con el frutal y ya hecha alguna vez, sí`);
    ok(!P.seConsigue(partida({ cocina: { sabe: { mermeladas: 1 } }, entradas: { [mer]: { cantidad: 2 } } }), mer), `${mer}: sin el frutal, no`);
  }
  ok(!P.seConsigue(todo(), 'no-existe') && !P.seConsigue(todo(), 'constructor'), 'lo que no es un bien, nunca');

  // 4. lo que piden, en los veinte vecinos, 100 ventanas, los cuatro niveles
  let distintos = 0, iguales = 0, granjaSin = 0, granjaCon = 0, imposiblesViejos = 0;
  for (const k of VECINOS) {
    ok(P.hayPedidos(k), `${k} pide`);
    for (let d = 1; d <= 300; d += 3) for (let nivel = 0; nivel < 4; nivel++) {
      // (a) sin nada: sólo lo que se consigue, de su lista y su nivel, con la paga de siempre
      const p = conRep(partida(), k, REP[nivel]);
      const q = P.pedidoDe(p, k, d), v = pedidoViejo(nivel, k, d);
      if (!q) assert.fail(`${k} (nivel ${nivel}, día ${d}) no pide nada`);
      if (!P.seConsigue(p, q.k)) assert.fail(`${k} (nivel ${nivel}, día ${d}) pide ${q.k}, que no se consigue`);
      const permitidas = NECESITA_4_25[k].slice(0, nivel >= 3 ? 4 : 3).filter((b) => !PRODUCE_ALDEA.has(b)).slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2);
      if (!permitidas.includes(q.k)) assert.fail(`${k} (nivel ${nivel}) pide ${q.k}, fuera de ${permitidas.join(', ')}`);
      const mult = P.PEDIDOS.base + P.PEDIDOS.porNivel * nivel + (q.rapido ? P.PEDIDOS.rapido : 0);
      if (q.premio !== P.premioDe(q.k, q.n, mult) || q.n % C.BIENES[q.k].lote || q.n / C.BIENES[q.k].lote !== v.n / C.BIENES[v.k].lote || q.limite !== v.limite || q.id !== v.id) assert.fail(`${k} (nivel ${nivel}, día ${d}): la paga o la cantidad no son las de siempre`);
      if (C.DE_GRANJA_CON_VALOR.includes(q.k)) granjaSin++;
      if (q.k === v.k) iguales++; else distintos++;
      if (!P.seConsigue(p, v.k)) imposiblesViejos++;
      // si todo lo de su lista se conseguía, es el mismo pedido de la 4.25.3
      if (v.pool.every((b) => P.seConsigue(p, b)) && norma(q) !== norma(v)) assert.fail(`${k} (nivel ${nivel}, día ${d}): todo lo de su lista se consigue y el pedido cambió (${q.k} en vez de ${v.k})`);
      n += 4;
      // (b) con todo: exactamente el pedido de la 4.25.3
      const t = conRep(todo(), k, REP[nivel]);
      const w = P.pedidoDe(t, k, d);
      if (norma(w) !== norma(v)) assert.fail(`${k} (nivel ${nivel}, día ${d}) con todo a mano: ${norma(w)} en vez de ${norma(v)}`);
      if (C.DE_GRANJA_CON_VALOR.includes(w.k)) granjaCon++;
      n++;
    }
  }
  ok(granjaSin === 0, `sin granja, ningún vecino pide lo de la granja (${granjaSin})`);
  ok(granjaCon > 150, `con la granja, los de confianza sí (${granjaCon} pedidos)`);
  ok(imposiblesViejos > 0 && distintos >= imposiblesViejos && iguales > distintos, `sin granja: la 4.25.3 pedía ${imposiblesViejos} cosas imposibles; cambian ${distintos} de ${distintos + iguales} pedidos (los demás, por la lista más corta)`);
  RESUMEN.cambios ??= `${distintos} de ${distintos + iguales} (imposibles antes: ${imposiblesViejos})`;
  // los cristales: la pintora los pide sólo con la Cantera o el Paso arreglados
  const cristales = (x) => { let c = 0; for (let d = 1; d <= 300; d += 3) if (P.pedidoDe(conRep(partida(x), 'pintora', 0), 'pintora', d).k === 'cristal') c++; return c; };
  ok(cristales({}) === 0 && cristales({ puestosRuta: arreglados(['B']) }) > 10, 'la pintora pide cristales sólo si un puesto a tu alcance los vende');
  // con la vaca (y nada más), la panadera de confianza puede pedir leche; con la chancha, el carpintero chorizo
  const pide = (k, x, b) => { for (let d = 1; d <= 300; d += 3) if (P.pedidoDe(conRep(partida(x), k, 16), k, d).k === b) return true; return false; };
  ok(pide('panadera', { granja: { ...G.granjaNueva(5), vaca: { id: 1 } } }, 'leche') && !pide('panadera', {}, 'leche'), 'la panadera pide leche sólo si la conseguís (la vaca)');
  ok(pide('panadera', { entradas: { leche: { cantidad: 0 } } }, 'leche'), 'o si ya la conocés (se compra en el Mallín)');
  ok(pide('carpintero', { granja: { ...G.granjaNueva(5), chancha: { id: 2 } } }, 'chorizo') && !pide('carpintero', { entradas: { chorizo: { cantidad: 4 } } }, 'chorizo'), 'el carpintero pide chorizo con la chancha; conocerlo no alcanza');

  // 5. no cambia de idea a mitad de la ventana (y en la que sigue, sí puede)
  {
    let vista = 0;
    for (let d = 1; d <= 300 && !vista; d += 3) {
      if (pedidoViejo(3, 'panadera', d).k !== 'leche') continue;
      vista = d;
      const p = conRep(partida(), 'panadera', 16);
      const q0 = P.pedidoDe(p, 'panadera', d);
      p.granja = { ...G.granjaNueva(5), vaca: { id: 1 } }; p.entradas.leche = { dia: d, hora: 8, cantidad: 4 };
      const q1 = P.pedidoDe(p, 'panadera', d + 1);
      ok(q0.k !== 'leche' && q1.k === q0.k && q1.id === q0.id, `día ${d}: te pidió ${q0.k}; con la vaca a mitad de la ventana sigue pidiendo ${q1.k}`);
      eq(p.negocios.fijos.panadera, { id: q0.id, k: q0.k }, 'queda anotado lo fijado');
      const p2 = conRep(partida({ granja: { ...G.granjaNueva(5), vaca: { id: 1 } } }), 'panadera', 16);
      eq(P.pedidoDe(p2, 'panadera', d + 1).k, 'leche', 'con la vaca desde antes, esa ventana es de leche');
      const otra = P.pedidoDe(p, 'panadera', d + 3);
      ok(otra.id !== q0.id && p.negocios.fijos.panadera.id === otra.id, 'en la ventana siguiente se vuelve a elegir');
    }
    ok(vista > 0, 'hubo una ventana en que la 4.25.3 pedía leche');
    // perder la fuente a mitad tampoco lo cambia (te lo pidió: puede vencer, sin castigo)
    const p = conRep(partida({ granja: { ...G.granjaNueva(5), frutales: frutales(['cerezo']) } }), 'pintora', 16);
    let d = 1; while (d < 300 && P.pedidoDe(conRep(partida({ granja: { ...G.granjaNueva(5), frutales: frutales(['cerezo']) } }), 'pintora', 16), 'pintora', d).k !== 'cereza') d += 3;
    const a = P.pedidoDe(p, 'pintora', d);
    p.granja.frutales = {};
    ok(a.k === 'cereza' && P.pedidoDe(p, 'pintora', d).k === 'cereza', 'sin el cerezo a mitad de la ventana, sigue el pedido de cerezas');
    // un fijo de otra ventana o roto no cuenta
    const z = conRep(partida(), 'carpintero', 0); z.negocios.fijos = { carpintero: { id: 'carpintero|9999', k: 'lana' } };
    eq(P.pedidoDe(z, 'carpintero', 5).k, pedidoViejo(0, 'carpintero', 5).k, 'un fijo de otra ventana no cuenta');
    const y = conRep(partida(), 'carpintero', 0); y.negocios.fijos = { carpintero: { id: `carpintero|${P.ventanaDe(5)}`, k: 'leche' } };
    ok(P.pedidoDe(y, 'carpintero', 5).k !== 'leche', 'un fijo con algo que el vecino no pide no cuenta');
    // entregar y cobrar con lo fijado
    const e = conRep(partida(), 'herrero', 0);
    const q = P.pedidoDe(e, 'herrero', 5);
    e.materiales[q.k] = q.n;
    const r = P.cerrarPedido(e, 'herrero', 5, 'x');
    ok(r.ok && r.premio === q.premio && P.pedidoDe(e, 'herrero', 5) === null, 'se entrega y se cobra lo de siempre');
  }

  // 6. el guardado: `fijos` es optativo, se sanea, y una partida vieja carga igual
  {
    const vieja = N.sanearNegocios({ rep: { herrero: 4 }, pedidos: {} }, 10);
    ok(!Object.hasOwn(vieja, 'fijos'), 'una partida sin «fijos» carga sin la clave');
    eq(N.sanearNegocios(N.negociosNuevo(), 10), N.negociosNuevo(), 'una partida nueva queda igual');
    const s = N.sanearNegocios({ fijos: { herrero: { id: 'herrero|3', k: 'piedra' }, maestra: { id: 'maestra|3', k: 'no-es-bien' }, pintora: { id: 5, k: 'cristal' }, otro: 'x' } }, 10);
    eq(s.fijos, { herrero: { id: 'herrero|3', k: 'piedra' } }, 'se queda sólo lo sano');
    const p = conRep(partida(), 'telegrafista', 0);
    P.pedidoDe(p, 'telegrafista', 7);
    const vuelta = N.sanearNegocios(JSON.parse(JSON.stringify(p.negocios)), 7);
    eq(vuelta.fijos, p.negocios.fijos, 'lo fijado vuelve igual del guardado');
  }
  ok(/sanearNegocios\(p\.negocios, limpio\.dia\)/.test(leer('src/guardado.js')), 'guardado.js sanea los negocios con sanearNegocios');
  return n;
}

// ---------------------------------------------------------------- 0. antes: el pedidos.js de main (4.25.3) pide lo imposible
let antes = 'sin git';
{
  const r = spawnSync('git', ['show', 'v4.25.3:src/pedidos.js'], { cwd: raiz, encoding: 'utf8' });
  const r2 = r.status === 0 ? r : spawnSync('git', ['show', 'main:src/pedidos.js'], { cwd: raiz, encoding: 'utf8' });
  if (r2.status === 0 && !r2.stdout.includes('seConsigue')) {
    const f = path.join(src, 'pedidos.antes-4-25-3.js');
    fs.writeFileSync(f, r2.stdout);
    try {
      const V = await import(pathToFileURL(f).href + '?antes');
      let imposibles = 0;
      for (const k of VECINOS) for (let d = 1; d <= 300; d += 3) {
        const p = partida(); p.negocios = Nreal.negociosNuevo(); p.negocios.rep[k] = 16;
        const q = V.pedidoDe(p, k, d);
        if (q && !Preal.seConsigue(partida(), q.k)) imposibles++;
      }
      assert.ok(imposibles > 100, `la 4.25.3 pedía cosas imposibles sin granja (${imposibles})`);
      antes = `la 4.25.3 pedía ${imposibles} cosas imposibles en 2.000 ventanas de confianza sin granja`;
    } finally { fs.rmSync(f, { force: true }); }
  }
}

// ---------------------------------------------------------------- 1. lo de verdad
const total = revisar(Preal, Nreal);

// ---------------------------------------------------------------- 2. las mutaciones (copias con otro nombre en src/, cada una una vez)
const MUT_PEDIDOS = [
  ['sin el filtro de lo que se consigue', ".filter((b) => seConsigue(p, b));", ';'],
  ['los cristales del valle', "'trucha-ahumada', 'hongos-secos', 'calafate-seco', 'frasco-frutilla']);", "'trucha-ahumada', 'hongos-secos', 'calafate-seco', 'frasco-frutilla', 'cristal']);"],
  ['el puesto vende lo que no conocés', "if (BIENES[bien].donde === 'entrada' && !p?.entradas?.[bien]) return false;", ''],
  ['una parada que no está en el valle', "'Parada Arrayanes', 'Aldea de los Duendes'];", "'Parada Arrayanes', 'Aldea de los Duendes', 'Parada Alta'];"],
  ['los puestos de ruta sin arreglar', '>= ETAPAS_TOTAL).map', '>= 0).map'],
  ['el chorizo sin chancha', '  chorizo: conChancha,', '  chorizo: () => true,'],
  ['el cordero sin paridera', "(Number(g?.paridera) || 0) > 0 ||", ''],
  ['cualquier frutal da cualquier fruta', '&& FRUTALES[x.especie].fruta === fruta);', ');'],
  ['la mermelada sin receta', "&& (!!p?.cocina?.sabe?.mermeladas || !!p?.entradas?.[bien]);", ';'],
  ['la leche sin vaca', '  leche: (g) => !!g?.vaca,', '  leche: (g) => !!g,'],
  ['cambia de idea a mitad de la ventana', 'if (fijo && fijo.id === id && NECESITA[k].includes(fijo.k)) bien = fijo.k;', 'if (false) bien = fijo.k;'],
  ['un fijo de otra ventana', 'if (fijo && fijo.id === id && NECESITA[k].includes(fijo.k))', 'if (fijo && NECESITA[k].includes(fijo.k))'],
  ['otra paga', 'base: 1.1,', 'base: 1.15,'],
  ['el filtro antes del nivel', ".slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2).filter((b) => seConsigue(p, b));", ".filter((b) => seConsigue(p, b)).slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2);"],
];
const MUT_NEGOCIOS = [
  ['no se guarda lo fijado', '    ...(Object.keys(fijos).length ? { fijos } : {}),\n', ''],
  ['se guarda cualquier cosa', '&& esBien(x.k) ? { id: x.id, k: x.k } : null), 40);', '? { id: x.id, k: x.k } : null), 40);'],
  ['la clave siempre', '    ...(Object.keys(fijos).length ? { fijos } : {}),', '    fijos,'],
];
const textoP = leer('src/pedidos.js'), textoN = leer('src/negocios.js');
let atrapadas = 0, i = 0;
const probar = async (nombre, archivo, texto, de, a) => {
  i++;
  assert.ok(texto.includes(de), `la mutación «${nombre}» no encuentra su texto`);
  const copia = path.join(src, `${archivo}.mut${i}-4-26-0-a.js`);
  fs.writeFileSync(copia, texto.replace(de, a));
  try {
    const M = await import(pathToFileURL(copia).href);
    const P = archivo === 'pedidos' ? M : Preal, N = archivo === 'negocios' ? M : Nreal;
    let vive = true;
    try { revisar(P, N); } catch { vive = false; }
    assert.ok(!vive, `la mutación «${nombre}» (${archivo}.js) no la atrapa nadie`);
    atrapadas++;
  } finally { fs.rmSync(copia, { force: true }); }
};
for (const [nombre, de, a] of MUT_PEDIDOS) await probar(nombre, 'pedidos', textoP, de, a);
for (const [nombre, de, a] of MUT_NEGOCIOS) await probar(nombre, 'negocios', textoN, de, a);

console.log(`verificar-4-26-0-a: ${total} comprobaciones OK · ${atrapadas} de ${MUT_PEDIDOS.length + MUT_NEGOCIOS.length} mutaciones atrapadas · antes: ${antes} · sin nada a mano cambian ${RESUMEN.cambios}`);
