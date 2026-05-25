import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const isWindows = process.platform === "win32";
const npmCommand = "npm";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const processes = [
  {
    name: "backend",
    color: "\x1b[36m",
    cwd: path.join(rootDir, "nutrient-backend"),
    args: ["run", "dev"],
  },
  {
    name: "frontend",
    color: "\x1b[35m",
    cwd: path.join(rootDir, "nutrient-frontend"),
    args: ["run", "dev"],
  },
];

const children = processes.map(({ name, color, cwd, args }) => {
  const child = spawn(npmCommand, args, {
    cwd,
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = `${color}[${name}]\x1b[0m`;

  child.stdout.on("data", (chunk) => {
    process.stdout.write(formatOutput(prefix, chunk));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(formatOutput(prefix, chunk));
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.log(`${prefix} exited ${signal ? `with signal ${signal}` : `with code ${code}`}`);
    shutdown(code || 1);
  });

  return child;
});

let shuttingDown = false;

function formatOutput(prefix, chunk) {
  return chunk
    .toString()
    .split(/\r?\n/)
    .map((line) => (line ? `${prefix} ${line}` : line))
    .join("\n");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
