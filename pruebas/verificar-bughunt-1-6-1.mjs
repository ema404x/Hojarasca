// 1.6.1 — cacería de bugs sobre lo que trajo la 1.6.0.
// Tres defectos encontrados leyendo el código y el cuarto en los metadatos del paquete.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const veg = leer('src/vegetacion.js');
const main = leer('src/main.js');

// ---------------------------------------------------------------- 1. la sombra de contacto
// `ocultarInstancia` apaga el árbol Y su sombra de contacto cada vez que el árbol se
// mueve, incluso en una simple sacudida. Al terminar la sacudida volvía sólo el árbol:
// el manchón del suelo quedaba apagado para siempre en cada árbol al que le pegaste.
assert.match(veg, /for \(const ref of \[a\.ref, a\.contactoRef\]\.filter\(Boolean\)\) ponerMatriz\(ref, cero\)/,
  'ocultarInstancia sigue apagando también la sombra de contacto');
const terminar = veg.slice(veg.indexOf('function terminarAnimado'), veg.indexOf('function talar'));
assert.match(terminar, /ponerMatriz\(an\.a\.ref, an\.a\.matriz0\)/, 'el árbol vuelve a su instancia');
assert.match(terminar, /an\.a\.contactoRef && an\.a\.matrizContacto/,
  'al terminar la sacudida también vuelve la sombra de contacto');

// La única otra vuelta a la normalidad (el rebrote completo) ya la restauraba: que siga.
assert.match(veg, /if \(a\.contactoRef && a\.matrizContacto\) ponerMatriz\(a\.contactoRef, a\.matrizContacto\)/,
  'crecer() restaura la sombra de contacto del árbol adulto');

// ---------------------------------------------------------------- 2. el renoval que apura
// `revisarRebrote()` se corta sola si ya revisó hoy, y `diaRebrote` queda en el día
// actual apenas talás algo. Plantar al lado de un tocón avisaba que lo apuraba tres
// días, pero la etapa no se movía hasta el día siguiente.
const plantar = main.slice(main.indexOf('function plantarRenoval'), main.indexOf('// ------', main.indexOf('function plantarRenoval')));
assert.match(plantar, /apurarRebrote\(talados\(\)/, 'plantar busca el tocón de al lado');
assert.match(plantar, /apurado\.esc = -1; diaRebrote = -1; revisarRebrote\(\);/,
  'plantar destraba la revisión para que el tocón cambie de etapa en el momento');
assert.match(main, /if \(!forzar && \(progreso\.dia === diaRebrote \|\| !lista\.length\)\) return;/,
  'la guardia de revisarRebrote sigue siendo la que obliga a destrabarla');

// ---------------------------------------------------------------- 3. el acopio y las devoluciones
// `conMateriales` cobraba del acopio y de la mochila, pero si la obra devolvía material
// en vez de gastarlo el saldo negativo se descartaba en silencio.
const cobro = main.slice(main.indexOf('function conMateriales'), main.indexOf('function usarAcopio'));
assert.ok(!/if \(gasto <= 0\) continue;/.test(cobro), 'ya no se descarta el saldo a favor');
assert.match(cobro, /if \(gasto === 0\) continue;/, 'sólo se saltea el material que no se tocó');
assert.match(cobro, /if \(gasto < 0\) \{ m\[k\] = \(m\[k\] \|\| 0\) - gasto; continue; \}/,
  'lo devuelto vuelve a la mochila');

// El cobro, replicado, tiene que cerrar en los tres casos.
function cobrar(mochila, pila, vista) {
  const m = { ...mochila }, a = { ...pila };
  for (const k of ['tronco', 'tabla', 'piedra', 'cristal']) {
    const gasto = (m[k] || 0) + (a[k] || 0) - (vista[k] || 0);
    if (gasto === 0) continue;
    if (gasto < 0) { m[k] = (m[k] || 0) - gasto; continue; }
    const delAcopio = Math.min(a[k] || 0, gasto);
    a[k] = (a[k] || 0) - delAcopio;
    m[k] = Math.max(0, (m[k] || 0) - (gasto - delAcopio));
  }
  return { m, a };
}
// primero la pila, después la mochila
let r = cobrar({ tronco: 5 }, { tronco: 3 }, { tronco: 6 });
assert.deepEqual([r.a.tronco, r.m.tronco], [1, 5], 'gastar 2 sale entero del acopio, la mochila no se toca');
r = cobrar({ tronco: 5 }, { tronco: 3 }, { tronco: 2 });
assert.deepEqual([r.a.tronco, r.m.tronco], [0, 2], 'gastar 6 vacía el acopio y el resto sale de la mochila');
// lo que no se tocó queda igual
r = cobrar({ tabla: 2 }, { tabla: 7 }, { tabla: 9 });
assert.deepEqual([r.m.tabla, r.a.tabla], [2, 7], 'sin gasto no se mueve nada');
// una devolución no se pierde
r = cobrar({ piedra: 1 }, { piedra: 2 }, { piedra: 6 });
assert.equal(r.m.piedra, 4, 'las 3 piedras devueltas van a la mochila');
assert.equal(r.a.piedra, 2, 'el acopio no se toca al devolver');
const total = (x) => Object.values(x).reduce((s, n) => s + n, 0);
assert.equal(total(r.m) + total(r.a), 6, 'no se crea ni se pierde material');

// ---------------------------------------------------------------- 4. los metadatos del paquete
// La descripción del package.json venía con el encoding roto en varias capas, y
// electron-builder la mete en las propiedades del .exe y del instalador.
const paquete = JSON.parse(leer('package.json'));
assert.ok(!/Ã|â€|Â/.test(paquete.description), 'la descripción no tiene mojibake');
assert.match(paquete.description, /Exploración contemplativa en un bosque andino patagónico/,
  'la descripción dice lo que tiene que decir, con sus acentos');
for (const campo of ['name', 'description', 'productName']) {
  const v = campo === 'productName' ? paquete.build?.productName : paquete[campo];
  if (v != null) assert.ok(!/Ã|â€|Â/.test(String(v)), `${campo} sin mojibake`);
}

console.log('bug hunt 1.6.1: ok · sombra de contacto · renoval que apura · acopio con devoluciones · metadatos');
