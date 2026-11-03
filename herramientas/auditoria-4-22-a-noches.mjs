// 4.22.0 (A): «Noches con forma»: la curva del Desafío antes (main = 4.21.0) y después (este árbol), con las reglas reales de los dos.
//   node herramientas/auditoria-4-22-a-noches.mjs            (todo)
//   node herramientas/auditoria-4-22-a-noches.mjs --jefe     (sólo la simulación del primer mandamás)
// «Antes» sale de `git archive main src` en una carpeta temporal; «después» es el árbol de trabajo. Los dos se miden con la misma cuenta
// (vida total de la oleada con el multiplicador de la noche, de la dificultad y de la vuelta, y la escala del primer mandamás si el módulo la trae).
// No toca el juego ni usa Electron.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const aqui = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const raiz = path.resolve(aqui, '..');
const soloJefe = process.argv.includes('--jefe');
const base = process.env.HOJ_BASE || 'main';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-a422-'));
execFileSync('git', ['-C', raiz, 'archive', '--format=tar', '-o', path.join(tmp, 'src.tar'), base, 'src', 'package.json'], { stdio: 'inherit' });
execFileSync('tar', ['-xf', 'src.tar'], { cwd: tmp, stdio: 'inherit' });
const imp = (dir, f) => import(pathToFileURL(path.join(dir, 'src', f)).href);

const f1 = (n) => Math.round(n * 10) / 10;
const prom = (a) => (a[0] + a[1]) / 2;
async function medir(dir) {
  const R = await imp(dir, 'desafio-reglas.js'), V = await imp(dir, 'desafio-vuelta.js');
  const P = fs.existsSync(path.join(dir, 'src', 'desafio-perillas.js')) ? await imp(dir, 'desafio-perillas.js') : null;
  const oleada = (n, dif = 'normal', vuelta = 0, meta = null, perillas = null) => {
    R.fijarPartidaMeta(meta);
    if (R.fijarPerillas) R.fijarPerillas(perillas);
    const lista = R.composicionOleada(n, dif, vuelta);
    const mult = R.multiplicadorNoche(n), mv = V.multiplicadorVuelta(vuelta), d = R.dificultad(dif);
    const escalaJefe = R.escalaDelJefe ? R.escalaDelJefe(n) : 1;
    let vida = 0, dano = 0, cristales = 0, danoObra = 0;
    for (const t of lista) {
      const def = R.TIPOS_ALIEN[t];
      vida += def.vida * mult * mv.vida * d.vida * (def.jefe ? escalaJefe : 1);
      dano += ((def.dano || 0) * mult * mv.dano * d.dano) / Math.max(0.5, def.cadencia || 1);
      danoObra += ((def.danoObra || 0) * mult * mv.dano) / Math.max(0.5, def.cadencia || 1);
      cristales += prom(def.cristales || [0, 0]);
    }
    if (R.fijarPerillas) R.fijarPerillas(null);
    return { n, cantidad: lista.length, vida: Math.round(vida), dano: Math.round(dano), danoObra: Math.round(danoObra), cristales: f1(cristales), jefe: lista.includes('jefe') };
  };
  return { R, V, P, oleada };
}
const A = await medir(path.join(tmp)), D = await medir(raiz);
const pct = (a, b) => `${Math.round((b / a - 1) * 100)}%`;

// ---------------------------------------------------------------- 1. el primer mandamás
console.log('# El primer mandamás (noche 5): la vida total de la oleada contra las noches de al lado (normal)\n');
{
  const filas = [];
  for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    const a = A.oleada(n), b = D.oleada(n), aP = A.oleada(n - 1), bP = D.oleada(n - 1);
    filas.push({ noche: n, antes: a.vida, 'antes/anterior': n > 3 ? `x${f1(a.vida / aP.vida)}` : '-', despues: b.vida, 'despues/anterior': n > 3 ? `x${f1(b.vida / bP.vida)}` : '-', jefe: b.jefe ? 'SÍ' : '' });
  }
  console.table(filas);
  // las variantes de la escala del primer mandamás, aplicadas a mano sobre la vida del jefe de la noche 5
  const R = D.R, V = D.V;
  R.fijarPartidaMeta(null); if (R.fijarPerillas) R.fijarPerillas(null);
  const lista5 = R.composicionOleada(5, 'normal', 0), mult5 = R.multiplicadorNoche(5);
  const sinJefeVida = lista5.filter((t) => t !== 'jefe').reduce((s, t) => s + R.TIPOS_ALIEN[t].vida * mult5, 0);
  const n4 = D.oleada(4).vida, n6 = D.oleada(6).vida, n8 = D.oleada(8).vida;
  const filasV = [];
  for (const k of [1, 0.8, 0.7, 0.6, 0.5, 0.4]) {
    const total = Math.round(sinJefeVida + R.TIPOS_ALIEN.jefe.vida * mult5 * k);
    filasV.push({ 'escala del jefe': k, 'vida del mandamás': Math.round(R.TIPOS_ALIEN.jefe.vida * mult5 * k), 'vida total noche 5': total, 'sobre la noche 4': `x${f1(total / n4)}`, 'sobre la noche 6': `x${f1(total / n6)}`, 'sobre el promedio de 4 y 6': `x${f1(total / ((n4 + n6) / 2))}`, 'contra la noche 8': `${Math.round((total / n8 - 1) * 100)}%` });
  }
  console.log('\nVariantes de la escala del primer mandamás (la oleada de los demás duendes queda igual):');
  console.table(filasV);
  const vecinas = (m, n) => { const v = m.oleada(n).vida; return `x${f1(v / ((m.oleada(n - 1).vida + m.oleada(n + 1).vida) / 2))}`; };
  console.log(`Los otros mandamases, sobre el promedio de las dos noches de al lado: noche 10 ${vecinas(D, 10)} · noche 15 ${vecinas(D, 15)} (antes ${vecinas(A, 10)} y ${vecinas(A, 15)}); la noche 5 era ${vecinas(A, 5)}, ahora ${vecinas(D, 5)}`);
  console.log(`(sin el mandamás, la noche 5 trae ${Math.round(sinJefeVida)} de vida; la noche 4, ${n4}; la noche 8, ${n8}) · escala elegida: ${R.ESCALA_PRIMER_JEFE ? R.ESCALA_PRIMER_JEFE.vida : '-'}`);
}
if (soloJefe) { fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0); }

// ---------------------------------------------------------------- 2. la curva
console.log('\n# La curva noche por noche (campaña, normal): antes (4.21.0) y después\n');
{
  const filas = []; let pa = null, pd = null;
  for (let n = 1; n <= 20; n++) {
    const a = A.oleada(n), b = D.oleada(n);
    filas.push({ noche: n, 'duendes antes': a.cantidad, 'duendes ahora': b.cantidad, 'vida antes': a.vida, 'vida ahora': b.vida, 'creció antes': pa ? pct(pa.vida, a.vida) : '-', 'creció ahora': pd ? pct(pd.vida, b.vida) : '-', 'daño a vos/s antes': a.dano, 'ahora': b.dano, jefe: b.jefe ? 'SÍ' : '' });
    pa = a; pd = b;
  }
  console.table(filas);
  const crece = (m) => { const a = m.oleada(11).vida, b = m.oleada(19).vida; return `${f1((Math.pow(b / a, 1 / 8) - 1) * 100)} % por noche`; };
  console.log(`Crecimiento de la vida total de la noche 11 a la 19 (sin mandamases): antes ${crece(A)} · ahora ${crece(D)}   (la cantidad llega a ${D.oleada(19).cantidad} en la noche 19; antes 18 desde la 9)`);
  const nocheDe = (m) => [5, 10, 15, 20].map((n) => `${n}: ${m.oleada(n).vida}`).join(' · ');
  console.log(`Noches de mandamás (vida total) antes ${nocheDe(A)} · ahora ${nocheDe(D)}`);
}

// ---------------------------------------------------------------- 3. las dificultades y los modos
console.log('\n# Vida total de la oleada por dificultad y modo (duendes / vida): antes → ahora\n');
{
  const filas = [];
  for (const [dif, meta] of [['tranquila', null], ['normal', null], ['implacable', null], ['normal', { modo: 'pesadilla', ventajas: [], reglas: [] }], ['implacable', { modo: 'pesadilla', ventajas: [], reglas: [] }], ['normal', { modo: 'corta', ventajas: [], reglas: [] }]]) {
    const fila = { dificultad: dif, modo: meta?.modo || 'campaña' };
    for (const n of [1, 3, 5, 7, 10, 15, 20]) { const a = A.oleada(n, dif, 0, meta), b = D.oleada(n, dif, 0, meta); fila[`n${n}`] = a.vida === b.vida && a.cantidad === b.cantidad ? `${b.cantidad}/${b.vida}` : `${a.cantidad}/${a.vida} → ${b.cantidad}/${b.vida}`; }
    filas.push(fila);
  }
  console.table(filas);
}

// ---------------------------------------------------------------- 4. las vueltas
console.log('\n# Las vueltas (Otra vuelta), normal: duendes / vida / daño a vos por segundo\n');
{
  const filas = [];
  for (const v of [0, 1, 2, 3, 5, 9]) {
    const a10 = A.oleada(10, 'normal', v), b10 = D.oleada(10, 'normal', v), a20 = A.oleada(20, 'normal', v), b20 = D.oleada(20, 'normal', v);
    filas.push({ vuelta: v + 1, 'n10 antes': `${a10.cantidad} / ${a10.vida}`, 'n10 ahora': `${b10.cantidad} / ${b10.vida}`, 'n20 antes': `${a20.cantidad} / ${a20.vida} / ${a20.dano}/s`, 'n20 ahora': `${b20.cantidad} / ${b20.vida} / ${b20.dano}/s` });
  }
  console.table(filas);
  const m = (V) => [0, 1, 2, 3, 9].map((v) => { const x = V.multiplicadorVuelta(v); return `v${v + 1}: x${f1(x.cantidad * 100) / 100}/${f1(x.vida * 100) / 100}/${f1(x.dano * 100) / 100}`; }).join(' · ');
  console.log(`Cantidad / vida / daño por vuelta · antes ${m(A.V)} · ahora ${m(D.V)}`);
  // la vuelta en que la cantidad pega con el tope de la oleada (noche 18 de cada vuelta, sin jefe)
  const tope = (m) => { for (let v = 0; v <= 9; v++) if (m.oleada(19, 'normal', v).cantidad >= 24) return v + 1; return '>10'; };
  console.log(`Primera vuelta en la que la noche 19 llega al tope de 24: antes ${tope(A)} · ahora ${tope(D)}`);
}

// ---------------------------------------------------------------- 5. las semillas doradas
console.log('\n# Semillas doradas: las que sueltan las oleadas (esperanza si matás a todos) contra lo que se compra\n');
{
  const C = await imp(raiz, 'construccion.js');
  const recetas = D.R.RECETAS.filter((r) => r.pide && r.pide.cristal);
  const unicas = recetas.filter((r) => r.unica).reduce((s, r) => s + r.pide.cristal, 0);
  const planos = C.PLANOS.filter((p) => p.etapas?.some((e) => e.pide?.cristal)).reduce((s, p) => s + p.etapas.reduce((x, e) => x + (e.pide?.cristal || 0), 0), 0);
  const filas = []; let aa = 0, ad = 0, cajas = 0;
  for (let n = 1; n <= 20; n++) {
    aa += A.oleada(n).cristales; ad += D.oleada(n).cristales;
    cajas += n >= 3 ? 1 + Math.floor(n / 3) : 0;   // la caja del alba (suministrosDelAlba)
    if ([1, 3, 5, 7, 10, 15, 20].includes(n)) filas.push({ 'hasta la noche': n, 'sueltas antes': Math.round(aa), 'sueltas ahora': Math.round(ad), 'rebaja': pct(aa, ad), 'más las cajas del alba': Math.round(ad + cajas) });
  }
  console.table(filas);
  const total = unicas + planos + 4;   // todo lo que se compra una vez (38 + 24 + 4 = 66, la cuenta del informe)
  const nocheDe = (m) => { let s = 0, c = 0; for (let n = 1; n <= 20; n++) { s += m.oleada(n).cristales; c += n >= 3 ? 1 + Math.floor(n / 3) : 0; if (s + c >= total) return n; } return '>20'; };
  console.log(`Lo único que se compra con semillas: ${unicas} (recetas) + ${planos} (planos, una vez cada uno) + 4 (munición, una vez cada una) = ${total}. Lo que sueltan las oleadas más las cajas del alba lo cubre entero hacia la noche ${nocheDe(D)} (antes, la ${nocheDe(A)}): sobran las semillas desde ahí, y por eso perderlas al caer casi no dolía.`);
}

// ---------------------------------------------------------------- 6. lo que cuesta caer
console.log('\n# Lo que cuesta caer (30 % de los materiales y todas las semillas hasta la 4.21.0)\n');
{
  const P = D.P;
  const filas = [];
  for (const n of [1, 3, 5, 8, 10, 12, 15, 20]) {
    const t = P.castigoDeCaer(n, 'normal'), q = P.castigoDeCaer(n, 'tranquila');
    const M = P.aplicarCastigo({ tronco: 40, tabla: 40, piedra: 40, cristal: 12 }, t), MQ = P.aplicarCastigo({ tronco: 40, tabla: 40, piedra: 40, cristal: 12 }, q);
    filas.push({ noche: n, 'materiales que se pierden antes': '30%', 'ahora': `${Math.round(t.materiales * 100)}%`, 'de 40 tablas quedan': M.tabla, 'semillas (12) normal': M.cristal, 'semillas (12) Tranquila': MQ.cristal });
  }
  console.table(filas);
}

// ---------------------------------------------------------------- 7. las perillas
console.log('\n# Las perillas: la noche 10 en Normal con cada una sola (duendes / vida / daño a vos por segundo)\n');
{
  const filas = [];
  const base = D.oleada(10);
  const otras = [['todas en 0', null], ['cantidad −2', { cantidad: -2 }], ['cantidad +2', { cantidad: 2 }], ['vida −2', { vida: -2 }], ['vida +2', { vida: 2 }], ['daño −2', { dano: -2 }], ['daño +2', { dano: 2 }], ['todas +1', { cantidad: 1, vida: 1, dano: 1 }], ['todas −2 (peor que Tranquila)', { cantidad: -2, vida: -2, dano: -2 }], ['todas +2', { cantidad: 2, vida: 2, dano: 2 }]];
  for (const [nombre, p] of otras) {
    const o = D.oleada(10, 'normal', 0, null, p);
    filas.push({ perillas: nombre, duendes: o.cantidad, vida: o.vida, 'vida vs 0': pct(base.vida, o.vida), 'daño a vos/s': o.dano, 'daño vs 0': pct(base.dano, o.dano) });
  }
  console.table(filas);
  const tr = D.oleada(10, 'tranquila'), im = D.oleada(10, 'implacable');
  const im1 = D.oleada(10, 'normal', 0, null, { cantidad: 2, vida: 2, dano: 2 }), tr1 = D.oleada(10, 'normal', 0, null, { cantidad: -2, vida: -2, dano: -2 });
  console.log(`Referencia noche 10: Tranquila ${tr.cantidad}/${tr.vida}/${tr.dano}s · Normal con todo −2 ${tr1.cantidad}/${tr1.vida}/${tr1.dano}s · Normal ${base.cantidad}/${base.vida}/${base.dano}s · Implacable ${im.cantidad}/${im.vida}/${im.dano}s · Normal con todo +2 ${im1.cantidad}/${im1.vida}/${im1.dano}s`);
  console.log('(el tope de 24 duendes por oleada sigue valiendo: con la cantidad +2 pasada la noche 8 casi no suma)');
}

fs.rmSync(tmp, { recursive: true, force: true });
