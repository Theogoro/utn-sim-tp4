import { Row, Col } from 'antd';
import { CheckCircleOutlined, HourglassOutlined, UserDeleteOutlined, ToolOutlined, TrophyOutlined,} from '@ant-design/icons';
import KpiCard from './kpi-card';
import UtilizationChart from './utilization-chart';
import ParametersCard from './parameters-card';
import styles from './style.module.css';

interface Props {
  simulation: any;
  pcUtilization: any[];
}

const OverviewTab = ({
  simulation,
  pcUtilization,
}: Props) => {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Inscripciones completadas"
            value={simulation.registrations_completed}
            color="#15803d"
            icon={<CheckCircleOutlined />}
          />
        </Col>

        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Espera promedio"
            value={simulation.avg_waiting_time / 60}
            precision={2}
            suffix=" min"
            color="#2563eb"
            icon={<HourglassOutlined />}
          />
        </Col>

        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Intentos rechazados"
            value={simulation.pct_students_returned}
            precision={2}
            suffix="%"
            color="#b45309"
            icon={<UserDeleteOutlined />}
          />
        </Col>

        <Col xs={12} md={6} lg={5}>
          <KpiCard
            label="Ocio promedio del técnico"
            value={simulation.avg_technician_idle_time / 60}
            precision={2}
            suffix=" min"
            color="#0369a1"
            icon={<ToolOutlined />}
          />
        </Col>

        <Col xs={24} md={24} lg={4}>
          <KpiCard
            label="Visitas del técnico"
            value={simulation.total_technician_visits}
            color="#2563eb"
            icon={<TrophyOutlined />}
            highlight
          />
        </Col>
      </Row>

      <Row
        gutter={[24, 24]}
        className={styles.detailsRow}
      >
        <Col
          xs={24}
          lg={16}
          className={styles.chartCol}
        >
          <UtilizationChart
            pcUtilization={pcUtilization}
          />
        </Col>

        <Col
          xs={24}
          lg={8}
          className={styles.parametersCol}
        >
          <ParametersCard
            simulation={simulation}
          />
        </Col>
      </Row>
    </>
  );
};

export default OverviewTab;