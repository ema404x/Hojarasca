// Prueba de partida real de la 1.11 en el Desafío: el cimiento de piedra (por el taller,
// con las teclas) y las órdenes a los compañeros (con E, mirándolos).
// Uso: npx electron pruebas/humo-1-11-desafio.cjs   → pruebas/salidas/1-11-desafio/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '1-11-desafio');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 60000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const foto = async (nombre) => fs.writeFileSync(path.join(salida, nombre + '.jpg'), (await w.webContents.capturePage()).toJPEG(72));
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); 1`);
  const aviso = (re) => js(`(async ()=>{let a=''; for(let i=0;i<40;i++){ a=document.getElementById('aviso')?.textContent||''; if(${re}.test(a)) break; await new Promise(r=>setTimeout(r,250)); } return a})()`);
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++) H.desafio.actualizar(0.05,{noche:1}); return 1})()`);
  // los vecinos caminan en el bucle de la gente: a un cuadro por segundo se lo empuja a mano
  const caminar = (seg) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:0}); H.gente.actualizar(0.05, js, H.camara, null); } return 1})()`);
  const levantar = (id, d = 5, giro = 0) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:60,tabla:60,piedra:60});
    const p=H.PLANOS.find(q=>q.id==='${id}'); O.elegir(p);
    for (const dd of [${d}, ${d}+2, ${d}+4]) for (const a of [${giro}, ${giro}+0.6, ${giro}-0.6]) {
      const ang=js.yaw+a, x=js.pos.x-Math.sin(ang)*dd, z=js.pos.z-Math.cos(ang)*dd;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
      while(r.obra.datos.etapas<r.obra.plano.etapas.length){const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break;}
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:true, x:r.obra.datos.x, z:r.obra.datos.z};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  const mirarA = (clave, d = 2) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, n=H.gente.gente.find(g=>g.clave==='${clave}');
    js.pos.x=n.pos.x+(${d}); js.pos.z=n.pos.z; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; js.yaw=Math.PI/2; js.pitch=-0.1; return 1})()`);

  try {
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);

    // ================================================================ el cimiento, por el taller
    donde = 'cimiento';
    const muro = await levantar('empalizada');
    ok(muro.ok, `se levanta una empalizada (${muro.error || 'ok'})`);
    await js(`(()=>{const H=window.__hojarasca; H.progreso.materiales.piedra=5; return 1})()`);
    await tecla('KeyK'); await esperar(400);
    for (let i = 0; i < 4; i++) {
      const cat = await js(`document.querySelector('#taller-categorias .elegido')?.textContent||''`);
      if (/Base/.test(cat)) break;
      await tecla('Tab'); await esperar(200);
    }
    const i = await js(`[...document.querySelectorAll('#taller-lista li')].findIndex(li=>/cimiento/i.test(li.textContent))`);
    const fila = await js(`document.querySelectorAll('#taller-lista li')[${i}]?.textContent||''`);
    ok(i >= 0 && /empalizada/.test(fila) && /se puede/.test(fila), `el taller ofrece el cimiento para la empalizada ("${fila.slice(0, 90)}")`);
    await tecla(`Digit${i + 1}`); await esperar(400);
    const cim = await js(`(()=>{const H=window.__hojarasca, o=H.obras.obras.find(o=>o.plano.id==='empalizada');
      return {cimiento:!!o.datos.cimiento, piedra:H.progreso.materiales.piedra, piedras:H.escena.getObjectByName('cimientos')?.count||0}})()`);
    ok(cim.cimiento && cim.piedra === 2, `con el número se echa, y cuesta tres piedras (${JSON.stringify(cim)})`);
    ok(cim.piedras > 0, `se ven las piedras al pie (${cim.piedras})`);
    const otra = await js(`document.querySelectorAll('#taller-lista li')[${i}]?.textContent||''`);
    ok(!/se puede/.test(otra), 'no se echa dos veces');
    await tecla('KeyK'); await esperar(300);
    await foto('01-cimiento');

    donde = 'excavador';
    // 2.2: el excavador de la 2.1 se mete bajo tierra si tiene una obra entre él y vos.
    // Con cimiento no se mete; sin cimiento, sí (el control, con la misma empalizada).
    const probarExcavador = () => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      for (const a of H.desafio.aliens) { a.estado='irse'; a.t=0; }
      const x=js.pos.x-Math.sin(js.yaw)*11, z=js.pos.z-Math.cos(js.yaw)*11;
      const a=H.desafio.invocar('excavador', x, z); H.progreso.horas=22;
      const vistos=new Set();
      for (let i=0;i<240;i++){ H.desafio.actualizar(0.05,{noche:1}); vistos.add(a.estado); if (a.estado==='bajoTierra') break; }
      return [...vistos]})()`);
    const conCimiento = await probarExcavador();
    ok(!conCimiento.includes('bajoTierra'), `con cimiento, el excavador no se mete por debajo (${conCimiento.join(', ')})`);
    await js(`(()=>{const o=window.__hojarasca.obras.obras.find(o=>o.plano.id==='empalizada'); o.datos.cimiento=false; return 1})()`);
    const sinCimiento = await probarExcavador();
    ok(sinCimiento.includes('bajoTierra'), `sin cimiento, la misma empalizada sí la cava (${sinCimiento.join(', ')})`);
    await js(`(()=>{const H=window.__hojarasca; H.obras.obras.find(o=>o.plano.id==='empalizada').datos.cimiento=true; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=0; } H.progreso.horas=12; return 1})()`);

    // ================================================================ las órdenes
    donde = 'compañeros';
    const inst = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; D.companeros=['ramon','ema']; H.desafio.aliados.restaurar();
      return H.desafio.aliados.companeros})()`);
    ok(inst.includes('ramon') && inst.includes('ema'), `Don Ramón y Ema en la base (${inst})`);
    await mirarA('ramon'); await esperar(1500);
    const av1 = await aviso('/Don Ramón/');
    ok(/Don Ramón: vení conmigo/.test(av1), `mirándolo, el aviso ofrece la orden siguiente ("${av1}")`);
    await mirarA('ramon'); await tecla('KeyE'); await esperar(300);
    const o1 = await js(`(()=>{const D=window.__hojarasca.progreso.desafio; return {orden:D.ordenes.ramon, nota:[...document.querySelectorAll('.nota')].map(n=>n.textContent).join(' | ').slice(-160)}})()`);
    ok(o1.orden === 'seguime' && /Vamos/.test(o1.nota), `E le da la orden y contesta (${JSON.stringify(o1)})`);
    // te alejás veinte metros: te sigue
    await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; js.pos.x+=22; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; return 1})()`);
    await caminar(8);
    const sigue = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, n=H.gente.gente.find(g=>g.clave==='ramon'); return Math.hypot(n.pos.x-js.pos.x, n.pos.z-js.pos.z)})()`);
    ok(sigue < 6, `y te sigue (${sigue.toFixed(1)} m)`);
    // el portón
    const porton = await levantar('porton-empalizada', 6, 1.2);
    ok(porton.ok, `se levanta un portón (${porton.error || 'ok'})`);
    await mirarA('ramon'); await esperar(1500);
    await mirarA('ramon'); await tecla('KeyE'); await esperar(300);
    await caminar(1.5);
    const pt = await js(`(()=>{const H=window.__hojarasca, n=H.gente.gente.find(g=>g.clave==='ramon'), r=n.ruta[0];
      return {orden:H.progreso.desafio.ordenes.ramon, d:Math.hypot(r.x-(${porton.x}), r.z-(${porton.z}))}})()`);
    ok(pt.orden === 'porton' && pt.d < 4, `"cuidá el portón": va a pararse junto al portón (${JSON.stringify(pt)})`);
    await mirarA('ema'); await esperar(1500);
    const av2 = await aviso('/Josefina/');
    ok(/Josefina: vení conmigo/.test(av2), `con Josefina también ("${av2}")`);
    await mirarA('ema'); await tecla('KeyE'); await esperar(300);
    ok((await js(`window.__hojarasca.progreso.desafio.ordenes.ema`)) === 'seguime', 'Ema te sigue');
    await foto('02-ordenes');

    // ================================================================ guardado
    donde = 'guardado';
    await js(`window.__hojarasca.guardar(); 1`);
    ok(await cargar(), 'recarga la partida');
    const re = await js(`(()=>{const H=window.__hojarasca, P=H.progreso; return {ordenes:P.desafio.ordenes, cimiento:P.obras.filter(o=>o.cimiento).length}})()`);
    ok(re.ordenes.ramon === 'porton' && re.ordenes.ema === 'seguime' && re.cimiento === 1, `al recargar siguen las órdenes y el cimiento (${JSON.stringify(re)})`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});
