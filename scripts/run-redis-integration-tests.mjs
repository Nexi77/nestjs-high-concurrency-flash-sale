import { execFileSync, spawnSync } from 'node:child_process';

const containerName = `flash-sale-redis-test-${Date.now()}-${process.pid}`;
const image = process.env.REDIS_TEST_IMAGE ?? 'redis:7-alpine';
const jestTarget = 'libs/redis/src/redis.service.integration.spec.ts';

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

function waitForRedisReady(retries = 20) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const pingResult = runDocker([
        'exec',
        containerName,
        'redis-cli',
        'ping',
      ]);

      if (pingResult === 'PONG') {
        return;
      }
    } catch {
      // Keep retrying while the container warms up.
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }

  throw new Error('Timed out waiting for the temporary Redis test container.');
}

function main() {
  try {
    runDocker(['version']);
  } catch (error) {
    console.error(
      'Docker is required for Redis integration tests and is not reachable from this shell.',
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
    '127.0.0.1::6379',
    '--name',
    containerName,
    image,
    'redis-server',
    '--save',
    '',
    '--appendonly',
    'no',
  ]);

  if (!containerId) {
    throw new Error('Failed to start the temporary Redis test container.');
  }

  waitForRedisReady();

  const portBinding = runDocker(['port', containerName, '6379/tcp']);
  const [, hostPort] = portBinding.match(/:(\d+)$/) ?? [];

  if (!hostPort) {
    throw new Error('Could not determine the published Redis test port.');
  }

  const testEnv = {
    ...process.env,
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: hostPort,
    REDIS_PASSWORD: '',
    REDIS_CONNECT_TIMEOUT_MS: '1000',
    REDIS_MAX_RETRIES_PER_REQUEST: '1',
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
