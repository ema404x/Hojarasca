// 2.8: "Tu cuaderno": el color de la tapa, el elástico, y lo que le pegás encima:
// sellos dibujados a mano, notas escritas y fotos de tus desafíos, donde vos quieras.
// Módulo puro (se prueba en Node): el DOM se toca sólo al llamar a `construir` o
// `aplicar`, en el juego. El cuaderno de siempre (lo arma `dibujarCuaderno`) no se
// toca: la tapa es un borde del libro y los adornos van en una capa encima, que no
// ataja los clics.
import { registrarSeccion, color, texto, numero } from './personalizacion.js';
import { campoColores, campoSi, subtitulo, nota, fila, enLinea, boton, lista as listaDesplegable, CUEROS, TINTAS } from './personal-campos.js';

// Dibujos de 48×48, a pluma (sólo trazos)
export const SELLOS = [
  { id: 'pehuen', nombre: 'Pehuén', d: 'M24 44V10M24 14c-6 0-10 3-13 7M24 14c6 0 10 3 13 7M24 22c-7 0-12 3-15 8M24 22c7 0 12 3 15 8M24 30c-6 0-10 2-12 6M24 30c6 0 10 2 12 6M20 44h8' },
  { id: 'hoja', nombre: 'Hoja de lenga', d: 'M10 38C8 22 20 10 38 10C38 28 26 40 10 38ZM10 38L30 18M17 31l-3-7M22 26l-2-8M27 21l-1-6M17 31l7 1M22 26l8 1M27 21l7 0' },
  { id: 'montana', nombre: 'Cerros', d: 'M4 40L18 16L26 28L32 20L44 40ZM14 23l4 3l3-4M29 25l3-2l3 3' },
  { id: 'trochita', nombre: 'La trochita', d: 'M6 32h30v-10H22v-8h-6v8H6ZM30 22v-8h6v8M9 14h4v8M4 36h36M12 36a3 3 0 1 0 0.1 0M24 36a3 3 0 1 0 0.1 0M34 36a3 3 0 1 0 0.1 0M38 32l4 4' },
  { id: 'huella', nombre: 'Huella de perro', d: 'M24 40c-7 0-10-4-8-8s5-6 8-6s6 2 8 6s-1 8-8 8ZM13 24a3 4 0 1 0 0.1 0M20 16a3 4 0 1 0 0.1 0M28 16a3 4 0 1 0 0.1 0M35 24a3 4 0 1 0 0.1 0' },
  { id: 'pluma', nombre: 'Pluma', d: 'M12 42L34 8M34 8C40 18 34 30 22 34C18 28 24 14 34 8ZM26 22l-6-2M24 27l-6-1M29 17l-5-3' },
  { id: 'luna', nombre: 'Luna', d: 'M30 8a16 16 0 1 0 10 26a13 13 0 1 1 -10 -26Z' },
  { id: 'estrella', nombre: 'Estrella', d: 'M24 6l5 12l13 1l-10 8l3 13l-11-7l-11 7l3-13l-10-8l13-1Z' },
  { id: 'trucha', nombre: 'Trucha', d: 'M6 24c8-10 24-10 32 0c-8 10-24 10-32 0ZM38 24l6-6v12ZM14 23a1 1 0 1 0 0.1 0M20 22l2 2l2-2l2 2l2-2' },
  { id: 'amancay', nombre: 'Amancay', d: 'M24 24l-6-12c6-2 10 2 6 12l6-12c6 2 6 8-6 12l12-2c2 6-4 10-12 2l6 10c-6 4-10-2-6-10l-6 10c-6-4-4-10 6-10l-12-2c0-6 6-8 12 2ZM24 24v20' },
];
export const SELLO = Object.fromEntries(SELLOS.map((s) => [s.id, s]));
export const MAX_ADORNOS = 12;
const TIPOS = ['sello', 'nota', 'foto'];

export function cuadernoPorDefecto() {
  return { tapa: '#5a3b24', conElastico: true, elastico: '#2a2723', tinta: '#5a4524', adornos: [] };
}

function sanearAdorno(a) {
  if (!a || typeof a !== 'object' || !TIPOS.includes(a.tipo)) return null;
  let ref = null;
  if (a.tipo === 'sello') ref = typeof a.ref === 'string' && Object.hasOwn(SELLO, a.ref) ? a.ref : null;
  else if (a.tipo === 'nota') ref = texto(a.ref, '', 60) || null;
  else ref = typeof a.ref === 'string' && /^[a-z0-9-]{1,40}$/i.test(a.ref) ? a.ref : null;
  if (!ref) return null;
  return {
    tipo: a.tipo, ref,
    x: Math.round(numero(Number(a.x), 50, 2, 98) * 10) / 10,
    y: Math.round(numero(Number(a.y), 50, 2, 98) * 10) / 10,
    giro: Math.round(numero(Number(a.giro), 0, -30, 30)),
  };
}

export function sanearCuaderno(d) {
  const b = cuadernoPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    tapa: color(v.tapa, b.tapa),
    conElastico: v.conElastico !== false,
    elastico: color(v.elastico, b.elastico),
    tinta: color(v.tinta, b.tinta),
    adornos: (Array.isArray(v.adornos) ? v.adornos : []).map(sanearAdorno).filter(Boolean).slice(0, MAX_ADORNOS),
  };
}

// ---------------------------------------------------------------- dibujar
const SVG = 'http://www.w3.org/2000/svg';
function nodoSello(doc, sello, tinta, tam) {
  const svg = doc.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('width', String(tam)); svg.setAttribute('height', String(tam));
  const p = doc.createElementNS(SVG, 'path');
  p.setAttribute('d', sello.d);
  p.setAttribute('fill', 'none'); p.setAttribute('stroke', tinta);
  p.setAttribute('stroke-width', '2.2'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(p);
  return svg;
}
// Un adorno, listo para poner en la capa (`escala` 1 en el cuaderno, menos en la vista)
export function nodoAdorno(doc, a, datos, progreso, escala = 1) {
  const n = doc.createElement('div');
  n.className = `personal-adorno personal-adorno-${a.tipo}`;
  n.style.cssText = `position:absolute;left:${a.x}%;top:${a.y}%;transform:translate(-50%,-50%) rotate(${a.giro}deg);`;
  if (a.tipo === 'sello') {
    n.style.opacity = '0.82';
    n.appendChild(nodoSello(doc, SELLO[a.ref], datos.tinta, Math.round(64 * escala)));
  } else if (a.tipo === 'nota') {
    n.textContent = a.ref;
    n.setAttribute('translate', 'no');
    n.style.cssText += `font-family:'Caveat',cursive;font-weight:600;font-size:${Math.round(25 * escala)}px;line-height:1.05;color:${datos.tinta};`
      + `background:rgba(250,240,200,.92);padding:${Math.round(6 * escala)}px ${Math.round(10 * escala)}px;max-width:${Math.round(210 * escala)}px;`
      + 'box-shadow:0 2px 6px rgba(0,0,0,.25);white-space:pre-wrap;word-break:break-word';
  } else {
    const img = progreso?.desafios?.[a.ref]?.img;
    const ancho = Math.round(140 * escala);
    n.style.cssText += `background:#f4efe4;padding:${Math.max(2, Math.round(6 * escala))}px;box-shadow:0 3px 8px rgba(0,0,0,.3)`;
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      const im = doc.createElement('img');
      im.src = img; im.alt = '';
      im.style.cssText = `display:block;width:${ancho}px;height:auto`;
      n.appendChild(im);
    } else {
      // la foto ya no está (otra partida, se borró): queda el marco vacío
      const hueco = doc.createElement('div');
      hueco.style.cssText = `width:${ancho}px;height:${Math.round(ancho * 0.72)}px;background:rgba(90,69,36,.15)`;
      n.appendChild(hueco);
    }
    // la cinta que la sostiene
    const cinta = doc.createElement('div');
    cinta.style.cssText = `position:absolute;left:50%;top:${-Math.round(8 * escala)}px;width:${Math.round(56 * escala)}px;height:${Math.round(16 * escala)}px;`
      + 'transform:translateX(-50%) rotate(-4deg);background:rgba(235,225,190,.75);box-shadow:0 1px 2px rgba(0,0,0,.15)';
    n.appendChild(cinta);
  }
  return n;
}

// Las fotos que se pueden pegar: las de los desafíos que tienen imagen
export function fotosParaPegar(progreso) {
  const d = progreso?.desafios;
  if (!d || typeof d !== 'object') return [];
  return Object.keys(d).filter((k) => /^[a-z0-9-]{1,40}$/i.test(k) && typeof d[k]?.img === 'string' && d[k].img.startsWith('data:image/'));
}
const nombreFoto = (id) => id.replace(/^f-/, '').replace(/-/g, ' ');

// Lleva la tapa y los adornos al cuaderno de verdad (#cuaderno .cuaderno)
export function aplicarAlCuaderno(doc, datos, progreso) {
  const libro = doc?.querySelector?.('#cuaderno .cuaderno');
  if (!libro) return null;
  libro.style.boxShadow = `0 0 0 12px ${datos.tapa}, 0 0 0 13px rgba(0,0,0,.35), 0 30px 80px rgba(0,0,0,.55)`;
  let capa = libro.querySelector(':scope > .personal-adornos');
  if (!capa) {
    capa = doc.createElement('div');
    capa.className = 'personal-adornos';
    capa.setAttribute('aria-hidden', 'true');
    capa.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;overflow:visible';
    libro.appendChild(capa);
  }
  capa.textContent = '';
  if (datos.conElastico) {
    const el = doc.createElement('div');
    el.className = 'personal-elastico';
    el.style.cssText = `position:absolute;top:-12px;bottom:-12px;right:16px;width:11px;background:${datos.elastico};box-shadow:1px 0 3px rgba(0,0,0,.35);opacity:.92`;
    capa.appendChild(el);
  }
  for (const a of datos.adornos) capa.appendChild(nodoAdorno(doc, a, datos, progreso, 1));
  return capa;
}

// ---------------------------------------------------------------- el panel
export const SECCION_CUADERNO = registrarSeccion({
  id: 'cuaderno',
  titulo: 'Tu cuaderno',
  orden: 80,
  porDefecto: cuadernoPorDefecto,
  sanear: sanearCuaderno,
  construir(cont, api) {
    const doc = cont.ownerDocument || document;
    let d = sanearCuaderno(api.datos);
    // (se lleva la cuenta acá: `api.datos` puede ser la foto de cuando se abrió el panel)
    const cambiar = (parcial) => { d = sanearCuaderno({ ...d, ...parcial }); api.cambiar(parcial); };
    campoColores(cont, 'Tapa', [...CUEROS, { id: '#2f5a74', nombre: 'azul lago' }, { id: '#4f6b2a', nombre: 'verde lenga' }], d.tapa, (v) => cambiar({ tapa: v }));
    campoSi(cont, 'Con elástico', d.conElastico, (v) => cambiar({ conElastico: v }));
    campoColores(cont, 'Elástico', TINTAS, d.elastico, (v) => cambiar({ elastico: v, conElastico: true }));
    campoColores(cont, 'Tinta', [{ id: '#5a4524', nombre: 'sepia' }, { id: '#2a2723', nombre: 'negra' }, { id: '#2f4a74', nombre: 'azul' }, { id: '#7c2f22', nombre: 'roja' }, { id: '#3f5a2a', nombre: 'verde' }], d.tinta, (v) => { cambiar({ tinta: v }); dibujarVista(); });

    subtitulo(cont, 'Lo que le pegaste');
    nota(cont, 'Arrastralo en el dibujo del cuaderno para ponerlo donde quieras.');
    // la vista: las dos páginas abiertas, en chico
    const vista = doc.createElement('div');
    vista.className = 'personal-vista-cuaderno';
    vista.style.cssText = 'position:relative;width:100%;max-width:520px;aspect-ratio:1180/760;background:#efe4cc;border-radius:4px;'
      + 'box-shadow:0 0 0 6px var(--tapa-vista,#5a3b24),0 6px 18px rgba(0,0,0,.35);margin:10px 6px 14px;overflow:hidden;touch-action:none;user-select:none';
    cont.appendChild(vista);
    const lista = doc.createElement('div');
    lista.className = 'personal-lista-adornos';
    cont.appendChild(lista);

    const guardarAdornos = () => cambiar({ adornos: d.adornos.map((a) => ({ ...a })) });
    function dibujarVista() {
      vista.style.setProperty('--tapa-vista', d.tapa);
      vista.textContent = '';
      const lomo = doc.createElement('div');
      lomo.style.cssText = 'position:absolute;left:50%;top:0;bottom:0;width:10px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(60,40,15,.25),transparent)';
      vista.appendChild(lomo);
      d.adornos.forEach((a, i) => {
        const n = nodoAdorno(doc, a, d, api.progreso, 0.42);
        n.style.cursor = 'grab';
        n.style.touchAction = 'none';
        n.addEventListener('pointerdown', (ev) => {
          ev.preventDefault();
          try { n.setPointerCapture(ev.pointerId); } catch {}
          const caja = vista.getBoundingClientRect();
          const mover = (e2) => {
            a.x = Math.max(2, Math.min(98, ((e2.clientX - caja.left) / caja.width) * 100));
            a.y = Math.max(2, Math.min(98, ((e2.clientY - caja.top) / caja.height) * 100));
            n.style.left = `${a.x}%`; n.style.top = `${a.y}%`;
          };
          const soltar = () => { n.removeEventListener('pointermove', mover); n.removeEventListener('pointerup', soltar); n.removeEventListener('pointercancel', soltar); d.adornos[i] = a; guardarAdornos(); };
          n.addEventListener('pointermove', mover);
          n.addEventListener('pointerup', soltar);
          n.addEventListener('pointercancel', soltar);
        });
        vista.appendChild(n);
      });
      dibujarLista();
    }
    function dibujarLista() {
      lista.textContent = '';
      d.adornos.forEach((a, i) => {
        const f = enLinea(fila(lista, a.tipo === 'sello' ? `Sello: ${SELLO[a.ref].nombre}` : a.tipo === 'nota' ? `Nota: ${a.ref}` : `Foto: ${nombreFoto(a.ref)}`));
        boton(f, 'Girar', () => { a.giro = a.giro >= 24 ? -24 : a.giro + 8; guardarAdornos(); dibujarVista(); });
        boton(f, 'Quitar', () => { d.adornos.splice(i, 1); guardarAdornos(); dibujarVista(); });
      });
    }
    const sumar = (a) => {
      if (d.adornos.length >= MAX_ADORNOS) return;
      const k = d.adornos.length;
      d.adornos.push({ ...a, x: 30 + (k % 4) * 13, y: 30 + Math.floor(k / 4) * 18, giro: ((k * 7) % 17) - 8 });
      guardarAdornos();
      dibujarVista();
    };

    // sumar un sello, una nota o una foto
    const fSello = enLinea(fila(cont, 'Sello'));
    const elegirSello = listaDesplegable(doc);
    for (const s of SELLOS) { const o = doc.createElement('option'); o.value = s.id; o.textContent = s.nombre; elegirSello.appendChild(o); }
    fSello.appendChild(elegirSello);
    boton(fSello, 'Pegar', () => sumar({ tipo: 'sello', ref: elegirSello.value }));

    const fNota = enLinea(fila(cont, 'Nota'));
    const escribir = doc.createElement('input');
    escribir.type = 'text'; escribir.className = 'personal-texto'; escribir.maxLength = 60; escribir.placeholder = 'algo para acordarte';
    escribir.addEventListener('keydown', (e) => e.stopPropagation());
    escribir.addEventListener('keyup', (e) => e.stopPropagation());
    fNota.appendChild(escribir);
    boton(fNota, 'Escribir', () => { const t = texto(escribir.value, '', 60); if (t) { sumar({ tipo: 'nota', ref: t }); escribir.value = ''; } });

    const fotos = fotosParaPegar(api.progreso);
    if (fotos.length) {
      const fFoto = enLinea(fila(cont, 'Foto'));
      const elegirFoto = listaDesplegable(doc);
      for (const id of fotos) { const o = doc.createElement('option'); o.value = id; o.textContent = nombreFoto(id); elegirFoto.appendChild(o); }
      fFoto.appendChild(elegirFoto);
      boton(fFoto, 'Pegar', () => sumar({ tipo: 'foto', ref: elegirFoto.value }));
    } else {
      nota(cont, 'Cuando tengas fotos de los desafíos, también se pueden pegar.');
    }
    dibujarVista();
  },
  aplicar(datos, api) {
    if (typeof document === 'undefined') return;
    aplicarAlCuaderno(document, sanearCuaderno(datos), api?.progreso);
  },
});
