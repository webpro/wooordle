import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { experimental_readRawConfig } from 'wrangler';

const image = process.argv[2];
if (!image || process.argv.length !== 3) throw new Error('Usage: node scripts/deploy.mjs <image>');

const directory = join(import.meta.dirname, '..');
const { rawConfig: config } = experimental_readRawConfig({ config: join(directory, 'wrangler.jsonc') });
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? config.account_id;
const container = config.containers[0];
const registry = 'registry.cloudflare.com';
const repository = `${registry}/${accountId}/${config.name}-${container.class_name.toLowerCase()}`;
const tag = randomUUID();
const temporary = mkdtempSync(join(tmpdir(), 'wooordle-advice-deploy-'));
const configPath = join(directory, `wrangler.deploy-${tag}.json`);
const authfile = join(temporary, 'auth.json');
const digestfile = join(temporary, 'digest');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: directory,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  });
}

try {
  const credentials = JSON.parse(run('wrangler', ['containers', 'registries', 'credentials', '--push', '--pull', '--json'], {
    stdio: ['inherit', 'pipe', 'inherit'],
  }));
  run('podman', ['login', '--authfile', authfile, '--username', credentials.username, '--password-stdin', registry], {
    input: credentials.password,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  run('podman', ['push', '--authfile', authfile, '--digestfile', digestfile, image, `${repository}:${tag}`]);

  // Podman's local RepoDigests can differ from the uploaded manifest digest.
  const digest = readFileSync(digestfile, 'utf8').trim();
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Podman did not report a valid pushed image digest.');
  config.account_id = accountId;
  container.image = `${repository}@${digest}`;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  run('wrangler', ['deploy', '--config', configPath]);
} finally {
  rmSync(configPath, { force: true });
  rmSync(temporary, { recursive: true, force: true });
}
