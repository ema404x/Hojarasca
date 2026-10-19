// 4.2 (parte 1) · EL PICO, en Node (sin Electron; lo que necesita el juego de verdad está en humo-4-2-pico.cjs).
//   · para picar piedra hace falta el pico (el hacha ya no alcanza): main.js lo pide y avisa dónde conseguirlo;
//   · tres maneras de conseguirlo, con precios que se ordenan: trueque en el almacén (cantos y ramitas), forja del herrero (cantos y
//     pesos, por la puerta de la economía) y compra directa en el almacén (el atajo caro);
//   · mochila, barra, cuaderno y guía;
//   · el guardado: el Desafío arranca con pico, una partida vieja con hacha y sin pico recibe uno UNA sola vez, y no se repite.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const A = await import('../src/aldea.js');
const G = await import('../src/guardado.js');
const { TRUEQUES, TRUEQUE, tieneYa, PESOS_PICO_COMPRADO } = await import('../src/trueque.js');
const { economiaNueva, pesosDe, puedePagar, pagar } = await import('../src/economia.js');
const { ENTRADAS } = await import('../src/cuaderno.js');

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const main = leer('src/main.js');
const tramo = (desde, largo = 2500) => { const i = main.indexOf(desde); assert.ok(i >= 0, `no está: ${desde}`); return main.slice(i, i + largo); };

// ============================================================ 1. los tres caminos y sus precios
{
  const t = TRUEQUE.pico, c = TRUEQUE['pico-comprado'], h = TRUEQUE.hacha;
  ok(t && c, 'el almacén tiene el pico por trueque y el pico comprado');
  eq(t.cosa, 'pico', 'el trueque da `pico`');
  eq(c.cosa, 'pico', 'la compra da `pico`');
  ok(!t.repetible && !c.repetible, 'el pico se consigue una sola vez');
  ok(t.pide.every(([k, q]) => Number.isInteger(q) && q > 0), 'el trueque pide cantidades enteras');
  const cantos = (x) => x.pide.find(([k]) => k === 'canto')?.[1] || 0, ramitas = (x) => x.pide.find(([k]) => k === 'ramita')?.[1] || 0;
  ok(cantos(t) > cantos(h) && ramitas(t) > ramitas(h), 'el pico por trueque sale un poco más caro que el hacha');
  ok(cantos(t) <= 3 && ramitas(t) <= 12, 'y los cantos del trueque siguen siendo accesibles (no más de 3)');
  eq(c.pide, [], 'la compra no pide cosas, sólo plata');
  eq(c.pesos, PESOS_PICO_COMPRADO, 'la compra pide el precio fijo');
  ok(A.SERVICIO.cantosPico === 3 && A.SERVICIO.pesosPico > 0, 'el herrero pide cantos y pesos');
  ok(A.SERVICIO.pesosPico < PESOS_PICO_COMPRADO, 'la forja sale más barata que comprarlo directo (el atajo es el caro)');
  ok(PESOS_PICO_COMPRADO >= 3 * A.SERVICIO.pesosPico, 'y bastante más (al menos el triple)');
  ok(PESOS_PICO_COMPRADO <= 2000, 'sin pasarse: por debajo de lo que vale un poncho');
  // están al final de la lista del almacén: no mueven los números de lo que ya había
  eq(TRUEQUES.slice(-2).map((x) => x.id), ['pico', 'pico-comprado'], 'al final de la lista del almacén');
  ok(tieneYa(t, { pico: 1 }) && tieneYa(c, { pico: 1 }), 'con el pico en la mochila, las dos ofertas dicen «ya lo tenés»');
  ok(!tieneYa(t, { hacha: 1 }) && !tieneYa(c, {}), 'y sin él, no');
  ok(ENTRADAS.some((e) => e.id === 'pico' && e.seccion === 'trueque' && e.nombre && e.texto && e.pista), 'el pico tiene su anotación en el cuaderno');
  ok(!/juntada con el hacha/.test(ENTRADAS.find((e) => e.id === 'piedra-mat').cientifico), 'el cuaderno ya no dice que la piedra se junta con el hacha');
  // lo que paga la compra pasa por la puerta de la economía
  const p = { modo: 'relax', dia: 3, cosas: {}, economia: { ...economiaNueva(), pesos: PESOS_PICO_COMPRADO - 1 } };
  ok(!puedePagar(p, c.pesos), 'con un peso de menos no alcanza');
  p.economia.pesos += 1;
  const r = pagar(p, c.pesos, c.nombre, 'Ercilia (almacén)');
  ok(r.ok && pesosDe(p) === 0 && p.economia.libro.at(-1).monto === -PESOS_PICO_COMPRADO, 'se paga entero y queda en el libro');
  const d = { modo: 'desafio', cosas: {} };
  ok(!puedePagar(d, c.pesos), 'en el Desafío no hay plata: no se vende por plata');
}

// ============================================================ 2. el herrero de la aldea
{
  const partida = (extra = {}) => {
    const p = { modo: 'relax', dia: 10, horas: 10, materiales: {}, entradas: {}, cosas: { hacha: 1, tijera: 1 }, economia: { ...economiaNueva(), pesos: 0 }, aldea: A.aldeaNueva(), correo: { llegadas: {}, ultimoDia: -1, fotos: {} }, ...extra };
    p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
    p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
    return p;
  };
  const cantos = (k) => ({ canto: { dia: 1, hora: 9, cantidad: k } });
  const S = A.SERVICIO, dia = 10;
  // con los cantos y la plata: lo forja
  let p = partida({ entradas: cantos(S.cantosPico), economia: { ...economiaNueva(), pesos: S.pesosPico + 50 } });
  let s = A.servicioBase('herrero', p, dia);
  ok(s.efectos && s.efectos.some((f) => f.tipo === 'cosa' && f.k === 'pico'), 'el herrero ofrece forjar el pico');
  ok(s.efectos.some((f) => f.tipo === 'pesos' && f.n === -S.pesosPico && f.motivo), 'y lo cobra en pesos con su motivo');
  ok(s.efectos.some((f) => f.tipo === 'entrada' && f.k === 'canto' && f.n === -S.cantosPico), 'y los cantos');
  ok(/pico/.test(s.titulo) && /pico/i.test(s.partes.join(' ')), 'dice qué hace');
  A.aplicarEfectos(p, s.efectos, dia);
  ok(p.cosas.pico === 1 && p.entradas.canto.cantidad === 0 && pesosDe(p) === 50, 'forjado: pico, cantos y pesos descontados');
  ok(p.economia.libro.some((m) => m.monto === -S.pesosPico && /Pico/.test(m.motivo)), 'el libro anota «Pico forjado»');
  // ya con pico: no lo ofrece de nuevo y sigue afilando el hacha
  s = A.servicioBase('herrero', p, dia);
  ok(!s.efectos?.some((f) => f.k === 'pico') && s.efectos?.some((f) => f.campo === 'afilado'), 'con el pico hecho, el herrero afila el hacha como siempre');
  ok(!/pico/i.test(s.partes.join(' ')), 'y no insiste con el pico');
  // le faltan pesos: no lo forja pero avisa cuánto sale (y todavía afila)
  p = partida({ entradas: cantos(S.cantosPico), economia: { ...economiaNueva(), pesos: S.pesosPico - 1 } });
  s = A.servicioBase('herrero', p, dia);
  ok(!s.efectos?.some((f) => f.k === 'pico'), 'sin la plata, no lo forja');
  ok(s.partes.some((l) => l.includes('pico') && l.includes('$300')), `avisa lo que cuesta (${s.partes.join(' / ')})`);
  ok(s.efectos?.some((f) => f.campo === 'afilado'), 'y lo de siempre, el afilado, sigue');
  // le faltan cantos
  p = partida({ entradas: cantos(S.cantosPico - 1), economia: { ...economiaNueva(), pesos: 5000 } });
  s = A.servicioBase('herrero', p, dia);
  ok(!s.efectos?.some((f) => f.k === 'pico') && s.partes.some((l) => /pico/.test(l)), 'sin los cantos, tampoco; avisa');
  // en el Desafío (sin economía) el herrero no ofrece pico (se arranca con él)
  p = partida({ modo: 'desafio', entradas: cantos(9) }); delete p.economia;
  s = A.servicioBase('herrero', p, dia);
  ok(!s.efectos?.some((f) => f.k === 'pico'), 'sin economía, el herrero no vende pico');
  // sin tijera, la tijera va primero pero el pico no se olvida
  p = partida({ cosas: { hacha: 1 }, entradas: cantos(S.cantosTijera), economia: { ...economiaNueva(), pesos: 10 } });
  s = A.servicioBase('herrero', p, dia);
  ok(s.efectos?.some((f) => f.k === 'tijera') && s.partes.some((l) => /pico/.test(l)), 'con la tijera por forjar, igual avisa lo del pico');
  // y sin hacha, primero el hacha (como siempre)
  p = partida({ cosas: { tijera: 1 }, entradas: cantos(6), economia: { ...economiaNueva(), pesos: 5000 } });
  s = A.servicioBase('herrero', p, dia);
  ok(s.efectos?.some((f) => f.k === 'hacha') && !s.efectos?.some((f) => f.k === 'pico'), 'sin hacha, forja primero el hacha');
  ok(/pico/.test(A.POBLADORES_ALDEA.herrero.resumen), 'el resumen de la charla del herrero nombra el pico');
}

// ============================================================ 3. el guardado y la partida vieja
{
  const claveRelax = (ranura = 1) => G.usarModoGuardado('relax', ranura);
  // una partida nueva del Relax: sin pico, con la marca puesta (para que no se lo den)
  claveRelax();
  const nueva = G.progresoNuevo();
  ok(!nueva.cosas.pico && !nueva.cosas.hacha && nueva.picoEntregado === true, 'el Relax nuevo no trae pico ni hacha; trae la marca de la migración');
  G.usarModoGuardado('desafio', 1);
  const des = G.progresoNuevo();
  ok(des.cosas.hacha === 1 && des.cosas.pico === 1, 'el Desafío arranca con hacha y con pico');
  claveRelax();

  // una partida de antes: hacha, sin pico, sin la marca
  const vieja = () => { const p = G.progresoNuevo(); p.cosas = { hacha: 1, tijera: 1 }; delete p.picoEntregado; return p; };
  ok(G.escribirPartida('relax', 1, vieja()), 'se escribe la partida vieja');
  claveRelax();
  let c = G.cargarProgreso();
  ok(c.cosas.pico === 1 && c.cosas.hacha === 1 && c.cosas.tijera === 1, 'al cargar, quien tenía hacha y no pico recibe el pico (y no pierde nada)');
  ok(c.picoEntregado === true && c.picoAviso === true, 'queda la marca y el aviso pendiente');
  // se juega: el aviso se muestra (main lo borra) y se guarda; recargar no repite nada
  delete c.picoAviso; delete c.cosas.pico;   // (el jugador perdió el pico por algún motivo: no se lo vuelven a dar)
  ok(G.guardarProgreso(c), 'se guarda');
  c = G.cargarProgreso();
  ok(!c.cosas.pico && !c.picoAviso && c.picoEntregado === true, 'una sola vez: ni se repite el pico ni el aviso');
  // quien ya tenía pico no recibe aviso
  const conPico = vieja(); conPico.cosas.pico = 1;
  G.escribirPartida('relax', 1, conPico); claveRelax();
  c = G.cargarProgreso();
  ok(c.cosas.pico === 1 && !c.picoAviso, 'si ya tenía pico, nada de aviso');
  // quien no tenía hacha no recibe pico (lo tiene que conseguir) pero queda marcado
  const sinHacha = vieja(); sinHacha.cosas = {};
  G.escribirPartida('relax', 1, sinHacha); claveRelax();
  c = G.cargarProgreso();
  ok(!c.cosas.pico && !c.cosas.hacha && c.picoEntregado === true, 'sin hacha no hay pico regalado');
  // si más tarde consigue el hacha, tampoco se le regala
  c.cosas.hacha = 1; G.guardarProgreso(c); claveRelax();
  c = G.cargarProgreso();
  ok(c.cosas.hacha === 1 && !c.cosas.pico, 'y si después consigue el hacha, el pico lo consigue él');
  // un Desafío viejo (hacha, sin pico) también lo recibe
  const dv = (() => { G.usarModoGuardado('desafio', 1); const p = G.progresoNuevo(); p.cosas = { hacha: 1 }; delete p.picoEntregado; return p; })();
  G.escribirPartida('desafio', 1, dv); G.usarModoGuardado('desafio', 1);
  c = G.cargarProgreso();
  ok(c.cosas.pico === 1, 'un Desafío guardado antes de la 4.2 también recibe el pico');
  claveRelax();
  // el aviso es un booleano: basura no pasa
  const basura = G.progresoNuevo(); basura.cosas = { hacha: 1 }; basura.picoAviso = 'sí';
  G.escribirPartida('relax', 1, basura); claveRelax();
  c = G.cargarProgreso();
  ok(!c.picoAviso, 'un aviso que no es verdadero se descarta');
}

// ============================================================ 4. el juego: H pica con pico, sin pico avisa
{
  const hacha = tramo('function objetivoHacha() {', 2300);
  ok(/const hacha = tieneHacha\(\), pico = tienePico\(\)/.test(hacha) && /if \(!hacha && !pico\) return null/.test(hacha), 'el objetivo mira el hacha y el pico');
  ok(/m\.tipo === 'tronco' && !hacha/.test(hacha), 'sin hacha, un tronco caído no se corta');
  ok(/sinPico: mejor\.tipo === 'roca' && !pico/.test(hacha), 'la roca sin pico se marca');
  ok(/if \(!hacha\) return null;/.test(hacha), 'los árboles, sólo con hacha');
  const uso = tramo('function usarHacha() {', 4800);
  ok(/if \(o\.sinPico\)/.test(uso) && /Te falta el pico/.test(uso) && /herrero/.test(uso) && /almacén/.test(uso), 'sin pico: aviso claro con dónde conseguirlo');
  ok(uso.indexOf('o.sinPico') < uso.indexOf('sumarMaterial(o.tipo'), 'y el aviso va ANTES de dar la piedra');
  ok(/Para picar piedra hace falta el pico/.test(tramo('function textoHacha(o) {', 400)), 'el cartel de la H dice que hace falta el pico');
  ok(/case 'hacha': case 'pico': usarHacha\(\)/.test(main), 'el pico de la mochila usa la misma H');
  ok((main.match(/'hacha', 'pico', 'aserrar'/g) || []).length === 2, 'a caballo y en el sulky tampoco se pica');
  ok(/PIEDRA_MATA/.test(uso) && /ganarOficio\('hachero', XP\.mata\)/.test(uso), 'con pico se da la piedra y sube el oficio de hachero como antes');
  const alma = tramo('function cambiar(i) {', 2500);
  ok(/pagarPesos\(progreso, t\.pesos/.test(alma) && /puedePagar\(progreso, t\.pesos\)/.test(alma), 'el almacén cobra el pico en pesos por la puerta de la economía');
  ok(/t\.cosa \|\| t\.id/.test(alma), 'y lo que se lleva es `pico`, venga de donde venga');
  ok(alma.indexOf('pagarPesos(') > alma.indexOf('puedePagar('), 'se mira que alcance antes de cobrar');
  const ent = tramo("$('btn-entrar').addEventListener('click'", 7000);
  ok(/progreso\.picoAviso/.test(ent) && /Ahora para picar piedra hace falta el pico/.test(ent), 'el aviso de la partida vieja sale al entrar');
}

// ============================================================ 5. mochila, barra, en mano, guía
{
  const moch = leer('src/mochila.js'), mano = leer('src/enmano.js'), guia = leer('src/guia.js');
  ok(/pico\(\) \{/.test(moch) && /id: 'pico', nombre: 'Pico de cantero', icono: 'pico', accion: 'pico'/.test(moch), 'la mochila tiene la ranura y el ícono del pico');
  ok(/const adelante = \[[^\]]*'hacha', 'pico'\]/.test(moch), 'en el Desafío va junto al hacha en la barra');
  ok(/\n  pico\(o = OPCIONES_BASE\)/.test(mano), 'en la mano hay un modelo del pico');
  ok(/idActual === 'pico'/.test(mano), 'que se balancea como el hacha');
  ok(/case 'hacha': case 'pico':/.test(leer('src/personal-armas.js')), 'con el mismo mango que el hacha (Personalizar)');
  ok(/pico/.test(guia) && !/'hacha: talar árboles y picar piedra'/.test(guia), 'la guía habla del pico');
  ok(/pico/.test(leer('src/plantilla.html').slice(leer('src/plantilla.html').indexOf('<kbd>H</kbd>'), leer('src/plantilla.html').indexOf('<kbd>H</kbd>') + 200)), 'y la ayuda de teclas');
  ok(/con el pico/.test(leer('src/construccion.js')) && /con el pico/.test(leer('src/desafio.js')), 'los textos de la piedra (planos y honda) dicen pico');
  ok(/pico/.test(leer('src/guardado.js')) && /cosas: desafio \? \{ hacha: 1, pico: 1 \}/.test(leer('src/guardado.js')), 'el Desafío arranca con pico');
}

console.log(`OK 4.2 el pico · ${n} comprobaciones`);
