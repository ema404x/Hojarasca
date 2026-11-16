// 4.29.0 (B): fuego, rastros y vida chica del nivel Ultra (src/ultra-vida.js, el humo de clima.js, el temblor de luces.js, la pausa de
// huellas.js, las llamas anotadas de cocina-mundo.js y el barro pisado del suelo en ultra-bosque.js). Con el código de verdad (three del juego):
//   1. las reglas: el destello de las luciérnagas, el rocío de las telarañas, las noches de verano, el titilar del fuego y de las velas;
//   2. con Ultra apagado (ajuste en falso, o calidad que no es Alta) no se arma nada: ni mallas, ni el humo de Ultra, ni el temblor de las
//      luces, ni la pausa de las huellas de siempre;
//   3. con Ultra prendido: llamas (tres lenguas por fuego, los conos de la cocina escondidos), chispas, huellas finas (tuyas, de la gente) que
//      se corren sin borrarse y se borran solas, salpicaduras con el suelo mojado, la lluvia que rebota (en el techo si hay), las luciérnagas
//      que destellan de noche, los pájaros que se espantan, las telarañas con rocío; la luz del fuego titila y se corre, las velas apenas;
//   4. al apagarlo, todo vuelve a ser lo de antes;
//   5. clima.js: con Ultra apagado el humo sube exactamente con la fórmula de siempre; con Ultra se dobla en el rumbo del viento y las
//      luciérnagas de siempre se esconden;
//   6. luces.js (el temblor sólo si alguien lo pone), huellas.js (pausa y reposición), main.js, cocina-mundo.js y el suelo.
// Mutaciones: copias de ultra-vida.js y clima.js con un cambio cada una, un proceso por copia (ESM en caché): todas tienen que fallar.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8').replace(/\r\n/g, '\n');
registrarThree();

// Math.random con semilla (para dos climas iguales)
function sembrar(s) { let r = s; Math.random = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; }; }
const azarOriginal = Math.random;

async function comprobar(archVida, archClima) {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const THREE = await import('three');
  const { U } = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
  const V = await import(pathToFileURL(archVida).href);
  const C = await import(pathToFileURL(archClima).href);
  const { RUMBO_VIENTO } = await import(pathToFileURL(path.join(src, 'bandera-viento.js')).href);

  // ------------------------------------------------ 1: las reglas
  {
    const d = (t) => V.destelloLuciernaga(t, 3, 0);
    falla(d(0.07) > 0.3 && d(0.07) < 0.7 && d(0.15) > 0.95 && d(0.5) > 0 && d(0.5) < 0.6 && d(1.2) === 0 && d(2.9) === 0, 'la luciérnaga destella (sube en 0,15 s, se apaga en casi un segundo) y queda apagada el resto del ciclo');
    falla(V.rocioTelas(7, 0, 0) > 0.9 && V.rocioTelas(5.2, 0, 0) > 0.5 && V.rocioTelas(12, 0, 0) === 0 && V.rocioTelas(15, 0, 0) === 0 && V.rocioTelas(22, 0, 0) === 0, 'las telarañas brillan con el rocío de la mañana (de 5 a 10) y no a la tarde ni de noche');
    falla(V.rocioTelas(7, 1, 0) === 0 && V.rocioTelas(7, 0, 1) === 0, 'sin telarañas con lluvia ni con nieve');
    falla(V.hayLuciernagas(0.9, 0, 0, 0) && !V.hayLuciernagas(0.3, 0, 0, 0) && !V.hayLuciernagas(0.9, 0.8, 0, 0) && !V.hayLuciernagas(0.9, 0, 1, 0) && !V.hayLuciernagas(0.9, 0, 0, 0.6), 'luciérnagas sólo en las noches de verano (no de día, ni en otoño, ni en invierno, ni con lluvia)');
    const f = [], v = [];
    for (let i = 0; i < 400; i++) { f.push(V.titilarFuego(i * 0.037, 11.3)); v.push(V.titilarVela(i * 0.037, 4.2)); }
    const sd = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
    falla(Math.min(...f) >= 0.6 && Math.max(...f) <= 1.35 && sd(f) > 0.12, 'la luz del fuego titila de verdad (de 0,6 a 1,35, irregular, tanto como la de siempre)');
    falla(Math.min(...v) >= 0.93 && Math.max(...v) <= 1.07 && sd(v) > 0.005, 'las velas y los faroles tiemblan apenas (± 7 %)');
    falla(V.esLuzTibia(new THREE.Color(1, 0.6, 0.25)) && !V.esLuzTibia(new THREE.Color(0.9, 0.95, 1)) && !V.esLuzTibia(new THREE.Color(0.5, 0.6, 0.55)), 'tibia: la luz naranja de una vela o un farol (no la blanca ni la fría)');
  }

  // ------------------------------------------------ 2 a 4: el conjunto
  {
    const escena = new THREE.Scene();
    const presupuesto = { temblor: null };
    escena.userData.presupuestoLuces = presupuesto;
    const luzFog = new THREE.PointLight(0xff8a3a, 6);
    const fog = { activa: true, contenida: false, vida: 300, pos: new THREE.Vector3(4, 0, 2), fuego: { visible: true }, luzFuego: luzFog };
    const clima = { fogatas: [fog], estado: { lluvia: 0 }, ub: undefined, ponerUltraB(v) { this.ub = v; } };
    const T = { altura: () => 0, agua: () => false, val: () => 0.3, bosque: [], estepa: null, pasto: [], distSendero: [] };
    const huellas = { p: null, r: 0, pausar(v) { this.p = v; }, reponer() { this.r++; this.p = false; } };
    // una notro cerca con telaraña (la misma cuenta que ultra-vida.js: hash < 0,55)
    const hash = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    let mata = null;
    for (let i = 0; i < 200 && !mata; i++) { const x = 3 + i * 0.13, z = -2; if (hash(Math.round(x * 10) * 12.9898 + Math.round(z * 10) * 78.233) <= 0.55) mata = { x, z, tipo: 'notro', esc: 1 }; }
    const veg = { matasCerca: () => [mata, { x: 1, z: 1, tipo: 'roca', esc: 1 }] };
    // la cocina: un cono anotado, adentro de un grupo de la escena
    const grupo = new THREE.Group(); escena.add(grupo);
    const cono = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 6), new THREE.MeshBasicMaterial());
    cono.position.set(-3, 0.1, 1); grupo.add(V.anotarLlamaUltra(cono));
    const vecina = { clave: 'ana', pos: new THREE.Vector3(2, 0, 3), g: { visible: true } };
    const js = { pos: new THREE.Vector3(0, 0, 0), yaw: 0, enSuelo: true };
    const ctx = { cam: new THREE.Vector3(0, 1.7, 0), js, gente: { gente: [vecina] }, veg, obras: { obras: [] }, horas: 12, noche: 0, dia: 1, fauna: [], huellas, techos: null };
    const uHuellasAntes = U.uHuellas.value;
    const hijosAntes = escena.children.length;
    const uv = V.crearUltraVida({ escena, clima, T });
    // apagado: el ajuste en falso, y Ultra con la calidad en Media
    for (let i = 0; i < 30; i++) { uv.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 1 / 30, ctx); uv.revisarAjustes({ ultra: true, calidad: 'media' }, 'media', 1 / 30, ctx); }
    uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'media', 1 / 30, ctx);
    falla(!uv.activo && escena.children.length === hijosAntes && clima.ub === undefined && presupuesto.temblor === null && huellas.p === null && U.uHuellas.value === uHuellasAntes && cono.layers.mask === 1,
      'apagado: no arma nada, no toca el humo, ni las luces, ni las huellas de siempre, ni los conos de la cocina');
    // prendido
    U.uMojado.value = 1; U.uInvierno.value = 0; U.uOtono.value = 0;
    for (let i = 0; i < 40; i++) { js.pos.x += 0.12; vecina.pos.z += 0.1; uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx); }
    const nombres = escena.children.map((c) => c.name);
    falla(uv.activo && ['llamas-ultra', 'puntos-ultra', 'telas-ultra'].every((k) => nombres.includes(k)), 'prendido: las llamas, los puntos y las telarañas en la escena');
    falla([uv.llamas, uv.puntos, uv.telas].every((o) => o.malla.material.customProgramCacheKey().startsWith(V.CLAVE_ULTRA_VIDA)), 'cada programa de Ultra con su clave propia');
    falla(clima.ub === true && typeof presupuesto.temblor === 'function' && huellas.p === true && U.uHuellas.value === uv.finas.tex && U.uHuellasLado.value === V.HUELLAS_LADO, 'prendido: el humo de Ultra, el temblor de las luces y las huellas finas en lugar de las de siempre');
    falla(uv.llamas.malla.count === 6 && uv.info.fuegos === 2 && cono.layers.mask === 0, 'llamas: tres lenguas por fuego (el fogón y la parrilla de la cocina), con el cono escondido');
    falla(uv.info.chispas > 3, 'las chispas suben');
    const fin = uv.finas, R = V.HUELLAS_RES, lado = V.HUELLAS_LADO;
    const marcaEn = (x, z, r = 0.12) => { let m = 0; for (let dz = -r; dz <= r; dz += 0.03) for (let dx = -r; dx <= r; dx += 0.03) { const i = Math.round((x + dx - fin.centro.x) / lado * R + R / 2 - 0.5), j = Math.round((z + dz - fin.centro.y) / lado * R + R / 2 - 0.5); if (i >= 0 && j >= 0 && i < R && j < R) m = Math.max(m, fin.datos[j * R + i]); } return m; };
    falla(marcaEn(2.5, 0.12) > 120 && marcaEn(2.5, -0.12) > 120 && marcaEn(2.5, 0.6) === 0, 'tus pisadas: un pie y el otro, con forma (no una mancha de un metro)');
    falla(marcaEn(2, 5) > 100, 'las pisadas de la gente cercana');
    falla(uv.info.gotitas > 0, 'con el suelo mojado, las pisadas salpican');
    // la lluvia que rebota, en el suelo y en el techo
    clima.estado.lluvia = 1;
    ctx.techos = { techo: (x, z) => (x > 0 ? 3 : null) };
    for (let i = 0; i < 20; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    {
      const p = uv.puntos, [l0, l1] = V.TRAMOS.lluvia;
      let enTecho = 0, enSuelo = 0, malTecho = 0;
      for (let i = l0; i < l1; i += 3) { if (p.color[i * 4 + 3] <= 0) continue; const x = p.pos[i * 3], y = p.pos[i * 3 + 1]; if (x > 0) { if (y > 2.9) enTecho++; else malTecho++; } else if (y < 0.2) enSuelo++; }
      falla(uv.info.impactos > 40 && enTecho > 5 && enSuelo > 5 && malTecho === 0, 'la lluvia rebota en el suelo y, donde hay techo, en el techo');
    }
    clima.estado.lluvia = 0; ctx.techos = null; U.uMojado.value = 0;
    // la luz del fuego titila y se corre; las velas apenas; la luz fría no
    {
      const fija = new THREE.PointLight(); const vals = [], corr = [];
      const t0 = U.uTiempo.value;
      for (let i = 0; i < 40; i++) { U.uTiempo.value = t0 + i * 0.05; fija.intensity = 6; fija.matrixWorld.identity(); presupuesto.temblor(fija, luzFog); vals.push(fija.intensity); corr.push(Math.hypot(fija.matrixWorld.elements[12], fija.matrixWorld.elements[14])); }
      const vela = new THREE.PointLight(0xffa050), fria = new THREE.PointLight(0xdde8ff); const vv = [];
      for (let i = 0; i < 40; i++) { U.uTiempo.value = t0 + i * 0.05; const f = new THREE.PointLight(); f.intensity = 2; presupuesto.temblor(f, vela); vv.push(f.intensity); }
      const ff = new THREE.PointLight(); ff.intensity = 2; presupuesto.temblor(ff, fria);
      U.uTiempo.value = t0;
      falla(Math.max(...vals) - Math.min(...vals) > 0.6 && Math.max(...corr) > 0.01 && Math.max(...corr) < 0.12, 'la luz del fuego titila y se corre unos centímetros');
      falla(Math.max(...vv) - Math.min(...vv) > 0.02 && Math.max(...vv) < 2.15 && Math.min(...vv) > 1.85 && ff.intensity === 2, 'la vela tiembla apenas; la luz fría no');
    }
    // las luciérnagas de noche (y de día no)
    {
      ctx.noche = 0.95; ctx.dia = 0.05; let alguna = 0;
      for (let i = 0; i < 160; i++) { U.uTiempo.value += 1 / 30; uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx); alguna = Math.max(alguna, uv.info.luciernagas); }
      const [f0, f1] = V.TRAMOS.luciernagas; let apagadas = 0, vivas = 0;
      for (let i = f0; i < f1; i++) { const a = uv.puntos.color[i * 4 + 3]; if (a > 0 && a < 0.1) apagadas++; if (a > 0) vivas++; }
      falla(alguna > 3 && apagadas > vivas * 0.5, 'de noche las luciérnagas destellan (unas prendidas, la mayoría apagada en cada momento)');
      ctx.noche = 0; ctx.dia = 1;
      for (let i = 0; i < 3; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      let deDia = 0; for (let i = f0; i < f1; i++) if (uv.puntos.color[i * 4 + 3] > 0) deDia++;
      falla(deDia === 0, 'de día no hay luciérnagas');
    }
    // los pájaros: se posan y se espantan cuando te acercás
    {
      uv.bandada.estado = 'nada'; uv.bandada.espera = 0;
      for (let i = 0; i < 10; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      const posados = uv.bandada.estado === 'suelo', dist = Math.hypot(uv.bandada.x - js.pos.x, uv.bandada.z - js.pos.z);
      for (let i = 0; i < 30; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      const quietos = uv.bandada.estado === 'suelo';
      js.pos.x = uv.bandada.x + 3; js.pos.z = uv.bandada.z;
      const y0 = (() => { const [b0] = V.TRAMOS.pajaros; return uv.puntos.pos[b0 * 3 + 1]; })();
      for (let i = 0; i < 45; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      const [b0] = V.TRAMOS.pajaros;
      falla(posados && dist > 12 && quietos && uv.bandada.estado === 'vuelo' && uv.info.espantadas >= 1 && uv.puntos.pos[b0 * 3 + 1] > y0 + 2 && Math.floor(uv.puntos.datos[b0 * 2 + 1]) === V.FORMA.vuelo,
        'una bandada se posa lejos, se queda mientras no te acercás y se espanta (vuela, sube) cuando pasás cerca');
    }
    // las telarañas con el rocío de la mañana
    {
      ctx.horas = 7.2; js.pos.set(0, 0, 0);
      for (let i = 0; i < 3; i++) uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      const manana = uv.telas.malla.visible && uv.telas.malla.count === 1 && uv.telas.mat.uniforms.uRocio.value > 0.9;
      ctx.horas = 15;
      uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
      falla(!!mata && manana && !uv.telas.malla.visible, 'telarañas en los arbustos con el rocío de la mañana (no en las piedras, ni a la tarde)');
    }
    // las huellas finas: se corren sin borrarse, y se borran solas
    {
      const f = V.crearHuellasFinas();
      f.seguir(0, 0); f.pisada(1, 1, 0, 1);
      const en = (x, z) => { const i = Math.round((x - f.centro.x) / lado * R + R / 2 - 0.5), j = Math.round((z - f.centro.y) / lado * R + R / 2 - 0.5); return f.datos[j * R + i]; };
      const a = en(1, 1);
      f.seguir(12, 9);
      const b = en(1, 1);
      for (let i = 0; i < 400; i++) f.borrar(1.3, false, false);
      falla(a > 150 && b === a && en(1, 1) === 0 && !f.datos.some((x) => x), 'las huellas finas siguen al jugador sin perder lo pisado y se borran solas en unos minutos');
      f.dispose();
    }
    // apagar: todo como antes
    uv.revisarAjustes({ ultra: false, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    falla(!uv.activo && escena.children.length === hijosAntes && clima.ub === false && presupuesto.temblor === null && huellas.r === 1 && huellas.p === false && cono.layers.mask === 1 && !uv.llamas && !uv.puntos && !uv.finas,
      'al apagar: sin mallas, el humo y las luces de siempre, las huellas de siempre de vuelta y los conos de la cocina otra vez a la vista');
    // y con la calidad que baja de Alta (la autocalidad)
    uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'alta', 1 / 30, ctx);
    const otraVez = uv.activo;
    uv.revisarAjustes({ ultra: true, calidad: 'alta' }, 'media', 1 / 30, ctx);
    falla(otraVez && !uv.activo && escena.children.length === hijosAntes, 'se apaga solo si la calidad que corre baja de Alta');
  }

  // ------------------------------------------------ 5: clima.js (el humo y las luciérnagas)
  {
    const T = { indice: () => 0, estepa: [0], bosque: [0], altura: () => 0, val: () => 0, agua: () => false };
    const ajustes = { clima: 'despejado' };
    const mundo = { invierno: 0, otono: 0, noche: 0.9, chimeneas: [{ x: 3, y: 6, z: -2 }], bajoTecho: false, quieto: false };
    const cam = new THREE.Vector3(0, 2, 0);
    const armar = () => { sembrar(77); const e = new THREE.Scene(); const c = C.crearClima(e, T, ajustes); Math.random = azarOriginal; return { e, c }; };
    const A = armar(), B = armar();
    falla(A.c.ultraB === false, 'clima: Ultra apagado de entrada');
    const humoDe = (e) => e.children.find((o) => o.isPoints && o.geometry.attributes.position.count === 120);
    const luciDe = (e) => e.children.find((o) => o.isPoints && o.geometry.attributes.position.count === 240);
    const fog = (c) => c.fogatas[0];
    for (const X of [A, B]) X.c.encenderFogata(5, 0, 5, 900);
    B.c.ponerUltraB(true);
    for (let i = 0; i < 20; i++) { sembrar(100 + i); A.c.actualizar(0.1, cam, mundo); sembrar(100 + i); B.c.actualizar(0.1, cam, mundo); }
    Math.random = azarOriginal;
    // con Ultra apagado (A) el humo sigue la fórmula de siempre, punto por punto
    const viento = A.c.estado.viento;
    const h = humoDe(A.e), p = h.geometry.attributes.position.array, vida = h.geometry.attributes.aVida.array;
    let igual = true;
    for (let i = 0; i < 120; i++) {
      const v = vida[i], abre = 0.15 + v * v * 2.0, ch = mundo.chimeneas[0];
      const x = ch.x + (v * 1.2 + v * v * 5.5) * viento + Math.sin(v * 9 + i) * abre;
      const y = ch.y + Math.max(0.5 + 2.2 * v, 11 * v * (1 - 0.38 * v) - v * v * viento * 2);
      const z = ch.z + Math.cos(v * 7 + i * 1.7) * abre;
      if (Math.abs(p[i * 3] - x) > 1e-4 || Math.abs(p[i * 3 + 1] - y) > 1e-4 || Math.abs(p[i * 3 + 2] - z) > 1e-4) igual = false;
    }
    falla(igual, 'clima: sin Ultra, el humo de las chimeneas sube exactamente como en la 4.28.0');
    const fh = fog(A.c).humoFuego, pf = fh.geometry.attributes.position.array, vf = fh.geometry.attributes.aVida.array;
    let igualF = true;
    for (let i = 0; i < 30; i++) { const v = vf[i]; if (Math.abs(pf[i * 3] - (5 + v * 3 * viento + Math.sin(v * 8 + i) * v)) > 1e-4 || Math.abs(pf[i * 3 + 1] - (1 + v * 7)) > 1e-4) igualF = false; }
    falla(igualF, 'clima: sin Ultra, el humo del fuego también');
    falla(luciDe(A.e).visible === true && luciDe(B.e).visible === false, 'clima: con Ultra se esconden las luciérnagas de siempre (las de Ultra destellan)');
    falla(fog(A.c).fuego.material.uniforms.uOpacidad.value === 0.55 && fog(B.c).fuego.material.uniforms.uOpacidad.value === 0.22, 'clima: con Ultra las chispas redondas de siempre bajan (la llama de verdad arde en su lugar); sin Ultra, las de siempre');
    // con Ultra (B), el humo se corre en el rumbo del viento
    {
      const hb = humoDe(B.e), pb = hb.geometry.attributes.position.array, vb = hb.geometry.attributes.aVida.array, ch = mundo.chimeneas[0];
      let alto = 0, n2 = 0, distinto = false;
      for (let i = 0; i < 120; i++) { if (vb[i] < 0.6) continue; n2++; alto += (pb[i * 3] - ch.x) * RUMBO_VIENTO.x + (pb[i * 3 + 2] - ch.z) * RUMBO_VIENTO.z; if (Math.abs(pb[i * 3] - p[i * 3]) > 0.01) distinto = true; }
      falla(n2 > 10 && alto / n2 > 1.5 && distinto, 'clima: con Ultra el humo se dobla en el rumbo del viento');
    }
    // la luz del fuego: sin Ultra titila con los dos senos de siempre; con Ultra queda pareja acá (titila con el ruido, al copiarse)
    {
      const { U: UU } = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
      const ia = [], ib = [], t0 = UU.uTiempo.value; let exacta = true;
      for (let i = 0; i < 6; i++) { UU.uTiempo.value = t0 + i * 0.37; A.c.actualizar(0.001, cam, mundo); B.c.actualizar(0.001, cam, mundo); ia.push(fog(A.c).luzFuego.intensity); ib.push(fog(B.c).luzFuego.intensity); const tt = UU.uTiempo.value; if (Math.abs(fog(A.c).luzFuego.intensity - (6 + Math.sin(tt * 13) * 1.2 + Math.sin(tt * 23.7) * 0.8) * (1 - A.c.estado.lluvia * 0.4)) > 1e-4) exacta = false; }
      UU.uTiempo.value = t0;
      falla(exacta && Math.max(...ia) - Math.min(...ia) > 0.5 && Math.max(...ib) - Math.min(...ib) < 0.05, 'clima: la luz del fuego con los senos de siempre sin Ultra; con Ultra, sin ellos (el temblor de ultra-vida.js la hace titilar)');
    }
    // apagado otra vez: la fórmula de siempre
    B.c.ponerUltraB(false);
    sembrar(5); B.c.actualizar(0.1, cam, mundo); Math.random = azarOriginal;
    {
      const hb = humoDe(B.e), pb = hb.geometry.attributes.position.array, vb = hb.geometry.attributes.aVida.array, w = B.c.estado.viento, ch = mundo.chimeneas[0];
      let ok = true;
      for (let i = 0; i < 120; i++) { const v = vb[i], abre = 0.15 + v * v * 2.0; if (Math.abs(pb[i * 3] - (ch.x + (v * 1.2 + v * v * 5.5) * w + Math.sin(v * 9 + i) * abre)) > 1e-4) ok = false; }
      falla(ok && luciDe(B.e).visible === true && fog(B.c).fuego.material.uniforms.uOpacidad.value === 0.55, 'clima: al apagar Ultra, el humo, las luciérnagas y las chispas de siempre');
    }
  }
  return { mal, n };
}

// ================================================================ modo hijo
if (process.argv[2] === '--hijo') {
  const { mal } = await comprobar(process.argv[3], process.argv[4]);
  console.log('HIJO ' + JSON.stringify(mal));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const correr = (v, c) => {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', v, c], { encoding: 'utf8', timeout: 120000 });
  const l = (r.stdout || '').split('\n').find((x) => x.startsWith('HIJO '));
  return l ? JSON.parse(l.slice(5)) : ['sin respuesta: ' + (r.stderr || '').slice(0, 600)];
};
const archV = path.join(src, 'ultra-vida.js'), archC = path.join(src, 'clima.js');
{
  const mal = correr(archV, archC);
  if (mal.length) for (const t of mal) { total++; fallas++; console.log('✗ ' + t); }
  else { total += 26; console.log('✓ ultra-vida.js y clima.js de verdad: reglas, apagado sin tocar nada, prendido (fuego, huellas, salpicaduras, lluvia, luciérnagas, pájaros, telarañas), apagado otra vez, el humo'); }
}

// ---------------------------------------------------------------- 6: luces.js, huellas.js, main.js, cocina-mundo.js, el suelo
{
  const THREE = await import('three');
  const L = await import(pathToFileURL(path.join(src, 'luces.js')).href);
  const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1.5, 0.1, 500);
  cam.position.set(0, 2, 6); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true);
  const luz = new THREE.PointLight(0xffaa55, 3, 20); luz.position.set(0, 1, 0); escena.add(luz); L.registrarLuz(luz);
  const P = L.crearPresupuestoLuces(escena, cam, { puntuales: 2, focos: 0 });
  P.activar(); escena.updateMatrixWorld(true);
  for (let i = 0; i < 3; i++) P.asignar(cam);
  const sinTemblor = P.fijasP.map((f) => f.intensity);
  P.temblor = (fija) => { fija.intensity *= 0.5; };
  P.asignar(cam);
  const conTemblor = P.fijasP.map((f) => f.intensity);
  ok(Object.hasOwn(P, 'temblor') && sinTemblor.some((x) => Math.abs(x - 3) < 1e-6) && conTemblor.some((x) => Math.abs(x - 1.5) < 1e-6), 'luces.js: sin temblor la luz se copia igual que siempre; el temblor (sólo lo pone Ultra) la cambia al copiarla');
  const lu = leer('src/luces.js');
  ok(/temblor: null \}/.test(lu) && /if \(api\.temblor\) api\.temblor\(fijasP\[i\], l\.fuente\);/.test(lu), 'luces.js: el temblor empieza en null');
}
{
  const THREE = await import('three');
  const { U } = await import(pathToFileURL(path.join(src, 'materiales.js')).href);
  const Hm = await import(pathToFileURL(path.join(src, 'huellas.js')).href);
  const h = Hm.crearHuellas();
  const js = { pos: new THREE.Vector3(0, 0, 0), yaw: 0, enSuelo: true };
  h.actualizar(0.016, js, 1, 0); js.pos.x = 1; h.actualizar(0.016, js, 1, 0);
  const marcada = h.tex.image.data.some((x, i) => i % 4 === 0 && x > 0);
  h.limpiar(); h.pausar(true);
  const otra = new THREE.DataTexture(new Uint8Array(4), 1, 1); U.uHuellas.value = otra;
  js.pos.x = 3; h.actualizar(0.016, js, 1, 0); js.pos.x = 5; h.actualizar(0.016, js, 1, 0);
  const enPausa = !h.tex.image.data.some((x, i) => i % 4 === 0 && x > 0) && U.uHuellas.value === otra;
  h.reponer();
  ok(marcada && enPausa && U.uHuellas.value === h.tex && U.uHuellasLado.value === 64, 'huellas.js: marca como siempre; en pausa (Ultra) no marca ni toca el suelo; al reponer vuelve su textura');
}
{
  const main = leer('src/main.js');
  const i = main.indexOf("  try { huellas?.actualizar(dt, jugador.estado, U.uInvierno.value, clima.estado.lluvia); } catch (e) { fallaSistema('huellas', e); }\n");
  const j = main.indexOf('ultraVida.revisarAjustes(ajustes, calidadActiva, dt, u)');
  ok(i > 0 && j > i && j - i < 900 && /^import \{ crearUltraVida \} from '\.\/ultra-vida\.js';$/m.test(main) && /clima = crearClima\(escena, T, ajustes\);\n {2}ultraVida\?\.apagar\(\); ultraVida = crearUltraVida\(\{ escena, clima, T \}\);/.test(main),
    'main.js: Ultra de la vida chica se arma con el clima y se revisa en cada cuadro, después de las huellas, con la calidad que corre');
  const uvt = leer('src/ultra-vida.js');
  ok(/revisar\(esUltra\(ajustes\) && calidadActiva === 'alta', dt, ctx\)/.test(uvt), 'ultra-vida.js decide con esUltra (ultra.js) y la calidad que corre');
  const coc = leer('src/cocina-mundo.js');
  ok((coc.match(/p\.g\.add\(anotarLlamaUltra\(llamas\)\)/g) || []).length === 2 && /import \{ anotarLlamaUltra \} from '\.\/ultra-vida\.js';/.test(coc), 'cocina-mundo.js: las llamas de la parrilla y del horno quedan anotadas (con Ultra arde la llama de verdad)');
  const ub = leer('src/ultra-bosque.js');
  ok(ub.includes('float marcaHU = texture2D(uHuellas, clamp(uvHU, 0.0, 1.0)).r * dentroHU;') && ub.includes('col = mix(col, col * vec3(0.34, 0.3, 0.26), marcaHU * barroHU * 0.9);') && ub.includes('if (dot(pisadaUB, pisadaUB) > 1e-6) normal = normalize(normal + (viewMatrix * vec4(pisadaUB.x, 0.0, pisadaUB.y, 0.0)).xyz * 1.3);'),
    'el suelo de Ultra: las pisadas en el barro (más oscuras) y el hundido de la pisada en el relieve');
  // los programas de Ultra sólo en ultra-vida.js, y ninguno se arma fuera de prender()
  const cuerpo = uvt.split('export function crearUltraVida')[1];
  ok((uvt.match(/new THREE\.ShaderMaterial\(/g) || []).length === 3 && !/new THREE\.ShaderMaterial\(/.test(cuerpo) && /function prender\(ctx\) \{\n {4}activo = true;\n {4}llamas = crearLlamas\(\); escena\.add\(llamas\.malla\);\n {4}puntos = crearPuntos\(\); escena\.add\(puntos\.malla\);\n {4}telas = crearTelas\(\); escena\.add\(telas\.malla\);\n {4}finas = crearHuellasFinas\(\);/.test(uvt)
    && (cuerpo.match(/crear(Llamas|Puntos|Telas|HuellasFinas)\(\)/g) || []).length === 4,
    'tres programas nuevos (llamas, puntos y telarañas), armados sólo al prender Ultra');
}

// ---------------------------------------------------------------- mutaciones
const mutaciones = [
  ['v', 'Ultra sin mirar el ajuste', "revisar(esUltra(ajustes) && calidadActiva === 'alta', dt, ctx)", "revisar(calidadActiva === 'alta', dt, ctx)"],
  ['v', 'Ultra sin mirar la calidad que corre', "revisar(esUltra(ajustes) && calidadActiva === 'alta', dt, ctx)", 'revisar(esUltra(ajustes), dt, ctx)'],
  ['v', 'apagar no saca las mallas', 'if (o) { o.malla.parent?.remove(o.malla); o.dispose(); }', 'if (o) { o.dispose(); }'],
  ['v', 'apagar no devuelve las huellas de siempre', 'if (huellasAlta) { huellasAlta.reponer?.(); huellasAlta = null; }', ''],
  ['v', 'apagar deja el temblor de las luces', 'if (presupuesto && presupuesto.temblor === temblor) presupuesto.temblor = null;', ''],
  ['v', 'apagar deja el humo de Ultra', '    clima?.ponerUltraB?.(false);\n', '\n'],
  ['v', 'apagar deja escondidos los conos', '    for (const m of conos) { if (m.userData.capasUltraVida !== undefined) { m.layers.mask = m.userData.capasUltraVida; delete m.userData.capasUltraVida; } }\n', '\n'],
  ['v', 'luciérnagas de día', 'return noche > 0.6 && otono < 0.5', 'return noche > -1 && otono < 0.5'],
  ['v', 'telarañas a la tarde', 'clamp((1 - Math.abs(h - 7) / 3.2) * 1.4, 0, 1)', 'clamp((1 - Math.abs(h - 7) / 13.2) * 1.4, 0, 1)'],
  ['v', 'el fuego no titila', '      fija.intensity *= titilarFuego(t, s);\n', '\n'],
  ['v', 'las velas titilan fuerte', 'return 1 + 0.14 * (', 'return 1 + 0.6 * ('],
  ['v', 'las huellas finas se borran al correr el centro', 'if (primero || Math.abs(di) >= R || Math.abs(dj) >= R) datos.fill(0);', 'if (true) datos.fill(0);'],
  ['v', 'las huellas no se borran solas', 'paso = nevando ? 4 : lloviendo ? 3 : 2;', 'paso = 0;'],
  ['v', 'los pájaros no se espantan', 'if (dJug < (corre ? 12 : 7.5) || !puede) {', 'if (!puede) {'],
  ['v', 'no salpica al pisar mojado', '      gotita.vida[i] = 0;\n', '\n'],
  ['v', 'la lluvia no rebota en los techos', '      if (techo !== null && techo !== undefined && techo > y) y = techo;\n', '\n'],
  ['v', 'las llamas sin clave propia', "  mat.customProgramCacheKey = () => CLAVE_ULTRA_VIDA + '|llamas';\n", '\n'],
  ['v', 'sin chispas', 'acumChispa[k] += dt * f.chispas * f.brillo;', 'acumChispa[k] += 0;'],
  ['v', 'los conos de la cocina a la vista', 'if (!conos.has(m)) { m.userData.capasUltraVida = m.layers.mask; m.layers.mask = 0; conos.add(m); }', 'if (!conos.has(m)) { m.userData.capasUltraVida = m.layers.mask; conos.add(m); }'],
  ['v', 'la gente no deja huellas', '        marcarPie(x, z, yaw, 0.9, 1, false);\n', '\n'],
  ['v', 'las telarañas también en las piedras', "if (!m || !TIPOS_ARBUSTO.has(m.tipo) || m.sacado) continue;", 'if (!m || m.sacado) continue;'],
  ['c', 'Ultra prendido de entrada en el clima', '  let ultraB = false;\n', '  let ultraB = true;\n'],
  ['c', 'el humo de siempre cambia', 'p[i * 3] = chim.x + (v * 1.2 + v * v * 5.5) * estado.viento + Math.sin(v * 9 + i) * abre;', 'p[i * 3] = chim.x + (v * 1.3 + v * v * 5.5) * estado.viento + Math.sin(v * 9 + i) * abre;'],
  ['c', 'las chispas de siempre no vuelven', 'matFuego.uniforms.uOpacidad.value = ultraB ? 0.22 : 0.55;', 'matFuego.uniforms.uOpacidad.value = ultraB ? 0.22 : 0.5;'],
  ['c', 'la luz del fuego de siempre cambia', '(6 + (ultraB ? 0 : Math.sin(tt * 13) * 1.2 + Math.sin(tt * 23.7) * 0.8))', '(6 + (ultraB ? 0 : Math.sin(tt * 13) * 0.2 + Math.sin(tt * 23.7) * 0.8))'],
  ['c', 'la luz del fuego con Ultra sigue con los senos', '(6 + (ultraB ? 0 : Math.sin(tt * 13) * 1.2 + Math.sin(tt * 23.7) * 0.8))', '(6 + (Math.sin(tt * 13) * 1.2 + Math.sin(tt * 23.7) * 0.8))'],
  ['c', 'las luciérnagas de siempre no se esconden', '&& precip < 0.3 && !ultraB;', '&& precip < 0.3;'],
  ['c', 'el humo de Ultra no sigue el viento', 'const vto = estado.viento * (1 + estado.rafaga * 2.2), dobla = (v * 1.1 + v * v * 7.5) * vto;', 'const vto = estado.viento * (1 + estado.rafaga * 2.2), dobla = 0;'],
];
const vivas = [];
let k = 0;
for (const [donde, que, de, a] of mutaciones) {
  k++;
  const base = donde === 'v' ? archV : archC;
  const texto = fs.readFileSync(base, 'utf8');
  if (!texto.includes(de)) { ok(false, `mutación «${que}»: no encontré el texto a cambiar`); continue; }
  const copia = path.join(src, `__mut-4290b-${process.pid}-${k}-${path.basename(base)}`);
  try {
    fs.writeFileSync(copia, texto.split(de).join(a));
    const mal = donde === 'v' ? correr(copia, archC) : correr(archV, copia);
    total++;
    if (!mal.length) { fallas++; vivas.push(que); }
  } finally { fs.rmSync(copia, { force: true }); }
}
if (vivas.length) console.log('✗ mutaciones que no fallaron: ' + vivas.join(' · ')); else console.log(`✓ las ${mutaciones.length} mutaciones fallan (un proceso por copia)`);

console.log(fallas ? `FALLA verificar-4-29-0-b: ${fallas} de ${total}` : `OK verificar-4-29-0-b: ${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
