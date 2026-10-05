// Hojarasca: arma el bosque, maneja la interfaz y hace latir todo
import * as THREE from 'three';
import { CALIDADES, N, RES, LAGO } from './config.js';
import { distanciasDe, textoDistanciaDibujo, BLOQUES_MIN, BLOQUES_MAX } from './config.js';
import { smoothstep, clamp, lerp } from './ruido.js';
import { crearIndiceEspacial2D, crearPresupuestoAdaptativo, crearPerfiladorSubsistemas, factorEfectosPorPresupuesto, crearPlanificadorAntitirones, crearRelojCadencia, crearMedidorRefresco, crearRitmoAuto, planCadencia, crearCronometroGpu } from './rendimiento.js';
import { crearEscalaFluida } from './rendimiento.js';
import { U, materialTerreno } from './materiales.js';
import { configurarTexturas, prepararTexturas, esperarTexturas, origenTexturas } from './texturas.js';
import { cargarTerreno } from './terreno.js';
import { crearAgua, crearCascada } from './agua.js';
import { crearCielo, crearConstelaciones, crearFugaces } from './cielo.js';
import { faseLunar, nombreFase, iluminada, luzDeLuna, nocheDeEstrellas, fugacesPorMinuto, fugaz, lunaAnotable, FUGACES_PARA_ANOTAR } from './cielo-noche.js';
import { crearPostproceso } from './postproceso.js';
import { crearVariantesLuces, registrarLuz } from './luces.js';
import { crearPresupuestoLuces } from './luces.js';
import { crearNiebla } from './niebla.js';
import { crearFlotantes } from './flotantes.js';
import { crearAves } from './aves.js';
import { crearRenovales } from './renovales.js';
import { crearRefugioVivo } from './refugiovivo.js';
import { armarMochila, armarGuardado, icono } from './mochila.js';
import { crearEnMano } from './enmano.js';
import { crearConstruccion, PLANOS, PLANO, CATEGORIAS_CONSTRUCCION as CATEGORIAS_TODAS, MATERIALES, faltan } from './construccion.js';
import { crearPuertas } from './puertas.js';
import { generarVegetacion } from './vegetacion.js';
import { crearPasto } from './pasto.js';
import { crearColisiones } from './colisiones.js';
import { crearEstructuras } from './estructuras.js';
import { crearObjetos } from './objetos.js';
import { crearFauna } from './fauna.js';
import { crearVida } from './vida.js';
import { crearBichos } from './bichos.js';
import { crearPerro } from './perro.js';
import { crearGente, saludoDe, alturaDePie } from './gente.js';
import { crearTrochita } from './trochita.js';
import { crearPuestoDeCargas } from './comercio-mundo.js';
import { renombrarParada } from './comercio.js';
import { crearPesca } from './pesca.js';
import { crearKayak } from './kayak.js';
// 2.9: el velero y las tirolesas y puentes colgantes
import { crearVela } from './vela.js';
import { crearTirolesas } from './tirolesa.js';
import { crearFotos, DESAFIOS } from './fotos.js';
import { crearClima } from './clima.js';
import { crearJugador } from './jugador.js';
import { crearHuellas } from './huellas.js';
import { iniciarFrameEcosistema } from './ecosistema.js';
import { Sonido } from './sonido.js';
import { crearMapa } from './mapa.js';
import { SECCIONES, ENTRADAS, ENTRADA } from './cuaderno.js';
import { ENCARGOS, ENCARGO, encargoDe, estadoEncargo, pistaTrabado, resumenEncargos } from './encargos.js';
import { ENCARGOS_TEMPORADA, ENCARGO_TEMPORADA, encargoDeTemporada, anotarBase, estacionDe } from './encargos-temporada.js';
import { crearDiario } from './diario.js';
import { TRUEQUES, NOMBRE_COSA, tieneYa } from './trueque.js';
import { CULTIVOS, claveCantero, semillaParaSembrar, sembrar, cosechar, regarConLluvia, textoCantero, resumenHuerta, helarHuerta } from './huerta.js';
import { crearMatasHuerta } from './huerta-malla.js';
import { claveGallinero, gallineroNuevo, sanearGallineros, juntarHuevos, textoGallinero } from './gallinero.js';
import { crearGallinas } from './gallinero-mundo.js';
import { RECETAS_FUEGO, posibles, elegirReceta, textoPide, RECETAS_HORNO, elegirHorneada, LENA_HORNO } from './cocina.js';
import { TEJIDOS, queTejer, textoTelar } from './telar.js';
import { FERIA, esDiaDeFeria, abierta as feriaAbierta, ofertasDelDia, sanearFeria, feriaDeHoy, alcanza as alcanzaFeria, cambiarEnFeria, textoOferta } from './feria.js';
import { crearPuestoFeria } from './feria-mundo.js';
import { VISITA, VISITANTES, visitasNuevas, mesaPuesta, quienViene, tocaVisita, empezarVisita, seVa, terminarVisita, charlaDeVisita, puntoDeLlegada, lugarEnLaMesa } from './visitas.js';
// 3.1: rangos y oficios. 3.6: la Aldea de los Duendes (reemplaza al pueblo que fundabas en la 3.1)
import { XP, troncosAlTalar, tablasAMano, golpesParaTalar, extraDeMata, factorPique, segundosParaClavar, factorLinea, factorPulso, radioHuellas, factorEsperaRastro, factorRemo, ahorroDeObra, extraDeCosecha, xpDeEtapa, xpDeAporte } from './oficios.js';
import { crearOficiosUI } from './oficios-ui.js';
import { golpesConFilo, gastarFilo, llamarProximo, PARADA_ALDEA, NOMBRE_ALDEA, puntosMundo, edificioEnMundo, planoAldeaMapa } from './aldea.js';
import { crearAldeaGente, distanciaAldea } from './aldea-gente.js';
import { gruposDeObras, buscarLugar, materialesDeObra, sumarMateriales, devolucionDeRenoval, textoDesalojo } from './aldea-desalojo.js';
import { crearAldeaMundo } from './aldea-mundo.js';
// 3.6 (mecánicas): lo que se hace en cada lugar de la aldea y lo que la hace sentirse viva
import { crearMecanicasAldea } from './aldea-mecanicas-mundo.js';
import { lugarTapaVecino, MECANICAS_EN_LA_CHARLA } from './aldea-mecanicas.js';
// 3.6 (vida): los vecinos con más vida (charla con temas, regalar, invitar, dar una mano, amistad, memoria)
import { crearVecindadJuego, PIE_MENU, PIE_SUBMENU } from './vecindad-juego.js';
import { anotarPartitura, escucharMuestra } from './personal-musica.js';
import { NOMBRE_ORDEN, siguienteOrden } from './desafio-ordenes.js';
import { RASTREABLES, nombreRastro, mirandoAlPerro, elegirPresa, seguirPresa, destinoRastro, estadoRastro } from './rastreo.js';
import { sanearMajada, esquilar, textoOveja, resumenMajada } from './majada.js';
import { sanearCorreo, repartir, porRetirar, partesDeCarta, CARTA, dePara, fotoParaPedidos, porEnviar, enviarFoto, partesDeEnvio, cartasLeidas } from './correo.js';
import { MARCHA_CABALLO, ALTURA_MONTADO, RADIO_MONTAR, AGUA_QUE_NO_PISA, sanearCaballo, dondeEspera, yawCaballo } from './caballo.js';
import { crearCaballo } from './caballo-mundo.js';
import { puedeOtraVuelta, nuevaVuelta, multiplicadorVuelta } from './desafio-vuelta.js';
import { RAYO, sanearTormenta, avanzarCrecida, nivelArroyo, aguaTurbia, horasEntre, puedeCaerRayo, elegirArbolRayo, rumboTexto as rumboDesde } from './tormenta.js';
import { crearMajada } from './majada-mundo.js';
import { calidadParaEquipo, nombrePlaca } from './calidad-equipo.js';
import { cargarAjustes, guardarAjustes, cargarProgreso, guardarProgreso, guardarFotos, progresoNuevo, borrarProgreso, origenUltimaCarga, usarModoGuardado, listaPartidas, borrarPartida, guardarVista, ranuraActual, leerPartida, escribirPartida, infoPartida } from './guardado.js';
import { htmlPartidas, CSS_PARTIDAS } from './partidas.js';
import { empaquetar, leerPaquete, avisoImportar, nombreArchivoPartida } from './transferir.js';
import { nombreSync, tocaCopiar, compararCopia, textoOferta as textoOfertaSync, textoDosCambiaron } from './sincronia.js';
import { crearEstadoAutocalidad, revisarCalidad, reiniciarMedicion, sincronizarCalidad } from './autocalidad.js';
import { crearMando, girarMirada } from './mando.js';
import { RECORRIDO, crearCorrida, anotarCuadro, informeBanco, nombreArchivoBanco, duracionBanco } from './banco.js';
import { resumenPartida, htmlParte, textoParte, CSS_PARTE } from './parte.js';
import { estadoFotoInicial, aplicarControl, textoControl, htmlPanelFoto, nombreArchivoFoto, AYUDA_FOTO, CSS_FOTO } from './foto-modo.js';
import { riesgoDePeligros, avanzarCalma, calmaDe, acercamientos, quietoDeVerdad } from './percepcion.js';
import { afinarOido, mezclaAlEscuchar, queCantaCerca, textoEscucha, rumboDe } from './oido.js';
import { escarchaDe } from './escarcha.js';
import { TECHO_DE_LUGAR, techoDeObra, crearMapaCubiertas } from './techo-lluvia.js';
import { datosLamina, nombreArchivoLamina } from './lamina.js';
import { apilarSubtitulo, renglonSubtitulo, pulsoVibracion, dejarVibrar } from './desafio-sentidos.js';
import { fichaBestiario, BESTIARIO } from './desafio-noche2.js';
import { CANTOS, ESPECIE_DE_METODO, anotarCanto, queGrabar, siguienteGrabacion, quienContesta } from './grabador.js';
import { RASTROS, elegirRastro, trazarRastro, arranque, huellaCerca, haciaDondeVa, hayQueAlargar, VIDA_RASTRO, envejecer } from './rastros.js';
import { crearRastrosMalla } from './rastros-malla.js';
import { horasHasta, frente, frasePronostico } from './pronostico.js';
import { cuandoSeVe, avisoDeEstacion } from './almanaque.js';
import { SALUDO_ENOJADO } from './desafio-valle.js';
import { CONSERVAS, sanearTendal, usarTendal, avanzarSecado, avisoTendal, queAbrir, AL_ABRIR } from './conservas.js';
import { COLMENA, sanearColmena, avanzarColmena, usarColmena, avisoColmena, cosechaConAbejas, seAlborotan } from './colmena.js';
import { AHUMADERO, sanearAhumadero, teLaQuedas, avanzarAhumado, usarAhumadero, avisoAhumadero } from './ahumadero.js';
import { VIVERO, ARBOLES_VIVERO, sanearVivero, sanearJuntadas, puedeJuntarSemilla, usarVivero, avisoVivero, plantinDisponible } from './vivero.js';
import { LENA, sanearLenera, sanearHumedad, humedecer, guardarEnLenera, avisoLenera, lenaParaPrender, horasEntumecido, desentumecer } from './lena.js';
import { MOLINO, sanearAserradero, sanearMuela, fuerzaDelAgua, horasDesde, avanzarAserradero, aserrando, avanzarMuela, moliendo, molinoQueMueve, usarAserradero, avisoAserradero, usarMolino, avisoMolino } from './molino.js';
import { crearMolinoMundo } from './molino-mundo.js';
import { crearMeteoMundo } from './meteo-mundo.js';
import { sanearMeteo, crearPrograma, pronostico as pronosticoMeteo, nochesQueVienen, textoPronostico, horaAbsoluta } from './meteo.js';
import { sanearRadio, escucharRadio, cumplirPedido, pedidoRadio, alcanzaPedido, textoPide as textoPideRadio, nombreEstacionRadio } from './radio.js';
import { MAQUINAS_QUE_TRABAJAN } from './planos-maquinas.js';
import { comoDormiste, horasDescansado, gastarDescanso, casaCerrada } from './abrigo.js';
import { chimeneaDe, ventanasEncendidas, brilloVentanas, VENTANAS } from './casa-viva.js';
import { crearVentanas } from './ventanas-mundo.js';
import { buscarCorral, corralNuevo, mudarCorral, CORRAL as CORRAL_PROPIO } from './corral.js';
import { TINTES, ORDEN_TINTES, siguienteTinte, costoTinte } from './tintes.js';
import { FOGON, seQuedaAlFuego, cuentoPara, esHoraDeCuentos, LOMO, duracionLomo, nocheDeLomo, alturaLomo, dondeAsoma } from './cuentos.js';
import { normalizarCodigo, codigoDeLaSemana, sanearRecordsSemilla } from './semilla.js';
// 3.0: la supervivencia sin fin y el mapa del Desafío que cambia con la semilla
import { codigoAlAzar } from './semilla.js';
import { RANURA_SIN_FIN } from './guardado.js';
import { corridaNueva, registrarCorrida, sanearRecordsSinFin, listaDeCodigo, lineaRecord, resumenCorrida } from './desafio-supervivencia.js';
import { mapaDesafio, mapaGuardadoNuevo, codigoAlAzarEnElRefugio } from './desafio-mapa.js';
import { dibujarLamina, cargarImagen } from './lamina-dibujo.js';
import { paletaMusical, esperaHastaFrase, mezclaPorHora } from './musica-relax.js';
import { crearTraductor, traducirDom } from './idioma.js';
import { EN } from './idioma-en.js';
import { NIDO } from './desafio-nido.js';
import { sanearChinches, ponerChinche, chincheCerca, sacarChinche, rumboHacia, textoDistancia, marcasAutomaticas, nombreLibre, MAX_CHINCHES } from './chinches.js';
import { PASOS_RELAX, PREMIO_RELAX, avanzarRelax, dibujarPasos } from './relax-tutorial.js';
// 3.1: la historia guiada y los eventos del valle con decisiones (ver historia-ui.js)
import { crearValleUi } from './historia-ui.js';
import { resumirBase, htmlBase, CSS_BASE } from './base-estado.js';
import { vidaMaxObra } from './desafio-reglas.js';
import { TECLAS_POR_DEFECTO, NOMBRES_ACCIONES, ACCIONES_TECLA, esFija, sanearMapaTeclas, accionDeTecla, cambiarTecla, textoTecla, mapaPorDefecto, escalaLetra, colorDe, apilarAviso, subtitulos } from './accesibilidad.js';
import { crearDesafio } from './desafio.js';
import { crearBanco } from './desafio-sonidos.js';
import { fusionarPorMaterial } from './fusion.js';
import { dibujarLogros, CSS_LOGROS } from './desafio-logros.js';
import { crearLogrosRelax } from './logros-relax.js';
import { crearSteam } from './steam.js';
import { datosAlbum, htmlAlbum, nombreArchivoAlbum } from './album.js';
import { htmlGuia, CSS_GUIA } from './guia.js';
import { sanearTalados, avanzarRebrote, apurarRebrote, resumenBosque, DIAS_QUE_APURA_UN_RENOVAL } from './bosque.js';
// 2.8: personalización (ver personalizacion.js y personal-todo.js)
import { secciones, sanearPersonal } from './personal-todo.js';
import { templarNoche } from './personal-personaje.js';
import { sanearInterfaz, escalaFinal, colorAcento, MIRAS } from './personal-interfaz.js';
import { empezarConReceta, factorAnimales, vecinosActivos } from './personal-partida.js';
import { crearCuerpoJugador, crearManoPropia } from './personal-personaje-mundo.js';
import { crearBanderaMundo, texturaBandera, pintarBanderaEn } from './personal-bandera-mundo.js';
// 3.1: carreras contrarreloj, desafío del día y torneo de la semana (ver modos-juego.js)
import { crearModos, CSS_MODOS } from './modos-juego.js';
// 3.5.1: las preguntas del juego (Electron no tiene prompt y confirm traba la ventana)
import { crearDialogos } from './dialogo.js';

const $ = (id) => document.getElementById(id);
const HOJARASCA_DEBUG = new URLSearchParams(location.search).get('debug') === '1';
// 3.7.0: la gente de antes (la de la 3.6), sólo para comparar en depuración (`?debug=1&gente=vieja`)
const GENTE_VIEJA = HOJARASCA_DEBUG && new URLSearchParams(location.search).get('gente') === 'vieja';
const esperar = () => new Promise((r) => setTimeout(r, 30));

// 2.7.3: ¿es la primera vez que se abre el juego? (antes de leer los ajustes)
const primeraVez = (() => { try { return localStorage.getItem('hojarasca-ajustes-v1') === null; } catch { return false; } })();
const ajustes = cargarAjustes();
// 2.7.3: la primera vez, la calidad según la placa: integrada (la mayoría de las
// notebooks) arranca en baja; sin driver de video, en muy baja. Después manda el jugador.
if (primeraVez) { ajustes.calidad = calidadParaEquipo(nombrePlaca()); guardarAjustes(ajustes); }
// Relax (el recorrido tranquilo de siempre) o Desafío (invasores cada noche).
// Cada modo carga su propia partida; cambiar de modo en el menú recarga el mundo.
const modoJuego = usarModoGuardado(ajustes.modo, ajustes.ranura);
const esDesafio = modoJuego === 'desafio';
// 3.0: la supervivencia sin fin juega en su propia ranura: una corrida nunca pisa una campaña
const esSinFin = esDesafio && ajustes.desafioTipo === 'sinfin';
if (esSinFin) usarModoGuardado('desafio', RANURA_SIN_FIN);
let desafio = null;
const ultimaTeclaEsquiva = { code: '', t: 0 };
// Las defensas sólo existen en el Desafío: en Relax el catálogo queda como siempre.
const CATEGORIAS_CONSTRUCCION = CATEGORIAS_TODAS.filter((c) => !c.soloDesafio || esDesafio);
// y al revés: la huerta es del Relax (en el Desafío el tiempo es para defenderse)
const PLANOS_JUEGO = PLANOS.filter((p) => (!p.soloDesafio || esDesafio) && (!p.soloRelax || !esDesafio));
let progreso = cargarProgreso();
let reiniciandoPartida = false;
const origenGuardado = origenUltimaCarga();
const habiaGuardado = !!progreso;
if (!progreso) progreso = progresoNuevo();
// 3.0: una corrida terminada no se sigue: la ranura queda para la próxima (con tu ropa y tu bandera)
if (esSinFin && progreso.desafio?.sinFin?.terminada) { const personal = progreso.personal; progreso = progresoNuevo(); progreso.personal = personal; }
if (esSinFin && progreso.desafio && !progreso.desafio.sinFin) progreso.desafio.sinFin = corridaNueva();
// 1.6: teclas propias, mando y accesibilidad
let teclasPropias = sanearMapaTeclas(ajustes.teclas);
// Una tecla del jugador llega traducida a la de fábrica: el resto del juego no se entera.
// Y la tecla de fábrica que quedó libre deja de hacer lo que hacía antes.
let huerfanas = new Set();
function recordarHuerfanas() {
  huerfanas = new Set(ACCIONES_TECLA.filter((a) => teclasPropias[a] !== TECLAS_POR_DEFECTO[a]).map((a) => TECLAS_POR_DEFECTO[a]));
  for (const a of ACCIONES_TECLA) huerfanas.delete(teclasPropias[a]);
}
function codigoCanonico(code) {
  const accion = accionDeTecla(teclasPropias, code);
  if (accion) return TECLAS_POR_DEFECTO[accion];
  return huerfanas.has(code) ? 'SinAsignar' : code;
}
// 1.8: el juego está escrito en castellano y se traduce en la salida. Con idioma
// 'es' el traductor devuelve el texto tal cual y no cuesta nada.
const traductor = crearTraductor(ajustes.idioma === 'en' ? EN : {}, ajustes.idioma || 'es');
const T_ = (texto) => traductor.t(texto);
const traducirPanel = (nodo) => { if (traductor.idioma !== 'es') traducirDom(nodo, T_); };

recordarHuerfanas();
const mando = crearMando({ sensibilidad: ajustes.sensibilidad, invertirY: ajustes.invertirY });
const calidadInicial = ajustes.calidad;
const calidad = { ...(CALIDADES[ajustes.calidad] || CALIDADES.media) };
// 3.5: la calidad que está andando y las distancias que rigen (ver aplicarDistancias)
let calidadActiva = CALIDADES[calidadInicial] ? calidadInicial : 'media';
let distActual = distanciasDe(calidadActiva, ajustes.distancia, ajustes.distanciaPlantas);
// 1.6: el juego mide los cuadros por segundo reales y acomoda la calidad solo.
const autoCalidad = crearEstadoAutocalidad(ajustes.calidad);

// ------------------------------------------------------------------ render
const lienzo = $('mundo');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !!calidad.antialias, powerPreference: 'high-performance' });
} catch (err) {
  // 2.7.3: antes de rendirse, el juego se reinicia probando otra forma de iniciar el 3D
  // (casi siempre es el driver, no la falta de placa). Si ya se probaron todas, los pasos.
  $('carga-texto').textContent = 'Probando otra forma de iniciar los gráficos 3D…';
  Promise.resolve(window.hojarasca?.fallaronGraficos?.()).then((reintenta) => {
    if (reintenta) return;
    $('carga-texto').textContent = 'Tu equipo no pudo iniciar los gráficos 3D. Hojarasca anda con la placa integrada de cualquier notebook: '
      + 'actualizá el controlador de video desde Windows Update o la página de Intel, AMD o NVIDIA y volvé a abrir el juego.';
  }).catch(() => {});
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, calidad.pixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = calidad.sombras > 0;
// 2.7: en three r186 PCFSoftShadowMap ya no existe (cae a PCFShadowMap con aviso): la
// sombra suave es la misma PCF con disco de Vogel, y el ancho del borde lo da
// `shadow.radius` (ver cielo.js, calidad.sombraSuave).
renderer.shadowMap.type = THREE.PCFShadowMap;
// 2.7: el detalle material (texturas procedurales y hojas en tarjetas) se decide por
// calidad al arrancar, igual que la densidad del bosque
configurarTexturas(calidad, renderer);
// las sombras se recalculan cada varios cuadros, no en todos
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;   // el primer mapa se calcula enseguida
// 3.5.4: al volver el contexto 3D, three r186 arma de nuevo sus administradores (geometrías,
// texturas, render targets, mallas instanciadas) pero cada objeto ya subido conserva el oyente
// de 'dispose' del administrador viejo, que guarda todo lo del contexto perdido (búferes, VAO,
// programas, sus tablas): ~10 MB y miles de objetos de WebGL más por cada recuperación, para
// siempre. Se anota (sin retenerlo: WeakRef) cada objeto al que three le pone ese oyente y, al
// perderse el contexto, se le avisa 'dispose': los administradores viejos lo sueltan. Al volver
// a dibujarlo, three lo sube con los nuevos (lo mismo que ya hacía). El juego no escucha 'dispose'.
const subidosATres = new Set();
let anotadosEnTres = new WeakSet(), altasEnTres = 0;
{
  const despachador = Object.getPrototypeOf(THREE.BufferGeometry.prototype);
  const agregar = despachador.addEventListener;
  despachador.addEventListener = function (tipo, oyente) {
    if (tipo === 'dispose' && !anotadosEnTres.has(this)) {
      anotadosEnTres.add(this); subidosATres.add(new WeakRef(this));
      if (++altasEnTres % 4096 === 0) for (const r of subidosATres) if (!r.deref()) subidosATres.delete(r);
    }
    return agregar.call(this, tipo, oyente);
  };
}
function soltarContextoViejo() {
  const vivos = [];
  for (const r of subidosATres) { const o = r.deref(); if (o) vivos.push(o); }
  subidosATres.clear(); anotadosEnTres = new WeakSet();
  for (const o of vivos) { try { o.dispatchEvent({ type: 'dispose' }); } catch { /* sigue con el resto */ } }
  return vivos.length;
}
const escena = new THREE.Scene();
// 2.2: el repaso de matrices salta lo que no se ve. De los ~2300 objetos que recorría
// en cada cuadro, dos de cada tres estaban adentro de grupos ocultos (bichos y fauna
// lejos, gente que no está, lo de la noche de día). Es el mismo repaso de three r186,
// salvo que un hijo oculto de la escena no se recorre; cuando vuelve a verse se
// recalcula entero una vez, así nunca se dibuja con una posición vieja.
escena.updateMatrixWorld = function (forzar) {
  if (this.matrixAutoUpdate) this.updateMatrix();
  if (this.matrixWorldNeedsUpdate || forzar) {
    if (this.matrixWorldAutoUpdate === true) this.matrixWorld.copy(this.matrix);
    this.matrixWorldNeedsUpdate = false;
    forzar = true;
  }
  const hijos = this.children;
  for (let i = 0, n = hijos.length; i < n; i++) {
    const h = hijos[i];
    if (!h.visible) { h.__sinRepaso = true; continue; }
    if (h.__sinRepaso) { h.__sinRepaso = false; h.updateMatrixWorld(true); } else h.updateMatrixWorld(forzar);
  }
};
const camara = new THREE.PerspectiveCamera(ajustes.fov || 70, window.innerWidth / window.innerHeight, 0.15, 8000);
// 2.7.4: cuando el LOD o el tren están por cambiar la cantidad de luces, los programas de
// la cantidad nueva se compilan de a poco antes de que haga falta (ver luces.js)
const variantesLuces = crearVariantesLuces(renderer, escena, camara, {
  objetivo: () => (post && ajustes.post !== 'apagado' ? post.destino : null),
});
// 3.3: presupuesto fijo de luces (ver luces.js): three ve siempre la misma cantidad de luces
// puntuales y focos, así los programas quedan hechos al cargar y no hay tirones al aparecer
// un edificio con luces o el tren. Las luces del juego se copian a ésas en cada cuadro.
const presupuestoLuces = crearPresupuestoLuces(escena, camara);
presupuestoLuces.activar();
// 3.5.4: en el modo foto el mouse es de la cámara: ni la rueda ni los clics usan lo que tenés en
// la mano (antes el clic derecho comía, prendía la linterna o sacaba la caña con la hora congelada,
// y el izquierdo atacaba en el Desafío o tiraba la línea), como E, F y O desde la 3.5.1
window.addEventListener('wheel', (e) => {
  if (modo !== 'jugando' || mochilaAbierta || foto.activo) return;
  if (charla.menu) { moverMenuCharla(e.deltaY > 0 ? 1 : -1); return; }   // 3.6 (vida): el menú de la charla
  if (listaHudAbierta()) { marcarHud(e.deltaY > 0 ? 1 : -1); return; }   // 3.6.2: la marca del almacén, la feria o las cargas
  if (modoObra && obras) {
    obras.girar(e.deltaY > 0 ? 1 : -1);
    dibujarPanelObra();
    return;
  }
  elegirRanura(elegida + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
window.addEventListener('contextmenu', (e) => { if (modo === 'jugando') e.preventDefault(); });
// botón derecho: usar lo que tenés en la mano
window.addEventListener('mousedown', (e) => {
  if (e.button !== 2 || modo !== 'jugando' || mochilaAbierta || foto.activo) return;
  e.preventDefault();
  // Desafío: con la lanza, el clic derecho sostenido bloquea; la pistola mejorada dispara cargado
  const id = ranuras[elegida]?.id;
  if (desafio && !desafio.caido && !modoObra) {
    // 2.5: con el carcaj, el arco cambia de flecha; con la lanza o el escudo de tablas, bloquea
    if (id === 'arco' && desafio.cambiarFlecha()) { refrescarBarra(true); return; }
    if (desafio.atacarAlterno(id)) { refrescarBarra(true); return; }
    if (desafio.puedeBloquear(id)) { desafio.bloquear(true, id); return; }
  }
  usarRanura();
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 2 && desafio?.bloqueando) desafio.bloquear(false);
  // 2.5: el arco tensado sale al soltar el clic
  if (e.button === 0 && desafio?.tensando) {
    if (ranuras[elegida]?.id === 'arco' && modo === 'jugando' && !mochilaAbierta && !modoObra && !desafio.tallerAbierto) { desafio.soltarTension(); refrescarBarra(true); }
    else desafio.cancelarTension();
  }
});
window.addEventListener('blur', () => { if (desafio?.bloqueando) desafio.bloquear(false); desafio?.cancelarTension?.(); });
// Desafío: clic izquierdo ataca con el arma en la mano (la caña de pescar conserva su clic)
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || !desafio || modo !== 'jugando' || mochilaAbierta || modoObra || desafio.caido || foto.activo) return;
  if (panelDelHudAbierto()) return;   // 3.6.2: con el taller (o el almacén del valle) abierto, el clic no ataca
  if (!jugador?.bloqueado() || pesca?.est.equipada) return;
  const js = jugador.estado;
  if (js.enKayak || js.enTren || js.sentado) return;
  const id = ranuras[elegida]?.id;
  // 2.5: con el arco, el clic sostenido tensa (sale al soltar, más fuerte cuanto más tensaste)
  if (id === 'arco' && desafio.tensar()) return;
  desafio.atacar(id);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  if (post) post.redimensionar(window.innerWidth, window.innerHeight);
});

let modo = 'carga';
let T, veg, est, objetos, fauna, clima, jugador, huellas, cielo, constelaciones, fugaces, pasto, mapa, col, vida, bichos, gente, perro, tren, pesca, kayak, fotos, linterna;
let vela = null, tirolesas = null;   // 2.9: ver vela.js y tirolesa.js
let modos = null;   // 3.1: carreras, desafío del día y torneo (ver modos-juego.js)
// 3.6.1: alrededor de la aldea (desde el borde de sus calles y edificios) no se construye
const MARGEN_SIN_OBRAS = 6, AVISO_SIN_OBRAS = 'En la Aldea de los Duendes no: los lotes son para los que llegan';
let aldeaMundo = null;   // 3.6: la Aldea de los Duendes en el mundo (ver aldea-mundo.js; sólo en el Relax)
let mecanicasAldea = null;   // 3.6 (mecánicas): ver aldea-mecanicas-mundo.js (sólo en el Relax)
const sonido = new Sonido();
sonido.volumen = ajustes.volumen;
sonido.musicaActiva = ajustes.musica;
// 2.1: el grabador (ver `grabador.js`). Cada vez que canta un ave que se puede grabar,
// queda anotado dónde y cuándo. Lo que suena desde el grabador mismo no cuenta.
const cantosOidos = [];
let reproduciendoCanto = false;
for (const [metodo, especie] of Object.entries(ESPECIE_DE_METODO)) {
  const original = sonido[metodo];
  if (typeof original !== 'function') continue;
  sonido[metodo] = function (pos, ...resto) {
    if (!reproduciendoCanto) anotarCanto(cantosOidos, especie, pos, performance.now() / 1000);
    return original.call(this, pos, ...resto);
  };
}

// 2.2: cada etapa anota cuánto tardó (se ve con ?debug=1 en __hojarasca.__carga)
const tiemposCarga = [];
// 2.7.4: de dónde salió lo pesado de la carga (caché, Worker o calculado); ?debug=1
const infoCarga = { terreno: {} };
async function paso(texto, avance, fn) {
  $('carga-texto').textContent = texto;
  $('carga-barra').style.width = `${avance}%`;
  await esperar();
  const t0 = performance.now();
  const r = await fn();
  tiemposCarga.push({ texto, ms: Math.round(performance.now() - t0) });
  return r;
}

// ------------------------------------------------------------------ construir el mundo
async function construir() {
  // 2.7.4: las texturas se consiguen (de la caché de la carga o en un Worker) mientras se
  // arma el valle, y el valle también sale de la caché si está (si no, se calcula soltando
  // la pantalla de a ratos). Cada etapa espera sólo lo que usa; los bytes son los mismos.
  const texturasEnCamino = prepararTexturas();
  T = await paso('Levantando los cerros', 5, () => cargarTerreno({ info: infoCarga.terreno }));

  await paso('Asentando el suelo', 20, () => {
    const alt = new Uint16Array(N * N);
    for (let i = 0; i < N * N; i++) alt[i] = THREE.DataUtils.toHalfFloat(T.alturas[i]);
    const texAlt = new THREE.DataTexture(alt, N, N, THREE.RedFormat, THREE.HalfFloatType);
    texAlt.magFilter = texAlt.minFilter = THREE.LinearFilter;
    texAlt.needsUpdate = true;
    U.uAlturas.value = texAlt;
    const masc = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const hum = smoothstep(9, 0.5, T.distRio[i] - T.anchoRio[i]) * 0.9;
      masc[i * 4] = T.pasto[i] * 255;
      masc[i * 4 + 1] = smoothstep(2.8, 0.7, T.distSendero[i]) * 255;
      masc[i * 4 + 2] = hum * 255;
      masc[i * 4 + 3] = T.bosque[i] * 255;
    }
    const texM = new THREE.DataTexture(masc, N, N, THREE.RGBAFormat);
    texM.magFilter = texM.minFilter = THREE.LinearFilter;
    texM.needsUpdate = true;
    U.uMascara.value = texM;
    // la estepa va en su propia textura: los cuatro canales de la máscara ya están usados
    const estep = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const v = (T.estepa ? T.estepa[i] : 0) * 255;
      // (3.5: el azul, que nadie leía, queda para los pisos de las construcciones: marcarPisos)
      // (3.5: y el alfa marca el agua, lago y ríos (0): ahí no salen helechos ni pasto)
      estep[i * 4] = v; estep[i * 4 + 1] = v; estep[i * 4 + 2] = 0; estep[i * 4 + 3] = T.agua((i % N) * 2 - 512, Math.floor(i / N) * 2 - 512) ? 0 : 255;
    }
    const texE = new THREE.DataTexture(estep, N, N, THREE.RGBAFormat);
    texE.magFilter = texE.minFilter = THREE.LinearFilter;
    texE.needsUpdate = true;
    U.uEstepa.value = texE;
    // el canal verde marca lo que está bajo techo: ahí no se acumula nieve
    texturaEstepa = { tex: texE, datos: estep, n: N };

    const seg = Math.min(RES, calidad.terrenoDetalle || RES);
    const salto = RES / seg;
    const geo = new THREE.PlaneGeometry(1024, 1024, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) {
      p.setY(j * (seg + 1) + i, T.alturas[Math.round(j * salto) * N + Math.round(i * salto)]);
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const suelo = new THREE.Mesh(geo, materialTerreno());
    suelo.name = 'terreno';
    suelo.receiveShadow = true;
    suelo.matrixAutoUpdate = false;
    escena.add(suelo);
  });

  agua = await paso('Llenando el lago', 30, () => crearAgua(T, escena));
  cascada = crearCascada(T, escena, U);
  cielo = await paso('Pintando el cielo', 36, async () => { await esperarTexturas('montana'); return crearCielo(escena, calidad); });
  constelaciones = crearConstelaciones(escena);
  fugaces = crearFugaces(escena);
  mallaRastros = crearRastrosMalla(escena, T);
  if (calidad.post) post = crearPostproceso(renderer, escena, camara, calidad);
  niebla = crearNiebla(T, escena, calidad);
  flotantes = crearFlotantes(escena, calidad, T);
  aves = crearAves(escena, calidad);
  veg = await paso('Plantando el bosque andino-patagónico', 45, () => generarVegetacion(T, calidad, escena));
  // 3.3: impostores de los árboles lejanos (se hornean una vez, con el renderer ya creado)
  veg.prepararImpostores(renderer);
  // 3.6: la Aldea de los Duendes (sólo en el Relax). Su terreno se empareja DESPUÉS de plantar el
  // bosque (la lista de árboles no cambia: los talados guardados siguen valiendo) y antes de las
  // estructuras; la malla del suelo y las alturas del pasto se rehacen ahí. El sorteo de sitios de
  // estructuras.js mira el terreno de antes (`sorteoAldea`): nada más del valle se mueve.
  let sorteoAldea = null;
  if (!esDesafio) {
    aldeaMundo = crearAldeaMundo({ T, escena, veg, calidad, progreso: () => progreso, brilloVentana: (v, f, dia) => brilloVentana(v, f, dia), alCambiar: () => marcarTechos() });
    sorteoAldea = aldeaMundo.emparejar();
    // 3.6.1: la aldea no es lugar para tus obras ni tus renovales (construccion.js y renovales.js
    // preguntan acá): antes, en la plaza despejada o adentro de la biblioteca, el plano daba verde
    T.sinObras = (x, z, radio = 0) => (distanciaAldea(x, z) < radio + MARGEN_SIN_OBRAS ? AVISO_SIN_OBRAS : null);
  }
  col = crearColisiones();
  veg.colisiones.forEach((c) => col.agregar(c));
  est = await paso('Clavando los tablones del muelle', 68, () => {
    puertas = crearPuertas(T, escena, col, sonido);
    // 3.6: en el Relax el almacén y la casa de té se arman en la aldea (el sorteo corre igual)
    const e = crearEstructuras(T, escena, col, veg, puertas, aldeaMundo ? { aldea: aldeaMundo.sitiosValle(), sorteo: sorteoAldea } : undefined);
    // el pasto no crece adentro de las casas ni al pie del faro
    const masc = U.uMascara.value.image.data;
    const pelar = (x, z, radio) => {
      const i0 = Math.max(0, Math.floor((x - radio + 512) / 2)), i1 = Math.min(RES, Math.ceil((x + radio + 512) / 2));
      const j0 = Math.max(0, Math.floor((z - radio + 512) / 2)), j1 = Math.min(RES, Math.ceil((z + radio + 512) / 2));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i * 2 - 512 - x, j * 2 - 512 - z);
        if (d < radio) masc[(j * N + i) * 4] *= Math.min(1, (d / radio) ** 2);
      }
    };
    // nada de árboles ni matas adentro de las construcciones
    const limpiar = (l, radio, pastoRadio) => {
      if (!l) return;
      veg.despejar(l.x, l.z, radio);
      pelar(l.x, l.z, pastoRadio ?? radio);
    };
    limpiar(T.lugares.refugio, 9.5, 8.5);
    limpiar(e.casaTe, 7.5);
    limpiar(e.molino, (e.molino?.radio || 7.5) + 0.5, 6.2);
    limpiar(e.torre, 10);
    if (e.galpon) { veg.despejar(e.galpon.x, e.galpon.z, e.galpon.radio || 24); pelar(e.galpon.x, e.galpon.z, 13); }
    if (e.almacen) { veg.despejar(e.almacen.x, e.almacen.z, 9); pelar(e.almacen.x, e.almacen.z, 7); }
    if (e.cueva) { veg.despejar(e.cueva.x, e.cueva.z, 10); pelar(e.cueva.x, e.cueva.z, 11); }
    limpiar(e.faro, (e.faro?.radio || 6.2) + 0.8, 6.2);
    for (const cab of e.cabañas) limpiar(cab, (cab.radio || 4) + 1.5);
    // Una sola lista de zonas ocupadas por arquitectura. Antes faltaban faro,
    // almacén, galpón y cueva, así que el poblador del mundo podía dejar
    // ramitas, piedras o frutos atravesando pisos/interiores.
    const zona = (o, radio) => o ? { ...o, radio: radio ?? o.radio ?? 4 } : null;
    edificios = [
      zona(T.lugares.refugio, 9.5),
      zona(e.casaTe, e.casaTe ? (e.casaTe.radio || 7.5) + 1.0 : 7.5),
      zona(e.molino, e.molino?.radio || 7.5), zona(e.torre, 10), zona(e.faro, e.faro?.radio || 6.2),
      zona(e.almacen, e.almacen?.radio || 9), zona(e.galpon, e.galpon?.radio || 24), zona(e.cueva, e.cueva?.radio || 9),
      ...e.cabañas.map((cab) => zona(cab, (cab.radio || 4) + 1.5)),
    ].filter(Boolean);
    limpiar(T.lugares.mirador, 9, 0);
    // 3.6: la aldea: árboles fuera de las plantas y las calles, calles de ripio pintadas, nada de
    // frutos ni plumas adentro de los edificios, y sus complejos en la lista del LOD
    if (aldeaMundo) {
      aldeaMundo.despejar();
      edificios.push(...aldeaMundo.zonasObjetos());
      aldeaMundo.montar({ est: e, col, puertas });
    }
    pelar(T.lugares.refugio.x, T.lugares.refugio.z, 6);
    if (e.molino) pelar(e.molino.x, e.molino.z, 4.5);
    if (e.casaTe) pelar(e.casaTe.x, e.casaTe.z, e.casaTe.radio + 2);
    if (e.torre) pelar(e.torre.x, e.torre.z, 4);
    for (const cab of e.cabañas) pelar(cab.x, cab.z, cab.radio + 1.5);
    if (e.faro) pelar(e.faro.x, e.faro.z, 5.2);
    U.uMascara.value.needsUpdate = true;
    return e;
  });
  tren = await paso('Tendiendo las vías de la trochita', 74, () => {
    // 3.6: en el Relax, la parada del sur es la de la Aldea de los Duendes (cartel y anuncios)
    // (3.6: `lugaresAntes`: dónde estaban la casa de té y el almacén, para el nombre de antes de cada parada)
    const t = crearTrochita(T, escena, col, sonido, { cartel: est.cartel, sentaderos: est.sentaderos, aldea: esDesafio ? null : { indice: PARADA_ALDEA.indice, nombre: NOMBRE_ALDEA }, lugaresAntes: est.lugaresSorteo || null });
    // lo del comercio guardado con el nombre de antes de la parada pasa al de ahora (3.6: la del
    // sur es la de la aldea, y la que se llamaba como la casa de té toma el nombre de lo que le
    // queda cerca). En dos pasos: un nombre nuevo puede ser el viejo de otra.
    if (progreso?.comercio) {
      const cambian = t.paradas.filter((p) => p.nombreAntes);
      cambian.forEach((p, i) => renombrarParada(progreso.comercio, p.nombreAntes, `\u0000parada-${i}`));
      cambian.forEach((p, i) => renombrarParada(progreso.comercio, `\u0000parada-${i}`, p.nombre));
    }
    aldeaMundo?.estacion(t.paradas.find((p) => p.aldea));   // 3.6: el galpón de cargas y el cartel de la aldea
    // el andén y el galpón se quedan con su espacio
    const masc = U.uMascara.value.image.data;
    for (const p of t.paradas) {
      const radio = p.chica ? 9 : 13;
      veg.despejar(p.x, p.z, radio);
      const i0 = Math.max(0, Math.floor((p.x - radio + 512) / 2)), i1 = Math.min(RES, Math.ceil((p.x + radio + 512) / 2));
      const j0 = Math.max(0, Math.floor((p.z - radio + 512) / 2)), j1 = Math.min(RES, Math.ceil((p.z + radio + 512) / 2));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(i * 2 - 512 - p.x, j * 2 - 512 - p.z);
        if (d < radio - 2) masc[(j * N + i) * 4] *= Math.min(1, (d / (radio - 2)) ** 2);
      }
    }
    U.uMascara.value.needsUpdate = true;
    // Las estaciones también reservan su huella antes de poblar el mundo.
    // Evita objetos coleccionables dentro del andén, galpón o sala de espera.
    for (const p of t.paradas) edificios.push({ x: p.x, z: p.z, radio: p.chica ? 10 : 14, nombre: p.nombre || 'Estación' });
    return t;
  });
  pasto = await paso('Dejando crecer el pasto', 78, async () => { await esperarTexturas('manchas'); const p = crearPasto(calidad); escena.add(p.malla); return p; });
  objetos = await paso('Escondiendo frutillas y plumas', 82, () => crearObjetos(T, veg, est, escena, progreso, edificios));
  // 2.8: cuántos animales, según la receta con que empezó la partida (Tu partida)
  fauna = await paso('Despertando la fauna patagónica', 86, () => crearFauna(T, veg, col, escena, sonido, registrar, progreso, { animales: factorAnimales(progreso) }));
  vida = await paso('Soltando cisnes en el lago', 88, () => crearVida(T, veg, col, escena, sonido, registrar, progreso));
  bichos = await paso('Escondiendo un panal en un tronco', 91, () => crearBichos(T, veg, col, escena, sonido, registrar, progreso, objetos));
  // 3.7.0: la gente al estilo P (gente-cuerpo.js), con la ropa de la estación en que arranca
  gente = await paso('Avisándole a la gente del puesto', 93, () => crearGente(T, escena, col, sonido, { invierno: inviernoDeAjustes(), estiloViejo: GENTE_VIEJA }));
  // 3.6.1: un asiento con un vecino sentado no se ofrece (objetos.js): te sentabas encima
  est.ocupado = (s) => gente.gente.some((g) => (g.pose === 'sentado' || g.pose === 'leyendo') && !g.dormido && Math.abs(g.pos.y - (s.y - 0.45)) < 1.2 && Math.hypot(g.pos.x - s.x, g.pos.z - s.z) < 0.4);
  perro = crearPerro(T, escena, col, sonido, registrar, progreso);
  clima = crearClima(escena, T, ajustes);
  clima.usarPrograma(programaDelTiempo());   // 2.9: el tiempo sale de la semilla de la partida (ver `meteo.js`)
  // 3.6.2: en el Relax, el mapa dibuja las calles y los edificios de la aldea (y ahí no pone bosque: el claro
  // llega hasta la escuela y el fondo de la calle de la Biblioteca, unos metros más allá de distanciaAldea)
  mapa = crearMapa(T, aldeaMundo ? { aldea: { ...planoAldeaMapa(), dentro: (x, z) => distanciaAldea(x, z) < 7 } } : null);
  jugador = crearJugador(camara, T, col, {
    lienzo,
    activo: () => modo === 'jugando',
    sensibilidad: () => ajustes.sensibilidad,
    invertirY: () => ajustes.invertirY,
    fov: () => ajustes.fov,
    movimientoCamara: () => ajustes.movimientoCamara,
    invierno: () => U.uInvierno.value,
    otono: () => U.uOtono.value,
    alSoltar: () => { if (modo === 'jugando') abrir('pausa'); },
    alBloquear: () => {},
    alKayak: (dt, tecla) => kayak.actualizar(dt, tecla, jugador, U.uTiempo.value),
    // 2.9: arriba del velero se navega con él; colgado de la tirolesa, el cable lleva
    alVela: (dt, tecla) => vela?.actualizar(dt, tecla, jugador, U.uTiempo.value),
    alCable: (dt) => tirolesas?.andar(dt, jugador),
    traducirTecla: codigoCanonico,
  });
  escena.add(camara);
  huellas = crearHuellas();
  pesca = crearPesca(T, escena, camara, sonido, (t, sub) => nota(t, sub), atrapar);
  kayak = crearKayak(T, escena, camara, col, sonido);
  fotos = crearFotos(T, camara);
  linterna = new THREE.SpotLight(0xfff0d8, 0, 42, 0.42, 0.5, 1.2);
  linterna.position.set(0.12, -0.08, 0);
  linterna.target.position.set(0, -0.6, -6);
  camara.add(linterna, linterna.target);
  registrarLuz(linterna);   // 2.7.4: ver luces.js

  const ref = T.lugares.refugio;
  chimeneas = [ref.chimenea, ...est.cabañas.map((c) => c.chimenea)];
  marcarTechos();
  marcarPisos();   // 3.5
  renovales = crearRenovales(T, escena, col);
  majadaMundo = crearMajada(T, escena);
  caballoMundo = esDesafio ? null : crearCaballo(T, escena);
  majadaMundo?.refrescarLana(majada(), progreso.dia);
  desalojo = { obras: { mudadas: 0, desarmadas: 0 }, renovales: { mudados: 0, devueltos: 0 }, carpa: null, materiales: {} };   // 3.6.2
  progreso.renovales = desalojarRenovales(progreso.renovales);   // 3.6.2: (antes, renovales.sincronizar)
  renovales.actualizar(progreso.dia);
  // el mundo se genera con todos los árboles en pie: acá se vuelven a sacar los talados
  progreso.talados = sanearTalados(progreso.talados, veg.arboles.length);
  revisarRebrote(true);
  progreso.tormenta = sanearTormenta(progreso.tormenta, veg.arboles.length);
  if (progreso.tormenta.rayo) {
    const r = progreso.tormenta.rayo, a = veg.arboles[r.i];
    if (!a || a.sacado || !veg.derribarPorRayo(a, { x: r.dx, z: r.dz }, true)) progreso.tormenta.rayo = null;
  }
  refugioVivo = crearRefugioVivo(T, escena);
  refugioVivo.reconstruir(progreso);
  // RC31: fotos, leña y objetos persistentes del refugio comparten la misma
  // unidad de visibilidad que el edificio. Evita cuadros/props flotando cuando
  // el complejo sale del presupuesto de distancia.
  const raizRefugio = est.conjuntos?.find((c) => c.clave === 'refugio')?.obj;
  if (raizRefugio && refugioVivo.grupo) raizRefugio.attach(refugioVivo.grupo);
  prepararVisibilidad();
  enMano = crearEnMano(camara);
  obras = crearConstruccion(T, escena, col, veg, puertas);
  // 2.4.1: las obras de un plano que esta versión no conoce (una partida de la otra PC,
  // con una versión más nueva) no se arman, pero tampoco se pierden: vuelven al guardar.
  obrasAjenas = (progreso.obras || []).filter((d) => d && !PLANO[d.plano]);
  desalojarObras(progreso.obras || []);   // 3.6.2: (antes, obras.sincronizar)
  progreso.obras = obras.obras.map((o) => o.datos);
  desalojarCarpa();   // 3.6.2
  avisoDesalojo = textoDesalojo(desalojo);
  if (desalojo.materiales) for (const [k, n] of Object.entries(desalojo.materiales)) if (n > 0) sumarMaterial(k, n);
  matasHuerta = crearMatasHuerta(escena);
  refrescarHuerta();
  gallinasMundo = crearGallinas(T, escena);
  refrescarGallineros();
  // 2.4: las ventanas de tu casa, el corral propio y el kayak amarrado en tu embarcadero
  ventanasMundo = crearVentanas(escena);
  refrescarCorral();
  amarrarKayak();
  // 2.9: el velero (aparece con el primer varadero) y las tirolesas y puentes colgantes
  vela = crearVela(T, escena, col, sonido, { obras: () => obras, clima: () => clima, nota: (t, sub, nueva) => nota(t, sub, nueva), cargado: () => modo === 'jugando' });
  vela.cargar(progreso.vela);
  kayak.sumarBote(vela);
  tirolesas = crearTirolesas(T, escena, col, veg, sonido, { obras: () => obras, nota: (t, sub) => nota(t, sub) });
  // 3.1: carreras contrarreloj, desafío del día y torneo de la semana
  { const estilo = document.createElement('style'); estilo.textContent = CSS_MODOS; document.head.appendChild(estilo); }
  modos = crearModos({ T, escena, jugador, esDesafio, progreso: () => progreso, guardar: () => guardar(), nota: (t, sub, nueva) => nota(t, sub, nueva), sonido, api: syncApi, traducir: traducirPanel });
  // 3.1: rangos y oficios (en los dos modos). 3.6: y la gente de la aldea (sólo en el Relax)
  armarOficiosYAldea(esDesafio);
  aldeaMundo?.arrancar();   // 3.6: los edificios se arman en un Worker mientras termina la carga
  if (esDesafio) desafio = crearDesafio(T, escena, camara, col, obras, sonido, {
    progreso: () => progreso,
    jugador: () => jugador,
    nota: (t, sub, nueva) => nota(t, sub, nueva),
    guardar: () => guardar(),
    duracion: () => (ajustes.duracion === 'reloj' ? 1440 : ajustes.duracion),
    dificultad: () => ajustes.dificultad,
    calidad: () => calidadInicial,
    clima: () => ({ lluvia: clima?.estado?.lluvia || 0, nublado: clima?.estado?.nublado || 0, invierno: U.uInvierno.value, viento: clima?.estado?.viento || 0 }),
    // 2.3: la trochita varada (ver `desafio-varada.js`)
    tren: () => tren,
    // 2.8: sin vecinos (Tu partida), nadie se suma a tu base
    gente: () => (vecinosActivos(progreso) ? gente : null),
    perroPos: () => perro?.est?.pos,
    alGuardarObras: () => { progreso.obras = obras.obras.map((o) => o.datos); guardar(); },
    alVencer: (s) => mostrarVictoria(s),
    alTerminar: (s) => mostrarVictoria(s, true),
    alLogro: (id) => steamPuente.desbloquear('desafio', id),
    cuanto: cuantoRecurso,
    gastar: gastarRecurso,
    sumarMaterial: (k, n) => { sumarMaterial(k, n); refrescarBarra(true); },
    // 2.6: al lado del armero también se fabrica como en un banco
    cercaDeBanco: () => !!obras.tieneFuncionCerca('aserrar', jugador.estado.pos, 5.2) || !!obras.tieneFuncionCerca('armero', jugador.estado.pos, 5.2) ||
      (!!T.lugares.galpon && Math.hypot(jugador.estado.pos.x - T.lugares.galpon.x, jugador.estado.pos.z - T.lugares.galpon.z) < 9),
    gesto: () => enMano?.usar(),
    alCaer: () => caerEnDesafio(),
    alDerribar: (caidas) => {
      progreso.obras = obras.obras.map((o) => o.datos);
      const nombre = caidas[0]?.plano?.nombre || 'Una pieza';
      nota(`Cayó: ${nombre.toLowerCase()}`, caidas.length > 1 ? `Arrastró ${caidas.length - 1} ${caidas.length === 2 ? 'pieza' : 'piezas'} más` : 'Los invasores la derribaron', true);
      guardar();
    },
    alFabricar: (r) => { refrescarBarra(true); if (r?.da?.cosa) destellarRanura(r.da.cosa); },
    // 2.0: la linterna (para el reflejo de los ojos), los sonidos escritos, la mezcla
    // que se agacha y el mando que vibra
    linterna: () => ({ encendida: !!(linterna && linterna.intensity > 0), angulo: linterna?.angle ?? 0.42, alcance: linterna?.distance ?? 42 }),
    sonidoEscrito: (texto) => escribirSonido(texto),
    t: (texto) => T_(texto),
    agacharMezcla: (profundidad, sostener) => sonido.agachar?.(profundidad, sostener),
    vibrar: (evento, intensidad) => vibrarMando(evento, intensidad),
    // 3.1: el oficio de cazador
    alAbatir: (a) => ganarOficio('cazador', a?.def?.jefe ? XP.jefe : XP.abatido),
    pulso: () => factorPulso(nivelDe('cazador')),
  });
  elegida = Math.min(7, Math.max(0, progreso.ranura || 0));
  ponerCarpa();
  if (progreso.pos) jugador.ubicar(progreso.pos.x, progreso.pos.z, progreso.yaw, progreso.pos.y);
  else if (desafio?.baseMapa) { const b = desafio.baseMapa; jugador.ubicar(b.x, b.z, b.yaw); }   // 3.0: la base del mapa de la semilla
  else jugador.ubicar(ref.puerta.x, ref.puerta.z, ref.mira);
  // 2.8: lo personal: tu cuerpo, tu mano y tu bandera, y cada sección aplica lo guardado
  armarMundoPersonal();

  U.uOtono.value = ajustes.estacion === 'otono' ? 1 : 0;
  U.uInvierno.value = ajustes.estacion === 'invierno' ? 1 : 0;

  await paso('Afinando los sonidos del bosque', 94, async () => {
    // 2.7.4: los materiales piden sus texturas al compilarse: que ya estén
    await esperarTexturas();
    camara.position.set(ref.x, ref.y + 2, ref.z);
    veg.actualizar(camara.position);
    objetos.actualizar(camara.position);
    cielo.actualizar(progreso.horas, clima.estado, camara.position, 0);
    // 3.6: si aparecés en la aldea (o a la vista de ella), se termina de armar antes de entrar
    if (aldeaMundo) {
      const p = jugador.estado.pos;
      if (Math.hypot(p.x - aldeaMundo.centro.x, p.z - aldeaMundo.centro.z) < calidad.lejos + 220) { await aldeaMundo.listo(); aldeaMundo.montarCola(); }
    }
    await variantesLuces.compilarCarga(jugador.estado.pos);   // 3.3: con el presupuesto fijo, todo y en paralelo; 2.7.4: antes renderer.compile(escena, camara); ver luces.js
    aldeaMundo?.trasCompilar();   // 3.6: las mallas que sólo estaban para compilar sus programas
    // 3.7.0: la sombra de la gente (piel por huesos) también se compila en la carga; el atlas de la
    // gente se pinta en la portada
    gente?.precalentar?.(camara, () => { renderer.shadowMap.needsUpdate = true; dibujar(null, 0); });
    gente?.trasCompilar?.();
  });
  infoCarga.texturas = await texturasEnCamino;
  infoCarga.origenTexturas = origenTexturas();
  infoCarga.fin = Math.round(performance.now());
  $('carga-barra').style.width = '100%';
  await esperar();
}

// 3.7.0: ¿arranca en invierno? (lo mismo que calcula el cuadro para las estaciones, al empezar)
function inviernoDeAjustes() {
  if (ajustes.estacion !== 'auto') return ajustes.estacion === 'invierno';
  const fase = (((progreso.dia - 1 + progreso.horas / 24) % DIAS_ANIO) + DIAS_ANIO) % DIAS_ANIO / DIAS_ANIO;
  return smoothstep(0.63, 0.73, fase) * (1 - smoothstep(0.96, 1.0, fase)) > 0.5;
}

// ------------------------------------------------------------------ cuaderno
let fichaActual = null;
function registrar(id, juntado = false) {
  const e = ENTRADA[id];
  if (!e || modo !== 'jugando') return;
  const ya = progreso.entradas[id];
  if (!ya) {
    progreso.entradas[id] = { dia: progreso.dia, hora: progreso.horas, cantidad: juntado ? 1 : 0 };
    // 3.6 (mecánicas): lo leído y escuchado en la aldea va al diario como una historia
    const historia = e.seccion === 'historias' || e.seccion === 'fogon' || e.seccion === 'pueblo';
    diario.anotar(e.seccion === 'lugares' ? 'lugar' : historia ? 'historia'
      : e.seccion === 'encargos' ? 'encargo' : e.seccion === 'recetas' ? 'cocina'
      : e.seccion === 'trueque' ? 'trueque' : e.seccion === 'cartas' ? 'carta' : 'especie', e.nombre.toLowerCase());
    sonido.anotar();
    nota(e.nombre, e.seccion === 'lugares' ? 'Llegaste a un lugar nuevo' : e.seccion === 'pueblo' ? 'Queda en el cuaderno, en «De la aldea»' : historia ? 'Historia anotada en el cuaderno' : e.seccion === 'encargos' ? 'Encargo cumplido' : e.seccion === 'cartas' ? 'La carta queda en el cuaderno' : 'Nuevo en el cuaderno', true);
    guardar();
  } else if (juntado) {
    ya.cantidad = (ya.cantidad || 0) + 1;
    nota(`${e.nombre} (${ya.cantidad})`, 'Lo guardaste en la mochila');
    guardar();
  }
}
// 2.3: sumar (o restar) de lo juntado. La primera vez, la cosa entra al cuaderno.
function sumarEntrada(id, n) {
  if (!progreso.entradas[id]) registrar(id);
  const e = progreso.entradas[id] || (progreso.entradas[id] = { dia: progreso.dia, hora: progreso.horas, cantidad: 0 });
  e.cantidad = Math.max(0, (e.cantidad || 0) + n);
  return e.cantidad;
}
const cuantoHay = (id) => progreso.entradas?.[id]?.cantidad || 0;

const horaTexto = (h) => { const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };

let pestana = 'especies', desafioActual = null, paginaActual = 0, bestiaActual = null;
function dibujarCuaderno() {
  const total = ENTRADAS.length;
  const hechas = ENTRADAS.filter((e) => progreso.entradas[e.id]).length;
  const fotosHechas = DESAFIOS.filter((d) => progreso.desafios[d.id]).length;
  const lista = $('cuaderno-lista');
  lista.innerHTML = '';
  const el = (tag, clase, texto) => { const n = document.createElement(tag); if (clase) n.className = clase; if (texto !== undefined) n.textContent = texto; return n; };
  lista.appendChild(el('h2', '', 'Cuaderno de campo'));
  lista.appendChild(el('p', 'progreso', `${hechas} de ${total} anotaciones, ${fotosHechas} de ${DESAFIOS.length} desafíos de fotos`));
  // 2.0: todo el cuaderno en una lámina, para guardarla o imprimirla
  const btnLamina = el('button', 'boton-lamina', 'Guardar como lámina');
  btnLamina.addEventListener('click', () => guardarLamina());
  lista.appendChild(btnLamina);
  const pest = el('div', 'pestanas');
  pest.setAttribute('role', 'tablist');
  const pestanas = [['especies', 'Especies y lugares'], ['fotos', 'Álbum de fotos'], ['diario', 'Diario']];
  // 3.1: rangos y oficios (3.6: y en el Relax, la Aldea de los Duendes)
  pestanas.push(['oficios', desafio ? 'Oficios' : 'Oficios y aldea']);
  // 2.0: en el Desafío, el bestiario de los invasores
  if (desafio) pestanas.push(['bestiario', 'Bestiario']);
  else if (pestana === 'bestiario') pestana = 'especies';
  for (const [id, nombre] of pestanas) {
    const b = el('button', '', nombre);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(pestana === id));
    b.addEventListener('click', () => { pestana = id; dibujarCuaderno(); });
    pest.appendChild(b);
  }
  lista.appendChild(pest);
  const ficha = $('cuaderno-ficha');
  ficha.innerHTML = '';
  if (pestana === 'oficios' && oficios) { oficios.dibujarCuaderno(lista, ficha, el, desafio ? null : aldeaGente); return; }

  if (pestana === 'bestiario' && desafio) {
    const best = desafio.bestiario;
    const ul = el('ul', 'lista');
    const tipos = Object.keys(BESTIARIO);
    for (const t of tipos) {
      const f = fichaBestiario(t, best[t], T_);
      const b2 = el('button');
      b2.appendChild(el('span', f ? '' : 'pendiente', f ? f.nombre : '¿?'));
      if (f) b2.appendChild(el('span', 'marca', f.completa ? 'completa' : `${f.abatidos} abatidos`));
      if (bestiaActual === t) b2.setAttribute('aria-current', 'true');
      b2.addEventListener('click', () => { bestiaActual = t; dibujarCuaderno(); });
      const li = el('li'); li.appendChild(b2); ul.appendChild(li);
    }
    lista.appendChild(ul);
    const t = bestiaActual && best[bestiaActual] ? bestiaActual : tipos.find((x) => fichaBestiario(x, best[x]));
    const f = t ? fichaBestiario(t, best[t], T_) : null;
    if (f) {
      ficha.appendChild(el('h2', '', f.nombre));
      ficha.appendChild(el('p', 'anotado', `Visto por primera vez el día ${f.dia}`));
      ficha.appendChild(el('p', 'texto', f.texto));
      // 3.0: los adaptados dicen, además, contra qué vienen preparados ahora
      if (t === 'adaptado' && desafio.adaptaciones) ficha.appendChild(el('p', 'texto', T_(desafio.adaptaciones)));
      if (f.falta) ficha.appendChild(el('p', 'pista', f.falta));
    } else {
      ficha.appendChild(el('h2', '', 'Bestiario'));
      ficha.appendChild(el('p', 'texto', 'Cada invasor que veas de cerca queda anotado acá. Peleando se aprende cómo se mueve, y al tercero que abatís, dónde es débil.'));
    }
    return;
  }

  if (pestana === 'diario') {
    const paginas = [...(progreso.diario || [])].reverse();
    const ul = el('ul', 'lista');
    if (!paginas.length) {
      lista.appendChild(el('p', 'pista', 'Todavía no escribiste ninguna página. Se escribe sola cada vez que dormís de noche.'));
    }
    paginas.forEach((p, i) => {
      const b2 = el('button');
      b2.appendChild(el('span', '', `Día ${p.dia}`));
      b2.appendChild(el('span', 'marca', p.estacion));
      if (paginaActual === i) b2.setAttribute('aria-current', 'true');
      b2.addEventListener('click', () => { paginaActual = i; dibujarCuaderno(); });
      const li = el('li'); li.appendChild(b2); ul.appendChild(li);
    });
    lista.appendChild(ul);
    const p = paginas[Math.min(paginaActual, paginas.length - 1)];
    if (p) {
      ficha.appendChild(el('h2', '', `Día ${p.dia}`));
      ficha.appendChild(el('p', 'anotado', `${p.estacion} en el bosque`));
      ficha.appendChild(el('p', 'texto', p.texto));
    } else {
      ficha.appendChild(el('h2', '', 'Diario'));
      ficha.appendChild(el('p', 'texto', 'Cada noche que dormís se escribe acá la página del día: el tiempo que hizo, dónde anduviste, qué anotaste y qué te contaron.'));
    }
    return;
  }

  if (pestana === 'fotos') {
    const ul = el('ul', 'lista');
    for (const d of DESAFIOS) {
      const b = el('button');
      const hecho = progreso.desafios[d.id];
      b.appendChild(el('span', hecho ? '' : 'pendiente', d.nombre));
      if (hecho) b.appendChild(el('span', 'marca', 'en el álbum'));
      if (desafioActual === d.id) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => { desafioActual = d.id; dibujarCuaderno(); });
      const li = el('li'); li.appendChild(b); ul.appendChild(li);
    }
    lista.appendChild(ul);
    const d = DESAFIOS.find((x) => x.id === desafioActual) || DESAFIOS.find((x) => progreso.desafios[x.id]) || DESAFIOS[0];
    const hecho = progreso.desafios[d.id];
    ficha.appendChild(el('h2', '', d.nombre));
    if (hecho) {
      ficha.appendChild(el('p', 'anotado', `Sacada el día ${hecho.dia} a las ${horaTexto(hecho.hora)}`));
      const img = el('img', 'polaroid'); img.src = hecho.img; img.alt = d.texto;
      ficha.appendChild(img);
      ficha.appendChild(el('p', 'texto', d.texto));
    } else {
      ficha.appendChild(el('p', 'texto', d.texto));
      ficha.appendChild(el('p', 'pista', `Una pista: ${d.pista}`));
    }
    return;
  }

  for (const s of SECCIONES) {
    const div = el('div', 'seccion');
    div.appendChild(el('h3', '', s.nombre));
    const ul = el('ul', 'lista');
    for (const e of ENTRADAS.filter((x) => x.seccion === s.id)) {
      const b = el('button');
      const conocida = !!progreso.entradas[e.id];
      const pedido = e.seccion === 'encargos' && progreso.encargos[e.id] === 'pedido';
      if (pedido) e.cumplidoYa = ENCARGO[e.id] && ENCARGO[e.id].cumplido(progreso);
      b.appendChild(el('span', conocida || pedido ? '' : 'desconocida', conocida ? e.nombre : pedido ? e.nombre : 'Sin descubrir'));
      const pez = progreso.peces[e.id];
      const enc = e.seccion === 'encargos' ? progreso.encargos[e.id] : null;
      if (enc === 'pedido') b.appendChild(el('span', 'marca', e.cumplidoYa ? 'listo' : 'en curso'));
      if (conocida && pez) b.appendChild(el('span', 'marca', `${pez.record} cm`));
      else if (conocida && progreso.entradas[e.id].cantidad) b.appendChild(el('span', 'marca', `×${progreso.entradas[e.id].cantidad}`));
      if (fichaActual === e.id) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => { fichaActual = e.id; dibujarCuaderno(); });
      const li = el('li'); li.appendChild(b); ul.appendChild(li);
    }
    div.appendChild(ul); lista.appendChild(div);
  }
  const e = ENTRADA[fichaActual] || ENTRADAS.find((x) => progreso.entradas[x.id]) || ENTRADAS[0];
  const reg = progreso.entradas[e.id];
  if (reg) {
    ficha.appendChild(el('h2', '', e.nombre));
    if (e.cientifico) ficha.appendChild(el('p', 'cientifico', e.cientifico));
    // 2.1: 'cambiar' no tenía verbo (las fichas del almacén decían «undefined el día…»)
    const verbo = { observar: 'Visto', anotar: 'Anotado', juntar: 'Encontrado', escuchar: e.seccion === 'historias' ? 'Te la contaron' : 'Escuchado', llegar: 'Llegaste', pescar: 'Pescado por primera vez', cocinar: 'Cocinado', encargo: 'Encargo cumplido', cambiar: 'Conseguido', rastrear: 'Rastreado', cosechar: 'Cosechado por primera vez', leer: 'Recibida', libro: 'Leído' }[e.modo] || 'Anotado';   // 3.6 (mecánicas): los libros de la aldea
    const pez = progreso.peces[e.id];
    ficha.appendChild(el('p', 'anotado', `${verbo} el día ${reg.dia} a las ${horaTexto(reg.hora)}${reg.cantidad && !pez ? `, llevás ${reg.cantidad}` : ''}${pez ? `. Pescaste ${pez.cantidad}, la más grande de ${pez.record} cm` : ''}`));
    ficha.appendChild(el('p', 'texto', e.texto));
    // 2.1: cuándo se ve (ver `almanaque.js`)
    const cuando = cuandoSeVe(e);
    if (cuando) ficha.appendChild(el('p', 'pista', `Cuándo: ${cuando}`));
    if (progreso.grabaciones?.[e.id]) ficha.appendChild(el('p', 'pista', 'Tenés su canto en el grabador.'));
  } else if (e.seccion === 'encargos' && progreso.encargos[e.id] === 'pedido') {
    const enc = ENCARGO[e.id];
    ficha.appendChild(el('h2', '', e.nombre));
    ficha.appendChild(el('p', 'cientifico', e.cientifico));
    ficha.appendChild(el('p', 'anotado', enc.cumplido(progreso) ? 'Cumplido: falta contarlo' : 'En curso'));
    ficha.appendChild(el('p', 'texto', enc.resumen));
  } else {
    ficha.appendChild(el('h2', '', 'Todavía no'));
    ficha.appendChild(el('p', 'pista', `Una pista: ${e.pista}`));
    // Si el encargo está trabado, decir qué hay que cerrar antes: la pista sola
    // no alcanza cuando el vecino todavía no lo va a pedir por más que lo busques.
    const enc = e.seccion === 'encargos' ? ENCARGO[e.id] : null;
    if (enc && estadoEncargo(progreso, enc) === 'trabado') {
      ficha.appendChild(el('p', 'pista', pistaTrabado(progreso, enc)));
    }
  }
}

function atrapar(pez) {
  const reg = progreso.peces[pez.id] || { cantidad: 0, record: 0 };
  reg.cantidad++;
  const esRecord = pez.cm > reg.record && reg.cantidad > 1;
  reg.record = Math.max(reg.record, pez.cm);
  progreso.peces[pez.id] = reg;
  // la picada de la tarde: lo que se saca entre las siete y las diez de la noche
  if (progreso.horas >= 19 && progreso.horas < 22) progreso.pescaTarde = (progreso.pescaTarde || 0) + 1;
  registrar(pez.id);
  ganarOficio('pescador', XP.pez);   // 3.1
  diario.anotar('pez', { especie: pez.def.nombre, cm: pez.cm });
  vecindadJuego?.delPez(pez);   // 3.6 (vida): la trucha grande o el pez nativo, para los vecinos
  modos?.pez?.(pez);   // 3.1: el desafío del día y el torneo de la semana
  const nombre = pez.def.nombre.charAt(0).toUpperCase() + pez.def.nombre.slice(1);
  // 2.3: con un ahumadero terminado, dos truchas por día van a la mochila
  const hoy = progreso.truchasHoy?.dia === progreso.dia ? progreso.truchasHoy.n : 0;
  if (!desafio && teLaQuedas(pez.id, obrasTerminadas('ahumadero').length > 0, hoy)) {
    progreso.truchasHoy = { dia: progreso.dia, n: hoy + 1 };
    sumarEntrada('trucha-fresca', 1);
    nota(`${nombre}, ${pez.cm} cm`, `Te la quedás para el ahumadero (${hoy + 1} de ${AHUMADERO.porDia} hoy)`);
    refrescarBarra(true);
    guardar();
    return;
  }
  nota(`${nombre}, ${pez.cm} cm`, esRecord ? 'Tu mejor pieza. Vuelve al agua' : 'La devolvés al agua con cuidado');
  guardar();
}

// 3.5.1: mientras dura el fundido no se vuelve a dormir: un segundo E (o la cama y el
// fuego a la vez) armaba otra noche encima y salteaba un día entero con dos páginas del diario
let durmiendo = false;
// 3.5.1: con la hora de tu reloj la noche no se saltea: dormir la volvía a dejar en la misma
// hora real y cada E sumaba otro día (la huerta crecía sin fin). Una noche de reloj = un día.
// La clave va de mediodía a mediodía: la noche entera cae en la misma.
const claveNocheReloj = (d = new Date()) => new Date(d.getTime() - 12 * 3600e3).toDateString();
function dormir() {
  if (durmiendo) return;
  if (desafio) {
    const r = desafio.puedeDormir();
    if (!r.ok) { nota('No podés dormir ahora', r.motivo); return; }
  }
  const deNoche = progreso.horas >= 19.5 || progreso.horas < 6;
  const nocheReloj = !desafio && deNoche && ajustes.duracion === 'reloj' ? claveNocheReloj() : '';
  if (nocheReloj && progreso.relojNoche === nocheReloj) { nota('Ya dormiste esta noche', 'Con la hora de tu reloj, la noche pasa de verdad'); return; }
  if (desafio) desafio.curar(deNoche ? 100 : 35);
  // 2.3: una noche de invierno sin fuego cerca se paga a la mañana.
  // 2.4: la casa abriga (ver abrigo.js): el calor de la estufa llega por los ambientes,
  // una casa cerrada no es la intemperie, y el confort te deja descansado.
  const fg = clima.fogata, jp = jugador.estado.pos;
  const fuegoVivo = fg.activa && fg.vida > 0;
  // 2.4.1: estadoHabitat también encuentra la casa de al lado; sólo cuenta si estás adentro
  const bajoTechoPropio = obras?.dentro?.(jp) || (() => { const b = obras?.bajoCubierta?.(jp); return !!b && !b.pieza; })();
  const casa = bajoTechoPropio ? obras?.estadoHabitat?.(jp, { fuego: fuegoVivo ? fg.pos : null }) || null : null;
  // 3.6 (vida): dormir afuera (lejos del refugio y sin techo tuyo) también se comenta en la aldea
  const refu = T.lugares.refugio;
  if (!desafio && deNoche && !bajoTechoPropio && refu && Math.hypot(jp.x - refu.x, jp.z - refu.z) > 15) vecindadJuego?.hecho('durmio-afuera');
  const distanciaAlFuego = fuegoVivo ? Math.hypot(fg.pos.x - jp.x, fg.pos.z - jp.z) : Infinity;
  const comoSinRopa = desafio || !deNoche ? 'normal' : comoDormiste({
    invierno: U.uInvierno.value, manta: !!progreso.cosas.manta, distanciaAlFuego, casa, carpa: enLaCarpa(),
  });
  // 2.8: la ropa abriga (ver personal-personaje.js): con poncho, gorro y bufanda, un escalón mejor
  const como = templarNoche(comoSinRopa, progreso.personal?.personaje);
  const descanso = desafio || !deNoche ? 0 : horasDescansado({ como, casa });
  const calorDeLaCasa = como === 'calentito' && distanciaAlFuego > LENA.calorFuego;
  const inviernoEnCasa = deNoche && !desafio && U.uInvierno.value >= 0.5 && casaCerrada(casa);
  const f = $('fundido');
  f.classList.add('activo');
  jugador.sentarse(true);
  durmiendo = true;
  setTimeout(() => {
    if (deNoche) {
      if (como !== 'normal') diario.anotar('noche', como === 'fresco' && inviernoEnCasa ? 'casa' : como);
      const pagina = diario.cerrar(progreso.dia, nombreEstacion(), Math.random);
      progreso.diario = [...(progreso.diario || []), pagina].slice(-40);
      if (progreso.horas > 7) progreso.dia++;
      if (nocheReloj) progreso.relojNoche = nocheReloj;   // 3.5.1
      progreso.horas = 7.2;
      if (renovales) renovales.actualizar(progreso.dia);
    }
    else { progreso.horas += 2; if (progreso.horas >= 24) { progreso.horas -= 24; progreso.dia++; } }
    if (clima.fogata.activa) clima.fogata.vida = Math.min(clima.fogata.vida, -40);
    guardar();
    copiarASync(true);   // 1.11: dormir es un buen momento para dejar la copia
    setTimeout(() => {
      f.classList.remove('activo');
      jugador.sentarse(false);
      durmiendo = false;
      if (deNoche) nota(`Día ${progreso.dia}`, 'Amanece en el bosque');
      else nota('Dormiste una siesta', `Son las ${horaTexto(progreso.horas)}`);
      jugador.estado.entumecido = horasEntumecido(como);
      if (deNoche) jugador.estado.descansado = descanso;
      if (descanso > 0) { diario.anotar('descanso'); setTimeout(() => nota('Descansaste de verdad', 'La casa ya es casa: vas a andar más liviano un rato'), 3200); }
      if (como === 'calentito' && calorDeLaCasa) setTimeout(() => nota('Dormiste calentito', 'El calor de la estufa llegó a toda la casa'), 1600);
      else if (como === 'calentito') setTimeout(() => nota('Dormiste calentito', 'El fuego aguantó toda la noche'), 1600);
      else if (como === 'normal' && inviernoEnCasa) setTimeout(() => nota('La casa y la manta alcanzaron', 'Sin fuego, pero bajo techo y abrigado'), 1600);
      else if (como === 'fresco' && inviernoEnCasa) setTimeout(() => nota('Dormiste bajo techo, sin fuego', 'Se sintió el frío, pero la casa aguantó: un fuego lo arregla'), 1600);
      else if (como === 'frio') setTimeout(() => nota('Pasaste frío', 'Sin fuego, la noche de invierno se mete en los huesos: vas a andar lento un rato, o hasta que te calientes junto a un fuego'), 1600);
      else if (como === 'fresco') setTimeout(() => nota('La manta ayudó, pero no alcanzó', 'Te levantás entumecido: un fuego lo arregla'), 1600);
      if (como !== comoSinRopa) setTimeout(() => nota('La ropa abrigó', 'Con el poncho, el gorro y la bufanda la noche se pasó mejor'), 4600);
    }, 900);
  }, 1300);
}

// ------------------------------------------------------------------ notas y HUD
function nota(texto, sub, nueva = false) {
  texto = T_(texto); sub = sub ? T_(sub) : sub;
  avisosDichos = apilarAviso(avisosDichos, { titulo: texto, texto: sub, hora: progreso?.horas ?? 0, importante: nueva });
  if (ajustes.subtitulos) dibujarSubtitulos();
  const n = document.createElement('div');
  n.className = 'nota' + (nueva ? ' nueva' : '');
  if (sub) { const s = document.createElement('small'); s.textContent = sub; n.appendChild(s); }
  n.appendChild(document.createTextNode(texto));
  $('notas').appendChild(n);
  setTimeout(() => n.remove(), 5600);
  while ($('notas').children.length > 4) $('notas').firstChild.remove();
}

const RUMBOS = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]];
const brujula = $('brujula');
const marcas = RUMBOS.map(([t]) => { const s = document.createElement('span'); s.textContent = t; if (t.length > 1) s.className = 'menor'; brujula.appendChild(s); return s; });
// marcas de los lugares ya descubiertos, sobre la brújula
const CLAVES_LUGARES = ['refugio', 'muelle', 'puente', 'mallin', 'mirador', 'arrayanes', 'faro', 'cabana', 'puesto', 'molino', 'casa-te', 'torre', 'estacion', 'galpon', 'almacen', 'cueva'];
const hitos = [];
// candidatos reutilizados (sin basura por cuadro); se ubican del más cercano al más lejano
// y se omite el que pisaría a una etiqueta ya puesta, así los nombres nunca se superponen
const candidatosBrujula = CLAVES_LUGARES.map(() => ({ k: '', dist: 0, x: 0, ancho: 0 }));
const ordenBrujula = [];
const ANCHO_LETRA_BRUJULA = 7.2;
function actualizarBrujula(yaw, pos) {
  const rumbo = -yaw;
  // 2.6.1: un for en vez de forEach con desestructurado (sin cierre ni arreglo por cuadro)
  for (let i = 0; i < RUMBOS.length; i++) {
    let d = (RUMBOS[i][1] * Math.PI) / 180 - rumbo;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    marcas[i].style.left = `${190 + d * 150}px`;
    marcas[i].style.display = Math.abs(d) > 1.4 ? 'none' : '';
  }
  ordenBrujula.length = 0;
  for (let i = 0; i < CLAVES_LUGARES.length; i++) {
    const k = CLAVES_LUGARES[i];
    const l = T.lugares[k];
    if (!l) continue;
    const dist = Math.hypot(l.x - pos.x, l.z - pos.z);
    if (dist > 320 || dist < 12) continue;
    let d = Math.atan2(-(l.x - pos.x), -(l.z - pos.z)) - yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) > 1.25) continue;
    const c = candidatosBrujula[i];
    c.k = k; c.dist = dist; c.x = 190 - d * 150;
    c.ancho = ((ENTRADA[k] ? ENTRADA[k].nombre : k).length + 7) * ANCHO_LETRA_BRUJULA;
    ordenBrujula.push(c);
  }
  ordenBrujula.sort((a, b) => a.dist - b.dist);
  let n = 0;
  for (let j = 0; j < ordenBrujula.length; j++) {
    const c = ordenBrujula[j];
    let pisa = false;
    for (let q = 0; q < j && !pisa; q++) {
      const o = ordenBrujula[q];
      if (o.ancho > 0 && Math.abs(o.x - c.x) < (o.ancho + c.ancho) / 2 + 6) pisa = true;
    }
    if (pisa) { c.ancho = 0; continue; }
    let m = hitos[n];
    if (!m) { m = document.createElement('b'); m.appendChild(document.createElement('i')); brujula.appendChild(m); hitos[n] = m; }
    const texto = `${ENTRADA[c.k] ? ENTRADA[c.k].nombre : c.k} · ${Math.round(c.dist)} m`;
    if (m.firstChild.nodeType !== 3) m.insertBefore(document.createTextNode(texto), m.firstChild);
    else m.firstChild.nodeValue = texto;
    m.style.left = `${c.x}px`;
    m.style.opacity = String(Math.max(0.35, 1 - c.dist / 320));
    m.style.display = '';
    n++;
  }
  for (let i = n; i < hitos.length; i++) hitos[i].style.display = 'none';
  // Desafío: los invasores a menos de 120 m aparecen como puntos rojos en la brújula
  let m = 0;
  if (desafio) for (const a of desafio.aliens) {
    if (m >= marcasAlien.length || a.estado === 'morir' || a.estado === 'irse') continue;
    const p = a.m.g.position;
    const dist = Math.hypot(p.x - pos.x, p.z - pos.z);
    if (dist > 120) continue;
    let d = Math.atan2(-(p.x - pos.x), -(p.z - pos.z)) - yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const s = marcasAlien[m++];
    s.style.display = Math.abs(d) > 1.25 ? 'none' : '';
    s.style.left = `${190 - d * 150}px`;
    s.style.opacity = String(Math.max(0.45, 1 - dist / 120));
  }
  for (; m < marcasAlien.length; m++) marcasAlien[m].style.display = 'none';
  // el rumbo elegido en el mapa: se ve siempre, aunque esté lejos o atrás
  const r = chincheActiva ? rumboHacia(pos, chincheActiva, yaw) : null;
  marcaRumbo.style.display = r ? '' : 'none';
  if (r) {
    const d = Math.max(-1.25, Math.min(1.25, r.ang));
    marcaRumbo.style.left = `${190 - d * 150}px`;
    marcaRumbo.textContent = `${chincheActiva.nombre} · ${textoDistancia(r.dist)}${r.atras ? ' ←' : ''}`;
    marcaRumbo.classList.toggle('llegando', r.dist < 25);
  }
}
const marcaRumbo = (() => { const s = document.createElement('b'); s.className = 'rumbo'; s.style.display = 'none'; brujula.appendChild(s); return s; })();
const marcasAlien = Array.from({ length: 12 }, () => { const s = document.createElement('u'); s.className = 'alien'; s.style.display = 'none'; brujula.appendChild(s); return s; });

// virado de color según la hora y el clima, sin costo para la placa
const tinteEl = $('tinte');
let acumuladoTinte = 9;
function actualizarTinte(dt, horas, luz, lluvia, invierno) {
  acumuladoTinte += dt;
  if (acumuladoTinte < 1.5) return;
  acumuladoTinte = 0;
  if (ajustes.virado === 'apagado') { tinteEl.style.opacity = '0'; return; }
  const noche = 1 - luz.dia;
  // apenas un matiz: el color lo pone la luz del sol, no una capa encima
  let color, fuerza;
  if (noche > 0.55) { color = '#5f7bb0'; fuerza = 0.09 * noche; }
  else if (luz.tarde > 0.15) { color = '#ffc38a'; fuerza = 0.13 * luz.tarde; }
  else { color = '#eef5ff'; fuerza = 0.06; }
  if (lluvia > 0.3) { color = '#8e98a1'; fuerza = Math.max(fuerza, 0.12 * lluvia); }
  if (invierno > 0.5) fuerza *= 0.8;
  tinteEl.style.backgroundColor = color;
  tinteEl.style.opacity = String(Math.min(0.16, fuerza));
}

let avisoTexto = '';
let avisoTecla = '', avisoFrase = '';
function mostrarAviso(t) {
  if (t === avisoTexto) return;
  // 2.6.1: el aviso llega como objeto nuevo cada cuadro: se compara por contenido para no rehacer el DOM
  if (t && avisoTexto && t.tecla === avisoTecla && t.texto === avisoFrase) return;
  avisoTexto = t;
  avisoTecla = t ? t.tecla : ''; avisoFrase = t ? t.texto : '';
  const a = $('aviso');
  if (!t) { a.classList.add('oculto'); a.textContent = ''; return; }
  a.innerHTML = '';
  const k = document.createElement('kbd'); k.textContent = t.tecla; a.appendChild(k);
  a.appendChild(document.createTextNode(T_(t.texto)));
  a.classList.remove('oculto');
}
// 2.6.1: textos del HUD que se escriben cada cuadro: sólo se toca el DOM si cambiaron
function ponerTexto(el, texto) { if (el && el.textContent !== texto) el.textContent = texto; }

// ------------------------------------------------------------------ menús
let abiertoEn = 0;
function abrir(cual) {
  abiertoEn = performance.now();
  if (cual !== 'jugando') {
    // 3.6.1: la pausa (o el cuaderno, o el mapa) cierra el modo foto: perder el foco (Alt+Tab, otra
    // ventana encima) o soltar el mouse en el modo foto abría la pausa con el modo foto prendido
    // debajo (la cámara libre, el reloj quieto y su panel escondido)
    if (foto.activo) abrirModoFoto(false);
    pedirFoto = false;
    if (idFotoPendiente) { clearTimeout(idFotoPendiente); idFotoPendiente = 0; }
  }
  for (const id of ['pausa', 'cuaderno', 'mapa']) $(id).classList.toggle('oculto', id !== cual);
  modo = cual;
  jugador.estado.zoom = false;
  if (cual !== 'jugando') jugador.soltar();
  if (cual === 'pausa') {
    const hechas = ENTRADAS.filter((e) => progreso.entradas[e.id]).length;
    const enc = resumenEncargos(progreso);
    // 2.0: y la luna de esta noche
    $('cuando').textContent = `Día ${progreso.dia}, ${horaTexto(progreso.horas)} · ${nombreEstacion()} · ${nombreFase(faseLunar(progreso.dia, progreso.horas))}`;
    const bosque = resumenBosque(talados(), progreso.dia);
    $('resumen-pausa').textContent = `${hechas} de ${ENTRADAS.length} anotaciones · ${progreso.fotos} ${progreso.fotos === 1 ? 'foto' : 'fotos'}`
      + ` · ${enc.hechos} de ${enc.total} encargos`
      + (enc.enCurso ? ` (${enc.enCurso} en curso)` : '')
      + (bosque.rebrotando ? ` · ${bosque.rebrotando} ${bosque.rebrotando === 1 ? 'tocón rebrotando' : 'tocones rebrotando'}` : '');
    $('btn-vuelta').classList.toggle('oculto', !(desafio && puedeOtraVuelta(progreso.desafio)));
    if (desafio && progreso.desafio) {
      const d = progreso.desafio;
      $('resumen-pausa').textContent = `Desafío · ${d.noches} ${d.noches === 1 ? 'noche resistida' : 'noches resistidas'} · ${d.abatidos} invasores abatidos · mejor racha ${d.mejorRacha}`;
    }
    guardar();
    sincronizarAjustes();
    // una foto chica de dónde quedaste, para reconocer la partida en el menú
    try { dibujar(luzUltimaFoto, 1 - (luzUltimaFoto?.dia ?? 1)); guardarVista(fotos.hacerMiniatura(lienzo)); } catch {}
  }
  if (cual === 'cuaderno') { dibujarCuaderno(); traducirPanel($('cuaderno')); }
  if (cual === 'mapa') dibujarMapa();
}
// El mapa es cartográfico, no una recompensa por descubrir lugares: todos los
// hitos aparecen desde el inicio, más lo que marca el jugador con sus chinches.
function dibujarMapa() {
  const marcas = [];
  if (tren && estadoTren) marcas.push({ x: estadoTren.pos.x, z: estadoTren.pos.z, tipo: 'tren' });
  if (tren) for (const p of tren.paradas) marcas.push({ x: p.anden.x, z: p.anden.z, tipo: 'parada', nombre: p.nombre });
  for (const o of obras?.obras || []) {
    if (o.datos.nombre) marcas.push({ x: o.datos.x, z: o.datos.z, tipo: 'parada', nombre: o.datos.nombre });
  }
  if (puestoFeria && !desafio && esDiaDeFeria(progreso.dia)) marcas.push({ x: puestoFeria.x, z: puestoFeria.z, tipo: 'parada', nombre: 'Feria de la estación' });
  if (desafio && !progreso.desafio?.pistolaEncontrada) marcas.push({ x: desafio.capsula.x, z: desafio.capsula.z, tipo: 'parada', nombre: 'Cápsula estrellada' });
  for (const m of modos?.marcasMapa?.() || []) marcas.push(m);   // 3.1: los postes de largada
  mapa.dibujar($('lienzo-mapa'), null, jugador.estado, null, T.lugares, marcas, chinches(), chincheActiva, marcasAutomaticas({ desafio, lugares: T.lugares }));
}

// ---------------------------------------------------------------- modo foto
// La cámara se suelta del cuerpo, el HUD se va y quedan los controles que cambian
// una foto: la hora, el encuadre y la luz. Lo que se toca acá se ve en la foto.
{ const estilo = document.createElement('style'); estilo.textContent = CSS_FOTO; document.head.appendChild(estilo); }
let foto = estadoFotoInicial({ fov: ajustes.fov, bloom: calidad.bloom ?? 0.4 });
let guardadoFoto = null;
function dibujarPanelFoto() {
  $('foto-controles').innerHTML = htmlPanelFoto(foto);
  traducirPanel($('foto-controles'));
  dibujarGuiasFoto();
}
function dibujarGuiasFoto() {
  const capa = $('foto-guias-capa');
  capa.innerHTML = '';
  if (foto.guias === 'ninguna') return;
  const lineas = foto.guias === 'tercios'
    ? [['h', '33.33%'], ['h', '66.66%'], ['v', '33.33%'], ['v', '66.66%']]
    : [['h', '50%'], ['v', '50%']];
  for (const [clase, pos] of lineas) {
    const i = document.createElement('i');
    i.className = clase;
    if (clase === 'h') i.style.top = pos; else i.style.left = pos;
    capa.appendChild(i);
  }
}
function aplicarFoto() {
  camara.fov = foto.fov;
  camara.updateProjectionMatrix();
  if (foto.activo) progreso.horas = foto.hora;
  if (post?.uniforms) {
    post.uniforms.uBloom.value = foto.bloom;
    post.uniforms.uVineta.value = foto.vineta;
    post.uniforms.uGrano.value = foto.grano;
  }
}
function abrirModoFoto(encender) {
  if (encender === foto.activo) return;
  if (encender) {
    guardadoFoto = {
      fov: ajustes.fov, horas: progreso.horas, hud: $('hud').classList.contains('oculto'),
      bloom: post?.uniforms?.uBloom.value, vineta: post?.uniforms?.uVineta.value, grano: post?.uniforms?.uGrano.value,
    };
    foto = { ...foto, activo: true, hora: progreso.horas, fov: ajustes.fov };
    libre.activa = true;
    modo = 'jugando';
    for (const id of ['pausa', 'cuaderno', 'mapa', 'banco', 'partidas', 'guia', 'teclas', 'personalizar']) $(id).classList.add('oculto');
    origenPersonal = null;
    $('hud').classList.add('oculto');
    $('foto-panel').classList.remove('oculto');
    cuerpoJugador?.mostrarEnCamara(true);   // 2.8: en el modo foto te ves (ver personal-personaje-mundo.js)
    dibujarPanelFoto();
    aplicarFoto();
    nota('Modo foto', AYUDA_FOTO, true);
  } else {
    foto = { ...foto, activo: false };
    libre.activa = false;
    $('foto-panel').classList.add('oculto');
    cuerpoJugador?.mostrarEnCamara(false);
    $('foto-guias-capa').innerHTML = '';
    $('hud').classList.remove('oculto');
    const g = guardadoFoto;
    if (g) {
      camara.fov = g.fov; camara.updateProjectionMatrix();
      progreso.horas = g.horas;
      if (post?.uniforms) {
        if (g.bloom !== undefined) post.uniforms.uBloom.value = g.bloom;
        if (g.vineta !== undefined) post.uniforms.uVineta.value = g.vineta;
        if (g.grano !== undefined) post.uniforms.uGrano.value = g.grano;
      }
    }
    jugador.pedirBloqueo();
  }
}
$('foto-controles').addEventListener('input', (e) => {
  const r = e.target.closest('[data-foto]');
  if (!r) return;
  foto = aplicarControl(foto, r.dataset.foto, r.value);
  const eti = $('foto-controles').querySelector(`[data-foto-valor="${r.dataset.foto}"]`);
  if (eti) eti.textContent = textoControl(foto, r.dataset.foto);
  aplicarFoto();
});
$('foto-controles').addEventListener('click', (e) => {
  const g = e.target.closest('[data-foto-guia]');
  if (g) { foto = { ...foto, guias: g.dataset.fotoGuia }; dibujarPanelFoto(); return; }
  const c = e.target.closest('[data-foto-congelar]');
  if (c) { foto = { ...foto, congelado: c.dataset.fotoCongelar === '1' }; dibujarPanelFoto(); }
});
$('foto-guardar').addEventListener('click', () => guardarFotoArchivo());
$('foto-salir').addEventListener('click', () => abrirModoFoto(false));
$('btn-foto-modo').addEventListener('click', () => abrirModoFoto(true));
// La foto se baja como archivo, tal cual se ve, sin el HUD ni las guías.
function guardarFotoArchivo() {
  const capa = $('foto-guias-capa').innerHTML;
  $('foto-guias-capa').innerHTML = '';
  $('foto-panel').classList.add('oculto');
  dibujar(luzUltimaFoto, 1 - (luzUltimaFoto?.dia ?? 1));
  lienzo.toBlob((blob) => {
    $('foto-guias-capa').innerHTML = capa;
    if (foto.activo) $('foto-panel').classList.remove('oculto');
    if (!blob) { nota('No se pudo guardar la foto', 'Probá de nuevo'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivoFoto();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    nota('Foto guardada', a.download, true);
  }, 'image/png');
}

// ---------------------------------------------------------------- banco de pruebas
// Un recorrido guionado, siempre el mismo, para medir cuadros por segundo de verdad.
// Se maneja solo: mueve la cámara, cambia la hora, mide y al final muestra el informe.
const banco = { activa: false, corrida: null, guardado: null, desde: null, hasta: null, mira: null, aviso: null };
function puntoBanco(p) {
  if (!p) return null;
  const l = T.lugares[p.lugar] || T.lugares.refugio;
  const x = l.x + (p.dx || 0), z = l.z + (p.dz || 0);
  return { x, z, y: T.altura(x, z) };
}
function prepararTramoBanco(tramo) {
  banco.desde = puntoBanco(tramo.desde);
  banco.hasta = puntoBanco(tramo.hasta);
  banco.mira = tramo.mira ? puntoBanco(tramo.mira) : banco.hasta;
  banco.alto = tramo.alto ?? 2;
  progreso.horas = tramo.hora;
  if (banco.aviso) banco.aviso.textContent = `${tramo.nombre} — ${tramo.texto}`;
}
function moverCamaraBanco(avance) {
  const u = Math.max(0, Math.min(1, avance));
  const suave = u * u * (3 - 2 * u);
  const x = banco.desde.x + (banco.hasta.x - banco.desde.x) * suave;
  const z = banco.desde.z + (banco.hasta.z - banco.desde.z) * suave;
  camara.position.set(x, T.altura(x, z) + banco.alto, z);
  const m = banco.mira;
  camara.lookAt(m.x, T.altura(m.x, m.z) + banco.alto * 0.6, m.z);
  camara.updateMatrixWorld();
  // el mundo se carga alrededor de la cámara, no del cuerpo del jugador
  jugador.estado.pos.set(x, T.altura(x, z), z);
}
function empezarBanco(recorrido = RECORRIDO) {
  if (banco.activa) return;
  const js = jugador.estado;
  banco.guardado = { x: js.pos.x, y: js.pos.y, z: js.pos.z, yaw: js.yaw, horas: progreso.horas, auto: ajustes.autoCalidad, modo };
  banco.corrida = crearCorrida(Array.isArray(recorrido) && recorrido.length ? recorrido : RECORRIDO);
  banco.activa = true;
  ajustes.autoCalidad = false;   // el banco mide una calidad fija
  for (const id of ['pausa', 'cuaderno', 'mapa', 'banco']) $(id).classList.add('oculto');
  $('hud').classList.add('oculto');
  $('banco-corriendo').classList.remove('oculto');
  banco.aviso = $('banco-tramo');
  modo = 'jugando';
  prepararTramoBanco(banco.corrida.recorrido[0]);
  moverCamaraBanco(0);
  nota('Banco de pruebas', `Unos ${Math.round(duracionBanco() / 60)} minutos. No toques nada: la cámara se mueve sola`, true);
}
function terminarBanco() {
  banco.activa = false;
  $('banco-corriendo').classList.add('oculto');
  const g = banco.guardado;
  if (g) {
    ajustes.autoCalidad = g.auto;
    progreso.horas = g.horas;
    jugador.ubicar(g.x, g.z, g.yaw, g.y);
  }
  const r = renderer.info.render;
  const informe = informeBanco(banco.corrida, {
    version: (document.getElementById('version-completa')?.textContent || '').replace('Versión ', '').trim(),
    calidad: ajustes.calidad,
    modo: modoJuego === 'desafio' ? 'Desafío' : 'Relax',
    resolucion: `${Math.round(lienzo.width)}×${Math.round(lienzo.height)}`,
    pixelRatio: (renderer.getPixelRatio?.() || 1).toFixed(2),
    limiteFps: String(ajustes.limiteFps),
    gpu: tarjetaDeVideo(),
    cuando: new Date().toLocaleString(),
    escena: `${r.calls} llamadas de dibujo · ${(r.triangles / 1000).toFixed(0)} mil triángulos`,
  });
  banco.informe = informe;
  $('banco-informe').textContent = informe;
  traducirPanel($('banco'));
  $('banco').classList.remove('oculto');
  $('hud').classList.remove('oculto');
  modo = 'pausa';
  guardarAjustes(ajustes);
}
function tarjetaDeVideo() {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  } catch { return ''; }
}
function actualizarBanco(dtReal) {
  const paso = anotarCuadro(banco.corrida, dtReal);
  if (paso.estado === 'fin') { terminarBanco(); return; }
  if (paso.estado === 'cambio') prepararTramoBanco(paso.tramo);
  moverCamaraBanco(paso.avance || 0);
  const hecho = banco.corrida.tramo + (paso.avance || 0);
  $('banco-barra').style.setProperty('--avance', `${Math.round((hecho / banco.corrida.recorrido.length) * 100)}%`);
}
$('btn-banco').addEventListener('click', () => empezarBanco());
$('btn-banco-inicio').addEventListener('click', () => empezarBanco());
$('cerrar-banco').addEventListener('click', () => { $('banco').classList.add('oculto'); abrir('pausa'); });
$('banco-copiar').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(banco.informe || ''); nota('Copiado', 'El informe quedó en el portapapeles'); }
  catch { nota('No se pudo copiar', 'Seleccioná el texto y copialo a mano'); }
});
$('banco-guardar').addEventListener('click', () => {
  const blob = new Blob([banco.informe || ''], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivoBanco({ calidad: ajustes.calidad });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});

// ---------------------------------------------------------------- estado de la base
// Un parte de cómo están las defensas: qué está roto, qué falta y qué conviene hacer
// antes de que caiga la noche. Se abre con N o desde la pausa.
{ const estilo = document.createElement('style'); estilo.textContent = CSS_BASE; document.head.appendChild(estilo); }
let origenBase = null;
function piezasDeLaBase() {
  if (!desafio) return [];
  const js = jugador.estado;
  const piezas = [];
  for (const o of obras?.obras || []) {
    if (!o.datos || o.datos.etapas < (o.plano.etapas?.length || 1)) continue;
    const max = vidaMaxObra(o.plano, o.datos.etapas);
    if (!max) continue;
    piezas.push({
      id: o.plano.id, nombre: o.datos.nombre || o.plano.nombre,
      vida: Number.isFinite(o.datos.vida) ? o.datos.vida : max, max,
      dist: Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z),
    });
  }
  return piezas;
}
function dibujarBase() {
  const resumen = resumirBase(piezasDeLaBase());
  $('base-contenido').innerHTML = htmlBase(resumen, { noche: progreso.desafio?.noches || 0, cristales: material('cristal') });
  traducirPanel($('base-contenido'));
}
function abrirBase(origen) {
  if (!desafio) return;
  origenBase = origen;
  if (origen) $(origen).classList.add('oculto');
  dibujarBase();
  $('base').classList.remove('oculto');
}
function cerrarBase() {
  $('base').classList.add('oculto');
  if (origenBase) $(origenBase).classList.remove('oculto');
  origenBase = null;
}
const baseAbierta = () => !$('base').classList.contains('oculto');
$('cerrar-base').addEventListener('click', cerrarBase);
$('btn-base').addEventListener('click', () => abrirBase('pausa'));

// ---------------------------------------------------------------- primer día en el Relax
// Una lista corta que se tilda sola. No obliga a nada y se apaga desde los ajustes.
let acumuladoGuiaDia = 0;
function estadoGuiaRelax() {
  return {
    ramitas: progreso.ramitas || 0,
    fuego: !!progreso.entradas?.fogata || clima.fogata.activa,
    anotaciones: Object.keys(progreso.entradas || {}).length,
    troncos: material('tronco'),
    tablas: material('tabla'),
    obras: (progreso.obras || []).length,
  };
}
function revisarGuiaRelax(dt) {
  const caja = $('tutorial');
  if (!caja) return;
  const activa = !esDesafio && ajustes.guiaPrimerDia !== false && (progreso.guiaDia || 0) < PASOS_RELAX.length;
  caja.classList.toggle('oculto', !activa || modo !== 'jugando');
  if (!activa || modo !== 'jugando') return;
  acumuladoGuiaDia += dt;
  if (acumuladoGuiaDia < 0.8) return;
  acumuladoGuiaDia = 0;
  const r = avanzarRelax(progreso.guiaDia || 0, estadoGuiaRelax());
  if (r.indice !== (progreso.guiaDia || 0)) {
    progreso.guiaDia = r.indice;
    if (r.terminado) {
      progreso.ramitas = (progreso.ramitas || 0) + PREMIO_RELAX.ramitas;
      for (const [k, n] of Object.entries(PREMIO_RELAX.materiales)) sumarMaterial(k, n);
      refrescarBarra(true);
      nota('Ya sabés lo básico', `El bosque es tuyo: andá a donde quieras. +${PREMIO_RELAX.ramitas} ramitas, +${PREMIO_RELAX.materiales.tabla} tablas`, true);
    } else {
      sonido.anotar?.();
    }
    guardar();
  }
  dibujarPasos(caja, PASOS_RELAX, progreso.guiaDia || 0, 'Primeros pasos');
  traducirPanel(caja);
}

// ---------------------------------------------------------------- 3.1: la historia y los eventos del valle
// Capítulos con objetivos y eventos con decisiones, sólo en el Relax (ver historia-ui.js).
// Con una tarjeta abierta el mundo queda quieto: `modo` pasa a 'valle' hasta que elegís.
let valle = null;
function crearValle() {
  valle = crearValleUi({
    esDesafio, nota, guardar, sumarMaterial, traducir: traducirPanel,
    // con ?debug=1 los eventos al azar quedan quietos (las pruebas los prenden con __valle.azar(true))
    sinAzar: () => HOJARASCA_DEBUG,
    progreso: () => progreso, ajustes: () => ajustes, guardarAjustes: () => guardarAjustes(ajustes), modo: () => modo,
    pausar: () => { modo = 'valle'; jugador?.soltar(); },
    reanudar: () => volverAlJuego(),
    libre: () => !charla.npc && !enElAlmacen && !enLaFeria && !enLasCargas() && !mochilaAbierta && !modoObra && !foto.activo && !personalAbierto() && !banco.activa && !jugador?.estado.enCable && !pesca?.est?.recogiendo && !modos?.corriendo?.() && !$('fundido')?.classList.contains('activo'),   // 3.1: ni en plena carrera
    enVehiculo: () => { const js = jugador.estado; return !!(js.enTren || js.enKayak || js.enVela || js.montado); },
    extra: () => { const js = jugador?.estado || {}; return { fuego: !!clima?.fogata?.activa, conduciendo: !!(js.enTren && tren?.conduciendo()), enVela: !!js.enVela, terminadas: mueblesTerminados(), vecinos: vecinosActivos(progreso) }; },
    refrescarBarra: () => refrescarBarra(true), cobrar: (premio) => cobrarPremio({ premio }),
    pronostico: () => pronosticoActual(), lluvia: () => clima?.estado?.lluvia || 0, helarHuerta: () => helarLaHuerta(huerta()),
    obras: () => obras, altura: (x, z) => T.altura(x, z), sincronizarObras: () => { progreso.obras = obras.obras.map((o) => o.datos); },
    diario: (tipo, dato) => diario.anotar(tipo, dato), sonido: () => sonido,
  });
}

// ---------------------------------------------------------------- chinches del mapa
// Marcas propias: clic en el papel para poner una, clic encima para seguirla con la
// brújula, clic derecho para sacarla.
let chincheActiva = null;
let chinchesSaneadas = false;
function chinches() {
  // El guardián estaba al revés: saneaba sólo lo que NO era una lista, que es
  // justamente el caso en que no hay nada que sanear. Una lista con chinches
  // fuera del mapa, sin coordenadas o de más pasaba entera.
  if (!chinchesSaneadas) { progreso.chinches = sanearChinches(progreso.chinches); chinchesSaneadas = true; }
  return progreso.chinches;
}
function puntoDelMapa(ev) {
  const lienzoMapa = $('lienzo-mapa');
  const caja = lienzoMapa.getBoundingClientRect();
  const px = ((ev.clientX - caja.left) / caja.width) * lienzoMapa.width;
  const py = ((ev.clientY - caja.top) / caja.height) * lienzoMapa.height;
  return mapa.aMundo(px, py, lienzoMapa.width, lienzoMapa.height);
}
function tocarMapa(ev) {
  const p = puntoDelMapa(ev);
  const existente = chincheCerca(chinches(), p.x, p.z);
  if (existente) {
    chincheActiva = chincheActiva === existente ? null : existente;
    nota(chincheActiva ? `Rumbo a ${existente.nombre}` : 'Rumbo cancelado', chincheActiva ? 'La brújula te la marca hasta que llegues' : 'La brújula vuelve a lo de siempre');
  } else {
    const r = ponerChinche(chinches(), p.x, p.z, nombreLibre(chinches()));
    if (r.estado === 'llena') { nota('No entran más chinches', `El mapa aguanta ${MAX_CHINCHES}: sacá alguna con el clic derecho`); return; }
    progreso.chinches = r.lista;
    chincheActiva = r.chinche;
    nota(`Pusiste ${r.chinche.nombre}`, 'La brújula te lleva. Clic encima para soltarla, clic derecho para sacarla');
  }
  sonido.anotar?.();
  guardar();
  dibujarMapaSiAbierto();
}
function sacarDelMapa(ev) {
  ev.preventDefault();
  const p = puntoDelMapa(ev);
  const c = chincheCerca(chinches(), p.x, p.z);
  if (!c) return;
  if (chincheActiva === c) chincheActiva = null;
  progreso.chinches = sacarChinche(chinches(), c);
  nota(`Sacaste ${c.nombre}`, 'Una marca menos en el mapa');
  guardar();
  dibujarMapaSiAbierto();
}
function dibujarMapaSiAbierto() { if (modo === 'mapa') dibujarMapa(); }
$('lienzo-mapa').addEventListener('click', tocarMapa);
$('lienzo-mapa').addEventListener('contextmenu', sacarDelMapa);

function volverAlJuego() {
  reiniciarMedicion(autoCalidad);
  for (const id of ['pausa', 'cuaderno', 'mapa']) $(id).classList.add('oculto');
  modo = 'jugando';
  $('hud').classList.remove('oculto');
  sonido.iniciar();
  jugador.pedirBloqueo();
}

function sincronizarAjustes() {
  document.querySelectorAll('[data-ajuste]').forEach((grupo) => {
    const clave = grupo.dataset.ajuste;
    grupo.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(String(ajustes[clave]) === b.dataset.valor)));
  });
  document.querySelectorAll('[data-ajuste-rango]').forEach((i) => { i.value = ajustes[i.dataset.ajusteRango]; });
  sonido.setMezcla({ ambiente: ajustes.volumenAmbiente, efectos: ajustes.volumenEfectos, musica: ajustes.volumenMusica });
  $('aviso-calidad').classList.toggle('oculto', ajustes.calidad === calidadInicial);
  textoAjustesDistancia();   // 3.5
  if ($('modo-texto')) $('modo-texto').textContent = ajustes.modo === 'desafio'
    ? 'Cada noche baja una nave. Levantá tu cabaña, rodeala de defensas, fabricá o encontrá armas y resistí hasta el amanecer.'
    : 'El bosque de siempre: caminar, anotar, pescar y construir sin apuro. Nada te ataca.';
  // la dificultad sólo tiene sentido en el Desafío (y se puede cambiar en cualquier momento)
  $('opcion-dificultad')?.classList.toggle('oculto', ajustes.modo !== 'desafio');
  $('fila-dificultad')?.classList.toggle('oculto', !esDesafio);
  if ($('desafio-tipo-texto')) $('desafio-tipo-texto').textContent = ajustes.desafioTipo === 'sinfin'   // 3.0
    ? 'Una sola vida y ninguna noche final: cada noche vienen más duros. Caer termina la corrida y queda el récord. Tu campaña no se toca.'
    : 'Veinte noches hasta la nave nodriza, y después el nido.';
  if ($('dificultad-texto')) $('dificultad-texto').textContent = { tranquila: 'Pocos invasores y golpes suaves.', normal: 'Peligrosa, pero con defensas se resiste.', implacable: 'Más invasores y más duros.' }[ajustes.dificultad] || '';
  textoCodigo();
  valle?.portada(ajustes);   // 3.1: Libre o Historia, en el Relax
}
document.querySelectorAll('[data-ajuste]').forEach((grupo) => {
  grupo.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-valor]');
    if (!b) return;
    const clave = grupo.dataset.ajuste;
    let v = b.dataset.valor;
    if (clave === 'duracion' && v !== 'reloj') v = Number(v);
    if (clave === 'limiteFps' && v !== 'libre' && v !== 'auto') v = Number(v);   // 3.2: 'auto', según el monitor
    if (clave === 'musica' || clave === 'invertirY' || clave === 'autoCalidad' || clave === 'subtitulos' || clave === 'guiaPrimerDia' || clave === 'sonidosEscritos' || clave === 'vibracion') v = v === 'true';
    if (clave === 'modoFluido') v = v === 'true';   // 3.3
    if (clave === 'vibracion' && v) { ajustes.vibracion = true; ultimoPulso = null; vibrarMando('golpe', 1); }   // que se sienta que anda
    // 2.6.1: el idioma no se pisa acá: si no, la comparación de abajo nunca veía el cambio y no recargaba
    if (clave !== 'idioma') ajustes[clave] = v;
    guardarAjustes(ajustes);
    if (clave === 'musica') sonido.setMusica(v);
    if (clave === 'invertirY') mando.opciones.invertirY = v;   // 3.5.1: el mando también, sin reiniciar
    if (clave === 'clima' && clima?.estado) clima.estado.t = 0; // aplicar el modo elegido en el siguiente tick
    if (clave === 'clima' && clima?.estado) clima.estado.tramo = undefined;   // 2.9: y el programa del tiempo, desde el tramo de ahora (ver `meteo.js`)
    if (clave === 'virado') acumuladoTinte = 9;
    if (clave === 'calidad' && modo === 'inicio' && v !== calidadInicial) { guardar(); location.reload(); return; }
    if (clave === 'modo' && v !== modoJuego) {
      // cada modo tiene su propia partida: se guarda esta (si ya se jugó) y se levanta el mundo del otro
      if (habiaGuardado || modo !== 'inicio') guardar();
      $('carga').classList.remove('oculto');
      $('inicio').classList.add('oculto');
      $('carga-texto').textContent = v === 'desafio' ? 'Preparando el modo Desafío' : 'Volviendo al bosque tranquilo';
      setTimeout(() => location.reload(), 60);
      return;
    }
    // 3.0: la campaña o la supervivencia sin fin: cada una con su partida, se levanta el mundo de la otra
    if (clave === 'desafioTipo' && esDesafio && (v === 'sinfin') !== esSinFin) {
      if (habiaGuardado || modo !== 'inicio') guardar();
      $('carga').classList.remove('oculto');
      $('inicio').classList.add('oculto');
      $('carga-texto').textContent = v === 'sinfin' ? 'Preparando la supervivencia sin fin' : 'Volviendo a la campaña';
      setTimeout(() => location.reload(), 60);
      return;
    }
    if (clave === 'idioma' && v !== (ajustes.idioma || 'es')) {
      ajustes.idioma = v;
      guardarAjustes(ajustes);
      if (modo === 'jugando' || modo === 'pausa') guardar();
      reiniciandoPartida = true;
      cancelarGuardadoSuave();
      location.reload();
      return;
    }
    if (clave === 'calidad') sincronizarCalidad(autoCalidad, v);
    // 3.2: otro límite u otra calidad: el ritmo se vuelve a medir desde cero
    if (clave === 'limiteFps' || clave === 'calidad') ritmoAuto.reiniciar();
    if (clave === 'tamanoLetra' || clave === 'paleta' || clave === 'subtitulos') aplicarAccesibilidad();
    // 3.5: la distancia de dibujo o de plantas, en vivo (y el ritmo se vuelve a medir)
    if (clave === 'distancia' || clave === 'distanciaPlantas') { aplicarDistancias(); ritmoAuto.reiniciar(); }
    if (clave === 'calidad' && v === calidadInicial) $('aviso-calidad').classList.add('oculto');
    sincronizarAjustes();
  });
});
document.querySelectorAll('[data-ajuste-rango]').forEach((i) => {
  i.addEventListener('input', () => {
    ajustes[i.dataset.ajusteRango] = Number(i.value);
    guardarAjustes(ajustes);
    if (i.dataset.ajusteRango === 'volumen') sonido.setVolumen(ajustes.volumen);
  });
});
// 3.5: la distancia de dibujo en bloques (la barra); «Según la calidad» es un botón aparte
$('ajuste-distancia')?.addEventListener('input', (ev) => {
  ajustes.distancia = Math.min(BLOQUES_MAX, Math.max(BLOQUES_MIN, Math.round(Number(ev.target.value) || BLOQUES_MIN)));
  guardarAjustes(ajustes);
  aplicarDistancias();
  ritmoAuto.reiniciar();
  sincronizarAjustes();
});

// ---------------------------------------------------------------- 2.3: el código de partida
// Con un código, las decisiones de azar de cada noche del Desafío salen siempre iguales
// (ver `semilla.js`). Se elige al empezar: una partida ya empezada muestra el suyo.
function partidaEmpezada() { return !!(habiaGuardado && progreso.pos) || (progreso.desafio?.oleadas || 0) > 0; }
function recordDeCodigo(c) {
  try { return sanearRecordsSemilla(JSON.parse(localStorage.getItem('hojarasca-semillas-v1') || '{}'))[c] || null; } catch { return null; }
}
function textoCodigo() {
  const el = $('codigo-texto'), inp = $('codigo-partida'), semana = $('btn-codigo-semana');
  if (!el || !inp) return;
  const fija = esDesafio && partidaEmpezada();
  inp.disabled = fija; if (semana) semana.disabled = fija;
  if (fija) {
    const c = progreso.desafio?.semilla;
    inp.value = c || '';
    el.textContent = c ? `Esta partida usa ${c}: las mismas noches para cualquiera que lo use.` : 'Esta partida no tiene código. Se elige al empezar un Desafío nuevo.';
    return;
  }
  const c = normalizarCodigo(inp.value);
  const r = c ? recordDeCodigo(c) : null;
  el.textContent = !inp.value.trim() ? 'Con un código, las noches salen siempre iguales: sirve para comparar con la otra computadora o con amigos.'
    : !c ? 'Un código es una palabra y un número, como COIHUE-4821.'
    : r ? `Tu mejor con ${c}: ${r.noches} ${r.noches === 1 ? 'noche' : 'noches'}.`
    : `Con ${c}, las mismas noches para cualquiera que lo use.`;
}
function aplicarCodigo(p) {
  // 3.0: sin código escrito sigue el que ya traía la partida (empezar de nuevo, otra vuelta,
  // otra corrida) y si no hay ninguno, uno al azar: así siempre se puede compartir el mapa.
  // La campaña sin código arranca en el refugio, como siempre; la corrida sin fin, en cualquier lado.
  const c = normalizarCodigo($('codigo-partida')?.value || '') || p?.desafio?.semilla || (esSinFin ? codigoAlAzar() : codigoAlAzarEnElRefugio() || codigoAlAzar());
  if (p?.desafio) p.desafio.semilla = c;
  return c;
}
// 3.0: el mapa de la semilla. Al entrar a una partida nueva del Desafío se fija la base (y
// el tiempo de la corrida) según el código, y el jugador arranca ahí (ver desafio-mapa.js).
function empezarMapaDesafio() {
  const d = progreso.desafio;
  if (!d) return;
  const m = mapaDesafio(d.semilla);
  d.mapa = mapaGuardadoNuevo(m);
  if (m.semillaClima) { progreso.meteo = { ...(progreso.meteo || {}), semilla: m.semillaClima }; if (clima?.estado) clima.estado.tramo = undefined; }
  const r = T.lugares.refugio;
  const b = m.base.lugar === 'refugio' && r.puerta ? { x: r.puerta.x, z: r.puerta.z, yaw: r.mira } : m.base;
  jugador.ubicar(b.x, b.z, b.yaw);
  desafio?.mapaMundo?.sincronizar();
}
$('codigo-partida')?.addEventListener('input', textoCodigo);
// escribir en el campo no mueve al jugador ni abre nada
$('codigo-partida')?.addEventListener('keydown', (e) => e.stopPropagation());
$('btn-codigo-semana')?.addEventListener('click', () => { $('codigo-partida').value = codigoDeLaSemana(); textoCodigo(); });
// 3.0: una partida nueva que ya trae código (empezar de nuevo, otra vuelta, otra corrida) lo muestra
if (esDesafio && !partidaEmpezada() && progreso.desafio?.semilla && $('codigo-partida')) $('codigo-partida').value = progreso.desafio.semilla;

$('btn-entrar').addEventListener('click', () => {
  if (esDesafio && !partidaEmpezada()) {
    const escrito = !!normalizarCodigo($('codigo-partida')?.value || '');
    const c = aplicarCodigo(progreso);
    empezarMapaDesafio();   // 3.0
    if (c) setTimeout(() => nota(`Código ${c}`, escrito ? 'Las mismas noches y el mismo mapa para cualquiera que lo use. Tu récord con este código se guarda aparte'
      : 'Salió al azar: pasáselo a alguien y juega tu mismo valle, con las mismas noches'), 4200);
    if (esSinFin) setTimeout(() => nota('Supervivencia sin fin', 'Una sola vida: si caés, se termina la corrida. No hay noche final', true), 2600);
  }
  $('inicio').classList.add('oculto');
  if (origenGuardado === 'backup') setTimeout(() => nota('Partida recuperada', 'Se usó la última copia segura del recorrido'), 900);
  else if (esDesafio && (!habiaGuardado || !progreso.pos)) {
    setTimeout(() => nota('Esta noche bajan los invasores', 'Juntá troncos y piedra con el hacha (H) y armá defensas (O → Defensa)', true), 1500);
    setTimeout(() => nota('Fabricá armas con K', 'Primero una lanza. Algo cayó del cielo: buscá la columna de luz verde'), 7600);
  }
  else if (!habiaGuardado || !progreso.pos) setTimeout(() => nota('Salí a caminar. El sendero rodea el lago.', 'Primer día en el bosque'), 1500);
  // 3.6.2: lo tuyo que quedó donde ahora está la aldea (una partida de antes de la 3.6): una sola nota
  if (avisoDesalojo) { const a = avisoDesalojo; avisoDesalojo = null; setTimeout(() => nota(a.titulo, a.sub, true), 2600); }
  valle?.alEntrar();   // 3.1: con Historia elegida, empieza (o sigue) el capítulo
  volverAlJuego();
});
// 2.8: "Tu partida" (Personalizar) empieza una nueva por este mismo botón, con la receta.
function empezarPartidaNueva() { $('btn-nuevo').click(); }
$('btn-nuevo').addEventListener('click', async () => {
  // sin nada jugado todavía (portada de una partida que nunca se guardó) no hay qué perder
  const hayQuePreguntar = habiaGuardado || modo !== 'inicio';
  // 3.5.1: la pregunta es un cuadro del juego (dialogo.js), no el confirm del navegador
  const acepta = !hayQuePreguntar || await (esSinFin
    ? dialogos.confirmar('Esto abandona la corrida sin fin de ahora (no queda récord) y empieza otra. Tu campaña no se toca. ¿Querés continuar?')
    : esDesafio
    ? dialogos.confirmar('Esto borra la partida de Desafío y empieza desde la primera noche. Tu recorrido Relax no se toca. ¿Querés continuar?')
    : dialogos.confirmar('Esto borra el recorrido guardado y empieza desde cero. ¿Querés continuar?'));
  if (!acepta || reiniciandoPartida) return;
  // No usar guardar() acá: toma la posición del jugador actual y reinyectaría
  // el recorrido viejo dentro de la partida recién creada. También bloqueamos
  // beforeunload/visibilitychange durante este reload para evitar esa carrera.
  reiniciandoPartida = true;
  cancelarGuardadoSuave();
  // 2.8: lo personal (ropa, bandera, recetas) pasa a la partida nueva, y la receta de
  // "Tu partida" deja puestos la estación, el clima y la dificultad que eligió
  const conReceta = empezarConReceta(progreso.personal, ajustes);
  Object.assign(ajustes, conReceta.ajustes);
  guardarAjustes(ajustes);
  borrarProgreso();
  progreso = progresoNuevo();
  progreso.personal = sanearPersonal(conReceta.personal);
  if (esDesafio) aplicarCodigo(progreso);   // 2.3: el código que esté escrito en la portada
  guardarProgreso(progreso);
  location.reload();
});
$('btn-seguir').addEventListener('click', volverAlJuego);
$('btn-cuaderno').addEventListener('click', () => abrir('cuaderno'));
$('btn-mapa').addEventListener('click', () => abrir('mapa'));
$('btn-foto').addEventListener('click', () => {
  volverAlJuego();
  if (idFotoPendiente) clearTimeout(idFotoPendiente);
  idFotoPendiente = setTimeout(() => {
    idFotoPendiente = 0;
    if (modo === 'jugando') pedirFoto = true;
  }, 350);
});
$('btn-inicio').addEventListener('click', () => {
  guardar();
  if (ajustes.calidad !== calidadInicial) { location.reload(); return; }
  for (const id of ['pausa', 'cuaderno', 'mapa']) $(id).classList.add('oculto');
  $('hud').classList.add('oculto');
  $('inicio').classList.remove('oculto');
  modo = 'inicio';
  sincronizarAjustes();
});
// ------- logros (portada y pausa) y la pantalla de victoria
// 1.10: el Relax también tiene los suyos. Van a Steam si Steam está (steam.js).
const steamPuente = crearSteam();
const logrosRelax = esDesafio ? null : crearLogrosRelax();
{
  const estilo = document.createElement('style');
  estilo.textContent = CSS_LOGROS;
  document.head.appendChild(estilo);
  $('btn-logros-inicio').classList.remove('oculto');
  $('btn-logros').classList.remove('oculto');
  if (esDesafio) $('btn-base').classList.remove('oculto');
}
let acumuladoLogros = 0;
function revisarLogrosRelax(dt) {
  if (!logrosRelax) return [];
  acumuladoLogros += dt;
  if (acumuladoLogros < 3) return [];
  acumuladoLogros = 0;
  const nuevos = logrosRelax.revisar(progreso);
  nuevos.forEach((l, i) => {
    steamPuente.desbloquear('relax', l.id);
    setTimeout(() => {
      nota(`Logro: ${l.nombre}`, l.texto, true);
      // 2.7: dos notas de cuerda (mi, si) en vez del bloop; si la cuerda no está lista, el tono de siempre
      if (!sonido.pulsar?.(76, { dur: 1.2, vol: 0.1, destino: sonido.bus?.efectos })) sonido.tono?.({ frec: 660, fin: 990, dur: 0.5, tipo: 'triangle', vol: 0.12, destino: sonido.bus?.efectos });
      else sonido.pulsar(83, { cuando: 0.12, dur: 1.4, vol: 0.09, destino: sonido.bus?.efectos });
    }, 900 + i * 2200);
  });
  return nuevos;
}
let origenLogros = null;
function abrirLogros(origen) {
  const libreta = desafio ? desafio.logros : logrosRelax;
  if (!libreta) return;
  origenLogros = origen;
  $(origen).classList.add('oculto');
  dibujarLogros($('logros-contenido'), libreta, ajustes.dificultad);
  if (esDesafio) sumarRecordsSinFin($('logros-contenido'));   // 3.0
  traducirPanel($('logros-contenido'));
  $('logros').classList.remove('oculto');
}
function cerrarLogros() {
  $('logros').classList.add('oculto');
  if (origenLogros) $(origenLogros).classList.remove('oculto');
  origenLogros = null;
}
$('btn-logros-inicio').addEventListener('click', () => abrirLogros('inicio'));
$('btn-logros').addEventListener('click', () => abrirLogros('pausa'));
// 3.1: carreras, desafío del día y torneo de la semana (portada y pausa)
$('btn-modos-inicio').addEventListener('click', () => modos?.abrirPanel('inicio'));
$('btn-modos').addEventListener('click', () => modos?.abrirPanel('pausa'));
$('cerrar-modos31').addEventListener('click', () => modos?.cerrarPanel());
$('cerrar-logros').addEventListener('click', cerrarLogros);

// ---------------------------------------------------------------- la guía (F1)
{ const estilo = document.createElement('style'); estilo.textContent = CSS_GUIA; document.head.appendChild(estilo); }
let origenGuia = null, seccionGuia = null;
function dibujarGuia() {
  // desde la portada, la del modo elegido; en partida, la del modo que se está jugando
  const modoGuia = origenGuia === 'inicio' ? ajustes.modo : (esDesafio ? 'desafio' : 'relax');
  $('guia-contenido').innerHTML = htmlGuia(modoGuia, seccionGuia);
  traducirPanel($('guia-contenido'));
}
function abrirGuia(origen) {
  origenGuia = origen;
  if (origen) $(origen).classList.add('oculto');
  dibujarGuia();
  $('guia').classList.remove('oculto');
}
function cerrarGuia() {
  $('guia').classList.add('oculto');
  if (origenGuia) $(origenGuia).classList.remove('oculto');
  origenGuia = null;
}
const guiaAbierta = () => !$('guia').classList.contains('oculto');
$('guia-contenido').addEventListener('click', (e) => {
  const b = e.target.closest('[data-guia]');
  if (b) { seccionGuia = b.dataset.guia; dibujarGuia(); }
});
$('btn-guia-inicio').addEventListener('click', () => abrirGuia('inicio'));
$('btn-guia').addEventListener('click', () => abrirGuia('pausa'));
$('cerrar-guia').addEventListener('click', cerrarGuia);

// ---------------------------------------------------------------- partidas guardadas
{ const estilo = document.createElement('style'); estilo.textContent = CSS_PARTIDAS; document.head.appendChild(estilo); }
let origenPartidas = null;
function dibujarPartidas() {
  $('partidas-lista').innerHTML = htmlPartidas(listaPartidas(modoJuego), modoJuego, ranuraActual());
  traducirPanel($('partidas-lista'));
}
function abrirPartidas(origen) {
  origenPartidas = origen;
  if (origen) $(origen).classList.add('oculto');
  dibujarPartidas();
  $('partidas').classList.remove('oculto');
}
function cerrarPartidas() {
  $('partidas').classList.add('oculto');
  if (origenPartidas) $(origenPartidas).classList.remove('oculto');
  origenPartidas = null;
}
// Cambiar de partida rehace el mundo: se guarda lo que había y se recarga.
function irAPartida(ranura) {
  if (ranura === ranuraActual()) { cerrarPartidas(); return; }
  if (modo === 'jugando' || modo === 'pausa') guardar();
  ajustes.ranura = ranura;
  if (esSinFin) ajustes.desafioTipo = 'campana';   // 3.0: las tres partidas son de la campaña
  guardarAjustes(ajustes);
  reiniciandoPartida = true;
  cancelarGuardadoSuave();
  location.reload();
}
// Llevarse la partida a otra computadora: se baja como archivo y se vuelve a leer acá.
function textoParaExportar(ranura) {
  if (ranura === ranuraActual()) guardar();
  const datos = leerPartida(modoJuego, ranura);
  if (!datos) return null;
  return empaquetar({
    progreso: datos.progreso, fotos: datos.fotos, modo: modoJuego, ranura,
    version: (document.getElementById('version-completa')?.textContent || '').replace('Versión ', '').trim(),
  });
}
// 1.10: el cuaderno para compartir. Una página HTML con el álbum, el diario y lo
// anotado, que se abre en cualquier navegador. Se baja como las fotos: sin diálogos.
function exportarAlbum() {
  const datos = datosAlbum({ progreso, desafios: DESAFIOS, secciones: SECCIONES, entradas: ENTRADAS });
  if (!datos.fotos.length && !datos.diario.length && !datos.anotaciones) { nota('Todavía no hay nada para llevarse', 'Anotá algo, sacá fotos o dormí una noche para que se escriba el diario'); return null; }
  const version = document.getElementById('version-completa')?.textContent?.replace(/^Versión /, '') || '';
  const texto = htmlAlbum(datos, { titulo: modoJuego === 'desafio' ? 'Cuaderno del Desafío' : 'Cuaderno de campo', version, t: T_ });
  const blob = new Blob([texto], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivoAlbum(progreso);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  nota('Cuaderno guardado', `${a.download} · ${datos.fotos.length} fotos y ${datos.diario.length} páginas del diario`, true);
  return { nombre: a.download, texto, datos };
}
$('btn-album').addEventListener('click', () => exportarAlbum());
function exportarPartida(ranura) {
  const texto = textoParaExportar(ranura);
  if (!texto) { nota('Esa partida está vacía', 'No hay nada para exportar'); return; }
  const datos = { progreso: JSON.parse(texto).cuerpo.progreso };
  const blob = new Blob([texto], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivoPartida(modoJuego, datos.progreso);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  nota('Partida exportada', `${a.download} · llevátelo y en la otra máquina usá "Importar acá"`, true);
}
// Devuelve si se pudo, y por qué no. La separo del cuadro de diálogo para poder
// probar la importación de verdad, sin depender de que se abra un selector de archivos.
function importarTexto(ranura, texto, preguntar = true) {
  const r = leerPaquete(texto);
  if (!r.ok) { nota('No se pudo importar', r.motivo); return { ok: false, motivo: r.motivo }; }
  if (r.paquete.modo !== modoJuego) {
    const motivo = `Es del modo ${r.paquete.modo === 'desafio' ? 'Desafío' : 'Relax'}: cambiá de modo en la portada y volvé a importarla`;
    nota('Esa partida es del otro modo', motivo);
    return { ok: false, motivo };
  }
  // 3.5.1: preguntando, la respuesta llega después (cuadro del juego): devuelve una promesa
  if (preguntar) return dialogos.confirmar(avisoImportar(r.paquete, infoPartida(modoJuego, ranura)))
    .then((si) => (si ? importarTexto(ranura, texto, false) : { ok: false, motivo: 'cancelado' }));
  if (!escribirPartida(modoJuego, ranura, r.paquete.progreso, r.paquete.fotos)) {
    nota('No se pudo guardar la partida importada', 'Puede que no haya espacio libre');
    return { ok: false, motivo: 'no se pudo guardar' };
  }
  nota('Partida importada', `Quedó en la partida ${ranura}`, true);
  if (ranura === ranuraActual()) { reiniciandoPartida = true; cancelarGuardadoSuave(); location.reload(); return { ok: true, recarga: true }; }
  dibujarPartidas();
  return { ok: true };
}
function importarPartida(ranura) {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = '.json,application/json';
  entrada.addEventListener('change', async () => {
    const archivo = entrada.files?.[0];
    if (!archivo) return;
    let texto = '';
    try { texto = await archivo.text(); } catch { nota('No se pudo leer el archivo', 'Probá copiarlo a otra carpeta'); return; }
    importarTexto(ranura, texto);
  });
  entrada.click();
}
$('partidas-lista').addEventListener('click', async (e) => {
  const jugar = e.target.closest('[data-partida-jugar]');
  if (jugar) { irAPartida(Number(jugar.dataset.partidaJugar)); return; }
  const exportar = e.target.closest('[data-partida-exportar]');
  if (exportar) { exportarPartida(Number(exportar.dataset.partidaExportar)); return; }
  const importar = e.target.closest('[data-partida-importar]');
  if (importar) { importarPartida(Number(importar.dataset.partidaImportar)); return; }
  const borrar = e.target.closest('[data-partida-borrar]');
  if (!borrar) return;
  const r = Number(borrar.dataset.partidaBorrar);
  if (!await dialogos.confirmar(`Esto borra la partida ${r} del modo ${modoJuego === 'desafio' ? 'Desafío' : 'Relax'}. No se puede deshacer. ¿Seguro?`)) return;
  borrarPartida(modoJuego, r);
  if (r === ranuraActual()) { reiniciandoPartida = true; cancelarGuardadoSuave(); location.reload(); return; }
  dibujarPartidas();
});
$('btn-partidas-inicio').addEventListener('click', () => abrirPartidas('inicio'));

// ---------------------------------------------------------------- carpeta sincronizada
// 1.11 (ver sincronia.js): una copia de la partida en una carpeta que se sincroniza sola.
// `baseSync` es la última versión de la carpeta que esta computadora conoce (la que leyó
// al abrir o la que escribió): si en la carpeta aparece algo más nuevo, lo dejó la otra
// computadora, y Electron no lo pisa (sincronia-main.cjs).
// La base se recuerda entre sesiones: así una copia que ya viste (o que importaste) no se
// vuelve a ofrecer aunque los relojes de las dos computadoras no coincidan.
const syncApi = window.hojarasca?.sync || null;
let carpetaSync = null, ultimaCopiaSync = 0, copiadoEnSync = 0, relojSync = 0, conflictoSync = false;
const claveBaseSync = () => `hojarasca-sync-base-${modoJuego}-p${ranuraActual()}`;
let baseSync = (() => { try { return Number(localStorage.getItem(claveBaseSync())) || 0; } catch { return 0; } })();
function fijarBaseSync(g) {
  baseSync = Math.max(baseSync, Number(g) || 0);
  try { localStorage.setItem(claveBaseSync(), String(baseSync)); } catch {}
}
const guardadoEnActual = () => infoPartida(modoJuego, ranuraActual())?.guardadoEn || 0;
function avisarConflictoSync() {
  if (conflictoSync) return;
  conflictoSync = true;
  nota('La carpeta sincronizada tiene una partida más nueva', 'La dejó tu otra computadora: no la piso. Cerrá y volvé a abrir el juego para elegir con cuál seguir', true);
}
function copiarASync(forzar = false, ya = false) {
  if (esSinFin) return false;   // 3.0: la corrida sin fin no es una de las tres partidas: no viaja
  if (!syncApi || !carpetaSync || reiniciandoPartida || conflictoSync) return false;
  if (!tocaCopiar({ ultimaCopia: ultimaCopiaSync, guardadoEn: guardadoEnActual(), copiadoEn: copiadoEnSync, forzar })) return false;
  const texto = textoParaExportar(ranuraActual());
  if (!texto) return false;
  const nombre = nombreSync(modoJuego, ranuraActual());
  const base = baseSync;
  ultimaCopiaSync = Date.now();
  copiadoEnSync = guardadoEnActual();
  if (ya) { const r = syncApi.escribirYa(nombre, texto, base); if (r === true) fijarBaseSync(copiadoEnSync); else if (r === 'conflicto') conflictoSync = true; return r === true; }
  syncApi.escribir(nombre, texto, base).then((r) => { if (r === true) fijarBaseSync(copiadoEnSync); else if (r === 'conflicto') avisarConflictoSync(); }).catch(() => {});
  return true;
}
function dibujarSync() {
  if (!syncApi) return;
  $('partidas-sync').classList.remove('oculto');
  $('sync-carpeta').textContent = carpetaSync || T_('ninguna');
  $('btn-sync-olvidar').classList.toggle('oculto', !carpetaSync);
  $('btn-sync-elegir').textContent = T_(carpetaSync ? 'Cambiar carpeta…' : 'Elegir carpeta…');
}
// Mira la copia de la carpeta. Si es más nueva que la de esta computadora, pregunta con
// cuál seguir; si no, o si elegís la de acá, queda como base y se puede pisar.
async function mirarCarpetaSync() {
  if (esSinFin) return;   // 3.0
  let texto = null;
  try { texto = await syncApi.leer(nombreSync(modoJuego, ranuraActual())); } catch {}
  const r = texto ? leerPaquete(texto) : null;
  if (!r?.ok || r.paquete.modo !== modoJuego) return;
  const enCarpeta = Number(r.paquete.progreso.guardadoEn) || 0;
  const local = infoPartida(modoJuego, ranuraActual());
  // ya la viste (la escribiste vos o la importaste): no se ofrece de nuevo
  // (la misma partida exacta que hay acá, tampoco)
  if (enCarpeta <= baseSync || (local?.hay && Number(local.guardadoEn) === enCarpeta)) { fijarBaseSync(enCarpeta); return; }
  // 3.5.1: más nueva que la última que vimos = la escribió la otra computadora. Si la de acá es
  // igual de nueva (las dos siguieron, o relojes distintos), también se pregunta: antes se fijaba
  // la base en silencio y la próxima copia de acá pisaba lo de la otra.
  const masNueva = compararCopia(local, r.paquete) === 'ofrecer';
  const si = await dialogos.confirmar(masNueva ? textoOfertaSync(local, r.paquete) : textoDosCambiaron(local, r.paquete));   // 3.5.1
  fijarBaseSync(enCarpeta);   // con un sí se importa; con un no, la próxima copia la reemplaza
  if (si) importarTexto(ranuraActual(), texto, false);
}
// Al abrir: si la copia de la carpeta es más nueva que la de esta máquina, se ofrece.
async function revisarCarpetaSync() {
  if (!syncApi) return;
  try { carpetaSync = await syncApi.carpeta(); } catch { carpetaSync = null; }
  dibujarSync();
  if (carpetaSync) await mirarCarpetaSync();
}
$('btn-sync-elegir').addEventListener('click', async () => {
  try { carpetaSync = await syncApi.elegir(); } catch { carpetaSync = null; }
  dibujarSync();
  if (!carpetaSync) return;
  copiadoEnSync = 0; conflictoSync = false;
  await mirarCarpetaSync();
  if (reiniciandoPartida) return;
  copiarASync(true);
  nota('Carpeta sincronizada', `La partida se copia sola en ${carpetaSync}`, true);
});
$('btn-sync-olvidar').addEventListener('click', async () => {
  try { await syncApi.olvidar(); } catch {}
  carpetaSync = null;
  dibujarSync();
  nota('Carpeta sincronizada', 'La partida ya no se copia. Lo que quedó en la carpeta sigue ahí');
});
$('btn-partidas').addEventListener('click', () => abrirPartidas('pausa'));
$('cerrar-partidas').addEventListener('click', cerrarPartidas);

// ---------------------------------------------------------------- teclas y mando
let origenTeclas = null, capturandoTecla = null;
function dibujarTeclas() {
  const cont = $('teclas-lista');
  traducirPanel($('teclas'));
  cont.innerHTML = '';
  const m = mando.hayMando();
  $('teclas-mando').textContent = m ? `Mando conectado: ${mando.nombre()}. El stick izquierdo camina, el derecho mira; A salta, X interactúa, R2 ataca, L2 bloquea.` : 'No hay ningún mando conectado. Si enchufás uno, el juego lo toma solo.';
  for (const accion of ACCIONES_TECLA) {
    const fila = document.createElement('div');
    fila.className = 'fila-tecla';
    const nombre = document.createElement('span');
    nombre.textContent = NOMBRES_ACCIONES[accion] || accion;
    const b = document.createElement('button');
    b.textContent = capturandoTecla === accion ? 'apretá una tecla…' : (textoTecla(teclasPropias[accion]) || 'sin tecla');
    if (esFija(accion)) { b.disabled = true; b.title = 'Esta no se puede cambiar: es la que te saca de los menús'; }
    else b.addEventListener('click', () => { capturandoTecla = accion; dibujarTeclas(); });
    fila.append(nombre, b);
    cont.appendChild(fila);
  }
}
function abrirTeclas(origen) {
  origenTeclas = origen;
  capturandoTecla = null;
  if (origen) $(origen).classList.add('oculto');
  dibujarTeclas();
  $('teclas').classList.remove('oculto');
}
function cerrarTeclas() {
  capturandoTecla = null;
  $('teclas').classList.add('oculto');
  if (origenTeclas) $(origenTeclas).classList.remove('oculto');
  origenTeclas = null;
}
const teclasAbiertas = () => !$('teclas').classList.contains('oculto');
// Mientras el panel espera una tecla, esa tecla no hace nada más.
function tomarTeclaNueva(code) {
  const accion = capturandoTecla;
  capturandoTecla = null;
  if (code === 'Escape') { dibujarTeclas(); return; }
  const r = cambiarTecla(teclasPropias, accion, code);
  if (!r.ok) { nota('Esa tecla ya está usada', r.motivo); dibujarTeclas(); return; }
  teclasPropias = r.mapa;
  ajustes.teclas = teclasPropias;
  recordarHuerfanas();
  guardarAjustes(ajustes);
  dibujarTeclas();
}
$('teclas-defecto').addEventListener('click', () => {
  teclasPropias = mapaPorDefecto();
  ajustes.teclas = teclasPropias;
  recordarHuerfanas();
  guardarAjustes(ajustes);
  capturandoTecla = null;
  dibujarTeclas();
  nota('Teclas de fábrica', 'Volvió todo como venía');
});
$('btn-teclas').addEventListener('click', () => abrirTeclas('pausa'));
$('btn-teclas-inicio').addEventListener('click', () => abrirTeclas('inicio'));
$('cerrar-teclas').addEventListener('click', cerrarTeclas);

// ---------------------------------------------------------------- 2.8: personalizar
// El panel "Personalizar" (ver personalizacion.js): una pestaña por cada sección que se
// importa en personal-todo.js. Lo elegido vive en progreso.personal, se sanea al cargar
// (guardado.js), viaja con la partida (exportar, sincronizar) y pasa a la partida nueva.
// Se abre desde la pausa, la portada, la mochila o con F5 (si no la usa otra acción).
let origenPersonal = null, seccionPersonal = null;
let cuerpoJugador = null, manoPropia = null, banderaMundo = null;
// Lo que main.js le presta a cada sección para llevar lo elegido al mundo. Se llena al
// armar el mundo (armarMundoPersonal); antes está vacío y las secciones no hacen nada.
const mundoPersonal = {};
function datosPersonal(s) {
  if (!progreso.personal || typeof progreso.personal !== 'object') progreso.personal = sanearPersonal(null);
  if (!Object.hasOwn(progreso.personal, s.id)) progreso.personal[s.id] = s.sanear(s.porDefecto());
  return progreso.personal[s.id];
}
function apiPersonal(s) {
  return {
    get progreso() { return progreso; },
    get datos() { return datosPersonal(s); },
    cambiar: (parcial) => cambiarPersonal(s, parcial),
    guardar: () => guardar(),
    mundo: mundoPersonal,
    redibujar: () => dibujarPersonal(),
  };
}
// Mezcla, sanea, guarda y vuelve a aplicar todo (una sección puede depender de otra).
function cambiarPersonal(s, parcial) {
  const antes = datosPersonal(s);
  let nuevo;
  try { nuevo = s.sanear({ ...antes, ...(parcial && typeof parcial === 'object' ? parcial : {}) }); } catch { nuevo = antes; }
  progreso.personal = { ...progreso.personal, [s.id]: nuevo };
  guardar();
  aplicarPersonal();
  return nuevo;
}
function aplicarPersonal() {
  for (const s of secciones()) {
    if (typeof s.aplicar !== 'function') continue;
    try { s.aplicar(datosPersonal(s), apiPersonal(s)); } catch (err) { console.warn(`Personalizar · ${s.id}:`, err); }
  }
}
function dibujarPersonal() {
  const lista = secciones();
  if (!lista.some((s) => s.id === seccionPersonal)) seccionPersonal = lista[0]?.id || null;
  const pest = $('personal-pestanas'), cont = $('personal-contenido');
  pest.innerHTML = '';
  for (const s of lista) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.titulo;
    b.id = `personal-pestana-${s.id}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(s.id === seccionPersonal));
    b.addEventListener('click', () => { seccionPersonal = s.id; dibujarPersonal(); });
    pest.appendChild(b);
  }
  cont.innerHTML = '';
  cont.dataset.seccion = seccionPersonal || '';
  const s = lista.find((x) => x.id === seccionPersonal);
  if (s && typeof s.construir === 'function') {
    try { s.construir(cont, apiPersonal(s)); }
    catch (err) { console.warn(`Personalizar · ${s.id}:`, err); cont.textContent = 'Esta sección no se pudo armar.'; }
  }
  traducirPanel($('personalizar'));
}
function abrirPersonal(origen) {
  origenPersonal = origen;
  if (origen) $(origen).classList.add('oculto');
  dibujarPersonal();
  $('personalizar').classList.remove('oculto');
}
function cerrarPersonal() {
  $('personalizar').classList.add('oculto');
  if (origenPersonal) $(origenPersonal).classList.remove('oculto');
  origenPersonal = null;
}
const personalAbierto = () => !$('personalizar').classList.contains('oculto');
// Desde el juego (la mochila o F5) pasa por la pausa, como la guía: el mouse queda libre
// y el mundo se detiene mientras elegís.
function personalizarDesdeElJuego() {
  if (modo === 'jugando' && jugador) {
    if (mochilaAbierta) abrirMochila(false);
    abrir('pausa');
    abrirPersonal('pausa');
  } else if (modo === 'pausa') abrirPersonal('pausa');
  else if (!$('inicio').classList.contains('oculto')) abrirPersonal('inicio');
}
$('btn-personalizar').addEventListener('click', () => abrirPersonal('pausa'));
$('btn-personalizar-inicio').addEventListener('click', () => abrirPersonal('inicio'));
$('btn-personalizar-mochila').addEventListener('click', personalizarDesdeElJuego);
$('btn-personalizar-mochila').addEventListener('mousedown', (ev) => ev.stopPropagation());   // 3.6.2: que el clic no tire la línea
$('cerrar-personalizar').addEventListener('click', cerrarPersonal);

// "Tu interfaz" en el HUD: clases en #hud y el color de acento (ver personal-interfaz.js).
function aplicarInterfazPersonal(d) {
  const x = sanearInterfaz(d);
  const hud = $('hud');
  hud.classList.toggle('minimalista', x.minimalista);
  hud.classList.toggle('sin-brujula', !x.brujula);
  for (const m of MIRAS) hud.classList.toggle(`mira-${m.id}`, m.id === x.mira && m.id !== 'punto');
  const raiz = document.documentElement;
  if (x.acento === 'papel') { raiz.style.removeProperty('--acento'); raiz.style.removeProperty('--acento-borde'); }
  else { raiz.style.setProperty('--acento', colorAcento(x.acento)); raiz.style.setProperty('--acento-borde', colorAcento(x.acento)); }
  aplicarAccesibilidad();
}
// Tu cuerpo, tu mano y tu bandera, y lo que cada sección necesita del mundo.
function armarMundoPersonal() {
  try { cuerpoJugador = crearCuerpoJugador(escena); } catch (err) { console.warn('Personalizar · cuerpo:', err); }
  try { manoPropia = crearManoPropia(enMano); } catch (err) { console.warn('Personalizar · mano:', err); }
  // la bandera flamea en el mástil de "Tu refugio" (est.mastil) si está; si no, en uno propio
  try { banderaMundo = crearBanderaMundo(escena, T, col, { mastilAjeno: est?.mastil || null }); } catch (err) { console.warn('Personalizar · bandera:', err); }
  Object.assign(mundoPersonal, {
    escena, camara, renderer, T, col, veg, jugador, perro, caballo: caballoMundo, kayak, tren, pesca, gente, fauna,
    obras, estructuras: est, refugioVivo, desafio, defensas: desafio?.defensas || null, sonido, enmano: enMano, clima,
    ajustes, esDesafio, nota: (t, sub, nueva) => nota(t, sub, nueva), guardarAjustes: () => guardarAjustes(ajustes),
    texturaBandera, empezarPartidaNueva,
    // lo de cada sección propia
    personaje: { aplicar: (d) => { cuerpoJugador?.aplicar(d); manoPropia?.aplicar(d); } },
    interfaz: { aplicar: (d) => aplicarInterfazPersonal(d) },
    bandera: { aplicar: (d) => banderaMundo?.aplicar(d) },
    partida: { aplicar: () => {} },
  });
  aplicarPersonal();
}
function actualizarMundoPersonal(dt, js) {
  // tu sombra: al quedarte quieto (o arrancar) se pide un mapa de sombras nuevo, una vez
  if (cuerpoJugador?.actualizar(dt, js, { conSombras: !!cielo?.sol?.castShadow && renderer.shadowMap.enabled })) renderer.shadowMap.needsUpdate = true;
  manoPropia?.actualizar();
  banderaMundo?.actualizar(dt, js.pos, { obras, viento: clima?.estado?.viento ?? 0.5 });
}
// Dos finales con la misma pantalla: la nodriza abre el segundo acto, el nido lo cierra.
let parteUltimo = null;
{ const estilo = document.createElement('style'); estilo.textContent = CSS_PARTE; document.head.appendChild(estilo); }
function mostrarVictoria(s, final = false) {
  setTimeout(() => {
    // 3.0: si se ganó desde adentro de la nave (el asedio), la pantalla lo cuenta
    $('victoria-titulo').textContent = final ? 'El nido cayó' : s?.nave ? 'La nave cayó desde adentro' : '¡La nave nodriza cayó!';
    $('victoria-sub').textContent = final ? 'Se terminó el Desafío' : 'Ganaste el Desafío';
    $('victoria-texto').textContent = final
      ? 'De acá no sale nadie más. Las noches vuelven a ser noches y el valle queda para vos: lo que levantaste sigue en pie y el bosque se va a encargar del resto.'
      : s?.nave ? 'Subiste por el haz, le reventaste el corazón a la Madre y saliste antes de que la nave tocara el suelo. El valle respira, pero siguen bajando: salen de un nido enterrado en algún lado. Los restos de nave te van a decir dónde.'
      : 'El valle respira, pero siguen bajando. Salen de un nido que está enterrado en algún lado: los restos de nave te van a decir dónde, y se rompe de día, cuando el caparazón se abre.';
    $('victoria-seguir').textContent = final ? 'Quedarme en el valle' : 'Seguir';
    // 2.0: con el nido caído se puede elegir seguir: cinco noches de invasores cambiados
    $('victoria-despues').classList.toggle('oculto', !(final && desafio && !desafio.despues));
    parteUltimo = resumenPartida({
      desafio: { ...(progreso.desafio || {}), ...s },
      progreso,
      planos: PLANO,
      logros: desafio?.logros?.progreso ? desafio.logros.progreso() : {},
      dificultad: s.dificultad,
      final,
    });
    $('victoria-datos').innerHTML = htmlParte(parteUltimo);
    pintarBanderaEn($('victoria-bandera'), progreso.personal?.bandera);   // 2.8: tu bandera
    traducirPanel($('victoria'));
    $('victoria-copiar').classList.remove('oculto');
    $('victoria-vuelta').classList.toggle('oculto', !(final && puedeOtraVuelta(progreso.desafio)));
    jugador.soltar();
    modo = 'victoria';
    if (personalAbierto()) { $('personalizar').classList.add('oculto'); origenPersonal = null; }   // 2.8: no la tapa
    $('victoria').classList.remove('oculto');
  }, 5200);
}
$('victoria-seguir').addEventListener('click', () => { $('victoria').classList.add('oculto'); volverAlJuego(); });
$('victoria-despues').addEventListener('click', () => {
  desafio?.empezarDespues?.();
  $('victoria').classList.add('oculto');
  volverAlJuego();
});
// 1.10: Nueva partida+. Arranca de cero con las armas, las mejoras y los planos, y con
// los invasores más duros. Mismo camino que empezar una partida nueva: sin guardar()
// en el medio, que reinyectaría la posición vieja en la partida recién armada.
async function otraVuelta() {
  if (!desafio || !puedeOtraVuelta(progreso.desafio)) return;
  const siguiente = (progreso.desafio.vuelta || 0) + 1;
  const m = multiplicadorVuelta(siguiente);
  const acepta = await dialogos.confirmar(`Otra vuelta: vuelve a empezar desde la primera noche, sin base ni materiales, pero con tus armas, las mejoras y los planos. Los invasores vienen ${Math.round((m.cantidad - 1) * 100)}% más, aguantan ${Math.round((m.vida - 1) * 100)}% más y pegan ${Math.round((m.dano - 1) * 100)}% más fuerte. ¿Vamos?`);
  if (!acepta || reiniciandoPartida || !puedeOtraVuelta(progreso.desafio)) return;
  const nueva = nuevaVuelta(progreso, progresoNuevo());
  reiniciandoPartida = true;
  cancelarGuardadoSuave();
  borrarProgreso();
  nueva.personal = progreso.personal;   // 2.8: tu ropa, tu bandera y tus recetas siguen con vos
  progreso = nueva;
  guardarProgreso(progreso);
  location.reload();
}
$('victoria-vuelta').addEventListener('click', otraVuelta);
// ---------------------------------------------------------------- 3.0: la supervivencia sin fin
// Caer termina la corrida: se anota el récord (los diez mejores de todas y de cada código),
// la ranura queda marcada como terminada y se muestra el resumen con "otra corrida".
const CLAVE_SIN_FIN = 'hojarasca-sinfin-v1';
function recordsSinFin() {
  try { return sanearRecordsSinFin(JSON.parse(localStorage.getItem(CLAVE_SIN_FIN) || '{}')); } catch { return sanearRecordsSinFin(null); }
}
let corridaUltima = null;
function terminarCorrida() {
  const d = progreso.desafio;
  if (!esSinFin || !d || d.sinFin?.terminada) return null;
  d.sinFin = { terminada: true };
  const entrada = { noches: d.noches || 0, abatidos: d.abatidos || 0, fecha: new Date().toISOString().slice(0, 10), codigo: d.semilla, dificultad: ajustes.dificultad };
  const r = registrarCorrida(recordsSinFin(), entrada);
  try { localStorage.setItem(CLAVE_SIN_FIN, JSON.stringify(r.records)); } catch {}
  corridaUltima = { ...entrada, puesto: r.puesto, puestoCodigo: r.puestoCodigo };
  guardar();
  if (modoObra) abrirObra(false);
  if (mochilaAbierta) abrirMochila(false);
  desafio?.abrirTaller(false);
  $('fundido').classList.add('activo');
  setTimeout(() => { desafio?.limpiar(); mostrarCorrida(); $('fundido').classList.remove('activo'); }, 1600);
  return corridaUltima;
}
function listaRecordsHtml(titulo, lista, marcar) {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (!lista.length) return '';
  return `<div class="logro-records-titulo">${esc(titulo)}</div><ol class="corrida-lista">${lista.map((r, i) => `<li${marcar && r.noches === marcar.noches && r.abatidos === marcar.abatidos && r.fecha === marcar.fecha && (i + 1 === marcar.puesto || i + 1 === marcar.puestoCodigo) ? ' class="nueva"' : ''}>${esc(lineaRecord(r, i).replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
}
function mostrarCorrida() {
  const c = corridaUltima;
  if (!c) return;
  const txt = resumenCorrida(c);
  $('corrida-titulo').textContent = txt.titulo;
  $('corrida-sub').textContent = txt.sub;
  $('corrida-lugar').textContent = txt.lugar;
  const rec = recordsSinFin();
  $('corrida-records').innerHTML = listaRecordsHtml(c.codigo ? `Con ${c.codigo}` : 'Tus mejores', c.codigo ? listaDeCodigo(rec, c.codigo) : rec.general, c)
    + (c.codigo ? listaRecordsHtml('Tus diez mejores', rec.general, c) : '');
  $('corrida-repetir').classList.toggle('oculto', !c.codigo);
  traducirPanel($('corrida'));
  jugador.soltar();
  modo = 'victoria';
  if (personalAbierto()) { $('personalizar').classList.add('oculto'); origenPersonal = null; }
  $('corrida').classList.remove('oculto');
}
// Otra corrida: mismo camino que empezar una partida nueva (sin guardar() en el medio).
function nuevaCorrida(codigo = null) {
  if (!esSinFin) return;
  reiniciandoPartida = true;
  cancelarGuardadoSuave();
  const personal = progreso.personal;
  borrarProgreso();
  progreso = progresoNuevo();
  progreso.personal = personal;
  progreso.desafio.sinFin = corridaNueva();
  progreso.desafio.semilla = normalizarCodigo(codigo) || codigoAlAzar();
  guardarProgreso(progreso);
  location.reload();
}
$('corrida-otra').addEventListener('click', () => nuevaCorrida(null));
$('corrida-repetir').addEventListener('click', () => nuevaCorrida(corridaUltima?.codigo));
$('corrida-portada').addEventListener('click', () => { reiniciandoPartida = true; cancelarGuardadoSuave(); location.reload(); });
// En la libreta de logros del Desafío: las mejores corridas (de todas y con el código de esta partida).
function sumarRecordsSinFin(contenedor) {
  const rec = recordsSinFin();
  if (!contenedor || !rec.general.length) return;
  const bloque = document.createElement('div');
  bloque.className = 'logro-records';
  const codigo = progreso.desafio?.semilla;
  const conCodigo = codigo ? listaDeCodigo(rec, codigo) : [];
  bloque.innerHTML = listaRecordsHtml('Supervivencia sin fin · tus diez mejores', rec.general, null) + (conCodigo.length ? listaRecordsHtml(`Sin fin con ${codigo}`, conCodigo, null) : '');
  contenedor.insertBefore(bloque, contenedor.children[1] || null);
}
$('btn-vuelta').addEventListener('click', otraVuelta);
$('victoria-copiar').addEventListener('click', async () => {
  if (!parteUltimo) return;
  try { await navigator.clipboard.writeText(textoParte(parteUltimo)); nota('Copiado', 'El parte quedó en el portapapeles'); }
  catch { nota('No se pudo copiar', 'Sacale una foto con P, entonces'); }
});
$('cerrar-cuaderno').addEventListener('click', volverAlJuego);
$('cerrar-mapa').addEventListener('click', volverAlJuego);
lienzo.addEventListener('click', () => { if (jugador && modo === 'jugando' && !jugador.bloqueado()) jugador.pedirBloqueo(); });

// ------------------------------------------------------------------ acciones del jugador
let pedirFoto = false;
let idFotoPendiente = 0;
let objetivo = null;
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (capturandoTecla) { e.preventDefault(); tomarTeclaNueva(e.code); return; }
  if (teclasAbiertas() && e.code === 'Escape') { cerrarTeclas(); return; }
  // el teclado propio: lo que apretó el jugador se traduce a la tecla de fábrica
  const codigo = codigoCanonico(e.code);
  if (modo === 'cuaderno' && (codigo === 'KeyJ' || codigo === 'Escape')) { volverAlJuego(); return; }
  if (modo === 'mapa' && (codigo === 'KeyM' || codigo === 'Escape')) { volverAlJuego(); return; }
  if (codigo === 'Escape' && !$('logros').classList.contains('oculto')) { cerrarLogros(); return; }
  if (codigo === 'Escape' && modos?.panelAbierto()) { modos.cerrarPanel(); return; }   // 3.1
  if (guiaAbierta() && (codigo === 'Escape' || codigo === 'F1')) { e.preventDefault(); cerrarGuia(); return; }
  if (codigo === 'Escape' && !$('partidas').classList.contains('oculto')) { cerrarPartidas(); return; }
  if (baseAbierta() && (codigo === 'Escape' || codigo === 'KeyN')) { cerrarBase(); return; }
  if (banco.activa && codigo === 'Escape') { terminarBanco(); return; }
  // 2.8: Personalizar. Abierto, sólo Esc o F5 lo cierran; F5 lo abre si no es de otra acción
  if (personalAbierto()) { if (codigo === 'Escape' || e.code === 'F5') { e.preventDefault(); cerrarPersonal(); } return; }
  if (e.code === 'F5' && !accionDeTecla(teclasPropias, 'F5') && !foto.activo) { e.preventDefault(); personalizarDesdeElJuego(); return; }
  // 3.5.1: como F3 y F5: si el jugador le dio F2 a una acción, F2 es de esa acción (antes no llegaba nunca)
  if (e.code === 'F2' && jugador && (!accionDeTecla(teclasPropias, 'F2') || foto.activo)) { e.preventDefault(); abrirModoFoto(!foto.activo); return; }
  if (foto.activo && codigo === 'Escape') { abrirModoFoto(false); return; }
  if (codigo === 'F1') {
    e.preventDefault();
    // 3.5.4: en el modo foto F1 no hace nada, como las otras teclas (abría la pausa y la guía con el
    // modo foto prendido debajo: el panel de la foto y la cámara suelta seguían, y desde esa pausa
    // se podía ir a la portada con el modo foto activo)
    if (foto.activo) return;
    if (modo === 'jugando' && jugador) { abrir('pausa'); abrirGuia('pausa'); }
    else if (modo === 'pausa') abrirGuia('pausa');
    else if (!$('inicio').classList.contains('oculto')) abrirGuia('inicio');
    return;
  }
  if (modo === 'pausa' && codigo === 'Escape' && performance.now() - abiertoEn > 400) { volverAlJuego(); return; }
  if (modo !== 'jugando' || !jugador) return;
  // 3.5.1: en el modo foto sólo P saca la foto (WASD, Espacio y Shift mueven la cámara): antes E,
  // F, O... seguían andando con la hora del control (se dormía a las 22 del deslizador y se sumaba un día)
  if (foto.activo && codigo !== 'KeyP') return;
  if (desafio?.caido) return;
  // Desafío: doble toque de A o D esquiva hacia ese lado
  if (desafio && (codigo === 'KeyA' || codigo === 'KeyD')) {
    const ahora = performance.now();
    if (ultimaTeclaEsquiva.code === codigo && ahora - ultimaTeclaEsquiva.t < 260) { desafio.esquivar(codigo === 'KeyD' ? 1 : -1); ultimaTeclaEsquiva.t = 0; }
    else { ultimaTeclaEsquiva.code = codigo; ultimaTeclaEsquiva.t = ahora; }
  }
  if (desafio?.tallerAbierto) {
    if (codigo === 'KeyK' || codigo === 'Escape') { desafio.abrirTaller(false); return; }
    if (codigo === 'Tab') { e.preventDefault(); desafio.cambiarCategoriaTaller(e.shiftKey ? -1 : 1); return; }
    const n = /^Digit([1-9])$/.exec(codigo);
    if (n) { desafio.fabricar(Number(n[1]) - 1); return; }
  }
  if (codigo === 'KeyK' && desafio) {
    if (mochilaAbierta) abrirMochila(false);
    if (enElAlmacen) cerrarAlmacen();
    if (modoObra) abrirObra(false);
    desafio.abrirTaller(true);
    return;
  }
  const js = jugador.estado;
  // 2.9: colgado de la tirolesa no se hace otra cosa (el aviso tampoco ofrece nada)
  // 3.5.1: colgado del cable, Esc igual abre la pausa (en un cable largo se quedaba un minuto sin poder pausar)
  if (js.enCable && codigo === 'Escape') { abrir('pausa'); return; }
  if (js.enCable) return;
  if (js.enTren && !charla.npc && !tren.conduciendo()) {
    // arriba del tren, WASD cambia de asiento o sale a la plataforma (2.9: en la cabina, W y S manejan)
    const paso = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] }[codigo];
    if (paso) { tren.moverse(paso[0], paso[1]); sonido.paso('madera', 0.5); return; }
  }
  if (js.montado && ['KeyH', 'KeyB', 'KeyT', 'KeyF', 'KeyY', 'KeyO', 'KeyG'].includes(codigo)) { nota('Con las riendas en la mano, no', 'Bajate del zaino con E'); return; }
  // 3.6 (vida): con el menú de la charla abierto, los números eligen (como en el almacén)
  if (charla.menu && /^Digit[1-9]$/.test(codigo)) { elegirEnMenuCharla(Number(codigo.slice(5)) - 1); return; }
  switch (codigo) {
    case 'KeyE': {
      if (charla.npc) { seguirCharla(); break; }
      if (enElAlmacen) { cerrarAlmacen(); break; }
      // 2.6.1: con la feria abierta E la cierra, como el almacén (antes hablaba con Elsa
      // o bajaba del caballo con el panel abierto, y el aviso no decía nada)
      if (enLaFeria) { cerrarFeria(); break; }
      // 2.9: y el puesto de cargas, igual
      if (enLasCargas()) { puestoCargas.cerrar(); break; }
      // El aviso visual y la acción usan la misma prioridad: si estás mirando a
      // una persona, E habla con ella antes de accionar puertas/mostradores.
      // Esto hace posible conversar con Ercilia detrás del mostrador sin que el
      // trueque o una puerta cercana se coman la interacción.
      if (vecino && desafio && vecino.enBase) { ordenarCompanero(vecino); break; }
      if (vecino) { hablar(vecino); break; }
      // 3.6 (vida): al lado de tu lugar en la mesa de la invitación, E te sienta (el aviso, en el mismo lugar)
      if (!js.enTren && !js.montado && vecindadJuego?.puedeSentarse(js.pos)) { sentarseALaCita(); break; }
      // 3.1: en el poste de una carrera, E larga (también montado, en el kayak o en el velero; el aviso va en el mismo lugar)
      if (!objetivo) { const c = modos?.accion(jugador.estado); if (c) { c.hacer(); break; } }
      if (js.montado) { desmontar(); break; }
      if (!js.enTren && !js.enKayak && !objetivo && cercaDelMostrador()) { abrirAlmacen(); break; }
      if (!objetivo && caballoCerca()) { montar(); break; }
      if (!objetivo && feriaCerca()) { abrirFeria(); break; }
      // 2.9: el puesto de cargas de la parada (el aviso va en el mismo lugar)
      if (!js.enTren && !js.enKayak && !objetivo && puestoDeCargasCerca()) { cargas().abrir(puestoDeCargasCerca()); break; }
      if (!js.enTren && !js.enKayak && !objetivo) { const c = canteroCerca(); if (c) { usarCantero(c); break; } }
      if (!js.enTren && !js.enKayak && !objetivo) { const g = gallineroCerca(); if (g) { usarGallinero(g); break; } }
      if (!js.enTren && !js.enKayak && !objetivo && telarCerca()) { tejer(); break; }
      // 2.3: colmena, ahumadero, vivero y leñera (el aviso sigue el mismo orden)
      if (!js.enTren && !js.enKayak && !objetivo) { const o = obraQueTrabajaCerca(); if (o) { usarObraQueTrabaja(o); break; } }
      // 3.6: parado en el lote de una obra de la aldea, E aporta lo que tengas (el aviso va en el mismo lugar)
      if (!js.enTren && !js.enKayak && !objetivo && aldeaGente) { const lote = aldeaGente.obraCerca(js.pos); if (lote) { aldeaGente.aportarObra(lote); break; } }
      // 3.6 (mecánicas): lo de cada lugar de la aldea (el aviso va en el mismo lugar, con la misma función)
      if (!js.enTren && !js.enKayak && !objetivo && mecanicasAldea) { const m = mecanicasAldea.accion(js); if (m) { m.hacer(); cacheMecanica = null; break; } }
      if (!js.enTren && !js.enKayak && !objetivo && ovejaCercana) { esquilarOveja(ovejaCercana); break; }
      if (!js.enTren && !js.enKayak && !objetivo && hayAcopioCerca(RADIO_ACOPIO_MANO)) { usarAcopio(); break; }
      // 2.3: en el Desafío, un capullo o una zanja de fuego al lado (antes que el portón)
      if (desafio && !js.enTren && !objetivo && desafio.usarCercaDe?.(js.pos, distanciaAPuerta(js.pos))) break;
      // la puerta solo si no estás mirando algo para juntar: el aviso manda
      if (!js.enTren && !js.enKayak && !objetivo && !js.sentado) {   // 3.6 (mecánicas): sentado, no (como el aviso)
        const p = puertas && puertas.cerca(js.pos);
        if (p) { puertas.accionar(p); break; }
      }
      if (!objetivo && rastro && !desafio && mirandoAlPerro(js, perro.est.pos)) { dejarRastro('Dejaste el rastro', 'El perro vuelve con vos'); break; }
      if (!objetivo && puedoPedirRastro()) { pedirRastro(); break; }
      // 2.9: en la cabina, E baja (parado en un andén)
      if (js.enTren && tren.conduciendo()) { bajarDeLaCabina(); break; }
      if (js.enTren && !tren.parado()) { nota('El tren está andando', 'Bajate cuando pare en una estación'); break; }
      if (js.enTren) { if (!tren.bajar(jugador)) nota('El tren está andando', 'Bajate cuando pare en la estación'); break; }
      // 2.4.1: mirando algo (el banco del andén) E hace eso, como dice el aviso
      // 2.9: al lado de la locomotora, E sube a la cabina (más cerca del coche, de pasajero)
      if (!desafio && !js.enKayak && !js.enTren && !objetivo && tren.puedeConducir(js)) { subirALaCabina(); break; }
      if (!js.enKayak && !objetivo && tren.puedeSubir(js)) { tren.subir(jugador); diario.anotar('tren'); registrar('viaje'); nota('Subiste a la trochita', 'Se baja en la estación, cuando pare'); break; }
      if (!js.enKayak && enLaCasaDeTe() && (!objetivo || objetivo.tipo === 'sentarse')) { servir(); break; }
      // 2.9: del velero se baja antes que del kayak (arriba del velero también se está `enKayak`)
      if (js.enVela) {
        if (!vela.bajar(jugador)) nota('No hay orilla cerca', 'Acercate a la costa, al muelle o al varadero');
        break;
      }
      if (js.enKayak) {
        if (!kayak.bajar(jugador)) nota('No hay orilla cerca', 'Acercate a la costa o al muelle');
        break;
      }
      if (!objetivo && kayak.cerca(js)) { kayak.subir(jugador); diario.anotar('kayak'); nota('Subiste al kayak', 'W y S para remar, A y D para girar'); break; }
      // 2.9: subir al velero o traerlo, largarse por la tirolesa (el aviso, en el mismo orden)
      if (!objetivo && !js.enKayak && !js.enTren) { const a = vela?.accion(jugador) || tirolesas?.accion(jugador); if (a) { a.hacer(); break; } }
      // junto a un fuego encendido, E duerme (de noche) o cocina (de día)
      if (enLaSalaDelFaro() && !progreso.entradas.bitacora) { registrar('bitacora'); break; }
      if (enLaCarpa() && puedeDormirJuntoAlFuego()) { diario.anotar('carpa'); dormir(); break; }
      if (obras && obras.dentro(js.pos) && puedeDormirJuntoAlFuego()) { dormir(); break; }
      if (cercaDelFuego() && (!objetivo || objetivo.tipo === 'sentarse')) {
        if (puedeDormirJuntoAlFuego()) { dormir(); break; }
        if (hayQueCocinar()) { cocinar(); break; }
      }
      // 2.1: el tendal, igual: cuelga lo que hay que secar y descuelga lo seco
      if (!objetivo && tendalCerca()) { usarElTendal(); break; }
      // 2.1: parado sobre un rastro, E mira las huellas
      if (!objetivo && mirarRastro()) break;
      // 2.3: en otoño, junto a un árbol grande, E junta semilla para el vivero
      if (!objetivo && !js.enTren && !js.enKayak) { const s = arbolParaSemilla(); if (s) { juntarSemilla(s); break; } }
      const r = objetos.usar(objetivo, registrar, sonido);
      if (r) destellarRanura(objetivo?.tipo);
      if (r?.sentarse?.cama) { dormir(); break; }
      if (r?.ramita) nota(`${progreso.ramitas} ${progreso.ramitas === 1 ? 'ramita' : 'ramitas'}`, progreso.ramitas >= 3 ? 'Con tres ya podés hacer una fogata' : 'Para hacer fuego');
      if (r?.sentarse) {
        js.pos.set(r.sentarse.x, Math.max(r.sentarse.y - 0.45, T.altura(r.sentarse.x, r.sentarse.z)), r.sentarse.z);
        if (r.sentarse.mira !== undefined) { js.yaw = r.sentarse.mira; js.pitch = -0.05; }
        jugador.sentarse(true);
      }
      break;
    }
    case 'Tab':
      if (modoObra && obras) { e.preventDefault(); cambiarCategoriaObra(e.shiftKey ? -1 : 1); break; }
      if (enElAlmacen) { e.preventDefault(); pasarPaginaAlmacen(e.shiftKey ? -1 : 1); break; }
      if (enLasCargas()) { e.preventDefault(); puestoCargas.pasarModo(e.shiftKey ? -1 : 1); break; }
      break;
    case 'BracketLeft':
      if (modoObra && obras) { cambiarPaginaObra(-1); break; }
      break;
    case 'BracketRight':
      if (modoObra && obras) { cambiarPaginaObra(1); break; }
      break;
    case 'KeyR':
      if (modoObra && obras) { obras.girar(e.shiftKey ? -1 : 1); dibujarPanelObra(); break; }
      // 3.6.1: sentado, R siempre te levanta (en la punta del muelle no lo hacía)
      if (js.sentado) jugador.sentarse(false);
      else if (!js.nadando && !js.enKayak && !js.enTren) jugador.sentarse(true);
      break;
    case 'KeyN':
      if (modoObra && obras) {
        const activo = obras.alternarSnap();
        ultimoSitioObra = '';
        nota(activo ? 'Encastre activado' : 'Colocación libre', activo ? 'Las piezas compatibles se alinean automáticamente' : 'El fantasma ya no será atraído por otros módulos');
        dibujarPanelObra();
        break;
      }
      // fuera del modo obra, N muestra cómo están las defensas
      if (desafio) { abrir('pausa'); abrirBase('pausa'); }
      break;
    case 'KeyF':
      if (desafio?.encenderAntorchaCerca(js.pos)) break;
      if (!js.enKayak) encenderFuego();
      break;
    case 'KeyG': if (!js.enTren && !js.enKayak) cocinar(); break;
    case 'KeyT': if (modoObra && obras) { tenirPieza(); break; } armarCarpa(); break;
    case 'KeyB': plantarRenoval(); break;
    case 'KeyV': soltarRanura(); break;
    case 'F4': if (HOJARASCA_DEBUG) alternarCamaraLibre(); break;
    case 'KeyH': if (!modoObra) usarHacha(); break;
    case 'Backspace':
      if (modoObra && obras) {
        const r = obras.deshacerEtapa(js.pos, 6);
        if (!r.ok) { nota('Nada que deshacer', r.motivo); break; }
        for (const [k, n] of Object.entries(r.recupera || {})) sumarMaterial(k, n);
        progreso.obras = obras.obras.map((o) => o.datos);
        guardar(); sonido.juntar(); refrescarBarra(true);
        const devuelto = Object.entries(r.recupera || {}).map(([k, n]) => `${n} ${MATERIALES[k]?.nombre || k}`).join(' · ');
        nota(`Deshecha: ${(r.etapa?.nombre || 'la última etapa').toLowerCase()}`,
          `${devuelto ? `Recuperaste ${devuelto}` : 'Sin materiales para devolver'}${r.quedaMarca ? ' · quedó sólo la marca' : ''}`);
        dibujarPanelObra();
      }
      break;
    case 'KeyX':
      if (modoObra && obras) {
        const r = obras.copiarCerca(js.pos, 6);
        if (!r.ok) { nota('No hay nada para repetir', r.motivo); break; }
        nota(`Repetir: ${r.plano.nombre}`, 'Quedó elegido con la misma orientación');
        dibujarPanelObra();
        break;
      }
      pesca.clic(true, mundoPesca());
      break;
    case 'KeyO': abrirObra(!modoObra); break;
    case 'Delete':
      if (modoObra && obras) {
        if (obras.editando) {
          const r = obras.cancelarEdicion();
          if (r.ok) { ultimoSitioObra = ''; nota('Movimiento cancelado', 'La pieza volvió exactamente a su lugar'); dibujarPanelObra(); }
          break;
        }
        if (e.shiftKey) {
          const r = obras.desmontarCerca(js.pos, 5.0);
          if (!r.ok) nota('Nada que desmontar', r.motivo);
          else {
            for (const [k, n] of Object.entries(r.recupera || {})) sumarMaterial(k, n);
            devolverContenido(r.datos);   // 3.5.1
            progreso.obras = obras.obras.map((o) => o.datos);
            guardar(); sonido.juntar();
            const devuelto = Object.entries(r.recupera || {}).map(([k,n]) => `${n} ${MATERIALES[k]?.nombre || k}`).join(' · ');
            nota(`${r.plano.nombre} desmontado`, devuelto ? `Recuperaste ${devuelto}` : 'La pieza fue retirada');
            dibujarPanelObra();
          }
          break;
        }
        const r = obras.cancelarMarcada(js.pos, 10, obras.plano?.id);
        if (!r.ok) nota('Nada que cancelar', r.motivo);
        else {
          progreso.obras = obras.obras.map((o) => o.datos);
          guardar();
          sonido.juntar();
          nota('Marca retirada', `${r.plano.nombre}: no se gastaron materiales`);
          dibujarPanelObra();
        }
      }
      break;
    case 'KeyY':
      if (modoObra) {
        if (e.shiftKey && !obras.editando) {
          const r = obras.iniciarEdicionCerca(js.pos, 5.0);
          if (!r.ok) nota('Nada que mover', r.motivo);
          else {
            categoriaObra = r.plano.categoria;
            const indicePlano = planosDeCategoria().findIndex((p) => p.id === r.plano.id);
            paginaObra = indicePlano >= 0 ? Math.floor(indicePlano / PLANOS_POR_PAGINA) : 0;
            ultimoSitioObra = '';
            nota(`Moviendo ${r.plano.nombre.toLowerCase()}`, 'Mirá el nuevo lugar · R gira · Y confirma · Supr cancela');
            dibujarPanelObra();
          }
        } else accionObra();
      }
      else if (puedeAserrar()) aserrar();
      break;
    case 'KeyI': abrirMochila(!mochilaAbierta); break;
    case 'KeyU': if (!mochilaAbierta) usarRanura(); break;
    case 'Digit5': case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
      if (modoObra) { elegirPlano(Number(codigo.slice(5)) - 1); break; }
      // En el almacén los números eligen el cambio, del 1 al 9. Hasta la 1.10 del 5 en
      // adelante elegían casilleros de la barra: la yerba, las semillas, la tijera y la
      // harina no se podían cambiar.
      if (enElAlmacen) { cambiarDeLaPagina(Number(codigo.slice(5))); break; }
      if (enLasCargas()) marcarEn('cargas', Number(codigo.slice(5)) - 1);   // 3.6.2: y queda marcada
      if (enLasCargas()) { puestoCargas.elegir(Number(codigo.slice(5)) - 1); break; }
      if (codigo === 'Digit9') break;
      elegirRanura(Number(codigo.slice(5)) - 1);
      break;
    case 'KeyQ':
      if (js.nadando || js.enTren) break;
      pesca.equipar(!pesca.est.equipada);
      if (pesca.est.equipada && !progreso.entradas.arcoiris) nota('Caña de mosca', 'Clic para lanzar al agua; clic de nuevo cuando pique');
      break;
    case 'KeyL':
      linterna.distance = progreso.cosas.farol ? 78 : 42;
      linterna.angle = progreso.cosas.farol ? 0.52 : 0.42;
      linterna.intensity = linterna.intensity > 0 ? 0 : (progreso.cosas.farol ? 80 : 45);
      sonido.carrete();
      break;
    case 'KeyJ': abrir('cuaderno'); break;
    case 'Enter': case 'NumpadEnter': if (listaHudAbierta()) elegirHud(); break;   // 3.6.2: la opción marcada
    // 2.9: en la cabina, Espacio (A en el mando) silba y C (B) abre el puesto de cargas del andén
    case 'Space': if (js.enTren && tren.conduciendo()) tren.silbar(); break;
    case 'KeyC':
      if (!desafio && js.enTren && tren.conduciendo() && tren.paradaCabina()) {
        if (enLasCargas()) puestoCargas.cerrar();
        else cargas().abrir(tren.paradaCabina());
      }
      break;
    case 'KeyM': abrir('mapa'); break;
    case 'KeyP': pedirFoto = true; break;
    case 'Escape':
      if (modoObra && obras?.editando) {
        obras.cancelarEdicion(); ultimoSitioObra = ''; nota('Movimiento cancelado', 'La pieza volvió a su lugar'); dibujarPanelObra();
      }
      else if (mochilaAbierta) abrirMochila(false);
      else if (enElAlmacen) cerrarAlmacen();
      else if (enLaFeria) cerrarFeria();
      else if (enLasCargas()) puestoCargas.cerrar();
      else if (charla.npc) atrasCharla();   // 3.6 (vida): del submenú o de un tema, al menú
      else abrir('pausa');
      break;
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
      if (modoObra) { elegirPlano(Number(codigo.slice(5)) - 1); break; }
      if (enElAlmacen) { cambiarDeLaPagina(Number(codigo.slice(5))); break; }
      if (enLaFeria) { cambiarFeria(Number(codigo.slice(5)) - 1); break; }
      if (enLasCargas()) marcarEn('cargas', Number(codigo.slice(5)) - 1);   // 3.6.2: y queda marcada
      if (enLasCargas()) { puestoCargas.elegir(Number(codigo.slice(5)) - 1); break; }
      elegirRanura(Number(codigo.slice(5)) - 1);
      break;
  }
});

// 2.3: en invierno cada fuego pide además un tronco seco (de la leñera, o de lo que
// llevás si no está mojado). Se revisa antes de prender y se gasta sólo si prendió.
function lenaDelInvierno() {
  if (desafio) return { ok: true, de: null };
  const len = leneraCerca();
  const l = len ? datosDe(len, 'lenera', sanearLenera) : null;
  const r = lenaParaPrender({ invierno: U.uInvierno.value, lenera: l, troncos: troncosAMano(), humedad: sanearHumedad(progreso.humedadLena) });
  if (!r.ok) {
    if (r.motivo === 'mojada') { sonido.chasquido?.(jugador.estado.pos); nota('La leña está mojada', 'Hace humo y no prende. La que guardás en la leñera queda seca'); }
    else nota('En invierno hace falta leña', 'Con ramitas solas no alcanza: traé un tronco seco');
  }
  return { ...r, lenera: l };
}
function gastarLenaDelInvierno(r) {
  if (r.de === 'lenera') r.lenera.secos -= 1;
  else if (r.de === 'mochila') conMateriales((m) => { m.tronco -= 1; });
  // un aviso aparte, después del de haber prendido (así cada frase se traduce entera)
  if (r.de) setTimeout(() => nota('Se fue un tronco de leña', r.de === 'lenera' ? `Quedan ${r.lenera.secos} en la leñera` : 'De los que llevabas encima'), 1400);
}
function encenderFuego() {
  const js = jugador.estado;
  const ref = T.lugares.refugio;
  const propio = fogonPropioCerca();
  const lena = lenaDelInvierno();
  if (!lena.ok) return;
  if (propio) {
    const contenida = !!propio.plano.fuegoContenido;
    const y = contenida ? propio.datos.y + 0.38 : T.altura(propio.datos.x, propio.datos.z);
    clima.encenderFogata(propio.datos.x, y, propio.datos.z, 900, { contenida });
    gastarLenaDelInvierno(lena);
    sonido.encender();
    if (propio.plano.id === 'pared-hogar') nota('Encendiste el hogar', 'Calienta la casa, y el humo sale por la chimenea');
    else nota(contenida ? 'Encendiste la estufa' : 'Encendiste tu fogón', contenida ? 'El calor queda contenido dentro del refugio' : 'Dura toda la noche');
    return;
  }
  if (Math.abs(js.pos.y - ref.fogon.y) < 1.75 && Math.hypot(js.pos.x - ref.fogon.x, js.pos.z - ref.fogon.z) < 4) {
    clima.encenderFogata(ref.fogon.x, ref.fogon.y, ref.fogon.z, 900);
    gastarLenaDelInvierno(lena);
    sonido.encender();
    nota('El fogón está encendido', 'Sentate en un tronco para descansar');
    return;
  }
  if (progreso.ramitas < 3) { nota('Juntá al menos tres ramitas', 'Hay muchas bajo los árboles'); return; }
  const x = js.pos.x - Math.sin(js.yaw) * 1.9, z = js.pos.z - Math.cos(js.yaw) * 1.9;
  if (T.agua(x, z) || js.nadando || js.enPlataforma) { nota('Acá no se puede', 'Buscá suelo firme y seco'); return; }
  progreso.ramitas -= 3;
  clima.encenderFogata(x, T.altura(x, z), z);
  gastarLenaDelInvierno(lena);
  sonido.encender();
  nota('Hiciste una fogata', 'En los bosques de verdad, solo en lugares habilitados');
}

const CONSUMICIONES = [
  { id: 'te-galesa', nombre: 'un té con torta galesa' },
  { id: 'mate', nombre: 'unos mates' },
  { id: 'chocolate', nombre: 'un chocolate caliente' },
];
function enLaCasaDeTe() {
  const c = est.casaTe;
  if (!c) return false;
  const js = jugador.estado;
  return Math.hypot(js.pos.x - c.mostrador.x, js.pos.z - c.mostrador.z) < 4.5;
}
function servir() {
  const pendientes = CONSUMICIONES.filter((x) => !progreso.entradas[x.id]);
  const elegida = pendientes.length ? pendientes[0] : CONSUMICIONES[Math.floor(Math.random() * CONSUMICIONES.length)];
  sonido.juntar();
  // 3.6 (mecánicas): en la aldea, sentado a la mesa, la galesa te lo trae
  if (aldeaMundo && jugador?.estado?.sentado) nota(`La galesa te trae ${elegida.nombre}`, 'Sentado a la mesa de la galería');
  setTimeout(() => {
    registrar(elegida.id);
    if (!pendientes.length) nota(elegida.nombre.charAt(0).toUpperCase() + elegida.nombre.slice(1), 'Otra vuelta en la galería');
  }, 700);
}

// ---------------------------------------------------------------- la mochila
let ranuras = [], elegida = 0, mochilaAbierta = false, barraVigente = false, mostrarNombre = 2.5;
const barraEl = $('barra');

// Pone primero lo que vos elegiste, y detrás el resto.
// 2.7.3: sin armar un Map en cada cuadro (`tomadas` se reusa). Da lo mismo que antes, aun
// con ids repetidos: de cada id elegido va el último de la lista, como hacía el Map.
const tomadas = new Set();
function ordenarBarra(lista) {
  const orden = progreso.barra || [];
  if (!orden.length) return lista;
  tomadas.clear();
  const salida = [];
  for (const id of orden) {
    if (!id || tomadas.has(id)) continue;
    for (let j = lista.length - 1; j >= 0; j--) {
      if (lista[j].id === id) { salida.push(lista[j]); tomadas.add(id); break; }
    }
  }
  for (const r of lista) if (!tomadas.has(r.id)) salida.push(r);
  return salida;
}

// 2.7.3: un solo objeto que se rellena (armarMochila sólo lo lee, no lo guarda)
const estadoDeMochila = { canaEquipada: undefined, luzEncendida: false };
function estadoMochila() {
  estadoDeMochila.canaEquipada = pesca?.est.equipada;
  estadoDeMochila.luzEncendida = linterna && linterna.intensity > 0;
  return estadoDeMochila;
}
// Cuando entra algo a la mochila, su casilla destella: así se ve qué se juntó
const DESTELLO = { ramita: 'ramita', pinon: 'pinon', calafate: 'calafate', frutilla: 'frutilla', pluma: 'pluma', canto: 'canto' };
function destellarRanura(tipo) {
  refrescarBarra(true);
  const id = DESTELLO[tipo] || tipo;
  const i = ranuras.findIndex((r) => r.id === id);
  if (i < 0 || i > 7) return;
  const casilla = barraEl.children[i];
  if (!casilla) return;
  casilla.classList.remove('entro');
  void casilla.offsetWidth;   // reinicia la animación
  casilla.classList.add('entro');
}

// 2.7.3: lo que muestra la barra dibujada (por casilla: id, cuenta y si está activa, y cuál
// está elegida). Reemplaza a la firma de texto que se armaba en cada cuadro: se redibuja
// exactamente en los mismos casos que cuando cambiaba esa firma.
const barraDibujada = { n: 0, elegida: -1, ids: [], cuentas: [], activos: [] };
function mismaCuenta(a, b) {
  const x = a || '', y = b || '';
  return x === y || String(x) === String(y);   // 3 y '3' se veían igual en la firma
}
function barraSinCambios() {
  const b = barraDibujada;
  if (b.n !== ranuras.length || b.elegida !== (ranuras.length ? elegida : -1)) return false;
  for (let i = 0; i < ranuras.length; i++) {
    const r = ranuras[i];
    if (b.ids[i] !== r.id || b.activos[i] !== !!r.activo || !mismaCuenta(b.cuentas[i], r.cuenta)) return false;
  }
  return true;
}
function anotarBarraDibujada() {
  const b = barraDibujada;
  b.n = ranuras.length;
  b.elegida = ranuras.length ? elegida : -1;
  for (let i = 0; i < ranuras.length; i++) {
    const r = ranuras[i];
    b.ids[i] = r.id; b.cuentas[i] = r.cuenta; b.activos[i] = !!r.activo;
  }
}

function refrescarBarra(forzar = false) {
  if (!jugador) return;
  // `ranuras` se rearma siempre: usarRanura y elegirRanura leen lo de este mismo cuadro
  ranuras = ordenarBarra(armarMochila(progreso, estadoMochila()));
  if (elegida >= ranuras.length) elegida = Math.max(0, ranuras.length - 1);
  if (barraVigente && !forzar && barraSinCambios()) return;
  barraVigente = true;
  anotarBarraDibujada();
  barraEl.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const r = ranuras[i];
    const d = document.createElement('div');
    d.className = `ranura${i === elegida ? ' elegida' : ''}${r && r.activo ? ' activo' : ''}${r ? '' : ' vacia'}`;
    if (r) {
      const img = document.createElement('img');
      img.src = icono(r.icono);
      img.alt = r.nombre;
      d.appendChild(img);
      if (r.cuenta) { const b = document.createElement('b'); b.textContent = String(r.cuenta); d.appendChild(b); }
    }
    const n = document.createElement('i');
    n.textContent = String(i + 1);
    d.appendChild(n);
    // se puede elegir con el mouse
    d.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); elegirRanura(i); });
    barraEl.appendChild(d);
  }
  const nombre = document.createElement('div');
  nombre.className = 'nombre';
  // el nombre aparece un momento al cambiar de objeto
  nombre.textContent = ranuras[elegida] && mostrarNombre > 0 ? ranuras[elegida].nombre : '';
  barraEl.appendChild(nombre);
}
// 2.6: lo del fortín (puente, abrojos, rampa) no le gana a una puerta que está más cerca
function distanciaAPuerta(pos) {
  const p = puertas && puertas.cerca(pos);
  return p ? Math.hypot(p.x - pos.x, p.z - pos.z) : Infinity;
}
function elegirRanura(i) {
  const antes = elegida;
  if (desafio && ((i % 8) + 8) % 8 !== antes) desafio.cambioDeArma?.();   // 2.5: se suelta el arco y se corta la ráfaga
  mostrarNombre = 1.8;
  elegida = ((i % 8) + 8) % 8;
  refrescarBarra(true);
  if (antes !== elegida) {
    sonido.paso('madera', 0.22);       // el chasquido de cambiar de cosa
    progreso.ranura = elegida;
  }
  if (enMano) enMano.mostrar(ranuras[elegida]?.id);
}
// Dejar en el suelo lo que tenés en la mano: queda ahí y se puede volver a juntar
function soltarRanura() {
  const r = ranuras[elegida];
  const js = jugador.estado;
  if (!r || js.enTren || js.enKayak || js.nadando) return;
  const sueltos = { ramita: 'ramitas', pinon: 'pinon', calafate: 'calafate', frutilla: 'frutilla', pluma: 'pluma', canto: 'canto' };
  const clave = sueltos[r.id];
  if (!clave) { nota('Eso no se suelta', 'Solo lo que juntaste del suelo'); return; }
  const x = js.pos.x - Math.sin(js.yaw) * 1.3, z = js.pos.z - Math.cos(js.yaw) * 1.3;
  if (T.agua(x, z)) { nota('Ahí no', 'Se te va con el agua'); return; }
  const ok = objetos.soltar(r.id, x, z);
  if (!ok) { nota('No se pudo dejar', 'Probá en un lugar más despejado'); return; }
  if (clave === 'ramitas') progreso.ramitas = Math.max(0, progreso.ramitas - 1);
  else if (progreso.entradas[clave]) progreso.entradas[clave].cantidad = Math.max(0, (progreso.entradas[clave].cantidad || 0) - 1);
  sonido.paso('hojarasca', 0.5);
  refrescarBarra(true);
  guardar();
}

function usarRanura() {
  const r = ranuras[elegida];
  if (!r) return;
  const js = jugador.estado;
  switch (r.accion) {
    case 'foto': pedirFoto = true; break;
    // 2.4.1: lo del horno se come en el camino: saca el frío y da una hora liviana
    case 'comer': {
      const e = progreso.entradas[r.id];
      if (!e || !(e.cantidad > 0)) break;
      e.cantidad -= 1;
      js.entumecido = 0;
      js.descansado = Math.max(js.descansado || 0, 1);
      sonido.juntar();
      nota(r.id === 'pan-casero' ? 'Comiste un pedazo de pan casero' : 'Comiste una empanada', e.cantidad ? `Te quedan ${e.cantidad}. Se te fue el frío` : 'Era la última. Se te fue el frío');
      refrescarBarra(true);
      guardar();
      break;
    }
    case 'cana':
      if (js.enKayak || !js.enTren) pesca.equipar(!pesca.est.equipada);
      break;
    case 'luz':
      linterna.distance = progreso.cosas.farol ? 78 : 42;
      linterna.angle = progreso.cosas.farol ? 0.52 : 0.42;
      linterna.intensity = linterna.intensity > 0 ? 0 : (progreso.cosas.farol ? 80 : 45);
      break;
    case 'carpa': armarCarpa(); break;
    case 'hacha': usarHacha(); break;
    case 'aserrar': if (puedeAserrar()) aserrar(); else nota('No tenés troncos', 'Talá un árbol con H (tres hachazos)'); break;
    case 'fuego': encenderFuego(); break;
    case 'plantar-pehuen': case 'plantar-coihue': case 'plantar': plantarRenoval(); break;
    case 'cocinar': cocinar(); break;
    case 'arma': if (desafio && !desafio.caido) desafio.atacar(r.id); refrescarBarra(true); return;
    case 'curar': if (desafio) desafio.usarEmplasto(); break;
    case 'grabador': usarGrabador(); break;
    default: nota(r.nombre, r.texto || 'Se guarda en la mochila'); break;
  }
  if (enMano) enMano.usar();
  refrescarBarra(true);
}
// 2.1: el grabador. Si acaba de cantar cerca un ave anotada que todavía no grabaste,
// el clic la graba; si no, hace sonar la siguiente grabación y la más cercana contesta.
let ultimaGrabacion = null;
const lejaniaCanto = (d) => (d < 25 ? 'muy cerca' : d < 55 ? 'cerca' : 'lejos');
function usarGrabador() {
  const js = jugador.estado;
  if (!progreso.grabaciones) progreso.grabaciones = {};
  const q = queGrabar(cantosOidos, js.pos, performance.now() / 1000, progreso.entradas, progreso.grabaciones);
  if (q && !q.motivo) {
    progreso.grabaciones[q.especie] = { dia: progreso.dia };
    diario.anotar('grabacion', CANTOS[q.especie].nombre);
    sonido.anotar();
    nota(`Grabaste ${CANTOS[q.especie].nombre}`, 'Clic de nuevo, cuando no cante nada, para hacerlo sonar', true);
    refrescarBarra(true);
    guardar();
    return;
  }
  if (q?.motivo === 'sinAnotar') { nota('Eso todavía no está en el cuaderno', 'Primero anotalo; después se graba'); return; }
  const esp = siguienteGrabacion(progreso.grabaciones, ultimaGrabacion);
  if (!esp) { nota('El grabador está vacío', 'Cuando cante cerca un ave que ya anotaste, clic para grabarla'); return; }
  ultimaGrabacion = esp;
  reproducirCanto(esp);
}
function reproducirCanto(esp) {
  const C = CANTOS[esp], js = jugador.estado;
  const aqui = { x: js.pos.x - Math.sin(js.yaw) * 0.6, y: js.pos.y + 1.3, z: js.pos.z - Math.cos(js.yaw) * 0.6 };
  reproduciendoCanto = true;
  try { sonido[C.metodo](aqui); } finally { reproduciendoCanto = false; }
  const noche = 1 - (luzUltimaFoto?.dia ?? 1);
  // el concón no tiene lugar fijo: contesta desde algún lado, y sólo de noche
  if (esp === 'concon') {
    if (noche < 0.6) { nota(`Hacés sonar ${C.nombre}`, 'De día no contesta: es un ave de la noche'); return; }
    const p = fauna.puntoCercano(30, 70);
    setTimeout(() => { sonido.concon(p); nota(`Contesta ${C.nombre}`, `${lejaniaCanto(Math.hypot(p.x - js.pos.x, p.z - js.pos.z))}, hacia el ${rumboDe(js.pos, p)}`); }, 2200);
    return;
  }
  // Los que oyen no son sólo los que se están dibujando: `fauna.sujetos()` deja afuera a
  // los carpinteros ocultos por distancia, y las cachañas andan en bandada por el valle
  // aunque no te estén pasando por arriba (contestan desde algún lado y después vienen).
  const sujetos = [
    ...fauna.sujetos().filter((s) => s.tipo !== 'carpintero'), ...vida.sujetos(),
    ...fauna.carpinteros.map((c) => ({ tipo: 'carpintero', pos: c.g.position })),
    ...(esp === 'cachana' ? [{ tipo: 'cachana', pos: fauna.puntoCercano(60, 150) }] : []),
    ...fauna.chucaos.map((c) => ({ tipo: 'chucao', pos: c })),
    ...(bichos._debug?.cauquenes || []).filter((c) => c.g.visible !== false).map((c) => ({ tipo: 'cauquen', pos: c.pos })),
  ];
  const q = quienContesta(esp, sujetos, js.pos);
  if (!q) { nota(`Hacés sonar ${C.nombre}`, 'No contesta nadie: por acá no anda'); return; }
  const viene = C.viene && fauna.llamar(esp, js.pos);
  nota(`Hacés sonar ${C.nombre}`, 'Esperá un momento');
  setTimeout(() => {
    reproduciendoCanto = true;
    try { sonido[C.metodo]({ x: q.pos.x, y: (q.pos.y ?? T.altura(q.pos.x, q.pos.z)) + 1, z: q.pos.z }); } finally { reproduciendoCanto = false; }
    nota(`Contesta ${C.nombre}`, `${lejaniaCanto(q.d)}, hacia el ${rumboDe(js.pos, q.pos)}${viene ? ' · viene a ver' : ''}`);
  }, q.demora * 1000);
}

function abrirMochila(abrir) {
  mochilaAbierta = abrir;
  if (abrir) desafio?.cambioDeArma?.();   // 2.5: la cuerda y la ráfaga no siguen con la mochila abierta
  $('mochila').classList.toggle('oculto', !abrir);
  if (!abrir) return;
  const rej = $('mochila-rejilla');
  rej.innerHTML = '';
  const cosas = [...armarMochila(progreso, estadoMochila()), ...armarGuardado(progreso, ENTRADA)];
  $('mochila-sub').textContent = cosas.length
    ? `${cosas.length} cosas encima. Tocá una para ponerla en la casilla ${elegida + 1} de la barra.`
    : 'Está vacía. Juntá lo que encuentres por el bosque.';
  cosas.forEach((c, i) => {
    const d = document.createElement('div');
    const enLaBarra = progreso.barra ? progreso.barra.indexOf(c.id) : i;
    d.className = `cosa${enLaBarra >= 0 && enLaBarra < 8 ? ' enbarra' : ''}`;
    d.tabIndex = 0;
    d.title = 'Clic o Enter para ponerlo en la casilla elegida';
    const asignar = () => { asignarRanura(c.id); abrirMochila(true); };
    alClicHud(d, asignar);   // 3.6.2: mousedown (el click tiraba la línea antes de llegar)
    d.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); asignar(); } });
    const img = document.createElement('img');
    img.src = icono(c.icono); img.alt = c.nombre;
    const sp = document.createElement('span');
    sp.textContent = c.cuenta ? `${c.nombre} (${c.cuenta})` : c.nombre;
    const sm = document.createElement('small');
    sm.textContent = c.texto || '';
    sp.appendChild(sm);
    d.append(img, sp);
    rej.appendChild(d);
  });
}

// El orden de la barra lo elegís vos: cada cosa puede ir a la casilla marcada
function asignarRanura(id) {
  const orden = [...(progreso.barra || [])];
  const actual = orden.indexOf(id);
  if (actual >= 0) orden.splice(actual, 1);
  while (orden.length < elegida) orden.push(null);
  orden.splice(elegida, 0, id);
  progreso.barra = orden.slice(0, 16);
  guardar();
  refrescarBarra(true);
  nota('Lo pusiste en la casilla ' + (elegida + 1), 'Se elige con los números o la rueda');
}

// 3.6.2 (visual): no llueve debajo de las galerías ni de los aleros (con el jugador afuera: bajo techo
// la lluvia ya se apagaba entera). Los techos de alrededor de la cámara, con su altura, en una grilla
// (techo-lluvia.js) que clima.js lee gota por gota. Se rehace al moverse 10 m o si cambia un techo (la
// aldea que crece, tus obras: se mira una vez por segundo), y sólo mientras llueve.
const mapaLluvia = crearMapaCubiertas();
let firmaLluvia = '', acumLluvia = 99;
function revisarMapaLluvia(cam, dt) {
  acumLluvia += dt;
  const moverse = mapaLluvia.lejos(cam.x, cam.z);
  if (!moverse && acumLluvia < 1) return;
  acumLluvia = 0;
  const firma = (aldeaMundo?.versionCubiertas?.() ?? 0) + '|' + (obras?.firmaCubiertas?.() ?? 0).toFixed(3);
  if (!moverse && firma === firmaLluvia) return;
  firmaLluvia = firma;
  const lista = [...(est?.cubiertas || [])];
  for (const p of tren?.paradas || []) if (p.cubiertas) lista.push(...p.cubiertas);
  if (aldeaMundo) lista.push(...aldeaMundo.cubiertas());
  if (obras?.cubiertasLluvia) lista.push(...obras.cubiertasLluvia(cam, 70));
  mapaLluvia.rehacer(cam.x, cam.z, lista);
}

// Pinta en la textura del terreno lo que queda bajo techo, para que la nieve
// no cubra el piso de adentro de las construcciones.
let texturaEstepa = null;
function marcarTechos() {
  if (!texturaEstepa) return;
  const { datos, n, tex } = texturaEstepa;
  const techos = [];
  const agregar = (l, r) => { if (l && typeof l.x === 'number') techos.push({ x: l.x, z: l.z, r }); };
  const L = T.lugares;
  agregar(L.refugio, 3.1);
  for (const c of est.cabañas || []) agregar(c, 2.6);
  agregar(L.almacen, 4.2);
  agregar(L.galpon, 5.5);
  agregar(L.molino, 2.2);
  agregar(L.faro, 2.4);
  agregar(L['casa-te'], 3.0);
  agregar(L.estacion, 3.2);
  agregar(L.cueva, 3.4);
  // 3.6: los techos de la aldea (rectángulos girados: el de cada edificio con su galería)
  const rects = aldeaMundo ? aldeaMundo.techos() : [];
  if (!techos.length && !rects.length) return;
  const metrosPorTexel = 1024 / n;
  for (const t of rects) {
    const c = Math.cos(t.rot), s = Math.sin(t.rot), r = Math.hypot(Math.max(-t.x0, t.x1), Math.max(-t.z0, t.z1)) + 1;
    const i0 = Math.max(0, Math.floor((t.x + 512 - r) / metrosPorTexel)), i1 = Math.min(n - 1, Math.ceil((t.x + 512 + r) / metrosPorTexel));
    const j0 = Math.max(0, Math.floor((t.z + 512 - r) / metrosPorTexel)), j1 = Math.min(n - 1, Math.ceil((t.z + 512 + r) / metrosPorTexel));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = i * metrosPorTexel - 512 - t.x, dz = j * metrosPorTexel - 512 - t.z;
      const bx = dx * c - dz * s, bz = dx * s + dz * c;
      const borde = Math.min(bx - t.x0, t.x1 - bx, bz - t.z0, t.z1 - bz);
      if (borde <= 0) continue;
      const k = (j * n + i) * 4 + 1;
      datos[k] = Math.max(datos[k], 255 * Math.min(1, borde / 0.8));
    }
  }
  for (const t of techos) {
    const i0 = Math.max(0, Math.floor((t.x + 512 - t.r) / metrosPorTexel));
    const i1 = Math.min(n - 1, Math.ceil((t.x + 512 + t.r) / metrosPorTexel));
    const j0 = Math.max(0, Math.floor((t.z + 512 - t.r) / metrosPorTexel));
    const j1 = Math.min(n - 1, Math.ceil((t.z + 512 + t.r) / metrosPorTexel));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const x = i * metrosPorTexel - 512, z = j * metrosPorTexel - 512;
        const d = Math.hypot(x - t.x, z - t.z);
        if (d > t.r) continue;
        const k = (j * n + i) * 4 + 1;
        datos[k] = Math.max(datos[k], 255 * Math.min(1, (t.r - d) / 0.8));
      }
    }
  }
  tex.needsUpdate = true;
}

// 3.5: el canal azul de la misma textura (no lo usaba nadie) marca los pisos de las
// construcciones: las plataformas de las colisiones que quedan a ras del suelo (pisos, andenes,
// veredas, las obras del jugador). Ahí no salen pasto, flores ni helechos (pasto.js): antes el
// coirón atravesaba el piso del almacén. Se rehace sólo cuando cambian las plataformas.
let firmaPisos = '';
// 3.5.2: los canteros (de huerta y de flores) no son plataformas (no se pisan), pero adentro
// tampoco tiene que salir pasto, flores del prado ni amancay: entran a la marca como si fueran
// un piso a ras del suelo, con su caja (cantero de huerta 2,1 × 1,18 m; los de flores, la suya)
function canterosParaPisos() {
  const lista = [];
  let todas = [];
  try { todas = obras?.obras || []; } catch { return lista; }   // (al cargar, las obras todavía no están)
  for (const o of todas) {
    const P = o?.plano, d = o?.datos;
    if (!P || !d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
    const alto = T.altura(d.x, d.z) + 0.3, ang = -(Number(d.rot) || 0);
    if (P.id === 'cantero') lista.push({ x: d.x, z: d.z, ang, largo: 2.1, ancho: 1.18, alto });
    else if (P.jardin === 'flores' && !P.apoyaEnPlataforma) {
      lista.push(P.id === 'macizo-flores' ? { x: d.x, z: d.z, radio: 0.9, alto } : { x: d.x, z: d.z, ang, largo: P.ancho || 2, ancho: P.fondo || 1, alto });
    }
  }
  return lista;
}
function marcarPisos() {
  if (!texturaEstepa || !col?.plataformas) return;
  const lista = col.plataformas.concat(canterosParaPisos());
  if (aldeaMundo) lista.push(...aldeaMundo.pisos());   // 3.6: y las calles y los pisos de la aldea
  let suma = 0;
  for (const p of lista) suma += (p.x || 0) * 0.37 + (p.z || 0) + (p.alto || 0) + (p.ang || 0) * 0.71;
  const firma = lista.length + '|' + suma.toFixed(2);
  if (firma === firmaPisos) return;
  firmaPisos = firma;
  const { datos, n, tex } = texturaEstepa;
  for (let i = 2; i < datos.length; i += 4) datos[i] = 0;
  const MARGEN = 0.8;
  for (const p of lista) {
    // sólo lo que pisa casi el suelo (un puente, la tirolesa o un mirador alto dejan pasto abajo)
    // y no las ayudas invisibles de la física (sin techo ni laterales)
    if (p.sinTecho || p.sinLaterales || !Number.isFinite(p.alto)) continue;
    const sobre = p.alto - T.altura(p.x, p.z);
    if (sobre < -0.3 || sobre > 1.4) continue;
    const circulo = p.radio !== undefined;
    const cos = Math.cos(p.ang || 0), sin = Math.sin(p.ang || 0);
    const hx = (circulo ? p.radio : p.largo / 2) + MARGEN, hz = (circulo ? p.radio : p.ancho / 2) + MARGEN;
    const alcance = circulo ? hx : Math.hypot(hx, hz);
    if (!(alcance > 0) || alcance > 30) continue;
    const i0 = Math.max(0, Math.floor((p.x - alcance + 512) / 2)), i1 = Math.min(n - 1, Math.ceil((p.x + alcance + 512) / 2));
    const j0 = Math.max(0, Math.floor((p.z - alcance + 512) / 2)), j1 = Math.min(n - 1, Math.ceil((p.z + alcance + 512) / 2));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = i * 2 - 512 - p.x, dz = j * 2 - 512 - p.z;
        const dentro = circulo ? dx * dx + dz * dz <= hx * hx
          : Math.abs(dx * cos + dz * sin) <= hx && Math.abs(-dx * sin + dz * cos) <= hz;
        if (dentro) datos[(j * n + i) * 4 + 2] = 255;
      }
    }
  }
  tex.needsUpdate = true;
}

// 3.6: el primer viaje, en una línea: dónde se sube y dónde se baja
const PISTA_PRIMER_VIAJE = 'Subite a la trochita en la Estación del Valle, acá cerca del refugio, y bajate en la Aldea de los Duendes: ahí está el almacén de Ercilia';
// Los primeros pasos: pistas que aparecen una sola vez, cuando corresponde,
// para que el primer rato no sea andar sin saber qué se puede hacer.
const PISTAS = [
  { id: 'p-guia', cuando: () => true, titulo: 'La guía del juego', texto: 'F1 la abre en cualquier momento: qué hacer, de dónde sale cada recurso y cómo se construye' },
  { id: 'p-mirar', cuando: (js, p) => p.horas > 0 && !p.entradas.refugio, titulo: 'Mirá alrededor', texto: 'Acercate a plantas y aves y apretá E para anotarlas en el cuaderno; con Z mirás de lejos' },
  { id: 'p-madera', cuando: (js, p) => (p.materiales?.tronco || 0) === 0 && !!p.cosas?.hacha, titulo: 'Madera', texto: 'Arrimate a un coihue o una lenga y apretá H tres veces: el árbol cae y da cuatro troncos' },
  { id: 'p-tablas', cuando: (js, p) => (p.materiales?.tronco || 0) > 0 && (p.materiales?.tabla || 0) < 2, titulo: 'Tablas', texto: 'Y aserra un tronco en dos tablas en cualquier lado; en un banco de carpintero rinde cuatro' },
  { id: 'p-juntar', cuando: (js, p) => p.ramitas >= 2 && !p.entradas.fogata, titulo: 'Ya tenés ramitas', texto: 'Con tres alcanza para encender un fuego: apretá F en un lugar despejado' },
  { id: 'p-cuaderno', cuando: (js, p) => Object.keys(p.entradas).length >= 3, titulo: 'El cuaderno', texto: 'Con J se abre; ahí está lo que anotaste y lo que falta encontrar' },
  { id: 'p-noche', cuando: (js, p) => p.horas > 20.5 || p.horas < 5.5, titulo: 'Se hizo de noche', texto: 'Con L prendés la linterna, y junto al fuego se puede dormir hasta la mañana' },
  { id: 'p-lluvia', cuando: (js, p, clima) => clima.lluvia > 0.5, titulo: 'Se largó a llover', texto: 'Los peces pican mejor con lluvia, pero los animales se guardan' },
  { id: 'p-tren', cuando: (js, p) => !!p.entradas.estacion, titulo: 'La trochita', texto: 'Para en cada apeadero unos segundos; se sube con E y se viaja hasta donde quieras' },
  // 3.6: el primer viaje. En el Relax el almacén (y el hacha) está en la Aldea de los Duendes
  { id: 'p-aldea', cuando: (js, p) => !desafio && !p.cosas?.hacha && !p.aldea?.descubierta && (!!p.entradas.refugio || Object.keys(p.entradas).length >= 2), titulo: 'El hacha está en la aldea', texto: PISTA_PRIMER_VIAJE },
  // Desafío, segundo acto: el nido aparece cuando cae la nodriza
  { id: 'p-nido', cuando: (js, p) => !!p.desafio?.nido && !p.desafio.nido.caido, titulo: 'Siguen bajando', texto: 'Salen de un nido enterrado en el valle. Los restos de nave traen señales que te lo van a ubicar' },
  { id: 'p-cerco', cuando: (js, p) => (p.desafio?.nido?.pistas || 0) >= 1 && !p.desafio.nido.caido, titulo: 'El cerco se achica', texto: 'Abrí el mapa (M): el redondel a lápiz marca dónde puede estar. Cada resto de nave lo achica' },
  // 3.0: el asedio final y la nave por dentro
  { id: 'p-asedio', cuando: (js, p) => !!p.desafio?.asedio?.activo, titulo: 'El asedio', texto: 'La nodriza se asentó y clavó agujas en el valle (el mapa las marca). Rompelas de día; de noche defendé la baliza de la última zona que recuperaste' },
  { id: 'p-haz', cuando: (js, p) => !!p.desafio?.asedio?.activo && (p.desafio.asedio.zonas || []).filter((z) => z.estado !== 'tomada').length >= 3, titulo: 'El haz está abierto', texto: 'Con tres zonas libres se puede subir a la nave: de día, parate abajo de ella, en el haz de luz, y apretá E' },
  { id: 'p-nido-dia', cuando: (js, p) => (p.desafio?.nido?.pistas || 0) >= NIDO.pistas && !p.desafio.nido.caido, titulo: 'El nido está marcado', texto: 'Andá de día: con el sol arriba se abre el caparazón y quedan a tiro las tres cámaras. De noche está cerrado' },
];
let acumuladoPistas = 0;
function revisarPistas(dt) {
  acumuladoPistas += dt;
  if (acumuladoPistas < 1.5 || charla.npc || mochilaAbierta || modoObra) return;
  acumuladoPistas = 0;
  progreso.pistas = progreso.pistas || {};
  for (const p of PISTAS) {
    if (progreso.pistas[p.id]) continue;
    if (!p.cuando(jugador.estado, progreso, clima.estado)) continue;
    progreso.pistas[p.id] = true;
    nota(p.titulo, p.texto);
    guardar();
    return;   // de a una por vez, sin amontonar
  }
}

// ---------------------------------------------------------------- cámara libre (F4)
// Una herramienta para mirar el mundo desde donde uno quiera: sirve para
// revisar techos, alturas y encastres sin tener que trepar.
const libre = { activa: false, vel: new THREE.Vector3(), rapido: false };
function alternarCamaraLibre() {
  libre.activa = !libre.activa;
  nota(libre.activa ? 'Cámara libre' : 'Cámara normal',
    libre.activa ? 'WASD para volar, Espacio y Shift para subir y bajar, F4 para salir' : 'Volviste al cuerpo');
}
function moverCamaraLibre(dt) {
  const js = jugador.estado;
  const teclas = jugador.teclas;
  const v = (teclas.has('ShiftLeft') ? 34 : 12) * dt;
  const adelante = new THREE.Vector3(-Math.sin(js.yaw), 0, -Math.cos(js.yaw));
  const derecha = new THREE.Vector3(Math.cos(js.yaw), 0, -Math.sin(js.yaw));
  const d = new THREE.Vector3();
  if (teclas.has('KeyW')) d.add(adelante);
  if (teclas.has('KeyS')) d.sub(adelante);
  if (teclas.has('KeyD')) d.add(derecha);
  if (teclas.has('KeyA')) d.sub(derecha);
  if (teclas.has('Space')) d.y += 1;
  if (teclas.has('ControlLeft')) d.y -= 1;
  if (d.lengthSq() > 0) d.normalize().multiplyScalar(v);
  // la cámara vuela y el cuerpo se queda quieto abajo
  camara.position.add(d);
  camara.rotation.set(js.pitch, js.yaw, 0, 'YXZ');
}

// ---------------------------------------------------------------- visibilidad por distancia
// Las construcciones y los tramos de vía lejanos no se dibujan: la niebla ya los tapa.
let acumuladoVisible = 0;
let acumuladoAmbiente = 0;
let enMano = null;
let obras = null;
let puertas = null;
let modoObra = false;
let categoriaObra = CATEGORIAS_CONSTRUCCION[0]?.clave || 'refugios';
let paginaObra = 0;
const PLANOS_POR_PAGINA = 8;
let ultimoSitioObra = '';
const centrosEst = [];
const indiceCentrosEst = crearIndiceEspacial2D(64);
const consultaCentrosEst = [];
const visiblesEst = new Set();
const indiceChunksTren = crearIndiceEspacial2D(96);
const consultaChunksTren = [];
const visiblesTren = new Set();
let radioMaxCentroEst = 12;
let generacionVisibilidad = 0;
function prepararVisibilidad() {
  centrosEst.length = 0;
  visiblesEst.clear(); visiblesTren.clear(); radioMaxCentroEst = 12;

  // RC31: el LOD trabaja sobre complejos completos, nunca sobre piezas sueltas.
  // `est.conjuntos` agrupa edificio + accesorios + mecanismos + luces + cartel.
  // Los hijos restantes son carteles/elementos sin complejo y se tratan como
  // nodos individuales. De esta forma una ventana, tanque o aspa jamás puede
  // sobrevivir visualmente a su edificio padre.
  const estructurados = new Set((est.conjuntos || []).map((c) => c.obj));
  const entradas = [
    ...(est.conjuntos || []).map((c) => ({ obj: c.obj, x: c.x, z: c.z, radio: c.radio, clave: c.clave })),
    ...est.grupo.children.filter((h) => !estructurados.has(h) && !h.userData?.estructuraRaiz).map((obj) => ({ obj })),
  ];

  for (const entrada of entradas) {
    const hijo = entrada.obj;
    hijo.updateWorldMatrix(true, false);
    let centro = null;
    let radio = entrada.radio || hijo.userData?.radioEstructura || 0;
    if (Number.isFinite(entrada.x) && Number.isFinite(entrada.z)) {
      centro = new THREE.Vector3(entrada.x, 0, entrada.z);
    } else if (hijo.isMesh && hijo.geometry) {
      if (!hijo.geometry.boundingSphere) hijo.geometry.computeBoundingSphere();
      const bs = hijo.geometry.boundingSphere;
      centro = bs.center.clone().applyMatrix4(hijo.matrixWorld);
      radio = radio || bs.radius * Math.max(hijo.scale.x, hijo.scale.y, hijo.scale.z);
    } else {
      centro = new THREE.Vector3();
      hijo.getWorldPosition(centro);
      radio = radio || 12;
    }

    // `castShadow` en un Group no representa las mallas descendientes. Guardar
    // las mallas reales permite un shadow-LOD correcto sin fragmentar el complejo.
    const sombras = [];
    const detallesLejanos = [];
    hijo.traverse((n) => {
      if (n.isMesh && n.castShadow) sombras.push(n);
      if (n.userData?.detalleLejano) detallesLejanos.push(n);
    });
    centrosEst.push({ obj: hijo, x: centro.x, z: centro.z, radio, sombras, detallesLejanos,
      distanciaMax: hijo.userData?.distanciaMax || Infinity, clave: entrada.clave || hijo.name || '' });
    radioMaxCentroEst = Math.max(radioMaxCentroEst, radio);
  }
  indiceCentrosEst.reconstruir(centrosEst, (c) => c);
  indiceChunksTren.reconstruir(tren?.chunks || [], (c) => c);
  // 2.7.4: lo que el LOD muestra u oculta (y el tren) avisa cuántos metros le faltan a la
  // cámara (o al jugador) para aparecer u ocultarse: los programas que va a necesitar (con
  // la cantidad de luces de ese momento) se compilan antes de llegar (ver luces.js). Los
  // mismos cortes que actualizarVisibilidad.
  for (const c of centrosEst) {
    const limite = () => Math.min(calidad.lejos + 60 + c.radio, c.distanciaMax);
    variantesLuces.conmutador(c.obj,
      () => Math.abs(Math.hypot(camara.position.x - c.x, camara.position.z - c.z) - limite()),
      (p) => Math.hypot(p.x - c.x, p.z - c.z) < limite());
  }
  for (const ch of tren?.chunks || []) {
    variantesLuces.conmutador(ch.mallas,
      () => Math.abs(Math.hypot(camara.position.x - ch.x, camara.position.z - ch.z) - (calidad.lejos + 60)),
      (p) => Math.hypot(p.x - ch.x, p.z - ch.z) < calidad.lejos + 60);
  }
  if (tren?.grupoLuces) variantesLuces.conmutador(tren.grupoLuces, () => tren.margenLuces(jugador.estado.pos), () => tren.visibleDesde(jugador.estado.pos), { umbral: 120, alInstante: true });
}
function actualizarVisibilidad(cam, factorDetalle = 1) {
  const corte = calidad.lejos + 60;
  const gen = ++generacionVisibilidad;
  const candidatos = indiceCentrosEst.consultar(cam.x, cam.z, corte + radioMaxCentroEst, consultaCentrosEst);
  for (const c of candidatos) c.__visGen = gen;

  // RC31: culling atómico por complejo. Se puede apagar el edificio entero o
  // mantenerlo entero; nunca una chimenea/ventana/tanque sin su estructura.
  for (const c of centrosEst) {
    const dx = cam.x - c.x, dz = cam.z - c.z;
    const d2 = dx * dx + dz * dz;
    const limite = Math.min(corte + c.radio, c.distanciaMax);
    const visible = c.__visGen === gen && d2 < limite * limite;
    c.obj.visible = visible;

    // Microdetalle como carteles: puede desaparecer mucho antes que la silueta
    // del edificio para evitar placas oscuras de pocos píxeles en el horizonte.
    if (visible) for (const d of c.detallesLejanos) {
      const maxD = d.userData?.distanciaMax || 125;
      d.visible = d === c.obj ? true : d2 < maxD * maxD;
    }

    // Sombras: sólo cerca. El estado se aplica a las mallas descendientes del
    // complejo, no al Group, por lo que vuelve a funcionar el shadow-LOD real.
    const limiteSombra = 82 + c.radio;
    const sombraActiva = visible && d2 < limiteSombra * limiteSombra;
    for (const m of c.sombras) m.castShadow = sombraActiva;
  }
  visiblesEst.clear();
  if (tren) {
    const radioTren = corte;
    const candidatosTren = indiceChunksTren.consultar(cam.x, cam.z, radioTren + 140, consultaChunksTren);
    for (const ch of candidatosTren) {
      ch.__visGen = gen;
      const dx = cam.x - ch.x, dz = cam.z - ch.z;
      const visible = dx * dx + dz * dz < radioTren * radioTren;
      for (const m of ch.mallas) m.visible = visible;
      if (visible) visiblesTren.add(ch); else visiblesTren.delete(ch);
    }
    for (const ch of visiblesTren) {
      if (ch.__visGen === gen) continue;
      for (const m of ch.mallas) m.visible = false;
      visiblesTren.delete(ch);
    }
  }
  marcarPisos();   // 3.5: una obra nueva (o una que se fue) cambia los pisos sin pasto
}

// ---------------------------------------------------------------- la bitácora del faro
function enLaSalaDelFaro() {
  const f = est.faro;
  if (!f || !f.mesa) return false;
  const js = jugador.estado;
  return Math.hypot(js.pos.x - f.mesa.x, js.pos.z - f.mesa.z) < 2.6 && js.pos.y > f.altoSala - 1.2;
}

// ---------------------------------------------------------------- materiales y obra
function tieneHacha() { return !!progreso.cosas?.hacha; }
function material(k) { return progreso.materiales?.[k] || 0; }
function sumarMaterial(k, n) {
  progreso.materiales = progreso.materiales || {};
  progreso.materiales[k] = (progreso.materiales[k] || 0) + n;
}

// ------- modo Desafío: recursos para fabricar, derrota y vuelta a la base
const FRUTAS = ['pinon', 'calafate', 'frutilla'];
function cuantoRecurso(k) {
  if (k === 'ramita') return progreso.ramitas || 0;
  if (k === 'fruta') return FRUTAS.reduce((s, f) => s + (progreso.entradas[f]?.cantidad || 0), 0);
  if (FRUTAS.includes(k)) return progreso.entradas[k]?.cantidad || 0;
  return material(k);
}
function gastarRecurso(k, n) {
  if (k === 'ramita') { progreso.ramitas = Math.max(0, (progreso.ramitas || 0) - n); return; }
  if (k === 'fruta') {
    let falta = n;
    for (const f of FRUTAS) {
      const e = progreso.entradas[f];
      if (!e || !falta) continue;
      const usa = Math.min(falta, e.cantidad || 0);
      e.cantidad -= usa; falta -= usa;
    }
    return;
  }
  if (FRUTAS.includes(k)) { const e = progreso.entradas[k]; if (e) e.cantidad = Math.max(0, (e.cantidad || 0) - n); return; }
  progreso.materiales[k] = Math.max(0, material(k) - n);
}
// Donde despertás después de caer: junto a tu catre si armaste uno, si no en el refugio.
function puntoBase() {
  const catre = obras?.obras.find((o) => o.plano.funciones?.includes?.('dormir') && o.datos.etapas > 0);
  if (catre) {
    const r = catre.datos.rot || 0;
    return { x: catre.datos.x + Math.sin(r) * 1.1, z: catre.datos.z + Math.cos(r) * 1.1, yaw: r, y: catre.datos.y };
  }
  const bm = desafio?.baseMapa;   // 3.0: la base del mapa de la semilla
  if (bm) return { x: bm.x, z: bm.z, yaw: bm.yaw, y: null };
  const ref = T.lugares.refugio;
  return { x: ref.puerta.x, z: ref.puerta.z, yaw: ref.mira, y: null };
}
function caerEnDesafio() {
  if (esSinFin) { terminarCorrida(); return; }   // 3.0: en la supervivencia sin fin, caer termina la corrida
  const f = $('fundido');
  f.classList.add('activo');
  if (modoObra) abrirObra(false);
  if (mochilaAbierta) abrirMochila(false);
  desafio?.abrirTaller(false);
  nota('Los invasores te dejaron fuera de combate', 'Perdiste los cristales y parte de los materiales', true);
  setTimeout(() => {
    desafio.limpiar();
    const M = progreso.materiales || {};
    M.cristal = 0;
    for (const k of ['tronco', 'tabla', 'piedra']) if (M[k]) M[k] = Math.floor(M[k] * 0.7);
    if (progreso.horas >= 12) progreso.dia++;
    progreso.horas = 7.2;
    const b = puntoBase();
    jugador.ubicar(b.x, b.z, b.yaw, b.y);
    desafio.levantarse();
    refrescarBarra(true);
    guardar();
    setTimeout(() => {
      f.classList.remove('activo');
      nota(`Día ${progreso.dia}`, 'Despertás en tu base. Reforzá las defensas antes de la noche');
    }, 900);
  }, 1600);
}

// Con el hacha: un tronco caído o un pedrero se aprovechan de un golpe; un árbol en pie
// se tala con tres hachazos y da cuatro troncos. El pehuén no se toca: es sagrado.
const GOLPES_TALA = 3, TRONCOS_TALA = 4, TRONCOS_MATA = 3, PIEDRA_MATA = 4;
const scratchMatasHacha = [], scratchArbolesHacha = [];
const golpesTala = new WeakMap();
function objetivoHacha() {
  if (!tieneHacha()) return null;
  const js = jugador.estado;
  let mejor = null, d0 = 3.2;
  const matasHacha = veg.matasCerca ? veg.matasCerca(js.pos.x, js.pos.z, 4.2, scratchMatasHacha) : veg.matas;
  for (const m of matasHacha) {
    if (m.sacado || (m.tipo !== 'roca' && m.tipo !== 'tronco')) continue;
    const d = Math.hypot(m.x - js.pos.x, m.z - js.pos.z);
    if (d < d0) { d0 = d; mejor = m; }
  }
  if (mejor) return { tipo: mejor.tipo === 'roca' ? 'piedra' : 'tronco', mata: mejor };
  const arbolesHacha = veg.arbolesCerca ? veg.arbolesCerca(js.pos.x, js.pos.z, 6, scratchArbolesHacha) : veg.arboles;
  let arbol = null, da = Infinity;
  for (const a of arbolesHacha) {
    if (a.sacado) continue;
    const d = Math.hypot(a.x - js.pos.x, a.z - js.pos.z) - (a.r || 0.4);
    if (d < 2.2 && d < da) { da = d; arbol = a; }
  }
  if (!arbol) return null;
  if (arbol.caido) return { tipo: 'tronco', arbol, caido: true };
  return { tipo: 'tronco', arbol, talar: true, protegido: arbol.especie === 'pehuen', golpes: golpesTala.get(arbol) || 0 };
}
function textoHacha(o) {
  if (o.tipo === 'piedra') return 'Picar piedra';
  if (!o.talar) return 'Hacer troncos';
  if (o.protegido) return 'El pehuén no se tala';
  return o.golpes ? `Talar el árbol (${o.golpes}/${golpesParaTalarAhora()})` : 'Talar el árbol';
}
function usarHacha() {
  const o = objetivoHacha();
  if (!o) {
    // 3.6: en el Relax el almacén está en la Aldea de los Duendes: se llega en la trochita
    nota(tieneHacha() ? 'Acá no hay nada que cortar' : 'Te falta el hacha', tieneHacha() ? 'Arrimate a un árbol, un tronco o un pedrero' : desafio ? 'Se cambia en el almacén' : 'Está en el almacén de la Aldea de los Duendes: tomá la trochita en la Estación del Valle');
    return;
  }
  if (o.talar) {
    if (o.protegido) { nota('El pehuén no se tala', 'Es un árbol sagrado y centenario: buscá un coihue o una lenga'); return; }
    const golpes = (golpesTala.get(o.arbol) || 0) + 1;
    const hacen = golpesParaTalarAhora();   // 3.1: el oficio y el filo del herrero
    const dondeSuena = { x: o.arbol.x, y: (o.arbol.y ?? jugador.estado.pos.y) + 1.2, z: o.arbol.z };
    // cada hachazo suena más hondo que el anterior: la muesca se abre y el tronco
    // responde más grave
    sonido.hachazo(dondeSuena, golpes / hacen);
    if (golpes < hacen) {
      golpesTala.set(o.arbol, golpes);
      veg.sacudir(o.arbol);
      nota(`Hachazo ${golpes} de ${hacen}`, 'Seguí dándole con H');
      return;
    }
    golpesTala.delete(o.arbol);
    // cae para el lado contrario al tuyo: nunca encima
    const js2 = jugador.estado;
    veg.talar(o.arbol, { x: o.arbol.x - js2.pos.x, z: o.arbol.z - js2.pos.z });
    sonido.arbolCae(dondeSuena);
    anotarTalado(o.arbol);
    const troncosTala = troncosAlTalar(TRONCOS_TALA, nivelDe('hachero'));   // 3.1
    sumarMaterial('tronco', troncosTala);
    gastarFilo(progreso.aldea);   // 3.6: el filo que te dio el herrero de la aldea
    nota(`¡Árbol talado! +${troncosTala} troncos`, `Llevás ${material('tronco')}. Con Y los aserrás en tablas`);
    registrar('tronco-mat');
    ganarOficio('hachero', XP.tala);
    guardar();
    return;
  }
  // El árbol que tiró el rayo rinde más que un tronco caído, y su tocón rebrota.
  const delRayo = !!o.caido && progreso.tormenta?.rayo && veg.arboles[progreso.tormenta.rayo.i] === o.arbol;
  const cuanto = (delRayo ? RAYO.troncos : o.tipo === 'tronco' ? TRONCOS_MATA : PIEDRA_MATA) + extraDeMata(nivelDe('hachero'));   // 3.1
  sumarMaterial(o.tipo, cuanto);
  if (o.mata) veg.despejar(o.mata.x, o.mata.z, 0.6, true);
  if (o.caido) { veg.talar(o.arbol); anotarTalado(o.arbol); }
  if (delRayo) progreso.tormenta.rayo = null;
  sonido.paso(o.tipo === 'tronco' ? 'madera' : 'tierra', 1);
  nota(`+${cuanto} ${MATERIALES[o.tipo].nombre}`, `Llevás ${material(o.tipo)}`);
  registrar(o.tipo === 'tronco' ? 'tronco-mat' : 'piedra-mat');
  ganarOficio('hachero', XP.mata);
  guardar();
}

// ---------------------------------------------------------------- mando y accesibilidad
// El joystick aprieta las mismas teclas que ya entiende el juego, así no hay dos
// caminos para cada acción. Lo que sostiene el stick se suelta solo.
const TECLA_DE_MANDO = {
  interactuar: 'KeyE', linterna: 'KeyL', mochila: 'KeyI', planos: 'KeyO',
  taller: 'KeyK', mapa: 'KeyM', cuaderno: 'KeyJ', guia: 'F1', pausa: 'Escape',
};
const ACCIONES_TECLA_MANDO = Object.keys(TECLA_DE_MANDO);   // 2.7.3: una vez, no en cada cuadro
const pisadasMando = new Set();
function golpeDeTecla(code) {
  // 3.5.1: el mando aprieta la tecla que el jugador eligió para esa acción. Antes apretaba la de
  // fábrica y, con E movida a otra tecla, el botón X no hacía nada (la de fábrica quedaba huérfana)
  // o hacía otra cosa (si otra acción había tomado esa tecla).
  const accion = ACCIONES_TECLA.find((a) => TECLAS_POR_DEFECTO[a] === code);
  if (accion && teclasPropias[accion]) code = teclasPropias[accion];
  document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}
function sostenerTecla(code, apretada) {
  if (apretada) { jugador.teclas.add(code); pisadasMando.add(code); }
  else if (pisadasMando.delete(code)) jugador.teclas.delete(code);
}
let habiaMando = false;
function leerMando(dt) {
  const m = mando.actualizar();
  if (m.conectado !== habiaMando) {
    habiaMando = m.conectado;
    document.body.classList.toggle('con-mando', m.conectado);
    nota(m.conectado ? 'Mando conectado' : 'Se desconectó el mando', m.conectado ? m.nombre : 'Volvés al teclado', true);
    // 3.5.1: desenchufado con el stick apretado, el jugador seguía caminando solo
    if (!m.conectado) { for (const c of pisadasMando) jugador?.teclas.delete(c); pisadasMando.clear(); }
  }
  if (!m.conectado || modo !== 'jugando' || !jugador) return;
  girarMirada(jugador.estado, m.mirada, dt);
  sostenerTecla('KeyW', m.mov.z > 0.2); sostenerTecla('KeyS', m.mov.z < -0.2);
  sostenerTecla('KeyD', m.mov.x > 0.2); sostenerTecla('KeyA', m.mov.x < -0.2);
  sostenerTecla('ShiftLeft', !!m.activos.correr);
  // 3.6.1: charlando, B vuelve atrás o se despide (como Escape; antes te agachaba), y con el menú
  // abierto la cruceta arriba y abajo mueve la opción (antes abría la mochila y el taller)
  const enCharla = !!charla.npc && !foto.activo;
  // 3.6.2: con el almacén, la feria o las cargas abiertos: LB y RB o la cruceta mueven la marca, A elige y B sale
  // (antes con el mando no se podía elegir nada: A saltaba y la cruceta abría la mochila o el taller)
  const enLista = !enCharla && !!listaHudAbierta();
  if (enLista) {
    if (m.recien.objetoAnterior || m.recien.mochila) marcarHud(-1);
    if (m.recien.objetoSiguiente || m.recien.taller) marcarHud(1);
    if (m.recien.saltar) elegirHud();
    if (m.recien.agacharse) golpeDeTecla('Escape');
  }
  if (!enLista) { if (m.recien.saltar) golpeDeTecla('Space'); }
  if (!enLista) { if (m.recien.agacharse) { if (enCharla) atrasCharla(); else golpeDeTecla('KeyC'); } }
  for (const a of ACCIONES_TECLA_MANDO) {
    if (!m.recien[a]) continue;
    if (enCharla && charla.menu && (a === 'mochila' || a === 'taller')) { moverMenuCharla(a === 'mochila' ? -1 : 1); continue; }
    if (enLista && (a === 'mochila' || a === 'taller')) continue;
    golpeDeTecla(TECLA_DE_MANDO[a]);
  }
  // 3.6 (vida): con el menú de la charla abierto, LB y RB mueven la opción marcada (X la elige)
  if (!enLista) {
    if (m.recien.objetoAnterior) { if (charla.menu) moverMenuCharla(-1); else elegirRanura(elegida - 1); }
    if (m.recien.objetoSiguiente) { if (charla.menu) moverMenuCharla(1); else elegirRanura(elegida + 1); }
  }
  if (desafio && !desafio.caido && !modoObra) {
    const id = ranuras[elegida]?.id;
    if (m.recien.atacar) { desafio.atacar(id); refrescarBarra(true); }
    if (m.recien.bloquear && id === 'arco' && desafio.cambiarFlecha()) refrescarBarra(true);
    else if (m.recien.bloquear && desafio.puedeBloquear(id)) desafio.bloquear(true, id);
    if (m.soltados.bloquear && desafio.bloqueando) desafio.bloquear(false);
    if (m.recien.esquivar) desafio.esquivar(m.mov.x >= 0 ? 1 : -1);
  } else if (m.recien.atacar) usarRanura();
}

// Letra más grande, paleta para daltonismo y subtítulos de los avisos.
let avisosDichos = [];
function aplicarAccesibilidad() {
  const raiz = document.documentElement;
  // 2.8: el retoque de "Tu interfaz" se suma al tamaño de letra de accesibilidad (manda éste)
  raiz.style.setProperty('--escala-letra', escalaFinal(escalaLetra(ajustes.tamanoLetra), progreso?.personal?.interfaz));
  const p = ajustes.paleta || 'normal';
  raiz.style.setProperty('--peligro', colorDe('peligro', p));
  raiz.style.setProperty('--salud', colorDe('salud', p));
  raiz.style.setProperty('--aviso-color', colorDe('aviso', p));
  document.body.classList.toggle('con-subtitulos', !!ajustes.subtitulos);
  dibujarSubtitulos();
}
function dibujarSubtitulos() {
  const caja = $('subtitulos');
  if (!caja) return;
  caja.classList.toggle('oculto', !ajustes.subtitulos);
  if (!ajustes.subtitulos) return;
  caja.innerHTML = '';
  for (const s of subtitulos(avisosDichos, 4)) {
    const fila = document.createElement('p');
    fila.textContent = s.linea;
    caja.appendChild(fila);
  }
}

// 2.0: los sonidos escritos con dirección (ver `desafio-sentidos.js`). Tres renglones
// como mucho, que se borran solos; el mismo sonido repetido se cuenta en vez de apilarse.
let sonidosEscritos = [], tBorrarSonidos = 0;
function escribirSonido(texto) {
  if (!ajustes.sonidosEscritos) return;
  // (ya viene traducido pedazo por pedazo: ver `subtituloSonido`)
  sonidosEscritos = apilarSubtitulo(sonidosEscritos, texto, performance.now() / 1000);
  dibujarSonidosEscritos();
}
function dibujarSonidosEscritos() {
  const caja = $('sonidos-escritos');
  if (!caja) return;
  sonidosEscritos = apilarSubtitulo(sonidosEscritos, null, performance.now() / 1000);
  caja.classList.toggle('oculto', !sonidosEscritos.length);
  const html = sonidosEscritos.map((s) => renglonSubtitulo(s));
  if (caja.dataset.texto !== html.join('|')) {
    caja.dataset.texto = html.join('|');
    caja.innerHTML = '';
    for (const r of html) { const p = document.createElement('p'); p.textContent = r; caja.appendChild(p); }
  }
  clearTimeout(tBorrarSonidos);
  if (sonidosEscritos.length) tBorrarSonidos = setTimeout(dibujarSonidosEscritos, 600);
}

// 2.0: la vibración del mando. La Gamepad API la da en Chrome/Electron con
// `vibrationActuator`; si el mando no vibra, no pasa nada.
let ultimoPulso = null, pulsosDados = 0;
function vibrarMando(evento, intensidad = 1) {
  if (!ajustes.vibracion) return false;
  const pulso = pulsoVibracion(evento, intensidad);
  const ahora = performance.now();
  if (!dejarVibrar(ultimoPulso, pulso, ahora)) return false;
  let mando = null;
  try { mando = [...(navigator.getGamepads?.() || [])].find((g) => g && g.connected && g.vibrationActuator); } catch { mando = null; }
  ultimoPulso = { ...pulso, desde: ahora };
  pulsosDados++;
  if (!mando) return false;
  try {
    mando.vibrationActuator.playEffect('dual-rumble', { startDelay: 0, duration: pulso.duracion, strongMagnitude: pulso.fuerte, weakMagnitude: pulso.debil });
  } catch { return false; }
  return true;
}

// ---------------------------------------------------------------- el acopio
// Una pila de materiales en la base. Guardás ahí lo que juntás (E) y, mientras
// estés cerca, lo que levantes se paga primero del acopio: se termina el ir y
// venir con todo encima.
const CLAVES_MATERIAL = ['tronco', 'tabla', 'piedra', 'cristal', 'lana'];
const RADIO_ACOPIO_OBRA = 18, RADIO_ACOPIO_MANO = 3.4;
function acopio() {
  if (!progreso.acopio || typeof progreso.acopio !== 'object') progreso.acopio = {};
  return progreso.acopio;
}
// 3.0.1: lo que se usa con E en tus obras (acopio, cantero, gallinero, telar, colmena, radio…)
// se medía sólo por distancia: desde afuera de tu casa se usaba lo de adentro a través de
// la pared. Igual que los bancos y las camas del valle, no puede haber una pared en el medio.
function sinParedEnMedio(o) {
  if (!o) return null;
  const js = jugador.estado;
  return col?.paredEntre?.(js.pos.x, js.pos.z, o.datos.x, o.datos.z, js.pos.y + 0.9, js.pos.y + 0.9, true, o) ? null : o;
}
function funcionAlAlcance(funcion, radio) { return sinParedEnMedio(obras?.tieneFuncionCerca?.(funcion, jugador.estado.pos, radio)); }
function hayAcopioCerca(radio) {
  // el acopio de una obra (18 m) cuenta a través de las paredes; el de la mano, no
  return !!(radio > RADIO_ACOPIO_MANO ? obras?.tieneFuncionCerca?.('acopio', jugador.estado.pos, radio) : funcionAlAlcance('acopio', radio));
}
function totalAcopio() { return CLAVES_MATERIAL.reduce((s, k) => s + (acopio()[k] || 0), 0); }
function totalEnMano() { return CLAVES_MATERIAL.reduce((s, k) => s + material(k), 0); }
// Lo que se puede gastar sin moverse: la mochila más el acopio si está cerca.
function materialesVisibles() {
  const m = progreso.materiales || {};
  if (!hayAcopioCerca(RADIO_ACOPIO_OBRA)) return m;
  const a = acopio(), vista = { ...m };
  for (const k of CLAVES_MATERIAL) vista[k] = (m[k] || 0) + (a[k] || 0);
  return vista;
}
// Corre `fn` con esa vista y después cobra: primero del acopio, después de la mochila.
function conMateriales(fn) {
  progreso.materiales = progreso.materiales || {};
  const m = progreso.materiales;
  if (!hayAcopioCerca(RADIO_ACOPIO_OBRA)) return fn(m);
  const a = acopio();
  const vista = { ...m };
  for (const k of CLAVES_MATERIAL) vista[k] = (m[k] || 0) + (a[k] || 0);
  const r = fn(vista);
  for (const k of CLAVES_MATERIAL) {
    const gasto = (m[k] || 0) + (a[k] || 0) - (vista[k] || 0);
    if (gasto === 0) continue;
    // Si la obra devolvió material en vez de gastarlo, va a la mochila: no se pierde.
    if (gasto < 0) { m[k] = (m[k] || 0) - gasto; continue; }
    const delAcopio = Math.min(a[k] || 0, gasto);
    a[k] = (a[k] || 0) - delAcopio;
    m[k] = Math.max(0, (m[k] || 0) - (gasto - delAcopio));
  }
  return r;
}
function usarAcopio() {
  const a = acopio(), m = progreso.materiales = progreso.materiales || {};
  const enMano = totalEnMano();
  if (enMano > 0) {
    const partes = [];
    for (const k of CLAVES_MATERIAL) {
      const n = material(k);
      if (!n) continue;
      a[k] = (a[k] || 0) + n;
      m[k] = 0;
      partes.push(`${n} ${MATERIALES[k].nombre}`);
    }
    sonido.juntar();
    nota('Guardaste en el acopio', `${partes.join(' · ')}. Podés construir cerca sin cargarlo encima`);
  } else if (totalAcopio() > 0) {
    const partes = [];
    for (const k of CLAVES_MATERIAL) {
      const n = a[k] || 0;
      if (!n) continue;
      m[k] = (m[k] || 0) + n;
      a[k] = 0;
      partes.push(`${n} ${MATERIALES[k].nombre}`);
    }
    sonido.juntar();
    nota('Sacaste todo del acopio', partes.join(' · '));
  } else {
    nota('El acopio está vacío', 'Traé troncos, tablas o piedra y apretá E acá');
    return;
  }
  refrescarBarra(true);
  guardar();
}

// ---------------------------------------------------------------- la huerta
// Canteros que arma el jugador (O → Trabajo). Se siembra y se cosecha con E; lo que
// crece vive en progreso.huerta, por la posición del cantero, y se dibuja en dos
// mallas instanciadas para todos.
let matasHuerta = null, diaHuerta = -1, canterosVistos = -1, listosVistos = 0;
const ENTRADA_COSECHA = { habas: 'haba', papas: 'papa', frutillas: 'frutilla-huerta', calafates: 'calafate' };
function huerta() {
  if (!progreso.huerta || typeof progreso.huerta !== 'object' || Array.isArray(progreso.huerta)) progreso.huerta = {};
  return progreso.huerta;
}
function canterosTerminados() {
  return (obras?.obras || []).filter((o) => o.plano.id === 'cantero' && o.datos.etapas >= o.plano.etapas.length);
}
function canteroCerca() {
  const o = funcionAlAlcance('huerta', 2.4);
  return o ? { obra: o, clave: claveCantero(o.datos.x, o.datos.z) } : null;
}
// Semillas en las cosas; las frutillas, en lo juntado.
function cuantoParaSembrar(k) { return progreso.cosas?.[k] || progreso.entradas?.[k]?.cantidad || 0; }
function refrescarHuerta() {
  if (!matasHuerta) return;
  const h = huerta();
  const todos = (obras?.obras || []).filter((o) => o.plano.id === 'cantero');
  // Un cantero que ya no está (lo desarmaste o lo tiraron abajo) se lleva lo sembrado.
  const vivos = new Set(todos.map((o) => claveCantero(o.datos.x, o.datos.z)));
  for (const k of Object.keys(h)) if (!vivos.has(k)) delete h[k];
  const canteros = canterosTerminados();
  canterosVistos = canteros.length;
  matasHuerta.sincronizar(canteros.map((o) => ({
    x: o.datos.x, z: o.datos.z, rot: o.datos.rot || 0,
    y: Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z),
    parcela: h[claveCantero(o.datos.x, o.datos.z)] || null,
  })), progreso.dia);
}
function textoAvisoCantero(c) {
  const p = huerta()[c.clave];
  if (p) return textoCantero(p, progreso.dia);
  const s = semillaParaSembrar(cuantoParaSembrar);
  return s ? `Sembrar ${CULTIVOS[s.cultivo].nombre}` : 'Cantero vacío: faltan semillas';
}
function usarCantero(c) {
  const h = huerta(), p = h[c.clave];
  if (!p) {
    const s = semillaParaSembrar(cuantoParaSembrar);
    if (!s) { nota('No tenés qué sembrar', 'Semillas de habas o de papa en el almacén, o una frutilla o un calafate que juntaste'); return; }
    if (s.conIngrediente) progreso.entradas[s.gasta].cantidad -= 1;
    else progreso.cosas[s.gasta] -= 1;
    sembrar(h, c.clave, s.cultivo, progreso.dia);
    ganarOficio('huertero', XP.siembra);   // 3.1
    const cul = CULTIVOS[s.cultivo];
    sonido.juntar();
    diario.anotar('siembra', cul.nombre);
    nota(`Sembraste ${cul.nombre}`, `En ${cul.dias} días están. Cada día de lluvia las adelanta uno`, true);
    refrescarHuerta();
    guardar();
    return;
  }
  const r = cosechar(h, c.clave, progreso.dia);
  if (!r.ok) { nota(textoCantero(p, progreso.dia), 'Cada día de lluvia las adelanta uno'); return; }
  // 2.3: con una colmena al alcance, las abejas polinizaron: rinde uno más
  const conAbejas = cosechaConAbejas(r.cantidad, { x: c.obra.datos.x, z: c.obra.datos.z }, obrasTerminadas('colmena').map((o) => o.datos));
  const abejas = conAbejas > r.cantidad;
  r.cantidad = conAbejas;
  // 3.1: el oficio de huertero (la fracción que no llega a una se guarda para la próxima)
  const ofHuerta = oficios?.oficios();
  if (ofHuerta) { const x = extraDeCosecha(r.cantidad, nivelDe('huertero'), ofHuerta.resto.cosecha); ofHuerta.resto.cosecha = x.resto; r.cantidad += x.extra; }
  // La primera cosecha de cada cultivo va al cuaderno; lo juntado, a la mochila.
  registrar(ENTRADA_COSECHA[r.cultivo]);
  if (!progreso.entradas[r.ingrediente]) progreso.entradas[r.ingrediente] = { dia: progreso.dia, hora: progreso.horas, cantidad: 0 };
  // 3.5.1: lo cosechado en total, para la historia (sin la cuenta todavía, arranca de lo que hay)
  progreso.cosechasTotal = (progreso.cosechasTotal != null && Number.isFinite(Number(progreso.cosechasTotal)) ? Math.floor(Number(progreso.cosechasTotal))
    : ['haba', 'papa', 'frutilla-huerta'].reduce((s, k) => s + (Number(progreso.entradas[k]?.cantidad) || 0), 0)) + r.cantidad;
  progreso.entradas[r.ingrediente].cantidad = (progreso.entradas[r.ingrediente].cantidad || 0) + r.cantidad;
  sonido.juntar();
  diario.anotar('cosecha', CULTIVOS[r.cultivo].nombre);
  ganarOficio('huertero', XP.cosecha);   // 3.1
  nota(`Cosechaste ${r.cantidad} de ${CULTIVOS[r.cultivo].nombre}`, abejas ? `Una más gracias a las abejas. Llevás ${progreso.entradas[r.ingrediente].cantidad}` : `Llevás ${progreso.entradas[r.ingrediente].cantidad}. Van al fuego o se vuelven a sembrar`, true);
  refrescarHuerta();
  refrescarBarra(true);
  guardar();
}
// La lluvia riega (una vez por día y por cantero) y se avisa cuando algo quedó listo.
function revisarHuerta() {
  const h = huerta();
  if (!Object.keys(h).length) { diaHuerta = progreso.dia; return; }
  let cambio = false;
  if (progreso.dia !== diaHuerta) {
    // 2.4: en invierno hiela (sólo cuando el día cambia jugando, no al cargar)
    const paso = diaHuerta >= 0;
    diaHuerta = progreso.dia; cambio = true;
    if (paso && !desafio && U.uInvierno.value > 0.5) helarLaHuerta(h);
  }
  if ((clima?.estado?.lluvia || 0) > 0.35 && regarConLluvia(h, progreso.dia)) cambio = true;
  if (!cambio) return;
  refrescarHuerta();
  const { listos } = resumenHuerta(h, progreso.dia);
  if (listos > listosVistos) nota('La huerta está para cosechar', listos === 1 ? 'Un cantero listo' : `${listos} canteros listos`);
  listosVistos = listos;
  guardar();
}

// ---------------------------------------------------------------- el gallinero
// Cada gallinero (O → Trabajo) trae cuatro gallinas. Ponen de día; E junta los huevos.
let gallinasMundo = null, gallinerosVistos = -1;
function gallineros() {
  if (!progreso.gallineros || typeof progreso.gallineros !== 'object' || Array.isArray(progreso.gallineros)) progreso.gallineros = sanearGallineros(progreso.gallineros);
  return progreso.gallineros;
}
function gallinerosTerminados() {
  return (obras?.obras || []).filter((o) => o.plano.id === 'gallinero' && o.datos.etapas >= o.plano.etapas.length);
}
function refrescarGallineros() {
  if (!gallinasMundo) return;
  const g = gallineros(), hechos = gallinerosTerminados();
  const vivos = new Set(hechos.map((o) => claveGallinero(o.datos.x, o.datos.z)));
  for (const k of Object.keys(g)) if (!vivos.has(k)) delete g[k];
  // uno recién terminado empieza a poner hoy
  for (const k of vivos) if (!g[k]) g[k] = gallineroNuevo(progreso.dia);
  gallinerosVistos = hechos.length;
  gallinasMundo.sincronizar(hechos.map((o) => ({ x: o.datos.x, z: o.datos.z })));
}
function gallineroCerca() {
  const o = funcionAlAlcance('gallinero', 2.8);
  return o ? { obra: o, clave: claveGallinero(o.datos.x, o.datos.z) } : null;
}
function usarGallinero(c) {
  const g = gallineros()[c.clave];
  if (!g) { refrescarGallineros(); return; }
  const r = juntarHuevos(g, progreso.dia);
  if (!r.ok) { nota('El nidal está vacío', 'Las gallinas ponen de día: mañana va a haber'); return; }
  registrar('gallina');
  registrar('huevo');
  if (!progreso.entradas.huevo) progreso.entradas.huevo = { dia: progreso.dia, hora: progreso.horas, cantidad: 0 };
  progreso.entradas.huevo.cantidad = (progreso.entradas.huevo.cantidad || 0) + r.huevos;
  sonido.juntar();
  diario.anotar('huevos');
  nota(r.huevos === 1 ? 'Juntaste un huevo' : `Juntaste ${r.huevos} huevos`, `Llevás ${progreso.entradas.huevo.cantidad}`, true);
  refrescarBarra(true);
  guardar();
}

// ---------------------------------------------------------------- órdenes a los compañeros
// En el Desafío, mirando a Don Ramón o a Ema, E les cambia la orden (ver desafio-ordenes.js).
function textoOrdenar(npc) {
  const sig = siguienteOrden(npc.clave, desafio.ordenDe(npc.clave));
  return sig ? `${npc.nombre}: ${NOMBRE_ORDEN[sig].toLowerCase()}` : `Hablar con ${npc.nombre}`;
}
function ordenarCompanero(npc) {
  const r = desafio.ordenar(npc.clave);
  if (!r) { hablar(npc); return; }
  sonido.anotar();
  nota(`${npc.nombre}: ${NOMBRE_ORDEN[r.orden].toLowerCase()}`, `“${r.respuesta}”`);
  guardar();
}

// ---------------------------------------------------------------- visitas
// Con una mesa de campo y dos asientos alrededor, cada tres días a la tarde un vecino
// viene caminando, se queda junto a la mesa, charla y deja algo. Sólo en el Relax.
let visitante = null, relojVisitas = 0;
function visitas() {
  if (!progreso.visitas) progreso.visitas = visitasNuevas();
  return progreso.visitas;
}
function mueblesTerminados() {
  return (obras?.obras || []).filter((o) => o.datos.etapas >= o.plano.etapas.length).map((o) => ({ id: o.plano.id, x: o.datos.x, z: o.datos.z }));
}
function traerVisita(clave, puesta, llegando) {
  // 3.6 (vida): también la gente de la aldea (el compadre que viene a tu mesa), aunque no la hayas visto hoy
  const npc = gente?.gente?.find((g) => (g.claveAldea || g.clave) === clave) || aldeaGente?.figura?.(clave) || null;
  if (!npc || npc.enBase || npc.aBordo || npc.deVisita) return false;
  if (charla.npc === npc) return false;   // 3.6.1: charlando con vos en la aldea, no desaparece a mitad de la frase
  visitante = { npc, antes: { ruta: npc.ruta, etapa: npc.etapa, espera: npc.espera, x: npc.pos.x, z: npc.pos.z, velocidad: npc.velocidad, saludo: npc.saludo, despedida: npc.despedida, soloCerca: npc.soloCerca, camino: npc.camino } };
  npc.soloCerca = 0; npc.pose = null; npc.dormido = false; npc.camino = null;   // 3.6 (vida)
  const lugar = lugarEnLaMesa(puesta);
  const desde = llegando ? puntoDeLlegada(puesta.mesa, jugador.estado.pos) : lugar;
  npc.pos.set(desde.x, alturaDePie(T, col, desde.x, desde.z), desde.z);
  npc.ruta = [{ x: lugar.x, z: lugar.z, quieto: 99999, mirar: puesta.mesa }];
  npc.etapa = 0; npc.espera = 0; npc.velocidad = 1.1; npc.deVisita = true;
  npc.saludo = 'Buenas, vecino. ¿Se puede? Vi la mesa puesta.';
  npc.despedida = 'Bueno, me vuelvo antes de que oscurezca. Gracias por la mesa.';
  return true;
}
function devolverVisita() {
  if (!visitante) return;
  const { npc, antes } = visitante;
  Object.assign(npc, { ruta: antes.ruta, etapa: antes.etapa, espera: antes.espera, velocidad: antes.velocidad, saludo: antes.saludo, despedida: antes.despedida, deVisita: false, soloCerca: antes.soloCerca, camino: antes.camino });   // 3.6 (vida): y lo de la aldea
  npc.pos.set(antes.x, alturaDePie(T, col, antes.x, antes.z), antes.z);
  if (charla.npc === npc) cerrarCharla();
  visitante = null;
}
function regaloDeVisita(npc) {
  const v = visitas();
  if (!v.activa || v.activa.charlo) return;
  v.activa.charlo = true;
  // 3.6 (vida): el compadre deja lo suyo (ver vecindad-juego.js)
  if (v.activa.amistad && vecindadJuego) {
    const texto = vecindadJuego.regaloDeCompadre(v.activa.clave);
    diario.anotar('visita', npc.nombre);
    guardar();
    if (texto) setTimeout(() => nota('Te dejaron algo', texto, true), 1200);
    return;
  }
  const def = VISITANTES[npc.clave];
  for (const [k, n] of Object.entries(def.regalo.materiales || {})) sumarMaterial(k, n);
  for (const [k, n] of Object.entries(def.regalo.cuenta || {})) progreso.cosas[k] = (progreso.cosas[k] || 0) + n;
  diario.anotar('visita', npc.nombre);
  refrescarBarra(true);
  guardar();
  setTimeout(() => nota('Te dejaron algo', def.textoRegalo, true), 1200);
}
// 2.3: un fuego prendido cerca de la mesa hace que la visita se quede al fogón
function fogonDeVisita() {
  const f = clima.fogata;
  if (!f.activa || f.vida <= 0) return false;
  const puesta = mesaPuesta(mueblesTerminados());
  return !!puesta && Math.hypot(f.pos.x - puesta.mesa.x, f.pos.z - puesta.mesa.z) <= FOGON.radio;
}
let avisoFogon = -1;
function actualizarVisitas(dt) {
  if (desafio || !gente) return;
  relojVisitas -= dt;
  if (relojVisitas > 0) return;
  relojVisitas = 1;
  const v = visitas(), js = jugador.estado;
  // 2.3: con el fogón prendido se queda hasta tarde, y lo avisa una vez
  const alFuego = v.activa && visitante && v.activa.dia === progreso.dia && seQuedaAlFuego(fogonDeVisita(), progreso.horas);
  if (alFuego && progreso.horas >= VISITA.seVa - 1) {
    visitante.npc.despedida = 'Me voy yendo, que se hizo tarde. Gracias por el fuego.';
    if (avisoFogon !== progreso.dia) {
      avisoFogon = progreso.dia;
      nota(`${visitante.npc.nombre} se queda al fuego`, 'Hablale: de noche, al fogón, se cuentan otras cosas', true);
    }
  }
  if (v.activa && seVa(v, progreso.dia, progreso.horas) && !alFuego) {
    // no se esfuma en tu cara: espera que te alejes, o que ya sea de noche cerrada
    const lejos = !visitante || Math.hypot(visitante.npc.pos.x - js.pos.x, visitante.npc.pos.z - js.pos.z) > 25;
    if (lejos || v.activa.dia !== progreso.dia || progreso.horas >= Math.max(VISITA.seVa + 2, FOGON.seVa) || (progreso.horas >= VISITA.seVa + 2 && !fogonDeVisita())) {
      devolverVisita();
      terminarVisita(v, progreso.dia);
      guardar();
    }
    return;
  }
  if (v.activa && !visitante) {
    // se cargó la partida con una visita en curso: vuelve a la mesa
    const puesta = mesaPuesta(mueblesTerminados());
    if (!puesta || !traerVisita(v.activa.clave, puesta, false)) terminarVisita(v, progreso.dia);
    return;
  }
  // 2.8: sin vecinos (Tu partida) nadie viene a la mesa
  if (visitante || !vecinosActivos(progreso) || !tocaVisita(v, progreso.dia, progreso.horas, true)) return;
  if (vecindadJuego?.cita()) return;   // 3.6 (vida): con alguien invitado a tu mesa, hoy no viene otro
  const puesta = mesaPuesta(mueblesTerminados());
  if (!puesta) return;
  // 3.6 (vida): un compadre que no vino hace días viene en lugar del turno de siempre
  const compadre = vecindadJuego?.visitaDeCompadre();
  if (compadre && traerVisita(compadre.clave, puesta, true)) {
    empezarVisita(v, progreso.dia);
    v.activa.clave = compadre.clave; v.activa.amistad = true;
  } else {
    if (!traerVisita(quienViene(v.cuenta), puesta, true)) { v.cuenta += 1; return; }
    empezarVisita(v, progreso.dia);
  }
  const lejos = Math.hypot(puesta.mesa.x - js.pos.x, puesta.mesa.z - js.pos.z) > 40;
  nota(`${visitante.npc.nombre} vino a visitarte`, lejos ? 'Te espera en tu mesa hasta que caiga la noche' : 'Viene caminando hacia tu mesa', true);
  guardar();
}

// ---------------------------------------------------------------- 3.1: rangos y oficios. 3.6: la aldea
// Lo que hacés seguido lo hacés mejor (ver `oficios.js`). 3.6: la gente de la Aldea de los
// Duendes, sus horarios, los que bajan del tren a quedarse y las obras del pueblo (ver
// `aldea.js` y `aldea-gente.js`); reemplaza al pueblo que fundabas en la 3.1.
let oficios = null, aldeaGente = null;
let vecindadJuego = null;   // 3.6 (vida): ver vecindad-juego.js
// 3.6 (vida): el clima como lo entiende la vecindad (lluvia, nieve, viento, sol)
const climaVecindad = () => { const e = clima?.estado || {}; return { lluvia: e.lluvia || 0, invierno: U.uInvierno.value, viento: e.viento || 0, nublado: e.nublado || 0 }; };
const pronosticoDeManana = () => {
  const manana = pronosticoActual().find((d) => d.cuando === 'Mañana');
  return manana ? `para mañana: ${manana.texto.charAt(0).toLowerCase()}${manana.texto.slice(1)}` : '';
};
const nivelDe = (id) => oficios?.nivel(id) || 0;
const ganarOficio = (id, cuanto) => oficios?.ganar(id, cuanto) || null;
function armarOficiosYAldea(esDesafio) {
  const redibujar = () => { if (modo === 'cuaderno') dibujarCuaderno(); };
  oficios = crearOficiosUI({ progreso: () => progreso, nota: (t, sub, nueva) => nota(t, sub, nueva), sonido, redibujar });
  oficios.acreditar();
  // 3.6: en el Desafío no hay aldea (ni gente, ni obras, ni llegadas)
  if (esDesafio) return;
  aldeaGente = crearAldeaGente({
    progreso: () => progreso, gente: () => gente, tren: () => tren, jugador: () => jugador,
    alturaDePie: (x, z, y) => alturaDePie(T, col, x, z, y),
    nota: (t, sub, nueva) => nota(t, sub, nueva), guardar: () => guardar(), sonido, redibujar,
    registrar: (id) => registrar(id),
    sumarMaterial: (k, n) => sumarMaterial(k, n), sumarEntrada: (k, n) => sumarEntrada(k, n), conMateriales: (fn) => conMateriales(fn), alAportar: (usados, completa, antes) => ganarOficio('obrero', xpDeAporte(usados, completa, antes)),
    refrescarBarra: () => refrescarBarra(true), hablandoCon: () => charla.npc,
    // lo que dan los pobladores y no es de la mochila
    alJugador: (campo, valor) => alJugadorAldea(campo, valor),
    leerCarta: (id) => leerCartaDeLaAldea(id),
    mandarFoto: (id) => mandarFoto(id),
    partitura: (id) => { const m = anotarPartitura(progreso, id); if (m) escucharMuestra(sonido, m.id, 10); },
    pronostico: () => {
      const manana = pronosticoActual().find((d) => d.cuando === 'Mañana');
      return manana ? `para mañana: ${manana.texto.charAt(0).toLowerCase()}${manana.texto.slice(1)}` : '';
    },
    ambiente: () => {
      const e = clima?.estado || {};
      const invierno = U.uInvierno.value;
      return {
        estacion: estacionDe({ invierno, otono: U.uOtono.value }),
        clima: (e.lluvia || 0) > 0.45 ? (invierno > 0.5 ? 'nieve' : 'lluvia') : (e.viento || 0) > 0.7 ? 'viento' : (e.nublado || 0) < 0.35 ? 'sol' : null,
      };
    },
    decir: (texto) => decirCharlaAldea(texto),
    alTerminarCharla: (c) => mecanicasAldea?.alTerminarCharla(c),   // 3.6 (mecánicas): los cuentos del domingo
    // 3.6 (vida): el tiempo libre según el clima, y lo que los vecinos recuerdan de vos
    climaVecindad, alAporteObra: (lote) => vecindadJuego?.hecho('aporte-obra', { lote }),
    // 3.6.1 (vecinos): la altura de la silla donde se sienta un vecino (sobre su piso) y cuánto dura una
    // hora del juego (para salir con tiempo a lo que le toca)
    // (la silla de al lado de la misma mesa o el mismo banco, si la del punto no es de las que usa el jugador:
    // en la casa de té cada mesa tiene dos sillas iguales y una sola es asiento tuyo)
    asientoEn: (x, z, y) => { let m = null, dm = 1.2; for (const s of est?.sentaderos || []) { const d = Math.hypot(s.x - x, s.z - z); if (d < dm && Math.abs(s.y - y) < 1.5 && !s.cama) { dm = d; m = s; } } return m ? Math.max(0, m.y - 0.02 - y) : null; },
    segundosPorHora: () => ((ajustes.duracion === 'reloj' ? 1440 : ajustes.duracion) * 60) / 24,
    alServicio: (k, efectos) => { if ((efectos || []).some((f) => f.k === 'poncho' && (f.n > 0 || f.fijar > 0))) vecindadJuego?.hecho('poncho'); },
  });
  // 3.6 (vida): la vecindad en el juego: el menú de la charla, las invitaciones, la amistad y la memoria
  vecindadJuego = crearVecindadJuego({
    progreso: () => progreso, desafio: () => !!desafio, pronostico: pronosticoDeManana, clima: climaVecindad,
    sumarMaterial: (k, n) => sumarMaterial(k, n), sumarEntrada: (k, n) => sumarEntrada(k, n),
    nota: (t, sub, nueva) => nota(t, sub, nueva), guardar: () => guardar(), refrescarBarra: () => refrescarBarra(true),
    mesa: () => mesaPuesta(mueblesTerminados()), hayVisita: () => !!visitante,
    jugador: () => jugador?.estado?.pos || null, alturaDePie: (x, z, y) => alturaDePie(T, col, x, z, y), aldea: () => aldeaGente,
    // 3.6.1: la figura de un vecino (para retomar una invitación al recargar)
    npcDe: (clave) => gente?.gente?.find((g) => (g.claveAldea || g.clave) === clave && !g.aBordo) || aldeaGente?.figura?.(clave) || null,
    // 3.6.1: el compadre que puede venir a tu mesa (no en el tren, ni de visita, ni charlando con vos)
    puedeVenir: (k) => { const n = gente?.gente?.find((g) => (g.claveAldea || g.clave) === k) || aldeaGente?.figura?.(k); return !!n && !n.enBase && !n.aBordo && !n.deVisita && charla.npc !== n; },
  });
  // 3.6 (mecánicas): lo que se hace en cada lugar de la aldea (ver aldea-mecanicas-mundo.js)
  if (aldeaMundo) mecanicasAldea = crearMecanicasAldea({
    mundo: aldeaMundo, gente: () => aldeaGente, escena, sonido, col, progreso: () => progreso, jugador: () => jugador, tren: () => tren,
    sentaderos: est?.sentaderos, registrar: (id) => registrar(id), nota: (t, sub, nueva) => nota(t, sub, nueva), guardar: () => guardar(),
    leer: (l) => leerEnLaAldea(l), sentarEn: (s) => sentarEnLaAldea(s), alJugador: (campo, valor) => alJugadorAldea(campo, valor),
    abrirCasilla: (p) => abrirCasillaAldea(p), enCasa: (p) => { const r = T.lugares.refugio; return (!!r && Math.hypot(p.x - r.x, p.z - r.z) < 9) || !!obras?.dentro?.(p); },
    duracionDia: () => (ajustes.duracion === 'reloj' ? 1440 : ajustes.duracion),
    ambiente: () => ({ invierno: U.uInvierno.value, lluvia: clima?.estado?.lluvia || 0, viento: clima?.estado?.viento ?? 0.4 }),
  });
}
// 3.6: lo que dan los pobladores (y las mecánicas de la aldea) y no es de la mochila
function alJugadorAldea(campo, valor) {
  const js = jugador.estado;
  if (campo === 'descansado') js.descansado = Math.max(js.descansado || 0, Number(valor) || 0);
  else if (campo === 'entumecido') js.entumecido = Math.max(0, Number(valor) || 0);
}
// 3.6 (mecánicas): una página para leer en la aldea (un libro, la plaquita del duende, el pizarrón,
// el horario, el mapa del valle): el cuadro de la charla, sin nadie. Si el renglón es una entrada
// del cuaderno (un libro, la plaquita), al terminar de leer queda anotada.
function leerEnLaAldea(l) {
  const p = jugador.estado.pos;
  Object.assign(charla, { npc: { clave: 'lectura', nombre: l.quien, oficio: l.que, despedida: l.despedida || 'Listo.', historias: [], pos: { x: p.x, y: p.y, z: p.z } },
    fin: false, encargo: null, enojado: false, historia: { id: l.id || 'lectura-aldea', partes: l.partes }, parte: 0, vec: null, menu: null });
  sonido.juntar?.();
  $('charla').classList.remove('oculto');
  mostrarCharla();
}
// 3.6 (mecánicas): sentarse (o recostarse) en un punto, como con un sentadero
function sentarEnLaAldea(s) {
  const js = jugador.estado;
  js.pos.set(s.x, Math.max(s.y - 0.45, T.altura(s.x, s.z)), s.z);
  if (s.mira !== undefined) { js.yaw = s.mira; js.pitch = -0.05; }
  jugador.sentarse(true);
}
// 3.6 (mecánicas): tu casilla en la estafeta de la aldea: lo mismo que el buzón (y que Ercilia)
function abrirCasillaAldea(p) {
  const hay = porRetirar(correo(), progreso).length > 0;
  if (!hay && !porEnviar(correo()).length) {
    const n = cartasLeidas(progreso);
    nota('Tu casilla está vacía', n ? `Ya leíste ${n} ${n === 1 ? 'carta' : 'cartas'}: están en el cuaderno` : 'Las cartas llegan con el tren');
    return;
  }
  hablar({ clave: 'buzon', nombre: 'Tu casilla', oficio: 'en la estafeta', saludo: 'Abrís tu casilla con la llavecita de bronce.', despedida: 'Cerrás la casilla con llave.', historias: [], pos: { x: p.x, y: p.y, z: p.z } });
}
// 3.6: la carta que te entrega el telegrafista de la aldea, igual que la de Ercilia: queda en
// el cuaderno y, si pide una foto, se avisa cuál
function leerCartaDeLaAldea(id) {
  registrar(id);
  const pide = CARTA[id]?.foto;
  if (pide) { const d = DESAFIOS.find((x) => x.id === pide); if (d) setTimeout(() => nota(`Te piden una foto: ${d.nombre}`, d.pista, true), 1400); }
}
// 3.6: la charla entre vecinos de la aldea que escuchás al pasar: un renglón chico abajo, sin
// pausar nada (no es la charla con E, que tiene su cuadro)
let renglonAldea = null;
function decirCharlaAldea(texto) {
  if (!renglonAldea) {
    if (!texto) return;
    renglonAldea = document.createElement('div');
    renglonAldea.id = 'charla-aldea';
    renglonAldea.setAttribute('aria-live', 'polite');
    renglonAldea.style.cssText = 'position:fixed;left:50%;bottom:22%;transform:translateX(-50%);max-width:min(60ch,86vw);padding:5px 12px;border-radius:6px;'
      + 'background:rgba(24,18,12,0.5);color:#f1e7d6;font:15px/1.35 Spectral,Georgia,serif;text-align:center;pointer-events:none;z-index:6;text-shadow:0 1px 2px #000';
    document.body.appendChild(renglonAldea);
  }
  renglonAldea.textContent = texto ? T_(texto) : '';
  renglonAldea.style.display = texto ? '' : 'none';
}
function actualizarAldea(dt) {
  if (!jugador) return;
  oficios?.remar(jugador.estado);
  if (kayak?.est) kayak.est.brazo = factorRemo(nivelDe('navegante'));
  if (!desafio) aldeaGente?.actualizar(dt);
  if (!desafio) vecindadJuego?.actualizar(dt);   // 3.6 (vida): el día de la vecindad y las invitaciones
}
// Los hachazos que hacen falta: el oficio de hachero y el filo que te dio el herrero
const golpesParaTalarAhora = () => golpesConFilo(golpesParaTalar(GOLPES_TALA, nivelDe('hachero')), progreso?.aldea);
// Lo que sobra de una etapa de obra, según el oficio (va a la mochila), y la experiencia
function conOficioDeObra(r, m) {
  if (!r?.ok || !r.etapa) return r;
  const of = oficios?.oficios();
  if (of) {
    const a = ahorroDeObra(r.etapa.pide, nivelDe('obrero'), of.resto.obra);
    of.resto.obra = a.resto;
    for (const [k, n] of Object.entries(a.devuelve)) m[k] = (m[k] || 0) + n;
    r.sobro = a.devuelve;
  }
  ganarOficio('obrero', xpDeEtapa(r.etapa.pide));
  return r;
}
function avisarSobrante(r) {
  const partes = Object.entries(r?.sobro || {}).map(([k, n]) => `${n} ${MATERIALES[k]?.nombre || k}`);
  if (partes.length) setTimeout(() => nota('Te sobró material', `${partes.join(' · ')}: oficio de constructor`), 700);
}
// Para la historia u otro evento: que el próximo poblador de la aldea venga sin esperar
function llamarAlProximoPoblador() {
  if (desafio || !progreso?.aldea) return false;
  llamarProximo(progreso.aldea);
  guardar();
  return true;
}

// ---------------------------------------------------------------- 2.3: lo que asoma en el lago
// Una noche clara, con luna, después de haber oído las historias del lago: si estás en
// la orilla mirando al agua, muy de vez en cuando asoma un lomo oscuro y se hunde. Se
// decide una vez por noche (ver `cuentos.js`). No hace nada más que eso.
let lomo = null, nocheLomo = -1, lomoMalla = null, lomoAnotado = false;
function mallaDelLomo() {
  if (lomoMalla) return lomoMalla;
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#15191b' });
  // tres jorobas en fila, cada vez más chicas: lo que se ve desde lejos
  for (const [x, r] of [[0, 1.3], [2.4, 1.0], [4.3, 0.7]]) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    m.position.set(x, 0, 0); m.scale.set(1.4, 0.7, 1);
    g.add(m);
  }
  g.visible = false;
  g.name = 'lomo';
  escena.add(g);
  return (lomoMalla = g);
}
function lomoVisible() {
  if (!lomo || !lomoMalla?.visible) return null;
  return alturaLomo(lomo.t) > 0.5 ? lomoMalla.position : null;
}
const esLagoHondo = (x, z) => { const a = T.agua(x, z); return !!a && a.lago && a.prof > 3; };
function actualizarLomo(dt) {
  const noche = progreso.horas >= 21 || progreso.horas < 4;
  const claveNocheLomo = progreso.horas < 4 ? progreso.dia - 1 : progreso.dia;
  if (noche && nocheLomo !== claveNocheLomo) {
    // se decide una sola vez por noche
    nocheLomo = claveNocheLomo;
    const luna = iluminada(faseLunar(progreso.dia, progreso.horas));
    const escucho = !!(progreso.entradas['h-nahuelito'] || progreso.entradas['c-cuero']);
    lomo = nocheDeLomo({ dia: progreso.dia, ultimo: progreso.lomoUltimo ?? -99, luna, lluvia: clima.estado.lluvia, escucho }) ? { t: -1, pos: null } : null;
  }
  if (!noche && lomo) { lomo = null; if (lomoMalla) lomoMalla.visible = false; }
  if (!lomo) return;
  const js = jugador.estado;
  if (lomo.t < 0) {
    // espera a que estés en la orilla mirando al agua
    if (js.enTren || js.nadando) return;
    const dir = Math.atan2(LAGO.x - js.pos.x, LAGO.z - js.pos.z);
    const mira = Math.cos(dir - Math.atan2(-Math.sin(js.yaw), -Math.cos(js.yaw)));
    const orilla = Math.abs(Math.hypot(js.pos.x - LAGO.x, js.pos.z - LAGO.z) - T.radioLago(Math.atan2(js.pos.z - LAGO.z, js.pos.x - LAGO.x)));
    if (orilla > LOMO.orilla || mira < 0.5) return;
    const p = dondeAsoma(js.pos, js.yaw, esLagoHondo);
    if (!p) return;
    lomo.t = 0; lomo.pos = p;
    progreso.lomoUltimo = progreso.dia;
    const m = mallaDelLomo();
    m.position.set(p.x, -2, p.z);
    m.rotation.y = js.yaw + Math.PI / 2;
    m.visible = true;
    sonido.chapoteo?.({ x: p.x, y: 0, z: p.z }, 1);
    lomoAnotado = false;
  }
  lomo.t += dt;
  const a = alturaLomo(lomo.t);
  const nivel = T.agua(lomo.pos.x, lomo.pos.z)?.nivel ?? 0;
  lomoMalla.position.y = nivel - 1.05 + a * 1.2;
  if (a > 0.6 && !lomoAnotado) {
    lomoAnotado = true;
    diario.anotar('lomo');
    registrar('avistaje-lago');
    nota('¿Viste eso?', 'Algo asomó en el lago. Si tenés la cámara (P), es ahora');
  }
  if (lomo.t > duracionLomo()) { lomoMalla.visible = false; lomo = null; guardar(); }
}

// ---------------------------------------------------------------- rastrear con el perro
// Mirándolo y con E, el perro rastrea: va adelante hacia un animal que todavía no
// anotaste (o al más cercano), esperándote si te quedás. Sólo en el Relax.
let rastro = null, olfateoRastro = 0;
const candidatosRastro = [];
function juntarCandidatosRastro() {
  candidatosRastro.length = 0;
  for (const s of sujetosPerro) if (RASTREABLES.includes(s.tipo)) candidatosRastro.push(s);
  for (const s of rastrosFauna) if (RASTREABLES.includes(s.tipo)) candidatosRastro.push(s);
  return candidatosRastro;
}
function puedoPedirRastro() {
  const js = jugador.estado;
  return !desafio && !rastro && !js.enTren && !js.enKayak && !js.montado && !js.nadando && mirandoAlPerro(js, perro.est.pos);
}
function pedirRastro() {
  const js = jugador.estado;
  const presa = elegirPresa(juntarCandidatosRastro(), js.pos, (t) => !!progreso.entradas[t]);
  if (!presa) { nota('El perro olfatea y vuelve', 'No hay rastros frescos por acá. Probá más adentro del bosque o en la estepa'); return; }
  rastro = presa;
  olfateoRastro = 0;
  sonido.ladrido(perro.est.pos);
  registrar('rastreo');
  nota('El perro tomó un rastro', 'Seguilo: te espera si te quedás atrás. E de nuevo mirándolo para dejarlo');
}
function dejarRastro(texto, sub, nueva = false) {
  rastro = null;
  mundoPerro.rastro = null;
  if (texto) nota(texto, sub, nueva);
}
function actualizarRastro(dt) {
  if (!rastro) { mundoPerro.rastro = null; return; }
  const js = jugador.estado;
  if (desafio || js.enTren || js.enKayak) { dejarRastro(); return; }
  rastro.t += dt;
  olfateoRastro -= dt;
  let hay = true;
  if (olfateoRastro <= 0) { olfateoRastro = 1; hay = seguirPresa(rastro, juntarCandidatosRastro()); }
  const e = estadoRastro(rastro, perro.est.pos, hay);
  if (e === 'encontrado') {
    diario.anotar('rastroPerro', nombreRastro(rastro.tipo));
    progreso.rastreos = (progreso.rastreos || 0) + 1;
    ganarOficio('cazador', XP.rastreo);   // 3.1
    dejarRastro('El perro lo encontró', `Es ${nombreRastro(rastro.tipo)}. Acercate despacio`, true);
    return;
  }
  if (e === 'perdido') { dejarRastro('Se perdió el rastro', 'El animal se fue lejos. El perro vuelve con vos'); return; }
  if (e === 'frio') { dejarRastro('El rastro se enfrió', 'Ya no huele a nada. El perro vuelve con vos'); return; }
  mundoPerro.rastro = destinoRastro(perro.est.pos, js.pos, rastro);
  // en la nieve se ven las pisadas que sigue, un poco adelante del perro
  if (!mundoPerro.rastro.esperar) pisadaRastro.pos.set(mundoPerro.rastro.x, 0, mundoPerro.rastro.z);
}
// una pisada falsa que va adelante del perro: la textura de huellas la dibuja como las demás
const pisadaRastro = { tipo: 'zorro', id: 'rastro-perro', pos: new THREE.Vector3(1e9, 0, 1e9), vel: 1 };

// ---------------------------------------------------------------- la feria
// Cada cinco días, de nueve a seis, puestos junto al andén de la Estación del Valle.
// Cuatro cambios del día para lo que producís. Sólo en el Relax.
let enLaFeria = false, puestoFeria = null, feriaAvisada = -1;
function feria() {
  progreso.feria = feriaDeHoy(sanearFeria(progreso.feria), progreso.dia);
  return progreso.feria;
}
function feriaCerca() {
  if (desafio || !puestoFeria || !feriaAbierta(progreso.dia, progreso.horas)) return false;
  const js = jugador.estado;
  return Math.hypot(js.pos.x - puestoFeria.x, js.pos.z - puestoFeria.z) < 3.4;
}
function cuantoFeria(k) {
  if (k === 'lana') return material('lana');
  if (k === 'poncho') return progreso.cosas?.poncho || 0;
  return progreso.entradas?.[k]?.cantidad || 0;
}
function gastarFeria(k, n) {
  if (k === 'lana') progreso.materiales.lana -= n;
  else if (k === 'poncho') progreso.cosas.poncho -= n;
  else progreso.entradas[k].cantidad -= n;
}
function abrirFeria() {
  enLaFeria = true;
  marcarEn('feria', 0);   // 3.6.2
  registrar('feria');
  $('feria').classList.remove('oculto');
  dibujarFeria();
  marcarHud(0, true);
}
function cerrarFeria() {
  enLaFeria = false;
  $('feria').classList.add('oculto');
}
function dibujarFeria() {
  const ul = $('feria-lista');
  ul.innerHTML = '';
  const f = feria();
  ofertasDelDia(progreso.dia, progreso.cosas, feria().tomadas).forEach((o, i) => {
    const li = document.createElement('li');
    const hecho = f.tomadas.includes(o.id), tengo = alcanzaFeria(o, cuantoFeria);
    li.className = hecho ? 'hecho' : tengo ? '' : 'falta';
    const t = textoOferta(o);
    const b = document.createElement('b'); b.textContent = `${i + 1}. ${T_(o.texto)}`;
    const span = document.createElement('span'); span.textContent = ` — ${T_(`da ${t.da} por ${t.pide}`)}`;
    const marca = document.createElement('i'); marca.textContent = T_(hecho ? 'ya cambiado' : tengo ? 'se puede cambiar' : 'falta juntar');
    li.append(b, span, marca);
    alClicHud(li, () => cambiarFeria(i));   // 3.6.2
    ul.appendChild(li);
  });
}
function cambiarFeria(i) {
  marcarEn('feria', i);   // 3.6.2: lo elegido (con el número, el clic o Enter) queda marcado
  const o = ofertasDelDia(progreso.dia, progreso.cosas, feria().tomadas)[i];
  if (!o) return;
  const r = cambiarEnFeria(feria(), o.id, cuantoFeria);
  if (!r.ok) {
    if (r.motivo === 'hecho') nota('Ese ya lo cambiaste', 'Vuelve en la próxima feria');
    else nota('Todavía te falta', textoOferta(o).pide);
    return;
  }
  for (const [k, n] of Object.entries(o.pide)) gastarFeria(k, n);
  for (const [k, n] of Object.entries(o.da.materiales || {})) sumarMaterial(k, n);
  for (const [k, n] of Object.entries(o.da.cuenta || {})) progreso.cosas[k] = (progreso.cosas[k] || 0) + n;
  if (o.da.cosa) progreso.cosas[o.da.cosa] = 1;
  sonido.juntar();
  diario.anotar('feria', o.texto.charAt(0).toLowerCase() + o.texto.slice(1));
  nota('Cambiaste en la feria', textoOferta(o).da, true);
  refrescarBarra(true);
  guardar();
  dibujarFeria();
}
function actualizarFeria() {
  if (desafio) return;
  if (!puestoFeria && tren) { const e = tren.paradas.find((p) => p.nombre === 'Estación del Valle'); if (e) puestoFeria = crearPuestoFeria(T, escena, e); }
  if (!puestoFeria) return;
  const abre = feriaAbierta(progreso.dia, progreso.horas);
  puestoFeria.malla.visible = esDiaDeFeria(progreso.dia) && progreso.horas >= FERIA.abre - 1 && progreso.horas < FERIA.cierra + 1;
  if (abre && feriaAvisada !== progreso.dia) {
    feriaAvisada = progreso.dia;
    nota('Hoy hay feria en la estación', 'Junto al andén de la Estación del Valle, hasta las seis de la tarde');
  }
  if (enLaFeria && (!abre || !feriaCerca())) cerrarFeria();
}

// ---------------------------------------------------------------- 2.9: cargas y cabina
// El puesto de cargas de cada parada (comprar, vender, fletes) y la trochita de
// maquinista. Las reglas en `comercio.js` y `maquinista.js`; el panel y el tablero en
// `comercio-mundo.js`. Sólo en el Relax.
let puestoCargas = null;
function cargas() {
  if (!puestoCargas && tren) {
    puestoCargas = crearPuestoDeCargas({
      panel: $('cargas'), tablero: $('cabina'), tren,
      progreso: () => progreso, dia: () => progreso.dia,
      temporada: () => estacionDe({ invierno: U.uInvierno.value, otono: U.uOtono.value }),
      nota, sonido, guardar, refrescar: () => refrescarBarra(true), T_,
    });
  }
  return puestoCargas;
}
const enLasCargas = () => !!puestoCargas?.abierto();
function puestoDeCargasCerca() {
  if (desafio || !tren || !jugador || jugador.estado.enTren) return null;
  return tren.puestoCerca(jugador.estado.pos);
}
function subirALaCabina() {
  tren.subirACabina(jugador);
  if (enLasCargas()) puestoCargas.cerrar();
  registrar('viaje');
  nota('Subiste a la cabina', 'W abre el regulador, S lo cierra y frena, Espacio silba. Pará en un andén para bajarte', true);
}
function bajarDeLaCabina() {
  if (!tren.bajarDeCabina(jugador)) {
    nota(tren.est.vel > 0 ? 'El tren está andando' : 'No hay andén acá', 'Frená con S adentro de un andén para bajarte');
    return false;
  }
  if (enLasCargas()) puestoCargas.cerrar();
  nota('Bajaste de la cabina', 'La trochita sigue sola hasta la próxima');
  guardar();
  return true;
}
// Cada cuadro, después de mover el tren: la llegada a un andén manejando (entrega los
// fletes), el tablero de la cabina y el panel que se cierra si te alejás.
function actualizarCabina(dt) {
  const c = cargas();
  if (!c || !estadoTren || !jugador) return;
  if (estadoTren.conduce && estadoTren.llegada) {
    const aqui = estadoTren.llegada;
    if (!c.llegar(aqui).length) nota(`¡${aqui.nombre}!`, 'Paraste en el andén · E para bajar, C para las cargas');
  }
  c.tablero(estadoTren, dt);
  c.vigilar(jugador.estado.pos);
}

// ---------------------------------------------------------------- el telar
// E en el telar teje lo que toca: la manta si no la tenés, si no un poncho para la feria.
// La lana sale de la mochila y del acopio si está cerca, como al construir.
function telarCerca() { return !!funcionAlAlcance('tejer', 2.6); }
function lanaAMano() { return materialesVisibles().lana || 0; }
function tejer() {
  const id = queTejer(lanaAMano(), progreso.cosas);
  if (!id) { nota('No alcanza la lana', `Hacen falta ${TEJIDOS.poncho.lana} vellones para un poncho. La majada está en el galpón`); return; }
  const t = TEJIDOS[id];
  conMateriales((m) => { m.lana -= t.lana; });
  if (id === 'manta') progreso.cosas.manta = 1;
  else { progreso.cosas.poncho = (progreso.cosas.poncho || 0) + 1; registrar('poncho'); }
  sonido.juntar();
  diario.anotar('tejido', id === 'manta' ? 'una manta' : 'un poncho');
  nota(id === 'manta' ? 'Tejiste una manta' : 'Tejiste un poncho',
    id === 'manta' ? 'Ahora podés dormir en cualquier lado, sin fuego (T)' : `Llevás ${progreso.cosas.poncho}. En la feria de la estación los cambian bien`, true);
  refrescarBarra(true);
  guardar();
}

// ---------------------------------------------------------------- la majada
// Las ovejas de Don Ramón en el corral grande del galpón. Con la tijera del almacén se
// esquilan (E) cuando tienen el vellón entero; la lana es un material más.
let majadaMundo = null, diaMajada = -1, ovejaCercana = null;
function majada() {
  if (!progreso.majada || !Array.isArray(progreso.majada.esquilada)) progreso.majada = sanearMajada(progreso.majada);
  return progreso.majada;
}
// 2.4: la oveja es del galpón o de tu corral (ver corral.js)
const majadaDe = (o) => (o?.propia && progreso.corral ? progreso.corral : majada());
function esquilarOveja(o) {
  const r = esquilar(majadaDe(o), o.i, progreso.dia, !!progreso.cosas.tijera);
  if (!r.ok) {
    if (r.motivo === 'tijera') nota('Hace falta una tijera de esquilar', 'Ercilia la cambia en el almacén');
    else if (r.motivo === 'corta') nota('Todavía está corta', r.faltan === 1 ? 'En un día tiene el vellón entero' : `En ${r.faltan} días tiene el vellón entero`);
    return;
  }
  sumarMaterial('lana', r.vellones);
  registrar('vellon');
  if (o.propia) corralMundo?.refrescarLana(progreso.corral, progreso.dia);
  else majadaMundo.refrescarLana(majada(), progreso.dia);
  sonido.juntar();
  diario.anotar('esquila');
  const { conLana } = resumenMajada(majadaDe(o), progreso.dia);
  nota(`+${r.vellones} vellones de lana`, conLana ? `Llevás ${material('lana')}. Quedan ${conLana} con el vellón entero` : `Llevás ${material('lana')}. Esquilaste la majada entera`, true);
  refrescarBarra(true);
  guardar();
}
function actualizarMajada(dt) {
  if (!majadaMundo) return;
  const js = jugador.estado;
  // En el Desafío, de noche, la majada está encerrada en el galpón.
  const ocultas = !!desafio && (progreso.horas >= 20.5 || progreso.horas < 6);
  majadaMundo.actualizar(dt, js, perro?.est?.pos || null, ocultas);
  if (progreso.dia !== diaMajada) { diaMajada = progreso.dia; majadaMundo.refrescarLana(majada(), progreso.dia); corralMundo?.refrescarLana(progreso.corral, progreso.dia); }
  // 2.4: las dos ovejas de tu corral
  if (corralMundo) corralMundo.actualizar(dt, js, perro?.est?.pos || null, false);
  ovejaCercana = js.enTren || js.enKayak ? null : corralMundo?.ovejaCerca(js.pos) || majadaMundo.ovejaCerca(js.pos);
  if (!progreso.entradas.oveja && majadaMundo.cerca(js.pos, 16)) registrar('oveja');
}

// ---------------------------------------------------------------- el correo
// La trochita para en la estación del almacén aunque estés lejos; si hay carta, llega,
// y Ercilia la guarda en el almacén. Como mucho una por día. 3.6: en el Relax Ercilia y su
// almacén se mudaron a la Aldea de los Duendes, así que el correo baja en la parada de la
// aldea (sin aldea, como siempre, en la Estación del Valle).
function correo() {
  if (!progreso.correo || typeof progreso.correo.llegadas !== 'object') progreso.correo = sanearCorreo(progreso.correo);
  return progreso.correo;
}
let trenEnEstacion = false;
// `estado` es el del tren; se puede pasar otro para probar sin esperar la vuelta entera.
function revisarCorreo(estado = estadoTren) {
  const parado = !!estado?.parado && !!tren?.paradas;
  if (!parado) { trenEnEstacion = false; return; }
  if (trenEnEstacion) return;
  const pos = estado.pos;
  const aqui = tren.paradas.find((p) => Math.hypot(p.anden.x - pos.x, p.anden.z - pos.z) < 30);
  const delCorreo = tren.paradas.find((p) => p.aldea) || tren.paradas.find((p) => p.nombre === 'Estación del Valle');
  if (!aqui || aqui !== delCorreo) return;
  trenEnEstacion = true;
  const c = repartir(correo(), progreso, progreso.dia);
  if (!c) return;
  if (obrasTerminadas('buzon').length) nota('Llegó carta con el tren', `De ${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}. Te la dejaron en el buzón`, true);
  else nota('Llegó carta con el tren', `De ${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}. La tiene Ercilia en el almacén`, true);
  guardar();
}

// ---------------------------------------------------------------- tormentas y crecidas
// La lluvia fuerte hace crecer el arroyo (y lo enturbia); en tormenta, una vez por día
// como mucho, un rayo parte un árbol a la vista y lo deja tirado para hacer leña.
let agua = null, horasTormenta = null, turbiaAvisada = false;
function tormenta() {
  if (!progreso.tormenta || typeof progreso.tormenta !== 'object') progreso.tormenta = sanearTormenta(progreso.tormenta, veg.arboles.length);
  return progreso.tormenta;
}
function revisarTormenta(dt) {
  const st = tormenta();
  const dh = horasTormenta === null ? 0 : horasEntre(horasTormenta, progreso.horas);
  horasTormenta = progreso.horas;
  // si el reloj saltó (dormir), la crecida se resuelve de una: dormir no la frena
  st.crecida = avanzarCrecida(st.crecida, clima.estado.lluvia, Math.min(dh, 12));
  if (agua?.arroyo) agua.arroyo.position.y = nivelArroyo(st.crecida);
  const turbia = aguaTurbia(st.crecida);
  if (turbia && !turbiaAvisada) {
    turbiaAvisada = true;
    nota('El arroyo viene crecido', 'Con el agua turbia no pica nada en el arroyo. En el lago, en cambio, comen', true);
    diario.anotar('crecida');
  } else if (!turbia && turbiaAvisada && st.crecida < 0.2) turbiaAvisada = false;
  if (!puedeCaerRayo({ tormenta: clima.estado.tormenta, dia: progreso.dia, diaRayo: st.diaRayo, rayoPendiente: !!st.rayo })) return;
  if (Math.random() > dt * RAYO.chancePorSegundo) return;
  caerRayo();
}
// `i` se puede forzar para probar; si no, elige el juego.
function caerRayo(i = null) {
  const st = tormenta(), js = jugador.estado;
  // Uno por vez: si hay uno tirado sin hachar, no cae otro. La guarda va acá y no sólo
  // en revisarTormenta, porque un segundo rayo pisaba el registro del primero y ese
  // árbol volvía a estar parado al recargar.
  if (st.rayo) return false;
  const indice = i ?? elegirArbolRayo(veg.arboles, js.pos);
  const a = indice === null ? null : veg.arboles[indice];
  if (!a) return false;
  // cae para el lado contrario al tuyo
  const d = Math.hypot(a.x - js.pos.x, a.z - js.pos.z) || 1;
  const dir = { x: (a.x - js.pos.x) / d, z: (a.z - js.pos.z) / d };
  if (!veg.derribarPorRayo(a, dir)) return false;
  st.rayo = { i: indice, dia: progreso.dia, dx: dir.x, dz: dir.z };
  st.diaRayo = progreso.dia;
  sonido.trueno?.(0.08);
  sonido.arbolCae?.({ x: a.x, y: (a.y ?? js.pos.y) + 1.2, z: a.z });
  const especie = { coihue: 'coihue', lenga: 'lenga', cipres: 'ciprés', arrayan: 'arrayán', nire: 'ñire' }[a.especie] || 'árbol';
  registrar('rayo');
  diario.anotar('rayo', especie);
  nota(`Un rayo partió un ${especie} ${rumboDesde(js.pos, a)}`, 'Quedó tirado: con el hacha se hace leña (H)', true);
  guardar();
  return true;
}

// ---------------------------------------------------------------- el caballo
// El zaino de Don Ramón: te lo presta con su encargo. E para subir y para bajar;
// arriba, W al trote y Shift al galope. Queda donde lo dejás. Sólo en el Relax.
let caballoMundo = null;
function caballo() {
  if (!progreso.caballo || typeof progreso.caballo !== 'object') progreso.caballo = sanearCaballo(progreso.caballo);
  return progreso.caballo;
}
function tieneCaballo() { return !desafio && !!caballoMundo && !!progreso.cosas?.caballo; }
function dondeEstaElCaballo() {
  const js = jugador.estado;
  if (js.montado) return { x: js.pos.x, z: js.pos.z, yaw: yawCaballo(js.yaw) };
  return dondeEspera(caballo(), T.lugares.refugio);
}
function caballoCerca() {
  if (!tieneCaballo()) return false;
  const js = jugador.estado;
  if (js.montado || js.enTren || js.enKayak || js.nadando) return false;
  const d = dondeEstaElCaballo();
  return Math.hypot(d.x - js.pos.x, d.z - js.pos.z) < RADIO_MONTAR;
}
function montar() {
  const js = jugador.estado, d = dondeEstaElCaballo();
  js.pos.x = d.x; js.pos.z = d.z;
  js.yaw = d.yaw - Math.PI;
  js.agachado = false; js.sentado = false;
  js.montado = { ...MARCHA_CABALLO, alto: ALTURA_MONTADO, aguaMax: AGUA_QUE_NO_PISA };
  registrar('caballo');
  diario.anotar('caballo');
  sonido.casco?.('tierra', 1);
  nota('Subiste al zaino', 'W al trote, con Shift al galope. E para bajarte');
}
function desmontar() {
  const js = jugador.estado, c = caballo();
  c.x = js.pos.x; c.z = js.pos.z; c.yaw = yawCaballo(js.yaw);
  js.montado = null;
  // se baja por la izquierda, como se baja de un caballo
  js.pos.x -= Math.cos(js.yaw) * 1.1; js.pos.z += Math.sin(js.yaw) * 1.1;
  nota('Bajaste del zaino', 'Queda acá. Volvé a subir con E');
  guardar();
}
const CABALLO_AUSENTE = Object.freeze({ x: 0, z: 0, yaw: 0 });   // 2.6.1: sin objeto nuevo por cuadro
function actualizarCaballo(dt) {
  if (!caballoMundo) return;
  const js = jugador.estado;
  if (!tieneCaballo()) { if (js.montado) js.montado = null; caballoMundo.actualizar(dt, CABALLO_AUSENTE, 0, false, false); return; }
  const d = dondeEstaElCaballo();
  // montado, el caballo va donde vas: se anota para que al recargar esté donde lo dejaste
  if (js.montado) { const c = caballo(); c.x = d.x; c.z = d.z; c.yaw = d.yaw; }
  const cerca = js.montado || Math.hypot(d.x - js.pos.x, d.z - js.pos.z) < 170;
  caballoMundo.actualizar(dt, d, js.velocidadActual, !!js.montado, cerca);
  if (js.montado?.plantado) { js.montado.plantado = 0; nota('El zaino no entra al agua honda', 'Buscá un vado o bajate y seguí nadando'); }
}

// ---------------------------------------------------------------- el bosque vuelve
// Cada árbol talado queda anotado (índice y día). Con los días el tocón rebrota solo,
// hasta que vuelve a ser el mismo árbol de antes; plantar un renoval al lado lo apura.
let diaRebrote = -1;
function talados() {
  if (!Array.isArray(progreso.talados)) progreso.talados = sanearTalados(progreso.talados, veg.arboles.length);
  return progreso.talados;
}
function anotarTalado(arbol) {
  const i = veg.arboles.indexOf(arbol);
  if (i < 0) return;
  talados().push({ i, dia: progreso.dia, esc: 0, apurado: false });
  progreso.taladosTotal = Math.max(Math.floor(Number(progreso.taladosTotal)) || 0, talados().length - 1) + 1;   // 3.5.1: los tocones rebrotan; esto no baja
  diaRebrote = progreso.dia;
  vecindadJuego?.hecho('talar');   // 3.6 (vida): si talás mucho en un día, se comenta
}
// Aplica la etapa que le toca a cada tocón. Al cargar la partida hay que forzarlo,
// porque el mundo se genera siempre con todos los árboles en pie.
function revisarRebrote(forzar = false) {
  const lista = talados();
  if (!forzar && (progreso.dia === diaRebrote || !lista.length)) return;
  diaRebrote = progreso.dia;
  if (forzar) for (const t of lista) t.esc = -1;
  const { cambios, adultos, quedan } = avanzarRebrote(lista, progreso.dia);
  for (const c of cambios) { const a = veg.arboles[c.i]; if (a) veg.crecer(a, c.esc); }
  if (adultos.length) {
    progreso.talados = quedan;
    if (!forzar) nota(adultos.length === 1 ? 'Un árbol volvió a levantar' : `${adultos.length} árboles volvieron a levantar`, 'El bosque se recupera solo si le das tiempo');
  }
  if (cambios.length) guardar();
}

// Aserrar: a mano con el hacha, en cualquier lado, un tronco da dos tablas; en el banco
// de carpintero propio o en el galpón de esquila, cuatro.
const TABLAS_A_MANO = 2, TABLAS_BANCO = 4;
function enBancoAserrar() {
  const g = T.lugares.galpon;
  const cercaGalpon = !!g && Math.hypot(jugador.estado.pos.x - g.x, jugador.estado.pos.z - g.z) < 9;
  const tallerPropio = obras?.tieneFuncionCerca('aserrar', jugador.estado.pos, 5.2);
  return cercaGalpon || !!tallerPropio;
}
function puedeAserrar() {
  return tieneHacha() && material('tronco') > 0;
}
function aserrar() {
  if (!puedeAserrar()) return;
  const banco = enBancoAserrar();
  const cuanto = banco ? TABLAS_BANCO : tablasAMano(TABLAS_A_MANO, nivelDe('hachero'));   // 3.1
  progreso.materiales.tronco -= 1;
  sumarMaterial('tabla', cuanto);
  sonido.paso('madera', 0.9);
  nota(banco ? 'Un tronco, cuatro tablas' : `Aserrado a mano: un tronco, ${cuanto === 3 ? 'tres' : 'dos'} tablas`, banco ? `Llevás ${material('tabla')} tablas` : `Llevás ${material('tabla')} tablas. En un banco de carpintero rinde el doble`);
  registrar('tabla-mat');
  ganarOficio('hachero', XP.aserrar);
  guardar();
}

// ------- el modo obra: elegir plano, marcar el lugar, levantar por etapas
function planosDeCategoria(clave = categoriaObra) {
  const lista = PLANOS_JUEGO.filter((p) => p.categoria === clave && !p.soloMejora && (!p.requierePlano || progreso.desafio?.planos?.includes(p.requierePlano)));
  return lista.length ? lista : PLANOS_JUEGO;
}
function totalPaginasObra(clave = categoriaObra) {
  return Math.max(1, Math.ceil(planosDeCategoria(clave).length / PLANOS_POR_PAGINA));
}
function planosPaginaObra() {
  const lista = planosDeCategoria();
  const total = Math.max(1, Math.ceil(lista.length / PLANOS_POR_PAGINA));
  paginaObra = Math.max(0, Math.min(paginaObra, total - 1));
  return lista.slice(paginaObra * PLANOS_POR_PAGINA, (paginaObra + 1) * PLANOS_POR_PAGINA);
}
function cambiarPaginaObra(direccion = 1) {
  const total = totalPaginasObra();
  if (total <= 1) return;
  paginaObra = (paginaObra + Math.sign(direccion || 1) + total) % total;
  const primero = planosPaginaObra()[0];
  if (primero) obras.elegir(primero);
  ultimoSitioObra = '';
  dibujarPanelObra();
}
function cambiarCategoriaObra(direccion = 1) {
  const i = Math.max(0, CATEGORIAS_CONSTRUCCION.findIndex((c) => c.clave === categoriaObra));
  const n = CATEGORIAS_CONSTRUCCION.length;
  categoriaObra = CATEGORIAS_CONSTRUCCION[(i + Math.sign(direccion || 1) + n) % n].clave;
  paginaObra = 0;
  const primero = planosPaginaObra()[0];
  if (primero) obras.elegir(primero);
  ultimoSitioObra = '';
  dibujarPanelObra();
}
function abrirObra(abrir) {
  modoObra = abrir;
  $('obra').classList.toggle('oculto', !abrir);
  if (abrir) {
    desafio?.cambioDeArma?.();   // 3.5.1: como con la mochila: la ráfaga de la ballesta y la cuerda no siguen en los planos
    paginaObra = 0;
    const primero = planosPaginaObra()[0] || PLANOS_JUEGO[0];
    obras.elegir(primero);
    ultimoSitioObra = '';
    dibujarPanelObra();
  } else {
    obras.elegir(null);
    ultimoSitioObra = '';
  }
}
function elegirPlano(i) {
  const p = planosPaginaObra()[i];
  if (!p) return;
  obras.elegir(p);
  ultimoSitioObra = '';
  dibujarPanelObra();
}
function costoPlano(p) {
  const total = {};
  for (const e of p.etapas) for (const [k,n] of Object.entries(e.pide)) total[k] = (total[k] || 0) + n;
  return Object.entries(total).map(([k,n]) => `${n} ${MATERIALES[k].nombre}`).join(' · ');
}
let ultimoEstadoModuloObra = -1e9;
const posEstadoModuloObra = new THREE.Vector3(1e9, 0, 1e9);
function actualizarEstadoModuloObra(forzar = false) {
  const el = $('obra-modulo');
  if (!el || !obras || !modoObra) return;
  const ahora = performance.now();
  const jp = jugador.estado.pos;
  const movio = Math.hypot(jp.x - posEstadoModuloObra.x, jp.z - posEstadoModuloObra.z) > 0.45 || Math.abs(jp.y - posEstadoModuloObra.y) > 0.4;
  if (!forzar && !movio && ahora - ultimoEstadoModuloObra < 140) return;
  ultimoEstadoModuloObra = ahora; posEstadoModuloObra.copy(jp);
  const fuego = clima?.fogata?.activa && clima.fogata.vida > 0 ? clima.fogata.pos : null;
  const estado = obras.estadoHabitat?.(jugador.estado.pos, { fuego, lluvia: clima?.estado?.lluvia || 0, viento: clima?.estado?.viento || 0 }) ||
    obras.estadoModuloCerca?.(jugador.estado.pos, 5.8);
  el.classList.toggle('habitable', !!estado?.habitable);
  el.classList.toggle('protegido', !!estado?.protegido && !estado?.habitable);
  if (!estado) { el.textContent = 'Módulo cercano · acercate a un piso modular para inspeccionarlo'; return; }
  const techo = estado.cubierta ? estado.cubierta.nombre : 'sin cubierta';
  const cierre = `${estado.paredes}/4 lados cerrados`;
  const aberturas = `${estado.accesos} acceso${estado.accesos === 1 ? '' : 's'} · ${estado.ventanas} ventana${estado.ventanas === 1 ? '' : 's'}`;
  const red = (estado.ambientesConectados || 0) > 1 ? ` · ${estado.ambientesConectados} ambientes conectados` : '';
  const habitat = Number.isFinite(estado.confort) ? ` · confort ${estado.confort}/10 · protección ${estado.calidad}%${red}${estado.cama ? ' · catre' : ''}${estado.calorActivo ? (estado.calorPropagado ? ' · calor desde otro ambiente' : ' · calor activo') : estado.fuenteCalor ? ' · fuente de calor' : ''}${estado.luz ? (estado.luzPropagada >= 0.48 && !estado.luzLocal ? ' · luz compartida' : ' · luz interior') : ''}` : '';
  el.textContent = `Módulo cercano · ${estado.etiqueta} · ${cierre} · ${aberturas} · ${techo}${habitat}`;
}
function actualizarEstadoSitioObra(r) {
  if (!modoObra || !$('obra-sitio')) return;
  actualizarEstadoModuloObra();
  const rot = (((obras.rotacion || 0) * 180 / Math.PI) % 360 + 360) % 360;
  const snap = obras.snapActivo ? (r?.snap ? ` · SNAP ${r.snap.descripcion}` : ' · snap activo') : ' · snap libre';
  const edit = obras.editando ? ' · MOVIENDO PIEZA' : '';
  const texto = r?.ok ? `✓ Lugar válido · orientación ${Math.round(rot)}°${snap}${edit}` : `✕ ${r?.motivo || 'Buscando lugar'} · orientación ${Math.round(rot)}°${snap}${edit}`;
  if (texto === ultimoSitioObra) return;
  ultimoSitioObra = texto;
  $('obra-sitio').textContent = texto;
  $('obra-sitio').classList.toggle('malo', !r?.ok);
  $('obra-sitio').classList.toggle('bueno', !!r?.ok);
}
function dibujarPanelObra() {
  const p = obras.plano;
  if (!p) return;
  $('obra-nombre').textContent = p.nombre;

  const cats = $('obra-categorias');
  cats.innerHTML = '';
  for (const cat of CATEGORIAS_CONSTRUCCION) {
    const b = document.createElement('button');
    b.textContent = cat.nombre;
    b.className = cat.clave === categoriaObra ? 'elegido' : '';
    b.addEventListener('mousedown', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      categoriaObra = cat.clave;
      paginaObra = 0;
      const primero = planosPaginaObra()[0];
      if (primero) obras.elegir(primero);
      ultimoSitioObra = '';
      dibujarPanelObra();
    });
    cats.appendChild(b);
  }

  const planos = $('obra-planos');
  planos.innerHTML = '';
  const listaCategoria = planosDeCategoria();
  const totalPaginas = totalPaginasObra();
  planosPaginaObra().forEach((pl, i) => {
    const b2 = document.createElement('button');
    const funcional = (pl.funciones || []).length ? ' ◆' : '';
    const interactiva = pl.interactiva ? ' ◇' : '';
    b2.textContent = `${i + 1}. ${pl.nombre}${funcional}${interactiva}`;
    b2.className = pl.id === p.id ? 'elegido' : '';
    b2.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); elegirPlano(i); });
    planos.appendChild(b2);
  });
  if (totalPaginas > 1) {
    const prev = document.createElement('button');
    prev.textContent = '‹'; prev.title = 'Página anterior ([)';
    prev.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); cambiarPaginaObra(-1); });
    const pagina = document.createElement('span');
    pagina.className = 'pagina'; pagina.textContent = `${paginaObra + 1}/${totalPaginas} · ${listaCategoria.length} planos`;
    const next = document.createElement('button');
    next.textContent = '›'; next.title = 'Página siguiente (])';
    next.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); cambiarPaginaObra(1); });
    planos.append(prev, pagina, next);
  }
  $('obra-texto').textContent = p.texto;

  const ul = $('obra-etapas');
  ul.innerHTML = '';
  const obra = p.pieza ? piezaAMedias(p, jugador.estado.pos, 12) : obras.obraCerca(jugador.estado.pos, 12, p.id);
  const hechas = obra ? obra.datos.etapas : 0;
  p.etapas.forEach((e, i) => {
    const li = document.createElement('li');
    const falta = faltan(e.pide, materialesVisibles());
    li.className = i < hechas ? 'hecha' : i === hechas && !falta.length ? 'lista' : '';
    const pide = Object.entries(e.pide).map(([k, n]) => `${n} ${MATERIALES[k].nombre}`).join(', ');
    const b = document.createElement('b');
    b.textContent = `${i + 1}. ${e.nombre}`;
    const sp = document.createElement('span');
    sp.textContent = ` — ${pide}`;
    const marca = document.createElement('i');
    marca.textContent = i < hechas ? 'hecha' : falta.length ? `faltan ${falta.join(' y ')}` : 'se puede';
    li.append(b, sp, marca);
    ul.appendChild(li);
  });

  const pct = p.pieza ? 0 : Math.round((hechas / p.etapas.length) * 100);
  $('obra-progreso').style.setProperty('--avance', `${pct}%`);
  $('obra-progreso').textContent = p.pieza ? 'Se construye de una vez' : obra ? `${hechas}/${p.etapas.length} etapas · ${pct}%` : 'Todavía no fundado';
  $('obra-costo').textContent = `Costo total · ${costoPlano(p)}`;
  const m = progreso.materiales || {};
  const enAcopio = hayAcopioCerca(RADIO_ACOPIO_OBRA) ? acopio() : null;
  $('obra-materiales').textContent = `Llevás ${m.tronco || 0} troncos · ${m.tabla || 0} tablas · ${m.piedra || 0} piedras`
    + (enAcopio ? ` · en el acopio ${enAcopio.tronco || 0}/${enAcopio.tabla || 0}/${enAcopio.piedra || 0}` : '');
  actualizarEstadoModuloObra(true);
  actualizarEstadoSitioObra(obras.estadoSitio);
}
// Al terminar, le ponés el nombre que quieras: queda en el mapa y en la brújula
// 3.5.1: antes era window.prompt, que Electron no tiene: tiraba "prompt() is not supported" y la
// obra se quedaba sin nombre. Ahora es un cuadro del juego (dialogo.js).
async function pedirNombre(obra) {
  const puesto = await dialogos.pedirTexto('¿Cómo le vas a poner?', obra.datos.nombre || obra.plano.nombre, { max: 28 });
  if (puesto === null || reiniciandoPartida || !obras.obras.includes(obra)) return;
  const nombre = puesto.trim().slice(0, 28);
  obra.datos.nombre = nombre || obra.plano.nombre;
  T.lugares[`obra-${obra.datos.x | 0}-${obra.datos.z | 0}`] = {
    x: obra.datos.x, z: obra.datos.z, y: T.altura(obra.datos.x, obra.datos.z), nombre: obra.datos.nombre, propia: true,
  };
  progreso.obras = obras.obras.map((o) => o.datos);
  guardar();
  nota(obra.datos.nombre, 'Quedó marcado en el mapa', true);
}

// 3.5.1: lo que se guarda por el lugar de la obra se muda con ella. Antes, mover un gallinero
// (Shift+Y) dejaba los huevos del día en el lugar viejo y en el nuevo aparecían cuatro más, sin
// fin; y mover un cantero perdía lo sembrado.
function mudarDatosDeObra(o, x0, z0) {
  const x1 = o.datos.x, z1 = o.datos.z;
  const tabla = o.plano.id === 'cantero' ? huerta() : o.plano.id === 'gallinero' ? gallineros() : null;
  if (tabla) {
    const a = claveCantero(x0, z0), b = claveCantero(x1, z1);   // la misma clave que claveGallinero
    if (a !== b && Object.hasOwn(tabla, a)) { tabla[b] = tabla[a]; delete tabla[a]; }
  }
  // (3.6: ya no hay pobladores que vivan en tus casas: viven en la Aldea de los Duendes)
}
// ---------------------------------------------------------------- 3.6.2: lo tuyo que quedó en la aldea
// En una partida de antes de la 3.6, las obras, los renovales y la carpa que tenías cerca de la parada sur
// quedan encimados sobre las calles o adentro de los edificios de la Aldea de los Duendes. Al cargar (sólo en el
// Relax: T.sinObras) cada cosa se muda al lugar libre más cercano fuera de la aldea, con sus datos (lo sembrado,
// los huevos, la miel); una casa de piezas se muda entera. Si no hay lugar, se desarma y se devuelve todo lo
// que costó (las obras, sus materiales y lo que tenían adentro; los renovales, su plantín). Una sola nota.
// Las reglas, en aldea-desalojo.js.
let desalojo = null, avisoDesalojo = null;
// hacia dónde queda "afuera" desde un punto (para probar primero de ese lado)
function rumboAfueraDeLaAldea(x, z) {
  const c = edificioEnMundo('plaza');
  return c ? Math.atan2(x - c.x, z - c.z) : 0;
}
function desalojarRenovales(lista) {
  if (typeof T.sinObras !== 'function' || !Array.isArray(lista)) { renovales.sincronizar(lista); return lista; }
  const quedan = [], adentro = [];
  for (const d of lista) (d && Number.isFinite(d.x) && Number.isFinite(d.z) && T.sinObras(d.x, d.z, 1) ? adentro : quedan).push(d);
  renovales.sincronizar(quedan);
  for (const d of adentro) {
    const l = buscarLugar((dx, dz) => renovales.sitioBueno(d.x + dx, d.z + dz, veg).ok, { haciaAfuera: rumboAfueraDeLaAldea(d.x, d.z) });
    if (l) { d.x += l.dx; d.z += l.dz; renovales.sincronizar([d]); quedan.push(d); desalojo.renovales.mudados++; continue; }
    // (sin la fanfarria de sumarEntrada: es la carga)
    const id = devolucionDeRenoval(d.especie);
    const e = progreso.entradas[id] || (progreso.entradas[id] = { dia: progreso.dia, hora: progreso.horas, cantidad: 0 });
    e.cantidad = (Number(e.cantidad) || 0) + 1;
    desalojo.renovales.devueltos++;
  }
  return quedan;
}
function desalojarObras(lista) {
  // las que se arman (como en obras.sincronizar: un dato roto o un plano de otra versión siguen su camino)
  const validos = [], otros = [];
  for (const d of lista) {
    const ok = d && typeof d === 'object' && Number.isFinite(d.x) && Number.isFinite(d.z) && Object.hasOwn(PLANO, d.plano) && !(PLANO[d.plano].pieza && !(Number(d.etapas) > 0));
    (ok ? validos : otros).push(d);
  }
  if (typeof T.sinObras !== 'function') { obras.sincronizar(lista); return; }
  const radio = (d) => PLANO[d.plano].radio || 1;
  const grupos = gruposDeObras(validos, radio, (d) => !!T.sinObras(d.x, d.z, radio(d)));
  const enGrupo = new Set(grupos.flat());
  obras.sincronizar([...otros, ...validos.filter((_, i) => !enGrupo.has(i))]);
  for (const g of grupos) {
    const ds = g.map((i) => validos[i]);
    // las que apoyan en el suelo se revisan como si las pusieras vos (agua, pendiente, la vía, el sendero, los
    // árboles, tus otras obras); las de arriba (paredes, techos, entrepisos) van con ellas
    const yDe = (d) => (Number.isFinite(d.y) ? d.y : T.altura(d.x, d.z));
    const y0 = Math.min(...ds.map(yDe));
    const suelo = ds.filter((d) => { const p = PLANO[d.plano]; return !p.requierePlataforma && !p.requiereSoporteVertical && !p.requiereHuecoEscalera && yDe(d) - y0 < 0.35; });
    const ancla = suelo.reduce((a, d) => (yDe(d) < yDe(a) ? d : a), suelo[0] || ds[0]);
    let base = null;
    const libre = (dx, dz) => {
      for (const d of ds) if (T.sinObras(d.x + dx, d.z + dz, radio(d))) return false;
      base = null;
      for (const d of suelo) {
        const r = obras.revisarSitio(d.x + dx, d.z + dz, PLANO[d.plano], Number.isFinite(d.rot) ? d.rot : 0);
        if (!r.ok) return false;
        if (d === ancla) base = r.base;
      }
      if (!suelo.length) {   // (nada en el suelo: al menos seco y no muy empinado)
        const x = ancla.x + dx, z = ancla.z + dz;
        if (T.agua(x, z) || Math.acos(clamp(T.normal(x, z).y, -1, 1)) > 0.3) return false;
      }
      return true;
    };
    const l = buscarLugar(libre, { haciaAfuera: rumboAfueraDeLaAldea(ancla.x, ancla.z) });
    if (l) {
      const dy = (Number.isFinite(base) ? base : T.altura(ancla.x + l.dx, ancla.z + l.dz)) - yDe(ancla);
      const antes = new Map(ds.map((d) => [d, { x: d.x, z: d.z }]));
      for (const d of ds) { d.x += l.dx; d.z += l.dz; if (Number.isFinite(d.y)) d.y += dy; }
      obras.sincronizar(ds);
      for (const o of obras.obras) { const a = antes.get(o.datos); if (a) mudarDatosDeObra(o, a.x, a.z); }
      desalojo.obras.mudadas += ds.length;
    } else {
      for (const d of ds) { sumarMateriales(desalojo.materiales, materialesDeObra(d, PLANO[d.plano])); devolverContenido(d); }
      desalojo.obras.desarmadas += ds.length;
    }
  }
}
function desalojarCarpa() {
  const c = progreso.carpa;
  if (!c || typeof T.sinObras !== 'function' || !Number.isFinite(c.x) || !Number.isFinite(c.z) || !T.sinObras(c.x, c.z, 1.6)) return;
  const libre = (dx, dz) => {
    const x = c.x + dx, z = c.z + dz;
    return !T.sinObras(x, z, 1.6) && !T.agua(x, z) && Math.acos(clamp(T.normal(x, z).y, -1, 1)) <= 0.45;
  };
  const l = buscarLugar(libre, { haciaAfuera: rumboAfueraDeLaAldea(c.x, c.z) });
  if (l) { c.x += l.dx; c.z += l.dz; desalojo.carpa = 'mudada'; } else { progreso.carpa = null; desalojo.carpa = 'levantada'; }
}
// 3.5.1: desmontar una obra que trabaja devuelve lo que tenía adentro: antes se perdían los
// troncos secos de la leñera, la miel, las truchas del ahumadero, las tablas del aserradero y la harina
function devolverContenido(d) {
  if (!d || typeof d !== 'object') return;
  if (d.lenera) sumarMaterial('tronco', sanearLenera(d.lenera).secos);
  if (d.aserradero) { const a = sanearAserradero(d.aserradero); sumarMaterial('tronco', a.troncos); sumarMaterial('tabla', a.tablas); }
  if (d.muela) { const m = sanearMuela(d.muela); if (m.habas) sumarEntrada('haba', m.habas); if (m.harina) progreso.cosas.harina = (Number(progreso.cosas.harina) || 0) + m.harina; }
  if (d.colmena) { const c = sanearColmena(d.colmena); if (c.miel) sumarEntrada('miel', c.miel); }
  if (d.ahumadero) { const a = sanearAhumadero(d.ahumadero); if (a.listas) sumarEntrada('trucha-ahumada', a.listas); if (a.truchas) sumarEntrada('trucha-fresca', a.truchas); }
  refrescarBarra(true);
}
// 3.5.1: la pieza de varias etapas de este plano que quedó a medio hacer más cerca (o null)
function piezaAMedias(plano, pos, radio) {
  if (!plano?.pieza || !(plano.etapas?.length > 1)) return null;
  let mejor = null, d0 = radio;
  for (const o of obras.obrasCerca(pos, radio)) {
    if (o.plano.id !== plano.id || o.datos.etapas >= o.plano.etapas.length) continue;
    const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
    if (d < d0) { d0 = d; mejor = o; }
  }
  return mejor;
}
function accionObra() {
  const js = jugador.estado;
  if (obras.editando) {
    const adelante = obras.plano?.distancia || 2.4;
    const fx = js.pos.x - Math.sin(js.yaw) * adelante;
    const fz = js.pos.z - Math.cos(js.yaw) * adelante;
    const movida = obras.editando, x0 = movida?.datos.x, z0 = movida?.datos.z;
    const r = obras.confirmarEdicion(fx, fz, js.yaw, js.pos.y);
    if (!r.ok) { nota('Acá no', r.motivo); return; }
    if (movida) mudarDatosDeObra(movida, x0, z0);   // 3.5.1
    progreso.obras = obras.obras.map((o) => o.datos);
    guardar(); sonido.juntar(); ultimoSitioObra = '';
    nota(`${r.obra.plano.nombre} recolocado`, r.snap ? `Quedó alineado: ${r.snap.descripcion}` : 'Nueva posición guardada', true);
    dibujarPanelObra();
    return;
  }
  // las cosas chicas se ponen siempre nuevas; las grandes, se siguen levantando
  // 3.5.1: y las piezas de varias etapas (molino de agua, aserradero, estación meteorológica)
  // también: antes cada Y fundaba otra y ninguna pasaba de la primera etapa (el capítulo 6 se trababa)
  const obra = obras.plano?.pieza ? piezaAMedias(obras.plano, js.pos, 10) : obras.obraCerca(js.pos, 10, obras.plano?.id);
  if (obra?.plano.pieza) {
    const r = conMateriales((m) => conOficioDeObra(obras.avanzar(obra, m), m));
    if (!r.ok) { nota('Todavía no', r.motivo); return; }
    avisarSobrante(r);
    progreso.obras = obras.obras.map((o) => o.datos);
    sonido.encender();
    if (r.terminada) {
      nota(obra.plano.nombre, obra.plano.texto, true);
      modos?.obraTerminada?.(obra.plano.id, progreso.horas);
      registrar('piezas');
    } else nota(r.etapa.nombre, r.etapa.dice);
    guardar();
    dibujarPanelObra();
    return;
  }
  if (obra) {
    const r = conMateriales((m) => conOficioDeObra(obras.avanzar(obra, m), m));   // 3.1: el oficio de constructor
    if (!r.ok) { nota('Todavía no', r.motivo); return; }
    avisarSobrante(r);
    progreso.obras = obras.obras.map((o) => o.datos);
    sonido.encender();
    nota(r.etapa.nombre, r.terminada ? `Tu ${obra.plano.nombre.toLowerCase()} está terminado` : r.etapa.dice, r.terminada);
    if (r.terminada) {
      registrar('puesto-propio');
      modos?.obraTerminada?.(obra.plano.id, progreso.horas);   // 3.1: el desafío del día
      diario.anotar('obra', obra.plano.nombre.toLowerCase());
      setTimeout(() => pedirNombre(obra), 900);
    }
    guardar();
    dibujarPanelObra();
    return;
  }
  // todavía no hay obra: se funda donde estés parado
  // Las piezas de una sola etapa se pagan antes de fundarlas. La versión vieja
  // podía dejar un marcador huérfano de pieza si faltaban materiales, porque
  // la siguiente pulsación siempre intentaba crear otra pieza nueva.
  if (obras.plano?.pieza) {
    const faltaPieza = faltan(obras.plano.etapas[0].pide, materialesVisibles());
    if (faltaPieza.length) { nota('Todavía no', `Faltan ${faltaPieza.join(' y ')}`); return; }
  }
  const adelante = obras.plano?.distancia || (obras.plano?.pieza ? 2.4 : 5.5);
  const fx = js.pos.x - Math.sin(js.yaw) * adelante;
  const fz = js.pos.z - Math.cos(js.yaw) * adelante;
  const r = obras.fundar(fx, fz, js.yaw, js.pos.y);
  if (!r.ok) { nota('Acá no', r.motivo); return; }
  progreso.obras = [...(progreso.obras || []), r.datos];
  sonido.juntar();
  if (obras.plano?.pieza) {
    // las cosas chicas se arman de una vez
    const nueva = r.obra || obras.obraCerca({ x: r.datos.x, z: r.datos.z }, 3, obras.plano?.id);
    if (nueva) {
      const paso = conMateriales((m) => conOficioDeObra(obras.avanzar(nueva, m), m));   // 3.1
      if (!paso.ok) {
        nota('Todavía no', paso.motivo);
      } else {
        progreso.obras = obras.obras.map((o) => o.datos);
        // 3.5.1: una pieza de varias etapas recién fundada todavía no está terminada
        if (paso.terminada === false) nota(paso.etapa.nombre, `${paso.etapa.dice} · Y para seguir`);
        else {
          nota(obras.plano.nombre, obras.plano.texto, true);
          modos?.obraTerminada?.(obras.plano.id, progreso.horas);   // 3.1: el desafío del día
          registrar('piezas');
        }
      }
    }
  } else {
    nota('Marcaste el lugar', 'Ahora levantalo por etapas con la tecla Y');
  }
  guardar();
  dibujarPanelObra();
}

// ---------------------------------------------------------------- renovales
const SEMILLAS = [
  { ingrediente: 'pinon', especie: 'pehuen', nombre: 'un piñón', arbol: 'pehuén' },
  { ingrediente: 'calafate', especie: 'coihue', nombre: 'una semilla de coihue', arbol: 'coihue' },
];
function semillaDisponible() {
  // 2.3: un plantín del vivero va primero: ya viene crecido a la mitad
  const p = plantinDisponible(progreso.entradas);
  if (p) return { ingrediente: p.entrada, especie: p.especie, nombre: p.nombre, arbol: p.arbol, plantin: true };
  return SEMILLAS.find((s) => (progreso.entradas[s.ingrediente]?.cantidad || 0) > 0);
}
function plantarRenoval() {
  const js = jugador.estado;
  if (js.enTren || js.enKayak || js.nadando) return;
  const semilla = semillaDisponible();
  if (!semilla) { nota('No tenés qué plantar', 'Juntá piñones o frutos de calafate'); return; }
  const r = renovales.plantar(js.pos.x, js.pos.z, semilla.especie, progreso.dia - (semilla.plantin ? VIVERO.ventaja : 0), veg);
  if (!r.ok) { nota('Acá no crece', r.motivo); return; }
  progreso.entradas[semilla.ingrediente].cantidad -= 1;
  progreso.renovales = [...(progreso.renovales || []), r.datos];
  renovales.actualizar(progreso.dia);
  sonido.juntar();
  registrar('renoval');
  diario.anotar('renoval', semilla.arbol);
  const apurado = apurarRebrote(talados(), (i) => veg.arboles[i], js.pos.x, js.pos.z);
  // `diaRebrote` en -1 destraba la revisión: si no, el tocón no cambia de etapa
  // hasta el día siguiente y el aviso promete algo que no se ve.
  if (apurado) { apurado.esc = -1; diaRebrote = -1; revisarRebrote(); }
  const dias = renovales.DIAS_CRECER - (semilla.plantin ? VIVERO.ventaja : 0);
  nota(semilla.plantin ? 'Plantaste un plantín' : 'Plantaste un renoval', apurado
    ? `Un ${semilla.arbol}. Además apura el rebrote del tocón de al lado ${DIAS_QUE_APURA_UN_RENOVAL} días`
    : `Un ${semilla.arbol}. Va a tardar ${dias} días en levantar`, true);
  guardar();
}

// ---------------------------------------------------------------- la carpa
let carpaMalla = null;
function armarCarpa() {
  const js = jugador.estado;
  if (!progreso.cosas.manta) { nota('Te falta la manta', 'En el almacén se cambia por piñones y frutillas'); return; }
  if (js.enTren || js.enKayak || js.nadando) return;
  if (progreso.carpa) {
    if (Math.hypot(js.pos.x - progreso.carpa.x, js.pos.z - progreso.carpa.z) > 4) {
      nota('Ya tenés la carpa armada', 'Levantala antes de armarla en otro lado');
      return;
    }
    progreso.carpa = null;
    if (carpaMalla) { escena.remove(carpaMalla); carpaMalla = null; }
    sonido.juntar();
    nota('Levantaste la carpa', 'Se puede armar en otro lado');
    guardar();
    return;
  }
  const n = T.normal(js.pos.x, js.pos.z);
  if (Math.acos(clamp(n.y, -1, 1)) > 0.45 || T.agua(js.pos.x, js.pos.z)) {
    nota('Acá no', 'Hace falta un lugar llano y seco');
    return;
  }
  progreso.carpa = { x: js.pos.x, z: js.pos.z, yaw: js.yaw };
  ponerCarpa();
  sonido.encender();
  registrar('carpa');
  nota('Carpa armada', 'De noche podés dormir adentro');
  guardar();
}
function ponerCarpa() {
  if (!progreso.carpa || carpaMalla) return;
  const c = progreso.carpa;
  const y = T.altura(c.x, c.z);
  const g = new THREE.Group();
  const lona = new THREE.MeshLambertMaterial({ color: 0x8a6a3c });
  const oscuro = new THREE.MeshLambertMaterial({ color: 0x4a3b2c });
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-1.1, 0, 0, 1.1, 0, 0, 0, 1.25, 0, 1.1, 0, 0, -1.1, 0, 0, 0, 1.25, 0], 3));
  tri.computeVertexNormals();
  for (const dz of [-1.2, 1.2]) {
    const m = new THREE.Mesh(tri, lona);
    m.position.set(0, 0, dz);
    g.add(m);
  }
  for (const l of [-1, 1]) {
    const lado = new THREE.Mesh(new THREE.PlaneGeometry(2.45, Math.hypot(1.1, 1.25)), lona);
    lado.position.set(l * 0.55, 0.62, 0);
    lado.rotation.set(0, l * Math.PI / 2, l * Math.atan2(1.1, 1.25));
    lado.receiveShadow = true;
    g.add(lado);
  }
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.4), oscuro);
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = 0.03;
  g.add(suelo);
  for (const dz of [-1, 1]) {
    const soga = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4), oscuro);
    soga.position.set(0, 0.5, dz * 1.7);
    soga.rotation.x = dz > 0 ? -0.9 : 0.9;
    g.add(soga);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(c.x, y, c.z);
  g.rotation.y = c.yaw;
  escena.add(g);
  carpaMalla = g;
}
function enLaCarpa() {
  if (!progreso.carpa) return false;
  const js = jugador.estado;
  return Math.hypot(js.pos.x - progreso.carpa.x, js.pos.z - progreso.carpa.z) < 2.2;
}

// 1.11: las recetas viven en cocina.js y pueden pedir más de un ingrediente.
const cuantoCocina = (k, cosa) => (cosa ? progreso.cosas?.[k] || 0 : progreso.entradas?.[k]?.cantidad || 0);
// Un fogón que armaste vos también prende
function fogonPropioCerca() {
  if (!obras) return null;
  const js = jugador.estado;
  let mejor = null, d0 = 3.4;
  for (const o of obras.obras) {
    if (!o.plano.fuego || o.datos.etapas < o.plano.etapas.length) continue;
    const dy = Math.abs(js.pos.y - (o.datos.y ?? js.pos.y));
    if (dy > 1.55) continue;
    const d = Math.hypot(js.pos.x - o.datos.x, js.pos.z - o.datos.z, dy * 0.45);
    if (d < d0) { d0 = d; mejor = o; }
  }
  return mejor;
}

function cercaDelFuego() {
  const js = jugador.estado;
  const f = clima.fogata;
  return f.activa && f.vida > 0 && Math.abs(js.pos.y - f.pos.y) < 1.75 && Math.hypot(js.pos.x - f.pos.x, js.pos.z - f.pos.z) < 4;
}
function hayQueCocinar() {
  return posibles(cuantoCocina, RECETAS_FUEGO, (id) => !!progreso.entradas[id]).length > 0;
}
function cocinar() {
  if (!cercaDelFuego()) { nota('Necesitás un fuego encendido', 'El fogón del refugio o una fogata tuya'); return; }
  const rc = elegirReceta(cuantoCocina, (id) => !!progreso.entradas[id]);
  if (!rc) {
    // 2.1: en invierno, sin nada fresco, se abre una conserva
    const abrir = U.uInvierno.value > 0.5 ? queAbrir(progreso.entradas) : null;
    if (abrir) {
      progreso.entradas[abrir].cantidad -= 1;
      sonido.juntar();
      diario.anotar('conserva', abrir);
      nota(AL_ABRIR[abrir], 'Lo de verano, en invierno');
      guardar();
      return;
    }
    // las primeras cuatro alcanzan de ejemplo: la lista entera no entra en un aviso
    const ejemplos = RECETAS_FUEGO.slice(1, 5).map((x) => textoPide(x)).join('; ');
    nota('Todavía no tenés con qué', `Se puede hacer algo con ${ejemplos}`);
    return;
  }
  for (const p of rc.pide) {
    if (p.cosa) progreso.cosas[p.k] -= p.n;
    else progreso.entradas[p.k].cantidad -= p.n;
  }
  sonido.encender();
  setTimeout(() => {
    sonido.juntar();
    if (rc.conserva) {
      registrar(rc.id, true);
      nota('Un frasco de dulce de frutilla', `Guardado para el invierno. Tenés ${progreso.entradas[rc.id]?.cantidad || 1}`);
    } else {
      registrar(rc.id);
      nota(rc.nombre.charAt(0).toUpperCase() + rc.nombre.slice(1), 'Lo comés mirando el fuego');
    }
    guardar();
  }, 1200);
}

// 2.1: los rastros (ver `rastros.js`). Un rastro por vez: arranca cerca tuyo y lleva
// hasta un animal. Si llegás al final y el animal se movió, el rastro sigue.
let rastroActivo = null, esperaRastro = 40, mallaRastros = null, dibujadoRastro = -1;
const todosLosSujetos = () => [...fauna.sujetos(), ...vida.sujetos(), ...bichos.sujetos()].map((s) => ({ tipo: s.tipo, id: s.id, pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z } }));
function buscarAnimal(tipo, id, cerca) {
  let mejor = null, d0 = Infinity;
  for (const s of todosLosSujetos()) {
    if (s.tipo !== tipo) continue;
    if (id && s.id === id) return s;
    const d = Math.hypot(s.pos.x - cerca.x, s.pos.z - cerca.z);
    if (!id && d < d0) { d0 = d; mejor = s; }
  }
  return mejor;
}
const pisable = (x, z) => !T.agua(x, z);
function actualizarRastros(dt) {
  if (desafio || modo !== 'jugando') return;
  const js = jugador.estado;
  if (!rastroActivo) {
    esperaRastro -= dt;
    if (esperaRastro > 0 || (luzUltimaFoto?.dia ?? 1) < 0.3) return;
    esperaRastro = (90 + Math.random() * 120) * factorEsperaRastro(nivelDe('cazador'));   // 3.1
    const s = elegirRastro(todosLosSujetos(), js.pos, progreso.entradas);
    if (!s) return;
    const huellas = trazarRastro(arranque(js.pos, s.pos), s.pos, s.tipo, { tierra: pisable });
    if (huellas.length < 6) return;
    rastroActivo = { especie: s.tipo, id: s.id, huellas, edad: 0, ultimo: { x: s.pos.x, z: s.pos.z } };
    dibujadoRastro = -1;
  }
  const R = rastroActivo;
  R.edad = envejecer(R.edad, dt, clima.estado.lluvia);
  if (R.edad > VIDA_RASTRO) { rastroActivo = null; mallaRastros?.mostrar(null); return; }
  // llegaste al final y el animal siguió: el rastro se alarga hasta donde está ahora
  const animal = buscarAnimal(R.especie, R.id, R.ultimo);
  if (animal && hayQueAlargar(R.huellas, js.pos, animal.pos)) {
    const fin = R.huellas[R.huellas.length - 1];
    const mas = trazarRastro(fin, animal.pos, R.especie, { tierra: pisable });
    R.huellas = [...R.huellas.slice(-60), ...mas];
    R.ultimo = { x: animal.pos.x, z: animal.pos.z };
    R.edad = Math.min(R.edad, VIDA_RASTRO * 0.4);
    dibujadoRastro = -1;
  }
  // se va borrando al final de su vida
  const vida = 1 - Math.max(0, (R.edad - VIDA_RASTRO * 0.7) / (VIDA_RASTRO * 0.3));
  const clave = Math.round(vida * 20) + R.huellas.length * 100;
  if (clave !== dibujadoRastro) { dibujadoRastro = clave; mallaRastros?.mostrar(R, vida, U.uInvierno.value); }
}
function rastroAlPie() {
  if (!rastroActivo) return null;
  const h = huellaCerca(rastroActivo.huellas, jugador.estado.pos, radioHuellas(1.8, nivelDe('cazador')));   // 3.1
  return h ? { rastro: rastroActivo, huella: h, R: RASTROS[rastroActivo.especie] } : null;
}
function mirarRastro() {
  const r = rastroAlPie();
  if (!r) return false;
  const v = haciaDondeVa(r.rastro.huellas);
  const rumbo = v ? rumboDe({ x: 0, z: 0 }, v) : 'adelante';
  if (!progreso.entradas[r.R.entrada]) registrar(r.R.entrada);
  diario.anotar('rastro', r.R.nombre);
  // 3.1: leer unas huellas enseña (una vez por rastro)
  if (!r.rastro.leido) { r.rastro.leido = true; ganarOficio('cazador', XP.rastro); }
  nota(`Huellas de ${r.R.nombre}`, `Van hacia el ${rumbo}: seguilas`, true);
  return true;
}

// 2.1: cuando cambia la estación, el valle avisa quiénes se fueron o volvieron
let estacionVista = null;
function revisarEstacion() {
  const ahora = estacionDe({ invierno: U.uInvierno.value, otono: U.uOtono.value });
  if (estacionVista === null) { estacionVista = ahora; return; }
  if (ahora === estacionVista) return;
  const antes = estacionVista;
  estacionVista = ahora;
  if (desafio) return;
  const nombres = Object.fromEntries(['picaflor', 'bandurria', 'cauquen'].map((id) => [id, (ENTRADA[id]?.nombre || id).toLowerCase()]));
  const a = avisoDeEstacion(antes, ahora, progreso.entradas, nombres);
  if (a) nota(a.titulo, a.texto, true);
}

// 2.1: el tendal (ver `conservas.js`). Se cuelga lo que hay que secar, y medio día de
// sol después se descuelga la conserva.
function tendalCerca() {
  if (!obras) return null;
  const js = jugador.estado;
  for (const o of obras.obras) {
    if (o.plano.id !== 'tendal' || o.datos.etapas < o.plano.etapas.length) continue;
    if (Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) < 2.6) return o;
  }
  return null;
}
// 2.3: el estado propio de una obra (el tendal, la colmena, el ahumadero, el vivero, la
// leñera) se sanea la primera vez que se usa en la sesión. Antes el tendal lo marcaba
// con una bandera dentro de `datos`, que viajaba en el guardado: un tendal editado a
// mano ya no se volvía a sanear al cargar. Ahora la marca vive sólo en memoria.
const saneadasEnSesion = new WeakMap();
function datosDe(o, clave, sanear) {
  let hechas = saneadasEnSesion.get(o.datos);
  if (!hechas) saneadasEnSesion.set(o.datos, hechas = new Set());
  if (!hechas.has(clave)) { o.datos[clave] = sanear(o.datos[clave]); hechas.add(clave); }
  return o.datos[clave];
}
function datosTendal(o) {
  delete o.datos.tendalSaneado;               // la bandera vieja de la 2.1
  return datosDe(o, 'tendal', sanearTendal);
}
function usarElTendal() {
  const o = tendalCerca();
  if (!o) return;
  const t = datosTendal(o);
  const q = usarTendal(t, progreso.entradas);
  const C = CONSERVAS[q.conserva];
  if (q.accion === 'colgar') { sonido.juntar(); nota('Colgaste a secar', `${C.cantidad} ${C.ingrediente === 'llaollao' ? 'llao llao' : 'calafates'}: medio día de sol, y la lluvia lo frena`, true); }
  else if (q.accion === 'descolgar') { sonido.juntar(); registrar(q.conserva, true); nota(`Descolgaste: ${C.nombre}`, 'Se guarda para el invierno, o se cambia en el almacén', true); }
  else if (q.accion === 'secando') nota('Todavía se está secando', `Faltan unas ${q.faltan} horas`);
  else nota('No tenés qué colgar', 'Cinco calafates, o tres llao llao ya anotados');
  refrescarBarra(true);
  guardar();
}
let horaTendales = null;
function actualizarTendales() {
  const ahora = progreso.dia * 24 + progreso.horas;
  if (horaTendales === null || ahora < horaTendales) { horaTendales = ahora; return; }
  const horas = Math.min(48, ahora - horaTendales);
  if (horas < 0.1) return;
  horaTendales = ahora;
  for (const o of obras?.obras || []) {
    // 2.4: bajo una galería o un invernadero no le llueve
    if (o.plano.id === 'tendal' && o.datos.tendal?.colgado) avanzarSecado(datosTendal(o), horas, { lluvia: obras.cubiertaDePieza?.(o.datos) ? 0 : clima.estado.lluvia, noche: 1 - (luzUltimaFoto?.dia ?? 1) });
    // 2.3: la colmena y el ahumadero trabajan aunque no estés
    else if (o.plano.id === 'colmena' && obraTerminada(o)) {
      const nuevos = avanzarColmena(datosDe(o, 'colmena', sanearColmena), horas, estadoAbejas(o));
      if (nuevos && Math.hypot(o.datos.x - jugador.estado.pos.x, o.datos.z - jugador.estado.pos.z) < 60) nota('La colmena tiene miel', 'Cuando quieras, la sacás con E');
    } else if (o.plano.id === 'ahumadero' && obraTerminada(o)) {
      if (avanzarAhumado(datosDe(o, 'ahumadero', sanearAhumadero), horas)) nota('Las truchas ya están ahumadas', 'Están en el ahumadero, esperándote');
    }
  }
  // 2.3: la leña que llevás encima se moja con la lluvia y se seca despacio
  const js = jugador.estado;
  progreso.humedadLena = humedecer(sanearHumedad(progreso.humedadLena), horas, { lluvia: clima.estado.lluvia, bajoTecho: !!(obras?.dentro?.(js.pos) || obras?.bajoCubierta?.(js.pos)) });
  if (js.entumecido > 0) {
    js.entumecido = desentumecer(js.entumecido, horas, cercaDelFuego() || !!mecanicasAldea?.juntoAEstufa(js.pos));   // 3.6 (mecánicas): y las estufas de la aldea
    if (js.entumecido === 0) nota('Ya entraste en calor', 'El cuerpo arrancó');
  }
  if (js.descansado > 0) js.descansado = gastarDescanso(js.descansado, horas);
}

// ---------------------------------------------------------------- 2.3: obras que trabajan solas
// La colmena, el ahumadero, el vivero y la leñera guardan su estado en la obra, como el
// tendal (ver `datosDe`). Una sola función encuentra la más cercana de cada tipo.
const obraTerminada = (o) => o.datos.etapas >= o.plano.etapas.length;
const obrasTerminadas = (id) => (obras?.obras || []).filter((o) => o.plano.id === id && obraTerminada(o));
const OBRAS_QUE_TRABAJAN = ['colmena', 'ahumadero', 'vivero', 'lenera', 'horno', 'buzon', 'embarcadero', 'bebedero'];
function obraQueTrabajaCerca(radio = 2.6) {
  const js = jugador.estado;
  let mejor = null, d0 = radio;
  for (const o of obras?.obras || []) {
    if (!OBRAS_QUE_TRABAJAN.includes(o.plano.id) || !obraTerminada(o)) continue;
    // 2.4: con el kayak al alcance, E sube (el aviso lo dice antes); en el embarcadero
    // se mide desde las tablas, que son largas
    if (o.plano.id === 'embarcadero' && (js.enKayak || kayak?.cerca(js) || !sobreEmbarcadero(o, js.pos))) continue;
    if (o.plano.id === 'bebedero' && ovejaCercana?.propia) continue;
    // 2.9: lo que se usa sólo de muy cerca (la radio del refugio no le gana a la cama)
    if (o.plano.alcanceE && Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) > o.plano.alcanceE) continue;
    const d = o.plano.id === 'embarcadero' ? 0 : Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
    // `js.pos.y` son los pies, como `o.datos.y`
    // 3.0.1: y sin una pared en el medio (ver `sinParedEnMedio`)
    if (d < d0 && Math.abs((o.datos.y ?? js.pos.y) - js.pos.y) < 2.2 && sinParedEnMedio(o)) { d0 = d; mejor = o; }
  }
  return mejor;
}
function estadoAbejas(o) {
  const canteros = canterosTerminados().filter((k) => huerta()[claveCantero(k.datos.x, k.datos.z)] && Math.hypot(k.datos.x - o.datos.x, k.datos.z - o.datos.z) <= COLMENA.radio).length;
  return { noche: 1 - (luzUltimaFoto?.dia ?? 1), invierno: U.uInvierno.value, lluvia: clima.estado.lluvia, canteros };
}
const truchasFrescas = () => cuantoHay('trucha-fresca');
const troncosAMano = () => materialesVisibles().tronco || 0;
function leneraCerca(radio = LENA.radioLenera) {
  const js = jugador.estado;
  let mejor = null, d0 = radio;
  for (const o of obrasTerminadas('lenera')) {
    const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
    if (d < d0) { d0 = d; mejor = o; }
  }
  return mejor;
}
function avisoObraQueTrabaja(o) {
  switch (o.plano.id) {
    case 'colmena': return avisoColmena(datosDe(o, 'colmena', sanearColmena), estadoAbejas(o));
    case 'ahumadero': return avisoAhumadero(datosDe(o, 'ahumadero', sanearAhumadero), truchasFrescas(), troncosAMano());
    case 'vivero': return avisoVivero(datosDe(o, 'vivero', sanearVivero), progreso.entradas, progreso.dia);
    case 'lenera': return avisoLenera(datosDe(o, 'lenera', sanearLenera), material('tronco'));
    case 'molino-agua': case 'aserradero': case 'estacion-meteo': case 'radio-refugio': return avisoMaquina(o);   // 2.9
    default: return avisoObra24(o);
  }
}
function usarObraQueTrabaja(o) {
  if (usarObra24(o)) { refrescarBarra(true); guardar(); return; }
  if (usarMaquina(o)) { refrescarBarra(true); guardar(); return; }   // 2.9
  if (o.plano.id === 'colmena') {
    const r = usarColmena(datosDe(o, 'colmena', sanearColmena), estadoAbejas(o));
    if (r.accion === 'cosechar') {
      const total = sumarEntrada('miel', r.miel);
      sonido.juntar();
      diario.anotar('miel', r.miel);
      nota(`Sacaste ${r.miel} ${r.miel === 1 ? 'frasco' : 'frascos'} de miel`, `Llevás ${total}. Para el fuego, la feria o el invierno`, true);
    } else if (r.accion === 'invierno') nota('Las abejas no salen en invierno', 'Se quedan apretadas adentro, calentándose entre ellas');
    else nota('Las abejas están trabajando', r.dias === 1 ? 'Falta miel: más o menos un día de sol' : `Falta miel: unos ${r.dias} días de sol`);
  } else if (o.plano.id === 'ahumadero') {
    const a = datosDe(o, 'ahumadero', sanearAhumadero);
    const r = usarAhumadero(a, truchasFrescas(), troncosAMano());
    if (r.accion === 'sacar') {
      const total = sumarEntrada('trucha-ahumada', r.ahumadas);
      sonido.juntar();
      diario.anotar('ahumado', r.ahumadas);
      nota(`Sacaste ${r.ahumadas} ${r.ahumadas === 1 ? 'trucha ahumada' : 'truchas ahumadas'}`, `Llevás ${total}. Aguantan hasta el invierno`, true);
    } else if (r.accion === 'colgar') {
      sumarEntrada('trucha-fresca', -r.truchas);
      conMateriales((m) => { m.tronco -= r.lena; });
      sonido.encender();
      nota(`Colgaste ${r.truchas} ${r.truchas === 1 ? 'trucha' : 'truchas'} al humo`, 'En medio día están. El fuego se cuida solo', true);
    } else if (r.accion === 'ahumando') nota('Se están ahumando', `Faltan unas ${r.faltan} horas`);
    else if (r.accion === 'sinLena') nota('Falta leña', 'Un tronco por tanda, para el fuego de abajo');
    else nota('No tenés truchas', `Con el ahumadero, de lo que pescás te quedás con ${AHUMADERO.porDia} truchas por día`);
  } else if (o.plano.id === 'vivero') {
    const r = usarVivero(datosDe(o, 'vivero', sanearVivero), progreso.entradas, progreso.dia);
    if (r.accion === 'sacar') {
      for (const [esp, n] of Object.entries(r.plantines)) sumarEntrada(ARBOLES_VIVERO[esp].plantin, n);
      sonido.juntar();
      nota(`Sacaste ${r.total} ${r.total === 1 ? 'plantín' : 'plantines'}`, 'Se plantan con B en un claro: ya vienen crecidos a la mitad', true);
    } else if (r.accion === 'sembrar') {
      for (const [esp, n] of Object.entries(r.sembradas)) sumarEntrada(ARBOLES_VIVERO[esp].semilla, -n);
      sonido.juntar();
      nota(`Sembraste ${r.total} ${r.total === 1 ? 'almácigo' : 'almácigos'}`, `En ${VIVERO.diasPlantin} días salen los plantines`, true);
    } else if (r.accion === 'creciendo') nota('Están germinando', r.dias === 1 ? 'Falta un día' : `Faltan ${r.dias} días`);
    else nota('No tenés semillas', 'En otoño, junto a un coihue, una lenga, un ñire o un ciprés grande, E junta semilla. Los piñones también sirven');
  } else if (o.plano.id === 'lenera') {
    const l = datosDe(o, 'lenera', sanearLenera);
    const n = guardarEnLenera(l, material('tronco'));
    if (n) {
      progreso.materiales.tronco -= n;
      sonido.juntar();
      nota(`Guardaste ${n} ${n === 1 ? 'tronco' : 'troncos'} en la leñera`, `Hay ${l.secos} secos. En invierno, cada fuego se lleva uno`, true);
    } else nota(`${l.secos} ${l.secos === 1 ? 'tronco seco' : 'troncos secos'}`, l.secos >= LENA.capacidad ? 'La leñera está llena' : 'Traé troncos para guardar');
  }
  refrescarBarra(true);
  guardar();
}

// ---------------------------------------------------------------- 2.9: el molino, el aserradero, la estación y la radio
// Van por el mismo camino que la colmena: `obraQueTrabajaCerca` las encuentra y el aviso
// y la tecla E las atienden en el mismo lugar (ver `avisoObraQueTrabaja`). Las máquinas
// corren en horas de juego y se ponen al día solas (ver `molino.js`); el tiempo que
// anuncia la estación es el que el clima va a seguir (ver `meteo.js`).
OBRAS_QUE_TRABAJAN.push(...MAQUINAS_QUE_TRABAJAN);
let molinoMundo = null, meteoMundo = null;
let relojMaquinas = 0, relojSierra = 0, relojRueda = 0;
function horaDeJuego() { return horaAbsoluta(progreso.dia, progreso.horas); }
// La semilla del tiempo de la partida: se crea la primera vez y viaja en el guardado.
function meteoPartida() {
  if (!(progreso.meteo?.semilla > 0)) progreso.meteo = sanearMeteo(progreso.meteo);
  return progreso.meteo;
}
let radioSaneada = null;
function radioPartida() {
  if (radioSaneada !== progreso || !progreso.radio) { progreso.radio = sanearRadio(progreso.radio); radioSaneada = progreso; }
  return progreso.radio;
}
function programaDelTiempo() {
  return crearPrograma({
    ahora: horaDeJuego,
    segundosPorHora: () => ((ajustes.duracion === 'reloj' ? 1440 : ajustes.duracion) * 60) / 24,
    semilla: () => meteoPartida().semilla,
    modo: () => ajustes.clima,
  });
}
const fuerzaMolino = () => fuerzaDelAgua({ invierno: U.uInvierno.value, crecida: progreso.tormenta?.crecida || 0 });
const molinosTerminados = () => obrasTerminadas('molino-agua').map((o) => o.datos);
const cercaDeObra = (o, r = 60) => Math.hypot(o.datos.x - jugador.estado.pos.x, o.datos.z - jugador.estado.pos.z) < r;
function pronosticoActual() {
  return pronosticoMeteo(meteoPartida().semilla, progreso.dia, progreso.horas, { modo: ajustes.clima, estacion: ajustes.estacion });
}
function nochesActuales() {
  return desafio && progreso.desafio ? nochesQueVienen(progreso.desafio, meteoPartida(), progreso.dia, progreso.horas) : [];
}
// Se ponen al día las muelas y los aserraderos, y lo que se mueve se arma o se desarma.
function revisarMaquinas() {
  if (!obras) return;
  const ahora = horaDeJuego(), fuerza = fuerzaMolino();
  const molinos = obrasTerminadas('molino-agua'), datosMolinos = molinos.map((o) => o.datos);
  const ruedas = [], sierras = [];
  for (const o of molinos) {
    const m = datosDe(o, 'muela', sanearMuela), antes = m.habas;
    const h = horasDesde(m, ahora);
    if (h > 0 && avanzarMuela(m, h, fuerza) && antes && !moliendo(m) && cercaDeObra(o)) nota('La muela terminó', `Hay ${m.harina} ${m.harina === 1 ? 'medida' : 'medidas'} de harina en el molino`);
    ruedas.push({ datos: o.datos, vel: 0.9 * fuerza });
  }
  for (const o of obrasTerminadas('aserradero')) {
    const a = datosDe(o, 'aserradero', sanearAserradero), antes = a.troncos;
    const mueve = molinoQueMueve(o.datos, datosMolinos);
    const h = horasDesde(a, ahora);
    if (h > 0 && mueve && avanzarAserradero(a, h, fuerza) && antes && !a.troncos && cercaDeObra(o)) nota('El aserradero terminó los troncos', `Hay ${a.tablas} tablas esperándote`);
    sierras.push({ datos: o.datos, trabajando: !!mueve && aserrando(a) });
  }
  molinoMundo?.sincronizar(ruedas, sierras);
  meteoMundo?.sincronizar(obrasTerminadas('estacion-meteo').map((o) => o.datos));
}
function actualizarMaquinas(dt) {
  if (!obras) return;
  relojMaquinas -= dt;
  if (relojMaquinas <= 0) {
    relojMaquinas = 0.5;
    if (!molinoMundo) { molinoMundo = crearMolinoMundo(T, escena); meteoMundo = crearMeteoMundo(T, escena); }
    revisarMaquinas();
  }
  if (!molinoMundo) return;
  molinoMundo.animar(dt);
  meteoMundo.animar(dt, clima.estado.viento, clima.estado.rafaga);
  sonarMaquinas(dt);
}
// La sierra chilla y suelta la tabla; la rueda golpea el agua con cada paleta. Con los
// golpes del motor de sonido (sin tocar la síntesis): sólo cerca.
function sonarMaquinas(dt) {
  if (!sonido?.ctx) return;
  const js = jugador.estado;
  relojSierra -= dt; relojRueda -= dt;
  if (relojSierra <= 0) {
    relojSierra = 2.6;
    for (const [d, s] of molinoMundo.sierras) {
      const dist = Math.hypot(d.x - js.pos.x, d.z - js.pos.z);
      if (s.objetivo <= 0 || dist > 40) continue;
      const pos = s.g.position, destino = sonido.fuente(pos, Math.max(0.1, 1 - dist / 45));
      if (!destino) break;
      sonido.golpeRuido({ dur: 1.5, frec: 2300, fin: 3100, q: 5, vol: 0.16, destino, buffer: sonido.ruido });
      sonido.impacto('tabla', { pos, tamaño: 1.3, dureza: 0.7, fuerza: 0.45, vol: 0.4 * (1 - dist / 45), cuando: 1.45, capasMax: 2 });
      break;
    }
  }
  if (relojRueda <= 0) {
    relojRueda = 1.4;
    for (const [d, r] of molinoMundo.ruedas) {
      const dist = Math.hypot(d.x - js.pos.x, d.z - js.pos.z);
      if (dist > 30) continue;
      relojRueda = 1.4 / Math.max(0.4, r.vel / 0.9);
      const pos = r.g.position, cerca = 1 - dist / 32;
      sonido.impacto('tabla', { pos, tamaño: 2.4, dureza: 0.25, fuerza: 0.25, vol: 0.3 * cerca, capasMax: 2 });
      const destino = sonido.fuente(pos, 0.5 * cerca);
      if (destino) sonido.golpeRuido({ dur: 0.5, frec: 700, q: 0.8, vol: 0.1, destino, buffer: sonido.ruido, cuando: 0.05 });
      break;
    }
  }
}
function avisoMaquina(o) {
  switch (o.plano.id) {
    case 'molino-agua': return avisoMolino(datosDe(o, 'muela', sanearMuela), cuantoHay('haba'));
    case 'aserradero': return avisoAserradero(datosDe(o, 'aserradero', sanearAserradero), material('tronco'), !!molinoQueMueve(o.datos, molinosTerminados()));
    case 'estacion-meteo': case 'radio-refugio': {
      const p = pedidoRadio(radioPartida().pedido);
      if (p && alcanzaPedido(p, progreso.materiales, progreso.cosas)) return `Avisar por radio que mandás ${textoPideRadio(p)}`;
      return o.plano.id === 'estacion-meteo' ? 'Leer el pronóstico y prender la radio' : 'Prender la radio';
    }
    default: return null;
  }
}
function usarMaquina(o) {
  if (!MAQUINAS_QUE_TRABAJAN.includes(o.plano.id)) return false;
  revisarMaquinas();
  relojMaquinas = 0;   // en el cuadro que viene la sierra arranca (o para) con lo cargado
  const fuerza = fuerzaMolino();
  if (o.plano.id === 'molino-agua') {
    const r = usarMolino(datosDe(o, 'muela', sanearMuela), cuantoHay('haba'), fuerza);
    if (r.accion === 'sacar') {
      progreso.cosas.harina = (progreso.cosas.harina || 0) + r.harina;
      sonido.juntar();
      nota(`Sacaste ${r.harina} ${r.harina === 1 ? 'medida' : 'medidas'} de harina`, `Llevás ${progreso.cosas.harina}. Para el pan, la torta frita o las empanadas`, true);
    } else if (r.accion === 'cargar') {
      sumarEntrada('haba', -r.habas);
      sonido.juntar();
      nota(`Echaste ${r.habas} habas a la muela`, `Dos habas, una medida de harina: hora y media cada una`, true);
    } else if (r.accion === 'moliendo') nota('La muela está moliendo', r.faltan === 1 ? 'Falta más o menos una hora' : `Faltan unas ${r.faltan} horas`);
    else {
      const n = obrasTerminadas('aserradero').filter((a) => molinoQueMueve(a.datos, [o.datos])).length;
      nota('La rueda gira con el arroyo', `${n ? `Mueve ${n === 1 ? 'un aserradero' : `${n} aserraderos`}` : `Un aserradero a menos de ${MOLINO.enlace} m aprovecha la fuerza`}. Con habas de la huerta, la muela hace harina`);
    }
    return true;
  }
  if (o.plano.id === 'aserradero') {
    const a = datosDe(o, 'aserradero', sanearAserradero);
    const mueve = !!molinoQueMueve(o.datos, molinosTerminados());
    const r = usarAserradero(a, material('tronco'), mueve, fuerza);
    if (r.accion === 'sacar') {
      sumarMaterial('tabla', r.tablas);
      sonido.juntar();
      registrar('tabla-mat');
      nota(`Sacaste ${r.tablas} tablas del aserradero`, `Llevás ${material('tabla')} tablas`, true);
    } else if (r.accion === 'cargar') {
      progreso.materiales.tronco -= r.troncos;
      sonido.juntar();
      nota(`Cargaste ${r.troncos} ${r.troncos === 1 ? 'tronco' : 'troncos'} en el aserradero`, r.sinMolino ? `Sin un molino de agua a menos de ${MOLINO.enlace} m, la sierra no arranca` : `Cinco tablas por tronco. Se aserran solos, aunque te vayas`, true);
    } else if (r.accion === 'aserrando') nota('La sierra está trabajando', `Quedan ${r.troncos} ${r.troncos === 1 ? 'tronco' : 'troncos'}: unas ${r.faltan} horas`);
    else if (r.accion === 'sinMolino') nota('La sierra está parada', `Necesita un molino de agua a menos de ${MOLINO.enlace} m, en la orilla del arroyo`);
    else nota('El aserradero está vacío', 'Traé troncos: cinco tablas por cada uno');
    return true;
  }
  usarRadio(o);
  return true;
}
// La radio: primero, si tenés lo que te pidieron, avisás que lo mandás; si no, se escucha
// lo que haya en el aire. En la estación, antes, el pronóstico.
function usarRadio(o) {
  const r = radioPartida();
  const p = pedidoRadio(r.pedido);
  if (p && alcanzaPedido(p, progreso.materiales, progreso.cosas)) {
    cumplirPedido(r, progreso.materiales, progreso.cosas);
    sonido.anotar?.();
    nota(`Mandaste ${textoPideRadio(p)}`, `Van con la trochita al ${nombreEstacionRadio(p.de)}`, true);
    cobrarPremio({ premio: p.premio });
    refrescarBarra(true);
    guardar();
    return;
  }
  const estacion = o.plano.id === 'estacion-meteo';
  const oido = escucharRadio(r, { dia: progreso.dia, horas: progreso.horas, pronostico: pronosticoActual(), noches: nochesActuales(), desafio: !!desafio });
  let enElAire = oido.de ? `${oido.de}: «${oido.texto}»` : oido.texto;
  if (oido.pedido) enElAire += ` Juntá ${textoPideRadio(pedidoRadio(oido.pedido))} y avisá por radio: se mandan con la trochita.`;
  else if (p) enElAire += ` En el ${nombreEstacionRadio(p.de)} todavía esperan ${textoPideRadio(p)}.`;
  if (sonido?.ctx) sonido.golpeRuido({ dur: 0.7, frec: 1900, q: 0.7, vol: 0.06, destino: sonido.bus.efectos, buffer: sonido.ruido });
  const pos = { x: o.datos.x, y: o.datos.y, z: o.datos.z };
  if (estacion) {
    const texto = textoPronostico(pronosticoActual(), nochesActuales());
    hablar({ clave: 'estacion-meteo', nombre: 'Estación meteorológica', oficio: 'el pronóstico', saludo: texto, despedida: `En la radio. ${enElAire}`, historias: [], pos });
  } else {
    hablar({ clave: 'radio-refugio', nombre: 'La radio', oficio: 'los refugios del valle', saludo: enElAire, despedida: 'Cambio y fuera. La radio queda crujiendo bajito.', historias: [], pos });
  }
  guardar();
}

// ---------------------------------------------------------------- 2.4: las estructuras
// El horno, el buzón, el embarcadero y el bebedero van por el mismo camino que la
// colmena (aviso y tecla E con la misma prioridad). Ver CAMBIOS_2_4_0.md.
const guardadoHorno = (id) => progreso.entradas[id]?.cantidad || 0;
function sobreEmbarcadero(o, pos) {
  const rot = o.datos.rot || 0, dx = pos.x - o.datos.x, dz = pos.z - o.datos.z;
  const lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot);
  return Math.abs(lx) < o.plano.ancho / 2 + 0.6 && Math.abs(lz) < o.plano.fondo / 2 + 0.6 && Math.abs(pos.y - (o.datos.y + 0.46)) < 1.6;
}
function avisoObra24(o) {
  switch (o.plano.id) {
    case 'horno': { const rc = elegirHorneada(cuantoCocina, guardadoHorno); return rc ? `Hornear ${rc.nombre}` : 'El horno de barro'; }
    case 'buzon': return porRetirar(correo(), progreso).length ? 'Abrir el buzón: hay carta' : porEnviar(correo()).length ? 'Mandar la foto por el buzón' : 'Mirar el buzón';
    case 'embarcadero': return 'Traer el kayak al embarcadero';
    case 'bebedero': return progreso.corral ? 'Mirar tu corral' : 'El bebedero';
    default: return null;
  }
}
function usarObra24(o) {
  switch (o.plano.id) {
    case 'horno': hornear(); return true;
    case 'buzon': abrirBuzon(o); return true;
    case 'embarcadero':
      if (amarrarKayak()) { sonido.golpeKayak?.(); nota('Trajiste el kayak', 'Quedó amarrado al costado de la punta'); }
      else nota('El kayak no llega hasta acá', 'La punta tiene que dar al agua honda del lago');
      return true;
    case 'bebedero': {
      if (!progreso.corral) {
        const cercos = (obras?.obras || []).filter((c) => c.plano.id === 'cerco' && obraTerminada(c) && Math.hypot(c.datos.x - o.datos.x, c.datos.z - o.datos.z) <= 7).length;
        if (desafio) nota('El bebedero', 'Las ovejas se quedan en el galpón');
        else nota('Todavía no es un corral', `Faltan ${Math.max(0, CORRAL_PROPIO.cercos - cercos)} tramos de cerco alrededor, a menos de 7 m`);
        return true;
      }
      const { conLana, total } = resumenMajada(progreso.corral, progreso.dia);
      nota('Tu corral', conLana ? `${conLana} de ${total} con el vellón entero` : 'Las dos recién esquiladas: el vellón vuelve en unos días');
      return true;
    }
    default: return false;
  }
}

// El horno: lo horneado se guarda, para la feria o para el camino.
function hornear() {
  const rc = elegirHorneada(cuantoCocina, guardadoHorno);
  if (!rc) { nota('No tenés con qué hornear', `Pan: ${textoPide(RECETAS_HORNO[0])}. Empanadas: ${textoPide(RECETAS_HORNO[1])}`); return; }
  if (troncosAMano() < LENA_HORNO) { nota('Falta leña', 'Un tronco por horneada, para calentar el barro'); return; }
  for (const p of rc.pide) {
    if (p.cosa) progreso.cosas[p.k] -= p.n;
    else progreso.entradas[p.k].cantidad -= p.n;
  }
  conMateriales((m) => { m.tronco -= LENA_HORNO; });
  const total = sumarEntrada(rc.id, rc.da);
  sonido.encender();
  diario.anotar('horno', rc.nombre);
  nota(rc.id === 'pan-casero' ? `Horneaste ${rc.da} panes caseros` : `Horneaste ${rc.da} empanadas`, `Llevás ${total}. Para la feria o para el camino`, true);
}

// El buzón: las cartas que llegan con el tren y las fotos que se mandan, sin ir al almacén.
function abrirBuzon(o) {
  const hay = porRetirar(correo(), progreso).length > 0;
  if (!hay && !porEnviar(correo()).length) { nota('El buzón está vacío', 'Las cartas llegan con el tren'); return; }
  if (hay) diario.anotar('buzon');
  hablar({ clave: 'buzon', nombre: 'Tu buzón', oficio: 'en la puerta de casa', saludo: 'Levantás la tapa del buzón.', despedida: 'Cerrás la tapa del buzón.', historias: [], pos: { x: o.datos.x, y: o.datos.y, z: o.datos.z } });
}

// El embarcadero: el kayak queda amarrado al costado de la punta.
function puntoAmarre(o) {
  const rot = o.datos.rot || 0, c = Math.cos(rot), sn = Math.sin(rot), lz = o.plano.fondo / 2 - 0.9;
  for (const lx of [1.35, -1.35]) {
    const x = o.datos.x + lx * c + lz * sn, z = o.datos.z - lx * sn + lz * c;
    if (T.agua(x, z) && T.altura(x, z) < -0.35 && Math.hypot(x - LAGO.x, z - LAGO.z) < 220) return { x, z, rumbo: rot };
  }
  return null;
}
function amarrarKayak() {
  if (!kayak || kayak.est.activo) return false;
  const js = jugador.estado;
  const lista = obrasTerminadas('embarcadero').sort((a, b) => Math.hypot(a.datos.x - js.pos.x, a.datos.z - js.pos.z) - Math.hypot(b.datos.x - js.pos.x, b.datos.z - js.pos.z));
  for (const o of lista) {
    const p = puntoAmarre(o);
    if (!p) continue;
    Object.assign(kayak.est, { x: p.x, z: p.z, rumbo: p.rumbo, vel: 0, giro: 0 });
    return true;
  }
  return false;
}

// El corral propio (Relax): bebedero + cuatro cercos. Don Ramón trae dos ovejas.
let corralMundo = null;
function refrescarCorral() {
  if (desafio || !obras) return;
  const lugar = buscarCorral(obras.obras.map((o) => ({ plano: o.plano.id, x: o.datos.x, z: o.datos.z, terminada: obraTerminada(o) })));
  if (!progreso.corral) {
    if (!lugar) return;
    progreso.corral = corralNuevo(lugar, progreso.dia);
    diario.anotar('corral');
    sonido.anotar?.();
    nota('Don Ramón te trajo dos ovejas', 'Para tu corral. Se esquilan con la misma tijera', true);
    guardar();
  } else if (lugar && mudarCorral(progreso.corral, lugar)) {
    corralMundo?.mudar(lugar.x, lugar.z, lugar.radio);
    guardar();
  }
  if (!corralMundo) {
    const c = progreso.corral;
    corralMundo = crearMajada(T, escena, { centro: c, cantidad: CORRAL_PROPIO.ovejas, radio: c.radio, semilla: 7703, propia: true });
    corralMundo?.refrescarLana(c, progreso.dia);
  }
}

// La helada en la huerta: lo que está bajo el invernadero sigue creciendo.
function canteroProtegido(clave) {
  const o = canterosTerminados().find((k) => claveCantero(k.datos.x, k.datos.z) === clave);
  const cub = o && obras?.cubiertaDePieza?.({ x: o.datos.x, y: o.datos.y, z: o.datos.z });
  return !!cub && cub.plano.id === 'invernadero';
}
function helarLaHuerta(h) {
  const protegidos = Object.keys(h).filter(canteroProtegido).length;
  const helados = helarHuerta(h, progreso.dia, canteroProtegido);
  if (!helados && !protegidos) return 0;
  diario.anotar('helada', { helados, protegidos });
  if (helados) nota('Heló la huerta', protegidos ? 'Lo de afuera se atrasa un día; lo del invernadero sigue creciendo' : 'Lo sembrado afuera se atrasa un día. Un invernadero lo cubre', true);
  return helados;
}

// Teñir (T con los planos abiertos): pasa al siguiente tinte que te alcance.
function tenirPieza() {
  const o = obras.tenibleCerca?.(jugador.estado.pos, 4);
  if (!o) { nota('Nada para teñir', 'Acercate a una pared, un piso o un techo tuyo terminado'); return; }
  const tengo = { calafates: progreso.entradas.calafate?.cantidad || 0, piedra: materialesVisibles().piedra || 0 };
  const antes = o.datos.tinte || null;
  let nuevo = antes;
  for (let i = 0; i < ORDEN_TINTES.length; i++) { nuevo = siguienteTinte(nuevo); if (costoTinte(nuevo, tengo).ok) break; }
  if (nuevo === antes) { nota('No te alcanza para teñir', 'Calafate: 3 frutos · ocre: 1 piedra · cal: 2 piedras'); return; }
  const pide = costoTinte(nuevo, tengo).pide;
  if (pide.calafates) progreso.entradas.calafate.cantidad -= pide.calafates;
  if (pide.piedra) conMateriales((m) => { m.piedra -= pide.piedra; });
  obras.tenir(o, nuevo);
  progreso.obras = obras.obras.map((x) => x.datos);
  sonido.juntar();
  if (nuevo) { diario.anotar('tinte', TINTES[nuevo].nombre); nota(`Teñiste de ${TINTES[nuevo].nombre}`, 'T otra vez pasa al siguiente'); }
  else nota('Volvió al color de la madera', 'T otra vez pasa al siguiente');
  refrescarBarra(true);
  guardar();
}

// La casa viva (ver casa-viva.js): el humo de tu chimenea y las ventanas encendidas.
// Cada dos segundos alcanza: ni el fuego ni la noche cambian más rápido.
let ventanasMundo = null, chimeneasTodas = null, acumuladoCasa = 99, embarcaderosVistos = -1;
const lugarObra = (o) => ({ plano: o.plano.id, x: o.datos.x, y: o.datos.y, z: o.datos.z, rot: o.datos.rot || 0 });
function fuegoDeObra() {
  const fg = clima.fogata;
  if (!fg.activa || !(fg.vida > 0) || !fg.contenida || !obras) return null;
  return obras.obras.find((o) => o.plano.fuegoContenido && Math.hypot(o.datos.x - fg.pos.x, o.datos.z - fg.pos.z) < 0.3) || null;
}
function actualizarCasaViva(dt) {
  acumuladoCasa += dt;
  if (acumuladoCasa < 2 || !obras) return;
  acumuladoCasa = 0;
  const propio = fuegoDeObra();
  const ch = propio ? chimeneaDe(lugarObra(propio)) : null;
  chimeneasTodas = ch ? [...chimeneas, ch] : chimeneas;
  const brillo = brilloVentanas(1 - (luzUltimaFoto?.dia ?? 1));
  let lista = [];
  if (brillo > 0) {
    const luces = obras.obras.filter((o) => o.plano.luzInterior && obraTerminada(o)).map((o) => ({ x: o.datos.x, y: o.datos.y + 1, z: o.datos.z }));
    if (propio) luces.push({ x: propio.datos.x, y: propio.datos.y + 1, z: propio.datos.z });
    if (luces.length) lista = ventanasEncendidas(obras.obras.filter((o) => VENTANAS[o.plano.id] && obraTerminada(o)).map(lugarObra), luces);
  }
  ventanasMundo?.actualizar(lista, brillo);
  refrescarCorral();
  const emb = obrasTerminadas('embarcadero').length;
  if (embarcaderosVistos >= 0 && emb > embarcaderosVistos && amarrarKayak()) nota('El kayak quedó amarrado en tu embarcadero', 'Desde la punta también se pesca', true);
  embarcaderosVistos = emb;
}

// 2.3: en otoño, junto a un árbol grande, se junta semilla para el vivero.
function arbolParaSemilla() {
  if (desafio || U.uOtono.value < 0.5) return null;
  const js = jugador.estado;
  const cerca = veg.arbolesCerca ? veg.arbolesCerca(js.pos.x, js.pos.z, 4, scratchArbolesHacha) : veg.arboles;
  let arbol = null, da = 2.4;
  for (const a of cerca) {
    if (a.sacado || a.caido || !ARBOLES_VIVERO[a.especie] || a.especie === 'pehuen') continue;
    const d = Math.hypot(a.x - js.pos.x, a.z - js.pos.z) - (a.r || 0.4);
    if (d < da) { da = d; arbol = a; }
  }
  if (!arbol) return null;
  const i = veg.arboles.indexOf(arbol);
  progreso.semillasJuntadas = sanearJuntadas(progreso.semillasJuntadas, progreso.dia);
  const r = puedeJuntarSemilla({ i, especie: arbol.especie, esc: arbol.esc }, { otono: U.uOtono.value, juntadas: progreso.semillasJuntadas });
  return r.ok ? { arbol, i, semilla: r.semilla } : null;
}
function juntarSemilla(s) {
  progreso.semillasJuntadas.arboles.push(s.i);
  const total = sumarEntrada(s.semilla, 1);
  sonido.juntar();
  nota(`Semilla de ${ARBOLES_VIVERO[s.arbol.especie].nombre}`, `Llevás ${total}. En el vivero germina en ${VIVERO.diasPlantin} días`);
  refrescarBarra(true);
  guardar();
}

// 2.3: pasar corriendo al lado de una colmena la alborota (no pican: avisan)
let alborotoColmena = 99;
function revisarColmenas(dt) {
  alborotoColmena += dt;
  const js = jugador.estado;
  if (!js.corriendo) return;
  for (const o of obrasTerminadas('colmena')) {
    const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
    if (seAlborotan(d, true, alborotoColmena)) {
      alborotoColmena = 0;
      nota('Las abejas se alborotan', 'Pasá despacio al lado de la colmena');
      return;
    }
  }
}
// El zumbido de la colmena usa el mismo bucle que el panal del bosque: suena si no hay
// uno silvestre más cerca, de día y fuera del invierno, y fuerte si la alborotaste.
const panalColmena = { pos: { x: 0, y: 0, z: 0 }, fuerza: 0 };
function zumbidoColmena() {
  if (desafio || U.uInvierno.value > 0.5 || (luzUltimaFoto?.dia ?? 1) < 0.4) return null;
  const js = jugador.estado;
  let mejor = null, d0 = 14;
  for (const o of obrasTerminadas('colmena')) {
    const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
    if (d < d0) { d0 = d; mejor = o; }
  }
  if (!mejor) return null;
  panalColmena.pos.x = mejor.datos.x; panalColmena.pos.z = mejor.datos.z;
  panalColmena.pos.y = (mejor.datos.y ?? T.altura(mejor.datos.x, mejor.datos.z)) + 0.6;
  panalColmena.fuerza = (1 - d0 / 14) * (alborotoColmena < 4 ? 2.2 : 0.8);
  return panalColmena;
}

// ---------------------------------------------------------------- charla con la gente
const charla = { npc: null, historia: null, parte: 0, fin: false };
function hablar(npc) {
  if (!npc) return;
  // 3.6 (vida): el que invitaste a tomar algo, ya sentado: E te sienta con él; si todavía va
  // para la mesa, te lo dice (ver vecindad-juego.js)
  const enCita = vecindadJuego?.invitado(npc);
  if (enCita === 'esperando' && sentarseALaCita()) return;
  if (enCita === 'yendo') {
    Object.assign(charla, { npc, fin: false, encargo: null, enojado: false, historia: { id: 'vecindad-cita', partes: ['Ya voy, ya voy. Andá sentándote, que te alcanzo.'] }, parte: 0, vec: null, menu: null });
    $('charla').classList.remove('oculto');
    mostrarCharla();
    return;
  }
  // 3.1: un poblador (3.6: o un vecino de la aldea, o el que bajó del tren) habla de lo suyo
  // (ver aldea-gente.js)
  const deLaAldea = npc.poblador && aldeaGente ? aldeaGente.charla(npc) : null;
  // (3.6 (vida): de visita en tu mesa, primero la charla de la visita, como los del valle)
  if (deLaAldea && !(npc.deVisita && visitas().activa)) {
    Object.assign(charla, { npc, fin: false, encargo: null, enojado: false, historia: deLaAldea, parte: -1, vec: null, menu: null });
    // 3.6 (vida): con la gente de la aldea, el menú de temas (lo de su oficio, primera opción);
    // el que recién bajó del tren se presenta como antes
    if (deLaAldea.tipo !== 'llegada' && vecindadJuego) {
      charla.vec = vecindadJuego.abrir(npc, { servicio: deLaAldea.tipo === 'servicio' ? deLaAldea : null, linea: deLaAldea.tipo === 'vecino' ? deLaAldea.partes[0] : null });
      if (charla.vec) charla.historia = null;
    }
    $('charla').classList.remove('oculto');
    mostrarCharla();
    return;
  }
  charla.npc = npc;
  valle?.hablo(npc.clave);   // 3.1: la historia anota a quién conociste
  charla.fin = false;
  charla.encargo = null;
  // primero cuenta sus historias; después empieza a pedir cosas, y lo que pide
  // sigue el hilo: un encargo trabado no se ofrece hasta cerrar los de antes.
  // 2.0: cuando la lista principal no tiene nada para este vecino, puede tener algo de
  // la estación (sólo después del cierre; ver `encargos-temporada.js`)
  const suyo = encargoDe(progreso, npc.clave)
    || encargoDeTemporada(progreso, npc.clave, estacionDe({ invierno: U.uInvierno.value, otono: U.uOtono.value }));
  const nuevas = npc.historias.filter((h) => !progreso.entradas[h.id]);
  // 2.4: el buzón de tu casa hace lo mismo que Ercilia con las cartas (ver abrirBuzon)
  const correoAca = npc.clave === 'ercilia' || npc.clave === 'buzon';
  const carta = correoAca ? porRetirar(correo(), progreso)[0] : null;
  const envio = correoAca ? porEnviar(correo())[0] : null;
  // Si hay carta, Ercilia te la da antes que nada: la carta es una historia más que se
  // registra al terminar de leerla, y así queda en el cuaderno.
  // 1.11: si vino de visita, primero la charla de la visita (y el regalo al terminarla)
  const deVisita = npc.deVisita && visitas().activa && !visitas().activa.charlo;
  // 2.3: de noche, al fogón, el que vino de visita cuenta un cuento (ver `cuentos.js`)
  const cuento = !deVisita && npc.deVisita && visitas().activa && esHoraDeCuentos(progreso.horas) && fogonDeVisita() ? cuentoPara(npc.clave, progreso.entradas) : null;
  if (deVisita) charla.historia = { id: 'visita', partes: charlaDeVisita(npc.clave, visitas().cuenta), visita: true };
  else if (cuento) charla.historia = cuento;
  else if (carta) { charla.historia = { id: carta.id, partes: partesDeCarta(carta) }; }
  else if (envio) { charla.historia = { id: 'envio-foto', partes: partesDeEnvio(envio), envio: envio.id }; }
  else if (suyo?.modo === 'listo') { charla.encargo = suyo; charla.historia = null; }
  else if (!nuevas.length && suyo) { charla.encargo = suyo; charla.historia = null; }
  else charla.historia = nuevas.length ? nuevas[0] : null;
  charla.parte = -1;
  // 3.6 (vida): el compadre que vino a visitarte cuenta lo suyo (ver vecindad-juego.js)
  if (deVisita && visitas().activa.amistad && vecindadJuego) charla.historia.partes = vecindadJuego.charlaDeCompadre(visitas().activa.clave);
  // 2.1: el vecino al que no fuiste a defender no tiene ganas de hablar (ver `desafio-valle.js`)
  charla.enojado = !!desafio?.enojado?.(npc.clave);
  if (charla.enojado) { charla.historia = null; charla.encargo = null; }
  // 3.6 (vida): en el Relax, los vecinos tienen su menú de temas (ver vecindad-juego.js). Lo de
  // siempre que no se elige (la visita, el cuento, la carta, el envío, el encargo) va primero,
  // como antes; la historia que todavía no contó pasa a ser la primera opción del menú.
  charla.vec = null; charla.menu = null;
  if (!desafio && !charla.enojado && vecindadJuego) {
    const nueva = !charla.encargo && charla.historia && nuevas.includes(charla.historia) ? charla.historia : null;
    charla.vec = vecindadJuego.abrir(npc, { historia: nueva });
    if (charla.vec && nueva) charla.historia = null;
  }
  $('charla').classList.remove('oculto');
  mostrarCharla();
}
// 2.1: cuántas horas del juego faltan para que cambie el tiempo
const horasFaltantesClima = () => horasHasta(clima.estado.t, ajustes.duracion === 'reloj' ? 1440 : ajustes.duracion);
const pronosticosDados = new Set();
function mostrarCharla() {
  const npc = charla.npc;
  $('charla-quien').textContent = `${npc.nombre}, ${npc.oficio}`;
  // 3.6 (vida): el menú de temas
  if (charla.menu) { dibujarMenuCharla(); return; }
  $('charla-opciones')?.classList.add('oculto');
  let texto;
  if (charla.enojado) {
    texto = SALUDO_ENOJADO[npc.clave] || 'Hoy no tengo ganas de hablar.';
    charla.fin = true;
  } else if (charla.parte < 0) {
    // 3.6 (vida): el que ya te tiene confianza te saluda distinto (ver vecindad.js)
    texto = charla.vec?.saludo || saludoDe(npc, { horas: progreso.horas, lluvia: clima.estado.lluvia, invierno: U.uInvierno.value, otono: U.uOtono.value });
    // 2.1: si se viene un cambio de tiempo, lo dice al saludar (ver `pronostico.js`).
    // Van traducidas por separado porque se juntan en un solo párrafo.
    const frase = frasePronostico(npc.clave, clima.estado.objetivo, clima.estado.proximo, horasFaltantesClima());
    if (frase) {
      texto = `${T_(texto)} ${T_(frase)}`;
      const clave = `${progreso.dia}-${npc.clave}-${clima.estado.proximo}`;
      if (!pronosticosDados.has(clave)) { pronosticosDados.add(clave); diario.anotar('pronostico', { quien: npc.nombre, proximo: clima.estado.proximo }); }
    }
  }
  else if (charla.historia && charla.parte < charla.historia.partes.length) texto = charla.historia.partes[charla.parte];
  else if (charla.encargo && charla.parte === 0) texto = charla.encargo.modo === 'listo' ? charla.encargo.e.listo : charla.encargo.e.pedido;
  // 3.6 (vida): terminado lo de antes, el menú (con el cursor en «chau» si ya se contó algo)
  else if (charla.vec && !charla.vec.chau) { abrirMenuCharla(!!(charla.historia || charla.encargo)); return; }
  else { texto = npc.despedida; charla.fin = true; }
  $('charla-texto').textContent = texto;
  $('charla-seguir').textContent = charla.fin ? 'E o Escape para despedirte' : 'E para seguir escuchando';
  // 3.1: el trato con un poblador se acepta con E en el último renglón
  if (!charla.fin && charla.historia?.seguir && charla.parte === charla.historia.partes.length - 1) $('charla-seguir').textContent = charla.historia.seguir;
}
function seguirCharla() {
  if (charla.menu) { elegirEnMenuCharla(charla.menu.i); return; }   // 3.6 (vida): E elige la opción marcada
  if (charla.fin) { cerrarCharla(); return; }
  if (charla.parte < 0 && !charla.historia && !charla.encargo) { charla.parte = 99; mostrarCharla(); return; }
  charla.parte++;
  if (charla.historia && charla.parte === charla.historia.partes.length) registrar(charla.historia.id);
  if (charla.historia?.alTerminar && charla.parte === charla.historia.partes.length) charla.historia.alTerminar();   // 3.1
  if (charla.historia?.visita && charla.parte === charla.historia.partes.length) regaloDeVisita(charla.npc);
  if (charla.historia?.envio && charla.parte === charla.historia.partes.length) mandarFoto(charla.historia.envio);
  // 3.6 (vida): aceptó la invitación (sale para la mesa) y la charla de la mesa, terminada
  if (charla.historia?.cita && charla.parte === charla.historia.partes.length) {
    const c = charla.historia.cita;
    vecindadJuego?.empezarCita(charla.vec?.clave, c.npc || charla.npc, c.que, c.charla, c.lugares);
    if (charla.vec) charla.vec.chau = true;
  }
  if (charla.historia?.citaCharla && charla.parte === charla.historia.partes.length) vecindadJuego?.citaCharlada();
  // una carta que pide una foto: al terminar de leerla, qué foto y cómo
  const pide = charla.historia && charla.parte === charla.historia.partes.length ? CARTA[charla.historia.id]?.foto : null;
  // 2.6.1: una carta que pide una foto que no está en DESAFIOS ya no rompe el temporizador
  if (pide) { const d = DESAFIOS.find((x) => x.id === pide); if (d) setTimeout(() => nota(`Te piden una foto: ${d.nombre}`, d.pista, true), 1400); }
  if (charla.encargo && charla.parte === 1) {
    const e = charla.encargo.e;
    if (charla.encargo.modo === 'listo') { progreso.encargos[e.id] = 'hecho'; registrar(e.id); cobrarPremio(e); }
    else if (progreso.encargos[e.id] !== 'pedido') {
      progreso.encargos[e.id] = 'pedido';
      // los de temporada cuentan lo hecho desde ahora, no desde el principio
      if (ENCARGO_TEMPORADA[e.id]) anotarBase(progreso, e);
      sonido.anotar();
      nota(e.resumen, `Encargo de ${npcNombre(charla.npc)}`, true);
      guardar();
    }
  }
  mostrarCharla();
}
const npcNombre = (npc) => npc.nombre;
// Los de la lista principal y los de temporada, para lo que los trata a todos igual:
// el aviso de cumplido y la lista de lo que tenés pendiente en pantalla.
const TODOS_LOS_ENCARGOS = [...ENCARGOS, ...ENCARGOS_TEMPORADA];
const NOMBRE_VECINO = { ema: 'Ema', ramon: 'Don Ramón', nicanor: 'Nicanor', guarda: 'Elsa', ercilia: 'Ercilia' };
// 1.11: la foto sale con el tren; lo que dejaron pagado, si dejaron algo, es tuyo.
function mandarFoto(id) {
  const c = CARTA[id];
  if (!c || !enviarFoto(correo(), id)) return;
  diario.anotar('envio', dePara(c));
  if (c.premio) cobrarPremio({ premio: { ...c.premio, texto: 'Lo que dejaron por la foto' } });
  guardar();
}
// Lo que te dejan a cambio del encargo: materiales, ramitas o algo para la mochila.
function cobrarPremio(e) {
  const premio = e?.premio;
  if (!premio) return;
  for (const [k, n] of Object.entries(premio.materiales || {})) sumarMaterial(k, n);
  if (premio.ramitas) progreso.ramitas = (progreso.ramitas || 0) + premio.ramitas;
  // 3.5.1: Math.max: una cosa que se cuenta (la yerba) no vuelve a 1. El cierre del valle dejaba
  // la yerba en 1 aunque tuvieras 40.
  if (premio.cosa) progreso.cosas[premio.cosa] = Math.max(1, Number(progreso.cosas[premio.cosa]) || 0);
  // Lo que se cuenta (yerba, semillas) se suma a lo que ya tenías.
  for (const [k, n] of Object.entries(premio.cuenta || {})) progreso.cosas[k] = (progreso.cosas[k] || 0) + n;
  // El cierre deja varias cosas de una: las que ya tenías no se duplican.
  const yaTenias = { ...progreso.cosas };
  for (const c of premio.cosas || []) progreso.cosas[c] = 1;
  // 3.5.1: lo que se cuenta (la yerba) no vuelve a 1: el cierre del valle la dejaba en 1 aunque tuvieras 40
  for (const c of premio.cosas || []) if (Number(yaTenias[c]) > 1) progreso.cosas[c] = Number(yaTenias[c]);
  refrescarBarra(true);
  setTimeout(() => nota('Te dejaron algo', premio.texto || 'Un regalo por el encargo', true), 1200);
  guardar();
}
function cerrarCharla() {
  if (charla.historia?.citaCharla) vecindadJuego?.citaCharlada();   // 3.6 (vida): cortada a la mitad, igual cuenta
  charla.npc = null;
  charla.menu = null; charla.vec = null;   // 3.6 (vida)
  $('charla').classList.add('oculto');
  $('charla-opciones')?.classList.add('oculto');
}
// ---------------------------------------------------------------- 3.6 (vida): el menú de la charla
// Al hablarle a un vecino del Relax: «¿Cómo andás?», «Novedades», «Tu historia», «Regalar…»,
// «Invitar a tomar algo…», «Dar una mano…» (y lo de su oficio primero). Se elige con los números
// (como en el almacén), o con la ruedita (LB/RB en el mando) y E (X). Escape vuelve del
// submenú o de un tema al menú, y desde el menú se despide. Las reglas, en vecindad-juego.js.
// 3.6: lo del lugar donde estás parado, cuando ahí hay alguien (Ercilia detrás del mostrador, la abuela
// en el de la biblioteca): hablándole, también está en el menú, así nunca te tapa lo que viniste a hacer
function accionDelLugar() {
  if (desafio || !jugador) return null;
  if (cercaDelMostrador() && !enElAlmacen) return { texto: 'Ver qué hay en el almacén', hacer: () => abrirAlmacen() };
  if (enLaCasaDeTe()) return { texto: 'Pedir algo en la casa de té', hacer: () => servir() };
  const m = mecanicasAldea?.accion(jugador.estado);
  if (m && MECANICAS_EN_LA_CHARLA.includes(m.tipo)) return { texto: m.texto, hacer: m.hacer };   // (3.6.2: y el libro prestado)
  return null;
}
// 3.6.1: el menú (o el submenú) con lo del lugar. Antes lo del lugar se agregaba sólo al abrirlo: al
// volver de «Regalar…» con «Mejor no» o con Escape, «Ver qué hay en el almacén» ya no estaba.
function armarMenuCharla(alFinal = false) {
  charla.menu = vecindadJuego.menu(charla.vec, alFinal);
  const lugar = charla.menu?.tipo === 'charla' ? accionDelLugar() : null;
  if (lugar) {
    // antes de «Nada más, chau» (el último), sin mover la marca de lo de siempre
    const k = Math.max(0, charla.menu.opciones.length - 1);
    charla.menu.opciones.splice(k, 0, { id: '__lugar', titulo: lugar.texto, hacer: lugar.hacer });
    if (charla.menu.i >= k) charla.menu.i++;
  }
}
function abrirMenuCharla(alFinal = false) {
  if (!vecindadJuego || !charla.vec) return;
  charla.vec.sub = null;
  armarMenuCharla(alFinal);
  charla.historia = null; charla.encargo = null; charla.parte = 0;
  dibujarMenuCharla();
}
function dibujarMenuCharla() {
  const m = charla.menu;
  $('charla-texto').textContent = m.texto;
  const ul = $('charla-opciones');
  ul.innerHTML = '';
  m.opciones.forEach((o, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${o.titulo}`;
    if (i === m.i) li.className = 'elegida';
    // 3.6.1: con el mouse suelto, clic en la opción (mousedown, como la barra: que no tire la línea)
    li.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); elegirEnMenuCharla(i); });
    ul.appendChild(li);
  });
  ul.classList.remove('oculto');
  // 3.6.1: con el mando, el pie dice los botones (antes decía la ruedita y E)
  const pie = habiaMando ? (m.tipo === 'charla' ? PIE_MENU_MANDO : PIE_SUBMENU_MANDO) : (m.tipo === 'charla' ? PIE_MENU : PIE_SUBMENU);
  $('charla-seguir').textContent = pie.replace('{n}', m.opciones.length);
}
const PIE_MENU_MANDO = 'LB y RB, o la cruceta, y X para elegir · B para despedirte';
const PIE_SUBMENU_MANDO = 'LB y RB, o la cruceta, y X para elegir · B para volver';
function moverMenuCharla(paso) {
  const m = charla.menu;
  if (!m || foto.activo) return;   // 3.6.1: en el modo foto el menú no se ve (LB y RB lo movían a ciegas)
  m.i = (m.i + paso + m.opciones.length) % m.opciones.length;
  dibujarMenuCharla();
}
function elegirEnMenuCharla(i) {
  const m = charla.menu;
  if (!m || !vecindadJuego || !charla.vec || i < 0 || i >= m.opciones.length) return;
  if (m.opciones[i].id === '__lugar') { const hacer = m.opciones[i].hacer; cerrarCharla(); hacer(); return; }   // 3.6
  const r = vecindadJuego.elegir(charla.vec, m.opciones[i].id, charla.npc);
  charla.menu = null;
  charla.parte = 0;
  if (r.tipo === 'menu') armarMenuCharla();   // 3.6.1: con lo del lugar
  else if (r.tipo === 'renglones') charla.historia = { id: 'vecindad-tema', partes: r.renglones, volver: true };
  else if (r.tipo === 'historia') charla.historia = { ...r.historia, volver: true };
  else if (r.tipo === 'cita') charla.historia = { id: 'vecindad-cita', partes: r.renglones, cita: r };
  else { charla.vec.chau = true; charla.historia = null; charla.encargo = null; charla.parte = 99; }
  mostrarCharla();
}
// Escape: del submenú o de un tema elegido, vuelve al menú; si no, se despide.
function atrasCharla() {
  if (charla.menu && charla.menu.tipo !== 'charla' && charla.vec) { charla.vec.sub = null; armarMenuCharla(); mostrarCharla(); return; }   // 3.6.1: con lo del lugar
  if (!charla.menu && charla.historia?.volver && charla.vec) { abrirMenuCharla(true); return; }
  cerrarCharla();
}
// La mesa de la invitación: te sentás en tu lugar, mirando al invitado, y charlan.
function sentarseALaCita() {
  const r = vecindadJuego?.sentarse();
  if (!r) return false;
  const js = jugador.estado;
  js.pos.set(r.tuyo.x, alturaDePie(T, col, r.tuyo.x, r.tuyo.z, js.pos.y), r.tuyo.z);
  js.yaw = Math.atan2(-(r.npc.pos.x - r.tuyo.x), -(r.npc.pos.z - r.tuyo.z)); js.pitch = -0.05;
  jugador.sentarse(true);
  Object.assign(charla, { npc: r.npc, fin: false, encargo: null, enojado: false, historia: { id: 'vecindad-cita', partes: r.charla, citaCharla: true }, parte: 0, vec: null, menu: null });
  $('charla').classList.remove('oculto');
  mostrarCharla();
  return true;
}

// ---------------------------------------------------------------- el almacén
const cuanto = (clave) => (clave === 'ramita' ? progreso.ramitas : progreso.entradas[clave]?.cantidad || 0);
let enElAlmacen = false;
function cercaDelMostrador() {
  const a = est.almacen;
  if (!a) return false;
  const js = jugador.estado;
  const d = Math.hypot(js.pos.x - a.mostrador.x, js.pos.z - a.mostrador.z);
  if (d >= 3.2) return false;
  if (enElAlmacen) return true;   // abierto, se cierra recién al alejarse
  // 3.0.1: para atender hay que estar adentro del local y mirando para el mostrador. Con
  // sólo la distancia se compraba desde afuera, a través de la pared del fondo, y adentro,
  // junto a la puerta y de espaldas al mostrador, E abría el almacén en vez de la puerta.
  if (Number.isFinite(a.ancho)) {
    const dx = js.pos.x - a.x, dz = js.pos.z - a.z, c = Math.cos(a.rot), s = Math.sin(a.rot);
    if (Math.abs(dx * c - dz * s) > a.ancho / 2 || Math.abs(dx * s + dz * c) > a.fondo / 2) return false;
  }
  return d < 1.3 || ((a.mostrador.x - js.pos.x) * -Math.sin(js.yaw) + (a.mostrador.z - js.pos.z) * -Math.cos(js.yaw)) / d > -0.1;
}
// 2.2: con las dos ramas juntas el almacén tiene más cambios que números: van de a
// nueve por página y Tab pasa a la siguiente. El clic elige cualquiera.
const POR_PAGINA_ALMACEN = 9;
let paginaAlmacen = 0;
const paginasAlmacen = () => Math.ceil(TRUEQUES.length / POR_PAGINA_ALMACEN);
function pasarPaginaAlmacen(dir = 1) {
  paginaAlmacen = (paginaAlmacen + dir + paginasAlmacen()) % paginasAlmacen();
  marcarEn('almacen', 0);   // 3.6.2
  dibujarAlmacen();
}
// el número de la tecla (1 a 9) en la página que se ve
const cambiarDeLaPagina = (n) => cambiar(paginaAlmacen * POR_PAGINA_ALMACEN + n - 1);
function abrirAlmacen() {
  enElAlmacen = true;
  paginaAlmacen = 0;
  marcarEn('almacen', 0);   // 3.6.2
  $('trueque').classList.remove('oculto');
  dibujarAlmacen();
  marcarHud(0, true);
}
function cerrarAlmacen() {
  enElAlmacen = false;
  $('trueque').classList.add('oculto');
}
function dibujarAlmacen() {
  const ul = $('trueque-lista');
  ul.innerHTML = '';
  const desde = paginaAlmacen * POR_PAGINA_ALMACEN;
  TRUEQUES.slice(desde, desde + POR_PAGINA_ALMACEN).forEach((t, j) => {
    const i = desde + j;
    const li = document.createElement('li');
    const tengo = t.pide.every(([k, n]) => cuanto(k) >= n);
    const hecho = tieneYa(t, progreso.cosas);
    li.className = hecho ? 'hecho' : tengo ? '' : 'falta';
    const pedido = t.pide.map(([k, n]) => `${n} ${NOMBRE_COSA[k] || k} (tenés ${cuanto(k)})`).join(' y ');
    const b = document.createElement('b');
    b.textContent = `${j + 1}. ${t.nombre}`;
    const span = document.createElement('span');
    span.textContent = `— por ${pedido}`;
    const marca = document.createElement('i');
    const guardadas = t.repetible && progreso.cosas[t.id] ? ` · tenés ${progreso.cosas[t.id]}` : '';
    marca.textContent = (hecho ? 'ya lo tenés' : tengo ? 'se puede' : 'falta juntar') + guardadas;
    li.append(b, span, marca);
    // 2.1: también con un clic (3.6.2: mousedown: el click no llegaba, ver alClicHud)
    alClicHud(li, () => cambiar(i));
    ul.appendChild(li);
  });
  const n = paginasAlmacen();
  $('trueque-seguir').textContent = T_(n > 1 ? `Elegí con el número o con un clic · Tab: más cambios (${paginaAlmacen + 1} de ${n}) · Escape para salir` : 'Elegí con el número o con un clic · Escape para salir');
}
function cambiar(i) {
  marcarEn('almacen', i - paginaAlmacen * POR_PAGINA_ALMACEN);   // 3.6.2: lo elegido queda marcado
  const t = TRUEQUES[i];
  if (!t) return;
  if (tieneYa(t, progreso.cosas)) { nota('Eso ya lo tenés', 'Pedile otra cosa'); return; }
  if (!t.pide.every(([k, n]) => cuanto(k) >= n)) {
    nota('Todavía te falta', `Hacen falta ${t.pide.map(([k, n]) => `${n} ${NOMBRE_COSA[k] || k}`).join(' y ')}`);
    return;
  }
  for (const [k, n] of t.pide) {
    if (k === 'ramita') progreso.ramitas -= n;
    else progreso.entradas[k].cantidad -= n;
  }
  progreso.cosas[t.id] = t.repetible ? (progreso.cosas[t.id] || 0) + (t.da || 1) : 1;
  sonido.juntar();
  registrar(t.id);
  nota(t.nombre, t.efecto, true);
  guardar();
  dibujarAlmacen();
}

// Dónde está parado el jugador, para elegir la reverberación
function espacioDeAudio() {
  const js = jugador.estado;
  const c = T.lugares.cueva;
  if (c && Math.hypot(js.pos.x - c.x, js.pos.z - c.z) < 10) return 'cueva';
  const techos = [T.lugares.refugio, T.lugares.cabana, T.lugares.puesto, T.lugares['casa-te'], T.lugares.almacen, T.lugares.galpon, T.lugares.molino, T.lugares.estacion];
  for (const l of techos) {
    if (l && Math.hypot(js.pos.x - l.x, js.pos.z - l.z) < (l.radio || 4.5)) return 'adentro';
  }
  if (aldeaMundo?.adentro(js.pos)) return 'adentro';   // 3.6: entre las paredes de un edificio de la aldea
  // Las habitaciones modulares cerradas ya son interiores completos también
  // para audio, clima y postproceso; no sólo para la mecánica de dormir.
  if (obras?.dentro(js.pos)) return 'adentro';
  if (js.enTren) return 'adentro';
  return 'bosque';
}

// 2.0: de qué es el techo que tenés encima (ver `techo-lluvia.js`). La cueva no tiene:
// la lluvia se oye lejos, en la boca. Afuera tampoco.
function techoDeAudio() {
  const js = jugador.estado;
  if (enLaCarpa()) return 'lona';
  if (js.enTren) return 'chapa';
  const c = T.lugares.cueva;
  if (c && Math.hypot(js.pos.x - c.x, js.pos.z - c.z) < 10) return null;
  for (const [clave, techo] of Object.entries(TECHO_DE_LUGAR)) {
    const l = T.lugares[clave];
    if (l && Math.hypot(js.pos.x - l.x, js.pos.z - l.z) < (l.radio || 4.5)) return techo;
  }
  const ta = aldeaMundo?.techoEn(js.pos);   // 3.6: bajo un techo de la aldea (la chapa)
  if (ta) return ta;
  const o = obras?.dentro(js.pos);
  if (o) return techoDeObra(o.plano.id, o.plano.snap ? obras.estadoModulo?.(o)?.cubierta?.id : null);
  const b = obras?.bajoCubierta?.(js.pos);
  if (b) return techoDeObra(b.base?.plano?.id, b.cubierta?.id);
  return null;
}

function mundoPesca() {
  // Contexto estable: pesca lo consulta mucho y no necesita un objeto nuevo por llamada.
  ctxPesca.horas = progreso.horas; ctxPesca.nublado = clima.estado.nublado; ctxPesca.mosca = !!progreso.cosas.mosca;
  ctxPesca.lluvia = clima.estado.lluvia; ctxPesca.tormenta = !!clima.estado.tormenta; ctxPesca.crecida = progreso.tormenta?.crecida || 0;
  // 3.1: el oficio de pescador (el pique, el tiempo para clavar y la línea)
  const nPesca = nivelDe('pescador');
  ctxPesca.pique = factorPique(nPesca); ctxPesca.clavar = segundosParaClavar(nPesca); ctxPesca.linea = factorLinea(nPesca);
  return ctxPesca;
}
function puedeDormirJuntoAlFuego() {
  const deNoche = progreso.horas >= 19.5 || progreso.horas < 6;
  if (deNoche && enLaCarpa()) return true;
  const dentroPropio = deNoche && obras?.dentro(jugador.estado.pos);
  // Compatibilidad: una habitación cerrada sigue siendo un lugar válido para
  // dormir. El catre mejora el confort y la presentación, no rompe partidas.
  if (dentroPropio) return true;
  // con la manta de lana se puede dormir en cualquier lado
  return deNoche && (cercaDelFuego() || (!!progreso.cosas.manta && jugador.estado.enSuelo && !jugador.estado.nadando));
}
document.addEventListener('keyup', (e) => {
  // La liberación debe procesarse incluso con pausa/cuaderno abierto; si no,
  // X puede quedar 'recogiendo' al volver al juego.
  if (e.code === 'KeyX' && pesca) pesca.clic(false, mundoPesca());
});

// ------------------------------------------------------------------ escuchar con atención
// Se escucha agachado y quieto: es la misma postura del sigilo, y no pide tecla nueva
// (no queda ninguna libre). El oído se afina en un par de segundos, el resto del
// bosque se corre para dejar pasar lo que canta, y moverse o pararse lo corta.
let oidoAfinado = 0, ultimaEscucha = '';
function actualizarEscucha(dtReal) {
  const js = jugador.estado;
  // quieto con tolerancia: un temblor de un cuadro sobre la pendiente no es caminar
  oidoAfinado = afinarOido(oidoAfinado, !!js.agachado && modo === 'jugando' && !desafio, quietoDeVerdad(js), dtReal);
  // la mezcla se recalcula sólo cuando la escucha cambió de verdad
  if (Math.abs(oidoAfinado - escuchaAplicada) > 0.04 || (oidoAfinado === 0 && escuchaAplicada > 0)) aplicarMezcla();
  const panel = $('escucha');
  if (!panel) return;
  if (oidoAfinado < 0.5) { if (!panel.classList.contains('oculto')) panel.classList.add('oculto'); ultimaEscucha = ''; return; }
  const fuente = queCantaCerca(fauna.fuentesDeCanto(ctxMundoVivo), js.pos, progreso.entradas);
  const texto = T_(textoEscucha(fuente));
  if (texto !== ultimaEscucha) { panel.textContent = texto; ultimaEscucha = texto; }
  panel.classList.remove('oculto');
}
// 3.6.2: un panel del HUD abierto (el almacén, la feria, las cargas, la mochila, el taller): ahí el clic izquierdo
// elige (con el mouse suelto) o no hace nada (bloqueado: no hay flecha); no tira la línea ni dispara
const panelDelHudAbierto = () => enElAlmacen || enLaFeria || enLasCargas() || mochilaAbierta || !!desafio?.tallerAbierto;
// 3.6.2: la opción marcada del almacén, la feria o las cargas. La ruedita, LB y RB o la cruceta la mueven;
// Enter o A eligen la marcada (los números y el clic, la suya, que también queda marcada). Siempre a la vista:
// en una ventana chica la lista tiene scroll (plantilla.html) y la marcada se trae con scrollIntoView. Antes,
// en una ventana de 700 px las primeras opciones del almacén quedaban fuera, y con el mando no se elegía nada.
const PIE_PANEL_MANDO = 'LB y RB, o la cruceta, para marcar · A para elegir · B para salir';
let marcaHud = { panel: null, i: 0 };
function listaHudAbierta() {
  if (foto.activo) return null;
  if (enElAlmacen) return { id: 'almacen', ul: $('trueque-lista'), pie: $('trueque-seguir'), elegir: (i) => cambiar(paginaAlmacen * POR_PAGINA_ALMACEN + i) };
  if (enLaFeria) return { id: 'feria', ul: $('feria-lista'), pie: $('feria')?.querySelector('.seguir'), elegir: (i) => cambiarFeria(i) };
  if (enLasCargas()) return { id: 'cargas', ul: $('cargas-lista'), pie: $('cargas')?.querySelector('.seguir'), elegir: (i) => puestoCargas.elegir(i) };
  return null;
}
const marcarEn = (panel, i) => { marcaHud = { panel, i: Math.max(0, i) }; };
function marcarHud(mover = 0, mostrar = false) {
  const l = listaHudAbierta();
  if (!l?.ul) { marcaHud.panel = null; return null; }
  if (marcaHud.panel !== l.id) { marcarEn(l.id, 0); mostrar = true; }
  let lis = l.ul.children;
  if (!lis.length) return l;
  let i = Math.min(marcaHud.i, lis.length - 1) + mover;
  // (en el almacén, más allá de la página se pasa a la de al lado: con el mando no hay Tab)
  if (l.id === 'almacen' && (i < 0 || i >= lis.length) && paginasAlmacen() > 1) {
    pasarPaginaAlmacen(i < 0 ? -1 : 1);
    lis = l.ul.children;
    i = i < 0 ? lis.length - 1 : 0;
  }
  i = ((i % lis.length) + lis.length) % lis.length;
  if (i !== marcaHud.i) mostrar = true;
  marcaHud.i = i;
  for (let k = 0; k < lis.length; k++) {
    const si = k === i;
    if (lis[k].classList.contains('elegida') !== si) { lis[k].classList.toggle('elegida', si); if (si) mostrar = true; }
  }
  if (mostrar) lis[i].scrollIntoView?.({ block: 'nearest' });
  if (habiaMando && l.pie && l.pie.textContent !== PIE_PANEL_MANDO) l.pie.textContent = PIE_PANEL_MANDO;
  return l;
}
function elegirHud(i = null) {
  const l = marcarHud();
  if (!l) return false;
  if (i !== null) marcaHud.i = i;
  l.elegir(marcaHud.i);
  marcarHud(0, true);
  return true;
}
// 3.6.2: las opciones de las listas del HUD (el #hud no recibe el mouse: cada lista lo pide en plantilla.html) se
// eligen con mousedown, como el menú de la charla en la 3.6.1, y el clic no sigue de largo
function alClicHud(el, fn) {
  el.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); fn(); });
}
document.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || modo !== 'jugando' || !jugador || !jugador.bloqueado() || foto.activo) return;   // 3.5.4: ni en el modo foto
  if (panelDelHudAbierto()) return;   // 3.6.2
  // 3.6.1: charlando con el mouse bloqueado (sin flecha para apuntar), el clic es E: elige la opción
  // marcada o sigue la charla (antes tiraba la línea de pesca en medio de la charla)
  if (charla.npc && document.pointerLockElement) { seguirCharla(); return; }
  pesca.clic(true, mundoPesca());
});
document.addEventListener('mouseup', (e) => {
  // Igual que KeyX: mouseup puede llegar después de abrir un modal.
  if (e.button === 0 && pesca) pesca.clic(false, mundoPesca());
});

// 2.0: la lámina del cuaderno (ver `lamina.js` y `lamina-dibujo.js`)
let armandoLamina = false;
async function armarLamina() {
  await document.fonts?.ready;
  const datos = datosLamina(progreso, { ENTRADAS, DESAFIOS, estacion: nombreEstacion().toLowerCase(), luna: nombreFase(faseLunar(progreso.dia, progreso.horas)) });
  datos.t = T_;   // el lienzo no pasa por el traductor del DOM: se le da en la mano
  return dibujarLamina(document.createElement('canvas'), datos, cargarImagen);
}
async function guardarLamina() {
  if (armandoLamina) return;
  armandoLamina = true;
  try {
    const lienzoL = await armarLamina();
    const datos = lienzoL.toDataURL('image/png');
    const nombre = nombreArchivoLamina(progreso.dia);
    sonido.anotar();
    if (window.hojarasca?.guardarFoto) {
      try { const ruta = await window.hojarasca.guardarFoto(datos, nombre); nota('Lámina guardada', ruta, true); return; } catch {}
    }
    bajarDatos(datos, nombre);   // 3.5.1: ver bajarDatos
    nota('Lámina guardada', 'En tu carpeta de descargas', true);
  } finally { armandoLamina = false; }
}

let luzUltimaFoto = null;
async function sacarFoto() {
  diario.anotar('foto');
  $('hud').classList.add('oculto');
  dibujar(luzUltimaFoto, 1 - (luzUltimaFoto?.dia ?? 1));
  const datos = lienzo.toDataURL('image/png');
  {
    const js = jugador.estado;
    const vistos = fotos.evaluar({
      sujetos: [...fauna.sujetos(), ...vida.sujetos(), ...bichos.sujetos()], horas: progreso.horas, zoom: js.zoom, tren: estadoTren,
      pezEnMano: pesca.mostrandoPez(), noche: 1 - (luzUltimaFoto?.dia ?? 1), lunaDir: luzUltimaFoto?.lunaDir,
      fogata: clima.fogata.activa && clima.fogata.vida > 0 ? clima.fogata.pos : null,
      otono: U.uOtono.value, invierno: U.uInvierno.value, arboles: veg.arboles, enKayak: js.enKayak,
      cascada: cascada && cascada.pos,
      nahuelito: lomoVisible(),
    });
    // 3.5.1: con la cámara libre del modo foto (volar hasta la torre, la hora del deslizador) la foto
    // se guarda pero no cumple desafíos ni pedidos de cartas
    if (foto.activo) vistos.length = 0;
    const nuevos = vistos.filter((id) => !progreso.desafios[id]);
    if (!desafio) vecindadJuego?.deFotos(vistos);   // 3.6 (vida): la foto de un animal, para los vecinos
    // 1.11: si una carta pedía esta foto, queda guardada para mandarla con Ercilia
    if (!desafio) {
      const paraCarta = fotoParaPedidos(correo(), progreso, vistos, progreso.dia);
      if (paraCarta.length) setTimeout(() => nota('Esta foto sirve para una carta', `La de ${dePara(paraCarta[0])}. Dásela a Ercilia para que la mande con el tren`, true), 1600);
    }
    if (nuevos.length) {
      const mini = fotos.hacerMiniatura(lienzo);
      for (const id of nuevos) progreso.desafios[id] = { dia: progreso.dia, hora: progreso.horas, img: mini };
      guardarFotos(progreso.desafios);   // las imágenes, solo cuando hay una nueva
      const nombres = nuevos.map((id) => DESAFIOS.find((d) => d.id === id).nombre);
      setTimeout(() => { sonido.anotar(); nota(nombres.join(', '), nuevos.length > 1 ? 'Desafíos cumplidos, ya están en el álbum' : 'Desafío cumplido, ya está en el álbum', true); }, 600);
    }
  }
  $('hud').classList.remove('oculto');
  sonido.obturador();
  const f = $('flash'); f.classList.remove('dispara'); void f.offsetWidth; f.classList.add('dispara');
  progreso.fotos++;
  guardar();
  const nombre = `hojarasca-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png`;
  if (window.hojarasca?.guardarFoto) {
    try { const ruta = await window.hojarasca.guardarFoto(datos, nombre); nota('Foto guardada', ruta); return; } catch {}
  }
  bajarDatos(datos, nombre);
  nota('Foto guardada', 'En tu carpeta de descargas');
}
// 3.5.1: sin el puente de Electron la foto (y la lámina) se baja con un enlace. Con la dirección
// data: de varios MB, Chromium se quedaba con cada descarga (≈2 MB más por foto, para siempre);
// con un Blob y su dirección revocada al rato (como guardarFotoArchivo), la memoria vuelve.
function bajarDatos(datos, nombre) {
  const a = document.createElement('a');
  a.download = nombre;
  try {
    const coma = datos.indexOf(','), bin = atob(datos.slice(coma + 1)), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    a.href = URL.createObjectURL(new Blob([bytes], { type: datos.slice(5, datos.indexOf(';')) || 'image/png' }));
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch { a.href = datos; a.click(); }
}

let obrasAjenas = [];
function guardar() {
  if (reiniciandoPartida || !jugador) return false;
  // 3.5.1: durante el banco de pruebas el jugador va por el recorrido y la hora es la del tramo:
  // no se guarda (al cerrar la ventana a mitad quedaba la posición y la hora del banco)
  if (banco?.activa) return false;
  const m = T.lugares.muelle;
  const e = T.lugares.estacion;
  progreso.pos = jugador.estado.enKayak ? { x: m.punta.x, z: m.punta.z }
    : jugador.estado.enTren && e ? { x: e.espera.x, z: e.espera.z }
    // 3.6.1: sentado, se guarda donde estabas parado (el asiento puede caer adentro de un mueble)
    : jugador.estado.sentado && jugador.estado.salida ? { x: jugador.estado.salida.x, y: jugador.estado.salida.y, z: jugador.estado.salida.z }
    : { x: jugador.estado.pos.x, y: jugador.estado.pos.y, z: jugador.estado.pos.z };
  // 2.9: guardando arriba del velero se aparece en la orilla; colgado de la tirolesa, en la llegada
  const guardadoVela = vela?.paraGuardar();
  if (guardadoVela) progreso.pos = { x: guardadoVela.pos.x, z: guardadoVela.pos.z };
  if (jugador.estado.enCable && tirolesas?.posParaGuardar()) progreso.pos = tirolesas.posParaGuardar();
  if (vela) progreso.vela = guardadoVela ? guardadoVela.barco : vela.datos();
  progreso.yaw = jugador.estado.yaw;
  // 3.5.1: en el modo foto la hora es la del deslizador: se guarda la del juego
  const horasFoto = foto.activo && guardadoFoto ? progreso.horas : null;
  if (horasFoto !== null) progreso.horas = guardadoFoto.horas;
  // las miniaturas van aparte: si hay alguna nueva, se escribe su clave
  const conImagen = Object.values(progreso.desafios || {}).filter((d) => d && d.img).length;
  if (conImagen !== fotosGuardadas) { guardarFotos(progreso.desafios); fotosGuardadas = conImagen; }
  const ok = guardarProgreso(obrasAjenas.length ? { ...progreso, obras: [...(progreso.obras || []), ...obrasAjenas] } : progreso);
  if (horasFoto !== null) progreso.horas = horasFoto;   // 3.5.1: y sigue la del deslizador
  window.dispatchEvent(new CustomEvent('hojarasca:guardado', { detail: { ok, hora: Date.now() } }));
  if (!ok && !avisoGuardado) {
    avisoGuardado = true;
    nota('No se pudo guardar la partida', 'Puede que el navegador se haya quedado sin espacio');
  }
  return ok;
}


// Autosave sin tirones: las escrituras a localStorage son síncronas y pueden
// generar un pico perceptible si coinciden con render/sombras. El autosave
// periódico se difiere a tiempo ocioso; guardados explícitos siguen siendo
// inmediatos. Al ocultar/cerrar la ventana se fuerza un flush síncrono.
let guardadoSuavePendiente = false;
let idGuardadoSuave = 0;
function cancelarGuardadoSuave() {
  if (!guardadoSuavePendiente) return;
  if (typeof cancelIdleCallback === 'function' && idGuardadoSuave) cancelIdleCallback(idGuardadoSuave);
  else if (idGuardadoSuave) clearTimeout(idGuardadoSuave);
  guardadoSuavePendiente = false;
  idGuardadoSuave = 0;
}
function programarGuardadoSuave() {
  if (guardadoSuavePendiente || !jugador) return;
  guardadoSuavePendiente = true;
  const ejecutar = (deadline) => {
    // Si Chromium nos dio una ventana ociosa demasiado corta, conservamos el
    // guardado pendiente y esperamos la siguiente en vez de robar tiempo al frame.
    if (deadline && !deadline.didTimeout && deadline.timeRemaining() < 8) {
      idGuardadoSuave = requestIdleCallback(ejecutar, { timeout: 3500 });
      return;
    }
    guardadoSuavePendiente = false;
    idGuardadoSuave = 0;
    guardar();
  };
  if (typeof requestIdleCallback === 'function') idGuardadoSuave = requestIdleCallback(ejecutar, { timeout: 3500 });
  else idGuardadoSuave = setTimeout(ejecutar, 350);
}
function flushGuardadoSuave() {
  cancelarGuardadoSuave();
  guardar();
}

// ------------------------------------------------------------------ constelaciones
const nombresCielo = $('cielo-nombres');
const etiquetasCielo = [];
const mirada = new THREE.Vector3(), puntoCielo = new THREE.Vector3();
let acumuladoCielo = 0;
const tiempoMirando = {};
// 2.0: la luna de esta noche y las estrellas fugaces (ver `cielo-noche.js`)
const nocheCielo = { dia: -1, fase: 0.5, lluvia: false, vistas: 0, avisada: false, mirandoLuna: 0 };
const dirFugaz = new THREE.Vector3();
let azarCielo = Math.random;   // las pruebas lo fijan para ver una fugaz a pedido
function cieloDeLaNoche(dt, noche, luz) {
  const fase = faseLunar(progreso.dia, progreso.horas);
  nocheCielo.fase = fase;
  cielo.ponerLuna?.(fase, { ...luzDeLuna(fase), iluminada: iluminada(fase) });
  // la noche "es" del día en que empezó: pasada la medianoche sigue siendo la misma
  const diaNoche = progreso.horas < 12 ? progreso.dia - 1 : progreso.dia;
  if (diaNoche !== nocheCielo.dia) { nocheCielo.dia = diaNoche; nocheCielo.vistas = 0; nocheCielo.avisada = false; }
  const verano = clamp(1 - U.uOtono.value - U.uInvierno.value, 0, 1);
  nocheCielo.lluvia = nocheDeEstrellas(diaNoche, verano);
  const nub = clima.estado.nublado;
  const porMinuto = fugacesPorMinuto({ horas: progreso.horas, noche, nublado: nub, luna: iluminada(fase), lluvia: nocheCielo.lluvia });
  const visible = Math.max(0, noche - 0.35) * 1.5 * (1 - nub * 0.9);
  fugaces?.actualizar(dt, camara.position, Math.min(1, visible));
  if (modo !== 'jugando') return;
  // el primer aviso de la noche de la lluvia, apenas oscurece
  if (nocheCielo.lluvia && !nocheCielo.avisada && noche > 0.7 && nub < 0.6) {
    nocheCielo.avisada = true;
    nota('Esta noche llueven estrellas', 'Mirá hacia el norte, lejos del fuego y sin techo');
  }
  if (porMinuto > 0 && azarCielo() < (porMinuto / 60) * dt) {
    const f = fugaz(nocheCielo.lluvia, azarCielo);
    if (fugaces?.lanzar(f)) {
      // ¿la vio? Tiene que estar mirando para ese lado y a cielo abierto
      const a = (f.acimut * Math.PI) / 180, h = (f.altura * Math.PI) / 180;
      dirFugaz.set(-Math.sin(a) * Math.cos(h), Math.sin(h), -Math.cos(a) * Math.cos(h));
      camara.getWorldDirection(mirada);
      if (!bajoTecho && mirada.dot(dirFugaz) > 0.55) {
        nocheCielo.vistas++;
        diario.anotar('fugaz');
        if (nocheCielo.lluvia && nocheCielo.vistas >= FUGACES_PARA_ANOTAR && !progreso.entradas.geminidas) registrar('geminidas');
      }
    }
  }
  // la luna llena se anota mirándola un rato, como una constelación
  if (luz?.lunaDir && noche > 0.7 && nub < 0.6 && lunaAnotable(fase) && !progreso.entradas['luna-llena']) {
    camara.getWorldDirection(mirada);
    nocheCielo.mirandoLuna = mirada.dot(luz.lunaDir) > 0.95 ? nocheCielo.mirandoLuna + dt * (jugador.estado.zoom ? 2 : 1) : 0;
    if (nocheCielo.mirandoLuna > 2.2) registrar('luna-llena');
  }
}

function actualizarCielo(dt, noche, luz) {
  const brillo = constelaciones.actualizar(camara.position, noche, clima.estado.nublado);
  cieloDeLaNoche(dt, noche, luz);
  acumuladoCielo += dt;
  if (acumuladoCielo < 0.2) return;
  acumuladoCielo = 0;
  let n = 0;
  if (brillo > 0.25 && modo === 'jugando') {
    camara.getWorldDirection(mirada);
    for (const c of constelaciones.lista) {
      const alineado = mirada.dot(c.centro);
      if (alineado < 0.86) { tiempoMirando[c.id] = 0; continue; }
      puntoCielo.copy(c.centro).multiplyScalar(500).add(camara.position).project(camara);
      if (Math.abs(puntoCielo.x) > 0.92 || Math.abs(puntoCielo.y) > 0.92 || puntoCielo.z > 1) continue;
      let e = etiquetasCielo[n];
      if (!e) { e = document.createElement('b'); nombresCielo.appendChild(e); etiquetasCielo[n] = e; }
      const conocida = !!progreso.entradas[c.id];
      const texto = conocida ? c.nombre : '¿?';
      if (e.textContent !== texto) e.textContent = texto;
      e.style.left = `${(puntoCielo.x * 0.5 + 0.5) * 100}%`;
      e.style.top = `${(-puntoCielo.y * 0.5 + 0.5) * 100}%`;
      e.style.opacity = String(Math.min(1, (alineado - 0.86) * 12) * brillo);
      e.style.display = '';
      n++;
      // mirarla un rato la anota en el cuaderno
      if (!conocida) {
        tiempoMirando[c.id] = (tiempoMirando[c.id] || 0) + 0.2 * (jugador.estado.zoom ? 2 : 1);
        if (tiempoMirando[c.id] > 2.2) registrar(c.id);
      }
    }
  }
  for (let i = n; i < etiquetasCielo.length; i++) etiquetasCielo[i].style.display = 'none';
}

// ------------------------------------------------------------------ panel de rendimiento (F3)
const medidor = {
  visible: false, cuadros: 0, acumulado: 0, fps: 0, peor: 0,
  tLogica: 0, tRender: 0,
  picoMs: 0, picoDe: '-', picoT: 0,
  cuadrosLargos: 0, heapMB: 0, heapDeltaMB: 0, heapPrevMB: 0,
  // 3.2: los últimos 240 tiempos de cuadro de verdad (ms, en anillo, sin basura), los tirones
  // (cuadros de más del doble del objetivo) y el objetivo del ritmo
  tiempos: new Float32Array(240), orden: new Float32Array(240), iTiempo: 0, nTiempos: 0, tirones: 0, objetivoMs: 1000 / 60,
};
document.addEventListener('keydown', (e) => {
  if (e.code !== 'F3' || e.repeat) return;
  // 3.2: F3 no es de ninguna acción de fábrica; si el jugador se la dio a una, es de esa acción
  if (accionDeTecla(teclasPropias, 'F3')) return;
  e.preventDefault();
  alternarMedidor();
});
function alternarMedidor(visible = !medidor.visible) {
  medidor.visible = !!visible;
  medidor.peor = 0; medidor.nTiempos = 0; medidor.iTiempo = 0; medidor.tirones = 0; medidor.cuadrosLargos = 0;
  $('medidor').classList.toggle('oculto', !medidor.visible);
  $('medidor-grafico')?.classList.toggle('oculto', !medidor.visible);
  return medidor.visible;
}
// 3.2: el gráfico de F3: una barra por cuadro (los últimos 240), con la línea del objetivo y la
// del doble (arriba de ésa es un tirón). Se redibuja con el texto, dos veces por segundo.
function dibujarGraficoMedidor() {
  const c = $('medidor-grafico');
  const g = c?.getContext('2d');
  if (!g) return;
  const W = c.width, H = c.height, n = medidor.nTiempos, obj = medidor.objetivoMs;
  const tope = Math.max(obj * 3, 50);
  g.clearRect(0, 0, W, H);
  const ancho = W / medidor.tiempos.length;
  for (let i = 0; i < n; i++) {
    const ms = medidor.tiempos[(medidor.iTiempo - n + i + medidor.tiempos.length) % medidor.tiempos.length];
    g.fillStyle = ms > obj * 2 ? '#ff6a4d' : ms > obj * 1.25 ? '#f2c14e' : '#9fd88a';
    const h = Math.min(H, ms / tope * H);
    g.fillRect(i * ancho, H - h, Math.max(1, ancho - 0.3), h);
  }
  g.fillStyle = 'rgba(223,240,208,.9)'; g.fillRect(0, H - obj / tope * H, W, 1);
  g.fillStyle = 'rgba(255,106,77,.8)'; g.fillRect(0, H - Math.min(H, obj * 2 / tope * H), W, 1);
  g.fillStyle = '#dff0d0'; g.font = '11px ui-monospace, monospace';
  g.fillText(`${obj.toFixed(1)} ms`, 4, Math.max(11, H - obj / tope * H - 3));
}
function textoRitmo() {
  const hz = medidorRefresco.hz, l = ajustes.limiteFps;
  const monitor = hz ? `${hz.toFixed(hz > 99.5 ? 0 : 1)} Hz` : 'midiendo el monitor';
  const plan = planCadencia(l, medidorRefresco.periodoMs, l === 'auto' ? ritmoAuto.k : 0);
  let t;
  if (plan.modo === 'libre') t = `sin límite (${monitor})`;
  else if (plan.modo === 'vsync') t = `${l === 'auto' ? 'auto' : l}: ${monitor} ÷ ${plan.k} = ${plan.fps.toFixed(Math.abs(plan.fps - Math.round(plan.fps)) > 0.05 ? 1 : 0)} parejos`;
  else t = `${plan.fps} fijo (${monitor}${hz ? ': no lo divide, no puede ser parejo' : ''})`;
  if (l === 'auto' && ritmoAuto.k) t += `   p90 ${ritmoAuto.p90.toFixed(1)} ms   pasados ${(ritmoAuto.perdidos * 100).toFixed(0)}%`;
  return t;
}
function actualizarMedidor(dt, objetivoMs = medidor.objetivoMs) {
  // F3 apagado no debe generar basura ni ordenar muestras en segundo plano.
  if (!medidor.visible && !HOJARASCA_DEBUG) return;
  medidor.cuadros++;
  medidor.acumulado += dt;
  if (dt > 1 / 30) medidor.cuadrosLargos++;
  medidor.objetivoMs = objetivoMs;
  const msCuadro = dt * 1000;
  if (msCuadro > objetivoMs * 2) medidor.tirones++;
  medidor.tiempos[medidor.iTiempo] = msCuadro;
  medidor.iTiempo = (medidor.iTiempo + 1) % medidor.tiempos.length;
  medidor.nTiempos = Math.min(medidor.tiempos.length, medidor.nTiempos + 1);
  if (medidor.acumulado < 0.5) return;
  medidor.fps = medidor.cuadros / medidor.acumulado;
  medidor.cuadros = 0; medidor.acumulado = 0;
  // 3.2: el 1% peor como se mide siempre: el promedio del 1% de cuadros más largos, en cuadros/s
  const n = medidor.nTiempos;
  const ord = medidor.orden.subarray(0, n);
  ord.set(medidor.tiempos.subarray(0, n));
  ord.sort();
  const cuantos = Math.max(1, Math.round(n * 0.01));
  let suma = 0;
  for (let i = n - cuantos; i < n; i++) suma += ord[i];
  const p99 = n ? suma / cuantos / 1000 : 0;
  const info = renderer.info;
  const memoria = performance.memory;
  if (memoria?.usedJSHeapSize) {
    medidor.heapMB = memoria.usedJSHeapSize / 1048576;
    medidor.heapDeltaMB = medidor.heapPrevMB ? medidor.heapMB - medidor.heapPrevMB : 0;
    medidor.heapPrevMB = medidor.heapMB;
  }
  const lineaHeap = medidor.heapMB > 0 ? `heap ${medidor.heapMB.toFixed(0)} MB   Δ ${medidor.heapDeltaMB >= 0 ? '+' : ''}${medidor.heapDeltaMB.toFixed(1)} MB` : 'heap n/d';
  $('medidor').textContent = [
    `${medidor.fps.toFixed(0)} cuadros/s   (peor 1%: ${(1 / Math.max(p99, 1e-4)).toFixed(0)})`,
    `lógica ${medidor.tLogica.toFixed(1)} ms   dibujo ${medidor.tRender.toFixed(1)} ms`,
    `pico ${medidor.picoMs.toFixed(1)} ms (${medidor.picoDe})   >33ms ${medidor.cuadrosLargos}`,
    `${estadoRender.calls || info.render.calls} llamadas   ${((estadoRender.triangles || info.render.triangles) / 1000).toFixed(0)} mil triángulos`,
    `${info.memory.geometries} geometrías   ${info.programs?.length ?? 0} shaders   ${lineaHeap}`,
    `calidad ${ajustes.calidad}   ${Math.round(lienzo.width)}×${Math.round(lienzo.height)}`,
    // 3.5: la distancia de dibujo y la de plantas que rigen (lo de ahora: se acercan de a poco)
    `dibujo ${Math.round(veg?.alcanceArboles?.() ?? calidad.lejos)} m (${ajustes.distancia === 'calidad' ? 'según la calidad' : ajustes.distancia + ' bloques'})   plantas ${ajustes.distanciaPlantas}: pasto ${Math.round(pasto?.radio ?? 0)} m, matas ${Math.round(veg?.distancias?.().soto ?? 0)} m`,
    `presupuesto L${presupuestoAdaptativo.nivel}   frame EMA ${presupuestoAdaptativo.emaMs.toFixed(1)} ms`,
    // 3.2: el ritmo (objetivo parejo según el monitor), los tirones y lo que cuesta un cuadro
    `ritmo ${textoRitmo()}`,
    `tirones (>2× ${objetivoMs.toFixed(1)} ms) ${medidor.tirones}   cuadro ${costoCuadroEma.toFixed(1)} ms   placa ${msGpu >= 0 ? msGpu.toFixed(1) + ' ms' : 'n/d'}`,
    // 3.3: las luces del presupuesto fijo en uso y el modo fluido (resolución dinámica)
    `luces ${presupuestoLuces.stats.vivas}/${presupuestoLuces.puntuales + presupuestoLuces.focos} fijas (máx ${presupuestoLuces.stats.maxVivas})   fluido ${ajustes.modoFluido ? Math.round(escalaFluida * 100) + '%' : 'apagado'}`,
    `perfil ${perfilador.resumen(4) || 'sin muestras'}`,
  ].join('\n');
  if (medidor.visible) dibujarGraficoMedidor();
}

// ------------------------------------------------------------------ bucle
const inicioReloj = performance.now();
const relojCadencia = crearRelojCadencia(inicioReloj);
// 3.2: el ritmo parejo (ver rendimiento.js). El refresco del monitor se mide con los sellos de
// requestAnimationFrame toda la partida; Electron además avisa el del monitor donde está la
// ventana (y se le vuelve a preguntar cada tanto: la ventana se puede mudar de monitor).
const medidorRefresco = crearMedidorRefresco();
const ritmoAuto = crearRitmoAuto();
let cronometroGpu;            // undefined: sin probar todavía; null: la placa no lo tiene
let msGpu = -1, costoCuadroEma = 0;
function pedirRefrescoAlSistema() {
  const pedir = window.hojarasca?.refresco;
  if (typeof pedir !== 'function') return;
  Promise.resolve(pedir()).then((hz) => medidorRefresco.ponerPista(hz)).catch(() => {});
}
pedirRefrescoAlSistema();
if (window.hojarasca?.refresco) setInterval(pedirRefrescoAlSistema, 5000);
// Qué límite rige este cuadro. A mano (las pruebas llaman al bucle cuadro por cuadro) sigue
// como siempre: el número elegido con el reloj de siempre, y 'auto' vale 60.
function planDelCuadro(ahora, manual) {
  const l = ajustes.limiteFps;
  if (manual) return { modo: l === 'libre' ? 'libre' : 'fijo', k: 0, fps: l === 'libre' ? 0 : l === 'auto' ? 60 : Math.max(30, Number(l || 60)) };
  medidorRefresco.anotar(ahora);
  const P = medidorRefresco.periodoMs;
  return planCadencia(l, P, l === 'auto' && P ? ritmoAuto.objetivo(P) : 0);
}
// Contando vsyncs enteros cuando el límite divide al refresco; si no, el reloj de siempre.
function decidirCuadro(ahora, fpsLimitado, plan, manual) {
  if (plan.modo === 'vsync' && !manual) return relojCadencia.decidirVsync(ahora, medidorRefresco.periodoMs, plan.k);
  const cadencia = relojCadencia.decidir(ahora, fpsLimitado);
  return cadencia;
}
function usarCronometroGpu() {
  // 3.3: el modo fluido también mira la placa (además de auto y F3)
  if (!ajustes.modoFluido) { if (ajustes.limiteFps !== 'auto' && !medidor.visible) return false; }
  if (cronometroGpu === undefined) { try { cronometroGpu = crearCronometroGpu(renderer.getContext()); } catch { cronometroGpu = null; } }
  return !!cronometroGpu;
}
// Al final de cada cuadro dibujado: lo que costó (CPU y, si se puede, placa) alimenta el
// objetivo automático.
function cerrarCuadro(tCosto, cadencia, plan) {
  const cpu = performance.now() - tCosto;
  if (cronometroGpu) msGpu = cronometroGpu.leer();
  const costo = Math.max(cpu, msGpu);
  costoCuadroEma += (costo - costoCuadroEma) * 0.1;
  const P = medidorRefresco.periodoMs;
  if (plan.modo === 'vsync' && ajustes.limiteFps === 'auto' && P) ritmoAuto.anotar(costo, cadencia.vsyncs, P, msGpu >= 0);
  revisarModoFluido(msGpu >= 0 ? msGpu : costo, cadencia.pasoMs > 0 ? cadencia.pasoMs : 1000 / 60);
}
// 3.3: modo fluido (opcional): la resolución baja hasta 70% cuando la placa no llega al ritmo
// y vuelve a subir cuando sobra (ver rendimiento.js). Cambia el tamaño del lienzo y de las
// salidas del postproceso a lo sumo cada 2 s, de a 10%: nada de realocar en cada cuadro.
const escalaFluidaCtl = crearEscalaFluida();
const relacionPixelBase = renderer.getPixelRatio();
let escalaFluida = 1;
function aplicarEscalaFluida(e) {
  if (e === escalaFluida) return;
  escalaFluida = e;
  renderer.setPixelRatio(relacionPixelBase * e);
  if (post) post.redimensionar(window.innerWidth, window.innerHeight);
}
function revisarModoFluido(costoMs, objetivoMs) {
  if (!ajustes.modoFluido || modo !== 'jugando') {
    if (!ajustes.modoFluido && escalaFluida !== 1) { escalaFluidaCtl.reiniciar(); aplicarEscalaFluida(1); }
    return;
  }
  const nueva = escalaFluidaCtl.anotar(costoMs, objetivoMs, performance.now());
  if (nueva !== null) aplicarEscalaFluida(nueva);
}
const adelante = new THREE.Vector3();
let ambienteBichos = null;
let estadoTren = null;
let acumuladoBuscar = 0, acumuladoVecino = 99, acumuladoInteraccion = 99;
const posInteraccion = new THREE.Vector3(1e9, 0, 1e9);
let cacheAcopio = false, cacheCantero = null, cacheGallinero = null, cacheTelar = false, cacheObraTrabaja = null, cacheSemillaArbol = null;
let cacheObraAldea = null;   // 3.6: el lote de la obra de la aldea en que estás parado
let cacheMecanica = null;   // 3.6 (mecánicas): lo que se puede hacer acá en la aldea (ver aldea-mecanicas-mundo.js)
let cacheFuegoPropio = null, cacheHacha = null, cacheAserrar = false, cacheSemilla = null;
let marcaPerro = null;
const sujetosPerro = [];
const indiceSujetosPerro = crearIndiceEspacial2D(32);
// `existe` le dice al perro qué cosas son fichas de fauna del cuaderno: sólo esas guía
const mundoPerro = { noche: 0, guiar: false, existe: (id) => ENTRADA[id]?.seccion === 'fauna' };
let avisosDeGuia = 0;
const diario = crearDiario();
// 3.6 (vida): lo que se anota en el diario (la cosecha, la miel, la esquila, la obra terminada, el
// capítulo, el tren…) también lo ven los vecinos (ver `hechoDelDiario` en vecindad-juego.js)
{
  const anotarEnElDiario = diario.anotar;
  diario.anotar = (tipo, dato) => {
    const r = anotarEnElDiario.call(diario, tipo, dato);
    try { vecindadJuego?.delDiario(tipo, dato); } catch (e) { console.warn('vecindad', e); }
    return r;
  };
}
let avisoMarca = false;
const COLOR_RAYO = new THREE.Color('#cfe0ff');
let cascada = null;
let post = null;
let niebla = null;
let flotantes = null;
let bajoTecho = false;
let aves = null;
let renovales = null;
let refugioVivo = null;
let acumuladoRefugio = 0;
// Contextos reutilizados: evitan objetos temporales en el camino caliente.
const rastrosFauna = [];
const ctxMundoVivo = { horas: 0, dia: 0, noche: 0, invierno: 0, otono: 0, lluvia: 0, tormenta: false, peligros: [], escuchando: 0 };
// 1.8: el valle se entera del Desafío. Donde baja la nave, donde andan los invasores
// y donde está el nido, los animales no se quedan: se van y vuelven cuando pasa.
let acumuladoPeligros = 9;
const scratchPeligros = [];
// 1.8: qué suena y cuánto. La paleta la elige la estación, la hora y la lluvia; la
// mezcla suma lo que puso el jugador en los ajustes.
let acumuladoMusica = 9;
function actualizarSonidoAmbiente(dt) {
  acumuladoMusica += dt;
  if (acumuladoMusica < 4) return;
  acumuladoMusica = 0;
  const contexto = { horas: progreso.horas, invierno: U.uInvierno.value, otono: U.uOtono.value, lluvia: clima.estado.lluvia };
  const paleta = paletaMusical(contexto);
  paleta.espera = esperaHastaFrase(paleta);
  sonido.paleta = paleta;
  mezclaHoraActual = mezclaPorHora({ horas: progreso.horas, lluvia: clima.estado.lluvia, adentro: espacioAudioActual === 'adentro' ? 1 : 0 });
  aplicarMezcla();
}
// La mezcla final: las perillas del jugador, lo que acomoda la hora y —2.0— cuánto se
// corre el bosque cuando estás escuchando con atención.
let mezclaHoraActual = {}, escuchaAplicada = 0;
function aplicarMezcla() {
  const e = mezclaAlEscuchar(oidoAfinado);
  escuchaAplicada = oidoAfinado;
  sonido.setMezcla(
    { ambiente: ajustes.volumenAmbiente, efectos: ajustes.volumenEfectos, musica: ajustes.volumenMusica },
    { ...mezclaHoraActual, ambiente: (mezclaHoraActual.ambiente ?? 1) * e.ambiente, musica: (mezclaHoraActual.musica ?? 1) * e.musica },
  );
}

function actualizarPeligros(dt) {
  acumuladoPeligros += dt;
  if (acumuladoPeligros < 0.6) return;
  acumuladoPeligros = 0;
  scratchPeligros.length = 0;
  if (desafio) {
    const nave = desafio.nave;
    if (nave?.visible) scratchPeligros.push({ x: nave.position.x, z: nave.position.z, radio: 90, fuerza: 1 });
    const d = progreso.desafio;
    if (d?.nido && !d.nido.caido) scratchPeligros.push({ x: d.nido.x, z: d.nido.z, radio: 55, fuerza: 0.85 });
    let n = 0;
    for (const a of desafio.aliens) {
      if (n >= 6 || a.estado === 'morir' || a.estado === 'irse') continue;
      const p = a.m.g.position;
      scratchPeligros.push({ x: p.x, z: p.z, radio: 34, fuerza: 0.95 });
      n++;
    }
  }
  ctxMundoVivo.peligros = scratchPeligros;
}
const ctxEnMano = { velocidad: 0, enSuelo: false, luz: false, oculto: false };
const ctxDesafio = { noche: 0, dtReal: 0 };
const ctxClima = { invierno: 0, otono: 0, noche: 0, chimeneas: null, sonido: null, bajoTecho: false };
const ctxTren = { viento: 0, noche: 0 };
const ctxPesca = { horas: 0, nublado: 0, mosca: false, lluvia: 0, tormenta: false };
const ctxSonido = { cam: null, adelante: null, viento: 0, bosque: 0, arroyo: 0, orilla: 0, lluvia: 0, noche: 0, invierno: 0, otono: 0, fuego: null, bajoTecho: false, espacio: 'bosque', techo: null, panal: null, cascada: null, cercaMallin: false, puntoCercano: null };
let acumuladoInterior = 99, espacioAudioActual = 'bosque', bajoCubiertaActual = false, techoAudioActual = null;
const posInterior = new THREE.Vector3(1e9, 0, 1e9);
let acumuladoHabitat = 99, habitatActual = null;
const posHabitat = new THREE.Vector3(1e9, 0, 1e9);
const presupuestoAdaptativo = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3 });
const perfilador = crearPerfiladorSubsistemas();
const planificadorAntitirones = crearPlanificadorAntitirones({ objetivoMs: 16.7, maxPesadas: 1, maxSecundarias: 3 });
let dtVisualPost = 1 / 60;

// 3.6.2 (visual): las mallas instanciadas sin ninguna instancia (count 0: los árboles de una especie que
// no tiene ninguno cerca, la huerta sin plantar, las gallinas sin gallinero...) igual se mandaban a la
// placa: un dibujo vacío cada una, una docena por cuadro en la aldea de noche. Se apagan mientras se
// dibuja el cuadro y se vuelven a prender después (no se toca lo que decide cada sistema). Sólo se miran
// los hijos directos de la escena, que es donde viven.
const vaciasApagadas = [];
function apagarVacias() {
  const hijos = escena.children;
  for (let i = 0, n = hijos.length; i < n; i++) { const o = hijos[i]; if (o.isInstancedMesh && o.visible && o.count === 0) { o.visible = false; vaciasApagadas.push(o); } }
}
function prenderVacias() {
  for (let i = 0; i < vaciasApagadas.length; i++) vaciasApagadas[i].visible = true;
  vaciasApagadas.length = 0;
}
// Dibuja la escena: con post-procesado si la calidad lo permite, o directo
function dibujar(luz, noche) {
  apagarVacias();
  try { dibujarCuadro(luz, noche); } finally { prenderVacias(); }
}
function dibujarCuadro(luz, noche) {
  const medirRender = medidor.visible || HOJARASCA_DEBUG || banco.activa;
  if (post && ajustes.post !== 'apagado') {
    if (medirRender) { renderer.info.autoReset = false; renderer.info.reset(); }
    post.render({
      noche,
      rayos: bajoTecho ? 0 : (calidad.rayos || 0) * (luz ? luz.dia : 1) * (1 - clima.estado.nublado * 0.75) * (1 - clima.estado.lluvia * 0.8) * (0.9 + (luz?.rasante || 0) * 0.22),
      solDir: luz && luz.solDir && luz.solDir.y > 0.02 ? luz.solDir : null,
      colorSol: cielo.sol.color,
      tiempo: U.uTiempo.value,
      tarde: luz ? Math.max(luz.tarde, (luz.dorada || 0) * 0.75) : 0,   // 3.4: la hora dorada también dora la imagen
      nublado: clima.estado.nublado,
      humedad: Math.max(clima.estado.lluvia, clima.estado.nublado * 0.45),
      interior: espacioAudioActual === 'adentro' ? 1 : (bajoTecho ? 0.32 : 0),
      dt: dtVisualPost,
      exposicion: 1 + (luz ? (1 - luz.dia) * 0.05 : 0) - clima.estado.lluvia * 0.02,
    });
    if (medirRender) {
      const ri = renderer.info.render;
      estadoRender.calls = ri.calls; estadoRender.triangles = ri.triangles;
      renderer.info.autoReset = true;
    }
  } else {
    renderer.render(escena, camara);
    if (medirRender) { const ri = renderer.info.render; estadoRender.calls = ri.calls; estadoRender.triangles = ri.triangles; }
  }
}
let estadoRender = { calls: 0, triangles: 0 };
// 3.6 (optimizar): el permiso del planificador para montar lo de la aldea, armado una vez (antes era
// una función nueva en cada cuadro; ahora sólo se llama cuando hay algo para montar)
const permitirAldeaMundo = () => planificadorAntitirones.permitir('aldea-mundo', { pesada: true });
let avisoGuardado = false;
let fotosGuardadas = -1;
let textoTren = '';
let opacidadMiraPuesta = '';   // 2.6.1: la mira sólo se toca cuando cambia
let cantada = false;
let edificios = [];
const DIAS_ANIO = 12;
function nombreEstacion() {
  if (ajustes.estacion !== 'auto') return { verano: 'Verano', otono: 'Otoño', invierno: 'Invierno' }[ajustes.estacion] || 'Verano';
  if (U.uInvierno.value > 0.5) return 'Invierno';
  if (U.uOtono.value > 0.5) return 'Otoño';
  if (U.uOtono.value > 0.12) return 'Fin del verano';
  if (U.uInvierno.value > 0.12) return 'Fin del invierno';
  return 'Verano';
}
let vecino = null;
let anguloFaro = 0;
let chimeneas = [];
const miraPasto = new THREE.Vector3();
let acumuladoVeg = 0, acumuladoGuardado = 0, acumuladoLugares = 0, acumuladoFauna = 0, acumuladoEncargos = 9;
const pasoFauna = calidad.sombras ? 0 : 1 / 30;
let horaCine = 0;

// 2.0: la escarcha (ver `escarcha.js`)
let horaEscarcha = null;

// Cuando un animal tímido decide acercarse porque estás quieto, se cuenta una vez por
// especie y por sesión: alcanza para que el jugador entienda que esperar sirve.
const acercamientosAvisados = new Set();
const NOMBRE_ACERCA = { pudu: 'Un pudú', huemul: 'Un huemul' };
function contarAcercamientos() {
  while (acercamientos.length) {
    const especie = acercamientos.shift();
    if (acercamientosAvisados.has(especie)) continue;
    acercamientosAvisados.add(especie);
    nota(`${NOMBRE_ACERCA[especie] || 'Un animal'} se acerca`, 'Quedate quieto: todavía no te vio');
  }
}

function actualizarTiempo(dt) {
  const js = jugador.estado;
  // 3.5.1: en el modo foto manda el deslizador; "En movimiento" corre la hora pero no cambia el día
  // (se sumaban días sin fin poniendo 23.9 y esperando). Al salir vuelve la hora de antes.
  if (foto.activo) {
    if (ajustes.duracion !== 'reloj' && modo === 'jugando') progreso.horas = (progreso.horas + (dt * 24) / (ajustes.duracion * 60)) % 24;
    return;
  }
  if (ajustes.duracion === 'reloj') {
    const d = new Date();
    const antes = progreso.horas;
    progreso.horas = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    // 3.5.1: con la hora de tu reloj el día no cambiaba nunca a la medianoche (sólo durmiendo):
    // la huerta, el correo y los encargos quedaban quietos. Si esa noche ya se durmió, el día ya pasó.
    if (!desafio && antes - progreso.horas > 12 && progreso.relojNoche !== claveNocheReloj(d)) { progreso.dia++; nota(`Día ${progreso.dia}`, 'Amanece otra vez'); }
  } else if (modo === 'jugando') {
    // sentarse acelera el reloj, salvo con invasores cerca (no se saltea el ataque)
    // (3.6 (vida): y charlando: sentado a la mesa con un vecino, la charla no se come la tarde)
    // (3.6 (mecánicas): ni escuchando los cuentos del domingo o la música del baile)
    const escala = js.sentado && !desafio?.hayAtaque() && !charla.npc && !mecanicasAldea?.sinApuro() ? 40 : 1;
    progreso.horas += (dt * 24 * escala) / (ajustes.duracion * 60);
    if (progreso.horas >= 24) { progreso.horas -= 24; progreso.dia++; nota(`Día ${progreso.dia}`, 'Amanece otra vez'); }
  }
}

let acumuladoSombra = 99;
let horaSombra = -99;
const posSombra = new THREE.Vector3();
// 3.5: la distancia de dibujo y la de plantas (ver config.js). `calidadActiva`: la calidad que
// está andando (la automática la cambia en vivo; la elegida a mano rige al recargar). Se aplica
// en vivo: el corte de las construcciones y la niebla ya; los árboles, sus carteles y el
// sotobosque se acercan de a poco a lo nuevo (vegetacion.js); el pasto rellena sus búferes.
// Nada compila shaders nuevos: son los mismos programas con otros uniformes.
function aplicarDistancias(inmediato = false) {
  distActual = distanciasDe(calidadActiva, ajustes.distancia, ajustes.distanciaPlantas);
  calidad.lejos = distActual.lejos;   // el corte de las construcciones y la vía (lejos + 60)
  calidad.nieblaDistancia = distActual.niebla;
  veg?.ajustarDistancias({ lejos: distActual.lejos, plantas: distActual.plantas }, inmediato);
  pasto?.ajustar(distActual.plantas);
  textoAjustesDistancia();
}
function textoAjustesDistancia() {
  const t = $('texto-distancia');
  if (t) t.textContent = T_(textoDistanciaDibujo(distActual));
  const r = $('ajuste-distancia');
  if (r) r.value = String(ajustes.distancia === 'calidad' ? Math.min(BLOQUES_MAX, Math.max(BLOQUES_MIN, Math.round(distActual.bloques))) : ajustes.distancia);
}

// Lo que se puede acomodar sin rehacer el mundo se aplica ya (distancias de
// dibujo y detalle); la densidad de bosque y las sombras, al próximo arranque.
const CLAVES_CALIDAD_EN_VIVO = ['lod', 'lejos', 'sotobosque', 'detalleSuelo', 'radioPasto', 'niebla', 'flotantes', 'aves'];
function aplicarCalidadAutomatica(cambio) {
  const nueva = CALIDADES[cambio.hasta];
  if (!nueva) return;
  for (const k of CLAVES_CALIDAD_EN_VIVO) if (nueva[k] !== undefined) calidad[k] = nueva[k];
  // 3.5: la distancia de dibujo elegida por el jugador no se toca; «según la calidad» sigue a
  // la nueva (y ahora llega a los árboles, los carteles y la niebla, de a poco)
  calidadActiva = cambio.hasta;
  aplicarDistancias();
  // las sombras son lo más caro que se puede acomodar sin rehacer el mundo
  if (nueva.sombras !== calidad.sombras) {
    calidad.sombras = nueva.sombras;
    if (cielo?.ajustarSombras?.(nueva.sombras)) {
      renderer.shadowMap.enabled = nueva.sombras > 0;
      renderer.shadowMap.needsUpdate = true;
    }
  }
  ajustes.calidad = cambio.hasta;
  guardarAjustes(ajustes);
  sincronizarAjustes();
  $('aviso-calidad')?.classList.toggle('oculto', ajustes.calidad === calidadInicial);
  nota(cambio.aviso.texto, cambio.aviso.titulo, true);
}

// 2.7.3: las ayudas de `bucle`, afuera, para no rearmar tres funciones en cada cuadro.
// ¿El lugar `l` queda a menos de `r` del jugador (en planta)?
const cerca = (js, l, r) => Math.hypot(js.pos.x - l.x, js.pos.z - l.z) < r;
// ¿El lugar `l` queda a menos de `d` de la cámara (en planta)?
const alcance = (cam, l, d) => Math.hypot(cam.x - l.x, cam.z - l.z) < d;
// Las ventanas: de día devuelven el cielo, de noche el calor de adentro.
// El reflejo toma el color del horizonte, que es lo que se ve en un vidrio.
// `dia` es la luz del día del cuadro (1 si no hay cielo todavía).
function brilloVentana(v, f, dia) {
  const cielo = U.uCieloBajo.value;
  const reflejo = (1 - f) * dia * 0.22;
  // el vidrio nunca devuelve el cielo entero: se queda con una parte
  v.color.setRGB(
    0.07 + f * 1.4 + cielo.r * reflejo * 1.0,
    0.07 + f * 0.75 + cielo.g * reflejo * 0.98,
    0.08 + f * 0.25 + cielo.b * reflejo * 0.95,
  );
}

// `manual`: la medición de rendimiento lo llama cuadro por cuadro, sin que se reagende.
// 3.5.1: con el contexto 3D perdido el bucle espera (ver "caídas"); y si algo del cuadro tira
// una excepción, se anota una vez y el mundo se sigue dibujando (antes la pantalla quedaba
// congelada con el mismo error 60 veces por segundo).
function bucle(tRaf, manual = false) {
  if (!manual) requestAnimationFrame(bucle);
  if (estadoGraficos.perdidos) return;
  try { cuadroDelJuego(tRaf, manual); } catch (err) {
    fallaSistema('cuadro', err);
    try { if (luzUltimaFoto) dibujar(luzUltimaFoto, 1 - (luzUltimaFoto.dia ?? 1)); } catch (e2) { fallaSistema('dibujo', e2); }
  }
}
function cuadroDelJuego(tRaf, manual) {
  // 3.2: el reloj del cuadro es el sello de requestAnimationFrame: cae en el vsync y no tiembla
  // con lo que tardó en arrancar el callback. A mano (pruebas) sigue el reloj de siempre.
  const ahora = !manual && tRaf > 0 ? tRaf : performance.now();
  const plan = planDelCuadro(ahora, manual);
  const fpsLimitado = plan.modo === 'libre' ? 0 : plan.fps;
  const cadencia = decidirCuadro(ahora, fpsLimitado, plan, manual);
  if (!cadencia.dibujar) return;
  const tCosto = performance.now();
  const dtReal = Math.min(0.2, cadencia.dtReal);
  // cámara lenta del Desafío (último invasor de la noche, caída de la nodriza)
  const dt = Math.min(0.05, dtReal) * (desafio && modo === 'jugando' ? desafio.escalaTiempo : 1) * (foto.activo && foto.congelado ? 0 : 1);
  dtVisualPost = dt;
  // 3.2: el objetivo es lo que dura el cuadro en pantalla (k refrescos con el ritmo parejo)
  const objetivoMs = cadencia.pasoMs > 0 ? cadencia.pasoMs : 1000 / 60;
  presupuestoAdaptativo.actualizar(dtReal, objetivoMs);
  planificadorAntitirones.comenzarCuadro(dtReal, presupuestoAdaptativo.nivel, objetivoMs);
  const factorEfectos = factorEfectosPorPresupuesto(presupuestoAdaptativo.nivel);
  if (modo === 'carga') return;
  // La calidad se acomoda sola: si el equipo no da, baja un escalón; si sobra, sube.
  if (modo === 'jugando' && ajustes.autoCalidad !== false) {
    const cambio = revisarCalidad(autoCalidad, dtReal);
    if (cambio) aplicarCalidadAutomatica(cambio);
  }
  const medirRendimiento = medidor.visible || HOJARASCA_DEBUG || banco.activa;
  const tInicio = medirRendimiento ? performance.now() : 0;
  U.uTiempo.value += dt;

  // estaciones con transición suave; en modo automático avanzan con los días
  let oto = ajustes.estacion === 'otono' ? 1 : 0, inv = ajustes.estacion === 'invierno' ? 1 : 0;
  if (ajustes.estacion === 'auto') {
    const fase = (((progreso.dia - 1 + progreso.horas / 24) % DIAS_ANIO) + DIAS_ANIO) % DIAS_ANIO / DIAS_ANIO;
    // verano · otoño · invierno, con una transición que dura casi un día entero
    oto = smoothstep(0.30, 0.40, fase) * (1 - smoothstep(0.63, 0.73, fase));
    inv = smoothstep(0.63, 0.73, fase) * (1 - smoothstep(0.96, 1.0, fase));
  }
  U.uOtono.value = lerp(U.uOtono.value, oto, 1 - Math.exp(-dt * 1.5));
  U.uInvierno.value = lerp(U.uInvierno.value, inv, 1 - Math.exp(-dt * 1.5));
  if (Math.abs(U.uOtono.value - oto) < 0.01) U.uOtono.value = oto;
  if (Math.abs(U.uInvierno.value - inv) < 0.01) U.uInvierno.value = inv;
  gente?.abrigar?.(U.uInvierno.value > 0.5);   // 3.7.0: la ropa de abrigo, con el invierno

  const js = jugador.estado;
  if (modo === 'inicio') {
    // cámara de portada: vuelo lento sobre el lago
    horaCine += dt;
    const a = horaCine * 0.018 + 3.6;
    camara.position.set(LAGO.x + Math.cos(a) * 55, 7 + Math.sin(horaCine * 0.05) * 1.5, LAGO.z + Math.sin(a) * 55);
    camara.lookAt(LAGO.x + Math.cos(a + 0.9) * 170, 14, LAGO.z + Math.sin(a + 0.9) * 170);
    if (camara.fov !== 60) { camara.fov = 60; camara.updateProjectionMatrix(); }
  } else if (modo === 'jugando' || jugador.estado.enTren || jugador.estado.enKayak) {
    // en el tren o en el kayak la cámara sigue al vehículo aunque estés mirando el cuaderno
    if (banco.activa) actualizarBanco(dtReal);
    else if (libre.activa) moverCamaraLibre(foto.activo ? dtReal : dt);
    else { leerMando(dt); jugador.actualizar(dt); }
  }
  // la paciencia se mide en tiempo de reloj: sentarse acelera el día, no a los animales
  if (modo === 'jugando') avanzarCalma(jugador.estado, dtReal);
  jugador.estado.botas = !!progreso.cosas?.botas;   // 2.1: las botas de goma (ver `percepcion.js`)
  contarAcercamientos();
  actualizarEscucha(dtReal);
  // 3.5.1: en el modo foto la hora es la del deslizador: los tendales, la colmena y el ahumadero no cuentan ese tiempo
  if (modo === 'jugando') { if (!foto.activo) actualizarTendales(); actualizarRastros(dtReal); revisarEstacion(); }
  if (modo === 'jugando') actualizarMaquinas(dt);   // 2.9: el molino, el aserradero y la estación
  if (modo === 'jugando' && !desafio) { revisarColmenas(dtReal); actualizarLomo(dtReal); }
  actualizarTiempo(dt);

  const cam = camara.position;
  U.uJugador.value.copy(js.pos);
  acumuladoVeg += dt;
  if (acumuladoVeg > presupuestoAdaptativo.intervalo(0.25, 1.7) && planificadorAntitirones.permitir('vegetacion', { pesada: true })) { veg.actualizar(cam, presupuestoAdaptativo.factorDetalle()); objetos.actualizar(cam); acumuladoVeg = 0; }
  camara.getWorldDirection(miraPasto);
  pasto.actualizar(cam, miraPasto, presupuestoAdaptativo.factorDetalle(0.78));

  const k = T.indice(cam.x, cam.z);
  const ref = T.lugares.refugio;
  // Consultas de interior/hábitat recorren obras; se cachean temporalmente y
  // se invalidan si el jugador cambia de posición de forma apreciable.
  acumuladoInterior += dt;
  const movioInterior = Math.hypot(js.pos.x - posInterior.x, js.pos.z - posInterior.z) > 0.65 || Math.abs(js.pos.y - posInterior.y) > 0.5;
  if ((acumuladoInterior >= 0.12 && acumuladoInterior >= presupuestoAdaptativo.intervalo(0.12, 1.45)) || movioInterior) {
    acumuladoInterior = 0;
    posInterior.copy(js.pos);
    espacioAudioActual = espacioDeAudio();
    bajoCubiertaActual = espacioAudioActual !== 'bosque' || !!obras?.bajoCubierta?.(js.pos) || !!aldeaMundo?.bajoCubierta(js.pos);   // 3.6: (y las galerías de la aldea)
    techoAudioActual = techoDeAudio();
  }
  bajoTecho = bajoCubiertaActual;
  acumuladoHabitat += dt;
  const luzCielo = cielo.actualizar(progreso.horas, clima.estado, cam, 0);
  luzUltimaFoto = luzCielo;
  const noche = 1 - luzCielo.dia;
  obras?.actualizarAmbiente?.(noche);

  if (cascada) cascada.actualizar(dt, cam);
  // la bruma, las partículas y las aves solo deciden visibilidad y centro:
  // con cinco veces por segundo alcanza, y el movimiento lo hace el shader
  acumuladoAmbiente += dt;
  const tAmbiente = perfilador.iniciar(medirRendimiento);
  if (acumuladoAmbiente > presupuestoAdaptativo.intervalo(0.2, 1.8) && planificadorAntitirones.permitir('ambiente', { pesada: true })) {
    acumuladoAmbiente = 0;
    if (niebla) { niebla.actualizar(progreso.horas, clima.estado, U.uInvierno.value, cam); niebla.malla.visible = niebla.malla.visible && !bajoTecho; }
    if (flotantes) flotantes.actualizar(cam, luzCielo ? luzCielo.dia : 1, bajoTecho, factorEfectos);
    if (aves) { aves.actualizar(cam, luzCielo ? luzCielo.dia : 1, clima.estado.lluvia, Math.max(0.65, factorEfectos)); if (bajoTecho && aves.puntos) aves.puntos.visible = false; }
  }
  perfilador.terminar('ambiente', tAmbiente, medirRendimiento);
  if (puertas) {
    puertas.actualizar(dt);
    // empujar la puerta: si caminás de frente contra una cerrada, se abre sola
    const jsP = jugador.estado;
    if (modo === 'jugando' && !jsP.enTren && !jsP.enKayak && jsP.velocidadActual > 0.6) {
      const p = puertas.cerca(jsP.pos, 1.7);
      if (p && !p.postigo && p.objetivo < 0.5) {
        const hacia = Math.atan2(-(p.x - jsP.pos.x), -(p.z - jsP.pos.z));
        const dif = Math.abs(Math.atan2(Math.sin(hacia - jsP.yaw), Math.cos(hacia - jsP.yaw)));
        if (dif < 0.7) puertas.accionar(p);
      }
    }
  }
  // el refugio se actualiza de a ratos, y solo si estás cerca
  if (enMano) {
    enMano.mostrar(ranuras[elegida]?.id);
    ctxEnMano.velocidad = js.velocidadActual || 0;
    ctxEnMano.enSuelo = js.enSuelo;
    ctxEnMano.luz = !!(linterna && linterna.intensity > 0);
    // 2.9: en la cabina las dos manos van en el regulador y el freno
    ctxEnMano.oculto = js.enKayak || pesca.est.equipada || js.sentado || modo !== 'jugando' || (js.enTren && tren.conduciendo());
    ctxEnMano.bloqueo = !!desafio?.bloqueando;
    ctxEnMano.tension = !!desafio?.tensando;
    try { enMano.actualizar(dt, ctxEnMano); } catch (e) { fallaSistema('en-mano', e); }
  }
  try { actualizarMundoPersonal(dt, js); } catch (e) { fallaSistema('personal', e); }   // 2.8: tu sombra, tu mano y tu bandera
  if (modoObra && obras) {
    const adelante = obras.plano?.distancia || (obras.plano?.pieza ? 2.4 : 5.5);
    const fx = js.pos.x - Math.sin(js.yaw) * adelante;
    const fz = js.pos.z - Math.cos(js.yaw) * adelante;
    const estadoObra = obras.moverFantasma(fx, fz, js.yaw, js.pos.y);
    actualizarEstadoSitioObra(estadoObra);
  }
  if (modo === 'jugando') revisarPistas(dt);
  if (!esDesafio) revisarGuiaRelax(dt);
  try { if (!esDesafio) valle?.actualizar(dt); } catch (e) { fallaSistema('valle', e); }   // 3.1: la historia y los eventos del valle
  try { veg.actualizarCaidas(dt); } catch (e) { fallaSistema('caidas-arboles', e); }
  try { if (modo === 'jugando') { actualizarMajada(dt); actualizarCasaViva(dt); } } catch (e) { fallaSistema('majada/casa', e); }
  try { if (modo === 'jugando' && gallinasMundo) gallinasMundo.actualizar(dt, progreso.horas, jugador.estado.pos); } catch (e) { fallaSistema('gallinero', e); }
  try { if (modo === 'jugando' && !desafio) revisarCorreo(); } catch (e) { fallaSistema('correo', e); }
  try { if (modo === 'jugando' && !foto.activo) revisarTormenta(dt); } catch (e) { fallaSistema('tormenta', e); }   // 3.5.1: ni la tormenta en el modo foto
  try { if (modo === 'jugando') actualizarCaballo(dt); } catch (e) { fallaSistema('caballo', e); }
  try { if (modo === 'jugando') modos?.actualizar(dt); } catch (e) { fallaSistema('modos', e); }   // 3.1: la carrera en curso, el desafío del día y el torneo
  try { if (modo === 'jugando') actualizarFeria(); } catch (e) { fallaSistema('feria', e); }
  try { if (modo === 'jugando') revisarLogrosRelax(dt); } catch (e) { fallaSistema('logros', e); }
  if (modo === 'jugando' && progreso.dia !== diaRebrote) revisarRebrote();
  if (modo === 'jugando' && (progreso.dia !== diaHuerta || (clima?.estado?.lluvia || 0) > 0.35)) revisarHuerta();
  acumuladoVisible += dt;
  if (acumuladoVisible > presupuestoAdaptativo.intervalo(0.25, 2.0) && planificadorAntitirones.permitir('visibilidad', { pesada: true })) { acumuladoVisible = 0; actualizarVisibilidad(cam, presupuestoAdaptativo.factorDetalle()); }
  // 3.6: la aldea: lo que llegó del Worker se monta de a uno (si el cuadro anda bien) y lo de
  // adentro, las puertas, las sombras y los álamos según la distancia
  if (aldeaMundo) { try { aldeaMundo.actualizar(dt, cam, permitirAldeaMundo); } catch (e) { fallaSistema('aldea-mundo', e); } }
  // 3.6 (mecánicas): la bandera, la campana, los gestos de los oficios, los sonidos y el baile (sólo cerca)
  if (mecanicasAldea && modo === 'jugando') { try { mecanicasAldea.actualizar(dt, cam); } catch (e) { fallaSistema('aldea-mecanicas', e); } }
  acumuladoRefugio += dt;
  if (refugioVivo && acumuladoRefugio > presupuestoAdaptativo.intervalo(1.5, 1.5) && planificadorAntitirones.permitir('refugio-vivo', { pesada: true })) {
    acumuladoRefugio = 0;
    if (refugioVivo.cerca(js.pos)) refugioVivo.reconstruir(progreso);
  }
  // las nubes tapan el sol de a ratos: la sombra corre por el valle
  U.uNubes.value = clima.estado.nublado * (luzCielo ? luzCielo.dia : 1) * 0.85;
  U.uDetalleSuelo.value = calidad.detalleSuelo ?? 1;
  U.uBosqueLejos.value = veg.alcanceArboles();   // 3.5: el borde del bosque de ahora (se corre de a poco)
  const tClima = perfilador.iniciar(medirRendimiento);
  diario.clima(dt, clima.estado, U.uInvierno.value);
  // tormenta: el relámpago enciende el valle un instante y el trueno llega después
  const fogonazo = clima.actualizarTormenta(dt, cam, sonido);
  if (fogonazo > 0.004) {
    cielo.sol.intensity += fogonazo * 3.2;
    cielo.hemi.intensity += fogonazo * 2.6;
    escena.fog.color.lerp(COLOR_RAYO, Math.min(0.7, fogonazo * 0.8));
  }
  actualizarTinte(dt, progreso.horas, luzCielo, clima.estado.lluvia, U.uInvierno.value);
  actualizarCielo(dt, noche, luzCielo);
  ctxClima.invierno = U.uInvierno.value; ctxClima.otono = U.uOtono.value; ctxClima.noche = noche;
  ctxClima.chimeneas = chimeneasTodas || chimeneas; ctxClima.sonido = sonido; ctxClima.bajoTecho = bajoTecho;
  if (aldeaMundo) ctxClima.chimeneas = aldeaMundo.chimeneasCerca(cam, ctxClima.chimeneas);   // 3.6: en la aldea, el humo sale de las chimeneas más cercanas
  // 3.6.2 (visual): con lluvia, los techos de alrededor (las gotas que llegan a uno se cortan ahí)
  if (clima.estado.lluvia > 0.05 && U.uInvierno.value <= 0.5 && !bajoTecho) { try { revisarMapaLluvia(cam, dt); ctxClima.techos = mapaLluvia; } catch (e) { ctxClima.techos = null; fallaSistema('techos-lluvia', e); } }
  try { clima.actualizar(dt, cam, ctxClima); } catch (e) { fallaSistema('clima', e); }
  // 2.1: el frente que viene se ve sobre la cordillera (ver `pronostico.js`)
  if (cielo?.uniforms) {
    const quiere = frente(clima.estado.objetivo, clima.estado.proximo, horasFaltantesClima());
    cielo.uniforms.uFrente.value += (quiere - cielo.uniforms.uFrente.value) * Math.min(1, dt * 0.5);
  }
  // 2.0: la escarcha de la mañana (ver `escarcha.js`). Se acomoda al paso de las horas
  // del juego, no del reloj: sentado viendo pasar la mañana se derrite rápido, y al
  // despertar después de dormir de corrido ya está como corresponde.
  {
    const quiere = escarchaDe({ horas: progreso.horas, invierno: U.uInvierno.value, otono: U.uOtono.value,
      nublado: clima.estado.nublado, lluvia: clima.estado.lluvia, viento: clima.estado.vientoBase ?? clima.estado.viento });
    const ahoraH = progreso.dia * 24 + progreso.horas;
    // si el reloj salta para atrás (cargar una partida), se acomoda de una
    const salto = horaEscarcha === null ? 24 : ahoraH - horaEscarcha;
    const dh = salto < 0 ? 24 : Math.min(24, salto);
    horaEscarcha = ahoraH;
    U.uEscarcha.value = lerp(U.uEscarcha.value, quiere, 1 - Math.exp(-dh / 0.25));
    jugador.estado.escarcha = U.uEscarcha.value;
    diario.escarcha?.(U.uEscarcha.value);
  }
  try { huellas?.actualizar(dt, jugador.estado, U.uInvierno.value, clima.estado.lluvia); } catch (e) { fallaSistema('huellas', e); }
  perfilador.terminar('clima', tClima, medirRendimiento);
  acumuladoFauna += dt;
  const tFauna = perfilador.iniciar(medirRendimiento);
  if ((modo === 'jugando' || modo === 'inicio') && acumuladoFauna >= pasoFauna) {
    const df = acumuladoFauna;
    acumuladoFauna = 0;
    ctxMundoVivo.horas = progreso.horas; ctxMundoVivo.dia = luzCielo.dia; ctxMundoVivo.noche = noche;
    ctxMundoVivo.escuchando = oidoAfinado;
    ctxMundoVivo.invierno = U.uInvierno.value; ctxMundoVivo.otono = U.uOtono.value;
    // Compatibilidad RC16: tormenta: !!clima.estado.tormenta
    ctxMundoVivo.lluvia = clima.estado.lluvia; ctxMundoVivo.tormenta = !!clima.estado.tormenta;
    actualizarPeligros(df);
    actualizarSonidoAmbiente(df);
    veg.pintarTocones?.(U.uInvierno.value);
    try { fauna.actualizar(df, jugador, camara, ctxMundoVivo); } catch (e) { fallaSistema('fauna', e); }
    iniciarFrameEcosistema();
    try { vida.actualizar(df, jugador, camara, ctxMundoVivo); } catch (e) { fallaSistema('vida', e); }
    try { ambienteBichos = bichos.actualizar(df, jugador, camara, ctxMundoVivo); } catch (e) { fallaSistema('bichos', e); }
    rastrosFauna.length = 0;
    for (const s of vida.sujetos?.() || []) rastrosFauna.push(s);
    for (const s of bichos.rastros?.() || []) rastrosFauna.push(s);
    if (rastro && mundoPerro.rastro && !mundoPerro.rastro.esperar) { pisadaRastro.tipo = ['huemul', 'zorro', 'guanaco', 'liebre'].includes(rastro.tipo) ? rastro.tipo : 'zorro'; rastrosFauna.push(pisadaRastro); }
    huellas?.actualizarFauna?.(rastrosFauna, U.uInvierno.value);
    // La lista que usa el perro sólo cambia cuando se actualiza la fauna.
    sujetosPerro.length = 0;
    for (const s of fauna.sujetos()) sujetosPerro.push(s);
    for (const s of vida.sujetos()) sujetosPerro.push(s);
    for (const s of bichos.sujetos()) sujetosPerro.push(s);
    indiceSujetosPerro.reconstruir(sujetosPerro, (s) => s.pos);
  }
  perfilador.terminar('fauna', tFauna, medirRendimiento);
  if (estadoTren && estadoTren.guarda) {
    gente.ubicarGuarda(estadoTren.guarda, estadoTren.guarda.rumbo, js.enTren);
    // la vuelta completa al anillo, para el encargo de Elsa
    if (js.enTren && estadoTren.recorrido >= estadoTren.vuelta * 0.98) {
      tren.reiniciarVuelta();
      progreso.vueltas = (progreso.vueltas || 0) + 1;
      diario.anotar('vuelta');
      if (progreso.vueltas === 1) nota('Diste la vuelta completa', 'Dos kilómetros de anillo sin bajarte', true);
      guardar();
    }
  }
  const tNPC = perfilador.iniciar(medirRendimiento);
  if (modo === 'jugando' || modo === 'inicio') {
    try { gente.actualizar(dt, js, camara, charla.npc, presupuestoAdaptativo.nivel); } catch (e) { fallaSistema('gente', e); }
    mundoPerro.noche = noche;
    mundoPerro.ataque = desafio && modo === 'jugando' ? desafio.objetivoPerro(js, perro.est.pos) : null;
    // 2.0: en el Desafío se queda duro mirando hacia lo que vos no ves
    mundoPerro.alerta = desafio && modo === 'jugando' && !mundoPerro.ataque ? desafio.alertaPerro?.() || null : null;
    // 2.0: en el Relax el perro te lleva hasta la fauna que te falta anotar
    mundoPerro.guiar = !desafio && modo === 'jugando';
    try { if (modo === 'jugando') actualizarRastro(dt); } catch (e) { fallaSistema('rastro', e); }
    try { if (modo === 'jugando') actualizarVisitas(dt); } catch (e) { fallaSistema('visitas', e); }
    try { if (modo === 'jugando') actualizarAldea(dt); } catch (e) { fallaSistema('aldea', e); }   // 3.1 (3.6: la aldea)
    if (modo !== 'jugando' && renglonAldea && renglonAldea.style.display !== 'none') decirCharlaAldea(null);   // 3.6: en pausa no se oye
    if (modo === 'jugando' && (relojSync -= dt) <= 0) { relojSync = 10; copiarASync(); }
    try { marcaPerro = perro.actualizar(dt, jugador, camara, mundoPerro, indiceSujetosPerro); } catch (e) { fallaSistema('perro', e); }
    if (perro.est.empezoAGuiar) {
      perro.est.empezoAGuiar = null;
      // se avisa las primeras veces, hasta que el jugador entiende el gesto
      if (avisosDeGuia < 3) { avisosDeGuia++; nota('El perro encontró un rastro', 'Seguilo: te lleva hasta algo que no anotaste'); }
    }
  }
  perfilador.terminar('npc/perro', tNPC, medirRendimiento);
  ctxTren.viento = clima.estado.viento; ctxTren.noche = noche;
  // 2.9: manejando, W y S (o el stick del mando) son el regulador y el freno
  ctxTren.acelera = modo === 'jugando' && js.enTren && (jugador.teclas.has('KeyW') || jugador.teclas.has('ArrowUp'));
  ctxTren.frena = modo === 'jugando' && js.enTren && (jugador.teclas.has('KeyS') || jugador.teclas.has('ArrowDown'));
  // 2.9: con la pausa, un menú o un panel abierto, el tren que manejás se queda congelado
  ctxTren.pausado = js.enTren && tren.conduciendo() && (modo !== 'jugando' || personalAbierto() || enLasCargas() || enElAlmacen || enLaFeria || mochilaAbierta || !!charla.npc || foto.activo);
  estadoTren = tren.actualizar(dt, jugador, camara, ctxTren);
  actualizarCabina(ctxTren.pausado ? 0 : dt);

  try { if (!kayak.est.activo) kayak.actualizar(dt, () => false, jugador, U.uTiempo.value); } catch (e) { fallaSistema('kayak', e); }
  kayak.remo.visible = kayak.est.activo && !pesca.est.equipada;
  // 2.9: el velero amarrado se mece (y aparece con el varadero); los cables y puentes siguen a sus puntas
  try { vela?.actualizarQuieto(dt, U.uTiempo.value); } catch (e) { fallaSistema('vela', e); }
  try { tirolesas?.actualizar(dt, jugador); } catch (e) { fallaSistema('tirolesas', e); }
  if (modo === 'jugando') {
    if (js.nadando && pesca.est.equipada) pesca.equipar(false);
    try { pesca.actualizar(dt, jugador, mundoPesca()); } catch (e) { fallaSistema('pesca', e); }
  }
  if (desafio && modo === 'jugando') {
    const tDesafio = perfilador.iniciar(medirRendimiento);
    ctxDesafio.noche = noche;
    ctxDesafio.dtReal = Math.min(0.1, dtReal);
    try { desafio.actualizar(dt, ctxDesafio); } catch (e) { fallaSistema('desafio', e); }
    perfilador.terminar('desafio', tDesafio, medirRendimiento);
  }

  // las ventanas se encienden de noche; las luces solo si estás cerca
  const encendido = smoothstep(0.35, 0.8, noche);
  // (2.7.3: `brilloVentana` y `alcance` viven arriba de `bucle`)
  const diaInterior = luzCielo ? luzCielo.dia : 1;
  const rellenoInterior = 0.55 + diaInterior * (2.25 - clima.estado.nublado * 0.55);
  const colorInterior = U.uCieloBajo.value;
  ref.luz.intensity = encendido * 4 * (alcance(cam, ref, 60) ? 1 : 0);
  if (ref.interior) {
    ref.interior.intensity = alcance(cam, ref, 22) ? rellenoInterior : 0;
    ref.interior.color.copy(colorInterior).lerp(COLOR_RAYO, encendido * 0.08);
  }
  brilloVentana(ref.vidrio, encendido, diaInterior);
  if (ref.farol) {
    brilloVentana(ref.farol.vidrio, encendido * 0.9, diaInterior);
    ref.farol.luz.intensity = encendido * 2.2 * (alcance(cam, ref, 45) ? 1 : 0);
  }
  for (const p of tren.paradas) {
    brilloVentana(p.vidrio, encendido, diaInterior);
    p.luz.intensity = encendido * (p.chica ? 2.4 : 3.4) * (alcance(cam, p, 60) ? 1 : 0);
  }
  for (const cab of est.cabañas) {
    brilloVentana(cab.vidrio, encendido, diaInterior);
    const cerquita = alcance(cam, cab, 22);
    cab.luz.intensity = encendido * 3.2 * (alcance(cam, cab, 55) ? 1 : 0);
    cab.interior.intensity = cerquita ? rellenoInterior * 0.88 : 0;
    cab.interior.color.copy(colorInterior).lerp(COLOR_RAYO, encendido * 0.08);
  }
  if (est.molino) {
    if (est.molino.luzInterior) {
      est.molino.luzInterior.intensity = alcance(cam, est.molino, 16) ? rellenoInterior * 0.95 : 0;
      est.molino.luzInterior.color.copy(colorInterior).lerp(COLOR_RAYO, encendido * 0.06);
    }
    const v = dt * (0.25 + clima.estado.viento * 1.9);
    est.molino.aspas.rotation.z += v;
    // adentro, la rueda dentada y la muela giran con las aspas, más despacio
    if (est.molino.rueda) est.molino.rueda.rotation.y += v * 0.42;
  }
  if (est.cueva) {
    // adentro del alero hace falta algo de luz para ver las pinturas
    est.cueva.luz.intensity = Math.hypot(cam.x - est.cueva.x, cam.z - est.cueva.z) < 16 ? 5.5 + encendido * 2 : 0;
  }
  if (est.almacen) {
    brilloVentana(est.almacen.vidrio, encendido, diaInterior);
    est.almacen.luz.intensity = encendido * 3.2 * (alcance(cam, est.almacen, 45) ? 1 : 0);
    est.almacen.interior.intensity = alcance(cam, est.almacen, 22) ? rellenoInterior * 0.92 : 0;
    est.almacen.interior.color.copy(colorInterior).lerp(COLOR_RAYO, encendido * 0.08);
  }
  // 3.6: la aldea: ventanas, faroles y la luz de adentro (el presupuesto de luces elige las cercanas)
  aldeaMundo?.luces(cam, encendido, diaInterior, rellenoInterior, colorInterior);
  if (est.galpon) {
    est.galpon.molino.children[0].rotation.z += dt * (0.8 + clima.estado.viento * 4.5);
    brilloVentana(est.galpon.vidrio, encendido, diaInterior);
    est.galpon.luz.intensity = encendido * 2.6 * (alcance(cam, est.galpon, 45) ? 1 : 0);
    est.galpon.interior.intensity = alcance(cam, est.galpon, 24) ? rellenoInterior : 0;
    est.galpon.interior.color.copy(colorInterior).lerp(COLOR_RAYO, encendido * 0.07);
  }
  if (est.faro) {
    const f = est.faro;
    const prendido = smoothstep(0.25, 0.6, noche);
    f.vidrio.color.setRGB(0.18 + prendido * 2.4, 0.16 + prendido * 2.0, 0.13 + prendido * 1.2);
    f.brillo.intensity = prendido * 6;
    anguloFaro += dt * 0.55;
    if (f.lente) f.lente.rotation.y = anguloFaro;   // la lente gira con el haz
    f.blanco.position.set(f.x + Math.sin(anguloFaro) * 60, f.y + 1.5, f.z + Math.cos(anguloFaro) * 60);
    const haciaVos = Math.cos(anguloFaro - Math.atan2(cam.x - f.x, cam.z - f.z));
    f.haz.intensity = prendido * 120 * (alcance(cam, f, 220) ? 1 : 0) * smoothstep(0.2, 0.9, haciaVos);
  }

  if (modo === 'jugando') {
    // pasos y chapuzones
    while (jugador.eventos.paso.length) { const f = jugador.eventos.paso.shift(); if (js.montado) sonido.casco?.(js.superficie, f); else sonido.paso(js.superficie, f, js.corriendo); }
    while (jugador.eventos.chapuzon.length) { jugador.eventos.chapuzon.shift(); sonido.chapuzon(); }
    jugador.eventos.salto.length = 0;

    // Qué hay adelante: NPCs y scans de recursos no necesitan 60/120 consultas por segundo.
    acumuladoVecino += dt;
    if (js.enKayak) vecino = null;
    else if (acumuladoVecino >= 1 / 15 && acumuladoVecino >= presupuestoAdaptativo.intervalo(1 / 15, 1.35)) {
      acumuladoVecino = 0; vecino = gente.cerca(js, camara);
      // 3.6: con la aldea, al mostrador del almacén o de la biblioteca suele haber alguien (un cliente,
      // la abuela atendiendo): ahí gana lo del lugar, y para hablarle hay que mirarlo de frente
      // (3.6.2: salvo leer el libro prestado sentado en tu casa: la visita en tu mesa gana, ver lugarTapaVecino)
      if (vecino && !desafio && !js.enTren && (cercaDelMostrador() || enLaCasaDeTe() || lugarTapaVecino(mecanicasAldea?.accion(js)?.tipo))) vecino = gente.cerca(js, camara, true);
    }
    acumuladoBuscar += dt;
    acumuladoInteraccion += dt;
    const movioInteraccion = Math.hypot(js.pos.x - posInteraccion.x, js.pos.z - posInteraccion.z) > 0.4 || Math.abs(js.pos.y - posInteraccion.y) > 0.35;
    if ((acumuladoInteraccion >= 0.10 && acumuladoInteraccion >= presupuestoAdaptativo.intervalo(0.10, 1.45)) || movioInteraccion) {
      acumuladoInteraccion = 0; posInteraccion.copy(js.pos);
      cacheFuegoPropio = !clima.fogata.activa ? fogonPropioCerca() : null;
      cacheHacha = objetivoHacha();
      cacheAcopio = hayAcopioCerca(RADIO_ACOPIO_MANO);
      cacheCantero = canteroCerca();
      cacheGallinero = gallineroCerca();
      cacheTelar = telarCerca();
      cacheObraTrabaja = obraQueTrabajaCerca();
      cacheObraAldea = aldeaGente ? aldeaGente.obraCerca(js.pos) : null;
      cacheMecanica = mecanicasAldea ? mecanicasAldea.accion(js) : null;
      cacheSemillaArbol = arbolParaSemilla();
      if (gallinasMundo && gallinerosTerminados().length !== gallinerosVistos) refrescarGallineros();
      // un cantero recién terminado aparece sin esperar al día siguiente
      if (matasHuerta && canterosTerminados().length !== canterosVistos) refrescarHuerta();
      // El aviso de aserrar sale en el banco, o a mano cuando todavía no tenés tablas
      cacheAserrar = !puedeAserrar() ? false : enBancoAserrar() ? 'banco' : material('tabla') < 2 ? 'mano' : false;
      cacheSemilla = semillaDisponible();
    }
    if (js.sentado || js.enKayak || js.enTren || js.montado || vecino) objetivo = null;
    else if (acumuladoBuscar > presupuestoAdaptativo.intervalo(1 / 15, 1.45)) { acumuladoBuscar = 0; objetivo = objetos.buscar(camara, jugador); }
    // 3.1: parado en el andén al lado de la locomotora, subir a la cabina le gana al banco
    // de la parada (desde la 3.0.1 el andén se pisa de verdad y el banco quedaba a mano)
    if (objetivo?.tipo === 'sentarse' && !desafio && tren?.puedeConducir?.(js)) objetivo = null;
    let aviso = objetivo ? { tecla: 'E', texto: objetivo.texto } : null;
    if (charla.npc) aviso = null;
    else if (vecino && desafio && vecino.enBase) aviso = { tecla: 'E', texto: textoOrdenar(vecino) };
    else if (vecino) aviso = { tecla: 'E', texto: vecindadJuego?.invitado(vecino) === 'esperando' ? vecindadJuego.textoSentarse() : `Hablar con ${vecino.nombre}` };   // 3.6 (vida): el invitado, ya sentado: E te sienta
    // 3.6 (vida): al lado de tu lugar en la mesa de la invitación, como en la tecla E
    else if (!js.enTren && !js.montado && vecindadJuego?.puedeSentarse(js.pos)) aviso = { tecla: 'E', texto: vecindadJuego.textoSentarse() };
    // 3.1: el poste de una carrera, en el mismo lugar que en la tecla E (después de hablar, antes que todo lo demás)
    const avisoCarrera = !charla.npc && !vecino && !objetivo ? modos?.accion(js) : null;
    if (!aviso && avisoCarrera) aviso = { tecla: 'E', texto: avisoCarrera.texto };
    if (charla.npc && Math.hypot(charla.npc.pos.x - js.pos.x, charla.npc.pos.z - js.pos.z) > 6) cerrarCharla();
    // 2.4.1: el aviso sigue el orden de la tecla E paso a paso. El mostrador va acá (E lo
    // atiende antes que la puerta del almacén); el kayak, el tren y la bitácora, más abajo.
    if (!aviso && !js.enTren && !js.enKayak && !js.montado && !objetivo && cercaDelMostrador() && !enElAlmacen && !charla.npc) aviso = { tecla: 'E', texto: 'Ver qué hay en el almacén' };
    if (!aviso && !objetivo && caballoCerca()) aviso = { tecla: 'E', texto: 'Subir al zaino' };
    if (!aviso && !objetivo && feriaCerca() && !enLaFeria) aviso = { tecla: 'E', texto: 'Ver la feria' };
    if (!aviso && !js.enTren && !js.enKayak && !objetivo && !enLasCargas() && puestoDeCargasCerca()) aviso = { tecla: 'E', texto: 'Comerciar en el puesto de cargas' };
    // Mismo orden que la tecla E: cantero, oveja y acopio van antes que las puertas.
    // Si no, con un cantero al lado de una puerta el aviso dice "Abrir" y E siembra.
    if (!aviso && cacheCantero && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: textoAvisoCantero(cacheCantero) };
    if (!aviso && cacheGallinero && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: textoGallinero(gallineros()[cacheGallinero.clave], progreso.dia) };
    if (!aviso && cacheTelar && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: textoTelar(lanaAMano(), progreso.cosas) };
    if (!aviso && cacheObraTrabaja && !js.enTren && !js.enKayak && !objetivo) { const t = avisoObraQueTrabaja(cacheObraTrabaja); if (t) aviso = { tecla: 'E', texto: t }; }
    // 3.6: la obra de la aldea, después de las obras que trabajan, como en la tecla E
    if (!aviso && cacheObraAldea && !js.enTren && !js.enKayak && !objetivo) { const t = aldeaGente.avisoObra(cacheObraAldea); if (t) aviso = { tecla: 'E', texto: t }; }
    // 3.6 (mecánicas): lo de cada lugar de la aldea, después de la obra, como en la tecla E
    if (!aviso && cacheMecanica && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: cacheMecanica.texto };
    if (!aviso && ovejaCercana && !objetivo) aviso = { tecla: 'E', texto: textoOveja(majadaDe(ovejaCercana), ovejaCercana.i, progreso.dia, !!progreso.cosas.tijera) };
    if (!aviso && cacheAcopio && !objetivo && !js.enTren && !js.enKayak) aviso = { tecla: 'E', texto: totalEnMano() > 0 ? `Guardar en el acopio (${totalEnMano()})` : totalAcopio() > 0 ? `Sacar del acopio (${totalAcopio()})` : 'Acopio vacío' };
    // 2.3: mismo lugar que en la tecla E: capullo o zanja antes que la puerta
    if (!aviso && desafio && !objetivo && !js.enTren) { const t = desafio.avisoCercaDe?.(js.pos, distanciaAPuerta(js.pos)); if (t) aviso = { tecla: 'E', texto: t }; }
    const puertaCerca = !objetivo && !js.enTren && !js.enKayak && puertas && puertas.cerca(js.pos);
    // 3.6 (mecánicas): sentado, E no abre puertas (sentado a la mesa de la casa de té, junto a la puerta, se pide el té)
    if (!aviso && puertaCerca) aviso = js.sentado ? null : { tecla: 'E', texto: `${puertaCerca.objetivo > 0.5 ? 'Cerrar' : 'Abrir'} ${puertaCerca.nombre}` };
    if (!aviso && !objetivo && !desafio && !js.montado && mirandoAlPerro(js, perro.est.pos) && (rastro || puedoPedirRastro())) aviso = { tecla: 'E', texto: rastro ? 'Dejar el rastro' : 'Pedirle al perro que rastree' };
    if (!aviso && !desafio && !js.enTren && !js.enKayak && !objetivo && tren.puedeConducir(js)) aviso = { tecla: 'E', texto: 'Subir a la cabina y manejar' };
    if (!aviso && !js.enTren && !js.enKayak && !objetivo && tren.puedeSubir(js)) aviso = { tecla: 'E', texto: 'Subir a la trochita' };
    // 2.6.1: la casa de té va acá, como en la tecla E (antes del kayak, la carpa y el fuego):
    // al final, un fogón al lado del mostrador decía «Dormir» y E servía
    const casaDeTe = !charla.npc && !js.enTren && !js.enKayak && (!objetivo || objetivo.tipo === 'sentarse') && enLaCasaDeTe();
    if (casaDeTe && (!aviso || objetivo)) aviso = { tecla: 'E', texto: 'Pedir algo en la casa de té' };
    if (!aviso && js.enVela && vela.lugarParaBajar()) aviso = { tecla: 'E', texto: 'Bajar del velero' };
    if (!aviso && js.enKayak && kayak.lugarParaBajar()) aviso = { tecla: 'E', texto: 'Bajar del kayak' };
    if (!aviso && !objetivo && kayak.cerca(js)) aviso = { tecla: 'E', texto: 'Subir al kayak' };
    // 2.9: el velero y la tirolesa, como en la tecla E
    if (!aviso && !objetivo && !js.enKayak && !js.enTren) { const a = vela?.accion(jugador) || tirolesas?.accion(jugador); if (a) aviso = { tecla: 'E', texto: a.texto }; }
    if (!aviso && enLaSalaDelFaro() && !progreso.entradas.bitacora) aviso = { tecla: 'E', texto: 'Leer la bitácora del farero' };
    // 2.6.1: la carpa antes que la obra, como en la tecla E
    if (!aviso && enLaCarpa() && puedeDormirJuntoAlFuego()) aviso = { tecla: 'E', texto: 'Dormir en la carpa' };
    if (!aviso && obras && obras.dentro(js.pos) && puedeDormirJuntoAlFuego()) {
      const catre = obras.tieneFuncionCerca?.('dormir', js.pos, 3.2);
      aviso = { tecla: 'E', texto: catre ? 'Dormir en tu catre' : 'Dormir en tu puesto' };
    }
    if (!aviso && marcaPerro && !charla.npc) { aviso = { tecla: '·', texto: 'El perro marca algo cerca' }; if (!avisoMarca) { avisoMarca = true; diario.anotar('marca'); } }
    else if (!marcaPerro) avisoMarca = false;
    if (enElAlmacen || enLaFeria) aviso = null;
    if (enLasCargas()) aviso = null;
    if (enElAlmacen && !cercaDelMostrador()) cerrarAlmacen();
    if (enElAlmacen || enLaFeria || enLasCargas()) marcarHud();   // 3.6.2: la marca (también en la lista que se rehízo)
    if (js.enTren) {
      if (vecino) aviso = { tecla: 'E', texto: `Hablar con ${vecino.nombre}` };
      else aviso = tren.parado() ? { tecla: 'E', texto: 'Bajar del tren' } : null;
      // 2.9: en la cabina se baja parado en un andén
      if (!vecino && tren.conduciendo()) aviso = tren.parado() && !enLasCargas() ? { tecla: 'E', texto: 'Bajar de la cabina' } : null;
    }
    const juntoAlFuego = cercaDelFuego();
    if (juntoAlFuego && !casaDeTe && (!aviso || objetivo?.tipo === 'sentarse')) {
      if (puedeDormirJuntoAlFuego()) aviso = { tecla: 'E', texto: 'Dormir junto al fuego' };
      else if (hayQueCocinar()) aviso = { tecla: 'E', texto: 'Cocinar algo en el fuego' };
    }
    if (!aviso && juntoAlFuego) aviso = { tecla: 'G', texto: 'Cocinar algo en el fuego' };
    // 2.1: el tendal y las huellas. Le ganan al aviso del perro (el del «·», que sólo
    // informa). La huerta ahora es el cantero de la 1.10, que tiene su aviso más arriba.
    if ((!aviso || aviso.tecla === '·') && !objetivo && !charla.npc && !js.enTren && !js.enKayak) {
      const te = tendalCerca();
      // 2.4.1: E usa el tendal aunque esté vacío (dice qué se cuelga): el aviso también
      const texto = te ? avisoTendal(datosTendal(te), progreso.entradas) || 'Mirar el tendal' : null;
      if (texto) aviso = { tecla: 'E', texto };
      else {
        const ra = rastroAlPie();
        if (ra) aviso = { tecla: 'E', texto: progreso.entradas[ra.R.entrada] ? `Rastro de ${ra.R.nombre}: ¿para dónde va?` : `Mirar las huellas` };
        // 2.3: la semilla va después de las huellas, igual que en la tecla E
        else if (cacheSemillaArbol && !js.enTren && !js.enKayak) aviso = { tecla: 'E', texto: `Juntar semilla de ${ARBOLES_VIVERO[cacheSemillaArbol.arbol.especie].nombre}` };
      }
    }
    // 2.4.1: las otras teclas (F, H, Y, B, T) van después de todo lo que hace E. Antes iban
    // en el medio y tapaban el aviso de E: junto al tendal decía «B Plantar» y E colgaba.
    if (!aviso && desafio && desafio.antorchaApagadaCerca?.(js.pos)) aviso = { tecla: 'F', texto: 'Encender la antorcha' };
    const fuegoPropio = !aviso && !clima.fogata.activa ? cacheFuegoPropio : null;
    if (fuegoPropio) aviso = { tecla: 'F', texto: fuegoPropio.plano.id === 'pared-hogar' ? 'Encender el hogar' : fuegoPropio?.plano?.fuegoContenido ? 'Encender la estufa' : 'Encender tu fogón' };
    const hachaCerca = !aviso ? cacheHacha : null;
    if (hachaCerca) aviso = { tecla: 'H', texto: textoHacha(hachaCerca) };
    if (!aviso && cacheAserrar) aviso = { tecla: 'Y', texto: cacheAserrar === 'banco' ? 'Aserrar en el banco (1 tronco → 4 tablas)' : 'Aserrar a mano (1 tronco → 2 tablas)' };
    if (!aviso && cacheSemilla && js.enSuelo && !js.nadando && !js.enTren && !js.enKayak) {
      aviso = { tecla: 'B', texto: `Plantar ${cacheSemilla.nombre}` };
    }
    if (!aviso && enLaCarpa()) aviso = { tecla: 'T', texto: 'Levantar la carpa' };
    else if (!aviso && progreso.cosas.manta && !progreso.carpa && js.enSuelo && !js.nadando) aviso = { tecla: 'T', texto: 'Armar la carpa' };
    if (!aviso && !js.enTren && !js.enKayak && Math.abs(js.pos.y - ref.fogon.y) < 1.75 && Math.hypot(js.pos.x - ref.fogon.x, js.pos.z - ref.fogon.z) < 4 && !clima.fogata.activa) aviso = { tecla: 'F', texto: 'Encender el fogón' };
    // Con los planos abiertos, H no tala, T tiñe e Y levanta la obra: esos avisos no van.
    if (modoObra && aviso && ['H', 'T', 'Y', 'B', 'G'].includes(aviso.tecla)) aviso = null;
    // Arriba del caballo, E sólo baja (o habla con un vecino): el aviso dice lo mismo.
    if (js.montado && !charla.npc) aviso = vecino ? { tecla: 'E', texto: `Hablar con ${vecino.nombre}` } : avisoCarrera ? { tecla: 'E', texto: avisoCarrera.texto } : { tecla: 'E', texto: 'Bajarte del zaino' };
    // 2.6.1: charlando, E sólo sigue la charla: el caballo, la puerta o el kayak no se ofrecen
    if (charla.npc) aviso = null;
    // 2.9: colgado de la tirolesa, E no hace nada: el aviso tampoco
    if (js.enCable) aviso = null;
    mostrarAviso(aviso);
    const estado = $('estado');
    if (js.enTren && estadoTren && estadoTren.conduce) {
      // 2.9: de maquinista
      const aqui = estadoTren.paradaCabina;
      textoTren = estadoTren.parado && aqui
        ? `En el andén de ${aqui.nombre} · E para bajar · C: cargas y fletes · W para arrancar`
        : `W: regulador · S: cierra y frena · Espacio: silbato · ${estadoTren.proxima.nombre} en ${Math.round(estadoTren.falta)} m`;
    } else if (js.enTren && estadoTren) {
      if (estadoTren.parado && !cantada) {
        cantada = true;
        const aqui = tren.paradaCerca(js);
        if (aqui) nota(`¡${aqui.nombre}!`, 'Elsa, la guarda');
      } else if (!estadoTren.parado) cantada = false;
      const p = estadoTren.proxima;
      const donde = estadoTren.asiento && estadoTren.asiento.plataforma ? 'En la plataforma abierta' : 'En tu asiento';
      const paradaActual = estadoTren.parado ? tren.paradaCerca(js) : null;
      textoTren = estadoTren.parado
        ? `Parado en ${paradaActual ? paradaActual.nombre : 'la parada'} · E para bajar · W A S D para cambiar de lugar`
        : `Próxima parada: ${p.nombre} · ${Math.round(estadoTren.falta)} m · ${donde}`;
    } else {
      const anden = tren.paradaCerca(js);
      if (anden) {
        const q = tren.proximoTrenA(anden);
        if (tren.parado() && q && q.metros < 12) textoTren = `${anden.nombre} · el tren está en el andén · E para subir`;
        else if (q) textoTren = `${anden.nombre} · el próximo tren llega en unos ${Math.max(5, Math.round(q.segundos))} segundos`;
        else textoTren = '';
      } else textoTren = '';
    }
    const textoPesca = pesca.est.equipada ? pesca.texto() : '';
    if (textoTren) { ponerTexto(estado, textoTren); estado.classList.remove('oculto'); }
    else if (textoPesca) { ponerTexto(estado, textoPesca); estado.classList.remove('oculto'); }
    else if (js.sentado) {
      // cuando la calma llega arriba, el juego lo dice: es la señal de que ahora sí
      // los animales tímidos pueden venir
      const quieto = calmaDe(js) > 0.85 ? ' El bosque ya no te tiene en cuenta.' : '';
      ponerTexto(estado, T_(`Descansando, ${horaTexto(progreso.horas)}. Movete para levantarte.`) + (quieto ? T_(quieto) : ''));
      estado.classList.remove('oculto');
    }
    else if (js.nadando) { ponerTexto(estado, 'Nadando'); estado.classList.remove('oculto'); }
    else {
      const movioHabitat = Math.hypot(js.pos.x - posHabitat.x, js.pos.z - posHabitat.z) > 0.55 || Math.abs(js.pos.y - posHabitat.y) > 0.45;
      if ((acumuladoHabitat >= 0.18 && acumuladoHabitat >= presupuestoAdaptativo.intervalo(0.18, 1.5)) || movioHabitat) {
        acumuladoHabitat = 0; posHabitat.copy(js.pos);
        const fuegoHabitat = clima.fogata.activa && clima.fogata.vida > 0 ? clima.fogata.pos : null;
        habitatActual = obras?.estadoHabitat?.(js.pos, { fuego: fuegoHabitat, lluvia: clima.estado.lluvia, viento: clima.estado.viento }) || null;
      }
      const habitat = habitatActual;
      if (habitat?.habitable) {
        const ambientes = habitat.ambientesConectados > 1 ? ` · ${habitat.ambientesConectados} ambientes` : '';
        const calorTxt = habitat.calorActivo ? (habitat.calorPropagado ? ' · calor compartido' : ' · calor activo') : '';
        const luzTxt = habitat.luz && noche > 0.35 ? (habitat.luzPropagada >= 0.48 && !habitat.luzLocal ? ' · luz compartida' : ' · luz interior') : '';
        ponerTexto(estado, `Tu refugio · confort ${habitat.confort}/10 · protección ${habitat.calidad}%${ambientes}${calorTxt}${luzTxt}`);
        estado.classList.remove('oculto');
      } else if (bajoCubiertaActual) {
        ponerTexto(estado, 'Bajo cubierta · protegido de la precipitación');
        estado.classList.remove('oculto');
      } else estado.classList.add('oculto');
    }
    const tension = pesca.tension();
    $('tension').classList.toggle('oculto', tension < 0);
    if (tension >= 0) { $('tension-barra').style.width = `${Math.min(100, tension * 100)}%`; $('tension').classList.toggle('alta', tension > 0.72); }
    // 2.6.1: sin arreglo ni filter por cuadro
    let equipo = pesca.est.equipada ? 'Caña de mosca (Q)' : '';
    if (linterna.intensity > 0) equipo += (equipo ? '\n' : '') + 'Linterna (L)';
    if (js.enKayak) equipo += (equipo ? '\n' : '') + (js.enVela && vela ? vela.texto(U.uTiempo.value) : 'Kayak');
    if ($('equipo').textContent !== equipo) $('equipo').textContent = equipo;
    // 2.6.1: el contador de ramitas se escribía en el DOM cada cuadro aunque no cambiara
    ponerTexto($('recursos'), progreso.ramitas ? `${progreso.ramitas} ${progreso.ramitas === 1 ? 'ramita' : 'ramitas'}${progreso.ramitas >= 3 ? ' (F para hacer fuego)' : ''}` : '');
    acumuladoEncargos += dt;
    if (acumuladoEncargos > 1) {
      acumuladoEncargos = 0;
      const activos = TODOS_LOS_ENCARGOS.filter((e) => progreso.encargos[e.id] === 'pedido');
      const texto = activos.slice(0, 2).map((e) => (e.cumplido(progreso) ? '✓ ' : '· ') + e.resumen).join('\n');
      if ($('encargos-hud').textContent !== texto) $('encargos-hud').textContent = texto;
    }
    if (mostrarNombre > 0) { mostrarNombre -= dt; if (mostrarNombre <= 0) barraVigente = false; }
    refrescarBarra();
    barraEl.classList.toggle('oculto', mochilaAbierta || js.zoom);
    barraEl.classList.toggle('reciente', mostrarNombre > 0 || modoObra);   // 2.8: en el modo mínimo se ve un momento
    $('prismaticos').classList.toggle('activo', js.zoom);
    const opacidadMira = js.zoom ? '0' : objetivo ? '1' : '0.45';
    if (opacidadMira !== opacidadMiraPuesta) { opacidadMiraPuesta = opacidadMira; $('mira').style.opacity = opacidadMira; }
    $('pista-clic').classList.toggle('oculto', jugador.bloqueado());
    actualizarBrujula(js.yaw, js.pos);

    // El mapa es completo desde el inicio; ya no existe niebla ni progreso de exploración cartográfica.
    acumuladoLugares += dt;
    // 3.5.1: el banco de pruebas lleva la cámara por el valle: no anota lugares ni guarda
    if (acumuladoLugares > 1 && !banco.activa) {
      acumuladoLugares = 0;
      for (const e of TODOS_LOS_ENCARGOS) {
        if (progreso.encargos[e.id] === 'pedido' && !progreso.encargos[e.id + '-aviso'] && e.cumplido(progreso)) {
          progreso.encargos[e.id + '-aviso'] = 1;
          // 2.0: antes a Elsa se la nombraba «Nicanor»: el nombre salía de un ternario
          // que sólo conocía a tres vecinos
          nota(e.titulo, `Encargo cumplido: contale a ${NOMBRE_VECINO[e.quien] || 'quien te lo pidió'}`, true);
        }
      }
      if (cascada && cascada.pos && !progreso.entradas.cascada
        && Math.hypot(js.pos.x - cascada.pos.x, js.pos.z - cascada.pos.z) < 16) registrar('cascada');
      for (const p of tren.paradas) {
        if (!progreso.entradas.estacion && Math.hypot(js.pos.x - p.anden.x, js.pos.z - p.anden.z) < 14) registrar('estacion');
      }
      if (!progreso.entradas.estepa && T.estepa[T.indice(js.pos.x, js.pos.z)] > 0.75) registrar('estepa');
      for (const id of ['refugio', 'muelle', 'puente', 'mallin', 'mirador', 'arrayanes', 'faro', 'cabana', 'puesto', 'molino', 'casa-te', 'torre', 'estacion', 'galpon', 'almacen', 'cueva', 'cascada']) {
        const l = T.lugares[id];
        if (l && !progreso.entradas[id] && cerca(js, l, id === 'mallin' || id === 'arrayanes' ? 45 : 16)) registrar(id);
      }
    }
    // 3.5.1: con reloj de verdad (dtReal): con pocos cuadros por segundo o en cámara lenta el dt
    // del juego se achica y el guardado se espaciaba; así una caída pierde 20 s como mucho
    acumuladoGuardado += dtReal;
    if (acumuladoGuardado > 20) { acumuladoGuardado = 0; programarGuardadoSuave(); }
  }

  // sonido ambiente
  camara.getWorldDirection(adelante);
  const dRio = T.distRio[k] - T.anchoRio[k];
  const dOrilla = Math.abs(Math.hypot(cam.x - LAGO.x, cam.z - LAGO.z) - T.radioLago(Math.atan2(cam.z - LAGO.z, cam.x - LAGO.x)) * 0.95);
  const fuegoCerca = clima.fogata.activa && clima.fogata.vida > 0 && cam.distanceTo(clima.fogata.pos) < 70 ? clima.fogata.pos : null;
  ctxSonido.cam = cam; ctxSonido.adelante = adelante; ctxSonido.viento = clima.estado.viento; ctxSonido.bosque = T.bosque[k];
  ctxSonido.arroyo = smoothstep(45, 1, dRio); ctxSonido.orilla = smoothstep(45, 2, dOrilla);
  ctxSonido.lluvia = clima.estado.lluvia; ctxSonido.noche = noche; ctxSonido.invierno = U.uInvierno.value; ctxSonido.otono = U.uOtono.value;
  ctxSonido.fuego = fuegoCerca; ctxSonido.bajoTecho = bajoTecho;
  // 2.0: bajo techo pero sin paredes es un alero; la carpa es la carpa
  ctxSonido.techo = techoAudioActual;
  ctxSonido.espacio = techoAudioActual === 'lona' ? 'carpa' : !bajoTecho ? 'bosque' : espacioAudioActual === 'bosque' ? 'alero' : espacioAudioActual;
  ctxSonido.panal = (ambienteBichos && ambienteBichos.panal) || zumbidoColmena();
  if (cascada && cascada.pos) {
    const dc = Math.hypot(cam.x - cascada.pos.x, cam.z - cascada.pos.z);
    if (dc < 80) {
      if (!ctxSonido.cascada) ctxSonido.cascada = { pos: cascada.pos, fuerza: 0 };
      ctxSonido.cascada.pos = cascada.pos; ctxSonido.cascada.fuerza = clamp(1 - dc / 55, 0, 1);
    } else ctxSonido.cascada = null;
  } else ctxSonido.cascada = null;
  ctxSonido.cercaMallin = cerca(js, T.lugares.mallin, 90); ctxSonido.puntoCercano = fauna.puntoCercano;
  try { sonido.actualizar(dt, ctxSonido); } catch (e) { fallaSistema('sonido', e); }

  // las sombras se rehacen unas pocas veces por segundo
  if (calidad.sombras) {
    acumuladoSombra += dt;
    // el mapa de sombras se rehace cuando el sol se movió o el jugador se fue lejos,
    // y nunca más de seis veces por segundo: así los tirones no se amontonan
    const hzSombras = Math.max(3, 6 - presupuestoAdaptativo.nivel);
    if (acumuladoSombra > 1 / hzSombras && planificadorAntitirones.permitir('sombras', { pesada: true })) {
      const movio = Math.abs(progreso.horas - horaSombra) > 0.012;
      const camino = Math.hypot(cam.x - posSombra.x, cam.z - posSombra.z) > 6;
      if (movio || camino) {
        renderer.shadowMap.needsUpdate = true;
        horaSombra = progreso.horas;
        posSombra.set(cam.x, 0, cam.z);
      }
      acumuladoSombra = 0;
    }
  }
  const gpuCuadro = usarCronometroGpu() && cronometroGpu.empezar();
  if (medirRendimiento) {
    const tRender = performance.now();
    const msLogica = tRender - tInicio;
    medidor.tLogica = medidor.tLogica * 0.9 + msLogica * 0.1;
    dibujar(luzCielo, noche);
    const finRender = performance.now();
    perfilador.terminar('render', tRender, medirRendimiento);
    const msTotal = finRender - tInicio;
    if (msTotal > medidor.picoMs) {
      medidor.picoMs = msTotal;
      medidor.picoDe = msLogica > msTotal * 0.55 ? 'lógica' : 'dibujo';
    }
    medidor.picoT += dt;
    if (medidor.picoT > 5) { medidor.picoT = 0; medidor.picoMs = 0; medidor.picoDe = '-'; }
    medidor.tRender = medidor.tRender * 0.9 + (finRender - tRender) * 0.1;
    actualizarMedidor(dtReal, objetivoMs);   // 3.2: el tiempo de verdad (no el de la cámara lenta)
  } else {
    dibujar(luzCielo, noche);
  }
  if (gpuCuadro) cronometroGpu.terminar();
  // 2.7.4: ver luces.js; en el menú, también lo que va a ver el jugador al entrar
  variantesLuces.actualizar(performance.now(), modo === 'inicio' ? jugador.estado.pos : null);
  if (pedirFoto && modo === 'jugando') { pedirFoto = false; sacarFoto(); }
  if (!manual) cerrarCuadro(tCosto, cadencia, plan);
}

// ------------------------------------------------------------------ 3.5.1: caídas
// Lo que hace que el juego no se caiga (o que, si se cae, vuelva solo con la partida):
// las preguntas en un cuadro del juego, los sistemas del bucle que fallan, el contexto 3D que
// pierde la placa y el aviso de que main.cjs recargó la ventana después de una caída.

// Las preguntas (dialogo.js). Abiertas en pleno juego, el mundo queda quieto como con la
// tarjeta del valle (`modo` pasa a 'dialogo') y al cerrar se vuelve al juego.
let modoAntesDialogo = null;
const NATIVOS_DIALOGO = { confirmar: window.confirm, texto: window.prompt };
const dialogos = crearDialogos({
  traducir: T_,
  alAbrir: () => { if (modo === 'jugando') { modoAntesDialogo = 'jugando'; modo = 'dialogo'; jugador?.soltar(); } },
  alCerrar: () => {
    if (modo !== 'dialogo') return;
    modo = modoAntesDialogo || 'jugando'; modoAntesDialogo = null;
    if (modo === 'jugando') volverAlJuego();
  },
  // con ?debug=1, las pruebas viejas contestan reemplazando window.confirm / window.prompt
  auto: HOJARASCA_DEBUG ? (tipo, texto, inicial) => {
    const f = tipo === 'texto' ? window.prompt : window.confirm;
    return typeof f === 'function' && f !== NATIVOS_DIALOGO[tipo] ? f(texto, inicial) : undefined;
  } : null,
});

// Un sistema del bucle que tira una excepción: se anota una vez por sistema y mensaje (consola
// y registro de caídas, por el mismo reportarError de siempre) y el resto del cuadro sigue.
const fallasBucle = new Map();
function fallaSistema(nombre, err) {
  const mensaje = String(err?.message || err).slice(0, 200);
  const clave = `${nombre}|${mensaje}`;
  const f = fallasBucle.get(clave);
  if (f) { f.veces++; return; }
  if (fallasBucle.size >= 64) return;
  fallasBucle.set(clave, { nombre, mensaje, veces: 1 });
  console.error(`[Hojarasca] falló "${nombre}" en el bucle (el juego sigue sin eso):`, err);
  try { window.hojarasca?.reportarError?.(`bucle/${nombre}: ${String(err?.stack || mensaje)}`); } catch { /* sin Electron */ }
}

// El contexto 3D perdido (el driver se reinicia, la compu vuelve de suspender, a la placa
// integrada le falta memoria). Se guarda la partida, el bucle espera con "Recuperando los
// gráficos…" y, cuando la placa vuelve, three r186 rehace su estado solo (initGLContext:
// geometrías, texturas, DataTextures con sus datos y los programas se vuelven a subir al
// usarse). Lo que no puede rehacer es lo dibujado una sola vez en un render target: las fotos
// de los árboles lejanos (impostores) se hornean de nuevo. Si la placa no vuelve a tiempo o
// rehacer falla, se guarda y se recarga: la partida sigue donde estaba.
const estadoGraficos = { perdidos: false, veces: 0, recuperados: 0, rehaciendo: false, espera: 0, ultimo: '', esperaMs: 15000 };
const esperarMs = (ms) => new Promise((r) => setTimeout(r, ms));
function recargarPorGraficos(motivo) {
  clearTimeout(estadoGraficos.espera);
  estadoGraficos.ultimo = motivo;
  try { window.hojarasca?.reportarError?.(`webgl: recarga (${motivo})`); } catch { /* sin Electron */ }
  if (!reiniciandoPartida) { cancelarGuardadoSuave(); guardar(); }
  const url = new URL(location.href);
  url.searchParams.set('recuperado', 'graficos');
  location.replace(url.toString());
}
async function rehacerGraficos() {
  const gl = renderer.getContext();
  if (gl.isContextLost?.()) throw new Error('el contexto sigue perdido');
  veg?.rehornearImpostores?.();                // las fotos de los árboles lejanos
  renderer.shadowMap.needsUpdate = true;       // el mapa de sombras, ya
  cronometroGpu = undefined;                   // las consultas de tiempo eran del contexto viejo
  // los programas, ahora (con el cartel puesto) y no a tirones al volver a caminar
  if (modo !== 'carga' && jugador) await Promise.race([Promise.resolve(variantesLuces.compilarCarga(jugador.estado.pos)).catch(() => null), esperarMs(8000)]);
}
lienzo.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();   // sin esto el navegador no devuelve nunca el contexto
  if (estadoGraficos.perdidos) return;
  estadoGraficos.perdidos = true; estadoGraficos.veces++;
  try { window.hojarasca?.reportarError?.('webgl: se perdió el contexto 3D'); } catch { /* sin Electron */ }
  try { estadoGraficos.soltados = soltarContextoViejo(); } catch (err) { fallaSistema('soltar contexto', err); }   // 3.5.4
  $('graficos-recuperando')?.classList.remove('oculto');
  if (jugador && !reiniciandoPartida) { cancelarGuardadoSuave(); guardar(); }
  clearTimeout(estadoGraficos.espera);
  estadoGraficos.espera = setTimeout(() => recargarPorGraficos('la placa no devolvió el contexto'), estadoGraficos.esperaMs);
}, false);
lienzo.addEventListener('webglcontextrestored', async () => {
  if (!estadoGraficos.perdidos || estadoGraficos.rehaciendo) return;
  // perdido en plena carga: no hay nada que perder, se vuelve a cargar de cero
  if (modo === 'carga' || !jugador) { recargarPorGraficos('se perdió durante la carga'); return; }
  estadoGraficos.rehaciendo = true;
  clearTimeout(estadoGraficos.espera);
  estadoGraficos.espera = setTimeout(() => recargarPorGraficos('rehacer los gráficos tardó demasiado'), estadoGraficos.esperaMs);
  try {
    await rehacerGraficos();
    clearTimeout(estadoGraficos.espera);
    estadoGraficos.perdidos = false; estadoGraficos.recuperados++;
    $('graficos-recuperando')?.classList.add('oculto');
    nota('Gráficos recuperados', 'La placa de video se reinició; seguís donde estabas', true);
  } catch (err) {
    recargarPorGraficos('no se pudo rehacer: ' + (err?.message || err));
  } finally { estadoGraficos.rehaciendo = false; }
}, false);

// main.cjs recargó la ventana después de una caída (o el juego, sin la placa): se avisa en la
// portada y al entrar. La partida es la última guardada (el autoguardado va cada 20 s).
const recuperadoDe = new URLSearchParams(location.search).get('recuperado');
function avisarRecuperado() {
  if (!recuperadoDe) return;
  const texto = recuperadoDe === 'graficos'
    ? 'La placa de video dejó de responder y el juego volvió a abrir tu partida guardada.'
    : 'El juego se cerró de golpe y se volvió a abrir solo, con tu partida guardada.';
  const p = $('aviso-recuperado');
  if (p) { p.textContent = texto; p.classList.remove('oculto'); }
  $('btn-entrar')?.addEventListener('click', () => setTimeout(() => nota('El juego se recuperó', 'Seguís desde el último guardado', true), 1200), { once: true });
}
// main.cjs pide guardar ya (antes de reiniciar con otras opciones de gráficos)
window.hojarasca?.alPedirGuardar?.(() => { if (jugador && !reiniciandoPartida) { cancelarGuardadoSuave(); guardar(); } });

// ------------------------------------------------------------------ arranque
(async () => {
  try {
    await construir();
  } catch (err) {
    $('carga-texto').textContent = 'No se pudo armar el bosque: ' + (err?.message || err);
    console.error(err);
    return;
  }
  aplicarDistancias(true);   // 3.5: la distancia de dibujo y de plantas del jugador, de entrada
  aplicarAccesibilidad();
  traducirPanel(document.body);
  crearValle();   // 3.1
  $('carga').classList.add('oculto');
  $('inicio').classList.remove('oculto');
  avisarRecuperado();   // 3.5.1
  if (esDesafio) {
    $('btn-entrar').textContent = 'Empezar el Desafío';
    $('btn-nuevo').textContent = 'Empezar un Desafío nuevo';
  }
  if (habiaGuardado && progreso.pos) {
    $('btn-entrar').textContent = esDesafio ? 'Seguir resistiendo' : 'Seguir recorriendo';
    $('btn-nuevo').classList.remove('oculto');
  }
  sincronizarAjustes();
  modo = 'inicio';
  document.addEventListener('pointerdown', () => sonido.iniciar(), { once: true });
  window.addEventListener('beforeunload', guardar);
  window.addEventListener('beforeunload', () => copiarASync(true, true));
  revisarCarpetaSync();
  window.addEventListener('blur', () => {
    // Si el mouse se suelta fuera de la ventana no llega mouseup: cortamos
    // explícitamente el recogido para que la caña no quede enganchada.
    if (pesca?.est?.recogiendo) pesca.clic(false, mundoPesca());
    // 3.5.4: jugando sin el mouse bloqueado (el bloqueo falló al volver con Esc, o el modo de
    // arrastrar para mirar) no llegaba la pausa de "soltaste el mouse": con Alt+Tab, la tecla de
    // Windows u otra ventana encima, la noche del Desafío seguía sin vos. Ahora se pausa igual.
    if (modo === 'jugando' && jugador && !document.pointerLockElement && !banco.activa) abrir('pausa');
  });
  // 3.5.4: la compu se suspende o se bloquea la pantalla (lo avisa main.cjs): pausa
  window.hojarasca?.alPedirPausa?.(() => { if (modo === 'jugando' && jugador && !banco.activa) abrir('pausa'); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    if (pesca?.est?.recogiendo) pesca.clic(false, mundoPesca());
    if (!reiniciandoPartida) flushGuardadoSuave();
  });
  // API pública mínima para la UI del shell. Las referencias internas del mundo
  // solo se exponen en builds de QA iniciados con ?debug=1.
  window.__hojarasca = { guardar, nota };
  if (HOJARASCA_DEBUG) Object.assign(window.__hojarasca, {
    jugador, progreso, ajustes, T, clima, camara, renderer, abrir, volverAlJuego, objetos, veg, fauna, vida, bichos, gente, perro, tren, pesca, kayak, linterna, est, col, hablar, diario, escena, sonido, renovales, refugioVivo, medidor, obras, PLANOS, puertas, desafio, modoJuego, perfilador,
    THREE: { Raycaster: THREE.Raycaster, Vector3: THREE.Vector3, Group: THREE.Group, Mesh: THREE.Mesh, BoxGeometry: THREE.BoxGeometry, MeshLambertMaterial: THREE.MeshLambertMaterial },
    __ranuraActual: () => (ranuras[elegida]?.nombre || ''),
    revisarRebrote, talados, acopio, conMateriales, materialesVisibles, autoCalidad, mando, revisarGuiaRelax, abrirBase,
    traductor, T_, traducirPanel,
    abrirModoFoto, __foto: () => foto, guardarFotoArchivo,
    __post: () => post?.uniforms, __peligros: () => ctxMundoVivo.peligros,
    __riesgoPeligros: (pos) => riesgoDePeligros(pos, ctxMundoVivo.peligros),
    empezarBanco, banco, textoParaExportar, importarTexto, leerPartida,
    __mostrarVictoria: (s, final) => mostrarVictoria(s, final),
    __probarParte: () => resumenPartida({ desafio: progreso.desafio || {}, progreso, planos: PLANO, logros: desafio?.logros?.progreso ? desafio.logros.progreso() : {}, dificultad: 'normal', final: true }),
    __teclasPropias: () => teclasPropias,
    // 1.10
    // 1.11
    // 3.5: la distancia de dibujo y de plantas (pruebas y herramientas de medición)
    pasto, calidad, aplicarDistancias, __distancias: () => ({ ajustes: { distancia: ajustes.distancia, plantas: ajustes.distanciaPlantas }, rigen: distActual, veg: veg.distancias(), pasto: { radio: pasto.radio, matas: pasto.matas }, soto: { ...veg.statsSoto } }),
    __bucle: () => bucle(0, true),
    // 3.6.1 (vecinos): el aviso de ahora mismo (sin esperar los relojes de lo que hay adelante), para
    // comparar en cada lugar lo que dice el aviso con lo que hace E (humo-3-6-1-vecinos.cjs)
    __avisoYa: () => { acumuladoVecino = 99; acumuladoBuscar = 99; acumuladoInteraccion = 99; bucle(0, true); return avisoTexto ? { tecla: avisoTecla, texto: avisoFrase } : null; },
    __carga: () => ({ etapas: tiemposCarga, total: Math.round(performance.now()), cache: infoCarga }),
    cocinar, hayQueCocinar, __mundoPerro: () => mundoPerro, __abierto: () => ({ enElAlmacen, enLaFeria }),
    __sync: { copiarASync, revisarCarpetaSync, estado: () => ({ carpetaSync, ultimaCopiaSync, copiadoEnSync }) },
    visitas, actualizarVisitas, mueblesTerminados, __visitante: () => visitante,
    pedirRastro, dejarRastro, __rastroPerro: () => rastro,
    tejer, telarCerca, abrirFeria, cambiarFeria, feriaCerca, feria, __puestoFeria: () => puestoFeria,
    gallineros, gallineroCerca, usarGallinero, refrescarGallineros, __gallinas: () => gallinasMundo,
    huerta, canteroCerca, usarCantero, revisarHuerta, refrescarHuerta, majada, esquilarOveja,
    otraVuelta, exportarAlbum, revisarLogrosRelax, __logrosRelax: () => logrosRelax,
    montar, desmontar, caballoCerca, dondeEstaElCaballo, __caballo: () => caballoMundo,
    __majada: () => majadaMundo, __matasHuerta: () => matasHuerta, correo, revisarCorreo, tormenta, revisarTormenta, caerRayo, usarHacha, __agua: () => agua,
    // el banco de sonidos del Desafío armado contra el motor que se le pase: así el
    // renderizador de sonidos puede sacar a un archivo lo mismo que suena jugando
    __bancoSonidos: (motor) => crearBanco(motor || sonido),
    __fusionar: fusionarPorMaterial,
    __armarLamina: armarLamina, __guardarLamina: guardarLamina,
    // 2.1
    __cantosOidos: cantosOidos, __usarGrabador: usarGrabador, __usarTendal: usarElTendal, __cocinar: cocinar, __cambiar: (i) => cambiar(i),
    __rastro: () => rastroActivo, __apurarRastro: () => { esperaRastro = 0; rastroActivo = null; }, __mirarRastro: mirarRastro,
    __mallaRastros: () => mallaRastros,
    __sonidosEscritos: () => sonidosEscritos.map(renglonSubtitulo), __avisos: () => avisosDichos.map((a) => `${a.hora.toFixed(2)} ${a.titulo}`), __vibrar: vibrarMando, __pulsos: () => ({ dados: pulsosDados, ultimo: ultimoPulso }), __fotosJuego: () => fotos, __DESAFIOS: DESAFIOS,
    __nocheCielo: () => nocheCielo, __azarCielo: (f) => { azarCielo = f || Math.random; }, __fugaces: () => fugaces, __cielo: () => cielo,
    __calma: () => calmaDe(jugador.estado),
    __oido: () => oidoAfinado,
    __mundoVivo: () => ctxMundoVivo,
    __avisosDeGuia: () => avisosDeGuia,
    __idsEncargos: () => ENCARGOS.map((e) => e.id),
    __U: () => U,
    __charla: () => ({ npc: charla.npc?.clave || null, encargo: charla.encargo ? { id: charla.encargo.e.id, modo: charla.encargo.modo } : null, fin: charla.fin }),
    __seguirCharla: () => seguirCharla(),
    __cerrarCharla: () => cerrarCharla(),
    // 2.3: las diez ideas
    __obraQueTrabajaCerca: obraQueTrabajaCerca, __usarObraQueTrabaja: usarObraQueTrabaja, __avisoObraQueTrabaja: avisoObraQueTrabaja,
    // 2.4
    __casaViva: () => ({ chimeneas: chimeneasTodas || chimeneas, ventanas: ventanasMundo?.malla, corral: corralMundo, kayak }), __actualizarCasaViva: (dt = 3) => actualizarCasaViva(dt),
    __tenirPieza: () => tenirPieza(), __hornear: () => hornear(), __amarrarKayak: amarrarKayak, __vela: () => vela, __tirolesas: () => tirolesas, __helarLaHuerta: () => helarLaHuerta(huerta()), __refrescarCorral: refrescarCorral,
    __arbolParaSemilla: arbolParaSemilla, __juntarSemilla: juntarSemilla, __plantarRenoval: plantarRenoval, __encenderFuego: encenderFuego,
    __dormir: dormir, __atrapar: atrapar, __fogonDeVisita: fogonDeVisita, __actualizarVisitas: (dt) => { relojVisitas = 0; actualizarVisitas(dt); },
    __lomo: () => ({ lomo, visible: lomoVisible(), malla: lomoMalla?.visible || false }), __forzarLomo: () => { nocheLomo = progreso.horas < 4 ? progreso.dia - 1 : progreso.dia; lomo = { t: -1, pos: null }; },
    __actualizarLomo: actualizarLomo, __hablar: hablar, __datosDe: datosDe,
    // 3.6 (vida): la vecindad en el juego y el menú de la charla
    __vecindad: () => vecindadJuego, __elegirCharla: (i) => elegirEnMenuCharla(i), __atrasCharla: () => atrasCharla(), __moverCharla: (n) => moverMenuCharla(n),
    __cantero: usarCantero, __aviso: () => $('aviso')?.textContent || '',
    // 3.6.2: los paneles del HUD que se eligen con un clic, para las pruebas
    __hud: { abrirAlmacen, cerrarAlmacen, abrirMochila, panelAbierto: () => panelDelHudAbierto(), mapa: () => dibujarMapa() },
    // 2.9: las máquinas
    __maquinas: { revisar: revisarMaquinas, actualizar: actualizarMaquinas, usar: usarMaquina, aviso: avisoMaquina, pronostico: pronosticoActual, noches: nochesActuales, meteo: meteoPartida, radio: radioPartida, mundo: () => ({ molino: molinoMundo, meteo: meteoMundo }) },
    // 2.9: la trochita de maquinista y el comercio
    __cargas: () => cargas(), __subirALaCabina: subirALaCabina, __bajarDeLaCabina: bajarDeLaCabina, __puestoDeCargasCerca: puestoDeCargasCerca, __ctxTren: ctxTren,
    // 2.8: personalizar
    __personal: {
      secciones: () => secciones().map((s) => s.id), datos: () => progreso.personal, mundo: mundoPersonal,
      abrir: (origen = 'pausa') => abrirPersonal(origen), cerrar: cerrarPersonal, abierto: personalAbierto, desdeElJuego: personalizarDesdeElJuego,
      cambiar: (id, parcial) => { const s = secciones().find((x) => x.id === id); return s ? cambiarPersonal(s, parcial) : null; },
      aplicar: aplicarPersonal, cuerpo: () => cuerpoJugador, mano: () => manoPropia, bandera: () => banderaMundo, texturaBandera,
    },
  });
  // 3.0: la supervivencia sin fin, para las pruebas
  // 3.1: la historia y los eventos del valle, para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__valle = valle;
  // 3.5.1: las caídas (preguntas, contexto 3D, sistemas que fallan), para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__caidas = { dialogos, graficos: estadoGraficos, fallas: () => [...fallasBucle.values()], fallaSistema, rehacerGraficos, pedirNombre, recuperadoDe, modo: () => modo };
  // 3.1: las carreras, el desafío del día y el torneo, para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__modos = () => modos;
  if (HOJARASCA_DEBUG) window.__hojarasca.__sinFin = { es: esSinFin, terminar: () => terminarCorrida(), records: () => recordsSinFin(), nueva: (c) => nuevaCorrida(c), empezarMapa: () => empezarMapaDesafio() };
  // 3.1: los oficios (3.6: y la aldea), para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__aldea = { oficios: () => oficios, mundo: () => aldeaGente, llamar: llamarAlProximoPoblador, actualizar: (dt = 1) => actualizarAldea(dt),
    accionObra: () => accionObra(), aserrar: () => aserrar(), cuaderno: (p) => { if (p) pestana = p; dibujarCuaderno(); }, golpes: () => golpesParaTalarAhora(), mundoPesca: () => mundoPesca(), entradas: () => ENTRADAS.map((e) => e.id),
    // 3.6: dónde queda cada cosa de la aldea en el mundo
    puntos: (id) => puntosMundo(id), edificio: (id) => edificioEnMundo(id), renglon: () => (renglonAldea && renglonAldea.style.display !== 'none' ? renglonAldea.textContent : '') };
  // 3.6: los edificios de la aldea en el mundo, para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__aldeaMundo = () => aldeaMundo;
  // 3.6 (mecánicas): lo de cada lugar de la aldea, para las pruebas
  if (HOJARASCA_DEBUG) window.__hojarasca.__mecanicas = () => mecanicasAldea;
  if (HOJARASCA_DEBUG) window.__hojarasca.__techo = () => ({ bajoTecho, espacio: espacioAudioActual, techo: techoAudioActual });
  requestAnimationFrame(bucle);
})();
