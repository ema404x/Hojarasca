// 4.28.0: el nivel «Ultra» de los gráficos. No es un nivel más de `calidad` (muchas partes preguntan `calidad === 'alta'`):
// es un ajuste aparte (`ajustes.ultra`) que sólo vale con la calidad en Alta. Todo efecto o programa de shader nuevo
// de Ultra se prende sólo si `esUltra(ajustes)`; con Ultra apagado, Alta, Media y Baja quedan exactamente como antes.
export function esUltra(a) { return !!a && a.ultra === true && a.calidad === 'alta'; }
