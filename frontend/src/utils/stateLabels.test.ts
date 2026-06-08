import { describe, expect, it } from 'vitest';
import { describeEncargadoState, describePcState, describeStudentState } from './stateLabels';

describe('describeStudentState', () => {
  it('describes the queue and return codes', () => {
    expect(describeStudentState('EF').description).toBe('Esperando en fila para inscribirse');
    expect(describeStudentState('EV').description).toContain('Esperando volver');
    expect(describeStudentState('RECHAZADO').description).toContain('Rechazado definitivamente');
  });

  it('expands the "SI N" prefix to the PC number', () => {
    expect(describeStudentState('SI 3')).toEqual({ label: 'SI 3', description: 'Siendo inscripto en la PC 3' });
  });

  it('falls back for empty or unknown codes', () => {
    expect(describeStudentState('').description).toContain('Recién llegado');
    expect(describeStudentState('???').description).toBe('Estado: ???');
  });
});

describe('describeEncargadoState', () => {
  it('describes the waiting codes', () => {
    expect(describeEncargadoState('EM').description).toContain('próxima ronda');
    expect(describeEncargadoState('EPC').description).toContain('libere una PC');
  });

  it('expands the "DM N" prefix to the PC number', () => {
    expect(describeEncargadoState('DM 2')).toEqual({ label: 'DM 2', description: 'Dando mantenimiento a la PC 2' });
  });
});

describe('describePcState', () => {
  it('maps the short PC codes', () => {
    expect(describePcState('L').description).toBe('Libre');
    expect(describePcState('I').description).toBe('Inscripción en curso');
    expect(describePcState('M').description).toBe('En mantenimiento');
  });
});
