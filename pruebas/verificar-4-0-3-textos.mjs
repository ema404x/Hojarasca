// 4.0.3: textos (II-11 de la zona I): la concordancia de «desmontada» y «recolocado» con el nombre de cada obra.
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';
import { participio } from '../src/concordancia.js';

registrarThree();
const { PLANOS } = await import('../src/construccion.js');
let n = 0; const eq = (a, b, m) => { assert.equal(a, b, m); n++; };
const casos = {
  'Cortinas': 'desmontadas', 'Cuadros y fotos': 'desmontados', 'Estacas trampa': 'desmontadas', 'Troncos colgantes': 'desmontados', 'Abrojos dorados': 'desmontados',
  'Estación meteorológica': 'desmontada', 'Torre de vigía': 'desmontada', 'Red dorada': 'desmontada', 'Pared modular': 'desmontada', 'Pared con puerta': 'desmontada',
  'Mesa de campo': 'desmontada', 'Cama de tablas': 'desmontada', 'Puesto de troncos': 'desmontado', 'Catre de campo': 'desmontado', 'Horno de barro': 'desmontado', 'Fogón': 'desmontado',
  'Galería con alero': 'desmontada', 'Casa con galería': 'desmontada', 'Casona de dos cuartos': 'desmontada', 'Gallinero': 'desmontado', 'Cerco': 'desmontado', 'Mirador': 'desmontado',
};
for (const [nombre, esperado] of Object.entries(casos)) eq(`${participio(nombre, 'desmontad')}`, esperado, `«${nombre}» → ${esperado}`);
eq(participio('Mesa de campo', 'recolocad'), 'recolocada', 'recolocada'); eq(participio('Banco', 'recolocad'), 'recolocado', 'recolocado');
eq(participio('', 'desmontad'), 'desmontado', 'sin nombre no se rompe'); eq(participio(null, 'desmontad'), 'desmontado', 'nulo tampoco');
// todos los planos del juego dan una forma válida y las plurales ya no dicen «desmontado» a secas
const mal = [];
for (const p of PLANOS) {
  const f = participio(p.nombre, 'desmontad');
  if (!/^desmontad[ao]s?$/.test(f)) mal.push(p.nombre);
  const w = p.nombre.split(' ')[0].toLowerCase();
  if (/as$/.test(w) && w.length > 4 && !/(us|is)$/.test(w) && !/s$/.test(f)) mal.push(`${p.nombre} (plural)`);
}
assert.deepEqual(mal, [], `todos los nombres de planos: ${mal.join(', ')}`); n++;
console.log(`OK 4.0.3 textos · ${n} verificaciones · «desmontada» y «recolocado» concuerdan con las ${PLANOS.length} obras del juego`);
