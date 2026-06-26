import { useMemo } from 'react';
import { Card, Table } from 'antd';
import { DatabaseOutlined} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SimulationSummary } from '../../types/simulation-summary';
import { createColumns } from './simulation-history-columns';
import { HistoryStats } from './history-stats';
import './style.module.css';

interface SimulationHistoryProps {
    simulations: SimulationSummary[];
    onSelect: (id: number) => void;
    onDelete: (id: number) => void | Promise<void>;
    activeId: number | null;
    loading: boolean;
}

const SimulationHistory = ({
  simulations,
  onSelect,
  onDelete,
  activeId,
  loading,
}: SimulationHistoryProps) => {
    const summary = useMemo(() => {
        if (!simulations.length) {
            return {
                runs: 0,
                totalRegs: 0,
                avgRejected: 0,
                avgWait: 0,
            };
        }

        const totalRegs = simulations.reduce(
            (a, s) =>
                a + (s.registrations_completed || 0),
            0,
        );

        const avgRejected =
            simulations.reduce(
                (a, s) =>
                a +
                (s.pct_students_returned || 0),
                0,
        ) / simulations.length;

        const avgWait =
            simulations.reduce(
                (a, s) =>
                a + (s.avg_waiting_time || 0),
                0,
            ) /
            simulations.length /
            60;

            return {
            runs: simulations.length,
            totalRegs,
            avgRejected,
            avgWait,
            };
        }, [simulations]);

        const columns: ColumnsType<SimulationSummary> =
            createColumns({
            activeId,
            onDelete,
            onSelect,
        });

    return (
        <Card className="glass-panel simulation-history">
            <div className="section-heading">
                <DatabaseOutlined />
                Historial
            </div>

            <div className="simulation-history__header">
                <div>
                    <div className="simulation-history__title">
                        Simulaciones realizadas
                    </div>

                    <div className="simulation-history__description">
                        Compare corridas y abra el
                        análisis detallado de cualquier
                        ejecución.
                    </div>
                </div>
            </div>

            <HistoryStats summary={summary} />

            <Table
                dataSource={simulations}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                pageSize: 5,
                showSizeChanger: false,
                }}
                scroll={{
                x: 'max-content',
                }}
                rowClassName={record =>
                record.id === activeId
                    ? 'active-row'
                    : ''
                }
                locale={{
                emptyText: (
                    <span className="simulation-history__empty">
                    No hay simulaciones
                    registradas. Ejecute una
                    corrida desde el formulario
                    superior.
                    </span>
                ),
                }}
            />
        </Card>
    );
};

export default SimulationHistory;