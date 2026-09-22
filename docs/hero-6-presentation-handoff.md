# Hero 6 presentation handoff — separate consumer repository

Presentation follows option B:

```text
LuceatLuxVestra42/Data
= evidence / admission / canonical / generated producer

LuceatLuxVestra42/langrisser-test-web
= generated consumer / frontend
```

## Current Hero 6 handoff

```text
data/generated/hero/6.v1.json
SHA256 51fc198ba0e51a7f47b2ca7fac4b440bad235321e4ad9d47effde9ee2fc4f976

display asset:
BASE_PORTRAIT
WebP SHA256 7f679f80b4712353f727aeb6e087ce8ba8380bce8542bc992115b154889b23f3
1443 x 2112
```

The producer contract is `data/contracts/hero-presentation-handoff.v1.json`.

The persistent presentation repository already exists. This handoff remains a no-checkout portability proof: the fresh consumer receives only the generated Hero payload and must not depend on raw ConfigData, Legacy history, Data checkout, semantic evidence, name JOIN, or ID arithmetic.

The previous SP artwork proof remains retained as alternate presentation evidence but is no longer the current Hero 6 portrait input.
