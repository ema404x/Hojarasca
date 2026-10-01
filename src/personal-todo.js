// 2.8: todas las secciones de "Personalizar". Cada línea importa un módulo puro
// (sin three ni DOM al importarse) que registra su sección en personalizacion.js.
// Para sumar una sección: crear src/personal-<algo>.js y agregar su import acá.
//
// OJO con armar.mjs: el empaquetador sólo entiende `import { algo } from './x.js';` en
// una sola línea. Un `import './x.js';` suelto o un `export { ... } from '...'` rompen el
// armado del index.html. Por eso cada sección se importa con nombre (la SECCION_…
// que exporta), aunque acá no se use.
import { secciones, sanearPersonal } from './personalizacion.js';
import { SECCION_PERSONAJE } from './personal-personaje.js';
import { SECCION_INTERFAZ } from './personal-interfaz.js';
import { SECCION_BANDERA } from './personal-bandera.js';
import { SECCION_PARTIDA } from './personal-partida.js';
// 2.8: el perro, el caballo, el kayak, la trochita, las armas, la música y el cuaderno
import { SECCION_PERRO } from './personal-perro.js';
import { SECCION_CABALLO } from './personal-caballo.js';
import { SECCION_BOTES } from './personal-botes.js';
import { SECCION_TROCHITA } from './personal-trochita.js';
import { SECCION_ARMAS } from './personal-armas.js';
import { SECCION_MUSICA } from './personal-musica.js';
import { SECCION_CUADERNO } from './personal-cuaderno.js';
// 2.8: el refugio y tus casas, el jardín y el fortín
import { SECCION_REFUGIO, SECCION_JARDIN, SECCION_FORTIN } from './personal-casa.js';

export { secciones, sanearPersonal };
