import { Layout, ConfigProvider, theme } from 'antd';
import { ExperimentOutlined, GithubOutlined } from '@ant-design/icons';

import { useSimulationHistory } from './hooks/useSimulationHistory';
import SimulationHistory from './components/simulation-history/simulation-history';
import SimulationForm from './components/simulation-form/simulation-form';
import SimulationDetails from './components/simulation-details/simulation-details';
import StateLegend from './components/state-legend/state-legend';
import Enunciado from './components/enunciado/enunciado';

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
			algorithm: theme.defaultAlgorithm,
			token: {
			colorPrimary: '#2563eb',
			colorBgBase: '#f6f8fb',
			colorBgContainer: '#ffffff',
			colorBgElevated: '#ffffff',
			colorBorder: '#d9e2ec',
			colorText: '#0f172a',
			colorTextSecondary: '#334155',
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
					<div className="hero-eyebrow">
					TP Integrador · Grupo N° 1 · Sistemas de Simulación · 2026
					</div>

					<h1>
					Simulador de Inscripciones
					<span className="brand-mark">
						{' '}UTN-FRC
					</span>
					</h1>

					<p>
					Modelo de eventos discretos para analizar colas,
					utilización de PCs y tolerancia de alumnos.
					Ejecute corridas, compare resultados y explore
					el vector de estados al detalle.
					</p>
				</div>
				</section>

				<div className="simulation-layout">

				<Enunciado />

				<SimulationForm
					onSubmit={runSimulation}
					loading={loadingSubmit}
				/>

				<StateLegend />

				<SimulationHistory
					simulations={simulations}
					onSelect={setActiveSimulationId}
					onDelete={removeSimulation}
					activeId={activeSimulationId}
					loading={loadingList}
				/>

				<SimulationDetails
					simulationId={activeSimulationId}
				/>

				</div>

			</Content>

			<Footer className="app-footer">
			UTN-FRC · Plataforma de Simulación &copy; 2026 · FastAPI · SQLite · React · Ant Design
			</Footer>
		</Layout>
		</ConfigProvider>
	);
};

export default App;
