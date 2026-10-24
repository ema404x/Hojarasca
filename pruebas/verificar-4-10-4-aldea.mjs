// 4.10.4 — vida social y económica de la aldea (zona S2): EJECUTA la charla de Amadeo, las cifras del negocio, el alquiler, la cantina y la panadera con la aldea real.
//   S2-1 el mostrador del banco respeta el horario   S2-6 «Tiene N casas en alquiler» cuenta casas
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { A, G, crearMundo, E } from './ayuda-npc-mundo.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const U = (f) => import(new URL(`../${f}`, import.meta.url).href);

const nuevaAG = (W, extra = {}) => G.crearAldeaGente({ progreso: () => W.P, gente: () => W.gente, jugador: () => W.jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75, ...extra });

// ---------------------------------------------------------------- S2-1: el horario del banco
{
  // la regla pura
  ok(A.bancoAbierto(9, 0) && A.bancoAbierto(12.4, 2) && A.bancoAbierto(15, 4) && A.bancoAbierto(17.9, 5), 'abierto de lunes a sábado en horario');
  ok(!A.bancoAbierto(8.4, 0) && !A.bancoAbierto(13, 1) && !A.bancoAbierto(18, 2) && !A.bancoAbierto(19, 3), 'cerrado antes de las 8:30, al mediodía y desde las 18');
  ok(!A.bancoAbierto(10, 6) && !A.bancoAbierto(15, 6), 'cerrado el domingo');
  ok(A.bancoAbierto(15.9, 5, true) && !A.bancoAbierto(16, 5, true) && A.bancoAbierto(16, 5, false), 'el sábado de baile cierra a las 16');
  // la rutina de Amadeo y la regla coinciden en todo el reloj (la rutina no se toca)
  const W0 = crearMundo({ amigos: false });
  for (const ds of [0, 3, 4, 5, 6]) for (let h = 0; h < 24; h += 0.25) {
    const r = A.rutinaAldea('gerente', h, ds, W0.P.aldea, 30 + ds), adentro = r.lugar === 'trabajo' && r.edificio === 'banco-pueblo';
    const baile = ds === 5 && A.localAbierto(W0.P.aldea, 'salon');
    eq(adentro, A.bancoAbierto(h, ds, baile), `la rutina de Amadeo y el horario coinciden (día ${ds}, ${h} h)`);
  }
  // la charla real
  const W = crearMundo({ amigos: false });
  const AG = nuevaAG(W, { abrirBanco() {} });
  const npc = { claveAldea: 'gerente' };
  const hablar = (dia, hora, n = 3) => { W.P.dia = dia; W.P.horas = hora; let r; for (let i = 0; i < n; i++) r = AG.charla(npc); return r; };
  const abre = [];
  for (let i = 0; i < 3; i++) { W.P.dia = 2; W.P.horas = 10; const r = AG.charla(npc); abre.push(r.id); }
  ok(abre.includes('aldea-gerente'), `en horario sigue abriendo el mostrador (${abre.join(',')})`);
  for (const [dia, hora, que] of [[2, 18.5, 'a las 18:30 de un martes'], [7, 11, 'un domingo'], [7, 16, 'un domingo a la tarde'], [3, 7, 'antes de abrir'], [3, 13, 'al mediodía'], [3, 21, 'de noche']]) {
    for (let i = 0; i < 6; i++) {
      W.P.dia = dia; W.P.horas = hora;
      const r = AG.charla(npc);
      ok(r && r.id !== 'aldea-gerente' && !r.alTerminar, `${que}: no abre el mostrador (${r?.id})`);
      ok(r.partes.length === 1 && r.partes[0].length > 20, `${que}: Amadeo contesta con una línea de voz`);
    }
  }
  // sábado con el salón abierto: después de las 16 no; antes sí
  const salon = A.localAbierto(W.P.aldea, 'salon');
  W.P.dia = 6; W.P.horas = 17;
  const rs = AG.charla(npc);
  ok(!salon || rs.id !== 'aldea-gerente', 'el sábado de baile a las 17 el mostrador no abre');
}
// ---------------------------------------------------------------- S2-6: cuántas casas en alquiler
{
  const BV = await U('src/banco-voces.js');
  const PRO = await U('src/propiedad.js');
  const NB = await U('src/negocios.js');
  const W = crearMundo({ amigos: false, dia: 10, hora: 10 });
  const P = W.P; P.negocios = NB.negociosNuevo();
  P.obras = [1, 2, 3].map(() => ({ plano: 'cabana-piedra', etapas: 4 }));
  for (let i = 0; i < 3; i++) PRO.ponerEnAlquiler(P, 'cabana-piedra', 10);
  eq(PRO.enAlquilerDe(P, 'cabana-piedra'), 3, 'hay tres casas en alquiler');
  const vistos = new Set();
  for (let dia = 1; dia < 200; dia++) for (let n = 0; n < 4; n++) for (const l of BV.saludoDelGerente(P, { dia, hora: 10, n, temporada: 'verano', amistad: 'conocido' })) if (/casa/.test(l) && /alquiler/.test(l) && /Tiene/.test(l)) vistos.add(l);
  ok(vistos.size > 0, 'el saludo menciona las casas en alquiler');
  for (const l of vistos) ok(/Tiene 3 casas/.test(l) && !/Tiene 1 casa/.test(l), `dice tres casas: ${l.slice(0, 40)}`);
}
console.log(`verificar-4-10-4-aldea: ${pasos} pasos ok`);
