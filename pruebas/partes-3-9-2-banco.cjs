// 3.9.2: la parte del BANCO de la partida real (la llama humo-3-9-2-mejoras.cjs con su contexto): el edificio por fuera y por dentro, de día y de noche
const VISTAS_DENTRO = [
  ['adentro-puerta', [0.7, 1.65, 2.65], [0, 1.3, -1.0], 78],
  ['adentro-izquierda', [2.8, 1.65, 1.7], [-3.5, 1.3, 1.9], 78],
  ['adentro-derecha', [-2.8, 1.65, 1.7], [3.5, 1.3, 1.9], 78],
  ['mostrador', [0.5, 1.65, 2.1], [0, 1.4, -0.3], 62],
  ['detras-caja-fuerte', [-0.4, 1.65, -0.2], [-3.1, 1.1, -0.6], 80],
  ['detras-escritorio', [0.4, 1.65, -0.2], [2.9, 1.0, -0.55], 80],
  ['detras-reloj', [0.4, 1.65, 0.1], [0, 2.0, 2.9], 80],
];
module.exports = async (c) => {
  const { js, ok, H, mirar, armarMundo, aLaHora, estarEn, pasar } = c;
  const ID = 'banco-pueblo', salida = process.env.HOJ_PREFIJO || '';
  console.log('— el banco por fuera y por dentro');
  await estarEn(ID);
  await aLaHora(2, 10.3);
  await armarMundo(5);
  await pasar(14);
  await mirar(`${salida}01-fachada-dia`, ID, [0.5, 1.7, 11], [0, 2.6, 0], { suelo: true, fov: 60 });
  await mirar(`${salida}02-fachada-3-4`, ID, [8, 1.7, 9], [0, 2.4, 0], { suelo: true, fov: 60 });
  await mirar(`${salida}03-galeria`, ID, [-3.2, 1.7, 6.6], [2.0, 1.2, 3.3], { suelo: true, fov: 70 });
  let i = 4;
  for (const [n, ojo, a, fov] of VISTAS_DENTRO) await mirar(`${salida}${String(i++).padStart(2, '0')}-${n}`, ID, ojo, a, { fov });
  for (const [hora, nom] of [[18.9, 'atardecer'], [21.5, 'noche']]) {
    await aLaHora(2, hora);
    await pasar(12);
    await mirar(`${salida}${nom}-fachada`, ID, [0.5, 1.7, 11], [0, 2.6, 0], { suelo: true, fov: 60 });
    await mirar(`${salida}${nom}-adentro`, ID, VISTAS_DENTRO[0][1], VISTAS_DENTRO[0][2], { fov: 78 });
    await mirar(`${salida}${nom}-mostrador`, ID, VISTAS_DENTRO[3][1], VISTAS_DENTRO[3][2], { fov: 62 });
  }
};
