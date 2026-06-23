import { describe, it, expect } from "vitest";
import { combineLists } from "./combineQueries";

describe("combineLists", () => {
  it("flattens every query's data into one array", () => {
    const result = combineLists([
      { data: [1, 2], isLoading: false, isError: false },
      { data: [3], isLoading: false, isError: false },
    ]);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it("treats missing data as an empty list", () => {
    const result = combineLists([
      { data: undefined, isLoading: false, isError: false },
      { data: [9], isLoading: false, isError: false },
    ]);
    expect(result.data).toEqual([9]);
  });

  it("is loading if any query is loading", () => {
    expect(
      combineLists([
        { data: [], isLoading: false, isError: false },
        { data: [], isLoading: true, isError: false },
      ]).isLoading,
    ).toBe(true);
  });

  it("is error if any query errored", () => {
    expect(
      combineLists([
        { data: [], isLoading: false, isError: false },
        { data: [], isLoading: false, isError: true },
      ]).isError,
    ).toBe(true);
  });

  it("returns empty/clean flags for no queries", () => {
    expect(combineLists([])).toEqual({
      data: [],
      isLoading: false,
      isError: false,
    });
  });
});
