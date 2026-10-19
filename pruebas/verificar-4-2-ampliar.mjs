// 4.2 · Ampliar el refugio y las casas (src/planos-ampliar.js), en Node:
//   1. el catálogo: las 11 ampliaciones por etapas y las 3 piezas sueltas, ids que no se repiten, categorías que existen, solo en el Relax donde corresponde;
//   2. los precios: cada ampliación entre $20.000 y $80.000 (la casona, $110.000, sigue siendo lo más caro), repartidos por etapa en múltiplos de $50, entre 1 y 4
//      veces lo que valen los materiales; las piezas sueltas en su franja;
//   3. la geometría: cada etapa arma sin números rotos (en el llano y en una pendiente), sólo madera y piedra (tipo 0 y 4), con el tope de triángulos de las casas grandes;
//   4. la ladera (4.0.1): con la entrada cuesta abajo el sitio se rechaza («girala»), cuesta arriba se funda;
//   5. la física con las colisiones reales y un caminante como el del juego: se entra por la puerta, las paredes no se atraviesan, la escalera se sube hasta el piso
//      de arriba y se vuelve a bajar, el hueco de la escalera no deja pasar por arriba de ella;
//   6. el piso de arriba cuenta como adentro (`dentro`) y la lluvia ve el techo; las casas se llevan bien con la vecindad (se arriman al costado de la casa);
//   7. el gran hogar de piedra (fuego, humo y textos), la pared de piedra y el techo de teja del sistema modular (mismo encastre que los de tablas);
//   8. `pagadas` sobrevive al guardado y el reintegro al desmontar es la mitad de lo pagado.
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';
import { mundo, terreno, rutaLocal, caminarA, M, C, THREE } from './ayuda-4-0-3-caminante.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

registrarThree();
const { PLANO, PLANOS, MATERIALES: MATS } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const { PLANOS_AMPLIAR, PIEZAS_AMPLIAR } = await import('../src/planos-ampliar.js');
const O = await import('../src/obra-pesos.js');
const { CHIMENEAS } = await import('../src/casa-viva.js');
const fs = await import('node:fs');
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const IDS_AMP = ['dormitorio-anexo', 'despensa-anexa', 'taller-anexo', 'quincho', 'galeria-cerrada', 'cocina-ampliada', 'bodega-piedra', 'buhardilla', 'salon-grande', 'planta-alta', 'torreon-piedra'];
const IDS_PIEZAS = ['hogar-grande', 'pared-piedra', 'techo-teja'];
const PRECIOS = { 'dormitorio-anexo': 20000, 'despensa-anexa': 20000, 'taller-anexo': 24000, quincho: 28000, 'galeria-cerrada': 30000, 'cocina-ampliada': 32000, 'bodega-piedra': 36000, buhardilla: 42000, 'salon-grande': 52000, 'planta-alta': 64000, 'torreon-piedra': 78000, 'hogar-grande': 20000, 'pared-piedra': 2200, 'techo-teja': 2800 };
const VALOR = { tabla: 100, piedra: 100, tronco: 150, lana: 300 };
const valorMateriales = (P) => P.etapas.reduce((s, e) => s + Object.entries(e.pide).reduce((a, [k, n]) => a + n * (VALOR[k] || 0), 0), 0);
const tri = (P, i, suelo = null) => { const c = new Constructor(); P.etapas[i].arma(c, P, {}, suelo); return c; };

// ---------------------------------------------------------------- 1. el catálogo
{
  eq(PLANOS_AMPLIAR.map((p) => p.id), IDS_AMP, 'las once ampliaciones, en este orden');
  eq(PIEZAS_AMPLIAR.map((p) => p.id), IDS_PIEZAS, 'y las tres piezas sueltas');
  const todos = PLANOS.map((p) => p.id);
  ok(new Set(todos).size === todos.length, 'ningún id se repite en todo el catálogo');
  for (const id of [...IDS_AMP, ...IDS_PIEZAS]) {
    const P = PLANO[id];
    ok(P && P.pieza === true, `${id}: está en el catálogo y es una pieza (se arrima a la casa, que una obra grande no deja)`);
    ok(['refugios', 'trabajo', 'exterior', 'mobiliario'].includes(P.categoria), `${id}: categoría que existe (${P.categoria})`);
    ok(P.nombre && P.texto && P.texto.length > 80, `${id}: nombre y texto`);
    ok(!/[a-z]{4,}ing\b|\bthe\b/i.test(P.texto), `${id}: el texto es de la casa`);
  }
  for (const id of IDS_AMP) {
    const P = PLANO[id];
    ok(P.etapas.length === 4 && P.etapas.at(-1).termina && P.habitable === true, `${id}: cuatro etapas, habitable`);
    ok(P.soloRelax === true && !P.soloDesafio, `${id}: sólo en el Relax (el Desafío no tiene economía)`);
    ok(typeof P.fisicaCasa === 'function' && P.snap === undefined, `${id}: la física sale de fisicaCasa, sin snap`);
    ok(P.etapas.every((e) => e.nombre && e.dice && e.dice.length > 25 && Object.values(e.pide).every((n) => Number.isInteger(n) && n > 0) && Object.keys(e.pide).every((k) => Object.hasOwn(MATS, k))), `${id}: cada etapa con nombre, texto y materiales que existen`);
  }
  for (const id of ['hogar-grande']) ok(PLANO[id].soloRelax === true && PLANO[id].etapas.length === 1, `${id}: una etapa, sólo en el Relax`);
  for (const id of ['pared-piedra', 'techo-teja']) ok(!PLANO[id].soloRelax && !PLANO[id].soloDesafio && PLANO[id].etapas.length === 1, `${id}: una etapa, en los dos modos (los pesos se ignoran en el Desafío)`);
  // las casas de siempre no cambiaron
  eq(['cabana-piedra', 'casa-galeria', 'casona'].map((id) => PLANO[id].etapas.length), [4, 4, 4], 'las tres casas siguen igual');
  ok(PLANOS.indexOf(PLANO.casona) < PLANOS.indexOf(PLANO['dormitorio-anexo']), 'las ampliaciones van después de la escalera de casas en el panel');
}

// ---------------------------------------------------------------- 2. los precios
{
  for (const id of [...IDS_AMP, ...IDS_PIEZAS]) {
    const P = PLANO[id], total = PRECIOS[id];
    eq(P.pesos, total, `${id}: declara ${total}`);
    const porEtapa = P.etapas.map((_, i) => O.precioDeEtapa(id, i));
    eq(porEtapa.reduce((a, b) => a + b, 0), total, `${id}: las etapas suman el total (${porEtapa.join(' + ')})`);
    ok(porEtapa.every((n) => n % 50 === 0 && n > 0), `${id}: cada etapa en múltiplos de $50`);
    ok(total % 50 === 0, `${id}: precio redondo`);
    const mat = valorMateriales(P);
    ok(total >= mat && total <= 4 * mat, `${id}: los pesos (${total}) son entre 1 y 4 veces los materiales (${mat})`);
    if (IDS_AMP.includes(id)) ok(total >= 20000 && total <= 80000 && total < 110000, `${id}: dentro de la franja de las ampliaciones ($20.000 a $80.000)`);
  }
  ok(PRECIOS['hogar-grande'] >= 4000 && PRECIOS['hogar-grande'] <= 80000, 'el gran hogar en la franja de lujo/ampliación');
  ok(PRECIOS['pared-piedra'] >= 800 && PRECIOS['pared-piedra'] <= 3000 && PRECIOS['techo-teja'] >= 800 && PRECIOS['techo-teja'] <= 3000, 'la pared y el techo, en la franja de los muebles buenos');
  // lo más grande y más trabajado cuesta más
  ok(PRECIOS['torreon-piedra'] > PRECIOS['planta-alta'] && PRECIOS['planta-alta'] > PRECIOS['salon-grande'] && PRECIOS['salon-grande'] > PRECIOS.buhardilla, 'torreón > planta alta > salón > buhardilla');
  ok(PRECIOS['torreon-piedra'] < 110000, 'la casona sigue siendo lo más caro del valle');
}

// ---------------------------------------------------------------- 3. la geometría
{
  const CASONA = 4416;
  for (const id of IDS_AMP) {
    const P = PLANO[id];
    let total = 0, maxEtapa = 0;
    for (let i = 0; i < 4; i++) {
      for (const suelo of [null, (x, z) => 0.2 + 0.08 * x - 0.05 * z]) {
        const c = tri(P, i, suelo);
        ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite) && c.nor.every(Number.isFinite), `${id} etapa ${i + 1}: dibuja sin números rotos`);
        ok(c.tipo.every((t) => t === 0 || t === 4), `${id} etapa ${i + 1}: sólo tipo 0 y 4`);
      }
      const n = tri(P, i).pos.length / 9;
      total += n; maxEtapa = Math.max(maxEtapa, n);
    }
    ok(total <= CASONA, `${id}: ${Math.round(total)} triángulos (tope: la casona, ${CASONA})`);
    ok(maxEtapa <= 2400, `${id}: la etapa más pesada ${Math.round(maxEtapa)} (tope 2400; la casona llega a 2004)`);
    // todo cae dentro de la huella (con el alero y la chimenea) y sobre el piso
    const c = new Constructor(); for (let i = 0; i < 4; i++) P.etapas[i].arma(c, P, {}, null);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = Infinity;
    for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); }
    ok(x1 - x0 <= P.ancho + 2.6 && z1 - z0 <= P.fondo + 2.6, `${id}: no se sale de la huella más de lo que sobresale un alero y una chimenea (${(x1 - x0).toFixed(1)} × ${(z1 - z0).toFixed(1)})`);
    ok(y0 >= -0.3, `${id}: no se hunde (${y0.toFixed(2)})`);
  }
  for (const id of IDS_PIEZAS) {
    const P = PLANO[id];
    const c = tri(P, 0);
    ok(c.pos.every(Number.isFinite) && c.tipo.every((t) => t === 0 || t === 4), `${id}: sin números rotos, tipo 0 y 4`);
    ok(c.pos.length / 9 <= 1000, `${id}: ${Math.round(c.pos.length / 9)} triángulos (tope 1000)`);
    let y1 = -Infinity;
    for (let k = 1; k < c.pos.length; k += 3) y1 = Math.max(y1, c.pos[k]);
    ok(y1 <= P.alto + 0.12 && y1 >= P.alto * 0.8, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto})`);
  }
}

// ---------------------------------------------------------------- 4. la ladera
{
  const norma = (k) => new THREE.Vector3(0, 1, -k).normalize();
  for (const id of IDS_AMP) {
    const k = 0.12;
    const w0 = mundo({ altura: (x, z) => k * z, normal: () => norma(k) });
    w0.s.elegir(C.PLANO[id]);
    const f0 = w0.s.fundar(0, 0, 0);
    ok(!f0.ok && /entrada|pendiente|desparejo/.test(f0.motivo), `${id}: en una ladera del 12 % con la entrada cuesta abajo no se funda (${f0.motivo})`);
    if (f0.motivo && /entrada/.test(f0.motivo)) ok(/girala/.test(f0.motivo), `${id}: el aviso dice «girala (R)»`);
    const w1 = mundo({ altura: (x, z) => k * z, normal: () => norma(k) });
    w1.s.elegir(C.PLANO[id]);
    const f1 = w1.s.fundar(0, 0, Math.PI);
    ok(f1.ok, `${id}: girada (la entrada cuesta arriba) sí se funda (${f1.motivo || 'ok'})`);
    // y se levanta entera en la ladera sin romperse
    if (f1.ok) {
      let r; while (f1.obra.datos.etapas < 4) { r = w1.s.avanzar(f1.obra, w1.mats); if (!r.ok) break; }
      ok(f1.obra.datos.etapas === 4, `${id}: se levanta entera en la ladera`);
    }
    const w2 = mundo(terreno(0));
    w2.s.elegir(C.PLANO[id]);
    ok(w2.s.fundar(0, 0, 0).ok, `${id}: en el llano se funda`);
  }
}

// ---------------------------------------------------------------- 5. la física con las colisiones reales
{
  // por cada ampliación: un punto libre adentro (sin muebles), el fondo y los costados que deben ser sólidos, y si tiene piso de arriba
  const PUNTOS = {
    'dormitorio-anexo': { adentro: [1.2, -0.3], D: 3.8, W: 4.6 }, 'despensa-anexa': { adentro: [0.6, -1.0], D: 3.2, W: 3.8 }, 'taller-anexo': { adentro: [0.3, -0.6], D: 3.8, W: 5.4 },
    quincho: { adentro: [1.5, -1.0], D: 4.8, W: 6.6, soloFondo: true }, 'galeria-cerrada': { adentro: [0, 0.4], D: 2.6, W: 7, soloLados: true }, 'cocina-ampliada': { adentro: [-0.5, -0.8], D: 4.4, W: 5.2 },
    'bodega-piedra': { adentro: [0.6, -0.8], D: 4.6, W: 5.6 }, buhardilla: { adentro: [-1.2, -1.0], D: 5.2, W: 4.4 }, 'salon-grande': { adentro: [0, -2.2], D: 6.0, W: 8.8 },
    'planta-alta': { adentro: [-0.8, -1.8], D: 4.6, W: 5.4 }, 'torreon-piedra': { adentro: [-0.1, -1.7], D: 4.2, W: 4.2 },
  };
  for (const id of IDS_AMP) {
    const k = PUNTOS[id], w = mundo(terreno(0));
    const r = w.terminar(id, 0, 0, 0);
    ok(r.ok, `${id}: se levanta en el llano`);
    const q = rutaLocal(w, r.o, [[0, -k.D / 2 - 3], [0, -k.D / 2 - 0.4], [0, -k.D / 2 + 1.0], k.adentro]);
    ok(Math.hypot(q.x - rutaLocal(w, r.o, [k.adentro, k.adentro]).x, q.z - rutaLocal(w, r.o, [k.adentro, k.adentro]).z) < 0.45 && Math.abs(q.y - 0.62) < 0.05, `${id}: se entra por la puerta hasta adentro y se camina sobre el piso (y=${q.y.toFixed(2)})`);
    // desde adentro, las paredes del fondo y de los costados no se atraviesan
    const fuera = (p) => rutaLocal(w, r.o, [k.adentro, p]);
    if (!k.soloLados) { const f = fuera([k.adentro[0], k.D / 2 + 2]); ok(f.z < k.D / 2 + 0.2, `${id}: el fondo es sólido (z=${f.z.toFixed(2)} de ${(k.D / 2).toFixed(2)})`); }
    if (!k.soloFondo) {
      for (const sx of [-1, 1]) { const f = fuera([sx * (k.W / 2 + 2), k.adentro[1]]); ok(Math.abs(f.x) < k.W / 2 + 0.2, `${id}: el lado ${sx > 0 ? 'este' : 'oeste'} es sólido (x=${f.x.toFixed(2)})`); }
    }
    // pared del frente cerrada a los costados de la puerta: desde afuera, a 1,5 m de la puerta, no se pasa
    if (!k.soloFondo) { const f = rutaLocal(w, r.o, [[1.5, -k.D / 2 - 2], [1.5, -k.D / 2 + 1.5]]); ok(f.z < -k.D / 2 + 0.3 || id === 'galeria-cerrada', `${id}: el frente es sólido a los costados de la puerta (z=${f.z.toFixed(2)})`); }
  }


  // los dos niveles: se sube por la escalera, se camina arriba, la baranda frena y se vuelve a bajar
  const mundoDe = (o, [lx, lz]) => { const r = o.datos.rot; return { x: o.datos.x + lx * Math.cos(r) + lz * Math.sin(r), z: o.datos.z - lx * Math.sin(r) + lz * Math.cos(r) }; };
  const andar = (w, o, q, pts) => { for (const p of pts) { const m = mundoDe(o, p); caminarA(w, q, m.x, m.z, 500); } return q; };
  const SUBE = {
    buhardilla: { ruta: [[0, -4], [0, -2.1], [1.7, -2.3], [1.7, -1.0], [1.7, 0.2], [1.7, 0.8], [0.5, 1.0]], arriba: 2.92, baja: [[1.7, 0.4], [1.7, -1.0], [1.7, -2.0], [0, -2.0]], prueba: [[0.5, 1.0], [0.5, -0.6]] },
    'planta-alta': { ruta: [[0, -4], [0, -1.6], [-2.15, -1.6], [-2.15, -1.0], [-2.15, 1.0], [-2.15, 1.85], [-1.2, 1.9], [-0.6, 1.0]], arriba: 3.32, baja: [[-1.2, 1.9], [-2.15, 1.85], [-2.15, 1.0], [-2.15, -1.0], [-2.15, -1.8], [0, -1.8]], prueba: [[-0.6, 0.0], [-2.15, 0.0]] },
    'torreon-piedra': { ruta: [[0, -4], [0, -1.7], [-1.3, -1.7], [-1.3, -1.2], [-1.3, 0.5], [-1.3, 1.6], [-0.3, 1.7], [0.2, 0.8]], arriba: 3.14, baja: [[-0.3, 1.7], [-1.3, 1.6], [-1.3, 0.5], [-1.3, -1.2], [-1.3, -1.8], [0, -1.8]], prueba: [[0.2, -0.3], [-1.3, -0.3]] },
  };
  for (const [id, s] of Object.entries(SUBE)) {
    const w = mundo(terreno(0));
    const r = w.terminar(id, 0, 0, 0);
    const q = rutaLocal(w, r.o, s.ruta);
    ok(Math.abs(q.y - s.arriba) < 0.06, `${id}: por la escalera se llega al piso de arriba (y=${q.y.toFixed(2)} de ${s.arriba})`);
    // arriba, la baranda del hueco (o del borde del altillo) frena: no se cae
    const p = andar(w, r.o, { ...q }, s.prueba);
    ok(p.y > s.arriba - 0.06, `${id}: la baranda frena a quien camina hacia el hueco (y=${p.y.toFixed(2)})`);
    // y se vuelve a bajar
    const b = andar(w, r.o, { ...q }, s.baja);
    ok(Math.abs(b.y - 0.62) < 0.06, `${id}: por la escalera se baja al piso de abajo (y=${b.y.toFixed(2)})`);
  }
}

// ---------------------------------------------------------------- 6. adentro, lluvia y vecindad
{
  const w = mundo(terreno(0));
  const r = w.terminar('planta-alta', 0, 0, 0);
  const o = r.o;
  ok(w.s.dentro({ x: o.datos.x, y: 0.62, z: o.datos.z }) === o, 'planta alta: abajo cuenta como adentro');
  ok(w.s.dentro({ x: o.datos.x + 1.2, y: 3.32, z: o.datos.z - 1.0 }) === o, 'planta alta: el piso de arriba también cuenta como adentro (dormir, confort)');
  ok(w.s.dentro({ x: o.datos.x + 9, y: 0.62, z: o.datos.z }) === null, 'y afuera no');
  const t = mundo(terreno(0));
  const rt = t.terminar('torreon-piedra', 0, 0, 0);
  ok(t.s.dentro({ x: rt.o.datos.x + 0.9, y: 3.14, z: rt.o.datos.z + 0.8 }) === rt.o, 'torreón: el cuarto de arriba cuenta como adentro');
  const cub = t.s.cubiertasLluvia({ x: 0, z: 0 }, 30);
  ok(cub.length >= 1 && cub.some((q) => q.y > 5), `torreón: el techo cubre de la lluvia (a ${cub[0]?.y?.toFixed(1)} m)`);
  // vecindad: arrimada a la casa grande (cuesta una obra grande hacerlo), se funda; encima, no
  const v = mundo(terreno(0));
  const casa = v.terminar('casa-galeria', 0, 0, 0);
  ok(casa.ok, 'la casa con galería se levanta');
  v.s.elegir(C.PLANO['dormitorio-anexo']);
  const lado = v.s.fundar(7.8 / 2 + 2.3 + 0.12, 0, 0);
  ok(lado.ok, `el dormitorio anexo se arrima al costado de la casa con galería (${lado.motivo || 'ok'})`);
  v.s.elegir(C.PLANO['dormitorio-anexo']);
  const encima = v.s.fundar(1, 0, 0);
  ok(!encima.ok && /encima|superpone/.test(encima.motivo), `y encima de la casa no (${encima.motivo})`);
  // en cambio, una casa grande NO se funda al lado de otra (la regla de siempre)
  v.s.elegir(C.PLANO.casona);
  ok(!v.s.fundar(12, 0, 0).ok, 'la regla de siempre para las casas grandes sigue igual');
  // la galería cerrada se arrima al frente de la cabaña (sin galería) y deja la puerta de la cabaña adentro
  const g = mundo(terreno(0));
  const cab = g.terminar('cabana-piedra', 0, 0, 0);
  g.s.elegir(C.PLANO['galeria-cerrada']);
  const gal = g.s.fundar(0, -4.6 / 2 - 2.6 / 2 - 0.02, 0);
  ok(gal.ok, `la galería cerrada se arrima al frente de la cabaña (${gal.motivo || 'ok'})`);
  if (gal.ok) {
    while (gal.obra.datos.etapas < 4) g.s.avanzar(gal.obra, g.mats);
    // desde afuera de la galería se llega, por su puerta y atravesándola, a la puerta de la cabaña y adentro
    const q = rutaLocal(g, gal.obra, [[0, -4], [0, -1.6], [0, 1.0]]);
    const dc = (lz) => ({ x: cab.o.datos.x, z: cab.o.datos.z + lz });
    caminarA(g, q, dc(-4.6 / 2 - 0.2).x, dc(-4.6 / 2 - 0.2).z, 300);
    caminarA(g, q, dc(0).x, dc(0).z, 300);
    ok(Math.hypot(q.x - cab.o.datos.x, q.z - cab.o.datos.z) < 0.5 && Math.abs(q.y - 0.62) < 0.1, `desde la galería cerrada se pasa a la cabaña por su puerta (y=${q.y.toFixed(2)}, a ${Math.hypot(q.x - cab.o.datos.x, q.z - cab.o.datos.z).toFixed(2)} m del centro)`);
  }
}

// ---------------------------------------------------------------- 6b. mover, desmontar y rehacer: la física acompaña
{
  // se la mueve entera (Mayús + Y): la escalera se sube en el lugar nuevo y el viejo queda libre
  const w = mundo(terreno(0));
  const r = w.terminar('planta-alta', 0, 0, 0);
  const ed = w.s.iniciarEdicionCerca({ x: 0, y: 0.62, z: -4 }, 8);
  ok(ed.ok && ed.obra === r.o, `planta alta: se agarra para moverla (${ed.motivo || 'ok'})`);
  const conf = w.s.confirmarEdicion(30, 0, 0);
  ok(conf.ok, `planta alta: se suelta en otro lugar (${conf.motivo || 'ok'})`);
  const libre = rutaLocal(w, { datos: { x: 0, z: 0, rot: 0 } }, [[0, -4], [0, 4]]);
  ok(libre.z > 3.5, `en el lugar viejo ya no hay paredes (z=${libre.z.toFixed(2)})`);
  const q = rutaLocal(w, r.o, [[0, -4], [0, -1.6], [-2.15, -1.6], [-2.15, -1.0], [-2.15, 1.0], [-2.15, 1.85]]);
  ok(Math.abs(q.y - 3.32) < 0.06, `y en el lugar nuevo la escalera se sube hasta arriba (y=${q.y.toFixed(2)})`);
  // se la desmonta: no queda nada que frene
  const des = w.s.desmontarCerca({ x: r.o.datos.x, y: 0.62, z: r.o.datos.z - 4 }, 8);
  ok(des.ok && des.recupera.piedra > 0, `planta alta: se desmonta y devuelve la mitad de los materiales (${JSON.stringify(des.recupera)})`);
  const pasa = rutaLocal(w, { datos: { x: 30, z: 0, rot: 0 } }, [[0, -4], [0, 4]]);
  ok(pasa.z > 3.5, `y donde estaba ya se camina libre (z=${pasa.z.toFixed(2)})`);
  // a medias: se retoma con la misma obra (no funda otra) y la física de lo hecho está
  const m = mundo(terreno(0));
  m.s.elegir(C.PLANO['torreon-piedra']);
  const f = m.s.fundar(0, 0, 0);
  m.s.avanzar(f.obra, m.mats); m.s.avanzar(f.obra, m.mats);
  const entra = rutaLocal(m, f.obra, [[0, -4], [0, -1.0]]);
  ok(Math.abs(entra.y - 0.62) < 0.06 && entra.z > -2.0, `torreón a medias (piso y planta baja): se entra por la puerta y se pisa el piso (y=${entra.y.toFixed(2)})`);
  const atrav = rutaLocal(m, f.obra, [[0, -1.0], [0, 4]]);
  ok(atrav.z < 2.3, `y sus muros de la planta baja ya frenan (z=${atrav.z.toFixed(2)})`);
}

// ---------------------------------------------------------------- 7. el gran hogar, la pared de piedra y el techo de teja
{
  const H = PLANO['hogar-grande'];
  ok(H.fuego === true && H.fuegoContenido === true && H.funciones.includes('calor') && H.confort >= 2, 'el gran hogar se prende con F y calienta');
  ok(H.chimenea && H.chimenea.ly > 3.5 && CHIMENEAS['hogar-grande'] && CHIMENEAS['hogar-grande'].ly === H.chimenea.ly, 'y su humo sale por la chimenea (casa-viva.js tiene la altura)');
  ok(H.apoyaEnPlataforma === true && H.pieza && H.pide.piedra >= 50, 'va sobre el piso de una sala y pide mucha piedra (para el pico)');
  const main = leer('src/main.js');
  ok((main.match(/'hogar-grande'/g) || []).length >= 2, 'main.js dice «Encender el hogar» y «Encendiste el hogar» también para el gran hogar');
  const w = mundo(terreno(0));
  const r = w.terminar('hogar-grande', 0, 0, 0);
  ok(r.ok, 'el gran hogar se levanta');
  const bloquea = rutaLocal(w, r.o, [[0, -3], [0, 3]]);
  ok(bloquea.z < 1.0, `y no se lo atraviesa (z=${bloquea.z.toFixed(2)})`);
  // pared de piedra y techo de teja: el mismo encastre y las mismas medidas que los de tablas
  const mismos = (a, b, campos) => campos.every((c) => JSON.stringify(PLANO[a][c]) === JSON.stringify(PLANO[b][c]));
  ok(mismos('pared-piedra', 'pared-modular', ['snap', 'ancho', 'alto', 'radio', 'soporteVertical', 'cierraHabitacion', 'apoyaEnPlataforma']), 'la pared de piedra encastra igual que la de tablas');
  ok(PLANO['pared-piedra'].fondo >= PLANO['pared-modular'].fondo && PLANO['pared-piedra'].fondo <= 0.35, 'y es más gruesa (0,30 m)');
  ok(mismos('techo-teja', 'techo-modular', ['snap', 'ancho', 'fondo', 'radio', 'requierePlataforma', 'elevacion', 'permiteSolapeCon', 'apoyaEnPlataforma']), 'el techo de teja encastra igual que el de tablas');
  ok(PLANO['pared-piedra'].sinPintura && PLANO['techo-teja'].sinPintura, 'la piedra y la teja no se pintan con la paleta de la casa');
  // una habitación modular con paredes de piedra y techo de teja es una casa de verdad
  const m = mundo(terreno(0));
  const levantar = (id, x, z, rot, y = null) => { m.s.elegir(C.PLANO[id]); const f = m.s.fundar(x, z, rot, y); if (!f.ok) return f; while (f.obra.datos.etapas < f.obra.plano.etapas.length) m.s.avanzar(f.obra, m.mats); return f; };
  const piso = levantar('piso-modular', 0, 0, 0);
  ok(piso.ok, 'el piso modular se levanta');
  const top = piso.obra.datos.y + 0.285;
  const paredes = [['pared-piedra', 0, 1.5, 0], ['pared-piedra', 0, -1.5, 0], ['pared-piedra', 1.5, 0, Math.PI / 2], ['pared-puerta', -1.5, 0, Math.PI / 2]].map(([id, x, z, rot]) => levantar(id, x, z, rot, top));
  ok(paredes.every((p) => p.ok), `cuatro paredes (tres de piedra y una con puerta) encastran sobre el piso (${paredes.map((p) => (p.ok ? 'ok' : p.motivo)).join(', ')})`);
  const techo = levantar('techo-teja', 0, 0, 0, top + 2.26);
  ok(techo.ok, `el techo de teja encastra encima (${techo.motivo || 'ok'})`);
  if (techo.ok) ok(m.s.dentro({ x: 0, y: top, z: 0.2 }) !== null, 'y la habitación cuenta como adentro');
  // la pared de piedra frena
  if (paredes[0].ok) {
    const c0 = paredes[0].obra;
    const p = rutaLocal(m, { datos: { x: c0.datos.x, z: c0.datos.z, rot: 0 } }, [[0, 3], [0, -3]]);
    ok(p.z > c0.datos.z + 0.3, `y la pared de piedra frena a quien viene de afuera (z=${p.z.toFixed(2)} de ${c0.datos.z.toFixed(2)})`);
  }
}

// ---------------------------------------------------------------- 8. el guardado y el reintegro
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  const { economiaNueva } = await import('../src/economia.js');
  const obras = [{ plano: 'torreon-piedra', x: 5, z: 5, rot: 0, etapas: 3, pagadas: 3 }, { plano: 'hogar-grande', x: 1, z: 2, rot: 0, etapas: 1, pagadas: 1 }, { plano: 'quincho', x: 20, z: 5, rot: 0, etapas: 2 }];
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 5, horas: 10, obras, economia: { ...economiaNueva(), pesos: 500 } }), 'se guarda');
  const r = G.leerPartida('relax', 1).progreso;
  eq(r.obras.map((o) => o.pagadas), [3, 1, undefined], 'lo pagado vuelve igual; lo viejo sigue sin pagadas');
  const relax = (pesos) => ({ modo: 'relax', economia: { ...economiaNueva(), pesos } });
  eq(O.reintegroAlDesmontar(relax(0), 'hogar-grande', 1, 1), 10000, 'desmontar el gran hogar devuelve la mitad de lo pagado ($10.000)');
  eq(O.reintegroAlDesmontar(relax(0), 'hogar-grande', 1, 0), 0, 'una de partida vieja no regala plata');
  eq(O.reintegroAlDesmontar(relax(0), 'torreon-piedra', 4, 3), Math.floor((15600 + 23400 + 23400) / 2 / 10) * 10, 'y una ampliación a medias devuelve la mitad de las etapas pagadas');
}

console.log(`OK 4.2 ampliar · ${pasos} verificaciones · once ampliaciones y tres piezas, con pesos, física, escaleras, ladera y guardado`);
