# Hojarasca — Negocios y empleo (borrador del 19-10-2026, para después de la 4.2)

Pedido del usuario: poder **crear un negocio** o **trabajar de empleado** para uno que ya esté abierto. Sirve para darle más vida al juego base y más uso a los pesos
(la 4.2 agrega más piezas para construir, el pico y el costo en pesos). Sin inglés, sin mando; sólo Relax; fluido en la 4600G.

## Decisiones del usuario (19-10)
1. **Empleo fijo con horario y sueldo** (no sólo jornales sueltos): te tomás un puesto en un local de la aldea (almacén, panadería, herrería, banco, casa de té,
   cantina…), fichás, cumplís el turno, cobrás sueldo y podés ascender con el tiempo. Los jornales de hoy (`trabajos.js`, $700–1.300, ~2 por día) pueden convivir
   como extras (a decidir al diseñarlo).
2. **Negocio propio, de cuatro maneras** (se eligieron todas):
   - un **local de la aldea que abrís vos** (alquilás o construís, lo surtís, fijás precios, te entra plata según los clientes);
   - **comprar un negocio ya existente** (por ejemplo el almacén de Ercilia o la casa de té), que pasa a ser tuyo con su personal;
   - **sociedad con un vecino** (ponés plata y cobrás un porcentaje de las ganancias);
   - **negocios de producción propia** (los edificios de oficio de la 4.2: panadería, cervecería, tejeduría…, ya más completos, que producen y vendés).
3. **En un negocio tuyo contratás empleados** (vecinos a sueldo que atienden cuando no estás).

## Sistemas que ya existen y sobre los que hay que construir
- `src/economia.js` (pesos, `pagar`/`cobrar`), `src/negocios.js` y `progreso.negocios` (puesto propio en la feria, comisión), `src/banco.js` (préstamos, abastecimiento,
  alquiler), `src/trabajos.js` (jornales), `src/pedidos.js`, `src/comercio.js`/`mercado.js` (oferta y demanda), `src/aldea.js` + `vecindad*.js` (horarios, oficios y
  necesidades de los vecinos, tiempo libre), `src/oficios.js` (habilidades que suben con el uso), `src/propiedad.js` + `obra-pesos.js` (compra y alquiler de locales por etapas).
- La 4.2: edificios de oficio propios con función (`PRECIOS_CONSTRUCCION.md`, escala de precios y receta de piezas).

## Preguntas abiertas para el diseño (preguntarle al usuario con opciones antes de implementar)
- Sueldos y ascensos: cuánto paga cada puesto y cómo se asciende (por días, por oficio, por reputación); duración del turno y qué pasa si faltás.
- Locales: cuáles contratan, cuántos puestos hay por local, qué tareas se hacen (atender, cargar, cocinar, forjar, contar plata…) y si son minijuegos o sólo avanzar el reloj.
- Negocio propio: cómo se calcula la plata (clientes, precios, surtido, competencia con los locales existentes), cuánto de lo que gana va al jugador cuando no está,
  impuestos o gastos fijos (alquiler, sueldos), riesgo de pérdida.
- Compra de un negocio de un vecino: precio, qué pasa con el vecino (sigue trabajando ahí, se muda), y con su historia/horarios.
- Sociedad: porcentaje, cuánto se aporta, cómo se rescinde.
- Equilibrio: que no rompa la economía (hoy ~$3.200/día por jornales activos; ver `ECONOMIA_NUMEROS.md` y los simuladores `herramientas/simulador-*.mjs`).
- Que no se rompa si el jugador está muchos días sin jugar (topes de acumulación, cierre de turnos).

## Cómo se haría (a ajustar)
1. Diseño con el usuario (preguntas de arriba).
2. Núcleo de empleo (puesto, turno, sueldo, ascenso) sobre un local; después más locales.
3. Negocio propio: primero el local propio con clientes y empleados, después compra de uno existente y sociedad.
4. Simuladores de economía actualizados, pruebas, partida real, pase de bugs.
