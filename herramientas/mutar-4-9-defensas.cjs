// 4.9 defensas: rompe a propósito cada regla clave y comprueba que pruebas/verificar-4-9-defensas.mjs falla (si pasa, la prueba no vigilaba eso).
// Uso: node herramientas/mutar-4-9-defensas.cjs   (cambia un archivo de src/ por vez, corre la prueba y lo devuelve con `git checkout`; dejá el árbol limpio antes)
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const MUTACIONES = [
  ['trampas: duración del pegado', 'src/desafio-trampas.js', 'pegado: [3, 4]', 'pegado: [1, 2]'],
  ['trampas: los usos', 'src/desafio-trampas.js', 'usos: 5,', 'usos: 50,'],
  ['trampas: el jefe se pega', 'src/desafio-trampas.js', 'if (!def || def.jefe || def.vuela) return false;', 'if (!def) return false;'],
  ['trampas: la miel prendida no se consume', 'src/desafio-trampas.js', "datos.usos = 0;\n  return 'termino';", "return 'termino';"],
  ['trampas: la inmunidad tras soltarse', 'src/desafio-trampas-mundo.js', 'a.mielCd = MIEL.inmune; a.mielDe = o;', 'a.mielCd = 0; a.mielDe = o;'],
  ['trampas: reponer no gasta miel', 'src/desafio-trampas-mundo.js', "api.gastar('miel', r.gasta);", ''],
  ['trampas: la que cae no suelta al pegado', 'src/desafio-trampas-mundo.js', "if (!o || !obras.obras.includes(o)) soltar(a);", "if (!o) soltar(a);"],
  ['trampas: limpiar al reciclar', 'src/desafio-defensas49-juego.js', 'trampas.limpiarAlien(a); brasas.limpiarAlien(a);', 'brasas.limpiarAlien(a);'],
  ['trampas: bajarAlien no limpia', 'src/desafio.js', '    defensas49.limpiarAlien(a);   // 4.9 defensas: el pegado en la miel y el ahuyentado de la vida anterior\n', ''],
  ['pasadizo: no se cambia de lugar', 'src/desafio-pasadizo-mundo.js', 'j.ubicar(anim.llega.x, anim.llega.z, anim.llega.yaw);', ''],
  ['pasadizo: sale pegado a la boca', 'src/desafio-pasadizo.js', 'llega: 1.9,', 'llega: 0.2,'],
  ['pasadizo: la boca de afuera sin colisión', 'src/planos-defensas-49.js', "h.segmento(0, PASADIZO.largo - 0.8, 0, PASADIZO.largo + 0.8, 0.5, s - 0.05, s + 1.0);", ''],
  ['pasadizo: los duendes lo ven', 'src/planos-defensas-49.js', "defensa: { tipo: 'pasadizo', oculta: true, sinCuerpo: true },", "defensa: { tipo: 'pasadizo', oculta: true },"],
  ['pasadizo: cuenta como defensa', 'src/desafio.js', " && !o.plano.defensa?.oculta).length;   // 4.9 defensas: el pasadizo no cuenta", ").length;"],
  ['pasadizo: sin validar el terreno de afuera', 'src/planos-defensas-49.js', "if (T.agua(bx, bz)) return", "if (false) return"],
  ['pasadizo: sin protección al salir', 'src/desafio-pasadizo-mundo.js', 'api.invulnerable?.(PASADIZO.baja + PASADIZO.sube + PASADIZO.protege);', ''],
  ['roto: umbral de dañada', 'src/desafio-roto.js', 'danada: 0.7,', 'danada: 0.2,'],
  ['roto: sin inclinar', 'src/desafio-roto-mundo.js', '    inclinar(o, estado, semilla);\n', ''],
  ['roto: no se quita al reparar', 'src/desafio-roto-mundo.js', 'if (estado === 0) { if (R) quitar(o); return; }', 'if (estado === 0) { return; }'],
  ['roto: el lazo se ve roto', 'src/desafio-roto.js', "const SE_GASTAN = ['estacas', 'red', 'barril', 'foso', 'pozo', 'abrojos', 'lazo', 'miel', 'zanja'];", "const SE_GASTAN = [];"],
  ['roto: el enganche no actualiza', 'src/desafio-defensas49-juego.js', '    roto.actualizar(dt);\n', ''],
  ['farol: el radio', 'src/desafio-farol.js', 'radio: 5.5,', 'radio: 0.5,'],
  ['farol: el jefe se asusta', 'src/desafio-farol.js', 'return !!viejo && !!def && !def.jefe;', 'return !!viejo && !!def;'],
  ['farol: no delata', 'src/desafio-farol.js', 'delata: 1.45,', 'delata: 1,'],
  ['farol: no devuelve la linterna', 'src/desafio-farol-mundo.js', "luz.intensity = 0;   // al apagar el farol", "// al apagar el farol"],
  ['farol: la L lo apaga', 'src/desafio-farol-mundo.js', 'if (luz) { if (!guardada) tomarLuz(luz); ponerLuz(luz, t); }', ''],
  ['farol: la lluvia no lo apaga', 'src/desafio-farol-mundo.js', 'if (d.farolOn && api.clima().lluvia > FAROL.lluvia)', 'if (false)'],
  ['farol: delata no se usa', 'src/desafio.js', 'defensas49.alcanceDelata(def.alcance * clima.vista)', '(def.alcance * clima.vista)'],
  ['brasas: no prende la miel', 'src/desafio-brasas-mundo.js', 'const prendio = trampas?.prenderCerca?.(v.x1, v.z1, PALA.radioPrende) || 0;', 'const prendio = 0;'],
  ['brasas: no duda', 'src/desafio-brasas-mundo.js', 'a.ahuyentadoT = Math.max(a.ahuyentadoT || 0, e.duda);', ''],
  ['brasas: no daña', 'src/desafio-brasas-mundo.js', "api.herirAlien(a, e.dano, js.pos, 'jugador', 'fuego');", ''],
  ['brasas: atraviesa paredes', 'src/desafio-brasas-mundo.js', 'if (tapado(js.pos.x, js.pos.z, p.x, p.z, yBase)) continue;', ''],
  ['brasas: atrás también', 'src/desafio-brasas.js', 'if (d > alcance || d < 0.01) return false;', 'if (d > alcance || d < 0.01) return true;'],
  ['brasas: se carga sin fuego', 'src/desafio-brasas.js', "if (!hayFuego) return { accion: 'sinFuego', cargas };", ''],
  ['brasas: no gasta carga', 'src/desafio.js', '        d.brasas--;\n        defensas49.abanico(js, _dir);', '        defensas49.abanico(js, _dir);'],
  ['brasas: sin la pala en la mano', 'src/desafio-brasas-mundo.js', "&& api.armaEnMano?.() === 'pala';", ';'],
  ['miel: el contador no se sanea', 'src/desafio-reglas.js', "const COSAS_CAJA = ['tronco', 'tabla', 'piedra', 'cristal', 'flechas', 'emplastos', 'miel'];", "const COSAS_CAJA = ['tronco', 'tabla', 'piedra', 'cristal', 'flechas', 'emplastos'];"],
  ['miel: la caja del alba no la trae', 'src/desafio-reglas.js', 'if (miel > 0) caja.miel = miel;', ''],
  ['miel: el taller no suma la receta', 'src/desafio-reglas.js', 'RECETAS.push(...RECETAS_TRAMPAS, ...RECETAS_FAROL, ...RECETAS_BRASAS);', 'RECETAS.push(...RECETAS_FAROL, ...RECETAS_BRASAS);'],
  ['piezas: no se suman al menú', 'src/construccion.js', 'PIEZAS.push(...PIEZAS_DEFENSAS_49);', ''],
  ['guardado: el farol no se sanea', 'src/desafio-reglas.js', 'farolOn: !!x.farolOn, brasas: ent(x.brasas, 0, PALA.cargas),', 'farolOn: x.farolOn, brasas: ent(x.brasas, 0, 999),'],
  ['vuelta: el farol y la pala no se llevan', 'src/desafio-vuelta.js', "'farolMano', 'pala'];", "'farolMano'];"],
];
const solo = process.argv[2];
let fallaron = 0, sobrevivieron = [];
for (const [nombre, archivo, de, a] of MUTACIONES) {
  if (solo && !nombre.includes(solo)) continue;
  const ruta = path.join(raiz, archivo);
  const original = fs.readFileSync(ruta, 'utf8');
  if (!original.includes(de)) { console.log(`?? ${nombre}: no encuentro el texto en ${archivo}`); sobrevivieron.push(nombre + ' (texto no encontrado)'); continue; }
  fs.writeFileSync(ruta, original.replace(de, a));
  let r;
  try { r = spawnSync('node', ['pruebas/verificar-4-9-defensas.mjs'], { cwd: raiz, encoding: 'utf8', timeout: 120000 }); }
  finally { fs.writeFileSync(ruta, original); }
  const cayo = r.status !== 0;
  if (cayo) fallaron++; else sobrevivieron.push(nombre);
  const motivo = cayo ? ((r.stderr || '').split('\n').find((l) => /AssertionError|Error/.test(l)) || '').slice(0, 130) : '';
  console.log(`${cayo ? 'cae ' : 'PASA'} · ${nombre}${motivo ? ' · ' + motivo : ''}`);
}
console.log(`\n${fallaron} mutaciones hicieron fallar la prueba${sobrevivieron.length ? `; sobrevivieron ${sobrevivieron.length}: ${sobrevivieron.join(' | ')}` : ' (todas)'}`);
execSync('git status --short src', { cwd: raiz, stdio: 'inherit' });
