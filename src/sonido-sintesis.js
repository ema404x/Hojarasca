// 2.7: la síntesis de antemano.
//
// Hasta la 2.6 todo lo que sonaba salía en vivo de osciladores pelados: un seno a
// 4400 Hz cortado por una cuadrada eran los grillos, una sierra a 172 Hz era la
// colmena. El oído lo reconoce enseguida como máquina, porque la naturaleza no repite
// nada: cada grillo tiene su tono, cada hoja su chasquido, cada burbuja su tamaño.
//
// Lo que acá se calcula es eso, muestra por muestra y una sola vez: bucles de hojas,
// agua, lluvia, fuego y grillos; bancos de pisadas por suelo; cuerdas pulsadas
// (Karplus-Strong) para la música; cantos de aves armados nota por nota. El motor
// (`sonido.js`) los mete en AudioBuffers al arrancar, de a pedazos para no trabar un
// cuadro, y después sólo los reproduce: un nodo por sonido en vez de diez.
//
// Módulo puro: no toca WebAudio, devuelve Float32Array. Se prueba en Node.

export const TASA_PREVIA = 32000;

// Azar repetible (mulberry32), para las pruebas y para que un banco no dependa del cuadro
export function crearAzar(semilla = 1) {
  let s = (semilla >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOS_PI = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Un filtro de dos polos (las recetas de RBJ): pasabajos, pasaaltos o pasabanda.
export class Biquad {
  constructor(tipo, frec, q, tasa) { this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0; this.poner(tipo, frec, q, tasa); }
  poner(tipo, frec, q, tasa) {
    const w = DOS_PI * clamp(frec, 10, tasa * 0.45) / tasa, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (tipo === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (tipo === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = -2 * c / a0; this.a2 = (1 - a) / a0;
    return this;
  }
  paso(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// ------------------------------------------------------------------ utilidades
// Los generadores largos son funciones* que ceden cada tanto: el motor los corre de a
// pedazos entre cuadros (ver `sonido.js`). `completar` los corre de una, para las
// pruebas y para el banco que renderiza a archivo.
export function completar(gen) {
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

// Un bucle que no se note: la cola se funde en la cabeza (a potencia constante, que
// para ruido es lo que no deja un hueco) y se descarta. Devuelve la parte que queda.
export function cerrarBucle(d, fundido) {
  const L = d.length - fundido;
  for (let i = 0; i < fundido; i++) {
    const w = i / fundido;
    d[i] = d[i] * Math.sqrt(w) + d[L + i] * Math.sqrt(1 - w);
  }
  return d.subarray(0, L);
}

// Sin continua: el promedio a cero y un pasaaltos suave de un polo.
export function quitarContinua(d, tasa, corte = 18) {
  let m = 0;
  for (let i = 0; i < d.length; i++) m += d[i];
  m /= d.length || 1;
  const R = 1 - DOS_PI * corte / tasa;
  let x1 = 0, y1 = 0;
  for (let i = 0; i < d.length; i++) { const x = d[i] - m; const y = x - x1 + R * y1; x1 = x; y1 = y; d[i] = y; }
  return d;
}

export function medir(d) {
  let pico = 0, suma = 0, dc = 0, nan = 0;
  for (let i = 0; i < d.length; i++) {
    const v = d[i];
    if (!Number.isFinite(v)) { nan++; continue; }
    const a = Math.abs(v); if (a > pico) pico = a;
    suma += v * v; dc += v;
  }
  const n = d.length || 1;
  return { pico, rms: Math.sqrt(suma / n), dc: dc / n, nan };
}

export function aPico(d, objetivo = 0.9) {
  const { pico } = medir(d);
  if (pico > 0) { const k = objetivo / pico; for (let i = 0; i < d.length; i++) d[i] *= k; }
  return d;
}
// Los picos sueltos se doblan en vez de sobresalir: una gota o un chasquido pueden ser
// fuertes, pero no diez veces más que el resto. `techo` es cuántas veces el RMS.
export function suavizarPicos(d, techo) {
  const c = medir(d).rms * techo;
  if (c > 0) for (let i = 0; i < d.length; i++) d[i] = c * Math.tanh(d[i] / c);
  return d;
}
export function aRms(d, objetivo) {
  const { rms } = medir(d);
  if (rms > 0) { const k = objetivo / rms; for (let i = 0; i < d.length; i++) d[i] *= k; }
  return d;
}

// Una tangente hiperbólica barata (racional): dobla los picos igual y cuesta la mitad.
function blando(x) { return x <= -3 ? -1 : x >= 3 ? 1 : x * (27 + x * x) / (27 + 9 * x * x); }

// Las pasadas finales de un buffer largo, de a trozos: sin continua (un pasaaltos de un
// polo; si es un bucle, arranca con el estado del final para que la costura no haga
// clic), los picos doblados (`techo`, en veces el RMS) y el nivel (`rms` o `pico`).
const TROZO = 4096;
function* terminar(d, tasa, { corte = 20, techo = 0, rms = 0, pico = 0, bucle = false } = {}) {
  const n = d.length;
  let m = 0;
  for (let i = 0; i < n; i++) { m += d[i]; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  m /= n || 1;
  if (techo) {
    let suma = 0;
    for (let i = 0; i < n; i++) { const v = d[i] - m; suma += v * v; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
    const c = Math.sqrt(suma / (n || 1)) * techo;
    if (c > 0) for (let i = 0; i < n; i++) { d[i] = c * blando((d[i] - m) / c); if ((i & (TROZO - 1)) === TROZO - 1) yield; }
    m = 0;
    for (let i = 0; i < n; i++) m += d[i];
    m /= n || 1;
  }
  const R = 1 - DOS_PI * corte / tasa;
  let x1 = 0, y1 = 0;
  if (bucle) for (let i = Math.max(0, n - 4096); i < n; i++) { const x = d[i] - m; y1 = x - x1 + R * y1; x1 = x; }
  for (let i = 0; i < n; i++) {
    const x = d[i] - m, y = x - x1 + R * y1; x1 = x; y1 = y; d[i] = y;
    if ((i & (TROZO - 1)) === TROZO - 1) yield;
  }
  if (rms || pico) {
    let suma = 0, max = 0;
    for (let i = 0; i < n; i++) { const v = d[i]; suma += v * v; const a = v < 0 ? -v : v; if (a > max) max = a; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
    const actual = rms ? Math.sqrt(suma / (n || 1)) : max;
    const k = actual > 0 ? (rms || pico) / actual : 1;
    for (let i = 0; i < n; i++) { d[i] *= k; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  }
  return d;
}

// Un tic: ruido que se apaga en un suspiro. `brillo` va de 0 (sordo) a 1 (filoso):
// es un pasabajos de un polo por tic, que no cuesta nada y cambia todo.
function tic(d, i0, largo, amp, brillo, azar) {
  const a = 0.05 + brillo * 0.9;
  let lp = 0;
  const tau = largo / 4.6;
  for (let k = 0; k < largo; k++) {
    const idx = i0 + k;
    if (idx >= d.length) break;
    lp += ((azar() * 2 - 1) - lp) * a;
    d[idx] += lp * amp * Math.exp(-k / tau);
  }
}

// Una burbuja (van den Doel): un seno que se apaga mientras sube de tono, porque la
// burbuja se achica al salir. La frecuencia sale del radio; el amortiguamiento, de la
// frecuencia. Es el ladrillo del arroyo, de la lluvia en el charco y del chapoteo.
export function burbuja(d, i0, f0, amp, tasa, subida = 0.1, canal = null) {
  const amort = 0.043 * f0 + 0.0014 * Math.pow(f0, 1.5);
  const largo = Math.min(Math.floor((6.5 / amort) * tasa), Math.floor(tasa * 0.25));
  let fase = 0, env = amp;
  const caeK = Math.exp(-amort / tasa), w0 = DOS_PI * f0 / tasa, sube = w0 * subida * amort / tasa;
  for (let k = 0; k < largo; k++) {
    const idx = i0 + k;
    if (idx >= d.length) break;
    fase += w0 + sube * k;
    const v = env * Math.sin(fase);
    env *= caeK;
    d[idx] += v;
    if (canal) canal[idx] += v;
  }
}

// ------------------------------------------------------------------ ambiente
// Las hojas: ráfagas que se pisan, y adentro de cada ráfaga cientos de tics. Lo que
// hace que suene a hoja y no a ruido es que los tics son ralos y de brillo distinto.
function* susurroHojas(tasa, seg, azar = Math.random) {
  const fundido = Math.floor(tasa * 0.3), n = Math.floor(tasa * seg) + fundido;
  const env = new Float32Array(n), d = new Float32Array(n);
  for (let t = 0, cuenta = 0; t < n;) {
    if ((++cuenta & 7) === 0) yield;
    const largo = Math.floor(tasa * (0.04 + azar() * 0.22)), amp = 0.12 + Math.pow(azar(), 1.8);
    for (let i = 0; i < largo && t + i < n; i++) { const s = Math.sin(Math.PI * i / largo); env[t + i] += amp * s * s; }
    t += Math.floor(tasa * (0.008 + azar() * 0.06));
  }
  yield;
  const brillante = new Biquad('bp', 4600, 0.7, tasa), sordo = new Biquad('bp', 2100, 0.9, tasa);
  const aire = new Biquad('hp', 1100, 0.6, tasa);
  const densidad = 2600 / tasa;
  for (let i = 0; i < n; i++) {
    const e = env[i];
    let b = 0, s = 0;
    if (azar() < e * densidad) b = (azar() * 2 - 1) * (0.5 + azar());
    if (azar() < e * densidad * 0.6) s = (azar() * 2 - 1) * (0.5 + azar());
    const siseo = aire.paso((azar() * 2 - 1) * 0.05 * e);
    d[i] = brillante.paso(b) * 2.2 + sordo.paso(s) * 1.6 + siseo;
    if ((i & 2047) === 2047) yield;
  }
  yield;
  return yield* terminar(cerrarBucle(d, fundido), tasa, { corte: 60, techo: 4.5, rms: 0.25, bucle: true });
}

// El burbujeo del arroyo: nubes de burbujas de todos los tamaños. Las chicas son
// muchas y agudas; las grandes, pocas y graves.
function* burbujeo(tasa, seg, azar = Math.random, porSegundo = 110) {
  const fundido = Math.floor(tasa * 0.25), n = Math.floor(tasa * seg) + fundido;
  const d = new Float32Array(n);
  let t = 0, cuenta = 0;
  while (t < n) {
    if ((++cuenta & 7) === 0) yield;
    // vienen en rachas: el agua salta una piedra y larga varias juntas
    const racha = azar() < 0.25 ? 2 + Math.floor(azar() * 5) : 1;
    for (let r = 0; r < racha; r++) {
      const f0 = 380 * Math.pow(9, Math.pow(azar(), 0.8));
      const amp = (0.25 + azar() * 0.75) * Math.pow(1000 / f0, 0.55) * 0.3;
      burbuja(d, t + Math.floor(azar() * tasa * 0.03), f0, amp, tasa, 0.08 + azar() * 0.12);
    }
    t += Math.floor((-Math.log(1 - azar() * 0.999) / porSegundo) * tasa * racha);
  }
  yield;
  return yield* terminar(cerrarBucle(d, fundido), tasa, { corte: 80, rms: 0.2, bucle: true });
}

// La lluvia, en estéreo: miles de gotas sobre hojas (tics cortos de brillo distinto),
// algunas que caen en agua (burbujas) y un siseo parejo abajo.
function* lluviaEstereo(tasa, seg, azar = Math.random, porSegundo = 700) {
  const fundido = Math.floor(tasa * 0.25), n = Math.floor(tasa * seg) + fundido;
  const I = new Float32Array(n), D = new Float32Array(n);
  const gota = new Float32Array(Math.floor(tasa * 0.012));
  for (let t = 0, cuenta = 0; t < n;) {
    if ((++cuenta & 15) === 0) yield;
    const pan = azar(), gi = Math.sqrt(1 - pan), gd = Math.sqrt(pan);
    const amp = Math.pow(azar(), 2.2) * 0.9 + 0.04;
    gota.fill(0);
    const largo = Math.floor(tasa * (0.0006 + azar() * 0.003));
    tic(gota, 0, Math.min(largo, gota.length), amp, 0.25 + azar() * 0.75, azar);
    for (let k = 0; k < largo && t + k < n; k++) { I[t + k] += gota[k] * gi; D[t + k] += gota[k] * gd; }
    // una de cada veinte cae en un charco
    if (azar() < 0.05) {
      const f0 = 1400 + azar() * 3200;
      burbuja(I, t, f0, amp * 0.25 * gi, tasa, 0.15);
      burbuja(D, t, f0, amp * 0.25 * gd, tasa, 0.15);
    }
    t += Math.max(1, Math.floor((-Math.log(1 - azar() * 0.999) / porSegundo) * tasa));
  }
  // el siseo: ruido rosado pasado por un pasaaltos, distinto en cada oído
  for (const c of [I, D]) {
    const hp = new Biquad('hp', 700, 0.5, tasa);
    let b0 = 0, b1 = 0;
    for (let i = 0; i < n; i++) {
      const w = azar() * 2 - 1; b0 = 0.99 * b0 + w * 0.1; b1 = 0.9 * b1 + w * 0.3; c[i] += hp.paso(b0 + b1 + w * 0.2) * 0.12;
      if ((i & 4095) === 4095) yield;
    }
  }
  yield;
  const bi = yield* terminar(cerrarBucle(I, fundido), tasa, { corte: 60, techo: 3.5, rms: 0.3, bucle: true });
  const bd = yield* terminar(cerrarBucle(D, fundido), tasa, { corte: 60, techo: 3.5, rms: 0.3, bucle: true });
  return [bi, bd];
}

// Los grillos: cada uno es un bicho distinto. Su tono (4 a 5 kHz), su ritmo de
// chirrido, cuántos pulsos mete en cada uno, dónde está y cuándo se calla. Cada pulso
// es un seno con su envolvente y una caída mínima de tono, como el ala que raspa.
// El bucle no tiene costura: los pulsos que pasan del final entran por el principio.
function* coroGrillos(tasa, seg, cuantos, azar = Math.random) {
  const n = Math.floor(tasa * seg);
  const I = new Float32Array(n), D = new Float32Array(n);
  for (let g = 0; g < cuantos; g++) {
    // uno de cada cuatro es de otra especie: más grave, pulsos más largos y lentos
    const otro = azar() < 0.25;
    const fc = otro ? 3100 + azar() * 500 : 4150 + azar() * 900;
    const periodoCanto = otro ? 0.9 + azar() * 0.8 : 0.38 + azar() * 0.5;
    const pulsos = otro ? 2 + Math.floor(azar() * 2) : 3 + Math.floor(azar() * 3);
    const periodoPulso = otro ? 0.07 + azar() * 0.03 : 0.028 + azar() * 0.014;
    const largoPulso = periodoPulso * (0.55 + azar() * 0.15);
    // la distancia: los lejanos suenan más bajo y sin brillo
    const lejos = azar();
    const amp = (1 - lejos * 0.75) * (otro ? 0.8 : 1);
    const a2 = 0.14 * (1 - lejos * 0.8), a3 = 0.05 * (1 - lejos);
    const pan = azar() * 1.6 - 0.8, gi = Math.sqrt((1 - pan) / 2), gd = Math.sqrt((1 + pan) / 2);
    let t = azar() * periodoCanto, fase = azar() * DOS_PI;
    while (t < seg) {
      // a veces se calla un canto, o dos: nadie canta como un metrónomo
      if (azar() > 0.12) {
        for (let p = 0; p < pulsos; p++) {
          const inicio = Math.floor((t + p * periodoPulso * (0.97 + azar() * 0.06)) * tasa);
          const L = Math.floor(largoPulso * tasa * (0.9 + azar() * 0.2));
          const f = fc * (0.995 + azar() * 0.01);
          const ap = amp * (p === 0 ? 0.7 : 1) * (0.85 + azar() * 0.3);
          for (let k = 0; k < L; k++) {
            const x = k / L;
            // sube rápido y se apaga más despacio
            const e = x < 0.25 ? Math.sin((x / 0.25) * Math.PI / 2) : Math.cos(((x - 0.25) / 0.75) * Math.PI / 2);
            fase += DOS_PI * f * (1.012 - 0.024 * x) / tasa; if (fase > DOS_PI) fase -= DOS_PI;
            const v = ap * e * e * (Math.sin(fase) + a2 * Math.sin(2 * fase) + a3 * Math.sin(3 * fase));
            const idx = (inicio + k) % n;
            I[idx] += v * gi; D[idx] += v * gd;
          }
        }
      }
      t += periodoCanto * (0.9 + azar() * 0.2);
      yield;
    }
  }
  yield* terminar(I, tasa, { corte: 200, bucle: true });
  yield* terminar(D, tasa, { corte: 200, bucle: true });
  let max = 0;
  for (let i = 0; i < n; i++) { const a = Math.max(Math.abs(I[i]), Math.abs(D[i])); if (a > max) max = a; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  const k = 0.5 / Math.max(1e-9, max);
  for (let i = 0; i < n; i++) { I[i] *= k; D[i] *= k; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  return [I, D];
}

// La colmena: muchas abejas, cada una con su aleteo (190 a 250 Hz) rico en armónicos,
// que se corre de tono y se acerca y se aleja. Juntas hacen el rumor; ninguna es una
// sierra. Cada abeja lee una tabla de un ciclo, que es mucho más barato que sumar senos.
function* enjambre(tasa, seg, azar = Math.random, abejas = 11) {
  const fundido = Math.floor(tasa * 0.3), n = Math.floor(tasa * seg) + fundido;
  const d = new Float32Array(n);
  const T = 1024, tabla = new Float32Array(T + 1);
  for (let i = 0; i <= T; i++) {
    let v = 0;
    for (let h = 1; h <= 14; h++) v += Math.sin(DOS_PI * h * i / T + h * 0.7) / Math.pow(h, 1.25) * (h === 2 ? 1.3 : 1);
    tabla[i] = v * 0.45;
  }
  for (let a = 0; a < abejas; a++) {
    const f0 = 185 + azar() * 70;
    const r1 = 0.3 + azar() * 1.2, r2 = 0.07 + azar() * 0.3, f1 = azar() * DOS_PI, f2 = azar() * DOS_PI;
    const amp = 0.4 + azar() * 0.6;
    let fase = azar(), inc = 0, cerca = 0;
    for (let i = 0; i < n; i++) {
      // el vuelo cambia despacio: alcanza con recalcularlo cada 32 muestras
      if ((i & 31) === 0) {
        const t = i / tasa;
        inc = f0 * (1 + 0.035 * Math.sin(DOS_PI * r1 * t + f1) + 0.02 * Math.sin(DOS_PI * r2 * 3.1 * t + f2)) / tasa;
        cerca = amp * (0.55 + 0.45 * Math.sin(DOS_PI * r2 * t + f2));
        if ((i & 4095) === 0) yield;
      }
      fase += inc; if (fase >= 1) fase -= 1;
      const x = fase * T, k = x | 0, fr = x - k;
      d[i] += (tabla[k] + (tabla[k + 1] - tabla[k]) * fr) * cerca;
    }
  }
  const lp = new Biquad('lp', 2800, 0.6, tasa);
  for (let i = 0; i < n; i++) { d[i] = lp.paso(d[i]); if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  yield;
  return yield* terminar(cerrarBucle(d, fundido), tasa, { corte: 60, rms: 0.25, bucle: true });
}

// El fuego: chasquidos de todo tamaño, en racimos, y el soplido agudo de la leña que
// larga gas. Lo grave del fuego (el rumor) va en vivo, porque respira con el viento.
function* crepitar(tasa, seg, azar = Math.random) {
  const fundido = Math.floor(tasa * 0.2), n = Math.floor(tasa * seg) + fundido;
  const d = new Float32Array(n);
  let t = 0, cuenta = 0;
  while (t < n) {
    if ((++cuenta & 15) === 0) yield;
    const amp = Math.pow(azar(), 2.6) * 0.9 + 0.03;
    tic(d, t, Math.floor(tasa * (0.0003 + azar() * 0.0022)), amp, 0.3 + azar() * 0.7, azar);
    // los grandes estallan con un poco de cuerpo: la leña que se raja
    if (amp > 0.5 && azar() < 0.5) {
      const f = 500 + azar() * 1400, L = Math.floor(tasa * (0.006 + azar() * 0.012));
      let fase = 0;
      for (let k = 0; k < L && t + k < n; k++) { fase += DOS_PI * f / tasa; d[t + k] += Math.sin(fase) * amp * 0.35 * Math.exp(-k / (L / 4)); }
    }
    // en racimos: un chasquido llama a otros
    const espera = azar() < 0.4 ? 0.004 + azar() * 0.03 : -Math.log(1 - azar() * 0.999) / 16;
    t += Math.max(1, Math.floor(espera * tasa));
  }
  // el gas que silba en la leña: un siseo que va y viene
  const hp = new Biquad('hp', 3200, 0.6, tasa);
  let lento = 0, objetivo = 0.5;
  for (let i = 0; i < n; i++) {
    if (azar() < 3 / tasa) objetivo = azar();
    lento += (objetivo - lento) * (20 / tasa);
    d[i] += hp.paso(azar() * 2 - 1) * 0.02 * (0.3 + lento * 1.4);
    if ((i & 4095) === 4095) yield;
  }
  yield;
  return yield* terminar(cerrarBucle(d, fundido), tasa, { corte: 90, techo: 6, rms: 0.13, bucle: true });
}

// Un estallido suelto de la leña (o una chispa), para ponerle un golpe encima al bucle.
function* estallido(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 0.09), d = new Float32Array(n);
  tic(d, 0, Math.floor(tasa * (0.001 + azar() * 0.002)), 1, 0.6 + azar() * 0.4, azar);
  yield;
  const f = 600 + azar() * 1500, L = Math.floor(tasa * (0.01 + azar() * 0.02));
  let fase = 0;
  for (let k = 0; k < L; k++) { fase += DOS_PI * f * (1 - 0.15 * k / L) / tasa; d[k] += Math.sin(fase) * 0.4 * Math.exp(-k / (L / 5)); }
  for (let r = 0; r < 2 + Math.floor(azar() * 4); r++) {
    tic(d, Math.floor(tasa * (0.005 + azar() * 0.07)), Math.floor(tasa * 0.0008), 0.15 + azar() * 0.35, 0.8, azar);
  }
  return yield* terminar(d, tasa, { corte: 100, pico: 0.9 });
}

// Un borboteo suelto: el agua que salta una piedra y larga cuatro o cinco burbujas.
function* borboteo(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 0.3), d = new Float32Array(n);
  const cuantas = 2 + Math.floor(azar() * 5), grave = 320 + azar() * 500;
  for (let b = 0; b < cuantas; b++) {
    const f0 = grave * Math.pow(3.5, azar());
    burbuja(d, Math.floor(tasa * azar() * 0.12), f0, (0.4 + azar() * 0.6) * Math.pow(600 / f0, 0.5), tasa, 0.1 + azar() * 0.15);
    yield;
  }
  return yield* terminar(d, tasa, { corte: 60, pico: 0.9 });
}

// El retumbo de algo grande (una explosión, un derrumbe, un trueno): no es un golpe de
// ruido que se apaga parejo, es un estallido y después ecos y rodadas que vuelven del
// valle, cada vez más graves y más débiles. `seg` alcanza para el trueno más largo.
function* retumbo(tasa, seg, azar = Math.random, rodadas = 6) {
  const n = Math.floor(tasa * seg), env = new Float32Array(n), d = new Float32Array(n);
  // cada golpe sube con su ataque y cae con su caída; las exponenciales van
  // multiplicando, que es mucho más barato que calcularlas en cada muestra
  const golpe = (i0, amp, ataque, caida) => {
    const kA = Math.exp(-1 / (ataque * tasa)), kC = Math.exp(-1 / (caida * tasa));
    let a = 1, c = amp;
    for (let k = 0; i0 + k < n; k++) {
      const v = (1 - a) * c;
      if (v < 1e-4 && k > ataque * tasa * 4) break;
      env[i0 + k] += v;
      a *= kA; c *= kC;
    }
  };
  golpe(0, 1, 0.004, 0.35);
  yield;
  for (let r = 0; r < rodadas; r++) {
    const t0 = 0.06 + Math.pow(azar(), 0.8) * seg * 0.55;
    golpe(Math.floor(t0 * tasa), (0.25 + azar() * 0.5) * Math.exp(-t0 / (seg * 0.4)), 0.03 + azar() * 0.08, 0.2 + azar() * 0.5);
    yield;
  }
  // ruido marrón (grave de verdad) mezclado con algo de rosado para el cuerpo
  let marron = 0, b0 = 0, b1 = 0;
  for (let i = 0; i < n; i++) {
    const w = azar() * 2 - 1;
    marron = (marron + w * 0.06) * 0.996;
    b0 = 0.99 * b0 + w * 0.1; b1 = 0.93 * b1 + w * 0.3;
    d[i] = (marron * 2.5 + (b0 + b1 + w * 0.15) * 0.6) * env[i];
    if ((i & 4095) === 4095) yield;
  }
  return yield* terminar(d, tasa, { corte: 20, pico: 0.9 });
}

// ------------------------------------------------------------------ pisadas
// Una pisada son dos contactos (el talón y la punta) y cada contacto excita el suelo en
// tres capas: el golpe grave del peso, la textura (tics: hojas, nieve, granza) y el roce.
// Cada suelo es una receta de esas tres cosas; cada variante la tira de nuevo al azar.
export const SUELOS = {
  tierra: { golpe: [320, 0.022, 1], granos: [700, 0.06, 0.45, 0.35], roce: [1300, 0.07, 0.25] },
  pasto: { golpe: [260, 0.016, 0.55], granos: [2600, 0.12, 0.7, 0.28], roce: [3200, 0.14, 0.55] },
  hojas: { golpe: [230, 0.012, 0.35], granos: [3600, 0.15, 0.65, 0.85], roce: [2900, 0.08, 0.3] },
  hojarasca: { golpe: [270, 0.018, 0.6], granos: [1900, 0.11, 0.55, 0.55], roce: [1900, 0.1, 0.35], ramita: 0.28 },
  nieve: { golpe: [210, 0.028, 0.5], granos: [4200, 0.19, 0.4, 0.6], roce: [1500, 0.1, 0.25], compacta: true },
  escarcha: { golpe: [320, 0.012, 0.3], granos: [5200, 0.07, 0.9, 0.62], roce: [4800, 0.05, 0.2] },
  piedra: { golpe: [700, 0.006, 0.9], granos: [500, 0.04, 0.85, 0.35], roce: [2600, 0.03, 0.12], chasquido: true },
  madera: { golpe: [0, 0, 0], granos: [400, 0.04, 0.5, 0.2], roce: [1700, 0.06, 0.4] },
};

function* contacto(d, i0, S, fuerza, tasa, azar, largoCompresion = 1) {
  const [fg, tg, ag] = S.golpe;
  if (ag > 0) {
    // el peso: ruido por un pasabajos de dos polos, se apaga en decenas de ms
    const lp = new Biquad('lp', fg * (0.85 + azar() * 0.3), 0.9, tasa);
    const L = Math.floor(tg * 6 * tasa);
    for (let k = 0; k < L && i0 + k < d.length; k++) {
      const x = k / tasa, env = (1 - Math.exp(-x / 0.0015)) * Math.exp(-x / tg);
      d[i0 + k] += lp.paso(azar() * 2 - 1) * env * ag * fuerza * 3.2;
    }
    yield;
  }
  // la textura: tics más densos en el medio del apoyo
  const [dens, dur, brillo, ab] = S.granos;
  const L = Math.floor(dur * largoCompresion * tasa * (0.85 + azar() * 0.3));
  const p = dens / tasa;
  for (let k = 0; k < L && i0 + k < d.length; k++) {
    const x = k / L;
    // la nieve cruje cuando se aprieta: la densidad crece y se corta de golpe
    const forma = S.compacta ? Math.pow(x, 0.7) * (x < 0.85 ? 1 : (1 - x) / 0.15) : Math.sin(Math.PI * Math.pow(x, 0.6));
    if (azar() < p * forma * fuerza) {
      tic(d, i0 + k, Math.floor(tasa * (0.0003 + azar() * 0.0015)), ab * (0.3 + azar() * 0.9) * fuerza, clamp(brillo + (azar() - 0.5) * 0.3, 0.05, 1), azar);
    }
  }
  yield;
  // el roce: un soplo de ruido en su banda
  const [fr, tr, ar] = S.roce;
  const bp = new Biquad('bp', fr * (0.8 + azar() * 0.4), 0.8, tasa);
  const Lr = Math.floor(tr * tasa);
  const demora = Math.floor(tasa * 0.008);
  for (let k = 0; k < Lr && i0 + demora + k < d.length; k++) {
    const x = k / Lr, env = Math.sin(Math.PI * Math.pow(x, 0.5)) * (1 - x);
    d[i0 + demora + k] += bp.paso(azar() * 2 - 1) * env * ar * fuerza;
  }
}

function* pisada(superficie, tasa, azar = Math.random, correr = false) {
  if (superficie === 'agua') return yield* chapoteo(tasa, azar, correr ? 0.8 : 0.5, 'pie');
  const S = SUELOS[superficie] || SUELOS.hojarasca;
  const n = Math.floor(tasa * 0.34), d = new Float32Array(n);
  // corriendo cae de golpe con todo el pie; caminando, talón y después la punta
  if (correr) {
    yield* contacto(d, 0, S, 1, tasa, azar, 0.7);
    yield* contacto(d, Math.floor(tasa * (0.018 + azar() * 0.012)), S, 0.45, tasa, azar, 0.5);
  } else {
    yield* contacto(d, 0, S, 1, tasa, azar);
    yield* contacto(d, Math.floor(tasa * (0.055 + azar() * 0.05)), S, 0.5 + azar() * 0.25, tasa, azar, 0.7);
  }
  yield;
  // una ramita que se parte bajo el pie
  if (S.ramita && azar() < S.ramita) {
    const i0 = Math.floor(tasa * (0.01 + azar() * 0.08));
    tic(d, i0, Math.floor(tasa * 0.0012), 0.9, 1, azar);
    const f = 1400 + azar() * 1800;
    let fase = 0;
    for (let k = 0; k < tasa * 0.012 && i0 + k < n; k++) { fase += DOS_PI * f / tasa; d[i0 + k] += Math.sin(fase) * 0.3 * Math.exp(-k / (tasa * 0.0025)); }
  }
  // la piedra: el taco contra la roca, seco y brillante
  if (S.chasquido) tic(d, 0, Math.floor(tasa * 0.0015), 1.2, 0.95, azar);
  // el final se apaga del todo, para que no quede un escalón
  const f = Math.floor(tasa * 0.03);
  for (let k = 0; k < f; k++) d[n - 1 - k] *= k / f;
  return yield* terminar(d, tasa, { corte: 40, pico: 0.9 });
}

// ------------------------------------------------------------------ agua
// El chapoteo: el golpe contra la superficie (un ruido que se cierra de agudo a grave),
// la nube de burbujas que queda abajo y las gotas que vuelven a caer.
function* chapoteo(tasa, azar = Math.random, tamaño = 1, tipo = 'golpe') {
  const pie = tipo === 'pie', remo = tipo === 'remo';
  const seg = pie ? 0.55 : remo ? 0.8 : 0.5 + tamaño * 0.7;
  const n = Math.floor(tasa * seg), d = new Float32Array(n);
  const lp = new Biquad('lp', 3000, 0.7, tasa);
  const golpe = remo ? 0.22 : 0.06 + tamaño * 0.08, ataque = remo ? 0.06 : 0.003;
  const Lg = Math.floor(tasa * golpe * 4);
  for (let k = 0; k < Lg && k < n; k++) {
    const x = k / tasa;
    if (k % 32 === 0) lp.poner('lp', 450 + 3200 * Math.exp(-x / (golpe * 0.8)) * (remo ? 0.6 : 1), 0.8, tasa);
    const env = (1 - Math.exp(-x / ataque)) * Math.exp(-x / golpe);
    d[k] += lp.paso(azar() * 2 - 1) * env * (remo ? 0.5 : 0.9);
  }
  yield;
  const burbujas = Math.floor((pie ? 7 : remo ? 10 : 6 + tamaño * 14) * (0.7 + azar() * 0.6));
  for (let b = 0; b < burbujas; b++) {
    const i0 = Math.floor(tasa * (0.01 + Math.pow(azar(), 1.5) * seg * 0.55));
    const f0 = (pie || remo ? 500 : 280) * Math.pow(6, azar()) / Math.sqrt(tamaño);
    burbuja(d, i0, f0, (0.08 + azar() * 0.22) * Math.pow(1000 / f0, 0.4), tasa, 0.1 + azar() * 0.1);
    if ((b & 3) === 3) yield;
  }
  // las gotas que vuelven a caer
  const gotas = Math.floor((pie ? 3 : 2 + tamaño * 4) * (0.6 + azar() * 0.8));
  for (let g = 0; g < gotas; g++) {
    const i0 = Math.floor(tasa * (seg * 0.25 + azar() * seg * 0.6));
    tic(d, i0, Math.floor(tasa * 0.001), 0.06 + azar() * 0.1, 0.9, azar);
    burbuja(d, i0, 1400 + azar() * 2600, 0.03 + azar() * 0.05, tasa, 0.2);
  }
  const f = Math.floor(tasa * 0.04);
  for (let k = 0; k < f; k++) d[n - 1 - k] *= k / f;
  return yield* terminar(d, tasa, { corte: 40, pico: 0.9 });
}

// ------------------------------------------------------------------ madera que roza
// La bisagra que chirría no es un tono: es fricción que se pega y se suelta cientos de
// veces por segundo (stick-slip). Cada suelta es un golpecito que hace sonar la hoja de
// la puerta en sus modos. El ritmo de las sueltas sigue a la presión, que tiembla.
function* chirrido(tasa, azar = Math.random, seg = 0.5) {
  const n = Math.floor(tasa * seg), d = new Float32Array(n);
  const modos = [[640, 26], [1230, 30], [2380, 34], [3900, 26]].map(([f, q], i) => [new Biquad('bp', f * (0.88 + azar() * 0.24), q, tasa), 1 / (1 + i * 0.6)]);
  const r0 = 240 + azar() * 220, r1 = 90 + azar() * 90;
  let t = 0, deriva = 0;
  const pulsos = new Float32Array(n);
  while (t < n) {
    const x = t / n;
    deriva += (azar() - 0.5) * 0.25; deriva *= 0.95;
    const tasaPulsos = (r0 + (r1 - r0) * x) * (1 + 0.18 * Math.sin(x * 23) + deriva * 0.3);
    const env = Math.min(1, x / 0.06) * Math.min(1, (1 - x) / 0.2);
    pulsos[t] = env * (0.6 + azar() * 0.4);
    t += Math.max(2, Math.floor(tasa / Math.max(40, tasaPulsos)));
  }
  yield;
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const [f, g] of modos) v += f.paso(pulsos[i]) * g;
    d[i] = v;
    if ((i & 2047) === 2047) yield;
  }
  return yield* terminar(d, tasa, { corte: 60, pico: 0.9 });
}

// ------------------------------------------------------------------ cuerdas pulsadas
// Karplus-Strong extendido: una línea de retardo del largo de un período, cargada con un
// golpe de ruido, que se realimenta a través de un promedio (que se come los agudos,
// como la cuerda real) y un pasatodo que afina la fracción de muestra que falta.
// Dos cuerdas apenas desafinadas, como el orden doble del charango, y un cuerpo de
// madera: tres resonancias graves que le dan caja.
function* cuerdaPulsada(tasa, frec, seg, { brillo = 0.5, posicion = 0.16, doble = 1.6, caida = null, amortiguar = 0.5, cuerpo = true } = {}, azar = Math.random) {
  const n = Math.floor(tasa * seg), d = new Float32Array(n);
  const t60 = caida ?? clamp(8.5 * Math.pow(110 / frec, 0.5), 2.2, 8);
  const cuerdas = doble ? [-doble / 2, doble / 2] : [0];
  for (const cents of cuerdas) {
    const f = frec * Math.pow(2, cents / 1200);
    const periodo = tasa / f;
    const S = amortiguar;
    const Ni = Math.max(2, Math.floor(periodo - S - 0.15));
    const frac = periodo - S - Ni;
    const C = (1 - frac) / (1 + frac);
    // el promedio también se come algo de la fundamental en cada vuelta (mucho en las
    // notas agudas): se compensa, para que la cuerda dure lo que tiene que durar
    const w = DOS_PI * f / tasa;
    const perdida = Math.hypot((1 - S) + S * Math.cos(w), S * Math.sin(w));
    const rho = Math.min(0.99995, Math.pow(10, -3 / (f * t60)) / perdida);
    // el golpe: ruido suavizado según el brillo y con el peine del lugar donde se pulsa
    const linea = new Float32Array(Ni);
    let lp = 0;
    const a = 0.15 + brillo * 0.8;
    const exc = new Float32Array(Ni);
    for (let i = 0; i < Ni; i++) { lp += ((azar() * 2 - 1) - lp) * a; exc[i] = lp; }
    const corrida = Math.max(1, Math.round(posicion * Ni));
    let m = 0;
    for (let i = 0; i < Ni; i++) { linea[i] = exc[i] - exc[(i - corrida + Ni) % Ni]; m += linea[i]; }
    m /= Ni;
    for (let i = 0; i < Ni; i++) linea[i] -= m;
    let idx = 0, previo = 0, apX = 0, apY = 0;
    const g = cuerdas.length > 1 ? (cents < 0 ? 0.6 : 0.4) : 1;
    for (let i = 0; i < n; i++) {
      const y = linea[idx];
      const prom = (1 - S) * y + S * previo; previo = y;
      const ap = C * prom + apX - C * apY; apX = prom; apY = ap;
      linea[idx] = ap * rho;
      d[i] += y * g;
      if (++idx >= Ni) idx = 0;
      if ((i & (TROZO - 1)) === TROZO - 1) yield;
    }
  }
  if (cuerpo) {
    const modos = [new Biquad('bp', 105, 7, tasa), new Biquad('bp', 205, 9, tasa), new Biquad('bp', 410, 6, tasa)];
    const nivel = [0.5, 0.35, 0.22];
    for (let i = 0; i < n; i++) {
      const x = d[i];
      d[i] = x + modos[0].paso(x) * nivel[0] + modos[1].paso(x) * nivel[1] + modos[2].paso(x) * nivel[2];
      if ((i & (TROZO - 1)) === TROZO - 1) yield;
    }
  }
  // el ataque, apenas redondeado (sin esto la púa hace clic), y el final a cero
  const at = Math.floor(tasa * 0.0015);
  for (let k = 0; k < at; k++) d[k] *= k / at;
  const f = Math.floor(tasa * 0.05);
  for (let k = 0; k < f; k++) d[n - 1 - k] *= k / f;
  yield* terminar(d, tasa, { corte: 30 });
  // se normaliza por el cuerpo de la nota, no por el chasquido de la púa: si no, las
  // notas con más ruido al atacar sonarían más bajas
  const cuerpoNota = medir(d.subarray(Math.floor(tasa * 0.01), Math.floor(tasa * Math.min(seg, 0.3)))).rms;
  const pico = medir(d.subarray(0, Math.floor(tasa * Math.min(seg, 0.3)))).pico;
  let k = cuerpoNota > 0 ? 0.22 / cuerpoNota : 1;
  if (pico * k > 0.95) k = 0.95 / pico;
  for (let i = 0; i < n; i++) { d[i] *= k; if ((i & (TROZO - 1)) === TROZO - 1) yield; }
  return d;
}

// ------------------------------------------------------------------ aves
// Una nota de ave: un silbido cuya frecuencia sigue una curva (puntos [x, Hz], con x de
// 0 a 1, interpolada en escala logarítmica, que es como oye el oído), con armónicos
// débiles, un trino opcional (modulación de frecuencia), una aspereza opcional
// (modulación de amplitud) y la envolvente de un pico que se abre y se cierra.
function* nota(d, tasa, { t0 = 0, dur, curva, amp = 1, arm = [1, 0.1, 0.03], trino = null, aspero = null, ataque = 0.15, caida = 0.35, soplo = 0 }, azar = Math.random) {
  const i0 = Math.floor(t0 * tasa), N = Math.floor(dur * tasa);
  const lc = curva.map(([x, f]) => [x, Math.log(f)]);
  let fase = azar() * 0.2, faseT = azar() * DOS_PI, faseA = azar() * DOS_PI, tramo = 0, ruido = 0;
  const nyq = tasa * 0.45;
  for (let i = 0; i < N; i++) {
    const idx = i0 + i;
    if (idx >= d.length) break;
    const x = i / N;
    while (tramo < lc.length - 2 && x > lc[tramo + 1][0]) tramo++;
    const [xa, la] = lc[tramo], [xb, lb] = lc[Math.min(tramo + 1, lc.length - 1)];
    let f = Math.exp(xb > xa ? la + (lb - la) * clamp((x - xa) / (xb - xa), 0, 1) : la);
    if (trino) { f *= 1 + trino.prof * Math.sin(faseT); faseT += DOS_PI * trino.frec / tasa; }
    fase += DOS_PI * f / tasa; if (fase > DOS_PI) fase -= DOS_PI;
    let s = 0;
    for (let h = 0; h < arm.length; h++) if (f * (h + 1) < nyq) s += arm[h] * Math.sin(fase * (h + 1));
    if (aspero) { s *= 1 - aspero.prof * (0.5 + 0.5 * Math.sin(faseA)); faseA += DOS_PI * aspero.frec / tasa; }
    if (soplo) { ruido += ((azar() * 2 - 1) - ruido) * 0.5; s += ruido * soplo; }
    const e = x < ataque ? Math.sin((x / ataque) * Math.PI / 2) : x > 1 - caida ? Math.sin(((1 - x) / caida) * Math.PI / 2) : 1;
    d[idx] += amp * e * e * s;
    if ((i & 2047) === 2047) yield;
  }
}

// Un golpe en madera (el carpintero): el clic del pico y los modos del tronco.
function toc(d, tasa, t0, amp, azar, modos) {
  const i0 = Math.floor(t0 * tasa);
  tic(d, i0, Math.floor(tasa * 0.0008), amp * 0.8, 1, azar);
  for (const [f, tau, a] of modos) {
    const ff = f * (0.97 + azar() * 0.06);
    let fase = 0;
    const L = Math.floor(tau * 6 * tasa);
    for (let k = 0; k < L && i0 + k < d.length; k++) { fase += DOS_PI * ff / tasa; d[i0 + k] += Math.sin(fase) * a * amp * Math.exp(-k / (tau * tasa)); }
  }
}

const az = (azar, a, b) => a + azar() * (b - a);

// Cada especie es una manera de armar la frase. Los números salen de escuchar
// grabaciones del bosque andino: rangos de tono, largo de nota y cuántas por frase.
export const CANTOS = {
  // el zorzal patagónico: frases variadas de silbidos limpios, algunos con trino
  *zorzal(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 2.4));
    const n = 3 + Math.floor(azar() * 5);
    let c = 0.02;
    for (let i = 0; i < n && c < 2.1; i++) {
      const dur = az(azar, 0.08, 0.24), f = az(azar, 1900, 3200), tipo = azar();
      const curva = tipo < 0.3 ? [[0, f], [1, f * az(azar, 1.15, 1.4)]]
        : tipo < 0.6 ? [[0, f * 1.2], [1, f * az(azar, 0.7, 0.85)]]
          : [[0, f], [0.45, f * az(azar, 1.2, 1.35)], [1, f * az(azar, 0.8, 0.95)]];
      yield* nota(d, tasa, { t0: c, dur, curva, amp: az(azar, 0.6, 1), arm: [1, 0.08, 0.02], trino: tipo > 0.82 ? { frec: az(azar, 28, 45), prof: 0.05 } : null, ataque: 0.12, caida: 0.4 }, azar);
      c += dur + az(azar, 0.03, 0.14);
    }
    return d.subarray(0, Math.min(d.length, Math.floor((c + 0.05) * tasa)));
  },
  // el rayadito: un trino agudo y rápido, notas que bajan de golpe
  *rayadito(tasa, azar) {
    const n = 8 + Math.floor(azar() * 10), paso = az(azar, 0.042, 0.052);
    const d = new Float32Array(Math.floor(tasa * (n * paso + 0.1)));
    const base = az(azar, 5600, 6800);
    for (let i = 0; i < n; i++) {
      const f = base * (1 - i * 0.008) * az(azar, 0.97, 1.03);
      yield* nota(d, tasa, { t0: i * paso, dur: az(azar, 0.026, 0.036), curva: [[0, f * 1.12], [0.4, f], [1, f * 0.82]], amp: i === 0 ? 0.6 : az(azar, 0.8, 1), arm: [1, 0.05], ataque: 0.1, caida: 0.5 }, azar);
    }
    return d;
  },
  // el fío-fío: dos silbidos con un raspado fino, el primero sube y el segundo baja
  *fiofio(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.6));
    const f = az(azar, 2500, 2800);
    yield* nota(d, tasa, { t0: 0.01, dur: 0.18, curva: [[0, f], [0.7, f * 1.4], [1, f * 1.35]], amp: 1, arm: [1, 0.1, 0.03], aspero: { frec: 58, prof: 0.35 }, ataque: 0.2, caida: 0.3 }, azar);
    yield* nota(d, tasa, { t0: 0.3, dur: 0.22, curva: [[0, f * 1.35], [0.3, f * 1.3], [1, f * 0.92]], amp: 0.9, arm: [1, 0.1, 0.03], aspero: { frec: 52, prof: 0.3 }, ataque: 0.15, caida: 0.4 }, azar);
    return d;
  },
  // el chucao: fuerte y grave, un gorgoteo que baja; la última nota, la más larga
  *chucao(tasa, azar) {
    const n = 4 + Math.floor(azar() * 3);
    const d = new Float32Array(Math.floor(tasa * (n * 0.2 + 0.4)));
    let c = 0.01;
    for (let i = 0; i < n; i++) {
      const f = (920 - i * 48) * az(azar, 0.96, 1.04), ultima = i === n - 1;
      const dur = ultima ? 0.3 : az(azar, 0.11, 0.14);
      const curva = ultima ? [[0, f * 1.05], [0.25, f * 1.18], [1, f * 0.78]] : [[0, f * 0.95], [0.35, f * 1.12], [1, f * 0.86]];
      yield* nota(d, tasa, { t0: c, dur, curva, amp: ultima ? 1 : 0.85, arm: [1, 0.5, 0.22, 0.08], aspero: { frec: az(azar, 38, 50), prof: 0.45 }, ataque: 0.12, caida: 0.35, soplo: 0.03 }, azar);
      c += dur + az(azar, 0.05, 0.07);
    }
    return d;
  },
  // el carpintero negro: su golpe doble, «ta-TOC», en un tronco hueco
  *carpintero(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.4));
    const modos = [[az(azar, 480, 620), 0.022, 0.6], [az(azar, 1150, 1450), 0.012, 0.35], [az(azar, 2500, 2900), 0.006, 0.2]];
    toc(d, tasa, 0, 0.55, azar, modos);
    yield;
    toc(d, tasa, az(azar, 0.068, 0.085), 1, azar, modos);
    yield;
    return d;
  },
  // las cachañas: una bandada de loros, gritos ásperos que se pisan
  *cachanas(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 1.9));
    for (let i = 0; i < 13; i++) {
      const f = az(azar, 1500, 2500), dur = az(azar, 0.06, 0.14);
      yield* nota(d, tasa, { t0: az(azar, 0, 1.65), dur, curva: [[0, f * 0.9], [0.3, f * az(azar, 1.05, 1.25)], [1, f * az(azar, 0.7, 0.9)]], amp: az(azar, 0.5, 1), arm: [1, 0.7, 0.5, 0.32, 0.2, 0.1], trino: { frec: az(azar, 40, 60), prof: 0.03 }, aspero: { frec: az(azar, 110, 160), prof: 0.6 }, ataque: 0.1, caida: 0.35, soplo: 0.12 }, azar);
    }
    return d;
  },
  // el concón: ululatos graves que se apuran
  *concon(tasa, azar) {
    const n = 6 + Math.floor(azar() * 4);
    const d = new Float32Array(Math.floor(tasa * (n * 0.42 + 0.3)));
    let c = 0.01;
    for (let i = 0; i < n; i++) {
      const f = az(azar, 380, 400);
      yield* nota(d, tasa, { t0: c, dur: az(azar, 0.19, 0.24), curva: [[0, f * 0.97], [0.3, f], [1, f * 0.88]], amp: 1 - i * 0.03, arm: [1, 0.12, 0.03], ataque: 0.35, caida: 0.45, soplo: 0.015 }, azar);
      c += 0.42 - i * 0.025;
    }
    return d;
  },
  // la ranita del mallín: trenes de pulsos cortos, un crujido que casi es un clic
  *ranita(tasa, azar) {
    const llamados = 1 + Math.floor(azar() * 3);
    const d = new Float32Array(Math.floor(tasa * (llamados * 0.45 + 0.1)));
    const fc = az(azar, 1500, 2100);
    for (let l = 0; l < llamados; l++) {
      const pulsos = 6 + Math.floor(azar() * 7), ritmo = az(azar, 55, 85);
      for (let p = 0; p < pulsos; p++) {
        const x = p / pulsos, env = Math.sin(Math.PI * (0.15 + x * 0.85));
        yield* nota(d, tasa, { t0: l * 0.42 + p / ritmo, dur: az(azar, 0.006, 0.009), curva: [[0, fc * 1.06], [1, fc * 0.94]], amp: env * az(azar, 0.8, 1), arm: [1, 0.55, 0.3, 0.12], ataque: 0.2, caida: 0.6 }, azar);
      }
    }
    return d;
  },
  // las bandurrias: gritos metálicos de a dos, «cac-cac»
  *bandurrias(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 3.4));
    const n = 6 + Math.floor(azar() * 6);
    let c = 0.01;
    for (let i = 0; i < n && c < 3.1; i++) {
      const f = az(azar, 1250, 1800);
      yield* nota(d, tasa, { t0: c, dur: 0.07, curva: [[0, f], [0.4, f * 1.22], [1, f * 1.05]], amp: 0.9, arm: [0.6, 1, 0.8, 0.5, 0.25], aspero: { frec: 95, prof: 0.4 }, ataque: 0.1, caida: 0.4, soplo: 0.05 }, azar);
      yield* nota(d, tasa, { t0: c + 0.085, dur: 0.09, curva: [[0, f * 1.25], [1, f * 0.98]], amp: 0.75, arm: [0.6, 1, 0.8, 0.5, 0.25], aspero: { frec: 90, prof: 0.4 }, ataque: 0.1, caida: 0.4, soplo: 0.05 }, azar);
      c += az(azar, 0.2, 0.36);
    }
    return d.subarray(0, Math.min(d.length, Math.floor((c + 0.2) * tasa)));
  },
  // el picaflor: tres «tsip» finísimos
  *picaflor(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.5));
    for (let i = 0; i < 3; i++) {
      const f = az(azar, 6300, 6800);
      yield* nota(d, tasa, { t0: 0.01 + i * 0.09, dur: 0.03, curva: [[0, f], [0.3, f * 1.05], [1, f * 0.88]], amp: 1, arm: [1, 0.05], ataque: 0.15, caida: 0.5 }, azar);
    }
    return d;
  },
  // el cisne de cuello negro: un silbido suave, casi de flauta
  *cisnes(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 1));
    yield* nota(d, tasa, { t0: 0.01, dur: 0.36, curva: [[0, 700], [0.6, 900], [1, 880]], amp: 1, arm: [1, 0.3, 0.12], trino: { frec: 6, prof: 0.012 }, ataque: 0.25, caida: 0.35, soplo: 0.03 }, azar);
    yield* nota(d, tasa, { t0: 0.46, dur: 0.42, curva: [[0, 820], [1, 640]], amp: 0.85, arm: [1, 0.3, 0.12], trino: { frec: 6, prof: 0.012 }, ataque: 0.25, caida: 0.4, soplo: 0.03 }, azar);
    return d;
  },
  // el martín pescador: una matraca seca
  *martin(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.7));
    const ritmo = az(azar, 19, 24);
    for (let i = 0; i < 12; i++) {
      const f = az(azar, 2900, 3400);
      yield* nota(d, tasa, { t0: 0.01 + i / ritmo, dur: 0.02, curva: [[0, f * 1.08], [1, f * 0.9]], amp: az(azar, 0.8, 1), arm: [1, 0.7, 0.45, 0.25], ataque: 0.08, caida: 0.6, soplo: 0.25 }, azar);
    }
    return d;
  },
  // el cauquén: dos graznidos nasales
  *cauquen(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.55));
    for (let i = 0; i < 2; i++) {
      const f = az(azar, 1180, 1300);
      yield* nota(d, tasa, { t0: 0.01 + i * 0.3, dur: 0.16, curva: [[0, f], [0.3, f * 1.04], [1, f * 0.78]], amp: 1, arm: [0.7, 1, 0.6, 0.3, 0.15], trino: { frec: 22, prof: 0.02 }, aspero: { frec: 70, prof: 0.3 }, ataque: 0.15, caida: 0.4, soplo: 0.04 }, azar);
    }
    return d;
  },
  // un chillido chiquito, agudo (ratón, murciélago)
  *chillido(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.32));
    for (let i = 0; i < 4; i++) {
      const f = az(azar, 7200, 8600);
      yield* nota(d, tasa, { t0: 0.005 + i * 0.07, dur: 0.02, curva: [[0, f], [1, 5200]], amp: 1, arm: [1], ataque: 0.15, caida: 0.5 }, azar);
    }
    return d;
  },
  // un pajarito cualquiera, tres notas
  *ave(tasa, azar) {
    const d = new Float32Array(Math.floor(tasa * 0.35));
    for (let i = 0; i < 3; i++) {
      const f = az(azar, 2600, 3400);
      yield* nota(d, tasa, { t0: 0.005 + i * 0.1, dur: 0.07, curva: [[0, f], [0.3, f * 1.06], [1, az(azar, 1800, 2400)]], amp: 1, arm: [1, 0.12, 0.04], ataque: 0.15, caida: 0.4 }, azar);
    }
    return d;
  },
};

function* canto(especie, tasa, azar = Math.random) {
  const f = CANTOS[especie];
  if (!f) return null;
  const d = yield* f(tasa, azar);
  return yield* terminar(d, tasa, { corte: 150, pico: 0.9 });
}

// Los generadores se exportan acá, en una línea: el empaquetador (armar.mjs) reconoce
// `export function` pero no `export function*`.
export { terminar, susurroHojas, burbujeo, lluviaEstereo, coroGrillos, enjambre, crepitar, estallido, borboteo, retumbo, pisada, chapoteo, chirrido, cuerdaPulsada, nota, canto };
