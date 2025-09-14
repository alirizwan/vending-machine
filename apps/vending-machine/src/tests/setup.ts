import { execSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// temp db lives under apps/vending-machine/.tmp/tests/dev.db
const tmpDir = path.resolve(__dirname, '../../.tmp/tests');
const dbFile = path.join(tmpDir, 'dev.db');

if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
if (existsSync(dbFile)) rmSync(dbFile);

process.env.NODE_ENV = 'test';
// IMPORTANT: override the Prisma datasource for tests
process.env.DATABASE_URL = `file:${dbFile}`;
// Use a test JWT secret (middleware might decode)
process.env.JWT_SECRET = 'test-secret-should-be-long-enough';

// 1) Push schema to the new sqlite file (faster than migrate)
execSync('pnpm exec prisma db push --accept-data-loss', {
  cwd: path.resolve(__dirname, '../../'),
  stdio: 'inherit',
});

// 2) Minimal seed for tests
execSync('pnpm exec tsx src/tests/test-seed.ts', {
  cwd: path.resolve(__dirname, '../../'),
  stdio: 'inherit',
});
