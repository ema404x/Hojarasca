// 4.12.2: las escenas de captura de la partida real (humo-4-12-2-animales.cjs): cada una es el cuerpo de una función async dentro de la página (A, H)
// y devuelve las hojas de cuadros seguidos. La cámara es fija (`__camaraFija`, sólo con ?debug=1) y el jugador queda bajo ella (de ahí sale el LOD).
const comun = String.raw`
  const T = H.T, B = A.base, J = H.jugador.estado;
  const lejos = () => A.jugadorEn(B.x - 45, B.z + 45, 0);
  const poner = (c, x, z, rumbo) => { c.pos.set(x, T.altura(x, z), z); c.rumbo = rumbo; c.g.rotation.y = rumbo; c.vel = 0; };
`;
const E = {};
// el ciervo quieto, pastando (cabeza baja), de costado y de frente
E['ciervo-pasta'] = comun + String.raw`
  const c = A.ciervos()[0]; lejos(); poner(c, B.x, B.z, 1.2);
  const fijar = () => { c.estado = 'pastar'; c.t = 99; };
  A.fov = 18; fijar(); A.vista(c.pos, 14, 1.2 + Math.PI / 2, 0.6, 0.9); await A.cuadros(200, 12);
  const fotos = [];
  fotos.push(...await A.secuencia(1, 30, 0.9, () => { fijar(); A.vista(c.pos, 14, 1.2 + Math.PI / 2, 0.6, 0.9); }));
  fotos.push(...await A.secuencia(1, 30, 0.9, () => { fijar(); A.vista(c.pos, 14, 1.2 + Math.PI / 4, 0.6, 0.9); }));
  fotos.push(...await A.secuencia(1, 30, 0.9, () => { fijar(); A.vista(c.pos, 14, 1.2, 0.6, 0.9); }));
  A.fov = 32;
  const piel = c.piel && c.piel.activa;
  return { fotos: [await A.hoja(fotos, 2, 683)], info: { piel, estado: c.estado } };
`;
E['ciervo-camina'] = comun + String.raw`
  const c = A.ciervos()[0]; lejos(); poner(c, B.x, B.z, 0);
  const seguir = () => { c.estado = 'caminar'; c.t = 99; c.obj = { x: c.pos.x + Math.sin(c.rumbo) * 20, z: c.pos.z + Math.cos(c.rumbo) * 20 }; A.vista(c.pos, 5, c.rumbo + Math.PI / 2, 1.1, 0.9); };
  seguir(); await A.cuadros(60, 12);
  const f1 = await A.secuencia(6, 70, 0.88, seguir);
  return { fotos: [await A.hoja(f1, 3, 683)], info: { piel: c.piel && c.piel.activa, vel: c.vel, marcha: c.marcha } };
`;
E['ciervo-huye'] = comun + String.raw`
  const c = A.ciervos()[0]; lejos(); poner(c, B.x, B.z, 0);
  // el jugador cerca, para que dispare la huida
  A.jugadorEn(B.x, B.z + 9, 0);
  const seguir = () => { A.vista(c.pos, 6, c.rumbo + Math.PI / 2, 1.3, 1.0); };
  c.estado = 'huir'; c.t = 5; await A.cuadros(6, 12);
  const f1 = await A.secuencia(6, 55, 0.88, () => { if (c.estado !== 'huir') { c.estado = 'huir'; c.t = 5; } seguir(); });
  return { fotos: [await A.hoja(f1, 3, 683)], info: { piel: c.piel && c.piel.activa, vel: c.vel, marcha: c.marcha, estado: c.estado } };
`;
E['perro-quieto'] = comun + String.raw`
  const P = H.perro, e = P.est; lejos();
  const J2 = H.jugador.estado; A.jugadorEn(B.x, B.z, 0);
  e.pos.set(B.x + 2.5, T.altura(B.x + 2.5, B.z), B.z); e.rumbo = 1.2; e.rumboObjetivo = 1.2; e.vel = 0;
  const f = () => { A.vista(e.pos, 2.6, 1.2 + Math.PI / 2, 0.9, 0.35); };
  await A.cuadros(80, 12);
  const f1 = await A.secuencia(2, 120, 0.9, f);
  return { fotos: [await A.hoja(f1, 2, 683)], info: { estado: e.estado, piel: P.malla.piel && P.malla.piel.activa } };
`;
E['perro-corre'] = comun + String.raw`
  const P = H.perro, e = P.est;
  A.jugadorEn(B.x, B.z, 0);
  e.pos.set(B.x + 2, T.altura(B.x + 2, B.z), B.z); e.rumbo = 0; e.rumboObjetivo = 0; e.vel = 0;
  const seguir = () => { e.estado = 'adelante'; e.t = 9; e.objetivo.set(e.pos.x + Math.sin(e.rumbo) * 20, 0, e.pos.z + Math.cos(e.rumbo) * 20); A.vista(e.pos, 2.8, e.rumbo + Math.PI / 2, 0.8, 0.35); A.jugadorEn(B.x, B.z, 0); };
  seguir(); await A.cuadros(120, 12);
  const f1 = await A.secuencia(6, 60, 0.88, seguir);
  return { fotos: [await A.hoja(f1, 3, 683)], info: { estado: e.estado, vel: e.vel } };
`;
E['perro-olfatea'] = comun + String.raw`
  const P = H.perro, e = P.est;
  A.jugadorEn(B.x, B.z, 0);
  e.pos.set(B.x + 2.5, T.altura(B.x + 2.5, B.z), B.z); e.rumbo = 1.2; e.rumboObjetivo = 1.2; e.vel = 0;
  const f = () => { e.estado = 'olfatear'; e.t = 9; e.olfateo = 1; e.objetivo.set(e.pos.x, 0, e.pos.z); A.vista(e.pos, 2.4, 1.2 + Math.PI / 2, 0.8, 0.35); A.jugadorEn(B.x, B.z, 0); };
  f(); await A.cuadros(80, 12);
  const f1 = await A.secuencia(3, 150, 0.9, f);
  return { fotos: [await A.hoja(f1, 3, 683)], info: { estado: e.estado } };
`;
E['caballo-quieto'] = comun + String.raw`
  // sin montar: queda pastando junto al palenque; lo llevamos al llano
  const cab = A.caballo(); const c = H.progreso.caballo || (H.progreso.caballo = {});
  c.x = B.x; c.z = B.z; c.yaw = 0.6; A.jugadorEn(B.x - 14, B.z + 14, 0);
  await A.cuadros(300, 12);
  const f = () => A.vista({ x: B.x, y: T.altura(B.x, B.z), z: B.z }, 5.5, 0.6 + Math.PI / 2, 1.3, 1.1);
  const f1 = await A.secuencia(4, 700, 0.9, f);
  return { fotos: [await A.hoja(f1, 2, 683)], info: { piel: cab.est && 1 } };
`;
E['caballo-marchas'] = comun + String.raw`
  const cab = A.caballo(); const c = H.progreso.caballo || (H.progreso.caballo = {});
  c.x = B.x; c.z = B.z; c.yaw = Math.PI; A.jugadorEn(B.x, B.z, 0);
  await A.cuadros(30, 12);
  H.montar(); await A.cuadros(30, 12);
  const J2 = H.jugador.estado;
  const sig = () => { const e = cab.est; A.vista({ x: e.x, y: T.altura(e.x, e.z), z: e.z }, 5.2, e.yaw + Math.PI / 2, 1.3, 1.0); };
  const res = {};
  const fotos = [];
  // trote: W
  A.tecla('KeyW', 'keydown'); await A.cuadros(90, 12);
  fotos.push(...await A.secuencia(3, 90, 0.88, sig)); res.trote = { vel: cab.est.vel };
  // galope: W + Shift
  A.tecla('ShiftLeft', 'keydown'); await A.cuadros(90, 12);
  fotos.push(...await A.secuencia(3, 90, 0.88, sig)); res.galope = { vel: cab.est.vel };
  A.tecla('ShiftLeft', 'keyup'); A.tecla('KeyW', 'keyup');
  return { fotos: [await A.hoja(fotos, 3, 683)], info: res };
`;
E['caballo-montado'] = comun + String.raw`
  const cab = A.caballo(); const c = H.progreso.caballo || (H.progreso.caballo = {});
  c.x = B.x; c.z = B.z; c.yaw = Math.PI; A.jugadorEn(B.x, B.z, 0);
  await A.cuadros(30, 12);
  H.montar(); await A.cuadros(30, 12);
  A.sinCamara();
  A.tecla('KeyW', 'keydown'); await A.cuadros(90, 12);
  const fotos = [];
  fotos.push(...await A.secuencia(3, 120, 0.88));
  A.tecla('ShiftLeft', 'keydown'); await A.cuadros(90, 12);
  fotos.push(...await A.secuencia(3, 120, 0.88));
  A.tecla('ShiftLeft', 'keyup'); A.tecla('KeyW', 'keyup');
  return { fotos: [await A.hoja(fotos, 3, 683)], info: { vel: cab.est.vel } };
`;

for (const k of Object.keys(E)) E[k] = 'A.jugadorAparte = ' + (/^caballo-(marchas|montado)|huye/.test(k)) + ';' + E[k];
module.exports = E;
