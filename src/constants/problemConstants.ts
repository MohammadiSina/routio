import { join } from 'node:path';

// Section: Problem Model Constants
export const PROBLEM_NOT_PROVIDED_ERR = 'Providing the problem is necessary';
export const COSTS_NOT_FULLY_PROVIDED_ERR =
  'Providing all cost related data is necessary';

export const EDGE_TYPE_REQUIRED_ERR = 'Edge type is required';
export const EDGE_TYPE_ENUM_ERR = 'Invalid edge type';

export const PROBLEM_TYPE_ENUM_ERR = 'Invalid problem type';

export const PATH_BASE_DIRECTORY = join('src', 'data', 'problems');
export const PATH_MAX_LENGTH = 45;
export const PATH_MIN_LENGTH = 0;
export const PATH_MAX_LENGTH_ERR = 'The problem name is too long';
export const PATH_MIN_LENGTH_ERR = 'The problem name is too short';

export const DIMENSION_REQUIRED_ERR = 'Dimension is required';
export const DIMENSION_MAX_VALUE = 100;
export const DIMENSION_MIN_VALUE = 3;
export const DIMENSION_MAX_VALUE_ERR = 'Dimension is too large';
export const DIMENSION_MIN_VALUE_ERR = 'Dimension is too small';

export const ALGORITHM_REQUIRED_ERR = 'Algorithm is required';
export const ALGORITHM_ENUM_ERR = 'Invalid or unsupported algorithm';

export const REAL_INSTANCE_REQUIRED_ERR = 'Instance type must be specified';

export const API_NAME_REQUIRED_ERR =
  'API name must be provided for real-world problems';
export const API_NAME_ENUM_ERR = 'Invalid or unsupported API name';

export const INSTANCE_NAME_REQUIRED_ERR =
  'Instance name must be provided for non-real-world problems';
export const INSTANCE_MAX_LENGTH = 20;
export const INSTANCE_MIN_LENGTH = 0;
export const INSTANCE_MAX_LENGTH_ERR = 'Instance name is too long';
export const INSTANCE_MIN_LENGTH_ERR = 'Instance name is too short';

export const KNOWN_COST_REQUIRED_ERR = 'known best cost must be provided';
export const KNOWN_COST_MAX_VALUE = 100_000_000;
export const KNOWN_COST_MIN_VALUE = 0.1;
export const KNOWN_COST_MAX_VALUE_ERR = 'Cost is too high';
export const KNOWN_COST_MIN_VALUE_ERR = 'Cost is too low';

export const SOLVED_TIME_REQUIRED_ERR = 'Solving time must be provided';
export const SOLVED_TIME_MAX_VALUE = 300; // Seconds
export const SOLVED_TIME_MIN_VALUE = 1;
export const SOLVED_TIME_MAX_VALUE_ERR = 'Solving time is too long';
export const SOLVED_TIME_MIN_VALUE_ERR = 'Solving time is too short';

export const GENERATION_REQUIRED_ERR =
  'Number of algorithm generations must be provided';
export const GENERATION_MAX_VALUE = 500;
export const GENERATION_MIN_VALUE = 5;
export const GENERATION_MAX_VALUE_ERR = 'Generation count is too high';
export const GENERATION_MIN_VALUE_ERR = 'Generation count is too low';

export const SOLUTION_REQUIRED_ERR = 'Solution must be provided';
export const SOLUTION_VALID_ERR = 'Invalid solution';
export const SOLUTION_LENGTH_VALID_ERR =
  'Solution length must be equal to dimension count';

export const BEST_COST_REQUIRED_ERR = 'Best found cost must be provided';
export const BEST_COST_MAX_VALUE = 1000000;
export const BEST_COST_MIN_VALUE = 0.1;
export const BEST_COST_MAX_VALUE_ERR = 'Best cost is too high';
export const BEST_COST_MIN_VALUE_ERR = 'Best cost is too low';

export const WORST_COST_REQUIRED_ERR = 'Worst found cost must be provided';
export const WORST_COST_MAX_VALUE = 1000000;
export const WORST_COST_MIN_VALUE = 0.1;
export const WORST_COST_MAX_VALUE_ERR = 'Worst cost is too high';
export const WORST_COST_MIN_VALUE_ERR = 'Worst cost is too low';
export const WORST_COST_BEST_VALID_ERR =
  'Worst cost must be greater than best cost';
export const WORST_COST_KNOWN_VALID_ERR =
  'Worst cost must be greater than known best cost';

export const BEST_COST_GENERATION_REQUIRED_ERR =
  'Generation number of best cost found must be provided';

export const WORST_COST_GENERATION_REQUIRED_ERR =
  'Generation number of worst cost found must be provided';

export const COST_GENERATION_MIN_VALUE = 0;

export const BEST_HISTORY_REQUIRED_ERR =
  'Best cost per generation must be provided';
export const BEST_HISTORY_VALID_ERR = 'Invalid best cost per generation';
export const BEST_HISTORY_INCLUDE_ERR =
  'Best cost history does not include the best cost';

export const WORST_HISTORY_REQUIRED_ERR =
  'Worst cost per generation must be provided';
export const WORST_HISTORY_VALID_ERR = 'Invalid worst cost per generation';
export const WORST_HISTORY_INCLUDE_ERR =
  'Worst cost history does not include the worst cost';

// Section: General Constants
export enum EdgeWeightType {
  GEO = 'GEO',
  EUC2D = 'EUC_2D',
  EXPLICIT = 'EXPLICIT',
}

export enum SupportedApi {
  // Add other APIs here when they are supported.
  NESHAN = 'neshan',
}

export enum ProblemType {
  TSP = 'TSP',
  ATSP = 'ATSP',
}
