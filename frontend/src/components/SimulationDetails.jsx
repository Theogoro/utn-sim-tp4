import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Space, Tooltip, Empty, Alert, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  CheckCircleOutlined, 
  HourglassOutlined, 
  UserDeleteOutlined, 
  ToolOutlined, 
  TrophyOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const SimulationDetails = ({ simulationId }) => {
  const [simulation, setSimulation] = useState(null);
  const [lines, setLines] = useState([]);
  const [totalLines, setTotalLines] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [pcUtilization, setPcUtilization] = useState([]);

  const API_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (simulationId) {
      fetchDetails();
      fetchPcStats();
      setPage(1); // Reset to page 1 for new simulation
    }
  }, [simulationId]);

  useEffect(() => {
    if (simulationId) {
      fetchLines();
    }
  }, [simulationId, page, pageSize]);

  const fetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${API_URL}/simulations/${simulationId}`);
      setSimulation(res.data);
    } catch (err) {
      console.error("Error fetching simulation details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchPcStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/simulations/${simulationId}/pc_stats`);
      
      // Transform raw busy/maint/idle times (seconds) into percentages for Recharts
      const transformed = res.data.map(pc => {
        const total = pc.busy_time + pc.maintenance_time + pc.idle_time;
        return {
          name: `PC ${pc.id}`,
          'Ocupado (%)': total > 0 ? parseFloat(((pc.busy_time / total) * 100).toFixed(1)) : 0,
          'Mantenimiento (%)': total > 0 ? parseFloat(((pc.maintenance_time / total) * 100).toFixed(1)) : 0,
          'Libre (%)': total > 0 ? parseFloat(((pc.idle_time / total) * 100).toFixed(1)) : 0,
        };
      });
      setPcUtilization(transformed);
    } catch (err) {
      console.error("Error fetching PC utilization", err);
    }
  };

  const fetchLines = async () => {
    setLoadingLines(true);
    try {
      const res = await axios.get(`${API_URL}/simulations/${simulationId}/lines`, {
        params: { page, limit: pageSize }
      });
      setLines(res.data.items);
      setTotalLines(res.data.total);
    } catch (err) {
      console.error("Error fetching simulation lines", err);
    } finally {
      setLoadingLines(false);
    }
  };

  if (!simulationId) {
    return (
      <Card className="glass-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Empty 
          description={
            <span style={{ color: '#94a3b8' }}>
              Seleccione una simulación en el historial superior para cargar el análisis detallado.
            </span>
          } 
        />
      </Card>
    );
  }

  if (loadingDetails && !simulation) {
    return (
      <Card className="glass-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <Paragraph style={{ color: '#94a3b8', marginTop: 16 }}>Cargando análisis de la simulación...</Paragraph>
      </Card>
    );
  }

  if (!simulation) return null;

  // Render PC statuses color-coded
  const renderPcStates = (pcStatesStr) => {
    if (!pcStatesStr) return null;
    const states = pcStatesStr.split(',');
    return (
      <Space size={4}>
        {states.map((st, i) => {
          let color = 'rgba(74, 222, 128, 0.2)'; // idle light green
          let borderColor = '#4ade80';
          let textColor = '#4ade80';
          let label = 'I';
          
          if (st === 'busy' || st === 'B') {
            color = 'rgba(96, 165, 250, 0.2)'; // busy blue
            borderColor = '#60a5fa';
            textColor = '#60a5fa';
            label = 'B';
          } else if (st === 'maintenance' || st === 'M') {
            color = 'rgba(251, 146, 60, 0.2)'; // maint orange
            borderColor = '#fb923c';
            textColor = '#fb923c';
            label = 'M';
          }
          
          return (
            <Tooltip key={i} title={`PC ${i + 1}: ${st.toUpperCase()}`}>
              <span style={{ 
                display: 'inline-block',
                width: 20,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 'bold',
                borderRadius: 4,
                backgroundColor: color,
                border: `1px solid ${borderColor}`,
                color: textColor,
                cursor: 'help'
              }}>
                {label}
              </span>
            </Tooltip>
          );
        })}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Fila',
      dataIndex: 'line_index',
      key: 'line_index',
      width: 80,
      fixed: 'left',
      render: (idx) => <Text style={{ color: '#64748b' }}>{idx}</Text>
    },
    {
      title: 'Reloj',
      dataIndex: 'clock_formatted',
      key: 'clock_formatted',
      width: 90,
      fixed: 'left',
      render: (t) => <strong style={{ color: '#c084fc' }}>{t}</strong>
    },
    {
      title: 'Evento',
      dataIndex: 'event_name',
      key: 'event_name',
      width: 220,
      render: (evt) => {
        let evtTranslated = evt;
        if (evt === 'student_arrival') evtTranslated = 'Llegada de Alumno';
        else if (evt === 'technician_arrival') evtTranslated = 'Llegada de Técnico';
        else if (evt === 'maintenance_complete') evtTranslated = 'Fin Mantenimiento';
        else if (evt === 'student_return') evtTranslated = 'Retorno de Alumno';
        else if (evt.startsWith('registration_complete_pc')) {
          const pcNum = evt.replace('registration_complete_pc', '');
          evtTranslated = `Fin Inscripción PC ${pcNum}`;
        }
        return <Text style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{evtTranslated}</Text>;
      }
    },
    {
      title: 'Cola',
      dataIndex: 'queue_length',
      key: 'queue_length',
      width: 80,
      render: (len) => {
        const color = len > 5 ? '#f87171' : len > 3 ? '#fb923c' : '#f8fafc';
        return <strong style={{ color }}>{len}</strong>;
      }
    },
    {
      title: 'Estado de PCs',
      dataIndex: 'pc_states',
      key: 'pc_states',
      width: 170,
      render: (states) => renderPcStates(states)
    },
    {
      title: 'RND Llegada',
      dataIndex: 'student_rnd',
      key: 'student_rnd',
      width: 110,
      render: (val) => val !== null ? val.toFixed(4) : ''
    },
    {
      title: 'Tpo Llegada',
      dataIndex: 'student_arrival_time',
      key: 'student_arrival_time',
      width: 130,
      render: (val) => val !== null ? `${val.toFixed(1)}s` : ''
    },
    {
      title: 'Próx. Llegada',
      dataIndex: 'student_next_arrival_time',
      key: 'student_next_arrival_time',
      width: 120,
      render: (val) => val !== null ? new Date(val * 1000).toISOString().substr(11, 8) : ''
    },
    {
      title: 'RND Insc.',
      dataIndex: 'registration_rnd',
      key: 'registration_rnd',
      width: 110,
      render: (val) => val !== null ? val.toFixed(4) : ''
    },
    {
      title: 'Tpo Insc.',
      dataIndex: 'registration_time',
      key: 'registration_time',
      width: 120,
      render: (val) => val !== null ? `${val.toFixed(1)}s` : ''
    },
    {
      title: 'RND Mant.',
      dataIndex: 'maintenance_rnd',
      key: 'maintenance_rnd',
      width: 110,
      render: (val) => val !== null ? val.toFixed(4) : ''
    },
    {
      title: 'Tpo Mant.',
      dataIndex: 'maintenance_time',
      key: 'maintenance_time',
      width: 120,
      render: (val) => val !== null ? `${val.toFixed(1)}s` : ''
    },
    {
      title: 'RND Regreso Téc.',
      dataIndex: 'technician_return_rnd',
      key: 'technician_return_rnd',
      width: 130,
      render: (val) => val !== null ? val.toFixed(4) : ''
    },
    {
      title: 'Tpo Regreso Téc.',
      dataIndex: 'technician_return_time',
      key: 'technician_return_time',
      width: 130,
      render: (val) => val !== null ? `${val.toFixed(1)}s` : ''
    },
    {
      title: 'Insc. Comp.',
      dataIndex: 'registrations_completed',
      key: 'registrations_completed',
      width: 120,
      render: (val) => <Text style={{ color: '#4ade80', fontWeight: 'bold' }}>{val}</Text>
    },
    {
      title: 'Alumnos Rech.',
      dataIndex: 'total_students_returned',
      key: 'total_students_returned',
      width: 120,
      render: (val) => val > 0 ? <Text style={{ color: '#f87171', fontWeight: 'bold' }}>{val}</Text> : '0'
    }
  ];

  return (
    <div style={{ marginTop: 24 }}>
      {/* 1. KPI Panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={4}>
          <div className="kpi-card glass-panel" style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 13 }}>Inscripciones Comp.</span>}
              value={simulation.registrations_completed}
              valueStyle={{ color: '#4ade80', fontWeight: 700 }}
              prefix={<CheckCircleOutlined style={{ marginRight: 6 }} />}
            />
            <Text style={{ fontSize: 11, color: '#64748b' }}>Inscripciones exitosas</Text>
          </div>
        </Col>

        <Col xs={12} sm={12} md={5}>
          <div className="kpi-card glass-panel" style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 13 }}>Espera Prom. Alumno</span>}
              value={simulation.avg_waiting_time / 60}
              precision={2}
              valueStyle={{ color: '#c084fc', fontWeight: 700 }}
              prefix={<HourglassOutlined style={{ marginRight: 6 }} />}
              suffix=" min"
            />
            <Text style={{ fontSize: 11, color: '#64748b' }}>{(simulation.avg_waiting_time).toFixed(1)}s por alumno en cola</Text>
          </div>
        </Col>

        <Col xs={12} sm={12} md={5}>
          <div className="kpi-card glass-panel" style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 13 }}>% Alumnos Rechazados</span>}
              value={simulation.pct_students_returned}
              precision={2}
              valueStyle={{ color: simulation.pct_students_returned > 0 ? '#fb923c' : '#4ade80', fontWeight: 700 }}
              prefix={<UserDeleteOutlined style={{ marginRight: 6 }} />}
              suffix="%"
            />
            <Text style={{ fontSize: 11, color: '#64748b' }}>
              {simulation.total_students_returned} de {simulation.total_new_students_arrived} se retiraron
            </Text>
          </div>
        </Col>

        <Col xs={12} sm={12} md={5}>
          <div className="kpi-card glass-panel" style={{ height: '100%' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 13 }}>Ocio Prom. Técnico</span>}
              value={simulation.avg_technician_idle_time / 60}
              precision={2}
              valueStyle={{ color: '#a5b4fc', fontWeight: 700 }}
              prefix={<ToolOutlined style={{ marginRight: 6 }} />}
              suffix=" min"
            />
            <Text style={{ fontSize: 11, color: '#64748b' }}>{(simulation.avg_technician_idle_time).toFixed(1)}s por visita</Text>
          </div>
        </Col>

        <Col xs={24} sm={24} md={5}>
          <div className="kpi-card glass-panel" style={{ height: '100%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 26, 46, 0.5) 100%)' }}>
            <Statistic
              title={<span style={{ color: '#a5b4fc', fontSize: 13 }}>Visitas Técnico</span>}
              value={simulation.total_technician_visits}
              valueStyle={{ color: '#818cf8', fontWeight: 700 }}
              prefix={<TrophyOutlined style={{ marginRight: 6 }} />}
            />
            <Text style={{ fontSize: 11, color: '#818cf8' }}>Rondas de mantenimiento</Text>
          </div>
        </Col>
      </Row>

      {/* 2. Charts and Parameters */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card className="glass-panel" title={<span style={{ color: '#f8fafc' }}>Estadísticas de Utilización de Computadoras</span>}>
            {pcUtilization.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={pcUtilization}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="Ocupado (%)" stackId="a" fill="#60a5fa" />
                    <Bar dataKey="Mantenimiento (%)" stackId="a" fill="#fb923c" />
                    <Bar dataKey="Libre (%)" stackId="a" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="No hay estadísticas de utilización disponibles" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="glass-panel" title={<span style={{ color: '#f8fafc' }}>Configuración Simulación</span>} style={{ height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 8px', fontSize: 13 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>INFRAESTRUCTURA</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.num_pcs} computadoras</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>TIEMPO SIMULADO</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.sim_hours || (simulation.sim_days * 24)} horas</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>INSCRIPCIÓN MÍN/MÁX</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.min_enrollment} min - {simulation.max_enrollment} min</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>LLEGADAS (MEDIA)</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.mean_arrival_time} min</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>MANTENIMIENTO MÍN/MÁX</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.min_maintenance_time} min - {simulation.max_maintenance_time} min</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>FRECUENCIA REGRESO TÉC.</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.mean_technician_return_time} min &plusmn; {simulation.technician_return_time_variation} min</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>LÍMITE DE COLA</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.student_wait_threshold} alumnos</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>DEMORA DE RETORNO</Text>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{simulation.student_return_time} min</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Detailed Vector State Table */}
      <Card className="glass-panel" title={<span style={{ color: '#f8fafc' }}>Explorador de Vector de Estados</span>}>
        <Alert 
          message="Registro Detallado del Vector de Estados (Traza FEL)"
          description="A continuación se presenta el paso a paso del vector de estados de la simulación. Coloque el cursor sobre el estado de cada Computadora (I: Libre, B: Ocupada, M: Mantenimiento) para ver detalles de cada equipo. La tabla se carga de manera paginada desde la base de datos SQLite para optimizar el rendimiento."
          type="info"
          showIcon
          style={{ marginBottom: 16, backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        />
        
        <Table
          dataSource={lines}
          columns={columns}
          rowKey="id"
          loading={loadingLines}
          scroll={{ x: 2200, y: 500 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: totalLines,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>
    </div>
  );
};

export default SimulationDetails;
