// 1.6: defensas con más juego — foso con estacas, portón con tranca y el parte de la base.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { resumirBase, htmlBase, consejoBase, categoriaDe, CATEGORIAS_BASE } from '../src/base-estado.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---- piezas nuevas (construccion.js importa three: se revisa el texto, como las demás pruebas)
const cons = leer('src/construccion.js');
const bloqueDe = (id) => {
  const i = cons.indexOf(`id: '${id}'`);
  assert.ok(i > 0, `falta la pieza ${id}`);
  return cons.slice(i, i + 900);
};
const foso = bloqueDe('foso-estacas');
assert.match(foso, /soloDesafio: true, categoria: 'defensa'/);
assert.match(foso, /defensa: \{ tipo: 'foso', largo: [\d.]+, ancho: [\d.]+, dano: \d+, usos: \d+, freno: [\d.]+ \}/, 'el foso tiene que lastimar, frenar y gastarse');
const def = leer('src/desafio-defensas.js');
assert.match(def, /case 'foso': fosos\.push\(o\); break;/, 'las defensas activas tienen que conocer el foso');
assert.match(def, /o\.datos\.usos = \(o\.datos\.usos \?\? f\.usos\) - 1;/, 'el foso se gasta con cada invasor');
assert.match(def, /api\.herirAlien\(a, f\.dano/, 'el foso lastima al que lo cruza');
assert.match(foso, /pide: \{ tronco: 3, tabla: 2 \}/);
assert.ok(!/fisica\(h\)/.test(foso), 'el foso no bloquea el paso: es un pozo, no una pared');
const porton = bloqueDe('porton-reforzado');
assert.match(porton, /soloMejora: true/);
assert.match(leer('src/desafio-reglas.js'), /'porton-empalizada': \{ a: 'porton-reforzado'/, 'el portón se refuerza desde el taller');
assert.match(porton, /porton: true/);
const vidaDe = (b) => Number(/vida: (\d+)/.exec(b)?.[1]);
assert.ok(vidaDe(porton) > vidaDe(bloqueDe('porton-empalizada')), 'el portón reforzado tiene que aguantar más');
assert.match(cons, /'foso-estacas': 'defensa', 'porton-reforzado': 'defensa'/);

// ---- el parte de la base
assert.equal(resumirBase([]).total, 0);
assert.match(consejoBase(resumirBase([])), /Todavía no levantaste/);
const piezas = [
  { id: 'empalizada', nombre: 'Empalizada', vida: 320, max: 320, dist: 8 },
  { id: 'porton-empalizada', nombre: 'Portón', vida: 120, max: 380, dist: 4 },
  { id: 'antorcha', nombre: 'Antorcha', vida: 60, max: 80, dist: 6 },
];
const r = resumirBase(piezas);
assert.equal(r.total, 3);
assert.equal(r.dañadas, 2);
assert.equal(r.filas[0].nombre, 'Portón', 'lo más roto va primero');
assert.equal(r.filas[0].pct, 32);
assert.equal(categoriaDe('empalizada'), 'muro');
assert.equal(categoriaDe('foso-estacas'), 'trampa');
assert.equal(categoriaDe('ballesta-fija'), 'arma');
assert.equal(categoriaDe('lo-que-sea'), 'apoyo');
assert.match(consejoBase(r), /Portón está en 32%/);
const sano = resumirBase([{ id: 'empalizada', nombre: 'Empalizada', vida: 320, max: 320, dist: 3 }]);
assert.match(consejoBase(sano), /trampas/, 'si no hay trampas, lo sugiere');
const conTrampa = resumirBase([...piezas.slice(0, 1), { id: 'foso-estacas', nombre: 'Foso', vida: 220, max: 220, dist: 9 }]);
assert.match(consejoBase(conTrampa, { noche: 6, cristales: 5 }), /semillas doradas/);
// el HTML no se rompe ni deja pasar etiquetas
const html = htmlBase(r, { noche: 2, cristales: 0 });
assert.match(html, /salud media/);
assert.match(html, /--pct:32%/);
assert.ok(!/<script/i.test(htmlBase(resumirBase([{ id: 'x', nombre: '<script>x</script>', vida: 1, max: 1 }]))));
for (const c of CATEGORIAS_BASE) assert.ok(c.clave && c.nombre && Array.isArray(c.ids));

// ---- cableado
const main = leer('src/main.js'), plantilla = leer('src/plantilla.html');
for (const id of ['base', 'base-contenido', 'btn-base', 'cerrar-base']) assert.ok(plantilla.includes(`id="${id}"`), `falta #${id}`);
assert.match(main, /\/\/ fuera del modo obra, N muestra cómo están las defensas\s*\n\s*if \(desafio\) \{ abrir\('pausa'\); abrirBase\('pausa'\); \}/, 'N abre el parte de la base');
assert.match(main, /function piezasDeLaBase\(\)/);
assert.match(main, /vidaMaxObra\(o\.plano, o\.datos\.etapas\)/);
console.log('base: ok · foso, portón con tranca y parte de las defensas');
