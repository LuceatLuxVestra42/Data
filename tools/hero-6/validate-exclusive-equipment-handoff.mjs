import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'data/contracts/hero-6-exclusive-equipment-handoff.v1.json'), 'utf8'));
const bytes = fs.readFileSync(path.join(root, contract.producer.inputPath));
const payload = JSON.parse(bytes.toString('utf8'));
const digest = crypto.createHash('sha256').update(bytes).digest('hex');

if (digest !== contract.producer.contentSha256) throw new Error('RELATION_HANDOFF_DIGEST_MISMATCH');
if (payload.heroId !== 6) throw new Error('UNEXPECTED_HERO_ID');
const edge = payload.relations?.exclusiveEquipment?.[0];
if (!edge || edge.equipmentId !== 416 || edge.relationType !== 'exclusive') throw new Error('UNEXPECTED_RELATION_EDGE');
if (edge.displayName !== '청룡의 갑옷') throw new Error('UNEXPECTED_DISPLAY_NAME');

const text = bytes.toString('utf8');
for (const forbidden of ['SkillHero', 'ConfigData', 'sourceContract', 'checkpoint', 'Legacy']) {
  if (text.includes(forbidden)) throw new Error(`FORBIDDEN_RELATION_PROVENANCE:${forbidden}`);
}

console.log(JSON.stringify({status:'PASS_HERO_6_EXCLUSIVE_EQUIPMENT_HANDOFF',sha256:digest}, null, 2));
