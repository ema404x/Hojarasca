// 4.10 (coihue): rompe a propósito cada regla clave y confirma que verificar-4-10-coihue.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-10-coihue.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-10-coihue.mjs');

const C = 'src/desafio-camino.js', AS = 'src/desafio-asedio.js', AM = 'src/desafio-asedio-mundo.js', NA = 'src/desafio-nave.js', NM = 'src/desafio-nave-mundo.js';
const V = 'src/desafio-valle.js', TM = 'src/desafio-tomadas-mundo.js', IN = 'src/desafio-infestacion.js', RE = 'src/desafio-reglas.js', DE = 'src/desafio.js';
const MUTACIONES = [
  // ---- la ruta
  ['la ruta llega a la distancia de llegada, no antes', C, 'const esMeta = (i) => Math.hypot(cx(i) - base.x, cz(i) - base.z) <= llegada + celda * 0.7;', 'const esMeta = (i) => true;'],
  ['la ruta estirada no corta por obras ni agua', C, 'if (!libre(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;', ''],
  ['la ruta esquiva lo ocupado', C, 'if (cerrado[j] || !abierto(j)) continue;', 'if (cerrado[j]) continue;'],
  // ---- el avance
  ['cada zona libre lo hace caminar más despacio', C, 'const zonas = Math.max(CAMINO.pisoRitmo, 1 - CAMINO.porZonaLibre * Math.max(0, libres));', 'const zonas = 1;'],
  ['el ritmo tiene piso', C, 'const zonas = Math.max(CAMINO.pisoRitmo, 1', 'const zonas = Math.max(-9, 1'],
  ['sólo camina en su ventana', C, 'export const enVentana = (hn) => hn >= CAMINO.desde && hn < CAMINO.desde + CAMINO.ventana;', 'export const enVentana = (hn) => true;'],
  ['lo que cuenta es el pedazo dentro de la ventana', C, 'const horas = Math.max(0, Math.min(hn, CAMINO.desde + CAMINO.ventana) - Math.max(antes, CAMINO.desde));', 'const horas = Math.max(0, hn - antes);'],
  ['trabado no avanza', C, 'const util = Math.max(0, horas - quieto);', 'const util = horas;'],
  ['el primer cuadro de la noche cuenta desde que cayó', C, 'const desde = c.ultima >= 0 ? c.ultima : hn <= 2.5 ? 0 : hn;', 'const desde = c.ultima >= 0 ? c.ultima : hn;'],
  ['dormir de corrido camina lo que faltaba', C, 'const util = Math.max(0, resto - c.atasco);', 'const util = 0;'],
  ['al amanecer se gasta la rebaja de las raíces', C, 'c.ultima = -1; c.atasco = 0; c.inmune = 0; c.rebaja = 0;', 'c.ultima = -1; c.atasco = 0; c.inmune = 0;'],
  // ---- frenarlo
  ['una raíz trabada deja inmune un rato', C, "if (deNoche && c.inmune > 0) return { ok: true, corte: false, inmune: true };", ''],
  ['más vida de la dificultad, más daño para trabarlo', C, 'const umbral = CAMINO.vidaPies * clamp(num(vida, 1), 0.5, 2);', 'const umbral = CAMINO.vidaPies;'],
  ['lo quieto tiene tope', C, 'c.atasco = Math.min(CAMINO.atascoMax, c.atasco + CAMINO.atascoCorte);', 'c.atasco = c.atasco + CAMINO.atascoCorte;'],
  ['de día las raíces cortadas rebajan la noche', C, '} else c.rebaja = Math.min(CAMINO.rebajaMax, c.rebaja + CAMINO.rebajaDia);', '} else c.rebaja = 0;'],
  ['las trampas lo enredan', C, 'c.atasco = Math.min(CAMINO.atascoMax, c.atasco + CAMINO.atascoTrampa);', 'c.atasco = c.atasco;'],
  // ---- guardado y textos
  ['un camino sin base ni interior se descarta', C, 'if (!base || !interior) return null;', ''],
  ['un camino sin ruta se descarta', C, 'if (ruta.length < 2) return null;', ''],
  ['la distancia guardada se acota', C, 'const d = clamp(num(c.d, 0), 0, largo);', 'const d = num(c.d, 0);'],
  ['la nave es donde está el camino', AS, 'aqui ? { x: Math.round(aqui.x * 10) / 10, z: Math.round(aqui.z * 10) / 10 } : nave,', 'nave,'],
  ['el camino viaja con el asedio', AS, '...(camino ? { camino } : {}),', ''],
  ['si llegó, la puertita se abre sola', AS, ' || !!a.camino?.llego);', ');'],
  ['el HUD dice a cuántos metros está', AS, "const camino = a.camino ? ` · ${textoCamino(a.camino)}` : '';", "const camino = '';"],
  ['el mapa marca la ruta', AS, 'if (a.camino) m.push(...marcasCamino(a.camino));', ''],
  // ---- el enganche del camino
  ['al empezar el asedio se calcula la ruta', AM, 'crearCamino(a);   // 4.10 coihue: la ruta hasta tu base', ''],
  ['cada noche se pone en marcha', AM, 'nocheCamino(a);   // 4.10 coihue: esta noche camina', ''],
  ['al amanecer se cierra la noche', AM, 'albaCamino(a);   // 4.10 coihue: lo que caminó, caminado', ''],
  ['las raíces reciben los golpes', AM, 'if (n?.pies) { herirPatas(n, dano); return; }', ''],
  ['el cerco cae sólo al terminar el paso', AM, 'if (c.llego && !c.cerco && vis.d >= c.d - 0.15) alLlegar(c, n);', 'if (c.llego && vis.d >= c.d - 0.15) alLlegar(c, n);'],
  ['caminando no choca', AM, 'else if (vis.zancada && raicesPuestas) sacarRaices();', ''],
  ['la ruta esquiva los lugares del valle', AM, ' || cercaDeLugar(x, z)) return false;', ') return false;'],
  ['la ruta esquiva las obras', AM, 'return !api.obraCerca?.(x, z, hObra);', 'return true;'],
  ['el corazón se arma donde se plantó', NM, 'const si = api.sitioInterior?.() || s;', 'const si = s;'],
  // ---- la subida
  ['sólo choca atravesada', NA, "export const raizSolida = (fase) => fase === 'tapa';", 'export const raizSolida = (fase) => true;'],
  ['sin nadie cerca la raíz no arranca', NA, 'if (!cerca && r.t < R) { r.t = 0; return; }', ''],
  ['el ciclo da la vuelta', NA, 'if (r.t >= periodoRaiz(r.i)) r.t = 0;', ''],
  ['el aviso dura', NA, 'raices: { aviso: 1.8,', 'raices: { aviso: 0.2,'],
  ['la franja del barredor es angosta', NA, 'barre: 2.8, banda: 0.9,', 'barre: 2.8, banda: 3.5,'],
  ['el barrido te agarra sólo a la altura del escalón', NA, 'altura > -0.6 && altura < 2.0', 'true'],
  ['con poca salud no hace daño', NA, 'saludMinima: 30,', 'saludMinima: 0,'],
  ['el golpe de la raíz es chico', NA, 'dano: 7, empuje: 7', 'dano: 40, empuje: 7'],
  ['el barrido baja', NA, "if (fase === 'barrido') { const e = u * u * (3 - 2 * u); return m - 2 * m * e; }", "if (fase === 'barrido') return m;"],
  ['las raíces no van en los descansos', NA, 'if ((descansos || []).some((q) => Math.abs(q.y - y) < 1.4)) continue;', ''],
  ['los duendes de las ramas reciben los golpes', NM, 'if (n?.rama) { herirRama(n, dano); return; }', ''],
  ['cada subida arranca con todo como nuevo', NM, 'ponerFisicaSubida();\n    reiniciarPeligros();', 'ponerFisicaSubida();'],
  ['atravesada no te atrapa adentro', NM, 'if (!adentroDeLaZona) {', 'if (true) {'],
  ['la raíz atravesada se saca sola', NM, 'if (r.sol) { col.eliminar(r.sol); r.sol = null; }', 'if (r.sol) { r.sol = null; }'],
  ['no se tira a través del tronco del medio', NM, '\n        && !tapaLaColumna(px * (subida.radio - 0.5), pz * (subida.radio - 0.5), _pl.x, _pl.z);', ';'],
  // ---- el valle
  ['los lugares se toman desde la noche 3', V, 'desdeNoche: 3,        //', 'desdeNoche: 1,        //'],
  ['como mucho dos a la vez', V, 'maxTomadas: 2,        //', 'maxTomadas: 9,        //'],
  ['una cada dos noches', V, 'if ((noche - TOMADAS.desdeNoche) % TOMADAS.cadaNoches !== 0 || zonasTomadasDelValle(v).length >= TOMADAS.maxTomadas) return [];', 'if (zonasTomadasDelValle(v).length >= TOMADAS.maxTomadas) return [];'],
  ['el que recuperaste tiene respiro', V, 'const libres = v.zonas.filter((z) => z.nivel === 0 && noche >= z.hasta);', 'const libres = v.zonas.filter((z) => z.nivel === 0);'],
  ['el escalón máximo', V, 'z.nivel = Math.min(TOMADAS.nivelMax, z.nivel + 1);', 'z.nivel = z.nivel + 1;'],
  ['sacar un nido de dos no baja el lugar', V, 'if (quedan > 0) return { ok: true, baja: false, nivel: z.nivel };', ''],
  ['recuperado queda en respiro', V, 'z.hasta = noche + TOMADAS.respiro;', ''],
  ['al empezar el asedio se cierra', V, '  v.cerrado = true;\n  for (const z of v.zonas) z.nivel = 0;', '  v.cerrado = true;'],
  ['la mancha tiene su radio', V, 'if (Math.hypot(q.x - x, q.z - z) < TOMADAS.radio + margen) return q;', 'if (Math.hypot(q.x - x, q.z - z) < 1e9) return q;'],
  ['cerrado carga sin niveles', V, 'if (cerrado) for (const z of zonas) z.nivel = 0;', ''],
  ['el nivel guardado se acota', V, 'nivel: Math.max(0, Math.min(TOMADAS.nivelMax,', 'nivel: Math.max(0, Math.min(99,'],
  ['sólo lugares que existen', V, '!TOMADAS.ids.includes(z.id) || vistas.has(z.id) || !fin(z.x)', 'vistas.has(z.id) || !fin(z.x)'],
  ['el nido conserva su lugar sólo si existe', IN, "if (typeof c.zona === 'string' && TOMADAS.ids.includes(c.zona)) s.zona = c.zona;", 's.zona = c.zona;'],
  ['la lista de nidos tiene tope', IN, '.slice(0, CAPULLOS.max + CAPULLOS.deZonas)', '.slice(0, 1e6)'],
  ['la partida vieja carga el valle saneado', RE, 'valle: sanearValle(x.valle),', 'valle: x.valle,'],
  ['al amanecer se decide si toman un lugar', DE, 'tomadas.alAmanecer();   // 4.10 coihue', ''],
  ['el nido de un lugar cierra el lugar al abrirse', DE, 'if (c.zona) for (const tipo of tomadas.alAbrirseNido(c))', 'if (false) for (const tipo of tomadas.alAbrirseNido(c))'],
  ['el asedio cierra los lugares tomados', DE, 'api.alEmpezarAsedio = () => tomadas.cerrar();', ''],
  ['el hacha se frena en el lugar tomado', 'src/main.js', 'if (lugarTomado?.(o)) return;   // 4.10 coihue', ''],
  ['los recursos del mapa se frenan', 'src/desafio-mapa-mundo.js', "if (s && ctx.bloquea?.(s.x, s.z)) return 'Lugar tomado", "if (false) return 'Lugar tomado"],
  ['la cámara tiembla', 'src/main.js', 'if (desafio && modo === \'jugando\' && desafio.temblor > 0.01) {', 'if (false) {'],
  ['el papel dibuja la ruta', 'src/mapa.js', "if (a.clase === 'ruta' && Array.isArray(a.puntos)) {", 'if (false) {'],
  ['la pista del Coihue que camina', 'src/main.js', "{ id: 'p-camina', cuando:", "{ id: 'p-camina2', cuando:"],
  ['la pista de los lugares tomados', 'src/main.js', "{ id: 'p-tomada', cuando:", "{ id: 'p-tomada2', cuando:"],
  ['los programas nuevos se compilan en la carga', 'src/desafio-coihue-formas.js', "new THREE.MeshBasicMaterial({ color: '#101010', transparent: true, opacity: 0.2,", "new THREE.MeshBasicMaterial({ color: '#101010', transparent: true, opacity: 0.25,"],
  ['los hongos no usan índices negativos', TM, 'Math.abs(Math.floor(sem))', 'Math.floor(sem)'],
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
