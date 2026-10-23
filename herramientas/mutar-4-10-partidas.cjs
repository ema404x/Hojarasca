// 4.10 (partidas): rompe a propósito cada regla clave y confirma que verificar-4-10-partidas.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-10-partidas.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-10-partidas.mjs');

const M = 'src/desafio-meta.js', J = 'src/desafio-meta-juego.js', R = 'src/desafio-reglas.js', D = 'src/desafio.js', MAIN = 'src/main.js';
const MUTACIONES = [
  // ---- las semillas
  ['una semilla por partida', M, 'porPartida: 1,', 'porPartida: 2,'],
  ['con un mínimo de noches', M, 'minNoches: 3,', 'minNoches: 0,'],
  ['una partida no da dos', M, 'if (yaDada) return 0;', ''],
  ['el saldo tiene tope', M, 'tope: 99,             // lo máximo que se guarda', 'tope: 99999,'],
  ['sin saldo no se gasta', M, 'if (c > m.semillas) return null;', ''],
  ['la meta se guarda con su clave', M, "export const CLAVE_META = 'hojarasca-meta-v1';", "export const CLAVE_META = 'hojarasca-sinfin-v1';"],
  ['se lee la copia de respaldo', M, 'for (const clave of [CLAVE_META, CLAVE_META_COPIA]) {', 'for (const clave of [CLAVE_META]) {'],
  ['se escribe la copia de respaldo', M, 'try { almacen.setItem(CLAVE_META_COPIA, texto); ok = true; } catch { /* sigue */ }', ''],
  ['un almacén que falla no tira nada', M, 'try { almacen.setItem(CLAVE_META, texto); ok = true; } catch { /* sigue */ }', 'almacen.setItem(CLAVE_META, texto); ok = true;'],
  // ---- las ventajas
  ['como mucho dos ventajas', M, 'export const MAX_VENTAJAS = 2;', 'export const MAX_VENTAJAS = 3;'],
  ['hay que tener las semillas', M, 'if (costo > m.semillas) return {', 'if (false) return {'],
  ['hay cosas que no se llevan bien', M, 'for (const [x, y, m] of INCOMPATIBLES) if ((a === x && b === y) || (a === y && b === x)) return m;', ''],
  ['sin aliados quita la ayuda inicial', M, 'if (e.sinAliados) e.ayuda = {};', ''],
  ['el filo cuesta salud', M, 'bonos: { dano: 0.25, saludMax: -30 }', 'bonos: { dano: 0.25, saludMax: 0 }'],
  ['las «con costo» suman puntos', M, 'costo: 0, mult: 0.2,', 'costo: 0, mult: 0,'],
  // ---- las reglas y los puntos
  ['las reglas suman al multiplicador', M, 'for (const k of lista(reglas, REGLAS, CLAVES_REGLA.length)) m += REGLAS[k].mult || 0;', ''],
  ['ganar suma al puntaje', M, '(victoria ? 1000 : 0)', '(victoria ? 0 : 0)'],
  ['el multiplicador tiene tope', M, 'Math.max(1, Math.min(10, Number(mult)))', 'Math.max(1, Number(mult))'],
  ['cada modo tiene su récord', M, 'm.records[k] = l.slice(0, TOPE_RECORDS);', 'm.records.normal = l.slice(0, TOPE_RECORDS);'],
  ['diez récords', M, 'export const TOPE_RECORDS = 10;', 'export const TOPE_RECORDS = 50;'],
  ['las noches largas corren más despacio', M, 'export const FACTOR_NOCHE_LARGA = 0.75;', 'export const FACTOR_NOCHE_LARGA = 1.25;'],
  // ---- la corta
  ['la corta dura siete noches', M, 'mult: { cantidad: 0.95, dano: 1, vida: 0.95 }, nocheFinal: 7 },', 'mult: { cantidad: 0.95, dano: 1, vida: 0.95 }, nocheFinal: 9 },'],
  ['el mandamás baja a la séptima', M, 'export const NOCHE_DEL_MANDAMAS_CORTA = 7;', 'export const NOCHE_DEL_MANDAMAS_CORTA = 6;'],
  ['en la corta el mandamás es el de la séptima', R, 'if (partidaEfectos?.nocheFinal) return noche >= NOCHE_DEL_MANDAMAS_CORTA;', ''],
  ['en la corta no hay noche final del Coihue', R, 'return partidaEfectos?.nocheFinal ? Infinity : NOCHE_FINAL;', 'return NOCHE_FINAL;'],
  ['la partida cambia la dificultad', R, 'return dificultadesDePartida ? dificultadesDePartida[k] : DIFICULTADES[k];', 'return DIFICULTADES[k];'],
  ['la corta se gana al caer el mandamás', D, 'if (efectosPartida()?.nocheFinal && !d.victoria && !d.sinFin) setTimeout(', 'if (false) setTimeout('],
  ['en la corta no hay cueva', D, 'if (!efectosPartida()?.nocheFinal) abrirSegundoActo();', 'abrirSegundoActo();'],
  ['ganada la corta se acaban las noches', 'src/desafio-nido.js', "if (d.meta?.modo === 'corta') return false;", ''],
  // ---- la pesadilla
  ['la pesadilla se desbloquea ganando', M, "if (modo === 'pesadilla' && !m.desbloqueos.pesadilla) return", 'if (false) return'],
  ['ganar la campaña la desbloquea', M, "if (modo === 'normal' || modo === 'pesadilla') m.desbloqueos", "if (modo === 'normal' || modo === 'pesadilla' || modo === 'corta') m.desbloqueos"],
  ['la pesadilla no trae cofre', M, 'sinCaja: true, nieblaTope: 0.7,', 'sinCaja: false, nieblaTope: 0.7,'],
  ['la pesadilla trae más niebla', M, "return a > baseTotal && a <= tope ? 'niebla' : null;", 'return null;'],
  ['el pronóstico sabe de la niebla de la pesadilla', R, 'partidaEfectos?.nieblaTope ? nieblaDePesadilla(', 'false ? nieblaDePesadilla('],
  ['el cofre del alba no cae en la pesadilla', D, 'if (efectosPartida()?.sinCaja) return;', ''],
  // ---- los finales
  ['si la base cayó, ceniza', M, "if (estado.baseCayo) return 'ceniza';", ''],
  ['tres vecinos hacen una aldea', M, 'export const AYUDARON_PARA_ALDEA = 3;', 'export const AYUDARON_PARA_ALDEA = 2;'],
  ['un lugar perdido no es la aldea entera', M, "if (ayudaron >= AYUDARON_PARA_ALDEA && !(Number(estado.lugaresCaidos) > 0)) return 'aldea';", "if (ayudaron >= AYUDARON_PARA_ALDEA) return 'aldea';"],
  ['con uno solo estás solo', M, 'export const AYUDARON_SOLO = 1;', 'export const AYUDARON_SOLO = 0;'],
  ['los vecinos que ayudan son los de la aldea', M, "return ['anselmo', 'herminia', 'martin', 'chicos'].filter((k) => Object.hasOwn(a, k) && Number(a[k]) > 0).length;", "return ['anselmo', 'herminia', 'martin', 'chicos'].filter((k) => Number(a[k]) >= 0).length;"],
  ['el final se anota en el cuaderno', J, 'guardar(anotarFinal(leer(), id));', ''],
  ['el final se guarda en la partida', J, 'meta.final = id;', ''],
  ['las noches limpias se cuentan', D, 'if (d.meta && !nocheActual.perdidas) d.meta.limpias++;', ''],
  ['los lugares caídos se cuentan', D, 'if (D().meta) D().meta.lugaresCaidos++;', ''],
  // ---- el guardado
  ['lo guardado se sanea', R, 'meta: sanearMetaPartida(x.meta),', 'meta: x.meta,'],
  ['el multiplicador se recalcula', M, 'return { ...base, aplicado: !!v.aplicado,', 'return { ...base, mult: Number(v.mult), aplicado: !!v.aplicado,'],
  ['se recortan las ventajas', M, 'const ventajas = lista(eleccion.ventajas, VENTAJAS, MAX_VENTAJAS);\n  const reglas = lista(eleccion.reglas, REGLAS, CLAVES_REGLA.length);\n  return { modo,', 'const ventajas = lista(eleccion.ventajas, VENTAJAS, 99);\n  const reglas = lista(eleccion.reglas, REGLAS, CLAVES_REGLA.length);\n  return { modo,'],
  // ---- el enganche
  ['empezar gasta las semillas', J, '    guardar(gastada);\n', ''],
  ['una partida da su semilla una vez', J, 'if (meta.semillaDada) return null;', ''],
  ['el arranque se aplica una vez', J, 'if (!d?.meta || d.meta.aplicado) return;', 'if (!d?.meta) return;'],
  ['la aldea no se reemplaza', J, 'Object.assign(d.aldea.ayuda, sube);', 'd.aldea.ayuda = sube;'],
  ['los bonos van con el origen «ventaja»', J, "ctx.sumarBono(d, 'ventaja', k, n)", "ctx.sumarBono(d, 'habilidad', k, n)"],
  ['ganar la campaña anota la victoria', J, 'if (victoria) m = anotarVictoria(m, modo);', ''],
  ['la trampa de miel va gratis', J, '{ gratis: true }', '{ gratis: false }'],
  ['dejar una partida da su semilla', MAIN, 'if (esDesafio) metaJuego.terminar();   // 4.10 partidas: dejar una partida', 'if (false) metaJuego.terminar();   // 4.10 partidas: dejar una partida'],
  ['ganar da la semilla y el final', MAIN, 'alVencer: (s) => { s.cierre = metaJuego.alVencer();', 'alVencer: (s) => { s.cierre = null;'],
  ['la pantalla se abre al entrar', MAIN, '!metaElegida && (!HOJARASCA_DEBUG', '!metaElegida && false && (!HOJARASCA_DEBUG'],
  ['noches más largas', MAIN, '? FACTOR_NOCHE_LARGA : 1;', '? 1 : 1;'],
  ['manos llenas', MAIN, 'const troncosM = materialesDeMeta(troncosTala);', 'const troncosM = troncosTala;'],
  ['el modo se toma al abrir la partida', MAIN, 'if (esDesafio) fijarPartidaMeta(progreso.desafio?.meta || null);', ''],
  // ---- las reglas en el juego
  ['sólo arco', D, "if (efectosPartida()?.soloArco && id !== 'arco' && id !== 'martillo') {", 'if (false) {'],
  ['sin reparar: el martillo', D, "if (efectosPartida()?.sinReparar) { if (performance.now() - avisoMartillo > 2500)", 'if (false) { if (performance.now() - avisoMartillo > 2500)'],
  ['sin reparar: el taller', D, "if (r.reparar && efectosPartida()?.sinReparar)", 'if (false)'],
  ['sin reparar: los vecinos', D, "reparar: (o, cantidad) => { if (efectosPartida()?.sinReparar) return true;", 'reparar: (o, cantidad) => {'],
  ['sin emplastos', D, "if (efectosPartida()?.sinEmplastos) {", 'if (false) {'],
  ['sin aliados: el perro', 'src/desafio-aliados.js', 'if (!perroPos || efectosPartida()?.sinAliados) return null;', 'if (!perroPos) return null;'],
  ['sin aliados: los compañeros', 'src/desafio-aliados.js', 'if (d.companeros.includes(clave) || efectosPartida()?.sinAliados) return false;', 'if (d.companeros.includes(clave)) return false;'],
  ['sin aliados: los vecinos', 'src/desafio-aldea.js', "d.meta.reglas.includes('sinAliados')) return 0;", "d.meta.reglas.includes('sinAliados__')) return 0;"],
  ['el perro de pelea', 'src/desafio-aliados.js', '9 * dt * (efectosPartida()?.perro ?? 1)', '9 * dt'],
  ['Anselmo más ligero', 'src/desafio-vecinos-mundo.js', 'num.pausa * (efectosPartida()?.anselmoPausa ?? 1)', 'num.pausa'],
  ['los chicos con puntería', 'src/desafio-vecinos-mundo.js', 'num.dano * (efectosPartida()?.chicos.dano ?? 1)', 'num.dano'],
];

let fallas = 0;
const corrida = () => spawnSync(process.execPath, [prueba], { cwd: raiz, encoding: 'utf8', timeout: 300000 });
const base = corrida();
if (base.status !== 0) { console.log('la prueba ya falla sin mutar:\n' + (base.stderr || base.stdout).split('\n').slice(0, 12).join('\n')); process.exit(2); }
const solo = process.env.SOLO ? new RegExp(process.env.SOLO) : null;
for (const [nombre, archivo, buscar, poner] of MUTACIONES) {
  if (solo && !solo.test(nombre)) continue;
  const f = path.join(raiz, archivo);
  const original = fs.readFileSync(f, 'utf8');
  const n = original.split(buscar).length - 1;
  if (n !== 1) { console.log(`?? ${nombre}: el texto a romper aparece ${n} veces en ${archivo}`); fallas++; continue; }
  fs.writeFileSync(f, original.replace(buscar, () => poner));
  let r;
  try { r = corrida(); } finally { fs.writeFileSync(f, original); }
  const cayo = r.status !== 0;
  const motivo = ((r.stderr || '').match(/(?:AssertionError|Error)[^\n]*/) || [''])[0].slice(0, 110);
  console.log(`${cayo ? 'falla (bien)' : 'NO FALLA   '} · ${nombre}${cayo ? ' → ' + motivo : ''}`);
  if (!cayo) fallas++;
}
console.log(fallas ? `\n${fallas} mutaciones sin atrapar` : `\nlas ${MUTACIONES.length} mutaciones fueron atrapadas`);
process.exit(fallas ? 1 : 0);
