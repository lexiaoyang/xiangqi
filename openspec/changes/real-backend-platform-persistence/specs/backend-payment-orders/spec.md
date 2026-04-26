## ADDED Requirements

### Requirement: Server Product Catalog
The backend SHALL serve SKU catalog and eligibility from server configuration.

#### Scenario: Client loads catalog
- **WHEN** the client requests product catalog
- **THEN** the backend returns enabled SKUs, prices, contents, limits, region/channel eligibility, and catalog version

### Requirement: Payment Order State Machine
The backend SHALL manage payment orders through a server-side state machine.

#### Scenario: User creates order
- **WHEN** the client creates an order for a purchasable SKU
- **THEN** the backend creates an idempotent order in `created` state and returns the required client payment action

#### Scenario: Payment provider confirms payment
- **WHEN** a provider callback or receipt verification confirms payment
- **THEN** the backend transitions the order to `paid` only after verifying signature/receipt data

### Requirement: Server Fulfillment
The backend SHALL fulfill paid orders by writing wallet ledger entries.

#### Scenario: Paid order fulfilled
- **WHEN** a paid order is ready for fulfillment
- **THEN** the backend grants SKU contents through the ledger, marks the order `fulfilled`, and stores fulfillment ledger id

#### Scenario: Fulfillment retried
- **WHEN** fulfillment is retried for an already fulfilled order
- **THEN** the backend returns the existing fulfillment result without granting assets again

### Requirement: Refund And Restore
The backend SHALL support refund/reversal and purchase restore flows.

#### Scenario: Provider reports refund
- **WHEN** the payment provider reports a refund
- **THEN** the backend transitions the order, writes compensating ledger entries if needed, and records an audit event

#### Scenario: Client restores purchases
- **WHEN** the client requests purchase restore
- **THEN** the backend returns paid or fulfilled orders and triggers fulfillment for eligible unfulfilled paid orders
