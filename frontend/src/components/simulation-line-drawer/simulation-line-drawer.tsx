import {Descriptions, Drawer,Empty, Table, Tag,} from 'antd';
import { SimulationLine } from '../../types/simulation-line';
import Title from 'antd/es/typography/Title';
import { describeEncargadoState } from '../../utils/stateLabels';
import { StateBadge } from '../state-badge/StateBadge';
import { formatClock, formatMinutes, formatRnd } from './formatters';
import { pcColumns, studentColumns } from './columns';

export interface SimulationLineDrawerProps {
	line: SimulationLine | null;
	open: boolean;
	onClose: () => void;
}

export const SimulationLineDrawer = ({ line, open, onClose }: SimulationLineDrawerProps) => {
	const pendingPcs = line?.encargado_snapshot.pcs_pendientes_mantenimiento ?? [];

	return (
		<Drawer
		title={line ? `Línea ${line.line_index}` : 'Detalle de línea'}
		size={620}
		open={open}
		onClose={onClose}
		destroyOnHidden
		>
		{!line ? (
			<Empty description="Seleccione una línea para ver el detalle" />
		) : (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			<section>
				<Title level={5} style={{ marginTop: 0 }}>Evento</Title>
				<Descriptions bordered size="small" column={1}>
				<Descriptions.Item label="Evento">{line.event_name}</Descriptions.Item>
				<Descriptions.Item label="Reloj">{line.clock_formatted}</Descriptions.Item>
				<Descriptions.Item label="Segundo">{line.clock.toFixed(0)} s</Descriptions.Item>
				<Descriptions.Item label="Cola">{line.queue_length} alumnos</Descriptions.Item>
				<Descriptions.Item label="IDs en cola">
					{line.queue_student_ids.length > 0
					? line.queue_student_ids.map(id => `A${id}`).join(', ')
					: '-'}
				</Descriptions.Item>
				</Descriptions>
			</section>

			<section>
				<Title level={5} style={{ marginTop: 0 }}>Encargado</Title>
				<Descriptions bordered size="small" column={1}>
				<Descriptions.Item label="Estado">
					<StateBadge meaning={describeEncargadoState(line.encargado_snapshot.state)} />
				</Descriptions.Item>
				<Descriptions.Item label="PCs pendientes">
					{pendingPcs.length > 0
					? pendingPcs.map(pc => <Tag key={pc}>PC {pc}</Tag>)
					: '-'}
				</Descriptions.Item>
				<Descriptions.Item label="Esperando desde">
					{formatMinutes(line.encargado_snapshot.esperando_desde)}
				</Descriptions.Item>
				</Descriptions>
			</section>

			<section>
				<Title level={5} style={{ marginTop: 0 }}>PCs</Title>
				<Table
				size="small"
				columns={pcColumns}
				dataSource={line.pc_snapshot}
				rowKey="id"
				pagination={false}
				/>
			</section>

			<section>
				<Title level={5} style={{ marginTop: 0 }}>Alumnos activos</Title>
				{line.active_students_snapshot.length > 0 ? (
				<Table
					size="small"
					columns={studentColumns}
					dataSource={line.active_students_snapshot}
					rowKey="id"
					pagination={false}
				/>
				) : (
				<Empty description="No hay alumnos activos" />
				)}
			</section>

			<section>
				<Title level={5} style={{ marginTop: 0 }}>RND y tiempos</Title>
				<Descriptions bordered size="small" column={1}>
				<Descriptions.Item label="RND llegada">{formatRnd(line.student_rnd)}</Descriptions.Item>
				<Descriptions.Item label="Tiempo llegada">{formatMinutes(line.student_arrival_time)}</Descriptions.Item>
				<Descriptions.Item label="Próxima llegada">{formatClock(line.student_next_arrival_time)}</Descriptions.Item>
				<Descriptions.Item label="RND inscripción">{formatRnd(line.registration_rnd)}</Descriptions.Item>
				<Descriptions.Item label="Tiempo inscripción">{formatMinutes(line.registration_time)}</Descriptions.Item>
				<Descriptions.Item label="RND mantenimiento">{formatRnd(line.maintenance_rnd)}</Descriptions.Item>
				<Descriptions.Item label="Tiempo mantenimiento">{formatMinutes(line.maintenance_time)}</Descriptions.Item>
				<Descriptions.Item label="RND regreso técnico">{formatRnd(line.technician_return_rnd)}</Descriptions.Item>
				<Descriptions.Item label="Tiempo regreso técnico">{formatMinutes(line.technician_return_time)}</Descriptions.Item>
				<Descriptions.Item label="Inicio próximo mantenimiento">
					{formatClock(line.next_maintenance_start_time)}
				</Descriptions.Item>
				<Descriptions.Item label="Fin próximo mantenimiento">
					{formatClock(line.next_maintenance_complete_time)}
				</Descriptions.Item>
				</Descriptions>
			</section>
			</div>
		)}
		</Drawer>
	);
};
