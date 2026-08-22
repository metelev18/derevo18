import { spawn } from 'node:child_process';

import { startStaticServer } from './static-server.mjs';

const packageManagerCli = process.env.npm_execpath;
if (!packageManagerCli) throw new Error('pnpm executable was not found in the current environment.');

const server = await startStaticServer();
const runner = spawn(process.execPath, [packageManagerCli, 'exec', 'playwright', 'test'], {
  env: process.env,
  stdio: 'inherit',
});

let exitCode;
try {
  exitCode = await new Promise((resolveExitCode, reject) => {
    runner.once('error', reject);
    runner.once('exit', (code) => resolveExitCode(code ?? 1));
  });
} finally {
  await new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
}

process.exitCode = exitCode;
