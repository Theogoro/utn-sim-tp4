import {Empty,Table,Typography} from 'antd';
import {studentColumns,} from '../columns';
import { SimulationLine } from '../../../types/simulation-line';

const { Title } = Typography;

interface Props {
  line: SimulationLine;
}

const StudentsSection = ({
  line,
}: Props) => {
    return (
        <section>
        <Title level={5}>
            Alumnos activos
        </Title>

        {line
            .active_students_snapshot
            .length > 0 ? (
            <Table
            size="small"
            columns={
                studentColumns
            }
            dataSource={
                line.active_students_snapshot
            }
            rowKey="id"
            pagination={false}
            />
        ) : (
            <Empty description="No hay alumnos activos" />
        )}
        </section>
    );
};

export default StudentsSection;