// 4.29.1 (B): los bugs anotados del pueblo (de CAMBIOS_4_26_5_A/B/C). Un caso por arreglo (cada uno falla con su mutación).
//   1. V con una charla, un puesto o cualquier panel abierto no tira nada (antes tiraba lo de la mano con la charla abierta).
//   2. «E para subir» a la trochita sólo cuando la E realmente sube (`tren.puedeSubir`); si no, «acercate a una puerta».
//   3. El cartel del banco dice los horarios reales (HORARIO_BANCO): de lunes a sábado, el sábado de baile y el domingo cerrado,
//      en dos renglones que entran en la celda del atlas con una letra legible.
//   4. El bajo del alero del andén (Aldea y Estación del Valle: `construirParada`) no es negro puro: lleva `emissive` de madera oscura.
//   5. El suelo fino de la Aldea (el parche) con nodos cada 1 m: el suelo que se ve no se separa más de 10 cm del que se pisa (con 2 m llegaba
//      a 30 cm en el terreno de la prueba y a 42 cm en la partida).
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-29-1-b.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.C4291B_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  registrarThree();
  // un `document` de mentira (las texturas de la aldea piden un lienzo)
  const lienzo = new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : typeof k === 'string' ? () => lienzo : undefined) });
  globalThis.document = { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => lienzo }), fonts: null };
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const troc = fs.readFileSync(path.join(SRC, 'trochita.js'), 'utf8');
  const A = await import(pathToFileURL(path.join(SRC, 'aldea.js')).href);
  const AR = await import(pathToFileURL(path.join(SRC, 'aldea-arquitectura.js')).href);

  // ---- 1. V con algo abierto no tira
  {
    const tirar = (sobre) => {
      let bultos = 0, sacados = 0;
      const env = {
        ranuras: [{ id: 'tabla', nombre: 'Tablas' }], elegida: 0, jugador: { estado: { enTren: false, enKayak: false, nadando: false, enCable: false, pos: { x: 0, y: 0, z: 0 }, yaw: 0 } },
        durmiendo: false, escenasMundo: null, motivoParaNoTirar: () => null, T: { agua: () => false }, LIMITE: 1e9, col: null, progreso: {},
        sacarDeMochila: () => { sacados++; return { ok: true, carga: { id: 'tabla', n: 1 } }; }, objetos: { soltar: () => false, tirarBulto: () => { bultos++; return { ok: true }; } },
        alturaDePie: () => 0, nota: () => {}, sonido: { paso: () => {} }, refrescarBarra: () => {}, enMano: null, guardar: () => {},
        charla: { npc: null, menu: null }, panelDelHudAbierto: () => false, panelFueraDelHudAbierto: () => false, personalAbierto: () => false,
        ...sobre,
      };
      funcion(main, 'soltarRanura', env)();
      return { bultos, sacados };
    };
    ok('sin nada abierto, V tira', tirar({}).bultos === 1);
    ok('con una charla abierta (el vecino habla), V no tira ni saca nada de la mochila', (() => { const r = tirar({ charla: { npc: { nombre: 'Ana' }, menu: null } }); return r.bultos === 0 && r.sacados === 0; })());
    ok('con el menú de la charla, tampoco', tirar({ charla: { npc: null, menu: { opciones: [] } } }).bultos === 0);
    ok('con un panel del HUD abierto (el puesto, la mochila, el almacén…), tampoco', tirar({ panelDelHudAbierto: () => true }).bultos === 0);
    ok('con un panel de afuera del HUD (el banco, tu local, la cantina, la casa de té), tampoco', tirar({ panelFueraDelHudAbierto: () => true }).bultos === 0);
    ok('con el panel de personalizar abierto, tampoco', tirar({ personalAbierto: () => true }).bultos === 0);
  }

  // ---- 2. «E para subir» sólo si la E sube
  {
    const linea = main.split('\n').find((l) => l.includes('textoTren = tren.soloLocomotora?.() ?'));
    ok('el texto del andén está en main.js', !!linea);
    if (linea) {
      const desde = linea.indexOf('textoTren = ') + 'textoTren = '.length, hasta = linea.indexOf(';   //', desde);
      const cuerpo = linea.slice(desde, hasta < 0 ? undefined : hasta);
      const texto = (sube, sola = false) => new Function('env', `with (env) { return (${cuerpo}); }`)({ tren: { soloLocomotora: () => sola, puedeSubir: () => sube }, anden: { nombre: 'Aldea de los Duendes' }, js: {} });
      ok('con el tren en el andén y una puerta al alcance, dice «E para subir»', /E para subir/.test(texto(true)));
      ok('con el tren en el andén pero lejos de las puertas, no dice «E para subir»', !/E para subir/.test(texto(false)) && /puerta/.test(texto(false)));
      ok('el que va sin coches sigue con su aviso de la cabina', /cabina/.test(texto(false, true)));
    }
  }

  // ---- 3. el cartel del banco
  {
    const HB = A.HORARIO_BANCO;
    const hora = (x) => (x % 1 ? `${Math.floor(x)}:${String(Math.round((x % 1) * 60)).padStart(2, '0')}` : String(x));
    const texto = AR.HORARIO_BANCO_CARTEL;
    const [r1, r2] = String(texto).split('\n');
    ok('el cartel tiene dos renglones', !!r1 && !!r2);
    ok('el primero dice de lunes a sábado y las dos franjas del código', /^Lun a sáb /.test(r1 || '') && (r1 || '').includes(`${hora(HB.manana[0])} a ${hora(HB.manana[1])}`) && (r1 || '').includes(`${hora(HB.tarde[0])} a ${hora(HB.tarde[1])}`));
    ok('el segundo dice el sábado de baile con la hora del código y que el domingo cierra', /baile/i.test(r2 || '') && (r2 || '').includes(String(HB.sabadoDeBaile)) && /Dom\.? cerrado/.test(r2 || ''));
    ok('sigue siendo una sola celda del atlas, con el mismo texto', AR.CARTELES_ALDEA.filter((c) => c.texto === texto).length === 1 && AR.CARTELES_ALDEA.length <= Math.floor(AR.ATLAS_CARTELES.alto / AR.ATLAS_CARTELES.celdaAlto) * AR.ATLAS_CARTELES.columnas);
    // el atlas pintado con un contexto de mentira (cada letra mide 0,42 de la altura de la fuente: Caveat, de mano)
    const textos = [];
    let fuente = 0;
    const ctx = new Proxy({ measureText: (t) => ({ width: String(t).length * fuente * 0.42 }), createLinearGradient: () => ({ addColorStop() {} }), fillText(t, x, y) { textos.push({ t, x, y, fuente }); } }, {
      get(o, k) { return k in o ? o[k] : (typeof k === 'string' ? () => {} : undefined); },
      set(o, k, v) { if (k === 'font') fuente = Number(/(\d+)px/.exec(v)?.[1] || 0); o[k] = v; return true; },
    });
    AR.pintarCarteles(ctx);
    const pr1 = textos.filter((q) => q.t === r1), pr2 = textos.filter((q) => q.t === r2);
    ok('el atlas pinta los dos renglones', pr1.length >= 1 && pr2.length >= 1);
    ok('uno arriba del otro (el primero más arriba) y la letra es legible (24 px o más de los 96 de la celda)', pr1.length > 0 && pr2.length > 0 && pr1[0].y < pr2[0].y && pr1[0].fuente >= 24 && pr2[0].fuente >= 24);
    ok('y cada renglón entra a lo ancho de la celda', pr1.length > 0 && pr2.length > 0 && pr1[0].t.length * pr1[0].fuente * 0.42 <= AR.ATLAS_CARTELES.celdaAncho - 44 && pr2[0].t.length * pr2[0].fuente * 0.42 <= AR.ATLAS_CARTELES.celdaAncho - 44);
    ok('los carteles de un renglón se pintan como siempre (Banco del Pueblo, 54 px o más chico)', textos.some((q) => q.t === 'Banco del Pueblo'));
  }

  // ---- 4. el bajo del alero del andén
  {
    const m = /const alero = new THREE\.Mesh\(new THREE\.BoxGeometry\(W \+ 2\.2, 0\.16, anchoAlero\), new THREE\.MeshLambertMaterial\(\{([^}]*)\}\)\)/.exec(troc);
    ok('el alero del andén está en trochita.js', !!m);
    const e = m && /emissive:\s*(0x[0-9a-fA-F]{6})/.exec(m[1]);
    ok('el alero del andén lleva `emissive` (el bajo, con la normal hacia abajo, no recibe luz y era negro puro)', !!e);
    if (e) {
      const v = parseInt(e[1], 16), r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
      ok('es una madera oscura (marrón: r > g > b, ni negro ni claro)', r > g && g > b && r >= 0x18 && r <= 0x50);
    }
  }

  // ---- 5. el suelo fino de la aldea
  {
    const AM = await import(pathToFileURL(path.join(SRC, 'aldea-mundo.js')).href);
    const THREE = await import('three');
    const { generarTerreno } = await import(pathToFileURL(path.join(SRC, 'terreno.js')).href);
    const T = generarTerreno();
    const am = AM.crearAldeaMundo({ T, escena: new THREE.Scene(), veg: { arboles: [], colisiones: [], arbolesCerca: () => [], despejar: () => 0 }, progreso: () => ({ aldea: null }) });
    am.emparejar();
    const M = A.marcoAldea(A.PARADA_ALDEA);
    // el parche son triángulos entre nodos cada `paso` m (la diagonal es b–d), con la altura del terreno en cada nodo
    const tri = (x, z, paso) => {
      const fx = (x + 512) / paso, fz = (z + 512) / paso, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const h = (a, b) => T.altura(a * paso - 512, b * paso - 512);
      const ha = h(i, j), hb = h(i, j + 1), hc = h(i + 1, j + 1), hd = h(i + 1, j);
      return u + v <= 1 ? ha + (hd - ha) * u + (hb - ha) * v : hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
    };
    const peor = (paso) => {
      let max = 0, n10 = 0;
      for (let lx = -175; lx <= 98; lx += 1) for (let lz = 0; lz <= 90; lz += 1) {
        const w = M.aMundo(lx, lz), e = Math.abs(T.altura(w.x, w.z) - tri(w.x, w.z, paso));
        if (e > max) max = e;
        if (e > 0.10) n10++;
      }
      return { max, n10 };
    };
    const con2 = peor(2), con1 = peor(1);
    ok(`con nodos cada 2 m el suelo que se ve se separaba del que se pisa más de 10 cm (peor ${Math.round(con2.max * 100)} cm en ${con2.n10} puntos): la prueba mide algo`, con2.max > 0.2 && con2.n10 > 50);
    ok(`con nodos cada 1 m ningún punto de la Aldea pasa de 10 cm (peor ${Math.round(con1.max * 100)} cm)`, con1.max <= 0.10 && con1.n10 === 0);
    ok('el parche usa PASO_PARCHE y vale 1 m', AM.PASO_PARCHE === 1);
    const aldeaFuente = fs.readFileSync(path.join(SRC, 'aldea-mundo.js'), 'utf8');
    ok('parcheSuelo arma sus nodos con PASO_PARCHE', /const nx = Math\.max\(2, Math\.ceil\(\(X1 - X0\) \/ PASO_PARCHE\)\), nz = Math\.max\(2, Math\.ceil\(\(Z1 - Z0\) \/ PASO_PARCHE\)\);/.test(aldeaFuente));
    // lo que PASO_PARCHE da, usado por el parche: la prueba de que el parche de verdad lo usa (con la malla del terreno de mentira)
    ok('con el 1 m los nodos de 2 m siguen siendo nodos (el borde cose igual con la gruesa)', Number.isInteger(2 / AM.PASO_PARCHE));
  }
  return R;
}

if (process.argv.includes('--hijo')) {
  comprobar().then((R) => console.log(JSON.stringify(R)), (e) => { console.log(JSON.stringify([['error: ' + (e && e.message), false]])); });
} else {
  let malas = 0;
  const hijo = (src) => {
    const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, C4291B_SRC: src }, encoding: 'utf8', maxBuffer: 1 << 26 });
    try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
  };
  const base = hijo(SRC);
  if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
  for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

  // ---- mutaciones
  const MUT = [
    ['main.js', 'V tira con una charla abierta', 'if (charla.npc || charla.menu || panelDelHudAbierto() || panelFueraDelHudAbierto() || personalAbierto()) return;', 'if (panelDelHudAbierto() || panelFueraDelHudAbierto() || personalAbierto()) return;'],
    ['main.js', 'V tira con el menú de la charla', 'if (charla.npc || charla.menu || panelDelHudAbierto()', 'if (charla.npc || panelDelHudAbierto()'],
    ['main.js', 'V tira con un panel del HUD', 'charla.menu || panelDelHudAbierto() || panelFueraDelHudAbierto() || personalAbierto()) return;   // 4.29.1', 'charla.menu || panelFueraDelHudAbierto() || personalAbierto()) return;   // 4.29.1'],
    ['main.js', 'V tira con un panel de afuera del HUD', 'panelDelHudAbierto() || panelFueraDelHudAbierto() || personalAbierto()) return;   // 4.29.1', 'panelDelHudAbierto() || personalAbierto()) return;   // 4.29.1'],
    ['main.js', 'V tira con personalizar abierto', 'panelFueraDelHudAbierto() || personalAbierto()) return;   // 4.29.1', 'panelFueraDelHudAbierto()) return;   // 4.29.1'],
    ['main.js', 'siempre «E para subir»', "${tren.puedeSubir(js) ? ' · E para subir' : ' · acercate a una puerta'}", "${' · E para subir'}"],
    ['main.js', 'nunca «E para subir»', "${tren.puedeSubir(js) ? ' · E para subir' : ' · acercate a una puerta'}", "${' · acercate a una puerta'}"],
    ['aldea-arquitectura.js', 'el cartel sin el domingo', 'Sáb. de baile hasta las 16 · Dom. cerrado', 'Sáb. de baile hasta las 16'],
    ['aldea-arquitectura.js', 'el cartel sin el sábado de baile', 'Sáb. de baile hasta las 16 · Dom. cerrado', 'Dom. cerrado'],
    ['aldea-arquitectura.js', 'el cartel con la hora del baile equivocada', 'hasta las 16 ·', 'hasta las 18 ·'],
    ['aldea-arquitectura.js', 'el cartel con la tarde equivocada', 'y 14:30 a 18\\n', 'y 14:30 a 19\\n'],
    ['aldea-arquitectura.js', 'los renglones del cartel no se parten', "cfg.texto.split('\\n')", '[cfg.texto]'],
    ['aldea-arquitectura.js', 'el cartel de dos renglones con letra diminuta', 'let tam = renglones.length > 1 ? 40 : cfg.mano ? 66 : 54;', 'let tam = renglones.length > 1 ? 20 : cfg.mano ? 66 : 54;'],
    ['aldea-arquitectura.js', 'los dos renglones en el mismo lugar', 'const dy = (k - (renglones.length - 1) / 2) * tam * 1.1;', 'const dy = 0;'],
    ['trochita.js', 'el alero del andén sin `emissive`', 'new THREE.MeshLambertMaterial({ color: 0x5a4a3e, emissive: 0x241a12 })', 'new THREE.MeshLambertMaterial({ color: 0x5a4a3e })'],
    ['trochita.js', 'el alero del andén con un `emissive` casi negro', 'emissive: 0x241a12', 'emissive: 0x050403'],
    ['aldea-mundo.js', 'el parche vuelve a 2 m', 'export const PASO_PARCHE = 1;', 'export const PASO_PARCHE = 2;'],
    ['aldea-mundo.js', 'el parche no usa PASO_PARCHE', 'Math.ceil((X1 - X0) / PASO_PARCHE)), nz = Math.max(2, Math.ceil((Z1 - Z0) / PASO_PARCHE))', 'Math.ceil((X1 - X0) / 2)), nz = Math.max(2, Math.ceil((Z1 - Z0) / 2))'],
  ];
  for (const [archivo, nombre, de, a] of MUT) {
    const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
    if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4291b-'));
    fs.cpSync(SRC, dir, { recursive: true });
    fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
    const r = hijo(dir);
    const falla = !r || r.some(([, v]) => !v);
    console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
    if (!falla) malas++;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
  process.exit(malas ? 1 : 0);
}
