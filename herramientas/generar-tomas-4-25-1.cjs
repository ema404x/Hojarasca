// 4.25.1 (C): arma herramientas/auditoria-visual-4-25-1.json: cada personaje que lleva algo en la mano (el mate de Ramón, la planilla de Graciela, la caña, etc.)
// o que hace gestos en las escenas, con CADA pose de escena (escenas.js POSES_ESCENA), en un claro cerca del refugio. Se usa el mismo camino que las escenas de verdad
// (`__escenas.mundo.capturar` / `posar`, y `despuesDeGente` en el bucle), así lo que se ve es lo que se vería en la escena.
// Uso: node herramientas/generar-tomas-4-25-1.cjs [clave1,clave2] (por defecto ramon y guarda)
const fs = require('fs');
const path = require('path');
const POSES = ['ninguna', 'saludo', 'senalar', 'asentir', 'negar', 'encoger', 'pensar', 'cruzados', 'cintura', 'barba', 'gorro', 'atras', 'delantal', 'juntas', 'mirar', 'aplaudir', 'contar', 'brindar', 'tocar', 'palear', 'hachar', 'regar', 'martillar', 'serruchar', 'bailar', 'sentado'];
const claves = (process.argv[2] || 'ramon,guarda').split(',');
const T = [];
const donde = (clave, pose, dist, alto, giro) => `(()=>{ const T = H.T, E = H.__escenas, M = E.mundo;
    for (const k of E.capturados()) M.soltar(k);
    M.capturar('${clave}'); const g = (H.gente.gente || []).find((q) => q.clave === '${clave === 'ramon' || clave === 'guarda' ? clave : clave}');
    if (!g) return null;
    const L = T.lugares.refugio, ar = H.veg.arboles.filter((q) => !q.sacado && !q.caido); let s = null;
    for (let r = 30; r < 200 && !s; r += 3) for (let a = 0; a < 6.28 && !s; a += 0.2) { const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      if (T.agua(x, z) || 1 - T.normal(x, z).y > 0.02 || ar.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) continue; s = { x, z }; }
    if (!s) return null;
    const a = 0.7 + ${giro};
    for (const q of H.gente.gente) q.g.visible = q === g;
    M.teletransportar('${clave}', { x: s.x, z: s.z }, { x: s.x + Math.sin(a) * 10, z: s.z + Math.cos(a) * 10 });
    ${pose === 'ninguna' ? '' : `M.posar('${clave}', '${pose}', 600);`}
    return { x: s.x + Math.sin(a) * ${dist}, z: s.z + Math.cos(a) * ${dist}, y: T.altura(s.x, s.z) + ${alto}, yaw: a, horas: 12 } })()`;
for (const clave of claves) for (const pose of POSES) {
  T.push({ id: `q-${clave}-${pose}`, grupo: 'verano', medir: false, pitch: -0.2, fov: 36, donde: donde(clave, pose, 2.6, 1.85, 0) });
}
fs.writeFileSync(path.join(__dirname, 'auditoria-visual-4-25-1.json'), JSON.stringify(T, null, 2));
console.log(T.length + ' encuadres');
