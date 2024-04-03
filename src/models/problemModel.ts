import { join } from 'node:path';

import { Schema, SchemaTypes, model } from 'mongoose';

import { IProblemDoc } from '../types';
import { capitalize, AppError } from '../utils';
import {
  problemConstants as pc,
  HttpStatusCode as HSC,
  SupportedAlgorithm,
} from '../constants';

// Section: Schema
const problemSchema = new Schema<IProblemDoc>(
  {
    path: {
      type: SchemaTypes.String,
      trim: true,
      maxlength: [pc.PATH_MAX_LENGTH, pc.PATH_MAX_LENGTH_ERR],
      minlength: [pc.PATH_MIN_LENGTH, pc.PATH_MIN_LENGTH_ERR],
      select: false,
    },

    problemType: {
      type: SchemaTypes.String,
      enum: {
        values: Object.values(pc.ProblemType),
        message: pc.PROBLEM_TYPE_ENUM_ERR,
      },
      trim: true,
      uppercase: true,
    },

    edgeWeightType: {
      type: SchemaTypes.String,
      required: [true, pc.EDGE_TYPE_REQUIRED_ERR],
      enum: {
        values: Object.values(pc.EdgeWeightType),
        message: pc.EDGE_TYPE_ENUM_ERR,
      },
      trim: true,
      uppercase: true,
    },

    dimension: {
      type: SchemaTypes.Number,
      required: [true, pc.DIMENSION_REQUIRED_ERR],
      max: [pc.DIMENSION_MAX_VALUE, pc.DIMENSION_MAX_VALUE_ERR],
      min: [pc.DIMENSION_MIN_VALUE, pc.DIMENSION_MIN_VALUE_ERR],
    },

    algorithm: {
      type: SchemaTypes.String,
      required: [true, pc.ALGORITHM_REQUIRED_ERR],
      enum: {
        values: Object.values(SupportedAlgorithm),
        message: pc.ALGORITHM_ENUM_ERR,
      },
      trim: true,
    },

    isRealInstance: {
      type: SchemaTypes.Boolean,
      required: [true, pc.REAL_INSTANCE_REQUIRED_ERR],
    },

    apiName: {
      type: SchemaTypes.String,
      required: [
        function (): boolean {
          return this.isRealInstance === true;
        },
        pc.API_NAME_REQUIRED_ERR,
      ],
      trim: true,
      enum: {
        values: Object.values(pc.SupportedApi),
        message: pc.API_NAME_ENUM_ERR,
      },
    },

    instanceName: {
      type: SchemaTypes.String,
      required: [
        function (): boolean {
          return !this.isRealInstance;
        },
        pc.INSTANCE_NAME_REQUIRED_ERR,
      ],
      trim: true,
      maxlength: [pc.INSTANCE_MAX_LENGTH, pc.INSTANCE_MAX_LENGTH_ERR],
      minlength: [pc.INSTANCE_MIN_LENGTH, pc.INSTANCE_MIN_LENGTH_ERR],
    },

    bestKnownCost: {
      type: SchemaTypes.Number,
      required: [
        function (): boolean {
          return !this.isRealInstance;
        },
        pc.KNOWN_COST_REQUIRED_ERR,
      ],
      max: [pc.KNOWN_COST_MAX_VALUE, pc.KNOWN_COST_MAX_VALUE_ERR],
      min: [pc.KNOWN_COST_MIN_VALUE, pc.KNOWN_COST_MIN_VALUE_ERR],
    },

    solvedIn: {
      type: SchemaTypes.Number,
      required: [true, pc.SOLVED_TIME_REQUIRED_ERR],
      max: [pc.SOLVED_TIME_MAX_VALUE, pc.SOLVED_TIME_MAX_VALUE_ERR],
      min: [pc.SOLVED_TIME_MIN_VALUE, pc.SOLVED_TIME_MIN_VALUE_ERR],
    },

    generations: {
      type: SchemaTypes.Number,
      required: [true, pc.GENERATION_REQUIRED_ERR],
      max: [pc.GENERATION_MAX_VALUE, pc.GENERATION_MAX_VALUE_ERR],
      min: [pc.GENERATION_MIN_VALUE, pc.GENERATION_MIN_VALUE_ERR],
    },

    solution: {
      type: SchemaTypes.Mixed,
      required: [true, pc.SOLUTION_REQUIRED_ERR],
      validate: {
        validator: (val: unknown): boolean =>
          Array.isArray(val) && val.every((i) => typeof i === 'number'),
        message: pc.SOLUTION_VALID_ERR,
      },
    },

    bestCost: {
      type: SchemaTypes.Number,
      required: [true, pc.BEST_COST_REQUIRED_ERR],
      max: [pc.BEST_COST_MAX_VALUE, pc.BEST_COST_MAX_VALUE_ERR],
      min: [pc.BEST_COST_MIN_VALUE, pc.BEST_COST_MIN_VALUE_ERR],
    },

    worstCost: {
      type: SchemaTypes.Number,
      required: [true, pc.WORST_COST_REQUIRED_ERR],
      max: [pc.WORST_COST_MAX_VALUE, pc.WORST_COST_MAX_VALUE_ERR],
      min: [pc.WORST_COST_MIN_VALUE, pc.WORST_COST_MIN_VALUE_ERR],
    },

    bestCostGeneration: {
      type: SchemaTypes.Number,
      required: [true, pc.BEST_COST_GENERATION_REQUIRED_ERR],
      max: [pc.GENERATION_MAX_VALUE, pc.GENERATION_MAX_VALUE_ERR],
      min: [pc.COST_GENERATION_MIN_VALUE, pc.GENERATION_MIN_VALUE_ERR],
    },

    worstCostGeneration: {
      type: SchemaTypes.Number,
      required: [true, pc.WORST_COST_GENERATION_REQUIRED_ERR],
      max: [pc.GENERATION_MAX_VALUE, pc.GENERATION_MAX_VALUE_ERR],
      min: [pc.COST_GENERATION_MIN_VALUE, pc.GENERATION_MIN_VALUE_ERR],
    },

    bestCostHistory: {
      type: SchemaTypes.Mixed,
      required: [true, pc.BEST_HISTORY_REQUIRED_ERR],
      validate: {
        validator: (val: unknown): boolean =>
          Array.isArray(val) &&
          val.length < pc.GENERATION_MAX_VALUE &&
          val.every((i) => typeof i === 'number'),
        message: pc.BEST_HISTORY_VALID_ERR,
      },
    },

    worstCostHistory: {
      type: SchemaTypes.Mixed,
      required: [true, pc.WORST_HISTORY_REQUIRED_ERR],
      validate: {
        validator: (val: unknown): boolean =>
          Array.isArray(val) &&
          val.length < pc.GENERATION_MAX_VALUE &&
          val.every((i) => typeof i === 'number'),
        message: pc.WORST_HISTORY_VALID_ERR,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

// Section: Middlewares
// Prevent DB from saving invalid data
problemSchema.pre('validate', function (next): void {
  // Middleware checks mandatory conditions before primary validation.
  // Exceptions result in sending generic errors as throwing errors doesn't mark them as ValidationError.
  // Operational errors must be thrown manually.
  const reqFields: (keyof IProblemDoc)[] = [
    'worstCost',
    'bestCost',
    'bestCostHistory',
    'bestCostGeneration',
    'worstCostHistory',
    'worstCostGeneration',
  ];

  for (let field of reqFields)
    if (this[field] === undefined)
      throw new AppError(HSC.BAD_REQUEST, pc.COSTS_NOT_FULLY_PROVIDED_ERR);

  // Mandatory Conditions:
  // BestCost < WorstCost && BestKnownCost < WorstCost
  // BestCostHistory includes BestCostFound
  // WorstCostHistory includes WorstCostFound
  // SolutionLength === DimensionNumber

  if (this.worstCost <= this.bestCost)
    next(new AppError(HSC.BAD_REQUEST, pc.WORST_COST_BEST_VALID_ERR));

  if (this.bestKnownCost && this.worstCost <= this.bestKnownCost)
    next(new AppError(HSC.BAD_REQUEST, pc.WORST_COST_KNOWN_VALID_ERR));

  if (this.bestCostHistory[this.bestCostGeneration] !== this.bestCost)
    next(new AppError(HSC.BAD_REQUEST, pc.BEST_HISTORY_INCLUDE_ERR));

  if (this.worstCostHistory[this.worstCostGeneration] !== this.worstCost)
    next(new AppError(HSC.BAD_REQUEST, pc.WORST_HISTORY_INCLUDE_ERR));

  if (!this.dimension)
    next(new AppError(HSC.BAD_REQUEST, pc.DIMENSION_REQUIRED_ERR));

  if (this.dimension !== this.solution.length)
    next(new AppError(HSC.BAD_REQUEST, pc.SOLUTION_LENGTH_VALID_ERR));

  next();
});

// Format data before saving them to the database
problemSchema.pre('save', function (next): void {
  // Edge-Weight-Type in real-world instances must be 'GEO'
  if (this.isRealInstance) this.edgeWeightType = pc.EdgeWeightType.GEO;

  // Capitalize strings to save in database
  this.algorithm = capitalize(this.algorithm as string) as SupportedAlgorithm;
  this.apiName = capitalize(this.apiName!) as pc.SupportedApi; // API name is required in real-world instances

  // Remove Invalid data based on being a real-world problem
  if (!this.isRealInstance) this.apiName = undefined;
  else {
    this.instanceName = undefined;
    this.bestKnownCost = undefined;
  }

  // Prepare the 'path' field address value
  this.path =
    !this.isRealInstance && this.instanceName
      ? join(pc.PATH_BASE_DIRECTORY, `${this.instanceName}.${this.problemType}`)
      : join(pc.PATH_BASE_DIRECTORY, `RWP-${Date.now()}.${this.problemType}`);

  next();
});

// Section: Model
const Problem = model('Problem', problemSchema);

export default Problem;
