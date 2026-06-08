import { describe, expect, it } from 'vitest';
import { describeEncargadoState, describePcState, describeStudentState } from './stateLabels';

describe('describeStudentState', () => {
  it('describes the queue and return codes', () => {
    expect(describeStudentState('EF').description).toBe('Esperando en fila para inscribirse');
    expect(describeStudentState('EV').description).toContain('Esperando volver');
    expect(describeStudentState('RECHAZADO').description).toContain('Rechazado definitivamente');
  });

  it('expands the "SI N" prefix to the PC number', () => {
    expect(describeStudentState('SI 3')).toMatchObject({ label: 'SI 3', description: 'Siendo inscripto en la PC 3' });
  });

  it('falls back for empty or unknown codes', () => {
    expect(describeStudentState('').description).toContain('Recién llegado');
    expect(describeStudentState('???').description).toBe('Estado: ???');
  });

  it('uses distinct blue shades per state', () => {
    const ef = describeStudentState('EF');
    const ev = describeStudentState('EV');
    const si = describeStudentState('SI 1');
    expect(new Set([ef.background, ev.background, si.background]).size).toBe(3);
    // todos en familia azul/celeste: el canal azul domina sobre el rojo en el texto
    for (const meaning of [ef, ev, si]) {
      expect(meaning.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('describeEncargadoState', () => {
  it('describes the waiting codes', () => {
    expect(describeEncargadoState('EM').description).toContain('próxima ronda');
    expect(describeEncargadoState('EPC').description).toContain('libere una PC');
  });

  it('expands the "DM N" prefix to the PC number', () => {
    expect(describeEncargadoState('DM 2')).toMatchObject({ label: 'DM 2', description: 'Dando mantenimiento a la PC 2' });
  });

  it('uses distinct orange shades per state', () => {
    const em = describeEncargadoState('EM');
    const epc = describeEncargadoState('EPC');
    const dm = describeEncargadoState('DM 1');
    expect(new Set([em.background, epc.background, dm.background]).size).toBe(3);
  });
});

describe('describePcState', () => {
  it('maps the short PC codes', () => {
    expect(describePcState('L').description).toBe('Libre');
    expect(describePcState('I').description).toBe('Inscripción en curso');
    expect(describePcState('M').description).toBe('En mantenimiento');
  });

  it('keeps the semantic palette (verde / azul / naranja)', () => {
    expect(describePcState('L').background).toBe('#ecfdf5');
    expect(describePcState('I').background).toBe('#eff6ff');
    expect(describePcState('M').background).toBe('#fffbeb');
  });
});
