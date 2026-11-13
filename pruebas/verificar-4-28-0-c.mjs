// 4.28.0 (C): el nivel Ultra en los materiales (src/ultra-materiales.js): relieve, desgaste y brillo en la aldea, el tren, las estructuras del valle y
// las obras; la tela, la piel y los labios de la gente de cerca (y la cara con gestos hasta 10 m); los vidrios que reflejan el cielo.
// Lo que se comprueba, con los materiales de verdad (three local) y el shader Lambert/Basic de three:
//   · Ultra apagado (y Ultra pedido con la calidad en Media): la clave de programa de cada material es la de la 4.27.0 y su shader no trae nada de Ultra.
//   · Ultra prendido (sólo con calidad Alta): la clave suma «|ultra-c-<tipo>», el shader trae el relieve, el brillo y lo propio de cada uno (cada reemplazo
//     encontró su lugar), y el material se marca para recompilar (version sube) al prender y al apagar.
//   · Todo lo de Ultra pasa por esUltra: main.js sincroniza al abrir (antes de armar materiales) y en cada cuadro; la cara de cerca usa 10 m sólo con Ultra.
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-28-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.C4280_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  registrarThree();
  const THREE = await import('three');
  const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);
  const UM = await imp('ultra-materiales.js');
  const { prepararMaterialAldea } = await imp('aldea-arquitectura.js');
  const { materialVegetal, U } = await imp('materiales.js');
  const { materialGente } = await imp('gente-cuerpo.js');
  const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

  // el shader de three antes de onBeforeCompile (con los #include sin expandir, como lo ve onBeforeCompile): los trozos de three local (no los exporta)
  let codigo = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8');
  ok('los trozos de shader de three se encuentran', codigo.split('zt={alphahash_fragment').length === 2);
  codigo = codigo.replace('zt={alphahash_fragment', 'zt=globalThis.__trozos={alphahash_fragment');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  caja.globalThis = caja;
  vm.runInNewContext(codigo, caja);
  const Z = caja.__trozos;
  const shader = (lib) => ({ vertexShader: Z['mesh' + lib + '_vert'], fragmentShader: Z['mesh' + lib + '_frag'], uniforms: {} });
  const compilar = (m, lib) => { const sh = shader(lib); m.onBeforeCompile(sh, null); return sh; };
  const conUltra = (sh) => /alturaU|vPWU|brilloU|ultra/i.test(sh.vertexShader + sh.fragmentShader);

  UM.__ponerUltraC(false);
  // los materiales, armados como en el juego
  const aldea = prepararMaterialAldea(materialVegetal({ flex: 0 }));
  const gente = materialGente();
  const vidrioValle = UM.vidrioUltra(new THREE.MeshBasicMaterial({ color: 0x1a1612, side: THREE.DoubleSide }), U);
  const vidrioAldea = UM.vidrioUltra(new THREE.MeshBasicMaterial({ vertexColors: true }), U);
  const estructura = UM.conUltraC(materialVegetal({ flex: 0 }), 'estructura', UM.inyectarEstructuraUltra);
  // el ripio y el humo: un material con las marcas de los de verdad (materialRipio de aldea-mundo y puntosMaterial de clima)
  const ripio = UM.conUltraC(new THREE.MeshLambertMaterial(), 'ripio', UM.inyectarRipioUltra);
  const ripioPrevio = ripio.onBeforeCompile; ripio.onBeforeCompile = (sh, r) => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat charcoR = 0.0; ' + UM.CHARCO_RIPIO_ALTA + ' 0.5);'); ripioPrevio(sh, r); };
  const humoFrag = '#include <common>\n#include <fog_pars_fragment>\nvarying float vVida; varying float vAzar;\nvoid main() { float a = 1.0; vec3 c = vec3(1.0);\n gl_FragColor = vec4(c, a);\n#include <fog_fragment>\n}';
  const humo = UM.conUltraC(new THREE.ShaderMaterial({ vertexShader: 'void main() {}', fragmentShader: humoFrag }), 'humo', UM.inyectarHumoUltra('vAzar'));
  const compilarHumo = () => { const sh = { vertexShader: humo.vertexShader, fragmentShader: humo.fragmentShader, uniforms: {} }; humo.onBeforeCompile(sh, null); return sh; };
  // lo de antes, para comparar: un material igual sin Ultra
  const basicoSolo = new THREE.MeshBasicMaterial({ color: 0x1a1612 });
  const vegetalSolo = materialVegetal({ flex: 0 });
  const casos = [['aldea', aldea, 'lambert'], ['gente', gente, 'lambert'], ['vidrio del valle', vidrioValle, 'basic'], ['vidrio de la aldea', vidrioAldea, 'basic'], ['estructura', estructura, 'lambert'], ['ripio', ripio, 'lambert']];
  ok('apagado: el humo sin hebras', !/hebrasU/.test(compilarHumo().fragmentShader));

  // ---- apagado: la clave y el shader de siempre
  const claveAldea = aldea.customProgramCacheKey();
  ok('apagado: la clave de la aldea es la de antes (termina en |aldea-3.6)', /\|aldea-3\.6$/.test(claveAldea));
  ok('apagado: la clave de la gente es gente-atlas-370', gente.customProgramCacheKey() === 'gente-atlas-370');
  ok('apagado: la clave del vidrio del valle es la de un MeshBasic sin tocar', vidrioValle.customProgramCacheKey() === basicoSolo.customProgramCacheKey());
  ok('apagado: la clave de la estructura es la de un materialVegetal sin tocar', estructura.customProgramCacheKey() === vegetalSolo.customProgramCacheKey());
  for (const [n, m, lib] of casos) ok(`apagado: el shader de ${n} no trae nada de Ultra`, !conUltra(compilar(m, lib)));
  ok('apagado: el shader de la estructura es idéntico al de un materialVegetal sin tocar', compilar(estructura, 'lambert').fragmentShader === compilar(vegetalSolo, 'lambert').fragmentShader);
  ok('apagado: el shader del vidrio es idéntico al de un MeshBasic sin tocar', compilar(vidrioValle, 'basic').fragmentShader === compilar(basicoSolo, 'basic').fragmentShader);

  // ---- Ultra pedido con la calidad en Media (o la automática bajó): sigue apagado
  ok('Ultra con calidad media no prende nada', UM.sincronizarUltraC({ ultra: true, calidad: 'media' }) === false && !UM.ultraDetalle());
  ok('Alta sin Ultra no prende nada', UM.sincronizarUltraC({ ultra: false, calidad: 'alta' }) === false && !UM.ultraDetalle());
  ok('Ultra «sí» como texto no cuenta (sólo true)', UM.sincronizarUltraC({ ultra: 'si', calidad: 'alta' }) === false);

  // ---- prendido
  const versiones = casos.map(([, m]) => m.version);
  ok('Ultra con Alta prende', UM.sincronizarUltraC({ ultra: true, calidad: 'alta' }) === true && UM.ultraDetalle());
  ok('al prender, cada material se marca para recompilar', casos.every(([, m], i) => m.version > versiones[i]));
  ok('prendido: la clave de la aldea suma |ultra-c-aldea', aldea.customProgramCacheKey() === claveAldea + '|ultra-c-aldea');
  ok('prendido: la clave de la gente suma |ultra-c-gente', gente.customProgramCacheKey() === 'gente-atlas-370|ultra-c-gente');
  ok('prendido: la clave del vidrio suma |ultra-c-vidrio', vidrioValle.customProgramCacheKey().endsWith('|ultra-c-vidrio'));
  ok('prendido: la clave de la estructura suma |ultra-c-estructura', estructura.customProgramCacheKey().endsWith('|ultra-c-estructura'));
  const shA = compilar(aldea, 'lambert'), shG = compilar(gente, 'lambert'), shV = compilar(vidrioValle, 'basic'), shVA = compilar(vidrioAldea, 'basic'), shE = compilar(estructura, 'lambert');
  ok('aldea: trae el relieve por tipo (dentro del bloque de la aldea)', shA.fragmentShader.includes(UM.GLSL_ALDEA_ULTRA) && shA.fragmentShader.indexOf(UM.GLSL_ALDEA_ULTRA) < shA.fragmentShader.indexOf(UM.MARCA_ALDEA_ULTRA));
  ok('aldea: la normal se inclina con la altura y hay brillo de sol', shA.fragmentShader.includes(UM.GLSL_RELIEVE_U) && shA.fragmentShader.includes(UM.GLSL_BRILLO_U));
  ok('aldea: el relieve va después de las normales y antes de la luz', shA.fragmentShader.indexOf('#include <normal_fragment_maps>') < shA.fragmentShader.indexOf(UM.GLSL_RELIEVE_U) && shA.fragmentShader.indexOf(UM.GLSL_RELIEVE_U) < shA.fragmentShader.indexOf('#include <lights_fragment_begin>'));
  ok('gente: la tela, la piel y los labios (dentro del color de la gente)', shG.fragmentShader.includes(UM.GLSL_GENTE_ULTRA) && shG.fragmentShader.indexOf(UM.GLSL_GENTE_ULTRA) < shG.fragmentShader.indexOf(UM.MARCA_GENTE_ULTRA));
  ok('gente: relieve y brillo', shG.fragmentShader.includes(UM.GLSL_RELIEVE_U) && shG.fragmentShader.includes(UM.GLSL_BRILLO_U));
  ok('vidrios: el reflejo del cielo (en los dos) antes de la salida', [shV, shVA].every((s) => s.fragmentShader.includes(UM.GLSL_VIDRIO_U_FRAG) && s.vertexShader.includes('vPWU =') && s.fragmentShader.indexOf(UM.GLSL_VIDRIO_U_FRAG) < s.fragmentShader.indexOf('#include <opaque_fragment>')));
  ok('vidrios: con el cielo, el horizonte y el sol de verdad (los uniformes compartidos)', shV.uniforms.uCenitU === U.uCenit && shV.uniforms.uHorizonteU === U.uHorizonte && shV.uniforms.uSolDirU === U.uSolDir);
  ok('estructura: veta, relieve y suciedad', shE.fragmentShader.includes(UM.GLSL_ESTRUCTURA_ULTRA) && shE.fragmentShader.includes(UM.GLSL_RELIEVE_U));
  ok('aldea: charcos que reflejan el cielo (con las gotas), antes de la salida', shA.fragmentShader.includes(UM.GLSL_CHARCO_ALDEA_U) && shA.fragmentShader.indexOf(UM.GLSL_CHARCO_ALDEA_U) < shA.fragmentShader.indexOf('#include <opaque_fragment>') && /charcoU = uMojadoVeg/.test(shA.fragmentShader) && shA.uniforms.uCenitU === U.uCenit && shA.uniforms.uLluviaU === U.uLluvia);
  ok('aldea: musgo y líquenes del lado húmedo', /musgoU/.test(shA.fragmentShader) && /liqU/.test(shA.fragmentShader));
  ok('aldea y estructura: la nieve pegada por el viento y el brillo de la nieve', [shA, shE].every((s) => s.fragmentShader.includes(UM.NIEVE_JUNTA_U + UM.glslNieveU(s === shA ? 'nieveA' : '1.0')) && s.fragmentShader.includes(UM.NIEVE_PINTA_U + UM.GLSL_NIEVE_BRILLO_U)));
  ok('estructura: musgo y líquenes', /musgoU/.test(shE.fragmentShader));
  const shR = compilar(ripio, 'lambert');
  ok('ripio: más charcos y que reflejen el cielo con las gotas', !shR.fragmentShader.includes(UM.CHARCO_RIPIO_ALTA) && shR.fragmentShader.includes(UM.GLSL_CHARCO_RIPIO_U) && shR.uniforms.uTiempoU === U.uTiempo);
  ok('humo y vapor: en hebras', compilarHumo().fragmentShader.includes('a *= hebrasU(gl_PointCoord - 0.5, vVida, vAzar);'));
  ok('ninguna inyección se perdió (cada GLSL una sola vez)', [[shA, UM.GLSL_RELIEVE_U], [shG, UM.GLSL_RELIEVE_U], [shE, UM.GLSL_RELIEVE_U], [shV, UM.GLSL_VIDRIO_U_FRAG]].every(([s, g]) => s.fragmentShader.split(g).length === 2));

  // ---- apagado otra vez (el menú, o la calidad que baja): vuelve todo
  const v2 = casos.map(([, m]) => m.version);
  ok('al bajar la calidad a Media, Ultra se apaga', UM.sincronizarUltraC({ ultra: true, calidad: 'media' }) === true && !UM.ultraDetalle());
  ok('al apagar, cada material se marca para recompilar', casos.every(([, m], i) => m.version > v2[i]));
  ok('apagado de nuevo: claves de antes', aldea.customProgramCacheKey() === claveAldea && gente.customProgramCacheKey() === 'gente-atlas-370');
  ok('apagado de nuevo: shaders sin Ultra', casos.every(([, m, lib]) => !conUltra(compilar(m, lib))));
  ok('preparar dos veces no envuelve dos veces', UM.conUltraC(aldea, 'aldea', UM.inyectarAldeaUltra) === aldea && UM.infoUltraC().materiales === UM.infoUltraC().materiales);

  // ---- el enganche en el juego (por texto: main.js es enorme)
  const main = leer('main.js');
  const iSync = main.indexOf('sincronizarUltraC(ajustes);');
  ok('main.js sincroniza Ultra al abrir, antes de armar cualquier material', iSync > 0 && iSync < main.indexOf('crearAldeaMundo(') && iSync < main.indexOf('crearEstructuras(') && iSync < main.indexOf('function cuadroDelJuego('));
  const iCuadro = main.indexOf('function cuadroDelJuego(');
  const iSync2 = main.indexOf('sincronizarUltraC(ajustes);', iCuadro);
  ok('main.js sincroniza Ultra en cada cuadro (también con la autocalidad)', iSync2 > iCuadro && iSync2 < main.indexOf("if (modo === 'carga') return;", iCuadro));
  const cuerpo = leer('gente-cuerpo.js');
  ok('la cara con gestos: 10 m sólo con Ultra, 7 m sin', /dist < \(ultraDetalle\(\) \? CERCA_CARA_ULTRA : CERCA_CARA\)/.test(cuerpo) && /const CERCA_CARA = 7,/.test(cuerpo) && UM.CERCA_CARA_ULTRA === 10);
  const tren = leer('tren.js');
  ok('el tren pide la clave de la aldea en cada compilación (no la guarda de una vez)', /estructura\.customProgramCacheKey = \(\) => claveAldea\.call\(estructura\) \+ '\|tren-3\.7\.3'/.test(tren) && !/const clave = estructura\.customProgramCacheKey\(\);/.test(tren));
  ok('las estructuras del valle y las obras llevan Ultra', /conUltraC\(mat, 'estructura', inyectarEstructuraUltra\)/.test(leer('estructuras.js')) && /conUltraC\(mat, 'estructura', inyectarEstructuraUltra\)/.test(leer('construccion.js')));
  // (4.28.0: el reflejo de los vidrios quedó afuera: en la partida no se vio ninguna diferencia; el código queda en ultra-materiales.js sin enganchar)
  ok('los vidrios no llevan Ultra (quedó afuera) y los charcos conocen el cielo', !/vidrioUltra\(/.test(leer('estructuras.js') + leer('aldea-mundo.js')) && /conocerCieloUltraC\(U\)/.test(leer('estructuras.js')) && /conocerCieloUltraC\(U\)/.test(leer('aldea-mundo.js')));
  ok('las calles de ripio, el humo de las chimeneas y el vapor de la olla llevan Ultra', leer('aldea-mundo.js').includes("conUltraC(m, 'ripio', inyectarRipioUltra)") && leer('clima.js').split("'humo', inyectarHumoUltra('vAzar')").length === 3 && leer('cocina-mundo.js').includes("conUltraC(matHumo, 'vapor', inyectarHumoUltra('vPeso'))"));
  ok('ultra-materiales no importa three (lo puro y el GLSL, sin el motor)', !/from 'three'/.test(leer('ultra-materiales.js')));
  return R;
}

if (process.argv.includes('--hijo')) {
  comprobar().then((R) => console.log(JSON.stringify(R)), (e) => { console.log(JSON.stringify([['error: ' + (e && e.stack || e), false]])); });
} else {
  let malas = 0;
  const hijo = (src) => {
    const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, C4280_SRC: src }, encoding: 'utf8' });
    try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return [['sin salida: ' + (r.stderr || '').slice(0, 400), false]]; }
  };
  const base = hijo(SRC);
  for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

  // ---- mutaciones
  const MUT = [
    ['ultra-materiales.js', 'la clave cambia aunque Ultra esté apagado', "return estado.on ? '|ultra-c-' + tipo : '';", "return '|ultra-c-' + tipo;"],
    ['ultra-materiales.js', 'el shader de Ultra se mete siempre', 'if (estado.on) inyectar(sh, r);', 'inyectar(sh, r);'],
    ['ultra-materiales.js', 'Ultra sin mirar la calidad', 'const on = esUltra(ajustes);', 'const on = !!ajustes?.ultra;'],
    ['ultra-materiales.js', 'al cambiar no se recompila', 'for (const m of estado.mats) m.needsUpdate = true;', ''],
    ['ultra-materiales.js', 'la clave de antes se pierde', 'mat.customProgramCacheKey = () => (fija !== null ? fija : claveDe.call(mat)) + claveUltraC(tipo);', "mat.customProgramCacheKey = () => 'x' + claveUltraC(tipo);"],
    ['ultra-materiales.js', 'el relieve no inclina la normal', "    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\\n' + GLSL_RELIEVE_U)\n    .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\\n' + GLSL_BRILLO_U);\n}\n// El agregado de Ultra al material de la gente", "    .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\\n' + GLSL_BRILLO_U);\n}\n// El agregado de Ultra al material de la gente"],
    ['aldea-arquitectura.js', 'la aldea sin Ultra', "  conUltraC(mat, 'aldea', inyectarAldeaUltra);\n", ''],
    ['aldea-arquitectura.js', 'el bloque de color de la aldea cambió (la marca no está)', '      diffuseColor.rgb = alb;\n', '      diffuseColor.rgb = alb * 1.0;\n'],
    ['gente-cuerpo.js', 'la cara a 10 m también sin Ultra', 'dist < (ultraDetalle() ? CERCA_CARA_ULTRA : CERCA_CARA)', 'dist < CERCA_CARA_ULTRA'],
    ['gente-cuerpo.js', 'la gente sin Ultra', "  conUltraC(MAT_ATLAS, 'gente', inyectarGenteUltra);\n", ''],
    ['main.js', 'no se sincroniza en cada cuadro', "  sincronizarUltraC(ajustes);   // 4.28.0 (C): si Ultra se prendió o se apagó", '  // (sin)   // 4.28.0 (C): si Ultra se prendió o se apagó'],
    ['ultra-materiales.js', 'el charco de la aldea no se pinta', "    .replace('#include <opaque_fragment>', GLSL_CHARCO_ALDEA_U + '\\n#include <opaque_fragment>')", ''],
    ['ultra-materiales.js', 'la nieve pegada no entra', "    .replace(NIEVE_JUNTA_U, NIEVE_JUNTA_U + glslNieveU('nieveA'))", ''],
    ['ultra-materiales.js', 'el ripio sin más charcos', "    .replace(CHARCO_RIPIO_ALTA, 'charcoR = uMojadoR * smoothstep(0.5, 0.74,')", ''],
    ['ultra-materiales.js', 'los charcos sin el cielo', 'const U = cielo.U; if (!U) return;', 'return;'],
    ['clima.js', 'el humo de las chimeneas sin Ultra', "conUltraC(puntosMaterial({ color: '#b9b6b0', tam: 6, forma: 'humo', opacidad: 0.55 }), 'humo', inyectarHumoUltra('vAzar'))", "puntosMaterial({ color: '#b9b6b0', tam: 6, forma: 'humo', opacidad: 0.55 })"],
    ['tren.js', 'el tren guarda la clave de una vez', "estructura.customProgramCacheKey = () => claveAldea.call(estructura) + '|tren-3.7.3';", "const clave = estructura.customProgramCacheKey();\n  estructura.customProgramCacheKey = () => clave + '|tren-3.7.3';"],
  ];
  for (const [archivo, nombre, de, a] of MUT) {
    const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
    if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4280c-'));
    fs.cpSync(SRC, dir, { recursive: true });
    fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
    const r = hijo(dir);
    const falla = !r || r.some(([, v]) => !v);
    console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
    if (!falla) malas++;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
  process.exit(malas ? 1 : 0);
}
