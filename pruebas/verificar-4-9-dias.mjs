// 4.9 (dias): los días entre noches ya no están vacíos.
//   1. el contrato de la aldea (VECINOS_AYUDA, nivelAyuda, aldeaNueva, sanearAldea) y el guardado de partidas viejas
//   2. los pedidos: el catálogo, lo que cuestan y el regalito (que nunca es un negocio)
//   3. cuándo piden, el plazo, uno por vecino y por día, y que no tocan el azar de las noches
//   4. la entrega: cobra, sube la ayuda, no entrega sin lo pedido ni vencido
//   5. el pronóstico: la noche y el lado anticipados son los que después ocurren (30 noches, varias semillas)
//   6. el enganche con el juego (tablón, cuaderno, mapa, E)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { generarTerreno } from '../src/terreno.js';
import { BASE_REFUGIO, SITIOS } from '../src/desafio-mapa.js';
import * as A from '../src/desafio-aldea.js';
import * as P from '../src/desafio-pronostico.js';
import * as L from '../src/desafio-lados.js';
import { sanearDesafio, desafioNuevo, nocheEspecial, esNocheDeJefe, NOCHE_FINAL, HORA_ATAQUE, HORA_AMANECER, ESPECIALES } from '../src/desafio-reglas.js';
import { azarEspecial } from '../src/meteo.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };
const igual = (a, b, m) => { assert.deepEqual(a, b, m); pasos++; };

// ================================================================ 1. el contrato
{
  igual(A.VECINOS_AYUDA, ['anselmo', 'herminia', 'martin', 'chicos'], 'los cuatro vecinos del contrato, en ese orden');
  ok(A.LIMITE_HORA === HORA_ATAQUE, 'el plazo vence a la hora en que salen los duendes');
  ok(A.AMANECER_HORA === HORA_AMANECER, 'y los pedidos empiezan con el sol');
  const n = A.aldeaNueva();
  for (const k of A.VECINOS_AYUDA) ok(A.nivelAyuda({ aldea: n }, k) === 0 && n.pedidos[k] === null, `${k} arranca en 0 y sin pedido`);
  ok(A.nivelAyuda({ aldea: { ayuda: { ramon: 2, anselmo: 1 } } }, 'ramon') === 0, 'aunque el dato exista, Ramón no es uno de los cuatro del contrato');
  ok(A.nivelAyuda(undefined, 'anselmo') === 0 && A.nivelAyuda({}, 'anselmo') === 0 && A.nivelAyuda({ aldea: null }, 'anselmo') === 0, 'sin aldea, 0');
  ok(A.nivelAyuda({ aldea: n }, 'ramon') === 0 && A.nivelAyuda({ aldea: n }, '__proto__') === 0 && A.nivelAyuda({ aldea: n }, 'constructor') === 0 && A.nivelAyuda({ aldea: n }, undefined) === 0, 'un vecino que no existe, 0');
  const d = { aldea: { ayuda: { anselmo: 1, herminia: 2, martin: 7, chicos: 'x' } } };
  ok(A.nivelAyuda(d, 'anselmo') === 1 && A.nivelAyuda(d, 'herminia') === 2, 'lee el nivel');
  ok(A.nivelAyuda(d, 'martin') === 2 && A.nivelAyuda(d, 'chicos') === 0, 'un nivel fuera de rango o raro se acota (7 → 2, «x» → 0)');
  ok(A.nivelAyuda({ aldea: { ayuda: { anselmo: -3 } } }, 'anselmo') === 0 && A.nivelAyuda({ aldea: { ayuda: { anselmo: 1.9 } } }, 'anselmo') === 1, 'negativo 0; con decimales, para abajo');
  // el saneo
  for (const raro of [null, undefined, 5, 'x', [], [1, 2], { ayuda: 3 }, { ayuda: [] }, { ayuda: null, pedidos: 7 }]) {
    const s = A.sanearAldea(raro);
    igual(s, A.aldeaNueva(), `saneo de ${JSON.stringify(raro)}: una aldea nueva`);
  }
  const s = A.sanearAldea({ ayuda: { anselmo: '2', herminia: 99, martin: -4, chicos: NaN, constructor: 2, __proto__: 1 }, cumplidos: -5, vencidos: 'x' });
  ok(s.ayuda.anselmo === 2 && s.ayuda.herminia === 2 && s.ayuda.martin === 0 && s.ayuda.chicos === 0, 'el saneo acota cada nivel');
  ok(Object.keys(s.ayuda).join() === A.VECINOS_AYUDA.join(), 'y no deja otras claves');
  ok(s.cumplidos === 0 && s.vencidos === 0, 'y los contadores');
  // los pedidos guardados: sólo uno que exista, con cosas que se pidan
  const bueno = A.pedidoDelDia(A.aldeaNueva(), 'anselmo', { dia: 3, noche: 2, semilla: 'X' });
  const g = A.aldeaNueva(); g.pedidos.anselmo = bueno;
  igual(A.sanearAldea(JSON.parse(JSON.stringify(g))).pedidos.anselmo, bueno, 'un pedido guardado vuelve igual');
  for (const malo of [{ id: 'no-existe', pide: { tabla: 3 }, desde: 1, hasta: 1 }, { id: 'tablas', pide: {}, desde: 1, hasta: 1 }, { id: 'tablas', pide: { oro: 9 }, desde: 1, hasta: 1 }, 'x', 7, []]) {
    const h = A.aldeaNueva(); h.pedidos.anselmo = malo;
    ok(A.sanearAldea(h).pedidos.anselmo === null, `un pedido raro no pasa: ${JSON.stringify(malo)}`);
  }
  const lleno = A.aldeaNueva(); lleno.ayuda.anselmo = 2; lleno.pedidos.anselmo = bueno;
  ok(A.sanearAldea(lleno).pedidos.anselmo === null, 'con la ayuda a pleno no queda un pedido colgado');
  const enorme = A.aldeaNueva(); enorme.pedidos.anselmo = { ...bueno, pide: { tabla: 5000 } };
  ok(A.sanearAldea(enorme).pedidos.anselmo.pide.tabla === 99, 'las cantidades tienen tope (99)');
  // la partida: nueva y vieja
  const nueva = desafioNuevo();
  igual(nueva.aldea, A.aldeaNueva(), 'el Desafío nuevo trae la aldea nueva');
  const vieja = sanearDesafio({ salud: 80, oleadas: 6 });
  igual(vieja.aldea, A.aldeaNueva(), 'una partida vieja (sin aldea) carga con todos en 0');
  ok(A.VECINOS_AYUDA.every((k) => A.nivelAyuda(vieja, k) === 0), '… y nivelAyuda lo lee');
  const guardada = sanearDesafio(JSON.parse(JSON.stringify({ ...sanearDesafio(null), aldea: { ...A.aldeaNueva(), ayuda: { anselmo: 2, herminia: 1, martin: 0, chicos: 1 }, cumplidos: 4 } })));
  ok(A.nivelAyuda(guardada, 'anselmo') === 2 && A.nivelAyuda(guardada, 'herminia') === 1 && guardada.aldea.cumplidos === 4, 'guardar y cargar conserva los niveles');
  ok(sanearDesafio({ aldea: 'basura' }).aldea.ayuda.anselmo === 0, 'una aldea que no es un objeto no rompe');
  const gsrc = leer('src/guardado.js');
  ok(/sanearDesafio\(p\.desafio\)/.test(gsrc), 'el guardado pasa el Desafío por sanearDesafio (y con él la aldea)');
  ok(JSON.stringify(sanearDesafio(JSON.parse(JSON.stringify(sanearDesafio({ aldea: { ayuda: { anselmo: 1 } } }))))) === JSON.stringify(sanearDesafio({ aldea: { ayuda: { anselmo: 1 } } })), 'sanear dos veces da lo mismo');
}

// ================================================================ 2. el catálogo de pedidos
const ESPANOL_MALO = /\b(the|and|you|with|for|quest|request|gift|reward|level)\b/i;   // nada de inglés
const RELIGIOSO = /\b(dios|santo|santa|virgen|cruz|reza|rezo|bendici|bendiga|amen|jesus|cristo|angel|diablo|demonio|milagro|oraci)/i;
{
  for (const k of A.VECINOS_AYUDA) {
    const lista = A.PEDIDOS[k];
    ok(lista.filter((e) => e.nivel === 0).length >= 2 && lista.filter((e) => e.nivel === 1).length >= 2, `${k}: al menos dos pedidos de cada tramo (para no repetir)`);
    ok(new Set(lista.map((e) => e.id)).size === lista.length, `${k}: ids únicos`);
    for (const e of lista) {
      ok(/^[a-z]+$/.test(e.id), `${k}/${e.id}: id sin ñ ni tildes`);
      ok(e.texto.length > 30 && e.texto.length < 260, `${k}/${e.id}: un texto corto con su voz`);
      ok(!ESPANOL_MALO.test(e.texto) && !RELIGIOSO.test(e.texto), `${k}/${e.id}: ni inglés ni nada religioso`);
      ok(Object.keys(e.pide).length >= 1 && Object.keys(e.pide).every((c) => A.COSAS_PEDIDAS.includes(c)), `${k}/${e.id}: pide cosas que existen en el Desafío`);
      if (e.regalo) ok(Object.keys(e.regalo).every((c) => A.COSAS_REGALO.includes(c)), `${k}/${e.id}: regala cosas que existen`);
    }
    for (const t of A.GRACIAS[k]) ok(t.length > 10 && !RELIGIOSO.test(t) && !ESPANOL_MALO.test(t), `${k}: el agradecimiento sin religión ni inglés`);
    for (const t of A.AYUDA_NIVEL[k]) ok(t.includes(A.VECINOS[k].nombre), `${k}: el texto de cada nivel nombra al vecino`);
  }
  ok(A.PEDIDOS.anselmo.some((e) => e.pide.tabla) && A.PEDIDOS.herminia.some((e) => e.pide.fruta) && A.PEDIDOS.chicos.some((e) => e.pide.piedra), 'cada uno pide lo suyo: tablas, frutas, piedras');
  // lo que cuesta crece con la noche y el regalo nunca es negocio
  let veces = 0;
  for (const k of A.VECINOS_AYUDA) for (const e of A.PEDIDOS[k]) {
    let antes = 0;
    for (let n = 1; n <= 40; n++) {
      const pide = A.pideEnLaNoche(e.pide, n), v = A.valorDe(pide);
      ok(Object.values(pide).every((c) => Number.isInteger(c) && c >= 1 && c <= 99), `${k}/${e.id} noche ${n}: cantidades enteras y con tope`);
      ok(v >= antes - 1e-9, `${k}/${e.id}: no cuesta menos en la noche ${n}`);
      antes = v;
      const reg = A.regaloEnLaNoche(e.regalo, pide);
      ok(A.valorDe(reg) <= v * 0.5 + 1e-9, `${k}/${e.id} noche ${n}: el regalo vale ${A.valorDe(reg).toFixed(2)} y lo entregado ${v.toFixed(2)}`);
      ok(v - A.valorDe(reg) > 0, `${k}/${e.id} noche ${n}: entregar siempre deja menos de lo que había`);
      veces++;
    }
    ok(A.valorDe(A.pideEnLaNoche(e.pide, 20)) > A.valorDe(A.pideEnLaNoche(e.pide, 1)), `${k}/${e.id}: la noche 20 cuesta más que la 1`);
  }
  ok(veces > 200, 'se revisaron todas las noches de todos los pedidos');
  // el segundo pedido de cada uno cuesta más que el primero (más ayuda, más cuesta)
  for (const k of A.VECINOS_AYUDA) {
    const v = (nivel) => Math.min(...A.PEDIDOS[k].filter((e) => e.nivel === nivel).map((e) => A.valorDe(e.pide)));
    ok(v(1) > v(0), `${k}: el segundo pedido es más caro que el primero`);
    ok(Math.min(...A.PEDIDOS[k].filter((e) => e.nivel === 0).map((e) => A.valorDe(e.pide))) >= 1, `${k}: ni el primero es un trámite gratis`);
  }
  { const g = A.regaloEnLaNoche({ cristal: 5, flechas: 40 }, { tabla: 2 }); ok(A.valorDe(g) <= A.valorDe({ tabla: 2 }) * 0.5, 'un regalo que se pasa se recorta hasta ser menos de la mitad de lo entregado'); ok(A.regaloEnLaNoche(null, { tabla: 2 }) === null, 'sin regalo, nada'); }
  ok(A.textoCosas({ tabla: 4 }) === '4 tablas' && A.textoCosas({ tabla: 1, piedra: 3 }) === '1 tabla y 3 piedras' && A.textoCosas({ tronco: 2, tabla: 1, piedra: 3 }) === '2 troncos, 1 tabla y 3 piedras', 'el texto de las cosas');
  ok(A.textoCosas({}) === '' && A.textoCosas(null) === '', 'sin cosas, nada');
}

// ================================================================ 3. cuándo piden
const plazos = (aldea, c) => A.revisarPedidos(aldea, { activo: true, semilla: 'ABEJA-NIDO-LUNA', oleadas: 5, ...c });
{
  // antes de la noche de cada uno, nadie pide
  const a0 = A.aldeaNueva();
  igual(plazos(a0, { dia: 1, horas: 9, oleadas: 0 }), [], 'sin ninguna noche resistida, nadie pide');
  const a1 = A.aldeaNueva();
  const ev1 = plazos(a1, { dia: 2, horas: 9, oleadas: 1 });
  igual(ev1.map((e) => e.clave), ['anselmo'], 'tras la primera noche, sólo Anselmo');
  const a2 = A.aldeaNueva();
  igual(plazos(a2, { dia: 3, horas: 9, oleadas: 2 }).map((e) => e.clave).sort(), ['anselmo', 'chicos', 'herminia'], 'tras la segunda, también Herminia y los chicos');
  const a3 = A.aldeaNueva();
  igual(plazos(a3, { dia: 4, horas: 9, oleadas: 3 }).map((e) => e.clave).sort(), ['anselmo', 'chicos', 'herminia', 'martin'], 'y tras la tercera, Martín: los cuatro');
  for (const k of A.VECINOS_AYUDA) ok(a3.pedidos[k] && a3.pedidos[k].hasta === 4 && a3.pedidos[k].desde === 4 && a3.pedidos[k].nivel === 0, `${k}: pedido de hoy, vale hoy`);
  // uno por vecino y por día; revisar de nuevo no repite
  igual(plazos(a3, { dia: 4, horas: 10, oleadas: 3 }), [], 'revisar otra vez el mismo día no reparte de nuevo');
  // de noche, y la última hora, no se piden cosas
  const a4 = A.aldeaNueva();
  igual(plazos(a4, { dia: 5, horas: 5.5 }), [], 'antes de la salida del sol, no');
  igual(plazos(a4, { dia: 5, horas: HORA_ATAQUE - 0.5 }), [], 'la última hora antes de la noche, tampoco');
  ok(plazos(a4, { dia: 5, horas: HORA_AMANECER }).length === 4, 'con la primera luz, sí');
  // el plazo: vale hasta que salen
  const a5 = A.aldeaNueva();
  plazos(a5, { dia: 6, horas: 8 });
  igual(plazos(a5, { dia: 6, horas: HORA_ATAQUE - 0.01 }), [], 'hasta un instante antes de la noche, sigue valiendo');
  const ven = plazos(a5, { dia: 6, horas: HORA_ATAQUE });
  ok(ven.length === 4 && ven.every((e) => e.tipo === 'vencio'), 'a la hora de la noche, vencen los cuatro');
  ok(A.VECINOS_AYUDA.every((k) => a5.pedidos[k] === null) && a5.vencidos === 4, 'y se anotan como vencidos (sin castigo: la ayuda sigue igual)');
  ok(A.VECINOS_AYUDA.every((k) => a5.ayuda[k] === 0), 'perder el plazo no baja la ayuda');
  // al día siguiente piden otra vez, y no el mismo
  const sig = plazos(a5, { dia: 7, horas: 8 });
  ok(sig.length === 4 && sig.every((e) => e.tipo === 'nuevo'), 'al otro día piden de nuevo');
  // si el reloj salta (una siesta): lo de ayer vence antes de repartir lo de hoy
  const a6 = A.aldeaNueva();
  plazos(a6, { dia: 8, horas: 9 });
  const salto = plazos(a6, { dia: 9, horas: 7 });
  ok(salto.filter((e) => e.tipo === 'vencio').length === 4 && salto.filter((e) => e.tipo === 'nuevo').length === 4, 'después de dormir: lo viejo vence y llega lo nuevo');
  // el que ya ayuda a pleno no pide
  const a7 = A.aldeaNueva(); a7.ayuda.martin = 2;
  ok(!plazos(a7, { dia: 9, horas: 9 }).some((e) => e.clave === 'martin'), 'con la ayuda a pleno, no pide más');
  // la ayuda 1 pide el segundo tramo
  const a8 = A.aldeaNueva(); a8.ayuda.herminia = 1;
  const e8 = plazos(a8, { dia: 9, horas: 9 }).find((e) => e.clave === 'herminia');
  ok(e8.pedido.nivel === 1 && A.PEDIDOS.herminia.find((x) => x.id === e8.pedido.id).nivel === 1, 'con ayuda 1 pide el segundo tramo');
  // sin partida activa (ganaste) no se pide
  const a9 = A.aldeaNueva();
  igual(plazos(a9, { dia: 9, horas: 9, activo: false }), [], 'si ya no siguen las noches, no se pide');
  // determinista con la semilla, y distinta entre semillas y entre días
  const sec = (semilla) => { const a = A.aldeaNueva(); const r = []; for (let dia = 3; dia < 40; dia++) { for (const e of plazos(a, { dia, horas: 9, semilla, oleadas: 4 })) r.push(`${dia}${e.clave}${e.pedido.id}`); plazos(a, { dia, horas: 22, semilla, oleadas: 4 }); } return r.join(); };
  ok(sec('ABEJA-NIDO-LUNA') === sec('ABEJA-NIDO-LUNA'), 'con la misma semilla, los mismos pedidos');
  ok(sec('ABEJA-NIDO-LUNA') !== sec('TORO-RIO-SOL'), 'con otra semilla, otros');
  const vistos = new Set(); for (const m of sec('ABEJA-NIDO-LUNA').split(',')) vistos.add(m.replace(/^\d+/, ''));
  ok(vistos.size >= 9, `a lo largo de una partida se ven pedidos variados (${vistos.size})`);
  // no repite el mismo pedido dos días seguidos
  { const a = A.aldeaNueva(); let prev = null, repite = 0;
    for (let dia = 3; dia < 60; dia++) { const e = plazos(a, { dia, horas: 9, oleadas: 4 }).find((x) => x.clave === 'anselmo'); plazos(a, { dia, horas: 22, oleadas: 4 }); if (e) { if (prev === e.pedido.id) repite++; prev = e.pedido.id; } }
    ok(repite === 0, 'un vecino no repite el mismo pedido dos días seguidos'); }
  // no toca el azar: ni Math.random ni la noche especial ni el lado
  const rnd = Math.random; let usos = 0; Math.random = () => { usos++; return rnd(); };
  const a = A.aldeaNueva();
  for (let dia = 3; dia < 30; dia++) { plazos(a, { dia, horas: 9, oleadas: 4 }); plazos(a, { dia, horas: 22, oleadas: 4 }); }
  Math.random = rnd;
  ok(usos === 0, 'los pedidos no usan Math.random');
  const antes = [], despues = [];
  for (let n = 1; n <= 30; n++) antes.push(`${azarEspecial({ semilla: 'ABEJA-NIDO-LUNA' }, null, n)}|${L.ladoDeLaNoche('ABEJA-NIDO-LUNA', n)}`);
  for (let dia = 3; dia < 30; dia++) plazos(A.aldeaNueva(), { dia, horas: 9, oleadas: 4 });
  for (let n = 1; n <= 30; n++) despues.push(`${azarEspecial({ semilla: 'ABEJA-NIDO-LUNA' }, null, n)}|${L.ladoDeLaNoche('ABEJA-NIDO-LUNA', n)}`);
  igual(antes, despues, 'repartir pedidos no cambia el azar de la noche ni el lado');
}

// ================================================================ 4. la entrega
{
  const inv = (o) => (k) => o[k] || 0;
  const montar = (ayuda = 0, id = 'tablas') => {
    const a = A.aldeaNueva(); a.ayuda.anselmo = ayuda;
    a.pedidos.anselmo = { id, nivel: ayuda, pide: A.pideEnLaNoche(A.PEDIDOS.anselmo.find((e) => e.id === id).pide, 3), regalo: null, desde: 5, hasta: 5 };
    return a;
  };
  let a = montar();
  let r = A.entregar(a, 'anselmo', inv({ tabla: 3 }), 5, 10);
  ok(!r.ok && r.razon === 'falta' && r.falta.tabla === 1 && r.gasta === null && a.ayuda.anselmo === 0 && a.pedidos.anselmo, 'sin todo lo pedido no entrega: nada cambia');
  r = A.entregar(a, 'anselmo', inv({ tabla: 4 }), 5, HORA_ATAQUE);
  ok(!r.ok && r.razon === 'vencido' && a.ayuda.anselmo === 0, 'a la hora de la noche ya no se entrega');
  r = A.entregar(a, 'anselmo', inv({ tabla: 99 }), 6, 8);
  ok(!r.ok && r.razon === 'vencido', 'de un día anterior, tampoco');
  r = A.entregar(A.aldeaNueva(), 'anselmo', inv({ tabla: 99 }), 5, 10);
  ok(!r.ok && r.razon === 'sin-pedido', 'sin pedido, nada');
  r = A.entregar(a, 'anselmo', inv({ tabla: 4 }), 5, 10);
  ok(r.ok && r.subio && r.nivel === 1 && a.ayuda.anselmo === 1 && a.pedidos.anselmo === null && a.cumplidos === 1, 'completo: sube la ayuda a 1 y se saca el pedido');
  igual(r.gasta, { tabla: 4 }, 'cobra exactamente lo pedido');
  ok(A.nivelAyuda({ aldea: a }, 'anselmo') === 1, 'y nivelAyuda lo ve');
  r = A.entregar(a, 'anselmo', inv({ tabla: 99 }), 5, 11);
  ok(!r.ok && r.razon === 'sin-pedido', 'no se entrega dos veces el mismo pedido');
  // el segundo tramo llega a 2 y no pasa de 2
  a = montar(1, 'porton');
  r = A.entregar(a, 'anselmo', inv({ tabla: 99, piedra: 99 }), 5, 10);
  ok(r.ok && r.nivel === 2 && A.nivelAyuda({ aldea: a }, 'anselmo') === 2, 'el segundo pedido lleva la ayuda a 2');
  a.pedidos.anselmo = { id: 'tablas', nivel: 0, pide: { tabla: 1 }, regalo: null, desde: 5, hasta: 5 };
  r = A.entregar(a, 'anselmo', inv({ tabla: 9 }), 5, 10);
  ok(a.ayuda.anselmo === 2, 'la ayuda nunca pasa de 2');
  // lo que se cobra menos lo que se regala: siempre pierde el jugador
  for (const k of A.VECINOS_AYUDA) for (const e of A.PEDIDOS[k]) for (const noche of [1, 4, 9, 16, 25]) {
    const b = A.aldeaNueva(); b.ayuda[k] = e.nivel;
    const pide = A.pideEnLaNoche(e.pide, noche);
    b.pedidos[k] = { id: e.id, nivel: e.nivel, pide, regalo: A.regaloEnLaNoche(e.regalo, pide), desde: 2, hasta: 2 };
    const t = { ...pide };
    const rr = A.entregar(b, k, (c) => t[c] || 0, 2, 9);
    ok(rr.ok && A.valorDe(rr.gasta) > A.valorDe(rr.regalo), `${k}/${e.id} noche ${noche}: la entrega cuesta más de lo que devuelve`);
  }
  // el equilibrio, en cifras: con lo que cuestan los dos pedidos de una noche tardía se arma una defensa entera
  const caro = A.VECINOS_AYUDA.map((k) => A.valorDe(A.pideEnLaNoche(A.PEDIDOS[k].find((e) => e.nivel === 1).pide, 10)));
  ok(caro.every((v) => v >= 8), `a la noche 10 el segundo pedido cuesta al menos 8 troncos (${caro.map((v) => v.toFixed(0))})`);
  // pedidosActivos
  const b = A.aldeaNueva(); plazos(b, { dia: 4, horas: 9, oleadas: 3 });
  ok(A.pedidosActivos(b, 4, 12).length === 4 && A.pedidosActivos(b, 4, 21).length === 0 && A.pedidosActivos(b, 5, 8).length === 0, 'los activos de hoy y nada después de la noche');
  ok(A.quedaHoras(b.pedidos.anselmo, 4, 12) === 8.5 && A.quedaHoras(b.pedidos.anselmo, 4, 21) === 0, 'cuántas horas quedan');
  for (const k of A.VECINOS_AYUDA) ok(A.textoPedido(k, b.pedidos[k]).length > 20, `${k}: el texto de lo que pide`);
}

// ================================================================ 5. el pronóstico = lo que después ocurre
const T = generarTerreno();
const lugares = Object.values(T.lugares);
const muestra = L.muestraDelTerreno(T, { lugares });
const BASES = [[BASE_REFUGIO.x, BASE_REFUGIO.z], ...SITIOS.bases.slice(0, 5)].map(([x, z]) => ({ x, z }));
// La noche tal como la juega `desafio.js`: se decide al caer la tarde, sale, se termina. Devuelve lo que pasó.
function jugarNoches(semilla, meteo, plan, base, hasta, pronosticar) {
  const d = sanearDesafio(null);
  d.semilla = semilla;
  const real = [], pron = [];
  for (let n = 1; n <= hasta; n++) {
    const dia = n + 1;
    const final = n >= NOCHE_FINAL;
    // por la mañana: el pronóstico con la estación
    if (pronosticar) {
      const antes = JSON.stringify(d);
      const f = P.armarPronostico({ d, meteo, dia, horas: 9, base, plan: () => plan, tiene: { estacion: true, radio: true, perro: true }, hayBlanco: false });
      ok(JSON.stringify(d) === antes, 'armar el pronóstico no cambia el estado de la partida');
      pron.push({ n, hoy: f.noches[0], manana: f.noches[1] });
    }
    // el aviso del atardecer (decidirNoche)
    d.especial = final ? null : nocheEspecial(d.oleadas + 1, azarEspecial(d, meteo, d.oleadas + 1), d.especialAnterior);
    d.ladoNoche = L.ladoNocheNuevo(plan, d.semilla, d.oleadas + 1, () => true);
    const tipo = final ? 'final' : esNocheDeJefe(d.oleadas + 1) ? 'jefe' : d.especial || 'comun';
    real.push({ n: d.oleadas + 1, tipo, lado: d.ladoNoche?.id ?? null, x: d.ladoNoche?.x, z: d.ladoNoche?.z });
    // la noche
    d.oleadas++; d.oleadaNoche = dia; d.noches++;
    d.especialAnterior = d.especial; d.especial = null;
  }
  return { real, pron };
}
const SEMILLAS = ['ABEJA-NIDO-LUNA', 'TORO-RIO-SOL', 'PIEDRA-CIELO-RAMA', 'HONGO-VIENTO-SAL', 'CUERVO-MONTE-ARENA', null];
{
  ok(typeof P.armarPronostico === 'function' && P.HORA_PERRO < HORA_ATAQUE && P.HORA_AVISO === HORA_ATAQUE - 1, 'el módulo del pronóstico');
  let comparadas = 0, especiales = new Set(), lados = new Set();
  BASES.forEach((base, bi) => {
    const plan = L.planDeLados(base, muestra);
    for (const semilla of SEMILLAS) {
      const meteo = { semilla: 2468 + bi * 31 };
      const { real, pron } = jugarNoches(semilla, meteo, plan, base, 30, true);
      real.forEach((r, i) => {
        const h = pron[i].hoy;
        ok(h.n === r.n, `noche ${r.n}: el pronóstico habla de esa noche`);
        ok(h.tipo === r.tipo, `base ${bi} «${semilla}» noche ${r.n}: anticipó «${h.tipo}» y salió «${r.tipo}»`);
        ok(h.lado && h.lado.id === r.lado, `base ${bi} «${semilla}» noche ${r.n}: anticipó el lado ${h.lado?.id} y salió ${r.lado}`);
        ok(h.lado.x === r.x && h.lado.z === r.z, `base ${bi} noche ${r.n}: y el mismo punto de entrada`);
        if (i + 1 < real.length) {
          const m = pron[i].manana, r2 = real[i + 1];
          ok(m.n === r2.n && m.tipo === r2.tipo && m.lado.id === r2.lado, `base ${bi} «${semilla}»: lo que anunció «mañana» en la noche ${r.n} es lo que pasó en la ${r2.n} (${m.tipo}/${m.lado.id} y salió ${r2.tipo}/${r2.lado})`);
        }
        comparadas++; especiales.add(r.tipo); lados.add(r.lado);
      });
    }
  });
  ok(comparadas >= 6 * 30 * 6 - 1, `se compararon ${comparadas} noches`);
  for (const e of ['comun', 'jefe', 'final', 'roja', 'eclipse', 'silenciosa', 'apagon', 'niebla', 'lunallena']) ok(especiales.has(e), `en esas noches salió «${e}» y se anticipó bien`);
  ok(lados.has('rio') && lados.has('monte') && lados.has('camino'), 'y los tres lados');
  // anticipar no altera nada: la misma partida con y sin pronóstico (y con pronósticos de más) sale igual
  const base = BASES[0], plan = L.planDeLados(base, muestra);
  for (const semilla of SEMILLAS.slice(0, 3)) {
    const rnd = Math.random; let usos = 0; Math.random = () => { usos++; return rnd(); };
    const con = jugarNoches(semilla, { semilla: 777 }, plan, base, 25, true).real;
    const usosCon = usos;
    usos = 0;
    const sin = jugarNoches(semilla, { semilla: 777 }, plan, base, 25, false).real;
    Math.random = rnd;
    igual(con, sin, `«${semilla}»: con y sin pronóstico, las mismas 25 noches`);
    ok(usosCon === 0 && usos === 0, 'y el pronóstico no usa Math.random');
  }
  // sin semilla ni meteo, sale al azar de verdad: no se promete nada de antemano (no explota)
  const f0 = P.armarPronostico({ d: sanearDesafio(null), meteo: {}, dia: 2, horas: 9, base: BASES[0], plan: () => L.planDeLados(BASES[0], muestra), tiene: { estacion: true }, hayBlanco: false });
  ok(f0.noches.length === 2 && f0.noches[0].lado, 'sin código ni meteo, igual da un pronóstico (el lado sale de la semilla de siempre)');
}

// ---- cuánto se sabe según lo que tenés
{
  const base = BASES[0], plan = L.planDeLados(base, muestra);
  const d = sanearDesafio(null); d.semilla = 'ABEJA-NIDO-LUNA'; d.oleadas = 6;   // la noche 7
  const f = (tiene, horas, extra = {}) => P.armarPronostico({ d, meteo: { semilla: 99 }, dia: 8, horas, base, plan: () => plan, tiene, hayBlanco: false, ...extra });
  // sin nada, de mañana: no se sabe (salvo que sea de las que se saben por número)
  const nada = f({}, 9);
  const real = jugarNoches('ABEJA-NIDO-LUNA', { semilla: 99 }, plan, base, 8, false).real;
  const tipo7 = real[6].tipo;
  ok(nada.saber.nada && nada.noches[0].lado === null && nada.noches[0].avisos.length >= 2, 'sin nada, de mañana, no se sabe el lado y lo dice');
  if (tipo7 !== 'jefe' && tipo7 !== 'final') ok(nada.noches[0].tipo === null && /Todavía no se sabe/.test(nada.noches[0].avisos[0]), 'ni la noche (se sabrá una hora antes)');
  // el perro: el lado desde las 15, la noche no
  const perroTemprano = f({ perro: true }, 12), perroTarde = f({ perro: true }, 16);
  ok(perroTemprano.noches[0].lado === null && perroTarde.noches[0].lado && perroTarde.noches[0].lado.id === real[6].lado, 'el perro huele el lado desde las 15 (y a las 12 todavía no)');
  ok(!perroTarde.saber.tipoHoy, 'pero el perro no dice qué noche viene');
  ok(perroTarde.noches[1].lado === null, 'ni el lado de mañana');
  // la radio: la noche de hoy, no el lado
  const radio = f({ radio: true }, 9);
  ok(radio.saber.tipoHoy && !radio.saber.tipoManana && radio.noches[0].tipo === tipo7 && radio.noches[0].lado === null, 'la radio dice la noche de hoy y no el lado');
  ok(radio.noches[1].tipo === null || llevaPorNumero(radio.noches[1].tipo), 'ni la de mañana');
  // la estación: dos noches, noche y lado
  const est = f({ estacion: true }, 9);
  ok(est.noches.length === 2 && est.noches.every((n) => n.sabeTipo && n.lado), 'la estación da las dos noches, con tipo y lado');
  ok(est.marca && est.marca.x === est.noches[0].lado.x && est.marca.z === est.noches[0].lado.z && /entrar/.test(est.marca.nombre), 'y una marca para el mapa donde van a entrar');
  ok(nada.marca === null, 'sin saberlo no hay marca');
  // al atardecer (el aviso de una hora antes) lo sabe cualquiera
  const tarde = f({}, HORA_ATAQUE - 0.5);
  ok(tarde.noches[0].sabeTipo && tarde.noches[0].lado && tarde.noches[0].tipo === tipo7, 'a las 20:00 cualquiera sabe la noche y el lado');
  ok(!tarde.noches[1].lado, 'pero no la de mañana');
  // si el lado ya se decidió, es el decidido
  const dd = { ...d, ladoNoche: { id: 'camino', x: 10, z: 20, rumbo: 0, noche: 7, otro: null } };
  const fd = P.armarPronostico({ d: dd, meteo: { semilla: 99 }, dia: 8, horas: 17, base, plan: () => plan, tiene: { perro: true }, hayBlanco: false });
  ok(fd.noches[0].lado.id === 'camino' && fd.noches[0].lado.exacto && fd.noches[0].lado.x === 10, 'con el lado ya decidido al atardecer, el pronóstico dice ese');
  // hay algo que los llama a otra parte
  const blanco = f({ estacion: true }, 9, { hayBlanco: true });
  ok(/otra parte/.test(blanco.noches[0].avisos.join(' ')), 'si hay un blanco en otro lado, lo avisa');
  // sin plan (todavía no se calculó)
  const sinPlan = P.armarPronostico({ d, meteo: { semilla: 99 }, dia: 8, horas: 9, base, plan: () => null, tiene: { estacion: true }, hayBlanco: false });
  ok(sinPlan.noches[0].lado === null && /no se puede saber/.test(sinPlan.noches[0].avisos.join(' ')), 'si no hay plan de lados, lo dice sin romper');
  // textos
  for (const n of est.noches) {
    ok(n.avisos.every((t) => !ESPANOL_MALO.test(t) && !RELIGIOSO.test(t)), 'los avisos del pronóstico: ni inglés ni religión');
    ok(n.consejoLado && n.consejo, 'con un consejo de la noche y otro del lado');
  }
  for (const t of Object.values(P.CONSEJO_NOCHE).concat(Object.values(P.CONSEJO_LADO))) ok(!ESPANOL_MALO.test(t) && !RELIGIOSO.test(t) && t.length > 20, 'los consejos');
  for (const k of Object.keys(ESPECIALES)) ok(P.CONSEJO_NOCHE[k], `hay consejo para la noche «${k}»`);
}
function llevaPorNumero(t) { return t === 'jefe' || t === 'final' || t === 'calma'; }

// ================================================================ 6. el tablón en el mundo (con three de verdad y un mundo de mentira)
{
  const { registrarThree } = await import('./ayuda-three.mjs');
  registrarThree();
  const { crearAldeaMundo, RADIO_TABLON } = await import('../src/desafio-aldea-mundo.js');
  const base = { x: BASE_REFUGIO.x, z: BASE_REFUGIO.z, radio: 4 };
  const plan = L.planDeLados(base, muestra);
  const montar = (extra = {}) => {
    const notas = [], estado = { dia: 5, horas: 9, pos: { x: base.x, y: 0, z: base.z }, abrio: 0, libre: true, mochila: { tronco: 20, tabla: 20, piedra: 20, ramita: 40, fruta: 20, cristal: 0 }, guardados: 0, redibujos: 0 };
    const d = sanearDesafio(null); d.semilla = 'ABEJA-NIDO-LUNA'; d.oleadas = 4;
    const escena = { hijos: [], add(h) { this.hijos.push(h); } };
    const ctx = {
      D: () => d, progreso: () => estado, sonido: { juntar() { estado.juntar = (estado.juntar || 0) + 1; } },
      nota: (a, b, n) => notas.push([a, b, n]), guardar: () => { estado.guardados++; },
      cuanto: (k) => estado.mochila[k] || 0, gastar: (k, n) => { estado.mochila[k] -= n; },
      sumarMaterial: (k, n) => { estado.mochila[k] = (estado.mochila[k] || 0) + n; },
      base: () => base, libre: () => estado.libre, plan: () => plan, meteo: () => ({ semilla: 99 }),
      tiene: () => ({ estacion: false, radio: false, perro: true }), hayBlanco: () => false, activo: () => true,
      abrirTablon: () => { estado.abrio++; }, redibujar: () => { estado.redibujos++; }, posJugador: () => estado.pos, ...extra,
    };
    const T = { agua: () => false, altura: () => 0, indice: () => 0, pendiente: [0], lugares: {} };
    return { m: crearAldeaMundo(T, escena, ctx), notas, estado, d, escena };
  };
  const nodo = (tag, clase, texto) => ({ tag, clase, texto, hijos: [], listeners: {}, appendChild(h) { this.hijos.push(h); return h; }, addEventListener(e, f) { this.listeners[e] = f; } });
  const texto = (n) => `${n.texto ?? ''} ${n.hijos.map(texto).join(' ')}`;
  const botones = (n) => [...(n.tag === 'button' ? [n] : []), ...n.hijos.flatMap(botones)];

  let { m, notas, estado, d, escena } = montar();
  ok(escena.hijos.length === 1 && m.grupo.name === 'tablon-aldea', 'el tablón es un solo grupo en la escena');
  const dist = Math.hypot(m.sitio.x - base.x, m.sitio.z - base.z);
  ok(dist > 3 && dist < 20, `el tablón queda cerca de la base (a ${dist.toFixed(1)} m)`);
  ok(m.cerca({ x: m.sitio.x + 1, z: m.sitio.z }) && !m.cerca({ x: m.sitio.x + RADIO_TABLON + 1, z: m.sitio.z }) && !m.cerca(null), 'se usa a menos de 3,6 m');
  ok(Object.values(m.hojas).every((h) => !h.visible), 'sin pedidos, sin hojas');
  // el primer segundo: reparten y se avisa una sola vez
  m.actualizar(1.1, { pos: estado.pos });
  const activos = A.VECINOS_AYUDA.filter((k) => d.aldea.pedidos[k]);
  ok(activos.length === 4 && A.VECINOS_AYUDA.every((k) => m.hojas[k].visible), 'con 4 noches resistidas piden los cuatro y se ven las cuatro hojas');
  ok(notas.length === 1 && /pide cosas/.test(notas[0][0]) && /tablón/.test(notas[0][1]), 'un solo aviso para todos');
  m.actualizar(0.3, { pos: estado.pos });
  ok(notas.length === 1, 'sin repetir');
  ok(estado.guardados === 1, 'y se guarda lo repartido');
  // lejos no se dibuja
  m.actualizar(1.1, { pos: { x: m.sitio.x + 400, z: m.sitio.z } });
  ok(m.grupo.visible === false, 'a más de 170 m no se dibuja');
  m.actualizar(1.1, { pos: estado.pos });
  ok(m.grupo.visible === true, 'y vuelve al acercarse');
  // el aviso y la E
  estado.pos = { x: m.sitio.x, y: 0, z: m.sitio.z };
  ok(/4 pedidos/.test(m.avisoCerca(estado.pos)), 'el aviso cuenta los pedidos');
  ok(m.usarCerca(estado.pos) === true && estado.abrio === 1, 'la E abre el cuaderno en la pestaña de la aldea');
  ok(m.usarCerca({ x: 9999, z: 9999 }) === false && m.avisoCerca({ x: 9999, z: 9999 }) === null, 'lejos, nada');
  // el cuaderno: pedidos, y la noche que viene
  let ficha = nodo('div');
  m.dibujarCuaderno(ficha, nodo);
  let tx = texto(ficha);
  ok(/La aldea/.test(tx) && /Los pedidos de hoy/.test(tx) && /La noche que viene/.test(tx), 'la pestaña tiene sus tres partes');
  for (const k of A.VECINOS_AYUDA) ok(tx.includes(A.VECINOS[k].nombre) && tx.includes(A.textoPedido(k, d.aldea.pedidos[k]).slice(0, 25)), `${k}: su nombre y su pedido`);
  ok(/Pide \d+/.test(tx) && /Hasta que salgan los duendes/.test(tx) && /no vuelve/.test(tx), 'dice lo que pide y que cuesta');
  ok(!/Van a entrar/.test(tx) && /desde las 15/.test(tx), 'a la mañana el perro todavía no huele el lado y lo dice');
  estado.horas = 16; ficha = nodo('div'); m.dibujarCuaderno(ficha, nodo); tx = texto(ficha);
  ok(/Van a entrar/.test(tx) && /a unos \d+ m de la base/.test(tx), 'a las 4 de la tarde el perro dice por dónde entran');
  estado.horas = 9;
  // entregar: junto al tablón, con lo pedido
  ficha = nodo('div'); m.dibujarCuaderno(ficha, nodo);
  let bs = botones(ficha).filter((b) => b.texto === 'Entregar');
  ok(bs.length === 4 && bs.every((b) => !b.disabled), 'junto al tablón y con todo en la mochila, se puede entregar los cuatro');
  const antes = { ...estado.mochila }, pedido = d.aldea.pedidos.anselmo;
  bs[0].listeners.click();
  ok(d.aldea.ayuda.anselmo === 1 && d.aldea.pedidos.anselmo === null && estado.redibujos === 1, 'entregar sube la ayuda de Anselmo y redibuja');
  for (const [k, n] of Object.entries(pedido.pide)) ok(estado.mochila[k] === antes[k] - n + ((pedido.regalo || {})[k] || 0), `se cobró ${n} de ${k}`);
  ok(notas.at(-1)[2] === true && /Anselmo/.test(notas.at(-1)[0]) && /“/.test(notas.at(-1)[1]), 'y Anselmo agradece con su voz');
  ok(estado.juntar === 1, 'con su sonido');
  m.actualizar(1.1, { pos: estado.pos });
  ok(m.hojas.anselmo.visible === false && m.hojas.chicos.visible === true, 'y su hoja sale del tablón');
  // sin lo pedido, el botón no deja
  estado.mochila.piedra = 0; estado.mochila.tabla = 0; estado.mochila.tronco = 0; estado.mochila.ramita = 0; estado.mochila.fruta = 0;
  ficha = nodo('div'); m.dibujarCuaderno(ficha, nodo);
  bs = botones(ficha).filter((b) => /^Te falta/.test(b.texto));
  ok(bs.length === 3 && bs.every((b) => b.disabled), 'sin las cosas, «Te falta…» y apagado');
  const r0 = m.entregarPedido('herminia');
  ok(!r0.ok && r0.razon === 'falta' && d.aldea.ayuda.herminia === 0, 'entregar sin todo no hace nada');
  // lejos del tablón, no se entrega aunque se pueda
  estado.mochila = { tronco: 50, tabla: 50, piedra: 50, ramita: 90, fruta: 50, cristal: 0 };
  estado.pos = { x: m.sitio.x + 50, y: 0, z: m.sitio.z };
  ficha = nodo('div'); m.dibujarCuaderno(ficha, nodo);
  ok(botones(ficha).filter((b) => b.texto === 'Entregar').every((b) => b.disabled) && /parado junto al tablón/.test(texto(ficha)), 'lejos del tablón los botones están apagados y lo dice');
  ok(m.entregarPedido('martin').razon === 'lejos' && d.aldea.ayuda.martin === 0, 'y la entrega se rechaza');
  // de noche vence
  estado.pos = { x: m.sitio.x, y: 0, z: m.sitio.z };
  estado.horas = HORA_ATAQUE + 0.1;
  m.actualizar(1.1, { pos: estado.pos });
  ok(A.VECINOS_AYUDA.every((k) => !d.aldea.pedidos[k]) && Object.values(m.hojas).every((h) => !h.visible), 'a la noche se vencen y se van las hojas');
  ok(/plazo/.test(notas.at(-1)[0]), 'con un aviso sin drama');
  // si una obra queda encima, el tablón se corre
  const x0 = m.sitio.x, z0 = m.sitio.z;
  estado.libre = false; estado.horas = 10;
  let intentos = 0;
  const m2 = montar({ libre: (x, z) => { intentos++; return !(Math.abs(x - x0) < 1.2 && Math.abs(z - z0) < 1.2); } });
  m2.m.actualizar(1.1, { pos: m2.estado.pos });
  ok(m2.m.sitio.listo, 'si la base cambia o hay una obra encima, se vuelve a ubicar (sin romperse)');
  // una partida a medias (guardada con pedidos) sigue donde estaba
  const guardada = sanearDesafio(JSON.parse(JSON.stringify(d)));
  igual(guardada.aldea.ayuda, d.aldea.ayuda, 'la ayuda se guarda y se carga');
}

// ================================================================ 7. el enganche con el juego
{
  const main = leer('src/main.js'), des = leer('src/desafio.js'), reglas = leer('src/desafio-reglas.js');
  ok(/aldeaNueva as aldeaDelDesafio/.test(reglas) && /sanearAldeaDelDesafio\(x\.aldea\)/.test(reglas), 'sanearDesafio sanea la aldea');
  ok(/import \{ crearAldeaMundo \} from '\.\/desafio-aldea-mundo\.js';/.test(des) && /const aldeaMundo = crearAldeaMundo\(/.test(des), 'desafio.js arma el tablón');
  ok(/aldeaMundo\.actualizar\(dt, js\);   \/\/ 4\.9 dias/.test(des), 'y lo actualiza una vez por cuadro (él se frena a un segundo)');
  ok(/aldeaMundo,   \/\/ 4\.9 dias/.test(des), 'y lo muestra');
  ok(/plan: \(\) => ataques\.planActual\(\)/.test(des), 'el plan de lados es el que usa la noche (ataques.planActual)');
  ok(!/ataques\.decidir\([^)]*\)[^;]*aldea/.test(des), 'el pronóstico no decide nada por la noche');
  ok(/abrirTablonAldea: \(\) => \{ pestana = 'aldea'; abrir\('cuaderno'\); \}/.test(main), 'main: el tablón abre el cuaderno en «La aldea»');
  ok(/pestanas\.push\(\['aldea', 'La aldea'\]\)/.test(main) && /desafio\.aldeaMundo\.dibujarCuaderno\(ficha, el\)/.test(main), 'main: la pestaña existe sólo en el Desafío y se dibuja');
  ok(/desafio\.aldeaMundo\.marcaMapa\(\)/.test(main), 'main: el mapa marca por dónde entrarían');
  // la tecla E: una sola entrada en la tabla
  const { INTERACCIONES } = await import('../src/interacciones.js');
  const ids = INTERACCIONES.map((e) => e.id);
  ok(ids.filter((i) => i === 'aldea-tablon').length === 1 && ids.indexOf('aldea-tablon') > ids.indexOf('tablon') && ids.indexOf('aldea-tablon') < ids.indexOf('objetivo'), 'la E y el aviso: una entrada «aldea-tablon» en su lugar de la tabla');
  const { que, enganche } = await import('./ayuda-interacciones.mjs');
  const r = que({ desafio: true, tablonAldeaCerca: true, avisoTablonAldea: 'Mirar el tablón', abrirTablonAldea: true });
  ok(r.e === 'aldea-tablon' && r.avisoId === 'aldea-tablon', 'junto al tablón del Desafío, la E lo abre y el aviso habla de él');
  ok(que({ desafio: false, tablonAldeaCerca: true }).e !== 'aldea-tablon', 'en el Relax no existe');
  ok(que({ desafio: true, tablonAldeaCerca: true, js: { enTren: true } }).e !== 'aldea-tablon', 'ni arriba del tren');
  ok(que({ desafio: true, tablonAldeaCerca: true, objetivo: { tipo: 'planta', texto: 'Anotar' } }).e !== 'aldea-tablon', 'ni mirando algo para juntar');
  for (const n of ['tablonAldeaCerca', 'avisoTablonAldea', 'abrirTablonAldea']) ok(enganche(main, n).length > 10, `ctxInteraccion le da a la tabla «${n}»`);
}

console.log(`verificar-4-9-dias: ${pasos} comprobaciones, todo en verde`);
