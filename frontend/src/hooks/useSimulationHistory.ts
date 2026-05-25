import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { createSimulation, deleteSimulation, listSimulations } from '../api/simulations';
import type { SimulationParams, SimulationSummary } from '../types/simulation';

export const useSimulationHistory = () => {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [activeSimulationId, setActiveSimulationId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const fetchSimulations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await listSimulations();
      setSimulations(res.data);

      if (res.data.length > 0) {
        setActiveSimulationId(currentId => currentId ?? res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      message.error('Error al cargar el historial de simulaciones.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(fetchSimulations);
  }, [fetchSimulations]);

  const runSimulation = async (params: SimulationParams) => {
    setLoadingSubmit(true);
    const key = 'simulating';
    message.loading({ content: 'Ejecutando Simulación de Eventos Discretos (FEL)... esto puede tardar un momento...', key, duration: 0 });
    try {
      const res = await createSimulation(params);
      message.success({ content: `¡Simulación #${res.data.id} completada y registrada con éxito!`, key, duration: 4 });

      setSimulations(prev => [res.data, ...prev]);
      setActiveSimulationId(res.data.id);
    } catch (err) {
      console.error(err);
      message.error({ content: 'La simulación falló. Verifique los parámetros e intente nuevamente.', key, duration: 4 });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const removeSimulation = async (id: number) => {
    try {
      await deleteSimulation(id);
      message.success('Simulación eliminada correctamente.');

      setSimulations(prev => prev.filter(sim => sim.id !== id));
      setActiveSimulationId(currentId => (currentId === id ? null : currentId));
    } catch (err) {
      console.error(err);
      message.error('Error al eliminar la simulación.');
    }
  };

  return {
    simulations,
    activeSimulationId,
    loadingList,
    loadingSubmit,
    setActiveSimulationId,
    runSimulation,
    removeSimulation,
  };
};
