// 3.5.4: caos largo y variado (Electron + WebGL, perfil propio). Un jugador que aprieta de
// todo durante mucho rato, con entradas de verdad (teclas, mouse, rueda, E, menús, mochila,
// construir, vehículos, caballo, kayak, velero, tren, pesca, foto, cuaderno, mapa, ajustes que
// cambian en vivo) y transiciones bruscas (guardar y recargar, entrar y salir del Desafío,
// morir en el Desafío, el contexto 3D perdido, el idioma, la portada).
//
// Instrumenta (ver caos-preload.cjs): toda falla de un sistema del bucle (fallaSistema, con su
// contador por sistema), window.onerror, promesas rechazadas, console.error y console.warn, NaN
// en cualquier objeto de la escena (jugador, cámara, animales, invasores, vehículos) y estados
// imposibles (kayak y tren a la vez, la pausa abierta jugando, una pregunta sin cuadro...).
//
// También mira que guardar y volver a abrir deje lo mismo (día, ramitas, obras, anotaciones,
// materiales, lo del Desafío) y, si la página se cuelga, la tira abajo y sigue.
//
// Reproducible: la semilla elige las acciones y también el azar del juego (Math.random); el
// tiempo real no, así que un caso vuelve casi siempre, no siempre. Las acciones (y lo que se
// revisa en cada paso) están en herramientas/caos-ayuda.cjs; la sonda en caos-preload.cjs.
//   node armar.mjs
//   npx electron --no-sandbox herramientas/caos-largo.cjs         (10 minutos, semilla 3540)
//   (PowerShell) $env:CAOS_SEMILLA='7'; $env:CAOS_MINUTOS='30'; npx electron --no-sandbox herramientas/caos-largo.cjs
//   CAOS_SALIDA=<carpeta>   informe-<semilla>.json y .txt: cada problema con las 15 acciones de
//                           antes y quién mostró u ocultó cada panel (por defecto, %TEMP%)
//   CAOS_MODO=relax|desafio con qué empieza (después cambia solo cada tanto)
//   CAOS_SOLO=accion1,…     sólo esas acciones, sin transiciones
//   CAOS_INDEX=<archivo>    otro armado en vez de index.html
// Sale con 1 si encontró algún problema. Partidas rotas: herramientas/caos-guardados.cjs.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
const SEMILLA = Number(process.env.CAOS_SEMILLA || 3540) >>> 0;
const MINUTOS = Number(process.env.CAOS_MINUTOS || 10);
const SOLO = (process.env.CAOS_SOLO || '').split(',').filter(Boolean);
// CAOS_DETALLE=80,158: en esos pasos anota modo y paneles después de cada tecla o clic
// CAOS_HASTA=160: corta en ese paso (para volver rápido a un caso con la misma semilla)
const DETALLE = (process.env.CAOS_DETALLE || '').split(',').filter(Boolean).map(Number);
const HASTA = Number(process.env.CAOS_HASTA || 0);
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-caos-'));
app.setPath('userData', perfil);
const SALIDA = process.env.CAOS_SALIDA || path.join(os.tmpdir(), 'hojarasca-caos-informes');
fs.mkdirSync(SALIDA, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// azar con semilla (las acciones; el del juego va en el preload)
let s = SEMILLA || 1;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };

// lo que corre en la página (acciones y revisión): herramientas/caos-ayuda.cjs
const { AYUDA } = require('./caos-ayuda.cjs');

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1024, height: 640,
    webPreferences: { backgroundThrottling: false, contextIsolation: false, preload: path.join(__dirname, 'caos-preload.cjs'), additionalArguments: [`--caos-semilla=${SEMILLA}`] } });
  // lo que la página quiera bajar (exportar, álbum) va al perfil temporal, sin preguntar
  w.webContents.session.on('will-download', (_e, item) => item.setSavePath(path.join(perfil, 'bajado-' + Date.now() + '-' + item.getFilename())));
  const url = path.join(raiz, process.env.CAOS_INDEX || 'index.html');   // CAOS_INDEX: otro armado (si index.html está tomado)
  const t0 = Date.now(), fin = t0 + MINUTOS * 60000;
  const minuto = () => ((Date.now() - t0) / 60000).toFixed(1);
  const problemas = new Map();   // clave → { texto, veces, paso, minuto, acciones, resumen }
  const avisos = new Map();      // console.warn distintos (no cuentan como error, se listan)
  const ultimas = [];            // las últimas acciones
  const cuenta = {};             // acciones por nombre
  let tirando = false;
  let paso = 0, recargas = 0, navegando = false, esperandoContexto = false, cayo = 0, fueraDelJuego = 0;
  const IGNORAR = /Electron Security Warning|GL_INVALID|CONTEXT_LOST_WEBGL|WebGL: INVALID|Autofill|favicon|AudioContext was not allowed|The AudioContext|DevTools|GPU stall|GroupMarkerNotSet|Download the React/;
  const anotar = (tipo, texto, extra = {}) => {
    const limpio = String(texto).replace(/\s+/g, ' ');
    const clave = (tipo + ' ' + limpio.replace(/\d+(\.\d+)?/g, '#')).slice(0, 220);
    const p = problemas.get(clave);
    if (p) { p.veces++; return; }
    problemas.set(clave, { tipo, texto: String(texto).slice(0, 3000), veces: 1, paso, minuto: minuto(), acciones: ultimas.slice(-15), ...extra });
    console.log(`\n✗ [paso ${paso}, min ${minuto()}] ${tipo}: ${limpio.slice(0, 300)}`);
  };
  w.webContents.on('render-process-gone', (_e, d) => { if (tirando) return; cayo++; anotar('caída de la página', JSON.stringify(d)); });
  w.webContents.on('unresponsive', () => anotar('página colgada', 'unresponsive'));
  // si la página navega (recarga sola, cambia de modo…), lo que se esperaba de ella no llega nunca
  const pendientes = new Set();
  w.webContents.on('did-start-navigation', (e, u, enLugar, principal) => {
    const mismo = e?.isSameDocument ?? enLugar, ppal = e?.isMainFrame ?? principal;
    if (ppal === false || mismo) return;
    navegando = true;
    for (const no of pendientes) no(new Error('la página navegó'));
    pendientes.clear();
  });
  const js = (c, limite = 60000) => {
    let no, reloj;
    const corte = new Promise((_, n) => { no = n; pendientes.add(n); reloj = setTimeout(() => n(new Error(`la página no respondió en ${limite / 1000} s`)), limite); });
    return Promise.race([w.webContents.executeJavaScript(c), corte]).finally(() => { clearTimeout(reloj); pendientes.delete(no); });
  };
  // una página que se cuelga mientras carga (un bucle que no termina en el arranque) nunca
  // termina de cargar: no se espera a loadFile más de 20 s, y si no responde se la tira abajo
  const cargar = () => Promise.race([w.loadFile(url, { search: '?debug=1' }).catch(() => 0), esperar(20000)]);
  const listo = async () => {
    for (const hasta = Date.now() + 120000; Date.now() < hasta;) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__caidas && window.__hojarasca.__bucle)', 5000).catch(() => false)) return true; }
    if (!(await js('1', 5000).then(() => true).catch(() => false))) { anotar('colgada', 'la página se colgó cargando (no responde)'); tirando = true; w.webContents.forcefullyCrashRenderer(); await esperar(2000); tirando = false; }
    return false;
  };
  const prepararPagina = async () => {
    await js(`(${AYUDA.toString()})(); window.__caosSolo = ${JSON.stringify(SOLO)}; window.__hojarasca.ajustes.limiteFps = 'libre'; window.__hojarasca.__caidas.graficos.esperaMs = 4000; window.__hojarasca.__valle?.azar(true); 1`);
  };
  const entrarSiHaceFalta = async () => {
    const m = await js('window.__hojarasca.__caidas.modo()').catch(() => null);
    if (m === 'inicio') { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1800); }
    await prepararPagina();
    await js(`(()=>{ const H = window.__hojarasca; if (H.__caidas.modo() !== 'jugando' && !H.__caidas.dialogos.abierto()) H.volverAlJuego(); return 1 })()`).catch(() => 0);
  };
  const recargo = async (motivo) => {
    navegando = false; recargas++;
    if (!(await listo())) { anotar('carga', `la página no volvió a estar lista (${motivo})`); return false; }
    await entrarSiHaceFalta();
    return true;
  };
  const abrirCon = async (modo, extra = {}) => {
    navegando = false;
    await cargar();
    await js(`(()=>{ const a = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1') || '{}'); Object.assign(a, { musica: false, autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modo: '${modo}' }, ${JSON.stringify(extra)}); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(a)); return 1 })()`);
    await cargar();
    navegando = false;
    return recargo('abrir ' + modo);
  };
  const leerPagina = async (contexto = {}) => {
    const r = await js(`(()=>{ const A = window.__caosAyuda; return { mal: A.revisar(${JSON.stringify(contexto)}), ...A.drenar(), resumen: A.resumen(), cambios: (window.__caos.cambios || []).slice(-10) } })()`, 30000);
    for (const m of r.mal) anotar('estado', m, { resumen: r.resumen, cambios: r.cambios });
    for (const e of r.reg) {
      if (IGNORAR.test(e.texto)) continue;
      if (e.tipo === 'warn') { const k = e.texto.replace(/\d+/g, '#').slice(0, 160); const a = avisos.get(k); if (a) a.veces++; else avisos.set(k, { texto: e.texto.slice(0, 600), veces: 1, paso, acciones: ultimas.slice(-6) }); continue; }
      anotar(e.tipo === 'error' ? 'console.error' : e.tipo, e.texto, { resumen: r.resumen });
    }
    return r;
  };

  // ------------------------------------------------ transiciones bruscas (del lado de Electron)
  const TRANSICIONES = {
    async recargar() {
      // guardar y volver a abrir: lo guardado tiene que ser lo que había (día, ramitas, obras,
      // anotaciones, materiales, lo del Desafío)
      const foto = `(()=>{ const H = window.__hojarasca, P = H.progreso, D = P.desafio || {}; const suma = (o) => Object.values(o || {}).reduce((a, n) => a + (Number(n) || 0), 0);
        return { dia: P.dia, ramitas: P.ramitas, obras: P.obras.length, entradas: Object.keys(P.entradas || {}).length, materiales: suma(P.materiales), cosas: Object.keys(P.cosas || {}).length, oleadas: D.oleadas ?? null, abatidos: D.abatidos ?? null } })()`;
      const antes = await js(`(()=>{ window.__hojarasca.guardar(); return ${foto} })()`);
      navegando = false; await cargar();
      if (!(await recargo('recargar'))) return 'recargar (falló)';
      const despues = await js(foto).catch(() => null);
      const distinto = despues && Object.keys(antes).filter((k) => antes[k] !== despues[k]);
      if (distinto?.length) anotar('guardado', `guardar y volver a abrir cambió ${distinto.map((k) => `${k}: ${antes[k]} → ${despues[k]}`).join(', ')}`);
      return 'guardar y recargar';
    },
    async recargaSinGuardar() { navegando = false; await Promise.race([w.webContents.reload(), esperar(20000)]); return (await recargo('recarga cruda')) ? 'recarga sin guardar (F5 del navegador)' : 'recarga (falló)'; },
    async cambiarModo() {
      // como el jugador: la portada y el botón del otro modo
      const otro = await js('window.__hojarasca.desafio ? "relax" : "desafio"');
      if (!(await js('window.__caosAyuda.aLaPortada()'))) return 'cambiar de modo (no llegó a la pausa)';
      await esperar(300);
      if (navegando) { await recargo('portada'); return 'cambiar de modo (la portada recargó por la calidad)'; }
      await js(`(()=>{ const b = document.querySelector('#inicio [data-ajuste="modo"] button[data-valor="${otro}"]'); if (b) b.click(); return !!b })()`);
      await esperar(1500);
      const ok = await recargo('cambiar de modo');
      if (otro === 'desafio' && ok) await armarDesafio();
      return `portada → modo ${otro}`;
    },
    async idioma() {
      const otro = await js(`window.__hojarasca.ajustes.idioma === 'en' ? 'es' : 'en'`);
      if (!(await js('window.__caosAyuda.aLaPortada()'))) return 'idioma (no llegó a la pausa)';
      await esperar(300);
      if (navegando) { await recargo('portada'); return 'idioma (la portada recargó por la calidad)'; }
      await js(`(()=>{ const b = document.querySelector('#inicio [data-ajuste="idioma"] button[data-valor="${otro}"]'); if (b) b.click(); return !!b })()`);
      await esperar(1500);
      await recargo('idioma');
      return `idioma → ${otro}`;
    },
    async portadaAzar() {
      // en la portada, uno o dos ajustes cualquiera (modo, campaña o sin fin, libre o historia,
      // dificultad, estación, calidad, idioma) y entrar: algunos recargan el mundo
      if (!(await js('window.__caosAyuda.aLaPortada()'))) return 'portada al azar (no llegó a la pausa)';
      await esperar(300);
      const hechos = [];
      for (let i = 0, n = 1 + Math.floor(azar() * 2); i < n && !navegando; i++) {
        const k = Math.floor(azar() * 1000);
        hechos.push(await js(`(()=>{ const l = [...document.querySelectorAll('#inicio [data-ajuste] button[data-valor]')].filter((b) => b.getBoundingClientRect().width > 2 && !b.closest('.oculto')); if (!l.length) return '-'; const b = l[${k} % l.length]; b.click(); return b.closest('[data-ajuste]').dataset.ajuste + '=' + b.dataset.valor })()`).catch(() => 'navegó'));
        await esperar(400);
      }
      if (navegando) { await recargo('portada al azar'); if (await js('!!window.__hojarasca.desafio').catch(() => false)) await armarDesafio(); return `portada: ${hechos.join(', ')} → recargó`; }
      await js(`document.getElementById('btn-entrar').click(); 1`).catch(() => 0); await esperar(1200);
      await prepararPagina().catch(() => 0);
      return `portada: ${hechos.join(', ')} → entrar`;
    },
    async ventana() {
      // achicar la ventana (hasta casi nada), agrandarla y volver: el render, la cámara y el post
      const tam = [[1, 1], [80, 40], [320, 2], [1920, 1080], [500, 900], [1024, 640]];
      const hechos = [];
      for (let i = 0, n = 1 + Math.floor(azar() * 3); i < n; i++) {
        const [a, b] = tam[Math.floor(azar() * tam.length)];
        w.setContentSize(a, b); hechos.push(`${a}×${b}`);
        await esperar(150);
        await js(`(async()=>{ await window.__caosAyuda.cuadros(4); return 1 })()`).catch(() => 0);
      }
      w.setContentSize(1024, 640); await esperar(150);
      await js(`(async()=>{ await window.__caosAyuda.cuadros(3); return 1 })()`).catch(() => 0);
      return `ventana ${hechos.join(' → ')} → 1024×640`;
    },
    async portada() {
      if (!(await js('window.__caosAyuda.aLaPortada()'))) return 'portada (no llegó a la pausa)';
      await esperar(400);
      if (navegando) { await recargo('portada'); return 'portada (recargó por la calidad)'; }
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200);
      await prepararPagina();
      return 'portada y volver a entrar';
    },
    async contexto() {
      esperandoContexto = true;
      const vuelve = azar() < 0.8, espera = Math.floor(azar() * 2500);
      await js(`(()=>{ const H = window.__hojarasca; window.__ctxCaos = window.__ctxCaos || H.renderer.getContext().getExtension('WEBGL_lose_context'); window.__ctxCaos.loseContext(); return 1 })()`);
      await esperar(espera);
      // con el contexto perdido el jugador sigue apretando cosas
      await js(`(async()=>{ const A = window.__caosAyuda; for (const t of ['KeyW','KeyE','Escape','KeyI','KeyO']) await A.tecla(t, 1); A.soltarTodo(); return 1 })()`).catch(() => 0);
      if (vuelve) {
        await js('window.__ctxCaos.restoreContext(); 1').catch(() => 0);
        let ok = false;
        for (let i = 0; i < 60 && !ok && !navegando; i++) { await esperar(250); ok = await js('!window.__hojarasca.__caidas.graficos.perdidos').catch(() => false); }
        if (navegando) { await recargo('contexto'); esperandoContexto = false; return `contexto perdido ${espera} ms → recargó`; }
        esperandoContexto = false;
        if (!ok) anotar('contexto', 'el contexto volvió pero el juego no se recuperó en 15 s');
        return `contexto perdido ${espera} ms y devuelto`;
      }
      // no vuelve: el juego guarda y se recarga solo (esperaMs = 4 s en la prueba)
      for (let i = 0; i < 40 && !navegando; i++) await esperar(250);
      esperandoContexto = false;
      if (!navegando) { anotar('contexto', 'el contexto no volvió y el juego no se recargó'); return 'contexto perdido sin volver (no recargó)'; }
      await recargo('contexto sin volver');
      return 'contexto perdido sin volver → se recargó solo';
    },
  };
  const PESOS_TRANS = { recargar: 3, recargaSinGuardar: 1, cambiarModo: 1.5, idioma: 0.5, portada: 1, portadaAzar: 2, contexto: 2, ventana: 2 };
  const armarDesafio = () => js(`(()=>{ const P = window.__hojarasca.progreso; if (!P.desafio) return 0;
    for (const k of ['arco', 'lanza', 'honda', 'boleadoras', 'ballesta', 'ballestaRepeticion', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'rodela', 'chaleco', 'placasCristal', 'carcaj', 'boleadorasCristal', 'pistola']) P.cosas[k] = 1;
    Object.assign(P.desafio, { flechas: 40, flechasFuego: 20, flechasCristal: 20, virotes: 30, hachuelas: 10, jabalinas: 10, granadas: 10, humos: 8, bengalas: 8, boleadoras: 10, tutorial: 99 });
    return 1 })()`).catch(() => 0);

  let resumenFinal = null;
  try {
    const modo0 = process.env.CAOS_MODO || (SEMILLA % 2 ? 'desafio' : 'relax');
    console.log(`caos largo · semilla ${SEMILLA} · ${MINUTOS} min · empieza en ${modo0} · salida ${SALIDA}`);
    await js('localStorage.clear(); 1').catch(() => 0);
    if (!(await abrirCon(modo0, { calidad: 'muybaja' }))) throw new Error('no cargó');
    await js(`localStorage.removeItem('hojarasca-v1'); 1`).catch(() => 0);
    if (modo0 === 'desafio') await armarDesafio();
    await leerPagina({});
    while (Date.now() < fin) {
      paso++;
      const sem = Math.floor(azar() * 4294967296);
      const esTrans = !SOLO.length && azar() < 0.025;
      let desc = '';
      try {
        if (esTrans) {
          const tot = Object.values(PESOS_TRANS).reduce((a, b) => a + b, 0);
          let x = azar() * tot, nombre = 'recargar';
          for (const [k, p] of Object.entries(PESOS_TRANS)) { x -= p; if (x <= 0) { nombre = k; break; } }
          desc = `TRANSICIÓN ${nombre}: ` + await TRANSICIONES[nombre]();
        } else {
          if (DETALLE.includes(paso)) await js('window.__caosDetalle = []; 1');
          desc = await js(`window.__caosAyuda.accion(null, ${sem})`, 60000);
          if (DETALLE.includes(paso)) console.log(`\n— detalle del paso ${paso}: ${desc}\n   ` + (await js('window.__caosDetalle.splice(0)')).join('\n   '));
        }
      } catch (e) {
        desc = `${desc || 'acción'} → excepción: ${e.message}`;
        if (/no respondió/.test(e.message) && !navegando) {
          anotar('colgada', `la página no respondió (${e.message})`);
          // colgada de verdad: se la tira abajo (es la ventana de la prueba) y se sigue con lo guardado
          if (!(await js('1', 5000).then(() => true).catch(() => false))) {
            tirando = true; w.webContents.forcefullyCrashRenderer(); await esperar(2000); tirando = false;
            await abrirCon('relax').catch(() => 0);
          }
        }
        else if (!navegando) anotar('excepción en la acción', e.message);
      }
      const nombre = desc.split(':')[0];
      cuenta[nombre] = (cuenta[nombre] || 0) + 1;
      ultimas.push(`#${paso} ${desc}${navegando ? ' (la página navegó)' : ''}`.slice(0, 260)); if (ultimas.length > 40) ultimas.shift();
      if (navegando) { const ok = await recargo('navegó sola tras: ' + desc.slice(0, 60)); if (!ok) { await abrirCon('relax'); } }
      // como un jugador: si quedó en la portada entra, y si lleva rato en un menú, sale (Esc)
      const md = await js('window.__hojarasca.__caidas.modo()').catch(() => null);
      fueraDelJuego = md === 'jugando' ? 0 : fueraDelJuego + 1;
      if (md === 'inicio' && azar() < 0.5) { await js(`document.getElementById('btn-entrar').click(); 1`).catch(() => 0); await esperar(1200); await prepararPagina().catch(() => 0); ultimas.push(`#${paso}+ entrar desde la portada`); }
      else if (fueraDelJuego >= 3) { await js(`(async()=>{ await window.__caosAyuda.tecla('Escape', 1); return 1 })()`).catch(() => 0); await esperar(450); ultimas.push(`#${paso}+ Esc (${md})`); }
      if (fueraDelJuego >= 8) {
        // el botón de cerrar o seguir que se vea (como haría alguien con el mouse)
        const b = await js(`(()=>{ const l = [...document.querySelectorAll('[id^=cerrar-], #btn-seguir, #dialogo-no, #victoria-seguir, #btn-entrar, .valle-opciones button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && !e.closest('.oculto') && !e.disabled; }); const e = l[0]; if (e) e.click(); return e ? (e.id || e.textContent.slice(0, 20)) : '' })()`).catch(() => '');
        ultimas.push(`#${paso}+ clic en "${b}" para salir (${md})`);
        if (fueraDelJuego >= 14) { await js(`(()=>{ const H = window.__hojarasca; if (!H.__caidas.dialogos.abierto()) H.volverAlJuego(); return 1 })()`).catch(() => 0); ultimas.push(`#${paso}+ volverAlJuego a la fuerza (${md})`); fueraDelJuego = 0; }
      }
      if (HASTA && paso >= HASTA) break;
      if (paso % 400 === 0) console.log(`  … paso ${paso}, minuto ${minuto()}, ${problemas.size} problemas, ${recargas} cargas`);
      try { await leerPagina({ contexto: esperandoContexto, soltado: true, instancias: paso % 50 === 0 }); }
      catch (e) { if (!navegando) anotar('revisar', 'no se pudo revisar: ' + e.message); else await recargo('revisar'); }
      if (azar() < 0.01) await js('window.__hojarasca.guardar(); 1').catch(() => 0);
    }
    resumenFinal = await js('window.__caosAyuda.resumen()').catch(() => null);
    const fallas = await js('window.__hojarasca.__caidas.fallas()').catch(() => []);
    for (const f of fallas) anotar('falla final', `${f.nombre}: ${f.mensaje} (${f.veces} veces)`);
  } catch (e) { anotar('excepción', e && e.stack ? e.stack : String(e)); }

  const informe = {
    semilla: SEMILLA, minutos: +((Date.now() - t0) / 60000).toFixed(2), pasos: paso, cargas: recargas, caidas: cayo, acciones: cuenta, final: resumenFinal,
    problemas: [...problemas.values()], avisos: [...avisos.values()],
  };
  fs.writeFileSync(path.join(SALIDA, `informe-${SEMILLA}.json`), JSON.stringify(informe, null, 2));
  const txt = [`caos · semilla ${SEMILLA} · ${informe.minutos} min · ${paso} pasos · ${recargas} cargas`, `acciones: ${JSON.stringify(cuenta)}`, '',
    ...informe.problemas.map((p) => `✗ [${p.tipo}] (paso ${p.paso}, min ${p.minuto}, ${p.veces}×) ${p.texto.slice(0, 1200)}\n   últimas acciones:\n     ${p.acciones.slice(-8).join('\n     ')}\n`),
    '', `avisos (console.warn) distintos: ${informe.avisos.length}`, ...informe.avisos.map((a) => `  · (${a.veces}×) ${a.texto.slice(0, 300)}`)].join('\n');
  fs.writeFileSync(path.join(SALIDA, `informe-${SEMILLA}.txt`), txt);
  console.log(`\n${problemas.size ? `✗ ${problemas.size} problemas` : '✓ sin problemas'} · ${paso} pasos en ${informe.minutos} min · ${recargas} cargas · informe en ${SALIDA}`);
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* Windows lo suelta después */ }
  app.exit(problemas.size ? 1 : 0);
});
