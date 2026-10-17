// 4.0.1 · El creador de Bruno no deja la capa beige colgada si falla el segundo contexto 3D (zona B, hallazgo 1).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const hijosCuerpo = [];
const el = () => ({ children: [], style: {}, append(...x) { this.children.push(...x); }, appendChild(x) { this.children.push(x); }, setAttribute() {}, addEventListener() {}, remove() { this.quitado = true; },
  getContext() { return null; }, querySelector() { return null; } });
globalThis.document = { createElement: () => el(), body: { appendChild: (x) => hijosCuerpo.push(x) } };
globalThis.window = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
const { abrirCreador } = await import('../src/creador-pantalla.js');
const { genomaDesdePersonajeViejo } = await import('../src/creador-personaje.js');
const avisos = []; const aviso = console.warn; console.warn = (...a) => avisos.push(a);
const r = abrirCreador({ genoma: genomaDesdePersonajeViejo({}), modo: 'crear', alAceptar() {}, alCancelar() {} });
console.warn = aviso;
assert.equal(r, null, 'sin contexto 3D devuelve null en vez de tirar');
assert.equal(hijosCuerpo.length, 0, 'y no cuelga la capa del DOM');
assert.ok(avisos.length >= 1, 'deja un aviso en la consola');

const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
assert.ok(/if \(!creadorAbierto\) \{\s*if \(modo === 'crear'\) \{ opcionesCreador\.alAceptar\(base, ''\)/.test(main), 'main.js: si la pantalla no abre, crear sigue con el genoma de partida');
const pantallaTxt = fs.readFileSync(new URL('../src/creador-pantalla.js', import.meta.url), 'utf8');
assert.ok(pantallaTxt.includes('renderer.setPixelRatio(1);') && pantallaTxt.indexOf('renderer.setPixelRatio(1);') < pantallaTxt.indexOf('renderer.setSize(240, 300, false);'), 'el retrato se saca a 240x300 reales, sin la escala de la pantalla');
const prologoTxt = fs.readFileSync(new URL('../src/creador-prologo.js', import.meta.url), 'utf8');
assert.ok(prologoTxt.includes("if (e.repeat && (e.key === 'Enter'"), 'el prólogo ignora las teclas repetidas');
console.log('4.0.1 creador: sin WebGL no queda capa colgada y se entra igual');
