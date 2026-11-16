// 4.29.0 (C): los escenarios de capturas-4-29-0-c.cjs que arman algo antes de mirar (gente en el refugio, la cocina, las cinemáticas, el bosque).
// Cada escenario: `antes` (JS de la página, puede esperar), `donde` (la pose de la cámara), `preModo(modo)` (antes de las tomas de Alta y de Ultra),
// `paso` (entre toma y toma; `__K__` es el número de toma), `fotos`, `medir` y `despues`.
const A_PLAZO = `const dormir = (ms) => new Promise((r) => setTimeout(r, ms));`;

// la gente en fila delante de la cámara, para ver la ropa y el pelo (a 2,6 m, vista de costado respecto del viento)
const GENTE = (claves) => `(async () => {
  const H = window.__hojarasca, T = H.T, M = H.__escenas && H.__escenas.mundo; const L = T.lugares.refugio;
  const A = H.__aldeaMundo && H.__aldeaMundo(); const sp = A && A.estadoEdificio('plaza').sitio; const x0 = sp ? sp.x + 6 : L.x + 14, z0 = sp ? sp.z - 2 : L.z + 6;
  const claves = ${JSON.stringify(claves)};
  let n = 0;
  for (const c of claves) {
    const g = (H.gente.gente || []).find((q) => q.clave === c); if (!g || !M) continue;
    M.capturar(c);
    const x = x0 + (n - (claves.length - 1) / 2) * 1.0, z = z0;
    M.teletransportar(c, { x, z }, { x, z: z0 - 6 }); g.pos.x = x; g.pos.z = z; n++;
  }
  window.__gentePuesta = { x0, z0, n };
  return n;
})()`;
const RECORTE_GENTE = `(() => { const H = window.__hojarasca, g = window.__gentePuesta; const c = H.camara; c.updateMatrixWorld(); const ancho = window.innerWidth, alto = window.innerHeight; const pr = (x, y, z) => { const v = c.localToWorld ? null : null; const p = new H.THREE.Vector3(x, y, z).project(c); return { x: (p.x * 0.5 + 0.5) * ancho, y: (-p.y * 0.5 + 0.5) * alto }; }; const y0 = H.T.altura(g.x0, g.z0); const a = pr(g.x0 - 1.6, y0 + 2.0, g.z0), b = pr(g.x0 + 1.6, y0 - 0.1, g.z0); return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) } })()`;
const DONDE_GENTE = `(()=>{ const T = H.T, L = T.lugares.refugio; const A = H.__aldeaMundo && H.__aldeaMundo(); const sp = A && A.estadoEdificio('plaza').sitio; const x0 = sp ? sp.x + 6 : L.x + 14, z0 = sp ? sp.z - 2 : L.z + 6; const x = x0, z = z0 - 2.6; return { x, z, y: T.altura(x0, z0) + 1.25, yaw: Math.PI, horas: 11 } })()`;

module.exports = {
  'gente-viento': {
    pitch: -0.03, fov: 40, fotos: 3, cuadrosEntre: 6,
    antes: `(async () => { ${A_PLAZO} const H = window.__hojarasca; window.__CAP.viento(1.0); return ${GENTE(['aldea-abuela', 'aldea-nelida'])} })()`,
    donde: DONDE_GENTE, recorte: RECORTE_GENTE,
    // tres momentos de la ráfaga: en calma, a medias y en la cresta (el reloj del viento se pone para que la cresta pase por la fila)
    paso: `(() => { const g = window.__gentePuesta; return window.__CAP.ola(g.x0, g.z0, [0, 0.5, 1][__K__]) })()`,
    medir: `(() => { const H = window.__hojarasca; return { viento: window.__UU().uViento.value, lluvia: window.__UU().uLluvia.value } })()`,
  },
  'gente-mojada': {
    pitch: -0.03, fov: 44, fotos: 1, cuadrosEntre: 6,
    antes: `(async () => { ${A_PLAZO} const H = window.__hojarasca; window.__CAP.viento(0.5); return ${GENTE(['aldea-abuela', 'aldea-nelida'])} })()`,
    donde: DONDE_GENTE, recorte: RECORTE_GENTE,
    preModo: (modo) => `(() => { const H = window.__hojarasca; for (const g of (H.gente.gente || [])) if (g.__est) g.__est.mojado = ${modo === 'ultra' ? 1 : 1}; return 1 })()`,
    paso: `(() => { const H = window.__hojarasca; for (const g of (H.gente.gente || [])) if (g.__est && g.malla !== null) { g.__est.mojado = 1; if (g.__est.malla && g.__est.malla.skeleton) g.__est.malla.skeleton.mojado = 1; } return 1 })()`,
  },
  // la misma gente, seca, de contraste (con lluvia forzada igual, pero sin mojar)
  'gente-seca': {
    pitch: -0.03, fov: 44, fotos: 1, cuadrosEntre: 6,
    antes: `(async () => { ${A_PLAZO} const H = window.__hojarasca; window.__CAP.viento(0.5); return ${GENTE(['aldea-abuela', 'aldea-nelida'])} })()`,
    donde: DONDE_GENTE,
    paso: `(() => { const H = window.__hojarasca; for (const g of (H.gente.gente || [])) if (g.__est) { g.__est.mojado = 0; if (g.__est.malla && g.__est.malla.skeleton) g.__est.malla.skeleton.mojado = 0; } return 1 })()`,
  },
  // el bosque en otoño: las hojas que caen (tomas seguidas, con el reloj del viento corrido ~1 s entre una y otra)
  'hojas': {
    pitch: 0.1, fov: 62, fotos: 3, cuadrosEntre: 4,
    // un lugar con bosque de verdad (la máscara del bosque del terreno arriba de 0,9 alrededor), cerca del refugio, mirando hacia donde más se espesa
    donde: `(()=>{ const H0 = H, T = H.T, L = T.lugares.refugio, N = 513; const b = (x, z) => { const i = Math.floor((x + 512) / 2), j = Math.floor((z + 512) / 2); return i < 0 || j < 0 || i >= N || j >= N ? 0 : T.bosque[j * N + i]; };
      let mejor = null;
      for (let r = 14; r < 160 && !mejor; r += 6) for (let a = 0; a < 6.28 && !mejor; a += 0.3) { const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; if (T.agua(x, z) || b(x, z) < 0.9) continue; let s = 0, n = 0; for (let k = 0; k < 16; k++) for (const d of [6, 12]) { s += b(x + Math.cos(k * 0.39) * d, z + Math.sin(k * 0.39) * d); n++; } if (s / n > 0.88) mejor = { x, z }; }
      if (!mejor) return null;
      let ya = 0, mx = -1; for (let k = 0; k < 16; k++) { let s = 0; for (const d of [8, 16, 24]) s += b(mejor.x - Math.sin(k * 0.39) * d, mejor.z - Math.cos(k * 0.39) * d); if (s > mx) { mx = s; ya = k * 0.39; } }
      return { x: mejor.x, z: mejor.z, y: T.altura(mejor.x, mejor.z) + 1.6, yaw: ya, horas: 11.5 } })()`,
    preModo: () => `(() => { window.__CAP.viento(0.9); return 1 })()`,
    paso: `(() => { const H = window.__hojarasca; window.__UU().uTiempo.value += 1.1; return 1 })()`,
  },
  // la cocina a leña con una olla de chocolate al fuego (paso 2: la olla puesta) y la pava al fondo de la plancha: el vapor
  'vapor': {
    pitch: -0.42, fov: 48, fotos: 3, cuadrosEntre: 2, asiento: 10,
    antes: `(async () => {
      ${A_PLAZO} const H = window.__hojarasca, O = H.obras, P = H.progreso, L = H.T.lugares.refugio;
      H.clima.estado.lluvia = 0; P.dia = 6; P.horas = 10.5; window.__hora = 10.5;
      Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
      P.entradas.leche = { dia: 1, hora: 9, cantidad: 2 }; P.cosas.cacao = 1; P.cosas.azucar = 1;
      const plano = H.PLANOS.find((q) => q.id === 'cocina-lena'); if (!plano) return 'no hay plano';
      O.elegir(plano); let obra = null;
      for (const d of [0, 3, 6, 9, 13, 18]) { for (let k = 0; k < 8 && !obra; k++) { const a = k * Math.PI / 4, x = L.x - 18 + Math.sin(a) * d, z = L.z - 6 + Math.cos(a) * d; const r = O.fundar(x, z, 0, H.T.altura(x, z)); if (!r.ok) continue; for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const q = O.avanzar(r.obra, P.materiales); if (!q.ok) break; } obra = r.obra; } if (obra) break; }
      O.elegir(null); if (!obra) return 'sin lugar'; P.obras = O.obras.map((o) => o.datos);
      const o = obra.datos; window.__cocinaObra = { x: o.x, z: o.z, rot: o.rot || 0, y: o.y };
      const tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); };
      const parar = (d) => { const r = o.rot || 0, x = o.x + Math.sin(r) * d, z = o.z + Math.cos(r) * d; H.jugador.ubicar(x, z, Math.atan2(-(o.x - x), -(o.z - z))); H.jugador.estado.pitch = -0.2; for (let i = 0; i < 3; i++) H.__bucle(); };
      const avanzar = (h) => { H.__cocina().actualizar(1); P.horas += h; window.__hora = P.horas; H.__cocina().actualizar(1); H.__cocinaMundo().actualizar(0.1); };
      parar(1.3); tecla('KeyE'); await dormir(300);
      const li = [...document.querySelectorAll('#cocina-panel li')].map((q) => q.textContent); const i = li.findIndex((q) => /Chocolate caliente/.test(q)); if (i < 0) return 'sin receta: ' + JSON.stringify(li);
      tecla('Digit' + (i + 1)); await dormir(300);
      avanzar(0.6); parar(1.3); tecla('KeyE'); await dormir(300);
      const c = H.__cocina().coccionDe(obra); return JSON.stringify(c);
    })()`,
    donde: `(()=>{ const o = window.__cocinaObra; if (!o) return null; const r = o.rot, x = o.x + Math.sin(r) * 1.35, z = o.z + Math.cos(r) * 1.35; return { x, z, y: o.y + 1.5, yaw: Math.atan2(-(o.x - x), -(o.z - z)), horas: window.__hora } })()`,
    paso: `(() => { const H = window.__hojarasca; for (let i = 0; i < 40; i++) H.__cocinaMundo().actualizar(0.07); return 1 })()`,
    medir: `(() => { const H = window.__hojarasca; return H.__cocinaMundo().medir() })()`,
  },
  // (diagnóstico: la plaza de la auditoría, con la cámara medida)
  'plaza': {
    pitch: 0.03, fov: 62, fotos: 1,
    // (todo lo que se anima con el reloj del cielo y del viento, quieto en el mismo valor, para comparar dos páginas)
    preModo: `(() => { const H = window.__hojarasca, U = window.__UU(); window.__CAP.viento(0.5); U.uTiempo.value = 200; return 1 })()`,
    paso: `(() => { const U = window.__UU(); U.uTiempo.value = 200; return 1 })()`,
    donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: 12 } })()`,
    medir: `(() => { const H = window.__hojarasca, c = H.camara; return { fov: c.fov, aspect: c.aspect, near: c.near, far: c.far, zoom: c.zoom, pos: [c.position.x, c.position.y, c.position.z], rot: [c.rotation.x, c.rotation.y, c.rotation.z], pr: H.renderer.getPixelRatio(), ancho: window.innerWidth } })()`,
  },
  'cine': {
    preModo: `(async () => { const H = window.__hojarasca; for (let i = 0; i < 100; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 16)); } return 1 })()`,   // (el desenfoque entra con el reloj: ~1 s de cuadros de verdad)
    recorte: `({ x: 600, y: 120, w: 480, h: 270 })`,
    pitch: 0, fov: 55, fotos: 1, cuadrosEntre: 3, asiento: 20,
    antes: `(async () => {
      ${A_PLAZO} const H = window.__hojarasca;
      H.progreso.horas = 11; window.__hora = 11;
      const ok = H.__escenas.disparar('demo-llegada-josefina', { forzar: true });
      for (let i = 0; i < 2600; i++) {
        H.progreso.horas = 11; H.__bucle(); if (i % 5 === 4) await dormir(16);
        const d = document.getElementById('escena-dialogo');
        if (d && d.classList.contains('visible') && (d.querySelector('.texto').textContent || '').length > 20) { await dormir(1500); for (let k = 0; k < 40; k++) { H.__bucle(); await dormir(16); } window.__escenaLista = i; return i; }
      }
      return -1;
    })()`,
    // en una escena la cámara la pone el director: la pose se toma de donde está
    donde: `(()=>{ const c = H.camara.position; return { x: c.x, y: c.y, z: c.z, yaw: H.camara.rotation.y, horas: 11 } })()`,
    sinPoner: true,
    despues: `(() => { const H = window.__hojarasca; try { H.__escenas.saltar(); } catch (e) {} for (let i = 0; i < 200; i++) H.__bucle(); return 1 })()`,
  },
  'cine2': {
    preModo: `(async () => { const H = window.__hojarasca; for (let i = 0; i < 100; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 16)); } return 1 })()`,   // (el desenfoque entra con el reloj: ~1 s de cuadros de verdad)
    recorte: `({ x: 600, y: 120, w: 480, h: 270 })`,
    pitch: 0, fov: 55, fotos: 1, cuadrosEntre: 3, asiento: 20,
    antes: `(async () => {
      ${A_PLAZO} const H = window.__hojarasca;
      H.progreso.horas = 11; window.__hora = 11;
      const ok = H.__escenas.disparar('demo-llegada-josefina', { forzar: true });
      for (let i = 0; i < 2600; i++) {
        H.progreso.horas = 11; H.__bucle(); if (i % 5 === 4) await dormir(16);
        const d = document.getElementById('escena-dialogo');
        if (d && d.classList.contains('visible') && (d.querySelector('.texto').textContent || '').length > 20) {
          await dormir(800); const tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); };
          tecla('Enter'); await dormir(500); tecla('Enter'); await dormir(300);
          for (let k = 0; k < 120; k++) { H.__bucle(); await dormir(16); }
          window.__escenaLista = i; const E = H.__escenas.director.camara(); return JSON.stringify({ texto: d.querySelector('.texto').textContent.slice(0, 40), cine: window.__cine, foco: E && E.foco, cam: E && [E.x, E.y, E.z] }); }
      }
      return -1;
    })()`,
    // en una escena la cámara la pone el director: la pose se toma de donde está
    donde: `(()=>{ const c = H.camara.position; return { x: c.x, y: c.y, z: c.z, yaw: H.camara.rotation.y, horas: 11 } })()`,
    sinPoner: true,
    despues: `(() => { const H = window.__hojarasca; try { H.__escenas.saltar(); } catch (e) {} for (let i = 0; i < 200; i++) H.__bucle(); return 1 })()`,
  },
};
