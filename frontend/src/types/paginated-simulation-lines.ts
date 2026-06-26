import { SimulationLine } from "./simulation-line";

export interface PaginatedSimulationLines {
    total: number;
    page: number;
    limit: number;
    items: SimulationLine[];
}