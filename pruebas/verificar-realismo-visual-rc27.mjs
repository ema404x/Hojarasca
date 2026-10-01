import { nivelRc } from './version.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const agua = leer('src/agua.js');
const mat = leer('src/materiales.js');
const post = leer('src/postproceso.js');
const main = leer('src/main.js');
const pkg = JSON.parse(leer('package.json'));
const fallos = [];
const ok = (c, m) => { if (!c) fallos.push(m); };

ok(nivelRc(pkg.version) >= 27, 'versión RC27 o posterior ausente');
ok(agua.includes('vec3 absorcion = exp(-vec3(0.36, 0.16, 0.08)'), 'agua sin absorción cromática por profundidad');
ok(agua.includes('float sedimento = (1.0 - smoothstep(0.10, 1.05, prof))'), 'agua sin turbidez/sedimento de orilla');
ok(agua.includes('float chispa = pow(alineadoSol, 70.0)'), 'agua sin microdestellos solares');
ok(agua.includes('vnoise(vPos.xz * 1.3'), 'espuma de orilla no usa irregularidad procedural');
ok(mat.includes('uCieloBajoVeg: U.uCieloBajo') && mat.includes('uSolDirVeg: U.uSolDir'), 'vegetación sin iluminación contextual cielo/sol');
ok(mat.includes('float alturaCopa = smoothstep(0.7, 7.0'), 'vegetación sin volumen por altura de copa');
ok(mat.includes('gl_FragColor.rgb += uCieloBajoVeg * arribaHoja * 0.018'), 'vegetación sin relleno de cielo');
ok(post.includes('let exposicionSuave = 1') && post.includes('let interiorSuave = 0'), 'postproceso sin adaptación persistente');
ok(post.includes('objetivoInterior') && post.includes('objetivoExp'), 'postproceso sin adaptación interior/exposición');
ok(post.includes('uniform float uInterior;'), 'shader final no recibe estado interior');
ok(main.includes("interior: espacioAudioActual === 'adentro' ? 1 : (bajoTecho ? 0.32 : 0)"), 'main no comunica interior al postproceso');
ok(main.includes('const rellenoInterior = 0.55 + diaInterior'), 'luces interiores no responden a día/clima');
ok(main.includes('ref.interior.color.copy(colorInterior)') && main.includes('cab.interior.color.copy(colorInterior)'), 'interiores principales no heredan color de cielo');

if (fallos.length) {
  console.error('RC27 REALISMO VISUAL FALLÓ');
  for (const f of fallos) console.error(' -', f);
  process.exit(1);
}
console.log('OK Realismo Visual RC27 · agua por profundidad/orilla · volumen vegetal · luz interior contextual · adaptación de exposición');
