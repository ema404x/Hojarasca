const { app, BrowserWindow } = require('electron'); const fs = require('fs'); const path = require('path');
const raiz = path.resolve(__dirname, '..'); const salidaDir = path.join(__dirname, 'salidas'); fs.mkdirSync(salidaDir, { recursive: true });
const log = (...a) => fs.appendFileSync(path.join(salidaDir, 'refugio.txt'), a.join(' ') + '\n');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 900, height: 500, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = e.message.slice(0,200); if (!/Security|Clock|PCF|GL_INVALID/.test(m)) log('CONSOLE', e.level, m); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const H = 'window.__hojarasca';
  await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
  await js(`localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado'})); localStorage.removeItem('hojarasca-v1'); 1`);
  await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
  for (let i = 0; i < 320; i++) { await wait(1000); if (await js(`!!window.__hojarasca`)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`); await wait(3500);
  log(await js(`(()=>{ const H=${H}, r=H.T.lugares.refugio, rot=r.rot, W=7, D=5.5;
    const w2=(lx,lz)=>({x:r.x+lx*Math.cos(rot)+lz*Math.sin(rot), z:r.z-lx*Math.sin(rot)+lz*Math.cos(rot)});
    const local=(p)=>{ const dx=p.x-r.x, dz=p.z-r.z; return { lx:dx*Math.cos(rot)-dz*Math.sin(rot), lz:dx*Math.sin(rot)+dz*Math.cos(rot) }; };
    const caminar = (desde, hacia, cuadros=110) => {
      const a=w2(...desde), b=w2(...hacia);
      H.jugador.ubicar(a.x, a.z, Math.atan2(-(b.x-a.x), -(b.z-a.z)));
      H.jugador.estado.pos.y = r.y + 0.6;
      for (let k=0;k<15;k++) H.jugador.actualizar(0.03);
      document.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyW', bubbles:true}));
      for (let k=0;k<cuadros;k++) H.jugador.actualizar(0.03);
      document.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyW', bubbles:true}));
      const l = local(H.jugador.estado.pos); return { lx:+l.lx.toFixed(2), lz:+l.lz.toFixed(2), y:+(H.jugador.estado.pos.y-r.y).toFixed(2) };
    };
    const res = {};
    // 1) las cuatro paredes frenan desde adentro (se arranca en el centro libre)
    const centro = [-1.0, 0.8];
    res.paredFondo   = caminar(centro, [-1.0, -D/2 - 2]);   // hacia -z
    res.paredIzq     = caminar(centro, [-W/2 - 2, 0.8]);    // hacia -x
    res.paredDer     = caminar([0, 0.8], [W/2 + 2, 0.8]);   // hacia +x (evita la mesa)
    res.paredFrenteSinPuerta = caminar([-2.0, 0.8], [-2.0, D/2 + 2]);   // frente, lejos de la puerta
    // 2) la puerta deja pasar (con la puerta abierta)
    const p = H.puertas.lista.find(q=>q.nombre.includes('refugio')); p.objetivo=1; p.abierta=1; if (p.col) p.col.alturaMax=-999;
    res.porLaPuerta = caminar([0, 0.8], [0, D/2 + 3], 140);
    // 3) la cama es pisable: se llega por el pasillo libre entre la mesa y la pared derecha
    res.cama = caminar([2.9, 0.4], [2.6, -D/2 + 0.75], 120);
    // 4) el piso sostiene en cuatro puntos libres
    res.pisoFirme = [[-2.5, 1.5], [0, 1.5], [-2.8, -1.0], [3.0, 1.2]].every(([lx,lz]) => {
      const q=w2(lx,lz); H.jugador.estado.pos.set(q.x, r.y + 0.9, q.z); H.jugador.estado.vel.set(0,0,0);
      for (let k=0;k<60;k++) H.jugador.actualizar(0.03);
      return Math.abs(H.jugador.estado.pos.y - (r.y + 0.37)) < 0.15; });
    return JSON.stringify(res); })()`));
  log('FIN'); app.quit();
});
