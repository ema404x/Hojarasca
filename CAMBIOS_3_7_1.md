# Hojarasca 3.7.1 — Amor en la aldea

Segunda de las 5 versiones de `PLAN_3_7.md`. Todo lo decidió el usuario (ver "Decidido el 06-10" en el plan).
Sólo Relax; nada religioso; sin economía nueva; se apaga entero desde Ajustes → Romance (viene encendido).

## Quiénes
- 12 candidatas, siempre adultas y solteras: las 8 pobladoras de la 3.7.0 (Ayelén, Sofía, Rocío, Inés, Abril, Malena,
  Martina, Valentina) y Nélida, Ceinwen, Marta y Julia. Nunca chicos, nunca casadas, nunca Pocha: garantizado por
  reglas (`esCandidata` en `amor.js`) y por prueba, y el guardado descarta a cualquier otra.

## Cómo va
- Coqueteo → saliendo (la primera cita) → novios (tres citas, amistad y su lugar favorito ayuda) → comprometidos
  (el anillo) → casados. Ella puede decir que no (a la cita, la declaración, la propuesta, la convivencia y la
  reconquista); después de un no, hay que esperar.
- **Citas** en 13 lugares (5 en la aldea, 8 en el valle), en un rato libre de ella: sale con tiempo, va caminando
  y la cita tiene su momento (el banco del mirador, el té en la casa de té, sentados en el muelle). Si no vas, te
  esperó y se fue. Flores (un ramo por día, en invierno no hay) y cartas de amor por el correo (Benigno o Ercilia).
- **Celos**: se puede salir con más de una, pero el chisme corre (según el ritmo de la aldea) y las dos se enojan.
- **El anillo** lo hace Anselmo con un canto rodado (3 días; se ve en el yunque).
- **Casamiento civil** en la biblioteca popular a las 11: el juez de paz llega en el tren, Ernesto y Pocha de
  testigos, invitados y tu familia; después, fiesta en el salón (baile) o en la plaza (mesa larga), con brindis.
- **Vivir juntos** en el refugio o en la casa de ella. Si es el refugio, ella está de 19 a 8 (a la mesa, en la cama)
  y de día va a su local; trae su silla, su baúl y su manta.
- **De la mano en público**: "Salir a caminar juntos" (y al volver de una cita): cerca si salen, de la mano de
  novios, del brazo de casados.
- **Ñiki ñiki**: fundido a negro, sin mostrar nada; da descanso y buen ánimo; a la mañana desayunan juntos.
- **Hijos**: hasta 2, sólo casados y si lo hablan. El cuarto se suma a la casa cuando nace alguien (en el refugio,
  pegado al costado, con cuna, camas y velador). Bebé en brazos o en la cuna; los chicos van a la escuela, juegan
  y duermen en su cama, y crecen como los chicos de la aldea.
- **Descuido**: se enfría; de novios cortan; casados se separan (los hijos viven con ella y te visitan miércoles
  y domingo). Separado sigue contando como casado: se la puede reconquistar.

## Habilidades ("las dos cosas")
Según con quién te casás, un nivel por estación: los niveles 1 y 3 rinden algo cada mañana y el nivel 2 es una
mejora tuya permanente. Por ejemplo: Rocío (caminás 7% más rápido), Sofía (su lente: fotos de más lejos), Martina
(kayak 12% más rápido), Ayelén (animales más mansos), Inés (un fruto más al juntar), Valentina (anotás cielo el
doble de rápido), Malena y Nélida (obras con menos material), Julia (huellas de más lejos), Ceinwen (más cosecha),
Abril (los regalos que gustan suman más), Marta (más descanso). Lo aprendido no se olvida.

## Módulos
`amor.js` (reglas, puro), `amor-voces.js` (textos), `amor-juego.js` (enganche), `amor-escenas.js` (dónde está y qué
hace cada uno, puro), `amor-mundo.js` (lo visual). Pruebas: `verificar-3-7-1-amor.mjs` (1000 comprobaciones),
`verificar-3-7-1-amor-mundo.mjs` (118), `humo-3-7-1-amor.cjs`, `humo-3-7-1-amor-mundo.cjs`.

## Herramientas
- `herramientas/suite-paralela.cjs`: todas las partidas reales de a N a la vez, cada una con su perfil
  (`herramientas/perfil-propio.cjs`) y en el monitor externo. De ~60 min a ~15–20 min.

## QA
- `npm run verify`: 152 de 152.
- Partidas reales: las 60 en verde (de a 4 a la vez en ~24 min: 56 a la primera; humo-3-5-1-desafio y humo-3-6-mundo pasaron solas, eran de carga; humo-2-8 se había quedado vieja con el cuerpo y la mano del estilo P de la 3.7.0 y se ajustó).

## Queda para después
- El brazo del mate con el codo fijo (de la 3.7.0); el músico de la fiesta sin instrumento; las copas del brindis
  casi no se ven; poca luz en los cuartos de noche.
- Sin probar en partida real: el cuarto en las casas de la aldea, las visitas de los hijos de separados y el gesto
  "del brazo".
- Inglés: todo lo nuevo sólo en castellano. Medir en la PC del usuario.
