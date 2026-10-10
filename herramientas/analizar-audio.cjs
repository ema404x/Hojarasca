// 3.8.5: medir un sonido en serio, para comparar lo sintetizado con una referencia.
// Sale de `analizar-wav.cjs` (duración, picos, RMS, tono y brillo por tramos, espectrograma) y
// le suma lo que hace falta para una risa o una frase de piano:
//   · el tono fundamental cada 5 ms (YIN) y su vibrato;
//   · las sílabas: dónde empiezan, cuánto duran, el ataque, el tono que barren, el brillo y
//     cuánto aire tienen (planitud del espectro: 0 es un tono puro, 1 es ruido);
//   · los golpes de una frase (flujo espectral) y las notas nuevas de cada golpe;
//   · espectrogramas con la misma escala, uno arriba del otro, para mirarlos lado a lado.
//
// Uso:
//   node herramientas/analizar-audio.cjs <carpeta-salida> [--modo=risa|piano|basico] [--fmax=8000]
//        [--log] [--lado=nombre.png] [--ancho=900] [--alto=260] <wav…>
// Con `--lado` arma una sola imagen con todos los espectrogramas apilados (misma escala de
// tiempo: la del más largo), con una franja de nivel abajo de cada uno.
const fs = require('fs'), zlib = require('zlib'), path = require('path');

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nota = (f) => { if (!(f > 0)) return '-'; const m = Math.round(69 + 12 * Math.log2(f / 440)); return NOTAS[(m % 12 + 12) % 12] + (Math.floor(m / 12) - 1); };
const midi = (f) => 69 + 12 * Math.log2(f / 440);

function leerWav(f) {
  const b = fs.readFileSync(f);
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { formato: b.readUInt16LE(p + 8), canales: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === 'data') data = b.subarray(p + 8, p + 8 + n);
    p += 8 + n + (n & 1);
  }
  const bytes = fmt.bits / 8, N = Math.floor(data.length / bytes / fmt.canales), L = new Float32Array(N), R = new Float32Array(N);
  const leer = (o) => (fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.bits === 32 && fmt.formato === 3 ? data.readFloatLE(o) : data.readInt32LE(o) / 2147483648);
  for (let i = 0; i < N; i++) {
    L[i] = leer(i * bytes * fmt.canales);
    R[i] = fmt.canales > 1 ? leer(i * bytes * fmt.canales + bytes) : L[i];
  }
  return { ...fmt, N, L, R };
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
// espectro de magnitud de una ventana Hann que empieza en `o`
function espectro(m, o, n) {
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) { const x = m[o + i] || 0; re[i] = x * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / n)); }
  fft(re, im);
  const mag = new Float64Array(n / 2);
  for (let k = 0; k < n / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  return mag;
}

// YIN: el tono fundamental de una ventana; devuelve [Hz, claridad 0..1]
function yin(m, o, n, sr, fmin, fmax) {
  const tmin = Math.floor(sr / fmax), tmax = Math.min(Math.floor(sr / fmin), n - 1);
  const d = new Float64Array(tmax + 1);
  for (let tau = 1; tau <= tmax; tau++) { let s = 0; for (let i = 0; i < n - tmax; i++) { const x = (m[o + i] || 0) - (m[o + i + tau] || 0); s += x * x; } d[tau] = s; }
  let acum = 0; const dn = new Float64Array(tmax + 1); dn[0] = 1;
  for (let tau = 1; tau <= tmax; tau++) { acum += d[tau]; dn[tau] = d[tau] * tau / (acum || 1); }
  let best = -1;
  for (let tau = tmin; tau <= tmax; tau++) if (dn[tau] < 0.2) { while (tau + 1 <= tmax && dn[tau + 1] < dn[tau]) tau++; best = tau; break; }
  if (best < 0) { let mn = 1e9; for (let tau = tmin; tau <= tmax; tau++) if (dn[tau] < mn) { mn = dn[tau]; best = tau; } }
  const a = dn[best - 1] ?? dn[best], b = dn[best], c = dn[best + 1] ?? dn[best];
  const corr = (a - c) / (2 * (a - 2 * b + c) || 1);
  return [sr / (best + (Math.abs(corr) < 1 ? corr : 0)), Math.max(0, 1 - b)];
}

function png(w, h, rgb, f) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  fs.writeFileSync(f, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// Un espectrograma en un rectángulo de `rgb` (ancho total `W`), con `seg` segundos de escala.
function pintar(rgb, W, y0, w, h, m, sr, seg, { fmax, log, f0 }) {
  const NF = 2048, total = Math.floor(seg * sr);
  const fmin = 60;
  for (let x = 0; x < w; x++) {
    const o = Math.floor(x / w * total) - NF / 2;
    const mag = espectro(m, Math.max(0, o), NF);
    for (let y = 0; y < h; y++) {
      const u = (h - 1 - y) / h;
      const fHz = log ? fmin * Math.pow(fmax / fmin, u) : u * fmax;
      const k = Math.min(NF / 2 - 1, Math.round(fHz / sr * NF));
      const db = 20 * Math.log10(mag[k] + 1e-9);
      const v = Math.max(0, Math.min(1, (db + 20) / 70)), i = ((y0 + y) * W + x) * 3;
      rgb[i] = Math.round(255 * Math.min(1, v * 1.6)); rgb[i + 1] = Math.round(255 * Math.max(0, v * 1.6 - 0.6)); rgb[i + 2] = Math.round(255 * Math.max(0, 0.4 - v) + 60 * v);
    }
  }
  // marcas cada 0,5 s y rayas finas de frecuencia (1, 2, 4 kHz)
  for (let s = 0.5; s < seg; s += 0.5) { const x = Math.round(s / seg * w); for (let y = 0; y < 6; y++) { const i = ((y0 + h - 1 - y) * W + x) * 3; rgb[i] = rgb[i + 1] = rgb[i + 2] = 255; } }
  for (const fr of [500, 1000, 2000, 4000]) {
    if (fr >= fmax) continue;
    const u = log ? Math.log(fr / 60) / Math.log(fmax / 60) : fr / fmax, y = Math.round(h - 1 - u * h);
    for (let x = 0; x < 8; x++) { const i = ((y0 + y) * W + x) * 3; rgb[i] = rgb[i + 1] = 255; rgb[i + 2] = 255; }
  }
  // el tono medido, en verde
  if (f0) for (const [t, fz, cl] of f0) {
    if (cl < 0.6 || fz >= fmax) continue;
    const x = Math.round(t / seg * w), u = log ? Math.log(fz / 60) / Math.log(fmax / 60) : fz / fmax, y = Math.round(h - 1 - u * h);
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const i = ((y0 + y) * W + x) * 3; rgb[i] = 40; rgb[i + 1] = 255; rgb[i + 2] = 90;
  }
}

function envolvente(m, sr, paso = 0.005) {
  const H = Math.round(sr * paso), out = [];
  for (let o = 0; o + H <= m.length; o += H) { let s = 0; for (let i = o; i < o + H; i++) s += m[i] * m[i]; out.push(Math.sqrt(s / H)); }
  return out;
}

function pistaTono(m, sr, fmin, fmax) {
  const n = Math.round(sr * 0.03), H = Math.round(sr * 0.005), out = [];
  // se decima para que no tarde: a 24 kHz alcanza para tonos de hasta 2 kHz
  const dec = sr >= 44100 ? 2 : 1, m2 = dec > 1 ? new Float32Array(Math.floor(m.length / 2)) : m;
  if (dec > 1) for (let i = 0; i < m2.length; i++) m2[i] = (m[2 * i] + m[2 * i + 1]) / 2;
  const sr2 = sr / dec, n2 = Math.round(n / dec), H2 = Math.round(H / dec);
  for (let o = 0; o + n2 < m2.length; o += H2) {
    let e = 0; for (let i = o; i < o + n2; i++) e += m2[i] * m2[i];
    if (Math.sqrt(e / n2) < 0.004) { out.push([(o + n2 / 2) / sr2, 0, 0]); continue; }
    const [f, c] = yin(m2, o, n2, sr2, fmin, fmax);
    out.push([(o + n2 / 2) / sr2, f, c]);
  }
  return out;
}

function analizarRisa(m, sr) {
  const env = envolvente(m, sr, 0.005);
  // suavizado de 15 ms
  const s = env.map((_, i) => { let a = 0, c = 0; for (let k = -SUAVE; k <= SUAVE; k++) if (env[i + k] !== undefined) { a += env[i + k]; c++; } return a / c; });
  const maxE = Math.max(...s);
  const f0 = pistaTono(m, sr, TONO_MIN, 1800);
  const sil = [];
  // sílabas: picos que sobresalen de los valles vecinos al menos 3 dB y pasan -30 dB del máximo
  for (let i = 2; i < s.length - 2; i++) {
    if (!(s[i] >= s[i - 1] && s[i] >= s[i + 1] && s[i] > maxE * 0.03)) continue;
    let a = i; while (a > 0 && s[a - 1] <= s[a]) a--;
    let b = i; while (b < s.length - 1 && s[b + 1] <= s[b]) b++;
    const valle = Math.max(s[a], s[b]);
    if (s[i] < valle * 1.41) continue;
    if (sil.length && (i - sil[sil.length - 1].pico) * 0.005 < 0.06) { if (s[i] > s[sil[sil.length - 1].pico]) sil[sil.length - 1] = { a, pico: i, b }; continue; }
    sil.push({ a, pico: i, b });
  }
  const filas = sil.map(({ a, pico, b }) => {
    const ini = a * 0.005, fin = b * 0.005, tp = pico * 0.005;
    // ataque: del 10 % al 90 % del pico
    let i10 = a; while (i10 < pico && s[i10] < s[pico] * 0.1) i10++;
    let i90 = i10; while (i90 < pico && s[i90] < s[pico] * 0.9) i90++;
    const tonos = f0.filter(([t, f, c]) => t >= ini && t <= fin && c > 0.6 && f > 0).map(([, f]) => f);
    const o = Math.floor(tp * sr - 1024), mag = espectro(m, Math.max(0, o), 2048);
    let num = 0, den = 0, lg = 0, ar = 0, n = 0;
    for (let k = 4; k < 1024; k++) { const fz = k * sr / 2048; if (fz > 12000) break; num += mag[k] * fz; den += mag[k]; lg += Math.log(mag[k] + 1e-12); ar += mag[k]; n++; }
    return {
      t: +ini.toFixed(3), dur: +((fin - ini) * 1000).toFixed(0), picoDb: +(20 * Math.log10(s[pico] / maxE)).toFixed(1),
      ataqueMs: (i90 - i10) * 5, caidaMs: (b - pico) * 5,
      f0: tonos.length ? `${Math.round(tonos[0])}→${Math.round(Math.max(...tonos))}→${Math.round(tonos[tonos.length - 1])}` : '(sin tono)',
      brillo: Math.round(num / den), aire: +(Math.exp(lg / n) / (ar / n)).toFixed(2),
    };
  });
  const ioi = filas.slice(1).map((f, i) => Math.round((f.t - filas[i].t) * 1000));
  const sonoros = f0.filter(([, f, c]) => c > 0.75 && f > 0).map(([, f]) => f).sort((a, b) => a - b);
  const pct = (p) => sonoros.length ? Math.round(sonoros[Math.floor(p * (sonoros.length - 1))]) : 0;
  return { filas, ioi, f0, rangoTono: { p10: pct(0.1), med: pct(0.5), p90: pct(0.9) }, vibrato: vibrato(f0) };
}

// el vibrato del último tramo sonoro largo: cruces por la media de la curva de tono
function vibrato(f0) {
  let mejor = null, act = [];
  for (const p of f0.concat([[0, 0, 0]])) {
    if (p[2] > 0.75 && p[1] > 0) act.push(p);
    else { if (act.length > 40 && (!mejor || act.length >= mejor.length * 0.6)) mejor = act; act = []; }
  }
  if (!mejor) return null;
  const fs_ = mejor.map((p) => midi(p[1])), med = fs_.reduce((a, b) => a + b, 0) / fs_.length;
  // se le saca la tendencia (recta)
  const n = fs_.length, xm = (n - 1) / 2; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (i - xm) * (fs_[i] - med); sxx += (i - xm) ** 2; }
  const pend = sxy / sxx, r = fs_.map((v, i) => v - med - pend * (i - xm));
  let cruces = 0; for (let i = 1; i < n; i++) if ((r[i - 1] < 0) !== (r[i] < 0)) cruces++;
  const amp = Math.sqrt(r.reduce((a, b) => a + b * b, 0) / n) * Math.SQRT2;
  const durS = mejor[n - 1][0] - mejor[0][0];
  return { desde: +mejor[0][0].toFixed(2), hasta: +mejor[n - 1][0].toFixed(2), hz: +(cruces / 2 / durS).toFixed(1), semitonos: +amp.toFixed(2) };
}

function analizarPiano(m, sr) {
  const NF = 4096, H = 512, frames = [];
  for (let o = 0; o + NF < m.length; o += H) frames.push(espectro(m, o, NF));
  const flujo = frames.map((f, i) => { if (!i) return 0; let s = 0; for (let k = 2; k < 900; k++) { const d = Math.log(1 + 100 * f[k]) - Math.log(1 + 100 * frames[i - 1][k]); if (d > 0) s += d; } return s; });
  const med = (a, i, r) => { const v = a.slice(Math.max(0, i - r), i + r + 1).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
  const golpes = [];
  for (let i = 2; i < flujo.length - 1; i++) {
    if (flujo[i] >= flujo[i - 1] && flujo[i] >= flujo[i + 1] && flujo[i] > med(flujo, i, 12) * 1.6 + 8) {
      if (golpes.length && (i - golpes[golpes.length - 1]) * H / sr < 0.07) continue;
      golpes.push(i);
    }
  }
  const lista = golpes.map((i) => {
    const t = i * H / sr;
    const des = espectro(m, Math.max(0, Math.floor(t * sr) + 600), 16384), ant = espectro(m, Math.max(0, Math.floor(t * sr) - 16384 - 200), 16384);
    // picos nuevos: los que crecieron con el golpe
    const picos = [];
    for (let k = 20; k < 2400; k++) {
      const d = des[k] - ant[k] * 0.8;
      if (des[k] > des[k - 1] && des[k] > des[k + 1] && d > 0) picos.push([k * sr / 16384, d]);
    }
    picos.sort((a, b) => b[1] - a[1]);
    const fuerte = picos[0] ? picos[0][1] : 0;
    const notas = [...new Set(picos.filter((p) => p[1] > fuerte * 0.25).slice(0, 4).map((p) => nota(p[0])))];
    let e = 0; for (let k = Math.floor(t * sr); k < Math.floor(t * sr) + 2400 && k < m.length; k++) e += m[k] * m[k];
    return { t: +t.toFixed(3), db: +(10 * Math.log10(e / 2400 + 1e-12)).toFixed(1), notas: notas.join(' ') };
  });
  // las notas más presentes en toda la frase (cromagrama sumado)
  const croma = new Float64Array(12), tot = espectro(m, 0, 1 << Math.min(20, Math.floor(Math.log2(m.length))));
  const NT = tot.length * 2;
  for (let k = 10; k < tot.length; k++) { const fz = k * sr / NT; if (fz < 55 || fz > 2000) continue; croma[((Math.round(midi(fz)) % 12) + 12) % 12] += tot[k] * tot[k]; }
  const mx = Math.max(...croma);
  return { lista, ioi: lista.slice(1).map((g, i) => Math.round((g.t - lista[i].t) * 1000)), croma: NOTAS.map((n, i) => `${n}:${Math.round(croma[i] / mx * 100)}`).join(' ') };
}

// la cola de reverberación: cuánto tarda en caer 30 dB después del último golpe fuerte
function cola(m, sr) {
  const env = envolvente(m, sr, 0.01).map((v) => 20 * Math.log10(v + 1e-9));
  let pico = -200, ip = 0; for (let i = 0; i < env.length; i++) if (env[i] > pico - 0.5 && env[i] > -60) { if (env[i] > pico) pico = env[i]; ip = i; }
  let i30 = ip; while (i30 < env.length && env[i30] > env[ip] - 30) i30++;
  return { desde: +(ip * 0.01).toFixed(2), t30: +((i30 - ip) * 0.01).toFixed(2) };
}

// --------------------------------------------------------------------------------- CLI
const args = process.argv.slice(2);
const op = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const pos = args.filter((a) => !a.startsWith('--'));
const salida = pos[0], archivos = pos.slice(1);
if (!salida || !archivos.length) { console.log('uso: analizar-audio.cjs <salida> [--modo=risa|piano] [--fmax=] [--log] [--lado=x.png] <wav…>'); process.exit(2); }
fs.mkdirSync(salida, { recursive: true });
const fmax = +(op.fmax || 8000), log = !!op.log, modo = op.modo || 'basico';
// --suave=ms: cuánto se alisa la envolvente para hallar sílabas (las voces roncas necesitan más) · --tonomin=Hz
const SUAVE = Math.max(1, Math.round(+(op.suave || 10) / 5)), TONO_MIN = +(op.tonomin || 120);
// --suave=ms: cuánto se alisa la envolvente para hallar sílabas (las voces roncas necesitan más) · --tonomin=Hz
const datos = [];
for (const f of archivos) {
  const w = leerWav(f), m = new Float32Array(w.N);
  // --canal=izq|der: un solo oído (lo que sale del motor es binaural y la suma de los dos canales se cancela)
  for (let i = 0; i < w.N; i++) m[i] = op.canal === 'izq' ? w.L[i] : op.canal === 'der' ? w.R[i] : (w.L[i] + w.R[i]) / 2;
  let pico = 0, sum = 0, dif = 0; for (let i = 0; i < w.N; i++) { pico = Math.max(pico, Math.abs(w.L[i]), Math.abs(w.R[i])); sum += m[i] * m[i]; dif += (w.L[i] - w.R[i]) ** 2; }
  const um = pico * 0.02; let ini = 0; while (ini < w.N && Math.abs(m[ini]) < um) ini++; let fin = w.N - 1; while (fin > 0 && Math.abs(m[fin]) < um) fin--;
  console.log(`\n== ${path.basename(f)}  (${(w.N / w.sr).toFixed(2)} s, ${w.sr} Hz)`);
  console.log(`pico ${(20 * Math.log10(pico)).toFixed(1)} dB · RMS ${(20 * Math.log10(Math.sqrt(sum / w.N) + 1e-12)).toFixed(1)} dB · lados ${(Math.sqrt(dif / w.N) / (Math.sqrt(sum / w.N) + 1e-12) * 100).toFixed(0)} % · suena de ${(ini / w.sr).toFixed(2)} a ${(fin / w.sr).toFixed(2)} s`);
  // brillo y planitud de toda la parte que suena
  {
    let num = 0, den = 0, bandas = [0, 0, 0, 0, 0, 0];
    const lim = [300, 700, 1500, 2600, 4000, 24000];
    for (let o = ini; o + 2048 < fin; o += 2048) {
      const mag = espectro(m, o, 2048);
      for (let k = 2; k < 1024; k++) { const fz = k * w.sr / 2048, e = mag[k] * mag[k]; num += mag[k] * fz; den += mag[k]; bandas[lim.findIndex((l) => fz < l)] += e; }
    }
    const tot = bandas.reduce((a, b) => a + b, 0) || 1;
    console.log(`brillo ${Math.round(num / (den || 1))} Hz · energía <300 ${(bandas[0] / tot * 100).toFixed(0)}% · 300-700 ${(bandas[1] / tot * 100).toFixed(0)}% · 700-1500 ${(bandas[2] / tot * 100).toFixed(0)}% · 1,5-2,6k ${(bandas[3] / tot * 100).toFixed(0)}% · 2,6-4k ${(bandas[4] / tot * 100).toFixed(0)}% · >4k ${(bandas[5] / tot * 100).toFixed(0)}%`);
  }
  let f0 = null;
  if (modo === 'risa') {
    const r = analizarRisa(m, w.sr);
    f0 = r.f0;
    console.log(`sílabas: ${r.filas.length} · tono p10/mediana/p90: ${r.rangoTono.p10}/${r.rangoTono.med}/${r.rangoTono.p90} Hz (${nota(r.rangoTono.med)})`);
    console.log(`intervalos (ms): ${r.ioi.join(' ')}`);
    if (op.pista) console.log('tono cada 20 ms: ' + r.f0.filter((_, i) => i % 4 === 0).map(([t, f, c]) => c > 0.6 && f > 0 ? Math.round(f) : '·').join(' '));
    if (r.vibrato) console.log(`vibrato (tramo sonoro más largo ${r.vibrato.desde}-${r.vibrato.hasta} s): ${r.vibrato.hz} Hz, ±${r.vibrato.semitonos} semitonos`);
    console.log('   t      dur  pico  ataq  caída  tono (Hz)              brillo  aire');
    for (const x of r.filas) console.log(`${x.t.toFixed(3).padStart(6)} ${String(x.dur).padStart(5)} ${String(x.picoDb).padStart(6)} ${String(x.ataqueMs).padStart(4)} ${String(x.caidaMs).padStart(6)}  ${x.f0.padEnd(22)} ${String(x.brillo).padStart(5)}  ${x.aire}`);
  } else if (modo === 'piano') {
    const r = analizarPiano(m, w.sr);
    console.log(`golpes: ${r.lista.length} · intervalos (ms): ${r.ioi.join(' ')}`);
    if (r.ioi.length) { const s = [...r.ioi].sort((a, b) => a - b); console.log(`intervalo mediano ${s[Math.floor(s.length / 2)]} ms (≈ ${Math.round(60000 / s[Math.floor(s.length / 2)])} golpes por minuto)`); }
    for (const g of r.lista) console.log(`  ${g.t.toFixed(2).padStart(6)} s  ${String(g.db).padStart(6)} dB  ${g.notas}`);
    console.log(`croma: ${r.croma}`);
    const c = cola(m, w.sr); console.log(`cola: -30 dB en ${c.t30} s después de ${c.desde} s`);
  }
  datos.push({ nombre: path.basename(f), m, sr: w.sr, seg: w.N / w.sr, f0 });
  if (!op.lado) {
    const W = +(op.ancho || 900), Hh = +(op.alto || 300), rgb = Buffer.alloc(W * Hh * 3);
    pintar(rgb, W, 0, W, Hh, m, w.sr, w.N / w.sr, { fmax, log, f0 });
    png(W, Hh, rgb, path.join(salida, path.basename(f).replace(/[^a-z0-9]+/gi, '_') + '.png'));
  }
}
if (op.lado) {
  const W = +(op.ancho || 900), Hh = +(op.alto || 220), banda = 36, sep = 6, seg = op.seg ? +op.seg : Math.max(...datos.map((d) => d.seg));
  const alto = datos.length * (Hh + banda + sep);
  const rgb = Buffer.alloc(W * alto * 3);
  datos.forEach((d, k) => {
    const y0 = k * (Hh + banda + sep);
    pintar(rgb, W, y0, W, Hh, d.m, d.sr, seg, { fmax, log, f0: d.f0 });
    // franja de nivel (envolvente en dB, de -50 a 0 respecto del pico propio)
    const env = envolvente(d.m, d.sr, seg / W), mx = Math.max(...env) || 1;
    for (let x = 0; x < W && x < env.length; x++) {
      const v = Math.max(0, Math.min(1, (20 * Math.log10(env[x] / mx + 1e-9) + 50) / 50)), hh = Math.round(v * (banda - 2));
      for (let y = 0; y < hh; y++) { const i = ((y0 + Hh + banda - 1 - y) * W + x) * 3; rgb[i] = 120; rgb[i + 1] = 200; rgb[i + 2] = 255; }
    }
  });
  png(W, alto, rgb, path.join(salida, op.lado));
  console.log(`\nlado a lado: ${path.join(salida, op.lado)} (${datos.map((d) => d.nombre).join(' | ')}; ${seg.toFixed(2)} s de ancho, hasta ${fmax} Hz${log ? ', escala logarítmica' : ''})`);
}
