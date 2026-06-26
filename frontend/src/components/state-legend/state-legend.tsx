import { Card, Table, Tag } from 'antd';
import { StateBadge } from '../state-badge/StateBadge';
import {
  describePcState,
  describeStudentState,
  describeEncargadoState,
  type StateMeaning,
} from '../../utils/stateLabels';

interface LegendRow {
  key: string;
  family: string;
  familyColor: string;
  familySpan: number;
  meaning: StateMeaning;
}

// Una entrada por familia de estados; "SI n" / "DM n" llevan el índice de PC al final.
const GROUPS: {
  family: string;
  color: string;
  codes: string[];
  describe: (code: string) => StateMeaning;
}[] = [
  { family: 'PC', color: 'green', codes: ['L', 'I', 'M'], describe: describePcState },
  {
    family: 'Alumno',
    color: 'blue',
    codes: ['EF', 'SI n', 'EV', 'RECHAZADO'],
    describe: describeStudentState,
  },
  {
    family: 'Encargado',
    color: 'orange',
    codes: ['EM', 'EPC', 'DM n'],
    describe: describeEncargadoState,
  },
];

const rows: LegendRow[] = GROUPS.flatMap((group) =>
  group.codes.map((code, index) => ({
    key: `${group.family}-${code}`,
    family: group.family,
    familyColor: group.color,
    // rowSpan en la primera fila del grupo; las demás se fusionan (0).
    familySpan: index === 0 ? group.codes.length : 0,
    meaning: group.describe(code),
  })),
);

const columns = [
  {
    title: 'Entidad',
    dataIndex: 'family',
    width: 120,
    onCell: (record: LegendRow) => ({ rowSpan: record.familySpan }),
    render: (family: string, record: LegendRow) => (
      <Tag color={record.familyColor}>{family}</Tag>
    ),
  },
  {
    title: 'Estado',
    dataIndex: 'meaning',
    width: 120,
    render: (meaning: StateMeaning) => <StateBadge meaning={meaning} />,
  },
  {
    title: 'Significado',
    dataIndex: 'meaning',
    key: 'description',
    render: (meaning: StateMeaning) => meaning.description,
  },
];

/** Leyenda de referencia con todos los estados posibles de la simulación. */
const StateLegend = () => (
  <Card
    className="glass-panel"
    size="small"
    title="Estados"
    style={{ marginBottom: 16 }}
  >
    <Table<LegendRow>
      dataSource={rows}
      columns={columns}
      rowKey="key"
      size="small"
      pagination={false}
      bordered
    />
  </Card>
);

export default StateLegend;
