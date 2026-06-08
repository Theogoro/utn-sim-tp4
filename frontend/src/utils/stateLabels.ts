export interface StateMeaning {
  /** Código corto tal como se muestra en el badge (ej. "EF", "SI 3"). */
  label: string;
  /** Texto explicativo para el tooltip. */
  description: string;
}

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
  if (!code) return { label: '-', description: 'Recién llegado, sin estado asignado' };
  if (code.startsWith('SI')) {
    const pc = code.slice(2).trim();
    return { label: code, description: `Siendo inscripto en la PC ${pc}` };
  }
  return { label: code, description: STUDENT_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}` };
};

/** Describe el estado del encargado (incluye el prefijo "DM N" = dando mantenimiento a PC N). */
export const describeEncargadoState = (state: string | null | undefined): StateMeaning => {
  const code = normalize(state);
  if (!code) return { label: '-', description: 'Sin estado asignado' };
  if (code.startsWith('DM')) {
    const pc = code.slice(2).trim();
    return { label: code, description: `Dando mantenimiento a la PC ${pc}` };
  }
  return { label: code, description: ENCARGADO_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}` };
};

/** Describe el estado de una PC (L / I / M). */
export const describePcState = (state: string | null | undefined): StateMeaning => {
  const code = normalize(state);
  if (!code) return { label: '-', description: 'Sin estado asignado' };
  return { label: code, description: PC_STATE_DESCRIPTIONS[code] ?? `Estado: ${code}` };
};
