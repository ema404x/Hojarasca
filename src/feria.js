// La feria de la estación. Con la 1.10 el Relax empezó a producir —verdura, huevos,
// lana, ponchos— más de lo que el juego sabía usar. Cada cinco días, de nueve a seis,
// hay feria junto al andén de la Estación del Valle: cuatro cambios del día, distintos
// cada vez, que convierten lo que producís en lo que te sirve (material para construir,
// semilla, yerba, alguna cosa del almacén).
//
// Cada cambio se hace una vez por feria. Los del día salen de la fecha: dos partidas
// el mismo día ven la misma feria, y vuelve a ser la misma si recargás.
//
// Módulo puro (se prueba en Node). Sólo en el Relax.

export const FERIA = { cada: 5, abre: 9, cierra: 18, ofertas: 4 };

// `pide`: lo que das (haba, papa, frutilla y huevo se juntan; lana es material; poncho es
// una cosa). `da`: materiales, cosas que se cuentan (`cuenta`) o una cosa única (`cosa`).
export const OFERTAS = [
  { id: 'verdura-tablas', texto: 'Un carpintero de Esquel', pide: { haba: 4, papa: 3 }, da: { materiales: { tabla: 8 } } },
  { id: 'huevos-piedra', texto: 'El que arregla la vía', pide: { huevo: 6 }, da: { materiales: { piedra: 8 } } },
  { id: 'lana-troncos', texto: 'Un leñero del cerro', pide: { lana: 3 }, da: { materiales: { tronco: 6 } } },
  { id: 'frutillas-semilla', texto: 'Una quintera de El Bolsón', pide: { frutilla: 6 }, da: { cuenta: { 'semillas-papa': 3 } } },
  { id: 'poncho-yerba', texto: 'El almacenero de Jacobacci', pide: { poncho: 1 }, da: { cuenta: { yerba: 16 } } },
  { id: 'huevos-harina', texto: 'El panadero de la estación', pide: { huevo: 4 }, da: { cuenta: { harina: 6 } } },
  { id: 'poncho-tablas', texto: 'Un aserradero de Trevelin', pide: { poncho: 1 }, da: { materiales: { tabla: 14 } } },
  { id: 'lana-piedra', texto: 'Un pircador', pide: { lana: 4 }, da: { materiales: { piedra: 12 } } },
  { id: 'papas-semilla-habas', texto: 'Un chacarero', pide: { papa: 4 }, da: { cuenta: { 'semillas-habas': 4 } } },
  { id: 'ponchos-mosca', texto: 'Un pescador de mosca', pide: { poncho: 2 }, da: { cosa: 'mosca' } },
  { id: 'ponchos-farol', texto: 'Un farolero retirado', pide: { poncho: 2, lana: 2 }, da: { cosa: 'farol' } },
  { id: 'huevos-habas-guiso', texto: 'La cocinera del tren', pide: { huevo: 3, haba: 3 }, da: { cuenta: { yerba: 8 }, materiales: { tabla: 4 } } },
  // 2.4: lo del horno de barro
  { id: 'pan-yerba', texto: 'La señora del andén', pide: { 'pan-casero': 3 }, da: { cuenta: { yerba: 10 } } },
  { id: 'empanadas-tablas', texto: 'La cuadrilla de la vía', pide: { empanadas: 4 }, da: { materiales: { tabla: 10, tronco: 2 } } },
  { id: 'pan-lana', texto: 'Una hilandera de Gualjaina', pide: { 'pan-casero': 2, huevo: 2 }, da: { materiales: { lana: 4 } } },
];
const OFERTA = Object.fromEntries(OFERTAS.map((o) => [o.id, o]));

const dia1 = (d) => Math.max(1, Math.floor(Number(d) || 1));
export const esDiaDeFeria = (dia) => dia1(dia) % FERIA.cada === 0;
export function abierta(dia, horas) {
  const h = ((Number(horas) || 0) % 24 + 24) % 24;
  return esDiaDeFeria(dia) && h >= FERIA.abre && h < FERIA.cierra;
}
export function proximaFeria(dia) {
  const d = dia1(dia);
  return d % FERIA.cada === 0 ? d : d + (FERIA.cada - (d % FERIA.cada));
}

// Un azar con semilla: la misma fecha da la misma feria.
function azarDe(semilla) {
  let s = (semilla * 2654435761) >>> 0;
  return () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
}

// Las cuatro del día. Lo único que no se ofrece es una cosa que ya tenés, salvo que la
// hayas cambiado hoy mismo: si no, al llevártela entraría otra oferta y se correrían los
// números de la lista.
export function ofertasDelDia(dia, cosas = {}, tomadas = []) {
  const r = azarDe(dia1(dia) + 17);
  const pool = OFERTAS.filter((o) => !(o.da.cosa && cosas[o.da.cosa] && !tomadas.includes(o.id)));
  const lista = [];
  while (lista.length < FERIA.ofertas && pool.length) lista.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return lista;
}

export function feriaNueva(dia) { return { dia: dia1(dia), tomadas: [] }; }
export function sanearFeria(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { dia: 0, tomadas: [] };
  return { dia: Math.floor(Number(v.dia) || 0), tomadas: (Array.isArray(v.tomadas) ? v.tomadas : []).filter((id) => OFERTA[id]).slice(0, FERIA.ofertas) };
}
// La de hoy; si la guardada es de otro día, arranca de cero.
export function feriaDeHoy(feria, dia) {
  return feria && feria.dia === dia1(dia) ? feria : feriaNueva(dia);
}

// `cuanto(k)`: cuánto tenés de eso.
export function alcanza(o, cuanto) {
  return Object.entries(o.pide).every(([k, n]) => (Number(cuanto(k)) || 0) >= n);
}
export function cambiarEnFeria(feria, id, cuanto) {
  const o = OFERTA[id];
  if (!o) return { ok: false, motivo: 'no hay' };
  if (feria.tomadas.includes(id)) return { ok: false, motivo: 'hecho' };
  if (!alcanza(o, cuanto)) return { ok: false, motivo: 'falta' };
  feria.tomadas.push(id);
  return { ok: true, oferta: o };
}

const NOMBRES = {
  haba: 'habas', papa: 'papas', frutilla: 'frutillas', huevo: 'huevos', lana: 'vellones', poncho: 'ponchos',
  tabla: 'tablas', piedra: 'piedras', tronco: 'troncos', yerba: 'cebadas de yerba', harina: 'medidas de harina',
  'pan-casero': 'panes caseros', empanadas: 'empanadas caseras',
  'semillas-papa': 'papas para semilla', 'semillas-habas': 'semillas de habas', mosca: 'la mosca atada a mano', farol: 'el farol de kerosene',
};
export const nombreFeria = (k) => NOMBRES[k] || k;
// de a uno se dice distinto: "un poncho", no "1 ponchos"
const UNO = { poncho: 'un poncho', huevo: 'un huevo', haba: 'un puñado de habas', papa: 'una papa', frutilla: 'una frutilla', lana: 'un vellón', tabla: 'una tabla', piedra: 'una piedra', tronco: 'un tronco', 'pan-casero': 'un pan casero', empanadas: 'una empanada' };
const cuanto = (k, n) => (n === 1 && UNO[k]) || `${n} ${nombreFeria(k)}`;
export function textoOferta(o) {
  const pide = Object.entries(o.pide).map(([k, n]) => cuanto(k, n)).join(' y ');
  const da = [
    ...Object.entries(o.da.materiales || {}).map(([k, n]) => cuanto(k, n)),
    ...Object.entries(o.da.cuenta || {}).map(([k, n]) => cuanto(k, n)),
    ...(o.da.cosa ? [nombreFeria(o.da.cosa)] : []),
  ].join(' y ');
  return { pide, da };
}
