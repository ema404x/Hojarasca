// 4.1 (F2): la sección «Bruno» de Personalizar. Módulo puro al importarse (sin three ni DOM; sólo usa `document` adentro de `construir`).
//
// Guarda a Bruno Castellanos en `progreso.personal.bruno`: las diez personalizaciones del creador (ver creador-personaje.js) y la bandera `creado`
// (si ya pasó por la pantalla de creación). Mientras `creado` es falso, el cuerpo del jugador sigue siendo el de «Tu personaje» de siempre.
//
// Reparto con «Tu personaje» (personal-personaje.js), sin duplicar elecciones:
//   · de Bruno salen la cara, los ojos, la piel, el pelo, el peinado, la barba, la contextura y la estatura (el aspecto que se rehace en el espejo);
//   · de «Tu personaje» sale la ropa de abrigo (campera, poncho, gorro, bufanda, guantes y botas): el guardarropa, que se desbloquea jugando;
//   · los anteojos son de Bruno (el accesorio que elige al crearlo).
import { registrarSeccion } from './personalizacion.js';
import { sanearGenoma, genomaDefecto, aspectoDeGenoma, PROTAGONISTA } from './creador-personaje.js';
import { PIELES } from './creador-catalogo.js';
import { aspecto } from './personal-personaje.js';
import { fila, boton, parrafo } from './personal-controles.js';

// `retrato`: la foto chica de la cara (una imagen JPEG como texto, hasta 60 000 caracteres); vacío si todavía no se sacó. Se saca al terminar la creación y cada vez que se rehace.
const RETRATO_MAX = 60000;
const PREFIJO_RETRATO = 'data:image/jpeg;base64,';
export const retratoValido = (v) => typeof v === 'string' && v.length <= RETRATO_MAX && v.startsWith(PREFIJO_RETRATO) && v.length > PREFIJO_RETRATO.length && /^[A-Za-z0-9+/]+={0,2}$/.test(v.slice(PREFIJO_RETRATO.length));
// `prologoVisto` (4.1, F4): si ya pasó por el prólogo de texto. Vale `true` salvo que una partida NUEVA lo deje pendiente (false) al crear a Bruno: las partidas viejas y el Desafío no lo ven.
export const brunoDefecto = () => ({ ...genomaDefecto(), creado: false, retrato: '', espejoPuesto: false, prologoVisto: true });
export function sanearBruno(d) {
  const x = d && typeof d === 'object' ? d : {};
  return { ...sanearGenoma(x), creado: x.creado === true, retrato: retratoValido(x.retrato) ? x.retrato : '', espejoPuesto: x.espejoPuesto === true, prologoVisto: x.prologoVisto !== false };
}

// ¿Hay que mostrar el prólogo? Sólo en el Relax, con Bruno ya creado y el prólogo pendiente (lo dejó pendiente una partida nueva al crearlo).
export const debeMostrarPrologo = (bruno, esDesafio) => !esDesafio && !!bruno && bruno.creado === true && bruno.prologoVisto === false;
// Al crear a Bruno: ¿ya está «visto» el prólogo? Sí en una partida ya empezada y en el Desafío; sólo una partida nueva del Relax lo deja pendiente.
export const prologoVistoAlCrear = (partidaEmpezada, esDesafio) => !!partidaEmpezada || !!esDesafio;

// El color de piel de Bruno (también para la mano en primera persona).
export const pielDeBruno = (bruno) => (PIELES.find((p) => p.id === sanearBruno(bruno).piel) || PIELES[0]).color;

// El aspecto del cuerpo del jugador cuando Bruno ya fue creado: el del genoma, con la ropa de abrigo de «Tu personaje».
export function aspectoJugadorBruno(bruno, personaje) {
  const a = aspectoDeGenoma(bruno), v = aspecto(personaje);
  const abrigado = !!(v.bufanda || v.poncho);
  return {
    ...a,
    colores: {
      ...a.colores,
      ropa: v.campera, abrigo: v.campera, poncho: v.poncho || null, bufanda: v.bufanda || null,
      gorro: v.gorro ? 'gorroPunto' : null, gorroColor: v.gorro || null, pantalon: v.pantalon,
    },
    R: { ...a.R, botas: v.botasAltas ? 'goma' : 'altas', botaCol: v.botas, pantalon: v.pantalon, guantes: v.guantes || null },
    // la guarda del cuello sólo va con bufanda o poncho (sin ellos asomaba una cinta de colores en la base del cuello)
    guardas: { puno: [1, 0, 'todo'], ...(abrigado ? { cuello: [1, 0, 'todo'] } : {}), ...(v.poncho ? { poncho: [2, 0.07] } : {}) },
  };
}

// ---------------------------------------------------------------- el panel (provisorio: el definitivo es la pantalla de creación y el espejo del refugio)
function construir(cont, api) {
  const d = api.datos;
  const hayEspejo = !!api.mundo?.bruno?.hayEspejo?.();
  cont.appendChild(parrafo(`${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}, ${PROTAGONISTA.edad} años. Llegó al valle buscando paz, lejos del ruido de la ciudad.`));
  if (!d.creado) {
    cont.appendChild(parrafo('Todavía no lo creaste: hasta entonces se ve como en «Tu personaje».'));
    if (typeof api.mundo?.bruno?.abrirCreador === 'function') fila(cont, 'Bruno', boton('Crear a Bruno', () => api.mundo.bruno.abrirCreador()));
    return;
  }
  cont.appendChild(parrafo('Su historia queda en la primera página del cuaderno. Su cara, su pelo, su barba, su piel y su físico se rehacen en el espejo.'));
  if (hayEspejo) cont.appendChild(parrafo('Tenés un espejo armado: acercate y mirate con E.'));
  else {
    // el respaldo: sin ningún espejo armado (se desmontó, o no hubo lugar al crear), nadie se queda sin poder rehacerse
    cont.appendChild(parrafo('No tenés ningún espejo armado. Armá uno gratis desde los planos (Mobiliario), o rehacelo desde acá.'));
    if (typeof api.mundo?.bruno?.abrirCreador === 'function') fila(cont, 'Bruno', boton('Rehacer a Bruno', () => api.mundo.bruno.abrirCreador()));
  }
}

export const SECCION_BRUNO = registrarSeccion({
  id: 'bruno',
  titulo: 'Bruno',
  orden: 5,
  porDefecto: brunoDefecto,
  sanear: sanearBruno,
  construir,
  // lo lleva al mundo main.js (api.mundo.bruno, ver personal-personaje-mundo.js)
  aplicar: (datos, api) => { api?.mundo?.bruno?.aplicar?.(datos); },
});
