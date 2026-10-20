// 4.4.1 · GASTOS FIJOS E IMPUESTOS DEL LOCAL PROPIO: reglas (módulo puro, se prueba en Node; no importa negocio-propio.js, así éste puede usarlo sin ciclos).
// El negocio que le comprás a un vecino ya paga «alquiler, impuestos y luz» todos los días (negocios-vecinos.js); el local que armás vos, no. Ahora sí:
//
//   · cada tipo de local paga por día un monto fijo (alquiler del terreno, impuesto municipal y luz): se descuenta ADELANTADO al empezar el día, de la caja del
//     local primero y, si no alcanza, de tu billetera (motivo en el libro: «Gastos del local»); se paga aunque el local esté cerrado (el cartel no apaga la luz);
//   · se empieza a pagar el día que el local abre por primera vez (el día que abrís es de gracia: se cobra desde el siguiente) y se deja de pagar al desarmarlo;
//   · si no hay con qué pagar, el día queda como DEUDA (con un tope de 5 días: el municipio no embarga). Con dos días de deuda el local cierra solo (el cartel
//     queda en «cerrado», no entran clientes, los empleados no venden) hasta que pagues; no se pierde nada: ni la mercadería, ni la fama, ni la caja;
//   · si pasan varios días de golpe (cargaste una partida, dormiste) se cobran los que pasaron, hasta 7: no se acumula más que eso;
//   · el panel lleva el balance del día y de la semana: ventas, sueldos, gastos y lo del proveedor.
// Una partida de antes no trae `fin`: sale con los valores por defecto (sin deuda; si el local estaba abierto, empieza a pagar desde el día siguiente).
import { hayEconomia, pagar, pesosDe, formatoPesos } from './economia.js';

const entero = (v, max = 1e9) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------- las reglas (todo en una tabla, para afinar el equilibrio en un solo lugar)
// Lo que paga por día cada tipo de local, por concepto (la suma es el gasto fijo del día)
export const GASTOS_DIA = {
  almacen: { alquiler: 110, impuesto: 80, luz: 60 },
  panaderia: { alquiler: 70, impuesto: 60, luz: 70 },
};
export const TEXTO_GASTOS = 'alquiler, impuesto y luz';
export const gastoPorDia = (tipo) => (Object.hasOwn(GASTOS_DIA, tipo) ? Object.values(GASTOS_DIA[tipo]).reduce((s, v) => s + v, 0) : 0);
export const DEUDA = { diasCierre: 2, diasTope: 5 };            // días de deuda para que cierre solo / lo más que se acumula
export const DIAS_ACUM_MAX = 7;                                  // lo más que se cobra de golpe si no pasaste por el local
export const BALANCE_DIAS = 8;                                   // cuántos días de balance se guardan
export const SEMANA = 7;
export const CAMPOS_BALANCE = ['ventas', 'sueldos', 'gastos', 'proveedor'];
export const topeDeuda = (tipo) => gastoPorDia(tipo) * DEUDA.diasTope;
export const deudaQueCierra = (tipo) => gastoPorDia(tipo) * DEUDA.diasCierre;

// ---------------------------------------------------------------- el estado guardado (`negocioPropio.fin`)
export function finNuevo() {
  return { v: 1, activa: false, ultimo: 0, deuda: 0, reponer: true, dias: [], prov: { dia: 0, gastado: 0 }, total: { gastos: 0, proveedor: 0, reposicion: 0, dias: 0 } };
}
// `v`: lo guardado (puede faltar: partida de antes); `d`: { hoy, tipo, abierto } del negocio al que pertenece
export function sanearFin(v, d = {}) {
  const hoy = Math.max(1, entero(d.hoy, 1e6) || 1);
  const abierto = d.abierto === true;
  if (!objeto(v)) {   // partida de antes de la 4.4.1: sin deuda, la reposición automática apagada; si estaba abierto empieza a pagar desde mañana
    const n = finNuevo();
    n.reponer = false;
    if (abierto) { n.activa = true; n.ultimo = hoy; }
    return n;
  }
  const tipo = d.tipo || null;
  const dias = [];
  for (const x of Array.isArray(v.dias) ? v.dias : []) {
    if (!objeto(x)) continue;
    const dia = entero(x.dia, 1e6);
    if (dia < 1 || dia > hoy || dias.some((y) => y.dia === dia)) continue;
    dias.push({ dia, ventas: entero(x.ventas, 1e8), sueldos: entero(x.sueldos, 1e8), gastos: entero(x.gastos, 1e8), proveedor: entero(x.proveedor, 1e8) });
  }
  dias.sort((a, b) => a.dia - b.dia);
  while (dias.length > BALANCE_DIAS) dias.shift();
  const p = objeto(v.prov) ? v.prov : {}, t = objeto(v.total) ? v.total : {};
  const activa = v.activa === true && tipo !== null;
  return {
    v: 1, activa, ultimo: activa ? Math.min(hoy, entero(v.ultimo, 1e6)) : 0,
    deuda: tipo ? Math.min(topeDeuda(tipo), entero(v.deuda, 1e7)) : 0, reponer: v.reponer === true,
    dias, prov: { dia: Math.min(hoy, entero(p.dia, 1e6)), gastado: entero(p.gastado, 1e7) },
    total: { gastos: entero(t.gastos, 1e10), proveedor: entero(t.proveedor, 1e10), reposicion: entero(t.reposicion, 1e8), dias: entero(t.dias, 1e6) },
  };
}

// ---------------------------------------------------------------- el balance (ventas, sueldos, gastos, proveedor por día)
function entrada(est, dia, crear = true) {
  const fin = est.fin;
  let e = fin.dias.find((x) => x.dia === dia);
  if (!e && crear) {
    e = { dia, ventas: 0, sueldos: 0, gastos: 0, proveedor: 0 };
    fin.dias.push(e); fin.dias.sort((a, b) => a.dia - b.dia);
    while (fin.dias.length > BALANCE_DIAS) fin.dias.shift();
  }
  return e || null;
}
export function anotarFin(est, dia, campo, monto) {
  if (!est?.fin || !CAMPOS_BALANCE.includes(campo)) return;
  const m = Math.floor(Number(monto) || 0);
  if (m <= 0) return;
  const e = entrada(est, Math.max(1, Math.floor(Number(dia) || 1)));
  if (e) e[campo] += m;
}
// Al cerrarse un día (ponerAlDia de negocio-propio.js): lo vendido ese día queda en el balance
export function cerrarDiaFin(est, dia, ventas) {
  if (!est?.fin) return;
  const v = Math.floor(Number(ventas) || 0);
  if (v <= 0) return;
  const e = entrada(est, dia);
  if (e) e.ventas = v;
}
// El balance de los últimos `n` días contando hoy (el día de hoy toma lo vendido hasta ahora de `est.hoy`)
export function balanceDe(est, dia, n = 1) {
  const b = { ventas: 0, sueldos: 0, gastos: 0, proveedor: 0, neto: 0 };
  if (!est?.fin) return b;
  for (const e of est.fin.dias) {
    if (e.dia > dia || e.dia <= dia - n) continue;
    for (const c of CAMPOS_BALANCE) b[c] += e[c];
  }
  if (est.hoy && est.hoy.dia === dia && !est.fin.dias.some((e) => e.dia === dia && e.ventas > 0)) b.ventas += entero(est.hoy.ventas, 1e8);
  b.neto = b.ventas - b.sueldos - b.gastos - b.proveedor;
  return b;
}
const signo = (n) => (n > 0 ? `+${formatoPesos(n)}` : formatoPesos(n));
export function textoBalance(b) {
  return `ventas ${formatoPesos(b.ventas)} · sueldos ${formatoPesos(b.sueldos)} · gastos ${formatoPesos(b.gastos)}${b.proveedor > 0 ? ` · proveedor ${formatoPesos(b.proveedor)}` : ''} = ${signo(b.neto)}`;
}

// ---------------------------------------------------------------- la deuda
export const hayDeuda = (est) => !!est?.fin && est.fin.deuda > 0;
// El local cierra solo con dos días de deuda (o más) hasta que la pagues
export const cerradoPorDeuda = (est) => !!est?.tipo && !!est.fin && est.fin.deuda > 0 && est.fin.deuda >= deudaQueCierra(est.tipo);
export const abiertoDeVerdad = (est) => est?.abierto === true && !cerradoPorDeuda(est);

// Paga toda la deuda: de la caja del local y, si no alcanza, de tu billetera. Todo o nada. Vuelve { ok, monto, deCaja, deBilletera, debe, falta }.
export function pagarDeuda(p, est) {
  const fin = est.fin, debe = entero(fin.deuda, 1e8);
  if (debe <= 0) return { ok: true, monto: 0, deCaja: 0, deBilletera: 0, debe: 0, falta: 0 };
  const hay = entero(est.caja, 1e8) + pesosDe(p);
  if (hay < debe) return { ok: false, monto: 0, deCaja: 0, deBilletera: 0, debe, falta: debe - hay };
  const deCaja = Math.min(entero(est.caja, 1e8), debe), resto = debe - deCaja;
  if (resto > 0) {
    const r = pagar(p, resto, 'Gastos del local: alquiler, impuesto y luz', 'tu local');
    if (!r.ok) return { ok: false, monto: 0, deCaja: 0, deBilletera: 0, debe, falta: r.faltan || resto };
  }
  est.caja -= deCaja;
  fin.deuda = 0;
  fin.total.gastos += debe;
  return { ok: true, monto: debe, deCaja, deBilletera: resto, debe, falta: 0 };
}

// El cobro del día. `dia`: el día de la partida. Vuelve null si no toca cobrar (no está activa, o ya se cobró hoy) o
// { dias, gasto, deuda, pago, cerroAhora, abrioAhora }: lo que se devengó, la deuda que queda, el pago (de pagarDeuda) y si el local acaba de cerrar por la deuda.
export function cobrarGastos(p, est, dia) {
  if (!est?.fin || !est.tipo || !hayEconomia(p)) return null;
  const fin = est.fin, d = Math.max(1, Math.floor(Number(dia) || 1));
  if (!fin.activa) {   // el día que abre por primera vez empieza la cuenta (ese día es de gracia)
    if (est.abierto === true) { fin.activa = true; fin.ultimo = d; }
    return null;
  }
  if (d <= fin.ultimo) { if (d < fin.ultimo) fin.ultimo = d; return null; }   // (un reloj que volvió para atrás —una partida cargada— no cobra dos veces)
  const dias = Math.min(DIAS_ACUM_MAX, d - fin.ultimo);
  fin.ultimo = d;
  const porDia = gastoPorDia(est.tipo), gasto = porDia * dias;
  if (gasto <= 0) return null;
  const cerradoAntes = cerradoPorDeuda(est);
  for (let i = 0; i < dias; i++) anotarFin(est, d - dias + 1 + i, 'gastos', porDia);
  fin.total.dias += dias;
  fin.deuda = Math.min(topeDeuda(est.tipo), fin.deuda + gasto);
  const pago = pagarDeuda(p, est);
  return { dias, gasto, deuda: fin.deuda, pago, cerroAhora: !cerradoAntes && cerradoPorDeuda(est), abrioAhora: cerradoAntes && !cerradoPorDeuda(est) };
}
// Pagar la deuda a mano (el botón del panel)
export function pagarDeudaAMano(p, est) {
  const antes = cerradoPorDeuda(est);
  const r = pagarDeuda(p, est);
  return { ...r, abrioAhora: antes && r.ok && !cerradoPorDeuda(est) };
}
// Al desarmar el local: se paga lo que se pueda de la deuda (de la caja y la billetera) y lo que quede se perdona; la cuenta se detiene
export function cerrarCuenta(p, est) {
  if (!est?.fin) return { deuda: 0, pagada: false };
  const debe = est.fin.deuda;
  const r = debe > 0 ? pagarDeuda(p, est) : { ok: true };
  est.fin.deuda = 0; est.fin.activa = false; est.fin.ultimo = 0;
  return { deuda: debe, pagada: debe > 0 && r.ok };
}

// ---------------------------------------------------------------- lo que dice el panel (puro: se prueba)
export function lineasFinanzas(est, tipo, dia) {
  const g = gastoPorDia(tipo), fin = est.fin;
  const out = [];
  out.push({ t: 'Gastos por día', v: `${formatoPesos(g)} (${TEXTO_GASTOS})${fin.activa ? '' : ' · se cobran desde el día siguiente a abrir el local'}` });
  out.push({ t: 'Balance de hoy', v: textoBalance(balanceDe(est, dia, 1)) });
  out.push({ t: 'Balance de la semana', v: textoBalance(balanceDe(est, dia, SEMANA)) });
  if (fin.deuda > 0) {
    out.push({ t: 'Deuda de gastos', v: `${formatoPesos(fin.deuda)}${cerradoPorDeuda(est) ? ' · el local cerró solo: pagá para volver a abrir' : ' · se cobra apenas haya plata (con dos días sin pagar, el local cierra)'}`, alerta: true });
  }
  return out;
}
