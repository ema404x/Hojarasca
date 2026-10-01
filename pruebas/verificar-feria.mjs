// 1.11 — la feria de la estación: cada cinco días, cuatro cambios para lo que producís.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { FERIA, OFERTAS, esDiaDeFeria, abierta, proximaFeria, ofertasDelDia, feriaNueva, sanearFeria, feriaDeHoy, alcanza, cambiarEnFeria, nombreFeria, textoOferta } from '../src/feria.js';
import { ENTRADA } from '../src/cuaderno.js';
import { progresoNuevo } from '../src/guardado.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- el calendario
assert.deepEqual([1, 2, 3, 4, 5, 6, 10, 15].map(esDiaDeFeria), [false, false, false, false, true, false, true, true]);
assert.equal(proximaFeria(1), 5);
assert.equal(proximaFeria(5), 5, 'hoy es feria: es hoy');
assert.equal(proximaFeria(6), 10);
assert.equal(abierta(5, 8.9), false, 'abre a las nueve');
assert.equal(abierta(5, 9), true);
assert.equal(abierta(5, 17.9), true);
assert.equal(abierta(5, 18), false, 'cierra a las seis');
assert.equal(abierta(4, 12), false, 'no es día de feria');

// ---------------------------------------------------------------- las ofertas
assert.equal(new Set(OFERTAS.map((o) => o.id)).size, OFERTAS.length);
const DAR = new Set(['haba', 'papa', 'frutilla', 'huevo', 'lana', 'poncho', 'pan-casero', 'empanadas']);
for (const o of OFERTAS) {
  for (const k of Object.keys(o.pide)) assert.ok(DAR.has(k), `${o.id}: no se sabe dar ${k}`);
  for (const k of [...Object.keys(o.pide), ...Object.keys(o.da.materiales || {}), ...Object.keys(o.da.cuenta || {}), ...(o.da.cosa ? [o.da.cosa] : [])]) {
    assert.notEqual(nombreFeria(k), k, `${o.id}: falta el nombre de ${k}`);
  }
  const t = textoOferta(o);
  assert.ok(t.pide && t.da, `${o.id}: texto vacío`);
}
for (const k of ['huevo', 'lana', 'poncho', 'haba', 'papa', 'frutilla']) assert.ok(OFERTAS.some((o) => o.pide[k]), `nadie compra ${k}`);

for (let d = 5; d <= 200; d += 5) {
  const hoy = ofertasDelDia(d, {});
  assert.equal(hoy.length, FERIA.ofertas, `día ${d}: cuatro ofertas`);
  assert.equal(new Set(hoy.map((o) => o.id)).size, FERIA.ofertas, `día ${d}: sin repetidas`);
  assert.deepEqual(ofertasDelDia(d, {}).map((o) => o.id), hoy.map((o) => o.id), 'la misma fecha, la misma feria');
  const conTodo = ofertasDelDia(d, { mosca: 1, farol: 1 });
  assert.ok(!conTodo.some((o) => o.da.cosa), 'no te ofrecen lo que ya tenés');
}
// si hoy te llevaste una cosa única, la lista no cambia (si no, se corren los números)
{
  let d = 5;
  while (!ofertasDelDia(d, {}).some((o) => o.da.cosa)) d += 5;
  const hoy = ofertasDelDia(d, {});
  const unica = hoy.find((o) => o.da.cosa);
  assert.deepEqual(ofertasDelDia(d, { [unica.da.cosa]: 1 }, [unica.id]).map((o) => o.id), hoy.map((o) => o.id), 'la que cambiaste hoy sigue en su lugar');
  assert.ok(!ofertasDelDia(d, { [unica.da.cosa]: 1 }, []).some((o) => o.id === unica.id), 'otro día ya no te la ofrecen');
}
const distintas = new Set();
for (let d = 5; d <= 60; d += 5) distintas.add(ofertasDelDia(d).map((o) => o.id).join());
assert.ok(distintas.size >= 8, 'cada feria es distinta');

// ---------------------------------------------------------------- cambiar
const huevos = OFERTAS.find((o) => o.id === 'huevos-piedra');
const tengo = (m) => (k) => m[k] || 0;
assert.equal(alcanza(huevos, tengo({ huevo: 6 })), true);
assert.equal(alcanza(huevos, tengo({ huevo: 5 })), false);
const f = feriaNueva(5);
assert.deepEqual(cambiarEnFeria(f, 'no-existe', tengo({})), { ok: false, motivo: 'no hay' });
assert.equal(cambiarEnFeria(f, 'huevos-piedra', tengo({ huevo: 2 })).motivo, 'falta');
assert.equal(cambiarEnFeria(f, 'huevos-piedra', tengo({ huevo: 9 })).ok, true);
assert.equal(cambiarEnFeria(f, 'huevos-piedra', tengo({ huevo: 9 })).motivo, 'hecho', 'una vez por feria');
assert.deepEqual(feriaDeHoy(f, 5), f, 'la misma feria sigue');
assert.deepEqual(feriaDeHoy(f, 10).tomadas, [], 'la feria siguiente arranca de cero');

// ---------------------------------------------------------------- guardado
assert.deepEqual(sanearFeria(null), { dia: 0, tomadas: [] });
assert.deepEqual(sanearFeria({ dia: 10, tomadas: ['huevos-piedra', 'inventada', 3] }), { dia: 10, tomadas: ['huevos-piedra'] });
assert.deepEqual(progresoNuevo().feria, { dia: 0, tomadas: [] });
assert.match(leer('src/guardado.js'), /feria: sanearFeria\(p\.feria\)/, 'una partida de la 1.10 carga sin feria');

// ---------------------------------------------------------------- cableado
assert.equal(ENTRADA.feria?.seccion, 'lugares');
const main = leer('src/main.js');
assert.match(main, /crearPuestoFeria\(T, escena, e\)/, 'el puesto está en el mundo');
assert.match(main, /if \(desafio \|\| !puestoFeria \|\| !feriaAbierta\(progreso\.dia, progreso\.horas\)\) return false;/, 'sólo en el Relax y en horario');
assert.match(main, /feriaCerca\(\) && !enLaFeria\) aviso = \{ tecla: 'E', texto: 'Ver la feria' \}/, 'el aviso');
assert.match(main, /if \(!objetivo && feriaCerca\(\)\) \{ abrirFeria\(\); break; \}/, 'la tecla E');
assert.match(main, /if \(enLaFeria\) \{ cambiarFeria\(Number\(codigo\.slice\(5\)\) - 1\); break; \}/, 'los números eligen');
assert.match(main, /li\.addEventListener\('click', \(\) => cambiarFeria\(i\)\);/, 'y el clic también');
assert.match(main, /else if \(enLaFeria\) cerrarFeria\(\);/, 'Escape cierra');
// el aviso y la tecla E van en el mismo orden (ver el comentario en main.js)
const iAviso = main.indexOf("feriaCerca() && !enLaFeria) aviso"), iAvisoCaballo = main.indexOf("caballoCerca()) aviso");
const iE = main.indexOf('if (!objetivo && feriaCerca()) { abrirFeria(); break; }'), iECaballo = main.indexOf('if (!objetivo && caballoCerca()) { montar(); break; }');
assert.ok(iAviso > iAvisoCaballo && iE > iECaballo, 'la feria va después del caballo en los dos lados');
assert.match(leer('src/plantilla.html'), /id="feria-lista"/);

console.log('feria:', OFERTAS.length, 'ofertas ·', FERIA.ofertas, 'por feria cada', FERIA.cada, 'días ·', distintas.size, 'ferias distintas en dos meses');
