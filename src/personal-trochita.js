// 2.8: "La trochita": la pintura de los coches, el nombre de la locomotora y el silbato.
// Módulo puro (se prueba en Node). La pintura y el nombre los pone `trochita.js`; el
// silbato lo sintetiza `sonido.js` con los caños que dice `SILBATOS`.
import { registrarSeccion, elegir, color, texto } from './personalizacion.js';
import { campoColores, campoElegir, campoTexto, boton, refDelMundo, TINTAS, MADERAS } from './personal-campos.js';

// 2.8: los silbatos. Cada uno es el mismo silbato de vapor de siempre (`sonido.silbato`)
// con otros caños y otros toques: `canos` = [frecuencia, volumen] de cada caño, `toques`
// = [cuándo, cuánto dura] de cada pitada.
// 3.8.4: rehechos como los de un ferrocarril antiguo: cada caño es una campana del silbato de vapor y las campanas
// están afinadas en acorde (antes eran armónicos de una sola nota: 520, 780 y 1040). `vibrato`: cuántas veces por
// segundo tiembla la presión (no un vibrato de cantante: un temblor de décimas de por ciento); `soplo`: dónde
// arranca el siseo del vapor.
export const SILBATOS = {
  // tres campanas en la menor (la, do, mi): el de las trochas de la Patagonia
  clasico: { nombre: 'El de siempre', canos: [[440, 0.085], [523, 0.07], [659, 0.05]], toques: [[0, 1.5]], vibrato: 4.5, soplo: 900 },
  // cinco campanas graves en acorde de sexta (do, mi, sol, la, do): el «aullido» de las máquinas grandes de montaña
  grave: { nombre: 'Grave, de montaña', canos: [[262, 0.08], [330, 0.065], [392, 0.055], [440, 0.045], [523, 0.03]], toques: [[0, 1.9]], vibrato: 3, soplo: 650 },
  // tres campanas chicas en sol mayor: el de las maniobras de playa
  agudo: { nombre: 'Agudo, de maniobra', canos: [[784, 0.065], [988, 0.05], [1175, 0.03]], toques: [[0, 1.1]], vibrato: 6, soplo: 1300 },
  doble: { nombre: 'Dos pitadas cortas', canos: [[440, 0.085], [523, 0.07], [659, 0.05]], toques: [[0, 0.5], [0.72, 0.62]], vibrato: 4.5, soplo: 900 },
  largo: { nombre: 'Uno largo, de llegada', canos: [[440, 0.085], [523, 0.07], [659, 0.05]], toques: [[0, 2.8]], vibrato: 4, soplo: 900 },
  // tres campanas en la mayor (la, do sostenido, mi): más alegre
  acorde: { nombre: 'De tres notas', canos: [[440, 0.08], [554, 0.06], [659, 0.05]], toques: [[0, 1.6]], vibrato: 4, soplo: 800 },
};

export function trochitaPorDefecto() {
  return { coches: '#6b4a2e', franja: '#7c2f22', cabina: '#6b4a2e', nombre: '', silbato: 'clasico' };
}

export function sanearTrochita(d) {
  const b = trochitaPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    coches: color(v.coches, b.coches),
    franja: color(v.franja, b.franja),
    cabina: color(v.cabina, b.cabina),
    nombre: texto(v.nombre, '', 18),
    silbato: elegir(v.silbato, Object.keys(SILBATOS), b.silbato),
  };
}

// el silbato elegido, con el de siempre si no se sabe cuál
export const silbatoDe = (id) => (typeof id === 'string' && Object.hasOwn(SILBATOS, id) ? SILBATOS[id] : SILBATOS.clasico);

const PINTURAS = [{ id: '#6b4a2e', nombre: 'madera' }, ...MADERAS.filter((m) => m.id !== '#6b5238'), ...TINTAS];

export const SECCION_TROCHITA = registrarSeccion({
  id: 'trochita',
  titulo: 'La trochita',
  orden: 56,
  porDefecto: trochitaPorDefecto,
  sanear: sanearTrochita,
  construir(cont, api) {
    const d = sanearTrochita(api.datos);
    campoColores(cont, 'Coches', PINTURAS, d.coches, (v) => api.cambiar({ coches: v }));
    campoColores(cont, 'Franja y frente', TINTAS, d.franja, (v) => api.cambiar({ franja: v }));
    campoColores(cont, 'Cabina y ténder', PINTURAS, d.cabina, (v) => api.cambiar({ cabina: v }));
    campoTexto(cont, 'Nombre de la locomotora', d.nombre, 18, (v) => api.cambiar({ nombre: v }), 'sin nombre');
    const opciones = Object.entries(SILBATOS).map(([id, s]) => ({ id, nombre: s.nombre }));
    let silbato = d.silbato;
    campoElegir(cont, 'Silbato', opciones, d.silbato, (v) => { silbato = v; api.cambiar({ silbato: v }); });
    // para escucharlo sin esperar al tren
    const sonido = refDelMundo(api, 'sonido');
    if (sonido && typeof sonido.silbato === 'function') {
      boton(cont, 'Escuchar el silbato', () => { try { sonido.silbato(null, silbato); } catch {} });
    }
  },
  aplicar(datos, api) {
    const d = sanearTrochita(datos);
    const tren = refDelMundo(api, 'tren', 'trochita');
    if (tren && typeof tren.personalizar === 'function') tren.personalizar(d);
    // el silbato también suena en el Desafío (el tren varado): se le dice al motor
    const sonido = refDelMundo(api, 'sonido');
    if (sonido && typeof sonido === 'object') sonido.silbatoElegido = d.silbato;
  },
});
