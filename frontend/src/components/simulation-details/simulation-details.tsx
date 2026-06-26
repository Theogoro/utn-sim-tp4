import { useState } from 'react';
import {Card,Tabs,Empty,Spin,Button,message} from 'antd';
import {BarChartOutlined, TableOutlined,FileExcelOutlined} from '@ant-design/icons';
import styles from "./style.module.css";
import { useSimulationDetails } from '../../hooks/useSimulationDetails';
import { exportSimulationXlsx } from '../../api/simulations';
import OverviewTab from './overview-tab';
import TraceTab from './trace-tab';
import StateVectorTable from '../state-vector-table/state-vector-table';

interface SimulationDetailsProps {
  simulationId: number | null;
}

const SimulationDetails = ({
  simulationId,
}: SimulationDetailsProps) => {
    const {
        simulation,
        lines,
        totalLines,
        page,
        pageSize,
        loadingDetails,
        loadingLines,
        pcUtilization,
        setPage,
        setPageSize,
    } = useSimulationDetails(simulationId);

    const [exporting, setExporting] =
        useState(false);

    const handleExport = async () => {
        if (!simulationId) {
            return;
        }

        setExporting(true);

        try {
            const res =
                await exportSimulationXlsx(
                simulationId,
                );

            const blob = new Blob(
                [res.data],
                    {
                    type:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    },
            );

            const url =
                window.URL.createObjectURL(blob);

            const a =
                document.createElement('a');

            a.href = url;

            a.download = `simulacion_${simulationId}.xlsx`;

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

            message.success(
                'Excel descargado',
            );
        } 
        catch {
            message.error(
                'No se pudo exportar la simulación',
            );
        } 
        finally {
            setExporting(false);
        }
    };

    if (!simulationId) {
        return (
            <Card
                className="glass-panel"
            >
                <div
                    className={
                        styles.centerContainer
                    }
                >
                    <Empty
                        description={
                        <span
                            className={
                            styles.emptyText
                            }
                        >
                            Seleccione una simulación
                            del historial para ver el
                            análisis detallado.
                        </span>
                        }
                    />
                </div>
            </Card>
        );
    }

    if (
        loadingDetails &&
        !simulation
    ) {
        return (
        <Card
            className="glass-panel"
        >
            <div
                className={
                    styles.centerContainer
                }
            >
                <Spin size="large" />

                <div
                    className={
                    styles.loadingText
                    }
                >
                    Cargando análisis…
                </div>
            </div>
        </Card>
        );
  }

    if (!simulation) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
        <div
            className={styles.header}
        >
            <div
            className="section-heading"
            >
            <BarChartOutlined />

            Análisis · Simulación #
            {simulation.id}
            </div>

            {/* <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            loading={exporting}
            className={
                styles.exportButton
            }
            >
            Descargar Excel
            </Button> */}
        </div>

        <Tabs
            defaultActiveKey="overview"
            size="large"
            items={[
            {
                key: 'overview',

                label: (
                <span
                    className={
                    styles.tabLabel
                    }
                >
                    <BarChartOutlined />
                    Resumen
                </span>
                ),

                children: (
                <OverviewTab
                    simulation={
                    simulation
                    }
                    pcUtilization={
                    pcUtilization
                    }
                />
                ),
            },

            {
                key: 'trace',

                label: (
                    <span
                        className={
                        styles.tabLabel
                        }
                    >
                        <TableOutlined />
                        Vector de estados
                    </span>
                ),

                children: (
                    <TraceTab>
                        <StateVectorTable
                            lines={lines}
                            loading={
                                loadingLines
                            }
                            page={page}
                            pageSize={
                                pageSize
                            }
                            total={
                                totalLines
                            }
                            queueLimit={
                                simulation.student_wait_threshold
                            }
                            onPageChange={(
                                p,
                                ps,
                            ) => {
                                setPage(p);

                                setPageSize(ps);
                            }}
                        />
                    </TraceTab>
                    ),
            },
            ]}
        />
        </div>
    );
};

export default SimulationDetails;