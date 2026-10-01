// El diario: cada vez que dormís, el juego escribe la página del día
// con lo que pasó, en el mismo tono del cuaderno.

import { acerto } from './pronostico.js';

const ESTACIONES = { verano: 'verano', otono: 'otoño', invierno: 'invierno', primavera: 'primavera' };

function unir(lista, y = 'y') {
  if (lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  return `${lista.slice(0, -1).join(', ')} ${y} ${lista[lista.length - 1]}`;
}

const elegir = (r, opciones) => opciones[Math.floor(r() * opciones.length) % opciones.length];

export function crearDiario() {
  let hoy = nuevo();

  function nuevo() {
    return {
      lugares: [], especies: [], peces: [], fotos: 0, historias: [], encargos: [],
      cocinado: [], cambiado: [], tren: 0, vuelta: 0, kayak: false, durmioAfuera: false,
      lluvia: 0, nieve: 0, viento: 0, tormenta: false, pasos: 0, marcas: 0,
    };
  }

  // lo que va pasando durante el día
  function anotar(tipo, dato) {
    if (!hoy) return;
    switch (tipo) {
      case 'lugar': if (!hoy.lugares.includes(dato)) hoy.lugares.push(dato); break;
      case 'especie': if (!hoy.especies.includes(dato)) hoy.especies.push(dato); break;
      case 'pez': hoy.peces.push(dato); break;
      case 'foto': hoy.fotos++; break;
      case 'historia': hoy.historias.push(dato); break;
      case 'encargo': hoy.encargos.push(dato); break;
      case 'cocina': hoy.cocinado.push(dato); break;
      case 'trueque': hoy.cambiado.push(dato); break;
      case 'tren': hoy.tren++; break;
      case 'vuelta': hoy.vuelta++; break;
      case 'kayak': hoy.kayak = true; break;
      case 'carpa': hoy.durmioAfuera = true; break;
      case 'marca': hoy.marcas++; break;
      case 'renoval': hoy.renovales = [...(hoy.renovales || []), dato]; break;
      case 'fugaz': hoy.fugaces = (hoy.fugaces || 0) + 1; break;
      case 'conserva': hoy.conservas = (hoy.conservas || 0) + 1; break;
      case 'pronostico': if (!hoy.pronostico) hoy.pronostico = dato; break;
      case 'grabacion': hoy.grabaciones = [...(hoy.grabaciones || []), dato]; break;
      case 'rastro': hoy.rastros = [...(hoy.rastros || []), dato]; break;
      case 'obra': hoy.obra = dato; break;
      case 'caballo': hoy.caballo = true; break;
      case 'crecida': hoy.crecida = true; break;
      case 'rayo': hoy.rayo = dato; break;
      case 'carta': hoy.cartas = [...(hoy.cartas || []), dato]; break;
      case 'envio': hoy.envio = [...(hoy.envio || []), dato]; break;
      case 'visita': hoy.visita = [...(hoy.visita || []), dato]; break;
      // 2.3: las dos ramas usaban 'rastro' (las huellas de la 2.1 y el perro de la 1.11) y
      // 'cosecha' (la huerta de la 2.0 y el cantero de la 1.10, más huevos y lana): el
      // segundo caso de cada uno nunca corría. Ahora cada cosa tiene el suyo.
      case 'rastroPerro': hoy.rastro = [...(hoy.rastro || []), dato]; break;
      case 'huevos': hoy.huevos = true; break;
      // 2.3
      case 'miel': hoy.miel = (hoy.miel || 0) + (Number(dato) || 1); break;
      case 'ahumado': hoy.ahumado = (hoy.ahumado || 0) + (Number(dato) || 1); break;
      case 'noche': hoy.noche = dato; break;
      case 'lomo': hoy.lomo = true; break;
      case 'esquila': hoy.esquila = (hoy.esquila || 0) + 1; break;
      // 2.4: las estructuras
      case 'descanso': hoy.descanso = true; break;
      case 'horno': hoy.horno = [...(hoy.horno || []), dato]; break;
      case 'buzon': hoy.buzon = true; break;
      case 'corral': hoy.corral = true; break;
      case 'helada': hoy.helada = dato; break;
      case 'tinte': hoy.tinte = dato; break;
      case 'feria': hoy.feria = [...(hoy.feria || []), dato]; break;
      case 'tejido': hoy.tejido = [...(hoy.tejido || []), dato]; break;
      case 'siembra': hoy.sembrado = [...(hoy.sembrado || []), dato]; break;
      case 'cosecha': hoy.cosechado = [...(hoy.cosechado || []), dato]; break;
      // 3.1: los eventos del valle y los capítulos de la historia, con su propia línea
      case 'evento': if (dato) hoy.eventos = [...(hoy.eventos || []), String(dato)]; break;
      case 'capitulo': if (dato) hoy.capitulos = [...(hoy.capitulos || []), String(dato)]; break;
      default: break;
    }
  }

  // 2.0: cuánta escarcha hubo esta mañana (se guarda la mayor)
  function escarcha(valor) {
    if (hoy) hoy.escarcha = Math.max(hoy.escarcha || 0, valor || 0);
  }

  // el clima se mide a lo largo del día, no en el momento de acostarse
  function clima(dt, estado, invierno) {
    if (!hoy) return;
    hoy.lluvia = Math.max(hoy.lluvia, estado.lluvia);
    hoy.viento = Math.max(hoy.viento, estado.viento);
    if (invierno > 0.5) hoy.nieve = Math.max(hoy.nieve, estado.lluvia);
    if (estado.tormenta) hoy.tormenta = true;
    hoy.pasos += dt;
  }

  // arma la página y empieza la del día siguiente
  function cerrar(dia, estacion, r) {
    const d = hoy;
    hoy = nuevo();
    const lineas = [];

    // el tiempo, primero, como en cualquier diario de campo
    if (d.tormenta) lineas.push(elegir(r, [
      'Tormenta. Los truenos bajaban por el valle y se escuchaban dos veces, una por el aire y otra por la piedra.',
      'Se armó tormenta a la tarde. Vi los relámpagos antes de escuchar nada, y conté los segundos como me enseñaron.',
    ]));
    else if (d.nieve > 0.4) lineas.push(elegir(r, [
      'Nevó parejo casi todo el día. El bosque queda en silencio con la nieve, ni los pájaros.',
      'Nieve fina desde la mañana. Las lengas aguantan cargadas hasta que el viento las sacude.',
    ]));
    else if (d.lluvia > 0.5) lineas.push(elegir(r, [
      'Llovió fuerte. Me refugié un rato y seguí igual, empapado.',
      'Lluvia de todo el día, de esa que no afloja. El bosque huele distinto cuando llueve así.',
    ]));
    else if (d.lluvia > 0.15) lineas.push(elegir(r, [
      'Estuvo garuando a ratos.',
      'Nublado y con alguna llovizna suelta.',
    ]));
    else if (d.viento > 0.6) lineas.push(elegir(r, [
      'Viento del oeste todo el día, del que no para nunca.',
      'Sopló fuerte desde la cordillera. Se escucha venir antes de sentirlo.',
    ]));
    else lineas.push(elegir(r, [
      `Día despejado de ${ESTACIONES[estacion] || estacion}.`,
      'Buen día, sin una nube.',
      'Cielo limpio. Se veía la cordillera entera.',
    ]));
    // 2.1: el que anunció el tiempo, y si acertó
    if (d.pronostico?.quien) {
      const p = d.pronostico, ok = acerto(p, d.lluvia);
      if (p.proximo === 'lluvia') lineas.push(ok ? `${p.quien} dijo que llovía, y llovió.` : `${p.quien} anunció lluvia y no cayó una gota.`);
      else if (p.proximo === 'despejado') lineas.push(ok ? `${p.quien} dijo que paraba, y paró.` : `${p.quien} dijo que paraba. Siguió lloviendo.`);
    }
    // 2.0: la escarcha es de la mañana, así que va aparte del tiempo del día
    if ((d.escarcha || 0) > 0.4) lineas.push(elegir(r, [
      'Amaneció con escarcha. El pasto crujía al pisarlo.',
      'Helada a la mañana: todo blanco hasta que pegó el sol.',
    ]));

    if (d.lugares.length) {
      lineas.push(d.lugares.length === 1
        ? `Llegué a ${d.lugares[0]}.`
        : `Anduve por ${unir(d.lugares)}.`);
    }
    if (d.especies.length) {
      const muestra = d.especies.slice(0, 4);
      const resto = d.especies.length - muestra.length;
      lineas.push(`Anoté ${unir(muestra)}${resto > 0 ? ` y ${resto} cosa${resto > 1 ? 's' : ''} más` : ''}.`);
    }
    if (d.marcas > 2) lineas.push('El perro marcó varias veces; casi siempre tenía razón.');
    else if (d.marcas > 0) lineas.push('El perro se quedó duro mirando el monte y ahí estaba el bicho.');

    if (d.peces.length) {
      const mayor = d.peces.reduce((a, b) => (b.cm > a.cm ? b : a));
      lineas.push(d.peces.length === 1
        ? `Saqué una ${mayor.especie} de ${Math.round(mayor.cm)} centímetros y la devolví al agua.`
        : `${d.peces.length} piques buenos. La mejor, una ${mayor.especie} de ${Math.round(mayor.cm)} centímetros.`);
    }
    if (d.kayak) lineas.push('Saqué el kayak. Desde el agua el bosque se ve de otra manera.');
    if (d.vuelta) lineas.push('Di la vuelta entera al anillo en la trochita, sin bajarme.');
    else if (d.tren) lineas.push(d.tren > 1 ? 'Viajé un par de veces en la trochita.' : 'Me subí a la trochita y me bajé en la otra parada.');

    if (d.historias.length) {
      lineas.push(d.historias.length === 1
        ? `Me contaron lo de ${d.historias[0]}.`
        : `Escuché dos historias: ${unir(d.historias)}.`);
    }
    if (d.encargos.length) lineas.push(`Terminé el encargo: ${unir(d.encargos)}.`);
    if (d.cambiado.length) lineas.push(`Pasé por el almacén y cambié lo que junté por ${unir(d.cambiado)}.`);
    if (d.cocinado.length) lineas.push(`Al fuego: ${unir(d.cocinado)}.`);
    if (d.obra) lineas.push(`Terminé ${d.obra}. Cuatro paredes propias, levantadas con lo que junté.`);
    if (d.renovales && d.renovales.length) {
      lineas.push(d.renovales.length === 1
        ? `Planté un ${d.renovales[0]} en un claro. A ver si prende.`
        : `Planté ${d.renovales.length} renovales. Alguno va a quedar.`);
    }
    if (d.caballo) lineas.push('Anduve a caballo. El zaino conoce el valle mejor que yo: cuando dudo, lo dejo elegir.');
    if (d.rayo) lineas.push(`Cayó un rayo cerca. Partió un ${d.rayo} de arriba abajo; todavía se sentía el olor a quemado.`);
    if (d.crecida) lineas.push('El arroyo creció con la lluvia y bajaba marrón, arrastrando ramas.');
    if (d.cartas && d.cartas.length) lineas.push(d.cartas.length === 1 ? `En el almacén me esperaba carta de ${d.cartas[0]}.` : `Me llegaron ${d.cartas.length} cartas. Las leí en el almacén, parado.`);
    if (d.envio && d.envio.length) lineas.push(`Le di a Ercilia la foto para ${d.envio[0]}. Sale mañana con el tren.`);
    if (d.visita && d.visita.length) lineas.push(`Vino ${d.visita[0]} a la tarde. Nos sentamos a la mesa y el tiempo pasó sin que nadie lo mirara.`);
    if (d.rastro && d.rastro.length) lineas.push(d.rastro.length === 1 ? `El perro tomó un rastro y me llevó hasta ${d.rastro[0]}.` : `Seguimos ${d.rastro.length} rastros con el perro.`);
    if (d.feria && d.feria.length) lineas.push(d.feria.length === 1 ? `Fui a la feria de la estación y cambié con ${d.feria[0]}.` : `Día de feria: hice ${d.feria.length} cambios junto al andén.`);
    if (d.tejido && d.tejido.length) lineas.push(d.tejido.length === 1 ? `Tejí ${d.tejido[0]} en el telar. Las manos saben antes que uno.` : `Estuve en el telar: ${d.tejido.length} tejidos.`);
    if (d.cosechado && d.cosechado.length) lineas.push(`Coseché ${unir([...new Set(d.cosechado)])} del cantero.`);
    if (d.huevos) lineas.push('Junté los huevos del gallinero, todavía tibios.');
    if (d.esquila) lineas.push(d.esquila === 1 ? 'Esquilé una oveja. Se sacudió y se fue a pastar como si nada.' : `Esquilé ${d.esquila} ovejas. Me duelen las manos.`);
    if (d.sembrado && d.sembrado.length) lineas.push(`Sembré ${unir([...new Set(d.sembrado)])}. Ahora a esperar.`);
    if (d.fotos) lineas.push(d.fotos === 1 ? 'Saqué una foto.' : `Saqué ${d.fotos} fotos.`);
    // 2.1: el grabador, los rastros y las conservas
    if (d.grabaciones && d.grabaciones.length) lineas.push(`Grabé ${d.grabaciones[0]}. Cuando lo hice sonar, contestaron.`);
    if (d.rastros && d.rastros.length) lineas.push(`Seguí un rastro de ${d.rastros[0]} un buen rato.`);
    if (d.conservas) lineas.push('A la noche abrí una de las conservas del verano.');
    // 2.3: la colmena, el ahumadero, la noche de invierno y el lago
    if (d.miel) lineas.push(d.miel === 1 ? 'Saqué un frasco de miel de la colmena. Las abejas ni se enteraron.' : `Saqué ${d.miel} frascos de miel. Huele a flor de todo el valle.`);
    if (d.ahumado) lineas.push('Saqué las truchas del ahumadero. La casa quedó oliendo a humo, y está bien.');
    if (d.noche === 'calentito') lineas.push('Afuera helaba. Adentro el fuego duró toda la noche.');
    else if (d.noche === 'frio') lineas.push('Me dormí sin fuego y la helada se metió por todos lados. Mañana, leña.');
    else if (d.noche === 'fresco') lineas.push('La manta ayudó, pero sin fuego el invierno se siente igual.');
    // 2.4: la casa, el horno, el buzón, el corral y la helada
    if (d.noche === 'casa') lineas.push('Dormí en casa sin fuego. Fresco, pero con techo: nada que ver con la intemperie.');
    if (d.descanso) lineas.push('Me desperté descansado. Se nota cuando la casa está bien puesta.');
    if (d.horno && d.horno.length) lineas.push(`Horneé ${d.horno[0]} en el horno de barro. La casa olió a eso toda la tarde.`);
    if (d.buzon) lineas.push('Había carta en el buzón. Da gusto no tener que bajar al almacén.');
    if (d.corral) lineas.push('Don Ramón subió con dos ovejas para mi corral. Dice que son mansas; ya veremos.');
    if (d.helada?.helados && d.helada?.protegidos) lineas.push('Heló. La huerta de afuera se quemó un poco; lo del invernadero ni se enteró.');
    else if (d.helada?.helados) lineas.push('Heló fuerte. La huerta de afuera se atrasó.');
    else if (d.helada?.protegidos) lineas.push('Heló, pero lo del invernadero sigue verde.');
    if (d.tinte) lineas.push(`Teñí una pared de ${d.tinte}. La casa ya no parece la de nadie.`);
    if (d.lomo) lineas.push('En el lago asomó algo. Un lomo oscuro, un rato, y se hundió. No sé qué vi.');
    // 3.1: lo que pasó en el valle y lo que decidiste, y la historia
    for (const x of (d.eventos || []).slice(0, 3)) lineas.push(x);
    if (d.capitulos && d.capitulos.length) lineas.push(`En la historia del valle, ${unir(d.capitulos)}.`);
    // 2.0: el cielo de la noche
    if ((d.fugaces || 0) >= 3) lineas.push(`Llovieron estrellas. Conté ${d.fugaces} y después perdí la cuenta.`);
    else if (d.fugaces) lineas.push('Vi pasar una estrella fugaz.');

    if (lineas.length === 1) {
      lineas.push(elegir(r, [
        'Caminé sin buscar nada en particular. También sirve.',
        'Día tranquilo. Me quedé un rato largo escuchando el arroyo.',
        'No pasó gran cosa, y estuvo bien así.',
      ]));
    }
    lineas.push(d.durmioAfuera
      ? elegir(r, ['Dormí en la carpa, con la lona golpeando toda la noche.', 'Armé la carpa donde me agarró la noche.'])
      : elegir(r, ['A dormir.', 'Me acosté temprano.', 'Buen día. A dormir.']));

    return { dia, estacion, texto: lineas.join(' ') };
  }

  return { anotar, clima, escarcha, cerrar, get hoy() { return hoy; } };
}
