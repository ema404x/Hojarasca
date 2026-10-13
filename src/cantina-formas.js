// 3.9.2 · LA CARTA MÁS RICA: lo que se ve en la mesa (y en la bandeja) de los platos y las bebidas nuevos de la cantina y de la casa de té: el fernet con su vaso largo, la tetera
// con su taza de sauce, el mate, la torta negra, los scones, el bara brith, el pan de jengibre, los welsh cakes, la milanesa, el choripán, el cordero, la tarta, el flan, el pan con queso y
// el servicio completo del té con su torre de tres platos. Se arman por código con las geometrías y los materiales compartidos de cantina-mundo.js (que los pasa en `h`):
// nada de luces ni de sombras, y cada forma son pocas mallas. Las `pieza-N` son lo que se va comiendo (nivel); `userData.liquido`, lo que baja al tomar; `userData.alzable`,
// la parte que sube a la boca al sorber (la taza, no la tetera).
import * as THREE from 'three';

export function crearFormasNuevas(h) {
  const { mesh, mat, cilindro, caja, bola, geo, GRIS } = h;
  const PLATO = '#ece4d2', AZUL = '#4a6a8a', LOZA = '#f2ece0';
  const plato = (g, r = 0.12, y = 0) => { g.add(mesh(cilindro(r * 0.85, r, 0.016, 14), mat(PLATO), 0, y + 0.008, 0)); g.add(mesh(cilindro(r * 0.62, r * 0.62, 0.004, 14), mat('#e2dac6'), 0, y + 0.017, 0)); };
  // una cuña de torta (un tercio de círculo): cilindro con ángulo; cada una con su inicio
  const cuna = (r, alto, ini, color, y = 0) => { const g = geo(`cuna|${r}|${alto}|${ini}`, () => new THREE.CylinderGeometry(r, r, alto, 9, 1, false, ini, 2.0)); return mesh(g, mat(color), 0, y, 0); };
  const nombrar = (o, i) => { o.name = `pieza-${i}`; return o; };

  // una taza con platito de sauce: la taza (alzable) lleva el líquido; el platito se queda
  const tazaDeSauce = (it, x, z, lleno = true) => {
    const taza = new THREE.Group();
    taza.position.set(x, 0.0, z);
    taza.add(mesh(cilindro(0.028, 0.038, 0.052), mat(LOZA), 0, 0.034, 0));
    taza.add(mesh(cilindro(0.039, 0.039, 0.008), mat(AZUL), 0, 0.058, 0));
    taza.add(mesh(caja(0.014, 0.036, 0.01), mat(LOZA), 0.046, 0.04, 0));
    const liq = mesh(cilindro(0.033, 0.033, 0.03), mat(it.color), 0, 0.044, 0);
    if (lleno) taza.add(liq);
    return { taza, liq };
  };
  const platito = (x, z) => { const q = new THREE.Group(); q.position.set(x, 0, z); q.add(mesh(cilindro(0.06, 0.075, 0.01), mat(LOZA), 0, 0.005, 0)); q.add(mesh(cilindro(0.052, 0.052, 0.003), mat(AZUL), 0, 0.011, 0)); return q; };

  const F = {
    'vaso-alto'(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.028, 0.034, 0.14), mat(GRIS, { opacidad: 0.78 }), 0, 0.07, 0));
      const liq = mesh(cilindro(0.026, 0.031, 0.11), mat(it.color), 0, 0.058, 0); g.add(liq);
      const hielo = mesh(caja(0.028, 0.028, 0.028), mat('#e8f0f0', { opacidad: 0.7 }), 0.004, 0.116, 0); hielo.rotation.set(0.4, 0.5, 0.2); g.add(hielo);
      g.userData.liquido = liq; g.userData.altoLiquido = 0.11; g.userData.boca = 0.14;
      return g;
    },
    // la tetera con su cubretetera tejida (roja con franja blanca), su plato y la taza con platito
    tetera(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.085, 0.1, 0.012, 14), mat(PLATO), -0.06, 0.006, 0));
      const cuerpo = mesh(bola(0.085), mat('#9b3a2e'), -0.06, 0.09, 0); cuerpo.scale.set(1, 0.88, 1); g.add(cuerpo);
      g.add(mesh(cilindro(0.089, 0.089, 0.022), mat(LOZA), -0.06, 0.09, 0));
      g.add(mesh(cilindro(0.03, 0.04, 0.02), mat('#9b3a2e'), -0.06, 0.168, 0));
      g.add(mesh(bola(0.02), mat(LOZA), -0.06, 0.188, 0));
      const pico = mesh(cilindro(0.012, 0.022, 0.1), mat('#7b2a22'), 0.026, 0.115, 0); pico.rotation.z = -0.95; g.add(pico);
      const asa = mesh(geo('asa-tetera', () => new THREE.TorusGeometry(0.045, 0.01, 5, 10, Math.PI * 1.1)), mat('#7b2a22'), -0.145, 0.095, 0); asa.rotation.z = Math.PI * 0.45; g.add(asa);
      g.add(platito(0.12, 0.1));
      const { taza, liq } = tazaDeSauce(it, 0.12, 0.1);
      taza.position.y = 0.011; g.add(taza);
      g.userData.liquido = liq; g.userData.altoLiquido = 0.03; g.userData.alzable = taza; g.userData.boca = 0.07; g.userData.plano = true; g.userData.vapor = [0.12, 0.08, 0.1];
      return g;
    },
    // la calabaza con su bombilla y unos bizcochitos de grasa
    mate(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.06, 0.07, 0.012, 12), mat(PLATO), 0.06, 0.006, 0.05));
      for (let i = 0; i < 4; i++) g.add(mesh(cilindro(0.022, 0.022, 0.014, 8), mat('#d8b070'), 0.04 + (i % 2) * 0.04, 0.019, 0.03 + Math.floor(i / 2) * 0.04));
      const m = new THREE.Group(); m.position.set(-0.07, 0, 0);
      const c = mesh(bola(0.05), mat('#6a4a22'), 0, 0.055, 0); c.scale.set(1, 1.08, 1); m.add(c);
      const yerba = mesh(cilindro(0.032, 0.032, 0.012), mat('#5a6a2a'), 0, 0.1, 0); m.add(yerba);
      const bomb = mesh(cilindro(0.005, 0.005, 0.16), mat('#b8b8b0'), 0.02, 0.17, 0.01); bomb.rotation.z = -0.22; m.add(bomb);
      g.add(m);
      g.userData.liquido = yerba; g.userData.altoLiquido = 0.012; g.userData.alzable = m; g.userData.boca = 0.1; g.userData.vapor = [-0.07, 0.11, 0];
      return g;
    },
    // la torta negra galesa: rebanadas oscuras con frutas secas
    'torta-negra'(it) {
      const g = new THREE.Group(); plato(g, 0.13);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Group(); r.position.set(-0.07 + i * 0.07, 0.017, -0.02 + (i % 2) * 0.03); r.rotation.y = 0.15 * (i - 1);
        r.add(mesh(caja(0.055, 0.04, 0.1), mat('#3a2214'), 0, 0.02, 0));
        for (let k = 0; k < 4; k++) r.add(mesh(bola(0.007), mat(k % 2 ? '#7a1e2a' : '#c8a04a'), -0.018 + (k % 2) * 0.034, 0.041, -0.03 + k * 0.02));
        g.add(nombrar(r, i));
      }
      return g;
    },
    'plato-scones'(it) {
      const g = new THREE.Group(); plato(g, 0.14);
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4, r = new THREE.Group(); r.position.set(Math.cos(a) * 0.06, 0.017, Math.sin(a) * 0.06);
        r.add(mesh(cilindro(0.04, 0.045, 0.034, 10), mat('#d8a050'), 0, 0.017, 0));
        r.add(mesh(cilindro(0.044, 0.044, 0.006, 10), mat('#c88a38'), 0, 0.037, 0));
        const crema = mesh(bola(0.017), mat('#f8f2e0'), 0, 0.048, 0); crema.scale.set(1, 0.7, 1); r.add(crema);
        r.add(mesh(bola(0.01), mat('#a8202a'), 0.01, 0.057, 0.004));
        g.add(nombrar(r, i));
      }
      return g;
    },
    // el bara brith: el pan moteado de pasas, en rebanadas, con su manteca
    'plato-bara'(it) {
      const g = new THREE.Group(); plato(g, 0.13);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Group(); r.position.set(-0.07 + i * 0.07, 0.017, (i % 2) * 0.02); r.rotation.y = 0.1 * i;
        r.add(mesh(caja(0.06, 0.03, 0.09), mat('#6a3a1e'), 0, 0.015, 0));
        for (let k = 0; k < 5; k++) r.add(mesh(bola(0.006), mat('#2a1408'), -0.02 + (k % 3) * 0.02, 0.031, -0.03 + k * 0.015));
        r.add(mesh(caja(0.03, 0.01, 0.03), mat('#f0d878'), 0.0, 0.035, 0.0));
        g.add(nombrar(r, i));
      }
      return g;
    },
    // los muñequitos de pan de jengibre, con su glasé
    'plato-jengibre'(it) {
      const g = new THREE.Group(); plato(g, 0.13);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Group(); r.position.set(-0.07 + i * 0.07, 0.019, (i % 2) * 0.03 - 0.01); r.rotation.y = 0.2 * (i - 1);
        r.add(mesh(caja(0.036, 0.012, 0.05), mat('#8a5a2a'), 0, 0.006, 0));
        r.add(mesh(caja(0.07, 0.012, 0.014), mat('#8a5a2a'), 0, 0.006, 0.006));
        r.add(mesh(bola(0.016), mat('#8a5a2a'), 0, 0.007, -0.034));
        for (let k = 0; k < 3; k++) r.add(mesh(bola(0.004), mat('#f6f0e2'), 0, 0.016, -0.01 + k * 0.012));
        g.add(nombrar(r, i));
      }
      return g;
    },
    // las tortitas de la plancha con azúcar
    'plato-welsh'(it) {
      const g = new THREE.Group(); plato(g, 0.13);
      for (let i = 0; i < 4; i++) {
        const q = mesh(cilindro(0.04, 0.04, 0.012, 10), mat('#c88a3a'), (i % 2 ? 0.045 : -0.045), 0.024 + (i > 1 ? 0.012 : 0), (i < 2 ? -0.03 : 0.035));
        g.add(nombrar(q, i));
        g.add(nombrar(mesh(cilindro(0.036, 0.036, 0.002, 10), mat('#f8f4e8'), q.position.x, q.position.y + 0.007, q.position.z), i));
      }
      return g;
    },
    // la tarta de fruta, en tres porciones (cada una, su cuña)
    'plato-tarta'(it) {
      const g = new THREE.Group(); plato(g, 0.15);
      for (let i = 0; i < 3; i++) {
        const c = cuna(0.1, 0.03, i * 2.09, '#d8a860', 0.032);
        const fruta = cuna(0.092, 0.012, i * 2.09, it.color || '#b84a3a', 0.05);
        const gr = new THREE.Group(); gr.add(c, fruta); gr.position.set(0.0, 0, 0); g.add(nombrar(gr, i));
        gr.position.x = Math.cos(i * 2.09 + 1.0) * 0.012; gr.position.z = Math.sin(i * 2.09 + 1.0) * 0.012;
      }
      return g;
    },
    'plato-flan'(it) {
      const g = new THREE.Group(); plato(g, 0.13);
      for (let i = 0; i < 3; i++) {
        const gr = new THREE.Group();
        gr.add(cuna(0.07, 0.05, i * 2.09, '#e8c070', 0.042));
        gr.add(cuna(0.071, 0.006, i * 2.09, '#6a3a14', 0.07));
        g.add(nombrar(gr, i));
      }
      const dulce = mesh(bola(0.026), mat('#a8642a'), 0.0, 0.082, 0.0); dulce.scale.set(1, 0.6, 1); g.add(dulce);
      return g;
    },
    'plato-pan'(it) {
      const g = new THREE.Group(); plato(g, 0.14);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Group(); r.position.set(-0.07 + i * 0.07, 0.017, (i % 2) * 0.025 - 0.01); r.rotation.y = 0.1 * i;
        r.add(mesh(caja(0.06, 0.02, 0.08), mat('#d8b070'), 0, 0.01, 0));
        r.add(mesh(caja(0.056, 0.008, 0.07), mat('#f0d878'), 0, 0.024, 0));
        r.add(mesh(bola(0.012), mat('#a8202a'), 0.01, 0.03, 0.0));
        g.add(nombrar(r, i));
      }
      return g;
    },
    'plato-milanesa'(it) {
      const g = new THREE.Group(); plato(g, 0.15);
      for (let i = 0; i < 4; i++) {
        const q = mesh(caja(0.05, 0.016, 0.12), mat(i % 2 ? '#c8964a' : '#b88438'), -0.075 + i * 0.05, 0.027, -0.01);
        g.add(nombrar(q, i));
      }
      for (let i = 0; i < 7; i++) g.add(mesh(caja(0.012, 0.012, 0.05), mat('#e8c850'), 0.08 + (i % 3) * 0.014, 0.024 + Math.floor(i / 3) * 0.012, -0.04 + (i % 3) * 0.03));
      const limon = mesh(bola(0.025), mat('#e8d84a'), 0.04, 0.03, 0.09); limon.scale.set(1.2, 0.7, 1); g.add(limon);
      return g;
    },
    'plato-choripan'(it) {
      const g = new THREE.Group(); plato(g, 0.14);
      for (let i = 0; i < 4; i++) {
        const gr = new THREE.Group(); gr.position.set(-0.075 + i * 0.05, 0.03, 0);
        const pan = mesh(cilindro(0.032, 0.032, 0.052), mat('#d8b070'), 0, 0, 0); pan.rotation.z = Math.PI / 2; gr.add(pan);
        const ch = mesh(cilindro(0.02, 0.02, 0.052), mat('#8a3a2a'), 0, 0.022, 0); ch.rotation.z = Math.PI / 2; gr.add(ch);
        gr.add(mesh(bola(0.008), mat('#4a8a3a'), 0, 0.04, 0.004));
        g.add(nombrar(gr, i));
      }
      return g;
    },
    // el costillar de cordero: huesos y carne dorada, con unas papas
    'plato-asado'(it) {
      const g = new THREE.Group(); plato(g, 0.17);
      for (let i = 0; i < 6; i++) {
        const gr = new THREE.Group(); gr.position.set(-0.1 + i * 0.04, 0.026, -0.01);
        gr.add(mesh(caja(0.034, 0.034, 0.1), mat(i % 2 ? '#a8582a' : '#b8683a'), 0, 0.016, 0.01));
        { const hueso = mesh(cilindro(0.007, 0.007, 0.06), mat('#f0e8d4'), 0, 0.016, -0.075); hueso.rotation.x = Math.PI / 2; gr.add(hueso); }
        g.add(nombrar(gr, i));
      }
      for (let i = 0; i < 3; i++) g.add(mesh(bola(0.028), mat(i % 2 ? '#d8b868' : '#c8a850'), 0.03 + i * 0.05, 0.034, 0.095));
      return g;
    },
    // el té completo: la tetera con su taza y, al lado, la torre de tres platos con lo dulce
    'servicio-te'(it) {
      const g = F.tetera(it);
      const t = new THREE.Group(); t.position.set(-0.3, 0, -0.04);
      t.add(mesh(cilindro(0.01, 0.01, 0.3), mat('#9a7a3a'), 0, 0.15, 0));
      t.add(mesh(cilindro(0.15, 0.15, 0.012), mat(PLATO), 0, 0.02, 0));
      t.add(mesh(cilindro(0.11, 0.11, 0.012), mat(PLATO), 0, 0.14, 0));
      t.add(mesh(cilindro(0.075, 0.075, 0.012), mat(PLATO), 0, 0.25, 0));
      let n = 0;
      for (let i = 0; i < 3; i++) { const a = i * 2.09, s = mesh(cilindro(0.032, 0.036, 0.028, 8), mat('#d8a050'), Math.cos(a) * 0.09, 0.04, Math.sin(a) * 0.09); t.add(nombrar(s, n++)); }
      for (let i = 0; i < 2; i++) { const a = i * 3.1 + 0.5, s = mesh(cilindro(0.035, 0.035, 0.012, 8), mat('#c88a3a'), Math.cos(a) * 0.065, 0.16, Math.sin(a) * 0.065); t.add(nombrar(s, n++)); }
      t.add(nombrar(mesh(caja(0.05, 0.03, 0.04), mat('#3a2214'), 0, 0.274, 0), n++));
      g.add(t);
      g.userData.cantidad = n;
      return g;
    },
  };
  return F;
}
