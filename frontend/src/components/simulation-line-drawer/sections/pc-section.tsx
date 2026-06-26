import {Table,Typography,} from 'antd';
import { pcColumns } from '../columns';
import { SimulationLine } from '../../../types/simulation-line';

const { Title } = Typography;

interface Props {
  line: SimulationLine;
}

const PcSection = ({
  line,
}: Props) => {
	return (
		<section>
			<Title level={5}>
				PCs
			</Title>

			<Table
				size="small"
				columns={pcColumns}
				dataSource={
				line.pc_snapshot
				}
				rowKey="id"
				pagination={false}
			/>
		</section>
	);
};

export default PcSection;