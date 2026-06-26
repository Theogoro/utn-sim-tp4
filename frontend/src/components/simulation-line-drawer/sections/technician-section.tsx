import {Descriptions,Tag,Typography,} from 'antd';
import {describeEncargadoState,} from '../../../utils/stateLabels';
import { formatMinutes,} from '../formatters';
import { SimulationLine } from '../../../types/simulation-line';
import { StateBadge } from '../../state-badge/StateBadge';

const { Title } = Typography;

interface Props {
  line: SimulationLine;
}

const TechnicianSection = ({
  line,
}: Props) => {
	const pendingPcs =
		line.encargado_snapshot
		.pcs_pendientes_mantenimiento ??
		[];

	return (
		<section>
		<Title level={5}>
			Encargado
		</Title>

		<Descriptions
			bordered
			size="small"
			column={1}
		>
			<Descriptions.Item label="Estado">
			<StateBadge
				meaning={describeEncargadoState(
				line
					.encargado_snapshot
					.state,
				)}
			/>
			</Descriptions.Item>

			<Descriptions.Item label="PCs pendientes">
			{pendingPcs.length > 0
				? pendingPcs.map(pc => (
					<Tag key={pc}>
					PC {pc}
					</Tag>
				))
				: '-'}
			</Descriptions.Item>

			<Descriptions.Item label="Esperando desde">
			{formatMinutes(
				line
				.encargado_snapshot
				.esperando_desde,
			)}
			</Descriptions.Item>
		</Descriptions>
		</section>
	);
};

export default TechnicianSection;