import fs from 'node:fs';
import assert from 'node:assert/strict';

const e = fs.readFileSync(new URL('../src/estructuras.js', import.meta.url), 'utf8');

// 1) Faro: la altura base debe existir antes de que cualquier pieza exterior la use.
const iniFaro = e.indexOf('// ---------------------------------------------------------------- faro');
const finFaro = e.indexOf('// ---------------------------------------------------------------- lugar llano y despejado', iniFaro);
assert.ok(iniFaro >= 0 && finFaro > iniFaro, 'No se pudo aislar el faro');
const faro = e.slice(iniFaro, finFaro);
const declY0 = faro.indexOf('const y0 = (mejor.sueloMax ?? mejor.y) + 0.10');
const usoY0 = faro.indexOf('const sitioFaroFis = { x: mejor.x, z: mejor.z, y: y0 }');
assert.ok(declY0 >= 0 && usoY0 > declY0, 'El faro usa y0 antes de declararlo');
assert.ok(!faro.includes('new THREE.CylinderGeometry(R_BASE + 0.35, R_BASE + 0.85, 1.85'), 'Volvió el zócalo cilíndrico cerrado que tapa la puerta del faro');
assert.ok(faro.includes("color: '#6b6660', hueco: HUECO_PUERTA"), 'El zócalo visible del faro debe compartir el vano de la puerta');

// 2) Molino: la base pétrea tiene puerta real y la torre de madera no se superpone.
const iniMol = e.indexOf('// ---------------------------------------------------------------- molino holandés');
const finMol = e.indexOf('// ---------------------------------------------------------------- casa de té', iniMol);
assert.ok(iniMol >= 0 && finMol > iniMol, 'No se pudo aislar el molino');
const molino = e.slice(iniMol, finMol);
assert.ok(!molino.includes('new THREE.CylinderGeometry(2.5, 2.9, 2.6, 8)'), 'Volvió la base cerrada del molino');
assert.ok(molino.includes("color: '#7d7368', hueco: HUECO_MOLINO"), 'La base del molino no respeta el vano de entrada');
assert.ok(molino.includes('const TORRE_DESDE = 2.60'), 'La torre de madera volvió a superponerse con toda la base de piedra');

// 3) Cabañas: accesorios exteriores y accesos aterrizan en la cota local.
assert.ok(e.includes('const chSuelo = sueloLocal({ x, z, y }, rot, chX, chZ)'), 'La chimenea de cabaña volvió a una profundidad fija');
assert.ok(e.includes('const sueloLeñera = Math.max(...zLeñera.flatMap'), 'La leñera de cabaña no se adapta al terreno');
assert.ok(e.includes('const sueloPie = sueloLocal({ x, z, y }, rot, lado * 1.05, zPie)'), 'El pasamanos exterior volvió a terminar en una altura fija');
assert.ok(e.includes('const sRemo1 = sueloLocal({ x, z, y }, rot'), 'Los remos exteriores volvieron a flotar/enterrarse según la ladera');

// 4) Refugio/fogón: piezas exteriores apoyadas en el terreno que tienen debajo.
assert.ok(e.includes('const sueloToconAlero = sueloLocal(ref, rot'), 'El tocón trasero del refugio volvió a usar altura fija');
assert.ok(e.includes('const sueloFogonLocal = (lx, lz) => T.altura'), 'El fogón volvió a asumir un plano perfectamente horizontal');


// 5) Aleros: la pendiente debe caer hacia afuera y los postes terminar bajo la cara inferior.
assert.ok(e.includes('const INCL_GALERIA = 0.11'), 'el techo de galería de cabaña volvió a inclinarse hacia la casa');
assert.ok(e.includes('const yPosteGaleria = 2.48 -'), 'los postes de la galería no terminan contra la cara inferior del techo');
assert.ok(e.includes('const INCL_ALERO_TE = 0.12'), 'el alero de Casa de Té volvió a subir hacia afuera');
assert.ok(e.includes('alero.rotation.x = INCL_ALERO_TE'), 'el alero de Casa de Té no usa su pendiente constructiva');
assert.ok(e.includes('const INCL_ALERO_ALM = -0.10'), 'el alero del almacén volvió a subir hacia la calle');
assert.ok(e.includes('const yPosteAlm = 2.92 -'), 'los postes del almacén no terminan bajo su alero');
assert.ok(e.includes('const INCL_COB_GAL = 0.10'), 'el cobertizo del galpón perdió su pendiente estructural');
assert.ok(e.includes('const yPosteCob = 2.72 +'), 'los postes del cobertizo atraviesan o no alcanzan la chapa');

// 6) Umbrales y objetos apoyados: nada grande debe quedar suspendido por usar espesor fijo.
assert.ok(e.includes('espesor: Math.max(0.14, altoPasoRef - sueloPasoRef + 0.05)'), 'el umbral del refugio puede volver a flotar');
assert.ok(e.includes('espesor: Math.max(0.12, altoPasoMol - sueloPasoMol + 0.05)'), 'el umbral del molino puede volver a flotar');
assert.ok(e.includes('espesor: Math.max(0.11, altoPasoTe - sueloAccesoTe + 0.045)'), 'el acceso de Casa de Té puede volver a flotar');
assert.ok(e.includes("caja(c, [bx, 0.76, -D / 2 - 1.45]"), 'los cajones exteriores del almacén no descansan sobre la vereda');
assert.ok(e.includes('Durmientes bajo la tarima'), 'la tarima de esquila volvió a quedar suspendida sobre el piso');

console.log('OK terminación estructural v8');
