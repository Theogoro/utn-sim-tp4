import { Layout, Typography, Space, ConfigProvider, theme, Tag } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

import SimulationForm from './components/SimulationForm';
import SimulationHistory from './components/SimulationHistory';
import SimulationDetails from './components/SimulationDetails';
import { useSimulationHistory } from './hooks/useSimulationHistory';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const {
    simulations,
    activeSimulationId,
    loadingList,
    loadingSubmit,
    setActiveSimulationId,
    runSimulation,
    removeSimulation,
  } = useSimulationHistory();

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
          <SimulationForm onSubmit={runSimulation} loading={loadingSubmit} />
          
          <SimulationHistory 
            simulations={simulations} 
            onSelect={setActiveSimulationId} 
            onDelete={removeSimulation}
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
