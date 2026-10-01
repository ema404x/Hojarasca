// El estado de la base: qué defensas tenés, cuáles están rotas y qué conviene hacer
// antes de que caiga la noche. Módulo puro (se prueba en Node): recibe datos, devuelve HTML.


const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const CATEGORIAS_BASE = [
  { clave: 'muro', nombre: 'Murallas', ids: ['empalizada', 'empalizada-reforzada', 'muro-piedra', 'muro-almenado', 'porton-empalizada', 'porton-reforzado'] },
  { clave: 'trampa', nombre: 'Trampas', ids: ['estacas', 'foso-estacas', 'red-cristal', 'barril-resina'] },
  { clave: 'arma', nombre: 'Armas fijas', ids: ['ballesta-fija', 'faro-plasma', 'escudo-energia', 'baliza-sanacion'] },
  { clave: 'apoyo', nombre: 'Apoyo', ids: ['antorcha', 'campana', 'torre-vigia', 'pozo', 'acopio', 'banco-trabajo'] },
];

export function categoriaDe(id) {
  for (const c of CATEGORIAS_BASE) if (c.ids.includes(id)) return c.clave;
  return 'apoyo';
}

// Resume cada pieza: nombre, salud en porcentaje y a qué grupo pertenece.
export function resumirBase(piezas = []) {
  const filas = [];
  let total = 0, dañadas = 0, salud = 0;
  for (const p of piezas) {
    const max = Math.max(1, Number(p.max) || 1);
    const vida = Math.max(0, Math.min(max, Number(p.vida ?? max)));
    const pct = Math.round((vida / max) * 100);
    filas.push({ id: p.id, nombre: p.nombre || p.id, pct, dist: Number(p.dist) || 0, cat: categoriaDe(p.id) });
    total++;
    salud += pct;
    if (pct < 100) dañadas++;
  }
  filas.sort((a, b) => a.pct - b.pct || a.dist - b.dist);
  return { filas, total, dañadas, saludMedia: total ? Math.round(salud / total) : 0 };
}

export function consejoBase(resumen, { noche = 1, cristales = 0 } = {}) {
  if (!resumen.total) return 'Todavía no levantaste ninguna defensa. Empezá por dos tramos de empalizada y un portón (O → Defensa).';
  const rota = resumen.filas.find((f) => f.pct < 50);
  if (rota) return `${rota.nombre} está en ${rota.pct}%: reparala con el martillo o desde el taller (K → Base) antes de que caiga la noche.`;
  if (resumen.dañadas) return `Hay ${resumen.dañadas} ${resumen.dañadas === 1 ? 'pieza golpeada' : 'piezas golpeadas'}. Con el martillo en la mano se reparan tocándolas.`;
  const trampas = resumen.filas.filter((f) => f.cat === 'trampa').length;
  if (!trampas) return 'Todo entero. Te faltan trampas: un foso con estacas delante del portón hace mucho daño sin que tengas que estar ahí.';
  if (noche >= 5 && cristales >= 4) return 'Todo entero. Con los cristales que tenés podés reforzar un muro o sumar una defensa de energía.';
  return 'La base está entera. Buen momento para juntar material o cazar cristales.';
}

export function htmlBase(resumen, extra = {}) {
  if (!resumen.total) return `<p class="base-vacia">${esc(consejoBase(resumen, extra))}</p>`;
  const grupos = CATEGORIAS_BASE.map((c) => {
    const filas = resumen.filas.filter((f) => f.cat === c.clave);
    if (!filas.length) return '';
    const items = filas.map((f) => `<div class="base-pieza${f.pct < 50 ? ' rota' : f.pct < 100 ? ' tocada' : ''}">
      <span>${esc(f.nombre)}</span>
      <i style="--pct:${f.pct}%"></i>
      <b>${f.pct}%</b>
      <small>${Math.round(f.dist)} m</small>
    </div>`).join('');
    return `<h3>${esc(c.nombre)} · ${filas.length}</h3><div class="base-grupo">${items}</div>`;
  }).join('');
  const cabeza = `<p class="base-resumen">${resumen.total} ${resumen.total === 1 ? 'pieza' : 'piezas'} · salud media ${resumen.saludMedia}%${resumen.dañadas ? ` · ${resumen.dañadas} para reparar` : ' · todo entero'}</p>`;
  return `${cabeza}<p class="base-consejo">${esc(consejoBase(resumen, extra))}</p>${grupos}`;
}

export const CSS_BASE = `
#base .panel-modal { max-width: 620px; width: calc(100vw - 32px); max-height: calc(100vh - 48px); overflow: auto; }
#base h3 { margin: 14px 0 6px; font-size: 15px; opacity: .8; }
.base-resumen { margin: 6px 0 2px; font-size: 15px; }
.base-consejo { margin: 0 0 6px; font-size: 14px; opacity: .85; }
.base-vacia { font-size: 15px; opacity: .85; }
.base-grupo { display: grid; gap: 4px; }
.base-pieza { display: grid; grid-template-columns: 1fr 90px 44px 52px; align-items: center; gap: 8px; font-size: 14px; }
.base-pieza i { display: block; height: 7px; border-radius: 99px; background: rgba(255,255,255,.14); position: relative; }
.base-pieza i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--pct); border-radius: 99px; background: var(--salud, #a6ff6e); }
.base-pieza.tocada i::after { background: var(--aviso-color, #e0b12a); }
.base-pieza.rota i::after { background: var(--peligro, #ff5a3d); }
.base-pieza b { font-variant-numeric: tabular-nums; font-weight: 600; }
.base-pieza small { opacity: .55; text-align: right; }
`;
