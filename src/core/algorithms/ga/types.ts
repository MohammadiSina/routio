export interface IConfigs {
  dimension: number; // Represents the number of dimension in the problem.
  fixedOriginIndex?: number; // Determines a coordinate as the fixed origin of routes.
  returnToOrigin?: boolean; // Determines if the traveler must return to the origin (depot).
  populationSize?: number; // Maximum size of the population
  nnaPercentage?: number; // Percentage of chromosomes selected using Nearest Neighbor Algorithm (NNA)
  maxGens?: number; // Maximum number of generations
  maxChrAge?: number; // Maximum age (number of generations) for a chromosome

  mutationRate?: number; // Percentage of chromosomes undergoing mutation
  eliteCount?: number; // Number of elite chromosomes preserved in each generation
}

export type Chromosome = Set<number>; // Represents a chromosome as an array of numbers
export type ChromosomeStr = string; // Represents a chromosome as string
export type Population = Set<ChromosomeStr>; // Represents a population as an array of chromosomes
export type Couple = Set<ChromosomeStr>; // Represents a couple of chromosomes for vertain purposes like being parents
export type Fitness = number; // Represents the fitness value of a chromosome

// Represents an evaluated population, where each chromosome is associated with its fitness value
export type EvaluatedPopulation = Map<ChromosomeStr, Fitness>;
