// 4.6.1: una sola lista para la tecla E y el aviso en pantalla («E · Anotar helecho»).
//
// Hasta la 4.6.0 la prioridad de cada interacción estaba escrita dos veces en main.js: una en la tecla E y otra en el
// aviso, con un comentario que pedía tenerlas en el mismo orden. Cada interacción nueva se agregaba a mano en los dos
// lugares y cada tanto quedaban distintas (en la 4.6.0, el recurso de zona perdía contra «Anotar» del cuaderno).
// Ahora las dos recorren esta tabla: la primera entrada que aplica es lo que hace la E y lo que dice el aviso.
//
// Reglas puras (sin three ni DOM). Cada entrada recibe `c`, el contexto que arma main.js (`ctxInteraccion`): el estado
// del jugador (`c.js`), lo que mirás (`c.objetivo`), el vecino de adelante (`c.vecino`) y las funciones del juego por su
// nombre de siempre. Así una prueba en Node arma un contexto falso y pregunta qué haría la E y qué diría el aviso.
//
// Cada entrada:
//   · `id`: el nombre (las pruebas lo usan).
//   · `cuando(c, enE)`: si aplica, devuelve algo verdadero (lo que encontró: la acción del módulo, el cantero…). `enE` es
//     verdadero para la tecla E, que mira fresco; el aviso corre en cada cuadro y usa lo que se buscó a 10 Hz (los `cache…` de main.js).
//   · `aviso(c, hit)`: el texto (con tecla E) o `{ tecla, texto }`; nulo si no hay nada que decir.
//   · `hacer(c, hit)`: lo que hace la E. Con `sigueE`, si devuelve `false` la E sigue con la entrada que viene (como antes, cuando la
//     función devolvía falso: el capullo del Desafío, el lugar del tren). Sin `hacer`, la entrada es sólo del aviso.
//   · `corta`: aplica y el aviso queda vacío del todo (charlando, con un panel abierto, colgado de la tirolesa).
//   · `sigue`: si aplica pero el aviso no tiene texto, el aviso sigue buscando (la E igual la usa: así era antes).
// Si una entrada aplica sin texto (ni `corta` ni `sigue`), el aviso no dice nada de la E y pasan las otras teclas
// (`OTRAS_TECLAS`: F, H, Y, B, T, G y los «·» que sólo informan).

const libre = (js) => !js.enTren && !js.enKayak;   // ni en el tren ni en el kayak (ni en el velero)
const sinObjetivo = (c) => !c.objetivo;
const aMano = (c) => libre(c.js) && !c.objetivo;   // a pie (o a caballo) y sin mirar nada para juntar
const aPie = (c) => libre(c.js) && !c.js.montado && !c.objetivo;
const sentarseOnada = (c) => !c.objetivo || c.objetivo.tipo === 'sentarse';
// Las acciones de los módulos (`modulo.accion(js)` → { texto, hacer }): la E las pide frescas; el aviso, de lo buscado
const delModulo = (nombre, cond) => ({
  cuando: (c, enE) => cond(c) && c.accion(nombre, enE),
  aviso: (c, a) => a.texto,
  hacer: (c, a) => { a.hacer(); c.limpiar(nombre); },
});
// Un panel abierto: la E lo cierra y el aviso no dice nada
const panel = (id, abierto, cerrar) => ({ id, cuando: abierto, corta: true, aviso: () => null, hacer: cerrar });

export const INTERACCIONES = [
  // colgado de la tirolesa no se hace nada (la tecla ni llega a la tabla: ver la tecla E)
  { id: 'cable', cuando: (c) => c.js.enCable, corta: true, aviso: () => null, hacer: () => {} },
  { id: 'charla', cuando: (c) => c.charlaNpc(), corta: true, aviso: () => null, hacer: (c) => c.seguirCharla() },
  // con un panel abierto, la E lo cierra
  panel('almacen-abierto', (c) => c.enElAlmacen(), (c) => c.cerrarAlmacen()),
  panel('feria-abierta', (c) => c.enLaFeria(), (c) => c.cerrarFeria()),
  panel('cargas-abiertas', (c) => c.enLasCargas(), (c) => c.cerrarCargas()),
  panel('banco-abierto', (c) => c.enElBanco(), (c) => c.cerrarBanco()),
  panel('local-abierto', (c) => c.panelAbierto('negocio'), (c) => c.cerrarPanel('negocio')),
  panel('carta-cantina', (c) => c.panelAbierto('cantina'), (c) => c.cerrarPanel('cantina')),
  panel('carta-te', (c) => c.panelAbierto('te'), (c) => c.cerrarPanel('te')),
  panel('recetas-cocina', (c) => c.panelAbierto('cocina'), (c) => c.cerrarPanel('cocina')),
  panel('taller-tren-abierto', (c) => c.panelAbierto('taller'), (c) => c.cerrarPanel('taller')),
  panel('fiestas-abierto', (c) => c.panelAbierto('fiestas'), (c) => c.cerrarPanel('fiestas')),
  // el tablón de encargos abierto se maneja con sus teclas antes de llegar acá (la E lo cierra): el aviso, vacío
  { id: 'tablon-abierto', cuando: (c) => c.panelAbierto('tablon'), corta: true, aviso: () => null, hacer: () => {} },
  // 3.7.5 (rincones): bajar del sulky o patear en el picado, antes que hablar con alguien
  { id: 'urgente', cuando: (c) => c.urgente(), aviso: (c, u) => u.texto, hacer: (c, u) => { u.hacer(); c.limpiar('rincones'); } },
  // si estás mirando a una persona, E habla con ella antes de accionar puertas o mostradores (así se charla con
  // Ercilia detrás del mostrador); en la base del Desafío, le das una orden
  { id: 'vecino', cuando: (c) => c.vecino, aviso: (c, v) => c.textoVecino(v), hacer: (c, v) => { if (c.desafio && v.enBase) c.ordenarCompanero(v); else c.hablar(v); } },
  // 4.3: el empleo fijo: el cartel de turnos y la tarea del puesto, antes que el mostrador y lo de adentro
  {
    id: 'empleo',
    cuando: (c, enE) => { const js = c.js; if (!libre(js) || js.montado) return null; const a = c.accion('empleo', enE); return a && (a.tipo !== 'info' || sentarseOnada(c)) ? a : null; },
    aviso: (c, a) => a.texto,
    hacer: (c, a) => { a.hacer(); c.limpiar('empleo'); },
  },
  // 3.6 (vida): al lado de tu lugar en la mesa de la invitación, E te sienta
  { id: 'cita', cuando: (c) => !c.js.enTren && !c.js.montado && c.puedeSentarseALaCita(), aviso: (c) => c.textoSentarse(), hacer: (c) => c.sentarseALaCita() },
  // 3.7.5 (rincones): los duendes, el sulky, el potrero, las huertas, el retablo, el atril, el fuerte, el campamento, tu casa
  // y el taller (3.8.7: subiendo al sulky se cierran los planos)
  { id: 'rincones', ...delModulo('rincones', aPie), hacer: (c, a) => { a.hacer(); c.limpiar('rincones'); c.alSubirAlSulky(); } },
  // 4.2 (huevos de pascua): al pie del coihue de los duendes (la E también usa lo buscado)
  { id: 'huevos', cuando: (c) => aPie(c) && c.accion('huevos', false), aviso: (c, a) => a.texto, hacer: (c, a) => { c.limpiar('huevos'); a.hacer(); } },
  // a caballo: subirlo a la jaula del tren, el puente colgante o bajarte
  { id: 'jaula', cuando: (c) => c.js.montado && c.jaulaCerca(), aviso: () => 'Subir el caballo a la jaula del tren', hacer: (c) => c.subirCaballoAlTren() },
  { id: 'puente', cuando: (c) => c.puenteDelCaballo(), aviso: (c) => `${c.caballoDicho('', true)} no cruza el puente: bajarte`, hacer: (c) => c.caballoEnElPuente() },
  { id: 'desmontar', cuando: (c) => c.js.montado, aviso: (c) => `Bajarte ${c.caballoDicho('de')}`, hacer: (c) => c.desmontar() },
  { id: 'mostrador', cuando: (c) => aMano(c) && c.cercaDelMostrador(), aviso: () => 'Ver qué hay en el almacén', hacer: (c) => c.abrirAlmacen() },
  { id: 'caballo', cuando: (c) => sinObjetivo(c) && c.caballoCerca(), aviso: (c) => `Subir ${c.caballoDicho('a')}`, hacer: (c) => c.montar() },
  // (4.6.1: a pie, como el mostrador: arriba del tren parado junto al puesto, la E abría la feria y el aviso hablaba del tren)
  { id: 'feria', cuando: (c) => aMano(c) && c.feriaCerca(), aviso: () => 'Ver la feria', hacer: (c) => c.abrirFeria() },
  // 2.9: el puesto de cargas de la parada
  { id: 'cargas', cuando: (c) => aMano(c) && c.puestoDeCargasCerca(), aviso: () => 'Comerciar en el puesto de cargas', hacer: (c, p) => c.abrirCargas(p) },
  // 4.6 puestos: un puesto de ruta: reparar, dormir, comerciar y el depósito
  { id: 'puestos', ...delModulo('puestos', aPie) },
  // cantero, gallinero y telar van antes que las puertas (con un cantero al lado de una puerta, E siembra)
  { id: 'cantero', cuando: (c, enE) => aMano(c) && c.cerca('cantero', enE), aviso: (c, k) => c.textoAvisoCantero(k), hacer: (c, k) => c.usarCantero(k) },
  { id: 'gallinero', cuando: (c, enE) => aMano(c) && c.cerca('gallinero', enE), aviso: (c, g) => c.textoGallinero(g), hacer: (c, g) => c.usarGallinero(g) },
  { id: 'telar', cuando: (c, enE) => aMano(c) && c.cerca('telar', enE), aviso: (c) => c.textoTelar(), hacer: (c) => c.tejer() },
  // 2.3: colmena, ahumadero, vivero, leñera y las obras que trabajan (sin texto, el aviso sigue; la E la usa igual)
  { id: 'obra-trabaja', cuando: (c, enE) => aMano(c) && c.cerca('obraTrabaja', enE), sigue: true, aviso: (c, o) => c.avisoObraQueTrabaja(o), hacer: (c, o) => c.usarObraQueTrabaja(o) },
  // 3.6: parado en el lote de una obra de la aldea, E aporta lo que tengas
  { id: 'obra-aldea', cuando: (c, enE) => aMano(c) && c.cerca('obraAldea', enE), sigue: true, aviso: (c, l) => c.avisoObraAldea(l), hacer: (c, l) => c.aportarObra(l) },
  // 4.6 gente: el tablón de encargos de la plaza, antes de lo de cada lugar de la aldea
  { id: 'tablon', ...delModulo('tablon', aMano) },
  // 4.9 dias: en el Desafío, el tablón de la aldea junto a la base: los pedidos de los vecinos y la noche que viene (a pie; gana
  // sobre lo que mires: a menos de 3,6 m del tablón, el árbol o el helecho de atrás no le sacan la E)
  { id: 'aldea-tablon', cuando: (c) => c.desafio && libre(c.js) && !c.js.montado && c.tablonAldeaCerca(), aviso: (c) => c.avisoTablonAldea(), hacer: (c) => c.abrirTablonAldea() },
  // 4.10 base: en el Desafío, el tablero de trofeos de la base: ver los que tenés y lo que da cada uno (a pie, como el tablón)
  { id: 'trofeos', cuando: (c) => c.desafio && libre(c.js) && !c.js.montado && c.trofeosCerca(), aviso: (c) => c.avisoTrofeos(), hacer: (c) => c.usarTrofeos() },
  // 3.6 (mecánicas): lo de cada lugar de la aldea
  { id: 'mecanica', ...delModulo('mecanica', aMano) },
  // 3.7.2 (granja): la vaca, los chanchos, los corderos, el comedero, la batea y los frutales
  { id: 'granja', ...delModulo('granja', aMano) },
  // 3.7.3: en el taller ferroviario, el panel de mejoras
  { id: 'taller-tren', ...delModulo('taller', aMano) },
  // 3.7.5: lo de las fiestas, después del taller
  { id: 'fiestas', ...delModulo('fiesta', aMano) },
  // 3.9.0: sentado en la cantina (3.9.2: o en la casa de té), E toma o come lo que te trajeron, llama a la moza o abre la carta
  { id: 'cantina', ...delModulo('cantina', aMano) },
  // 3.9.1: bailando con Dalia o al lado de la mesa de truco
  { id: 'pena', ...delModulo('pena', aMano) },
  { id: 'oveja', cuando: (c) => aMano(c) && c.ovejaCercana(), aviso: (c, o) => c.textoOveja(o), hacer: (c, o) => c.esquilarOveja(o) },
  // 4.6 recursos: la veta, el juncal, las hierbas, la barranca de arcilla y el pehuén
  { id: 'recursos', ...delModulo('recursos', aPie) },
  { id: 'acopio', cuando: (c, enE) => aMano(c) && c.cerca('acopio', enE), aviso: (c) => c.textoAcopio(), hacer: (c) => c.usarAcopio() },
  // 2.3: en el Desafío, un capullo o una zanja de fuego al lado (antes que el portón)
  { id: 'desafio-cerca', sigueE: true, cuando: (c) => c.desafio && !c.js.enTren && !c.objetivo, sigue: true, aviso: (c) => c.avisoDesafioCerca(), hacer: (c) => c.usarDesafioCerca() },
  // la puerta, sólo si no estás mirando algo para juntar (3.6 (mecánicas): sentado, no)
  { id: 'puerta', cuando: (c) => aMano(c) && !c.js.sentado && c.puertaCerca(), aviso: (c, p) => `${p.objetivo > 0.5 ? 'Cerrar' : 'Abrir'} ${p.nombre}`, hacer: (c, p) => c.accionarPuerta(p) },
  // el perro: dejar el rastro que sigue o pedirle uno
  { id: 'dejar-rastro', cuando: (c) => sinObjetivo(c) && c.rastro() && !c.desafio && c.mirandoAlPerro(), aviso: () => 'Dejar el rastro', hacer: (c) => c.dejarRastro() },
  { id: 'pedir-rastro', cuando: (c) => sinObjetivo(c) && c.puedoPedirRastro(), aviso: () => 'Pedirle al perro que rastree', hacer: (c) => c.pedirRastro() },
  // 3.7.5 (rincones): un duende tallado al lado, al último (una obra tuya, una puerta o el perro le ganan)
  { id: 'duende', ...delModulo('duende', aPie) },
  // arriba del tren: lo de cada lugar del tren mejorado, varado en la nieve, la cabina o bajar en la estación
  { id: 'tren', cuando: (c) => c.js.enTren, aviso: (c) => c.avisoTren(), hacer: (c) => c.usarTren() },
  // 2.9: al lado de la locomotora, E sube a la cabina (más cerca del coche, de pasajero)
  { id: 'cabina', cuando: (c) => !c.desafio && aMano(c) && c.puedeConducir(), aviso: () => 'Subir a la cabina y manejar', hacer: (c) => c.subirALaCabina() },
  { id: 'trochita', cuando: (c) => !c.js.enKayak && sinObjetivo(c) && c.puedeSubirAlTren(), aviso: () => 'Subir a la trochita', hacer: (c) => c.subirAlTren() },
  // 2.6.1: la casa de té de la estación, antes del kayak, la carpa y el fuego (3.9.2: en la aldea atiende Ceinwen en tu mesa)
  { id: 'casa-te', cuando: (c) => !c.js.enKayak && sentarseOnada(c) && !c.teEnLaAldea() && c.enLaCasaDeTe(), aviso: () => 'Pedir algo en la casa de té', hacer: (c) => c.servir() },
  // 2.9: del velero se baja antes que del kayak (arriba del velero también se está `enKayak`); sin orilla, la E avisa
  { id: 'velero', cuando: (c) => c.js.enVela, aviso: (c) => (c.lugarParaBajar('vela') ? 'Bajar del velero' : null), hacer: (c) => c.bajarDelVelero() },
  { id: 'kayak', cuando: (c) => c.js.enKayak, aviso: (c) => (c.lugarParaBajar('kayak') ? 'Bajar del kayak' : null), hacer: (c) => c.bajarDelKayak() },
  { id: 'subir-kayak', cuando: (c) => sinObjetivo(c) && c.kayakCerca(), aviso: () => 'Subir al kayak', hacer: (c) => c.subirAlKayak() },
  // 2.9: subir al velero o traerlo, largarse por la tirolesa
  { id: 'velero-tirolesa', cuando: (c) => aMano(c) && c.accionVelaOTirolesa(), aviso: (c, a) => a.texto, hacer: (c, a) => a.hacer() },
  { id: 'bitacora', cuando: (c) => sinObjetivo(c) && c.enLaSalaDelFaro() && !c.bitacoraLeida(), aviso: () => 'Leer la bitácora del farero', hacer: (c) => c.leerBitacora() },
  // 2.6.1: la carpa antes que la obra
  { id: 'carpa', cuando: (c) => sinObjetivo(c) && c.enLaCarpa() && c.puedeDormirJuntoAlFuego(), aviso: () => 'Dormir en la carpa', hacer: (c) => c.dormir({ carpa: true }) },
  { id: 'obra-dormir', cuando: (c) => sinObjetivo(c) && c.dentroDeTuObra() && c.puedeDormirJuntoAlFuego(), aviso: (c) => (c.catreCerca() ? 'Dormir en tu catre' : 'Dormir en tu puesto'), hacer: (c) => c.dormir() },
  // junto a un fuego encendido, E duerme (de noche) o cocina; mirando algo (salvo un asiento), eso
  {
    id: 'fuego',
    cuando: (c) => (c.cercaDelFuego() && sentarseOnada(c) ? (c.puedeDormirJuntoAlFuego() ? 'dormir' : c.hayQueCocinar() ? 'cocinar' : null) : null),
    aviso: (c, q) => (q === 'dormir' ? 'Dormir junto al fuego' : 'Cocinar algo en el fuego'),
    hacer: (c, q) => { if (q === 'dormir') c.dormir(); else c.cocinar(); },
  },
  // 2.1: el tendal (aunque esté vacío dice qué se cuelga), las huellas y, en otoño, la semilla de un árbol grande
  { id: 'tendal', cuando: (c) => sinObjetivo(c) && c.tendalCerca(), aviso: (c, t) => c.avisoTendal(t), hacer: (c) => c.usarElTendal() },
  { id: 'huellas', sigueE: true, cuando: (c) => sinObjetivo(c) && c.rastroAlPie(), aviso: (c, r) => c.textoHuellas(r), hacer: (c) => c.mirarRastro() },
  { id: 'semilla', cuando: (c, enE) => aMano(c) && c.cerca('semillaArbol', enE), aviso: (c, s) => c.textoSemilla(s), hacer: (c, s) => c.juntarSemilla(s) },
  // lo que mirás: juntar, anotar, sentarse, leer…
  { id: 'objetivo', cuando: (c) => c.objetivo, aviso: (c, o) => o.texto, hacer: (c) => c.usarObjetivo() },
];

// Lo que el aviso ofrece cuando la E no tiene nada: las otras teclas (2.4.1: van después de todo lo que hace E; antes
// tapaban el aviso de E) y los «·» que sólo informan. Con los planos abiertos, H, T, Y, B y G no se ofrecen.
export const OTRAS_TECLAS = [
  // 3.9.2: en la casa de té de la aldea te atiende Ceinwen en tu mesa
  { id: 'ceinwen', tecla: '·', cuando: (c) => c.teEnLaAldea() && !c.js.sentado && aMano(c) && c.enLaCasaDeTe(), aviso: () => 'Sentate a una mesa y Ceinwen viene a atenderte' },
  // el perro marca algo (arriba del tren, no: el aviso del tren lo tapaba)
  { id: 'marca', tecla: '·', cuando: (c) => !c.js.enTren && c.marcaPerro(), aviso: (c) => c.textoMarca() },
  // 3.8.6: la G de cocinar, junto al fuego de día sin nada para cocinar
  // (4.6.1: ni en el tren ni en el kayak, donde la G no cocina)
  { id: 'cocinar', tecla: 'G', cuando: (c) => libre(c.js) && c.cercaDelFuego(), aviso: () => 'Cocinar algo en el fuego' },
  { id: 'antorcha', tecla: 'F', cuando: (c) => c.desafio && c.antorchaApagadaCerca(), aviso: () => 'Encender la antorcha' },
  { id: 'fuego-propio', tecla: 'F', cuando: (c) => c.fuegoPropio(), aviso: (c, f) => c.textoFuegoPropio(f) },
  { id: 'hacha', tecla: 'H', cuando: (c) => c.hachaCerca(), aviso: (c, h) => c.textoHacha(h) },
  { id: 'aserrar', tecla: 'Y', cuando: (c) => c.aserrar(), aviso: (c, a) => (a === 'banco' ? 'Aserrar en el banco (1 tronco → 4 tablas)' : 'Aserrar a mano (1 tronco → 2 tablas)') },
  { id: 'plantar', tecla: 'B', cuando: (c) => c.js.enSuelo && !c.js.nadando && libre(c.js) && c.semilla(), aviso: (c, s) => `Plantar ${s.nombre}` },
  { id: 'levantar-carpa', tecla: 'T', cuando: (c) => c.enLaCarpa(), aviso: () => 'Levantar la carpa' },
  { id: 'armar-carpa', tecla: 'T', cuando: (c) => c.puedeArmarCarpa(), aviso: () => 'Armar la carpa' },
  { id: 'fogon', tecla: 'F', cuando: (c) => libre(c.js) && c.fogonApagadoCerca(), aviso: () => 'Encender el fogón' },
  { id: 'fogon-puesto', tecla: 'F', cuando: (c) => libre(c.js) && c.fogonDelPuestoApagado(), aviso: () => 'Encender el fogón del puesto' },
];
const TECLAS_DE_OBRA = ['H', 'T', 'Y', 'B', 'G'];   // con los planos abiertos, H no tala, T tiñe e Y levanta la obra

// La tecla E: la primera entrada que aplica y tiene `hacer` (si `hacer` devuelve `false`, sigue). Devuelve el id.
export function hacerConE(c) {
  for (let i = 0; i < INTERACCIONES.length; i++) {
    const en = INTERACCIONES[i];
    if (!en.hacer) continue;
    const hit = en.cuando(c, true);
    if (!hit) continue;
    if (en.hacer(c, hit) === false && en.sigueE) continue;
    return en.id;
  }
  return null;
}

// El aviso: `{ tecla, texto }` o nulo. `info` (opcional, para las pruebas) recibe el id de la entrada que habló.
export function avisoDe(c, info) {
  if (info) info.id = null;
  for (let i = 0; i < INTERACCIONES.length; i++) {
    const en = INTERACCIONES[i];
    const hit = en.cuando(c, false);
    if (!hit) continue;
    const t = en.aviso(c, hit);
    if (t) { if (info) info.id = en.id; return typeof t === 'string' ? { tecla: 'E', texto: t } : t; }
    if (info) info.id = en.id;
    if (en.corta) return null;
    if (en.sigue) { if (info) info.id = null; continue; }
    break;
  }
  for (let i = 0; i < OTRAS_TECLAS.length; i++) {
    const en = OTRAS_TECLAS[i];
    const hit = en.cuando(c);
    if (!hit) continue;
    const t = en.aviso(c, hit);
    if (!t) continue;
    if (info) info.id = en.id;
    if (c.modoObra() && TECLAS_DE_OBRA.includes(en.tecla)) return null;
    return { tecla: en.tecla, texto: t };
  }
  return null;
}

// Para las pruebas: qué entrada elegiría la E sin hacerla (la primera que aplica y tiene `hacer`; las que pueden
// devolver `false` se informan igual).
export function queHariaE(c) {
  for (const en of INTERACCIONES) if (en.hacer && en.cuando(c, true)) return en.id;
  return null;
}
