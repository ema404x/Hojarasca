// 4.25.0 (C): arma herramientas/auditoria-visual-4-25-0.json: los encuadres de los personajes (Ramón, Elsa la guarda, Rosa la panadera, los chicos, el perro y la gente
// abrigada) de cerca (la cara), a medio cuerpo y a 12 m, en verano y en invierno, más la plaza de día y al ocaso (lo que se mide).
// Ramón y Elsa (que a mediodía no está en el mapa) se capturan en un «estudio»: la herramienta congela a la gente, trae a la persona a un claro cerca del refugio (sin árboles
// a 12 m, pendiente suave) y pone la cámara delante de ella. La gente de la aldea se captura donde está a mediodía (la primera toma de cada grupo es la plaza, para que la
// aldea cargue a su gente), también congelada, así antes y después salen con la misma pose y la misma luz.
const fs = require('fs');
const path = require('path');
const T = [];
const poner = (id, grupo, t) => T.push({ id, grupo, medir: false, ...t });
const congelar = 'if (!H.gente.__orig) { H.gente.__orig = H.gente.actualizar; H.gente.actualizar = () => 0; }';
const estudio = (clave, dist, alto, horas, fov, pitch = 0, giro = 0) => ({
  pitch, fov,
  donde: `(()=>{ const T = H.T, g = (H.gente.gente || []).find((q) => q.clave === '${clave}'); if (!g) return null;
    ${congelar}
    const L = T.lugares.refugio, ar = H.veg.arboles.filter((q) => !q.sacado && !q.caido); let s = null;
    for (let r = 30; r < 200 && !s; r += 3) for (let a = 0; a < 6.28 && !s; a += 0.2) { const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      if (T.agua(x, z) || 1 - T.normal(x, z).y > 0.02 || ar.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) continue; s = { x, z }; }
    if (!s) return null;
    const a = 0.7 + ${giro}; for (const q of H.gente.gente) q.g.visible = q === g; g.g.position.set(s.x, T.altura(s.x, s.z), s.z); g.g.rotation.y = a; g.rumbo = a; g.rumboObjetivo = a;
    return { x: s.x + Math.sin(a) * ${dist}, z: s.z + Math.cos(a) * ${dist}, y: T.altura(s.x, s.z) + ${alto}, yaw: a, horas: ${horas} } })()`,
});
const enSuLugar = (clave, dist, alto, horas, fov, pitch = 0) => ({
  pitch, fov, aldea: true,
  donde: `(()=>{ const g = (H.gente.gente || []).find((q) => q.clave === '${clave}'); if (!g || (g.pos.x === 0 && g.pos.z === 0)) return null;
    ${congelar}
    const c = window.__AUD.camaraGente(g, ${dist}, ${horas}); c.y = c.altoPersona + ${alto}; return c })()`,
});
const PLAZA_12 = "(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: 12 } })()";
const nombre = (clave) => clave.replace('poblador-', '').replace('aldea-', '');
const ESTUDIO = [['ramon', 1.6], ['guarda', 1.6]];
// (los chicos, con la cámara más alta y mirando un poco hacia abajo: el pasto del claro les llega a la cintura)
const ALDEA = [['poblador-panadera', 1.55, 0], ['aldea-nene', 0.98, 0.5], ['aldea-nena', 0.93, 0.5], ['aldea-abuela', 1.5, 0], ['aldea-jefe', 1.65, 0]];
for (const [est, sufijo] of [['verano', ''], ['invierno', '-invierno']]) {
  // (la gente de la aldea se arma de a poco: la plaza se mira tres veces antes de buscar a nadie)
  const previa = { aldea: true, pitch: 0.03, fov: 62, donde: PLAZA_12 };
  for (const n of ['b', 'c']) poner(`p-z-previa${n}${sufijo}`, est, previa);
  poner(`p-z-previa${sufijo}`, est, { aldea: true, pitch: 0.03, fov: 62, donde: "(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: 12 } })()" });
  for (const [clave, ojos, mas] of ALDEA) {
    const n = nombre(clave), p = mas ? -0.22 : 0;
    poner(`p-z-${n}${sufijo}-cara`, est, { ...estudio(clave, 0.75, ojos + 0.02 + mas * 0.5, 12, 26, p * 0.5), aldea: true });
    poner(`p-z-${n}${sufijo}-cuerpo`, est, { ...estudio(clave, 2.6, ojos - 0.1 + mas, 12, 42, p), aldea: true });
    poner(`p-z-${n}${sufijo}-lejos`, est, { ...estudio(clave, 12, ojos + mas * 2, 12, 55, mas ? -0.12 : 0), aldea: true });
  }
  for (const [clave, ojos] of ESTUDIO) {
    const n = nombre(clave);
    poner(`p-${n}${sufijo}-cara`, est, estudio(clave, 0.75, ojos + 0.02, 12, 26));
    poner(`p-${n}${sufijo}-cuerpo`, est, estudio(clave, 2.8, ojos - 0.3, 12, 42));
    poner(`p-${n}${sufijo}-lejos`, est, estudio(clave, 12, ojos, 12, 55));
    if (!sufijo) poner(`p-${n}-perfil`, est, estudio(clave, 1.4, ojos, 12, 32, 0, 1.2));
  }
}
// el perro del jugador, a 2,6 m, a la altura de la cintura
poner('p-perro', 'verano', { pitch: -0.15, fov: 42, donde: '(()=>{ const P = H.perro; if (!P || !P.est) return null; const p = P.est.pos; const yaw = 0.8; const x = p.x + Math.sin(yaw) * 2.6, z = p.z + Math.cos(yaw) * 2.6; return { x, z, y: H.T.altura(x, z) + 1.4, yaw, horas: 12 } })()' });
// la plaza (lo que se mide): de día y al ocaso, con la gente, y la gente de la plaza de cerca
const plaza = (horas) => ({ aldea: true, pitch: 0.03, fov: 62, medir: true, donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: ${horas} } })()` });
poner('05-plaza-dia', 'verano', plaza(12));
poner('06-plaza-ocaso', 'verano', plaza(18.6));
poner('13-gente-aldea-plaza', 'verano', { aldea: true, pitch: -0.03, fov: 50, medir: true, donde: "(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const l = (H.gente.gente || []).filter((q) => q.pos && (q.pos.x !== 0 || q.pos.z !== 0) && Math.hypot(q.pos.x - s.x, q.pos.z - s.z) < 45).sort((a, b) => Math.hypot(a.pos.x - s.x, a.pos.z - s.z) - Math.hypot(b.pos.x - s.x, b.pos.z - s.z)); const g = l[0]; if (!g) return null; return window.__AUD.camaraGente(g, 4, 12) })()" });
fs.writeFileSync(path.join(__dirname, 'auditoria-visual-4-25-0.json'), JSON.stringify(T, null, 2));
console.log(T.length + ' encuadres');
