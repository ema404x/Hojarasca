// 2.0: el cuaderno como lámina.
//
// Las láminas de los naturalistas viajeros —las que se pegaban al final de los
// cuadernos de campo— juntaban en una sola hoja lo visto en un viaje: los bichos y las
// plantas dibujados a tinta y aguada, con su nombre y el científico debajo, y alguna
// anotación a mano. Esto arma la de tu partida: qué entra, en qué orden y con qué
// dibujo. Es puro; lo pinta `lamina-dibujo.js`.

// Qué dibujo le toca a cada anotación. No hay un dibujo por especie: hay un boceto por
// forma de vida, que es como dibuja uno en el campo cuando no tiene tiempo.
const AVES = new Set(['carpintero', 'chucao', 'cachana', 'condor', 'concon', 'cisne', 'patotorrente', 'martin', 'picaflor', 'bandurria', 'zorzal', 'cauquen']);
const INSECTOS = new Set(['manganga', 'panal', 'mariposa']);
const ARBOLES = new Set(['coihue', 'lenga', 'arrayan', 'nire', 'maiten']);
const CONIFERAS = new Set(['cipres', 'pehuen']);
const FLORES = new Set(['amancay', 'notro', 'chilco']);
const FRUTOS = new Set(['frutilla', 'calafate', 'maqui', 'pinon']);

export function tipoDeBoceto(e) {
  if (!e) return 'hoja';
  const id = e.id;
  if (e.seccion === 'peces') return 'pez';
  if (e.seccion === 'cielo') return id === 'luna-llena' ? 'luna' : id === 'geminidas' ? 'fugaces' : 'estrellas';
  if (e.seccion === 'lugares') return 'cerro';
  if (e.seccion === 'fauna') {
    if (AVES.has(id)) return 'ave';
    if (INSECTOS.has(id)) return 'insecto';
    if (id === 'lagartija') return 'lagartija';
    return 'mamifero';
  }
  if (ARBOLES.has(id)) return 'arbol';
  if (CONIFERAS.has(id)) return 'conifera';
  if (FLORES.has(id)) return 'flor';
  if (FRUTOS.has(id)) return 'fruto';
  if (id === 'llaollao') return 'hongo';
  if (id === 'pluma') return 'pluma';
  if (id === 'canto') return 'piedra';
  return 'hoja';
}

// Las secciones que se dibujan. Las recetas, los encargos y las historias viven en el
// cuaderno pero no son láminas: no se dibujan.
export const SECCIONES_LAMINA = ['fauna', 'flora', 'frutos', 'peces', 'cielo'];
export const CUPO_ESPECIMENES = 16;
export const CUPO_FOTOS = 6;

// Qué especímenes entran: los más recientes, pero repartidos entre las secciones para
// que una partida de puro pescar no dé una lámina de puras truchas.
export function elegirEspecimenes(progreso, ENTRADAS, cupo = CUPO_ESPECIMENES) {
  const hechas = (progreso?.entradas) || {};
  const cuando = (id) => { const x = hechas[id]; return x ? (x.dia || 0) * 24 + (x.hora || 0) : -1; };
  const porSeccion = new Map(SECCIONES_LAMINA.map((s) => [s, []]));
  for (const e of ENTRADAS) {
    if (!hechas[e.id] || !porSeccion.has(e.seccion)) continue;
    porSeccion.get(e.seccion).push(e);
  }
  for (const lista of porSeccion.values()) lista.sort((a, b) => cuando(b.id) - cuando(a.id));
  const elegidos = [];
  // una vuelta por sección, hasta llenar el cupo o quedarse sin nada
  for (let vuelta = 0; elegidos.length < cupo; vuelta++) {
    let puso = false;
    for (const s of SECCIONES_LAMINA) {
      const e = porSeccion.get(s)[vuelta];
      if (e && elegidos.length < cupo) { elegidos.push(e); puso = true; }
    }
    if (!puso) break;
  }
  // y en la lámina, ordenados como en el cuaderno
  const orden = new Map(ENTRADAS.map((e, i) => [e.id, i]));
  return elegidos.sort((a, b) => orden.get(a.id) - orden.get(b.id)).map((e) => ({
    id: e.id, nombre: e.nombre, cientifico: e.cientifico || '', seccion: e.seccion,
    dia: hechas[e.id].dia || 1, boceto: tipoDeBoceto(e),
  }));
}

// Las fotos del álbum que van pegadas: las más recientes que tengan imagen.
export function elegirFotos(progreso, DESAFIOS, cupo = CUPO_FOTOS) {
  const hechas = (progreso?.desafios) || {};
  return DESAFIOS.filter((d) => hechas[d.id]?.img)
    .sort((a, b) => ((hechas[b.id].dia || 0) * 24 + (hechas[b.id].hora || 0)) - ((hechas[a.id].dia || 0) * 24 + (hechas[a.id].hora || 0)))
    .slice(0, cupo)
    .map((d) => ({ id: d.id, nombre: d.nombre, img: hechas[d.id].img, dia: hechas[d.id].dia || 1 }));
}

// Todo lo que va en la hoja.
export function datosLamina(progreso, { ENTRADAS, DESAFIOS, estacion = 'verano', luna = '' }) {
  const total = ENTRADAS.length;
  const hechas = ENTRADAS.filter((e) => progreso?.entradas?.[e.id]).length;
  const paginas = progreso?.diario || [];
  const ultima = paginas.length ? paginas[paginas.length - 1] : null;
  return {
    titulo: 'Cuaderno de campo',
    subtitulo: `Valle de Hojarasca · día ${progreso?.dia || 1} · ${estacion}${luna ? ` · ${luna}` : ''}`,
    cuenta: `${hechas} de ${total} anotaciones`,
    especimenes: elegirEspecimenes(progreso, ENTRADAS),
    fotos: elegirFotos(progreso, DESAFIOS),
    pagina: ultima ? { dia: ultima.dia, texto: ultima.texto } : null,
  };
}

// Cortar un texto en renglones que entren en un ancho, con la medida que dé el lienzo.
// Si no entra en `maxRenglones`, el último termina en puntos suspensivos.
export function renglones(texto, ancho, medir, maxRenglones = 99) {
  const palabras = String(texto || '').split(/\s+/).filter(Boolean);
  const salida = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (medir(prueba) <= ancho || !actual) actual = prueba;
    else { salida.push(actual); actual = p; }
  }
  if (actual) salida.push(actual);
  if (salida.length > maxRenglones) {
    const cortado = salida.slice(0, maxRenglones);
    let ult = cortado[maxRenglones - 1];
    while (ult.length > 1 && medir(`${ult}…`) > ancho) ult = ult.slice(0, ult.lastIndexOf(' ') > 0 ? ult.lastIndexOf(' ') : ult.length - 1);
    cortado[maxRenglones - 1] = `${ult}…`;
    return cortado;
  }
  return salida;
}

export function nombreArchivoLamina(dia) {
  return `hojarasca-lamina-dia-${Math.max(1, Math.floor(dia || 1))}.png`;
}
