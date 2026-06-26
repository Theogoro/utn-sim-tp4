import { ColumnsType } from "antd/es/table";
import { SimulationLine } from "../../types/simulation-line";
import { ClockCircleOutlined, ExperimentOutlined, LaptopOutlined, SettingOutlined, TeamOutlined, ToolOutlined } from "@ant-design/icons";
import { renderEncargadoEsperandoDesde, renderEncargadoPendientes, renderEncargadoState, renderEvent, renderMutedMonospace, renderSinglePcState, renderPcFinInscripcion, renderQueueLength, renderStudentCell } from "./renderers";
import { StateBadge } from "../state-badge/StateBadge";
import { describeStudentState } from "../../utils/stateLabels";
import { Typography } from "antd";
import { formatClockSeconds } from "./formatters";

const { Text } = Typography;

const createColumns = (queueLimit: number, numPcs: number): ColumnsType<SimulationLine> => [
	{
		title: <span style={{ fontSize: '11px', color: '#64748b' }}>Índice</span>,
		dataIndex: 'line_index',
		key: 'line_index',
		width: 75,
		fixed: 'left',
		onHeaderCell: () => ({ className: 'header-col-general' }),
		render: (idx: number) => <Text style={{ color: '#334155', fontFamily: 'monospace', fontSize: '11px' }}>{idx}</Text>
	},
	{
		title: <span style={{ fontSize: '11px', color: '#334155' }}><SettingOutlined /> Evento</span>,
		dataIndex: 'event_name',
		key: 'event_name',
		width: 210,
		fixed: 'left',
		onHeaderCell: () => ({ className: 'header-col-general' }),
		render: renderEvent
	},
	{
		title: <span style={{ fontSize: '11px', color: '#334155' }}><ClockCircleOutlined /> Reloj</span>,
		dataIndex: 'clock_formatted',
		key: 'clock_formatted',
		width: 100,
		fixed: 'left',
		onHeaderCell: () => ({ className: 'header-col-general' }),
		render: (t: string) => <strong style={{ color: '#1d4ed8', fontFamily: 'monospace', fontSize: '11px' }}>{t}</strong>
	},
	{
		title: <span style={{ fontSize: '11px', color: '#334155' }}><TeamOutlined /> Cola</span>,
		dataIndex: 'queue_length',
		key: 'queue_length',
		width: 75,
		onHeaderCell: () => ({ className: 'header-col-general' }),
		render: (len: number) => renderQueueLength(len, queueLimit)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#92400e' }}><ToolOutlined /> Encargado</span>,
		key: 'encargado_group',
		onHeaderCell: () => ({ className: 'header-col-maintenance' }),
		children: [
			{
				title: <span style={{ fontSize: '11px', color: '#92400e' }}>Estado</span>,
				dataIndex: 'encargado_snapshot',
				key: 'encargado_state',
				width: 110,
				onHeaderCell: () => ({ className: 'header-col-maintenance' }),
				onCell: () => ({ className: 'cell-col-maintenance' }),
				render: renderEncargadoState
			},
			{
				title: <span style={{ fontSize: '11px', color: '#92400e' }}>PCs Pendientes</span>,
				dataIndex: 'encargado_snapshot',
				key: 'encargado_pending',
				width: 115,
				onHeaderCell: () => ({ className: 'header-col-maintenance' }),
				onCell: () => ({ className: 'cell-col-maintenance' }),
				render: renderEncargadoPendientes
			},
			{
				title: <span style={{ fontSize: '11px', color: '#92400e' }}>Esperando PC desde</span>,
				dataIndex: 'encargado_snapshot',
				key: 'encargado_waiting_since',
				width: 125,
				onHeaderCell: () => ({ className: 'header-col-maintenance' }),
				onCell: () => ({ className: 'cell-col-maintenance' }),
				render: renderEncargadoEsperandoDesde
			},
		],
	},
	{
		title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}><ExperimentOutlined /> RND Lleg.</span>,
		dataIndex: 'student_rnd',
		key: 'student_rnd',
		width: 110,
		onHeaderCell: () => ({ className: 'header-col-students' }),
		onCell: () => ({ className: 'cell-col-students' }),
		render: (val: number | null) => renderMutedMonospace(val, true, 4)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Tpo Llegada (min)</span>,
		dataIndex: 'student_arrival_time',
		key: 'student_arrival_time',
		width: 135,
		onHeaderCell: () => ({ className: 'header-col-students' }),
		onCell: () => ({ className: 'cell-col-students' }),
		render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : 
			renderMutedMonospace(null)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Próx. Llegada</span>,
		dataIndex: 'student_next_arrival_time',
		key: 'student_next_arrival_time',
		width: 115,
		onHeaderCell: () => ({ className: 'header-col-students' }),
		onCell: () => ({ className: 'cell-col-students' }),
		render: (val: number | null) => val !== null ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1d4ed8' }}>
			{formatClockSeconds(val)}
		</span> : renderMutedMonospace(null)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Alumnos Rech.</span>,
		dataIndex: 'total_students_returned',
		key: 'total_students_returned',
		width: 110,
		onHeaderCell: () => ({ className: 'header-col-students' }),
		onCell: () => ({ className: 'cell-col-students' }),
		render: (val: number) => val > 0 ? <span style={{ color: '#b91c1c', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }}>
			{val}
		</span> : 
		<span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>	
			0
		</span>
	},
	{
		title: <span style={{ fontSize: '11px', color: '#166534' }}><LaptopOutlined /> Servidores</span>,
		key: 'pc_group',
		onHeaderCell: () => ({ className: 'header-col-computers' }),
		children: Array.from({ length: numPcs }, (_, i) => i + 1).map(n => ({
			title: <span style={{ fontSize: '11px', color: '#166534' }}>PC {n}</span>,
			key: `pc_${n}_group`,
			onHeaderCell: () => ({ className: 'header-col-computers' }),
			children: [
				{
					title: <span style={{ fontSize: '11px', color: '#166534' }}>Estado</span>,
					dataIndex: 'pc_states',
					key: `pc_${n}_state`,
					width: 60,
					onHeaderCell: () => ({ className: 'header-col-computers' }),
					onCell: () => ({ className: 'cell-col-computers' }),
					render: (val: string) => renderSinglePcState(val, n - 1),
				},
				{
					title: <span style={{ fontSize: '11px', color: '#166534' }}>Fin Insc.</span>,
					dataIndex: 'pc_snapshot',
					key: `pc_${n}_fin`,
					width: 95,
					onHeaderCell: () => ({ className: 'header-col-computers' }),
					onCell: () => ({ className: 'cell-col-computers' }),
					render: (snapshot: SimulationLine['pc_snapshot']) => renderPcFinInscripcion(snapshot, n - 1),
				},
			],
		})),
	},
	{
		title: <span style={{ fontSize: '11px', color: '#166534' }}><ExperimentOutlined /> RND Insc.</span>,
		dataIndex: 'registration_rnd',
		key: 'registration_rnd',
		width: 105,
		onHeaderCell: () => ({ className: 'header-col-computers' }),
		onCell: () => ({ className: 'cell-col-computers' }),
		render: (val: number | null) => renderMutedMonospace(val, true, 4)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#166534' }}>Tpo Insc. (min)</span>,
		dataIndex: 'registration_time',
		key: 'registration_time',
		width: 120,
		onHeaderCell: () => ({ className: 'header-col-computers' }),
		onCell: () => ({ className: 'cell-col-computers' }),
		render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : 
			renderMutedMonospace(null)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#166534' }}>Insc. Comp.</span>,
		dataIndex: 'registrations_completed',
		key: 'registrations_completed',
		width: 110,
		onHeaderCell: () => ({ className: 'header-col-computers' }),
		onCell: () => ({ className: 'cell-col-computers' }),
		render: (val: number) => 	
			<Text style={{ color: '#15803d', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '11px' }
				}>{val}
			</Text>
	},
	{
		title: <span style={{ fontSize: '11px', color: '#92400e' }}><ExperimentOutlined /> RND Mant.</span>,
		dataIndex: 'maintenance_rnd',
		key: 'maintenance_rnd',
		width: 105,
		onHeaderCell: () => ({ className: 'header-col-maintenance' }),
		onCell: () => ({ className: 'cell-col-maintenance' }),
		render: (val: number | null) => renderMutedMonospace(val, true, 4)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#92400e' }}>Tpo Mant. (min)</span>,
		dataIndex: 'maintenance_time',
		key: 'maintenance_time',
		width: 120,
		onHeaderCell: () => ({ className: 'header-col-maintenance' }),
		onCell: () => ({ className: 'cell-col-maintenance' }),
		render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : 
			renderMutedMonospace(null)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#92400e' }}><ExperimentOutlined /> RND Regreso Téc.</span>,
		dataIndex: 'technician_return_rnd',
		key: 'technician_return_rnd',
		width: 135,
		onHeaderCell: () => ({ className: 'header-col-maintenance' }),
		onCell: () => ({ className: 'cell-col-maintenance' }),
		render: (val: number | null) => renderMutedMonospace(val, true, 4)
	},
	{
		title: <span style={{ fontSize: '11px', color: '#92400e' }}>Tpo Regreso Téc. (min)</span>,
		dataIndex: 'technician_return_time',
		key: 'technician_return_time',
		width: 145,
		onHeaderCell: () => ({ className: 'header-col-maintenance' }),
		onCell: () => ({ className: 'cell-col-maintenance' }),
		render: (val: number | null) => val !== null ? renderMutedMonospace(val / 60, false, 2, ' min') : 
			renderMutedMonospace(null)
	}
];

const createStudentColumns = (studentIds: number[]): ColumnsType<SimulationLine> =>
	studentIds.map(studentId => ({
		title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}><TeamOutlined /> Alumno {studentId}</span>,
		key: `student_${studentId}`,
		onHeaderCell: () => ({ className: 'header-col-students' }),
		children: [
		{
			title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Estado</span>,
			dataIndex: 'active_students_snapshot',
			key: `student_${studentId}_state`,
			width: 95,
			onHeaderCell: () => ({ className: 'header-col-students' }),
			onCell: () => ({ className: 'cell-col-students' }),
			render: (students: SimulationLine['active_students_snapshot']) =>
			renderStudentCell(students, studentId, student => <StateBadge meaning={describeStudentState(student.state)} />)
		},
		{
			title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Min de regreso</span>,
			dataIndex: 'active_students_snapshot',
			key: `student_${studentId}_return_minute`,
			width: 105,
			onHeaderCell: () => ({ className: 'header-col-students' }),
			onCell: () => ({ className: 'cell-col-students' }),
			render: (students: SimulationLine['active_students_snapshot']) =>
			renderStudentCell(students, studentId, student =>
				renderMutedMonospace(student.minuto_vuelta !== null ? student.minuto_vuelta : null, false, 2))
		},
		{
			title: <span style={{ fontSize: '11px', color: '#1d4ed8' }}>Esperando en fila desde</span>,
			dataIndex: 'active_students_snapshot',
			key: `student_${studentId}_queue_since`,
			width: 130,
			onHeaderCell: () => ({ className: 'header-col-students' }),
			onCell: () => ({ className: 'cell-col-students' }),
			render: (students: SimulationLine['active_students_snapshot']) =>
			renderStudentCell(students, studentId, student =>
				renderMutedMonospace(student.esperando_en_fila_desde !== null ? student.esperando_en_fila_desde : null, false, 2))
		},
		],
  }));

export {
	createColumns,
	createStudentColumns
}