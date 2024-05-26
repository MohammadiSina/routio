import { SupportedAlgorithm, problemConstants as pc } from '../constants';

export type Problem = {
  path: string; // Path to the TSP instance file
  problemType: pc.ProblemType; // Type of TSP problem (e.g., TSP, ATSP)
  edgeWeightType: pc.EdgeWeightType; // Type of edge weight (e.g., EUC_2D, GEO)
  dimension: number; // Dimensionality of the TSP problem
  algorithm: SupportedAlgorithm; //  Algorithm to be used for solving the TSP problem
} & (
  | { isRealInstance: true; apiName: pc.SupportedApi } // If the TSP instance is from a real dataset
  | { isRealInstance: false; instanceName: string; bestKnownCost: number }
); // If the TSP instance is synthetic

export type SolvedProblem = Problem & {
  solvedIn: number; // Time taken to solve the problem in seconds
  generations: number; // Number of generations used in the algorithm
  solution: number[] | string; // Array representing the solved TSP path
  bestCost: number; // Cost of the best solution found
  worstCost: number; // Cost of the worst solution found
  bestCostGeneration: number; // Generation number that best cost was found in
  worstCostGeneration: number; // Generation number that best cost was found in
  bestCostHistory: number[]; // Best cost per generation during the solution process
  worstCostHistory: number[]; // Worst cost per generation during the solution process
};

// The following interface is being created since Mongoose is not able to infer
// above types correctly, because of the intersection parts.
export interface IProblemDoc {
  path?: string;
  problemType: pc.ProblemType;
  edgeWeightType: pc.EdgeWeightType;
  dimension: number;
  algorithm: SupportedAlgorithm;
  isRealInstance: boolean;
  apiName?: pc.SupportedApi;
  instanceName?: string;
  bestKnownCost?: number;
  solvedIn: number;
  generations: number;
  solution: number[] | string;
  bestCost: number;
  worstCost: number;
  bestCostGeneration: number;
  worstCostGeneration: number;
  bestCostHistory: number[];
  worstCostHistory: number[];
}
