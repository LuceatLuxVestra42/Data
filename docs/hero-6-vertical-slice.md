# Hero 6 production vertical slice

## Current boundary

Hero 6 remains the first production-oriented slice in the new repository.

```text
actual pinned source evidence
→ explicit identity + semantic admission
→ minimal canonical Hero
→ presentation localization
→ verified clean base portrait
→ deterministic generated consumer
→ separate presentation repository
```

## Semantic input

```text
CN_ConfigDataHeroInfo
commit 6475e63ee23d18adf733756c26a14fa9e3ed662c
ID=6
Name=利昂
HPCmd_INI=1500
```

Admitted fact:

```text
CN heroOwnedTroopHpModifierPct = 15
```

Identity admission does not use names or ID arithmetic.

## Presentation localization

```text
利昂 → 레온
```

The Korean label is presentation-only and does not establish identity.

## Current portrait

Hero 6 now uses the verified clean base-skin portrait derivative:

```text
source PNG:
Leon_Animation_FIN_idle_Normal_default.png
1443 x 2112
SHA256 8d04d4858d8bbb8021cef1439183018293ff28659f42e486ae1306d8c5f616d1

current WebP:
BASE_PORTRAIT
1443 x 2112
SHA256 7f679f80b4712353f727aeb6e087ce8ba8380bce8542bc992115b154889b23f3
```

The previous `asset.sp-artwork.v1.json` remains retained as valid alternate SP artwork evidence but is no longer the current Hero 6 portrait input.

## Deterministic generation

`tools/hero-6/generate.mjs` reads only admitted internal inputs:

```text
canonical.v1.json
localization.ko.v1.json
asset.base-portrait.v1.json
```

It does not read raw ConfigData or the predecessor repository at generation time.

The aggregate Hero consumer uses:

- Hero 1: SP_ARTWORK
- Hero 6: BASE_PORTRAIT
- Hero 37: SP_ARTWORK

This is deliberate. General portrait availability is expanded only where direct verified evidence exists.

## Presentation ownership

Presentation ownership is already resolved as option B:

```text
LuceatLuxVestra42/Data
= evidence / admission / canonical / generated producer

LuceatLuxVestra42/langrisser-test-web
= presentation consumer
```

## Non-scope

This change does not claim normal portrait coverage for Heroes 1 or 37 and does not alter semantic identity, game facts, or relations.
