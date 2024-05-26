export type Origin = string;
export type Destination = string;
export type Distance = number;
export type Duration = number;
export type Cost = number;
export type Coordinate = string;

export type CostTable = [number, number, Cost][]; // [Origin Index, Destination Index, Cost][]

// Basic structure for configs keys required by the algorithms.
export type BaseConfigs = Record<string, any> & { dimension: number };

export interface RouteData {
  origin: Origin;
  destination: Destination;
  cost: { distance: Distance; duration: Duration };
  fetchedAt: Date;
}

export interface NeshanResponse {
  routes: NeshanDirection[];
}

interface NeshanDirection {
  legs: { distance: { value: number }; duration: { value: number } }[];
}
