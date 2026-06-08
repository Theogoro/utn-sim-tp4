import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClockCircleOutlined,
  ExperimentOutlined,
  LaptopOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { SimulationLine } from '../types/simulation';

const { Text } = Typography;

const TABLE_SCROLL = { x: 2800, y: 500 };
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100', '500', '1000'];

type EventStyle = [label: string, color: string, backgroundColor: string, borderColor: string];

const eventStyles: Record<string, EventStyle> = {
  inicializacion: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicialización: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicio: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  start: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicio_mantenimiento: ['Inicio Mantenimiento', '#92400e', '#fffbeb', '#fde68a'],
};

type PcVisual = [statusText: string, ledColor: string, ledGlow: string, border: string, pulseClass: string];

const pcVisuals: Record<string, PcVisual> = {
  idle: ['LIBRE', '#15803d', 'none', '#bbf7d0', ''],
  busy: ['OCUPADO', '#2563eb', 'none', '#bfdbfe', 'led-pulse-blue'],
  maintenance: ['MANTENIMIENTO', '#b45309', 'none', '#fde68a', 'led-pulse-orange'],
  L: ['LIBRE', '#15803d', 'none', '#bbf7d0', ''],
  I: ['INSCRIPCIÓN', '#2563eb', 'none', '#bfdbfe', 'led-pulse-blue'],
  M: ['MANTENIMIENTO', '#b45309', 'none', '#fde68a', 'led-pulse-orange'],
};

const renderMutedMonospace = (val: number | string | null | undefined, isRnd = false, decimals = 4, suffix = ''): ReactNode => {
  if (val === null || val === undefined) return <span style={{ color: '#94a3b8' }}>-</span>;
  const displayVal = typeof val === 'number' ? val.toFixed(decimals) : val;
  return (
    <span style={{
      fontFamily: 'monospace, var(--font-family)',
      color: isRnd ? '#64748b' : '#334155',
      fontSize: '11px',
      fontWeight: isRnd ? '400' : '600'
    }}>
      {displayVal}{suffix}
    </span>
  );
};

const renderEvent = (evt: string): ReactNode => {
  let [label, color, bgColor, borderColor] = eventStyles[evt] || [
    evt,
    '#2563eb',
    '#eff6ff',
    '#bfdbfe',
  ];

  if (evt?.startsWith('fin_inscripcion PC')) {
    label = evt.replace('fin_inscripcion', 'Fin Inscripción');
    color = '#15803d';
    bgColor = '#ecfdf5';
    borderColor = '#bbf7d0';
  } else if (evt?.startsWith('fin_mantenimiento PC')) {
    label = evt.replace('fin_mantenimiento', 'Fin Mantenimiento');
    color = '#b45309';
    bgColor = '#fffbeb';
    borderColor = '#fde68a';
  } else if (evt?.startsWith('llegada_alumno')) {
    label = evt.replace('llegada_alumno', 'Llegada Alumno');
    color = '#2563eb';
    bgColor = '#eff6ff';
    borderColor = '#bfdbfe';
  } else if (evt?.startsWith('regreso_alumno')) {
    label = evt.replace('regreso_alumno', 'Regreso Alumno');
    color = '#0369a1';
    bgColor = '#f0f9ff';
    borderColor = '#bae6fd';
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      color,
      fontWeight: 600,
      fontSize: '11px',
      fontFamily: 'monospace'
    }}>
      {label}
    </span>
  );
};

const renderEncargado = (snapshot: SimulationLine['encargado_snapshot']): ReactNode => {
  if (!snapshot) return renderMutedMonospace(null);
  const pendientes = snapshot.pcs_pendientes_mantenimiento?.length
    ? snapshot.pcs_pendientes_mantenimiento.join(',')
    : '-';
  return (
    <span style={{ color: '#92400e', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
      {snapshot.state} <span style={{ color: '#64748b' }}>pend:</span> {pendientes}
    </span>
  );
};

const renderStudentColumn = (
  students: SimulationLine['active_students_snapshot'],
  getValue: (student: SimulationLine['active_students_snapshot'][number]) => string,
  color = '#1d4ed8',
): ReactNode => {
  if (!students?.length) {
    return <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {students.map(student => (
        <span key={student.id} style={{ color, fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.35, whiteSpace: 'nowrap' }}>
          {getValue(student)}
        </span>
      ))}
    </div>
  );
};

const renderQueueLength = (len: number, limit: number): ReactNode => {
  let color = '#64748b';
  let bgColor = '#f8fafc';
  let border = '1px solid #d9e2ec';

  if (len > 0) {
    if (len >= limit) {
      color = '#b91c1c';
      bgColor = '#fef2f2';
      border = '1px solid #fecaca';
    } else if (len >= limit - 2) {
      color = '#b45309';
      bgColor = '#fffbeb';
      border = '1px solid #fde68a';
    } else {
      color = '#0369a1';
      bgColor = '#f0f9ff';
      border = '1px solid #bae6fd';
    }
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '22px',
      height: '18px',
      padding: '0 5px',
      borderRadius: '4px',
      backgroundColor: bgColor,
      border,
      color,
      fontWeight: '700',
      fontSize: '11px',
      fontFamily: 'monospace'
    }}>
      {len}
    </span>
  );
};

const renderPcStates = (pcStatesStr: string | null | undefined): ReactNode => {
  if (!pcStatesStr) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
      {pcStatesStr.split(',').map((state, i) => {
        const [statusText, ledColor, ledGlow, border, pulseClass] = pcVisuals[state] || pcVisuals.idle;
        return (
          <Tooltip key={i} title={`PC ${i + 1}: ${statusText}`} mouseEnterDelay={0.05}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#ffffff',
              border: `1px solid ${border}`,
              borderRadius: '5px',
              padding: '2px 5px',
              gap: '4px',
              height: '18px',
              boxShadow: 'none'
            }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>
                {i + 1}
              </span>
              <span
                className={pulseClass}
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: ledColor,
                  boxShadow: ledGlow,
                }}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

const createColumns = (queueLimit: number): ColumnsType<SimulationLine> => [
  {
    title: <span style={{ fontSize: '11px', color: '#64748b' }}>Índice</span>,
    dataIndex: 'line_index',
    key: 'line_index',
    width: 75,
    fixed: 'left',
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (idx: number) => <Text style={{ color: '#334155', fontFamily: 'monospace', fontSize: '11px' }}>{idx}</Text>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#334155' }}><SettingOutlined /> Evento</span>,
    dataIndex: 'event_name',
    key: 'event_name',
    width: 210,
    fixed: 'left',
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: renderEvent
  },
  {
    title: <span style={{ fontSize: '11px', color: '#334155' }}><ClockCircleOutlined /> Reloj</span>,
    dataIndex: 'clock_formatted',
    key: 'clock_formatted',
    width: 100,
    fixed: 'left',
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (t: string) => <strong style={{ color: '#1d4ed8', fontFamily: 'monospace', fontSize: '11px' }}>{t}</strong>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#334155' }}><TeamOutlined /> Cola</span>,
    dataIndex: 'queue_length',
    key: 'queue_length',
    width: 75,
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (len: number) => renderQueueLength(len, queueLimit)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#92400e' }}><ToolOutlined /> Encargado</span>,
    dataIndex: 'encargado_snapshot',
    key: 'encargado_snapshot',
    width: 185,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: renderEncargado
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}><TeamOutlined /> Alumno</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_ids',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(students, student => `A${student.id}`)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Estado alumno</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_states',
    width: 145,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(students, student => student.state)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Intentos</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_attempts',
    width: 105,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(students, student => String(student.attempts), '#334155')
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Veces volvió</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_returns',
    width: 120,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(students, student => String(student.times_returned_later), '#334155')
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Espera acum.</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_waiting_time',
    width: 135,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(students, student => `${(student.total_waiting_time / 60).toFixed(2)} min`, '#334155')
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Min. vuelta</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_return_minute',
    width: 125,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(
      students,
      student => student.minuto_vuelta !== null ? student.minuto_vuelta.toFixed(2) : '-',
      '#334155',
    )
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Fila desde</span>,
    dataIndex: 'active_students_snapshot',
    key: 'student_queue_since',
    width: 125,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (students: SimulationLine['active_students_snapshot']) => renderStudentColumn(
      students,
      student => student.esperando_en_fila_desde !== null ? student.esperando_en_fila_desde.toFixed(2) : '-',
      '#334155',
    )
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}><ExperimentOutlined /> RND Lleg.</span>,
    dataIndex: 'student_rnd',
    key: 'student_rnd',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val: number | null) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Tpo Llegada (min)</span>,
    dataIndex: 'student_arrival_time',
    key: 'student_arrival_time',
    width: 135,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Próx. Llegada</span>,
    dataIndex: 'student_next_arrival_time',
    key: 'student_next_arrival_time',
    width: 115,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val: number | null) => val !== null ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1d4ed8' }}>{new Date(val * 1000).toISOString().substr(11, 8)}</span> : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Alumnos Rech.</span>,
    dataIndex: 'total_students_returned',
    key: 'total_students_returned',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val: number) => val > 0 ? <span style={{ color: '#b91c1c', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }}>{val}</span> : <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>0</span>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#166534' }}><LaptopOutlined /> Servidores</span>,
    dataIndex: 'pc_states',
    key: 'pc_states',
    width: 175,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: renderPcStates
  },
  {
    title: <span style={{ fontSize: '11px', color: '#166534' }}><ExperimentOutlined /> RND Insc.</span>,
    dataIndex: 'registration_rnd',
    key: 'registration_rnd',
    width: 105,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val: number | null) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#166534' }}>Tpo Insc. (min)</span>,
    dataIndex: 'registration_time',
    key: 'registration_time',
    width: 120,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#166534' }}>Insc. Comp.</span>,
    dataIndex: 'registrations_completed',
    key: 'registrations_completed',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val: number) => <Text style={{ color: '#15803d', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }}>{val}</Text>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#92400e' }}><ExperimentOutlined /> RND Mant.</span>,
    dataIndex: 'maintenance_rnd',
    key: 'maintenance_rnd',
    width: 105,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val: number | null) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#92400e' }}>Tpo Mant. (min)</span>,
    dataIndex: 'maintenance_time',
    key: 'maintenance_time',
    width: 120,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#92400e' }}><ExperimentOutlined /> RND Regreso Téc.</span>,
    dataIndex: 'technician_return_rnd',
    key: 'technician_return_rnd',
    width: 135,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val: number | null) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#92400e' }}>Tpo Regreso Téc. (min)</span>,
    dataIndex: 'technician_return_time',
    key: 'technician_return_time',
    width: 145,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  }
];

interface StateVectorTableProps {
  lines: SimulationLine[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  queueLimit: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const StateVectorTable = ({
  lines,
  loading,
  page,
  pageSize,
  total,
  queueLimit,
  onPageChange,
}: StateVectorTableProps) => {
  const columns = useMemo(() => createColumns(queueLimit || 5), [queueLimit]);

  return (
    <>
      <Table
        virtual
        dataSource={lines}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={TABLE_SCROLL}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: onPageChange,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />
    </>
  );
};

export default StateVectorTable;
