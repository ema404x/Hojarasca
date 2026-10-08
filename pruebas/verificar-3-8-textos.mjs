// 3.8.0 (textos) — La noche de los duendes. En el Desafío los extraterrestres pasan a ser
// duendes: los textos que se ven, el inglés, los sonidos y la leyenda que cuenta la abuela
// Herminia en el Relax (donde los duendes no aparecen nunca).
//   1. ningún texto visible del Desafío habla de naves, invasores, cristales o la Madre;
//   2. lo central del Desafío está en inglés, y el inglés tampoco habla de naves;
//   3. los sonidos: risitas, el Rey, la lechuza, el Coihue que cruje, silbidos en la música;
//   4. la leyenda: «La noche en que salieron los duendes», nada religioso.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EN } from '../src/idioma-en.js';
import { EN_R } from '../src/idioma-en-r.js';
import { crearTraductor } from '../src/idioma.js';
import { BESTIARIO } from '../src/desafio-noche2.js';
import { LOGROS } from '../src/desafio-logros.js';
import { seccionesGuia } from '../src/guia.js';
import { PLANOS_ALIEN, RECETAS, CATEGORIAS_TALLER, ARMAS, DIFICULTADES, TIPOS_ALIEN } from '../src/desafio-reglas.js';
import { ARSENAL, FLECHAS } from '../src/desafio-arsenal.js';
import { NOMBRE_FASE, AVISO_FASE } from '../src/desafio-nave.js';
import { NOMBRE_JEFE, AVISO_JEFE } from '../src/desafio-valle.js';
import { SONIDOS_ESCRITOS } from '../src/desafio-sentidos.js';
import { RECURSOS } from '../src/desafio-mapa.js';
import { RUMORES_DESAFIO } from '../src/radio.js';
import { VOCES, ESTADOS, voz } from '../src/voz-alien.js';
import { LEYENDAS } from '../src/fiestas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. nada de otro mundo
// Lo que ya no puede leerse en el Desafío (en castellano).
const VIEJO = /\b(alien\w*|extraterrestre\w*|invasor\w*|invasi[oó]n|naves?|nodriza|capullos?|abduc\w*|plasma|c[aá]psula|cristal(es)?|n[uú]cleos?|caparaz[oó]n|balizas?|mutad[oa]s?|tecnolog[ií]a|la Madre)\b/i;
// Los textos entre comillas de un archivo, sin comentarios y sin el código de los ${}.
function literales(src) {
  const sinComentarios = src.split('\n').filter((l) => !/^\s*\/\//.test(l)).map((l) => l.replace(/\s\/\/ .*$/, '')).join('\n');
  const salida = [];
  for (const m of sinComentarios.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const l = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, ' ');
    // un identificador suelto (una clave, un tipo de material) no es un texto que se vea
    if (!/\s/.test(l.trim()) && !/^[A-ZÁÉÍÓÚ¡¿]/.test(l)) continue;
    salida.push(l);
  }
  return salida;
}
const ARCHIVOS = fs.readdirSync(new URL('../src/', import.meta.url)).filter((f) => /^desafio.*\.js$/.test(f))
  .map((f) => 'src/' + f).concat(['src/guia.js', 'src/mochila.js', 'src/parte.js', 'src/base-estado.js', 'src/chinches.js', 'src/meteo.js', 'src/plantilla.html']);
const quedan = [];
for (const f of ARCHIVOS) {
  // en los sonidos y la música sólo hay nombres internos
  if (/desafio-(sonidos|musica)\.js$/.test(f)) continue;
  // en la plantilla, lo que va entre etiquetas y los atributos que se leen (title, aria-label, placeholder)
  const textos = f.endsWith('.html')
    ? [...leer(f).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '').matchAll(/>([^<>]+)<|(?:title|aria-label|placeholder|alt)="([^"]+)"/g)].map((m) => m[1] ?? m[2])
    : literales(leer(f));
  for (const l of textos) if (VIEJO.test(l) && !/[{}=;]|=>|\bconst\b/.test(l)) quedan.push(`${f}: «${l.trim().slice(0, 90)}»`);
}
ok(quedan.length === 0, `quedó vocabulario de extraterrestres en el Desafío:\n  ${quedan.join('\n  ')}`);

// lo que el Desafío arma desde los datos, de a uno
const DESAFIO = [
  ...Object.values(BESTIARIO).flatMap((b) => [b.nombre, b.visto, b.aprendido, b.debil]),
  ...LOGROS.flatMap((l) => [l.nombre, l.texto]),
  ...seccionesGuia('desafio').flatMap((s) => s.items.flatMap((i) => [i[0], i[1]])),
  ...PLANOS_ALIEN.flatMap((p) => [p.nombre, p.texto]),
  ...RECETAS.flatMap((r) => [r.nombre, r.texto]), ...CATEGORIAS_TALLER.map((c) => c.nombre),
  ...Object.values(ARMAS).map((a) => a.nombre), ...Object.values(DIFICULTADES).map((d) => d.texto),
  ...Object.values(TIPOS_ALIEN).map((t) => t.nombre),
  ...Object.values(ARSENAL).map((a) => a.nombre), ...Object.values(FLECHAS).map((f) => f.nombre),
  ...Object.values(NOMBRE_FASE), ...Object.values(AVISO_FASE).flat(),
  ...Object.values(NOMBRE_JEFE), ...Object.values(AVISO_JEFE),
  ...Object.values(SONIDOS_ESCRITOS).filter(Boolean), ...Object.values(RECURSOS).flatMap((r) => [r.nombre, r.aviso, r.vacio]),
  ...RUMORES_DESAFIO.map((r) => r.texto),
].filter((t) => typeof t === 'string' && t);
for (const t of DESAFIO) ok(!VIEJO.test(t), `en el Desafío todavía dice «${t}»`);
const construccion = leer('src/construccion.js');
for (const m of construccion.matchAll(/soloDesafio: true[^\n]*\n(?:[^\n]*\n){0,3}?\s*texto: '([^']+)'/g)) ok(!VIEJO.test(m[1]), `la defensa dice «${m[1]}»`);
ok(/cristal: \{ nombre: 'semillas doradas', de: 'los duendes abatidos' \}/.test(construccion), 'el material se llama semillas doradas');

// la historia nueva está contada
const todo = DESAFIO.join(' ');
for (const palabra of ['duende', 'lechuza', 'Coihue Viejo', 'Rey Duende', 'semillas doradas', 'nidos de hongos', 'cueva', 'mandamás'])
  ok(new RegExp(palabra, 'i').test(todo + leer('src/desafio.js') + leer('src/main.js')), `falta contar: ${palabra}`);
ok(BESTIARIO.volador.nombre === 'Lechucero' && BESTIARIO.jefe.nombre === 'Mandamás' && BESTIARIO.mutado.nombre === 'Viejo', 'el bestiario de los duendes');

// ---------------------------------------------------------------- 2. el inglés
const main = leer('src/main.js'), idiomaEn = leer('src/idioma-en.js');
ok(/import \{ EN_R \} from '\.\/idioma-en-r\.js';/.test(idiomaEn) && /Object\.assign\(EN, EN_R\);/.test(idiomaEn), 'la tanda R está en el diccionario');
ok(Object.keys(EN_R).length > 300, `la tanda R trae lo del Desafío (${Object.keys(EN_R).length})`);
const t = crearTraductor(EN, 'en').t;
// Lo central del Desafío tiene que estar en inglés. (Lo nuevo de otros equipos que sólo
// esté en castellano se suma después; esto mira lo que ya tenía inglés antes de la 3.8.)
const CENTRAL = [
  ...Object.values(BESTIARIO).flatMap((b) => [b.nombre, b.visto, b.aprendido, b.debil]),
  ...LOGROS.flatMap((l) => [l.nombre, l.texto]),
  ...PLANOS_ALIEN.flatMap((p) => [p.nombre, p.texto]),
  ...Object.values(NOMBRE_FASE), ...Object.values(AVISO_FASE).flat(), ...Object.values(NOMBRE_JEFE),
  ...['¡Cayó el Coihue Viejo!', 'El Coihue cayó desde adentro', 'Se derrumbó la cueva', 'Coihue Viejo', 'Semillas doradas', 'Pistola de luz',
    'Esta noche salen los duendes', 'Los duendes te dejaron fuera de combate', 'Siguen saliendo', 'El Coihue Viejo sigue en pie',
    'Esta noche despierta el Coihue Viejo. Preparate para todo', 'Encontraste una pistola de luz', 'Quemaste un nido de hongos',
    'Encontraste una madriguera de duendes', 'Duendes abatidos', 'Planos de los duendes', 'Cofre de los duendes', 'Monte quieto'],
];
const sinIngles = CENTRAL.filter((x) => t(x) === x && EN[x] === undefined);
ok(sinIngles.length === 0, `quedó en castellano:\n  ${sinIngles.join('\n  ')}`);
// los moldes con huecos también
for (const [es, en] of [['¡Salen duendes desde el norte!', 'Goblins coming out from the north!'], ['Noche 4 · 7 duendes', 'Night 4 · 7 goblins'],
  ['Le reventaste una piedra de ámbar', 'You burst one of his amber stones'], ['Quedaron 3 nidos de hongos en el bosque', '3 mushroom nests were left in the forest']])
  ok(t(es) === en, `«${es}» → «${t(es)}»`);
// y el inglés de lo que se ve tampoco habla de naves ni de invasores
const VIEJO_EN = /\b(aliens?|invaders?|invasion|mothership|ship|spaceship|crystals?|plasma|pod|cocoons?|outposts? of|nest boss|nest warden|shield generator|the Mother)\b/i;
const malos = [...new Set([...CENTRAL, ...DESAFIO])].map((x) => [x, t(x)]).filter(([, en]) => VIEJO_EN.test(en));
ok(malos.length === 0, `el inglés todavía habla de otro mundo:\n  ${malos.map(([es, en]) => `${es} → ${en}`).join('\n  ')}`);
for (const [es, en] of Object.entries(EN_R)) {
  ok(!VIEJO_EN.test(en), `tanda R: «${es}» → «${en}»`);
  ok(JSON.stringify((es.match(/\{\d+\}/g) || []).sort()) === JSON.stringify((en.match(/\{\d+\}/g) || []).sort()), `los huecos de «${es}»`);
}

// ---------------------------------------------------------------- 2b. el nombre del modo y el cofre del alba
// El modo se llama «La noche de los duendes» en todo lo que se ve (adentro sigue siendo 'desafio').
// «Desafío del día» (las carreras del Relax) y «Desafíos cumplidos» (las fotos) son otra cosa.
const nombreViejo = [];
for (const f of fs.readdirSync(new URL('../src/', import.meta.url)).filter((x) => (x.endsWith('.js') && !x.startsWith('idioma')) || x === 'plantilla.html')) {
  const src = leer('src/' + f);
  const textos = f.endsWith('.html') ? [...src.matchAll(/>([^<>]+)</g)].map((m) => m[1]) : literales(src);
  for (const l of textos) if (/\bDesafío\b(?! del día| cumplido)/.test(l)) nombreViejo.push(`${f}: «${l.trim().slice(0, 80)}»`);
}
ok(nombreViejo.length === 0, `el modo todavía se llama Desafío:\n  ${nombreViejo.join('\n  ')}`);
ok(/data-valor="desafio">La noche de los duendes</.test(leer('src/plantilla.html')), 'la portada ofrece La noche de los duendes');
ok(t('La noche de los duendes') === 'The Night of the Goblins' && t('Ganaste La noche de los duendes') === 'You won The Night of the Goblins', 'y en inglés');
ok(!/paracaídas|suministros/.test(DESAFIO.join(' ') + leer('src/desafio.js').replace(/^\s*\/\/.*$/gm, '').replace(/suministrosDelAlba/g, '')), 'el cofre del alba brota entre raíces: nada de paracaídas');
ok(t('Brotó un cofre entre las raíces') === 'A chest came up among the roots' && t('Cofre del alba') === 'Dawn chest', 'el cofre del alba, en inglés');
// lo que dice el travieso (los textos son del equipo duendes; el inglés va acá)
for (const [es, en] of [['¡Un duende te robó!', 'A goblin robbed you!'], ['Se llevó una semilla dorada y sale corriendo. Pegale y lo suelta', 'It took a golden seed and ran off. Hit it and it lets go'],
  ['Lo recuperaste', 'You got it back'], ['La tabla vuelve a tus cosas', 'The plank is back with your things'], ['Una piedra que se llevó un duende', 'A stone a goblin had taken'],
  ['Te devolvieron lo robado', 'They gave back what they took'], ['Con la primera luz, los duendes dejaron todo en la puerta', 'With the first light, the goblins left everything at the door']])
  ok(t(es) === en, `«${es}» → «${t(es)}»`);
ok(/nombre: 'Baqueano'/.test(leer('src/desafio-evolucion.js')), 'el adaptado es el Baqueano');

// ---------------------------------------------------------------- 3. los sonidos
for (const tipo of ['rastreador', 'tirador', 'saltador', 'escupidor', 'bruto', 'jefe']) ok(VOCES[tipo].risa > 0, `${tipo}: se ríe`);
ok(VOCES.saltador.risa > VOCES.rastreador.risa && VOCES.rastreador.risa > VOCES.bruto.risa && VOCES.bruto.risa > VOCES.jefe.risa, 'los chicos se ríen rápido, los viejos despacio');
ok(VOCES.rey && VOCES.rey.base < VOCES.jefe.base && VOCES.rey.formantes.length === 3, 'la voz del Rey Duende, la más grave');
ok(ESTADOS.alerta.risa === 1 && ESTADOS.dolor.risa === 0 && ESTADOS.muerte.risa === 0, 'al verte se ríe; al doler y al caer, no');
ok(voz('rastreador', 'alerta', { azar: 1 }).risaHondura > 0.5 && voz('nido', 'latido').risaHondura === 0, 'la risita llega al motor');
const sonido = leer('src/sonido.js'), banco = leer('src/desafio-sonidos.js'), musica = leer('src/desafio-musica.js');
ok(/v\.risa > 0 && v\.risaHondura > 0\.05/.test(sonido) && /cuerpoSalida\.connect\(env\)/.test(sonido), 'el motor corta la voz en sílabas');
ok(!/quitina/.test(banco), 'los duendes son de corteza, no de caparazón');
const tramo = (clave) => { const i = banco.indexOf(`    ${clave}: `); return banco.slice(i, banco.indexOf('\n    }', i)); };
ok(!/sawtooth/.test(tramo('zumbido')) && /garganta/.test(tramo('zumbido')) && /'tronco'/.test(tramo('zumbido')), 'el Coihue Viejo cruje y pisa con las raíces');
ok(!/sawtooth/.test(tramo('cargado')) && !/chisporrotear/.test(tramo('pistola')), 'la pistola de luz no chisporrotea plasma');
ok(/hu-huu/.test(banco) && /chistido/.test(banco), 'la lechuza: el ulular y el chistido');
ok(/    risa: \(pos, tipo = 'saltador'\) => \{/.test(banco) && SONIDOS_ESCRITOS.risa === 'una risita' && t('una risita') === 'a giggle', 'S.risa: la risita del travieso, escrita y en inglés');
ok(/const SILBIDOS = /.test(musica) && !/CRISTALES/.test(musica) && /function silbido\(/.test(musica), 'en la música, los duendes silban');

// ---------------------------------------------------------------- 4. la leyenda
const ley = LEYENDAS.find((l) => l.id === 'duendes');
ok(ley && ley.titulo === 'La noche en que salieron los duendes' && ley.quien === 'abuela' && ley.partes.length >= 5, 'la abuela Herminia cuenta la noche de los duendes');
const historia = ley.partes.join(' ');
for (const p of ['traviesos', 'lechuzas', 'Coihue Viejo', 'Rey Duende', 'semillas doradas']) ok(historia.includes(p), `la leyenda cuenta: ${p}`);
ok(!/capilla|\bmisa\b|\bcura\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|milagro|virgen|sagrad|ángel|amén|pecado|diablo|demonio|alma\b/i.test(historia), 'nada religioso');
ok(LEYENDAS.length >= 4 && LEYENDAS.indexOf(ley) === 0 && LEYENDAS.map((l) => l.id).slice(1, 4).join() === 'calafate,cuero,nahuelito', 'es la del primer año; las otras se corren uno');

console.log(`3.8.0 (textos): ${n} comprobaciones · La noche de los duendes, en castellano y en inglés, con sus sonidos y su leyenda`);
