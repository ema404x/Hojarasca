import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (ruta) => fs.readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const e = leer('src/estructuras.js');
const main = leer('src/main.js');
const tpl = leer('src/plantilla.html');

// 1) Todo apoyo exterior importante puede consultar la cota real del terreno.
assert.ok(e.includes('const sueloLocal = (sitio, rotY, lx, lz)'), 'falta la referencia local al terreno');
assert.ok(e.includes('const posteHastaTerreno ='), 'faltan apoyos adaptados al terreno');
assert.ok(e.includes('sitio = null, rotY = 0'), 'las bajadas de cubierta dejaron de aceptar el terreno real');

// 2) Los accesos principales no deben tener postes centrados bloqueándolos.
assert.ok(!e.includes('[-W / 2 - 0.35, 0, W / 2 + 0.35]'), 'volvió el poste central delante de la escalera de cabaña');
assert.ok(!e.includes('[-W / 2 + 0.2, 0, W / 2 - 0.2]'), 'volvió un apoyo central delante de la Casa de Té');

// 3) El molino tiene ruta real hasta el balcón superior.
assert.ok(e.includes('const ANG_SALIDA_BALCON'), 'falta el hueco de llegada al balcón del molino');
assert.ok(e.includes('const PASOS_ALTOS = 19'), 'falta el segundo tramo de escalera del molino');

// 4) Interacciones y mobiliario coinciden con lo que se ve.
assert.ok(!e.includes('* 0, z: q.z'), 'regresó una posición de silla anulada por multiplicar por cero');
assert.ok(e.includes('const mostrador = w(0, 0.3)'), 'el punto del mostrador no coincide con su mueble');
assert.ok(e.includes("nombre: 'el banco del galpón'"), 'el sentadero del galpón volvió a no tener banco visible');

// 5) Los complejos grandes limpian el área que realmente ocupan.
assert.ok(e.includes('radio: 24'), 'el galpón volvió a declarar un radio menor que sus corrales');
assert.ok(main.includes('e.galpon.radio || 24'), 'la vegetación no respeta el radio completo del galpón');
assert.ok(main.includes('limpiar(T.lugares.refugio, 9.5, 8.5)'), 'el fogón del refugio puede volver a nacer entre vegetación');
assert.ok(main.includes('limpiar(e.faro, (e.faro?.radio || 6.2) + 0.8, 6.2)'), 'la escalinata del faro puede volver a quedar invadida por vegetación');

// 6) Faro y almacén aterrizan sus accesos en el suelo real.
assert.ok(e.includes('const sitioFaroFis = { x: mejor.x, z: mejor.z, y: y0 }'), 'los escalones del faro volvieron a usar alturas fijas');
assert.ok(e.includes('const sueloPaso = sueloLocal(sitioFaroFis, rot, 0, zEscFaro[i])'), 'el faro no consulta el terreno bajo cada escalón');
assert.ok(e.includes('const zPasosAlmacen ='), 'el almacén volvió a un acceso de un solo peldaño');
assert.ok(e.includes('const sueloExteriorAlmacen = sueloLocal'), 'la entrada del almacén no aterriza en el terreno real');

// 7) La marca temporal de V6 ya no debe formar parte del juego final.
assert.ok(!tpl.includes('ESTRUCTURAS V6 · VISUAL'), 'sigue visible la marca de build temporal');

console.log('OK terminación estructural v7');
