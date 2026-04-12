import {
  default_learning_steps,
  default_maximum_interval,
  default_relearning_steps,
  default_request_retention,
  default_w,
  generatorParameters,
  type FSRSParameters,
} from 'ts-fsrs';

export const ANKI_FSRS_TARGET = '25.09.2';
export const DEFAULT_DESIRED_RETENTION = default_request_retention;
export const DEFAULT_MAXIMUM_INTERVAL = default_maximum_interval;
export const DEFAULT_WEIGHTS = [...default_w];
export const DEFAULT_LEARNING_STEPS = [...default_learning_steps];
export const DEFAULT_RELEARNING_STEPS = [...default_relearning_steps];
export const MIN_OPTIMIZATION_REVIEWS = 20;
export const MIN_OPTIMIZATION_CARDS = 5;

export interface DeckFsrsConfigLike {
  desiredRetention: number;
  maximumInterval: number;
  weights: number[];
  learningSteps: string[];
  relearningSteps: string[];
  isOptimized: boolean;
  lastOptimizedAt: Date | null;
}

export function buildFsrsParameters(config?: Partial<DeckFsrsConfigLike> | null): FSRSParameters {
  return generatorParameters({
    request_retention: config?.desiredRetention ?? DEFAULT_DESIRED_RETENTION,
    maximum_interval: config?.maximumInterval ?? DEFAULT_MAXIMUM_INTERVAL,
    w: config?.weights?.length ? config.weights : DEFAULT_WEIGHTS,
    enable_fuzz: false,
    enable_short_term: true,
    learning_steps: config?.learningSteps?.length ? asSteps(config.learningSteps) : DEFAULT_LEARNING_STEPS,
    relearning_steps: config?.relearningSteps?.length ? asSteps(config.relearningSteps) : DEFAULT_RELEARNING_STEPS,
  });
}

export function buildDefaultDeckFsrsConfig(): DeckFsrsConfigLike {
  return {
    desiredRetention: DEFAULT_DESIRED_RETENTION,
    maximumInterval: DEFAULT_MAXIMUM_INTERVAL,
    weights: [...DEFAULT_WEIGHTS],
    learningSteps: [...DEFAULT_LEARNING_STEPS],
    relearningSteps: [...DEFAULT_RELEARNING_STEPS],
    isOptimized: false,
    lastOptimizedAt: null,
  };
}

function asSteps(steps: string[]) {
  return steps as `${number}${'m' | 'h' | 'd'}`[];
}
