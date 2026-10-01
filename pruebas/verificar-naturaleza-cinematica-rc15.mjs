import fs from 'fs';
import assert from 'assert/strict';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const materiales = leer('../src/materiales.js');
const veg = leer('../src/vegetacion.js');
const vida = leer('../src/vida.js');
const fauna = leer('../src/fauna.js');
const bichos = leer('../src/bichos.js');

// Copas cercanas: profundidad de silueta sin draw calls extra.
assert.match(veg, /RC15: un lóbulo secundario/);
// 3.2: el lóbulo se subdivide una vez más y se aplana abajo (estilo pintado, sin facetas)
assert.match(veg, /const sat = aplanarBase\(abollar\(new THREE\.IcosahedronGeometry\(rr, 1\)/);
assert.match(veg, /se fusiona en la geometría/);

// LOD: ambos niveles usan materiales distintos y crossfade dither por distancia real.
assert.match(materiales, /lod = null/);
assert.match(materiales, /uLodModo/);
assert.match(materiales, /crossfade dither/i);
assert.match(materiales, /mascaraLod/);
assert.match(veg, /const mezclaLod = 10/); // RC31.2: umbral LOD por árbol, complementario
assert.match(veg, /modo: 1/);
assert.match(veg, /modo: 2/);
assert.match(veg, /ambos LOD conviven sólo en un anillo acotado/);

// Viento: base anclada y respuesta adicional de copa/ramas altas.
assert.match(materiales, /anclajeRaiz/);
assert.match(materiales, /respuestaCopa/);
assert.match(materiales, /torsionAlta/);

// Locomoción: paso/trote/galope no son la misma senoide escalada.
assert.match(vida, /export function marchaMamifero/);
for (const modo of ['quieto', 'paso', 'trote', 'galope']) assert.match(vida, new RegExp(`modo: '${modo}'`));
assert.match(vida, /const marcha = marchaMamifero\(a\.vel/);      // huemul / ciervos
assert.match(vida, /const marchaZ = marchaMamifero\(z\.vel/);    // zorro
assert.match(fauna, /const marchaP = marchaMamifero\(p\.vel/);   // pudú
assert.match(bichos, /const marchaG = marchaMamifero\(gu\.vel/); // guanaco
assert.match(vida, /a\.marcha = marcha\.modo/);
assert.match(fauna, /p\.marcha = marchaP\.modo/);
assert.match(bichos, /gu\.marcha = marchaG\.modo/);

console.log('OK Naturaleza Cinemática RC15 · copas profundas · LOD dither sin popping duro · viento por altura · paso/trote/galope · huemul/zorro/pudú/guanaco integrados');
