// 4.22.0 · A · Mutaciones de `verificar-4-22-0-a.mjs`: cada una deshace UN cambio de «Noches con forma» en una copia de `src/` y la prueba
// tiene que fallar. Un proceso y una carpeta por mutación (los módulos ESM quedan en caché: con otra copia cada una se mide limpia).
//   node pruebas/mutaciones-4-22-0-a.mjs            (todas)    ·    node pruebas/mutaciones-4-22-0-a.mjs perillas   (las que digan «perillas»)
// No está en `verify`: tarda unos 3 s por mutación. La copia sin mutar tiene que pasar (si no, no se mide nada).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const filtro = process.argv[2] || '';
// [nombre, archivo, texto que está, texto que lo deshace]
const MUTACIONES = [
  // la cantidad, la dureza y las vueltas
  ['cantidad: se clava en 18 desde la noche 9', 'src/desafio-reglas.js', 'return Math.min(C.tope + Math.max(0, Math.floor((noche - C.desdeNoche) / C.cadaNoches)), C.inicio', 'return Math.min(C.tope, C.inicio'],
  ['cantidad: uno más por noche (y no cada dos)', 'src/desafio-reglas.js', 'cadaNoches: 2 }', 'cadaNoches: 1 }'],
  ['cantidad: sube desde la noche 11', 'src/desafio-reglas.js', 'tope: 18, desdeNoche: 9,', 'tope: 18, desdeNoche: 11,'],
  ['cantidad: el tope base 20', 'src/desafio-reglas.js', 'tope: 18, desdeNoche: 9,', 'tope: 20, desdeNoche: 9,'],
  ['dureza: 8 % parejo otra vez', 'src/desafio-reglas.js', 'porNocheDespues: 0.10 }', 'porNocheDespues: 0.08 }'],
  ['dureza: 12 % desde la 11', 'src/desafio-reglas.js', 'porNocheDespues: 0.10 }', 'porNocheDespues: 0.12 }'],
  ['dureza: el 10 % empieza en la noche 13', 'src/desafio-reglas.js', 'hastaNoche: 10,', 'hastaNoche: 12,'],
  ['vuelta: la cantidad vuelve a +20 %', 'src/desafio-vuelta.js', 'cantidad: 0.12, vida', 'cantidad: 0.2, vida'],
  ['vuelta: la vida vuelve a +25 %', 'src/desafio-vuelta.js', 'vida: 0.15, dano', 'vida: 0.25, dano'],
  ['vuelta: el daño vuelve a +15 %', 'src/desafio-vuelta.js', 'dano: 0.10 }', 'dano: 0.15 }'],
  // el primer mandamás
  ['mandamás: sin escala (3,6 veces la noche 4)', 'src/desafio-reglas.js', 'ESCALA_PRIMER_JEFE = { noche: 5, vida: 0.5 }', 'ESCALA_PRIMER_JEFE = { noche: 5, vida: 1 }'],
  ['mandamás: escala 0,7', 'src/desafio-reglas.js', 'ESCALA_PRIMER_JEFE = { noche: 5, vida: 0.5 }', 'ESCALA_PRIMER_JEFE = { noche: 5, vida: 0.7 }'],
  ['mandamás: la escala vale para todos los mandamases', 'src/desafio-reglas.js', 'return Math.floor(n) === ESCALA_PRIMER_JEFE.noche ? ESCALA_PRIMER_JEFE.vida : 1;', 'return Math.floor(n) >= ESCALA_PRIMER_JEFE.noche ? ESCALA_PRIMER_JEFE.vida : 1;'],
  ['mandamás: la escala también en la partida corta', 'src/desafio-reglas.js', '  if (partidaEfectos?.nocheFinal) return 1;\n  return Math.floor(n) === ESCALA', '  return Math.floor(n) === ESCALA'],
  ['mandamás: al bajar no se aplica la escala', 'src/desafio.js', '* (a.def.jefe ? escalaDelJefe(D().oleadas) : 1));', '* 1);'],
  // las semillas doradas
  ['semillas: el bruto vuelve a 2 a 3', 'src/desafio-reglas.js', 'altura: 2.55, cristales: [1, 2]', 'altura: 2.55, cristales: [2, 3]'],
  ['semillas: el mandamás vuelve a 14 a 20', 'src/desafio-reglas.js', 'altura: 4.2, cristales: [8, 12]', 'altura: 4.2, cristales: [14, 20]'],
  // lo que cuesta caer
  ['caer: vuelve el 30 % plano (base 30, sin suma por noche)', 'src/desafio-perillas.js', 'materialesBase: 0.2, materialesPorNoche: 0.01,', 'materialesBase: 0.3, materialesPorNoche: 0,'],
  ['caer: no crece con la noche', 'src/desafio-perillas.js', 'materialesPorNoche: 0.01,', 'materialesPorNoche: 0,'],
  ['caer: el tope sube a 50 %', 'src/desafio-perillas.js', 'materialesTope: 0.4,', 'materialesTope: 0.5,'],
  ['caer: arranca en 30 %', 'src/desafio-perillas.js', 'materialesBase: 0.2,', 'materialesBase: 0.3,'],
  ['caer: Tranquila no guarda semillas', 'src/desafio-perillas.js', 'cristalesGuardaTranquila: 0.25', 'cristalesGuardaTranquila: 0'],
  ['caer: Tranquila guarda la mitad', 'src/desafio-perillas.js', 'cristalesGuardaTranquila: 0.25', 'cristalesGuardaTranquila: 0.5'],
  ['caer: todas las dificultades guardan un cuarto', 'src/desafio-perillas.js', "claveDificultad === 'tranquila' ? CASTIGO", 'true ? CASTIGO'],
  ['caer: aplicarCastigo no toca los materiales', 'src/desafio-perillas.js', 'if (M[k]) M[k] = Math.floor(M[k] * (1 - castigo.materiales));', 'if (M[k]) M[k] = M[k];'],
  ['caer: main.js vuelve a perder todas las semillas y el 30 %', 'src/main.js', '  aplicarCastigo(M, castigo);\n', "  M.cristal = 0;\n  for (const k of ['tronco', 'tabla', 'piedra']) if (M[k]) M[k] = Math.floor(M[k] * 0.7);\n"],
  ['caer: main.js mira siempre la noche 1', 'src/main.js', 'castigoDeCaer(Math.max(1, progreso.desafio?.oleadas || 1), dificultadEnJuego())', 'castigoDeCaer(1, dificultadEnJuego())'],
  ['caer: la guía sigue diciendo 30 %', 'src/guia.js', 'entre un 20% y un 40% de los troncos', 'un 30% de los troncos'],
  // las perillas
  ['perillas: los pasos de la cantidad, más cortos', 'src/desafio-perillas.js', "pasos: [0.6, 0.8, 1, 1.2, 1.4], uno: 'duendes'", "pasos: [0.8, 0.9, 1, 1.1, 1.2], uno: 'duendes'"],
  ['perillas: la vida con pasos de la cantidad', 'src/desafio-perillas.js', "pasos: [0.8, 0.9, 1, 1.1, 1.2], uno: 'vida'", "pasos: [0.6, 0.8, 1, 1.2, 1.4], uno: 'vida'"],
  ['perillas: el daño sin escala', 'src/desafio-perillas.js', "pasos: [0.6, 0.8, 1, 1.2, 1.4], uno: 'daño'", "pasos: [1, 1, 1, 1, 1], uno: 'daño'"],
  ['perillas: el paso no se acota', 'src/desafio-perillas.js', 'return Number.isFinite(n) ? Math.max(-PASO_MAXIMO, Math.min(PASO_MAXIMO, Math.round(n))) : 0;', 'return Number.isFinite(n) ? Math.round(n) : 0;'],
  ['perillas: un true cuenta como 1', 'src/desafio-perillas.js', "if (v === null || v === '' || typeof v === 'boolean') return 0;", "if (v === null || v === '') return 0;"],
  ['perillas: fijarPerillas no rehace las dificultades', 'src/desafio-reglas.js', '  perillasActivas = sanearPerillas(p);\n  rehacerDificultades();', '  perillasActivas = sanearPerillas(p);'],
  ['perillas: la cantidad no se aplica', 'src/desafio-reglas.js', 'const c = (e ? e.cantidad : 1) * p.cantidad,', 'const c = (e ? e.cantidad : 1),'],
  ['perillas: el daño usa la vida', 'src/desafio-reglas.js', 'd = (e ? e.dano : 1) * p.dano,', 'd = (e ? e.dano : 1) * p.vida,'],
  ['perillas: se pisa el modo de la partida (pesadilla)', 'src/desafio-reglas.js', 'const c = (e ? e.cantidad : 1) * p.cantidad, d = (e ? e.dano : 1) * p.dano, v = (e ? e.vida : 1) * p.vida;', 'const c = p.cantidad, d = p.dano, v = p.vida;'],
  ['perillas: fijarPartidaMeta borra las perillas', 'src/desafio-reglas.js', '  partidaEfectos = meta ? efectosDe(meta) : null;\n  rehacerDificultades();', '  partidaEfectos = meta ? efectosDe(meta) : null;\n  perillasActivas = perillasNeutras();\n  rehacerDificultades();'],
  ['perillas: en cero ya no es el objeto de siempre', 'src/desafio-reglas.js', '  if (c !== 1 || d !== 1 || v !== 1) {', '  if (true) {'],
  ['perillas: facilitan al revés', 'src/desafio-perillas.js', 'export const perillasFacilitan = (p) => CLAVES_PERILLA.some((k) => sanearPerillas(p)[k] < 0);', 'export const perillasFacilitan = (p) => CLAVES_PERILLA.some((k) => sanearPerillas(p)[k] > 0);'],
  ['perillas: el texto no avisa lo de los récords', 'src/desafio-perillas.js', "${perillasFacilitan(s) ? ' Más fácil que la dificultad: no se anotan récords ni el logro de Implacable.' : ''}", ''],
  ['perillas: el texto dice menos por más', 'src/desafio-perillas.js', 'm[k])} % ${s[k] > 0 ? PERILLAS[k].mas : PERILLAS[k].menos}', 'm[k])} % ${s[k] > 0 ? PERILLAS[k].menos : PERILLAS[k].mas}'],
  ['perillas: se leen de las claves equivocadas', 'src/desafio-perillas.js', "vida: { nombre: 'Cuánto aguantan', ajuste: 'perillaVida'", "vida: { nombre: 'Cuánto aguantan', ajuste: 'perillaCantidad'"],
  ['perillas: los ajustes guardados no se sanean', 'src/guardado.js', 'perillaCantidad: pasoDe(x.perillaCantidad), perillaVida: pasoDe(x.perillaVida), perillaDano: pasoDe(x.perillaDano),', 'perillaCantidad: x.perillaCantidad, perillaVida: pasoDe(x.perillaVida), perillaDano: pasoDe(x.perillaDano),'],
  ['perillas: de fábrica no valen cero', 'src/guardado.js', 'perillaCantidad: 0, perillaVida: 0, perillaDano: 0,\n', 'perillaCantidad: 1, perillaVida: 0, perillaDano: 0,\n'],
  ['perillas: la sin fin las usa', 'src/main.js', 'if (esDesafio) fijarPerillas(esSinFin ? null : perillasDeAjustes(ajustes));\nconst metaJuego', 'if (esDesafio) fijarPerillas(perillasDeAjustes(ajustes));\nconst metaJuego'],
  ['perillas: no se fijan al abrir', 'src/main.js', 'if (esDesafio) fijarPerillas(esSinFin ? null : perillasDeAjustes(ajustes));\nconst metaJuego', 'const metaJuego'],
  ['perillas: tocar una en Ajustes no las fija', 'src/main.js', "    if (clave.startsWith('perilla') && esDesafio) fijarPerillas(esSinFin ? null : perillasDeAjustes(ajustes));", "    if (clave.startsWith('perilla') && esDesafio) { /* nada */ }"],
  ['perillas: el valor del botón queda como texto', 'src/main.js', "if (clave.startsWith('perilla')) v = Number(v);", "if (clave.startsWith('perilla')) v = v;"],
  ['perillas: con una más fácil se anotan los récords', 'src/desafio.js', '    if (perillasFacilitanPartida()) return;   // 4.22.0: con alguna perilla', '    // 4.22.0: con alguna perilla'],
  ['perillas: con una más fácil vale el logro de Implacable', 'src/desafio.js', "dificultad: perillasFacilitanPartida() ? 'facilitada' : (ctx.dificultad?.() || 'normal'),", "dificultad: (ctx.dificultad?.() || 'normal'),"],
  ['perillas: falta un botón en Ajustes (la vida)', 'src/plantilla.html', '<div class="fila-ajuste" data-perillas="ajustes"><span>Cuánto aguantan</span>\n        <div class="segmentos" data-ajuste="perillaVida"><button data-valor="-2">−2</button><button data-valor="-1">−1</button>', '<div class="fila-ajuste" data-perillas="ajustes"><span>Cuánto aguantan</span>\n        <div class="segmentos" data-ajuste="perillaVida"><button data-valor="-1">−1</button>'],
  ['perillas: las filas de Ajustes no se esconden en el Relax', 'src/main.js', "(el.dataset.perillas === 'ajustes' && !esDesafio)", '(false)'],
];

const lista = MUTACIONES.filter((m) => m[0].includes(filtro));
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-mut-4220a-'));
const preparar = (id) => {
  const d = path.join(base, id);
  fs.mkdirSync(path.join(d, 'pruebas'), { recursive: true });
  fs.cpSync(path.join(raiz, 'src'), path.join(d, 'src'), { recursive: true });
  fs.copyFileSync(path.join(raiz, 'three-r186-inline.js'), path.join(d, 'three-r186-inline.js'));
  for (const f of ['verificar-4-22-0-a.mjs', 'ayuda-three.mjs', 'ayuda-codigo.mjs']) fs.copyFileSync(path.join(raiz, 'pruebas', f), path.join(d, 'pruebas', f));
  return d;
};
const correr = (d) => spawnSync(process.execPath, ['pruebas/verificar-4-22-0-a.mjs'], { cwd: d, encoding: 'utf8', timeout: 180000 });
const primerError = (r) => ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || (r.stdout || '').split('\n').pop() || '').slice(0, 150);

let mal = 0;
{
  const d = preparar('sin-mutar');
  const r = correr(d);
  if (r.status !== 0) { console.error('La copia SIN mutar falla: no se puede medir nada.\n' + primerError(r)); process.exit(1); }
  console.log('sin mutar: pasa');
}
for (const [i, [nombre, archivo, esta, queda]] of lista.entries()) {
  const d = preparar(`m${i}`);
  const f = path.join(d, archivo);
  const txt = fs.readFileSync(f, 'utf8');
  if (!txt.includes(esta)) { console.log(`  ?? ${nombre}: no encuentro el texto a mutar en ${archivo}`); mal++; continue; }
  fs.writeFileSync(f, txt.replace(esta, () => queda));
  const r = correr(d);
  if (r.status === 0) { console.log(`  NO LA ATRAPA: ${nombre}`); mal++; } else console.log(`  atrapada: ${nombre}  →  ${primerError(r)}`);
}
fs.rmSync(base, { recursive: true, force: true });
console.log(mal === 0 ? `mutaciones-4-22-0-a: ${lista.length} de ${lista.length} atrapadas` : `mutaciones-4-22-0-a: ${mal} sin atrapar de ${lista.length}`);
process.exit(mal === 0 ? 0 : 1);
