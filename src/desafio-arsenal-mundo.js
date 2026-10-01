// 2.5: el arsenal en el mundo (las reglas y los números están en desafio-arsenal.js).
//
//   · Las mallas de lo que se tira: virote, hacha, jabalina, arpón, granada, humo, bengala.
//   · Lo que pasa al pegar: fuego, descarga, derribo, arrastre del arpón, lo que atraviesa.
//   · Lo que queda: hachas y jabalinas en el suelo (se levantan al pasar), nubes de humo,
//     bengalas colgadas en el aire que dejan a la vista a los invasores.
//   · Estados del invasor: ardiendo, confundido por el humo, dudando por el cuerno,
//     arrastrado por el arpón.
//   · La ráfaga de la ballesta de repetición.
//
// desafio.js le pasa una `api` (la misma que usan las defensas) y lo llama en pocos
// lugares: al crear un proyectil, al pegar, al terminar, en cada invasor y en cada cuadro.
import * as THREE from 'three';
import { QUEMA, PERFORA, RECUPERABLES, danoContra, danoDeExplosion, ARSENAL } from './desafio-arsenal.js';

const _v = new THREE.Vector3();
const vivo = (a) => a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'bajoTierra';

export function crearArsenalMundo(T, escena, efectos, sonido, api) {
  // ---------------------------------------------------------------- mallas de proyectil
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const brilla = (c) => new THREE.MeshBasicMaterial({ color: c });
  const MALLAS = {
    // el virote de la ballesta de mano: más corto y grueso que el perno de la torre
    virote: { geo: new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5).rotateX(Math.PI / 2), mat: lam('#5a4630'), gravedad: 3 },
    hachuela: (() => {
      const g = new THREE.BufferGeometry();
      const mango = new THREE.BoxGeometry(0.04, 0.42, 0.04).toNonIndexed();
      const hoja = new THREE.BoxGeometry(0.16, 0.1, 0.02).toNonIndexed().translate(0.06, 0.17, 0);
      g.setAttribute('position', new THREE.Float32BufferAttribute([...mango.attributes.position.array, ...hoja.attributes.position.array], 3));
      g.computeVertexNormals();
      return { geo: g, mat: lam('#6f6a60'), gravedad: 9.8, gira: true };
    })(),
    jabalina: { geo: new THREE.CylinderGeometry(0.022, 0.022, 1.7, 5).rotateX(Math.PI / 2), mat: lam('#6b5238'), gravedad: 9.8 },
    arpon: { geo: new THREE.ConeGeometry(0.05, 0.5, 6).rotateX(Math.PI / 2), mat: brilla('#7dfff0'), gravedad: 2 },
    granada: { geo: new THREE.IcosahedronGeometry(0.12, 0), mat: brilla('#7dfff0'), gravedad: 9.8, gira: true },
    humo: { geo: new THREE.SphereGeometry(0.1, 8, 6), mat: lam('#3c3a36'), gravedad: 9.8 },
    bengala: { geo: new THREE.CylinderGeometry(0.03, 0.03, 0.26, 6).rotateX(Math.PI / 2), mat: brilla('#ff5a3c'), gravedad: 9.8 },
    // 2.6: la piedra de la catapulta
    pedrusco: { geo: new THREE.IcosahedronGeometry(0.34, 0), mat: lam('#7d766c'), gravedad: 9.8, gira: true },
  };
  const malla = (tipo) => MALLAS[tipo] || null;

  // ---------------------------------------------------------------- lanzar
  // `d` es el Desafío; el contador ya se descontó en desafio.js.
  function lanzar(tipo, arma, origen, dir, bono = 1) {
    const vel = _v.copy(dir).multiplyScalar(arma.vel * (bono > 1 ? 1.1 : 1));
    if (tipo !== 'arpon') vel.y += tipo === 'bengala' ? 14 : tipo === 'humo' || tipo === 'granada' ? 3.2 : 1.6;
    // la granada, el humo y la bengala no pegan al tocar: la granada hace su daño al estallar
    const directo = tipo === 'granada' || tipo === 'humo' || tipo === 'bengala' ? 0 : (arma.dano || 0) * bono;
    const p = api.lanzarProyectil(tipo, origen, vel, directo, true, 'jugador');
    p.arma = arma;
    if (tipo === 'bengala') p.vida = 1.6;   // estalla a los 1,6 s, esté donde esté
    if (tipo === 'arpon') { arponFuera = p; p.vida = 1.2; }
    return p;
  }

  // ---------------------------------------------------------------- al pegar a un invasor
  // Devuelve cuánto daño hace de verdad (para las flechas de cristal contra los grandes).
  function danoProyectil(q, a) {
    if (q.flechaTipo === 'cristal' && a.def?.pesado) return q.dano * PERFORA.contraPesados;
    if (q.arma) return danoContra(q.arma, a.def, q.dano);
    return q.dano;
  }
  // Después del golpe normal. 'sigue' si el proyectil atraviesa y sigue de largo.
  function alPegar(q, a) {
    const p = a.m.g.position;
    // los efectos, sólo si sigue vivo; lo que atraviesa, igual (el virote mata al chico y sigue)
    if (!vivo(a)) return (q.atraviesa || 0) > 0 ? (q.atraviesa--, 'sigue') : 'fin';
    if (q.flechaTipo === 'fuego') quemar(a);
    if (q.tipo === 'boleadora' && q.descarga) descarga(p, q.descarga, a);
    if (q.tipo === 'hachuela' && !a.def.pesado) a.enredadoT = Math.max(a.enredadoT || 0, q.arma?.derriba || 0.9);
    if (q.tipo === 'arpon') {
      const js = api.jugador().estado;
      const dx = js.pos.x - p.x, dz = js.pos.z - p.z, d = Math.hypot(dx, dz) || 1;
      // hasta tres metros antes tuyo; a los grandes los mueve la mitad
      const lejos = Math.max(0, d - 3) * (a.def.pesado ? 0.5 : 1);
      a.arrastre = { t: q.arma?.arrastra || 0.8, x: p.x + (dx / d) * lejos, z: p.z + (dz / d) * lejos };
      if (a.def.jefe) a.arrastre = null;   // al jefe no lo mueve nadie
      sonido.golpeRuido?.({ dur: 0.35, frec: 1800, q: 4, vol: 0.2, destino: sonido.fuente?.(p, 1) });
    }
    if ((q.atraviesa || 0) > 0) { q.atraviesa--; return 'sigue'; }
    return 'fin';
  }
  function quemar(a) {
    a.fuegoT = QUEMA.dura;
    a.tLlama = 0;
  }
  // La descarga de las boleadoras de cristal: salta a los que están alrededor.
  function descarga(c, f, primero) {
    efectos.destello({ x: c.x, y: c.y + 1, z: c.z }, 0.7, '#7dfff0');
    sonido.golpeRuido?.({ dur: 0.25, frec: 3400, q: 3, vol: 0.18, destino: sonido.fuente?.(c, 1) });
    for (const b of api.aliens) {
      if (!vivo(b)) continue;
      const q = b.m.g.position;
      if (Math.hypot(q.x - c.x, q.z - c.z) > f.radio) continue;
      if (b !== primero) api.herirAlien(b, f.dano, c, 'jugador', 'cristal');   // 3.0: la clase del golpe (desafio-evolucion.js)
      if (!b.def.pesado) b.enredadoT = Math.max(b.enredadoT || 0, f.aturde);
      efectos.chispas({ x: q.x, y: q.y + 1, z: q.z }, 5);
    }
  }

  // ---------------------------------------------------------------- al terminar
  // `fin`: 'suelo', 'obra', 'alien', 'aire' (la bengala en lo alto) o 'vida' (se cansó).
  function alTerminar(q, fin) {
    const pos = q.pos;
    if (q.tipo === 'granada') return estallar(pos, q.arma || ARSENAL.granada);
    if (q.tipo === 'humo') return soltarHumo(pos, q.arma || ARSENAL.humo);
    if (q.tipo === 'bengala') return colgarBengala(pos, q.arma || ARSENAL.bengala);
    if (q.tipo === 'arpon') { arponFuera = null; return; }
    if (q.tipo === 'pedrusco') return golpeCatapulta(pos, q.arma || { dano: 80, radio: 3.5 });
    if (q.flechaTipo === 'fuego' && fin !== 'alien') prenderCerca(pos);
    if (RECUPERABLES[q.tipo]) dejarEnElSuelo(q.tipo, pos);
  }
  // ¿Termina en el aire? (la bengala estalla al llegar arriba)
  function terminaEnAire(q) { return q.tipo === 'bengala' && q.vel.y <= 0; }

  // La flecha incendiaria que se clava cerca de la zanja la prende; cerca de un barril,
  // lo hace estallar.
  function prenderCerca(pos) {
    efectos.fuego(pos, 0.5);
    api.prenderCerca?.(pos, QUEMA.prende);
  }

  function estallar(c, arma) {
    efectos.explosion(c, arma.radio);
    sonido.golpeRuido?.({ dur: 1, frec: 150, tipo: 'lowpass', vol: 0.8, destino: sonido.fuente?.(c, 1.3) });
    sonido.golpeRuido?.({ dur: 0.4, frec: 2600, vol: 0.25, destino: sonido.fuente?.(c, 1) });
    for (const a of api.aliens) {
      if (!vivo(a)) continue;
      const p = a.m.g.position;
      const dano = danoDeExplosion(arma.dano, arma.radio, Math.hypot(p.x - c.x, p.z - c.z));
      if (dano > 0) api.herirAlien(a, dano, c, 'jugador', 'explosivos');   // 3.0
    }
    // 3.5.1: la onda también les llega al nido, a los puestos, a las agujas y a la Madre (antes
    // la granada les hacía 0: el tiro directo no pega y la explosión sólo miraba invasores)
    for (const n of (api.blancos?.() || []).slice()) {
      const dano = danoDeExplosion(arma.dano, arma.radio, Math.max(0, Math.hypot(n.pos.x - c.x, n.pos.y - c.y, n.pos.z - c.z) - (n.radio || 0)));
      if (dano > 0) api.herirBlanco?.(n, dano);
    }
    const js = api.jugador().estado;
    const dj = Math.hypot(js.pos.x - c.x, js.pos.z - c.z);
    if (dj < arma.radio * 0.8 && Math.abs(js.pos.y - c.y) < 3) api.herirJugador(25 * (1 - dj / arma.radio), c);
    api.prenderCerca?.(c, 2.5);
  }

  // 2.6: la piedra de la catapulta cae con todo (no lastima a los tuyos)
  function golpeCatapulta(c, f) {
    const suelo = { x: c.x, y: T.altura(c.x, c.z) + 0.2, z: c.z };
    efectos.polvo(suelo, 14, '#8a8378');
    efectos.chispas(suelo, 6);
    sonido.golpeRuido?.({ dur: 0.9, frec: 120, tipo: 'lowpass', vol: 0.7, destino: sonido.fuente?.(c, 1.3) });
    for (const a of api.aliens) {
      if (!vivo(a)) continue;
      const p = a.m.g.position;
      const dano = danoDeExplosion(f.dano, f.radio, Math.hypot(p.x - c.x, p.z - c.z));
      if (dano > 0) api.herirAlien(a, dano, c, 'torreta');
    }
  }
  // ---------------------------------------------------------------- lo que se levanta del suelo
  const enElSuelo = [];
  function dejarEnElSuelo(tipo, pos) {
    const m = MALLAS[tipo];
    let r = enElSuelo.find((x) => !x.activo && x.tipo === tipo);
    if (!r) {
      if (enElSuelo.length > 40) return;   // tope: una lluvia de hachas no llena la escena
      r = { tipo, malla: new THREE.Mesh(m.geo, m.mat), activo: false };
      escena.add(r.malla);
      enElSuelo.push(r);
    }
    const y = api.alturaSuelo?.(pos.x, pos.z) ?? T.altura(pos.x, pos.z);   // 3.5.1: adentro de la nave, su piso (no el valle de abajo)
    r.activo = true; r.x = pos.x; r.z = pos.z; r.t = 0;
    r.malla.visible = true;
    r.malla.position.set(pos.x, y + (tipo === 'jabalina' ? 0.55 : 0.06), pos.z);
    // la jabalina queda clavada en diagonal; el hacha tirada de costado
    if (tipo === 'jabalina') r.malla.rotation.set(-0.9, Math.random() * 6.28, 0);
    else r.malla.rotation.set(Math.PI / 2, Math.random() * 6.28, 0);
  }
  function levantar(js) {
    for (const r of enElSuelo) {
      if (!r.activo) continue;
      if (Math.hypot(js.pos.x - r.x, js.pos.z - r.z) > 1.5) continue;
      r.activo = false; r.malla.visible = false;
      const d = api.D();
      const k = RECUPERABLES[r.tipo];
      d[k] = Math.min(99, (d[k] || 0) + 1);
      sonido.juntar?.();
      api.alJuntar?.(r.tipo);
    }
  }

  // ---------------------------------------------------------------- humo
  const matHumo = new THREE.MeshLambertMaterial({ color: '#6d6a64', transparent: true, opacity: 0.4, depthWrite: false });
  const geoHumo = new THREE.SphereGeometry(1, 10, 8);
  const nubes = [];
  function soltarHumo(pos, arma) {
    let n = nubes.find((x) => !x.activa);
    if (!n) {
      if (nubes.length >= 4) n = nubes.reduce((a, b) => (a.t > b.t ? a : b));   // se recicla la más vieja
      else {
        const g = new THREE.Group();
        const bolas = [];
        for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(geoHumo, matHumo.clone()); g.add(b); bolas.push(b); }
        escena.add(g);
        n = { g, bolas };
        nubes.push(n);
      }
    }
    const y = api.alturaSuelo?.(pos.x, pos.z) ?? T.altura(pos.x, pos.z);   // 3.5.1: ídem
    Object.assign(n, { activa: true, x: pos.x, y, z: pos.z, t: 0, dura: arma.dura, radio: arma.radio });
    n.g.visible = true;
    n.g.position.set(pos.x, y, pos.z);
    n.bolas.forEach((b, i) => {
      const a = i * 0.9, r = i ? arma.radio * 0.45 : 0;
      b.position.set(Math.cos(a) * r, 1.2 + (i % 3) * 0.5, Math.sin(a) * r);
      b.userData.base = 0.5;
    });
    sonido.golpeRuido?.({ dur: 1.4, frec: 700, q: 0.4, tipo: 'lowpass', vol: 0.25, destino: sonido.fuente?.(pos, 1), buffer: sonido.ruido });
  }
  function actualizarHumo(dt) {
    for (const n of nubes) {
      if (!n.activa) continue;
      n.t += dt;
      const k = Math.min(1, n.t / 0.8), fin = Math.max(0, Math.min(1, (n.dura - n.t) / 2));
      n.bolas.forEach((b, i) => {
        b.scale.setScalar(n.radio * (0.35 + 0.35 * k) * (0.85 + 0.15 * Math.sin(n.t * 0.8 + i)));
        b.material.opacity = 0.42 * k * fin;
      });
      if (n.t >= n.dura) { n.activa = false; n.g.visible = false; }
    }
  }
  const enHumo = (x, z, extra = 0) => nubes.some((n) => n.activa && Math.hypot(n.x - x, n.z - z) < n.radio + extra);

  // ---------------------------------------------------------------- bengalas
  const matBengala = new THREE.MeshBasicMaterial({ color: '#ffd2a0' });
  const matHalo = new THREE.MeshBasicMaterial({ color: '#ff8a4a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const matCharco = new THREE.MeshBasicMaterial({ color: '#ffb088', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const geoCharco = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2);
  const bengalas = [];
  function colgarBengala(pos, arma) {
    let b = bengalas.find((x) => !x.activa);
    if (!b) {
      if (bengalas.length >= 3) b = bengalas.reduce((a, c) => (a.t > c.t ? a : c));
      else {
        const g = new THREE.Group();
        const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), matBengala);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), matHalo.clone());
        g.add(nucleo, halo);
        const charco = new THREE.Mesh(geoCharco, matCharco.clone());
        escena.add(g, charco);
        b = { g, halo, charco };
        bengalas.push(b);
      }
    }
    Object.assign(b, { activa: true, x: pos.x, y: Math.max(pos.y, T.altura(pos.x, pos.z) + 12), z: pos.z, t: 0, dura: arma.dura, radio: arma.radio });
    b.g.visible = true; b.charco.visible = true;
    sonido.tono?.({ frec: 900, fin: 300, dur: 0.6, tipo: 'sawtooth', vol: 0.06, destino: sonido.fuente?.(pos, 1) });
    api.alBengala?.(b);
  }
  let hayBengalas = 0;
  function actualizarBengalas(dt) {
    hayBengalas = 0;
    for (const b of bengalas) {
      if (!b.activa) continue;
      b.t += dt;
      // baja despacio, colgada de su paracaídas de hojas
      b.y = Math.max(T.altura(b.x, b.z) + 3, b.y - dt * 0.35);
      b.g.position.set(b.x, b.y, b.z);
      const fin = Math.max(0, Math.min(1, (b.dura - b.t) / 3));
      b.halo.scale.setScalar(0.9 + Math.sin(b.t * 17) * 0.08);
      b.halo.material.opacity = 0.35 * fin;
      b.charco.position.set(b.x, T.altura(b.x, b.z) + 0.08, b.z);
      b.charco.scale.setScalar(b.radio * 0.7);
      b.charco.material.opacity = 0.18 * fin;
      if (b.t >= b.dura) { b.activa = false; b.g.visible = false; b.charco.visible = false; }
      else hayBengalas++;
    }
  }
  // ¿Lo alumbra una bengala? (se le prenden los ojos y se lo ve aunque sea oscuro)
  function revelado(p) {
    for (const b of bengalas) if (b.activa && Math.hypot(b.x - p.x, b.z - p.z) < b.radio) return true;
    return false;
  }

  // ---------------------------------------------------------------- el cuerno
  let recargaCuerno = 0;
  function soplarCuerno(js, arma) {
    if (recargaCuerno > 0) { api.nota('Todavía te falta el aire', `El cuerno se puede volver a soplar en ${Math.ceil(recargaCuerno)} segundos`); return false; }
    recargaCuerno = arma.cadencia;
    sonido.tono?.({ frec: 164, fin: 158, dur: 1.6, tipo: 'sawtooth', vol: 0.22, ataque: 0.12, destino: sonido.bus?.efectos, vibrato: 3 });
    sonido.tono?.({ frec: 246, fin: 238, dur: 1.5, tipo: 'triangle', vol: 0.12, ataque: 0.15, destino: sonido.bus?.efectos });
    let dudan = 0;
    for (const a of api.aliens) {
      if (!vivo(a)) continue;
      const p = a.m.g.position;
      if (Math.hypot(p.x - js.pos.x, p.z - js.pos.z) > arma.radio) continue;
      a.dudaT = Math.max(a.dudaT || 0, arma.duda * (a.def.jefe ? 0.35 : 1));
      dudan++;
    }
    const vienen = api.llamarCompaneros?.() || 0;
    api.nota('Soplaste el cuerno', vienen ? (dudan ? 'Los compañeros vienen a tu lado, y los de cerca dudaron' : 'Los compañeros vienen a tu lado') : dudan ? 'Los de cerca dudaron un instante' : 'Retumbó en todo el valle');
    return true;
  }

  // ---------------------------------------------------------------- la ráfaga de la ballesta
  let rafaga = null;
  function programarRafaga(quedan, cada, disparar) { rafaga = quedan > 0 ? { quedan, cada, t: cada, disparar } : null; }
  function actualizarRafaga(dt) {
    if (!rafaga) return;
    rafaga.t -= dt;
    if (rafaga.t > 0) return;
    rafaga.t = rafaga.cada;
    rafaga.quedan--;
    if (!rafaga.disparar() || rafaga.quedan <= 0) rafaga = null;
  }

  // ---------------------------------------------------------------- estados del invasor
  // Arde: se lastima de a poco y echa llamas (el volador también).
  function arder(a, dt) {
    const p = a.m.g.position;
    a.fuegoT -= dt;
    api.herirAlien(a, QUEMA.dps * dt, null, 'fuego');
    a.tLlama = (a.tLlama || 0) - dt;
    if (a.tLlama <= 0) { a.tLlama = 0.22; efectos.fuego({ x: p.x, y: p.y + a.def.altura * a.m.esc * 0.5, z: p.z }, 0.45); }
  }
  // Se llama por cada invasor en tierra. Devuelve cómo se mueve este cuadro.
  const salida = { vel: 1, quieto: false, sinAtaque: false, rumbo: null };
  function estadoAlien(a, dt, js) {
    salida.vel = 1; salida.quieto = false; salida.sinAtaque = false; salida.rumbo = null;
    const p = a.m.g.position;
    if (a.fuegoT > 0) {
      arder(a, dt);
      salida.vel *= 1.15;   // corre, desesperado
    }
    if (a.arrastre) {
      const r = a.arrastre;
      const dx = r.x - p.x, dz = r.z - p.z, d = Math.hypot(dx, dz);
      const paso = Math.min(d, (d / Math.max(0.05, r.t)) * dt);
      const nx = p.x + (dx / Math.max(d, 1e-6)) * paso, nz = p.z + (dz / Math.max(d, 1e-6)) * paso;
      // contra una pared se suelta: el arpón no lo pasa a través.
      // 3.5.1: en tramos cortos: de lejos el tirón mueve más de un metro por cuadro y una
      // empalizada (medio metro) quedaba saltada entre un punto y el otro
      if (d > 0.01) {
        const n = Math.max(1, Math.ceil(paso / 0.3));
        for (let k = 1; k < n; k++) {
          const sx = p.x + (nx - p.x) * (k / n), sz = p.z + (nz - p.z) * (k / n);
          if (api.obraEnPunto?.(sx, T.altura(sx, sz) + 1, sz)) { a.arrastre = null; salida.quieto = true; return salida; }
        }
      }
      if (d > 0.01 && api.obraEnPunto?.(nx, T.altura(nx, nz) + 1, nz)) { a.arrastre = null; salida.quieto = true; return salida; }
      if (d > 0.01) { p.x = nx; p.z = nz; }
      p.y = T.altura(p.x, p.z);
      api.col?.resolver?.(p, a.def.radio * a.m.esc, a.def.altura * a.m.esc);   // 3.5.1: ni árboles ni piedras
      r.t -= dt;
      if (r.t <= 0 || d < 0.05) a.arrastre = null;
      salida.quieto = true;
      return salida;
    }
    if (a.dudaT > 0) { a.dudaT -= dt; salida.quieto = true; return salida; }
    // el humo: si está adentro o cerca de la nube, o si vos estás adentro, te pierde
    a.confusoT = Math.max(0, (a.confusoT || 0) - dt);
    if (nubes.length && (enHumo(p.x, p.z, 4) || enHumo(js.pos.x, js.pos.z))) a.confusoT = Math.max(a.confusoT, 1.2);
    if (a.confusoT > 0 && !a.def.jefe) {
      a.tRumboConfuso = (a.tRumboConfuso || 0) - dt;
      if (a.tRumboConfuso <= 0) { a.tRumboConfuso = 1 + Math.random(); a.rumboConfuso = Math.random() * Math.PI * 2; }
      salida.rumbo = a.rumboConfuso;
      salida.vel *= 0.55;
      salida.sinAtaque = true;
    }
    return salida;
  }

  // ---------------------------------------------------------------- por cuadro
  let arponFuera = null;
  function actualizar(dt, js) {
    recargaCuerno = Math.max(0, recargaCuerno - dt);
    actualizarRafaga(dt);
    actualizarHumo(dt);
    actualizarBengalas(dt);
    levantar(js);
  }
  function limpiar() {
    for (const r of enElSuelo) { r.activo = false; r.malla.visible = false; }
    for (const n of nubes) { n.activa = false; n.g.visible = false; }
    for (const b of bengalas) { b.activa = false; b.g.visible = false; b.charco.visible = false; }
    rafaga = null; arponFuera = null;
  }

  return {
    malla, lanzar, danoProyectil, alPegar, arder, alTerminar, terminaEnAire, estadoAlien, revelado, enHumo,
    soplarCuerno, programarRafaga, actualizar, limpiar,
    get arponFuera() { return !!arponFuera; },
    get enElSuelo() { return enElSuelo.filter((r) => r.activo).length; },
    get nubes() { return nubes.filter((n) => n.activa).length; },
    get bengalas() { return hayBengalas; },
    get recargaCuerno() { return recargaCuerno; },
  };
}
