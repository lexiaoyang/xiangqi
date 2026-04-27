## 1. Campaign Data Model And Progression

- [x] 1.1 Extend campaign types with chapters, archetypes, objectives, modifiers, reward profiles, strategic tool IDs, VIP state, and tool inventory
- [x] 1.2 Add safe save migration defaults for legacy campaign saves without resetting user progress
- [x] 1.3 Build strategy chapter metadata and adult-oriented level archetype curves
- [x] 1.4 Update `getLevelSpec` to emit chapter, complexity, objectives, modifiers, recommended tools, and mastery labels
- [x] 1.5 Update level/spec tests to assert progressive strategic depth after tutorial levels

## 2. Layered Maze Mechanics

- [x] 2.1 Extend maze types and `GameBundle` with keys, locks, traps, sentries, switches, unstable tiles, memory gates, phase doors, relics, and tactical counters
- [x] 2.2 Add deterministic layered mechanic placement based on level seed and archetype
- [x] 2.3 Update movement rules for locks, trap penalties, sentry danger, switches, unstable tiles, phase doors, memory gates, and relic completion
- [x] 2.4 Update win detection and objective status so required relics/keys can gate completion
- [x] 2.5 Update hint/path behavior to avoid obviously wrong guidance under new mechanics
- [x] 2.6 Add game-state tests for every new layered mechanic and deterministic generation
- [x] 2.7 Extend campaign solvability tests to cover the new mechanics without paid tools

## 3. Tactical Tools And Loadout

- [x] 3.1 Add tactical tool metadata for scanner, rewind, freeze, bridge, decoy, key forge, reveal pulse, hint, and undo
- [x] 3.2 Add campaign inventory helpers to grant, consume, and unlock tools idempotently
- [x] 3.3 Add `MazeLevelPlay` tool actions for scanner, freeze, bridge, decoy, key forge, reveal pulse, rewind, hint, and undo
- [x] 3.4 Add loadout/recommended tool UI in level prep and play HUD
- [x] 3.5 Persist tool consumption and tool grants across purchases, rewards, ads, and VIP daily packs
- [x] 3.6 Add tests for tool grant/consume behavior and no-paywall completion

## 4. Shop Economy Upgrade

- [x] 4.1 Extend product/catalog types or metadata with strategy categories, value copy, tactical contents, and VIP point contents
- [x] 4.2 Expand default remote catalog with tactical packs, chapter prep packs, VIP products, premium bundles, and limited offers
- [x] 4.3 Update mock/server default catalog so backend/mock modes expose the same strategic shop
- [x] 4.4 Update purchase fulfillment in `CampaignShell` to apply tool charges, VIP points, stamina, coins, hints, and undo consistently
- [x] 4.5 Redesign shop UI into resource/tool/chapter/VIP categories with clear benefit copy and limits
- [x] 4.6 Add tests for catalog categories, tactical SKU fulfillment, and offline catalog fallback

## 5. VIP Entitlement System

- [x] 5.1 Add VIP tier definitions, point thresholds, benefits, and daily pack definitions
- [x] 5.2 Add VIP derivation helpers for level, progress, stamina cap/recovery, discounts, reward multipliers, loadout slots, and scanner bonuses
- [x] 5.3 Add VIP daily claim persistence and duplicate-claim prevention
- [x] 5.4 Replace static `VIP 0` with live VIP status on hub and account surfaces
- [x] 5.5 Add VIP panel/shop section showing current benefits, next tier, daily pack, and VIP products
- [x] 5.6 Apply VIP benefits to stamina recovery, result rewards, shop discount labeling, and loadout slots
- [x] 5.7 Add VIP unit/UI tests for level progress, daily claim, benefits, and non-paywall completion

## 6. Premium Adult UX

- [x] 6.1 Add level prep panel with mission brief, objectives, modifiers, recommended tools, stamina cost, and complexity
- [x] 6.2 Update level card/hub copy to adult strategy language and non-trivial objective previews
- [x] 6.3 Update play HUD with objective tracker, active modifiers, danger/relic/key counters, and tool hints
- [x] 6.4 Update result screen with mastery label, strategy feedback, reward breakdown, VIP bonus, relic/objective state, and improvement tip
- [x] 6.5 Add first-time mechanic explanations for new rules
- [x] 6.6 Polish CSS for shop/VIP/prep/tool/result surfaces to match premium mobile-game standard

## 7. Rewards, Events, And Ads Integration

- [x] 7.1 Add tactical reward helpers so rewards/events/ad offers can grant tool charges and VIP points
- [x] 7.2 Update reward/event progress ingestion for relic extraction, trap avoidance, perfect routes, and tool-efficient clears
- [x] 7.3 Add VIP daily pack to reward-center-compatible claim flows
- [x] 7.4 Update ad offer copy and rewards so ads can grant tactical tool support without confusing the economy

## 8. Documentation And Verification

- [x] 8.1 Update README with adult strategy campaign, layered mechanics, tactical tools, shop categories, and VIP system
- [x] 8.2 Add/adjust UI smoke tests for prep panel, shop categories, VIP status, and strategic level cards
- [x] 8.3 Run targeted game-state, campaign, platform, UI tests
- [x] 8.4 Run full `npm test`, `npm run build`, linter diagnostics, and OpenSpec apply status check
