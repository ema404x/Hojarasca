# Hojarasca 4.4 · Parte 2: comprar un negocio de un vecino y ser su socio (rama `v44-compra`)

Sale de `v431-tiron` (4.3.0 + herramientas de medición). Sólo Relax, sin mando, sin inglés. **La versión no se subió** (sigue 4.3.0).

## Cómo se juega

- **Dónde se propone**: en la charla con el dueño, en la rueda, categoría **«Hacer juntos» → «Hablar de su negocio»**. Elegí esa puerta (y no el banco) porque la reacción depende de la amistad y de la historia del vecino, y eso vive en la charla. Para que se descubra: Amadeo (el gerente) ofrece en «Charlar» **«Hablar de negocios»** (tus cuentas y qué locales se pueden comprar), está en la guía (F1, «Comprar un negocio y ser socio») y en el cuaderno (J, «Oficios y aldea» → **«Negocios y sociedades»**, que explica cómo empezar y lista lo que se puede comprar).
- El submenú dice el precio de lista y lo que se puede poner de socio. Opciones: «Preguntarle cómo le va», «Proponerle ser socio», «Comprarle el negocio» y, si ya es tuyo o sos socio, «Cómo viene», «Retirar la caja (monto)», «Avisar que me retiro» / «Seguir de socio».
- **Comprar**: el vecino responde con su voz; si acepta, queda «Cerrar el trato: $X» / «Pensarlo» (nada se paga hasta cerrar). Al cerrar: se paga por `economia.pagar`, un cartel nuevo junto a la puerta dice el nombre del local y «de Bruno», aviso en el HUD, y el vecino cierra con sus líneas.
- **Después**: cada día pasa la liquidación (al empezar el día, de a uno, hasta 30 días de una vez) y sale un aviso («El almacén rindió $1.300 · Hay $X esperando en las cajas · LLENA: …»). La plata va a la **caja del negocio**, que se cobra con el submenú del vecino.

## Los ocho negocios (precio de lista, ganancia por día, reacciones)

| Negocio (dueño) | Lista | Ganancia/día | Se paga | ¿Se puede ir? | Lazo (apego) |
|---|---|---|---|---|---|
| Panadería (Rosa) | $80.000 | $1.250 | 64 d | sí | 0,60 |
| Pescadería (Aurelio) | $85.000 | $1.210 | 71 d | sí | 0,50 |
| Sala de miel (Guido) | $95.000 | $1.310 | 73 d | sí | 0,55 |
| Hilandería (Elvira) | $110.000 | $1.510 | 73 d | sí | 0,65 |
| Casa de té (Ceinwen) | $130.000 | $1.700 | 77 d | **no** | 0,95 |
| Herrería (Anselmo) | $150.000 | $1.910 | 79 d | sí | 0,70 |
| Almacén (Ercilia) | $170.000 | $2.100 | 81 d | **no** | 0,95 |
| Cantina (Lucrecia) | $200.000 | $2.400 | 84 d | **no** | 1,00 |

(Los que «no se pueden ir» son los de servicio al público de siempre: se quedan de empleados y todo anda como hoy. Ercilia, Ceinwen y Lucrecia, con apego ≥ 0,8, reaccionan más intensamente.)

### Reacción del vecino (`reaccionCompra`, en puntos de amistad; 50 = amigo, 140 = compadre)

| Amistad | Apego fuerte (Ercilia, Ceinwen, Lucrecia) | Apego normal (los otros cinco) |
|---|---|---|
| < 20 | **se ofende**: no vende, te tiene −3 de confianza y no quiere hablar 4 días | se niega (1 día de espera) |
| 20–49 | se niega | pide un 40 % más (y, si acepta, se va a otra cosa) |
| 50–94 | si no le escuchaste 2 partes de su historia: **«antes pedime Tu historia»** (sin espera); si no, pide +20 % y se queda | pide +20 %, se va |
| 95–139 | acepta con condiciones, +5 %, se queda | ídem, se queda |
| 140–179 | acepta con gusto, −5 %, se queda | ídem |
| 180+ | −10 % | −10 % |

Más: con su **historia entera** escuchada, −7 % (fuertes) o −4 %; **Lucrecia y el romance**: novios −8 %, comprometidos o casados −15 % (con voz propia para cada etapa), separados +15 %. El precio siempre queda entre el 80 % y el 145 % de la lista (la prueba lo comprueba). Si te devolvés **socio → comprador**, el aporte (según la devolución por días) descuenta del precio y te dan tu caja.

**Qué hace el vecino**: «se queda» = sigue en su puesto, ahora a sueldo (tu `sueldo` por día va en las cuentas); «se va» = pasa el día (de 9 a 19, menos domingos) en la plaza y atiende alguien del pueblo (las ventas bajan al 88 %). Sigue durmiendo en el cuarto de atrás (lo dice la decisión 4).

## Ganancia por día (`gananciaDelDia`)

`ventas × semana × variación(±12 %, fija por día y negocio) × gestión × cartera…`: ventas − insumos (40 % de las ventas) − sueldo del que atiende − gastos fijos (alquiler, impuestos, luz); nunca baja de 0. Factores:

- **Semana**: sábado y viernes más (cantina ×1,6 y ×1,35), domingo menos; cada negocio con su curva (media 1).
- **Gestión**: hasta 3 días sin pasar a verlo rinde todo; después −4 % por día hasta el 70 %. «Pasar» = hablar de su negocio o retirar la caja.
- **Cartera** (más negocios, atención repartida): 100, 93, 86, 79, 72, 65, 58, 55 %, en orden de compra.
- **Compadre de empleado**: +5 %. **Vecino que se fue**: ×0,88.
- **Caja con tope de diez días** de ganancia (el excedente se pierde y se cuenta como «perdido»). Volver tras mucho tiempo: sólo cuentan los últimos 30 días.

## Sociedad

- Solo se ofrece a quien te conoce: puntos mínimos 50 (panadería, pescadería, miel), 60 hilandería, 70 herrería, 80 casa de té, 95 almacén, **110 cantina**; los de apego fuerte piden además haber escuchado al menos una parte de su historia.
- Ponés **de 10 % a 40 % del precio** (tres montos: mínimo, medio y máximo, p. ej. panadería $8.000 / $20.000 / $32.000; cantina $20.000 / $50.000 / $80.000). Te toca **aporte / precio × 100 × factor** (amigo 0,9; compadre 1), hasta 45 %. Cobrás ese porcentaje de la ganancia del negocio, por día, a una caja con tope.
- **Retiro con aviso**: avisás y se hace efectivo a los **2 días**; te devuelven del aporte el 60 % (< 6 días de socio), 80 % (< 18), 92 % (< 36) o el 100 % (después), más lo que había en la caja. Se puede cancelar. Hasta 3 sociedades a la vez.

## Equilibrio (`herramientas/simulador-compra.mjs [días] [jornal]`)

Referencia: ~$3.200/día de jornales. Un negocio rinde 1,2 % a 1,6 % de su precio por día: se paga solo en **64 a 84 días** a precio de lista; a un compadre con toda su historia (−14 %), en **56 a 70**; a un amigo (+20 %), en **77 a 100**. Jugador que ahorra $3.200/día y compra del más barato al más caro (amigo, 100 puntos): primera compra el **día 27** (panadería a $84.000, 25 días de ahorro), después una cada ~18–20 días; con los ocho: **$9.600/día** al final pasando cada 5 días (3 veces los jornales), **$8.000** cada 10 días y **$4.300** sin pasar nunca (cajas llenas). Los ocho juntos: $1.020.000 de lista, $13.390/día sin cartera y **$10.670/día** con ella (80 %). Sociedad: se vuelve en 64 a 93 días y el aporte vuelve entero; p. ej. $43.000 en el almacén (compadre, 25,3 %) = $531/día. No hace falta estar presente para cobrar, pero hay que pasar: es el freno contra el ocio.

## Decisiones mías (a revisar)

1. **Caja con tope + pasar a verlo** en vez de plata directa a la billetera: da razones para volver y evita el «dinero de la nada» si no jugás. Si la querés automática es cambiar `retirarCaja`.
2. **Sin tope de negocios** (comprás los ocho) pero con cartera decreciente; el final de partida queda en ~3× los jornales. Si es mucho, tocar `FACTORES_CARTERA` o los precios (una línea).
3. **Aldea.js**: un hook de 4 líneas (`fijarDesvioRutina`) para mandar a la plaza al que se fue; sin él, todo igual.
4. El vecino que se va **sigue durmiendo en el cuarto de atrás** del local (no hay otra casa para él).
5. El **cartel de turnos del empleo (4.3)** de un local que comprás deja de ofrecerse («este local ahora es tuyo»): 2 líneas en `empleo.js`.
6. Rotulo del cartel: «de Bruno» (no el apodo: «de el hachero del refugio» sonaba mal).
7. Si apostás por «pide más» no queda registro: sólo el portazo y la ofensa fijan espera.
8. Textos de los cinco vecinos menos fuertes (Rosa, Anselmo, Aurelio, Elvira, Guido) más cortos que los de Ercilia, Ceinwen y Lucrecia: revisar tono.
9. En el menú el submenú vuelve al principal con «Mejor no»/«Pensarlo» (no al submenú de negocio).

## Archivos

Nuevos: `src/negocios-vecinos.js` (reglas puras), `src/negocios-vecinos-voces.js` (lo que dice cada vecino), `src/negocios-vecinos-juego.js` (menú, trato, avisos, cuaderno, cartel), `src/negocios-vecinos-mundo.js` (el cartel), `pruebas/verificar-4-4-compra.mjs` (en el gate), `pruebas/humo-4-4-compra.cjs` (partida real, fuera del gate), `herramientas/simulador-compra.mjs`, este informe.

**Compartidos tocados (poco):** `src/main.js` (+import, creación aislada con `fallaSistema`, `negocios:` en la charla, actualizar con `fallaSistema`, página del cuaderno concatenada, `__negociosVecinos`), `src/aldea.js` (4 líneas: `fijarDesvioRutina` y su uso en `rutinaAldea`), `src/guardado.js` (campo con valor por defecto y saneado), `src/vecindad-juego.js` (la opción y el `elegir` de `negocios`), `src/social-rueda.js` (categoría «Hacer juntos» e ícono), `src/empleo.js` (2 líneas), `src/guia.js` (una entrada), `package.json` (la prueba en `verify:pasos`), `herramientas/al-monitor.cjs` (lo tocó la coordinación, no yo).

## Verificación

- **Verificado**: `verificar-4-4-compra.mjs` (≈9.600 comprobaciones en Node: reglas, la matriz de reacciones × amistad × historia × romance, precios, comprar, ganancia, tope, gestión, cartera, sociedad y retiro, guardado de partida vieja/rota/Desafío, el juego con un contexto de mentira, enganches, sin mando ni inglés). Pruebas viejas tocadas: **ninguna** (la guía necesitó acortar mi texto por su límite de 260 caracteres; la del empleo exigía el principio de la línea de `extras`, que dejé igual con `.concat`).
- **Verificado en Electron, partida real** (`humo-4-4-compra.cjs`, oculto, teclas de verdad por la rueda): Rosa se niega, Lucrecia se ofende y baja la confianza, Ercilia pide su historia, Aurelio pide +20 %, Ercilia vende el almacén y se queda (cartel, billetera, mostrador sigue ofreciendo lo de siempre, el cartel de turnos ya no ficha), Anselmo vende y se va de la herrería hacia la plaza, aviso diario, caja, cuentas, sociedad con Elvira (22,9 %), retiro con devolución, Amadeo, cuaderno, guardar y recargar. **TODO BIEN** (54 comprobaciones). Capturas a tamaño completo, miradas por mí, en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\compra\` (01–21).
- **Razonado, no verificado**: fps en la 4600G (nada por cuadro; el cartel son 3 mallas con una textura chica cada uno, sólo de cerca); el tono de los textos; jugar un ciclo largo a mano.
- **No verificado**: comprar la cantina o la casa de té en la partida real (sólo en Node; no toqué `cantina-juego.js`, `casa-te.js` ni `pena.js`); Lucrecia con romance real; la plaza de Anselmo de noche; sonido.

## Lo que NO quedó

Empleados en tu negocio propio (otro agente), que los vecinos reaccionen al cartel nuevo en la charla, poner más plata a una sociedad ya hecha, vender un negocio de vuelta, y que el vecino que se fue tenga otra casa.
