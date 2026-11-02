// Entry point for `npm start` (node src/index.ts) and for the bundled executable `hello`.
import { main } from "./main.ts";

process.exitCode = main();
