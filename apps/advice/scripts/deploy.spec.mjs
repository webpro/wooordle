import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const appDirectory = join(import.meta.dirname, '..');

function deploy(t, failure = '', onlyWorkaround = false) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'advice-deploy-test-')));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  mkdirSync(join(directory, 'scripts'));
  for (const file of ['package.json', 'wrangler.jsonc', 'scripts/deploy.mjs']) {
    copyFileSync(join(appDirectory, file), join(directory, file));
  }
  symlinkSync(join(appDirectory, 'node_modules'), join(directory, 'node_modules'));
  writeFileSync(join(bin, 'command.mjs'), String.raw`#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
const command = basename(process.argv[1]);
const args = process.argv.slice(2);
const step = command + ':' + args[0];
const event = { command, args, accountId: process.env.CLOUDFLARE_ACCOUNT_ID };
const option = (name) => args[args.indexOf(name) + 1];
if (command === 'wrangler' && args[0] === 'deploy') {
  event.configPath = args.includes('--config') ? option('--config') : 'wrangler.jsonc';
  if (event.configPath !== 'wrangler.jsonc') event.config = JSON.parse(readFileSync(event.configPath, 'utf8'));
}
appendFileSync(process.env.DEPLOY_TEST_LOG, JSON.stringify(event) + '\n');
if (process.env.DEPLOY_TEST_FAILURE === step) process.exit(9);
if (command === 'wrangler' && args[0] === 'containers') {
  console.log(JSON.stringify({ username: 'v1', password: 'test-registry-password' }));
}
if (command === 'podman' && args[0] === 'login') {
  if (readFileSync(0, 'utf8') !== 'test-registry-password') process.exit(10);
  writeFileSync(option('--authfile'), '{}');
}
if (command === 'podman' && args[0] === 'push') {
  if (process.env.DEPLOY_TEST_FAILURE !== 'missing-digest') {
    writeFileSync(option('--digestfile'), process.env.DEPLOY_TEST_FAILURE === 'invalid-digest'
      ? 'not-a-digest'
      : 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n');
  }
}
`, { mode: 0o755 });
  for (const command of ['pnpm', 'podman', 'wrangler']) {
    symlinkSync(join(bin, 'command.mjs'), join(bin, command));
  }
  const log = join(directory, 'commands.jsonl');
  const { scripts } = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const result = spawnSync('/bin/bash', ['-c', onlyWorkaround ? 'node scripts/deploy.mjs prebuilt-advice-image' : scripts.deploy], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: '2a89625197605034a7e0aae5af99b6cf', PATH: `${bin}:${process.env.PATH}`, DEPLOY_TEST_LOG: log, DEPLOY_TEST_FAILURE: failure },
  });
  const events = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse) : [];
  const original = readFileSync(join(directory, 'wrangler.jsonc'), 'utf8');
  assert.equal(original, readFileSync(join(appDirectory, 'wrangler.jsonc'), 'utf8'));
  assert.equal(readdirSync(directory).some((name) => name.startsWith('wrangler.deploy-')), false);
  for (const event of events.filter(({ command }) => command === 'podman')) {
    for (const option of ['--authfile', '--digestfile']) {
      if (event.args.includes(option)) assert.equal(existsSync(event.args[event.args.indexOf(option) + 1]), false);
    }
  }
  assert.equal((result.stdout + result.stderr).includes('test-registry-password'), false);
  return { result, events, directory };
}

test('deploys the pushed digest after one amd64 build', (t) => {
  const { result, events, directory } = deploy(t);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map(({ command, args }) => `${command}:${args[0]}`), [
    'pnpm:build:client', 'pnpm:build', 'wrangler:containers', 'podman:login', 'podman:push', 'wrangler:deploy',
  ]);
  assert.equal(events[1].args[events[1].args.indexOf('--platform') + 1], 'linux/amd64');
  assert.equal(events[2].accountId, '2a89625197605034a7e0aae5af99b6cf');
  assert.ok(events[3].args.includes('--authfile'));
  assert.equal(events[4].args[events[4].args.indexOf('--authfile') + 1], events[3].args[events[3].args.indexOf('--authfile') + 1]);
  assert.ok(events[4].args.includes('wooordle-advice'));
  assert.match(events[4].args.at(-1), /^registry\.cloudflare\.com\/2a89625197605034a7e0aae5af99b6cf\/wooordle-advice-wooordleadvicecontainer:[a-f0-9-]{36}$/);
  const { config, configPath } = events[5];
  assert.equal(configPath.startsWith(directory + '/'), true);
  assert.equal(config.account_id, '2a89625197605034a7e0aae5af99b6cf');
  assert.equal(events[5].accountId, '2a89625197605034a7e0aae5af99b6cf');
  assert.equal(config.containers[0].image, 'registry.cloudflare.com/2a89625197605034a7e0aae5af99b6cf/wooordle-advice-wooordleadvicecontainer@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(config.main, 'src/worker.ts');
  assert.equal(config.assets.directory, './dist');
  assert.equal(config.containers[0].class_name, 'WooordleAdviceContainer');
  assert.equal(config.containers[0].max_instances, 1);
  assert.equal(config.durable_objects.bindings[0].name, 'OCR_CONTAINER');
});

for (const failure of ['pnpm:build:client', 'pnpm:build', 'wrangler:containers', 'podman:login', 'podman:push', 'missing-digest', 'invalid-digest']) {
  test(`does not deploy after ${failure} fails`, (t) => {
    const { result, events } = deploy(t, failure);
    assert.notEqual(result.status, 0);
    assert.equal(events.some(({ command, args }) => command === 'wrangler' && args[0] === 'deploy'), false);
    const last = events.at(-1);
    assert.equal(`${last.command}:${last.args[0]}`, failure.endsWith('-digest') ? 'podman:push' : failure);
  });
}

test('reports deployment failure and cleans up temporary files', (t) => {
  const { result } = deploy(t, 'wrangler:deploy');
  assert.notEqual(result.status, 0);
});

test('the workaround consumes a built image without running builds', (t) => {
  const { result, events } = deploy(t, '', true);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map(({ command, args }) => `${command}:${args[0]}`), [
    'wrangler:containers', 'podman:login', 'podman:push', 'wrangler:deploy',
  ]);
  assert.ok(events[2].args.includes('prebuilt-advice-image'));
});
