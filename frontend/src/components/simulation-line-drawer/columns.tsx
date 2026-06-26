import { Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { StateBadge } from '../state-badge/StateBadge';
import { SimulationLine } from '../../types/simulation-line';
import { describeStudentState } from '../../utils/stateLabels';
import { pcStateLabels } from './pc-states-labels';
import { formatMinutes } from './formatters';

const { Text } = Typography;

const pcColumns: ColumnsType<
  SimulationLine['pc_snapshot'][number]
> = [
  {
    title: 'PC',

    dataIndex: 'id',

    key: 'id',

    render: (id: number) => (
      <Text strong>{id}</Text>
    ),
  },

  {
    title: 'Estado',

    dataIndex: 'state',

    key: 'state',

    render: (state: string) => {
      const visual =
        pcStateLabels[state] ?? {
          label: state,
          color: 'default',
        };

      return (
        <Tag color={visual.color}>
          {visual.label}
        </Tag>
      );
    },
  },
];

const studentColumns: ColumnsType<
  SimulationLine['active_students_snapshot'][number]
> = [
  {
    title: 'Alumno',

    dataIndex: 'id',

    key: 'id',

    render: (id: number) => (
      <Text strong>A{id}</Text>
    ),
  },

  {
    title: 'Estado',

    dataIndex: 'state',

    key: 'state',

    render: (state: string) => (
      <StateBadge
        meaning={describeStudentState(
          state,
        )}
      />
    ),
  },

  {
    title: 'Intentos',

    dataIndex: 'attempts',

    key: 'attempts',
  },

  {
    title: 'Espera acum.',

    dataIndex: 'total_waiting_time',

    key: 'total_waiting_time',

    render: (seconds: number) =>
      formatMinutes(seconds),
  },
];

export {
  pcColumns,
  studentColumns,
};