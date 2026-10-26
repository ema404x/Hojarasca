// 4.11.3 (proceso): guardado y rutas del Coihue.
//   E3  una versión vieja del juego abre en sólo lectura una partida de una versión más nueva: ni guardar ni copiar a la carpeta sincronizada
//   M8  `escribirSync` no escribe directo si falla el `rename`: devuelve false y queda la copia anterior; el juego reintenta y avisa al tercer fallo
//   H2-3 la ruta del Coihue de cada noche se calcula repartida en cuadros, con el mismo resultado que de una vez
// Cada regla se prueba con el código de verdad y después con el código roto a propósito (la prueba tiene que fallar).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

const require = createRequire(import.meta.url);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4113-'));
process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} });

// ---- lo que se prueba, como funciones de los textos (para correrlas con el código roto)
const MAIN = leer('src/main.js'), PLANT = leer('src/plantilla.html'), SYNC = leer('sincronia-main.cjs');
const CAM = leer('src/desafio-camino.js'), ASE = leer('src/desafio-asedio-mundo.js');
const { versionMasNueva } = await import('../src/guardado.js?v4113=' + Date.now());

// E3: la regla de sólo lectura y las dos escrituras que la respetan
function revisarSoloLectura(main) {
  const regla = (version, juego) => funcion(main, 'partidaSoloLectura', { versionMasNueva, versionDeLaPartida: version, versionDelJuego: () => juego })();
  ok(regla('4.99.0', '4.11.3') === true, 'E3: una partida de una versión más nueva es de sólo lectura');
  ok(regla('4.11.3', '4.11.3') === false && regla('4.10.0', '4.11.3') === false, 'E3: con la misma o una menor se guarda como siempre');
  ok(regla('', '4.11.3') === false && regla('roto', '4.11.3') === false && regla('4.99.0', '') === false, 'E3: una partida sin versión (o una versión ilegible) se guarda como siempre');
  ok(regla('4.12.0', '4.11.9') === true && regla('5.0.0', '4.99.99') === true && regla('4.9.9', '4.10.0') === false, 'E3: compara por números, no por texto');

  // guardar(): en sólo lectura no llega a guardarProgreso (ni toca el estado) y avisa a la pantalla
  const llamadas = [];
  const eventos = [];
  const entorno = (soloLectura) => ({
    reiniciandoPartida: false, jugador: {}, banco: null, partidaSoloLectura: () => soloLectura,
    guardarProgreso: (p) => { llamadas.push(p); return true; },
    window: { dispatchEvent: (e) => eventos.push(e) }, CustomEvent: class { constructor(tipo, init) { this.type = tipo; this.detail = init?.detail; } },
  });
  const r = funcion(main, 'guardar', entorno(true))();
  ok(r === false && llamadas.length === 0, 'E3: en sólo lectura guardar() devuelve false y no escribe la partida');
  ok(eventos.length === 1 && eventos[0].detail.ok === false && eventos[0].detail.soloLectura === true, 'E3: y la pantalla se entera de que es por el sólo lectura');
  let paso = false;
  try { funcion(main, 'guardar', { ...entorno(false), T: undefined })(); } catch (e) { paso = e instanceof TypeError; }   // (sigue de largo: llega al mundo de verdad, que acá no existe)
  ok(paso, 'E3: fuera del sólo lectura guardar() sigue su camino de siempre');

  // copiarASync(): la copia a la carpeta sincronizada tampoco sale
  const e2 = (soloLectura) => ({
    esSinFin: false, syncApi: { escribir: async () => true, escribirYa: () => true }, carpetaSync: 'x', reiniciandoPartida: false, conflictoSync: false,
    partidaSoloLectura: () => soloLectura, tocaCopiar: () => true, textoParaExportar: () => { e2.exporto = true; return 'texto'; },
    nombreSync: () => 'n', modoJuego: 'relax', ranuraActual: () => 1, baseSync: 0, ultimaCopiaSync: 0, copiadoEnSync: 0, guardadoEnActual: () => 5,
    fijarBaseSync: () => {}, avisarConflictoSync: () => {}, fallosSync: 0, avisoSyncFallo: false, nota: () => {},
  });
  e2.exporto = false;
  ok(funcion(main, 'copiarASync', e2(true))(true) === false && e2.exporto === false, 'E3: en sólo lectura no se arma ni se manda la copia a la carpeta sincronizada');
  ok(funcion(main, 'copiarASync', e2(false))(true) === true && e2.exporto === true, 'E3: fuera del sólo lectura la copia sale como siempre');

  // el aviso: queda a la vista de forma permanente (portada y marca fija) y la nota de entrada dice que es de sólo lectura
  const textos = {}, clases = new Set(['oculto']);
  const el = (id) => ({ set textContent(v) { textos[id] = v; }, get textContent() { return textos[id]; }, classList: { remove: (c) => { if (c === 'oculto') textos[id + '-visible'] = true; } }, title: '' });
  const pendientes = [];
  const notas = [];
  const T_ = (t) => t;
  funcion(main, 'avisarVersionMasNueva', { partidaSoloLectura: () => true, versionDeLaPartida: '4.99.0', $: el, T_, avisosAlEntrar: { push: (f) => pendientes.push(f) }, nota: (t, s) => notas.push([t, s]), versionPendiente: '4.99.0' })();
  ok(/sólo lectura/.test(textos['aviso-solo-lectura'] || '') && textos['aviso-solo-lectura-visible'] && textos['marca-solo-lectura-visible'], 'E3: el aviso aparece en la portada y en la marca fija');
  pendientes.forEach((f) => f());
  ok(notas.length === 1 && /sólo lectura/.test(notas[0][1]) && /4\.99\.0/.test(notas[0][1]), 'E3: la nota de entrada dice la versión de la partida y que es de sólo lectura');
  const sinAviso = [];
  funcion(main, 'avisarVersionMasNueva', { partidaSoloLectura: () => false, versionDeLaPartida: '4.1.0', $: el, T_, avisosAlEntrar: { push: (f) => sinAviso.push(f) }, nota: () => {} })();
  ok(sinAviso.length === 0, 'E3: una partida que se guarda normal no avisa nada');
}
// los elementos del aviso existen en la plantilla y la pantalla distingue el sólo lectura de la falta de espacio
function revisarPlantilla(plant) {
  ok(plant.includes('id="aviso-solo-lectura"') && plant.includes('id="marca-solo-lectura"'), 'E3: la plantilla tiene el aviso de la portada y la marca fija');
  ok(/\.marca-solo-lectura \{[^}]*position: absolute/.test(plant), 'E3: la marca fija tiene su estilo');
  ok(plant.includes('ev.detail?.soloLectura ?'), 'E3: el estado de guardado de la pausa dice «sólo lectura» y no «revisá el espacio»');
}

// M8: escribirSync con un `rename` que falla
function revisarEscribirSync(archivoCjs) {
  const SM = require(archivoCjs);
  const userData = fs.mkdtempSync(path.join(tmp, 'ud-'));
  const carpeta = fs.mkdtempSync(path.join(tmp, 'carpeta-'));
  fs.writeFileSync(path.join(userData, 'carpeta-sincronizada.json'), JSON.stringify({ carpeta }));
  const errores = [];
  const reg = SM.registrarSincronia({ ipcMain: { handle() {}, on() {} }, dialog: {}, app: { getPath: () => userData }, alError: (e) => errores.push(e) });
  const nombre = 'hojarasca-relax-p1.hojarasca.json';
  const ruta = path.join(carpeta, 'Hojarasca', nombre);
  const bueno = JSON.stringify({ cuerpo: { progreso: { guardadoEn: 1000 } } });
  ok(reg.escribirSync(nombre, bueno, 0) === true && fs.readFileSync(ruta, 'utf8') === bueno, 'M8: una escritura normal se hace');
  const nuevo = JSON.stringify({ cuerpo: { progreso: { guardadoEn: 2000 } } });
  const renombrar = fs.renameSync;
  fs.renameSync = (a, b) => { if (String(b) === ruta) { const e = new Error('EBUSY: el archivo está tomado'); e.code = 'EBUSY'; throw e; } return renombrar(a, b); };
  let r;
  try { r = reg.escribirSync(nombre, nuevo, 1000); } finally { fs.renameSync = renombrar; }
  ok(r === false, 'M8: si falla el rename devuelve false');
  ok(fs.readFileSync(ruta, 'utf8') === bueno, 'M8: y queda la copia anterior, sin tocar');
  ok(!fs.existsSync(ruta + '.tmp'), 'M8: sin temporal suelto');
  ok(errores.length === 1 && /EBUSY/.test(errores[0]), 'M8: el error se registra');
  ok(reg.escribirSync(nombre, nuevo, 1000) === true && fs.readFileSync(ruta, 'utf8') === nuevo, 'M8: en el próximo intento (sin el archivo tomado) se escribe');
}
// M8 del lado del juego: reintento en el próximo guardado, aviso al tercer fallo seguido (o enseguida si la partida es demasiado grande)
async function revisarReintento(main) {
  const notas = [];
  const base = () => ({
    esSinFin: false, carpetaSync: 'x', reiniciandoPartida: false, conflictoSync: false, partidaSoloLectura: () => false, tocaCopiar: ({ copiadoEn, guardadoEn }) => guardadoEn > copiadoEn,
    textoParaExportar: () => base.texto, nombreSync: () => 'n', modoJuego: 'relax', ranuraActual: () => 1, baseSync: 0, ultimaCopiaSync: 0, copiadoEnSync: 0,
    guardadoEnActual: () => ++base.reloj, fijarBaseSync: () => {}, avisarConflictoSync: () => {}, fallosSync: 0, avisoSyncFallo: false, nota: (t) => notas.push(t),
  });
  const esperar = () => new Promise((r) => setTimeout(r, 0));
  base.texto = 'texto chico'; base.reloj = 5;
  const e = base();
  e.syncApi = { escribir: async () => false, escribirYa: () => false };
  const copiar = funcion(main, 'copiarASync', e);
  copiar(true); await esperar();
  ok(e.copiadoEnSync === 0 && notas.length === 0, 'M8: tras un fallo del rename la copia no se da por hecha y no se avisa todavía');
  ok(e.ultimaCopiaSync < Date.now() + 60 * 1000, 'M8: y no se espera 10 minutos (el próximo guardado reintenta)');
  copiar(true); await esperar();
  ok(notas.length === 0, 'M8: dos fallos seguidos todavía no avisan');
  copiar(true); await esperar();
  ok(notas.length === 1 && e.avisoSyncFallo === true, 'M8: al tercero sale el aviso discreto');
  copiar(true); await esperar();
  ok(notas.length === 1, 'M8: y no se repite');
  // un éxito en el medio cuenta de nuevo
  const e2 = base(); let n = 0;
  e2.syncApi = { escribir: async () => (++n === 2), escribirYa: () => false };
  const c2 = funcion(main, 'copiarASync', e2);
  notas.length = 0;
  c2(true); await esperar(); c2(true); await esperar(); c2(true); await esperar(); c2(true); await esperar();
  ok(notas.length === 0 && e2.fallosSync === 2, 'M8: un éxito en el medio vuelve a contar de cero');
  // la partida que pasa del tope: aviso enseguida y espera larga, como antes
  base.texto = 'x'.repeat(61 * 1024 * 1024);
  notas.length = 0;
  const e3 = base();
  e3.syncApi = { escribir: async () => false, escribirYa: () => false };
  funcion(main, 'copiarASync', e3)(true); await esperar();
  ok(notas.length === 1 && e3.ultimaCopiaSync > Date.now() + 5 * 60 * 1000, 'M8: si la partida es demasiado grande, avisa enseguida y espera 10 minutos');
  base.texto = 'texto chico';
}

// H2-3: la ruta repartida es la misma que la de una vez
async function revisarRutas(rutaCamino, rutaAsedio, asedioTexto) {
  const C = await import(rutaCamino);
  const hay = (f) => typeof f === 'function';
  ok(hay(C.crearBusquedaRuta) && hay(C.rutaDelCoihue), 'H2-3: el módulo ofrece la búsqueda repartida y la de una vez');
  const agua = (x, z) => Math.sin(x * 0.021) * Math.cos(z * 0.017) > 0.82;
  const obras = []; for (let k = 0; k < 120; k++) { const a = k / 120 * Math.PI * 2; obras.push([Math.cos(a) * 30, Math.sin(a) * 30]); }
  const libre = (ha, ho, cerco, cerrado = false) => (x, z) => {
    if (Math.abs(x) > 450 || Math.abs(z) > 450 || agua(x, z)) return false;
    for (let i = 0; i < 4; i++) if (agua(x + Math.cos(i * 1.5708) * ha, z + Math.sin(i * 1.5708) * ha)) return false;
    if (Math.abs(Math.sin(x * 0.03) * Math.cos(z * 0.04)) > 0.95) return false;
    if (cerrado && Math.hypot(x, z) > 28 && Math.hypot(x, z) < 60) return false;
    if (cerco) for (const o of obras) { const dx = o[0] - x, dz = o[1] - z; if (dx * dx + dz * dz < ho * ho) return false; }
    return true;
  };
  const costo = (x, z) => (Math.sin(x * 0.05) + 1) * 0.3;
  const base = { x: 0, z: 0 };
  const escenarios = [
    ['despejada', { x: 120, z: 40 }, false, false], ['lejos', { x: 330, z: -200 }, false, false], ['cercada', { x: 300, z: 100 }, true, false],
    ['cerrada del todo', { x: 200, z: 150 }, false, true], ['pegada a la base', { x: 40, z: 10 }, false, false],
  ];
  let repartidas = 0, maxPaso = 0, nulas = 0;
  for (const [nombre, desde, cerco, cerrado] of escenarios) for (const [ha, ho] of [[9, 8], [4, 5], [2, 2.5]]) {
    const f = libre(ha, ho, cerco, cerrado), opc = { costo, limite: 420 };
    const entera = C.rutaDelCoihue(desde, base, f, opc);
    if (entera === null) nulas++;
    for (const presupuesto of [1, 7, 250, 1000]) {
      const b = C.crearBusquedaRuta(desde, base, f, opc);
      let llamadas = 0, antes = 0;
      while (!b.listo) { b.avanzar(presupuesto); llamadas++; maxPaso = Math.max(maxPaso, b.gastado - antes - presupuesto); antes = b.gastado; if (llamadas > 1e6) break; }
      assert.deepEqual(b.resultado, entera, `H2-3: ${nombre} (${ha}/${ho}) con presupuesto ${presupuesto}: la misma ruta`);
      if (presupuesto === 250 && llamadas > 1) repartidas++;
      pasos++;
    }
  }
  ok(repartidas >= 5, `H2-3: las búsquedas grandes se reparten en varias llamadas (${repartidas})`);
  ok(nulas >= 1, 'H2-3: y también da lo mismo cuando no hay camino (null)');
  ok(maxPaso <= 200, `H2-3: ninguna llamada se pasa mucho del presupuesto (máx. +${maxPaso})`);
  ok(C.crearBusquedaRuta({ x: -1e5, z: 0 }, base, () => true, { margen: 70 }).avanzar(10) === true, 'H2-3: el mapa gigante se rechaza enseguida');
  const b = C.crearBusquedaRuta({ x: 120, z: 40 }, base, libre(9, 8, false), { costo, limite: 420 });
  while (!b.listo) b.avanzar(1000);
  ok(b.avanzar(5) === true && b.resultado !== null, 'H2-3: pedir más cuando ya terminó no rompe nada');

  // el cableado del asedio (el mundo de verdad no corre en Node: se mira en la partida real de humo-4-11-3-proceso)
  ok(/const PRESUPUESTO_RUTA = \d+;/.test(asedioTexto), 'H2-3: el asedio tiene su presupuesto por cuadro');
  ok(enUnaLinea(asedioTexto, ['if (replan) avanzarReplan();']) && enUnaLinea(asedioTexto, ['if (!dia && !replan) {']), 'H2-3: cada cuadro avanza la ruta pendiente y el Coihue espera a tenerla para caminar');
  ok(enUnaLinea(asedioTexto, ['if (replan) avanzarReplan(Infinity);']), 'H2-3: al alba una ruta pendiente se termina ya');
  ok(enUnaLinea(asedioTexto, ['function replanear(a) { empezarReplan(a); }']) && !/rutaPara\(p, c\.base\)/.test(asedioTexto), 'H2-3: la noche ya no calcula la ruta de una vez');
  const n = Number(/const PRESUPUESTO_RUTA = (\d+);/.exec(asedioTexto)?.[1]);
  ok(n >= 200 && n <= 5000, `H2-3: el presupuesto por cuadro es razonable (${n})`);
  ok(/HOLGURAS_RUTA = \[\[9, 8\], \[4, 5\], \[2, 2\.5\]\]/.test(asedioTexto), 'H2-3: se prueban las mismas tres holguras de siempre, en el mismo orden');
}

// M11: empaquetar.ps1 / .sh no matan un Hojarasca.exe sin preguntar. Se prueba con un proceso de mentira (una copia de node.exe con otro nombre, único de esta
// corrida): nunca se toca un Hojarasca.exe de verdad. Sólo en Windows (es PowerShell).
const EN_WINDOWS = process.platform === 'win32';
const NOMBRE_FALSO = `hoj-prueba-4113-${process.pid}`;
const EXE_FALSO = path.join(tmp, NOMBRE_FALSO + '.exe');
if (EN_WINDOWS) fs.copyFileSync(process.execPath, EXE_FALSO);
const AYUDA_PS1 = fileURLToPath(new URL('../herramientas/empaquetar-ayuda.ps1', import.meta.url));
const PS1 = fileURLToPath(new URL('../herramientas/empaquetar.ps1', import.meta.url));
const SH = fileURLToPath(new URL('../herramientas/empaquetar.sh', import.meta.url));
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const AYUDA_TXT = leer('herramientas/empaquetar-ayuda.ps1'), PS1_TXT = leer('herramientas/empaquetar.ps1'), SH_TXT = leer('herramientas/empaquetar.sh');
const { spawnSync, spawn } = await import('node:child_process');
const vivo = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const SCRIPT_CASOS = `
$ErrorActionPreference = 'Stop'
. $env:AYUDA
$exe = $env:DUMMY_EXE; $nombre = $env:DUMMY_NOMBRE
function Nuevo { $p = Start-Process -FilePath $exe -ArgumentList '-e "setTimeout(function(){},120000)"' -PassThru -WindowStyle Hidden; Start-Sleep -Milliseconds 300; return $p }
function Vivo($p) { $p.Refresh(); return -not $p.HasExited }
function Caso($etiqueta, [scriptblock]$accion) {
  $p = Nuevo
  try { $d = & $accion; $r = "DEC=$d" } catch { $r = 'ERR=' + $_.Exception.Message }
  Start-Sleep -Milliseconds 250
  "CASO $etiqueta | $r | VIVO=$(Vivo $p)"
  if (Vivo $p) { Stop-Process -Id $p.Id -Force }
}
Caso 'sin-consola' { Invoke-CierreHojarasca -Nombre $nombre -HayConsola $false }
Caso 'responde-no' { Invoke-CierreHojarasca -Nombre $nombre -HayConsola $true -Preguntar { param($t) 'n' } }
Caso 'responde-si' { Invoke-CierreHojarasca -Nombre $nombre -HayConsola $true -Preguntar { param($t) 's' } }
Caso 'forzar' { Invoke-CierreHojarasca -Nombre $nombre -Forzar -HayConsola $false }
Caso 'seco-forzar' { Invoke-CierreHojarasca -Nombre $nombre -Forzar -EnSeco -HayConsola $false }
"CASO nadie | DEC=" + (Invoke-CierreHojarasca -Nombre 'no-existe-4113' -HayConsola $false) + " | VIVO=-"
`;
function revisarEmpaquetadoPS(ayuda, textoPs1) {
  ok(/Invoke-CierreHojarasca/.test(textoPs1) && !/Stop-Process/.test(textoPs1), 'M11: empaquetar.ps1 no mata procesos por su cuenta: pasa por la pregunta');
  ok(/\[switch\]\$Forzar/.test(textoPs1) && /\[switch\]\$EnSeco/.test(textoPs1) && /-Forzar:\$Forzar/.test(textoPs1), 'M11: empaquetar.ps1 tiene -Forzar y -EnSeco y se los pasa a la pregunta');
  if (!EN_WINDOWS) return;
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', SCRIPT_CASOS], { encoding: 'utf8', env: { ...process.env, AYUDA: ayuda, DUMMY_EXE: EXE_FALSO, DUMMY_NOMBRE: NOMBRE_FALSO }, timeout: 120000 });
  const salida = String(r.stdout || '');
  const caso = (n) => { const l = salida.split('\n').find((x) => x.startsWith(`CASO ${n} |`)); assert.ok(l, `M11: hay resultado del caso ${n}\n${salida}\n${r.stderr}`); return l; };
  ok(/DEC=nada/.test(caso('nadie')), 'M11: sin Hojarasca abierto no hace nada');
  ok(/ERR=.*no lo cierro/.test(caso('sin-consola')) && /VIVO=True/.test(caso('sin-consola')), 'M11: sin consola interactiva avisa, falla y NO mata el proceso');
  ok(/ERR=Cancelado/.test(caso('responde-no')) && /VIVO=True/.test(caso('responde-no')), 'M11: si respondés que no, se cancela y el proceso sigue vivo');
  ok(/DEC=cerrar/.test(caso('responde-si')) && /VIVO=False/.test(caso('responde-si')), 'M11: si respondés que sí, lo cierra');
  ok(/DEC=cerrar/.test(caso('forzar')) && /VIVO=False/.test(caso('forzar')), 'M11: con -Forzar lo cierra sin preguntar (aunque no haya consola)');
  ok(/DEC=cerrar/.test(caso('seco-forzar')) && /VIVO=True/.test(caso('seco-forzar')), 'M11: -EnSeco decide pero no cierra nada');
}
// el script de verdad, en seco, contra el proceso de mentira
function revisarScriptsEnSeco() {
  if (!EN_WINDOWS) return;
  const falso = spawn(EXE_FALSO, ['-e', 'setTimeout(function(){},120000)'], { stdio: 'ignore' });
  try {
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS1, '.', '0.0.0', path.join(RAIZ, 'package.json')];
    const sin = spawnSync('powershell', [...args, '-EnSeco', '-NombreProceso', NOMBRE_FALSO], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
    ok(sin.status !== 0 && /no lo cierro/.test(String(sin.stdout) + String(sin.stderr)) && vivo(falso.pid), 'M11: empaquetar.ps1 sin consola interactiva falla con un aviso y no mata el Hojarasca.exe abierto');
    const con = spawnSync('powershell', [...args, '-EnSeco', '-Forzar', '-NombreProceso', NOMBRE_FALSO], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
    ok(con.status === 0 && /EN SECO: decisi\S+n=cerrar/.test(String(con.stdout)) && vivo(falso.pid), 'M11: empaquetar.ps1 -Forzar -EnSeco dice que lo cerraría y no cierra nada');
    const bash = spawnSync('bash', ['-c', 'echo ok'], { encoding: 'utf8' });
    if (bash.status === 0) {
      const sh = (...extra) => spawnSync('bash', [SH, '.', '0.0.0', path.join(RAIZ, 'package.json'), ...extra], { cwd: RAIZ, encoding: 'utf8', timeout: 60000, env: { ...process.env, NOMBRE_PROCESO: NOMBRE_FALSO } });
      const a = sh('--en-seco');
      ok(a.status !== 0 && /no lo cierro/.test(String(a.stderr)) && vivo(falso.pid), 'M11: empaquetar.sh sin terminal interactiva falla con un aviso y no mata nada');
      const b = sh('--forzar', '--en-seco');
      ok(b.status === 0 && /EN SECO: decisi\S+n=cerrar/.test(String(b.stdout)) && vivo(falso.pid), 'M11: empaquetar.sh --forzar --en-seco dice que lo cerraría y no cierra nada');
    }
  } finally { try { process.kill(falso.pid); } catch {} }
}
function revisarEmpaquetadoSh(sh) {
  ok(/--forzar/.test(sh) && /--en-seco/.test(sh) && /read -r -p/.test(sh) && /\[ -t 0 \]/.test(sh), 'M11: empaquetar.sh pregunta si hay terminal, y tiene --forzar y --en-seco');
  ok(!/^taskkill/m.test(sh) && /if \[ "\$DECISION" = cerrar \]; then taskkill/.test(sh), 'M11: empaquetar.sh sólo mata después de decidir');
  ok(/ASAR OK/.test(sh) && /ASAR_OK" != "ASAR OK"/.test(sh) && /extractFile\(process\.argv\[1\],'index\.html'\)/.test(sh) && sh.indexOf('ASAR_OK') > sh.indexOf('sincronia-main.cjs'), 'M11: empaquetar.sh verifica el index.html del asar como el .ps1');
  ok(sh.indexOf('ASAR_OK" != "ASAR OK"') < sh.indexOf('codigo-fuente.zip'), 'M11: y lo verifica antes de armar el paquete');
}

// ---------------------------------------------------------------- con el código de verdad
revisarEmpaquetadoPS(AYUDA_PS1, PS1_TXT);
revisarEmpaquetadoSh(SH_TXT);
revisarScriptsEnSeco();
revisarSoloLectura(MAIN);
revisarPlantilla(PLANT);
revisarEscribirSync(fileURLToPath(new URL('../sincronia-main.cjs', import.meta.url)));
await revisarReintento(MAIN);
await revisarRutas('../src/desafio-camino.js', null, ASE);

// ---------------------------------------------------------------- con el código roto a propósito: la prueba tiene que fallar
let mutaciones = 0;
async function rompe(nombre, f) {
  let fallo = false;
  try { await f(); } catch { fallo = true; }
  if (!fallo) assert.fail(`la mutación «${nombre}» no hizo fallar la prueba`);
  mutaciones++; pasos++;
}
const cambiar = (texto, de, a) => { assert.ok(texto.split(de).length === 2, `la mutación encuentra su texto: ${de.slice(0, 50)}`); return texto.replace(de, () => a); };
const copiaSync = (texto, i) => { const p = path.join(tmp, `sync-mutada-${i}.cjs`); fs.writeFileSync(p, texto); return p; };

await rompe('E3: guardar() ya no corta en sólo lectura', () => revisarSoloLectura(cambiar(MAIN, 'if (partidaSoloLectura()) {\n    window.dispatchEvent', 'if (false) {\n    window.dispatchEvent')));
await rompe('E3: la regla compara al revés', () => revisarSoloLectura(cambiar(MAIN, 'return versionMasNueva(versionDeLaPartida, versionDelJuego());', 'return versionMasNueva(versionDelJuego(), versionDeLaPartida);')));
await rompe('E3: la copia sincronizada también pisa', () => revisarSoloLectura(cambiar(MAIN, '  if (partidaSoloLectura()) return false;   // 4.11.3 (E3): la copia', '  if (false) return false;   // 4.11.3 (E3): la copia')));
await rompe('E3: el aviso no sale', () => revisarSoloLectura(cambiar(MAIN, "if (!partidaSoloLectura()) return;\n  const texto =", "if (true) return;\n  const texto =")));
await rompe('E3: la pausa no distingue el sólo lectura', () => revisarPlantilla(cambiar(PLANT, 'ev.detail?.soloLectura ?', 'false ?')));
await rompe('E3: falta la marca fija', () => revisarPlantilla(cambiar(PLANT, 'id="marca-solo-lectura"', 'id="otra-cosa"')));
await rompe('M8: el rename que falla escribe directo', () => revisarEscribirSync(copiaSync(cambiar(SYNC, "catch (e) { try { fs.rmSync(tmp, { force: true }); } catch {} alError(String(e?.message || e)); return false; }", "catch { fs.writeFileSync(d.ruta, t, 'utf8'); fs.rmSync(tmp, { force: true }); }"), 1)));
await rompe('M8: el rename que falla deja el temporal', () => revisarEscribirSync(copiaSync(cambiar(SYNC, "catch (e) { try { fs.rmSync(tmp, { force: true }); } catch {} alError(String(e?.message || e)); return false; }", "catch (e) { alError(String(e?.message || e)); return false; }"), 2)));
await rompe('M8: el juego da la copia por hecha tras un fallo', () => revisarReintento(cambiar(MAIN, '      fallosSync++;\n      copiadoEnSync = 0;', '      fallosSync++;')));
await rompe('M8: avisa en el primer fallo', () => revisarReintento(cambiar(MAIN, '(grande || fallosSync >= 3)', '(true)')));
await rompe('M8: espera 10 minutos aunque sea un rename', () => revisarReintento(cambiar(MAIN, 'if (grande) ultimaCopiaSync = Date.now() + 10 * 60 * 1000;', 'ultimaCopiaSync = Date.now() + 10 * 60 * 1000;')));
await rompe('M8: un éxito no reinicia la cuenta', () => revisarReintento(cambiar(MAIN, "if (r === true) { fallosSync = 0; fijarBaseSync(copiadoEnSync); }\n    else if (r === 'conflicto') avisarConflictoSync();", "if (r === true) { fijarBaseSync(copiadoEnSync); }\n    else if (r === 'conflicto') avisarConflictoSync();")));
// H2-3: una búsqueda que no es la misma (el generador cede en el lugar equivocado, o cambia el orden de los intentos)
{
  const copiaCamino = (texto, i) => { const p = path.join(tmp, `camino-mutado-${i}.mjs`); fs.writeFileSync(p, texto); return 'file:///' + p.replace(/\\/g, '/'); };
  await rompe('H2-3: la búsqueda repartida ignora el costo y el límite', async () => revisarRutas(copiaCamino(cambiar(CAM, 'const it = buscarRuta(desde, base, libre, opciones, medida);', 'const it = buscarRuta(desde, base, libre, {}, medida);'), 1), null, ASE));
  await rompe('H2-3: nunca cede el paso', async () => revisarRutas(copiaCamino(cambiar(CAM, 'if (medida.gastado >= medida.tope) yield;\n    if (esMeta(i))', 'if (esMeta(i))'), 2), null, ASE));
  await rompe('H2-3: el presupuesto no se respeta (cede cada 100 llamadas de más)', async () => revisarRutas(copiaCamino(cambiar(CAM, 'medida.tope = medida.gastado + Math.max(1, Number(unidades) || 1);', 'medida.tope = medida.gastado + Math.max(1, Number(unidades) || 1) + 5000;'), 3), null, ASE));
}
await rompe('H2-3: la noche vuelve a calcular la ruta de una vez', () => revisarRutas('../src/desafio-camino.js', null, cambiar(ASE, 'function replanear(a) { empezarReplan(a); }', 'function replanear(a) { const p = posicionCamino(a.camino), r = rutaPara(p, a.camino.base); a.camino.ruta = r.ruta; }\n  function rutaPara(p, c.base) {}')));
await rompe('H2-3: el Coihue camina con la ruta vieja mientras espera', () => revisarRutas('../src/desafio-camino.js', null, cambiar(ASE, 'if (!dia && !replan) {', 'if (!dia) {')));
await rompe('H2-3: el alba no termina la ruta pendiente', () => revisarRutas('../src/desafio-camino.js', null, cambiar(ASE, 'if (replan) avanzarReplan(Infinity);', '')));
await rompe('H2-3: las holguras cambian de orden', () => revisarRutas('../src/desafio-camino.js', null, cambiar(ASE, '[[9, 8], [4, 5], [2, 2.5]]', '[[4, 5], [9, 8], [2, 2.5]]')));

// M11: el script que mata sin preguntar, o que pregunta y no hace caso, o que cierra en seco
{
  const copiaPs = (texto, i) => { const p = path.join(tmp, `ayuda-mutada-${i}.ps1`); fs.writeFileSync(p, '﻿' + texto); return p; };
  await rompe('M11: sin consola mata igual', () => revisarEmpaquetadoPS(copiaPs(cambiar(AYUDA_TXT, "  return 'fallar'\n}", "  return 'cerrar'\n}"), 1), PS1_TXT));
  await rompe('M11: la pregunta no hace caso a la respuesta', () => revisarEmpaquetadoPS(copiaPs(cambiar(AYUDA_TXT, "-notmatch '^(s|si|sí)$'", "-notmatch '^(s|si|sí|n)$'"), 2), PS1_TXT));
  await rompe('M11: -Forzar no cierra', () => revisarEmpaquetadoPS(copiaPs(cambiar(AYUDA_TXT, "  if ($Forzar) { return 'cerrar' }", "  if ($Forzar) { return 'fallar' }"), 3), PS1_TXT));
  await rompe('M11: -EnSeco cierra igual', () => revisarEmpaquetadoPS(copiaPs(cambiar(AYUDA_TXT, "      if (-not $EnSeco) { $abiertos | Stop-Process -Force -ErrorAction SilentlyContinue }\n    }\n    'preguntar'", "      $abiertos | Stop-Process -Force -ErrorAction SilentlyContinue\n    }\n    'preguntar'"), 4), PS1_TXT));
  await rompe('M11: empaquetar.ps1 vuelve a matar sin preguntar', () => revisarEmpaquetadoPS(AYUDA_PS1, cambiar(PS1_TXT, '$decision = Invoke-CierreHojarasca', 'Get-Process Hojarasca | Stop-Process -Force\n$decision = Invoke-CierreHojarasca')));
  await rompe('M11: empaquetar.sh vuelve a matar sin preguntar', () => revisarEmpaquetadoSh(cambiar(SH_TXT, 'rm -rf dist\n', 'taskkill //F //IM Hojarasca.exe > /dev/null 2>&1 || true\nrm -rf dist\n')));
  await rompe('M11: empaquetar.sh no verifica el asar', () => revisarEmpaquetadoSh(cambiar(SH_TXT, 'if [ "$ASAR_OK" != "ASAR OK" ]; then echo "el index.html del ejecutable no es el que se probó" >&2; exit 1; fi', '')));
}

console.log(`verificar-4-11-3-proceso:${pasos} comprobaciones (${mutaciones} mutaciones que la prueba atrapa), todo en verde`);
