// 2.8: tres secciones de "Personalizar": Tu refugio, Tu jardín y Tu fortín con
// estilo. Módulo puro al importarse (guardado.js y las pruebas de Node lo cargan): el DOM
// sólo se toca adentro de `construir`, que corre en el juego.
//
// Lo elegido vive en progreso.personal.refugio / .jardin / .fortin. `aplicar` lo pasa a
// `ESTILO` (estilo-casa.js), que leen las obras al rehacerse, y le pide al mundo:
//   · api.mundo.estructuras.personal.aplicar(datos, progreso): el Refugio del Arroyo
//     (pintura, adentro, afuera, mástil; ver personal-casa-mundo.js),
//   · api.mundo.obras.repintar(): rehace sólo las obras cuyo estilo cambió.
// El color de las antorchas lo toma solo desafio-fortin-mundo.js en su repaso.
import { registrarSeccion, color } from './personalizacion.js';
import { fila, segmentos, muestras, siNo, boton, parrafo } from './personal-controles.js';
// (en una sola línea: el armador sólo entiende así los import)
import { PINTURAS_PARED, PINTURAS_ABERTURAS, PINTURAS_TECHO, LUGARES_INTERIOR, CUADROS, FAROLES, CERCOS, MADERAS_FORTIN, PINTURAS_FORTIN, ESTANDARTES, LLAMAS, ORDEN_LLAMAS, FLORES, SETOS, SENDAS, refugioDefecto, fortinDefecto, jardinDefecto, fijarEstilo, hayPintura } from './estilo-casa.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const opcion = (v, lista, def) => (lista.some(([id]) => id === v) ? v : def);
const clave = (v, tabla, def) => (typeof v === 'string' && Object.hasOwn(tabla, v) ? v : def);
const ID_FOTO = /^[a-z0-9-]{1,40}$/;

// ---------------------------------------------------------------- sanear
export function sanearPintura(p) {
  const x = obj(p);
  return { pared: color(x.pared, null), aberturas: color(x.aberturas, null), techo: color(x.techo, null) };
}
export function sanearRefugio(d) {
  const x = obj(d), i = obj(x.interior), e = obj(x.exterior), def = refugioDefecto();
  const interior = {};
  for (const L of LUGARES_INTERIOR) interior[L.id] = opcion(i[L.id], L.opciones, 'nada');
  for (const C of CUADROS) interior[C.id] = typeof i[C.id] === 'string' && ID_FOTO.test(i[C.id]) ? i[C.id] : '';
  return {
    ...sanearPintura(x),
    casas: sanearPintura(x.casas),
    interior,
    exterior: {
      faroles: opcion(e.faroles, FAROLES, def.exterior.faroles),
      cerco: opcion(e.cerco, CERCOS, def.exterior.cerco),
      mastil: typeof e.mastil === 'boolean' ? e.mastil : def.exterior.mastil,
    },
  };
}
export function sanearFortin(d) {
  const x = obj(d), def = fortinDefecto();
  return {
    madera: opcion(x.madera, MADERAS_FORTIN, def.madera),
    pintura: color(x.pintura, def.pintura),
    estandarte: color(x.estandarte, null),
    llama: clave(x.llama, LLAMAS, def.llama),
  };
}
export function sanearJardin(d) {
  const x = obj(d), def = jardinDefecto();
  return { flores: clave(x.flores, FLORES, def.flores), seto: clave(x.seto, SETOS, def.seto), senda: clave(x.senda, SENDAS, def.senda) };
}

// ---------------------------------------------------------------- el mundo
// `api.mundo` puede traer cada cosa con uno u otro nombre, o como función que la devuelve.
function delMundo(api, ...claves) {
  const m = api && api.mundo && typeof api.mundo === 'object' ? api.mundo : null;
  if (!m) return null;
  for (const k of claves) {
    if (!Object.hasOwn(m, k)) continue;
    let v = m[k];
    if (typeof v === 'function') { try { v = v(); } catch { v = null; } }
    if (v) return v;
  }
  return null;
}
const obrasDe = (api) => delMundo(api, 'obras', 'construccion');
const estructurasDe = (api) => delMundo(api, 'estructuras', 'est');
function posJugador(api) {
  const j = delMundo(api, 'jugador');
  const p = j?.estado?.pos || j?.pos || null;
  return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? p : null;
}

export function aplicarRefugio(datos, api) {
  const d = sanearRefugio(datos);
  fijarEstilo('casas', d.casas);
  estructurasDe(api)?.personal?.aplicar?.(d, api?.progreso || null);
  return obrasDe(api)?.repintar?.() || 0;
}
export function aplicarFortin(datos, api) {
  fijarEstilo('fortin', sanearFortin(datos));
  return obrasDe(api)?.repintar?.() || 0;
}
export function aplicarJardin(datos, api) {
  // sólo cambia con qué nacen las piezas nuevas; lo plantado se repinta con el botón
  fijarEstilo('jardin', sanearJardin(datos));
  return obrasDe(api)?.repintar?.() || 0;
}

// ---------------------------------------------------------------- los controles
const opcionesColor = (lista) => lista.map((o) => ({ valor: o.valor, color: o.color, texto: o.nombre }));
const titulo = (cont, texto) => {
  const h = document.createElement('h4');
  h.className = 'personal-subtitulo';
  h.textContent = texto;
  cont.appendChild(h);
};
function armadorDe(cont, api, construir) {
  const redibujar = () => { cont.innerHTML = ''; construir(cont, api); };
  return { redibujar, cambiar: (parcial) => { api.cambiar(parcial); redibujar(); } };
}

// Las fotos que tenés (las del álbum de desafíos, con su miniatura), para los cuadros.
function fotosDe(progreso) {
  const out = [];
  for (const [id, f] of Object.entries(obj(progreso?.desafios))) {
    if (ID_FOTO.test(id) && typeof f?.img === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(f.img)) out.push({ id, img: f.img, dia: Number(f.dia) || 0 });
  }
  return out.sort((a, b) => a.dia - b.dia);
}
function elegirFoto(fotos, actual, alElegir, etiqueta) {
  const g = document.createElement('div');
  g.className = 'segmentos personal-segmentos personal-fotos';
  g.setAttribute('role', 'group');
  g.setAttribute('aria-label', etiqueta);
  g.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  const agregar = (valor, contenido, texto) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.valor = valor;
    b.title = texto;
    b.setAttribute('aria-label', texto);
    b.setAttribute('aria-pressed', String(valor === actual));
    b.appendChild(contenido);
    b.addEventListener('click', () => alElegir(valor));
    g.appendChild(b);
  };
  agregar('', document.createTextNode('Nada'), 'Sin cuadro');
  for (const f of fotos) {
    const img = document.createElement('img');
    img.src = f.img;
    img.alt = '';
    img.style.cssText = 'width:64px;height:48px;object-fit:cover;display:block';
    agregar(f.id, img, `Foto del día ${f.dia || '?'}`);
  }
  return g;
}

let casaElegida = -1;   // qué casa se está pintando en el panel (-1: la paleta de todas)

function construirRefugio(cont, api) {
  const d = sanearRefugio(api.datos);
  const { redibujar, cambiar } = armadorDe(cont, api, construirRefugio);
  cont.appendChild(parrafo('Pintá el Refugio del Arroyo y tus casas, amueblá el refugio por dentro y arreglá la entrada.'));

  titulo(cont, 'El Refugio del Arroyo');
  fila(cont, 'Paredes', muestras(opcionesColor(PINTURAS_PARED), d.pared, (v) => cambiar({ pared: v }), 'Paredes del refugio'));
  fila(cont, 'Puerta y marcos', muestras(opcionesColor(PINTURAS_ABERTURAS), d.aberturas, (v) => cambiar({ aberturas: v }), 'Puerta y marcos del refugio'));
  fila(cont, 'Techo', muestras(opcionesColor(PINTURAS_TECHO), d.techo, (v) => cambiar({ techo: v }), 'Techo del refugio'));

  titulo(cont, 'Adentro');
  for (const L of LUGARES_INTERIOR) {
    fila(cont, L.nombre, segmentos(L.opciones.map(([valor, texto]) => ({ valor, texto })), d.interior[L.id],
      (v) => cambiar({ interior: { ...d.interior, [L.id]: v } }), L.nombre));
  }
  const fotos = fotosDe(api.progreso);
  for (const C of CUADROS) {
    fila(cont, C.nombre, elegirFoto(fotos, d.interior[C.id], (v) => cambiar({ interior: { ...d.interior, [C.id]: v } }), C.nombre),
      fotos.length ? '' : 'Todavía no hay fotos: las del álbum de desafíos (modo foto) se pueden colgar acá.');
  }

  titulo(cont, 'Afuera');
  fila(cont, 'Faroles', segmentos(FAROLES.map(([valor, texto]) => ({ valor, texto })), d.exterior.faroles,
    (v) => cambiar({ exterior: { ...d.exterior, faroles: v } }), 'Faroles'), 'Se prenden solos al caer la noche, con el farol de la puerta.');
  fila(cont, 'Cerco', segmentos(CERCOS.map(([valor, texto]) => ({ valor, texto })), d.exterior.cerco,
    (v) => cambiar({ exterior: { ...d.exterior, cerco: v } }), 'Cerco'), 'Dos tramos a los costados del patio: el frente queda abierto.');
  fila(cont, 'Mástil', siNo(d.exterior.mastil, (v) => cambiar({ exterior: { ...d.exterior, mastil: v } }), ['Con mástil', 'Sin mástil']),
    'Ahí flamea tu bandera.');

  titulo(cont, 'Tus casas');
  const obras = obrasDe(api);
  const casas = obras?.casas ? obras.casas(posJugador(api)).slice(0, 6) : [];
  if (casaElegida >= casas.length) casaElegida = -1;
  const lejos = (c) => {
    const p = posJugador(api);
    return p ? ` · a ${Math.round(Math.hypot(c.x - p.x, c.z - p.z))} m` : '';
  };
  if (casas.length) {
    fila(cont, 'Qué pintar', segmentos([{ valor: -1, texto: 'Todas' }, ...casas.map((c, i) => ({
      valor: i, texto: `Casa ${i + 1}${lejos(c)}`, titulo: `${c.n} ${c.n === 1 ? 'pieza' : 'piezas'}`,
    }))], casaElegida, (v) => { casaElegida = v; redibujar(); }, 'Qué casa pintar'));
  } else {
    cont.appendChild(parrafo('Las paredes y los techos que levantes (modo obra → Refugios) salen con estos colores; después vas a poder pintar cada casa por separado.'));
  }
  const casa = casaElegida >= 0 ? casas[casaElegida] : null;
  if (casa) {
    const propia = casa.piezas.find((o) => o.datos?.pintura)?.datos.pintura;
    const p = sanearPintura(propia || d.casas);
    const pintar = (parcial) => {
      obras.pintarCasa(casa.piezas, { ...p, ...parcial });
      api.guardar?.();
      redibujar();
    };
    cont.appendChild(parrafo(propia ? 'Esta casa tiene sus propios colores.' : 'Esta casa usa la paleta de todas: elegí un color para darle los suyos.'));
    fila(cont, 'Paredes', muestras(opcionesColor(PINTURAS_PARED), p.pared, (v) => pintar({ pared: v }), 'Paredes de esta casa'));
    fila(cont, 'Puertas y marcos', muestras(opcionesColor(PINTURAS_ABERTURAS), p.aberturas, (v) => pintar({ aberturas: v }), 'Puertas y marcos de esta casa'));
    fila(cont, 'Techo', muestras(opcionesColor(PINTURAS_TECHO), p.techo, (v) => pintar({ techo: v }), 'Techo de esta casa'));
    if (propia) cont.appendChild(boton('Volver a la paleta de todas', () => { obras.pintarCasa(casa.piezas, null); api.guardar?.(); redibujar(); }));
  } else {
    const cambiarCasas = (parcial) => cambiar({ casas: { ...d.casas, ...parcial } });
    fila(cont, 'Paredes', muestras(opcionesColor(PINTURAS_PARED), d.casas.pared, (v) => cambiarCasas({ pared: v }), 'Paredes de tus casas'));
    fila(cont, 'Puertas y marcos', muestras(opcionesColor(PINTURAS_ABERTURAS), d.casas.aberturas, (v) => cambiarCasas({ aberturas: v }), 'Puertas y marcos de tus casas'));
    fila(cont, 'Techo', muestras(opcionesColor(PINTURAS_TECHO), d.casas.techo, (v) => cambiarCasas({ techo: v }), 'Techo de tus casas'));
    if (hayPintura(d.casas)) cont.appendChild(parrafo('Una pieza teñida con T (modo obra) conserva su tinte.'));
  }
}

function construirFortin(cont, api) {
  const d = sanearFortin(api.datos);
  const { cambiar } = armadorDe(cont, api, construirFortin);
  cont.appendChild(parrafo('Cómo se ven tus defensas de La noche de los duendes. Es sólo el aspecto: aguantan y lastiman lo mismo.'));
  fila(cont, 'La madera', segmentos(MADERAS_FORTIN.map(([valor, texto]) => ({ valor, texto })), d.madera, (v) => cambiar({ madera: v }), 'La madera del fortín'),
    d.madera === 'pirca' ? 'Piedras apiladas al pie de empalizadas, portones, embudos, campanas y torres.' : '');
  if (d.madera === 'pintada') fila(cont, 'Pintura', muestras(opcionesColor(PINTURAS_FORTIN), d.pintura, (v) => cambiar({ pintura: v }), 'Pintura del fortín'));
  fila(cont, 'Estandarte', muestras(opcionesColor(ESTANDARTES), d.estandarte, (v) => cambiar({ estandarte: v }), 'Estandarte'),
    'Flamea en las torres de vigía, los portones y los muros almenados.');
  fila(cont, 'Fuego de las antorchas', segmentos(ORDEN_LLAMAS.map((k) => ({ valor: k, texto: LLAMAS[k].nombre })), d.llama, (v) => cambiar({ llama: v }), 'Fuego de las antorchas'));
}

function construirJardin(cont, api) {
  const d = sanearJardin(api.datos);
  const { cambiar } = armadorDe(cont, api, construirJardin);
  cont.appendChild(parrafo('Canteros, macizos, macetones, setos y sendas se construyen en el modo obra (Exterior). Nacen con esta paleta y la conservan.'));
  fila(cont, 'Flores', segmentos(Object.entries(FLORES).map(([valor, f]) => ({ valor, texto: f.nombre })), d.flores, (v) => cambiar({ flores: v }), 'Flores'));
  const vista = document.createElement('div');
  vista.className = 'personal-muestras';
  vista.style.cssText = 'display:flex;gap:4px';
  for (const c of FLORES[d.flores].colores) {
    const s = document.createElement('span');
    s.style.cssText = `display:inline-block;width:18px;height:18px;border-radius:50%;background:${c}`;
    vista.appendChild(s);
  }
  fila(cont, 'Colores', vista);
  fila(cont, 'Seto', segmentos(Object.entries(SETOS).map(([valor, s]) => ({ valor, texto: s.nombre })), d.seto, (v) => cambiar({ seto: v }), 'Seto'));
  fila(cont, 'Senda', segmentos(Object.entries(SENDAS).map(([valor, s]) => ({ valor, texto: s.nombre })), d.senda, (v) => cambiar({ senda: v }), 'Senda'));
  const obras = obrasDe(api);
  if (obras?.restilizarJardin) {
    cont.appendChild(boton('Pasar esta paleta a lo ya plantado', () => {
      const n = obras.restilizarJardin();
      api.guardar?.();
      const aviso = parrafo(n ? `Listo: ${n} ${n === 1 ? 'pieza cambió' : 'piezas cambiaron'}.` : 'No había nada distinto para cambiar.');
      cont.appendChild(aviso);
    }));
  }
}

// ---------------------------------------------------------------- las secciones
export const SECCION_REFUGIO = registrarSeccion({
  id: 'refugio',
  titulo: 'Tu refugio',   // (3.6: era «Tu refugio y tu pueblo»; el pueblo de la 3.1 se sacó)
  orden: 32,
  porDefecto: refugioDefecto,
  sanear: sanearRefugio,
  construir: construirRefugio,
  aplicar: aplicarRefugio,
});
export const SECCION_JARDIN = registrarSeccion({
  id: 'jardin',
  titulo: 'Tu jardín',
  orden: 34,
  porDefecto: jardinDefecto,
  sanear: sanearJardin,
  construir: construirJardin,
  aplicar: aplicarJardin,
});
export const SECCION_FORTIN = registrarSeccion({
  id: 'fortin',
  titulo: 'Tu fortín con estilo',
  orden: 62,
  porDefecto: fortinDefecto,
  sanear: sanearFortin,
  construir: construirFortin,
  aplicar: aplicarFortin,
});
