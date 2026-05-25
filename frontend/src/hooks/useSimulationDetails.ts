import { useCallback, useEffect, useState } from 'react';
import { getSimulation, getSimulationLines, getSimulationPcStats } from '../api/simulations';
import type {
  PcUtilizationChartDatum,
  SimulationLine,
  SimulationSummary,
} from '../types/simulation';

const toPcUtilizationChartData = (pcs: Array<{ id: number; busy_time: number; maintenance_time: number; idle_time: number }>): PcUtilizationChartDatum[] => (
  pcs.map(pc => {
    const total = pc.busy_time + pc.maintenance_time + pc.idle_time;
    return {
      name: `PC ${pc.id}`,
      'Ocupado (%)': total > 0 ? parseFloat(((pc.busy_time / total) * 100).toFixed(1)) : 0,
      'Mantenimiento (%)': total > 0 ? parseFloat(((pc.maintenance_time / total) * 100).toFixed(1)) : 0,
      'Libre (%)': total > 0 ? parseFloat(((pc.idle_time / total) * 100).toFixed(1)) : 0,
    };
  })
);

export const useSimulationDetails = (simulationId: number | null) => {
  const [simulation, setSimulation] = useState<SimulationSummary | null>(null);
  const [lines, setLines] = useState<SimulationLine[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [pcUtilization, setPcUtilization] = useState<PcUtilizationChartDatum[]>([]);

  const fetchDetails = useCallback(async () => {
    if (simulationId === null) return;

    setLoadingDetails(true);
    try {
      const res = await getSimulation(simulationId);
      setSimulation(res.data);
    } catch (err) {
      console.error('Error fetching simulation details', err);
    } finally {
      setLoadingDetails(false);
    }
  }, [simulationId]);

  const fetchPcStats = useCallback(async () => {
    if (simulationId === null) return;

    try {
      const res = await getSimulationPcStats(simulationId);
      setPcUtilization(toPcUtilizationChartData(res.data));
    } catch (err) {
      console.error('Error fetching PC utilization', err);
    }
  }, [simulationId]);

  const fetchLines = useCallback(async () => {
    if (simulationId === null) return;

    setLoadingLines(true);
    try {
      const res = await getSimulationLines(simulationId, { page, limit: pageSize });
      setLines(res.data.items);
      setTotalLines(res.data.total);
    } catch (err) {
      console.error('Error fetching simulation lines', err);
    } finally {
      setLoadingLines(false);
    }
  }, [simulationId, page, pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      setPage(1);
      setSimulation(null);
      setLines([]);
      setPcUtilization([]);
    });
  }, [simulationId]);

  useEffect(() => {
    if (simulationId !== null) {
      queueMicrotask(() => {
        fetchDetails();
        fetchPcStats();
      });
    }
  }, [simulationId, fetchDetails, fetchPcStats]);

  useEffect(() => {
    if (simulationId !== null) {
      queueMicrotask(fetchLines);
    }
  }, [simulationId, fetchLines]);

  return {
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
  };
};
