import {Descriptions,Typography,} from 'antd';
import { SimulationLine } from '../../../types/simulation-line';

const { Title } = Typography;

interface Props {
    line: SimulationLine;
}

const EventSection = ({
  line,
}: Props) => {
    return (
        <section>
        <Title level={5}>
            Evento
        </Title>

        <Descriptions
            bordered
            size="small"
            column={1}
        >
            <Descriptions.Item label="Evento">
                {line.event_name}
            </Descriptions.Item>

            <Descriptions.Item label="Reloj">
                {line.clock_formatted}
            </Descriptions.Item>

            <Descriptions.Item label="Segundo">
                {line.clock.toFixed(0)} s
            </Descriptions.Item>

            <Descriptions.Item label="Cola">
                {line.queue_length}{' '}
            alumnos
            </Descriptions.Item>

            <Descriptions.Item label="IDs en cola">
                {line.queue_student_ids
                    .length > 0
                    ? line.queue_student_ids
                        .map(
                        id => `A${id}`,
                        )
                        .join(', ')
                    : '-'
                }
            </Descriptions.Item>
        </Descriptions>
        </section>
    );
};

export default EventSection;