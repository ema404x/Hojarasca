// 4.8 (ataques): rompe a propósito cada regla clave y confirma que verificar-4-8-ataques.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-8-ataques.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-8-ataques.mjs');

const MUTACIONES = [
  ['nunca tres seguidas', 'src/desafio-lados.js', "const pesos = lados.map((l) => (ant && ult === ant && l === ult ? 0 : l === ult ? 0.35 : 1));", "const pesos = lados.map(() => 1);"],
  ['la secuencia es reproducible', 'src/desafio-lados.js', "const azar = generador(hashTexto(`${clave}|lado|${k}`));", "const azar = Math.random;"],
  ['la secuencia depende de la semilla', 'src/desafio-lados.js', "const clave = semilla || 'HOJARASCA-DE-SIEMPRE';\n  const hechos", "const clave = 'HOJARASCA-DE-SIEMPRE';\n  const hechos"],
  ['la entrada no es agua', 'src/desafio-lados.js', "    if (T.agua(x, z)) return false;\n    if ((T.pendiente", "    if ((T.pendiente"],
  ['la entrada no es una ladera', 'src/desafio-lados.js', "if ((T.pendiente?.[k(x, z)] ?? 0) > pendienteMax) return false;", ""],
  ['no se cruza el lago', 'src/desafio-lados.js', "if (w && w.lago) return false;", ""],
  ['los lados se distinguen', 'src/desafio-lados.js', "if (ocupados.some((o) => difAng(o, c) < SEPARACION_LADOS)) continue;\n      const pts", "const pts"],
  ['el punto ocupado se saltea', 'src/desafio-lados.js', "if (libreAhora(p.x, p.z)) return { x: p.x, z: p.z };", "if (true) return { x: p.x, z: p.z };"],
  ['lo guardado se sanea', 'src/desafio-lados.js', "if (!punto(v) || !num(v.noche)) return null;", "if (!v) return null;"],
  ['no hay señuelos en la noche final / con el jefe', 'src/desafio-tacticas.js', "if (!hayOtroLado || jefe || final || n < DISTRACCION.desdeNoche", "if (!hayOtroLado || n < DISTRACCION.desdeNoche"],
  ['no hay señuelos antes de la noche 3', 'src/desafio-tacticas.js', "|| n < DISTRACCION.desdeNoche || total", "|| total"],
  ['los señuelos bajan primero', 'src/desafio-tacticas.js', "return { lista: [...sen, ...resto], senuelos: sen.length };", "return { lista: [...resto, ...sen], senuelos: sen.length };"],
  ['sólo los livianos son señuelo', 'src/desafio-tacticas.js', "export const SENUELOS = ['rastreador', 'saltador', 'tirador'];", "export const SENUELOS = ['rastreador', 'saltador', 'tirador', 'bruto'];"],
  ['el grupo principal espera', 'src/desafio-tacticas.js', "return antes && !sigue ? escalaNoche(noche, DISTRACCION.retraso) : normal;", "return normal;"],
  ['los pesados no rodean', 'src/desafio-tacticas.js', "if (pesado || aDistancia || jefe) return false;", ""],
  ['el rodeo tiene tope', 'src/desafio-tacticas.js', "return rompiendo >= 1 && vecinos >= RODEO.vecinos && veces < RODEO.veces;", "return rompiendo >= 1 && vecinos >= RODEO.vecinos;"],
  ['el primero rompe, no rodea', 'src/desafio-tacticas.js', "return rompiendo >= 1 && vecinos", "return vecinos"],
  ['la cura tiene techo', 'src/desafio-duendes-nuevos.js', "const techo = vidaMax * CURA.techo;\n  if (vida >= techo) return vida;\n  return Math.min(techo, vida + vidaMax * CURA.porcentaje);", "return Math.min(vidaMax, vida + vidaMax * CURA.porcentaje);"],
  ['la cura no baja la vida', 'src/desafio-duendes-nuevos.js', "if (vida >= techo) return vida;", ""],
  ['el curandero no se cura a sí ni al jefe', 'src/desafio-duendes-nuevos.js', "if (!c || c.cura || c.jefe) continue;", "if (!c) continue;"],
  ['la cura tiene radio', 'src/desafio-duendes-nuevos.js', "if (!(c.distancia <= radio) || ", "if ("],
  ['la cura tiene tope de objetivos', 'src/desafio-duendes-nuevos.js', "return lista.slice(0, cuantos).map((x) => x.c);", "return lista.map((x) => x.c);"],
  ['el curandero se cansa', 'src/desafio-duendes-nuevos.js', "export const puedeCurar = (t, usadas) => t >= CURA.cada && usadas < CURA.veces;", "export const puedeCurar = (t, usadas) => t >= CURA.cada;"],
  ['el curandero huye', 'src/desafio-duendes-nuevos.js', "if (dist < CURA.huye) return { modo: 'huir'", "if (false) return { modo: 'huir'"],
  ['el curandero se queda atrás', 'src/desafio-duendes-nuevos.js', "return { x: centro.x + dx * detras, z: centro.z + dz * detras };", "return { x: centro.x - dx * detras, z: centro.z - dz * detras };"],
  ['el curandero tiene poca vida', 'src/desafio-duendes-nuevos.js', "nombre: 'curandero', vida: 34,", "nombre: 'curandero', vida: 340,"],
  ['el enjambre es chico y flojo', 'src/desafio-duendes-nuevos.js', "nombre: 'enjambre', vida: 7, vel: 4.1, dano: 1.1,", "nombre: 'enjambre', vida: 70, vel: 4.1, dano: 11,"],
  ['el enjambre tiene tope', 'src/desafio-duendes-nuevos.js', "return Math.max(4, Math.min(MAX_ENJAMBRE, Math.round(", "return Math.max(4, Math.min(99, Math.round("],
  ['el enjambre no va con el jefe', 'src/desafio-duendes-nuevos.js', "if (conJefe || noche < ENJAMBRES.desde ||", "if (noche < ENJAMBRES.desde ||"],
  ['el enjambre es una noche de cada tres', 'src/desafio-duendes-nuevos.js', "|| (noche - ENJAMBRES.desde) % ENJAMBRES.cada !== 0) return 0;", ") return 0;"],
  ['el curandero desde la noche 4', 'src/desafio-duendes-nuevos.js', "export const CURANDEROS = { desde: 4,", "export const CURANDEROS = { desde: 1,"],
  ['el curandero no va con el jefe', 'src/desafio-duendes-nuevos.js', "if (conJefe || noche < CURANDEROS.desde) return 0;", "if (noche < CURANDEROS.desde) return 0;"],
  ['el enjambre sale en montón', 'src/desafio-duendes-nuevos.js', "export function manchaDelEnjambre(i, n, radio = 2.2) {", "export function manchaDelEnjambre(i, n, radio = 22) {"],
  ['la composición no pasa el techo (rastreadores)', 'src/desafio-reglas.js', "const deRastreadores = Math.min(hueco, sobran); rastreadores -= deRastreadores; hueco -= deRastreadores;", "rastreadores -= 0;"],
  ['los nuevos van al final de la lista', 'src/desafio-reglas.js', "  const lista = [];\n  for (let i = 0; i < rastreadores; i++) lista.push('rastreador');", "  const lista = [];\n  for (let i = 0; i < curanderos; i++) lista.push('curandero');\n  for (let i = 0; i < rastreadores; i++) lista.push('rastreador');"],
  ['el curandero tiene tope por comunes', 'src/desafio-reglas.js', "const curanderos = Math.min(curanderosEnLaNoche(noche, jefes > 0), Math.max(1, Math.floor(comunes / 5)));", "const curanderos = curanderosEnLaNoche(noche, jefes > 0);"],
  ['las especiales no multiplican el enjambre', 'src/desafio-reglas.js', "  if (lista.includes('enjambre')) {", "  if (false) {"],
  ['se guarda el lado', 'src/desafio-reglas.js', "ladoNoche: sanearLadoNoche(x.ladoNoche),", "ladoNoche: null,"],
  ['bajarAlien limpia lo nuevo', 'src/desafio-ataques.js', "a.curas = 0; a.tCura = 0; a.tSolo = 0; a.retaX = 0; a.retaZ = 0; a.aliados = 0;", "a.curas = 0; a.tCura = 0; a.tSolo = 0; a.retaX = 0; a.retaZ = 0;"],
  ['bajarAlien limpia el señuelo', 'src/desafio-ataques.js', "a.senuelo = null; a.rodeoT = 0; a.rodeos = 0;", "a.rodeoT = 0; a.rodeos = 0;"],
  ['el enjambre tiene su cupo', 'src/desafio-ataques.js', "return def.enjambre ? e >= MAX_ENJAMBRE : n >= tope;", "return def.enjambre ? e >= MAX_ENJAMBRE : n + e >= tope;"],
  ['el señuelo termina si te acercás', 'src/desafio-tacticas.js', "return t >= tiempo || distanciaAlJugador < DISTRACCION.seDeja || !conBlanco;", "return t >= tiempo || !conBlanco;"],
  ['el lado se anula con el rescate', 'src/desafio-ataques.js', "if (api.blancoNoche()) { anularLado(); return null; }", ""],
  ['lejos de la base entran alrededor tuyo', 'src/desafio-ataques.js', "const lejos = Math.hypot(js.pos.x - b.x, js.pos.z - b.z) > FUERA_DE_LA_BASE;", "const lejos = false;"],
  ['la decisión de la tarde es idempotente', 'src/desafio-ataques.js', "if (d.ladoNoche && d.ladoNoche.noche === noche) return d.ladoNoche;", ""],
  ['el perro sólo mira a la tarde', 'src/desafio-ataques.js', "if (!(horas >= horaAtaque - 0.75 && horas < horaAtaque)) return null;", ""],
  ['el perro no se queda duro toda la hora', 'src/desafio-ataques.js', "return ((ahoraMs / 1000) % 45) < 14 ? { x: l.x, z: l.z } : null;", "return { x: l.x, z: l.z };"],
  ['el juego decide el lado a la tarde', 'src/desafio.js', "    ataques.decidir(d.oleadas + 1);   // 4.8 ataques: por qué lado (río, monte o camino) entran esta noche\n", ""],
  ['el juego usa el lado para bajar', 'src/desafio.js', "{ const e = ataques.puntoDeEntrada(js, D().oleadas); if (e) return e; }", ""],
];

let fallas = 0;
const corrida = () => spawnSync(process.execPath, [prueba], { cwd: raiz, encoding: 'utf8', timeout: 300000 });
const base = corrida();
if (base.status !== 0) { console.log('la prueba ya falla sin mutar:\n' + (base.stderr || base.stdout).split('\n').slice(0, 12).join('\n')); process.exit(2); }
const solo = process.env.SOLO ? new RegExp(process.env.SOLO) : null;   // SOLO=<parte del nombre>: sólo esas
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
