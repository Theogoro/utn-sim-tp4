import { Card, Row, Col, Statistic, Typography, Tag, Space, Empty, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  CheckCircleOutlined, 
  HourglassOutlined, 
  UserDeleteOutlined, 
  ToolOutlined, 
  TrophyOutlined,
  LaptopOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SyncOutlined,
  SettingOutlined,
  WarningOutlined
} from '@ant-design/icons';
import StateVectorTable from './StateVectorTable';
import { useSimulationDetails } from '../hooks/useSimulationDetails';

const { Text, Paragraph } = Typography;

interface SimulationDetailsProps {
  simulationId: number | null;
}

const SimulationDetails = ({ simulationId }: SimulationDetailsProps) => {
  const {
    simulation,
    lines,
    totalLines,
    page,
    pageSize,
    loadingDetails,
    loadingLines,
    pcUtilization,
    setPage,
    setPageSize,
  } = useSimulationDetails(simulationId);

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
              title={<span style={{ color: '#94a3b8', fontSize: 13 }}>% Intentos Rechazados</span>}
              value={simulation.pct_students_returned}
              precision={2}
              valueStyle={{ color: simulation.pct_students_returned > 0 ? '#fb923c' : '#4ade80', fontWeight: 700 }}
              prefix={<UserDeleteOutlined style={{ marginRight: 6 }} />}
              suffix="%"
            />
            <Text style={{ fontSize: 11, color: '#64748b' }}>
              {simulation.total_students_returned} de {simulation.total_students_arrived} intentos se retiraron
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
        <StateVectorTable
          lines={lines}
          loading={loadingLines}
          page={page}
          pageSize={pageSize}
          total={totalLines}
          queueLimit={simulation.student_wait_threshold}
          onPageChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
        />
      </Card>
    </div>
  );
};

export default SimulationDetails;
