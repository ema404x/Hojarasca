import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const fallo = [];
const exigir = (cond, msg) => { if (!cond) fallo.push(msg); };

const index = leer('index.html');
const plantilla = leer('src/plantilla.html');
const guardado = leer('src/guardado.js');
const main = leer('src/main.js');
const jugador = leer('src/jugador.js');
const materiales = leer('src/materiales.js');
const huellas = leer('src/huellas.js');
const electron = leer('main.cjs');
const preload = leer('preload.cjs');
const pkg = JSON.parse(leer('package.json'));

// Producto y navegación
for (const marca of ['btn-guardar','btn-controles','btn-creditos','btn-salir','controles-completos','creditos','error-release']) {
  exigir(index.includes(marca), `index sin ${marca}`);
}
// 3.5.1: la pregunta es un cuadro del juego (dialogo.js), ya no el confirm del navegador
exigir(main.includes("dialogos.confirmar('Esto borra el recorrido guardado"), 'Nuevo recorrido no confirma borrado');
exigir(main.includes("window.addEventListener('beforeunload', guardar)"), 'falta guardado al cerrar');

// Guardado resiliente
exigir(guardado.includes("CLAVE_BACKUP = 'hojarasca-v1-backup'"), 'falta backup de partida');
exigir(guardado.includes('localStorage.getItem(CLAVE_BACKUP)') && guardado.includes("ultimoOrigenCarga = 'backup'"), 'carga no recupera backup');
exigir(index.includes("CLAVE_BACKUP = 'hojarasca-v1-backup'"), 'bundle sin backup de partida');

// Accesibilidad / cámara realmente conectada
for (const marca of ['invertirY', 'fov', 'movimientoCamara']) {
  exigir(guardado.includes(marca), `ajustes base sin ${marca}`);
  exigir(index.includes(marca), `bundle sin ${marca}`);
}
exigir(plantilla.includes('Movimiento de cámara'), 'UI sin movimiento de cámara reducido');
exigir(main.includes('movimientoCamara: () => ajustes.movimientoCamara'), 'main no conecta movimientoCamara al jugador');
exigir(jugador.includes("opciones.movimientoCamara?.() === 'reducido'"), 'jugador no aplica movimiento de cámara reducido');
exigir(jugador.includes('opciones.invertirY?.()'), 'jugador no aplica invertir Y');
exigir(jugador.includes('opciones.fov?.()'), 'jugador no aplica FOV configurable');
exigir(index.match(/movimientoCamara/g)?.length >= 5, 'bundle parece desincronizado con movimientoCamara');


// Features que existían a medio implementar y ahora deben llegar al build final.
exigir(main.includes("import { crearHuellas } from './huellas.js'"), 'main no integra huellas');
exigir(main.includes('huellas = crearHuellas()'), 'main no crea el sistema de huellas');
exigir(main.includes('huellas?.actualizar'), 'main no actualiza huellas');
exigir(materiales.includes('uniform sampler2D uHuellas'), 'shader del terreno no recibe huellas');
exigir(materiales.includes('float pisada = texture2D(uHuellas'), 'shader no dibuja las pisadas');
exigir(!materiales.includes('las huellas en la nieve quedaron pendientes'), 'quedó marcador de feature pendiente');
exigir(huellas.includes('function marcar(x, z, fuerza)'), 'módulo de huellas incompleto');
exigir(index.includes('// ===== huellas.js =====') && index.includes('huellas?.actualizar'), 'bundle sin sistema de huellas integrado');

// Desktop/release
exigir(electron.includes('requestSingleInstanceLock'), 'falta bloqueo de segunda instancia');
exigir(electron.includes('archivosRecursivos(src)'), 'rebuild no invalida por todo src/');
exigir(electron.includes('render-process-gone'), 'falta registro de crash del renderer');
exigir(preload.includes("ipcRenderer.send('salir-juego')"), 'preload no expone salida limpia');
exigir(pkg.build?.asar === true, 'asar no está habilitado');
exigir(pkg.scripts?.verify?.includes('verificar-release.mjs'), 'verify no incluye release check');

// Mapa completo: no reintroducir descubrimiento como requisito visual.
exigir(index.includes('Mapa completo del valle'), 'leyenda del mapa no indica mapa completo');
exigir(!index.includes('Lo que no recorriste queda en blanco'), 'volvió leyenda de descubrimiento');

if (fallo.length) {
  console.error('MEGA RC1 FALLÓ');
  for (const f of fallo) console.error(' -', f);
  process.exit(1);
}
console.log('OK mega RC1 · producto, guardado, accesibilidad, desktop y bundle sincronizados');
