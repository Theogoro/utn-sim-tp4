export interface StateStyle {
  /** Color del texto. */
  color: string;
  /** Color de fondo del chip. */
  background: string;
  /** Color del borde del chip. */
  border: string;
}

export interface StateMeaning extends StateStyle {
  /** Código corto tal como se muestra en el badge (ej. "EF", "SI 3"). */
  label: string;
  /** Texto explicativo para el tooltip. */
  description: string;
}

const MUTED: StateStyle = { color: '#94a3b8', background: '#f8fafc', border: '#e2e8f0' };

// Alumno — familia azul/celeste, un tono por estado.
const STUDENT_FALLBACK: StateStyle = { color: '#1d4ed8', background: '#eff6ff', border: '#bfdbfe' };
const STUDENT_STYLES: Record<string, StateStyle> = {
  EF: { color: '#0369a1', background: '#f0f9ff', border: '#bae6fd' }, // celeste — esperando en fila
  SI: { color: '#1d4ed8', background: '#eff6ff', border: '#bfdbfe' }, // azul — siendo inscripto (prefijo "SI N")
  EV: { color: '#4f46e5', background: '#eef2ff', border: '#c7d2fe' }, // índigo — esperando volver
  RECHAZADO: { color: '#1e3a8a', background: '#e0e7ff', border: '#a5b4fc' }, // azul profundo — rechazado
};

// Encargado — familia naranja, un tono por estado.
const ENCARGADO_FALLBACK: StateStyle = { color: '#b45309', background: '#fffbeb', border: '#fde68a' };
const ENCARGADO_STYLES: Record<string, StateStyle> = {
  EM: { color: '#b45309', background: '#fffbeb', border: '#fde68a' }, // ámbar — esperando ronda
  EPC: { color: '#c2410c', background: '#fff7ed', border: '#fed7aa' }, // naranja — esperando PC
  DM: { color: '#92400e', background: '#fef3c7', border: '#fcd34d' }, // ámbar fuerte — dando mantenimiento (prefijo "DM N")
};

// PC — familia verde semántica (consistente con el gráfico de utilización).
const PC_FALLBACK: StateStyle = { color: '#15803d', background: '#ecfdf5', border: '#bbf7d0' };
const PC_STYLES: Record<string, StateStyle> = {
  L: { color: '#15803d', background: '#ecfdf5', border: '#bbf7d0' }, // verde — libre
  I: { color: '#2563eb', background: '#eff6ff', border: '#bfdbfe' }, // azul — inscripción
  M: { color: '#b45309', background: '#fffbeb', border: '#fde68a' }, // naranja — mantenimiento
};

const STUDENT_STATE_DESCRIPTIONS: Record<string, string> = {
  EF: 'Esperando en fila para inscribirse',
  EV: 'Esperando volver: rechazado por cola llena, reintenta más tarde',
  RECHAZADO: 'Rechazado definitivamente: la cola seguía llena al reintentar',
};

const ENCARGADO_STATE_DESCRIPTIONS: Record<string, string> = {
  EM: 'Esperando la próxima ronda de mantenimiento',
  EPC: 'Esperando que se libere una PC para darle mantenimiento',
};

const PC_STATE_DESCRIPTIONS: Record<string, string> = {
  L: 'Libre',
  I: 'Inscripción en curso',
  M: 'En mantenimiento',
};

const normalize = (state: string | null | undefined): string => (state ?? '').trim();

/** Describe el estado de un alumno (incluye el prefijo "SI N" = siendo inscripto en PC N). */
export const describeStudentState = (state: string | null | undefined): StateMeaning => {
  const code = normalize(state);
  if (!code) return { label: '-', description: 'Recién llegado, sin estado asignado', ...MUTED };
  if (code.startsWith('SI')) {
    const pc = code.slice(2).trim();
    return { label: code, description: `Siendo inscripto en la PC ${pc}`, ...STUDENT_STYLES.SI };
  }
  return {
    label: code,
    description: STUDENT_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}`,
    ...(STUDENT_STYLES[code] ?? STUDENT_FALLBACK),
  };
};

/** Describe el estado del encargado (incluye el prefijo "DM N" = dando mantenimiento a PC N). */
export const describeEncargadoState = (state: string | null | undefined): StateMeaning => {
  const code = normalize(state);
  if (!code) return { label: '-', description: 'Sin estado asignado', ...MUTED };
  if (code.startsWith('DM')) {
    const pc = code.slice(2).trim();
    return { label: code, description: `Dando mantenimiento a la PC ${pc}`, ...ENCARGADO_STYLES.DM };
  }
  return {
    label: code,
    description: ENCARGADO_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}`,
    ...(ENCARGADO_STYLES[code] ?? ENCARGADO_FALLBACK),
  };
};

/** Describe el estado de una PC (L / I / M). */
export const describePcState = (state: string | null | undefined): StateMeaning => {
  const code = normalize(state);
  if (!code) return { label: '-', description: 'Sin estado asignado', ...MUTED };
  return {
    label: code,
    description: PC_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}`,
    ...(PC_STYLES[code] ?? PC_FALLBACK),
  };
};
