import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const listSimulations = () => axios.get(`${API_URL}/simulations`);

export const createSimulation = (params) => axios.post(`${API_URL}/simulations`, params);

export const deleteSimulation = (id) => axios.delete(`${API_URL}/simulations/${id}`);

export const getSimulation = (id) => axios.get(`${API_URL}/simulations/${id}`);

export const getSimulationLines = (id, { page, limit }) => (
  axios.get(`${API_URL}/simulations/${id}/lines`, {
    params: { page, limit },
  })
);

export const getSimulationPcStats = (id) => axios.get(`${API_URL}/simulations/${id}/pc_stats`);
