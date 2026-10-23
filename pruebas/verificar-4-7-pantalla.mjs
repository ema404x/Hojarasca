// 4.7 pantalla: la mochila con casillas que se ve y se maneja (src/carga-pantalla.js, el panel de plantilla.html y main.js), en Node:
//   · la vista de las casillas a partir de `ocupacion` (con un progreso de mentira y con la forma del contrato): 24 casillas, pilas
//     partidas, vacías visibles, +12 con alforjas montado;
//   · la sobrecarga (partida vieja con 989 troncos): las casillas muestran sólo lo que entra, el aviso lista lo que sobra, con
//     ícono y palabra (no sólo color);
//   · los textos del contador, del HUD y de la línea de los depósitos; el Desafío sin casillas;
//   · el DOM del panel con un documento de mentira (clic y Enter eligen, las vacías no se eligen);
//   · lo enganchado en main.js y en la plantilla, el campo «Con alforjas» y que el HUD no se arma por cuadro.
import assert from 'assert/strict';
import fs from 'fs';

const P = await import('../src/carga-pantalla.js');
const C = await import('../src/carga.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ---------------------------------------------------------------- un documento de mentira
class El {
  constructor(tag) { this.tag = tag; this.hijos = []; this.className = ''; this.attrs = {}; this.oyentes = {}; this._texto = ''; this.tabIndex = -1; this.title = ''; this.src = ''; this.alt = ''; }
  get classList() {
    const el = this;
    const lista = () => el.className.split(/\s+/).filter(Boolean);
    return {
      add: (c) => { if (!lista().includes(c)) el.className = [...lista(), c].join(' '); },
      remove: (c) => { el.className = lista().filter((x) => x !== c).join(' '); },
      contains: (c) => lista().includes(c),
      toggle: (c, f) => { const t = f === undefined ? !lista().includes(c) : !!f; if (t) this.classList.add(c); else this.classList.remove(c); return t; },
    };
  }
  get textContent() { return this.hijos.length ? this.hijos.map((h) => h.textContent).join('') : this._texto; }
  set textContent(t) { this.hijos = []; this._texto = String(t); }
  appendChild(h) { this.hijos.push(h); return h; }
  append(...hs) { for (const h of hs) this.hijos.push(h); }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  disparar(t, ev = {}) { for (const f of this.oyentes[t] || []) f({ preventDefault() {}, ...ev }); }
  todos() { return [this, ...this.hijos.flatMap((h) => h.todos())]; }
}
const doc = { createElement: (t) => new El(t) };
const casillasDe = (cont) => cont.hijos.filter((h) => h.classList.contains('casilla'));

// ---------------------------------------------------------------- partidas de mentira
const NOMBRES = { tronco: 'Troncos', tabla: 'Tablas', piedra: 'Piedra', pinon: 'Piñones', huevo: 'Huevos', manzana: 'Manzanas' };
const buscar = (k) => (Object.hasOwn(NOMBRES, k) ? { nombre: NOMBRES[k], icono: k, id: k, texto: `Texto de ${k}` } : null);
const poca = { modo: 'relax', materiales: { tronco: 7, tabla: 3 }, entradas: { pinon: { cantidad: 12 } }, cosas: {} };
const vieja = { modo: 'relax', materiales: { tronco: 989, tabla: 3 }, entradas: { pinon: { cantidad: 12 } }, cosas: {} };
const conAlforjas = { ...poca, personal: { caballo: { conAlforjas: true } } };
const desafio = { modo: 'desafio', materiales: { tronco: 989 }, entradas: {}, cosas: {} };

// 1. pocas cosas: 24 casillas, tres con cosas y el resto vacío
{
  const ocup = C.ocupacion(poca), cap = C.capacidad(poca);
  const v = P.vistaCasillas(ocup, cap, buscar);
  eq(v.celdas.length, 24, 'una celda por casilla: 24');
  eq(v.celdas.filter((c) => !c.vacia).length, ocup.usadas, 'las ocupadas son las que cuenta ocupacion');
  eq(v.celdas.filter((c) => c.vacia).length, ocup.libres, 'las vacías son las libres (y se ven)');
  const t = v.celdas.filter((c) => c.k === 'tronco');
  eq(t.map((c) => [c.n, c.max]), [[7, 10]], 'troncos: 7/10');
  eq(v.celdas.filter((c) => c.k === 'pinon').map((c) => c.n), [12], 'piñones: 12 en una pila de 50');
  ok(v.celdas[0].id === 'tronco' && v.celdas[0].nombre === 'Troncos' && v.celdas[0].icono === 'tronco', 'el nombre, el dibujo y la ranura salen de lo que se busca');
  eq(v.sobrecarga, [], 'sin sobrecarga');
  ok(v.celdas.every((c) => c.zona === 'mochila'), 'sin alforjas, todo es mochila');
  eq(P.textoContador(ocup), 'Casillas 3/24', 'el contador del panel');
  eq(P.textoHud(ocup), 'Mochila 3/24', 'el indicador del HUD');
  eq(P.estadoCarga(ocup), 'normal', 'estado normal');
  eq(P.lineaMochila(ocup), 'En la mochila: 3/24 casillas', 'la línea de los depósitos');
}

// 2. pilas partidas: 25 troncos son 3 pilas (10, 10, 5)
{
  const p = { modo: 'relax', materiales: { tronco: 25 }, entradas: {}, cosas: {} };
  const v = P.vistaCasillas(C.ocupacion(p), C.capacidad(p), buscar);
  eq(v.celdas.filter((c) => c.k === 'tronco').map((c) => [c.n, c.llena]), [[10, true], [10, true], [5, false]], 'pilas de 10, 10 y 5; las llenas se marcan');
}

// 3. llena justo: 24 casillas ocupadas
{
  const p = { modo: 'relax', materiales: { tronco: 240 }, entradas: {}, cosas: {} };
  const o = C.ocupacion(p);
  eq(o.usadas, 24, 'veinticuatro pilas de troncos');
  eq(P.estadoCarga(o), 'llena', 'llena');
  eq(P.textoHud(o), 'Mochila 24/24 · llena', 'el HUD lo dice con palabras');
  eq(P.textoContador(o), 'Casillas 24/24 · llena', 'el contador también');
  eq(P.vistaCasillas(o, C.capacidad(p), buscar).celdas.filter((c) => c.vacia).length, 0, 'ninguna vacía');
}

// 4. sobrecarga: 989 troncos
{
  const o = C.ocupacion(vieja), cap = C.capacidad(vieja);
  ok(o.usadas > o.total, 'la partida vieja pasa del límite');
  const v = P.vistaCasillas(o, cap, buscar);
  eq(v.celdas.length, 24, 'las casillas siguen siendo 24');
  eq(v.celdas.filter((c) => c.vacia).length, 0, 'todas llenas');
  const enCasillas = v.celdas.filter((c) => c.k === 'tronco').reduce((s, c) => s + c.n, 0);
  eq(enCasillas + o.sobrecarga.tronco, 989, 'lo que se ve en casillas más lo que sobra es todo: no se pierde nada');
  eq(v.sobrecarga.map((s) => [s.k, s.n, s.nombre]), [['tronco', o.sobrecarga.tronco, 'Troncos']], 'el aviso lista lo que sobra de cada cosa');
  ok(v.celdas.some((c) => c.k === 'pinon') && v.celdas.some((c) => c.k === 'tabla'), 'lo que entra se ve (no lo tapan los troncos de sobra)');
  eq(P.estadoCarga(o), 'sobrecarga', 'estado sobrecarga');
  ok(P.textoHud(o).endsWith('· sobrecarga') && P.textoContador(o).endsWith('· sobrecarga'), 'el HUD y el contador dicen «sobrecarga»');
  ok(/^Mochila 24\/24/.test(P.textoHud(o)), 'el HUD no pasa de 24/24');
  // el aviso del panel
  const caja = new El('div'); caja.className = 'aviso-sobrecarga oculto';
  P.dibujarSobrecarga(caja, v, { doc });
  ok(!caja.classList.contains('oculto'), 'el aviso se ve');
  const txt = caja.textContent;
  ok(txt.includes('Sobrecarga') && txt.includes(P.TEXTO_SOBRECARGA) && txt.includes(`Troncos: ${o.sobrecarga.tronco} de más`), 'texto: título, qué pasa y lo que sobra');
  ok(caja.todos().some((e) => e.classList.contains('ico-aviso')), 'con ícono (no es sólo color)');
  // sin sobrecarga, el aviso se esconde
  const v2 = P.vistaCasillas(C.ocupacion(poca), C.capacidad(poca), buscar);
  P.dibujarSobrecarga(caja, v2, { doc });
  ok(caja.classList.contains('oculto') && caja.hijos.length === 0, 'sin sobrecarga no hay aviso');
}

// 5. alforjas: montado suma 12 casillas, con su zona
{
  const ctx = { montado: true };
  const o = C.ocupacion(conAlforjas, ctx), cap = C.capacidad(conAlforjas, ctx);
  eq(cap.total, 36, 'montado con alforjas: 36');
  const v = P.vistaCasillas(o, cap, buscar);
  eq(v.celdas.length, 36, '36 celdas');
  eq(v.celdas.filter((c) => c.zona === 'alforjas').length, 12, 'doce son de las alforjas');
  eq(P.textoContador(o), 'Casillas 3/36', 'contador con alforjas');
  eq(P.textoDetalleCapacidad(cap, 12), '24 de la mochila + 12 de las alforjas', 'el detalle de la capacidad');
  eq(P.textoDetalleCapacidad(C.capacidad(conAlforjas), 12), '24 de la mochila. Montado con las alforjas suman 12 más', 'a pie, el detalle avisa lo que suman');
  eq(P.textoDetalleCapacidad(C.capacidad(poca), 0), '24 casillas en la mochila', 'sin alforjas');
  // las alforjas se dibujan con su título
  const cont = new El('div');
  P.dibujarCasillas(cont, v, { iconoDe: (i) => `icono:${i}`, doc });
  ok(cont.hijos.some((h) => h.classList.contains('casillas-zona') && h.textContent === 'Alforjas del caballo'), 'el título de las alforjas');
  eq(casillasDe(cont).length, 36, 'se dibujan las 36');
  ok(casillasDe(cont).filter((c) => c.classList.contains('alforja')).length === 12, 'las de las alforjas se distinguen');
  // llena de verdad con alforjas: 36 pilas
  const grande = { modo: 'relax', materiales: { tronco: 360 }, entradas: {}, cosas: {}, personal: { caballo: { conAlforjas: true } } };
  eq(P.estadoCarga(C.ocupacion(grande, ctx)), 'llena', '360 troncos llenan 36 casillas');
  eq(P.estadoCarga(C.ocupacion(grande)), 'sobrecarga', 'bajarse del caballo con eso encima deja sobrecarga (no se pierde nada)');
}

// 6. el Desafío: sin casillas (capacidad infinita: ni vista ni HUD)
{
  const o = C.ocupacion(desafio);
  ok(!Number.isFinite(o.total), 'el Desafío no tiene límite');
  const el = new El('div'); el.className = 'carga-hud';
  P.ponerCargaHud(el, null);
  ok(el.classList.contains('oculto'), 'el HUD no muestra nada sin ocupación (Desafío)');
  const main = leer('src/main.js');
  ok(/refrescarCargaHud[\s\S]{0,200}progreso\.modo === 'desafio' \? null/.test(main), 'main.js: en el Desafío no se calcula la carga');
  ok(/const conCasillas = progreso\.modo !== 'desafio'/.test(main), 'main.js: la mochila con casillas sólo en el Relax');
}

// 7. el DOM de las casillas: clic y Enter eligen, las vacías no
{
  const v = P.vistaCasillas(C.ocupacion(poca), C.capacidad(poca), (k) => (k === 'tronco' ? buscar(k) : { nombre: k, icono: null, id: null }));
  const cont = new El('div');
  const elegidos = [];
  P.dibujarCasillas(cont, v, { iconoDe: (i) => `icono:${i}`, alElegir: (id) => elegidos.push(id), enBarra: (id) => id === 'tronco', doc });
  const cs = casillasDe(cont);
  eq(cs.length, 24, 'se dibujan las 24');
  const primera = cs[0];
  eq(primera.hijos.map((h) => h.tag), ['img', 'span', 'b'], 'ícono, nombre y cuenta');
  eq(primera.hijos[2].textContent, '7/10', 'la cuenta de la pila');
  ok(primera.classList.contains('elegible') && primera.tabIndex === 0 && primera.classList.contains('enbarra'), 'con ranura: se elige con el teclado y se marca si está en la barra');
  primera.disparar('click');
  primera.disparar('keydown', { code: 'Enter' });
  primera.disparar('keydown', { code: 'Space' });
  primera.disparar('keydown', { code: 'KeyA' });
  eq(elegidos, ['tronco', 'tronco', 'tronco'], 'clic, Enter y Espacio eligen (otra tecla no)');
  ok(!cs[1].classList.contains('elegible'), 'una cosa sin ranura se ve pero no se elige');
  const vacia = cs[23];
  ok(vacia.classList.contains('vacia') && vacia.hijos.length === 0 && !vacia.classList.contains('elegible'), 'las vacías se ven y no hacen nada');
  ok(/en esta casilla/.test(primera.title) && primera.title.includes('Texto de tronco'), 'el título dice la cuenta y lo que es');
  // con alClic propio (mousedown del HUD)
  const cont2 = new El('div'); let enganchado = 0;
  P.dibujarCasillas(cont2, v, { alElegir: () => {}, alClic: () => { enganchado++; }, doc });
  ok(enganchado === 1, 'usa el alClic del HUD si se lo dan (una vez por cosa elegible)');
}

// 8. la partición de ranuras: las herramientas no ocupan lugar
{
  const o = C.ocupacion(poca);
  const ranuras = [
    { id: 'camara', nombre: 'Cámara' }, { id: 'hacha', nombre: 'Hacha' }, { id: 'ramita', nombre: 'Ramitas', cuenta: 3 },
    { id: 'tronco', nombre: 'Troncos', cuenta: 7 }, { id: 'tabla', nombre: 'Tablas', cuenta: 3 }, { id: 'pinon', nombre: 'Piñones', cuenta: 12 }, null,
  ];
  const parte = P.partirRanuras(ranuras, o);
  eq(parte.herramientas.map((r) => r.id), ['camara', 'hacha', 'ramita'], 'cámara, hacha y ramitas quedan en su sección');
  eq([...parte.porId.keys()], ['tronco', 'tabla', 'pinon'], 'lo que ocupa casillas va a la grilla');
}

// 9. el HUD: sólo se reescribe si cambia
{
  const el = new El('div'); el.className = 'carga-hud oculto';
  P.ponerCargaHud(el, C.ocupacion(poca));
  ok(!el.classList.contains('oculto') && el.textContent === 'Mochila 3/24', 'el indicador aparece');
  ok(!el.classList.contains('llena') && !el.classList.contains('sobrecarga'), 'normal: sin resalte');
  P.ponerCargaHud(el, C.ocupacion(vieja));
  ok(el.classList.contains('sobrecarga') && el.textContent.endsWith('sobrecarga'), 'con sobrecarga: resalte y palabra');
  P.ponerCargaHud(el, C.ocupacion({ modo: 'relax', materiales: { tronco: 240 }, entradas: {}, cosas: {} }));
  ok(el.classList.contains('llena') && !el.classList.contains('sobrecarga'), 'llena: resalte y sin el de sobrecarga');
}

// 10. enganchado en main.js, la plantilla y el campo de las alforjas
{
  const main = leer('src/main.js'), html = leer('src/plantilla.html'), cab = leer('src/personal-caballo.js');
  ok(main.includes("from './carga-pantalla.js'") && main.includes("from './carga.js'"), 'main.js importa el núcleo y la pantalla');
  for (const id of ['mochila-cabeza', 'mochila-contador', 'mochila-detalle', 'mochila-sobrecarga', 'mochila-casillas', 'mochila-herramientas', 'mochila-rejilla', 'carga-hud', 'aviso-llena']) ok(html.includes(`id="${id}"`), `la plantilla tiene #${id}`);
  const sis = leer('src/menus/sistema.css');
  ok(/\.mochila\.con-casillas \{ width: min\(var\(--ancho-ancho\), calc\(94vw \/ var\(--zoom\)\)\); \}/.test(sis) && /\.mochila \{ width: min\(var\(--ancho-medio\)[^}]*max-height: calc\(\(100vh - 2 \* var\(--margen-pantalla\)\) \/ var\(--zoom\)\)/.test(sis), 'el panel con casillas usa el ancho ancho del sistema y se desplaza adentro (max-height de la pantalla)');
  ok(/repeat\(8, 80px\)/.test(sis) && /\.mochila \.casilla\.llena/.test(sis) && /--acento/.test(sis.slice(sis.indexOf('4.7 pantalla'))), 'las casillas usan los tokens del sistema (nada de colores sueltos en el panel)');
  ok(!/#[0-9a-f]{3,6}\b/i.test(sis.slice(sis.indexOf('4.7 pantalla · la mochila con casillas'), sis.indexOf('4.7 pantalla · la mochila con casillas') + 6000).split('\n').filter((l) => /\.mochila/.test(l)).join('\n')), 'el panel no trae colores en hexadecimal sueltos');
  ok(/#hud \.mochila \.casilla \{ pointer-events: auto; \}/.test(html), 'las casillas aceptan el ratón en el HUD');
  ok(/@media \(prefers-reduced-motion: reduce\) \{ \.aviso-llena/.test(html), 'el cartel respeta el movimiento reducido');
  // el HUD sólo se rehace cuando cambia (al redibujar la barra y al montar), nunca en un bloque por cuadro suelto
  ok(/anotarBarraDibujada\(\);\s*\n\s*refrescarCargaHud\(\);/.test(main), 'el indicador se rehace al redibujarse la barra (cuando cambió algo)');
  ok(/if \(cargaMontadoVisto !== !!js\.montado\) refrescarCargaHud\(\);/.test(main), 'y al montar o bajar del caballo');
  ok(!/ocupacion\(/.test(main.slice(main.indexOf('function actualizarBilleteraHud'), main.indexOf('function abrirBilletera'))), 'la billetera no calcula la carga');
  // los depósitos
  ok(main.includes('lineaMochilaVigente()') && /sacar\/i\.test\(t\)/.test(main), 'al sacar de un depósito, la línea «En la mochila»');
  // las alforjas del caballo
  ok(/Con alforjas \(\+\$\{CASILLAS_ALFORJAS\} casillas montado\)/.test(cab), 'el campo «Con alforjas» dice que suma +12 casillas montado');
  eq(C.CASILLAS_ALFORJAS, 12, 'son 12');
  // el cartel «Mochila llena»
  ok(typeof P.avisoMochilaLlena === 'function', 'avisoMochilaLlena(texto) está para que el núcleo la llame');
  P.avisoMochilaLlena('Mochila llena');   // en Node no hay documento: no hace nada ni se rompe
  // el módulo es sin three; el DOM entra por parámetro
  const src = leer('src/carga-pantalla.js');
  ok(!/from 'three'/.test(src) && !src.includes('\r'), 'carga-pantalla.js: sin three y con fines de línea LF');
  ok(!/(?<!\p{L})(the|and|with|you|your|full|backpack)(?!\p{L})/iu.test(src.replace(/\/\/.*$/gm, '')), 'todo en castellano');
}

console.log(`verificar-4-7-pantalla: ${n} comprobaciones OK`);
