import { useMemo } from 'react';
import { Table, Button, Space, Card, Tag, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AreaChartOutlined,
  DeleteOutlined,
  CalendarOutlined,
  LaptopOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import type { SimulationSummary } from '../types/simulation';

interface SimulationHistoryProps {
  simulations: SimulationSummary[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void | Promise<void>;
  activeId: number | null;
  loading: boolean;
}

const SimulationHistory = ({ simulations, onSelect, onDelete, activeId, loading }: SimulationHistoryProps) => {
  const summary = useMemo(() => {
    if (!simulations.length) {
      return { runs: 0, totalRegs: 0, avgRejected: 0, avgWait: 0 };
    }
    const totalRegs = simulations.reduce((a, s) => a + (s.registrations_completed || 0), 0);
    const avgRejected = simulations.reduce((a, s) => a + (s.pct_students_returned || 0), 0) / simulations.length;
    const avgWait = simulations.reduce((a, s) => a + (s.avg_waiting_time || 0), 0) / simulations.length / 60;
    return { runs: simulations.length, totalRegs, avgRejected, avgWait };
  }, [simulations]);

  const columns: ColumnsType<SimulationSummary> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => (
        <span style={{ color: '#2563eb', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>#{id}</span>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr: string) => {
        const date = new Date(dateStr);
        return (
          <Space size={6}>
            <CalendarOutlined style={{ color: '#64748b' }} />
            <span style={{ color: '#334155' }}>
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Duración',
      dataIndex: 'sim_hours',
      key: 'sim_hours',
      render: (hours: number, record) => {
        const h = hours !== undefined && hours !== null ? hours : record.sim_days * 24;
        return <Tag color="blue" style={{ margin: 0 }}>{h % 1 === 0 ? h : h.toFixed(1)} h</Tag>;
      },
    },
    {
      title: 'PCs',
      dataIndex: 'num_pcs',
      key: 'num_pcs',
      render: (pcs: number) => (
        <Space size={6}>
          <LaptopOutlined style={{ color: '#2563eb' }} />
          <span>{pcs}</span>
        </Space>
      ),
    },
    {
      title: 'Arribados',
      dataIndex: 'total_new_students_arrived',
      key: 'total_new_students_arrived',
      render: (count: number) => <span className="mono" style={{ color: '#334155' }}>{count.toLocaleString()}</span>,
    },
    {
      title: 'Inscripciones',
      dataIndex: 'registrations_completed',
      key: 'registrations_completed',
      render: (count: number) => (
        <span className="mono" style={{ color: '#15803d', fontWeight: 600 }}>{count.toLocaleString()}</span>
      ),
    },
    {
      title: '% Rech.',
      dataIndex: 'pct_students_returned',
      key: 'pct_students_returned',
      render: (pct: number) => {
        const color = pct === 0 ? 'green' : pct > 10 ? 'red' : 'orange';
        return <Tag color={color} style={{ margin: 0 }}>{pct.toFixed(2)}%</Tag>;
      },
    },
    {
      title: 'Espera prom.',
      dataIndex: 'avg_waiting_time',
      key: 'avg_waiting_time',
      render: (secs: number) => (
        <Tooltip title={`${secs.toFixed(1)} segundos`}>
          <span className="mono" style={{ color: '#0f172a', fontWeight: 600 }}>{(secs / 60).toFixed(2)} min</span>
        </Tooltip>
      ),
    },
    {
      title: 'Ocio téc.',
      dataIndex: 'avg_technician_idle_time',
      key: 'avg_technician_idle_time',
      render: (secs: number) => (
        <Tooltip title={`${secs.toFixed(1)} segundos`}>
          <span className="mono" style={{ color: '#334155' }}>{(secs / 60).toFixed(2)} min</span>
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button
            type={activeId === record.id ? 'primary' : 'default'}
            icon={<AreaChartOutlined />}
            onClick={() => onSelect(record.id)}
            size="small"
            style={
              activeId !== record.id
                ? { background: '#ffffff', color: '#334155', borderColor: '#d9e2ec' }
                : {}
            }
          >
            {activeId === record.id ? 'Activa' : 'Detalles'}
          </Button>
          <Popconfirm
            title="¿Eliminar esta simulación?"
            description="Se borrarán también los vectores de estado y datos detallados."
            onConfirm={() => onDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger type="text" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="glass-panel" style={{ marginBottom: 24 }}>
      <div className="section-heading">
        <DatabaseOutlined /> Historial
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', letterSpacing: 0 }}>
            Simulaciones realizadas
          </div>
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Compare corridas y abra el análisis detallado de cualquier ejecución.
          </div>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">Corridas</div>
          <div className="stat-value">{summary.runs}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><CheckCircleOutlined style={{ color: '#15803d', marginRight: 6 }} />Inscripciones totales</div>
          <div className="stat-value" style={{ color: '#15803d' }}>{summary.totalRegs.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-label"><UserDeleteOutlined style={{ color: '#b45309', marginRight: 6 }} />% rechazos (prom.)</div>
          <div className="stat-value" style={{ color: summary.avgRejected > 0 ? '#b45309' : '#334155' }}>
            {summary.avgRejected.toFixed(2)}%
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Espera prom. global</div>
          <div className="stat-value">{summary.avgWait.toFixed(2)} <span style={{ fontSize: 12, color: '#64748b' }}>min</span></div>
        </div>
      </div>

      <Table
        dataSource={simulations}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) => (record.id === activeId ? 'active-row' : '')}
        locale={{
          emptyText: (
            <span style={{ color: '#64748b' }}>
              No hay simulaciones registradas. Ejecute una corrida desde el formulario superior.
            </span>
          ),
        }}
      />
    </Card>
  );
};

export default SimulationHistory;
