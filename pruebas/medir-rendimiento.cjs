// Mediciones reproducibles de rendimiento (CPU y llamadas de dibujo) en Electron.
// No mide FPS reales (la GPU del equipo de pruebas puede no existir): mide lo que
// no depende de la placa de video.
// Uso: npx electron pruebas/medir-rendimiento.cjs [etiqueta]  → pruebas/salidas/rendimiento-<etiqueta>.json
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const etiqueta = process.argv.find((a) => a.startsWith('--etiqueta='))?.split('=')[1] || 'actual';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), esperar(180000).then(() => { throw new Error('timeout'); })]);
  const url = path.join(raiz, 'index.html');
  const r = {};
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    // 0) el mirador: siempre el mismo punto y el mismo rumbo.
    //
    // Hasta acá la medición se tomaba desde donde hubiera quedado el jugador al cargar,
    // que depende de cuántos cuadros alcanzó a correr la máquina. Las llamadas de dibujo
    // cambiaban 400 entre una corrida y otra por eso, y con eso no se puede decir si un
    // cambio mejoró algo. Ahora se planta la cámara en un lugar fijo, mirando a un
    // rumbo fijo, a una hora fija: dos builds distintos miran exactamente lo mismo.
    r.vista = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, L = H.T.lugares;
      const p = (L && L.refugio) ? L.refugio : { x: 0, z: 0 };
      js.pos.set(p.x + 26, H.T.altura(p.x + 26, p.z + 26) + 1.65, p.z + 26);
      // mirando hacia el refugio: en cuadro entran las construcciones y el bosque
      // de atrás, que son las dos cosas que cuesta dibujar
      js.yaw = Math.PI * 0.25; js.pitch = -0.05;
      js.vel && js.vel.set && js.vel.set(0, 0, 0);
      H.progreso.horas = 21;
      return { x: +js.pos.x.toFixed(1), z: +js.pos.z.toFixed(1), yaw: +js.yaw.toFixed(3) };
    })()`);
    // unos cuadros para que el LOD y los chunks cercanos se acomoden a la vista nueva
    await esperar(6000);
    // 1) colisiones: costo de resolver() para un cuerpo que camina junto a obstáculos
    r.resolverMicroseg = await js(`(()=>{const H=window.__hojarasca, c=H.col, js=H.jugador.estado; const p=js.pos.clone(); const t0=performance.now(); const N=20000;
      for(let i=0;i<N;i++){ p.set(js.pos.x+Math.sin(i*0.37)*6, js.pos.y, js.pos.z+Math.cos(i*0.23)*6); c.resolver(p,0.4,1.6); }
      return +((performance.now()-t0)/N*1000).toFixed(2)})()`);
    // 2) 18 invasores a la vista, a 6–20 m delante de la cámara
    await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado; H.progreso.horas=21;
      const tipos=['rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','bruto','bruto','bruto','tirador','tirador','tirador','tirador','tirador'];
      tipos.forEach((t,i)=>{ const d=6+(i%6)*2.6, l=((i/6|0)-1)*3.2 + (i%2)*0.8; const x=js.pos.x-Math.sin(js.yaw)*d+Math.cos(js.yaw)*l, z=js.pos.z-Math.cos(js.yaw)*d-Math.sin(js.yaw)*l; D.invocar(t,x,z); });
      js.pitch=0; H.jugador.actualizar(0.016); return D.aliens.length})()`);
    // 3) llamadas de dibujo y triángulos con los invasores en pantalla (con y sin ellos)
    r.dibujo = await js(`(()=>{const H=window.__hojarasca, R=H.renderer, D=H.desafio; R.info.autoReset=false;
      const medir=()=>{R.info.reset(); R.render(H.escena,H.camara); return {llamadas:R.info.render.calls, triangulos:R.info.render.triangles}};
      const con=medir(); for(const a of D.aliens) a.m.g.visible=false; const sin=medir(); for(const a of D.aliens) a.m.g.visible=true; R.info.autoReset=true;
      return {conInvasores:con, sinInvasores:sin, porInvasores:{llamadas:con.llamadas-sin.llamadas, triangulos:con.triangulos-sin.triangulos}}})()`);
    // 3b) los mismos 18 invasores, pero lejos: ahí entra la malla simplificada
    r.dibujoLejos = await js(`(()=>{const H=window.__hojarasca, R=H.renderer, D=H.desafio, js=H.jugador.estado;
      // se los corre a 60 m y se deja que el LOD se entere
      D.aliens.forEach((a,i)=>{ const d=60+(i%6)*2.6, l=((i/6|0)-1)*3.2; const x=js.pos.x-Math.sin(js.yaw)*d+Math.cos(js.yaw)*l, z=js.pos.z-Math.cos(js.yaw)*d-Math.sin(js.yaw)*l;
        a.m.g.position.set(x, H.T.altura(x,z), z); a.tLod = 0; });
      for(let i=0;i<3;i++) D.actualizar(0.016,{noche:1,dtReal:0.016});
      R.info.autoReset=false;
      const medir=()=>{R.info.reset(); R.render(H.escena,H.camara); return {llamadas:R.info.render.calls, triangulos:R.info.render.triangles}};
      const con=medir(); for(const a of D.aliens) a.m.g.visible=false; const sin=medir(); for(const a of D.aliens) a.m.g.visible=true; R.info.autoReset=true;
      return {porInvasores:{llamadas:con.llamadas-sin.llamadas, triangulos:con.triangulos-sin.triangulos}}})()`);

    // 4) CPU del Desafío por cuadro con 18 invasores activos
    r.desafioMsPorCuadro = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; for(let i=0;i<30;i++) D.actualizar(0.016,{noche:1,dtReal:0.016});
      for(const a of D.aliens){ a.vida=a.vidaMax=1e6; } const N=300, t0=performance.now();
      for(let i=0;i<N;i++){ H.progreso.horas=21; D.actualizar(0.016,{noche:1,dtReal:0.016}); } return +((performance.now()-t0)/N).toFixed(3)})()`);
    // 5) perfil de subsistemas del bucle real (unos segundos de juego)
    await js(`window.__hojarasca.perfilador.limpiar(); 1`);
    await esperar(25000);
    r.subsistemas = await js(`(()=>{const P=window.__hojarasca.perfilador; return [...P.stats.values()].sort((a,b)=>b.ema-a.ema).map(s=>({nombre:s.nombre, ms:+s.ema.toFixed(3), muestras:s.muestras}))})()`);
  } catch (e) { r.error = e.message; }
  const archivo = path.join(__dirname, 'salidas', `rendimiento-${etiqueta}.json`);
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  app.exit(0);
});
