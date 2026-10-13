// 3.9.2: los textos nuevos de Amadeo Lezcano (el gerente del banco): las tres partes de su historia que se abren con más amistad que la de compadre
// (ver PUNTOS_HISTORIA_EXTRA en vecindad.js), más humor de sobremesa y más charla de mostrador. Sin imports: lo usan vecindad-voces.js y aldea.js.
// Sólo castellano: el usuario pidió que el inglés de la economía y de lo nuevo de la 3.9.2 se haga después. `SIN_INGLES_392` los lista para que la prueba
// del inglés del gerente (verificar-3-8-8-banco.mjs) los deje pasar hasta entonces.
export const HISTORIA_EXTRA_GERENTE = [
  'El día que cerraron la sucursal de Esquel vino una orden de Buenos Aires: «liquidar y cerrar». Atendí tres días con la persiana a medio bajar, hasta que no quedó un solo cliente sin su plata. La última fue una viejita con los billetes atados en un pañuelo: me dijo que no sabía contar pero sí saber si alguien la quería robar. Le dije que acá no. Se fue tranquila. Yo, no tanto.',
  'Ese reloj de péndulo que ve en la oficina era del escribano de Esquel. Cuando el escribano murió, nadie lo quiso: «atrasa», decían. Yo lo traje en el tren, sobre las rodillas, y lo cuelgo todos los días a las ocho y media. Atrasa, es cierto: cuatro minutos por semana. Pero es el único reloj que conozco que atrasa siempre lo mismo, y con eso se puede vivir: sólo hay que saber la cuenta.',
  'Hay un préstamo que nunca anoté en el libro mayor. Un muchacho de Esquel necesitaba el pasaje para ir a probar suerte al sur, y yo le di de mi bolsillo, sin papel. Diez años después me llegó una postal de Ushuaia con una moneda pegada con cinta: el pasaje, sin interés. Es la única cuenta que no está en ningún balance, y la que más rindió. No se lo cuente a nadie: arruinaría mi fama de hombre exacto.',
];
export const SOBREMESA_EXTRA_GERENTE = [
  'El oficio de banquero es noventa por ciento decir que no con amabilidad y diez por ciento decir que sí con cuidado. Del diez por ciento vivo, del noventa me quejo.',
  'Me preguntaron si el banco tenía seguro contra robos. Le dije que sí: Ernesto, que vive enfrente y no duerme. No sé si es seguro, pero es gratis.',
  'Mi señora, que en paz descanse, decía que yo contaba hasta los lunares de las personas. Es cierto: me quedó un lunar de más y todavía lo busco.',
  'La reja de bronce del mostrador la hizo Tito con un cálculo de ferretero: «el que quiera robar, que se lastime». Hasta ahora, nadie se lastimó, así que funciona.',
  'Dicen que la plata no hace la felicidad. Es verdad: la hace la libreta cuando cierra. La plata sólo la acompaña.',
  'En Esquel había un cliente que venía todos los viernes a preguntar cuánto tenía, aunque sabía de memoria el saldo. Con los años entendí que no venía por el saldo, venía por la compañía. Acá también pasa, y no le cobro el rato.',
  'Una vez me equivoqué en un centavo y pasé la noche sin dormir. A la mañana siguiente lo encontré: estaba en el bolsillo del chaleco. Desde entonces nunca más guardo nada ahí.',
  'El trueque es el banco más antiguo del mundo: sin intereses, sin libretas y con mucha memoria. Yo vine a ordenarle la memoria, no a reemplazarlo.',
];
export const CHARLA_EXTRA_GERENTE = [
  'Abro de ocho y media a doce y media, y de dos y media a seis. En la siesta no atiendo: un banquero dormido es un riesgo, y uno despierto y de mal humor, otro peor.',
  'El sábado cierro a las cuatro por el baile de la cantina. Dicen que es por la música; yo digo que es por el paso de la bailarina nueva, que hace temblar el piso, y con él las cuentas.',
  'Una casa que se alquila es una renta que camina sola. Una casa vacía es una factura que duerme. Piénselo antes de dejar un techo sin gente.',
  'En Esquel el banco era de piedra y tenía un reloj en lo alto. Acá es de piedra y tiene un reloj en lo alto, y de cada lado, una ventana. Es mi manera de decir que me siento en casa.',
  'Le recomiendo no pedir de más. Lo que sobra en el bolsillo no rinde, pero lo que se debe de más, crece. Es una de esas aritméticas que no se aprenden en la escuela, sino en el mostrador.',
  'Si algún día necesita saber la hora, mire el reloj de la plaza; si necesita saber qué hora es de verdad, venga a mirar el mío. Atrasa, pero atrasa con estilo.',
];
export const SIN_INGLES_392 = [...HISTORIA_EXTRA_GERENTE, ...SOBREMESA_EXTRA_GERENTE, ...CHARLA_EXTRA_GERENTE];
