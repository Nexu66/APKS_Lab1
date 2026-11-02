import { greet } from "./greet.ts";

/** Prints the greeting and returns the process exit code. */
export function main(): number {
  console.log(greet());
  return 0;
}
