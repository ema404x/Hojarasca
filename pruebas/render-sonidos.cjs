// Banco de sonidos: renderiza los sonidos del juego a archivos .wav para poder
// escucharlos, y mide cada uno para que las pruebas puedan decir algo concreto.
//
// No es una maqueta aparte: levanta el `index.html` del juego, le pasa a la clase
// Sonido un OfflineAudioContext y dispara los mismos métodos que dispara el juego.
// Lo que sale del archivo es exactamente lo que se escucha jugando.
//
// Uso: npx electron pruebas/render-sonidos.cjs [carpeta de salida]
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Los sonidos que entran al banco: nombre, segundos a renderizar y qué disparar.
// `S` es el banco del Desafío, que el juego expone en depuración.
const LISTA = [
  ['hachazo', 1.2, `H.sonido.hachazo({x:0,y:1,z:-2}, 0.3)`],
  ['hachazo-hondo', 1.2, `H.sonido.hachazo({x:0,y:1,z:-2}, 1)`],
  ['arbol-cae', 5.0, `H.sonido.arbolCae({x:0,y:1,z:-4}, 1.5)`],
  ['paso-hojarasca', 0.8, `H.sonido.paso('hojarasca', 0.8, false)`],
  ['paso-nieve-corriendo', 0.8, `H.sonido.paso('nieve', 1, true)`],
  // 2.0: el piso de tablas, la escarcha y la lluvia sobre los tres techos
  ['paso-madera', 0.8, `H.sonido.paso('madera', 0.8, false)`],
  ['paso-escarcha', 0.8, `H.sonido.paso('escarcha', 0.8, false)`],
  ['lluvia-chapa', 4.0, `H.sonido.gTechoCama.gain.value = 0.13; H.sonido.fTechoCama.frequency.value = 3600; H.sonido.gTechoGrave.gain.value = 0.05; for (let i = 0; i < 110; i++) H.sonido.gotaEnTecho('chapa', Math.random() * 3.7)`],
  ['lluvia-tablas', 4.0, `H.sonido.gTechoCama.gain.value = 0.1; H.sonido.fTechoCama.frequency.value = 950; H.sonido.gTechoGrave.gain.value = 0.09; for (let i = 0; i < 60; i++) H.sonido.gotaEnTecho('tablas', Math.random() * 3.7)`],
  ['lluvia-lona', 4.0, `H.sonido.gTechoCama.gain.value = 0.14; H.sonido.fTechoCama.frequency.value = 1500; H.sonido.gTechoGrave.gain.value = 0.07; for (let i = 0; i < 90; i++) H.sonido.gotaEnTecho('lona', Math.random() * 3.7)`],
  ['carpa-racha', 1.5, `H.sonido.crujido('carpa')`],
  ['adentro-cruje', 1.5, `H.sonido.crujido('adentro')`],
  ['golpe-piedra', 1.2, `H.sonido.impacto('piedra', {tamaño:1, fuerza:1, destino:H.sonido.bus.efectos})`],
  ['golpe-tronco', 1.5, `H.sonido.impacto('tronco', {tamaño:2, fuerza:1.2, destino:H.sonido.bus.efectos})`],
  ['golpe-metal', 2.5, `H.sonido.impacto('metal', {tamaño:2, fuerza:1, destino:H.sonido.bus.efectos})`],
  ['golpe-carne', 1.0, `H.sonido.impacto('carne', {tamaño:2, dureza:0.35, fuerza:1.2, destino:H.sonido.bus.efectos})`],
  ['golpe-quitina', 1.0, `H.sonido.impacto('quitina', {tamaño:1.2, fuerza:1.2, destino:H.sonido.bus.efectos})`],
  // las gargantas, de cerca
  ['voz-rastreador-acecho', 4.0, `H.sonido.vozAlien('rastreador','acecho',{distancia:8,intensidad:0.4})`],
  ['voz-rastreador-ataque', 3.0, `H.sonido.vozAlien('rastreador','ataque',{distancia:5,intensidad:1})`],
  ['voz-saltador-ataque', 3.0, `H.sonido.vozAlien('saltador','ataque',{distancia:5,intensidad:1})`],
  ['voz-escupidor-alerta', 3.0, `H.sonido.vozAlien('escupidor','alerta',{distancia:6,intensidad:0.9})`],
  ['voz-bruto-ataque', 3.5, `H.sonido.vozAlien('bruto','ataque',{distancia:6,intensidad:1})`],
  ['voz-bruto-muerte', 4.0, `H.sonido.vozAlien('bruto','muerte',{distancia:6,intensidad:1})`],
  ['voz-jefe-llamado', 6.0, `H.sonido.vozAlien('jefe','llamado',{distancia:10,intensidad:1})`],
  ['voz-jefe-lejos-90m', 6.0, `H.sonido.vozAlien('jefe','llamado',{distancia:90,intensidad:1})`],
  ['voz-nido-latido', 5.0, `H.sonido.vozAlien('nido','latido',{distancia:14,intensidad:0.8})`],
  ['voz-respiro-encima', 3.0, `H.sonido.vozAlien('rastreador','respiro',{distancia:2,intensidad:0.4})`],
  // el banco del Desafío
  ['arco', 1.5, `H.desafioS.arco()`],
  ['ballesta', 1.5, `H.desafioS.ballesta({x:0,y:1,z:-3})`],
  ['pistola-luz', 1.5, `H.desafioS.pistola()`],
  ['disparo-cargado', 1.5, `H.desafioS.cargado()`],
  ['golpe-duende', 2.5, `H.desafioS.golpe({x:0,y:1,z:-4},'rastreador',true)`],
  ['muerte-duende', 4.0, `H.desafioS.muerte({x:0,y:1,z:-4},'escupidor')`],
  ['jefe-entra', 6.0, `H.desafioS.jefe({x:0,y:1,z:-9})`],
  ['jugador-herido', 2.0, `H.desafioS.herido()`],
  ['muralla-golpeada', 2.0, `H.desafioS.madera({x:0,y:1,z:-3})`],
  ['derrumbe', 3.5, `H.desafioS.derrumbe({x:0,y:1,z:-3})`],
  ['escupitajo', 2.0, `H.desafioS.escupir({x:0,y:1,z:-5})`],
  ['coihue-cruje', 3.0, `H.desafioS.zumbido({x:0,y:20,z:-30})`],
  // 3.8.0: los duendes (la risita, el Rey), las lechuzas, los nidos de hongos y los silbidos
  ['voz-rastreador-risita', 2.0, `H.sonido.vozAlien('rastreador','alerta',{distancia:5,intensidad:0.9})`],
  ['voz-saltador-risita', 2.0, `H.sonido.vozAlien('saltador','alerta',{distancia:5,intensidad:0.9})`],
  ['voz-bruto-jojo', 3.0, `H.sonido.vozAlien('bruto','llamado',{distancia:6,intensidad:1})`],
  ['voz-rey-llamado', 6.0, `H.sonido.vozAlien('rey','llamado',{distancia:10,intensidad:1})`],
  ['duendes-silbidos', 3.0, `H.desafioS.sirena()`],
  ['lechuza-aleteo', 2.0, `H.desafioS.aleteo({x:0,y:6,z:-6})`],
  ['lechuza-picada', 2.0, `H.desafioS.picada({x:0,y:4,z:-5})`],
  ['nido-de-hongos', 2.0, `H.desafioS.capullo({x:0,y:0.5,z:-3})`],
  ['travieso-risa', 2.0, `H.desafioS.risa({x:2,y:0.5,z:-3})`],
  ['chispa-ambar', 1.5, `H.desafioS.plasma({x:0,y:1,z:-3})`],
  // 2.0: el asedio, el perro que avisa y el acecho
  ['asedio-aranazos', 1.5, `H.desafioS.aranazo({x:0,y:1,z:-2})`],
  ['asedio-puerta', 1.5, `H.desafioS.puerta({x:0,y:1,z:-2})`],
  ['perro-grune', 2.0, `H.desafioS.grunirPerro({x:1,y:0.5,z:-1})`],
  ['acecho-pasos-rapidos', 1.5, `H.desafioS.pasos({x:0,y:0,z:6})`],
  // 3.8.4: las voces de los vecinos (un murmullo cálido: «mm», «ah», una risita) y los silbatos de la trochita.
  // Cada muestra de voz son tres renglones seguidos: lo que cuenta, una pregunta y algo que le causa gracia.
  ...[['chico', 'aldea-nene'], ['nena', 'aldea-nena'], ['mujer-joven', 'pintora'], ['mujer', 'aldea-madre'], ['mujer-mayor', 'aldea-abuela'], ['hombre', 'aldea-padre'], ['hombre-mayor', 'martin']].map(([n, k]) => [`vecino-${n}`, 4.6,
    `const v = H.voz('${k}'); H.sonido.balbuceo(H.plan('Hoy bajé al lago temprano y estaba quieto como un espejo.', v, 1), { vol: 0.05 }); ` +
    `H.sonido.balbuceo(H.plan('¿Vos viste cómo está el tiempo para mañana?', v, 2), { vol: 0.05, cuando: 1.5 }); ` +
    `H.sonido.balbuceo(H.plan('¡Jaja, qué ocurrencia la tuya!', v, 3), { vol: 0.05, cuando: 3.0 })`]),
  ['vecinos-charlando-a-8m', 4.6, `const a = H.voz('aldea-jefe'), b = H.voz('aldea-nelida'); ` +
    `H.sonido.balbuceo(H.plan('Dicen que mañana llueve.', a, 4), { pos: { x: -3, y: 1.6, z: -8 }, vol: 0.09 }); ` +
    `H.sonido.balbuceo(H.plan('¿Otra vez? Si recién colgué la ropa.', b, 5), { pos: { x: 3, y: 1.6, z: -8 }, vol: 0.09, cuando: 1.3 }); ` +
    `H.sonido.balbuceo(H.plan('¡Ja! Así es el valle.', a, 6), { pos: { x: -3, y: 1.6, z: -8 }, vol: 0.09, cuando: 2.7 })`],
  ['duende-risita', 2.0, `H.sonido.vozAlien('rastreador','alerta',{distancia:5,intensidad:0.9})`],
  ...['clasico', 'grave', 'agudo', 'doble', 'largo', 'acorde'].map((id) => [`silbato-${id}`, id === 'largo' ? 8.5 : 7, `H.sonido.silbato({ x: 0, y: 2, z: -30 }, '${id}')`]),
  ['silbato-taller-pajaro', 6.5, `H.sonido.silbato({ x: 0, y: 2, z: -30 }, H.silbatoTren({ loco: { silbato: 'pajaro' } }))`],
  ['silbato-clasico-lejos-250m', 8, `H.sonido.silbato({ x: 0, y: 2, z: -250 }, 'clasico')`],
  // 3.8.5: la risa nueva de los duendes (seis por garganta), a 5 m; la risita de antes para comparar; tres
  // duendes riéndose a 10, 30 y 60 m; las frases del piano de misterio y el piano con risas encima, como al anochecer
  ...['chico', 'viejo', 'mandamas'].flatMap((c) => [0, 1, 2, 3, 4, 5].map((k) => [`risa385-${c}-${k + 1}`, c === 'mandamas' ? 4.2 : 3, `H.sonido.risaDuende('${c}', { pos: { x: 1.5, y: 1, z: -5 }, intensidad: 0.9, variante: ${k} })`])),
  ['risa385-antes-384', 2.0, `H.sonido.vozAlien('rastreador','alerta',{distancia:5,intensidad:0.9})`],
  ...[10, 30, 60].map((m) => [`risa385-tres-a-${m}m`, 4.5, `H.sonido.risaDuende('chico', { pos: { x: -0.4 * ${m}, y: 1, z: -0.9 * ${m} }, variante: 0 }); ` +
    `H.sonido.risaDuende('chico', { pos: { x: 0.35 * ${m}, y: 1, z: -0.95 * ${m} }, variante: 3, cuando: 0.45 }); ` +
    `H.sonido.risaDuende('viejo', { pos: { x: 0.1 * ${m}, y: 1, z: -1.05 * ${m} }, variante: 1, cuando: 1.1 })`]),
  ...[0, 1, 2].map((k) => [`piano385-${['ronda', 'lamento', 'escalera'][k]}`, 9, `H.sonido.pianoMisterio(${k})`]),
  ...[0, 1, 2].map((k) => [`piano385-anochecer-${['ronda', 'lamento', 'escalera'][k]}`, 12, `H.desafioS.sirena(); H.desafioS.piano(${k + 1}); ` +
    `H.sonido.risaDuende('chico', { pos: { x: -14, y: 1, z: -22 }, cuando: 4.6 }); ` +
    `H.sonido.risaDuende('chico', { pos: { x: 18, y: 1, z: -30 }, cuando: 5.5 }); ` +
    `H.sonido.risaDuende('viejo', { pos: { x: 4, y: 1, z: -12 }, cuando: 7.4 }); ` +
    `H.sonido.risaDuende('chico', { pos: { x: -6, y: 1, z: -9 }, cuando: 7.6 })`]),
];

// WAV de 16 bits, que es lo que abre cualquier cosa sin instalar nada.
function wav(izq, der, tasa) {
  const n = izq.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(tasa, 24); b.writeUInt32LE(tasa * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, izq[i])), r = Math.max(-1, Math.min(1, der[i]));
    b.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  return b;
}

app.whenReady().then(async () => {
  // Electron corre con el script como último argumento, así que sólo se toma una
  // carpeta si el último argumento no es el script.
  const ultimo = process.argv[process.argv.length - 1];
  const pedida = ultimo && !ultimo.startsWith('-') && !/\.(c?js)$/.test(ultimo) ? ultimo : null;
  const salida = pedida ? path.resolve(pedida) : path.join(raiz, 'pruebas', 'salidas', 'sonidos');
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 900, height: 600, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(500); if (await js('!!window.__hojarasca').catch(() => false)) break; }

  const informe = [];
  // 3.8.4: SONIDOS=vecino-,silbato- renderiza sólo los que empiezan así (sin la variable, todos)
  const solo = (process.env.SONIDOS || '').split(',').map((x) => x.trim()).filter(Boolean);
  for (const [nombre, segundos, disparo] of LISTA) {
    if (solo.length && !solo.some((p) => nombre.startsWith(p))) continue;
    const datos = await js(`(async () => {
      const H = window.__hojarasca;
      const tasa = 48000;
      const off = new OfflineAudioContext(2, Math.ceil(tasa * ${segundos}), tasa);
      // un motor limpio por sonido, con el mismo armado que usa el juego
      const S2 = new (H.sonido.constructor)();
      S2.iniciar(off);
      S2.oyente = { x: 0, y: 1.6, z: 0 };
      const H2 = { sonido: S2, desafioS: H.__bancoSonidos(S2), voz: H.__vozDe, plan: H.__planBalbuceo, silbatoTren: H.__silbatoDelTren };   // (3.8.4: y las voces y el silbato del taller)
      try { ${disparo.replace(/\bH\./g, 'H2.')} } catch (e) { return { error: String(e && e.message || e) }; }
      const buf = await off.startRendering();
      const l = buf.getChannelData(0), r = buf.getChannelData(1);
      // el pico es por canal, que es lo que recorta la placa de sonido
      let pico = 0, suma = 0, primeraMuestra = -1, recortadas = 0;
      for (let i = 0; i < l.length; i++) {
        const v = Math.max(Math.abs(l[i]), Math.abs(r[i]));
        if (v > pico) pico = v;
        if (v > 0.985) recortadas++;
        suma += l[i] * l[i] + r[i] * r[i];
        if (primeraMuestra < 0 && v > 0.002) primeraMuestra = i;
      }
      // cuánta energía hay abajo de 120 Hz: es lo que se siente en el pecho
      let grave = 0, total = 0, lp = 0;
      for (let i = 0; i < l.length; i++) { lp += (l[i] - lp) * 0.0157; grave += lp * lp; total += l[i] * l[i]; }
      return {
        pico, recortadas, rms: Math.sqrt(suma / (l.length * 2)),
        arranque: primeraMuestra < 0 ? -1 : primeraMuestra / tasa,
        grave: total > 0 ? grave / total : 0,
        tasa, izq: Array.from(l), der: Array.from(r),
      };
    })()`).catch((e) => ({ error: String(e.message || e) }));

    if (!datos || datos.error) { informe.push({ nombre, error: (datos && datos.error) || 'sin datos' }); console.log('✗', nombre, (datos && datos.error) || ''); continue; }
    const archivo = path.join(salida, nombre + '.wav');
    fs.writeFileSync(archivo, wav(datos.izq, datos.der, datos.tasa));
    const fila = { nombre, pico: +datos.pico.toFixed(3), recortadas: datos.recortadas, rms: +datos.rms.toFixed(4), arranque: +datos.arranque.toFixed(3), grave: +datos.grave.toFixed(3), kb: Math.round(fs.statSync(archivo).size / 1024) };
    informe.push(fila);
    const aviso = fila.recortadas > 24 ? `  ⚠ ${fila.recortadas} muestras al tope` : '';
    console.log(`✓ ${nombre.padEnd(26)} pico ${fila.pico.toFixed(3)}  rms ${fila.rms.toFixed(4)}  grave ${(fila.grave * 100).toFixed(0)}%  ${fila.kb} KB${aviso}`);
  }
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify(informe, null, 1), 'utf8');
  const malos = informe.filter((x) => x.error || x.pico < 0.004);
  const saturados = informe.filter((x) => x.recortadas > 24);
  console.log(`\n${informe.length} sonidos · carpeta: ${salida}`);
  if (saturados.length) console.log('AL TOPE (revisar niveles):\n' + saturados.map((x) => `  ${x.nombre}: ${x.recortadas} muestras`).join('\n'));
  if (malos.length || saturados.length) { if (malos.length) console.log('MUDOS O ROTOS:\n' + malos.map((x) => '  ' + x.nombre + ' ' + (x.error || 'pico ' + x.pico)).join('\n')); app.exit(1); return; }
  app.exit(0);
});
