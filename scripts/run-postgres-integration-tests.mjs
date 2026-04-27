import { execFileSync, spawnSync } from 'node:child_process';

const containerName = `flash-sale-postgres-test-${Date.now()}-${process.pid}`;
const image = process.env.POSTGRES_TEST_IMAGE ?? 'postgres:16-alpine';
const jestTarget = 'apps/order-worker/src/order-worker.processor.integration.spec.ts';
const database = 'flash_sale_test';
const username = 'postgres';
const password = 'postgres';

function runDocker(args, options = {}) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function stopContainer() {
  try {
    runDocker(['stop', containerName]);
  } catch {
    // Best-effort cleanup.
  }
}

function registerCleanup() {
  process.on('exit', stopContainer);
  process.on('SIGINT', () => {
    stopContainer();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    stopContainer();
    process.exit(143);
  });
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForPostgresReady(retries = 30) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const readiness = runDocker([
        'exec',
        containerName,
        'pg_isready',
        '-U',
        username,
        '-d',
        database,
      ]);

      if (readiness.includes('accepting connections')) {
        return;
      }
    } catch {
      // Keep retrying while Postgres warms up.
    }

    sleep(500);
  }

  throw new Error('Timed out waiting for the temporary Postgres test container.');
}

function main() {
  try {
    runDocker(['version']);
  } catch (error) {
    console.error(
      'Docker is required for Postgres integration tests and is not reachable from this shell.',
    );
    if (error instanceof Error && error.message) {
      console.error(error.message);
    }
    process.exit(1);
  }

  registerCleanup();

  const containerId = runDocker([
    'run',
    '--rm',
    '--detach',
    '--publish',
    '127.0.0.1::5432',
    '--env',
    `POSTGRES_DB=${database}`,
    '--env',
    `POSTGRES_USER=${username}`,
    '--env',
    `POSTGRES_PASSWORD=${password}`,
    '--name',
    containerName,
    image,
  ]);

  if (!containerId) {
    throw new Error('Failed to start the temporary Postgres test container.');
  }

  waitForPostgresReady();

  const portBinding = runDocker(['port', containerName, '5432/tcp']);
  const [, hostPort] = portBinding.match(/:(\d+)$/) ?? [];

  if (!hostPort) {
    throw new Error('Could not determine the published Postgres test port.');
  }

  const testEnv = {
    ...process.env,
    DB_HOST: '127.0.0.1',
    DB_PORT: hostPort,
    DB_USERNAME: username,
    DB_PASSWORD: password,
    DB_NAME: database,
  };

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['jest', jestTarget, '--runInBand'],
    {
      stdio: 'inherit',
      env: testEnv,
    },
  );

  stopContainer();
  process.exit(result.status ?? 1);
}

main();
