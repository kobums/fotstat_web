// Shared `combine` for parallel useQueries that each return a list: flattens
// every query's data into one array and rolls up the loading/error flags.
// react-query applies structural sharing to the returned object, so `.data`
// stays referentially stable across renders when the data is unchanged —
// which lets downstream useMemo aggregations actually memoize.
export function combineLists<T>(
  results: { data?: T[]; isLoading: boolean; isError: boolean }[],
) {
  return {
    data: results.flatMap((r) => r.data ?? []),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
