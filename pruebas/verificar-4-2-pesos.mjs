// 4.2: los pesos como costo de construcción de cualquier plano (src/obra-pesos.js), en Node:
//   · el costo en pesos por pieza y por etapa (`pesos: N` junto a `pide`), leído de lo que cada plano declara;
//   · el cobro (se paga al hacer la etapa), el aviso de lo que falta y que sin plata no se construye;
//   · la devolución al retirar la marca y el reintegro (la mitad) al desmontar, que sólo cuenta lo que de verdad se pagó;
//   · la partida vieja (sin economía, sin `pagadas`) queda como estaba, y `pagadas` sobrevive al guardado;
//   · las tres casas, iguales que antes (precios, reparto, textos, libro);
//   · las cinco piezas de lujo (planos-lujo.js): están, cuestan, arman su geometría dentro de lo que miden y de un presupuesto de triángulos;
//   · main.js cobra en los tres caminos (pieza nueva, pieza a medias, obra grande) y el desafío lo ignora.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO, PLANOS } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const O = await import('../src/obra-pesos.js');
const R = await import('../src/propiedad.js');
const { economiaNueva, pesosDe, formatoPesos } = await import('../src/economia.js');
const { PIEZAS_LUJO } = await import('../src/planos-lujo.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const relax = (pesos, dia = 4) => ({ modo: 'relax', dia, economia: { ...economiaNueva(), pesos } });

const IDS_LUJO = ['vitrina-roble', 'reloj-pie', 'alfombra-tejida-grande', 'arana-velas', 'fuente-piedra'];
const PRECIOS_LUJO = { 'vitrina-roble': 4500, 'reloj-pie': 9000, 'alfombra-tejida-grande': 2400, 'arana-velas': 6500, 'fuente-piedra': 14000 };
const MATERIALES = new Set(['tabla', 'tronco', 'piedra', 'lana']);
// la escala de PRECIOS_CONSTRUCCION.md
const ESCALA = { 'mueble bueno': [800, 3000], lujo: [4000, 20000], 'edificio de oficio': [15000, 60000], 'ampliación de casa': [20000, 80000] };

// ---------------------------------------------------------------- 1. leer lo que el plano declara
{
  eq(O.preciosDePlano({ etapas: [{ pide: { tabla: 1 }, pesos: 1200 }] }), [1200], 'una etapa con pesos');
  eq(O.preciosDePlano({ pesos: 3000, etapas: [{}] }), [3000], 'pesos en el plano, una etapa: todo ahí');
  eq(O.preciosDePlano({ etapas: [{ pesos: 1000 }, { pesos: 2500 }, {}] }), [1000, 2500, 0], 'pesos por etapa: lo que no declara, cero');
  eq(O.preciosDePlano({ etapas: [{ pesos: 1000 }, {}], pesos: 9999 }), [1000, 0], 'si las etapas declaran, mandan las etapas');
  eq(O.preciosDePlano({ pesos: 10000, etapas: [{}, {}, {}, {}] }), [2500, 2500, 2500, 2500], 'en el plano con varias etapas: parejo');
  eq(O.preciosDePlano({ pesos: 10000, repartoPesos: [0.35, 0.2, 0.25, 0.2], etapas: [{}, {}, {}, {}] }), [3500, 2000, 2500, 2000], 'o con su reparto');
  ok(O.preciosDePlano({ pesos: 10001, repartoPesos: [1, 1, 1], etapas: [{}, {}, {}] }).reduce((a, b) => a + b, 0) === 10001, 'la última ajusta: siempre suma el total');
  eq(O.preciosDePlano({ etapas: [{ pide: { tabla: 2 } }] }), [], 'sin pesos no hay precios');
  eq(O.preciosDePlano({ pesos: -5, etapas: [{ pesos: 'mucho' }, { pesos: NaN }] }), [], 'basura: sin precio, nunca negativo ni NaN');
  eq(O.preciosDePlano(null), [], 'ni plano');
  ok(O.preciosDePlano({ etapas: [{ pesos: 1e15 }] })[0] === O.PESOS_MAX_POR_ETAPA, 'con techo');
  ok(O.preciosDePlano({ etapas: [{ pesos: 1234.9 }] })[0] === 1234, 'enteros');
}

// ---------------------------------------------------------------- 2. las tres casas, iguales que antes
{
  const A = { 'cabana-piedra': [12600, 7200, 9000, 7200], 'casa-galeria': [23100, 13200, 16500, 13200], casona: [38500, 22000, 27500, 22000] };
  for (const [id, partes] of Object.entries(A)) {
    for (let i = 0; i < 4; i++) eq(R.precioDeEtapa(id, i), partes[i], `${id}: la etapa ${i}`);
    eq(R.precioDeEtapa(id, 4), 0, `${id}: fuera de las etapas, nada`); eq(R.precioDeEtapa(id, -1), 0, `${id}: ni antes`);
    eq(O.precioTotal(id), R.PROPIEDAD.casas[id].total, `${id}: suma el total`);
    eq(R.precioDeEtapa, O.precioDeEtapa, 'propiedad.js re-exporta la misma función');
  }
  eq(O.precioTotal('cabana-piedra'), 36000, 'cabaña $36.000'); eq(O.precioTotal('casa-galeria'), 66000, 'galería $66.000'); eq(O.precioTotal('casona'), 110000, 'casona $110.000');
  // pagar y devolver, con los textos y el libro de siempre
  const p = relax(100000);
  eq(R.pagarEtapa(p, 'cabana-piedra', 0), { ok: true, precio: 12600 }, 'paga la primera');
  eq(pesosDe(p), 87400, 'y el saldo baja');
  const l = p.economia.libro.at(-1);
  eq([l.monto, l.motivo, l.con], [-12600, 'Terreno y mano de obra: la cabaña', 'Obra de la casa'], 'el libro dice lo de siempre');
  eq(R.devolverEtapasPagadas(p, 'cabana-piedra', 1), 12600, 'devuelve la primera');
  const d = p.economia.libro.at(-1);
  eq([d.monto, d.motivo, d.con], [12600, 'Devolución del terreno y la mano de obra: la cabaña', 'Los albañiles de la aldea'], 'y lo anota como siempre');
  eq(pesosDe(p), 100000, 'vuelve entero');
  eq(R.devolverEtapasPagadas(p, 'casona', 99), R.devolverEtapasPagadas(relax(0), 'casona', 4), 'las etapas exageradas se acotan a las cuatro');
  eq(R.devolverEtapasPagadas(p, 'casona', -3), 0, 'ni negativas');
  eq(O.reintegroAlDesmontar(p, 'cabana-piedra', 4, 4), 0, 'al desmontar una casa no hay reintegro (así estaba)');
  const a = O.avisoSinPlata('casona', { precio: 38500, falta: 1500 }, 4);
  eq(a, { titulo: 'Falta plata para esta etapa', detalle: 'El terreno y la mano de obra cuestan $38.500 y te faltan $1.500. El banco te puede prestar' }, 'el aviso de las casas es el de siempre');
  eq(O.textoDeLoPagado('casona'), 'del terreno y la mano de obra', 'y el de la marca retirada');
}

// ---------------------------------------------------------------- 3. el circuito con un edificio por etapas inventado (la plantilla de lo que viene)
{
  const edificio = { id: 'prueba-oficio-42', nombre: 'Taller de prueba', etapas: [{ pide: { tabla: 4 }, pesos: 6000 }, { pide: { tronco: 2 } }, { pide: { piedra: 6 }, pesos: 9000 }] };
  ok(O.registrarPreciosDePlano(edificio), 'se anota');
  eq([0, 1, 2, 3].map((i) => O.precioDeEtapa(edificio.id, i)), [6000, 0, 9000, 0], 'precio por etapa');
  eq(O.precioTotal(edificio.id), 15000, 'total'); eq(O.etapasConPrecio(edificio.id), 3, 'tres etapas');
  const p = relax(7000);
  eq(O.puedePagarEtapa(p, edificio.id, 0), { ok: true, precio: 6000 }, 'con plata alcanza');
  eq(O.puedePagarEtapa(p, edificio.id, 2), { ok: false, precio: 9000, falta: 2000 }, 'sin plata dice cuánto falta');
  eq(O.puedePagarEtapa(p, edificio.id, 1), { ok: true, precio: 0 }, 'una etapa sin precio es libre');
  eq(O.pagarEtapa(p, edificio.id, 0), { ok: true, precio: 6000 }, 'cobra');
  eq(pesosDe(p), 1000, 'el saldo');
  eq(O.pagarEtapa(p, edificio.id, 2), { ok: false, precio: 9000, falta: 8000 }, 'sin plata no cobra');
  eq(pesosDe(p), 1000, 'y no toca el saldo');
  eq(p.economia.libro.at(-1).motivo, 'Mano de obra: taller de prueba', 'el libro dice qué fue');
  eq(O.devolverEtapasPagadas(p, edificio.id, 1), 6000, 'retirar la marca devuelve lo pagado');
  eq(O.devolverEtapasPagadas(p, edificio.id, 3), 15000, 'con las tres pagadas, todo');
  eq(O.devolverEtapasPagadas(p, edificio.id, 0), 0, 'sin pagar, nada');
  // en el Desafío y sin economía (partida de antes): ni se cobra ni se devuelve
  const d = { modo: 'desafio', economia: economiaNueva() }; d.economia.pesos = 50000;
  eq(O.puedePagarEtapa(d, edificio.id, 0), { ok: true, precio: 0 }, 'el Desafío no cobra');
  eq(O.pagarEtapa(d, edificio.id, 0), { ok: true, precio: 0 }, 'ni paga');
  eq(O.devolverEtapasPagadas(d, edificio.id, 3), 0, 'ni devuelve');
  eq(O.reintegroAlDesmontar(d, edificio.id, 3, 3), 0, 'ni reintegra');
  eq(O.totalParaMostrar(d, edificio.id), 0, 'ni lo muestra');
  const vieja = { dia: 1 };
  eq(O.puedePagarEtapa(vieja, edificio.id, 0), { ok: true, precio: 0 }, 'una partida de antes de la economía no cobra');
  eq(O.textoPrecio(vieja, edificio.id, 0), '', 'y no muestra precio');
  eq(O.textoPrecio(relax(0), edificio.id, 0), '$6.000', 'con economía, «$6.000»');
  eq(O.puedePagarEtapa(relax(100), 'no-existe', 0), { ok: true, precio: 0 }, 'un plano sin precio es libre');
  eq(O.puedePagarEtapa(relax(100), edificio.id, 1.5), { ok: true, precio: 0 }, 'una etapa rara: libre, no explota');
  // el reintegro al desmontar: la mitad, sólo de lo hecho Y pagado
  const q = relax(0);
  eq(O.reintegroAlDesmontar(q, edificio.id, 3, 3), 7500, 'la mitad de $15.000');
  eq(pesosDe(q), 7500, 'entra a la billetera'); eq(q.economia.libro.at(-1).motivo, 'Reintegro por desmontar: taller de prueba', 'y se anota');
  eq(O.reintegroAlDesmontar(relax(0), edificio.id, 3, 0), 0, 'una obra de una partida anterior al precio (sin `pagadas`) no devuelve plata que nunca se pagó');
  eq(O.reintegroAlDesmontar(relax(0), edificio.id, 1, 3), 3000, 'las etapas hechas mandan: una sola, la mitad de $6.000');
  eq(O.reintegroAlDesmontar(relax(0), edificio.id, 3, 1), 3000, 'y las pagadas también');
  // el aviso
  eq(O.avisoSinPlata(edificio.id, { precio: 9000, falta: 2000 }, 3), { titulo: 'Falta plata para esta etapa', detalle: 'La mano de obra cuesta $9.000 y te faltan $2.000. El banco te puede prestar' }, 'aviso de varias etapas');
  eq(O.avisoSinPlata(edificio.id, { precio: 9000, falta: 2000 }, 1).titulo, 'Falta plata para esta pieza', 'y el de una pieza');
  eq(O.listaDeFaltantes(['2 tablas'], { ok: false, precio: 9000, falta: 2000 }), ['2 tablas', '$2.000'], 'materiales y pesos en una sola lista');
  eq(O.listaDeFaltantes([], { ok: true, precio: 0 }), [], 'sin faltantes');
  eq(O.listaDeFaltantes(['1 tabla'], { ok: true, precio: 500 }), ['1 tabla'], 'con plata, sólo materiales');
}

// ---------------------------------------------------------------- 4. lo que declara un plano es lo que cuesta (y las casas siguen con los precios de propiedad.js)
{
  const registrados = new Set(O.preciosRegistrados());
  for (const p of PLANOS) {
    const declara = O.preciosDePlano(p).some((x) => x > 0);
    if (declara) {
      ok(registrados.has(p.id), `${p.id}: declara pesos y está registrado`);
      eq(O.precioTotal(p.id), O.preciosDePlano(p).reduce((a, b) => a + b, 0), `${p.id}: el total es la suma de sus etapas`);
    } else ok(registrados.has(p.id) === Object.hasOwn(R.PROPIEDAD.casas, p.id), `${p.id}: sin pesos declarados sólo cuestan las casas`);
  }
  for (const id of Object.keys(R.PROPIEDAD.casas)) ok(!PLANO[id].pesos && PLANO[id].etapas.every((e) => !e.pesos), `${id}: el precio de la casa sigue en propiedad.js, no en el plano`);
  for (const id of IDS_LUJO) ok(registrados.has(id), `${id}: registrado`);
}

// ---------------------------------------------------------------- 5. las cinco piezas de lujo
ok(PIEZAS_LUJO.length === 5 && IDS_LUJO.every((id) => PIEZAS_LUJO.some((p) => p.id === id)), 'las cinco del pedido');
for (const id of IDS_LUJO) {
  const P = PLANO[id];
  ok(P && P.pieza === true && P.etapas.length === 1 && P.etapas[0].termina, `${id}: está en el catálogo, una etapa`);
  ok(P.soloRelax === true && !P.soloDesafio, `${id}: sólo en el Relax`);
  ok(['mobiliario', 'exterior'].includes(P.categoria), `${id}: en una categoría que existe (${P.categoria})`);
  ok(Object.entries(P.pide).every(([k, c]) => MATERIALES.has(k) && Number.isInteger(c) && c > 0), `${id}: materiales que existen`);
  ok(P.nombre && P.texto && P.texto.length > 60 && P.radio > 0 && P.separacion > 0, `${id}: nombre, texto y medidas`);
  eq(P.etapas[0].pesos, PRECIOS_LUJO[id], `${id}: la etapa declara su precio`);
  eq(P.pesos, PRECIOS_LUJO[id], `${id}: y el plano también`);
  eq(O.precioDeEtapa(id, 0), PRECIOS_LUJO[id], `${id}: el registro tiene ${formatoPesos(PRECIOS_LUJO[id])}`);
  ok(PRECIOS_LUJO[id] % 50 === 0, `${id}: precio redondo ($50)`);
  const [min, max] = id === 'alfombra-tejida-grande' ? ESCALA['mueble bueno'] : ESCALA.lujo;
  ok(PRECIOS_LUJO[id] >= min && PRECIOS_LUJO[id] <= max, `${id}: dentro de la escala (${formatoPesos(min)} a ${formatoPesos(max)})`);
  // la geometría: sin números rotos, sólo madera y piedra (tipo 0 y 4), dentro de lo que dice medir, con presupuesto de triángulos
  for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {
    const c = new Constructor(); P.etapas[0].arma(c, P, {}, suelo);
    ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), `${id}: dibuja sin números rotos`);
    ok(c.tipo.every((t) => t === 0 || t === 4), `${id}: sólo tipo 0 y 4`);
  }
  const c = new Constructor(); P.etapas[0].arma(c, P, {}, null);
  ok(c.pos.length / 9 <= 1000, `${id}: ${Math.round(c.pos.length / 9)} triángulos (tope 1000; la mediana del juego es ~250)`);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); }
  ok(y0 >= (id === 'fuente-piedra' ? -0.15 : -0.02), `${id}: no se hunde (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.12 && y1 >= P.alto * 0.45, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.12, `${id}: entra en su ancho`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.12, `${id}: entra en su fondo`);
  // la física
  const reg = { s: [], c: [] };
  if (P.fisica) P.fisica({ segmento: (...a) => reg.s.push(a), circulo: (...a) => reg.c.push(a), plataforma: () => {} });
  const colgada = id === 'arana-velas' || id === 'alfombra-tejida-grande';
  if (colgada) ok(reg.s.length + reg.c.length === 0, `${id}: no choca`);
  else {
    ok(reg.s.length + reg.c.length >= 1, `${id}: choca`);
    for (const s of reg.s) ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6] && s[6] <= P.alto + 0.1, `${id}: segmento sano`);
    for (const q of reg.c) ok(q.length === 5 && q.every(Number.isFinite) && q[2] > 0 && q[3] < q[4] && q[4] <= P.alto + 0.1, `${id}: círculo sano`);
    const alcance = Math.max(0, ...reg.s.map((s) => Math.max(Math.abs(s[0]), Math.abs(s[2])) + s[4]), ...reg.c.map((q) => Math.abs(q[0]) + q[2]));
    ok(alcance <= P.ancho / 2 + 0.12, `${id}: el choque cabe en su ancho (${alcance.toFixed(2)})`);
  }
}
ok(PLANO['reloj-pie'].alcanceE > 0 && PIEZAS_LUJO.find((p) => p.id === 'reloj-pie').alcanceE === PLANO['reloj-pie'].alcanceE, 'el reloj de pie se usa con E de cerca');
ok(IDS_LUJO.every((id) => !PLANO[id].funciones?.includes('luz')), 'sin luces dinámicas nuevas');
ok(PRECIOS_LUJO['fuente-piedra'] > PRECIOS_LUJO['reloj-pie'] && PRECIOS_LUJO['reloj-pie'] > PRECIOS_LUJO['arana-velas'] && PRECIOS_LUJO['arana-velas'] > PRECIOS_LUJO['vitrina-roble'] && PRECIOS_LUJO['vitrina-roble'] > PRECIOS_LUJO['alfombra-tejida-grande'], 'lo más grande y más trabajado cuesta más');

// ---------------------------------------------------------------- 6. el guardado: `pagadas` sobrevive y la partida vieja queda igual
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  const obras = [
    { plano: 'vitrina-roble', x: 1, z: 2, rot: 0, etapas: 1, pagadas: 1 },     // nueva: pagada
    { plano: 'baul', x: 3, z: 2, rot: 0, etapas: 1 },                            // de antes: sin `pagadas`
    { plano: 'cabana-piedra', x: 9, z: 9, rot: 0, etapas: 2, pagadas: 2 },       // una casa a medias
  ];
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 5, horas: 10, obras, economia: { ...economiaNueva(), pesos: 500 } }), 'se guarda');
  const r = G.leerPartida('relax', 1).progreso;
  eq(r.obras.map((o) => o.pagadas), [1, undefined, 2], 'lo pagado vuelve igual; lo viejo sigue sin `pagadas`');
  ok(!('pagadas' in r.obras[1]), 'y no se le inventa uno');
  eq(r.economia.pesos, 500, 'el saldo vuelve');
  // lo pagado por una obra de una partida vieja: cero => no hay nada que devolver ni reintegrar
  eq(O.reintegroAlDesmontar(relax(0), 'vitrina-roble', r.obras[1].etapas, r.obras[1].pagadas || 0), 0, 'una pieza vieja desmontada no regala pesos');
  eq(O.reintegroAlDesmontar(relax(0), 'vitrina-roble', r.obras[0].etapas, r.obras[0].pagadas || 0), 2250, 'una pagada devuelve la mitad ($2.250 de $4.500)');
  // una partida vieja entera (sin economía) puede construir las piezas de lujo sin que se cobre ni se rompa
  eq(O.puedePagarEtapa({ dia: 3 }, 'vitrina-roble', 0), { ok: true, precio: 0 }, 'partida sin economía: libre');
}

// ---------------------------------------------------------------- 7. main.js usa todo esto
{
  const m = leer('src/main.js');
  const tiene = (t, msg) => ok(m.includes(t), msg);
  tiene("import { precioTotal, precioDeEtapa, avisoSinPlata, listaDeFaltantes, textoDeLoPagado, reintegroAlDesmontar } from './obra-pesos.js';", 'main.js trae lo de obra-pesos.js');
  tiene('function pagoDeEtapa(plano, datos, i) {\n  if (desafio || i < (datos?.pagadas || 0)) return { ok: true, precio: 0 };', 'el Desafío y lo ya pagado no cobran');
  tiene('pagoNueva = pagoDeEtapa(obras.plano, null, 0);', 'la pieza nueva mira los pesos antes de fundarse');
  tiene('if (faltaPieza.length || !pagoNueva.ok) { notaSinPlata(obras.plano, 0, pagoNueva, faltaPieza); return; }', 'y no se funda sin plata');
  tiene('cobrarEtapa(obras.plano, nueva.datos, 0, pagoNueva);', 'cobra cuando se arma');
  tiene('const etapaPieza = obra.datos.etapas, pagoPieza = pagoDeEtapa(obra.plano, obra.datos, etapaPieza);', 'la pieza a medias también');
  tiene('cobrarEtapa(obra.plano, obra.datos, etapaPieza, pagoPieza);', 'cobra su etapa');
  ok(m.indexOf('if (!pagoPieza.ok)') < m.indexOf('cobrarEtapa(obra.plano, obra.datos, etapaPieza, pagoPieza)'), 'primero se mira, después se cobra');
  tiene('const a = avisoSinPlata(obra.plano.id, pago, obra.plano.etapas.length); nota(a.titulo, a.detalle);', 'la obra grande avisa con el texto del registro');
  tiene('if (pago.precio) { pagarEtapa(progreso, obra.plano.id, etapaCasa, \'Los albañiles de la aldea\'); obra.datos.pagadas = etapaCasa + 1; }', 'la cuenta de las casas, intacta');
  tiene('const devuelto = devolverEtapasPagadas(progreso, r.plano.id, r.datos?.pagadas || 0);', 'retirar la marca devuelve');
  tiene('const reint = reintegroAlDesmontar(progreso, r.plano.id, r.datos?.etapas || 0, r.datos?.pagadas || 0);', 'desmontar reintegra');
  ok(m.indexOf('const reint = reintegroAlDesmontar') < m.indexOf("nota(`${r.plano.nombre} ${participioObra(r.plano.nombre, 'desmontad')}`, [devuelto"), 'antes de avisar');
  tiene('const pesosPl = hayEconomia(progreso) ? precioTotal(pl.id) : 0;', 'la lista muestra el precio');
  tiene("(faltaPl ? ' sinplata' : '')", 'y marca el que no alcanza');
  tiene("${faltaPl ? ' (no alcanza)' : ''}", 'con texto, no sólo color');
  tiene("$('obra-costo').textContent = `Costo total · ${costoPlano(p)}${totalPesos ? ` · ${formatoPesos(totalPesos)}` : ''}`;", 'la ficha muestra el costo total en pesos');
  tiene("case 'reloj-pie':   // 4.2", 'el reloj de pie se usa con E');
  const h = leer('src/plantilla.html');
  ok(h.includes('.obra li.sinplata i') && h.includes('.obra .planos button.sinplata'), 'y los estilos están');
  const c = leer('src/construccion.js');
  ok(c.includes('PIEZAS.push(...PIEZAS_MUEBLES, ...PIEZAS_MUEBLES_2)') && c.includes('PIEZAS.push(...PIEZAS_LUJO)'), 'construccion.js suma el lujo');
  ok(c.includes('registrarPreciosDePlano(p);'), 'y anota los precios de todo plano');
  const g = leer('src/guardado.js');
  ok(g.includes('d.pagadas = Math.max(0, Math.min(8, Math.floor(finito(d.pagadas, 0))))'), 'guardado.js sigue sanando `pagadas` (no se tocó)');
  for (const f of ['src/obra-pesos.js', 'src/planos-lujo.js']) {
    const t = leer(f);
    for (const x of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(x[0]), `${f}: import en una línea y sin comentario atrás`);
    ok(!/ñ/.test([...t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)].map((x) => x[1]).join(' ')), `${f}: exporta sin ñ`);
    ok(!/\|\|\s*'escuela'|\bmando\b|gamepad/i.test(t), `${f}: nada fuera de lugar`);
  }
}

// ---------------------------------------------------------------- 8. la escala documentada
{
  const doc = leer('PRECIOS_CONSTRUCCION.md');
  for (const [id, precio] of Object.entries(PRECIOS_LUJO)) ok(doc.includes(formatoPesos(precio)), `PRECIOS_CONSTRUCCION.md menciona ${id} (${formatoPesos(precio)})`);
  for (const t of Object.keys(ESCALA)) ok(doc.toLowerCase().includes(t), `la escala dice «${t}»`);
  ok(doc.includes('pesos:') && doc.includes('sumar-prueba'), 'y trae la receta para agregar una pieza con pesos');
}

console.log(`verificar-4-2-pesos: ${n} verificaciones ok`);
