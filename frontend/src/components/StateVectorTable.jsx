import React, { useMemo } from 'react';
import { Alert, Table, Tooltip, Typography } from 'antd';
import {
  ClockCircleOutlined,
  ExperimentOutlined,
  LaptopOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const TABLE_SCROLL = { x: 2200, y: 500 };
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100', '500', '1000'];

const eventStyles = {
  inicializacion: ['Inicialización', '#94a3b8', 'rgba(148, 163, 184, 0.08)', 'rgba(148, 163, 184, 0.25)'],
  inicialización: ['Inicialización', '#94a3b8', 'rgba(148, 163, 184, 0.08)', 'rgba(148, 163, 184, 0.25)'],
  inicio: ['Inicialización', '#94a3b8', 'rgba(148, 163, 184, 0.08)', 'rgba(148, 163, 184, 0.25)'],
  start: ['Inicialización', '#94a3b8', 'rgba(148, 163, 184, 0.08)', 'rgba(148, 163, 184, 0.25)'],
  student_arrival: ['Llegada Alumno', '#c084fc', 'rgba(192, 132, 252, 0.08)', 'rgba(192, 132, 252, 0.25)'],
  student_return: ['Retorno Alumno', '#22d3ee', 'rgba(34, 211, 238, 0.08)', 'rgba(34, 211, 238, 0.25)'],
  technician_arrival: ['Llegada Técnico', '#fbbf24', 'rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.25)'],
  maintenance_complete: ['Fin Mantenimiento', '#f97316', 'rgba(249, 115, 22, 0.08)', 'rgba(249, 115, 22, 0.25)'],
};

const pcVisuals = {
  idle: ['LIBRE', '#10b981', '0 0 6px rgba(16, 185, 129, 0.75)', 'rgba(16, 185, 129, 0.15)', ''],
  busy: ['OCUPADO', '#3b82f6', '0 0 8px rgba(59, 130, 246, 0.85), 0 0 15px rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.2)', 'led-pulse-blue'],
  maintenance: ['MANTENIMIENTO', '#f59e0b', '0 0 8px rgba(245, 158, 11, 0.85), 0 0 15px rgba(245, 158, 11, 0.4)', 'rgba(245, 158, 11, 0.25)', 'led-pulse-orange'],
};

const renderMutedMonospace = (val, isRnd = false, decimals = 4, suffix = '') => {
  if (val === null || val === undefined) return <span style={{ color: '#475569' }}>-</span>;
  const displayVal = typeof val === 'number' ? val.toFixed(decimals) : val;
  return (
    <span style={{
      fontFamily: 'monospace, var(--font-family)',
      color: isRnd ? '#64748b' : '#94a3b8',
      fontSize: '11px',
      fontWeight: isRnd ? '400' : '600'
    }}>
      {displayVal}{suffix}
    </span>
  );
};

const renderEvent = (evt) => {
  let [label, color, bgColor, borderColor] = eventStyles[evt] || [
    evt,
    '#a855f7',
    'rgba(168, 85, 247, 0.08)',
    'rgba(168, 85, 247, 0.2)',
  ];

  if (evt?.startsWith('registration_complete_pc')) {
    label = `Fin Inscripción PC ${evt.replace('registration_complete_pc', '')}`;
    color = '#34d399';
    bgColor = 'rgba(52, 211, 153, 0.08)';
    borderColor = 'rgba(52, 211, 153, 0.25)';
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
      textShadow: `0 0 6px ${borderColor}`,
      fontFamily: 'monospace'
    }}>
      {label}
    </span>
  );
};

const renderQueueLength = (len, limit) => {
  let color = '#94a3b8';
  let bgColor = 'rgba(148, 163, 184, 0.05)';
  let border = '1px solid rgba(148, 163, 184, 0.12)';

  if (len > 0) {
    if (len >= limit) {
      color = '#f87171';
      bgColor = 'rgba(248, 113, 113, 0.12)';
      border = '1px solid rgba(248, 113, 113, 0.35)';
    } else if (len >= limit - 2) {
      color = '#fb923c';
      bgColor = 'rgba(251, 146, 60, 0.08)';
      border = '1px solid rgba(251, 146, 60, 0.25)';
    } else {
      color = '#38bdf8';
      bgColor = 'rgba(56, 189, 248, 0.06)';
      border = '1px solid rgba(56, 189, 248, 0.18)';
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

const renderPcStates = (pcStatesStr) => {
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
              background: 'rgba(9, 13, 22, 0.65)',
              border: `1px solid ${border}`,
              borderRadius: '5px',
              padding: '2px 5px',
              gap: '4px',
              height: '18px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
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

const createColumns = (queueLimit) => [
  {
    title: <span style={{ fontSize: '11px', color: '#64748b' }}>Fila</span>,
    dataIndex: 'line_index',
    key: 'line_index',
    width: 75,
    fixed: 'left',
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (idx) => <Text style={{ color: '#475569', fontFamily: 'monospace', fontSize: '11px' }}>{idx}</Text>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#cbd5e1' }}><ClockCircleOutlined /> Reloj</span>,
    dataIndex: 'clock_formatted',
    key: 'clock_formatted',
    width: 100,
    fixed: 'left',
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (t) => <strong style={{ color: '#c084fc', fontFamily: 'monospace', fontSize: '11px' }}>{t}</strong>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#cbd5e1' }}><SettingOutlined /> Evento</span>,
    dataIndex: 'event_name',
    key: 'event_name',
    width: 210,
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: renderEvent
  },
  {
    title: <span style={{ fontSize: '11px', color: '#cbd5e1' }}><TeamOutlined /> Cola</span>,
    dataIndex: 'queue_length',
    key: 'queue_length',
    width: 75,
    onHeaderCell: () => ({ className: 'header-col-general' }),
    render: (len) => renderQueueLength(len, queueLimit)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#c7d2fe' }}><ExperimentOutlined /> RND Lleg.</span>,
    dataIndex: 'student_rnd',
    key: 'student_rnd',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#c7d2fe' }}>Tpo Llegada (min)</span>,
    dataIndex: 'student_arrival_time',
    key: 'student_arrival_time',
    width: 135,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#c7d2fe' }}>Próx. Llegada</span>,
    dataIndex: 'student_next_arrival_time',
    key: 'student_next_arrival_time',
    width: 115,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val) => val !== null ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c084fc' }}>{new Date(val * 1000).toISOString().substr(11, 8)}</span> : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#c7d2fe' }}>Alumnos Rech.</span>,
    dataIndex: 'total_students_returned',
    key: 'total_students_returned',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-students' }),
    onCell: () => ({ className: 'cell-col-students' }),
    render: (val) => val > 0 ? <span style={{ color: '#f87171', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }}>{val}</span> : <span style={{ color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>0</span>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#a7f3d0' }}><LaptopOutlined /> Servidores (LED)</span>,
    dataIndex: 'pc_states',
    key: 'pc_states',
    width: 175,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: renderPcStates
  },
  {
    title: <span style={{ fontSize: '11px', color: '#a7f3d0' }}><ExperimentOutlined /> RND Insc.</span>,
    dataIndex: 'registration_rnd',
    key: 'registration_rnd',
    width: 105,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Tpo Insc. (min)</span>,
    dataIndex: 'registration_time',
    key: 'registration_time',
    width: 120,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Insc. Comp.</span>,
    dataIndex: 'registrations_completed',
    key: 'registrations_completed',
    width: 110,
    onHeaderCell: () => ({ className: 'header-col-computers' }),
    onCell: () => ({ className: 'cell-col-computers' }),
    render: (val) => <Text style={{ color: '#34d399', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }}>{val}</Text>
  },
  {
    title: <span style={{ fontSize: '11px', color: '#fde68a' }}><ExperimentOutlined /> RND Mant.</span>,
    dataIndex: 'maintenance_rnd',
    key: 'maintenance_rnd',
    width: 105,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#fde68a' }}>Tpo Mant. (min)</span>,
    dataIndex: 'maintenance_time',
    key: 'maintenance_time',
    width: 120,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#fde68a' }}><ExperimentOutlined /> RND Regreso Téc.</span>,
    dataIndex: 'technician_return_rnd',
    key: 'technician_return_rnd',
    width: 135,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val) => renderMutedMonospace(val, true, 4)
  },
  {
    title: <span style={{ fontSize: '11px', color: '#fde68a' }}>Tpo Regreso Téc. (min)</span>,
    dataIndex: 'technician_return_time',
    key: 'technician_return_time',
    width: 145,
    onHeaderCell: () => ({ className: 'header-col-maintenance' }),
    onCell: () => ({ className: 'cell-col-maintenance' }),
    render: (val) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : renderMutedMonospace(null)
  }
];

const StateVectorTable = ({
  lines,
  loading,
  page,
  pageSize,
  total,
  queueLimit,
  onPageChange,
}) => {
  const columns = useMemo(() => createColumns(queueLimit || 5), [queueLimit]);

  return (
    <>
      <Alert
        message="Registro Detallado del Vector de Estados (Traza FEL)"
        description="La tabla usa paginación desde SQLite y virtualización en el navegador para mantener fluido el scroll incluso con páginas grandes."
        type="info"
        showIcon
        style={{ marginBottom: 16, backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      />

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
