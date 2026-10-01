// 3.1: carreras contrarreloj, desafío del día y torneo de la semana.
//  1. Los circuitos sobre el terreno real (y las estructuras de verdad, armadas en un vm con
//     three): cada puerta dentro del valle y alcanzable; las de tierra en tierra firme, sin
//     árboles ni paredes en el camino, y el caballo sin agua honda; las del lago en agua
//     honda, con el tramo entero navegable.
//  2. Las reglas de la carrera: cuenta, largada en falso, puertas en orden (aun a galope con
//     pocos cuadros), meta, abandono, récord, fantasma y saneo.
//  3. El desafío del día y el torneo: deterministas por fecha / semana.
//  4. El torneo entre compus: fundir, sanear archivos y códigos hostiles, el archivo que
//     sólo crece, la carpeta de mentira.
//  5. Los enganches en main.js, guardado.js, plantilla.html, sincronia-main.cjs y preload.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as C from '../src/carreras.js';
import * as D from '../src/diarios.js';
import * as TO from '../src/torneo.js';
import * as TS from '../src/torneo-sync.js';
import { codigoDeLaSemana } from '../src/semilla.js';
import { N, RES, CELDA, MITAD, LIMITE, LAGO } from '../src/config.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
let cuenta = 0;
const ok = (c, m) => { assert.ok(c, m); cuenta++; };

// ---------------------------------------------------------------- 1. el mundo real
function armarMundo() {
  const src = path.join(raiz, 'src');
  const idModulo = (a) => '__mod_' + path.basename(a, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (d, s) => path.resolve(path.dirname(d), s);
  const info = new Map(), orden = [], vis = new Set();
  const visitar = (a) => {
    a = path.resolve(a); if (vis.has(a)) return; vis.add(a);
    const texto = fs.readFileSync(a, 'utf8'); const deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(a, m[2]));
    info.set(a, texto); for (const d of deps) visitar(d); orden.push(a);
  };
  for (const f of ['terreno.js', 'colisiones.js', 'puertas.js', 'estructuras.js']) visitar(path.join(src, f));
  const transformar = (a, texto) => {
    const ex = [];
    for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
    texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, n, s) => `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [p, q] = x.split(/\s+as\s+/); return q ? `${p}: ${q}` : p; }).join(', ')} } = ${idModulo(normalizar(a, s))};`);
    texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(a)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `;globalThis.__M=(()=>{const T=__mod_terreno.generarTerreno();const scene=new THREE.Scene();const col=__mod_colisiones.crearColisiones();
const veg={arboles:[],colisiones:[],despejar(){}};const puertas=__mod_puertas.crearPuertas(T,scene,col,null);
__mod_estructuras.crearEstructuras(T,scene,col,veg,puertas);return {T,col};})();`;
  const noop = () => {};
  const ctx2d = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { return p in t ? t[p] : noop; }, set(t, p, v) { t[p] = v; return true; } });
  const context = { console, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, performance: { now: () => 0 }, document: { createElement(tag) { return tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}; } } };
  context.globalThis = context; vm.createContext(context); vm.runInContext(code, context, { timeout: 60000 });
  return context.__M;
}
{
  const { T, col } = armarMundo();
  const libre = (x, z, r) => { const p = { x, y: T.altura(x, z), z }; col.resolver(p, r, 2.6); return Math.hypot(p.x - x, p.z - z) < 0.01; };
  // lo mismo que kayak.js y vela.js: flota donde el fondo está a más de 35 cm y dentro del lago
  const hondo = (x, z) => T.altura(x, z) < -0.35 && Math.hypot(x - LAGO.x, z - LAGO.z) < 220;
  const pend = (x, z) => T.pendiente[T.indice(x, z)];
  const bosque = (x, z) => T.bosque[T.indice(x, z)];
  // alcanzable desde el refugio caminando (sin la pendiente que resbala) o nadando
  const visto = new Uint8Array(N * N);
  const cola = [T.indice(T.lugares.refugio.x, T.lugares.refugio.z)];
  visto[cola[0]] = 1;
  const pasa = (k) => {
    const x = (k % N) * CELDA - MITAD, z = Math.floor(k / N) * CELDA - MITAD;
    return Math.abs(x) <= LIMITE && Math.abs(z) <= LIMITE && (T.pendiente[k] < 1.0 || !!T.agua(x, z));
  };
  for (let q = 0; q < cola.length; q++) {
    const k = cola[q], i = k % N, j = Math.floor(k / N);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii > RES || jj > RES) continue;
      const kk = jj * N + ii;
      if (!visto[kk] && pasa(kk)) { visto[kk] = 1; cola.push(kk); }
    }
  }
  // el lago navegable desde el kayak (conectado por agua honda al muelle)
  const m = T.lugares.muelle;
  const kayak = { x: m.x + Math.cos(m.ang) * 12 - Math.sin(m.ang) * 2.1, z: m.z + Math.sin(m.ang) * 12 + Math.cos(m.ang) * 2.1 };
  ok(hondo(kayak.x, kayak.z), 'el kayak del muelle flota');
  const agua = new Uint8Array(N * N);
  const colaA = [T.indice(kayak.x, kayak.z)];
  agua[colaA[0]] = 1;
  for (let q = 0; q < colaA.length; q++) {
    const k = colaA[q], i = k % N, j = Math.floor(k / N);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii > RES || jj > RES) continue;
      const kk = jj * N + ii;
      if (!agua[kk] && hondo(ii * CELDA - MITAD, jj * CELDA - MITAD)) { agua[kk] = 1; colaA.push(kk); }
    }
  }
  const lugares = Object.entries(T.lugares).filter(([, l]) => l && Number.isFinite(l.x));
  ok(C.CIRCUITOS.length >= 5 && C.CIRCUITOS.length <= 6, 'cinco o seis circuitos');
  for (const medio of ['pie', 'caballo', 'kayak', 'vela']) ok(C.CIRCUITOS.some((c) => c.medio === medio), `hay un circuito ${medio}`);
  ok(new Set(C.CIRCUITOS.map((c) => c.id)).size === C.CIRCUITOS.length, 'ids de circuito únicos');
  for (const c of C.CIRCUITOS) {
    const enAgua = c.medio === 'kayak' || c.medio === 'vela';
    const pts = [c.salida, ...c.puertas, c.salida];
    ok(c.puertas.length >= 2 && c.ref > 20, `${c.id}: puertas y tiempo de referencia`);
    const velocidad = { pie: 6.6, caballo: 11, kayak: 3.4, vela: 4.5 }[c.medio];
    const ideal = C.largoDe(c) / velocidad;
    ok(c.ref >= ideal * 1.05 && c.ref <= ideal * 2.2, `${c.id}: la referencia (${c.ref} s) es alcanzable pero no regalada (ideal ${ideal.toFixed(0)} s)`);
    for (const [n, p] of pts.slice(0, -1).entries()) {
      const q = `${c.id} punto ${n} (${p.x}, ${p.z})`;
      ok(Math.abs(p.x) <= LIMITE - 30 && Math.abs(p.z) <= LIMITE - 30, `${q}: adentro del valle`);
      // alrededor de la puerta, todo del mismo tipo: el radio entero
      const r = C.MEDIOS[c.medio].radio;
      for (let a = 0; a < 12; a++) for (const rr of [0, r * 0.5, r]) {
        const x = p.x + Math.cos(a / 12 * Math.PI * 2) * rr, z = p.z + Math.sin(a / 12 * Math.PI * 2) * rr;
        if (enAgua) assert.ok(hondo(x, z) && T.altura(x, z) < -1.2, `${q}: en agua honda en todo el radio`);
        else {
          assert.ok(!T.agua(x, z), `${q}: en tierra firme en todo el radio`);
          assert.ok(libre(x, z, 0.6), `${q}: sin paredes en la puerta`);
        }
      }
      if (enAgua) ok(agua[T.indice(p.x, p.z)], `${q}: se llega remando desde el muelle`);
      else {
        ok(visto[T.indice(p.x, p.z)], `${q}: se llega caminando desde el refugio`);
        ok(pend(p.x, p.z) < 0.6 && bosque(p.x, p.z) < 0.2, `${q}: plano y despejado`);
        for (const [k, l] of lugares) ok(Math.hypot(l.x - p.x, l.z - p.z) > 22, `${q}: lejos de ${k}`);
      }
    }
    // los tramos entre puertas, derechos, cada dos metros
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z);
      let bos = 0, n = 0;
      for (let d = 0; d <= L; d += 2) {
        const t = d / L, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
        const q = `${c.id} tramo ${i} en (${x.toFixed(0)}, ${z.toFixed(0)})`;
        if (enAgua) {
          // con margen a los costados: el velero mide 1,5 m de manga
          const nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L, margen = c.medio === 'vela' ? 5 : 3;
          assert.ok(hondo(x, z) && hondo(x + nx * margen, z + nz * margen) && hondo(x - nx * margen, z - nz * margen), `${q}: navegable`);
        } else {
          const w = T.agua(x, z);
          assert.ok(!w || (c.medio === 'pie' ? w.prof < 0.5 : w.prof < 0.3), `${q}: sin agua honda`);
          assert.ok(pend(x, z) < 0.62, `${q}: sin laderas que resbalen (${pend(x, z).toFixed(2)})`);
          assert.ok(libre(x, z, c.medio === 'caballo' ? 0.7 : 0.4), `${q}: sin paredes`);
          assert.ok(bosque(x, z) < (c.medio === 'caballo' ? 0.12 : 0.45), `${q}: sin monte cerrado (${bosque(x, z).toFixed(2)})`);
          bos += bosque(x, z); n++;
        }
      }
      if (!enAgua) ok(bos / n < 0.2, `${c.id} tramo ${i}: despejado en promedio`);
      cuenta++;
    }
  }
}

// ---------------------------------------------------------------- 2. las reglas de la carrera
{
  const c = C.circuitoDe('mirador');
  ok(C.circuitoDe('__proto__') === null && C.circuitoDe('constructor') === null && C.circuitoDe(7) === null, 'circuitoDe no ve lo heredado');
  const rec = C.recorridoDe(c);
  ok(rec.length === c.puertas.length + 1 && rec.at(-1).meta, 'el recorrido termina en el poste');
  const inv = C.recorridoDe(c, 'invertido');
  ok(inv[0].x === c.puertas.at(-1).x && inv.at(-1).meta, 'al revés: la última puerta primero');
  const doble = C.recorridoDe(c, 'doble');
  ok(doble.length === (c.puertas.length + 1) * 2 && doble.filter((p) => p.meta).length === 1, 'dos vueltas: el poste en el medio no es la meta');
  ok(C.refDe(c, 'doble') === c.ref * 2 && C.claveRecord('mirador', 'doble') === 'mirador~x2' && C.claveRecord('mirador', 'raro') === 'mirador', 'claves y referencias');
  ok(C.medioDe({ montado: {} }) === 'caballo' && C.medioDe({ enKayak: true, enVela: true }) === 'vela' && C.medioDe({ enKayak: true }) === 'kayak' && C.medioDe({ enTren: true }) === 'otro' && C.medioDe({}) === 'pie', 'medioDe');

  // una vuelta entera, con pasos de 50 ms y velocidad de carrera
  const correr = (circuito, giro, vel, dt = 0.05, desvio = 0) => {
    const k = C.carreraNueva(circuito, giro);
    const eventos = [];
    const pos = { x: k ? C.circuitoDe(k.id).salida.x : 0, z: k ? C.circuitoDe(k.id).salida.z : 0 };
    for (let i = 0; i < 200 && k.fase === 'cuenta'; i++) { const e = C.pasoCarrera(k, dt, pos, k.medio); if (e) eventos.push(e); }
    let objetivo = 0;
    for (let i = 0; i < 100000 && k.fase !== 'fin'; i++) {
      const p = k.puntos[k.sig];
      const dx = p.x - pos.x, dz = p.z - pos.z, d = Math.hypot(dx, dz);
      const paso = Math.min(d, vel * dt);
      pos.x += dx / (d || 1) * paso + desvio; pos.z += dz / (d || 1) * paso;
      const e = C.pasoCarrera(k, dt, pos, k.medio);
      if (e) eventos.push(e);
      objetivo = k.sig;
    }
    return { k, eventos, objetivo };
  };
  const r = correr(c, null, 6.6);
  ok(r.eventos[0].tipo === 'cuenta' && r.eventos.some((e) => e.tipo === 'largada'), 'cuenta regresiva y largada');
  ok(r.eventos.filter((e) => e.tipo === 'puerta').length === c.puertas.length, 'todas las puertas, en orden');
  const meta = r.eventos.find((e) => e.tipo === 'meta');
  ok(meta && meta.ms > 0 && meta.parciales.length === c.puertas.length, 'la meta con sus parciales');
  ok(Math.abs(meta.ms / 1000 - C.largoDe(c) / 6.6) < 3, `el tiempo es el del recorrido (${meta.ms} ms)`);
  ok(r.k.rastro.length >= 4 && r.k.rastro.length % 2 === 0, 'queda el rastro para el fantasma');
  // a galope con un cuadro cada medio segundo no se saltea una puerta (5,5 m por cuadro, radio 7)
  const galope = correr(C.circuitoDe('estepa'), null, 11, 0.25);
  ok(galope.eventos.some((e) => e.tipo === 'meta'), 'a galope y con pocos cuadros, igual pasa por todas');
  // una puerta salteada no cuenta: cruzar lejos no avanza
  {
    const k = C.carreraNueva('mirador');
    const s = C.circuitoDe('mirador').salida;
    for (let i = 0; i < 80; i++) C.pasoCarrera(k, 0.05, s, 'pie');
    ok(k.fase === 'corriendo', 'corriendo después de la cuenta');
    C.pasoCarrera(k, 0.05, { x: s.x + 30, z: s.z - 60 }, 'pie');
    ok(k.sig === 0, 'lejos de la puerta, no se cuenta');
  }
  // largada en falso, cambio de medio y demasiado larga
  {
    const k = C.carreraNueva('estepa');
    ok(C.pasoCarrera(k, 0.05, { x: 300, z: -60 }, 'caballo') === null || k.fase === 'cuenta', 'contando');
    const e = C.pasoCarrera(k, 0.05, { x: 330, z: -60 }, 'caballo');
    ok(e?.tipo === 'abandono' && /antes/.test(e.motivo) && k.fase === 'fin', 'salida en falso');
    const k2 = C.carreraNueva('estepa');
    const e2 = C.pasoCarrera(k2, 0.05, { x: 300, z: -60 }, 'pie');
    ok(e2?.tipo === 'abandono' && /caballo/.test(e2.motivo), 'bajarse del caballo abandona');
    const k3 = C.carreraNueva('mirador');
    for (let i = 0; i < 70; i++) C.pasoCarrera(k3, 0.05, C.circuitoDe('mirador').salida, 'pie');
    let fin = null;
    for (let i = 0; i < 20000 && !fin; i++) fin = C.pasoCarrera(k3, 0.25, { x: -262, z: 60 }, 'pie');
    ok(fin?.tipo === 'abandono' && /larga/.test(fin.motivo), 'quedarse quieto termina abandonando');
    ok(C.pasoCarrera(k3, 0.05, { x: 0, z: 0 }, 'pie') === null, 'una carrera terminada no hace nada');
    ok(C.pasoCarrera(C.carreraNueva('mirador'), 0.05, { x: NaN, z: 1 }, 'pie') === null, 'posición rota: nada');
    ok(C.carreraNueva('nada') === null, 'circuito que no existe');
  }
  // el fantasma se ralea en vueltas muy largas
  {
    const k = C.carreraNueva('lago');
    for (let i = 0; i < 80; i++) C.pasoCarrera(k, 0.05, C.circuitoDe('lago').salida, 'kayak');
    for (let i = 0; i < 4000; i++) C.pasoCarrera(k, 0.25, { x: 75 + (i % 2), z: 150 }, 'kayak');
    ok(k.rastro.length / 2 <= C.CARRERA.puntosFantasma && k.paso > C.CARRERA.pasoFantasma, 'el rastro nunca pasa el tope');
  }
  // récords
  const carreras = C.carrerasNuevo();
  const r1 = C.registrarTiempo(carreras, 'mirador', { ms: meta.ms, parciales: meta.parciales, fecha: '2026-09-30', rastro: r.k.rastro, paso: r.k.paso });
  ok(r1.mejoro && !r1.antes && carreras.mejores.mirador.fantasma && carreras.corridas === 1, 'el primer tiempo es récord, con fantasma');
  const r2 = C.registrarTiempo(carreras, 'mirador', { ms: meta.ms + 500, fecha: '2026-09-30' });
  ok(!r2.mejoro && r2.antes.ms === meta.ms && carreras.corridas === 2, 'uno más lento no pisa el récord');
  const r3 = C.registrarTiempo(carreras, 'mirador~inv', { ms: 50000, rastro: r.k.rastro });
  ok(r3.mejoro && !carreras.mejores['mirador~inv'].fantasma, 'al revés: récord sin fantasma');
  ok(!C.registrarTiempo(carreras, 'mirador', { ms: 12 }).mejoro, 'un tiempo imposible no cuenta');
  const f = carreras.mejores.mirador.fantasma;
  const p0 = C.posFantasma(f, 0), pMedio = C.posFantasma(f, meta.ms / 2000);
  ok(Math.hypot(p0.x - c.salida.x, p0.z - c.salida.z) < 1, 'el fantasma arranca en el poste');
  ok(pMedio && Math.hypot(pMedio.x - c.salida.x, pMedio.z - c.salida.z) > 20, 'y a mitad de vuelta está lejos');
  ok(C.posFantasma(f, meta.ms / 1000 + 5) === null && C.posFantasma(null, 1) === null, 'y después desaparece');
  // saneo
  const guardado = JSON.parse(JSON.stringify(carreras));
  const limpio = C.sanearCarreras(guardado);
  ok(JSON.stringify(limpio) === JSON.stringify(carreras), 'lo guardado vuelve igual');
  ok(JSON.stringify(C.sanearCarreras(null)) === JSON.stringify(C.carrerasNuevo()), 'una partida vieja arranca sin récords');
  const hostil = C.sanearCarreras({
    corridas: 'mil', mejores: JSON.parse('{"__proto__":{"ms":6000},"inventado":{"ms":6000},"faro":{"ms":"8000","parciales":[1,"x",3e9],"fecha":"<b>","fantasma":{"paso":0.5,"pts":[1,2,3]}},"lago":{"ms":-5},"estepa":{"ms":1e12},"regata":{"ms":9000,"fantasma":{"paso":0.5,"pts":[1,2,3,4,"x",5]}}}'),
  });
  ok(hostil.corridas === 0 && Object.keys(hostil.mejores).sort().join() === 'estepa,faro,regata', `saneo hostil (${Object.keys(hostil.mejores)})`);
  ok(hostil.mejores.faro.ms === 8000 && hostil.mejores.faro.fecha === '' && !hostil.mejores.faro.fantasma && hostil.mejores.faro.parciales.length === 2, 'números acotados, fantasma roto afuera');
  ok(hostil.mejores.estepa.ms === 3600000 && !hostil.mejores.regata.fantasma && !Object.hasOwn(hostil.mejores, '__proto__'), 'tope de tiempo y sin claves heredadas');
  ok(C.formatoTiempo(83456) === '1:23.4' && C.diferenciaTexto(-1500) === '−0:01.5' && C.diferenciaTexto(200) === '+0:00.2', 'formato del reloj');
  ok(C.puntosCarrera(60000, 60) === 1000 && C.puntosCarrera(1, 60) === C.CARRERA.puntosMax && C.puntosCarrera(0, 60) === 0, 'puntos');
}

// ---------------------------------------------------------------- 3. el desafío del día
{
  const a = D.desafioDelDia('2026-09-30'), b = D.desafioDelDia('2026-09-30');
  ok(JSON.stringify(a) === JSON.stringify(b), 'la misma fecha, el mismo desafío');
  const tipos = new Set(), textos = new Set();
  let f = '2026-01-01';
  for (let i = 0; i < 120; i++) {
    const d = D.desafioDelDia(f);
    tipos.add(d.tipo); textos.add(d.titulo);
    ok(d.fecha === f && d.titulo && d.puntos > 0, `${f}: bien armado`);
    // el tamaño pedido tiene que existir en esa especie (pesca.js: arcoíris hasta 58, perca 44, pejerrey 38)
    if (d.tipo === 'pesca') ok(d.cmMin <= { '': 58, arcoiris: 58, perca: 44, pejerrey: 38 }[d.pez] - 4 && d.n >= 2 && d.n <= 4, `${f}: una pesca posible (${d.titulo})`);
    if (d.tipo === 'carrera') ok(D.CIRCUITOS_DEL_DIA.includes(d.circuito) && ['pie', 'kayak'].includes(C.circuitoDe(d.circuito).medio), 'un circuito que cualquiera puede correr');
    const siguiente = new Date(Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10) + 1));
    f = siguiente.toISOString().slice(0, 10);
  }
  ok(tipos.size === D.TIPOS_DIARIO.length && textos.size > 30, `en cuatro meses salen todos los tipos (${[...tipos]}) y variados (${textos.size})`);
  ok(D.diaAnterior('2026-03-01') === '2026-02-28' && D.diaAnterior('2025-01-01') === '2024-12-31' && D.diaAnterior('x') === '', 'el día anterior');
  ok(D.fechaValida('2026-02-28') && !D.fechaValida('2026-02-30') && !D.fechaValida('2026-9-30'), 'fechas válidas');
  ok(D.fechaTexto(new Date(2026, 8, 30, 23, 59)) === '2026-09-30', 'la fecha de la compu, en su huso');
  // buscar un día de cada tipo y cumplirlo
  const deTipo = (tipo, desde = '2026-10-01') => { let x = desde; for (let i = 0; i < 400; i++) { const d = D.desafioDelDia(x); if (d.tipo === tipo) return d; x = new Date(Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10) + 1)).toISOString().slice(0, 10); } return null; };
  const est = D.diariosNuevo();
  const pesca = deTipo('pesca');
  const pezBueno = { tipo: 'pez', id: pesca.pez || 'arcoiris', cm: 60 };
  ok(D.avanzarDiario(est, pesca, { tipo: 'pez', id: pesca.pez ? 'otro' : 'arcoiris', cm: pesca.pez ? 60 : 1 }) === null || !pesca.cmMin, 'un pez que no cuenta no avanza');
  for (let i = 0; i < pesca.n - 1; i++) D.avanzarDiario(est, pesca, pezBueno);
  const hecho = D.avanzarDiario(est, pesca, pezBueno);
  ok(hecho?.cumplido && est.racha === 1 && est.ultimo === pesca.fecha && est.historial[pesca.fecha] === pesca.puntos, 'pesca cumplida: racha 1');
  ok(D.avanzarDiario(est, pesca, pezBueno) === null, 'cumplido, no se cuenta dos veces');
  // al día siguiente, otro tipo: la racha sigue
  const manana = new Date(Date.UTC(+pesca.fecha.slice(0, 4), +pesca.fecha.slice(5, 7) - 1, +pesca.fecha.slice(8, 10) + 1)).toISOString().slice(0, 10);
  const def2 = D.desafioDelDia(manana);
  const ev = { pesca: { tipo: 'pez', id: def2.pez || 'arcoiris', cm: 80 }, carrera: { tipo: 'carrera', circuito: def2.circuito, giro: def2.giro === 'meta' ? null : def2.giro, ms: 20000 }, obra: { tipo: 'obra', plano: def2.plano, horas: 12 }, tren: null }[def2.tipo];
  let r2 = null;
  if (def2.tipo === 'tren') { D.avanzarDiario(est, def2, { tipo: 'entregas', valor: 4 }); r2 = D.avanzarDiario(est, def2, { tipo: 'entregas', valor: 4 + def2.n }); }
  else for (let i = 0; i < 6 && !r2?.cumplido; i++) r2 = D.avanzarDiario(est, def2, ev);
  ok(r2?.cumplido && est.racha === 2 && D.rachaVigente(est, manana) === 2, `el día siguiente (${def2.tipo}) sigue la racha`);
  const lejos = '2027-01-15';
  ok(D.rachaVigente(est, lejos) === 0, 'sin jugar unos días, la racha se corta');
  // obra tarde, carrera lenta
  const dObra = deTipo('obra');
  const eObra = D.diariosNuevo();
  ok(D.avanzarDiario(eObra, dObra, { tipo: 'obra', plano: dObra.plano, horas: 20 })?.tarde, 'la obra después de que cayó el sol no cuenta');
  ok(D.avanzarDiario(eObra, dObra, { tipo: 'obra', plano: 'otra', horas: 10 }) === null, 'otra obra no cuenta');
  ok(D.avanzarDiario(eObra, dObra, { tipo: 'obra', plano: dObra.plano, horas: 10 })?.cumplido, 'la obra a tiempo cuenta');
  let dMeta = null; { let x = '2026-10-01'; for (let i = 0; i < 800 && !dMeta; i++) { const d = D.desafioDelDia(x); if (d.tipo === 'carrera' && d.giro === 'meta') dMeta = d; x = new Date(Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10) + 1)).toISOString().slice(0, 10); } }
  ok(dMeta && dMeta.limiteMs > 10000, 'hay días de carrera contra el reloj');
  const eMeta = D.diariosNuevo();
  ok(D.avanzarDiario(eMeta, dMeta, { tipo: 'carrera', circuito: dMeta.circuito, giro: null, ms: dMeta.limiteMs + 1 })?.lento, 'más lento que el límite no cuenta');
  ok(D.avanzarDiario(eMeta, dMeta, { tipo: 'carrera', circuito: dMeta.circuito, giro: 'invertido', ms: 1000 }) === null, 'con otro giro no cuenta');
  ok(D.avanzarDiario(eMeta, dMeta, { tipo: 'carrera', circuito: dMeta.circuito, giro: null, ms: dMeta.limiteMs - 1 })?.cumplido, 'por debajo del límite, sí');
  const dTren = deTipo('tren');
  const eTren = D.diariosNuevo();
  ok(D.avanzarDiario(eTren, dTren, { tipo: 'entregas', valor: 7 }) === null && eTren.hoy.base === 7, 'el tren: la cuenta arranca de lo que ya habías entregado');
  ok(D.avanzarDiario(eTren, dTren, { tipo: 'entregas', valor: 7 + dTren.n })?.cumplido, 'y cumple con las entregas de hoy');
  // saneo
  const vuelta = D.sanearDiarios(JSON.parse(JSON.stringify(est)));
  ok(JSON.stringify(vuelta) === JSON.stringify(est), 'lo guardado vuelve igual');
  const h = D.sanearDiarios(JSON.parse('{"racha":-4,"mejorRacha":"x","ultimo":"2026-02-31","total":1e99,"hoy":{"fecha":"2026-09-30","avance":1e9,"hecho":"si","base":"7"},"historial":{"__proto__":5,"2026-09-01":"30","nada":4,"2026-13-01":2}}'));
  ok(h.racha === 0 && h.mejorRacha === 0 && h.ultimo === '' && h.total === 1e9 && h.hoy.avance === 1000 && h.hoy.hecho === false && h.hoy.base === 7, 'saneo hostil del desafío del día');
  ok(Object.keys(h.historial).join() === '2026-09-01' && h.historial['2026-09-01'] === 30, 'el historial sólo con fechas');
  ok(JSON.stringify(D.sanearDiarios(undefined)) === JSON.stringify(D.diariosNuevo()), 'partida vieja: vacío');
}

// ---------------------------------------------------------------- 4. el torneo de la semana
{
  const lunes = new Date(2026, 8, 28, 9), domingo = new Date(2026, 9, 4, 22), otroLunes = new Date(2026, 9, 5, 9);
  const t1 = TO.torneoDeLaSemana(lunes), t2 = TO.torneoDeLaSemana(domingo), t3 = TO.torneoDeLaSemana(otroLunes);
  ok(JSON.stringify(t1) === JSON.stringify(t2), 'toda la semana, el mismo torneo');
  ok(t1.semana === '2026-S40' && t3.semana === '2026-S41' && t1.codigo === codigoDeLaSemana(lunes), 'la semana ISO y el código del Desafío');
  const vistos = new Set();
  for (let s = 0; s < 30; s++) { const t = TO.torneoDeLaSemana(new Date(2026, 0, 5 + s * 7)); vistos.add(`${t.pez}|${t.circuito}`); ok(TO.CIRCUITOS_TORNEO.includes(t.circuito), 'circuito del torneo'); }
  ok(vistos.size >= 5, `el torneo cambia de semana en semana (${vistos.size})`);
  // nombres y entradas
  ok(TO.sanearNombre('<b>Ñandú</b>') === 'bÑandúb' && !/[<>&"'=()]/.test(TO.sanearNombre('  <img src=x onerror=alert(1)>  ')), 'sin marcas en el nombre');
  ok(TO.sanearNombre('Ñandú Pérez') === 'Ñandú Pérez' && TO.sanearNombre('x'.repeat(40)).length === 18 && TO.sanearNombre(42) === '', 'nombres con acentos, cortos');
  const e = TO.sanearEntrada({ semana: '2026-S40', nombre: 'Emma', pesca: 999, carreraMs: 12, noches: -3, abatidos: '17', t: 'x' });
  ok(e.pesca === 120 && e.carreraMs === 0 && e.noches === 0 && e.abatidos === 17 && e.t === 0, 'números acotados');
  ok(TO.sanearEntrada({ semana: '2026-S99', nombre: 'A' }) === null && TO.sanearEntrada({ semana: '2026-S40', nombre: '<>' }) === null && TO.sanearEntrada([1]) === null, 'entradas rotas afuera');
  const fundidas = TO.fundirEntradas(
    [{ semana: '2026-S40', nombre: 'Emma', pesca: 40, carreraMs: 70000, noches: 2, abatidos: 10 }],
    [{ semana: '2026-S40', nombre: 'emma', pesca: 52, carreraMs: 80000, noches: 2, abatidos: 30 }, { semana: '2026-S40', nombre: 'Juan', pesca: 30 }],
  );
  const emma = fundidas.find((x) => x.nombre === 'Emma');
  ok(fundidas.length === 2 && emma.pesca === 52 && emma.carreraMs === 70000 && emma.abatidos === 30, 'fundir: lo mejor de cada prueba, un renglón por jugador');
  const tabla = TO.tablaSemana(fundidas, t1);
  ok(tabla[0].nombre === 'Emma' && tabla[0].puntos.total > tabla[1].puntos.total, 'la tabla, ordenada');
  // lo local
  let guardado = null;
  let azar = 0.1;
  const ts = TS.crearTorneoSync({ leer: () => guardado, escribir: (_k, v) => { guardado = JSON.parse(JSON.stringify(v)); return true; }, azar: () => (azar = (azar * 7.3) % 1) });
  ok(/^[a-z0-9]{8}$/.test(ts.local.pc) && guardado?.pc === ts.local.pc, 'la compu recibe su identificador una vez');
  ok(TO.anotarPropio(ts.local, t1, { pesca: 44 }) && !TO.anotarPropio(ts.local, t1, { pesca: 40 }), 'un pez más chico no mejora');
  ok(TO.anotarPropio(ts.local, t1, { carreraMs: 61000 }) && TO.anotarPropio(ts.local, t1, { noches: 3, abatidos: 12 }), 'carrera y defensa suman');
  const mia = ts.local.propias.find((x) => x.semana === t1.semana);
  ok(mia.pesca === 44 && mia.carreraMs === 61000 && mia.noches === 3, 'una sola entrada por semana, con todo');
  ts.renombrar('Emma <3');
  ok(ts.local.nombre === 'Emma 3' && ts.local.propias.every((x) => x.nombre === 'Emma 3'), 'cambiar el nombre renombra lo propio');
  // el código para amigos
  const cod = TO.codigoPuntaje({ ...mia, nombre: 'Ñandú Pérez' });
  ok(/^HT1\.2026S40\.Nandu_Perez\.44\.61000\.3\.12\.[a-z0-9]{1,5}$/.test(cod) && cod.length < 60, `el código es corto (${cod})`);
  const leido = TO.leerCodigoPuntaje(`  ${cod} `);
  ok(leido && leido.nombre === 'Nandu Perez' && leido.pesca === 44 && leido.carreraMs === 61000 && leido.semana === '2026-S40', 'y se lee del otro lado');
  ok(TO.leerCodigoPuntaje(cod.replace('.44.', '.99.')) === null, 'un código tocado no pasa la firma');
  for (const malo of ['', 'HT1', 'HT1.2026S40.x.1.2.3.4', 'x'.repeat(500), null, 12, 'HT1.2026S40.<script>.1.1.1.1.abc', `HT1.2026S40.a.1.99999999.1.1.aaaaa`]) ok(TO.leerCodigoPuntaje(malo) === null, `código hostil rechazado (${String(malo).slice(0, 20)})`);
  ok(TO.sumarAmigo(ts.local, leido) && ts.local.amigos.length === 1, 'el amigo queda en la lista');
  ok(!TO.sumarAmigo(ts.local, { ...leido, nombre: 'Emma 3' }), 'uno mismo no se suma como amigo');
  ok(TO.defensaDeRecords({ [t1.codigo]: { noches: 4, abatidos: 20 } }, t1).noches === 4 && TO.defensaDeRecords(JSON.parse('{"__proto__":{"noches":9}}'), t1).noches === 0, 'la defensa sale del récord del código de la semana');

  // la carpeta de mentira: dos compus y un archivo hostil
  const carpeta = new Map();
  const api = {
    torneoLeer: async () => [...carpeta.entries()].map(([nombre, texto]) => ({ nombre, texto })),
    escritas: 0,
    torneoEscribir: async (nombre, texto) => { if (!TO.NOMBRE_ARCHIVO_TORNEO.test(nombre)) return false; api.escritas++; carpeta.set(nombre, texto); return true; },
  };
  let g1 = null, g2 = null;
  const pc1 = TS.crearTorneoSync({ api, leer: () => g1, escribir: (_k, v) => { g1 = JSON.parse(JSON.stringify(v)); return true; }, azar: () => 0.11 });
  const pc2 = TS.crearTorneoSync({ api, leer: () => g2, escribir: (_k, v) => { g2 = JSON.parse(JSON.stringify(v)); return true; }, azar: () => 0.77 });
  ok(pc1.local.pc !== pc2.local.pc, 'cada compu con lo suyo');
  pc1.renombrar('Casa'); pc2.renombrar('Oficina');
  TO.anotarPropio(pc1.local, t1, { pesca: 50 });
  TO.anotarPropio(pc2.local, t1, { pesca: 38, carreraMs: 58000 });
  ok(await pc1.sincronizar() && await pc2.sincronizar() && await pc1.sincronizar(), 'las dos escriben su archivo');
  ok(carpeta.size === 2, 'un archivo por compu, nada más');
  { const antes = api.escritas; ok(await pc1.sincronizar() && api.escritas === antes, 'sin nada nuevo, no se vuelve a escribir'); }
  const tablaPc1 = TO.tablaSemana(TO.todasLasEntradas(pc1.local), t1);
  ok(tablaPc1.length === 2 && tablaPc1.some((x) => x.nombre === 'Oficina' && x.carreraMs === 58000), 'la tabla de una compu tiene a la otra');
  // el archivo sólo crece: aunque se borre lo local, lo de la carpeta vuelve
  g1 = null;
  const pc1b = TS.crearTorneoSync({ api, leer: () => g1, escribir: (_k, v) => { g1 = JSON.parse(JSON.stringify(v)); return true; }, azar: () => 0.11 });
  pc1b.renombrar('Casa');
  await pc1b.sincronizar();
  ok(pc1b.local.propias.some((x) => x.pesca === 50), 'con el navegador borrado, lo propio vuelve de la carpeta');
  ok(JSON.parse(carpeta.get(TO.nombreArchivoTorneo(pc1.local.pc))).entradas.some((x) => x.pesca === 50), 'y el archivo no perdió nada');
  // archivos hostiles
  carpeta.set('hojarasca-torneo-malo1234.json', '{"formato":"hojarasca-torneo","pc":"otro9999","entradas":[{"semana":"2026-S40","nombre":"Impostor","pesca":120}]}');
  carpeta.set('hojarasca-torneo-roto0000.json', '{no es json');
  carpeta.set('hojarasca-torneo-enorme00.json', JSON.stringify({ formato: 'hojarasca-torneo', pc: 'enorme00', entradas: [], relleno: 'x'.repeat(TO.TORNEO.maxTexto) }));
  carpeta.set('hojarasca-torneo-proto000.json', '{"formato":"hojarasca-torneo","pc":"proto000","entradas":[{"__proto__":{"pesca":120},"semana":"2026-S40","nombre":"Proto","pesca":"30","noches":1e9,"carreraMs":-1}],"amigos":"x"}');
  carpeta.set('otra-cosa.json', '{"formato":"hojarasca-torneo","pc":"zzzz1111","entradas":[{"semana":"2026-S40","nombre":"Colado","pesca":10}]}');
  carpeta.set('hojarasca-torneo-lista00.json', JSON.stringify({ formato: 'hojarasca-torneo', pc: 'lista00', entradas: Array.from({ length: 5000 }, (_, i) => ({ semana: '2026-S40', nombre: `N${i}`, pesca: 1 })) }));
  await pc2.sincronizar();
  const nombres = TO.tablaSemana(TO.todasLasEntradas(pc2.local), t1).map((x) => x.nombre);
  ok(!nombres.includes('Impostor') && !nombres.includes('Colado'), 'un archivo con el nombre de otra compu, o que no es del torneo, no entra');
  const proto = TO.todasLasEntradas(pc2.local).find((x) => x.nombre === 'Proto');
  ok(proto && proto.pesca === 30 && proto.noches === 999 && proto.carreraMs === 0 && ({}).pesca === undefined, 'el archivo raro entra saneado, sin contaminar nada');
  ok(TO.todasLasEntradas(pc2.local).filter((x) => /^N\d+$/.test(x.nombre)).length <= TO.TORNEO.maxEntradasArchivo, 'un archivo gigante se recorta');
  ok(TO.leerArchivoTorneo('x'.repeat(TO.TORNEO.maxTexto + 1)) === null && TO.leerArchivoTorneo('[]') === null && TO.leerArchivoTorneo('null') === null, 'lecturas hostiles');
  ok(TO.leerCarpetaTorneo('nada').length === 0 && TO.leerCarpetaTorneo([null, 1, { nombre: 5 }]).length === 0, 'la lista de archivos también se sanea');
  // sin carpeta: no hace nada ni rompe
  const sola = TS.crearTorneoSync({ leer: () => null, escribir: () => true });
  ok(await sola.sincronizar() === false && !sola.hayCarpeta(), 'sin carpeta sincronizada, no pasa nada');
  const apiRota = { torneoLeer: async () => { throw new Error('disco'); }, torneoEscribir: async () => true };
  const rota = TS.crearTorneoSync({ api: apiRota, leer: () => null, escribir: () => true });
  ok(await rota.sincronizar() === false && /disco/.test(rota.estado().error), 'un error de disco se informa, no rompe');
  // saneo de lo local
  const lh = TO.sanearTorneoLocal(JSON.parse('{"pc":"../x","nombre":"<b>","propias":"x","amigos":[{"semana":"2026-S40","nombre":"A","pesca":1e9}],"carpeta":null}'));
  ok(lh.pc === '' && lh.nombre === 'b' && lh.propias.length === 0 && lh.amigos[0].pesca === 120 && lh.carpeta.length === 0, 'lo local también se sanea');
}

// ---------------------------------------------------------------- 5. los enganches
{
  const main = leer('src/main.js');
  const guardado = leer('src/guardado.js');
  const html = leer('src/plantilla.html');
  const syncMain = leer('sincronia-main.cjs');
  const preload = leer('preload.cjs');
  const juego = leer('src/modos-juego.js');
  for (const f of ['carreras.js', 'diarios.js', 'torneo.js', 'torneo-sync.js']) {
    const t = leer(`src/${f}`);
    ok(!/from ['"]three['"]|document\.|window\./.test(t), `${f} es puro (sin three ni DOM)`);
    ok(!/^export\s+(async\s+function|function\*)|^export\s+\*|^export\s+\{[^}]*\}\s+from/m.test(t), `${f}: exports que armar.mjs entiende`);
    for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `${f}: ${m[1]} sin eñe`);
  }
  ok(/^import \{ crearModos, CSS_MODOS \} from '\.\/modos-juego\.js';$/m.test(main), 'main importa el pegamento de 3.1 (en una línea, como pide armar.mjs)');
  ok(/carreras: sanearCarreras\(p\.carreras\)/.test(guardado) && /diarios: sanearDiarios\(p\.diarios\)/.test(guardado), 'guardado sanea carreras y desafío del día');
  // la tecla E y el aviso: la carrera en los dos, antes del caballo, con la misma condición
  const e = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'Tab':"));
  const ie = e.indexOf('modos?.accion(jugador.estado)'), idm = e.indexOf('if (js.montado) { desmontar(); break; }');
  ok(ie > 0 && idm > ie && e.indexOf('if (vecino) { hablar(vecino); break; }') < ie, 'la tecla E: la carrera después de hablar y antes de bajarse del caballo');
  const a = main.slice(main.indexOf('let aviso = objetivo ?'), main.indexOf('mostrarAviso(aviso);'));
  const ia = a.indexOf('modos?.accion(js)');
  ok(ia > 0 && ia < a.indexOf("'Ver qué hay en el almacén'"), 'el aviso: la carrera en el mismo lugar');
  ok(/if \(js\.montado && !charla\.npc\) aviso = vecino \? .*: avisoCarrera \?/.test(a), 'montado, el aviso ofrece la carrera (E larga en vez de bajar)');
  ok(/modos\?\.pez\?\.\(pez\)/.test(main) && /modos\?\.obraTerminada\?\.\(/.test(main), 'los enganches de la pesca y las obras');
  ok(/modos\?\.actualizar\(dt\)/.test(main), 'la carrera avanza en el bucle');
  for (const id of ['modos31', 'modos31-contenido', 'cerrar-modos31', 'btn-modos-inicio', 'btn-modos', 'diario-portada', 'carrera-hud']) ok(html.includes(`id="${id}"`), `la plantilla tiene #${id}`);
  ok(/torneo-leer/.test(syncMain) && /torneo-escribir/.test(syncMain) && /NOMBRE_TORNEO/.test(syncMain) && /renameSync\(tmp/.test(syncMain), 'la carpeta: leer y escribir el torneo, con temporal y nombre fijo');
  ok(/torneoLeer:/.test(preload) && /torneoEscribir:/.test(preload), 'el preload expone el torneo');
  ok(!/from ['"]three['"]/.test(juego) && /crearCarrerasMundo/.test(juego), 'modos-juego: el dibujo va por carreras-mundo.js');
  // el main process: el nombre del archivo del torneo se valida allá también
  const { NOMBRE_TORNEO } = (await import('node:module')).createRequire(import.meta.url)(path.join(raiz, 'sincronia-main.cjs'));
  ok(NOMBRE_TORNEO.test('hojarasca-torneo-abcd1234.json') && !NOMBRE_TORNEO.test('../hojarasca-torneo-abcd1234.json') && !NOMBRE_TORNEO.test('hojarasca-relax-p1.hojarasca.json'), 'nombres de archivo del torneo');
}

console.log(`OK 3.1 carreras, desafío del día y torneo · ${cuenta} comprobaciones · ${C.CIRCUITOS.length} circuitos validados sobre el terreno real`);
