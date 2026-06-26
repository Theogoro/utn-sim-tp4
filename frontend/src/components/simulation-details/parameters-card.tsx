import { Card, Tag} from 'antd';
import {LaptopOutlined,ClockCircleOutlined,TeamOutlined,SyncOutlined,SettingOutlined,WarningOutlined,
    ToolOutlined,HourglassOutlined} from '@ant-design/icons';
import styles from './style.module.css';

interface Props {
    simulation: any;
}

const ParametersCard = ({
  simulation,
}: Props) => {
    return (
        <Card
        className="glass-panel"
        title={
            <span
            className={
                styles.cardTitle
            }
            >
            <SettingOutlined
                style={{
                color: '#2563eb',
                }}
            />

            Parámetros
            </span>
        }
        classNames={{
            body: styles.parametersBody,
        }}
        >
        <div
            className={
            styles.parametersContainer
            }
        >
            <div
            className={
                styles.paramRow
            }
            >
            <div
                className={
                styles.paramRowLabel
                }
            >
                <LaptopOutlined />

                Sistema & tiempo
            </div>

            <div
                className={
                styles.paramGrid
                }
            >
                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    INFRAESTRUCTURA
                </div>

                <Tag
                    color="blue"
                    className={
                    styles.fullTag
                    }
                >
                    {simulation.num_pcs} PCs
                </Tag>
                </div>

                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    TIEMPO
                </div>

                <Tag
                    color="cyan"
                    className={
                    styles.fullTag
                    }
                >
                    {simulation.sim_hours ||
                    simulation.sim_days *
                        24}{' '}
                    h
                </Tag>
                </div>
            </div>
            </div>

            <div
            className={
                styles.paramRow
            }
            >
            <div
                className={
                styles.paramRowLabel
                }
            >
                <TeamOutlined />

                Llegadas & inscripción
            </div>

            <div
                className={
                styles.paramGrid
                }
            >
                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    LLEGADAS (MEDIA)
                </div>

                <div
                    className={
                    styles.paramValue
                    }
                >
                    <ClockCircleOutlined />

                    {
                    simulation.mean_arrival_time
                    }{' '}
                    min
                </div>
                </div>

                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    INSCRIPCIÓN MÍN/MÁX
                </div>

                <div
                    className={
                    styles.paramValue
                    }
                >
                    <HourglassOutlined />

                    {
                    simulation.min_enrollment
                    }
                    –
                    {
                    simulation.max_enrollment
                    }{' '}
                    min
                </div>
                </div>
            </div>
            </div>

            <div
            className={
                styles.paramRow
            }
            >
            <div
                className={
                styles.paramRowLabelMaintenance
                }
            >
                <ToolOutlined />

                Mantenimiento del técnico
            </div>

            <div
                className={
                styles.paramGrid
                }
            >
                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    REGRESO (MEDIA)
                </div>

                <div
                    className={
                    styles.paramValue
                    }
                >
                    <SyncOutlined />

                    {
                    simulation.mean_technician_return_time
                    }{' '}
                    min
                </div>
                </div>

                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    VARIACIÓN ±
                </div>

                <div
                    className={
                    styles.paramValue
                    }
                >
                    ±{' '}
                    {
                    simulation.technician_return_time_variation
                    }{' '}
                    min
                </div>
                </div>
            </div>

            <div
                className={
                styles.maintenanceFooter
                }
            >
                <span
                className={
                    styles.footerLabel
                }
                >
                MANTENIMIENTO:
                </span>

                <span
                className={
                    styles.footerValue
                }
                >
                {
                    simulation.min_maintenance_time
                }
                –
                {
                    simulation.max_maintenance_time
                }{' '}
                min
                </span>
            </div>
            </div>

            <div
            className={
                styles.paramRow
            }
            >
            <div
                className={
                styles.paramRowLabelDanger
                }
            >
                <WarningOutlined />

                Tolerancia del alumno
            </div>

            <div
                className={
                styles.paramGrid
                }
            >
                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    LÍMITE DE COLA
                </div>

                <Tag
                    color="error"
                    className={
                    styles.fullTag
                    }
                >
                    {
                    simulation.student_wait_threshold
                    }{' '}
                    alumnos
                </Tag>
                </div>

                <div>
                <div
                    className={
                    styles.paramMiniLabel
                    }
                >
                    DEMORA RETORNO
                </div>

                <div
                    className={
                    styles.paramValue
                    }
                >
                    {
                    simulation.student_return_time
                    }{' '}
                    min
                </div>
                </div>
            </div>
            </div>
        </div>
        </Card>
    );
};

export default ParametersCard;