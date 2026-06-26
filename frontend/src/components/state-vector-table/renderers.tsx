import { ReactNode } from "react";
import { SimulationLine } from "../../types/simulation-line";
import { StateBadge } from "../state-badge/StateBadge";
import { describeEncargadoState } from "../../utils/stateLabels";
import { Tooltip } from "antd";
import { formatClockSeconds } from "./formatters";

const renderMutedMonospace = (val: number | string | null | undefined, isRnd = false, decimals = 4, suffix = ''): ReactNode => {
	if (val === null || val === undefined) return <span style={{ color: '#94a3b8' }}>-</span>;
	const displayVal = typeof val === 'number' ? val.toFixed(decimals) : val;
	return (
		<span style={{
		fontFamily: 'monospace, var(--font-family)',
		color: isRnd ? '#64748b' : '#334155',
		fontSize: '11px',
		fontWeight: isRnd ? '400' : '600'
		}}>
		{displayVal}{suffix}
		</span>
	);
};

// Para renderizar los eventos: 

type EventStyle = [label: string, color: string, backgroundColor: string, borderColor: string];

const eventStyles: Record<string, EventStyle> = {
  inicializacion: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicialización: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicio: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  start: ['Inicialización', '#475569', '#f1f5f9', '#d9e2ec'],
  inicio_mantenimiento: ['Inicio Mantenimiento', '#92400e', '#fffbeb', '#fde68a'],
};

const renderEvent = (evt: string): ReactNode => {
	let [label, color, bgColor, borderColor] = eventStyles[evt] || [
		evt,
		'#2563eb',
		'#eff6ff',
		'#bfdbfe',
	];

	if (evt?.startsWith('fin_inscripcion PC')) {
		label = evt.replace('fin_inscripcion', 'Fin Inscripción');
		color = '#15803d';
		bgColor = '#ecfdf5';
		borderColor = '#bbf7d0';
	} else if (evt?.startsWith('fin_mantenimiento PC')) {
		label = evt.replace('fin_mantenimiento', 'Fin Mantenimiento');
		color = '#b45309';
		bgColor = '#fffbeb';
		borderColor = '#fde68a';
	} else if (evt?.startsWith('llegada_alumno')) {
		label = evt.replace('llegada_alumno', 'Llegada Alumno');
		color = '#2563eb';
		bgColor = '#eff6ff';
		borderColor = '#bfdbfe';
	} else if (evt?.startsWith('regreso_alumno')) {
		label = evt.replace('regreso_alumno', 'Regreso Alumno');
		color = '#0369a1';
		bgColor = '#f0f9ff';
		borderColor = '#bae6fd';
	}

	return (
		<span style={{
			display: 'inline-block',
			padding: '2px 6px',
			borderRadius: '4px',
			backgroundColor: bgColor,
			border: `1px solid ${borderColor}`,
			color,
			fontWeight: 600,
			fontSize: '11px',
			fontFamily: 'monospace'
		}}>
			{label}
		</span>
	);
};

const renderEncargadoState = (snapshot: SimulationLine['encargado_snapshot']): ReactNode => {
	if (!snapshot) return renderMutedMonospace(null);
	return <StateBadge meaning={describeEncargadoState(snapshot.state)} />;
};

const renderEncargadoPendientes = (snapshot: SimulationLine['encargado_snapshot']): ReactNode => {
	if (!snapshot?.pcs_pendientes_mantenimiento?.length) return renderMutedMonospace(null);
	return (
		<span style={{ color: '#92400e', fontWeight: 700, fontFamily: 'monospace', fontSize: '11px' }}>
		{snapshot.pcs_pendientes_mantenimiento.join(',')}
		</span>
	);
};

const renderEncargadoEsperandoDesde = (snapshot: SimulationLine['encargado_snapshot']): ReactNode => {
	if (!snapshot || snapshot.esperando_desde === null || snapshot.esperando_desde === undefined) {
		return renderMutedMonospace(null);
	}
	return renderMutedMonospace(snapshot.esperando_desde / 60, false, 2);
};

type ActiveStudent = SimulationLine['active_students_snapshot'][number];

const renderStudentCell = (
  students: SimulationLine['active_students_snapshot'],
  studentId: number,
  getValue: (student: ActiveStudent) => ReactNode,
): ReactNode => {
	const student = students?.find(s => s.id === studentId);
	if (!student) {
		return <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '11px' }}>-</span>;
	}
	return getValue(student);
};

const renderQueueLength = (len: number, limit: number): ReactNode => {
	let color = '#64748b';
	let bgColor = '#f8fafc';
	let border = '1px solid #d9e2ec';

	if (len > 0) {
		if (len >= limit) {
		color = '#b91c1c';
		bgColor = '#fef2f2';
		border = '1px solid #fecaca';
		} else if (len >= limit - 2) {
		color = '#b45309';
		bgColor = '#fffbeb';
		border = '1px solid #fde68a';
		} else {
		color = '#0369a1';
		bgColor = '#f0f9ff';
		border = '1px solid #bae6fd';
		}
	}

	return (
		<span style={{
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			minWidth: '22px',
			height: '18px',
			padding: '0 5px',
			borderRadius: '4px',
			backgroundColor: bgColor,
			border,
			color,
			fontWeight: '700',
			fontSize: '11px',
			fontFamily: 'monospace'
		}}>
			{len}
		</span>
	);
};

// Para renderizar las PCs: 

type PcVisual = [statusText: string, ledColor: string, ledGlow: string, border: string, pulseClass: string];

const pcVisuals: Record<string, PcVisual> = {
    idle: ['LIBRE', '#15803d', 'none', '#bbf7d0', ''],
    busy: ['OCUPADO', '#2563eb', 'none', '#bfdbfe', 'led-pulse-blue'],
    maintenance: ['MANTENIMIENTO', '#b45309', 'none', '#fde68a', 'led-pulse-orange'],
    L: ['LIBRE', '#15803d', 'none', '#bbf7d0', ''],
    I: ['INSCRIPCIÓN', '#2563eb', 'none', '#bfdbfe', 'led-pulse-blue'],
    M: ['MANTENIMIENTO', '#b45309', 'none', '#fde68a', 'led-pulse-orange'],
};

const renderPcStates = (pcStatesStr: string | null | undefined): ReactNode => {
	if (!pcStatesStr) return null;
	return (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
		{pcStatesStr.split(',').map((state, i) => {
			const [statusText, ledColor, ledGlow, border, pulseClass] = pcVisuals[state] || pcVisuals.idle;
			return (
			<Tooltip key={i} title={`PC ${i + 1}: ${statusText}`} mouseEnterDelay={0.05}>
				<div style={{
				display: 'inline-flex',
				alignItems: 'center',
				background: '#ffffff',
				border: `1px solid ${border}`,
				borderRadius: '5px',
				padding: '2px 5px',
				gap: '4px',
				height: '18px',
				boxShadow: 'none'
				}}>
				<span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>
					{i + 1}
				</span>
				<span
					className={pulseClass}
					style={{
					display: 'inline-block',
					width: '6px',
					height: '6px',
					borderRadius: '50%',
					backgroundColor: ledColor,
					boxShadow: ledGlow,
					}}
				/>
				</div>
			</Tooltip>
			);
		})}
		</div>
	);
};

const renderSinglePcState = (pcStatesStr: string | null | undefined, pcIndex: number): ReactNode => {
	if (!pcStatesStr) return <span style={{ color: '#94a3b8' }}>-</span>;
	const state = pcStatesStr.split(',')[pcIndex];
	if (!state) return <span style={{ color: '#94a3b8' }}>-</span>;
	const [statusText, ledColor, ledGlow, border, pulseClass] = pcVisuals[state] || pcVisuals.idle;
	return (
		<Tooltip title={`PC ${pcIndex + 1}: ${statusText}`} mouseEnterDelay={0.05}>
			<div style={{
				display: 'inline-flex',
				alignItems: 'center',
				background: '#ffffff',
				border: `1px solid ${border}`,
				borderRadius: '5px',
				padding: '2px 5px',
				gap: '4px',
				height: '18px',
				boxShadow: 'none'
			}}>
				<span
					className={pulseClass}
					style={{
						display: 'inline-block',
						width: '6px',
						height: '6px',
						borderRadius: '50%',
						backgroundColor: ledColor,
						boxShadow: ledGlow,
					}}
				/>
				<span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
					{statusText.charAt(0)}
				</span>
			</div>
		</Tooltip>
	);
};

const renderPcFinInscripcion = (
	snapshot: SimulationLine['pc_snapshot'],
	pcIndex: number,
): ReactNode => {
	const pc = snapshot?.[pcIndex];
	if (!pc || pc.fin_inscripcion === null || pc.fin_inscripcion === undefined) {
		return <span style={{ color: '#94a3b8' }}>-</span>;
	}
	return (
		<span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
			{formatClockSeconds(pc.fin_inscripcion)}
		</span>
	);
};

export {
	renderMutedMonospace,
	renderEvent,
	renderEncargadoState,
	renderEncargadoPendientes,
	renderEncargadoEsperandoDesde,
	renderStudentCell,
	renderQueueLength,
	renderPcStates,
	renderSinglePcState,
	renderPcFinInscripcion,
};

