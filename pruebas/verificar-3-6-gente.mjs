// 3.6 "La Aldea de los Duendes": la gente y la mecánica (src/aldea-gente.js), sin Electron.
//  · se sacó el "fundar el pueblo" de la 3.1: sin pueblo.js ni pueblo-mundo.js, sin casas
//    libres, nombre, cartel ni la ficha «Tu pueblo»; los oficios siguen;
//  · por las calles: de cada puerta a cada lugar de la aldea, sin atravesar edificios;
//  · los horarios: cada uno a su punto, los que comparten punto se acomodan alrededor;
//  · en el juego (con una gente de mentira): las figuras se arman al acercarte, lejos quedan
//    quietas en su lugar, la llegada en tren, aceptar, aportar a la obra, el reloj, los
//    servicios con sus efectos de verdad y las charlas entre vecinos;
//  · los enganches: main.js (la tecla E y el aviso en el mismo orden), gente.js, trochita.js,
//    comercio.js, cuaderno, eventos del valle, Personalizar y la pestaña de los oficios.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as A from '../src/aldea.js';
import * as G from '../src/aldea-gente.js';
import * as C from '../src/comercio.js';
import { ENTRADA, ENTRADAS } from '../src/cuaderno.js';
import { CARTAS, sanearCorreo } from '../src/correo.js';
import { XP, xpDeAporte } from '../src/oficios.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const existe = (f) => fs.existsSync(new URL('../' + f, import.meta.url));
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const M = A.marcoAldea();

// ============================================================ 0. lo viejo, afuera
{
  ok(!existe('src/pueblo.js') && !existe('src/pueblo-mundo.js'), 'pueblo.js y pueblo-mundo.js se sacaron');
  // (sin los comentarios, que cuentan la historia)
  const fuentes = fs.readdirSync(new URL('../src/', import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => [f, leer('src/' + f).replace(/^\s*\/\/.*$/gm, '').replace(/ \/\/ .*$/gm, '')]);
  for (const [f, t] of fuentes) {
    ok(!/from '\.\/pueblo(-mundo)?\.js'/.test(t), `${f}: nada importa el pueblo de la 3.1`);
    ok(!/casasLibres|casaOcupada|nombrarPueblo|lugarDelCartel|pueblo-propio|crearPuebloMundo|puedeLlegarPoblador|llamarPoblador|progreso\.pueblo\b/.test(t), `${f}: sin la mecánica del pueblo de la 3.1`);
    ok(!/con una casa libre|Tu pueblo necesita un nombre|Oficios y pueblo|Tu refugio y tu pueblo/.test(t), `${f}: sin los textos viejos`);
  }
  // lo que sí queda: el guardado convierte un pueblo 3.1 en la aldea (ver verificar-3-6-aldea)
  ok(leer('src/guardado.js').includes('migrarDesdePueblo(p.pueblo, p.dia)'), 'una partida 3.1 se convierte al cargar');
}

// ============================================================ 1. el módulo
{
  const t = leer('src/aldea-gente.js');
  for (const k of Object.keys(G)) ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  ok(!/from 'three'|document\.|window\./.test(t), 'aldea-gente.js no usa three ni el DOM');
  for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `import en una línea: ${m[0].slice(0, 60)}`);
  ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t), 'lo que entiende armar.mjs');
  ok(!t.includes('\r') && !leer('pruebas/verificar-3-6-gente.mjs').includes('\r'), 'fines de línea LF');
  ok(!/\b(capilla|misa|iglesia|altar|cura|rezar)\b/i.test(t + leer('src/gente.js')), 'nada religioso (pedido del usuario)');
  eq([G.RADIO_ALDEA, G.RADIO_FIGURAS, G.VER_ADENTRO, G.OIR_CHARLA], [150, 260, 25, 6], 'los radios');
  eq(G.listaMateriales({ tabla: 6, tronco: 2 }), '6 tablas y 2 troncos');
  eq(G.listaMateriales({ tabla: 1, tronco: 2, piedra: 3 }), '1 tabla, 2 troncos y 3 piedras');
  eq(G.listaMateriales({ piedra: 0 }), '');
}

// ============================================================ 2. por las calles
{
  const enCalle = (q) => A.CALLES_ALDEA.some((c) => A.distanciaACalle(q.x, q.z, c) < 0.05);
  // de cada puerta (y de cada lugar de afuera) a cada lugar de la aldea
  const lugares = [];
  for (const id of A.IDS_EDIFICIOS) for (const [k, q] of Object.entries(A.puntosDe(id))) lugares.push({ id, k, x: q.x, z: q.z });
  let caminos = 0, largoMax = 0;
  const muestra = lugares.filter((_, i) => i % 7 === 0);
  for (const a of muestra) for (const b of muestra) {
    if (a === b) continue;
    const pasos = G.recorridoAldea(a, b);
    caminos++;
    assert.ok(pasos.length >= 1, `${a.id}/${a.k} → ${b.id}/${b.k}: hay camino`);
    const ult = pasos[pasos.length - 1];
    assert.ok(Math.hypot(ult.x - b.x, ult.z - b.z) < 1e-6, 'termina en el lugar');
    let prev = a, largo = 0;
    for (const q of pasos) {
      largo += Math.hypot(q.x - prev.x, q.z - prev.z);
      // los tramos con choque no pasan por adentro de ningún edificio (salvo el de la punta)
      if (!q.sinChoque) {
        const desde = G.edificioEn(prev.x, prev.z), hasta = G.edificioEn(q.x, q.z);
        for (let s = 0.05; s < 0.96; s += 0.05) {
          const x = prev.x + (q.x - prev.x) * s, z = prev.z + (q.z - prev.z) * s;
          const en = G.edificioEn(x, z);
          assert.ok(!en || en === desde || en === hasta, `${a.id}/${a.k} → ${b.id}/${b.k}: no atraviesa ${en}`);
        }
      }
      prev = q;
    }
    largoMax = Math.max(largoMax, largo);
  }
  ok(caminos > 200, `${caminos} caminos probados`);
  ok(largoMax < 400, `ninguno da vueltas de más (el más largo: ${largoMax.toFixed(0)} m)`);
  // los del medio van por la calle
  const lejano = G.caminoAldea({ x: -35, z: 40 }, { x: 72, z: 55 });
  ok(lejano.slice(0, -1).every(enCalle), 'el camino largo va por las calles');
  eq(G.caminoAldea({ x: 0, z: 30 }, { x: 3, z: 33 }), [{ x: 3, z: 33 }], 'cerca, derecho');
  // salir de un edificio: por la puerta (sin chocar con el marco); en la estación, por su salida
  const sale = G.recorridoAldea(A.puntosDe('casa-abuela').cama, A.puntosDe('plaza')['estar-1']);
  ok(sale[0].sinChoque && Math.hypot(sale[0].x - A.puntosDe('casa-abuela').puerta.x, sale[0].z - A.puntosDe('casa-abuela').puerta.z) < 1e-6, 'de la cama sale por la puerta');
  const anden = G.recorridoAldea(A.puntosDe('estacion-aldea').anden, A.puntosDe('plaza')['estar-1']);
  ok(anden[0].sinChoque && anden[1].sinChoque && Math.hypot(anden[1].x - 6, anden[1].z - 9) < 1e-6, 'del andén, por la salida de la estación');
  const entra = G.recorridoAldea(A.puntosDe('plaza')['estar-1'], A.puntosDe('almacen').adentro);
  ok(entra[entra.length - 1].sinChoque && entra[entra.length - 2] && !entra[entra.length - 2].sinChoque, 'entra por la puerta y recién ahí sin choque');
  const misma = G.recorridoAldea(A.puntosDe('casa-familia').adentro, A.puntosDe('casa-familia').cama);
  eq(misma.length, 1, 'adentro de la misma casa, derecho');
  ok(G.distanciaAldea(M.aMundo(10, 40).x, M.aMundo(10, 40).z) === 0 && Math.abs(G.distanciaAldea(M.aMundo(10, 172).x, M.aMundo(10, 172).z) - 100) < 1e-6, 'la distancia a la aldea');
}

// ============================================================ 3. qué dibujar y dónde va cada uno
{
  const a = A.aldeaNueva();
  eq(G.estadoVisual(a, 'plaza'), 'abierto');
  eq(G.estadoVisual(a, 'escuela'), 'a-medio', 'la escuela, a medio hacer');
  eq(G.estadoVisual(a, 'panaderia'), 'lote');
  eq(G.estadoVisual(a, 'nada'), null);
  A.empezarLlegada(a, 'carpintero', 3);
  A.aceptar(a, 3);
  eq(G.estadoVisual(a, 'carpinteria'), 'obra-1', 'recién aceptado: se marca el lote');
  for (let e = 0; e < 4; e++) {
    A.aportar(a, 'carpinteria', { tronco: 99, tabla: 99, piedra: 99 }, 3 + e);
    A.avanzarObras(a, 4 + e, 8);
    eq(G.estadoVisual(a, 'carpinteria'), e < 3 ? `obra-${e + 2}` : 'abierto', `etapa ${e + 1}`);
  }
  // la maestra: la escuela sigue de la etapa 3
  a.ultimaApertura = 0; a.llamado = true;
  A.empezarLlegada(a, 'maestra', 9); A.aceptar(a, 9);
  eq(G.estadoVisual(a, 'escuela'), 'obra-3', 'la escuela sigue donde estaba');
  // los destinos: todos los presentes tienen uno; los que van al mismo punto se acomodan
  const quienes = [...A.ORDEN_VECINOS_ALDEA, 'carpintero', 'maestra'];
  for (const h of [0, 3, 7.2, 9, 12.9, 15, 17, 19, 21.5]) for (let d = 1; d <= 7; d++) {
    const ds = G.destinosAldea(a, h, d, quienes);
    assert.equal(ds.size, quienes.length, `a las ${h} del día ${d} todos tienen dónde estar`);
    const pos = [...ds.values()];
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      assert.ok(Math.hypot(pos[i].x - pos[j].x, pos[i].z - pos[j].z) > 0.4, `a las ${h} del día ${d}: nadie encima de nadie`);
    }
    for (const x of pos) assert.ok(Number.isFinite(x.x) && Number.isFinite(x.z) && Number.isFinite(x.mira));
  }
  n++;
  const ds = G.destinosAldea(a, 13, 1, quienes);
  eq(ds.get('madre').edificio, 'casa-familia');
  ok(ds.get('madre').adentro && !ds.get('padre').punto.startsWith('obra') && ds.get('jefe').edificio === 'casa-jefe', 'al mediodía, cada uno en su casa');
}

// ============================================================ 4. en el juego (con gente de mentira)
function partida() {
  return { modo: 'relax', dia: 1, horas: 10, entradas: {}, materiales: {}, cosas: {}, personal: {}, aldea: A.aldeaNueva(), correo: sanearCorreo({}) };
}
function mundo(p) {
  const figuras = [];
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const jugador = { estado: { pos: vec(0, 0, 0) } };
  const dichos = [], notas = [], hechos = [];
  const tren = { est: { parado: 0, proxima: null } };
  // Ercilia, la de gente.js, con su ruta detrás del mostrador del almacén (en la aldea)
  const alm = A.puntosMundo('almacen');
  const ercilia = { clave: 'ercilia', nombre: 'Ercilia', pos: vec(alm.adentro.x, 0, alm.adentro.z), g: { rotation: { y: 0 } },
    ruta: [{ x: alm.adentro.x, z: alm.adentro.z, quieto: 16 }, { x: alm.mostrador.x, z: alm.mostrador.z, quieto: 9 }], etapa: 0, espera: 3 };
  const ctx = {
    progreso: () => p,
    gente: () => ({ gente: [ercilia], agregarPoblador: (def) => { const f = { ...def, pos: vec(def.pos.x, 0, def.pos.z), g: { rotation: { y: 0 } } }; figuras.push(f); return f; } }),
    tren: () => tren, jugador: () => jugador, alturaDePie: () => 0,
    nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, registrar: (id) => { p.entradas[id] = p.entradas[id] || { dia: p.dia }; hechos.push(`registrar ${id}`); },
    sumarMaterial: (k, x) => { p.materiales[k] = (p.materiales[k] || 0) + x; },
    sumarEntrada: (k, x) => { p.entradas[k] = p.entradas[k] || { dia: p.dia, cantidad: 0 }; p.entradas[k].cantidad += x; },
    hablandoCon: () => null,
    alJugador: (campo, valor) => hechos.push(`${campo}=${valor}`),
    leerCarta: (id) => hechos.push(`carta ${id}`), mandarFoto: (id) => hechos.push(`foto ${id}`), partitura: (id) => hechos.push(`partitura ${id}`),
    pronostico: () => 'para mañana: viento moderado', ambiente: () => ({ clima: 'sol', estacion: 'verano' }),
    decir: (t) => dichos.push(t),
  };
  const ag = G.crearAldeaGente(ctx);
  const ir = (lx, lz) => { const w = M.aMundo(lx, lz); jugador.estado.pos.x = w.x; jugador.estado.pos.z = w.z; };
  return { ag, ctx, figuras, ercilia, jugador, dichos, notas, hechos, tren, ir, tick: (k = 1, dt = 0.6) => { for (let i = 0; i < k; i++) ag.actualizar(dt); } };
}
{
  const p = partida();
  const m = mundo(p);
  // lejos (en el refugio, a casi 600 m): nada se arma
  m.jugador.estado.pos.x = 0; m.jugador.estado.pos.z = 0;
  m.tick(10);
  eq(m.figuras.length, 0, 'lejos de la aldea no se arma ninguna figura');
  ok(!p.aldea.descubierta, 'ni se descubre');
  // a 200 m: se arman, de a una, pero no se mueven (dormidas)
  m.ir(10, 240);
  m.tick(3);
  ok(m.figuras.length >= 1 && m.figuras.length < 8, `de a una por cuadro (${m.figuras.length})`);
  m.tick(8);
  eq(m.figuras.length, 8, 'los ocho vecinos de la aldea');
  ok(m.ag.personas.get('ercilia').npc === m.ercilia && m.ercilia.claveAldea === 'ercilia', 'y Ercilia, la de siempre (no se arma otra)');
  ok(m.figuras.every((f) => f.dormido), 'a más de 150 m, quietos y sin dibujar');
  eq(m.figuras.map((f) => f.clave), A.ORDEN_VECINOS_ALDEA.map((k) => `aldea-${k}`));
  ok(m.figuras.find((f) => f.clave === 'aldea-nene').talla === A.VECINOS_ALDEA.nene.talla, 'los chicos, más bajitos');
  ok(m.figuras.every((f) => Array.isArray(f.camino) && f.camino.length === 0), 'con horario (sin ruta en vuelta)');
  // cambia la hora con vos lejos: cada uno aparece en su punto, sin caminar
  p.horas = 3;
  m.tick(2);
  const est = m.ag.estado();
  ok(est.npcs.every((x) => Math.hypot(x.x - x.destino.x, x.z - x.destino.z) < 1e-6 && !x.caminando), 'de noche, cada uno en su cama');
  ok(m.figuras.filter((f) => f.soloCerca === G.VER_ADENTRO).length === 8, 'adentro, se los ve sólo de cerca');
  ok(Math.hypot(m.ercilia.pos.x - A.puntosMundo('casa-ercilia').cama.x, m.ercilia.pos.z - A.puntosMundo('casa-ercilia').cama.z) < 1e-6, 'Ercilia duerme en su casa de la aldea');
  // llegás a la plaza: despiertan, se anota el lugar
  p.horas = 10;
  m.ir(6, 39.5);
  m.tick(2);
  ok(m.figuras.every((f) => !f.dormido), 'cerca, despiertos');
  ok(p.aldea.descubierta === 1 && m.hechos.includes('registrar aldea'), 'la primera vez, al cuaderno');
  ok(ENTRADA.aldea && ENTRADA.aldea.seccion === 'lugares' && ENTRADA.aldea.nombre === 'Aldea de los Duendes', 'la entrada del cuaderno');
  ok(m.figuras.some((f) => f.camino.length > 0), 'a la mañana salen caminando de su casa');
  const jefe = m.figuras.find((f) => f.clave === 'aldea-jefe');
  ok(jefe.camino[0].sinChoque, 'por la puerta');
  // Ercilia: camina al almacén y ahí sigue su ruta de siempre detrás del mostrador
  ok(m.ercilia.camino.length > 0 && m.ag.personas.get('ercilia').destino.edificio === 'almacen', 'Ercilia va a abrir el almacén');
  { const st = m.ag.personas.get('ercilia'); const q = st.destino; m.ercilia.pos.x = q.x; m.ercilia.pos.z = q.z; m.ercilia.camino = []; }
  m.tick(1);
  ok(m.ercilia.camino === null && m.ercilia.ruta === m.ag.personas.get('ercilia').rutaPropia && m.ercilia.ruta.length === 2, 'y atiende con su ruta de siempre');
  // de visita en tu mesa (visitas.js), no se la toca
  m.ercilia.deVisita = true; m.ercilia.ruta = [{ x: 0, z: 0, quieto: 99999 }];
  p.horas = 14; m.tick(2);
  ok(m.ercilia.camino === null && m.ercilia.ruta[0].x === 0 && !m.ercilia.dormido, 'de visita sigue con la visita');
  m.ercilia.deVisita = false; m.tick(1);
  ok(m.ercilia.camino && m.ercilia.camino.length > 0 && m.ag.personas.get('ercilia').destino.punto === 'cama', 'al volver, a dormir la siesta');
  p.horas = 10; m.tick(1);

  // ---- la llegada
  m.tren.est = { parado: 30, proxima: { indice: A.PARADA_ALDEA.indice } };
  m.tick(1);
  eq(p.aldea.llegando, null, 'con el valle sin anotar no baja nadie');
  for (const e of ENTRADAS.slice(0, 14)) p.entradas[e.id] = p.entradas[e.id] || { dia: 1 };
  m.tren.est = { parado: 30, proxima: { indice: 3 } };
  m.tick(1);
  eq(p.aldea.llegando, null, 'si el tren para en otra parada, tampoco');
  m.tren.est = { parado: 30, proxima: { indice: A.PARADA_ALDEA.indice } };
  m.tick(1);
  eq(p.aldea.llegando?.clave, 'carpintero', 'para en la aldea y baja el carpintero');
  ok(m.notas.some((x) => /^Bajó alguien del tren en la Aldea de los Duendes · Tito Arrieta, carpintero, espera en el andén/.test(x)), 'con su aviso');
  m.tick(2);
  const tito = m.figuras.find((f) => f.clave === 'poblador-carpintero');
  ok(tito && tito.llegando && /de la aldea/.test(tito.saludo), 'espera en el andén');
  let c = m.ag.charla(tito);
  ok(c.partes.length === 3 && c.partes[2].includes('¿Me puedo quedar?') && c.partes[2].includes('sobre la calle de la Vía') && c.seguir === 'E: que se quede · Escape: todavía no', `se presenta y pide quedarse: «${c.partes[2]}»`);
  ok(!c.partes.join(' ').includes('casa vacía'), 'sin pedir una casa tuya');
  c.alTerminar();
  ok(p.aldea.pobladores.length === 1 && p.aldea.obras.carpinteria && !p.aldea.llegando, 'aceptado: se abre su obra');
  ok(m.notas.some((x) => /^Tito Arrieta se queda en la Aldea de los Duendes · Se marcó el lote de la carpintería/.test(x)), 'con su aviso');
  ok(!tito.llegando && tito.saludo === A.POBLADORES_ALDEA.carpintero.saludo, 'ya saluda como vecino');
  // mientras dura la obra: de día, en la obra; de noche, en la estación
  m.tick(1);
  eq(m.ag.personas.get('carpintero').destino.edificio, 'carpinteria', 'de día trabaja en su obra');
  ok(m.ag.personas.get('carpintero').destino.punto.startsWith('obra-'));
  ok(m.ag.charla(tito).partes[0].startsWith('Primero levantemos la carpintería'), 'sin local todavía, no hay servicio');

  // ---- la obra
  const lote = A.edificioEnMundo('carpinteria');
  ok(m.ag.obraCerca({ x: lote.x, z: lote.z }) === 'carpinteria' && m.ag.obraCerca(M.aMundo(6, 39.5)) === null, 'la obra se ofrece parado en el lote');
  const pts = A.puntosMundo('carpinteria');
  ok(['obra-1', 'obra-2', 'obra-3', 'obra-4'].every((k) => m.ag.obraCerca(pts[k]) === 'carpinteria'), 'y donde trabajan los vecinos');
  eq(m.ag.avisoObra('carpinteria'), 'Aportar a la obra de la carpintería (faltan 12 piedras y 5 troncos)');
  p.materiales = { piedra: 4 };
  let r = m.ag.aportarObra('carpinteria');
  eq(r.usados, { piedra: 4 }, 'aporta lo que tenés');
  eq(p.materiales.piedra, 0, 'y se descuenta');
  eq(m.ag.avisoObra('carpinteria'), 'Aportar a la obra de la carpintería (faltan 8 piedras y 5 troncos)');
  r = m.ag.aportarObra('carpinteria');
  ok(!Object.keys(r.usados).length && /^No tenés nada de lo que falta/.test(m.notas.at(-1)), 'sin nada, lo dice');
  p.materiales = { piedra: 20, tronco: 20 };
  r = m.ag.aportarObra('carpinteria');
  ok(r.completa && /Los vecinos van a trabajar en la obra: mañana a la mañana está lista la etapa/.test(m.notas.at(-1)), 'con la etapa completa, los vecinos trabajan');
  eq(m.ag.avisoObra('carpinteria'), 'La obra de la carpintería: los vecinos están trabajando');
  eq(p.materiales, { piedra: 12, tronco: 15 }, 'se toma sólo lo que falta');
  // el reloj: a las 7 del día siguiente (aunque duermas y el reloj salte dos días, una etapa sola)
  p.horas = 23; m.tick(1);
  eq(p.aldea.obras.carpinteria.etapa, 0, 'esa noche, todavía no');
  p.dia = 3; p.horas = 9; m.tick(1);
  eq(p.aldea.obras.carpinteria.etapa, 1, 'una etapa por vez aunque pasen dos días');
  ok(/^Avanzó la obra de la carpintería · Quedó hecha: cimientos\. Ahora: estructura/.test(m.notas.at(-1)), 'con su aviso');
  m.tick(3);
  eq(p.aldea.obras.carpinteria.etapa, 1, 'y no sigue sola');
  for (let e = 1; e < 4; e++) {
    p.materiales = { piedra: 99, tronco: 99, tabla: 99 };
    m.ag.aportarObra('carpinteria');
    p.dia += 1; p.horas = 7.5; m.tick(1);
  }
  ok(A.localAbierto(p.aldea, 'carpinteria') && !p.aldea.obras.carpinteria, 'abrió el local');
  ok(m.notas.some((x) => x.startsWith('Abrió la carpintería de Tito Arrieta · Te aserra troncos')), 'Abrió la carpintería de Tito Arrieta');

  // ---- los servicios
  p.materiales = { tronco: 2 };
  c = m.ag.charla(tito);
  ok(c.seguir === 'E: dale · Escape: otro día' && c.alTerminar, 'el carpintero ofrece aserrar');
  c.alTerminar();
  eq([p.materiales.tronco, p.materiales.tabla], [0, 10], 'dos troncos, diez tablas');
  ok(!m.ag.charla(tito).alTerminar, 'una vez por día');
  // lo que cambia en el medio: no se cobra dos veces
  p.dia += 1; p.materiales = { tronco: 3 };
  c = m.ag.charla(tito);
  p.materiales.tronco = 1;
  ok(c.alTerminar() === false && /^Ya no alcanza/.test(m.notas.at(-1)), 'si ya no tenés lo que ibas a dar, no hay trato');
  // la enfermera, el telegrafista y el músico: efectos sobre el jugador, el correo y la música
  const conLocal = (k) => { p.aldea.pobladores.push({ clave: k, dia: 1 }); p.aldea.locales[A.LOTE_DE[k]] = 1; m.tick(2); return m.figuras.find((f) => f.clave === `poblador-${k}`); };
  const enf = conLocal('enfermera');
  ok(!!enf, 'los pobladores que ya viven en la aldea tienen su figura');
  c = m.ag.charla(enf); c.alTerminar();
  ok(m.hechos.includes('descansado=3') && m.hechos.includes('entumecido=0'), 'la enfermera te deja descansado');
  const tel = conLocal('telegrafista');
  c = m.ag.charla(tel);
  ok(!c.alTerminar && /Bariloche pasan para mañana: viento moderado/.test(c.partes.join(' ')), 'sin cartas, el pronóstico de mañana');
  p.correo.llegadas[CARTAS[0].id] = p.dia;
  c = m.ag.charla(tel);
  ok(c.alTerminar && c.partes.length > 1, 'con carta, te la entrega');
  c.alTerminar();
  ok(m.hechos.includes(`carta ${CARTAS[0].id}`), 'y queda leída (al cuaderno, como la de Ercilia)');
  const mus = conLocal('musico');
  c = m.ag.charla(mus); c.alTerminar();
  ok(m.hechos.some((x) => x.startsWith('partitura ')), 'el músico te enseña una melodía');
  ok(p.aldea.partitura === p.dia, 'una por semana');

  // ---- las charlas entre vecinos: dos quietos y juntos, vos cerca
  p.dia = 2; p.horas = 10;
  m.tick(2);
  const nene = m.figuras.find((f) => f.clave === 'aldea-nene'), nena = m.figuras.find((f) => f.clave === 'aldea-nena');
  const w = M.aMundo(6, 39.5);
  for (const [f, dx] of [[nene, -0.8], [nena, 0.8]]) { f.pos.x = w.x + dx; f.pos.z = w.z; f.camino = []; }
  m.jugador.estado.pos.x = w.x + 3; m.jugador.estado.pos.z = w.z;
  m.dichos.length = 0;
  for (let i = 0; i < 40; i++) m.tick(1, 0.5);
  const ch = m.dichos.filter(Boolean);
  ok(ch.length >= 2 && ch.every((t) => /^(Nahuel|Lucía): /.test(t)), `charlan entre ellos, de a una línea (${ch.slice(0, 2).join(' / ')})`);
  ok(m.dichos.at(-1) === null, 'y al terminar se apaga');
  ok(!nene.charlaVecinos && !nena.charlaVecinos, 'y cada uno sigue con lo suyo');
  // lejos no se oye nada
  m.dichos.length = 0;
  m.jugador.estado.pos.x = w.x + 30;
  for (let i = 0; i < 20; i++) m.tick(1, 0.5);
  ok(!m.dichos.some(Boolean), 'lejos no se oye');

  // ---- la ficha del cuaderno
  const nodos = [];
  const el = (tag, clase, texto) => { const x = { tag, clase, texto: texto || '', hijos: [], appendChild(h) { this.hijos.push(h); } }; nodos.push(x); return x; };
  const ficha = el('div');
  m.ag.dibujarCuaderno(ficha, el);
  const texto = nodos.map((x) => x.texto).join(' | ');
  ok(/Aldea de los Duendes/.test(texto) && /Tito Arrieta, carpintero: atiende la carpintería/.test(texto) && /Ernesto Llancafil, jefe de estación/.test(texto), 'la ficha: quién vive y qué abrió');
  ok(/El próximo en llegar: Rosa Quilodrán, panadera/.test(texto), 'y quién sigue');
}
{
  // el Desafío: no llega nadie
  const p = partida(); p.modo = 'desafio';
  const m = mundo(p);
  for (const e of ENTRADAS.slice(0, 30)) p.entradas[e.id] = { dia: 1 };
  m.tren.est = { parado: 30, proxima: { indice: A.PARADA_ALDEA.indice } };
  eq(m.ag.revisarLlegada(true), null, 'en el Desafío no baja nadie');
}

// ============================================================ 5. los enganches
{
  const main = leer('src/main.js');
  for (const imp of ["import { crearAldeaGente } from './aldea-gente.js';", "import { renombrarParada } from './comercio.js';"]) ok(main.includes(imp), imp);
  ok(main.includes('armarOficiosYAldea(esDesafio);') && /function armarOficiosYAldea\(esDesafio\) \{[\s\S]*?if \(esDesafio\) return;\n  aldeaGente = crearAldeaGente\(/.test(main), 'la aldea se arma sólo en el Relax');
  ok(main.includes("try { if (modo === 'jugando') actualizarAldea(dt); } catch (e) { fallaSistema('aldea', e); }"), 'y se actualiza en el bucle');
  ok(main.includes('const deLaAldea = npc.poblador && aldeaGente ? aldeaGente.charla(npc) : null;'), 'E habla con la gente de la aldea');
  ok(main.includes('if (charla.historia?.alTerminar && charla.parte === charla.historia.partes.length) charla.historia.alTerminar();'), 'el trato se acepta con E en el último renglón');
  // la tecla E y el aviso, en el mismo orden: la obra de la aldea va después de las obras que trabajan
  const tecla = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'Tab':"));
  const aviso = main.slice(main.indexOf('2.4.1: el aviso sigue el orden de la tecla E paso a paso'), main.indexOf('mostrarAviso(aviso);'));
  const orden = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) > t.indexOf(a);
  ok(orden(tecla, 'obraQueTrabajaCerca()', 'aldeaGente.obraCerca(js.pos)') && orden(tecla, 'aldeaGente.obraCerca(js.pos)', 'ovejaCercana'), 'la tecla E: después de las obras que trabajan, antes de la oveja');
  ok(orden(aviso, 'avisoObraQueTrabaja(cacheObraTrabaja)', 'aldeaGente.avisoObra(cacheObraAldea)') && orden(aviso, 'aldeaGente.avisoObra(cacheObraAldea)', 'ovejaCercana && !objetivo'), 'el aviso, en el mismo lugar');
  ok(main.includes("gastarFilo(progreso.aldea);") && main.includes("golpesConFilo(golpesParaTalar(GOLPES_TALA, nivelDe('hachero')), progreso?.aldea)"), 'el filo del herrero, con la aldea');
  ok(main.includes("pestanas.push(['oficios', desafio ? 'Oficios' : 'Oficios y aldea']);") && main.includes('oficios.dibujarCuaderno(lista, ficha, el, desafio ? null : aldeaGente)'), 'la pestaña «Oficios y aldea»');
  ok(main.includes("aldea: esDesafio ? null : { indice: PARADA_ALDEA.indice, nombre: NOMBRE_ALDEA }"), 'la parada del sur, con el nombre de la aldea sólo en el Relax');
  const mudar = main.slice(main.indexOf('function mudarDatosDeObra('), main.indexOf('\n}\n', main.indexOf('function mudarDatosDeObra(')));
  ok(mudar.length > 50 && !/\.pobladores|claveCasa/.test(mudar), 'mover una obra ya no muda pobladores');
  const gente = leer('src/gente.js');
  ok(gente.includes('if (g.dormido) { if (g.g.visible) g.g.visible = false; continue; }'), 'gente.js: la gente de la aldea, lejos, ni se dibuja ni se mueve');
  ok(gente.includes("d < (g.soloCerca || 130)") && gente.includes('if (g.camino && !charlando && !cerquita) {'), 'gente.js: con horario y adentro sólo de cerca');
  for (const k of [...A.ORDEN_VECINOS_ALDEA.map((x) => `aldea-${x}`), ...A.ORDEN_POBLADORES_ALDEA.map((x) => `poblador-${x}`)]) ok(gente.includes(`'${k}': {`), `gente.js: la ropa de ${k}`);
  const tro = leer('src/trochita.js');
  ok(tro.includes('const deLaAldea = !!opciones.aldea && sitio.i === opciones.aldea.indice;') && tro.includes('usados.add(nombre);'), 'trochita.js: las demás paradas se siguen llamando igual');
  // el comercio: el perfil de la aldea y lo guardado con el nombre viejo
  ok(C.perfilDe('Aldea de los Duendes').quien.includes('jefe de estación'), 'el puesto de cargas de la aldea tiene quién lo atienda');
  ok(C.bienesDe('Aldea de los Duendes').length >= 4, 'y qué vender');
  const com = C.sanearComercio({ hoy: { dia: 4, vendidos: { 'Parada del Molino|tronco': 2, 'Parada Alta|piedra': 1 }, comprados: {}, tomados: ['4|Parada del Molino|0'] },
    fletes: [{ id: '4|Parada Alta|1', tipo: 'carga', desde: 'Parada Alta', hasta: 'Parada del Molino', cuantos: 3, que: 'leña', premio: { yerba: 6 }, dia: 4 }] });
  ok(C.renombrarParada(com, 'Parada del Molino', 'Aldea de los Duendes') === 3, 'lo del nombre viejo pasa al nuevo');
  eq(com.fletes[0].hasta, 'Aldea de los Duendes', 'el flete que llevás se entrega en la aldea');
  eq(com.hoy.vendidos, { 'Parada Alta|piedra': 1, 'Aldea de los Duendes|tronco': 2 });
  eq(com.hoy.tomados, ['4|Aldea de los Duendes|0']);
  eq(C.renombrarParada(com, 'Parada del Molino', 'Aldea de los Duendes'), 0, 'una sola vez');
  eq(C.renombrarParada(null, 'a', 'b'), 0);
  // los eventos del valle, Personalizar, los oficios
  const ev = leer('src/eventos-valle-ui.js');
  ok(ev.includes("import { puedeLlegar, llamarProximo, NOMBRE_ALDEA } from './aldea.js';") && ev.includes('llamarProximo(p.aldea)'), 'el viajero llama al próximo poblador de la aldea');
  ok(leer('src/personal-casa.js').includes("titulo: 'Tu refugio',"), 'Personalizar → Tu refugio');
  const of = leer('src/oficios-ui.js');
  ok(of.includes("...(aldea ? ['aldea'] : [])") && of.includes('aldea.dibujarCuaderno(ficha, el)'), 'la ficha de la aldea en la pestaña de los oficios');
  ok(leer('package.json').includes('node pruebas/verificar-3-6-gente.mjs') && leer('package.json').includes('node pruebas/verificar-3-1-oficios.mjs') && !leer('package.json').includes('verificar-3-1-pueblo'), 'las pruebas en el gate');
}

// 3.6: aportar a la obra del pueblo da oficio de constructor, sin que convenga hacerlo de a uno
{
  eq(xpDeAporte({ tabla: 6, tronco: 3 }), 3, 'lo puesto cuenta un tercio');
  eq(xpDeAporte({ tabla: 6 }, true), 2 + XP.etapa, 'la etapa suma sólo al completarse');
  let deAUno = 0; for (let i = 0; i < 9; i++) deAUno += xpDeAporte({ tabla: 1 });
  ok(deAUno <= xpDeAporte({ tabla: 9 }), 'de a uno no rinde más que de una vez');
  eq(xpDeAporte(null), 0); eq(xpDeAporte({ tabla: -5, x: 'a' }), 0, 'basura: nada');
  // (3.6.1: con lo que ya estaba aportado a la etapa, ver verificar-3-6-1-aldea.mjs)
  ok(leer('src/main.js').includes("alAportar: (usados, completa, antes) => ganarOficio('obrero', xpDeAporte(usados, completa, antes)),") && leer('src/aldea-gente.js').includes('ctx.alAportar?.(r.usados, r.completa, antes);'), 'conectado al aporte');
}

console.log(`OK 3.6.0 gente · ${n} verificaciones · sin el pueblo de la 3.1, por las calles, horarios, llegada, obras, servicios, charlas y enganches`);
