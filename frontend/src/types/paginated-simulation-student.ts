import { SimulationStudent } from "./simulation-student";

export interface PaginatedSimulationStudents {
    total: number;
    page: number;
    limit: number;
    items: SimulationStudent[];
}