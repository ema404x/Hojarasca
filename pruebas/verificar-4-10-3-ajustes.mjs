// 4.10.3 (personalización, ajustes y partidas): lo que arregla el pase de bugs de la zona P, ejecutado donde se puede en Node.
//   · P1/P2: el banco de pruebas no hace salir una oleada ni cambia el día de la partida (con «Hora de tu reloj» tampoco).
//   · P3: lo que se guardó por caídas de la placa vence a la semana (el 3D que no arranca, no).
//   · P5: tras «Bajar» la calidad, volver a elegir la de arranque pide reiniciar.
//   · P7: el botón de color enciende el «Con …» y el interruptor lo muestra.
//   · P9: un ajuste en null vale el de fábrica, no el mínimo.
//   · P10: si la partida nueva no cupo, la que había sigue ahí (principal, copia y miniatura).
//   · P11: la partida nueva no carga 8 KB de ceros.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { funcion } from './ayuda-codigo.mjs';

const almacen = new Map();
let cuotaLlena = false;   // mientras vale, no cabe la partida NUEVA (la del día 1); lo que ya había sí vuelve a entrar (se liberó su lugar)
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { if (cuotaLlena && /"dia":1,/.test(String(v))) throw new Error('QuotaExceededError'); almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const G = await import('../src/guardado.js');
const requerir = createRequire(import.meta.url);
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- P1: el banco no cuenta como hora de ataque
{
  const l = main.split('\n');
  const i = l.findIndex((x) => x.includes('desafio.actualizar(dt, ctxDesafio)'));
  ok(i > 1 && /if \(banco\.activa\) ctxDesafio\.fotoActiva = true;/.test(l[i - 1]), 'con el banco activo, el Desafío no revisa el horario (como con el modo foto)');
}

// ---------------------------------------------------------------- P2: el banco manda sobre la hora de la PC y no cambia el día
{
  class Reloj { getHours() { return 8; } getMinutes() { return 0; } getSeconds() { return 0; } }   // la PC marca las 08:00
  const correr = (banco) => {
    const progreso = { horas: 22.3, dia: 3, relojNoche: null };
    const env = { trucosJuego: null, jugador: { estado: {} }, foto: { activo: false }, ajustes: { duracion: 'reloj' }, banco, progreso, Date: Reloj,
      claveNocheReloj: () => 'noche', nota: () => {}, modo: 'jugando' };
    funcion(main, 'actualizarTiempo', env)(0.016);
    return progreso;
  };
  const enBanco = correr({ activa: true });
  ok(enBanco.horas === 22.3 && enBanco.dia === 3, 'en el banco, con la hora de tu reloj, el tramo «Noche» sigue a las 22,3 y el día no cambia');
  const normal = correr({ activa: false });
  ok(normal.horas === 8 && normal.dia === 4, 'fuera del banco, la hora del reloj manda y la medianoche suma el día (como siempre)');
  const e = main.indexOf('function empezarBanco('), t = main.indexOf('function terminarBanco(');
  ok(/horas: progreso\.horas, dia: progreso\.dia/.test(main.slice(e, e + 700)), 'el banco guarda el día al empezar');
  ok(/progreso\.dia = g\.dia/.test(main.slice(t, t + 600)), 'y lo devuelve al terminar');
}

// ---------------------------------------------------------------- P3: la vigencia de lo guardado por caídas
{
  const R = requerir('../recuperacion-main.cjs');
  const SEMANA = 7 * 24 * 3600 * 1000, DIA = 24 * 3600 * 1000;
  ok(R.intentoVigente({ intento: 3, porCaidas: true }, DIA, 4) === 3, 'por caídas, de hace un día: sigue valiendo');
  ok(R.intentoVigente({ intento: 3, porCaidas: true }, SEMANA + 1000, 4) === 0, 'por caídas, de hace más de una semana: vuelve a lo de siempre');
  ok(R.intentoVigente({ intento: 3 }, 100 * DIA, 4) === 3, 'si el 3D no arrancaba (sin porCaidas) no vence nunca: no hay otra forma');
  ok(R.intentoVigente({ intento: 9, porCaidas: true }, 0, 4) === 0 && R.intentoVigente(null, 0, 4) === 0 && R.intentoVigente({ intento: 'x' }, 0, 4) === 0, 'datos rotos: el intento 0');
  ok(R.intentoVigente({ intento: 3, porCaidas: true }, NaN, 4) === 0, 'sin edad conocida, por caídas: no se queda para siempre');
  const mainCjs = leer('main.cjs');
  ok(/intentoVigente\(JSON\.parse\(fs\.readFileSync\(a, 'utf8'\)\), Date\.now\(\) - fs\.statSync\(a\)\.mtimeMs, INTENTOS_GRAFICOS\.length\)/.test(mainCjs), 'main.cjs lo usa con la edad del archivo');
  ok(R.siguienteGraficosPorCaidas([{}, { 'ignore-gpu-blocklist': true }, { 'use-angle': 'd3d9' }, { 'use-angle': 'gl' }], 0) === 3, 'la protección por caídas sigue yendo al otro use-angle');
}

// ---------------------------------------------------------------- P5: ¿la calidad elegida pide reiniciar?
{
  const pide = (ajustes, inicial, activa) => funcion(main, 'calidadPideReinicio', { ajustes, calidadInicial: inicial, calidadActiva: activa })();
  ok(pide({ calidad: 'alta' }, 'alta', 'alta') === false, 'sin tocar nada, no pide');
  ok(pide({ calidad: 'media' }, 'alta', 'alta') === true, 'elegir otra, pide');
  ok(pide({ calidad: 'media' }, 'alta', 'media') === true, 'tras «Bajar» (corre Media): la elegida (Media) difiere de la de arranque: pide, como antes');
  ok(pide({ calidad: 'alta' }, 'alta', 'media') === true, 'tras «Bajar», volver a elegir Alta pide reiniciar (antes: no hacía nada y escondía el cartel)');
  ok(!main.includes("ajustes.calidad === calidadInicial") && !main.includes('if (ajustes.calidad !== calidadInicial) { location.reload()'), 'ya nadie compara sólo con la de arranque');
}

// ---------------------------------------------------------------- P7: el interruptor sigue al botón de color
{
  const C = await import('../src/personal-campos.js');
  const mk = (valores) => {
    const botones = valores.map((v) => { const a = {}; return { dataset: { valor: v }, setAttribute: (k, x) => { a[k] = x; }, a }; });
    return { botones, querySelectorAll: () => botones };
  };
  const g = mk(['true', 'false']);
  g.botones[0].a['aria-pressed'] = 'false'; g.botones[1].a['aria-pressed'] = 'true';
  C.marcarSi(g, true);
  ok(g.botones[0].a['aria-pressed'] === 'true' && g.botones[1].a['aria-pressed'] === 'false', 'marcarSi enciende el «Sí»');
  C.marcarSi(null, true);
  for (const [archivo, flag] of [['personal-perro', 'conCollar'], ['personal-perro', 'conBandana'], ['personal-caballo', 'conAlforjas'], ['personal-armas', 'conCintas'], ['personal-cuaderno', 'conElastico']]) {
    const t = leer(`src/${archivo}.js`);
    ok(new RegExp(`${flag}: true \\}\\); marcarSi\\(`).test(t), `${archivo}: el color de ${flag} actualiza el interruptor`);
  }
}

// ---------------------------------------------------------------- P9: null no es 0
{
  const cargar = (obj) => { almacen.clear(); almacen.set('hojarasca-ajustes-v1', JSON.stringify(obj)); return G.cargarAjustes(); };
  const fabrica = G.AJUSTES_BASE;
  for (const mal of [null, '', false, true, []]) {
    const a = cargar({ volumen: mal, sensibilidad: mal, fov: mal, volumenAmbiente: mal });
    ok(a.volumen === fabrica.volumen && a.sensibilidad === fabrica.sensibilidad && a.fov === fabrica.fov && a.volumenAmbiente === fabrica.volumenAmbiente, `un ajuste en ${JSON.stringify(mal)} vale el de fábrica`);
  }
  const b = cargar({ volumen: 0, sensibilidad: 2.5, fov: 90, volumenMusica: 0 });
  ok(b.volumen === 0 && b.volumenMusica === 0 && b.fov === 90 && b.sensibilidad === 2.5, 'un 0 de verdad se respeta, y los topes también');
  ok(cargar({ volumen: '0.5' }).volumen === 0.5 && cargar({ fov: 500 }).fov === 90, 'texto numérico y fuera de rango, como antes');
}

// ---------------------------------------------------------------- P11: la partida nueva no carga 8 KB de ceros
{
  const p = G.progresoNuevo();
  ok(Array.isArray(p.explorado) && p.explorado.length === 0, 'explorado vacío en la partida nueva');
  almacen.clear();
  ok(G.guardarProgreso(p), 'guarda');
  const viejo = JSON.parse(localStorage.getItem('hojarasca-progreso-v1') || localStorage.getItem([...almacen.keys()].find((k) => !k.includes('backup') && !k.includes('ajustes')) || ''));
  ok(Array.isArray(viejo.explorado), 'la clave sigue (compatibilidad)');
  const conCeros = { ...p, explorado: new Array(4096).fill(0) };
  ok(G.guardarProgreso(conCeros), 'una partida vieja con sus ceros se guarda');
  const claveP = [...almacen.keys()].find((k) => !k.includes('backup') && !k.includes('ajustes') && !k.includes('vista') && !k.includes('foto'));
  ok(JSON.parse(almacen.get(claveP)).explorado.length === 0, 'y los suelta al guardarse');
}

// ---------------------------------------------------------------- P10: si la partida nueva no cupo, la que había sigue
{
  almacen.clear();
  const vieja = G.progresoNuevo(); vieja.dia = 7;
  ok(G.guardarProgreso(vieja), 'la partida de antes');
  vieja.dia = 8; ok(G.guardarProgreso(vieja), 'y su copia');
  const antes = new Map(almacen);
  const nueva = G.progresoNuevo();
  cuotaLlena = true;
  ok(G.reemplazarProgreso(nueva) === false, 'sin lugar: devuelve false');
  cuotaLlena = false;
  ok([...antes].every(([k, v]) => almacen.get(k) === v) && almacen.size === antes.size, 'y el almacén quedó exactamente como estaba (principal, copia y demás)');
  ok(G.cargarProgreso()?.dia === 8, 'la partida de antes se carga');
  ok(G.reemplazarProgreso(nueva) === true, 'con lugar: reemplaza');
  ok(G.cargarProgreso()?.dia === nueva.dia, 'y la que se carga es la nueva');
  ok([...almacen.keys()].filter((k) => k.includes('backup')).every((k) => !JSON.parse(almacen.get(k) || '{}').dia || JSON.parse(almacen.get(k)).dia !== 8), 'la copia no guarda la partida vieja');
  const t = main.slice(main.indexOf("$('btn-nuevo').addEventListener('click'"), main.indexOf("$('btn-seguir')"));
  ok(t.includes('reemplazarProgreso(nueva)') && !t.includes('borrarProgreso()'), 'Empezar de nuevo usa reemplazarProgreso');
  ok(main.includes("reemplazarProgreso(nueva)) { reiniciandoPartida = false; nota('No pude empezar otra vuelta'") && main.includes("reemplazarProgreso(nueva)) { reiniciandoPartida = false; nota('No pude empezar otra corrida'"), 'y Otra vuelta y Otra corrida también');
}

// ---------------------------------------------------------------- P6, P8, P12: enganches (no se pueden correr en Node sin Electron)
{
  ok(/const CLAVES_CALIDAD_EN_VIVO = \[[^\]]*'pixelRatio'\]/.test(main) && /calidadActiva = cambio\.hasta;\s*aplicarDistancias\(\);\s*try \{ acomodarEscalaPantalla\(\); \}/.test(main), 'P6: al bajar la calidad en vivo baja también la resolución (relación de píxeles)');
  const html = leer('src/plantilla.html');
  ok(html.includes('else if (++erroresSinFiltro > 100) return;'), 'P8: pasados los 200 errores distintos, a lo sumo 100 más por sesión');
  ok(/size > 1024 \* 1024\) fs\.renameSync\(archivo, archivo \+ '\.1'\)/.test(leer('main.cjs')), 'P8: el registro de caídas rota al pasar 1 MB');
  ok(main.includes("sessionStorage.setItem(CLAVE_RECUPERADA, String(ranuraActual()))") && main.includes('if (recuperadaPendiente && !entroAlJuego)'), 'P12: el aviso «Partida recuperada» sobrevive a la recarga de la portada');
}

console.log(`verificar-4-10-3-ajustes: ${n} comprobaciones OK`);
