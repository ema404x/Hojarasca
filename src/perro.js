// Un perro de campo que te sigue, se adelanta, olfatea y marca los animales
import * as THREE from 'three';
import { rng, lerp, clamp } from './ruido.js';
import { lam, palo, compactar, MAT_FAUNA } from './vida.js';
import { bola, torno, miembro, deformar, pintar, color, matiz, ruido3 } from './formas.js';
import { OLFATO, MARCAR_DESDE, presaParaGuiar, puntoDeGuia, pasoDeGuia } from './perro-guia.js';
import { sanearPerro, firmaPerro } from './personal-perro.js';
import { tono, desechar } from './personal-mallas.js';

// 2.8: `ap` es cómo lo elegiste en "Personalizar" (ver `personal-perro.js`): el pelaje, el
// dibujo, el collar y el pañuelo. Con lo de siempre sale el mismo perro de antes, con
// su collar.
// 3.4: un perro de campo con anatomía de perro, al estilo pintado de HushWood: el cuerpo es un
// torno con pecho hondo y la panza recogida, el cuello sale del pecho, la cabeza tiene cráneo,
// hocico que se afina, trufa, mandíbula y orejas semiparadas; las patas de adelante son
// derechas y las de atrás tienen muslo y garrón; la cola es tupida. El dibujo (pecho blanco,
// manchas, antifaz) y el pelaje (lomo más oscuro, panza más clara) se pintan en los vértices.
// Los pivotes de cabeza, patas y cola están donde estaban: las animaciones no cambian.
export function mallaPerro(ap = sanearPerro(null)) {
  const g = new THREE.Group();
  const claro = ap.pelo === '#c9b89a' || ap.pelo === '#a8804f';
  const pelo = ap.pelo, oscuro = '#1f1b17';
  // el dibujo: lo blanco del pecho, el hocico, las patas y la punta de la cola
  const blanco = new THREE.Color(claro && ap.dibujo === 'pecho' ? '#efe8da' : '#ddd4c2');
  const mancha = new THREE.Color(claro || ap.pelo === '#6b6660' ? tono(ap.pelo, 0.42) : '#d8cfbe');
  const antifaz = new THREE.Color(claro ? tono(ap.pelo, 0.45) : '#1a1613');
  const pecho = ap.dibujo === 'pecho';
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // el pelaje: lomo un poco más oscuro, panza y patas un poco más claras, y el dibujo
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 - 0.16 * Math.max(0, n.y) * suave(0.5, 0.66, p.y) + 0.1 * Math.max(0, -n.y));
    if (pecho) {
      // pecho y garganta, el hocico de abajo, las manos y la punta de la cola
      const enPecho = suave(0.1, 0.3, p.z) * (1 - suave(0.5, 0.62, p.y)) * suave(0.28, 0.36, p.y) * suave(-0.2, 0.3, -n.y + n.z);
      const enHocico = suave(0.4, 0.5, p.z) * (1 - suave(0.64, 0.68, p.y));
      const enPata = 1 - suave(0.035, 0.075, p.y);
      // (la cola sale de 0.62 de alto y 0.34 atrás, hacia arriba y atrás)
      const enCola = p.z < -0.34 ? suave(0.22, 0.28, (p.y - 0.62) * 0.6 - (p.z + 0.34) * 0.8) : 0;
      c.lerp(blanco, Math.min(1, Math.max(enPecho, enHocico, enPata, enCola)));
    } else if (ap.dibujo === 'manchado') {
      const k = ruido3(p.x * 5, p.y * 5, p.z * 4.2);
      if (p.y > 0.42 && k > 0.38) c.lerp(mancha, suave(0.38, 0.45, k));
    } else if (ap.dibujo === 'antifaz') {
      const ojos = Math.max(0, 1 - Math.hypot(Math.abs(p.x) - 0.056, (p.y - 0.722) * 1.3, p.z - 0.382) / 0.045);
      c.lerp(antifaz, Math.min(1, ojos * 1.6));
    }
  };
  const conPelaje = (m) => pintar(m, pelaje);
  // ---- el cuerpo: un torno a lo largo, acostado (el eje del torno pasa a ser el largo)
  const cuerpo = torno(pelo, [[0.0, -0.36], [0.07, -0.35], [0.118, -0.31], [0.135, -0.24], [0.13, -0.16], [0.122, -0.09], [0.135, 0.0], [0.152, 0.1], [0.157, 0.18], [0.148, 0.25], [0.12, 0.3], [0.07, 0.335], [0.0, 0.35]], [0, 0.52, 0], [Math.PI / 2, 0, 0], null, 16);
  deformar(cuerpo, (v) => {
    // en el torno: y es el largo (+ adelante) y -z es arriba
    const largo = v.y; let alto = -v.z;
    if (alto < 0) alto *= (1 + 0.28 * suave(-0.05, 0.2, largo)) * (1 - 0.3 * suave(-0.05, -0.2, largo) * (1 - suave(-0.3, -0.36, largo)));
    else alto *= 0.92 + 0.08 * suave(-0.1, -0.3, largo);
    v.x *= 1 - 0.12 * Math.max(0, 1 - Math.abs(largo + 0.12) / 0.12);
    v.z = -alto;
  });
  g.add(conPelaje(cuerpo));
  // la cruz (el cuello entra al lomo sin escalón), las paletas y los muslos
  g.add(conPelaje(bola(pelo, [0.1, 0.075, 0.13], [0, 0.6, 0.2], [0.35, 0, 0])));
  for (const l of [-1, 1]) {
    g.add(conPelaje(bola(pelo, [0.045, 0.09, 0.07], [l * 0.078, 0.51, 0.2], [0.25, 0, 0])));
    g.add(conPelaje(bola(pelo, [0.05, 0.09, 0.085], [l * 0.075, 0.51, -0.24], [-0.2, 0, 0])));
  }
  // ---- cuello y cabeza (el cuello se mueve con la cabeza al olfatear)
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.68, 0.32);
  // el cuello sale de adentro del pecho (más bajo que la cruz, así no hace joroba)
  cabeza.add(conPelaje(miembro(pelo, [[0, -0.27, -0.2], [0, -0.17, -0.11], [0, -0.06, -0.035], [0, 0.0, -0.005]], [0.078, 0.07, 0.06, 0.052], 8, 12)));
  // la cabeza: cráneo ancho, el stop y un hocico parejo hasta la trufa, de una sola pieza
  const testa = miembro(pelo, [[0, 0.02, -0.07], [0, 0.03, 0.0], [0, 0.01, 0.07], [0, -0.02, 0.13], [0, -0.032, 0.19]], [0.05, 0.078, 0.066, 0.045, 0.032], 10, 12);
  testa.scale.set(1, 0.9, 1);
  cabeza.add(conPelaje(testa));
  cabeza.add(conPelaje(bola(pelo, [0.026, 0.026, 0.03], [0, -0.031, 0.19])));
  // 3.5: cachetes más chicos y metidos (antes eran dos bollos sueltos) y la boca como una línea
  // fina en el labio, no una lámina clara que la hacía parecer un pico abierto
  for (const l of [-1, 1]) cabeza.add(conPelaje(bola(pelo, [0.028, 0.034, 0.044], [l * 0.034, -0.022, 0.07])));   // los cachetes
  cabeza.add(conPelaje(bola(pelo, [0.034, 0.017, 0.07], [0, -0.054, 0.1], [0.14, 0, 0])));         // la mandíbula
  cabeza.add(bola(oscuro, [0.022, 0.017, 0.016], [0, -0.022, 0.214]));                              // la trufa
  cabeza.add(bola(oscuro, [0.027, 0.0028, 0.04], [0, -0.046, 0.158], [0.12, 0, 0]));                 // la boca
  for (const l of [-1, 1]) {
    cabeza.add(bola('#16120f', [0.014, 0.015, 0.01], [l * 0.056, 0.042, 0.062]));                   // los ojos
    cabeza.add(conPelaje(bola(pelo, [0.022, 0.01, 0.018], [l * 0.052, 0.06, 0.058], [0, 0, -l * 0.2])));   // el arco de la ceja
    // las orejas semiparadas, con la punta apenas doblada
    // 3.5: más anchas y chatas, con la punta que se dobla hacia adelante (antes parecían cuernos)
    const oreja = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.088, 9, 3), color(pelo)), (v) => { v.z *= 0.3; if (v.y > 0.0) v.z += v.y * v.y * 9; });
    oreja.position.set(l * 0.056, 0.088, -0.035); oreja.rotation.set(-0.12, l * 0.25, -l * 0.55);
    cabeza.add(conPelaje(oreja));
  }
  // 2.8: el collar con su chapita, justo abajo de la cabeza; y el pañuelo atado al cuello
  if (ap.conCollar) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 6, 18), color(ap.collar));
    collar.position.set(0, -0.097, -0.041);
    collar.rotation.x = 0.7 - Math.PI / 2;
    cabeza.add(collar);
    cabeza.add(bola('#c9a64a', [0.016, 0.02, 0.006], [0, -0.152, 0.024]));
  }
  if (ap.conBandana) {
    const panuelo = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), color(ap.bandana));
    panuelo.position.set(0, -0.18, 0.03);
    panuelo.rotation.x = Math.PI + 0.45;
    panuelo.scale.set(1, 1, 0.35);
    cabeza.add(panuelo);
  }
  // 3.5: el pivote de la cabeza baja a la base del cuello, adentro del pecho: al olfatear o
  // mirar se mueve todo el cuello y la raíz nunca asoma por el lomo (antes giraba sólo la
  // cabeza arriba y la base del cuello salía por la cruz, con escalón). Mismo lugar en reposo.
  const BASE = new THREE.Vector3(0, 0.5, 0.2), OFF = new THREE.Vector3().subVectors(cabeza.position, BASE);
  for (const c of cabeza.children) c.position.add(OFF);
  cabeza.position.copy(BASE);
  g.add(cabeza);
  // ---- patas: las de adelante derechas (codo, muñeca, mano); las de atrás con muslo,
  // pierna hacia atrás, garrón y pie. Cuelgan del mismo pivote de siempre.
  const patas = [];
  for (const [px, pz] of [[-0.09, 0.22], [0.09, 0.22], [-0.1, -0.2], [0.1, -0.2]]) {
    const piv = new THREE.Group(); piv.position.set(px, 0.42, pz);
    if (pz > 0) {
      piv.add(conPelaje(miembro(pelo, [[0, 0.07, -0.012], [0, -0.07, -0.008], [0, -0.2, 0.0], [0, -0.3, 0.008], [0, -0.385, 0.024]], [0.05, 0.042, 0.031, 0.027, 0.025], 10, 10)));
    } else {
      piv.add(conPelaje(miembro(pelo, [[0, 0.07, 0.005], [0, -0.06, 0.012], [0, -0.16, -0.035], [0, -0.24, -0.072], [0, -0.31, -0.048], [0, -0.385, -0.012]], [0.062, 0.056, 0.038, 0.028, 0.026, 0.025], 12, 10)));
    }
    piv.add(conPelaje(bola(pelo, [0.034, 0.024, 0.046], [0, -0.395, pz > 0 ? 0.03 : -0.005])));     // la mano (o el pie)
    g.add(piv); patas.push(piv);
  }
  // ---- la cola, tupida y caída hacia atrás
  const cola = new THREE.Group(); cola.position.set(0, 0.62, -0.34);
  cola.add(conPelaje(deformar(torno(pelo, [[0.0, -0.01], [0.028, 0.0], [0.036, 0.06], [0.044, 0.15], [0.042, 0.23], [0.03, 0.29], [0.0, 0.32]], null, [-0.93, 0, 0], null, 10),
    (v) => { v.z += 0.35 * v.y * v.y; })));
  g.add(cola);
  compactar(g, { alto: 0.7, pie: 0.86, panza: 0.08, todo: true });
  // 2.8: el palito que te trae (si le enseñaste): atravesado en la boca, escondido
  const palito = palo(lam('#7a5f43'), 0.012, 0.3, [0, 0.135, 0.27], [0, 0, Math.PI / 2]);   // (0, -0.045, 0.15) desde la cabeza
  palito.name = 'palito';
  palito.visible = false;
  cabeza.add(palito);
  return { g, cabeza, patas, cola, palito };
}

export function crearPerro(T, escena, col, sonido, registrar, progreso) {
  const r = rng(777);
  // 2.8: el perro sale como lo dejaste en "Personalizar"
  let apariencia = sanearPerro(progreso?.personal?.perro);
  const m = mallaPerro(apariencia);
  m.g.rotation.order = 'YXZ';   // 2.8: para sentarse, el cuerpo se inclina sobre su propio eje
  const base = T.lugares.refugio;
  const inicio = { x: base.puerta.x + 1.6, z: base.puerta.z + 1.2 };
  m.g.position.set(inicio.x, T.altura(inicio.x, inicio.z), inicio.z);
  escena.add(m.g);

  const est = {
    pos: m.g.position, rumbo: 0, rumboObjetivo: 0, vel: 0, paso: 0, fase: r() * 6,
    estado: 'seguir', t: 0, ladrido: 6, olfateo: 0, objetivo: new THREE.Vector3(), marcando: null, aviso: 0,
  };
  const tmp = new THREE.Vector3();
  // 2.6.1: destino de seguir/esperar reusado (antes, un objeto nuevo por cuadro)
  const destinoTmp = { x: 0, z: 0 };
  let presaCache = null, acumuladoScan = 99, guiaCache = null;
  const candidatosScan = [];

  const caminable = (x, z) => !T.agua(x, z) && Math.abs(x) < 470 && Math.abs(z) < 470;

  function puntoCerca(js, dist, angulo) {
    for (let i = 0; i < 12; i++) {
      const a = js.yaw + Math.PI + angulo + (r() - 0.5) * 1.4;
      const d = dist * (0.7 + r() * 0.6);
      const x = js.pos.x - Math.sin(a) * d, z = js.pos.z - Math.cos(a) * d;
      if (caminable(x, z)) return { x, z };
    }
    return { x: js.pos.x, z: js.pos.z };
  }

  function actualizar(dt, jugador, camara, mundo, sujetos) {
    const js = jugador.estado;
    const d = Math.hypot(est.pos.x - js.pos.x, est.pos.z - js.pos.z);
    m.g.visible = true;

    // si te fuiste muy lejos (o te subiste a algo), te alcanza
    if (d > 45 || js.enKayak || js.enTren) {
      const p = puntoCerca(js, 4, 0);
      est.pos.set(p.x, T.altura(p.x, p.z), p.z);
      est.vel = 0;
      m.g.visible = !js.enKayak && !js.enTren;
      if (js.enKayak || js.enTren) return null;
    }

    est.t -= dt;
    est.ladrido -= dt;

    // Marcar fauna es una decisión de baja frecuencia; el movimiento del perro
    // sigue a dt completo, pero este scan no necesita ejecutarse por cuadro.
    // 2.0: en el Relax el perro huele más lejos, y lo que busca primero es lo que
    // todavía no anotaste. Si lo encuentra, te lleva (ver `perro-guia.js`).
    acumuladoScan += dt;
    if (acumuladoScan >= 0.12) {
      acumuladoScan = 0;
      presaCache = null;
      const alcance = mundo?.guiar ? OLFATO : 26;
      const candidatos = sujetos?.consultar
        ? sujetos.consultar(est.pos.x, est.pos.z, alcance, candidatosScan)
        : sujetos;
      guiaCache = mundo?.guiar ? presaParaGuiar(candidatos, est.pos, progreso.entradas, mundo.existe) : null;
      if (candidatos && candidatos.length) {
        let mejor2 = 26 * 26;
        for (const s of candidatos) {
          const dxs = s.pos.x - est.pos.x, dzs = s.pos.z - est.pos.z;
          const ds2 = dxs * dxs + dzs * dzs;
          if (ds2 < mejor2 && ds2 > 9) { mejor2 = ds2; presaCache = s; }
        }
      }
    }
    // 2.8: avisar de noche (si se lo enseñaste): si anda algo cerca, se para, lo mira y
    // ladra una vez. Después espera un buen rato antes de volver a avisar.
    est.avisoNoche = Math.max(0, (est.avisoNoche || 0) - dt);
    if (apariencia.trucos.avisar && (mundo?.noche || 0) > 0.5 && presaCache && !mundo?.ataque && !mundo?.alerta && !mundo?.rastro
      && est.avisoNoche <= 0 && est.estado !== 'marcar' && d < 30) {
      sonido.ladrido(est.pos);
      est.avisoNoche = 25 + r() * 20;
      est.mirarNoche = presaCache;
      est.mirarT = 1.8;
      est.aviso = 1;
    }
    // lo que falta anotar va antes que lo que ya tenés
    const guia = guiaCache && !js.corriendo && !js.sentado && !js.nadando ? guiaCache : null;
    est.guiando = guia ? guia.id : null;
    est.marcando = guia && guia.d <= MARCAR_DESDE ? guia.sujeto : (presaCache && !js.corriendo ? presaCache : null);

    let destino = null, velocidad = 0;
    // Modo Desafío: si hay un invasor cerca tuyo, el perro va a morderlo
    if (mundo?.ataque) {
      est.estado = 'atacar';
      destino = mundo.ataque;
      const dd = Math.hypot(destino.x - est.pos.x, destino.z - est.pos.z);
      velocidad = dd < 1.1 ? 0 : 5.6;
      if (velocidad === 0) est.rumboObjetivo = Math.atan2(destino.x - est.pos.x, destino.z - est.pos.z);
    } else if (mundo?.alerta) {
      // 2.0, Desafío: se queda duro mirando hacia lo que vos todavía no ves. El
      // gruñido y el ladrido los pone el Desafío (ver `desafio-aliados.js`).
      est.estado = 'alerta';
    } else if (mundo?.rastro) {
      // 1.11 (2.2: rastrear lejos): nariz al piso hacia la presa; si te quedaste atrás,
      // te espera. Le gana a la guía de la 2.0 mientras dura.
      est.estado = 'rastrear';
    } else if (est.estado === 'atacar' || est.estado === 'alerta' || est.estado === 'rastrear') {
      est.estado = 'seguir'; est.t = 1;
    }
    if (est.estado === 'atacar' || est.estado === 'alerta' || est.estado === 'rastrear') {
      // (el daño lo aplica el Desafío; acá sólo se mueve y se anima)
    } else if (js.sentado || js.nadando) {
      est.estado = 'esperar';
    } else if (guia && guia.d <= MARCAR_DESDE) {
      // llegó: se queda duro señalando, el tiempo que haga falta
      if (est.estado !== 'marcar') { est.estado = 'marcar'; est.t = 8; }
    } else if (guia) {
      // guía: adelante, o frenado mirándote si te quedaste atrás
      const dJugadorPresa = Math.hypot(guia.sujeto.pos.x - js.pos.x, guia.sujeto.pos.z - js.pos.z);
      const paso = pasoDeGuia({ dPerroPresa: guia.d, dPerroJugador: d, dJugadorPresa });
      est.estado = paso === 'esperar' ? 'esperarGuia' : 'guiar';
      if (est.guiaAnterior !== guia.id) { est.guiaAnterior = guia.id; est.empezoAGuiar = guia.id; }
    } else if (est.marcando && est.estado !== 'marcar' && est.t <= 0) {
      est.estado = 'marcar'; est.t = 4 + r() * 3;
    } else if (est.estado === 'marcar' && (!est.marcando || est.t <= 0)) {
      est.estado = 'seguir'; est.t = 1;
    } else if (est.estado !== 'marcar') {
      // adelantarse un poco, olfatear, volver
      if (est.t <= 0) {
        // 2.8: si le enseñaste a sentarse y estás quieto, se queda al lado tuyo
        if (est.estado === 'seguir' && r() < 0.45 && !(apariencia.trucos.sentarse && (js.quieto || 0) > 2)) { est.estado = 'olfatear'; est.t = 2.5 + r() * 3; const p = puntoCerca(js, 5, (r() - 0.5) * 2); est.objetivo.set(p.x, 0, p.z); }
        // 2.8: traer (si se lo enseñaste): de lo que olfateó, a veces vuelve con un palito
        else if (est.estado === 'olfatear' && apariencia.trucos.traer && r() < 0.4) { est.estado = 'traer'; est.t = 14; }
        else if (est.estado === 'olfatear') { est.estado = 'adelante'; est.t = 3 + r() * 4; const p = puntoCerca(js, 7, Math.PI + (r() - 0.5) * 1.2); est.objetivo.set(p.x, 0, p.z); }
        else { est.estado = 'seguir'; est.t = 2 + r() * 3; }
      }
    }

    if (est.estado === 'atacar') {
      // la velocidad y el destino ya se decidieron arriba
    } else if (est.estado === 'alerta') {
      velocidad = 0;
      est.rumboObjetivo = Math.atan2(mundo.alerta.x - est.pos.x, mundo.alerta.z - est.pos.z);
    } else if (est.estado === 'rastrear') {
      est.olfateo = 1;
      if (mundo.rastro.esperar) {
        velocidad = 0;
        est.rumboObjetivo = Math.atan2(js.pos.x - est.pos.x, js.pos.z - est.pos.z);
      } else {
        destino = mundo.rastro;
        velocidad = Math.hypot(destino.x - est.pos.x, destino.z - est.pos.z) < 0.6 ? 0 : 2.6;
      }
    } else if (est.estado === 'marcar') {
      velocidad = 0;
      est.rumboObjetivo = Math.atan2(est.marcando.pos.x - est.pos.x, est.marcando.pos.z - est.pos.z);
      if (est.ladrido <= 0) {
        sonido.ladrido(est.pos);
        est.ladrido = 6 + r() * 6;
        est.aviso = 1;
      }
    } else if (est.estado === 'guiar' && guia) {
      // no va derecho al animal —lo espantaría—: va a un punto a unos metros, de este lado
      destino = puntoDeGuia(est.pos, guia.sujeto.pos);
      const dd = Math.hypot(destino.x - est.pos.x, destino.z - est.pos.z);
      velocidad = dd < 1.2 ? 0 : d > 8 ? 1.5 : 2.2;       // al paso, que se lo pueda seguir
      est.olfateo = 1;                                      // la nariz en el rastro
    } else if (est.estado === 'esperarGuia') {
      // se frena y mira para atrás, a ver si venís; un ladrido corto cada tanto
      velocidad = 0;
      est.rumboObjetivo = Math.atan2(js.pos.x - est.pos.x, js.pos.z - est.pos.z);
      if (est.ladrido <= 0) { sonido.ladrido(est.pos); est.ladrido = 7 + r() * 5; }
    } else if (est.estado === 'esperar') {
      velocidad = 0;
      if (d > 4) { destinoTmp.x = js.pos.x; destinoTmp.z = js.pos.z; destino = destinoTmp; }
      else est.rumboObjetivo = Math.atan2(js.pos.x - est.pos.x, js.pos.z - est.pos.z);
    } else if (est.estado === 'traer') {
      // 2.8: viene al trote con el palito y te lo deja a los pies
      destinoTmp.x = js.pos.x; destinoTmp.z = js.pos.z; destino = destinoTmp;
      velocidad = d < 1.5 ? 0 : 3.4;
      if (d < 1.6) { est.estado = 'seguir'; est.t = 2.5; }
    } else if (est.estado === 'olfatear' && Math.hypot(est.objetivo.x - est.pos.x, est.objetivo.z - est.pos.z) < 0.8) {
      velocidad = 0;
      est.olfateo = 1;
    } else {
      const hacia = est.estado === 'seguir' ? js.pos : est.objetivo;
      destinoTmp.x = hacia.x; destinoTmp.z = hacia.z; destino = destinoTmp;
      const dd = Math.hypot(destino.x - est.pos.x, destino.z - est.pos.z);
      // trota si estás lejos, camina si estás cerca, se queda si ya llegó
      velocidad = dd < 2.2 ? 0 : dd > 12 || js.corriendo ? 4.2 : 1.9;
      if (est.estado === 'seguir' && dd < 3.2) velocidad = 0;
    }

    // 2.8: el aviso de noche lo frena un momento mirando hacia lo que oyó
    if (est.mirarT > 0) {
      est.mirarT -= dt;
      velocidad = 0; destino = null;
      if (est.mirarNoche?.pos) est.rumboObjetivo = Math.atan2(est.mirarNoche.pos.x - est.pos.x, est.mirarNoche.pos.z - est.pos.z);
    }
    if (destino && velocidad > 0) {
      est.rumboObjetivo = Math.atan2(destino.x - est.pos.x, destino.z - est.pos.z);
    }
    est.vel = lerp(est.vel, velocidad, 1 - Math.exp(-5 * dt));
    if (est.vel > 0.05) {
      const nx = est.pos.x + Math.sin(est.rumbo) * est.vel * dt;
      const nz = est.pos.z + Math.cos(est.rumbo) * est.vel * dt;
      if (caminable(nx, nz)) { est.pos.x = nx; est.pos.z = nz; col.resolver(est.pos, 0.3); }
      else est.rumboObjetivo += 1.8;
    }
    est.pos.y = T.altura(est.pos.x, est.pos.z);

    const giro = Math.atan2(Math.sin(est.rumboObjetivo - est.rumbo), Math.cos(est.rumboObjetivo - est.rumbo));
    est.rumbo += giro * Math.min(1, dt * 5);
    m.g.rotation.y = est.rumbo;

    // animación: patas, cola y cabeza
    est.fase += dt;
    est.paso += dt * (2 + est.vel * 3.4);
    const anda = est.vel > 0.15;
    for (let i = 0; i < m.patas.length; i++) m.patas[i].rotation.x = anda ? Math.sin(est.paso * 2 + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.7 : 0)) * 0.7 : 0;
    m.g.position.y = est.pos.y + (anda ? Math.abs(Math.sin(est.paso * 2)) * 0.03 : 0);
    const contento = est.estado === 'seguir' || est.estado === 'esperar' || est.estado === 'traer';
    m.cola.rotation.z = Math.sin(est.fase * (contento ? 9 : 3)) * (contento ? 0.55 : 0.2);
    m.cola.rotation.x = est.estado === 'marcar' ? -0.4 : 0;
    est.olfateo = Math.max(0, est.olfateo - dt * 0.8);
    if (est.estado === 'atacar') m.cola.rotation.x = -0.6;
    m.cabeza.rotation.x = est.estado === 'atacar' ? 0.35 + Math.sin(est.fase * 16) * 0.2 : est.estado === 'marcar' ? -0.1 : est.olfateo > 0 ? 0.75 + Math.sin(est.fase * 7) * 0.12 : anda ? 0.05 : Math.sin(est.fase * 0.8) * 0.1;
    if (est.mirarT > 0) m.cabeza.rotation.x = -0.15;
    m.palito.visible = est.estado === 'traer';
    // 2.8: sentarse (si se lo enseñaste): quieto al lado tuyo un rato, se sienta. El cuerpo
    // se inclina hacia atrás, las manos quedan derechas y las patas se doblan adelante.
    const quietoCerca = apariencia.trucos.sentarse && (est.estado === 'seguir' || est.estado === 'esperar') && est.vel < 0.1 && d < 6 && (js.sentado || (js.quieto || 0) > 1.5);
    est.quietoT = quietoCerca ? (est.quietoT || 0) + dt : 0;
    est.sentado = lerp(est.sentado || 0, est.quietoT > 2.5 ? 1 : 0, 1 - Math.exp(-4 * dt));
    if (est.sentado > 0.002) {
      const s = est.sentado;
      m.g.rotation.x = -0.6 * s;
      m.g.position.y -= 0.06 * s;
      m.patas[0].rotation.x += 0.6 * s; m.patas[1].rotation.x += 0.6 * s;
      m.patas[2].rotation.x -= 0.52 * s; m.patas[3].rotation.x -= 0.52 * s;
      m.cabeza.rotation.x += 0.4 * s;
    } else m.g.rotation.x = 0;

    if (!progreso.entradas.perro && d < 6) registrar('perro');
    const marca = est.estado === 'marcar' && est.marcando ? est.marcando : null;
    if (est.aviso > 0) est.aviso -= dt;
    return marca;
  }

  // 2.8: lo elegido en "Personalizar". Si cambió cómo se ve, se rearma la malla sin
  // mover al perro (el grupo es el mismo: sólo cambian las piezas de adentro).
  function personalizar(datos) {
    const nuevo = sanearPerro(datos);
    const rearmar = firmaPerro(nuevo) !== firmaPerro(apariencia);
    apariencia = nuevo;
    if (!rearmar) return false;
    const n = mallaPerro(nuevo);
    const viejas = [...m.g.children];
    for (const c of viejas) m.g.remove(c);
    for (const c of [...n.g.children]) m.g.add(c);
    for (const c of viejas) desechar(c, [MAT_FAUNA]);
    m.cabeza = n.cabeza; m.patas = n.patas; m.cola = n.cola; m.palito = n.palito;
    return true;
  }

  return { est, actualizar, malla: m, personalizar, apariencia: () => apariencia, nombre: () => apariencia.nombre };
}
