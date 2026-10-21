// 4.5: los textos de la consola de códigos (Ctrl+Mayús+C). TODO lo que dice la consola está en este archivo, para poder
// editarlo sin tocar las reglas (trucos.js) ni la pantalla (trucos-pantalla.js). Todo en castellano rioplatense.
//
// Cada código tiene: `uso` (cómo se escribe), `linea` (una línea para `ayuda`) y `detalle` (lo que muestra `ayuda <código>`).
// Las respuestas que llevan datos son funciones: reciben lo que hace falta y devuelven el texto.

export const TITULO = 'Consola de códigos';
export const PISTA_ENTRADA = 'Escribí un código (probá «ayuda») y Enter';
export const PIE = 'Enter ejecuta · Tab completa · ↑ ↓ historial · Esc o Ctrl+Mayús+C cierran';
export const SIN_RESPUESTAS = 'Todavía no escribiste nada. Probá «ayuda» para ver todos los códigos.';
export const SIN_SUGERENCIAS = 'Ningún código empieza así. Probá «ayuda».';
export const BIENVENIDA = 'Consola abierta. Escribí «ayuda» para ver los códigos.';
export const CERRADA = 'Consola cerrada.';

// Los grupos, en el orden en que sale la ayuda
export const GRUPOS = {
  dinero: 'Dinero y materiales',
  tiempo: 'Tiempo y clima',
  jugador: 'Jugador y lugares',
  desbloquear: 'Desbloquear y completar',
  consola: 'La consola',
};

export const AYUDA = {
  plata: { uso: 'plata 50000', linea: 'Fija tus pesos (con + o − suma o resta: plata +500).', detalle: 'Fija el saldo de pesos. Con signo suma o resta: «plata +2000», «plata -300». Va de 0 a 99.999.999. Sólo en el Relax. No deja rastro en el libro de movimientos ni en lo ganado.' },
  materiales: { uso: 'materiales 100', linea: 'Fija troncos, tablas, piedras, lana y los materiales de zona de la mochila.', detalle: 'Deja troncos, tablas, piedras, vellones de lana y los materiales de zona (junco, hierbas, arcilla, cuero y piedra de cantera) en la cantidad que digas (de 0 a 9.999). Con signo suma o resta: «materiales +50». En La noche de los duendes son sólo troncos, tablas y piedras.' },
  troncos: { uso: 'troncos 50', linea: 'Fija los troncos que llevás.', detalle: 'Deja los troncos de la mochila en esa cantidad (de 0 a 9.999). Con signo suma o resta.' },
  tablas: { uso: 'tablas 200', linea: 'Fija las tablas que llevás.', detalle: 'Deja las tablas de la mochila en esa cantidad (de 0 a 9.999). Con signo suma o resta.' },
  piedras: { uso: 'piedras 80', linea: 'Fija las piedras que llevás.', detalle: 'Deja las piedras de la mochila en esa cantidad (de 0 a 9.999). Con signo suma o resta.' },
  lana: { uso: 'lana 20', linea: 'Fija los vellones de lana que llevás (sólo Relax).', detalle: 'Deja los vellones de lana de la mochila en esa cantidad (de 0 a 9.999). Con signo suma o resta. Sólo en el Relax.' },
  depositos: { uso: 'depositos', linea: 'Llena hasta el tope tus pilas, depósitos, barracas y silos.', detalle: 'Llena al máximo cada pila de piedra, depósito, barraca y silo que hayas construido (con las ampliaciones que tengan). No toca lo que llevás encima ni el herramientero.' },
  herramientas: { uso: 'herramientas', linea: 'Te da hacha, pico, tijera, mosca, farol, botas y las herramientas de zona (sólo Relax).', detalle: 'Te da una de cada herramienta que no tengas: hacha, pico, tijera, mosca de pescar, farol, botas de goma y las de zona: hoz de junco, pala de arcilla, cuchillo de cuero y pico de cantero. En La noche de los duendes las herramientas se fabrican, así que no aplica.' },

  hora: { uso: 'hora 18', linea: 'Pone la hora del día (hora 18, hora 6:30).', detalle: 'Pone la hora: «hora 18», «hora 6:30», «hora 21.5». No cambia el día. No anda si jugás con la hora de tu reloj. Sólo en el Relax.' },
  amanecer: { uso: 'amanecer', linea: 'Son las 6:30.', detalle: 'Atajo de «hora 6:30».' },
  mediodia: { uso: 'mediodia', linea: 'Son las 12:00.', detalle: 'Atajo de «hora 12».' },
  atardecer: { uso: 'atardecer', linea: 'Son las 19:00.', detalle: 'Atajo de «hora 19».' },
  medianoche: { uso: 'medianoche', linea: 'Son las 0:00.', detalle: 'Atajo de «hora 0».' },
  dia: { uso: 'dia 12', linea: 'Salta al día que digas (sólo adelante, hasta el 9999).', detalle: 'Salta hacia adelante al día indicado. No se puede volver atrás: desordenaría la huerta, los préstamos y los encargos. Los días saltados no se viven: lo que depende de dormir no ocurre. Sólo en el Relax.' },
  estacion: { uso: 'estacion otoño', linea: 'Cambia la estación: verano, otoño, invierno o auto.', detalle: 'Cambia la estación del paisaje: verano, otoño, invierno, o «auto» para que siga los días. Es el mismo ajuste del menú de ajustes. Sólo en el Relax.' },
  clima: { uso: 'clima lluvia', linea: 'Cambia el clima: despejado, lluvia o variable.', detalle: 'Cambia el clima: «despejado» (siempre sol), «lluvia» (siempre lluvia) o «variable» (el de siempre). Es el mismo ajuste del menú de ajustes. Sólo en el Relax.' },
  congelar: { uso: 'congelar', linea: 'Detiene el reloj del día (no pasa la hora).', detalle: 'Detiene el reloj: la hora y el día no avanzan, aunque camines. Se apaga con «descongelar». No se guarda: al reiniciar el juego vuelve a correr. Sólo en el Relax.' },
  descongelar: { uso: 'descongelar', linea: 'Vuelve a andar el reloj.', detalle: 'Vuelve a hacer correr el reloj del día.' },

  velocidad: { uso: 'velocidad 3', linea: 'Cuánto más rápido caminás (1 es lo normal, hasta 6).', detalle: 'Multiplica tu velocidad a pie: «velocidad 3» es el triple. Va de 0,25 a 6. «velocidad 1» (o «velocidad normal») la deja como siempre. No se guarda con la partida.' },
  salto: { uso: 'salto 4', linea: 'Cuánto más alto saltás (1 es lo normal, hasta 6).', detalle: 'Multiplica la fuerza del salto: «salto 4» salta muy alto. Va de 1 a 6. «salto 1» (o «salto normal») lo deja como siempre. No se guarda con la partida.' },
  volar: { uso: 'volar', linea: 'Prende o apaga el vuelo (Espacio sube, C o Ctrl bajan).', detalle: 'Prende el vuelo: Espacio sube, C o Ctrl bajan, y te movés con W A S D. Con «volar» otra vez se apaga y caés con gravedad normal. No se guarda con la partida. No anda arriba del caballo, el tren o el kayak.' },
  frio: { uso: 'frio', linea: 'Prende o apaga «no sentir frío» (nada de entumecimiento).', detalle: 'Mientras esté prendido no te entumecés de frío, ni durmiendo sin fuego. Con «frio» otra vez se apaga. No se guarda con la partida. (En este juego no hay hambre ni cansancio que apagar.)' },
  ir: { uso: 'ir faro', linea: 'Te lleva a un lugar por su nombre (ir sola lista los lugares).', detalle: 'Te teletransporta a un lugar: «ir faro», «ir plaza», «ir muelle». También a un punto: «ir 120 -80». «ir» sola lista todos los lugares. No anda arriba del tren, el kayak o el sulky, ni sentado.' },
  donde: { uso: 'donde', linea: 'Te dice dónde estás y qué lugar tenés más cerca.', detalle: 'Muestra tu posición y el lugar más cercano.' },

  planos: { uso: 'planos todos', linea: 'Abre todos los planos (en el Relax ya están todos abiertos).', detalle: 'En el Relax ningún plano está bloqueado: se construye con lo que tengas. En La noche de los duendes los planos se ganan de los restos de las naves y no se regalan.' },
  oficios: { uso: 'oficios maximo', linea: 'Sube oficios: oficios maximo, oficios hachero 3.', detalle: 'Sube los oficios (hachero, picapedrero, pescador, cazador, obrero, huertero, navegante). «oficios maximo» los pone todos en nivel 5; «oficios hachero 3» sube uno solo, de 0 a 5; «oficios cero» los vacía.' },
  historia: { uso: 'historia capitulo 5', linea: 'Salta o completa capítulos de la historia (sólo Relax).', detalle: '«historia capitulo 5» te deja al comienzo del capítulo 5 (los anteriores quedan completos); «historia completar» termina los ocho; «historia reiniciar» vuelve al capítulo 1. No se entregan los premios de los capítulos saltados. Sólo en el Relax.' },
  amigos: { uso: 'amigos todos', linea: 'Amistad con los vecinos: amigos todos, amigos rosa compadre.', detalle: '«amigos todos» deja a todos los vecinos como compadres; «amigos todos amigo» sólo como amigos; «amigos ercilia» sólo a ella. Sólo sube la amistad: nunca la baja. Sólo en el Relax.' },
  cuaderno: { uso: 'cuaderno completo', linea: 'Completa el cuaderno de campo (sin dar logros).', detalle: 'Anota todo lo que falta en el cuaderno de campo (o sólo una sección: «cuaderno completo flora»). Lo anotado así NO cuenta para los logros. Sólo en el Relax.' },

  ayuda: { uso: 'ayuda', linea: 'Esta lista (ayuda <código> explica uno).', detalle: 'Lista todos los códigos. Con un nombre explica ese código: «ayuda plata».' },
  estado: { uso: 'estado', linea: 'Resumen de tu partida: día, hora, pesos, lugar.', detalle: 'Muestra el día, la hora, los pesos y dónde estás.' },
  guardar: { uso: 'guardar', linea: 'Guarda la partida ahora.', detalle: 'Guarda la partida en este momento (el juego también guarda solo).' },
  limpiar: { uso: 'limpiar', linea: 'Borra las respuestas de la pantalla.', detalle: 'Borra el historial de respuestas que se ve en la consola (no el de lo que escribiste: ese sigue con las flechas).' },
  salir: { uso: 'salir', linea: 'Cierra la consola.', detalle: 'Cierra la consola y vuelve al juego (también Esc o Ctrl+Mayús+C).' },
};

// ------------------------------------------------------------------ respuestas
const miles = (n) => String(Math.floor(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const pesos = (n) => `$${miles(n)}`;
export const cantidad = (n) => miles(n);

export const R = {
  vacia: 'Escribí un código. Probá «ayuda».',
  noEntendi: (txt, sugeridos) => `No entendí «${txt}»: probá «ayuda»${sugeridos && sugeridos.length ? `. ¿Quisiste decir ${sugeridos.map((s) => `«${s}»`).join(' o ')}?` : ''}`,
  ambiguo: (txt, lista) => `«${txt}» puede ser ${lista.map((s) => `«${s}»`).join(', ')}: escribí un poco más`,
  faltaNumero: (uso) => `Falta el número. Por ejemplo: «${uso}»`,
  noEsNumero: (txt, uso) => `«${txt}» no es un número. Por ejemplo: «${uso}»`,
  fueraDeRango: (txt, min, max, unidad = '') => `«${txt}» no vale: tiene que estar entre ${miles(min)} y ${miles(max)}${unidad}`,
  demasiado: (txt) => `«${txt}» es demasiado grande`,
  sobra: (resto) => `Sobra «${resto}»: no lo usé`,
  soloRelax: (que) => `${que} es del modo Relax: en La noche de los duendes no aplica`,
  soloDesafio: (que) => `${que} es de La noche de los duendes`,
  noHayPartida: 'No hay una partida en marcha',

  plata: (n) => `Listo: tenés ${pesos(n)}`,
  plataDesafio: 'En La noche de los duendes no hay pesos: eso es del modo Relax',
  material: (k, n) => `Listo: tenés ${cantidad(n)} ${k}`,
  materiales: (n) => `Listo: troncos, tablas, piedras, lana y los materiales de zona en ${cantidad(n)}`,
  materialesDesafio: (n) => `Listo: troncos, tablas y piedras en ${cantidad(n)} (la lana no existe en La noche de los duendes)`,
  materialesRel: (signo, n) => `Listo: ${signo > 0 ? 'sumé' : 'resté'} ${cantidad(n)} de cada material`,
  lanaDesafio: 'La lana es del modo Relax: en La noche de los duendes no aplica',
  depositos: (n) => (n ? `Listo: ${n} ${n === 1 ? 'depósito lleno' : 'depósitos llenos'}` : 'No hay depósitos para llenar: construí una pila, un depósito, una barraca o un silo'),
  herramientas: (lista) => (lista.length ? `Listo: te di ${lista.join(', ')}` : 'Ya tenías todas las herramientas'),

  hora: (h, m) => `Listo: son las ${h}:${String(m).padStart(2, '0')}`,
  horaDeReloj: 'Jugás con la hora de tu reloj: escribí «congelar» y después la hora, o cambiá la duración del día en los ajustes',
  horaDesafio: 'El reloj de La noche de los duendes marca las noches: no se toca',
  dia: (n) => `Listo: es el día ${cantidad(n)}`,
  diaAtras: (hoy) => `No se puede volver atrás: ya es el día ${cantidad(hoy)}. Escribí un día mayor`,
  diaIgual: (hoy) => `Ya es el día ${cantidad(hoy)}`,
  estacion: (nombre) => `Listo: ahora es ${nombre}`,
  estacionAuto: 'Listo: la estación vuelve a seguir los días',
  estacionNo: (txt) => `No conozco la estación «${txt}»: verano, otoño, invierno o auto`,
  clima: (nombre) => `Listo: clima ${nombre}`,
  climaNo: (txt) => `No conozco el clima «${txt}»: despejado, lluvia o variable`,
  congelado: 'Listo: el reloj quedó detenido («descongelar» lo hace andar)',
  yaCongelado: 'El reloj ya estaba detenido',
  descongelado: 'Listo: el reloj vuelve a andar',
  yaAndaba: 'El reloj ya andaba',

  velocidad: (x) => (x === 1 ? 'Listo: velocidad normal' : `Listo: velocidad por ${String(x).replace('.', ',')}`),
  salto: (x) => (x === 1 ? 'Listo: salto normal' : `Listo: salto por ${String(x).replace('.', ',')}`),
  volarSi: 'Listo: volás (Espacio sube, C o Ctrl bajan). «volar» otra vez lo apaga',
  volarNo: 'Listo: ya no volás',
  volarNoPuedo: 'No podés volar arriba del caballo, el tren, el kayak o la tirolesa: bajate primero',
  frioSi: 'Listo: no sentís más el frío',
  frioNo: 'Listo: el frío vuelve a sentirse',
  irLista: (nombres) => `Lugares: ${nombres.join(', ')}. Escribí «ir» y el nombre`,
  irNo: (txt) => `No conozco el lugar «${txt}»: escribí «ir» para ver la lista`,
  irAmbiguo: (txt, lista) => `«${txt}» puede ser ${lista.map((s) => `«${s}»`).join(', ')}: escribí un poco más`,
  irOk: (nombre) => `Listo: estás en ${nombre}`,
  irPunto: (x, z) => `Listo: estás en ${Math.round(x)}, ${Math.round(z)}`,
  irFuera: (limite) => `Ese punto queda fuera del valle: va de −${limite} a ${limite}`,
  irNoPuedo: 'No podés teletransportarte arriba del tren, el kayak, el sulky o la tirolesa, ni sentado: bajate o levantate primero',
  donde: (x, z, cerca, metros) => `Estás en ${Math.round(x)}, ${Math.round(z)}${cerca ? `: a ${metros} m de ${cerca}` : ''}`,

  planosRelax: 'En el Relax ya están todos los planos abiertos: se construye con lo que tengas',
  planosDesafio: 'En La noche de los duendes los planos se ganan de los restos de las naves: no se regalan',
  oficiosTodos: 'Listo: los siete oficios en el nivel máximo',
  oficio: (nombre, nivel) => `Listo: ${nombre} en nivel ${nivel}`,
  oficiosCero: 'Listo: los oficios vuelven a cero',
  oficioNo: (txt) => `No conozco el oficio «${txt}»: ${'hachero, picapedrero, pescador, cazador, obrero, huertero o navegante'}`,
  historiaCapitulo: (n, nombre) => `Listo: estás al comienzo del capítulo ${n}${nombre ? `, «${nombre}»` : ''}`,
  historiaCompleta: 'Listo: la historia quedó completa',
  historiaReiniciada: 'Listo: la historia vuelve al capítulo 1',
  historiaUso: (max) => `Probá «historia capitulo 5» (del 1 al ${max}), «historia completar» o «historia reiniciar»`,
  amigos: (n, nivel) => `Listo: ${n} ${n === 1 ? 'vecino' : 'vecinos'} como ${nivel}`,
  amigosNinguno: (nivel) => `Todos ya eran ${nivel} o más`,
  amigoNo: (txt) => `No conozco al vecino «${txt}»`,
  nivelNo: (txt) => `No conozco el nivel «${txt}»: conocido, amigo o compadre`,
  cuaderno: (n) => (n ? `Listo: ${n} ${n === 1 ? 'anotación nueva' : 'anotaciones nuevas'} en el cuaderno (no cuentan para los logros)` : 'El cuaderno ya estaba completo'),
  cuadernoSeccion: (txt) => `No conozco la sección «${txt}» del cuaderno`,

  estado: (dia, hora, pesosTxt, lugar) => `Día ${dia}, ${hora}${pesosTxt ? ` · ${pesosTxt}` : ''}${lugar ? ` · ${lugar}` : ''}`,
  guardado: 'Listo: partida guardada',
  limpia: 'Pantalla limpia',
  ayudaTitulo: 'Códigos disponibles (escribí «ayuda plata» para el detalle de uno):',
  ayudaUno: (uso, detalle) => `${uso}: ${detalle}`,
  salio: 'Hasta luego',
};

// Los nombres de las estaciones y de los climas, como se muestran
export const NOMBRE_ESTACION = { verano: 'verano', otono: 'otoño', invierno: 'invierno' };
export const NOMBRE_CLIMA = { variable: 'variable', despejado: 'despejado', lluvioso: 'lluvia' };

// Cómo se llama cada lugar en la lista de «ir» (los que el juego no nombra solo)
export const LUGARES_NOMBRE = {
  refugio: 'Refugio del Arroyo', muelle: 'Muelle del Lago', puente: 'Puente', mallin: 'Mallín', mirador: 'Mirador del Pehuén',
  arrayanes: 'Bosque de Arrayanes', faro: 'Faro', cabana: 'Cabaña', puesto: 'Puesto', molino: 'Molino', 'casa-te': 'Casa de té del valle',
  torre: 'Torre', estacion: 'Estación del valle', galpon: 'Galpón', almacen: 'Almacén del valle', cueva: 'Cueva',
};
export const LUGARES_ALDEA_NOMBRE = {
  aldea: 'Estación de la aldea', plaza: 'Plaza de la aldea', banco: 'Banco del pueblo', cantina: 'Cantina', biblioteca: 'Biblioteca popular',
  ramos: 'Almacén de Ramos Generales', 'te-aldea': 'Casa de Té de la aldea', escuela: 'Escuela', observatorio: 'Observatorio',
};
