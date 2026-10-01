import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fallo = [];
const ok = [];
const existe = (r) => fs.existsSync(path.join(raiz, r));
for (const r of ['index.html','main.cjs','preload.cjs','package.json','build/icon.png','src/main.js','src/plantilla.html']) {
  if (!existe(r)) fallo.push(`falta ${r}`); else ok.push(r);
}
const pkg = JSON.parse(fs.readFileSync(path.join(raiz,'package.json'),'utf8'));
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pkg.version || '')) fallo.push('version inválida en package.json');
if (pkg.build?.asar !== true) fallo.push('build.asar debe estar activo');
if (!pkg.build?.artifactName) fallo.push('falta build.artifactName');
if (pkg.private !== true || pkg.license !== 'UNLICENSED') fallo.push('metadatos comerciales: package debe ser private + UNLICENSED');
if (!existe('build/icon.ico')) fallo.push('falta build/icon.ico para Windows');
if (pkg.build?.win?.icon !== 'build/icon.ico') fallo.push('Windows no usa el icono ICO de release');
if (!pkg.build?.nsis?.artifactName || !pkg.build?.portable?.artifactName || pkg.build.nsis.artifactName === pkg.build.portable.artifactName) fallo.push('instalador y portable necesitan nombres de artefacto distintos');
if (!pkg.scripts?.['dist:steam:win']?.includes('--win --dir')) fallo.push('falta target de carpeta para depot de Steam');
const electronMain = fs.readFileSync(path.join(raiz,'main.cjs'),'utf8');
if (!electronMain.includes('sandbox: true') || !electronMain.includes('contextIsolation: true') || !electronMain.includes('nodeIntegration: false')) fallo.push('BrowserWindow no está endurecido para release');
if (!electronMain.includes('setWindowOpenHandler') || !electronMain.includes("will-navigate")) fallo.push('faltan bloqueos de navegación/popups externos');
const index = fs.readFileSync(path.join(raiz,'index.html'),'utf8');
for (const marca of [`HOJARASCA BUILD ${pkg.version}`,'btn-guardar','btn-controles','btn-salir','Mapa completo del valle',`VERSION_FALLBACK = '${pkg.version}'`,'movimientoCamara','obra-categorias','obra-sitio']) {
  if (!index.includes(marca)) fallo.push(`index.html no contiene ${marca}`);
}
if (index.includes('__HOJARASCA_VERSION__')) fallo.push('quedó sin reemplazar la versión en la plantilla');
if (/Premium Construction Evolution|Antes de publicar|Rama maestra de terminación/.test(index)) fallo.push('quedó texto interno de desarrollo visible al jugador');
if (index.includes('ESTRUCTURAS V6 · VISUAL')) fallo.push('quedó una marca temporal de debugging V6');
if (index.includes('Lo que no recorriste queda en blanco')) fallo.push('quedó la leyenda vieja del mapa por descubrimiento');
if (index.length < 700_000) fallo.push('index.html parece incompleto/truncado');

if (/https?:\/\/(?:unpkg\.com|cdn\.|cdnjs\.|jsdelivr\.)/i.test(index)) fallo.push('index.html depende de un CDN/red externa');
if (!index.includes('Three.js r186 · MIT · runtime extraído')) fallo.push('index.html no contiene el runtime Three.js offline');
const armador = fs.readFileSync(path.join(raiz,'armar.mjs'),'utf8');
if (/from ['"]esbuild['"]/.test(armador)) fallo.push('armar.mjs volvió a depender de esbuild');
if (!armador.includes('three-r186-inline.js')) fallo.push('armar.mjs no usa el runtime Three.js local');
const pruebasRelease = [
  'verificar-guardado-rc2.mjs', 'verificar-coherencia-rc2.mjs', 'verificar-three-offline.mjs',
  'verificar-implacable-rc4.mjs', 'verificar-premium-rc5.mjs', 'verificar-construccion-premium-rc6.mjs',
  'verificar-construccion-senior-rc7.mjs', 'verificar-construccion-ingenieria-rc8.mjs',
  'verificar-construccion-multinivel-rc9.mjs', 'verificar-construccion-ultra-rc10.mjs',
  'verificar-habitat-premium-rc11.mjs', 'verificar-habitat-conectado-rc12.mjs',
  'verificar-naturaleza-patagonica-rc13.mjs', 'verificar-naturaleza-viva-rc14.mjs', 'verificar-naturaleza-cinematica-rc15.mjs', 'verificar-naturaleza-reactiva-rc16.mjs', 'verificar-ecosistema-dinamico-rc17.mjs', 'verificar-ecosistema-atmosferico-rc18.mjs', 'verificar-microconductas-rc19.mjs', 'verificar-optimizacion-rc20.mjs', 'verificar-optimizacion-profunda-rc21.mjs', 'verificar-optimizacion-adaptativa-rc22.mjs', 'verificar-optimizacion-autodiagnostica-rc23.mjs', 'verificar-optimizacion-antitirones-rc24.mjs', 'verificar-hotfix-runtime-rc24-1.mjs', 'verificar-bughunt-integral-rc25.mjs', 'verificar-realismo-visual-rc27.mjs', 'verificar-microdetalle-material-rc28.mjs', 'verificar-composicion-paisaje-rc29.mjs', 'verificar-profundidad-escenica-rc30.mjs', 'verificar-hotfix-visual-rc30.mjs', 'verificar-integridad-estructural-rc31.mjs',
];
const faltanPruebas = pruebasRelease.filter((nombre) => !pkg.scripts?.verify?.includes(nombre));
if (faltanPruebas.length) fallo.push(`verify no cubre toda la cadena RC2-RC31: ${faltanPruebas.join(', ')}`);
if (pkg.devDependencies?.three || pkg.devDependencies?.esbuild) fallo.push('quedaron dependencias de build innecesarias (three/esbuild)');
const mainFuente = fs.readFileSync(path.join(raiz,'src/main.js'),'utf8');
const mapaFuente = fs.readFileSync(path.join(raiz,'src/mapa.js'),'utf8');
if (!mainFuente.includes("HOJARASCA_DEBUG") || !mainFuente.includes("case 'F4': if (HOJARASCA_DEBUG)")) fallo.push('la cámara libre de desarrollo quedó accesible en release');
if (!mapaFuente.includes('semillaMapa') || /const px = Math\.random\(\) \* TAM/.test(mapaFuente)) fallo.push('la decoración del mapa volvió a ser no determinista');
if (!index.includes("case 'F4': if (HOJARASCA_DEBUG)") || !index.includes('semillaMapa')) fallo.push('bundle desincronizado con hardening RC2');
const archivos = [];
function recorrer(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(!['dist','node_modules'].includes(e.name))recorrer(p);}else archivos.push(p);}}
recorrer(raiz);
for (const f of archivos) {
  if (!/\.(js|mjs|cjs|html|json|md)$/.test(f)) continue;
  const t = fs.readFileSync(f,'utf8');
  if (t.includes('/home/' + 'claude/')) fallo.push(`ruta absoluta de Claude en ${path.relative(raiz,f)}`);
}
const js = archivos.filter(f => /\.(js|mjs|cjs)$/.test(f) && !f.includes(`${path.sep}pruebas${path.sep}salidas${path.sep}`));
for (const f of js) {
  const r = spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if (r.status !== 0) fallo.push(`sintaxis: ${path.relative(raiz,f)}: ${(r.stderr||r.stdout).trim().split('\n')[0]}`);
}
if (fallo.length) {
  console.error('RELEASE CHECK FALLÓ');
  for (const x of fallo) console.error(' -',x);
  process.exit(1);
}
console.log(`OK release · ${pkg.version} · ${js.length} archivos JS validados · index ${(index.length/1024/1024).toFixed(2)} MB`);
