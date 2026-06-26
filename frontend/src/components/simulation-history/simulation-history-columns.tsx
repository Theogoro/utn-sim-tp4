import { Button, Popconfirm, Space, Tag, Tooltip,} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AreaChartOutlined, CalendarOutlined, DeleteOutlined, LaptopOutlined} from '@ant-design/icons';
import './style.module.css';
import { SimulationSummary } from '../../types/simulation-summary';

interface CreateColumnsProps {
    activeId: number | null;
    onSelect: (id: number) => void;
    onDelete: ( id: number) => void | Promise<void>;
}

export const createColumns = ({
  activeId,
  onDelete,
  onSelect,
}: CreateColumnsProps): ColumnsType<SimulationSummary> => [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 70,

        render: (id: number) => (
        <span className="simulation-history__id">
            #{id}
        </span>
        ),
    },

    {
        title: 'Fecha',
        dataIndex: 'created_at',
        key: 'created_at',

        render: (dateStr: string) => {
        const date = new Date(dateStr);

        return (
            <Space size={6}>
            <CalendarOutlined className="simulation-history__icon-muted" />

            <span className="simulation-history__text">
                {date.toLocaleDateString()}

                {' '}

                {date.toLocaleTimeString(
                [],
                {
                    hour: '2-digit',
                    minute: '2-digit',
                },
                )}
            </span>
            </Space>
        );
        },
    },

    {
        title: 'Duración',
        dataIndex: 'sim_hours',
        key: 'sim_hours',

        render: (
        hours: number,
        record,
        ) => {
        const h =
            hours !== undefined &&
            hours !== null
            ? hours
            : record.sim_days * 24;

        return (
            <Tag
            color="blue"
            className="simulation-history__tag"
            >
            {h % 1 === 0
                ? h
                : h.toFixed(1)}{' '}
            h
            </Tag>
        );
        },
    },

    {
        title: 'PCs',
        dataIndex: 'num_pcs',
        key: 'num_pcs',

        render: (pcs: number) => (
        <Space size={6}>
            <LaptopOutlined className="simulation-history__icon-primary" />

            <span>{pcs}</span>
        </Space>
        ),
    },

    {
        title: 'Arribados',
        dataIndex:
        'total_new_students_arrived',
        key: 'total_new_students_arrived',

        render: (count: number) => (
        <span className="simulation-history__mono">
            {count.toLocaleString()}
        </span>
        ),
    },

    {
        title: 'Inscripciones',
        dataIndex:
        'registrations_completed',
        key: 'registrations_completed',

        render: (count: number) => (
        <span className="simulation-history__success">
            {count.toLocaleString()}
        </span>
        ),
    },

    {
        title: '% Rech.',
        dataIndex:
        'pct_students_returned',
        key: 'pct_students_returned',

        render: (pct: number) => {
        const color =
            pct === 0
            ? 'green'
            : pct > 10
            ? 'red'
            : 'orange';

        return (
            <Tag
            color={color}
            className="simulation-history__tag"
            >
            {pct.toFixed(2)}%
            </Tag>
        );
        },
    },

    {
        title: 'Espera prom.',
        dataIndex: 'avg_waiting_time',
        key: 'avg_waiting_time',

        render: (secs: number) => (
        <Tooltip
            title={`${secs.toFixed(
            1,
            )} segundos`}
        >
            <span className="simulation-history__wait">
            {(secs / 60).toFixed(2)} min
            </span>
        </Tooltip>
        ),
    },

    {
        title: 'Ocio téc.',
        dataIndex:
        'avg_technician_idle_time',
        key: 'avg_technician_idle_time',

        render: (secs: number) => (
        <Tooltip
            title={`${secs.toFixed(
            1,
            )} segundos`}
        >
            <span className="simulation-history__idle">
            {(secs / 60).toFixed(2)} min
            </span>
        </Tooltip>
        ),
    },

    {
        title: '',
        key: 'actions',
        width: 150,
        align: 'right',

        render: (_, record) => (
        <Space size={6}>
            <Button
            type={
                activeId === record.id
                ? 'primary'
                : 'default'
            }
            icon={<AreaChartOutlined />}
            onClick={() =>
                onSelect(record.id)
            }
            size="small"
            className={
                activeId !== record.id
                ? 'simulation-history__details-btn'
                : ''
            }
            >
            {activeId === record.id
                ? 'Activa'
                : 'Detalles'}
            </Button>

            <Popconfirm
            title="¿Eliminar esta simulación?"
            description="Se borrarán también los vectores de estado y datos detallados."
            onConfirm={() =>
                onDelete(record.id)
            }
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{
                danger: true,
            }}
            >
            <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                size="small"
            />
            </Popconfirm>
        </Space>
        ),
    },
];