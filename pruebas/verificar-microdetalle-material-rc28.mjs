import { nivelRc } from './version.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const mat = leer('src/materiales.js');
const clima = leer('src/clima.js');
const pkg = JSON.parse(leer('package.json'));
const fallos = [];
const ok = (c, m) => { if (!c) fallos.push(m); };

ok(nivelRc(pkg.version) >= 28, 'versión RC28 o posterior ausente');
ok(mat.includes('uMojado: { value: 0 }'), 'uniforme compartido de humedad persistente ausente');
ok(clima.includes('const tauMojado = objetivoMojado > U.uMojado.value ? 7.5 : (150 + estado.nublado * 150)'), 'clima sin mojado rápido/secado lento');
ok(clima.includes('U.uMojado.value = lerp(U.uMojado.value, objetivoMojado'), 'humedad persistente no se interpola');
// 3.2: el estilo pintado reemplazó el microdetalle (veta y micrograno) por una pincelada
// amplia de baja frecuencia, igual limitada por distancia y separada por madera/mineral.
ok(mat.includes('float detalleMaterial = 1.0 - smoothstep(30.0, 70.0'), 'detalle material no limitado por distancia');
ok(mat.includes('float esMadera = 1.0 - step(0.5, vTipoVeg)'), 'material sin clasificación de madera');
ok(mat.includes('float esMineral = step(3.5, vTipoVeg)'), 'material sin clasificación mineral');
ok(mat.includes('float pincelada = mix(1.0, 0.88 + 0.24 * rug, detalleMaterial * (esMadera * 0.8 + esMineral))'), 'madera/piedra sin pincelada amplia');
ok(!mat.includes('float veta = ') && !mat.includes('granoPiedra'), 'volvió el microdetalle de alta frecuencia (ruido) del 2.7');
// 3.4: la corteza pintada de HushWood (vetas verticales anchas, sólo árboles y arbustos) no
// es el micrograno del 2.7: se apaga con la distancia y las fibras finas antes que las anchas.
ok(mat.includes('float corteza34 = esMadera * uCortezaVeg * (1.0 - smoothstep(35.0, 60.0, dOjo))'), 'corteza pintada sin límite de distancia');
ok(mat.includes('1.0 - smoothstep(10.0, 24.0, dOjo)'), 'fibras finas de la corteza sin límite de distancia');
ok(mat.includes('if (uMojadoVeg > 0.01)'), 'estructuras no usan humedad residual');
ok(mat.includes('float marcaHumedad = bajo * uMojadoVeg'), 'bases de estructuras sin marca de humedad');
ok(mat.includes('if (uMojado > 0.01 && uDetalleSuelo > 0.01)'), 'terreno no usa humedad persistente');
ok(mat.includes('float charco = uMojado * plano * cuenca'), 'suelo sin charcos procedurales');
ok(mat.includes('float sueloCompacto = clamp(sendero * 0.75 + humedo * 0.55'), 'charcos no priorizan sendero/humedad');

if (fallos.length) {
  console.error('RC28 MICRODETALLE MATERIAL FALLÓ');
  for (const f of fallos) console.error(' -', f);
  process.exit(1);
}
console.log('OK Microdetalle Material RC28 · humedad persistente · veta/micrograno por distancia · charcos procedurales · marcas húmedas');
