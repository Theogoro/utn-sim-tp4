import React from 'react';
import { Table, Button, Space, Card, Typography, Tag, Popconfirm, Tooltip } from 'antd';
import { AreaChartOutlined, DeleteOutlined, CalendarOutlined, LaptopOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const SimulationHistory = ({ simulations, onSelect, onDelete, activeId, loading }) => {
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id) => <strong style={{ color: '#818cf8' }}>#{id}</strong>
    },
    {
      title: 'Fecha Ejecución',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (dateStr) => {
        const date = new Date(dateStr);
        return (
          <Space>
            <CalendarOutlined style={{ color: '#64748b' }} />
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </Space>
        );
      }
    },
    {
      title: 'Duración',
      dataIndex: 'sim_hours',
      key: 'sim_hours',
      render: (hours, record) => {
        const h = hours !== undefined && hours !== null ? hours : record.sim_days * 24;
        return <Tag color="blue">{h % 1 === 0 ? h : h.toFixed(1)} h</Tag>;
      }
    },
    {
      title: 'PCs',
      dataIndex: 'num_pcs',
      key: 'num_pcs',
      render: (pcs) => (
        <Space>
          <LaptopOutlined style={{ color: '#a5b4fc' }} />
          <span>{pcs} PCs</span>
        </Space>
      )
    },
    {
      title: 'Alumnos Arribados',
      dataIndex: 'total_new_students_arrived',
      key: 'total_new_students_arrived',
      render: (count) => count.toLocaleString()
    },
    {
      title: 'Inscripciones',
      dataIndex: 'registrations_completed',
      key: 'registrations_completed',
      render: (count) => count.toLocaleString()
    },
    {
      title: '% Intentos Rech.',
      dataIndex: 'pct_students_returned',
      key: 'pct_students_returned',
      render: (pct) => {
        const color = pct === 0 ? 'green' : pct > 10 ? 'red' : 'orange';
        return <Tag color={color}>{pct.toFixed(2)}%</Tag>;
      }
    },
    {
      title: 'Espera Promedio',
      dataIndex: 'avg_waiting_time',
      key: 'avg_waiting_time',
      render: (secs) => {
        const mins = secs / 60;
        return (
          <Tooltip title={`${secs.toFixed(1)} segundos`}>
            <strong>{mins.toFixed(2)} min</strong>
          </Tooltip>
        );
      }
    },
    {
      title: 'Ocio Prom. Técnico',
      dataIndex: 'avg_technician_idle_time',
      key: 'avg_technician_idle_time',
      render: (secs) => {
        const mins = secs / 60;
        return (
          <Tooltip title={`${secs.toFixed(1)} segundos`}>
            <span>{mins.toFixed(2)} min</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type={activeId === record.id ? 'primary' : 'default'}
            icon={<AreaChartOutlined />}
            onClick={() => onSelect(record.id)}
            style={activeId !== record.id ? { background: 'rgba(255,255,255,0.05)', color: '#f8fafc', borderColor: 'rgba(255,255,255,0.1)' } : {}}
          >
            Detalles
          </Button>
          <Popconfirm
            title="¿Eliminar esta simulación?"
            description="Todos los vectores de estado y datos detallados serán eliminados permanentemente."
            onConfirm={() => onDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              type="text" 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card className="glass-panel" style={{ marginBottom: 24 }}>
      <Title level={3} style={{ margin: 0, color: '#f8fafc', marginBottom: 8 }} className="gradient-title">
        Historial de Simulaciones
      </Title>
      <Paragraph style={{ color: '#94a3b8', marginBottom: 24 }}>
        Lista de ejecuciones realizadas. Haga clic en 'Detalles' para analizar la traza, gráficos de utilización y vectores de estado.
      </Paragraph>

      <Table
        dataSource={simulations}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) => record.id === activeId ? 'active-row' : ''}
        locale={{ emptyText: <span style={{ color: '#64748b' }}>No hay simulaciones registradas. ¡Inicie su primera simulación arriba!</span> }}
      />
    </Card>
  );
};

export default SimulationHistory;
