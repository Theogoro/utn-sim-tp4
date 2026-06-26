import {Form,InputNumber,Row,Col} from 'antd';
import {ToolOutlined,ClockCircleOutlined} from '@ant-design/icons';
import styles from '../style.module.css';

const MaintenanceSection = () => {
  return (
    <div className={styles.subsection}>
      <div className={styles.subsectionTitleMaintenance}>
        <ToolOutlined
          style={{
            color: '#b45309',
          }}
        />

        Mantenimiento del Técnico
      </div>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="min_maintenance_time"
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
            name="max_maintenance_time"
            label="Máximo"
            rules={[
              {
                required: true,
              },

              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue(
                      'min_maintenance_time',
                    ) <= value
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

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="mean_technician_return_time"
            label="Frecuencia"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              min={1}
              max={1440}
              step={1}
              addonAfter="min"
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="technician_return_time_variation"
            label="Variación ±"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              min={0}
              max={120}
              step={1}
              addonAfter="min"
              className={styles.fullWidth}
            />
          </Form.Item>
        </Col>
      </Row>

      <div className={styles.subsectionTitleTime}>
        <ClockCircleOutlined
          style={{
            color: '#0369a1',
          }}
        />

        Tiempo a simular
      </div>

      <Form.Item
        name="sim_hours"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <InputNumber
          min={0.1}
          max={720}
          placeholder="Duración en horas"
          addonAfter="horas"
          className={styles.fullWidth}
        />
      </Form.Item>
    </div>
  );
};

export default MaintenanceSection;