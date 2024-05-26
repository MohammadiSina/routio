import { CostTable, SolvedProblem } from '../../types';

abstract class BaseAlgorithm<T> {
  constructor(public costTable: CostTable, public configs: T) {}

  abstract solve(): Promise<Partial<SolvedProblem>>;
  [member: string]: any;
}

export default BaseAlgorithm;
