// 1.10 — la huerta: canteros donde se siembra, se espera y se cosecha.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CULTIVOS, ORDEN_CULTIVOS, claveCantero, sanearHuerta, diasCrecido, avance, etapa, lista,
  diasQueFaltan, semillaParaSembrar, sembrar, regarConLluvia, cosechar, textoCantero, resumenHuerta,
} from '../src/huerta.js';
import { TRUEQUES, TRUEQUE, tieneYa } from '../src/trueque.js';
import { SECCIONES, ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- los cultivos
assert.deepEqual(ORDEN_CULTIVOS, ['habas', 'papas', 'frutillas', 'calafates'], '2.2: los calafates de la huerta de la 2.0');
for (const id of ORDEN_CULTIVOS) {
  const c = CULTIVOS[id];
  assert.ok(c.dias > 0 && c.cosecha > 0 && c.ingrediente, `${id} mal armado`);
  assert.ok(c.semilla || c.siembraConIngrediente, `${id} no dice con qué se siembra`);
}
assert.ok(CULTIVOS.frutillas.dias < CULTIVOS.habas.dias && CULTIVOS.habas.dias < CULTIVOS.papas.dias,
  'la frutilla es la más rápida y la papa la más lenta');

// ---------------------------------------------------------------- sembrar y crecer
assert.equal(claveCantero(12.4, -7.6), '12:-8');
const h = {};
assert.equal(sembrar(h, '1:1', 'tomates', 1).ok, false, 'lo que no existe no se siembra');
assert.equal(sembrar(h, '1:1', 'habas', 3).ok, true);
assert.equal(sembrar(h, '1:1', 'papas', 3).ok, false, 'un cultivo por cantero');
const p = h['1:1'];
assert.equal(diasCrecido(p, 3), 0);
assert.equal(etapa(p, 3), 'recién sembrado');
assert.equal(lista(p, 3), false);
assert.equal(diasQueFaltan(p, 3), 5);
assert.equal(etapa(p, 5), 'brotando');
assert.equal(etapa(p, 7), 'creciendo');
assert.equal(lista(p, 8), true, 'a los cinco días las habas están');
assert.equal(etapa(p, 8), 'para cosechar');
assert.equal(avance(p, 99), 1, 'no se pasa de maduro');

// ---------------------------------------------------------------- la lluvia riega
const r = {};
sembrar(r, '0:0', 'papas', 10);
assert.equal(regarConLluvia(r, 10), 1, 'la lluvia del día riega');
assert.equal(regarConLluvia(r, 10), 0, 'pero una sola vez por día, llueva lo que llueva');
assert.equal(diasCrecido(r['0:0'], 10), 1, 'el día de lluvia cuenta doble');
regarConLluvia(r, 11); regarConLluvia(r, 12);
assert.equal(diasCrecido(r['0:0'], 12), 5, 'dos días que pasaron + tres de lluvia');
assert.equal(diasQueFaltan(r['0:0'], 12), 2);
regarConLluvia(r, 13); // 3 + 4 = 7: lista
assert.equal(lista(r['0:0'], 13), true, 'con lluvia seguida las papas salen en cuatro días en vez de siete');
assert.equal(regarConLluvia(r, 14), 0, 'lo que ya está maduro no necesita agua');

// ---------------------------------------------------------------- cosechar
assert.deepEqual(cosechar({}, 'x', 1), { ok: false, motivo: 'vacio' });
const verde = {}; sembrar(verde, '2:2', 'papas', 1);
const nv = cosechar(verde, '2:2', 3);
assert.equal(nv.ok, false); assert.equal(nv.motivo, 'verde'); assert.equal(nv.faltan, 5);
assert.ok(verde['2:2'], 'lo verde no se arranca');
const cos = cosechar(h, '1:1', 8);
assert.deepEqual(cos, { ok: true, cultivo: 'habas', ingrediente: 'haba', cantidad: CULTIVOS.habas.cosecha });
assert.equal(h['1:1'], undefined, 'cosechado, el cantero queda vacío para volver a sembrar');

// ---------------------------------------------------------------- qué se siembra
const tengo = (m) => (k) => m[k] || 0;
assert.equal(semillaParaSembrar(tengo({})), null);
assert.equal(semillaParaSembrar(tengo({ frutilla: 2 })).cultivo, 'frutillas', 'una frutilla del sendero alcanza');
assert.equal(semillaParaSembrar(tengo({ frutilla: 2 })).conIngrediente, true);
assert.equal(semillaParaSembrar(tengo({ 'semillas-papa': 1, frutilla: 3 })).cultivo, 'papas', 'la semilla comprada va antes que la frutilla');
assert.equal(semillaParaSembrar(tengo({ 'semillas-habas': 1, 'semillas-papa': 1 })).cultivo, 'habas');

// ---------------------------------------------------------------- textos
assert.equal(textoCantero(null, 1), 'Sembrar en el cantero');
const t1 = {}; sembrar(t1, '0:0', 'frutillas', 1);
assert.equal(textoCantero(t1['0:0'], 1), 'Frutillas: recién sembrado · faltan 3 días');
assert.equal(textoCantero(t1['0:0'], 3), 'Frutillas: creciendo · falta un día');
assert.equal(textoCantero(t1['0:0'], 4), 'Cosechar frutillas');
assert.deepEqual(resumenHuerta(t1, 4), { canteros: 1, listos: 1 });

// ---------------------------------------------------------------- saneo
assert.deepEqual(sanearHuerta(null), {});
assert.deepEqual(sanearHuerta([1, 2]), {});
const s = sanearHuerta({ '3:-4': { cultivo: 'habas', dia: '7', lluvia: 99 }, 'basura': { cultivo: 'habas' }, '1:1': { cultivo: 'maíz' }, '2:2': null });
assert.deepEqual(Object.keys(s), ['3:-4'], 'sólo entran claves de cantero con cultivo conocido');
assert.equal(s['3:-4'].dia, 7);
assert.equal(s['3:-4'].lluvia, 30, 'la lluvia acumulada tiene techo');
const muchos = {}; for (let i = 0; i < 200; i++) muchos[`${i}:0`] = { cultivo: 'papas', dia: 1 };
assert.equal(Object.keys(sanearHuerta(muchos)).length, 64, 'nadie tiene doscientos canteros');

// ---------------------------------------------------------------- el almacén vende semillas, y más de una vez
for (const id of ['semillas-habas', 'semillas-papa']) {
  assert.ok(TRUEQUE[id], `el almacén no tiene ${id}`);
  assert.equal(TRUEQUE[id].repetible, true, `${id} se gasta: tiene que poder volver a cambiarse`);
  assert.equal(tieneYa(TRUEQUE[id], { [id]: 5 }), false);
}
assert.equal(tieneYa(TRUEQUE.yerba, { yerba: 8 }), false, 'la yerba también se repite, como antes');
assert.equal(tieneYa(TRUEQUE.farol, { farol: 1 }), true, 'lo que no se gasta se cambia una vez');
assert.match(leer('src/main.js'), /const POR_PAGINA_ALMACEN = 9;/, 'el almacén se elige con los números del 1 al 9, de a nueve por página');

// ---------------------------------------------------------------- el cuaderno
assert.ok(SECCIONES.some((x) => x.id === 'huerta'), 'hay sección de huerta');
assert.equal(new Set(SECCIONES.map((x) => x.id)).size, SECCIONES.length,
  'ninguna sección repetida (la de trueque salía dos veces desde antes de la 1.6)');
for (const id of ['haba', 'papa', 'frutilla-huerta', 'papas-rescoldo', 'habas-salteadas', 'semillas-habas', 'semillas-papa']) {
  assert.ok(ENTRADA[id], `falta ${id} en el cuaderno`);
}
for (const id of ['haba', 'papa', 'frutilla-huerta']) assert.equal(ENTRADA[id].seccion, 'huerta');

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js'), cons = leer('src/construccion.js'), guardado = leer('src/guardado.js');
assert.match(cons, /id: 'cantero', nombre: 'Cantero de huerta'/, 'el cantero se construye');
assert.match(cons, /funciones: \['huerta'\]/);
assert.match(cons, /cantero: 'trabajo'/, 'aparece en O → Trabajo');
assert.match(main, /function usarCantero\(c\)/);
assert.match(main, /const c = canteroCerca\(\); if \(c\) \{ usarCantero\(c\); break; \}/, 'E siembra y cosecha');
assert.match(main, /matasHuerta = crearMatasHuerta\(escena\);/);
assert.match(main, /revisarHuerta\(\);/, 'la lluvia y los días se revisan');
// 1.11: las recetas se mudaron a cocina.js
const cocina = leer('src/cocina.js');
assert.match(cocina, /\{ id: 'papas-rescoldo', nombre: 'papas al rescoldo', pide: \[\{ k: 'papa', n: 3 \}\] \}/);
assert.match(cocina, /\{ id: 'habas-salteadas', nombre: 'habas salteadas', pide: \[\{ k: 'haba', n: 4 \}\] \}/);
assert.match(main, /if \(tieneYa\(t, progreso\.cosas\)\)/, 'el almacén usa el mismo criterio que la prueba');
assert.match(main, /progreso\.cosas\[t\.id\] = t\.repetible \? \(progreso\.cosas\[t\.id\] \|\| 0\) \+ \(t\.da \|\| 1\) : 1;/);
assert.match(guardado, /huerta: sanearHuerta\(p\.huerta\)/);
assert.match(leer('src/huerta-malla.js'), /new THREE\.InstancedMesh\(hojaGeo/, 'las matas van instanciadas: más canteros no suman llamadas de dibujo');

// El aviso y la tecla E usan la misma prioridad (lo pide el comentario de la tecla E).
// La partida real lo encontró: con el cantero al lado de una puerta, el aviso decía
// "Abrir la puerta" y E sembraba. El acopio tenía el mismo desfase desde la 1.6.
const avisoCantero = main.indexOf("aviso = { tecla: 'E', texto: textoAvisoCantero");
const avisoAcopio = main.indexOf("aviso = { tecla: 'E', texto: totalEnMano() > 0");
const avisoPuerta = main.indexOf("const puertaCerca = !objetivo && !js.enTren && !js.enKayak && puertas && puertas.cerca(js.pos);");
assert.ok(avisoCantero > 0 && avisoAcopio > 0 && avisoPuerta > 0);
assert.ok(avisoCantero < avisoPuerta && avisoAcopio < avisoPuerta, "el aviso del cantero y del acopio van antes que el de la puerta, como en la tecla E");
const teclaCantero = main.indexOf("const c = canteroCerca(); if (c) { usarCantero(c); break; }");
const teclaPuerta = main.indexOf("if (p) { puertas.accionar(p); break; }");
assert.ok(teclaCantero > 0 && teclaCantero < teclaPuerta, "y en la tecla E, el cantero antes que la puerta");

console.log('huerta: ok ·', ORDEN_CULTIVOS.length, 'cultivos · la lluvia riega una vez por día · semillas repetibles en el almacén');
