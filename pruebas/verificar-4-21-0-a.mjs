// 4.21.0 · A · Plata pareja (el paquete «4.21.0 · Plata pareja» de AUDITORIA_4_20_0_A.md), en Node con los módulos reales:
//   · los fletes de la trochita: en pesos (ya no «yerba × 100»), carga `1 + t` y pasajeros `1 + ⌈0,4·c⌉ + t` escalones de $100;
//     una vuelta rinde unos $19.300 por hora sin furgón y $31.300 con furgón (se vuelve a correr `auditoria-4-20-a-fletes.mjs`);
//   · un flete guardado con la clave vieja (`premio.yerba`) se pasa a pesos al cargar y paga lo que prometía;
//   · la caja de cada puesto se repone $450 por día (era $700);
//   · los sueldos del turno × 1,25 (redondos a $50, a mano: la tabla de empleo.js);
//   · el tablón paga ×1,3 / ×1,6 / ×2 por la distancia (eran ×1,5 / ×2 / ×2,5);
//   · el poncho de invierno ×1,25 (era ×1,45);
//   · `XP.remo` 4: el nivel 5 de navegante, a 5.000 m (eran 20.000);
//   · lo que las dos herramientas de la auditoría dicen ahora: el catálogo de obras con pesos se junta en 254 / 171 / 100 días
//     (tranquilo / medio / a fondo), cociente 2,5 (era 3,5: 290 / 176 / 83).
// Las mutaciones (que cada línea de acá falle si se deshace el cambio) las corre `pruebas/mutaciones-4-21-0-a.mjs`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const entre = (v, a, b, m) => ok(v >= a && v <= b, `${m} (${v}, esperado de ${a} a ${b})`);

const C = await import('../src/comercio.js');
const E = await import('../src/economia.js');
const M = await import('../src/mercado.js');
const EM = await import('../src/empleo.js');
const TA = await import('../src/tablon.js');
const OF = await import('../src/oficios.js');
const T = await import('../src/trabajos.js');

// corre una herramienta de la auditoría (en un proceso aparte, con los módulos de este mismo árbol) y devuelve lo que imprime
const herramienta = (nombre, ...args) => {
  const r = spawnSync(process.execPath, [`herramientas/${nombre}`, ...args], { cwd: raiz, encoding: 'utf8', timeout: 120000 });
  assert.equal(r.status, 0, `${nombre} terminó mal: ${r.stderr}`);
  return r.stdout;
};
// una fila de console.table: las celdas, sin comillas
const filaDe = (salida, claveCelda) => {
  const l = salida.split('\n').find((x) => x.includes(claveCelda));
  assert.ok(l, `no está la fila «${claveCelda}»`);
  return l.split('│').map((c) => c.trim().replace(/^'|'$/g, '')).filter((c, i) => i > 0 && c !== '');
};

// ============================================================ 1. los fletes, en pesos y con la fórmula entera
{
  const est = ['Estación del Valle', 'Parada del Mallín', 'Parada Alta', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada del Molino'];
  let visto = { carga: new Set(), pasajeros: new Set() };
  for (let d = 1; d <= 60; d++) for (const desde of est) for (const f of C.fletesDelDia(d, est, desde, 2)) {
    ok(!('yerba' in f.premio) && Number.isInteger(f.premio.pesos), 'el premio es en pesos, sin la clave vieja');
    const t = C.tramos(est, f.desde, f.hasta);
    const esperado = f.tipo === 'carga' ? (1 + t) * 100 : (1 + Math.ceil(f.cuantos * 0.4) + t) * 100;
    if (f.premio.pesos !== esperado) assert.fail(`${f.tipo} a ${t} tramos con ${f.cuantos}: paga ${f.premio.pesos}, la fórmula dice ${esperado}`);
    visto[f.tipo].add(`${t}|${f.premio.pesos}`);
  }
  n++;
  ok(visto.carga.size >= 4 && visto.pasajeros.size >= 8, 'se probaron cargas y pasajeros de varias distancias y tamaños');
  // la fórmula, con cuentas a mano
  const paga = (tipo, cuantos, t) => (tipo === 'carga' ? (1 + t) * 100 : (1 + Math.ceil(cuantos * 0.4) + t) * 100);
  eq([paga('carga', 5, 1), paga('carga', 5, 5), paga('pasajeros', 2, 1), paga('pasajeros', 6, 5)], [200, 600, 300, 900], 'cuentas a mano: carga a 1 y a 5 paradas; pasajeros 2 a 1 y 6 a 5');
  eq(C.COMERCIO.fletePaso, 100, 'el escalón de un flete vale $100');
  // la cadena de texto del panel y la nota: pesos, no «de yerba»
  const f = C.fletesDelDia(4, est, 'Parada Alta')[0];
  const tx = C.textoFlete(f);
  ok(/pesos/.test(tx.paga) && !/yerba/.test(tx.paga) && tx.pesos === f.premio.pesos, 'el texto del flete habla de pesos');
  // tomar y entregar: el premio llega entero y `ganado` suma lo mismo en unidades de yerba
  const c = C.comercioNuevo();
  ok(C.tomarFlete(c, f).ok, 'se toma');
  const g0 = c.ganado;
  const listos = C.entregarFletes(c, f.hasta);
  ok(listos.length === 1 && listos[0].premio.pesos === f.premio.pesos && c.ganado === g0 + f.premio.pesos / 100, 'se entrega con el premio en pesos');
}
// ---- el rendimiento de manejar (la herramienta de la auditoría, con los fletes de ahora)
{
  const s = herramienta('auditoria-4-20-a-fletes.mjs');
  const sin = filaDe(s, "'sin furgón (3 a la vez, 2 por parada)'"), con = filaDe(s, "'con furgón de carga (5 a la vez, 4 por parada)'");
  // celdas: índice, caso, minPorVuelta, fletesPorVuelta, pesosPorVuelta, pesosPorHora, pesosPorDiaDeManejo
  entre(Number(sin[5]), 18300, 20300, 'manejando sin furgón: pesos por hora (era $45.700)');
  entre(Number(con[5]), 29800, 32800, 'manejando con furgón de carga: pesos por hora (era $82.700)');
  entre(Number(sin[4]), 4300, 4900, 'una vuelta (14 min) sin furgón (era $10.870)');
  const pro = s.match(/Un flete suelto paga \$([\d.]+) de promedio \(de \$([\d.]+) a \$([\d.]+)\)/);
  ok(pro, 'la herramienta dice cuánto paga un flete suelto');
  const [prom, mn, mx] = pro.slice(1).map((x) => Number(x.replace(/\./g, '')));
  entre(prom, 600, 800, 'un flete suelto paga de promedio (eran $1.704)');
  ok(mn >= 200 && mx <= 1500, `de $${mn} a $${mx}: nunca menos de $200 ni más de $1.500 (eran de $600 a $3.300)`);
}
// ---- una partida guardada con un flete en curso, con la clave vieja
{
  const viejo = { id: 'a|Parada Alta|0', tipo: 'carga', desde: 'Parada Alta', hasta: 'Estación del Valle', cuantos: 4, que: 'cajones', premio: { yerba: 12, material: { k: 'tabla', n: 2 } }, dia: 5 };
  const s = C.sanearComercio({ hoy: { dia: 5 }, fletes: [viejo, { ...viejo, id: 'b', premio: { yerba: 1e9 } }, { ...viejo, id: 'c', premio: { pesos: 450 } }, { ...viejo, id: 'd', premio: { pesos: -9 } }, { ...viejo, id: 'e', premio: {} }] });
  eq(s.fletes.map((f) => f.premio.pesos), [1200, 9900, 450, 0, 0], 'yerba × 100 con el mismo techo; los pesos nuevos tal cual; lo roto, cero');
  ok(s.fletes.every((f) => !('yerba' in f.premio)), 'y la clave vieja no vuelve a salir');
  ok(s.fletes[0].premio.material?.k === 'tabla' && s.fletes[0].premio.material.n === 2, 'el premio en material sigue');
  eq(JSON.stringify(C.sanearComercio(JSON.parse(JSON.stringify(s)))), JSON.stringify(s), 'el saneo es estable');
  eq(C.textoFlete(viejo).pesos, 1200, 'un flete que todavía trae yerba paga 12 × $100 al texto');
}
// ---- al llegar manejando se cobra en pesos (con el panel real del puesto de cargas y un mundo de mentira)
{
  const { crearPuestoDeCargas } = await import('../src/comercio-mundo.js');
  const p = { modo: 'relax', dia: 5, cosas: {}, materiales: { tabla: 0 }, entradas: {}, economia: E.economiaNueva(), comercio: C.comercioNuevo() };
  const notas = [];
  const parada = { nombre: 'Estación del Valle' };
  const ctx = { progreso: () => p, dia: () => 5, temporada: () => 'verano', tren: { paradas: [parada] }, nota: (t, sub) => notas.push([t, sub]), guardar() {}, refrescar() {}, sonido: null };
  const puesto = crearPuestoDeCargas(ctx);
  p.comercio.fletes.push({ id: 'n1', tipo: 'carga', desde: 'Parada Alta', hasta: parada.nombre, cuantos: 4, que: 'cajones', premio: { pesos: 700 }, dia: 5 });
  p.comercio.fletes.push({ id: 'v1', tipo: 'pasajeros', desde: 'Parada Alta', hasta: parada.nombre, cuantos: 3, que: 'turistas', premio: { yerba: 4 }, dia: 5 });
  const antes = E.pesosDe(p);
  puesto.llegar(parada);
  eq(E.pesosDe(p), antes + 700 + 400, 'el flete nuevo paga $700 y el viejo (4 de yerba) $400');
  ok(/\$700/.test(notas.at(-1)[1]) && /\$400/.test(notas.at(-1)[1]) && !/yerba/.test(notas.at(-1)[1]), `el aviso dice los pesos (${notas.at(-1)[1]})`);
  const fuente = leer('src/comercio-mundo.js');
  ok(!/premio\??\.yerba/.test(fuente), 'comercio-mundo.js ya no lee la yerba del premio');
}

// ============================================================ 2. la caja de los puestos: $450 por día
{
  eq(M.MERCADO.cajaDia, 450, 'cajaDia: $450 (era $700)');
  const c = C.comercioNuevo();
  const t = M.tienda(c, 'Parada Alta', 3);
  const lleno = t.caja;
  t.caja = 1000;
  M.tienda(c, 'Parada Alta', 4);
  eq(c.mercado['Parada Alta'].caja, Math.min(M.cajaMaxima('Parada Alta'), 1450), 'al otro día la caja sube $450');
  ok(lleno > 1450, 'y la caja de arranque es mucho mayor que lo que repone');
  // el techo sostenido: 60 días, mercadería infinita (la herramienta de la auditoría)
  const s = herramienta('auditoria-4-20-a-mercado.mjs', '60');
  const fila = filaDe(s, '│ 2       │ 3 ');
  entre(Number(fila[3]), 4700, 5200, 'visitando 3 puestos por día, lo que se vende por día se sostiene en (eran $7.670)');
}

// ============================================================ 3. los sueldos del turno × 1,25
{
  const viejo = { almacen: [1600, 2100, 2700], 'casa-te': [1600, 2000, 2600], 'taller-tren': [1800, 2300, 2800], 'banco-pueblo': [1700, 2200, 2800] };
  eq(EM.IDS_PUESTOS.slice().sort(), Object.keys(viejo).sort(), 'los cuatro puestos');
  for (const k of EM.IDS_PUESTOS) {
    const esperado = viejo[k].map((s) => Math.round((s * 1.25) / 50) * 50);
    eq(EM.PUESTOS[k].sueldos, esperado, `${k}: los sueldos son los de antes × 1,25 redondos a $50`);
    ok(EM.PUESTOS[k].sueldos.every((s) => s % 50 === 0) && EM.sueldoDe(k, 0) < EM.sueldoDe(k, 1) && EM.sueldoDe(k, 1) < EM.sueldoDe(k, 2), `${k}: redondos y sube con cada escalón`);
  }
  eq(EM.IDS_PUESTOS.map((k) => EM.sueldoDe(k, 0)), [2000, 2000, 2250, 2150], 'los de aprendiz: $2.000 / $2.000 / $2.250 / $2.150');
  // el turno vuelve a pagar más que un jornal (el jornal medio sale de la herramienta: pesosPorDia de «sólo jornales (los dos mejores)» / 2)
  const jornales = Object.values(T.TRABAJOS).map((t) => t.base);
  const jornalMedio = jornales.reduce((a, b) => a + b, 0) / jornales.length;
  ok(Math.min(...EM.IDS_PUESTOS.map((k) => EM.sueldoDe(k, 0))) >= 1.8 * jornalMedio, `un turno de aprendiz ($2.000) vale casi el doble de un jornal medio ($${Math.round(jornalMedio)})`);
}

// ============================================================ 4. el tablón: ×1,3 / ×1,6 / ×2
{
  eq(TA.TABLON.tramos, [[350, 1.3], [550, 1.6], [Infinity, 2]], 'los tramos de distancia');
  const orden = Object.keys(TA.ORIGENES).map((o) => ({ o, d: TA.distanciaAPlaza(TA.ORIGENES[o]), m: TA.multiplicadorDe(o) }));
  for (const x of orden) eq(x.m, x.d <= 350 ? 1.3 : x.d <= 550 ? 1.6 : 2, `${x.o} a ${x.d} m paga ×${x.m}`);
  ok(new Set(orden.map((x) => x.m)).size >= 2, 'hay encargos en más de un tramo');
  // el pago de un encargo lejano baja respecto del tramo viejo (×2,5) pero sigue arriba del pedido del pueblo
  const lejos = orden.find((x) => x.m === 2);
  if (lejos) { const k = TA.ENCARGOS_TABLON.find((e) => e.origen === lejos.o); const nuevo = TA.pagoDe(k.k, k.n, k.origen); ok(nuevo > 0 && nuevo < Math.round(k.n * TA.valorUnidad(k.k) * 1.1 * 2.5 / 50) * 50 + 1, 'un encargo lejano paga menos que con ×2,5'); }
  // la herramienta: el tablón diario (con los módulos reales) ronda los $850, no los $1.225
  const s = herramienta('auditoria-4-20-a-ritmo.mjs', '36');
  entre(Number(filaDe(s, 'G. sólo tablón')[2]), 800, 900, 'el tablón rinde por día (eran $1.225)');
}

// ============================================================ 5. el poncho de invierno ×1,25
{
  const c = C.comercioNuevo();
  const vInv = C.precios(c, 'Faro de los Duendes', 'poncho', 40, 'invierno', 1);
  const vOto = C.precios(c, 'Faro de los Duendes', 'poncho', 40, 'otono', 1);
  ok(vInv && vOto && vOto.venta > 0, 'hay precio de poncho');
  entre(vInv.venta / vOto.venta, 1.2, 1.3, 'el poncho en invierno vale ×1,25 lo de otoño (era ×1,45)');
  const lana = C.precios(c, 'Faro de los Duendes', 'lana', 40, 'invierno', 1).venta / C.precios(c, 'Faro de los Duendes', 'lana', 40, 'otono', 1).venta;
  entre(lana, 1.3, 1.5, 'la lana de invierno no se tocó (×1,4)');
}

// ============================================================ 6. el remo: XP.remo 4
{
  eq(OF.XP.remo, 4, 'XP.remo: 4 por cada tramo de 25 m (era 1)');
  const of = OF.oficiosNuevos();
  let tramos = 0;
  while (OF.nivelOficio(of, 'navegante') < OF.NIVEL_MAX) { OF.sumarXp(of, 'navegante', OF.XP.remo); tramos++; }
  eq(tramos * OF.METROS_REMO, 5000, 'el nivel 5 de navegante, a 5.000 m remados (eran 20.000)');
  const antes = OF.oficiosNuevos();
  OF.sumarXp(antes, 'navegante', 39);
  ok(OF.nivelOficio(antes, 'navegante') === 0, 'la experiencia que ya tenía una partida vieja no se toca (39 sigue en nivel 0)');
}

// ============================================================ 7. lo que dice el simulador de la auditoría, con los valores de ahora
{
  const s = herramienta('auditoria-4-20-a-ritmo.mjs', '36', '--resumen');
  const r = JSON.parse(s.split('\n').find((l) => l.startsWith('RESUMEN ')).slice(8));
  const por = Object.fromEntries(r.perfiles.map((p) => [p.p, p]));
  entre(por.tranquilo.catalogo, 245, 262, 'tranquilo: días hasta el catálogo de obras con pesos (eran 290)');
  entre(por.medio.catalogo, 165, 178, 'medio: días hasta el catálogo (eran 176)');
  entre(por.a.catalogo, 95, 108, 'a fondo: días hasta el catálogo (eran 83)');
  const cociente = por.tranquilo.catalogo / por.a.catalogo;
  entre(cociente, 2.3, 2.8, 'el cociente tranquilo / a fondo baja de 3,5 hacia 2,5');
  entre(por.tranquilo.dia20_40, 4200, 4500, 'un jugador tranquilo junta por día (eran $3.768)');
  entre(por.a.dia20_40, 10300, 11500, 'a fondo junta por día (eran $13.400)');
}

// ============================================================ 8. nada se rompió alrededor
{
  // la partida de antes: una caja guardada con de más (de cuando se reponían $700) se respeta y al otro día vuelve al tope
  const c = C.sanearComercio({ hoy: { dia: 3 }, mercado: { 'Parada Alta': { dia: 3, caja: 999999, stock: { tabla: 3 } } } });
  eq(c.mercado['Parada Alta'].caja, 999999, 'una caja guardada se respeta al cargar');
  M.tienda(c, 'Parada Alta', 4);
  ok(c.mercado['Parada Alta'].caja <= M.cajaMaxima('Parada Alta'), 'y al otro día queda en el tope del puesto');
  ok(leer('src/puestos-ruta.js').includes('$450 por día') && leer('src/comercio.js').includes('fletePaso'), 'los comentarios de los puestos dicen $450');
  ok(EM.EMPLEO.tareasPorTurno === 8 && EM.EMPLEO.redondeo === 50, 'el turno sigue de 8 tareas y redondo a $50');
}

console.log(`verificar-4-21-0-a: ${n} verificaciones ok · plata pareja: fletes en pesos con la fórmula entera, caja $450, sueldos × 1,25, tablón, poncho y remo`);
