// 2.2 — las dos ramas juntas: que lo que se unió quede unido y que no vuelva a separarse.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { progresoNuevo } from '../src/guardado.js';
import { CULTIVOS, ORDEN_CULTIVOS, desdeCanteroViejo, claveCantero, sanearHuerta } from '../src/huerta.js';
import { TRUEQUES } from '../src/trueque.js';
import { RECETAS_FUEGO, elegirReceta, posibles } from '../src/cocina.js';
import { EN } from '../src/idioma-en.js';
import { EN_M } from '../src/idioma-en-m.js';
import { EN_N } from '../src/idioma-en-n.js';
import { EN_O } from '../src/idioma-en-o.js';
import { createHash } from 'node:crypto';
import { generarTerreno } from '../src/terreno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');

// ---------------------------------------------------------------- ningún plano con hoja ni flor
// Las obras usan el material de la vegetación: tipo 2 (hoja caduca) se pone rojo en otoño,
// flamea y en invierno desaparece; tipo 3 (flor) también desaparece. Una pared, una
// piedra o un telar no pueden ser eso.
const cons = leer('src/construccion.js');
const ids = [...cons.matchAll(/\n    id: '([a-z0-9-]+)'/g)];
const conHoja = [];
ids.forEach((m, i) => {
  const bloque = cons.slice(m.index, i + 1 < ids.length ? ids[i + 1].index : cons.length);
  if (/tipo: [23]\b/.test(bloque)) conHoja.push(m[1]);
});
assert.deepEqual(conHoja, [], `planos con hoja o flor: ${conHoja.join(', ')}`);

// ---------------------------------------------------------------- la huerta, una sola
assert.deepEqual(ORDEN_CULTIVOS, ['habas', 'papas', 'frutillas', 'calafates']);
assert.equal(cons.split("funciones: ['huerta']").length - 1, 1, 'un solo plano de huerta');
assert.ok(!fs.existsSync(new URL('../src/huerta-plantas.js', import.meta.url)), 'la huerta de la 2.0 no quedó a medias');
assert.ok(!/huertaCerca|trabajarHuerta|avisoHuerta/.test(main));
// una partida de la 2.x: el cantero con su planta adentro
const vieja = { dia: 12, obras: [{ plano: 'huerta', x: 10.4, z: -3.6, rot: 0, etapas: 1, huerta: { planta: 'calafate', crecido: 1 / 3, agua: 4 } }, { plano: 'banco', x: 0, z: 0, etapas: 1 }] };
const g = leer('src/guardado.js');
const migrar = new Function('objeto', 'desdeCanteroViejo', 'claveCantero', `${g.slice(g.indexOf('function migrarCanteros'), g.indexOf('function sanearProgreso'))}; return migrarCanteros;`)(
  (v) => !!v && typeof v === 'object' && !Array.isArray(v), desdeCanteroViejo, claveCantero);
const nueva = migrar(vieja);
assert.equal(nueva.obras[0].plano, 'cantero');
assert.equal(nueva.obras[0].huerta, undefined, 'la planta sale de la obra');
assert.equal(nueva.obras[1].plano, 'banco', 'lo demás no se toca');
assert.deepEqual(sanearHuerta(nueva.huerta), { [claveCantero(10.4, -3.6)]: { cultivo: 'calafates', dia: 11, lluvia: 0, ultimaLluvia: -1 } }, 'lo sembrado sigue creciendo donde estaba');
assert.equal(migrar({ dia: 3, obras: [] }).huerta, undefined, 'una partida sin canteros viejos no cambia');
assert.ok(CULTIVOS.calafates.siembraConIngrediente, 'el calafate se siembra con uno que juntaste');

// ---------------------------------------------------------------- el almacén, de a nueve
assert.ok(TRUEQUES.length > 9, 'con las dos ramas hay más cambios que números');
assert.match(main, /const POR_PAGINA_ALMACEN = 9;/);
assert.match(main, /if \(enElAlmacen\) \{ e\.preventDefault\(\); pasarPaginaAlmacen\(e\.shiftKey \? -1 : 1\); break; \}/, 'Tab pasa de página');
assert.equal((main.match(/if \(enElAlmacen\) \{ cambiarDeLaPagina\(Number\(codigo\.slice\(5\)\)\); break; \}/g) || []).length, 2, 'del 1 al 4 y del 5 al 9');
assert.match(leer('src/plantilla.html'), /id="trueque-seguir"/);

// ---------------------------------------------------------------- la cocina de las dos
const frasco = RECETAS_FUEGO.find((r) => r.id === 'frasco-frutilla');
assert.ok(frasco?.conserva && frasco.requiere === 'frutillas-brasas', 'el frasco de la 2.1 está en cocina.js');
const cuanto = (k) => ({ frutilla: 8 }[k] || 0);
assert.ok(!posibles(cuanto, RECETAS_FUEGO, () => false).includes(frasco), 'sin saber hacer las frutillas al rescoldo, no hay frasco');
assert.equal(elegirReceta(cuanto, (id) => id === 'frutillas-brasas').id, 'frasco-frutilla', 'lo que nunca hiciste primero');
assert.equal(elegirReceta(cuanto, () => true).id, 'frasco-frutilla', 'después, el frasco antes que comerse todo');
assert.match(main, /const abrir = U\.uInvierno\.value > 0\.5 \? queAbrir\(progreso\.entradas\) : null;/, 'en invierno se abre una conserva');

// ---------------------------------------------------------------- el perro de las dos
const perro = leer('src/perro.js');
assert.match(perro, /\} else if \(mundo\?\.alerta\) \{[\s\S]*\} else if \(mundo\?\.rastro\) \{/, 'alertar (2.0) antes que rastrear (1.11)');
assert.match(perro, /mundo\?\.guiar \? presaParaGuiar/, 'la guía de la 2.0 sigue');

// ---------------------------------------------------------------- el guardado de las dos
const p = progresoNuevo();
for (const k of ['huerta', 'gallineros', 'feria', 'visitas', 'majada', 'correo', 'tormenta', 'caballo']) assert.ok(k in p, `falta ${k} (1.10/1.11)`);
assert.match(g, /encargoBase: sanearBase\(p\.encargoBase\)/, 'lo de la 2.0 también');
assert.match(g, /grabaciones: sanearGrabaciones\(p\.grabaciones\)/, 'y lo de la 2.1');

// ---------------------------------------------------------------- las tandas de inglés
for (const [nombre, tanda] of [['M', EN_M], ['N', EN_N], ['O', EN_O]]) {
  for (const [es, en] of Object.entries(tanda)) assert.equal(EN[es], en, `la tanda ${nombre} no llegó al diccionario («${es.slice(0, 40)}»)`);
}
assert.ok(!fs.existsSync(new URL('../src/idioma-en-k.js', import.meta.url)) || /Tanda K: lo nuevo de la 2\.0/.test(leer('src/idioma-en-k.js')), 'la K es la de la 2.0');

// ---------------------------------------------------------------- el handle de depuración
const handle = main.slice(main.indexOf('if (HOJARASCA_DEBUG) Object.assign(window.__hojarasca, {'));
for (const clave of ['__rastro', '__rastroPerro', '__bucle']) {
  assert.equal(handle.split(`${clave}:`).length - 1, 1, `${clave} una sola vez`);
}

// ---------------------------------------------------------------- optimizaciones de la 2.2
// el valle no se mueve: las optimizaciones de la carga tienen que dar el mismo terreno
{
  const t0 = performance.now();
  const T = generarTerreno();
  const ms = performance.now() - t0;
  const h = createHash('sha256');
  for (const [k, v] of Object.entries(T)) {
    if (ArrayBuffer.isView(v)) h.update(k).update(Buffer.from(v.buffer, v.byteOffset, v.byteLength));
    else if (Array.isArray(v)) h.update(k).update(JSON.stringify(v));
  }
  h.update(JSON.stringify(T.lugares || {}));
  assert.equal(h.digest('hex').slice(0, 16), '2414ce1a25286f52', 'el terreno cambió: las partidas guardadas quedarían en otro lugar');
  assert.ok(ms < 5000, `generar el terreno tarda ${Math.round(ms)} ms`);
}
const tieneTexto = (texto, trozo) => texto.split(trozo).length > 1;
assert.ok(!tieneTexto(leer('src/terreno.js'), "mapa.get((cx + dx) + ','"), 'el índice de segmentos no arma texto en cada consulta');
assert.ok(tieneTexto(main, 'escena.updateMatrixWorld = function (forzar) {'), 'el repaso de matrices salta lo oculto');
assert.ok(tieneTexto(main, 'if (!h.visible) { h.__sinRepaso = true; continue; }'));
assert.ok(tieneTexto(main, 'if (h.__sinRepaso) { h.__sinRepaso = false; h.updateMatrixWorld(true); }'), 'y al volver a verse se recalcula entero');
const veg = leer('src/vegetacion.js');
assert.ok(tieneTexto(veg, 'if (compactoSucio || Math.hypot(cam.x - compactoX, cam.z - compactoZ) > MOVIDA_PARA_COMPACTAR) compactarCercanos(cam);'), 'los árboles cercanos no se recopian con la cámara quieta');
assert.ok(veg.split('compactoSucio = true;').length - 1 >= 2, 'despejar y mover una instancia obligan a recopiar');
assert.ok(tieneTexto(leer('src/estructuras.js'), 'veg.arbolesCerca(x, z, radio).some'), 'buscar sitio mira sólo los árboles cercanos');

console.log('2.2: ok · las dos ramas juntas · una huerta (4 cultivos, migra las de la 2.x) · un excavador con cimiento · almacén de a nueve · ningún plano con hoja');
