/**
 * Generic strategy-pattern primitives.
 *
 * A `CalculationStrategy` is a named, self-describing function from `Input` to
 * `Output`. A `StrategyRegistry` holds a family of interchangeable strategies
 * behind a single handle so call sites depend on the registry, never on a
 * concrete formula. Swapping an approach is a one-line `setActive(key)` (or
 * passing a specific strategy at the call site) — no consumer code changes.
 */

export type CalculationStrategy<Input, Output, Key extends string = string> = {
  /**
   * Pure calculation: same input always yields the same output.
   */
  readonly calculate: (input: Input) => Output;
  /**
   * One-line explanation, suitable for a tooltip or settings screen.
   */
  readonly description: string;
  /**
   * Stable identifier used to select the strategy.
   */
  readonly key: Key;
  /**
   * Human-readable name, suitable for a selector label.
   */
  readonly label: string;
};

export type StrategyRegistry<Input, Output, Key extends string = string> = {
  /**
   * Look up a strategy by key; throws if the key is unknown.
   */
  get: (key: Key) => CalculationStrategy<Input, Output, Key>;
  /**
   * The currently active strategy.
   */
  getActive: () => CalculationStrategy<Input, Output, Key>;
  /**
   * The currently active strategy key.
   */
  getActiveKey: () => Key;
  /**
   * All registered strategies, in registration order (for selectors).
   */
  list: () => ReadonlyArray<CalculationStrategy<Input, Output, Key>>;
  /**
   * Swap the active strategy; throws if the key is unknown.
   */
  setActive: (key: Key) => void;
};

/**
 * Build a registry from a non-empty list of strategies and a default key.
 * Keys are validated eagerly so a typo fails fast at module load.
 */
export const createStrategyRegistry = <Input, Output, Key extends string>(
  strategies: ReadonlyArray<CalculationStrategy<Input, Output, Key>>,
  defaultKey: Key,
): StrategyRegistry<Input, Output, Key> => {
  const byKey = new Map<Key, CalculationStrategy<Input, Output, Key>>(
    strategies.map((strategy) => [strategy.key, strategy]),
  );

  const get = (key: Key): CalculationStrategy<Input, Output, Key> => {
    const strategy = byKey.get(key);

    if (!strategy) {
      throw new Error(`Unknown calculation strategy: ${key}`);
    }

    return strategy;
  };

  // Validate the default up front so misconfiguration fails at load time.
  get(defaultKey);
  let activeKey: Key = defaultKey;

  return {
    get,
    getActive: () => get(activeKey),
    getActiveKey: () => activeKey,
    list: () => strategies,
    setActive: (key: Key) => {
      get(key);
      activeKey = key;
    },
  };
};
