/**
 * Shared `queryFn` wrapper for every endpoint. Runs a `@/database` helper and
 * normalizes the outcome to RTK Query's `{ data } | { error }` shape, so a
 * thrown helper error becomes a `rejected` result carrying a user-facing
 * message instead of escaping the endpoint (INV-2 / FR-012).
 */
export const runDatabaseQuery = async <ResultType>(
  run: () => Promise<ResultType>,
  failureMessage: string,
): Promise<{ data: ResultType } | { error: string }> => {
  try {
    return { data: await run() };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : failureMessage,
    };
  }
};
