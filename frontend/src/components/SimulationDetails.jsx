import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Space, Tooltip, Empty, Alert, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  CheckCircleOutlined, 
  HourglassOutlined, 
  UserDeleteOutlined, 
  ToolOutlined, 
  TrophyOutlined,
  LaptopOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SyncOutlined,
  SettingOutlined,
  WarningOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  GlobalOutlined,
  PartitionOutlined
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

  // Helper to render beautiful muted monospace text for numbers
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

  // Render PC statuses as physical server blades with glowing LEDs
  const renderPcStates = (pcStatesStr) => {
    if (!pcStatesStr) return null;
    const states = pcStatesStr.split(',');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
        {states.map((st, i) => {
          let ledColor = '#10b981'; // Libre - emerald green
          let ledGlow = '0 0 6px rgba(16, 185, 129, 0.75)';
          let statusText = 'LIBRE';
          let border = 'rgba(16, 185, 129, 0.15)';
          let pulseClass = '';
          
          if (st === 'busy' || st === 'B') {
            ledColor = '#3b82f6'; // Ocupado - electric blue
            ledGlow = '0 0 8px rgba(59, 130, 246, 0.85), 0 0 15px rgba(59, 130, 246, 0.4)';
            statusText = 'OCUPADO';
            border = 'rgba(59, 130, 246, 0.2)';
            pulseClass = 'led-pulse-blue';
          } else if (st === 'maintenance' || st === 'M') {
            ledColor = '#f59e0b'; // Mantenimiento - bright orange
            ledGlow = '0 0 8px rgba(245, 158, 11, 0.85), 0 0 15px rgba(245, 158, 11, 0.4)';
            statusText = 'MANTENIMIENTO';
            border = 'rgba(245, 158, 11, 0.25)';
            pulseClass = 'led-pulse-orange';
          }
          
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
                    transition: 'all 0.2s ease'
                  }} 
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const columns = [
    // --- CATEGORY 1: GENERAL/CLOCK ---
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
      render: (t) => <strong style={{ color: '#c084fc', fontFamily: 'monospace', fontSize: '11px', textShadow: '0 0 6px rgba(192, 132, 252, 0.15)' }}>{t}</strong>
    },
    {
      title: <span style={{ fontSize: '11px', color: '#cbd5e1' }}><SettingOutlined /> Evento</span>,
      dataIndex: 'event_name',
      key: 'event_name',
      width: 210,
      onHeaderCell: () => ({ className: 'header-col-general' }),
      render: (evt) => {
        let label = evt;
        let color = '#a855f7'; // default purple
        let bgColor = 'rgba(168, 85, 247, 0.08)';
        let borderColor = 'rgba(168, 85, 247, 0.2)';
        let textShadow = '0 0 6px rgba(168, 85, 247, 0.2)';

        if (evt === 'inicialización' || evt === 'inicializacion' || evt === 'inicio' || evt === 'start') {
          label = 'Inicialización';
          color = '#94a3b8'; // steel blue/slate
          bgColor = 'rgba(148, 163, 184, 0.08)';
          borderColor = 'rgba(148, 163, 184, 0.25)';
          textShadow = '0 0 6px rgba(148, 163, 184, 0.25)';
        } else if (evt === 'student_arrival') {
          label = 'Llegada Alumno';
          color = '#c084fc'; // light purple
          bgColor = 'rgba(192, 132, 252, 0.08)';
          borderColor = 'rgba(192, 132, 252, 0.25)';
          textShadow = '0 0 6px rgba(192, 132, 252, 0.25)';
        } else if (evt === 'student_return') {
          label = 'Retorno Alumno';
          color = '#22d3ee'; // cyan
          bgColor = 'rgba(34, 211, 238, 0.08)';
          borderColor = 'rgba(34, 211, 238, 0.25)';
          textShadow = '0 0 6px rgba(34, 211, 238, 0.25)';
        } else if (evt === 'technician_arrival') {
          label = 'Llegada Técnico';
          color = '#fbbf24'; // gold
          bgColor = 'rgba(251, 191, 36, 0.08)';
          borderColor = 'rgba(251, 191, 36, 0.25)';
          textShadow = '0 0 6px rgba(251, 191, 36, 0.25)';
        } else if (evt === 'maintenance_complete') {
          label = 'Fin Mantenimiento';
          color = '#f97316'; // orange
          bgColor = 'rgba(249, 115, 22, 0.08)';
          borderColor = 'rgba(249, 115, 22, 0.25)';
          textShadow = '0 0 6px rgba(249, 115, 22, 0.25)';
        } else if (evt.startsWith('registration_complete_pc')) {
          const pcNum = evt.replace('registration_complete_pc', '');
          label = `Fin Inscripción PC ${pcNum}`;
          color = '#34d399'; // emerald green
          bgColor = 'rgba(52, 211, 153, 0.08)';
          borderColor = 'rgba(52, 211, 153, 0.25)';
          textShadow = '0 0 6px rgba(52, 211, 153, 0.25)';
        }

        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            color: color,
            fontWeight: 600,
            fontSize: '11px',
            textShadow: textShadow,
            letterSpacing: '0.01em',
            fontFamily: 'monospace'
          }}>
            {label}
          </span>
        );
      }
    },
    {
      title: <span style={{ fontSize: '11px', color: '#cbd5e1' }}><TeamOutlined /> Cola</span>,
      dataIndex: 'queue_length',
      key: 'queue_length',
      width: 75,
      onHeaderCell: () => ({ className: 'header-col-general' }),
      render: (len) => {
        const limit = simulation?.student_wait_threshold || 5;
        let color = '#94a3b8'; // gray
        let bgColor = 'rgba(148, 163, 184, 0.05)';
        let border = '1px solid rgba(148, 163, 184, 0.12)';
        
        if (len > 0) {
          if (len >= limit) {
            color = '#f87171'; // red alert
            bgColor = 'rgba(248, 113, 113, 0.12)';
            border = '1px solid rgba(248, 113, 113, 0.35)';
          } else if (len >= limit - 2) {
            color = '#fb923c'; // orange warning
            bgColor = 'rgba(251, 146, 60, 0.08)';
            border = '1px solid rgba(251, 146, 60, 0.25)';
          } else {
            color = '#38bdf8'; // blue load
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
            border: border,
            color: color,
            fontWeight: '700',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            {len}
          </span>
        );
      }
    },

    // --- CATEGORY 2: ALUMNOS (STUDENTS) ---
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

    // --- CATEGORY 3: COMPUTADORAS (COMPUTERS) ---
    {
      title: <span style={{ fontSize: '11px', color: '#a7f3d0' }}><LaptopOutlined /> Servidores (LED)</span>,
      dataIndex: 'pc_states',
      key: 'pc_states',
      width: 175,
      onHeaderCell: () => ({ className: 'header-col-computers' }),
      onCell: () => ({ className: 'cell-col-computers' }),
      render: (states) => renderPcStates(states)
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

    // --- CATEGORY 4: MANTENIMIENTO & TÉCNICO (MAINTENANCE) ---
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
          <Card 
            className="glass-panel" 
            title={
              <Space>
                <SettingOutlined style={{ color: '#818cf8' }} />
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>Parámetros de la Simulación</span>
              </Space>
            } 
            style={{ height: '100%', background: 'rgba(15, 23, 42, 0.4)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 1. INFRAESTRUCTURA & TIEMPO */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#818cf8', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em' }}>
                  <LaptopOutlined />
                  <span>SISTEMA & TIEMPO SIMULADO</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>INFRAESTRUCTURA</Text>
                    <Tag color="blue" style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, width: '100%', textAlign: 'center', border: '1px solid rgba(96, 165, 250, 0.15)' }}>
                      {simulation.num_pcs} PCs
                    </Tag>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>TIEMPO TOTAL</Text>
                    <Tag color="cyan" style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, width: '100%', textAlign: 'center', border: '1px solid rgba(34, 211, 238, 0.15)' }}>
                      {simulation.sim_hours || (simulation.sim_days * 24)} horas
                    </Tag>
                  </div>
                </div>
              </div>

              {/* 2. CICLO DE ALUMNOS */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#c084fc', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em' }}>
                  <TeamOutlined />
                  <span>LLEGADAS & INSCRIPCIONES</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>LLEGADAS (MEDIA)</Text>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ClockCircleOutlined style={{ color: '#c084fc', fontSize: '11px' }} />
                      {simulation.mean_arrival_time} min
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>INSCRIPCIÓN MÍN/MÁX</Text>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HourglassOutlined style={{ color: '#c084fc', fontSize: '11px' }} />
                      {simulation.min_enrollment}-{simulation.max_enrollment} min
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. MANTENIMIENTO TÉCNICO */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fb923c', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em' }}>
                  <ToolOutlined />
                  <span>MANTENIMIENTO DEL TÉCNICO</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>REGRESO (MEDIA)</Text>
                      <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <SyncOutlined style={{ color: '#fb923c', fontSize: '11px' }} />
                        {simulation.mean_technician_return_time} min
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>VARIACIÓN (+/-)</Text>
                      <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}>
                        &plusmn; {simulation.technician_return_time_variation} min
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px', marginTop: '2px' }}>
                    <Text type="secondary" style={{ fontSize: '9px', display: 'inline', marginRight: '6px' }}>MANTENIMIENTO:</Text>
                    <span style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '10px' }}>
                      {simulation.min_maintenance_time} a {simulation.max_maintenance_time} min
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. TOLERANCIA DEL ALUMNO */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#f87171', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em' }}>
                  <WarningOutlined />
                  <span>TOLERANCIA DEL ALUMNO</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>LÍMITE DE COLA</Text>
                    <Tag color="error" style={{ fontSize: '11px', fontWeight: 'bold', margin: 0, width: '100%', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      {simulation.student_wait_threshold} alumnos
                    </Tag>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>DEMORA RETORNO</Text>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px', paddingTop: '2px' }}>
                      {simulation.student_return_time} min
                    </div>
                  </div>
                </div>
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
