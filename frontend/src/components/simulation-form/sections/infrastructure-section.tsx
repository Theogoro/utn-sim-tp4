import { LaptopOutlined} from '@ant-design/icons';
import styles from '../style.module.css';
import { labelWithTip } from '../label-with-tip';
import { Form, Slider, InputNumber, Space } from 'antd';

const InfrastructureSection = () => {
    return (
        <div
         className={
            styles.subsection
        }
        >
        <div
            className={
            styles.subsectionTitle
            }
        >
            <LaptopOutlined
            style={{
                color: '#2563eb',
            }}
            />

            Infraestructura & Arribos
        </div>

        <Form.Item
            name="num_pcs"
            label={labelWithTip(
            'Cantidad de Computadoras (PCs)',
            'Número total de terminales activas en la sala.',
            )}
            rules={[
            {
                required: true,
                message:
                'Defina la cantidad de PCs',
            },
            ]}
        >
            <Slider
            min={1}
            max={15}
            marks={{
                1: '1',
                6: '6',
                15: '15',
            }}
            />
        </Form.Item>

        <Form.Item
            name="mean_arrival_time"
            label={labelWithTip(
            'Tiempo entre llegadas (media)',
            'Distribución exponencial negativa.',
            )}
            rules={[
            {
                required: true,
            },
            ]}
        >
            <Space.Compact className={styles.fullWidth}>
                <InputNumber
                    min={0.1}
                    max={60}
                    step={0.1}
                    style={{ width: '100%' }}
                />

                <div
                    style={{
                    padding: '0 11px',
                    border: '1px solid #d9d9d9',
                    borderLeft: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#fafafa',
                    borderRadius: '0 6px 6px 0',
                    color: '#64748b',
                    fontSize: '14px'
                    }}
                >
                    min
                </div>
                </Space.Compact>
        </Form.Item>

        <div
            className={
            styles.helperText
            }
        >
            Estándar de la cátedra:
            2 minutos.
        </div>
        </div>
    );
};

export default InfrastructureSection;