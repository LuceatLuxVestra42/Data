# Hero 6 presentation handoff — separate consumer repository

## Decision

Presentation follows option B:

```text
LuceatLuxVestra42/Data
= evidence / admission / canonical / generated producer

separate presentation repository
= generated consumer / frontend / build / hosting
```

The Legacy repository is not the presentation successor.

## Producer handoff

Accepted producer boundary:

```text
Data/main@9158770f21436187a33778354dde7d2d7c703795
data/generated/hero/6.v1.json
SHA256 bacd8a8242e112dc8a0c8e383e6fe94b016e6a45954673a9cb03aed2b9e8f64a
```

The consumer contract is `data/contracts/hero-presentation-handoff.v1.json`.

A presentation repository may consume the payload shape, but must not depend at runtime on:

- raw ConfigData
- Legacy checkout/history
- Data repository checkout/history
- evidence/admission/canonical internals
- name JOIN
- ID arithmetic

## Fresh-consumer proof

The workflow `.github/workflows/hero-presentation-handoff.yml` uses two jobs.

1. **producer**
   - checks out Data
   - validates the accepted handoff digest and shape
   - uploads only `hero-6.v1.json` as the portable payload

2. **fresh-consumer**
   - does **not** check out Data
   - downloads only the portable payload
   - initializes a fresh local Git repository
   - renders a minimal standalone `index.html`
   - verifies that the rendered output contains Hero 6 / 레온 / 15% / SP_ARTWORK
   - verifies that no producer `data/`, `tools/`, `experiments/`, or `.git` history was transported into the consumer payload

This proves the handoff boundary and minimal presentation portability. It does not choose the production frontend framework.

## Completion boundary

Successful proof means:

```text
Data generated consumer
→ portable handoff
→ fresh no-checkout presentation consumer
→ minimal render
```

It does **not** mean:

- a persistent presentation repository exists
- a frontend framework has been selected
- hosting/deployment is configured
- the first production Hero page is deployed

Those begin once the separate presentation repository exists and is connected.
