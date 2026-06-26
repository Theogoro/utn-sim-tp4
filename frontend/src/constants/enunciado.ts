// Texto del enunciado del TP (fuente: README.md). Centralizado para reutilizar en UI.

export const ENUNCIADO_TITLE = 'Inscripción a exámenes UTN';

export const ENUNCIADO_PARAGRAPHS: string[] = [
  'Sea un lugar de inscripción a exámenes para alumnos de la UNVM, existen 6 equipos para inscribirse y la inscripción demora de 5 a 8 minutos uniformemente distribuida. Los alumnos llegan para inscribirse con una distribución exponencial negativa de media 2′.',
  'Una persona de sistemas hace mantenimiento preventivo a cada computadora, empezando por la primera que esté libre (si hay varias, elige cualquiera), luego a otra y así sucesivamente, demorando un tiempo en cada equipo entre 3′ y 10′. Tiene prioridad sobre los alumnos pero no interrumpe la inscripción. Esta persona regresa a hacer el mantenimiento en 1 hora ± 3′ desde que finalizó el mantenimiento de la última máquina.',
  'Si un alumno llega y hay más de 5 alumnos esperando, se va y regresa a la media hora.',
];

export const ENUNCIADO_OBJETIVOS: string[] = [
  'Determinar el % de alumnos que se van para regresar más tarde.',
  'Determinar el tiempo promedio de espera de los alumnos (solo los que hicieron cola).',
  'Determinar el promedio de tiempo ocioso del personal de sistemas por vez que va a la sala de inscripción a realizar su tarea.',
];

export interface EnunciadoParam {
  label: string;
  value: string;
}

export const ENUNCIADO_PARAMS: EnunciadoParam[] = [
  { label: 'Cantidad de equipos', value: '6' },
  { label: 'Tiempo de inscripción (servicio)', value: 'Uniforme entre 5′ y 8′' },
  { label: 'Tiempo entre llegadas de alumnos', value: 'Exponencial negativa, media 2′' },
  { label: 'Tiempo de mantenimiento por equipo', value: 'Uniforme entre 3′ y 10′' },
  { label: 'Frecuencia de regreso del técnico', value: '1 hora ± 3′ desde el último mantenimiento' },
  { label: 'Umbral de espera del alumno', value: '> 5 esperando → se va y regresa en 30′' },
];
