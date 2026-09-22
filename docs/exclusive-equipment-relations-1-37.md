# Exclusive Equipment relation expansion — Heroes 1 and 37

This expansion migrates two additional already-verified direct relations:

- Hero 1 -> Equipment 277 -> 단결의 반지
- Hero 37 -> Equipment 280 -> 쥬그미의 선물

The relation authority remains the preserved direct ConfigDataEquipmentInfo.SkillHero provenance from the accepted predecessor relation layer. Korean equipment names are presentation-only and do not establish ownership.

The generated aggregate handoff now contains Heroes 1, 6, and 37 so the presentation repository can render one explicit exclusive-equipment relation for each admitted Hero.

Non-scope:

- full 167-edge relation migration
- general equipment eligibility
- inferred ownership
- unrelated relation domains
