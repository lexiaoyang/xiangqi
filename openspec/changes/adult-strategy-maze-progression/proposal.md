## Why

The current campaign is readable at a glance: most levels are solved by following corridors, the shop does not support meaningful strategy, and VIP has no gameplay value. To make the game suitable for adults and worthy of a premium mini-game target, the maze needs layered objectives, risk/reward decisions, richer tools, and clear long-term progression.

## What Changes

- Rebuild campaign progression around adult-friendly strategy chapters, with named acts, rulesets, objective pressure, mastery labels, and visible strategic goals per level.
- Add new layered maze mechanics beyond simple pathfinding: keys and locks, traps, sentries, switches, unstable tiles, memory gates, phase doors, and relic objectives that combine with existing collect/gust/portal mechanics.
- Upgrade level generation so each level has a strategic archetype, chapter theme, solvability guardrails, and increasing complexity instead of only larger maze size.
- Expand tools from hint/undo to a real tactical loadout: scanner, rewind, freeze, bridge, decoy, key forge, and reveal pulse, each with unlock rules, shop SKU support, and level-appropriate value.
- Expand shop catalog from basic coins/stamina to strategic bundles, tool packs, VIP pass products, chapter preparation packs, and limited tactical offers tied to new mechanics.
- Implement a useful VIP system with levels, benefits, daily claims, stamina cap/recovery bonuses, tool discounts, extra tactical slots, reward multipliers, and visible progress.
- Add “other optimizations” across onboarding, hub messaging, level cards, result summaries, economy clarity, copywriting, and premium game presentation.
- Preserve existing mock/backend provider modes, local campaign persistence, rewarded ads, activities, audio, and OpenSpec platform conventions.

## Capabilities

### New Capabilities

- `adult-strategy-campaign`: Adult-oriented chapter progression, level archetypes, mastery labels, and strategic level metadata.
- `layered-maze-mechanics`: Multi-layer maze mechanics including locks, traps, sentries, switches, unstable tiles, memory gates, phase doors, and relic objectives.
- `tactical-tool-loadout`: Expanded tactical tools, unlock progression, charges, level usage rules, and player-facing tactical loadout.
- `premium-shop-economy`: Rich shop catalog and economy mapping for strategic bundles, tool packs, VIP products, and limited tactical offers.
- `vip-entitlement-system`: VIP levels, progress, benefits, daily claims, discounts, stamina perks, and gameplay-affecting entitlements.
- `premium-adult-ux-polish`: UX copy, level card information, result summaries, onboarding, and premium presentation improvements for an adult audience.

### Modified Capabilities

- `premium-minigame-experience-standard`: Raises the acceptance bar for adult strategic depth, monetization clarity, VIP usefulness, and non-trivial gameplay readability.
- `payment-commerce-platform`: Adds requirements for strategic SKU categories, VIP products, tool-pack contents, and gameplay entitlement clarity.
- `reward-center-platform`: Adds requirements for VIP/daily/tactical reward claims to align with new tool and chapter progression.

## Impact

- Affected frontend gameplay files: `src/campaign/*`, `src/maze/*`, `src/MazeLevelPlay.tsx`, `src/CampaignShell.tsx`, and `src/styles.css`.
- Affected platform/economy files: `src/platform/types.ts`, `src/platform/config.ts`, `src/platform/mockProviders.ts`, `src/platform/commerce.ts`, reward/ad integrations, and server default config.
- Affected persistence: campaign save schema must migrate old saves safely while retaining progress, coins, stamina, and existing unlocked tools.
- Affected tests: level spec tests, solvability tests, game state tests, shop/economy tests, VIP tests, and UI smoke tests need updates for new mechanics.
- No external dependency is required for the first implementation; server-backed mode should continue to use the existing provider abstraction.
