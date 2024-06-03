import { join } from 'node:path';

export const ORG_DEST_VALID_ERR = 'Origin or destination are invalid';
export const API_UNSUPPORTED_ERR = 'Unsupported API';
export const PROBLEM_NOT_SUPPORTED =
  'This problem type is not supported for solving yet';
export const PROBLEM_NOT_FOUND = 'Problem instance file could not be found';
export const PROBLEM_STATIC_DIRECTORY = join(
  __dirname,
  '..',
  'data',
  'problems',
  'static'
);

export const NESHAN_V4_BASE_URL = 'https://api.neshan.org/v4/direction';
export const NESHAN_API_FAILED = 'Fetching routing data from Neshan failed';
export const NESHAN_API_KEY_NOT_FOUND = 'Neshan API key is missing or invalid';

export enum NeshanVehicle {
  MOTORCYCLE = 'motorcycle',
  CAR = 'CAR',
}

// Interface representing the coordinates of a node (city) in the Traveling Salesman Problem (TSP).
export interface ICoord {
  nodeIndex: number;
  x: number;
  y: number;
  z?: number;
}

// Interface representing data for the Traveling Salesman Problem (TSP) file.
export interface ITSPData {
  name: string;
  type: string;
  dimension: number;
  edgeWeightType: string;
  nodeCoordinates: ICoord[];
  edgeWeightMatrix: number[];
}
