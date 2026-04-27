## ADDED Requirements

### Requirement: Strategy-First Shop Categories
The shop SHALL organize products into strategy categories: resources, tactical tools, chapter prep, VIP passes, limited offers, and starter recovery.

#### Scenario: Player opens shop
- **WHEN** the player opens the shop screen
- **THEN** products are grouped by category with value copy explaining what each item helps solve.

### Requirement: Clear Currency Purpose
The economy SHALL explain what coins, stamina, premium currency, tools, and VIP points do.

#### Scenario: Player sees resource row
- **WHEN** the hub or shop displays a resource
- **THEN** it includes a concise purpose label or nearby explanation.

### Requirement: Tool And Chapter Packs
The catalog SHALL include packs that grant tactical tool charges and chapter-specific preparation bundles.

#### Scenario: Chapter has new mechanic
- **WHEN** a chapter introduces locks, sentries, unstable tiles, or relic routing
- **THEN** the shop can display a prep pack with tools relevant to that chapter.

### Requirement: SKU Fulfillment To Campaign State
Purchases SHALL apply SKU contents to both platform wallet and local campaign gameplay state where relevant.

#### Scenario: SKU grants scanner charges
- **WHEN** a purchase fulfills with scanner contents
- **THEN** the campaign tool inventory increases even if scanner is not a wallet asset kind.

#### Scenario: SKU grants VIP points
- **WHEN** a purchase fulfills with VIP entitlement content
- **THEN** VIP state updates and derived benefits refresh on hub and shop.

### Requirement: Limited Offers Are Honest
Limited offers SHALL show rewards, limits, cooldowns, and purchase caps without hiding required paid or ad actions.

#### Scenario: Offer has daily cap
- **WHEN** a player views a limited tactical offer
- **THEN** the UI shows remaining daily purchases or claim count.

### Requirement: Shop Remains Playable Offline
The shop SHALL retain a useful local catalog in mock/offline mode.

#### Scenario: Backend unavailable
- **WHEN** HTTP provider cannot load catalog
- **THEN** the shop falls back to cached/default strategy catalog and labels sync state appropriately.
