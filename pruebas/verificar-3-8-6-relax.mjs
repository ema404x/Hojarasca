// 3.8.6 (relax): el pase de bugs del Relax base. Una comprobación por arreglo.
// 1. El alero del arriero: lo del abuelo de Martín va en «Charlar» (caía en «Regalar y ayudar») y la amistad de la
//    historia suma los 12 de AMISTAD_ALERO (sumarAmistadDe topea en 10). La partida real: humo-3-8-6-alero.cjs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import * as SR from '../src/social-rueda.js';
import * as VS from '../src/vecindad-social.js';
import * as V from '../src/vecindad.js';
import * as AL from '../src/alero-arriero.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const main = leer('src/main.js');

// ---------------------------------------------------------------- 1. el alero del arriero
{
  for (const id of ['alero:pedir', 'alero:recordar', 'alero:contar']) eq(SR.categoriaDeOpcion(id), 'charla', `${id} en «Charlar»`);
  eq(SR.iconoDeOpcion('alero:pedir', AL.TITULOS_ALERO.pedir), 'libro', 'con el ícono del libro');
  // la rueda de verdad (vecindad-social: las de siempre, con la categoría que les pone menuParaRueda)
  const p = { dia: 3, vecindad: V.vecindadNueva ? V.vecindadNueva() : undefined, aleroArriero: AL.aleroNuevo() };
  const menu = SR.menuParaRueda({ opciones: [{ id: 'como-andas', titulo: '¿Cómo andás?' }, ...AL.opcionesAlero(p, 'martin'), { id: 'chau', titulo: 'Chau' }] });
  const grupos = VS.opcionesRueda ? VS.opcionesRueda('martin', p, { menu, dia: 3 }) : null;
  if (Array.isArray(grupos)) {
    const g = grupos.find((x) => x.opciones?.some((o) => o.id === 'alero:pedir'));
    eq(g?.categoria, 'charla', 'en la rueda, lo del abuelo está en «Charlar»');
  }
  const rueda = SR.armarRueda({ tipo: 'charla', opciones: menu.map(({ id, titulo }) => ({ id, titulo })) }, null, VS.CATEGORIAS_RUEDA);
  ok(rueda.categorias.find((c) => c.id === 'charla')?.opciones.some((o) => o.id === 'alero:pedir'), 'armarRueda lo pone en «Charlar»');
  // la amistad: 12 de una vez (con sumarAmistadDe llegaban 10)
  const e = { vecindad: V.vecindadNueva ? V.vecindadNueva() : undefined };
  const antes = V.puntosAmistad('martin', e);
  V.cambiarAmistad(e, 'martin', AL.AMISTAD_ALERO, 5);
  eq(V.puntosAmistad('martin', e) - antes, AL.AMISTAD_ALERO, 'cambiarAmistad suma los 12 del alero');
  ok(/aleroJuego = crearAleroJuego\(\{[\s\S]{0,700}sumarAmistad: \(k, n\) => \{ const am = cambiarAmistad\(progreso, k, Math\.max\(0, n\)/.test(main), 'main.js suma la amistad del alero con cambiarAmistad');
}

console.log(`verificar-3-8-6-relax: ${pasos} comprobaciones OK`);
