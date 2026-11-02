import { expect, test, vi } from "vitest";
import { add } from "../src/calc.ts";
import { GREETING, greet } from "../src/greet.ts";
import { main } from "../src/main.ts";

test("BasicAddition", () => {
  expect(add(2, 3)).toBe(5);
});

test.each([
  [0, 0, 0],
  [-1, 1, 0],
  [2.5, 0.5, 3],
])("AdditionCases: add(%s, %s) = %s", (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

test("Greeting", () => {
  expect(greet()).toBe("Hello, World!");
  expect(GREETING).toBe(greet());
});

test("MainPrintsGreeting", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    expect(main()).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Hello, World!");
  } finally {
    log.mockRestore();
  }
});
