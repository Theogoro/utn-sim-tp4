import { Form, Card, Row, Col, Button,} from 'antd';
import { PlayCircleOutlined,ReloadOutlined,} from '@ant-design/icons';
import { UTN_PRESETS,} from './pre-sets';
import InfrastructureSection from './sections/infrastructure-section';
import EnrollmentSection from './sections/enrollment-section';
import MaintenanceSection from './sections/maintenance-section';
import { SimulationParams } from '../../types/simulation-params';
import styles from "./style.module.css";

interface SimulationFormProps {
    onSubmit: ( params: SimulationParams,) => void | Promise<void>;
    loading: boolean;
}

const SimulationForm = ({
  onSubmit,
  loading,
}: SimulationFormProps) => {
    const [form] =
        Form.useForm<SimulationParams>();

    const handleLoadPresets =
        () => {
        form.setFieldsValue(
            UTN_PRESETS,
        );
        };

    const onFinish = (
        values: SimulationParams,
    ) => {
        onSubmit({
        ...values,

        min_service_time:
            values.min_enrollment,

        max_service_time:
            values.max_enrollment,
        });
    };

    return (
        <Card
            className="glass-panel"
        >
        <div
            className={
            styles.header
            }
        >
            <div>
                <div
                    className="section-heading"
                >
                    Configuración
                </div>

                <div
                    className={
                    styles.title
                    }
                >
                    Parámetros de la
                    simulación
                </div>

                <div
                    className={
                    styles.subtitle
                    }
                >
                    Ajuste los parámetros
                    o cargue el preset
                    académico de la
                    cátedra.
                </div>
            </div>

            <Button
                icon={
                    <ReloadOutlined />
                }
                onClick={
                    handleLoadPresets
                }
                className="btn-preset"
            >
                Valores por defecto
                (UTN)
            </Button>
        </div>

            <Form
                form={form}
                layout="vertical"
                initialValues={
                    UTN_PRESETS
                }
                onFinish={onFinish}
                requiredMark={false}
                >
                    <Row gutter={[20, 20]}>
                    <Col
                        xs={24}
                        md={8}
                    >
                        <InfrastructureSection />
                    </Col>

                    <Col
                        xs={24}
                        md={8}
                    >
                        <EnrollmentSection />
                    </Col>

                    <Col
                        xs={24}
                        md={8}
                    >
                        <MaintenanceSection />
                    </Col>
                    </Row>

                    <div
                    className={
                        styles.submitContainer
                    }
                    >
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={
                        <PlayCircleOutlined />
                        }
                        loading={loading}
                        size="large"
                        className={
                        styles.submitButton
                        }
                    >
                        Ejecutar simulación
                    </Button>
                </div>
            </Form>
        </Card>
    );
};

export default SimulationForm;