import axios from 'axios';
import type {
  PaginatedSimulationLines,
  PaginatedSimulationStudents,
  PcUtilization,
  SimulationParams,
  SimulationSummary,
} from '../types/simulation';

const API_URL = 'http://127.0.0.1:8000/api';

export const listSimulations = () => axios.get<SimulationSummary[]>(`${API_URL}/simulations`);

export const createSimulation = (params: SimulationParams) => axios.post<SimulationSummary>(`${API_URL}/simulations`, params);

export const deleteSimulation = (id: number) => axios.delete(`${API_URL}/simulations/${id}`);

export const getSimulation = (id: number) => axios.get<SimulationSummary>(`${API_URL}/simulations/${id}`);

export const getSimulationLines = (id: number, { page, limit }: { page: number; limit: number }) => (
  axios.get<PaginatedSimulationLines>(`${API_URL}/simulations/${id}/lines`, {
    params: { page, limit },
  })
);

export const getSimulationPcStats = (id: number) => axios.get<PcUtilization[]>(`${API_URL}/simulations/${id}/pc_stats`);

export const getSimulationStudents = (id: number, { page, limit }: { page: number; limit: number }) => (
  axios.get<PaginatedSimulationStudents>(`${API_URL}/simulations/${id}/students`, {
    params: { page, limit },
  })
);

export const exportSimulationXlsx = (id: number) => (
  axios.get<Blob>(`${API_URL}/simulations/${id}/export`, { responseType: 'blob' })
);
