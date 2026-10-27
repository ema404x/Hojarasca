// 4.12.2: ayudas compartidas por la partida real (pruebas/humo-4-12-2-animales.cjs) y la medición (herramientas/medir-animales-4-12-2.cjs):
// el trozo de página que arma una escena con animales cerca (el caballo, el perro y los ciervos delante de la cámara) y las funciones
// para ponerlos en una marcha, moverlos y sacar cuadros seguidos. Todo corre dentro de la página (`window.__A`), con `?debug=1`.
exports.PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.dormir = dormir;
  A.cuadros = async (n = 3, ms = 10) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(ms); } return 1; };
  // un llano de pasto (sin agua, pendiente suave) cerca del refugio, mirando al norte
  A.llano = () => {
    const r0 = T.lugares.refugio;
    for (let r = 25; r < 400; r += 5) for (let a = 0; a < 6.28; a += 0.12) {
      const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
      if (Math.abs(x) > 400 || Math.abs(z) > 400 || T.agua(x, z)) continue;
      let ok = true, y0 = T.altura(x, z);
      for (let dx = -12; dx <= 12 && ok; dx += 6) for (let dz = -12; dz <= 12 && ok; dz += 6) if (T.agua(x + dx, z + dz) || Math.abs(T.altura(x + dx, z + dz) - y0) > 0.7) ok = false;
      if (ok) return { x, z };
    }
    return { x: r0.x + 40, z: r0.z + 40 };
  };
  A.ciervos = () => (H.bichos && H.bichos._debug && H.bichos._debug.ciervos) || [];
  A.huemules = () => (H.vida && H.vida._debug && H.vida._debug.huemules) || [];
  A.caballo = () => H.__caballo();
  // la cámara fija (sólo para las capturas): mirando a (x, y, z) desde la posición dada
  A.camara = (px, py, pz, mx, my, mz) => {
    const dx = mx - px, dy = my - py, dz = mz - pz;
    H.__camaraFija = { x: px, y: py, z: pz, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  };
  A.sinCamara = () => { H.__camaraFija = null; };
  // el jugador quieto y lejos de los animales (para que no los espante), mirando para otro lado
  A.jugadorEn = (x, z, yaw = 0) => {
    const j = J.estado; j.pos.set(x, T.altura(x, z) + 1.65, z); j.vel.set(0, 0, 0); j.vy = 0; j.yaw = yaw; j.pitch = -0.1;
  };
  // los animales de la escena: el ciervo, el huemul, el perro y el caballo a la vista y en fila
  A.estado = () => {
    const c = A.ciervos(), cab = A.caballo(), pe = H.perro;
    return {
      ciervos: c.map((q) => ({ piel: !!q.piel, activa: !!(q.piel && q.piel.activa), x: +q.pos.x.toFixed(1), z: +q.pos.z.toFixed(1), estado: q.estado, vel: +(q.vel || 0).toFixed(2) })),
      perro: { piel: !!(pe.malla && pe.malla.piel), activa: !!(pe.malla && pe.malla.piel && pe.malla.piel.activa) },
      caballo: { piel: !!(cab && cab.malla && cab.malla.userData && 0) },
    };
  };
  // un cuadro seguido de otro, a ritmo parejo: devuelve las imágenes (JPEG en data URL) para guardarlas
  A.secuencia = async (n, ms, calidad = 0.92, antes = null) => {
    const R = H.renderer, out = [];
    for (let i = 0; i < n; i++) {
      await dormir(ms);
      if (antes) antes(i);
      H.__bucle();
      out.push(R.domElement.toDataURL('image/jpeg', calidad));
    }
    return out;
  };
  // la cámara fija mirando a un animal desde el costado (ang = 0: de frente al norte), a dist metros y alto sobre el piso
  A.vista = (pos, dist, ang, alto = 1.2, mira = 0.9) => { A.camara(pos.x + Math.sin(ang) * dist, pos.y + alto, pos.z + Math.cos(ang) * dist, pos.x, pos.y + mira, pos.z); };
  // varios cuadros en una sola hoja (cols columnas), para verlos juntos
  A.hoja = async (urls, cols = 3, ancho = 683) => {
    const imgs = await Promise.all(urls.map((u) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = u; })));
    const alto = Math.round(ancho * imgs[0].height / imgs[0].width), filas = Math.ceil(imgs.length / cols);
    const c = document.createElement('canvas'); c.width = ancho * cols; c.height = alto * filas;
    const x = c.getContext('2d');
    imgs.forEach((im, k) => x.drawImage(im, (k % cols) * ancho, Math.floor(k / cols) * alto, ancho, alto));
    return c.toDataURL('image/jpeg', 0.9);
  };
  return 1;
})()`;
