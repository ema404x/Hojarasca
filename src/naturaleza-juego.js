// 4.31.0 (C): el enganche de la naturaleza que se toca con el juego (las reglas en naturaleza-toque.js, lo visual en
// naturaleza-mundo.js). La E (una sola entrada de la tabla de interacciones, 'naturaleza', después de todo lo demás):
// sacudir un arbusto o un árbol chico, arrancar pasto o un amancay ya anotado, juntar la leña suelta, tocar el agua agachado y
// tirar una piedra al lago (el sapito). Sin tecla: las piedritas y las piñas que se patean al andar, el agua que salpica, el
// ripio y las ramitas que crujen bajo el pie, el jugador mojado que gotea, las matas que se mueven al pasar y las ranas que
// saltan al agua. Sólo en el Relax y la Historia.
import { NATURALEZA, ARBUSTOS, PASTOS, ARBOLES_CHICOS, sanearNaturaleza, pilaDeLena, lenaTomada, juntarLena, piedritaDe, patea, saltosSapito, piquesSapito, textoSapito, anotarSapito, superficiePaso, crujeRama, mojarse, cadaGota, loQueCae, elegirToque, mirando } from './naturaleza-toque.js';
import { crearNaturalezaMundo } from './naturaleza-mundo.js';
import { CALLES_ALDEA, marcoAldea, distanciaACalle } from './aldea.js';

const tiene = (o, k) => !!o && typeof o === 'object' && Object.hasOwn(o, k);

// ctx: { T, veg, escena, sonido, objetos, camara(), jugador(), progreso(), nota(t, sub), guardar(), registrar(id, juntado), cabeJuntar(k, n),
//        sumarRamitas(n), dia(), horas(), ambiente() → { lluvia, viento, invierno, otono }, bajoTecho(), cercaDelFuego(),
//        distanciaAldea(x, z), pelarPasto(x, z, r) → devolver }
export function crearNaturalezaJuego(ctx) {
  const { T, veg, sonido } = ctx;
  const mundo = crearNaturalezaMundo({ escena: ctx.escena, T });
  const marco = marcoAldea();
  const est = () => {
    const p = ctx.progreso();
    if (!p.naturaleza || typeof p.naturaleza !== 'object') p.naturaleza = sanearNaturaleza(p.naturaleza);
    return p.naturaleza;
  };
  const dir = { x: 0, z: -1, pitch: 0 };
  function mirar() {
    const cam = ctx.camara(), js = ctx.jugador()?.estado;
    if (cam) { const e = cam.matrixWorld.elements; dir.x = -e[8]; dir.z = -e[10]; const l = Math.hypot(dir.x, dir.z) || 1; dir.x /= l; dir.z /= l; dir.pitch = Math.asin(Math.max(-1, Math.min(1, -e[9]))); }
    else if (js) { dir.x = -Math.sin(js.yaw); dir.z = -Math.cos(js.yaw); dir.pitch = js.pitch || 0; }
    return dir;
  }
  const fuente = (p, vol = 1, rev = 0.3) => sonido.fuente?.({ x: p.x, y: p.y ?? 0, z: p.z }, vol, rev);
  // el roce de las hojas: dos o tres soplos de ruido agudo
  function roce(p, fuerza = 1) {
    const d = fuente(p, 1, 0.25);
    if (!d) return;
    const n = 2 + Math.round(fuerza * 2);
    for (let k = 0; k < n; k++) sonido.golpeRuido({ dur: 0.18 + Math.random() * 0.25, frec: 2400 + Math.random() * 2400, q: 0.7, vol: 0.05 * fuerza, destino: d, cuando: k * (0.06 + Math.random() * 0.08) });
  }
  function plof(p, fuerza = 0.4) { sonido.chapoteo?.({ x: p.x, y: p.y ?? 0, z: p.z }, fuerza); }

  // ---------------------------------------------------------------- lo de cada lugar (se arma cada tanto, no por cuadro)
  const piedras = new Map();   // id → piedrita (con su estado si la pateaste)
  const listaPiedras = [];
  const pilas = [];
  let cadaRevisar = 0, ultimoX = 1e9, ultimoZ = 1e9;
  const sueloPiedra = (x, z) => {
    if (T.agua(x, z) || ctx.distanciaAldea(x, z) < 6) return null;
    const k = T.indice(x, z);
    if (T.distSendero[k] < 2.6 || T.distRiel[k] < 3) return 'piedra';
    if (T.bosque[k] > 0.55) return 'pina';
    // la orilla: hay agua a un par de metros
    if (T.agua(x + 2, z) || T.agua(x - 2, z) || T.agua(x, z + 2) || T.agua(x, z - 2)) return 'piedra';
    return null;
  };
  const lugarLena = (x, z) => {
    if (T.agua(x, z) || ctx.distanciaAldea(x, z) < 20) return false;
    const k = T.indice(x, z);
    return T.bosque[k] > NATURALEZA.bosqueLena && T.distSendero[k] > 3 && T.distRiel[k] > 5 && T.pendiente[k] < 0.6;
  };
  function revisarLugar(px, pz) {
    ultimoX = px; ultimoZ = pz;
    // piedritas y piñas a la vista (las pateadas quedan donde cayeron mientras sigas cerca)
    const C = NATURALEZA.celdaPiedra, R = NATURALEZA.vistaPiedra, vistos = new Set();
    for (let i = Math.floor((px - R) / C); i <= Math.floor((px + R) / C); i++) for (let j = Math.floor((pz - R) / C); j <= Math.floor((pz + R) / C); j++) {
      const id = `p${i}_${j}`;
      let p = piedras.get(id);
      if (!p) {
        const d = piedritaDe(i, j, sueloPiedra);
        if (!d) continue;
        p = { ...d, y: T.altura(d.x, d.z), vx: 0, vy: 0, vz: 0, mueve: false, fuera: false };
        piedras.set(id, p);
      }
      vistos.add(id);
    }
    for (const [id, p] of piedras) if (!vistos.has(id) && !p.mueve) piedras.delete(id);
    listaPiedras.length = 0;
    for (const p of piedras.values()) if (Math.hypot(p.x - px, p.z - pz) < R + 3) listaPiedras.push(p);
    // la leña suelta del bosque
    pilas.length = 0;
    const L = NATURALEZA.celdaLena, V = NATURALEZA.vistaLena, e = est(), dia = ctx.dia();
    for (let i = Math.floor((px - V) / L); i <= Math.floor((px + V) / L); i++) for (let j = Math.floor((pz - V) / L); j <= Math.floor((pz + V) / L); j++) {
      const l = pilaDeLena(i, j, lugarLena);
      if (!l || lenaTomada(e, l.id, dia) || Math.hypot(l.x - px, l.z - pz) > V) continue;
      pilas.push({ ...l, y: T.altura(l.x, l.z) });
    }
  }

  // ---------------------------------------------------------------- las piedritas que se patean
  function moverPiedras(dt, js) {
    for (const p of listaPiedras) {
      if (p.fuera) continue;
      if (!p.mueve) {
        if (!js.enSuelo || js.nadando || js.montado) continue;
        const k = patea({ dx: p.x - js.pos.x, dz: p.z - js.pos.z, vx: js.vel.x, vz: js.vel.z });
        if (!k) continue;
        p.vx = k.vx; p.vz = k.vz; p.vy = k.vy; p.mueve = true; p.rodar = 0;
        sonido.impacto?.(p.tipo === 'pina' ? 'tronco' : 'piedra', { pos: { x: p.x, y: p.y, z: p.z }, tamaño: 0.25, dureza: 0.9, fuerza: 0.4, vol: 0.22, capasMax: 2 });
        continue;
      }
      p.vy -= 9.8 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.rx = (p.rx || 0) + Math.hypot(p.vx, p.vz) * dt * 8;
      const ag = T.agua(p.x, p.z);
      if (ag && p.y <= ag.nivel) {
        // al agua: el plof y las ondas, y se hunde
        mundo.anillo(p.x, p.z, ag.nivel, { radio: 0.7 }); mundo.salpicar(p.x, ag.nivel, p.z, 4, 0.5); plof({ x: p.x, y: ag.nivel, z: p.z }, 0.25);
        p.fuera = true; p.mueve = false; continue;
      }
      const h = T.altura(p.x, p.z);
      if (p.y <= h) {
        p.y = h;
        if (p.vy < -1.2) sonido.impacto?.(p.tipo === 'pina' ? 'tronco' : 'piedra', { pos: { x: p.x, y: p.y, z: p.z }, tamaño: 0.2, dureza: 0.8, fuerza: 0.2, vol: 0.1, capasMax: 1 });
        p.vy = Math.abs(p.vy) > 1.2 ? -p.vy * 0.3 : 0;
        const fr = Math.exp(-(p.tipo === 'pina' ? 3.5 : 2.4) * dt);
        p.vx *= fr; p.vz *= fr;
        if (Math.hypot(p.vx, p.vz) < 0.08 && p.vy === 0) p.mueve = false;
      }
    }
  }

  // ---------------------------------------------------------------- las ranas de la orilla
  const ranas = [];
  for (let k = 0; k < NATURALEZA.ranas; k++) ranas.push({ visible: false, x: 0, y: 0, z: 0, giro: 0, espera: k * 1.3, salto: 0, ax: 0, az: 0, bx: 0, bz: 0, nivel: 0 });
  function buscarOrilla(px, pz) {
    for (let t = 0; t < 10; t++) {
      const a = Math.random() * 6.28, d = 6 + Math.random() * (NATURALEZA.radioRanas - 6);
      const x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
      if (T.agua(x, z)) continue;
      for (let s = 0; s < 6; s++) {
        const b = (s / 6) * 6.28, ag = T.agua(x + Math.cos(b) * 1.3, z + Math.sin(b) * 1.3);
        if (ag) return { x, z, bx: x + Math.cos(b) * 1.6, bz: z + Math.sin(b) * 1.6, nivel: ag.nivel, giro: Math.atan2(Math.cos(b), Math.sin(b)) };
      }
    }
    return null;
  }
  function moverRanas(dt, js, amb) {
    const hay = amb.invierno < 0.5;
    for (const r of ranas) {
      if (!hay) { r.visible = false; continue; }
      if (r.salto > 0) {
        r.salto += dt;
        const u = Math.min(1, r.salto / 0.55);
        r.x = r.ax + (r.bx - r.ax) * u; r.z = r.az + (r.bz - r.az) * u;
        r.y = r.y0 + (r.nivel - r.y0) * u + Math.sin(u * Math.PI) * 0.45;
        r.rx = -0.6 + u * 1.2;
        if (u >= 1) {
          mundo.anillo(r.x, r.z, r.nivel, { radio: 0.6 }); mundo.salpicar(r.x, r.nivel, r.z, 3, 0.4); plof({ x: r.x, y: r.nivel, z: r.z }, 0.18);
          r.visible = false; r.salto = 0; r.espera = 8 + Math.random() * 10;
        }
        continue;
      }
      if (!r.visible) {
        r.espera -= dt;
        if (r.espera > 0) continue;
        const o = buscarOrilla(js.pos.x, js.pos.z);
        if (!o) { r.espera = 3; continue; }
        Object.assign(r, o, { visible: true, y: T.altura(o.x, o.z), rx: 0, esc: 1.7 + Math.random() * 0.5 });   // (una rana grande del mallín: a escala real casi no se veía)
        continue;
      }
      const d = Math.hypot(r.x - js.pos.x, r.z - js.pos.z);
      if (d > NATURALEZA.radioRanas + 8) { r.visible = false; r.espera = 1; continue; }
      if (d < (js.corriendo ? NATURALEZA.asustaRanaCorriendo : NATURALEZA.asustaRana) && !js.agachado) {
        r.salto = 0.0001; r.ax = r.x; r.az = r.z; r.y0 = r.y;
        if (Math.random() < 0.5) sonido.ranita?.({ x: r.x, y: r.y, z: r.z });
      }
    }
  }

  // ---------------------------------------------------------------- mojado
  let mojado = 0, relojGota = 0, gotas = 0, avisoEmpapado = 0, estabaNadando = false;
  function secarse(dt, js, amb) {
    const prof = js.superficie === 'agua' ? (T.agua(js.pos.x, js.pos.z)?.prof || 0) : 0;
    mojado = mojarse(mojado, dt, { nadando: !!js.nadando, prof, lluvia: amb.lluvia, bajoTecho: ctx.bajoTecho(), fuego: ctx.cercaDelFuego() });
    if (estabaNadando && !js.nadando && mojado > 0.9 && avisoEmpapado <= 0) { ctx.nota('Quedaste empapado', 'Vas a gotear un rato; junto al fuego te secás más rápido'); avisoEmpapado = 600; }
    estabaNadando = !!js.nadando;
    avisoEmpapado -= dt;
    if (js.nadando || js.enKayak || js.enTren) return;
    const cada = cadaGota(mojado);
    if (!Number.isFinite(cada)) return;
    relojGota -= dt;
    if (relojGota > 0) return;
    relojGota = cada * (0.6 + Math.random() * 0.8);
    const d = mirar(), lado = (Math.random() - 0.5) * 0.5;
    // la gota cae de la manga y del borde de la campera: adelante tuyo, a la altura de la cintura (se ve mirando para abajo)
    mundo.gotear(js.pos.x + d.x * 0.32 - d.z * lado, js.pos.y + 0.95 + Math.random() * 0.25, js.pos.z + d.z * 0.32 + d.x * lado);
    if (++gotas % 3 === 0) { const f = fuente({ x: js.pos.x, y: js.pos.y, z: js.pos.z }, 0.5, 0.1); if (f) sonido.golpeRuido({ dur: 0.04, frec: 2600 + Math.random() * 1600, q: 6, vol: 0.05 * mojado, destino: f, cuando: 0.35 }); }
  }

  // ---------------------------------------------------------------- las matas que se mueven al pasar
  const ultimoRoce = new Map();
  let relojRoce = 0, reloj = 0;
  function rozarMatas(dt, js) {
    relojRoce -= dt;
    if (relojRoce > 0) return;
    relojRoce = 0.2;
    if (!js.enSuelo || js.nadando || js.montado || (js.velocidadActual || 0) < 1) return;
    const lista = veg.matasCerca?.(js.pos.x, js.pos.z, 2.2);
    if (!lista) return;
    for (const m of lista) {
      if (!tiene(ARBUSTOS, m.tipo) || m.sacado) continue;
      const r = 0.55 + (m.esc || 1) * 0.45;
      if (Math.hypot(m.x - js.pos.x, m.z - js.pos.z) > r) continue;
      if (reloj - (ultimoRoce.get(m) ?? -99) < NATURALEZA.pasoMata) continue;
      ultimoRoce.set(m, reloj);
      if (ultimoRoce.size > 64) ultimoRoce.delete(ultimoRoce.keys().next().value);
      veg.sacudirMata?.(m, js.corriendo ? 0.7 : 0.45, js.pos);
      roce({ x: m.x, y: js.pos.y + 0.6, z: m.z }, js.corriendo ? 0.8 : 0.5);
      if (Math.random() < 0.5) mundo.hojas(m.x, T.altura(m.x, m.z), m.z, 2, { radio: 0.4, alto: 0.7 });
      break;
    }
  }

  // ---------------------------------------------------------------- el sapito (la piedra en vuelo)
  let piedraEnVuelo = null;
  const extra = [];
  function tirarPiedra(js, hit) {
    const e = est(), amb = ctx.ambiente();
    const saltos = saltosSapito(Math.random, { agachado: !!js.agachado, corriendo: !!js.corriendo, viento: amb.viento || 0 });
    const d = mirar(), piques = piquesSapito(saltos + 1, 3.4 + Math.random() * 1.6);   // (el último pique es donde se hunde)
    piedraEnVuelo = { t: 0, x0: js.pos.x + d.x * 0.4, y0: js.pos.y + 1.1, z0: js.pos.z + d.z * 0.4, dx: d.x, dz: d.z, nivel: hit.nivel, borde: hit.borde, piques, k: 0, saltos, x: 0, y: 0, z: 0 };
    sonido.lanzar?.();
    const nuevo = anotarSapito(e, saltos);
    piedraEnVuelo.nuevo = nuevo;
    piedraEnVuelo.record = e.sapitoRecord;
    ctx.guardar();
  }
  // la piedra va del ojo al primer pique en vuelo; después de pique en pique, cada salto más corto y más bajo
  function moverPiedraEnVuelo(dt) {
    extra.length = 0;
    const p = piedraEnVuelo;
    if (!p) return;
    p.t += dt;
    const V = 11;   // m/s a lo largo del agua
    const marcas = [0, ...p.piques.map((q) => p.borde + q)];
    const s = Math.min(marcas[marcas.length - 1], p.t * V);
    let i = 0;
    while (i < marcas.length - 2 && s > marcas[i + 1]) i++;
    const a = marcas[i], b = marcas[i + 1], u = b > a ? Math.min(1, (s - a) / (b - a)) : 1;
    const alto = i === 0 ? 0 : 0.5 * Math.pow(0.7, i - 1) * (b - a) / 3;
    const yA = i === 0 ? p.y0 : p.nivel + 0.02;
    p.x = p.x0 + p.dx * s; p.z = p.z0 + p.dz * s;
    p.y = yA + (p.nivel + 0.02 - yA) * u + (i === 0 ? Math.sin(u * Math.PI) * 0.6 : Math.sin(u * Math.PI) * alto);
    // cada vez que pasa una marca: pica (o se hunde en la última)
    while (p.k < marcas.length - 1 && s >= marcas[p.k + 1]) {
      p.k++;
      const x = p.x0 + p.dx * marcas[p.k], z = p.z0 + p.dz * marcas[p.k];
      const ultimo = p.k === marcas.length - 1;
      mundo.anillo(x, z, p.nivel, { radio: ultimo ? 1.1 : 0.75 });
      mundo.salpicar(x, p.nivel, z, ultimo ? 6 : 3, ultimo ? 0.6 : 0.35);
      plof({ x, y: p.nivel, z }, ultimo ? 0.35 : 0.14);
      if (ultimo) {
        const t = textoSapito(p.saltos, p.record, p.nuevo);
        ctx.nota(t.titulo, t.texto);
        piedraEnVuelo = null;
        return;
      }
    }
    extra.push({ x: p.x, y: p.y, z: p.z, rx: p.t * 30, ry: 0, esc: 0.8 });
  }

  // ---------------------------------------------------------------- lo que hace la E
  const pastos = new Map();   // los manojos arrancados que vuelven a crecer: devolver() a las tantas horas
  let horasJugadas = 0;
  let esperaE = 0;
  const amancayes = [];
  let amancayListos = false;
  function amancayCerca(px, pz) {
    if (!amancayListos) { amancayListos = true; for (const it of ctx.objetos?.items || []) if (it.tipo === 'amancay') amancayes.push(it); }
    let mejor = null, md = 2.2;
    for (const it of amancayes) {
      if (it.tomado) continue;
      const dx = it.x - px, dz = it.z - pz;
      if (Math.abs(dx) > md || Math.abs(dz) > md) continue;
      const d = Math.hypot(dx, dz);
      if (d < md) { md = d; mejor = it; }
    }
    return mejor;
  }
  // el agua adelante: dónde empieza (metros) y cuánta hay seguida
  function aguaAdelante(js, d, hasta) {
    for (let s = 0.4; s <= hasta; s += 0.3) {
      const ag = T.agua(js.pos.x + d.x * s, js.pos.z + d.z * s);
      if (ag) return { borde: s, nivel: ag.nivel, x: js.pos.x + d.x * s, z: js.pos.z + d.z * s, lago: ag.lago };
    }
    return null;
  }
  function aguaSeguida(js, d, desde, largo) {
    let faltan = 0;
    for (let s = desde; s <= desde + largo; s += 1.5) if (!T.agua(js.pos.x + d.x * s, js.pos.z + d.z * s) && ++faltan > 1) return false;
    return true;
  }

  function candidatos(js) {
    const d = mirar(), c = {}, px = js.pos.x, pz = js.pos.z, amb = ctx.ambiente();
    if (!js.enSuelo || js.nadando || js.sentado) return c;
    // el agua: agachado o mirando para abajo, tocarla; mirando al frente, el sapito
    const enAguaBaja = js.superficie === 'agua';
    if (d.pitch < -0.3 && (js.agachado || enAguaBaja)) {
      const ag = enAguaBaja ? { x: px + d.x * 0.5, z: pz + d.z * 0.5, nivel: T.agua(px, pz)?.nivel ?? js.pos.y } : aguaAdelante(js, d, NATURALEZA.alcanceToque);
      if (ag) c.tocarAgua = { ...ag };
    } else if (d.pitch > -0.45 && amb.invierno < 0.85) {
      const ag = aguaAdelante(js, d, NATURALEZA.alcanceOrilla);
      if (ag && aguaSeguida(js, d, ag.borde + 1, NATURALEZA.aguaLibre)) c.sapito = { ...ag };
    }
    // la leña suelta
    for (const l of pilas) {
      const dd = Math.hypot(l.x - px, l.z - pz);
      if (dd < NATURALEZA.alcanceLena && mirando(px, pz, d.x, d.z, l.x, l.z) > NATURALEZA.mira) { c.lena = { pila: l, lleno: (ctx.ramitas() || 0) >= NATURALEZA.topeRamitas }; break; }
    }
    // el amancay ya anotado
    const prog = ctx.progreso();
    if (prog.entradas?.amancay) {
      const it = amancayCerca(px, pz);
      if (it && mirando(px, pz, d.x, d.z, it.x, it.z) > 0.8) c.flor = { it };
    }
    // los arbustos y los pastos (anotados: si no, la E anota)
    const matas = veg.matasCerca?.(px, pz, 3.2) || [];
    let mejorM = null, mejorP = null, md = Infinity, mp = Infinity;
    for (const m of matas) {
      if (m.sacado || m.despejado) continue;
      const dd = Math.hypot(m.x - px, m.z - pz);
      if (mirando(px, pz, d.x, d.z, m.x, m.z) < NATURALEZA.mira) continue;
      if (tiene(PASTOS, m.tipo) && dd < 1.6 && dd < mp) { mp = dd; mejorP = m; }
      else if (tiene(ARBUSTOS, m.tipo) && dd < NATURALEZA.alcanceMata + (m.esc || 1) * 0.3 && dd < md) { md = dd; mejorM = m; }
    }
    if (mejorM) c.arbusto = { mata: mejorM, tipo: mejorM.tipo };
    // un árbol chico
    for (const a of veg.arbolesCerca?.(px, pz, 4) || []) {
      if (a.sacado || a.caido || !tiene(ARBOLES_CHICOS, a.especie) || !((a.esc || 1) <= NATURALEZA.arbolChico)) continue;
      if (Math.hypot(a.x - px, a.z - pz) - (a.r || 0.4) > NATURALEZA.alcanceArbol) continue;
      if (mirando(px, pz, d.x, d.z, a.x, a.z) < NATURALEZA.mira) continue;
      c.arbol = { arbol: a, especie: a.especie };
      break;
    }
    // el pasto, agachado y mirando al suelo (fuera de la nieve); o el coirón
    if (mejorP && (js.agachado || d.pitch < -0.35)) c.pasto = { mata: mejorP, tipo: mejorP.tipo, x: mejorP.x, z: mejorP.z };
    else if (js.agachado && d.pitch < -0.45 && amb.invierno < 0.5) {
      const x = px + d.x * 0.8, z = pz + d.z * 0.8, k = T.indice(x, z);
      if (T.pasto[k] > 0.5 && !T.agua(x, z) && T.distSendero[k] > 1.8 && ctx.distanciaAldea(x, z) > 4) c.pasto = { x, z };
    }
    return c;
  }
  function accion(js) {
    if (!js) return null;
    const t = elegirToque(candidatos(js));
    if (!t) return null;
    return { ...t, hacer: () => hacer(t, js) };
  }

  function hacer(t, js) {
    if (esperaE > 0) return;
    esperaE = 0.35;
    const amb = ctx.ambiente(), dia = ctx.dia();
    switch (t.id) {
      case 'tocarAgua': {
        // (las ondas nacen un poco más adentro, donde la mano toca: en la orilla misma el anillo se metía en la arena)
        const d0 = mirar(), ox = t.x + d0.x * 0.35, oz = t.z + d0.z * 0.35;
        for (let k = 0; k < 3; k++) mundo.anillo(ox, oz, t.nivel, { radio: 0.55 + k * 0.3, vida: 1.6 + k * 0.3, demora: k * 0.22 });
        mundo.salpicar(ox, t.nivel, oz, 3, 0.3);
        plof({ x: t.x, y: t.nivel, z: t.z }, 0.12);
        if (amb.invierno > 0.5) ctx.nota('El agua está helada', 'Se te entumecen los dedos');
        break;
      }
      case 'sapito': {
        if (piedraEnVuelo) return;
        tirarPiedra(js, t);
        break;
      }
      case 'lena': {
        if (t.lleno) { ctx.nota('Ya llevás doce ramitas', 'Hacé un fuego con F o dejalas en la leñera'); break; }
        const n = juntarLena(est(), t.pila.id, dia, ctx.ramitas());
        if (!n) break;
        ctx.sumarRamitas(n);
        sonido.juntar?.();
        roce({ x: t.pila.x, y: t.pila.y, z: t.pila.z }, 0.6);
        const total = ctx.ramitas();
        ctx.nota(`${total} ${total === 1 ? 'ramita' : 'ramitas'}`, 'Leña seca del piso del bosque: mañana vuelve a haber');
        revisarLugar(js.pos.x, js.pos.z);
        ctx.guardar();
        break;
      }
      case 'flor': {
        if (!ctx.objetos?.arrancar?.(t.it)) break;
        mundo.hojas(t.it.x, t.it.y ?? T.altura(t.it.x, t.it.z), t.it.z, 6, { radio: 0.2, alto: 0.5, forma: 'petalo' });
        roce({ x: t.it.x, y: js.pos.y + 0.3, z: t.it.z }, 0.3);
        ctx.nota('Arrancaste un amancay', 'Te lo ponés en el ojal: el perfume te dura un rato');
        ctx.guardar();
        break;
      }
      case 'arbusto': {
        const m = t.mata, y0 = T.altura(m.x, m.z), cae = loQueCae(m.tipo, amb);
        veg.sacudirMata?.(m, 1, js.pos);
        roce({ x: m.x, y: y0 + 0.7, z: m.z }, 1);
        { const dx = js.pos.x - m.x, dz = js.pos.z - m.z, dd = Math.hypot(dx, dz) || 1;   // (del lado tuyo de la mata: las de atrás las tapaba la mata misma)
          mundo.hojas(m.x + (dx / dd) * 0.45, y0 + 0.5, m.z + (dz / dd) * 0.45, cae.hojas, { radio: 0.35 + (m.esc || 1) * 0.2, alto: 1.0 + (m.esc || 1) * 0.5 }); }
        if (cae.nieve) mundo.nieve(m.x, y0 + 0.6, m.z, cae.nieve, 0.7);
        if (cae.pajaros && Math.random() < 0.45) { mundo.pajaros(m.x, y0 + 0.5, m.z, 1 + Math.floor(Math.random() * 3), js.pos.x, js.pos.z); sonido.ave?.({ x: m.x, y: y0 + 1, z: m.z }); }
        if (cae.fruto && m.frutoDia !== dia && Math.random() < 0.7 && ctx.cabeJuntar(cae.fruto, 1)) {
          m.frutoDia = dia;
          ctx.registrar(cae.fruto, true);
          ctx.nota('Cayeron unos frutos de calafate', 'Los juntaste en la mano: van a la mochila');
        }
        break;
      }
      case 'arbol': {
        const a = t.arbol, y0 = a.y ?? T.altura(a.x, a.z), alto = 2.4 * (a.esc || 1);
        veg.sacudir?.(a);
        roce({ x: a.x, y: y0 + alto, z: a.z }, 1.2);
        const invierno = amb.invierno > 0.5;
        mundo.hojas(a.x, y0 + alto * 0.55, a.z, invierno ? 4 : amb.otono > 0.5 ? 28 : 16, { radio: 1.1, alto: alto * 0.5 });
        if (invierno) mundo.nieve(a.x, y0 + alto * 0.7, a.z, 34, 1.3);
        if (!invierno && Math.random() < 0.6) { mundo.pajaros(a.x, y0 + alto * 0.7, a.z, 2 + Math.floor(Math.random() * 3), js.pos.x, js.pos.z); sonido.ave?.({ x: a.x, y: y0 + alto, z: a.z }); }
        break;
      }
      case 'pasto': {
        const x = t.x, z = t.z, clave = `${Math.round(x / 2)}_${Math.round(z / 2)}`;
        if (t.mata) veg.sacudirMata?.(t.mata, 0.8, js.pos);
        else if (!pastos.has(clave)) { const devolver = ctx.pelarPasto(x, z, 1.3); if (devolver) pastos.set(clave, { devolver, hasta: horasJugadas + NATURALEZA.horasPasto }); }
        mundo.hojas(x, T.altura(x, z), z, 7, { radio: 0.25, alto: 0.25 });
        const f = fuente({ x, y: T.altura(x, z), z }, 1, 0.1);
        if (f) { sonido.golpeRuido({ dur: 0.22, frec: 1800, q: 0.9, vol: 0.09, destino: f }); sonido.golpeRuido({ dur: 0.12, frec: 900, q: 1.4, vol: 0.06, destino: f, cuando: 0.08 }); }
        break;
      }
    }
  }

  // ---------------------------------------------------------------- al pisar y al zambullirse
  function enCalle(x, z) {
    if (ctx.distanciaAldea(x, z) > 0) return false;
    const l = marco.aLocal(x, z);
    for (const c of CALLES_ALDEA) if (distanciaACalle(l.lx, l.lz, c) < 0) return true;
    return false;
  }
  function alPaso(js, fuerza) {
    const k = T.indice(js.pos.x, js.pos.z);
    const sup = superficiePaso(js.superficie, { distRiel: T.distRiel[k], enCalle: (js.superficie === 'tierra' || js.superficie === 'hojarasca' || js.superficie === 'pasto') && enCalle(js.pos.x, js.pos.z) });
    if (js.superficie === 'agua' && !js.nadando) {
      const ag = T.agua(js.pos.x, js.pos.z);
      // (el pie que entra va un poco adelante de los ojos: debajo de la cámara no se veía nada)
      const v = Math.hypot(js.vel?.x || 0, js.vel?.z || 0) || 1, ax = js.pos.x + ((js.vel?.x || 0) / v) * 0.7, az = js.pos.z + ((js.vel?.z || 0) / v) * 0.7;
      if (ag) mundo.salpicar(ax, ag.nivel, az, js.corriendo ? 18 : 10, js.corriendo ? 1 : 0.6);
    }
    if (crujeRama(js.superficie, T.bosque[k], Math.random())) sonido.chasquido?.({ x: js.pos.x, y: js.pos.y, z: js.pos.z });
    return sup;
  }
  function alChapuzon(js) {
    const ag = T.agua(js.pos.x, js.pos.z);
    if (!ag) return;
    mundo.salpicar(js.pos.x, ag.nivel, js.pos.z, 18, 1.2);
    mundo.anillo(js.pos.x, js.pos.z, ag.nivel, { radio: 1.6 });
    mundo.anillo(js.pos.x, js.pos.z, ag.nivel, { radio: 2.2, demora: 0.25 });
  }

  // ---------------------------------------------------------------- cada cuadro
  const _vacio = [];
  function actualizar(dt) {
    const js = ctx.jugador()?.estado;
    if (!js) return;
    reloj += dt;
    esperaE -= dt;
    const amb = ctx.ambiente();
    horasJugadas = ctx.dia() * 24 + ctx.horas();
    for (const [k, p] of pastos) if (horasJugadas >= p.hasta) { try { p.devolver(); } catch {} pastos.delete(k); }
    cadaRevisar -= dt;
    if (cadaRevisar <= 0 || Math.hypot(js.pos.x - ultimoX, js.pos.z - ultimoZ) > 3) { cadaRevisar = 0.5; revisarLugar(js.pos.x, js.pos.z); }
    moverPiedras(dt, js);
    moverRanas(dt, js, amb);
    secarse(dt, js, amb);
    rozarMatas(dt, js);
    moverPiedraEnVuelo(dt);
    mundo.actualizar(dt, { piedras: listaPiedras, pilas, ranas, extra: extra.length ? extra : _vacio });
  }

  return {
    accion, actualizar, alPaso, alChapuzon, mundo,
    mojado: () => mojado,
    _debug: { piedras: listaPiedras, pilas, ranas, candidatos, hacer, est, ponerMojado: (v) => { mojado = v; }, enCalle },
  };
}
