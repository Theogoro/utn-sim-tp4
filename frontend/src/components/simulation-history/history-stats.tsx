import {CheckCircleOutlined,UserDeleteOutlined,} from '@ant-design/icons';
import './style.module.css';

interface Props {
    summary: {
        runs: number;
        totalRegs: number;
        avgRejected: number;
        avgWait: number;
    };
}

export const HistoryStats = ({
  summary,
}: Props) => {
    return (
        <div className="stat-strip">
        <div className="stat">
            <div className="stat-label">
            Corridas
            </div>

            <div className="stat-value">
            {summary.runs}
            </div>
        </div>

        <div className="stat">
            <div className="stat-label">
                <CheckCircleOutlined className="stat-success-icon" />
                Inscripciones totales
            </div>

            <div className="stat-value stat-success">
                {summary.totalRegs.toLocaleString()}
            </div>
        </div>

        <div className="stat">
            <div className="stat-label">
                <UserDeleteOutlined className="stat-warning-icon" />
                % rechazos (prom.)
            </div>

            <div
                className={`stat-value ${
                    summary.avgRejected > 0
                    ? 'stat-warning'
                    : ''
                }`}
            >
                {summary.avgRejected.toFixed(
                    2,
                )}
                %
            </div>
        </div>

        <div className="stat">
            <div className="stat-label">
                Espera prom. global
            </div>

                <div className="stat-value">
                    {summary.avgWait.toFixed(2)}

                    <span className="stat-unit">
                        min
                    </span>
                </div>
            </div>
        </div>
    );
};