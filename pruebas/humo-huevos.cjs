// 4.2 (huevos de pascua): humo en el juego real (Electron, Relax) de los easter eggs que dependen del mundo:
//  · la estrella fugaz con deseo: el cartel de tres deseos, la tecla 1/2/3, y a los 2 a 4 días la nota y el regalo chico;
//  · los duendes del Coihue (el convite, el bulto y la rueda de hongos);
//  · el huemul blanco: sale al amanecer con niebla, se ve de lejos, se anota en el cuaderno y se va caminando si te acercás;
//  · el hueso del perro: el montículo aparece un día sorteado, se excava con E y sale algo viejo y chico;
//  · el código de la portada (↑ ↑ ↓ ↓ ← → ← → B A): caen hojas de colores y se sacan solas;
//  · la radio de la madrugada (entre las 2 y las 4, en las noches con señal: un tango viejo o Morse, una vez por noche);
//  · y la consola sin errores.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/humo-huevos.cjs [salida=pruebas/salidas/huevos]
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
app.setPath('userData', path.join(require('os').tmpdir(), 'hojarasca-humo-huevos'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 8 minutos'); salir(2); }, 8 * 60 * 1000).unref?.();
const arg = process.argv.find((a) => a.startsWith('salida='));
const salida = path.resolve(raiz, arg ? arg.slice(7) : 'pruebas/salidas/huevos');
fs.mkdirSync(salida, { recursive: true });

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c).catch((e) => { console.log("ERROR en el script de la página: " + String(c).slice(0, 200)); throw e; });
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const foto = async (nombre) => { const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); };
  const out = [];
  const ok = (nombre, cond, dato) => { out.push({ nombre, ok: !!cond, dato }); };
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est && ${H}.__huevos)`).catch(() => false)) break; }
  // ------------------------------------------------------------ 6a) el código de la portada (antes de entrar)
  {
    const tecla = (c) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(c)}, bubbles: true })); 1`);
    const en = await js("(() => { const i = document.getElementById('inicio'); return !!i && !i.classList.contains('oculto'); })()");
    ok('estamos en la portada', en === true);
    for (const c of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB']) await tecla(c);
    ok('con el código incompleto no pasa nada', (await js("document.querySelectorAll('.huevo-hojas').length")) === 0);
    await tecla('KeyA');
    await esperar(3200);
    const q = await js("(() => { const c = document.querySelector('.huevo-hojas'); return { capas: document.querySelectorAll('.huevo-hojas').length, hojas: c ? c.children.length : 0, colores: c ? new Set([...c.children].map((i) => i.style.background)).size : 0, evento: c ? getComputedStyle(c).pointerEvents : null }; })()");
    ok('con ↑ ↑ ↓ ↓ ← → ← → B A caen hojas de colores (una capa, sin tapar los botones)', q.capas === 1 && q.hojas >= 30 && q.colores >= 4 && q.evento === 'none', q);
    await foto('portada-hojas');
    for (const c of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']) await tecla(c);
    ok('mientras caen, el código no suma otra capa', (await js("document.querySelectorAll('.huevo-hojas').length")) === 1);
    await esperar(8200);
    ok('a los diez segundos la capa se saca sola', (await js("document.querySelectorAll('.huevo-hojas').length")) === 0);
    // dentro de un campo de texto no cuenta
    const t = await js("(() => { const i = document.createElement('input'); document.body.appendChild(i); i.focus(); const m = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']; for (const c of m) i.dispatchEvent(new KeyboardEvent('keydown', { code: c, bubbles: true })); const n = document.querySelectorAll('.huevo-hojas').length; i.remove(); return n; })()");
    ok('escribiendo en un campo de texto no cuenta', t === 0);
  }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const tecla = (c) => js(`window.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(c)}, bubbles: true, cancelable: true })); 1`);

  // ------------------------------------------------------------ 1) la estrella fugaz con deseo
  {
    const q = await js(`(() => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; hj.estado(); p.dia = 60; p.horas = 23;
      let n = 0; for (n = 1; n < 500; n++) { if (hj.fugazVista(60, n)) break; } return { n, abierto: hj.deseoAbierto(), visible: !document.getElementById('huevo-deseo').classList.contains('oculto'), filas: document.querySelectorAll('#huevo-deseo .huevo-deseo-fila').length, ultima: p.huevos.estrella.ultimaNoche }; })()`);
    ok('una fugaz de la noche trae el cartel con tres deseos', q.n < 500 && q.abierto && q.visible && q.filas === 3 && q.ultima === 60, q);
    await esperar(400);
    await foto('estrella-cartel');
    const q2 = await js(`${H}.__huevos.juego().fugazVista(60, 9999)`);
    ok('con el cartel abierto no se abre otro', q2 === false);
    await tecla('Digit3');
    const q3 = await js(`({ abierto: ${H}.__huevos.juego().deseoAbierto(), deseo: ${H}.progreso.huevos.estrella.deseo })`);
    ok('la tecla 3 pide «Que la tierra dé» y cierra el cartel', !q3.abierto && q3.deseo && q3.deseo.id === 'tierra' && q3.deseo.cumple >= 62 && q3.deseo.cumple <= 64, q3);
    // pasan los días: antes de tiempo no pasa nada
    const antes = await js(`(() => { const p = ${H}.progreso; return p.materiales ? Object.assign({}, p.materiales) : null; })()`);
    const q4 = await js(`(async () => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; p.dia = 61; p.horas = 10; for (let i = 0; i < 3; i++) { hj.actualizar(2.1); } return !!p.huevos.estrella.deseo; })()`);
    ok('al día siguiente el deseo sigue esperando', q4 === true);
    const q5 = await js(`(async () => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; const d = p.huevos.estrella.deseo; const cal0 = ${H}.progreso.materiales?.calafate ?? ${H}.progreso.cosas?.calafate ?? 0;
      p.dia = d.cumple; p.horas = 9; hj.actualizar(2.1); const cal1 = ${H}.progreso.materiales?.calafate ?? ${H}.progreso.cosas?.calafate ?? 0;
      return { deseo: p.huevos.estrella.deseo, cumplidos: p.huevos.estrella.cumplidos, cal0, cal1, nota: [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ') }; })()`);
    ok('a los 2 a 4 días llega la nota y el regalo chico (4 calafates)', q5.deseo === null && q5.cumplidos === 1 && q5.cal1 - q5.cal0 === 4 && /canastita de calafates/.test(q5.nota), q5);
    await esperar(300);
    await foto('estrella-nota');
  }

  // ------------------------------------------------------------ 2) los duendes del Coihue
  {
    const ir = async (x, z, yaw) => { await js(`(() => { const J = ${H}.jugador; J.ubicar(${x}, ${z}, ${yaw}); J.estado.vel.set(0, 0, 0); for (let i = 0; i < 10; i++) J.actualizar(0.05); })()`); };
    const c = await js(`(() => { const hj = ${H}.__huevos.juego(); hj.actualizar(2.1); const c = hj.coihue(), pt = ${H}.__huevos.mundo().puntoConvite; return c && { x: c.x, z: c.z, px: pt.x, pz: pt.z, ring: !!${H}.__huevos.mundo().rueda }; })()`);
    ok('hay un coihue elegido, con su rueda de hongos armada', !!c && c.ring, c);
    // de lejos no se dibuja; de cerca, sí
    await ir(c.px + 130, c.pz + 40, 0);
    const lejos = await js(`(() => { ${H}.__huevos.juego().actualizar(2.1); return ${H}.__huevos.mundo().rueda.visible; })()`);
    ok('lejos, la rueda no se dibuja', lejos === false);
    const dx = c.x - (c.px + 6), dz = c.z - (c.pz + 6), yaw = Math.atan2(-dx, -dz);
    await ir(c.px + 6, c.pz + 6, yaw);
    await js(`(() => { const p = ${H}.progreso; p.dia = 70; p.horas = 11; p.cosas.yerba = 2; ${H}.__huevos.juego().actualizar(2.1); })()`);
    await esperar(1200);
    await foto('coihue-rueda');
    const cerca = await js(`${H}.__huevos.mundo().rueda.visible`);
    ok('cerca se ve la rueda de hongos', cerca === true);
    await ir(c.px, c.pz, yaw);
    await esperar(900);
    const av = await js(`(document.getElementById('aviso')?.textContent || '')`);
    ok('con yerba, al pie, el aviso ofrece dejarla', /Dejar un poco de yerba al pie del coihue/.test(av), av);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`);
    await esperar(300);
    const d1 = await js(`({ yerba: ${H}.progreso.cosas.yerba, of: ${H}.progreso.huevos.duendes.ofrenda, pila: ${H}.__huevos.mundo().pila.visible })`);
    ok('E deja la yerba (queda 1), anota el día y se ve la pilita', d1.yerba === 1 && d1.of === 70 && d1.pila === true, d1);
    { const ux = (c.px - c.x), uz = (c.pz - c.z), d = Math.hypot(ux, uz); await ir(c.px + ux / d * 1.6, c.pz + uz / d * 1.6, Math.atan2(ux, uz)); await js(`${H}.jugador.estado.pitch = -0.55; 1`); }
    await esperar(1000);
    await foto('coihue-pila');
    const d1b = await js(`(() => { ${H}.progreso.dia = 70; ${H}.progreso.horas = 12; return null; })()`);
    await esperar(300);
    const av2 = await js(`(document.getElementById('aviso')?.textContent || '')`);
    ok('el mismo día no hay otro convite que dejar', !/yerba al pie/.test(av2), av2);
    // a la mañana siguiente
    const mat0 = await js(`(() => { const p = ${H}.progreso; p.dia = 71; p.horas = 9; ${H}.__huevos.juego().actualizar(2.1); return { b: ${H}.__huevos.mundo().bulto.visible, p: ${H}.__huevos.mundo().pila.visible, m: JSON.stringify(p.materiales || {}) }; })()`);
    ok('a la mañana siguiente la pila se vuelve un bulto atado con hilo', mat0.b === true && mat0.p === false, mat0);
    await esperar(1000);
    await foto('coihue-bulto');
    await ir(c.px, c.pz, yaw);
    await esperar(600);
    const av3 = await js(`(document.getElementById('aviso')?.textContent || '')`);
    ok('el aviso ofrece levantarlo', /Levantar el bulto/.test(av3), av3);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`);
    await esperar(400);
    const d2 = await js(`({ of: ${H}.progreso.huevos.duendes.ofrenda, rec: ${H}.progreso.huevos.duendes.recibidos, bulto: ${H}.__huevos.mundo().bulto.visible, nota: [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ') })`);
    ok('E lo levanta: nota del duende, el bulto desaparece', d2.of === 0 && d2.rec === 1 && d2.bulto === false && /Alguien te dejó una nota/.test(d2.nota), d2);
    await js(`(() => { ${H}.progreso.dia = 71; ${H}.__huevos.juego().actualizar(2.1); })()`);
  }

  // ------------------------------------------------------------ 3) el huemul blanco
  {
    const HU = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'huevos.js')).href);
    let dia = 300; while (!(HU.azarDe(7201, dia) < HU.HUEMUL.prob)) dia++;
    const ir = async (x, z, yaw) => { await js(`(() => { const J = ${H}.jugador; J.ubicar(${x}, ${z}, ${yaw}); J.estado.vel.set(0, 0, 0); for (let i = 0; i < 10; i++) J.actualizar(0.05); })()`); };
    // un amanecer tranquilo y húmedo; la niebla de valle la pone el juego
    await js(`(() => { const p = ${H}.progreso; p.dia = ${dia}; p.horas = 7.3; ${H}.clima.estado.viento = 0.04; ${H}.clima.estado.nublado = 0.5; ${H}.clima.estado.lluvia = 0; })()`);
    // la niebla de valle es más espesa cerca del mallín y con el aire quieto y nublado: se va para allá y se espera a que se arme
    { const mm = await js(`(() => { const m = ${H}.T.lugares.mallin; return { x: m.x, z: m.z }; })()`); await ir(mm.x + 25, mm.z + 25, 0); }
    for (let i = 0; i < 24; i++) { await esperar(500); await js(`(() => { const p = ${H}.progreso; p.horas = 7.3; ${H}.clima.estado.viento = 0.02; ${H}.clima.estado.nublado = 0.9; })()`); if ((await js(`${H}.__huevos.niebla()`)) >= 0.28) break; }
    const l = await js(`(() => { const hj = ${H}.__huevos.juego(); hj.actualizar(2.1); const m = ${H}.__huevos.mundo(); return { lugar: hj.lugarHuemul(), activo: m.huemulEstado.activo, niebla: ${H}.__huevos.juego() && (document.querySelector('canvas') ? 1 : 0), op: ${H}.__nieblaOp ? ${H}.__nieblaOp() : null }; })()`);
    ok('hay un lugar fijo para el huemul (en el mallín)', !!l.lugar, l);
    // si la niebla del juego no alcanzó, se mira cuánta hay
    const nb = await js(`(() => { const hj = ${H}.__huevos.juego(); hj.actualizar(2.1); const e = ${H}.__huevos.mundo().huemulEstado; return { activo: e.activo, x: e.x, z: e.z, niebla: ${H}.__huevos.niebla(), horas: ${H}.progreso.horas, dia: ${H}.progreso.dia }; })()`);
    ok('en la mañana sorteada y con niebla, el huemul blanco está en el mallín', nb.activo === true, nb);
    if (nb.activo) {
      const d = 36, yaw0 = l.lugar.yaw;
      const ang = l.lugar.yaw + Math.PI;   // desde el lado opuesto al mallín (de cara a él)
      const px = nb.x + Math.sin(ang) * d, pz = nb.z + Math.cos(ang) * d;
      await ir(px, pz, Math.atan2(-(nb.x - px), -(nb.z - pz)));
      await js(`(() => { const p = ${H}.progreso; p.horas = 7.3; ${H}.__huevos.juego().actualizar(2.1); })()`);
      await esperar(1500);
      await js(`${H}.jugador.estado.pitch = 0.03; 1`);
      await foto('huemul-lejos');
      const vis = await js(`(() => { const e = ${H}.__huevos.mundo().huemulEstado; return { activo: e.activo, huyendo: e.huyendo, entrada: !!${H}.progreso.entradas['avistaje-huemul'], av: ${H}.progreso.huevos.huemul.avistajes }; })()`);
      ok('a 36 m, mirándolo, se queda quieto y se anota como avistaje raro', vis.activo && !vis.huyendo && vis.entrada && vis.av === 1, vis);
      // más cerca: se acerca a 14 m
      const d2 = 14, px2 = nb.x + Math.sin(ang) * d2, pz2 = nb.z + Math.cos(ang) * d2;
      await ir(px2, pz2, Math.atan2(-(nb.x - px2), -(nb.z - pz2)));
      await js(`${H}.__huevos.juego().actualizar(0.3)`);
      await esperar(600);
      await foto('huemul-cerca');
      const mov = await js(`(() => { const e = ${H}.__huevos.mundo().huemulEstado; return { huyendo: e.huyendo, x: e.x, z: e.z }; })()`);
      ok('a 14 m se va caminando (no se lo puede acorralar)', mov.huyendo === true, mov);
      await js(`(() => { const hj = ${H}.__huevos.juego(); for (let i = 0; i < 400; i++) hj.actualizar(0.05); })()`);
      const fin = await js(`(() => { const e = ${H}.__huevos.mundo().huemulEstado; return { activo: e.activo, ido: ${H}.progreso.huevos.huemul.ido, ultimo: ${H}.progreso.huevos.huemul.ultimo }; })()`);
      ok('se pierde en la niebla y no vuelve esa mañana', fin.activo === false && fin.ido === true && fin.ultimo === dia, fin);
      await js(`(() => { const hj = ${H}.__huevos.juego(); hj.actualizar(2.1); hj.actualizar(2.1); })()`);
      ok('ni al recargar el estado', (await js(`${H}.__huevos.mundo().huemulEstado.activo`)) === false);
    }
  }

  // ------------------------------------------------------------ 4) el hueso del perro
  {
    const HU = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'huevos.js')).href);
    let dia = 500; while (!(HU.azarDe(7301, dia) < HU.HUESO.prob)) dia++;
    const ir = async (x, z, yaw) => { await js(`(() => { const J = ${H}.jugador; J.ubicar(${x}, ${z}, ${yaw}); J.estado.vel.set(0, 0, 0); for (let i = 0; i < 10; i++) J.actualizar(0.05); })()`); };
    await js(`(() => { const p = ${H}.progreso; p.dia = ${dia}; p.horas = 10.5; p.huevos.hueso = { dia: 0, ultimo: 0, cavados: 0 }; ${H}.__huevos.juego().actualizar(2.1); })()`);
    const q = await js(`(() => { const hj = ${H}.__huevos.juego(); hj.actualizar(2.1); return { hay: !!${H}.progreso.huevos.hueso.dia, lugar: hj.lugarHueso(), pesos: ${H}.progreso.economia?.pesos ?? null }; })()`);
    ok('un día sorteado, de día, el perro enterró un hueso (hay montículo en un lugar del valle)', q.hay && !!q.lugar && Number.isFinite(q.lugar.x), q);
    const L = q.lugar, ang = L.giro;
    await ir(L.x + 3.2, L.z + 3.2, Math.atan2(3.2, 3.2));
    await js(`${H}.jugador.estado.pitch = -0.55; ${H}.__huevos.juego().actualizar(2.1); 1`);
    await esperar(1500);
    const vis = await js(`${H}.__huevos.mundo().monticulo.visible`);
    ok('de cerca se ve el montículo', vis === true);
    await foto('hueso-monticulo');
    await ir(L.x + 1.4, L.z + 1.4, Math.atan2(1.4, 1.4));
    await esperar(900);
    const av = await js(`(document.getElementById('aviso')?.textContent || '')`);
    ok('al lado, el aviso ofrece excavar', /Excavar el montículo de tierra/.test(av), av);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`);
    await esperar(500);
    const d = await js(`({ hay: !!${H}.progreso.huevos.hueso.dia, cav: ${H}.progreso.huevos.hueso.cavados, vis: ${H}.__huevos.mundo().monticulo.visible, pesos: ${H}.progreso.economia?.pesos ?? null, nota: [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ') })`);
    ok('E lo excava: sale algo viejo, el montículo se va y el perro se alegra', !d.hay && d.cav === 1 && d.vis === false && /Desenterraste/.test(d.nota) && /mueve la cola/.test(d.nota), d);
    ok('la moneda se cambia por pesos chicos (o, sin monedas, una cuenta)', d.pesos === null || d.pesos - (q.pesos || 0) <= 150, { antes: q.pesos, despues: d.pesos });
    await foto('hueso-nota');
    // otro día sorteado dentro de la separación: no hay otro hueso
    const dentro = await js(`(() => { const p = ${H}.progreso; p.horas = 10.5; const d0 = p.dia; for (let d = d0 + 1; d < d0 + 6; d++) { p.dia = d; ${H}.__huevos.juego().actualizar(2.1); if (p.huevos.hueso.dia) return d; } return 0; })()`);
    ok('en los días siguientes (dentro de la separación) no hay otro hueso', dentro === 0, dentro);
  }

  // ------------------------------------------------------------ 6b) la radio de la madrugada
  {
    const HU = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'huevos.js')).href);
    let noche = 800; while (!HU.hayEmisoraMadrugada(noche)) noche++;
    let sinSenal = 800; while (HU.hayEmisoraMadrugada(sinSenal)) sinSenal++;
    const hablarAntes = () => js("[...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ')");
    // una noche con señal, a las 3 de la mañana (la noche es la del día anterior)
    await js("(() => { const p = " + H + ".progreso; p.dia = " + (noche + 1) + "; p.horas = 3; p.huevos.radio = { ultima: 0, oidos: 0 }; })()");
    const r1 = await js("(() => { const hj = " + H + ".__huevos.juego(); const a = hj.radioMadrugada(); const p = " + H + ".progreso; return { a, ultima: p.huevos.radio.ultima, oidos: p.huevos.radio.oidos, nota: [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ') }; })()");
    ok('una noche con señal, a las 3, sale una emisora que de día no está (tango o Morse)', r1.a === true && r1.ultima === noche && r1.oidos === 1 && /Una emisora que de día no está|Alguien transmite en Morse/.test(r1.nota), r1);
    const r2 = await js(H + ".__huevos.juego().radioMadrugada()");
    ok('la segunda vez esa noche, sólo estática (una vez por noche)', r2 === false);
    await js("(() => { const p = " + H + ".progreso; p.dia = " + (sinSenal + 1) + "; p.horas = 3; })()");
    ok('una noche sin señal, no hay nada', (await js(H + ".__huevos.juego().radioMadrugada()")) === false);
    await js("(() => { const p = " + H + ".progreso; p.dia = " + (noche + 1) + "; p.horas = 15; p.huevos.radio.ultima = 0; })()");
    ok('de día no hay emisora especial', (await js(H + ".__huevos.juego().radioMadrugada()")) === false);
    await foto('radio-madrugada');
  }

  let mal = 0;
  for (const r of out) { console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre} ${JSON.stringify(r.dato ?? '')}`); if (!r.ok) mal++; }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  console.log(mal || errores.length ? `HUMO HUEVOS: ${mal} fallas` : 'HUMO HUEVOS: todo OK');
  salir(mal || errores.length ? 1 : 0);
});
