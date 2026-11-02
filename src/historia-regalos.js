// 4.18.3: lo que se lleva de regalo en dos optativas de la Historia que antes no pedían nada: «Visitar a Ramón» (algo rico, capítulo 9) y «Herminia y
// los noventa» (la torta, capítulo 8). Módulo PURO (sin three ni DOM; se prueba en Node): la lista de lo que sirve, cuántos hay en la mochila y cómo se
// gasta uno. Lo usan el estado (`estadoHistoria`), los disparadores (sin el regalo la escena no sale y la E sigue siendo la charla de siempre), los
// textos del tablón y el juego (`gastarCosaHistoria` de main.js).
//
// Dónde está lo que se lleva: lo juntado y lo cocinado en el horno o la cocina a leña va a `progreso.entradas[id].cantidad`; lo que da un vecino o
// un premio (el pan de Rosa, la harina) a veces queda en `progreso.cosas[id]`. Se cuentan las dos, como la cocina (`cuantoHay` de cocina-pasos.js), y se gasta
// primero de lo juntado.
//
// 4.19.0: la torta de Herminia es una torta de verdad: la «torta casera» del horno de barro (cocina-pasos.js: harina, huevos y azúcar; rinde dos y se guarda).
// Antes (4.18.3) no existía una torta guardable (la frita se come al fuego y la negra galesa en la casa de té) y se llevaba lo dulce que sí se guarda.

const n = (v) => Math.max(0, Math.floor(Number(v) || 0));

// Cuántos hay de algo: lo juntado más las cosas
export const cuentaDe = (p, k) => n(p?.entradas?.[k]?.cantidad) + n(p?.cosas?.[k]);

// `k`: el id en la mochila; `n`: cuánto se lleva; `nombre`: cómo se dice («le llevaste …»); `corto`: cómo se dice en la pista («trucha ahumada»).
// El orden es el de preferencia: primero lo que menos cuesta, para no gastar un asado teniendo un puñado de piñones.
export const PARA_RAMON = [
  { k: 'pinon', n: 3, nombre: 'un puñado de piñones', corto: 'piñones' },
  { k: 'trucha-ahumada', n: 1, nombre: 'una trucha ahumada', corto: 'trucha ahumada' },
  { k: 'pan-casero', n: 1, nombre: 'un pan casero', corto: 'pan casero' },
  { k: 'empanadas', n: 1, nombre: 'una empanada', corto: 'empanadas' },
  { k: 'miel', n: 1, nombre: 'un frasco de miel', corto: 'miel' },
  { k: 'frasco-frutilla', n: 1, nombre: 'un frasco de dulce de frutilla', corto: 'dulce de frutilla' },
  { k: 'dulce-leche', n: 1, nombre: 'un frasco de dulce de leche', corto: 'dulce de leche' },
  { k: 'mermelada-frambuesa', n: 1, nombre: 'un frasco de mermelada de frambuesa', corto: 'mermelada' },
  { k: 'mermelada-cereza', n: 1, nombre: 'un frasco de mermelada de cereza', corto: 'mermelada' },
  { k: 'mermelada-ciruela', n: 1, nombre: 'un frasco de mermelada de ciruela', corto: 'mermelada' },
  { k: 'mermelada-manzana', n: 1, nombre: 'un frasco de mermelada de manzana', corto: 'mermelada' },
  { k: 'mermelada-pera', n: 1, nombre: 'un frasco de mermelada de pera', corto: 'mermelada' },
  { k: 'mermelada-grosella', n: 1, nombre: 'un frasco de mermelada de grosella', corto: 'mermelada' },
  { k: 'chocolate-caliente', n: 1, nombre: 'una taza de chocolate caliente', corto: 'chocolate caliente' },
  { k: 'locro', n: 1, nombre: 'un plato de locro', corto: 'locro' },
  { k: 'curanto', n: 1, nombre: 'un plato de curanto', corto: 'curanto' },
  { k: 'asado', n: 1, nombre: 'una porción de asado', corto: 'asado' },
  { k: 'cordero-asado', n: 1, nombre: 'una porción de cordero', corto: 'cordero al asador' },
];
export const PARA_LA_TORTA = [
  { k: 'torta-casera', n: 1, nombre: 'una torta casera', corto: 'torta casera' },
];
export const REGALOS = { ramon: PARA_RAMON, herminia: PARA_LA_TORTA };
// Todos los ids de mochila que pueden gastarse como regalo
export const IDS_REGALO = [...new Set([...PARA_RAMON, ...PARA_LA_TORTA].map((x) => x.k))];

// El regalo que se llevaría ahora: el primero de la lista del que alcanza lo que tenés. `cuanto(k)`: cuántos hay de eso.
export function elegirRegalo(lista, cuanto) {
  if (!Array.isArray(lista) || typeof cuanto !== 'function') return null;
  for (const x of lista) if (n(cuanto(x.k)) >= x.n) return x;
  return null;
}
export const regaloDe = (quien, cuanto) => elegirRegalo(Object.hasOwn(REGALOS, quien) ? REGALOS[quien] : [], cuanto);
// Lo mismo mirando el progreso (para `estadoHistoria`)
export const regaloDeProgreso = (quien, p) => regaloDe(quien, (k) => cuentaDe(p, k));

// Gasta `cant` de `k`: primero de lo juntado y después de las cosas. Devuelve lo que se gastó (0 si no había). Cambia `p` (el progreso).
export function gastarRegalo(p, k, cant) {
  if (!p || typeof k !== 'string') return 0;
  let falta = n(cant);
  const pedido = falta;
  const e = p.entradas?.[k];
  if (e && falta > 0) { const q = Math.min(falta, n(e.cantidad)); e.cantidad = Math.max(0, (Number(e.cantidad) || 0) - q); falta -= q; }
  if (p.cosas && falta > 0 && Number(p.cosas[k]) > 0) { const q = Math.min(falta, n(p.cosas[k])); p.cosas[k] -= q; if (p.cosas[k] <= 0) delete p.cosas[k]; falta -= q; }
  return pedido - falta;
}

// Cómo se dice lo que falta o lo que se puede llevar, en la pista del tablón. `s`: el estado (`regaloRamon` y `regaloTorta` son el que se llevaría ahora, o null).
const unico = (lista) => [...new Set(lista.map((x) => x.corto))];
const unir = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} o ${l[l.length - 1]}` : l[0] || '');
export const QUE_LLEVAR_RAMON = unir(unico(PARA_RAMON.slice(0, 7)));   // piñones, trucha ahumada, pan casero, empanadas, miel, dulce de frutilla o dulce de leche
export const QUE_LLEVAR_TORTA = unir(unico(PARA_LA_TORTA));            // torta casera
export const COMO_HACER_TORTA = 'dos medidas de harina, dos huevos y una de azúcar, en el horno de barro';   // 4.19.0
export const nombreDeRegalo = (lista, k) => lista.find((x) => x.k === k)?.nombre || '';
