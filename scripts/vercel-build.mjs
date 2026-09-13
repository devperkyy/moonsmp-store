import { spawnSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
  return result.status ?? 1;
}

// Production existed before migrations were checked in. Mark the generated
// baseline as applied once; Prisma returns a harmless error on later builds.
run(npx, ["prisma", "migrate", "resolve", "--applied", "20260911000000_baseline"], {
  allowFailure: true,
});
run(npx, ["prisma", "migrate", "deploy"]);
run(npm, ["run", "build"]);
