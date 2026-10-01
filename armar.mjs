// Empaquetador offline de Hojarasca.
// No requiere esbuild ni descargar Three.js: usa three-r186-inline.js y resuelve
// los módulos ES locales de src/ en un único script autocontenido.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(raiz, 'src');
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
const entrada = path.join(src, 'main.js');

const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);

function analizar(archivo) {
  const texto = fs.readFileSync(archivo, 'utf8');
  const deps = [];
  const re = /^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm;
  let m;
  while ((m = re.exec(texto))) {
    if (m[2] === 'three') continue;
    if (!m[2].startsWith('.')) throw new Error(`Import externo no soportado en ${path.relative(raiz, archivo)}: ${m[2]}`);
    deps.push(normalizar(archivo, m[2]));
  }
  return { texto, deps };
}

const info = new Map();
const orden = [];
const visitando = new Set();
const visitado = new Set();
function visitar(archivo) {
  archivo = path.resolve(archivo);
  if (visitado.has(archivo)) return;
  if (visitando.has(archivo)) throw new Error(`Ciclo de módulos detectado en ${path.relative(raiz, archivo)}`);
  visitando.add(archivo);
  const a = analizar(archivo); info.set(archivo, a);
  for (const d of a.deps) visitar(d);
  visitando.delete(archivo); visitado.add(archivo); orden.push(archivo);
}
visitar(entrada);

function transformar(archivo, texto) {
  const exportados = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) exportados.push(m[1]);
  for (const m of texto.matchAll(/^export\s*\{([^}]+)\}\s*;?\s*$/gm)) {
    for (const parte of m[1].split(',')) {
      const [local, remoto] = parte.trim().split(/\s+as\s+/);
      if (local) exportados.push((remoto || local).trim());
    }
  }

  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_todo, nombres, spec) => {
    const dep = normalizar(archivo, spec);
    const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
      const [origen, local] = x.split(/\s+as\s+/);
      return local ? `${origen.trim()}: ${local.trim()}` : origen.trim();
    });
    return `const { ${partes.join(', ')} } = ${idModulo(dep)};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  texto = texto.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');

  const nombre = path.basename(archivo);
  const retorno = [...new Set(exportados)].join(', ');
  return `// ===== ${nombre} =====\nconst ${idModulo(archivo)} = (() => {\n${texto}\nreturn { ${retorno} };\n})();\n`;
}

let juego = '';
for (const archivo of orden) juego += transformar(archivo, info.get(archivo).texto) + '\n';

let three = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8');
if (!/const THREE\s*=\s*\(\(\)\s*=>/.test(three)) throw new Error('three-r186-inline.js no parece un runtime válido');
// 3.2: menos tirones al caminar. Three mete la cantidad de luces del cuadro en la clave del
// programa de TODOS los materiales, también de los que no usan luces (MeshBasicMaterial, los de
// profundidad de las sombras, los ShaderMaterial sin `lights`). Cada vez que un objeto aparecía
// con otra cantidad de luces a la vista, esos programas se compilaban de nuevo en medio del
// dibujo: 91 de las 102 compilaciones de un recorrido por el valle. Para esos materiales las
// cantidades valen 0: su shader no las lee (sólo cambiaban unos #define sin uso), así que la
// imagen es la misma y cada uno se compila una sola vez. Los materiales con luces no cambian.
{
  const cabeza = 'function b(p,P,F,H,W,V){let N=H.fog,';
  const luces = 'numSunLights:P.sun.length,numDirLights:P.directional.length,numPointLights:P.point.length,numSpotLights:P.spot.length,numSpotLightMaps:P.spotLightMap.length,numRectAreaLights:P.rectArea.length,numHemiLights:P.hemi.length,numSunLightShadows:P.sunShadowMap.length,numDirLightShadows:P.directionalShadowMap.length,numPointLightShadows:P.pointShadowMap.length,numSpotLightShadows:P.spotShadowMap.length,numSpotLightShadowsWithMaps:P.numSpotLightShadowsWithMaps,numLightProbes:P.numLightProbes,';
  if (three.split(cabeza).length !== 2 || three.split(luces).length !== 2) throw new Error('three-r186-inline.js: no encontré getParameters para las luces (3.2)');
  // la misma lista que usa three para decidir si un material necesita luces (materialNeedsLights)
  const usaLuces = 'p.isMeshLambertMaterial||p.isMeshToonMaterial||p.isMeshPhongMaterial||p.isMeshStandardMaterial||p.isShadowMaterial||p.isShaderMaterial&&p.lights===!0';
  three = three.replace(cabeza, `function b(p,P,F,H,W,V){let __usaLuces=${usaLuces},N=H.fog,`)
    .replace(luces, luces.replace(/:(P\.[A-Za-z.]+),/g, ':__usaLuces?$1:0,'));
}
if (juego.includes("from 'three'") || juego.includes('from "three"')) throw new Error('Quedó un import de Three sin resolver');
if (/^import\s/m.test(juego) || /^export\s/m.test(juego)) throw new Error('Quedaron imports/exports sin empaquetar');

const b64 = (f) => fs.readFileSync(path.join(src, 'fuentes', f)).toString('base64');
const fuente = (familia, peso, estilo, f) => `@font-face { font-family: '${familia}'; font-weight: ${peso}; font-style: ${estilo}; font-display: swap; src: url(data:font/woff2;base64,${b64(f)}) format('woff2'); }`;
const fuentes = [
  fuente('Spectral', 400, 'normal', 'spectral-latin-400-normal.woff2'),
  fuente('Spectral', 600, 'normal', 'spectral-latin-600-normal.woff2'),
  fuente('Spectral', 400, 'italic', 'spectral-latin-400-italic.woff2'),
  fuente('Caveat', 500, 'normal', 'caveat-latin-500-normal.woff2'),
  fuente('Caveat', 700, 'normal', 'caveat-latin-700-normal.woff2'),
].join('\n');

let html = fs.readFileSync(path.join(src, 'plantilla.html'), 'utf8').split('__HOJARASCA_VERSION__').join(pkg.version);
const js = `${three}\n\n${juego}`.replace(/<\/script/gi, '<\\/script');
html = html
  .replace('/*FUENTES*/', () => fuentes)
  .replace('/*JUEGO*/', () => js)
  .replace('<!--HOJARASCA_BUILD-->', `<!-- HOJARASCA BUILD ${pkg.version} -->`);

if (html.includes('/*JUEGO*/') || html.includes('/*FUENTES*/')) throw new Error('La plantilla quedó sin completar');
if (/https?:\/\/unpkg\.com|https?:\/\/cdn\./i.test(html)) throw new Error('El build final todavía depende de un CDN');
if (html.length < 700_000) throw new Error(`index.html sospechosamente pequeño (${html.length} bytes)`);

const tmp = path.join(raiz, 'index.html.tmp');
fs.writeFileSync(tmp, html);
fs.renameSync(tmp, path.join(raiz, 'index.html'));
console.log(`index.html offline listo · Hojarasca ${pkg.version} · ${orden.length} módulos · ${(html.length / 1024 / 1024).toFixed(2)} MB`);
