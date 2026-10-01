// Partida real 1.9.1: que lo que se optimizó siga optimizado.
//
// Nada de esto mide cuadros por segundo —para eso está el banco, que hay que correr en
// una máquina con placa de video—. Mide lo que sí se puede medir sin GPU y es lo que
// de verdad se fue de las manos alguna vez: cuántos objetos recorre el motor por
// cuadro, cuánto tarda ese recorrido, y cuántas llamadas de dibujo salen desde un
// punto fijo del valle.
//
// Uso: npx electron pruebas/humo-rendimiento.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el valle');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);

    // ---- la fusión de lo que no se mueve, probada sobre un grupo armado a mano
    const fus = await js(`(()=>{
      const H = window.__hojarasca, T = H.THREE;
      const grupo = new T.Group();
      const mat = new T.MeshLambertMaterial({ color: 0x884422 });
      // diez cajas iguales, repartidas, con el mismo material
      let triAntes = 0;
      for (let i = 0; i < 10; i++) {
        const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), mat);
        m.position.set(i * 2, 0, i * 3);
        m.updateMatrix();
        triAntes += m.geometry.attributes.position.count / 3;
        grupo.add(m);
      }
      // una con nombre y otra con datos: ésas NO se pueden fusionar
      const conNombre = grupo.children[0].clone(); conNombre.name = 'no-me-toques'; grupo.add(conNombre);
      const conDatos = grupo.children[1].clone(); conDatos.userData.algo = 1; grupo.add(conDatos);
      // los triángulos se cuentan igual de los dos lados: indexada o no
      const tri = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
      triAntes = grupo.children.reduce((s, h) => s + (h.isMesh ? tri(h.geometry) : 0), 0);
      const antes = grupo.children.length;
      const ahorro = H.__fusionar(grupo);
      let triDespues = 0, ancho = 0;
      for (const h of grupo.children) if (h.isMesh) {
        triDespues += tri(h.geometry);
        h.geometry.computeBoundingBox();
        const bb = h.geometry.boundingBox;
        ancho = Math.max(ancho, bb.max.x - bb.min.x);
      }
      return { antes, despues: grupo.children.length, ahorro, triAntes: Math.round(triAntes), triDespues: Math.round(triDespues),
        anchoFusionado: +ancho.toFixed(1),
        quedaronNombradas: grupo.children.filter((h) => h.name === 'no-me-toques').length,
        quedaronConDatos: grupo.children.filter((h) => h.userData && h.userData.algo).length };
    })()`).catch((e) => ({ error: String(e.message || e) }));
    if (fus.error) { ok(false, 'la fusión se pudo probar: ' + fus.error); }
    else {
      ok(fus.ahorro >= 9, `fusiona diez cajas del mismo material en una (ahorro ${fus.ahorro})`);
      ok(fus.triDespues === fus.triAntes, `sin perder un triángulo (${fus.triAntes} → ${fus.triDespues})`);
      ok(fus.anchoFusionado > 15, `y cada caja queda donde estaba (${fus.anchoFusionado} m de ancho)`);
      ok(fus.quedaronNombradas === 1, 'la malla con nombre no se toca');
      ok(fus.quedaronConDatos === 1, 'la malla con datos propios tampoco');
    }

    // ---- las estructuras del valle vinieron fusionadas
    const est = await js(`(()=>{ const H = window.__hojarasca;
      return { ahorro: H.est.fusionados ? H.est.fusionados() : -1 } })()`);
    ok(est.ahorro > 0, `las estructuras del valle ahorran ${est.ahorro} llamadas de dibujo al armarse`);

    // ---- la vegetación no entra al repaso de matrices
    const mat = await js(`(()=>{
      const H = window.__hojarasca;
      let chunks = 0, fuera = 0, objetos = 0;
      H.escena.traverse((o) => { objetos++; });
      for (const o of H.escena.children) if (o.isInstancedMesh) { chunks++; if (o.matrixWorldAutoUpdate === false) fuera++; }
      // 3.3: el bosque va en chunks (grupos) que entran y salen de la escena según la distancia
      const bloques = H.veg.chunks.size, colgados = [...H.veg.chunks.values()].filter((ch) => ch.grupo.parent === H.escena).length;
      const gruposFuera = [...H.veg.chunks.values()].every((ch) => ch.grupo.matrixWorldAutoUpdate === false);
      H.escena.updateMatrixWorld();
      const t0 = performance.now(); for (let i = 0; i < 200; i++) H.escena.updateMatrixWorld();
      return { chunks, fuera, objetos, bloques, colgados, gruposFuera, impostores: !!H.veg.impostoresListos?.(), ms: +((performance.now() - t0) / 200).toFixed(4) };
    })()`);
    ok(mat.bloques > 50 && mat.colgados > 0 && mat.colgados < mat.bloques && mat.gruposFuera, `3.3: el valle tiene ${mat.bloques} chunks de vegetación y sólo ${mat.colgados} cuelgan de la escena`);
    ok(mat.impostores, '3.3: los árboles lejanos son impostores');
    // Las que quedan adentro del repaso son las pocas que sí se mueven o se rearman:
    // la malla compacta de los árboles cercanos, los tocones y las copas sueltas.
    ok(mat.fuera > mat.chunks - 60, `${mat.fuera} de ${mat.chunks} están fuera del repaso de matrices`);
    ok(mat.ms < 0.9, `el repaso de matrices tarda ${mat.ms} ms por cuadro sobre ${mat.objetos} objetos (tope 0,9)`);

    // ---- y el dibujo desde un punto fijo del valle
    const dib = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, L = H.T.lugares;
      const p = (L && L.refugio) ? L.refugio : { x: 0, z: 0 };
      js.pos.set(p.x + 26, H.T.altura(p.x + 26, p.z + 26) + 1.65, p.z + 26);
      js.yaw = Math.PI * 0.25; js.pitch = -0.05; H.progreso.horas = 21;
      return 1 })()`);
    await esperar(6000);
    const cuadro = await js(`(()=>{
      const H = window.__hojarasca, R = H.renderer;
      R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara);
      const d = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles };
      R.info.autoReset = true; return d })()`);
    ok(cuadro.llamadas < 520, `desde el refugio salen ${cuadro.llamadas} llamadas de dibujo (tope 520)`);
    ok(cuadro.triangulos < 1300000, `y ${cuadro.triangulos.toLocaleString('es')} triángulos (tope 1.300.000)`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
