## Context

The current campaign is technically stable but strategically shallow. `getLevelSpec()` mostly scales difficulty by maze size and simple obstacles, `GameBundle` supports only a few mechanics, the shop catalog mostly sells coins/stamina, and the hub shows a static `VIP 0` without entitlement value. The project already has a platform layer, remote config, rewarded ads, events, activity popups, audio, and a tier-one mini-game quality bar, so the next step should upgrade the actual game loop and economy rather than add another surface-level panel.

## Goals / Non-Goals

**Goals:**

- Make levels require adult-level planning through layered objectives, hazards, limited resources, and readable strategy prompts.
- Add a chapter/ruleset model so level difficulty is not just grid size.
- Expand tactical tools and make shop/VIP products map directly to those tools and new mechanics.
- Make VIP useful without creating mandatory pay-to-win: perks accelerate recovery, reduce friction, add tactical flexibility, and clarify value.
- Preserve existing save data and provider abstraction.
- Keep first implementation dependency-free and testable in local mock mode.

**Non-Goals:**

- Do not integrate real third-party payment or ad SDKs in this change.
- Do not replace the real backend work; this change can run on existing mock/http provider interfaces.
- Do not turn the game into a different genre; the core remains a maze puzzle with deeper tactical layers.
- Do not require new licensed art/audio assets in the first pass.

## Decisions

### Decision 1: Add strategy metadata to campaign levels

`LevelSpec` will gain fields for `chapter`, `archetype`, `complexity`, `objectives`, `modifierIds`, `recommendedTools`, `rewardProfile`, and `masteryLabel`. The UI can describe why a level is interesting before start, tests can assert the curve, and `MazeLevelPlay` can render mission context without hard-coded level ranges.

Alternative considered: infer everything from `levelId` inside UI. Rejected because it scatters progression rules and makes future event/VIP/shop targeting brittle.

### Decision 2: Extend `GameBundle` with layered mechanics instead of one-off UI flags

New mechanics will be represented as deterministic maps/sets on `GameBundle`: key locks, traps, sentries, switches, unstable tiles, memory gates, phase doors, relics, and strategic counters. `applyDirection()` remains the single rules engine for movement so undo, hinting, tests, and future replay stay consistent.

Alternative considered: implement hazards only as CSS overlays. Rejected because adult gameplay must change decisions, not just visuals.

### Decision 3: Use tactical tools as a loadout economy

Tools will expand from `hint`/`undo` to tactical items such as scanner, rewind, freeze, bridge, decoy, key forge, and reveal pulse. A migrated save will store tool inventory/charges, unlocks, VIP granted slots, and purchase/claim grants. Existing hint and undo remain compatible aliases.

Alternative considered: add more paid consumables without gameplay hooks. Rejected because the user explicitly wants shop items adapted to deeper gameplay.

### Decision 4: VIP is modeled as entitlement state plus derived benefits

VIP should not be a static label. The app will derive VIP level from entitlement points or premium asset grants and expose benefits: stamina cap/recovery, daily pack, tool discounts, extra tactical slot, reward multiplier, and scanner/pulse bonuses. The hub, shop, and result screen must show tangible benefits.

Alternative considered: show VIP only after a purchase SKU. Rejected because the system needs understandable value even in mock/local mode.

### Decision 5: Shop catalog becomes strategy-first

Catalog categories will include resources, tactical tools, chapter prep packs, VIP passes, and limited offers. SKU contents must include a clear gameplay explanation and be mirrored into local campaign state after purchase, not only platform wallet balances.

Alternative considered: keep catalog generic and rely on wallet icons. Rejected because the current criticism is that diamonds/coins have unclear purpose.

### Decision 6: Solvability and readability tests are first-class

Every new mechanic must either have a deterministic safe path guarantee or be bounded so the existing solvability tests can be extended. UI must show mission objectives, danger previews, and why tools matter, because adult difficulty should come from planning rather than hidden unfairness.

Alternative considered: random hard mode. Rejected because “hard” without explainability feels cheap and hurts monetization trust.

## Risks / Trade-offs

- New rules can make hints wrong -> Update pathfinding to use the same rules as movement where practical and keep fallback hint labels conservative.
- More mechanics can overwhelm players -> Gate by chapter, show one clear mission brief, and add per-level recommended tools.
- VIP can feel pay-to-win -> Keep core completion possible without VIP; VIP improves recovery, economy, and tactical flexibility.
- Save migration can lose legacy data -> Use additive fields with defaults and retain `coins`, `stamina`, `perLevel`, and old tool unlocks.
- Shop catalog can become noisy -> Add categories and concise value copy rather than a flat product wall.

## Migration Plan

1. Introduce new types and default migration fields while preserving `campaign:v1`.
2. Upgrade level spec generation and tests without breaking old cleared progress.
3. Add mechanics to `GameBundle` and movement rules behind deterministic generation.
4. Add tactical tools, inventory application, and UI loadout.
5. Expand remote config/catalog and shop UI.
6. Add VIP state, daily claims, benefit derivation, and hub/shop/result presentation.
7. Run full tests/build; rollback is safe because persisted data is additive and old fields remain valid.
