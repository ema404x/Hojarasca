// Modo Desafío: cada noche baja una nave y los invasores vienen a buscarte.
// De día se junta, se construye y se fabrica; de noche se resiste.
// Todo se arma por código, como el resto del bosque: mallas, sonidos y reglas.
import * as THREE from 'three';
import { lam } from './vida.js';
import { rng } from './ruido.js';
import { crearBanco } from './desafio-sonidos.js';
import { esperaVoz } from './voz-alien.js';
import { LIMITE } from './config.js';
import { registrarLuz } from './luces.js';
import { HORA_ATAQUE, HORA_AMANECER, SALUD_MAX, claveNoche, esHoraDeAtaque, segundosHasta, relojCorto, TIPOS_ALIEN, composicionOleada, multiplicadorNoche, RECETAS, vidaMaxObra, costoReparacion, sanearDesafio, dificultad, suministrosDelAlba } from './desafio-reglas.js';
import { armaEfectiva, CATEGORIAS_TALLER, REFUERZOS, NOCHE_FINAL, ESPECIALES, nocheEspecial, aplicarEspecial, nocheConRestos, efectoClima } from './desafio-reglas.js';
import { puedeSaltar, danoEnPuntoDebil, sinJefe, esNocheDeJefe, MARGEN_GOLPE } from './desafio-reglas.js';
import { multiplicadorVuelta, textoVuelta } from './desafio-vuelta.js';
import { CIMIENTO, admiteCimiento, frenaAlExcavador } from './desafio-cimiento-reglas.js';
import { NIDO, nidoNuevo, lugarDelNido, resumenNido, cercoDeBusqueda, siguenLasNoches } from './desafio-nido.js';
import { crearEfectos } from './desafio-efectos.js';
// 3.8.0: los invasores son duendes (desafio-duendes.js: el modelo, la animación y el dibujo instanciado)
import { crearDuende, instalarDuendes, precalentarDuendes, registrarHalos, mallaAtadito, estadoDuendes } from './desafio-duendes.js';
import { esNocheGrande, vieneDeViejo, etapaDe, ROBO, puedeRobar, queSeLleva } from './desafio-duendes-reglas.js';
import { mallaNido, mallaCofre } from './duendes-modelo.js';
import { crearMusicaTension } from './desafio-musica.js';
import { crearLogros, evaluarNoche, evaluarEstado, LOGROS } from './desafio-logros.js';
import { crearAliados } from './desafio-aliados.js';
import { crearArsenalMundo } from './desafio-arsenal-mundo.js';
import { crearFortinMundo } from './desafio-fortin-mundo.js';
import { tipoFlecha, flechasDe, siguienteFlecha, FLECHAS, PERFORA, factorTension, conQueBloquea, RODELA, danoConArmadura, danoContra, danoPorEspalda, MUNICIONES, TOPE_MUNICION } from './desafio-arsenal.js';
import { crearCimientos } from './desafio-cimiento.js';
import { crearDefensasActivas } from './desafio-defensas.js';
import { crearEventos } from './desafio-eventos.js';
import { crearAsedioMundo } from './desafio-asedio-mundo.js';
import { crearNaveMundo } from './desafio-nave-mundo.js';
import { geoSemilla } from './desafio-coihue-formas.js';
import { avanzarTutorial, dibujarTutorial, PASOS_TUTORIAL, PREMIO_TUTORIAL } from './desafio-tutorial.js';
import { reflejoOjos, modoAcecho, VELOCIDAD_ACECHO, rumboRodeo, escondite, estaMirando, SONIDOS_ESCRITOS, subtituloSonido, agacheDeMezcla } from './desafio-sentidos.js';
import { ACECHAN } from './desafio-sentidos.js';
import { RESCATES, VIDA_LUGAR, DIAS_ENOJADO, danoAlLugar, nocheDeRescate, premioRescate, sigueEnojado, debeCavar, VEL_BAJO_TIERRA, SALE_A, puntoDeSalida } from './desafio-valle.js';
import { varianteJefe, NOMBRE_JEFE, AVISO_JEFE, LLAMADO, sombraVisible, ARTILLERO, tiroParabolico, despierta } from './desafio-valle.js';
import { efectoDeArma, HIELO, RAYO, EMPUJE, cadenaDeRayo, eficacia } from './desafio-valle.js';
import { tienePuerta } from './desafio-noche2.js';
import { tiempoDeTanteo, faseAsedio, esAsedio, esperaApagon, anotarBestiario, BESTIARIO, DISTANCIA_VISTO, siguenDespues, sumarNocheDespues, probabilidadMutado, MUTADO, regeneracion, NOCHES_DESPUES } from './desafio-noche2.js';
import { VUELO, blancoVolador, alturaDeseada, elegirParaTorreta } from './desafio-cielo.js';
import { CAPULLOS, cuantosCapullos, lugaresCapullos, queSale, usarCapullo, golpearCapullo, avisoCapullo } from './desafio-infestacion.js';
import { VARADA, nocheDeVarada, puntoDeVarada, varadaNueva, avanzarVarada, quedaParaLlegar, premioVarada } from './desafio-varada.js';
import { ZANJA, ESCAPE, sanearZanja, usarZanja, avisoZanja, consumir, enElFuego, seEscapa, saltoDelFuego, radioFoco } from './desafio-zanja.js';
import { azarDe, sanearRecordsSemilla, registrarSemilla } from './semilla.js';
import { azarEspecial } from './meteo.js';
import { composicionSinFin, multiplicadorSinFin, especialSinFin } from './desafio-supervivencia.js';
import { anguloDeBajada } from './desafio-mapa.js';
import { crearMapaMundo } from './desafio-mapa-mundo.js';
import { crearPuestosMundo } from './desafio-puestos-mundo.js';
import { crearEvolucionMundo } from './desafio-evolucion-mundo.js';
import { claseDeProyectil } from './desafio-evolucion.js';

const VERDE_OJO = '#a6ff6e';
const MAX_ALIENS = 24;
const GRAVEDAD_ACIDO = 9;   // el escupitajo del escupidor va con arco, no en línea recta
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _dir = new THREE.Vector3();

// 3.8.0: los invasores son duendes: se modelan en duendes-modelo.js y se animan y dibujan en desafio-duendes.js.

function mallaNave() {
  const g = new THREE.Group();
  const casco = new THREE.Mesh(new THREE.SphereGeometry(9, 28, 10), lam('#8b9197'));
  casco.scale.set(1, 0.2, 1);
  g.add(casco);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(9.1, 0.45, 6, 36), lam('#5d6269'));
  anillo.rotation.x = Math.PI / 2;
  g.add(anillo);
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(3.4, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#9fe8c8', transparent: true, opacity: 0.55 }));
  cupula.position.y = 1.3;
  g.add(cupula);
  const luces = [];
  const matLuz = new THREE.MeshBasicMaterial({ color: VERDE_OJO });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.34, 6, 5), matLuz.clone());
    l.position.set(Math.cos(a) * 8.2, -0.9, Math.sin(a) * 8.2);
    g.add(l);
    luces.push(l);
  }
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 6.5, 1, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: '#b6ffb0', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  g.add(haz);
  // dos reflectores que barren el suelo buscándote
  const reflectores = new THREE.Group();
  for (const s of [-1, 1]) {
    const cono = new THREE.Mesh(new THREE.ConeGeometry(4.5, 38, 18, 1, true).translate(0, -19, 0),
      new THREE.MeshBasicMaterial({ color: '#d8ffcf', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    const piv = new THREE.Group(); piv.position.set(s * 5.5, -1, 0); piv.rotation.z = s * 0.45;
    piv.add(cono); reflectores.add(piv);
  }
  reflectores.visible = false;
  g.add(reflectores);
  return { g, luces, haz, reflectores };
}

// ---------------------------------------------------------------- el sistema
export function crearDesafio(T, escena, camara, col, obras, sonido, ctx) {
  const progreso = () => ctx.progreso();
  // 3.0: lo que ya estaba en la escena (el valle): adentro de la nave se esconde
  const delValle = new Set(escena.children);
  // 3.8.0: los duendes se dibujan instanciados (después de anotar lo del valle: adentro del Coihue se
  // ven); todos sus modelos se arman ahora, en la carga, y no en plena noche
  instalarDuendes(escena);
  precalentarDuendes();
  // 2.7.3: lo fabricado o encontrado queda en `cosas`; una partida sin `cosas` ya no rompe
  // (antes el taller gastaba los materiales y fallaba al anotar)
  function darCosa(clave) {
    const p = progreso();
    if (!p.cosas) p.cosas = {};
    p.cosas[clave] = 1;
  }
  const D = () => {
    const p = progreso();
    if (!p.desafio) p.desafio = sanearDesafio(null);
    return p.desafio;
  };

  // ---------------- pools
  const aliens = [];
  const libres = {};
  for (const t of Object.keys(TIPOS_ALIEN)) libres[t] = [];
  function tomarAlien(tipo) {
    let a = libres[tipo].pop();
    if (!a) {
      const m = crearDuende(tipo);
      escena.add(m.g);
      a = { m, tipo, def: TIPOS_ALIEN[tipo] };
    }
    a.m.reiniciar();
    a.m.g.visible = true;
    return a;
  }
  function soltarAlien(a) {
    // 3.8.1: el que se va (o desaparece) con algo robado lo deja tirado donde estaba: no se lo lleva al
    // pozo de reciclado (antes quedaba en `a.robo`, sin atadito, hasta el amanecer)
    if (a.robo) soltarRobo(a, false);
    a.m.g.visible = false;
    a.m.g.position.set(0, -500, 0);
    libres[a.tipo].push(a);
  }

  // Precalentar: una malla de cada tipo visible (bajo tierra) durante la compilación
  // inicial, así la primera oleada no provoca un tirón por shaders nuevos.
  const precalentados = Object.keys(TIPOS_ALIEN).map((t) => { const a = tomarAlien(t); a.m.g.position.set(0, -500, 0); return a; });

  const nave = mallaNave();
  nave.g.scale.setScalar(1.5);   // tiene que imponerse sobre las copas desde lejos
  nave.g.visible = false;
  escena.add(nave.g);
  const luzNave = new THREE.PointLight(0xa6ff6e, 0, 90, 1.6);
  nave.g.add(luzNave);
  luzNave.position.y = -4;
  registrarLuz(luzNave);   // 2.7.4: ver luces.js
  const estadoNave = { fase: 'fuera', t: 0, x: 0, z: 0, y: 0, porBajar: [], ritmo: 0 };

  // ---------------- proyectiles (flechas, pernos de ballesta, plasma de los invasores)
  const matFlecha = new THREE.MeshLambertMaterial({ color: '#6b5238' });
  const matPlasma = new THREE.MeshBasicMaterial({ color: '#7dfff0' });
  const matPlasmaAlien = new THREE.MeshBasicMaterial({ color: VERDE_OJO });
  // 3.8.0: el panzón escupe un pegote de savia y esporas (unas bolitas juntas, del color de la savia)
  const matAcido = new THREE.MeshBasicMaterial({ color: '#cdd060' });
  const geoAcido = (() => {
    const g = new THREE.BufferGeometry(), pos = [];
    for (const [x, y, z, r] of [[0, 0, 0, 0.15], [0.1, 0.05, 0.02, 0.09], [-0.09, 0.03, -0.04, 0.08], [0.02, -0.08, 0.07, 0.08], [-0.03, 0.09, 0.06, 0.07]]) {
      const b = new THREE.IcosahedronGeometry(r, 1).translate(x, y, z);
      pos.push(...b.attributes.position.array);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  })();
  // 3.8.0: el hondero tira bellotas (con su capuchón); se ven de noche
  const matBellota = new THREE.MeshBasicMaterial({ color: '#c99a52' });
  const geoBellota = new THREE.LatheGeometry([[0.001, -0.075], [0.03, -0.065], [0.045, -0.035], [0.047, 0.0], [0.04, 0.02], [0.056, 0.024], [0.058, 0.04], [0.035, 0.058], [0.008, 0.066], [0.006, 0.085], [0.001, 0.086]].map(([r, y]) => new THREE.Vector2(r, y)), 10).rotateX(Math.PI / 2).scale(1.4, 1.4, 1.4);
  const geoFlecha = new THREE.CylinderGeometry(0.018, 0.018, 0.85, 5).rotateX(Math.PI / 2);
  const geoPerno = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5).rotateX(Math.PI / 2);
  const geoBola = new THREE.IcosahedronGeometry(0.16, 1);
  const geoPiedra = new THREE.IcosahedronGeometry(0.07, 0);
  const geoRoca = new THREE.IcosahedronGeometry(0.42, 0);   // 2.1: la del jefe artillero
  const matPiedra = new THREE.MeshLambertMaterial({ color: '#7d766c' });
  // boleadoras: tres bolas atadas que giran en el aire
  const geoBoleadora = (() => {
    const g = new THREE.BufferGeometry();
    // 3.5.4: el icosaedro ya viene sin índice (toNonIndexed devolvía lo mismo y escribía un aviso por bola)
    const partes = [0, 1, 2].map((i) => new THREE.IcosahedronGeometry(0.07, 0).translate(Math.cos(i * 2.1) * 0.28, 0, Math.sin(i * 2.1) * 0.28));
    const pos = [];
    for (const p of partes) pos.push(...p.attributes.position.array);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  })();
  const proyectiles = [];
  const reservaProy = [];
  let arsenal = null;   // 2.5: se arma más abajo, cuando está la api
  let fortin = null;    // 2.6: ídem
  function lanzarProyectil(tipo, desde, vel, dano, deJugador, fuente = 'jugador') {
    let p = reservaProy.find((q) => q.tipo === tipo);
    if (p) reservaProy.splice(reservaProy.indexOf(p), 1);
    else {
      // 2.5: las del arsenal traen su malla (ver desafio-arsenal-mundo.js)
      const propia = arsenal?.malla(tipo);
      const geo = propia ? propia.geo : tipo === 'flecha' ? geoFlecha : tipo === 'perno' ? geoPerno : tipo === 'piedra' ? geoPiedra : tipo === 'boleadora' ? geoBoleadora : tipo === 'acido' ? geoAcido : tipo === 'roca' ? geoRoca : tipo === 'bellota' ? geoBellota : geoBola;
      const mat = propia ? propia.mat : tipo === 'bellota' ? matBellota : tipo === 'plasma' ? matPlasmaAlien : tipo === 'acido' ? matAcido : tipo === 'plasmaAliado' || tipo === 'rayo' ? matPlasma : tipo === 'piedra' || tipo === 'boleadora' || tipo === 'roca' ? matPiedra : matFlecha;
      p = { tipo, mesh: new THREE.Mesh(geo, mat), pos: new THREE.Vector3(), vel: new THREE.Vector3() };
      p.mesh.frustumCulled = false;
      escena.add(p.mesh);
    }
    p.pos.copy(desde); p.vel.copy(vel); p.dano = dano; p.deJugador = deJugador; p.vida = 4; p.clavada = 0; p.fuente = fuente;
    const propia = arsenal?.malla(tipo);
    p.gravedad = propia ? propia.gravedad : tipo === 'flecha' || tipo === 'piedra' || tipo === 'boleadora' || tipo === 'roca' ? 9.8 : tipo === 'acido' ? GRAVEDAD_ACIDO : tipo === 'perno' ? 4 : 0;
    p.danoObra = 0; p.salpicadura = 0; p.efecto = null; p.enreda = 0;
    // 2.5: lo que el arsenal le pone a cada tiro (se limpia al reusar el proyectil)
    p.atraviesa = 0; p.golpeados = null; p.flechaTipo = null; p.arma = null; p.descarga = null; p.terminado = false;
    if (tipo === 'plasmaAliado') p.mesh.scale.setScalar(0.8);
    p.ignorar = deJugador ? obraEnPunto(desde.x, desde.y, desde.z) : null;
    p.mesh.visible = true;
    p.mesh.position.copy(desde);
    proyectiles.push(p);
    return p;
  }
  // 3.0: el suelo: el terreno, o el piso de adentro de la nave
  function alturaSuelo(x, z) { return naveMundo.adentro ? naveMundo.alturaPiso(x, z) : T.altura(x, z); }
  function retirarProyectil(i) {
    const p = proyectiles[i];
    p.mesh.visible = false;
    proyectiles.splice(i, 1);
    reservaProy.push(p);
  }

  // rayo de la pistola: un haz breve que se desvanece
  const rayo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5),
    new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  rayo.frustumCulled = false;
  escena.add(rayo);

  // ---------------- cristales que dejan los invasores
  // 3.8.0: son semillas doradas (ver desafio-coihue-formas.js)
  const geoCristal = geoSemilla(0.3);
  const matCristal = new THREE.MeshBasicMaterial({ vertexColors: true });
  const cristales = [];
  function soltarCristales(pos, n) {
    for (let i = 0; i < n; i++) {
      let c = cristales.find((q) => !q.activo);
      if (!c) {
        if (cristales.length > 80) break;   // el jefe suelta muchos de golpe
        c = { mesh: new THREE.Mesh(geoCristal, matCristal), activo: false, x: 0, z: 0, y: 0, t: 0 };
        escena.add(c.mesh);
        cristales.push(c);
      }
      const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.6;
      c.x = pos.x + Math.cos(a) * r; c.z = pos.z + Math.sin(a) * r;
      c.y = alturaSuelo(c.x, c.z) + 0.35;   // 3.0
      // 3.8.3: estas dos líneas estaban metidas en el comentario de arriba: la semilla que suelta un duende
      // se veía pero nunca se activaba (no se juntaba, y las del mandamás eran todas la misma)
      c.t = Math.random() * 6; c.activo = true;
      c.mesh.visible = true;
    }
  }

  // ---------------- la cápsula estrellada con la pistola de plasma
  const capsula = (() => {
    const r = rng(90210);
    const ref = T.lugares.refugio;
    const lugares = Object.values(T.lugares).filter((l) => l && Number.isFinite(l.x));
    for (let intento = 0; intento < 400; intento++) {
      const a = r() * Math.PI * 2, dist = 150 + r() * 110;
      const x = ref.x + Math.cos(a) * dist, z = ref.z + Math.sin(a) * dist;
      if (Math.abs(x) > LIMITE - 40 || Math.abs(z) > LIMITE - 40 || T.agua(x, z)) continue;
      if ((T.pendiente?.[T.indice(x, z)] ?? 0) > 0.32) continue;
      if (lugares.some((l) => Math.hypot(l.x - x, l.z - z) < 35)) continue;
      return { x, z, y: T.altura(x, z) };
    }
    return { x: ref.x + 60, z: ref.z + 60, y: T.altura(ref.x + 60, ref.z + 60) };
  })();
  const grupoCapsula = new THREE.Group();
  grupoCapsula.position.set(capsula.x, capsula.y, capsula.z);
  {
    const casco = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 10), lam('#9aa0a6'));
    casco.scale.set(1, 1.9, 1);
    casco.rotation.set(0.35, 0.6, Math.PI / 2 - 0.25);
    casco.position.y = 0.45;
    grupoCapsula.add(casco);
    const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshBasicMaterial({ color: '#9fe8c8' }));
    vidrio.position.set(0.9, 0.95, 0.5);
    grupoCapsula.add(vidrio);
    for (let i = 0; i < 7; i++) {
      const t = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + (i % 3) * 0.12, 0), lam('#5a4a3a'));
      const a = i * 0.9;
      t.position.set(Math.cos(a) * 1.9, 0.05, Math.sin(a) * 1.6);
      grupoCapsula.add(t);
    }
    grupoCapsula.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  const faroCapsula = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 90, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: '#a6ff6e', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  faroCapsula.position.y = 45;
  grupoCapsula.add(faroCapsula);
  escena.add(grupoCapsula);
  col.agregar({ x: capsula.x, z: capsula.z, r: 1.1, alturaMin: capsula.y - 1, alturaMax: capsula.y + 1.6 });

  // ---------------- sonidos: el banco vive en `desafio-sonidos.js`
  const S = crearBanco(sonido);
  // 2.0: todo lo que suena de noche pasa por `oir`, que decide el subtítulo con
  // dirección, si la mezcla se agacha y si vibra el mando (ver `desafio-sentidos.js`).
  // Se envuelven sólo los sonidos que vienen de algún lado: el primer argumento es la
  // posición.
  const miraJugador = new THREE.Vector3(0, 0, -1);
  const ultimosOidos = [];
  function oir(clave, pos) {
    if (!pos) return;
    const js = ctx.jugador().estado;
    const texto = subtituloSonido({ clave, pos, jugador: js.pos, mira: miraJugador, t: ctx.t });
    if (texto) { ctx.sonidoEscrito?.(texto); ultimosOidos.push(texto); if (ultimosOidos.length > 12) ultimosOidos.shift(); }
    const d = Math.hypot(pos.x - js.pos.x, pos.z - js.pos.z);
    const agache = agacheDeMezcla(clave, d);
    if (agache) ctx.agacharMezcla?.(agache.profundidad, agache.sostener);
    if ((clave === 'chillido' || clave === 'embestida') && d < 14) ctx.vibrar?.('chillido', 1 - d / 14);
    else if (clave === 'jefe' && d < 60) ctx.vibrar?.('jefe', 1 - d / 60);
    else if (clave === 'derrumbe' && d < 25) ctx.vibrar?.('derrumbe', 1 - d / 25);
  }
  // el perro suena donde está el perro, pero se escribe hacia donde está lo que le gruñe:
  // esos dos se escriben a mano (ver `desafio-aliados.js`)
  const A_MANO = new Set(['grunirPerro', 'ladrarPerro']);
  for (const clave of Object.keys(SONIDOS_ESCRITOS)) {
    const original = S[clave];
    if (typeof original !== 'function' || A_MANO.has(clave)) continue;
    S[clave] = (...args) => { const r = original(...args); oir(clave, args[0]); return r; };
  }


  // ---------------- subsistemas del Desafío
  const efectos = crearEfectos(escena, { calidad: ctx.calidad?.() || 'media' });
  const musica = crearMusicaTension(sonido);
  let camaraLenta = 0;
  // api compartida por defensas, eventos y aliados: se resuelve en tiempo de llamada
  const api = {
    get aliens() { return aliens; },
    D: () => D(),
    jugador: () => ctx.jugador(),
    nota: (t, s, n) => ctx.nota(t, s, n),
    guardar: () => ctx.guardar(),
    clima: () => ctx.clima?.() || { lluvia: 0, nublado: 0, invierno: 0 },
    cuanto: (k) => ctx.cuanto(k),
    gastar: (k, n) => ctx.gastar(k, n),
    sumarMaterial: (k, n) => ctx.sumarMaterial(k, n),
    herirAlien: (a, dano, desde, fuente, clase) => herirAlien(a, dano, desde, fuente, null, clase),   // 3.0: `clase`, ver desafio-evolucion.js
    herirJugador: (n, desde) => herirJugador(n, desde),
    curar: (n, silencioso) => curar(n, silencioso),
    lanzarProyectil: (tipo, desde, vel, dano, deJugador, fuente) => lanzarProyectil(tipo, desde, vel, dano, deJugador, fuente),
    destruirObra: (o, silenciosa) => {
      if (!obras.obras.includes(o)) return;
      const caidas = obras.destruir(o);
      if (silenciosa) ctx.alGuardarObras?.(); else { nocheActual.perdidas += caidas.length; ctx.alDerribar?.(caidas); }
    },
    rumboTexto: (desde, hacia) => rumboTexto(desde, hacia),
    centroBase: () => centroBase(),
    alturaEn: (x, z) => T.altura(x, z),
    gente: () => ctx.gente?.(),
    sonido, efectos,
    obraMasDanada: (c, radio) => {
      let mejor = null, peor = 0.999;
      for (const o of obras.obrasCerca(c, radio, [])) {
        if (!completa(o) || !Number.isFinite(o.datos.vida)) continue;
        const { vida, max } = vidaDe(o);
        if (vida / max < peor) { peor = vida / max; mejor = o; }
      }
      return mejor;
    },
    // 1.11: los portones terminados, para la orden "cuidá el portón"
    portones: () => obras.obras.filter((o) => o.plano.porton && completa(o)).map((o) => ({ x: o.datos.x, z: o.datos.z })),
    reparar: (o, cantidad) => { const { vida, max } = vidaDe(o); o.datos.vida = Math.min(max, vida + cantidad); return o.datos.vida >= max; },
    crearMallaNave: () => { const m = mallaNave(); m.haz.visible = false; return m; },
    largarDesde: (x, z) => {
      // la nodriza larga grupos chicos mientras siga en el aire (nunca otro jefe)
      const tipos = sinJefe(composicionOleada(Math.max(3, D().oleadas), ctx.dificultad?.(), D().vuelta)).slice(0, 5);
      // 3.5.1: bajan ahí mismo, flotando desde la nodriza. Antes iban a la cola de la nave de
      // la oleada con la nave escondida: esa cola no se vaciaba nunca (ninguna tanda llegaba
      // al suelo, no se podía dormir) y si la oleada todavía estaba bajando, la cortaba.
      let n = 0;
      for (const t of tipos) {
        const an = Math.random() * Math.PI * 2, r = Math.random() * 3.5;
        const a = aparecerEn(t, x + Math.cos(an) * r, z + Math.sin(an) * r);
        if (!a) continue;
        a.estado = 'bajar'; a.t = 0; a.m.g.position.y += 16;
        n++;
      }
      if (n) { nocheActual.invasores += n; D().vivos = vivos(); }
    },
    alDerrotarNodriza: () => vencer(),
    hudNodriza: document.getElementById('nodriza-hud'),
    // El nido necesita saber la hora: sólo se abre y se rompe de día.
    horas: () => progreso().horas,
    alCaerNido: () => caerNido(),
    // 2.0: para que las defensas y el perro también se escriban y se agachen
    oir: (clave, pos) => oir(clave, pos),
    S,
    mira: () => miraJugador,
    // 2.1: la ruina de los restos necesita chocar y despertar invasores
    col,
    invocar: (tipo, x, z) => invocar(tipo, x, z),
  };
  const defensas = crearDefensasActivas(T, escena, obras, sonido, efectos, api, { calidad: ctx.calidad?.() || 'media' });
  const eventos = crearEventos(T, escena, sonido, efectos, api);
  const aliados = crearAliados(api);
  const cimientos = crearCimientos(T, escena);
  // 2.5: el arsenal (ver desafio-arsenal-mundo.js)
  api.prenderCerca = (pos, radio) => prenderCerca(pos, radio);
  api.llamarCompaneros = () => aliados.llamar?.() || 0;
  api.alJuntar = () => ctx.alFabricar?.({});
  arsenal = crearArsenalMundo(T, escena, efectos, sonido, api);
  // 2.6: el fortín (ver desafio-fortin-mundo.js)
  api.obraEnPunto = (x, y, z) => obraEnPunto(x, y, z);
  api.cosas = () => progreso().cosas || {};
  api.alGuardarObras = () => ctx.alGuardarObras?.();
  api.alFabricar = () => ctx.alFabricar?.({});
  api.puestoTirador = () => fortin.puestoTirador();
  // 3.5.1: la explosión de la granada también llega a los blancos (nido, puestos, agujas, la
  // Madre); y lo que queda tirado adentro de la nave va a su piso
  api.blancos = () => eventos.blancos();
  api.herirBlanco = (n, dano) => eventos.herirNucleo(n, dano);
  api.alturaSuelo = (x, z) => alturaSuelo(x, z);
  fortin = crearFortinMundo(T, escena, col, obras, efectos, sonido, api, defensas);
  // 3.0: el asedio final y la pelea adentro de la nave (ver desafio-asedio*.js y
  // desafio-nave*.js). Las agujas y los puntos débiles de la Madre entran como blancos por
  // el mismo camino que los núcleos y el nido: todas las armas ya les pegan.
  api.claveDificultad = () => ctx.dificultad?.();
  api.dia = () => progreso().dia;
  api.horaActual = () => ({ h: progreso().horas, dia: progreso().dia });
  api.fijarHora = (h, dia) => { const p = progreso(); p.horas = h; p.dia = dia; };
  api.hayAtaque = () => hayAtaque();
  api.vibrar = (e, k) => ctx.vibrar?.(e, k);
  api.camaraLenta = (s) => { camaraLenta = Math.max(camaraLenta, s); };
  api.abordar = () => naveMundo.entrar();
  api.sitioHaz = () => asedioMundo.sitioHaz();
  api.alGanarNave = () => asedioMundo.derribar(() => vencer({ nave: true }));
  const asedioMundo = crearAsedioMundo(T, escena, efectos, sonido, api);
  const naveMundo = crearNaveMundo(T, escena, col, camara, efectos, sonido, api, { delValle: (o) => delValle.has(o) });
  const blancosDelValle = eventos.blancos, herirDelValle = eventos.herirNucleo;
  eventos.blancos = () => (naveMundo.adentro ? naveMundo.blancos() : asedioMundo.blancos(blancosDelValle()));
  eventos.herirNucleo = (n, dano) => (n?.nave ? naveMundo.herir(n, dano) : n?.ancla ? asedioMundo.herir(n, dano) : herirDelValle(n, dano));
  // 3.0: los invasores que evolucionan y los puestos del bosque (ver desafio-evolucion*.js y
  // desafio-puestos*.js). Las estructuras de los puestos entran como blancos por el mismo
  // camino que las cámaras del nido: flechas, rayo, torretas y golpes les llegan igual.
  api.aparecer = (tipo, x, z) => aparecerEn(tipo, x, z);
  api.sumarInvasores = (n) => { nocheActual.invasores += n; D().vivos = (D().vivos || 0) + n; };
  api.pistaDeNido = () => eventos.pistaDeNido();
  const evolucion = crearEvolucionMundo(efectos, sonido, api);
  const puestos = crearPuestosMundo(T, escena, efectos, sonido, api);
  const blancosDeEventos = eventos.blancos, herirDeEventos = eventos.herirNucleo;
  eventos.blancos = () => puestos.conBlancos(blancosDeEventos());
  eventos.herirNucleo = (n, dano) => (n?.puesto ? puestos.herir(n, dano) : herirDeEventos(n, dano));
  // 3.0: los lugares del mapa de la semilla: cantera, cristales, leña y alijos (ver desafio-mapa*.js)
  const mapaMundo = crearMapaMundo(T, escena, { D, dia: () => progreso().dia, nota: (t, s, n) => ctx.nota(t, s, n), sumarMaterial: (k, n) => ctx.sumarMaterial(k, n), guardar: () => ctx.guardar(), sonido });
  // 3.0: la base con la que arrancó la partida (null: la de siempre, el refugio)
  const baseMapa = () => { const b = D().mapa?.base; return b && !b.refugio ? b : null; };
  let relojCimientos = 0;
  // Centro de la base: promedio de las defensas y módulos construidos (o el refugio).
  // 3.0: o la base del mapa de la semilla, si la partida arrancó en otro lado.
  let centroCache = null, centroT = -1;
  function centroBase() {
    const ahora = performance.now();
    if (centroCache && ahora - centroT < 4000) return centroCache;
    let sx = 0, sz = 0, n = 0;
    for (const o of obras.obras) if (o.datos.etapas > 0 && (o.plano.categoria === 'defensa' || o.plano.snap?.tipo === 'piso')) { sx += o.datos.x; sz += o.datos.z; n++; }
    const r = baseMapa() || T.lugares.refugio;
    centroCache = n ? { x: sx / n, z: sz / n } : { x: r.x, z: r.z };
    centroT = ahora;
    return centroCache;
  }
  // La nave nodriza cae: victoria del Desafío (se puede seguir jugando en modo infinito).
  function vencer(extra = {}) {   // 3.0: `extra.nave`: se ganó desde adentro de la nave
    const d = D();
    if (d.victoria) return;
    d.victoria = true;
    d.nodriza = null;
    camaraLenta = 2.2;
    musica.golpeFinal();
    anunciarLogros(evaluarEstado(totalLogros()));
    registrarRecords(true);
    abrirSegundoActo();
    ctx.alVencer?.({ noches: d.noches, abatidos: d.abatidos, derrotas: d.derrotas, dificultad: ctx.dificultad?.() || 'normal', ...extra });
    ctx.guardar();
  }


  // ---------------- segundo acto: el nido
  // La nodriza cayó pero los invasores siguen bajando, porque el nido sigue
  // entero en algún lado del valle. Se ubica con las señales de los restos de
  // nave y se revienta de día, que es cuando el caparazón se abre.
  function abrirSegundoActo() {
    const d = D();
    if (d.nido) return;
    const sitio = (x, z) => !T.agua(x, z) && (T.pendiente?.[T.indice(x, z)] ?? 0) <= 0.32;
    // 3.0: con el mapa de la semilla, el nido está donde dice el código
    const n0 = mapaMundo.mapa.nido;
    const p = (n0 && sitio(n0.x, n0.z) ? n0 : null) || lugarDelNido(centroBase(), sitio);
    if (!p) return;
    d.nido = nidoNuevo(p);
    setTimeout(() => ctx.nota('Siguen saliendo', 'El Coihue Viejo cayó, pero la cueva sigue entera. Los troncos huecos te van a decir dónde está: se rompe de día, cuando se le abre la boca', true), 4200);
  }
  function caerNido() {
    const d = D();
    if (!d.nido || !d.nido.caido) return;
    camaraLenta = 2.4;
    musica.golpeFinal();
    const cristales = NIDO.cristales[0] + Math.floor(Math.random() * (NIDO.cristales[1] - NIDO.cristales[0] + 1));
    ctx.sumarMaterial?.('cristal', cristales);
    ctx.nota('SE DERRUMBÓ LA CUEVA', `Se terminó: de acá no sale nadie más. +${cristales} semillas doradas`, true);
    registrarRecords(true);
    ctx.alTerminar?.({ noches: d.noches, abatidos: d.abatidos, derrotas: d.derrotas, dificultad: ctx.dificultad?.() || 'normal', cristales });
    ctx.guardar();
  }

  // ---------------- obras: resistencia, bloqueo y línea de visión
  const scratchObras = [];
  function completa(o) { return o.datos.etapas > 0; }
  function vidaDe(o) {
    const max = vidaMaxObra(o.plano, o.datos.etapas);
    if (!Number.isFinite(o.datos.vida)) o.datos.vida = max;
    return { vida: o.datos.vida, max };
  }
  function local(o, x, z) {
    const rot = o.datos.rot || 0, dx = x - o.datos.x, dz = z - o.datos.z;
    return { lx: dx * Math.cos(rot) - dz * Math.sin(rot), lz: dx * Math.sin(rot) + dz * Math.cos(rot) };
  }
  // ¿El punto está dentro del volumen de alguna obra? (para flechas, plasma y golpes a través de paredes)
  // 2.6: `tiroPropio`: tus tiros pasan por las troneras y por debajo de lo que está en
  // alto (ver desafio-fortin-mundo.js); el puente bajado no es pared; el embudo son dos alas.
  function obraEnPunto(x, y, z, margen = 0.05, ignorar = null, tiroPropio = false) {
    const lista = obras.obrasCerca({ x, z }, 7, scratchObras);
    for (const o of lista) {
      if (!completa(o) || o === ignorar || (o.plano.porton && obras.portonAbierto?.(o))) continue;
      if (fortin?.obraAbierta(o)) continue;
      const P = o.plano, base = o.datos.y ?? T.altura(o.datos.x, o.datos.z);
      if (y < base - 0.05 || y > base + (P.alto || 1) + 0.1) continue;
      if (fortin?.sinCuerpo(o) || fortin?.debajo(o, y - base)) continue;   // 2.6: por debajo del tejado se pasa (todos)
      if (tiroPropio && fortin?.pasaTiro(o, y - base)) continue;
      const { lx, lz } = local(o, x, z);
      if (P.defensa?.segmentos) { if (fortin.distanciaASegmentos(o, lx, lz) <= 0.3 + margen) return o; continue; }
      if (Math.abs(lx) <= (P.ancho || 1) / 2 + margen && Math.abs(lz) <= Math.max(0.2, (P.fondo || 1) / 2) + margen) return o;
    }
    return null;
  }
  // 3.0.1: ¿la obra tiene cuerpo (una colisión suya) al alcance del invasor? Lo que se pisa
  // (un piso, la losa, el foso, los abrojos) no frena a nadie: antes, trabado contra la pared
  // de arriba, el invasor rompía el piso o el foso sobre el que estaba parado.
  const distColision = (c, p) => {
    if (!c.seg) return Math.hypot(p.x - c.x, p.z - c.z);
    const vx = c.bx - c.ax, vz = c.bz - c.az, l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((p.x - c.ax) * vx + (p.z - c.az) * vz) / l2));
    return Math.hypot(p.x - c.ax - vx * t, p.z - c.az - vz * t);
  };
  function cuerpoCerca(o, p, r) {
    const esDe = (c) => c.duenio === o || c.duenio?.puente === o;
    for (const dx of [-4, 0, 4]) for (const dz of [-4, 0, 4]) for (const c of col.cercanos(p.x + dx, p.z + dz)) if (esDe(c) && distColision(c, p) < c.r + r) return true;
    for (const c of col.dinamicos || []) if (esDe(c) && distColision(c, p) < c.r + r) return true;
    return false;
  }
  function obraBloqueando(a) {
    const r = a.def.radio * a.m.esc + 0.45;
    const lista = obras.obrasCerca(a.m.g.position, 7, scratchObras);
    let mejor = null, d0 = 1e9;
    for (const o of lista) {
      if (!completa(o) || o.plano.defensa?.tipo === 'estacas' || (o.plano.porton && obras.portonAbierto?.(o))) continue;
      if (fortin?.obraAbierta(o) || fortin?.sinCuerpo(o)) continue;   // 2.6: el puente bajado se cruza; el lazo no es pared
      if (!cuerpoCerca(o, a.m.g.position, r)) continue;   // 3.0.1
      const P = o.plano, base = o.datos.y ?? 0;
      if (base > a.m.g.position.y + a.def.altura || base + (P.alto || 1) < a.m.g.position.y - 0.3) continue;
      if (fortin?.debajo(o, a.m.g.position.y - base + 0.4)) continue;   // 2.6: se pasa por debajo del tejado y la pasarela
      const { lx, lz } = local(o, a.m.g.position.x, a.m.g.position.z);
      const ex = Math.abs(lx) - (P.ancho || 1) / 2, ez = Math.abs(lz) - Math.max(0.2, (P.fondo || 1) / 2);
      const d = P.defensa?.segmentos ? fortin.distanciaASegmentos(o, lx, lz) - 0.3 : Math.max(ex, ez);
      if (d < r && d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  // 3.8.1: ¿hay una obra entre el punto del tiro (x, y, z) y el cuerpo del duende? Con el margen de golpe
  // (los duendes son chiquitos: radio + 0,2, la boleadora + 0,45; el rayo + 0,25) un tiro que pasaba
  // pegado a una pared delgada, o la rozaba en diagonal, le pegaba al que estaba del otro lado. Se mira
  // a la altura del tiro (dentro del cuerpo) y en pasos cortos; sólo cuando ya hubo golpe (barato).
  const _mtA = { x: 0, y: 0, z: 0 }, _mtB = { x: 0, y: 0, z: 0 };
  function margenTapado(x, y, z, a, ignorar = null) {
    const p = a.m.g.position, alto = a.def.altura * a.m.esc;
    _mtA.x = x; _mtA.y = y; _mtA.z = z;
    _mtB.x = p.x; _mtB.y = Math.max(p.y + 0.15, Math.min(p.y + alto, y)); _mtB.z = p.z;
    return !!hayObraEntre(_mtA, _mtB, 0.12, ignorar, true);
  }
  function hayObraEntre(a, b, paso = 0.45, ignorar = null, tiroPropio = false) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const L = Math.hypot(dx, dy, dz);
    const n = Math.floor(L / paso);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const o = obraEnPunto(a.x + dx * t, a.y + dy * t, a.z + dz * t, -0.02, ignorar, tiroPropio);
      if (o) return o;
    }
    return null;
  }
  const sacudidas = new Map();
  // ¿La obra es de piedra? (define chispas y polvo en lugar de astillas)
  const esPiedra = (o) => { let p = 0, m = 0; for (const e of o.plano.etapas || []) { p += e.pide?.piedra || 0; m += (e.pide?.tronco || 0) + (e.pide?.tabla || 0); } return p > m; };
  let acumEfectoObra = 0;
  function danarObra(o, n) {
    if (!o || !obras.obras.includes(o)) return;
    vidaDe(o);
    n *= defensas.factorDanoObra(o) * fortin.factorDanoObra(o);   // 2.6: contrafuerte y hielo
    o.datos.vida -= n;
    sacudidas.set(o, 0.25);
    if (Math.random() < 0.5) S.madera(o.datos);
    if (n >= 5 && performance.now() - acumEfectoObra > 90) {
      acumEfectoObra = performance.now();
      const js = ctx.jugador().estado;
      // el golpe salta del lado de la obra que mira al invasor más cercano al jugador
      _v.set(o.datos.x + (js.pos.x - o.datos.x) * 0.08, o.datos.y + 0.8 + Math.random() * 0.9, o.datos.z + (js.pos.z - o.datos.z) * 0.08);
      if (esPiedra(o)) { efectos.chispas(_v, 8); efectos.polvo(_v, 4); }
      else efectos.astillas(_v, 7);
    }
    if (o.datos.vida > 0) return;
    const caidas = obras.destruir(o);
    nocheActual.perdidas += caidas.length;
    sacudidas.delete(o);
    S.derrumbe(o.datos);
    ctx.alDerribar?.(caidas);
  }
  let torretas = [], trampas = [], acumuladoDefensas = 99;
  const recargaTorreta = new Map();
  function refrescarDefensas() {
    torretas = obras.obras.filter((o) => completa(o) && o.plano.defensa?.tipo === 'torreta');
    trampas = obras.obras.filter((o) => completa(o) && o.plano.defensa?.tipo === 'estacas');
    zanjas = obras.obras.filter((o) => completa(o) && o.plano.defensa?.tipo === 'zanja');   // 2.3
  }

  // ---------------- salud del jugador
  let sinDano = 99, destello = 0, caido = false;
  const danoEl = document.getElementById('dano');
  // bloqueo con la lanza (clic derecho sostenido) y esquiva (doble toque A/D)
  let bloqueando = false, invulnerable = 0, recargaEsquiva = 0;
  // 2.5: con la lanza, como siempre, o con el escudo de tablas y un arma de una mano.
  // `bloqueando` guarda con qué: 'lanza', 'rodela' o false.
  function bloquear(on, id = 'lanza') {
    bloqueando = on ? conQueBloquea(id, progreso().cosas || {}) || false : false;
    ctx.bloqueoVisual?.(!!bloqueando);
  }
  const puedeBloquear = (id) => !!conQueBloquea(id, progreso().cosas || {});
  function esquivar(lado) {
    if (caido || recargaEsquiva > 0) return false;
    const js = ctx.jugador().estado;
    if (!js.enSuelo || js.nadando || js.enKayak) return false;
    recargaEsquiva = 1.1;
    invulnerable = 0.38;
    js.vel.x += Math.cos(js.yaw) * lado * 15;
    js.vel.z += -Math.sin(js.yaw) * lado * 15;
    sonido.golpeRuido?.({ dur: 0.16, frec: 1400, tipo: 'highpass', vol: 0.18, destino: sonido.bus?.efectos });
    return true;
  }
  function herirJugador(n, desde) {
    if (caido) return;
    const d = D();
    if (desde && invulnerable > 0) return;
    if (desde && bloqueando) {
      // la lanza cruzada frena casi todo lo que viene de adelante
      const js = ctx.jugador().estado;
      const sx = desde.x - js.pos.x, sz = desde.z - js.pos.z, l = Math.hypot(sx, sz) || 1;
      if ((sx * -Math.sin(js.yaw) + sz * -Math.cos(js.yaw)) / l > 0.3) {
        n *= bloqueando === 'rodela' ? RODELA.pasa : 0.25;
        efectos.chispas({ x: js.pos.x - Math.sin(js.yaw) * 0.7, y: js.pos.y + 1.3, z: js.pos.z - Math.cos(js.yaw) * 0.7 }, 10);
        sonido.golpeRuido?.({ dur: 0.12, frec: 2600, q: 3, vol: 0.35, destino: sonido.bus?.efectos });
      }
    }
    // 2.5: el chaleco y las placas de cristal (el primer golpe de cada noche)
    if (desde) {
      const arm = danoConArmadura(n, progreso().cosas || {}, d, d.oleadas);
      if (arm.placas) {
        d.placasNoche = d.oleadas;
        const js = ctx.jugador().estado;
        efectos.destello({ x: js.pos.x, y: js.pos.y + 1.2, z: js.pos.z }, 0.9, '#7dfff0');
        sonido.golpeRuido?.({ dur: 0.3, frec: 3000, q: 3, vol: 0.3, destino: sonido.bus?.efectos });
        ctx.nota('Las placas doradas aguantaron el golpe', 'Hasta la noche que viene no vuelven a salvarte');
        indicarDano(desde);
        return;
      }
      n = arm.dano;
    }
    nocheActual.dano += n;
    if (desde) { n *= dificultad(ctx.dificultad?.()).dano; indicarDano(desde); }
    d.salud = Math.max(0, d.salud - n);
    sinDano = 0;
    destello = Math.min(1, destello + 0.35 + n / 60);
    S.herido();
    ctx.vibrar?.(d.salud <= 0 ? 'caido' : 'herido', Math.min(1, n / 30));
    if (desde) {
      // el golpe empuja un poco
      const js = ctx.jugador().estado;
      _v.set(js.pos.x - desde.x, 0, js.pos.z - desde.z).normalize().multiplyScalar(Math.min(4, n * 0.18));
      js.vel.x += _v.x; js.vel.z += _v.z;
    }
    if (d.salud <= 0) {
      if (naveMundo.adentro && naveMundo.alCaerAdentro()) return;   // 3.0: adentro de la nave no se cae: te escupe al valle
      caido = true;
      if (bloqueando) bloquear(false);   // 3.5.1: caído no se suelta el botón (el mando lo ignora): se levantaba bloqueando
      d.racha = 0;
      d.derrotas++;
      // 3.5.1: de día (la guardia de una aguja o de un puesto) no hay noche que perder: antes
      // se cerraba otra vez la noche ya cerrada y, en la hora antes del ataque, se borraba la
      // noche especial ya anunciada
      if (!d.oleadaTerminada) terminarOleada(false);
      ctx.alCaer?.();
    }
  }
  function curar(n, silencioso = false) {
    const d = D();
    if (d.salud >= SALUD_MAX) return false;
    d.salud = Math.min(SALUD_MAX, d.salud + n);
    if (!silencioso) S.cura();
    return true;
  }
  function levantarse() { caido = false; D().salud = SALUD_MAX; destello = 0; }

  // ---------------- oleadas
  let refuerzoHecho = false, ultimoChillido = 0, avisada = -1;
  const nocheActual = { abatidos: 0, perdidas: 0, dano: 0, abatidosLanza: 0, abatidosOtros: 0, invasores: 0 };
  function reiniciarNoche() { Object.assign(nocheActual, { abatidos: 0, perdidas: 0, dano: 0, abatidosLanza: 0, abatidosOtros: 0, invasores: 0 }); }
  const RUMBOS_TEXTO = ['al norte', 'al noreste', 'al este', 'al sureste', 'al sur', 'al suroeste', 'al oeste', 'al noroeste'];
  function rumboTexto(desde, hacia) {
    const rumbo = Math.atan2(hacia.x - desde.x, hacia.z - desde.z);
    return RUMBOS_TEXTO[((Math.round(-rumbo / (Math.PI / 4)) % 8) + 8 + 4) % 8];
  }
  let rescateForzado = null;   // para las pruebas: la próxima noche es de rescate en este lugar
  function puntoDeAterrizaje(js, azar = Math.random) {
    // 2.1: una noche de rescate, la nave baja cerca del lugar del vecino
    // 2.3: y la de la trochita varada, cerca del tren
    const resc = D().rescate, L = (resc && T.lugares[resc.lugar]) || blancoVarada() || asedioMundo.blancoNoche();   // 3.0: y la del contraataque del asedio
    if (L) {
      for (let i = 0; i < 30; i++) {
        const a = azar() * Math.PI * 2, r = 40 + azar() * 18;
        const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
        if (Math.abs(x) > LIMITE - 25 || Math.abs(z) > LIMITE - 25 || T.agua(x, z)) continue;
        return { x, z };
      }
    }
    for (let i = 0; i < 30; i++) {
      const a = anguloDeBajada(mapaMundo.mapa, azar), r = 72 + azar() * 26;   // 3.0: con código, siempre del mismo lado
      const x = js.pos.x + Math.cos(a) * r, z = js.pos.z + Math.sin(a) * r;
      if (Math.abs(x) > LIMITE - 25 || Math.abs(z) > LIMITE - 25 || T.agua(x, z)) continue;
      return { x, z };
    }
    return { x: js.pos.x + 60, z: js.pos.z };
  }
  function empezarOleada(tipos, nuevaNoche, retomada = false, puntoFijo = null) {
    const js = ctx.jugador().estado;
    const d = D();
    if (nuevaNoche) { d.oleadas++; refuerzoHecho = false; }
    // 2.3: con código de partida, la nave baja siempre del mismo lado esa noche
    const p = puntoFijo || puntoDeAterrizaje(js, azarDe(d.semilla, d.oleadas, nuevaNoche ? 'aterrizaje' : retomada ? 'retomada' : 'refuerzo'));
    estadoNave.x = p.x; estadoNave.z = p.z; estadoNave.y = T.altura(p.x, p.z) + 36;
    estadoNave.fase = puntoFijo ? 'bajando' : 'llegando'; estadoNave.t = 0;
    estadoNave.porBajar.push(...tipos);
    nocheActual.invasores += tipos.length;
    d.vivos = aliens.filter((a) => a.estado !== 'morir').length + estadoNave.porBajar.length;
    nave.g.visible = !puntoFijo;
    if (puntoFijo) return;
    S.sirena();
    const lado = rumboTexto(js.pos, p).replace(/^al /, 'el ');
    const esp = d.especial ? ` · ${ESPECIALES[d.especial].nombre}` : '';
    const conJefe = tipos.includes('jefe') ? ' · ¡viene el mandamás!' : '';
    if (nuevaNoche) ctx.nota(`¡Salen duendes desde ${lado}!`, `Noche ${d.oleadas}${esp} · ${tipos.length} duendes${conJefe}`, true);
    else if (retomada) ctx.nota('Los duendes siguen acá', `${tipos.length} vuelven a salir desde ${lado}`, true);
    else ctx.nota('Llegan refuerzos', `${tipos.length} duendes más desde ${lado}`, true);
  }
  // 2.6.1: un for en vez de find: se llama en cada cuadro (la barra del jefe)
  const jefeVivo = () => { for (const a of aliens) if (a.def.jefe && a.estado !== 'morir' && a.estado !== 'irse') return a; return null; };
  function bajarAlien(tipo) {
    const def = TIPOS_ALIEN[tipo] || TIPOS_ALIEN.rastreador;
    if (def.jefe && jefeVivo()) return null;                  // nunca dos jefes a la vez
    // con la base llena el jefe espera su turno en vez de perderse
    if (aliens.length >= MAX_ALIENS) { if (def.jefe) estadoNave.porBajar.push(tipo); return null; }
    const a = tomarAlien(tipo);
    const mult = D().sinFin ? multiplicadorSinFin(D().oleadas) : multiplicadorNoche(D().oleadas);   // 3.0
    const mv = multiplicadorVuelta(D().vuelta);
    const ang = Math.random() * Math.PI * 2, r = Math.random() * 3.5;
    const x = estadoNave.x + Math.cos(ang) * r, z = estadoNave.z + Math.sin(ang) * r;
    a.m.g.position.set(x, T.altura(x, z) + 16, z);
    a.m.g.rotation.set(0, 0, 0);
    a.m.g.scale.setScalar(1);
    a.vida = a.vidaMax = Math.round(a.def.vida * mult * mv.vida * dificultad(ctx.dificultad?.()).vida);
    a.danoMult = mult * mv.dano;
    a.estado = 'bajar'; a.t = 0; a.fase = Math.random() * 6; a.rumbo = 0; a.cd = 1 + Math.random();
    a.obra = null; a.desvio = 0; a.desvioT = 0; a.atasco = 0; a.flash = 0; a.frenoT = 0; a.giroMuerte = 0;
    a.enredadoT = 0; a.atrapadoT = 0; a.atrapadoDps = 0; a.hundido = 0;
    a.saltoT = 0; a.saltoCd = 0; a.salto = null;
    a.px = x; a.pz = z; a.chillido = 2 + Math.random() * 6;
    // 2.0: lo que es nuevo de esta vida (ver `desafio-sentidos.js` y `desafio-noche2.js`)
    a.sinGolpe = 0; a.visto = false; a.tanteo = 0; a.tanteoTotal = 0; a.tRasca = 0;
    a.acecho = 'normal'; a.sentido = Math.random() < 0.5 ? -1 : 1; a.arbol = null; a.tArbol = 0;
    a.mutado = false; a.velMult = 1;
    a.tLod = 0; a.faseAla = 0; a.tAleteo = 0;   // 3.5.1: el detalle de lejos y el aleteo de la vida anterior
    // Los invasores se reciclan: lo que les quedó de la vida anterior se borra acá. Antes
    // de la 2.6 el congelado de la lanza de hielo, la mordida y el foso quedaban pegados.
    a.congeladoT = 0; a.mordido = 0; a.enFoso = null;
    a.fuegoT = 0; a.tLlama = 0; a.dudaT = 0; a.confusoT = 0; a.tRumboConfuso = 0; a.rumboConfuso = 0; a.arrastre = null;   // 2.5
    a.colgadoT = 0; a.encandilado = 0; a.tCerco = 0;   // 2.6
    a.enNave = false; a.guardiaAsedio = false;   // 3.0: la cría de adentro de la nave y la guardia de una aguja
    // 2.6.1: el volador reciclado seguía yendo a la antorcha (o subiendo) de su vida anterior
    a.subiendo = 0; a.blanco = null; a.tBlanco = 0; a.golpeT = 0; a.reflejo = 0; a.enHaz = false;
    a.resiste = null; a.nivelResiste = 0; a.puesto = null;   // 3.0: la adaptación y el puesto que cuida
    const dd = D();
    if (!a.def.jefe && siguenDespues(dd.despues) && Math.random() < probabilidadMutado(dd.despues.noches)) {
      a.mutado = true; a.m.mutar(true);
      a.vida = a.vidaMax = Math.round(a.vidaMax * MUTADO.vida);
      a.danoMult *= MUTADO.dano; a.velMult = MUTADO.vel;
      a.m.g.scale.setScalar(MUTADO.escala);
    }
    // 3.0: ¿viene preparado contra cómo te defendés? ¿Anoche le rompiste el puesto?
    evolucion.alBajar(a);
    // 3.8.0: de travieso o de viejo (las noches grandes y los mutados), y de qué tamaño (crecen con las
    // noches y con lo que aprendieron); y sin nada robado de la vida anterior
    {
      const d3 = D(), grande = esNocheGrande({ noche: d3.oleadas, especial: d3.especial, sinFin: !!d3.sinFin });
      const viejo = vieneDeViejo(a.tipo, { grande, mutado: a.mutado, azar: Math.random() });
      a.m.vestir?.(viejo, etapaDe({ noche: d3.oleadas, viejo, nivelAdaptado: a.nivelResiste }));
    }
    a.robo = null;
    if (!a.def.jefe) a.vida = a.vidaMax = Math.max(1, Math.round(a.vidaMax * puestos.factorVida()));
    // 2.1: el excavador, el jefe de cada vez y la forja (ver `desafio-valle.js`)
    a.bajoTierra = false; a.tCavar = 0.5 + Math.random(); a.tTierra = 0; a.congeladoT = 0; a.derribadoT = 0;
    a.variante = null; a.tLlamado = LLAMADO.cada * 0.6; a.llamados = 0; a.tRoca = 2; a.m.malla.visible = true;
    aliens.push(a);
    if (a.def.jefe) {
      a.variante = varianteJefe(D().oleadas);
      S.jefe(a.m.g.position);
      const nombre = NOMBRE_JEFE[a.variante];
      ctx.nota(`Sale ${nombre}`, AVISO_JEFE[a.variante], true);
    }
    return a;
  }
  // ---------------- 3.8.0: el robo de los traviesos (una travesura: nunca se pierde nada)
  // Al pegarte, a veces un pillo se lleva algo chico y sale corriendo riéndose. Si le pegás (o cae), lo
  // suelta y vuelve a tus cosas; si se escapa, lo deja tirado (brilla, se levanta pasando cerca); lo que
  // quede al amanecer te lo devuelven. Mientras tanto queda anotado en `robados` (si se guarda la
  // partida, al abrirla vuelve). Las reglas en desafio-duendes-reglas.js.
  const NOMBRE_ROBADO = { cristal: 'una semilla dorada', ramita: 'una ramita', tabla: 'una tabla', piedra: 'una piedra' };
  const robos = { noche: -1, n: 0 };
  const tirados = [];
  function anotarRobado(cosa, n) {
    const d = D();
    if (!d.robados || typeof d.robados !== 'object') d.robados = {};
    d.robados[cosa] = Math.max(0, (d.robados[cosa] || 0) + n);
    if (!d.robados[cosa]) delete d.robados[cosa];
  }
  function devolver(cosa, n) {
    if (!(n > 0)) return;
    if (cosa === 'ramita') { const p = progreso(); p.ramitas = (p.ramitas || 0) + n; }
    else ctx.sumarMaterial(cosa, n);
    anotarRobado(cosa, -n);
  }
  function intentarRobo(a) {
    const d = D();
    if (robos.noche !== d.oleadas) { robos.noche = d.oleadas; robos.n = 0; }
    if (caido || !puedeRobar(a.tipo, { viejo: !!a.m.viejo, roboEnCurso: !!a.robo, robosNoche: robos.n })) return;
    if (Math.random() >= ROBO.prob) return;
    const q = queSeLleva((k) => ctx.cuanto(k));
    if (!q) return;
    ctx.gastar(q.cosa, q.n);
    anotarRobado(q.cosa, q.n);
    a.robo = { cosa: q.cosa, n: q.n, t: ROBO.huida };
    robos.n++;
    a.m.robar?.(true);
    if (S.risa) S.risa(a.m.g.position); else S.chillido(a.m.g.position, a.tipo);
    ctx.nota('¡Un duende te robó!', `Se llevó ${NOMBRE_ROBADO[q.cosa] || 'algo'} y sale corriendo. Pegale y lo suelta`);
  }
  // lo suelta: alcanzado (vuelve a tus cosas) o porque se cansó de correr (queda tirado)
  function soltarRobo(a, alcanzado) {
    const r = a.robo;
    a.robo = null;
    a.m.robar?.(false);
    if (!r) return;
    if (alcanzado) {
      devolver(r.cosa, r.n);
      ctx.nota('Lo recuperaste', `${(NOMBRE_ROBADO[r.cosa] || 'Lo robado').replace(/^una /, 'La ')} vuelve a tus cosas`);
      return;
    }
    const p = a.m.g.position;
    let t = tirados.find((x) => !x.activo);
    if (!t) {
      t = { malla: mallaAtadito(), activo: false };
      escena.add(t.malla);
      registrarHalos(t.malla);
      tirados.push(t);
    }
    t.activo = true; t.cosa = r.cosa; t.n = r.n; t.x = p.x; t.z = p.z;
    t.malla.position.set(p.x, T.altura(p.x, p.z), p.z);
    t.malla.visible = true;
  }
  function levantarTirados(js) {
    for (const t of tirados) {
      if (!t.activo) continue;
      t.malla.rotation.y += 0.02;
      if (Math.hypot(t.x - js.pos.x, t.z - js.pos.z) > ROBO.levantar) continue;
      t.activo = false; t.malla.visible = false;
      devolver(t.cosa, t.n);
      ctx.nota('Lo encontraste', `${(NOMBRE_ROBADO[t.cosa] || 'Lo robado').replace(/^una /, 'La ')} que se llevó un duende`);
    }
  }
  // al amanecer (o al abrir la partida): todo lo que falta vuelve
  function devolverTodo(avisar) {
    let hubo = false;
    for (const a of aliens) if (a.robo) { a.robo.t = 0; const r = a.robo; a.robo = null; a.m.robar?.(false); devolver(r.cosa, r.n); hubo = true; }
    for (const t of tirados) if (t.activo) { t.activo = false; t.malla.visible = false; devolver(t.cosa, t.n); hubo = true; }
    const d = D();
    // 3.8.1: sólo lo que un duende se puede llevar (un `robados` raro en memoria sumaba un material "0")
    for (const [k, n] of Object.entries(d.robados || {})) if (Object.hasOwn(NOMBRE_ROBADO, k)) { devolver(k, Number(n) || 0); hubo = true; }
    d.robados = {};
    if (hubo && avisar) setTimeout(() => ctx.nota('Te devolvieron lo robado', 'Con la primera luz, los duendes dejaron todo en la puerta'), 9000);
  }
  function terminarOleada(sobrevivida) {
    const d = D();
    devolverTodo(true);   // 3.8.0: lo que se llevaron los duendes y no levantaste, te lo devuelven
    for (const a of aliens) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 0; }
    estadoNave.porBajar.length = 0;
    if (nave.g.visible && estadoNave.fase !== 'yendo') { estadoNave.fase = 'yendo'; estadoNave.t = 0; }
    eventos.retirarNodriza();
    asedioMundo.alTerminarNoche(sobrevivida);   // 3.0: si la nodriza sigue arriba al alba, se asienta (el asedio)
    defensas.alAmanecer();
    fortin.alAmanecer();
    if (sobrevivida) {
      d.noches++;
      d.racha++;
      d.mejorRacha = Math.max(d.mejorRacha, d.racha);
      // 2.0: las noches después del nido se cuentan aparte, y son cinco
      if (siguenDespues(d.despues)) {
        const fin = sumarNocheDespues(d.despues);
        if (fin) setTimeout(() => ctx.nota('Se terminaron las noches después', 'Sobreviviste a lo que quedó de la cueva. Ahora sí, el valle es tuyo', true), 3000);
        else ctx.nota(`Noche después ${d.despues.noches} de ${NOCHES_DESPUES}`, 'Cada vez vienen más cambiados');
      }
    }
    // 2.1: si caíste en una noche de rescate, el rescate se cierra sin premio. El enojo
    // queda sólo si el lugar ya había caído (eso se anotó cuando cayó).
    if (!sobrevivida && d.rescate) { d.rescateAnterior = d.rescate.lugar; d.rescate = null; }
    // 2.3: si caíste con el tren varado, el tren sigue; el fuego del pasto se apaga
    if (!sobrevivida) cerrarVarada(false);
    focos.length = 0;
    d.vivos = 0;
    d.oleadaNoche = d.oleadaNoche ?? claveNoche(progreso().dia, progreso().horas);
    d.oleadaTerminada = true;
    d.especialAnterior = d.especial;
    d.especial = null;
    if (!sobrevivida) registrarRecords();
  }
  // 2.1: los dormidos de los restos no cuentan: no son un ataque (si no, no se podría
  // dormir mientras haya una ruina con bichos adentro)
  function vivos() { let n = 0; for (const a of aliens) if (a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'dormido') n++; return n + estadoNave.porBajar.length; }
  // 3.0: en la supervivencia sin fin no hay noche final
  const esNocheFinal = () => { const d = D(); return !d.victoria && !d.sinFin && !d.asedio && d.oleadas + 1 >= NOCHE_FINAL; };

  function revisarHorario() {
    const p = progreso(), d = D();
    const noche = claveNoche(p.dia, p.horas);
    // Con el nido reventado no baja nadie más: el valle vuelve a ser el valle.
    if (!siguenLasNoches(d)) { d.oleadaNoche = noche; d.oleadaTerminada = true; return; }
    // una hora antes: aviso, y se decide si la noche es especial
    if (p.horas >= HORA_ATAQUE - 1 && p.horas < HORA_ATAQUE && avisada !== p.dia && d.oleadaNoche !== p.dia) {
      avisada = p.dia;
      // 2.9: sin código de partida, el azar sale de la semilla del tiempo: así la estación
      // meteorológica puede anunciar la noche y acierta (ver `meteo.js`)
      // 3.0: en la corrida sin fin, las especiales siguen después de la veinte (desafio-supervivencia.js)
      d.especial = esNocheFinal() ? null : d.sinFin ? especialSinFin(d.oleadas + 1, azarEspecial(d, p.meteo, d.oleadas + 1), d.especialAnterior)
        : nocheEspecial(d.oleadas + 1, azarEspecial(d, p.meteo, d.oleadas + 1), d.especialAnterior);
      if (esNocheFinal()) ctx.nota('El bosque cruje entero', 'Esta noche despierta el Coihue Viejo. Preparate para todo', true);
      else if (esNocheDeJefe(d.oleadas + 1)) ctx.nota('Se oye un silbido grave en el monte', 'Esta noche sale un mandamás. Apuntale a los hongos de la espalda', true);
      else if (d.especial) ctx.nota(ESPECIALES[d.especial].aviso, `${ESPECIALES[d.especial].nombre} · en una hora salen los duendes`, true);
      else ctx.nota('Se ven lucecitas entre los árboles', 'En una hora salen los duendes. Cerrá el portón y prepará las armas', true);
      S.sirena();
      evolucion.alAtardecer();   // 3.0: "Vienen resistentes al fuego"
    }
    if (esHoraDeAtaque(p.horas)) {
      if (d.oleadaNoche !== noche) {
        d.oleadaNoche = noche;
        d.oleadaTerminada = false;
        reiniciarNoche();
        defensas.alEmpezarNoche();
        fortin.alEmpezarNoche();
        const final = esNocheFinal();
        let tipos = d.sinFin ? composicionSinFin(d.oleadas + 1, ctx.dificultad?.(), d.vuelta) : composicionOleada(d.oleadas + 1, ctx.dificultad?.(), d.vuelta);   // 3.0
        if (d.especial) tipos = aplicarEspecial(tipos, d.especial);
        tipos = puestos.recortar(tipos);   // 3.0: los puestos que rompiste ya no mandan
        // 2.1: ¿esta noche atacan a un vecino? (ver `desafio-valle.js`)
        const lug = rescateForzado || (varadaForzada ? null : nocheDeRescate(d.oleadas + 1, {
          esJefe: esNocheDeJefe(d.oleadas + 1), especial: d.especial, final: final || asedioMundo.activo,   // 3.0: en el asedio, ni rescates ni trochita
          lugares: Object.keys(RESCATES).filter((k) => T.lugares[k]), anterior: d.rescateAnterior, azar: azarNoche('rescate'),
        }));
        rescateForzado = null;
        d.rescate = lug ? { lugar: lug, vida: VIDA_LUGAR, caido: false } : null;
        // 2.3: ¿esta noche se vara la trochita? (nunca la misma noche que un rescate)
        const varar = !d.rescate && (varadaForzada || nocheDeVarada(d.oleadas + 1, { azar: azarNoche('varada'), esJefe: esNocheDeJefe(d.oleadas + 1), especial: d.especial, final: final || asedioMundo.activo }));
        varadaForzada = false;
        const hayVarada = varar && empezarVarada();
        asedioMundo.alEmpezarNoche();   // 3.0: el contraataque va por la última zona recuperada
        empezarOleada(tipos, true);
        // 2.3: los capullos que quedaron en el bosque se abren ahora
        abrirCapullos();
        puestos.alEmpezarNoche();   // 3.0: y los puestos en pie mandan lo suyo
        if (d.rescate) {
          const R = RESCATES[lug], js = ctx.jugador().estado;
          setTimeout(() => ctx.nota(`¡Atacan ${R.lugar}!`, `Está ${rumboTexto(js.pos, T.lugares[lug])}. Si vas a defenderlo, ${R.nombre} no se lo va a olvidar`, true), 2500);
        }
        if (hayVarada) {
          const js = ctx.jugador().estado, b = blancoVarada();
          setTimeout(() => ctx.nota('¡La trochita se quedó varada!', `Elsa está adentro, ${rumboTexto(js.pos, b)}, a ${quedaParaLlegar(d.varada)} m de la estación. Si la escoltás, llega`, true), 2500);
        }
        if (final) eventos.iniciarNodriza();
      } else if (!d.oleadaTerminada && d.vivos > 0 && !aliens.length && !estadoNave.porBajar.length && nave.g.visible === false) {
        // se cargó una partida guardada en medio del ataque: vuelven los que quedaban
        const n = Math.max(1, d.vivos || 1);
        const tipos = d.sinFin ? composicionSinFin(Math.max(1, d.oleadas), ctx.dificultad?.(), d.vuelta) : composicionOleada(Math.max(1, d.oleadas), ctx.dificultad?.(), d.vuelta);
        empezarOleada(tipos.slice(0, n), false, true);
        if (d.nodriza && !d.victoria) eventos.iniciarNodriza();
      } else if (!d.oleadaTerminada && d.nodriza && !d.victoria && !d.asedio && !eventos.nodrizaActiva) {
        // 3.5.1: guardada en la noche final entre dos tandas de la nodriza (sin invasores
        // vivos), al abrir la nodriza no volvía: los núcleos quedaban sin blanco y al alba
        // empezaba el asedio sin haber podido pelearla.
        eventos.iniciarNodriza();
      } else if (!d.oleadaTerminada && !refuerzoHecho && d.oleadas >= 3 && p.horas >= 1.5 && p.horas < HORA_AMANECER && vivos() < 4 && !eventos.nodrizaActiva) {
        refuerzoHecho = true;
        const refuerzo = sinJefe(d.sinFin ? composicionSinFin(d.oleadas, ctx.dificultad?.(), d.vuelta) : composicionOleada(d.oleadas, ctx.dificultad?.(), d.vuelta));
        empezarOleada(refuerzo.slice(0, Math.ceil(refuerzo.length / 2)), false);
      }
    } else if (d.oleadaNoche !== null && !d.oleadaTerminada) {
      amanecer();
    }
  }

  // 2.1: cómo salió el rescate. Si el lugar aguantó, el vecino agradece —Don Ramón,
  // además, se suma a la base—; si cayó, ya quedó anotado que está enojado.
  function cerrarRescate() {
    const d = D(), r = d.rescate;
    if (!r) return;
    d.rescate = null;
    d.rescateAnterior = r.lugar;
    const R = RESCATES[r.lugar];
    if (r.caido) return;
    d.rescates.hechos = (d.rescates.hechos || 0) + 1;
    const premio = premioRescate(d.oleadas);
    for (const [k, n] of Object.entries(premio)) ctx.sumarMaterial?.(k, n);
    let extra = '';
    if (R.vecino === 'ramon' && !d.companeros.includes('ramon') && aliados.sumar('ramon')) extra = ' Y se viene a tu base a darte una mano.';
    else if (R.vecino === 'nicanor') { d.flechas = (d.flechas || 0) + 8; extra = ' Te dejó ocho flechas.'; }
    else if (R.vecino === 'ercilia') { d.emplastos = (d.emplastos || 0) + 2; extra = ' Te dio dos emplastos.'; }
    else if (R.vecino === 'guarda') { ctx.sumarMaterial?.('cristal', 2); extra = ' Encontró dos semillas doradas en la vía.'; }
    ctx.nota(`${R.nombre} te agradece`, `Defendiste ${R.lugar}: +${premio.tronco} troncos, +${premio.tabla} tablas, +${premio.cristal} semillas doradas.${extra}`, true);
  }
  // Al amanecer: resumen, logros, récords, caja, restos de naves y vecinos que se suman.
  function amanecer() {
    const d = D();
    const especial = d.especial;
    terminarOleada(true);
    musica.alba();
    const partes = [`${nocheActual.abatidos} ${nocheActual.abatidos === 1 ? 'duende abatido' : 'duendes abatidos'}`];
    if (nocheActual.perdidas) partes.push(`${nocheActual.perdidas} ${nocheActual.perdidas === 1 ? 'obra perdida' : 'obras perdidas'}`);
    if (!nocheActual.dano) partes.push('sin un rasguño');
    ctx.nota(`Resististe la noche ${d.oleadas}`, partes.join(' · '), true);
    soltarCaja(d.oleadas);
    cerrarRescate();
    // 2.3: la trochita sigue, y la nave deja capullos para la noche que viene
    cerrarVarada(true);
    sembrarCapullos();
    // 3.0: aprenden de cómo peleaste, y los puestos crecen (o aparece uno nuevo)
    evolucion.alAmanecer();
    puestos.alAmanecer();
    const rs = recordDeSemilla();
    if (rs?.mejoro) setTimeout(() => ctx.nota(`Tu mejor noche con ${d.semilla}`, rs.noches === 1 ? '1 noche resistida con este código' : `${rs.noches} noches resistidas con este código`), 6000);
    if (nocheConRestos(d.oleadas)) eventos.soltarRestos();
    aliados.revisarLlegadas(contarDefensas());
    const ganados = evaluarNoche({
      sobrevivida: true, danoRecibido: nocheActual.dano, abatidos: nocheActual.abatidos, abatidosLanza: nocheActual.abatidosLanza,
      abatidosOtros: nocheActual.abatidosOtros, invasores: nocheActual.invasores, obrasPerdidas: nocheActual.perdidas,
      especial, noche: d.oleadas, dificultad: ctx.dificultad?.() || 'normal',
    }, totalLogros());
    anunciarLogros(ganados);
    registrarRecords();
    ctx.guardar();
  }

  // ---------------- logros y récords
  const logros = crearLogros();
  const contarDefensas = () => obras.obras.filter((o) => o.datos.etapas > 0 && o.plano.categoria === 'defensa').length;
  function totalLogros() {
    const d = D();
    return {
      noches: d.noches, racha: d.racha, abatidos: d.abatidos, pistolaEncontrada: d.pistolaEncontrada,
      recetasHechas: d.recetasHechas, recetasTotales: RECETAS.filter((r) => !r.reparar && !r.reforzar && !r.cimentar).map((r) => r.id),
      companeros: d.companeros.length, abatidosPerro: d.abatidosPerro, defensas: contarDefensas(), planos: d.planos.length, victoria: d.victoria,
    };
  }
  function anunciarLogros(ids) {
    let retraso = 1800;
    for (const id of ids) {
      if (!logros.desbloquear(id)) continue;
      ctx.alLogro?.(id);
      const l = LOGROS.find((q) => q.id === id);
      setTimeout(() => {
        ctx.nota(`Logro: ${l?.nombre || id}`, l?.texto || '', true);
        // 2.7: dos notas de cuerda (mi, si) en vez del bloop; si la cuerda no está lista, el tono de siempre
        if (!sonido.pulsar?.(76, { dur: 1.2, vol: 0.1, destino: sonido.bus?.efectos })) sonido.tono?.({ frec: 660, fin: 990, dur: 0.5, tipo: 'triangle', vol: 0.12, destino: sonido.bus?.efectos });
        else sonido.pulsar(83, { cuando: 0.12, dur: 1.4, vol: 0.09, destino: sonido.bus?.efectos });
      }, retraso);
      retraso += 2200;
    }
  }
  function registrarRecords(victoria = false) {
    const d = D();
    if (d.sinFin) return;   // 3.0: la corrida sin fin tiene sus propios récords (main.js, desafio-supervivencia.js)
    logros.registrarRecord({ dificultad: ctx.dificultad?.() || 'normal', noches: d.noches, racha: d.mejorRacha, abatidos: d.abatidos, victoria });
    if (!victoria) recordDeSemilla();   // 2.3: el récord de este código (el amanecer lo avisa)
  }

  // ---------------- armas del jugador
  let recarga = 0;
  function tieneArma(id) {
    if (id === 'hacha') return !!progreso().cosas?.hacha;
    return !!progreso().cosas?.[id];
  }
  function blancoCuerpo(js, alcance) {
    const fx = -Math.sin(js.yaw), fz = -Math.cos(js.yaw);
    let mejor = null, d0 = 1e9;
    for (const a of aliens) {
      if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar') continue;
      const p = a.m.g.position;
      const dx = p.x - js.pos.x, dz = p.z - js.pos.z;
      const dist = Math.hypot(dx, dz) - a.def.radio * a.m.esc;
      if (dist > alcance || dist >= d0) continue;
      if (Math.abs(p.y - js.pos.y) > 2.2) continue;
      const len = Math.hypot(dx, dz) || 1;
      if ((dx * fx + dz * fz) / len < 0.45) continue;
      mejor = a; d0 = dist;
    }
    return mejor;
  }
  // La cámara de cría que tenés al alcance del brazo, mirándola. Mismo criterio de
  // cono y distancia que `blancoCuerpo`, pero contra los blancos del nido.
  function camaraNidoCerca(js, alcance) {
    const fx = -Math.sin(js.yaw), fz = -Math.cos(js.yaw);
    let mejor = null, d0 = 1e9;
    for (const c of eventos.blancos()) {
      if (!c.nido && !c.asedio) continue;   // 3.0: y las agujas del asedio y la Madre
      const dx = c.pos.x - js.pos.x, dz = c.pos.z - js.pos.z;
      const largo = Math.hypot(dx, dz) || 1;
      const dist = largo - c.radio;
      if (dist > alcance || dist >= d0) continue;
      if ((dx * fx + dz * fz) / largo < 0.45) continue;
      mejor = c; d0 = dist;
    }
    return mejor;
  }
  const SIN_MUNICION = {
    arco: ['No te quedan flechas', 'Fabricá más con K, junto a un banco de trabajo'],
    pistola: ['La pistola está descargada', 'Una semilla dorada da seis cargas (K)'],
    honda: ['No tenés piedras', 'Juntá piedra con el hacha en un pedrero (H)'],
    boleadoras: ['No te quedan boleadoras', 'Se hacen con piedra y tabla (K → Munición)'],
    // 2.5
    ballesta: ['No te quedan virotes', 'Se hacen con tabla y piedra, junto a un banco (K → Munición)'],
    hachuela: ['No te quedan hachas', 'Levantá las que tiraste, o hacé más (K → Arrojadizas)'],
    jabalina: ['No te quedan jabalinas', 'Levantá las que tiraste, o hacé más (K → Arrojadizas)'],
    granada: ['No te quedan granadas', 'Se hacen con una semilla dorada y una piedra (K → Arrojadizas)'],
    humo: ['No te quedan bombas de humo', 'Se hacen con ramitas y tabla (K → Arrojadizas)'],
    bengala: ['No te quedan bengalas', 'Se hacen con ramitas y una semilla dorada (K → Arrojadizas)'],
  };
  // `opciones.tension`: el arco tensado (ver `tensar`), { dano, vel } multiplicadores.
  function atacar(id, opciones = {}) {
    const arma = armaEfectiva(id, progreso().cosas);
    if (!arma || !tieneArma(id) || caido) return false;
    if (recarga > 0) return true;
    const js = ctx.jugador().estado, d = D();
    // 2.5: el arco tira la flecha elegida en el carcaj; si se acabó, pasa a otra
    if (id === 'arco' && flechasDe(d) <= 0 && progreso().cosas?.carcaj) d.flechaTipo = siguienteFlecha(d);
    const hay = id === 'arco' ? flechasDe(d) : arma.deMaterial ? ctx.cuanto(arma.municion) : (d[arma.municion] || 0);
    if (arma.municion && hay <= 0) {
      const [t, s] = SIN_MUNICION[id] || ['Sin munición', ''];
      ctx.nota(t, s);
      recarga = 0.6;
      return true;
    }
    // desde arriba de una torre de vigía se pega más fuerte y más lejos
    const bono = defensas.jugadorEnTorre(js) ? 1.25 : 1;
    recarga = arma.cadencia;
    ctx.gesto?.();
    camara.getWorldDirection(_dir);
    switch (arma.tipo) {
      case 'cuerpo': {
        S.tajo();
        const a = blancoCuerpo(js, arma.alcance);
        if (a) {
          _v.set(js.pos.x, js.pos.y + 1.4, js.pos.z);
          _w.set(a.m.g.position.x, a.m.g.position.y + a.def.altura * 0.6, a.m.g.position.z);
          // 3.8.1: de a 20 cm (de a 45, el hachazo cruzaba una empalizada delgada hasta el duende de atrás)
          if (!hayObraEntre(_v, _w, 0.2, obraEnPunto(_v.x, _v.y, _v.z), true)) {
            // el golpe entra donde estás mirando: a esa altura se mide el punto débil
            const dist = Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z);
            _w.copy(camara.position).addScaledVector(_dir, Math.max(0.4, dist));
            const imp = impactoEn(a, _w.x, _w.y, _w.z);
            // 2.5: el facón por la espalda y la maza contra los grandes
            const dano = danoContra(arma, a.def, danoPorEspalda(arma, arma.dano * bono, imp));
            herirAlien(a, dano, js.pos, id === 'lanza' ? 'lanza' : 'jugador', imp);
            aplicarForja(efectoDeArma(id, progreso().cosas), a, js.pos, arma.dano * bono);   // 2.1
            if (arma.aturde && !a.def.jefe && a.estado !== 'morir') a.enredadoT = Math.max(a.enredadoT || 0, arma.aturde * (a.def.pesado ? 0.5 : 1));
          }
        } else {
          // Al nido se le puede entrar a hachazos: si no, el que nunca fabricó un arco
          // se queda sin forma de terminar el Desafío.
          const c = camaraNidoCerca(js, arma.alcance + 1.6);
          if (c) eventos.herirNucleo(c, arma.dano * bono);
          else if (!puestos.golpear(js, arma.alcance + 0.8, arma.dano * bono)) golpearCapulloCerca(js, arma.alcance + 0.8);   // 2.3: los capullos se rompen a golpes (3.0: y los puestos)
        }
        return true;
      }
      case 'flecha':
      case 'piedra':
      case 'boleadora': {
        const tipoF = tipoFlecha(d);
        if (arma.tipo === 'flecha') { d[FLECHAS[tipoF].contador]--; S.arco(); }
        else if (arma.tipo === 'piedra') { ctx.gastar('piedra', 1); S.honda(); }
        else { d.boleadoras--; S.honda(); }
        // 2.5: el arco tensado tira más fuerte y más lejos
        const ten = arma.tipo === 'flecha' && opciones.tension ? opciones.tension : { dano: 1, vel: 1 };
        _v.copy(camara.position).addScaledVector(_dir, 0.6);
        _w.copy(_dir).multiplyScalar(arma.vel * ten.vel * (bono > 1 ? 1.15 : 1));
        _w.y += arma.tipo === 'boleadora' ? 2.2 : 1.2;
        const p = lanzarProyectil(arma.tipo, _v, _w, arma.dano * bono * ten.dano, true, 'jugador');
        p.enreda = arma.enreda || 0;
        p.efecto = efectoDeArma(id, progreso().cosas);   // 2.1: la forja
        if (arma.tipo === 'flecha') {
          p.flechaTipo = tipoF;
          if (FLECHAS[tipoF].perfora) p.atraviesa = PERFORA.atraviesa;
          // con el carcaj, si se terminó esta clase, queda elegida la siguiente que haya
          if (flechasDe(d) <= 0 && progreso().cosas?.carcaj) d.flechaTipo = siguienteFlecha(d);
        }
        if (arma.tipo === 'boleadora' && arma.descarga) p.descarga = arma.descarga;
        ctx.alFabricar?.({});
        return true;
      }
      // 2.5: el arsenal
      case 'perno':
        dispararVirote(arma, bono);
        if (arma.rafaga) arsenal.programarRafaga(arma.rafaga - 1, arma.entreTiros, () => !caido && D().virotes > 0 && dispararVirote(arma, bono));
        return true;
      case 'hachuela':
      case 'jabalina':
      case 'granada':
      case 'humo':
      case 'bengala':
        d[arma.municion]--;
        S.honda();
        _v.copy(camara.position).addScaledVector(_dir, 0.6);
        arsenal.lanzar(arma.tipo, arma, _v, _dir, bono);
        ctx.alFabricar?.({});
        return true;
      case 'arpon':
        recarga = arma.cadencia;
        if (arsenal.arponFuera) return true;
        S.honda();
        _v.copy(camara.position).addScaledVector(_dir, 0.6);
        arsenal.lanzar('arpon', arma, _v, _dir, bono);
        return true;
      case 'cuerno':
        recarga = 0.5;
        arsenal.soplarCuerno(js, arma);
        return true;
      case 'rayo':
        d.cargas--;
        S.pistola();
        disparoRayo(camara.position, _dir, arma.alcance * (bono > 1 ? 1.2 : 1), arma.dano * bono, false);
        ctx.alFabricar?.({});
        return true;
      case 'martillo':
        martillar(js);
        return true;
    }
    return false;
  }
  // 2.5: un virote de la ballesta (la de repetición llama a esto tres veces seguidas)
  function dispararVirote(arma, bono = 1) {
    const d = D();
    if (d.virotes <= 0) return false;
    d.virotes--;
    S.ballesta(ctx.jugador().estado.pos);
    ctx.gesto?.();
    camara.getWorldDirection(_dir);
    _v.copy(camara.position).addScaledVector(_dir, 0.6);
    _w.copy(_dir).multiplyScalar(arma.vel * (bono > 1 ? 1.15 : 1));
    _w.y += 0.5;
    const p = lanzarProyectil('virote', _v, _w, arma.dano * bono, true, 'jugador');
    p.atraviesa = arma.atraviesa || 0;
    ctx.alFabricar?.({});
    return true;
  }
  // 2.5: el arco tensado. Se tensa con el clic apretado y sale al soltarlo.
  let tensandoDesde = null;
  function tensar() {
    const d = D();
    if (caido || recarga > 0 || !tieneArma('arco')) return false;
    if (flechasDe(d) <= 0 && !(progreso().cosas?.carcaj && flechasDe(d, siguienteFlecha(d)) > 0)) return false;
    tensandoDesde = performance.now();
    return true;
  }
  function soltarTension() {
    if (tensandoDesde === null) return false;
    const seg = (performance.now() - tensandoDesde) / 1000;
    tensandoDesde = null;
    // 3.1: con el oficio de cazador el pulso es más firme: se tensa como si pasara más tiempo
    return atacar('arco', { tension: factorTension(seg * (ctx.pulso?.() || 1)) });
  }
  const cancelarTension = () => { tensandoDesde = null; };
  // 2.5: al cambiar de arma (o abrir un menú) se suelta la cuerda sin tirar y se corta la ráfaga
  // 3.5.1: también se baja el escudo: con la rueda o un número se seguía bloqueando con el arco o la pistola
  function cambioDeArma() { tensandoDesde = null; arsenal?.programarRafaga(0); if (bloqueando) bloquear(false); }
  // 2.5: con el carcaj, clic derecho con el arco cambia de clase de flecha
  function cambiarFlecha() {
    const d = D();
    if (!progreso().cosas?.carcaj || !tieneArma('arco')) return false;
    const antes = tipoFlecha(d), otra = siguienteFlecha(d);
    if (otra === antes) { ctx.nota('No tenés otras flechas', 'En el taller se hacen incendiarias y doradas (K → Munición)'); return true; }
    d.flechaTipo = otra;
    sonido.juntar?.();
    ctx.nota(`Flechas ${FLECHAS[otra].nombre}`, `Te quedan ${flechasDe(d)}`);
    return true;
  }
  // Clic derecho con algunas armas: la pistola mejorada dispara cargado.
  function atacarAlterno(id) {
    const arma = armaEfectiva(id, progreso().cosas);
    if (!arma?.cargado || caido) return false;
    if (recarga > 0) return true;
    const d = D();
    if (d.cargas < arma.cargado.cargas) { ctx.nota('No alcanza la carga', `El disparo cargado usa ${arma.cargado.cargas} cargas`); recarga = 0.5; return true; }
    d.cargas -= arma.cargado.cargas;
    recarga = 1.2;
    ctx.gesto?.();
    camara.getWorldDirection(_dir);
    S.pistola(); S.cargado();
    const bono = defensas.jugadorEnTorre(ctx.jugador().estado) ? 1.25 : 1;
    disparoRayo(camara.position, _dir, arma.alcance, arma.cargado.dano * bono, true);
    ctx.alFabricar?.({});
    return true;
  }
  // rayo instantáneo: se corta contra el terreno o una obra; el cargado atraviesa invasores
  const impactosRayo = [];
  function disparoRayo(origen, dir, alcance, dano, atraviesa) {
    let fin = alcance;
    const adentro = obraEnPunto(origen.x, origen.y, origen.z);
    // 3.8.1: de a 25 cm (de a 50 se salteaba una empalizada delgada, de 36 cm, y el rayo la cruzaba)
    for (let t = 0.8; t < alcance; t += 0.25) {
      const x = origen.x + dir.x * t, y = origen.y + dir.y * t, z = origen.z + dir.z * t;
      if (y < alturaSuelo(x, z) || obraEnPunto(x, y, z, -0.02, adentro, true)) { fin = t; break; }
    }
    impactosRayo.length = 0;
    for (const a of aliens) {
      if (a.estado === 'morir' || a.estado === 'irse') continue;
      const r = a.def.radio * a.m.esc + 0.25;
      for (const h of [0.35, 0.65, 0.9]) {
        _v.set(a.m.g.position.x, a.m.g.position.y + a.def.altura * a.m.esc * h, a.m.g.position.z).sub(origen);
        const t = _v.dot(dir);
        if (t < 0 || t > fin) continue;
        // 3.8.1: con el margen, un rayo que rozaba en diagonal una pared le pegaba al de atrás
        if (_v.lengthSq() - t * t < r * r && !margenTapado(origen.x + dir.x * t, origen.y + dir.y * t, origen.z + dir.z * t, a, adentro)) { impactosRayo.push({ a, t }); break; }
      }
    }
    for (const n of eventos.blancos()) {
      _v.copy(n.pos).sub(origen);
      const t = _v.dot(dir);
      if (t > 0 && t < fin && _v.lengthSq() - t * t < n.radio * n.radio) impactosRayo.push({ n, t });
    }
    impactosRayo.sort((p, q) => p.t - q.t);
    const golpeados = atraviesa ? impactosRayo : impactosRayo.slice(0, 1);
    if (!atraviesa && golpeados.length) fin = golpeados[0].t;
    rayo.position.copy(origen).addScaledVector(dir, 0.5);
    rayo.position.y -= 0.12;
    rayo.scale.set(atraviesa ? 3 : 1, atraviesa ? 3 : 1, Math.max(0.1, fin - 0.5));
    rayo.lookAt(_w.copy(origen).addScaledVector(dir, fin));
    rayo.material.opacity = 0.9;
    for (const g of golpeados) {
      if (g.a) {
        _w.copy(origen).addScaledVector(dir, g.t);
        herirAlien(g.a, dano, origen, 'jugador', impactoEn(g.a, _w.x, _w.y, _w.z), 'cristal');
      } else { eventos.herirNucleo(g.n, dano); marcarImpacto(false); }
    }
  }
  // Martillo: cada golpe devuelve un 10% de resistencia; cada tres golpes gasta un material.
  let pendienteMartillo = 0, avisoMartillo = 0;
  function martillar(js) {
    camara.getWorldDirection(_dir);
    let obra = null;
    for (let t = 0.5; t <= 3.2 && !obra; t += 0.25) obra = obraEnPunto(camara.position.x + _dir.x * t, camara.position.y + _dir.y * t, camara.position.z + _dir.z * t, 0.12);
    S.martillo();
    if (!obra) return;
    const { vida, max } = vidaDe(obra);
    if (vida >= max - 0.5) { if (performance.now() - avisoMartillo > 2500) { avisoMartillo = performance.now(); ctx.nota(obra.plano.nombre, 'Está entera'); } return; }
    const material = esPiedra(obra) ? 'piedra' : 'tronco';
    if (pendienteMartillo + 1 / 3 >= 1 && ctx.cuanto(material) < 1) { ctx.nota('Sin material para reparar', `Hace falta ${material === 'piedra' ? 'piedra' : 'un tronco'}`); return; }
    pendienteMartillo += 1 / 3;
    if (pendienteMartillo >= 0.999) { pendienteMartillo = 0; ctx.gastar(material, 1); ctx.alFabricar?.({}); }
    obra.datos.vida = Math.min(max, vida + max * 0.1);
    _v.set(camara.position.x + _dir.x * 1.6, camara.position.y + _dir.y * 1.6, camara.position.z + _dir.z * 1.6);
    if (material === 'piedra') efectos.polvo(_v, 5); else efectos.astillas(_v, 5);
    if (performance.now() - avisoMartillo > 1200) { avisoMartillo = performance.now(); ctx.nota(`Reparando ${obra.plano.nombre.toLowerCase()}`, `Resistencia ${Math.round(obra.datos.vida / max * 100)}%`); }
  }
  // Dónde entró el golpe, en términos del invasor: a qué altura relativa y si vino
  // por la espalda. Con eso se resuelve el punto débil del jefe.
  const _imp = { alturaRel: 0, porDetras: false };
  function impactoEn(a, x, y, z) {
    const p = a.m.g.position, alto = a.def.altura * a.m.esc;
    const rumbo = a.rumbo || 0;
    _imp.alturaRel = alto > 0 ? (y - p.y) / alto : 0;
    _imp.porDetras = Math.sin(rumbo) * (x - p.x) + Math.cos(rumbo) * (z - p.z) < 0;
    return _imp;
  }
  // 2.0: el bestiario (ver `desafio-noche2.js`). Avisa lo nuevo, lo aprendido y el
  // punto débil, una vez cada cosa. Pero en medio de una oleada se ven cuatro invasores
  // nuevos en un segundo, y cuatro avisos seguidos tapan los que importan —la campana,
  // la lluvia que apaga las antorchas—. Así que se juntan: un solo aviso del bestiario
  // cada veinte segundos, con todo lo que se anotó mientras tanto.
  const bestiarioPendiente = [];
  let esperaBestiario = 0;
  function anotarEnBestiario(tipo, que) {
    const d = D();
    if (!d.bestiario) d.bestiario = {};
    const r = anotarBestiario(d.bestiario, tipo, que, progreso().dia);
    const nombre = BESTIARIO[tipo]?.nombre;
    if (!nombre) return r;
    // (cada pedazo se traduce acá: el aviso junta varios y el diccionario los conoce de a uno)
    const t = ctx.t || ((x) => x);
    if (r.nuevo) bestiarioPendiente.push(t(`${nombre}: anotado`));
    else if (r.aprendido) bestiarioPendiente.push(t(`${nombre}: aprendiste cómo pelea`));
    else if (r.debil) bestiarioPendiente.push(t(`${nombre}: ya conocés su punto débil`));
    return r;
  }
  function avisarBestiario(dt) {
    esperaBestiario = Math.max(0, esperaBestiario - dt);
    if (!bestiarioPendiente.length || esperaBestiario > 0) return;
    esperaBestiario = 20;
    const texto = [...new Set(bestiarioPendiente)].join(' · ');
    bestiarioPendiente.length = 0;
    ctx.nota('Bestiario (J)', texto);
  }
  function herirAlien(a, dano, desde, fuente = null, impacto = null, clase = null) {
    if (a.estado === 'morir' || a.estado === 'irse') return;
    // 2.1: bajo tierra no le llega nada; al dormido el golpe lo despierta
    if (a.estado === 'bajoTierra') return;
    if (a.estado === 'dormido') { a.estado = 'avanzar'; S.chillido(a.m.g.position, a.tipo); a.m.chillar(); }
    if (fuente === true) fuente = 'jugador';
    const conDebil = danoEnPuntoDebil(a.def, dano, impacto);
    const enDebil = conDebil > dano;
    dano = conDebil;
    dano *= fortin.multiplicadorDano(a);   // 2.6: colgado del lazo recibe más
    dano = evolucion.golpe(a, dano, fuente, clase);   // 3.0: se anota con qué; si lo aprendieron, entra menos
    a.vida -= dano;
    a.sinGolpe = 0;            // 2.0: un mutado no se cura mientras le sigan pegando
    const delJugador = fuente === 'jugador' || fuente === 'lanza';
    if (a.robo && (delJugador || fuente === 'perro' || a.vida <= 0)) soltarRobo(a, true);   // 3.8.0: lo alcanzaste
    if (delJugador && dano >= 4) ctx.vibrar?.('golpe', Math.min(1, dano / 40));
    if (delJugador) marcarImpacto(a.vida <= 0);
    if (fuente === 'perro') a.mordido = 6;
    // 2.0: el destello va con el golpe. Antes era siempre 1, y el perro y los pozos, que
    // lastiman un poquito en cada cuadro, lo dejaban blanco todo el rato que duraba la
    // mordida: en las fotos de noche el invasor salía como un fantasma.
    a.flash = Math.max(a.flash, Math.min(1, dano / 6));
    if (enDebil) {
      // los sacos revientan: destello verde y un chorro más grande
      a.m.golpeDebil();
      _v.set(a.m.g.position.x, a.m.g.position.y + a.def.altura * a.m.esc * 0.72, a.m.g.position.z);
      efectos.chispas(_v, 10);
      efectos.destello(_v, 0.7, '#c8ff5e');
    }
    if (dano >= 4) {
      S.golpe(a.m.g.position, a.tipo, dano > 30);
      _v.set(a.m.g.position.x, a.m.g.position.y + a.def.altura * a.m.esc * 0.6, a.m.g.position.z);
      efectos.sangre(_v, dano > 30 ? 9 : 5);
    }
    if (desde) {
      _v.set(a.m.g.position.x - desde.x, 0, a.m.g.position.z - desde.z).normalize().multiplyScalar(0.55 * a.def.retroceso);
      a.m.g.position.x += _v.x; a.m.g.position.z += _v.z;
    }
    if (a.vida <= 0) {
      a.estado = 'morir'; a.t = 0;
      if (a.colgadoT > 0) { a.colgadoT = 0; a.m.g.position.y = T.altura(a.m.g.position.x, a.m.g.position.z); a.m.g.rotation.z = 0; }   // 2.6: cae del lazo
      S.muerte(a.m.g.position, a.tipo);
      _v.set(a.m.g.position.x, a.m.g.position.y + a.def.altura * a.m.esc * 0.5, a.m.g.position.z);
      efectos.destello(_v, a.def.jefe ? 2.8 : a.tipo === 'bruto' ? 1.5 : 1);
      const [c0, c1] = a.def.cristales;
      const sueltos = c0 + Math.floor(Math.random() * (c1 - c0 + 1));
      // 3.5.1: las crías de adentro de la nave no sueltan: con el reloj quieto adentro y la
      // Madre llamando crías sin fin, era una mina de cristal infinita
      if (!a.enNave) soltarCristales(a.m.g.position, sueltos);
      const d = D();
      if (a.def.jefe) {
        // cae el jefe: un instante de cámara lenta y una lluvia de cristales
        camaraLenta = Math.max(camaraLenta, 1.6);
        musica.golpeFinal();
        efectos.sangre(_v, 14); efectos.chispas(_v, 16);
        ctx.nota('Cayó el mandamás', `Dejó ${sueltos} semillas doradas desparramadas`, true);
      }
      d.abatidos++;
      nocheActual.abatidos++;
      ctx.alAbatir?.(a);   // 3.1: el oficio de cazador
      // 2.0: el bestiario aprende peleando
      anotarEnBestiario(a.tipo, 'abatido');
      if (a.mutado) anotarEnBestiario('mutado', 'abatido');
      if (a.resiste) anotarEnBestiario('adaptado', 'abatido');   // 3.0
      if (fuente === 'lanza') nocheActual.abatidosLanza++; else nocheActual.abatidosOtros++;
      if (fuente === 'perro' || a.mordido > 0) d.abatidosPerro++;
      d.vivos = Math.max(0, vivos());
      if (d.vivos === 0 && !d.oleadaTerminada && !estadoNave.porBajar.length && !eventos.nodrizaActiva) {
        // el último de la noche: un instante de cámara lenta y un golpe de música
        camaraLenta = 1.4;
        musica.golpeFinal();
        ctx.nota('La noche quedó en silencio', 'No queda ningún duende. Ya podés descansar', true);
        estadoNave.fase = 'yendo'; estadoNave.t = 0;
      }
    }
  }
  function usarEmplasto() {
    const d = D();
    if (d.emplastos <= 0) { ctx.nota('No tenés emplastos', 'Se hacen con fruta y una ramita (K)'); return; }
    if (!curar(45)) { ctx.nota('Estás entero', 'Guardalo para cuando haga falta'); return; }
    d.emplastos--;
    ctx.nota('Te pusiste un emplasto', `Salud ${Math.round(d.salud)}/${SALUD_MAX}`);
  }

  // ---------------- fabricar (tecla K): por categorías, Tab cambia
  let tallerAbierto = false, catTaller = 0;
  const tallerEl = document.getElementById('taller');
  const recetasVisibles = () => RECETAS.filter((r) => r.cat === CATEGORIAS_TALLER[catTaller].clave);
  function obraAReforzar() {
    const js = ctx.jugador().estado;
    let mejor = null, d0 = 6;
    for (const o of obras.obrasCerca(js.pos, 8, [])) {
      if (!completa(o) || !REFUERZOS[o.plano.id]) continue;
      const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  // 1.11: la madera sin cimiento más cercana, para echárselo
  function obraACimentar() {
    const js = ctx.jugador().estado;
    let mejor = null, d0 = 6;
    for (const o of obras.obrasCerca(js.pos, 8, [])) {
      if (!completa(o) || !admiteCimiento(o.plano, o.datos)) continue;
      const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  const NOMBRE_REQUIERE = { pistola: 'hace falta la pistola', arco: 'hace falta el arco', lanza: 'hace falta la lanza',
    ballesta: 'hace falta la ballesta', boleadoras: 'hacen falta las boleadoras', chaleco: 'hace falta el chaleco' };
  function recetaDisponible(r) {
    if (r.requiere && !progreso().cosas?.[r.requiere]) return { ok: false, motivo: NOMBRE_REQUIERE[r.requiere] || 'falta algo antes' };
    if (r.unica && progreso().cosas?.[r.da.cosa]) return { ok: false, motivo: 'ya lo tenés', hecho: true };
    if (r.banco && !ctx.cercaDeBanco()) return { ok: false, motivo: 'junto a un banco de trabajo' };
    if (r.reparar) {
      const o = obraAReparar();
      if (!o) return { ok: false, motivo: 'no hay nada dañado cerca' };
      const { vida, max } = vidaDe(o);
      const c = costoReparacion(o.plano, vida, max);
      if (ctx.cuanto(c.material) < c.cantidad) return { ok: false, motivo: `faltan ${c.cantidad} ${c.material === 'piedra' ? 'piedras' : 'troncos'}`, costo: c };
      return { ok: true, obra: o, costo: c };
    }
    if (r.reforzar) {
      const o = obraAReforzar();
      if (!o) return { ok: false, motivo: 'acercate a una empalizada o pirca' };
      const ref = REFUERZOS[o.plano.id];
      for (const [k, n] of Object.entries(ref.pide)) if (ctx.cuanto(k) < n) return { ok: false, motivo: 'falta juntar', refuerzo: ref, obra: o };
      return { ok: true, obra: o, refuerzo: ref };
    }
    if (r.cimentar) {
      const o = obraACimentar();
      if (!o) return { ok: false, motivo: 'acercate a una empalizada o portón de madera sin cimiento' };
      for (const [k, n] of Object.entries(CIMIENTO.pide)) if (ctx.cuanto(k) < n) return { ok: false, motivo: 'falta juntar', obra: o };
      return { ok: true, obra: o };
    }
    for (const [k, n] of Object.entries(r.pide)) if (ctx.cuanto(k) < n) return { ok: false, motivo: 'falta juntar' };
    return { ok: true };
  }
  function obraAReparar() {
    const js = ctx.jugador().estado;
    let mejor = null, peor = 1;
    for (const o of obras.obrasCerca(js.pos, 8, [])) {
      if (!completa(o) || !Number.isFinite(o.datos.vida)) continue;
      const { vida, max } = vidaDe(o);
      const f = vida / max;
      if (f < peor - 1e-3 && Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) < 6) { peor = f; mejor = o; }
    }
    return mejor;
  }
  const NOMBRE = { tronco: 'troncos', tabla: 'tablas', piedra: 'piedras', cristal: 'semillas doradas', ramita: 'ramitas', fruta: 'frutas del bosque' };
  const textoPide = (pide) => Object.entries(pide).map(([k, n]) => `${n} ${NOMBRE[k] || k} (tenés ${ctx.cuanto(k)})`).join(' · ');
  function dibujarTaller() {
    if (!tallerEl) return;
    const cats = document.getElementById('taller-categorias');
    if (cats) {
      cats.innerHTML = '';
      CATEGORIAS_TALLER.forEach((c, i) => {
        const b = document.createElement('button');
        b.textContent = c.nombre; b.className = i === catTaller ? 'elegido' : '';
        b.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); catTaller = i; dibujarTaller(); });
        cats.appendChild(b);
      });
    }
    const ul = document.getElementById('taller-lista');
    ul.innerHTML = '';
    recetasVisibles().forEach((r, i) => {
      const e = recetaDisponible(r);
      const li = document.createElement('li');
      li.className = e.hecho ? 'hecho' : e.ok ? '' : 'falta';
      const b = document.createElement('b'); b.textContent = `${i + 1}. ${r.nombre}`;
      const s = document.createElement('span');
      if (r.reparar) s.textContent = e.costo ? `— ${e.costo.cantidad} ${NOMBRE[e.costo.material]}` : `— ${r.texto}`;
      else if (r.cimentar) s.textContent = e.obra ? `— ${e.obra.plano.nombre.toLowerCase()} · ${textoPide(CIMIENTO.pide)}` : `— ${r.texto}`;
      else if (r.reforzar) s.textContent = e.refuerzo ? `— ${e.obra.plano.nombre.toLowerCase()} → ${e.refuerzo.a.replace('-', ' ')} · ${textoPide(e.refuerzo.pide)}` : `— ${r.texto}`;
      else s.textContent = `— ${textoPide(r.pide)}`;
      s.title = r.texto;
      const m = document.createElement('i'); m.textContent = e.ok ? 'se puede' : e.motivo;
      li.append(b, s, m);
      li.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); fabricar(i); });
      ul.appendChild(li);
    });
    const d = D();
    // 2.5: la munición del arsenal, sólo la que tengas
    const extra = [['virotes', 'virotes'], ['flechasFuego', 'incendiarias'], ['flechasCristal', 'doradas'], ['hachuelas', 'hachas'], ['jabalinas', 'jabalinas'], ['granadas', 'granadas'], ['humos', 'humos'], ['bengalas', 'bengalas']]
      .filter(([k]) => d[k] > 0).map(([k, n]) => ` · ${n} ${d[k]}`).join('');
    document.getElementById('taller-intro').textContent = `Flechas ${d.flechas} · boleadoras ${d.boleadoras} · cargas ${d.cargas} · emplastos ${d.emplastos}${extra} · semillas doradas ${ctx.cuanto('cristal')} · piedras ${ctx.cuanto('piedra')}`;
  }
  function abrirTaller(abrir) {
    tallerAbierto = abrir;
    if (abrir) cambioDeArma();   // 2.5: la tensión y la ráfaga no siguen con el taller abierto
    tallerEl?.classList.toggle('oculto', !abrir);
    if (abrir) dibujarTaller();
  }
  function cambiarCategoriaTaller(dir = 1) {
    catTaller = (catTaller + dir + CATEGORIAS_TALLER.length) % CATEGORIAS_TALLER.length;
    dibujarTaller();
  }
  function fabricar(i) {
    const r = recetasVisibles()[i];
    if (!r) return;
    const e = recetaDisponible(r);
    if (!e.ok) { ctx.nota(r.nombre, e.motivo.charAt(0).toUpperCase() + e.motivo.slice(1)); return; }
    const d = D();
    if (r.reparar) {
      ctx.gastar(e.costo.material, e.costo.cantidad);
      const { max } = vidaDe(e.obra);
      e.obra.datos.vida = Math.min(max, e.obra.datos.vida + max * 0.3 * e.costo.cantidad);
      ctx.nota(`${e.obra.plano.nombre} reparada`, `Resistencia ${Math.round(e.obra.datos.vida / max * 100)}%`);
    } else if (r.reforzar) {
      for (const [k, n] of Object.entries(e.refuerzo.pide)) ctx.gastar(k, n);
      const antes = e.obra.plano.nombre;
      obras.reemplazarPlano(e.obra, e.refuerzo.a);
      efectos.polvo({ x: e.obra.datos.x, y: e.obra.datos.y + 1, z: e.obra.datos.z }, 12);
      ctx.alGuardarObras?.();
      ctx.nota(`${antes} → ${e.obra.plano.nombre}`, `Resistencia ${vidaMaxObra(e.obra.plano)}`, true);
    } else if (r.cimentar) {
      for (const [k, n] of Object.entries(CIMIENTO.pide)) ctx.gastar(k, n);
      e.obra.datos.cimiento = true;
      cimientos.sincronizar(obras.obras);
      efectos.polvo({ x: e.obra.datos.x, y: e.obra.datos.y + 0.3, z: e.obra.datos.z }, 10);
      ctx.alGuardarObras?.();
      ctx.nota(`${e.obra.plano.nombre}: con cimiento`, 'El excavador ya no se mete por debajo de esta', true);
    } else {
      for (const [k, n] of Object.entries(r.pide)) ctx.gastar(k, n);
      if (r.da.cosa) darCosa(r.da.cosa);
      for (const k of ['flechas', 'cargas', 'emplastos', 'boleadoras', ...MUNICIONES]) if (r.da[k]) d[k] = Math.min(MUNICIONES.includes(k) ? TOPE_MUNICION : 999, (d[k] || 0) + r.da[k]);
      ctx.nota(r.nombre, r.texto, true);
    }
    if (!d.recetasHechas.includes(r.id)) d.recetasHechas.push(r.id);
    sonido.juntar();
    ctx.alFabricar?.(r);
    ctx.guardar();
    dibujarTaller();
  }

  // ---------------- HUD
  const hud = document.getElementById('desafio-hud');
  const barra = document.getElementById('salud-barra');
  const textoSalud = document.getElementById('salud-texto');
  const textoEstado = document.getElementById('desafio-estado');
  let acumuladoHud = 9, ultimoHud = '', pctBarra = -1;
  function actualizarHud(dt) {
    const d = D();
    const pct = Math.round(Math.max(0, d.salud / SALUD_MAX * 100));
    if (pct !== pctBarra) { pctBarra = pct; barra.style.width = `${pct}%`; hud.classList.toggle('critica', d.salud < 30); }
    acumuladoHud += dt;
    if (acumuladoHud < 0.25) return;
    acumuladoHud = 0;
    const p = progreso();
    const n = vivos();
    let texto;
    const esp = d.especial ? ` · ${ESPECIALES[d.especial].nombre}` : '';
    if (!siguenLasNoches(d)) {
      // Con el nido abajo no hay noche que contar: va primero que todo lo demás.
      texto = `Día ${p.dia} · la cueva se derrumbó · no sale nadie más`;
    } else if (esHoraDeAtaque(p.horas) && !d.oleadaTerminada && d.oleadaNoche === claveNoche(p.dia, p.horas)) {
      const conJefe = jefeVivo() ? ' · ¡el mandamás!' : '';
      texto = eventos.nodrizaActiva ? `Noche ${d.oleadas} · ¡El Coihue Viejo! · ${n} ${n === 1 ? 'duende' : 'duendes'}${conJefe}`
        : n ? `Noche ${d.oleadas}${esp} · ¡Salieron! ${n} ${n === 1 ? 'duende' : 'duendes'}${conJefe}` : `Noche ${d.oleadas}${esp} · resistiendo`;
    } else if (esHoraDeAtaque(p.horas)) {
      texto = `Noche ${d.oleadas} · calma · amanece en ${relojCorto(segundosHasta(p.horas, HORA_AMANECER, ctx.duracion()))}`;
    } else {
      texto = `Día ${p.dia} · los duendes salen en ${relojCorto(segundosHasta(p.horas, HORA_ATAQUE, ctx.duracion()))}`;
    }
    // Con el segundo acto abierto, el día deja de ser sólo la pausa entre noches.
    // 3.0: el asedio (y adentro de la nave, sólo eso)
    const txtAsedio = naveMundo.adentro ? naveMundo.textoHud() : asedioMundo.textoHud();
    if (txtAsedio) texto = naveMundo.adentro ? txtAsedio : `${texto} · ${txtAsedio}`;
    if (d.vuelta) texto = `${textoVuelta(d.vuelta)} · ${texto}`;
    const nido = d.victoria ? resumenNido(d.nido, p.horas) : null;
    if (nido && !nido.caido) texto += ` · ${nido.texto}`;
    texto += ` · ${d.noches} ${d.noches === 1 ? 'noche resistida' : 'noches resistidas'}`;
    const salud = `${Math.ceil(d.salud)}`;
    if (texto + salud === ultimoHud) return;
    ultimoHud = texto + salud;
    textoEstado.textContent = texto;
    textoSalud.textContent = salud;
    if (tallerAbierto) dibujarTaller();
  }

  // ---------------- actualización por cuadro
  // El saltador no rompe lo que puede saltar: toma carrera y pasa por arriba.
  // Devuelve false si esa obra es demasiado alta o si del otro lado hay agua.
  function intentarSaltar(a, o) {
    if (!a.def.salta || a.saltoCd > 0 || !o || !puedeSaltar(o.plano)) return false;
    if (fortin.impideSalto(o)) return false;   // 2.6: la pirca helada no se trepa
    const p = a.m.g.position;
    const dx = Math.sin(a.rumbo), dz = Math.cos(a.rumbo);
    const largo = (o.plano.fondo || 1) + a.def.radio * 2 + 1.4;
    const x1 = p.x + dx * largo, z1 = p.z + dz * largo;
    if (T.agua(x1, z1) || Math.abs(x1) > LIMITE || Math.abs(z1) > LIMITE) return false;
    const y1 = T.altura(x1, z1);
    if (y1 - p.y > 1.6) return false;                       // no salta un barranco para arriba
    a.salto = { x0: p.x, z0: p.z, y0: p.y, x1, z1, y1, alto: (o.plano.alto || 1) * 0.75 + 0.7, dur: 0.62 + largo * 0.05 };
    a.estado = 'saltar'; a.saltoT = 0; a.obra = null; a.atasco = 0;
    S.salto(p, a.tipo);
    return true;
  }
  // 2.0: un árbol o una roca cerca para esconderse (círculos del mundo, no obras)
  function arbolCerca(p, jp) {
    let mejor = null, d0 = 11;
    for (const o of col.cercanos(p.x, p.z)) {
      if (o.seg || o.duenio || o.dinamico || o.despejado || !(o.r > 0.15 && o.r < 1.4)) continue;   // (3.6.2: ni detrás de un árbol que ya no está)
      const d = Math.hypot(o.x - p.x, o.z - p.z);
      if (d < d0 && Math.hypot(o.x - jp.x, o.z - jp.z) > 6) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  const dirCamara = new THREE.Vector3(0, 0, -1);
  const luzJugador = { encendida: false, angulo: 0.42, alcance: 42 };
  let adentroJugador = false, tAdentro = 0, avisoAsedio = -1, tApagon = 8, avisoApagon = -1;
  // 2.1: el jefe artillero tira una piedra con arco a la defensa que tengas entre él y
  // vos; si no hay ninguna, a vos
  function tirarRoca(a, js) {
    const p = a.m.g.position;
    _v.set(p.x, p.y + a.def.altura * a.m.esc * 0.85, p.z);
    _w.set(js.pos.x, js.pos.y + 1, js.pos.z);
    const o = hayObraEntre(_v, _w, 0.8);
    const blanco = o ? { x: o.datos.x, y: (o.datos.y ?? T.altura(o.datos.x, o.datos.z)) + 1, z: o.datos.z } : { x: js.pos.x, y: js.pos.y + 0.5, z: js.pos.z };
    const v = tiroParabolico(_v, blanco, ARTILLERO.vel);
    const q = lanzarProyectil('roca', _v, _dir.set(v.x, v.y, v.z), ARTILLERO.danoJugador * a.danoMult, false);
    q.danoObra = ARTILLERO.danoObra * a.danoMult; q.salpicadura = ARTILLERO.radio;
    S.tiroRoca(p);
    a.golpeT = 0.35;
  }
  function golpeRoca(q) {
    efectos.polvo(q.pos, 12);
    S.roca(q.pos);
    for (const o of obras.obrasCerca(q.pos, q.salpicadura || 2, [])) if (completa(o)) danarObra(o, q.danoObra * 0.5);
    const js = ctx.jugador().estado;
    if (Math.hypot(js.pos.x - q.pos.x, js.pos.z - q.pos.z) < (q.salpicadura || 2) && Math.abs(js.pos.y - q.pos.y) < 2.4) herirJugador(q.dano * 0.6, q.pos);
  }
  // 2.1: la noche de rescate: el lugar del vecino recibe golpes, y si cae, cae. Cada
  // golpe es ruido y astillas; el daño va por tiempo (ver `danoAlLugar`), sumando a
  // los que están pegándole en este cuadro.
  let atacandoLugar = 0, multLugar = 1;
  function golpearLugar(L) {
    _v.set(L.x, T.altura(L.x, L.z) + 1.4, L.z);
    S.madera(_v);
    if (Math.random() < 0.35) efectos.astillas(_v, 6);
  }
  function desgastarLugar(dt) {
    const resc = D().rescate, n = atacandoLugar;
    atacandoLugar = 0;
    // 2.3: la trochita varada se gasta igual que el lugar de un vecino
    const v = D().varada;
    if (n && v && !v.llego && !v.roto && !resc) {
      v.vida = Math.max(0, v.vida - danoAlLugar(n, dt, multLugar));
      if (v.vida <= 0) romperVarada();
      return;
    }
    if (n && !resc && asedioMundo.desgastar(n, dt, multLugar)) return;   // 3.0: la baliza del contraataque
    if (!resc || resc.caido || !n) return;
    resc.vida = Math.max(0, resc.vida - danoAlLugar(n, dt, multLugar));
    if (resc.vida <= 0) {
      const L = T.lugares[resc.lugar];
      _v.set(L.x, T.altura(L.x, L.z) + 1.4, L.z);
      resc.caido = true;
      const R = RESCATES[resc.lugar], d = D();
      d.rescates.enojados[R.vecino] = progreso().dia + DIAS_ENOJADO;
      efectos.polvo(_v, 20);
      ctx.nota(`Destrozaron ${R.lugar}`, `${R.nombre} no va a querer hablarte por unos días`, true);
    }
  }
  // 2.1: la forja. El efecto se aplica después del daño, sobre el que recibió el golpe.
  function aplicarForja(efecto, a, desde, dano = 42) {
    if (!efecto || !a || a.estado === 'morir') return;
    const k = eficacia(efecto, a.tipo);
    const p = a.m.g.position;
    if (efecto === 'hielo') {
      a.congeladoT = Math.max(a.congeladoT || 0, HIELO.freno * k);
      _v.set(p.x, p.y + 1, p.z);
      efectos.destello?.(_v, 0.6, '#bfe8ff');
      S.hielo(p);
    } else if (efecto === 'empuje') {
      if (desde) {
        _v.set(p.x - desde.x, 0, p.z - desde.z).normalize().multiplyScalar(EMPUJE.retroceso * Math.min(1.2, k));
        p.x += _v.x; p.z += _v.z;
      }
      if (!a.def.pesado) a.enredadoT = Math.max(a.enredadoT || 0, EMPUJE.derribo * k);
    } else if (efecto === 'rayo') {
      const otros = aliens.filter((b) => b !== a && b.estado !== 'morir' && b.estado !== 'irse' && b.estado !== 'bajoTierra').map((b) => ({ x: b.m.g.position.x, z: b.m.g.position.z, b }));
      const cadena = cadenaDeRayo({ x: p.x, z: p.z }, otros);
      let antes = p;
      for (const c of cadena) {
        const q = c.b.m.g.position;
        // el haz de un invasor al otro
        rayo.position.set(antes.x, antes.y + 1.2, antes.z);
        rayo.lookAt(q.x, q.y + 1.2, q.z);
        rayo.scale.set(1, 1, Math.hypot(q.x - antes.x, q.z - antes.z));
        rayo.material.opacity = 0.9;
        herirAlien(c.b, RAYO.dano * dano, null, 'jugador', null, 'cristal');
        antes = q;
      }
      if (cadena.length) S.rayoCadena(p);
    }
  }
  // 2.1: ¿hay una losa de piedra acá? (el excavador no puede salir a través de ella)
  function hayLosa(x, z) {
    for (const o of obras.obras) {
      if (o.plano.id !== 'losa-piedra' || !completa(o)) continue;
      if (Math.hypot(o.datos.x - x, o.datos.z - z) < 1.75) return true;
    }
    return false;
  }
  let avisoExcavador = -1, avisoLosa = -1;
  // ---------------- 2.3: el volador
  // Las alas son dos membranas aparte que cuelgan del grupo del invasor: el esqueleto
  // tiene huesos fijos y agregar uno obligaría a tocar el shader.
  let geoAla = null, matAla = null;
  function ponerAlas(a) {
    if (a.m.alas) return a.m.alas;
    if (a.m.alasPropias) return (a.m.alas = []);   // 3.8.0: la lechuza aletea con sus alas (huesos)
    if (!geoAla) {
      // la membrana: un abanico de triángulos desde el hombro (el Three local no trae
      // ShapeGeometry, así que se arma a mano)
      const borde = [[0.95, 0.28], [1.25, -0.05], [0.8, -0.32], [0.35, -0.38], [0, -0.12]];
      const pos = [];
      for (let i = 0; i < borde.length - 1; i++) pos.push(0, 0, 0, ...borde[i], 0, ...borde[i + 1], 0);
      geoAla = new THREE.BufferGeometry();
      geoAla.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      geoAla.computeVertexNormals();
      matAla = new THREE.MeshLambertMaterial({ color: '#2a2233', side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
    }
    const alas = [];
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(geoAla, matAla);
      m.scale.set(s, 1, 1);
      m.rotation.x = -Math.PI / 2;
      m.position.set(s * 0.12, 0.85, -0.05);
      a.m.g.add(m);
      alas.push({ m, s });
    }
    return (a.m.alas = alas);
  }
  function aletear(a, dt, rapido) {
    a.faseAla = (a.faseAla || 0) + dt * (rapido ? 16 : 9);
    a.m.aletear?.(a.faseAla);
    for (const { m, s } of a.m.alas || []) m.rotation.z = s * (0.25 + Math.sin(a.faseAla) * 0.55);
  }
  function llamaDe(o) {
    return { x: o.datos.x, z: o.datos.z, y: (o.datos.y ?? T.altura(o.datos.x, o.datos.z)) + (o.plano.defensa?.llamaY || 2.1), o };
  }
  const _bVolador = new THREE.Vector3();
  function actualizarVolador(a, dt, js, noche) {
    const g = a.m.g, p = g.position, def = a.def;
    // 2.5: el volador también arde (el arpón y el humo no lo alcanzan en el aire)
    if (a.fuegoT > 0) { arsenal.arder(a, dt); if (a.estado === 'morir') return; }
    ponerAlas(a);
    a.cd -= dt;
    a.subiendo = Math.max(0, (a.subiendo || 0) - dt);
    a.frenoT = Math.max(0, (a.frenoT || 0) - dt);
    if (a.congeladoT > 0) a.congeladoT -= dt;
    // a quién va: la antorcha prendida más cercana, o vos
    a.tBlanco = (a.tBlanco || 0) - dt;
    if (a.tBlanco <= 0 || !a.blanco || (a.blanco.tipo === 'antorcha' && a.blanco.o.datos.apagada)) {
      a.tBlanco = 0.6;
      // 2.6: la antorcha bajo el tejado de lajas no la alcanzan
      a.blanco = blancoVolador(p, defensas.antorchas.filter((o) => !o.datos.apagada && !fortin.antorchaProtegida(o)).map(llamaDe), js.pos);
    }
    // a vos te busca a la altura de la cabeza (`js.pos.y` son los pies)
    // 2.6.1: el punto del jugador va en un vector fijo (esto corre por volador y por cuadro)
    const b = a.blanco.tipo === 'jugador' ? _bVolador.set(js.pos.x, js.pos.y + 1.2, js.pos.z) : a.blanco;
    const dx = b.x - p.x, dz = b.z - p.z, d = Math.hypot(dx, dz) || 0.001;
    const vel = def.vel * (noche ? 1 : 0.8) * (a.velMult || 1) * (a.congeladoT > 0 ? HIELO.lento : 1) * (a.frenoT > 0 ? 0.5 : 1);
    // gira suave hacia el blanco; después de pegar sigue de largo mientras sube
    let dr = Math.atan2(dx, dz) - a.rumbo;
    dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    if (a.subiendo <= 0) a.rumbo += Math.max(-dt * 3.2, Math.min(dt * 3.2, dr));
    const paso = a.subiendo > 0 ? vel * dt : Math.min(d, vel * dt);
    p.x += Math.sin(a.rumbo) * paso; p.z += Math.cos(a.rumbo) * paso;
    p.x = Math.max(-LIMITE + 5, Math.min(LIMITE - 5, p.x)); p.z = Math.max(-LIMITE + 5, Math.min(LIMITE - 5, p.z));
    // la altura: alto de lejos, en picada sobre el blanco, y sube después de pegar
    const suelo = T.altura(p.x, p.z);
    // lejos, a VUELO.alto sobre el suelo; al acercarse baja en curva hasta la llama (o tu
    // cabeza). Es la misma curva de `alturaDeseada`, pero medida desde el blanco.
    const k = (alturaDeseada(d, 0) - VUELO.bajo) / (VUELO.alto - VUELO.bajo);
    const yObj = a.subiendo > 0 ? suelo + VUELO.alto : Math.max(suelo + 0.9, b.y + (suelo + VUELO.alto - b.y) * k);
    const antes = p.y - suelo;
    p.y += Math.max(-dt * 7, Math.min(dt * 6, yObj - p.y));
    if (antes > VUELO.alto - 1 && p.y - suelo < VUELO.alto - 1.5 && a.subiendo <= 0) S.picada(p);
    g.rotation.y = a.rumbo;
    g.rotation.x = Math.max(-0.5, Math.min(0.5, (yObj - p.y) * -0.1));
    a.px = p.x; a.pz = p.z;
    aletear(a, dt, a.subiendo > 0 || d < VUELO.picada);
    a.tAleteo = (a.tAleteo || 0) - dt;
    if (a.tAleteo <= 0) { a.tAleteo = 1.1 + Math.random() * 0.6; if (U_distancia(p, js.pos) < 45) S.aleteo(p); }
    // pega: a la llama la apaga; a vos te lastima al pasar
    if (a.subiendo <= 0 && d < 1.3 && Math.abs(p.y - b.y) < 1.4) {
      if (a.blanco.tipo === 'antorcha') {
        defensas.apagar(a.blanco.o, 'volador');
        _v.set(b.x, b.y, b.z); S.apagar(_v); efectos.polvo(_v, 6, '#5a5a5a');
        a.blanco = null; a.subiendo = VUELO.subir;
      } else if (a.cd <= 0 && !caido && fortin.bajoTejado(js.pos)) {
        // 2.6: abajo del tejado de lajas no te alcanza: pega contra la piedra y sube
        a.cd = def.cadencia; a.subiendo = VUELO.subir;
        _v.set(p.x, p.y, p.z); efectos.polvo(_v, 5);
      } else if (a.cd <= 0 && !caido) {
        a.cd = def.cadencia; a.subiendo = VUELO.subir;
        herirJugador(def.dano * a.danoMult, p);
        S.embestida(p, a.tipo);
      }
    }
    poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
    poseAlien.apuntando = false; poseAlien.enredado = false; poseAlien.agazapado = false; poseAlien.saltando = 0.5; poseAlien.noche = nocheNivel;
    a.m.animar(poseAlien);
    poseAlien.saltando = 0;
  }

  function actualizarAlien(a, dt, js, noche) {
    if (a.enNave) return naveMundo.actualizarAlien(a, dt, js);   // 3.0: las crías de adentro de la nave
    const g = a.m.g, p = g.position, def = a.def;
    poseAlien.reflejo = 0;
    // 2.1: dormido en la ruina de los restos: agazapado, hasta que pasás cerca
    if (a.estado === 'dormido') {
      _despierta.distancia = U_distancia(p, js.pos); _despierta.agachado = js.agachado; _despierta.corriendo = js.corriendo;
      if (despierta(_despierta)) {
        a.estado = 'avanzar'; S.chillido(p, a.tipo); a.m.chillar();
      }
      p.y = T.altura(p.x, p.z);
      poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
      poseAlien.apuntando = false; poseAlien.enredado = false; poseAlien.agazapado = true; poseAlien.saltando = 0; poseAlien.noche = nocheNivel * 0.3;
      a.m.animar(poseAlien);
      return;
    }
    // 2.1: el excavador bajo tierra: no se ve, se oye y se ve la tierra que se mueve
    if (a.estado === 'bajoTierra') {
      const dx = js.pos.x - p.x, dz = js.pos.z - p.z, d = Math.hypot(dx, dz) || 1;
      a.rumbo = Math.atan2(dx, dz);
      const paso = Math.min(d, VEL_BAJO_TIERRA * (def.vel / 3.1) * dt);
      p.x += (dx / d) * paso; p.z += (dz / d) * paso;
      p.y = T.altura(p.x, p.z) - 2.5;
      a.px = p.x; a.pz = p.z;
      a.tTierra -= dt;
      if (a.tTierra <= 0) {
        a.tTierra = 0.55;
        _v.set(p.x, T.altura(p.x, p.z) + 0.1, p.z);
        efectos.polvo(_v, 5, '#6b5a44');
        if (Math.random() < 0.45) S.excavar(_v);
      }
      if (d <= SALE_A + 0.4) {
        const s = puntoDeSalida(p, js.pos, hayLosa);
        if (s) p.set(s.x, T.altura(s.x, s.z), s.z);
        else p.y = T.altura(p.x, p.z);
        // al asomar queda aturdido un momento: es la ventana para pegarle
        a.estado = 'avanzar'; a.bajoTierra = false; g.visible = true; a.cd = 0.4; a.enredadoT = 0.9;
        _v.set(p.x, p.y + 0.3, p.z);
        efectos.polvo(_v, 16, '#6b5a44');
        S.emerger(p);
        a.m.chillar();
        if (s?.bloqueado && avisoLosa !== D().oleadas) {
          avisoLosa = D().oleadas;
          ctx.nota('El excavador chocó con la losa', 'No pudo atravesar la piedra: salió más atrás');
        }
      }
      return;
    }
    a.flash = Math.max(0, a.flash - dt * 6);
    a.m.flash(a.flash);
    a.fase += dt;
    // 1.8: de lejos se dibuja la malla de menos gajos. Se revisa de a ratos, no en
    // cada cuadro, porque cambiar de geometría no es gratis.
    a.tLod = (a.tLod || 0) - dt;
    if (a.tLod <= 0) {
      a.tLod = 0.5 + Math.random() * 0.4;
      a.m.detalle?.(Math.hypot(p.x - js.pos.x, p.z - js.pos.z));
    }
    if (a.estado === 'bajar') {
      a.t += dt;
      const suelo = T.altura(p.x, p.z);
      p.y = Math.max(suelo, p.y - dt * 8);
      g.rotation.y += dt * 2;
      poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
      poseAlien.apuntando = false; poseAlien.enredado = true; poseAlien.agazapado = false; poseAlien.noche = nocheNivel;
      a.m.animar(poseAlien);
      if (p.y <= suelo + 0.01) { a.estado = 'avanzar'; S.chillido(p, a.tipo); a.m.chillar(); }
      return;
    }
    if (a.estado === 'morir') {
      a.t += dt;
      // 3.5.1: el volador o el saltador que mueren en el aire caen (antes se disolvían flotando)
      { const s = T.altura(p.x, p.z); if (p.y > s + 0.05) p.y = Math.max(s, p.y - dt * 9); }
      a.m.caer(a.t);
      if (a.t > 0.9) a.m.disolver(Math.min(1, (a.t - 0.9) / 1.4));
      if (a.t > 2.4) return 'fuera';
      return;
    }
    if (a.estado === 'irse') {
      a.t += dt;
      p.y += dt * (3 + a.t * 4);
      g.rotation.y += dt * 4;
      g.scale.setScalar(Math.max(0.05, 1 - a.t * 0.35));
      a.m.disolver(Math.min(1, a.t / 2.6));
      if (a.t > 2.6) return 'fuera';
      return;
    }
    // el saltador en el aire: arco balístico por encima de la defensa, sin colisionar
    if (a.estado === 'saltar') {
      const s = a.salto;
      a.saltoT += dt;
      const k = Math.min(1, a.saltoT / s.dur);
      p.x = s.x0 + (s.x1 - s.x0) * k;
      p.z = s.z0 + (s.z1 - s.z0) * k;
      p.y = s.y0 + (s.y1 - s.y0) * k + Math.sin(k * Math.PI) * s.alto;
      g.rotation.y = a.rumbo;
      poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
      poseAlien.apuntando = false; poseAlien.enredado = false; poseAlien.agazapado = false; poseAlien.saltando = k; poseAlien.noche = nocheNivel;
      a.m.animar(poseAlien);
      poseAlien.saltando = 0;
      a.px = p.x; a.pz = p.z;
      if (k >= 1) { a.estado = 'avanzar'; a.saltoCd = 1.6; a.atasco = 0; p.y = T.altura(p.x, p.z); }
      return;
    }
    // 2.3: el volador va por el aire, sin chocar con nada (ver `desafio-cielo.js`)
    if (def.vuela && a.estado === 'avanzar') return actualizarVolador(a, dt, js, noche);
    a.saltoCd = Math.max(0, a.saltoCd - dt);
    a.cd -= dt;
    a.chillido -= dt;
    // Lo que se le escucha mientras avanza. De lejos no chilla: acecha, que es el
    // ruido bajo y largo que no se sabe de dónde viene. Recién cerca abre la boca.
    if (a.chillido < 0) {
      a.chillido = 4 + Math.random() * 7;
      const dv = U_distancia(p, js.pos);
      if (dv < 70 && performance.now() - ultimoChillido > 900) {
        ultimoChillido = performance.now();
        if (dv > 34) S.acecho(p, a.tipo);
        else { S.chillido(p, a.tipo); a.m.chillar(); }
      }
    }
    const dx = js.pos.x - p.x, dz = js.pos.z - p.z;
    const dist = Math.hypot(dx, dz);
    const alcanceCuerpo = (def.cuerpo || def.alcance) + def.radio * (a.m.esc - 1) + 0.35;
    const clima = climaActual;
    let velObj = def.vel * (noche ? 1 : 0.8) * clima.velocidad * (D().especial === 'eclipse' ? ESPECIALES.eclipse.velocidad : 1);
    let rumboObj = Math.atan2(dx, dz);
    let ataca = false;
    a.mordido = Math.max(0, (a.mordido || 0) - dt);
    // 2.0: el mutado se cierra las heridas si lo dejás respirar, y es más rápido
    a.sinGolpe = (a.sinGolpe || 0) + dt;
    if (a.mutado) a.vida += regeneracion(a, dt);
    velObj *= a.velMult || 1;
    // 2.1: congelado por la lanza de hielo: se mueve a un tercio
    if (a.congeladoT > 0) { a.congeladoT -= dt; velObj *= HIELO.lento; }
    // 2.5: ardiendo, arrastrado por el arpón, dudando por el cuerno o perdido en el humo
    const ea = arsenal.estadoAlien(a, dt, js);
    if (a.estado === 'morir') return;
    const quietoArsenal = ea.quieto, velArsenal = ea.vel, rumboArsenal = ea.rumbo, sinAtaqueArsenal = ea.sinAtaque;
    // 2.6: lazo, abrojos, cerco de cristal, espejo, señuelo y embudo. Van aunque el
    // arsenal lo tenga quieto: el que duda por el cuerno arriba de los abrojos, se pincha.
    const ef = fortin.estadoAlien(a, dt, js);
    if (a.estado === 'morir') return;
    if (quietoArsenal || ef.quieto) {
      poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
      poseAlien.apuntando = false; poseAlien.enredado = true; poseAlien.agazapado = false; poseAlien.noche = nocheNivel;
      a.m.animar(poseAlien);
      a.px = p.x; a.pz = p.z;
      return;
    }
    velObj *= velArsenal * ef.vel;
    const rumboConfuso = rumboArsenal ?? ef.rumbo, sinAtaque = sinAtaqueArsenal || ef.sinAtaque;
    // 2.0: el bestiario anota lo que viste de cerca
    const mirado = estaMirando(miraJugador, js.pos, p);
    if (!a.visto && dist < DISTANCIA_VISTO && mirado) {
      a.visto = true;
      anotarEnBestiario(a.tipo, 'visto');
      if (a.mutado) anotarEnBestiario('mutado', 'visto');
      if (a.resiste) anotarEnBestiario('adaptado', 'visto');   // 3.0
    }

    // atrapado en un pozo o enredado por las boleadoras: no se mueve ni ataca
    if (a.atrapadoT > 0 || a.enredadoT > 0) {
      if (a.atrapadoT > 0) {
        a.atrapadoT -= dt;
        a.hundido = Math.min(0.7, a.hundido + dt * 3);
        herirAlien(a, a.atrapadoDps * dt, null, 'trampa');
      } else {
        a.enredadoT -= dt;
        g.rotation.z = Math.sin(a.fase * 14) * 0.08;
      }
      if (a.estado === 'morir') return;
      p.y = T.altura(p.x, p.z) - a.hundido;
      poseAlien.dt = dt; poseAlien.jugador = js.pos; poseAlien.velocidad = 0; poseAlien.golpe = 0; poseAlien.ataca = false; poseAlien.carrera = false;
      poseAlien.apuntando = false; poseAlien.enredado = true; poseAlien.agazapado = a.atrapadoT > 0; poseAlien.noche = nocheNivel;
      a.m.animar(poseAlien);
      return;
    }
    if (a.hundido > 0) { a.hundido = Math.max(0, a.hundido - dt * 2); g.rotation.z = 0; }
    // la red de cristal frena; pozos y barriles actúan solos
    velObj *= defensas.afectarAlien(a, dt);
    if (a.estado === 'morir') return;
    // la luz de las antorchas espanta (salvo a los pesados, que van a apagarlas)
    if (!def.pesado && a.estado === 'avanzar' && dist > 6) {
      defensas.repulsionLuz(p, _rep);
      if (_rep.x || _rep.z) rumboObj = Math.atan2(Math.sin(rumboObj) + _rep.x * 1.4, Math.cos(rumboObj) + _rep.z * 1.4);
    }
    if (def.pesado && a.estado === 'avanzar') {
      const antorcha = defensas.antorchaCercaDe(p, 2.4);
      if (antorcha && a.cd <= 0) { a.cd = def.cadencia; a.golpeT = 0.35; defensas.apagar(antorcha, 'bruto'); }
    }

    // estacas: lastiman y frenan
    a.frenoT = Math.max(0, a.frenoT - dt);
    for (const o of trampas) {
      const f = o.plano.defensa;
      if (Math.hypot(o.datos.x - p.x, o.datos.z - p.z) < f.radio + def.radio * 0.5) {
        herirAlien(a, f.dps * dt, null);
        a.frenoT = 0.4;
        vidaDe(o);
        o.datos.vida -= f.desgaste * dt;
        if (o.datos.vida <= 0) danarObra(o, 1);
      }
    }
    if (a.estado === 'morir') return;
    if (a.frenoT > 0) velObj *= 0.45;
    if (a.tipo === 'rastreador' && dist > 7 && dist < 45 && a.frenoT <= 0 && a.estado === 'avanzar') velObj *= 1.25;

    // 2.0: el acecho (ver `desafio-sentidos.js`). Si lo mirás, rodea o se esconde;
    // si le das la espalda, carga, y se lo oye venir.
    if (a.estado === 'avanzar' && ACECHAN.has(a.tipo)) {
      a.tArbol -= dt;
      if (a.tArbol <= 0) { a.tArbol = 0.9 + Math.random() * 0.5; a.arbol = arbolCerca(p, js.pos); }
      _acecho.tipo = a.tipo; _acecho.distancia = dist; _acecho.mirado = mirado; _acecho.noche = nocheNivel; _acecho.arbol = !!a.arbol; _acecho.herido = a.vida < a.vidaMax * 0.5;
      const modo = modoAcecho(_acecho);
      if (modo === 'cargar' && a.acecho !== 'cargar' && dist < 32) S.pasos(p);
      a.acecho = modo;
      velObj *= VELOCIDAD_ACECHO[modo];
      if (modo === 'rodear') rumboObj = rumboRodeo(p, js.pos, a.sentido);
      else if (modo === 'esconderse') {
        const e = escondite(a.arbol, js.pos);
        // ya detrás del tronco: se queda quieto, asomado, mirándote
        if (Math.hypot(e.x - p.x, e.z - p.z) < 0.8) velObj = 0;
        else rumboObj = Math.atan2(e.x - p.x, e.z - p.z);
      }
    } else a.acecho = 'normal';

    // 2.1: el excavador se mete bajo tierra si lo que tiene adelante es una obra
    if (def.excava && (a.estado === 'avanzar' || a.estado === 'romper')) {
      a.tCavar -= dt;
      if (a.tCavar <= 0) {
        a.tCavar = 0.6;
        _v.set(p.x, p.y + 1, p.z); _w.set(js.pos.x, js.pos.y + 1, js.pos.z);
        const enMedio = a.estado === 'romper' ? a.obra : hayObraEntre(_v, _w, 0.8);
        // 2.2: la madera con cimiento de piedra (taller → Base) no se puede cavar por abajo
        if (debeCavar({ distancia: dist, obraEnMedio: !!enMedio }) && !frenaAlExcavador(enMedio) && !fortin.frenaExcavador(enMedio)) {
          a.estado = 'bajoTierra'; a.bajoTierra = true; a.obra = null; g.visible = false; a.tTierra = 0;
          S.excavar(p);
          if (avisoExcavador !== D().oleadas) {
            avisoExcavador = D().oleadas;
            ctx.nota('Algo cava bajo la tierra', 'Va a salir adentro. Donde hay losa de piedra no puede asomar');
          }
          return;
        }
      }
    }
    // 2.1: cada jefe pelea a su manera (ver `desafio-valle.js`)
    if (def.jefe && a.variante && a.estado === 'avanzar') {
      if (a.variante === 'llamador') {
        a.tLlamado -= dt;
        if (a.tLlamado <= 0 && a.llamados < LLAMADO.tope && dist < 70) {
          a.tLlamado = LLAMADO.cada;
          S.llamado(p, 'jefe'); a.m.chillar();
          for (let i = 0; i < LLAMADO.cuantos; i++) {
            const ang = Math.random() * Math.PI * 2;
            if (invocar('rastreador', p.x + Math.cos(ang) * 6, p.z + Math.sin(ang) * 6)) a.llamados++;
          }
        }
      } else if (a.variante === 'artillero') {
        // se queda lejos y tira piedras a lo que tengas entre él y vos
        if (dist < ARTILLERO.distancia - 6) velObj = -def.vel * 0.7;
        else if (dist < ARTILLERO.distancia + 6) velObj = 0;
        a.tRoca -= dt;
        if (a.tRoca <= 0 && dist < ARTILLERO.distancia + 22) { a.tRoca = ARTILLERO.cada; tirarRoca(a, js); }
      }
    }

    if (a.estado === 'romper') {
      if (!a.obra || !obras.obras.includes(a.obra)) { a.estado = 'avanzar'; a.obra = null; }
      else if (intentarSaltar(a, a.obra)) { /* la saltó en vez de romperla */ }
      else {
        velObj = 0;
        rumboObj = Math.atan2(a.obra.datos.x - p.x, a.obra.datos.z - p.z);
        // 2.0: el asedio. Si estás encerrado ahí, primero tantea: rasca y prueba la puerta.
        const dObra = Math.hypot(a.obra.datos.x - js.pos.x, a.obra.datos.z - js.pos.z);
        if (!def.pesado && !a.tanteoTotal && esAsedio(adentroJugador, dObra)) {
          a.tanteoTotal = tiempoDeTanteo(a.tipo); a.tanteo = 0; a.tRasca = 0;
          if (a.tanteoTotal && avisoAsedio !== D().oleadas) {
            avisoAsedio = D().oleadas;
            ctx.nota('Tantean las paredes', 'Buscan por dónde entrar. Lo que rompan, arreglalo de día');
          }
        }
        const fase = a.tanteoTotal ? faseAsedio(a.tanteo, a.tanteoTotal, tienePuerta(a.obra.plano)) : 'golpear';
        if (fase !== 'golpear') {
          a.tanteo += dt; a.tRasca -= dt;
          if (a.tRasca <= 0) {
            a.tRasca = fase === 'puerta' ? 0.9 + Math.random() * 0.4 : 0.5 + Math.random() * 0.45;
            if (fase === 'puerta') S.puerta(p); else S.aranazo(p);
            sacudidas.set(a.obra, 0.12);
          }
          a.cd = Math.max(a.cd, 0.3);
        } else if (a.cd <= 0) { a.cd = def.cadencia; a.golpeT = 0.35; danarObra(a.obra, def.danoObra * a.danoMult); }
        // si el jugador quedó al alcance y nada se interpone, lo prefiere
        if (dist < alcanceCuerpo) a.estado = 'avanzar';
      }
    }
    if (a.estado === 'avanzar' && !sinAtaque && !a.robo) {
      // con lluvia o niebla los tiradores ven menos lejos
      if (def.aDistancia && dist < def.alcance * clima.vista && dist > 4) {
        _v.set(p.x, p.y + def.altura * 0.8, p.z);
        _w.set(js.pos.x, js.pos.y + 1.2, js.pos.z);
        const tapado = hayObraEntre(_v, _w, 0.8);
        if (!tapado) {
          velObj = dist < def.distancia ? -def.vel * 0.5 : dist < def.distancia + 3 ? 0 : velObj;
          if (a.cd <= 0) {
            a.cd = def.cadencia * (0.8 + Math.random() * 0.4);
            if (def.acido) {
              // escupitajo con arco: se compensa la caída para que llegue al blanco
              const vel = def.velProyectil || 16;
              _dir.copy(_w).sub(_v);
              const vuelo = _dir.length() / vel;
              _dir.y += 0.5 * GRAVEDAD_ACIDO * vuelo * vuelo;
              _dir.normalize();
              _dir.x += (Math.random() - 0.5) * 0.05; _dir.z += (Math.random() - 0.5) * 0.05;
              const q = lanzarProyectil('acido', _v, _dir.multiplyScalar(vel), def.dano * a.danoMult, false);
              q.danoObra = def.danoObra * a.danoMult;
              q.salpicadura = def.salpicadura || 0;
              S.escupir(p);
            } else {
              _dir.copy(_w).sub(_v).normalize();
              _dir.x += (Math.random() - 0.5) * 0.06; _dir.y += (Math.random() - 0.5) * 0.04;
              lanzarProyectil('bellota', _v, _dir.multiplyScalar(19), def.dano * a.danoMult, false);   // 3.8.0: la honda del duende
              S.plasma(p);
            }
            a.golpeT = 0.3;
          }
        }
      } else if (dist < alcanceCuerpo && Math.abs(js.pos.y - p.y) < 2.2) {
        velObj = 0;
        ataca = true;
        if (a.cd <= 0) {
          a.cd = def.cadencia;
          a.golpeT = 0.35;
          _v.set(p.x, p.y + 1.2, p.z);
          _w.set(js.pos.x, js.pos.y + 1.0, js.pos.z);
          const tapado = hayObraEntre(_v, _w, 0.3);
          if (tapado && intentarSaltar(a, tapado)) return;
          if (tapado) { a.estado = 'romper'; a.obra = tapado; }
          else { herirJugador(def.dano * a.danoMult, p); intentarRobo(a); }   // 3.8.0: la travesura
        }
      }
    }
    // 2.1: una noche de rescate, los que no te tienen cerca van por el lugar del vecino
    const resc = D().rescate;
    // 2.3: la noche de la trochita varada, lo que hay que defender es el tren
    const L = resc && !resc.caido ? T.lugares[resc.lugar] : (blancoVarada() || asedioMundo.blancoNoche());   // 3.0: o la baliza del asedio
    if (L && a.estado === 'avanzar' && !def.jefe && dist > 14) {
      {
        const dl = Math.hypot(L.x - p.x, L.z - p.z);
        rumboObj = Math.atan2(L.x - p.x, L.z - p.z);
        if (dl < (L.radio || 4.5) + 1.5 + def.radio) {
          velObj = 0; ataca = true;
          atacandoLugar++; multLugar = a.danoMult || 1;
          if (a.cd <= 0) { a.cd = def.cadencia; a.golpeT = 0.35; golpearLugar(L); }
        }
      }
    }
    // 3.8.0: el que robó sale corriendo para el otro lado, riéndose; al rato lo suelta y vuelve
    if (a.robo) {
      a.robo.t -= dt;
      if (a.robo.t <= 0) soltarRobo(a, false);
      else if (a.estado === 'avanzar') { rumboObj = Math.atan2(-dx, -dz); velObj = def.vel * ROBO.velHuida; ataca = false; }
    }
    // 2.5: perdido en el humo, camina para cualquier lado
    if (rumboConfuso !== null) rumboObj = rumboConfuso;
    // desvío temporal para rodear árboles y rocas
    if (a.desvioT > 0) { a.desvioT -= dt; rumboObj += a.desvio; }
    let dif = rumboObj - a.rumbo;
    dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    // el jefe se da vuelta despacio: por eso se lo puede rodear y pegarle en los sacos
    a.rumbo += dif * Math.min(1, dt * (def.giro || 6));
    g.rotation.y = a.rumbo;

    if (velObj !== 0 && a.estado === 'avanzar') {
      const paso = velObj * dt;
      const nx = p.x + Math.sin(a.rumbo) * paso, nz = p.z + Math.cos(a.rumbo) * paso;
      // 3.5.1: si ya está en el agua (apareció ahí: guardia, puesto, bajada), puede salir; antes
      // todo paso era agua y quedaba quieto para siempre (no se podía dormir ni subir a la nave)
      if ((T.agua(nx, nz) && !T.agua(p.x, p.z)) || Math.abs(nx) > LIMITE || Math.abs(nz) > LIMITE) {
        if (a.desvioT <= 0) { a.desvio = (Math.random() < 0.5 ? -1 : 1) * 1.3; a.desvioT = 1.6; }
      } else {
        p.x = nx; p.z = nz;
        p.y = T.altura(p.x, p.z);
        col.resolver(p, def.radio * a.m.esc, def.altura * a.m.esc);
        // atascado: si una obra lo frena, la ataca; si es un árbol, lo rodea
        const avance = Math.hypot(p.x - a.px, p.z - a.pz);
        a.atasco = avance < Math.abs(paso) * 0.35 ? a.atasco + dt : Math.max(0, a.atasco - dt * 2);
        if (a.atasco > 0.45) {
          a.atasco = 0;
          const o = obraBloqueando(a);
          if (o && intentarSaltar(a, o)) return;
          if (o) { a.estado = 'romper'; a.obra = o; a.cd = Math.min(a.cd, 0.4); }
          else if (a.desvioT <= 0) { a.desvio = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.6); a.desvioT = 1.2 + Math.random(); }
        }
      }
    }
    a.px = p.x; a.pz = p.z;
    p.y = T.altura(p.x, p.z);
    // 2.0: los ojos devuelven la luz de la linterna (ver `desafio-sentidos.js`)
    if (luzJugador.encendida) {
      _v.set(p.x, p.y + def.altura * a.m.esc * 0.9, p.z).sub(camara.position);
      const dl = _v.length();
      const cosL = dl > 0 ? _v.dot(dirCamara) / dl : 0;
      const giroCara = Math.atan2(dx, dz) - a.rumbo;
      const frente = Math.max(0, 1 - Math.abs(Math.atan2(Math.sin(giroCara), Math.cos(giroCara))) / 0.9);
      poseAlien.reflejo = reflejoOjos({ encendida: true, cosLinterna: cosL, angulo: luzJugador.angulo, distancia: dl, alcance: luzJugador.alcance, frente, noche: nocheNivel });
      a.reflejo = poseAlien.reflejo;
      // 2.1: ¿el haz lo toca? (para el jefe sombra, que sólo se ve así)
      a.enHaz = cosL > Math.cos(luzJugador.angulo * 1.15) && dl < luzJugador.alcance * 1.3;
    } else { a.reflejo = 0; a.enHaz = false; }
    // 2.5: bajo una bengala se lo ve (los ojos prendidos, y al jefe sombra también)
    if ((arsenal.bengalas && arsenal.revelado(p)) || fortin.revelado(a)) { poseAlien.reflejo = Math.max(poseAlien.reflejo, 0.9); a.enHaz = true; }
    if (def.jefe && a.variante === 'sombra') {
      _sombra.reflejo = a.enHaz ? 1 : 0; _sombra.distancia = dist; _sombra.flash = a.flash;
      a.m.malla.visible = sombraVisible(_sombra);
    }
    // animación: el esqueleto se posa según lo que está haciendo
    const anda = a.estado === 'avanzar' && velObj !== 0;
    a.golpeT = Math.max(0, (a.golpeT || 0) - dt);
    poseAlien.dt = dt;
    // dónde está parado el jugador: el invasor lo usa para saber si lo está mirando,
    // que es cuando se le prenden los ojos
    poseAlien.jugador = js.pos;
    poseAlien.velocidad = anda ? Math.abs(velObj) : 0;
    poseAlien.golpe = a.golpeT > 0 ? Math.sin((1 - a.golpeT / 0.35) * Math.PI) : 0;
    poseAlien.ataca = ataca || a.estado === 'romper';
    // el rastreador carga en cuatro patas cuando te tiene en la mira y está lejos
    poseAlien.carrera = a.tipo === 'rastreador' && anda && dist > 7 && dist < 45 && a.frenoT <= 0;
    poseAlien.apuntando = !!def.aDistancia && dist < def.alcance && !anda;
    poseAlien.agazapado = !anda && !poseAlien.ataca && dist < 14;
    poseAlien.enredado = false;
    poseAlien.saltando = 0;
    poseAlien.noche = nocheNivel;
    a.m.animar(poseAlien);
  }
  const empujados = new Set();   // 3.5.1: los que se empujaron en este cuadro
  const poseAlien = { dt: 0, velocidad: 0, golpe: 0, ataca: false, carrera: false, apuntando: false, agazapado: false, enredado: false, saltando: 0, noche: 0, reflejo: 0 };
  // 2.6.1: los argumentos de las reglas puras de cada invasor, en objetos fijos (antes
  // era un objeto nuevo por invasor y por cuadro)
  const _despierta = { distancia: 0, agachado: false, corriendo: false };
  const _acecho = { tipo: '', distancia: 0, mirado: false, noche: 0, arbol: false, herido: false };
  const _sombra = { reflejo: 0, distancia: 0, flash: 0 };
  let nocheNivel = 0;
  // El valle de noche, cuando no pasa nada.
  //
  // Lo que da miedo no es el invasor que tenés adelante: es saber que hay otros, y no
  // saber dónde. Tres cosas suenan solas, cada una con su tiempo, y ninguna en un ritmo
  // parejo —la espera es la mitad del asunto—:
  //   · el acecho de alguno lejos, que de lejos llega como un temblor y no como un grito;
  //   · la respiración del que se te puso al lado y todavía no viste;
  //   · el latido del nido, si andás cerca del lugar donde está enterrado.
  const coro = { acecho: 4, respiro: 2.5, latido: 3 };
  function coroDelValle(dt, js) {
    if (nocheNivel < 0.25) return;                 // de día el valle se calla
    coro.acecho -= dt; coro.respiro -= dt; coro.latido -= dt;
    // Ojo con pedir memoria acá: esto corre en cada cuadro. Las listas de invasores se
    // arman sólo cuando toca sonar, que es cada varios segundos.
    if (coro.acecho <= 0) {
      const vivos = aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse');
      coro.acecho = esperaVoz('acecho', false) * (vivos.length > 4 ? 0.7 : 1);
      // el que está más lejos, que es el que no se ve
      const lejanos = vivos.filter((a) => U_distancia(a.m.g.position, js.pos) > 38);
      const a = lejanos[Math.floor(Math.random() * lejanos.length)];
      if (a) S.acecho(a.m.g.position, a.tipo);
    }

    if (coro.respiro <= 0) {
      coro.respiro = esperaVoz('respiro', true);
      const encima = aliens.find((a) => a.estado !== 'morir' && a.estado !== 'irse' && U_distancia(a.m.g.position, js.pos) < 7);
      if (encima) S.respiro(encima.m.g.position, encima.tipo);
    }

    // El nido late abajo de la tierra, y se escucha aunque todavía no lo hayas
    // marcado en el mapa: si estás caminando cerca, lo sentís antes de saberlo.
    if (coro.latido <= 0) {
      coro.latido = 2.4 + Math.random() * 1.6;
      const n = D().nido;
      if (n && !n.caido && U_distancia(n, js.pos) < 70) S.latido({ x: n.x, y: T.altura(n.x, n.z) - 1.5, z: n.z });
    }
  }

  function U_distancia(p, q) { return Math.hypot(p.x - q.x, p.z - q.z); }

  // El ácido revienta donde cae: mancha verde, quema las obras que tiene al lado
  // y salpica al jugador si está cerca (la mitad del daño del impacto directo).
  const scratchSalpicadura = [];
  function salpicarAcido(q, obraTocada = null, directo = false) {
    S.acido(q.pos);
    efectos.polvo(q.pos, 7, '#c8c860');   // 3.8.0: savia y esporas
    efectos.chispas(q.pos, 6);
    const r = q.salpicadura || 0;
    if (r <= 0) return;
    for (const o of obras.obrasCerca(q.pos, r + 2, scratchSalpicadura)) {
      if (o === obraTocada || !completa(o)) continue;
      if (Math.hypot(o.datos.x - q.pos.x, o.datos.z - q.pos.z) > r + (o.plano.ancho || 1) / 2) continue;
      danarObra(o, (q.danoObra || q.dano) * 0.5);
    }
    if (directo) return;
    const js = ctx.jugador().estado;
    if (Math.hypot(js.pos.x - q.pos.x, js.pos.z - q.pos.z) < r && Math.abs(js.pos.y - q.pos.y) < 2.4) herirJugador(q.dano * 0.5, q.pos);
  }
  // El inicio de cada tramo del proyectil y el "desde" que se le pasa a herirAlien van en
  // vectores propios: herirAlien usa _v por dentro, y con un tiro que atraviesa (2.5) el
  // tramo seguía desde cualquier lado.
  const _p0 = new THREE.Vector3(), _desde = new THREE.Vector3();
  function actualizarProyectiles(dt, js) {
    for (let i = proyectiles.length - 1; i >= 0; i--) {
      const q = proyectiles[i];
      q.vida -= dt;
      if (q.clavada > 0) { q.clavada -= dt; if (q.clavada <= 0) retirarProyectil(i); continue; }
      if (q.vida <= 0) { if (!q.terminado) arsenal.alTerminar(q, 'vida'); retirarProyectil(i); continue; }
      _p0.copy(q.pos);
      q.vel.y -= q.gravedad * dt;
      q.pos.addScaledVector(q.vel, dt);
      q.mesh.position.copy(q.pos);
      if (q.tipo === 'boleadora') q.mesh.rotation.y += dt * 18;
      else if (arsenal.malla(q.tipo)?.gira) q.mesh.rotation.x += dt * 16;
      else if (q.tipo !== 'plasma' && q.tipo !== 'plasmaAliado' && q.tipo !== 'piedra') q.mesh.lookAt(_w.copy(q.pos).add(q.vel));
      // 2.5: la bengala estalla al llegar arriba
      if (arsenal.terminaEnAire(q)) { q.terminado = true; arsenal.alTerminar(q, 'aire'); retirarProyectil(i); continue; }
      let fin = false;
      // pasos cortos para no atravesar una pared delgada a alta velocidad
      const L = _p0.distanceTo(q.pos), n = Math.max(1, Math.ceil(L / 0.35));
      for (let k = 1; k <= n && !fin; k++) {
        const t = k / n;
        const x = _p0.x + (q.pos.x - _p0.x) * t, y = _p0.y + (q.pos.y - _p0.y) * t, z = _p0.z + (q.pos.z - _p0.z) * t;
        if (y < alturaSuelo(x, z)) {
          fin = 'suelo'; q.pos.set(x, y, z);
          if (q.tipo === 'piedra') efectos.polvo(q.pos, 3);
          else if (q.tipo === 'roca') golpeRoca(q);      // 2.1: la piedra del artillero
          else if (q.tipo === 'acido') salpicarAcido(q);
          else if (q.tipo === 'plasmaAliado' || q.tipo === 'plasma') efectos.chispas(q.pos, 5);
          else if (q.tipo === 'bellota') efectos.astillas?.(q.pos, 4, '#8a6a3a');   // 3.8.0
          break;
        }
        const o = obraEnPunto(x, y, z, -0.02, q.ignorar, q.deJugador);
        if (o) {
          fin = 'obra'; q.pos.set(x, y, z);
          if (!q.deJugador) danarObra(o, q.danoObra || q.dano * 0.6);
          if (q.tipo === 'acido') salpicarAcido(q, o);
          if (q.tipo === 'roca') { efectos.polvo(q.pos, 10); S.roca(q.pos); }
          break;
        }
        if (q.deJugador) {
          for (const a of aliens) {
            if (a.estado === 'morir' || a.estado === 'irse') continue;
            if (q.golpeados?.has(a)) continue;   // 2.5: lo que atraviesa no pega dos veces
            const ap = a.m.g.position, r = a.def.radio * a.m.esc + (q.tipo === 'boleadora' ? 0.45 : 0.2);
            if (Math.hypot(ap.x - x, ap.z - z) < r && y > ap.y - MARGEN_GOLPE.abajo && y < ap.y + a.def.altura * a.m.esc + (q.tipo === 'boleadora' ? MARGEN_GOLPE.boleadora : MARGEN_GOLPE.arriba)   // 3.8.0: duendes chiquitos
              && !margenTapado(x, y, z, a, q.ignorar)) {   // 3.8.1: el margen no pega a través de una pared
              if (q.tipo === 'boleadora' && !a.def.pesado) { a.enredadoT = q.enreda || 3; S.enredo(ap); }
              else if (q.tipo === 'boleadora') { a.frenoT = 1.5; S.enredo(ap); }
              if (q.dano > 0) herirAlien(a, arsenal.danoProyectil(q, a), _desde.copy(_p0), q.fuente, impactoEn(a, x, y, z), claseDeProyectil(q));
              if (q.efecto) aplicarForja(q.efecto, a, _desde.copy(_p0), q.dano);   // 2.1: la forja
              // 2.5: fuego, descarga, derribo y arpón; el que atraviesa sigue de largo
              if (arsenal.alPegar(q, a) === 'sigue') { (q.golpeados ||= new Set()).add(a); continue; }
              q.pos.set(x, y, z);
              fin = 'alien'; break;
            }
          }
          if (!fin) for (const nc of eventos.blancos()) {
            if (Math.hypot(nc.pos.x - x, nc.pos.y - y, nc.pos.z - z) < nc.radio) {
              eventos.herirNucleo(nc, q.dano); if (q.fuente === 'jugador') marcarImpacto(false); fin = 'alien'; break;
            }
          }
        } else if (Math.hypot(js.pos.x - x, js.pos.z - z) < 0.5 && y > js.pos.y && y < js.pos.y + 1.8) {
          herirJugador(q.dano, _desde.copy(_p0)); fin = 'jugador';
          if (q.tipo === 'acido') { q.pos.set(x, y, z); salpicarAcido(q, null, true); }
          // 2.1: la piedra del artillero también se oye y levanta polvo si te da de lleno
          if (q.tipo === 'roca') { q.pos.set(x, y, z); efectos.polvo(q.pos, 10); S.roca(q.pos); }
        }
      }
      if (fin) {
        if (q.deJugador) { q.terminado = true; arsenal.alTerminar(q, fin); }
        if ((q.tipo === 'flecha' || q.tipo === 'perno' || q.tipo === 'virote') && fin !== 'alien') { q.clavada = 5; q.mesh.position.copy(q.pos); }
        else retirarProyectil(i);
      }
    }
  }

  const candidatosTorreta = [], reservaCandidatos = [];   // 2.6.1: los candidatos se reusan
  function actualizarDefensas(dt) {
    acumuladoDefensas += dt;
    if (acumuladoDefensas > 1) { acumuladoDefensas = 0; refrescarDefensas(); }
    for (const o of torretas) {
      const f = o.plano.defensa;
      const t = (recargaTorreta.get(o) || 0) - dt;
      if (t > 0) { recargaTorreta.set(o, t); continue; }
      // 2.3: la ballesta común no le apunta al volador que va alto; la del cielo lo
      // prefiere (ver `desafio-cielo.js`)
      candidatosTorreta.length = 0;
      for (const a of aliens) {
        if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.estado === 'bajoTierra' || a.estado === 'dormido') continue;
        const ap = a.m.g.position;
        const c = reservaCandidatos[candidatosTorreta.length] || (reservaCandidatos[candidatosTorreta.length] = { a: null, d: 0, alto: 0, vuela: false });
        c.a = a; c.d = Math.hypot(ap.x - o.datos.x, ap.z - o.datos.z); c.alto = ap.y - T.altura(ap.x, ap.z); c.vuela = !!a.def.vuela;
        candidatosTorreta.push(c);
      }
      const mejor = elegirParaTorreta(f, candidatosTorreta)?.a || null;
      _v.set(o.datos.x, o.datos.y + f.altura, o.datos.z);
      let nucleo = null;
      if (!mejor) {
        // sin invasores a tiro, las torretas le tiran a los núcleos de la nodriza
        for (const nc of eventos.blancos()) if (_v.distanceTo(nc.pos) < f.alcance * 1.8) { nucleo = nc; break; }
        if (!nucleo) { recargaTorreta.set(o, 0.3); continue; }
      }
      recargaTorreta.set(o, f.cadencia);
      if (nucleo) _w.copy(nucleo.pos);
      else _w.set(mejor.m.g.position.x, mejor.m.g.position.y + mejor.def.altura * mejor.m.esc * 0.55, mejor.m.g.position.z);
      const velocidad = f.plasma ? 40 : 55;
      _dir.copy(_w).sub(_v);
      if (!f.plasma) {
        // compensa la caída del perno
        const tiempo = _dir.length() / velocidad;
        _dir.y += 0.5 * 4 * tiempo * tiempo;
      }
      _dir.normalize().multiplyScalar(velocidad);
      _v.addScaledVector(_dir, 0.02);
      lanzarProyectil(f.plasma ? 'plasmaAliado' : 'perno', _v, _dir, f.dano, true, 'torreta');
      if (f.plasma) S.plasma(o.datos); else S.ballesta(o.datos);
    }
    for (const [o, t] of sacudidas) {
      const r = t - dt;
      if (r <= 0 || !obras.obras.includes(o)) { o.grupo.position.set(o.datos.x, o.datos.y, o.datos.z); sacudidas.delete(o); continue; }
      sacudidas.set(o, r);
      o.grupo.position.set(o.datos.x + (Math.random() - 0.5) * 0.08 * r * 4, o.datos.y, o.datos.z + (Math.random() - 0.5) * 0.08 * r * 4);
    }
  }

  function actualizarNave(dt) {
    if (!nave.g.visible) return;
    estadoNave.t += dt;
    const e = estadoNave;
    let alto = e.y;
    if (e.fase === 'llegando') {
      alto = e.y + Math.max(0, 1 - e.t / 4) ** 2 * 260;
      if (e.t > 4) { e.fase = 'bajando'; e.t = 0; e.ritmo = 0; }
    } else if (e.fase === 'bajando') {
      e.ritmo -= dt;
      if (e.ritmo <= 0 && e.porBajar.length) { bajarAlien(e.porBajar.shift()); e.ritmo = 0.55; }
      if (!e.porBajar.length && e.t > 1) { e.fase = 'vigilando'; e.t = 0; }
    } else if (e.fase === 'yendo') {
      alto = e.y + (e.t / 5) ** 2 * 300;
      if (e.t > 5) { nave.g.visible = false; e.fase = 'fuera'; luzNave.intensity = 0; return; }
    }
    nave.g.position.set(e.x + Math.sin(e.t * 0.2) * (e.fase === 'vigilando' ? 6 : 0), alto + Math.sin(e.t * 0.9) * 0.6, e.z + Math.cos(e.t * 0.2) * (e.fase === 'vigilando' ? 6 : 0));
    nave.g.rotation.y += dt * 0.35;
    const conHaz = e.fase === 'bajando' || (e.fase === 'yendo' && e.t < 1.5);
    nave.haz.visible = conHaz;
    if (conHaz) {
      const suelo = T.altura(e.x, e.z);
      const largo = Math.max(1, nave.g.position.y - suelo) / nave.g.scale.y;
      nave.haz.scale.set(1, largo, 1);
      nave.haz.position.y = -largo / 2;
      nave.haz.material.opacity = 0.12 + Math.sin(e.t * 12) * 0.04;
    }
    luzNave.intensity = e.fase === 'yendo' ? Math.max(0, 1 - e.t) * 80 : 80;
    nave.reflectores.visible = e.fase === 'vigilando';
    if (e.fase === 'vigilando') {
      nave.reflectores.rotation.y = -nave.g.rotation.y + e.t * 0.5;
      nave.reflectores.children.forEach((piv, i) => { piv.rotation.z = (i ? 1 : -1) * (0.35 + Math.sin(e.t * 0.7 + i * 2) * 0.25); });
    }
    for (let i = 0; i < nave.luces.length; i++) nave.luces[i].material.color.setHex(((i + Math.floor(e.t * 6)) % 3) ? 0x3f7a2c : 0xa6ff6e);
    e.zumbido = (e.zumbido || 0) - dt;
    if (e.zumbido <= 0) { e.zumbido = 1.3; S.zumbido(nave.g.position); }
  }

  function actualizarCristales(dt, js) {
    let juntados = 0;
    for (const c of cristales) {
      if (!c.activo) continue;
      c.t += dt;
      c.mesh.position.set(c.x, c.y + Math.sin(c.t * 2.4) * 0.08, c.z);
      c.mesh.rotation.y = c.t * 1.6;
      if (Math.hypot(js.pos.x - c.x, js.pos.z - c.z) < 1.7 && Math.abs(js.pos.y - c.y) < 2) {
        c.activo = false; c.mesh.visible = false; juntados++;
      }
    }
    if (juntados) {
      ctx.sumarMaterial('cristal', juntados);
      sonido.juntar();
      ctx.nota(`+${juntados} ${juntados === 1 ? 'semilla dorada' : 'semillas doradas'}`, `Llevás ${ctx.cuanto('cristal')} · sirven para cargar la pistola de luz`);
    }
  }

  function revisarCapsula(js) {
    const d = D();
    faroCapsula.visible = !d.pistolaEncontrada;
    faroCapsula.material.opacity = 0.09 + Math.sin(performance.now() / 600) * 0.03;
    if (d.pistolaEncontrada) return;
    if (Math.hypot(js.pos.x - capsula.x, js.pos.z - capsula.z) < 3.2) {
      d.pistolaEncontrada = true;
      darCosa('pistola');
      d.cargas += 12;
      ctx.nota('Encontraste una pistola de luz', 'Estaba en el cofre de los duendes. Trae doce cargas; las semillas doradas dan más', true);
      sonido.juntar();
      ctx.alFabricar?.({ da: { cosa: 'pistola' } });
      ctx.guardar();
    }
  }

  // ---------------- caja de suministros del amanecer
  // 3.8.0: ya no cae en paracaídas: es un cofre que brota del suelo entre raíces, con un brillo dorado
  // (duendes-modelo.js). Nada vuela. `alturaCaja` es cuánto le falta para asomar entero (va de -0,9 a 0).
  const caja = mallaCofre();
  caja.visible = false;
  escena.add(caja);
  registrarHalos(caja);
  function soltarCaja(noche) {
    const js = ctx.jugador().estado;
    const azarCaja = azarNoche('caja', noche);
    let parejo = null, enPendiente = null, trabado = null;
    for (let i = 0; i < 12 && !parejo; i++) {
      const a = azarCaja() * Math.PI * 2, r = 5 + azarCaja() * 4;   // 3.0: con código, la caja cae siempre igual
      const x = js.pos.x + Math.cos(a) * r, z = js.pos.z + Math.sin(a) * r;
      // 3.8.1: el cofre (90 × 60 cm) ya no brota adentro de una pared (el margen era menor que su media
      // diagonal), de un árbol o de una piedra; y si puede, en un lugar parejo (en la pendiente quedaba
      // medio enterrado: se apoya en la altura del centro)
      // (si todo el claro está trabado, como antes: brota igual antes que quedarse sin cofre)
      if (T.agua(x, z) || obraEnPunto(x, T.altura(x, z) + 0.5, z, 0.6)) continue;
      if (cofreTrabado(x, z)) { trabado ||= { x, z }; continue; }
      if (cofreParejo(x, z)) parejo = { x, z };
      else enPendiente ||= { x, z };
    }
    const p = parejo || enPendiente || trabado;
    if (!p) return;
    D().caja = { x: p.x, z: p.z, contenido: suministrosDelAlba(noche, !!progreso().cosas?.arco), cayendo: true };
    ctx.nota('Brotó un cofre entre las raíces', 'Está cerca, con un brillo dorado. Pasá por encima para abrirlo');
  }
  // 3.8.1: ¿hay un árbol, una piedra o un cuerpo de obra donde iría el cofre? ¿El suelo es parejo?
  function cofreTrabado(x, z) {
    const p = { x, z };
    for (const dx of [-4, 0, 4]) for (const dz of [-4, 0, 4]) for (const c of col.cercanos(x + dx, z + dz)) {
      if (!c.despejado && distColision(c, p) < (c.r || 0) + 0.55) return true;
    }
    return false;
  }
  function cofreParejo(x, z) {
    const h = T.altura(x, z);
    for (const [dx, dz] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) if (Math.abs(T.altura(x + dx, z + dz) - h) > 0.18) return false;
    return true;
  }
  const BROTA = { hondo: 0.9, vel: 0.32 };   // 3.8.0: de cuán abajo sale y a qué velocidad (m/s)
  let alturaCaja = 0, tBrillo = 0, tTierra = 0;
  function actualizarCaja(dt, js) {
    const c = D().caja;
    if (!c) { caja.visible = false; return; }
    const suelo = T.altura(c.x, c.z);
    if (!caja.visible) { caja.visible = true; alturaCaja = c.cayendo ? -BROTA.hondo : 0; caja.rotation.y = (c.x * 7.1 + c.z * 3.3) % 6.28; }
    const subiendo = alturaCaja < 0;
    alturaCaja = Math.min(0, alturaCaja + dt * BROTA.vel);
    if (alturaCaja === 0) c.cayendo = false;
    caja.position.set(c.x, suelo, c.z);
    // el cofre sube, las raíces crecen con él y la tierra salta mientras brota
    caja.userData.cofre.position.y = alturaCaja;
    caja.userData.raices.scale.set(1, 0.35 + 0.65 * (1 + alturaCaja / BROTA.hondo), 1);
    if (subiendo) { tTierra -= dt; if (tTierra <= 0) { tTierra = 0.35; _v.set(c.x, suelo + 0.15, c.z); efectos.polvo(_v, 5, '#6b5a44'); } }
    tBrillo += dt;
    caja.userData.brilloHalos = 0.8 + 0.25 * Math.sin(tBrillo * 2.2);
    caja.userData.haz.scale.set(1, 1, 1);
    const enSuelo = alturaCaja === 0;
    if (!enSuelo || Math.hypot(js.pos.x - c.x, js.pos.z - c.z) > 1.8) return;
    const d = D(), partes = [];
    const NOMBRES = { tronco: 'troncos', tabla: 'tablas', piedra: 'piedras', cristal: 'semillas doradas' };
    for (const [k, n] of Object.entries(c.contenido || {})) {
      if (NOMBRES[k]) { ctx.sumarMaterial(k, n); partes.push(`${n} ${NOMBRES[k]}`); }
      else if (k === 'flechas' || k === 'emplastos') { d[k] = (d[k] || 0) + n; partes.push(`${n} ${k === 'flechas' ? 'flechas' : n === 1 ? 'emplasto' : 'emplastos'}`); }
    }
    d.caja = null;
    caja.visible = false;
    sonido.juntar();
    ctx.nota('Cofre del alba', partes.join(' · '), true);
    ctx.alFabricar?.({});
    ctx.guardar();
  }

  // ---------------- lectura del combate: impacto, vida de los invasores, de dónde te pegan
  const hudEl = document.getElementById('hud');
  const impactoEl = document.createElement('div');
  impactoEl.className = 'impacto';
  hudEl?.appendChild(impactoEl);
  let impactoT = 0;
  function marcarImpacto(mortal) {
    impactoT = mortal ? 0.45 : 0.25;
    impactoEl.classList.toggle('mortal', !!mortal);
  }
  const barrasVida = [];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    b.className = 'vida-alien';
    b.appendChild(document.createElement('i'));
    hudEl?.appendChild(b);
    barrasVida.push(b);
  }
  const indicadores = [];
  for (let i = 0; i < 4; i++) {
    const e = document.createElement('div');
    e.className = 'dano-dir';
    hudEl?.appendChild(e);
    indicadores.push({ e, t: 0 });
  }
  let proximoIndicador = 0;
  function indicarDano(desde) {
    const js = ctx.jugador().estado;
    const sx = desde.x - js.pos.x, sz = desde.z - js.pos.z;
    // 0° = adelante, 90° = a la derecha (mismos ejes que el movimiento del jugador)
    const adelante = sx * -Math.sin(js.yaw) + sz * -Math.cos(js.yaw);
    const derecha = sx * Math.cos(js.yaw) + sz * -Math.sin(js.yaw);
    const ind = indicadores[proximoIndicador++ % indicadores.length];
    ind.t = 1;
    ind.e.style.transform = `rotate(${Math.atan2(derecha, adelante)}rad)`;
  }
  const _p = new THREE.Vector3();
  function actualizarLectura(dt) {
    impactoT = Math.max(0, impactoT - dt);
    impactoEl.style.opacity = String(Math.min(1, impactoT * 5));
    for (const ind of indicadores) { ind.t = Math.max(0, ind.t - dt * 0.9); ind.e.style.opacity = String(ind.t); }
    let k = 0;
    // El jefe se lleva la primera barra: se ve entero (aunque esté sano) y va
    // agrandada por clase y medidas, sin agregar nada nuevo al HTML.
    const jefe = jefeVivo();
    // 2.6.1: `dibujarBarra` ya no es una closure nueva en cada cuadro: dice si usó la barra
    if (jefe && jefe.estado !== 'bajar' && dibujarBarra(jefe, true, barrasVida[k])) k++;
    for (const a of aliens) {
      if (k >= barrasVida.length) break;
      if (a === jefe || a.estado === 'morir' || a.estado === 'irse' || a.vida >= a.vidaMax) continue;
      if (camara.position.distanceToSquared(a.m.g.position) > 45 * 45) continue;
      if (dibujarBarra(a, false, barrasVida[k])) k++;
    }
    for (; k < barrasVida.length; k++) { barrasVida[k].style.display = 'none'; medidaBarra(barrasVida[k], false); }
  }
  function dibujarBarra(a, esJefe, b) {
    const g = a.m.g.position;
    _p.set(g.x, g.y + a.def.altura * a.m.esc + (esJefe ? 0.7 : 0.35), g.z).project(camara);
    if (_p.z > 1 || Math.abs(_p.x) > 1.1 || Math.abs(_p.y) > 1.1) return false;
    medidaBarra(b, esJefe);
    b.style.display = 'block';
    b.style.left = `${(_p.x * 0.5 + 0.5) * window.innerWidth}px`;
    b.style.top = `${(-_p.y * 0.5 + 0.5) * window.innerHeight}px`;
    b.firstChild.style.width = `${Math.max(0, a.vida / a.vidaMax) * 100}%`;
    return true;
  }
  // La barra del jefe es la misma `.vida-alien`, con la clase `jefe` y el triple
  // de tamaño (las medidas van por JS porque la hoja de estilo no las conoce).
  function medidaBarra(b, esJefe) {
    if (!!b.dataset.jefe === !!esJefe) return;
    b.dataset.jefe = esJefe ? '1' : '';
    b.classList.toggle('jefe', !!esJefe);
    b.style.width = esJefe ? '190px' : '';
    b.style.height = esJefe ? '11px' : '';
    b.style.boxShadow = esJefe ? '0 0 0 2px rgba(200,255,94,.75), 0 0 12px rgba(200,255,94,.45)' : '';
  }

  // Aparece un invasor en un punto (pruebas y depuración).
  function invocar(tipo, x, z) {
    // 3.5.1: el punto de bajada vuelve a su lugar: el jefe llamador, la guardia de una aguja y
    // las crías corrían la nave de la oleada (y lo que faltaba bajar) a donde invocaban
    const nx0 = estadoNave.x, nz0 = estadoNave.z;
    estadoNave.x = x; estadoNave.z = z;
    // 2.1: si no pudo bajar (base llena, o ya hay un jefe), no se agarra otro de la lista
    const a = bajarAlien(tipo);
    estadoNave.x = nx0; estadoNave.z = nz0;
    if (!a) return null;
    a.m.g.position.set(x, T.altura(x, z), z);
    a.estado = 'avanzar';
    return a;
  }
  // Un invasor que sale en un punto sin mover la nave (los capullos): `invocar` corre el
  // punto de bajada de la nave, y eso cambiaría dónde bajan los que faltan.
  function aparecerEn(tipo, x, z) {
    const nx = estadoNave.x, nz = estadoNave.z;
    const a = invocar(tipo, x, z);
    estadoNave.x = nx; estadoNave.z = nz;
    return a;
  }

  // ======================================================================== 2.3
  // ---------------- la semilla: el azar de cada noche sale del código de la partida
  // (ver `semilla.js`). Sin código, `azarDe` devuelve Math.random: todo como siempre.
  const azarNoche = (clave, n = D().oleadas + 1) => azarDe(D().semilla, n, clave);
  const CLAVE_SEMILLAS = 'hojarasca-semillas-v1';
  function recordDeSemilla() {
    const d = D();
    if (!d.semilla || d.sinFin) return null;   // 3.0: la corrida sin fin anota aparte
    try {
      const todos = sanearRecordsSemilla(JSON.parse(localStorage.getItem(CLAVE_SEMILLAS) || '{}'));
      const r = registrarSemilla(todos, d.semilla, { noches: d.noches, abatidos: d.abatidos, fecha: new Date().toISOString().slice(0, 10) });
      localStorage.setItem(CLAVE_SEMILLAS, JSON.stringify(todos));
      return r;
    } catch { return null; }
  }

  // ---------------- la infestación: capullos en el bosque (ver `desafio-infestacion.js`)
  const mallasCapullo = [];
  let tCapullos = 0;
  const quemandoCapullo = new WeakMap();
  // 3.8.0: el capullo es un nido de hongos y musgo (duendes-modelo.js): las geometrías se comparten
  function mallaCapullo(i) {
    if (mallasCapullo[i]) return mallasCapullo[i];
    const g = new THREE.Group();
    const nido = mallaNido();
    nido.rotation.y = i * 2.3;
    g.add(nido);
    registrarHalos(nido);
    g.visible = false; g.name = 'capullo';
    escena.add(g);
    return (mallasCapullo[i] = g);
  }
  function sincronizarCapullos() {
    const lista = D().capullos || [];
    for (let i = 0; i < Math.max(lista.length, mallasCapullo.length); i++) {
      const c = lista[i];
      const m = c ? mallaCapullo(i) : mallasCapullo[i];
      if (!m) continue;
      m.visible = !!c;
      if (c) { m.position.set(c.x, T.altura(c.x, c.z), c.z); if (!quemandoCapullo.has(c)) m.scale.setScalar(1); }
    }
  }
  function sembrarCapullos() {
    const d = D();
    const n = cuantosCapullos(d.oleadas + 1);
    const esBueno = (x, z) => Math.abs(x) < LIMITE - 20 && Math.abs(z) < LIMITE - 20 && !T.agua(x, z) && !obraEnPunto(x, T.altura(x, z) + 0.5, z);
    d.capullos = n ? lugaresCapullos(n, centroBase(), { esBueno, azar: azarNoche('capullos') }) : [];
    sincronizarCapullos();
    if (!d.capullos.length) return;
    const js = ctx.jugador().estado;
    const dist = (c) => Math.hypot(c.x - js.pos.x, c.z - js.pos.z);
    const mas = d.capullos.reduce((a, b) => (dist(a) < dist(b) ? a : b));
    const n1 = d.capullos.length === 1;
    // 3.1: una sola nota pendiente, con la cuenta de ahora; si en esos segundos cambió la
    // lista (otra siembra, se quemaron) no sale: antes podía decir «Quedaron 0 capullos»
    // varias veces y tapar otros avisos
    const lista = d.capullos, cuantos = lista.length;
    clearTimeout(notaCapullos);
    notaCapullos = setTimeout(() => {
      if (D().capullos !== lista || !lista.length) return;
      ctx.nota(n1 ? 'Quedó un nido de hongos en el bosque' : `Quedaron ${cuantos} nidos de hongos en el bosque`,
        n1 ? `Está ${rumboTexto(js.pos, mas)}. Quemalo (E, con una ramita) antes de que caiga la noche` : `El más cercano, ${rumboTexto(js.pos, mas)}. Quemalos (E, con una ramita) antes de que caiga la noche`, true);
    }, 4500);
  }
  let notaCapullos = 0;
  function abrirCapullos() {
    const d = D(), lista = d.capullos || [];
    if (!lista.length) return;
    const azar = azarNoche('capullos-abren', d.oleadas);
    let n = 0;
    for (const c of lista) {
      _v.set(c.x, T.altura(c.x, c.z) + 0.6, c.z);
      efectos.sangre?.(_v, 10);
      S.capullo(_v);
      for (const tipo of queSale(d.oleadas, azar)) {
        if (aparecerEn(tipo, c.x + (azar() - 0.5) * 1.5, c.z + (azar() - 0.5) * 1.5)) n++;
      }
    }
    nocheActual.invasores += n;
    d.vivos = (d.vivos || 0) + n;
    d.capullos = [];
    sincronizarCapullos();
    if (n) setTimeout(() => ctx.nota(lista.length === 1 ? 'Se abrió un nido de hongos' : `Se abrieron ${lista.length} nidos de hongos`, n === 1 ? 'Un duende más, desde el bosque' : `${n} duendes más, desde el bosque`, true), 1500);
  }
  function capulloCerca(pos, radio = CAPULLOS.radioUsar) {
    let mejor = null, d0 = radio;
    for (const c of D().capullos || []) {
      const d = Math.hypot(c.x - pos.x, c.z - pos.z);
      if (d < d0 && !quemandoCapullo.has(c)) { d0 = d; mejor = c; }
    }
    return mejor;
  }
  function usarCapulloCerca(pos) {
    const c = capulloCerca(pos);
    if (!c) return false;
    const r = usarCapullo({ ramitas: ctx.cuanto('ramita'), lluvia: api.clima().lluvia });
    if (r.accion === 'quemar') {
      ctx.gastar('ramita', 1);
      quemandoCapullo.set(c, CAPULLOS.quemar);
      _v.set(c.x, T.altura(c.x, c.z) + 0.7, c.z);
      efectos.fuego(_v, 1.3);
      S.quemar(_v);
    } else if (r.accion === 'mojado') ctx.nota('Mojado no prende', 'Rompelo a golpes: son tres, y el que sale, sale flojo');
    else ctx.nota('Te falta una ramita', 'Juntá ramitas bajo los árboles, o rompelo a golpes');
    return true;
  }
  const avisoCapulloCerca = (pos) => (capulloCerca(pos) ? avisoCapullo({ ramitas: ctx.cuanto('ramita'), lluvia: api.clima().lluvia }) : null);
  function golpearCapulloCerca(js, alcance) {
    const fx = -Math.sin(js.yaw), fz = -Math.cos(js.yaw);
    for (const c of D().capullos || []) {
      const dx = c.x - js.pos.x, dz = c.z - js.pos.z, l = Math.hypot(dx, dz) || 1;
      if (l - 0.55 > alcance || (dx * fx + dz * fz) / l < 0.45 || quemandoCapullo.has(c)) continue;
      _v.set(c.x, T.altura(c.x, c.z) + 0.7, c.z);
      efectos.sangre?.(_v, 5);
      S.golpe(_v, 'rastreador');
      if (golpearCapullo(c)) {
        D().capullos = D().capullos.filter((x) => x !== c);
        const a = aparecerEn('rastreador', c.x, c.z);
        if (a) { a.vida = a.vidaMax = Math.max(1, Math.round(a.vidaMax * 0.5)); a.enredadoT = 1.2; }
        S.capullo(_v);
        sincronizarCapullos();
        ctx.nota('Rompiste el nido de hongos', 'El que estaba adentro salió flojo: terminalo');
        ctx.guardar();
      }
      return true;
    }
    return false;
  }
  function actualizarCapullos(dt) {
    const lista = D().capullos || [];
    if (!lista.length) return;
    tCapullos += dt;
    // 3.8.0: los hongos de luz del nido laten despacio (el brillo de sus halos)
    for (const m of mallasCapullo) if (m?.visible) m.children[0].userData.brilloHalos = 0.75 + Math.sin(tCapullos * 2.4) * 0.25;
    for (let i = lista.length - 1; i >= 0; i--) {
      const c = lista[i], t = quemandoCapullo.get(c);
      if (t === undefined) continue;
      const r = t - dt;
      mallasCapullo[i]?.scale.setScalar(Math.max(0.1, r / CAPULLOS.quemar));
      if (Math.random() < dt * 8) { _v.set(c.x, T.altura(c.x, c.z) + 0.6, c.z); efectos.fuego(_v, 0.8); }
      if (r > 0) { quemandoCapullo.set(c, r); continue; }
      quemandoCapullo.delete(c);
      lista.splice(i, 1);
      sincronizarCapullos();
      ctx.sumarMaterial('cristal', 1);
      ctx.nota('Quemaste un nido de hongos', lista.length ? `Quedan ${lista.length} en el bosque · +1 semilla dorada` : 'No queda ninguno · +1 semilla dorada');
      ctx.guardar();
    }
  }

  // ---------------- la trochita varada (ver `desafio-varada.js`)
  let varadaForzada = false;   // para las pruebas: la próxima noche se vara el tren
  const trenDelDesafio = () => ctx.tren?.() || null;
  const blancoVaradaCache = { x: 0, z: 0, radio: VARADA.golpe };
  function blancoVarada() {
    const v = D().varada, tr = trenDelDesafio();
    if (!v || v.llego || v.roto || !tr) return null;
    const p = tr.enVia(v.s);
    blancoVaradaCache.x = p.x; blancoVaradaCache.z = p.z;
    return blancoVaradaCache;
  }
  function empezarVarada() {
    const tr = trenDelDesafio(), d = D();
    if (!tr?.estacion || !tr.varar) return false;
    const { s, falta } = puntoDeVarada(tr.largo, tr.estacion.s, azarNoche('varada-lugar', d.oleadas + 1));
    d.varada = varadaNueva(s, falta);
    tr.varar(s);
    return true;
  }
  function romperVarada() {
    const d = D(), v = d.varada;
    if (!v || v.roto) return;
    v.roto = true;
    d.rescates.enojados.guarda = progreso().dia + VARADA.diasEnojo;
    const p = blancoVaradaCache;
    _v.set(p.x, T.altura(p.x, p.z) + 1.4, p.z);
    efectos.polvo(_v, 20);
    S.derrumbe(_v);
    ctx.nota('Rompieron la trochita', 'Elsa no va a querer hablarte por unos días, y el tren queda parado hasta que amanezca', true);
  }
  function actualizarVarada(dt, js) {
    const d = D(), v = d.varada, tr = trenDelDesafio();
    if (!v || !tr?.varar) return;
    if (v.llego) return;
    if (!tr.est.varado) tr.varar(v.s);          // se cargó la partida en medio de la escolta
    if (v.roto) return;
    const p = tr.enVia(v.s);
    const avance = avanzarVarada(v, dt, Math.hypot(p.x - js.pos.x, p.z - js.pos.z), tr.largo);
    tr.est.s = v.s;
    tr.est.velVarado = dt > 0 ? avance / dt : 0;
    if (!v.llego) return;
    tr.soltar(35);
    const premio = premioVarada(d.oleadas);
    for (const [k, n] of Object.entries(premio)) ctx.sumarMaterial(k, n);
    sonido.silbato?.(p);
    ctx.nota('La trochita llegó a la estación', `Elsa te agradece: +${premio.cristal} semillas doradas, +${premio.tabla} tablas, +${premio.piedra} piedras`, true);
    ctx.guardar();
  }
  // al amanecer (o si caíste): el tren sigue, llegue o no
  function cerrarVarada(avisar) {
    const d = D(), v = d.varada, tr = trenDelDesafio();
    if (!v) return;
    d.varada = null;
    if (!v.llego) tr?.soltar?.(0);
    if (avisar && !v.llego && !v.roto) ctx.nota('La trochita siguió sola con la luz', 'Elsa esperó a que amaneciera. Esta vez no llegó con vos');
  }

  // ---------------- la zanja de fuego (ver `desafio-zanja.js`)
  let zanjas = [];
  const zanjaSaneada = new WeakSet();
  function datosZanja(o) {
    if (!zanjaSaneada.has(o.datos)) { o.datos.zanja = sanearZanja(o.datos.zanja); zanjaSaneada.add(o.datos); }
    return o.datos.zanja;
  }
  const lineaZanja = (o) => ({ x: o.datos.x, z: o.datos.z, rot: o.datos.rot || 0, largo: o.plano.defensa?.largo || ZANJA.largo });
  function zanjaCerca(pos, radio = 2.4) {
    let mejor = null, d0 = radio;
    for (const o of zanjas) {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  // 2.5: fuego que llega de lejos (flecha incendiaria, granada)
  function prenderCerca(pos, radio) {
    defensas.estallarCerca?.(pos, radio);
    const o = zanjaCerca(pos, radio + 1);
    if (!o) return;
    const z = datosZanja(o);
    if (z.lena < ZANJA.lena || z.ardiendo > 0) return;
    const r = usarZanja(z, { troncos: 0, lluvia: api.clima().lluvia });
    if (r.accion !== 'prender') return;
    _v.set(o.datos.x, T.altura(o.datos.x, o.datos.z) + 0.3, o.datos.z);
    S.zanja(_v);
    efectos.fuego(_v, 1.6);
    ctx.nota('¡La flecha prendió la zanja!', 'Un minuto de fuego');
  }
  function usarZanjaCerca(pos) {
    const o = zanjaCerca(pos);
    if (!o) return false;
    const z = datosZanja(o);
    const r = usarZanja(z, { troncos: ctx.cuanto('tronco'), lluvia: api.clima().lluvia });
    if (r.accion === 'cargar') {
      ctx.gastar('tronco', r.troncos);
      ctx.nota(r.lista ? 'La zanja está cargada' : 'Echaste leña en la zanja', r.lista ? 'Prendela con E cuando lleguen: arde un minuto' : `Falta ${ZANJA.lena - z.lena} tronco`);
    } else if (r.accion === 'prender') {
      _v.set(o.datos.x, T.altura(o.datos.x, o.datos.z) + 0.3, o.datos.z);
      S.zanja(_v);
      efectos.fuego(_v, 1.6);
      ctx.nota('¡La zanja arde!', 'Un minuto de fuego. Con viento, cuidado con el pasto');
    } else if (r.accion === 'mojada') ctx.nota('Con esta lluvia no prende', 'La leña queda en la zanja: prendela cuando afloje');
    else if (r.accion === 'sinLena') ctx.nota('Faltan troncos', `La zanja se carga con ${ZANJA.lena} troncos`);
    else if (r.accion === 'ardiendo') ctx.nota('La zanja ya arde', `Quedan ${r.queda} segundos`);
    return true;
  }
  const avisoZanjaCerca = (pos) => { const o = zanjaCerca(pos); return o ? avisoZanja(datosZanja(o), { troncos: ctx.cuanto('tronco'), lluvia: api.clima().lluvia }) : null; };
  const focos = [];
  let lucesZanja = null, tEscape = 0, tQuema = 0, avisoEscape = -1;
  function lucesDeZanja() {
    if (lucesZanja) return lucesZanja;
    // 2.7.4: ver luces.js
    lucesZanja = [0, 1].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 14, 1.6); l.position.set(0, -500, 0); escena.add(l); return registrarLuz(l); });
    return lucesZanja;
  }
  const quemable = (a) => !(a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.estado === 'bajoTierra' || a.estado === 'dormido')
    && a.m.g.position.y - T.altura(a.m.g.position.x, a.m.g.position.z) < 2;
  function actualizarZanjas(dt, js) {
    // 2.6.1: sin zanjas ni fuego suelto no hay nada que hacer (y el filter pedía memoria en cada cuadro)
    if (!zanjas.length && !focos.length) { if (lucesZanja) for (const l of lucesZanja) l.intensity = 0; return; }
    const clima = api.clima();
    const ardiendo = zanjas.filter((o) => (o.datos.zanja?.ardiendo || 0) > 0);
    if (!ardiendo.length && !focos.length) { if (lucesZanja) for (const l of lucesZanja) l.intensity = 0; return; }
    const luces = lucesDeZanja();
    for (const l of luces) l.intensity = 0;
    tQuema += dt;
    const quema = tQuema >= 0.5;
    if (quema) tQuema = 0;
    const suelo = js.pos.y;   // los pies del jugador
    ardiendo.forEach((o, i) => {
      const z = o.datos.zanja, geo = lineaZanja(o), y = T.altura(geo.x, geo.z);
      if (i < luces.length) { luces[i].position.set(geo.x, y + 1.2, geo.z); luces[i].intensity = 2.4 + Math.sin(performance.now() / 90 + i) * 0.4; }
      if (Math.random() < dt * 14) {
        const t = (Math.random() - 0.5) * geo.largo;
        _v.set(geo.x + Math.cos(geo.rot) * t, y + 0.2, geo.z - Math.sin(geo.rot) * t);
        efectos.fuego(_v, 1.1);
      }
      if (quema) {
        for (const a of aliens) {
          if (!quemable(a) || !enElFuego(a.m.g.position, geo)) continue;
          herirAlien(a, ZANJA.dano * 0.5, a.m.g.position, 'zanja');
          if (!a.def.pesado) a.frenoT = Math.max(a.frenoT || 0, 0.8);
        }
        if (enElFuego(js.pos, geo) && Math.abs(suelo - y) < 1.2) herirJugador(ZANJA.dano * 0.3, { x: geo.x, y, z: geo.z });
      }
      if (consumir(z, dt, clima.lluvia)) ctx.nota('La zanja se apagó', 'Cargala de nuevo con dos troncos');
    });
    // el fuego que se escapa al pasto con el viento
    tEscape += dt;
    if (tEscape >= ESCAPE.cada) {
      tEscape = 0;
      const fuentes = [
        ...ardiendo.map((o) => { const g = lineaZanja(o), t = (Math.random() - 0.5) * g.largo; return { x: g.x + Math.cos(g.rot) * t, z: g.z - Math.sin(g.rot) * t }; }),
        ...focos.filter((f) => f.edad > 4 && f.edad < 12),
      ];
      if (fuentes.length && focos.length < ESCAPE.max && seEscapa(clima.viento || 0, clima.lluvia)) {
        const p = saltoDelFuego(fuentes[Math.floor(Math.random() * fuentes.length)]);
        if (!T.agua(p.x, p.z)) {
          focos.push({ x: p.x, z: p.z, edad: 0 });
          if (avisoEscape !== D().oleadas) { avisoEscape = D().oleadas; ctx.nota('¡El fuego se escapó al pasto!', 'Con viento se corre: alejate y cuidá la madera de las defensas', true); }
        }
      }
    }
    for (let i = focos.length - 1; i >= 0; i--) {
      const f = focos[i];
      f.edad += dt;
      const r = radioFoco(f.edad);
      if (r <= 0) { focos.splice(i, 1); continue; }
      const y = T.altura(f.x, f.z);
      if (Math.random() < dt * 10 * r) { _v.set(f.x + (Math.random() - 0.5) * r, y + 0.15, f.z + (Math.random() - 0.5) * r); efectos.fuego(_v, 0.7 + r * 0.3); }
      if (!quema) continue;
      for (const a of aliens) {
        if (quemable(a) && Math.hypot(a.m.g.position.x - f.x, a.m.g.position.z - f.z) < r + a.def.radio) herirAlien(a, ESCAPE.dano * 0.5, a.m.g.position, 'zanja');
      }
      if (Math.hypot(js.pos.x - f.x, js.pos.z - f.z) < r + 0.3 && Math.abs(suelo - y) < 1.2) herirJugador(ESCAPE.dano * 0.5, { x: f.x, y, z: f.z });
      _v.set(f.x, y, f.z);
      for (const o of obras.obrasCerca(_v, r + 1.5, [])) if (completa(o) && !esPiedra(o) && Number.isFinite(o.datos.vida)) danarObra(o, ESCAPE.danoObra * 0.5);
    }
  }

  // ---------------- tutorial del primer día
  const tutorialEl = document.getElementById('tutorial');
  let acumTutorial = 9, indiceDibujado = -1;
  function estadoTutorial() {
    const p = progreso(), d = D(), cuenta = {};
    for (const o of obras.obras) if (o.datos.etapas > 0) cuenta[o.plano.id] = (cuenta[o.plano.id] || 0) + 1;
    return { tronco: p.materiales?.tronco || 0, tabla: p.materiales?.tabla || 0, lanza: !!p.cosas?.lanza, defensas: contarDefensas(), cuenta, oleadas: d.oleadas };
  }
  function actualizarTutorial(dt) {
    const d = D();
    const visible = d.tutorial < PASOS_TUTORIAL.length && d.oleadas <= 1 && !(d.oleadas === 1 && d.oleadaTerminada);
    tutorialEl?.classList.toggle('oculto', !visible);
    if (!visible) return;
    acumTutorial += dt;
    if (acumTutorial < 0.8) return;
    acumTutorial = 0;
    const r = avanzarTutorial(d.tutorial, estadoTutorial());
    if (r.hechos.length) {
      d.tutorial = r.indice;
      sonido.anotar?.();
      if (r.terminado) {
        d.emplastos += PREMIO_TUTORIAL.emplastos;
        ctx.sumarMaterial('tabla', PREMIO_TUTORIAL.tabla); ctx.sumarMaterial('piedra', PREMIO_TUTORIAL.piedra);
        ctx.nota('Preparación completa', `Estás listo para la primera noche · +1 emplasto, +${PREMIO_TUTORIAL.tabla} tablas, +${PREMIO_TUTORIAL.piedra} piedras`, true);
        ctx.guardar();
      }
    }
    if (indiceDibujado !== d.tutorial) { indiceDibujado = d.tutorial; dibujarTutorial(tutorialEl, d.tutorial); }
  }

  // ---------------- noches especiales: el cielo cambia
  const veloEl = document.getElementById('velo-especial');
  function actualizarVelo() {
    // la especial se decide una hora antes del ataque y se borra al amanecer
    const clase = D().especial || '';
    if (veloEl && veloEl.dataset.especial !== clase) { veloEl.dataset.especial = clase; veloEl.className = `velo-especial ${clase}`; }
  }

  // ---------------- música de tensión
  function faseMusical() {
    const p = progreso(), d = D();
    if (naveMundo.adentro) return 'ataque';   // 3.0
    if (d.oleadaNoche === claveNoche(p.dia, p.horas) && !d.oleadaTerminada && esHoraDeAtaque(p.horas)) return vivos() > 0 || eventos.nodrizaActiva ? 'ataque' : 'calma';
    if (p.horas >= HORA_ATAQUE - 1 && p.horas < HORA_ATAQUE) return 'previa';
    return 'calma';
  }
  const estadoMusica = { activo: true, fase: 'calma', tension: 0, especial: null };
  function tensionActual(js) {
    let cerca = 99;
    for (const a of aliens) {
      if (a.estado === 'morir' || a.estado === 'irse') continue;
      cerca = Math.min(cerca, Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z));
    }
    return Math.min(1, vivos() / 10 + (cerca < 25 ? (25 - cerca) / 25 * 0.55 : 0) + (eventos.nodrizaActiva ? 0.35 : 0));
  }

  let primerCuadro = true, acumLogros = 0, climaActual = efectoClima();
  const climaVisto = { lluvia: undefined, nublado: undefined, invierno: undefined };
  const _rep = { x: 0, z: 0 };
  function actualizar(dt, mundo) {
    if (primerCuadro) {
      primerCuadro = false;
      for (const a of precalentados) soltarAlien(a);
      refrescarDefensas();
      defensas.refrescar();
      fortin.refrescar();
      aliados.restaurar();
      cimientos.sincronizar(obras.obras);
      sincronizarCapullos();   // 2.3: los capullos que quedaron de la partida guardada
      devolverTodo(false);   // 3.8.0: si se guardó con algo robado, vuelve a tus cosas
      // 3.5.1: si se cerró el juego mientras la nave caía (derribar ya guardó el asedio
      // ganado, la victoria llega al tocar el suelo), la victoria se perdía para siempre:
      // sin noche final ni nido, la campaña no terminaba nunca. Se da al abrir.
      if (D().asedio?.ganado && !D().victoria) vencer({ nave: true });
    }
    // las piedras siguen a las obras: si se cae una empalizada, se va su cimiento
    relojCimientos -= dt;
    if (relojCimientos <= 0) { relojCimientos = 2; cimientos.sincronizar(obras.obras); }
    const dtReal = mundo.dtReal ?? dt;
    camaraLenta = Math.max(0, camaraLenta - dtReal);
    invulnerable = Math.max(0, invulnerable - dt);
    recargaEsquiva = Math.max(0, recargaEsquiva - dt);
    const js = ctx.jugador().estado;
    nocheNivel = Math.max(0, Math.min(1, mundo.noche ?? 0));
    // 2.0: hacia dónde mirás y con qué luz, una vez por cuadro para todos los invasores
    camara.getWorldDirection(dirCamara);
    miraJugador.set(dirCamara.x, 0, dirCamara.z);
    const L = ctx.linterna?.();
    luzJugador.encendida = !!L?.encendida; luzJugador.angulo = L?.angulo ?? 0.42; luzJugador.alcance = L?.alcance ?? 42;
    tAdentro -= dtReal;
    if (tAdentro <= 0) { tAdentro = 0.3; adentroJugador = !!obras.dentro?.(js.pos); }
    // 2.0: la noche sin luces: las antorchas se apagan de a una
    const dEsp = D();
    if (dEsp.especial === 'apagon' && vivos() > 0 && nocheNivel > 0.5) {
      tApagon -= dt;
      if (tApagon <= 0) {
        const prendidas = defensas.prendidas;
        tApagon = Math.min(60, esperaApagon(prendidas.length));
        if (prendidas.length) {
          defensas.titilarYApagar(prendidas[Math.floor(Math.random() * prendidas.length)]);
          if (avisoApagon !== dEsp.oleadas) { avisoApagon = dEsp.oleadas; ctx.nota('Se apagan las luces', 'Algo las ahoga sin que se vea. Prendelas de nuevo con F'); }
        }
      }
    } else tApagon = 8;
    avisarBestiario(dtReal);
    levantarTirados(js);   // 3.8.0: lo que soltó un duende al escaparse
    coroDelValle(dt, js);
    const c = api.clima();
    // 2.6.1: el efecto del clima se recalcula sólo cuando el clima cambia
    if (c.lluvia !== climaVisto.lluvia || c.nublado !== climaVisto.nublado || c.invierno !== climaVisto.invierno) {
      climaVisto.lluvia = c.lluvia; climaVisto.nublado = c.nublado; climaVisto.invierno = c.invierno;
      climaActual = efectoClima(climaVisto);
    }
    recarga = Math.max(0, recarga - dt);
    if (!caido && !naveMundo.adentro) revisarHorario();   // 3.5.1: con el día de reloj real la hora corre adentro: la noche no arranca con vos arriba
    actualizarNave(dt);
    actualizarDefensas(dt);
    defensas.actualizar(dt, js, mundo.noche);
    for (let i = aliens.length - 1; i >= 0; i--) {
      if (actualizarAlien(aliens[i], dt, js, mundo.noche > 0.5) === 'fuera') { soltarAlien(aliens[i]); aliens.splice(i, 1); }
    }
    desgastarLugar(dt);
    // 2.3: los capullos, la trochita varada y las zanjas de fuego
    actualizarCapullos(dt);
    actualizarVarada(dt, js);
    actualizarZanjas(dt, js);
    puestos.actualizar(dt, js);   // 3.0
    // los invasores no se enciman entre ellos
    // 2.7.3: mismos pares y en el mismo orden (cada empujón mueve a los que siguen), pero el
    // par que está lejos en x o en z se descarta antes de la raíz: hypot nunca da menos que
    // el mayor de |dx| y |dz|, así que ese par tampoco se empujaba antes.
    for (let i = 0; i < aliens.length; i++) {
      const a = aliens[i].m.g.position, ra = aliens[i].def.radio;
      for (let j = i + 1; j < aliens.length; j++) {
        const b = aliens[j].m.g.position;
        const r = ra + aliens[j].def.radio;
        const dx = b.x - a.x, dz = b.z - a.z;
        if (dx >= r || dx <= -r || dz >= r || dz <= -r) continue;
        const d = Math.hypot(dx, dz);
        if (d > 0.001 && d < r) { const k = (r - d) / d * 0.5; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; empujados.add(aliens[i]); empujados.add(aliens[j]); }
      }
    }
    // 3.5.1: el empujón no revisaba obras: el montón que llega a una empalizada metía a los de
    // adelante (rompiendo, quietos) a través de la pared. Los empujados que andan por el suelo
    // vuelven a chocar con las obras, como al caminar.
    if (empujados.size) {
      for (const al of empujados) {
        if (al.def.vuela || al.enNave || (al.estado !== 'avanzar' && al.estado !== 'romper')) continue;
        col.resolver(al.m.g.position, al.def.radio * al.m.esc, al.def.altura * al.m.esc);
      }
      empujados.clear();
    }
    actualizarProyectiles(dt, js);
    arsenal.actualizar(dt, js);
    fortin.actualizar(dt, js, nocheNivel);
    actualizarCristales(dt, js);
    actualizarCaja(dt, js);
    mapaMundo.actualizar(dt, js);   // 3.0
    actualizarLectura(dt);
    revisarCapsula(js);
    eventos.actualizar(dt, js);
    asedioMundo.actualizar(dt, js);   // 3.0
    naveMundo.actualizar(dt, js);
    aliados.actualizarCompaneros(dt, vivos() > 0);
    aliados.actualizarPerro(dt, js, ctx.perroPos?.());
    efectos.actualizar(dt, naveMundo.adentro ? naveMundo.pisoT : T);   // 3.0: adentro, el piso es el de la nave
    rayo.material.opacity = Math.max(0, rayo.material.opacity - dt * 7);
    // salud: se recupera sola despacio si pasa un rato sin golpes
    const d = D();
    sinDano += dt;
    if (!caido && sinDano > 7 && d.salud < SALUD_MAX) d.salud = Math.min(SALUD_MAX, d.salud + dt * 1.6);
    destello = Math.max(0, destello - dt * 1.4);
    if (danoEl) danoEl.style.opacity = String(Math.min(0.85, destello + (d.salud < 30 ? 0.18 + Math.sin(performance.now() / 260) * 0.08 : 0)));
    estadoMusica.activo = !caido;
    estadoMusica.fase = faseMusical();
    estadoMusica.tension = tensionActual(js);
    estadoMusica.especial = d.especial;
    musica.actualizar(dtReal, estadoMusica);
    actualizarTutorial(dtReal);
    actualizarVelo();
    // logros que dependen del estado acumulado (se revisan de a ratos)
    acumLogros += dtReal;
    if (acumLogros > 4) { acumLogros = 0; anunciarLogros(evaluarEstado(totalLogros())); }
    actualizarHud(dt);
  }

  function hayAtaque() { return vivos() > 0 || eventos.nodrizaActiva || naveMundo.adentro; }   // 3.0: adentro de la nave tampoco se duerme
  // 2.6: para el fortín, "de noche" es de noche o con invasores a la vista
  const deNoche = () => nocheNivel > 0.5 || vivos() > 0;
  function puedeDormir() {
    const p = progreso(), d = D();
    if (hayAtaque()) return { ok: false, motivo: eventos.nodrizaActiva ? 'El Coihue Viejo sigue en pie' : 'Hay duendes cerca: no es momento de dormir' };
    if (p.horas >= HORA_ATAQUE - 1 && p.horas < HORA_ATAQUE) return { ok: false, motivo: 'Están por salir los duendes. Preparate' };
    if (esHoraDeAtaque(p.horas) && d.oleadaNoche !== claveNoche(p.dia, p.horas)) return { ok: false, motivo: 'Los duendes todavía no salieron esta noche' };
    return { ok: true };
  }
  function limpiar() {
    // 3.8.1: al caer (o al terminar la corrida) lo robado y lo tirado vuelve antes de soltar a los
    // duendes: antes el atadito seguía brillando en el suelo de día y lo robado esperaba otra noche
    devolverTodo(false);
    for (const a of aliens) soltarAlien(a);
    aliens.length = 0;
    estadoNave.porBajar.length = 0;
    nave.g.visible = false; estadoNave.fase = 'fuera'; luzNave.intensity = 0;
    for (let i = proyectiles.length - 1; i >= 0; i--) retirarProyectil(i);
    arsenal.limpiar();
    fortin.limpiar();
    puestos.limpiar();   // 3.0
    tensandoDesde = null;
    eventos.retirarNodriza();
    efectos.limpiar();
    musica.detener();
    naveMundo.limpiar();   // 3.0
    bloqueando = false;
  }
  hud?.classList.remove('oculto');

  return {
    actualizar, atacar, atacarAlterno, bloquear, esquivar,
    // 2.5: el arsenal
    puedeBloquear, tensar, soltarTension, cancelarTension, cambiarFlecha, dispararVirote, cambioDeArma,
    get tensando() { return tensandoDesde !== null; },
    get arsenal() { return arsenal; }, usarEmplasto, fabricar, abrirTaller, cambiarCategoriaTaller,
    levantarse, limpiar, puedeDormir, hayAtaque, curar,
    get tallerAbierto() { return tallerAbierto; },
    get recarga() { return recarga; },
    get caido() { return caido; },
    get bloqueando() { return bloqueando; },
    // la cámara lenta del último invasor: el bucle principal escala su dt con esto
    get escalaTiempo() { return camaraLenta > 0 ? 0.3 + (1 - Math.min(1, camaraLenta / 1.4)) * 0.2 : 1; },
    capsula, aliens, obraEnPunto, danarObra, herirJugador, invocar, nave: nave.g,
    estadoDuendes,   // 3.8.0: los modelos de los duendes y cuántos se dibujan (pruebas y diagnóstico)
    get robosEnCurso() { return { tirados: tirados.filter((t) => t.activo).length, llevando: aliens.filter((x) => x.robo).length, robados: { ...(D().robados || {}) } }; },
    intentarRobo: (a) => intentarRobo(a), soltarRobo: (a, alcanzado) => soltarRobo(a, alcanzado), herirDuende: (a, dano, fuente) => herirAlien(a, dano, null, fuente),
    // los relojes del coro del valle, para poder mirarlos desde las pruebas
    coro,
    posicionesAliens: () => aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').map((a) => a.m.g.position),
    get caja() { return D().caja; },
    get restos() { return D().restos; },
    // Para el mapa: el nido marcado si ya lo ubicaste, o el cerco mientras lo buscás.
    get nido() {
      const n = D().nido;
      if (!n || n.caido) return null;
      const cerco = cercoDeBusqueda(n);
      return cerco
        ? { x: cerco.x, z: cerco.z, radio: cerco.radio, revelado: false, caido: false }
        : { x: n.x, z: n.z, revelado: true, caido: false };
    },
    objetivoPerro: (js, perroPos) => aliados.objetivoPerro(js, perroPos),
    // 2.0
    alertaPerro: () => aliados.alertaPerro,
    get bestiario() { return D().bestiario || {}; },
    get despues() { return D().despues; },
    empezarDespues: () => {
      const d = D();
      if (!d.nido?.caido || d.despues) return false;
      d.despues = { activo: true, noches: 0, terminado: false };
      d.oleadaTerminada = true;
      ctx.nota('Las noches después', `Algo sobrevivió a la cueva. ${NOCHES_DESPUES} noches más: vienen cambiados`, true);
      ctx.guardar();
      return true;
    },
    ultimosOidos,
    anotarEnBestiario,
    // 2.1
    get rescate() { return D().rescate; },
    enojado: (vecino) => sigueEnojado(D().rescates?.enojados, vecino, progreso().dia),
    forzarRescate: (lugar) => { rescateForzado = RESCATES[lugar] ? lugar : null; },
    hayLosa,
    aplicarForja,
    tirarRoca,
    ordenar: (clave) => aliados.ordenar(clave),
    ordenDe: (clave) => aliados.ordenDe(clave),
    encenderAntorchaCerca: (pos) => defensas.encenderCerca(pos),
    antorchaApagadaCerca: (pos) => !!defensas.apagadaCerca?.(pos),
    // 2.3: capullos, trochita varada, zanjas de fuego y código de partida
    get capullos() { return D().capullos || []; },
    sembrarCapullos, abrirCapullos, usarCapulloCerca, sincronizarCapullos, avisoCapulloCerca, capulloCerca,
    get varada() { return D().varada; },
    forzarVarada: () => { varadaForzada = true; },
    usarZanjaCerca, avisoZanjaCerca, zanjaCerca,
    get focos() { return focos; },
    get semilla() { return D().semilla; },
    // 2.6: el fortín también se usa con E (resina, catapulta, troncos, puente, lazo...)
    usarCercaDe: (pos, dPuerta) => naveMundo.usarCerca(pos) || asedioMundo.usarCerca(pos) || usarCapulloCerca(pos) || usarZanjaCerca(pos) || puestos.usarCerca(pos) || fortin.usarCerca(pos, deNoche(), dPuerta) || mapaMundo.usarCerca(pos),
    avisoCercaDe: (pos, dPuerta) => naveMundo.avisoCerca(pos) || asedioMundo.avisoCerca(pos) || avisoCapulloCerca(pos) || avisoZanjaCerca(pos) || puestos.avisoCerca(pos) || fortin.avisoCerca(pos, deNoche(), dPuerta) || mapaMundo.avisoCerca(pos),
    // 3.0: la supervivencia sin fin y el mapa de la semilla (la base, los lugares, lo que se marca)
    get sinFin() { return D().sinFin; },
    mapaMundo,
    get baseMapa() { return baseMapa(); },
    get sitiosMapa() { return mapaMundo.marcas(); },
    get fortin() { return fortin; },
    // 3.0: los puestos (para el mapa: los que ya viste y siguen en pie) y lo que aprendieron
    get puestos() { return puestos.vistos; },
    puestosMundo: puestos, evolucion,
    get adaptaciones() { return evolucion.texto(); },
    logros, eventos, defensas, aliados, efectos,
    get nodrizaActiva() { return eventos.nodrizaActiva; },
    // 3.0: el asedio final y la nave por dentro
    get asedio() { return asedioMundo; },
    get naveAdentro() { return naveMundo; },
    vencer,
  };
}
