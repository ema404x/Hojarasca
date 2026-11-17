// 4.29.2 (B): lo que quedó afuera de Ultra: el fuego de los hornos y las fraguas de la aldea, las huellas en el ripio y las lajas, y los
// vecinos mojados al salir del agua (que no se hace: ninguno pisa agua). Con el código de verdad (three del juego):
//   1. aldea-arquitectura.js anota dónde arde cada fuego (los hornos de barro de la panadería y la cerámica, la fragua de la herrería y la del
//      taller del tren), sólo en la obra terminada; aldea-mundo.js los pasa al mundo y los da sólo cerca (`fuegosUltra`);
//   2. ultra-vida.js: con Ultra apagado no pide nada a la aldea; prendido, cada fuego de la aldea arde con sus tres lenguas y sus chispas, la luz de
//      la fragua titila como un fuego (no como una vela), y nunca pasa del tope de llamas; al apagarlo, nada;
//   3. ultra-materiales.js: las huellas finas en el ripio (la piedra corrida) y en las lajas (polvo; con el suelo mojado, la suela moja la piedra),
//      sólo en los programas de Ultra; los de Alta no cambian (ni una letra);
//   4. vecinos mojados: la gente no pisa el agua (gente.js frena el paso, la del campo no se para en el agua, la aldea no tiene agua): anotado;
//   5. main.js le pasa la aldea a Ultra de la vida chica.
// Mutaciones: copias de ultra-vida.js, ultra-materiales.js y aldea-arquitectura.js con un cambio cada una, un proceso por copia (ESM en caché).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8').replace(/\r\n/g, '\n');
registrarThree();

async function comprobar(archVida, archMat, archArq) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const THREE = await import('three');
  const { U } = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
  const V = await import(pathToFileURL(archVida).href);
  const M = await import(pathToFileURL(archMat).href);
  const A = await import(pathToFileURL(archArq).href);

  // ------------------------------------------------ 1: dónde arde el fuego (la arquitectura)
  {
    const f = (id, e = 4) => A.armarEdificio(id, e).extra.fuegos;
    const pan = f('panaderia'), cer = f('ceramica'), her = f('herreria'), tal = A.armarTallerTren().extra.fuegos;
    falla(pan?.length === 1 && pan[0].tipo === 'horno' && !pan[0].adentro && pan[0].ly > 0.6 && pan[0].ly < 1, 'la panadería: el horno de barro, afuera, a la altura de la boca');
    falla(cer?.length === 1 && cer[0].tipo === 'horno', 'la cerámica: su horno de barro');
    falla(her?.length === 1 && her[0].tipo === 'fragua' && her[0].adentro && her[0].alto > pan[0].alto, 'la herrería: la fragua, adentro, más alta que el fuego del horno');
    falla(tal?.length === 1 && tal[0].tipo === 'fragua' && tal[0].adentro, 'el taller del tren: la fragua chica');
    falla(!f('herreria', 2) && !f('panaderia', 2) && !f('escuela'), 'sin fuego en la obra a medio hacer ni donde no hay horno ni fragua');
  }

  // ------------------------------------------------ 2: las llamas de Ultra en la aldea
  {
    const escena = new THREE.Scene();
    const presupuesto = { temblor: null };
    escena.userData.presupuestoLuces = presupuesto;
    const clima = { fogatas: [], estado: { lluvia: 0 }, ponerUltraB() {} };
    const T = { altura: () => 0, agua: () => false, val: () => 0.3, bosque: [], estepa: null, pasto: [], distSendero: [] };
    const luzFragua = new THREE.PointLight(0xff6a20, 1.6);
    let pedidos = 0, cuantos = 2;
    const aldea = {
      fuegosUltra(cam, radio, out) {
        pedidos++; out.length = 0;
        const base = [{ x: 3, y: 1.2, z: 1, alto: 0.5, ancho: 0.44, tipo: 'fragua', luz: luzFragua, clave: 'herreria' }, { x: -4, y: 0.8, z: 2, alto: 0.27, ancho: 0.3, tipo: 'horno', luz: null, clave: 'panaderia' }];
        for (let i = 0; i < cuantos; i++) out.push({ ...base[i % 2], x: base[i % 2].x + i * 0.5 });
        return out;
      },
    };
    const js = { pos: new THREE.Vector3(0, 0, 0), yaw: 0, enSuelo: true };
    const ctx = { cam: new THREE.Vector3(0, 1.7, 0), js, gente: { gente: [] }, veg: { matasCerca: () => [] }, obras: { obras: [] }, horas: 21, noche: 0.9, dia: 0.1, fauna: [], huellas: null, techos: null, aldea };
    const uv = V.crearUltraVida({ escena, clima, T });
    for (let i = 0; i < 20; i++) { uv.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 1 / 30, ctx); uv.revisarAjustes({ ultra: true, calidad: 'media' }, 'media', 1 / 30, ctx); }
    falla(!uv.activo && pedidos === 0 && escena.children.length === 0 && presupuesto.temblor === null, 'apagado: no le pide nada a la aldea ni arma nada');
    for (let i = 0; i < 45; i++) { U.uTiempo.value += 1 / 30; uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx); }
    falla(uv.activo && pedidos > 0 && uv.info.fuegosAldea === 2 && uv.info.fuegos === 2 && uv.llamas.malla.count === 6, 'prendido: la fragua y el horno arden, tres lenguas cada uno');
    const fr = uv.fuegos.find((x) => x.x === 3), ho = uv.fuegos.find((x) => x.x !== 3);
    falla(fr && ho && fr.chispas > ho.chispas * 2 && fr.sube > ho.sube && ho.brillo < fr.brillo && Math.abs(fr.y - 1.2) < 1e-6, 'la fragua avivada echa más chispas y más alto; el horno, lenguas bajas y pocas chispas');
    falla(uv.info.chispas > 2, 'las chispas suben');
    // la luz de la fragua titila como un fuego (de 0,6 a 1,35, se corre) y no como una vela (± 7 %)
    {
      const vals = []; let corre = 0;
      const t0 = U.uTiempo.value;
      for (let i = 0; i < 60; i++) { U.uTiempo.value = t0 + i * 0.05; const fija = new THREE.PointLight(); fija.intensity = 2; fija.matrixWorld.identity(); presupuesto.temblor(fija, luzFragua); vals.push(fija.intensity); corre = Math.max(corre, Math.hypot(fija.matrixWorld.elements[12], fija.matrixWorld.elements[14])); }
      U.uTiempo.value = t0;
      falla(Math.max(...vals) - Math.min(...vals) > 0.35 && corre > 0.005, 'la luz de la fragua titila como un fuego y se corre');
    }
    // nunca más llamas que el tope
    cuantos = 30;
    for (let i = 0; i < 3; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    falla(uv.info.fuegos === V.MAX_LLAMAS && uv.llamas.malla.count === V.MAX_LLAMAS * 3, 'con muchos fuegos cerca, no pasa del tope de llamas');
    cuantos = 0;
    for (let i = 0; i < 3; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    falla(uv.info.fuegos === 0 && uv.llamas.malla.count === 0, 'lejos de los hornos, ninguna llama');
    const p0 = pedidos;
    uv.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    uv.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    falla(!uv.activo && pedidos === p0 && escena.children.length === 0 && presupuesto.temblor === null, 'al apagar: nada en la escena, la aldea no se consulta más');
    const fa = V.fuegoAldea({ x: 0, y: 1, z: 0, alto: 0.3, ancho: 0.3, tipo: 'horno' }, 1), ff = V.fuegoAldea({ x: 0, y: 1, z: 0, alto: 0.5, ancho: 0.4, tipo: 'fragua' }, 1);
    falla(fa.alto === 0.3 && ff.alto === 0.5 && ff.chispas > fa.chispas, 'fuegoAldea: la medida de la arquitectura, más chispas en la fragua');
  }

  // ------------------------------------------------ 3: las huellas en el ripio y en las lajas
  {
    M.conocerCieloUltraC(U);
    // el ripio: el texto de verdad de aldea-mundo.js armado como lo arma materialRipio
    const am = leer('src/aldea-mundo.js');
    const tramo = (n) => { const pre = `const ${n} = /* glsl */\``, i = am.indexOf(pre); const j = am.indexOf('`;', i); return i > 0 ? am.slice(i + pre.length, j) : ''; };
    const pars = tramo('GLSL_RIPIO_PARS'), color = tramo('GLSL_RIPIO_COLOR');
    const base = { uniforms: {}, vertexShader: '', fragmentShader: '#include <common>\nvoid main() {\n#include <color_fragment>\n#include <opaque_fragment>\n}' };
    base.fragmentShader = base.fragmentShader.replace('#include <common>', '#include <common>\n' + pars).replace('#include <color_fragment>', '#include <color_fragment>\n' + color);
    const alta = base.fragmentShader;
    const sh = { uniforms: {}, vertexShader: '', fragmentShader: alta };
    M.inyectarRipioUltra(sh);
    const f = sh.fragmentShader;
    const iH = f.indexOf(M.GLSL_HUELLAS_RIPIO_U), iDecl = f.indexOf('float huella = smoothstep'), iPasto = f.indexOf(M.MARCA_HUELLAS_RIPIO), iNieve = f.indexOf('float nieve = uInviernoR * (1.0 - 0.6 * huella)');
    falla(color.includes(M.MARCA_HUELLAS_RIPIO) && iH > iDecl && iDecl > 0 && iPasto > iH && iNieve > iPasto, 'el ripio de Ultra: la pisada después de lo apisonado y antes del pasto y de la nieve (que la toma como barro)');
    falla(f.includes(M.GLSL_HUELLAS_U_PARS) && sh.uniforms.uHuellasU === U.uHuellas && sh.uniforms.uHuellasCentroU === U.uHuellasCentro && sh.uniforms.uHuellasLadoU === U.uHuellasLado, 'el ripio de Ultra lee la textura de huellas (la de ultra-vida.js con Ultra)');
    falla(!alta.includes('huellaU') && !am.includes('uHuellasU'), 'el ripio de Alta no cambia');
    // las lajas: probadas en el juego y no se veían claro: quedaron afuera; el material de la aldea de Ultra no lee las huellas
    const shA = { uniforms: {}, vertexShader: '', fragmentShader: ['#include <common>', 'void main() {', M.MARCA_ALDEA_ULTRA, '#include <normal_fragment_maps>', '#include <lights_fragment_end>', '#include <opaque_fragment>', '}'].join('\n') };
    M.inyectarAldeaUltra(shA);
    falla(!shA.fragmentShader.includes('huellaU') && !shA.uniforms.uHuellasU, 'las lajas (el material de la aldea) sin huellas: no se veían');
  }
  return { mal };
}

// ================================================================ modo hijo
if (process.argv[2] === '--hijo') {
  const { mal } = await comprobar(process.argv[3], process.argv[4], process.argv[5]);
  console.log('HIJO ' + JSON.stringify(mal));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const correr = (v, m, a) => {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', v, m, a], { encoding: 'utf8', timeout: 180000 });
  const l = (r.stdout || '').split('\n').find((x) => x.startsWith('HIJO '));
  return l ? JSON.parse(l.slice(5)) : ['sin respuesta: ' + (r.stderr || '').slice(0, 600)];
};
const archV = path.join(src, 'ultra-vida.js'), archM = path.join(src, 'ultra-materiales.js'), archA = path.join(src, 'aldea-arquitectura.js');
{
  const mal = correr(archV, archM, archA);
  if (mal.length) for (const t of mal) { total++; fallas++; console.log('✗ ' + t); }
  else { total += 17; console.log('✓ ultra-vida.js, ultra-materiales.js y aldea-arquitectura.js de verdad: los fuegos de la aldea (dónde, prendido, apagado, la luz, el tope) y las huellas en el ripio (sólo Ultra; en las lajas no)'); }
}

// ---------------------------------------------------------------- aldea-mundo.js, main.js, la gente y el agua
{
  const am = leer('src/aldea-mundo.js');
  ok(am.includes("b.fuegos = d.etapa >= 3 && d.extra?.fuegos ? d.extra.fuegos.map((f) => ({ ...aMundoEn(s, f.lx, f.lz), y: s.y + f.ly,")
    && am.includes('if (f.adentro && !todos && !b.interior?.visible) continue;') && am.includes("luz: f.tipo === 'fragua' && b.luz?.clase === 'fragua' ? b.luz.luz : null"),
    'aldea-mundo.js: los fuegos al mundo con la obra terminada; los de adentro sólo si se ve el interior; la luz de la fragua con el suyo');
  const aa = leer('src/aldea-arquitectura.js');
  ok(/torreta: K\.extra\.torreta \?\? null, fuegos: K\.extra\.fuegos \?\? null \}/.test(aa), 'aldea-arquitectura.js: los fuegos van en `extra` (los datos del Worker)');
  const main = leer('src/main.js');
  ok(/u\.techos = ctxClima\.techos \|\| null; u\.huellas = huellas; u\.fauna = rastrosFauna; u\.bajoTecho = bajoTecho; u\.aldea = aldeaMundo;/.test(main), 'main.js: Ultra de la vida chica recibe la aldea');
  const uvt = leer('src/ultra-vida.js');
  ok(/revisar\(esUltra\(ajustes\) && calidadActiva === 'alta', dt, ctx\)/.test(uvt) && (uvt.match(/new THREE\.ShaderMaterial\(/g) || []).length === 3, 'ultra-vida.js sigue detrás de esUltra y sin programas nuevos (las llamas de la aldea son las de los fogones)');
  // 4: los vecinos no pisan el agua (por eso no se mojan «al salir del agua»)
  const g = leer('src/gente.js'), gc = leer('src/gente-campo-mundo.js');
  ok(g.includes('if (!T.agua(nx, nz)) { g.pos.x = nx; g.pos.z = nz;') && g.includes('if (T.agua(x, z) || T.altura(x, z) < 0.4) continue;') && gc.includes('if (T.agua?.(x, z)) return false;'),
    'la gente no pisa el agua: el paso se frena antes del agua, nadie nace en el agua, la del campo no se para ahí (vecinos mojados: anotado, no se fuerza)');
}

// ---------------------------------------------------------------- mutaciones
const mutaciones = [
  ['v', 'sin los fuegos de la aldea', '    aldeaFuegos(ctx);\n', '\n'],
  ['v', 'la fragua titila como una vela', '      if (a.luz && !lucesFuego.has(a.luz)) lucesFuego.set(a.luz, semilla * 3.7);\n', '\n'],
  ['v', 'los fuegos de la aldea pasan del tope', 'for (let i = 0; i < lista.length && fuegos.length < MAX_LLAMAS; i++) {', 'for (let i = 0; i < lista.length; i++) {'],
  ['v', 'el horno echa chispas como la fragua', "chispas: horno ? 1.5 : 6, sube: horno ? 0.7 : 1.4", 'chispas: 6, sube: 1.4'],
  ['v', 'la aldea consultada con Ultra apagado', '    if (!activo || !ctx.cam) return;\n', '    if (!activo || !ctx.cam) { ctx.aldea?.fuegosUltra?.(ctx.cam, 32, []); return; }\n'],
  ['m', 'el ripio sin huellas', '    .replace(MARCA_HUELLAS_RIPIO, GLSL_HUELLAS_RIPIO_U + MARCA_HUELLAS_RIPIO)\n', '\n'],
  ['m', 'las huellas en las lajas (que no se veían)', 'export function inyectarAldeaUltra(sh) {\n  uniformesCielo(sh);\n', 'export function inyectarAldeaUltra(sh) {\n  uniformesCielo(sh); uniformesHuellas(sh);\n'],
  ['m', 'las huellas sin su textura', '  Object.assign(sh.uniforms, { uHuellasU: U.uHuellas, uHuellasCentroU: U.uHuellasCentro, uHuellasLadoU: U.uHuellasLado });\n', '\n'],
  ['m', 'la marca del ripio no está en el ripio', "export const MARCA_HUELLAS_RIPIO = '    // el pasto ralo: matas entre las piedras';", "export const MARCA_HUELLAS_RIPIO = '    // las matas del pasto';"],
  ['a', 'sin el fuego del horno', "  (K.extra.fuegos ??= []).push({ lx: fu[0], ly: fu[1], lz: fu[2], alto: 0.27, ancho: 0.3, tipo: 'horno' });\n", '\n'],
  ['a', 'los fuegos no salen del Worker', 'torreta: K.extra.torreta ?? null, fuegos: K.extra.fuegos ?? null }', 'torreta: K.extra.torreta ?? null }'],
  ['a', 'la fragua afuera', "alto: 0.5, ancho: 0.44, tipo: 'fragua', adentro: true }", "alto: 0.5, ancho: 0.44, tipo: 'fragua' }"],
];
const vivas = [];
let k = 0;
for (const [donde, que, de, a] of mutaciones) {
  k++;
  const base = donde === 'v' ? archV : donde === 'm' ? archM : archA;
  const texto = fs.readFileSync(base, 'utf8');
  if (!texto.includes(de)) { ok(false, `mutación «${que}»: no encontré el texto a cambiar`); continue; }
  const copia = path.join(src, `__mut-4292b-${process.pid}-${k}-${path.basename(base)}`);
  try {
    fs.writeFileSync(copia, texto.split(de).join(a));
    const mal = correr(donde === 'v' ? copia : archV, donde === 'm' ? copia : archM, donde === 'a' ? copia : archA);
    total++;
    if (!mal.length) { fallas++; vivas.push(que); }
  } finally { fs.rmSync(copia, { force: true }); }
}
if (vivas.length) console.log('✗ mutaciones que no fallaron: ' + vivas.join(' · ')); else console.log(`✓ las ${mutaciones.length} mutaciones fallan (un proceso por copia)`);

console.log(fallas ? `FALLA verificar-4-29-2-b: ${fallas} de ${total}` : `OK verificar-4-29-2-b: ${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
