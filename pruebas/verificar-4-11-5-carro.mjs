// 4.11.5 · el carro del caballo: se hace en tu carpintería (tablas, troncos y hierro), se engancha detrás del caballo y suma 16 casillas
// a la mochila mientras vas montado.
//   1. carro.js (reglas puras): lo que pide, lo que falta, el estado hecho/enganchado y los avisos;
//   2. carga.js: las casillas (24 + 12 alforjas + 16 carro) según montado / hecho / enganchado, el Desafío, partidas viejas, y que bajarse
//      o desenganchar con más carga que casillas deja sobrecarga (no se pierde nada, sólo no se recoge más);
//   3. carga-pantalla.js: el desglose «24 de la mochila + 12 de las alforjas + 16 del carro», las zonas y el título del carro;
//   4. personal-caballo.js / personal-partida.js: el saneo (partida vieja sin carro, no se engancha lo que no hiciste) y que la partida nueva no hereda el carro;
//   5. caballo-mundo.js (el three real, el terreno real): el carro sigue al enganche como un remolque, a su distancia, sin hundirse en una ladera,
//      gira las ruedas, no se ve desenganchado / atado al sulky / en el tren;
//   6. main.js: la carpintería (fabricar cobra y descuenta, no hace nada a medias), el aviso, el HUD y la mochila;
//   7. el guardado: ida y vuelta, partida vieja, valores rotos.
// Después, MUTACIONES a propósito de cada regla sobre una copia del código: la prueba tiene que fallar en cada una.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// un documento de mentira para el panel «Tu caballo»
class El {
  constructor(tag, doc) { this.tag = tag; this.ownerDocument = doc; this.hijos = []; this.className = ''; this.attrs = {}; this.oyentes = {}; this._texto = ''; this.dataset = {}; this.title = ''; this.style = { setProperty() {} }; this.type = ''; this.value = ''; this.placeholder = ''; this.maxLength = 0; }
  get classList() { const el = this; return { add: (c) => { el.className = `${el.className} ${c}`.trim(); }, remove: () => {}, contains: (c) => el.className.split(/\s+/).includes(c), toggle: () => {} }; }
  get textContent() { return this.hijos.length ? this.hijos.map((h) => h.textContent).join('') : this._texto; }
  set textContent(t) { this.hijos = []; this._texto = String(t); }
  appendChild(h) { this.hijos.push(h); return h; }
  append(...hs) { for (const h of hs) this.hijos.push(h); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  disparar(t) { for (const f of this.oyentes[t] || []) f({ preventDefault() {}, stopPropagation() {} }); }
  querySelectorAll(s) { const t = s.replace(/[^a-z]/g, ''); return this.todos().filter((e) => e.tag === t); }
  todos() { return [this, ...this.hijos.flatMap((h) => h.todos())]; }
}
const docFalso = () => { const doc = { createElement: (t) => new El(t, doc) }; return doc; };

const IMPORTS = /from\s+'\.\/([^']+\.js)'/g;
function cierre(raiz, entradas) {
  const vistos = new Set(), pila = [...entradas];
  while (pila.length) {
    const f = pila.pop();
    if (vistos.has(f)) continue;
    if (!fs.existsSync(path.join(raiz, 'src', f))) continue;   // (un nombre en un comentario)
    vistos.add(f);
    const t = fs.readFileSync(path.join(raiz, 'src', f), 'utf8');
    for (const m of t.matchAll(IMPORTS)) pila.push(m[1]);
  }
  return [...vistos];
}

// Un terreno (el real, una sola vez) y un sitio en pendiente, sin agua, para caminar de subida
const { generarTerreno } = await import(pathToFileURL(path.join(RAIZ, 'src', 'terreno.js')).href);
const T = generarTerreno();
function sitioEnPendiente() {
  for (let r = 20; r < 400; r += 6) for (let a = 0; a < 6.28; a += 0.2) {
    const x = Math.cos(a) * r, z = Math.sin(a) * r, nm = T.normal(x, z);
    if (nm.y > 0.88 && nm.y < 0.95 && !T.agua(x, z) && !T.agua(x + 30, z) && !T.agua(x, z + 30) && !T.agua(x - 30, z) && !T.agua(x, z - 30)) {
      // el rumbo cuesta arriba: el opuesto a la normal horizontal
      return { x, z, yaw: Math.atan2(-nm.x, -nm.z) };
    }
  }
  throw new Error('no encontré una pendiente');
}
function sitioLlano() {
  for (let r = 20; r < 400; r += 6) for (let a = 0; a < 6.28; a += 0.2) {
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    let llano = true;
    for (let i = 0; i <= 8 && llano; i++) { const px = x + Math.sin(1.1) * i * 5, pz = z + Math.cos(1.1) * i * 5; if (T.normal(px, pz).y < 0.999 || T.agua(px, pz)) llano = false; }
    if (llano) return { x, z };
  }
  throw new Error('no encontré un llano');
}
const PENDIENTE = sitioEnPendiente();

async function revisar(raiz) {
  let n = 0;
  const ok = (c, m) => { assert.ok(c, m); n++; };
  const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
  const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
  const main = fs.readFileSync(path.join(raiz, 'src', 'main.js'), 'utf8');
  const K = await imp('carro.js'), C = await imp('carga.js'), P = await imp('carga-pantalla.js'), E = await imp('economia.js');
  const PC = await imp('personal-caballo.js'), PP = await imp('personal-partida.js'), TODO = await imp('personal-todo.js');
  const { crearCaballo, RUEDA_CARRO, mallaCarro } = await imp('caballo-mundo.js');

  const relax = (cab = {}, extra = {}) => ({ modo: 'relax', materiales: {}, entradas: {}, cosas: {}, personal: { caballo: cab }, ...extra });
  const CARRO_ENG = { carro: true, enganchado: true };

  // ------------------------------------------------------------ 1. carro.js
  {
    eq(K.CARRO, { pide: { tabla: 14, tronco: 4 }, pesos: 6000 }, 'el carro pide 14 tablas, 4 troncos y $6.000 de hierro');
    ok(K.CARRO.pesos >= 2500 && K.CARRO.pesos <= 18000, 'el hierro cuesta más que templar el hacha y menos que una carpintería');
    ok(C.CASILLAS_CARRO === 16, 'suma 16 casillas');
    const tengo = (m) => (k) => m[k] || 0;
    eq(K.faltaParaElCarro(tengo({}), 0), { ok: false, falta: ['14 tablas', '4 troncos', '$6.000 de hierro'] }, 'sin nada falta todo');
    eq(K.faltaParaElCarro(tengo({ tabla: 14, tronco: 4 }), 6000), { ok: true, falta: [] }, 'justo alcanza');
    eq(K.faltaParaElCarro(tengo({ tabla: 13, tronco: 4 }), 6000).falta, ['1 tabla'], 'falta una tabla');
    eq(K.faltaParaElCarro(tengo({ tabla: 14, tronco: 3 }), 6000).falta, ['1 tronco'], 'falta un tronco');
    eq(K.faltaParaElCarro(tengo({ tabla: 14, tronco: 4 }), 5999).falta, ['$1 de hierro'], 'falta un peso del hierro');
    eq(K.faltaParaElCarro(tengo({ tabla: 14, tronco: 4 }), 'x').ok, false, 'una plata rota no alcanza');
    ok(K.faltaParaElCarro(tengo({ tabla: 900, tronco: 900 }), 1e9).ok, 'de sobra alcanza');
    ok(!K.tieneCarro(null) && !K.tieneCarro({}) && !K.tieneCarro({ enganchado: true }) && K.tieneCarro({ carro: true }), 'tener el carro es haberlo hecho');
    ok(K.carroEnganchado({ carro: true, enganchado: true }) && !K.carroEnganchado({ carro: true }) && !K.carroEnganchado({ enganchado: true }), 'enganchado = hecho y enganchado');
    eq([K.casillasDelCarro({ carro: true, enganchado: true }), K.casillasDelCarro({ carro: true }), K.casillasDelCarro(null)], [16, 0, 0], 'las casillas del carro');
    const cab0 = { nombre: 'Tormenta', pelaje: 'bayo' }, cab1 = K.conCarroHecho(cab0);
    eq(cab1, { nombre: 'Tormenta', pelaje: 'bayo', carro: true, enganchado: true }, 'hacerlo lo engancha y conserva lo del caballo');
    eq(cab0, { nombre: 'Tormenta', pelaje: 'bayo' }, 'y no toca el original');
    ok(/enganch/.test(K.avisoCarro({ carro: true, enganchado: true }, () => 0, 0)), 'el aviso del carro enganchado');
    ok(/guardado/.test(K.avisoCarro({ carro: true, enganchado: false }, () => 0, 0)) && /Personalizar/.test(K.avisoCarro({ carro: true }, () => 0, 0)), 'el aviso del carro guardado dice dónde engancharlo');
    ok(K.avisoCarro({}, () => 99, 99999).startsWith('Hacer el carro'), 'con todo, el aviso invita a hacerlo');
    ok(K.avisoCarro({}, () => 0, 0).includes('14 tablas') && K.avisoCarro({}, () => 0, 0).includes('$6.000'), 'sin nada, el aviso dice qué pide');
  }

  // ------------------------------------------------------------ 2. las casillas
  {
    eq([C.CASILLAS_BASE, C.CASILLAS_ALFORJAS, C.CASILLAS_CARRO], [24, 12, 16], 'los tres tamaños');
    // armar.mjs sólo exporta el primer nombre de un `export const A = 1, B = 2`: main.js recibía CASILLAS_ALFORJAS y CASILLAS_CARRO como undefined
    const fuenteCarga = fs.readFileSync(path.join(raiz, 'src', 'carga.js'), 'utf8');
    for (const k of ['CASILLAS_BASE', 'CASILLAS_ALFORJAS', 'CASILLAS_CARRO']) ok(new RegExp(`^export const ${k} = \\d+;`, 'm').test(fuenteCarga), `${k} se exporta solo, en su propia declaración (si no, el juego armado lo recibe vacío)`);
    const cap = (cab, montado, extra) => C.capacidad(relax(cab, extra), { montado });
    eq(cap({}, true), { base: 24, alforjas: 0, carro: 0, total: 24 }, 'sin nada, 24');
    eq(cap(CARRO_ENG, true), { base: 24, alforjas: 0, carro: 16, total: 40 }, 'montado con el carro enganchado: 40');
    eq(cap({ ...CARRO_ENG, conAlforjas: true }, true), { base: 24, alforjas: 12, carro: 16, total: 52 }, 'con alforjas y carro: 52');
    eq(cap({ conAlforjas: true }, true).total, 36, 'sólo alforjas: 36 como antes');
    eq(cap(CARRO_ENG, false).total, 24, 'a pie el carro no suma');
    eq(cap({ ...CARRO_ENG, conAlforjas: true }, false).total, 24, 'a pie no suma nada');
    eq(cap({ carro: true, enganchado: false }, true).total, 24, 'hecho pero desenganchado: no suma');
    eq(cap({ carro: false, enganchado: true }, true).total, 24, 'enganchado sin haberlo hecho: no suma');
    eq(cap({ carro: 'true', enganchado: 1 }, true).total, 24, 'valores raros no cuentan');
    eq(cap({}, true, { personal: undefined }).total, 24, 'una partida sin personal');
    eq(C.capacidad(relax(CARRO_ENG)).total, 24, 'sin contexto: a pie');
    eq(C.capacidad({ modo: 'desafio', personal: { caballo: CARRO_ENG } }, { montado: true }), { base: Infinity, alforjas: 0, carro: 0, total: Infinity }, 'el Desafío no tiene límite ni carro');
    // partida vieja: el caballo no tiene los campos del carro
    eq(C.capacidad(relax({ conAlforjas: true, nombre: 'x' }), { montado: true }).total, 36, 'partida vieja con alforjas, igual que antes');
    // más carga que casillas: se baja, o se desengancha
    const cargado = (cab) => relax(cab, { materiales: { tronco: 400 } });   // 40 casillas de troncos
    const montadoCarro = cargado(CARRO_ENG);
    const oM = C.ocupacion(montadoCarro, { montado: true });
    eq([oM.usadas, oM.total, oM.libres, Object.keys(oM.sobrecarga).length], [40, 40, 0, 0], 'montado con el carro entran las 40 casillas justas');
    ok(C.lugarPara(montadoCarro, 'tronco', 5, { montado: true }) === 0, 'llena: no entra más');
    const oA = C.ocupacion(montadoCarro, { montado: false });
    eq([oA.usadas, oA.total], [40, 24], 'a pie: lleva 40 casillas en 24');
    eq(oA.sobrecarga, { tronco: 160 }, 'la sobrecarga es lo que pasa (160 troncos)');
    eq(C.conteos(montadoCarro).get('tronco'), 400, 'no se pierde nada: los 400 troncos siguen');
    ok(C.lugarPara(montadoCarro, 'tabla', 1, { montado: false }) === 0 && C.lugarPara(montadoCarro, 'tronco', 1, { montado: false }) === 0, 'con sobrecarga no podés recoger más');
    ok(!C.tratoCabe(montadoCarro, { tabla: 1 }, {}, { montado: false }).ok, 'ni un trato que suma');
    ok(C.tratoCabe(montadoCarro, {}, { tronco: 50 }, { montado: false }).ok, 'pero sí uno que baja la carga');
    // desenganchado estando montado: lo mismo
    const desenganchado = cargado({ carro: true, enganchado: false });
    eq(C.ocupacion(desenganchado, { montado: true }).sobrecarga, { tronco: 160 }, 'desenganchar con la carga encima: sobrecarga, sin pérdida');
    eq(C.conteos(desenganchado).get('tronco'), 400, 'y los troncos siguen');
    // con espacio de sobra montado: entran 12 más hasta 40
    const p30 = relax(CARRO_ENG, { materiales: { tronco: 300 } });
    ok(C.lugarPara(p30, 'tabla', 500, { montado: true }) === 200, 'montado con 30 de 40 casillas: caben 10 pilas de tablas (200)');
    ok(C.lugarPara(p30, 'tabla', 500, { montado: false }) === 0, 'a pie, con 30 casillas encima, nada');
  }

  // ------------------------------------------------------------ 3. la pantalla de carga
  {
    const buscar = (k) => ({ nombre: k, icono: k, id: k, texto: '' });
    const capA = (cab, montado) => C.capacidad(relax(cab), { montado });
    eq(P.textoDetalleCapacidad(capA({ ...CARRO_ENG, conAlforjas: true }, true), 12, 16), '24 de la mochila + 12 de las alforjas + 16 del carro', 'el desglose completo');
    eq(P.textoDetalleCapacidad(capA(CARRO_ENG, true), 0, 16), '24 de la mochila + 16 del carro', 'sólo con el carro');
    eq(P.textoDetalleCapacidad(capA({ conAlforjas: true }, true), 12, 0), '24 de la mochila + 12 de las alforjas', 'sólo las alforjas, como antes');
    eq(P.textoDetalleCapacidad(capA(CARRO_ENG, false), 0, 16), '24 de la mochila. Montado con el carro suman 16 más', 'a pie avisa lo que suma el carro');
    eq(P.textoDetalleCapacidad(capA({ ...CARRO_ENG, conAlforjas: true }, false), 12, 16), '24 de la mochila. Montado con las alforjas y el carro suman 28 más', 'a pie, las dos cosas');
    eq(P.textoDetalleCapacidad(capA({ conAlforjas: true }, false), 12), '24 de la mochila. Montado con las alforjas suman 12 más', 'sólo alforjas a pie, como antes');
    eq(P.textoDetalleCapacidad(capA({}, false), 0, 0), '24 casillas en la mochila', 'sin nada');
    const p = relax({ ...CARRO_ENG, conAlforjas: true }, { materiales: { tronco: 15, tabla: 3 } });
    const o = C.ocupacion(p, { montado: true }), cap = C.capacidad(p, { montado: true });
    const v = P.vistaCasillas(o, cap, buscar);
    const zonas = (vista) => vista.celdas.reduce((a, c) => ({ ...a, [c.zona]: (a[c.zona] || 0) + 1 }), {});
    eq([v.celdas.length, zonas(v)], [52, { mochila: 24, alforjas: 12, carro: 16 }], '52 celdas: 24 de la mochila, 12 de las alforjas y 16 del carro');
    eq(v.celdas.slice(0, 24).every((c) => c.zona === 'mochila') && v.celdas.slice(24, 36).every((c) => c.zona === 'alforjas') && v.celdas.slice(36).every((c) => c.zona === 'carro'), true, 'en ese orden');
    const vc = P.vistaCasillas(C.ocupacion(relax(CARRO_ENG), { montado: true }), C.capacidad(relax(CARRO_ENG), { montado: true }), buscar);
    eq(zonas(vc), { mochila: 24, carro: 16 }, 'sin alforjas: 24 y 16');
    // lo que está en el carro es lo que pasa de la mochila: con 30 casillas, 6 son del carro y están llenas de verdad
    const pc = relax(CARRO_ENG, { materiales: { tronco: 300 } });
    const vl = P.vistaCasillas(C.ocupacion(pc, { montado: true }), C.capacidad(pc, { montado: true }), buscar);
    eq([vl.celdas.filter((c) => c.zona === 'carro' && !c.vacia).length, vl.celdas.filter((c) => c.zona === 'carro' && c.vacia).length], [6, 10], 'seis del carro ocupadas y diez vacías');
    const doc = docFalso(), cont = new El('div', doc);
    P.dibujarCasillas(cont, v, { iconoDe: (i) => `icono:${i}`, doc });
    const titulos = cont.hijos.filter((h) => h.className === 'casillas-zona').map((h) => h.textContent);
    eq(titulos, ['Alforjas del caballo', 'Carro del caballo'], 'los títulos de las zonas, en orden');
    const casillas = cont.hijos.filter((h) => h.className.split(' ')[0] === 'casilla');
    eq([casillas.length, casillas.filter((c) => c.className.split(' ').includes('carro')).length, casillas.filter((c) => c.className.split(' ').includes('alforja')).length], [52, 16, 12], 'se dibujan las 52, 16 marcadas del carro y 12 de las alforjas');
    const cont2 = new El('div', doc);
    P.dibujarCasillas(cont2, vc, { iconoDe: (i) => i, doc });
    eq(cont2.hijos.filter((h) => h.className === 'casillas-zona').map((h) => h.textContent), ['Carro del caballo'], 'sin alforjas sólo el título del carro');
    const css = fs.readFileSync(path.join(raiz, 'src', 'menus', 'sistema.css'), 'utf8');
    ok(/\.casilla\.carro:not\(\.vacia\)/.test(css), 'las casillas del carro tienen su color');
    ok(/\.mochila-cuerpo \.casillas \{[^}]*overflow-y: auto/.test(css), 'con 52 casillas se desplazan adentro del panel (no tapan el pie)');
  }

  // ------------------------------------------------------------ 4. lo guardado en «Tu caballo» y la partida nueva
  {
    const d0 = PC.caballoPorDefecto();
    eq([d0.carro, d0.enganchado], [false, false], 'de fábrica no hay carro');
    eq(PC.sanearCaballoPersonal({ nombre: 'Ruano', pelaje: 'bayo' }).carro, false, 'una partida vieja se abre sin carro');
    eq(PC.sanearCaballoPersonal({ carro: true, enganchado: true }), { ...d0, carro: true, enganchado: true }, 'hecho y enganchado se conserva');
    eq(PC.sanearCaballoPersonal({ carro: true }).enganchado, false, 'hecho sin decir: desenganchado');
    eq(PC.sanearCaballoPersonal({ enganchado: true }), d0, 'no se engancha lo que no hiciste');
    eq(PC.sanearCaballoPersonal({ carro: 'si', enganchado: 'si' }), d0, 'valores raros: sin carro');
    eq(PC.sanearCaballoPersonal({ carro: 1, enganchado: 1 }).carro, false, 'un 1 tampoco es verdadero');
    eq(PC.sanearCaballoPersonal(PC.sanearCaballoPersonal({ carro: true, enganchado: true })), { ...d0, carro: true, enganchado: true }, 'sanear dos veces da lo mismo');
    ok(PC.firmaCaballo(PC.sanearCaballoPersonal({ carro: true, enganchado: true })) === PC.firmaCaballo(d0), 'el carro no rearma el cuerpo del caballo');
    // el panel «Tu caballo»
    const seccion = TODO.secciones().find((s) => s.id === 'caballo');
    const armar = (datos) => {
      const doc = docFalso(), cont = new El('div', doc), cambios = [];
      seccion.construir(cont, { datos, cambiar: (x) => cambios.push(x) });
      return { cont, cambios, texto: cont.textContent };
    };
    const sin = armar(PC.sanearCaballoPersonal({}));
    ok(!sin.texto.includes('Carro enganchado') && /Carro: se hace en tu carpintería, con tablas, troncos y hierro/.test(sin.texto) && sin.texto.includes('16 casillas'), 'sin carro, el panel dice dónde se hace y cuánto suma');
    const con = armar(PC.sanearCaballoPersonal({ carro: true }));
    ok(con.texto.includes('Carro enganchado (+16 casillas montado)') && !/se hace en tu carpintería/.test(con.texto), 'con el carro hecho, el interruptor de engancharlo');
    const botones = con.cont.todos().filter((e) => e.tag === 'button' && ['Sí', 'No'].includes(e.textContent));
    const siCarro = con.cont.todos().find((e) => e.tag === 'div' && e.hijos.some((h) => h.textContent === 'Carro enganchado (+16 casillas montado)'));
    ok(!!siCarro, 'hay una fila del carro');
    const botonSi = siCarro.todos().find((e) => e.tag === 'button' && e.textContent === 'Sí');
    if (botonSi) { botonSi.disparar('click'); eq(con.cambios.at(-1), { enganchado: true }, 'el Sí engancha'); }
    else ok(botones.length >= 2, 'los botones Sí y No del interruptor');
    // la partida nueva: pasa el caballo, no el carro
    const personal = { caballo: PC.sanearCaballoPersonal({ nombre: 'Ruano', pelaje: 'bayo', conAlforjas: true, carro: true, enganchado: true }), partida: PP.partidaDefecto() };
    const nueva = PP.empezarConReceta(personal, {}).personal.caballo;
    eq([nueva.carro, nueva.enganchado, nueva.nombre, nueva.pelaje, nueva.conAlforjas], [false, false, 'Ruano', 'bayo', true], 'la partida nueva pasa el caballo y las alforjas pero no el carro');
    eq(personal.caballo.carro, true, 'y no toca la partida de antes');
    eq(PP.empezarConReceta({ partida: PP.partidaDefecto() }, {}).personal.caballo, undefined, 'sin caballo guardado no inventa uno');
    const viaPendiente = {}; const almacen = { setItem: (k, v) => { viaPendiente[k] = v; } };
    PP.dejarPersonalPendiente(almacen, 'relax', 2, personal, {});
    const pend = JSON.parse(Object.values(viaPendiente)[0]);
    eq([pend.caballo.carro, pend.caballo.enganchado], [false, false], '«Empezar acá» en otra ranura tampoco hereda el carro');
  }

  // ------------------------------------------------------------ 5. el carro en el mundo
  {
    const escena = new THREE.Scene();
    const cab = crearCaballo(T, escena);
    const L = K.ENGANCHE.largo, A = K.ENGANCHE.atras;
    ok(A >= 1.15, 'el enganche queda detrás de la cola del caballo');
    ok(L - 0.75 >= 0.9, 'entre la trasera del caballo y el frente del carro queda lugar para las patas');
    const hitch = (e) => ({ x: e.x - Math.sin(e.yaw) * A, z: e.z - Math.cos(e.yaw) * A });
    const bal = new THREE.Vector3();
    // cuánto se aleja el balancín del carro (la punta de las varas) del enganche del caballo, en el plano
    const errorEnganche = (k, e) => { k.g.updateMatrixWorld(true); bal.set(0, K.ENGANCHE.alto, L); k.g.localToWorld(bal); const h = hitch(e); return Math.hypot(bal.x - h.x, bal.z - h.z); };
    const paso = (x, z, yaw, vel = 5, montado = true, visible = true, sinCarro = false) => cab.actualizar(1 / 60, { x, z, yaw }, vel, montado, visible, sinCarro);
    paso(PENDIENTE.x, PENDIENTE.z, PENDIENTE.yaw);
    ok(!cab.carro() && cab.conCarro() === false, 'sin carro hecho no se arma ni una malla');
    eq(escena.children.length, 1, 'sólo el caballo en la escena');
    cab.personalizar({ carro: true, enganchado: false });
    paso(PENDIENTE.x, PENDIENTE.z, PENDIENTE.yaw);
    ok(!cab.carro(), 'hecho pero desenganchado: no se ve');
    cab.personalizar({ carro: true, enganchado: true });
    ok(cab.conCarro() === true, 'enganchado');
    // los colores: el cuerpo y las ruedas son de madera y hierro, nada blanco (un tubo pintado con un material en vez de un color salía blanco)
    {
      const m = mallaCarro(), colores = [];
      m.g.traverse((o) => { const c = o.isMesh && o.geometry.attributes.color; if (c) for (let i = 0; i < c.count; i++) colores.push(Math.max(c.getX(i), c.getY(i), c.getZ(i))); });
      ok(colores.length > 500 && colores.every((v) => v < 0.8), `ningún vértice del carro sale blanco o casi (el más claro: ${Math.max(...colores).toFixed(2)})`);
    }
    // en terreno llano el eje queda a la distancia justa del enganche
    {
      const llano = sitioLlano();
      cab.personalizar({ carro: false });
      paso(llano.x, llano.z, 1.1);
      cab.personalizar({ carro: true, enganchado: true });
      let lx = llano.x, lz = llano.z;
      for (let i = 0; i < 90; i++) { lx += Math.sin(1.1) * 5 / 60; lz += Math.cos(1.1) * 5 / 60; paso(lx, lz, 1.1); }
      const kk = cab.carro(), hl = hitch({ x: lx, z: lz, yaw: 1.1 });
      ok(Math.abs(Math.hypot(hl.x - kk.g.position.x, hl.z - kk.g.position.z) - L) < 0.06, `en llano el eje queda a ${L} m del enganche (${Math.hypot(hl.x - kk.g.position.x, hl.z - kk.g.position.z).toFixed(3)})`);
    }
    // se camina cuesta arriba, 12 s a 5 m/s, girando un poco
    let x = PENDIENTE.x, z = PENDIENTE.z, yaw = PENDIENTE.yaw, minDist = 9, maxDist = 0, peorError = 0, maxRezago = 0, peorBajoSuelo = 1e9, peorEnganche = 0, maxPitch = 0, hundido = false;
    const v = new THREE.Vector3();
    paso(x, z, yaw);
    const r0 = cab.carro().ruedas[0].rotation.x;
    for (let i = 0; i < 720; i++) {
      yaw += Math.sin(i / 90) * 0.01;
      x += Math.sin(yaw) * 5 / 60; z += Math.cos(yaw) * 5 / 60;
      paso(x, z, yaw);
      const k = cab.carro(), g = k.g, h = hitch({ x, z, yaw });
      const d = Math.hypot(h.x - g.position.x, h.z - g.position.z);
      minDist = Math.min(minDist, d); maxDist = Math.max(maxDist, d);
      g.updateMatrixWorld(true);
      // el balancín (centro del enganche) queda en el enganche del caballo
      v.set(0, K.ENGANCHE.alto, L); g.localToWorld(v);
      peorEnganche = Math.max(peorEnganche, Math.hypot(v.x - h.x, v.z - h.z));
      peorError = Math.max(peorError, errorEnganche(k, { x, z, yaw }));
      // las cuatro esquinas del piso no se hunden en el terreno
      for (const [lx, lz] of [[-0.56, -0.85], [0.56, -0.85], [-0.56, 0.75], [0.56, 0.75]]) {
        v.set(lx, 0.68, lz); g.localToWorld(v);
        peorBajoSuelo = Math.min(peorBajoSuelo, v.y - T.altura(v.x, v.z));
      }
      maxPitch = Math.max(maxPitch, Math.abs(g.rotation.x));
      maxRezago = Math.max(maxRezago, Math.abs(Math.atan2(Math.sin(g.rotation.y - yaw), Math.cos(g.rotation.y - yaw))));
    }
    ok(minDist > L * 0.5 && maxDist < L + 0.4, `en la ladera el eje queda a ${minDist.toFixed(2)}–${maxDist.toFixed(2)} m del enganche en el plano (el carro se inclina: cerca de ${L} m)`);
    ok(peorEnganche < 0.02 && peorError < 0.02, `las varas llegan al enganche del caballo (peor ${peorEnganche.toFixed(4)} m)`);
    ok(peorBajoSuelo > 0.1, `el piso no atraviesa la ladera (peor ${peorBajoSuelo.toFixed(3)} m sobre el suelo)`);
    ok(maxRezago > 0.05 && maxRezago < 0.9, `en las curvas el carro va rezagado, como un remolque (hasta ${maxRezago.toFixed(2)} rad detrás del giro del caballo)`);
    ok(maxPitch > 0.02, `y se inclina con la pendiente (${maxPitch.toFixed(3)} rad)`);
    const k = cab.carro();
    ok(k.g.visible && k.ruedas.length === 2 && escena.children.length === 2, 'se ve, con dos ruedas, y la escena tiene al caballo y al carro');
    ok(k.g.children.length === 3, 'tres mallas en total: el cuerpo fundido y las dos ruedas');
    // mira para donde tira: el frente del carro apunta al enganche
    const hh = hitch({ x, z, yaw });
    const dxh = hh.x - k.g.position.x, dzh = hh.z - k.g.position.z, dh = Math.hypot(dxh, dzh);
    ok(Math.abs(Math.sin(k.g.rotation.y) - dxh / dh) < 0.12 && Math.abs(Math.cos(k.g.rotation.y) - dzh / dh) < 0.12, 'el frente del carro mira al enganche');
    // las ruedas giran lo que anda: 12 s a 5 m/s = unos 60 m
    const giro = (k.ruedas[0].rotation.x - r0) * RUEDA_CARRO;
    ok(Math.abs(giro - 60) < 4 && Math.abs(k.ruedas[1].rotation.x - k.ruedas[0].rotation.x) < 1e-9, `las ruedas giran con el camino (${giro.toFixed(1)} m de 60) y juntas`);
    ok(Math.abs(k.ruedas[0].position.y - RUEDA_CARRO) < 1e-9 && Math.abs(k.ruedas[0].position.x) > 0.5, 'las ruedas apoyan en el suelo y salen a los costados');
    // girar parado: el carro se acomoda, a la misma distancia
    const g0 = k.ruedas[0].rotation.x;
    for (let i = 0; i < 90; i++) { yaw += (Math.PI / 2) / 90; paso(x, z, yaw, 0); }
    const h2 = hitch({ x, z, yaw });
    ok(errorEnganche(k, { x, z, yaw }) < 0.02, 'el caballo gira en el lugar y el carro sigue enganchado');
    ok(Math.abs(k.ruedas[0].rotation.x - g0) < 4.4, 'las ruedas giran lo que se mueve el enganche (no más) al maniobrar');
    // atado al sulky, en el tren o lejos: no se ve; vuelve detrás del caballo
    paso(x, z, yaw, 0, false, true, true);
    ok(!k.g.visible, 'atado a las varas del sulky no lleva el carro');
    paso(x, z, yaw, 0, false, true, false);
    ok(k.g.visible, 'y al soltarlo vuelve');
    const h3 = hitch({ x, z, yaw });
    ok(errorEnganche(k, { x, z, yaw }) < 0.02 && Math.abs(k.g.rotation.y - yaw) < 1e-6, 'detrás del caballo y derecho');
    paso(x, z, yaw, 0, false, false);
    ok(!k.g.visible && !cab.malla.visible, 'caballo fuera de vista (por ejemplo en la jaula del tren): el carro tampoco');
    paso(x + 500, z + 500, yaw);
    const h4 = hitch({ x: x + 500, z: z + 500, yaw });
    ok(k.g.visible && errorEnganche(k, { x: x + 500, z: z + 500, yaw }) < 0.02, 'tras un salto lejos, el carro aparece enganchado en un cuadro');
    // desengancharlo lo guarda; volver a engancharlo reusa la misma malla
    cab.personalizar({ carro: true, enganchado: false });
    paso(x + 500, z + 500, yaw);
    ok(!k.g.visible && cab.conCarro() === false, 'desenganchado: no se ve');
    cab.personalizar({ carro: true, enganchado: true });
    paso(x + 500, z + 500, yaw);
    ok(cab.carro() === k && k.g.visible && escena.children.length === 2, 'enganchado de nuevo: la misma malla, sin sumar nada a la escena');
    cab.personalizar({ pelaje: 'bayo', carro: true, enganchado: true });
    paso(x + 500, z + 500, yaw);
    ok(k.g.visible && cab.conCarro(), 'cambiar el pelaje (rearma el cuerpo) no pierde el carro');
    cab.personalizar({ carro: false, enganchado: true });
    paso(x + 500, z + 500, yaw);
    ok(!k.g.visible, 'sin haberlo hecho no hay carro, aunque diga enganchado');
  }

  // ------------------------------------------------------------ 6. el juego (main.js)
  {
    const nuevoEntorno = (over = {}) => {
      const progreso = { modo: 'relax', dia: 3, materiales: { tabla: 20, tronco: 6 }, entradas: {}, cosas: { caballo: 1 }, economia: { ...E.economiaNueva(), pesos: 10000 }, personal: { caballo: { nombre: 'Ruano' } }, ...over };
      const llamadas = { notas: [], aplicar: 0, refrescar: 0, guardar: 0, juntar: 0 };
      const env = {
        progreso, llamadas, CARRO: K.CARRO, CASILLAS_CARRO: C.CASILLAS_CARRO, faltaParaElCarro: K.faltaParaElCarro, tieneCarro: K.tieneCarro, conCarroHecho: K.conCarroHecho,
        textoCasillasCarro: K.textoCasillasCarro, textoPedido: K.textoPedido, avisoCarro: K.avisoCarro, formatoPesos: E.formatoPesos,
        materialesVisibles: () => progreso.materiales, pesosDe: E.pesosDe, pagarPesos: E.pagar,
        conMateriales: (fn) => fn(progreso.materiales),
        aplicarPersonal: () => { llamadas.aplicar++; }, refrescarCargaHud: () => { llamadas.refrescar++; }, guardar: () => { llamadas.guardar++; },
        sonido: { juntar: () => { llamadas.juntar++; } }, caballoDicho: () => 'al zaino', tieneCaballo: () => true, desafio: false,
        nota: (t, s, b) => llamadas.notas.push([t, s, b]),
        TALLERES: {}, nivelDe: () => 0, extraMadera: () => 0.1,
        ...over.env,
      };
      return env;
    };
    const fabricar = (env) => funcion(main, 'usarCarpinteriaCarro', env)();
    // todo en orden
    {
      const env = nuevoEntorno(), p = env.progreso;
      ok(fabricar(env) === true, 'fabricar dice que atendió');
      eq([p.materiales.tabla, p.materiales.tronco, E.pesosDe(p)], [6, 2, 4000], 'descuenta 14 tablas, 4 troncos y $6.000');
      eq(p.personal.caballo, { nombre: 'Ruano', carro: true, enganchado: true }, 'el carro queda hecho y enganchado, con el resto del caballo');
      eq([env.llamadas.aplicar, env.llamadas.refrescar, env.llamadas.guardar, env.llamadas.juntar], [1, 1, 1, 1], 'aplica al mundo, rehace la mochila, guarda y suena');
      eq(env.llamadas.notas.length, 1, 'un solo aviso');
      ok(env.llamadas.notas[0][0] === 'Hiciste el carro' && env.llamadas.notas[0][1].includes('16 casillas') && env.llamadas.notas[0][1].includes('Personalizar'), 'el aviso cuenta qué suma y dónde se engancha');
      ok(p.economia.libro.some((m) => m.monto === -6000 && /carro/i.test(m.motivo)), 'el hierro queda anotado en la billetera');
      // una segunda vez no cobra de nuevo
      fabricar(env);
      eq([p.materiales.tabla, p.materiales.tronco, E.pesosDe(p)], [6, 2, 4000], 'con el carro hecho no se cobra otra vez');
      ok(env.llamadas.notas.at(-1)[0] === 'Tu carro', 'y dice cómo va');
    }
    // justo
    {
      const env = nuevoEntorno({ materiales: { tabla: 14, tronco: 4 }, economia: { ...E.economiaNueva(), pesos: 6000 } }), p = env.progreso;
      fabricar(env);
      eq([p.materiales.tabla, p.materiales.tronco, E.pesosDe(p), p.personal.caballo.carro], [0, 0, 0, true], 'con lo justo, alcanza');
    }
    // falta algo: no se toca nada
    for (const [que, over, dice] of [
      ['tablas', { materiales: { tabla: 5, tronco: 6 } }, '9 tablas'],
      ['troncos', { materiales: { tabla: 20, tronco: 3 } }, '1 tronco'],
      ['plata', { economia: { ...E.economiaNueva(), pesos: 5999 } }, '$1 de hierro'],
      ['todo', { materiales: {}, economia: { ...E.economiaNueva(), pesos: 0 } }, '14 tablas'],
      ['economía', { economia: undefined }, '$6.000 de hierro'],
    ]) {
      const env = nuevoEntorno(over), p = env.progreso;
      const antes = JSON.stringify([p.materiales, p.economia, p.personal]);
      fabricar(env);
      eq(JSON.stringify([p.materiales, p.economia, p.personal]), antes, `falta ${que}: no se gasta ni se hace nada`);
      ok(env.llamadas.notas.length === 1 && env.llamadas.notas[0][0] === 'El carro del caballo' && env.llamadas.notas[0][1].includes(dice), `falta ${que}: el aviso dice qué falta (${dice})`);
      eq([env.llamadas.aplicar, env.llamadas.guardar, env.llamadas.juntar], [0, 0, 0], `falta ${que}: no guarda ni suena`);
    }
    // el aviso del banco de carpintero
    {
      const avisar = (env) => funcion(main, 'avisoOficioPropio', env)({ plano: { id: 'carpinteria' } });
      const env = nuevoEntorno();
      ok(/^Hacer el carro del caballo/.test(avisar(env)), 'con todo, el banco invita a hacer el carro');
      env.progreso.materiales = {};
      ok(avisar(env).includes('14 tablas'), 'sin materiales, dice qué pide');
      env.progreso.personal.caballo = CARRO_ENG;
      ok(/enganchado/.test(avisar(env)), 'con el carro, dice cómo va');
      const sinCaballo = nuevoEntorno({ env: { tieneCaballo: () => false } });
      ok(/^Tu banco: en cada obra sobra 10 % más de madera$/.test(avisar(sinCaballo)), 'sin caballo, el banco sigue diciendo lo de siempre');
      const enDesafio = nuevoEntorno({ env: { desafio: true } });
      ok(/^Tu banco: en cada obra sobra/.test(avisar(enDesafio)), 'en el Desafío no hay carro');
      // el uso con E: sin caballo no ofrece el carro (cae a lo de siempre)
      const usar = (e) => funcion(main, 'usarOficioPropio', { ...e, textoCarpinteria: () => 'texto de siempre', usarCarpinteriaCarro: () => { e.llamadas.carpinteria = true; return true; } })({ plano: { id: 'carpinteria' }, datos: {} });
      const e1 = nuevoEntorno(); usar(e1); ok(e1.llamadas.carpinteria === true, 'con caballo, la E del banco fabrica');
      const e2 = nuevoEntorno({ env: { tieneCaballo: () => false } }); usar(e2); ok(!e2.llamadas.carpinteria && e2.llamadas.notas[0][1] === 'texto de siempre', 'sin caballo, la E del banco dice lo de siempre');
      const e3 = nuevoEntorno({ env: { desafio: true } }); usar(e3); ok(!e3.llamadas.carpinteria, 'en el Desafío, tampoco');
    }
    // el HUD y la mochila
    {
      const env = { ...nuevoEntorno(), cargaCarroVisto: false, cargaMontadoVisto: false, ocupacion: C.ocupacion, ctxCargaVista: () => ({ montado: true }), ponerCargaHud: () => {}, $: () => ({}), casillasDelCarro: K.casillasDelCarro };
      env.progreso.personal.caballo = CARRO_ENG;
      funcion(main, 'refrescarCargaHud', env)();
      ok(env.cargaCarroVisto === true, 'al rehacer el HUD se anota si hay carro enganchado');
      env.progreso.personal.caballo = { carro: true, enganchado: false };
      funcion(main, 'refrescarCargaHud', env)();
      ok(env.cargaCarroVisto === false, 'desenganchado, no');
    }
    ok(enUnaLinea(main, ['cargaCarroVisto !==', 'casillasDelCarro(progreso.personal?.caballo)', 'refrescarCargaHud()']), 'cada cuadro se mira si enganchaste o desenganchaste (y se rehace el HUD)');
    ok(enUnaLinea(main, ['textoDetalleCapacidad(cap', 'CASILLAS_ALFORJAS', 'casillasDelCarro(progreso.personal?.caballo)']), 'la mochila pasa lo que suma el carro al desglose');
    ok(enUnaLinea(main, ['caballoMundo.actualizar(', 'js.enSulky', 'rinconesJuego?.caballoAtado?.()']), 'atado al sulky, el caballo no lleva el carro');
    ok(enUnaLinea(main, [/import \{[^}]*\bCASILLAS_CARRO\b[^}]*\} from '\.\/carga\.js';/]) && enUnaLinea(main, [/import \{[^}]*\bfaltaParaElCarro\b[^}]*\} from '\.\/carro\.js';/]), 'main.js trae las reglas del carro');
  }
  return n;
}

// ---------------------------------------------------------------- lo real
const total = await revisar(RAIZ);

// ---------------------------------------------------------------- 7. el guardado (con el almacenamiento de mentira de siempre)
let guardado = 0;
{
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); } };
  const G = await import(pathToFileURL(path.join(RAIZ, 'src', 'guardado.js')).href);
  const eq = (a, b, m) => { assert.deepEqual(a, b, m); guardado++; };
  const nuevo = G.progresoNuevo();
  eq([nuevo.personal.caballo.carro, nuevo.personal.caballo.enganchado], [false, false], 'una partida nueva no trae carro');
  nuevo.personal.caballo.carro = true; nuevo.personal.caballo.enganchado = true; nuevo.personal.caballo.nombre = 'Ruano';
  assert.equal(G.guardarProgreso(nuevo), true);
  const c = G.cargarProgreso();
  eq([c.personal.caballo.carro, c.personal.caballo.enganchado, c.personal.caballo.nombre], [true, true, 'Ruano'], 'el carro viaja con la partida (ida y vuelta)');
  const desenganchado = G.progresoNuevo(); desenganchado.personal.caballo.carro = true;
  G.guardarProgreso(desenganchado);
  eq([G.cargarProgreso().personal.caballo.carro, G.cargarProgreso().personal.caballo.enganchado], [true, false], 'hecho y guardado queda desenganchado');
  // una partida de antes: el caballo no tiene los campos
  almacen.clear();
  almacen.set('hojarasca-v1', JSON.stringify({ dia: 9, horas: 10, entradas: {}, personal: { caballo: { nombre: 'Viejo', pelaje: 'moro', conAlforjas: true } } }));
  G.usarModoGuardado('relax', 1);
  const v = G.cargarProgreso().personal.caballo;
  eq([v.nombre, v.pelaje, v.conAlforjas, v.carro, v.enganchado], ['Viejo', 'moro', true, false, false], 'partida vieja: igual que antes y sin carro');
  const CC = await import(pathToFileURL(path.join(RAIZ, 'src', 'carga.js')).href);
  eq(CC.capacidad(G.cargarProgreso(), { montado: true }).total, 36, 'y montado con alforjas son 36, como antes');
  // enganchado sin haberlo hecho, o con basura
  almacen.set('hojarasca-v1', JSON.stringify({ dia: 9, entradas: {}, personal: { caballo: { enganchado: true, carro: { a: 1 } } } }));
  const r = G.cargarProgreso().personal.caballo;
  eq([r.carro, r.enganchado], [false, false], 'basura en los campos: sin carro');
  // una partida de una versión más nueva se abre en sólo lectura (ya existe: la versión viaja); el carro de esa partida no se pierde al leerla
  almacen.set('hojarasca-v1', JSON.stringify({ dia: 9, entradas: {}, versionJuego: '9.0.0', personal: { caballo: { carro: true, enganchado: true, campoDelFuturo: 1 } } }));
  const f = G.cargarProgreso();
  eq([f.versionJuego, f.personal.caballo.carro, f.personal.caballo.enganchado], ['9.0.0', true, true], 'la partida de una versión más nueva conserva su carro y su versión (el sólo lectura es el de siempre)');
}

// ---------------------------------------------------------------- MUTACIONES: cada regla rota a propósito, en una copia del código, tiene que hacer fallar la prueba
const ENTRADAS = ['carro.js', 'carga.js', 'carga-pantalla.js', 'personal-caballo.js', 'personal-partida.js', 'personal-todo.js', 'caballo-mundo.js', 'economia.js'];
const MUTACIONES = [
  ['carga.js', 'las casillas del carro valen 8', 'CASILLAS_CARRO = 16', 'CASILLAS_CARRO = 8'],
  ['carga.js', 'las casillas se exportan con comas (el juego armado las recibe vacías)', 'export const CASILLAS_ALFORJAS = 12;\nexport const CASILLAS_CARRO = 16;', 'export const CASILLAS_ALFORJAS = 12, CASILLAS_CARRO = 16;'],
  ['carga.js', 'el carro suma aunque estés a pie', 'ctx && ctx.montado && cab?.carro === true', 'ctx && cab?.carro === true'],
  ['carga.js', 'el carro suma sin estar enganchado', ' && cab?.enganchado === true ? CASILLAS_CARRO', ' ? CASILLAS_CARRO'],
  ['carga.js', 'el carro suma sin haberlo hecho', 'ctx.montado && cab?.carro === true && cab?.enganchado', 'ctx.montado && cab?.enganchado'],
  ['carga.js', 'el carro reemplaza a las alforjas', 'conAlforjas === true ? CASILLAS_ALFORJAS : 0;', 'conAlforjas === true && !(progreso?.personal?.caballo?.carro === true) ? CASILLAS_ALFORJAS : 0;'],
  ['carga-pantalla.js', 'el desglose no nombra el carro', '`${cap.carro} del carro`', '`${cap.carro} de la caja`'],
  ['carga-pantalla.js', 'el desglose a pie no avisa del carro', "extraAlforjas > 0 && extraCarro > 0 ? 'las alforjas y el carro'", "extraAlforjas > 0 && extraCarro > 0 ? 'las alforjas'"],
  ['carga-pantalla.js', 'las casillas del carro cuentan como alforjas', ": 'carro');", ": 'alforjas');"],
  ['carga-pantalla.js', 'el título del carro dice alforjas', "'Carro del caballo' : 'Alforjas del caballo'", "'Alforjas del caballo' : 'Alforjas del caballo'"],
  ['carga-pantalla.js', 'las casillas del carro no se marcan', "c.zona === 'carro' ? ' carro'", "c.zona === 'carro' ? ''"],
  ['carro.js', 'el carro cuesta casi nada', 'tabla: 14, tronco: 4', 'tabla: 1, tronco: 4'],
  ['carro.js', 'el hierro es gratis', 'pesos: 6000', 'pesos: 0'],
  ['carro.js', 'la falta ignora la plata', 'const fp = CARRO.pesos - entero(pesos);', 'const fp = 0;'],
  ['carro.js', 'hacerlo no lo engancha', 'carro: true, enganchado: true })', 'carro: true, enganchado: false })'],
  ['carro.js', 'el enganche pide sólo estar enganchado', 'cab?.carro === true && cab?.enganchado === true;', 'cab?.enganchado === true;'],
  ['personal-caballo.js', 'se engancha lo que no se hizo', 'enganchado: v.carro === true && v.enganchado === true', 'enganchado: v.enganchado === true'],
  ['personal-caballo.js', 'el saneo pierde el carro', 'carro: v.carro === true,', 'carro: false,'],
  ['personal-caballo.js', 'el panel no ofrece engancharlo', 'if (d.carro) campoSi(', 'if (false) campoSi('],
  ['personal-caballo.js', 'el panel no dice dónde se hace', 'se hace en tu carpintería, con tablas, troncos y hierro', 'se compra'],
  ['personal-partida.js', 'la partida nueva hereda el carro', 'carro: false, enganchado: false };\n  return {', 'carro: resto.caballo.carro, enganchado: resto.caballo.enganchado };\n  return {'],
  ['caballo-mundo.js', 'el balancín sale blanco (un material donde va un color)', "tubo('#2e2c2a', 0.025", 'tubo(hierro, 0.025'],
  ['menus/sistema.css', 'las 52 casillas desbordan el panel', '.mochila-cuerpo .casillas { align-self: stretch; min-height: 0; overflow-y: auto;', '.mochila-cuerpo .casillas { align-self: stretch; min-height: 0;'],
  ['carro.js', 'el carro va pegado al caballo', 'largo: 2.05', 'largo: 1.2'],
  ['carro.js', 'el enganche queda sobre la cola', 'atras: 1.25', 'atras: 0.6'],
  ['caballo-mundo.js', 'el balancín no se acomoda al enganche', 'const gx = hx - (x1 * Math.cos(cs.yaw) + z2 * Math.sin(cs.yaw)), gz = hz - (-x1 * Math.sin(cs.yaw) + z2 * Math.cos(cs.yaw));', 'const gx = cs.x, gz = cs.z;'],
  ['caballo-mundo.js', 'el carro se hunde en el suelo', 'T.altura(gx - lx * 0.66, gz - lz * 0.66)) / 2, gz);', 'T.altura(gx - lx * 0.66, gz - lz * 0.66)) / 2 - 1.5, gz);'],
  ['caballo-mundo.js', 'el carro no se inclina con la pendiente', 'g.rotation.x = lerp(g.rotation.x, -Math.atan2(yA - yR, 2) ,', 'g.rotation.x = lerp(g.rotation.x, 0 ,'],
  ['caballo-mundo.js', 'las ruedas no giran', 'for (const w of carro.ruedas) w.rotation.x += giro;', 'for (const w of carro.ruedas) w.rotation.x += 0;'],
  ['caballo-mundo.js', 'atado al sulky sigue el carro', 'seguirCarro(dt, visible && est.conCarro && !sinCarro);', 'seguirCarro(dt, visible && est.conCarro);'],
  ['caballo-mundo.js', 'desenganchado se ve igual', 'est.conCarro = nuevo.carro === true && nuevo.enganchado === true;', 'est.conCarro = nuevo.carro === true;'],
  ['caballo-mundo.js', 'el carro no mira al enganche', 'cs.yaw = Math.atan2(dx, dz);', 'cs.yaw = est.yaw;'],
  ['caballo-mundo.js', 'cada vez se arma otra malla', 'if (!carro) { carro = mallaCarro();', 'if (true) { carro = mallaCarro();'],
  ['caballo-mundo.js', 'fuera de vista sigue el carro', 'if (!visible) { seguirCarro(dt, false); return; }', 'if (!visible) return;'],
  ['caballo-mundo.js', 'tras un salto el carro queda lejos', 'Math.hypot(dx, dz) > 8)', 'Math.hypot(dx, dz) > 8e9)'],
  ['main.js', 'fabricar no cobra el hierro', "if (!pagarPesos(progreso, CARRO.pesos, 'Hierro para el carro del caballo', 'Tu carpintería').ok)", 'if (false)'],
  ['main.js', 'fabricar no gasta los materiales', 'conMateriales((m) => { for (const k of Object.keys(CARRO.pide)) m[k] -= CARRO.pide[k]; });', ''],
  ['main.js', 'fabricar sin que alcance', 'if (!f.ok) { nota(', 'if (false) { nota('],
  ['main.js', 'fabricar de nuevo cobra otra vez', 'if (tieneCarro(cab)) {\n    nota(', 'if (false) {\n    nota('],
  ['main.js', 'hecho el carro no se rehace la mochila', 'aplicarPersonal();\n  refrescarCargaHud();', 'aplicarPersonal();'],
  ['main.js', 'hecho el carro no se ve en el mundo', 'aplicarPersonal();\n  refrescarCargaHud();', 'refrescarCargaHud();'],
  ['main.js', 'hecho el carro no se guarda', '  guardar();\n  return true;\n}\nfunction usarOficioPropio', '  return true;\n}\nfunction usarOficioPropio'],
  ['main.js', 'el HUD no se entera de engancharlo', 'cargaCarroVisto = casillasDelCarro(progreso.personal?.caballo) > 0;', 'cargaCarroVisto = false;'],
  ['main.js', 'la mochila no suma el carro en el desglose', 'CASILLAS_ALFORJAS : 0, casillasDelCarro(progreso.personal?.caballo));', 'CASILLAS_ALFORJAS : 0, 0);'],
  ['main.js', 'el sulky lleva el carro', '!!js.enSulky || (!js.montado && !!rinconesJuego?.caballoAtado?.()));', 'false);'],
  ['main.js', 'el banco no ofrece el carro', 'if (!desafio && tieneCaballo()) return avisoCarro(', 'if (false) return avisoCarro('],
  ['main.js', 'el banco ofrece el carro en el Desafío', 'if (!desafio && tieneCaballo()) return avisoCarro(', 'if (tieneCaballo()) return avisoCarro('],
  ['main.js', 'la E del banco no fabrica', 'if (!desafio && tieneCaballo() && usarCarpinteriaCarro()) return true;', 'if (false) return true;'],
];
let atrapadas = 0;
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-carro-'));
try {
  const archivos = cierre(RAIZ, ENTRADAS);
  const sobrevivieron = [];
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [archivo, nombre, de, a] = MUTACIONES[i];
    const dir = path.join(base, String(i)), src = path.join(dir, 'src');
    fs.mkdirSync(path.join(src, 'menus'), { recursive: true });
    for (const f of new Set([...archivos, 'main.js'])) fs.copyFileSync(path.join(RAIZ, 'src', f), path.join(src, f));
    fs.copyFileSync(path.join(RAIZ, 'src', 'menus', 'sistema.css'), path.join(src, 'menus', 'sistema.css'));
    const ruta = path.join(src, archivo), t = fs.readFileSync(ruta, 'utf8');
    assert.equal(t.split(de).length - 1, 1, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
    fs.writeFileSync(ruta, t.replace(de, () => a));
    try { await revisar(dir); sobrevivieron.push(nombre); } catch (e) { if (e?.code === 'ERR_ASSERTION' || e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) atrapadas++; else throw e; }
  }
  assert.deepEqual(sobrevivieron, [], `ninguna mutación sobrevive: ${sobrevivieron.join(' · ')}`);
} finally {
  fs.rmSync(base, { recursive: true, force: true });
}
console.log(`verificar-4-11-5-carro: ${total + guardado} comprobaciones OK · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
