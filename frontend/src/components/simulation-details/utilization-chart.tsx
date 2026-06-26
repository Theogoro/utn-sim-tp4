import { Card, Empty } from 'antd';
import {BarChartOutlined} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar }from 'recharts';
import styles from './style.module.css';

interface Props {
    pcUtilization: any[];
}

const UtilizationChart = ({
  pcUtilization,
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
                <BarChartOutlined />

                Utilización de
                Computadoras
                </span>
            }
        >
        {pcUtilization.length >
        0 ? (
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={pcUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis unit="%" />

                    <Tooltip />

                    <Legend />

                    <Bar
                        dataKey="Ocupado (%)"
                        stackId="a"
                        fill="#2563eb"
                    />

                    <Bar
                        dataKey="Mantenimiento (%)"
                        stackId="a"
                        fill="#d97706"
                    />

                    <Bar
                        dataKey="Libre (%)"
                        stackId="a"
                        fill="#16a34a"
                    />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <Empty
            description="No hay estadísticas de utilización disponibles"
            />
        )}
        </Card>
    );
};

export default UtilizationChart;