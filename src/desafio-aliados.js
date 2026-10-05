// Modo Desafío: los que se quedan a pelear con vos.
// - El perro ladra cuando se acercan y muerde a los invasores cerca tuyo.
// - Don Ramón (puestero) repara las defensas dañadas de la base.
// - Josefina (guardaparque) tira flechas desde la base.
// Los compañeros son los mismos vecinos del valle: cuando tu fuerte es seguro,
// dejan su recorrido y se instalan en la base.
import * as THREE from 'three';
import { COMPANEROS } from './desafio-reglas.js';
import { FORTIN } from './desafio-fortin.js';
import { avisoDelPerro, estaMirando } from './desafio-sentidos.js';
import { ORDENES, RESPUESTAS, RADIO_ARREGLO, ordenDe, siguienteOrden, puntoDeOrden, centroDeArreglo, portonDeLaBase, velocidadSiguiendo, LEJOS_ALCANZA } from './desafio-ordenes.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export function crearAliados(api) {
  // ---------------- el perro
  const perro = { objetivo: null, ladrido: 0, mordida: 0, acumulado: 0 };
  // Devuelve el invasor al que el perro tiene que ir (o null). Sólo defiende cerca tuyo:
  // nunca se aleja más de 14 m del jugador.
  function objetivoPerro(js, perroPos, noche) {
    perro.objetivo = null;
    if (!perroPos) return null;
    let mejor = null, d0 = 14;
    for (const a of api.aliens) {
      if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar') continue;
      if (a.enNave) continue;   // 3.5.1: las crías de adentro de la nave están 650 m arriba: el perro las mordía desde el valle
      const p = a.m.g.position;
      // 2.3: al volador que va alto el perro no lo alcanza (ni al que está bajo tierra)
      if (a.estado === 'bajoTierra' || a.estado === 'dormido' || (a.def.vuela && p.y - js.pos.y > 2.5)) continue;
      const dj = Math.hypot(p.x - js.pos.x, p.z - js.pos.z);
      if (dj < d0) { d0 = dj; mejor = a; }
    }
    perro.objetivo = mejor;
    return mejor ? mejor.m.g.position : null;
  }
  function actualizarPerro(dt, js, perroPos) {
    if (!perroPos) return;
    perro.ladrido -= dt;
    // 2.0: el perro avisa (ver `desafio-sentidos.js`). Gruñe, duro y mirando para ese
    // lado, hacia el invasor que vos todavía no ves; ladra cuando ya está cerca.
    perro.revisar = (perro.revisar || 0) - dt;
    if (perro.revisar <= 0) {
      perro.revisar = 0.4;
      let mas = null, d0 = Infinity;
      for (const a of api.aliens) {
        if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.enNave) continue;   // 3.5.1: ni avisa de las crías de la nave
        const d = Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z);
        if (d < d0) { d0 = d; mas = a; }
      }
      // (el que cava bajo tierra no se ve aunque lo mires: el perro lo marca igual)
      const visto = mas ? mas.estado !== 'bajoTierra' && estaMirando(api.mira(), js.pos, mas.m.g.position) : false;
      perro.aviso = mas ? avisoDelPerro({ distancia: d0, visto }) : null;
      perro.alerta = perro.aviso === 'grunir' ? mas.m.g.position : null;
      perro.amenaza = mas;
    }
    if (perro.aviso && perro.ladrido <= 0 && perro.amenaza) {
      const donde = perro.amenaza.m.g.position;
      if (perro.aviso === 'grunir') { api.S.grunirPerro(perroPos); api.oir?.('grunirPerro', donde); perro.ladrido = 3.2 + Math.random() * 2.2; }
      else { api.sonido.ladrido?.(perroPos); api.oir?.('ladrarPerro', donde); perro.ladrido = 2.4 + Math.random() * 1.6; }
    }
    const a = perro.objetivo;
    if (!a || a.estado === 'morir') return;
    const p = a.m.g.position;
    if (Math.hypot(p.x - perroPos.x, p.z - perroPos.z) < 1.3 + a.def.radio * a.m.esc) {
      // muerde: poco daño pero constante, y a los rastreadores los frena
      api.herirAlien(a, 9 * dt, null, 'perro');
      if (a.tipo === 'rastreador') a.frenoT = Math.max(a.frenoT || 0, 0.25);
      perro.mordida -= dt;
      if (perro.mordida <= 0) {
        perro.mordida = 0.6;
        api.efectos?.sangre({ x: p.x, y: p.y + 0.7, z: p.z }, 4);
        api.sonido.ladrido?.(perroPos);
      }
    }
  }

  // ---------------- los compañeros
  const activos = new Map();   // clave -> { npc, t, obra, arco }
  function mallaArco() {
    const g = new THREE.Group();
    const madera = new THREE.MeshLambertMaterial({ color: '#7a5f43' });
    const curva = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 4, 14, Math.PI * 0.8), madera);
    curva.rotation.set(Math.PI / 2, 0, Math.PI * 0.6);
    g.add(curva);
    return g;
  }
  function puntoBase(i, n, radio = 3.2) {
    const c = api.centroBase();
    const a = (i / Math.max(1, n)) * Math.PI * 2 + 0.6;
    return { x: c.x + Math.cos(a) * radio, z: c.z + Math.sin(a) * radio };
  }
  // Traslada al vecino a la base y le cambia la rutina. Sirve al sumarse y al cargar.
  function instalar(clave) {
    const npc = api.gente()?.gente?.find((g) => g.clave === clave);
    const def = COMPANEROS[clave];
    if (!npc || !def) return false;
    const c = api.centroBase();
    const p = puntoBase(clave === 'ramon' ? 0 : 1, 2);
    npc.pos.set(p.x, api.alturaEn(p.x, p.z), p.z);
    npc.ruta = [{ x: p.x, z: p.z, quieto: 9999, mirar: { x: c.x, z: c.z } }];
    npc.etapa = 0; npc.espera = 0; npc.velocidad = 1.35; npc.enBase = true;
    npc.saludo = def.saludo;
    npc.despedida = 'Acá me quedo, cuidando.';
    if (npc.mate) npc.mate.visible = false;
    if (npc.planilla) npc.planilla.visible = false;
    let arco = null;
    if (clave === 'ema') { arco = mallaArco(); npc.mano.add(arco); }
    activos.set(clave, { npc, t: Math.random() * 2, obra: null, arco, mira: { x: c.x, z: c.z } });
    return true;
  }
  function sumar(clave) {
    const d = api.D();
    if (d.companeros.includes(clave)) return false;
    if (!instalar(clave)) return false;
    d.companeros.push(clave);
    api.nota(`${COMPANEROS[clave].nombre} se suma a tu base`, `“${COMPANEROS[clave].aviso}”`, true);
    return true;
  }
  // Al amanecer se evalúa si algún vecino se anima a instalarse.
  function revisarLlegadas(defensas) {
    const d = api.D();
    const llegaron = [];
    for (const [clave, def] of Object.entries(COMPANEROS)) {
      if (d.companeros.includes(clave)) continue;
      if (d.noches >= def.llega.noches && defensas >= def.llega.defensas && sumar(clave)) llegaron.push(clave);
    }
    return llegaron;
  }
  function restaurar() {
    for (const clave of api.D().companeros) if (!activos.has(clave)) instalar(clave);
  }

  // 1.11: las órdenes. Cada uno sabe dónde le toca estar y alrededor de dónde arreglar.
  function contextoOrden(i) {
    const base = api.centroBase();
    const js = api.jugador()?.estado;
    return {
      base, porton: portonDeLaBase(api.portones?.() || [], base), i, puntoBase: puntoBase(i, 2),
      jugador: js ? { pos: js.pos, yaw: js.yaw } : { pos: base, yaw: 0 },
    };
  }
  // Camina hasta `p`. Siguiéndote apura el paso, y si te fuiste lejos te alcanza.
  function irA(npc, p, orden) {
    const r = npc.ruta[0];
    const d = Math.hypot(npc.pos.x - p.x, npc.pos.z - p.z);
    if (orden === 'seguime' && d > LEJOS_ALCANZA) npc.pos.set(p.x, api.alturaEn(p.x, p.z), p.z);
    npc.velocidad = orden === 'seguime' ? velocidadSiguiendo(d) : 1.35;
    if (orden === 'seguime') r.mirar = api.jugador()?.estado?.pos || r.mirar;
    if (Math.hypot(r.x - p.x, r.z - p.z) > 0.8 || d > 1.2) { r.x = p.x; r.z = p.z; npc.espera = 0; r.quieto = 0.5; }
  }
  function ordenar(clave) {
    const d = api.D();
    if (!activos.has(clave) || !ORDENES[clave]) return null;
    if (!d.ordenes) d.ordenes = {};
    const orden = siguienteOrden(clave, ordenDe(d.ordenes, clave));
    d.ordenes[clave] = orden;
    const c = activos.get(clave);
    c.t = 0; c.tMover = 0; c.obra = null;
    return { orden, respuesta: RESPUESTAS[clave][orden] };
  }

  // 2.5: el cuerno de guardia. Todos los que están en la base vienen a tu lado (la orden
  // queda en "vení conmigo", como si se la hubieras dado a cada uno).
  function llamar() {
    const d = api.D();
    if (!d.ordenes) d.ordenes = {};
    let n = 0;
    for (const [clave, c] of activos) {
      if (!ORDENES[clave]?.includes('seguime')) continue;
      d.ordenes[clave] = 'seguime';
      c.t = 0; c.tMover = 0; c.obra = null;
      n++;
    }
    return n;
  }
  function actualizarCompaneros(dt, nocheActiva) {
    for (const [clave, c] of activos) {
      const npc = c.npc;
      const orden = ordenDe(api.D().ordenes, clave);
      c.t -= dt;
      if (clave === 'ramon') {
        // busca la obra más dañada alrededor de donde le toca estar y va a repararla
        if (c.t <= 0) {
          c.t = orden === 'seguime' ? 0.4 : 1.2;
          const ctxO = contextoOrden(0);
          const radio = RADIO_ARREGLO[orden] || 0;
          const obra = radio ? api.obraMasDanada(centroDeArreglo(orden, ctxO), radio) : null;
          // si cambió de tarea, deja de esperar y camina hasta el nuevo lugar
          if (obra !== c.obra) { npc.espera = 0; npc.ruta[0].quieto = 1; }
          c.obra = obra;
          if (obra) {
            npc.ruta[0].x = obra.datos.x + 1.1; npc.ruta[0].z = obra.datos.z + 0.4;
            npc.ruta[0].mirar = { x: obra.datos.x, z: obra.datos.z };
          } else {
            irA(npc, puntoDeOrden(orden, ctxO), orden);
          }
        }
        if (c.obra && Math.hypot(npc.pos.x - c.obra.datos.x, npc.pos.z - c.obra.datos.z) < 2.4) {
          const lleno = api.reparar(c.obra, 7 * dt);
          c.golpe = (c.golpe || 0) - dt;
          if (c.golpe <= 0) {
            c.golpe = 0.55;
            npc.brazos[1].rotation.x = -1.6;
            api.efectos?.astillas({ x: c.obra.datos.x, y: c.obra.datos.y + 1, z: c.obra.datos.z }, 3);
            api.sonido.golpeRuido?.({ dur: 0.08, frec: 900, q: 2, vol: 0.18, destino: api.sonido.fuente?.(npc.pos, 0.7) });
          }
          if (lleno) c.obra = null;
        }
      } else if (clave === 'ema') {
        // 2.6: con "quedate en la base", si hay un puesto de tirador, se aposta ahí
        const puesto = orden === 'base' ? api.puestoTirador?.() : null;
        c.tMover = (c.tMover || 0) - dt;
        if (c.tMover <= 0) { c.tMover = 0.4; irA(npc, puesto || puntoDeOrden(orden, contextoOrden(1)), orden); }
        if (!nocheActiva || c.t > 0) continue;
        const apostada = !!puesto && Math.hypot(npc.pos.x - puesto.x, npc.pos.z - puesto.z) < FORTIN.puesto.radio;
        let mejor = null, d0 = apostada ? FORTIN.puesto.alcance : 32;
        for (const a of api.aliens) {
          if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar') continue;
          if (a.estado === 'bajoTierra') continue;   // 2.6.1: no se ve ni le entra nada: la flecha se clavaba en el suelo
          if (a.enNave || a.estado === 'dormido') continue;   // 3.5.1: Josefina no sube a la nave (no le tira a las crías desde el valle) ni despierta a los dormidos de las ruinas y los puestos
          const d = Math.hypot(a.m.g.position.x - npc.pos.x, a.m.g.position.z - npc.pos.z);
          if (d < d0) { d0 = d; mejor = a; }
        }
        if (!mejor) { c.t = 0.5; continue; }
        c.t = (apostada ? FORTIN.puesto.cadencia : 2.2) + Math.random() * 0.6;
        const ap = mejor.m.g.position;
        npc.ruta[0].mirar = { x: ap.x, z: ap.z };   // 3.5.1: una copia: el invasor se recicla y Josefina quedaba mirando al que lo reemplazaba
        npc.rumboObjetivo = Math.atan2(ap.x - npc.pos.x, ap.z - npc.pos.z);
        _v.set(npc.pos.x, npc.pos.y + 1.5, npc.pos.z);
        _w.set(ap.x, ap.y + mejor.def.altura * mejor.m.esc * 0.55, ap.z).sub(_v);
        const tiempo = _w.length() / 44;
        _w.y += 0.5 * 9.8 * tiempo * tiempo;
        _w.normalize().multiplyScalar(44);
        _w.x += (Math.random() - 0.5) * 1.2; _w.z += (Math.random() - 0.5) * 1.2;
        api.lanzarProyectil('flecha', _v, _w, 30 * (apostada ? FORTIN.puesto.dano : 1), true, 'aliado');
        api.sonido.tono?.({ frec: 240, fin: 110, dur: 0.16, tipo: 'triangle', vol: 0.12, destino: api.sonido.fuente?.(npc.pos, 0.8) });
      }
    }
  }

  return {
    objetivoPerro, actualizarPerro, actualizarCompaneros, revisarLlegadas, restaurar, sumar, ordenar, llamar,
    get alertaPerro() { return perro.alerta || null; },
    get avisoPerro() { return perro.aviso || null; },
    ordenDe: (clave) => ordenDe(api.D().ordenes, clave),
    get companeros() { return [...activos.keys()]; },
  };
}
