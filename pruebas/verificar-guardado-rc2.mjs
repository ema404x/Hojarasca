// RC2: el guardado debe sobrevivir a corrupción, migrar IDs viejos y sanear ajustes.
import assert from 'node:assert/strict';

const datos = new Map();
globalThis.localStorage = {
  getItem: (k) => datos.has(k) ? datos.get(k) : null,
  setItem: (k, v) => datos.set(k, String(v)),
  removeItem: (k) => datos.delete(k),
};

const G = await import('../src/guardado.js?rc2=' + Date.now());

// Ajustes dañados no pueden romper renderer/cámara.
datos.set('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'ultra-imposible', volumen: 9, sensibilidad: -20, fov: 500, invertirY: 'sí' }));
const a = G.cargarAjustes();
assert.equal(a.calidad, 'media');
assert.equal(a.volumen, 1);
assert.equal(a.sensibilidad, 0.3);
assert.equal(a.fov, 90);
assert.equal(a.invertirY, false);

// Principal corrupto + backup sano: debe recuperar el backup y conservarlo.
const backup = G.progresoNuevo();
backup.dia = 12;
backup.pos = { x: 9000, z: -9000 };
backup.entradas['frutillas-rescoldo'] = { cantidad: 1 };
backup.entradas['te-torta'] = { cantidad: 1 };
datos.set('hojarasca-v1', '{"truncado":');
datos.set('hojarasca-v1-backup', JSON.stringify(backup));
const recuperado = G.cargarProgreso();
assert.equal(recuperado.dia, 12);
assert.ok(recuperado.entradas['frutillas-brasas']);
assert.ok(recuperado.entradas['te-galesa']);
assert.equal(recuperado.entradas['frutillas-rescoldo'], undefined);
assert.equal(recuperado.entradas['te-torta'], undefined);
assert.ok(Math.abs(recuperado.pos.x) <= 468 && Math.abs(recuperado.pos.z) <= 468);
const backupAntes = datos.get('hojarasca-v1-backup');
assert.equal(G.guardarProgreso(recuperado), true);
assert.equal(datos.get('hojarasca-v1-backup'), backupAntes, 'un principal corrupto no debe pisar el backup sano');
assert.doesNotThrow(() => JSON.parse(datos.get('hojarasca-v1')));

// En el siguiente guardado, el principal válido anterior sí pasa a backup.
const previo = datos.get('hojarasca-v1');
recuperado.dia = 13;
assert.equal(G.guardarProgreso(recuperado), true);
assert.equal(datos.get('hojarasca-v1-backup'), previo);
assert.equal(JSON.parse(datos.get('hojarasca-v1')).versionGuardado, G.VERSION_GUARDADO);


// JSON válido pero que no tiene forma de partida: también debe caer al backup.
datos.set('hojarasca-v1', JSON.stringify({ basura: true }));
datos.set('hojarasca-v1-backup', JSON.stringify({ ...backup, dia: 21 }));
const semantico = G.cargarProgreso();
assert.equal(semantico.dia, 21);
assert.equal(G.origenUltimaCarga(), 'backup');

console.log('OK guardado RC2 · recuperación sintáctica/semántica, backup transaccional, migraciones y saneamiento');
