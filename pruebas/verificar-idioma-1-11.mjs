// 1.11 — todo lo nuevo también en inglés (tanda L, src/idioma-en-l.js).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EN } from '../src/idioma-en.js';
import { crearTraductor } from '../src/idioma.js';
import { ENTRADA } from '../src/cuaderno.js';
import { PEDIDOS, partesDeCarta, partesDeEnvio, dePara } from '../src/correo.js';
import { TRUEQUE } from '../src/trueque.js';
import { RECETAS_FUEGO, textoPide } from '../src/cocina.js';
import { TEJIDOS, textoTelar } from '../src/telar.js';
import { gallineroNuevo, textoGallinero, NIDAL } from '../src/gallinero.js';
import { OFERTAS, textoOferta } from '../src/feria.js';
import { RASTREABLES, nombreRastro } from '../src/rastreo.js';
import { VISITANTES, ORDEN } from '../src/visitas.js';
import { ORDENES, NOMBRE_ORDEN, RESPUESTAS } from '../src/desafio-ordenes.js';
import { RECETAS as RECETAS_TALLER } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const t = crearTraductor(EN, 'en').t;
const falta = [];
// lo que en inglés se dice igual ("Torta frita", "2 ponchos") cuenta si está en el diccionario
const traducido = (texto, donde) => { if (texto && t(texto) === texto && EN[texto] === undefined) falta.push(`${donde}: «${texto}»`); };
const NOMBRES = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Ema', ercilia: 'Ercilia' };
const may = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- el cuaderno
for (const id of ['huevo', 'gallina', 'guiso-campo', 'tortilla-papas', 'torta-frita', 'harina', 'poncho', 'feria', 'rastreo', 'visita', ...PEDIDOS.map((c) => c.id)]) {
  const e = ENTRADA[id];
  assert.ok(e, `falta la entrada ${id}`);
  for (const campo of ['nombre', 'pista', 'texto']) traducido(e[campo], `cuaderno ${id}.${campo}`);
  if (e.cientifico && !/^[A-Z][a-z]+( [a-z.]+){1,2}$/.test(e.cientifico)) traducido(e.cientifico, `cuaderno ${id}.cientifico`);
}

// ---------------------------------------------------------------- los planos nuevos (el fuente importa three)
const planos = leer('src/construccion.js');
for (const id of ['gallinero', 'telar']) {
  const m = new RegExp(`id: '${id}', nombre: '([^']+)'[\\s\\S]*?texto: '([^']+)'`).exec(planos);
  assert.ok(m, `no encontré el plano ${id}`);
  traducido(m[1], `plano ${id}`);
  traducido(m[2], `plano ${id}.texto`);
}

// ---------------------------------------------------------------- gallinero, cocina, telar, almacén
const g = gallineroNuevo(1);
for (let dia = 1; dia <= 4; dia++) traducido(textoGallinero(g, dia), `gallinero día ${dia}`);
traducido(textoGallinero({ desde: 1, juntados: 3 }, 1), 'gallinero con uno');
traducido(textoGallinero({ desde: 5, juntados: 0 }, 1), 'gallinero vacío');
for (let n = 2; n <= NIDAL; n++) traducido(`Juntaste ${n} huevos`, 'nota');
for (const s of ['Juntaste un huevo', 'El nidal está vacío', 'Las gallinas ponen de día: mañana va a haber', 'Llevás 7']) traducido(s, 'gallinero');
for (const rc of RECETAS_FUEGO) { traducido(may(rc.nombre), `receta ${rc.id}`); traducido(textoPide(rc), `receta ${rc.id} pide`); }
traducido(`Se puede hacer algo con ${RECETAS_FUEGO.slice(1, 5).map((x) => textoPide(x)).join('; ')}`, 'cocina sin nada');
for (const lana of [0, 2, 3, 4]) for (const cosas of [{}, { manta: 1 }]) traducido(textoTelar(lana, cosas), `telar ${lana}`);
for (const s of ['Tejiste una manta', 'Tejiste un poncho', 'Ahora podés dormir en cualquier lado, sin fuego (T)', 'Llevás 2. En la feria de la estación los cambian bien',
  'No alcanza la lana', `Hacen falta ${TEJIDOS.poncho.lana} vellones para un poncho. La majada está en el galpón`]) traducido(s, 'telar');
for (const campo of ['nombre', 'texto', 'efecto']) traducido(TRUEQUE.harina[campo], `almacén harina.${campo}`);
traducido('Elegí con el número o con un clic · Escape para salir', 'almacén');

// ---------------------------------------------------------------- la feria
for (const o of OFERTAS) {
  const x = textoOferta(o);
  traducido(o.texto, `feria ${o.id}`);
  traducido(`da ${x.da} por ${x.pide}`, `feria ${o.id}`);
  traducido(x.pide, `feria ${o.id} pide`);
  traducido(x.da, `feria ${o.id} da`);
  traducido(`Fui a la feria de la estación y cambié con ${o.texto.charAt(0).toLowerCase() + o.texto.slice(1)}.`, `diario feria ${o.id}`);
}
for (const s of ['La feria de la estación', 'Puestos junto al andén, hasta las seis. Cada cambio, una vez por feria.', 'ya cambiado', 'se puede cambiar', 'falta juntar',
  'Ese ya lo cambiaste', 'Vuelve en la próxima feria', 'Todavía te falta', 'Cambiaste en la feria', 'Hoy hay feria en la estación',
  'Junto al andén de la Estación del Valle, hasta las seis de la tarde', 'Ver la feria', 'Feria de la estación', 'Día de feria: hice 3 cambios junto al andén.']) traducido(s, 'feria');

// ---------------------------------------------------------------- rastrear
for (const tipo of RASTREABLES) {
  traducido(`Es ${nombreRastro(tipo)}. Acercate despacio`, `rastro ${tipo}`);
  traducido(`El perro tomó un rastro y me llevó hasta ${nombreRastro(tipo)}.`, `diario rastro ${tipo}`);
}
for (const s of ['Pedirle al perro que rastree', 'Dejar el rastro', 'El perro olfatea y vuelve', 'No hay rastros frescos por acá. Probá más adentro del bosque o en la estepa',
  'El perro tomó un rastro', 'Seguilo: te espera si te quedás atrás. E de nuevo mirándolo para dejarlo', 'El perro lo encontró', 'Se perdió el rastro',
  'El animal se fue lejos. El perro vuelve con vos', 'El rastro se enfrió', 'Ya no huele a nada. El perro vuelve con vos', 'Dejaste el rastro', 'El perro vuelve con vos',
  'Seguimos 2 rastros con el perro.']) traducido(s, 'rastro');

// ---------------------------------------------------------------- visitas
for (const k of ORDEN) {
  const v = VISITANTES[k];
  for (const c of v.charlas) for (const p of c) traducido(p, `visita ${k}`);
  traducido(v.textoRegalo, `visita ${k} regalo`);
  traducido(`${NOMBRES[k]} vino a visitarte`, `visita ${k}`);
  traducido(`Vino ${NOMBRES[k]} a la tarde. Nos sentamos a la mesa y el tiempo pasó sin que nadie lo mirara.`, `diario visita ${k}`);
}
for (const s of ['Buenas, vecino. ¿Se puede? Vi la mesa puesta.', 'Bueno, me vuelvo antes de que oscurezca. Gracias por la mesa.',
  'Te espera en tu mesa hasta que caiga la noche', 'Viene caminando hacia tu mesa', 'Te dejaron algo']) traducido(s, 'visita');

// ---------------------------------------------------------------- pedidos de fotos
const DESAFIOS = Object.fromEntries([...leer('src/fotos.js').matchAll(/\{ id: '(f-[a-z]+)', nombre: '([^']+)'/g)].map((m) => [m[1], m[2]]));
for (const c of PEDIDOS) {
  traducido(c.de, `carta ${c.id}`);
  for (const p of partesDeCarta(c)) traducido(p, `carta ${c.id}`);
  for (const p of partesDeEnvio(c)) traducido(p, `envío ${c.id}`);
  traducido(`De ${dePara(c)}. La tiene Ercilia en el almacén`, `aviso de la carta ${c.id}`);
  traducido(`La de ${dePara(c)}. Dásela a Ercilia para que la mande con el tren`, `foto para ${c.id}`);
  traducido(`Le di a Ercilia la foto para ${dePara(c)}. Sale mañana con el tren.`, `diario envío ${c.id}`);
  traducido(`Te piden una foto: ${DESAFIOS[c.foto]}`, `pedido ${c.id}`);
}
for (const s of ['Esta foto sirve para una carta', 'Lo que dejaron por la foto']) traducido(s, 'pedidos');

// ---------------------------------------------------------------- órdenes y cimiento (Desafío)
for (const [k, lista] of Object.entries(ORDENES)) {
  const nombre = k === 'ramon' ? 'Don Ramón' : 'Ema';
  for (const o of lista) {
    traducido(`${nombre}: ${NOMBRE_ORDEN[o].toLowerCase()}`, `orden ${k} ${o}`);
    traducido(`“${RESPUESTAS[k][o]}”`, `respuesta ${k} ${o}`);
  }
}
const cim = RECETAS_TALLER.find((r) => r.id === 'cimentar');
traducido(cim.nombre, 'taller cimiento'); traducido(cim.texto, 'taller cimiento');
traducido('Acercate a una empalizada o portón de madera sin cimiento', 'taller cimiento');
traducido('acercate a una empalizada o portón de madera sin cimiento', 'taller cimiento');
for (const n of ['Empalizada de troncos', 'Empalizada reforzada', 'Portón de empalizada']) traducido(`${n}: con cimiento`, 'cimiento');
traducido('El excavador ya no se mete por debajo de esta', 'cimiento');

// ---------------------------------------------------------------- carpeta sincronizada
for (const s of ['Carpeta sincronizada:', 'ninguna', 'Elegí una carpeta de OneDrive, Dropbox o Google Drive: la partida se copia sola ahí, y en tu otra computadora el juego te ofrece la más nueva.',
  'Elegir carpeta…', 'Cambiar carpeta…', 'Dejar de usarla', 'Carpeta sincronizada', 'La partida se copia sola en C:\\Users\\x\\OneDrive',
  'La partida ya no se copia. Lo que quedó en la carpeta sigue ahí', 'La carpeta sincronizada tiene una partida más nueva',
  'La dejó tu otra computadora: no la piso. Cerrá y volvé a abrir el juego para elegir con cuál seguir']) traducido(s, 'sincronía');

// ---------------------------------------------------------------- diario de lo demás
for (const s of ['Tejí una manta en el telar. Las manos saben antes que uno.', 'Tejí un poncho en el telar. Las manos saben antes que uno.', 'Estuve en el telar: 3 tejidos.']) traducido(s, 'diario');

assert.deepEqual(falta, [], `quedó en castellano:\n  ${falta.join('\n  ')}`);
console.log('idioma 1.11: la feria, el rastro, las visitas, los pedidos de fotos, las órdenes, el cimiento y la carpeta sincronizada, en inglés');
