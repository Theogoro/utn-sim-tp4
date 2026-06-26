import { Collapse, Table, Tag } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import { StateBadge } from '../state-badge/StateBadge';
import {
  describePcState,
  describeStudentState,
  describeEncargadoState,
  type StateMeaning,
} from '../../utils/stateLabels';

interface LegendRow {
  key: string;
  family: string;
  familyColor: string;
  familySpan: number;
  meaning: StateMeaning;
}

// Una entrada por familia de estados; "SI n" / "DM n" llevan el índice de PC al final.
const GROUPS: {
  family: string;
  color: string;
  codes: string[];
  describe: (code: string) => StateMeaning;
}[] = [
  { family: 'PC', color: 'green', codes: ['L', 'I', 'M'], describe: describePcState },
  {
    family: 'Alumno',
    color: 'blue',
    codes: ['EF', 'SI n', 'EV', 'RECHAZADO'],
    describe: describeStudentState,
  },
  {
    family: 'Encargado',
    color: 'orange',
    codes: ['EM', 'EPC', 'DM n'],
    describe: describeEncargadoState,
  },
];

const rows: LegendRow[] = GROUPS.flatMap((group) =>
  group.codes.map((code, index) => ({
    key: `${group.family}-${code}`,
    family: group.family,
    familyColor: group.color,
    // rowSpan en la primera fila del grupo; las demás se fusionan (0).
    familySpan: index === 0 ? group.codes.length : 0,
    meaning: group.describe(code),
  })),
);

// Eventos del FEL; colores espejados de renderEvent en state-vector-table/renderers.tsx.
interface EventRow {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const EVENT_ROWS: EventRow[] = [
  {
    key: 'inicializacion',
    label: 'Inicialización',
    color: '#475569',
    bgColor: '#f1f5f9',
    borderColor: '#d9e2ec',
    description: 'Estado inicial de la simulación en t = 0; aún no ocurrió ningún evento.',
  },
  {
    key: 'llegada_alumno',
    label: 'Llegada Alumno',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description:
      'Un alumno llega al sistema para inscribirse. Si hay PC libre empieza; si no, espera en cola.',
  },
  {
    key: 'regreso_alumno',
    label: 'Regreso Alumno',
    color: '#0369a1',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    description:
      'Alumno rechazado (más de 5 en cola) que vuelve a intentar la inscripción a los 30 minutos.',
  },
  {
    key: 'inicio_mantenimiento',
    label: 'Inicio Mantenimiento',
    color: '#92400e',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    description: 'El encargado inicia su ciclo de mantenimiento sobre las PCs.',
  },
  {
    key: 'fin_inscripcion',
    label: 'Fin Inscripción',
    color: '#15803d',
    bgColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    description: 'Una PC termina de inscribir a un alumno y queda libre para el siguiente.',
  },
  {
    key: 'fin_mantenimiento',
    label: 'Fin Mantenimiento',
    color: '#b45309',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    description: 'El encargado termina el mantenimiento de una PC, que vuelve a quedar disponible.',
  },
];

const renderEventBadge = (record: EventRow) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: record.bgColor,
      border: `1px solid ${record.borderColor}`,
      color: record.color,
      fontWeight: 600,
      fontSize: '11px',
      fontFamily: 'monospace',
    }}
  >
    {record.label}
  </span>
);

const eventColumns = [
  {
    title: 'Evento',
    dataIndex: 'label',
    width: 180,
    render: (_label: string, record: EventRow) => renderEventBadge(record),
  },
  {
    title: 'Significado',
    dataIndex: 'description',
    key: 'description',
  },
];

const columns = [
  {
    title: 'Entidad',
    dataIndex: 'family',
    width: 120,
    onCell: (record: LegendRow) => ({ rowSpan: record.familySpan }),
    render: (family: string, record: LegendRow) => (
      <Tag color={record.familyColor}>{family}</Tag>
    ),
  },
  {
    title: 'Estado',
    dataIndex: 'meaning',
    width: 120,
    render: (meaning: StateMeaning) => <StateBadge meaning={meaning} />,
  },
  {
    title: 'Significado',
    dataIndex: 'meaning',
    key: 'description',
    render: (meaning: StateMeaning) => meaning.description,
  },
];

/** Leyenda de referencia con todos los estados posibles de la simulación. */
const StateLegend = () => (
  <Collapse
    className="glass-panel"
    defaultActiveKey={['estados']}
    items={[
      {
        key: 'estados',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <TableOutlined style={{ color: 'var(--accent-strong)' }} />
            Estados
          </span>
        ),
        children: (
          <Table<LegendRow>
            dataSource={rows}
            columns={columns}
            rowKey="key"
            size="small"
            pagination={false}
            bordered
          />
        ),
      },
      {
        key: 'eventos',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <TableOutlined style={{ color: 'var(--accent-strong)' }} />
            Eventos
          </span>
        ),
        children: (
          <Table<EventRow>
            dataSource={EVENT_ROWS}
            columns={eventColumns}
            rowKey="key"
            size="small"
            pagination={false}
            bordered
          />
        ),
      },
    ]}
  />
);

export default StateLegend;
