// 3.8.8 · Economía, Fase 3b: el banco del pueblo (edificio, gerente y mostrador).
//   · el edificio: sitio medido con el terreno real, sin agua, lejos de la vía, a 3 m de los demás, con su cartel y sus lugares;
//   · Amadeo, el gerente: vive en el banco, atiende de lunes a sábado en horario y duerme de noche;
//   · el mostrador (banco-mundo.js): préstamos, abastecimiento, casas y puesto, probados con un DOM de mentira.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const AR = await import('../src/aldea-arquitectura.js');
const { generarTerreno } = await import('../src/terreno.js');
const { LIMITE } = await import('../src/config.js');
const E = await import('../src/economia.js');
const N = await import('../src/negocios.js');
const B = await import('../src/prestamos.js');
const R = await import('../src/propiedad.js');
const C = await import('../src/comercio.js');
const { crearBancoMundo, SOLAPAS, MONTOS } = await import('../src/banco-mundo.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const ID = 'banco-pueblo';

// ---------------------------------------------------------------- 1. el sitio
{
  const T = generarTerreno(), marco = A.marcoAldea();
  const e = A.EDIFICIOS_ALDEA[ID];
  ok(e && e.inicial && e.rol === 'local' && !e.poblador && e.nombre === 'El banco del pueblo', 'está desde el día 1, es un local sin poblador');
  ok(A.INICIALES_ALDEA.includes(ID), 'entre los iniciales');
  eq([e.ancho, e.fondo], [AR.EDIFICIOS_ALDEA[ID].ancho, AR.EDIFICIOS_ALDEA[ID].fondo], 'mismo tamaño en el núcleo y en la arquitectura');
  ok(Math.abs(Math.sin(e.rot * 2)) < 1e-9, 'giro de a 90°');
  const segRiel = T.riel.filter((q) => Math.hypot(q.x - A.PARADA_ALDEA.x, q.z - A.PARADA_ALDEA.z) < 500);
  const distRiel = (x, z) => { let d = Infinity; for (let i = 0; i < segRiel.length - 1; i++) { const a = segRiel[i], b = segRiel[i + 1]; const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz; const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / l2)); d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t)); } return d; };
  let min = Infinity, max = -Infinity, s = 0, k = 0, agua = false, riel = Infinity, fuera = false, calle = Infinity;
  for (const q of A.muestrasPlanta(ID, 0.25)) {
    const w = marco.aMundo(q.lx, q.lz), h = T.altura(w.x, w.z);
    min = Math.min(min, h); max = Math.max(max, h); s += h; k++;
    riel = Math.min(riel, distRiel(w.x, w.z)); if (T.agua(w.x, w.z)) agua = true;
    if (Math.abs(w.x) > LIMITE - 4 || Math.abs(w.z) > LIMITE - 4) fuera = true;
    for (const c of A.CALLES_ALDEA) calle = Math.min(calle, A.distanciaACalle(q.lx, q.lz, c));
  }
  ok(!agua && !fuera, 'fuera del agua y dentro del valle');
  ok(riel >= 22, `a ${riel.toFixed(1)} m de la vía`);
  ok(max - min <= 1.5, `desnivel de ${(max - min).toFixed(2)} m (≤ 1,5)`);
  ok(Math.abs(s / k - e.y) < 0.05, `el piso a la media del terreno (${(s / k).toFixed(2)} vs ${e.y})`);
  ok(calle >= 1, `con vereda (${calle.toFixed(1)} m a la calle)`);
  for (const otro of A.IDS_EDIFICIOS) {
    if (otro === ID) continue;
    const a = A.plantaDe(ID), b = A.plantaDe(otro);
    const d = Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));
    ok(d >= 3 - 1e-9, `a ${d.toFixed(1)} m de ${otro} (≥ 3)`);
  }
  const pts = A.puntosDe(ID);
  for (const k2 of ['puerta', 'adentro', 'trabajo', 'cama', 'cliente']) ok(!!pts[k2], `tiene el punto ${k2}`);
  ok(A.dentroDePlanta(ID, pts.adentro.x, pts.adentro.z, 0.3) && A.dentroDePlanta(ID, pts.cama.x, pts.cama.z, 0.3), 'adentro y la cama, adentro');
  ok(A.PUERTA_X[ID] === 0, 'la puerta, en el medio');
}

// ---------------------------------------------------------------- 2. la arquitectura
{
  const d = AR.armarEdificio(ID, 4);
  eq([d.ancho, d.fondo], [7.8, 6.4], 'las medidas');
  ok(d.exterior.estructura && d.interior.muebles, 'trae estructura y muebles');
  ok(d.puntos.nombrados.adentro && d.puntos.nombrados.puerta && d.puntos.nombrados.trabajo && d.puntos.nombrados.cama, 'los puntos con nombre');
  const dentro = (p) => Math.abs(p.lx) < 7.8 / 2 && Math.abs(p.lz) < 6.4 / 2;
  ok(dentro(d.puntos.nombrados.adentro) && dentro(d.puntos.nombrados.cama), 'el gerente atiende y duerme adentro');
  // lo que dice el núcleo, en el marco del edificio: detrás del mostrador (z < 0,7) y mirando al público (mira 0)
  ok(d.puntos.nombrados.adentro.lz < 0.7 && Math.abs(d.puntos.nombrados.adentro.mira) < 1e-6, 'detrás del mostrador, mirando al público');
  ok(d.puertas.length >= 1 && d.puertas[0].nombre.includes('banco'), 'la puerta del banco');
  ok(d.colisiones.obstaculos.length > 5, 'con obstáculos (mostrador, caja fuerte)');
  ok(d.luces.length >= 2 && d.medidas.triangulos.exterior < 12000 && d.medidas.triangulos.interior < 8000, `con luces y dentro del presupuesto (${d.medidas.triangulos.exterior} + ${d.medidas.triangulos.interior})`);
  ok(AR.CARTELES_ALDEA.some((c) => c.texto === 'Banco del Pueblo') && AR.CARTELES_ALDEA.length <= (AR.ATLAS_CARTELES.alto / AR.ATLAS_CARTELES.celdaAlto) * AR.ATLAS_CARTELES.columnas, 'el cartel, con su celda en el atlas');
  eq(AR.armarEdificio(ID, 0).ancho, 7.8, 'una etapa de obra de más se arma igual (es inicial)');
}

// ---------------------------------------------------------------- 3. el gerente
{
  const g = A.VECINOS_ALDEA.gerente;
  ok(g && g.nombre === 'Amadeo Lezcano' && g.casa === ID && g.trabajo === ID && /gerente/.test(g.oficio) && g.charla.length >= 3, 'Amadeo, el gerente: vive y trabaja en el banco');
  ok(A.ORDEN_VECINOS_ALDEA.includes('gerente') && A.esVecinoAldea('gerente') && A.esPersonaAldea('gerente') && A.ORDEN_PERSONAS_ALDEA.at(-1) === 'gerente', 'entre los vecinos, al final del orden');
  ok(A.cumpleDe('gerente') >= 1 && A.cumpleDe('gerente') <= 12, 'su cumpleaños');
  const estado = A.aldeaNueva();
  const r = (h, ds) => A.rutinaAldea('gerente', h, ds, estado, 5);
  eq([r(10, 0).lugar, r(10, 0).edificio, r(10, 0).punto], ['trabajo', ID, 'adentro'], 'a la mañana atiende el mostrador');
  eq([r(16, 4).edificio, r(16, 4).punto], [ID, 'adentro'], 'a la tarde también');
  ok(r(13.5, 2).lugar !== 'trabajo', 'a la siesta cierra');
  ok(r(10, 6).lugar !== 'trabajo', 'el domingo no atiende');
  eq([r(3, 1).lugar, r(3, 1).edificio, r(3, 1).punto], ['casa', ID, 'cama'], 'de noche duerme en su cama del banco');
  // el sueldo del jefe del banco: charla con el mostrador cuando hay economía (aldea-gente.js ofrece abrirlo)
  const gente = fsLeer('src/aldea-gente.js');
  ok(gente.includes("k === 'gerente'") && gente.includes('ctx.abrirBanco'), 'aldea-gente.js lo atiende con el mostrador');
  ok(/abrirBanco: \(\) => bancoDelPueblo\(\)\.abrir\(\)/.test(fsLeer('src/main.js')), 'main.js abre el mostrador');
}
function fsLeer(f) { return fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'); }

// ---------------------------------------------------------------- 4. el mostrador, con un DOM de mentira
{
  const mk = (tag) => {
    const el = {
      tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
      get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
      set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
      append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); },
      addEventListener(ev, fn) { this.listeners[ev] = fn; },
      classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c) },
    };
    return el;
  };
  globalThis.document = { createElement: mk };
  const todos = (el, f = []) => { f.push(el); for (const c of el.children) todos(c, f); return f; };
  const botones = (m) => todos(m.contenido).filter((x) => x.tag === 'button');
  const clic = (m, texto) => { const b = botones(m).find((x) => x.textContent.includes(texto) && !x.disabled); assert.ok(b, `no hay botón «${texto}» habilitado`); b.listeners.click(); n++; };
  const hay = (m, texto) => m.contenido.textContent.includes(texto);
  const p = { modo: 'relax', dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva() };
  const notas = []; let guardados = 0;
  const panel = mk('section'); panel.classList.add('oculto');
  const contenido = mk('div');
  const ctx = { panel, contenido, progreso: () => p, dia: () => p.dia, nota: (t, s) => notas.push([t, s]), guardar: () => { guardados++; }, refrescar: () => {}, T_: (t) => t, sonido: null };
  const m = crearBancoMundo(ctx); m.contenido = contenido;
  ok(!m.abierto() && panel.classList.contains('oculto'), 'cerrado');
  m.abrir();
  ok(m.abierto() && !panel.classList.contains('oculto') && hay(m, 'Tenés $0'), 'abre y muestra el saldo');
  eq(SOLAPAS, ['prestamos', 'abasto', 'casas', 'puesto'], 'las cuatro solapas');
  // préstamos
  ok(hay(m, 'Lo máximo que te presta') && hay(m, '$3.000') && hay(m, 'Recién llegado'), 'muestra el tope y la confianza');
  ok(MONTOS.filter((x) => x <= 3000).every((x) => hay(m, `${E.formatoPesos(x)} · devolvés`)), 'los montos que se pueden pedir');
  ok(!hay(m, E.formatoPesos(5000) + ' · devolvés'), 'y no los que superan el tope');
  // pedir un préstamo
  clic(m, '9 días');
  clic(m, `${E.formatoPesos(2000)} · devolvés`);
  ok(E.pesosDe(p) === 2000 && B.prestamoDe(p).hasta === 14 && hay(m, 'Debés') && hay(m, '$2.000') && notas.at(-1)[0] === 'Te prestaron $2.000', 'te presta a nueve días y lo muestra');
  ok(botones(m).every((x) => !x.textContent.includes('· devolvés')), 'con deuda no hay más montos');
  p.dia = 6; B.pasarDiaBanco(p, 6); m.dibujar();
  ok(hay(m, '$2.040'), 'al otro día, con el interés');
  clic(m, 'Pagar $500');
  ok(B.prestamoDe(p).debe === 1540 && E.pesosDe(p) === 1500, 'pagar de a poco');
  p.economia.pesos = 5000; m.dibujar();
  clic(m, 'Saldar todo');
  ok(B.prestamoDe(p) === null && N.negociosDe(p).banco.rep === 1 && notas.at(-1)[0] === 'Saldaste el préstamo', 'saldado a tiempo');
  ok(guardados === 3, 'guarda en cada operación (pedir, pagar, saldar)');
  // abastecimiento
  clic(m, 'Abastecimiento');
  const a = B.abastoDe(p, p.dia);
  ok(hay(m, 'El banco necesita') && hay(m, E.formatoPesos(a.premio)) && botones(m).find((x) => x.textContent === 'Entregar el pedido').disabled, 'muestra el pedido y no se puede entregar sin la mercadería');
  const dar = (bien, cant) => { const b = C.BIENES[bien]; if (b.donde === 'material') p.materiales[bien] = cant; else if (b.donde === 'entrada') p.entradas[bien] = { dia: 1, hora: 1, cantidad: cant }; else p.cosas[bien] = cant; };
  dar(a.k, a.n); m.dibujar();
  const antes = E.pesosDe(p);
  clic(m, 'Entregar el pedido');
  ok(E.pesosDe(p) === antes + a.premio && B.abastoDe(p, p.dia) === null && hay(m, 'Ya cumpliste el pedido'), 'entrega y cobra');
  // casas
  clic(m, 'Casas y alquiler');
  ok(hay(m, 'Cabaña de tablas y piedra') && hay(m, '$36.000') && botones(m).filter((x) => x.textContent === 'Poner en alquiler').every((x) => x.disabled), 'las casas con su precio, sin ninguna levantada');
  R.registrarCasa(p, 'casa-galeria'); m.dibujar();
  clic(m, 'Poner en alquiler');
  ok(R.enAlquilerDe(p, 'casa-galeria') === 1 && /se instala/.test(notas.at(-1)[1]), 'alquila una casa levantada');
  clic(m, 'Retirar del alquiler');
  ok(R.enAlquilerDe(p, 'casa-galeria') === 0, 'y la retira');
  // el puesto
  clic(m, 'Mi puesto');
  ok(hay(m, 'Cuesta $6.000') && botones(m).find((x) => x.textContent.startsWith('Comprar el puesto')).disabled === (E.pesosDe(p) < 6000), 'el puesto, con su precio');
  p.economia.pesos = 7000; m.dibujar();
  clic(m, 'Comprar el puesto');
  ok(R.tienePuesto(p) && E.pesosDe(p) === 1000, 'lo compra');
  p.materiales.tabla = 9; m.dibujar();
  clic(m, 'Dejar 1 lote');
  ok(R.lotesEnPuesto(p, 'tabla') === 1 && p.materiales.tabla === 5, 'deja un lote en consigna y saca las tablas de la mochila');
  clic(m, 'Sacar 1 lote');
  ok(R.lotesEnPuesto(p, 'tabla') === 0 && p.materiales.tabla === 9, 'lo saca y vuelven a la mochila');
  clic(m, 'Dejar 1 lote');
  R.ventasDelPuesto(p, 7); m.dibujar();
  const caja = N.negociosDe(p).casas.puesto.caja;
  ok(caja > 0, 'el puesto vendió');
  clic(m, 'Retirar la caja');
  ok(E.pesosDe(p) === 1000 + caja && N.negociosDe(p).casas.puesto.caja === 0, 'retira la caja');
  m.cerrar();
  ok(!m.abierto() && panel.classList.contains('oculto'), 'cierra');
  // una partida sin economía (el Desafío) no abre nada
  const q = { dia: 1 }; const c2 = mk('div'); const m2 = crearBancoMundo({ ...ctx, progreso: () => q, contenido: c2 });
  m2.abrir();
  ok(/todavía no abre/.test(c2.textContent) && !/Tenés/.test(c2.textContent), 'sin economía, el banco no abre');
  delete globalThis.document;
}

console.log(`verificar-3-8-8-banco: ${n} verificaciones ok`);
