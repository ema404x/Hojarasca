# 1.2.0 — Desafío, segunda ronda

## Nuevo

- **Portón de empalizada** (Defensa · 5 troncos + 3 tablas · resistencia 380): tramo de
  empalizada con portón de tablas que se abre y cierra con E (reutiliza el sistema de
  puertas: bisagra, chirrido y colisión que se abre). Encastra con la empalizada.
  Abierto, no frena flechas ni es atacado; cerrado, los invasores tienen que romperlo.
- **Dificultad** (Tranquila / Normal / Implacable), en la portada al elegir Desafío y en
  la pausa (se puede cambiar en cualquier momento):

  | | Invasores | Daño al jugador | Resistencia invasores |
  |---|---|---|---|
  | Tranquila | ×0.6 | ×0.55 | ×0.8 |
  | Normal | ×1 | ×1 | ×1 |
  | Implacable | ×1.4 | ×1.35 | ×1.25 |

- **Aviso previo**: a las 19:30 "Se ven luces raras en el cielo" + sirena.
- **Amanecer**: resumen de la noche (invasores abatidos, obras perdidas) y una **caja de
  suministros** que baja en paracaídas cerca del jugador (troncos, tablas y piedra; desde
  que tenés arco, flechas; emplasto cada dos noches; cristales desde la tercera). Se abre
  pasando por encima, tiene banderín rojo y figura en el mapa. Se guarda si no se juntó.
- **Lectura del combate**:
  - marca de impacto en la mira (roja cuando el golpe es mortal);
  - barra de vida sobre cada invasor herido (hasta 8, a menos de 45 m);
  - indicador rojo en el borde de la pantalla desde donde te pegan;
  - invasores a menos de 120 m como puntos rojos en la brújula;
  - cápsula estrellada en el mapa hasta encontrar la pistola.
- La nave es un 50% más grande, para que se lea sobre las copas.

## Revisado en pantalla

Bruto (violeta, con coraza), tirador (gris azulado, con orbe de plasma), nave, portón
abierto entre empalizadas y caja de suministros: capturas en
`pruebas/salidas/desafio/` al correr las pruebas.

## Pruebas

- `verificar-modo-desafio.mjs`: dificultad, caja del alba y su guardado, portón y
  selectores en la plantilla.
- `npm run verify:desafio`: 30 comprobaciones de partida real (suma amanecer con caja en
  paracaídas y portón que se abre, se cierra y recibe daño).
