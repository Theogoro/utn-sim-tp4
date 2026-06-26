import {Form,InputNumber,Row,Col,Switch,} from 'antd';
import {HourglassOutlined,WarningOutlined,} from '@ant-design/icons';
import styles from '../style.module.css';
import { labelWithTip } from '../label-with-tip';

const EnrollmentSection = () => {
  return (
    <div className={styles.subsection}>
      <div className={styles.subsectionTitle}>
        <HourglassOutlined
          style={{
            color: '#2563eb',
          }}
        />

        Tiempos de Inscripción
      </div>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="min_enrollment"
            label="Mínimo"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              min={0.5}
              max={120}
              step={0.1}
              addonAfter="min"
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="max_enrollment"
            label="Máximo"
            rules={[
              {
                required: true,
              },

              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue('min_enrollment') <= value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error('Debe ser ≥ Mín.')
                  );
                },
              }),
            ]}
          >
            <InputNumber
              min={0.5}
              max={120}
              step={0.1}
              addonAfter="min"
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="initial_maintenance_at_start"
        label={labelWithTip(
          'Inicio mantenimiento',
          'Si está activo, el encargado inicia mantenimiento en minuto 0 como en el Excel.',
        )}
        valuePropName="checked"
      >
        <Switch
          checkedChildren="Min 0"
          unCheckedChildren="Diferido"
        />
      </Form.Item>

      <div className={styles.subsectionTitleDanger}>
        <WarningOutlined
          style={{
            color: '#b91c1c',
          }}
        />

        Tolerancia & Retornos
      </div>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="student_wait_threshold"
            label="Límite de cola"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              min={0}
              max={30}
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="student_return_time"
            label="Regresa en"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              min={1}
              max={720}
              step={1}
              addonAfter="min"
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default EnrollmentSection;