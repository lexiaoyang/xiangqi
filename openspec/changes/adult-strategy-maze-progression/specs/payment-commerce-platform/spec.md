## ADDED Requirements

### Requirement: Strategic SKU Categories
The commerce platform SHALL support SKU categories for resources, tactical tools, chapter prep, VIP passes, limited offers, and value bundles.

#### Scenario: Catalog loaded
- **WHEN** the catalog is loaded from mock or HTTP provider
- **THEN** each strategic SKU has category, contents, price label, purchase limit, and player-facing value description.

### Requirement: Gameplay Entitlement Fulfillment
Payment fulfillment SHALL support campaign-specific entitlement contents in addition to generic wallet assets.

#### Scenario: SKU contains tactical contents
- **WHEN** a fulfilled SKU includes tactical tools or VIP points
- **THEN** the campaign inventory and VIP state are updated idempotently.

### Requirement: VIP Product Clarity
VIP products SHALL clearly state duration or permanence, VIP points granted, active benefits, and daily pack effects.

#### Scenario: VIP SKU displayed
- **WHEN** a VIP SKU is shown in the shop
- **THEN** the card shows current VIP level impact and next benefit unlock.
