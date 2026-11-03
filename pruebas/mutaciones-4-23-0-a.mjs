// 4.23.0 · A · Mutaciones de `verificar-4-23-0-a.mjs`: cada una deshace UN cambio de «lo que se produce vale» en una copia de `src/` y la prueba
// tiene que fallar. Un proceso y una carpeta por mutación (los módulos ESM quedan en caché: con otra copia cada una se mide limpia).
//   node pruebas/mutaciones-4-23-0-a.mjs            (todas)    ·    node pruebas/mutaciones-4-23-0-a.mjs renta   (las que digan «renta»)
// No está en `verify`: tarda unos 10 s por mutación. La copia sin mutar tiene que pasar (si no, no se mide nada).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const filtro = process.argv[2] || '';
// [nombre, archivo, texto que está, texto que lo deshace]
const MUTACIONES = [
  // el valor de lo que se produce
  ['valor: la leche vale $5 el litro', 'src/comercio.js', "leche: { nombre: 'Litros de leche', donde: 'entrada', lote: 4, valor: 3 }", "leche: { nombre: 'Litros de leche', donde: 'entrada', lote: 4, valor: 5 }"],
  ['valor: la leche va de a 2', 'src/comercio.js', "leche: { nombre: 'Litros de leche', donde: 'entrada', lote: 4, valor: 3 }", "leche: { nombre: 'Litros de leche', donde: 'entrada', lote: 2, valor: 3 }"],
  ['valor: la leche sale de los materiales y no del cuaderno', 'src/comercio.js', "leche: { nombre: 'Litros de leche', donde: 'entrada'", "leche: { nombre: 'Litros de leche', donde: 'material'"],
  ['valor: la carne de vaca a $500 el kilo', 'src/comercio.js', "'carne-vaca': { nombre: 'Kilos de carne de vaca', donde: 'entrada', lote: 2, valor: 7 }", "'carne-vaca': { nombre: 'Kilos de carne de vaca', donde: 'entrada', lote: 2, valor: 10 }"],
  ['valor: el cordero vuelve a 7 (el informe)', 'src/comercio.js', "'carne-cordero': { nombre: 'Kilos de cordero', donde: 'entrada', lote: 2, valor: 6 }", "'carne-cordero': { nombre: 'Kilos de cordero', donde: 'entrada', lote: 2, valor: 7 }"],
  ['valor: el chorizo vuelve a 8 (el informe)', 'src/comercio.js', "chorizo: { nombre: 'Chorizos', donde: 'entrada', lote: 3, valor: 6 }", "chorizo: { nombre: 'Chorizos', donde: 'entrada', lote: 3, valor: 8 }"],
  ['valor: el chorizo va de a 4', 'src/comercio.js', "chorizo: { nombre: 'Chorizos', donde: 'entrada', lote: 3, valor: 6 }", "chorizo: { nombre: 'Chorizos', donde: 'entrada', lote: 4, valor: 6 }"],
  ['valor: la manzana a $120', 'src/comercio.js', "manzana: { nombre: 'Manzanas', donde: 'entrada', lote: 5, valor: 4 }", "manzana: { nombre: 'Manzanas', donde: 'entrada', lote: 5, valor: 6 }"],
  ['valor: la mermelada de pera a $500 (el informe)', 'src/comercio.js', "'mermelada-pera': { nombre: 'Frascos de mermelada de pera', donde: 'entrada', lote: 1, valor: 4 }", "'mermelada-pera': { nombre: 'Frascos de mermelada de pera', donde: 'entrada', lote: 1, valor: 5 }"],
  ['valor: la mermelada de grosella no vale', 'src/comercio.js', "  'mermelada-grosella': { nombre: 'Frascos de mermelada de grosella', donde: 'entrada', lote: 1, valor: 4 },\n", ''],
  ['valor: se pierde la lista de lo de la granja', 'src/comercio.js', "'mermelada-frambuesa', 'mermelada-grosella'];\nexport const ID_BIENES", "'mermelada-frambuesa'];\nexport const ID_BIENES"],
  // los puestos
  ['puestos: la estación no pide carne de vaca', 'src/comercio.js', "'pan-casero', 'carne-vaca'], otros: ['piedra', 'miel', 'trucha-ahumada'] },", "'pan-casero'], otros: ['piedra', 'miel', 'trucha-ahumada'] },"],
  ['puestos: la parada alta no pide chorizo', 'src/comercio.js', "'tronco', 'chorizo'], otros: ['harina', 'hongos-secos'] },\n  'Parada del Molino'", "'tronco'], otros: ['harina', 'hongos-secos'] },\n  'Parada del Molino'"],
  ['puestos: el mallín produce la leche en vez de pedirla', 'src/comercio.js', "produce: ['lana', 'huevo', 'haba'], pide: ['tabla', 'harina', 'frasco-frutilla', 'leche']", "produce: ['lana', 'huevo', 'haba', 'leche'], pide: ['tabla', 'harina', 'frasco-frutilla']"],
  ['puestos: el pescador pierde la mermelada', 'src/comercio.js', "'empanadas', 'grosella', 'mermelada-manzana']", "'empanadas', 'grosella']"],
  ['puestos: el bosque vende cereza y le saca el aserrado', 'src/comercio.js', "'piedra', 'lana', 'miel', 'cereza']", "'piedra', 'lana', 'miel']"],
  // lo de siempre no se movió
  ['siempre: el banco puede pedir lo de la granja', 'src/prestamos.js', 'for (const k of DE_GRANJA_CON_VALOR) SIN_ABASTO.add(k);', ''],
  ['siempre: una parada sin perfil puede tener lo de la granja', 'src/comercio.js', 'const pool = ID_BIENES.filter((b) => !DE_GRANJA_CON_VALOR.includes(b));', 'const pool = [...ID_BIENES];'],
  ['siempre: la caja de un puesto nuevo sale del azar mezclado', 'src/mercado.js', "const nuevos = resto.filter((b) => DE_GRANJA_CON_VALOR.includes(b));", 'const nuevos = [];'],
  ['siempre: el pedido de nivel 0 ya incluye la cuarta cosa', 'src/pedidos.js', 'const lista = nivel >= 3 ? NECESITA[k] : NECESITA[k].slice(0, 3);', 'const lista = NECESITA[k];'],
  ['pedidos: el nivel 3 no pide lo de la granja', 'src/pedidos.js', '.slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2);', '.slice(0, nivel >= 2 ? 3 : 2);'],
  ['pedidos: la panadera pide mermelada que no se consigue en ningún puesto', 'src/pedidos.js', "panadera: ['harina', 'huevo', 'miel', 'leche']", "panadera: ['harina', 'huevo', 'miel', 'mermelada-pera']"],
  // salida pública
  ['tienda: vuelve a 4 lotes por día', 'src/oficios-propios.js', 'lotesPorDia: 6, comision: 0.04, stockMax: 12, tipos: 12,', 'lotesPorDia: 4, comision: 0.04, stockMax: 12, tipos: 12,'],
  ['tienda: vuelve a 8 clases', 'src/oficios-propios.js', 'lotesPorDia: 6, comision: 0.04, stockMax: 12, tipos: 12,', 'lotesPorDia: 6, comision: 0.04, stockMax: 12, tipos: 8,'],
  ['tienda: no vende la leche', 'src/oficios-propios.js', "'chorizo', 'leche', 'manzana',", "'chorizo', 'manzana',"],
  ['tienda: no vende la mermelada de frambuesa', 'src/oficios-propios.js', "'mermelada-cereza', 'mermelada-frambuesa', 'mermelada-grosella'],\n  //", "'mermelada-cereza', 'mermelada-grosella'],\n  //"],
  ['tienda: se lleva todo, hasta lo de la receta', 'src/oficios-propios.js', 'Math.max(0, tengoBien(p, k) - (TIENDA.reserva[k] || 0))', 'tengoBien(p, k)'],
  ['tienda: la reserva del asado es de 1 kilo', 'src/oficios-propios.js', "reserva: { 'carne-vaca': 2,", "reserva: { 'carne-vaca': 1,"],
  ['tienda: el aviso ofrece dejar lo de la receta', 'src/oficios-propios.js', '- (TIENDA.reserva[k] || 0) >= (BIENES[k]?.lote || 1));', '>= (BIENES[k]?.lote || 1));'],
  ['feria: el puesto vende 2 lotes por día', 'src/propiedad.js', 'puesto: { precio: 6000, lotesPorDia: 3,', 'puesto: { precio: 6000, lotesPorDia: 2,'],
  ['feria: el puesto acepta 8 clases', 'src/propiedad.js', 'stockMax: 12, tiposMax: 12 }', 'stockMax: 12, tiposMax: 8 }'],
  ['feria: el guardado del puesto vuelve a 8 clases', 'src/negocios.js', 'entero(n, 30) > 0 ? entero(n, 30) : null), 12), dia:', 'entero(n, 30) > 0 ? entero(n, 30) : null), 8), dia:'],
  ['texto: el aviso de la tienda vuelve a decir 4', 'src/main.js', 'vende hasta 6 por día, lo más caro primero', 'vende hasta 4 por día, lo más caro primero'],
  ['texto: el plano de la tienda vuelve a decir cuatro', 'src/planos-oficios.js', 'vende hasta seis lotes por día', 'vende hasta cuatro lotes por día'],
  // la renta
  ['renta: la cabaña vuelve a $300', 'src/propiedad.js', "renta: 600, nombre: 'la cabaña'", "renta: 300, nombre: 'la cabaña'"],
  ['renta: la casa con galería vuelve a $500', 'src/propiedad.js', "renta: 1000, nombre: 'la casa con galería'", "renta: 500, nombre: 'la casa con galería'"],
  ['renta: la casona vuelve a $800', 'src/propiedad.js', "renta: 1600, nombre: 'la casona'", "renta: 800, nombre: 'la casona'"],
  ['renta: la casona a $2.400 (se paga en 46 días)', 'src/propiedad.js', "renta: 1600, nombre: 'la casona'", "renta: 2400, nombre: 'la casona'"],
  ['renta: las ya alquiladas siguen con la renta que tenían anotada', 'src/propiedad.js', 'm += Math.round((rentaDe(id) * Math.max(0.9', 'm += Math.round((a.renta * Math.max(0.9'],
  // los precios de las obras
  ['obras: la herrería vuelve a $32.000', 'src/planos-oficios.js', 'pesos: 18000,', 'pesos: 32000,'],
  ['obras: la cervecería vuelve a $42.000', 'src/planos-oficios.js', 'pesos: 29500,', 'pesos: 42000,'],
  ['obras: el telar grande vuelve a $36.000', 'src/planos-oficios.js', 'pesos: 21500,', 'pesos: 36000,'],
  ['obras: la quesería vuelve a $24.000', 'src/planos-oficios.js', 'pesos: 17500,', 'pesos: 24000,'],
  ['obras: la tienda de campo vuelve a $30.000', 'src/planos-oficios.js', 'pesos: 23500,', 'pesos: 30000,'],
  ['obras: la cantería vuelve a $18.000', 'src/planos-oficios.js', 'pesos: 13000,', 'pesos: 18000,'],
  ['obras: el reloj de pie vuelve a $9.000', 'src/planos-lujo.js', 'pesos: 7500,', 'pesos: 9000,'],
  ['obras: la araña de velas vuelve a $6.500', 'src/planos-lujo.js', 'pesos: 4550,', 'pesos: 6500,'],
  ['obras: el telar a $15.000 (se pasa para abajo: menos de 3 veces)', 'src/planos-oficios.js', 'pesos: 21500,', 'pesos: 15000,'],
  ['obras: la herrería a $19.000 (pasa de 4 veces)', 'src/planos-oficios.js', 'pesos: 18000,', 'pesos: 19000,'],
];

const lista = MUTACIONES.filter((m) => m[0].includes(filtro));
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-mut-4230a-'));
const preparar = (id) => {
  const d = path.join(base, id);
  fs.mkdirSync(path.join(d, 'pruebas'), { recursive: true });
  fs.mkdirSync(path.join(d, 'herramientas'), { recursive: true });
  fs.cpSync(path.join(raiz, 'src'), path.join(d, 'src'), { recursive: true });
  fs.copyFileSync(path.join(raiz, 'three-r186-inline.js'), path.join(d, 'three-r186-inline.js'));
  fs.copyFileSync(path.join(raiz, 'PRECIOS_CONSTRUCCION.md'), path.join(d, 'PRECIOS_CONSTRUCCION.md'));
  for (const f of ['verificar-4-23-0-a.mjs', 'ayuda-three.mjs']) fs.copyFileSync(path.join(raiz, 'pruebas', f), path.join(d, 'pruebas', f));
  for (const f of fs.readdirSync(path.join(raiz, 'herramientas'))) if (f.startsWith('auditoria-4-20-a-')) fs.copyFileSync(path.join(raiz, 'herramientas', f), path.join(d, 'herramientas', f));
  return d;
};
const correr = (d) => spawnSync(process.execPath, ['pruebas/verificar-4-23-0-a.mjs'], { cwd: d, encoding: 'utf8', timeout: 180000 });
const primerError = (r) => ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || (r.stdout || '').split('\n').pop() || '').slice(0, 150);

let mal = 0;
{
  const d = preparar('sin-mutar');
  const r = correr(d);
  if (r.status !== 0) { console.error('La copia SIN mutar falla: no se puede medir nada.\n' + primerError(r)); process.exit(1); }
  console.log('sin mutar: pasa');
}
for (const [i, [nombre, archivo, esta, queda]] of lista.entries()) {
  const d = preparar(`m${i}`);
  const f = path.join(d, archivo);
  const txt = fs.readFileSync(f, 'utf8');
  if (txt.split(esta).length !== 2) { console.log(`  ?? ${nombre}: el texto a mutar no está una sola vez en ${archivo}`); mal++; continue; }
  fs.writeFileSync(f, txt.replace(esta, () => queda));
  const r = correr(d);
  if (r.status === 0) { console.log(`  NO LA ATRAPA: ${nombre}`); mal++; } else console.log(`  atrapada: ${nombre}  →  ${primerError(r)}`);
}
fs.rmSync(base, { recursive: true, force: true });
console.log(mal === 0 ? `mutaciones-4-23-0-a: ${lista.length} de ${lista.length} atrapadas` : `mutaciones-4-23-0-a: ${mal} sin atrapar de ${lista.length}`);
process.exit(mal === 0 ? 0 : 1);
