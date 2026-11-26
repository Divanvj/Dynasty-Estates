#!/usr/bin/env node
// Deploys Firebase rules or indexes to the live `dynasty-estates` project (S1-12).
//
//   npm run firebase:deploy:rules            Firestore rules (runs npm run test:rules first)
//   npm run firebase:deploy:indexes          Firestore indexes
//   npm run firebase:deploy:storage          Storage rules
//   ... -- --dry-run                         check with Firebase, deploy nothing
//
// It always deploys what is on origin/main (= what Vercel runs), never the
// working copy: this checkout is shared and is often on another branch. The
// files are copied into a temporary folder with a firebase.json holding only
// that one section, so nothing else in firebase.json (auth domains, App
// Hosting) can be deployed by accident. If your copy of the file differs from
// origin/main it stops, so you never test one file and deploy another.
//
// Needs the Firebase CLI login (`npx firebase-tools login`); the service-account
// key can read the project but not deploy. Ask the owner before deploying.

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = "dynasty-estates";
const FIREBASE_TOOLS = "firebase-tools@15.37.0"; // same version as test:rules
const TARGETS = {
  rules: { only: "firestore:rules", file: "firestore.rules", config: { firestore: { rules: "firestore.rules" } }, test: "test:rules" },
  indexes: { only: "firestore:indexes", file: "firestore.indexes.json", config: { firestore: { indexes: "firestore.indexes.json" } } },
  storage: { only: "storage", file: "storage.rules", config: { storage: { rules: "storage.rules" } }, test: "test:storage-rules" },
};

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const [target, ...rest] = process.argv.slice(2);
const dryRun = rest.includes("--dry-run");
const skipTests = rest.includes("--skip-tests");
const spec = TARGETS[target];

function fail(message) {
  console.error(`\nfirebase-deploy: ${message}`);
  process.exit(1);
}

if (!spec) fail(`say what to deploy: ${Object.keys(TARGETS).join(", ")}`);

const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
const normalize = (text) => text.replace(/\r\n/g, "\n");
// On Windows npm and npx are .cmd files, which need a shell; the arguments here
// are fixed words, so they are joined into one command line.
function run(command, args, cwd) {
  return process.platform === "win32"
    ? spawnSync([command, ...args].join(" "), { cwd, stdio: "inherit", shell: true })
    : spawnSync(command, args, { cwd, stdio: "inherit" });
}

console.log(`Fetching origin/main …`);
git("fetch", "--quiet", "origin", "main");
const mainCommit = git("rev-parse", "--short", "origin/main").trim();
const fromMain = git("show", `origin/main:${spec.file}`);

const localPath = join(repo, spec.file);
if (!existsSync(localPath) || normalize(readFileSync(localPath, "utf8")) !== normalize(fromMain)) {
  fail(`your ${spec.file} is not the same as origin/main (${mainCommit}). Merge your change to main first ` +
    `(or check out main) — this script only deploys what is on main.`);
}

if (spec.test && !skipTests) {
  console.log(`Running the rule tests on ${spec.file} (npm run ${spec.test}, a minute or two) …`);
  const tests = run("npm", ["run", spec.test], repo);
  if (tests.status !== 0) fail("the rule tests failed, so nothing was deployed.");
}

const work = mkdtempSync(join(tmpdir(), "dynasty-deploy-"));
try {
  writeFileSync(join(work, spec.file), fromMain);
  writeFileSync(join(work, "firebase.json"), JSON.stringify(spec.config, null, 2));
  const args = ["--yes", FIREBASE_TOOLS, "deploy", "--only", spec.only, "--project", PROJECT, "--non-interactive"];
  if (dryRun) args.push("--dry-run");
  console.log(`${dryRun ? "Dry run" : "Deploying"}: ${spec.file} from origin/main ${mainCommit} to ${PROJECT} …`);
  const result = run("npx", args, work);
  if (result.status !== 0) fail(`firebase-tools exited with ${result.status ?? result.signal}. If it says you are not logged in, run: npx firebase-tools login`);
  console.log(dryRun ? "\nDry run passed; nothing was deployed." : `\nDeployed ${spec.file} (origin/main ${mainCommit}).`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
