import fs from 'fs';
import assert from 'assert/strict';
import { actividadFaunaPatagonica, perfilRefugioTerreno, destinoEscapeConCobertura } from '../src/ecosistema.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const vida = leer('../src/vida.js');
const bichos = leer('../src/bichos.js');
const huellas = leer('../src/huellas.js');
const clima = leer('../src/clima.js');
const niebla = leer('../src/niebla.js');
const main = leer('../src/main.js');

// Ritmos diarios: no son simples on/off; cada especie tiene una ventana distinta.
assert.ok(actividadFaunaPatagonica('huemul', 7.2) > actividadFaunaPatagonica('huemul', 12), 'huemul debe priorizar horas crepusculares');
assert.ok(actividadFaunaPatagonica('zorro', 23) > actividadFaunaPatagonica('zorro', 12), 'zorro colorado debe ser más activo de noche que al mediodía');
assert.ok(actividadFaunaPatagonica('guanaco', 12) > actividadFaunaPatagonica('guanaco', 23), 'guanaco debe conservar actividad diurna superior');
assert.ok(actividadFaunaPatagonica('zorzal', 12) > actividadFaunaPatagonica('zorzal', 23), 'aves de suelo deben concentrar actividad con luz');
assert.ok(actividadFaunaPatagonica('huemul', 7.2, { lluvia: 1, tormenta: true }) < actividadFaunaPatagonica('huemul', 7.2), 'mal tiempo debe reducir actividad visible sin anularla');

// Perfil de refugio: borde/matorral y ambiente abierto son propiedades separadas.
const Tperfil = {
  bosque: [0.48, 0.05], estepa: [0.08, 0.92], pasto: [0.72, 0.18], pendiente: [0.2, 0.1],
  distRio: [8, 80], anchoRio: [2, 2], indice: (x) => x > 0 ? 1 : 0,
};
const borde = perfilRefugioTerreno(Tperfil, -1, 0);
const abierto = perfilRefugioTerreno(Tperfil, 1, 0);
assert.ok(borde.matorral > abierto.matorral, 'un borde boscoso debe ofrecer más cobertura que estepa abierta');
assert.ok(abierto.abierto > borde.abierto, 'la estepa debe leerse como espacio abierto');

// La ruta de escape admite un objetivo de cobertura intermedia, no sólo bosque máximo.
const Tes = {
  bosque: [0.08, 0.5, 0.96], estepa: [0.8, 0.15, 0.02], pasto: [0.2, 0.75, 0.35], pendiente: [0.1, 0.1, 0.1],
  distRio: [80, 20, 40], anchoRio: [2, 2, 2],
  indice: (x) => x < -3 ? 0 : x > 3 ? 2 : 1,
  agua: () => false,
  normal: () => ({ x: 0, y: 1, z: 0 }),
};
const ruta = destinoEscapeConCobertura(Tes, { x: 0, z: 0 }, { x: 0, z: -10 }, { radio: 18, muestras: 13, preferirCobertura: 1, objetivoCobertura: 0.62, preferirBorde: 0.8, evitarEstepa: 0.6 });
assert.ok(ruta, 'debe encontrar una ruta con cobertura');

// Integraciones conductuales RC18.
assert.match(vida, /actividadFaunaPatagonica\('huemul'/);
assert.match(vida, /estado = 'descansar'/);
assert.match(vida, /objetivoCobertura: 0\.68/);
assert.match(vida, /actividadZorro/);
assert.match(vida, /actividadBandurria/);
assert.match(bichos, /actividadLiebre/);
assert.match(bichos, /actividadGuanaco/);
assert.match(bichos, /actividadZorzal/);
assert.match(bichos, /animalMasCercano\('alarmaAve'/);
assert.match(bichos, /publicarAnimal\('alarmaAve'/);

// Rastros: RC18 amplía sin romper la firma histórica de RC17/MEGA RC1.
assert.match(huellas, /s\.tipo !== 'huemul' && s\.tipo !== 'zorro'/);
assert.match(huellas, /s\.tipo !== 'guanaco'/);
assert.match(huellas, /s\.tipo !== 'liebre'/);
assert.match(huellas, /guanaco: \{ paso:/);
assert.match(huellas, /liebre: \{ paso:/);
assert.match(main, /bichos\.rastros\?\.\(\)/);

// Atmósfera local: ráfagas por exposición y niebla húmeda de mallín/ribera.
assert.match(clima, /vientoBase/);
assert.match(clima, /estado\.rafaga/);
assert.match(clima, /estepaLocal/);
assert.match(clima, /bosqueLocal/);
assert.match(clima, /rafagaObjetivo/);
assert.match(niebla, /T\.lugares\?\.mallin/);
assert.match(niebla, /perfilHabitatPatagonico/);
assert.match(niebla, /p\.mallin \* 0\.9/);
assert.match(niebla, /clima\.rafaga/);
assert.match(main, /niebla\.actualizar\(progreso\.horas, clima\.estado, U\.uInvierno\.value, cam\)/);

console.log('OK Ecosistema Atmosférico RC18 · ritmos diarios · descanso/forrajeo · alarma aviar en cadena · huellas ampliadas · ráfagas locales · niebla de mallín/ribera');
