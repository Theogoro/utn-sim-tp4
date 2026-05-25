import { Form, InputNumber, Slider, Button, Card, Row, Col, Typography, Space, Tooltip } from 'antd';
import type { SimulationParams } from '../types/simulation';
import { 
  PlayCircleOutlined, 
  ReloadOutlined, 
  InfoCircleOutlined,
  LaptopOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  WarningOutlined,
  HourglassOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const UTN_PRESETS: SimulationParams = {
  num_pcs: 6,
  min_enrollment: 5.0,
  max_enrollment: 8.0,
  mean_arrival_time: 2.0,
  min_service_time: 5.0,
  max_service_time: 8.0,
  min_maintenance_time: 3.0,
  max_maintenance_time: 10.0,
  mean_technician_return_time: 60.0,
  technician_return_time_variation: 3.0,
  student_wait_threshold: 5,
  student_return_time: 30.0,
  sim_hours: 24.0,
};

interface SimulationFormProps {
  onSubmit: (params: SimulationParams) => void | Promise<void>;
  loading: boolean;
}

const SimulationForm = ({ onSubmit, loading }: SimulationFormProps) => {
  const [form] = Form.useForm<SimulationParams>();
  
  const handleLoadPresets = () => {
    form.setFieldsValue(UTN_PRESETS);
  };

  const onFinish = (values: SimulationParams) => {
    // Standardize min/max service time to match min/max enrollment automatically
    const updatedValues = {
      ...values,
      min_service_time: values.min_enrollment,
      max_service_time: values.max_enrollment,
    };
    onSubmit(updatedValues);
  };

  return (
    <Card 
      className="glass-panel" 
      style={{ 
        marginBottom: 24, 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(9, 13, 22, 0.7) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)' 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#f8fafc' }} className="gradient-title">
            Configurar Simulación
          </Title>
          <Paragraph style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
            Ajuste los parámetros del simulador o cargue el preset académico estándar de la cátedra.
          </Paragraph>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleLoadPresets}
          className="btn-preset"
          size="middle"
        >
          Valores por Defecto (UTN)
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={UTN_PRESETS}
        onFinish={onFinish}
        requiredMark={false}
      >
        <Row gutter={[20, 20]}>
          {/* PC & Arrival configuration */}
          <Col xs={24} md={8}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '16px',
              height: '100%'
            }}>
              <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LaptopOutlined />
                <span>Infraestructura & Arribos</span>
              </Title>
              
              <Form.Item
                name="num_pcs"
                label={
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                    Cantidad de Computadoras (PCs) &nbsp;
                    <Tooltip title="Número total de terminales de inscripción activas en la sala.">
                      <InfoCircleOutlined style={{ color: '#64748b', fontSize: 11 }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true, message: 'Defina la cantidad de computadoras' }]}
                style={{ marginBottom: 12 }}
              >
                <Slider min={1} max={15} marks={{ 1: '1', 6: '6', 15: '15' }} />
              </Form.Item>

              <Form.Item
                name="mean_arrival_time"
                label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Tiempo Entre Llegadas (Media)</span>}
                rules={[{ required: true, message: 'Requerido' }]}
                style={{ marginBottom: 4 }}
              >
                <InputNumber min={0.1} max={60} step={0.1} style={{ width: '100%' }} addonAfter="min" />
              </Form.Item>
              <Paragraph style={{ color: '#475569', fontSize: 11, margin: 0, minHeight: '34px' }}>
                Distribución exponencial negativa. El estándar de la cátedra es 2 minutos.
              </Paragraph>
            </div>
          </Col>

          {/* Service Time configuration */}
          <Col xs={24} md={8}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '16px',
              height: '100%'
            }}>
              <Title level={5} style={{ color: '#c084fc', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HourglassOutlined />
                <span>Tiempos de Inscripción</span>
              </Title>
              
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="min_enrollment"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Mínimo</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_enrollment"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Máximo</span>}
                    rules={[
                      { required: true, message: 'Requerido' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('min_enrollment') <= value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Debe ser ≥ Mín.'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Title level={5} style={{ color: '#f87171', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 6, marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WarningOutlined />
                <span>Tolerancia & Retornos</span>
              </Title>
              
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="student_wait_threshold"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Límite Cola</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={0} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="student_return_time"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Regresa En</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={1} max={720} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Technician configuration & Duration */}
          <Col xs={24} md={8}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '16px',
              height: '100%'
            }}>
              <Title level={5} style={{ color: '#fb923c', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8, marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ToolOutlined />
                <span>Mantenimiento del Técnico</span>
              </Title>
              
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="min_maintenance_time"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Mínimo</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_maintenance_time"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Máximo</span>}
                    rules={[
                      { required: true, message: 'Requerido' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('min_maintenance_time') <= value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Debe ser ≥ Mín.'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="mean_technician_return_time"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Frecuencia</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={1} max={1440} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="technician_return_time_variation"
                    label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Var. (+/-)</span>}
                    rules={[{ required: true, message: 'Requerido' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber min={0} max={120} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Title level={5} style={{ color: '#38bdf8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 6, marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClockCircleOutlined />
                <span>Tiempo a Simular</span>
              </Title>
              
              <Form.Item
                name="sim_hours"
                label={null}
                rules={[{ required: true, message: 'Requerido' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0.1} max={720} style={{ width: '100%' }} addonAfter="horas" placeholder="Duración en horas" />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row style={{ marginTop: 20 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<PlayCircleOutlined />} 
                loading={loading}
                size="large"
                style={{ 
                  height: '42px', 
                  padding: '0 24px', 
                  fontSize: '15px', 
                  fontWeight: 600,
                  borderRadius: '8px'
                }}
              >
                Ejecutar Simulación
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SimulationForm;
