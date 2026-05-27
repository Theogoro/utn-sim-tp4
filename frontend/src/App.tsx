import { Layout, ConfigProvider, theme } from 'antd';
import { ExperimentOutlined, GithubOutlined } from '@ant-design/icons';

import SimulationForm from './components/SimulationForm';
import SimulationHistory from './components/SimulationHistory';
import SimulationDetails from './components/SimulationDetails';
import { useSimulationHistory } from './hooks/useSimulationHistory';

const { Header, Content, Footer } = Layout;

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
          colorPrimary: '#818cf8',
          colorBgBase: '#161c2e',
          colorBgContainer: '#1f2538',
          colorBgElevated: '#232a40',
          colorBorder: 'rgba(148, 163, 184, 0.18)',
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          borderRadius: 10,
          fontSize: 14,
        },
        components: {
          Card: { borderRadiusLG: 14 },
          Button: { controlHeight: 36 },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Header className="app-header">
          <div className="app-header-inner">
            <div className="brand-block">
              <span className="brand-logo">
                <ExperimentOutlined />
              </span>
              <div className="brand-text">
                <div className="brand-title">
                  Inscripciones UTN
                </div>
                <div className="brand-sub">
                  Simulador de Eventos Discretos
                </div>
              </div>
            </div>

            <div className="header-actions">
              <span className="hero-badge status-badge">
                <span className="dot" />
                Backend conectado
              </span>
              <a
                href="https://github.com/Theogoro/utn-sim-tp4"
                target="_blank"
                rel="noreferrer"
                className="icon-btn"
                aria-label="GitHub"
                title="Código fuente"
              >
                <GithubOutlined />
              </a>
            </div>
          </div>
        </Header>

        <Content className="app-content">
          <section className="page-hero">
            <div>
              <div className="hero-eyebrow">TP Integrador · Sistemas de Simulación · 2026</div>
              <h1>Simulador de Inscripciones <span className="brand-mark">UTN-FRC</span></h1>
              <p>
                Modelo de eventos discretos para analizar colas, utilización de PCs y
                tolerancia de alumnos. Ejecute corridas, compare resultados y explore
                el vector de estados al detalle.
              </p>
            </div>
          </section>

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

        <Footer className="app-footer">
          UTN-FRC · Plataforma de Simulación &copy; 2026 · FastAPI · SQLite · React · Ant Design
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
