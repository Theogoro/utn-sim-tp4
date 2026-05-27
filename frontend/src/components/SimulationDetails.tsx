import { useState } from 'react';
import { Card, Row, Col, Statistic, Tabs, Tag, Empty, Spin, Button, message } from 'antd';
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
  WarningOutlined,
  BarChartOutlined,
  TableOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import StateVectorTable from './StateVectorTable';
import { useSimulationDetails } from '../hooks/useSimulationDetails';
import { exportSimulationXlsx } from '../api/simulations';

interface SimulationDetailsProps {
  simulationId: number | null;
}

const KpiCard = ({
  label,
  value,
  precision,
  suffix,
  color,
  icon,
  caption,
  highlight,
}: {
  label: string;
  value: number;
  precision?: number;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
  caption?: string;
  highlight?: boolean;
}) => (
  <div
    className="kpi-card"
    style={
      highlight
        ? { background: 'linear-gradient(180deg, rgba(99,102,241,0.10), rgba(99,102,241,0.02))', borderColor: 'rgba(99,102,241,0.30)' }
        : undefined
    }
  >
    <Statistic
      title={<span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>}
      value={value}
      precision={precision}
      valueStyle={{ color, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}
      prefix={<span style={{ marginRight: 8, color, fontSize: 18 }}>{icon}</span>}
      suffix={suffix}
    />
    {caption && (
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{caption}</div>
    )}
  </div>
);

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

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!simulationId) return;
    setExporting(true);
    try {
      const res = await exportSimulationXlsx(simulationId);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulacion_${simulationId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success('Excel descargado');
    } catch {
      message.error('No se pudo exportar la simulación');
    } finally {
      setExporting(false);
    }
  };

  if (!simulationId) {
    return (
      <Card className="glass-panel" style={{ textAlign: 'center', padding: '48px 0' }}>
        <Empty description={<span style={{ color: '#94a3b8' }}>Seleccione una simulación del historial para ver el análisis detallado.</span>} />
      </Card>
    );
  }

  if (loadingDetails && !simulation) {
    return (
      <Card className="glass-panel" style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <div style={{ color: '#94a3b8', marginTop: 16 }}>Cargando análisis…</div>
      </Card>
    );
  }

  if (!simulation) return null;

  const overviewTab = (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Inscripciones completadas"
            value={simulation.registrations_completed}
            color="#34d399"
            icon={<CheckCircleOutlined />}
            caption="Inscripciones exitosas"
          />
        </Col>
        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Espera promedio"
            value={simulation.avg_waiting_time / 60}
            precision={2}
            suffix=" min"
            color="#c084fc"
            icon={<HourglassOutlined />}
            caption={`${simulation.avg_waiting_time.toFixed(1)}s por alumno en cola`}
          />
        </Col>
        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Intentos rechazados"
            value={simulation.pct_students_returned}
            precision={2}
            suffix="%"
            color={simulation.pct_students_returned > 0 ? '#fb923c' : '#34d399'}
            icon={<UserDeleteOutlined />}
            caption={`${simulation.total_students_returned} de ${simulation.total_students_arrived} se retiraron`}
          />
        </Col>
        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Ocio promedio del técnico"
            value={simulation.avg_technician_idle_time / 60}
            precision={2}
            suffix=" min"
            color="#a5b4fc"
            icon={<ToolOutlined />}
            caption={`${simulation.avg_technician_idle_time.toFixed(1)}s por visita`}
          />
        </Col>
        <Col xs={24} md={24} lg={4}>
          <KpiCard
            label="Visitas del técnico"
            value={simulation.total_technician_visits}
            color="#818cf8"
            icon={<TrophyOutlined />}
            caption="Rondas de mantenimiento"
            highlight
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            className="glass-panel"
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                <BarChartOutlined style={{ color: '#818cf8' }} />
                Utilización de Computadoras
              </span>
            }
          >
            {pcUtilization.length > 0 ? (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={pcUtilization} margin={{ top: 20, right: 24, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.10)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" unit="%" tick={{ fontSize: 12 }} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: '#0f1320',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                      }}
                      labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="Ocupado (%)" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Mantenimiento (%)" stackId="a" fill="#fb923c" />
                    <Bar dataKey="Libre (%)" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
                <SettingOutlined style={{ color: '#818cf8' }} />
                Parámetros
              </span>
            }
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="param-row">
                <div className="param-row-label" style={{ color: '#818cf8' }}>
                  <LaptopOutlined /> Sistema & tiempo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em' }}>INFRAESTRUCTURA</div>
                    <Tag color="blue" style={{ margin: 0, width: '100%', textAlign: 'center', fontWeight: 600 }}>
                      {simulation.num_pcs} PCs
                    </Tag>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em' }}>TIEMPO</div>
                    <Tag color="cyan" style={{ margin: 0, width: '100%', textAlign: 'center', fontWeight: 600 }}>
                      {simulation.sim_hours || simulation.sim_days * 24} h
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="param-row">
                <div className="param-row-label" style={{ color: '#c084fc' }}>
                  <TeamOutlined /> Llegadas & inscripción
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>LLEGADAS (MEDIA)</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClockCircleOutlined style={{ color: '#c084fc' }} />
                      {simulation.mean_arrival_time} min
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>INSCRIPCIÓN MÍN/MÁX</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HourglassOutlined style={{ color: '#c084fc' }} />
                      {simulation.min_enrollment}–{simulation.max_enrollment} min
                    </div>
                  </div>
                </div>
              </div>

              <div className="param-row">
                <div className="param-row-label" style={{ color: '#fb923c' }}>
                  <ToolOutlined /> Mantenimiento del técnico
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>REGRESO (MEDIA)</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SyncOutlined style={{ color: '#fb923c' }} />
                      {simulation.mean_technician_return_time} min
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>VARIACIÓN ±</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                      ± {simulation.technician_return_time_variation} min
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.06)', fontSize: 11 }}>
                  <span style={{ color: '#64748b', marginRight: 6 }}>MANTENIMIENTO:</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                    {simulation.min_maintenance_time}–{simulation.max_maintenance_time} min
                  </span>
                </div>
              </div>

              <div className="param-row">
                <div className="param-row-label" style={{ color: '#f87171' }}>
                  <WarningOutlined /> Tolerancia del alumno
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>LÍMITE DE COLA</div>
                    <Tag color="error" style={{ margin: 0, width: '100%', textAlign: 'center', fontWeight: 600 }}>
                      {simulation.student_wait_threshold} alumnos
                    </Tag>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>DEMORA RETORNO</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, paddingTop: 2 }}>
                      {simulation.student_return_time} min
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  const traceTab = (
    <Card className="glass-panel" bodyStyle={{ padding: 20 }}>
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
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <BarChartOutlined /> Análisis · Simulación #{simulation.id}
        </div>
        <Button
          icon={<FileExcelOutlined />}
          onClick={handleExport}
          loading={exporting}
          style={{
            background: 'rgba(34, 197, 94, 0.10)',
            borderColor: 'rgba(34, 197, 94, 0.35)',
            color: '#86efac',
            fontWeight: 500,
          }}
        >
          Descargar Excel
        </Button>
      </div>

      <Tabs
        defaultActiveKey="overview"
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined /> Resumen
              </span>
            ),
            children: overviewTab,
          },
          {
            key: 'trace',
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <TableOutlined /> Vector de estados
              </span>
            ),
            children: traceTab,
          },
        ]}
      />
    </div>
  );
};

export default SimulationDetails;
