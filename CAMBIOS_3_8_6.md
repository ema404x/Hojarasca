# Hojarasca 3.8.6 — Pase de bugs completo

El usuario pidió seguir arreglando bugs ("arreglá todo"). Cinco equipos recorrieron el juego en paralelo:
- `v386-p1`: Relax base;
- `p2`: aldea y gente;
- `p3`: vehículos, cocina y mundo;
- `p4`: La noche de los duendes;
- `p5`: guardado, menús y rendimiento.

Se juntaron en `v386-junta`. Son unos 130 arreglos. Las decisiones de diseño se tomaron con lo que recomendó cada
equipo, porque el usuario dijo «arreglá todo». Van al final para que las revise.

## Lo más grave
- **Fotos del álbum** que se borraban del disco si un antivirus las tenía ocupadas al abrir. Ahora guardar sólo agrega.
  - El álbum ya no se reescribe entero con cada foto (eran tirones).
  - El tope pasó de 400 a 5000 fotos, y exportar y sincronizar a 64 MB.
- **Sincronización entre PCs:** con el reloj de una PC atrasado, la otra pisaba lo jugado. Ahora además detecta las
  copias en conflicto y avisa.
- **Partidas con un número roto** no arrancaban. Ahora arrancan desde la copia de seguridad.
- **Mando solo:** había trabas en las tarjetas de la historia y del valle, en la victoria, en la pausa arriba del tren
  o del kayak, y con B, que agachaba en vez de cerrar. Ahora el botón con que se cierra algo no actúa dos veces.
- **Historia:** el temporal del capítulo 8 se tildaba a cualquier hora. Ahora se cuenta a la mañana siguiente, y esa
  noche hay tormenta de verdad.
- **La noche de los duendes:**
  - los refuerzos de madrugada volvían al recargar;
  - la noche especial se salteaba si el reloj saltaba el aviso;
  - el Rey Duende revivía si se cerraba durante su caída;
  - la salpicadura del escupitajo y la picada de la lechuza pasaban a través de las paredes;
  - había nidos y madrigueras atravesados por troncos;
  - las semillas tiradas no se guardaban y al caer se podían juntar igual.
- **Fiestas:**
  - sentado en la fiesta, el reloj iba 40 veces más rápido y cortaba el truco y la leyenda;
  - el rival se iba en medio del partido;
  - el concurso se llevaba a la gente de la fiesta.
- **Amistad infinita** en el picado, la mesita y el baile al recargar.
- **Amor:** quedabas casado y de novio a la vez al reconquistar a la ex.
- **Caballo en el puente colgante:** Escape te bajaba.
- **Velero:** navegaba solo en la pausa.
- **«¿Bajar la calidad?»:**
  - salía con un solo tirón o en medio de una charla;
  - bajar recompilaba todo a mitad del juego (4 s trabado). Ahora muestra «Acomodando la calidad…».

## Además
- **Relax:**
  - **Historia de Martín:** el alero del arriero y la historia completa, probados en partida real.
  - **Obras grandes:** ya no se enciman con piezas, y las piezas no se arman adentro del refugio ni del almacén.
  - **Viento:** al voltear el tendal o la leñera, lo colgado y la leña vuelven.
  - **Tecla E:** varios órdenes de la E con su aviso.
  - **Dormir:** pasada la medianoche, con la hora de tu reloj, en el fundido y en la carpa.
  - **Perro:** usa su nombre y te alcanza corriendo.
  - **Clima:** no corre en la pausa.
  - **Barra:** la casilla queda vacía al terminarse lo que tenía.
  - **Cama del refugio:** cuenta como casa cerrada.
  - **Logros:** los ganados sin Steam ahora llegan a Steam.
  - **Fugas:** cada pez y cada carpa dejaban memoria ocupada.
  - **Modo foto:** varios arreglos.
- **Aldea:**
  - **Iniciativa:** ahora te habla el más cercano que puede venir.
  - **«Te quiere decir algo»** ya no se pierde.
  - **Cumpleaños:** el del sábado y los 90 de la abuela ahora sí pasan.
  - **Citas:** cuentan «con vos» si estás con ella.
  - **Hijos:** hay un cuarto por casa si son de dos madres.
  - **La ex:** podés hablar de los chicos con ella.
  - **Visitante guiado:** se le puede decir «Hasta acá».
  - **Cachorro:** no repite el nombre de otro perro.
  - **Chismes:** género y nombres corregidos.
  - **Jineteada y taba:** arreglos.
- **Vehículos:**
  - **Locomotora sola:** la vuelta ahora se cuenta.
  - **Frutales:** tope con aviso. Al desarmar el hoyo devuelve el plantín o la fruta. Con la estación fija, «descansa».
  - **Peras:** ahora maduran en verano fijo.
  - **Vagón comedor:** lo que estaba al fuego vuelve crudo al desengancharlo.
  - **Invitados del asado:** ya no se quedan todos los días.
  - **Cargas:** se rehacen a medianoche.
  - **Tren varado:** el caballo baja del lado de afuera de la vía.
  - **Kayak:** amarrado en tu embarcadero al bajarte; no ofrece traerlo si ya está ahí.
  - **Sulky:** sin teclas que no corresponden arriba.
  - **Velero:** la vara se usa con el mando.
  - **Cocción:** con la hora de tu reloj, no adelanta 24 horas.
  - **Plurales:** todos los «1 tablas», «unas 1 horas» y similares.
- **Menús:**
  - **Tarjeta del valle:** ahora tiene el estilo «Cuaderno de campo».
  - **Controles y Créditos:** sin paneles encimados.
  - **Letra enorme:** todo entra.
  - **Teclas propias:** se muestran en todos lados.
  - **Cuaderno:** el botón Cerrar ya no queda tapado.
  - **F11 mantenida:** ya no prende y apaga sin parar.
  - **Permisos de Electron:** sólo los que el juego usa.

## Decisiones tomadas con lo recomendado (para revisar)
- Al reconquistar a la ex, la que salía con vos corta.
- Lechuza: sólo el tejado de lajas protege.
- Semillas tiradas: se pierden al caer y se guardan en la partida.
- Mesita: perder sigue dando más amistad que ganar.
- Al bajar la calidad, el cambio es inmediato, con el cartel.

## Pendiente de diseño (el usuario decide)
- **Chinchón:** cómo se cuenta el comodín suelto del que no cortó. Hay que confirmar cómo se juega en casa.
- **Invitaciones de los vecinos** («¿Un mate?»): poder aceptarlas. Va en «La aldea viva».
- **Relax:**
  - la siesta apaga el fuego entero;
  - una sola fogata;
  - toda lluvia es tormenta;
  - no se puede abandonar una carrera;
  - las tarjetas no se posponen;
  - los eventos no vencen;
  - el viento devuelve material;
  - construir con el mando.
- **Memoria:** un soak largo del Desafío. Las geometrías suben unas 40 por vuelta corta y no se sabe si es fuga.

## Pruebas
- **Gate:** 184 de 184, con `verificar-3-8-6-relax`, `-aldea`, `-vehiculos`, `-duendes` y `-base`.
- **Humo nuevas:** `humo-3-8-6-alero`, `-relax` y `-base`.
- **Intermitentes conocidos:**
  - `humo-3-7-4-rueda` (captura);
  - `humo-2-9-tren` (Elsa a la vista);
  - `verificar-3-7-2-granja` (tiempo con la PC cargada).
