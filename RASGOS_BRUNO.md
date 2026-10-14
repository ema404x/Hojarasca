# Los 32 rasgos de Bruno y sus efectos (propuesta de la F0, a revisar)

Propuesta mía para que corrijas. Los **textos** de cada rasgo los escribís vos (ver `TEXTOS_BRUNO.md`); acá sólo está **qué hace** cada uno.
Todo esto es **sólo para el Relax**; en el Desafío los efectos están apagados.

## Cómo se miden los efectos

- Cuatro sistemas: **abrigo**, **afecto** (con los vecinos), **pesca** y **cuaderno**.
- Unidad: el **paso**, 1 paso ≈ 5 %. Tope por sistema: **±4 pasos (±20 %)** por la suma de todos los rasgos.
- **Abrigo** se mide en puntos de abrigo (hoy el juego pide 4 para templar una noche de invierno). **1 punto de abrigo = 2 pasos** a efectos del balance.
  El tope de abrigo es **±1 punto** (un poco más que el 20 %: es una excepción a revisar).
- **Sabor:** el rasgo se ve en la ficha y en algunos diálogos, pero **todavía no cambia ningún número**. Se enchufa cuando su sistema entre.
- **Provisorio:** no leí todavía cómo funciona por dentro cada sistema (cuánto dura una espera de pesca, qué mide exactamente el cuaderno). Las magnitudes se
  confirman en la F3, con la prueba de cada sistema.

## Reglas de balance (las verifica la prueba de combinaciones)

1. Cada opción de personalidad, oficio, gustos y hobby trae **un pro y un contra de igual peso**, los dos con efecto o los dos de sabor. Nada de pro con efecto
   y contra de sabor: sería una opción que gana siempre.
2. **Virtud** es sólo un pro y **defecto** es sólo un contra. Se eligen una de cada una, así que se compensan entre sí.
3. **Gustos:** el pro es **condicional** (afinidad con los vecinos que comparten el gusto, +1 paso en el afecto con ellos) y el contra es de sabor. El peso del pro
   es chico a propósito. Hay que validar esta regla con la prueba, porque rompe levemente la regla 1.

## Personalidad (5)

| Rasgo | Pro | Contra |
|---|---|---|
| Tranquilo | +2 pesca | −2 afecto (le cuesta arrancar con la gente) |
| Curioso | +2 cuaderno | −1 punto de abrigo (sale sin pensar en el frío) |
| Sociable | +2 afecto | −2 cuaderno (se distrae charlando) |
| Metódico | +1 punto de abrigo (previsor) | −2 pesca (se frustra si el plan cambia) |
| Reservado | +1 punto de abrigo (discreto, va siempre bien abrigado) | −2 afecto |

## Oficio de antes (6)

| Rasgo | Pro | Contra |
|---|---|---|
| Programador | +2 cuaderno (ordena la información) | −1 punto de abrigo (vivía adentro) |
| Cocinero | +2 afecto (convida y se hace querer) | −2 cuaderno (le cuesta madrugar: pierde las mañanas) |
| Contador | sabor (la feria rinde más) | sabor (poco acostumbrado al trabajo físico) |
| Técnico de sonido | +2 cuaderno (anota las aves por el canto) | −2 afecto (las charlas largas lo agotan) |
| Mensajero en bicicleta | +1 punto de abrigo (curtido a la intemperie) | −2 pesca (sin paciencia para esperar) |
| Docente de plástica | +2 afecto (trato fácil con la gente) | −2 pesca (no sabe quedarse callado) |

## Gustos (6, se eligen dos)

| Gusto | Pro | Contra |
|---|---|---|
| Mate | afinidad **a la mitad** (+0,5 paso) con vecinos que lo comparten, porque lo comparte casi todo el pueblo | sabor |
| Folklore | afinidad con vecinos que lo comparten | sabor |
| Lluvia | afinidad con vecinos que lo comparten | −1 punto de abrigo (sale a mojarse) |
| Trenes | afinidad con vecinos que lo comparten | sabor (pierde horas mirando pasar) |
| Asado | afinidad con vecinos que lo comparten | sabor |
| Libros | afinidad con vecinos que lo comparten | sabor (se acuesta tarde) |

## Hobby (5)

| Hobby | Pro | Contra |
|---|---|---|
| Fotografía | sabor (el álbum rinde más) | sabor (pierde horas mirando) |
| Pesca | +2 pesca | −2 cuaderno (se queda pescando y no anota) |
| Guitarra | sabor (se luce en la peña) | sabor (practica de noche) |
| Carpintería | sabor (las obras rinden más) | sabor (se queda sin materiales) |
| Observar aves | +2 cuaderno | −1 punto de abrigo (horas quieto al aire libre) |

## Virtud (5, se elige una; sólo pro)

| Virtud | Efecto |
|---|---|
| Resistente | +1 punto de abrigo |
| Paciente | +2 pesca |
| Simpático | +2 afecto |
| Madrugador | +2 pesca (al amanecer pican más) |
| Ahorrativo | sabor (la mochila y la feria rinden más) |

## Defecto (5, se elige uno; sólo contra)

| Defecto | Efecto |
|---|---|
| Friolero | −1 punto de abrigo |
| Impaciente | −2 pesca |
| Gruñón | −2 afecto |
| Distraído | −2 cuaderno |
| Dormilón | sabor (le cuesta levantarse) |

## Lo que muestra el reparto

- **Reparto rebalanceado el 14-10** (contado sobre las tablas de arriba, con un script): abrigo **4 pros y 5 contras**; cuaderno **4 y 4**; pesca **4 y 4**;
  afecto **4 y 4**. Cada pro y cada contra de una opción caen en sistemas distintos, para que no se anulen entre sí.
- **Qué cambió respecto de la primera propuesta:** Reservado pasó de cuaderno a abrigo; Cocinero dejó de ser sólo sabor (+afecto, −cuaderno); el hobby Pesca cambió su
  contra de abrigo a cuaderno; Madrugador pasó de cuaderno a pesca. El abrigo quedó con una contra de más a propósito: es el sistema donde un tope de ±1 punto se alcanza fácil.
- **Sobre el tope:** hay combinaciones que se pasan. Por ejemplo, tranquilo (+2 pesca), pesca (+2) y paciente (+2) suman +6 en pesca y el tope los recorta a +4. Es a
  propósito: el tope evita que alguien rompa el juego, y recortar no cambia lo que se ve en la ficha. Conviene que la ficha avise cuando un rasgo ya no suma
  («ya estás al máximo en pesca»).
- **Pendiente de decisión:** si el abrigo debería tener un tope en porcentaje como los demás, en vez de ±1 punto. Se resuelve al leer cómo calcula hoy el abrigo, en la F3.
