import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isLatLong } from 'validator';

import {
  brokerConstants as bc,
  HttpStatusCode as HSC,
  problemConstants as pc,
} from '../constants';
import {
  Destination,
  Origin,
  RouteData,
  NeshanResponse,
  CostTable,
  Coordinate,
} from '../types';
import { AppError, raise } from '../utils';

// The type for being used on every route cost fetcher methods, based on different APIs
type CostFetcher = (
  apiKey: string,
  coords: [Origin, Destination],
  vehicle?: bc.NeshanVehicle
) => Promise<RouteData>;

/**
 * Retrieves a route from Neshan routing API based on provided coordinates (CostFetcher).
 * @param {string} apiKey Neshan API key.
 * @param {Array<[Origin, Destination]>} coords Array containing origin and destination coordinates.
 * @param {bc.NeshanVehicle} [vehicle=bc.NeshanVehicle.MOTORCYCLE] Type of vehicle for routing (default: motorcycle).
 * @returns {Promise<RouteData>} Promise resolving to a simplified structure representing the Neshan route.
 * @throws {AppError} Throws an error if coordinates are invalid or if there's an issue with the API call.
 */
export async function getNeshanRoute(
  apiKey: string,
  coords: [Origin, Destination],
  vehicle = bc.NeshanVehicle.MOTORCYCLE
): Promise<RouteData> {
  const [origin, dest] = coords;

  // Validate coordinates in <latitude,longitude> format
  if (!isLatLong(origin) || !isLatLong(dest))
    throw new AppError(HSC.BAD_REQUEST, bc.ORG_DEST_VALID_ERR);

  // Fetch data from Neshan routing API and check if the fetch was successful
  const url = `${bc.NESHAN_V4_BASE_URL}?type=${vehicle}&origin=${origin}&destination=${dest}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Api-Key': apiKey },
  });

  if (!response.ok)
    throw new AppError(HSC.INTERNAL_SERVER_ERROR, bc.NESHAN_API_FAILED);

  const route: NeshanResponse = await response.json();

  // Extract relevant information from the response
  // Return a simplified structure representing the Neshan route
  // https://platform.neshan.org/api/direction/

  const {
    distance: { value: distance },
    duration: { value: duration },
  } = route.routes[0].legs[0];

  return {
    origin,
    destination: dest,
    cost: { distance, duration },
    fetchedAt: new Date(),
  };
}

/**
 * Reads coordinates from a file and returns them as an array of Coordinates of type string.
 * @param {string} path The path to the coordinates file.
 * @param {boolean} isRealInstance Indicates whether the instance is real.
 * @returns {Promise<Coordinate[]>} A promise that resolves to an array of Coordinate objects.
 * @throws {AppError} Throws an error if the coordinates file is missing or has an invalid format.
 */
export async function getCoords(
  path: string,
  isRealInstance: boolean = true
): Promise<Coordinate[]> {
  const coordsStr = await readFile(path, 'utf8');
  if (!coordsStr) raise(pc.PROBLEM_COORDS_FILE_ERR, HSC.BAD_REQUEST);

  const coords = coordsStr.split(/\n|\r/gm).filter((line) => line.trim());

  if (isRealInstance)
    if (!coords.every((c) => isLatLong(c)))
      raise(pc.PROBLEM_COORDS_FILE_ERR, HSC.BAD_REQUEST);

  return coords;
}

/**
 * Calculates the cost table for routes between given coordinates using the specified API.
 * This method exclusively computes the cost table for real-world scenarios.
 * @param {Coordinate[]} coords - An array of coordinates representing origins and destinations.
 * @param {[string, pc.SupportedApi]} apiInfo - A tuple containing the API key and the supported API name.
 * @param {bc.NeshanVehicle} [vehicle=bc.NeshanVehicle.MOTORCYCLE] - The vehicle type for route calculation.
 * @returns {Promise<CostTable>} A promise that resolves with the cost table for routes between the given coordinates.
 * @throws {Error} Throws an error if the API is unsupported or if there's a failure in fetching route costs.
 */
export async function calculateCostTable(
  coords: Coordinate[],
  apiInfo: [string, pc.SupportedApi],
  vehicle: bc.NeshanVehicle = bc.NeshanVehicle.MOTORCYCLE
): Promise<CostTable> {
  const [apiKey, apiName = pc.SupportedApi.NESHAN] = apiInfo;

  if (!apiKey) raise(bc.NESHAN_API_KEY_NOT_FOUND);

  const costTable: CostTable = [];
  let costFetcher: CostFetcher = getNeshanRoute;

  // Assign the appropriate costFetcher based on the API name
  switch (apiName) {
    case pc.SupportedApi.NESHAN:
      costFetcher = getNeshanRoute;
      break;
    // Add cases for other supported APIs if needed
    default:
      raise(bc.API_UNSUPPORTED_ERR);
  }

  // Calculate costs for each combination of origins and destinations
  // Using Promise.all() with an array to concurrently execute route cost requests.
  // This improves performance by reducing waiting time for fetching costs from various origins and destinations.
  // Each promise is pushed into an array, enabling asynchronous resolution of all requests
  // and efficient population of the costTable with route cost data.

  const resps: Promise<RouteData | void>[] = [];

  for (let [originIndex, origin] of coords.entries())
    for (let [destIndex, dest] of coords.entries()) {
      if (originIndex === destIndex) {
        costTable.push([originIndex, destIndex, 0]);
        continue;
      }

      resps.push(
        costFetcher(apiKey, [origin, dest], vehicle)
          .then(({ cost }) => {
            costTable.push([originIndex, destIndex, cost.duration]);
          })
          .catch((err) => raise(`${bc.NESHAN_API_FAILED}, ${err}`))
      );
    }

  await Promise.all(resps);

  // Sort the costTable based on origin and destination indices
  costTable.sort((a, b) => {
    if (a[0] === b[0]) return a[1] - b[1];
    return a[0] - b[0];
  });

  return costTable;
}

/**
 * Calculates a static cost table for a given TSP instance.
 * @param {string} instanceName - The name of the TSP instance file.
 * @returns {Promise<CostTable>} - A promise that resolves to the cost table for the given TSP instance.
 * @throws {Error} - Throws an error if the edge weight type is not supported.
 */
export async function calculateStaticCostTable(
  instanceName: string
): Promise<CostTable> {
  const instance = await readTSPLIBFile(instanceName);
  const costTable: CostTable = [];

  switch (instance.edgeWeightType) {
    // Generate cost table for EUC_2D based problems
    case pc.EdgeWeightType.EUC2D:
      for (let origin of instance.nodeCoordinates)
        for (let dest of instance.nodeCoordinates)
          costTable.push([
            origin.nodeIndex,
            dest.nodeIndex,
            calculateEuclideanDistance(origin, dest),
          ]);
      break;

    // Add other supported edge types if needed ...
    default:
      raise(bc.PROBLEM_NOT_SUPPORTED, HSC.BAD_REQUEST);
  }

  return costTable;
}

/**
 * Parses the content of a TSPLIB file which represents a problem instance.
 * @param {string} content - The content of the TSPLIB file.
 * @returns {ITSPData} The parsed data including name, type, dimension, node coordinates, and edge weights.
 */
function parseTSPLIB(content: string): bc.ITSPData {
  const lines = content.split(/\n|\r/gm);
  const data: bc.ITSPData = {
    name: '',
    type: '',
    dimension: 0,
    edgeWeightType: '',
    nodeCoordinates: [],
    edgeWeightMatrix: [],
  };

  let readingNodes = false;
  let readingEdges = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) return;

    const [key, ...values] = trimmedLine.split(/\s+/);

    switch (key) {
      case 'NAME:':
        data.name = values.join(' ');
        break;
      case 'TYPE:':
        data.type = values.join(' ');
        break;
      case 'DIMENSION:':
        data.dimension = parseInt(values[0], 10);
        break;
      case 'EDGE_WEIGHT_TYPE:':
        data.edgeWeightType = values.join(' ');
        break;
      case 'DISPLAY_DATA_SECTION':
        readingNodes = false;
        readingEdges = false;
        break;
      case 'EDGE_WEIGHT_SECTION':
        readingEdges = true;
        readingNodes = false;
        break;
      case 'NODE_COORD_SECTION':
        readingNodes = true;
        readingEdges = false;
        break;
      case 'EOF':
        readingNodes = false;
        readingEdges = false;
        break;

      default:
        if (readingNodes) {
          const nodeIndex = parseInt(key, 10) - 1;
          const x = parseFloat(values[0]);
          const y = parseFloat(values[1]);

          data.nodeCoordinates.push({ nodeIndex, x, y });
        } else if (readingEdges) {
          const numericValues = [
            parseFloat(key),
            ...values.map((value) => {
              const number = parseFloat(value);

              return number;
            }),
          ];

          data.edgeWeightMatrix.push(...numericValues);
        }
    }
  });

  return data;
}

/**
 * Reads and parses a TSPLIB file.
 * @param {string} instanceName - The name to the TSPLIB file in the static directory (extension of the problem must be provided)
 * @returns {Promise<ITSPData>} A promise that resolves to the parsed data.
 * @throws {AppError} Throws error if the problem instance is not found.
 */
async function readTSPLIBFile(instanceName: string): Promise<bc.ITSPData> {
  const filePath = join(bc.PROBLEM_STATIC_DIRECTORY, instanceName);

  const content = await readFile(filePath, 'utf8');
  if (!content) raise(bc.PROBLEM_NOT_FOUND, HSC.BAD_REQUEST);

  return parseTSPLIB(content);
}

/**
 * Calculates the Euclidean distance between two points.
 * @param {ICoord} pointA - The first point.
 * @param {ICoord} pointB - The second point.
 * @param {2 | 3} space - The dimensionality of the space (2 for 2D, 3 for 3D). Defaults to 2.
 * @returns {number} The Euclidean distance between the two points.
 */
function calculateEuclideanDistance(
  pointA: bc.ICoord,
  pointB: bc.ICoord,
  space: 2 | 3 = 2
): number {
  const deltaX = pointB.x - pointA.x;
  const deltaY = pointB.y - pointA.y;

  if (space === 3 && pointA.z !== undefined && pointB.z !== undefined) {
    const deltaZ = pointB.z - pointA.z;
    return Math.trunc(
      Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ)
    );
  }

  return Math.trunc(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
}
