// 4.10 (guardian): rompe a propósito cada regla clave y confirma que verificar-4-10-guardian.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-10-guardian.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-10-guardian.mjs');

const B = 'src/desafio-bonos.js', H = 'src/desafio-habilidades.js', P = 'src/desafio-bestiario-premia.js', M = 'src/desafio-habilidades-mundo.js', D = 'src/desafio.js';
const R = 'src/desafio-reglas.js', N2 = 'src/desafio-noche2.js';
const MUTACIONES = [
  // ---- los bonos
  ['los bonos suman todos los orígenes', B, 's += Number(b[clave]);', 's = Number(b[clave]);'],
  ['quitar un origen se lo lleva', B, 'delete o[origen];', 'o[origen] = o[origen];'],
  ['una clave desconocida se rechaza', B, '!BONOS_CLAVES.includes(clave) || !finito(valor)) return false;', '!finito(valor)) return false;'],
  ['__proto__ no es un origen', B, "&& o !== '__proto__';", ';'],
  ['hay un tope de orígenes', B, 'if (Object.keys(o).length >= MAX_ORIGENES) return false;', ''],
  ['sumar acumula en el origen', B, 'Math.min(MAX_VALOR, antes + Number(valor))));', 'Math.min(MAX_VALOR, Number(valor))));'],
  ['el saneo descarta claves inventadas', B, 'for (const clave of BONOS_CLAVES) if (Object.hasOwn(b, clave) && finito(b[clave]))', 'for (const clave of Object.keys(b))'],
  ['la salud máxima tiene piso', B, "return Math.max(40, Math.round(base + bonoAplicado(d, 'saludMax')));", "return Math.round(base + bonoAplicado(d, 'saludMax'));"],
  ['los bonos tienen tope al aplicarse', B, 'return Math.max(t[0], Math.min(t[1], bonoDe(d, clave)));', 'return bonoDe(d, clave);'],
  ['más daño es multiplicar', B, 'a.dano = redondear(a.dano * (1 + dano));', 'a.dano = redondear(a.dano * (1 - dano));'],
  ['menos espera es multiplicar por menos', B, 'a.cadencia * (1 - recarga)', 'a.cadencia * (1 + recarga)'],
  ['el alcance también mueve la velocidad del tiro', B, 'if (Number.isFinite(a.vel)) a.vel = redondear(a.vel * (1 + alcance));', ''],
  ['el disparo cargado pega más', B, 'if (a.cargado && dano) a.cargado', 'if (false) a.cargado'],
  // ---- las habilidades
  ['los costos son 1, 2 y 3', H, 'export const COSTOS = [1, 2, 3];', 'export const COSTOS = [1, 1, 2];'],
  ['tres niveles', H, 'export const NIVEL_MAX_HABILIDAD = 3;', 'export const NIVEL_MAX_HABILIDAD = 4;'],
  ['un punto por noche, una sola vez', H, 'if (n <= h.noche) return false;', ''],
  ['sin puntos no se sube', H, "if ((h?.puntos || 0) < costo) return { ok: false, razon: 'puntos', costo, faltan: costo - (h?.puntos || 0) };", ''],
  ['subir cobra', H, 'h.puntos -= p.costo;', ''],
  ['al máximo no se sube', H, "if (costo === null) return { ok: false, razon: 'maximo' };", ''],
  ['los bonos de habilidad reemplazan al nivel anterior', H, 'quitarBonosDeOrigen(d, ORIGEN_HABILIDAD);', ''],
  ['el origen de las habilidades se llama habilidad', H, "export const ORIGEN_HABILIDAD = 'habilidad';", "export const ORIGEN_HABILIDAD = 'ventaja';"],
  ['Pulso firme: nivel 3 es 20 %', H, '{ dano: 0.20, alcance: 0.15 }', '{ dano: 0.02, alcance: 0.15 }'],
  ['Corazón: nivel 3 son 35 puntos', H, '{ saludMax: 35 }', '{ saludMax: 3 }'],
  ['Material justo rinde más golpes', H, 'golpesPorMaterial: [4, 5, 6]', 'golpesPorMaterial: [3, 3, 3]'],
  ['Corazón esquiva daño', H, 'menosDano: [0, 0.05, 0.10]', 'menosDano: [0, 0, 0]'],
  ['el saneo acota los niveles', H, 'const n = ent(v.niveles[id], NIVEL_MAX_HABILIDAD);', 'const n = ent(v.niveles[id], 99);'],
  ['el saneo acota los puntos', H, 'r.puntos = ent(v.puntos, 99);', 'r.puntos = ent(v.puntos, 1e9);'],
  ['sólo ids que existen', H, 'for (const id of IDS_HABILIDAD) {\n      const n = ent(', 'for (const id of Object.keys(v.niveles)) {\n      const n = ent('],
  // ---- el bestiario
  ['estudios a los 5, 15 y 40', P, 'export const UMBRALES_ESTUDIO = [5, 15, 40];', 'export const UMBRALES_ESTUDIO = [3, 15, 40];'],
  ['el enjambre necesita cuatro veces más', P, '{ enjambre: 4 }', '{ enjambre: 1 }'],
  ['el estudio 3 sube el daño 5 %', P, 'export const DANO_ESTUDIADO = 0.05;', 'export const DANO_ESTUDIADO = 0;'],
  ['el daño extra sólo con el estudio 3', P, 'return nivelEstudio(best, tipo) >= 3 ?', 'return nivelEstudio(best, tipo) >= 2 ?'],
  ['sólo se anotan los lados que existen', P, '|| !LADOS.includes(lado)) return false;', ') return false;'],
  ['el lado más visto manda', P, 'n > mejor.n))', 'n < mejor.n))'],
  ['el punto débil dice los golpes de lanza', P, 'l = golpes(v, ARMAS.lanza.dano)', 'l = golpes(v, ARMAS.arco.dano)'],
  ['sube de nivel una sola vez', P, 'if (antes < u[i] && despues >= u[i]) return i + 1;', 'if (despues >= u[i]) return i + 1;'],
  ['el viejo no se estudia', P, 'if (!TIPOS_ESTUDIO.includes(tipo)) return 0;\n  const n = abatidosDe', 'const n = abatidosDe'],
  ['el saneo del bestiario cuida los lados', N2, "for (const l of ['rio', 'monte', 'camino']) if (Object.hasOwn(r.lados, l) && n(r.lados[l]) > 0) lados[l] = n(r.lados[l]);", 'for (const l of Object.keys(r.lados)) lados[l] = r.lados[l];'],
  ['el curandero tiene ficha', N2, "  curandero: {\n    nombre: 'Yuyero'", "  curanderoX: {\n    nombre: 'Yuyero'"],
  // ---- el estado
  ['la partida vieja carga saneada', R, '    bonos, habilidades,   // 4.10 guardian', '    bonos: x.bonos, habilidades: x.habilidades,   // 4.10 guardian'],
  ['los bonos de habilidad salen de los niveles', R, 'const bonos = aplicarHabilidadesABonos({ bonos: sanearBonos(x.bonos), habilidades }).bonos;', 'const bonos = sanearBonos(x.bonos);'],
  ['la salud guardada puede pasar de 100 con el Corazón', R, 'Math.min(saludTope, Number.isFinite', 'Math.min(SALUD_MAX, Number.isFinite'],
  ['una partida nueva empieza sin puntos', R, 'bonos: bonosNuevos(), habilidades: habilidadesNuevas(),', 'bonos: bonosNuevos(), habilidades: { puntos: 5, noche: 0, niveles: {} },'],
  // ---- la pantalla
  ['el botón de subir se apaga', M, 'boton.disabled = !p.ok;', 'boton.disabled = false;'],
  ['subir guarda', M, 'ctx.guardar?.();', ''],
  ['el teclado pasa al botón de subir', M, "foco = e.detail === 0 ? 'subir' : `lista:${id}`;", 'foco = `lista:${id}`;'],
  // ---- el enganche
  ['la salud máxima sale de los bonos', D, 'const saludMaxima = () => saludMaximaConBonos(SALUD_MAX, D());', 'const saludMaxima = () => SALUD_MAX;'],
  ['levantarse da la salud máxima', D, 'D().salud = saludMaxima(); destello = 0; }', 'D().salud = SALUD_MAX; destello = 0; }'],
  ['el disparo cargado usa los bonos', D, 'function atacarAlterno(id) {\n    const arma = armaConBonos(armaEfectiva(id, progreso().cosas), D());', 'function atacarAlterno(id) {\n    const arma = armaEfectiva(id, progreso().cosas);'],
  ['el ataque usa los bonos', D, 'function atacar(id, opciones = {}) {\n    const arma = armaConBonos(armaEfectiva(id, progreso().cosas), D());', 'function atacar(id, opciones = {}) {\n    const arma = armaEfectiva(id, progreso().cosas);'],
  ['el punto se da al amanecer', D, 'if (puntoPorNoche(d, d.oleadas)) setTimeout', 'if (false) setTimeout'],
  ['Corazón esquiva golpes', D, 'if (desde) n *= 1 - menosDano(d);', ''],
  ['el martillo gasta por golpes de la habilidad', D, 'pendienteMartillo += 1 / golpesMat;', 'pendienteMartillo += 1 / 3;'],
  ['Manos hábiles repara más por golpe', D, 'max * 0.1 * rinde', 'max * 0.1'],
  ['Manos hábiles gasta menos con R', D, "if (c) c.cantidad = Math.max(1, Math.ceil(c.cantidad / (1 + bonoAplicado(D(), 'reparar'))));", ''],
  ['correr llega al jugador', D, "js.bonoCorrer = bonoAplicado(d, 'correr');", ''],
  ['jugador.js usa el bono de correr', 'src/jugador.js', 'vmax *= 1 + Math.max(-0.3, Math.min(0.35, estado.bonoCorrer));', ''],
  ['el estudio 3 sube el daño', D, 'dano *= danoContraTipo(D().bestiario, a.tipo);', ''],
  ['se anota el lado al abatir', D, 'anotarLado(d.bestiario, tipo, d.ladoNoche?.id);', ''],
  ['se avisa el estudio', D, 'if (est) bestiarioPendiente.push(', 'if (false) bestiarioPendiente.push('],
  ['la pestaña existe', 'src/main.js', "if (desafio?.habilidadesMundo) pestanas.push(['guardian'", "if (false) pestanas.push(['guardian'"],
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
