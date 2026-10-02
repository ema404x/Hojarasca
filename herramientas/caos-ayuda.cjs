// 3.5.4: la ayuda del caos que corre en la página (la usan herramientas/caos-largo.cjs y
// pruebas/humo-3-5-4-caos.cjs). Se manda como texto con `(${AYUDA.toString()})()` después de cada
// carga (con ?debug=1) y deja window.__caosAyuda: accion(nombre, semilla) hace una acción con
// entradas de verdad (teclas, mouse, rueda, mando, menús…), revisar() junta lo que está mal
// (NaN, estados imposibles) y drenar() lo que anotó la sonda (caos-preload.cjs).
// Se inyecta después de cada carga. `accion(nombre, semilla)` hace una acción con entradas de
// verdad; `revisar()` junta lo que está mal.
function AYUDA() {
  if (window.__caosAyuda) return 1;
  const H = window.__hojarasca;
  const $ = (id) => document.getElementById(id);
  const dormirMs = (ms) => new Promise((r) => setTimeout(r, ms));
  const lienzo = $('mundo');
  let r = Math.random;
  const sembrar = (n) => { let x = (n >>> 0) || 1; r = () => { x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0; return x / 4294967296; }; };
  const uno = (l) => l[Math.floor(r() * l.length)];
  const entre = (a, b) => a + Math.floor(r() * (b - a + 1));
  const oculto = (id) => !$(id) || $(id).classList.contains('oculto');
  const cuadros = async (n = 3) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormirMs(12); } };
  // con CAOS_DETALLE, en esos pasos se anota cómo queda todo después de cada tecla o clic
  const velos = () => [...document.querySelectorAll('section.velo, #inicio, #foto-panel, #valle-tarjeta')].filter((e) => !e.classList.contains('oculto')).map((e) => e.id);
  const instante = (que) => { if (window.__caosDetalle) window.__caosDetalle.push(`${que} → modo ${H.__caidas.modo()} · a la vista: ${velos().join(',') || 'nada'} · foto ${H.__foto().activo}`); };
  const abajoSolo = (code, shift = false) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, shiftKey: shift, bubbles: true, cancelable: true }));
  const abajo = (code, shift = false) => { abajoSolo(code, shift); instante(`${shift ? 'Shift+' : ''}${code}`); };
  const arriba = (code, shift = false) => document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, shiftKey: shift, bubbles: true, cancelable: true }));
  const tecla = async (code, n = 2, shift = false) => { abajo(code, shift); await cuadros(n); arriba(code, shift); await cuadros(1); };
  const raton = (tipo, boton, x = 512, y = 320) => {
    const o = { button: boton, buttons: tipo === 'mouseup' ? 0 : (boton === 2 ? 2 : 1), bubbles: true, cancelable: true, clientX: x, clientY: y };
    lienzo.dispatchEvent(new MouseEvent(tipo, o));
  };
  const soltarTodo = () => { for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyZ', 'Space', 'KeyC', 'ArrowUp', 'ArrowDown']) arriba(c); raton('mouseup', 0); raton('mouseup', 2); };
  const j = () => H.jugador.estado;
  const P = () => H.progreso;
  const D = () => H.desafio;
  const modo = () => H.__caidas.modo();
  const materiales = () => { const m = P().materiales; for (const k of ['tronco', 'tabla', 'piedra', 'cristal', 'lana', 'hierro', 'cuero', 'arcilla']) m[k] = Math.max(m[k] || 0, 40); P().ramitas = Math.max(P().ramitas || 0, 6); };
  // lo que no se toca con un clic al azar: cierra la ventana, baja archivos o abre carpetas
  const PROHIBIDO = /salir|export|import|descarg|archivo|album|álbum|carpeta|sync|banco|copiar|guardar-foto|foto-guardar/i;
  const visible = (el) => { const b = el.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return false; for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.classList?.contains('oculto')) return false; const st = getComputedStyle(n); if (st.display === 'none' || st.visibility === 'hidden') return false; } return true; };
  const clicables = () => [...document.querySelectorAll('button, [data-valor], [data-accion], [data-guia], li, .ranura, [role=button], input[type=range], select')]
    .filter((el) => !el.disabled && visible(el) && !PROHIBIDO.test(`${el.id} ${el.className} ${Object.keys(el.dataset).join(' ')} ${(el.textContent || '').slice(0, 40)}`) && !el.closest('#hud-barra-x'));
  const clicEn = (el) => {
    if (el.tagName === 'INPUT' && el.type === 'range') {
      const min = Number(el.min || 0), max = Number(el.max || 100); el.value = String(min + (max - min) * r());
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return `rango ${el.id || el.dataset.ajusteRango || el.dataset.foto || ''}=${(+el.value).toFixed(2)}`;
    }
    if (el.tagName === 'SELECT') { el.selectedIndex = Math.floor(r() * el.options.length); el.dispatchEvent(new Event('change', { bubbles: true })); return `select ${el.id}`; }
    const b = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, button: 0 };
    el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); el.dispatchEvent(new MouseEvent('click', o));
    const donde = el.closest('[id]')?.id || '';
    const txt = `clic "${(el.id || el.dataset.valor || el.textContent || el.tagName).toString().trim().slice(0, 30)}"${donde && donde !== el.id ? ` en #${donde}` : ''}`;
    instante(txt);
    return txt;
  };
  const TECLAS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'KeyE', 'KeyE', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyH', 'KeyY', 'KeyB', 'KeyT',
    'KeyV', 'KeyR', 'KeyO', 'Tab', 'BracketLeft', 'BracketRight', 'KeyX', 'Backspace', 'Delete', 'KeyN', 'KeyQ', 'KeyM', 'KeyP', 'KeyZ',
    'KeyI', 'KeyJ', 'KeyL', 'KeyU', 'KeyK', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'ShiftLeft',
    'F1', 'F2', 'F3', 'F5', 'ArrowUp', 'ArrowLeft', 'Enter', 'ControlLeft'];
  const ARMAS = ['ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'arco', 'boleadoras', 'lanza', 'honda', 'pistola'];
  const PIEZAS = ['muro-tronera', 'catapulta', 'troncos-colgantes', 'cerco-cristal', 'puente-levadizo', 'espejo-faro', 'senuelo', 'trampa-lazo', 'abrojos', 'embudo', 'puesto-tirador', 'antorcha', 'empalizada', 'muro-piedra', 'zanja-fuego'];
  // un lugar al azar: cerca de algo conocido, la orilla del lago, una obra o cualquier parte
  const lugarAlAzar = () => {
    const L = H.T.lugares, q = r(), a = r() * 6.283, d = r();
    const claves = Object.keys(L).filter((k) => L[k] && typeof L[k].x === 'number');
    if (q < 0.5 && claves.length) { const l = L[uno(claves)]; return { x: l.x + Math.cos(a) * 7 * d, z: l.z + Math.sin(a) * 7 * d, y: null, que: 'lugar' }; }
    if (q < 0.65) return { x: 150 + Math.cos(a) * (90 + 40 * d), z: 110 + Math.sin(a) * (90 + 40 * d), y: null, que: 'orilla' };
    if (q < 0.8 && H.obras.obras.length) { const o = uno(H.obras.obras); return { x: o.datos.x + 0.3, z: o.datos.z, y: o.datos.y ?? null, que: 'obra ' + o.plano.id }; }
    if (q < 0.88) { const p = uno(H.tren.paradas); return { x: p.anden.x, z: p.anden.z, y: null, que: 'andén' }; }
    return { x: Math.cos(a) * 460 * d, z: Math.sin(a) * 460 * d, y: null, que: 'cualquiera' };
  };
  const ir = (l) => { if (j().enKayak || j().enTren || j().montado || j().enCable) return false; H.jugador.ubicar(l.x, l.z, r() * 6.28, l.y); return true; };

  const ACCIONES = {
    async tecla() { const t = uno(TECLAS), n = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ArrowUp'].includes(t) ? entre(3, 20) : entre(1, 3); const sh = r() < 0.12; await tecla(t, n, sh); return `${sh ? 'Shift+' : ''}${t} ×${n}`; },
    async caminar() {
      const n = entre(10, 50), corre = r() < 0.4, lado = r() < 0.3 ? uno(['KeyA', 'KeyD']) : null;
      abajo('KeyW'); if (corre) abajo('ShiftLeft'); if (lado) abajo(lado);
      for (let i = 0; i < n; i++) { if (r() < 0.05) await tecla('Space', 1); H.__bucle(); await dormirMs(12); }
      arriba('KeyW'); arriba('ShiftLeft'); if (lado) arriba(lado); await cuadros(2);
      return `caminar ${n} cuadros${corre ? ' corriendo' : ''}${lado ? ' + ' + lado : ''}`;
    },
    async clic() {
      const b = r() < 0.65 ? 0 : 2, sostener = r() < 0.3 ? entre(4, 25) : 1;
      raton('mousedown', b); window.dispatchEvent(new MouseEvent('mousedown', { button: b, bubbles: true }));
      await cuadros(sostener);
      raton('mouseup', b); await cuadros(2);
      return `clic ${b ? 'derecho' : 'izquierdo'} ${sostener} cuadros`;
    },
    async rueda() { const n = entre(1, 6), dy = r() < 0.5 ? 120 : -120; for (let i = 0; i < n; i++) window.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, bubbles: true })); await cuadros(2); return `rueda ${n}×${dy}`; },
    async mirar() {
      const dx = (r() - 0.5) * 1600, dy = (r() - 0.5) * 600;
      raton('mousedown', 0, 500, 300);
      for (let i = 0; i < 5; i++) document.dispatchEvent(new MouseEvent('mousemove', { movementX: dx / 5, movementY: dy / 5, bubbles: true }));
      document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
      if (r() < 0.5) { j().yaw += (r() - 0.5) * 3; j().pitch = Math.max(-1.4, Math.min(1.4, j().pitch + (r() - 0.5))); }
      await cuadros(2); return `mirar ${dx.toFixed(0)},${dy.toFixed(0)}`;
    },
    async salto() { const l = lugarAlAzar(); soltarTodo(); const ok = ir(l); await cuadros(4); return `salto a ${l.que} (${l.x.toFixed(0)}, ${l.z.toFixed(0)})${ok ? '' : ' (no: en vehículo)'}`; },
    async hora() { const h = Math.floor(r() * 96) / 4; P().horas = h; await cuadros(3); return `hora ${h}`; },
    async apurarTiempo() { const n = entre(20, 90); for (let i = 0; i < n; i++) { P().horas = (P().horas + 0.05) % 24; H.__bucle(); if (i % 10 === 0) await dormirMs(10); } return `pasan ${(n * 0.05).toFixed(1)} horas a los saltos`; },
    async ajustes() {
      // la pausa de verdad (Esc) y un ajuste cualquiera, en vivo
      if (modo() === 'jugando') await tecla('Escape', 1);
      await dormirMs(450);
      const botones = [...document.querySelectorAll('#pausa [data-ajuste] button[data-valor], #pausa [data-ajuste-rango], #pausa #ajuste-distancia')].filter(visible);
      const hechos = [];
      for (let i = 0, n = entre(1, 4); i < n && botones.length; i++) hechos.push(clicEn(uno(botones)));
      await cuadros(3);
      // (sólo si se ve: un botón oculto no lo aprieta nadie)
      if (r() < 0.8 && modo() === 'pausa') { if (visible($('btn-seguir'))) clicEn($('btn-seguir')); else await tecla('Escape', 1); await cuadros(2); }
      return `pausa → ${hechos.join(', ') || 'nada'}`;
    },
    async panel() {
      // un panel cualquiera (mochila, cuaderno, mapa, pausa, guía, logros, personalizar…) y clics al azar adentro
      const abrir = uno(['KeyI', 'KeyJ', 'KeyM', 'Escape', 'F1', 'F5', 'KeyK', 'KeyN', null]);
      if (abrir && modo() === 'jugando') await tecla(abrir, 1);
      await dormirMs(450);
      const hechos = [abrir || '-'];
      for (let i = 0, n = entre(1, 6); i < n; i++) {
        const l = clicables(); if (!l.length) break;
        hechos.push(clicEn(uno(l))); await cuadros(1); await dormirMs(40);
      }
      if (r() < 0.6) { await tecla('Escape', 1); hechos.push('Esc'); }
      return `panel ${hechos.join(' → ')}`;
    },
    async mochila() {
      if (modo() !== 'jugando') return 'mochila (no: no se juega)';
      await tecla('KeyI', 1); await dormirMs(200);
      const l = [...document.querySelectorAll('#mochila *')].filter((e) => visible(e) && (e.matches('button, li, [data-id], [data-i], .casilla, .ranura') || e.onclick));
      const hechos = [];
      for (let i = 0, n = entre(1, 5); i < n && l.length; i++) hechos.push(clicEn(uno(l)));
      if (r() < 0.5) { const sl = [...document.querySelectorAll('.ranura, #barra *')].filter(visible); if (sl.length) hechos.push(clicEn(uno(sl))); }
      await cuadros(2);
      if (r() < 0.7) await tecla(r() < 0.5 ? 'KeyI' : 'Escape', 1);
      if (r() < 0.4) await tecla('KeyU', 1);
      return `mochila: ${hechos.join(', ')}`;
    },
    async obra() {
      if (modo() !== 'jugando') return 'obra (no: no se juega)';
      materiales();
      const hechos = [];
      await tecla('KeyO', 1); hechos.push('O');
      for (let i = 0, n = entre(2, 10); i < n; i++) {
        const t = uno(['Tab', 'Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'BracketRight', 'BracketLeft', 'KeyY', 'KeyY', 'KeyY', 'KeyR', 'rueda', 'Backspace', 'Delete', 'ShiftDelete', 'ShiftY', 'KeyN', 'KeyX', 'KeyT', 'KeyW', 'Escape']);
        if (t === 'rueda') window.dispatchEvent(new WheelEvent('wheel', { deltaY: r() < 0.5 ? 120 : -120 }));
        else if (t === 'ShiftDelete') await tecla('Delete', 1, true);
        else if (t === 'ShiftY') await tecla('KeyY', 1, true);
        else if (t === 'KeyW') await tecla('KeyW', entre(3, 10));
        else await tecla(t, 1);
        hechos.push(t); await cuadros(1);
      }
      if (r() < 0.75 && modo() === 'jugando') { await tecla('KeyO', 1); hechos.push('O'); }
      return `obra: ${hechos.join(' ')}`;
    },
    async vehiculo() {
      if (modo() !== 'jugando') return 'vehículo (no: no se juega)';
      soltarTodo();
      const q = uno(['kayak', 'caballo', 'tren', 'cabina', 'velero', 'tirolesa', 'bajar']);
      const js = j(); let hecho = q;
      try {
        if (q === 'bajar') { await tecla('KeyE', 1); }
        else if (js.enKayak || js.enTren || js.montado || js.enCable) { hecho = 'ya en algo: E'; await tecla('KeyE', 1); }
        else if (q === 'kayak') { H.jugador.ubicar(H.kayak.est.x + 1.2, H.kayak.est.z, 0); await cuadros(2); await tecla('KeyE', 1); }
        else if (q === 'caballo') { P().cosas.caballo = 1; const d = H.dondeEstaElCaballo(); H.jugador.ubicar(d.x + 1, d.z, 0); await cuadros(2); await tecla('KeyE', 1); }
        else if (q === 'tren' || q === 'cabina') {
          const p = H.tren.paradas.find((x) => Math.hypot(x.anden.x - H.tren.est.pos?.x, x.anden.z - H.tren.est.pos?.z) < 30) || uno(H.tren.paradas);
          H.jugador.ubicar(p.anden.x, p.anden.z, 0); await cuadros(3);
          if (q === 'cabina' && !H.desafio) H.__subirALaCabina(); else await tecla('KeyE', 1);
        } else if (q === 'velero') {
          const v = H.__vela(); if (v?.est?.hay) { H.jugador.ubicar(v.est.x + 1.5, v.est.z, 0); await cuadros(2); await tecla('KeyE', 1); } else hecho = 'velero (no hay)';
        } else if (q === 'tirolesa') {
          const o = H.obras.obras.find((x) => /tirolesa|puente/.test(x.plano.id)); if (o) { H.jugador.ubicar(o.datos.x + 0.8, o.datos.z, 0); await cuadros(2); await tecla('KeyE', 1); } else hecho = 'tirolesa (no hay)';
        }
      } catch (e) { hecho += ' (tiró: ' + e.message + ')'; throw e; }
      // manejar un rato, con el aviso y E en el medio
      const n = entre(10, 60);
      abajo(uno(['KeyW', 'KeyW', 'KeyS'])); if (r() < 0.5) abajo(uno(['KeyA', 'KeyD'])); if (r() < 0.3) abajo('ShiftLeft');
      for (let i = 0; i < n; i++) { H.__bucle(); await dormirMs(12); if (r() < 0.03) await tecla(uno(['KeyE', 'Space', 'KeyC', 'Escape', 'KeyZ']), 1); }
      soltarTodo(); await cuadros(2);
      if (r() < 0.5) await tecla('KeyE', 1);
      const e = j();
      return `${hecho} → kayak ${!!e.enKayak} tren ${!!e.enTren} montado ${!!e.montado} cable ${!!e.enCable} (${n} cuadros)`;
    },
    async pesca() {
      if (modo() !== 'jugando') return 'pesca (no)';
      const l = { x: 150 + 88, z: 110, y: null }; if (r() < 0.6) ir(l);
      await tecla('KeyQ', 1);
      for (let i = 0, n = entre(1, 5); i < n; i++) { raton('mousedown', 0); await cuadros(entre(1, 20)); raton('mouseup', 0); await cuadros(entre(1, 15)); if (r() < 0.2) await tecla('KeyX', 1); }
      if (r() < 0.7) await tecla('KeyQ', 1);
      return 'pesca';
    },
    async foto() {
      if (modo() !== 'jugando') return 'foto (no)';
      await tecla('F2', 1); await cuadros(2);
      const hechos = [];
      for (let i = 0, n = entre(0, 5); i < n; i++) { const l = [...document.querySelectorAll('#foto-controles input, #foto-controles button, #foto-controles [data-foto]')].filter((e) => visible(e) && !PROHIBIDO.test(e.id + ' ' + e.textContent)); if (l.length) hechos.push(clicEn(uno(l))); await cuadros(1); }
      if (r() < 0.5) { abajo('KeyW'); await cuadros(entre(2, 10)); arriba('KeyW'); }
      if (r() < 0.5) await tecla('KeyP', 1);
      if (r() < 0.2) await tecla('KeyE', 1);
      await cuadros(2);
      if (r() < 0.85) await tecla(r() < 0.5 ? 'F2' : 'Escape', 1);
      return `foto: ${hechos.join(', ')}`;
    },
    async dormir() {
      if (modo() !== 'jugando') return 'dormir (no)';
      P().horas = uno([21.5, 22, 23.5, 2, 5.9]); P().ramitas = Math.max(P().ramitas, 4); P().cosas.manta = 1;
      await tecla('KeyF', 1); await cuadros(2); await tecla('KeyE', 1);
      if (r() < 0.4) { await dormirMs(200); await tecla(uno(['KeyE', 'Escape', 'KeyW', 'KeyI']), 1); }
      await dormirMs(entre(300, 2800)); await cuadros(3);
      return `dormir a las ${P().horas.toFixed(1)}`;
    },
    async materiales() { materiales(); P().cosas.harina = (P().cosas.harina || 0) + 1; P().cosas.yerba = (P().cosas.yerba || 0) + 1; return 'materiales'; },
    async charla() {
      // buscar a alguien y hablar (E, E, E, Esc)
      if (modo() !== 'jugando' || !H.gente) return 'charla (no)';
      const L = H.T.lugares, k = uno(Object.keys(L).filter((x) => /casa|almacen|estacion|feria|refugio|muelle|pueblo/.test(x))) || 'refugio';
      ir({ x: L[k].x + 2, z: L[k].z + 2, y: null }); await cuadros(3);
      for (let i = 0, n = entre(1, 6); i < n; i++) { await tecla(uno(['KeyE', 'KeyE', 'Digit1', 'Digit2', 'Escape', 'KeyW']), 1); await cuadros(2); }
      return `charla cerca de ${k}`;
    },
    async valle() {
      // los eventos y la historia del valle (en ?debug=1 no salen solos: se los empuja)
      if (D() || !H.__valle || modo() !== 'jugando') return 'valle (no)';
      const q = r(); let h = '';
      if (q < 0.2) { H.__valle.empezar(); h = 'empezar la historia'; }
      else if (q < 0.3) { H.__valle.pausar(); h = 'pausar la historia'; }
      else { H.__valle.revisarAhora(); h = 'revisar ahora'; }
      await cuadros(3); await dormirMs(200);
      const l = clicables().filter((e) => e.closest('.valle-tarjeta, [class*=valle], [id*=valle]'));
      if (l.length && r() < 0.8) h += ' → ' + clicEn(uno(l));
      else if (r() < 0.3) await tecla(uno(['Escape', 'KeyE', 'Digit1', 'Enter']), 1);
      await cuadros(2);
      return `${h} (modo ${modo()})`;
    },
    async carrera() {
      if (D() || modo() !== 'jugando') return 'carrera (no)';
      const id = uno(['estepa', 'pampa', 'mirador', 'faro', 'lago', 'regata']);
      try { H.__modos().__.largar(id); } catch (e) { return `carrera ${id} no larga: ${e.message}`; }
      const n = entre(10, 80);
      abajo('KeyW'); if (r() < 0.5) abajo('ShiftLeft');
      for (let i = 0; i < n; i++) { H.__bucle(); await dormirMs(12); if (r() < 0.03) await tecla(uno(['KeyE', 'Escape', 'KeyM', 'KeyA']), 1); }
      soltarTodo(); await cuadros(2);
      return `carrera ${id} (${n} cuadros, ${JSON.stringify(H.__modos().__.estado().carrera?.fase || null)})`;
    },
    async vecinos() {
      if (D() || modo() !== 'jugando') return 'vecinos (no)';
      const q = uno(['rastro', 'dejarRastro', 'poblador', 'pueblo', 'visitas', 'rayo', 'hacha', 'carpa', 'renoval']);
      if (q === 'rastro') H.pedirRastro();
      else if (q === 'dejarRastro') H.dejarRastro('Dejaste el rastro', 'El perro vuelve con vos');
      else if (q === 'poblador') H.__pueblo.llamar();
      else if (q === 'pueblo') H.__pueblo.actualizar(entre(1, 60));
      else if (q === 'visitas') H.__actualizarVisitas(entre(1, 400));
      else if (q === 'rayo') H.caerRayo();
      else if (q === 'hacha') { for (let i = 0; i < entre(1, 8); i++) await tecla('KeyH', 2); }
      else if (q === 'carpa') await tecla('KeyT', 2);
      else if (q === 'renoval') await tecla('KeyB', 2);
      await cuadros(entre(2, 20));
      return q;
    },
    // ------------------------------------------------ Desafío
    async arma() {
      if (!D() || modo() !== 'jugando') return 'arma (no)';
      const a = uno(ARMAS);
      if (r() < 0.5) { const i = H.__ranuraActual(); await tecla(uno(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6']), 1); raton('mousedown', 0); await cuadros(entre(1, 15)); raton('mouseup', 0); await cuadros(2); return `ataque con la mano (${i})`; }
      if (a === 'arco' && r() < 0.5) { if (D().tensar()) { await cuadros(entre(1, 20)); D().soltarTension(); } }
      else D().atacar(a);
      await cuadros(3); return `arma ${a}`;
    },
    async pieza() {
      if (!D() || modo() !== 'jugando') return 'pieza (no)';
      const O = H.obras, js = j(), p = H.PLANOS.find((x) => x.id === uno(PIEZAS)); if (!p) return 'pieza (no existe)';
      materiales(); O.elegir(p);
      const f = O.fundar(js.pos.x - Math.sin(js.yaw) * 4, js.pos.z - Math.cos(js.yaw) * 4, js.yaw, js.pos.y);
      if (f.ok) for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) if (!O.avanzar(f.obra, P().materiales).ok) break;
      O.elegir(null); P().obras = O.obras.map((o) => o.datos);
      await tecla('KeyE', 1); await tecla('KeyF', 1);
      return `pieza ${p.id} ${f.ok ? 'armada' : 'no: ' + (f.motivo || '')}`;
    },
    async noche() {
      if (!D() || modo() !== 'jugando') return 'noche (no)';
      P().horas = uno([19.9, 20.6, 22, 1, 4, 5.95]);
      const n = entre(20, 140);
      for (let i = 0; i < n; i++) { D().actualizar(0.05, { noche: 1, dtReal: 0.05 }); if (i % 20 === 0) { H.__bucle(); await dormirMs(10); } }
      await cuadros(3); return `noche simulada ${n} pasos a las ${P().horas.toFixed(1)} (${D().aliens.length} invasores)`;
    },
    async herida() {
      if (!D() || modo() !== 'jugando') return 'herida (no)';
      const js = j(), dano = uno([5, 20, 60, 400]);
      if (r() < 0.3) { D().bloquear(true, 'facon'); D().herirJugador(dano, { x: js.pos.x + 1, z: js.pos.z }); D().bloquear(false); }
      else D().herirJugador(dano, r() < 0.3 ? null : { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z });
      await cuadros(3);
      if (D().caido) { for (let i = 0, n = entre(0, 4); i < n; i++) await tecla(uno(['KeyE', 'KeyW', 'Escape', 'KeyK', 'KeyI']), 1); await dormirMs(entre(0, 3500)); await cuadros(3); }
      return `herida ${dano}${D().caido ? ' (cayó)' : ''} salud ${P().desafio.salud}`;
    },
    async taller() {
      if (!D() || modo() !== 'jugando') return 'taller (no)';
      materiales();
      await tecla('KeyK', 1);
      const h = ['K'];
      for (let i = 0, n = entre(1, 6); i < n; i++) { const t = uno(['Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'KeyW', 'KeyI']); await tecla(t, 1); h.push(t); }
      if (r() < 0.7) await tecla(r() < 0.5 ? 'KeyK' : 'Escape', 1);
      return `taller ${h.join(' ')}`;
    },
    async nocheReal() {
      // una noche avanzada de verdad: con el bucle entero (no sólo el Desafío), peleando
      if (!D() || modo() !== 'jugando') return 'nocheReal (no)';
      const d = P().desafio; d.oleadas = entre(1, 24); d.especial = r() < 0.4 ? uno(['roja', 'eclipse', 'silenciosa', 'apagon']) : null; d.tutorial = 99;
      P().horas = uno([19.95, 20.5, 21.2, 23.8, 3.5, 5.97]);
      const n = entre(60, 260);
      for (let i = 0; i < n; i++) {
        P().desafio.salud = Math.max(P().desafio.salud, 30);
        H.__bucle(); if (i % 4 === 0) await dormirMs(8);
        if (r() < 0.04) await ACCIONES.arma();
        else if (r() < 0.02) await tecla(uno(['KeyE', 'KeyF', 'KeyA', 'KeyD', 'Space', 'KeyK', 'KeyI', 'Escape']), 1);
      }
      return `noche real ${n} cuadros, noche ${d.oleadas}${d.especial ? ' ' + d.especial : ''} (${D().aliens.length} invasores, horas ${P().horas.toFixed(2)})`;
    },
    async limites() {
      // los bordes del mundo: afuera del mapa, en lo alto, en el medio del lago, bajo el suelo
      if (j().enKayak || j().enTren || j().montado || j().enCable || modo() !== 'jugando' || H.__foto().activo) return 'límites (no)';
      const q = uno(['afuera', 'alto', 'lago', 'abajo', 'borde']);
      const js = j();
      if (q === 'afuera') H.jugador.ubicar(uno([-1, 1]) * (600 + r() * 600), uno([-1, 1]) * (600 + r() * 600), 0);
      else if (q === 'alto') { H.jugador.ubicar((r() - 0.5) * 600, (r() - 0.5) * 600, 0); js.pos.y += 120 + r() * 200; }
      else if (q === 'lago') H.jugador.ubicar(150 + (r() - 0.5) * 30, 110 + (r() - 0.5) * 30, 0);
      else if (q === 'abajo') { js.pos.y = H.T.altura(js.pos.x, js.pos.z) - 3 - r() * 20; }
      else H.jugador.ubicar(uno([-1, 1]) * 470, (r() - 0.5) * 900, 0);
      abajo('KeyW'); if (r() < 0.5) abajo('Space');
      await cuadros(entre(10, 40)); soltarTodo(); await cuadros(2);
      return `límites: ${q} → (${js.pos.x.toFixed(0)}, ${js.pos.y.toFixed(0)}, ${js.pos.z.toFixed(0)})`;
    },
    async mando() {
      // un mando de mentira (mapeo estándar): botones y palitos al azar unos cuadros; a veces se
      // desenchufa con todo apretado
      const pad = { id: 'Mando de prueba (caos)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
      const nativo = navigator.getGamepads;
      navigator.getGamepads = () => [pad];
      const n = entre(10, 60), h = [];
      for (let i = 0; i < n; i++) {
        if (r() < 0.3) { const b = entre(0, 16); const v = !pad.buttons[b].pressed; pad.buttons[b] = { pressed: v, touched: v, value: v ? 1 : 0 }; if (v) h.push('b' + b); }
        if (r() < 0.2) pad.axes = pad.axes.map(() => (r() < 0.5 ? 0 : (r() - 0.5) * 2));
        pad.timestamp++;
        H.__bucle(); await dormirMs(12);
      }
      const desenchufa = r() < 0.5;
      if (desenchufa) pad.connected = false; else { pad.buttons.forEach((b) => { b.pressed = false; b.value = 0; }); pad.axes = [0, 0, 0, 0]; }
      await cuadros(3);
      navigator.getGamepads = nativo; await cuadros(2);
      return `mando ${n} cuadros (${h.slice(0, 12).join(' ')})${desenchufa ? ' y desenchufado con todo apretado' : ''}`;
    },
    async foco() {
      // la ventana pierde el foco o se oculta (alt+tab, minimizar) en medio de algo
      const q = uno(['blur', 'oculta', 'ambos']);
      abajo(uno(['KeyW', 'KeyD', 'ShiftLeft'])); if (r() < 0.5) raton('mousedown', uno([0, 2]));
      await cuadros(entre(1, 6));
      if (q !== 'oculta') { window.dispatchEvent(new Event('blur')); }
      if (q !== 'blur') { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); }
      await cuadros(entre(1, 10));
      delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
      await cuadros(3);
      return `foco: ${q}`;
    },
    async repetir() {
      // una tecla mantenida que el sistema repite (keydown con repeat)
      const t = uno(['KeyE', 'KeyW', 'KeyY', 'KeyO', 'KeyI', 'Escape', 'KeyH', 'KeyF', 'Digit1', 'Tab', 'Space', 'KeyJ', 'KeyM']);
      abajo(t);
      for (let i = 0, n = entre(3, 25); i < n; i++) { document.dispatchEvent(new KeyboardEvent('keydown', { code: t, key: t, repeat: true, bubbles: true, cancelable: true })); H.__bucle(); await dormirMs(10); }
      arriba(t); await cuadros(2);
      return `tecla ${t} mantenida con repetición`;
    },
    async mapa() {
      // el mapa (M): clics en el papel (chinches), clic derecho (sacarlas), rueda y M o Esc
      if (modo() !== 'jugando') return 'mapa (no)';
      await tecla('KeyM', 1); await cuadros(1);
      const c = $('lienzo-mapa'); if (!c || !visible(c)) return 'mapa (no se abrió)';
      const b = c.getBoundingClientRect(), h = [];
      for (let i = 0, n = entre(1, 8); i < n; i++) {
        const o = { bubbles: true, cancelable: true, clientX: b.left + r() * b.width, clientY: b.top + r() * b.height, button: r() < 0.7 ? 0 : 2 };
        for (const t of ['mousedown', 'mouseup', 'click']) c.dispatchEvent(new MouseEvent(t, o));
        if (o.button === 2) c.dispatchEvent(new MouseEvent('contextmenu', o));
        h.push(o.button ? 'der' : 'izq');
        if (r() < 0.2) c.dispatchEvent(new WheelEvent('wheel', { deltaY: r() < 0.5 ? 120 : -120, bubbles: true, clientX: o.clientX, clientY: o.clientY }));
        await cuadros(1);
      }
      if (r() < 0.8) await tecla(r() < 0.5 ? 'KeyM' : 'Escape', 1);
      return `mapa: ${h.join(' ')}`;
    },
    async tienda() {
      // el almacén, la feria o el puesto de cargas de un andén: ir, E, números, Tab, E
      if (D() || modo() !== 'jugando' || j().enKayak || j().enTren || j().montado) return 'tienda (no)';
      const q = uno(['almacen', 'feria', 'cargas']);
      let l = null;
      if (q === 'almacen') l = H.est?.almacen?.mostrador;
      else if (q === 'feria') { l = H.__puestoFeria?.(); if (l) P().horas = 11; }
      else l = uno(H.tren.paradas)?.anden;
      if (!l) return `tienda ${q} (no hay)`;
      H.jugador.ubicar(l.x + 0.8, l.z + 0.8, r() * 6.28); await cuadros(3);
      const h = [];
      for (let i = 0, n = entre(2, 9); i < n; i++) { const t = uno(['KeyE', 'Digit1', 'Digit2', 'Digit3', 'Digit5', 'Digit9', 'Tab', 'Tab', 'KeyE', 'Escape', 'KeyW']); await tecla(t, 1); h.push(t); }
      return `tienda ${q}: ${h.join(' ')}`;
    },
    async dias() {
      // muchos días de golpe (las estaciones, la huerta, los rebrotes, el correo, las visitas)
      const n = entre(1, 40); P().dia += n; P().horas = r() * 24;
      await cuadros(entre(5, 30));
      return `+${n} días (día ${P().dia})`;
    },
    async nave() {
      // la nave del asedio y la Madre: subir, pelear un poco, bajar (si está)
      if (!D() || modo() !== 'jugando') return 'nave (no)';
      const A = D().asedio, N = D().naveAdentro;
      if (N?.adentro) { if (r() < 0.5) N.salir(); else for (const b of D().eventos.blancos().filter((b) => b.nave)) D().eventos.herirNucleo(b, uno([10, 99999])); await cuadros(3); return 'nave: adentro'; }
      if (A?.hazAbierto?.()) { const s = A.sitioHaz(); H.jugador.ubicar(s.x + 1, s.z + 1, 0, s.y); await tecla('KeyE', 1); await cuadros(4); return 'nave: sube por el haz'; }
      return 'nave (no hay haz)';
    },
  };
  const PESOS_RELAX = { tecla: 22, caminar: 12, clic: 6, rueda: 3, mirar: 6, salto: 8, hora: 3, apurarTiempo: 2, ajustes: 5, panel: 6, mochila: 4, obra: 7, vehiculo: 8, pesca: 3, foto: 3, dormir: 2, materiales: 2, charla: 4, valle: 3, carrera: 2, vecinos: 4, limites: 2, dias: 2, mando: 3, foco: 2, repetir: 2, mapa: 2, tienda: 3 };
  const PESOS_DESAFIO = { ...PESOS_RELAX, charla: 1, pesca: 1, valle: 0, carrera: 0, vecinos: 0, tienda: 0, arma: 8, pieza: 5, noche: 5, nocheReal: 4, herida: 4, taller: 3, nave: 1 };

  async function accion(nombre, semilla) {
    sembrar(semilla);
    if (!nombre) {
      const pesos = D() ? PESOS_DESAFIO : PESOS_RELAX;
      const lista = window.__caosSolo?.length ? window.__caosSolo.filter((k) => pesos[k]) : Object.keys(pesos);
      const total = lista.reduce((a, k) => a + pesos[k], 0);
      let x = r() * total; nombre = lista[lista.length - 1];
      for (const k of lista) { x -= pesos[k]; if (x <= 0) { nombre = k; break; } }
    }
    const desc = await ACCIONES[nombre]();
    soltarTodo();
    await cuadros(1);
    return `${nombre}: ${desc}`;
  }

  // ------------------------------------------------ lo que nunca puede pasar
  const finito = (...v) => v.every(Number.isFinite);
  const ruta = (o) => { const p = []; for (let n = o; n && p.length < 4; n = n.parent) p.push(n.name || n.type); return p.join('<'); };
  let vueltaInstancias = 0;
  function revisar(contexto = {}) {
    const mal = [];
    const js = j(), p = js.pos, cam = H.camara;
    if (!finito(p.x, p.y, p.z, js.yaw, js.pitch, js.vel.x, js.vel.y, js.vel.z)) mal.push('jugador no finito: ' + JSON.stringify({ x: p.x, y: p.y, z: p.z, yaw: js.yaw, pitch: js.pitch, vel: js.vel }));
    else if (!js.enTren && !js.nadando && !js.enKayak && !js.enCable && !H.__foto().activo && p.y < H.T.altura(p.x, p.z) - 1.5) mal.push('jugador bajo el suelo: ' + (p.y - H.T.altura(p.x, p.z)).toFixed(2));
    if (!finito(cam.position.x, cam.position.y, cam.position.z, cam.quaternion.x, cam.quaternion.w, cam.fov)) mal.push('cámara no finita');
    const pr = P();
    if (!finito(pr.horas, pr.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(pr.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push(`material ${k} = ${n}`);
    for (const [k, n] of Object.entries(pr.cosas || {})) if (typeof n === 'number' && (!Number.isFinite(n) || n < 0)) mal.push(`cosa ${k} = ${n}`);
    if (!Number.isFinite(pr.ramitas) || pr.ramitas < 0) mal.push('ramitas = ' + pr.ramitas);
    const Dd = pr.desafio;
    if (D() && Dd) {
      if (!Number.isFinite(Dd.salud) || Dd.salud < 0 || Dd.salud > 1000) mal.push('salud = ' + Dd.salud);
      for (const k of ['virotes', 'flechasFuego', 'flechasCristal', 'hachuelas', 'jabalinas', 'granadas', 'humos', 'bengalas', 'flechas', 'boleadoras', 'cargas', 'cristales', 'vivos', 'abatidos']) if (Dd[k] !== undefined && (!Number.isFinite(Dd[k]) || Dd[k] < 0)) mal.push(`desafío ${k} = ${Dd[k]}`);
      for (const a of D().aliens) { const g = a.m?.g?.position; if (g && !finito(g.x, g.y, g.z)) { mal.push(`invasor ${a.tipo || a.def?.nombre} en NaN (estado ${a.estado})`); break; } if (!Number.isFinite(a.vida)) { mal.push(`invasor con vida ${a.vida} (estado ${a.estado})`); break; } }
    }
    for (const o of H.obras?.obras || []) if (!finito(o.datos.x, o.datos.z, o.datos.y ?? 0, o.datos.rot ?? 0)) { mal.push('obra en NaN: ' + o.plano.id); break; }
    // toda la escena: posición, giro y escala finitos
    let n = 0;
    H.escena.traverse((o) => {
      if (n >= 3) return;
      const q = o.position, k = o.quaternion, e = o.scale;
      if (!finito(q.x, q.y, q.z, k.x, k.y, k.z, k.w, e.x, e.y, e.z)) { n++; mal.push(`objeto de la escena en NaN: ${ruta(o)} ${JSON.stringify([q.x, q.y, q.z])}`); }
    });
    // cada tanto, las instancias (pasto, árboles, animales en lote)
    if (contexto.instancias || ++vueltaInstancias % 15 === 0) {
      let m = 0;
      H.escena.traverse((o) => {
        if (m >= 2 || !o.isInstancedMesh) return;
        const a = o.instanceMatrix.array, c = Math.min(a.length, o.count * 16);
        for (let i = 0; i < c; i++) if (!Number.isFinite(a[i])) { m++; mal.push(`instancias en NaN: ${ruta(o)} (#${Math.floor(i / 16)} de ${o.count})`); break; }
      });
    }
    // estados imposibles
    const md = modo();
    if (js.enKayak && js.enTren) mal.push('en el kayak y en el tren a la vez');
    if (js.montado && (js.enKayak || js.enTren || js.enCable)) mal.push(`montado y además ${js.enKayak ? 'kayak' : js.enTren ? 'tren' : 'cable'}`);
    if (js.enCable && (js.enKayak || js.enTren)) mal.push('colgado del cable y en un vehículo');
    if (js.enKayak && !H.kayak.est.activo && !H.__vela()?.est?.activo) mal.push('enKayak sin kayak ni velero activo');
    if (!js.enKayak && H.kayak.est.activo) mal.push('kayak activo sin jugador arriba');
    if (H.pesca.est.equipada && (js.nadando || js.enTren)) mal.push('caña equipada nadando o en el tren');
    if (md === 'dialogo' && oculto('dialogo')) mal.push('modo "dialogo" sin el cuadro a la vista');
    if (md !== 'dialogo' && !oculto('dialogo') && !H.__caidas.dialogos.abierto()) mal.push('el cuadro de pregunta visible sin pregunta');
    const vistos = velos().filter((x) => x !== 'foto-panel');
    if (md === 'jugando' && vistos.some((x) => ['pausa', 'cuaderno', 'mapa', 'controles-completos', 'teclas', 'partidas', 'guia', 'logros', 'base', 'creditos', 'modos31', 'inicio'].includes(x))) mal.push(`jugando con un panel abierto (${vistos.join(',')})`);
    if (['pausa', 'cuaderno', 'mapa'].includes(md) && !vistos.length) mal.push(`modo "${md}" sin nada a la vista`);
    if (md === 'jugando' && vistos.includes('valle-tarjeta')) mal.push('jugando con la tarjeta del valle abierta');
    if (md === 'valle' && !vistos.includes('valle-tarjeta')) mal.push('modo "valle" (mundo quieto) sin la tarjeta a la vista');
    const f = H.__foto();
    if (f.activo !== !oculto('foto-panel')) mal.push(`modo foto ${f.activo} y su panel ${oculto('foto-panel') ? 'oculto' : 'visible'}`);
    if (f.activo && md !== 'jugando') mal.push(`modo foto activo en "${md}"`);
    if (!contexto.contexto && H.__caidas.graficos.perdidos) mal.push('los gráficos siguen "perdidos"');
    if (contexto.soltado && H.jugador.teclas.size) mal.push('teclas trabadas después de soltar todo: ' + [...H.jugador.teclas].join(','));
    if (md === 'jugando' && !H.__caidas.graficos.perdidos && H.ajustes.limiteFps === 'libre') {
      const f0 = H.renderer.info.render.frame; H.__bucle(); H.__bucle();
      if (H.renderer.info.render.frame === f0 && !contexto.sinDibujo) mal.push('jugando y el bucle no dibuja');
    }
    return mal;
  }
  function drenar() {
    const reg = window.__caos.registro.splice(0);
    const fallas = H.__caidas.fallas().map((x) => ({ ...x }));
    const sueltos = (window.__hojarascaErrores || []).length;
    return { reg, fallas, sueltos };
  }
  function resumen() {
    const js = j();
    return { modo: modo(), desafio: !!D(), horas: +P().horas.toFixed(2), dia: P().dia, pos: [js.pos.x, js.pos.y, js.pos.z].map((v) => +(+v).toFixed(1)), kayak: !!js.enKayak, tren: !!js.enTren, montado: !!js.montado, cable: !!js.enCable,
      aliens: D() ? D().aliens.length : 0, obras: H.obras.obras.length, idioma: H.ajustes.idioma, calidad: H.ajustes.calidad };
  }
  // como un jugador: Esc hasta ver el menú de pausa (cierra lo que esté arriba) y ahí "Volver al inicio"
  async function aLaPortada() {
    for (let i = 0; i < 8 && !visible($('btn-inicio')); i++) {
      if (H.__caidas.dialogos.abierto()) { clicEn($('dialogo-no')); await dormirMs(100); continue; }
      await tecla('Escape', 1); await dormirMs(460);
    }
    if (!visible($('btn-inicio'))) return false;
    clicEn($('btn-inicio'));
    return true;
  }
  window.__caosAyuda = { accion, revisar, drenar, resumen, soltarTodo, cuadros, tecla, aLaPortada, ACCIONES };
  return 1;
}

module.exports = { AYUDA };
