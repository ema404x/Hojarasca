// 3.8.5: pasa un audio (mp3, ogg, wav…) a WAV PCM16 con el decodificador de Chromium
// (`decodeAudioData`), para poder medir referencias con `herramientas/analizar-wav.cjs`.
// En Node no hay decodificador de mp3 y no se baja nada: Electron ya trae uno.
// Es una herramienta de medición: lo que decodifica NUNCA entra al juego ni al repo.
//
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs herramientas/decodificar-audio.cjs <entrada> <salida.wav>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

function wav(canales, tasa) {
  const n = canales[0].length, c = canales.length;
  const b = Buffer.alloc(44 + n * 2 * c);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2 * c, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(c, 22);
  b.writeUInt32LE(tasa, 24); b.writeUInt32LE(tasa * 2 * c, 28); b.writeUInt16LE(2 * c, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2 * c, 40);
  for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) {
    const v = Math.max(-1, Math.min(1, canales[k][i]));
    b.writeInt16LE(Math.round(v * 32767), 44 + (i * c + k) * 2);
  }
  return b;
}

app.whenReady().then(async () => {
  const args = process.argv.filter((a) => !a.startsWith('-') && !/electron(\.exe)?$/i.test(a) && !/\.c?js$/.test(a));
  const [entrada, salida] = args.slice(-2);
  if (!entrada || !salida) { console.log('uso: decodificar-audio.cjs <entrada> <salida.wav>'); app.exit(2); return; }
  const w = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  await w.loadURL('data:text/html,<meta charset=utf-8>');
  const bytes = fs.readFileSync(path.resolve(entrada));
  const r = await w.webContents.executeJavaScript(`(async () => {
    const b = Uint8Array.from(atob(${JSON.stringify(bytes.toString('base64'))}), (c) => c.charCodeAt(0));
    const ctx = new OfflineAudioContext(2, 1, 48000);
    const buf = await ctx.decodeAudioData(b.buffer);
    const can = [];
    for (let c = 0; c < buf.numberOfChannels; c++) can.push(Array.from(buf.getChannelData(c)));
    return { tasa: buf.sampleRate, can };
  })()`).catch((e) => ({ error: String(e.message || e) }));
  if (r.error) { console.log('error:', r.error); app.exit(1); return; }
  fs.writeFileSync(path.resolve(salida), wav(r.can, r.tasa));
  console.log(`${salida}: ${r.can.length} canales, ${r.tasa} Hz, ${(r.can[0].length / r.tasa).toFixed(2)} s`);
  app.exit(0);
});
