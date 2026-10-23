// 4.7 pantalla: lo que se ve y se maneja del límite de carga con casillas (el Relax).
// Las cuentas las hace `carga.js` (`capacidad`, `ocupacion`); acá sólo se las pone cara:
//   · vistaCasillas: de `ocupacion` a la lista de casillas del panel de la mochila (24 + 12 con alforjas),
//   · textos del contador y del HUD («Mochila 17/24»), con su estado (normal / llena / sobrecarga),
//   · dibujarCasillas: arma las casillas en el panel (sólo cuando se abre o cambia la mochila),
//   · avisoMochilaLlena(texto): el cartel «Mochila llena» del HUD (lo llama el núcleo de la carga).
// Nada de esto corre por cuadro. Sin three; el DOM entra por parámetro para poder probarlo en Node.

// ---------------------------------------------------------------- textos
export const TEXTO_SOBRECARGA = 'Llevás más de lo que entra. No podés juntar más de eso hasta bajar del límite.';

// 'normal' | 'llena' | 'sobrecarga': nunca se avisa sólo con el color (siempre hay palabra, y el ícono en la sobrecarga)
export function estadoCarga(ocup) {
  if (!ocup) return 'normal';
  if (hayCosas(ocup.sobrecarga)) return 'sobrecarga';
  return ocup.libres <= 0 ? 'llena' : 'normal';
}

function hayCosas(o) {
  if (!o) return false;
  for (const k in o) if (Object.hasOwn(o, k) && o[k] > 0) return true;
  return false;
}

// «Casillas 17/24», «Casillas 24/24 · llena», «Casillas 24/24 · sobrecarga» (el panel). Con sobrecarga, `usadas` pasa del total
// (es lo que de verdad llevás): el contador muestra lo que entra en las casillas y la palabra avisa del resto.
export function textoContador(ocup) {
  const e = estadoCarga(ocup);
  return `Casillas ${Math.min(ocup.usadas, ocup.total)}/${ocup.total}${e === 'llena' ? ' · llena' : e === 'sobrecarga' ? ' · sobrecarga' : ''}`;
}

// Qué suma cada cosa al total, para el renglón de abajo del contador
// extraAlforjas: cuántas casillas sumaría el caballo con alforjas si estuvieras montado (0 si no tenés ese recado)
export function textoDetalleCapacidad(cap, extraAlforjas = 0) {
  if (!cap) return '';
  if (cap.alforjas > 0) return `${cap.base} de la mochila + ${cap.alforjas} de las alforjas${cap.carro > 0 ? ` + ${cap.carro} del carro` : ''}`;
  if (extraAlforjas > 0) return `${cap.base} de la mochila. Montado con las alforjas suman ${extraAlforjas} más`;
  return `${cap.base} casillas en la mochila`;
}

// «Mochila 17/24», «Mochila 24/24 · llena», «Mochila 24/24 · sobrecarga» (el HUD)
export function textoHud(ocup) {
  const e = estadoCarga(ocup);
  return `Mochila ${Math.min(ocup.usadas, ocup.total)}/${ocup.total}${e === 'llena' ? ' · llena' : e === 'sobrecarga' ? ' · sobrecarga' : ''}`;
}

// «En la mochila: 17/24 casillas» (los depósitos y el panel de obra, al sacar)
export function lineaMochila(ocup) {
  return `En la mochila: ${Math.min(ocup.usadas, ocup.total)}/${ocup.total} casillas${estadoCarga(ocup) === 'sobrecarga' ? ' · sobrecarga' : ''}`;
}

// ---------------------------------------------------------------- la vista de las casillas
// ocup: { casillas: [{ k, n, pilas, max }], usadas, libres, total, sobrecarga: { k: n } }
// cap: { base, alforjas, carro, total }
// buscar(k) → { nombre, icono, id?, texto? } | null (de dónde sale el nombre y el dibujo de cada cosa)
// Devuelve:
//   celdas: una por casilla (total), en orden: { vacia, zona, k, nombre, icono, id, texto, n, max, llena }
//   sobrecarga: [{ k, nombre, icono, n }] ordenada de más a menos
export function vistaCasillas(ocup, cap, buscar) {
  const total = Math.max(0, ocup?.total | 0);
  const base = cap && Number.isFinite(cap.base) ? Math.min(cap.base, total) : total;
  const celdas = [];
  const datos = (k) => {
    const d = buscar ? buscar(k) : null;
    return { nombre: d?.nombre || String(k), icono: d?.icono || null, id: d?.id ?? null, texto: d?.texto || '' };
  };
  const sobra = ocup?.sobrecarga || {};
  for (const c of ocup?.casillas || []) {
    const d = datos(c.k);
    const max = Math.max(1, c.max | 0);
    // con sobrecarga, a las casillas sólo va lo que entra: lo que pasa del límite se muestra aparte
    let resta = Math.max(0, (c.n | 0) - (Object.hasOwn(sobra, c.k) ? sobra[c.k] | 0 : 0));
    const pilas = Math.ceil(resta / max);
    for (let i = 0; i < pilas && resta > 0 && celdas.length < total; i++) {
      const n = Math.min(max, resta);
      resta -= n;
      celdas.push({ vacia: false, zona: celdas.length < base ? 'mochila' : 'alforjas', k: c.k, nombre: d.nombre, icono: d.icono, id: d.id, texto: d.texto, n, max, llena: n >= max });
    }
  }
  while (celdas.length < total) celdas.push({ vacia: true, zona: celdas.length < base ? 'mochila' : 'alforjas', k: null, nombre: '', icono: null, id: null, texto: '', n: 0, max: 0, llena: false });
  const sobre = [];
  const s = ocup?.sobrecarga || {};
  for (const k in s) {
    if (!Object.hasOwn(s, k) || !(s[k] > 0)) continue;
    const d = datos(k);
    sobre.push({ k, nombre: d.nombre, icono: d.icono, n: s[k] });
  }
  sobre.sort((a, b) => b.n - a.n);
  return { celdas, sobrecarga: sobre };
}

// Reparte las ranuras de `armarMochila`: la cosa que `ocupacion` cuenta en casillas va a la grilla (queda en `porId`, para
// sacarle el nombre y el dibujo); lo demás (herramientas, la cámara, la caña, las ramitas…) queda en su sección de siempre.
// (`esCargable` de carga.js no alcanza: dice que sí a cualquier nombre menos las ramitas.)
export function partirRanuras(ranuras, ocup) {
  const cuentan = new Set();
  for (const c of ocup?.casillas || []) cuentan.add(c.k);
  const herramientas = [], porId = new Map();
  for (const r of ranuras || []) {
    if (!r) continue;
    if (cuentan.has(r.id)) { if (!porId.has(r.id)) porId.set(r.id, r); }
    else herramientas.push(r);
  }
  return { herramientas, porId };
}

// ---------------------------------------------------------------- el DOM del panel
// Las casillas en `cont` (se vacía y se rearma): `alElegir(id)` si la cosa tiene ranura (clic o Enter/Espacio).
// `iconoDe(nombreIcono)` da la imagen (data URL). Nada de esto va por cuadro: sólo al abrir o al cambiar la mochila.
export function dibujarCasillas(cont, vista, { iconoDe, alElegir, alClic, enBarra, doc = (typeof document !== 'undefined' ? document : null) } = {}) {
  cont.textContent = '';
  let zonaAnterior = null;
  vista.celdas.forEach((c, i) => {
    if (c.zona !== zonaAnterior) {
      if (c.zona === 'alforjas') {
        const t = doc.createElement('p');
        t.className = 'casillas-zona';
        t.textContent = 'Alforjas del caballo';
        cont.appendChild(t);
      }
      zonaAnterior = c.zona;
    }
    const d = doc.createElement('div');
    d.className = `casilla${c.vacia ? ' vacia' : ''}${c.llena ? ' llena' : ''}${c.zona === 'alforjas' ? ' alforja' : ''}`;
    if (c.vacia) {
      d.setAttribute('aria-label', 'Casilla vacía');
      cont.appendChild(d);
      return;
    }
    if (enBarra && c.id != null && enBarra(c.id)) d.classList.add('enbarra');
    d.title = `${c.nombre}: ${c.n} de ${c.max} en esta casilla${c.llena ? ' (llena)' : ''}${c.texto ? `. ${c.texto}` : ''}`;
    if (c.icono && iconoDe) {
      const img = doc.createElement('img');
      img.src = iconoDe(c.icono); img.alt = '';
      d.appendChild(img);
    }
    const nom = doc.createElement('span');
    nom.className = 'nom'; nom.textContent = c.nombre;
    const cta = doc.createElement('b');
    cta.className = 'cta'; cta.textContent = `${c.n}/${c.max}`;
    d.append(nom, cta);
    if (c.id != null && alElegir) {
      d.classList.add('elegible');
      d.tabIndex = 0;
      const elegir = () => alElegir(c.id);
      (alClic || ((el, f) => el.addEventListener('click', f)))(d, elegir);
      d.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); elegir(); } });
    }
    cont.appendChild(d);
  });
}

// El aviso de sobrecarga: ícono (no es sólo color) + texto + lo que sobra de cada cosa
export function dibujarSobrecarga(el, vista, { doc = (typeof document !== 'undefined' ? document : null) } = {}) {
  el.textContent = '';
  const hay = vista.sobrecarga.length > 0;
  el.classList.toggle('oculto', !hay);
  if (!hay) return;
  const ico = doc.createElement('i');
  ico.className = 'ico-aviso'; ico.textContent = '!'; ico.setAttribute('aria-hidden', 'true');
  const cuerpo = doc.createElement('div');
  const t = doc.createElement('b');
  t.textContent = 'Sobrecarga';
  const p = doc.createElement('p');
  p.textContent = TEXTO_SOBRECARGA;
  const ul = doc.createElement('ul');
  for (const s of vista.sobrecarga) {
    const li = doc.createElement('li');
    li.textContent = `${s.nombre}: ${s.n} de más`;
    ul.appendChild(li);
  }
  cuerpo.append(t, p, ul);
  el.append(ico, cuerpo);
}

// ---------------------------------------------------------------- el HUD
// Pone el indicador «Mochila 17/24» (sólo si cambia el texto o el estado, no por cuadro)
export function ponerCargaHud(el, ocup) {
  if (!el) return;
  if (!ocup) { el.classList.add('oculto'); return; }
  const e = estadoCarga(ocup);
  const t = textoHud(ocup);
  el.classList.remove('oculto');
  if (el.textContent !== t) el.textContent = t;
  el.classList.toggle('llena', e === 'llena');
  el.classList.toggle('sobrecarga', e === 'sobrecarga');
}

// El cartel «Mochila llena» (lo llama el núcleo de la carga cuando algo no entra): texto, ícono y unos segundos en pantalla.
// El mismo texto seguido no lo rearma (queda donde está y vuelve a empezar su tiempo).
let tAvisoLlena = 0, textoAvisoLlena = '', hastaAvisoLlena = 0;
export function avisoMochilaLlena(texto = 'Mochila llena') {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('aviso-llena');
  if (!el) return;
  const t = String(texto || 'Mochila llena');
  const ahora = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const igual = textoAvisoLlena === t && ahora < hastaAvisoLlena;
  textoAvisoLlena = t;
  hastaAvisoLlena = ahora + 2600;
  if (!igual) {
    el.textContent = '';
    const ico = document.createElement('i');
    ico.className = 'ico-aviso'; ico.textContent = '!'; ico.setAttribute('aria-hidden', 'true');
    const sp = document.createElement('span');
    sp.textContent = t;
    el.append(ico, sp);
  }
  el.classList.remove('oculto');
  el.classList.remove('dispara'); void el.offsetWidth; el.classList.add('dispara');   // reinicia la animación
  clearTimeout(tAvisoLlena);
  tAvisoLlena = setTimeout(() => { el.classList.add('oculto'); el.classList.remove('dispara'); textoAvisoLlena = ''; }, 2600);
}
