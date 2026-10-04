// 3.6.1 (mundo): los arreglos del mundo físico y visual de la aldea.
//  · las luces del presupuesto de 4 se cambian fundidas (antes, de golpe: el charco de luz de un farol
//    se prendía y apagaba caminando por la calle, a veces ida y vuelta cada medio metro);
//  · la puerta de la escuela abre para afuera y la de la sala de miel tiene la bisagra del lado del
//    extractor (abiertas, la hoja cortaba el paso a media aula y al mostrador);
//  · las paredes de tablas completan la fila que corta un hueco (rendija bajo cada ventana);
//  · los carteles del valle achican el texto hasta entrar (RAMOS GENERALES sin la R ni la S) y los
//    postes de los carteles de la aldea no tapan las letras;
//  · el suelo: lejos, la gruesa vuelve al terreno emparejado (no al de antes) y el parche no queda
//    nunca bajo la gruesa hundida;
//  · el mapa no escribe un nombre encima de otro.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const leer = (r) => fs.readFileSync(new URL(r, import.meta.url), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- las luces fundidas
const ctx = vm.createContext({ console, performance: { now: () => 0 } });
vm.runInContext(`${leer('../three-r186-inline.js')}\n;globalThis.THREE = THREE;`, ctx);
const L = vm.runInContext(`(() => {
${leer('../src/luces.js').replace("import * as THREE from 'three';", '').replace(/^export /gm, '')}
return { fundirLuces, FUNDIDO_LUZ };
})()`, ctx);
{
  const a = { n: 'a' }, b = { n: 'b' }, c = { n: 'c' };
  const lug = [];
  // entra a un lugar libre: entera (como siempre)
  L.fundirLuces(lug, [{ fuente: a, puntaje: 1 }, { fuente: b, puntaje: 2 }], 2, 0);
  ok(lug[0].fuente === a && lug[0].peso === 1 && lug[1].fuente === b && lug[1].peso === 1, 'las que entran a un lugar libre, enteras');
  // llega c, más cerca que b: b se apaga de a poco y c espera; después c se prende de a poco
  const pesos = [];
  for (let k = 0; k < 30; k++) { L.fundirLuces(lug, [{ fuente: a, puntaje: 1 }, { fuente: c, puntaje: 1.5 }, { fuente: b, puntaje: 2 }], 2, 0.05); pesos.push(lug.map((l) => (l.fuente ? l.fuente.n + l.peso.toFixed(2) : '-')).join(' ')); }
  let salto = 0, prev = { b: 1, c: 0 };
  for (let k = 0; k < 30; k++) {
    L.fundirLuces(lug, [{ fuente: a, puntaje: 1 }, { fuente: c, puntaje: 1.5 }, { fuente: b, puntaje: 2 }], 2, 0);
    const pb = lug.find((l) => l.fuente === b)?.peso ?? 0, pc = lug.find((l) => l.fuente === c)?.peso ?? 0;
    salto = Math.max(salto, Math.abs(pb - prev.b), Math.abs(pc - prev.c)); prev = { b: pb, c: pc };
  }
  ok(lug.some((l) => l.fuente === c && l.peso === 1) && !lug.some((l) => l.fuente === b), `c termina entera y b afuera (${pesos[pesos.length - 1]})`);
  ok(pesos.some((p) => /b0\.[1-9]/.test(p)) && pesos.some((p) => /c0\.[1-9]/.test(p)), `el cambio pasa por pesos intermedios (${pesos.slice(0, 12).join(' | ')})`);
  // ida y vuelta: si la que se iba vuelve a quedar entre las elegidas, sube de nuevo sin apagarse
  const l2 = [];
  L.fundirLuces(l2, [{ fuente: a, puntaje: 1 }, { fuente: b, puntaje: 2 }], 1, 0);
  let minimo = 1;
  for (let k = 0; k < 40; k++) {
    const gana = k % 4 < 2 ? a : b;   // se turnan cada dos cuadros (lo que pasaba en la calle)
    L.fundirLuces(l2, [{ fuente: gana, puntaje: 1 }, { fuente: gana === a ? b : a, puntaje: 1.01 }], 1, 0.05);
    if (l2[0].fuente === a) minimo = Math.min(minimo, l2[0].peso);
  }
  ok(minimo > 0.5 && l2[0].fuente === a, `turnándose cada dos cuadros no parpadea (la luz no baja de ${minimo.toFixed(2)})`);
  // lo que deja de contar (oculta, fuera de la vista) sale en el acto
  L.fundirLuces(l2, [], 1, 0.05);
  ok(!l2[0].fuente, 'una que deja de contar sale en el acto');
  ok(L.FUNDIDO_LUZ >= 0.2 && L.FUNDIDO_LUZ <= 0.6, 'un fundido corto');
  const fuente = leer('../src/luces.js');
  ok(fuente.includes('fundirLuces(lugaresP, candP, puntuales, dt);') && fuente.includes('fijasP[i].intensity *= l.peso;'), 'el presupuesto usa el reparto fundido');
}

// ---------------------------------------------------------------- arquitectura, carteles, terreno, mapa
{
  const t = leer('../src/aldea-arquitectura.js');
  ok(t.includes("nombre: 'la puerta de la escuela', adentro: false }"), 'la puerta de la escuela abre para afuera');
  ok(t.includes("nombre: 'la puerta de la sala de miel', lado: 1 }"), 'la sala de miel, con la bisagra del lado del extractor');
  ok(t.includes('lado: h.puerta.lado ?? -1, adentro: h.puerta.adentro ?? true'), 'casco respeta el lado y el sentido de cada puerta');
  ok(/la fila que corta un hueco a la mitad se completa abajo y arriba/.test(t) && t.includes('[[ya, Math.min(yb, hu.y0)], [Math.max(ya, hu.y1), yb]]'), 'las paredes de tablas completan la fila alrededor de los huecos');
  ok(t.includes('palo(c, [5.4 + l * 1.15,') && t.includes('palo(c, [x + l * 0.85,'), 'los postes de los carteles de la plaza y de los lotes fuera de las letras');
  const e = leer('../src/estructuras.js');
  ok(/while \(tam > 20 && x\.measureText\(texto\)\.width > 440\)/.test(e), 'los carteles del valle achican el texto hasta entrar');
  const m = leer('../src/aldea-mundo.js');
  ok(m.includes('alta.push(T.altura(i * s - 512, j * s - 512))'), 'lejos, la gruesa vuelve al terreno emparejado');
  ok(m.includes('if (b < 1) h = Math.max(h, hundida(x, z) + 0.05 * b);'), 'el parche nunca queda bajo la gruesa hundida');
  const mapa = leer('../src/mapa.js');
  ok(mapa.includes('rotular(l.nombre, px, py, W / 60, W / 38);') && mapa.includes('rotular(m.nombre, px, py, W / 90, W / 50);'), 'el mapa acomoda los nombres');
}

// el texto de un cartel que no entra se achica (con un lienzo de mentira que mide según la letra)
{
  const est = leer('../src/estructuras.js');
  const cuerpo = est.slice(est.indexOf('function cartelTextura(texto) {'), est.indexOf('// 2.7.3: el mismo repaso'));
  let usado = null;
  const fake = { fillRect() {}, beginPath() {}, moveTo() {}, bezierCurveTo() {}, stroke() {},
    set font(f) { this._f = f; }, get font() { return this._f; },
    measureText(t) { return { width: t.length * Number(/(\d+)px/.exec(this._f)[1]) * 0.62 }; },
    fillText(t) { usado = this.measureText(t).width; } };
  const c2 = vm.createContext({ document: { createElement: () => ({ getContext: () => fake }) }, THREE: { CanvasTexture: function () {}, SRGBColorSpace: 1 }, Math });
  const cartelTextura = vm.runInContext(`(${cuerpo.replace('function cartelTextura', 'function')})`, c2);
  cartelTextura('RAMOS GENERALES');
  ok(usado <= 440, `RAMOS GENERALES entra en la tabla (${Math.round(usado)} de 512 px)`);
  cartelTextura('Faro');
  ok(/58px/.test(fake.font), 'un texto corto queda con su letra de siempre');
}

console.log(`OK 3.6.1 mundo · ${pasos} comprobaciones · luces fundidas, puertas que no cortan el paso, paredes sin rendijas, carteles que entran, el suelo sin saltos, el mapa sin nombres encimados`);
