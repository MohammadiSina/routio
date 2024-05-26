import BaseAlgorithm from '../baseAlgorithm';
import { raise, random, fact } from '../../../utils';
import { Cost, CostTable, SolvedProblem } from '../../../types';
import quickSort from './quickSort';
import * as gc from './constants';
import {
  HttpStatusCode as HSC,
  algorithmConstants as agc,
} from '../../../constants';
import {
  Chromosome,
  IConfigs,
  Population,
  Fitness,
  EvaluatedPopulation,
  Couple,
  ChromosomeStr,
} from './types';

class GA extends BaseAlgorithm<IConfigs> {
  private _isOriginFixed: boolean;
  private _returnToOrigin: boolean;
  private _populationSize: number;
  private _isProblemLarge: boolean;

  private _generationCount: number = 0;
  private _mutationCount: number;
  private _eliteCount: number;
  private _maxGens: number;

  private _maxChromosomeAge: number;

  private _solution: Partial<SolvedProblem> = {};
  private _solvingStartTime = Date.now();

  constructor(costTable: CostTable, configs: IConfigs) {
    super(costTable, configs);

    // Validate the given configs object
    this._validateConfigs(configs);

    // Set default values for the shared properties between multiple methods
    this._isOriginFixed =
      !!this.configs.fixedOriginIndex || this.configs.fixedOriginIndex === 0;

    const defaultPopulationMaxSize =
      this.configs.populationSize || gc.POPULATION_SIZE;

    const dimensionBasedPopulationSize = this._isOriginFixed
      ? fact(this.configs.dimension - 1)
      : fact(this.configs.dimension);

    this._populationSize =
      dimensionBasedPopulationSize > defaultPopulationMaxSize
        ? defaultPopulationMaxSize
        : dimensionBasedPopulationSize;

    this._isProblemLarge =
      dimensionBasedPopulationSize > defaultPopulationMaxSize;

    this._returnToOrigin = this.configs.returnToOrigin ?? true;

    const mutationRate = this.configs.mutationRate ?? gc.MUTATION_RATE;
    this._mutationCount =
      Math.trunc((this._populationSize * mutationRate) / 100) || 1;

    this._eliteCount = this.configs.eliteCount || gc.ELITE_COUNT;

    this._maxGens = this.configs.maxGens ?? gc.MAX_GENERATION_COUNT;

    this._maxChromosomeAge = this.configs.maxChrAge ?? gc.MAX_CHROMOSOME_AGE;
  }

  /**
   * Solves the problem using the genetic algorithm.
   * @returns {Promise<SolvedProblem>} A promise that resolves to the solution of the problem.
   */
  override async solve(): Promise<SolvedProblem> {
    this._solvingStartTime = Date.now();

    const response: Promise<SolvedProblem> = new Promise((resolve, reject) => {
      try {
        let population = this._generateInitialPopulation();
        let evaluatedPopulation = this._evaluatePopulationFitness(population);

        this._registerSolutionStats(evaluatedPopulation);

        while (!this._hasEndingConditionsMet()) {
          const evolvedPopulation = this._evolvePopulation(evaluatedPopulation);

          evaluatedPopulation = this._survivalSelection(
            evaluatedPopulation,
            evolvedPopulation
          );

          this._generationCount++;

          this._registerSolutionStats(evaluatedPopulation);
        }

        resolve(this._solution as SolvedProblem);
      } catch (err) {
        reject(err);
      }
    });

    return response;
  }

  /**
   * Registers solution statistics from the evaluated population.
   *
   * @param {EvaluatedPopulation} population - The evaluated population map (chromosome -> fitness).
   * @private
   */
  private _registerSolutionStats(population: EvaluatedPopulation): void {
    // Calculate the time taken to solve the problem
    this._solution.solvedIn = Date.now() - this._solvingStartTime;

    // Update the number of generations processed
    this._solution.generations = this._generationCount;

    // Sort the population based on fitness values
    const sortedPopulation = quickSort([...population.entries()]);

    // Extract the best and worst chromosomes
    const bestChromosome = sortedPopulation[sortedPopulation.length - 1];
    const worstChromosome = sortedPopulation[0];

    // Calculate their costs
    const bestCost = 1 / bestChromosome[1];
    const worstCost = 1 / worstChromosome[1];

    // Update best solution statistics if necessary
    if (!this._solution.bestCost || this._solution.bestCost > bestCost) {
      this._solution.solution = bestChromosome[0];
      this._solution.bestCost = bestCost;
      this._solution.bestCostGeneration = this._generationCount;
    }

    // Update worst solution statistics if necessary
    if (!this._solution.worstCost || this._solution.worstCost < worstCost) {
      this._solution.worstCost = worstCost;
      this._solution.worstCostGeneration = this._generationCount;
    }

    // Append the current costs to the historical data
    this._solution.bestCostHistory = this._solution.bestCostHistory || [];
    this._solution.bestCostHistory.push(bestCost);

    this._solution.worstCostHistory = this._solution.worstCostHistory || [];
    this._solution.worstCostHistory.push(worstCost);
  }

  /**
   * Checks if the ending conditions for the genetic algorithm have been met.
   * Ending conditions may include reaching the maximum number of generations or
   * the most optimal chromosome becoming too old.
   * @returns {boolean} True if the ending conditions are met, otherwise false.
   */
  private _hasEndingConditionsMet(): boolean {
    // Check if the maximum count of generations has been reached
    // If the current generation count exceeds the maximum allowed generations, terminate the algorithm
    if (this._generationCount > this._maxGens) return true;

    // Check if the most optimal chromosome is too old
    // If the age of the most optimal chromosome exceeds the maximum allowed chromosome age, terminate the algorithm
    if (this._solution.bestCostGeneration)
      if (
        this._generationCount - this._solution.bestCostGeneration >
        this._maxChromosomeAge
      )
        return true;

    // Check if the problem scale is large enough
    // If the problem is small, terminate the algorithm because all possible solutions are generated
    if (!this._isProblemLarge) return true;

    // If none of the termination conditions are met, continue the algorithm
    return false;
  }

  /**
   * Evaluates the fitness of each chromosome in the population.
   * @param {Population} population - The population to evaluate.
   * @returns {EvaluatedPopulation} A Map containing each chromosome in the population paired with its corresponding fitness value.
   * @private Internal method intended for use within the current class only.
   */
  private _evaluatePopulationFitness(
    population: Population
  ): EvaluatedPopulation {
    const evaluatedPopulation: EvaluatedPopulation = new Map();

    for (let chromosomeStr of population) {
      const chromosome = strToChr(chromosomeStr);
      const fitness = this._evaluateChromosomeFitness(chromosome);

      evaluatedPopulation.set(chromosomeStr, fitness);
    }

    return evaluatedPopulation;
  }

  /**
   * Calculates the fitness value of a chromosome based on the total cost of traveling between its genes (nodes).
   * If the return to the origin is enabled, it also accounts for the cost of returning to the first gene.
   * @param {Chromosome} chromosome - The chromosome for which to evaluate fitness.
   * @returns {Fitness} The fitness value of the chromosome.
   * @private Internal method intended for use within the current class only.
   */
  private _evaluateChromosomeFitness(chromosome: Chromosome): Fitness {
    let cost = 0;
    let lastGene: number | null = null;
    let firstGene: number | null = null;

    // Calculate the cost of travelling between nodes in the order of chromosome
    for (let gene of chromosome) {
      if (lastGene === null) firstGene = gene;
      else cost += this._getRouteCost(lastGene, gene);
      lastGene = gene;
    }

    // Calculate the cost of returning to the origin, if it's needed
    if (this._returnToOrigin && firstGene && lastGene)
      cost += this._getRouteCost(lastGene, firstGene);

    // Return the fitness value of the chromosome
    return 1 / cost;
  }

  /**
   * Evolves the population by generating new chromosomes through mutation and crossover.
   * @param {EvaluatedPopulation} lastGeneration - The last generation of the population.
   * @returns {Population} - The evolved population.
   */
  private _evolvePopulation(lastGeneration: EvaluatedPopulation): Population {
    const population: Population = new Set();

    // Generates mutated chromosomes for the new population.
    while (population.size < this._mutationCount) {
      let chromosome = this._randomSelection(lastGeneration);
      chromosome = this._mutate(chromosome);

      if (!this._isProblemLarge || !lastGeneration.has(chromosome))
        population.add(chromosome);
    }

    // Generates crossovered chromosomes for the new population.
    while (population.size < this._populationSize) {
      const parents = this._rouletteWheelSelection(lastGeneration);
      const offsprings = this._mate(parents);

      for (let chromosome of offsprings)
        if (
          !population.has(chromosome) &&
          population.size < this._populationSize
        )
          if (!this._isProblemLarge || !lastGeneration.has(chromosome))
            population.add(chromosome);
    }

    return population;
  }

  /**
   * Perform survival selection by combining the last generation with the evolved population
   * and retaining elite individuals with the highest fitness values.
   *
   * @param {EvaluatedPopulation} lastGeneration - Map of chromosomes and their fitness values from the last generation.
   * @param {Population} evolvedPopulation - Set of chromosomes representing the evolved population.
   * @returns {EvaluatedPopulation} - The new generation of evaluated chromosomes.
   */
  private _survivalSelection(
    lastGeneration: EvaluatedPopulation,
    evolvedPopulation: Population
  ): EvaluatedPopulation {
    // Sort the last generation based on fitness value
    const sortedLastGeneration = quickSort([...lastGeneration.entries()]);

    // Evaluate fitness for the evolved population
    const evaluatedPopulation =
      this._evaluatePopulationFitness(evolvedPopulation);
    const nextGeneration = quickSort([...evaluatedPopulation.entries()]);

    // Replace the least fit individuals with the top elite individuals from the last generation
    nextGeneration.splice(
      nextGeneration.length - this._eliteCount,
      this._eliteCount,
      ...sortedLastGeneration.slice(0, this._eliteCount + 1)
    );

    // Return the new generation as a map
    return new Map(nextGeneration);
  }

  /**
   * Selects a couple of chromosomes (two chromosomes) from the given population using roulette wheel selection.
   * Roulette wheel selection is a method used in genetic algorithms to select chromosomes
   * with a probability proportional to their fitness values.
   *
   * @param {EvaluatedPopulation} population - The evaluated population where each chromosome is mapped to its fitness value.
   * @returns {Couple} A set containing the selected chromosomes.
   * @throws {Error} If the given population is not a Map or contains fewer than 2 chromosomes.
   * @private Internal method intended for use within the current class only.
   */
  private _rouletteWheelSelection(population: EvaluatedPopulation): Couple {
    if (!(population instanceof Map) || population.size < 2)
      raise(gc.SELECTION_INVALID_POPULATION, HSC.INTERNAL_SERVER_ERROR);

    const selectedChromosomes: Couple = new Set<ChromosomeStr>();
    const totalFitness = [...population.values()].reduce(
      (acc, fitness) => acc + fitness,
      0
    );

    const selectChromosome = (index: number): ChromosomeStr | null => {
      let fitnessAccumulator = 0;
      for (let [chromosome, fitness] of population) {
        fitnessAccumulator += fitness;
        if (fitnessAccumulator >= index) {
          return chromosome;
        }
      }
      return null;
    };

    while (selectedChromosomes.size < 2) {
      const index = Math.random() * totalFitness;
      const selected = selectChromosome(index);
      if (selected) {
        selectedChromosomes.add(selected);
      }
    }

    return selectedChromosomes;
  }

  /**
   * Selects a random chromosome from the given population.
   * @param {EvaluatedPopulation} population - The population from which to select a chromosome.
   * @returns {ChromosomeStr} The randomly selected chromosome.
   * @throws {Error} If the population is invalid or contains fewer than 2 chromosomes.
   */
  private _randomSelection(population: EvaluatedPopulation): ChromosomeStr {
    // Ensure the given population is a Map and contains at least 2 chromosomes
    if (!(population instanceof Map) || population.size < 2)
      raise(gc.SELECTION_INVALID_POPULATION, HSC.INTERNAL_SERVER_ERROR);

    const randomChromosomeIndex = random(0, population.size - 1);
    const populationArray = [...population.keys()];

    return populationArray[randomChromosomeIndex];
  }

  /**
   * Performs crossover (mate) operation between two parent chromosomes to produce offspring chromosomes.
   * @param {Couple} parents A set containing exactly two parent chromosomes.
   * @returns {Couple} A set containing two offspring chromosomes resulting from the crossover operation.
   * @throws Will throw an error if the input is not a Set or does not contain exactly two chromosomes.
   * @private Internal method intended for use within the current class only.
   */
  private _mate(parents: Couple): Couple {
    // Ensure the input is a Set and contains exactly two chromosomes
    if (!(parents instanceof Set) || parents.size !== 2) {
      console.log(parents);
      raise(gc.INVALID_COUPLE_TYPE, HSC.INTERNAL_SERVER_ERROR);
    }

    // Convert parent chromosomes from Sets to Arrays
    const [parentA, parentB] = [...parents].map((chromosome) => {
      return [...strToChr(chromosome)];
    });

    // Create copies of parent chromosomes as offspring
    const offspringA = [...parentA];
    const offspringB = [...parentB];

    // Determine the number of loci to select for crossover
    const maxLocusSelectionCount = this._isOriginFixed
      ? Math.trunc(this.configs.dimension - 1)
      : Math.trunc(this.configs.dimension);
    const locusSelectionCount = random(1, maxLocusSelectionCount);

    // Randomly select loci for crossover
    const selectedLoci = new Set<number>();
    while (selectedLoci.size < locusSelectionCount) {
      let locus;
      do {
        locus = this._isOriginFixed
          ? random(1, this.configs.dimension - 1)
          : random(0, this.configs.dimension - 1);
      } while (selectedLoci.has(locus));
      selectedLoci.add(locus);
    }

    // Perform crossover between parent chromosomes to create offspring
    for (const locus of selectedLoci) {
      offspringA.splice(offspringA.indexOf(parentB[locus]), 1, -1);
      offspringB.splice(offspringB.indexOf(parentA[locus]), 1, -1);
    }
    const sortedSelectedLoci = [...selectedLoci].sort((a, b) => a - b);

    for (const locus of sortedSelectedLoci) {
      // For offspringA
      for (let [index, gene] of offspringA.entries()) {
        if (gene !== -1) continue;
        offspringA[index] = parentB[locus];
        break;
      }

      // For offspringB
      for (let [index, gene] of offspringB.entries()) {
        if (gene !== -1) continue;
        offspringB[index] = parentA[locus];
        break;
      }
    }

    // Convert offspring Arrays back to Sets and return them
    return new Set([chrToStr(offspringA), chrToStr(offspringB)]);
  }

  /**
   * Mutates a chromosome by applying inversion and displacement mutations.
   * @param {Chromosome | ChromosomeStr} chromosome - The chromosome to be mutated.
   * @returns {ChromosomeStr} The mutated chromosome.
   * @private Internal method intended for use within the current class only.
   */
  private _mutate(chromosome: Chromosome | ChromosomeStr): ChromosomeStr {
    // Convert the chromosome if its type is string
    if (typeof chromosome === 'string') chromosome = strToChr(chromosome);

    // Select two distinct loci for inversion mutation
    let firstLocus: number;
    let lastLocus: number;

    do {
      firstLocus = this._isOriginFixed
        ? random(1, this.configs.dimension - 1)
        : random(0, this.configs.dimension - 1);

      lastLocus = this._isOriginFixed
        ? random(1, this.configs.dimension - 1)
        : random(0, this.configs.dimension - 1);

      // Ensure firstLocus and lastLocus are distinct
    } while (firstLocus === lastLocus);

    // Ensure firstLocus is less than lastLocus
    if (firstLocus > lastLocus)
      [firstLocus, lastLocus] = [lastLocus, firstLocus];

    // Perform inversion mutation in the chromosome set
    let chromosomeArray = [...chromosome];
    const invertedPart = chromosomeArray
      .slice(firstLocus, lastLocus + 1)
      .reverse();

    chromosomeArray = chromosomeArray.filter(
      (gene) => !invertedPart.includes(gene)
    );

    // Determine a random position for displacement
    const displacementPosition = this._isOriginFixed
      ? random(1, chromosomeArray.length)
      : random(0, chromosomeArray.length);

    // Perform displacement mutation
    chromosomeArray.splice(displacementPosition, 0, ...invertedPart);

    if (chromosomeArray.length !== chromosome.size)
      throw new Error('Mutate Offspring chromosomes have incorrect gene count');

    return chrToStr(new Set(chromosomeArray));
  }

  /**
   * Validates the provided configurations object to ensure it contains all required properties.
   * @param {IConfigs} configs - The configurations object to validate.
   * @throws {AppError} Throws error if all required properties are not present.
   * @private Internal method intended for use within the current class only.
   */
  private _validateConfigs(configs: IConfigs): void {
    if (typeof configs !== 'object')
      raise(agc.CONFIGS_VALID_ERR, HSC.BAD_REQUEST);

    const reqProps = ['dimension'];

    if (!reqProps.every((prop) => prop in configs))
      raise(agc.CONFIGS_VALID_ERR, HSC.BAD_REQUEST);
  }

  /**
   * Generates the initial population for the genetic algorithm.
   * The initial population consists of a combination of Nearest Neighbor Algorithm (NNA) generated chromosomes
   * and randomly generated chromosomes. The count of NNA generated chromosomes is determined by either a fixed
   * percentage or based on the configuration percentage. The remaining slots in the population are filled with random chromosomes.
   * @returns {Population} Generated population including both random and greedy chromosomes.
   * @private Internal method intended for use within the current class only.
   */
  private _generateInitialPopulation(): Population {
    // Determine the maximum count of NNA generated chromosomes based on configuration
    const nnaChrMaxCount = this._isOriginFixed
      ? this.configs.dimension - 1
      : this.configs.dimension;

    // Determine the portion percentage of the NNA chromosomes inside the initial population
    const nnaPopulationPercentage =
      this.configs.nnaPercentage ?? gc.NNA_POPULATION_PERCENTAGE;

    // Calculate the exact count of needed random and NNA chromosomes to be generated
    const nnaCount = Math.round(
      (nnaPopulationPercentage * this._populationSize) / 100
    );
    const nnaChrCount = nnaCount > nnaChrMaxCount ? nnaChrMaxCount : nnaCount;
    const randomChrCount = this._populationSize - nnaChrCount;

    // Generate NNA chromosomes
    const initialPopulation = this._generateNnaChrs(nnaChrCount);

    // Fill the remaining slots in the population with unique random chromosomes
    let randomPopulation = this._generateRandomChrs(randomChrCount);

    while (initialPopulation.size < this._populationSize) {
      let duplicateChrsCount = 0;

      randomPopulation.forEach((chr) => {
        if (initialPopulation.has(chr)) duplicateChrsCount++;
        else initialPopulation.add(chr);
      });
      randomPopulation = this._generateRandomChrs(duplicateChrsCount);
    }

    // Increase the generation count after the initial population is generated
    this._generationCount++;

    return initialPopulation;
  }

  /**
   * Generates a population of chromosomes using the Nearest Neighbor Approach (NNA).
   * @param {number} count - The number of chromosomes to generate.
   * @returns {Population} A set containing the generated chromosomes.
   * @private Internal method intended for use within the current class only.
   */
  private _generateNnaChrs(count: number): Population {
    const population: Population = new Set();
    const fixedOrigin = this.configs.fixedOriginIndex;

    // Generate the specified number of chromosomes
    while (population.size < count) {
      const chromosome: Chromosome = new Set();
      let visitedNodes: Set<number> = new Set();

      // Place the fixed node as the origin if provided
      if (this._isOriginFixed) {
        chromosome.add(fixedOrigin!);
        visitedNodes.add(fixedOrigin!);
      }

      // Locate a random node for finding its nearest neighbors.
      let isRandomNodeFound = false;
      while (!isRandomNodeFound) {
        let randomNode = random(0, this.configs.dimension - 1);

        // Check if the random node has already been visited
        if (visitedNodes.has(randomNode)) continue;

        chromosome.add(randomNode);
        visitedNodes.add(randomNode);
        isRandomNodeFound = true;
      }

      // Fill in the rest of the chromosome based on the nearest neighbors.
      while (chromosome.size < this.configs.dimension) {
        // Determines the boundary of related section of the cost table based on the last gene.
        const chrArray = [...chromosome];
        const [firstRouteIndex, lastRouteIndex] = this._getCostTableBoundaries(
          chrArray[chrArray.length - 1]
        );

        let nearestNeighborCost: number | null = null;
        let nextGeneCandidate: number | null = null;

        for (let route = firstRouteIndex; route < lastRouteIndex; route++) {
          const [origin, dest, cost] = this.costTable[route];

          if (origin === dest) continue;

          // Check if the route cost is lower than the current nearest neighbor cost
          const isNeighborUnvisited = !visitedNodes.has(dest);
          const isNearestNeighborUninitialized = !nearestNeighborCost;
          const isCurrentCostLower =
            nearestNeighborCost && cost < nearestNeighborCost;

          if (
            (isNearestNeighborUninitialized || isCurrentCostLower) &&
            isNeighborUnvisited
          ) {
            nearestNeighborCost = cost;
            nextGeneCandidate = dest;
          }
        }
        chromosome.add(nextGeneCandidate!);
        visitedNodes.add(nextGeneCandidate!);
      }

      const chrStr = chrToStr(chromosome);
      if (!population.has(chrStr)) population.add(chrStr);
    }

    return population;
  }

  /**
   * Generates a population of random chromosomes.
   * @param {number} count - The number of chromosomes to generate.
   * @returns {Population} A set containing the generated chromosomes.
   * @private Internal method intended for use within the current class only.
   */
  private _generateRandomChrs(count: number): Population {
    const population: Population = new Set();
    const fixedOrigin = this.configs.fixedOriginIndex;

    // Generate the specified number of chromosomes
    while (population.size < count) {
      const chromosome: Chromosome = new Set();

      // Place the fixed node as the origin if provided
      if (this._isOriginFixed) chromosome.add(fixedOrigin!);

      // Fill in the chromosome with random nodes
      while (chromosome.size < this.configs.dimension) {
        let randomNode = random(0, this.configs.dimension - 1);

        // Check if the random node has already been visited
        if (chromosome.has(randomNode)) continue;

        chromosome.add(randomNode);
      }

      // Ensure the random chromosome hasn't been already generated
      const chrStr = chrToStr(chromosome);
      if (!population.has(chrStr)) population.add(chrStr);
    }
    return population;
  }

  /**
   * Retrieves the cost of a route between the specified origin and destination indices.
   * @param {number} originIndex - The index of the origin in the cost table.
   * @param {number} destIndex - The index of the destination in the cost table.
   * @returns {Cost} The cost value associated with the route.
   * @private Internal method intended for use within the current class only.
   */
  private _getRouteCost(originIndex: number, destIndex: number): Cost {
    const routeIndex = originIndex * this.configs.dimension + destIndex;
    return this.costTable[routeIndex][2]; // Cost value is the third item in the route array.
  }

  /**
   * Get the boundaries of the cost table related to the specified node.
   * @param {number} node The index of the node to get the cost table boundaries for.
   * @returns {[number, number]} An array containing the first and last indices of the cost table related to the specified node.
   * @private Internal method intended for use within the current class only.
   */
  private _getCostTableBoundaries(node: number): [number, number] {
    const firstRouteIndex = node * this.configs.dimension;
    const lastRouteIndex = firstRouteIndex + this.configs.dimension;

    return [firstRouteIndex, lastRouteIndex];
  }
}

/**
 * Convert the chromosome to an equivalent string
 * @param {Chromosome} chromosome The chromosome to be converted
 * @returns {string} The string version of the chromosome
 */
const chrToStr = (chromosome: Chromosome | number[]): string => {
  return JSON.stringify([...chromosome]);
};

/**
 * Convert the stringified chromosome to a Chromosome Set
 * @param {string} chromosome The chromosome string to be converted
 * @returns {Chromosome} The Chromosome version of the string
 */
const strToChr = (chromosome: string): Chromosome => {
  return new Set(JSON.parse(chromosome));
};

export default GA;
