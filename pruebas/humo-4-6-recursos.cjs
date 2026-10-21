// 4.6 recursos · LOS RECURSOS DE ZONA, en una partida de verdad (Electron + WebGL), con capturas.
//   1. las herramientas de zona: el pico de cantero no se vende sin picapedrero 3 ni sin plata; con eso, sí (como lo hará el cantero);
//   2. la cantera: el frente de roca se ve, el pico común no lo labra, el de cantero sí (tres golpes, +6 piedras de cantera) y vuelve en 2 días;
//   3. el mallín: el juncal y las hierbas con la hoz (+3 y +2), quedan al ras y vuelven al otro día;
//   4. la desembocadura: la barranca con la pala de arcilla (+4) y vuelve en 2 días;
//   5. los pehuenes del mirador en otoño: +6 piñones, una vez por otoño;
//   6. la mochila con los materiales y las herramientas nuevas, y lo guardado que vuelve igual al recargar.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-6-recursos.cjs     (las capturas, en HOJ_SALIDA o salida-cantina\recursos-zona)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/recursos-zona';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const errores = [];
  let w = null;
  const nuevaVentana = () => {
    w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
    w.webContents.on('console-message', (e) => {
      const m = String(e.message);
      if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 400));
    });
    w.focus();
  };
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 90 s')), 90000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; } return false; };
  const AYUDA = `window.H = window.__hojarasca;
    window.cuadros = async (n = 4) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 5)); } };
    window.tecla = async (code, n = 4) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); await cuadros(n); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); await cuadros(1); };
    // parado en (x, z) mirando hacia (hx, hz), un poco hacia abajo
    window.ir = (x, z, hx = x, hz = z - 1) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); j.vel.set(0, 0, 0); j.vy = 0; j.yaw = Math.atan2(-(hx - x), -(hz - z)); j.pitch = -0.3; };
    window.notas = () => document.getElementById('notas')?.innerText || '';
    window.mat = (k) => H.progreso.materiales?.[k] || 0;
    1`;
  const juego = () => js(`(() => { const p = document.getElementById('pausa'); if (p && !p.classList.contains('oculto')) H.volverAlJuego(true); return 1 })()`);
  const cuadros = (n = 4) => js(`cuadros(${n}).then(() => 1)`);
  const tecla = (code, n = 4) => js(`tecla('${code}', ${n}).then(() => 1)`);
  const aviso = () => js(`(H.__avisoYa() || {}).texto || ''`);
  const entrar = async () => {
    ok(await listo(), 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
  };
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'}));`;
  const foto = async (nombre) => {
    await esperar(150);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  // ir a un lugar y dejar que el mundo se acomode (la vegetación, los recursos: se revisan una vez por segundo)
  const llegar = async (x, z, hx, hz) => { await js(`ir(${x}, ${z}, ${hx}, ${hz}); 1`); await juego(); for (let i = 0; i < 4; i++) { await cuadros(15); await esperar(300); } };
  const apretarE = async () => { await juego(); await tecla('KeyE', 3); await cuadros(4); };

  try {
    nuevaVentana();
    await abrir();
    await js(`localStorage.clear(); ${ajustes} 1`);
    await abrir();
    await entrar();
    await js(`(() => { const P = H.progreso; P.horas = 11; P.dia = 2; P.cosas = { hacha: 1, pico: 1 }; P.economia = { ...P.economia, pesos: 2000 }; 1 })()`);

    // ---- 1. las herramientas de zona: vender el pico de cantero (como el cantero) y dar las otras
    let r = await js(`H.__recursosZona.vender('pico-cantero')`);
    ok(!r.ok && r.motivo === 'oficio', `sin picapedrero 3 no lo venden (${r.texto})`);
    await js(`(() => { H.progreso.oficios.xp.picapedrero = 300; 1 })()`);
    r = await js(`H.__recursosZona.vender('pico-cantero')`);
    ok(!r.ok && r.motivo === 'plata', `con el oficio pero con $2.000, falta plata (${r.texto})`);
    await js(`(() => { H.progreso.economia.pesos = 6000; 1 })()`);
    r = await js(`H.__recursosZona.vender('pico-cantero')`);
    ok(r.ok && await js(`H.progreso.cosas['pico-cantero'] === 1 && H.progreso.economia.pesos === 2000`), `con todo, te lo vende por $4.000 (${r.texto})`);
    ok(await js(`H.__recursosZona.dar('hoz-junco').ok && H.__recursosZona.dar('pala-arcilla').ok && H.__recursosZona.dar('cuchillo-cuero').ok`), 'las otras tres, de regalo');

    // ---- 2. la cantera
    await js(`(() => { const P = H.progreso; P.cosas['pico-cantero'] = 0; 1 })()`);
    await llegar(-401.5, -303, -405, -305);
    await foto('1-cantera-frente-de-roca');
    let t = await aviso();
    ok(/pico de cantero/.test(t), `con el pico común, el aviso pide el de cantero (${t})`);
    await apretarE();
    ok(await js('mat("piedra-cantera")') === 0, 'y la E no saca nada');
    await js(`(() => { H.progreso.cosas['pico-cantero'] = 1; 1 })()`);
    await llegar(-401.5, -305, -405, -305);
    t = await aviso();
    ok(t === 'Labrar la veta (6 piedras de cantera)', `con el de cantero: «${t}»`);
    for (let i = 0; i < 3; i++) await apretarE();
    ok(await js('mat("piedra-cantera")') === 6, `tres golpes: +6 piedras de cantera (${await js('mat("piedra-cantera")')})`);
    t = await aviso();
    ok(/vuelve a dar piedra en 2 días/.test(t), `la veta vuelve en 2 días (${t})`);
    await cuadros(30);
    await foto('2-cantera-labrada');

    // ---- 3. el mallín
    await llegar(-263, -237, -265, -239);
    await foto('3-mallin-juncal');
    t = await aviso();
    ok(t === 'Cortar junco (3 juncos)', `el juncal: «${t}»`);
    await apretarE();
    ok(await js('mat("junco")') === 3, '+3 juncos');
    await llegar(-254, -242, -256, -244);
    t = await aviso();
    ok(t === 'Cortar hierbas (2 atados de hierbas)', `las hierbas: «${t}»`);
    await apretarE();
    ok(await js('mat("hierbas")') === 2, '+2 atados de hierbas');
    await llegar(-263, -237, -265, -239);
    await foto('4-mallin-cortado');
    ok(/vuelve a crecer en 1 día/.test(await aviso()), 'el junco vuelve al otro día');
    ok(await js(`H.__recursosZona.mundo().mallas.juncal.ras.visible`), 'y queda al ras');

    // ---- 4. la desembocadura
    await llegar(51, 46.5, 52, 45);
    await foto('5-barranca-arcilla');
    t = await aviso();
    ok(t === 'Sacar arcilla (4 terrones de arcilla)', `la barranca: «${t}»`);
    await apretarE();
    ok(await js('mat("arcilla")') === 4, '+4 de arcilla');

    // ---- 5. se repone: al otro día el junco, a los dos la veta y la arcilla
    await js(`(() => { H.progreso.dia = 3; 1 })()`);
    await llegar(-263, -237, -265, -239);
    ok(await aviso() === 'Cortar junco (3 juncos)', 'al otro día, el junco creció');
    ok(!(await js(`H.__recursosZona.mundo().mallas.juncal.ras.visible`)), 'y se ve crecido');
    await apretarE();
    ok(await js('mat("junco")') === 6, '+3 juncos más');
    await llegar(-401.5, -305, -405, -305);
    ok(/vuelve a dar piedra en 1 día/.test(await aviso()), 'la veta todavía no');
    await js(`(() => { H.progreso.dia = 4; 1 })()`);
    await llegar(-401.5, -305, -405, -305);
    for (let i = 0; i < 3; i++) await apretarE();
    ok(await js('mat("piedra-cantera")') === 12, 'a los dos días, la veta da otras 6');

    // ---- 6. los pehuenes en otoño (día 6: en «auto», el otoño son los días 5 a 8)
    await js(`(() => { H.progreso.dia = 6; 1 })()`);
    const pe = await js(`(() => { const a = H.__recursosZona.mundo().pehuenes()[0]; return { x: a.x, z: a.z, r: a.r } })()`);
    await llegar(pe.x + pe.r + 1.0, pe.z, pe.x, pe.z);
    t = await aviso();
    const pinAntes = await js(`H.progreso.entradas.pinon?.cantidad || 0`);
    ok(/Juntar los piñones del pehuén|piñón/i.test(t), `al pie del pehuén, en otoño: «${t}» (si hay un piñón suelto mirando, ése gana: es el de siempre)`);
    if (/Juntar los piñones del pehuén/.test(t)) {
      await apretarE();
      ok(await js(`H.progreso.entradas.pinon?.cantidad || 0`) === pinAntes + 6, '+6 piñones');
      ok(/ya dio sus piñones/.test(await aviso()), 'y ese pehuén ya dio este otoño');
    }
    await foto('6-pehuen-otono');

    // ---- 7. la mochila y lo guardado
    const moch = await js(`(() => { H.abrir?.('mochila'); return document.getElementById('mochila')?.innerText || '' })()`);
    console.log('  (mochila: ' + moch.replace(/\n/g, ' | ').slice(0, 300) + ')');
    await juego();
    await js(`H.guardar(); 1`); await esperar(400);
    const g = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(g.recursosZona && g.recursosZona.usos.cantera === 4 && g.recursosZona.usos.juncal === 3 && g.recursosZona.usos.arcilla === 2, `lo usado queda guardado (${JSON.stringify(g.recursosZona)})`);
    ok(g.materiales.junco === 6 && g.materiales['piedra-cantera'] === 12 && g.cosas['pico-cantero'] === 1 && g.cosas.pico === 1, 'los materiales y las herramientas, también (y el pico común sigue)');
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await js(AYUDA);
    const v = await js(`({ z: H.progreso.recursosZona, j: H.progreso.materiales.junco, p: H.progreso.cosas['pico-cantero'] })`);
    ok(v.z?.usos?.cantera === 4 && v.j === 6 && v.p === 1, `al recargar, todo igual (${JSON.stringify(v)})`);
  } catch (err) {
    errores.push('EXCEPCIÓN: ' + (err && err.stack ? err.stack : err));
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.6 recursos de zona, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch {}
  salir(errores.length ? 1 : 0);
});
