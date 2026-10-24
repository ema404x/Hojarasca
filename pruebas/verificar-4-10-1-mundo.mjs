// 4.10.1 (mundo): arreglos de la ronda de bugs «zona A» (mochila con casillas, puestos de ruta, recursos de zona, tablón y gente del
// campo) y «zona E» (consola de códigos). Cada uno EJECUTA el comportamiento (con los módulos reales y un mundo de mentira):
//   1. el depósito de un puesto de ruta se vacía con Supr aunque lleves material encima;
//   2. Nicanor y Fermín no rechazan «No te entra» al vender mosca, botas o tijera (no ocupan casilla);
//   3. la feria rechaza antes de cambiar si lo que da como «cuenta» (semillas, harina) no entra;
//   4. los rincones (huerta de todos, de los chicos, taller) no gastan ni vacían si lo que dan no entra;
//   5. «Sacar 1 lote» de la consigna del banco pregunta por el lote entero;
//   6. el cuchillo de cuero tiene un uso: con él, el cuero de Fermín rinde uno más;
//   7. el silo guarda las frutillas del cantero (clave «frutilla»);
//   8. el tablón no rebaraja los tres papeles al cambiar la estación; 9. el tablón abierto cuenta como panel del HUD;
//   10. el cristal del Relax tiene ranura en la mochila; 11. el diario no dice que te quedaste la trucha si la mochila estaba llena;
//   12. nada religioso en la historia de Tobías; 13. los nombres del tablón son los del resto del juego;
//   E1. la consola respeta las casillas; E8. «hora» y «dia» no cuentan como irse antes de un turno; E9. «historia» deja el tipo de partida.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const R = await import('../src/puestos-ruta.js');
const C = await import('../src/comercio.js');
const E = await import('../src/economia.js');
const CA = await import('../src/carga.js');
const AL = await import('../src/almacen.js');
const GC = await import('../src/gente-campo.js');
const TB = await import('../src/tablon.js');
const RC = await import('../src/rincones.js');
const FE = await import('../src/feria.js');
const G = await import('../src/guardado.js');
const { crearPuestosRutaJuego } = await import('../src/puestos-ruta-juego.js');
const { crearGenteCampoJuego } = await import('../src/gente-campo-juego.js');
const { crearRinconesJuego } = await import('../src/rincones-juego.js');
const { crearBancoMundo } = await import('../src/banco-mundo.js');
const { armarMochila } = await import('../src/mochila.js');
const { crearEmpleoJuego } = await import('../src/empleo-juego.js');
const EM = await import('../src/empleo.js');
const T = await import('../src/trucos.js');
const N = await import('../src/negocios.js');
const PR = await import('../src/propiedad.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const relax = (x = {}) => ({ modo: 'relax', dia: 5, horas: 12, economia: { ...E.economiaNueva(), pesos: 20000 }, comercio: C.comercioNuevo(), materiales: {}, entradas: {}, cosas: {}, ...x });
const ent = (c) => ({ dia: 1, hora: 9, cantidad: c });
const usadas = (p) => CA.ocupacion(p).usadas;
// (como los de main.js: cabeTrato y cabeJuntar avisan cuando no entra)
const cargaCtx = (p, notas = []) => ({
  cabeTrato: (da, q) => { const r = CA.tratoCabe(p, da, q || {}); if (!r.ok) notas.push(['No te entra', '']); return r.ok; },
  cabeJuntar: (k, c) => { const r = CA.lugarPara(p, k, c) >= c; if (!r) notas.push(['Mochila llena', '']); return r; },
  lugarEn: (k, c) => CA.lugarPara(p, k, c),
});

// ---------------------------------------------------------------- 1. el depósito de un puesto de ruta: Supr saca todo
{
  const p = relax({ materiales: { tabla: 12, piedra: 12 } });
  for (let i = 0; i < 3; i++) R.repararEtapa(p, 'A', p.materiales);
  ok(R.reparado(p, 'A'), 'el puesto A quedó reparado');
  const notas = [];
  const J = crearPuestosRutaJuego({ progreso: () => p, desafio: () => false, mundo: { refrescar() {} }, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescarBarra() {}, horas: () => 12, ...cargaCtx(p) });
  const dep = R.puntoDe('A', 'deposito'), js = { pos: { x: dep.x, y: 0, z: dep.z } };
  // depósito con 40 tablas y 20 piedras; vos con 5 troncos encima
  p.materiales = { tronco: 5 };
  R.guardarEnPuesto(p, 'A', { tabla: 40, piedra: 20 });
  const a = J.accion(js);
  ok(a?.tipo === 'deposito' && /Supr: sacar/.test(a.texto), `con material encima el aviso dice que Supr saca («${a?.texto}»)`);
  a.hacer();
  ok(R.enDeposito(p, 'A', 'tronco') === 5 && !p.materiales.tronco, 'la E, con material encima, sigue guardando (como antes)');
  p.materiales = { tronco: 3 };
  ok(J.sacarTodoCerca(js) === true, 'Supr junto al alero responde');
  ok(!R.hayEnDeposito(p, 'A') && p.materiales.tronco === 3 + 5 && p.materiales.tabla === 40 && p.materiales.piedra === 20 && notas.at(-1)[0] === 'Sacaste todo del depósito del puesto', `Supr lo vació aunque llevaras troncos (${JSON.stringify(p.materiales)})`);
  // lleno + material encima: antes no había forma de soltar nada
  p.materiales = { tronco: 5 };
  R.guardarEnPuesto(p, 'A', { tronco: 40, tabla: 30 });
  p.materiales = { tronco: 5 };
  J.accion(js).hacer();
  ok(/Supr saca todo/.test(notas.at(-1)[1]) && notas.at(-1)[0] === 'El depósito del puesto está lleno', 'lleno y con troncos encima: el aviso manda a Supr');
  ok(J.sacarTodoCerca(js) && p.materiales.tronco === 5 + 40 && p.materiales.tabla === 30, 'y Supr lo vacía');
  // sólo lo que entra en la mochila
  const q = relax({ materiales: { piedra: 230 } });   // 23 casillas
  for (let i = 0; i < 3; i++) R.repararEtapa(q, 'A', { tabla: 99, piedra: 99 });
  q.materiales = { piedra: 230 };
  R.guardarEnPuesto(q, 'A', { tronco: 40 });
  const Jq = crearPuestosRutaJuego({ progreso: () => q, desafio: () => false, mundo: { refrescar() {} }, nota() {}, guardar() {}, refrescarBarra() {}, horas: () => 12, ...cargaCtx(q) });
  Jq.sacarTodoCerca(js);
  ok(q.materiales.tronco === 10 && R.enDeposito(q, 'A', 'tronco') === 30 && usadas(q) === 24, 'con la mochila casi llena sale sólo lo que entra (10 troncos = 1 casilla) y el resto queda en el puesto');
  // lejos del alero, abandonado o adentro: no hace nada (Supr sigue con lo suyo)
  ok(J.sacarTodoCerca({ pos: { x: dep.x + 30, y: 0, z: dep.z } }) === false, 'lejos del depósito: nada');
  const ab = relax();
  const Jb = crearPuestosRutaJuego({ progreso: () => ab, desafio: () => false, mundo: { refrescar() {} }, nota() {}, guardar() {}, refrescarBarra() {}, horas: () => 12 });
  const depB = R.puntoDe('B', 'deposito');
  ok(Jb.sacarTodoCerca({ pos: { x: depB.x, y: 0, z: depB.z } }) === false, 'en un puesto abandonado: nada');
  const Jd = crearPuestosRutaJuego({ progreso: () => p, desafio: () => true, mundo: { refrescar() {} }, nota() {}, guardar() {}, refrescarBarra() {} });
  ok(Jd.sacarTodoCerca(js) === false, 'en el Desafío: nada');
  ok(enUnaLinea(main, ['puestosJuego?.sacarTodoCerca(js)', '!desafio']), 'main.js: Supr junto a un depósito de puesto llama a sacarTodoCerca');
}

// ---------------------------------------------------------------- 2. gente del campo: mosca, botas y tijera no ocupan casilla
{
  const p = relax({ materiales: { piedra: 240 }, genteCampo: GC.genteCampoNueva() });   // 24/24
  ok(usadas(p) === 24, 'mochila 24/24');
  const notas = [], herr = [];
  const darle = (efs) => { for (const f of efs) { if (f.tipo === 'material') p.materiales[f.k] = (p.materiales[f.k] || 0) + f.n; else if (f.tipo === 'cosa') p.cosas[f.k] = (p.cosas[f.k] || 0) + f.n; else { p.entradas[f.k] = p.entradas[f.k] || ent(0); p.entradas[f.k].cantidad += f.n; } } };
  const cj = crearGenteCampoJuego({
    progreso: () => p, desafio: () => false, dia: () => p.dia, horas: () => 10, lluvia: () => 0, existe: () => true,
    cantidad: (d, k) => (d === 'material' ? p.materiales[k] || 0 : d === 'cosa' ? p.cosas[k] || 0 : p.entradas[k]?.cantidad || 0), aplicar: darle,
    tiene: (k) => (p.cosas[k] || 0) > 0, nivel: () => 0,
    pagar: (m) => { if (p.economia.pesos < m) return false; p.economia.pesos -= m; return true; }, cobrar() {},
    darHerramienta: (id) => { herr.push(id); p.cosas[id] = 1; return true; }, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescarBarra() {},
    cabeTrato: (da) => CA.tratoCabe(p, da, {}).ok,
  });
  const nic = cj.sesion({ clave: 'nicanor' }) || { clave: 'nicanor' };
  const sNic = { clave: 'nicanor' }, sFer = { clave: 'fermin' };
  cj.sesion({ clave: 'fermin' });
  const dice = (r) => JSON.stringify(r.renglones || r);
  let r = cj.elegir(sNic, 'campo:comprar:mosca');
  ok(p.cosas.mosca === 1 && !/No te entra/.test(dice(r)) && p.economia.pesos === 20000 - 700, 'Nicanor vende la mosca con la mochila llena (no ocupa casilla)');
  r = cj.elegir(sNic, 'campo:comprar:botas');
  ok(p.cosas.botas === 1 && !/No te entra/.test(dice(r)), 'y las botas');
  r = cj.elegir(sFer, 'campo:comprar:tijera');
  ok(p.cosas.tijera === 1 && !/No te entra/.test(dice(r)), 'Fermín vende la tijera');
  // lo que sí ocupa casilla sigue rechazándose
  const antes = p.economia.pesos;
  r = cj.elegir(sFer, 'campo:comprar:lana');
  ok(/No te entra/.test(dice(r)) && p.economia.pesos === antes && !p.materiales.lana, 'la lana, que ocupa casilla, sigue rechazada con la mochila llena y sin cobrar');
  r = cj.elegir(sNic, 'campo:comprar:truchas');
  ok(/No te entra/.test(dice(r)), 'y las truchas');
  ok(enUnaLinea(leer('src/gente-campo-juego.js'), ['tratoDeEfectos(', "'herramienta'", "'dato'"]), 'el chequeo sale de tratoDeEfectos (filtra lo que no ocupa casilla)');
}

// ---------------------------------------------------------------- 3. feria: lo que da como «cuenta» tiene que entrar
{
  const oferta = FE.OFERTAS.find((o) => o.id === 'frutillas-semilla');
  const mk = (p) => {
    const hechos = { notas: [], cambios: 0 };
    const f = { tomadas: [] };
    const entorno = {
      marcarEn() {}, ofertasDelDia: () => [oferta], progreso: p, feria: () => f, cambiarEnFeria: FE.cambiarEnFeria, cuantoFeria: (k) => (k === 'frutilla' ? p.entradas.frutilla?.cantidad || 0 : 0),
      gastarFeria: (k, c) => { p.entradas[k].cantidad -= c; hechos.cambios++; }, sumarMaterial: (k, c) => { p.materiales[k] = (p.materiales[k] || 0) + c; }, cobrarPesos() {}, sonido: { juntar() {} }, diario: { anotar() {} },
      nota: (t, s) => hechos.notas.push([t, s]), refrescarBarra() {}, guardar() {}, dibujarFeria() {}, textoOferta: () => ({ da: 'x', pide: 'y' }),
      cabeTrato: (da, q) => { const r = CA.tratoCabe(p, da, q || {}); if (!r.ok) hechos.notas.push(['No te entra']); return r.ok; },
    };
    return { cambiar: funcion(main, 'cambiarFeria', entorno), hechos };
  };
  // 23 casillas de piedra + frutillas 12/50 (una casilla): 24/24; las semillas de papa necesitan una casilla más
  const p = relax({ materiales: { piedra: 230 }, entradas: { frutilla: ent(12) } });
  ok(usadas(p) === 24, 'mochila 24/24');
  const t = mk(p);
  t.cambiar(0);
  ok(!p.cosas['semillas-papa'] && p.entradas.frutilla.cantidad === 12 && t.hechos.notas.at(-1)[0] === 'No te entra' && !t.hechos.cambios && usadas(p) === 24, 'mochila llena: la feria no cambia, no gasta las frutillas y no deja sobrecarga');
  // con lugar, cambia
  const p2 = relax({ materiales: { piedra: 100 }, entradas: { frutilla: ent(12) } });
  const t2 = mk(p2); t2.cambiar(0);
  ok(p2.cosas['semillas-papa'] === 3 && p2.entradas.frutilla.cantidad === 6, 'con lugar, cambia como siempre');
  // y gastar lo que das libera la casilla de las frutillas: 6 frutillas de 6 => deja la casilla: entra
  const p3 = relax({ materiales: { piedra: 230 }, entradas: { frutilla: ent(6) } });
  const t3 = mk(p3); t3.cambiar(0);
  ok(p3.cosas['semillas-papa'] === 3 && !p3.entradas.frutilla.cantidad, 'si lo que dás libera la casilla, el cambio entra (se descuenta lo que sale)');
}

// ---------------------------------------------------------------- 4. rincones: la cosecha y las manualidades no se entregan sin lugar
{
  const hacer = (p, extra = {}) => {
    const notas = [];
    const j = crearRinconesJuego({
      progreso: () => p, ajustes: () => ({}), desafio: () => false, mundo: { potrero: () => null, refrescar() {} }, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescarBarra() {}, registrar() {},
      sumarEntrada: (k, c) => { p.entradas[k] = p.entradas[k] || ent(0); p.entradas[k].cantidad += c; }, sumarMaterial: (k, c) => { p.materiales[k] = (p.materiales[k] || 0) + c; },
      sumarCosa: (k, c) => { p.cosas[k] = Math.max(0, (Number(p.cosas[k]) || 0) + c); },
      cantidad: (tipo, k) => (tipo === 'material' ? p.materiales[k] || 0 : tipo === 'cosa' ? Number(p.cosas[k]) || 0 : p.entradas[k]?.cantidad || 0),
      refrescarHuerta() {}, ...cargaCtx(p, notas), ...extra,
    });
    return { j, notas };
  };
  const huertas = () => ({ comunitaria: [{ x: 0, z: 0, i: 0 }], chicos: [{ x: 10, z: 0, i: 0 }, { x: 12, z: 0, i: 1 }] });
  const mundo = { huertas, taller: () => ({ x: 20, y: 0, z: 0 }), lugar: () => null, duendes: () => [], potrero: () => null, refrescar() {}, matas() {} };
  const jsEn = (x) => ({ pos: { x, y: 0, z: 0 } });
  const armar = (p) => { p.rincones = G.progresoNuevo().rincones; return hacer(p, { mundo }); };
  // la huerta de todos, con las papas en 50/50 y 23 casillas de piedra (24/24): la cosecha no entra
  {
    const p = relax({ materiales: { piedra: 230 }, entradas: { papa: ent(50) }, dia: 30 });
    const { j, notas } = armar(p);
    RC.trabajarCantero(p.rincones, 'huerta', 0, 5);   // sembrado el día 5: ya está listo
    ok(RC.estadoCantero(p.rincones, 'huerta', 0, p.dia).estado === 'listo', 'el cantero de papas está listo para cosechar');
    ok(usadas(p) === 24, 'mochila 24/24');
    const a = j.accion(jsEn(0));
    ok(a?.tipo === 'cantero' && /Cosechar/.test(a.texto), `E ofrece cosechar («${a?.texto}»)`);
    a.hacer();
    ok(RC.estadoCantero(p.rincones, 'huerta', 0, p.dia).estado === 'listo' && p.entradas.papa.cantidad === 50 && usadas(p) === 24 && /No te entra/.test(notas.at(-1)[0]), 'sin lugar: el cantero NO se cosecha, la cosecha espera y no hay sobrecarga');
    p.entradas.papa.cantidad = 10;   // se hace lugar
    j.accion(jsEn(0)).hacer();
    ok(RC.estadoCantero(p.rincones, 'huerta', 0, p.dia).estado !== 'listo' && p.entradas.papa.cantidad === 13, 'con lugar, cosecha como siempre (3 papas)');
  }
  // la huerta de los chicos (frutillas: 1 por cosecha) con las frutillas en 50/50
  {
    const p = relax({ materiales: { piedra: 230 }, entradas: { frutilla: ent(50) }, dia: 30, horas: 15 });
    const { j, notas } = armar(p);
    RC.trabajarCantero(p.rincones, 'chicos', 0, 5);
    j.accion(jsEn(10)).hacer();
    ok(RC.estadoCantero(p.rincones, 'chicos', 0, p.dia).estado === 'listo' && p.entradas.frutilla.cantidad === 50 && /No te entra/.test(notas.at(-1)[0]), 'la huerta de los chicos tampoco se vacía sin lugar');
  }
  // el taller: cepillar tablas (1 tronco -> 3 tablas) con las tablas en 20/20
  {
    const p = relax({ materiales: { piedra: 220, tabla: 20, tronco: 10 }, dia: 30, horas: 11 });   // 22 + 1 + 1 = 24/24
    ok(usadas(p) === 24, 'mochila 24/24 con diez troncos y las tablas llenas');
    const { j, notas } = armar(p);
    p.rincones.oficios.tablas = 1;
    const a = j.accion(jsEn(20));
    ok(a?.tipo === 'taller' && /Cepillar tablas/.test(a.texto), `el taller ofrece cepillar tablas («${a?.texto}»)`);
    a.hacer();
    ok(p.materiales.tronco === 10 && p.materiales.tabla === 20 && !p.rincones.hechos?.tablas && /No te entra/.test(notas.at(-1)[0]), 'sin lugar para las tablas: no gasta el tronco ni anota la manualidad del día');
    p.materiales.piedra = 100;   // se hace lugar
    j.accion(jsEn(20)).hacer();
    ok(p.materiales.tronco === 9 && p.materiales.tabla === 23 && p.rincones.hechos.tablas.n === 1, 'con lugar, la hace como siempre');
  }
  ok(enUnaLinea(main, ['sumarMaterial: (k, n) => sumarMaterial(k, n)', '...CARGA_CTX', '4.10.1']), 'main.js le pasa CARGA_CTX al módulo de rincones');
}

// ---------------------------------------------------------------- 5. la consigna del banco entrega el lote entero sólo si entra
{
  const mk = (tag) => {
    const el = {
      tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
      get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
      set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
      append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); },
      addEventListener(ev, fn) { this.listeners[ev] = fn; },
      classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c) },
    };
    return el;
  };
  globalThis.document = { createElement: mk };
  const todos = (el, f = []) => { f.push(el); for (const c of el.children) todos(c, f); return f; };
  const clic = (m, texto) => { const b = todos(m.contenido).filter((x) => x.tag === 'button').find((x) => x.textContent.includes(texto) && !x.disabled); assert.ok(b, `hay botón «${texto}»`); b.listeners.click(); n++; };
  const p = relax({ dia: 5, horas: 12 });
  p.economia.pesos = 20000;
  PR.comprarPuesto(p, 5);
  const lote = C.BIENES.tabla.lote;
  ok(lote >= 2, `el lote de tablas es de ${lote}`);
  // 23 casillas de piedra y 19 tablas (la última casilla): entra 1 tabla pero no el lote entero
  p.materiales = { piedra: 230, tabla: 19 };
  N.negociosDe(p).casas.puesto.stock.tabla = 1;
  ok(usadas(p) === 24 && CA.lugarPara(p, 'tabla', 1) === 1 && CA.lugarPara(p, 'tabla', lote) < lote, 'con 19 tablas entra 1 pero no el lote entero');
  const notas = [];
  const contenido = mk('div'), panel = mk('section'); panel.classList.add('oculto');
  const m = crearBancoMundo({ panel, contenido, progreso: () => p, dia: () => p.dia, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescar() {}, T_: (t) => t, sonido: null, ...cargaCtx(p) });
  m.contenido = contenido; m.abrir();
  clic(m, 'Mi puesto');
  clic(m, 'Sacar 1 lote');
  ok(PR.lotesEnPuesto(p, 'tabla') === 1 && p.materiales.tabla === 19 && usadas(p) === 24, 'sin lugar para el lote entero: sigue en consigna y la mochila no pasa de 24');
  p.materiales.piedra = 100; m.dibujar();
  clic(m, 'Sacar 1 lote');
  ok(PR.lotesEnPuesto(p, 'tabla') === 0 && p.materiales.tabla === 19 + lote, 'con lugar, sale el lote entero');
  delete globalThis.document;
}

// ---------------------------------------------------------------- 6. el cuchillo de cuero sirve: el cuero de Fermín rinde uno más
{
  const sin = GC.tiendaDe(GC.genteCampoNueva(), 'fermin', 5, { existe: () => true, tiene: () => false }).find((c) => c.id === 'cuero');
  const con = GC.tiendaDe(GC.genteCampoNueva(), 'fermin', 5, { existe: () => true, tiene: (k) => k === 'cuchillo-cuero' }).find((c) => c.id === 'cuero');
  ok(sin.n === 1 && sin.precio === 750 && con.n === 2 && con.precio === 750, 'sin el cuchillo, un cuero; con el cuchillo, dos por el mismo precio');
  ok(/cuchillo/.test(con.titulo) && !/cuchillo/.test(sin.titulo), 'el submenú lo dice');
  const comprar = (cosas) => {
    const p = relax({ genteCampo: GC.genteCampoNueva(), cosas });
    const cj = crearGenteCampoJuego({
      progreso: () => p, desafio: () => false, dia: () => p.dia, horas: () => 10, lluvia: () => 0, existe: () => true,
      cantidad: () => 0, aplicar: (efs) => { for (const f of efs) p.materiales[f.k] = (p.materiales[f.k] || 0) + f.n; },
      tiene: (k) => (p.cosas[k] || 0) > 0, nivel: () => 0, pagar: (m2) => { p.economia.pesos -= m2; return true; }, cobrar() {}, nota() {}, guardar() {}, refrescarBarra() {}, ...cargaCtx(p),
    });
    cj.sesion({ clave: 'fermin' });
    cj.elegir({ clave: 'fermin' }, 'campo:comprar:cuero');
    return p;
  };
  const a = comprar({ 'cuchillo-cuero': 1 });
  ok(a.materiales.cuero === 2 && a.economia.pesos === 20000 - 750, 'comprar con el cuchillo: 2 cueros por $750');
  ok(comprar({}).materiales.cuero === 1, 'sin el cuchillo, sigue siendo uno (nada se quitó)');
  ok(/rinde uno más/.test(leer('src/recursos-zona.js')), 'el texto de la herramienta dice para qué sirve');
}

// ---------------------------------------------------------------- 7. el silo guarda las frutillas del cantero
{
  ok(AL.ALMACENES.silo.guarda.includes('frutilla') && !AL.ALMACENES.silo.guarda.includes('frutilla-huerta'), 'el silo guarda «frutilla» (la clave de la mochila)');
  const a = { n: 0, g: {} };
  ok(AL.libreDe('silo', a, 'frutilla') > 0, 'hay lugar para frutillas');
  AL.guardar('silo', a, 'frutilla', 10);
  eq(a.g, { frutilla: 10 }, 'guardó 10 frutillas');
  eq(AL.sanearAlmacen({ n: 0, g: { 'frutilla-huerta': 7, haba: 2 } }, 'silo'), { n: 0, g: { frutilla: 7, haba: 2 } }, 'un silo guardado con la clave vieja no pierde las frutillas');
  eq(AL.sanearAlmacen({ n: 0, g: { frutilla: 3 } }, 'silo').g, { frutilla: 3 }, 'y la nueva se conserva');
  ok(CA.pilaMax('frutilla') === 50, 'la pila de frutillas es de 50 (antes, con la otra clave, era 30)');
}

// ---------------------------------------------------------------- 8. el tablón: la estación ya no rebaraja los tres papeles
{
  let peor = 0;
  for (let d = 1; d <= 120; d++) {
    const t = TB.tablonNuevo();
    const a = TB.aLaVista(t, d, { existe: () => true, presente: () => true, estacion: 'verano' }).map((x) => x.tpl);
    const b = TB.aLaVista(t, d, { existe: () => true, presente: () => true, estacion: 'otono' }).map((x) => x.tpl);
    ok(a.length === 3 && b.length === 3, `día ${d}: siempre tres papeles`);
    peor = Math.max(peor, 3 - a.filter((x) => b.includes(x)).length);
  }
  ok(peor <= 1, `al cruzar la estación cambia a lo sumo un papel de tres (peor caso: ${peor})`);
  const fuera = TB.aLaVista(TB.tablonNuevo(), 7, { existe: () => true, presente: () => true, estacion: 'verano' });
  ok(fuera.every((x) => x.tpl !== 'pinones-abuela'), 'lo de otoño (piñones) no sale en verano');
}

// ---------------------------------------------------------------- 9. el tablón abierto es un panel del HUD
{
  const { expresion } = await import('./ayuda-codigo.mjs');
  const base = { enElAlmacen: false, enLaFeria: false, enLasCargas: () => false, enElBanco: () => false, mochilaAbierta: false, desafio: null };
  ok(expresion(main, 'const panelDelHudAbierto = ', { ...base, tablonJuego: { abierto: () => true } })() === true, 'con el tablón abierto: hay un panel');
  ok(expresion(main, 'const panelDelHudAbierto = ', { ...base, tablonJuego: { abierto: () => false } })() === false, 'cerrado: no');
}

// ---------------------------------------------------------------- 10. el cristal del Relax tiene ranura en la mochila
{
  const p = relax({ materiales: { cristal: 4 } });
  const r = armarMochila(p, {}).find((x) => x.id === 'cristal');
  ok(r && r.cuenta === 4 && r.nombre === 'Cristales', 'la ranura de «cristal», con nombre y cuenta');
  const d = armarMochila({ ...p, modo: 'desafio', desafio: { cargas: 0 } }, {}).filter((x) => x.id === 'cristal');
  ok(d.length === 1 && d[0].nombre === 'Semillas doradas', 'en el Desafío sigue siendo la semilla dorada (una sola ranura)');
}

// ---------------------------------------------------------------- 11. el diario no dice que te quedaste la trucha si no te entra
{
  ok(enUnaLinea(main, ["diario.anotar('pez'", 'quedo: !desafio && teLaQuedas(', "lugarEn('trucha-fresca', 1) >= 1"]), 'el diario mira si la trucha entra en la mochila');
}

// ---------------------------------------------------------------- 12 y 13. textos
{
  const g = leer('src/gente-campo.js');
  ok(!/Biblia|capilla/i.test(g), 'nada religioso en la historia de Tobías');
  const hierbas = TB.cuantoDe(2, 'hierbas'), junco = TB.cuantoDe(2, 'junco');
  ok(/atados de hierbas/.test(hierbas) && /juncos/.test(junco) && !/manojo/.test(hierbas), `el tablón dice «${hierbas}» y «${junco}», como el resto del juego`);
  ok(!/postes de largada/.test(leer('README.md')), 'el README ya no nombra los postes de largada');
}

// ---------------------------------------------------------------- E1. la consola respeta las casillas de la mochila
{
  const mundo = (extra = {}) => {
    const p = relax({ materiales: {}, ...extra });
    return { m: { desafio: false, progreso: () => p, ajustes: () => ({ duracion: 30 }), jugador: () => ({}), reloj: {}, refrescar() {}, depositos: () => [], rehacerObra() {} }, p };
  };
  let w = mundo();
  let r = T.ejecutar('materiales 100', w.m);
  ok(r.ok && usadas(w.p) <= 24, `materiales 100 no pasa de 24 casillas (usó ${usadas(w.p)})`);
  ok(/hasta donde entra la mochila \(24 casillas\)/.test(r.texto), `y lo dice («${r.texto}»)`);
  eq(CA.ocupacion(w.p).sobrecarga, {}, 'sin sobrecarga');
  w = mundo(); r = T.ejecutar('materiales 9999', w.m);
  ok(usadas(w.p) === 24 && r.ok, 'materiales 9999: llena las 24 casillas y ni una más');
  w = mundo(); r = T.ejecutar('troncos 500', w.m);
  ok(w.p.materiales.tronco === 240 && /pediste 500/.test(r.texto) && /24 casillas/.test(r.texto), `troncos 500 -> 240 (${r.texto})`);
  w = mundo({ materiales: { piedra: 130 } }); r = T.ejecutar('tablas 200', w.m);
  ok(w.p.materiales.tabla === 200 && usadas(w.p) === 23, 'lo que entra entero, entra tal cual (200 tablas = 10 casillas)');
  w = mundo({ materiales: { piedra: 200 } }); r = T.ejecutar('troncos 100', w.m);
  ok(w.p.materiales.tronco === 40 && usadas(w.p) === 24, 'con 20 casillas de piedra, los troncos llegan a 40');
  // bajar o igualar nunca se limita (aunque ya haya sobrecarga de una partida vieja)
  w = mundo({ materiales: { tronco: 989 } }); r = T.ejecutar('troncos 500', w.m);
  ok(w.p.materiales.tronco === 500 && r.ok && !/no da para más/.test(r.texto), 'una partida con sobrecarga puede bajar con el código');
  r = T.ejecutar('troncos +50', w.m);
  ok(w.p.materiales.tronco === 500 && /no da para más/.test(r.texto), 'y sumar con sobrecarga no suma nada (no entra) y lo dice');
  // el Desafío no tiene límite
  const d = { desafio: true, progreso: () => dp, ajustes: () => ({}), jugador: () => ({}), reloj: {}, refrescar() {} };
  var dp = { modo: 'desafio', materiales: {} };
  T.ejecutar('materiales 100', d);
  eq(dp.materiales, { tronco: 100, tabla: 100, piedra: 100 }, 'el Desafío sigue sin límite');
  // montado con alforjas: 36 casillas
  w = mundo({ personal: { caballo: { conAlforjas: true } } }); w.m.jugador = () => ({ montado: true });
  T.ejecutar('materiales 9999', w.m);
  ok(CA.ocupacion(w.p, { montado: true }).usadas === 36, 'a caballo y con alforjas, llena las 36');
  // herramientas y depositos no tocan la mochila
  w = mundo({ materiales: { tronco: 100 } });
  const antes = usadas(w.p);
  T.ejecutar('herramientas', w.m);
  ok(usadas(w.p) === antes && !CA.conteos(w.p).has('hacha') && w.p.cosas.hacha === 1, 'herramientas: se dan y no ocupan casilla');
  const obra = { plano: { id: 'silo' }, datos: { almacen: { n: 0, g: {} } } };
  w.m.depositos = () => [obra];
  T.ejecutar('depositos', w.m);
  ok(usadas(w.p) === antes && AL.totalGuardado('silo', obra.datos.almacen) === AL.topeDe('silo', obra.datos.almacen), 'depositos: llena el silo hasta el tope y no toca lo que llevás encima');
}

// ---------------------------------------------------------------- E8. «hora» y «dia» con un turno en curso no cuentan como irse antes
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: (k) => mem.delete(k) };
  G.usarModoGuardado('relax', 1);
  const banco = (await import('../src/aldea.js')).edificioEnMundo('banco-pueblo');   // (el jugador en el banco: lejos se cierra por «te fuiste», que es otra cosa)
  const caso = (codigo) => {
    const p = G.progresoNuevo();
    p.dia = 3; p.horas = 9.5; p.economia.pesos = 1000;
    const ctx = {
      progreso: () => p, jugador: () => ({ estado: { pos: { x: banco.x, y: 0, z: banco.z } } }), escena: () => null, desafio: () => false, nota() {}, sonido: () => null, guardar() {},
      confirmar: async () => true, avanzarHoras() {}, reloj: () => false, ver: () => false, azar: () => 0.5, fiestaEn: () => null, falla() {},
    };
    const juego = crearEmpleoJuego(ctx);
    const f = EM.fichar(p, 'banco-pueblo', p.dia, p.horas);
    assert.ok(f.ok, 'ficha');
    for (let i = 0; i < 3; i++) EM.hacerTarea(p);
    juego.actualizar(1);
    const mundo = { desafio: false, progreso: () => p, ajustes: () => ({ duracion: 30 }), jugador: () => ({}), reloj: {}, refrescar() {}, alSaltarElTiempo: (d, h) => juego.alSaltarElTiempo(d, h) };
    const r = T.ejecutar(codigo, mundo);
    juego.actualizar(1);
    return { p, r, e: p.empleo };
  };
  for (const cod of ['hora 23', 'dia +1']) {
    const { r, e, p } = caso(cod);
    ok(r.ok && !e.turno, `«${cod}»: el turno se cerró`);
    ok(e.total.abandonos === 0 && (e.locales['banco-pueblo']?.faltas || 0) === 0 && !e.historial.some((h) => h.motivo === 'abandono'), `«${cod}»: sin falta ni abandono anotados`);
    ok(p.economia.pesos >= 1000, `«${cod}»: sin multa`);
  }
  const { e: e2 } = caso('hora 10');
  ok(!!e2.turno, '«hora 10» dentro del turno: sigue en curso');
  ok(enUnaLinea(main, ['alSaltarElTiempo:', 'empleoJuego?.alSaltarElTiempo(d, h)']), 'main.js engancha el cierre del turno');
}

// ---------------------------------------------------------------- E9. «historia …» deja el tipo de partida en «historia»
{
  const aj = { relaxTipo: 'libre' };
  const p = relax();
  const m = { desafio: false, progreso: () => p, ajustes: () => aj, jugador: () => ({}), reloj: {}, refrescar() {} };
  for (const cod of ['historia capitulo 5', 'historia completar', 'historia reiniciar']) {
    aj.relaxTipo = 'libre';
    const r = T.ejecutar(cod, m);
    ok(r.ok && p.historia.activa === true && aj.relaxTipo === 'historia', `«${cod}»: queda activa y relaxTipo = historia (al volver a la portada no se pausa)`);
  }
}

console.log(`verificar-4-10-1-mundo: ${n} comprobaciones OK`);
