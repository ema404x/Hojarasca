// 3.9.2: cuántos triángulos y dibujos lleva cada edificio que se toca (banco, cantina, casa de té): `node herramientas/medir-edificios-392.mjs [id ...]`
import { registrarThree } from '../pruebas/ayuda-three.mjs';
registrarThree();
const AR = await import('../src/aldea-arquitectura.js');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['banco-pueblo', 'cantina'];
for (const id of ids) {
  const d = AR.armarEdificio(id, 4);
  console.log(id, 'afuera', d.medidas.triangulos.exterior, 'adentro', d.medidas.triangulos.interior, 'dibujos', JSON.stringify(d.medidas.dibujos), 'luces', d.luces.length);
}
