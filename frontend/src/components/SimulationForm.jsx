import React, { useState } from 'react';
import { Form, InputNumber, Slider, Button, Card, Row, Col, Typography, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const UTN_PRESETS = {
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

const SimulationForm = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  
  const handleLoadPresets = () => {
    form.setFieldsValue(UTN_PRESETS);
  };

  const onFinish = (values) => {
    // Standardize min/max service time to match min/max enrollment automatically
    const updatedValues = {
      ...values,
      min_service_time: values.min_enrollment,
      max_service_time: values.max_enrollment,
    };
    onSubmit(updatedValues);
  };

  return (
    <Card className="glass-panel" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#f8fafc' }} className="gradient-title">
            Configurar Simulación
          </Title>
          <Paragraph style={{ color: '#94a3b8', margin: 0 }}>
            Establezca parámetros personalizados o cargue los valores estándar del enunciado.
          </Paragraph>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleLoadPresets}
          style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.1)' }}
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
        <Row gutter={[24, 16]}>
          {/* PC & Arrival configuration */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
              Infraestructura de Inscripción
            </Title>
            
            <Form.Item
              name="num_pcs"
              label={
                <span style={{ color: '#e2e8f0' }}>
                  Cantidad de Computadoras (PCs) &nbsp;
                  <Tooltip title="Número total de equipos de inscripción disponibles en la sala.">
                    <InfoCircleOutlined style={{ color: '#94a3b8' }} />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Defina la cantidad de computadoras' }]}
            >
              <Slider min={1} max={15} marks={{ 1: '1', 6: '6 (Estándar)', 15: '15' }} />
            </Form.Item>

            <Form.Item
              name="mean_arrival_time"
              label={<span style={{ color: '#e2e8f0' }}>Tiempo Entre Llegadas (Media)</span>}
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <InputNumber min={0.1} max={60} step={0.1} style={{ width: '100%' }} addonAfter="min" />
            </Form.Item>
            <Paragraph style={{ color: '#64748b', fontSize: 12, marginTop: -8 }}>
              Distribución exponencial negativa. El estándar es 2 minutos.
            </Paragraph>
          </Col>

          {/* Service Time configuration */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
              Tiempo de Inscripción (Uniforme)
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="min_enrollment"
                  label={<span style={{ color: '#e2e8f0' }}>Tiempo Mín.</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="max_enrollment"
                  label={<span style={{ color: '#e2e8f0' }}>Tiempo Máx.</span>}
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
                >
                  <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
            </Row>
            <Paragraph style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Servicio uniformemente distribuido. Estándar: 5 a 8 minutos.
            </Paragraph>

            <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8, marginTop: 12 }}>
              Tolerancia del Alumno y Retorno
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="student_wait_threshold"
                  label={<span style={{ color: '#e2e8f0' }}>Límite de Cola</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={0} max={30} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="student_return_time"
                  label={<span style={{ color: '#e2e8f0' }}>Regresa En</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={1} max={720} step={1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
            </Row>
            <Paragraph style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Se va si cola &gt; límite, regresa después de la demora (Estándar: 5 alumnos, 30 min).
            </Paragraph>
          </Col>

          {/* Technician configuration & Duration */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
              Técnico de Sistemas (Mantenimiento)
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="min_maintenance_time"
                  label={<span style={{ color: '#e2e8f0' }}>Duración Mín.</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="max_maintenance_time"
                  label={<span style={{ color: '#e2e8f0' }}>Duración Máx.</span>}
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
                >
                  <InputNumber min={0.5} max={120} step={0.1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item
                  name="mean_technician_return_time"
                  label={<span style={{ color: '#e2e8f0' }}>Regreso Técnico</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={1} max={1440} step={1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="technician_return_time_variation"
                  label={<span style={{ color: '#e2e8f0' }}>Variación (+/-)</span>}
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={0} max={120} step={1} style={{ width: '100%' }} addonAfter="min" />
                </Form.Item>
              </Col>
            </Row>
            
            <Title level={5} style={{ color: '#818cf8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8, marginTop: 12 }}>
              Duración de la Simulación
            </Title>
            
            <Form.Item
              name="sim_hours"
              label={<span style={{ color: '#e2e8f0' }}>Tiempo a Simular (Horas)</span>}
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <InputNumber min={0.1} max={720} style={{ width: '100%' }} addonAfter="horas" />
            </Form.Item>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<PlayCircleOutlined />} 
                loading={loading}
                size="large"
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
