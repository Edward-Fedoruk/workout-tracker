import { bestErmOf, finiteErmsOf } from './aggregate';
import {
  type CalculationStrategy,
  createStrategyRegistry,
} from './strategyRegistry';
import { type AnalyticsSet } from './types';

/**
 * Strategies for the customizable chart's aggregate "Overall eRM" parameter:
 * how a single session's per-set eRM values collapse into one value.
 *
 * Default (`average`) is per the spec clarification: mean of the session's
 * per-set eRM values.
 */

export type SessionErmStrategy = CalculationStrategy<
  AnalyticsSet[],
  null | number,
  SessionErmStrategyKey
>;

export type SessionErmStrategyKey = 'average' | 'best' | 'sum';

const averageSetErm: SessionErmStrategy = {
  calculate: (sets) => {
    const erms = finiteErmsOf(sets);

    if (erms.length === 0) {
      return null;
    }

    return erms.reduce((total, erm) => total + erm, 0) / erms.length;
  },
  description: 'Mean eRM across all logged sets in the session.',
  key: 'average',
  label: 'Average set eRM',
};

const bestSetErm: SessionErmStrategy = {
  calculate: (sets) => bestErmOf(sets),
  description: 'The single strongest set eRM in the session.',
  key: 'best',
  label: 'Best set eRM',
};

const sumSetErm: SessionErmStrategy = {
  calculate: (sets) => {
    const erms = finiteErmsOf(sets);

    if (erms.length === 0) {
      return null;
    }

    return erms.reduce((total, erm) => total + erm, 0);
  },
  description: 'Sum of every logged set eRM in the session.',
  key: 'sum',
  label: 'Sum of set eRMs',
};

export const sessionErmStrategies = createStrategyRegistry<
  AnalyticsSet[],
  null | number,
  SessionErmStrategyKey
>([averageSetErm, bestSetErm, sumSetErm], 'average');
