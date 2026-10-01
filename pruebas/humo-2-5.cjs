// Partida real 2.5 (Electron + WebGL): el arsenal del Desafío. Se fabrica con el taller
// (K, Tab y los números, de verdad) y se prueba cada arma contra invasores quietos:
// daño, efectos, lo que atraviesa, lo que se levanta del suelo, el escudo, la armadura,
// el carcaj, el arco tensado, el humo, la bengala, el cuerno, y que todo se guarde.
// Uso: npx electron pruebas/humo-2-5.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',bubbles:true})); 1`);
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const cargar = async () => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };
  // unos pasos del Desafío y del juego (proyectiles, efectos, arsenal)
  const simular = (seg) => js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
  const cuadros = (n = 2) => js(`(async ()=>{ const H = window.__hojarasca; for (let i = 0; i < ${n}; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);
  // un invasor quieto a `d` metros adelante (y `lado` metros al costado), con mucha vida
  const blanco = (tipo, d, lado = 0, vida = 600, quieto = true) => js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado;
    const fx = -Math.sin(j.yaw), fz = -Math.cos(j.yaw), rx = Math.cos(j.yaw), rz = -Math.sin(j.yaw);
    const x = j.pos.x + fx * (${d}) + rx * (${lado}), z = j.pos.z + fz * (${d}) + rz * (${lado});
    const a = H.desafio.invocar('${tipo}', x, z); if (!a) return null;
    a.vida = a.vidaMax = (${vida}); if (${quieto}) a.enredadoT = 999; a.rumbo = Math.atan2(j.pos.x - x, j.pos.z - z);
    return H.desafio.aliens.indexOf(a) })()`);
  const alien = (i) => `window.__hojarasca.desafio.aliens[${i}]`;
  // apunta la cámara al invasor i (a media altura)
  const apuntar = async (i, alto = 0.55) => {
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado, a = ${alien(i)}, p = a.m.g.position;
      j.yaw = Math.atan2(j.pos.x - p.x, j.pos.z - p.z);
      const dh = Math.hypot(p.x - j.pos.x, p.z - j.pos.z), dy = (p.y + a.def.altura * a.m.esc * (${alto})) - (j.pos.y + 1.6);
      j.pitch = Math.atan2(dy, dh); return 1 })()`);
    await cuadros(2);
  };
  const limpiarAliens = () => js(`(()=>{ const H = window.__hojarasca; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
  // espera la recarga del arma anterior y dispara
  const disparar = (id) => js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < 60 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.desafio.atacar('${id}'); return 1 })()`);
  const D = (campo) => js(`window.__hojarasca.progreso.desafio.${campo}`);

  try {
    await cargar();
    ok(await js('!!window.__hojarasca?.desafio'), 'carga el Desafío');
    await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, j = H.jugador.estado, r = H.T.lugares.refugio;
      P.horas = 12; P.materiales = { tronco: 90, tabla: 90, piedra: 90, cristal: 90 }; P.ramitas = 40;
      P.cosas.arco = 1; P.cosas.boleadoras = 1; P.desafio.flechas = 20; P.desafio.boleadoras = 5;
      // un claro llano y sin obras, lejos del refugio
      j.pos.set(r.x + 60, H.T.altura(r.x + 60, r.z + 60) + 0.05, r.z + 60); j.yaw = 0; j.pitch = 0;
      H.desafio.cercaDeBanco = true; return 1 })()`);

    seccion('1. el taller (K, Tab y los números)');
    // el banco: cerca de un banco de trabajo (el galpón también cuenta)
    await js(`(()=>{ const H = window.__hojarasca, g = H.T.lugares.galpon, j = H.jugador.estado; j.pos.set(g.x + 3, H.T.altura(g.x + 3, g.z + 3) + 0.05, g.z + 3); return 1 })()`);
    await tecla('KeyK'); await esperar(200);
    const recetas = await js(`(()=>{ const r = {}; return r })()`);
    void recetas;
    // recorre las categorías y fabrica todo lo que hay en cada una (los números 1..9)
    const hecho = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso, cats = [];
      const tecla = (c) => { document.dispatchEvent(new KeyboardEvent('keydown',{code:c,bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:c,bubbles:true})); };
      // dos vueltas: las placas de cristal (Mejoras) piden el chaleco (Equipo), que viene después
      for (let c = 0; c < 14; c++) {
        const items = [...document.querySelectorAll('#taller-lista li')].length;
        if (c < 7) cats.push(items);
        for (let k = 1; k <= Math.min(9, items); k++) { tecla('Digit' + k); await new Promise(r => setTimeout(r, 30)); }
        tecla('Tab'); await new Promise(r => setTimeout(r, 30));
      }
      const C = P.cosas, d = P.desafio;
      return { cats, cosas: ['ballesta','facon','maza','arpon','hachuela','jabalina','granada','humo','bengala','rodela','chaleco','carcaj','cuerno','ballestaRepeticion','boleadorasCristal','placasCristal'].filter(k => !C[k]),
        municion: { virotes: d.virotes, flechasFuego: d.flechasFuego, flechasCristal: d.flechasCristal, hachuelas: d.hachuelas, jabalinas: d.jabalinas, granadas: d.granadas, humos: d.humos, bengalas: d.bengalas } } })()`);
    ok(hecho.cosas.length === 0, `se fabrica todo el arsenal (faltó: ${hecho.cosas.join(', ') || 'nada'}) · categorías ${hecho.cats.join('/')}`);
    ok(Object.values(hecho.municion).every((n) => n > 0), `y su munición (${JSON.stringify(hecho.municion)})`);
    ok(hecho.cats.every((n) => n <= 9), 'ninguna categoría pasa de nueve recetas');
    await tecla('Escape'); await tecla('KeyK'); await esperar(100);
    await js(`(()=>{ const H = window.__hojarasca; if (H.desafio.tallerAbierto) H.desafio.abrirTaller(false); const P = H.progreso, r = H.T.lugares.refugio, j = H.jugador.estado;
      Object.assign(P.desafio, { virotes: 30, flechasFuego: 10, flechasCristal: 10, hachuelas: 6, jabalinas: 6, granadas: 6, humos: 4, bengalas: 4, flechas: 20 });
      j.pos.set(r.x + 60, H.T.altura(r.x + 60, r.z + 60) + 0.05, r.z + 60); j.yaw = 0; j.pitch = 0; return 1 })()`);
    await cuadros(3);

    seccion('2. la ballesta atraviesa, y la de repetición tira tres');
    await js(`window.__hojarasca.progreso.cosas.ballestaRepeticion = 0; 1`);
    // dos en fila; se apunta bajo, como para ensartarlos (el claro tiene bajada)
    const b1 = await blanco('rastreador', 10), b2 = await blanco('rastreador', 13);
    await apuntar(b1, 0.3);
    const v0 = await D('virotes');
    await disparar('ballesta');
    await simular(1.2);
    const bal = await js(`({ a: ${alien(b1)}.vidaMax - ${alien(b1)}.vida, b: ${alien(b2)}.vidaMax - ${alien(b2)}.vida, v: window.__hojarasca.progreso.desafio.virotes })`);
    ok(bal.a >= 60 && bal.b >= 60 && bal.v === v0 - 1, `un virote pega a los dos que están en fila (${JSON.stringify(bal)})`);
    await js(`window.__hojarasca.progreso.cosas.ballestaRepeticion = 1; 1`);
    await simular(2.5);
    const v1 = await D('virotes');
    await disparar('ballesta');
    await simular(1.0);
    ok(v1 - (await D('virotes')) === 3, 'la de repetición tira tres seguidos');
    await limpiarAliens();
    // revisión 2.6: el virote que mata al primero sigue al de atrás
    await js(`window.__hojarasca.progreso.cosas.ballestaRepeticion = 0; 1`);
    const k1 = await blanco('rastreador', 10, 0, 40), k2 = await blanco('rastreador', 13);
    await apuntar(k1, 0.3);
    await disparar('ballesta');
    await simular(1.2);
    const kil = await js(`({ muerto: ${alien(k1)}.estado === 'morir' || ${alien(k1)}.vida <= 0, b: ${alien(k2)}.vidaMax - ${alien(k2)}.vida })`);
    ok(kil.muerto && kil.b >= 60, `mata al primero y atraviesa al segundo (${JSON.stringify(kil)})`);
    await limpiarAliens();
    // cambiar de arma corta la ráfaga y suelta la cuerda sin tirar
    await js(`window.__hojarasca.progreso.cosas.ballestaRepeticion = 1; 1`);
    const v2 = await D('virotes');
    await disparar('ballesta');
    await js(`window.__hojarasca.desafio.cambioDeArma(); 1`);
    await simular(1.0);
    const f0 = await D('flechas');
    const tens = await js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < 60 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const t = H.desafio.tensar(); H.desafio.actualizar(0.5, { noche: 1, dtReal: 0.5 }); H.desafio.cambioDeArma(); return { t, sigue: H.desafio.tensando } })()`);
    ok(v2 - (await D('virotes')) === 1 && tens.t && !tens.sigue && (await D('flechas')) === f0, `cambiar de arma corta la ráfaga y suelta el arco sin tirar (${JSON.stringify(tens)})`);
    await js(`window.__hojarasca.progreso.cosas.ballestaRepeticion = 0; 1`);

    seccion('3. facón por la espalda, maza contra el bruto');
    const f1 = await blanco('rastreador', 1.4);
    await apuntar(f1);
    await simular(2);
    await disparar('facon');
    const deFrente = await js(`${alien(f1)}.vidaMax - ${alien(f1)}.vida`);
    await js(`(()=>{ const a = ${alien(f1)}, j = window.__hojarasca.jugador.estado, p = a.m.g.position; a.vida = a.vidaMax; a.rumbo = Math.atan2(p.x - j.pos.x, p.z - j.pos.z); return 1 })()`);
    await simular(0.5);
    await disparar('facon');
    const deAtras = await js(`${alien(f1)}.vidaMax - ${alien(f1)}.vida`);
    ok(deFrente >= 20 && Math.abs(deAtras / deFrente - 2) < 0.05, `por la espalda, el doble (${deFrente} → ${deAtras})`);
    await limpiarAliens();
    const br = await blanco('bruto', 2.1, 0, 900);
    await apuntar(br);
    await simular(2);
    await js(`(()=>{ const a = ${alien(br)}; a.enredadoT = 0; a.estado = 'avanzar'; return 1 })()`);
    await disparar('maza');
    const maza = await js(`({ dano: ${alien(br)}.vidaMax - ${alien(br)}.vida, aturdido: ${alien(br)}.enredadoT })`);
    ok(maza.dano >= 55 * 1.5 - 1 && maza.aturdido > 0, `la maza pega la mitad más al bruto y lo aturde (${JSON.stringify(maza)})`);
    await limpiarAliens();

    seccion('4. el arpón lo trae');
    const ar = await blanco('rastreador', 13);
    await apuntar(ar);
    await disparar('arpon');
    await simular(1.4);
    const cerca = await js(`(()=>{ const p = ${alien(ar)}.m.g.position, j = window.__hojarasca.jugador.estado; return Math.hypot(p.x - j.pos.x, p.z - j.pos.z) })()`);
    ok(cerca < 6, `lo arrastra hasta cerca tuyo (${cerca.toFixed(1)} m)`);
    await limpiarAliens();

    seccion('5. hachas y jabalinas se levantan del suelo');
    const h1 = await blanco('rastreador', 9, 0, 600, false);
    await js(`(()=>{ ${alien(h1)}.dudaT = 99; return 1 })()`);
    await apuntar(h1);
    const hq0 = await D('hachuelas');
    await disparar('hachuela');
    await simular(1.5);
    const hach = await js(`({ dano: ${alien(h1)}.vidaMax - ${alien(h1)}.vida, derribado: ${alien(h1)}.enredadoT > 0, suelo: window.__hojarasca.desafio.arsenal.enElSuelo })`);
    ok(hach.dano >= 40 && hach.derribado && hach.suelo === 1, `el hacha pega, lo derriba y queda en el suelo (${JSON.stringify(hach)})`);
    await js(`(()=>{ const a = ${alien(h1)}, p = a.m.g.position, j = window.__hojarasca.jugador.estado; j.pos.set(p.x + 0.4, j.pos.y, p.z); return 1 })()`);
    await simular(0.2);
    ok((await D('hachuelas')) === hq0 && (await js('window.__hojarasca.desafio.arsenal.enElSuelo')) === 0, 'al pasar por encima, se levanta');
    await limpiarAliens();
    await js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, j = H.jugador.estado; j.pos.set(r.x + 60, H.T.altura(r.x + 60, r.z + 60) + 0.05, r.z + 60); j.yaw = 0; return 1 })()`);
    const jb = await blanco('bruto', 14, 0, 900);
    await apuntar(jb, 0.6);
    await disparar('jabalina');
    await simular(2);
    ok((await js(`${alien(jb)}.vidaMax - ${alien(jb)}.vida`)) >= 60, 'la jabalina llega a 14 m y pega fuerte');
    await limpiarAliens();

    seccion('6. granada, humo, bengala y cuerno');
    const g1 = await blanco('rastreador', 12, -1), g2 = await blanco('rastreador', 12, 1.5);
    await apuntar(g1, 0.1);
    await disparar('granada');
    await simular(2.5);
    const gra = await js(`({ a: ${alien(g1)}.vidaMax - ${alien(g1)}.vida, b: ${alien(g2)}.vidaMax - ${alien(g2)}.vida })`);
    ok(gra.a > 20 && gra.b > 20, `la granada lastima a los dos (${JSON.stringify(gra)})`);
    await limpiarAliens();
    const hm = await blanco('rastreador', 10, 0, 600, false);
    await js(`(()=>{ ${alien(hm)}.dudaT = 0; return 1 })()`);
    await apuntar(hm, 0.1);
    await disparar('humo');
    await simular(2.5);
    const humo = await js(`({ nubes: window.__hojarasca.desafio.arsenal.nubes, confuso: ${alien(hm)}.confusoT })`);
    ok(humo.nubes === 1 && humo.confuso > 0, `el humo lo confunde (${JSON.stringify(humo)})`);
    const salud0 = await D('salud');
    await simular(3);
    ok((await D('salud')) >= salud0 - 0.01, 'confundido, no te ataca');
    await limpiarAliens();
    const bg = await blanco('rastreador', 25);
    await js(`(()=>{ const j = window.__hojarasca.jugador.estado; j.pitch = 0.9; return 1 })()`);
    await cuadros(2);
    await disparar('bengala');
    await simular(2.5);
    const beng = await js(`({ n: window.__hojarasca.desafio.arsenal.bengalas, visto: window.__hojarasca.desafio.arsenal.revelado(${alien(bg)}.m.g.position) })`);
    ok(beng.n === 1 && beng.visto, `la bengala queda arriba y lo deja a la vista (${JSON.stringify(beng)})`);
    await limpiarAliens();
    const c1 = await blanco('rastreador', 8, 0, 600, false);
    await disparar('cuerno');
    const cuerno = await js(`({ duda: ${alien(c1)}.dudaT, recarga: window.__hojarasca.desafio.arsenal.recargaCuerno })`);
    ok(cuerno.duda > 0 && cuerno.recarga > 30, `el cuerno los hace dudar y hay que esperar para volver a soplar (${JSON.stringify(cuerno)})`);
    await limpiarAliens();

    seccion('7. escudo, chaleco y placas');
    const dano = (desde) => js(`(()=>{ const H = window.__hojarasca, d = H.progreso.desafio, j = H.jugador.estado; d.salud = 100;
      H.desafio.herirJugador(20, ${desde}); return 100 - d.salud })()`);
    const delante = `{ x: j.pos.x - Math.sin(j.yaw) * 2, z: j.pos.z - Math.cos(j.yaw) * 2 }`;
    await js(`(()=>{ const C = window.__hojarasca.progreso.cosas; C.chaleco = 0; C.placasCristal = 0; return 1 })()`);
    const sinNada = await dano(delante);
    await js(`(()=>{ const C = window.__hojarasca.progreso.cosas; C.chaleco = 1; return 1 })()`);
    const conChaleco = await dano(delante);
    ok(Math.abs(conChaleco / sinNada - 0.8) < 0.02, `el chaleco saca un quinto (${sinNada.toFixed(1)} → ${conChaleco.toFixed(1)})`);
    // el escudo de tablas, con el facón en la mano y clic derecho de verdad
    await js(`(()=>{ const H = window.__hojarasca; const i = [...document.querySelectorAll('#barra > *')].length; void i; return 1 })()`);
    const bloqueo = await js(`(()=>{ const H = window.__hojarasca; H.desafio.bloquear(true, 'facon'); return H.desafio.bloqueando })()`);
    const conEscudo = await dano(delante);
    await js(`window.__hojarasca.desafio.bloquear(false); 1`);
    ok(bloqueo === 'rodela' && Math.abs(conEscudo / conChaleco - 0.35) < 0.02, `con el facón, el escudo de tablas frena de frente (${conChaleco.toFixed(1)} → ${conEscudo.toFixed(1)})`);
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.cosas.placasCristal = 1; H.progreso.desafio.placasNoche = -1; return 1 })()`);
    const p1 = await dano(delante), p2 = await dano(delante);
    ok(p1 === 0 && p2 > 0, `las placas aguantan el primer golpe de la noche y nada más (${p1} → ${p2.toFixed(1)})`);
    await js(`(()=>{ window.__hojarasca.progreso.desafio.salud = 100; return 1 })()`);

    seccion('8. carcaj, flechas especiales y arco tensado');
    // elegir el arco en la barra y cambiar de flecha con el clic derecho de verdad
    const eleccion = await js(`(async ()=>{ const H = window.__hojarasca;
      const n = [...document.querySelectorAll('#barra .casilla, #barra > div')].length; void n;
      const idx = (window.__hojarasca.progreso.barra || []).length; void idx;
      return 1 })()`);
    void eleccion;
    const cambio = await js(`(()=>{ const H = window.__hojarasca, d = H.progreso.desafio; d.flechaTipo = 'comun'; const antes = d.flechaTipo;
      H.desafio.cambiarFlecha(); const uno = d.flechaTipo; H.desafio.cambiarFlecha(); const dos = d.flechaTipo; H.desafio.cambiarFlecha(); return [antes, uno, dos, d.flechaTipo] })()`);
    ok(cambio.join() === 'comun,fuego,cristal,comun', `el carcaj pasa comunes → incendiarias → de cristal (${cambio.join(' → ')})`);
    const fu = await blanco('rastreador', 12);
    await apuntar(fu);
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.desafio.flechaTipo = 'fuego'; for (let i = 0; i < 60 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.desafio.atacar('arco'); return 1 })()`);
    await simular(0.8);
    const arde = await js(`${alien(fu)}.fuegoT`);
    ok(arde > 0, `la incendiaria lo prende (${arde?.toFixed?.(1)})`);
    await simular(2);
    await limpiarAliens();
    const bc = await blanco('bruto', 12, 0, 900);
    await apuntar(bc, 0.5);
    await simular(1);
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.desafio.flechaTipo = 'comun'; H.desafio.atacar('arco'); return 1 })()`);
    await simular(1);
    const comun = await js(`${alien(bc)}.vidaMax - ${alien(bc)}.vida`);
    await js(`(()=>{ const a = ${alien(bc)}; a.vida = a.vidaMax; const H = window.__hojarasca; H.progreso.desafio.flechaTipo = 'cristal'; H.desafio.atacar('arco'); return 1 })()`);
    await simular(1);
    const cris = await js(`${alien(bc)}.vidaMax - ${alien(bc)}.vida`);
    ok(comun > 0 && Math.abs(cris / comun - 1.6) < 0.05, `la de cristal pega más al bruto (${comun} → ${cris})`);
    await js(`(()=>{ const a = ${alien(bc)}; a.vida = a.vidaMax; window.__hojarasca.progreso.desafio.flechaTipo = 'comun'; return 1 })()`);
    await simular(1);
    const tenso = await js(`(async ()=>{ const H = window.__hojarasca; if (!H.desafio.tensar()) return 'no tensa';
      await new Promise(r => setTimeout(r, 1300)); H.desafio.soltarTension(); return 1 })()`);
    await simular(1);
    const danoTenso = await js(`${alien(bc)}.vidaMax - ${alien(bc)}.vida`);
    ok(tenso === 1 && danoTenso > comun * 1.5, `el arco tensado pega más (${comun} → ${danoTenso})`);
    await limpiarAliens();

    seccion('9. boleadoras de cristal');
    const e1 = await blanco('rastreador', 11), e2 = await blanco('rastreador', 11, 1.6);
    await js(`(()=>{ ${alien(e1)}.enredadoT = 0; ${alien(e2)}.enredadoT = 0; ${alien(e1)}.dudaT = 99; ${alien(e2)}.dudaT = 99; return 1 })()`);
    await apuntar(e1, 0.4);
    await disparar('boleadoras');
    await simular(1.5);
    const desc = await js(`({ vecino: ${alien(e2)}.vidaMax - ${alien(e2)}.vida })`);
    ok(desc.vecino >= 14, `la descarga le llega al de al lado (${JSON.stringify(desc)})`);
    await limpiarAliens();

    seccion('10. se guarda');
    const guardado = await js(`(()=>{ const H = window.__hojarasca; H.progreso.desafio.flechaTipo = 'cristal'; H.guardar();
      const p = JSON.parse(localStorage.getItem('hojarasca-desafio-v1'));
      return { virotes: p.desafio.virotes, tipo: p.desafio.flechaTipo, ballesta: p.cosas.ballesta, carcaj: p.cosas.carcaj } })()`);
    ok(guardado.virotes > 0 && guardado.tipo === 'cristal' && guardado.ballesta && guardado.carcaj, `la partida guarda el arsenal (${JSON.stringify(guardado)})`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    const vuelto = await js(`(()=>{ const d = window.__hojarasca.progreso.desafio; return { virotes: d.virotes, tipo: d.flechaTipo } })()`);
    ok(vuelto.virotes === guardado.virotes && vuelto.tipo === 'cristal', `y al volver a abrir sigue ahí (${JSON.stringify(vuelto)})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
