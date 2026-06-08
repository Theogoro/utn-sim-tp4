import { Form, InputNumber, Slider, Button, Card, Row, Col, Tooltip, Switch } from 'antd';
import type { SimulationParams } from '../types/simulation';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  WarningOutlined,
  HourglassOutlined,
} from '@ant-design/icons';

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
  initial_maintenance_at_start: true,
  sim_hours: 24.0,
};

interface SimulationFormProps {
  onSubmit: (params: SimulationParams) => void | Promise<void>;
  loading: boolean;
}

const labelWithTip = (text: string, tip?: string) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {text}
    {tip && (
      <Tooltip title={tip}>
        <InfoCircleOutlined style={{ color: '#64748b', fontSize: 11 }} />
      </Tooltip>
    )}
  </span>
);

const SimulationForm = ({ onSubmit, loading }: SimulationFormProps) => {
  const [form] = Form.useForm<SimulationParams>();

  const handleLoadPresets = () => {
    form.setFieldsValue(UTN_PRESETS);
  };

  const onFinish = (values: SimulationParams) => {
    onSubmit({
      ...values,
      min_service_time: values.min_enrollment,
      max_service_time: values.max_enrollment,
    });
  };

  return (
    <Card className="glass-panel" style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 22,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="section-heading" style={{ marginBottom: 6 }}>
            <span>Configuración</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Parámetros de la simulación
          </div>
          <div style={{ color: '#94a3b8', marginTop: 4, fontSize: 13 }}>
            Ajuste los parámetros o cargue el preset académico de la cátedra.
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleLoadPresets} className="btn-preset">
          Valores por defecto (UTN)
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
          <Col xs={24} md={8}>
            <div className="subsection">
              <div className="subsection-title">
                <LaptopOutlined style={{ color: '#818cf8' }} /> Infraestructura & Arribos
              </div>

              <Form.Item
                name="num_pcs"
                label={labelWithTip('Cantidad de Computadoras (PCs)', 'Número total de terminales activas en la sala.')}
                rules={[{ required: true, message: 'Defina la cantidad de PCs' }]}
                style={{ marginBottom: 14 }}
              >
                <Slider min={1} max={15} marks={{ 1: '1', 6: '6', 15: '15' }} />
              </Form.Item>

              <Form.Item
                name="mean_arrival_time"
                label={labelWithTip('Tiempo entre llegadas (media)', 'Distribución exponencial negativa.')}
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <InputNumber min={0.1} max={60} step={0.1} style={{ width: '100%' }} addonAfter="min" />
              </Form.Item>
              <div style={{ color: '#64748b', fontSize: 11 }}>
                Estándar de la cátedra: 2 minutos.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="subsection">
              <div className="subsection-title">
                <HourglassOutlined style={{ color: '#c084fc' }} /> Tiempos de Inscripción
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="min_enrollment" label="Mínimo" rules={[{ required: true }]} style={{ marginBottom: 14 }}>
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_enrollment"
                    label="Máximo"
                    rules={[
                      { required: true },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('min_enrollment') <= value) return Promise.resolve();
                          return Promise.reject(new Error('Debe ser ≥ Mín.'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: 14 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="initial_maintenance_at_start"
                label={labelWithTip('Inicio mantenimiento', 'Si está activo, el encargado inicia mantenimiento en minuto 0 como en el Excel.')}
                valuePropName="checked"
                style={{ marginBottom: 14 }}
              >
                <Switch checkedChildren="Min 0" unCheckedChildren="Diferido" />
              </Form.Item>

              <div className="subsection-title" style={{ marginTop: 4 }}>
                <WarningOutlined style={{ color: '#f87171' }} /> Tolerancia & Retornos
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="student_wait_threshold"
                    label="Límite de cola"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={0} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="student_return_time"
                    label="Regresa en"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={1} max={720} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="subsection">
              <div className="subsection-title">
                <ToolOutlined style={{ color: '#fb923c' }} /> Mantenimiento del Técnico
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="min_maintenance_time" label="Mínimo" rules={[{ required: true }]} style={{ marginBottom: 14 }}>
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_maintenance_time"
                    label="Máximo"
                    rules={[
                      { required: true },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('min_maintenance_time') <= value) return Promise.resolve();
                          return Promise.reject(new Error('Debe ser ≥ Mín.'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: 14 }}
                  >
                    <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="mean_technician_return_time"
                    label="Frecuencia"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 14 }}
                  >
                    <InputNumber min={1} max={1440} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="technician_return_time_variation"
                    label="Variación ±"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 14 }}
                  >
                    <InputNumber min={0} max={120} step={1} style={{ width: '100%' }} addonAfter="min" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="subsection-title" style={{ marginTop: 4 }}>
                <ClockCircleOutlined style={{ color: '#38bdf8' }} /> Tiempo a simular
              </div>

              <Form.Item name="sim_hours" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <InputNumber min={0.1} max={720} style={{ width: '100%' }} addonAfter="horas" placeholder="Duración en horas" />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlayCircleOutlined />}
            loading={loading}
            size="large"
            style={{ height: 44, padding: '0 28px', fontSize: 14, fontWeight: 600 }}
          >
            Ejecutar simulación
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default SimulationForm;
