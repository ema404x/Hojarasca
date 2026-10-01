// Modo Desafío: las defensas que hacen algo además de estorbar.
// Antorchas (luz real y fuego que la lluvia o un bruto apagan), campana de alarma,
// pozo con estacas, red de cristal, barril de resina, escudo de energía, baliza de
// sanación y torre de vigía. Las estacas y las ballestas viven en desafio.js.
import * as THREE from 'three';
import { brilloTitileo, TITILEO_APAGON } from './desafio-noche2.js';
import { registrarLuz } from './luces.js';

export function crearDefensasActivas(T, escena, obras, sonido, efectos, api, opciones = {}) {
  const tipoDe = (o) => o.plano.defensa?.tipo;
  const completa = (o) => o.datos.etapas > 0;
  let antorchas = [], campanas = [], pozos = [], redes = [], barriles = [], escudos = [], balizas = [], torres = [], fosos = [];
  function refrescar() {
    antorchas = []; campanas = []; pozos = []; redes = []; barriles = []; escudos = []; balizas = []; torres = []; fosos = [];
    for (const o of obras.obras) {
      if (!completa(o)) continue;
      switch (tipoDe(o)) {
        case 'antorcha': antorchas.push(o); break;
        case 'campana': campanas.push(o); break;
        case 'pozo': pozos.push(o); break;
        case 'foso': fosos.push(o); break;
        case 'red': redes.push(o); break;
        case 'barril': barriles.push(o); break;
        case 'escudo': escudos.push(o); break;
        case 'baliza': balizas.push(o); break;
        case 'torre': torres.push(o); break;
      }
    }
    // llamas y cúpulas se cuelgan del grupo de su obra: si la obra cae, se van con ella
    for (const o of antorchas) if (!o.userLlama) crearLlama(o);
    for (const o of escudos) if (!o.userCupula) crearCupula(o);
  }

  // ---------------- antorchas
  const matLlama = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const matHalo = new THREE.MeshBasicMaterial({ color: '#ff9a3d', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const matCharco = new THREE.MeshBasicMaterial({ color: '#ffb066', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  const geoLlama = new THREE.ConeGeometry(0.13, 0.42, 7);
  const geoHalo = new THREE.SphereGeometry(0.55, 10, 8);
  const geoCharco = new THREE.CircleGeometry(4.5, 24).rotateX(-Math.PI / 2);
  function crearLlama(o) {
    const g = new THREE.Group();
    const y = o.plano.defensa.llamaY;
    const llama = new THREE.Mesh(geoLlama, matLlama); llama.position.y = y + 0.18;
    const nucleo = new THREE.Mesh(geoLlama, matLlama); nucleo.position.y = y + 0.1; nucleo.scale.set(0.6, 0.7, 0.6);
    const halo = new THREE.Mesh(geoHalo, matHalo); halo.position.y = y + 0.15;
    // "charco" de luz sobre el suelo: se ve aunque no haya una luz real asignada
    const charco = new THREE.Mesh(geoCharco, matCharco); charco.position.y = 0.06;
    g.add(llama, nucleo, halo, charco);
    o.grupo.add(g);
    o.userLlama = { g, llama, nucleo, halo, charco, fase: Math.random() * 10 };
  }
  // Pocas luces reales (según calidad) que se asignan a las antorchas más cercanas al
  // jugador. La cantidad no cambia nunca: así no se recompilan los shaders.
  const luces = [];
  // 1.4: una luz menos por calidad; el charco de luz falso cubre el resto sin costo
  const cantLuces = { muybaja: 0, baja: 1, media: 2, alta: 3 }[opciones.calidad] ?? 2;
  for (let i = 0; i < cantLuces; i++) {
    const l = new THREE.PointLight(0xff9a45, 0, 16, 1.6);
    l.position.set(0, -500, 0);
    escena.add(l);
    registrarLuz(l);   // 2.7.4: ver luces.js
    luces.push(l);
  }
  const encendida = (o) => !o.datos.apagada;
  function apagar(o, motivo) {
    if (o.datos.apagada) return;
    o.datos.apagada = true;
    efectos?.polvo({ x: o.datos.x, y: o.datos.y + 2.1, z: o.datos.z }, 6, '#6d6a66');
    if (motivo === 'bruto') api.nota('Un bruto apagó una antorcha', 'Acercate y prendela de nuevo con F');
    // 2.3: el volador baja en picada y la apaga (se avisa una vez cada tanto)
    if (motivo === 'volador' && (performance.now() - (apagar.ultimoVolador || -1e9)) > 20000) {
      apagar.ultimoVolador = performance.now();
      api.nota('Un volador apagó una antorcha', 'Vienen por el aire a buscar las llamas. F la vuelve a prender; la ballesta al cielo los baja');
    }
    if (motivo === 'apagon') {
      // 2.0: la noche sin luces. Nadie a la vista: la llama se ahoga con un soplido.
      sonido.golpeRuido?.({ dur: 0.7, frec: 900, q: 0.5, tipo: 'lowpass', vol: 0.3, destino: sonido.fuente?.(o.datos, 1, 0.6), buffer: sonido.ruido });
      sonido.golpeRuido?.({ dur: 0.35, frec: 3800, q: 0.7, vol: 0.08, destino: sonido.fuente?.(o.datos, 1, 0.6), cuando: 0.05 });
      api.oir?.('apagon', o.datos);
    }
  }
  // 2.0: antes de apagarse en la noche sin luces, la llama tiembla un momento (ver
  // `desafio-noche2.js`). Si ya está temblando o apagada, no hace nada.
  function titilarYApagar(o) {
    if (!o || o.datos.apagada || o.userTitileo > 0) return false;
    o.userTitileo = 0.0001;
    return true;
  }
  // 2.4.1: para el aviso (F): ¿hay una antorcha apagada al alcance? No toca nada.
  function apagadaCerca(pos, radio = 2.6) {
    return antorchas.some((o) => !encendida(o) && Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < radio);
  }
  function encenderCerca(pos, radio = 2.6) {
    let mejor = null, d0 = radio;
    for (const o of antorchas) {
      if (encendida(o)) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    if (!mejor) return false;
    if (api.clima().lluvia > 0.55) { api.nota('Con esta lluvia no prende', 'Esperá a que afloje'); return true; }
    mejor.datos.apagada = false;
    efectos?.fuego({ x: mejor.datos.x, y: mejor.datos.y + mejor.plano.defensa.llamaY, z: mejor.datos.z }, 1.2);
    sonido.encender?.();
    return true;
  }
  let avisoLluvia = false, acumLuces = 9;
  function actualizarAntorchas(dt, js, noche) {
    const lluvia = api.clima().lluvia > 0.55;
    if (lluvia && antorchas.some(encendida)) {
      for (const o of antorchas) apagar(o, 'lluvia');
      if (!avisoLluvia) { avisoLluvia = true; api.nota('La lluvia apagó las antorchas', 'Cuando pare, prendelas de nuevo con F'); }
    }
    if (!lluvia) avisoLluvia = false;
    for (const o of antorchas) {
      const L = o.userLlama; if (!L) continue;
      const on = encendida(o);
      L.g.visible = on;
      if (!on) continue;
      L.fase += dt;
      let tiembla = 1;
      if (o.userTitileo > 0) {
        o.userTitileo += dt;
        tiembla = brilloTitileo(o.userTitileo);
        if (o.userTitileo >= TITILEO_APAGON) { o.userTitileo = 0; apagar(o, 'apagon'); L.g.visible = false; continue; }
      }
      o.userBrillo = tiembla;
      const f = (0.85 + Math.sin(L.fase * 11) * 0.08 + Math.sin(L.fase * 17.3) * 0.06) * tiembla;
      L.llama.scale.set(1, f * 1.1, 1);
      L.llama.rotation.y = L.fase * 2;
      // el halo y el charco de luz sólo se notan con poca luz: de día serían una mancha
      L.halo.visible = noche > 0.25;
      L.halo.scale.setScalar((0.55 + f * 0.12) * (0.6 + noche * 0.4));
      L.charco.visible = noche > 0.3;
      matCharco.opacity = noche * 0.16;
      matHalo.opacity = Math.max(0, noche - 0.25) * 0.3;
    }
    acumLuces += dt;
    if (acumLuces > 0.4) {
      acumLuces = 0;
      const lista = antorchas.filter(encendida).sort((a, b) =>
        Math.hypot(a.datos.x - js.pos.x, a.datos.z - js.pos.z) - Math.hypot(b.datos.x - js.pos.x, b.datos.z - js.pos.z));
      luces.forEach((l, i) => {
        const o = lista[i];
        l.userData.obra = o || null;
        if (o) l.position.set(o.datos.x, o.datos.y + o.plano.defensa.llamaY + 0.2, o.datos.z);
        else l.position.set(0, -500, 0);
      });
    }
    for (const l of luces) {
      const o = l.userData.obra;
      l.intensity = o && encendida(o) ? (6 + Math.sin(performance.now() / 70 + l.id) * 0.8) * (0.25 + noche * 0.75) * (o.userBrillo ?? 1) : 0;
    }
  }
  // Los invasores (menos los brutos) esquivan la luz: devuelve un empuje lateral.
  function repulsionLuz(p, salida) {
    salida.x = 0; salida.z = 0;
    for (const o of antorchas) {
      if (!encendida(o)) continue;
      const dx = p.x - o.datos.x, dz = p.z - o.datos.z, d = Math.hypot(dx, dz);
      if (d < 7 && d > 0.01) { const k = (7 - d) / 7 / d; salida.x += dx * k; salida.z += dz * k; }
    }
    return salida;
  }
  function antorchaCercaDe(p, radio = 2.2) {
    for (const o of antorchas) if (encendida(o) && Math.hypot(o.datos.x - p.x, o.datos.z - p.z) < radio) return o;
    return null;
  }

  // ---------------- campana de alarma
  const silencioCampana = new Map();
  function actualizarCampanas(dt) {
    for (const o of campanas) {
      const t = (silencioCampana.get(o) || 0) - dt;
      silencioCampana.set(o, t);
      if (t > 0) continue;
      for (const a of api.aliens) {
        if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar') continue;
        const p = a.m.g.position;
        if (Math.hypot(p.x - o.datos.x, p.z - o.datos.z) > o.plano.defensa.radio) continue;
        silencioCampana.set(o, 25);
        for (let i = 0; i < 3; i++) setTimeout(() => sonido.campana?.({ x: o.datos.x, y: o.datos.y + 2, z: o.datos.z }), i * 450);
        api.nota('¡Suena la campana!', `Invasores ${api.rumboTexto(o.datos, p)} de la base`, true);
        break;
      }
    }
  }

  // ---------------- trampas que actúan sobre cada invasor
  const rearme = new Map();
  let consumidos = [];
  function afectarAlien(a, dt) {
    const p = a.m.g.position;
    let freno = 1;
    for (const o of redes) {
      const f = o.plano.defensa;
      if (Math.hypot(o.datos.x - p.x, o.datos.z - p.z) < f.radio) {
        freno = Math.min(freno, f.freno);
        o.datos.vida = (o.datos.vida ?? o.plano.vida) - f.desgaste * dt;
        if (o.datos.vida <= 0) consumidos.push(o);
      }
    }
    for (const o of pozos) {
      if ((rearme.get(o) || 0) > 0) continue;
      const f = o.plano.defensa;
      if (Math.hypot(o.datos.x - p.x, o.datos.z - p.z) < f.radio && a.tipo !== 'bruto') {
        a.atrapadoT = f.atrapa; a.atrapadoDps = f.dps;
        rearme.set(o, f.rearme);
        efectos?.polvo({ x: o.datos.x, y: o.datos.y + 0.2, z: o.datos.z }, 10, '#6b5238');
        sonido.golpeRuido?.({ dur: 0.35, frec: 260, tipo: 'lowpass', vol: 0.5, destino: sonido.fuente?.(p, 1) });
      }
    }
    // 1.6: el foso con estacas. A diferencia del pozo redondo, es una zanja larga que se
    // pone a lo largo del paso: no atrapa a nadie, pero el que la cruza se clava y sale
    // renqueando. Se gasta con cada invasor que pasa, hasta que hay que volver a cavarla.
    for (const o of fosos) {
      const f = o.plano.defensa;
      if ((o.datos.usos ?? f.usos) <= 0) continue;
      const dx = p.x - o.datos.x, dz = p.z - o.datos.z, rot = o.datos.rot || 0;
      // a coordenadas de la pieza (la inversa de mundoDesdeLocal)
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot);
      const lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      const dentro = Math.abs(lx) <= f.largo / 2 && Math.abs(lz) <= f.ancho / 2;
      if (!dentro) { a.enFoso?.delete(o); continue; }
      freno = Math.min(freno, f.freno);
      a.enFoso = a.enFoso || new Set();
      if (a.enFoso.has(o)) continue;
      a.enFoso.add(o);
      o.datos.usos = (o.datos.usos ?? f.usos) - 1;
      // los pesados lo cruzan de una zancada: se llevan menos
      api.herirAlien(a, f.dano * (a.tipo === 'jefe' ? 0.25 : a.tipo === 'bruto' ? 0.6 : 1), { x: o.datos.x, z: o.datos.z }, 'foso');
      efectos?.polvo({ x: p.x, y: o.datos.y + 0.25, z: p.z }, 8, '#6b5238');
      sonido.golpeRuido?.({ dur: 0.28, frec: 320, tipo: 'lowpass', vol: 0.45, destino: sonido.fuente?.(p, 1) });
      if (o.datos.usos <= 0) {
        api.nota('El foso quedó deshecho', 'Las estacas se partieron: se puede volver a cavar (O → Defensa)');
        consumidos.push(o);
      }
    }
    for (const o of barriles) {
      const f = o.plano.defensa;
      if (o.estallado || Math.hypot(o.datos.x - p.x, o.datos.z - p.z) > f.radio) continue;
      estallar(o);
    }
    return freno;
  }
  function estallar(o) {
    o.estallado = true;
    const f = o.plano.defensa, c = { x: o.datos.x, y: o.datos.y + 0.6, z: o.datos.z };
    efectos?.explosion(c, f.estallido);
    sonido.golpeRuido?.({ dur: 1.2, frec: 140, tipo: 'lowpass', vol: 0.9, destino: sonido.fuente?.(c, 1.4) });
    sonido.golpeRuido?.({ dur: 0.5, frec: 900, vol: 0.4, destino: sonido.fuente?.(c, 1) });
    for (const a of api.aliens) {
      if (a.estado === 'morir' || a.estado === 'irse') continue;
      const d = Math.hypot(a.m.g.position.x - c.x, a.m.g.position.z - c.z);
      if (d < f.estallido) api.herirAlien(a, f.dano * (1 - d / f.estallido * 0.6), c, 'trampa');
    }
    const js = api.jugador().estado;
    const dj = Math.hypot(js.pos.x - c.x, js.pos.z - c.z);
    if (dj < f.estallido * 0.8) api.herirJugador(30 * (1 - dj / f.estallido), c);
    consumidos.push(o);
  }

  // 2.5: una flecha incendiaria o una granada cerca de un barril lo hace estallar
  function estallarCerca(pos, radio) {
    let n = 0;
    for (const o of barriles) {
      if (o.estallado || Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) > radio + 0.5) continue;
      estallar(o); n++;
    }
    return n;
  }
  // ---------------- escudo de energía
  const matCupula = new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  function crearCupula(o) {
    const r = o.plano.defensa.radio;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), matCupula.clone());
    m.visible = false;
    o.grupo.add(m);
    o.userCupula = { m, golpe: 0 };
  }
  // Al empezar la noche cada escudo consume un cristal para encenderse.
  function alEmpezarNoche() {
    let sinCristal = 0;
    for (const o of escudos) {
      if (api.cuanto('cristal') >= 1) { api.gastar('cristal', 1); o.datos.escudoActivo = true; }
      else { o.datos.escudoActivo = false; sinCristal++; }
    }
    if (sinCristal) api.nota('Un escudo quedó apagado', 'Cada generador necesita un cristal por noche');
  }
  function alAmanecer() { for (const o of escudos) o.datos.escudoActivo = false; }
  // Cuánto del daño llega a la obra: los escudos activos absorben la mitad.
  function factorDanoObra(obra) {
    for (const o of escudos) {
      if (!o.datos.escudoActivo) continue;
      if (Math.hypot(obra.datos.x - o.datos.x, obra.datos.z - o.datos.z) < o.plano.defensa.radio) {
        if (o.userCupula) o.userCupula.golpe = 1;
        return 1 - o.plano.defensa.absorbe;
      }
    }
    return 1;
  }
  function actualizarEscudos(dt) {
    for (const o of escudos) {
      const c = o.userCupula; if (!c) continue;
      c.m.visible = !!o.datos.escudoActivo;
      c.golpe = Math.max(0, c.golpe - dt * 2);
      c.m.material.opacity = 0.05 + c.golpe * 0.2 + Math.sin(performance.now() / 500) * 0.015;
    }
  }

  // ---------------- baliza y torre
  function actualizarBalizas(dt, js) {
    for (const o of balizas) {
      const f = o.plano.defensa;
      if (Math.hypot(js.pos.x - o.datos.x, js.pos.z - o.datos.z) < f.radio) api.curar(f.cura * dt, true);
    }
  }
  // Si el jugador está arriba de una torre, sus disparos rinden más.
  function jugadorEnTorre(js) {
    for (const o of torres) {
      const dx = js.pos.x - o.datos.x, dz = js.pos.z - o.datos.z;
      if (Math.hypot(dx, dz) < 1.5 && js.pos.y > o.datos.y + o.plano.defensa.altura - 0.4) return o;
    }
    return null;
  }

  let acum = 9;
  function actualizar(dt, js, noche) {
    acum += dt;
    if (acum > 1) { acum = 0; refrescar(); }
    // 2.6.1: el pozo ya rearmado sale del mapa (antes quedaban para siempre, también los derribados)
    for (const [o, t] of rearme) { if (t - dt > 0) rearme.set(o, t - dt); else rearme.delete(o); }
    actualizarAntorchas(dt, js, noche);
    actualizarCampanas(dt);
    actualizarEscudos(dt);
    actualizarBalizas(dt, js);
    if (consumidos.length) {
      for (const o of consumidos) api.destruirObra(o, tipoDe(o) === 'barril');
      consumidos = [];
      refrescar();
    }
  }

  return {
    apagadaCerca, estallarCerca,
    actualizar, refrescar, afectarAlien, repulsionLuz, antorchaCercaDe, apagar, encenderCerca, factorDanoObra, titilarYApagar,
    get prendidas() { return antorchas.filter(encendida); },
    alEmpezarNoche, alAmanecer, jugadorEnTorre,
    get antorchas() { return antorchas; },
  };
}
