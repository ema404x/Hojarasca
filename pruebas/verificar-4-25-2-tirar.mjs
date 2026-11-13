// 4.25.2: tirar casi todo con V (tirar.js) y volver a juntarlo con E. Lo que se prueba:
//   1. qué se tira y qué no: lo de la Historia no (con su motivo), la cámara no, la carpa armada no, en el Desafío sólo lo del suelo
//   2. ida y vuelta exacta: materiales, entradas (la del cuaderno no se borra), contadores de `cosas` repartidos en dos casas,
//      herramientas únicas (su valor tal cual), la caña y la linterna (`progreso.dejadas`), una unidad o la pila entera
//   3. la economía: tirar y juntar NUNCA duplica ni pierde (una partida al azar de miles de pasos, con la mochila llena a ratos)
//   4. el suelo: bultos iguales cercanos se suman, el tope de bultos del valle, el aviso de la E
//   5. el guardado: sobreviven a guardar y cargar; una partida vieja sin el campo carga igual; lo roto se descarta
//   6. el enganche en main.js: soltarRanura con un mundo de mentira (frenos, el bulto, la vuelta atrás si no hay lugar) y la E
//   7. mutaciones: cada regla de tirar.js deshecha en una copia (src/tirar.mutN.js) hace fallar la prueba; las de main.js, en memoria
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { funcion } from './ayuda-codigo.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

// un localStorage de mentira, para el guardado en Node
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};

// Las reglas de tirar.js: devuelve la lista de lo que no cumple (vacía: todo en orden). Se corre sobre el módulo de verdad y
// sobre cada copia mutada.
function revisar(TI) {
  const mal = [];
  const si = (c, t) => { if (!c) mal.push(t); };
  const clon = (o) => JSON.parse(JSON.stringify(o));
  // (igual sin mirar el orden de las claves: lo que se borra y vuelve queda al final del objeto)
  const orden = (o) => (Array.isArray(o) ? o.map(orden) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, orden(o[k])])) : o);
  const igual = (a, b) => JSON.stringify(orden(a)) === JSON.stringify(orden(b));
  const partida = () => ({
    modo: 'relax', dia: 4, horas: 10, ramitas: 10, carpa: null,
    materiales: { tronco: 5, tabla: 3, piedra: 2 },
    entradas: { 'pan-casero': { dia: 2, hora: 9, cantidad: 3, nota: 'del horno' }, frutilla: { dia: 1, hora: 8, cantidad: 2 }, harina: { dia: 3, hora: 9, cantidad: 2 } },
    cosas: { hacha: 1, pico: 1, farol: true, manta: 1, harina: 4, yerba: 6, 'llave-molino': 1, 'pluma-condor': 1, 'hoz-junco': 1 },
  });

  // ---- 1. qué se tira y qué no
  const p0 = partida();
  for (const id of ['llave-molino', 'pluma-condor', 'canto-gemelo', 'lampara-eusebio']) {
    const m = TI.motivoParaNoTirar(p0, id);
    si(m && /Historia/.test(m.texto), `lo de la Historia no se suelta, y dice por qué (${id})`);
  }
  si(/fotos/.test(TI.motivoParaNoTirar(p0, 'camara')?.texto || ''), 'la cámara no se suelta, y dice por qué');
  si(!TI.motivoParaNoTirar(p0, 'carpa'), 'la carpa desarmada se suelta');
  si(TI.motivoParaNoTirar({ ...partida(), carpa: { x: 1, z: 1 } }, 'carpa'), 'la carpa armada no');
  for (const id of ['tronco', 'tabla', 'pan-casero', 'harina', 'yerba', 'hacha', 'pico', 'farol', 'hoz-junco', 'cana', 'linterna', 'ramita', 'frutilla']) si(!TI.motivoParaNoTirar(p0, id), `se suelta: ${id}`);
  for (const id of ['nada', '__proto__', 'constructor', '', 42]) si(TI.motivoParaNoTirar(p0, id), `no se suelta lo que no está: ${String(id)}`);
  const d0 = { ...partida(), modo: 'desafio' };
  si(!TI.motivoParaNoTirar(d0, 'ramita') && !TI.motivoParaNoTirar(d0, 'frutilla'), 'en el Desafío, lo del suelo sí');
  for (const id of ['tronco', 'hacha', 'cana', 'pan-casero']) si(TI.motivoParaNoTirar(d0, id), `en el Desafío, ${id} no`);

  // ---- 2. ida y vuelta exacta
  {
    const p = partida(), antes = clon(p);
    const t = TI.sacarDeMochila(p, 'tronco', { nombre: 'Troncos' });
    si(t.ok && t.carga.n === 1 && p.materiales.tronco === 4, 'V saca un tronco');
    const v = TI.devolverAMochila(p, t.carga);
    si(v.ok && v.juntados === 1 && !v.resto && igual(p, antes), 'E lo devuelve y la partida queda igual');
    const t2 = TI.sacarDeMochila(p, 'tronco', { todo: true });
    si(t2.ok && t2.carga.n === 5 && p.materiales.tronco === 0, 'Mayús + V saca la pila entera');
    TI.devolverAMochila(p, t2.carga);
    si(p.materiales.tronco === 5, 'y vuelve entera');
  }
  {
    const p = partida(), antes = clon(p);
    const t = TI.sacarDeMochila(p, 'pan-casero', { todo: true });
    si(t.ok && t.carga.n === 3 && p.entradas['pan-casero'] && p.entradas['pan-casero'].cantidad === 0 && p.entradas['pan-casero'].nota === 'del horno', 'la entrada del cuaderno no se borra: sólo baja la cantidad');
    TI.devolverAMochila(p, t.carga);
    si(igual(p, antes), 'y vuelve a la misma entrada');
  }
  {
    const p = partida(), antes = clon(p);
    const t = TI.sacarDeMochila(p, 'harina', { todo: true });
    si(t.ok && t.carga.n === 6 && t.carga.partes.entrada === 2 && t.carga.partes.cosa === 4 && !('harina' in p.cosas), 'lo repartido en dos casas sale de las dos');
    TI.devolverAMochila(p, t.carga);
    si(igual(p, antes), 'y vuelve a las dos, tal cual');
  }
  {
    const p = partida(), antes = clon(p);
    const t = TI.sacarDeMochila(p, 'farol', { nombre: 'Farol de kerosene' });
    si(t.ok && t.carga.valor === true && !('farol' in p.cosas), 'una herramienta única sale con su valor');
    p.cosas.farol = true;   // (compraste otro)
    const v = TI.devolverAMochila(p, t.carga);
    si(!v.ok && v.resto === t.carga && p.cosas.farol === true, 'con otro igual encima no se junta (no se duplica): queda en el suelo');
    delete p.cosas.farol;
    si(TI.devolverAMochila(p, t.carga).ok && igual(p, antes), 'sin otro, vuelve igual');
    const c = TI.sacarDeMochila(p, 'carpa');
    si(c.ok && c.carga.clave === 'manta' && !('manta' in p.cosas), 'la carpa es la manta de `cosas`');
    TI.devolverAMochila(p, c.carga);
    si(p.cosas.manta === 1, 'y vuelve');
  }
  {
    const p = partida();
    const t = TI.sacarDeMochila(p, 'cana', { nombre: 'Caña de pescar' });
    si(t.ok && TI.dejada(p, 'cana') && t.carga.base, 'la caña queda anotada como dejada');
    si(!TI.sacarDeMochila(p, 'cana').ok, 'no se tira dos veces');
    si(TI.devolverAMochila(p, t.carga).ok && !TI.dejada(p, 'cana'), 'al juntarla vuelve');
    si(!TI.devolverAMochila(p, t.carga).ok, 'y no se junta dos veces');
  }
  {
    const p = partida();
    const t = TI.sacarDeMochila(p, 'tronco', { todo: true });
    const v = TI.devolverAMochila(p, t.carga, (k, q) => (k === 'tronco' ? Math.min(q, 2) : q));
    si(v.ok && v.juntados === 2 && v.resto && v.resto.n === 3 && p.materiales.tronco === 2, 'con la mochila casi llena entra lo que cabe y el resto queda');
    const v0 = TI.devolverAMochila(p, v.resto, () => 0);
    si(!v0.ok && v0.resto === v.resto && p.materiales.tronco === 2, 'con la mochila llena no entra nada y nada se pierde');
    TI.devolverAMochila(p, v.resto);
    si(p.materiales.tronco === 5, 'después entra lo que faltaba');
  }
  {
    const p = partida();
    const t = TI.sacarDeMochila(p, 'ramita', { todo: true });
    si(t.ok && t.carga.n === 10 && p.ramitas === 0, 'las ramitas, todas');
    p.ramitas = 7;
    const v = TI.devolverAMochila(p, t.carga);
    si(v.juntados === 5 && p.ramitas === 12 && v.resto && v.resto.n === 5, 'las ramitas respetan el tope de doce');
  }

  // ---- 3. la economía: una partida al azar
  {
    let s = 7;
    const azar = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const p = partida(), bultos = [];
    const ids = ['tronco', 'tabla', 'piedra', 'pan-casero', 'frutilla', 'harina', 'yerba', 'hacha', 'pico', 'farol', 'carpa', 'hoz-junco', 'cana', 'linterna', 'ramita'];
    const total = () => {
      let t = (p.ramitas || 0);
      for (const v of Object.values(p.materiales)) t += v;
      for (const e of Object.values(p.entradas)) t += e.cantidad;
      for (const k of ['harina', 'yerba']) t += p.cosas[k] || 0;
      for (const k of ['hacha', 'pico', 'farol', 'manta', 'hoz-junco']) t += p.cosas[k] ? 1 : 0;
      for (const k of ['cana', 'linterna']) t += TI.dejada(p, k) ? 0 : 1;
      for (const b of bultos) t += b.carga.n;
      return t;
    };
    const inicio = total();
    let rota = '';
    for (let i = 0; i < 4000 && !rota; i++) {
      const a = azar();
      if (a < 0.55) {
        const id = ids[Math.floor(azar() * ids.length)];
        const t = TI.sacarDeMochila(p, id, { todo: azar() < 0.3 });
        if (t.ok) { const r = TI.ponerBulto(bultos, t.carga, Math.floor(azar() * 4), 0, Math.floor(azar() * 4)); if (!r.ok) TI.devolverAMochila(p, t.carga); }
      } else if (bultos.length) {
        const j = Math.floor(azar() * bultos.length), b = bultos[j];
        const lleno = azar();
        const r = TI.devolverAMochila(p, b.carga, lleno < 0.2 ? () => 0 : lleno < 0.5 ? (k, q) => Math.floor(q / 2) : null);
        if (r.ok) { if (r.resto) b.carga = r.resto; else bultos.splice(j, 1); }
      }
      if (total() !== inicio) rota = `paso ${i}: ${total()} en vez de ${inicio}`;
      for (const k of ['hacha', 'farol']) if (bultos.some((b) => b.carga.clave === k) && p.cosas[k]) rota = `paso ${i}: ${k} en el suelo y en la mochila a la vez`;
    }
    si(!rota, 'tirar y juntar al azar no duplica ni pierde nada' + (rota ? ` (${rota})` : ''));
  }

  // ---- 4. el suelo
  {
    const bultos = [], p = partida();
    const a = TI.ponerBulto(bultos, TI.sacarDeMochila(p, 'tronco', { nombre: 'Troncos' }).carga, 0, 0, 0);
    const b = TI.ponerBulto(bultos, TI.sacarDeMochila(p, 'tronco', { nombre: 'Troncos' }).carga, 1, 0, 0.5);
    si(a.ok && b.ok && b.fusionado && bultos.length === 1 && bultos[0].carga.n === 2, 'dos bultos iguales cercanos se suman en uno');
    TI.ponerBulto(bultos, TI.sacarDeMochila(p, 'tronco').carga, 6, 0, 0);
    TI.ponerBulto(bultos, TI.sacarDeMochila(p, 'tabla').carga, 0, 0, 0);
    si(bultos.length === 3, 'lo lejano o distinto, aparte');
    si(TI.textoBulto(bultos[0]) === 'Juntar troncos (2)' && TI.textoBulto({ carga: { id: 'hacha', nombre: 'Hacha de mano', n: 1 } }) === 'Juntar hacha de mano', 'el aviso de la E');
    const llenos = [];
    for (let i = 0; i < TI.TOPE_BULTOS; i++) llenos.push({ x: i * 10, y: 0, z: 0, carga: { id: 'tabla', n: 1, partes: { material: 1 } } });
    const r = TI.ponerBulto(llenos, { id: 'piedra', n: 1, partes: { material: 1 } }, 500, 0, 500);
    si(!r.ok && llenos.length === TI.TOPE_BULTOS && r.titulo, 'con el valle lleno de bultos no entra otro (y lo dice)');
    si(TI.ponerBulto(llenos, { id: 'tabla', n: 1, partes: { material: 1 } }, 10.5, 0, 0).ok, 'pero se suma a uno igual cercano');
    si(TI.TOPE_BULTOS <= 64, 'el tope es chico (fps)');
    si(TI.modeloDe({ id: 'tronco' }) === 'tronco' && TI.modeloDe({ id: 'hacha', clave: 'hacha' }) === 'herramienta' && TI.modeloDe({ id: 'cana', base: true }) === 'herramienta' && TI.modeloDe({ id: 'pan-casero', partes: {} }) === 'atado', 'la forma en el suelo');
  }

  // ---- 5. al cargar
  {
    const bueno = [{ x: 3, y: 1.2, z: 4, rot: 1, carga: { id: 'tronco', nombre: 'Troncos', n: 2, partes: { material: 2 } } }, { x: -3, y: 0, z: 4, rot: 0, carga: { id: 'hacha', nombre: 'Hacha', n: 1, clave: 'hacha', valor: 1 } }, { x: 0, y: 0, z: 0, rot: 0, carga: { id: 'cana', nombre: 'Caña', n: 1, base: true } }];
    si(JSON.stringify(TI.sanearBultos(clon(bueno))) === JSON.stringify(bueno), 'lo bueno pasa igual');
    si(TI.sanearBultos(undefined).length === 0 && TI.sanearBultos({}).length === 0, 'una partida vieja: sin bultos');
    const roto = [null, 4, { x: 'a', z: 1, carga: bueno[0].carga }, { x: 9999, z: 0, carga: bueno[0].carga }, { x: 1, z: 1, carga: { id: '__proto__', partes: { material: 1 } } },
      { x: 1, z: 1, carga: { id: 'x', clave: 'llave-molino', valor: 1 } }, { x: 1, z: 1, carga: { id: 'tronco', partes: { material: -3 } } }, { x: 1, z: 1, carga: { id: 'linterna', base: 'si' } }, { x: 1, z: 1, carga: { id: 'pinon', partes: { ramitas: 5 } } }];
    si(TI.sanearBultos(roto).length === 0, 'lo roto se descarta (y lo de la Historia no aparece en el suelo)');
    const muchos = Array.from({ length: 200 }, (_, i) => ({ x: i, z: 0, carga: { id: 'tabla', partes: { material: 1 } } }));
    si(TI.sanearBultos(muchos).length === TI.TOPE_BULTOS, 'nunca más que el tope');
    si(JSON.stringify(TI.sanearDejadas({ cana: true, linterna: 1, hacha: true })) === '{"cana":true}' && JSON.stringify(TI.sanearDejadas(null)) === '{}', 'las dejadas, saneadas');
  }
  return mal;
}

const TI = await import('../src/tirar.js');
const malBase = revisar(TI);
for (const m of malBase) ok(false, m);
ok(malBase.length === 0, 'tirar.js cumple todas sus reglas');

// ---------------------------------------------------------------- 5 (b). el guardado de verdad
{
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 3);
  const g = G.progresoNuevo();
  const bultos = [{ x: 3, y: 1.2, z: 4, rot: 1, carga: { id: 'tronco', nombre: 'Troncos', n: 2, partes: { material: 2 } } }];
  G.guardarProgreso({ ...g, dia: 5, bultos, dejadas: { linterna: true } });
  const c = G.cargarProgreso();
  ok(JSON.stringify(c.bultos) === JSON.stringify(bultos) && c.dejadas.linterna === true, 'los bultos y lo dejado sobreviven a guardar y cargar');
  const viejo = { ...g, dia: 5 }; delete viejo.bultos; delete viejo.dejadas;
  G.guardarProgreso(viejo);
  const cv = G.cargarProgreso();
  ok(Array.isArray(cv.bultos) && cv.bultos.length === 0 && cv.dejadas && Object.keys(cv.dejadas).length === 0, 'una partida vieja sin el campo carga sin bultos y con todo encima');
  const m = await import('../src/mochila.js');
  const ids = (p) => m.armarMochila({ ...g, ...p }, {}).map((r) => r.id);
  ok(ids({}).includes('cana') && ids({}).includes('linterna'), 'la barra tiene la caña y la linterna');
  ok(!ids({ dejadas: { cana: true, linterna: true } }).includes('cana') && !ids({ dejadas: { cana: true, linterna: true } }).includes('linterna'), 'tiradas, no están en la barra');
  ok(ids({ dejadas: { linterna: true }, cosas: { farol: true } }).includes('farol'), 'el farol no depende de la linterna');
}

// ---------------------------------------------------------------- 6. el enganche en main.js
const MAIN = leer('src/main.js');
function revisarMain(fuente) {
  const mal = [];
  const si = (c, t) => { if (!c) mal.push(t); };
  const mundo = (sobre = {}) => {
    const notas = [], bultos = [];
    const progreso = { modo: 'relax', dia: 3, horas: 9, ramitas: 4, materiales: { tronco: 5 }, entradas: { pinon: { cantidad: 3 } }, cosas: { hacha: 1, 'llave-molino': 1 } };
    const js = { pos: { x: 0, y: 0, z: 0 }, yaw: 0 };
    const env = {
      ranuras: [], elegida: 0, jugador: { estado: js }, progreso, durmiendo: false, escenasMundo: { activa: () => false }, LIMITE: 468,
      T: { agua: () => false, altura: () => 0 }, col: { paredEntre: () => false }, alturaDePie: () => 0.25,
      objetos: { soltar: () => true, tirarBulto: (c, x, y, z) => { const r = TI.ponerBulto(bultos, c, x, y, z); return r; } },
      nota: (a, b) => notas.push([a, b]), sonido: { paso() {} }, refrescarBarra() {}, guardar() {}, enMano: null,
      pesca: { est: { equipada: false }, equipar(v) { this.est.equipada = v; } }, linterna: { intensity: 45 },
      motivoParaNoTirar: TI.motivoParaNoTirar, sacarDeMochila: TI.sacarDeMochila, devolverAMochila: TI.devolverAMochila,
      enLasCargas: () => false, puestoCargas: null,   // 4.26.5: tirar con el puesto de cargas abierto redibuja el panel (el mundo de mentira no lo tiene abierto)
      ...sobre,
    };
    return { env, notas, bultos, progreso, js };
  };
  const correr = (w, ranura, todo) => { w.env.ranuras = [ranura]; funcion(fuente, 'soltarRanura', w.env)(todo); };
  {
    const w = mundo();
    correr(w, { id: 'tronco', nombre: 'Troncos' });
    si(w.progreso.materiales.tronco === 4 && w.bultos.length === 1 && w.bultos[0].carga.n === 1 && w.bultos[0].y === 0.25, 'V con un tronco: uno al suelo, a la altura del piso');
    correr(w, { id: 'tronco', nombre: 'Troncos' }, true);
    si(w.progreso.materiales.tronco === 0 && w.bultos.length === 1 && w.bultos[0].carga.n === 5, 'Mayús + V: el resto, en el mismo bulto');
  }
  {
    const w = mundo();
    correr(w, { id: 'pinon', nombre: 'Piñones' });
    si(w.progreso.entradas.pinon.cantidad === 2 && w.bultos.length === 0, 'lo del suelo cae de a uno con su forma (como antes)');
    correr(w, { id: 'pinon', nombre: 'Piñones' }, true);
    si(w.progreso.entradas.pinon.cantidad === 0 && w.bultos.length === 1 && w.bultos[0].carga.n === 2, 'con Mayús, lo del suelo va en un bulto');
  }
  {
    const w = mundo();
    correr(w, { id: 'llave-molino', nombre: 'Llave del molino viejo' });
    si(w.progreso.cosas['llave-molino'] === 1 && w.bultos.length === 0 && /Historia/.test(w.notas[0]?.[1] || ''), 'lo de la Historia no se suelta y lo dice');
  }
  for (const [que, sobre, js] of [['en una escena', { escenasMundo: { activa: () => true } }], ['dormido', { durmiendo: true }], ['colgado del cable', {}, { enCable: true }], ['en el tren', {}, { enTren: true }], ['en el kayak', {}, { enKayak: true }], ['nadando', {}, { nadando: true }],
    ['con agua adelante', { T: { agua: () => true, altura: () => 0 } }], ['con una pared adelante', { col: { paredEntre: () => true } }]]) {
    const w = mundo(sobre);
    Object.assign(w.js, js || {});
    correr(w, { id: 'tronco', nombre: 'Troncos' });
    si(w.progreso.materiales.tronco === 5 && w.bultos.length === 0, `no se tira ${que}`);
  }
  {
    const w = mundo({ objetos: { soltar: () => true, tirarBulto: () => ({ ok: false, titulo: 'Ya hay muchas cosas tiradas', texto: 'x' }) } });
    correr(w, { id: 'hacha', nombre: 'Hacha de mano' });
    si(w.progreso.cosas.hacha === 1 && w.notas.some((x) => x[0] === 'Ya hay muchas cosas tiradas'), 'sin lugar en el valle, vuelve a la mochila (nada se pierde)');
  }
  {
    const w = mundo();
    w.env.pesca.est.equipada = true;
    correr(w, { id: 'cana', nombre: 'Caña de pescar', accion: 'cana' });
    si(TI.dejada(w.progreso, 'cana') && !w.env.pesca.est.equipada, 'tirar la caña la guarda de la mano');
    correr(w, { id: 'linterna', nombre: 'Linterna', accion: 'luz' });
    si(TI.dejada(w.progreso, 'linterna') && w.env.linterna.intensity === 0, 'tirar la linterna la apaga');
  }
  {
    // la E: un bulto no cuenta como algo juntado del valle (los frutos de Inés) y se guarda
    const llamados = [];
    const env = { objetos: { usar: () => ({ bulto: { id: 'pinon', nombre: 'Piñones', juntados: 2, quedan: 0 } }) }, objetivo: { tipo: 'bulto' }, jugador: { estado: {} }, registrar() {}, sonido: {},
      amorJuego: { alJuntar: () => llamados.push('amor') }, destellarRanura: () => llamados.push('destello'), nota: () => llamados.push('nota'), guardar: () => llamados.push('guardar'), enMano: null, ranuras: [], elegida: 0, dormir: () => llamados.push('dormir') };
    funcion(fuente, 'usarObjetivo', env)();
    si(!llamados.includes('amor') && llamados.includes('guardar') && llamados.includes('destello'), 'juntar un bulto no cuenta como juntar del valle, destella la casilla y guarda');
  }
  si(/case 'KeyV': soltarRanura\(e\.shiftKey\)/.test(fuente), 'Mayús + V tira la pila');
  si(/case 'KeyQ':[\s\S]{0,200}dejada\(progreso, 'cana'\)/.test(fuente) && /case 'KeyL':[\s\S]{0,200}dejada\(progreso, 'linterna'\)/.test(fuente), 'sin la caña o la linterna, Q y L no andan');
  si(fuente.includes('objetos.ponerLugar((k, n) => lugarEn(k, n));'), 'el límite de la mochila llega a los bultos');
  return mal;
}
const malMain = revisarMain(MAIN);
for (const m of malMain) ok(false, m);

// lo que no se puede correr en Node: objetos.js y el guardado
{
  const OB = leer('src/objetos.js');
  ok(OB.includes("probar({ tipo: 'bulto', b, texto: textoBulto(b) }") && OB.includes('const r = devolverAMochila(progreso, obj.b.carga, lugarMochila);') && OB.includes('tirarBulto, bultos: () => progreso.bultos'), 'objetos.js: la E encuentra el bulto, lo devuelve con el límite y se puede tirar');
  ok(/new THREE\.InstancedMesh\(geo\(\), mat, TOPE_BULTOS\)/.test(OB) && OB.includes('im.receiveShadow = true;') && !/castShadow/.test(OB.slice(OB.indexOf('4.25.2: los bultos'), OB.indexOf('// grilla de búsqueda'))), 'objetos.js: una malla fija por forma (no crece) y sin sombra propia');
  ok(leer('src/guardado.js').includes('bultos: sanearBultos(p.bultos, LIMITE), dejadas: sanearDejadas(p.dejadas),'), 'guardado.js: los bultos se sanean al cargar');
  ok(/<kbd>Mayús<\/kbd> \+ <kbd>V<\/kbd><\/dt><dd>tirar la pila entera/.test(leer('src/plantilla.html')), 'la guía de teclas dice Mayús + V');
}

// ---------------------------------------------------------------- 7. mutaciones
{
  const src = leer('src/tirar.js');
  const MUT = [
    ['la Historia se suelta', "if (HISTORIA.has(id)) return { titulo", "if (false) return { titulo"],
    ['la cámara se suelta', "if (id === 'camara') return", "if (false) return"],
    ['en el Desafío se suelta todo', "if (progreso?.modo === 'desafio') return", "if (false) return"],
    ['la carpa armada se suelta', "if (id === 'carpa' && progreso?.carpa) return", "if (false) return"],
    ['Mayús + V saca uno solo', 'let falta = todo ? total : 1;', 'let falta = 1;'],
    ['la entrada del cuaderno se borra', "else if (k === 'entrada') progreso.entradas[id].cantidad = hay[k] - q;", "else if (k === 'entrada') { if (hay[k] - q <= 0) delete progreso.entradas[id]; else progreso.entradas[id].cantidad = hay[k] - q; }"],
    ['una herramienta se junta aunque tengas otra (duplica)', "if (ya === true || entero(ya) > 0) return", "if (false) return"],
    ['la caña se junta dos veces (duplica)', 'if (!dejada(progreso, carga.id)) return', 'if (false) return'],
    ['se ignora el límite de la mochila', "else if (typeof lugar === 'function') entra", "else if (false) entra"],
    ['las ramitas pasan de doce', ["if (carga.id === 'ramita') entra = Math.min(total, Math.max(0, 12 - entero(progreso.ramitas)));", "if (k === 'ramitas') q = Math.min(q, Math.max(0, 12 - entero(progreso.ramitas)));"], ['', '']],
    ['los bultos iguales no se suman', 'if (carga.partes) {\n    let mejor', 'if (false) {\n    let mejor'],
    ['sin tope de bultos', 'if (bultos.length >= TOPE_BULTOS) return', 'if (false) return'],
    ['al cargar, lo de la Historia aparece en el suelo', ' || HISTORIA.has(c.clave)) return null;', ') return null;'],
    ['al cargar, sin tope', 'if (r.length >= TOPE_BULTOS) break;', ''],
    ['lo que no entra se pierde', "const resto = suma(quedan) > 0 ? { ...carga, n: suma(quedan), partes: quedan } : null;", 'const resto = null;'],
  ];
  let atrapadas = 0; const vivas = [], copias = [];
  try {
    for (let i = 0; i < MUT.length; i++) {
      const [nombre, de, a] = MUT[i];
      const des = Array.isArray(de) ? de : [de], as = Array.isArray(a) ? a : [a];
      let t = src, aplicable = true;
      des.forEach((d, j) => { if (t.split(d).length !== 2) aplicable = false; else t = t.replace(d, () => as[j]); });
      if (!aplicable) { vivas.push(nombre + ' (el fragmento no está una sola vez)'); continue; }
      const arch = join(raiz, 'src', `tirar.mut${i}.js`);
      copias.push(arch); writeFileSync(arch, t);
      let mal;
      try { mal = revisar(await import(pathToFileURL(arch).href + '?m=' + i)); } catch (e) { mal = ['(la copia no carga) ' + e.message]; }
      if (mal.length) atrapadas++; else vivas.push(nombre);
    }
  } finally { for (const c of copias) { try { unlinkSync(c); } catch { /* ya no está */ } } }
  ok(atrapadas === MUT.length, `mutaciones de tirar.js: ${atrapadas} de ${MUT.length} atrapadas${vivas.length ? ' · SOBREVIVEN: ' + vivas.join(' | ') : ''}`);

  const MUTM = [
    ['se tira en una escena', 'if (js.enCable || durmiendo || escenasMundo?.activa()) return;', 'if (js.enCable || durmiendo) return;'],
    ['se tira dormido', 'if (js.enCable || durmiendo || escenasMundo?.activa()) return;', 'if (js.enCable || escenasMundo?.activa()) return;'],
    ['sin lugar en el valle se pierde', 'if (!puesto.ok) { devolverAMochila(progreso, t.carga); nota(', 'if (!puesto.ok) { nota('],
    ['Mayús + V no llega', 'const t = sacarDeMochila(progreso, r.id, { todo, nombre: r.nombre });', 'const t = sacarDeMochila(progreso, r.id, { nombre: r.nombre });'],
    ['la pared no frena', ' || col?.paredEntre?.(js.pos.x, js.pos.z, x, z, js.pos.y + 0.5)) {', ') {'],
    ['un bulto cuenta como fruto juntado', '  if (r?.bulto) { destellarRanura(r.bulto.id);', '  if (r?.bulto) { amorJuego?.alJuntar(r.bulto.id); destellarRanura(r.bulto.id);'],
  ];
  let atrapadasM = 0; const vivasM = [];
  for (const [nombre, de, a] of MUTM) {
    if (MAIN.split(de).length !== 2) { vivasM.push(nombre + ' (el fragmento no está una sola vez)'); continue; }
    let mal;
    try { mal = revisarMain(MAIN.replace(de, () => a)); } catch (e) { mal = [e.message]; }
    if (mal.length) atrapadasM++; else vivasM.push(nombre);
  }
  ok(atrapadasM === MUTM.length, `mutaciones de main.js (en memoria): ${atrapadasM} de ${MUTM.length} atrapadas${vivasM.length ? ' · SOBREVIVEN: ' + vivasM.join(' | ') : ''}`);
}

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.2 tirar casi todo con V · ${n} comprobaciones`);
process.exit(fallas ? 1 : 0);
