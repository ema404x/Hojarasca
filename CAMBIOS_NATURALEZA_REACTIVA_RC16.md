# Hojarasca RC16 — Naturaleza Reactiva Patagónica

## Objetivo

Profundizar la credibilidad de la fauna y el contacto visual con el terreno sin convertir el salto gráfico en una carga innecesaria para CPU/GPU. La Patagonia argentina sigue siendo la referencia ecológica y visual del sistema.

## Percepción acústica y cobertura

- Nueva capa `src/percepcion.js` con una firma sonora coherente del jugador.
- La señal considera velocidad, carrera, sigilo, superficie, lluvia y tormenta.
- Agua, madera, hojas y hojarasca delatan más que pasto o nieve.
- La cobertura vegetal reduce principalmente la detección visual y sólo amortigua levemente el oído.
- Pudú, huemul, zorro colorado y guanaco comparten el mismo contrato de percepción.
- Los zorzales también reaccionan al nivel de ruido de aproximación.

## Microconductas

- Los mamíferos pueden entrar primero en escucha/alerta y escanear con la cabeza antes de huir.
- El centinela de la tropilla de guanacos conserva mayor sensibilidad y transmite alarma al grupo.
- El zorro puede detenerse a mirar/escuchar antes de decidir la retirada.

## Contacto con el suelo

- Nueva sombra de contacto barata para pudú, huemul, zorro y guanaco.
- Las sombras son mallas simples, independientes del shadow map global, con `depthWrite` desactivado.
- Los árboles grandes reciben una mancha de contacto instanciada en la unión raíz/suelo.
- La capa de contacto arbórea sólo se dibuja a corta distancia y desaparece con el presupuesto de sotobosque.
- Al despejar vegetación por construcción también se elimina la mancha de contacto asociada.

## Rendimiento

- Las manchas de árboles usan `InstancedMesh` por chunk.
- El detalle de contacto se limita a ~46 m.
- La percepción reutiliza mapas ya cargados de bosque/pasto y no crea raycasts nuevos por animal.
- No se añaden luces dinámicas ni sombras reales adicionales por ejemplar.

## QA

Nueva regresión `pruebas/verificar-naturaleza-reactiva-rc16.mjs`:

- compara carrera ruidosa vs. movimiento agachado;
- verifica enmascaramiento por tormenta;
- comprueba cobertura visual sin sordera artificial;
- confirma percepción compartida en fauna nativa;
- valida microconductas de escucha;
- comprueba sombras de contacto de mamíferos;
- comprueba contacto instanciado de árboles y su presupuesto de distancia.
