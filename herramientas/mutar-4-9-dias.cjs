// 4.9 (dias): rompe a propósito cada regla clave y confirma que verificar-4-9-dias.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-9-dias.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-9-dias.mjs');

const A = 'src/desafio-aldea.js', P = 'src/desafio-pronostico.js', M = 'src/desafio-aldea-mundo.js';
const MUTACIONES = [
  // ---- la aldea
  ['la ayuda llega a 2 y no pasa', A, 'export const NIVEL_MAX = 2;', 'export const NIVEL_MAX = 3;'],
  ['un vecino que no existe ayuda 0', A, "if (typeof clave !== 'string' || !VECINOS_AYUDA.includes(clave)) return 0;", ''],
  ['lo guardado se acota', A, 'n.ayuda[k] = Object.hasOwn(x.ayuda ?? {}, k) ? ent(x.ayuda[k], 0, 0, NIVEL_MAX) : 0;', 'n.ayuda[k] = x.ayuda?.[k] ?? 0;'],
  ['un pedido guardado tiene que existir', A, 'const base = PEDIDOS[clave].find((e) => e.id === p.id);\n  if (!base) return null;', 'const base = PEDIDOS[clave].find((e) => e.id === p.id) || PEDIDOS[clave][0];'],
  ['las cantidades tienen tope', A, 'const cosas = (v, validas, tope = 99) =>', 'const cosas = (v, validas, tope = 99999) =>'],
  ['el regalito se recorta', A, 'while (valorDe(r) > tope + 1e-9) {', 'while (false) {'],
  ['el regalito es una parte', A, 'export const MAX_REGALO = 0.45;', 'export const MAX_REGALO = 1.5;'],
  ['cuesta más cada noche', A, 'Math.min(1.2, 0.06 *', 'Math.min(1.2, 0 *'],
  ['vence cuando salen los duendes', A, '(dia === p.hasta && horas >= LIMITE_HORA)', '(dia === p.hasta && horas > LIMITE_HORA + 10)'],
  ['la última hora no se piden cosas nuevas', A, 'c.horas >= LIMITE_HORA - CIERRE_HORAS) return eventos;', 'c.horas >= 99) return eventos;'],
  ['de noche no se piden cosas', A, '!c.activo || c.horas < AMANECER_HORA ||', '!c.activo ||'],
  ['uno por vecino y por día', A, 'aldea.pidioDia[k] === c.dia ||', ''],
  ['cada vecino llega en su noche', A, ' || c.oleadas < DESDE_NOCHE[k]) continue;', ') continue;'],
  ['no se repite el pedido', A, 'if (opciones.length > 1 && opciones[i].id === ultimo) i = (i + 1) % opciones.length;', ''],
  ['los pedidos no usan el azar del juego', A, "const azar = generador(hashTexto(`${semilla || 'HOJARASCA-DE-SIEMPRE'}|aldea|${clave}|${dia}`));", 'const azar = Math.random;'],
  ['no se entrega sin lo pedido', A, 'if (h < n) falta[k] = n - h;', ''],
  ['no se entrega vencido', A, "if (vencido(p, dia, horas)) return { ok: false, razon: 'vencido', falta: {} };", ''],
  ['entregar sube un nivel (no dos)', A, 'aldea.ayuda[clave] = Math.min(NIVEL_MAX, aldea.ayuda[clave] + 1);', 'aldea.ayuda[clave] = Math.min(NIVEL_MAX, aldea.ayuda[clave] + 2);'],
  ['entregar cobra', A, 'for (const [k, n] of Object.entries(r.gasta)) io.gastar(k, n);', ''],
  // ---- el pronóstico
  ['el lado anticipado es el de la noche', P, 'const id = ladoDeLaNoche(d?.semilla, n, plan.disponibles.length ? plan.disponibles : LADOS);', 'const id = ladoDeLaNoche(d?.semilla, n + 1, plan.disponibles.length ? plan.disponibles : LADOS);'],
  ['el punto anticipado es el de la noche', P, 'const p = id && puntoDeLaNoche(plan, id, d?.semilla, n);', 'const p = id && puntoDeLaNoche(plan, id, d?.semilla, n + 1);'],
  ['el lado decidido al atardecer manda', P, 'if (real && real.noche === n && real.id && !real.anulado) {', 'if (false) {'],
  ['el perro huele desde las tres', P, 'horas >= HORA_PERRO && horas < HORA_ATAQUE', 'true'],
  ['la radio no dice el lado', P, 'ladoHoy: !!(t.estacion || aviso ||', 'ladoHoy: !!(t.estacion || t.radio || aviso ||'],
  ['sólo la estación da mañana', P, 'tipoManana: !!t.estacion,', 'tipoManana: true,'],
  ['a la hora del aviso todos lo saben', P, 'const aviso = horas >= HORA_AVISO && horas < HORA_ATAQUE;', 'const aviso = false;'],
  ['el mapa marca por dónde entran', P, 'const marca = primera && primera.lado ?', 'const marca = false ?'],
  // ---- el tablón
  ['se entrega junto al tablón', M, "if (!cerca(ctx.posJugador())) { ctx.nota('Entregalo en el tablón'", "if (false) { ctx.nota('Entregalo en el tablón'"],
  ['el botón se apaga', M, 'b.disabled = !aqui || !r.ok;', 'b.disabled = false;'],
  ['las hojas muestran los pedidos', M, 'hojas[k].visible = !!d.aldea?.pedidos?.[k] && !vencido(d.aldea.pedidos[k], p.dia, p.horas);', 'hojas[k].visible = false;'],
  ['lo repartido se guarda', M, 'if (eventos.length) ctx.guardar();', ''],
  ['la trampa va sobre la línea de entrada', M, 'ctx.colocarTrampa(b.x + ux * dist - uz * des, b.z + uz * dist + ux * des)', 'ctx.colocarTrampa(b.x - ux * dist - uz * des, b.z - uz * dist + ux * des)'],
  ['la trampa se arma cerca de la base', M, 'distancias: [18, 24, 30]', 'distancias: [58, 64, 70]'],
  ['sin tabla o miel no se sigue probando', M, "if (/^Falta/.test(r?.motivo || ''))", 'if (false)'],
  ['la trampa se arma desde el tablón', M, "if (!cerca(ctx.posJugador())) { ctx.nota('Armala desde el tablón'", "if (false) { ctx.nota('Armala desde el tablón'"],
  ['sin la trampa del juego no se ofrece', M, "const hayTrampa = () => typeof ctx.colocarTrampa === 'function' && !!ctx.hayTrampa?.();", 'const hayTrampa = () => true;'],
  // ---- el enganche
  ['la partida vieja carga la aldea saneada', 'src/desafio-reglas.js', 'aldea: sanearAldeaDelDesafio(x.aldea),', 'aldea: x.aldea,'],
  ['la E sólo en el Desafío', 'src/interacciones.js', 'cuando: (c) => c.desafio && libre(c.js) && !c.js.montado && c.tablonAldeaCerca()', 'cuando: (c) => libre(c.js) && !c.js.montado && c.tablonAldeaCerca()'],
  ['el plan de lados es el de la noche', 'src/desafio.js', 'plan: () => ataques.planActual(),', 'plan: () => null,'],
  ['el mapa marca la entrada', 'src/main.js', 'desafio.aldeaMundo.marcaMapa()', 'desafio.aldeaMundo.marcaMapa2()'],
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
