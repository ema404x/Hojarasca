// 3.6 "La Aldea de los Duendes": el núcleo (src/aldea.js), sin Electron.
//  · el lugar: la parada del sur sale del terreno igual que en trochita.js;
//  · el plano: sin superposiciones, lejos del riel, fuera del agua, dentro del valle, con
//    las plantas casi parejas (≤ 1,5 m) en el terreno real, cada puerta a su calle y los
//    puntos de cada edificio donde tienen que estar;
//  · la gente: vecinos y once pobladores (los cinco de la 3.1, tal cual);
//  · la llegada (alcanzable para los once), las obras (aportes parciales, etapas, días),
//    los servicios, los horarios, las charlas;
//  · el guardado: saneo con basura, la migración de un pueblo de la 3.1 y el progreso nuevo
//    sin `pueblo`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as A from '../src/aldea.js';
import * as P from '../src/pueblo.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { CARTAS } from '../src/correo.js';
import { MELODIAS } from '../src/personal-musica.js';
import { generarTerreno } from '../src/terreno.js';
import { LIMITE } from '../src/config.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const E = A.EDIFICIOS_ALDEA;

// ============================================================ 0. el módulo
{
  for (const k of Object.keys(A)) ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  const t = leer('src/aldea.js');
  ok(!/from 'three'|document\.|window\./.test(t), 'aldea.js es puro');
  ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !/^import\s+'/m.test(t), 'lo que entiende armar.mjs');
  for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `import en una línea: ${m[0]}`);
  ok(!t.includes('\r'), 'fines de línea LF');
  eq(A.NOMBRE_ALDEA, 'Aldea de los Duendes');
  ok(leer('package.json').includes('node pruebas/verificar-3-6-aldea.mjs'), 'la prueba está en el gate');
}

// ============================================================ 1. el lugar
const T = generarTerreno();
{
  // la misma elección de trochita.js (`crearTrochita`): cuatro paradas repartidas por el anillo
  const tro = leer('src/trochita.js');
  for (const linea of ['const pt = desnivel * 12 + cerca * 0.25 + d * 0.02;', 'const rot = ang + Math.PI / 2;   // local X corre paralelo a la vía; local Z se aleja de ella',
    'const a = riel[indiceEstacion - 4], b = riel[indiceEstacion + 4];', 'x: p.x, z: p.z, y, ang: rot, nombre, chica, vidrio, luz,']) ok(tro.includes(linea), `trochita.js sigue eligiendo igual: ${linea}`);
  const riel = T.riel, total = riel.largo;
  const sobrePuente = (i) => riel[i].sobrePuente || (riel[i].cercaPuente || 0) > 0.55;
  const sitios = [];
  for (let k = 0; k < 4; k++) {
    const objetivo = (k / 4) * total;
    let mejor = -1, puntaje = Infinity;
    for (let i = 0; i < riel.length; i++) {
      const p = riel[i];
      let d = Math.abs(p.s - objetivo); d = Math.min(d, total - d);
      if (d > total * 0.1 || sobrePuente(i)) continue;
      if (sitios.some((q) => Math.abs(q.i - i) < 40)) continue;
      let desnivel = 0;
      for (let j = -16; j <= 16; j++) desnivel = Math.max(desnivel, Math.abs(riel[(i + j + riel.length) % riel.length].h - p.h));
      const cerca = Math.min(90, T.distSendero[T.indice(p.x, p.z)]);
      const pt = desnivel * 12 + cerca * 0.25 + d * 0.02;
      if (pt < puntaje) { puntaje = pt; mejor = i; }
    }
    if (mejor >= 0) sitios.push({ i: mejor });
  }
  const sur = sitios.find((s) => s.i === A.PARADA_ALDEA.indice);
  ok(!!sur, 'la parada de la aldea es una de las cuatro');
  const p = riel[sur.i], a = riel[sur.i - 4], b = riel[sur.i + 4];
  const ang = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2;
  ok(Math.abs(p.x - A.PARADA_ALDEA.x) < 1e-6 && Math.abs(p.z - A.PARADA_ALDEA.z) < 1e-6 && Math.abs(p.h - A.PARADA_ALDEA.y) < 1e-6 && Math.abs(ang - A.PARADA_ALDEA.ang) < 1e-9, 'las coordenadas de la parada salen del terreno');
  ok(Math.abs(p.x - 40.3) < 0.1 && Math.abs(p.z + 339.1) < 0.1, 'la del sur, cerca de (40.3, −339.1)');
  const ref = T.lugares.refugio;
  ok(Math.abs(Math.hypot(p.x - ref.x, p.z - ref.z) - 593) < 2, 'a unos 593 m del refugio');
  // el marco: ida y vuelta, y el giro
  const m = A.marcoAldea();
  for (const [lx, lz] of [[0, 0], [10, 20], [-35, 60], [83, 33]]) {
    const w = m.aMundo(lx, lz), l = m.aLocal(w.x, w.z);
    ok(Math.abs(l.lx - lx) < 1e-9 && Math.abs(l.lz - lz) < 1e-9, `el marco va y vuelve (${lx}, ${lz})`);
  }
  // el mismo que el grupo de la parada: X local a lo largo de la vía, Z alejándose
  const w1 = m.aMundo(1, 0);
  const vx = b.x - a.x, vz = b.z - a.z, lv = Math.hypot(vx, vz);
  ok(Math.abs(Math.abs(((w1.x - p.x) * vx + (w1.z - p.z) * vz) / lv) - 1) < 1e-6, 'X local corre a lo largo de la vía');
  ok(Math.abs(m.rotMundo(0.3) - (A.PARADA_ALDEA.ang + 0.3)) < 1e-12, 'los giros se suman');
  ok(A.marcoAldea({ x: 'x' }).x === A.PARADA_ALDEA.x, 'una parada rota usa la de la aldea');
}

// ============================================================ 2. el plano
const marco = A.marcoAldea();
const segRiel = T.riel.filter((q) => Math.hypot(q.x - A.PARADA_ALDEA.x, q.z - A.PARADA_ALDEA.z) < 320);
function distRiel(x, z) {
  let d = Infinity;
  for (let i = 0; i < segRiel.length - 1; i++) {
    const a = segRiel[i], b = segRiel[i + 1];
    const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / l2));
    d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t));
  }
  return d;
}
{
  // el contrato con aldea-arquitectura.js: ids y tamaños
  const CONTRATO = {
    'estacion-aldea': null, plaza: [18, 14], biblioteca: [7, 11], almacen: [9.6, 9.8], 'casa-te': [8, 10.6], escuela: [10, 7], 'casa-jefe': [6, 6], 'casa-ercilia': [5, 5], 'casa-nelida': [6, 5], 'casa-abuela': [5, 5], 'casa-familia': [7, 6],
    panaderia: [7, 6], herreria: [7, 7], carpinteria: [8, 6], pescaderia: [6, 5], 'puesto-sanitario': [6, 6], estafeta: [5, 5], hilanderia: [7, 6], 'sala-miel': [6, 5], seccional: [6, 6], salon: [10, 8],
  };
  eq([...A.IDS_EDIFICIOS].sort(), Object.keys(CONTRATO).sort(), 'los ids del contrato');
  for (const [id, t] of Object.entries(CONTRATO)) if (t) eq([E[id].ancho, E[id].fondo], t, `el tamaño de ${id}`);
  eq(A.INICIALES_ALDEA.length, 11, 'once edificios al empezar (con el almacén y la casa de té del valle)');
  eq(A.LOTES_ALDEA.length, 11, 'un lote por poblador');
  for (const id of A.IDS_EDIFICIOS) {
    const e = E[id];
    ok(typeof e.nombre === 'string' && e.nombre && Number.isFinite(e.x) && Number.isFinite(e.z) && Number.isFinite(e.y) && Number.isFinite(e.rot), `${id}: datos completos`);
    ok(Math.abs(Math.sin(e.rot * 2)) < 1e-9, `${id}: giros de a 90°`);
  }
  // sin superposiciones: 3 m o más entre plantas (la estación, con su huella)
  const ids = A.IDS_EDIFICIOS;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = A.plantaDe(ids[i]), b = A.plantaDe(ids[j]);
    const d = Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));
    ok(d >= 3 - 1e-9, `${ids[i]} y ${ids[j]} a ${d.toFixed(1)} m`);
  }
  // cada planta: lejos del riel, fuera del agua, dentro del valle, fuera de las calles y casi pareja
  for (const id of ids) {
    const e = E[id];
    let min = Infinity, max = -Infinity, suma = 0, k = 0, riel = Infinity, calle = Infinity, agua = false, fuera = false;
    for (const q of A.muestrasPlanta(id)) {
      const w = marco.aMundo(q.lx, q.lz);
      const h = T.altura(w.x, w.z);
      min = Math.min(min, h); max = Math.max(max, h); suma += h; k++;
      riel = Math.min(riel, distRiel(w.x, w.z));
      if (T.agua(w.x, w.z)) agua = true;
      if (Math.abs(w.x) > LIMITE - 4 || Math.abs(w.z) > LIMITE - 4) fuera = true;
      for (const c of A.CALLES_ALDEA) calle = Math.min(calle, A.distanciaACalle(q.lx, q.lz, c));
    }
    ok(!agua, `${id}: fuera del agua`);
    ok(!fuera, `${id}: dentro del valle`);
    if (e.fija) continue;
    ok(riel >= 22, `${id}: a ${riel.toFixed(1)} m del eje de la vía (≥ 22)`);
    ok(max - min <= 1.5, `${id}: desnivel de ${(max - min).toFixed(2)} m (≤ 1,5)`);
    ok(Math.abs(suma / k - e.y) < 0.05, `${id}: la altura del piso es la media del terreno (${(suma / k).toFixed(2)} y ${e.y})`);
    ok(calle >= 1, `${id}: con vereda (${calle.toFixed(1)} m a la calle)`);
    // la puerta da a su calle
    const c = A.CALLES_ALDEA.find((x) => x.id === e.calle);
    const f = { x: e.x + (e.fondo / 2) * Math.sin(e.rot), z: e.z + (e.fondo / 2) * Math.cos(e.rot) };
    const df = A.distanciaACalle(f.x, f.z, c);
    ok(!!c && df >= 1 && df <= 5, `${id}: la puerta mira a ${e.calle} (${df.toFixed(1)} m)`);
  }
  // las calles: dentro del valle, sin agua, y ninguna pisa la vía
  for (const c of A.CALLES_ALDEA) {
    ok(c.ancho >= 4 && c.puntos.length >= 2 && typeof c.nombre === 'string', `${c.id}: bien formada`);
    for (let i = 0; i < c.puntos.length - 1; i++) for (let s = 0; s <= 1; s += 0.05) {
      const lx = c.puntos[i][0] + (c.puntos[i + 1][0] - c.puntos[i][0]) * s, lz = c.puntos[i][1] + (c.puntos[i + 1][1] - c.puntos[i][1]) * s;
      const w = marco.aMundo(lx, lz);
      assert.ok(!T.agua(w.x, w.z) && Math.abs(w.x) < LIMITE && Math.abs(w.z) < LIMITE && distRiel(w.x, w.z) > c.ancho / 2 + 2, `${c.id} en (${lx}, ${lz})`);
    }
    n++;
  }
  // las zonas para el mundo
  const zonas = A.zonasAldea();
  const deEdificios = zonas.filter((z) => z.emparejar);
  eq(deEdificios.length, ids.length - 1, 'una zona por edificio (menos la estación, que arma trochita.js)');
  ok(zonas.every((z) => z.despejar && z.tipo === 'rect' && Number.isFinite(z.x) && Number.isFinite(z.z) && Number.isFinite(z.rot) && z.ancho > 0 && z.fondo > 0), 'zonas bien formadas');
  ok(zonas.filter((z) => !z.emparejar).every((z) => z.altura === null), 'las calles se despejan pero siguen el terreno');
  const conTerreno = A.zonasAldea(A.PARADA_ALDEA, (x, z) => T.altura(x, z));
  for (const z of conTerreno.filter((x) => x.emparejar)) ok(Math.abs(z.altura - E[z.id].y) < 0.05, `${z.id}: altura objetivo con el terreno`);
  const pz = conTerreno.find((z) => z.id === 'plaza'), wp = marco.aMundo(E.plaza.x, E.plaza.z);
  ok(Math.abs(pz.x - wp.x) < 1e-9 && Math.abs(pz.rot - marco.rotMundo(E.plaza.rot)) < 1e-9, 'las zonas, en el mundo');
  ok(A.edificioEnMundo('biblioteca').rot === marco.rotMundo(Math.PI / 2) && A.edificioEnMundo('nada') === null, 'cada edificio en el mundo');
}

// ============================================================ 3. los puntos
{
  const CERRADOS = /^(adentro|cama|cama-chicos|lectura-\d+|cuentos|pupitre-\d+|lugar-\d+|cliente(-\d+)?|escenario|deposito)$/;
  for (const id of A.IDS_EDIFICIOS) {
    const e = E[id], pts = A.puntosDe(id);
    const pl = A.plantaDe(id);
    if (e.rol === 'estacion') {
      for (const k of ['anden', 'espera', 'puerta', 'trabajo']) ok(pts[k].x >= -8 && pts[k].x <= 8 && pts[k].z > 1.15 && pts[k].z < 4.75, `estación: ${k} en el andén`);
      for (const k of ['adentro', 'cama']) ok(Math.abs(pts[k].x) < 2.1 && pts[k].z > 4.5 && pts[k].z < 7.5, `estación: ${k} en el galpón`);
      continue;
    }
    if (e.rol === 'plaza') {
      const estar = Object.keys(pts).filter((k) => k.startsWith('estar-'));
      ok(estar.length >= 8, `la plaza tiene ${estar.length} lugares para estar`);
      for (const [k, q] of Object.entries(pts)) ok(A.dentroDePlanta(id, q.x, q.z, 0.2), `plaza: ${k} adentro`);
      continue;
    }
    if (e.estructura) {
      // 3.6: el almacén y la casa de té: todo dentro de su planta real; lo de adentro, dentro del cuerpo
      const s = e.estructura, c = Math.cos(e.rot), sn = Math.sin(e.rot);
      const enCuerpo = (q, m) => { const dx = q.x - e.x, dz = q.z - e.z; const bx = dx * c - dz * sn, bz = dx * sn + dz * c - s.dz; return Math.abs(bx) <= s.ancho / 2 - m && Math.abs(bz) <= s.fondo / 2 - m; };
      for (const [k, q] of Object.entries(pts)) {
        ok(A.dentroDePlanta(id, q.x, q.z, 0.2), `${id}.${k} dentro de la planta`);
        if (/^(adentro|mostrador|cliente-\d+|reponer|deposito|cocina|cama)$/.test(k) && !(id === 'casa-te' && /^(adentro|mostrador)$/.test(k))) ok(enCuerpo(q, 0.3), `${id}.${k} adentro del local`);
        else ok(!enCuerpo(q, -0.2), `${id}.${k} afuera del cuerpo`);
      }
      continue;
    }
    for (const k of ['puerta', 'adentro', 'trabajo']) ok(!!pts[k], `${id}: tiene ${k}`);
    if (e.rol !== 'biblioteca') ok(!!pts.cama || e.rol === 'almacen', `${id}: tiene cama`);
    for (const [k, q] of Object.entries(pts)) {
      ok(Number.isFinite(q.x) && Number.isFinite(q.z) && Number.isFinite(q.rot), `${id}.${k}: números`);
      if (CERRADOS.test(k)) ok(A.dentroDePlanta(id, q.x, q.z, 0.3), `${id}.${k} adentro`);
      else {
        ok(!A.dentroDePlanta(id, q.x, q.z, -0.3), `${id}.${k} afuera`);
        const d = Math.hypot(Math.max(0, pl.x0 - q.x, q.x - pl.x1), Math.max(0, pl.z0 - q.z, q.z - pl.z1));
        ok(d <= 3, `${id}.${k} pegado al edificio (${d.toFixed(1)} m)`);
        for (const otro of A.IDS_EDIFICIOS) if (otro !== id && !E[otro].fija) ok(!A.dentroDePlanta(otro, q.x, q.z), `${id}.${k} no cae en ${otro}`);
        if (k !== 'puerta') for (const c of A.CALLES_ALDEA) ok(A.distanciaACalle(q.x, q.z, c) > 0, `${id}.${k} no está en ${c.id}`);
      }
    }
    // la puerta, frente a la cara +Z
    const fx = e.x + (e.fondo / 2 + 0.9) * Math.sin(e.rot), fz = e.z + (e.fondo / 2 + 0.9) * Math.cos(e.rot);
    ok(Math.hypot(pts.puerta.x - fx, pts.puerta.z - fz) < 1e-9, `${id}: la puerta en su cara +Z`);
    if (A.esLote(id)) ok(['obra-1', 'obra-2', 'obra-3', 'obra-4'].every((k) => pts[k]), `${id}: lugares para la obra`);
  }
  ok(Object.keys(A.puntosDe('biblioteca')).filter((k) => k.startsWith('lectura-')).length >= 12, 'la biblioteca con mesas de lectura');
  // 3.6: el almacén y la casa de té, armados con el código de estructuras.js en el sitio dado:
  // sus puntos caen donde ese código pone el mostrador, la puerta y las sillas
  {
    const est = leer('src/estructuras.js'), mainJs = leer('src/main.js');
    for (const linea of ['const W = 7.5, D = 5.5, H = 2.9;', 'const rot = Math.atan2(p.x - sitio.x, p.z - sitio.z) + Math.PI;', "caja(c, [0, 0.42, -D / 2 - 1.3], [W + 0.6, 0.16, 2.2], TABLA);",
      'const zPasosAlmacen = [-D / 2 - 2.78, -D / 2 - 2.38];', 'const mostrador = w(0, 0.3); // centro real del mostrador dibujado', 'const detras = w(0, 1.3);', 'const puerta = w(0, -D / 2 - 3);', 'const cc = w(-4.6, -D / 2 - 3.4);',
      'const W = 6.4, D = 5.2, H = 2.7;', 'const rot = Math.atan2(p.x - sitio.x, p.z - sitio.z);', 'const mostrador = w(0, D / 2 + 1.5);', 'const puertaTe = w(0, D / 2 + 3.1);', 'const lzAccesoTe = D / 2 + 3.0;',
      'const cc = w(-3.4, D / 2 + 4.4);', 'const CHIM_TE = { x: -W / 2 - 0.3, z: -1.2 };', "caja(t2, [0, 0, 0], [W + 1.2, 0.12, 3.0], '#5a4a3e', 0, 4);"]) ok(est.includes(linea), `estructuras.js sigue armando igual: ${linea}`);
    ok(mainJs.includes('if (d >= 3.2) return false;') && mainJs.includes('return Math.hypot(js.pos.x - c.mostrador.x, js.pos.z - c.mostrador.z) < 4.5;'), 'el mostrador y la galería, como los mide main.js');
    const enSitio = (s, lx, lz) => ({ x: s.x + lx * Math.cos(s.rot) + lz * Math.sin(s.rot), z: s.z - lx * Math.sin(s.rot) + lz * Math.cos(s.rot) });
    const cerca = (a, b, m) => Math.hypot(a.x - b.x, a.z - b.z) < 1e-6 || ok(false, m);
    const sa = A.sitioEstructura('almacen'), pa = A.puntosMundo('almacen');
    ok(sa.id === 'almacen' && sa.ancho === 7.5 && sa.fondo === 5.5, 'el almacén de estructuras.js');
    cerca(enSitio(sa, 0, 0.3), pa.mostrador, 'el mostrador del almacén'); n++;
    cerca(enSitio(sa, 0, 1.3), pa.adentro, 'Ercilia detrás del mostrador'); n++;
    cerca(enSitio(sa, 0, -5.5 / 2 - 3), pa.puerta, 'la puerta del almacén'); n++;
    for (const k of ['cliente-1', 'cliente-2', 'cliente-3']) ok(Math.hypot(pa[k].x - pa.mostrador.x, pa[k].z - pa.mostrador.z) < 3.2, `${k}: al alcance del mostrador`);
    const st = A.sitioEstructura('casa-te'), pt = A.puntosMundo('casa-te');
    ok(st.id === 'casa-te' && st.ancho === 6.4 && st.fondo === 5.2, 'la casa de té de estructuras.js');
    cerca(enSitio(st, 0, 5.2 / 2 + 1.5), pt.mostrador, 'el mostrador de la galería'); n++;
    cerca(enSitio(st, 0, 5.2 / 2 + 3.1), pt.puerta, 'la puerta de la casa de té'); n++;
    cerca(enSitio(st, -1.9 - 0.51, 5.2 / 2 + 1.4), pt['mesa-1'], 'la silla de la mesa de la izquierda (un sentadero)'); n++;
    cerca(enSitio(st, 1.9 + 0.51, 5.2 / 2 + 1.4), pt['mesa-4'], 'la de la derecha'); n++;
    ok(Math.hypot(pt.adentro.x - pt.mostrador.x, pt.adentro.z - pt.mostrador.z) < 4.5, 'la galesa sirve donde main.js atiende');
    // lo que arma cada código cabe en su planta: cartel, escalones, vereda, alero, galería y chimenea
    for (const [id, s, lista] of [['almacen', sa, [[-4.6, -6.15], [0, -5.805], [4.35, -5.35], [-4.35, 3.33], [4.27, 0]]], ['casa-te', st, [[-3.4, 7.0], [0, 5.92], [3.8, 5.6], [-3.91, -1.2], [3.75, -3.28]]]]) {
      for (const [lx, lz] of lista) { const q = marco.aLocal(enSitio(s, lx, lz).x, enSitio(s, lx, lz).z); ok(A.dentroDePlanta(id, q.lx, q.lz, -1e-6), `${id}: (${lx}, ${lz}) adentro de la planta`); }
    }
    ok(A.sitioEstructura('capilla') === null && A.sitioEstructura('biblioteca') === null, 'los demás no vienen del valle');
  }
  ok(A.puntosDe('biblioteca').cuentos && !A.puntosDe('biblioteca').campana, 'y el sillón de los cuentos');
  ok(Object.keys(A.puntosDe('escuela')).filter((k) => k.startsWith('pupitre-')).length >= 6, 'la escuela con pupitres');
  ok(Object.keys(A.puntosDe('salon')).filter((k) => k.startsWith('lugar-')).length >= 8 && A.puntosDe('salon').escenario, 'el salón con escenario y sillas');
  const pm = A.puntosMundo('biblioteca'), pl = A.puntosDe('biblioteca');
  const w = marco.aMundo(pl.adentro.x, pl.adentro.z);
  ok(Math.abs(pm.adentro.x - w.x) < 1e-9 && pm.adentro.y === E.biblioteca.y && Math.abs(pm.adentro.rot - marco.rotMundo(pl.adentro.rot)) < 1e-9, 'los puntos en el mundo');
  eq(A.puntosDe('nada'), {}, 'un edificio que no existe no tiene puntos');
  A.puntosDe('plaza').mastil.x = 999;
  ok(A.puntosDe('plaza').mastil.x !== 999, 'los puntos no se pisan desde afuera');
}

// ============================================================ 4. la gente
{
  eq(A.ORDEN_VECINOS_ALDEA.length, 8, 'jefe, Nélida, abuela, la familia con dos chicos y la galesa');
  ok(A.esVecinoAldea('ercilia') && A.esPersonaAldea('ercilia') && A.personaAldea('ercilia').casa === 'casa-ercilia' && !Object.hasOwn(A.VECINOS_ALDEA, 'ercilia'), 'Ercilia vive en la aldea, pero se define en gente.js');
  ok(A.ORDEN_PERSONAS_ALDEA.includes('ercilia') && !leer('src/aldea.js').includes('Pasá, pasá. Si traés algo'), 'sin duplicar su saludo ni sus historias');
  ok(A.VECINOS_ALDEA.nelida.oficio === 'ayudante del almacén' && A.VECINOS_ALDEA.nelida.casa === 'casa-nelida', 'Nélida, la ayudante');
  ok(A.VECINOS_ALDEA.galesa.casa === 'casa-te' && A.VECINOS_ALDEA.galesa.charla.length >= 2, 'la galesa de la casa de té');
  eq(A.ORDEN_POBLADORES_ALDEA.length, 11, 'once pobladores');
  eq(new Set(A.ORDEN_POBLADORES_ALDEA).size, 11);
  eq(A.ORDEN_POBLADORES_ALDEA.slice(0, 5), P.ORDEN_POBLADORES, 'primero los de la 3.1');
  for (const k of P.ORDEN_POBLADORES) ok(P.POBLADORES[k] === A.POBLADORES_ALDEA[k], `${k}: el mismo de la 3.1 (movido)`);
  eq(A.POBLADORES_ALDEA.carpintero.llegada[0], 'Buenas. Me llamo Tito Arrieta, soy carpintero. Vengo del valle de abajo, donde ya no queda madera que trabajar.', 'los diálogos, tal cual');
  eq(A.POBLADORES_ALDEA.maestra.resumen, 'Lee tu cuaderno, te dice qué te falta anotar y te da mandados: cuatro de yerba por cada uno cumplido.');
  const lotes = new Set();
  for (const k of A.ORDEN_POBLADORES_ALDEA) {
    const p = A.POBLADORES_ALDEA[k];
    ok(p.nombre && p.oficio && p.saludo && p.despedida && p.resumen && p.llegada.length === 2 && p.colores.ropa && p.colores.abrigo, `${k}: completo`);
    ok(A.esLote(p.lote) && A.LOTE_DE[k] === p.lote && A.pobladorDeLote(p.lote) === k, `${k}: su lote es ${p.lote}`);
    lotes.add(p.lote);
  }
  eq(lotes.size, 11, 'un lote para cada uno');
  for (const k of A.ORDEN_VECINOS_ALDEA) {
    const v = A.VECINOS_ALDEA[k];
    ok(v.nombre && v.oficio && v.saludo && v.despedida && v.charla.length >= 2 && v.charla.length <= 3 && v.colores.ropa && A.esEdificioAldea(v.casa) && A.esEdificioAldea(v.trabajo), `${k}: completo`);
  }
  ok(A.VECINOS_ALDEA.nene.chico && A.VECINOS_ALDEA.nena.chico && A.VECINOS_ALDEA.nene.casa === 'casa-familia', 'los chicos de la familia');
  // nada mágico: los duendes son leyenda y tallas
  const textos = JSON.stringify([A.VECINOS_ALDEA, A.POBLADORES_ALDEA, A.CHARLAS_ALDEA]);
  ok(!/mágic|hechiz|conjur|encantamiento/i.test(textos), 'sin magia');
  // 3.6: y nada religioso (pedido del usuario)
  ok(!/capilla|\bmisa\b|\bcura\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq/i.test(textos + JSON.stringify(A.EDIFICIOS_ALDEA) + JSON.stringify(A.CALLES_ALDEA)), 'nada religioso');
  ok(A.CHARLAS_ALDEA.filter((c) => c.tema === 'biblioteca').length >= 2, 'charlas de la biblioteca');
  ok(/leyenda|cuentos|puertitas/.test(JSON.stringify(A.VECINOS_ALDEA.abuela)), 'la abuela cuenta la leyenda');
  ok(A.esPersonaAldea('jefe') && A.esPersonaAldea('musico') && !A.esPersonaAldea('__proto__') && !A.esPersonaAldea('toString') && A.personaAldea('x') === null, 'quién es de la aldea');
}

// ============================================================ 5. la llegada (alcanzable para los once)
const IDS = ENTRADAS.map((e) => e.id);
const partida = (anotadas = 0, extra = {}) => ({ modo: 'relax', dia: 1, horas: 10, entradas: Object.fromEntries(IDS.slice(0, anotadas).map((id) => [id, { dia: 1, hora: 9, cantidad: 0 }])), materiales: {}, cosas: {}, aldea: A.aldeaNueva(), personal: {}, ...extra });
{
  const pedidasUltimo = A.LLEGADA.anotaciones + A.LLEGADA.porPoblador * 10;
  console.log(`  el cuaderno tiene ${ENTRADAS.length} entradas; el undécimo poblador pide ${pedidasUltimo}`);
  ok(pedidasUltimo <= ENTRADAS.length * 0.5, 'el undécimo pide menos de la mitad del cuaderno');
  let p = partida(0);
  let r = A.puedeLlegar(p);
  ok(!r.ok && r.faltan === A.LLEGADA.anotaciones && r.quien === 'carpintero', `sin anotar no viene nadie (${r.motivo})`);
  ok(!A.puedeLlegar({ ...p, modo: 'desafio' }).ok && !A.puedeLlegar(null).ok, 'en el Desafío ni sin partida');
  const sinVecinos = { ...p, personal: { partida: { actual: { vecinos: false } } } };
  ok(!A.puedeLlegar(sinVecinos).ok && /vecinos/.test(A.puedeLlegar(sinVecinos).motivo), 'en una partida sin vecinos, tampoco');
  // la historia lo llama: viene sin esperar anotaciones
  ok(A.llamarProximo(p.aldea) && A.puedeLlegar(p).ok, 'el llamado salta las anotaciones');
  ok(!A.llamarProximo(null), 'sin aldea no hay a quién llamar');
  // la partida entera: cada día se anotan unas cosas, llega quien puede, se aporta todo y se espera
  p = partida(A.LLEGADA.anotaciones);
  const eventos = [];
  const soltar = A.escucharAldea((ev) => eventos.push(ev.tipo));
  A.escucharAldea(() => { throw new Error('un oyente roto'); });
  A.llamarProximo(A.aldeaNueva());
  let anotadas = A.LLEGADA.anotaciones, bloqueoObra = false;
  for (let dia = 1; dia <= 200 && p.aldea.pobladores.length + Object.keys(p.aldea.locales).length < 22; dia++) {
    p.dia = dia;
    anotadas = Math.min(ENTRADAS.length, anotadas + 1);
    p.entradas = Object.fromEntries(IDS.slice(0, anotadas).map((id) => [id, { dia: 1, hora: 9, cantidad: 0 }]));
    for (const ev of A.avanzarObras(p.aldea, dia, 8)) void ev;
    const q = A.puedeLlegar(p);
    if (A.obraEnCurso(p.aldea) && !q.ok && /obra/.test(q.motivo)) bloqueoObra = true;
    if (q.ok) {
      ok(A.empezarLlegada(p.aldea, q.quien, dia), `día ${dia}: baja ${q.quien}`);
      ok(A.empezarLlegada(p.aldea, 'musico', dia) === null, 'de a uno');
      ok(/esperando/.test(A.puedeLlegar(p).motivo), 'mientras espera, no viene otro');
      const ac = A.aceptar(p.aldea, dia);
      ok(ac && ac.lote === A.LOTE_DE[q.quien], `${q.quien}: se abre la obra de ${ac.lote}`);
    }
    const lote = A.obraEnCurso(p.aldea);
    if (lote) {
      // materiales de sobra: se aporta a la tarde
      const r2 = A.aportar(p.aldea, lote, { tronco: 99, tabla: 99, piedra: 99 }, dia);
      if (!r2.completa) ok(false, 'con todo el material la etapa se completa');
    }
  }
  soltar();
  eq(p.aldea.pobladores.map((x) => x.clave), A.ORDEN_POBLADORES_ALDEA, 'llegaron los once, en orden');
  eq(Object.keys(p.aldea.locales).sort(), [...A.LOTES_ALDEA].sort(), 'y abrieron sus once locales');
  ok(bloqueoObra, 'una obra a la vez: con una obra abierta no llega el próximo');
  console.log(`  los once, en ${p.dia} días`);
  ok(p.dia <= 120, `los once llegan en ${p.dia} días (con el valle anotado de a poco)`);
  ok(['llamado', 'llego', 'aceptado', 'aporte', 'trabajando', 'etapa', 'abierto'].every((t) => eventos.includes(t)), 'los avisos (y un oyente roto no frena a la aldea)');
  ok(A.quienLlega(p.aldea) === null && /todos/.test(A.puedeLlegar(p).motivo), 'ya vinieron todos');
  ok(A.aceptar(p.aldea, 5) === null, 'sin nadie esperando no hay a quién aceptar');
}

// ============================================================ 6. las obras
{
  const a = A.aldeaNueva();
  eq(A.estadoEdificio(a, 'panaderia'), 'lote', 'el lote vacío');
  eq(A.estadoEdificio(a, 'escuela'), 'a-medio', 'la escuela, a medio hacer');
  eq(A.etapaDe(a, 'escuela').hechas, 2);
  eq(A.estadoEdificio(a, 'biblioteca'), 'abierto');
  ok(A.localAbierto(a, 'almacen') && A.localAbierto(a, 'casa-te') && !A.localAbierto(a, 'escuela') && !A.localAbierto(a, 'nada'), 'los iniciales abren desde el día 1 (menos la escuela)');
  eq(A.aportar(a, 'panaderia', { tronco: 9 }, 3), { usados: {}, faltan: {}, completa: false }, 'sin obra no se aporta');
  A.empezarLlegada(a, 'panadera', 3);
  A.aceptar(a, 3);
  eq(A.estadoEdificio(a, 'panaderia'), 'obra');
  const pide = A.pideEtapa('panaderia', 0);
  ok(pide.piedra > 0 && pide.tronco > 0, 'los cimientos piden piedra y troncos');
  for (const l of A.LOTES_ALDEA) for (let i = 0; i < 4; i++) {
    const q = A.pideEtapa(l, i);
    ok(Object.keys(q).length && Object.entries(q).every(([k, v]) => ['tronco', 'tabla', 'piedra'].includes(k) && Number.isInteger(v) && v > 0 && v <= 40), `${l}, etapa ${i + 1}: materiales del juego en cantidades razonables`);
  }
  eq(A.pideEtapa('biblioteca', 0), {}, 'la biblioteca no es un lote');
  eq(A.pideEtapa('panaderia', 9), {});
  // aporte parcial
  const media = Object.fromEntries(Object.entries(pide).map(([k, v]) => [k, Math.floor(v / 2)]));
  let r = A.aportar(a, 'panaderia', { ...media, tabla: 50, cristal: 9 }, 3);
  eq(r.usados, media, 'se toma lo que hay (y no lo que la etapa no pide)');
  eq(r.faltan, Object.fromEntries(Object.entries(pide).map(([k, v]) => [k, v - Math.floor(v / 2)])), 'y se dice lo que falta');
  ok(!r.completa && !a.obras.panaderia.lista, 'la etapa sigue esperando material');
  eq(A.etapaDe(a, 'panaderia').aportado, media);
  r = A.aportar(a, 'panaderia', { piedra: 99, tronco: 99 }, 4);
  ok(r.completa && r.usados.piedra === pide.piedra - media.piedra, 'con el resto se completa (y se usa sólo lo que falta)');
  eq(a.obras.panaderia.lista, { dia: 5, hora: 7 }, 'los vecinos trabajan: lista a las 7 del día siguiente');
  eq(A.aportar(a, 'panaderia', { piedra: 99 }, 4).usados, {}, 'con la etapa completa no se pide más');
  eq(A.avanzarObras(a, 4, 23), [], 'esa noche todavía no');
  eq(A.avanzarObras(a, 5, 6.9), [], 'a las 6:54 tampoco');
  eq(A.avanzarObras(a, 5, 7), [{ tipo: 'etapa', lote: 'panaderia', clave: 'panadera', etapa: 1 }], 'a las 7 queda hecha');
  eq(A.etapaDe(a, 'panaderia').hechas, 1);
  ok(A.etapaDe(a, 'panaderia').etapa.id === 'estructura' && !A.etapaDe(a, 'panaderia').lista, 'y sigue la estructura');
  for (let i = 1; i < 4; i++) {
    A.aportar(a, 'panaderia', { piedra: 99, tronco: 99, tabla: 99 }, 5 + i);
    const ev = A.avanzarObras(a, 6 + i, 9);
    if (i < 3) eq(ev[0].tipo, 'etapa'); else eq(ev, [{ tipo: 'abierto', lote: 'panaderia', clave: 'panadera' }], 'con la última, abre el local');
  }
  ok(A.localAbierto(a, 'panaderia') && a.locales.panaderia === 9 && !a.obras.panaderia && a.ultimaApertura === 9, 'el local abierto, el día que terminó');
  eq(A.etapaDe(a, 'panaderia').hechas, 4);
  // la escuela: la maestra sólo levanta las dos etapas que faltan
  A.empezarLlegada(a, 'maestra', 10); A.aceptar(a, 10);
  eq(A.etapaDe(a, 'escuela').hechas, 2, 'la obra de la escuela arranca con cimientos y estructura');
  ok(A.etapaDe(a, 'escuela').etapa.id === 'paredes-techo');
  A.aportar(a, 'escuela', { piedra: 99, tronco: 99, tabla: 99 }, 10); A.avanzarObras(a, 11, 7);
  A.aportar(a, 'escuela', { piedra: 99, tronco: 99, tabla: 99 }, 11); A.avanzarObras(a, 12, 7);
  ok(A.localAbierto(a, 'escuela'), 'en dos días la escuela abre');
  ok(A.etapaDe(a, 'nada') === null && A.estadoEdificio(a, 'nada') === null, 'lo que no existe');
  ok(A.avanzarObras(null, 3).length === 0, 'sin aldea no pasa nada');
}

// ============================================================ 7. los servicios
{
  const todos = () => {
    const p = partida(30, { materiales: { tronco: 9, tabla: 5, lana: 5 }, cosas: { yerba: 5, hacha: 1 }, correo: { llegadas: {}, ultimoDia: -1, fotos: {} } });
    p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
    p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
    return p;
  };
  const dia = 10;
  let q = todos();
  for (const k of A.ORDEN_POBLADORES_ALDEA) {
    const s = A.servicioDe(k, q, dia);
    ok(Array.isArray(s.partes) && s.partes.length && s.partes.every((x) => typeof x === 'string' && x), `${k}: dice algo`);
  }
  eq(A.servicioDe('nadie', q, dia), { partes: [] });
  // sin local abierto, primero la obra
  const sin = partida(0); sin.aldea.pobladores = [{ clave: 'herrero', dia: 1 }]; sin.aldea.obras = { herreria: { etapa: 1, aportado: {}, lista: null, desde: 1 } };
  ok(/Primero levantemos la herrería/.test(A.servicioDe('herrero', sin, dia).partes[0]) && !A.servicioDe('herrero', sin, dia).efectos, 'sin local, primero la obra');
  eq(A.servicioDe('panadera', sin, dia), { partes: [] }, 'el que no vino no ofrece nada');
  // los de la 3.1, como siempre
  let s = A.servicioDe('carpintero', q, dia);
  A.aplicarEfectos(q, s.efectos, dia);
  ok(q.materiales.tronco === 3 && q.materiales.tabla === 5 + 30, 'el carpintero aserra seis troncos');
  ok(!A.servicioDe('carpintero', q, dia).efectos, 'una vez por día');
  ok(A.servicioDe('carpintero', q, dia + 1).efectos, 'y al otro día de nuevo');
  s = A.servicioDe('panadera', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.cosas.yerba === 3 && q.entradas['pan-casero'].cantidad === A.SERVICIO.panes, 'la panadera');
  s = A.servicioDe('herrero', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  eq(q.aldea.afilado, A.SERVICIO.filo, 'el herrero afila');
  ok(A.golpesConFilo(3, q.aldea) === 2 && A.gastarFilo(q.aldea), 'un hachazo menos');
  for (let i = 1; i < A.SERVICIO.filo; i++) A.gastarFilo(q.aldea);
  ok(!A.gastarFilo(q.aldea) && A.golpesConFilo(3, q.aldea) === 3, 'el filo se gasta');
  const sinHacha = todos(); delete sinHacha.cosas.hacha; sinHacha.entradas.canto = { dia: 1, hora: 9, cantidad: 3 };
  s = A.servicioDe('herrero', sinHacha, dia); A.aplicarEfectos(sinHacha, s.efectos, dia);
  ok(sinHacha.cosas.hacha === 1 && sinHacha.entradas.canto.cantidad === 0, 'forja el hacha con cantos rodados');
  s = A.servicioDe('pescador', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.entradas['trucha-fresca'].cantidad === 2 && q.materiales.tronco === 1, 'el pescador');
  s = A.servicioDe('maestra', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  const m = q.aldea.mandado;
  ok(m && !Object.hasOwn(q.entradas, m.id), 'la maestra manda a buscar algo que falta');
  ok(/Todavía no anotaste/.test(A.servicioDe('maestra', q, dia).partes[0]));
  q.entradas[m.id] = { dia, hora: 12, cantidad: 0 };
  const yerba = q.cosas.yerba;
  s = A.servicioDe('maestra', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.cosas.yerba === yerba + A.SERVICIO.yerbaMandado && q.aldea.mandado === null && q.aldea.mandados === 1, 'mandado cumplido');
  // la enfermera: descansado y sin entumecido (lo aplica el mundo)
  s = A.servicioDe('enfermera', q, dia);
  const alJugador = A.aplicarEfectos(q, s.efectos, dia);
  eq(alJugador, [{ tipo: 'jugador', campo: 'descansado', valor: A.SERVICIO.descanso }, { tipo: 'jugador', campo: 'entumecido', valor: 0 }], 'la enfermera te deja descansado');
  ok(!A.servicioDe('enfermera', q, dia).efectos, 'una vez por día');
  // el telegrafista: la carta que llegó, la foto pedida o el pronóstico
  const carta = CARTAS[0];
  q.correo.llegadas[carta.id] = 3;
  s = A.servicioDe('telegrafista', q, dia);
  ok(s.efectos[0].tipo === 'carta' && s.efectos[0].k === carta.id && s.partes.length === 1 + carta.texto.length, 'entrega la carta que llegó');
  A.aplicarEfectos(q, s.efectos, dia);
  ok(Object.hasOwn(q.entradas, carta.id), 'y la carta queda en el cuaderno');
  const pedido = CARTAS.find((c) => c.foto);
  q.correo.fotos[pedido.id] = { dia: 4, enviada: false };
  s = A.servicioDe('telegrafista', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(s.efectos[0].tipo === 'foto' && q.correo.fotos[pedido.id].enviada, 'despacha la foto pedida');
  ok(/llueve el jueves/.test(A.servicioDe('telegrafista', q, dia, { pronostico: 'que llueve el jueves' }).partes[1]), 'y si no hay nada, el pronóstico');
  // la tejedora: la manta si falta, si no un poncho con menos lana
  s = A.servicioDe('tejedora', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.cosas.manta === 1 && q.materiales.lana === 5 - A.SERVICIO.lanaManta, 'la manta primero');
  s = A.servicioDe('tejedora', q, dia + 1); A.aplicarEfectos(q, s.efectos, dia + 1);
  ok(q.cosas.poncho === 1 && q.materiales.lana === 0, 'después ponchos, con dos vellones');
  ok(/Traeme 2 vellones/.test(A.servicioDe('tejedora', q, dia + 2).partes[0]), 'sin lana, pide');
  // el apicultor: tablas por miel
  const tablas = q.materiales.tabla;
  s = A.servicioDe('apicultor', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.materiales.tabla === tablas - 3 && q.entradas.miel.cantidad === 2, 'tres tablas, dos frascos de miel');
  // la guardaparque: yerba por la fauna anotada, de a cuatro por día
  const fauna = ENTRADAS.filter((e) => e.seccion === 'fauna').slice(0, 6);
  for (const e of fauna) q.entradas[e.id] = { dia: 1, hora: 9, cantidad: 0 };
  const y0 = q.cosas.yerba, ya = A.avistajesDe(q.entradas);
  ok(ya >= 6, 'los avistajes se cuentan del cuaderno');
  s = A.servicioDe('guardaparque', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  ok(q.cosas.yerba === y0 + 4 && q.aldea.fauna === 4, 'cuatro por día');
  s = A.servicioDe('guardaparque', q, dia + 1); A.aplicarEfectos(q, s.efectos, dia + 1);
  ok(q.aldea.fauna === Math.min(8, ya), 'al otro día, los que quedaban');
  for (let d = dia + 2; d < dia + 80; d++) { s = A.servicioDe('guardaparque', q, d); if (s.efectos) A.aplicarEfectos(q, s.efectos, d); }
  ok(q.aldea.fauna === ya && /buscar|Probaste|Nada nuevo/.test(A.servicioDe('guardaparque', q, dia + 90).partes.join(' ')), 'sin nada nuevo, te dice qué buscar');
  // el músico: una melodía por semana
  s = A.servicioDe('musico', q, dia); A.aplicarEfectos(q, s.efectos, dia);
  const primera = MELODIAS.find((x) => !x.inicial);
  ok(q.personal.musica.halladas.includes(primera.id) && q.aldea.partitura === dia, 'te enseña una melodía');
  ok(!A.servicioDe('musico', q, dia + 6).efectos && A.servicioDe('musico', q, dia + 7).efectos, 'una por semana');
  for (let d = dia + 7; d < dia + 100; d += 7) { s = A.servicioDe('musico', q, d); if (s.efectos) A.aplicarEfectos(q, s.efectos, d); }
  ok(q.personal.musica.halladas.length === MELODIAS.filter((x) => !x.inicial).length && /todas/.test(A.servicioDe('musico', q, dia + 200).partes[0]), 'hasta que las sabés todas');
  // nadie consume ni se va: pasan los días y siguen todos
  q = todos();
  for (let d = dia; d < dia + 60; d++) for (const k of A.ORDEN_POBLADORES_ALDEA) { const x = A.servicioDe(k, q, d); if (x.efectos) A.aplicarEfectos(q, x.efectos, d); }
  ok(q.aldea.pobladores.length === 11 && Object.keys(q.aldea.locales).length === 11, 'la aldea sólo crece');
  for (const k of Object.keys(A)) ok(!/hambre|irse|seVa|consum|necesidad|abandon/i.test(k), `sin economía de necesidades: ${k}`);
  ok(!/pobladores\.(splice|pop|shift)|pobladores = pobladores\.filter/.test(leer('src/aldea.js')), 'ningún poblador se saca de la lista');
}

// ============================================================ 8. los horarios
{
  const llena = A.aldeaNueva();
  llena.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
  llena.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  const gente = A.ORDEN_PERSONAS_ALDEA;
  const LUNES = 0, SABADO = 5, DOMINGO = 6;
  eq(A.SEMANA.length, 7); eq(A.diaSemanaDe(1), 0, 'el día 1 es lunes'); eq(A.diaSemanaDe(6), SABADO); eq(A.diaSemanaDe(7), DOMINGO); eq(A.diaSemanaDe(8), 0);
  // a cualquier hora, el lugar existe
  for (const est of [llena, A.aldeaNueva()]) for (const k of gente) for (let ds = 0; ds < 7; ds++) for (let h = 0; h < 24; h += 0.25) {
    const r = A.rutinaAldea(k, h, ds, est);
    if (r.lugar === null) { assert.ok(!est.pobladores.some((p) => p.clave === k)); continue; }
    assert.ok(Object.hasOwn(A.puntosDe(r.edificio), r.punto), `${k} a las ${h} (${ds}): ${r.edificio}.${r.punto}`);
  }
  n++;
  // de noche, en la cama
  for (const k of gente) { const r = A.rutinaAldea(k, 2, LUNES, llena); ok(r.lugar === 'casa' && /^cama/.test(r.punto), `${k}: de noche duerme`); }
  ok(A.rutinaAldea('carpintero', 2, LUNES, llena).edificio === 'carpinteria', 'el poblador vive en el cuarto de atrás de su local');
  ok(A.rutinaAldea('jefe', 2, LUNES, llena).edificio === 'casa-jefe' && A.rutinaAldea('nene', 2, LUNES, llena).punto === 'cama-chicos');
  // domingo a las 10 y media, los cuentos de la abuela en la biblioteca: van casi todos
  eq(A.rutinaAldea('abuela', 10.5, DOMINGO, llena), { lugar: 'biblioteca', edificio: 'biblioteca', punto: 'cuentos' }, 'la abuela lee en su sillón');
  const sillas = new Set(), oyen = gente.filter((k) => k !== 'abuela' && A.rutinaAldea(k, 10.5, DOMINGO, llena).lugar === 'biblioteca');
  for (const k of oyen) { const r = A.rutinaAldea(k, 10.5, DOMINGO, llena); ok(/^lectura-\d+$/.test(r.punto), `${k}: el domingo a los cuentos`); sillas.add(r.punto); }
  eq(sillas.size, oyen.length, 'nadie se sienta encima de otro');
  ok(oyen.length >= (gente.length - 1) * 0.75 && oyen.length < gente.length - 1, `van casi todos (${oyen.length} de ${gente.length - 1})`);
  ok(['nene', 'nena'].every((k) => oyen.includes(k)), 'los chicos no se lo pierden');
  ok(A.rutinaAldea('jefe', 10.5, DOMINGO, llena).lugar === 'plaza' && A.rutinaAldea('nelida', 10.5, DOMINGO, llena).edificio === 'almacen', 'el jefe en la plaza y Nélida en el almacén');
  ok(A.rutinaAldea('ercilia', 10.5, DOMINGO, llena).lugar === 'biblioteca', 'Ercilia también va a los cuentos');
  ok(A.rutinaAldea('padre', 10.5, LUNES, llena).lugar !== 'biblioteca', 'el lunes no');
  ok(A.rutinaAldea('abuela', 10, LUNES, llena).edificio === 'biblioteca', 'a la mañana la abuela atiende la biblioteca');
  // sábado a la tarde, música en la plaza (si llegó el músico)
  eq(A.rutinaAldea('musico', 18, SABADO, llena), { lugar: 'plaza', edificio: 'plaza', punto: 'musico' }, 'el músico toca en la plaza');
  for (const k of gente) ok(A.rutinaAldea(k, 18, SABADO, llena).lugar === 'plaza', `${k}: el sábado a la plaza`);
  const sinMusico = A.aldeaNueva();
  ok(gente.filter((k) => A.esVecinoAldea(k)).some((k) => A.rutinaAldea(k, 17.5, SABADO, sinMusico).lugar !== 'plaza'), 'sin músico, sábado como cualquier día');
  // los chicos: escuela si está terminada, plaza a la tarde, almuerzo en casa
  for (const k of ['nene', 'nena']) {
    ok(A.rutinaAldea(k, 10, LUNES, llena).lugar === 'escuela', `${k}: a la escuela`);
    ok(A.rutinaAldea(k, 10, LUNES, A.aldeaNueva()).lugar !== 'escuela', `${k}: sin escuela terminada, no`);
    ok(A.rutinaAldea(k, 10, SABADO, llena).lugar !== 'escuela', `${k}: el sábado no hay clases`);
    ok(A.rutinaAldea(k, 13.5, LUNES, llena).lugar === 'casa', `${k}: almuerza en casa`);
    ok(A.rutinaAldea(k, 15.5, LUNES, llena).lugar === 'plaza', `${k}: juega en la plaza`);
  }
  ok(A.rutinaAldea('maestra', 10, LUNES, llena).edificio === 'escuela', 'la maestra, en la escuela');
  ok(A.rutinaAldea('ercilia', 10, LUNES, llena).edificio === 'almacen' && A.rutinaAldea('ercilia', 10, LUNES, llena).punto === 'adentro' && A.rutinaAldea('jefe', 10, LUNES, llena).edificio === 'estacion-aldea', 'cada uno con lo suyo');
  ok(A.rutinaAldea('ercilia', 14.5, LUNES, llena).edificio === 'casa-ercilia' && A.rutinaAldea('nelida', 14.5, LUNES, llena).punto === 'adentro', 'Ercilia duerme la siesta y Nélida atiende');
  ok(A.rutinaAldea('nelida', 8.5, LUNES, llena).punto === 'vereda' || A.rutinaAldea('nelida', 8.7, LUNES, llena).punto === 'vereda', 'Nélida barre la vereda');
  ok(A.rutinaAldea('galesa', 16, LUNES, llena).edificio === 'casa-te' && A.rutinaAldea('galesa', 16, LUNES, llena).punto === 'adentro' && A.rutinaAldea('galesa', 2, LUNES, llena).edificio === 'casa-te', 'la galesa atiende el té de 15 a 20 y vive en la casa de té');
  ok(A.rutinaAldea('galesa', 11, LUNES, llena).punto !== 'adentro', 'a la mañana no hay té');
  ok(A.rutinaAldea('herrero', 15, LUNES, llena).lugar === 'trabajo' && A.rutinaAldea('herrero', 10, LUNES, llena).lugar === 'local', 'el herrero: a la mañana adentro, a la tarde en la fragua');
  ok(A.rutinaAldea('panadera', 13, LUNES, llena).lugar === 'casa', 'el almuerzo, en casa');
  // con una obra abierta, los vecinos van a la obra de día
  const conObra = A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }, { clave: 'panadera', dia: 2 }], locales: { carpinteria: 1 } });
  ok(A.obraEnCurso(conObra) === 'panaderia', 'la panadería en obra');
  for (const k of ['padre', 'carpintero', 'panadera']) { const r = A.rutinaAldea(k, 10, LUNES, conObra); ok(r.lugar === 'obra' && r.edificio === 'panaderia', `${k}: a la obra`); }
  ok(A.rutinaAldea('padre', 10, DOMINGO, conObra).lugar !== 'obra' && A.rutinaAldea('padre', 20, LUNES, conObra).lugar !== 'obra', 'ni el domingo ni de noche');
  ok(A.rutinaAldea('panadera', 2, LUNES, conObra).edificio === 'estacion-aldea', 'mientras se levanta su local, duerme en la estación');
  // el que espera y el que no vino
  const espera = A.aldeaNueva(); A.empezarLlegada(espera, 'carpintero', 1);
  eq(A.rutinaAldea('carpintero', 11, LUNES, espera), { lugar: 'estacion', edificio: 'estacion-aldea', punto: 'anden' }, 'el que llega espera en el andén');
  eq(A.rutinaAldea('herrero', 11, LUNES, espera), { lugar: null, edificio: null, punto: null }, 'el que no vino no está');
  eq(A.rutinaAldea('nadie', 11, LUNES, espera).lugar, null);
  // que no se muevan todos juntos
  const desfases = new Set(gente.map((k) => A.desfaseDe(k)));
  ok(desfases.size > gente.length / 2 && [...desfases].every((d) => Math.abs(d) <= 0.4), 'cada uno con su desfase');
  const despiertos = gente.filter((k) => A.rutinaAldea(k, 6.6, LUNES, llena).punto?.startsWith('cama'));
  ok(despiertos.length > 0 && despiertos.length < gente.length, 'a las 6:36 unos ya se levantaron y otros no');
}

// ============================================================ 9. las charlas
{
  for (const c of A.CHARLAS_ALDEA) {
    const quienes = new Set(c.lineas.map(([q]) => q));
    ok(quienes.size >= 2 && quienes.size <= 3 && [...quienes].every(A.esPersonaAldea) && c.lineas.every(([, t]) => typeof t === 'string' && t.length > 5 && t.length < 160), `${c.id}: un par o un trío con líneas cortas`);
  }
  eq(new Set(A.CHARLAS_ALDEA.map((c) => c.id)).size, A.CHARLAS_ALDEA.length, 'ids distintos');
  for (const tema of ['clima', 'obra', 'estacion', 'leyenda', 'almacen', 'te']) ok(A.CHARLAS_ALDEA.some((c) => c.tema === tema), `hay charlas de ${tema}`);
  const vacia = A.aldeaNueva();
  const c1 = A.elegirCharla({ aldea: vacia, hora: 15, clima: 'lluvia', semilla: 42 });
  eq(A.elegirCharla({ aldea: vacia, hora: 15, clima: 'lluvia', semilla: 42 }), c1, 'la misma semilla, la misma charla');
  const vistas = new Set();
  for (let s = 0; s < 400; s++) {
    const c = A.elegirCharla({ aldea: vacia, hora: 15, estacion: 'verano', clima: 'sol', semilla: s });
    vistas.add(c.id);
    assert.ok(c.lineas.every(([q]) => A.esVecinoAldea(q)), 'sin pobladores, sólo charlan los vecinos');
    assert.ok(!c.cuando?.obra && !(c.cuando?.clima && !c.cuando.clima.includes('sol')) && !(c.cuando?.estacion && !c.cuando.estacion.includes('verano')), 'y sólo de lo que corresponde');
  }
  ok(vistas.size >= 6, `variedad (${vistas.size} charlas distintas)`);
  ok(vistas.has('sol-ropa') && vistas.has('verano-frambuesas'), 'el clima y la estación salen');
  const conObra = A.sanearAldea({ pobladores: [{ clave: 'carpintero', dia: 1 }, { clave: 'panadera', dia: 2 }], locales: { carpinteria: 1 } });
  ok(A.charlasPosibles({ aldea: conObra }).some((c) => c.id === 'obra-medir'), 'con obra y carpintero, se habla de la obra');
  ok(!A.charlasPosibles({ aldea: vacia }).some((c) => c.tema === 'obra'), 'sin obra, no');
  ok(A.charlasPosibles({ aldea: vacia, hora: 20 }).some((c) => c.id === 'tren-ultimo') && !A.charlasPosibles({ aldea: vacia, hora: 9 }).some((c) => c.id === 'tren-ultimo'), 'la del último tren, a la noche');
  const solo = A.charlasPosibles({ aldea: vacia, presentes: ['abuela', 'nena', 'nene'] });
  ok(solo.length && solo.every((c) => c.lineas.every(([q]) => ['abuela', 'nena', 'nene'].includes(q))), 'sólo los que están juntos');
  eq(A.elegirCharla({ aldea: vacia, presentes: ['jefe'] }), null, 'uno solo no charla');
}

// ============================================================ 10. el saneo (con basura)
{
  const nueva = A.aldeaNueva();
  for (const [i, basura] of [null, undefined, 3, 'x', [], [1, 2], true, { pobladores: 'x' }, { obras: [] }, Object.create(null)].entries()) eq(A.sanearAldea(basura), nueva, `basura ${i}`);
  const rota = A.sanearAldea({
    pobladores: [{ clave: 'carpintero', dia: 3 }, { clave: 'carpintero', dia: 4 }, { clave: '__proto__' }, { clave: 'toString' }, null, 7, { clave: 'herrero', dia: -9 }, { clave: 'maestra', dia: 'x' }],
    locales: { carpinteria: 4, panaderia: 2, constructor: 1, biblioteca: 3 }, obras: { herreria: { etapa: 77, aportado: { piedra: 999, cristal: 3, __proto__: { x: 1 } }, lista: { dia: 'x' } } },
    llegando: { clave: 'carpintero' }, usos: { panadera: 3, toString: 9, musico: -1 }, afilado: 99, mandado: { id: 'no-existe' }, ultimaLlegada: -4, fauna: 1e9, partitura: Infinity, llamado: 'si',
  });
  eq(rota.pobladores.map((p) => p.clave), ['carpintero', 'herrero', 'maestra'], 'uno por oficio y sólo los que existen');
  ok(rota.pobladores.every((p) => p.dia >= 1), 'días válidos');
  eq(rota.locales, { carpinteria: 4 }, 'sólo el local de quien vive en la aldea');
  eq(Object.keys(rota.obras).sort(), ['escuela', 'herreria'], 'cada aceptado sin local tiene su obra');
  ok(rota.obras.herreria.etapa === 3 && rota.obras.escuela.etapa === 2, 'las etapas, acotadas (la escuela, desde la tercera)');
  eq(rota.obras.herreria.aportado, { piedra: A.pideEtapa('herreria', 3).piedra }, 'lo aportado, acotado a lo que pide la etapa');
  ok(rota.obras.herreria.lista === null, 'incompleta: sin vecinos trabajando');
  ok(rota.llegando === null && rota.afilado === A.SERVICIO.filo && rota.mandado === null && rota.ultimaLlegada === 0 && rota.llamado === false, 'lo demás saneado');
  eq(rota.usos, { panadera: 3 });
  ok(rota.fauna <= ENTRADAS.length && rota.partitura === 0, 'números acotados');
  // fuzz: cualquier cosa sale saneada, estable e idéntica tras ir y volver de JSON
  let semilla = 7;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  const claves = [...A.ORDEN_POBLADORES_ALDEA, ...A.LOTES_ALDEA, '__proto__', 'constructor', 'toString', 'x', '', 'biblioteca'];
  const valor = (prof = 0) => {
    const t = r();
    if (prof > 3 || t < 0.25) return [0, -1, 1.5, 1e308, -Infinity, NaN, 'texto', null, true, 3][Math.floor(r() * 10)];
    if (t < 0.45) return Array.from({ length: Math.floor(r() * 4) }, () => valor(prof + 1));
    const o = {};
    for (let i = 0; i < 1 + r() * 5; i++) o[claves[Math.floor(r() * claves.length)]] = valor(prof + 1);
    if (r() < 0.3) o.clave = claves[Math.floor(r() * claves.length)];
    return o;
  };
  for (let i = 0; i < 600; i++) {
    const v = { pobladores: valor(), locales: valor(), obras: valor(), llegando: valor(), usos: valor(), afilado: valor(), mandado: valor(), fauna: valor(), [claves[i % claves.length]]: valor() };
    if (i % 3 === 0) v.pobladores = Array.from({ length: 4 }, () => ({ clave: claves[Math.floor(r() * claves.length)], dia: valor() }));
    const s = A.sanearAldea(v);
    assert.equal(Object.getPrototypeOf(s), Object.prototype);
    assert.deepEqual(Object.keys(s).sort(), Object.keys(A.aldeaNueva()).sort());
    assert.ok(s.pobladores.every((p) => A.esPobladorAldea(p.clave) && Number.isInteger(p.dia) && p.dia >= 1));
    assert.equal(new Set(s.pobladores.map((p) => p.clave)).size, s.pobladores.length);
    for (const [l, d] of Object.entries(s.locales)) assert.ok(A.esLote(l) && s.pobladores.some((p) => A.LOTE_DE[p.clave] === l) && Number.isInteger(d));
    for (const [l, o] of Object.entries(s.obras)) assert.ok(A.esLote(l) && !Object.hasOwn(s.locales, l) && Number.isInteger(o.etapa) && o.etapa >= 0 && o.etapa < 4);
    for (const x of ['ultimaLlegada', 'ultimaApertura', 'afilado', 'mandados', 'fauna', 'partitura', 'descubierta']) assert.ok(Number.isInteger(s[x]) && s[x] >= 0 && s[x] <= 1e6, x);
    assert.deepEqual(A.sanearAldea(s), s, 'sanear dos veces da lo mismo');
    assert.deepEqual(A.sanearAldea(JSON.parse(JSON.stringify(s))), s, 'lo guardado vuelve igual');
    assert.ok(!JSON.stringify(s).includes('__proto__') && !JSON.stringify(s).includes('constructor'));
  }
  n += 600;
}

// ============================================================ 11. la migración y el guardado
{
  // un pueblo de la 3.1 con dos pobladores, nombre, cartel y uno esperando en la estación
  const pueblo = P.puebloNuevo();
  pueblo.pobladores.push({ clave: 'carpintero', casa: { id: 'puesto@1.0,2.0', plano: 'puesto', nombre: 'El Rincón', x: 1, z: 2, rot: 0 }, dia: 3 });
  pueblo.pobladores.push({ clave: 'panadera', casa: { id: 'casilla@9.0,9.0', plano: 'casilla', nombre: 'tu casa', x: 9, z: 9, rot: 0 }, dia: 6 });
  pueblo.nombre = 'Villa Lenga'; pueblo.cartel = { x: 4, z: 5, rot: 1 };
  pueblo.llegando = { clave: 'herrero', dia: 8 };
  pueblo.ultimaLlegada = 6; pueblo.llamado = true; pueblo.usos = { panadera: 9 }; pueblo.afilado = 7; pueblo.mandado = { id: ENTRADAS[3].id, dia: 7 }; pueblo.mandados = 2;
  const a = A.migrarDesdePueblo(JSON.parse(JSON.stringify(pueblo)), 9);
  eq(a.pobladores, [{ clave: 'carpintero', dia: 3 }, { clave: 'panadera', dia: 6 }], 'los dos pobladores pasan a la aldea');
  eq(a.locales, { carpinteria: 9, panaderia: 9 }, 'con su local terminado');
  eq(a.obras, {}, 'sin obras pendientes');
  ok(A.localAbierto(a, 'carpinteria') && A.localAbierto(a, 'panaderia'));
  eq(a.llegando, { clave: 'herrero', dia: 8 }, 'el que esperaba ahora espera en la aldea');
  ok(a.llamado && a.afilado === 7 && a.usos.panadera === 9 && a.mandado.id === ENTRADAS[3].id && a.mandados === 2, 'el filo, el llamado, lo usado hoy y el mandado siguen');
  ok(!('nombre' in a) && !('cartel' in a) && !JSON.stringify(a).includes('casa') && !JSON.stringify(a).includes('Villa Lenga'), 'sin casa, nombre ni cartel');
  eq(A.sanearAldea(a), a, 'ya saneada');
  eq(A.migrarDesdePueblo(null, 3), A.aldeaNueva(), 'un pueblo roto, aldea nueva');
  eq(A.migrarDesdePueblo({ pobladores: [{ clave: 'musico', casa: null }] }, 3).locales, { salon: 3 }, 'cualquier poblador que venga con casa, con su local');
  // la aldea sigue creciendo después de migrar
  const p = partida(60, { dia: 12, aldea: A.sanearAldea({ ...a, llegando: null, llamado: false }) });
  ok(A.puedeLlegar(p).ok && A.puedeLlegar(p).quien === 'herrero', 'después de migrar, sigue el próximo');

  // por guardado.js
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?aldea36=' + Date.now());
  const nuevo = G.progresoNuevo();
  ok(!('pueblo' in nuevo), 'el progreso nuevo no tiene `pueblo`');
  eq(nuevo.aldea, A.aldeaNueva(), 'tiene la aldea del primer día');
  const vieja = G.progresoNuevo(); delete vieja.aldea; vieja.pueblo = JSON.parse(JSON.stringify(pueblo)); vieja.dia = 9;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const cargada = G.cargarProgreso();
  ok(cargada && !('pueblo' in cargada), 'una partida de la 3.1 carga sin `pueblo`');
  eq(cargada.aldea, a, 'y con su pueblo convertido en aldea');
  ok(G.guardarProgreso(cargada));
  const vuelta = G.cargarProgreso();
  eq(vuelta.aldea, a, 'la aldea vuelve igual');
  ok(!JSON.parse(datos.get('hojarasca-v1')).pueblo, 'lo guardado ya no tiene `pueblo`');
  const ambas = G.progresoNuevo(); ambas.pueblo = JSON.parse(JSON.stringify(pueblo));
  ok(G.guardarProgreso(ambas) && G.cargarProgreso().aldea.pobladores.length === 0 && !('pueblo' in G.cargarProgreso()), 'con aldea, el pueblo viejo se descarta');
  const rota = G.progresoNuevo(); rota.aldea = 'x';
  datos.set('hojarasca-v1', JSON.stringify(rota));
  eq(G.cargarProgreso().aldea, A.aldeaNueva(), 'una aldea rota no rompe la partida');
  const g = leer('src/guardado.js');
  ok(g.includes("import { sanearAldea, aldeaNueva, migrarDesdePueblo } from './aldea.js';") && !g.includes("from './pueblo.js'"), 'guardado.js usa la aldea');
}

console.log(`OK 3.6.0 aldea · ${n} verificaciones`);
