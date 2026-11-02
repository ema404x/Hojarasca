// 4.20.0 (A): cuántas acciones lleva cada nivel de cada oficio (oficios.js), con las constantes reales.
//   node herramientas/auditoria-4-20-a-oficios.mjs
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const OF = await import('../src/oficios.js');
const EM = await import('../src/empleo.js');
const TR = await import('../src/trabajos.js');

// la acción que da la experiencia de cada oficio, y lo que da
const ACCION = { hachero: ['árbol talado', OF.XP.tala], picapedrero: ['pedrero picado hasta el final (más 5 golpes de 1)', OF.XP.roca + 5 * OF.XP.golpe], pescador: ['pez sacado', OF.XP.pez], cazador: ['duende abatido (sólo el Desafío)', OF.XP.abatido], obrero: ['etapa de obra (4 + un tercio de lo que costó; ~10)', 10], huertero: ['siembra + cosecha', OF.XP.siembra + OF.XP.cosecha], navegante: [`${OF.METROS_REMO} m remados`, OF.XP.remo] };
const filas = [];
for (const id of OF.ORDEN_OFICIOS) {
  const [accion, xp] = ACCION[id];
  const fila = { oficio: id, accion, xpPorAccion: xp };
  OF.UMBRALES.slice(1).forEach((u, i) => { fila[`nivel ${i + 1}`] = Math.ceil(u / xp); });
  fila.metrosHastaNivel5 = id === 'navegante' ? Math.ceil(OF.UMBRALES[5] / xp) * OF.METROS_REMO : '';
  filas.push(fila);
}
console.log('# Acciones hasta cada nivel de oficio\n');
console.table(filas);
console.log('\nUmbrales de experiencia:', OF.UMBRALES.join(', '));
console.log('\n# Qué usa cada puesto de empleo para ascender (nivel de oficio)\n');
console.table(EM.IDS_PUESTOS.map((k) => ({ puesto: k, oficio: EM.PUESTOS[k].oficio, sueldos: EM.PUESTOS[k].sueldos.join(' / '), turno: `${EM.PUESTOS[k].desde}-${EM.PUESTOS[k].hasta} h` })));
console.log('Escalones:', EM.ESCALONES.map((e) => `${e.nombre}: ${e.dias} días y nivel ${e.nivelOficio}`).join(' · '));
console.log('\n# Qué da el jornal por nivel de habilidad (cada ' + TR.JORNAL.hechosPorNivel + ' jornales en ese local, +' + TR.JORNAL.porNivel * 100 + ' %, tope nivel ' + TR.JORNAL.nivelMax + ')\n');
console.log('Jornales para el nivel máximo en un local:', TR.JORNAL.hechosPorNivel * TR.JORNAL.nivelMax, '· con dos jornales por día repartidos en 20 locales, un local llega a su nivel máximo recién a los', Math.round((TR.JORNAL.hechosPorNivel * TR.JORNAL.nivelMax * 20) / TR.JORNAL.porDia), 'días');
const bases = Object.entries(TR.TRABAJOS).map(([k, v]) => v.base).sort((a, b) => a - b);
console.log('Jornales base: de', bases[0], 'a', bases[bases.length - 1], '· mediana', bases[Math.floor(bases.length / 2)]);
