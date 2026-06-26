import { useEffect, useMemo, useState } from "react";
import { SimulationLine } from "../../types/simulation-line";
import { createColumns, createStudentColumns } from "./columns";
import { BASE_COLUMNS_WIDTH, PAGE_SIZE_OPTIONS, PC_GROUP_WIDTH, STUDENT_GROUP_WIDTH, TABLE_SCROLL_Y } from "./constants";
import { Button, Table, Tooltip } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { SimulationLineDrawer } from "../simulation-line-drawer/simulation-line-drawer";
import styles from "./style.module.css";

interface StateVectorTableProps {
	lines: SimulationLine[];
	loading: boolean;
	page: number;
	pageSize: number;
	total: number;
	queueLimit: number;
	onPageChange: (page: number, pageSize: number) => void;
}

const StateVectorTable = ({
	lines,
	loading,
	page,
	pageSize,
	total,
	queueLimit,
	onPageChange,
}: StateVectorTableProps) => {
	const activeStudentIds = useMemo(() => {
		const ids = new Set<number>();
		lines.forEach(line => line.active_students_snapshot?.forEach(student => ids.add(student.id)));
		return Array.from(ids).sort((a, b) => a - b);
	}, [lines]);

	// Cantidad de PCs derivada de los datos: soporta cualquier num_pcs (1-15).
	const numPcs = useMemo(
		() => lines.reduce((max, line) => Math.max(max, line.pc_snapshot?.length ?? 0), 0),
		[lines],
	);

	const columns = useMemo(
		() => [...createColumns(queueLimit || 5, numPcs), ...createStudentColumns(activeStudentIds)],
		[queueLimit, numPcs, activeStudentIds],
	);
	const [selectedLine, setSelectedLine] = useState<SimulationLine | null>(null);
	const [fullscreen, setFullscreen] = useState(false);
	const [viewportHeight, setViewportHeight] = useState(() =>
		typeof window !== 'undefined' ? window.innerHeight : 800,
	);

	// En pantalla completa el alto disponible depende del viewport; lo seguimos al redimensionar.
	useEffect(() => {
		if (!fullscreen) return;
		const onResize = () => setViewportHeight(window.innerHeight);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setFullscreen(false);
		};
		onResize();
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [fullscreen]);

	const scroll = useMemo(
		() => ({
			x: BASE_COLUMNS_WIDTH + numPcs * PC_GROUP_WIDTH + activeStudentIds.length * STUDENT_GROUP_WIDTH,
			// 220px reservados para toolbar + paginación + cabecera al estar en pantalla completa.
			y: fullscreen ? viewportHeight - 220 : TABLE_SCROLL_Y,
		}),
		[numPcs, activeStudentIds.length, fullscreen, viewportHeight],
	);

	return (
		<div className={fullscreen ? styles.fullscreenWrapper : undefined}>
			<div className={styles.toolbar}>
				<Tooltip title={fullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}>
					<Button
						size="small"
						icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
						onClick={() => setFullscreen(v => !v)}
					>
						{fullscreen ? 'Salir' : 'Pantalla completa'}
					</Button>
				</Tooltip>
			</div>
			<Table
				virtual
				dataSource={lines}
				columns={columns}
				rowKey="id"
				loading={loading}
				scroll={scroll}
				rowClassName={(record) => (
					selectedLine?.id === record.id ? 'active-row trace-row' : 'trace-row'
				)}
				onRow={(record) => ({
					tabIndex: 0,
					role: 'button',
					'aria-label': `Abrir detalle de línea ${record.line_index}`,
					onClick: () => setSelectedLine(record),
					onKeyDown: (event) => {
						if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						setSelectedLine(record);
						}
					},
				})}
				pagination={{
					current: page,
					pageSize,
					total,
					onChange: onPageChange,
					showSizeChanger: true,
					pageSizeOptions: PAGE_SIZE_OPTIONS,
				}}
			/>
			<SimulationLineDrawer
				line={selectedLine}
				open={selectedLine !== null}
				onClose={() => setSelectedLine(null)}
			/>
		</div>
	);
};

export default StateVectorTable;
