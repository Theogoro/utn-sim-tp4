import { Descriptions, Drawer, Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SimulationLine } from '../types/simulation';

const { Text, Title } = Typography;

interface SimulationLineDrawerProps {
  line: SimulationLine | null;
  open: boolean;
  onClose: () => void;
}

const formatMinutes = (seconds: number | null) => {
  if (seconds === null) return '-';
  return `${(seconds / 60).toFixed(2)} min`;
};

const formatClock = (seconds: number | null) => {
  if (seconds === null) return '-';
  return new Date(seconds * 1000).toISOString().slice(11, 19);
};

const formatRnd = (value: number | null) => {
  if (value === null) return '-';
  return value.toFixed(4);
};

const pcStateLabels: Record<string, { label: string; color: string }> = {
  L: { label: 'Libre', color: 'green' },
  I: { label: 'Inscripción', color: 'blue' },
  M: { label: 'Mantenimiento', color: 'orange' },
  idle: { label: 'Libre', color: 'green' },
  busy: { label: 'Inscripción', color: 'blue' },
  maintenance: { label: 'Mantenimiento', color: 'orange' },
};

const pcColumns: ColumnsType<SimulationLine['pc_snapshot'][number]> = [
  {
    title: 'PC',
    dataIndex: 'id',
    key: 'id',
    render: (id: number) => <Text strong>{id}</Text>,
  },
  {
    title: 'Estado',
    dataIndex: 'state',
    key: 'state',
    render: (state: string) => {
      const visual = pcStateLabels[state] ?? { label: state, color: 'default' };
      return <Tag color={visual.color}>{visual.label}</Tag>;
    },
  },
];

const studentColumns: ColumnsType<SimulationLine['active_students_snapshot'][number]> = [
  {
    title: 'Alumno',
    dataIndex: 'id',
    key: 'id',
    render: (id: number) => <Text strong>A{id}</Text>,
  },
  {
    title: 'Estado',
    dataIndex: 'state',
    key: 'state',
    render: (state: string) => <Tag color="blue">{state}</Tag>,
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
    render: (seconds: number) => formatMinutes(seconds),
  },
];

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
                <Tag color="orange">{line.encargado_snapshot.state}</Tag>
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
