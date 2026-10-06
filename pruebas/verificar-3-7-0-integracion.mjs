// 3.7.0 (integración): la calle de la Loma montada en el mundo, con todo junto (sin Electron):
//  · los nueve locales nuevos en aldea-mundo.js (sin el filtro provisorio), en sus manzanas propias, con su
//    terreno parejo (también el corral y el horno), la calle con ripio, los postes y los cables, los álamos y los
//    arbustos del borde acomodados, el ventanal del taller de arte mirando al norte y el desnivel del observatorio;
//  · la gente entra y sale por la puerta de verdad (el zaguán), trabaja junto a su herramienta y sube la escalera
//    del observatorio; las piezas que se mueven adentro quedan en su lugar;
//  · las mecánicas nuevas (el telescopio, las cartas del cielo, el mapa de las cumbres, el espejo) y los gestos;
//  · las personas se arman de a poco (y en la portada), los animales chocan y la ropa de abrigo se pone.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const fallas = [];
let pasos = 0;
const ok = (c, t) => { pasos++; if (!c) { fallas.push(t); console.error('✗ ' + t); } };

// ---------------------------------------------------------------- el valle en una VM (como verificar-3-6-mundo)
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
for (const e of ['terreno.js', 'colisiones.js', 'puertas.js', 'estructuras.js', 'aldea.js', 'aldea-mundo.js', 'aldea-gente.js', 'aldea-mecanicas.js', 'aldea-arquitectura.js', 'gente-cuerpo.js']) visitar(path.join(src, e));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.THREE = THREE; globalThis.M = {' + orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}: ${idModulo(f)}`).join(',') + '};\n';
const noop = () => {};
const fakeCtx = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; }, getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }, createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Error, Promise, structuredClone, setTimeout, clearTimeout,
  performance: { now: () => performance.now() }, document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => fakeCtx, style: {} }; return { style: {} }; } } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { timeout: 240000 });
const { THREE } = ctx;
const { terreno: Te, colisiones: C, puertas: P, estructuras: E, aldea: A, aldea_mundo: AM, aldea_gente: G, aldea_mecanicas: MC, aldea_arquitectura: AA, gente_cuerpo: GC } = ctx.M;
const EA = A.EDIFICIOS_ALDEA;
const LOMA = ['veterinaria', 'estudio-fotos', 'refugio-andinista', 'herboristeria', 'taller-arte', 'ceramica', 'varadero', 'observatorio', 'costureria'];
const m = A.marcoAldea();
const local = (id, q) => { const e = EA[id], c = Math.cos(e.rot), s = Math.sin(e.rot), dx = q.x - e.x, dz = q.z - e.z; return { x: dx * c - dz * s, z: dx * s + dz * c }; };

// ============================================================ 1. los nueve, en el mundo
{
  for (const id of LOMA) ok(AM.IDS_MUNDO_ALDEA.includes(id), `${id}: lo arma aldea-mundo.js`);
  ok(!/todavía no arma|lo suma el\s*\n?\/\/ equipo de arquitectura/.test(leer('src/aldea-mundo.js')) && !leer('src/aldea-mundo.js').includes('Object.hasOwn(EDIFICIOS_ARQUITECTURA, id))'), 'sin el filtro provisorio');
  ok(AM.IDS_MUNDO_ALDEA.length === Object.keys(EA).filter((id) => EA[id].rol !== 'estacion' && !EA[id].estructura).length, 'los veinte y los de siempre');
  // las manzanas: la calle de la Loma en columnas propias (antes todo lo de x < −27 caía en 'o2')
  for (const id of LOMA) ok(/^l[1-4]-[sn]$/.test(AM.manzanaDe(id)), `${id}: en la manzana ${AM.manzanaDe(id)}`);
  for (const id of Object.keys(EA)) if (AM.manzanaDe(id)?.startsWith('o2')) ok(EA[id].x >= -44, `${id}: en o2 sólo lo de la calle Norte`);
  const manzanas = new Set(LOMA.map((id) => AM.manzanaDe(id)));
  ok(manzanas.size >= 5, `la loma, en ${manzanas.size} manzanas`);
  // lo propio de cada uno
  ok(AM.OPCIONES_MUNDO.veterinaria.espejoAnexo && AM.OPCIONES_MUNDO.ceramica.espejoAnexo && AM.OPCIONES_MUNDO['taller-arte'].ventanal === 'frente', 'el corral, el horno y el ventanal');
  const vet = AA.armarEdificio('veterinaria', 4, AM.OPCIONES_MUNDO.veterinaria), co = vet.extra.corral;
  ok(co && co.x1 <= -vet.ancho / 2 && Math.abs((co.x0 + co.x1) / 2 - EA.veterinaria.anexo.x) < 0.05 && vet.ocupa.x0 <= co.x0 + 1e-6, `el corral, del costado del plano (${((co.x0 + co.x1) / 2).toFixed(2)})`);
  ok(AA.armarEdificio('veterinaria', 4, {}).extra.corral.x0 >= 4, 'sin la opción, donde estaba');
  const cer = AA.armarEdificio('ceramica', 4, AM.OPCIONES_MUNDO.ceramica);
  ok(cer.humo && cer.humo.lx < -3.5 && Math.abs(cer.puntos.nombrados.horno.lx - EA.ceramica.anexo.x) < 0.05, `el horno de barro, del costado del plano (${cer.humo.lx.toFixed(2)})`);
  const ta = AA.armarEdificio('taller-arte', 4, AM.OPCIONES_MUNDO['taller-arte']);
  ok(ta.extra.ventanal.cara === 'frente' && ta.ventanas.some((v) => v.ancho >= 2.5 && v.nz > 0.9), 'el ventanal del taller, en el frente');
  const r = EA['taller-arte'].rot, d = { x: Math.sin(r), z: Math.cos(r) };   // el frente, en el plano
  const a0 = m.aMundo(0, 0), a1 = m.aMundo(d.x, d.z);
  ok(a1.z - a0.z < -0.95, `el frente del taller (y su ventanal) mira al norte (−z del mundo: ${(a1.z - a0.z).toFixed(2)})`);
  ok(AA.EDIFICIOS_ALDEA.observatorio.desnivelSugerido > 0 && leer('src/aldea-mundo.js').includes('desnivelSugerido'), 'el desnivel con la calle, donde lo pide la arquitectura');
}

// ============================================================ 2. el terreno, la calle y lo de alrededor
{
  const T = Te.generarTerreno();
  AM.emparejarTerreno(T, AM.zonasEmparejar(), AM.callesNivelar());
  const h = (lx, lz) => { const w = m.aMundo(lx, lz); return T.altura(w.x, w.z); };
  for (const id of ['veterinaria', 'ceramica']) {
    const e = EA[id], x = e.anexo, c = Math.cos(e.rot), s = Math.sin(e.rot);
    let peor = 0;
    for (let bx = x.x - x.ancho / 2 + 0.6; bx <= x.x + x.ancho / 2 - 0.6; bx += 0.5) for (let bz = x.z - x.fondo / 2 + 0.6; bz <= x.z + x.fondo / 2 - 0.6; bz += 0.5) peor = Math.max(peor, Math.abs(h(e.x + bx * c + bz * s, e.z - bx * s + bz * c) - e.y));
    ok(peor < 0.06, `${id}: el ${x.id}, parejo con el lote (${peor.toFixed(3)} m)`);
  }
  // el ripio: la máscara llega a la punta de la calle de la Loma
  const mk = AM.mascaraRipio(), MR = AM.MARCO_RIPIO;
  const lee = (lx, lz) => mk.datos[(Math.floor((lz - MR.lz0) / MR.paso) * mk.W + Math.floor((lx - MR.lx0) / MR.paso)) * 4];
  ok(MR.lx0 <= -148 && lee(-140, 52) > 240 && lee(-100, 52) > 240 && lee(-60, 52) > 240 && lee(-100, 60) === 0, 'el ripio, a lo largo de la calle de la Loma');
  // los postes con sus cables siguen a la calle Norte; los álamos y los arbustos, afuera de la calle nueva
  const plan = AM.planAccesorios();
  const postes = plan.filter((a) => a.tipo === 'poste' && a.lx < -44);
  ok(postes.length >= 4 && postes.every((a) => a.lz > 52 && a.linea === 'calle-norte|0'), `${postes.length} postes en la calle de la Loma, del mismo lado y en la misma línea que los de la calle Norte`);
  const enAnexo = (a) => ['veterinaria', 'ceramica'].some((id) => { const q = local(id, { x: a.lx, z: a.lz }), x = EA[id].anexo; return Math.abs(q.x - x.x) < x.ancho / 2 + 0.3 && Math.abs(q.z - x.z) < x.fondo / 2 + 0.3; });
  for (const a of plan) if (a.tipo !== 'vereda') ok(!enAnexo(a), `${a.tipo} (${a.lx.toFixed(1)}, ${a.lz.toFixed(1)}): fuera del corral y del horno`);
  const loma = A.CALLES_ALDEA.find((c) => c.id === 'calle-loma');
  ok(plan.filter((a) => a.tipo === 'alamo' || a.tipo === 'arbusto').every((a) => A.distanciaACalle(a.lx, a.lz, loma) > 1.5), 'ningún álamo ni arbusto en la calle de la Loma');
  ok(plan.filter((a) => a.tipo === 'alamo' && a.lx < -60).length >= 10, 'los álamos de la loma');
  ok(plan.filter((a) => (a.tipo === 'frutal' || a.tipo === 'cerco' || a.tipo === 'cerco-pique') && a.lx < -44).length >= 6, 'frutales y cercos en los patios de la loma');
}

// ============================================================ 3. la gente: puertas, herramientas y la escalera
{
  for (const [id, xP] of Object.entries(A.PUERTA_X)) {
    const e = AA.armarEdificio(id, 4, AM.OPCIONES_MUNDO[id] || {});
    const p = e.puertas.find((q) => Math.abs(q.lz - e.fondo / 2) < 0.2) || e.puertas[0];
    ok(p ? Math.abs(p.lx - xP) < 0.05 : Math.abs((e.puntos.nombrados.adentro?.lx ?? 0) - xP) < 0.05, `${id}: la puerta de la gente, en la de verdad (x ${xP})`);
    const pts = A.puntosDe(id);
    ok(pts.zaguan && A.dentroDePlanta(id, pts.zaguan.x, pts.zaguan.z, 0.2) && !A.dentroDePlanta(id, pts.puerta.x, pts.puerta.z, -0.3), `${id}: el zaguán adentro, la puerta afuera`);
  }
  const sale = G.recorridoAldea(A.puntosDe('ceramica').adentro, A.puntosDe('plaza')['estar-1']);
  ok(sale[0].sinChoque && Math.hypot(sale[0].x - A.puntosDe('ceramica').zaguan.x, sale[0].z - A.puntosDe('ceramica').zaguan.z) < 1e-6, 'sale por el zaguán');
  // junto a su herramienta (los puntos de aldea.js, donde están en aldea-arquitectura.js)
  const TRABAJO = { veterinaria: 'camilla-animal', 'estudio-fotos': 'camara', 'refugio-andinista': 'mapa', herboristeria: 'mortero', 'taller-arte': 'atril', varadero: 'bote', observatorio: 'cartas', costureria: 'maquina-coser' };
  for (const id of LOMA) {
    const e = AA.armarEdificio(id, 4, AM.OPCIONES_MUNDO[id] || {}), N = e.puntos.nombrados, pts = A.puntosDe(id);
    const q = local(id, pts.adentro);
    if (TRABAJO[id]) ok(Math.hypot(q.x - N[TRABAJO[id]].lx, q.z - N[TRABAJO[id]].lz) < 0.05, `${id}: adentro, junto a ${TRABAJO[id]}`);
    else ok(e.puntos.asientos.some((a) => Math.hypot(q.x - a.lx, q.z - a.lz) < 0.05 && a.nombre === 'el banco del torno'), `${id}: adentro, en el banco del torno`);
    const c = local(id, pts.cama);
    ok(Math.hypot(c.x - N.cama.lx, c.z - N.cama.lz) < 0.05, `${id}: la cama de la vivienda`);
  }
  ok(A.SENTADO_ADENTRO.includes('ceramica') && A.SENTADO_ADENTRO.includes('costureria'), 'Malena y Pocha trabajan sentadas');
  // la escalera del observatorio
  const obs = AA.armarEdificio('observatorio', 4, {}), N = obs.puntos.nombrados;
  for (const [k, n] of [['escalera', 'escalera'], ['escalera-arriba', 'escalera-arriba'], ['telescopio', 'telescopio']]) {
    const q = local('observatorio', A.puntosDe('observatorio')[k]);
    ok(Math.hypot(q.x - N[n].lx, q.z - N[n].lz) < 0.05, `observatorio: ${k} donde está`);
  }
  ok(Math.abs(A.ESCALERAS_ALDEA.observatorio.alto - N.telescopio.ly) < 0.02, `arriba, a ${N.telescopio.ly} m`);
  ok(G.esArriba('observatorio', 'telescopio') && !G.esArriba('observatorio', 'adentro'), 'el telescopio está arriba');
  const sube = G.tramoEscalera('observatorio', 'telescopio', true), baja = G.tramoEscalera('observatorio', null, false);
  ok(sube.length >= 5 && sube.every((q) => q.sinChoque) && sube[sube.length - 1].alto === A.ESCALERAS_ALDEA.observatorio.alto && sube.some((q) => q.alto === A.ESCALERAS_ALDEA.observatorio.piso), 'sube por el pie, el primer escalón y el último, con su altura');
  ok(baja[0].alto === A.ESCALERAS_ALDEA.observatorio.alto && baja[baja.length - 1].alto === undefined, 'y baja al revés, hasta el rodeo');
  ok(A.rutinaAldea('astronoma', 22, 1, { ...A.aldeaNueva(), pobladores: [{ clave: 'astronoma', dia: 1 }], locales: { observatorio: 1 } }).punto === 'telescopio', 'Valentina, de noche, en el telescopio');
  // 3.7.0 (retoques): el gesto de cada una en lo suyo, y Martina a la tardecita con el bote del varadero
  ok(G.poseDe({ lugar: 'local', edificio: 'observatorio', punto: 'telescopio' }) === 'telescopio' && G.poseDe({ lugar: 'local', edificio: 'taller-arte', punto: 'adentro' }) === 'pintar'
    && G.poseDe({ lugar: 'trabajo', edificio: 'veterinaria', punto: 'corral' }) === 'curar' && G.poseDe({ lugar: 'local', edificio: 'herboristeria', punto: 'adentro' }) === 'mortero'
    && G.poseDe({ lugar: 'local', edificio: 'ceramica', punto: 'adentro', sentado: true }) === 'tornear' && G.poseDe({ lugar: 'local', edificio: 'costureria', punto: 'adentro', sentado: true }) === 'coser'
    && G.poseDe({ lugar: 'trabajo', edificio: 'varadero', punto: 'adentro' }) === 'calafatear' && G.poseDe({ lugar: 'trabajo', edificio: 'taller-arte', punto: 'trabajo' }) === null, 'los gestos de las nuevas en lo suyo');
  ok(G.poseDe({ lugar: 'trabajo', edificio: 'herreria', punto: 'cliente' }) === null && G.poseDe({ lugar: 'local', edificio: 'herreria', punto: 'adentro' }) === 'martillar', 'Pocha, con el mate en la herrería, no martilla');
  ok(['tornear', 'coser', 'telescopio', 'pintar', 'curar', 'mortero', 'calafatear'].every((p) => leer('src/gente.js').includes(`'${p}':`)), 'gente.js: sus poses');
  ok(A.rutinaAldea('botera', 17.5 + A.desfaseDe('botera'), 1, { ...A.aldeaNueva(), pobladores: [{ clave: 'botera', dia: 1 }], locales: { varadero: 1 } }).punto === 'adentro', 'Martina, a la tardecita, con el bote');
  ok(leer('src/gente.js').includes('if (Number.isFinite(destino.y)) g.pos.y += (destino.y - g.pos.y) * Math.min(1, paso / d);'), 'gente.js: en la escalera, por la rampa de los escalones');
  // el corral, por la tranquera
  const pc = local('veterinaria', A.puntosDe('veterinaria').corral);
  ok(Math.abs(pc.x - EA.veterinaria.anexo.x) < 0.01, 'el lugar del corral, frente a la tranquera');
}

// ============================================================ 4. las mecánicas
{
  for (const t of ['telescopio', 'cartas-cielo', 'mapa-cumbres', 'espejo']) {
    const def = MC.MECANICAS[t];
    ok(MC.ORDEN_MECANICAS.includes(t) && def && typeof MC.AVISOS_MECANICAS[t] === 'string', `${t}: en el orden de E y del aviso, con su aviso`);
    const e = AA.armarEdificio(def.edificio, 4, AM.OPCIONES_MUNDO[def.edificio] || {});
    ok(!!e.puntos.nombrados[def.punto], `${t}: el punto ${def.punto} está en ${def.edificio}`);
  }
  ok(!MC.lugarTapaVecino('telescopio') && MC.MECANICAS_EN_LA_CHARLA.includes('telescopio'), 'el telescopio no tapa a Valentina: va en el menú de su charla');
  ok(MC.cieloDelTelescopio({ noche: false })[0].includes('tapado') && MC.cieloDelTelescopio({ noche: true, abierta: 0 })[0].includes('cerrada') && MC.cieloDelTelescopio({ noche: true, abierta: 1, dia: 2 }).length === 2, 'el telescopio: de día tapado, de noche con la cúpula abierta');
  for (const k of ['ceramica', 'costureria', 'observatorio']) ok(MC.GESTOS_OFICIO[k], `${k}: su gesto mientras trabaja`);
  ok(MC.GESTOS_OFICIO.ceramica.piezas.includes('torno') && MC.GESTOS_OFICIO.costureria.piezas.includes('pedal') && MC.GESTOS_OFICIO.observatorio.piezas.join() === 'cupula,telescopio', 'el torno, el pedal, la cúpula y el telescopio');
  const llena = { ...A.aldeaNueva(), pobladores: [{ clave: 'astronoma', dia: 1 }, { clave: 'ceramista', dia: 1 }], locales: { observatorio: 1, ceramica: 1 } };
  ok(MC.trabajando(llena, 'observatorio', 2, 22) && !MC.trabajando(llena, 'observatorio', 2, 11), 'la cúpula se abre de noche, cuando trabaja Valentina');
  ok(MC.trabajando(llena, 'ceramica', 2, 10.5), 'el torno gira de mañana');
  for (const id of LOMA) ok(MC.nombreAsiento('una silla', id) !== 'una silla', `${id}: sus asientos dicen dónde`);
  const mec = leer('src/aldea-mecanicas-mundo.js');
  ok(mec.includes('anim.cupula = preparar(') && mec.includes('anim.torno = preparar(') && mec.includes('anim.pedal = preparar(') && mec.includes("lugar.hornoCeramica = e;"), 'aldea-mecanicas-mundo.js: anima la cúpula, el telescopio, el torno y el pedal, y el humo del horno');
  ok(mec.includes('fueraAldea(p.x, p.z) < 10') && !mec.includes('Math.hypot(p.x - centro.x, p.z - centro.z) < 160'), 'lo de la loma se puede usar (el observatorio está a 160 m del centro)');
}

// ============================================================ 5. en el valle: todo montado
{
  const T = Te.generarTerreno();
  const escena = new THREE.Scene(), col = C.crearColisiones(), puertas = P.crearPuertas(T, escena, col, null);
  const veg = { arboles: [], matas: [], colisiones: [], despejar: () => 0, arbolesCerca: () => [] };
  const progreso = { aldea: { ...A.aldeaNueva(), pobladores: A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 })), locales: Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1])) } };
  const am = AM.crearAldeaMundo({ T, escena, veg, progreso: () => progreso, brilloVentana: () => {} });
  const op = { aldea: am.sitiosValle(), sorteo: am.emparejar() };
  const est = E.crearEstructuras(T, escena, col, veg, puertas, op);
  am.despejar(); am.montar({ est, col, puertas }); am.arrancar();
  await am.listo(); am.montarCola();
  const med = am.medir();
  ok(med.montados === med.edificios && med.edificios >= 27, `todos montados (${med.montados} de ${med.edificios})`);
  for (const id of LOMA) {
    const s = am.estadoEdificio(id);
    ok(s && s.montada && s.techo && s.puertas.length >= (id === 'varadero' ? 0 : 1), `${id}: montado, con techo y su puerta`);
  }
  const des = am.estadoEdificio('observatorio');
  ok(!!des, 'el observatorio');
  // las piezas que se mueven adentro cuelgan del interior sin repetir el sitio (antes volaban al doble de lejos)
  const anim = am.animables();
  for (const id of ['torno', 'pedal', 'telescopio', 'cupula']) ok(anim.some((a) => a.id === id), `${id}: montado`);
  for (const a of anim.filter((x) => x.dato.capa === 'interior')) ok(a.contenedor.position.lengthSq() === 0 && a.contenedor.parent && a.sitio, `${a.id} (${a.edificio}): adentro, en el sitio del interior`);
  // adentro de un edificio de la loma (a 160 m del centro): bajo techo
  const po = m.aMundo(EA.observatorio.x, EA.observatorio.z);
  ok(am.adentro({ x: po.x, y: EA.observatorio.y + 0.4, z: po.z })?.id === 'observatorio', 'adentro del observatorio, bajo techo');
  ok(am.pisos().length > 40 && am.cubiertas().length > 25, 'los pisos y los techos de todos');
  ok(am.medir().luces > 30, `las luces (${am.medir().luces})`);
}

// ============================================================ 6. sin tirones: la gente de a poco, los animales, la ropa
{
  const cuerpo = leer('src/gente-cuerpo.js'), gente = leer('src/gente.js'), ag = leer('src/aldea-gente.js'), main = leer('src/main.js'), ani = leer('src/aldea-animales-mundo.js');
  ok(/export function armarPersonaDeAPoco\(/.test(cuerpo) && /function\* figuraPasos\(/.test(cuerpo) && /function\* continuoPasos\(/.test(cuerpo) && !/^export\s+function\*/m.test(cuerpo), 'gente-cuerpo.js: de a partes (sin export function*)');
  const uno = GC.crearPersona({}, 'poblador-astronoma', false, {}, {});
  const tarea = GC.armarPersonaDeAPoco({}, 'poblador-astronoma', false, {}, {});
  let vueltas = 0;
  while (!tarea.avanzar(0) && vueltas < 500) vueltas++;
  const cuenta = (r) => { let n = 0; r.g.traverse((o) => { if (o.isMesh) n += o.geometry.attributes.position.count; }); return n; };
  ok(tarea.hecho && vueltas > 15 && cuenta(tarea.resultado) === cuenta(uno), `de a poco sale igual que de una (${vueltas + 1} pasos, ${cuenta(uno)} vértices)`);
  ok(gente.includes('function armarPobladorDeAPoco(def)') && gente.includes("vistiendo = { npc: elegido, inv: invierno, tarea: mallaDeAPoco("), 'gente.js: los pobladores y la ropa de abrigo, de a poco');
  ok(gente.includes('const detras = !!camara && d > 2.5'), 'gente.js: la ropa de abrigo se pone también a tu espalda');
  ok(ag.includes('function prearmar(ms = 10)') && ag.includes('avanzarArmado(ctx.msFigura?.() ?? MS_FIGURA, dt)'), 'aldea-gente.js: de a poco cada cuadro y en la portada');
  ok(main.includes('prearmarAldea();   // 3.7.0 (integración)') && main.includes("msFigura: () => (planificadorAntitirones.permitir('aldea-gente') ? 3 : 0)"), 'main.js: el prearmado en la portada y el permiso del planificador');
  ok(ani.includes('col.resolver(_pos, radio, 0.55)') && ani.includes("a.trabado > 1.5") && main.includes('col: () => col, alturaDePie: (x, z, y) => alturaDePie(T, col, x, z, y) });'), 'los animales chocan, pisan los pisos y no se traban');
}

// ============================================================ 7. reglas del código
for (const f of ['src/aldea-mundo.js', 'src/aldea.js', 'src/aldea-gente.js', 'src/aldea-mecanicas.js', 'src/aldea-mecanicas-mundo.js', 'src/gente-cuerpo.js', 'src/gente.js', 'src/aldea-animales-mundo.js', 'src/aldea-vida.js']) {
  const t = leer(f);
  ok(!t.includes('\r') && t.includes('3.7.0 (integración)'), `${f}: LF y comentarios con la versión`);
  for (const mm of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE from 'three'|\{ [\w, ]+ \} from '\.\/[\w-]+\.js');$/.test(mm[0]), `${f}: import en una línea`);
}
ok(leer('package.json').includes('node pruebas/verificar-3-7-0-integracion.mjs'), 'la prueba está en el gate');

if (fallas.length) { console.error(`verificar-3-7-0-integracion: ${fallas.length} de ${pasos} fallaron`); process.exit(1); }
console.log(`OK 3.7.0 integración · ${pasos} comprobaciones · la calle de la Loma en el mundo, la gente por las puertas y la escalera, las mecánicas nuevas y sin tirones`);
