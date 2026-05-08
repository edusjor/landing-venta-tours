const { spawnSync } = require("node:child_process");

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const databaseUrl = String(process.env.DATABASE_URL ?? "").trim();

function runPrisma(args, allowFailure = false) {
  const result = spawnSync(npxCommand, ["prisma", ...args], {
    encoding: "utf8",
    env: process.env,
    // On Windows, npx.cmd requires shell mode to avoid spawnSync EINVAL.
    shell: true,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const status = result.status ?? 1;
  if (!allowFailure && status !== 0) {
    process.exit(status);
  }

  return result;
}

if (!databaseUrl) {
  console.warn(
    "[db:ensure:dev] DATABASE_URL vacia. Se omite prisma migrate/db push para modo demo local.",
  );
  process.exit(0);
}

const migrateResult = runPrisma(["migrate", "deploy"], true);
const migrateStatus = migrateResult.status ?? 1;

if (migrateStatus !== 0) {
  const output = `${migrateResult.stdout ?? ""}\n${migrateResult.stderr ?? ""}`;
  const isAdvisoryLockTimeout =
    /P1002/i.test(output)
    && /advisory lock|Timed out trying to acquire a postgres advisory lock/i.test(output);

  if (!isAdvisoryLockTimeout) {
    process.exit(migrateStatus);
  }

  console.warn(
    "[db:ensure:dev] prisma migrate deploy timed out waiting for advisory lock; continuing with prisma db push.",
  );
}

runPrisma(["db", "push", "--skip-generate"]);
