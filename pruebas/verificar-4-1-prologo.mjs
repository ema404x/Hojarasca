// 4.1 (F4): el prólogo de Bruno (src/creador-prologo.js, src/personal-bruno.js, enchufe en main.js). Se prueba que:
//  · `prologoVisto` se guarda saneado: vale true salvo un false explícito; una partida vieja (sin el campo) y el Desafío no lo ven;
//  · sólo una partida NUEVA del Relax lo deja pendiente al crear a Bruno; `debeMostrarPrologo` lo pide sólo con Bruno creado y pendiente;
//  · la pantalla (DOM mínimo): 5 tarjetas con título y texto, siguiente / volver / saltar, la última lleva a la llegada, y alTerminar se llama una sola vez;
//  · main.js lo enchufa DESPUÉS de crear a Bruno y ANTES de entrar, y al terminar entra solo y deja el prólogo como visto.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const B = await imp('personal-bruno.js'), T = await imp('creador-textos.js');

// ---------------------------------------------------------------- 1. el estado
ok(B.brunoDefecto().prologoVisto === true, 'de fábrica el prólogo figura como visto (no se muestra solo)');
ok(B.sanearBruno({}).prologoVisto === true && B.sanearBruno(undefined).prologoVisto === true && B.sanearBruno(null).prologoVisto === true, 'una partida vieja (sin el campo) no lo ve');
ok(B.sanearBruno({ prologoVisto: false }).prologoVisto === false, 'un false explícito se conserva (pendiente)');
for (const raro of [0, '', 'no', null, undefined, 1, 'false', [], {}]) ok(B.sanearBruno({ prologoVisto: raro }).prologoVisto === true, `con ${JSON.stringify(raro)} queda como visto`);
assert.deepEqual(B.sanearBruno(B.sanearBruno({ prologoVisto: false })), B.sanearBruno({ prologoVisto: false })); ok(true, 'sanear es idempotente');
// la sección registrada (lo que guarda guardado.js) usa el mismo saneo
const P = await imp('personalizacion.js');
const sec = P.secciones().find((s) => s.id === 'bruno');
ok(sec && sec.sanear({ creado: true, prologoVisto: false }).prologoVisto === false && sec.porDefecto().prologoVisto === true, 'la sección «bruno» de Personalizar guarda el campo saneado');

// ---------------------------------------------------------------- 2. cuándo se muestra
ok(B.prologoVistoAlCrear(false, false) === false, 'una partida nueva del Relax lo deja pendiente al crear a Bruno');
ok(B.prologoVistoAlCrear(true, false) === true, 'una partida ya empezada no lo ve');
ok(B.prologoVistoAlCrear(false, true) === true && B.prologoVistoAlCrear(true, true) === true, 'ni el Desafío');
const creado = { creado: true, prologoVisto: false };
ok(B.debeMostrarPrologo(creado, false) === true, 'con Bruno creado y el prólogo pendiente, se muestra');
ok(B.debeMostrarPrologo(creado, true) === false, 'no en el Desafío');
ok(B.debeMostrarPrologo({ creado: false, prologoVisto: false }, false) === false, 'no antes de crear a Bruno (primero se crea)');
ok(B.debeMostrarPrologo({ creado: true, prologoVisto: true }, false) === false, 'no cuando ya se vio');
ok(B.debeMostrarPrologo(undefined, false) === false && B.debeMostrarPrologo(null, false) === false && B.debeMostrarPrologo({}, false) === false, 'con datos raros no se muestra');

// ---------------------------------------------------------------- 3. la pantalla (un DOM mínimo)
class Nodo {
  constructor(tag) { this.tag = tag; this.hijos = []; this.attrs = {}; this.className = ''; this.style = {}; this.oyentes = {}; this.padre = null; this.enfocado = false; }
  append(...xs) { for (const x of xs) { if (typeof x === 'string') this.hijos.push({ texto: x }); else { x.padre = this; this.hijos.push(x); } } }
  appendChild(x) { this.append(x); return x; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  set textContent(t) { this.hijos = [{ texto: t }]; }
  get textContent() { return this.hijos.map((h) => (h.texto !== undefined ? h.texto : h.textContent)).join(''); }
  remove() { if (this.padre) this.padre.hijos = this.padre.hijos.filter((h) => h !== this); this.padre = null; }
  nodos() { return this.hijos.filter((h) => h.tag).flatMap((h) => [h, ...h.nodos()]); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) { if (/^[a-z0-9]+$/.test(sel)) return this.nodos().filter((n) => n.tag === sel); const clases = sel.split(',').map((s) => s.trim().replace(/^\./, '').split('.')); return this.nodos().filter((n) => clases.some((cs) => cs.every((c) => n.className.split(' ').includes(c)))); }
  focus() { this.enfocado = true; }
  closest(sel) { return sel === 'button' && this.tag === 'button' ? this : null; }
  click() { for (const f of this.oyentes.click || []) f({}); }
}
const teclas = [];
const cuerpo = new Nodo('body');
globalThis.document = { createElement: (t) => new Nodo(t), body: cuerpo };
globalThis.window = { addEventListener: (t, f) => teclas.push([t, f]), removeEventListener: (t, f) => { const i = teclas.findIndex((x) => x[0] === t && x[1] === f); if (i >= 0) teclas.splice(i, 1); } };
const Pro = await imp('creador-prologo.js');
const tecla = (key, objetivo = null) => { const ev = { key, target: objetivo, parado: false, evitado: false, stopPropagation() { this.parado = true; }, preventDefault() { this.evitado = true; } }; for (const [t, f] of [...teclas]) if (t === 'keydown') f(ev); return ev; };
const titulo = (capa) => capa.querySelector('h1').textContent;
const texto = (capa) => capa.querySelector('.pb-texto').textContent;

// 3a. recorrido completo con el botón y con las teclas
let fin = null;
let p = Pro.abrirPrologo({ alTerminar: (saltado) => { fin = fin === null ? [saltado] : [...fin, saltado]; } });
let capa = cuerpo.hijos.find((h) => h.attrs?.id === 'prologo-bruno');
ok(!!capa && capa.attrs.role === 'dialog', 'se abre una capa de diálogo');
for (let i = 0; i < 5; i++) {
  ok(titulo(capa) === T.PROLOGO[i].titulo && texto(capa) === T.PROLOGO[i].texto, `pantalla ${i + 1}: «${T.PROLOGO[i].titulo}» con su texto`);
  ok(capa.querySelector('.pb-num').textContent === `${i + 1} de 5`, `pantalla ${i + 1}: dice «${i + 1} de 5»`);
  ok(capa.querySelector('.pb-puntos').nodos().length === 5 && capa.querySelector('.pb-puntos').nodos()[i].className.includes('act'), `pantalla ${i + 1}: el punto activo`);
  const botones = capa.querySelectorAll('.pb-boton').map((b) => b.textContent);
  ok(botones.includes(T.BOTONES_PROLOGO.saltar) && botones.includes(i === 4 ? T.BOTONES_PROLOGO.llegar : T.BOTONES_PROLOGO.siguiente), `pantalla ${i + 1}: botones de saltar y ${i === 4 ? 'llegar al refugio' : 'siguiente'}`);
  ok((i > 0) === botones.includes(T.BOTONES_PROLOGO.volver), `pantalla ${i + 1}: ${i > 0 ? 'tiene' : 'no tiene'} «Volver»`);
  ok(capa.querySelector('.pb-boton.principal').enfocado, `pantalla ${i + 1}: el botón principal tiene el foco`);
  if (i < 4) { const e = tecla('Enter'); ok(e.parado && e.evitado, 'Enter avanza y no deja pasar la tecla al juego'); }
}
tecla('ArrowLeft'); ok(titulo(capa) === 'La llegada', 'la flecha izquierda vuelve');
tecla('ArrowRight'); ok(titulo(capa) === 'El primer silencio', 'la flecha derecha avanza');
ok(fin === null, 'hasta acá no terminó');
tecla('ArrowRight');
ok(fin && fin.length === 1 && fin[0] === false, 'la última tarjeta termina el prólogo (no saltado) y llama a alTerminar una vez');
ok(!cuerpo.hijos.some((h) => h.attrs?.id === 'prologo-bruno') && teclas.length === 0, 'la capa se cierra del todo y suelta las teclas');
tecla('Enter'); ok(fin.length === 1, 'después de cerrar, una tecla no vuelve a llamar a alTerminar');
p.siguiente(); p.cerrar(); ok(fin.length === 1, 'ni cerrarlo de nuevo');

// 3b. saltarlo (Escape y botón)
fin = null; p = Pro.abrirPrologo({ alTerminar: (s) => { fin = (fin || []).concat([s]); } });
tecla('Enter'); tecla('Enter');
const e = tecla('Escape'); ok(e.parado && e.evitado && fin.length === 1 && fin[0] === true, 'Escape lo salta desde cualquier pantalla (saltado = true)');
fin = null; p = Pro.abrirPrologo({ alTerminar: (s) => { fin = (fin || []).concat([s]); } });
capa = cuerpo.hijos.find((h) => h.attrs?.id === 'prologo-bruno');
capa.querySelectorAll('.pb-boton').find((b) => b.textContent === T.BOTONES_PROLOGO.saltar).click();
ok(fin && fin[0] === true && !cuerpo.hijos.some((h) => h.attrs?.id === 'prologo-bruno'), 'el botón «Saltar el prólogo» lo salta');
// sobre un botón, Enter hace lo del botón (no avanza dos veces)
fin = null; p = Pro.abrirPrologo({ alTerminar: (s) => { fin = (fin || []).concat([s]); } });
const ev = tecla('Enter', capa.querySelector ? cuerpo.hijos.find((h) => h.attrs?.id === 'prologo-bruno').querySelector('.pb-boton') : null);
ok(ev.parado && !ev.evitado && p.indice() === 0, 'con el foco en un botón, Enter es del botón y no avanza solo');
tecla('x'); tecla('a'); ok(p.indice() === 0, 'otras teclas no hacen nada, pero tampoco llegan al juego');
p.cerrar();
delete globalThis.document; delete globalThis.window;

// ---------------------------------------------------------------- 4. el enchufe en main.js
const main = leer('src/main.js');
ok(main.includes("import { abrirPrologo } from './creador-prologo.js';") && main.includes('debeMostrarPrologo, prologoVistoAlCrear'), 'main.js importa el prólogo');
const iEntrar = main.indexOf("$('btn-entrar').addEventListener('click'");
const iCrear = main.indexOf('crearABruno(\'crear\', () => $(\'btn-entrar\').click())', iEntrar);
const iProlo = main.indexOf('debeMostrarPrologo(progreso.personal?.bruno, esDesafio)', iEntrar);
const iSinFin = main.indexOf('// 3.8.4: la corrida sin fin fija su dificultad', iEntrar);
ok(iEntrar > 0 && iCrear > iEntrar && iProlo > iCrear && iSinFin > iProlo, 'al entrar: primero se crea a Bruno, después va el prólogo y recién después se entra');
const bloque = main.slice(iProlo, iSinFin);
ok(bloque.includes('abrirPrologo(') && bloque.includes("cambiarPersonal(sB, { prologoVisto: true })") && bloque.includes("$('btn-entrar').click()") && bloque.includes('return;'), 'al terminar o saltarlo: lo deja visto y entra solo');
ok(main.includes('prologoVisto: prologoVistoAlCrear(!!progreso.pos || entroAlJuego, esDesafio)'), 'al crear a Bruno se decide si el prólogo queda pendiente (partida nueva del Relax)');
ok(/!sinCreadorDeBruno\(\) && debeMostrarPrologo/.test(main), 'y en depuración común (las pruebas de humo) no aparece');
const fuente = leer('src/creador-prologo.js');
ok(!/from 'three'/.test(fuente) && !/WebGL/.test(fuente), 'el prólogo no usa three');
ok(/prefers-reduced-motion/.test(fuente), 'y respeta «reducir movimiento»');

console.log(`OK 4.1 prólogo de Bruno · ${pasos} verificaciones · estado saneado, cuándo se muestra, 5 tarjetas con teclas y botones, y el enchufe en el flujo de entrada`);
