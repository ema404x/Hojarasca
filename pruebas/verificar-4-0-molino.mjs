// 4.0 (molino y puente): el plano del paisaje del molino (campo de tulipanes, cercos, arroyo con su caída, casa con galería) y las reglas del
// proyecto para lo nuevo. Lógica pura, sin Electron:
//  · los identificadores exportados no llevan eñe; los ids de las obras nuevas son los esperados;
//  · el campo: franjas parejas sin pisarse, dentro de sus límites; todas las plantas dentro del campo; colores válidos; las mezclas suman 1;
//    la calidad saca plantas parejo (un prefijo del orden fijo): más densidad, nunca menos plantas, y el 100 % es el total;
//  · el azar es fijo (dos corridas dan lo mismo) y no toca el del sorteo del valle (no importa `ruido.js`);
//  · los cercos rodean el campo con su portón; el arroyo corre de oeste a este, con la caída después de lo llano;
//  · la casa no pisa el molino, ni el campo, ni el sendero (la franja de z < 4,4 junto a la puerta);
//  · el dibujo usa `materialVegetal` con los tipos del proyecto (hoja = 2, flor = 3, piedra = 4, madera/tela = 0) y no usa clases que el
//    three local no trae (Vector4, OctahedronGeometry); no escribe textos en inglés ni toca el guardado.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const P = await import(pathToFileURL(path.join(raiz, 'src', 'molino-paisaje-plano.js')).href);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. nombres
for (const k of Object.keys(P)) ok(!/ñ/i.test(k), `identificador exportado sin eñe: ${k}`);
ok(P.IDS_MOLINO_PAISAJE.join() === 'campo-tulipanes,cercos-molino,arroyo-molino,casa-molino', 'los cuatro ids de lo nuevo');
for (const f of ['src/molino-paisaje.js', 'src/molino-paisaje-plano.js']) {
  const t = leer(f);
  for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ok(!/ñ/i.test(m[1]), `${f}: ${m[1]} sin eñe`);
}

// ---------------------------------------------------------------- 2. el campo
const fr = P.limitesFranjas();
ok(fr.length === P.FRANJAS.length && fr.length >= 5, 'al menos cinco franjas');
ok(Math.abs(fr[0].z0 - P.CAMPO.lz0) < 1e-9 && Math.abs(fr[fr.length - 1].z1 - P.CAMPO.lz1) < 1e-9, 'las franjas llenan el campo de punta a punta');
for (let i = 0; i < fr.length; i++) {
  ok(fr[i].z1 > fr[i].z0 + 1.0, `la franja ${fr[i].id} tiene ancho`);
  if (i) ok(Math.abs((fr[i].z0 - fr[i - 1].z1) - P.CAMPO.surco) < 1e-9, 'entre franja y franja queda el surco');
  ok(Math.abs(Object.values(fr[i].mezcla).reduce((a, b) => a + b, 0) - 1) < 1e-9, `la mezcla de ${fr[i].id} suma 1`);
  for (const c of Object.keys(fr[i].mezcla)) ok(P.COLORES_TULIPAN[c], `color conocido: ${c}`);
}
for (const [k, c] of Object.entries(P.COLORES_TULIPAN)) ok(/^#[0-9a-f]{6}$/i.test(c), `color ${k} es un hex`);
const s1 = P.sembrarTulipanes(), s2 = P.sembrarTulipanes();
ok(s1.total === s2.total && JSON.stringify(s1.porColor.rojo[0]) === JSON.stringify(s2.porColor.rojo[0]), 'el azar es fijo: dos siembras iguales');
ok(s1.total > 1500 && s1.total < 4000, `cantidad de tulipanes razonable para una placa integrada (${s1.total})`);
let contados = 0;
for (const [color, lista] of Object.entries(s1.porColor)) {
  ok(P.COLORES_TULIPAN[color], `la siembra sólo usa colores del plano (${color})`);
  contados += lista.length;
  for (const t of lista) {
    ok(t.x >= P.CAMPO.lx0 && t.x <= P.CAMPO.lx1 && t.z >= P.CAMPO.lz0 - 0.05 && t.z <= P.CAMPO.lz1 + 0.05, 'cada planta cae dentro del campo');
    ok(t.esc > 0.8 && t.esc < 1.25, 'la escala varía poco');
  }
}
ok(contados === s1.total, 'ninguna planta se pierde ni se repite entre colores');
// ninguna planta cae en un surco (tierra pelada entre franjas)
for (const lista of Object.values(s1.porColor)) for (const t of lista) ok(fr.some((f) => t.z >= f.z0 - 0.06 && t.z <= f.z1 + 0.06), 'las plantas van en las franjas, no en los surcos');
// la calidad: prefijo de un orden fijo
ok(P.cantidadConDensidad(1000, 1) === 1000 && P.cantidadConDensidad(1000, 0) === 0 && P.cantidadConDensidad(1000, 0.58) === 580, 'densidad: 100 %, 0 % y 58 % (baja)');
ok(P.cantidadConDensidad(1000, 7) === 1000 && P.cantidadConDensidad(1000, -2) === 0, 'la densidad se acota');
let ant = -1;
for (const d of [0.45, 0.58, 0.82, 1]) { const n = P.cantidadConDensidad(s1.total, d); ok(n >= ant, 'más calidad, nunca menos plantas'); ant = n; }
// el prefijo ralo cubre todo el campo (no un trozo): la mitad de las plantas de rojo tiene x en ambas mitades del campo
{
  const l = s1.porColor.naranja, mitad = l.slice(0, Math.floor(l.length / 2)), cx = (P.CAMPO.lx0 + P.CAMPO.lx1) / 2;
  ok(mitad.some((t) => t.x < cx) && mitad.some((t) => t.x > cx) && mitad.some((t) => t.z < (P.CAMPO.lz0 + P.CAMPO.lz1) / 2) && mitad.some((t) => t.z > (P.CAMPO.lz0 + P.CAMPO.lz1) / 2), 'bajar la calidad raleá parejo');
}

// ---------------------------------------------------------------- 3. cercos y arroyo
const cercos = P.CERCOS.tramos;
ok(cercos.length === 4 && cercos.every((t) => t.id.startsWith('campo-')), 'cuatro tramos que rodean el campo');
const xs = cercos.flatMap((t) => [t.a[0], t.b[0]]), zs = cercos.flatMap((t) => [t.a[1], t.b[1]]);
ok(Math.min(...xs) < P.CAMPO.lx0 && Math.max(...xs) > P.CAMPO.lx1 && Math.min(...zs) < P.CAMPO.lz0 && Math.max(...zs) > P.CAMPO.lz1, 'el cerco queda por fuera del campo');
const frente = cercos.find((t) => t.id === 'campo-frente');
ok(frente.porton && frente.porton[1] - frente.porton[0] >= 2 && frente.porton[0] > frente.a[0] && frente.porton[1] < frente.b[0], 'el portón está en el frente y se puede pasar (2 m o más)');
const mu = P.muestrearArroyo(0.8);
ok(mu.length > 50, 'el arroyo tiene muestras de sobra');
ok(mu[0].x < -20 && mu[mu.length - 1].x > 30, 'el arroyo corre de oeste a este (más de 50 m)');
for (let i = 1; i < mu.length; i++) ok(mu[i].x > mu[i - 1].x - 1e-6 && mu[i].s > mu[i - 1].s, 'la corriente nunca vuelve para atrás');
ok(mu.every((m) => m.ancho > 1.2 && m.ancho <= P.ARROYO.ancho + 1e-9), 'el ancho del agua entra en lo previsto');
ok(mu.some((m) => m.x < P.ARROYO.lazoDique - 3) && mu.some((m) => m.x > P.ARROYO.lazoDique + 6), 'hay agua llana antes de la caída y bajada después');
ok(mu.every((m) => Math.abs(Math.hypot(m.nx, m.nz) - 1) < 1e-6 || (m.nx === 0 && m.nz === 1)), 'las normales de la corriente están normalizadas');
// el arroyo pasa por detrás del campo (z mayor que el borde de atrás del cerco) sin pisarlo
for (const m of mu) if (m.x > P.CAMPO.lx0 - 1 && m.x < P.CAMPO.lx1 + 1) ok(m.z - m.ancho / 2 > P.CAMPO.lz1 + 0.4, 'el agua no entra al campo de tulipanes');

// ---------------------------------------------------------------- 4. la casa
const C = P.CASA, x0 = C.cx - C.ancho / 2, x1 = C.cx + C.ancho / 2, z0 = C.cz - C.fondo / 2, z1 = C.cz + C.fondo / 2 + C.galeria;
ok(Math.hypot(Math.max(x0, Math.min(0, x1)), Math.max(z0, Math.min(0, z1))) > 4.2, 'la casa no pisa el molino (3 m de su pared y la escalinata)');
ok(x1 < P.CAMPO.lx0 - 1.2 || z1 < P.CAMPO.lz0 - 1.0, 'la casa no pisa el campo');
ok(z0 > 4.4, 'la casa deja libre el camino que pasa por la puerta del molino');
ok(z1 + P.CASA.voladizo < P.ARROYO.puntos[0][1] - 5, 'la casa queda lejos del arroyo');
const zonas = P.zonasDespeje();
ok(zonas.length > 20 && zonas.every((z) => Number.isFinite(z.x) && Number.isFinite(z.z) && z.r > 1 && z.pasto > 1), 'las zonas a despejar son círculos válidos');

// ---------------------------------------------------------------- 5. el dibujo cumple las reglas del proyecto
const dibujo = leer('src/molino-paisaje.js'), plano = leer('src/molino-paisaje-plano.js');
ok(/materialVegetal\(/.test(dibujo), 'las obras nuevas usan materialVegetal');
const tipos = new Set([...dibujo.matchAll(/tipo:\s*(\d)/g)].map((m) => Number(m[1])));
ok([...tipos].every((t) => [0, 2, 3, 4].includes(t)), `sólo tipos 0, 2, 3 o 4 (hay ${[...tipos].join(',')})`);
const tulipan = dibujo.slice(dibujo.indexOf('function tulipan'), dibujo.indexOf('function roca'));
ok(/CylinderGeometry[^\n]*tipo: 2/.test(tulipan) && /ConeGeometry[^\n]*tipo: 2/.test(tulipan), 'tallo y hojas del tulipán son hoja caduca (tipo 2)');
ok((tulipan.match(/IcosahedronGeometry[^\n]*tipo: 3/g) || []).length === 2, 'las dos piezas de la flor son flor (tipo 3)');
ok(/InstancedMesh/.test(dibujo), 'los tulipanes van instanciados');
ok(!/Vector4|OctahedronGeometry/.test(dibujo + plano), 'sin clases que el three local no trae');
ok(!/from '\.\/ruido\.js'|\brng\(/.test(dibujo + plano), 'no usa el azar del sorteo del valle (no mueve ninguna otra obra)');
ok(!/localStorage|guardado|progreso/.test(dibujo + plano), 'no toca el guardado: nada nuevo que se guarde');
ok(!/castShadow\s*=\s*true/.test(dibujo.slice(0, dibujo.indexOf('const malla = new THREE.Mesh'))), 'los tulipanes y el agua no tiran sombra');
ok(/aplicarCalidad/.test(dibujo) && /aplicarCalidad/.test(leer('src/main.js')), 'la calidad también se aplica en vivo (autocalidad)');
// sin textos nuevos en inglés: el inglés va al final del proyecto
ok(!/\b(the|and|with|bridge|mill|windmill|brook|stream|field)\b/i.test(dibujo.replace(/\/\/.*$/gm, '').replace(/'[^']*'/g, (m) => m).split('\n').filter((l) => /(titulo|texto|nombre|nota|cartel):/.test(l)).join('\n')), 'no hay textos nuevos en inglés');
// el puente: sigue siendo transitable (la plataforma y las barandas de física son las de siempre) y lo nuevo es sólo visual
const est = leer('src/estructuras.js');
ok(/agregarPlataforma\(\{ x: p\.x, z: p\.z, ang: p\.ang, largo: p\.largo, ancho: ancho, alto: p\.alto, espesor: 0\.12 \}\)/.test(est), 'la plataforma del puente no cambió');
ok(/alturaMin: p\.alto - 0\.08,\s*\n\s*alturaMax: p\.alto \+ 1\.35/.test(est), 'las barandas de física del puente no cambiaron');
ok(/4\.0 \(molino y puente\): como el puente de la referencia/.test(est), 'el puente lleva sus herrajes, listones, estribos y faroles');

console.log(`verificar-4-0-molino: ${pasos} comprobaciones OK`);
