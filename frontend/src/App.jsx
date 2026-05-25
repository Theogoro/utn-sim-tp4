import React, { useState, useEffect } from 'react';
import { Layout, Typography, Space, message, ConfigProvider, theme, Tag } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

import SimulationForm from './components/SimulationForm';
import SimulationHistory from './components/SimulationHistory';
import SimulationDetails from './components/SimulationDetails';
import { createSimulation, deleteSimulation, listSimulations } from './api/simulations';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const [simulations, setSimulations] = useState([]);
  const [activeSimulationId, setActiveSimulationId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    setLoadingList(true);
    try {
      const res = await listSimulations();
      setSimulations(res.data);
      
      // Auto-select the latest simulation if none selected and simulations exist
      if (res.data.length > 0 && !activeSimulationId) {
        setActiveSimulationId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      message.error("Error al cargar el historial de simulaciones.");
    } finally {
      setLoadingList(false);
    }
  };

  const handleRunSimulation = async (params) => {
    setLoadingSubmit(true);
    const key = 'simulating';
    message.loading({ content: 'Ejecutando Simulación de Eventos Discretos (FEL)... esto puede tardar un momento...', key, duration: 0 });
    try {
      const res = await createSimulation(params);
      message.success({ content: `¡Simulación #${res.data.id} completada y registrada con éxito!`, key, duration: 4 });
      
      // Update list
      setSimulations(prev => [res.data, ...prev]);
      // Select the new simulation details
      setActiveSimulationId(res.data.id);
    } catch (err) {
      console.error(err);
      message.error({ content: 'La simulación falló. Verifique los parámetros e intente nuevamente.', key, duration: 4 });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteSimulation = async (id) => {
    try {
      await deleteSimulation(id);
      message.success("Simulación eliminada correctamente.");
      
      // Remove from state
      setSimulations(prev => prev.filter(sim => sim.id !== id));
      
      // If deleted active selection, clear or auto-select another
      if (activeSimulationId === id) {
        setActiveSimulationId(null);
      }
    } catch (err) {
      console.error(err);
      message.error("Error al eliminar la simulación.");
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        {/* Sleek App Header */}
        <Header style={{ 
          background: 'rgba(9, 13, 22, 0.75)', 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 64
        }}>
          <Space align="center" size="middle">
            <ExperimentOutlined style={{ fontSize: 24, color: '#6366f1' }} className="glow-text" />
            <div>
              <Title level={4} style={{ margin: 0, color: '#f8fafc', fontWeight: 600 }}>
                Inscripciones UTN
              </Title>
              <Text style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginTop: -6 }}>
                Simulador de Eventos Discretos & Vector de Estados
              </Text>
            </div>
          </Space>
          
          <Space>
            <Tag color="purple" style={{ margin: 0 }}>UTN - FRC - 2026</Tag>
          </Space>
        </Header>

        {/* Content Wrapper */}
        <Content style={{ padding: '32px 24px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          <SimulationForm onSubmit={handleRunSimulation} loading={loadingSubmit} />
          
          <SimulationHistory 
            simulations={simulations} 
            onSelect={setActiveSimulationId} 
            onDelete={handleDeleteSimulation}
            activeId={activeSimulationId}
            loading={loadingList}
          />
          
          <SimulationDetails simulationId={activeSimulationId} />
        </Content>

        {/* Elegant Footer */}
        <Footer style={{ 
          textAlign: 'center', 
          background: 'rgba(9, 13, 22, 0.5)', 
          color: '#64748b', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '24px 0'
        }}>
          Plataforma de Simulación de Inscripciones UTN &copy; 2026. Desarrollada con FastAPI, SQLite, React y Ant Design.
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
