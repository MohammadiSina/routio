import { Problem, SolvedProblem, CostTable, BaseConfigs } from '../types';
import { raise } from '../utils';
import { brokerServices as svc } from '../services';
import * as algs from './algorithms';
import {
  problemConstants as pc,
  brokerConstants as bc,
  SupportedAlgorithm,
  HttpStatusCode as HSC,
} from '../constants';

type AlgorithmConstructor<T> = new (
  costTable: CostTable,
  configs: T
) => algs.BaseAlgorithm<T>;

class Broker {
  isSolved: boolean = false;
  result: SolvedProblem | null = null;
  private readonly _apiKey?: string;
  private _selectedAlgorithm?: AlgorithmConstructor<any>;

  constructor(private _problem: Problem) {
    this._apiKey = this._handleApiKey();
    this._selectAlgorithm();
  }

  /**
   * Executes the solver algorithm based on the provided configurations.
   * @param {BaseConfigs} configs Configuration object for the relative solver algorithm.
   * @returns {Promise<SolvedProblem>} A promise resolving to the solved problem.
   * @throws {AppError} Throws an error if the problem type is not supported.
   */
  async exec(configs: BaseConfigs): Promise<SolvedProblem> {
    // Read the coordinates from the problem path
    const coords = await svc.getCoords(
      this._problem.path,
      this._problem.isRealInstance
    );

    // Assign the cost table calculator for unreal instances later based on isRealInstance value...
    // For now, only real instance problems could be processed, since the focus is on real ones.
    let costTable: CostTable = [];

    if (this._problem.isRealInstance)
      costTable = await svc.calculateCostTable(coords, [
        this._apiKey!,
        this._problem.apiName,
      ]);
    else raise(bc.PROBLEM_NOT_SUPPORTED, HSC.BAD_REQUEST);

    // Handle the required configurations that are included in the problem object,
    // but expected to be found inside the configs object by the algorithms.
    configs['dimension'] = this._problem.dimension;

    // Run the selected algorithm on the problem
    const algorithm = new this._selectedAlgorithm!(costTable, configs);
    this.result = (await algorithm.solve()) as SolvedProblem;

    return this.result;
  }

  /**
   * Handles API key retrieval based on the current problem instance.
   * @returns {string | undefined} The API key if found, otherwise undefined.
   * @private Broker's dedicated internal method
   */
  private _handleApiKey(): string | undefined {
    // Other APIs must be handled here, after being supported
    if (this._problem.isRealInstance)
      if (this._problem.apiName === pc.SupportedApi.NESHAN)
        return process.env.NESHAN_API_KEY ?? raise(bc.NESHAN_API_KEY_NOT_FOUND);
    return undefined;
  }

  /**
   * Selects the algorithm to be used based on the current problem.
   * @returns {void}
   * @private Broker's dedicated internal method
   */
  private _selectAlgorithm(): void {
    // Add cases for other supported algorithms if needed
    switch (this._problem.algorithm) {
      case SupportedAlgorithm.GA:
        this._selectedAlgorithm = algs.GA;
        break;

      default:
        raise(pc.ALGORITHM_ENUM_ERR, HSC.BAD_REQUEST);
    }
  }
}

export default Broker;
