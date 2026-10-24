// 4.6: el tablón de encargos en la plaza (las reglas en tablon.js). Un tablón de madera con techito y tres papeles clavados,
// del lado de la calle de la Vía, en el frente de la plaza, del lado opuesto al cartel «Plaza de los Duendes». Poca geometría: una sola
// malla (una llamada de dibujo, sin sombra propia y con el mismo material que el puesto de la feria: ningún programa nuevo),
// porque la plaza anda al límite de 16,7 ms. E delante del tablón abre el panel (sólo teclado y ratón): los números o un clic
// toman un encargo o entregan uno tomado; E o Escape lo cierran, y se cierra solo si te alejás.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { edificioEnMundo, esVecinoAldea } from './aldea.js';
import { filasTablon, tomar, entregar, tablonDe, cuantoDe, vistaTomado, deLugar, TABLON } from './tablon.js';
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
import { formatoPesos } from './economia.js';

// En el marco de la plaza (aldea.js: 18 × 14 m, su +Z da a la calle de la Vía): el frente, del lado −X (el cartel está en +5,4),
// un poco afuera del lote, mirando a la calle, entre la vereda y la plaza.
// 4.6.0: corrido de lx −5,4 a −2,4: en −5,4 el farol del sendero de esa esquina (−4,9; 5,6) quedaba pegado detrás y de cerca su
// cabeza asomaba justo encima del techito. Ahora queda a 3,3 m del farol (que se ve al costado) y a 3,4 m del mástil; sigue
// sobre la vereda de la calle de la Vía, sin tapar el sendero de la esquina ni el cartel.
export const LUGAR_TABLON = { lx: -2.4, lz: 7 + 0.7, giro: 0 };
const CERCA = 2.6;   // a cuánto del frente se lee

export function lugarDelTablon() {
  const p = edificioEnMundo('plaza');
  if (!p) return null;
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  const x = p.x + LUGAR_TABLON.lx * c + LUGAR_TABLON.lz * s, z = p.z - LUGAR_TABLON.lx * s + LUGAR_TABLON.lz * c;
  const rot = p.rot + LUGAR_TABLON.giro;
  // el frente (donde se para el que lo lee), 1,2 m hacia la calle
  return { x, z, rot, frente: { x: x + Math.sin(rot) * 1.2, z: z + Math.cos(rot) * 1.2 }, pisoPlaza: p.y };
}

// La malla: dos postes, el tablero, el techito a dos aguas y los tres papeles clavados (mismas piezas que el cartel de la plaza)
function armarMalla() {
  const c = new Constructor();
  const madera = '#6e5036', oscura = '#4e3a28', tablero = '#8a6b4a';
  for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 2.75, 0.1), { color: oscura, tipo: 4, matriz: matriz([sx * 0.85, 2.75 / 2 - 0.5, 0]) });
  c.agregar(new THREE.BoxGeometry(1.62, 1.0, 0.05), { color: tablero, tipo: 4, matriz: matriz([0, 1.42, 0.03]) });
  // el marco y el listón de arriba (más oscuro)
  c.agregar(new THREE.BoxGeometry(1.72, 0.07, 0.08), { color: madera, tipo: 4, matriz: matriz([0, 1.95, 0.04]) });
  c.agregar(new THREE.BoxGeometry(1.72, 0.07, 0.08), { color: madera, tipo: 4, matriz: matriz([0, 0.89, 0.04]) });
  // el techito
  for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(1.95, 0.04, 0.34), { color: oscura, tipo: 4, matriz: matriz([0, 2.18, l * 0.15], [l * 0.42, 0, 0]) });
  // los papeles (con su chinche) y una libreta colgada de un clavo
  const papeles = [[-0.5, 1.47, 0.05, '#efe7d4'], [0.02, 1.4, -0.06, '#e8dcc0'], [0.52, 1.5, 0.04, '#f2ead8']];
  for (const [x, y, gz, col] of papeles) {
    c.agregar(new THREE.BoxGeometry(0.34, 0.44, 0.01), { color: col, tipo: 4, matriz: matriz([x, y, 0.062], [0, 0, gz]) });
    c.agregar(new THREE.BoxGeometry(0.03, 0.03, 0.02), { color: '#9a3c2a', tipo: 4, matriz: matriz([x, y + 0.18, 0.07]) });
    for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.24 - (i % 2) * 0.06, 0.012, 0.004), { color: '#6a6458', tipo: 4, matriz: matriz([x - 0.02, y + 0.09 - i * 0.07, 0.069], [0, 0, gz]) });
  }
  c.agregar(new THREE.BoxGeometry(0.16, 0.22, 0.03), { color: '#5a4636', tipo: 4, matriz: matriz([0.66, 1.05, 0.07]) });
  return c.geometria();
}

// `ctx`: escena, T, col, progreso(), dia(), existe(k), presente(k), estacion(), tengo(donde, k), aplicar(efectos), nota(t, sub,
// nueva), guardar(), refrescar(), sonido, alClic(el, fn), hud (el elemento #hud)
export function crearTablonMundo(ctx) {
  const lugar = lugarDelTablon();
  if (!lugar) return null;
  const T = ctx.T;
  const y = T.altura(lugar.x, lugar.z);
  const malla = new THREE.Mesh(armarMalla(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  malla.position.set(lugar.x, y, lugar.z);
  malla.rotation.y = lugar.rot;
  malla.castShadow = false;   // (chiquito: no vale una llamada más en el pase de sombras)
  malla.matrixAutoUpdate = false; malla.updateMatrix();
  malla.name = 'tablon';
  ctx.escena.add(malla);
  // frena: el tablero entre los dos postes
  const a = { x: lugar.x - Math.cos(lugar.rot) * 0.85, z: lugar.z + Math.sin(lugar.rot) * 0.85 }, b = { x: lugar.x + Math.cos(lugar.rot) * 0.85, z: lugar.z - Math.sin(lugar.rot) * 0.85 };
  ctx.col?.agregar?.({ seg: true, ax: a.x, az: a.z, bx: b.x, bz: b.z, r: 0.12, alturaMin: y - 0.5, alturaMax: y + 2.3, duenio: 'tablon' });

  // ---------------- el panel
  const panel = document.createElement('div');
  panel.className = 'trueque oculto';
  panel.id = 'tablon';
  panel.innerHTML = '<p class="quien">Tablón de encargos</p><p class="dicho" id="tablon-intro"></p><ul id="tablon-lista"></ul><p class="seguir" id="tablon-seguir"></p>';
  (ctx.hud || document.body).appendChild(panel);
  const intro = panel.querySelector('#tablon-intro'), ul = panel.querySelector('#tablon-lista'), pie = panel.querySelector('#tablon-seguir');
  let abierto = false;
  const estado = () => ctx.progreso().genteCampo.tablon;
  // (el que firma: un vecino de siempre o un poblador que ya llegó a la aldea; si no, el respaldo del encargo)
  const presente = ctx.presente || ((k) => esVecinoAldea(k) || !!ctx.progreso().aldea?.pobladores?.some?.((x) => x?.clave === k));
  const ctxReglas = () => ({ existe: ctx.existe, presente, estacion: ctx.estacion?.() });
  let filas = [];

  function dibujar() {
    const t = estado(), dia = ctx.dia();
    filas = filasTablon(t, dia, ctxReglas(), ctx.tengo);
    const hoy = t.entregas.dia === dia ? t.entregas.n : 0;
    intro.textContent = `Pagan más cuanto más lejos queda lo que piden. Plazo: ${TABLON.plazo} días. Una entrega por día${hoy >= TABLON.entregasPorDia ? ' (la de hoy ya la hiciste)' : ''}.`;
    ul.innerHTML = '';
    if (!filas.length) {
      const li = document.createElement('li'); li.className = 'falta';
      li.textContent = 'Hoy no hay papeles nuevos. Mañana se renueva.';
      ul.appendChild(li);
    }
    filas.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = f.puede ? '' : 'falta';
      const tit = document.createElement('b'); tit.textContent = `${i + 1}. ${f.tipo === 'entregar' ? '' : 'Tomar: '}${f.titulo}`;
      const det = document.createElement('span'); det.textContent = ` — ${f.detalle}`;
      const marca = document.createElement('i'); marca.textContent = f.estado;
      li.append(tit, det, marca);
      ctx.alClic?.(li, () => elegir(i));
      ul.appendChild(li);
    });
    // 4.10.2: sin papeles no hay números que apretar; y la E es la del jugador
    const propio = ctx.textoPropio || ((x) => x);
    pie.textContent = filas.length ? propio(`1 a ${Math.min(9, filas.length)} o un clic para tomar o entregar · E o Escape para salir`) : propio('E o Escape para salir');
  }
  function abrir() {
    if (abierto) return;
    abierto = true;
    panel.classList.remove('oculto');
    dibujar();
  }
  function cerrar() { if (!abierto) return; abierto = false; panel.classList.add('oculto'); }
  function elegir(i) {
    const f = filas[i];
    if (!f) return;
    const t = estado(), dia = ctx.dia();
    if (f.tipo === 'tomar') {
      const r = tomar(t, f.id, dia, ctxReglas());
      if (!r.ok) { ctx.nota?.(r.motivo === 'lleno' ? 'Ya tenés dos encargos tomados' : 'Ese papel ya no está', r.motivo === 'lleno' ? 'Entregá uno antes de tomar otro' : ''); dibujar(); return; }
      const e = r.encargo;
      ctx.sonido?.anotar?.();
      ctx.nota?.(`Encargo: ${cuantoDe(e.n, e.k)}`, `${cap(deLugar(e.lugar))}, para ${e.firma}. Pagan ${formatoPesos(e.pago)}; hasta mañana`, true);
      ctx.guardar?.();
    } else {
      const r = entregar(ctx.progreso(), t, f.id, dia, ctx.tengo);
      if (!r.ok) {
        const x = r.tomado ? vistaTomado(r.tomado) : null;
        if (r.motivo === 'cupo') ctx.nota?.('Hoy ya entregaste uno', 'El tablón recibe una entrega por día: volvé mañana');
        else if (r.motivo === 'falta' && x) ctx.nota?.(`Te faltan ${cuantoDe(x.n - (Number(ctx.tengo(x.donde, x.k)) || 0), x.k)}`, `Salen ${deLugar(x.lugar)}`);
        dibujar();
        return;
      }
      ctx.aplicar?.(r.efectos);
      ctx.sonido?.juntar?.();
      ctx.nota?.(`Encargo entregado: ${formatoPesos(r.pago)}`, `${cuantoDe(r.tomado.n, r.tomado.k)} para ${vistaTomado(r.tomado).firma}`, true);
      ctx.refrescar?.();
      ctx.guardar?.();
    }
    dibujar();
  }
  // Las teclas con el panel abierto: los números eligen; E y Escape cierran. Devuelve si la tecla fue suya
  function tecla(codigo) {
    if (!abierto) return false;
    const n = /^(?:Digit|Numpad)([1-9])$/.exec(codigo);
    if (n) { elegir(Number(n[1]) - 1); return true; }
    if (codigo === 'KeyE' || codigo === 'Escape') { cerrar(); return true; }
    return false;
  }
  const cerca = (js) => !!js && Math.hypot(js.pos.x - lugar.frente.x, js.pos.z - lugar.frente.z) < CERCA && Math.abs(js.pos.y - y) < 3;
  // Lo que ofrece el aviso y hace la E (el mismo objeto: main.js lo usa en los dos lugares)
  function accion(js) {
    if (abierto || !cerca(js)) return null;
    const t = estado();
    const n = t.tomados.length;
    return { texto: n ? `Leer el tablón de encargos (${n === 1 ? 'uno tomado' : `${n} tomados`})` : 'Leer el tablón de encargos', hacer: abrir };
  }
  // Cada cuadro (barato: una distancia): cierra el panel si te alejás; al cambiar el día, avisa lo vencido
  let diaVisto = 0;
  function actualizar(js) {
    if (abierto && !cerca(js)) cerrar();
    const dia = ctx.dia();
    if (dia !== diaVisto) {
      diaVisto = dia;
      const vencidos = tablonDe(estado(), dia);
      if (vencidos.length) ctx.nota?.(vencidos.length === 1 ? 'Se venció un encargo del tablón' : `Se vencieron ${vencidos.length} encargos del tablón`, 'No pasa nada: mañana hay papeles nuevos');
      if (abierto) dibujar();
    }
  }
  return { malla, lugar: { ...lugar, y }, abrir, cerrar, abierto: () => abierto, elegir, tecla, accion, actualizar, dibujar };
}
