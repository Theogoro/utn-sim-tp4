import {Descriptions,Typography,} from 'antd';
import {formatClock,formatMinutes,formatRnd,} from '../formatters';
import { SimulationLine } from '../../../types/simulation-line';

const { Title } = Typography;

interface Props {
  line: SimulationLine;
}

const RndSection = ({
  line,
}: Props) => {
	return (
		<section>
		<Title level={5}>
			RND y tiempos
		</Title>

		<Descriptions
			bordered
			size="small"
			column={1}
		>
			<Descriptions.Item label="RND llegada">
			{formatRnd(
				line.student_rnd,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="Tiempo llegada">
			{formatMinutes(
				line.student_arrival_time,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="Próxima llegada">
			{formatClock(
				line.student_next_arrival_time,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="RND inscripción">
			{formatRnd(
				line.registration_rnd,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="Tiempo inscripción">
			{formatMinutes(
				line.registration_time,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="RND mantenimiento">
			{formatRnd(
				line.maintenance_rnd,
			)}
			</Descriptions.Item>

			<Descriptions.Item label="Tiempo mantenimiento">
			{formatMinutes(
				line.maintenance_time,
			)}
			</Descriptions.Item>
		</Descriptions>
		</section>
	);
};

export default RndSection;