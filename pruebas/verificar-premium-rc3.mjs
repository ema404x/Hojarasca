import { nivelRc } from './version.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const leer=(f)=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const estructuras=leer('src/estructuras.js');
const main=leer('src/main.js');
const gente=leer('src/gente.js');
const html=leer('src/plantilla.html');
const pkg=JSON.parse(leer('package.json'));
const index=leer('index.html');

const rc = nivelRc(pkg.version);
assert.ok(rc >= 3, `se esperaba RC3 o posterior y llegó ${pkg.version}`);
assert.match(estructuras,/const faldaCimientoTerreno/);
assert.match(estructuras,/const rot = Math\.atan2\(p\.x - sitio\.x, p\.z - sitio\.z\) \+ Math\.PI;/);
// (3.6: con la aldea, el galpón se aleja de donde el sorteo dejaba la casa de té y el almacén)
assert.match(estructuras,/lejosDe: \[L\.refugio, L\.cabana, L\.puesto, molino, casaTe(Sorteo)?, torre, almacen(Sorteo)?\]/);
assert.match(estructuras,/const candidatoFaro/);
assert.match(estructuras,/if \(!mejor\) \{/);
assert.match(estructuras,/const y0 = \(mejor\.sueloMax \?\? mejor\.y\) \+ 0\.10/);
assert.match(estructuras,/radio: 6\.2/);
assert.match(estructuras,/radio: 24/);

// El tren debe reservar estaciones antes de poblar objetos.
const iTren=main.indexOf("tren = await paso('Tendiendo las vías de la trochita'");
const iObj=main.indexOf("objetos = await paso('Escondiendo frutillas y plumas'");
assert.ok(iTren>=0 && iObj>iTren,'los objetos deben generarse después de La Trochita');
for(const marca of ['zona(e.faro, e.faro?.radio || 6.2)','zona(e.almacen, e.almacen?.radio || 9)','zona(e.galpon, e.galpon?.radio || 24)','zona(e.cueva, e.cueva?.radio || 9)','for (const p of t.paradas) edificios.push']) assert.ok(main.includes(marca),`falta zona reservada: ${marca}`);

// La acción E debe obedecer al mismo orden que el aviso: mirar a una persona
// gana frente a mostrador/puerta, y el mostrador no pisa un aviso ya existente.
assert.ok(main.indexOf('if (vecino) { hablar(vecino); break; }') < main.indexOf('cercaDelMostrador()) { abrirAlmacen(); break; }'));
// 2.4.1: el aviso del mostrador lleva más condiciones (tren, kayak, caballo, lo que mirás)
assert.match(main,/if \(!aviso && [^\n]*cercaDelMostrador\(\)/);

// Ercilia ya no es contenido huérfano.
assert.match(gente,/if \(L\.almacen\) \{/);
assert.match(gente,/const npc = agregar\('ercilia'/);
assert.match(gente,/darPlanilla\(npc\)/);
assert.match(html,/Ercilia · Almacén de Ramos Generales/);

// Ayuda y comportamiento de construcción deben coincidir.
assert.match(main,/case 'KeyO': abrirObra/);
assert.match(html,/R o rueda gira/);
assert.match(html,/Tab cambia categoría/);
assert.match(html,/O cierra/);
assert.doesNotMatch(html,/rueda para girar · C para cerrar/);

assert.match(index,/id="version-completa">Versión \d+\.\d+\.\d+/);
assert.ok(index.includes('Ercilia · Almacén de Ramos Generales'),'index sin Ercilia · Almacén de Ramos Generales');
console.log('OK Premium RC3 · estructuras garantizadas, mundo reservado, Ercilia y UX coherentes');
