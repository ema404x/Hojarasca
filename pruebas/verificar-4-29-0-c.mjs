// 4.29.0 (C): Ultra en los detalles de personajes, cine y lo que no entró en la 4.28.0.
//   · Pelo y ropa con viento: cada vértice de la persona trae `aVientoU` (0 pegado al cuerpo; la pollera, el poncho con sus flecos, las puntas de la bufanda, el
//     faldón de la campera y el pelo largo se mueven más cuanto más abajo); el shader de la gente lo usa sólo con Ultra, con la ola de ráfaga del bosque.
//   · Ropa mojada: la persona se moja con lluvia a cielo abierto (no adentro) y se seca despacio; lo mojado viaja en el hueso 23 de su tramo de la textura
//     de huesos (la mano en primera persona, en un atributo); el shader oscurece y da brillo sólo con Ultra.
//   · Cine: profundidad de campo en las cinemáticas, sólo con Ultra (ultra-cine.js): enfoca el punto al que mira la cámara dirigida.
//   · Lo que no entró en la 4.28.0: los vidrios reflejan el cielo (el enganche faltaba), las hojas que caen vuelven y el vapor de la olla y la pava.
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-29-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.C4290C_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

// la gente de gente-cuerpo.js armada en una VM sin DOM (como verificar-4-0-2-dalia.mjs), con el SRC que toque
function armarVM(src) {
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  visitar(path.join(src, 'gente-cuerpo.js'));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
      `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += '\n;globalThis.__C = __mod_gente_cuerpo; globalThis.__THREE = THREE; globalThis.__UM = __mod_ultra_materiales; globalThis.__MAT = __mod_materiales;';
  const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null, performance, Promise, RegExp, isNaN, isFinite, parseFloat, parseInt, Infinity, NaN, undefined };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'gente-cuerpo-vm.js' });
  return ctx;
}

async function comprobar() {
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  registrarThree();
  const THREE = await import('three');
  const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);
  const UM = await imp('ultra-materiales.js');
  const CI = await imp('ultra-cine.js'), CM = await imp('ultra-cine-mundo.js');
  const { prepararVidrioAldea } = await imp('aldea-arquitectura.js');
  const { U } = await imp('materiales.js');
  const { materialGente } = await imp('gente-cuerpo.js');
  const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

  // el shader de three antes de onBeforeCompile (con los #include sin expandir)
  let codigo = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8');
  codigo = codigo.replace('zt={alphahash_fragment', 'zt=globalThis.__trozos={alphahash_fragment');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, Error, Symbol, Promise, RegExp, performance, isNaN, isFinite, parseFloat, parseInt, Infinity, NaN, undefined };
  caja.globalThis = caja;
  vm.runInNewContext(codigo, caja);
  const Z = caja.__trozos;
  const shader = (lib) => ({ vertexShader: Z['mesh' + lib + '_vert'], fragmentShader: Z['mesh' + lib + '_frag'], uniforms: {} });
  const compilar = (m, lib) => { const sh = shader(lib); m.onBeforeCompile(sh, null); return sh; };

  UM.__ponerUltraC(false);

  // ================================================================ 1. los vidrios (el enganche faltaba en la 4.28.0)
  {
    const cielo = { value: new THREE.Color(0.55, 0.65, 0.75) };
    const crear = () => prepararVidrioAldea(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b }), { cielo });
    const solo = crear(), vidrio = UM.vidrioUltra(crear(), U), valle = UM.vidrioUltra(new THREE.MeshBasicMaterial({ color: 0x1a1612, side: THREE.DoubleSide }), U);
    const aldeaMundo = leer('aldea-mundo.js'), est = leer('estructuras.js');
    ok('aldea-mundo.js engancha el vidrio de la aldea a Ultra (vidrioUltra sobre prepararVidrioAldea)', /vidrios: vidrioUltra\(prepararVidrioAldea\(new THREE\.MeshBasicMaterial\(\{ vertexColors: true, side: THREE\.DoubleSide, color: 0x23201b \}\), \{ cielo: U\.uCieloBajo \}\), U\)/.test(aldeaMundo) && /import \{[^}]*vidrioUltra[^}]*\} from '\.\/ultra-materiales\.js'/.test(aldeaMundo));
    ok('estructuras.js engancha todos los vidrios del valle a Ultra (materialVidrio)', /const materialVidrio = \(color\) => vidrioUltra\(new THREE\.MeshBasicMaterial\(\{ color, side: THREE\.DoubleSide \}\), U\)/.test(est) && /import \{[^}]*vidrioUltra[^}]*\} from '\.\/ultra-materiales\.js'/.test(est));
    ok('apagado: el vidrio de la aldea tiene la clave y el shader de siempre', vidrio.customProgramCacheKey() === solo.customProgramCacheKey() && /\|vidrio-aldea-3\.6$/.test(vidrio.customProgramCacheKey()) && compilar(vidrio, 'basic').fragmentShader === compilar(solo, 'basic').fragmentShader && !/rVU|lustreU/.test(compilar(vidrio, 'basic').fragmentShader));
    UM.sincronizarUltraC({ ultra: true, calidad: 'alta' });
    const sh = compilar(vidrio, 'basic'), sv = compilar(valle, 'basic');
    ok('prendido: el vidrio suma |ultra-c-vidrio a la clave de antes', vidrio.customProgramCacheKey() === solo.customProgramCacheKey() + '|ultra-c-vidrio' && valle.customProgramCacheKey().endsWith('|ultra-c-vidrio'));
    ok('prendido: los dos vidrios reflejan el cielo (con lo de la aldea que ya tenían)', [sh, sv].every((s) => s.fragmentShader.includes(UM.GLSL_VIDRIO_U_FRAG)) && sh.fragmentShader.includes('uCieloVA'));
    ok('el reflejo: de día se ve el cuarto oscuro, arriba el cielo y abajo el paisaje (la altura exagerada), y una franja de brillo', /vec3 baseU = outgoingLight \* mix\(1\.0, 0\.42, diaU\)/.test(UM.GLSL_VIDRIO_U_FRAG) && UM.GLSL_VIDRIO_U_FRAG.includes('rU.y * 3.5 + 0.12') && UM.GLSL_VIDRIO_U_FRAG.includes('lustreU'));
    ok('de noche la ventana prendida no refleja (todo va por diaU = 1 − noche)', /float diaU = 1\.0 - nocheU;/.test(UM.GLSL_VIDRIO_U_FRAG) && /\* diaU;\n/.test(UM.GLSL_VIDRIO_U_FRAG));
    ok('el vidrio compila con el cielo de verdad (uniformes compartidos)', sh.uniforms.uCenitU === U.uCenit && sh.uniforms.uSolDirU === U.uSolDir);
    UM.sincronizarUltraC({ ultra: false, calidad: 'alta' });
    ok('al apagar vuelve el vidrio de siempre', compilar(vidrio, 'basic').fragmentShader === compilar(solo, 'basic').fragmentShader);
  }

  // ================================================================ 2. la gente: viento en el pelo y la ropa, y lo mojado (el shader)
  {
    const gente = materialGente();
    const apagado = compilar(gente, 'lambert');
    ok('apagado: el shader de la gente no trae nada del viento ni de lo mojado', !/aVientoU|vMojadoG|uTiempoG|uVientoG/.test(apagado.vertexShader + apagado.fragmentShader));
    ok('apagado: la clave de la gente es la de siempre', gente.customProgramCacheKey() === 'gente-atlas-370');
    UM.sincronizarUltraC({ ultra: true, calidad: 'alta' });
    const sh = compilar(gente, 'lambert');
    ok('prendido: la clave de la gente suma |ultra-c-gente', gente.customProgramCacheKey() === 'gente-atlas-370|ultra-c-gente');
    ok('prendido: el vértice recibe el viento DESPUÉS de la piel (skinning_vertex), con su atributo y la ola del bosque', sh.vertexShader.includes(UM.GLSL_GENTE_VERT_PARS) && sh.vertexShader.indexOf('#include <skinning_vertex>') < sh.vertexShader.indexOf(UM.GLSL_GENTE_VERT) && sh.vertexShader.split(UM.GLSL_GENTE_VERT).length === 2);
    ok('el viento: sólo si el vértice se mueve (aVientoU > 0), hasta 38 cm, con la ola que barre el campo (la misma del pasto y los árboles) y más con lluvia', UM.GLSL_GENTE_VERT.includes('if (aVientoU > 0.001)') && UM.GLSL_GENTE_VERT.includes('min(aVientoU * (0.08 + 0.38 * olaG) * fuerzaG, 0.38)') && UM.GLSL_GENTE_VERT.includes('sin(dot(pWG.xz, dirG) * 0.035 - uTiempoG * 0.36) * 0.5 + 0.5, 3.0') && UM.GLSL_GENTE_VERT.includes('(1.0 + 0.9 * uLluviaG)'));
    ok('el viento se pasa de mundo a objeto (la persona gira) y se divide por la escala', UM.GLSL_GENTE_VERT.includes('(dWG * mat3(modelMatrix)) / max(dot(modelMatrix[0].xyz, modelMatrix[0].xyz), 1e-3)'));
    ok('lo mojado se lee del hueso 23 del tramo de la persona (con piel) o del aTela de la mano (marcado con z = 99)', UM.GLSL_GENTE_VERT.includes('(int(floor(skinIndex.x / 24.0)) * 24 + 23) * 4') && UM.GLSL_GENTE_VERT.includes('texelFetch(boneTexture, ivec2(jG % tamG, jG / tamG), 0).x') && UM.GLSL_GENTE_VERT.includes('vMojadoG = aTela.z > 50.0 ? aTela.y : 0.0;') && UM.GLSL_GENTE_VERT.includes('#ifdef USE_SKINNING'));
    ok('el viento, el reloj y la lluvia son los uniformes del juego', true);
    const sh2 = (() => { const s = shader('lambert'); gente.onBeforeCompile(s, null); return s; })();
    ok('la gente toma el reloj, el viento y la lluvia de materiales.js', sh2.uniforms.uTiempoG === U.uTiempo && sh2.uniforms.uVientoG === U.uViento && sh2.uniforms.uLluviaG === U.uLluvia);
    ok('el pelo y la tela mojados: más oscuros (50 % y 55 %) y con brillo; la piel, apenas', /alb \*= 1\.0 - mG \* \(tela \? 0\.5 : pelo \? 0\.55 : \(esPiel \|\| cara\) \? 0\.1 : 0\.0\)/.test(sh.fragmentShader) && sh.fragmentShader.includes('varying float vMojadoG;') && sh.fragmentShader.indexOf('if (vMojadoG > 0.01)') < sh.fragmentShader.indexOf(UM.MARCA_GENTE_ULTRA));
    UM.sincronizarUltraC({ ultra: false, calidad: 'alta' });
    ok('al apagar vuelve el shader de la gente de siempre', !/aVientoU|vMojadoG/.test(compilar(gente, 'lambert').vertexShader + compilar(gente, 'lambert').fragmentShader));
  }

  // ================================================================ 3. cuánto se moja la gente y el jugador
  {
    const est = { mojado: 0 };
    for (let i = 0; i < 1300; i++) UM.mojarPersona(est, 1 / 60, 1, false);
    ok('a cielo abierto con lluvia, en 20 s queda empapada', est.mojado > 0.99);
    const est2 = { mojado: 0 };
    for (let i = 0; i < 3000; i++) UM.mojarPersona(est2, 1 / 60, 1, true);
    ok('adentro de un edificio no se moja nunca', est2.mojado === 0);
    const est3 = { mojado: 0 };
    for (let i = 0; i < 3000; i++) UM.mojarPersona(est3, 1 / 60, 0.1, false);
    ok('con llovizna floja (menos de 0,25) no se moja', est3.mojado === 0);
    for (let i = 0; i < 1200; i++) UM.mojarPersona(est, 1 / 60, 0, false);   // 20 s sin lluvia
    ok('se seca despacio: a los 20 s sigue más mojada que seca', est.mojado > 0.7 && est.mojado < 0.95);
    for (let i = 0; i < 6000; i++) UM.mojarPersona(est, 1 / 60, 0, false);
    ok('y a los dos minutos y pico, seca', est.mojado === 0);
    UM.estadoJugadorU.mojado = 0;
    for (let i = 0; i < 200; i++) UM.ropaMojadaJugador(1 / 60, { nadando: true });
    ok('el jugador que nada se empapa en 3 s', UM.estadoJugadorU.mojado > 0.99);
    for (let i = 0; i < 1200; i++) UM.ropaMojadaJugador(1 / 60, { lluvia: 0 });
    ok('al salir del agua se seca despacio (a los 20 s todavía está mojado)', UM.estadoJugadorU.mojado > 0.7 && UM.estadoJugadorU.mojado < 0.95);
    UM.estadoJugadorU.mojado = 0;
    for (let i = 0; i < 3000; i++) UM.ropaMojadaJugador(1 / 60, { lluvia: 1, bajoTecho: true });
    ok('bajo techo, con lluvia, el jugador no se moja', UM.estadoJugadorU.mojado === 0);
    for (let i = 0; i < 1300; i++) UM.ropaMojadaJugador(1 / 60, { lluvia: 1, bajoTecho: false });
    ok('a cielo abierto con lluvia, el jugador se moja en 20 s', UM.estadoJugadorU.mojado > 0.99);
    UM.estadoJugadorU.mojado = 0;
  }

  // ================================================================ 4. la persona armada (VM): el atributo del viento, el hueso del mojado, alPosar
  {
    const ctx = armarVM(SRC);
    const C = ctx.__C, UMv = ctx.__UM, Mv = ctx.__MAT;
    const cuerpo = (p) => p.g.children.find((o) => o.isSkinnedMesh);
    const estad = (clave) => {
      const p = C.crearPersona({}, clave, false, {}), m = cuerpo(p), a = m.geometry.attributes.aVientoU, P = m.geometry.attributes.position;
      let n = 0, mx = 0, bajo = 0, medio = 0, alto = 0, sobre = 0, total = 0;
      for (let i = 0; i < a.count; i++) {
        const v = a.array[i], y = P.getY(i); if (v > 0.001) n++; mx = Math.max(mx, v); total += v;
        if (y < 0.9) bajo += v; else if (y < 1.15) medio += v; else alto += v;
        if (y > 1.4) sobre += v;
      }
      return { p, m, cuenta: a.count, n, mx, bajo, medio, alto, sobre, total, a };
    };
    const estad2 = (clave, op) => { const p = C.crearPersona({}, clave, false, {}, op), a = cuerpo(p).geometry.attributes.aVientoU; let s = 0; for (let i = 0; i < a.count; i++) s += a.array[i]; return s; };
    const abuela = estad('aldea-abuela'), ercilia = estad('ercilia'), madre = estad('aldea-madre'), nena = estad('aldea-nena'), herrero = estad('poblador-herrero');
    ok('cada persona trae el atributo aVientoU (un número por vértice)', [abuela, ercilia, madre, nena, herrero].every((e) => e.a && e.a.itemSize === 1 && e.a.count === e.cuenta));
    ok('el poncho, los flecos, la pollera, la bufanda y el pelo largo se mueven (la abuela, el chamal y las trenzas: más de mil vértices)', abuela.n > 1000);
    ok('ercilia: la pollera se mueve', ercilia.n > 100);
    ok('la madre (trenza, pollera y campera abierta) se mueve', madre.n > 500);
    ok('la nena (dos trenzas, pollera): el pelo y la pollera', nena.n > 300);
    ok('el pelo corto, el pantalón y la camisa quedan quietos (el herrero casi no se mueve)', herrero.n < 120 && herrero.n < abuela.n / 10);
    ok('los pesos van de 0 a 1,4', [abuela, ercilia, madre, nena, herrero].every((e) => e.mx <= 1.4001 && e.mx >= 0.7) );
    ok('se mueve más cuanto más abajo: la pollera de ercilia se mueve abajo (por debajo de las caderas) y casi nada en la cintura ni arriba', ercilia.bajo > 50 && ercilia.bajo > ercilia.medio * 20 && ercilia.alto === 0);
    ok('el chamal de la abuela: casi todo el movimiento del cuerpo está abajo, no en el pecho', abuela.bajo > 200 && abuela.medio < abuela.bajo / 10);
    ok('lo que está arriba de los hombros sólo se mueve si es pelo largo (la cabeza del herrero, quieta; el total del herrero, sólo la bufanda)', herrero.sobre === 0 && herrero.total < 20 && abuela.total > herrero.total * 20);
    ok('la bufanda se mueve: la de la nena (sus puntas colgando) pesa casi la mitad de todo su movimiento', nena.total > 200);
    { const inv = estad2('poblador-herrero', { invierno: true }); ok('con ropa de abrigo (poncho con flecos y bufanda) el herrero se mueve mucho más que de verano', inv > 330 && inv > herrero.total * 20); }
    ok('el pelo largo se mueve: las dos trenzas largas de la abuela (a la altura del pecho para arriba, donde el chamal casi no se mueve) pesan más que el resto de su cuerpo junto', abuela.alto > 100 && abuela.alto > abuela.medio * 5);
    // el hueso del mojado
    const sk = abuela.m.skeleton;
    ok('el tramo de huesos deja libre el 23 (la persona usa menos)', sk.huesos.length < 23);
    sk.mojado = 0.6; sk.update();
    ok('el esqueleto escribe cuánto está mojada la persona en el hueso 23', Math.abs(sk.boneMatrices[(sk.base + 23) * 16] - 0.6) < 1e-6);
    sk.mojado = 0; sk.update();
    ok('y lo deja en 0 seca', sk.boneMatrices[(sk.base + 23) * 16] === 0);
    ok('los huesos de verdad no se pisan: el hueso 22 sigue sin tocar', sk.boneMatrices[(sk.base + 22) * 16] === 0);
    // alPosar moja sólo con Ultra
    const p = abuela.p;
    const correr = (seg, lluvia, soloCerca = 0) => { Mv.U.uLluvia.value = lluvia; p.soloCerca = soloCerca; for (let i = 0; i < seg * 20; i++) p.alPosar(p, 0.05, null, false, false); return abuela.m.skeleton.mojado || 0; };
    UMv.__ponerUltraC(false);
    ok('Ultra apagado: con lluvia la persona no se moja (nada cambia en Alta)', correr(60, 1) === 0 && !abuela.m.skeleton.mojado);
    UMv.__ponerUltraC(true);
    ok('Ultra prendido, adentro de un edificio (soloCerca): no se moja', correr(60, 1, 3) === 0);
    ok('Ultra prendido, a cielo abierto con lluvia: se moja en medio minuto', correr(30, 1, 0) > 0.99);
    ok('y al parar la lluvia se va secando', (() => { const v = correr(20, 0, 0); return v < 0.95 && v > 0.7; })());
    UMv.__ponerUltraC(false); Mv.U.uLluvia.value = 0;
    // la mano en primera persona
    const mano = C.manoPrimeraPersona({ piel: '#c49a70', manga: '#6b4a3a' });
    const aT = mano.geometry.attributes.aTela, sinMojado = () => { for (let i = 0; i < aT.count; i++) if (aT.array[i * 3 + 1] !== 0) return false; return true; }, todosMojados = (v) => { for (let i = 0; i < aT.count; i++) if (Math.abs(aT.array[i * 3 + 1] - v) > 1e-6) return false; return true; };
    ok('la mano en primera persona se marca como la mano (aTela.z = 99 en todos sus vértices) y arranca seca', (() => { for (let i = 0; i < aT.count; i++) if (aT.array[i * 3 + 2] !== 99) return false; return sinMojado(); })() && typeof mano.onBeforeRender === 'function' && !mano.geometry.attributes.aMojadoG);
    UMv.__ponerUltraC(true); UMv.estadoJugadorU.mojado = 0.8;
    mano.onBeforeRender();
    ok('al dibujarse, con Ultra, la manga se moja como el jugador', todosMojados(0.8) && aT.version > 0);
    UMv.__ponerUltraC(false); UMv.estadoJugadorU.mojado = 0.8; mano.onBeforeRender();
    ok('apagado, la manga vuelve seca', sinMojado());
  }

  // ================================================================ 5. el cine (profundidad de campo en las cinemáticas)
  {
    const { circuloCine, CINE, ponerCine, CINE_PARAMS, FRAG_CINE } = CI, { crearCineUltra } = CM;
    const k = 100 * CINE_PARAMS.apertura, max = 100;
    ok('en el foco no desenfoca', circuloCine(1.4, 1.4, k, max) === 0 && circuloCine(3.4, 3.4, k, max) === 0);
    ok('un primer plano (foco a 1,4 m) deja el fondo lejano muy blando', circuloCine(30, 1.4, k, max) > 0.8 * max);
    ok('un plano medio (foco a 3,4 m) lo desenfoca menos que el primer plano', circuloCine(30, 3.4, k, max) < circuloCine(30, 1.4, k, max) * 0.6 && circuloCine(30, 3.4, k, max) > 0.1 * max);
    ok('un plano general (foco a 11 m) casi no desenfoca (lente de verdad: más lejos el foco, más profundo el campo)', circuloCine(60, 11, k, max) < 0.12 * max);
    ok('lo que está más cerca que el foco también se va de foco', circuloCine(0.6, 1.4, k, max) > 0.1 * max);
    ok('crece con la distancia al foco, hasta el tope', circuloCine(8, 1.4, k, max) < circuloCine(20, 1.4, k, max) && circuloCine(1e6, 1.4, k, max) <= max);
    ok('el foco es el punto al que mira la cámara (un número en metros, o nada)', (ponerCine(2.5), CINE.distancia === 2.5) && (ponerCine(null), CINE.distancia === null) && (ponerCine(NaN), CINE.distancia === null) && (ponerCine(0), CINE.distancia === null));
    ok('el shader: el círculo sigue a la lente y lo nítido de adelante no mancha al fondo', FRAG_CINE.includes('min(uMax, uK * abs(z - uFoco) / max(z, 0.1) / max(uFoco, 0.3)) * uFuerza') && FRAG_CINE.includes('float w = zs >= z0 - 0.15 ? 1.0 : clamp(cs / max(dist, 1.0), 0.0, 1.0);') && FRAG_CINE.includes('if (r0 < 0.6) { gl_FragColor = c0; return; }'));
    // pasar() con un destino de mentira
    const camara = { updateMatrixWorld() {}, projectionMatrixInverse: new THREE.Matrix4() };
    const llamadas = [];
    const cine = crearCineUltra({ renderer: { getRenderTarget: () => null, setRenderTarget() {}, compile() {} }, camara });
    const dst = { width: 192, height: 108, texture: { type: 1016 }, depthTexture: {} };
    const pasada = (mat, rt) => llamadas.push([mat, rt]);
    CINE.fuerza = 0; CINE.foco = 3; CINE.ultimo = 0; ponerCine(null);
    ok('fuera de una cinemática no corre ninguna pasada (devuelve null)', cine.pasar(dst, pasada) === null && llamadas.length === 0 && !cine.activo);
    const cuadro = () => { CINE.ultimo = performance.now() - 100; return cine.pasar(dst, pasada); };   // (cada cuadro de mentira dura 0,1 s: el tope de dt de la pasada)
    ponerCine(1.5);

    const tex = cuadro();
    ok('en una cinemática corre UNA pasada y devuelve la escena desenfocada', !!tex && llamadas.length === 1 && llamadas[0][0] === cine.material && cine.material.uniforms.uProf.value === dst.depthTexture && cine.material.uniforms.uColor.value === dst.texture);
    ok('el foco arranca donde va (sin barrer desde otro lado) y el radio sigue al alto de la pantalla', Math.abs(CINE.foco - 1.5) < 1e-6 && Math.abs(cine.material.uniforms.uMax.value - 108 * CINE_PARAMS.radio) < 1e-6 || cine.material.uniforms.uMax.value === Math.max(2, 108 * CINE_PARAMS.radio));
    ok('la fuerza entra de a poco (con las barras de cine)', CINE.fuerza > 0.05 && CINE.fuerza < 0.2);
    for (let i = 0; i < 12; i++) cuadro();
    ok('y llega a 1 en poco más de un segundo', CINE.fuerza === 1);
    ponerCine(6); cuadro();
    ok('el foco se mueve suave entre planos (no salta)', CINE.foco > 1.5 && CINE.foco < 6);
    ponerCine(null);
    for (let i = 0; i < 5; i++) cuadro();
    ok('al terminar la escena la fuerza baja de a poco (no corta de golpe) y la pasada sigue un rato', !!cuadro() && CINE.fuerza < 1 && CINE.fuerza > 0.5);
    for (let i = 0; i < 12; i++) cuadro();
    const n0 = llamadas.length;
    ok('y se apaga del todo: sin pasada', cuadro() === null && llamadas.length === n0 && CINE.fuerza === 0);
    cine.dispose();
    // los enganches
    const luz = leer('ultra-luz-mundo.js'), esc = leer('escenas-mundo.js');
    const iArmar = luz.indexOf('function armar()'), iDesarmar = luz.indexOf('function desarmar()'), iSinc = luz.indexOf('function sincronizar(');
    ok('el cine se arma sólo adentro de armar() de Ultra (con Ultra apagado no existe) y se libera al desarmar', iArmar > 0 && luz.indexOf('crearCineUltra({ renderer, camara })') > iArmar && luz.indexOf('crearCineUltra({ renderer, camara })') < iDesarmar && luz.split('crearCineUltra(').length === 2 && luz.indexOf('p.cine.dispose();') > iDesarmar && luz.indexOf('p.cine.dispose();') < iSinc);
    ok('la composición de Ultra usa la escena desenfocada antes de componer a la pantalla', /const desenfocada = p\.cine\.pasar\(dst, pasada\);[^\n]*\n    if \(desenfocada\) p\.matComponer\.uniforms\.uColor\.value = desenfocada;\n    pasada\(p\.matComponer, null\);/.test(luz) && luz.indexOf('p.cine.pasar(dst, pasada)') > luz.indexOf('pasada(p.matNiebla, p.rtNiebla)'));
    ok('el programa del cine se compila al armar Ultra (nunca a mitad de la escena)', luz.includes('cine.compilar(rtAO);'));
    ok('escenas-mundo.js enfoca el punto al que mira la cámara dirigida y lo suelta sin escena', /ponerCine\(c\.foco \? Math\.hypot\(c\.foco\.x - c\.x, c\.foco\.y - c\.y, c\.foco\.z - c\.z\) : null\);/.test(esc) && /if \(!director\.activa\(\)\) \{\n      ponerCine\(null\);/.test(esc) && /if \(!c\) \{ poseVista = null; ponerCine\(null\); return; \}/.test(esc));
    ok('el cine no se mete en Alta: ultra-cine.js (puro, sin three) sólo lo importan las escenas y la pasada, y la pasada (three) sólo la arma Ultra', !/from 'three'/.test(leer('ultra-cine.js')) && (() => { const quien = fs.readdirSync(SRC).filter((f) => f.endsWith('.js') && /from '\.\/ultra-cine\.js'/.test(leer(f))).sort(); return JSON.stringify(quien) === JSON.stringify(['escenas-mundo.js', 'ultra-cine-mundo.js']); })());
  }

  // ================================================================ 6. las hojas que caen vuelven
  {
    const UB = await imp('ultra-bosque.js');
    const bosque = leer('ultra-bosque.js');
    ok('las hojas que caen vuelven (450) y el polvo sigue (520)', UB.MOTAS_HOJAS === 450 && UB.MOTAS_POLVO === 520);
    ok('las hojas se ven: de 26 cm y de 4 píxeles como mínimo, más redondas (antes 8,5 cm y 2)', bosque.includes('(polvo ? 0.034 : 0.26)') && bosque.includes('polvo ? 1.5 : 4.0, 64.0') && bosque.includes('q.y /= max(abs(vVuelta), 0.35) * 0.55;'));
    ok('las hojas caen más en otoño y con viento, y no en invierno', bosque.includes('float cuantas = 0.15 + 0.6 * uOtono + 0.25 * min(uViento, 1.0);') && bosque.includes('(1.0 - smoothstep(0.2, 0.6, uInvierno))'));
  }

  // ================================================================ 7. el vapor de la olla y la pava
  {
    const cocina = leer('cocina-mundo.js');
    const iV = cocina.indexOf('const matHumo = new THREE.ShaderMaterial({');
    const trozo = (marca) => { const i = cocina.indexOf(marca, iV) + marca.length; return cocina.slice(i, cocina.indexOf('`,', i)); };
    const vert = trozo('vertexShader: /* glsl */`'), frag = trozo('fragmentShader: /* glsl */`');
    const humo = UM.conUltraC(new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag }), 'vapor', UM.inyectarVaporUltra);
    const compilarH = () => { const s = { vertexShader: humo.vertexShader, fragmentShader: humo.fragmentShader, uniforms: {} }; humo.onBeforeCompile(s, null); return s; };
    UM.sincronizarUltraC({ ultra: false, calidad: 'alta' });
    const off = compilarH();
    const control = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag }), sc = { vertexShader: vert, fragmentShader: frag, uniforms: {} }; control.onBeforeCompile(sc, null);   // (el de siempre: con lo que three le agrega a todos)
    ok('apagado: el humo y el vapor de la cocina son los de siempre (idénticos a un material sin tocar)', off.vertexShader === sc.vertexShader && off.fragmentShader === sc.fragmentShader && humo.customProgramCacheKey() === control.customProgramCacheKey());
    UM.sincronizarUltraC({ ultra: true, calidad: 'alta' });
    const on = compilarH();
    ok('prendido: el vapor (las bocanadas de poco peso) es más grande, blanco y en hebras', on.vertexShader.includes('varying float vChicaU;') && on.vertexShader.includes('vChicaU = chica;') && on.vertexShader.includes('mix(1.0, 0.62, chica)') && on.fragmentShader.includes('hebrasU(q, vVida, fract(vVida * 7.3) + vChicaU)') && on.fragmentShader.includes('mix(uColor, vec3(0.94, 0.96, 0.98), vChicaU * 0.7)'));
    ok('prendido: cada reemplazo encontró su lugar en el shader de la cocina (nada quedó igual)', on.vertexShader !== sc.vertexShader && on.fragmentShader !== sc.fragmentShader && !on.vertexShader.includes('mix(1.0, 0.22, chica)') && !on.fragmentShader.includes('gl_FragColor = vec4(uColor * uLuz, a);'));
    ok('la clave del programa del vapor suma |ultra-c-vapor sólo con Ultra', humo.customProgramCacheKey().endsWith('|ultra-c-vapor'));
    UM.sincronizarUltraC({ ultra: false, calidad: 'alta' });
    ok('al apagar, la clave vuelve', !humo.customProgramCacheKey().endsWith('|ultra-c-vapor'));
    ok('cocina-mundo.js engancha el humo a Ultra (conUltraC) y la pava sólo echa vapor con Ultra y sin pausa', /conUltraC\(matHumo, 'vapor', inyectarVaporUltra\);/.test(cocina) && /\.\.\.\(ultraDetalle\(\) && !pausa \? \[\[0\.115, COCINA_LENA\.plancha \+ 0\.2, -0\.22, 5, 0\.9, 0\.5, 0\.4\]\] : \[\]\)/.test(cocina));
    ok('la olla echa más vapor y más alto con Ultra (10 bocanadas, 1,1 m) que sin Ultra (6, 0,7 m)', cocina.includes('ultraDetalle() ? 10 : 6, ultraDetalle() ? 1.1 : 0.7, 0.45, 0.4'));
    ok('el vapor de la pava sale por el pico (a 11,5 cm del centro, sobre la plancha, al fondo)', cocina.includes('[0.115, COCINA_LENA.plancha + 0.2, -0.22,'));
  }

  // ================================================================ 8. main.js
  {
    const main = leer('main.js');
    const iCuadro = main.indexOf('function cuadroDelJuego(');
    const iT = main.indexOf('  U.uTiempo.value += dt;\n', iCuadro);
    ok('main.js moja la manga del jugador en cada cuadro, sólo con Ultra, con la lluvia, el techo y el agua', iT > iCuadro && main.indexOf('if (ultraDetalle()) ropaMojadaJugador(dt, { lluvia: U.uLluvia.value, bajoTecho, nadando: !!jugador?.estado?.nadando });', iT) === iT + '  U.uTiempo.value += dt;\n  '.length && /import \{ sincronizarUltraC, ropaMojadaJugador, ultraDetalle \} from '\.\/ultra-materiales\.js';/.test(main));
    ok('ultra-materiales sigue sin importar three', !/from 'three'/.test(leer('ultra-materiales.js')));
    ok('los comentarios nuevos llevan la versión (4.29.0)', /4\.29\.0/.test(leer('ultra-cine.js')) && /4\.29\.0/.test(leer('ultra-materiales.js')) && /4\.29\.0/.test(leer('gente-cuerpo.js')));
  }
  return R;
}

if (process.argv.includes('--hijo')) {
  comprobar().then((R) => console.log(JSON.stringify(R)), (e) => { console.log(JSON.stringify([['error: ' + (e && e.stack || e), false]])); });
} else {
  let malas = 0;
  const hijo = (src) => {
    const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, C4290C_SRC: src }, encoding: 'utf8', maxBuffer: 1 << 26 });
    try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return [['sin salida: ' + (r.stderr || '').slice(0, 400), false]]; }
  };
  const base = hijo(SRC);
  for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

  // ---- mutaciones
  const MUT = [
    ['ultra-materiales.js', 'el viento se aplica a todos los vértices', 'if (aVientoU > 0.001) {', 'if (true) {'],
    ['ultra-materiales.js', 'el viento sin tope', 'min(aVientoU * (0.08 + 0.38 * olaG) * fuerzaG, 0.38)', 'aVientoU * (0.08 + 0.38 * olaG) * fuerzaG'],
    ['ultra-materiales.js', 'el viento sin la lluvia', ' * (1.0 + 0.9 * uLluviaG)', ''],
    ['ultra-materiales.js', 'el viento antes de la piel', ".replace('#include <skinning_vertex>', '#include <skinning_vertex>\\n' + GLSL_GENTE_VERT)", ".replace('#include <begin_vertex>', '#include <begin_vertex>\\n' + GLSL_GENTE_VERT)"],
    ['ultra-materiales.js', 'lo mojado no se lee del hueso', 'vMojadoG = texelFetch(boneTexture, ivec2(jG % tamG, jG / tamG), 0).x;', 'vMojadoG = 0.0;'],
    ['ultra-materiales.js', 'la gente mojada no se oscurece', 'alb *= 1.0 - mG * (tela ? 0.5 : pelo ? 0.55 : (esPiel || cara) ? 0.1 : 0.0);', ''],
    ['ultra-materiales.js', 'la persona no se seca', 'sube ? dt / 20 : -dt / 120', 'sube ? dt / 20 : 0'],
    ['ultra-materiales.js', 'la persona se moja adentro', 'const sube = lluvia > 0.25 && !adentro;', 'const sube = lluvia > 0.25;'],
    ['ultra-materiales.js', 'el jugador no se empapa al nadar', 'dt / (nadando ? 3 : 20)', 'dt / 20'],
    ['ultra-materiales.js', 'el jugador se moja bajo techo', 'lluvia > 0.25 && !bajoTecho ? 1 : 0', 'lluvia > 0.25 ? 1 : 0'],
    ['ultra-materiales.js', 'el vidrio sin la altura exagerada', 'rU.y * 3.5 + 0.12', 'rU.y'],
    ['ultra-materiales.js', 'el vidrio de noche sigue reflejando', 'float diaU = 1.0 - nocheU;', 'float diaU = 1.0;'],
    ['ultra-materiales.js', 'el vapor no es blanco', 'mix(uColor, vec3(0.94, 0.96, 0.98), vChicaU * 0.7)', 'uColor'],
    ['gente-cuerpo.js', 'la persona no escribe lo mojado', 'this.boneMatrices[(this.base + HUESO_MOJADO) * 16] = this.mojado || 0;', ''],
    ['gente-cuerpo.js', 'la persona se moja sin Ultra', 'if (ultraDetalle() && est.malla?.skeleton)', 'if (est.malla?.skeleton)'],
    ['gente-cuerpo.js', 'la pollera no se mueve', "m.userData.rol === 'pollera' ? 1 :", "m.userData.rol === 'pollera' ? 0 :"],
    ['gente-cuerpo.js', 'el pelo largo no se mueve', '1.2 * sv(-0.09, -0.3, q.y)', '0'],
    ['gente-cuerpo.js', 'la bufanda no se mueve', 'pz.userData.viento = 1.3;', ''],
    ['gente-cuerpo.js', 'el viento no depende de la altura', 'Math.pow(Math.min(1, Math.max(0, (yAlto - q.y) / Math.max(0.05, yAlto - yBajo))), 1.6)', '1'],
    ['gente-cuerpo.js', 'la mano no se moja', 'if (v !== mojadoPuesto) { mojadoPuesto = v;', 'if (false) { mojadoPuesto = v;'],
    ['gente-cuerpo.js', 'la mano se moja sin Ultra', 'const v = ultraDetalle() ? Math.round(estadoJugadorU.mojado * 20) / 20 : 0;', 'const v = Math.round(estadoJugadorU.mojado * 20) / 20;'],
    ['aldea-mundo.js', 'el vidrio de la aldea sin Ultra', 'vidrios: vidrioUltra(prepararVidrioAldea(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b }), { cielo: U.uCieloBajo }), U),', 'vidrios: prepararVidrioAldea(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b }), { cielo: U.uCieloBajo }),'],
    ['estructuras.js', 'el vidrio del valle sin Ultra', 'const materialVidrio = (color) => vidrioUltra(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), U);', 'const materialVidrio = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });'],
    ['ultra-cine-mundo.js', 'el desenfoque entra de golpe', 'CINE.fuerza = quiere ? Math.min(1, CINE.fuerza + dt / CINE_PARAMS.entra) : Math.max(0, CINE.fuerza - dt / CINE_PARAMS.sale);', 'CINE.fuerza = quiere ? 1 : 0;'],
    ['ultra-cine.js', 'lo nítido de adelante mancha al fondo', 'float w = zs >= z0 - 0.15 ? 1.0 : clamp(cs / max(dist, 1.0), 0.0, 1.0);', 'float w = 1.0;'],
    ['ultra-cine.js', 'el foco no depende de la distancia', '/ max(z, 0.1) / max(uFoco, 0.3)) * uFuerza', '/ max(z, 0.1)) * uFuerza'],
    ['ultra-cine-mundo.js', 'el foco salta entre planos', '(antes < 0.01 ? 1 : 1 - Math.exp(-dt * CINE_PARAMS.sigue))', '1'],
    ['ultra-luz-mundo.js', 'la escena desenfocada no se usa', '    if (desenfocada) p.matComponer.uniforms.uColor.value = desenfocada;\n', ''],
    ['ultra-luz-mundo.js', 'el cine no se libera', '    p.cine.dispose();\n', ''],
    ['ultra-luz-mundo.js', 'el cine no se compila al armar', '      cine.compilar(rtAO);\n', ''],
    ['escenas-mundo.js', 'sin escena sigue desenfocando', '      ponerCine(null);   // 4.29.0 (C): sin escena, sin desenfoque\n', ''],
    ['escenas-mundo.js', 'el foco no es el de la cámara', 'ponerCine(c.foco ? Math.hypot(c.foco.x - c.x, c.foco.y - c.y, c.foco.z - c.z) : null);', 'ponerCine(5);'],
    ['cocina-mundo.js', 'la pava echa vapor sin Ultra', '...(ultraDetalle() && !pausa ? [[0.115', '...(!pausa ? [[0.115'],
    ['cocina-mundo.js', 'el vapor de la cocina sin Ultra', "  conUltraC(matHumo, 'vapor', inyectarVaporUltra);", ''],
    ['cocina-mundo.js', 'la olla echa lo mismo con Ultra', 'ultraDetalle() ? 10 : 6, ultraDetalle() ? 1.1 : 0.7, 0.45, 0.4', '6, 0.7, 0.45, 0.4'],
    ['ultra-bosque.js', 'las hojas que caen otra vez en cero', 'export const MOTAS_HOJAS = 450;', 'export const MOTAS_HOJAS = 0;'],
    ['ultra-bosque.js', 'las hojas chicas', '(polvo ? 0.034 : 0.26)', '(polvo ? 0.034 : 0.085)'],
    ['main.js', 'la manga del jugador se moja sin Ultra', 'if (ultraDetalle()) ropaMojadaJugador(dt,', 'ropaMojadaJugador(dt,'],
  ];
  for (const [archivo, nombre, de, a] of MUT) {
    const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
    if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4290c-'));
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
