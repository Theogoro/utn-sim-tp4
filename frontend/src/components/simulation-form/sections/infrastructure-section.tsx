import { LaptopOutlined} from '@ant-design/icons';
import styles from '../style.module.css';
import { labelWithTip } from '../label-with-tip';
import { Form, Slider, InputNumber } from 'antd';

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
            <InputNumber
                min={0.1}
                max={60}
                step={0.1}
                addonAfter="min"
                className={styles.fullWidth}
            />
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