import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contractPath = path.join(root, 'data/contracts/hero-presentation-handoff.v1.json');
const consumerPath = path.join(root, 'data/generated/hero/6.v1.json');

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const bytes = fs.readFileSync(consumerPath);
const consumer = JSON.parse(bytes.toString('utf8'));
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');

if (contract.status !== 'PRODUCER_HANDOFF_READY') throw new Error('HANDOFF_NOT_READY');
if (contract.consumerBoundary.mode !== 'SEPARATE_PRESENTATION_REPOSITORY') throw new Error('INVALID_CONSUMER_MODE');
if (contract.producer.contentSha256 !== sha256) throw new Error('HANDOFF_DIGEST_MISMATCH');
if (consumer.heroId !== contract.schema.heroId) throw new Error('HANDOFF_HERO_ID_MISMATCH');
if (consumer.display?.asset?.kind !== contract.schema.assetKind) throw new Error('HANDOFF_ASSET_KIND_MISMATCH');
if (consumer.facts?.heroOwnedTroopHpModifierPct?.scope !== contract.schema.factScope) throw new Error('HANDOFF_SCOPE_MISMATCH');

const text = bytes.toString('utf8');
for (const forbidden of ['HPCmd_INI', 'sourceCommit', 'source_commit', 'logicalPath', 'Legacy', 'checkpoint']) {
  if (text.includes(forbidden)) throw new Error(`FORBIDDEN_PRODUCER_DETAIL:${forbidden}`);
}

const outDir = path.join(root, '.tmp', 'hero-presentation-handoff');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'hero-6.v1.json'), bytes);
fs.writeFileSync(path.join(outDir, 'contract.v1.json'), `${JSON.stringify(contract, null, 2)}\n`);

console.log(JSON.stringify({
  status: 'PASS_PRODUCER_HANDOFF',
  sha256,
  files: ['hero-6.v1.json', 'contract.v1.json']
}, null, 2));
