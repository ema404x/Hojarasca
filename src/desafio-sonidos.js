// El banco de sonidos del Desafío.
//
// 1.9: estaba adentro de `desafio.js`, atado al motor de audio del juego. Vive afuera
// para que el banco de pruebas pueda armarlo contra un OfflineAudioContext y renderizar
// a un archivo exactamente lo mismo que se escucha jugando, sin maquetas aparte.
//
// Cada golpe se arma con las tres capas de `impactos.js` —el contacto, los modos propios
// del material y la cola— y cada invasor tiene garganta propia: `voz-alien.js` decide el
// tono, el subarmónico, la aspereza del gruñido y los formantes según el tipo y según lo
// que esté haciendo. De lejos sólo llega lo grave, que es lo único que cruza un valle.
//
// 2.7: lo del jugador suena a objeto: la cuerda del arco y la de la ballesta son cuerdas
// pulsadas de verdad (Karplus-Strong), los líquidos burbujean, el ácido chisporrotea y
// el perro gruñe con garganta. Lo de los invasores puede seguir siendo de otro mundo,
// pero sin ondas cuadradas: barridos de ruido, formantes y anillo con mesura.
export function crearBanco(sonido) {
  const sonar = (pos, f) => { if (sonido.ctx) f(pos ? sonido.fuente(pos, 1, 0.5) : sonido.bus.efectos); };
  const az = (a, b) => a + Math.random() * (b - a);
  const S = {
    // ---- las gargantas
    chillido: (pos, tipo = 'rastreador') => sonido.vozAlien?.(tipo, 'alerta', { pos, intensidad: az(0.6, 0.95) }),
    acecho: (pos, tipo = 'rastreador') => sonido.vozAlien?.(tipo, 'acecho', { pos, intensidad: az(0.25, 0.5) }),
    embestida: (pos, tipo = 'rastreador') => sonido.vozAlien?.(tipo, 'ataque', { pos, intensidad: 1 }),
    llamado: (pos, tipo = 'rastreador') => sonido.vozAlien?.(tipo, 'llamado', { pos, intensidad: az(0.7, 1) }),
    respiro: (pos, tipo = 'rastreador') => sonido.vozAlien?.(tipo, 'respiro', { pos, intensidad: 0.35 }),
    // el nido enterrado: casi todo por debajo de los 60 Hz, que es lo que se siente
    // en el pecho antes de escucharse
    latido: (pos) => sonido.vozAlien?.('nido', 'latido', { pos, intensidad: 0.8, vol: 1.2 }),
    // el golpe entra: primero el caparazón, después la carne, y si dolió, la voz
    golpe: (pos, tipo = 'rastreador', fuerte = false) => {
      sonido.impacto?.('quitina', { pos, tamaño: fuerte ? 1.5 : 1, fuerza: fuerte ? 1.4 : 0.9, vol: 0.9 });
      sonido.impacto?.('carne', { pos, tamaño: 1.6, dureza: 0.4, fuerza: fuerte ? 1.3 : 0.85, vol: 1.1, cuando: 0.012 });
      if (fuerte || Math.random() < 0.55) sonido.vozAlien?.(tipo, 'dolor', { pos, intensidad: fuerte ? 1 : az(0.5, 0.8), cuando: 0.03 });
    },
    // la muerte: la voz se desarma y el cuerpo cae
    muerte: (pos, tipo = 'rastreador') => {
      sonido.vozAlien?.(tipo, 'muerte', { pos, intensidad: 1 });
      sonido.impacto?.('carne', { pos, tamaño: 2.6, dureza: 0.3, fuerza: 1.2, vol: 1.4, cuando: az(0.25, 0.5) });
      sonido.impacto?.('tierra', { pos, tamaño: 2, dureza: 0.3, fuerza: 1, vol: 0.8, cuando: az(0.3, 0.55) });
      sonido.golpeRuido?.({ dur: 0.7, frec: 3200, q: 0.5, vol: 0.09, destino: sonido.fuente?.(pos, 1, 0.9), cuando: 0.5 });
    },
    jefe: (pos) => {
      sonido.vozAlien?.('jefe', 'llamado', { pos, intensidad: 1, vol: 1.5 });
      sonar(pos, (d) => sonido.golpeRuido({ dur: 1.6, frec: 90, q: 0.7, tipo: 'lowpass', vol: 0.5, destino: d, buffer: sonido.ruido }));
      sonido.impacto?.('tierra', { pos, tamaño: 5, dureza: 0.3, fuerza: 1.4, vol: 1.2, cuando: 0.9 });
    },
    // ---- el jugador
    herido: () => sonar(null, (d) => {
      sonido.impacto('carne', { tamaño: 2.2, dureza: 0.35, fuerza: 1.3, vol: 1.5, destino: d });
      sonido.golpeRuido({ dur: 0.5, frec: 140, q: 0.6, tipo: 'lowpass', vol: 0.45, destino: d, buffer: sonido.ruido });
      // el aire que se te va del pecho
      sonido.golpeRuido({ dur: 0.34, frec: 900, q: 1.2, vol: 0.16, destino: d, cuando: 0.06 });
      // y el pitido sordo del golpe
      sonido.tono({ frec: az(2400, 3200), dur: 0.9, tipo: 'sine', vol: 0.02, destino: d, ataque: 0.02, cuando: 0.05 });
    }),
    tajo: () => sonar(null, (d) => {
      sonido.silbido({ dur: 0.16, frec: 2600, vol: 0.18, destino: d });
      sonido.impacto('carne', { tamaño: 1.2, dureza: 0.6, fuerza: 0.9, vol: 0.7, destino: d, cuando: 0.07 });
    }),
    // el arco: la cuerda que se suelta, la pala que vibra y la flecha que se va
    arco: () => sonar(null, (d) => {
      sonido.golpeRuido({ dur: 0.02, frec: 3400, q: 2, vol: 0.3, destino: d });
      sonido.impacto('tabla', { tamaño: 2.4, dureza: 0.9, fuerza: 0.8, vol: 0.7, destino: d });
      // 2.7: la cuerda que vibra después de soltar (antes un triángulo que bajaba)
      if (!sonido.cuerdaArma?.('arco', d, 0.16)) sonido.tono({ frec: az(150, 185), fin: 92, dur: 0.22, tipo: 'triangle', vol: 0.11, destino: d, ataque: 0.002 });
      sonido.silbido({ dur: 0.42, frec: 1500, vol: 0.1, destino: d, cuando: 0.03 });
    }),
    ballesta: (pos) => sonar(pos, (d) => {
      sonido.impacto('metal', { tamaño: 3.2, dureza: 1, fuerza: 0.7, vol: 0.5, destino: d });
      sonido.impacto('tabla', { tamaño: 1.8, dureza: 1, fuerza: 1.2, vol: 1, destino: d, cuando: 0.006 });
      sonido.cuerdaArma?.('ballesta', d, 0.14, 0.004);
      sonido.silbido({ dur: 0.5, frec: 1200, vol: 0.12, destino: d, cuando: 0.02 });
    }),
    honda: () => sonar(null, (d) => {
      // el cuero girando antes de soltar
      sonido.silbido({ dur: 0.34, frec: 900, vol: 0.14, destino: d });
      sonido.impacto('tierra', { tamaño: 0.8, dureza: 0.8, fuerza: 0.6, vol: 0.5, destino: d, cuando: 0.3 });
      sonido.silbido({ dur: 0.45, frec: 1700, vol: 0.1, destino: d, cuando: 0.32 });
    }),
    // la pistola de plasma: la bobina que carga, la descarga y el chisporroteo
    // (2.7: la descarga es un barrido de ruido resonante que cae, no una cuadrada, y el
    // golpe de abajo es un seno que se hunde)
    pistola: () => sonar(null, (d) => {
      sonido.golpeRuido({ dur: 0.16, frec: 6500, fin: 420, q: 6, vol: 0.28, destino: d });
      sonido.tono({ frec: 118, fin: 42, dur: 0.24, tipo: 'sine', vol: 0.2, destino: d, ataque: 0.001 });
      sonido.impacto('cristal', { tamaño: 1.4, dureza: 1, fuerza: 1, vol: 0.5, destino: d });
      if (sonido.chisporrotear) sonido.chisporrotear(d, 5, 0.12, 0.22, 1.8);
      else for (let i = 0; i < 5; i++) sonido.golpeRuido({ dur: az(0.01, 0.03), frec: az(4000, 9000), q: 3, vol: 0.05, destino: d, cuando: az(0.02, 0.22) });
    }),
    cargado: () => sonar(null, (d) => {
      sonido.tono({ frec: 90, fin: 2600, dur: 0.5, tipo: 'sawtooth', vol: 0.06, destino: d, ataque: 0.2 });
      sonido.tono({ frec: 180, fin: 5200, dur: 0.5, tipo: 'sine', vol: 0.03, destino: d, ataque: 0.25 });
      sonido.golpeRuido({ dur: 0.55, frec: 400, q: 0.6, tipo: 'lowpass', vol: 0.32, destino: d, buffer: sonido.ruido });
      sonido.impacto('cristal', { tamaño: 0.9, fuerza: 1.1, vol: 0.55, destino: d, cuando: 0.5 });
    }),
    plasma: (pos) => sonar(pos, (d) => {
      sonido.impacto('cristal', { tamaño: 1.1, dureza: 1, fuerza: 1.2, vol: 0.8, destino: d });
      sonido.golpeRuido({ dur: 0.3, frec: 5200, q: 0.6, vol: 0.14, destino: d, cuando: 0.01 });
      sonido.tono({ frec: 1400, fin: 2600, dur: 0.18, tipo: 'sine', vol: 0.05, destino: d, vibrato: 60 });
    }),
    martillo: () => sonar(null, (d) => {
      sonido.impacto('metal', { tamaño: 2.6, dureza: 1, fuerza: 1, vol: 0.45, destino: d });
      sonido.impacto('tabla', { tamaño: 1.2, dureza: 1, fuerza: 1.1, vol: 0.9, destino: d, cuando: 0.004 });
    }),
    cura: () => sonar(null, (d) => {
      sonido.golpeRuido({ dur: 0.3, frec: 1800, q: 0.7, vol: 0.12, destino: d });
      sonido.tono({ frec: 520, fin: 780, dur: 0.45, tipo: 'sine', vol: 0.08, destino: d, ataque: 0.05 });
      sonido.tono({ frec: 780, fin: 1040, dur: 0.5, tipo: 'sine', vol: 0.04, destino: d, ataque: 0.08, cuando: 0.06 });
    }),
    // ---- el escupidor y el saltador
    escupir: (pos) => sonar(pos, (d) => {
      sonido.vozAlien?.('escupidor', 'ataque', { pos, intensidad: 0.55, vol: 0.6 });
      // la glándula: burbujas graves antes del chorro (2.7: burbujas de verdad)
      if (sonido.borbotear) { sonido.borbotear(d, 0.16); sonido.borbotear(d, 0.1, az(0.04, 0.1)); }
      else for (let i = 0; i < 4; i++) sonido.tono({ frec: az(180, 340), fin: az(90, 160), dur: az(0.05, 0.11), tipo: 'sine', vol: 0.05, destino: d, ataque: 0.004, cuando: az(0, 0.12) });
      sonido.golpeRuido({ dur: 0.34, frec: 1100, q: 0.5, vol: 0.28, destino: d, cuando: 0.14 });
    }),
    acido: (pos) => sonar(pos, (d) => {
      sonido.golpeRuido({ dur: 0.75, frec: 4200, q: 0.4, vol: 0.26, destino: d });
      sonido.golpeRuido({ dur: 0.5, frec: 7000, q: 0.8, vol: 0.12, destino: d, cuando: 0.08 });
      // 2.7: lo que el ácido come chisporrotea
      if (sonido.chisporrotear) sonido.chisporrotear(d, 8, 0.07, 0.6, 1.7);
      else for (let i = 0; i < 6; i++) sonido.tono({ frec: az(900, 2400), fin: az(400, 900), dur: 0.04, tipo: 'sine', vol: 0.02, destino: d, ataque: 0.003, cuando: az(0.05, 0.6) });
    }),
    salto: (pos, tipo = 'saltador') => {
      sonar(pos, (d) => {
        sonido.impacto('quitina', { tamaño: 0.8, dureza: 1, fuerza: 1.1, vol: 0.7, destino: d });
        sonido.silbido({ dur: 0.3, frec: 1100, vol: 0.12, destino: d, cuando: 0.02 });
      });
      sonido.vozAlien?.(tipo, 'ataque', { pos, intensidad: 0.8, vol: 0.7 });
    },
    // ---- las defensas y la nave
    madera: (pos) => sonar(pos, (d) => {
      sonido.impacto('hueco', { tamaño: 2.2, dureza: 0.8, fuerza: 1.2, vol: 1.2, destino: d });
      sonido.impacto('tabla', { tamaño: 1.6, dureza: 1, fuerza: 0.9, vol: 0.6, destino: d, cuando: 0.008 });
    }),
    derrumbe: (pos) => sonar(pos, (d) => {
      // las tablas son relleno: dos modos y sin cola, que si no un derrumbe son
      // ciento cincuenta nodos de audio en un cuadro
      for (let i = 0; i < 6; i++) sonido.impacto('tabla', { tamaño: az(0.8, 2.6), dureza: 0.9, fuerza: az(0.4, 1.2), vol: 0.7, destino: d, cuando: az(0, 0.7), capasMax: 2 });
      sonido.impacto('tronco', { tamaño: 4.5, dureza: 0.6, fuerza: 1.3, vol: 1.1, destino: d, cuando: 0.12 });
      sonido.impacto('tierra', { tamaño: 3.4, dureza: 0.3, fuerza: 1.2, vol: 0.9, destino: d, cuando: 0.2 });
      sonido.golpeRuido({ dur: 1.4, frec: 2600, q: 0.4, vol: 0.1, destino: d, cuando: 0.25 });
    }),
    enredo: (pos) => sonar(pos, (d) => {
      sonido.golpeRuido({ dur: 0.3, frec: 1400, q: 1.1, vol: 0.28, destino: d });
      sonido.impacto('tabla', { tamaño: 3, dureza: 0.5, fuerza: 0.6, vol: 0.5, destino: d, cuando: 0.05 });
    }),
    // la nave: dos sierras desafinadas que baten entre ellas, abajo de todo
    zumbido: (pos) => sonar(pos, (d) => {
      sonido.tono({ frec: 57, fin: 55, dur: 1.6, tipo: 'sawtooth', vol: 0.07, ataque: 0.35, destino: d });
      sonido.tono({ frec: 57.9, fin: 55.8, dur: 1.6, tipo: 'sawtooth', vol: 0.055, ataque: 0.4, destino: d });
      sonido.tono({ frec: 171, fin: 165, dur: 1.5, tipo: 'sine', vol: 0.025, ataque: 0.5, destino: d, vibrato: 2.5 });
      sonido.golpeRuido({ dur: 1.5, frec: 320, q: 0.5, tipo: 'lowpass', vol: 0.12, destino: d, buffer: sonido.ruido, cuando: 0.1 });
    }),
    sirena: () => sonar(null, (d) => { for (let i = 0; i < 3; i++) sonido.tono({ frec: 320, fin: 640, dur: 0.6, tipo: 'sine', vol: 0.1, vibrato: 6, destino: d, cuando: i * 0.7 }); }),
    // ---- 2.0: el asedio, el perro y el acecho
    // uñas contra la tabla: pasadas agudas que suben y bajan, y el golpecito de la garra
    aranazo: (pos) => sonar(pos, (d) => {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const c = i * az(0.09, 0.16);
        sonido.golpeRuido({ dur: az(0.1, 0.24), frec: az(2200, 4200), q: az(3, 6), vol: az(0.14, 0.24), destino: d, cuando: c });
        sonido.impacto('tabla', { tamaño: az(1.4, 2.2), dureza: 0.9, fuerza: 0.35, vol: 0.45, destino: d, cuando: c, capasMax: 2 });
      }
    }),
    // alguien prueba la puerta: el pestillo que golpetea y la hoja que se mueve en el marco
    puerta: (pos) => sonar(pos, (d) => {
      for (let i = 0; i < 3; i++) sonido.impacto('metal', { tamaño: 0.45, dureza: 1, fuerza: 0.5, vol: 0.35, destino: d, cuando: i * az(0.1, 0.16), capasMax: 2 });
      sonido.impacto('hueco', { tamaño: 2.4, dureza: 0.5, fuerza: 0.8, vol: 0.9, destino: d, cuando: 0.05 });
      sonido.impacto('hueco', { tamaño: 2.4, dureza: 0.5, fuerza: 0.6, vol: 0.6, destino: d, cuando: az(0.3, 0.45) });
    }),
    // el perro gruñe: una garganta grave que rueda, casi sin abrir la boca
    // (2.7: con garganta: pulso glotal, formantes de hocico y aspereza que rueda)
    grunirPerro: (pos) => sonar(pos, (d) => {
      const f = az(88, 112);
      if (sonido.garganta) sonido.garganta({ destino: d, frec: f, fin: f * 0.9, dur: 1.3, vol: 0.06, ataque: 0.18, formantes: [[380, 4, 1], [1050, 5, 0.55], [2300, 7, 0.15]], aspereza: 0.75, aliento: 0.35 });
      else sonido.tono({ frec: f, fin: f * 0.9, dur: 1.3, tipo: 'sawtooth', vol: 0.05, ataque: 0.18, destino: d, vibrato: 21 });
      sonido.golpeRuido({ dur: 1.2, frec: 380, q: 1.4, tipo: 'bandpass', vol: 0.05, destino: d, buffer: sonido.ruido, cuando: 0.1 });
    }),
    ladrarPerro: (pos) => sonido.ladrido?.(pos),
    // ---- 2.1: el excavador, el artillero, la forja
    // cavar: tierra que se mueve abajo, un retumbo grave y piedritas que se corren
    excavar: (pos) => sonar(pos, (d) => {
      sonido.golpeRuido({ dur: 0.9, frec: 120, q: 0.7, tipo: 'lowpass', vol: 0.45, destino: d, buffer: sonido.ruido });
      for (let i = 0; i < 4; i++) sonido.impacto('tierra', { tamaño: az(1.2, 2.2), dureza: 0.3, fuerza: 0.5, vol: 0.4, destino: d, cuando: az(0, 0.6), capasMax: 2 });
      sonido.impacto('piedra', { tamaño: 0.5, fuerza: 0.4, vol: 0.2, destino: d, cuando: az(0.2, 0.7), capasMax: 2 });
    }),
    // asomar: la tierra que revienta hacia arriba
    emerger: (pos) => sonar(pos, (d) => {
      sonido.impacto('tierra', { tamaño: 3.4, dureza: 0.4, fuerza: 1.3, vol: 1.1, destino: d });
      sonido.golpeRuido({ dur: 0.8, frec: 2400, q: 0.4, vol: 0.14, destino: d, cuando: 0.05 });
      sonido.vozAlien?.('rastreador', 'alerta', { pos, intensidad: 0.9, escala: 0.9 });
    }),
    // la piedra del artillero: el silbido al caer y el golpe
    roca: (pos) => sonar(pos, (d) => {
      sonido.impacto('piedra', { tamaño: 3.2, dureza: 1, fuerza: 1.4, vol: 1.2, destino: d });
      sonido.impacto('tierra', { tamaño: 3, dureza: 0.3, fuerza: 1.2, vol: 0.9, destino: d, cuando: 0.02 });
      sonido.golpeRuido({ dur: 0.9, frec: 1800, q: 0.4, vol: 0.12, destino: d, cuando: 0.1 });
    }),
    tiroRoca: (pos) => { sonido.silbido?.({ pos, dur: 0.7, frec: 700, vol: 0.18 }); sonido.vozAlien?.('jefe', 'ataque', { pos, intensidad: 0.7 }); },
    // la forja: el hielo que cruje y el rayo que chasquea
    hielo: (pos) => sonar(pos, (d) => {
      sonido.impacto('cristal', { tamaño: 1.6, dureza: 1, fuerza: 1, vol: 0.8, destino: d });
      for (let i = 0; i < 5; i++) sonido.golpeRuido({ dur: az(0.02, 0.05), frec: az(4000, 8000), q: 3, vol: 0.08, destino: d, cuando: az(0.02, 0.4) });
    }),
    rayoCadena: (pos) => sonar(pos, (d) => {
      for (let i = 0; i < 6; i++) sonido.golpeRuido({ dur: az(0.01, 0.04), frec: az(3000, 9000), q: 2, vol: 0.14, destino: d, cuando: az(0, 0.18) });
      sonido.tono({ frec: 90, fin: 45, dur: 0.3, tipo: 'sawtooth', vol: 0.09, destino: d, ataque: 0.002 });
    }),
    // ---- 2.3: el volador, los capullos y la zanja de fuego
    // el aleteo: membranas que baten el aire, grave y seco, de a tres
    aleteo: (pos) => sonar(pos, (d) => {
      for (let i = 0; i < 3; i++) sonido.golpeRuido({ dur: 0.12, frec: az(260, 360), q: 0.9, tipo: 'bandpass', vol: 0.22, destino: d, buffer: sonido.ruido, cuando: i * az(0.16, 0.2) });
    }),
    // la picada: un chillido que baja de tono mientras cae
    picada: (pos) => {
      sonido.vozAlien?.('saltador', 'alerta', { pos, intensidad: 0.8, escala: 1.25 });
      sonido.silbido?.({ pos, dur: 0.6, frec: 1400, vol: 0.12 });
    },
    // la llama que se apaga de golpe
    apagar: (pos) => sonar(pos, (d) => {
      sonido.golpeRuido({ dur: 0.35, frec: 900, q: 0.6, vol: 0.2, destino: d });
      sonido.golpeRuido({ dur: 0.8, frec: 300, q: 0.5, tipo: 'lowpass', vol: 0.1, destino: d, buffer: sonido.ruido, cuando: 0.08 });
    }),
    // el capullo: se abre como una fruta húmeda, o chisporrotea al quemarse
    capullo: (pos) => sonar(pos, (d) => {
      sonido.impacto('carne', { tamaño: 2.2, dureza: 0.2, fuerza: 1.1, vol: 1, destino: d });
      sonido.golpeRuido({ dur: 0.5, frec: 700, q: 0.8, vol: 0.12, destino: d, cuando: 0.05 });
    }),
    quemar: (pos) => sonar(pos, (d) => {
      for (let i = 0; i < 8; i++) sonido.golpeRuido({ dur: az(0.015, 0.05), frec: az(1200, 3200), q: az(2, 5), vol: az(0.06, 0.14), destino: d, cuando: az(0, 1.4) });
      sonido.golpeRuido({ dur: 1.6, frec: 500, q: 0.5, tipo: 'lowpass', vol: 0.16, destino: d, buffer: sonido.ruido });
    }),
    // la zanja que prende: una bocanada que sube
    zanja: (pos) => sonar(pos, (d) => {
      sonido.golpeRuido({ dur: 1.4, frec: 220, q: 0.5, tipo: 'lowpass', vol: 0.4, destino: d, buffer: sonido.ruido });
      sonido.golpeRuido({ dur: 1.0, frec: 1500, q: 0.5, vol: 0.1, destino: d, cuando: 0.15 });
    }),
    // pasos rápidos en la hojarasca, que se acercan
    pasos: (pos) => sonar(pos, (d) => {
      for (let i = 0; i < 5; i++) {
        const c = i * az(0.11, 0.15);
        sonido.impacto('tierra', { tamaño: 0.7, dureza: 0.6, fuerza: 0.5 + i * 0.1, vol: 0.3 + i * 0.06, destino: d, cuando: c, capasMax: 2 });
        // 2.7: la hojarasca que pisa, del mismo banco que las pisadas del jugador
        if (sonido.pisadaEn) sonido.pisadaEn(d, 'hojarasca', 0.14 + i * 0.03, c + 0.005, true);
        else sonido.golpeRuido({ dur: 0.07, frec: az(2400, 3600), q: 0.8, vol: 0.05 + i * 0.012, destino: d, cuando: c + 0.01 });
      }
    }),
  };
  return S;
}
