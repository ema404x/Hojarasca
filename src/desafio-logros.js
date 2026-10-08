// Modo Desafío: logros y récords por dificultad.
// Lógica pura (sin Three.js) + un ayudante para dibujar la libreta de logros en el DOM.
// Corre igual en Node (pruebas) y en el navegador; el almacenamiento es inyectable.

export const DIFICULTADES_LOGROS = ['tranquila', 'normal', 'implacable'];

// Umbrales, a mano para las pruebas y para ajustar el balance.
export const UMBRALES_LOGROS = {
  soloLanza: 3,        // invasores abatidos, todos con la lanza
  inexpugnable: 5,     // invasores en la noche sin perder ninguna obra
  cazador: 100,        // abatidos en total
  superviviente: 10,   // noches resistidas
  implacable: 5,       // noche a resistir en dificultad implacable
  companeros: 2,       // compañeros viviendo en la base
  perro: 10,           // invasores que el perro abatió o ayudó a abatir
  arquitecto: 20,      // defensas en pie a la vez
  planos: 3,           // planos recuperados de restos de naves
  inmortal: 5,         // noches seguidas sin caer
};

export const LOGROS = [
  { id: 'primera-noche', nombre: 'Primer alba', texto: 'Resistí tu primera noche de duendes y viste clarear sobre los coihues.' },
  { id: 'sin-rasguno', nombre: 'Piel de lenga', texto: 'Resistí una noche entera sin recibir un solo golpe.' },
  { id: 'solo-lanza', nombre: 'Punta de piedra', texto: 'Resistí una noche abatiendo al menos 3 duendes, todos con la lanza de coihue.' },
  { id: 'inexpugnable', nombre: 'Pirca que no cede', texto: 'Resistí una noche de 5 duendes o más sin perder ninguna obra.' },
  { id: 'cazador', nombre: 'Baqueano de la noche', texto: 'Abatí 100 duendes en total.' },
  { id: 'artesano', nombre: 'Manos de artesano', texto: 'Fabricá cada una de las recetas al menos una vez.' },
  { id: 'pistolero', nombre: 'Fuego ajeno', texto: 'Encontrá la pistola de luz en el cofre de los duendes.', oculto: true },
  { id: 'superviviente', nombre: 'Diez inviernos', texto: 'Resistí 10 noches de duendes.' },
  { id: 'implacable', nombre: 'Viento blanco', texto: 'Llegá al alba de la quinta noche en dificultad implacable.' },
  { id: 'vencedor', nombre: 'Monte quieto', texto: 'Volteá al Coihue Viejo y devolvele el silencio al valle.', oculto: true },
  { id: 'buena-compania', nombre: 'Fogón compartido', texto: 'Tené dos compañeros viviendo en la base.' },
  { id: 'fiel', nombre: 'Compañero de cuatro patas', texto: 'Tu perro abatió o ayudó a abatir 10 duendes.' },
  { id: 'arquitecto', nombre: 'Pueblo de troncos', texto: 'Tené 20 defensas en pie al mismo tiempo.' },
  { id: 'noche-roja', nombre: 'Luna de sangre', texto: 'Resistí una noche roja.', oculto: true },
  { id: 'eclipse', nombre: 'Sombra sobre el lago', texto: 'Resistí una noche de eclipse.', oculto: true },
  { id: 'noche-callada', nombre: 'Ni un chucao', texto: 'Resistí una noche silenciosa, cuando ni los pájaros avisan.', oculto: true },
  { id: 'explorador', nombre: 'Rastro de aserrín', texto: 'Recuperá 3 planos de los troncos huecos de los duendes.' },
  { id: 'inmortal', nombre: 'Raíz de ciprés', texto: 'Resistí 5 noches seguidas sin caer.' },
];

const IDS = new Set(LOGROS.map((l) => l.id));

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const lista = (v) => (Array.isArray(v) ? v : []);

// ---------------------------------------------------------------- evaluación
// Logros que dependen sólo del estado acumulado (se pueden revisar de día).
export function evaluarEstado(total) {
  const t = total && typeof total === 'object' ? total : {};
  const U = UMBRALES_LOGROS;
  const ids = [];
  if (num(t.abatidos) >= U.cazador) ids.push('cazador');
  const totales = lista(t.recetasTotales);
  const hechas = new Set(lista(t.recetasHechas));
  if (totales.length > 0 && totales.every((r) => hechas.has(r))) ids.push('artesano');
  if (t.pistolaEncontrada === true) ids.push('pistolero');
  if (num(t.noches) >= U.superviviente) ids.push('superviviente');
  if (t.victoria === true) ids.push('vencedor');
  if (num(t.companeros) >= U.companeros) ids.push('buena-compania');
  if (num(t.abatidosPerro) >= U.perro) ids.push('fiel');
  if (num(t.defensas) >= U.arquitecto) ids.push('arquitecto');
  if (num(t.planos) >= U.planos) ids.push('explorador');
  if (num(t.racha) >= U.inmortal) ids.push('inmortal');
  return ids;
}

// Logros ganados al amanecer de una noche. Incluye también los del estado
// acumulado (sin repetir), así una sola llamada alcanza al cerrar la noche.
export function evaluarNoche(resumen, total) {
  const r = resumen && typeof resumen === 'object' ? resumen : {};
  const U = UMBRALES_LOGROS;
  const ids = [];
  if (r.sobrevivida === true) {
    ids.push('primera-noche');
    if (num(r.danoRecibido) <= 0) ids.push('sin-rasguno');
    const abatidos = num(r.abatidos), lanza = num(r.abatidosLanza), otros = num(r.abatidosOtros);
    if (abatidos >= U.soloLanza && lanza >= abatidos && otros === 0) ids.push('solo-lanza');
    if (num(r.invasores) >= U.inexpugnable && num(r.obrasPerdidas) === 0) ids.push('inexpugnable');
    if (r.especial === 'roja') ids.push('noche-roja');
    if (r.especial === 'eclipse') ids.push('eclipse');
    if (r.especial === 'silenciosa') ids.push('noche-callada');
    if (r.dificultad === 'implacable' && num(r.noche) >= U.implacable) ids.push('implacable');
  }
  for (const id of evaluarEstado(total)) if (!ids.includes(id)) ids.push(id);
  return ids;
}

// ---------------------------------------------------------------- persistencia
function recordVacio() { return { noches: 0, racha: 0, abatidos: 0, victorias: 0 }; }
function recordsVacios() {
  const r = {};
  for (const d of DIFICULTADES_LOGROS) r[d] = recordVacio();
  return r;
}
const entero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(1e9, Math.floor(n)) : 0;
};

export function sanearLogros(dato) {
  const x = dato && typeof dato === 'object' && !Array.isArray(dato) ? dato : {};
  const logros = {};
  if (x.logros && typeof x.logros === 'object' && !Array.isArray(x.logros)) {
    for (const [id, fecha] of Object.entries(x.logros)) {
      if (!IDS.has(id) || typeof fecha !== 'string' || !Number.isFinite(Date.parse(fecha))) continue;
      logros[id] = fecha;
    }
  }
  const records = recordsVacios();
  if (x.records && typeof x.records === 'object' && !Array.isArray(x.records)) {
    for (const d of DIFICULTADES_LOGROS) {
      const r = x.records[d];
      if (!r || typeof r !== 'object') continue;
      records[d] = { noches: entero(r.noches), racha: entero(r.racha), abatidos: entero(r.abatidos), victorias: entero(r.victorias) };
    }
  }
  return { version: 1, logros, records };
}

export function crearLogros(almacen = (typeof localStorage !== 'undefined' ? localStorage : null), clave = 'hojarasca-logros-v1') {
  let datos;
  try {
    const crudo = almacen ? almacen.getItem(clave) : null;
    datos = sanearLogros(crudo ? JSON.parse(crudo) : null);
  } catch {
    datos = sanearLogros(null);
  }
  const guardar = () => {
    try { if (almacen) almacen.setItem(clave, JSON.stringify(datos)); } catch { /* sin espacio o bloqueado: queda en memoria */ }
  };
  const copiaRecord = (r) => ({ noches: r.noches, racha: r.racha, abatidos: r.abatidos, victorias: r.victorias });

  return {
    estado() {
      const records = {};
      for (const d of DIFICULTADES_LOGROS) records[d] = copiaRecord(datos.records[d]);
      return { version: 1, logros: { ...datos.logros }, records };
    },
    tiene(id) { return Object.prototype.hasOwnProperty.call(datos.logros, id); },
    desbloquear(id) {
      if (!IDS.has(id) || this.tiene(id)) return false;
      datos.logros[id] = new Date().toISOString();
      guardar();
      return true;
    },
    // Devuelve qué récords mejoraron. `victoria: true` suma una victoria:
    // llamalo con victoria sólo una vez por nave nodriza derribada.
    registrarRecord({ dificultad, noches, racha, abatidos, victoria } = {}) {
      const d = DIFICULTADES_LOGROS.includes(dificultad) ? dificultad : 'normal';
      const r = datos.records[d];
      const mejoras = [];
      const valores = { noches: entero(noches), racha: entero(racha), abatidos: entero(abatidos) };
      for (const k of ['noches', 'racha', 'abatidos']) {
        if (valores[k] > r[k]) { r[k] = valores[k]; mejoras.push(k); }
      }
      if (victoria === true) { r.victorias += 1; mejoras.push('victorias'); }
      if (mejoras.length) guardar();
      return mejoras;
    },
    records(dificultad) {
      const d = DIFICULTADES_LOGROS.includes(dificultad) ? dificultad : 'normal';
      return copiaRecord(datos.records[d]);
    },
    todos() {
      return LOGROS.map((l) => ({ ...l, desbloqueado: this.tiene(l.id), fecha: datos.logros[l.id] || null }));
    },
    progreso() {
      return { hechos: Object.keys(datos.logros).length, total: LOGROS.length };
    },
  };
}

// ---------------------------------------------------------------- dibujo
function fechaCorta(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const f = new Date(t);
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
}

export function textoRecords(r) {
  const x = r || recordVacio();
  return `Mejor racha ${x.racha} ${x.racha === 1 ? 'noche' : 'noches'} · Más noches ${x.noches} · Abatidos ${x.abatidos} · Victorias ${x.victorias}`;
}

export function dibujarLogros(contenedor, logros, dificultadActual) {
  if (!contenedor || !logros) return;
  const doc = contenedor.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;
  const el = (tag, clase, texto) => {
    const n = doc.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  };
  contenedor.textContent = '';

  // 1.10: la misma libreta muestra los del Relax, que no tienen récords
  if (typeof logros.records === 'function') {
    const d = DIFICULTADES_LOGROS.includes(dificultadActual) ? dificultadActual : 'normal';
    const bloque = el('div', 'logro-records');
    bloque.appendChild(el('div', 'logro-records-titulo', `Récords · ${d.charAt(0).toUpperCase()}${d.slice(1)}`));
    bloque.appendChild(el('div', 'logro-records-texto', textoRecords(logros.records(d))));
    contenedor.appendChild(bloque);
  }

  const { hechos, total } = logros.progreso();
  contenedor.appendChild(el('div', 'logro-progreso', `${hechos} de ${total} logros`));

  const ul = el('ul', 'logro-lista');
  for (const l of logros.todos()) {
    const li = el('li', l.desbloqueado ? 'logro-item hecho' : 'logro-item');
    const velado = l.oculto && !l.desbloqueado;
    li.appendChild(el('span', 'logro-marca', l.desbloqueado ? '✓' : '·'));
    const cuerpo = el('div', 'logro-cuerpo');
    cuerpo.appendChild(el('div', 'logro-nombre', velado ? '???' : l.nombre));
    cuerpo.appendChild(el('div', 'logro-texto', velado ? 'Algo que todavía no pasó en el valle.' : l.texto));
    if (l.desbloqueado && l.fecha) cuerpo.appendChild(el('div', 'logro-fecha', fechaCorta(l.fecha)));
    li.appendChild(cuerpo);
    ul.appendChild(li);
  }
  contenedor.appendChild(ul);
}

export const CSS_LOGROS = `
.logro-records { background: var(--papel); color: var(--tinta-papel); border: 1px solid var(--papel-sombra); border-radius: 6px;
  padding: 10px 14px; margin: 0 0 10px; box-shadow: inset 0 0 0 3px rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.18); font-family: 'Spectral', serif; }
.logro-records-titulo { font-family: 'Caveat', cursive; font-size: 1.45em; line-height: 1.1; color: var(--musgo); }
.logro-records-texto { font-size: 0.95em; letter-spacing: 0.01em; }
.logro-progreso { font-family: 'Caveat', cursive; font-size: 1.3em; color: var(--tinta-papel); margin: 2px 2px 8px; }
.logro-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.logro-item { display: flex; gap: 10px; align-items: flex-start; padding: 9px 11px; border-radius: 6px; font-family: 'Spectral', serif;
  background: var(--papel); color: var(--tinta-papel); border: 1px dashed var(--papel-sombra); opacity: 0.55; filter: saturate(0.6);
  transition: opacity 0.2s ease, transform 0.2s ease; }
.logro-item:hover { opacity: 0.75; }
.logro-item.hecho { opacity: 1; filter: none; border: 1px solid var(--musgo); border-left: 4px solid var(--musgo);
  box-shadow: 0 1px 4px rgba(0,0,0,0.16), inset 0 0 18px rgba(255,255,255,0.12); }
.logro-item.hecho:hover { transform: translateY(-1px); }
.logro-marca { flex: 0 0 auto; width: 1.5em; height: 1.5em; border-radius: 50%; display: grid; place-items: center; font-size: 0.9em;
  border: 1px solid var(--papel-sombra); color: var(--papel-sombra); }
.logro-item.hecho .logro-marca { background: var(--musgo); border-color: var(--musgo); color: var(--luz); }
.logro-cuerpo { min-width: 0; }
.logro-nombre { font-family: 'Caveat', cursive; font-size: 1.35em; line-height: 1.05; }
.logro-item.hecho .logro-nombre { color: var(--musgo); }
.logro-texto { font-size: 0.86em; line-height: 1.3; }
.logro-fecha { font-size: 0.75em; margin-top: 3px; color: var(--notro); font-style: italic; }
`;
