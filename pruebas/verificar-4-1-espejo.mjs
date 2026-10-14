// 4.1 (F2): el espejo de Bruno (src/planos-espejo.js) y cómo se conecta al juego. Las reglas del plan para que nadie se quede sin poder rehacer su aspecto:
//  · no cuesta materiales (se puede armar sin nada en la mochila);
//  · siempre está en los planos: no tiene tope de cuántos se pueden armar ni pide haber avanzado en nada;
//  · cada refugio nuevo trae uno armado (se coloca al crear a Bruno, una sola vez por partida);
//  · si no hay ninguno armado, el panel de Bruno ofrece el botón de respaldo;
//  · usarlo con E abre la pantalla de creación en modo «rehacer» (el aspecto; no el carácter ni la ropa de abrigo).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
const CON = await imp('construccion.js'), E = await imp('planos-espejo.js'), B = await imp('personal-bruno.js'), { Constructor } = await imp('geometria.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. la pieza
const p = CON.PLANO.espejo;
ok(!!p && p.nombre === 'Espejo de pie' && p.pieza === true, 'el espejo está entre los planos, como pieza');
ok(CON.PLANOS.filter((x) => x.id === 'espejo').length === 1, 'una sola vez en la lista de planos');
ok(p.categoria === 'mobiliario' && p.soloRelax === true && p.funciones.includes('espejo'), 'es de mobiliario, sólo del Relax, y se usa (función «espejo»)');
ok(p.etapas.length === 1 && p.etapas[0].termina === true, 'se arma en una sola etapa');
ok(JSON.stringify(p.etapas[0].pide) === '{}', 'no pide ningún material');
ok(CON.faltan(p.etapas[0].pide, {}).length === 0 && CON.faltan(p.etapas[0].pide, { tabla: 0, tronco: 0 }).length === 0, 'con la mochila vacía no falta nada');
ok(!('requiere' in p) && !('desbloqueo' in p) && !('pide' in p && Object.keys(p.pide).length > 0), 'no pide haber avanzado en nada');
ok(!('maximo' in p) && !('unico' in p) && !('limite' in p), 'no tiene tope de cuántos se pueden armar');
ok(p.ancho > 0 && p.fondo > 0 && p.alto >= 1.6 && p.radio >= 0.4, 'su tamaño es el de un espejo de pie');
ok(typeof p.arma === 'function' && typeof p.fisica === 'function', 'se dibuja y choca');
ok(E.ESPEJO_QUE_SE_USA.espejo === 'Mirarte al espejo', 'el aviso al acercarse dice «Mirarte al espejo»');
for (const t of [E.ESPEJO_QUE_SE_USA.espejo, p.nombre, p.texto]) ok(!t.includes('Desafío'), 'sin la palabra «Desafío» en lo que se ve');
ok(p.texto.includes('rehacer') && p.texto.includes('carácter'), 'el texto del plano explica que se rehace el aspecto y que el carácter no cambia');

// la geometría real (llano y con terreno): dibuja, sin números rotos, sólo madera y piedra, no se hunde y entra en lo que dice medir
for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {
  const c = new Constructor();
  p.etapas[0].arma(c, p, {}, suelo);
  ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), 'dibuja algo, sin números rotos');
  ok(c.tipo.every((t) => t === 0 || t === 4), 'sólo madera y piedra (tipo 0 y 4)');
}
{
  const c = new Constructor();
  p.etapas[0].arma(c, p, {}, null);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) {
    x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]);
  }
  ok(y0 >= -0.02, `no se hunde en el piso (${y0.toFixed(2)})`);
  ok(y1 <= p.alto + 0.12 && y1 >= p.alto * 0.8, `llega casi a su alto y no se pasa (${y1.toFixed(2)} de ${p.alto})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= p.ancho / 2 + 0.12, `entra en su ancho (${x0.toFixed(2)}..${x1.toFixed(2)})`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= p.fondo / 2 + 0.12, `entra en su fondo (${z0.toFixed(2)}..${z1.toFixed(2)})`);
}
const reg = { segmentos: [], circulos: [], plataformas: [] };
p.fisica({ segmento: (...a) => reg.segmentos.push(a), circulo: (...a) => reg.circulos.push(a), plataforma: (...a) => reg.plataformas.push(a) });
const totalFis = reg.segmentos.length + reg.circulos.length + reg.plataformas.length;
ok(totalFis >= 1 && [...reg.segmentos, ...reg.circulos, ...reg.plataformas].every((a) => a.every(Number.isFinite)), 'choca (el espejo es un mueble de pie), con números buenos');

// ---------------------------------------------------------------- 2. el guardado
ok(B.brunoDefecto().espejoPuesto === false, 'de fábrica, el espejo todavía no se colocó');
ok(B.sanearBruno({ espejoPuesto: true }).espejoPuesto === true && B.sanearBruno({ espejoPuesto: 'sí' }).espejoPuesto === false && B.sanearBruno({}).espejoPuesto === false, '`espejoPuesto` sólo es verdadero si vino verdadero');
assert.deepEqual(B.sanearBruno(B.sanearBruno({ espejoPuesto: true })), B.sanearBruno({ espejoPuesto: true })); ok(true, 'sanear es idempotente con el espejo');

// ---------------------------------------------------------------- 3. el panel de Bruno (con un DOM mínimo)
class Nodo {
  constructor(tag) { this.tag = tag; this.hijos = []; this.textContent = ''; this.className = ''; this.listeners = {}; }
  appendChild(n) { this.hijos.push(n); return n; }
  setAttribute() {}
  addEventListener(t, f) { this.listeners[t] = f; }
  texto() { return this.textContent + this.hijos.map((h) => h.texto()).join(''); }
  todos() { return [this, ...this.hijos.flatMap((h) => h.todos())]; }
}
globalThis.document = { createElement: (t) => new Nodo(t), createTextNode: (t) => { const n = new Nodo('#t'); n.textContent = t; return n; } };
const seccion = (await imp('personal-todo.js')).secciones().find((s) => s.id === 'bruno');
const panel = (datos, bruno) => { const cont = new Nodo('div'); seccion.construir(cont, { datos, progreso: {}, mundo: { bruno } }); return cont; };
const botones = (cont) => cont.todos().filter((n) => n.tag === 'button');
let abierto = 0;
const gancho = (hay) => ({ hayEspejo: () => hay, abrirCreador: () => { abierto++; } });
const sinCrear = panel({ ...B.brunoDefecto(), creado: false }, gancho(false));
ok(botones(sinCrear).length === 1 && botones(sinCrear)[0].textContent === 'Crear a Bruno', 'sin crear: el botón es «Crear a Bruno»');
const conEspejo = panel({ ...B.brunoDefecto(), creado: true }, gancho(true));
ok(botones(conEspejo).length === 0 && conEspejo.texto().includes('mirate con E'), 'creado y con espejo: sin botón, y dice que se usa el espejo con E');
const sinEspejo = panel({ ...B.brunoDefecto(), creado: true }, gancho(false));
ok(botones(sinEspejo).length === 1 && botones(sinEspejo)[0].textContent === 'Rehacer a Bruno' && sinEspejo.texto().includes('No tenés ningún espejo armado'), 'creado y sin espejo: botón de respaldo y aviso de dónde armar uno');
botones(sinEspejo)[0].listeners.click(); ok(abierto === 1, 'el botón de respaldo abre la creación');
const mundoVacio = panel({ ...B.brunoDefecto(), creado: true }, undefined);
ok(botones(mundoVacio).length === 0, 'antes de armar el mundo el panel no se rompe (no hay botones)');
delete globalThis.document;

// ---------------------------------------------------------------- 4. la conexión con el juego (se lee el texto)
const main = leer('src/main.js'), cons = leer('src/construccion.js');
const tiene = (t, x) => t.includes(x);
ok(tiene(cons, "import { PIEZAS_ESPEJO } from './planos-espejo.js';") && tiene(cons, 'PIEZAS.push(...PIEZAS_ESPEJO);'), 'construccion.js suma el espejo a las piezas, con el import en una línea');
ok(tiene(main, "import { ESPEJO_QUE_SE_USA } from './planos-espejo.js';") && tiene(main, 'OBRAS_QUE_TRABAJAN.push(...Object.keys(ESPEJO_QUE_SE_USA));'), 'main.js lo registra entre las obras que se usan');
ok(tiene(main, "case 'espejo': return ESPEJO_QUE_SE_USA.espejo;") && tiene(main, "case 'espejo': crearABruno('rehacer', () => dibujarPersonal()); return true;"), 'el aviso y la acción: usarlo abre la creación en modo rehacer');
ok(tiene(main, 'function colocarEspejoDeFabrica()') && tiene(main, "if (modo === 'crear') colocarEspejoDeFabrica();"), 'al CREAR a Bruno (no al rehacer) se coloca el espejo de fábrica');
ok(tiene(main, '!sBruno || !obras || esDesafio || progreso.personal?.bruno?.espejoPuesto || !PLANO.espejo'), 'sólo en el Relax, una sola vez por partida y si el plano existe');
ok(tiene(main, 'progreso.obras = obras.obras.map((o) => o.datos); puesto = true;'), 'el espejo se agrega a lo que se guarda (si no, no sobrevive a recargar)');
ok(tiene(main, 'finally { try { obras.elegir(previo); } catch'), 'se devuelve el plano que estaba elegido (no se pisa lo que el jugador tenía en la mano)');
ok(tiene(main, 'if (puesto) cambiarPersonal(sBruno, { espejoPuesto: true });'), 'sólo se marca como puesto si hay un espejo');
ok(tiene(main, 'hayEspejo: () => hayEspejoArmado(),'), 'el panel de Bruno puede preguntar si hay espejo');
for (const n of ['src/planos-espejo.js']) {
  const t = leer(n);
  ok(!t.includes(CR), `${n}: fines de línea LF`);
  ok(t.split(LF).filter((l) => l.startsWith('import ')).every((l) => l.endsWith(';') && !l.includes('//') && l.includes(' from ')), `${n}: los imports entran en una línea y sin comentario (armar.mjs)`);
}

console.log(`OK 4.1 espejo de Bruno · ${pasos} verificaciones · pieza gratis y siempre en los planos, espejo de fábrica, respaldo del panel y conexión con el juego`);
