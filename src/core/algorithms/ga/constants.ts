// Total number of chromosomes in each generation.
export const POPULATION_SIZE = 100;

// Percentage of population generated using the nearest neighbor algorithm.
export const NNA_POPULATION_PERCENTAGE = 40;

// Maximum number of generations before stopping the algorithm.
export const MAX_GENERATION_COUNT = 1000;

// Maximum age of a chromosome in generations before it is discarded.
export const MAX_CHROMOSOME_AGE = 250;

// Percentage rate at which mutations occur in chromosomes.
export const MUTATION_RATE = 2;

// Maximum mutation limit, expressed as a percentage.
export const MUTATION_MAX_LIMIT = 65;

// Number of top-performing chromosomes preserved in the next generation.
export const ELITE_COUNT = 2;

// Error message for when the selection mechanism is provided with an insufficiently sized population.
export const SELECTION_INVALID_POPULATION =
  'Selection requires an evaluated population with at least 2 members';

// Error message for when an invalid couple type is provided.
export const INVALID_COUPLE_TYPE = 'Invalid couple type provided';

// Error message for when attempting to convert a chromosome of an invalid type.
export const INVALID_CHR_CONVERSION_TYPE =
  'Cannot convert chromosome - invalid type provided';
