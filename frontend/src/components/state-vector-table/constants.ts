const TABLE_SCROLL_Y = 500;
// Ancho de columnas fijas SIN incluir los grupos de PC (se suman dinámicamente).
// 2150 base + 6 cols contadores/acumuladores (~120px) + Fin Mantenimiento (130px).
const BASE_COLUMNS_WIDTH = 3000;
const STUDENT_GROUP_WIDTH = 330;
// Cada PC = columna Estado (60) + Fin Insc. (95).
const PC_GROUP_WIDTH = 155;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100', '500', '1000'];

export {
  TABLE_SCROLL_Y,
  BASE_COLUMNS_WIDTH,
  PAGE_SIZE_OPTIONS,
  STUDENT_GROUP_WIDTH,
  PC_GROUP_WIDTH,
}