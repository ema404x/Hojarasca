// Partida real 1.6: guía del primer día en Relax, chinches del mapa con rumbo en la
// brújula, y en Desafío el parte de la base con las defensas nuevas.
// Uso: npx electron pruebas/humo-1-6.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  try {
    // ---------------- Relax
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false})); 1`);
    ok(await cargar(), 'Relax carga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    // la guía se dibuja cuando el juego acumula 0,8 s de partida; acá eso son ~20 s de reloj
    await esperar(22000);
    const guia = await js(`(()=>{const c=document.getElementById('tutorial');
      return {visible:!c.classList.contains('oculto'), pasos:c.querySelectorAll('p').length, texto:c.textContent}})()`);
    ok(guia.visible && guia.pasos === 6, `la guía del primer día aparece en Relax (${guia.pasos} pasos)`);
    ok(/ramitas/i.test(guia.texto), 'el primer paso es juntar ramitas');
    // se tilda sola al cumplir el paso
    await js(`window.__hojarasca.progreso.ramitas = 4; 1`); await esperar(20000);
    ok(await js(`document.querySelectorAll('#tutorial p.hecho').length >= 1`), 'el paso cumplido se tilda solo');
    // y se puede apagar
    await js(`(()=>{const H=window.__hojarasca; document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.querySelector('[data-ajuste="guiaPrimerDia"] [data-valor="false"]').click();
      document.getElementById('btn-seguir').click(); return 1})()`);
    await esperar(4000);
    ok(await js(`document.getElementById('tutorial').classList.contains('oculto')`), 'se puede jugar sin la guía');

    // ---------------- chinches del mapa
    const ch = await js(`(()=>{const H=window.__hojarasca;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',bubbles:true}));
      const abierto=!document.getElementById('mapa').classList.contains('oculto');
      const lienzo=document.getElementById('lienzo-mapa'), caja=lienzo.getBoundingClientRect();
      const clic=(fx,fy,boton)=>{const ev=new MouseEvent(boton==='der'?'contextmenu':'click',{bubbles:true,clientX:caja.left+caja.width*fx,clientY:caja.top+caja.height*fy}); lienzo.dispatchEvent(ev);};
      clic(0.2,0.8);
      const puesta=H.progreso.chinches.length;
      clic(0.6,0.3);
      const dos=H.progreso.chinches.length;
      clic(0.6,0.3,'der');   // la segunda se saca: queda la primera, que sigue siendo el rumbo
      clic(0.2,0.8);         // y se vuelve a elegir
      return {abierto, puesta, dos, tras:H.progreso.chinches.length, nombres:H.progreso.chinches.map(c=>c.nombre)}})()`);
    ok(ch.abierto && ch.puesta === 1, `un clic en el mapa pone una chinche (${ch.puesta})`);
    ok(ch.dos === 2 && ch.tras === 1, 'el clic derecho la saca');
    ok(ch.nombres[0] === 'Chinche 1', `las chinches se nombran solas (${ch.nombres.join(', ')})`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',bubbles:true})); 1`); await esperar(4000);
    const br = await js(`(()=>{const b=document.querySelector('#brujula b.rumbo'); return {visible:b && b.style.display!=='none', texto:b?b.textContent:''}})()`);
    ok(br.visible && /Chinche 1 ·/.test(br.texto), `la brújula marca el rumbo con la distancia (${br.texto})`);
    ok(await js(`(()=>{const H=window.__hojarasca; H.guardar(); return JSON.parse(localStorage.getItem('hojarasca-v1')).chinches.length===1})()`), 'la chinche queda guardada');

    // ---------------- Desafío: parte de la base y defensas nuevas
    await js(`(()=>{const H=window.__hojarasca; H.guardar(); document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.getElementById('btn-inicio').click();
      document.querySelector('[data-ajuste="modo"] button[data-valor="desafio"]').click(); return 1})()`);
    await esperar(1500);
    ok(await cargar(), 'el Desafío carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);
    const base = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      Object.assign(P.materiales,{tronco:40,tabla:40,piedra:40,cristal:6});
      const poner=(id,d)=>{const p=H.PLANOS.find(q=>q.id===id); if(!p) return 'sin plano '+id; H.obras.elegir(p);
        for (const dd of [d,d+1.5,d+3,d+4.5]) { const x=js.pos.x-Math.sin(js.yaw)*dd, z=js.pos.z-Math.cos(js.yaw)*dd;
          const r=H.obras.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue; const a=H.obras.avanzar(r.obra,P.materiales); if(a.ok) return r.obra; return 'avanzar: '+a.motivo; }
        return 'sin lugar';};
      const emp=poner('empalizada',5), foso=poner('foso-estacas',9);
      H.obras.elegir(null); P.obras=H.obras.obras.map(o=>o.datos);
      if (typeof emp==='object') emp.datos.vida = 90;
      return {emp:typeof emp==='object'?true:emp, foso:typeof foso==='object'?true:foso}})()`);
    ok(base.emp === true, `empalizada puesta (${base.emp})`);
    ok(base.foso === true, `foso con estacas puesto (${base.foso})`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN',bubbles:true})); 1`);
    await esperar(600);
    const parte = await js(`(()=>({abierto:!document.getElementById('base').classList.contains('oculto'),
      texto:document.getElementById('base-contenido').textContent}))()`);
    ok(parte.abierto && /Murallas/.test(parte.texto), `N abre el parte de la base (${parte.texto.slice(0, 60)})`);
    ok(/Trampas/.test(parte.texto), 'las trampas se listan aparte');
    ok(/%/.test(parte.texto) && /reparala|martillo/i.test(parte.texto), `avisa lo que está roto (${parte.texto.slice(0, 120)})`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN',bubbles:true})); 1`);
    await esperar(600);
    ok(await js(`document.getElementById('base').classList.contains('oculto')`), 'N lo vuelve a cerrar');
  } catch (e) {
    errores.push('excepción: ' + (e?.message || e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
