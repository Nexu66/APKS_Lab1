#!/usr/bin/env node
// Deterministic, read-only verification behind the /check command of the build-engineer agent.
// Groups: agent, structure, git, build, workflow. Exit code: 0 = PASS, 1 = FAIL, 2 = bad arguments.
// Usage: node .claude/scripts/check.mjs [--only <group>[,<group>...]] [--no-build]
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GROUPS = ["agent", "structure", "git", "build", "workflow"];
const IS_WINDOWS = process.platform === "win32";

// ---------- arguments ----------
let only = GROUPS;
let noBuild = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--no-build") noBuild = true;
  else if (arg === "--only") only = (argv[++i] ?? "").split(",").filter(Boolean);
  else if (arg.startsWith("--only=")) only = arg.slice("--only=".length).split(",").filter(Boolean);
  else {
    console.error(`Unknown argument: ${arg}\nUsage: node .claude/scripts/check.mjs [--only <group>] [--no-build]`);
    process.exit(2);
  }
}
const unknown = only.filter((g) => !GROUPS.includes(g));
if (only.length === 0 || unknown.length > 0) {
  console.error(`Unknown group(s): ${unknown.join(", ") || "(empty)"}. Known groups: ${GROUPS.join(", ")}`);
  process.exit(2);
}

// ---------- helpers ----------
const results = [];
function record(group, name, ok, details = "") {
  results.push({ group, name, ok });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${group}: ${name}${!ok && details ? ` — ${details}` : ""}`);
  return ok;
}
const abs = (rel) => join(ROOT, rel);
const exists = (rel) => existsSync(abs(rel));
const read = (rel) => readFileSync(abs(rel), "utf8");
function run(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...options });
  return { status: r.status, stdout: (r.stdout ?? "").trim(), stderr: (r.stderr ?? "").trim(), error: r.error };
}
const git = (...args) => run("git", args);

/** Markdown headings outside fenced code blocks, lower-cased, without the leading #'s. */
function headings(text) {
  const result = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(`{3,}|~{3,})/);
    if (m) {
      if (fence === null) fence = m[1];
      else if (line.startsWith(fence)) fence = null;
      continue;
    }
    if (fence === null && /^#{1,6}\s/.test(line)) result.push(line.replace(/^#+\s*/, "").trim().toLowerCase());
  }
  return result;
}
function checkSections(group, label, rel, sections) {
  if (!exists(rel)) return record(group, label, false, `${rel} not found`);
  const h = headings(read(rel));
  const missing = sections.filter((s) => !h.some((x) => x.startsWith(s.toLowerCase())));
  return record(group, label, missing.length === 0, `${rel}: missing sections: ${missing.join(", ")}`);
}
/** Text of a level-2 section ("## <title>") up to the next level-2 heading. */
function section(text, title) {
  const parts = text.split(/^## /m);
  const found = parts.find((p) => p.toLowerCase().startsWith(title.toLowerCase()));
  return found ?? "";
}

// ---------- group: agent ----------
const SKILLS = ["project-scaffold", "build-and-test", "github-actions"];
const COMMANDS = ["git-init", "create-project", "create-build", "create-actions", "check", "init"];
const MANIFEST = ".claude/agents/build-engineer.md";
const MANIFEST_SECTIONS = ["Роль", "Область відповідальності", "Правила роботи з файлами", "Заборонені дії", "Критерії успішного завершення"];
const SKILL_SECTIONS = ["Коли застосовувати", "Вхідні дані", "Результат", "Порядок дій", "Перевірки", "Приклад", "Типовий сценарій помилки"];
const COMMAND_SECTIONS = ["Передумови", "Дії", "Очікувані файли", "Перевірка", "Повідомлення про помилку"];
const INIT_ORDER = ["/git-init", "/create-project", "/create-build", "/create-actions", "/check"];

function checkAgent() {
  checkSections("agent", "manifest has role, scope, file rules, forbidden actions, completion criteria", MANIFEST, MANIFEST_SECTIONS);
  record(
    "agent",
    "manifest front matter declares name: build-engineer",
    exists(MANIFEST) && /^---\r?\n[\s\S]*?^name:\s*build-engineer\s*$[\s\S]*?^---/m.test(read(MANIFEST)),
    "front matter with name: build-engineer not found",
  );
  record("agent", "CLAUDE.md binds sessions to the manifest", exists("CLAUDE.md") && read("CLAUDE.md").includes(MANIFEST), "CLAUDE.md missing or does not reference the manifest");
  for (const s of SKILLS) {
    checkSections("agent", `skill ${s}: purpose, inputs, outputs, actions, checks, example, failure scenario`, `.claude/skills/${s}/SKILL.md`, SKILL_SECTIONS);
  }
  for (const c of COMMANDS) {
    checkSections("agent", `command /${c}: preconditions, actions, files, check, error message`, `.claude/commands/${c}.md`, COMMAND_SECTIONS);
  }
  const uses = { "create-project": "project-scaffold", "create-build": "build-and-test", "create-actions": "github-actions" };
  for (const [c, s] of Object.entries(uses)) {
    const rel = `.claude/commands/${c}.md`;
    record("agent", `/${c} applies skill ${s}`, exists(rel) && read(rel).includes(`.claude/skills/${s}/SKILL.md`), `${rel} does not reference .claude/skills/${s}/SKILL.md`);
  }
  const initRel = ".claude/commands/init.md";
  const actions = exists(initRel) ? section(read(initRel), "Дії") : "";
  const pos = INIT_ORDER.map((c) => actions.indexOf("`" + c + "`"));
  const ordered = pos.every((p) => p >= 0) && pos.every((p, i) => i === 0 || p > pos[i - 1]);
  record("agent", `/init calls ${INIT_ORDER.join(" → ")} in order`, ordered, `positions in "## Дії" of init.md: ${pos.join(", ")}`);
}

// ---------- group: structure ----------
const PROJECT_FILES = [
  "README.md", "CLAUDE.md", "package.json", "package-lock.json", "tsconfig.json", "vitest.config.ts",
  "src/index.ts", "src/main.ts", "src/greet.ts", "src/calc.ts", "tests/hello.test.ts", "scripts/build-exe.mjs",
  "ci.sh", "ci.bat", "run.sh", "run.bat", ".github/workflows/ci.yml", ".gitignore", ".gitattributes",
  "docs/architecture.md", "docs/usage.md", "docs/ai-log.md",
];
const REQUIRED_SCRIPTS = ["start", "typecheck", "test", "test:ci", "bundle", "package", "build"];
const REQUIRED_DEV_DEPS = ["typescript", "vitest", "esbuild", "@types/node", "yaml"];

function checkStructure() {
  const missing = PROJECT_FILES.filter((f) => !exists(f));
  record("structure", `required project files exist (${PROJECT_FILES.length})`, missing.length === 0, `missing: ${missing.join(", ")}`);
  let pkg = null;
  try {
    pkg = JSON.parse(read("package.json"));
  } catch (e) {
    record("structure", "package.json is valid JSON", false, e.message);
    return;
  }
  record("structure", 'package.json: "type": "module" and engines.node >= 26', pkg.type === "module" && /26/.test(pkg.engines?.node ?? ""), `type=${pkg.type}, engines.node=${pkg.engines?.node}`);
  const noScript = REQUIRED_SCRIPTS.filter((s) => !pkg.scripts?.[s]);
  record("structure", `npm scripts: ${REQUIRED_SCRIPTS.join(", ")}`, noScript.length === 0, `missing scripts: ${noScript.join(", ")}`);
  const dev = pkg.devDependencies ?? {};
  const noDep = REQUIRED_DEV_DEPS.filter((d) => !dev[d]);
  const ranged = Object.entries(dev).filter(([, v]) => !/^\d+\.\d+\.\d+$/.test(v)).map(([k, v]) => `${k}@${v}`);
  record("structure", "devDependencies present with exact versions", noDep.length === 0 && ranged.length === 0, [noDep.length && `missing: ${noDep.join(", ")}`, ranged.length && `not exact: ${ranged.join(", ")}`].filter(Boolean).join("; "));
  if (exists("README.md")) {
    const readme = read("README.md");
    record("structure", "README.md: student, group, variant and project section", ["Кулинський", "КІ-408", "Варіант", "<!-- project:hello -->"].every((s) => readme.includes(s)), "README.md lacks student data or the project section");
  }
  if (exists("tests/hello.test.ts")) {
    record("structure", "tests/hello.test.ts defines test BasicAddition", /test\(\s*["']BasicAddition["']/.test(read("tests/hello.test.ts")), "BasicAddition test not found");
  }
}

// ---------- group: git ----------
const IGNORED = ["node_modules/", "build/", "dist/", "coverage/", ".env"];
// Patterns are assembled from parts so this file does not match itself.
const SECRET_PATTERNS = [
  ["GitHub token", new RegExp("\\bgh" + "[pousr]_[A-Za-z0-9]{36,}")],
  ["GitHub fine-grained token", new RegExp("\\bgithub" + "_pat_[A-Za-z0-9_]{50,}")],
  ["AWS access key", new RegExp("\\bAK" + "IA[0-9A-Z]{16}\\b")],
  ["API key (sk-...)", new RegExp("\\bsk" + "-(?:ant-)?[A-Za-z0-9_-]{32,}")],
  ["private key", new RegExp("-----BEGIN [A-Z ]*PRIV" + "ATE KEY-----")],
];

function checkGit() {
  const inside = git("rev-parse", "--is-inside-work-tree");
  if (!record("git", "inside a git work tree", inside.stdout === "true", inside.stderr || "not a git repository")) return;
  const gi = exists(".gitignore") ? read(".gitignore").split(/\r?\n/).map((l) => l.trim()) : [];
  const notIgnored = IGNORED.filter((p) => !gi.includes(p));
  record("git", `.gitignore lists ${IGNORED.join(", ")}`, notIgnored.length === 0, `missing: ${notIgnored.join(", ")}`);
  const meaningful = gi.filter((l) => l && !l.startsWith("#"));
  const dup = meaningful.filter((l, i) => meaningful.indexOf(l) !== i);
  record("git", ".gitignore has no duplicate entries", dup.length === 0, `duplicates: ${[...new Set(dup)].join(", ")}`);
  const ign = git("check-ignore", "build/", "node_modules/");
  record("git", "build/ and node_modules/ are ignored", ign.stdout.split(/\r?\n/).length === 2, `git check-ignore printed: ${ign.stdout || "(nothing)"}`);
  const tracked = git("ls-files").stdout.split(/\r?\n/).filter(Boolean);
  const bad = tracked.filter((f) => /^(node_modules|build|dist|coverage)\//.test(f) || /(^|\/)\.env(\.|$)/.test(f));
  record("git", "no build artifacts, dependencies or .env tracked", bad.length === 0, `tracked: ${bad.slice(0, 5).join(", ")}`);

  const ga = exists(".gitattributes") ? read(".gitattributes") : "";
  record("git", ".gitattributes: *.sh eol=lf, *.bat eol=crlf", /^\*\.sh\s+text\s+eol=lf\s*$/m.test(ga) && /^\*\.bat\s+text\s+eol=crlf\s*$/m.test(ga), ".gitattributes rules missing");
  const eolProblems = [];
  for (const f of ["ci.sh", "run.sh"]) if (exists(f) && read(f).includes("\r")) eolProblems.push(`${f} has CR`);
  for (const f of ["ci.bat", "run.bat"]) if (exists(f) && /(^|[^\r])\n/.test(read(f))) eolProblems.push(`${f} has bare LF`);
  record("git", "line endings: *.sh LF, *.bat CRLF (working tree)", eolProblems.length === 0, eolProblems.join(", "));
  const modes = git("ls-files", "-s", "ci.sh", "run.sh").stdout.split(/\r?\n/).filter(Boolean);
  record("git", "ci.sh and run.sh are executable in git (100755)", modes.length === 2 && modes.every((l) => l.startsWith("100755")), modes.join("; ") || "not tracked");

  const hits = [];
  for (const f of tracked) {
    let text;
    try {
      if (statSync(abs(f)).size > 2_000_000) continue;
      text = readFileSync(abs(f), "utf8");
    } catch {
      continue;
    }
    for (const [label, re] of SECRET_PATTERNS) if (re.test(text)) hits.push(`${f} (${label})`);
  }
  record("git", "no secrets in tracked files", hits.length === 0, hits.join(", "));
}

// ---------- group: build ----------
function checkBuild() {
  if (noBuild) {
    console.log("[SKIP] build: --no-build given");
    return;
  }
  const script = IS_WINDOWS ? "ci.bat" : "ci.sh";
  if (!record("build", `${script} exists`, exists(script), `${script} not found — run /create-build`)) return;
  console.log(`---- running ${script} (output below) ----`);
  const r = IS_WINDOWS
    ? spawnSync("cmd.exe", ["/d", "/c", script], { cwd: ROOT, stdio: "inherit" })
    : spawnSync("bash", [script], { cwd: ROOT, stdio: "inherit" });
  console.log(`---- ${script} finished with exit code ${r.status} ----`);
  record("build", `${script} succeeded`, r.status === 0, `exit code ${r.status}`);

  const exe = join("build", "bin", IS_WINDOWS ? "hello.exe" : "hello");
  if (record("build", `executable ${exe} exists`, exists(exe), "not built")) {
    const out = run(abs(exe), []);
    record("build", `${exe} prints "Hello, World!" and exits 0`, out.status === 0 && out.stdout === "Hello, World!", `exit ${out.status}, output ${JSON.stringify(out.stdout)}`);
  }
  const junit = "build/test-results/junit.xml";
  if (record("build", `test report ${junit} exists`, exists(junit), "no JUnit report")) {
    const xml = read(junit);
    const m = xml.match(/<testcase\b[^>]*\bname="BasicAddition"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/);
    record("build", "test BasicAddition passed", Boolean(m) && !/<(failure|error|skipped)\b/.test(m[1] ?? ""), m ? "BasicAddition failed or was skipped" : "BasicAddition not found in report");
    const failures = [...xml.matchAll(/<testsuites?\b[^>]*\bfailures="(\d+)"/g)].map((x) => Number(x[1]));
    const errors = [...xml.matchAll(/<testsuites?\b[^>]*\berrors="(\d+)"/g)].map((x) => Number(x[1]));
    record("build", "no failed tests in the report", failures.every((n) => n === 0) && errors.every((n) => n === 0), `failures=${failures.join("/")}, errors=${errors.join("/")}`);
  }
}

// ---------- group: workflow ----------
const OSES = ["ubuntu-latest", "windows-latest", "macos-latest"];
const ALLOWED_RUN = [/^bash \.\/ci\.sh$/, /^\.\/ci\.sh$/, /^call ci\.bat$/, /^ci\.bat$/];

function checkWorkflow() {
  const rel = ".github/workflows/ci.yml";
  if (!record("workflow", `${rel} exists`, exists(rel), "run /create-actions")) return;
  let YAML;
  try {
    YAML = createRequire(abs("package.json"))("yaml");
  } catch {
    record("workflow", "yaml parser available", false, "package 'yaml' is not installed — run npm ci (or ci.bat / ci.sh) first");
    return;
  }
  const text = read(rel);
  let wf;
  try {
    wf = YAML.parse(text);
  } catch (e) {
    record("workflow", "ci.yml is valid YAML", false, e.message.split("\n")[0]);
    return;
  }
  record("workflow", "ci.yml is valid YAML", wf && typeof wf === "object", "empty document");
  const on = wf?.on ?? {};
  const branches = (t) => on?.[t]?.branches ?? [];
  const trig = ["push", "pull_request"].every((t) => on && t in on && ["develop", "master"].every((b) => branches(t).includes(b)));
  record("workflow", "triggers push and pull_request for develop and master", trig, `push: ${JSON.stringify(branches("push"))}, pull_request: ${JSON.stringify(branches("pull_request"))}`);
  const jobs = Object.entries(wf?.jobs ?? {});
  const job = jobs.length === 1 ? jobs[0][1] : null;
  const os = job?.strategy?.matrix?.os ?? [];
  const matrixOk = Boolean(job) && os.length === OSES.length && OSES.every((o) => os.includes(o)) && /matrix\.os/.test(String(job["runs-on"]));
  record("workflow", `single job with matrix ${OSES.join(", ")}`, matrixOk, `jobs=${jobs.length}, matrix.os=${JSON.stringify(os)}, runs-on=${job?.["runs-on"]}`);
  const steps = job?.steps ?? [];
  record("workflow", "checkout step present", steps.some((s) => String(s.uses ?? "").startsWith("actions/checkout@")), "actions/checkout not used");
  const runs = steps.filter((s) => s.run !== undefined).map((s) => String(s.run).trim());
  const extra = runs.filter((r) => !ALLOWED_RUN.some((re) => re.test(r)));
  const callsBoth = runs.some((r) => /ci\.sh/.test(r)) && runs.some((r) => /ci\.bat/.test(r));
  record("workflow", "run steps only call ci.sh / ci.bat (both are called)", extra.length === 0 && callsBoth, extra.length ? `other commands: ${extra.join(" | ")}` : "ci.sh or ci.bat is not called");
  record("workflow", "no continue-on-error and no secrets", !/continue-on-error/.test(text) && !/secrets\./.test(text), "continue-on-error or secrets.* found");
  const upload = steps.find((s) => String(s.uses ?? "").startsWith("actions/upload-artifact@") && /build\/bin/.test(String(s.with?.path ?? "")));
  record("workflow", "executable uploaded with if-no-files-found: error", upload?.with?.["if-no-files-found"] === "error", "no upload-artifact step for build/bin with if-no-files-found: error");
}

// ---------- main ----------
const RUNNERS = { agent: checkAgent, structure: checkStructure, git: checkGit, build: checkBuild, workflow: checkWorkflow };
const statusBefore = git("status", "--porcelain").stdout;
console.log(`build-engineer /check — groups: ${only.join(", ")}${noBuild ? " (--no-build)" : ""}`);
for (const g of GROUPS) {
  if (!only.includes(g)) continue;
  console.log(`\n== ${g} ==`);
  RUNNERS[g]();
}
console.log("");
const statusAfter = git("status", "--porcelain").stdout;
record("summary", "tracked files unchanged by /check (git status identical before and after)", statusBefore === statusAfter, "git status changed while checking");

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0 ? `\nRESULT: PASS (${results.length} checks)` : `\nRESULT: FAIL (${failed.length} of ${results.length} failed)`);
process.exit(failed.length === 0 ? 0 : 1);
