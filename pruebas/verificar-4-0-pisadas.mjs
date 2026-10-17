// 4.0 (aplastado del pasto): las huellas del jugador se apagan solas sin saltos, los animales quedan en las primeras
// pisadas, en calidad media y baja no hay nada y el shader del pasto lo lee sólo con RICO.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';
registrarThree();
const { crearPisadas, N_PISADAS, calidadConPisadas } = await import('../src/pisadas.js');
const { U } = await import('../src/materiales.js');
const v = U.uPisadas.value;
const fuerza = (i) => v[i * 4 + 3];
const huellas = () => { let n = 0; for (let i = 4; i < N_PISADAS; i++) if (fuerza(i) > 0) n++; return n; };

assert.equal(v.length, N_PISADAS * 4, 'el uniforme es un arreglo plano de N·4 números');
assert.ok(calidadConPisadas({ pasto: 90000 }) && !calidadConPisadas({ pasto: 40000 }) && !calidadConPisadas({ pasto: 0 }), 'sólo calidad alta');

// calidad baja: no se escribe nada
const baja = crearPisadas({ calidad: { pasto: 0 }, perro: null, caballo: null, fauna: null });
baja.actualizar(0.05, { x: 0, z: 0 }); baja.actualizar(0.05, { x: 5, z: 0 });
assert.equal(huellas(), 0, 'en calidad baja no hay huellas');

// calidad alta: caminar a 4 m/s deja huellas, la última aplasta del todo y todas se apagan antes de reciclarse
const alta = crearPisadas({ calidad: { pasto: 90000 }, perro: { est: { pos: { x: 3, z: 1 } } }, caballo: null, fauna: { pudues: [] } });
const pos = { x: 0, z: 0 };
let maxSalto = 0, previo = new Float32Array(N_PISADAS);
for (let t = 0; t < 12; t += 0.05) {
  pos.x += 4 * 0.05; alta.actualizar(0.05, pos);
  for (let i = 4; i < N_PISADAS; i++) {
    const d = fuerza(i) - previo[i];
    // sólo cuenta el salto hacia abajo de una huella que no es nueva (las nuevas arrancan en 1 y suben)
    if (previo[i] > 0 && d < 0) maxSalto = Math.max(maxSalto, -d);
    previo[i] = fuerza(i);
  }
}
assert.ok(maxSalto < 0.08, `ninguna huella se apaga de golpe (salto máximo por cuadro ${maxSalto.toFixed(3)})`);
assert.ok(huellas() >= 5 && huellas() <= 20, `quedan huellas recientes (${huellas()})`);
assert.ok(Math.abs(fuerza(0) - 0.9) < 1e-6, 'el perro aplasta (animal 0)');
assert.equal(v[0], 3, 'el perro en su lugar');

// quedarse quieto: las huellas se levantan del todo en 7 s
for (let t = 0; t < 8; t += 0.05) alta.actualizar(0.05, pos);
assert.equal(huellas(), 0, 'a los 8 s quieto todas las huellas se levantaron');

// el viento y el empuje del jugador no se tocaron y el shader lee las pisadas sólo con RICO
const pasto = fs.readFileSync(new URL('../src/pasto.js', import.meta.url), 'utf8');
assert.ok((pasto.match(/#ifdef RICO/g) || []).length >= 3, 'hierba, flores y helechos leen las pisadas dentro de #ifdef RICO');
assert.ok(/defines: rico \? \{ RICO: 1 \} : \{\}/.test(pasto), 'sin calidad alta no se define RICO');
assert.ok(/smoothstep\(14\.0, 22\.0, d\)/.test(pasto), 'el aplastado se apaga con la distancia (sin corte)');
assert.ok(/p\.xz \+= normalize\(aleja \+ 0\.0001\) \* empuje \* 0\.55 \* alto;/.test(pasto), 'el empuje del jugador sigue igual');
console.log('verificar-4-0-pisadas: OK');
